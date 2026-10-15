import Redis from 'ioredis';
import { config } from '../config.js';
import { logService } from '../Common/LogService.js';

let client;

export const redisClientFactory = {
  create(url, options) {
    return new Redis(url, options);
  },
};

export function createRedisClient(url, options) {
  return redisClientFactory.create(url, options);
}

export async function connectToRedis(url = config.redisUrl) {
  if (client) {
    return client;
  }

  client = redisClientFactory.create(url, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    connectTimeout: 1000,
    retryStrategy: () => null,
  });

  client.on('error', (error) => {
    logService.log('RedisClientError', null, error);
  });

  await client.ping();
  logService.log('RedisConnect');

  return client;
}

export function getRedis() {
  if (!client) {
    throw new Error('Redis not connected. Call connectToRedis() first.');
  }
  
  return client;
}

export async function isRedisReady() {
  if (!client) {
    return false;
  }

  try {
    const response = await client.ping();
    
    return response === 'PONG';
  } catch {
    return false;
  }
}

export async function closeRedisConnection() {
  if (client) {
    await client.quit();
    client = undefined;
  }
}

export const redisHooks = {
  createRedisClient,
  connectToRedis,
  getRedis,
  isRedisReady,
  closeRedisConnection,
};
