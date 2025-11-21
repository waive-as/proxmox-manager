# Docker Compose Testing Guide

This guide will help you test the Proxmox Manager Portal using Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- At least 2GB of free RAM
- Ports 8080, 3001, 3002, 5432 available

## Quick Start

###1. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Generate secure secrets
openssl rand -base64 32  # Use for JWT_SECRET
openssl rand -base64 32  # Use for JWT_REFRESH_SECRET

# Edit .env file
vi .env
```

Update these critical values in `.env`:
```env
# Database
POSTGRES_PASSWORD=your_secure_password_here

# JWT Secrets (use the openssl output from above)
JWT_SECRET=your_generated_secret_here
JWT_REFRESH_SECRET=your_generated_refresh_secret_here
```

### 2. Build and Start Services

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

This will start:
- **PostgreSQL** database on port 5432 (internal)
- **Backend API** on port 3002 (internal)
- **Proxy Server** on port 3001 (internal)
- **Frontend** on port 8080 (accessible)

### 3. Access the Application

Open your browser and navigate to:
```
http://localhost:8080
```

On first visit, you'll see the **Setup Wizard** to create the admin account.

### 4. Initial Setup

1. Create admin user via the setup wizard
2. Log in with your admin credentials
3. Go to **Settings > Servers** to add your first Proxmox server
4. Enter your Proxmox server details:
   - Name: Friendly name for the server
   - Host: IP or hostname of your Proxmox server
   - Port: Usually 8006
   - Token ID: API token ID from Proxmox
   - Token Secret: API token secret from Proxmox

## Service URLs

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3002 (internal)
- **Proxy Server**: http://localhost:3001 (internal)
- **Backend Health**: http://localhost:3002/health
- **Proxy Health**: http://localhost:3001/health

## Docker Compose Commands

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f proxy
docker-compose logs -f postgres

# Rebuild services
docker-compose build

# Rebuild specific service
docker-compose build backend

# Restart a service
docker-compose restart backend
```

## Troubleshooting

### Services Not Starting

**Check logs:**
```bash
docker-compose logs -f
```

**Check service health:**
```bash
docker-compose ps
```

All services should show as "healthy" after a minute.

### Database Connection Errors

**Check PostgreSQL is running:**
```bash
docker-compose logs postgres
```

**Verify DATABASE_URL in backend:**
```bash
docker-compose exec backend env | grep DATABASE_URL
```

### Frontend Can't Connect to Backend

**Check backend is healthy:**
```bash
curl http://localhost:3002/health
```

**Check environment variables:**
```bash
docker-compose exec frontend env | grep VITE_
```

### Permission Errors

If you see permission errors, ensure Docker has access to the project directory.

**On macOS/Linux:**
```bash
chmod +x docker-entrypoint.sh
```

### Port Already in Use

If ports 8080, 3001, 3002, or 5432 are in use:

1. Stop the conflicting service
2. Or change the port in `.env`:
   ```env
   PORT=8090  # Change frontend port
   ```

### Database Migration Errors

If you see Prisma migration errors:

```bash
# Stop services
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Start fresh
docker-compose up --build
```

## Data Persistence

Database data is stored in a Docker volume named `proxmox-manager_postgres-data`.

**To backup:**
```bash
docker-compose exec postgres pg_dump -U proxmox proxmox_manager > backup.sql
```

**To restore:**
```bash
cat backup.sql | docker-compose exec -T postgres psql -U proxmox proxmox_manager
```

## Development vs Production

This Docker Compose setup is suitable for:
- ✅ Development and testing
- ✅ Internal/home lab use
- ⚠️ Production (with modifications)

### For Production:

1. **Use proper secrets management** (not .env files)
2. **Enable HTTPS** for all services
3. **Set `secure: true`** in proxy-server configuration
4. **Use a reverse proxy** (nginx, traefik) instead of exposing ports directly
5. **Enable backup** automation for PostgreSQL
6. **Monitor services** with proper logging and alerting
7. **Use Docker Swarm** or Kubernetes for high availability

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Host                         │
│                                                         │
│  ┌──────────────┐     ┌──────────────┐                │
│  │   Frontend   │────▶│   Backend    │                │
│  │  (React)     │     │  (Express)   │                │
│  │  Port: 8080  │     │  Port: 3002  │                │
│  └──────────────┘     └───────┬──────┘                │
│         │                      │                        │
│         │             ┌────────┴─────────┐             │
│         │             │   PostgreSQL     │             │
│         │             │   Port: 5432     │             │
│         │             └──────────────────┘             │
│         │                                               │
│         ▼                                               │
│  ┌──────────────┐                                      │
│  │ Proxy Server │────▶ Proxmox Servers (External)     │
│  │  (Express)   │                                      │
│  │  Port: 3001  │                                      │
│  └──────────────┘                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Next Steps

1. Test VM management features
2. Add multiple Proxmox servers
3. Create additional users with different roles
4. Test white-label branding (Settings > Branding)
5. Review activity logs

## Support

For issues and questions:
- Check logs: `docker-compose logs -f`
- Review health checks: `docker-compose ps`
- Open an issue on GitHub

---

**Version**: 0.2.0 (PostgreSQL-only)
**Last Updated**: November 2025
