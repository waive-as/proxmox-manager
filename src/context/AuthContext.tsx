
import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthContextType, User, UserRole } from "@/types/auth";
import { authService } from "@/services/authService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        localStorage.removeItem('auth_token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      const { user } = await authService.login(email, password);
      setUser(user);
      toast.success("Login successful");

      // Check if user needs to change password
      if (user.requirePasswordChange) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = error.message || "Login failed";
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setError(null);
      const { user } = await authService.register(email, password, name);
      setUser(user);
      toast.success("Registration successful");
      navigate('/dashboard');
      return true;
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage = error.message || "Registration failed";
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setUser(null);
      setError(null);
      toast.info("You have been logged out");
      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  const clearError = () => {
    setError(null);
  };

  const clearPasswordChangeRequired = () => {
    if (user) {
      setUser({ ...user, requirePasswordChange: false });
    }
  };

  // User management functions (admin only)
  const getUsersList = async (): Promise<User[]> => {
    try {
      const response = await api.get('/users');
      return response.data.data || [];
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      toast.error(error.message || "Failed to fetch users");
      throw error;
    }
  };

  const updateUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
    try {
      await api.put(`/users/${userId}`, { role });
      toast.success("User role updated successfully");
      return true;
    } catch (error: any) {
      console.error("Failed to update user role:", error);
      toast.error(error.message || "Failed to update user role");
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      await api.delete(`/users/${userId}`);
      toast.success("User deleted successfully");
      return true;
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      toast.error(error.message || "Failed to delete user");
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
        clearPasswordChangeRequired,
        getUsersList,
        updateUserRole,
        deleteUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
