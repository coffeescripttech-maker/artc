# Local Development Guide

This guide walks you through running ARATC LMS on your local machine.

## Prerequisites

1. **Node.js 20+** — Download from [nodejs.org](https://nodejs.org/)
2. **pnpm 9+** — Install via [pnpm.io](https://pnpm.io/installation)
3. **Docker Desktop** — Install via [docker.com](https://www.docker.com/products/docker-desktop/)
   - Make sure Docker Desktop is running before running setup scripts.
4. **Git** — For cloning the repository

## Quick Setup

We provide automated setup scripts for both PowerShell and Bash.

### Windows (PowerShell)

Open PowerShell in the project root and run:

```powershell
.\scripts\setup-local.ps1
```

### macOS / Linux / Git Bash

Open a terminal in the project root and run:

```bash
chmod +x ./scripts/setup-local.sh
./scripts/setup-local.sh
```

The script will:

1. Check that pnpm and Docker are installed
2. Create `.env` from `.env.example` if it doesn't exist
3. Install dependencies with `pnpm install`
4. Start PostgreSQL and Redis containers with `docker compose up -d`
5. Wait for PostgreSQL to become ready
6. Generate the Prisma client
7. Run database migrations
8. Seed the database with sample data
9. Build shared workspace packages

## Start Development Servers

After setup completes, run:

```bash
pnpm dev
```

This starts:

- **Web app:** http://localhost:3000
- **API server:** http://localhost:4000

## Default Login

A seeded admin account is created automatically:

- **Email:** `admin@aratc.edu.ph`
- **Password:** `admin123`

You can use this to log in at http://localhost:3000/login and access the admin dashboard.

## Common Commands

```bash
# Start infrastructure only
docker compose up -d

# Stop infrastructure
docker compose down

# Reset database (WARNING: deletes all data)
docker compose down -v
docker compose up -d
pnpm --filter @aratc/database db:migrate
pnpm --filter @aratc/database db:seed

# Run migrations after schema changes
pnpm --filter @aratc/database db:migrate

# Open Prisma Studio
pnpm --filter @aratc/database db:studio

# Build all packages and apps
pnpm build

# Run type checks
pnpm typecheck

# Run linters
pnpm lint
```

## Troubleshooting

### Port already in use

If you see `EADDRINUSE` errors, make sure no other services are using ports `3000`, `4000`, `5432`, or `6379`.

To find and stop a process on Windows PowerShell:

```powershell
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess
Stop-Process -Id <PID> -Force
```

On macOS/Linux:

```bash
lsof -ti:3000 | xargs kill -9
```

### PostgreSQL not ready

If migrations fail because PostgreSQL is not ready, wait a few seconds and try again:

```bash
pnpm --filter @aratc/database db:migrate
```

### Docker not running

Make sure Docker Desktop is started. On Windows, you should see the Docker whale icon in the system tray.

### Schema changes not reflected

After modifying `packages/database/prisma/schema.prisma`, always run:

```bash
pnpm --filter @aratc/database db:generate
pnpm --filter @aratc/database db:migrate
```

## Environment Variables

Key variables in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://aratc:aratc_dev_password@localhost:5432/aratc_lms?schema=public` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for JWT tokens | (must be set in production) |
| `API_PORT` | Express API port | `4000` |
| `NEXT_PUBLIC_API_URL` | URL the web app uses to call the API | `http://localhost:4000` |

For production, generate secure values for `JWT_SECRET` and `SESSION_SECRET`.
