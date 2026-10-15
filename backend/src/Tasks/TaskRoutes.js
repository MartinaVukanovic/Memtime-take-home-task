import { Router } from 'express';
import { asyncHandler } from '../Common/ErrorHandler.js';
import { resourceIdParamSchema, validateParams } from '../Common/ValidateData.js';
import { getTask } from './TaskController.js';

export const taskRoutes = Router();

taskRoutes.get('/:id', validateParams(resourceIdParamSchema), asyncHandler(getTask));
