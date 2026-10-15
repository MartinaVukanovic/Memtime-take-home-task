import { logService } from './LogService.js';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

export function throwNotFound(label, options = {}) {
  const message = options.id ? `${label} #${options.id} not found` : `${label} not found`;

  throw new HttpError(404, message);
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export function invalidJsonHandler(err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  
  return next(err);
}

function requestLogContext(req) {
  if (!req) {
    return undefined;
  }

  return {
    method: req.method,
    path: req.originalUrl || req.path,
  };
}

export function handleControllerError(res, err, req) {
  if (res.headersSent) {
    return;
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }

  logService.log('UnhandledError', requestLogContext(req), err);

  return res.status(500).json({ error: 'Internal Server Error' });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  return handleControllerError(res, err, req);
}
