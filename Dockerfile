
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY proxy-server/package*.json ./proxy-server/

# Install dependencies
RUN npm ci --only=production
RUN cd proxy-server && npm ci --only=production

# Copy source code
COPY . .

# Build the React application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install serve for static files
RUN npm install -g serve

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proxy-server ./proxy-server
COPY --from=builder /app/nginx.conf ./nginx.conf

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose ports
EXPOSE 8081 3001

# Start both services
CMD ["sh", "-c", "cd proxy-server && node proxmox-proxy.js & serve -s dist -l 8081"]
