import { throwNotFound } from '../Common/ErrorHandler.js';
import { serializeTask } from '../Common/SerializeData.js';
import { getTaskById } from './TaskStorageService.js';

const notFoundLabel = 'Task';

export async function getTask(req, res) {
  const task = await getTaskById(req.params.id);
  if (!task) {
    throwNotFound(notFoundLabel);
  }

  return res.status(200).json(serializeTask(task));
}
