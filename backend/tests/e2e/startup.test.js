import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function spawnNode(script, env, extraArgs = []) {
  return spawn(process.execPath, extraArgs.concat(script), {
    cwd: backendRoot,
    env: {
      ...process.env,
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function collect(child, timeoutMs = 20_000) {
  let out = '';
  child.stdout.on('data', (chunk) => {
    out += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    out += chunk.toString();
  });

  const timeout = setTimeout(() => {
    child.kill('SIGKILL');
  }, timeoutMs);

  try {
    const [code] = await once(child, 'exit');

    return { code, out };
  } finally {
    clearTimeout(timeout);
  }
}

describe('startup and seed CLI e2e', () => {
  it('index.js fails closed without env and seed CLI succeeds', async () => {
    const missing = spawnNode('index.js', {
      API_KEY: '',
      MONGO_URL: '',
      MONGODB_PASSWORD: '',
      RATE_LIMIT_ENABLED: 'false',
    });
    const missingResult = await collect(missing, 8_000);
    assert.equal(missingResult.code, 1);

    const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    try {
      const env = {
        API_KEY: 'e2e-key',
        MONGO_URL: mongo.getUri(),
        DATABASE_NAME: 'memtime_e2e',
        RATE_LIMIT_ENABLED: 'false',
        HOST: '127.0.0.1',
        PORT: '34567',
      };

      const seed = spawnNode('scripts/SeedDatabase.js', env, ['-r', 'dotenv/config']);
      const seedResult = await collect(seed, 30_000);
      assert.equal(seedResult.code, 0);
      assert.match(seedResult.out, /SeedDatabaseSuccess/);
    } finally {
      await mongo.stop({ doCleanup: true, force: true });
    }
  });
});
