# ARATC LMS Local Database Reset Script (PowerShell)
# WARNING: This deletes all data in the local Docker volumes.

$ErrorActionPreference = "Stop"

Write-Host "=== ARATC LMS Local Database Reset ===" -ForegroundColor Yellow
Write-Host "This will delete all local database data and re-run migrations + seed." -ForegroundColor Yellow

$confirm = Read-Host "Are you sure? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Reset cancelled." -ForegroundColor Cyan
    exit 0
}

Write-Host "Stopping containers and removing volumes..." -ForegroundColor Cyan
docker compose down -v

Write-Host "Starting fresh containers..." -ForegroundColor Cyan
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
    Write-Error "PostgreSQL did not become ready in time."
    exit 1
}

Write-Host "Running migrations..." -ForegroundColor Cyan
pnpm --filter @aratc/database db:migrate

Write-Host "Seeding database..." -ForegroundColor Cyan
pnpm --filter @aratc/database db:seed

Write-Host "Reset complete!" -ForegroundColor Green
