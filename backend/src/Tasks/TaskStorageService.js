import { collections } from '../Common/Enums.js';
import { buildListFilter, findPage } from '../Common/ListQuery.js';
import { query } from '../Infrastructure/DatabaseService.js';

export async function listTasksByProjectId(projectId, { q, status, sort, skip, limit }) {
  const filter = buildListFilter({
    extra: { projectId },
    q,
    qFields: ['name'],
    status,
  });

  return findPage(collections.tasks, filter, { sort, skip, limit });
}

export async function getTaskById(id) {
  return query(collections.tasks).findOne({ _id: id });
}
