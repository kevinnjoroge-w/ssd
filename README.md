# USSD Insurance App - Technical Architecture

A comprehensive Node.js/Express-based USSD insurance platform with M-Pesa integration for Kenya's mobile-first market.

## 📋 Project Overview

This platform enables users to:
- Register and manage insurance policies via USSD (*123#)
- Purchase health insurance plans
- Make payments via M-Pesa
- View policy details and payment history
- Receive personalized plan recommendations

## 🏗️ Architecture

### Technology Stack

**Backend:**
- **Framework:** Node.js + Express.js
- **Database:** PostgreSQL
- **ORM:** Objection.js (with Knex query builder)
- **Payments:** M-Pesa Daraja API
- **USSD:** Africa's Talking / Mobulk Africa compatible
- **Authentication:** JWT
- **Security:** Helmet, CORS

**Deployment:**
- AWS EC2 / DigitalOcean with auto-scaling
- Docker containerization ready
- PostgreSQL managed database

## 📁 Project Structure

```
insurance-ussd/
├── src/
│   ├── config/
│   │   └── database.js              # Database connection config
│   ├── models/
│   │   ├── User.js                  # User model
│   │   ├── Plan.js                  # Insurance plans
│   │   ├── Policy.js                # User policies
│   │   ├── Payment.js               # Payment records
│   │   └── Session.js               # USSD sessions
│   ├── services/
│   │   ├── USSDService.js           # USSD menu logic
│   │   ├── MpesaService.js          # M-Pesa integration
│   │   ├── DataService.js           # Database operations
│   │   └── PersonalizationEngine.js # Plan recommendations
│   ├── controllers/
│   │   ├── USSDController.js        # USSD request handlers
│   │   └── PaymentController.js     # Payment handlers
│   ├── routes/
│   │   ├── ussd.js                  # USSD endpoints
│   │   ├── payments.js              # Payment endpoints
│   │   ├── users.js                 # User endpoints
│   │   └── plans.js                 # Plan endpoints
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication
│   │   └── validation.js            # Input validation
│   ├── utils/
│   │   ├── constants.js             # App constants
│   │   └── helpers.js               # Utility functions
│   └── server.js                    # Express server setup
├── database/
│   ├── migrations/                  # Database migrations
│   └── seeds/                       # Database seeding
├── tests/                           # Test files
├── .env.example                     # Environment template
├── knexfile.js                      # Knex configuration
└── package.json                     # Dependencies
```

## 🗄️ Database Schema

### Users Table
| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Primary key |
| phone | String | Phone number (unique) |
| name | String | User name |
| email | String | Email address |
| occupation | String | User's occupation |
| income_range | Enum | low, medium, high |
| preferred_language | Enum | en, sw |
| created_at | Timestamp | Account creation |

### Plans Table
| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Primary key |
| name | String | Plan name |
| coverage_type | Enum | basic, standard, comprehensive |
| min_premium | Decimal | Minimum monthly premium |
| max_premium | Decimal | Maximum monthly premium |
| max_coverage | Decimal | Maximum coverage amount |
| coverage_multiplier | Decimal | Premium × multiplier = coverage |
| benefits | JSON | Plan features |

### Policies Table
| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| plan_id | UUID | Foreign key to plans |
| policy_number | String | Unique policy identifier |
| premium | Decimal | Monthly premium |
| coverage_amount | Decimal | Total coverage amount |
| status | Enum | active, inactive, expired, claimed |
| start_date | Date | Policy effective date |
| end_date | Date | Policy expiration date |

### Payments Table
| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| policy_id | UUID | Foreign key to policies |
| amount | Decimal | Payment amount |
| status | Enum | pending, completed, failed |
| transaction_id | String | Unique transaction ID |
| mpesa_receipt | String | M-Pesa receipt number |
| payment_method | Enum | mpesa, bank_transfer |

### Sessions Table
| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Primary key |
| session_id | String | USSD session ID |
| phone | String | User phone number |
| current_menu | String | Current menu state |
| session_data | JSON | Temporary session data |
| language | Enum | en, sw |
| status | Enum | active, ended |
| expires_at | Timestamp | Session expiration (30 mins) |

## 🎮 USSD Flow

### Main Menu (*123#)
```
CON Welcome to InsureMe Kenya!
1. Register
2. My Plans
3. Buy Insurance
4. Pay Premium
5. Check Balance
0. Exit
```

### Buy Insurance Flow
1. User selects "3. Buy Insurance"
2. System shows plan options:
   - Basic Health (50-100 KES/month)
   - Standard Health (100-300 KES/month)
   - Comprehensive (300-500 KES/month)
3. User enters monthly premium (50-500 KES)
4. System calculates coverage: `premium × 500 = coverage`
5. User confirms purchase
6. Policy created, M-Pesa prompt sent

### Payment Flow
```
Premium × 500 = Coverage Amount
Example: 100 KES × 500 = 50,000 KES hospital coverage
```

## 💳 M-Pesa Integration

### STK Push Implementation

```javascript
// Initiate payment
POST /api/payments/mpesa/initiate
{
  "userId": "user-id",
  "amount": 100,
  "phoneNumber": "+254712345678",
  "description": "Insurance Premium Payment"
}

// M-Pesa Callback
POST /api/payments/mpesa/callback
// Webhook from Safaricom with payment status
```

### Integration Details
- **Endpoint:** https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest
- **Authentication:** OAuth 2.0 (Consumer Key/Secret)
- **Environment:** Sandbox for testing, Production for live
- **Callback:** Webhook URL for payment confirmation

## 🔧 Setup Instructions

### Prerequisites
- Node.js v14+
- PostgreSQL 12+
- M-Pesa Developer account (Safaricom)
- Africa's Talking account (USSD gateway)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd insurance-ussd

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Database setup
npm run migrate
npm run seed

# Start development server
npm run dev

# Production
npm start
```

### Environment Variables
```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=insurance_ussd
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRY=7d

# M-Pesa
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=174379
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/mpesa/callback

# Africa's Talking
AT_USERNAME=your_username
AT_API_KEY=your_api_key
```

## 📊 Personalization Engine

The system uses rule-based logic to recommend plans:

```javascript
Premium < 100 KES     → Basic Health
100-300 KES          → Standard Health
> 300 KES            → Comprehensive Health
```

### Risk Scoring
- **Occupation:** Construction/mining → higher risk
- **Income:** Low income → higher risk
- **Adjustments:** 15% discount (low risk) to 25% surcharge (high risk)

## 🔐 Security Features

- **HTTPS/TLS** for all communications
- **JWT authentication** for API endpoints
- **Input validation** (Joi schema validation)
- **Rate limiting** for payment endpoints
- **Helmet** for HTTP security headers
- **CORS** properly configured
- **SQL injection** prevention via parameterized queries
- **Password hashing** with bcryptjs

## 📱 API Endpoints

### USSD Endpoints
```
POST   /api/ussd              Handle USSD request
POST   /api/ussd/register     Register new user
GET    /api/ussd/plans        Get available plans
POST   /api/ussd/buy-policy   Create policy
GET    /api/ussd/policies/:userId  Get user policies
```

### Payment Endpoints
```
POST   /api/payments/mpesa/initiate           Initiate payment
POST   /api/payments/mpesa/callback           M-Pesa callback
GET    /api/payments/mpesa/status/:id        Check payment status
GET    /api/payments/history/:userId         Payment history
```

## 🧪 Testing

```bash
# Run tests
npm test

# With coverage
npm test -- --coverage
```

## 📈 Scaling Considerations

1. **Database:** Use PostgreSQL read replicas, connection pooling
2. **Caching:** Redis for session management, plan cache
3. **Load Balancer:** Nginx for distributing traffic
4. **Message Queue:** Bull/RabbitMQ for async operations
5. **Monitoring:** Sentry for error tracking, DataDog for metrics
6. **CDN:** CloudFront for static assets

## 🚀 Deployment

### Docker
```bash
docker build -t insurance-ussd .
docker run -d -p 3000:3000 --env-file .env insurance-ussd
```

### AWS EC2 with Auto-Scaling
```bash
# Using AWS Elastic Beanstalk
eb init
eb create insurance-ussd-env
eb deploy
```

## 📝 Future Enhancements

- [ ] ML-based risk scoring (Scikit-learn integration)
- [ ] Claims management system
- [ ] Multi-currency support
- [ ] SMS notifications
- [ ] Admin dashboard
- [ ] Policy renewal automation
- [ ] Integration with Airtel Money & Equity Bank
- [ ] Web UI for desktop users
- [ ] Push notifications for app users

## 📄 License

MIT

## 👥 Support

For issues and support, contact: support@insureme.ke
