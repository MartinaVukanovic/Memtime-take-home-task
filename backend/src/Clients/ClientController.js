import { throwNotFound } from '../Common/ErrorHandler.js';
import { listOptionsFromQuery, sendPagedList } from '../Common/ListQuery.js';
import { serializeClient, serializeProject } from '../Common/SerializeData.js';
import { listProjectsByClientId } from '../Projects/ProjectStorageService.js';
import { getClientById, listClients } from './ClientStorageService.js';

const notFoundLabel = 'Client';

export async function getClients(req, res) {
  const { items, total } = await listClients(listOptionsFromQuery(req.query));

  return sendPagedList(res, items, serializeClient, total);
}

export async function getClient(req, res) {
  const client = await getClientById(req.params.id);
  if (!client) {
    throwNotFound(notFoundLabel);
  }

  return res.status(200).json(serializeClient(client));
}

export async function getClientProjects(req, res) {
  const client = await getClientById(req.params.id);

  if (!client) {
    throwNotFound(notFoundLabel);
  }

  const { items, total } = await listProjectsByClientId(
    req.params.id,
    listOptionsFromQuery(req.query),
  );

  return sendPagedList(res, items, serializeProject, total);
}
