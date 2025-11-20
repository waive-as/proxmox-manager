import api from '../lib/api';

// TypeScript interfaces
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'readonly';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user' | 'readonly';
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: 'admin' | 'user' | 'readonly';
  password?: string;
}

export interface ToggleUserStatusData {
  isActive: boolean;
}

class UserService {
  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await api.get<{
        success: boolean;
        data: User[];
      }>('/users');

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to view users');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to fetch users');
      }
    }
  }

  /**
   * Create a new user (admin only)
   */
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        data: User;
      }>('/users', userData);

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create user');
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to create users');
      } else if (error.response?.status === 400) {
        const errorMessage = error.response.data.message || 'Invalid user data';
        throw new Error(errorMessage);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to create user');
      }
    }
  }

  /**
   * Update a user (admin only)
   */
  async updateUser(userId: string, userData: UpdateUserData): Promise<User> {
    try {
      const response = await api.put<{
        success: boolean;
        message: string;
        data: User;
      }>(`/users/${userId}`, userData);

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update user');
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to update users');
      } else if (error.response?.status === 404) {
        throw new Error('User not found');
      } else if (error.response?.status === 400) {
        const errorMessage = error.response.data.message || 'Invalid user data';
        throw new Error(errorMessage);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to update user');
      }
    }
  }

  /**
   * Delete a user (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const response = await api.delete<{
        success: boolean;
        message: string;
      }>(`/users/${userId}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete user');
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to delete users');
      } else if (error.response?.status === 404) {
        throw new Error('User not found');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to delete user');
      }
    }
  }

  /**
   * Toggle user status (active/inactive) (admin only)
   */
  async toggleUserStatus(userId: string, isActive: boolean): Promise<User> {
    try {
      const response = await api.put<{
        success: boolean;
        message: string;
        data: User;
      }>(`/users/${userId}/status`, { isActive });

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update user status');
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to update user status');
      } else if (error.response?.status === 404) {
        throw new Error('User not found');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to update user status');
      }
    }
  }

  /**
   * Update current user's profile
   */
  async updateProfile(userData: UpdateUserData): Promise<User> {
    try {
      const response = await api.put<{
        success: boolean;
        message: string;
        data: User;
      }>('/users/profile', userData);

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorMessage = error.response.data.message || 'Invalid profile data';
        throw new Error(errorMessage);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to update profile');
      }
    }
  }
}

export const userService = new UserService();
