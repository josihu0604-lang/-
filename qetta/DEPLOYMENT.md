# Qetta Deployment Guide

## Quick Start (Development)

### 1. Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- PostgreSQL 14+ (if not using Docker)
- Redis 6+ (if not using Docker)

### 2. Environment Setup

```bash
# Clone/extract the project
cd qetta

# Copy environment configuration
cp .env.example .env

# Edit .env with your actual credentials (optional for testing)
nano .env
```

### 3. Start with Docker Compose

```bash
# Start all services (API, Web, PostgreSQL, Redis)
docker-compose -f infra/docker-compose.full.yml up -d

# Check logs
docker-compose -f infra/docker-compose.full.yml logs -f

# Access services:
# - API: http://localhost:8080
# - Web: http://localhost:3000
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
```

### 4. Run Database Migrations

```bash
# If using Docker
docker-compose -f infra/docker-compose.full.yml exec api npm run migrate:deploy

# If running locally
cd services/api
npm install
npm run migrate:deploy
npm run seed  # Optional: seed test data
```

### 5. Verify Installation

```bash
# Health check
curl http://localhost:8080/health

# Expected response:
# {"status":"ok","ts":"2025-10-26T..."}
```

## OAuth Integration Setup

### Toss Certification

1. **Test Mode** (default):
   - Uses provided test credentials
   - No additional setup needed

2. **Production Mode**:
   ```bash
   # Get production credentials from Toss
   # Update in .env:
   TOSS_CLIENT_ID=your_production_client_id
   TOSS_CLIENT_SECRET=your_production_client_secret
   ```

3. **Test Connection**:
   ```bash
   # Register/login first
   curl -X POST http://localhost:8080/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'

   # Get JWT token from response, then test Toss
   curl -X POST http://localhost:8080/api/v1/oauth/toss/test \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### KFTC OpenBanking

1. **Register Callback URL**:
   - Visit https://testapi.openbanking.or.kr
   - Login with credentials from `토스페이먼츠.txt`
   - Go to MY PAGE → API Key 관리
   - Add Callback URL: `http://localhost:3000/oauth/kftc/callback`
   - Or for production: `https://yourdomain.com/oauth/kftc/callback`

2. **Update Environment**:
   ```bash
   # In .env
   KFTC_REDIRECT_URI=http://localhost:3000/oauth/kftc/callback
   # Or for production:
   KFTC_REDIRECT_URI=https://yourdomain.com/oauth/kftc/callback
   ```

3. **Test Connection**:
   - Visit http://localhost:3000/oauth
   - Click "🔗 OpenBanking 연결"
   - Complete authorization in popup
   - Verify connection status

## Production Deployment

### Option 1: Docker Compose (Recommended)

```bash
# Update .env for production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@db-host:5432/qetta
REDIS_URL=redis://redis-host:6379/0

# Production URLs
API_URL=https://api.yourdomain.com
WEB_URL=https://yourdomain.com

# OAuth callbacks
KFTC_REDIRECT_URI=https://yourdomain.com/oauth/kftc/callback

# Start services
docker-compose -f infra/docker-compose.full.yml up -d

# Check status
docker-compose -f infra/docker-compose.full.yml ps
```

### Option 2: Kubernetes

```yaml
# Example k8s deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qetta-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: qetta-api
  template:
    metadata:
      labels:
        app: qetta-api
    spec:
      containers:
      - name: api
        image: qetta-api:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: qetta-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: qetta-secrets
              key: redis-url
        ports:
        - containerPort: 8080
```

### Option 3: Cloud Platforms

#### Vercel (Web Service)
```bash
cd services/web
vercel deploy --prod
```

#### Heroku (API Service)
```bash
cd services/api
heroku create qetta-api
heroku addons:create heroku-postgresql:standard-0
heroku addons:create heroku-redis:premium-0
git push heroku main
```

#### AWS (Complete Stack)
- **API**: ECS Fargate or Lambda
- **Web**: CloudFront + S3 (static) or ECS
- **Database**: RDS PostgreSQL
- **Cache**: ElastiCache Redis

## Firewall Configuration

### Outbound Rules

