# USSD Insurance App - Windows Setup Script
# Run this script to set up the development environment

Write-Host "🚀 USSD Insurance App - Setup Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed. Please install Node.js 14+." -ForegroundColor Red
    exit 1
}

$nodeVersion = node -v
Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green

# Check npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm is not installed." -ForegroundColor Red
    exit 1
}

$npmVersion = npm -v
Write-Host "✓ npm found: $npmVersion" -ForegroundColor Green

# Check PostgreSQL (optional)
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  PostgreSQL is not installed. Please install PostgreSQL 12+" -ForegroundColor Yellow
    Write-Host "   For setup help, see DEPLOYMENT.md" -ForegroundColor Yellow
} else {
    $pgVersion = psql --version
    Write-Host "✓ PostgreSQL found: $pgVersion" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install

Write-Host ""
Write-Host "⚙️  Setting up environment..." -ForegroundColor Cyan
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "✓ Created .env file from template" -ForegroundColor Green
    Write-Host "  ⚠️  Please edit .env with your credentials" -ForegroundColor Yellow
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env with your database and API credentials"
Write-Host "2. Run 'npm run migrate' to set up database"
Write-Host "3. Run 'npm run seed' to add sample data"
Write-Host "4. Run 'npm run dev' to start development server"
Write-Host ""
