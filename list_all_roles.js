const supabaseUrl = 'https://nbsrlauuugxfcgjavfve.supabase.co';
const supabaseKey = 'sb_publishable_5fWhLgihhav9Vu-t2HdyYg_pnayrzg7';

async function main() {
  try {
    const url = `${supabaseUrl}/rest/v1/roles?select=*`;
    const response = await fetch(url, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${await response.text()}`);
    }
    const data = await response.json();
    console.log("ALL ROLES IN DB:");
    data.forEach(r => {
      console.log(`- Role Name: ${r.nombre}`);
      console.log(`  idx: ${r.idx}`);
      console.log(`  id_escuela: ${r.id_escuela}`);
      console.log(`  Permisos SB keys:`, Object.keys(r.permisos?.sb || {}));
      console.log(`  Permisos LB keys:`, Object.keys(r.permisos?.lb || {}));
      if (r.permisos?.sb?.['Roles y Privilegios']) {
        console.log(`  SB Roles y Privilegios:`, r.permisos.sb['Roles y Privilegios']);
      }
      if (r.permisos?.lb?.['Roles y Privilegios']) {
        console.log(`  LB Roles y Privilegios:`, r.permisos.lb['Roles y Privilegios']);
      }
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
  }
}

main();
