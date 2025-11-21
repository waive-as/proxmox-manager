#!/bin/bash
# test-local.sh - Test the application locally with Docker Compose

set -e

echo "🧪 Testing Proxmox Manager Portal Locally"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found!"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and set secure passwords!"
    echo "   - POSTGRES_PASSWORD"
    echo "   - JWT_SECRET (use: openssl rand -base64 32)"
    echo "   - JWT_REFRESH_SECRET (use: openssl rand -base64 32)"
    echo ""
    read -p "Press Enter after updating .env or Ctrl+C to cancel..."
fi

# Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker compose -f docker-compose.local.yml down -v 2>/dev/null || true
echo ""

# Build and start services
echo "🏗️  Building images from source..."
echo "This may take 5-10 minutes on first run..."
echo ""
docker compose -f docker-compose.local.yml build

echo ""
echo "🚀 Starting services..."
docker compose -f docker-compose.local.yml up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
echo ""

# Wait for services to be healthy
attempt=1
max_attempts=30

while [ $attempt -le $max_attempts ]; do
    echo -n "   Attempt $attempt/$max_attempts: "

    # Check all services
    postgres_health=$(docker inspect proxmox-db-local --format='{{.State.Health.Status}}' 2>/dev/null || echo "starting")
    backend_health=$(docker inspect proxmox-backend-local --format='{{.State.Health.Status}}' 2>/dev/null || echo "starting")
    proxy_health=$(docker inspect proxmox-proxy-local --format='{{.State.Health.Status}}' 2>/dev/null || echo "starting")
    frontend_health=$(docker inspect proxmox-frontend-local --format='{{.State.Health.Status}}' 2>/dev/null || echo "starting")

    echo "DB=$postgres_health, Backend=$backend_health, Proxy=$proxy_health, Frontend=$frontend_health"

    if [ "$postgres_health" = "healthy" ] && \
       [ "$backend_health" = "healthy" ] && \
       [ "$proxy_health" = "healthy" ] && \
       [ "$frontend_health" = "healthy" ]; then
        echo ""
        echo "✅ All services are healthy!"
        break
    fi

    if [ $attempt -eq $max_attempts ]; then
        echo ""
        echo "❌ Services did not become healthy in time"
        echo ""
        echo "📋 Checking logs..."
        docker compose -f docker-compose.local.yml logs --tail=50
        exit 1
    fi

    sleep 10
    attempt=$((attempt + 1))
done

echo ""
echo "✨ Application is ready!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Access the application:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "   Frontend:  http://localhost:8080"
echo "   Backend:   http://localhost:3002/health"
echo "   Proxy:     http://localhost:3001/health"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Next steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Open http://localhost:8080 in your browser"
echo "2. You should see the Setup Wizard (first-time setup)"
echo "3. Create an admin account"
echo "4. Login and add your Proxmox server"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Useful commands:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "View logs:"
echo "  docker compose -f docker-compose.local.yml logs -f"
echo ""
echo "View specific service logs:"
echo "  docker compose -f docker-compose.local.yml logs -f backend"
echo "  docker compose -f docker-compose.local.yml logs -f frontend"
echo ""
echo "Stop services:"
echo "  docker compose -f docker-compose.local.yml down"
echo ""
echo "Stop and remove all data:"
echo "  docker compose -f docker-compose.local.yml down -v"
echo ""
echo "Restart a service:"
echo "  docker compose -f docker-compose.local.yml restart backend"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
