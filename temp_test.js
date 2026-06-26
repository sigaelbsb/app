import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nbsrlauuugxfcgjavfve.supabase.co';
const supabaseKey = 'sb_publishable_5fWhLgihhav9Vu-t2HdyYg_pnayrzg7';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=== DIAGNOSTICANDO LÍMITES EN EXPEDIENTES_DOCENTES ===");
  
  const testPayload = (field, val) => {
    return {
      usuario_cedula: '15631248',
      sexo: 'Femenino',
      fecha_nacimiento: '1985-05-10',
      estado_civil: 'Casado/a',
      direccion: ', , . ',
      titulo_obtenido: 'Profesor',
      nivel_instruccion: 'Licenciatura',
      universidad: 'Universidad',
      anio_egreso: 2026,
      fecha_ingreso: '2006-09-15',
      tipo_nomina: 'Fijo',
      carga_horaria: 36,
      estatus_laboral: 'Activo',
      [field]: val
    };
  };

  const fieldsToTest = [
    { name: 'sexo', maxLen: 10 },
    { name: 'estado_civil', maxLen: 20 },
    { name: 'tipo_nomina', maxLen: 50 },
    { name: 'estatus_laboral', maxLen: 50 }
  ];

  for (let field of fieldsToTest) {
    const val = "A".repeat(field.maxLen + 5);
    const payload = testPayload(field.name, val);
    const { error } = await supabase
      .from('expedientes_docentes')
      .upsert(payload, { onConflict: 'usuario_cedula' });
      
    if (error) {
      console.log(`Campo ${field.name} longitud ${field.maxLen + 5}: FALLÓ con error: ${error.message} (código: ${error.code})`);
    } else {
      console.log(`Campo ${field.name} longitud ${field.maxLen + 5}: OK`);
    }
  }
}

run();
