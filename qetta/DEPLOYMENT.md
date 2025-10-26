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

**Automatic Rollback** (via CI/CD):
The GitHub Actions workflow includes automatic rollback on failure:
- Pre-deployment state is saved
- Health checks verify service functionality
- Failed deployments trigger automatic rollback
- Rollback completes within 3 minutes

**Manual Rollback**:
```bash
# Rollback to previous version
kubectl rollout undo deployment/qetta-api -n qetta-production
kubectl rollout undo deployment/qetta-web -n qetta-production

# Rollback to specific revision
kubectl rollout undo deployment/qetta-api --to-revision=2 -n qetta-production

# Check rollout history
kubectl rollout history deployment/qetta-api -n qetta-production

# Verify rollback status
kubectl rollout status deployment/qetta-api -n qetta-production
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
   - **Deploy**: Deploy to Kubernetes cluster with health checks
     - Save pre-deployment state for rollback
     - Apply Kubernetes manifests
     - Wait for rollout completion (8min timeout per service)
     - Health check API: `/health` endpoint
     - Health check Web: Root `/` endpoint
     - Automatic rollback on failure
   - **Notify**: Send Slack notification with deployment status

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
-- Add indexes (already created via Prisma migrations)
-- Verify indexes exist
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public';

-- Vacuum and analyze (run periodically)
VACUUM ANALYZE;

-- Check table statistics
SELECT relname, n_tup_ins, n_tup_upd, n_tup_del
FROM pg_stat_user_tables
WHERE schemaname = 'public';
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

## Security Configuration

### Container Security Contexts

All deployments include hardened security contexts:

**API Deployment** (`k8s/api/deployment.yaml`):
```yaml
securityContext:
  allowPrivilegeEscalation: false
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: false  # PDFKit needs write access
  capabilities:
    drop:
    - ALL
```

**Web Deployment** (`k8s/web/deployment.yaml`):
```yaml
securityContext:
  allowPrivilegeEscalation: false
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true  # Next.js can run read-only
  capabilities:
    drop:
    - ALL
```

**Pod-Level Security** (both deployments):
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000
  seccompProfile:
    type: RuntimeDefault
```

### Network Policies

Network segmentation is enforced via Kubernetes NetworkPolicies (`k8s/network-policy.yaml`):

**1. API Network Policy**
- **Ingress**: Only from web pods on port 3001
- **Egress**: Only to database on port 5432, DNS, and HTTPS

**2. Web Network Policy**
- **Ingress**: Only from ingress controller on port 3000
- **Egress**: Only to API on port 3001, DNS, and HTTPS

**3. Database Network Policy**
- **Ingress**: Only from API pods on port 5432
- **Egress**: DNS only (no external access)

**4. Redis Network Policy**
- **Ingress**: Only from API pods on port 6379
- **Egress**: DNS only (no external access)

Deploy network policies:
```bash
kubectl apply -f k8s/network-policy.yaml

# Verify policies
kubectl get networkpolicy -n qetta-production
kubectl describe networkpolicy qetta-api-network-policy -n qetta-production
```

### Pod Disruption Budgets

High availability during cluster maintenance (`k8s/pod-disruption-budget.yaml`):

**API PDB**:
- Minimum 2 pods always available
- Prevents service disruption during node drains

**Web PDB**:
- Minimum 2 pods always available
- Ensures frontend availability during updates

Deploy PDBs:
```bash
kubectl apply -f k8s/pod-disruption-budget.yaml

# Verify PDBs
kubectl get pdb -n qetta-production
kubectl describe pdb qetta-api-pdb -n qetta-production
```

### Security Checklist

- ✅ Secrets stored in Kubernetes Secrets
- ✅ Non-root containers (UID 1000)
- ✅ Resource limits configured
- ✅ Network policies implemented (4 policies)
- ✅ Pod disruption budgets configured
- ✅ Privilege escalation blocked
- ✅ All capabilities dropped
- ✅ Seccomp profile enabled (RuntimeDefault)
- ✅ SSL/TLS enabled
- ✅ Regular security updates
- ✅ Audit logging enabled

## Health Checks

### Manual Health Verification

**API Health Check**:
```bash
# From inside cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n qetta-production -- \
  curl -f http://qetta-api:3001/health

# From API pod
POD=$(kubectl get pod -n qetta-production -l component=api -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n qetta-production $POD -- curl -f http://localhost:3001/health

# Expected response: {"status":"healthy","timestamp":"..."}
```

**Web Health Check**:
```bash
# From inside cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n qetta-production -- \
  curl -f http://qetta-web:3000/

# From web pod
POD=$(kubectl get pod -n qetta-production -l component=web -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n qetta-production $POD -- curl -f http://localhost:3000/

# Expected response: HTML content (200 OK)
```

**Database Health Check**:
```bash
# PostgreSQL
kubectl exec -n qetta-production qetta-postgres-0 -- pg_isready

# Redis
kubectl exec -n qetta-production qetta-redis-0 -- redis-cli ping
```

## Support

For issues and questions:
- Check logs: `kubectl logs -f -l app=qetta -n qetta-production`
- Review events: `kubectl get events -n qetta-production`
- Verify network policies: `kubectl get networkpolicy -n qetta-production`
- Check pod disruption budgets: `kubectl get pdb -n qetta-production`
- Run health checks (see above)
- Contact DevOps team
- Check Sentry for errors

## References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Fastify Deployment](https://fastify.dev/docs/latest/Guides/Deployment/)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
