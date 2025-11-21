import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  message?: string;      // Error message
  skipSuccessfulRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (use Redis in production)
const rateLimitStore: RateLimitStore = {};

/**
 * Cleanup expired entries periodically
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Get client identifier (IP address or user ID)
 */
function getClientIdentifier(req: Request): string {
  // Use user ID if authenticated, otherwise use IP
  const userId = (req as any).user?.id;
  if (userId) {
    return `user:${userId}`;
  }

  // Get IP address from various headers (proxy-aware)
  const ip = req.ip ||
             req.get('x-forwarded-for') ||
             req.get('x-real-ip') ||
             req.socket.remoteAddress ||
             'unknown';

  return `ip:${ip}`;
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false
  } = config;

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    const identifier = getClientIdentifier(req);
    const now = Date.now();

    // Initialize or get existing entry
    if (!rateLimitStore[identifier] || rateLimitStore[identifier].resetTime < now) {
      rateLimitStore[identifier] = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    const entry = rateLimitStore[identifier];

    // Increment counter
    entry.count++;

    // Set rate limit headers
    const remaining = Math.max(0, maxRequests - entry.count);
    const resetTime = Math.ceil(entry.resetTime / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', resetTime.toString());

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());

      res.status(429).json({
        error: 'Rate limit exceeded',
        message,
        retryAfter
      });
      return;
    }

    // If configured, reset counter on successful response
    if (skipSuccessfulRequests) {
      res.on('finish', () => {
        if (res.statusCode < 400) {
          entry.count = Math.max(0, entry.count - 1);
        }
      });
    }

    next();
  };
}

/**
 * Specific rate limiters for different endpoints
 */

// Login endpoint - strict limits to prevent brute force
export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many login attempts, please try again in 15 minutes'
});

// Password reset - prevent abuse
export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  message: 'Too many password reset requests, please try again in 1 hour'
});

// Registration - prevent spam
export const registrationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  message: 'Too many registration attempts, please try again in 1 hour'
});

// API general - more lenient
export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many API requests, please slow down'
});

// VM operations - moderate limits
export const vmOperationsRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'Too many VM operations, please wait a moment'
});

/**
 * Account lockout after failed login attempts
 */
interface LockoutEntry {
  attempts: number;
  lockedUntil?: number;
}

const lockoutStore: { [key: string]: LockoutEntry } = {};

const LOCKOUT_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

export function checkAccountLockout(identifier: string): boolean {
  const entry = lockoutStore[identifier];
  if (!entry) return false;

  if (entry.lockedUntil && entry.lockedUntil > Date.now()) {
    return true; // Account is locked
  }

  // Lockout expired
  delete lockoutStore[identifier];
  return false;
}

export function recordFailedLogin(identifier: string): void {
  if (!lockoutStore[identifier]) {
    lockoutStore[identifier] = { attempts: 0 };
  }

  const entry = lockoutStore[identifier];
  entry.attempts++;

  if (entry.attempts >= LOCKOUT_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION;
  }
}

export function resetFailedLogins(identifier: string): void {
  delete lockoutStore[identifier];
}

export function getLockoutInfo(identifier: string): { locked: boolean; remainingTime?: number } {
  const entry = lockoutStore[identifier];
  if (!entry || !entry.lockedUntil) {
    return { locked: false };
  }

  const remainingTime = Math.max(0, entry.lockedUntil - Date.now());
  if (remainingTime === 0) {
    delete lockoutStore[identifier];
    return { locked: false };
  }

  return {
    locked: true,
    remainingTime: Math.ceil(remainingTime / 1000)
  };
}

export default {
  createRateLimiter,
  loginRateLimiter,
  passwordResetRateLimiter,
  registrationRateLimiter,
  apiRateLimiter,
  vmOperationsRateLimiter,
  checkAccountLockout,
  recordFailedLogin,
  resetFailedLogins,
  getLockoutInfo
};
