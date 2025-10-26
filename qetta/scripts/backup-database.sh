#!/bin/bash
#
# Database Backup Script for qetta Production
#
# This script creates a backup of the PostgreSQL database
# and uploads it to cloud storage (GCS/S3)
#
# Usage: ./scripts/backup-database.sh
#

set -euo pipefail

# Configuration
NAMESPACE="qetta-production"
POD_NAME=$(kubectl get pod -n $NAMESPACE -l component=database -o jsonpath='{.items[0].metadata.name}')
BACKUP_DIR="/tmp/qetta-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="qetta_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Create backup directory
mkdir -p "$BACKUP_DIR"

log "Starting database backup..."

# Get database credentials
DB_USER=$(kubectl get secret postgres-credentials -n $NAMESPACE -o jsonpath='{.data.username}' | base64 -d)
DB_NAME="qetta"

# Perform backup
log "Creating backup from pod: $POD_NAME"
kubectl exec -n $NAMESPACE $POD_NAME -- pg_dump -U $DB_USER -d $DB_NAME | gzip > "$BACKUP_DIR/$BACKUP_FILE"

if [ -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    log "Backup created successfully: $BACKUP_FILE (${BACKUP_SIZE})"
else
    error "Backup failed!"
    exit 1
fi

# Upload to cloud storage (example: Google Cloud Storage)
# Uncomment and configure for your cloud provider
#
# For GCS:
# gsutil cp "$BACKUP_DIR/$BACKUP_FILE" gs://qetta-backups/database/
#
# For AWS S3:
# aws s3 cp "$BACKUP_DIR/$BACKUP_FILE" s3://qetta-backups/database/
#
log "Uploading backup to cloud storage..."
# gsutil cp "$BACKUP_DIR/$BACKUP_FILE" gs://qetta-backups/database/

# Clean up old local backups
log "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "qetta_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

log "Backup completed successfully!"
log "Backup file: $BACKUP_DIR/$BACKUP_FILE"

# Send notification (optional)
# curl -X POST $SLACK_WEBHOOK_URL -d "{\"text\":\"✅ Database backup completed: $BACKUP_FILE\"}"
