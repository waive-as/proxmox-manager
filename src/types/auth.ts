
export type UserRole = "admin" | "readonly" | "user";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  requirePasswordChange?: boolean;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  clearPasswordChangeRequired: () => void;
  // User management functions (admin only)
  getUsersList: () => Promise<User[]>;
  updateUserRole: (userId: string, role: UserRole) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
}
