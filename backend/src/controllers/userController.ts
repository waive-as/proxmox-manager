import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '@/middleware/errorHandler.js';
import { AppError } from '@/middleware/errorHandler.js';
import { AuthenticatedRequest } from '@/middleware/auth.js';
import { CreateUserInput, UpdateUserInput, ToggleUserStatusInput } from '@/types/schemas.js';
import { userService } from '@/services/userService.js';

export const userController = {
  // Get all users (admin only)
  getAllUsers: asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const users = await userService.getAllUsersSafe();
    
    res.json({
      success: true,
      data: users
    });
  }),

  // Create new user (admin only)
  createUser: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userData: CreateUserInput = req.body;

    // Check if user already exists
    const existingUser = await userService.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Generate username from email if not provided
    const username = userData.email.split('@')[0];

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, 12);

    // Create new user
    const newUser = await userService.create({
      ...userData,
      username,
      passwordHash,
      isActive: true
    });

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userWithoutPassword
    });
  }),

  // Update user (admin only)
  updateUser: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updates: UpdateUserInput = req.body;
    const currentUserId = req.user!.userId;

    // Can't change own role
    if (id === currentUserId && updates.role) {
      throw new AppError('Cannot change your own role', 400);
    }

    // Check if user exists
    const existingUser = await userService.findById(id);
    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    // Check email uniqueness if email is being changed
    if (updates.email && updates.email !== existingUser.email) {
      const emailExists = await userService.findByEmail(updates.email);
      if (emailExists) {
        throw new AppError('Email already in use', 400);
      }
    }

    // Hash password if provided
    let passwordHash = existingUser.passwordHash;
    if (updates.password) {
      passwordHash = await bcrypt.hash(updates.password, 12);
    }

    // Update user
    const updatedUser = await userService.update(id, {
      ...updates,
      passwordHash
    });

    if (!updatedUser) {
      throw new AppError('Failed to update user', 500);
    }

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      message: 'User updated successfully',
      data: userWithoutPassword
    });
  }),

  // Delete user (admin only)
  deleteUser: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const currentUserId = req.user!.userId;

    // Check if user can be deleted
    const canDelete = await userService.canDeleteUser(id, currentUserId);
    if (!canDelete.canDelete) {
      throw new AppError(canDelete.reason!, 400);
    }

    // Delete user
    const success = await userService.delete(id);
    if (!success) {
      throw new AppError('Failed to delete user', 500);
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  }),

  // Toggle user status (admin only)
  toggleUserStatus: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { isActive }: ToggleUserStatusInput = req.body;
    const currentUserId = req.user!.userId;

    // Can't deactivate self
    if (id === currentUserId && !isActive) {
      throw new AppError('Cannot deactivate your own account', 400);
    }

    // Check if user exists
    const existingUser = await userService.findById(id);
    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    // If deactivating an admin, check if it's the last admin
    if (!isActive && existingUser.role === 'ADMIN') {
      const adminCount = await userService.getAll().then(users => 
        users.filter(user => user.role === 'ADMIN' && user.isActive).length
      );

      if (adminCount <= 1) {
        throw new AppError('Cannot deactivate the last admin user', 400);
      }
    }

    // Update user status
    const updatedUser = await userService.update(id, { isActive });

    if (!updatedUser) {
      throw new AppError('Failed to update user status', 500);
    }

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: userWithoutPassword
    });
  }),

  // Get current user profile
  getProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const user = await userService.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword
    });
  }),

  // Update current user profile
  updateProfile: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.userId;
    const updates: UpdateUserInput = req.body;

    // Don't allow role changes in profile update
    if (updates.role) {
      throw new AppError('Cannot change role through profile update', 400);
    }

    // Check email uniqueness if email is being changed
    if (updates.email) {
      const existingUser = await userService.findById(userId);
      if (existingUser && updates.email !== existingUser.email) {
        const emailExists = await userService.findByEmail(updates.email);
        if (emailExists) {
          throw new AppError('Email already in use', 400);
        }
      }
    }

    // Hash password if provided
    let passwordHash: string | undefined;
    if (updates.password) {
      passwordHash = await bcrypt.hash(updates.password, 12);
    }

    // Update user
    const updatedUser = await userService.update(userId, {
      ...updates,
      ...(passwordHash && { passwordHash })
    });

    if (!updatedUser) {
      throw new AppError('Failed to update profile', 500);
    }

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: userWithoutPassword
    });
  })
};