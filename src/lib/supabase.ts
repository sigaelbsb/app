import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phyhwvlbvcdacjjvdymn.supabase.co';
const supabaseKey = 'sb_publishable_Y4IrPFScLweYgFOhOoLLUQ_wQO7q4nj';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});
