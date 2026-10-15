import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import {
  DEFAULT_CLIENT_COUNT,
  DEFAULT_PROJECTS_PER_CLIENT,
  DEFAULT_TASKS_PER_PROJECT,
  runSeedCli,
  seedDatabase,
  shouldRunSeedCli,
  startSeedCliIfNeeded,
} from '../scripts/SeedDatabase.js';
import { collections } from '../src/Common/Enums.js';
import { resourceIdSchema } from '../src/Common/ValidateData.js';
import { closeDatabaseConnection, connectToDatabase, databaseHooks, query } from '../src/Infrastructure/DatabaseService.js';
import { redisHooks } from '../src/Infrastructure/RedisService.js';
import { config } from '../src/config.js';
import { setHttpReady } from '../src/Infrastructure/HealthRoutes.js';
import { createApp } from '../src/Infrastructure/HttpServer.js';

const API_KEY = 'test-api-key';
process.env.API_KEY = API_KEY;
process.env.RATE_LIMIT_ENABLED = 'false';

const app = createApp();
const auth = { Authorization: `Bearer ${API_KEY}` };

function assertValidResourceId(id) {
  assert.equal(resourceIdSchema.validate(id).error, undefined);
}

let mongo;

async function loadFixture() {
  const clientsRes = await request(app).get('/api/v1/clients').set(auth);
  const client = clientsRes.body[0];
  const projectsRes = await request(app)
    .get(`/api/v1/clients/${client.id}/projects`)
    .set(auth);
  const project = projectsRes.body[0];
  const tasksRes = await request(app).get(`/api/v1/projects/${project.id}/tasks`).set(auth);
  const task = tasksRes.body[0];
  
  return { client, project, task };
}

