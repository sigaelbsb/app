import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nbsrlauuugxfcgjavfve.supabase.co';
const supabaseKey = 'sb_publishable_5fWhLgihhav9Vu-t2HdyYg_pnayrzg7';

export const supabase = createClient(supabaseUrl, supabaseKey);
