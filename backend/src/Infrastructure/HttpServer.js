import cors from 'cors';
import express from 'express';
import { createHttpTerminator } from 'http-terminator';
import { config } from '../config.js';
import { authenticate } from '../Auth/ApiKeyAuthMiddleware.js';
import { rateLimit } from '../Auth/RateLimitMiddleware.js';
import { clientRoutes } from '../Clients/ClientRoutes.js';
import { asyncHandler, errorHandler, invalidJsonHandler } from '../Common/ErrorHandler.js';
import { logService } from '../Common/LogService.js';
import { requestLogger } from '../Common/RequestLogMiddleware.js';
import { projectRoutes } from '../Projects/ProjectRoutes.js';
import { taskRoutes } from '../Tasks/TaskRoutes.js';
import { timeEntryRoutes } from '../TimeEntries/TimeEntryRoutes.js';
import { livenessHandler, readinessHandler, setHttpReady } from './HealthRoutes.js';

function createApp() {
  const app = express();
  app.set('json spaces', 2);
  app.use(cors({
    exposedHeaders: [
      'Retry-After',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-Total-Count',
      'X-Total-Duration-Minutes',
    ],
  }));
  app.use(express.json());
  app.use(invalidJsonHandler);
  app.use(requestLogger);

  app.get('/health', livenessHandler);
  app.get('/readiness', asyncHandler(readinessHandler));

  app.use('/api/v1', authenticate);
  app.use('/api/v1', rateLimit);
  app.use('/api/v1/clients', clientRoutes);
  app.use('/api/v1/projects', projectRoutes);
  app.use('/api/v1/tasks', taskRoutes);
  app.use('/api/v1/time-entries', timeEntryRoutes);

  app.use(errorHandler);
  
  return app;
}

export const httpServer = {
  server: null,
  start() {
    const app = createApp();
    setHttpReady(false);
    this.server = app.listen(config.port, config.host, () => {
      setHttpReady(true);
      logService.log('HttpServerListen', { host: config.host, port: config.port });
    });

    this.terminator = createHttpTerminator({
      server: this.server,
      gracefulTerminationTimeout: 30_000,
    });

    return this.server;
  },
  async stop() {
    setHttpReady(false);

    if (this.terminator) {
      try {
        await this.terminator.terminate();
      } catch (error) {
        logService.log('HttpServerStopError', null, error);
      }
      this.terminator = null;
    }

    this.server = null;
  },
  close(callback) {
    if (this.server) {
      this.server.close(callback);
    }
  },
};

export { createApp };
