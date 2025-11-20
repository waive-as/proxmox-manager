import api from '../lib/api';

// TypeScript interfaces
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'readonly';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

class AuthService {
  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        data: {
          token: string;
          user: User;
        };
      }>('/auth/login', {
        email,
        password,
      });

      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data;
        
        // Store token in localStorage
        localStorage.setItem('auth_token', token);
        
        return { token, user };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response?.status === 400) {
        throw new Error('Please check your email and password format');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Login failed. Please try again.');
      }
    }
  }

  /**
   * Register a new user
   */
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        data: {
          user: User;
        };
      }>('/auth/register', {
        email,
        password,
        name,
      });

      if (response.data.success && response.data.data) {
        const { user } = response.data.data;
        
        // For registration, we need to login to get the token
        const loginResponse = await this.login(email, password);
        return loginResponse;
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorMessage = error.response.data.message || 'Please check your input format';
        throw new Error(errorMessage);
      } else if (error.response?.status === 409) {
        throw new Error('Email already exists');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint if available
      await api.post('/auth/logout');
    } catch (error) {
      // Even if logout fails on server, we should clear local token
      console.warn('Logout request failed, but clearing local token');
    } finally {
      // Always clear token from localStorage
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<{ success: boolean; data: User }>('/users/profile');
      
      if (response.data.success && response.data.data) {
        // Remove username field if it exists (backend includes it but frontend doesn't need it)
        const { username, ...userWithoutUsername } = response.data.data as any;
        return userWithoutUsername;
      } else {
        throw new Error('Invalid user data received');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Token is invalid, clear it
        localStorage.removeItem('auth_token');
        throw new Error('Session expired. Please login again.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to get user information');
      }
    }
  }

  /**
   * Check if user is authenticated (has valid token)
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token;
  }

  /**
   * Get stored token
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
