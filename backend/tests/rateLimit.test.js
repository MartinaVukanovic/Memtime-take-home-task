import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createRateLimiter } from '../src/Auth/RateLimitMiddleware.js';

class MemoryRedis {
  constructor() {
    this.store = new Map();
  }

  async eval(_script, _numKeys, key, windowSeconds) {
    const now = Date.now();
    let entry = this.store.get(key);

    if (entry && entry.expiresAt <= now) {
      this.store.delete(key);
      entry = undefined;
    }

    if (!entry) {
      entry = { count: 0, expiresAt: now + Number(windowSeconds) * 1000 };
    }

    entry.count += 1;
    this.store.set(key, entry);

    return [entry.count, Math.max(0, entry.expiresAt - now)];
  }
}

describe('fixed-window Redis rate limiter', () => {
  it('allows up to the window max, then rejects extra hits', async () => {
    const limiter = createRateLimiter(new MemoryRedis(), {
      windowSeconds: 60,
      max: 15,
    });
    const key = 'rate-limit:test-api-key';

    for (let i = 1; i <= 15; i += 1) {
      const result = await limiter.hit(key);
      assert.equal(result.allowed, true);
      assert.equal(result.count, i);
      assert.equal(result.remaining, 15 - i);
    }

    const blocked = await limiter.hit(key);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.count, 16);
    assert.equal(blocked.remaining, 0);
    assert.equal(blocked.limit, 15);
    assert.ok(blocked.retryAfterSeconds > 0);
  });

  it('uses config window and max when options are omitted', async () => {
    const limiter = createRateLimiter(new MemoryRedis());
    const result = await limiter.hit('rate-limit:defaults');
    assert.equal(result.allowed, true);
    assert.equal(result.limit > 0, true);
  });

  it('keys limits independently per API key', async () => {
    const limiter = createRateLimiter(new MemoryRedis(), {
      windowSeconds: 60,
      max: 1,
    });

    const first = await limiter.hit('rate-limit:key-a');
    const second = await limiter.hit('rate-limit:key-b');
    const third = await limiter.hit('rate-limit:key-a');

    assert.equal(first.allowed, true);
    assert.equal(second.allowed, true);
    assert.equal(third.allowed, false);
  });
});
