#!/usr/bin/env bash
# ARATC LMS Local Development Setup Script (Bash)
# Run this from the project root directory

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}=== ARATC LMS Local Dev Setup ===${NC}"

# Check prerequisites
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}pnpm is not installed. Please install pnpm first: https://pnpm.io/installation${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker Desktop first: https://www.docker.com/products/docker-desktop/${NC}"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    cp .env.example .env
fi

# Install dependencies
echo -e "${CYAN}Installing dependencies...${NC}"
pnpm install

# Start Docker services
echo -e "${CYAN}Starting Docker services (PostgreSQL + Redis)...${NC}"
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
    echo -e "${RED}PostgreSQL did not become ready in time. Check Docker logs: docker compose logs postgres${NC}"
    exit 1
fi

# Generate Prisma client
echo -e "${CYAN}Generating Prisma client...${NC}"
pnpm --filter @aratc/database db:generate

# Run migrations
echo -e "${CYAN}Running database migrations...${NC}"
pnpm --filter @aratc/database db:migrate

# Seed database
echo -e "${CYAN}Seeding database...${NC}"
pnpm --filter @aratc/database db:seed

# Build shared packages
echo -e "${CYAN}Building shared packages...${NC}"
pnpm --filter @aratc/shared build
pnpm --filter @aratc/ui build
pnpm --filter @aratc/database build

echo ""
echo -e "${GREEN}=== Setup complete! ===${NC}"
echo -e "${GREEN}Run 'pnpm dev' to start the development servers.${NC}"
echo -e "${GREEN}Web: http://localhost:3000${NC}"
echo -e "${GREEN}API: http://localhost:4000${NC}"
echo -e "${GREEN}Admin login: admin@aratc.edu.ph / admin123${NC}"
