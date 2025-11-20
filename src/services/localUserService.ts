import { storageService, User } from '../lib/localStorage';

/**
 * LocalUser Service - User management using localStorage only
 * Use this when backend is not available
 */
class LocalUserService {
  async getAllUsers(): Promise<User[]> {
    try {
      return storageService.getUsers();
    } catch (error) {
      console.error('Failed to get users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'user' | 'readonly';
  }): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = storageService.getUserByEmail(userData.email);
      if (existingUser) {
        throw new Error('A user with this email already exists');
      }

      // Validate password strength
      if (!storageService.validatePasswordStrength(userData.password)) {
        throw new Error(storageService.getPasswordRequirements());
      }

      // Create user
      const newUser = storageService.addUser({
        username: userData.email.split('@')[0],
        email: userData.email,
        name: userData.name,
        role: userData.role,
      });

      // Hash and store password
      const passwordHash = await this.hashPassword(userData.password);
      localStorage.setItem(`user_password_${newUser.id}`, passwordHash);

      return newUser;
    } catch (error: any) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  async updateUser(
    userId: string,
    userData: {
      name?: string;
      email?: string;
      role?: 'admin' | 'user' | 'readonly';
      password?: string;
    }
  ): Promise<User> {
    try {
      const user = storageService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // If password is being updated, validate and hash it
      if (userData.password) {
        if (!storageService.validatePasswordStrength(userData.password)) {
          throw new Error(storageService.getPasswordRequirements());
        }
        const passwordHash = await this.hashPassword(userData.password);
        localStorage.setItem(`user_password_${userId}`, passwordHash);
      }

      // Update user
      const updates: Partial<User> = {};
      if (userData.name) updates.name = userData.name;
      if (userData.email) updates.email = userData.email;
      if (userData.role) updates.role = userData.role;

      const success = storageService.updateUser(userId, updates);
      if (!success) {
        throw new Error('Failed to update user');
      }

      const updatedUser = storageService.getUserById(userId);
      if (!updatedUser) {
        throw new Error('User not found after update');
      }

      return updatedUser;
    } catch (error: any) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      // Remove password
      localStorage.removeItem(`user_password_${userId}`);

      // Invalidate sessions
      storageService.invalidateAllUserSessions(userId);

      // Delete user
      const success = storageService.deleteUser(userId);
      if (!success) {
        throw new Error('User not found');
      }
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  }

  async toggleUserStatus(userId: string, isActive: boolean): Promise<User> {
    try {
      const success = storageService.updateUser(userId, { isActive });
      if (!success) {
        throw new Error('User not found');
      }

      const user = storageService.getUserById(userId);
      if (!user) {
        throw new Error('User not found after update');
      }

      // If deactivating, invalidate all sessions
      if (!isActive) {
        storageService.invalidateAllUserSessions(userId);
      }

      return user;
    } catch (error: any) {
      console.error('Failed to toggle user status:', error);
      throw error;
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'proxmox-salt-2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

export const localUserService = new LocalUserService();
