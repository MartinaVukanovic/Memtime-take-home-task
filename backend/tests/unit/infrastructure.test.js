import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { after, before, describe, it } from 'node:test';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { seedDatabase } from '../../scripts/SeedDatabase.js';
import { config } from '../../src/config.js';
import { collections } from '../../src/Common/Enums.js';
import {
  buildMongoUri,
  closeDatabaseConnection,
  connectToDatabase,
  ensureIndexes,
  isDatabaseReady,
  query,
  withTransaction,
} from '../../src/Infrastructure/DatabaseService.js';
import { httpServer } from '../../src/Infrastructure/HttpServer.js';
import {
  closeRedisConnection,
  connectToRedis,
  createRedisClient,
  getRedis,
  isRedisReady,
  redisClientFactory,
} from '../../src/Infrastructure/RedisService.js';
import { setHttpReady } from '../../src/Infrastructure/HealthRoutes.js';

class FakeRedis extends EventEmitter {
  constructor() {
    super();
    this.quitCalled = false;
    this.pingImpl = async () => 'PONG';
  }

  async ping() {
    return this.pingImpl();
  }

  async quit() {
    this.quitCalled = true;
  }
}

describe('buildMongoUri', () => {
  it('uses MONGO_URL when set', () => {
    const prev = process.env.MONGO_URL;
    process.env.MONGO_URL = 'mongodb://example';
    try {
      assert.equal(buildMongoUri(), 'mongodb://example');
    } finally {
      process.env.MONGO_URL = prev;
    }
  });

  it('throws without password when MONGO_URL is unset', () => {
    const prevUrl = process.env.MONGO_URL;
    const prevPassword = process.env.MONGODB_PASSWORD;
    delete process.env.MONGO_URL;
    delete process.env.MONGODB_PASSWORD;
    try {
      assert.throws(() => buildMongoUri(), /MONGODB_PASSWORD is required/);
      process.env.MONGODB_PASSWORD = '   ';
      assert.throws(() => buildMongoUri(), /MONGODB_PASSWORD is required/);
    } finally {
      if (prevUrl !== undefined) {
        process.env.MONGO_URL = prevUrl;
      }
      if (prevPassword !== undefined) {
        process.env.MONGODB_PASSWORD = prevPassword;
      }
    }
  });

  it('builds an srv URI with encoded password', () => {
    const prevUrl = process.env.MONGO_URL;
    const prevPassword = process.env.MONGODB_PASSWORD;
    const prevUser = process.env.MONGODB_USER;
    const prevHost = process.env.MONGODB_HOST;
    const prevDb = process.env.DATABASE_NAME;
    delete process.env.MONGO_URL;
    process.env.MONGODB_PASSWORD = 'p@ss';
    delete process.env.MONGODB_USER;
    delete process.env.MONGODB_HOST;
    delete process.env.DATABASE_NAME;
    try {
      const uri = buildMongoUri();
      assert.match(uri, /mongodb\+srv:\/\/memtime_app:p%40ss@memtime\.hjedswt\.mongodb\.net\/memtime/);
    } finally {
      if (prevUrl !== undefined) {
        process.env.MONGO_URL = prevUrl;
      }
      process.env.MONGODB_PASSWORD = prevPassword;
      if (prevUser !== undefined) {
        process.env.MONGODB_USER = prevUser;
      }
      if (prevHost !== undefined) {
        process.env.MONGODB_HOST = prevHost;
      }
      if (prevDb !== undefined) {
        process.env.DATABASE_NAME = prevDb;
      }
    }
  });

  it('builds an srv URI with custom user host and database', () => {
    const prevUrl = process.env.MONGO_URL;
    const prevPassword = process.env.MONGODB_PASSWORD;
    const prevUser = process.env.MONGODB_USER;
    const prevHost = process.env.MONGODB_HOST;
    const prevDb = process.env.DATABASE_NAME;
    delete process.env.MONGO_URL;
    process.env.MONGODB_PASSWORD = 'pw';
    process.env.MONGODB_USER = 'app';
    process.env.MONGODB_HOST = 'example.net';
    process.env.DATABASE_NAME = 'other';
    try {
      const uri = buildMongoUri();
      assert.match(uri, /mongodb\+srv:\/\/app:pw@example\.net\/other/);
    } finally {
      if (prevUrl !== undefined) {
        process.env.MONGO_URL = prevUrl;
      }
      process.env.MONGODB_PASSWORD = prevPassword;
      if (prevUser !== undefined) {
        process.env.MONGODB_USER = prevUser;
      }
      if (prevHost !== undefined) {
        process.env.MONGODB_HOST = prevHost;
      }
      if (prevDb !== undefined) {
        process.env.DATABASE_NAME = prevDb;
      }
    }
  });
});