describe('Memtime API', () => {
  before(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    process.env.MONGO_URL = mongo.getUri();
    process.env.DATABASE_NAME = 'memtime_test';
    delete process.env.MONGODB_PASSWORD;
    await connectToDatabase();
    setHttpReady(true);
  });

  after(async () => {
    await closeDatabaseConnection();
    if (mongo) {
      await Promise.race([
        mongo.stop({ doCleanup: true, force: true }),
        new Promise((resolve) => {
          setTimeout(resolve, 5000);
        }),
      ]);
    }
  });

  beforeEach(async () => {
    await seedDatabase({
      clientCount: 2,
      projectsPerClient: 2,
      tasksPerProject: 2,
      useSampleNames: true,
    });
  });

  it('GET /health returns a plain-text alive message', async () => {
    const response = await request(app).get('/health');
    assert.equal(response.status, 200);
    assert.equal(response.text, "I'm alive!");
  });

  it('GET /readiness returns 200 when MongoDB is reachable', async () => {
    const response = await request(app).get('/readiness');
    assert.equal(response.status, 200);
    assert.equal(response.body.status, 'Ready');
    assert.equal(response.body.checks.http, true);
    assert.equal(response.body.checks.mongodb, true);
    assert.equal(response.body.checks.redis, undefined);
  });

  it('rejects /api/v1 requests without a valid bearer token', async () => {
    const missing = await request(app).get('/api/v1/clients');
    assert.equal(missing.status, 404);
    assert.deepEqual(missing.body, { error: 'Unknown user' });

    const invalid = await request(app)
      .get('/api/v1/clients')
      .set({ Authorization: 'Bearer wrong-key' });
    assert.equal(invalid.status, 404);
    assert.deepEqual(invalid.body, { error: 'Unknown user' });
  });

  it('GET /api/v1/clients lists clients', async () => {
    const response = await request(app).get('/api/v1/clients').set(auth);
    assert.equal(response.status, 200);
    assert.equal(response.body.length, 2);
    assert.equal(response.headers['x-total-count'], '2');
    assertValidResourceId(response.body[0].id);
    assert.equal(response.body[0].name, 'Acme Corp');
    assert.equal(response.body[0].description, 'Leading supplier');
    assert.equal(response.body[0].status, 'active');
    assert.ok(response.body[0].createdAt);
    assert.ok(response.body[0].updatedAt);
  });

  it('seeds one client per record status when enough clients are created', async () => {
    await seedDatabase({
      clientCount: 6,
      projectsPerClient: 1,
      tasksPerProject: 1,
      useSampleNames: true,
    });

    const response = await request(app).get('/api/v1/clients?limit=100').set(auth);
    assert.equal(response.status, 200);
    const statuses = new Set(response.body.map((client) => client.status));
    assert.ok(statuses.has('active'));
    assert.ok(statuses.has('urgent'));
    assert.ok(statuses.has('attention'));
    assert.ok(statuses.has('draft'));
    assert.ok(statuses.has('pending'));
    assert.ok(statuses.has('archived'));
  });

  it('paginates and searches clients on the server', async () => {
    await seedDatabase({
      clientCount: 12,
      projectsPerClient: 1,
      tasksPerProject: 1,
      useSampleNames: true,
    });

    const page1 = await request(app).get('/api/v1/clients?limit=10&offset=0').set(auth);
    assert.equal(page1.status, 200);
    assert.equal(page1.body.length, 10);
    assert.equal(page1.headers['x-total-count'], '12');

    const page2 = await request(app).get('/api/v1/clients?limit=10&offset=10').set(auth);
    assert.equal(page2.status, 200);
    assert.equal(page2.body.length, 2);
    assert.equal(page2.headers['x-total-count'], '12');

    const search = await request(app).get('/api/v1/clients?q=Acme').set(auth);
    assert.equal(search.status, 200);
    assert.equal(search.body.length, 1);
    assert.equal(search.headers['x-total-count'], '1');
    assert.equal(search.body[0].name, 'Acme Corp');
  });

  it('GET /api/v1/clients/:id returns a client or 404', async () => {
    const { client } = await loadFixture();
    const found = await request(app).get(`/api/v1/clients/${client.id}`).set(auth);
    assert.equal(found.status, 200);
    assert.equal(found.body.name, 'Acme Corp');

    const missing = await request(app)
      .get('/api/v1/clients/00000000-0000-4000-8000-000000000000')
      .set(auth);
    assert.equal(missing.status, 404);
    assert.deepEqual(missing.body, { error: 'Client not found' });
  });

  it('lists zero duration when there are no time entries', async () => {
    const list = await request(app).get('/api/v1/time-entries').set(auth);
    assert.equal(list.status, 200);
    assert.equal(list.body.length, 0);
    assert.equal(list.headers['x-total-duration-minutes'], '0');
  });

  it('GET /api/v1/clients/:id/projects returns projects for a client', async () => {
    const { client } = await loadFixture();
    const response = await request(app).get(`/api/v1/clients/${client.id}/projects`).set(auth);
    assert.equal(response.status, 200);
    assert.equal(response.body.length, 2);
    assert.equal(response.body[0].clientId, client.id);
    assert.equal(response.body[0].name, 'Website Redesign');
    assert.equal('description' in response.body[0], false);

    const search = await request(app)
      .get(`/api/v1/clients/${client.id}/projects?q=Website&status=active`)
      .set(auth);
    assert.equal(search.status, 200);

    const missing = await request(app)
      .get('/api/v1/clients/00000000-0000-4000-8000-000000000000/projects')
      .set(auth);
    assert.equal(missing.status, 404);
    assert.deepEqual(missing.body, { error: 'Client not found' });
  });

  it('GET /api/v1/projects/:id and nested tasks follow client → project → task', async () => {
    const { client, project } = await loadFixture();
    const projectRes = await request(app).get(`/api/v1/projects/${project.id}`).set(auth);
    assert.equal(projectRes.status, 200);
    assert.equal(projectRes.body.clientId, client.id);

    const tasks = await request(app).get(`/api/v1/projects/${project.id}/tasks`).set(auth);
    assert.equal(tasks.status, 200);
    assert.equal(tasks.body.length, 2);
    assert.equal(tasks.body[0].parent, 0);
    assert.equal(tasks.body[0].name, 'Design mockups');
    assert.equal('projectId' in tasks.body[0], false);

    const taskSearch = await request(app)
      .get(`/api/v1/projects/${project.id}/tasks?q=Design&status=active`)
      .set(auth);
    assert.equal(taskSearch.status, 200);

    const missingProject = await request(app)
      .get('/api/v1/projects/00000000-0000-4000-8000-000000000000')
      .set(auth);
    assert.equal(missingProject.status, 404);
    assert.deepEqual(missingProject.body, { error: 'Project not found' });
  });

  it('GET /api/v1/tasks/:id returns a task or 404', async () => {
    const { task } = await loadFixture();
    const found = await request(app).get(`/api/v1/tasks/${task.id}`).set(auth);
    assert.equal(found.status, 200);
    assert.equal(found.body.name, 'Design mockups');

    const missing = await request(app)
      .get('/api/v1/tasks/00000000-0000-4000-8000-000000000000')
      .set(auth);
    assert.equal(missing.status, 404);
    assert.deepEqual(missing.body, { error: 'Task not found' });
  });

  it('creates, reads, updates, and deletes time entries for the authenticated user', async () => {
    const { task } = await loadFixture();

    const created = await request(app)
      .post('/api/v1/time-entries')
      .set(auth)
      .send({
        taskId: task.id,
        comment: 'Worked on feature development',
        start: '2024-01-15T09:00:00Z',
        end: '2024-01-15T17:00:00Z',
      });

    assert.equal(created.status, 201);
    assertValidResourceId(created.body.id);
    assert.equal(created.body.taskId, task.id);
    assert.equal(created.body.userId, API_KEY);
    assert.equal(created.body.comment, 'Worked on feature development');
    assert.equal(created.body.start, '2024-01-15T09:00:00.000Z');
    assert.equal(created.body.end, '2024-01-15T17:00:00.000Z');

    const entryId = created.body.id;

    const list = await request(app).get('/api/v1/time-entries').set(auth);
    assert.equal(list.status, 200);
    assert.equal(list.body.length, 1);
    assert.equal(list.headers['x-total-count'], '1');
    assert.equal(list.headers['x-total-duration-minutes'], '480');

    const one = await request(app).get(`/api/v1/time-entries/${entryId}`).set(auth);
    assert.equal(one.status, 200);
    assert.equal(one.body.id, entryId);

    const updated = await request(app)
      .put(`/api/v1/time-entries/${entryId}`)
      .set(auth)
      .send({
        taskId: task.id,
        comment: 'Updated comment',
        start: '2024-01-15T09:30:00Z',
        end: '2024-01-15T17:30:00Z',
      });

    assert.equal(updated.status, 200);
    assert.equal(updated.body.message, 'Time entry updated successfully');
    assert.equal(updated.body.id, entryId);
    assert.equal(updated.body.taskId, task.id);
    assert.equal(updated.body.comment, 'Updated comment');
    assert.equal(updated.body.start, '2024-01-15T09:30:00.000Z');
    assert.equal(updated.body.end, '2024-01-15T17:30:00.000Z');

    const removed = await request(app).delete(`/api/v1/time-entries/${entryId}`).set(auth);
    assert.equal(removed.status, 200);
    assert.deepEqual(removed.body, { message: 'Time entry deleted successfully' });

    const missing = await request(app).get(`/api/v1/time-entries/${entryId}`).set(auth);
    assert.equal(missing.status, 404);
    assert.deepEqual(missing.body, { error: 'Time entry not found' });
  });

  it('filters and paginates time entries by task and comment', async () => {
    const { task, project } = await loadFixture();
    const otherTaskRes = await request(app).get(`/api/v1/projects/${project.id}/tasks`).set(auth);
    const otherTask = otherTaskRes.body[1];

    await request(app)
      .post('/api/v1/time-entries')
      .set(auth)
      .send({
        taskId: task.id,
        comment: 'Feature work',
        start: '2024-01-15T09:00:00Z',
        end: '2024-01-15T10:00:00Z',
      });
    await request(app)
      .post('/api/v1/time-entries')
      .set(auth)
      .send({
        taskId: task.id,
        comment: 'Review notes',
        start: '2024-01-15T11:00:00Z',
        end: '2024-01-15T12:00:00Z',
      });
    await request(app)
      .post('/api/v1/time-entries')
      .set(auth)
      .send({
        taskId: otherTask.id,
        comment: 'Feature work elsewhere',
        start: '2024-01-15T13:00:00Z',
        end: '2024-01-15T14:00:00Z',
      });

    const byTask = await request(app).get(`/api/v1/time-entries?taskId=${task.id}`).set(auth);
    assert.equal(byTask.status, 200);
    assert.equal(byTask.body.length, 2);
    assert.equal(byTask.headers['x-total-count'], '2');
    assert.equal(byTask.headers['x-total-duration-minutes'], '120');
    assert.ok(byTask.body.every((entry) => entry.taskId === task.id));

    const search = await request(app)
      .get(`/api/v1/time-entries?taskId=${task.id}&q=review`)
      .set(auth);
    assert.equal(search.status, 200);
    assert.equal(search.body.length, 1);
    assert.equal(search.headers['x-total-count'], '1');
    assert.equal(search.body[0].comment, 'Review notes');

    const page = await request(app)
      .get(`/api/v1/time-entries?taskId=${task.id}&limit=1&offset=0&sortBy=comment&order=asc`)
      .set(auth);
    assert.equal(page.body.length, 1);
    assert.equal(page.headers['x-total-count'], '2');
  });

  it('returns documented errors for invalid time-entry bodies and missing ids', async () => {
    const { task } = await loadFixture();

    const invalidJson = await request(app)
      .post('/api/v1/time-entries')
      .set(auth)
      .set('Content-Type', 'application/json')
      .send('{not json');
    assert.equal(invalidJson.status, 400);
    assert.deepEqual(invalidJson.body, { error: 'Invalid JSON body' });

    const missingFields = await request(app)
      .post('/api/v1/time-entries')
      .set(auth)
      .send({ comment: 'incomplete' });
    assert.equal(missingFields.status, 400);
    assert.deepEqual(missingFields.body, { error: 'Invalid JSON body' });

    const updateWithoutId = await request(app)
      .put('/api/v1/time-entries')
      .set(auth)
      .send({
        taskId: task.id,
        comment: 'Updated comment',
        start: '2024-01-15T09:30:00Z',
        end: '2024-01-15T17:30:00Z',
      });
    assert.equal(updateWithoutId.status, 400);
    assert.deepEqual(updateWithoutId.body, { error: 'Time entry ID is required for update' });

    const updateMissing = await request(app)
      .put('/api/v1/time-entries/00000000-0000-4000-8000-000000000000')
      .set(auth)
      .send({
        taskId: task.id,
        comment: 'Updated comment',
        start: '2024-01-15T09:30:00Z',
        end: '2024-01-15T17:30:00Z',
      });
    assert.equal(updateMissing.status, 404);
    assert.deepEqual(updateMissing.body, {
      error: 'Time entry #00000000-0000-4000-8000-000000000000 not found',
    });
  });

  it('rejects invalid path ids, list query params, and time-entry payloads', async () => {
    const { task } = await loadFixture();
    const invalidParam = { error: 'Invalid request parameters' };
    const invalidBody = { error: 'Invalid JSON body' };

    const badClientId = await request(app).get('/api/v1/clients/not-a-uuid').set(auth);
    assert.equal(badClientId.status, 400);
    assert.deepEqual(badClientId.body, invalidParam);

    const badLimit = await request(app).get('/api/v1/clients?limit=0').set(auth);
    assert.equal(badLimit.status, 400);
    assert.deepEqual(badLimit.body, invalidParam);

    const badSort = await request(app).get('/api/v1/clients?sortBy=password').set(auth);
    assert.equal(badSort.status, 400);
    assert.deepEqual(badSort.body, invalidParam);

    const badStatus = await request(app).get('/api/v1/clients?status=bogus').set(auth);
    assert.equal(badStatus.status, 400);
    assert.deepEqual(badStatus.body, invalidParam);

    const byStatus = await request(app).get('/api/v1/clients?status=active').set(auth);
    assert.equal(byStatus.status, 200);
    assert.ok(byStatus.body.every((client) => client.status === 'active'));

    const badTaskId = await request(app)
      .get('/api/v1/time-entries?taskId=not-a-uuid')
      .set(auth);
    assert.equal(badTaskId.status, 400);
    assert.deepEqual(badTaskId.body, invalidParam);

    const emptyComment = await request(app)
      .post('/api/v1/time-entries')
      .set(auth)
      .send({
        taskId: task.id,
        comment: '   ',
        start: '2024-01-15T09:00:00Z',
        end: '2024-01-15T17:00:00Z',
      });
    assert.equal(emptyComment.status, 400);
    assert.deepEqual(emptyComment.body, invalidBody);

    const invertedRange = await request(app)
      .post('/api/v1/time-entries')
      .set(auth)
      .send({
        taskId: task.id,
        comment: 'Backwards interval',
        start: '2024-01-15T17:00:00Z',
        end: '2024-01-15T09:00:00Z',
      });
    assert.equal(invertedRange.status, 400);
    assert.deepEqual(invertedRange.body, invalidBody);

    const missingTask = await request(app)
      .post('/api/v1/time-entries')
      .set(auth)
      .send({
        taskId: '00000000-0000-4000-8000-000000000000',
        comment: 'Unknown task',
        start: '2024-01-15T09:00:00Z',
        end: '2024-01-15T17:00:00Z',
      });
    assert.equal(missingTask.status, 400);
    assert.deepEqual(missingTask.body, { error: 'Task not found' });
  });

  it('sorts by id, returns 404s, and counts inverted intervals as zero minutes', async () => {
    const { project, task } = await loadFixture();
    const byId = await request(app).get('/api/v1/clients?sortBy=id&order=desc').set(auth);
    assert.equal(byId.status, 200);

    const missingTasks = await request(app)
      .get('/api/v1/projects/00000000-0000-4000-8000-000000000000/tasks')
      .set(auth);
    assert.equal(missingTasks.status, 404);

    const missingDelete = await request(app)
      .delete('/api/v1/time-entries/00000000-0000-4000-8000-000000000000')
      .set(auth);
    assert.equal(missingDelete.status, 404);

    await query(collections.timeEntries).insertOne({
      _id: '00000000-0000-4000-8000-000000000099',
      taskId: task.id,
      userId: API_KEY,
      comment: 'inverted',
      start: new Date('2024-01-15T17:00:00.000Z'),
      end: new Date('2024-01-15T09:00:00.000Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const list = await request(app).get('/api/v1/time-entries').set(auth);
    assert.equal(list.headers['x-total-duration-minutes'], '0');
    assert.equal(project.id.length > 0, true);
  });

  it('GET /readiness is 503 when http is not ready or redis is required', async () => {
    setHttpReady(false);
    const notHttp = await request(app).get('/readiness');
    assert.equal(notHttp.status, 503);
    setHttpReady(true);

    const originalIsReady = databaseHooks.isDatabaseReady;
    databaseHooks.isDatabaseReady = async () => false;
    const dbDown = await request(app).get('/readiness');
    databaseHooks.isDatabaseReady = originalIsReady;
    assert.equal(dbDown.status, 503);

    const previous = config.rateLimitEnabled;
    config.rateLimitEnabled = true;
    try {
      const noRedis = await request(app).get('/readiness');
      assert.equal(noRedis.status, 503);
      assert.equal(noRedis.body.checks.redis, false);

      const originalRedisReady = redisHooks.isRedisReady;
      redisHooks.isRedisReady = async () => true;
      const ready = await request(app).get('/readiness');
      redisHooks.isRedisReady = originalRedisReady;
      assert.equal(ready.status, 200);
      assert.equal(ready.body.checks.redis, true);
    } finally {
      config.rateLimitEnabled = previous;
    }
  });

  it('seeds empty catalogs, sample time entries, and CLI success/failure', async () => {
    const empty = await seedDatabase({
      clientCount: 0,
      projectsPerClient: 0,
      tasksPerProject: 0,
    });
    assert.equal(empty.clients, 0);
    assert.equal(empty.timeEntries, 0);

    const withEntries = await seedDatabase({
      clientCount: 1,
      projectsPerClient: 1,
      tasksPerProject: 1,
      includeTimeEntries: true,
      userId: API_KEY,
      useSampleNames: true,
    });
    assert.equal(withEntries.timeEntries, 2);

    const twoTasks = await seedDatabase({
      clientCount: 1,
      projectsPerClient: 1,
      tasksPerProject: 2,
      includeTimeEntries: true,
      userId: API_KEY,
    });
    assert.equal(twoTasks.timeEntries, 2);

    const generic = await seedDatabase({
      clientCount: 7,
      projectsPerClient: 2,
      tasksPerProject: 2,
      useSampleNames: false,
    });
    assert.equal(generic.clients, 7);
    assert.equal(generic.projects, 14);

    const defaults = await seedDatabase({ clientCount: 2, projectsPerClient: 1, tasksPerProject: 1 });
    assert.equal(defaults.clients, 2);
    const inferredNames = await seedDatabase({
      clientCount: 7,
      projectsPerClient: 1,
      tasksPerProject: 1,
    });
    assert.equal(inferredNames.clients, 7);
    const fullDefaults = await seedDatabase();
    assert.equal(fullDefaults.clients, DEFAULT_CLIENT_COUNT);
    assert.equal(fullDefaults.projects, DEFAULT_CLIENT_COUNT * DEFAULT_PROJECTS_PER_CLIENT);
    assert.equal(fullDefaults.tasks, DEFAULT_CLIENT_COUNT * DEFAULT_PROJECTS_PER_CLIENT * DEFAULT_TASKS_PER_PROJECT);
    const noUser = await seedDatabase({
      clientCount: 1,
      projectsPerClient: 1,
      tasksPerProject: 1,
      includeTimeEntries: true,
    });
    assert.equal(noUser.timeEntries, 0);
    const noTasks = await seedDatabase({
      clientCount: 0,
      includeTimeEntries: true,
      userId: API_KEY,
    });
    assert.equal(noTasks.timeEntries, 0);
    assert.equal(shouldRunSeedCli(), false);

    assert.equal(shouldRunSeedCli('other', import.meta.url), false);
    assert.equal(
      shouldRunSeedCli(fileURLToPath(import.meta.url), import.meta.url),
      true,
    );
    startSeedCliIfNeeded(false);

    const originalExit = process.exit;
    const codes = [];
    process.exit = (code) => {
      codes.push(code);
    };
    try {
      await runSeedCli();
      assert.equal(codes[0], 0);
      await connectToDatabase();

      const originalConnect = databaseHooks.connectToDatabase;
      const originalClose = databaseHooks.closeDatabaseConnection;
      databaseHooks.connectToDatabase = async () => {
        throw new Error('cli fail');
      };
      databaseHooks.closeDatabaseConnection = async () => {
        throw new Error('close fail');
      };
      codes.length = 0;
      await runSeedCli();
      startSeedCliIfNeeded(true);
      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });
      databaseHooks.connectToDatabase = originalConnect;
      databaseHooks.closeDatabaseConnection = originalClose;
      assert.equal(codes[0], 1);
      await connectToDatabase();
    } finally {
      process.exit = originalExit;
    }
  });
});
