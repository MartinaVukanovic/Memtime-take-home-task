export function parseNumber(value, fallback) {
  return Number(value) || fallback;
}

export const config = {
  host: process.env.HOST || '127.0.0.1',
  port: parseNumber(process.env.PORT, 3000),
  databaseName: process.env.DATABASE_NAME || 'memtime',
  apiKey: process.env.API_KEY,
  rateLimitEnabled: process.env.RATE_LIMIT_ENABLED === 'true',
  redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  rateLimitWindowSeconds: parseNumber(process.env.RATE_LIMIT_WINDOW_SECONDS, 60),
  rateLimitMax: parseNumber(process.env.RATE_LIMIT_MAX, 15),
};
