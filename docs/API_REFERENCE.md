# API Reference - USSD Insurance App

## Base URL
```
Development: http://localhost:3000
Production: https://api.insureme.ke
```

## Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## USSD Endpoints

### 1. Handle USSD Request
Process incoming USSD menu navigation requests.

```
POST /api/ussd
```

**Request Body:**
```json
{
  "sessionId": "string (required) - Unique session identifier",
  "phoneNumber": "string (required) - User phone number (+254xxxxxxxxx or 0xxxxxxxxx)",
  "text": "string (optional) - User menu selection or input"
}
```

**Response (200 OK):**
```json
{
  "response": "CON Welcome to InsureMe Kenya!\n1. Register\n2. My Plans\n3. Buy Insurance\n4. Pay Premium\n5. Check Balance\n0. Exit",
  "continueSession": true,
  "triggerMpesa": false
}
```

**Response Types:**
- `CON` - Continue session (user can enter more input)
- `END` - End session (final response, no further input)

**Example cURL:**
```bash
curl -X POST http://localhost:3000/api/ussd \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "abc123def456",
    "phoneNumber": "+254712345678",
    "text": "*123#"
  }'
```

---

### 2. Register User
Register new user with USSD data.

```
POST /api/ussd/register
```

**Request Body:**
```json
{
  "sessionId": "string (required)",
  "phoneNumber": "string (required)",
  "name": "string (required)",
  "occupation": "string (optional)",
  "incomeRange": "enum (optional) - 'low', 'medium', 'high'"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Response (400):**
```json
{
  "error": "Missing required fields",
  "message": "name is required"
}
```

---

### 3. Get Available Plans
Retrieve all active insurance plans.

```
GET /api/ussd/plans
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Basic Health",
      "coverage_type": "basic",
      "description": "Basic health coverage for outpatient services",
      "min_premium": 50,
      "max_premium": 100,
      "max_coverage": 50000,
      "coverage_multiplier": 500,
      "benefits": {
        "outpatient": true,
        "hospitalization": false,
        "emergency": true,
        "consultation": true
      },
      "active": true
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Standard Health",
      "coverage_type": "standard",
      "min_premium": 100,
      "max_premium": 300,
      "max_coverage": 150000,
      "benefits": {
        "outpatient": true,
        "hospitalization": true,
        "emergency": true,
        "consultation": true,
        "maternity": false
      }
    }
  ]
}
```

---

### 4. Buy Insurance Policy
Create a new insurance policy.

```
POST /api/ussd/buy-policy
```

**Request Body:**
```json
{
  "userId": "string (required) - UUID",
  "planId": "string (required) - UUID",
  "premium": "number (required) - Monthly premium in KES"
}
```

**Validation Rules:**
- Premium must be between plan's min_premium and max_premium
- UserId and planId must be valid UUIDs

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Policy created successfully",
  "data": {
    "policyNumber": "POL-1701234567890-a1b2c3d4",
    "premium": 100,
    "coverage": 50000,
    "status": "active"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Premium must be between 50 and 100",
  "details": "You entered 150 which exceeds maximum premium"
}
```

**Coverage Calculation:**
```
coverage_amount = premium × coverage_multiplier
Example: 100 KES × 500 = 50,000 KES
```

---

### 5. Get User Policies
Retrieve user's active insurance policies.

```
GET /api/ussd/policies/:userId
```

**Path Parameters:**
- `userId` (string, required) - User UUID

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "660e8400-e29b-41d4-a716-446655440001",
      "plan_id": "770e8400-e29b-41d4-a716-446655440002",
      "policy_number": "POL-1701234567890-a1b2c3d4",
      "premium": 100,
      "coverage_amount": 50000,
      "status": "active",
      "start_date": "2024-01-01",
      "end_date": "2025-01-01",
      "auto_renew": true,
      "plan": {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "name": "Basic Health",
        "coverage_type": "basic"
      }
    }
  ]
}
```

---

## Payment Endpoints

### 1. Initiate M-Pesa Payment
Trigger M-Pesa STK Push for payment.

```
POST /api/payments/mpesa/initiate
```

**Request Body:**
```json
{
  "userId": "string (required) - User UUID",
  "policyId": "string (optional) - Policy UUID",
  "amount": "number (required) - Amount in KES",
  "phoneNumber": "string (required) - Mpesa phone number",
  "description": "string (optional) - Payment description"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "STK push sent successfully",
  "data": {
    "checkoutRequestId": "ws_CO_DMZ_12345678900202312121212121",
    "transactionId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 100,
    "phoneNumber": "+254712345678"
  }
}
```

**Flow:**
1. User's phone receives M-Pesa STK prompt
2. User enters M-Pesa PIN
3. Payment processed
4. Webhook callback sent to `/api/payments/mpesa/callback`
5. Payment status updated

---

### 2. M-Pesa Callback Handler
Receives payment status from Safaricom (webhook).

```
POST /api/payments/mpesa/callback
```

**Callback Payload (from Safaricom):**
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "16813-1590513-1",
      "CheckoutRequestID": "ws_CO_DMZ_12345678900202312121212121",
      "ResultCode": 0,
      "ResultDesc": "The service request has been accepted successively",
      "CallbackMetadata": {
        "Item": [
          {
            "Name": "Amount",
            "Value": 100
          },
          {
            "Name": "MpesaReceiptNumber",
            "Value": "LK451A5260"
          },
          {
            "Name": "TransactionDate",
            "Value": 20191122063845
          },
          {
            "Name": "PhoneNumber",
            "Value": 254712345678
          }
        ]
      }
    }
  }
}
```

