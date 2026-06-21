import fs from 'fs';
import path from 'path';

// Quoted CSV parser
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

function cleanJsonQuotes(str) {
  if (!str) return null;
  // Replace double double-quotes with single double-quotes
  try {
    return JSON.parse(str);
  } catch (e) {
    try {
      // Try resolving doubled double quotes
      let fixed = str;
      if (fixed.startsWith('"') && fixed.endsWith('"')) {
        fixed = fixed.slice(1, -1);
      }
      fixed = fixed.replace(/""/g, '"');
      return JSON.parse(fixed);
    } catch (err) {
      console.warn("Could not parse JSON:", str.substring(0, 100));
      return null;
    }
  }
}

function run() {
  const csvPath = './expedientes_docentes_libertador.csv';
  if (!fs.existsSync(csvPath)) {
    console.error("CSV file not found:", csvPath);
    return;
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split(/\r?\n/);
  
  const headers = parseCSVLine(lines[0]);
  console.log("Headers:", headers);

  let sqlOutput = `-- ========================================================\n`;
  sqlOutput += `-- MIGRACIÓN DE EXPEDIENTES Y USUARIOS: LIBERTADOR BOLÍVAR\n`;
  sqlOutput += `-- Generado automáticamente: ${new Date().toISOString()}\n`;
  sqlOutput += `-- ========================================================\n\n`;

  sqlOutput += `-- 1. Crear tabla si no existe\n`;
  sqlOutput += `CREATE TABLE IF NOT EXISTS public.expedientes_docentes (\n`;
  sqlOutput += `    usuario_cedula VARCHAR(20) PRIMARY KEY REFERENCES public.usuarios(cedula) ON DELETE CASCADE,\n`;
  sqlOutput += `    sexo VARCHAR(10) NOT NULL,\n`;
  sqlOutput += `    fecha_nacimiento DATE NOT NULL,\n`;
  sqlOutput += `    estado_civil VARCHAR(20) NOT NULL,\n`;
  sqlOutput += `    direccion TEXT NOT NULL,\n`;
  sqlOutput += `    titulo_obtenido VARCHAR(150) NOT NULL,\n`;
  sqlOutput += `    nivel_instruccion VARCHAR(100) NOT NULL,\n`;
  sqlOutput += `    universidad VARCHAR(150) NOT NULL,\n`;
  sqlOutput += `    anio_egreso INT NOT NULL,\n`;
  sqlOutput += `    fecha_ingreso DATE NOT NULL,\n`;
  sqlOutput += `    tipo_nomina VARCHAR(50) NOT NULL,\n`;
  sqlOutput += `    carga_horaria INT NOT NULL,\n`;
  sqlOutput += `    estatus_laboral VARCHAR(50) NOT NULL,\n`;
  sqlOutput += `    documentos JSONB NOT NULL DEFAULT '{"cedula": false, "titulo": false, "cv": false, "constancia": false}'::jsonb,\n`;
  sqlOutput += `    creado_en TIMESTAMPTZ DEFAULT NOW(),\n`;
  sqlOutput += `    actualizado_en TIMESTAMPTZ DEFAULT NOW()\n`;
  sqlOutput += `);\n\n`;

  sqlOutput += `-- 2. Habilitar RLS\n`;
  sqlOutput += `ALTER TABLE public.expedientes_docentes ENABLE ROW LEVEL SECURITY;\n\n`;

  sqlOutput += `-- 3. Limpiar políticas previas\n`;
  sqlOutput += `DROP POLICY IF EXISTS "Permitir lectura individual de su expediente" ON public.expedientes_docentes;\n`;
  sqlOutput += `DROP POLICY IF EXISTS "Permitir modificacion de su propio expediente" ON public.expedientes_docentes;\n\n`;

  sqlOutput += `-- 4. Crear nuevas políticas\n`;
  sqlOutput += `CREATE POLICY "Permitir lectura individual de su expediente" ON public.expedientes_docentes\n`;
  sqlOutput += `    FOR SELECT USING (\n`;
  sqlOutput += `        auth.uid()::text = usuario_cedula \n`;
  sqlOutput += `        OR (SELECT rol FROM public.usuarios WHERE cedula = auth.uid()::text) = 'Administrador'\n`;
  sqlOutput += `    );\n\n`;
  sqlOutput += `CREATE POLICY "Permitir modificacion de su propio expediente" ON public.expedientes_docentes\n`;
  sqlOutput += `    FOR ALL USING (\n`;
  sqlOutput += `        auth.uid()::text = usuario_cedula \n`;
  sqlOutput += `        OR (SELECT rol FROM public.usuarios WHERE cedula = auth.uid()::text) = 'Administrador'\n`;
  sqlOutput += `    );\n\n`;

  sqlOutput += `BEGIN;\n\n`;

  let usersCount = 0;
  let expedientesCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = parseCSVLine(line);
    if (columns.length < 5) continue;

    const cedula = columns[1].trim();
    const nombres = columns[2].trim();
    const apellidos = columns[3].trim();
    let fechaIngreso = columns[4].trim();

    const nombreCompleto = `${nombres} ${apellidos}`.trim();

    // Parse JSON fields
    const datosFicha = cleanJsonQuotes(columns[5]);
    const curriculumVitae = cleanJsonQuotes(columns[6]);

    // Extract emails and phones from datosFicha
    let email = null;
    let telefono = null;
    let sexo = 'Femenino';
    let fechaNacimiento = '1985-01-01';
    let estadoCivil = 'Soltero/a';
    let direccion = 'No registrada';

    if (datosFicha) {
      if (datosFicha.correos) {
        email = datosFicha.correos.personal || datosFicha.correos.institucional || null;
      }
      if (datosFicha.telefonos) {
        telefono = datosFicha.telefonos.movil || datosFicha.telefonos.local || null;
      }
      if (datosFicha.genero) {
        sexo = datosFicha.genero;
      }
      if (datosFicha.fecha_nacimiento) {
        fechaNacimiento = datosFicha.fecha_nacimiento;
      }
      if (datosFicha.estado_civil) {
        estadoCivil = datosFicha.estado_civil;
      }
      if (datosFicha.direccion) {
        direccion = datosFicha.direccion;
      }
    }

    if (!fechaIngreso || fechaIngreso === 'NULL') {
      fechaIngreso = '2020-01-01'; // Default backup date
    }

    // Extract academic details
    let tituloObtenido = 'No registrado';
    let nivelInstruccion = 'No registrado';
    let universidad = 'No registrada';
    let anioEgreso = new Date().getFullYear();

    if (curriculumVitae && curriculumVitae.titulos_universitarios && curriculumVitae.titulos_universitarios.length > 0) {
      const primerTitulo = curriculumVitae.titulos_universitarios[0];
      tituloObtenido = primerTitulo.titulo || 'No registrado';
      nivelInstruccion = primerTitulo.nivel || 'No registrado';
      universidad = primerTitulo.institucion || 'No registrada';
      anioEgreso = parseInt(primerTitulo.anio) || new Date().getFullYear();
    }

    // 1. Insert/Upsert into usuarios table
    sqlOutput += `-- Docente: ${nombreCompleto}\n`;
    sqlOutput += `INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)\n`;
    sqlOutput += `VALUES (\n`;
    sqlOutput += `  ${escapeSql(cedula)},\n`;
    sqlOutput += `  ${escapeSql(nombreCompleto)},\n`;
    sqlOutput += `  'Docente',\n`;
    sqlOutput += `  'lb',\n`;
    sqlOutput += `  ${escapeSql(email)},\n`;
    sqlOutput += `  ${escapeSql(telefono)},\n`;
    sqlOutput += `  ${escapeSql(cedula)}, -- Clave inicial igual a la cédula\n`;
    sqlOutput += `  'Activo',\n`;
    sqlOutput += `  true,\n`;
    sqlOutput += `  false\n`;
    sqlOutput += `)\n`;
    sqlOutput += `ON CONFLICT (cedula) DO UPDATE SET\n`;
    sqlOutput += `  nombre_completo = EXCLUDED.nombre_completo,\n`;
    sqlOutput += `  email = COALESCE(usuarios.email, EXCLUDED.email),\n`;
    sqlOutput += `  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);\n\n`;
    usersCount++;

    // 2. Insert/Upsert into expedientes_docentes table
    sqlOutput += `INSERT INTO public.expedientes_docentes (\n`;
    sqlOutput += `  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,\n`;
    sqlOutput += `  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,\n`;
    sqlOutput += `  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos\n`;
    sqlOutput += `)\n`;
    sqlOutput += `VALUES (\n`;
    sqlOutput += `  ${escapeSql(cedula)},\n`;
    sqlOutput += `  ${escapeSql(sexo)},\n`;
    sqlOutput += `  ${escapeSql(fechaNacimiento)},\n`;
    sqlOutput += `  ${escapeSql(estadoCivil)},\n`;
    sqlOutput += `  ${escapeSql(direccion)},\n`;
    sqlOutput += `  ${escapeSql(tituloObtenido)},\n`;
    sqlOutput += `  ${escapeSql(nivelInstruccion)},\n`;
    sqlOutput += `  ${escapeSql(universidad)},\n`;
    sqlOutput += `  ${anioEgreso},\n`;
    sqlOutput += `  ${escapeSql(fechaIngreso)},\n`;
    sqlOutput += `  'Fijo',\n`;
    sqlOutput += `  36,\n`;
    sqlOutput += `  'Activo',\n`;
    sqlOutput += `  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb\n`;
    sqlOutput += `)\n`;
    sqlOutput += `ON CONFLICT (usuario_cedula) DO NOTHING;\n\n`;
    expedientesCount++;
  }

  sqlOutput += `COMMIT;\n`;

  fs.writeFileSync('./migracion_expedientes.sql', sqlOutput, 'utf-8');
  console.log(`Successfully generated migration SQL script with ${usersCount} users and ${expedientesCount} expedientes.`);
}

run();
