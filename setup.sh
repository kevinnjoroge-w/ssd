#!/bin/bash

# USSD Insurance App - Setup Script
# Run this script to set up the development environment

set -e  # Exit on error

echo "🚀 USSD Insurance App - Setup Script"
echo "======================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14+."
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✓ Node.js found: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✓ npm found: $NPM_VERSION"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed. Please install PostgreSQL 12+."
    echo "   For setup help, see DEPLOYMENT.md"
else
    PG_VERSION=$(psql --version)
    echo "✓ PostgreSQL found: $PG_VERSION"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "⚙️  Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ Created .env file from template"
    echo "  ⚠️  Please edit .env with your credentials"
else
    echo "✓ .env file already exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your database and API credentials"
echo "2. Run 'npm run migrate' to set up database"
echo "3. Run 'npm run seed' to add sample data"
echo "4. Run 'npm run dev' to start development server"
echo ""
