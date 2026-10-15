import { query } from '../Infrastructure/DatabaseService.js';

export const DEFAULT_LIST_LIMIT = 10;
export const MAX_LIST_LIMIT = 100;

export const CLIENT_SORT_FIELDS = ['id', 'name', 'description', 'status', 'createdAt', 'updatedAt'];
export const PROJECT_SORT_FIELDS = ['id', 'clientId', 'name', 'status', 'createdAt', 'updatedAt'];
export const TASK_SORT_FIELDS = ['id', 'parent', 'name', 'status', 'createdAt', 'updatedAt'];
export const TIME_ENTRY_SORT_FIELDS = [
  'id',
  'taskId',
  'userId',
  'comment',
  'start',
  'end',
  'createdAt',
  'updatedAt',
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function mongoSort(sortBy, order) {
  const direction = order === 'desc' ? -1 : 1;
  const field = !sortBy || sortBy === 'createdAt' ? 'createdAt' : sortBy === 'id' ? '_id' : sortBy;

  if (field === '_id') {
    return { _id: direction };
  }

  return { [field]: direction, _id: direction };
}

export function listOptionsFromQuery(query) {
  return {
    q: query.q,
    status: query.status,
    taskId: query.taskId,
    sort: mongoSort(query.sortBy, query.order),
    skip: query.offset,
    limit: query.limit,
  };
}

export function buildListFilter({ extra = {}, q, qFields = [], status } = {}) {
  const filter = { ...extra };

  if (status) {
    filter.status = status;
  }

  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    filter.$or = qFields.map((field) => ({ [field]: pattern }));
  }

  return filter;
}

export async function findPage(collectionName, filter, { sort, skip, limit }) {
  const collection = query(collectionName);
  const [items, total] = await Promise.all([
    collection.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
    collection.countDocuments(filter),
  ]);

  return { items, total };
}

export function sendPagedList(res, items, serialize, total, extraHeaders = {}) {
  res.set('X-Total-Count', String(total));

  for (const [header, value] of Object.entries(extraHeaders)) {
    res.set(header, String(value));
  }

  return res.status(200).json(items.map(serialize));
}
