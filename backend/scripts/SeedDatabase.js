import { fileURLToPath } from 'node:url';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../src/config.js';
import { RECORD_STATUSES, collections } from '../src/Common/Enums.js';
import { logService } from '../src/Common/LogService.js';
import { validateRequiredEnv } from '../src/Common/RequiredEnv.js';
import * as DatabaseService from '../src/Infrastructure/DatabaseService.js';

/**
 * Compound indexes aligned with list filters + default sort `{ createdAt, _id }`
 * (Equality → Sort). Point lookups use `_id`. Case-insensitive `q` regex cannot
 * use these indexes as a range scan.
 */
export const COLLECTION_INDEXES = {
  [collections.clients]: [
    { name: 'createdAt_1__id_1', key: { createdAt: 1, _id: 1 } },
    { name: 'status_1_createdAt_1__id_1', key: { status: 1, createdAt: 1, _id: 1 } },
  ],
  [collections.projects]: [
    { name: 'clientId_1_createdAt_1__id_1', key: { clientId: 1, createdAt: 1, _id: 1 } },
    { name: 'clientId_1_status_1_createdAt_1__id_1', key: { clientId: 1, status: 1, createdAt: 1, _id: 1 } },
  ],
  [collections.tasks]: [
    { name: 'projectId_1_createdAt_1__id_1', key: { projectId: 1, createdAt: 1, _id: 1 } },
    { name: 'projectId_1_status_1_createdAt_1__id_1', key: { projectId: 1, status: 1, createdAt: 1, _id: 1 } },
  ],
  [collections.timeEntries]: [
    { name: 'userId_1_createdAt_1__id_1', key: { userId: 1, createdAt: 1, _id: 1 } },
    { name: 'userId_1_taskId_1_createdAt_1__id_1', key: { userId: 1, taskId: 1, createdAt: 1, _id: 1 } },
  ],
};

export const DEFAULT_CLIENT_COUNT = 60;
export const DEFAULT_PROJECTS_PER_CLIENT = 3;
export const DEFAULT_TASKS_PER_PROJECT = 4;

/** First six seeded clients get one of each status; client 1 stays active (Acme Corp tests). */
const CLIENT_STATUS_BY_INDEX = {
  1: 'active',
  2: 'urgent',
  3: 'attention',
  4: 'draft',
  5: 'pending',
  6: 'archived',
};

function isoAt(baseYear, dayOffset, hour = 10, minute = 0) {
  const date = new Date(Date.UTC(baseYear, 0, 1, hour, minute, 0, 0));
  date.setUTCDate(date.getUTCDate() + dayOffset);
  
  return date;
}

function clientStatus(clientIndex) {
  if (CLIENT_STATUS_BY_INDEX[clientIndex]) {
    return CLIENT_STATUS_BY_INDEX[clientIndex];
  }

  return RECORD_STATUSES[(clientIndex - 1) % RECORD_STATUSES.length];
}

function pickStatus(index) {
  return RECORD_STATUSES[(index - 1) % RECORD_STATUSES.length];
}

function buildClient(clientIndex, options) {
  const createdAt = isoAt(2024, clientIndex * 2);
  const updatedAt = isoAt(2024, clientIndex * 2 + 1, 14, 30);
  const name = options.useSampleNames && clientIndex === 1 ? 'Acme Corp' : `Client ${clientIndex}`;
  const description =
    options.useSampleNames && clientIndex === 1
      ? 'Leading supplier'
      : `Client description for ${name}`;

  return {
    _id: uuidv4(),
    name,
    description,
    status: clientStatus(clientIndex),
    createdAt,
    updatedAt,
  };
}

function buildProject(clientId, clientIndex, projectIndex) {
  const seedKey = clientIndex * 10 + projectIndex;
  const createdAt = isoAt(2024, seedKey * 3);
  const updatedAt = isoAt(2024, seedKey * 3 + 2, 11, 15);
  const name =
    clientIndex === 1 && projectIndex === 1
      ? 'Website Redesign'
      : clientIndex === 1 && projectIndex === 2
        ? 'Mobile App'
        : `Project ${projectIndex} for Client ${clientIndex}`;

  return {
    _id: uuidv4(),
    clientId,
    name,
    status: pickStatus(seedKey),
    createdAt,
    updatedAt,
  };
}

function buildTask(projectId, projectSeedKey, taskIndex) {
  const createdAt = isoAt(2024, projectSeedKey * 4 + taskIndex);
  const updatedAt = isoAt(2024, projectSeedKey * 4 + taskIndex + 1, 16, 0);
  const name =
    projectSeedKey === 11 && taskIndex === 1
      ? 'Design mockups'
      : projectSeedKey === 11 && taskIndex === 2
        ? 'Implement homepage'
        : `Task ${taskIndex}`;

  return {
    _id: uuidv4(),
    projectId,
    parent: 0,
    name,
    status: pickStatus(projectSeedKey + taskIndex),
    createdAt,
    updatedAt,
  };
}

