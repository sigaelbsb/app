import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rysmuasawcjorhnvpeex.supabase.co';
const supabaseKey = 'sb_publishable_AuPFgZ8tUjBSOnuPD_SavA_gA8o8Lj2';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});
