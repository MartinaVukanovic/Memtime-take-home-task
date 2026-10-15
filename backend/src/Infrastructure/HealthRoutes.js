import { config } from '../config.js';
import * as DatabaseService from './DatabaseService.js';
import * as RedisService from './RedisService.js';

let httpReady = false;

export function setHttpReady(ready) {
  httpReady = ready;
}

export function livenessHandler(req, res) {
  res.status(200).send("I'm alive!");
}

export async function readinessHandler(req, res) {
  const checks = {
    http: httpReady,
    mongodb: await DatabaseService.databaseHooks.isDatabaseReady(),
  };

  if (config.rateLimitEnabled) {
    checks.redis = await RedisService.redisHooks.isRedisReady();
  }

  const ready =
    checks.http &&
    checks.mongodb &&
    (!config.rateLimitEnabled || checks.redis === true);

  if (!ready) {
    return res.status(503).json({
      status: 'Not Ready',
      checks,
    });
  }

  return res.status(200).json({
    status: 'Ready',
    checks,
  });
}
