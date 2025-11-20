import { storageService, User, Session } from './localStorage';
import { PasswordUtils } from './passwordUtils';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  name: string;
  role?: 'admin' | 'readonly' | 'user';
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

class AuthService {
  private currentSession: Session | null = null;
  private currentUser: User | null = null;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    // Initialize default data
    await storageService.initializeDefaultData();
    
    // Check for existing session
    const currentUser = storageService.getCurrentUser();
    if (currentUser) {
      this.currentUser = currentUser;
    }
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { email, password } = credentials;
      
      // Find user by email
      const user = storageService.getUserByEmail(email);
      if (!user) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          message: 'Account is deactivated'
        };
      }

      // Verify password
      const isValidPassword = await PasswordUtils.verifyPassword(password, user.id); // Using user.id as password hash for demo
      
      // For demo purposes, we'll store password hash in a separate way
      // In a real app, you'd store the hash separately
      const storedPasswordHash = localStorage.getItem(`user_password_${user.id}`);
      if (!storedPasswordHash) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      const isValidPasswordReal = await PasswordUtils.verifyPassword(password, storedPasswordHash);
      
      if (!isValidPasswordReal) {
        return {
          success: false,
          message: 'Invalid email or password'
        };
      }

      // Create session
      const session = storageService.createSession(user.id);
      
      // Update last login
      storageService.updateUser(user.id, { lastLogin: new Date().toISOString() });
      
      // Set current user
      this.currentUser = user;
      this.currentSession = session;
      storageService.setCurrentUser(user);

      return {
        success: true,
        message: 'Login successful',
        user,
        token: session.token
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'An unexpected error occurred'
      };
    }
  }

  // Register new user
  async register(data: RegisterData): Promise<AuthResult> {
    try {
      const { username, email, password, name, role = 'user' } = data;

      // Validate password strength
      const passwordValidation = PasswordUtils.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: `Password validation failed: ${passwordValidation.errors.join(', ')}`
        };
      }

      // Check if user already exists
      if (storageService.getUserByEmail(email)) {
        return {
          success: false,
          message: 'User with this email already exists'
        };
      }

      if (storageService.getUserByUsername(username)) {
        return {
          success: false,
          message: 'Username already taken'
        };
      }

      // Hash password
      const passwordHash = await PasswordUtils.hashPassword(password);

      // Create user
      const user = storageService.addUser({
        username,
        email,
        name,
        role
      });

      // Store password hash separately
      localStorage.setItem(`user_password_${user.id}`, passwordHash);

      // Create session
      const session = storageService.createSession(user.id);
      
      // Set current user
      this.currentUser = user;
      this.currentSession = session;
      storageService.setCurrentUser(user);

      return {
        success: true,
        message: 'Registration successful',
        user,
        token: session.token
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'An unexpected error occurred'
      };
    }
  }

  // Logout user
  async logout(): Promise<void> {
    if (this.currentSession) {
      storageService.invalidateSession(this.currentSession.token);
    }
    
    this.currentUser = null;
    this.currentSession = null;
    storageService.setCurrentUser(null);
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.currentSession !== null;
  }

  // Validate session
  async validateSession(): Promise<boolean> {
    if (!this.currentSession) return false;

    const validSession = storageService.getValidSession(this.currentSession.token);
    if (!validSession) {
      await this.logout();
      return false;
    }

    // Update current session
    this.currentSession = validSession;
    
    // Refresh user data
    const user = storageService.getUserById(validSession.userId);
    if (user && user.isActive) {
      this.currentUser = user;
      storageService.setCurrentUser(user);
      return true;
    }

    await this.logout();
    return false;
  }

  // Get all users (admin only)
  async getUsers(): Promise<User[]> {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }
    
    return storageService.getUsers();
  }

  // Add user (admin only)
  async addUser(userData: Omit<RegisterData, 'role'> & { role: 'admin' | 'readonly' | 'user' }): Promise<AuthResult> {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      console.warn('Unauthorized attempt to add user by:', this.currentUser?.email || 'unknown');
      return {
        success: false,
        message: 'Unauthorized: Admin access required'
      };
    }

    console.log('Admin user adding new user:', { admin: this.currentUser.email, newUser: userData.email });
    return this.register(userData);
  }

  // Update user role (admin only)
  async updateUserRole(userId: string, newRole: 'admin' | 'readonly' | 'user'): Promise<AuthResult> {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      console.warn('Unauthorized attempt to update user role by:', this.currentUser?.email || 'unknown');
      return {
        success: false,
        message: 'Unauthorized: Admin access required'
      };
    }

    console.log('Admin user updating role:', { admin: this.currentUser.email, userId, newRole });

    const success = storageService.updateUser(userId, { role: newRole });
    
    if (success) {
      return {
        success: true,
        message: 'User role updated successfully'
      };
    } else {
      return {
        success: false,
        message: 'User not found'
      };
    }
  }

  // Delete user (admin only)
  async deleteUser(userId: string): Promise<AuthResult> {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      console.warn('Unauthorized attempt to delete user by:', this.currentUser?.email || 'unknown');
      return {
        success: false,
        message: 'Unauthorized: Admin access required'
      };
    }

    // Prevent admin from deleting themselves
    if (userId === this.currentUser.id) {
      console.warn('Admin attempted to delete themselves:', this.currentUser.email);
      return {
        success: false,
        message: 'Cannot delete your own account'
      };
    }

    console.log('Admin user deleting user:', { admin: this.currentUser.email, targetUserId: userId });

    const success = storageService.deleteUser(userId);
    
    if (success) {
      // Also remove password hash
      localStorage.removeItem(`user_password_${userId}`);
      
      return {
        success: true,
        message: 'User deleted successfully'
      };
    } else {
      return {
        success: false,
        message: 'User not found'
      };
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResult> {
    if (!this.currentUser) {
      return {
        success: false,
        message: 'Not authenticated'
      };
    }

    try {
      // Verify current password
      const storedPasswordHash = localStorage.getItem(`user_password_${this.currentUser.id}`);
      if (!storedPasswordHash) {
        return {
          success: false,
          message: 'Current password verification failed'
        };
      }

      const isValidCurrentPassword = await PasswordUtils.verifyPassword(currentPassword, storedPasswordHash);
      if (!isValidCurrentPassword) {
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }

      // Validate new password
      const passwordValidation = PasswordUtils.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: `New password validation failed: ${passwordValidation.errors.join(', ')}`
        };
      }

      // Hash new password
      const newPasswordHash = await PasswordUtils.hashPassword(newPassword);
      
      // Update stored password hash
      localStorage.setItem(`user_password_${this.currentUser.id}`, newPasswordHash);

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'An unexpected error occurred'
      };
    }
  }

  // Reset password (admin only)
  async resetUserPassword(userId: string, newPassword: string): Promise<AuthResult> {
    if (!this.currentUser || this.currentUser.role !== 'admin') {
      console.warn('Unauthorized attempt to reset password by:', this.currentUser?.email || 'unknown');
      return {
        success: false,
        message: 'Unauthorized: Admin access required'
      };
    }

    console.log('Admin user resetting password:', { admin: this.currentUser.email, targetUserId: userId });

    try {
      const user = storageService.getUserById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Validate password
      const passwordValidation = PasswordUtils.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          message: `Password validation failed: ${passwordValidation.errors.join(', ')}`
        };
      }

      // Hash new password
      const passwordHash = await PasswordUtils.hashPassword(newPassword);
      
      // Update stored password hash
      localStorage.setItem(`user_password_${userId}`, passwordHash);

      return {
        success: true,
        message: 'Password reset successfully'
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: 'An unexpected error occurred'
      };
    }
  }
}

export const authService = new AuthService();
