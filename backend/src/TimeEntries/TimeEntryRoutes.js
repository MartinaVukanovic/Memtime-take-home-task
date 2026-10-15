import { Router } from 'express';
import { asyncHandler } from '../Common/ErrorHandler.js';
import { TIME_ENTRY_SORT_FIELDS } from '../Common/ListQuery.js';
import {
  listQuerySchema,
  resourceIdParamSchema,
  resourceIdSchema,
  timeEntryBodySchema,
  validateBody,
  validateParams,
  validateQuery,
} from '../Common/ValidateData.js';
import {
  getTimeEntries,
  getTimeEntry,
  postTimeEntry,
  putTimeEntry,
  putTimeEntryMissingId,
  removeTimeEntry,
} from './TimeEntryController.js';

export const timeEntryRoutes = Router();

timeEntryRoutes.get(
  '/',
  validateQuery(listQuerySchema(TIME_ENTRY_SORT_FIELDS, { taskId: resourceIdSchema.optional() })),
  asyncHandler(getTimeEntries),
);
timeEntryRoutes.post('/', validateBody(timeEntryBodySchema), asyncHandler(postTimeEntry));
timeEntryRoutes.put('/', putTimeEntryMissingId);
timeEntryRoutes.get('/:id', validateParams(resourceIdParamSchema), asyncHandler(getTimeEntry));
timeEntryRoutes.put(
  '/:id',
  validateParams(resourceIdParamSchema),
  validateBody(timeEntryBodySchema),
  asyncHandler(putTimeEntry),
);
timeEntryRoutes.delete('/:id', validateParams(resourceIdParamSchema), asyncHandler(removeTimeEntry));
