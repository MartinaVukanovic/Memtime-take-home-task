import { config } from '../config.js';
import { logService } from '../Common/LogService.js';
import * as RedisService from '../Infrastructure/RedisService.js';

const INCREMENT_WINDOW_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
return { current, ttl }
`;

export function createRateLimiter(redis, options = {}) {
  const windowSeconds = options.windowSeconds ?? config.rateLimitWindowSeconds;
  const max = options.max ?? config.rateLimitMax;

  return {
    async hit(key) {
      const result = await redis.eval(INCREMENT_WINDOW_SCRIPT, 1, key, String(windowSeconds));
      const count = Number(result[0]);
      const ttlMs = Number(result[1]);
      const retryAfterSeconds = ttlMs > 0 ? Math.ceil(ttlMs / 1000) : windowSeconds;

      return {
        allowed: count <= max,
        count,
        remaining: Math.max(0, max - count),
        limit: max,
        retryAfterSeconds,
      };
    },
  };
}

let redisLimiter;

function getRedisRateLimiter() {
  if (!redisLimiter) {
    redisLimiter = createRateLimiter(RedisService.redisHooks.getRedis());
  }

  return redisLimiter;
}

export function resetRateLimiter() {
  redisLimiter = undefined;
}

export function rateLimit(req, res, next) {
  if (!config.rateLimitEnabled) {
    return next();
  }

  const limiter = getRedisRateLimiter();
  const key = `rate-limit:${req.userId}`;

  limiter
    .hit(key)
    .then((result) => {
      res.set('X-RateLimit-Limit', String(result.limit));
      res.set('X-RateLimit-Remaining', String(result.remaining));
      res.set('X-RateLimit-Reset', String(result.retryAfterSeconds));

      if (!result.allowed) {
        res.set('Retry-After', String(result.retryAfterSeconds));
        
        return res.status(429).json({ error: 'Too many requests' });
      }

      return next();
    })
    .catch((error) => {
      logService.log('RateLimitError', { path: req.originalUrl || req.path }, error);

      if (res.headersSent) {
        return;
      }

      return res.status(503).json({ error: 'Service unavailable' });
    });
}
