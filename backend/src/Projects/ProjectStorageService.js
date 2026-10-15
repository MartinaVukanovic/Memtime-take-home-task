import { collections } from '../Common/Enums.js';
import { buildListFilter, findPage } from '../Common/ListQuery.js';
import { query } from '../Infrastructure/DatabaseService.js';

export async function listProjectsByClientId(clientId, { q, status, sort, skip, limit }) {
  const filter = buildListFilter({
    extra: { clientId },
    q,
    qFields: ['name'],
    status,
  });

  return findPage(collections.projects, filter, { sort, skip, limit });
}

export async function getProjectById(id) {
  return query(collections.projects).findOne({ _id: id });
}
