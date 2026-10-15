import { logService } from './LogService.js';

function isSet(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Env names or descriptions logged when startup validation fails. */
export const REQUIRED_ENV_RULES = [
  {
    label: 'API_KEY',
    satisfied: () => isSet(process.env.API_KEY),
  },
  {
    label: 'MONGO_URL or MONGODB_PASSWORD',
    satisfied: () => isSet(process.env.MONGO_URL) || isSet(process.env.MONGODB_PASSWORD),
  },
];

export function getMissingRequiredEnv() {
  return REQUIRED_ENV_RULES.filter((rule) => !rule.satisfied()).map((rule) => rule.label);
}

export function validateRequiredEnv() {
  const missing = getMissingRequiredEnv();

  if (missing.length === 0) {
    return;
  }

  logService.log('StartupAbort', {
    reason: 'Missing required environment variables',
    required: missing,
  });
  process.exit(1);
}
