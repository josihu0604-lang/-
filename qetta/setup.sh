#!/bin/bash
set -e

echo "🚀 Qetta Setup Script"
echo "===================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env with your actual credentials if needed${NC}"
    echo ""
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
    echo ""
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not installed. Please install docker-compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and docker-compose are installed${NC}"
echo ""

# Ask user what to do
echo "What would you like to do?"
echo "1) Start services (Docker Compose)"
echo "2) Stop services"
echo "3) Restart services"
echo "4) View logs"
echo "5) Run database migrations"
echo "6) Run smoke tests"
echo "7) Reset database (CAUTION: destroys data)"
echo "0) Exit"
echo ""

read -p "Enter choice [0-7]: " choice

case $choice in
    1)
        echo -e "${YELLOW}🐳 Starting services with Docker Compose...${NC}"
        docker-compose -f infra/docker-compose.full.yml up -d
        echo ""
        echo -e "${GREEN}✅ Services started successfully!${NC}"
        echo ""
        echo "Services running at:"
        echo "  - API: http://localhost:8080"
        echo "  - Web: http://localhost:3000"
        echo "  - Health: http://localhost:8080/health"
        echo ""
        echo "Next steps:"
        echo "  1. Run migrations: ./setup.sh (choose option 5)"
        echo "  2. Test OAuth: visit http://localhost:3000/oauth"
        echo "  3. View logs: ./setup.sh (choose option 4)"
        ;;
    2)
        echo -e "${YELLOW}🛑 Stopping services...${NC}"
        docker-compose -f infra/docker-compose.full.yml down
        echo -e "${GREEN}✅ Services stopped${NC}"
        ;;
    3)
        echo -e "${YELLOW}🔄 Restarting services...${NC}"
        docker-compose -f infra/docker-compose.full.yml restart
        echo -e "${GREEN}✅ Services restarted${NC}"
        ;;
    4)
        echo -e "${YELLOW}📋 Viewing logs (Ctrl+C to exit)...${NC}"
        docker-compose -f infra/docker-compose.full.yml logs -f
        ;;
    5)
        echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
        docker-compose -f infra/docker-compose.full.yml exec api npm run migrate:deploy
        echo ""
        echo -e "${GREEN}✅ Migrations completed${NC}"
        echo ""
        read -p "Would you like to seed test data? (y/n): " seed_choice
        if [ "$seed_choice" = "y" ]; then
            docker-compose -f infra/docker-compose.full.yml exec api npm run seed
            echo -e "${GREEN}✅ Test data seeded${NC}"
        fi
        ;;
    6)
        echo -e "${YELLOW}🧪 Running smoke tests...${NC}"
        if [ -f ./tools/codex ]; then
            ./tools/codex smoke
        else
            echo -e "${RED}❌ codex tool not found${NC}"
        fi
        ;;
    7)
        echo -e "${RED}⚠️  WARNING: This will destroy all data!${NC}"
        read -p "Are you sure? Type 'yes' to confirm: " confirm
        if [ "$confirm" = "yes" ]; then
            echo -e "${YELLOW}🗑️  Resetting database...${NC}"
            docker-compose -f infra/docker-compose.full.yml down -v
            docker-compose -f infra/docker-compose.full.yml up -d db redis
            sleep 5
            docker-compose -f infra/docker-compose.full.yml up -d
            sleep 3
            docker-compose -f infra/docker-compose.full.yml exec api npm run migrate:deploy
            echo -e "${GREEN}✅ Database reset complete${NC}"
        else
            echo -e "${YELLOW}Cancelled${NC}"
        fi
        ;;
    0)
        echo -e "${GREEN}👋 Goodbye!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✨ Done!${NC}"
