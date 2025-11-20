# Multi-stage build for Proxmox Manager Portal
# Stage 1: Build the frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build the React application
RUN npm run build

# Stage 2: Build proxy server dependencies
FROM node:18-alpine AS proxy-builder

WORKDIR /app/proxy-server

# Copy proxy server package files
COPY proxy-server/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy proxy server source
COPY proxy-server/ ./

# Stage 3: Production image
FROM node:18-alpine AS production

WORKDIR /app

# Install serve for static files and curl for healthcheck
RUN apk add --no-cache curl && \
    npm install -g serve

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built frontend from builder
COPY --from=frontend-builder --chown=nodejs:nodejs /app/dist ./dist

# Copy proxy server from builder
COPY --from=proxy-builder --chown=nodejs:nodejs /app/proxy-server ./proxy-server

# Create data directory for persistence
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port 8080 (serves both frontend and proxy)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080 || exit 1

# Start script that runs both frontend and proxy
COPY --chown=nodejs:nodejs docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]
