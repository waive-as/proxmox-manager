// Cookie-based Authentication Service
// Replaces localStorage-based authentication for improved security

import { api } from './api';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user' | 'readonly';
  };
  tokens: AuthTokens;
}

/**
 * Cookie-based authentication service
 * Tokens are stored in httpOnly cookies (not accessible to JavaScript)
 */
class CookieAuthService {
  private refreshTokenTimeout: NodeJS.Timeout | null = null;

  /**
   * Login with email and password
   * Tokens are automatically stored in httpOnly cookies by the server
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password
      }, {
        withCredentials: true // Important: send/receive cookies
      });

      // Schedule automatic token refresh
      this.scheduleTokenRefresh(response.data.tokens.expiresIn);

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  /**
   * Register a new user
   */
  async register(email: string, password: string, name: string): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/auth/register', {
        email,
        password,
        name
      }, {
        withCredentials: true
      });

      this.scheduleTokenRefresh(response.data.tokens.expiresIn);

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  /**
   * Logout - clears cookies on server
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout', {}, {
        withCredentials: true
      });

      this.cancelTokenRefresh();
    } catch (error) {
      console.error('Logout error:', error);
      // Clear timeout even if request fails
      this.cancelTokenRefresh();
    }
  }

  /**
   * Refresh access token using refresh token
   * Called automatically before access token expires
   */
  async refreshAccessToken(): Promise<void> {
    try {
      const response = await api.post<{ expiresIn: number }>('/auth/refresh', {}, {
        withCredentials: true
      });

      // Schedule next refresh
      this.scheduleTokenRefresh(response.data.expiresIn);
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, user needs to login again
      this.cancelTokenRefresh();
      // Optionally redirect to login
      window.location.href = '/login';
    }
  }

  /**
   * Get current user
   * Since we can't read httpOnly cookies, we need to call the API
   */
  async getCurrentUser(): Promise<LoginResponse['user'] | null> {
    try {
      const response = await api.get<{ user: LoginResponse['user'] }>('/auth/me', {
        withCredentials: true
      });

      return response.data.user;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   * Makes a lightweight API call since we can't check cookies directly
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      await api.get('/auth/check', {
        withCredentials: true
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Schedule automatic token refresh
   * Refreshes 1 minute before expiration
   */
  private scheduleTokenRefresh(expiresIn: number): void {
    this.cancelTokenRefresh();

    // Convert seconds to milliseconds, refresh 1 minute early
    const refreshTime = (expiresIn - 60) * 1000;

    this.refreshTokenTimeout = setTimeout(() => {
      this.refreshAccessToken();
    }, Math.max(0, refreshTime));
  }

  /**
   * Cancel scheduled token refresh
   */
  private cancelTokenRefresh(): void {
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = null;
    }
  }
}

export const cookieAuthService = new CookieAuthService();
