
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all requests
app.use(cors());

// Parse JSON bodies
app.use(bodyParser.json());

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Store server connections in memory (for dev/test only)
const servers = {};

// Simple endpoint to check if the proxy is running
app.get('/', (req, res) => {
  res.send({ status: 'Proxmox API Proxy running' });
});

// Handle API requests
app.all('/api/:serverId/*', (req, res, next) => {
  const serverId = req.params.serverId;
  
  // Get server info from our in-memory store
  const server = servers[serverId];
  if (!server) {
    return res.status(404).json({ error: 'Server not found' });
  }
  
  // Create dynamic proxy target
  const target = `https://${server.host}:${server.port}`;
  
  // Extract the actual API path from the request
  const pathRewrite = (path) => {
    return path.replace(`/api/${serverId}`, '');
  };
  
  // Create a proxy for this specific request
  const apiProxy = createProxyMiddleware({
    target,
    pathRewrite,
    changeOrigin: true,
    secure: false, // Set to true in production!
    onProxyReq: (proxyReq, req, res) => {
      // Log the proxied request
      console.log(`Proxying request to ${target}${pathRewrite(req.url)}`);
    }
  });
  
  // Apply the proxy to this request
  apiProxy(req, res, next);
});

// Register a server connection
app.post('/register-server', (req, res) => {
  const { id, host, port } = req.body;
  
  if (!id || !host || !port) {
    return res.status(400).json({ error: 'Missing required server details' });
  }
  
  servers[id] = { host, port };
  
  console.log(`Registered server: ${id} -> ${host}:${port}`);
  res.json({ success: true, message: `Server ${id} registered` });
});

// Start the server
app.listen(port, () => {
  console.log(`Proxmox API Proxy listening at http://localhost:${port}`);
  console.log('IMPORTANT: This proxy is for development use only!');
});
