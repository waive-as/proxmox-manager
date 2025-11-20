# Troubleshooting Guide

Common issues and solutions for Proxmox Manager Portal.

## Table of Contents

- [Node.js Version Issues](#nodejs-version-issues)
- [Installation Problems](#installation-problems)
- [Docker Issues](#docker-issues)
- [Runtime Errors](#runtime-errors)
- [Authentication Issues](#authentication-issues)
- [Proxmox Connection Issues](#proxmox-connection-issues)

---

## Node.js Version Issues

### Unsupported Engine Warnings (Node v23+)

**Problem:**
```
npm warn EBADENGINE Unsupported engine
npm warn EBADENGINE   package: 'vitest@4.0.9',
npm warn EBADENGINE   required: { node: '^20.0.0 || ^22.0.0 || >=24.0.0' },
npm warn EBADENGINE   current: { node: 'v23.7.0', npm: '11.4.2' }
```

**Solution:**

Node.js v23 is not yet officially supported by all dependencies. Use Node.js 18-22:

```bash
# Using nvm (recommended)
nvm install 22
nvm use 22

# Or use the .nvmrc file
nvm use

# Verify version
node --version  # Should show v22.x.x
```

**Why?**
- vitest@4.0.9 requires Node `^20.0.0 || ^22.0.0 || >=24.0.0`
- Node v23 is between v22 and v24, not officially supported yet
- Dependencies will add v23 support in future releases

---

## Installation Problems

### npm ci Fails with Peer Dependency Errors

**Problem:**
```
npm error ERESOLVE unable to resolve dependency tree
```

**Solution:**

```bash
# Clear npm cache
npm cache clean --force

# Remove existing node_modules and lockfile
rm -rf node_modules package-lock.json

# Install with correct Node version
nvm use 22
npm install
```

### Package Lock Conflicts

**Problem:**
```
npm error Conflicting peer dependency
```

**Solution:**

```bash
# Use the committed package-lock.json
git checkout package-lock.json

# Install dependencies
npm ci
```

---

## Docker Issues

### Port Already in Use

**Problem:**
```
Error: bind: address already in use
```

**Solution:**

```bash
# Check what's using port 8080
sudo lsof -i :8080
# Or
sudo netstat -tulpn | grep :8080

# Kill the process
sudo kill -9 <PID>

# Or change the port
docker run -p 8081:8080 ghcr.io/waive-as/proxmox-manager:latest
```

### Docker Build Fails - npm ci Error

**Problem:**
```
ERROR: process "/bin/sh -c npm ci --only=production" did not complete successfully
```

**Solution:**

This is fixed in the latest Dockerfile. Pull the latest changes:

```bash
git pull origin main
docker build -t proxmox-manager .
```

The issue was using deprecated `--only=production` flag. Now uses `--omit=dev`.

### Image Pull Fails

**Problem:**
```
Error response from daemon: manifest for ghcr.io/waive-as/proxmox-manager:latest not found
```

**Solution:**

Images are published automatically when code is pushed. If the image doesn't exist yet:

```bash
# Build locally instead
git clone https://github.com/waive-as/proxmox-manager.git
cd proxmox-manager
docker-compose up -d
```

---

## Runtime Errors

### Frontend Not Loading (White Screen)

**Problem:**
Blank white screen when accessing http://localhost:8080

**Solution:**

1. **Check browser console** (F12 → Console tab)
   - Look for JavaScript errors
   - Check for CORS errors

2. **Verify build completed successfully:**
   ```bash
   npm run build
   # Should create dist/ directory
   ls -la dist/
   ```

3. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Or clear cache in browser settings

4. **Check Docker logs:**
   ```bash
   docker logs proxmox-manager
   ```

### API Calls Failing

**Problem:**
```
Failed to fetch
NetworkError
CORS error
```

**Solution:**

1. **Verify proxy server is running:**
   ```bash
   # In Docker
   docker exec proxmox-manager ps aux | grep node

   # Local development
   cd proxy-server && npm start
   ```

2. **Check API URL configuration:**
   - Docker: Should auto-configure to internal port 3001
   - Local dev: Frontend expects proxy at http://localhost:3001

---

## Authentication Issues

### Cannot Login / Token Expired

**Problem:**
- Login fails even with correct credentials
- Logged out unexpectedly
- "Invalid token" errors

**Solution:**

```bash
# Clear browser localStorage
# Open browser console (F12) and run:
localStorage.clear()
location.reload()
```

**Or manually:**
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Delete `auth_token` and `user` keys
4. Refresh the page

### Stuck in Setup Loop

**Problem:**
After completing setup wizard, redirected back to setup page

**Solution:**

```bash
# Clear all localStorage
localStorage.clear()

# Or specifically:
localStorage.removeItem('setupComplete')
localStorage.removeItem('hasUsers')

# Then complete setup wizard again
```

### "Needs Setup" Even After Creating Admin

**Problem:**
Setup wizard keeps appearing after creating admin user

**Solution:**

This indicates the admin user wasn't saved properly:

1. **Check browser localStorage:**
   ```javascript
   // In browser console
   console.log(localStorage.getItem('users'))
   ```

2. **Manually create admin:**
   - Clear localStorage
   - Complete setup wizard again
   - Ensure you see success message before redirecting

---

## Proxmox Connection Issues

### Cannot Connect to Proxmox Server

**Problem:**
```
Failed to connect to Proxmox server
Network error
SSL error
```

**Solution:**

1. **Verify Proxmox server is accessible:**
   ```bash
   curl -k https://your-proxmox-server:8006/api2/json/version
   ```

2. **Check network connectivity:**
   ```bash
   # Can you reach the server?
   ping your-proxmox-server

   # Is port 8006 open?
   telnet your-proxmox-server 8006
   ```

3. **SSL certificate issues (self-signed):**
   - The proxy server should handle this automatically
   - If issues persist, check proxy-server logs

4. **Firewall blocking requests:**
   - Ensure Proxmox firewall allows connections from the proxy server
   - Check any intermediate firewalls

### Invalid Credentials

**Problem:**
```
Authentication failed
401 Unauthorized
```

**Solution:**

1. **Verify credentials:**
   - Username format: `user@pam` or `user@pve`
   - Password must match Proxmox user password

2. **Test credentials directly:**
   ```bash
   curl -k -d "username=root@pam&password=yourpassword" \
     https://your-proxmox-server:8006/api2/json/access/ticket
   ```

3. **Check user permissions in Proxmox:**
   - User must have appropriate permissions
   - At minimum: PVEAuditor role for read-only access

---

## Performance Issues

### Slow Loading Times

**Problem:**
Application takes a long time to load

**Solution:**

1. **Check Docker resource limits:**
   ```bash
   docker stats proxmox-manager
   ```

2. **Increase memory if needed:**
   ```bash
   docker run -d \
     --memory="1g" \
     --cpus="1.0" \
     -p 8080:8080 \
     ghcr.io/waive-as/proxmox-manager:latest
   ```

3. **Check network latency to Proxmox servers:**
   ```bash
   ping your-proxmox-server
   ```

### High Memory Usage

**Problem:**
Container using excessive memory

**Solution:**

```bash
# Set memory limits
docker update --memory="512m" --memory-swap="1g" proxmox-manager

# Or restart with limits
docker stop proxmox-manager
docker rm proxmox-manager
docker run -d \
  --name proxmox-manager \
  --memory="512m" \
  -p 8080:8080 \
  ghcr.io/waive-as/proxmox-manager:latest
```

---

## Development Issues

### Hot Module Replacement Not Working

**Problem:**
Changes not reflected in browser during development

**Solution:**

```bash
# Ensure dev server is running correctly
npm run dev

# Check Vite config
# Should be watching src/ directory

# Hard refresh browser
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

### Tests Failing

**Problem:**
```
npm test
> vitest
FAIL
```

**Solution:**

1. **Update dependencies:**
   ```bash
   npm install
   ```

2. **Clear test cache:**
   ```bash
   npm test -- --clearCache
   ```

3. **Run specific test:**
   ```bash
   npm test -- src/path/to/test.test.ts
   ```

4. **Check Node version:**
   ```bash
   node --version  # Should be 18-22
   ```

---

## Getting More Help

If your issue isn't covered here:

1. **Check existing issues:** https://github.com/waive-as/proxmox-manager/issues
2. **Search discussions:** https://github.com/waive-as/proxmox-manager/discussions
3. **Create a new issue:** Include:
   - Node.js version (`node --version`)
   - npm version (`npm --version`)
   - Operating system
   - Full error message
   - Steps to reproduce
   - What you've already tried

## Useful Commands

```bash
# Check versions
node --version
npm --version
docker --version

# View application logs
docker logs proxmox-manager
docker logs -f proxmox-manager  # Follow logs

# Access container shell
docker exec -it proxmox-manager sh

# Check Docker resources
docker stats proxmox-manager

# Restart container
docker restart proxmox-manager

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build

# Clean npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

**Last Updated**: November 20, 2025
