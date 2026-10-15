import { throwNotFound } from '../Common/ErrorHandler.js';
import { listOptionsFromQuery, sendPagedList } from '../Common/ListQuery.js';
import { serializeProject, serializeTask } from '../Common/SerializeData.js';
import { listTasksByProjectId } from '../Tasks/TaskStorageService.js';
import { getProjectById } from './ProjectStorageService.js';

const notFoundLabel = 'Project';

export async function getProject(req, res) {
  const project = await getProjectById(req.params.id);
  if (!project) {
    throwNotFound(notFoundLabel);
  }

  return res.status(200).json(serializeProject(project));
}

export async function getProjectTasks(req, res) {
  const project = await getProjectById(req.params.id);
  if (!project) {
    throwNotFound(notFoundLabel);
  }

  const { items, total } = await listTasksByProjectId(req.params.id, listOptionsFromQuery(req.query));

  return sendPagedList(res, items, serializeTask, total);
}
