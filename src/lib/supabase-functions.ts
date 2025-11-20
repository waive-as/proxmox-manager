
import { supabase } from '@/integrations/supabase/client';

// This function checks if the users_management table exists
export const checkUsersManagementTable = async () => {
  try {
    const { data, error } = await supabase
      .from('users_management')
      .select('count(*)')
      .limit(1);
    
    if (error && error.message.includes('does not exist')) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking users_management table:', error);
    return false;
  }
};

// Create the users_management table in public schema
export const createUsersManagementTable = async () => {
  try {
    // We can't directly create tables from the client side
    // This would need to be done through SQL migrations or a server-side function
    console.log('Table creation requires server-side implementation');
    
    // For demonstration purposes only - normally this would involve server-side code
    // or SQL migrations that would create the table with the proper structure
    console.error('Table creation requires server-side implementation');
    return false;
  } catch (error) {
    console.error('Error in createUsersManagementTable:', error);
    throw error;
  }
};

// Create default users in the Supabase auth system
export const createDefaultUsers = async () => {
  try {
    // Check if admin exists
    const { data: adminCheck } = await supabase
      .from('users_management')
      .select('id')
      .eq('username', 'admin')
      .maybeSingle();
    
    if (!adminCheck) {
      // Create admin user
      const { data: admin, error: adminError } = await supabase.auth.signUp({
        email: 'admin@example.com',
        password: 'admin123456',
      });
      
      if (adminError) {
        console.error('Error creating admin user:', adminError);
        return false;
      }
      
      if (admin?.user) {
        await supabase.from('users_management').insert({
          id: admin.user.id,
          username: 'admin',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin'
        });
      }
      
      // Create power user
      const { data: power, error: powerError } = await supabase.auth.signUp({
        email: 'power@example.com',
        password: 'power123456',
      });
      
      if (!powerError && power?.user) {
        await supabase.from('users_management').insert({
          id: power.user.id,
          username: 'power',
          email: 'power@example.com',
          name: 'Power User',
          role: 'power'
        });
      }
      
      // Create readonly user
      const { data: readonly, error: readonlyError } = await supabase.auth.signUp({
        email: 'readonly@example.com',
        password: 'readonly123456',
      });
      
      if (!readonlyError && readonly?.user) {
        await supabase.from('users_management').insert({
          id: readonly.user.id,
          username: 'readonly',
          email: 'readonly@example.com',
          name: 'Read Only User',
          role: 'readonly'
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error creating default users:', error);
    return false;
  }
};

// Initialize Supabase tables and data
export const initializeSupabaseTables = async () => {
  try {
    // Check if users_management table exists
    const tableExists = await checkUsersManagementTable();
    
    // If not, log a message but don't try to create it directly
    // as we need server-side capabilities for that
    if (!tableExists) {
      console.log('The users_management table does not exist. Please ensure it is created properly.');
    }
    
    // Create default users if needed
    await createDefaultUsers();
    
    return true;
  } catch (error) {
    console.error('Error initializing Supabase tables:', error);
    return false;
  }
};
