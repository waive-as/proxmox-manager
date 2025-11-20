# Proxmox Manager Portal - Deployment Guide

Complete guide for deploying Proxmox Manager Portal in production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Docker Deployment (Recommended)](#docker-deployment-recommended)
- [Manual Deployment](#manual-deployment)
- [Configuration](#configuration)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)
- [Security](#security)

## Prerequisites

### System Requirements

- **CPU**: 2+ cores recommended
- **RAM**: 2GB minimum, 4GB recommended
- **Disk**: 10GB free space
- **OS**: Ubuntu 20.04+, Debian 11+, or any Linux with Docker support

### Software Requirements

- **Docker**: 20.10+ and Docker Compose 2.0+
- **Node.js**: 18+ (for manual deployment)
- **Git**: For cloning the repository
- **Proxmox VE**: 7.0+ server to manage

### Network Requirements

- Ports 8081 (frontend) and 3001 (proxy) available
- Network access to Proxmox VE servers
- Optional: Domain name for SSL/HTTPS

## Deployment Options

### Quick Comparison

| Method | Difficulty | Best For |
|--------|-----------|----------|
| Docker Compose | Easy | Production deployment |
| Manual Build | Medium | Development or custom setups |
| Behind Reverse Proxy | Advanced | Integration with existing infrastructure |

## Docker Deployment (Recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/proxmox-manager-portal.git
cd proxmox-manager-portal
```

### 2. Configure Environment

Create a `.env` file from the template:

```bash
cp .env.example .env
nano .env
```

**Required Environment Variables:**

```env
# Application
NODE_ENV=production
VITE_API_URL=http://localhost:3001

# Database (if using backend)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=proxmox_portal
DB_USER=proxmox_user
DB_PASSWORD=CHANGE_THIS_SECURE_PASSWORD

# JWT Authentication
JWT_SECRET=CHANGE_THIS_TO_RANDOM_STRING
JWT_EXPIRY=24h

# Ports
FRONTEND_PORT=8081
PROXY_PORT=3001
BACKEND_PORT=3002

# Optional: Supabase
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Start Services

```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Access the Application

- **Frontend**: http://your-server:8081
- **Proxy Server**: http://your-server:3001
- **Health Check** (if using backend): http://your-server:3002/health

### 5. First-Run Setup

1. Navigate to http://your-server:8081
2. You'll be redirected to the **Setup Wizard**
3. Create an admin account
4. Add your first Proxmox server
5. Start managing VMs!

### Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f [service-name]

# Update to latest version
git pull
docker-compose up -d --build

# Remove all data (WARNING: destructive)
docker-compose down -v
```

## Manual Deployment

### 1. Install Dependencies

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/proxmox-manager-portal.git
cd proxmox-manager-portal

# Install frontend dependencies
npm install

# Install proxy server dependencies
cd proxy-server
npm install
cd ..
```

### 2. Build Frontend

```bash
# Production build
npm run build

# The build will be in the dist/ directory
```

### 3. Start Services

#### Option A: Using Process Manager (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start proxy server
cd proxy-server
pm2 start npm --name "proxmox-proxy" -- start

# Serve frontend
cd ..
pm2 start npx --name "proxmox-frontend" -- serve -s dist -l 8081

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Option B: Using systemd

Create `/etc/systemd/system/proxmox-proxy.service`:

```ini
[Unit]
Description=Proxmox Manager Proxy Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/proxmox-manager-portal/proxy-server
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/proxmox-frontend.service`:

```ini
[Unit]
Description=Proxmox Manager Frontend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/proxmox-manager-portal
ExecStart=/usr/bin/npx serve -s dist -l 8081
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start services:

```bash
sudo systemctl daemon-reload
sudo systemctl enable proxmox-proxy proxmox-frontend
sudo systemctl start proxmox-proxy proxmox-frontend
```

## Configuration

### Proxy Server Configuration

Edit `proxy-server/proxmox-proxy.js` for advanced configuration:

```javascript
const PORT = process.env.PROXY_PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// SSL verification (set to false for self-signed certificates)
const REJECT_UNAUTHORIZED = process.env.REJECT_UNAUTHORIZED !== 'false';
```

### Frontend Environment Variables

Create `.env` in the root directory:

```env
# API endpoint
VITE_API_URL=http://localhost:3001

# Optional: Analytics
VITE_ANALYTICS_ID=your-analytics-id

# Optional: Feature flags
VITE_ENABLE_FEATURE_X=true
```

### Nginx Reverse Proxy Configuration

Example Nginx configuration (`/etc/nginx/sites-available/proxmox-manager`):

```nginx
server {
    listen 80;
    server_name proxmox.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name proxmox.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/proxmox-manager.crt;
    ssl_certificate_key /etc/ssl/private/proxmox-manager.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy Server API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/proxmox-manager /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL/HTTPS Setup

### Option 1: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d proxmox.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal:
sudo certbot renew --dry-run
```

### Option 2: Self-Signed Certificate

```bash
# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/proxmox-manager.key \
  -out /etc/ssl/certs/proxmox-manager.crt

# Secure the key
sudo chmod 600 /etc/ssl/private/proxmox-manager.key
```

### Option 3: Existing Certificate

```bash
# Copy your certificates
sudo cp your-cert.crt /etc/ssl/certs/proxmox-manager.crt
sudo cp your-key.key /etc/ssl/private/proxmox-manager.key
sudo chmod 600 /etc/ssl/private/proxmox-manager.key
```

## Monitoring & Maintenance

### Health Checks

#### Docker Deployment

```bash
# Check container health
docker-compose ps

# Check logs
docker-compose logs -f

# Check resource usage
docker stats
```

#### Manual Deployment

```bash
# Check services status
sudo systemctl status proxmox-proxy proxmox-frontend

# Check if ports are listening
sudo netstat -tulpn | grep -E ':(8081|3001)'

# Application health check
curl -f http://localhost:8081 || echo "Frontend down"
curl -f http://localhost:3001/health || echo "Proxy down"
```

### Log Management

#### Docker Logs

```bash
# View all logs
docker-compose logs

# Follow logs
docker-compose logs -f

# Specific service
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100
```

#### System Logs

```bash
# Frontend logs (PM2)
pm2 logs proxmox-frontend

# Proxy logs (PM2)
pm2 logs proxmox-proxy

# Systemd logs
sudo journalctl -u proxmox-frontend -f
sudo journalctl -u proxmox-proxy -f
```

### Performance Monitoring

```bash
# System resources
htop

# Docker stats
docker stats

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Check disk space
df -h
```

## Backup & Recovery

### Backup Procedures

#### Database Backup (if using PostgreSQL)

```bash
# Docker deployment
docker-compose exec postgres pg_dump -U proxmox_user proxmox_portal > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated daily backup script
#!/bin/bash
BACKUP_DIR="/opt/backups/proxmox-manager"
mkdir -p $BACKUP_DIR
docker-compose exec -T postgres pg_dump -U proxmox_user proxmox_portal | gzip > "$BACKUP_DIR/backup_$(date +%Y%m%d).sql.gz"
# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
```

#### Application Backup

```bash
# Backup entire application
tar -czf proxmox-manager-backup-$(date +%Y%m%d).tar.gz \
  -C /opt proxmox-manager-portal \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=.git

# Backup configuration only
tar -czf proxmox-manager-config-$(date +%Y%m%d).tar.gz \
  /opt/proxmox-manager-portal/.env \
  /opt/proxmox-manager-portal/docker-compose.yml
```

### Recovery Procedures

#### Database Recovery

```bash
# Docker deployment
docker-compose exec -T postgres psql -U proxmox_user proxmox_portal < backup.sql

# Or from gzipped backup
gunzip -c backup.sql.gz | docker-compose exec -T postgres psql -U proxmox_user proxmox_portal
```

#### Application Recovery

```bash
# Stop services
docker-compose down

# Restore files
tar -xzf proxmox-manager-backup-YYYYMMDD.tar.gz -C /opt

# Start services
cd /opt/proxmox-manager-portal
docker-compose up -d
```

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Check what's using the port
sudo lsof -i :8081
sudo netstat -tulpn | grep :8081

# Kill the process
sudo kill -9 <PID>

# Or change the port in .env
```

#### Docker Permission Issues

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Restart Docker
sudo systemctl restart docker

# Re-login to apply group changes
```

#### Cannot Connect to Proxmox Server

1. **Check proxy server logs:**
   ```bash
   docker-compose logs proxy
   ```

2. **Verify network connectivity:**
   ```bash
   curl -k https://your-proxmox-server:8006
   ```

3. **Check SSL certificate verification:**
   - For self-signed certificates, disable verification in proxy config

#### Frontend Not Loading

1. **Check if service is running:**
   ```bash
   curl http://localhost:8081
   ```

2. **Check browser console** for JavaScript errors

3. **Clear browser cache** and try again

4. **Rebuild frontend:**
   ```bash
   npm run build
   docker-compose up -d --build frontend
   ```

#### Authentication Issues

1. **Clear localStorage** in browser (F12 → Application → Local Storage → Clear)

2. **Check JWT secret** in environment variables

3. **Verify database connection** (if using backend)

4. **Check auth service logs** for errors

### Log Analysis

```bash
# Search for errors
docker-compose logs | grep -i error

# Search for specific keyword
docker-compose logs | grep "authentication"

# Export logs to file
docker-compose logs > debug.log 2>&1
```

## Security

### Security Checklist

- [ ] Change default database passwords
- [ ] Set strong JWT_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall (UFW/iptables)
- [ ] Enable fail2ban for brute force protection
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Review user permissions regularly
- [ ] Enable audit logging
- [ ] Secure Proxmox API credentials

### Firewall Configuration

```bash
# UFW example
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable

# Block direct access to internal ports
sudo ufw deny 8081/tcp
sudo ufw deny 3001/tcp
```

### Fail2ban Setup

Create `/etc/fail2ban/filter.d/proxmox-manager.conf`:

```ini
[Definition]
failregex = ^.*Failed login attempt.*<HOST>.*$
ignoreregex =
```

Create `/etc/fail2ban/jail.d/proxmox-manager.conf`:

```ini
[proxmox-manager]
enabled = true
port = 80,443
filter = proxmox-manager
logpath = /var/log/nginx/access.log
maxretry = 5
bantime = 3600
```

Restart fail2ban:

```bash
sudo systemctl restart fail2ban
```

## Updates

### Updating to Latest Version

```bash
# Pull latest code
cd /opt/proxmox-manager-portal
git pull

# Docker deployment
docker-compose down
docker-compose up -d --build

# Manual deployment
npm install
npm run build
pm2 restart all
```

### Rollback Procedure

```bash
# Check previous versions
git tag -l

# Rollback to specific version
git checkout v0.1.0

# Rebuild and restart
docker-compose up -d --build
```

## Support & Resources

- **Documentation**: See other docs in this folder
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Ask questions on GitHub Discussions
- **Security**: Report vulnerabilities to [SECURITY.md](../SECURITY.md)

---

**Last Updated**: November 20, 2025
**Version**: 0.1.0
