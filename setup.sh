#!/bin/bash
# NexPanel Quick Start Script

set -e

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║         🚀 NexPanel - Server Dashboard               ║"
echo "║    Modern Management for ARM and Linux Servers       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check environment
echo -e "${BLUE}Checking environment...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "Install Node.js 18+ from https://nodejs.org"
    exit 1
fi
NODE_V=$(node -v)
echo -e "${GREEN}✓ Node.js $NODE_V${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi
NPM_V=$(npm -v)
echo -e "${GREEN}✓ npm $NPM_V${NC}"

echo ""
echo -e "${BLUE}Setting up NexPanel...${NC}"

# Install
echo "📦 Installing dependencies..."
npm run install-all 2>&1 | tail -3

# Build
echo "🔨 Building project..."
npm run build 2>&1 | tail -3

echo ""
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo -e "${YELLOW}📝 Available commands:${NC}"
echo "   npm run dev      - Start development server"
echo "   npm start        - Start production server"
echo "   npm run build    - Build for production"
echo "   npm run lint     - Run linter"
echo "   npm run type-check - Check TypeScript"
echo ""
echo -e "${YELLOW}🌐 Access dashboard:${NC}"
echo "   Development: http://localhost:5173"
echo "   Production:  http://localhost:3000"
echo ""
echo -e "${YELLOW}📚 Documentation:${NC}"
echo "   Setup:  cat INSTALLATION.md"
echo "   Dev:    cat ARCHITECTURE.md"
echo ""
echo -e "${BLUE}To get started:${NC}"
echo "   npm run dev"
echo ""
echo "For more information, see INSTALLATION.md"
echo ""
