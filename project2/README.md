# Scalar Full-Stack Workspace

Scalable monorepo-style starter with:

- `frontend`: React + Vite + Tailwind CSS
- `backend`: Express API with modular routing and game logic
- `shared`: shared config and types consumed by both apps

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Create local environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Start everything:

```bash
npm run dev
```

## Scripts

- `npm run dev`: runs shared watcher, backend, and frontend together
- `npm run dev:backend`: runs only the backend
- `npm run dev:frontend`: runs only the frontend
- `npm run build`: builds shared, backend, then frontend
- `npm run typecheck`: runs TypeScript checks across all workspaces

## Default ports

- Frontend: `5173`
- Backend: `4000`

## API routes

- `GET /api/v1/health`
- `POST /api/v1/game/start`
- `POST /api/v1/game/move`
- `GET /api/v1/game/state`
- `GET /api/v1/game/score`
- `POST /api/v1/game/:sessionId/guess`

Simulation Arena game endpoints return a consistent `data` shape:

```json
{
  "grid": [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
  "agent": { "x": 0, "y": 9 },
  "score": 0,
  "steps": 0,
  "rewardsCollected": 0,
  "status": "idle"
}
```

`grid` is always returned as a `10x10` matrix using `0 = empty`, `1 = agent`, `2 = obstacle`, and `3 = reward`.

## OpenEnv

This repository also includes an OpenEnv-compatible Python environment for the grid RL game.

- Manifest: `openenv.yaml`
- Python package: `scalar_grid_env`
- Server entrypoint: `uv run server`

Typical local flow:

```bash
uv sync
uv run server --host 0.0.0.0 --port 8000
```
