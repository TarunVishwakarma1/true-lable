# TrueLabel Dashboard

Admin dashboard: crash reports today, complaints/images/data operations
later. Deploys to `dashboard.truelabel.fun`.

## Status

Scaffold only — dependencies installed, no auth, no data, no real screens
yet. See `prisma/schema.prisma` for the database convention: this app reads
the same Postgres database as `backend/`, and the backend's sqlx migrations
stay the only migration authority.

## Local dev

```bash
cp .env.example .env
bun install
bun run dev   # :3002
```
