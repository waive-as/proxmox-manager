#!/bin/sh
set -e

echo "Starting Proxmox Manager Portal..."

# Start proxy server in background
echo "Starting proxy server on port 3001..."
cd /app/proxy-server
node proxmox-proxy.js &
PROXY_PID=$!

# Wait a moment for proxy to start
sleep 2

# Start frontend server
echo "Starting frontend on port 8080..."
cd /app
serve -s dist -l 8080 &
FRONTEND_PID=$!

echo "Proxmox Manager Portal started successfully!"
echo "- Frontend: http://localhost:8080"
echo "- Proxy API: http://localhost:3001"

# Function to handle shutdown
shutdown() {
  echo "Shutting down gracefully..."
  kill -TERM $PROXY_PID 2>/dev/null || true
  kill -TERM $FRONTEND_PID 2>/dev/null || true
  wait $PROXY_PID 2>/dev/null || true
  wait $FRONTEND_PID 2>/dev/null || true
  echo "Shutdown complete"
  exit 0
}

# Trap signals
trap shutdown SIGTERM SIGINT

# Wait for both processes
wait
