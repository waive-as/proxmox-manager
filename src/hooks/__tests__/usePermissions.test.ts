import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePermissions } from '../usePermissions';
import * as AuthContext from '@/context/AuthContext';

// Mock the AuthContext
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('usePermissions Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return admin permissions for admin user', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        username: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
      isLoading: false,
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current).toEqual({
      canManageUsers: true,
      canManageServers: true,
      canControlVMs: true,
      canViewAll: true,
      isAdmin: true,
      isManager: false,
      isReadOnly: false,
    });
  });

  it('should return user permissions for regular user', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: {
        id: '2',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user',
        username: 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
      isLoading: false,
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current).toEqual({
      canManageUsers: false,
      canManageServers: false,
      canControlVMs: true,
      canViewAll: true,
      isAdmin: false,
      isManager: true,
      isReadOnly: false,
    });
  });

  it('should return readonly permissions for readonly user', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: {
        id: '3',
        email: 'readonly@example.com',
        name: 'Readonly User',
        role: 'readonly',
        username: 'readonly',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
      isLoading: false,
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current).toEqual({
      canManageUsers: false,
      canManageServers: false,
      canControlVMs: false,
      canViewAll: false,
      isAdmin: false,
      isManager: false,
      isReadOnly: true,
    });
  });

  it('should return no permissions when user is null', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
      isLoading: false,
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current).toEqual({
      canManageUsers: false,
      canManageServers: false,
      canControlVMs: false,
      canViewAll: false,
      isAdmin: false,
      isManager: false,
      isReadOnly: false,
    });
  });

  it('should handle undefined user role gracefully', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: {
        id: '4',
        email: 'test@example.com',
        name: 'Test User',
        role: undefined as any,
        username: 'test',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
      isLoading: false,
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current).toEqual({
      canManageUsers: false,
      canManageServers: false,
      canControlVMs: false,
      canViewAll: false,
      isAdmin: false,
      isManager: false,
      isReadOnly: false,
    });
  });

  it('should update permissions when user role changes', () => {
    const mockUseAuth = vi.mocked(AuthContext.useAuth);

    // Start with regular user
    mockUseAuth.mockReturnValue({
      user: {
        id: '2',
        email: 'user@example.com',
        name: 'User',
        role: 'user',
        username: 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
      isLoading: false,
    });

    const { result, rerender } = renderHook(() => usePermissions());

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.canManageUsers).toBe(false);

    // Change to admin
    mockUseAuth.mockReturnValue({
      user: {
        id: '2',
        email: 'user@example.com',
        name: 'User',
        role: 'admin',
        username: 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      login: vi.fn(),
      logout: vi.fn(),
      signup: vi.fn(),
      isLoading: false,
    });

    rerender();

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.canManageUsers).toBe(true);
  });
});
