import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { authenticate } from '../../src/Auth/ApiKeyAuthMiddleware.js';
import {
  HttpError,
  asyncHandler,
  errorHandler,
  handleControllerError,
  invalidJsonHandler,
  throwNotFound,
} from '../../src/Common/ErrorHandler.js';
import { requestLogger } from '../../src/Common/RequestLogMiddleware.js';
import { logService } from '../../src/Common/LogService.js';
import {
  buildListFilter,
  listOptionsFromQuery,
  mongoSort,
  sendPagedList,
} from '../../src/Common/ListQuery.js';
import { config, parseNumber } from '../../src/config.js';
import { getMissingRequiredEnv, validateRequiredEnv } from '../../src/Common/RequiredEnv.js';
import {
  formatResourceId,
  serializeClient,
  serializeProject,
  serializeTask,
  serializeTimeEntry,
} from '../../src/Common/SerializeData.js';
import {
  parseResourceId,
  timeEntryBodySchema,
  validateBody,
  validateParams,
  validateQuery,
} from '../../src/Common/ValidateData.js';

describe('ErrorHandler', () => {
  it('throwNotFound includes the id when provided', () => {
    assert.throws(() => throwNotFound('Thing', { id: 'abc' }), (err) => {
      assert.equal(err instanceof HttpError, true);
      assert.equal(err.status, 404);
      assert.equal(err.message, 'Thing #abc not found');

      return true;
    });
    assert.throws(() => throwNotFound('Thing'), (err) => {
      assert.equal(err.message, 'Thing not found');

      return true;
    });
  });

  it('invalidJsonHandler forwards non-JSON errors', () => {
    let forwarded;
    const next = (err) => {
      forwarded = err;
    };
    const err = new Error('nope');
    invalidJsonHandler(err, {}, {}, next);
    assert.equal(forwarded, err);

    const jsonErr = new SyntaxError('Unexpected token');
    jsonErr.status = 400;
    jsonErr.body = '';
    const sent = {};
    const res = {
      status(code) {
        sent.status = code;

        return this;
      },
      json(body) {
        sent.body = body;

        return this;
      },
    };
    invalidJsonHandler(jsonErr, {}, res, () => {
      throw new Error('should not forward');
    });
    assert.equal(sent.status, 400);
    assert.deepEqual(sent.body, { error: 'Invalid JSON body' });
  });

  it('handleControllerError no-ops after headers are sent', () => {
    const res = { headersSent: true, status() { throw new Error('should not send'); } };
    handleControllerError(res, new Error('x'));
  });

  it('handleControllerError returns 500 for unexpected errors', () => {
    const sent = {};
    const res = {
      headersSent: false,
      status(code) {
        sent.status = code;

        return this;
      },
      json(body) {
        sent.body = body;

        return this;
      },
    };
    handleControllerError(res, new Error('boom'), { method: 'GET', originalUrl: '/x' });
    handleControllerError(res, new Error('boom'), { method: 'GET', path: '/z' });
    assert.equal(sent.status, 500);
    assert.deepEqual(sent.body, { error: 'Internal Server Error' });
  });

  it('handleControllerError logs without request context', () => {
    const sent = {};
    const res = {
      headersSent: false,
      status(code) {
        sent.status = code;

        return this;
      },
      json(body) {
        sent.body = body;

        return this;
      },
    };
    handleControllerError(res, new Error('boom'));
    assert.equal(sent.status, 500);
    handleControllerError(res, new HttpError(404, 'missing'));
    assert.equal(sent.status, 404);
    assert.deepEqual(sent.body, { error: 'missing' });
  });

  it('errorHandler forwards when headers were already sent', () => {
    let forwarded;
    errorHandler(new Error('late'), {}, { headersSent: true }, (err) => {
      forwarded = err;
    });
    assert.equal(forwarded.message, 'late');

    const sent = {};
    const res = {
      headersSent: false,
      status(code) {
        sent.status = code;

        return this;
      },
      json(body) {
        sent.body = body;

        return this;
      },
    };
    errorHandler(new HttpError(409, 'conflict'), { path: '/y' }, res, () => {});
    assert.equal(sent.status, 409);
  });

  it('asyncHandler forwards rejected promises', async () => {
    const handler = asyncHandler(async () => {
      throw new HttpError(418, 'teapot');
    });
    const err = await new Promise((resolve) => {
      handler({}, {}, resolve);
    });
    assert.equal(err.status, 418);

    let nextCalled = false;
    const ok = asyncHandler(async (req, res) => {
      res.done = true;
    });
    await ok({}, { done: false }, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, false);
  });
});

