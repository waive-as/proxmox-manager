import { useAuth } from '@/context/AuthContext';

export interface Permissions {
  canManageUsers: boolean;
  canManageServers: boolean;
  canControlVMs: boolean;
  canViewAll: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isReadOnly: boolean;
}

export const usePermissions = (): Permissions => {
  const { user } = useAuth();

  return {
    canManageUsers: user?.role === 'admin',
    canManageServers: user?.role === 'admin',
    canControlVMs: ['admin', 'user'].includes(user?.role || ''),
    canViewAll: ['admin', 'user'].includes(user?.role || ''),
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'user',
    isReadOnly: user?.role === 'readonly',
  };
};
