import { throwNotFound } from '../Common/ErrorHandler.js';
import { listOptionsFromQuery, sendPagedList } from '../Common/ListQuery.js';
import { serializeTimeEntry } from '../Common/SerializeData.js';
import {
  createTimeEntry,
  deleteTimeEntry,
  getTimeEntryById,
  listTimeEntries,
  updateTimeEntry,
} from './TimeEntryStorageService.js';

const notFoundLabel = 'Time entry';

export async function getTimeEntries(req, res) {
  const { items, total, totalDurationMinutes } = await listTimeEntries(
    req.userId,
    listOptionsFromQuery(req.query),
  );

  return sendPagedList(res, items, serializeTimeEntry, total, {
    'X-Total-Duration-Minutes': totalDurationMinutes,
  });
}

export async function getTimeEntry(req, res) {
  const entry = await getTimeEntryById(req.params.id, req.userId);
  if (!entry) {
    throwNotFound(notFoundLabel);
  }

  return res.status(200).json(serializeTimeEntry(entry));
}

export async function postTimeEntry(req, res) {
  const entry = await createTimeEntry(req.userId, req.body);

  return res.status(201).json(serializeTimeEntry(entry));
}

export function putTimeEntryMissingId(req, res) {
  return res.status(400).json({ error: 'Time entry ID is required for update' });
}

export async function putTimeEntry(req, res) {
  const entry = await updateTimeEntry(req.params.id, req.userId, req.body);

  return res.status(200).json({
    message: 'Time entry updated successfully',
    ...serializeTimeEntry(entry),
  });
}

export async function removeTimeEntry(req, res) {
  await deleteTimeEntry(req.params.id, req.userId);

  return res.status(200).json({ message: 'Time entry deleted successfully' });
}
