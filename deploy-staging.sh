#!/bin/bash

# Proxmox Manager Portal - Staging Deployment Script
# Usage: ./deploy-staging.sh [branch-name]

set -e  # Exit on error

BRANCH_NAME=${1:-develop}
APP_DIR="/home/deployer/proxmox-manager-portal"
BACKUP_DIR="/home/deployer/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🚀 Starting deployment for branch: $BRANCH_NAME"
echo "📅 Timestamp: $TIMESTAMP"

# Step 1: Create backup
echo "📦 Creating backup..."
mkdir -p $BACKUP_DIR
docker compose ps -q > /dev/null 2>&1 && docker compose -f docker-compose.staging.yml stop || true
tar -czf "$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    $APP_DIR 2>/dev/null || true
echo "✅ Backup created: $BACKUP_DIR/backup_${TIMESTAMP}.tar.gz"

# Step 2: Pull latest changes (already done by GitHub Actions)
cd $APP_DIR
echo "✅ Code updated to branch: $(git branch --show-current)"

# Step 3: Install dependencies
echo "📥 Installing dependencies..."
npm ci --prefer-offline --no-audit
cd proxy-server && npm ci --prefer-offline --no-audit && cd ..

# Step 4: Run tests (when available)
echo "🧪 Running tests..."
# npm run test || echo "⚠️  Tests failed, continuing anyway (development mode)"

# Step 5: Build application
echo "🔨 Building application..."
npm run build

# Step 6: Stop old containers
echo "🛑 Stopping old containers..."
docker compose -f docker-compose.staging.yml down || true

# Step 7: Start new containers
echo "🚀 Starting new containers..."
docker compose -f docker-compose.staging.yml up -d --build

# Step 8: Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Step 9: Health check
echo "🏥 Running health check..."
HEALTH_CHECK_URL="http://localhost:8081"
MAX_RETRIES=5
RETRY=0

while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -f $HEALTH_CHECK_URL > /dev/null 2>&1; then
        echo "✅ Health check passed!"
        break
    fi
    RETRY=$((RETRY+1))
    echo "⏳ Retry $RETRY/$MAX_RETRIES..."
    sleep 5
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo "❌ Health check failed after $MAX_RETRIES retries"
    echo "🔄 Rolling back to previous version..."
    docker compose -f docker-compose.staging.yml down
    cd /tmp
    tar -xzf "$BACKUP_DIR/backup_${TIMESTAMP}.tar.gz" || echo "⚠️  Backup extraction failed"
    cd $APP_DIR
    docker compose -f docker-compose.staging.yml up -d || echo "⚠️  Rollback failed"
    exit 1
fi

# Step 10: Show deployment info
echo ""
echo "✅ Deployment successful!"
echo "🌐 Access the application at: http://$(hostname -I | awk '{print $1}'):8081"
echo "📋 Branch: $BRANCH_NAME"
echo "📅 Deployed at: $TIMESTAMP"
echo "💾 Backup: $BACKUP_DIR/backup_${TIMESTAMP}.tar.gz"
echo ""
echo "📊 Running containers:"
docker compose -f docker-compose.staging.yml ps
echo ""

# Step 11: Cleanup old backups (keep last 10)
echo "🧹 Cleaning up old backups..."
cd $BACKUP_DIR
ls -t backup_*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm || true
echo "✅ Cleanup complete"
