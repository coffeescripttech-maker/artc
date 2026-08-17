#!/usr/bin/env bash
# ARATC LMS Local Database Reset Script (Bash)
# WARNING: This deletes all data in the local Docker volumes.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== ARATC LMS Local Database Reset ===${NC}"
echo -e "${YELLOW}This will delete all local database data and re-run migrations + seed.${NC}"

read -p "Are you sure? (yes/no) " confirm
if [ "$confirm" != "yes" ]; then
    echo -e "${CYAN}Reset cancelled.${NC}"
    exit 0
fi

echo -e "${CYAN}Stopping containers and removing volumes...${NC}"
docker compose down -v

echo -e "${CYAN}Starting fresh containers...${NC}"
docker compose up -d

# Wait for PostgreSQL to be ready
echo -e "${CYAN}Waiting for PostgreSQL to be ready...${NC}"
retries=0
max_retries=30
while [ $retries -lt $max_retries ]; do
    if docker compose exec -T postgres pg_isready -U aratc -d aratc_lms >/dev/null 2>&1; then
        echo -e "${GREEN}PostgreSQL is ready!${NC}"
        break
    fi
    retries=$((retries + 1))
    sleep 2
done

if [ $retries -eq $max_retries ]; then
    echo -e "${RED}PostgreSQL did not become ready in time.${NC}"
    exit 1
fi

echo -e "${CYAN}Running migrations...${NC}"
pnpm --filter @aratc/database db:migrate

echo -e "${CYAN}Seeding database...${NC}"
pnpm --filter @aratc/database db:seed

echo -e "${GREEN}Reset complete!${NC}"
