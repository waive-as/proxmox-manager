import { Request, Response } from 'express';
import { prisma } from '@/config/database.js';
import { userService } from '@/services/userService.js';
import { ApiError } from '@/utils/ApiError.js';

/**
 * Check if initial setup is needed
 * Returns true if no admin users exist
 */
export const checkSetupStatus = async (_req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();

    res.json({
      needsSetup: userCount === 0,
      message: userCount === 0
        ? 'Initial setup required'
        : 'Setup already completed'
    });
  } catch (error) {
    console.error('Setup status check error:', error);
    throw new ApiError(500, 'Failed to check setup status');
  }
};

/**
 * Initialize the application with first admin user
 * Should only work if no users exist
 */
export const initializeSetup = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      throw new ApiError(400, 'Email, password, and name are required');
    }

    // Check if setup is still needed
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      throw new ApiError(400, 'Setup has already been completed');
    }

    // Hash password
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.default.hash(password, 12);

    // Create first admin user
    const user = await userService.create({
      email,
      passwordHash,
      name,
      username: email.split('@')[0],
      role: 'ADMIN',
      isActive: true
    });

    res.status(201).json({
      message: 'Setup completed successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('Setup initialization error:', error);
    throw new ApiError(500, 'Failed to complete setup');
  }
};
