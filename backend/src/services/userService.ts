import prisma from './prisma.js';

// Database model interfaces
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: string; // ADMIN, READONLY, USER
  passwordHash: string;
  isActive: boolean;
  requirePasswordChange?: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const userService = {
  findById: async (id: string): Promise<User | undefined> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id }
      });
      return user ? {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase(), // Convert to lowercase for API
        passwordHash: user.password,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      } : undefined;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return undefined;
    }
  },

  findByEmail: async (email: string): Promise<User | undefined> => {
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });
      return user ? {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase(), // Convert to lowercase for API
        passwordHash: user.password,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      } : undefined;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return undefined;
    }
  },

  create: async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    try {
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          password: userData.passwordHash,
          name: userData.name,
          role: userData.role.toUpperCase(), // Convert to uppercase for database
          isActive: userData.isActive
        }
      });
      
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase(), // Convert back to lowercase for API
        passwordHash: user.password,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  update: async (id: string, updates: Partial<User> & { password?: string }): Promise<User | undefined> => {
    try {
      const updateData: any = {};

      if (updates.username !== undefined) updateData.username = updates.username;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.passwordHash !== undefined) updateData.password = updates.passwordHash;
      if (updates.password !== undefined) updateData.password = updates.password;
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.role !== undefined) updateData.role = updates.role.toUpperCase();
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
      if (updates.requirePasswordChange !== undefined) updateData.requirePasswordChange = updates.requirePasswordChange;

      const user = await prisma.user.update({
        where: { id },
        data: updateData
      });

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase(), // Convert to lowercase for API
        passwordHash: user.password,
        isActive: user.isActive,
        requirePasswordChange: user.requirePasswordChange,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      await prisma.user.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  },

  getAll: async (): Promise<User[]> => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      return users.map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase(), // Convert to lowercase for API
        passwordHash: user.password,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  },

  // Update last login timestamp
  updateLastLogin: async (userId: string): Promise<void> => {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() }
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  },

  // Check if user can be deleted (not self, not last admin)
  canDeleteUser: async (userId: string, currentUserId: string): Promise<{ canDelete: boolean; reason?: string }> => {
    try {
      // Can't delete self
      if (userId === currentUserId) {
        return { canDelete: false, reason: 'Cannot delete your own account' };
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        return { canDelete: false, reason: 'User not found' };
      }

      // If deleting an admin, check if it's the last admin
      if (user.role === 'ADMIN') {
        const adminCount = await prisma.user.count({
          where: { role: 'ADMIN', isActive: true }
        });

        if (adminCount <= 1) {
          return { canDelete: false, reason: 'Cannot delete the last admin user' };
        }
      }

      return { canDelete: true };
    } catch (error) {
      console.error('Error checking if user can be deleted:', error);
      return { canDelete: false, reason: 'Error checking permissions' };
    }
  },

  // Get users without passwords (for admin listing)
  getAllUsersSafe: async (): Promise<Omit<User, 'passwordHash'>[]> => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      return users.map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase(), // Convert to lowercase for API
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
    } catch (error) {
      console.error('Error getting all users safely:', error);
      return [];
    }
  },

  // Initialize default admin user if no admin users exist
  initializeDefaultAdmin: async (): Promise<void> => {
    try {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true }
      });
      
      if (adminCount === 0) {
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash('Admin123!', 12);
        
        await prisma.user.create({
          data: {
            username: 'peter.skaugvold',
            email: 'peter.skaugvold@waive.no',
            password: hashedPassword,
            name: 'System Administrator',
            role: 'ADMIN',
            isActive: true
          }
        });
        
        console.log('===========================================');
        console.log('🔐 Default Admin User Created');
        console.log('Email: peter.skaugvold@waive.no');
        console.log('Password: Admin123!');
        console.log('⚠️  Please change this password immediately!');
        console.log('===========================================');
      }
    } catch (error) {
      console.error('Error initializing default admin:', error);
    }
  }
};
