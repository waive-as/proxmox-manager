
import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthContextType, User, UserRole } from "@/types/auth";
import { localAuthService } from "@/services/localAuthService";
import { localUserService } from "@/services/localUserService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
          const currentUser = await localAuthService.getCurrentUser();
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
      const { user } = await localAuthService.login(email, password);
      setUser(user);
      toast.success("Login successful");
      navigate('/dashboard');
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
      // Registration not supported in localStorage mode - use setup wizard
      throw new Error("Registration is not available. Please contact an administrator.");
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
      await localAuthService.logout();
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

  // User management functions (admin only)
  const getUsersList = async (): Promise<User[]> => {
    try {
      const users = await localUserService.getAllUsers();
      return users;
    } catch (error: any) {
      console.error("Failed to fetch users:", error);
      toast.error(error.message || "Failed to fetch users");
      throw error;
    }
  };

  const updateUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
    try {
      await localUserService.updateUser(userId, { role });
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
      await localUserService.deleteUser(userId);
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
        getUsersList,
        updateUserRole,
        deleteUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
