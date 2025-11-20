#!/bin/bash

# Server Setup Script for Proxmox Manager Portal
# Run this script on your production server to set up the environment

set -e

PROJECT_NAME="proxmox-manager-portal"
DEPLOY_DIR="/opt/$PROJECT_NAME"
GITHUB_REPO="your-username/proxmox-manager-portal"  # Update this with your actual repo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

print_header "Proxmox Manager Portal Server Setup"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
print_status "Installing required packages..."
apt install -y curl wget git nginx ufw fail2ban

# Install Docker
print_status "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Install Docker Compose
print_status "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create deployment user
print_status "Creating deployment user..."
if ! id "deploy" &>/dev/null; then
    useradd -m -s /bin/bash deploy
    usermod -aG docker deploy
    usermod -aG sudo deploy
    print_status "Created user 'deploy'. Please set password:"
    passwd deploy
fi

# Create deployment directory
print_status "Creating deployment directory..."
mkdir -p "$DEPLOY_DIR"
chown deploy:deploy "$DEPLOY_DIR"

# Clone repository
print_status "Cloning repository..."
sudo -u deploy git clone "https://github.com/$GITHUB_REPO.git" "$DEPLOY_DIR"

# Configure firewall
print_status "Configuring firewall..."
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8081/tcp
ufw allow 3001/tcp
ufw --force enable

# Configure fail2ban
print_status "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
EOF

systemctl restart fail2ban

# Create systemd service for auto-start
print_status "Creating systemd service..."
cat > /etc/systemd/system/proxmox-manager.service << EOF
[Unit]
Description=Proxmox Manager Portal
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$DEPLOY_DIR
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0
User=deploy
Group=deploy

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable proxmox-manager.service

# Create nginx configuration
print_status "Creating nginx configuration..."
cat > /etc/nginx/sites-available/proxmox-manager << EOF
server {
    listen 80;
    server_name your-domain.com;  # Update with your domain

    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;  # Update with your domain

    # SSL configuration (update paths to your certificates)
    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy to frontend
    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Proxy to API proxy server
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable nginx site
ln -sf /etc/nginx/sites-available/proxmox-manager /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Create SSL certificate directory
mkdir -p /etc/ssl/certs /etc/ssl/private

print_header "Setup Complete!"

print_status "✅ Server setup completed successfully!"
print_warning "⚠️  Please complete the following steps:"
echo "1. Update GitHub repository URL in this script: $GITHUB_REPO"
echo "2. Update domain name in nginx configuration: your-domain.com"
echo "3. Install SSL certificates in /etc/ssl/certs/ and /etc/ssl/private/"
echo "4. Configure GitHub Actions secrets:"
echo "   - SERVER_HOST: $(hostname -I | awk '{print $1}')"
echo "   - SERVER_USER: deploy"
echo "   - SERVER_SSH_KEY: [your private SSH key]"
echo "   - SERVER_PORT: 22"
echo ""
print_status "🚀 To deploy, run: sudo -u deploy $DEPLOY_DIR/deploy.sh"
print_status "📊 To check status: sudo systemctl status proxmox-manager"
print_status "📝 To view logs: sudo docker-compose -f $DEPLOY_DIR/docker-compose.prod.yml logs"
