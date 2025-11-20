#!/bin/bash

# Proxmox Manager Portal - Docker Deployment Script
# Version 0.9.0

set -e

echo "🚀 Proxmox Manager Portal - Docker Deployment"
echo "=============================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp production.env.template .env
    echo "📝 Please edit .env file with your configuration before running again."
    echo "   Important: Change DB_PASSWORD and JWT_SECRET!"
    exit 1
fi

# Load environment variables
source .env

echo "📋 Configuration:"
echo "   Frontend Port: ${FRONTEND_PORT:-8081}"
echo "   Backend Port: ${BACKEND_PORT:-3002}"
echo "   Database Port: ${DATABASE_PORT:-5432}"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p ssl
mkdir -p data

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.new.yml up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🏥 Checking service health..."

# Check database
if docker-compose -f docker-compose.new.yml exec -T postgres pg_isready -U proxmox_user -d proxmox_portal; then
    echo "✅ Database is ready"
else
    echo "❌ Database is not ready"
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
echo "🎉 Deployment completed successfully!"
echo ""
echo "📱 Access your Proxmox Manager Portal:"
echo "   Frontend: http://localhost:8081"
echo "   Backend API: http://localhost:3002"
echo "   Health Check: http://localhost:3002/health"
echo ""
echo "🔐 Default Admin Credentials:"
echo "   Email: peter.skaugvold@waive.no"
echo "   Password: Admin123!"
echo "   ⚠️  Please change this password immediately!"
echo ""
echo "📊 View logs:"
echo "   docker-compose -f docker-compose.new.yml logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose -f docker-compose.new.yml down"
echo ""
echo "🔄 Update services:"
echo "   git pull && docker-compose -f docker-compose.new.yml up -d --build"
