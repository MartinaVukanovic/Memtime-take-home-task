import Joi from 'joi';
import { RECORD_STATUSES } from './Enums.js';
import { DEFAULT_LIST_LIMIT, MAX_LIST_LIMIT } from './ListQuery.js';

const VALIDATE_OPTIONS = {
  abortEarly: true,
  convert: true,
  stripUnknown: true,
};

export const resourceIdSchema = Joi.string().trim().uuid({ version: 'uuidv4' });

export const resourceIdParamSchema = Joi.object({
  id: resourceIdSchema.required(),
});

export const statusQuerySchema = Joi.string().valid(...RECORD_STATUSES);

export const timeEntryBodySchema = Joi.object({
  taskId: resourceIdSchema.required(),
  comment: Joi.string().trim().min(1).max(2000).required(),
  start: Joi.date().iso().required(),
  end: Joi.date().iso().greater(Joi.ref('start')).required(),
});

export function listQuerySchema(sortFields, extra = {}) {
  return Joi.object({
    limit: Joi.number().integer().min(1).max(MAX_LIST_LIMIT).default(DEFAULT_LIST_LIMIT),
    offset: Joi.number().integer().min(0).default(0),
    sortBy: Joi.string().valid(...sortFields).optional(),
    order: Joi.string().lowercase().valid('asc', 'desc').default('asc'),
    q: Joi.string().trim().allow('').max(200).optional(),
    ...extra,
  });
}

export function catalogListQuerySchema(sortFields) {
  return listQuerySchema(sortFields, {
    status: statusQuerySchema.optional(),
  });
}

export function parseResourceId(value) {
  const { error, value: id } = resourceIdSchema.validate(value);

  if (error) {
    return null;
  }

  return id;
}

export function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, VALIDATE_OPTIONS);

    if (error) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    req.body = value;
    
    return next();
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, VALIDATE_OPTIONS);

    if (error) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    req.params = value;
    
    return next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, VALIDATE_OPTIONS);

    if (error) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    req.query = value;
    
    return next();
  };
}
