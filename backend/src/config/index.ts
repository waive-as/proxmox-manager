import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  databaseUrl: process.env.DATABASE_URL || '',
  
  // JWT configuration
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8081',
  
  // Proxmox configuration
  proxmoxDefaultPort: parseInt(process.env.PROXMOX_DEFAULT_PORT || '8006'),
  proxmoxTimeout: parseInt(process.env.PROXMOX_TIMEOUT || '30000'),
  
  // Security configuration
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  
  // Logging configuration
  logLevel: process.env.LOG_LEVEL || 'info',
  logFormat: process.env.LOG_FORMAT || 'combined'
};

export default config;
