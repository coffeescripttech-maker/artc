# ARATC LMS Local Development Setup Script (PowerShell)
# Run this from the project root directory

$ErrorActionPreference = "Stop"

function Test-Command {
    param($Command)
    return [bool](Get-Command -Name $Command -ErrorAction SilentlyContinue)
}

Write-Host "=== ARATC LMS Local Dev Setup ===" -ForegroundColor Cyan

# Check prerequisites
if (-not (Test-Command "pnpm")) {
    Write-Error "pnpm is not installed. Please install pnpm first: https://pnpm.io/installation"
    exit 1
}

if (-not (Test-Command "docker")) {
    Write-Error "Docker is not installed. Please install Docker Desktop first: https://www.docker.com/products/docker-desktop/"
    exit 1
}

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Cyan
pnpm install

# Start Docker services
Write-Host "Starting Docker services (PostgreSQL + Redis)..." -ForegroundColor Cyan
docker compose up -d

# Wait for PostgreSQL to be ready
Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Cyan
$retries = 0
$maxRetries = 30
while ($retries -lt $maxRetries) {
    try {
        $ready = docker compose exec -T postgres pg_isready -U aratc -d aratc_lms 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "PostgreSQL is ready!" -ForegroundColor Green
            break
        }
    }
    catch {
        # Ignore errors while waiting
    }
    $retries++
    Start-Sleep -Seconds 2
}

if ($retries -eq $maxRetries) {
    Write-Error "PostgreSQL did not become ready in time. Check Docker logs: docker compose logs postgres"
    exit 1
}

# Generate Prisma client
Write-Host "Generating Prisma client..." -ForegroundColor Cyan
pnpm --filter @aratc/database db:generate

# Run migrations
Write-Host "Running database migrations..." -ForegroundColor Cyan
pnpm --filter @aratc/database db:migrate

# Seed database
Write-Host "Seeding database..." -ForegroundColor Cyan
pnpm --filter @aratc/database db:seed

# Build shared packages
Write-Host "Building shared packages..." -ForegroundColor Cyan
pnpm --filter @aratc/shared build
pnpm --filter @aratc/ui build
pnpm --filter @aratc/database build

Write-Host "" -ForegroundColor Green
Write-Host "=== Setup complete! ===" -ForegroundColor Green
Write-Host "Run 'pnpm dev' to start the development servers." -ForegroundColor Green
Write-Host "Web: http://localhost:3000" -ForegroundColor Green
Write-Host "API: http://localhost:4000" -ForegroundColor Green
Write-Host "Admin login: admin@aratc.edu.ph / admin123" -ForegroundColor Green