**Response (200 OK):**
```json
{}
```

**Result Codes:**
- `0` - Success
- Non-zero - Failed (e.g., user cancelled, invalid PIN)

---

### 3. Check Payment Status
Check STK Push request status.

```
GET /api/payments/mpesa/status/:checkoutRequestId
```

**Path Parameters:**
- `checkoutRequestId` (string, required)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "ResponseCode": "0",
    "ResponseDescription": "The service request has been accepted successively",
    "MerchantRequestID": "16813-1590513-1",
    "CheckoutRequestID": "ws_CO_DMZ_12345678900202312121212121",
    "ResultCode": 0,
    "ResultDesc": "The service request has been accepted successively"
  }
}
```

---

### 4. Get Payment History
Retrieve user's payment records.

```
GET /api/payments/history/:userId?limit=10
```

**Path Parameters:**
- `userId` (string, required) - User UUID

**Query Parameters:**
- `limit` (number, optional) - Number of records to return (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "660e8400-e29b-41d4-a716-446655440001",
      "policy_id": "770e8400-e29b-41d4-a716-446655440002",
      "amount": 100,
      "currency": "KES",
      "payment_method": "mpesa",
      "status": "completed",
      "transaction_id": "TXN-1701234567890",
      "mpesa_receipt": "LK451A5260",
      "mpesa_phone": "+254712345678",
      "period": "monthly",
      "paid_date": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-15T10:25:00Z"
    }
  ]
}
```

**Payment Status Values:**
- `pending` - Payment initiated, awaiting confirmation
- `completed` - Payment successful
- `failed` - Payment failed or cancelled

---

## User Endpoints

### 1. Get User Profile
```
GET /api/users/:userId
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "phone": "+254712345678",
  "name": "John Mwangi",
  "email": "john@example.com",
  "occupation": "Software Engineer",
  "income_range": "high",
  "preferred_language": "en",
  "created_at": "2024-01-01T10:00:00Z"
}
```

### 2. Update User Profile
```
PUT /api/users/:userId
```

**Request Body:**
```json
{
  "name": "string (optional)",
  "email": "string (optional)",
  "occupation": "string (optional)",
  "income_range": "enum (optional)",
  "preferred_language": "enum (optional) - 'en', 'sw'"
}
```

---

## Error Responses

### Common Error Codes

**400 Bad Request:**
```json
{
  "error": "Invalid input",
  "message": "phoneNumber must be a valid Kenyan number"
}
```

**401 Unauthorized:**
```json
{
  "error": "No authorization token provided"
}
```

**404 Not Found:**
```json
{
  "error": "User not found",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to process request",
  "message": "Database connection error"
}
```

---

## Rate Limiting

- **USSD requests:** 100 per minute per phone number
- **Payment endpoints:** 10 per minute per user
- **API calls:** 1000 per hour per IP

Headers returned:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Webhooks

### M-Pesa Callback
Endpoint: `POST /api/payments/mpesa/callback`

Configure in Safaricom dashboard:
- Confirmation URL
- Validation URL

Retry Logic: Safaricom retries 3 times with exponential backoff.

---

## Code Examples

### Python
```python
import requests
import json

# Initialize payment
url = "http://localhost:3000/api/payments/mpesa/initiate"
payload = {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 100,
    "phoneNumber": "+254712345678",
    "description": "Insurance Premium"
}

response = requests.post(url, json=payload)
data = response.json()
print(f"Checkout ID: {data['data']['checkoutRequestId']}")
```

### JavaScript
```javascript
const initiatePayment = async (userId, amount, phoneNumber) => {
  const response = await fetch('http://localhost:3000/api/payments/mpesa/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, amount, phoneNumber })
  });
  
  return response.json();
};
```

### cURL
```bash
curl -X POST http://localhost:3000/api/ussd/buy-policy \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "planId": "770e8400-e29b-41d4-a716-446655440002",
    "premium": 100
  }'
```

---

## Postman Collection

Import this JSON into Postman for easy API testing:

```json
{
  "info": {
    "name": "USSD Insurance API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "USSD",
      "item": [
        {
          "name": "Handle USSD",
          "request": {
            "method": "POST",
            "url": "http://localhost:3000/api/ussd"
          }
        }
      ]
    }
  ]
}
```
