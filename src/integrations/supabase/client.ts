
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://jualbnxhksxzadmienns.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1YWxibnhoa3N4emFkbWllbm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTM3MjIsImV4cCI6MjA2MDY2OTcyMn0.PgMnEt-PQCjWfBzyU2Y8ny4foZ74r0sYCl3AaQtAuWs";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
