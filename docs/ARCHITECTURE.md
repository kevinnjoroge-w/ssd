# System Architecture Documentation

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USSD Insurance Platform                      │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────┐
│   USSD Gateway     │
│  (Africa's Talking)│
└────────┬───────────┘
         │ HTTP
         ▼
┌────────────────────────────────────────────────────────────┐
│                  Express.js Server                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  API Routes                          │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  POST /api/ussd              - USSD Handler    │ │  │
│  │  │  POST /api/ussd/buy-policy   - Create Policy   │ │  │
│  │  │  GET  /api/ussd/policies     - Get Policies    │ │  │
│  │  │  POST /api/payments/mpesa    - M-Pesa Payment  │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Business Logic Layer                    │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  Controllers                                    │ │  │
│  │  │  ├─ USSDController                             │ │  │
│  │  │  └─ PaymentController                          │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  Services                                       │ │  │
│  │  │  ├─ USSDService (Menu logic)                    │ │  │
│  │  │  ├─ MpesaService (Payment integration)          │ │  │
│  │  │  ├─ DataService (Database operations)           │ │  │
│  │  │  └─ PersonalizationEngine (Recommendations)     │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Data Access Layer                       │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  Objection.js Models                            │ │  │
│  │  │  ├─ User                                        │ │  │
│  │  │  ├─ Plan                                        │ │  │
│  │  │  ├─ Policy                                      │ │  │
│  │  │  ├─ Payment                                     │ │  │
│  │  │  └─ Session                                     │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
         │
         │ SQL Queries
         ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Tables:                                          │ │
│  │  • users        - User profiles                   │ │
│  │  • plans        - Insurance plans                 │ │
│  │  • policies     - User policies                   │ │
│  │  • payments     - Payment records                 │ │
│  │  • sessions     - USSD sessions                   │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│               External Services                           │
│  ┌──────────────────────────┐  ┌──────────────────────┐  │
│  │  Safaricom M-Pesa API    │  │  Africa's Talking    │  │
│  │  - STK Push              │  │  - USSD Gateway      │  │
│  │  - Callback Handler      │  │  - Message Queue     │  │
│  │  - OAuth2 Auth           │  └──────────────────────┘  │
│  └──────────────────────────┘                            │
└────────────────────────────────────────────────────────────┘
```

## Component Description

### 1. USSD Gateway Integration
- **Purpose:** Receives USSD dial requests (*123#)
- **Provider:** Africa's Talking or Mobulk Africa
- **Communication:** HTTP POST callbacks
- **Session Management:** 30-minute expiry

### 2. Express.js Server
- **Port:** 3000 (configurable)
- **Middleware:** Helmet, CORS, Morgan logging
- **Error Handling:** Centralized error middleware
- **Health Check:** /health endpoint

### 3. Controllers
- **USSDController:** Handles menu navigation
- **PaymentController:** Processes M-Pesa transactions

### 4. Services (Business Logic)
- **USSDService:** Menu rendering, session state management
- **MpesaService:** Payment gateway integration
- **DataService:** All database operations
- **PersonalizationEngine:** Plan recommendations & risk scoring

### 5. Models (Data Objects)
Using Objection.js ORM:
- Automatic validation
- Relationship management
- Query building with Knex

### 6. Database
- **Type:** PostgreSQL 12+
- **Connection Pooling:** Enabled
- **Migrations:** Knex version control
- **Backup:** Automated snapshots

## Data Flow Examples

### USSD Menu Navigation
```
1. User dials *123#
2. USSD Gateway sends POST to /api/ussd
3. System checks/creates Session
4. USSDService.processUSSD() renders menu
5. Response sent (CON or END)
6. User input triggers next menu
7. On selection, controller calls service
8. Service updates database & user experience
9. Response sent back to gateway
10. USSD terminates when END response sent
```

### Insurance Purchase Flow
```
1. User selects "3. Buy Insurance"
2. System displays plan options
3. User enters premium amount
4. PersonalizationEngine recommends plan
5. System calculates coverage (premium × 500)
6. Policy created in database
7. USSD displays confirmation
8. User can proceed to payment
```

### M-Pesa Payment Flow
```
1. User confirms insurance purchase
2. PaymentController.initiateMpesaPayment() called
3. MpesaService generates OAuth token
4. STK Push sent to user's phone
5. User enters M-Pesa PIN
6. Safaricom processes payment
7. Webhook callback to /api/payments/mpesa/callback
8. PaymentController processes callback
9. Payment status updated in database
10. Policy activated upon successful payment
11. SMS confirmation sent to user
```

## Security Architecture

```
┌─────────────────────────────────────────┐
│         Input Validation Layer          │
│  • Joi schema validation                │
│  • Phone number format check            │
│  • Premium range validation             │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│      Authentication & Authorization     │
│  • JWT token verification               │
│  • Session validation                   │
│  • API key protection                   │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Transport Security              │
│  • HTTPS/TLS encryption                 │
│  • Helmet security headers              │
│  • CORS validation                      │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         Database Security               │
│  • Parameterized queries                │
│  • SQL injection prevention             │
│  • Row-level security                   │
│  • Encrypted passwords                  │
└─────────────────────────────────────────┘
```

## Scalability Strategy

### Horizontal Scaling
```
        Load Balancer (Nginx)
              │
    ┌─────────┼─────────┐
    │         │         │
   App      App      App
   :3000    :3000    :3000
```

### Database Scaling
```
Primary PostgreSQL
    ├── Read Replica 1
    ├── Read Replica 2
    └── Backup Server
```

### Caching Layer
```
Redis Cache
├── Sessions (30 min TTL)
├── Plans (6 hour TTL)
└── User Preferences (1 hour TTL)
```

### Message Queue
```
Bull/RabbitMQ
├── Email notifications
├── SMS alerts
├── Policy reminders
└── Payment confirmations
```

## Deployment Architecture

### Production Environment
```
┌──────────────────────────────────────────┐
│         AWS/DigitalOcean                 │
│  ┌────────────────────────────────────┐  │
│  │    EC2 Instances (Auto-Scaling)   │  │
│  │    • 2-10 instances based on load  │  │
│  │    • t3.medium minimum             │  │
│  │    • Auto-scaling group            │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │    RDS PostgreSQL                  │  │
│  │    • Multi-AZ deployment           │  │
│  │    • Automated backups             │  │
│  │    • Read replicas                 │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │    ElastiCache (Redis)             │  │
│  │    • Session store                 │  │
│  │    • Cache layer                   │  │
│  └────────────────────────────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │    CloudWatch/Monitoring           │  │
│  │    • Application metrics           │  │
│  │    • Error tracking                │  │
│  │    • Performance monitoring        │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **API Gateway** | Express.js | HTTP routing |
| **ORM** | Objection.js | Database mapping |
| **Query Builder** | Knex.js | SQL generation |
| **Database** | PostgreSQL | Data persistence |
| **Cache** | Redis | Session management |
| **Authentication** | JWT | API security |
| **Validation** | Joi | Input validation |
| **Password** | bcryptjs | Hashing |
| **HTTP Client** | axios | External APIs |
| **Logging** | Morgan | Request logging |
| **Security** | Helmet | HTTP headers |
| **Deployment** | Docker | Containerization |
| **CI/CD** | GitHub Actions | Automation |

## Performance Metrics

- **USSD Response Time:** < 2 seconds
- **API Response Time:** < 500ms (p95)
- **Database Query Time:** < 100ms (p95)
- **Payment Processing:** < 5 seconds
- **Uptime Target:** 99.9%
- **Max Concurrent Sessions:** 10,000
- **Max Requests/Second:** 1,000

## Monitoring & Observability

```
Application Metrics
├─ Request rate
├─ Response time
├─ Error rate
├─ Database connections
└─ Cache hit rate

Business Metrics
├─ Users registered
├─ Policies created
├─ Premium collected
└─ Payment success rate

Infrastructure Metrics
├─ CPU usage
├─ Memory usage
├─ Disk I/O
└─ Network bandwidth
```
