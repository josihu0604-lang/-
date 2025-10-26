# qetta Production Deployment Guide

This document provides comprehensive instructions for deploying qetta to production using Kubernetes.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Deployment Process](#deployment-process)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring](#monitoring)
- [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- `kubectl` v1.28+
- `docker` v24+
- `helm` v3.12+ (optional, for package management)
- Access to Kubernetes cluster
- GitHub account with repository access

### Cloud Resources

- Kubernetes cluster (GKE, EKS, AKS, or self-hosted)
- Container registry (GHCR, GCR, ECR, or DockerHub)
- Cloud storage for backups (GCS, S3, or Azure Blob)
- SSL certificates (Let's Encrypt recommended)

### External Services

- Toss Payments account (production credentials)
- NICE API account (production credentials)
- Sentry account (optional, for error tracking)
- DataDog account (optional, for monitoring)

## Initial Setup

### 1. Create Kubernetes Namespace

```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. Configure Secrets

Create production secrets (DO NOT commit these):

```bash
# Database credentials
kubectl create secret generic postgres-credentials \
  --from-literal=username=qetta \
  --from-literal=password=YOUR_SECURE_PASSWORD \
  -n qetta-production

# Redis credentials
kubectl create secret generic redis-credentials \
  --from-literal=password=YOUR_REDIS_PASSWORD \
  -n qetta-production

# Application secrets
kubectl create secret generic qetta-secrets \
  --from-literal=database-url="postgresql://qetta:PASSWORD@qetta-postgres:5432/qetta?schema=public" \
  --from-literal=redis-url="redis://:PASSWORD@qetta-redis:6379" \
  --from-literal=jwt-secret="YOUR_JWT_SECRET_MINIMUM_32_CHARS" \
  --from-literal=encryption-key="YOUR_ENCRYPTION_KEY_32_CHARS" \
  --from-literal=toss-client-key="YOUR_TOSS_CLIENT_KEY" \
  --from-literal=toss-secret-key="YOUR_TOSS_SECRET_KEY" \
  --from-literal=nice-client-id="YOUR_NICE_CLIENT_ID" \
  --from-literal=nice-secret-key="YOUR_NICE_SECRET_KEY" \
  --from-literal=sentry-dsn="YOUR_SENTRY_DSN" \
  --from-literal=datadog-api-key="YOUR_DATADOG_API_KEY" \
  -n qetta-production
```

### 3. Configure Ingress

Update `k8s/ingress.yaml` with your domain:

- Replace `qetta.co.kr` with your actual domain
- Configure SSL certificates (cert-manager recommended)
- Adjust rate limiting and CORS settings

### 4. Deploy Database

```bash
# Deploy PostgreSQL
kubectl apply -f k8s/database/postgres-statefulset.yaml

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l component=database -n qetta-production --timeout=5m

# Deploy Redis
kubectl apply -f k8s/database/redis-statefulset.yaml

# Wait for Redis to be ready
kubectl wait --for=condition=ready pod -l component=cache -n qetta-production --timeout=5m
```

### 5. Run Database Migrations

```bash
# Get API pod name
POD_NAME=$(kubectl get pod -n qetta-production -l component=api -o jsonpath='{.items[0].metadata.name}')

# Run migrations
kubectl exec -n qetta-production $POD_NAME -- npm run migrate:deploy
```

## Deployment Process

### Manual Deployment

```bash
# Apply all manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/database/
kubectl apply -f k8s/pvc.yaml
kubectl apply -f k8s/api/
kubectl apply -f k8s/web/
kubectl apply -f k8s/ingress.yaml

# Verify deployment
kubectl get pods -n qetta-production
kubectl get services -n qetta-production
kubectl get ingress -n qetta-production
```

### Rolling Update

```bash
# Update API image
kubectl set image deployment/qetta-api \
  api=ghcr.io/your-org/qetta-api:NEW_TAG \
  -n qetta-production

# Update Web image
kubectl set image deployment/qetta-web \
  web=ghcr.io/your-org/qetta-web:NEW_TAG \
  -n qetta-production

# Monitor rollout
kubectl rollout status deployment/qetta-api -n qetta-production
kubectl rollout status deployment/qetta-web -n qetta-production
```

### Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/qetta-api -n qetta-production
kubectl rollout undo deployment/qetta-web -n qetta-production

# Rollback to specific revision
kubectl rollout undo deployment/qetta-api --to-revision=2 -n qetta-production
```

## CI/CD Pipeline

### GitHub Actions Setup

1. **Add Repository Secrets**:
   - Go to Settings > Secrets and variables > Actions
   - Add the following secrets:
     - `KUBE_CONFIG`: Base64-encoded kubeconfig file
     - `SLACK_WEBHOOK_URL`: Slack webhook for notifications

2. **Trigger Deployment**:
   - Push to `main` branch triggers automatic deployment
   - Manual trigger: Go to Actions > Deploy to Production > Run workflow

3. **Pipeline Stages**:
   - **Test**: Run unit and integration tests
   - **Build**: Build and push Docker images
   - **Deploy**: Deploy to Kubernetes cluster
   - **Notify**: Send Slack notification

## Monitoring

### Sentry (Error Tracking)

1. Create Sentry project at https://sentry.io
2. Copy DSN and add to secrets
3. Errors are automatically reported

### DataDog (APM & Metrics)

1. Create DataDog account at https://datadoghq.com
2. Install DataDog agent in cluster:

```bash
helm repo add datadog https://helm.datadoghq.com
helm repo update

helm install datadog datadog/datadog \
  --set datadog.apiKey=YOUR_API_KEY \
  --set datadog.site=datadoghq.com \
  --namespace qetta-production
```

### Kubernetes Dashboard

```bash
# Install metrics-server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# View resource usage
kubectl top pods -n qetta-production
kubectl top nodes
```

### Logs

```bash
# View API logs
kubectl logs -f deployment/qetta-api -n qetta-production

# View Web logs
kubectl logs -f deployment/qetta-web -n qetta-production

# View logs with label selector
kubectl logs -l app=qetta -n qetta-production --tail=100

# Stream logs from all containers
kubectl logs -f -l app=qetta -n qetta-production --all-containers=true
```

## Backup & Recovery

### Automated Daily Backups

Deploy the backup CronJob:

```bash
kubectl apply -f k8s/cronjob-backup.yaml
```

This runs daily at 2 AM KST and:
- Creates PostgreSQL dump
- Uploads to cloud storage
- Retains last 30 days of backups

### Manual Backup

```bash
./scripts/backup-database.sh
```

### Restore from Backup

```bash
# Download backup from cloud storage
gsutil cp gs://qetta-backups/database/qetta_backup_20250126_120000.sql.gz /tmp/

# Restore database
./scripts/restore-database.sh /tmp/qetta_backup_20250126_120000.sql.gz
```

### Disaster Recovery

1. **Total Cluster Failure**:
   ```bash
   # Create new cluster
   # Deploy from scratch
   kubectl apply -f k8s/
   
   # Restore latest backup
   ./scripts/restore-database.sh LATEST_BACKUP
   ```

2. **Data Corruption**:
   ```bash
   # Scale down API
   kubectl scale deployment qetta-api -n qetta-production --replicas=0
   
   # Restore from backup
   ./scripts/restore-database.sh GOOD_BACKUP
   
   # Verify data
   # Scale up API
   kubectl scale deployment qetta-api -n qetta-production --replicas=3
   ```

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl describe pod POD_NAME -n qetta-production

# Check logs
kubectl logs POD_NAME -n qetta-production

# Check events
kubectl get events -n qetta-production --sort-by='.lastTimestamp'
```

### Database Connection Issues

```bash
# Test connection from API pod
kubectl exec -it POD_NAME -n qetta-production -- \
  psql $DATABASE_URL -c "SELECT 1"

# Check database pod
kubectl logs -l component=database -n qetta-production
```

### High Memory/CPU Usage

```bash
# Check resource usage
kubectl top pods -n qetta-production

# Scale horizontally
kubectl scale deployment/qetta-api --replicas=5 -n qetta-production

# Adjust resource limits in deployment.yaml
```

### SSL Certificate Issues

```bash
# Check cert-manager
kubectl get certificates -n qetta-production
kubectl describe certificate qetta-tls-cert -n qetta-production

# Renew certificate
kubectl delete certificate qetta-tls-cert -n qetta-production
kubectl apply -f k8s/ingress.yaml
```

### Ingress Not Working

```bash
# Check ingress
kubectl describe ingress qetta-ingress -n qetta-production

# Check nginx ingress controller
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller

# Test from inside cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://qetta-api.qetta-production.svc.cluster.local:3001/health
```

## Performance Tuning

### Database Optimization

```sql
-- Add indexes
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_analysis_user ON "PremiumAnalysis"(userId, createdAt DESC);

-- Vacuum and analyze
VACUUM ANALYZE;
```

### Redis Optimization

```bash
# Adjust maxmemory policy in redis-statefulset.yaml
# allkeys-lru: Evict least recently used keys
# allkeys-lfu: Evict least frequently used keys
```

### API Performance

- Enable response compression
- Implement caching headers
- Use connection pooling
- Enable HTTP/2

## Security Checklist

- ✅ Secrets stored in Kubernetes Secrets
- ✅ Non-root containers
- ✅ Resource limits configured
- ✅ Network policies (optional, implement as needed)
- ✅ SSL/TLS enabled
- ✅ Regular security updates
- ✅ Audit logging enabled

## Support

For issues and questions:
- Check logs: `kubectl logs -f -l app=qetta -n qetta-production`
- Review events: `kubectl get events -n qetta-production`
- Contact DevOps team
- Check Sentry for errors

## References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Fastify Deployment](https://fastify.dev/docs/latest/Guides/Deployment/)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
