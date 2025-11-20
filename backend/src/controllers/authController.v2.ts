import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { userService } from '../services/userService.js';
import {
  checkAccountLockout,
  recordFailedLogin,
  resetFailedLogins,
  getLockoutInfo
} from '../middleware/rateLimiting.js';

// JWT configuration
const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret-in-production';
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

// Refresh token store (use Redis in production)
interface RefreshTokenEntry {
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const refreshTokenStore = new Map<string, RefreshTokenEntry>();

// Cleanup expired tokens periodically
setInterval(() => {
  const now = new Date();
  for (const [token, entry] of refreshTokenStore.entries()) {
    if (entry.expiresAt < now) {
      refreshTokenStore.delete(token);
    }
  }
}, 60 * 60 * 1000); // Every hour

/**
 * Generate JWT access token
 */
function generateAccessToken(userId: string, email: string, role: string): string {
  return jwt.sign(
    { userId, email, role },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Generate JWT refresh token
 */
function generateRefreshToken(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  refreshTokenStore.set(token, {
    userId,
    token,
    expiresAt,
    createdAt: new Date()
  });

  return token;
}

/**
 * Validate refresh token
 */
function validateRefreshToken(token: string): string | null {
  const entry = refreshTokenStore.get(token);
  if (!entry) return null;

  if (entry.expiresAt < new Date()) {
    refreshTokenStore.delete(token);
    return null;
  }

  return entry.userId;
}

/**
 * Revoke refresh token
 */
function revokeRefreshToken(token: string): void {
  refreshTokenStore.delete(token);
}

/**
 * Revoke all refresh tokens for a user
 */
function revokeAllUserTokens(userId: string): void {
  for (const [token, entry] of refreshTokenStore.entries()) {
    if (entry.userId === userId) {
      refreshTokenStore.delete(token);
    }
  }
}

/**
 * Set auth cookies
 */
function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  // Access token - short-lived, httpOnly
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  // Refresh token - long-lived, httpOnly
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

/**
 * Clear auth cookies
 */
function clearAuthCookies(res: Response): void {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.clearCookie('XSRF-TOKEN');
}

/**
 * Login endpoint
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
      return;
    }

    // Get client identifier for rate limiting
    const identifier = req.ip || email;

    // Check account lockout
    if (checkAccountLockout(identifier)) {
      const lockoutInfo = getLockoutInfo(identifier);
      res.status(429).json({
        error: 'Account locked',
        message: `Too many failed login attempts. Please try again in ${Math.ceil(lockoutInfo.remainingTime! / 60)} minutes`
      });
      return;
    }

    // Find user
    const user = await userService.findByEmail(email);
    if (!user) {
      recordFailedLogin(identifier);
      res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      recordFailedLogin(identifier);
      res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({
        error: 'Account disabled',
        message: 'Your account has been disabled'
      });
      return;
    }

    // Reset failed login attempts
    resetFailedLogins(identifier);

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Set cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Update last login
    await userService.update(user.id, {
      lastLoginAt: new Date()
    });

    // Return user info (no sensitive data)
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      tokens: {
        expiresIn: 900 // 15 minutes in seconds
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred during login'
    });
  }
};

/**
 * Register endpoint
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      res.status(400).json({
        error: 'Missing fields',
        message: 'Email, password, and name are required'
      });
      return;
    }

    // Check if user exists
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      res.status(409).json({
        error: 'User exists',
        message: 'An account with this email already exists'
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await userService.create({
      email,
      name,
      username: email.split('@')[0],
      role: 'user', // Default role
      passwordHash,
      isActive: true
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Set cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Return user info
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      tokens: {
        expiresIn: 900
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred during registration'
    });
  }
};

/**
 * Refresh token endpoint
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      res.status(401).json({
        error: 'No refresh token',
        message: 'Refresh token is required'
      });
      return;
    }

    // Validate refresh token
    const userId = validateRefreshToken(refreshToken);
    if (!userId) {
      clearAuthCookies(res);
      res.status(401).json({
        error: 'Invalid refresh token',
        message: 'Refresh token is invalid or expired'
      });
      return;
    }

    // Get user
    const user = await userService.findById(userId);
    if (!user || !user.isActive) {
      clearAuthCookies(res);
      res.status(401).json({
        error: 'User not found',
        message: 'User account not found or disabled'
      });
      return;
    }

    // Rotate refresh token (revoke old, issue new)
    revokeRefreshToken(refreshToken);
    const newRefreshToken = generateRefreshToken(user.id);

    // Generate new access token
    const accessToken = generateAccessToken(user.id, user.email, user.role);

    // Set new cookies
    setAuthCookies(res, accessToken, newRefreshToken);

    res.status(200).json({
      expiresIn: 900
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred during token refresh'
    });
  }
};

/**
 * Logout endpoint
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refresh_token;

    // Revoke refresh token if exists
    if (refreshToken) {
      revokeRefreshToken(refreshToken);
    }

    // Clear cookies
    clearAuthCookies(res);

    res.status(200).json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred during logout'
    });
  }
};

/**
 * Get current user endpoint
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user; // Set by auth middleware

    if (!user) {
      res.status(401).json({
        error: 'Not authenticated',
        message: 'User is not authenticated'
      });
      return;
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'An error occurred while fetching user'
    });
  }
};

/**
 * Check authentication endpoint
 */
export const checkAuth = async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;

  if (user) {
    res.status(200).json({ authenticated: true });
  } else {
    res.status(401).json({ authenticated: false });
  }
};

/**
 * Logout all sessions (revoke all refresh tokens)
 */
export const logoutAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        error: 'Not authenticated'
      });
      return;
    }

    // Revoke all refresh tokens for this user
    revokeAllUserTokens(user.id);

    // Clear cookies
    clearAuthCookies(res);

    res.status(200).json({
      message: 'Logged out from all sessions'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      error: 'Server error'
    });
  }
};

export default {
  login,
  register,
  refreshToken,
  logout,
  getCurrentUser,
  checkAuth,
  logoutAll
};
