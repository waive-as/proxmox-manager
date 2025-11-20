# Docker Deployment Guide

Complete guide for deploying Proxmox Manager Portal using Docker.

## Quick Start

### Using Pre-built Image (Recommended)

The easiest way to run Proxmox Manager Portal is using our pre-built Docker images from GitHub Container Registry:

```bash
docker run -d \
  --name proxmox-manager \
  -p 8080:8080 \
  -v proxmox-data:/app/data \
  --restart unless-stopped \
  ghcr.io/waive-as/proxmox-manager:latest
```

Then access the application at http://localhost:8080

## Available Images

Images are automatically built and published to GitHub Container Registry on every push to `main` and on tagged releases.

### Image Tags

- `latest` - Latest build from the main branch
- `v0.1.0` - Specific version tags (semantic versioning)
- `v0.1` - Minor version tags
- `v0` - Major version tags

### Pull a Specific Version

```bash
# Latest stable release
docker pull ghcr.io/waive-as/proxmox-manager:latest

# Specific version
docker pull ghcr.io/waive-as/proxmox-manager:v0.1.0
```

## Docker Compose

For easier management, use Docker Compose:

### 1. Create `docker-compose.yml`

```yaml
version: '3.8'

services:
  proxmox-manager:
    image: ghcr.io/waive-as/proxmox-manager:latest
    container_name: proxmox-manager
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
    volumes:
      - proxmox-data:/app/data
    restart: unless-stopped

volumes:
  proxmox-data:
```

### 2. Start the Application

```bash
docker-compose up -d
```

### 3. Manage the Application

```bash
# View logs
docker-compose logs -f

# Stop the application
docker-compose down

# Update to latest version
docker-compose pull
docker-compose up -d
```

## Building from Source

If you prefer to build the image yourself:

```bash
# Clone the repository
git clone https://github.com/waive-as/proxmox-manager.git
cd proxmox-manager

# Build the image
docker build -t proxmox-manager .

# Run the container
docker run -d \
  --name proxmox-manager \
  -p 8080:8080 \
  -v proxmox-data:/app/data \
  proxmox-manager
```

Or use the included docker-compose.yml:

```bash
docker-compose up -d
```

## Environment Variables

You can customize the application using environment variables:

```bash
docker run -d \
  --name proxmox-manager \
  -p 8080:8080 \
  -e PORT=8080 \
  -e NODE_ENV=production \
  -v proxmox-data:/app/data \
  ghcr.io/waive-as/proxmox-manager:latest
```

Available variables:
- `PORT` - Application port (default: 8080)
- `NODE_ENV` - Environment (default: production)

## Data Persistence

The application stores data in `/app/data` within the container. To persist data across container restarts:

```bash
# Using a named volume (recommended)
docker run -d \
  -v proxmox-data:/app/data \
  ghcr.io/waive-as/proxmox-manager:latest

# Using a host directory
docker run -d \
  -v /path/on/host:/app/data \
  ghcr.io/waive-as/proxmox-manager:latest
```

## Multi-Architecture Support

Our Docker images support multiple architectures:
- `linux/amd64` (x86_64)
- `linux/arm64` (ARM 64-bit)

Docker will automatically pull the correct image for your architecture.

## Health Checks

The Docker image includes a built-in health check:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' proxmox-manager
```

Health check endpoint: `http://localhost:8080`

## Behind a Reverse Proxy

### Nginx Example

```nginx
server {
    listen 80;
    server_name proxmox.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Traefik Example

```yaml
version: '3.8'

services:
  proxmox-manager:
    image: ghcr.io/waive-as/proxmox-manager:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.proxmox.rule=Host(`proxmox.yourdomain.com`)"
      - "traefik.http.routers.proxmox.entrypoints=websecure"
      - "traefik.http.routers.proxmox.tls.certresolver=letsencrypt"
      - "traefik.http.services.proxmox.loadbalancer.server.port=8080"
```

## Updating

To update to the latest version:

```bash
# Stop the current container
docker stop proxmox-manager
docker rm proxmox-manager

# Pull the latest image
docker pull ghcr.io/waive-as/proxmox-manager:latest

# Start a new container
docker run -d \
  --name proxmox-manager \
  -p 8080:8080 \
  -v proxmox-data:/app/data \
  --restart unless-stopped \
  ghcr.io/waive-as/proxmox-manager:latest
```

Or with Docker Compose:

```bash
docker-compose pull
docker-compose up -d
```

## Troubleshooting

### View Logs

```bash
# Docker
docker logs proxmox-manager

# Docker Compose
docker-compose logs
```

### Access Container Shell

```bash
docker exec -it proxmox-manager sh
```

### Check Running Processes

```bash
docker exec proxmox-manager ps aux
```

### Verify Network Connectivity

```bash
# Check if container is listening on port 8080
docker exec proxmox-manager netstat -tlnp
```

## Security Considerations

1. **Run as Non-Root**: The container runs as a non-root user (nodejs:1001)
2. **Read-Only Filesystem**: Consider using `--read-only` flag with tmpfs for temp directories
3. **Resource Limits**: Set CPU and memory limits:

```bash
docker run -d \
  --name proxmox-manager \
  --memory="512m" \
  --cpus="0.5" \
  -p 8080:8080 \
  ghcr.io/waive-as/proxmox-manager:latest
```

4. **Network Isolation**: Use Docker networks to isolate containers

## Advanced Configuration

### Custom Network

```bash
# Create a custom network
docker network create proxmox-network

# Run container on custom network
docker run -d \
  --name proxmox-manager \
  --network proxmox-network \
  -p 8080:8080 \
  ghcr.io/waive-as/proxmox-manager:latest
```

### Resource Constraints

```yaml
version: '3.8'

services:
  proxmox-manager:
    image: ghcr.io/waive-as/proxmox-manager:latest
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## Support

For issues with Docker deployment:
- Check the logs: `docker logs proxmox-manager`
- Report issues: https://github.com/waive-as/proxmox-manager/issues
- Discussions: https://github.com/waive-as/proxmox-manager/discussions

---

**Last Updated**: November 20, 2025
