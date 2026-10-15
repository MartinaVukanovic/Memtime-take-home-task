import { isNil, isObject } from 'lodash-es';
import pino from 'pino';

const SENSITIVE_KEY_PATTERN = new RegExp(
  '(password|secret|token|api[_-]?key|authorization|bearer|credential|'
  + 'mongo[_-]?url|redis[_-]?url|connection[_-]?string|user[_-]?id)',
  'i',
);

const REDACTED = '[redacted]';

function sanitizeValue(key, value) {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return REDACTED;
  }

  if (typeof value === 'string') {
    if (value.startsWith('mongodb') || value.startsWith('redis://') || value.startsWith('rediss://')) {
      return REDACTED;
    }

    if (/^Bearer\s+/i.test(value)) {
      return REDACTED;
    }
  }

  return value;
}

function sanitizeData(data) {
  if (!isObject(data)) {
    return isNil(data) ? undefined : data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => (isObject(item) ? sanitizeData(item) : item));
  }

  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (isObject(value)) {
        return [key, sanitizeData(value)];
      }

      return [key, sanitizeValue(key, value)];
    }),
  );
}

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'authorization',
      'headers.authorization',
      'req.headers.authorization',
    ],
    remove: true,
  },
});

class LogService {

  log(message, data, error) {
    const payload = data ? sanitizeData(data) : undefined;

    if (error) {
      logger.error({
        msg: message,
        ...(payload ? { data: payload } : {}),
        err: error,
      });
    } else {
      logger.info({
        msg: message,
        ...(payload ? { data: payload } : {}),
      });
    }
  }

}

export const logService = new LogService();
export { logger };