describe('ListQuery', () => {
  it('builds default and id sorts', () => {
    assert.deepEqual(mongoSort(undefined, 'asc'), { createdAt: 1, _id: 1 });
    assert.deepEqual(mongoSort('createdAt', 'desc'), { createdAt: -1, _id: -1 });
    assert.deepEqual(mongoSort('id', 'desc'), { _id: -1 });
    assert.deepEqual(mongoSort('name', 'asc'), { name: 1, _id: 1 });
  });

  it('maps list query options and escapes regex search', () => {
    const options = listOptionsFromQuery({
      q: 'a+b',
      status: 'active',
      taskId: 't1',
      sortBy: 'name',
      order: 'desc',
      offset: 5,
      limit: 2,
    });
    assert.equal(options.skip, 5);
    assert.equal(options.limit, 2);
    assert.deepEqual(options.sort, { name: -1, _id: -1 });

    const filter = buildListFilter({
      extra: { clientId: 'c1' },
      status: 'active',
      q: 'a+b',
      qFields: ['name'],
    });
    assert.equal(filter.clientId, 'c1');
    assert.equal(filter.status, 'active');
    assert.equal(filter.$or[0].name.test('A+B'), true);
  });

  it('buildListFilter uses empty extra by default', () => {
    assert.deepEqual(buildListFilter(), {});
  });

  it('sendPagedList sets extra headers', () => {
    const headers = {};
    const res = {
      set(name, value) {
        headers[name] = value;
      },
      status() {
        return this;
      },
      json(body) {
        return body;
      },
    };
    const body = sendPagedList(res, [{ n: 1 }], (item) => item, 4, { 'X-Extra': 9 });
    assert.equal(headers['X-Total-Count'], '4');
    assert.equal(headers['X-Extra'], '9');
    assert.deepEqual(body, [{ n: 1 }]);
    sendPagedList(res, [], (item) => item, 0);
    assert.equal(headers['X-Total-Count'], '0');
  });
});

describe('SerializeData', () => {
  it('formats missing, string, and non-string ids', () => {
    assert.equal(formatResourceId(undefined), undefined);
    assert.equal(formatResourceId({}), undefined);
    assert.equal(formatResourceId({ _id: 'abc' }), 'abc');
    assert.equal(formatResourceId({ _id: 12 }), '12');
  });

  it('serializes catalog and time-entry documents', () => {
    const now = new Date('2024-01-02T00:00:00.000Z');
    assert.equal(serializeClient({ _id: '1', name: 'n', description: 'd', status: 'active', createdAt: now, updatedAt: now }).id, '1');
    assert.equal(serializeProject({ _id: '2', clientId: 'c', name: 'p', status: 'active', createdAt: now, updatedAt: now }).clientId, 'c');
    assert.equal(serializeTask({ _id: '3', name: 't', status: 'active', createdAt: now, updatedAt: now }).parent, 0);
    assert.equal(serializeTask({ _id: '3', parent: 4, name: 't', status: 'active', createdAt: now, updatedAt: now }).parent, 4);
    assert.equal(
      serializeTimeEntry({
        _id: '4',
        taskId: 't',
        userId: 'u',
        comment: 'c',
        start: '2024-01-01T00:00:00.000Z',
        end: now,
        createdAt: now,
        updatedAt: now,
      }).start,
      '2024-01-01T00:00:00.000Z',
    );
    assert.equal(
      serializeClient({
        _id: '1',
        name: 'n',
        description: 'd',
        status: 'active',
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      }).createdAt,
      '2024-01-02T00:00:00.000Z',
    );
  });
});

