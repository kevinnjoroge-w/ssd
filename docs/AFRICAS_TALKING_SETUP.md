# Africa's Talking USSD Integration

This guide explains how to integrate your InsureMe backend with Africa's Talking USSD gateway.

## Overview

The backend includes a complete Africa's Talking USSD integration that allows users to access insurance products through USSD *123#.

## Architecture

```
User Phone (USSD *123#)
         ↓
Africa's Talking Gateway
         ↓
/api/ussd/callback (Your Backend)
         ↓
USSDService (Menu Processing)
         ↓
DataService (Session Management)
         ↓
Response → Africa's Talking → User Phone
```

## Setup Instructions

### 1. Get Africa's Talking Credentials

1. Sign up at https://africastalking.com
2. Get your:
   - **Username**: Your AT account username (or "sandbox" for testing)
   - **API Key**: Your API key from the dashboard
   - **Short Code**: Your USSD short code (e.g., 1212 for sandbox)

### 2. Configure Environment Variables

Update your `.env` file:

```bash
# Africa's Talking Configuration
AT_USERNAME=sandbox            # Use 'sandbox' for testing, your username for production
AT_API_KEY=your_api_key_here
AT_SHORTCODE=1212             # Sandbox: 1212, Production: your assigned shortcode
AT_USSD_CALLBACK_URL=https://your-domain.com/api/ussd/callback
```

### 3. Configure Africa's Talking Dashboard

1. Log in to your Africa's Talking dashboard
2. Go to **USSD** → **Settings**
3. Set the **Callback URL** to: `https://your-domain.com/api/ussd/callback`
4. Configure **Timeout**: 30-60 seconds
5. Ensure your short code is active

### 4. Africa's Talking Callback Format

Africa's Talking will send POST requests to your callback endpoint with this format:

```json
{
  "sessionId": "ATUid_...",
  "phoneNumber": "+254712345678",
  "text": "1",
  "networkOperator": "Safaricom"
}
```

**Parameters:**
- `sessionId`: Unique identifier for the USSD session
- `phoneNumber`: User's phone number (E.164 format)
- `text`: User input (empty for initial request, menu selection/text for subsequent)
- `networkOperator`: Mobile operator name

## API Endpoints

### Callback Endpoint (Africa's Talking)
```
POST /api/ussd/callback
```

This is where Africa's Talking sends incoming USSD requests. The endpoint processes the request and returns a formatted USSD response.

**Request (from Africa's Talking):**
```json
{
  "sessionId": "ATUid_abc123",
  "phoneNumber": "+254712345678",
  "text": "",
  "networkOperator": "Safaricom"
}
```

**Response:**
```
CON Welcome to InsureMe Kenya!
1. Register
2. My Plans
3. Buy Insurance
4. Pay Premium
5. Check Balance
0. Exit
```

**Response Format:**
- `CON` prefix: Continue session (user can send more input)
- `END` prefix: End session (no further input accepted)

### Test Endpoint (Development)
```
POST /api/ussd/test/simulate
Content-Type: application/json

{
  "phoneNumber": "+254712345678",
  "text": ""
}
```

Simulates an Africa's Talking USSD request for testing without a real SIM card.

### Get Session Details
```
GET /api/ussd/session/{sessionId}
```

Retrieve details about a specific USSD session (for debugging).

## USSD Flow

### Initial Request
User dials: **\*123#**

Response:
```
CON Welcome to InsureMe Kenya!
1. Register
2. My Plans
3. Buy Insurance
4. Pay Premium
5. Check Balance
0. Exit
```

### Registration Flow
1. User selects **1** (Register)
2. App prompts for name
3. App prompts for occupation
4. App prompts for income range
5. User is registered

### Buy Insurance Flow
1. User selects **3** (Buy Insurance)
2. App shows available plans
3. User selects a plan
4. App prompts for premium amount
5. App confirms purchase and triggers M-Pesa payment
6. User confirms payment on phone
7. Policy is activated

### Pay Premium Flow
1. User selects **4** (Pay Premium)
2. App shows active policies
3. User selects a policy to pay for
4. App prompts for amount
5. M-Pesa STK push is triggered
6. Payment is processed

## Response Formatting

The backend formats responses according to Africa's Talking requirements:

```javascript
// CON response (continue session)
CON Welcome!
1. Option 1
2. Option 2
0. Back

// END response (end session)
END Thank you for using InsureMe!
```

**Rules:**
- Maximum 160 characters per line
- Use newlines to separate options
- Prefix with CON or END
- Responses are automatically truncated if too long

## Multilingual Support

The app supports:
- **English** (en) - Default
- **Swahili** (sw) - Available

User language preference is stored after first registration.

## Session Management

Sessions are stored in the database with:
- Session ID (from Africa's Talking)
- User phone number
- Current menu state
- User input history
- Session status (active/ended)

Session timeout is typically 5-10 minutes with Africa's Talking.

## Error Handling

If an error occurs:
```
END An error occurred. Please dial *123# to try again.
```

Errors are logged with:
- Timestamp
- Phone number
- Session ID
- Error message
- Stack trace (development only)

## Testing Locally

### Using the Test Endpoint

```bash
curl -X POST http://localhost:3000/api/ussd/test/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+254712345678",
    "text": ""
  }'
```

### Testing with Postman

1. Create a new POST request
2. URL: `http://localhost:3000/api/ussd/test/simulate`
3. Body (raw JSON):
```json
{
  "phoneNumber": "+254712345678",
  "text": ""
}
```
4. Send

### Testing in Production

1. Use a real phone with an AT-enabled short code
2. Dial `*123#` (or your short code)
3. Follow the prompts

## Troubleshooting

### "Invalid phone number format"
- Ensure phone number is in E.164 format (+254...)
- Or in local format (07...)
- Africa's Talking may strip the + sign

### Session times out
- Africa's Talking default timeout is 5-10 minutes
- If users are slow, they may see "Session ended"
- Timeout can be configured in AT dashboard

### Callback not being called
- Verify callback URL is publicly accessible
- Check that firewall allows incoming connections
- Verify URL in Africa's Talking dashboard matches exactly
- Check server logs for errors

### Response not appearing on phone
- Ensure response is prefixed with CON or END
- Check response doesn't exceed Africa's Talking limits
- Verify phone number format is correct

## Performance Considerations

- **Response Time**: Target < 2 seconds per USSD request
- **Concurrency**: Backend handles multiple simultaneous sessions
- **Session Storage**: SQLite for development, PostgreSQL for production
- **Rate Limiting**: Implement if needed to prevent abuse

## Security

- All USSD inputs are validated
- Phone numbers are normalized
- Session data is stored securely
- API keys should not be logged
- Use HTTPS in production

## Monitoring

Track these metrics:
- USSD requests per day
- Average response time
- Error rate
- Session completion rate
- Most used menus

## Production Deployment

1. Update `.env` with production credentials:
   - AT_USERNAME: Your production username
   - AT_API_KEY: Your production API key
   - AT_SHORTCODE: Your production short code
   - AT_USSD_CALLBACK_URL: Your production domain

2. Configure Africa's Talking dashboard:
   - Update callback URL to production
   - Enable/verify short code activation

3. Deploy backend to production server

4. Test with real phone

5. Monitor logs and metrics

## Support

For Africa's Talking support:
- Documentation: https://africastalking.com/ussd
- Support: https://africastalking.com/help
- Sandbox: Always available for testing

For this application:
- Check logs: `npm run dev` or `journalctl -u ussd-backend`
- Test endpoint: `POST /api/ussd/test/simulate`
- Session details: `GET /api/ussd/session/{sessionId}`
