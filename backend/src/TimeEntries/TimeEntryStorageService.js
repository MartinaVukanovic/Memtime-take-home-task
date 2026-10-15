import { v4 as uuidv4 } from 'uuid';
import { collections } from '../Common/Enums.js';
import { HttpError, throwNotFound } from '../Common/ErrorHandler.js';
import { buildListFilter, findPage } from '../Common/ListQuery.js';
import { query, withTransaction } from '../Infrastructure/DatabaseService.js';

const notFoundLabel = 'Time entry';

async function totalDurationMinutes(collection, filter) {
  const [row] = await collection
    .aggregate([
      { $match: filter },
      {
        $project: {
          minutes: {
            $cond: [
              { $gt: ['$end', '$start'] },
              { $round: [{ $divide: [{ $subtract: ['$end', '$start'] }, 60_000] }, 0] },
              0,
            ],
          },
        },
      },
      { $group: { _id: null, total: { $sum: '$minutes' } } },
    ])
    .toArray();

  return row?.total ?? 0;
}

export async function listTimeEntries(userId, { q, sort, skip, limit, taskId }) {
  const extra = { userId };

  if (taskId) {
    extra.taskId = taskId;
  }

  const filter = buildListFilter({ extra, q, qFields: ['comment'] });
  const [{ items, total }, durationMinutes] = await Promise.all([
    findPage(collections.timeEntries, filter, { sort, skip, limit }),
    totalDurationMinutes(query(collections.timeEntries), filter),
  ]);

  return { items, total, totalDurationMinutes: durationMinutes };
}

export async function getTimeEntryById(id, userId) {
  return query(collections.timeEntries).findOne({ _id: id, userId });
}

export async function createTimeEntry(userId, fields) {
  const now = new Date();
  const doc = {
    _id: uuidv4(),
    taskId: fields.taskId,
    userId,
    comment: fields.comment,
    start: fields.start,
    end: fields.end,
    createdAt: now,
    updatedAt: now,
  };

  await withTransaction(async (session) => {
    await requireTask(fields.taskId, session);
    await query(collections.timeEntries).insertOne(doc, { session });
  });

  return doc;
}

export async function updateTimeEntry(id, userId, fields) {
  let updated;

  await withTransaction(async (session) => {
    await requireTask(fields.taskId, session);

    const result = await query(collections.timeEntries).findOneAndUpdate(
      { _id: id, userId },
      {
        $set: {
          taskId: fields.taskId,
          comment: fields.comment,
          start: fields.start,
          end: fields.end,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after', session },
    );

    updated = result.value;
    if (!updated) {
      throwNotFound(notFoundLabel, { id });
    }
  });

  return updated;
}

export async function deleteTimeEntry(id, userId) {
  const result = await query(collections.timeEntries).findOneAndDelete({ _id: id, userId });
  if (!result.value) {
    throwNotFound(notFoundLabel);
  }
}

async function requireTask(taskId, session) {
  const task = await query(collections.tasks).findOne({ _id: taskId }, { session });
  if (!task) {
    throw new HttpError(400, 'Task not found');
  }
}
