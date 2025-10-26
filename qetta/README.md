# 🚀 Qetta - Financial Document Verification Platform

> **Full-stack application with Toss Certification and KFTC OpenBanking integration**

Qetta is a comprehensive platform for financial document verification, identity authentication, and banking integration. Built with modern technologies and production-ready architecture.

## 🌟 Features

- **📄 Document Verification**: AI-powered financial document analysis
- **🔐 Toss Certification**: Identity verification, simple authentication, and electronic signatures
- **🏦 KFTC OpenBanking**: Bank account balance and transaction queries
- **💳 Stripe Integration**: Subscription management and billing
- **🔒 Secure Authentication**: JWT-based auth with API key support
- **⚡ Redis Caching**: Fast response times with Redis
- **🐳 Docker Ready**: Full Docker Compose setup for easy deployment

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [OAuth Integration](#-oauth-integration)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Development](#-development)

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 14+ (if not using Docker)
- Redis 6+ (if not using Docker)

### Installation

```bash
# 1. Extract and enter directory
cd qetta

# 2. Setup environment
cp .env.example .env

# 3. Run setup script
./setup.sh
# Choose option 1 to start services
# Then choose option 5 to run migrations

# 4. Verify installation
curl http://localhost:8080/health
```

### Manual Setup

```bash
# Start services
docker-compose -f infra/docker-compose.full.yml up -d

# Run migrations
docker-compose -f infra/docker-compose.full.yml exec api npm run migrate:deploy

# View logs
docker-compose -f infra/docker-compose.full.yml logs -f
```

## 🏗️ Architecture

```
qetta/
├── services/
│   ├── api/              # Fastify REST API
│   │   ├── src/
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── lib/      # OAuth utilities (Toss, KFTC)
│   │   │   └── middleware/
│   │   └── prisma/       # Database schema & migrations
│   └── web/              # Next.js 14 frontend
│       └── app/          # App router pages
├── infra/                # Docker Compose configs
├── packages/             # Shared packages
│   └── verifier/         # Document verification engine
├── scripts/              # Utility scripts
└── tools/                # CLI tools (codex)
```

### Tech Stack

**Backend:**
- Node.js + Fastify
- PostgreSQL + Prisma ORM
- Redis for caching
- JWT authentication

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Server-side rendering

**Infrastructure:**
- Docker & Docker Compose
- Multi-stage builds
- Health checks

## 🔐 OAuth Integration

Qetta integrates with two OAuth providers:

### 1. Toss Certification (토스 인증)

**Purpose**: Identity verification, simple authentication, electronic signatures

**Flow**: Client Credentials (server-to-server)

```bash
# Test connection
curl -X POST http://localhost:8080/api/v1/oauth/toss/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Configuration:**
```env
TOSS_OAUTH_BASE=https://oauth2.cert.toss.im
TOSS_API_BASE=https://cert.toss.im
TOSS_CLIENT_ID=your_client_id
TOSS_CLIENT_SECRET=your_client_secret
```

### 2. KFTC OpenBanking (금융결제원 오픈뱅킹)

**Purpose**: Bank account balance, transaction history, fund transfers

**Flow**: Authorization Code (user consent required)

```bash
# Initiate OAuth flow
curl http://localhost:8080/api/v1/oauth/kftc/authorize \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Configuration:**
```env
KFTC_API_BASE=https://testapi.openbanking.or.kr
KFTC_CLIENT_ID=your_client_id
KFTC_CLIENT_SECRET=your_client_secret
KFTC_REDIRECT_URI=http://localhost:3000/oauth/kftc/callback
```

### Frontend OAuth Management

Visit **http://localhost:3000/oauth** to:
- View connected providers
- Test Toss connection
- Connect OpenBanking account
- Disconnect providers
- View token expiration

📖 **Detailed Documentation**: See [OAUTH_INTEGRATION.md](OAUTH_INTEGRATION.md)

## 📚 API Documentation

### Base URL
- Development: `http://localhost:8080/api/v1`
- Production: `https://api.yourdomain.com/api/v1`

### Authentication Endpoints

#### Register User
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### OAuth Endpoints

#### Get OAuth Status
```bash
GET /oauth/status
Authorization: Bearer <jwt_token>
```

#### Test Toss Connection
```bash
POST /oauth/toss/test
Authorization: Bearer <jwt_token>
```

#### Initiate KFTC OAuth
```bash
GET /oauth/kftc/authorize
Authorization: Bearer <jwt_token>
```

#### Get Account Balance
```bash
GET /oauth/kftc/balance/:fintechUseNum
Authorization: Bearer <jwt_token>
```

#### Get Transactions
```bash
POST /oauth/kftc/transactions
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "fintechUseNum": "123456789012345678901234",
  "fromDate": "20251001",
  "toDate": "20251026"
}
```

#### Disconnect Provider
```bash
DELETE /oauth/:provider/disconnect
Authorization: Bearer <jwt_token>

# provider: 'toss' or 'kftc'
```

### Document Verification

```bash
POST /verify
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "documentType": "STATEMENT",
  "content": "..."
}
```

📖 **Full API Reference**: See [API.md](services/api/README.md)

## 🚢 Deployment

### Docker Compose (Recommended)

```bash
# Production deployment
NODE_ENV=production docker-compose -f infra/docker-compose.full.yml up -d
```

### Cloud Platforms

**Vercel (Web):**
```bash
cd services/web
vercel deploy --prod
```

**Heroku (API):**
```bash
cd services/api
heroku create qetta-api
heroku addons:create heroku-postgresql:standard-0
heroku addons:create heroku-redis:premium-0
git push heroku main
```

**AWS:**
- API: ECS Fargate or Lambda
- Web: CloudFront + S3 or ECS
- Database: RDS PostgreSQL
- Cache: ElastiCache Redis

📖 **Detailed Deployment Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)

