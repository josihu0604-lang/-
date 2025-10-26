# OAuth Integration Guide - Qetta

This document describes the integration of Toss Certification and KFTC OpenBanking OAuth into the Qetta platform.

## Overview

The integration adds support for two external authentication providers:

1. **Toss Certification (토스 인증)** - For identity verification, simple authentication, and electronic signatures
2. **KFTC OpenBanking (금융결제원 오픈뱅킹)** - For bank account balance and transaction queries

## Architecture

### Database Schema

A new `ExternalAuth` model stores OAuth tokens and provider information:

```prisma
model ExternalAuth {
  id             String           @id @default(uuid())
  userId         String
  user           User             @relation(fields: [userId], references: [id])
  provider       ExternalProvider // TOSS_CERT or KFTC_OPENBANKING
  providerUserId String?
  accessToken    String?
  refreshToken   String?
  tokenExpiresAt DateTime?
  scope          String?
  metadata       Json?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@unique([userId, provider])
}
```

### API Structure

```
services/api/src/
├── config.js                    # Extended with Toss and KFTC configuration
├── lib/
│   ├── toss.js                 # Toss OAuth and API utilities
│   └── kftc.js                 # KFTC OAuth and API utilities
├── routes/
│   └── oauth.js                # OAuth endpoints for both providers
└── middleware/
    └── auth.js                 # Extended with authenticate decorator
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Toss Certification OAuth (test credentials provided)
TOSS_OAUTH_BASE=https://oauth2.cert.toss.im
TOSS_API_BASE=https://cert.toss.im
TOSS_CLIENT_ID=test_a8e23336d673ca70922b485fe806eb2d
TOSS_CLIENT_SECRET=test_418087247d66da09fda1964dc4734e453c7cf66a7a9e3
TOSS_SCOPE=ca

# KFTC OpenBanking OAuth
KFTC_API_BASE=https://testapi.openbanking.or.kr
KFTC_CLIENT_ID=d45b5d59-e571-436a-9675-aa5048e09489
KFTC_CLIENT_SECRET=8dc9537a-395b-46a5-90db-8d362a7fde6f
KFTC_REDIRECT_URI=http://localhost:3000/oauth/kftc/callback
KFTC_SCOPE=login inquiry
```

### Production Credentials

For production deployment:
- **Toss**: Replace test credentials with production credentials from Toss
- **KFTC**: Update `KFTC_API_BASE` to `https://openapi.openbanking.or.kr` and use production client credentials

## API Endpoints

### Toss Certification

#### `GET /api/v1/oauth/toss/token`
Get or refresh Toss access token for authenticated user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "provider": "TOSS_CERT",
  "accessToken": "eyJhbGc...",
  "expiresAt": "2025-10-26T12:00:00.000Z"
}
```

#### `POST /api/v1/oauth/toss/test`
Test Toss OAuth connection.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "provider": "TOSS_CERT",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "hasAccessToken": true
}
```

### KFTC OpenBanking

#### `GET /api/v1/oauth/kftc/authorize`
Initiate KFTC OpenBanking OAuth flow.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "authorizationUrl": "https://testapi.openbanking.or.kr/oauth/2.0/authorize?...",
  "state": "abc123def456..."
}
```

#### `GET /api/v1/oauth/kftc/callback`
OAuth callback endpoint (called by KFTC after user consent).

**Query Parameters:**
- `code` - Authorization code
- `state` - CSRF protection state
- `scope` - Granted scopes

Returns HTML success/error page.

#### `GET /api/v1/oauth/kftc/token`
Get current KFTC token for authenticated user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "provider": "KFTC_OPENBANKING",
  "accessToken": "eyJhbGc...",
  "expiresAt": "2025-10-27T12:00:00.000Z",
  "userSeqNo": "1101073389"
}
```

#### `GET /api/v1/oauth/kftc/balance/:fintechUseNum`
Get account balance using OpenBanking API.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Path Parameters:**
- `fintechUseNum` - 24-digit fintech use number

**Response:**
```json
{
  "bank_code_std": "097",
  "bank_name": "오픈은행",
  "account_num_masked": "1234***890",
  "balance_amt": 1000000,
  "available_amt": 1000000,
  "account_holder_name": "홍길동"
}
```

