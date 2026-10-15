import { logService } from './Common/LogService.js';
import { validateRequiredEnv } from './Common/RequiredEnv.js';
import { config } from './config.js';
import * as DatabaseService from './Infrastructure/DatabaseService.js';
import { httpServer } from './Infrastructure/HttpServer.js';
import * as RedisService from './Infrastructure/RedisService.js';

let shuttingDown = false;
let listenersBound = false;

export async function stop(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  let code = exitCode;

  try {
    await httpServer.stop();
    await RedisService.redisHooks.closeRedisConnection();
    await DatabaseService.databaseHooks.closeDatabaseConnection();
  } catch (error) {
    logService.log('ShutdownError', null, error);
    code = 1;
  }

  process.exit(code);
}

export function logProcessFault(message, reason) {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logService.log(message, null, error);
}

export function resetShutdownState() {
  shuttingDown = false;
}

export function resetProcessHandlerState() {
  listenersBound = false;
}

export function onSigint() {
  void stop(0);
}

export function onSigterm() {
  void stop(0);
}

export function onUnhandledRejection(reason) {
  logProcessFault('UnhandledRejection', reason);
  void stop(1);
}

export function onUncaughtException(error) {
  logProcessFault('UncaughtException', error);
  void stop(1);
}

export const processHooks = {
  on(event, handler) {
    process.on(event, handler);
  },
};

export function bindProcessHandlers() {
  if (listenersBound) {
    return;
  }

  listenersBound = true;
  processHooks.on('SIGINT', onSigint);
  processHooks.on('SIGTERM', onSigterm);
  processHooks.on('unhandledRejection', onUnhandledRejection);
  processHooks.on('uncaughtException', onUncaughtException);
}

export async function start() {
  bindProcessHandlers();
  validateRequiredEnv();

  try {
    await DatabaseService.databaseHooks.connectToDatabase();
  } catch (error) {
    logService.log('StartupAbort', { reason: 'Database connection failed' }, error);
    process.exit(1);

    return;
  }

  if (config.rateLimitEnabled) {
    try {
      await RedisService.redisHooks.connectToRedis();
    } catch (error) {
      logService.log('StartupAbort', { reason: 'Redis connection failed' }, error);
      process.exit(1);

      return;
    }
  }

  httpServer.start();
}
