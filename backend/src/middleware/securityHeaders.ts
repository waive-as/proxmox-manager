import { Request, Response, NextFunction } from 'express';

/**
 * Security headers middleware
 * Adds comprehensive security headers to all responses
 */
export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction): void {
  // Content Security Policy (CSP)
  // Restricts sources for scripts, styles, images, etc.
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: remove unsafe-* in production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' http://localhost:* https://localhost:*",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');

  res.setHeader('Content-Security-Policy', cspDirectives);

  // Prevent page from being displayed in frame/iframe (clickjacking protection)
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable browser XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (formerly Feature Policy)
  const permissionsPolicy = [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', ');

  res.setHeader('Permissions-Policy', permissionsPolicy);

  // HTTP Strict Transport Security (HSTS)
  // Only enable in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Remove potentially revealing headers
  res.removeHeader('X-Powered-By');

  next();
}

/**
 * CORS configuration middleware
 * More restrictive CORS policy
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:8081',
    'http://localhost:3000'
  ];

  const origin = req.get('origin');

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-XSRF-TOKEN');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send();
    return;
  }

  next();
}

/**
 * Disable caching for sensitive endpoints
 */
export function noCacheMiddleware(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
}

export default {
  securityHeadersMiddleware,
  corsMiddleware,
  noCacheMiddleware
};
