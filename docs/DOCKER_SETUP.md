# Docker Setup Guide

Complete guide for deploying Proxmox Manager Portal with Docker.

## 🚀 Quick Start (Production)

### Prerequisites
- Docker and Docker Compose installed
- At least 2GB RAM
- Proxmox VE server to manage

### 1. Clone the Repository

```bash
git clone https://github.com/waive-as/proxmox-manager.git
cd proxmox-manager
```

### 2. Create Environment File

```bash
cp .env.example .env
nano .env
```

**Required Variables:**
```env
# Database
POSTGRES_PASSWORD=your_secure_password_here

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

### 3. Start the Application

```bash
docker-compose up -d
```

### 4. Access the Application

Open http://localhost:8080 in your browser.

**First-Run Setup:**
1. You'll be redirected to the setup wizard
2. Create your admin account
3. Configure your first Proxmox server
4. Start managing VMs!

---

## 🏗️ Architecture

The application consists of 4 containers:

```
┌─────────────┐
│  PostgreSQL │  Database (port 5432, internal)
└──────┬──────┘
       │
┌──────▼──────┐
│   Backend   │  API Server (port 3002, internal)
└──────┬──────┘
       │
┌──────▼──────┐
│    Proxy    │  CORS Proxy (port 3001, internal)
└──────┬──────┘
       │
┌──────▼──────┐
│  Frontend   │  React App (port 8080, exposed)
└─────────────┘
```

**Only port 8080 is exposed** - all other services communicate internally via Docker network.

---

## 📦 Container Details

### Frontend
- **Image**: `ghcr.io/waive-as/proxmox-manager:latest`
- **Port**: 8080 (exposed to host)
- **Purpose**: React SPA served via nginx

### Backend
- **Image**: `ghcr.io/waive-as/proxmox-manager-backend:latest`
- **Port**: 3002 (internal only)
- **Purpose**: REST API, authentication, database access

### Proxy
- **Image**: `ghcr.io/waive-as/proxmox-manager-proxy:latest`
- **Port**: 3001 (internal only)
- **Purpose**: Handles CORS for Proxmox API calls

### PostgreSQL
- **Image**: `postgres:16-alpine`
- **Port**: 5432 (internal only)
- **Purpose**: Persistent data storage

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `8080` | Port to expose frontend |
| `POSTGRES_DB` | No | `proxmox_manager` | Database name |
| `POSTGRES_USER` | No | `proxmox` | Database user |
| `POSTGRES_PASSWORD` | **Yes** | - | Database password |
| `JWT_SECRET` | **Yes** | - | JWT signing secret |
| `JWT_REFRESH_SECRET` | **Yes** | - | JWT refresh secret |
| `ALLOWED_ORIGINS` | No | `*` | CORS allowed origins |
| `LOG_LEVEL` | No | `info` | Logging level |

### Generating Secrets

```bash
# Generate JWT secrets
openssl rand -base64 32
```

---

## 💾 Data Persistence

### Volumes

- `postgres-data`: Database files (persisted)
- `backend-logs`: Application logs (persisted)

### Backup Database

```bash
# Create backup
docker exec proxmox-db pg_dump -U proxmox proxmox_manager > backup.sql

# Restore backup
cat backup.sql | docker exec -i proxmox-db psql -U proxmox proxmox_manager
```

---

## 🛠️ Management

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f proxy
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Stop/Start

```bash
# Stop all containers
docker-compose down

# Start all containers
docker-compose up -d
```

### Update to Latest Version

```bash
# Pull latest images
docker-compose pull

# Restart with new images
docker-compose up -d
```

---

## 🔄 Development Setup

For local development with hot reload:

```bash
# Use the development compose file
docker-compose -f docker-compose.dev.yml up
```

**Development features:**
- Hot reload for frontend (port 8081)
- Hot reload for backend (port 3002)
- Source code mounted as volumes
- Debug logging enabled
- PostgreSQL exposed on port 5432

---

## 🐳 Portainer Deployment

### 1. Create Stack in Portainer

1. Open Portainer
2. Go to **Stacks** → **Add Stack**
3. Name: `proxmox-manager`
4. Build method: **Git Repository** or **Web editor**

### 2. Paste docker-compose.yml

Copy the contents of `docker-compose.yml` into the web editor.

### 3. Add Environment Variables

In the **Environment variables** section:

```
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### 4. Deploy Stack

Click **Deploy the stack** and wait for all containers to start.

### 5. Access Application

Open `http://your-server-ip:8080`

---

## 🔒 Security Considerations

### Production Deployment

1. **Use strong passwords**
   ```bash
   POSTGRES_PASSWORD=$(openssl rand -base64 32)
   JWT_SECRET=$(openssl rand -base64 32)
   JWT_REFRESH_SECRET=$(openssl rand -base64 32)
   ```

2. **Configure CORS** (restrict to your domain)
   ```env
   ALLOWED_ORIGINS=https://yourdomain.com
   ```

3. **Deploy behind reverse proxy** (nginx, Traefik)
   - Enable HTTPS/SSL
   - Add rate limiting
   - Configure security headers

4. **Restrict PostgreSQL access** (already internal-only by default)

5. **Regular backups**
   ```bash
   # Add to crontab
   0 2 * * * /path/to/backup-script.sh
   ```

---

## 🔍 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# - Missing environment variables
# - Port already in use
# - Database connection failed
```

### Database Connection Failed

```bash
# Check postgres is running
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Verify credentials in .env match docker-compose.yml
```

### Frontend Shows "API Error"

```bash
# Check backend is running
docker-compose ps backend

# Check backend logs
docker-compose logs backend

# Verify backend is healthy
docker exec proxmox-backend wget -qO- http://localhost:3002/health
```

### Port 8080 Already in Use

```env
# Change port in .env
PORT=8081
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

---

## 📊 Health Checks

All services have health checks configured:

```bash
# Check all container health
docker-compose ps

# Healthy output shows:
# proxmox-db       Up (healthy)
# proxmox-backend  Up (healthy)
# proxmox-proxy    Up (healthy)
# proxmox-frontend Up (healthy)
```

### Manual Health Checks

```bash
# Backend
curl http://localhost:3002/health

# Frontend
curl http://localhost:8080

# Database (from inside container)
docker exec proxmox-db pg_isready -U proxmox
```

---

## 🔄 Upgrading

### From localStorage to PostgreSQL

If upgrading from an older version using localStorage:

**⚠️ Data Migration Required**

The new version uses PostgreSQL exclusively. Your localStorage data (users, servers) will **not** be automatically migrated.

**Before upgrading:**
1. Export your Proxmox server configurations
2. Note user accounts and roles
3. Back up any custom settings

**After upgrading:**
1. Run through setup wizard to create new admin
2. Re-add Proxmox servers
3. Re-create user accounts

---

## 📚 Additional Resources

- [Main README](README.md) - Project overview
- [Contributing Guide](CONTRIBUTING.md) - Development guidelines
- [Security Policy](SECURITY.md) - Security and vulnerability reporting
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md) - Common issues

---

## 💬 Support

- **Issues**: https://github.com/waive-as/proxmox-manager/issues
- **Discussions**: https://github.com/waive-as/proxmox-manager/discussions

---

**Last Updated**: November 20, 2025
**Version**: 0.2.0
