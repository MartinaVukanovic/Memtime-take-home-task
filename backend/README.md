# Memtime API

Express API for the Memtime take-home assignment: **Node.js**, **MongoDB** (native driver), **Joi** validation, optional **Redis** rate limiting.

Base path: `/api/v1` (Bearer `API_KEY` on all routes except health checks).

For how this app fits with the Vue frontend, see the [project README](../README.md).

## Quick start

**Requirements:** Node.js 18+

**MongoDB** is used via Atlas (online)—you do not run a database locally; set `MONGODB_PASSWORD` (and related vars) in `.env`.

**Redis** is only needed when `RATE_LIMIT_ENABLED=true` (see `.env.example`). In that case start Redis on your machine before `npm start`, for example:

```bash
# macOS (Homebrew), if Redis is installed
brew services start redis

# or Docker
docker run -d --name memtime-redis -p 6379:6379 redis:7-alpine
```

The default `REDIS_URL` is `redis://127.0.0.1:6379`. Set `RATE_LIMIT_ENABLED=false` if you want to run the API without a local Redis instance.

```bash
npm install
cp .env.example .env
```

Set your Memtime assignment key as **both** `API_KEY` and `MONGODB_PASSWORD` in `.env` (same value; `MONGODB_HOST` and `MONGODB_USER` are already set in `.env.example`). Then:

```bash
npm run seed-database
npm start               # http://localhost:3000
```

Use `npm run dev` for reload on file changes.

```bash
curl http://localhost:3000/health
curl -H "Authorization: Bearer <API_KEY>" http://localhost:3000/api/v1/clients
```

## Configuration

| Variable | Notes |
| --- | --- |
| `PORT` | Default `3000` |
| `MONGODB_*` / `DATABASE_NAME` | Atlas connection (built into a `mongodb+srv://` URI) |
| `MONGO_URL` | Optional full URI (local Mongo or tests; skips password requirement) |
| `API_KEY` | Bearer token for `/api/v1` |
| `RATE_LIMIT_ENABLED` | `true` = 15 req / 60s per key (needs Redis). Use `false` for easy local frontend testing |
| `REDIS_URL` | Default `redis://127.0.0.1:6379` when rate limiting is on |

## API surface

Documented routes only—read for clients, projects, and tasks; full CRUD for **time entries**.

| | |
| --- | --- |
| `GET` | `/health`, `/readiness` (no auth) |
| `GET` | `/api/v1/clients`, `/clients/:id`, `/clients/:id/projects` |
| `GET` | `/api/v1/projects/:id`, `/projects/:id/tasks` |
| `GET` | `/api/v1/tasks/:id` |
| `GET` / `POST` / `PUT` / `DELETE` | `/api/v1/time-entries` (+ `/:id`) |

Time-entry `userId` is the API key, as in the assignment spec.

## Seed data

If the UI or API returns empty lists, or you want a fresh dataset, run:

```bash
npm run seed-database
```

`scripts/SeedDatabase.js` **clears** the app collections in your configured database, ensures indexes, then inserts sample data: clients, projects, tasks (nested per client/project), plus a couple of time entries tied to your `API_KEY`. Defaults are 60 clients, 3 projects each, 4 tasks per project—you can change the counts at the top of that script.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run seed-database` | Reset and populate MongoDB (see above) |
| `npm test` | Tests (in-memory Mongo via `MONGO_URL`; no Atlas needed) |
| `npm run lint` / `lint:fix` | ESLint |

Source lives under `src/` (domain controllers + `Infrastructure/` for HTTP, DB, Redis).
