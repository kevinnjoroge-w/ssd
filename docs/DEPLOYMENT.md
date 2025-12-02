# USSD Insurance App - Setup & Deployment Guide

## Quick Start

### 1. Prerequisites
```bash
# Install Node.js 14+ and PostgreSQL 12+
# Download from nodejs.org and postgresql.org
```

### 2. Clone & Setup
```bash
# Clone repository
git clone <repository-url>
cd insurance-ussd

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb insurance_ussd

# Update .env with your credentials
# Run migrations
npm run migrate

# Seed sample data
npm run seed
```

### 4. Environment Configuration
Edit `.env` file with your credentials:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=insurance_ussd
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_secret_key_min_32_chars
JWT_EXPIRY=7d

# M-Pesa (Safaricom)
MPESA_CONSUMER_KEY=YOUR_KEY_FROM_SAFARICOM
MPESA_CONSUMER_SECRET=YOUR_SECRET_FROM_SAFARICOM
MPESA_SHORTCODE=174379
MPESA_PASSKEY=YOUR_PASSKEY_FROM_SAFARICOM
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/mpesa/callback

# Africa's Talking (Optional for USSD)
AT_USERNAME=your_at_username
AT_API_KEY=your_at_api_key

# Business Configuration
BUSINESS_NAME=InsureMe Kenya
CURRENCY=KES
INSURANCE_MULTIPLIER=500
```

### 5. Start Development Server
```bash
npm run dev
```

Server will run on `http://localhost:3000`

## 🔄 Database Migrations

### Create new migration
```bash
npm run migrate:make migration_name
```

### Run migrations
```bash
npm run migrate
```

### Rollback
```bash
npm run migrate:rollback
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/ussd.test.js
```

## 🚀 Deployment

### Option 1: Docker Deployment

```dockerfile
# Create Dockerfile in project root
FROM node:16-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t insurance-ussd .
docker run -d -p 3000:3000 --env-file .env insurance-ussd
```

### Option 2: AWS EC2

1. Launch EC2 instance (Ubuntu 20.04)
2. SSH into instance
3. Install Node.js and PostgreSQL
4. Clone repo and setup
5. Use PM2 for process management

```bash
# Install PM2
sudo npm install -g pm2

# Start application
pm2 start src/server.js --name "insurance-ussd"
pm2 startup
pm2 save
```

### Option 3: DigitalOcean App Platform

1. Connect GitHub repository
2. Configure environment variables
3. Set build command: `npm install`
4. Set run command: `npm start`
5. Configure PostgreSQL managed database
6. Deploy

## 📊 API Documentation

### USSD Endpoint
```
POST /api/ussd
Content-Type: application/json

Request:
{
  "sessionId": "unique_session_id",
  "phoneNumber": "+254712345678",
  "text": "*123#" or "1" or "2" (menu choice)
}

Response:
{
  "response": "CON Welcome to InsureMe Kenya!...",
  "continueSession": true,
  "triggerMpesa": false
}
```

### Payment Endpoint
```
POST /api/payments/mpesa/initiate
Content-Type: application/json

Request:
{
  "userId": "user-uuid",
  "amount": 100,
  "phoneNumber": "+254712345678",
  "description": "Insurance Premium Payment"
}

Response:
{
  "success": true,
  "data": {
    "checkoutRequestId": "...",
    "transactionId": "...",
    "amount": 100
  }
}
```

### Get Plans
```
GET /api/ussd/plans
Response:
{
  "success": true,
  "data": [
    {
      "id": "plan-uuid",
      "name": "Basic Health",
      "coverage_type": "basic",
      "min_premium": 50,
      "max_premium": 100,
      "benefits": {...}
    }
  ]
}
```

### Get User Policies
```
GET /api/ussd/policies/:userId
Response:
{
  "success": true,
  "data": [
    {
      "id": "policy-uuid",
      "policy_number": "POL-xxx",
      "premium": 100,
      "coverage_amount": 50000,
      "status": "active"
    }
  ]
}
```

## 🔐 M-Pesa Integration Steps

### 1. Safaricom Developer Setup
- Register at https://developer.safaricom.co.ke
- Create new app
- Generate Consumer Key and Consumer Secret
- Get OAuth2 credentials

### 2. Configure Credentials
Add to `.env`:
```env
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
```

### 3. Configure Callback URL
In your Safaricom dashboard:
- Set Confirmation URL: `https://your-domain.com/api/payments/mpesa/callback`
- Set Validation URL: `https://your-domain.com/api/payments/mpesa/callback`

### 4. Test Payment Flow
```bash
curl -X POST http://localhost:3000/api/payments/mpesa/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "amount": 100,
    "phoneNumber": "+254712345678",
    "description": "Test Payment"
  }'
```

## 📱 USSD Testing

### Using Africa's Talking Simulator
1. Login to Africa's Talking dashboard
2. Navigate to USSD simulator
3. Dial *123# (or your configured code)
4. Test menu navigation

### Using curl
```bash
curl -X POST http://localhost:3000/api/ussd \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-123",
    "phoneNumber": "+254712345678",
    "text": "*123#"
  }'
```

## 🔍 Monitoring & Logs

### Check application logs
```bash
pm2 logs insurance-ussd
```

### Monitor performance
```bash
pm2 monit
```

### View error logs
```bash
tail -f logs/error.log
```

## 🛠️ Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Verify .env database credentials
cat .env | grep DB_
```

### M-Pesa Payment Failures
- Verify Consumer Key/Secret are correct
- Check MPESA_CALLBACK_URL is publicly accessible
- Test OAuth token generation

### USSD Session Timeouts
- Default session expiry is 30 minutes
- Update SESSION_EXPIRY_MS in constants.js if needed

### Port Already in Use
```bash
# Change PORT in .env or find process using port
lsof -i :3000
kill -9 <PID>
```

## 📈 Performance Optimization

### Database Optimization
- Add indexes on frequently queried columns
- Use connection pooling
- Monitor slow queries

### Caching Strategy
- Redis for session management
- Cache plan data (changes rarely)
- Cache user preferences

### Load Testing
```bash
npm install -g artillery

# Create artillery.yml config
artillery quick --count 100 --num 1000 http://localhost:3000/health
```

## 🔄 CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to DigitalOcean
        run: |
          # Deployment script
```

## 📞 Support & Contact

- Documentation: See README.md
- Email: support@insureme.ke
- Issues: GitHub Issues
- Slack: #insurance-dev
