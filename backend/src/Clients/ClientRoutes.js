import { Router } from 'express';
import { asyncHandler } from '../Common/ErrorHandler.js';
import { CLIENT_SORT_FIELDS, PROJECT_SORT_FIELDS } from '../Common/ListQuery.js';
import {
  catalogListQuerySchema,
  resourceIdParamSchema,
  validateParams,
  validateQuery,
} from '../Common/ValidateData.js';
import { getClient, getClientProjects, getClients } from './ClientController.js';

export const clientRoutes = Router();

clientRoutes.get('/', validateQuery(catalogListQuerySchema(CLIENT_SORT_FIELDS)), asyncHandler(getClients));
clientRoutes.get(
  '/:id/projects',
  validateParams(resourceIdParamSchema),
  validateQuery(catalogListQuerySchema(PROJECT_SORT_FIELDS)),
  asyncHandler(getClientProjects),
);
clientRoutes.get('/:id', validateParams(resourceIdParamSchema), asyncHandler(getClient));