## 💻 Development

### Local Development

```bash
# API service
cd services/api
npm install
npm run dev

# Web service
cd services/web
npm install
npm run dev
```

### Database Migrations

```bash
# Create new migration
cd services/api
npx prisma migrate dev --name migration_name

# Apply migrations
npm run migrate:deploy

# Generate Prisma client
npm run generate
```

### Run Tests

```bash
# Smoke tests
./tools/codex smoke

# Unit tests (when available)
npm test
```

### Environment Variables

All configuration is done via environment variables. Copy `.env.example` to `.env` and customize:

```bash
cp .env.example .env
```

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT signing
- `TOSS_CLIENT_ID` / `TOSS_CLIENT_SECRET` - Toss OAuth credentials
- `KFTC_CLIENT_ID` / `KFTC_CLIENT_SECRET` - KFTC OAuth credentials

## 🔥 Firewall Configuration

### Outbound HTTPS (443)

**Toss Certification:**
```
117.52.3.222
117.52.3.235
211.115.96.222
211.115.96.235
```

**KFTC OpenBanking:**
```
testapi.openbanking.or.kr (testing)
openapi.openbanking.or.kr (production)
```

## 📖 Documentation

- [OAuth Integration Guide](OAUTH_INTEGRATION.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Toss Auth API Guide](toss_auth_api.html)
- [OpenBanking Callback Guide](openbanking_local_callback_guide.html)

## 🐛 Troubleshooting

### Services won't start
```bash
# Check Docker logs
docker-compose logs -f

# Restart services
./setup.sh  # Choose option 3
```

### Database migration fails
```bash
# Reset database (CAUTION: destroys data)
./setup.sh  # Choose option 7
```

### OAuth callback errors
- Verify `KFTC_REDIRECT_URI` matches registered URL
- Check Redis is running: `docker-compose ps redis`
- View API logs: `docker-compose logs api`

## 🤝 Contributing

This is a production-ready starter template. Fork and customize for your needs.

## 📄 License

Private/Commercial - All rights reserved

## 🆘 Support

- Check documentation files in the repository
- Review logs: `./setup.sh` (option 4)
- Open an issue for bugs

---

**Version**: 1.0.0 (2025-10-26)  
**Author**: Qetta Development Team  

Built with ❤️ using Node.js, Next.js, PostgreSQL, and Redis
