#!/bin/bash
# NexPanel Installation Script

set -e

echo "🚀 NexPanel Installation Script"
echo "================================"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js 18+ first"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✓ Node.js $NODE_VERSION detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✓ npm $NPM_VERSION detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm run install-all

# Build project
echo ""
echo "🔨 Building project..."
npm run build

echo ""
echo "✅ Installation complete!"
echo ""
echo "📝 Next steps:"
echo "1. Configure backend/.env if needed"
echo "2. Start development: npm run dev"
echo "3. Start production: npm start"
echo "4. Access dashboard at http://localhost:3000"
echo ""
echo "For more information, see INSTALLATION.md"