describe('DatabaseService guards', () => {
  it('query, withTransaction, and readiness fail when disconnected', async () => {
    await closeDatabaseConnection();
    assert.throws(() => query(collections.clients), /Database not connected/);
    await assert.rejects(() => withTransaction(async () => {}), /Database not connected/);
    assert.equal(await isDatabaseReady(), false);
    await closeDatabaseConnection();
  });
});

describe('DatabaseService with memory MongoDB', () => {
  let mongo;

  before(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    process.env.MONGO_URL = mongo.getUri();
    process.env.DATABASE_NAME = 'memtime_infra_test';
    await connectToDatabase(mongo.getUri());
  });

  after(async () => {
    await closeDatabaseConnection();
    if (mongo) {
      await mongo.stop({ doCleanup: true, force: true });
    }
  });

  it('connectToDatabase uses buildMongoUri when no argument is passed', async () => {
    await closeDatabaseConnection();
    await connectToDatabase();
    await connectToDatabase();
    assert.equal(await isDatabaseReady(), true);
  });

  it('drops leftover indexes and ignores already-missing drops', async () => {
    await seedDatabase({ clientCount: 1, projectsPerClient: 1, tasksPerProject: 1 });
    const nativeDb = query(collections.clients).s.db;
    const originalCollection = nativeDb.collection.bind(nativeDb);

    await query(collections.clients).createIndex({ leftover: 1 }, { name: 'leftover_1' });
    await ensureIndexes();
    const names = (await query(collections.clients).indexes()).map((index) => index.name);
    assert.equal(names.includes('leftover_1'), false);

    function patchClients(overrides) {
      nativeDb.collection = (name) => {
        const collection = originalCollection(name);
        if (name === collections.clients) {
          return Object.assign(collection, overrides);
        }

        return collection;
      };
    }

    await query(collections.clients).createIndex({ leftover: 1 }, { name: 'leftover_1' });
    patchClients({
      dropIndex: async () => {
        const error = new Error('gone');
        error.code = 27;

        throw error;
      },
    });
    await ensureIndexes();

    await query(collections.clients).createIndex({ leftover: 1 }, { name: 'leftover_1' });
    patchClients({
      dropIndex: async () => {
        const error = new Error('ns');
        error.code = 26;

        throw error;
      },
    });
    await ensureIndexes();

    patchClients({
      indexes: async () => {
        const error = new Error('ns');
        error.codeName = 'NamespaceNotFound';

        throw error;
      },
    });
    await ensureIndexes();

    patchClients({
      indexes: async () => {
        const error = new Error('ns');
        error.code = 26;

        throw error;
      },
    });
    await ensureIndexes();

    patchClients({
      indexes: async () => {
        throw new Error('unexpected');
      },
    });
    await assert.rejects(() => ensureIndexes(), /unexpected/);

    nativeDb.collection = originalCollection;
    await query(collections.clients).createIndex({ leftover: 1 }, { name: 'leftover_1' });
    patchClients({
      dropIndex: async () => {
        const error = new Error('gone');
        error.codeName = 'IndexNotFound';

        throw error;
      },
    });
    await ensureIndexes();

    nativeDb.collection = originalCollection;
    await query(collections.clients).createIndex({ leftover: 1 }, { name: 'leftover_1' });
    patchClients({
      dropIndex: async () => {
        const error = new Error('denied');
        error.code = 13;

        throw error;
      },
    });
    await assert.rejects(() => ensureIndexes(), /denied/);
    nativeDb.collection = originalCollection;
    await ensureIndexes();
  });

  it('isDatabaseReady is false when ping is not ok', async () => {
    const dbHandle = query(collections.clients).s.db;
    const originalCommand = dbHandle.command.bind(dbHandle);
    dbHandle.command = async () => ({ ok: 0 });
    try {
      assert.equal(await isDatabaseReady(), false);
    } finally {
      dbHandle.command = originalCommand;
    }
  });

  it('isDatabaseReady catches ping failures', async () => {
    const dbHandle = query(collections.clients).s.db;
    const originalCommand = dbHandle.command.bind(dbHandle);
    dbHandle.command = async () => {
      throw new Error('ping fail');
    };
    try {
      assert.equal(await isDatabaseReady(), false);
    } finally {
      dbHandle.command = originalCommand;
    }
  });

  it('runs a transaction', async () => {
    await withTransaction(async () => 7);
  });
});

