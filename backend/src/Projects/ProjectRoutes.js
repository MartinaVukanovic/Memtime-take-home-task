import { Router } from 'express';
import { asyncHandler } from '../Common/ErrorHandler.js';
import { TASK_SORT_FIELDS } from '../Common/ListQuery.js';
import {
  catalogListQuerySchema,
  resourceIdParamSchema,
  validateParams,
  validateQuery,
} from '../Common/ValidateData.js';
import { getProject, getProjectTasks } from './ProjectController.js';

export const projectRoutes = Router();

projectRoutes.get(
  '/:id/tasks',
  validateParams(resourceIdParamSchema),
  validateQuery(catalogListQuerySchema(TASK_SORT_FIELDS)),
  asyncHandler(getProjectTasks),
);
projectRoutes.get('/:id', validateParams(resourceIdParamSchema), asyncHandler(getProject));
