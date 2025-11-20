import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '@/middleware/errorHandler.js';
import { AppError } from '@/middleware/errorHandler.js';
import { LoginInput, CreateUserInput } from '@/types/schemas.js';
import { userService } from '@/services/userService.js';

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password }: LoginInput = req.body;

    // Find user by email
    const user = await userService.findByEmail(email);
    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update last login timestamp
    await userService.updateLastLogin(user.id);

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const token = (jwt.sign as any)(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });
  }),

  register: asyncHandler(async (req: Request, res: Response) => {
    const userData: CreateUserInput = req.body;

    // Check if user already exists
    const existingUser = await userService.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Generate username from email if not provided
    const username = userData.username || userData.email.split('@')[0];

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 12);

    // Create new user
    const newUser = await userService.create({
      ...userData,
      username,
      passwordHash,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        }
      }
    });
  }),

  logout: asyncHandler(async (_req: Request, res: Response) => {
    // In a real app, you'd invalidate the token here
    res.json({
      success: true,
      message: 'Logout successful'
    });
  }),

  refreshToken: asyncHandler(async (_req: Request, res: Response) => {
    // Implement token refresh logic
    res.json({
      success: true,
      message: 'Token refresh not implemented yet'
    });
  }),

  forgotPassword: asyncHandler(async (_req: Request, res: Response) => {
    // Implement forgot password logic
    res.json({
      success: true,
      message: 'Forgot password not implemented yet'
    });
  }),

  resetPassword: asyncHandler(async (_req: Request, res: Response) => {
    // Implement reset password logic
    res.json({
      success: true,
      message: 'Reset password not implemented yet'
    });
  })
};
