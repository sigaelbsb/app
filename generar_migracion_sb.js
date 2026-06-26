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
  try {
    return JSON.parse(str);
  } catch (e) {
    try {
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
  const csvPath = './expedientes_docentes_rows (1).csv';
  if (!fs.existsSync(csvPath)) {
    console.error("CSV file not found:", csvPath);
    return;
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split(/\r?\n/);
  
  const headers = parseCSVLine(lines[0]);
  console.log("Headers:", headers);

  let sqlOutput = `-- ========================================================\n`;
  sqlOutput += `-- MIGRACIÓN DE EXPEDIENTES Y USUARIOS: SANTA BÁRBARA\n`;
  sqlOutput += `-- Generado automáticamente: ${new Date().toISOString()}\n`;
  sqlOutput += `-- ========================================================\n\n`;

  sqlOutput += `BEGIN;\n\n`;

  let usersCount = 0;
  let expedientesCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = parseCSVLine(line);
    if (columns.length < 5) continue;

    const cedula = columns[1].trim();
    if (cedula === '17242954') {
      console.log(`Excluding user with C.I. ${cedula} from SB migration to avoid conflict with Libertador Bolívar.`);
      continue;
    }
    const nombres = columns[2].trim();
    const apellidos = columns[3].trim();
    let fechaIngreso = columns[4].trim();

    const nombreCompleto = `${nombres} ${apellidos}`.trim();

    // Parse JSON fields
    const datosFicha = cleanJsonQuotes(columns[5]);
    const curriculumVitae = cleanJsonQuotes(columns[6]);
    const planificacionEstrategica = cleanJsonQuotes(columns[7]);

    // Extract emails and phones from datosFicha
    let email = null;
    let telefono = null;
    let sexo = 'Femenino';
    let fechaNacimiento = '1985-01-01';
    let estadoCivil = 'Soltero/a';
    let direccion = 'No registrada';

    let datosSalud = {};
    let datosElectoral = {};
    let cargaFamiliar = [];
    let cursosRealizados = [];
    let planFormacion = [];
    let necesidadesExtra = '';
    
    // Rich career new fields
    let gerencia = '';
    let organizacionProceso = '';
    let desarrolloCarrera = '';
    let otrosIdiomas = '';
    let experienciaExterna = [];
    let historicoPdvsa = [];
    let estudiosSuperiores = [];

    let datosVivienda = {
      tipo_prestamo: '',
      num_convivientes: 1,
      discapacidad_trabajador: 'No',
      discapacidad_familiar: 'No',
      conyuge_nombre: '',
      conyuge_cedula: '',
      conyuge_trabaja_pdvsa: 'Nunca ha trabajado en PDVSA',
      condicion_habitabilidad: '',
      prioridad: ''
    };

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
      if (datosFicha.salud) {
        datosSalud = datosFicha.salud;
        if (datosFicha.salud.conapdis) {
          datosVivienda.discapacidad_trabajador = datosFicha.salud.conapdis;
        }
      }
      if (datosFicha.electoral) {
        datosElectoral = datosFicha.electoral;
      }
      if (datosFicha.vivienda_creditos) {
        if (datosFicha.vivienda_creditos.condicion) {
          datosVivienda.condicion_habitabilidad = datosFicha.vivienda_creditos.condicion;
        }
        if (datosFicha.vivienda_creditos.solicitud_unica && datosFicha.vivienda_creditos.solicitud_unica.tipo) {
          datosVivienda.tipo_prestamo = datosFicha.vivienda_creditos.solicitud_unica.tipo;
        } else if (datosFicha.vivienda_creditos.credito_5_sueldos && datosFicha.vivienda_creditos.credito_5_sueldos !== 'No Solicitado') {
          datosVivienda.tipo_prestamo = 'Inicial/Adquisición';
        }
      }
      if (datosFicha.carga_familiar) {
        cargaFamiliar = datosFicha.carga_familiar;
        if (Array.isArray(cargaFamiliar)) {
          const livingWithWorker = cargaFamiliar.filter(f => f.vive_con_trabajador === 'Sí').length;
          datosVivienda.num_convivientes = 1 + livingWithWorker;

          if (cargaFamiliar.some(f => f.conapdis === 'Sí')) {
            datosVivienda.discapacidad_familiar = 'Sí';
          }

          const conyuge = cargaFamiliar.find(f => f.parentesco === 'Esposo(a)' || f.parentesco === 'Concubino(a)');
          if (conyuge) {
            datosVivienda.conyuge_nombre = conyuge.nombres || '';
            datosVivienda.conyuge_cedula = conyuge.cedula || '';
            datosVivienda.conyuge_trabaja_pdvsa = conyuge.estatus_pdvsa || 'Nunca ha trabajado en PDVSA';
          }
        }
      }
      if (datosFicha.corporativo) {
        gerencia = datosFicha.corporativo.gerencia || '';
        organizacionProceso = datosFicha.corporativo.organizacion || '';
        desarrolloCarrera = datosFicha.corporativo.desarrollo_carrera || '';
      }
    }

    if (curriculumVitae) {
      if (curriculumVitae.cursos_realizados) {
        cursosRealizados = curriculumVitae.cursos_realizados;
      }
      otrosIdiomas = curriculumVitae.otros_idiomas || '';
      experienciaExterna = curriculumVitae.experiencia_externa || [];
      historicoPdvsa = curriculumVitae.historico_posiciones || [];
      estudiosSuperiores = curriculumVitae.titulos_universitarios || [];
    }

    if (planificacionEstrategica) {
      if (planificacionEstrategica.plan_formacion) {
        planFormacion = planificacionEstrategica.plan_formacion;
      }
      if (planificacionEstrategica.necesidades_extra) {
        necesidadesExtra = planificacionEstrategica.necesidades_extra;
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

    if (estudiosSuperiores && estudiosSuperiores.length > 0) {
      const primerTitulo = estudiosSuperiores[0];
      tituloObtenido = primerTitulo.titulo || 'No registrado';
      nivelInstruccion = primerTitulo.nivel || 'No registrado';
      universidad = primerTitulo.institucion || 'No registrada';
      anioEgreso = parseInt(primerTitulo.anio) || new Date().getFullYear();
    }

    // 1. Insert/Upsert into usuarios table (Setting id_escuela to 'sb'!)
    sqlOutput += `-- Docente: ${nombreCompleto}\n`;
    sqlOutput += `INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)\n`;
    sqlOutput += `VALUES (\n`;
    sqlOutput += `  ${escapeSql(cedula)},\n`;
    sqlOutput += `  ${escapeSql(nombreCompleto)},\n`;
    sqlOutput += `  'Docente',\n`;
    sqlOutput += `  'sb',\n`;
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

    // 2. Insert/Upsert into expedientes_docentes table (including the expanded columns!)
    sqlOutput += `INSERT INTO public.expedientes_docentes (\n`;
    sqlOutput += `  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,\n`;
    sqlOutput += `  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,\n`;
    sqlOutput += `  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,\n`;
    sqlOutput += `  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,\n`;
    sqlOutput += `  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores\n`;
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
    sqlOutput += `  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,\n`;
    sqlOutput += `  ${escapeSql(JSON.stringify(datosSalud))}::jsonb,\n`;
    sqlOutput += `  ${escapeSql(JSON.stringify(datosElectoral))}::jsonb,\n`;
    sqlOutput += `  ${escapeSql(JSON.stringify(datosVivienda))}::jsonb,\n`;
    sqlOutput += `  ${escapeSql(JSON.stringify(cargaFamiliar))}::jsonb,\n`;
    sqlOutput += `  ${escapeSql(JSON.stringify(cursosRealizados))}::jsonb,\n`;
    sqlOutput += `  ${escapeSql(JSON.stringify(planFormacion))}::jsonb,\n`;
    sqlOutput += `  ${escapeSql(necesidadesExtra)},\n`;
    sqlOutput += `  ${escapeSql(gerencia)},\n`;
    sqlOutput += `  ${escapeSql(organizacionProceso)},\n`;
    sqlOutput += `  ${escapeSql(desarrolloCarrera)},\n`;
    sqlOutput += `  ${escapeSql(otrosIdiomas)},\n`;
    sqlOutput += `  ${escapeSql(JSON.stringify(experienciaExterna))}::jsonb,\n`;
    sqlOutput += `  ${escapeSql(JSON.stringify(historicoPdvsa))}::jsonb,\n`;
    sqlOutput += `  ${escapeSql(JSON.stringify(estudiosSuperiores))}::jsonb\n`;
    sqlOutput += `)\n`;
    sqlOutput += `ON CONFLICT (usuario_cedula) DO UPDATE SET\n`;
    sqlOutput += `  sexo = EXCLUDED.sexo,\n`;
    sqlOutput += `  fecha_nacimiento = EXCLUDED.fecha_nacimiento,\n`;
    sqlOutput += `  estado_civil = EXCLUDED.estado_civil,\n`;
    sqlOutput += `  direccion = EXCLUDED.direccion,\n`;
    sqlOutput += `  titulo_obtenido = EXCLUDED.titulo_obtenido,\n`;
    sqlOutput += `  nivel_instruccion = EXCLUDED.nivel_instruccion,\n`;
    sqlOutput += `  universidad = EXCLUDED.universidad,\n`;
    sqlOutput += `  anio_egreso = EXCLUDED.anio_egreso,\n`;
    sqlOutput += `  fecha_ingreso = EXCLUDED.fecha_ingreso,\n`;
    sqlOutput += `  datos_salud = EXCLUDED.datos_salud,\n`;
    sqlOutput += `  datos_electoral = EXCLUDED.datos_electoral,\n`;
    sqlOutput += `  datos_vivienda = EXCLUDED.datos_vivienda,\n`;
    sqlOutput += `  carga_familiar = EXCLUDED.carga_familiar,\n`;
    sqlOutput += `  cursos_realizados = EXCLUDED.cursos_realizados,\n`;
    sqlOutput += `  plan_formacion = EXCLUDED.plan_formacion,\n`;
    sqlOutput += `  necesidades_extra = EXCLUDED.necesidades_extra,\n`;
    sqlOutput += `  gerencia = EXCLUDED.gerencia,\n`;
    sqlOutput += `  organizacion_proceso = EXCLUDED.organizacion_proceso,\n`;
    sqlOutput += `  desarrollo_carrera = EXCLUDED.desarrollo_carrera,\n`;
    sqlOutput += `  otros_idiomas = EXCLUDED.otros_idiomas,\n`;
    sqlOutput += `  experiencia_externa = EXCLUDED.experiencia_externa,\n`;
    sqlOutput += `  historico_pdvsa = EXCLUDED.historico_pdvsa,\n`;
    sqlOutput += `  estudios_superiores = EXCLUDED.estudios_superiores;\n\n`;
    expedientesCount++;
  }

  sqlOutput += `COMMIT;\n`;

  fs.writeFileSync('./migracion_santa_barbara.sql', sqlOutput, 'utf-8');
  console.log(`Successfully generated migration SQL script with ${usersCount} users and ${expedientesCount} expedientes for Santa Barbara.`);
}

run();