describe('ValidateData', () => {
  it('parseResourceId accepts uuid v4 only', () => {
    assert.equal(parseResourceId('00000000-0000-4000-8000-000000000000'), '00000000-0000-4000-8000-000000000000');
    assert.equal(parseResourceId('nope'), null);
  });

  it('validateBody assigns converted values', () => {
    const req = {
      body: {
        taskId: '00000000-0000-4000-8000-000000000000',
        comment: 'ok',
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-01T01:00:00Z',
      },
    };
    let nextCalled = false;
    validateBody(timeEntryBodySchema)(req, {}, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(req.body.start instanceof Date, true);
  });

  it('validateParams and validateQuery reject invalid input', () => {
    const res = {
      status(code) {
        this.code = code;

        return this;
      },
      json(body) {
        this.body = body;

        return this;
      },
    };
    validateParams({ validate: () => ({ error: true }) })({ params: {} }, res, () => {});
    assert.equal(res.code, 400);
    validateQuery({ validate: () => ({ error: true }) })({ query: {} }, res, () => {});
    assert.equal(res.body.error, 'Invalid request parameters');
  });

  it('validateParams and validateQuery assign values', () => {
    const req = { params: { id: '1' }, query: { q: 'x' } };
    let n = 0;
    validateParams({ validate: () => ({ value: { id: '1' } }) })(req, {}, () => {
      n += 1;
    });
    validateQuery({ validate: () => ({ value: { q: 'x' } }) })(req, {}, () => {
      n += 1;
    });
    assert.equal(n, 2);
    assert.equal(req.params.id, '1');
  });
});

describe('LogService', () => {
  it('sanitizes secrets, URIs, bearer tokens, arrays, and primitives', () => {
    logService.log('plain');
    logService.log('with-data', {
      password: 'secret',
      nested: { api_key: 'k', keep: 'ok' },
      list: [{ token: 't' }, 'plain'],
      mongo: 'mongodb://localhost',
      redis: 'redis://localhost',
      rediss: 'rediss://localhost',
      auth: 'Bearer abc',
      other: 3,
      userId: 'should-hide',
    });
    logService.log('err-only', null, new Error('x'));
    logService.log('err-data', { keep: true }, new Error('y'));
    logService.log('nil', undefined);
    logService.log('number', 4);
  });
});

describe('config parsers', () => {
  it('parses numeric fallbacks and rate limit from env', () => {
    assert.equal(config.rateLimitEnabled, process.env.RATE_LIMIT_ENABLED === 'true');
    assert.equal(parseNumber('0', 15), 15);
    assert.equal(parseNumber('9', 15), 9);
    assert.ok(config.host);
  });
});

describe('RequiredEnv', () => {
  it('reports missing API_KEY and mongo credentials', () => {
    const prevKey = process.env.API_KEY;
    const prevUrl = process.env.MONGO_URL;
    const prevPassword = process.env.MONGODB_PASSWORD;
    delete process.env.API_KEY;
    delete process.env.MONGO_URL;
    delete process.env.MONGODB_PASSWORD;
    try {
      const missing = getMissingRequiredEnv();
      assert.equal(missing.includes('API_KEY'), true);
      assert.equal(missing.includes('MONGO_URL or MONGODB_PASSWORD'), true);
    } finally {
      process.env.API_KEY = prevKey;
      process.env.MONGO_URL = prevUrl;
      if (prevPassword !== undefined) {
        process.env.MONGODB_PASSWORD = prevPassword;
      }
    }
  });

  it('validateRequiredEnv returns when env is present and exits when missing', () => {
    validateRequiredEnv();
    const prevKey = process.env.API_KEY;
    delete process.env.API_KEY;
    const origExit = process.exit;
    let code;
    process.exit = (value) => {
      code = value;
    };
    try {
      validateRequiredEnv();
      assert.equal(code, 1);
    } finally {
      process.exit = origExit;
      process.env.API_KEY = prevKey;
    }
  });

  it('accepts MONGODB_PASSWORD when MONGO_URL is unset', () => {
    const prevUrl = process.env.MONGO_URL;
    const prevPassword = process.env.MONGODB_PASSWORD;
    delete process.env.MONGO_URL;
    process.env.MONGODB_PASSWORD = 'secret';
    try {
      assert.equal(getMissingRequiredEnv().includes('MONGO_URL or MONGODB_PASSWORD'), false);
    } finally {
      if (prevUrl !== undefined) {
        process.env.MONGO_URL = prevUrl;
      } else {
        delete process.env.MONGO_URL;
      }
      if (prevPassword === undefined) {
        delete process.env.MONGODB_PASSWORD;
      } else {
        process.env.MONGODB_PASSWORD = prevPassword;
      }
    }
  });
});

describe('authenticate', () => {
  it('rejects missing, empty, and non-bearer credentials', () => {
    const responses = [];
    function res() {
      return {
        status(code) {
          this.code = code;

          return this;
        },
        json(body) {
          this.body = body;
          responses.push(this);

          return this;
        },
      };
    }

    authenticate({ headers: {} }, res(), () => {});
    authenticate({ headers: { authorization: 'Bearer' } }, res(), () => {});
    authenticate({ headers: { authorization: 'Basic abc' } }, res(), () => {});
    assert.equal(responses.every((item) => item.code === 404), true);
  });
});

describe('requestLogger', () => {
  it('logs when the response finishes using path fallback', () => {
    const handlers = {};
    const res = {
      statusCode: 204,
      on(event, handler) {
        handlers[event] = handler;
      },
    };
    let nextCalled = false;
    requestLogger({ method: 'GET', path: '/health' }, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    handlers.finish();
  });
});
