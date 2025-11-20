import { supabase as supabaseClient } from "@/integrations/supabase/client";

// Re-export the supabase client
export const supabase = supabaseClient;

export const testSupabaseConnection = async () => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "URL not available";
    console.log("Testing Supabase connection with URL:", supabaseUrl);
    
    // Just check if we can query anything
    const { data, error } = await supabase.from('users_management').select('count').limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return {
        success: false,
        message: `Connection error: ${error.message}`,
      };
    }
    
    console.log("Connection successful, response:", data);
    return {
      success: true,
      message: 'Successfully connected to Supabase',
    };
  } catch (err) {
    console.error('Unexpected error testing Supabase connection:', err);
    return {
      success: false,
      message: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
};

// Function to add a specific test user
export const addTestUser = async () => {
  try {
    console.log('Adding test user: peter@waive.no');
    
    // First check if user already exists
    const { data: existingUser } = await supabase
      .from('users_management')
      .select('id, email')
      .eq('email', 'peter@waive.no')
      .maybeSingle();
    
    if (existingUser) {
      console.log('Test user already exists:', existingUser);
      return {
        success: true,
        message: 'Test user already exists',
        userId: existingUser.id,
      };
    }
    
    // Create auth user with auto-confirmed email
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'peter@waive.no',
      password: 'Password123456',
      email_confirm: true
    });
    
    if (authError) {
      console.error('Error creating test auth user:', authError);
      return {
        success: false,
        message: `Auth error: ${authError.message}`,
      };
    }
    
    if (!authData?.user?.id) {
      console.error('No user ID returned from auth signup');
      return {
        success: false,
        message: 'No user ID returned',
      };
    }
    
    console.log('Created test auth user with ID:', authData.user.id);
    
    // Manually insert user into users_management table
    const { error: insertError } = await supabase
      .from('users_management')
      .insert({
        id: authData.user.id,
        username: 'peter',
        email: 'peter@waive.no',
        name: 'Peter Test',
        role: 'admin'
      });
    
    if (insertError) {
      console.error('Error adding user to management table:', insertError);
      return {
        success: false,
        message: `Database error: ${insertError.message}`,
      };
    }
    
    return {
      success: true,
      message: 'Test user created successfully',
      userId: authData.user.id,
    };
  } catch (err) {
    console.error('Unexpected error creating test user:', err);
    return {
      success: false,
      message: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
};

export const initializeSupabaseTables = async () => {
  try {
    console.log('Initializing Supabase tables...');
    
    // Check if the users_management table is accessible
    const { error: tableCheckError } = await supabase
      .from('users_management')
      .select('id')
      .limit(1);
    
    if (tableCheckError) {
      console.error('Error accessing users_management table:', tableCheckError);
      return false;
    }
    
    // First check if admin user exists in the users_management table
    const { data: adminCheck, error: adminCheckError } = await supabase
      .from('users_management')
      .select('id, email')
      .eq('username', 'admin')
      .maybeSingle();
    
    console.log('Admin check result:', adminCheck, adminCheckError);
    
    if (!adminCheck) {
      console.log('Admin user not found. Creating default admin user...');
      
      // Create admin user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'admin@example.com',
        password: 'admin123456',
      });
      
      if (authError) {
        console.error('Error creating admin auth user:', authError);
        return false;
      }
      
      if (!authData?.user?.id) {
        console.error('No user ID returned from auth signup');
        return false;
      }
      
      console.log('Created auth user with ID:', authData.user.id);
      
      // Let the database trigger handle the insert
      
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists:', adminCheck);
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing Supabase tables:', error);
    return false;
  }
};

// Simplified function to confirm user email
export const confirmUserEmail = async (email: string) => {
  try {
    const { data: user } = await supabase
      .from('users_management')
      .select('id')
      .eq('email', email)
      .single();
    
    if (!user) {
      return {
        success: false,
        message: 'User not found',
      };
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );
    
    if (updateError) {
      return {
        success: false,
        message: `Error confirming email: ${updateError.message}`,
      };
    }
    
    return {
      success: true,
      message: `Email confirmed for ${email}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};
