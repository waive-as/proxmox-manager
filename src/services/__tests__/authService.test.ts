import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { authService } from '../authService';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

describe('AuthService', () => {
  let localStorageMock: Record<string, string> = {};

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key) => localStorageMock[key] || null),
      setItem: vi.fn((key, value) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      server.use(
        http.post('http://localhost:3002/api/auth/login', () => {
          return HttpResponse.json({
            success: true,
            message: 'Login successful',
            data: {
              token: 'test-token-123',
              user: {
                id: '1',
                email: 'test@example.com',
                name: 'Test User',
                role: 'user'
              }
            }
          });
        })
      );

      const result = await authService.login('test@example.com', 'TestPass123!');

      expect(result.token).toBe('test-token-123');
      expect(result.user.email).toBe('test@example.com');
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'test-token-123');
    });

    it('should throw error with invalid credentials', async () => {
      server.use(
        http.post('http://localhost:3002/api/auth/login', () => {
          return HttpResponse.json(
            {
              success: false,
              message: 'Invalid credentials'
            },
            { status: 401 }
          );
        })
      );

      await expect(
        authService.login('wrong@example.com', 'wrong')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error with malformed request', async () => {
      server.use(
        http.post('http://localhost:3002/api/auth/login', () => {
          return HttpResponse.json(
            {
              success: false,
              message: 'Bad request'
            },
            { status: 400 }
          );
        })
      );

      await expect(
        authService.login('', '')
      ).rejects.toThrow('Please check your email and password format');
    });

    it('should handle network errors', async () => {
      server.use(
        http.post('http://localhost:3002/api/auth/login', () => {
          return HttpResponse.error();
        })
      );

      await expect(
        authService.login('test@example.com', 'password')
      ).rejects.toThrow();
    });

    it('should handle custom error messages from server', async () => {
      server.use(
        http.post('http://localhost:3002/api/auth/login', () => {
          return HttpResponse.json(
            {
              success: false,
              message: 'Account is locked'
            },
            { status: 403 }
          );
        })
      );

      await expect(
        authService.login('test@example.com', 'password')
      ).rejects.toThrow('Account is locked');
    });
  });

  describe('register', () => {
    it('should register successfully and auto-login', async () => {
      server.use(
        http.post('http://localhost:3002/api/auth/register', () => {
          return HttpResponse.json({
            success: true,
            message: 'Registration successful',
            data: {
              user: {
                id: '2',
                email: 'newuser@example.com',
                name: 'New User',
                role: 'user'
              }
            }
          });
        }),
        http.post('http://localhost:3002/api/auth/login', () => {
          return HttpResponse.json({
            success: true,
            message: 'Login successful',
            data: {
              token: 'new-token-456',
              user: {
                id: '2',
                email: 'newuser@example.com',
                name: 'New User',
                role: 'user'
              }
            }
          });
        })
      );

      const result = await authService.register(
        'newuser@example.com',
        'NewUserPass123!',
        'New User'
      );

      expect(result.user.email).toBe('newuser@example.com');
      expect(result.token).toBe('new-token-456');
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'new-token-456');
    });

    it('should throw error when email already exists', async () => {
      server.use(
        http.post('http://localhost:3002/api/auth/register', () => {
          return HttpResponse.json(
            {
              success: false,
              message: 'User already exists'
            },
            { status: 409 }
          );
        })
      );

      await expect(
        authService.register('existing@example.com', 'password', 'User')
      ).rejects.toThrow('Email already exists');
    });

    it('should throw error with invalid data format', async () => {
      server.use(
        http.post('http://localhost:3002/api/auth/register', () => {
          return HttpResponse.json(
            {
              success: false,
              message: 'Invalid email format'
            },
            { status: 400 }
          );
        })
      );

      await expect(
        authService.register('invalid-email', 'password', 'User')
      ).rejects.toThrow('Invalid email format');
    });
  });

  describe('logout', () => {
    it('should logout successfully and clear token', async () => {
      localStorageMock['auth_token'] = 'test-token';

      server.use(
        http.post('http://localhost:3002/api/auth/logout', () => {
          return HttpResponse.json({
            success: true,
            message: 'Logged out'
          });
        })
      );

      await authService.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorageMock['auth_token']).toBeUndefined();
    });

    it('should clear token even if server request fails', async () => {
      localStorageMock['auth_token'] = 'test-token';

      server.use(
        http.post('http://localhost:3002/api/auth/logout', () => {
          return HttpResponse.error();
        })
      );

      await authService.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      server.use(
        http.get('http://localhost:3002/api/users/profile', () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: '1',
              email: 'test@example.com',
              name: 'Test User',
              role: 'user'
            }
          });
        })
      );

      const user = await authService.getCurrentUser();

      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
    });

    it('should throw error and clear token on 401', async () => {
      localStorageMock['auth_token'] = 'invalid-token';

      server.use(
        http.get('http://localhost:3002/api/users/profile', () => {
          return HttpResponse.json(
            {
              success: false,
              message: 'Unauthorized'
            },
            { status: 401 }
          );
        })
      );

      await expect(authService.getCurrentUser()).rejects.toThrow('Session expired');
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should handle invalid user data', async () => {
      server.use(
        http.get('http://localhost:3002/api/users/profile', () => {
          return HttpResponse.json({
            success: false,
            data: null
          });
        })
      );

      await expect(authService.getCurrentUser()).rejects.toThrow('Invalid user data');
    });

    it('should remove username field from user data', async () => {
      server.use(
        http.get('http://localhost:3002/api/users/profile', () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: '1',
              email: 'test@example.com',
              name: 'Test User',
              role: 'user',
              username: 'testuser' // This should be removed
            }
          });
        })
      );

      const user = await authService.getCurrentUser();

      expect(user).not.toHaveProperty('username');
      expect(user.email).toBe('test@example.com');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorageMock['auth_token'] = 'test-token';

      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when no token exists', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token when it exists', () => {
      localStorageMock['auth_token'] = 'test-token-123';

      expect(authService.getToken()).toBe('test-token-123');
    });

    it('should return null when no token exists', () => {
      expect(authService.getToken()).toBe(null);
    });
  });
});