describe('RedisService', () => {
  after(async () => {
    await closeRedisConnection();
  });

  it('covers factory, connect cache, readiness, errors, and getRedis', async () => {
    const factoryOriginal = redisClientFactory.create;
    const fake = new FakeRedis();
    redisClientFactory.create = (_url, options) => {
      if (options?.retryStrategy) {
        assert.equal(options.retryStrategy(), null);
      }

      return fake;
    };

    try {
      await closeRedisConnection();
      assert.equal(await isRedisReady(), false);
      assert.throws(() => getRedis(), /Redis not connected/);

      const connected = await connectToRedis('redis://example');
      assert.equal(connected, fake);
      assert.equal(await connectToRedis(), fake);
      assert.equal(getRedis(), fake);
      assert.equal(await isRedisReady(), true);

      fake.pingImpl = async () => 'NO';
      assert.equal(await isRedisReady(), false);
      fake.pingImpl = async () => {
        throw new Error('down');
      };
      assert.equal(await isRedisReady(), false);
      fake.emit('error', new Error('socket'));

      await closeRedisConnection();
      assert.equal(fake.quitCalled, true);
      await closeRedisConnection();
    } finally {
      redisClientFactory.create = factoryOriginal;
    }

    const lazy = createRedisClient('redis://127.0.0.1:6379', {
      lazyConnect: true,
      enableReadyCheck: false,
      maxRetriesPerRequest: 1,
    });
    lazy.disconnect();
  });
});

describe('HttpServer lifecycle', () => {
  it('starts, closes, and stops the listener', async () => {
    const previousPort = config.port;
    const previousHost = config.host;
    config.port = 0;
    config.host = '127.0.0.1';
    try {
      await httpServer.stop();
      httpServer.start();
      await new Promise((resolve) => {
        if (httpServer.server.listening) {
          resolve();

          return;
        }
        httpServer.server.once('listening', resolve);
      });
      await httpServer.stop();
      httpServer.start();
      await new Promise((resolve) => {
        if (httpServer.server.listening) {
          resolve();

          return;
        }
        httpServer.server.once('listening', resolve);
      });
      await new Promise((resolve) => {
        httpServer.close(resolve);
      });
      httpServer.server = httpServer.server;
      await httpServer.stop();
      httpServer.terminator = {
        terminate: async () => {
          throw new Error('already closed');
        },
      };
      await httpServer.stop();
      httpServer.close();
      setHttpReady(false);
    } finally {
      config.port = previousPort;
      config.host = previousHost;
    }
  });
});
