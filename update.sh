#!/bin/bash

# Proxmox Manager Portal - Update Script
# Usage: ./update.sh [version]

set -e

echo "🔄 Proxmox Manager Portal - Update Script"
echo "========================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed."
    exit 1
fi

# Get version parameter
VERSION=${1:-"latest"}

echo "📋 Update Configuration:"
echo "   Version: $VERSION"
echo "   Docker Compose File: docker-compose.new.yml"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please configure environment first."
    exit 1
fi

# Backup current data (optional)
echo "💾 Creating backup..."
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup database
echo "   Backing up database..."
docker-compose -f docker-compose.new.yml exec -T postgres pg_dump -U proxmox_user proxmox_portal > "$BACKUP_DIR/database.sql" 2>/dev/null || echo "   Database backup skipped (container not running)"

# Backup environment
cp .env "$BACKUP_DIR/env.backup"

echo "✅ Backup created: $BACKUP_DIR"

# Pull latest changes
echo "📥 Pulling latest changes..."
if [ "$VERSION" = "latest" ]; then
    git pull origin main
else
    git fetch origin
    git checkout "$VERSION"
fi

# Stop services
echo "🛑 Stopping services..."
docker-compose -f docker-compose.new.yml down

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.new.yml up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🏥 Checking service health..."

# Check database
if docker-compose -f docker-compose.new.yml exec -T postgres pg_isready -U proxmox_user -d proxmox_portal > /dev/null 2>&1; then
    echo "✅ Database is ready"
else
    echo "❌ Database is not ready"
    echo "🔄 Attempting to restore from backup..."
    docker-compose -f docker-compose.new.yml exec -T postgres psql -U proxmox_user proxmox_portal < "$BACKUP_DIR/database.sql" 2>/dev/null || echo "   Database restore failed"
    exit 1
fi

# Check backend
if curl -f http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ Backend is ready"
else
    echo "❌ Backend is not ready"
    exit 1
fi

# Check frontend
if curl -f http://localhost:8081 > /dev/null 2>&1; then
    echo "✅ Frontend is ready"
else
    echo "❌ Frontend is not ready"
    exit 1
fi

echo ""
echo "🎉 Update completed successfully!"
echo ""
echo "📱 Access your Proxmox Manager Portal:"
echo "   Frontend: http://localhost:8081"
echo "   Backend API: http://localhost:3002"
echo "   Health Check: http://localhost:3002/health"
echo ""
echo "📊 View logs:"
echo "   docker-compose -f docker-compose.new.yml logs -f"
echo ""
echo "🔄 Rollback if needed:"
echo "   git checkout $(git log --oneline -2 | tail -1 | cut -d' ' -f1)"
echo "   ./update.sh"
echo ""
echo "💾 Backup location: $BACKUP_DIR"
