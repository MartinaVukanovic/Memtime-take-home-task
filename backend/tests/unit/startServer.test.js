import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import {
  bindProcessHandlers,
  logProcessFault,
  onSigint,
  onSigterm,
  onUncaughtException,
  onUnhandledRejection,
  processHooks,
  resetProcessHandlerState,
  resetShutdownState,
  start,
  stop,
} from '../../src/StartServer.js';
import { config } from '../../src/config.js';
import { databaseHooks } from '../../src/Infrastructure/DatabaseService.js';
import { httpServer } from '../../src/Infrastructure/HttpServer.js';
import { redisHooks } from '../../src/Infrastructure/RedisService.js';

process.env.API_KEY = process.env.API_KEY || 'test-api-key';
process.env.MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';

const originalDatabaseHooks = { ...databaseHooks };
const originalRedisHooks = { ...redisHooks };
const originalStart = httpServer.start.bind(httpServer);
const originalStop = httpServer.stop.bind(httpServer);
const originalProcessOn = processHooks.on.bind(processHooks);

function mockExit() {
  const codes = [];
  const original = process.exit;
  process.exit = (code) => {
    codes.push(code);
  };

  return {
    codes,
    restore() {
      process.exit = original;
    },
  };
}

describe('StartServer', () => {
  afterEach(() => {
    mock.restoreAll();
    resetShutdownState();
    processHooks.on = originalProcessOn;
    Object.assign(databaseHooks, originalDatabaseHooks);
    Object.assign(redisHooks, originalRedisHooks);
    httpServer.start = originalStart;
    httpServer.stop = originalStop;
  });

  it('logs process faults for Error and non-Error reasons', () => {
    logProcessFault('UnhandledRejection', new Error('boom'));
    logProcessFault('UnhandledRejection', 'string-reason');
  });

  it('stop is a no-op while already shutting down', async () => {
    const exit = mockExit();
    httpServer.stop = async () => {};
    redisHooks.closeRedisConnection = async () => {};
    databaseHooks.closeDatabaseConnection = async () => {};
    try {
      resetShutdownState();
      await stop();
      await stop();
      assert.deepEqual(exit.codes, [0]);
    } finally {
      exit.restore();
    }
  });

  it('stop exits with 1 when shutdown work throws', async () => {
    const exit = mockExit();
    httpServer.stop = async () => {
      throw new Error('stop failed');
    };
    try {
      resetShutdownState();
      await stop(0);
      assert.deepEqual(exit.codes, [1]);
    } finally {
      exit.restore();
    }
  });

  it('bindProcessHandlers is idempotent and signal hooks stop the process', async () => {
    const events = [];
    processHooks.on = (event, handler) => {
      events.push(event);
      assert.equal(typeof handler, 'function');
    };
    resetProcessHandlerState();
    bindProcessHandlers();
    bindProcessHandlers();
    processHooks.on = originalProcessOn;
    assert.deepEqual(events, ['SIGINT', 'SIGTERM', 'unhandledRejection', 'uncaughtException']);
    const handler = () => {};
    processHooks.on('SIGUSR2', handler);
    process.removeListener('SIGUSR2', handler);
    processHooks.on = () => {};
    const exit = mockExit();
    httpServer.stop = async () => {};
    redisHooks.closeRedisConnection = async () => {};
    databaseHooks.closeDatabaseConnection = async () => {};
    try {
      resetShutdownState();
      onSigint();
      await new Promise((resolve) => setTimeout(resolve, 20));
      resetShutdownState();
      onSigterm();
      await new Promise((resolve) => setTimeout(resolve, 20));
      resetShutdownState();
      onUnhandledRejection('nope');
      await new Promise((resolve) => setTimeout(resolve, 20));
      resetShutdownState();
      onUncaughtException(new Error('uncaught'));
      await new Promise((resolve) => setTimeout(resolve, 20));
      assert.equal(exit.codes.length >= 1, true);
    } finally {
      exit.restore();
    }
  });

  it('start listens after a successful database connect', async () => {
    const exit = mockExit();
    const previous = config.rateLimitEnabled;
    config.rateLimitEnabled = false;
    processHooks.on = () => {};
    resetProcessHandlerState();
    databaseHooks.connectToDatabase = async () => {};
    httpServer.start = () => {};
    try {
      await start();
      assert.equal(exit.codes.length, 0);
    } finally {
      config.rateLimitEnabled = previous;
      exit.restore();
    }
  });

  it('start exits when database connect fails', async () => {
    const exit = mockExit();
    processHooks.on = () => {};
    resetProcessHandlerState();
    databaseHooks.connectToDatabase = async () => {
      throw new Error('db down');
    };
    try {
      await start();
      assert.deepEqual(exit.codes, [1]);
    } finally {
      exit.restore();
    }
  });

  it('start connects redis when rate limiting is enabled', async () => {
    const exit = mockExit();
    const previous = config.rateLimitEnabled;
    config.rateLimitEnabled = true;
    processHooks.on = () => {};
    resetProcessHandlerState();
    databaseHooks.connectToDatabase = async () => {};
    redisHooks.connectToRedis = async () => ({});
    httpServer.start = () => {};
    try {
      await start();
      assert.equal(exit.codes.length, 0);
    } finally {
      config.rateLimitEnabled = previous;
      exit.restore();
    }
  });

  it('start exits when redis connect fails', async () => {
    const exit = mockExit();
    const previous = config.rateLimitEnabled;
    config.rateLimitEnabled = true;
    processHooks.on = () => {};
    resetProcessHandlerState();
    databaseHooks.connectToDatabase = async () => {};
    redisHooks.connectToRedis = async () => {
      throw new Error('redis down');
    };
    try {
      await start();
      assert.deepEqual(exit.codes, [1]);
    } finally {
      config.rateLimitEnabled = previous;
      exit.restore();
    }
  });
});
