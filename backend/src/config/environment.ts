import dotenv from 'dotenv';
import path from 'path';

/**
 * Load environment variables from .env file
 * Priority: .env.{NODE_ENV} > .env
 */
const NODE_ENV = process.env.NODE_ENV || 'development';
const envFile = `.env.${NODE_ENV}`;
const envFilePath = path.resolve(process.cwd(), envFile);

// Try to load environment-specific file first
try {
  dotenv.config({ path: envFilePath });
  console.log(`✅ Loaded environment from ${envFile}`);
} catch (error) {
  // Fall back to .env
  dotenv.config();
  console.log(`✅ Loaded environment from .env`);
}

/**
 * Type-safe environment configuration
 */
export interface EnvironmentConfig {
  // Application
  nodeEnv: 'development' | 'staging' | 'production';
  port: number;
  allowedOrigins: string[];

  // Database
  databaseProvider: 'sqlite' | 'postgresql';
  databaseUrl: string;

  // Authentication
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtAccessTokenExpiry: string;
  jwtRefreshTokenExpiry: string;
  bcryptRounds: number;

  // CSRF
  csrfTokenLength: number;
  csrfTokenExpiry: number;

  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  loginRateLimit: number;
  accountLockoutDuration: number;

  // Session
  sessionExpiry: number;
  sessionCleanupInterval: number;

  // Redis (optional)
  redisUrl?: string;
  redisPassword?: string;

  // Logging
  logLevel: string;
  logFilePath?: string;
  logMaxSize: string;
  logMaxFiles: string;
  logPrettyPrint: boolean;
  logSqlQueries: boolean;

  // Proxmox
  proxmoxDefaultPort: number;
  proxmoxTimeout: number;
  proxmoxAllowInsecure: boolean;

  // Email (optional)
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFrom?: string;

  // Monitoring
  enableMetrics: boolean;
  metricsPort?: number;
  sentryDsn?: string;

  // Feature Flags
  enable2FA: boolean;
  enableEmail: boolean;
  enableWebhooks: boolean;
  enableApiDocs: boolean;

  // Debug
  debug: boolean;
}

/**
 * Parse environment variable as boolean
 */
function parseBoolean(value: string | undefined, defaultValue: boolean = false): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Parse environment variable as number
 */
function parseNumber(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse comma-separated list
 */
function parseList(value: string | undefined, defaultValue: string[] = []): string[] {
  if (!value) return defaultValue;
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * Validate required environment variables
 */
function validateEnvironment(): void {
  const required = [
    'DATABASE_PROVIDER',
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env file or environment configuration.`
    );
  }

  // Warn about insecure secrets in production
  if (NODE_ENV === 'production') {
    if (process.env.JWT_SECRET?.includes('change-this')) {
      console.warn(
        '⚠️  WARNING: Using default JWT_SECRET in production! ' +
        'This is highly insecure. Generate a strong secret with: openssl rand -base64 32'
      );
    }

    if (process.env.PROXMOX_ALLOW_INSECURE === 'true') {
      console.warn(
        '⚠️  WARNING: PROXMOX_ALLOW_INSECURE is enabled in production! ' +
        'This bypasses SSL certificate validation.'
      );
    }
  }
}

/**
 * Load and export environment configuration
 */
export const env: EnvironmentConfig = {
  // Application
  nodeEnv: (NODE_ENV as any) || 'development',
  port: parseNumber(process.env.PORT, 3002),
  allowedOrigins: parseList(process.env.ALLOWED_ORIGINS, ['http://localhost:8081']),

  // Database
  databaseProvider: (process.env.DATABASE_PROVIDER as any) || 'sqlite',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',

  // Authentication
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
  jwtAccessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
  jwtRefreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
  bcryptRounds: parseNumber(process.env.BCRYPT_ROUNDS, 12),

  // CSRF
  csrfTokenLength: parseNumber(process.env.CSRF_TOKEN_LENGTH, 32),
  csrfTokenExpiry: parseNumber(process.env.CSRF_TOKEN_EXPIRY, 3600000),

  // Rate Limiting
  rateLimitWindowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 900000),
  rateLimitMaxRequests: parseNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
  loginRateLimit: parseNumber(process.env.LOGIN_RATE_LIMIT, 5),
  accountLockoutDuration: parseNumber(process.env.ACCOUNT_LOCKOUT_DURATION, 1800000),

  // Session
  sessionExpiry: parseNumber(process.env.SESSION_EXPIRY, 3600000),
  sessionCleanupInterval: parseNumber(process.env.SESSION_CLEANUP_INTERVAL, 600000),

  // Redis
  redisUrl: process.env.REDIS_URL,
  redisPassword: process.env.REDIS_PASSWORD,

  // Logging
  logLevel: process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug'),
  logFilePath: process.env.LOG_FILE_PATH,
  logMaxSize: process.env.LOG_MAX_SIZE || '10m',
  logMaxFiles: process.env.LOG_MAX_FILES || '30d',
  logPrettyPrint: parseBoolean(process.env.LOG_PRETTY_PRINT, NODE_ENV !== 'production'),
  logSqlQueries: parseBoolean(process.env.LOG_SQL_QUERIES, false),

  // Proxmox
  proxmoxDefaultPort: parseNumber(process.env.PROXMOX_DEFAULT_PORT, 8006),
  proxmoxTimeout: parseNumber(process.env.PROXMOX_TIMEOUT, 30000),
  proxmoxAllowInsecure: parseBoolean(process.env.PROXMOX_ALLOW_INSECURE, false),

  // Email
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseNumber(process.env.SMTP_PORT, 587),
  smtpSecure: parseBoolean(process.env.SMTP_SECURE, true),
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  smtpFrom: process.env.SMTP_FROM,

  // Monitoring
  enableMetrics: parseBoolean(process.env.ENABLE_METRICS, false),
  metricsPort: parseNumber(process.env.METRICS_PORT, 9090),
  sentryDsn: process.env.SENTRY_DSN,

  // Feature Flags
  enable2FA: parseBoolean(process.env.ENABLE_2FA, false),
  enableEmail: parseBoolean(process.env.ENABLE_EMAIL, false),
  enableWebhooks: parseBoolean(process.env.ENABLE_WEBHOOKS, false),
  enableApiDocs: parseBoolean(process.env.ENABLE_API_DOCS, NODE_ENV !== 'production'),

  // Debug
  debug: parseBoolean(process.env.DEBUG, NODE_ENV === 'development'),
};

// Validate environment on load
try {
  validateEnvironment();
} catch (error) {
  console.error('❌ Environment validation failed:', error);
  process.exit(1);
}

// Log configuration summary
console.log('📋 Environment Configuration:');
console.log(`   Environment: ${env.nodeEnv}`);
console.log(`   Port: ${env.port}`);
console.log(`   Database: ${env.databaseProvider}`);
console.log(`   Log Level: ${env.logLevel}`);
console.log(`   API Docs: ${env.enableApiDocs ? 'Enabled' : 'Disabled'}`);
console.log(`   Metrics: ${env.enableMetrics ? 'Enabled' : 'Disabled'}`);

export default env;
