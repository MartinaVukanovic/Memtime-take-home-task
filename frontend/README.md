# Memtime UI

Vue 3 app for the Memtime take-home assignment: **Vite**, **TypeScript**, **Vue Router**. It calls the assignment API over HTTP only—no shared code with `backend/`.

Browse **clients → projects → tasks → time entries**. Clients, projects, and tasks are read-only; time entries can be created, edited, and deleted.

For running both apps together, see the [project README](../README.md).

## Quick start

**Requirements:** Node.js 18+, API running (see [backend README](../backend/README.md)).

```bash
npm install
cp .env.example .env
```

Set `VITE_API_KEY` to the same value as `API_KEY` in the backend `.env`, then:

```bash
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`). `/` redirects to `/clients`.

## Configuration

| Variable | Notes |
| --- | --- |
| `VITE_API_BASE_URL` | API base including `/api/v1` (default `http://localhost:3000/api/v1`) |
| `VITE_API_KEY` | Bearer token sent on every API request (required) |

## Routes

| Path | Screen |
| --- | --- |
| `/clients` | Client list |
| `/clients/:clientId/projects` | Projects for a client |
| `/clients/:clientId/projects/:projectId/tasks` | Tasks for a project |
| `…/tasks/:taskId/time-entries` | Time entries for a task |

Lists support search, status filters, and pagination where the API allows.

## No data in the UI?

The frontend only displays what the API returns. If lists are empty, start the backend and run `npm run seed-database` in `backend/` (see [Seed data](../backend/README.md#seed-data)).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Vue / TypeScript check |
| `npm test` | Unit tests (Vitest) |

App code lives under `src/` (`api/`, `components/`, `composables/`, `views/`).
