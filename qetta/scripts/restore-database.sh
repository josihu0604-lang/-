#!/bin/bash
#
# Database Restore Script for qetta Production
#
# This script restores a PostgreSQL database backup
#
# Usage: ./scripts/restore-database.sh <backup_file>
#

set -euo pipefail

if [ $# -ne 1 ]; then
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 /tmp/qetta-backups/qetta_backup_20250126_120000.sql.gz"
    exit 1
fi

BACKUP_FILE=$1
NAMESPACE="qetta-production"
POD_NAME=$(kubectl get pod -n $NAMESPACE -l component=database -o jsonpath='{.items[0].metadata.name}')

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Validate backup file
if [ ! -f "$BACKUP_FILE" ]; then
    error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

warn "⚠️  WARNING: This will REPLACE the current database!"
echo -n "Type 'yes' to continue: "
read confirmation

if [ "$confirmation" != "yes" ]; then
    log "Restore cancelled."
    exit 0
fi

# Get database credentials
DB_USER=$(kubectl get secret postgres-credentials -n $NAMESPACE -o jsonpath='{.data.username}' | base64 -d)
DB_NAME="qetta"

log "Starting database restore from: $BACKUP_FILE"

# Scale down API pods to prevent connections during restore
log "Scaling down API pods..."
kubectl scale deployment qetta-api -n $NAMESPACE --replicas=0

# Wait for pods to terminate
sleep 10

# Drop existing connections
log "Terminating existing connections..."
kubectl exec -n $NAMESPACE $POD_NAME -- psql -U $DB_USER -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DB_NAME' AND pid <> pg_backend_pid();"

# Drop and recreate database
log "Recreating database..."
kubectl exec -n $NAMESPACE $POD_NAME -- psql -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
kubectl exec -n $NAMESPACE $POD_NAME -- psql -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"

# Restore backup
log "Restoring backup..."
gunzip -c "$BACKUP_FILE" | kubectl exec -i -n $NAMESPACE $POD_NAME -- psql -U $DB_USER -d $DB_NAME

# Scale API pods back up
log "Scaling API pods back up..."
kubectl scale deployment qetta-api -n $NAMESPACE --replicas=3

# Wait for rollout
kubectl rollout status deployment/qetta-api -n $NAMESPACE --timeout=3m

log "✅ Database restore completed successfully!"

# Verify
log "Verifying restore..."
kubectl exec -n $NAMESPACE $POD_NAME -- psql -U $DB_USER -d $DB_NAME -c "\dt"