function buildTimeEntry(taskId, userId) {
  const createdAt = new Date('2024-01-15T17:05:00.000Z');

  return {
    _id: uuidv4(),
    taskId,
    userId,
    comment: 'Worked on feature development',
    start: new Date('2024-01-15T09:00:00.000Z'),
    end: new Date('2024-01-15T17:00:00.000Z'),
    createdAt,
    updatedAt: createdAt,
  };
}

function generateSeedDocuments({ clientCount, projectsPerClient, tasksPerProject, useSampleNames }) {
  const sampleNames = useSampleNames ?? clientCount <= 2;

  const clients = [];
  const projects = [];
  const tasks = [];

  for (let clientIndex = 1; clientIndex <= clientCount; clientIndex += 1) {
    const client = buildClient(clientIndex, { useSampleNames: sampleNames });
    clients.push(client);

    for (let projectIndex = 1; projectIndex <= projectsPerClient; projectIndex += 1) {
      const projectSeedKey = clientIndex * 10 + projectIndex;
      const project = buildProject(client._id, clientIndex, projectIndex);
      projects.push(project);

      for (let taskIndex = 1; taskIndex <= tasksPerProject; taskIndex += 1) {
        tasks.push(buildTask(project._id, projectSeedKey, taskIndex));
      }
    }
  }

  return {
    clients,
    projects,
    tasks,
    counts: {
      clients: clients.length,
      projects: projects.length,
      tasks: tasks.length,
    },
  };
}

export async function seedDatabase(options = {}) {
  const {
    clientCount = DEFAULT_CLIENT_COUNT,
    projectsPerClient = DEFAULT_PROJECTS_PER_CLIENT,
    tasksPerProject = DEFAULT_TASKS_PER_PROJECT,
    includeTimeEntries = false,
    userId,
    useSampleNames,
  } = options;

  const { clients, projects, tasks, counts } = generateSeedDocuments({
    clientCount,
    projectsPerClient,
    tasksPerProject,
    useSampleNames,
  });

  await DatabaseService.databaseHooks.clearAllCollections();
  await DatabaseService.databaseHooks.ensureIndexes();

  if (clients.length > 0) {
    await DatabaseService.databaseHooks.query(collections.clients).insertMany(clients);
  }
  if (projects.length > 0) {
    await DatabaseService.databaseHooks.query(collections.projects).insertMany(projects);
  }
  if (tasks.length > 0) {
    await DatabaseService.databaseHooks.query(collections.tasks).insertMany(tasks);
  }

  let timeEntryCount = 0;
  if (includeTimeEntries && userId && tasks.length > 0) {
    const sampleEntries = [
      buildTimeEntry(tasks[0]._id, userId),
      buildTimeEntry((tasks[1] ?? tasks[0])._id, userId),
    ];

    await DatabaseService.databaseHooks.query(collections.timeEntries).insertMany(sampleEntries);
    timeEntryCount = sampleEntries.length;
  }

  return {
    ...counts,
    timeEntries: timeEntryCount,
  };
}

export async function runSeedCli() {
  try {
    logService.log('SeedDatabaseStart', { databaseName: config.databaseName });
    validateRequiredEnv();
    await DatabaseService.databaseHooks.connectToDatabase();

    const counts = await seedDatabase({
      clientCount: DEFAULT_CLIENT_COUNT,
      projectsPerClient: DEFAULT_PROJECTS_PER_CLIENT,
      tasksPerProject: DEFAULT_TASKS_PER_PROJECT,
      includeTimeEntries: true,
      userId: config.apiKey,
    });

    logService.log('SeedDatabaseSuccess', {
      databaseName: config.databaseName,
      clients: counts.clients,
      projects: counts.projects,
      tasks: counts.tasks,
      timeEntries: counts.timeEntries,
    });

    await DatabaseService.databaseHooks.closeDatabaseConnection();
    process.exit(0);
  } catch (error) {
    logService.log('SeedDatabaseFailed', { databaseName: config.databaseName }, error);
    await DatabaseService.databaseHooks.closeDatabaseConnection().catch(() => {});
    process.exit(1);
  }
}

export function shouldRunSeedCli(argv1 = process.argv[1], moduleUrl = import.meta.url) {
  return argv1 === fileURLToPath(moduleUrl);
}

export function startSeedCliIfNeeded(run = shouldRunSeedCli()) {
  if (run) {
    // Do not top-level-await here: connectToDatabase → ensureIndexes imports this
    // module, which would deadlock while evaluation waits on runSeedCli().
    void runSeedCli();
  }
}

startSeedCliIfNeeded();
