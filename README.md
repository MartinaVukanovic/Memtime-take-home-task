# Memtime

Time-tracking UI and API for the Memtime take-home assignment. The repo contains two **standalone** apps—no shared packages or npm workspace. They communicate only over HTTP.

| Folder | Stack | Role |
| --- | --- | --- |
| [`frontend/`](./frontend) | Vue 3, Vite, TypeScript | Browse clients → projects → tasks; manage time entries |
| [`backend/`](./backend) | Node.js, Express, MongoDB, Joi, Redis (optional) | Assignment REST API at `/api/v1` |

**Node.js 18+** is required for both apps. Run each app in its own terminal from its own directory.

## Run locally

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Configure `.env` (see [backend/README.md](./backend/README.md)):

- **MongoDB** — hosted on Atlas (`memtime.hjedswt.mongodb.net` in `.env.example`); no local DB. Set `API_KEY` and `MONGODB_PASSWORD` to your assignment key (same value).
- **Redis** — only if `RATE_LIMIT_ENABLED=true`. `.env.example` uses `false` so you can start without Redis; turn rate limiting on when you want to test it locally.

```bash
npm run seed-database   # sample data (re-run if lists are empty)
npm start               # http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Set `VITE_API_KEY` to the same value as `API_KEY` in `backend/.env`, then:

```bash
npm run dev             # default http://localhost:5173
```

Default API URL: `http://localhost:3000/api/v1` (`VITE_API_BASE_URL`).

## Documentation

| Topic | Where |
| --- | --- |
| Env vars, Redis, Atlas, API routes, seed script | [backend/README.md](./backend/README.md) |
| UI routes, frontend env, tests | [frontend/README.md](./frontend/README.md) |
