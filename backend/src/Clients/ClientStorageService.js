import { collections } from '../Common/Enums.js';
import { buildListFilter, findPage } from '../Common/ListQuery.js';
import { query } from '../Infrastructure/DatabaseService.js';

export async function listClients({ q, status, sort, skip, limit }) {
  const filter = buildListFilter({ q, qFields: ['name', 'description'], status });

  return findPage(collections.clients, filter, { sort, skip, limit });
}

export async function getClientById(id) {
  return query(collections.clients).findOne({ _id: id });
}
