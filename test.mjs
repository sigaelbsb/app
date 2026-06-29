import { createClient } from '@supabase/supabase-js';

const url = 'https://nbsrlauuugxfcgjavfve.supabase.co';
const key = 'sb_publishable_5fWhLgihhav9Vu-t2HdyYg_pnayrzg7';

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('roles').select('nombre');
  console.log('Error:', error);
  console.log('Roles:', data);
}
run();
