
import { toast } from 'sonner';

// This hook is kept for compatibility but the functionality is now handled by Clerk
export const useAuthOperations = () => {
  const login = async (): Promise<boolean> => {
    console.log("Login functionality is now handled by Clerk components");
    return true;
  };

  const logout = async () => {
    console.log("Logout functionality is now handled by Clerk components");
    toast.info("You have been logged out");
  };

  return {
    login,
    logout,
  };
};
