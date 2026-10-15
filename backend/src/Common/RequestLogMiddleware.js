import { logger } from './LogService.js';

export function requestLogger(req, res, next) {
  const startedAt = Date.now();

  res.on('finish', () => {
    logger.info({
      msg: 'HttpRequest',
      method: req.method,
      path: req.originalUrl || req.path,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  return next();
}
