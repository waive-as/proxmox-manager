import { storageService } from '../lib/localStorage';

/**
 * LocalAuth Service - Authentication using localStorage only
 * Use this when backend is not available
 */
class LocalAuthService {
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'proxmox-salt-2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async login(email: string, password: string) {
    // Get user from localStorage
    const user = storageService.getUserByEmail(email);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is disabled');
    }

    // Get stored password hash
    const storedHash = localStorage.getItem(`user_password_${user.id}`);

    if (!storedHash) {
      throw new Error('Invalid email or password');
    }

    // Hash the provided password and compare
    const passwordHash = await this.hashPassword(password);

    if (passwordHash !== storedHash) {
      throw new Error('Invalid email or password');
    }

    // Create session
    const session = storageService.createSession(user.id);

    // Store token
    localStorage.setItem('auth_token', session.token);

    // Update last login
    storageService.updateUser(user.id, {
      lastLogin: new Date().toISOString()
    });

    return {
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };
  }

  async getCurrentUser() {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      throw new Error('Not authenticated');
    }

    // Validate session
    const session = storageService.getValidSession(token);

    if (!session) {
      localStorage.removeItem('auth_token');
      throw new Error('Session expired');
    }

    // Get user
    const user = storageService.getUserById(session.userId);

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
  }

  async logout() {
    const token = localStorage.getItem('auth_token');

    if (token) {
      storageService.invalidateSession(token);
    }

    localStorage.removeItem('auth_token');
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;

    const session = storageService.getValidSession(token);
    return !!session;
  }
}

export const localAuthService = new LocalAuthService();