#### `POST /api/v1/oauth/kftc/transactions`
Get transaction list using OpenBanking API.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "fintechUseNum": "123456789012345678901234",
  "fromDate": "20251001",
  "toDate": "20251026"
}
```

**Response:**
```json
{
  "res_list": [
    {
      "tran_date": "20251026",
      "tran_time": "143000",
      "inout_type": "OUT",
      "tran_type": "입금",
      "print_content": "홍길동",
      "tran_amt": "50000",
      "after_balance_amt": "950000"
    }
  ]
}
```

### Common Endpoints

#### `GET /api/v1/oauth/status`
Get all connected external auth providers for authenticated user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "connected": [
    {
      "provider": "TOSS_CERT",
      "providerUserId": null,
      "tokenExpiresAt": "2025-10-26T12:00:00.000Z",
      "scope": "ca",
      "connectedAt": "2025-10-26T10:00:00.000Z",
      "lastUpdated": "2025-10-26T11:00:00.000Z"
    },
    {
      "provider": "KFTC_OPENBANKING",
      "providerUserId": "1101073389",
      "tokenExpiresAt": "2025-10-27T10:00:00.000Z",
      "scope": "login inquiry",
      "connectedAt": "2025-10-26T09:00:00.000Z",
      "lastUpdated": "2025-10-26T10:00:00.000Z"
    }
  ]
}
```

#### `DELETE /api/v1/oauth/:provider/disconnect`
Disconnect an external auth provider.

**Path Parameters:**
- `provider` - Either `toss` or `kftc`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "provider": "TOSS_CERT"
}
```

## Frontend Integration

A complete OAuth management page is available at `/oauth`:

```typescript
// Visit http://localhost:3000/oauth
// Features:
// - View connected providers
// - Test Toss connection
// - Connect to KFTC OpenBanking
// - Disconnect providers
// - View token expiration
```

### Usage Example

```typescript
// 1. Test Toss connection
const testToss = async () => {
  const token = localStorage.getItem('accessToken');
  const res = await fetch('/api/v1/oauth/toss/test', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await res.json();
  console.log(data); // { success: true, ... }
};

// 2. Connect KFTC OpenBanking
const connectKftc = async () => {
  const token = localStorage.getItem('accessToken');
  const res = await fetch('/api/v1/oauth/kftc/authorize', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await res.json();
  window.open(data.authorizationUrl, 'KFTC OAuth', 'width=600,height=700');
};

// 3. Get account balance
const getBalance = async (fintechUseNum: string) => {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(`/api/v1/oauth/kftc/balance/${fintechUseNum}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const balance = await res.json();
  console.log(balance);
};
```

## Database Migration

Run the migration to create the `ExternalAuth` table:

```bash
cd services/api
npm run migrate:deploy
```

Or if using Docker:

```bash
docker-compose exec api npm run migrate:deploy
```

## Security Considerations

1. **State Validation**: KFTC OAuth uses Redis to store and validate CSRF state tokens
2. **Token Storage**: Access tokens are stored encrypted in the database
3. **Token Expiration**: Tokens are automatically refreshed when expired
4. **HTTPS Only**: All external API calls use HTTPS
5. **Environment Variables**: Sensitive credentials are stored in environment variables

## Firewall Configuration

### Toss Certification
Allow outbound HTTPS (443) to:
```
117.52.3.222
117.52.3.235
211.115.96.222
211.115.96.235
```

### KFTC OpenBanking
Allow outbound HTTPS (443) to:
```
testapi.openbanking.or.kr (for testing)
openapi.openbanking.or.kr (for production)
```

## Testing

### Toss Certification Test

```bash
# Using cURL
curl -X POST http://localhost:8080/api/v1/oauth/toss/test \
  -H "Authorization: Bearer <your_jwt_token>"
```

### KFTC OpenBanking Test

1. Visit `http://localhost:3000/oauth`
2. Click "🔗 OpenBanking 연결"
3. Complete the authorization in the popup
4. Check connection status after callback

## Troubleshooting

### Toss Connection Issues

**Error: Timeout / Connection Failed**
- Check firewall allows outbound to Toss IPs on port 443
- Verify `TOSS_OAUTH_BASE` and `TOSS_API_BASE` are correct

**Error: 401 Unauthorized**
- Verify `TOSS_CLIENT_ID` and `TOSS_CLIENT_SECRET` are correct
- Check if using test credentials vs production credentials

### KFTC Connection Issues

**Error: redirect_uri mismatch**
- Ensure `KFTC_REDIRECT_URI` exactly matches the value registered in KFTC console
- Check for trailing slashes or protocol differences (http vs https)

**Error: Invalid state**
- Redis may not be running or configured
- State token may have expired (10-minute timeout)
- Check Redis connection in logs

**Error: scope insufficient**
- Ensure KFTC application has `login` and `inquiry` scopes enabled
- Re-authorize with correct scopes

## Reference Documentation

- **Toss Certification Guide**: `/toss_auth_api.html`
- **KFTC OpenBanking Guide**: `/openbanking_local_callback_guide.html`
- **Toss Certification API Docs**: https://docs.tosspayments.com/
- **KFTC OpenBanking Docs**: https://developers.kftc.or.kr/

## License

Integration code is part of the Qetta project and follows the same license.

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-26  
**Author**: Qetta Development Team
