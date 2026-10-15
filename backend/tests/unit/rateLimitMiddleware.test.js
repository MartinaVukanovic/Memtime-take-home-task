import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { rateLimit, resetRateLimiter } from '../../src/Auth/RateLimitMiddleware.js';
import { config } from '../../src/config.js';
import { redisHooks } from '../../src/Infrastructure/RedisService.js';

const originalRedisHooks = { ...redisHooks };

function mockResponse() {
  const headers = {};

  return {
    headers,
    headersSent: false,
    set(name, value) {
      headers[name] = value;
    },
    status(code) {
      this.statusCode = code;

      return this;
    },
    json(body) {
      this.body = body;

      return this;
    },
  };
}

describe('rateLimit middleware', () => {
  afterEach(() => {
    resetRateLimiter();
    config.rateLimitEnabled = false;
    Object.assign(redisHooks, originalRedisHooks);
  });

  it('skips when rate limiting is disabled', () => {
    config.rateLimitEnabled = false;
    let called = false;
    rateLimit({}, {}, () => {
      called = true;
    });
    assert.equal(called, true);
  });

  it('allows, blocks, caches the limiter, and maps ttl 0 to the window', async () => {
    config.rateLimitEnabled = true;
    config.rateLimitWindowSeconds = 60;
    config.rateLimitMax = 1;
    let remainingTtl = 0;
    redisHooks.getRedis = () => ({
      async eval() {
        return [remainingTtl === 0 ? 1 : 2, remainingTtl];
      },
    });

    const first = mockResponse();
    await new Promise((resolve) => {
      remainingTtl = 0;
      rateLimit({ userId: 'u1' }, first, resolve);
    });
    assert.equal(first.statusCode, undefined);

    const blocked = mockResponse();
    remainingTtl = 1500;
    await new Promise((resolve) => {
      blocked.json = (body) => {
        blocked.body = body;
        resolve();

        return blocked;
      };
      rateLimit({ userId: 'u1' }, blocked, () => {});
    });
    assert.equal(blocked.statusCode, 429);
    assert.equal(blocked.headers['Retry-After'], '2');
  });

  it('returns 503 when redis fails before headers are sent', async () => {
    config.rateLimitEnabled = true;
    redisHooks.getRedis = () => ({
      async eval() {
        throw new Error('redis');
      },
    });
    const res = mockResponse();
    await new Promise((resolve) => {
      res.json = (body) => {
        res.body = body;
        resolve();

        return res;
      };
      rateLimit({ userId: 'u', originalUrl: '/api' }, res, () => {});
    });
    assert.equal(res.statusCode, 503);
    assert.deepEqual(res.body, { error: 'Service unavailable' });
  });

  it('swallows redis errors after headers are sent', async () => {
    config.rateLimitEnabled = true;
    redisHooks.getRedis = () => ({
      async eval() {
        throw new Error('redis');
      },
    });
    const res = mockResponse();
    res.headersSent = true;
    await new Promise((resolve) => {
      rateLimit({ userId: 'u', path: '/api' }, res, () => {});
      setTimeout(resolve, 10);
    });
    assert.equal(res.statusCode, undefined);
  });
});
