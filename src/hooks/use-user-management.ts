
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole } from '@/types/auth';
import { toast } from 'sonner';

export const useUserManagement = () => {
  const getUsersList = async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users_management')
      .select('*');
    
    if (error) {
      console.error("Failed to get users:", error);
      return [];
    }
    
    return data as User[];
  };

  const addUser = async (userData: { 
    username: string; 
    email: string; 
    password: string; 
    name: string; 
    role: UserRole 
  }): Promise<boolean> => {
    try {
      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('users_management')
        .select('id')
        .eq('username', userData.username)
        .single();
      
      if (existingUser) {
        toast.error("Username already exists");
        return false;
      }

      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });
      
      if (authError) {
        toast.error(`Failed to add user: ${authError.message}`);
        return false;
      }
      
      // Add user to users_management table
      const { error: insertError } = await supabase.from('users_management').insert({
        id: authUser?.user?.id,
        username: userData.username,
        email: userData.email,
        name: userData.name,
        role: userData.role
      });
      
      if (insertError) {
        toast.error(`Failed to add user metadata: ${insertError.message}`);
        return false;
      }
      
      toast.success(`User ${userData.username} added successfully`);
      return true;
    } catch (error) {
      console.error("Failed to add user:", error);
      toast.error("Failed to add user");
      return false;
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('users_management')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) {
        toast.error(`Failed to update role: ${error.message}`);
        return false;
      }
      
      toast.success("User role updated successfully");
      return true;
    } catch (error) {
      console.error("Failed to update user role:", error);
      toast.error("Failed to update user role");
      return false;
    }
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      // First check if this would leave us without any admins
      const { data: users } = await supabase
        .from('users_management')
        .select('*')
        .eq('role', 'admin');
      
      const admins = users || [];
      if (admins.length <= 1 && admins.some(admin => admin.id === userId)) {
        toast.error("Cannot delete the last administrator");
        return false;
      }
      
      const { error } = await supabase
        .from('users_management')
        .delete()
        .eq('id', userId);
      
      if (error) {
        toast.error(`Failed to delete user: ${error.message}`);
        return false;
      }
      
      toast.success("User deleted successfully");
      return true;
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user");
      return false;
    }
  };

  return {
    getUsersList,
    addUser,
    updateUserRole,
    deleteUser,
  };
};
