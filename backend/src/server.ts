import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler.js';
import { rateLimiter } from '@/middleware/rateLimiter.js';
import authRoutes from '@/routes/auth.js';
import userRoutes from '@/routes/users.js';
import serverRoutes from '@/routes/servers.js';
import proxmoxRoutes from '@/routes/proxmox.js';
import { userService } from '@/services/userService.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8081',
  credentials: true
}));

// Rate limiting
app.use(rateLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/proxmox', proxmoxRoutes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize default admin user and start server
const startServer = async () => {
  try {
    // Initialize default admin user if no users exist
    await userService.initializeDefaultAdmin();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