Allow HTTPS (443) to:

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

### Inbound Rules

```
Port 8080 (API)
Port 3000 (Web - dev)
Port 80/443 (Web - production)
```

## Environment Variables Reference

### Core Configuration
```bash
NODE_ENV=production
PORT=8080
JWT_SECRET=<generate-secure-random-string>
CORS_ORIGINS=https://yourdomain.com
API_URL=https://api.yourdomain.com
WEB_URL=https://yourdomain.com
```

### Database & Cache
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname?schema=public
REDIS_URL=redis://host:6379/0
```

### Stripe (Optional)
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ENTERPRISE=price_...
```

### Toss Certification
```bash
TOSS_OAUTH_BASE=https://oauth2.cert.toss.im
TOSS_API_BASE=https://cert.toss.im
TOSS_CLIENT_ID=<your_client_id>
TOSS_CLIENT_SECRET=<your_client_secret>
TOSS_SCOPE=ca
```

### KFTC OpenBanking
```bash
KFTC_API_BASE=https://openapi.openbanking.or.kr
KFTC_CLIENT_ID=<your_client_id>
KFTC_CLIENT_SECRET=<your_client_secret>
KFTC_REDIRECT_URI=https://yourdomain.com/oauth/kftc/callback
KFTC_SCOPE=login inquiry
```

### Frontend (Next.js)
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

## Monitoring & Logs

### Docker Logs
```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f api
docker-compose logs -f web
```

### Application Logs
- API logs use Pino logger (JSON format)
- Logs go to stdout (captured by Docker/k8s)

### Health Checks
```bash
# API health
curl https://api.yourdomain.com/health

# Check OAuth status
curl https://api.yourdomain.com/api/v1/oauth/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Backup & Recovery

### Database Backup
```bash
# Manual backup
docker-compose exec db pg_dump -U qetta qetta > backup.sql

# Restore
docker-compose exec -T db psql -U qetta qetta < backup.sql
```

### Redis Backup
```bash
# Manual backup (RDB snapshot)
docker-compose exec redis redis-cli BGSAVE
```

## Troubleshooting

### API won't start
```bash
# Check database connection
docker-compose exec api npm run migrate:deploy

# Check logs
docker-compose logs api

# Verify environment
docker-compose exec api env | grep DATABASE_URL
```

### OAuth callback fails
```bash
# Verify callback URL is registered
# Check Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

### Database migration issues
```bash
# Reset database (CAUTION: destroys data)
docker-compose down -v
docker-compose up -d db
docker-compose exec api npm run migrate:deploy
```

## Performance Tuning

### PostgreSQL
```bash
# Increase connections
DATABASE_URL=postgresql://user:pass@host:5432/db?max_connections=20
```

### Redis
```bash
# Use connection pooling
REDIS_URL=redis://host:6379/0?maxRetriesPerRequest=3
```

### Node.js
```bash
# Increase memory limit
NODE_OPTIONS=--max-old-space-size=4096
```

## Security Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Use HTTPS in production (TLS certificate)
- [ ] Set strong database passwords
- [ ] Configure CORS_ORIGINS to specific domains
- [ ] Enable rate limiting (already configured)
- [ ] Use production OAuth credentials (not test)
- [ ] Set up firewall rules
- [ ] Enable database backups
- [ ] Monitor for unusual activity
- [ ] Keep dependencies updated
- [ ] Use secrets management (not .env in production)

## Scaling

### Horizontal Scaling
```bash
# Scale API instances
docker-compose up -d --scale api=3

# Or in k8s
kubectl scale deployment qetta-api --replicas=5
```

### Database Scaling
- Use read replicas for read-heavy workloads
- Consider connection pooling (PgBouncer)
- Enable query caching in Redis

### CDN
- Serve static assets via CDN
- Cache API responses where appropriate
- Use CloudFront, Cloudflare, or similar

## Support

For issues or questions:
- Check OAUTH_INTEGRATION.md for OAuth-specific help
- Review logs: `docker-compose logs -f`
- Open an issue in the repository
- Contact: qetta-support@example.com

---

**Last Updated**: 2025-10-26  
**Version**: 1.0.0
