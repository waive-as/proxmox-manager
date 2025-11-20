import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageService } from '../localStorage';

describe('LocalStorage Service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('needsSetup', () => {
    it('should return true when no users exist', () => {
      expect(storageService.needsSetup()).toBe(true);
    });

    it('should return false when users exist', () => {
      storageService.addUser({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin'
      });

      expect(storageService.needsSetup()).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should reject passwords shorter than 12 characters', () => {
      expect(storageService.validatePasswordStrength('Short1!')).toBe(false);
    });

    it('should reject passwords without uppercase', () => {
      expect(storageService.validatePasswordStrength('lowercase123!')).toBe(false);
    });

    it('should reject passwords without lowercase', () => {
      expect(storageService.validatePasswordStrength('UPPERCASE123!')).toBe(false);
    });

    it('should reject passwords without numbers', () => {
      expect(storageService.validatePasswordStrength('NoNumbers!@#')).toBe(false);
    });

    it('should reject passwords without special characters', () => {
      expect(storageService.validatePasswordStrength('NoSpecial123')).toBe(false);
    });

    it('should accept valid strong passwords', () => {
      expect(storageService.validatePasswordStrength('ValidPass123!')).toBe(true);
      expect(storageService.validatePasswordStrength('Str0ng!P@ssw0rd')).toBe(true);
      expect(storageService.validatePasswordStrength('MyP@ssw0rd2024')).toBe(true);
    });
  });

  describe('getPasswordRequirements', () => {
    it('should return password requirements string', () => {
      const requirements = storageService.getPasswordRequirements();
      expect(requirements).toContain('12 characters');
      expect(requirements).toContain('uppercase');
      expect(requirements).toContain('lowercase');
      expect(requirements).toContain('number');
      expect(requirements).toContain('special character');
    });
  });

  describe('User Management', () => {
    it('should add a user', () => {
      const user = storageService.addUser({
        username: 'john',
        email: 'john@example.com',
        name: 'John Doe',
        role: 'user'
      });

      expect(user).toHaveProperty('id');
      expect(user.email).toBe('john@example.com');
      expect(user.isActive).toBe(true);
    });

    it('should get user by email', () => {
      storageService.addUser({
        username: 'jane',
        email: 'jane@example.com',
        name: 'Jane Doe',
        role: 'admin'
      });

      const user = storageService.getUserByEmail('jane@example.com');
      expect(user).not.toBeNull();
      expect(user?.name).toBe('Jane Doe');
    });

    it('should update user', () => {
      const user = storageService.addUser({
        username: 'bob',
        email: 'bob@example.com',
        name: 'Bob Smith',
        role: 'user'
      });

      const updated = storageService.updateUser(user.id, { name: 'Robert Smith' });
      expect(updated).toBe(true);

      const updatedUser = storageService.getUserById(user.id);
      expect(updatedUser?.name).toBe('Robert Smith');
    });

    it('should delete user', () => {
      const user = storageService.addUser({
        username: 'alice',
        email: 'alice@example.com',
        name: 'Alice Johnson',
        role: 'user'
      });

      const deleted = storageService.deleteUser(user.id);
      expect(deleted).toBe(true);

      const found = storageService.getUserById(user.id);
      expect(found).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should create a session', () => {
      const user = storageService.addUser({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin'
      });

      const session = storageService.createSession(user.id);
      expect(session).toHaveProperty('token');
      expect(session).toHaveProperty('expiresAt');
      expect(session.userId).toBe(user.id);
    });

    it('should validate active session', () => {
      const user = storageService.addUser({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin'
      });

      const session = storageService.createSession(user.id);
      const validSession = storageService.getValidSession(session.token);

      expect(validSession).not.toBeNull();
      expect(validSession?.userId).toBe(user.id);
    });

    it('should invalidate session', () => {
      const user = storageService.addUser({
        username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin'
      });

      const session = storageService.createSession(user.id);
      storageService.invalidateSession(session.token);

      const validSession = storageService.getValidSession(session.token);
      expect(validSession).toBeNull();
    });
  });

  describe('initializeWithAdmin', () => {
    it('should create admin user with valid password', async () => {
      const admin = await storageService.initializeWithAdmin(
        'admin@example.com',
        'AdminPass123!',
        'Admin User'
      );

      expect(admin.email).toBe('admin@example.com');
      expect(admin.role).toBe('admin');
      expect(admin.name).toBe('Admin User');
    });

    it('should reject weak passwords', async () => {
      await expect(
        storageService.initializeWithAdmin(
          'admin@example.com',
          'weak',
          'Admin User'
        )
      ).rejects.toThrow('Password does not meet security requirements');
    });

    it('should reject initialization when users already exist', async () => {
      await storageService.initializeWithAdmin(
        'admin@example.com',
        'AdminPass123!',
        'Admin User'
      );

      await expect(
        storageService.initializeWithAdmin(
          'another@example.com',
          'AnotherPass123!',
          'Another Admin'
        )
      ).rejects.toThrow('System already initialized');
    });
  });
});
