import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';
const CSRF_FORM_FIELD = '_csrf';

// In-memory token store (in production, use Redis or database)
const tokenStore = new Map<string, Set<string>>();

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Store CSRF token for a user session
 */
function storeToken(sessionId: string, token: string): void {
  if (!tokenStore.has(sessionId)) {
    tokenStore.set(sessionId, new Set());
  }
  tokenStore.get(sessionId)!.add(token);
}

/**
 * Validate CSRF token for a user session
 */
function validateToken(sessionId: string, token: string): boolean {
  const tokens = tokenStore.get(sessionId);
  if (!tokens) return false;
  return tokens.has(token);
}

/**
 * Cleanup old tokens (call periodically)
 */
export function cleanupTokens(): void {
  // In production, implement TTL-based cleanup
  // For now, this is a placeholder
}

/**
 * Middleware to generate and attach CSRF token to response
 * Should be applied to routes that render forms or return initial state
 */
export function generateCSRFMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Get or create session ID (from JWT, session cookie, etc.)
  const sessionId = req.user?.userId || req.sessionID || 'anonymous';

  // Generate new CSRF token
  const token = generateCSRFToken();

  // Store token
  storeToken(sessionId, token);

  // Set token in cookie (for double-submit pattern)
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by JavaScript
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',
    maxAge: 3600000 // 1 hour
  });

  // Attach token to response for use in forms
  (res.locals as any).csrfToken = token;

  next();
}

/**
 * Middleware to validate CSRF token on state-changing requests
 * Should be applied to POST, PUT, PATCH, DELETE routes
 */
export function validateCSRFMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip CSRF validation for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Get session ID
  const sessionId = req.user?.userId || req.sessionID || 'anonymous';

  // Get token from header or form body
  const headerToken = req.get(CSRF_HEADER_NAME);
  const bodyToken = req.body?.[CSRF_FORM_FIELD];
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];

  const submittedToken = headerToken || bodyToken;

  // Validate token exists
  if (!submittedToken) {
    res.status(403).json({
      error: 'CSRF token missing',
      message: 'CSRF token is required for this operation'
    });
    return;
  }

  // Validate token matches cookie (double-submit pattern)
  if (submittedToken !== cookieToken) {
    res.status(403).json({
      error: 'CSRF token mismatch',
      message: 'CSRF token does not match'
    });
    return;
  }

  // Validate token is in store (server-side validation)
  if (!validateToken(sessionId, submittedToken)) {
    res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'CSRF token is invalid or expired'
    });
    return;
  }

  // Token is valid - optionally remove it for one-time use
  // removeToken(sessionId, submittedToken);

  next();
}

/**
 * Middleware to apply both generate and validate based on request method
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // Generate token for safe methods
    generateCSRFMiddleware(req, res, next);
  } else {
    // Validate token for state-changing methods
    validateCSRFMiddleware(req, res, next);
  }
}

/**
 * Express error handler for CSRF errors
 */
export function csrfErrorHandler(err: any, _req: Request, res: Response, next: NextFunction): void {
  if (err.code === 'EBADCSRFTOKEN') {
    res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'Form validation failed. Please refresh and try again.'
    });
    return;
  }
  next(err);
}

export default {
  generateCSRFToken,
  generateCSRFMiddleware,
  validateCSRFMiddleware,
  csrfProtection,
  csrfErrorHandler,
  cleanupTokens
};
