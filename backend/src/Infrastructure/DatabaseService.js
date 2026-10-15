import { MongoClient } from 'mongodb';
import { config } from '../config.js';
import { collections } from '../Common/Enums.js';
import { logService } from '../Common/LogService.js';

let client;
let db;

export function buildMongoUri() {
  if (process.env.MONGO_URL) {
    return process.env.MONGO_URL;
  }

  const password = process.env.MONGODB_PASSWORD;
  if (!password?.trim()) {
    throw new Error('MONGODB_PASSWORD is required when MONGO_URL is not set');
  }

  const user = process.env.MONGODB_USER || 'memtime_app';
  const host = process.env.MONGODB_HOST || 'memtime.hjedswt.mongodb.net';
  const database = process.env.DATABASE_NAME || 'memtime';

  return `mongodb+srv://${user}:${encodeURIComponent(password)}@${host}/${database}?retryWrites=true&w=majority`;
}

const COLLECTION_NAMES = Object.values(collections);

function isMissingNamespace(error) {
  return error.code === 26 || error.codeName === 'NamespaceNotFound';
}

function isMissingIndex(error) {
  return error.code === 27 || error.codeName === 'IndexNotFound';
}

async function dropUnusedIndexes(collectionName, keepNames) {
  let existing;

  try {
    existing = await query(collectionName).indexes();
  } catch (error) {
    if (isMissingNamespace(error)) {
      return;
    }

    throw error;
  }

  await Promise.all(
    existing
      .filter((index) => index.name !== '_id_' && !keepNames.has(index.name))
      .map(async (index) => {
        try {
          await query(collectionName).dropIndex(index.name);
        } catch (error) {
          if (!isMissingIndex(error) && !isMissingNamespace(error)) {
            throw error;
          }
        }
      }),
  );
}

export async function ensureIndexes() {
  const { COLLECTION_INDEXES } = await import('../../scripts/SeedDatabase.js');

  await Promise.all(
    COLLECTION_NAMES.map(async (collectionName) => {
      const specs = COLLECTION_INDEXES[collectionName];
      const keepNames = new Set(specs.map((spec) => spec.name));

      await Promise.all(
        specs.map((spec) => query(collectionName).createIndex(spec.key, { name: spec.name })),
      );
      await dropUnusedIndexes(collectionName, keepNames);
    }),
  );
}

export async function clearAllCollections() {
  await Promise.all(COLLECTION_NAMES.map((collectionName) => query(collectionName).deleteMany({})));
}

export async function connectToDatabase(connectionUri) {
  if (client) {
    await closeDatabaseConnection();
  }

  const uri = connectionUri ?? buildMongoUri();
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(config.databaseName);
  await ensureIndexes();
  logService.log('DatabaseConnect', { databaseName: config.databaseName });
}

export function query(collectionName) {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  
  return db.collection(collectionName);
}

export async function withTransaction(work) {
  if (!client) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }

  return client.withSession(async (session) => session.withTransaction(() => work(session)));
}

export async function isDatabaseReady() {
  if (!db) {
    return false;
  }

  try {
    const result = await db.command({ ping: 1 });
    
    return result.ok === 1;
  } catch {
    return false;
  }
}

export async function closeDatabaseConnection() {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
  }
}

export const databaseHooks = {
  connectToDatabase,
  closeDatabaseConnection,
  isDatabaseReady,
  query,
  ensureIndexes,
  clearAllCollections,
};
