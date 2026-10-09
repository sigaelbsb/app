/**
 * scripts/importar_datos_nuevo.cjs
 * Script para transferir todos los datos respaldados hacia el nuevo proyecto de Supabase.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. CONFIGURACIÓN DEL NUEVO PROYECTO SUPABASE
// Coloca aquí la URL y la Key (anon pública o service_role) de tu NUEVO proyecto
const NUEVO_SUPABASE_URL = process.env.NUEVO_SUPABASE_URL || 'AQUI_TU_NUEVO_SUPABASE_URL';
const NUEVO_SUPABASE_KEY = process.env.NUEVO_SUPABASE_KEY || 'AQUI_TU_NUEVA_KEY';

// 2. RUTA DEL ARCHIVO DE RESPALDO JSON
const ARCHIVO_DATOS = path.join(__dirname, 'datos_respaldo.json');

async function migrarDatos() {
  console.log('====================================================');
  console.log('       INICIANDO MIGRACIÓN DE DATOS A NUEVO SUPABASE');
  console.log('====================================================\n');

  if (NUEVO_SUPABASE_URL.includes('AQUI_TU_NUEVO') || NUEVO_SUPABASE_KEY.includes('AQUI_TU_NUEVA')) {
    console.error('❌ ERROR: Debes ingresar la URL y KEY de tu nuevo proyecto Supabase.');
    console.error('Edita las variables NUEVO_SUPABASE_URL y NUEVO_SUPABASE_KEY al inicio de este script o pásalas por variable de entorno.');
    process.exit(1);
  }

  if (!fs.existsSync(ARCHIVO_DATOS)) {
    console.error(`❌ ERROR: No se encontró el archivo de datos: ${ARCHIVO_DATOS}`);
    console.error('Copia el resultado del Paso 1 en este archivo (scripts/datos_respaldo.json) para continuar.');
    process.exit(1);
  }

  const rawData = fs.readFileSync(ARCHIVO_DATOS, 'utf8');
  let backup;
  try {
    backup = JSON.parse(rawData);
    // Si viene dentro de { backup_completo_sigae: { ... } }
    if (backup.backup_completo_sigae) {
      backup = backup.backup_completo_sigae;
    }
  } catch (err) {
    console.error('❌ Error al parsear JSON de datos_respaldo.json:', err.message);
    process.exit(1);
  }

  const supabase = createClient(NUEVO_SUPABASE_URL, NUEVO_SUPABASE_KEY, {
    auth: { persistSession: false }
  });

  // Orden estricto de inserción para respetar claves foráneas (Foreign Keys)
  const tablasOrdenadas = [
    'perfil_escuela',
    'roles',
    'conf_periodos',
    'conf_lapsos',
    'conf_niveles',
    'conf_grados',
    'conf_secciones',
    'conf_preguntas_seguridad',
    'espacios',
    'diccionarios_empresa',
    'div_pol_vzla',
    'catalogo_formaciones',
    'sigma_conocimiento',
    'sigma_preguntas_pendientes',
    'cargos',
    'ajustes_globales',
    'notificaciones',
    'historial_auditoria',
    'invitados',
    'usuarios',
    'solicitud_cupos',
    'estudiantes_vinculaciones',
    'salones',
    'colectivos',
    'expedientes_docentes',
    'transporte_rutas',
    'transporte_paradas',
    'transporte_operaciones',
    'transporte_asignaciones',
    'notificaciones_globales',
    'encuestas',
    'encuestas_respuestas',
    'certificados_modelos',
    'certificados_emitidos'
  ];

  let totalInsertados = 0;
  let errores = 0;

  for (const tabla of tablasOrdenadas) {
    const filas = backup[tabla];
    if (!filas || !Array.isArray(filas) || filas.length === 0) {
      console.log(`⏩ [${tabla}]: 0 registros (omitida)`);
      continue;
    }

    console.log(`\n⏳ Migrando tabla [${tabla}] (${filas.length} registros)...`);

    // Insertar en lotes de 100 para no sobrecargar la red
    const BATCH_SIZE = 100;
    let tablaExitosa = 0;

    for (let i = 0; i < filas.length; i += BATCH_SIZE) {
      const lote = filas.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from(tabla).upsert(lote, { ignoreDuplicates: true });

      if (error) {
        console.warn(`   ⚠️ Advertencia en lote [${i + 1}-${i + lote.length}]: ${error.message}`);
        errores++;
      } else {
        tablaExitosa += lote.length;
      }
    }

    console.log(`   ✅ [${tabla}]: ${tablaExitosa}/${filas.length} registros insertados.`);
    totalInsertados += tablaExitosa;
  }

  console.log('\n====================================================');
  console.log(`🎉 MIGRACIÓN COMPLETADA CON ÉXITO`);
  console.log(`Total registros insertados: ${totalInsertados}`);
  if (errores > 0) {
    console.log(`Advertencias encontradas: ${errores} (revisar logs arriba)`);
  }
  console.log('====================================================');
}

migrarDatos().catch(err => {
  console.error('Error fatal durante la migración:', err);
});
