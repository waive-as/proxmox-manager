import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '@/config/index.js';
import { JWTPayload } from '@/types/schemas.js';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, config.bcryptRounds);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  const secret = config.jwtSecret || 'fallback-secret';
  return (jwt.sign as any)(payload, secret, {
    expiresIn: config.jwtExpiresIn
  });
};

export const verifyToken = (token: string): JWTPayload => {
  const secret = config.jwtSecret || 'fallback-secret';
  return jwt.verify(token, secret) as JWTPayload;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const formatDate = (date: Date): string => {
  return date.toISOString();
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  return { isValid: true };
};
