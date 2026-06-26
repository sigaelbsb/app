-- ========================================================
-- MIGRACIÓN DE EXPEDIENTES Y USUARIOS: LIBERTADOR BOLÍVAR
-- Generado automáticamente: 2026-06-21T22:28:07.345Z
-- ========================================================

-- 1. Crear tabla si no existe con columnas completas
CREATE TABLE IF NOT EXISTS public.expedientes_docentes (
    usuario_cedula VARCHAR(20) PRIMARY KEY REFERENCES public.usuarios(cedula) ON DELETE CASCADE,
    sexo VARCHAR(10) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    estado_civil VARCHAR(20) NOT NULL,
    direccion TEXT NOT NULL,
    titulo_obtenido VARCHAR(150) NOT NULL,
    nivel_instruccion VARCHAR(100) NOT NULL,
    universidad VARCHAR(150) NOT NULL,
    anio_egreso INT NOT NULL,
    fecha_ingreso DATE NOT NULL,
    tipo_nomina VARCHAR(50) NOT NULL,
    carga_horaria INT NOT NULL,
    estatus_laboral VARCHAR(50) NOT NULL,
    documentos JSONB NOT NULL DEFAULT '{"cedula": false, "titulo": false, "cv": false, "constancia": false}'::jsonb,
    datos_salud JSONB DEFAULT '{}'::jsonb,
    datos_electoral JSONB DEFAULT '{}'::jsonb,
    datos_vivienda JSONB DEFAULT '{}'::jsonb,
    carga_familiar JSONB DEFAULT '[]'::jsonb,
    cursos_realizados JSONB DEFAULT '[]'::jsonb,
    plan_formacion JSONB DEFAULT '[]'::jsonb,
    necesidades_extra TEXT,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS (Opcional, pero se recomienda desactivarla si no usan Supabase Auth)
ALTER TABLE public.expedientes_docentes ENABLE ROW LEVEL SECURITY;

-- 3. Limpiar políticas previas
DROP POLICY IF EXISTS "Permitir lectura individual de su expediente" ON public.expedientes_docentes;
DROP POLICY IF EXISTS "Permitir modificacion de su propio expediente" ON public.expedientes_docentes;

-- 4. Crear nuevas políticas (Se asume bypass si no hay sesión para pruebas locales)
CREATE POLICY "Permitir lectura individual de su expediente" ON public.expedientes_docentes
    FOR SELECT USING (true);

CREATE POLICY "Permitir modificacion de su propio expediente" ON public.expedientes_docentes
    FOR ALL USING (true);

BEGIN;

-- Docente: Carlos José Gutiérrez Rojas
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '15888222',
  'Carlos José Gutiérrez Rojas',
  'Docente',
  'lb',
  'carlos.gutierrez@example.com',
  '04149991122',
  '15888222', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '15888222',
  'Masculino',
  '1983-05-10',
  'Casado/a',
  'Calle Principal, Sector Centro, Edificio A, Apto 2-B',
  'Profesor de Física',
  'Licenciatura / Profesorado',
  'Universidad de Oriente',
  2005,
  '2006-09-15',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": true}'::jsonb,
  '{"conapdis":"No","talla_botas":"41","talla_braga":"40","talla_camisa":"M","talla_calzado":"41","talla_chemise":"M","emergencia_tel":"04128883344","talla_pantalon":"32","condicion_neuro":"Ninguna","grupo_sanguineo":"O+","condicion_medica":"Ninguna","emergencia_nombre":"María Carolina Rojas"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Santa Cruz","centro_votacion":"Grupo Escolar República de Uruguay"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Ana Sofía Delgado","conyuge_cedula":"16444888","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"3) Habite en condición de alquiler, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"9 Años","cedula":"32444555","nombres":"Sofía Valentina Gutiérrez Delgado","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Ninguna","fecha_nacimiento":"2017-03-12","vive_con_trabajador":"Sí"},{"edad":"5 Años","cedula":"","nombres":"Mateo Alejandro Gutiérrez Delgado","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Inicial","condicion_neuro":"Ninguna","fecha_nacimiento":"2021-08-20","vive_con_trabajador":"Sí"},{"edad":"38 Años","cedula":"16444888","nombres":"Ana Sofía Delgado","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Ninguno","condicion_neuro":"Ninguna","fecha_nacimiento":"1988-06-25","vive_con_trabajador":"Sí"},{"edad":"68 Años","cedula":"6123456","nombres":"Elvia María Rojas de Gutiérrez","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Ninguno","condicion_neuro":"Ninguna","fecha_nacimiento":"1958-05-10","vive_con_trabajador":"No"},{"edad":"71 Años","cedula":"5987654","nombres":"José Antonio Gutiérrez","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Ninguno","condicion_neuro":"Ninguna","fecha_nacimiento":"1955-09-15","vive_con_trabajador":"No"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Inteligencia Artificial para el Aula","categoria":"Tecnología Educativa (EdTech)"},{"nivel":"Básico","titulo":"Comunicación Asertiva y Resolución de Conflictos","categoria":"Gestión y Liderazgo Educativo"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: María José Martínez Oliveros
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '17463095',
  'María José Martínez Oliveros',
  'Docente',
  'lb',
  'marijo1746@gmail.com',
  '04162889081',
  '17463095', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '17463095',
  'Femenino',
  '1986-12-05',
  'Concubino/a',
  'Urbanización Monterrey Iv, Tipuro, Casa 145 Calle 5',
  'Profesora de Educación Integral',
  'Licenciatura / Profesorado',
  'Universidad Pedagógica Experimental Libertador',
  2011,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"39","talla_braga":"48","talla_camisa":"XXL","talla_calzado":"39","talla_chemise":"XXL","emergencia_tel":"04148863003","talla_pantalon":"38","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Resistencia a la Insulina","emergencia_nombre":"Alejandro Rodríguez"}'::jsonb,
  '{"estado":"Monagas","municipio":"Punceres","parroquia":"Cachipo","centro_votacion":"Escuela Básica Andrés Eloy Blanco"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":2,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Alejandro José Rodríguez Villarroel","conyuge_cedula":"16926442","conyuge_trabaja_pdvsa":"Trabajador(a) Activo(a)","condicion_habitabilidad":"2) Habita en condición de arrimado, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"64 Años","cedula":"8446721","nombres":"Hilda Eliza Oliveros de Martinez","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1961-11-11","vive_con_trabajador":"No"},{"edad":"40 Años","cedula":"16926442","nombres":"Alejandro José Rodríguez Villarroel","conapdis":"No","parentesco":"Concubino(a)","estatus_pdvsa":"Trabajador(a) Activo(a)","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1985-11-20","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Isabel María Albornoz Marcano
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '18172869',
  'Isabel María Albornoz Marcano',
  'Docente',
  'lb',
  'albornozmarcano@gmail.com',
  '04263981776',
  '18172869', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '18172869',
  'Femenino',
  '1985-09-07',
  'Casado/a',
  'Zona Industrial, Urbanización Aves del Paraíso Calle 8 con Calle D Casa #230',
  'Profesor de Educación Preescolar',
  'Licenciatura / Profesorado',
  'Upel',
  2010,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"38","talla_braga":"38","talla_camisa":"XL","talla_calzado":"38","talla_chemise":"XL","emergencia_tel":"04148612815","talla_pantalon":"36","condicion_neuro":"Neurotípico","grupo_sanguineo":"A+","condicion_medica":"Ninguna","emergencia_nombre":"Luis Guevara"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Santa Cruz","centro_votacion":"U.e.c.e las Carolinas"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Mejoras","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Luis Alejandro Guevara Cabello","conyuge_cedula":"11449043","conyuge_trabaja_pdvsa":"Trabajó / Está Retirado(a)","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"15 Años","cedula":"33833455","nombres":"Luis Guillermo Guevara Albornoz","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2011-03-11","vive_con_trabajador":"Sí"},{"edad":"10 Años","cedula":"36895316","nombres":"Alejandro Gabriel Guevara Albornoz","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2015-09-24","vive_con_trabajador":"Sí"},{"edad":"72 Años","cedula":"4301867","nombres":"Pedro Guillermo Albornoz González","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1953-06-08","vive_con_trabajador":"No"},{"edad":"62 Años","cedula":"8494015","nombres":"Isidra Josefina Marcano","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1963-05-15","vive_con_trabajador":"No"},{"edad":"53 Años","cedula":"11449043","nombres":"Luis Alejandro Guevara Cabello","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Trabajó / Está Retirado(a)","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1973-04-12","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Patricia De Jesús Acosta Díaz
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '19603449',
  'Patricia De Jesús Acosta Díaz',
  'Docente',
  'lb',
  'acostapatty89@gmail.com',
  '04267200383',
  '19603449', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '19603449',
  'Femenino',
  '1989-02-17',
  'Concubino/a',
  'Sector Bajo el Río, Calle Sabaneta, Casa S/n',
  'Licenciada en Educación, Mención Educación Especial',
  'Licenciatura / Profesorado',
  'Universidad Bolivariana de Venezuela',
  10,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"","talla_braga":"","talla_camisa":"","talla_calzado":"","talla_chemise":"","emergencia_tel":"","talla_pantalon":"","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"","emergencia_nombre":""}'::jsonb,
  '{"estado":"Monagas","municipio":"","parroquia":"","centro_votacion":""}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":1,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"","prioridad":""}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Julia Isabel Ruiz Villarroel
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '19875121',
  'Julia Isabel Ruiz Villarroel',
  'Docente',
  'lb',
  'jisabelrv2025@gmail.com',
  '04169939770',
  '19875121', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '19875121',
  'Femenino',
  '1989-04-24',
  'Casado/a',
  'Avenida Principal de Tipuro, Vía Vivoral, Altos de Tipuro, Casas 12',
  'Profesora de Lengua y Literatura',
  'Licenciatura / Profesorado',
  'Pedagógico de Maturín',
  2012,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"39","talla_braga":"44","talla_camisa":"L","talla_calzado":"38","talla_chemise":"L","emergencia_tel":"04128345047","talla_pantalon":"30","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Hipertensión","emergencia_nombre":"Mi Esposo"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Santa Cruz","centro_votacion":"Colegio San Miguel"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":1,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Lorianis Zullym Celiz Castillo
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '17483709',
  'Lorianis Zullym Celiz Castillo',
  'Docente',
  'lb',
  'lorianisceliz22@gmail.com',
  '04129494450',
  '17483709', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '17483709',
  'Femenino',
  '1986-02-22',
  'Casado/a',
  'Complejo Paramaconi, Parroquia Altos de los Godos',
  'No registrado',
  'No registrado',
  'No registrada',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"","talla_braga":"","talla_camisa":"","talla_calzado":"","talla_chemise":"","emergencia_tel":"","talla_pantalon":"","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"","emergencia_nombre":""}'::jsonb,
  '{"estado":"Monagas","municipio":"","parroquia":"","centro_votacion":""}'::jsonb,
  '{"tipo_prestamo":"","num_convivientes":1,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"","prioridad":""}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Luis Ricardo Salmerón Presilla
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '11381867',
  'Luis Ricardo Salmerón Presilla',
  'Docente',
  'lb',
  'luisricardosalmeronlr@gmail.com',
  '04128625780',
  '11381867', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '11381867',
  'Masculino',
  '1972-11-02',
  'Casado/a',
  'Villas de la Laguna Calle B2 Casa 175 Sector Tipuro',
  'Profesor de Matemática Atica',
  'Licenciatura / Profesorado',
  'Universidad Pedagógica Experimental Libertador Ipm',
  2005,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"43","talla_braga":"40","talla_camisa":"M","talla_calzado":"42","talla_chemise":"M","emergencia_tel":"04265940085","talla_pantalon":"32","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"","emergencia_nombre":"Joannolis Hernández"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"San Simón","centro_votacion":"Universidad Bolivariana de Venezuela"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Joannolis Hernández","conyuge_cedula":"10933408","conyuge_trabaja_pdvsa":"Trabajador(a) Activo(a)","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"54 Años","cedula":"10933408","nombres":"Joannolis Hernández","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Trabajador(a) Activo(a)","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1971-09-09","vive_con_trabajador":"Sí"},{"edad":"29 Años","cedula":"23539489","nombres":"Luis David Salmerón P.","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1996-05-30","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"27 al 30 de 03-2014","horas":"16","lugar":"Cieduc Isla de Margarita","titulo":"3er Congreso Internacional e Interactivo de Educación"},{"fecha":"29 y 30 de 11-2012","horas":"16","lugar":"Asociación Venezolana de Educación Matemática","titulo":"Encuentro de Educación Matemática y Educación Especial"},{"fecha":"25 y 26 de 03-2014","horas":"16","lugar":"Petroleos de Venezuela, S.a","titulo":"Proceso de Transformación de la Cultura Escolar Bajo el Enfoque de la Didáctica Crítica"},{"fecha":"07-10-2013","horas":"08","lugar":"Petróleos de Venezuela, S.a","titulo":"Marco Ético y Moral"},{"fecha":"19 y 20 de 09-2013","horas":"16","lugar":"Petróleos de Venezuela, S. a","titulo":"5 Tiempos Petroleros"},{"fecha":"06 y 07de 09-2011","horas":"16","lugar":"Universidad Bolivariana de Venezuela","titulo":"Taller de Instalación de la Meta Distribución Canaima Gnu/linux"},{"fecha":"06 y 07 de 09-2011","horas":"16","lugar":"Universidad Bolivariana de Venezuela","titulo":"Taller de Gimp. la Evolución Libre del Diseño"},{"fecha":"05 y 06 de 04-2011","horas":"16","lugar":"Petróleos de Venezuela, S.a","titulo":"Ética y Valores Socialistas"},{"fecha":"07-06-2002","horas":"16","lugar":"Universidad Pedagógica Experimental Libertador Ipm","titulo":"Seminario de Internet Básico"},{"fecha":"21 y 22 de 06-2002","horas":"16","lugar":"Universidad Pedagógica Experimental Libertador Ipm","titulo":"Mundo, Mente y Matemática y"},{"fecha":"21, 22 y 23 de 06-2001","horas":"20","lugar":"Universidad Pedagógica Experimental Libertador","titulo":"3era Jornada de Investigación T Educación Matemática"},{"fecha":"24 y 26 de 10-2011","horas":"24","lugar":"Centro de Adiestramiento de Alta Tecnología","titulo":"Microsoft Office Excel 2007 Avanzado"}]'::jsonb,
  '[{"nivel":"Básico","titulo":"Paquetería Ofimática (Word, Excel, PowerPoint/Libres)","categoria":"Tecnología Educativa (EdTech)"},{"nivel":"Básico","titulo":"Inteligencia Emocional para Liderar el Aula","categoria":"Gestión y Liderazgo Educativo"},{"nivel":"Básico","titulo":"Prevención del Burnout Docente: Autocuidado Profesional","categoria":"Innovación y Desarrollo Profesional"},{"nivel":"Básico","titulo":"Microlearning: Diseño de Píldoras Formativas","categoria":"Formación Pedagógica y Didáctica"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Trinellys Del Valle Duran De Carvajal
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '16807474',
  'Trinellys Del Valle Duran De Carvajal',
  'Docente',
  'lb',
  'trinellysdelvalle@gmail.com',
  '04249188018',
  '16807474', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '16807474',
  'Femenino',
  '1983-10-08',
  'Casado/a',
  'Urbanización Valle Grande Country Ii Calle 3 M9-14',
  'No registrado',
  'No registrado',
  'No registrada',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"37","talla_braga":"44","talla_camisa":"XXL","talla_calzado":"37","talla_chemise":"XXL","emergencia_tel":"04249738725","talla_pantalon":"42","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Hipertensión","emergencia_nombre":"Dickson"}'::jsonb,
  '{"estado":"Monagas","municipio":"","parroquia":"","centro_votacion":""}'::jsonb,
  '{"tipo_prestamo":"Inicial/Mejoras","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Dickson Carvajal","conyuge_cedula":"17935775","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"39 Años","cedula":"17935775","nombres":"Dickson Carvajal","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1987-03-22","vive_con_trabajador":"Sí"},{"edad":"13 Años","cedula":"34357910","nombres":"Aleckson Carvajal","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2012-06-08","vive_con_trabajador":"Sí"},{"edad":"60 Años","cedula":"4895742","nombres":"Francisca Villahermosa","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"No Escolarizado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1965-08-22","vive_con_trabajador":"No"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: José Vicente Millán Montaño
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '17780095',
  'José Vicente Millán Montaño',
  'Docente',
  'lb',
  'jvicentemillan711@gmail.com',
  '04128617318',
  '17780095', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '17780095',
  'Masculino',
  '1985-11-07',
  'Casado/a',
  'Complejo Habitacional Paramaconi P9 06',
  'Profesor Geografía e Historia',
  'Licenciatura / Profesorado',
  'Upel - Ipm',
  2010,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"42","talla_braga":"38","talla_camisa":"S","talla_calzado":"41","talla_chemise":"S","emergencia_tel":"04129494450","talla_pantalon":"30","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"","emergencia_nombre":"Lorianis Celiz"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Escuela Negra Matea"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Lorianis Zully Celiz Castillo","conyuge_cedula":"17483709","conyuge_trabaja_pdvsa":"Trabajador(a) Activo(a)","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"40 Años","cedula":"17483709","nombres":"Lorianis Zully Celiz Castillo","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Trabajador(a) Activo(a)","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1986-02-22","vive_con_trabajador":"Sí"},{"edad":"11 Años","cedula":"37232410","nombres":"Arturo José Millan Celiz","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2015-01-30","vive_con_trabajador":"Sí"},{"edad":"9 Años","cedula":"37504209","nombres":"Ana Victoria Millan Celiz","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2016-10-19","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Avanzado","titulo":"Comunicación Asertiva y Resolución de Conflictos","categoria":"Gestión y Liderazgo Educativo"},{"nivel":"Avanzado","titulo":"Paquetería Ofimática (Word, Excel, PowerPoint/Libres)","categoria":"Tecnología Educativa (EdTech)"},{"nivel":"Avanzado","titulo":"Oratoria y Comunicación Efectiva para Educadores","categoria":"Innovación y Desarrollo Profesional"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Maryfranci Anyali Noriega Barreto
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '14101477',
  'Maryfranci Anyali Noriega Barreto',
  'Docente',
  'lb',
  'nenaquim23@gmail.com',
  '04249170589',
  '14101477', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '14101477',
  'Femenino',
  '1979-05-23',
  'Casado/a',
  'Urbanización Alberto Ravell, Calle 29. Conjunto Residencial Alberto Ravell, Edificio Corozal. Piso 4 Apartamento 4a',
  'Profesora Especialidad de Química',
  'Licenciatura / Profesorado',
  'Universidad Pedagógica Experimental Libertador - Instituto Pedagógico de Maturín',
  2004,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"35","talla_braga":"48","talla_camisa":"XXXL","talla_calzado":"36","talla_chemise":"XXXL","emergencia_tel":"04166876444","talla_pantalon":"38","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Asma. Alergias Alimenticias","emergencia_nombre":"Luis Veliz"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"San Simón","centro_votacion":"Centro de Educación Inicial el Libertador"}'::jsonb,
  '{"tipo_prestamo":"Adicional/Mejoras","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Luis Lorenzo Véliz Morocoima","conyuge_cedula":"11446707","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"55 Años","cedula":"11446707","nombres":"Luis Lorenzo Véliz Morocoima","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1970-08-01","vive_con_trabajador":"Sí"},{"edad":"24 Años","cedula":"29549853","nombres":"Luis Lorenzo Véliz Noriega","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2001-08-28","vive_con_trabajador":"Sí"},{"edad":"17 Años","cedula":"33516111","nombres":"Nazareth Maryfranci Véliz Noriega","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2008-09-13","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Básico","titulo":"Rutinas de Pensamiento para Desarrollar la Mente","categoria":"Formación Pedagógica y Didáctica"},{"nivel":"Intermedio","titulo":"Comunicación Asertiva y Resolución de Conflictos","categoria":"Gestión y Liderazgo Educativo"},{"nivel":"Básico","titulo":"Prevención del Burnout Docente: Autocuidado Profesional","categoria":"Innovación y Desarrollo Profesional"},{"nivel":"Básico","titulo":"Liderazgo Pedagógico: Inspirar sin Autoritarismo","categoria":"Gestión y Liderazgo Educativo"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Adriana Margarita Rodríguez López
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '18983523',
  'Adriana Margarita Rodríguez López',
  'Docente',
  'lb',
  'adriyanlop523@gmail.com',
  '04163855873',
  '18983523', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '18983523',
  'Femenino',
  '1987-04-24',
  'Concubino/a',
  'Urbanización Chalets de la Laguna Tipuro Vía Víboral',
  'Profesora Mención Geografía e Historia',
  'Licenciatura / Profesorado',
  'Universidad Experimental Libertador Upel',
  2012,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"","talla_braga":"","talla_camisa":"M","talla_calzado":"38","talla_chemise":"M","emergencia_tel":"04147707448","talla_pantalon":"30","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"","emergencia_nombre":"Edwin Chirinos"}'::jsonb,
  '{"estado":"Monagas","municipio":"Punceres","parroquia":"Quiriquire","centro_votacion":"Escuela Básica 15 de Enero"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":2,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Edwin Chirinos","conyuge_cedula":"16374823","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"2) Habita en condición de arrimado, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"41 Años","cedula":"16374823","nombres":"Edwin Chirinos","conapdis":"No","parentesco":"Concubino(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1984-08-15","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Olga Alicia Parra Salazar
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '11830987',
  'Olga Alicia Parra Salazar',
  'Docente',
  'lb',
  'olgaparrasalazar4@gmail.com',
  '04162985387',
  '11830987', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '11830987',
  'Femenino',
  '1973-11-04',
  'Soltero/a',
  'Urbanización Agua Viva (palma Real) Calle 2, Casa A8',
  'Especialista en Educación Básica',
  'Postgrado / Especialización',
  'Upel/ Ipm',
  2009,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"42","talla_braga":"40","talla_camisa":"XXL","talla_calzado":"40","talla_chemise":"XXL","emergencia_tel":"04249249780","talla_pantalon":"36","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Ninguna","emergencia_nombre":"Jorge Luis Aponte Sosa"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"San Simón","centro_votacion":"Cei Libertador Bolivar"}'::jsonb,
  '{"tipo_prestamo":"","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Jorge Luis Aponte Sosa","conyuge_cedula":"13452820","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"52 Años","cedula":"13452820","nombres":"Jorge Luis Aponte Sosa","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1974-02-27","vive_con_trabajador":"Sí"},{"edad":"14 Años","cedula":"34102749","nombres":"Jorgelis Anais Aponte Parra","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2011-06-05","vive_con_trabajador":"Sí"},{"edad":"13 Años","cedula":"34491628","nombres":"Jorge Ali Aponte Parra","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2012-10-28","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"15/ 12/  2016","horas":"8","lugar":"Pdvsa","titulo":"I Taller de Educación Ambiental de la Gerencia de Ambiente e Higiene Ocupacional Distrito Social Nortecoaching Educativo"},{"fecha":"25 al 28/09/2007","horas":"40","lugar":"Proyecto de Integración Urbana del Municipio Punceres(piump)","titulo":"Todos Somos Iguales, Todos Somos Diferentes"},{"fecha":"1 y 2 de marzo 2007","horas":"16","lugar":"Pdvsa","titulo":"Ii Taller de Educación Ambiental - Estrategias Metodológicas"},{"fecha":"29/02/2000","horas":"8","lugar":"U e","titulo":"Jornada de Motivación Al Logro,"},{"fecha":"Del 29 al 31/10/1997","horas":"24","lugar":"Instituto Pedagógico de Maturin","titulo":"Terceras Jornadas de Enfermedades de Transmisión Sexual"},{"fecha":"25/11/1997","horas":"8","lugar":"Instituto Pedagógico de Maturín","titulo":"Educación Sexual 1era.y 2da.etapa"},{"fecha":"12/06/1999","horas":"12","lugar":"Instituto Pedagógico de Maturín","titulo":"I Jornada de Experiencias Educativas en el Nivel de Preescolar"},{"fecha":"11 y 12 /12 /1999","horas":"16","lugar":"Ministerio de Educación","titulo":"Renovación de Escuela Básica Rural"},{"fecha":"03/02/2000","horas":"4","lugar":"Centro Profesional del Docente","titulo":"Evaluación Nuevo Diseño Curricular"},{"fecha":"23/02/2007","horas":"8","lugar":"Diócesis de Maturín Educación Religiosa Escolar Ministerio de Educación y Deportes","titulo":"Reimplantacion de Educación Religiosa Escolar"},{"fecha":"Del 7 al 09/08/2008","horas":"30","lugar":"Asociación de Educadores de Latinoamericana y del Varibr","titulo":"Viii Congreso Mundial de Educación Inicial"},{"fecha":"17/08/2008","horas":"8","lugar":"Scio Accresco","titulo":"Desarrollo de Talentos Generales y Especificos"},{"fecha":"29/02/2008","horas":"8","lugar":"Instituto de Cultura del Estado Monagas","titulo":"Recursos de Aprendizaje Co Material Reciclable"},{"fecha":"29/02 y 01/03/2008","horas":"16","lugar":"Centro de Investigación y Capacitación Integral","titulo":"Régimen Disciplinario y Procedimiento Admilstratibo Constitutivo para el Retiro o Expulsión de Estudiantes"},{"fecha":"30/10/2010","horas":"8","lugar":"Fundación Psocoeducativa","titulo":"Psivomotricidad, Juego y Socialización para la Atención de Niños con Retraso en el Desarrollo"},{"fecha":"09/01/2009","horas":"8","lugar":"Instituto Pedagógico de Maturín","titulo":"Jornada de Actualización"},{"fecha":"Del 14 al 16 de abril  1999","horas":"20","lugar":"Instituto Pedagógico de Maturín","titulo":"\"lenguaje y Juego (desarrollo de las Competencias en Sitúa Iones Lúdicas)"},{"fecha":"Oct/ dic 2004","horas":"48","lugar":"Instituto Pedagógico de Maturín","titulo":"\"evaluación de los Aprendizajes\""}]'::jsonb,
  '[{"nivel":"Básico","titulo":"Paquetería Ofimática (Word, Excel, PowerPoint/Libres)","categoria":"Tecnología Educativa (EdTech)"},{"nivel":"Intermedio","titulo":"Evaluación Formativa con Retroalimentación Efectiva","categoria":"Evaluación y Medición del Aprendizaje"}]'::jsonb,
  'Diplomados Sobre Planificación y Evaluación. Estrategias Metodológicas Lopna: Sistema de Protección de Niños, Niñas y Adolescentes. Otros'
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Teobaldo José Figueroa Gascón
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '15335432',
  'Teobaldo José Figueroa Gascón',
  'Docente',
  'lb',
  'figueroaorm@gmail.com',
  '04166976328',
  '15335432', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '15335432',
  'Masculino',
  '1982-10-03',
  'Casado/a',
  'Urbanización Moriche Ii Calle 5 Casa 242',
  'Profesor de Matemáticas',
  'Licenciatura / Profesorado',
  'Universidad Pedagógica Experimental Libertador - Instituto Pedagógico de Maturín',
  2004,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"42","talla_braga":"44","talla_camisa":"M","talla_calzado":"42","talla_chemise":"M","emergencia_tel":"04261962037","talla_pantalon":"34","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Ninguna","emergencia_nombre":"Isbelys Marcano"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Santa Cruz","centro_votacion":"Ue las Carolinas"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Mejoras","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Isbelys José Marcano Bello","conyuge_cedula":"16723836","conyuge_trabaja_pdvsa":"Trabajador(a) Activo(a)","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"4 Años","cedula":"","nombres":"Matías Alejandro Figueroa Gascón","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Inicial","condicion_neuro":"Neurotípico","fecha_nacimiento":"2021-05-08","vive_con_trabajador":"Sí"},{"edad":"41 Años","cedula":"16723836","nombres":"Isbelys José Marcano Bello","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Trabajador(a) Activo(a)","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1984-12-26","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"Septiembre 09 al 14 de 2012","horas":"32","lugar":"Universidad de los Andes","titulo":"Formación de Entrenadores Olimpiadas Matemáticas"},{"fecha":"Noviembre del 18 al 20 de 2013","horas":"24","lugar":"Globalsys","titulo":"Planes de Carrera por Competencias"},{"fecha":"Diciembre 2013","horas":"200","lugar":"Universidad Simón Bolívar","titulo":"Pio Docente Área del Conocimiento: Matemáticas"},{"fecha":"Marzo del 23 al 24 de 2012","horas":"16","lugar":"Pdvsa","titulo":"Técnicas y Nuevas Tendencias del Canto"},{"fecha":"Septiembre del 11 al 16 de 2011","horas":"32","lugar":"Universidad de los Andes","titulo":"Matemáticas Resolviendo Problemas"},{"fecha":"Septiembre 11 al 16 de 2005","horas":"25","lugar":"Universidad de los Andes","titulo":"Temas de Aritmética"},{"fecha":"Septiembre del 15 al 20 de 2003","horas":"20","lugar":"Universidad de los Andes","titulo":"Didáctica de la Matemática"},{"fecha":"Mayo del 19 al 20 de 2006","horas":"16","lugar":"Pdvsa","titulo":"Taller de Formación Ciudadana"},{"fecha":"12 de noviembre de 2004","horas":"8","lugar":"Pdvsa","titulo":"Metodología de la Investigación"},{"fecha":"Noviembre del 12 al 13 de 2010","horas":"16","lugar":"Pdvsa","titulo":"Investigación en el Aula"},{"fecha":"Marzo del 01 al 04 de 2010","horas":"16","lugar":"Pdvsa","titulo":"Seguridad en la Conducción de Vehículos"},{"fecha":"Julio - Diciembre de 2007","horas":"300","lugar":"Ministerio del Poder Popular para la Educación","titulo":"La Educación Bolivariana"},{"fecha":"26 y 17 de junio de 2011","horas":"16","lugar":"Pdvsa","titulo":"I Taller de Matemática: Resolución de Problemas"},{"fecha":"08 de junio de 2012","horas":"6","lugar":"Fundación D''canto","titulo":"Empaste Vocal y la Colocación de los Cantores"}]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Paquetería Ofimática (Word, Excel, PowerPoint/Libres)","categoria":"Tecnología Educativa (EdTech)"},{"nivel":"Intermedio","titulo":"Comunicación Asertiva y Resolución de Conflictos","categoria":"Gestión y Liderazgo Educativo"},{"nivel":"Básico","titulo":"Microlearning: Diseño de Píldoras Formativas","categoria":"Formación Pedagógica y Didáctica"},{"nivel":"Básico","titulo":"Enseñanza Basada en Problemas (EBP)","categoria":"Formación Pedagógica y Didáctica"},{"nivel":"Básico","titulo":"Análisis de Datos Educativos con Excel","categoria":"Evaluación y Medición del Aprendizaje"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Fernando Daniel Salazar González
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '16397151',
  'Fernando Daniel Salazar González',
  'Docente',
  'lb',
  'salazarfd0212@gmail.com',
  '04128614364',
  '16397151', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '16397151',
  'Masculino',
  '1982-02-12',
  'Casado/a',
  'Urbanización el Faro Condominio Coche Casa Ch-152 Zona Industrial',
  'Profesor Especialidad: Química',
  'Licenciatura / Profesorado',
  'Upel - Ipm',
  2010,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"42","talla_braga":"46","talla_camisa":"L","talla_calzado":"42","talla_chemise":"L","emergencia_tel":"04128797481","talla_pantalon":"36","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Erc Nefropatía Obstructiva","emergencia_nombre":"Cristina Piamo"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"San Simón","centro_votacion":"Ue República del Uruguay"}'::jsonb,
  '{"tipo_prestamo":"Adicional/Mejoras","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Cristina del Carmen Piamo Calzadilla","conyuge_cedula":"15336800","conyuge_trabaja_pdvsa":"Trabajó / Está Retirado(a)","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"44 Años","cedula":"15336800","nombres":"Cristina del Carmen Piamo Calzadilla","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Trabajó / Está Retirado(a)","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1982-04-12","vive_con_trabajador":"Sí"},{"edad":"74 Años","cedula":"4038565","nombres":"Pedro Rafael Salazar Morante","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1952-02-22","vive_con_trabajador":"No"},{"edad":"70 Años","cedula":"4945725","nombres":"Mary Magdalena González Alcalá","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1956-03-28","vive_con_trabajador":"No"},{"edad":"12 Años","cedula":"36351057","nombres":"Fernanda Cristina Salazar Piamo","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2014-01-31","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"Del 25 al 29 -11-2012","horas":"32","lugar":"Universidad de los Andes","titulo":"Xiii Escuela Venezolana para la Enseñanza de la Química"},{"fecha":"Del 10 al 14-11-2013","horas":"32","lugar":"Universidad de los Andes","titulo":"Xiv Escuela Venezolana para la Enseñanza de la Química"},{"fecha":"Del 13 al 18 de junio de 2010","horas":"18","lugar":"Universidad de los Andes","titulo":"Xi Escuela Venezolana para la Enseñanza de la Química"},{"fecha":"08. -06 - 2007","horas":"8","lugar":"Upel - Ipm","titulo":"Como Enseñar a Resolver Problemas de Química"},{"fecha":"28-06-2007","horas":"8","lugar":"Upel - Ipm","titulo":"Ii Foro de Bioinorgánica"},{"fecha":"12-07-2008","horas":"8","lugar":"Upel -ipm","titulo":"I Jornada de Ciencias de la Tierra"},{"fecha":"20-02-2008","horas":"8","lugar":"Upel -ipm","titulo":"I Foto de Química Inorgánica"},{"fecha":"26-02-2008","horas":"8","lugar":"Upel Ipm","titulo":"Ii Conversatorio de Química Ambiental"},{"fecha":"Del 02 al 04-04-2008","horas":"18","lugar":"Upel-ipm","titulo":"Iv Jornada Nor-oriental para la Enseñanza de la Física y Iii Jornada de Astronomia"},{"fecha":"13-07-2005","horas":"8","lugar":"Upel-ipm","titulo":"I Foto de Bioinorgánica: Química del Cuerpo Humano"},{"fecha":"11-07-2006","horas":"8","lugar":"Upel- -ipm","titulo":"I Foto de Aplicaciones Industriales de la Química Organometálica"},{"fecha":"Del 05 al 09-11-2007","horas":"24","lugar":"Universidad de los Andes","titulo":"Ix Escuela Venezolana para la Enseñanza de la Química"},{"fecha":"Del 03 al  07 - 11-2008","horas":"32","lugar":"Universidad de los Andes","titulo":"X Escuela Venezolana para la Enseñanza de la Química"},{"fecha":"Del 11 al 15 -12- 2006","horas":"32","lugar":"Universidad de los Andes","titulo":"Viii Escuela Venezolana para la Enseñanza de la Química"},{"fecha":"Del 26 al 27 de Septiembre","horas":"32","lugar":"Del 25","titulo":"Taller: Economía,energía y Ambiente"},{"fecha":"25 y 26 -03-2014","horas":"16","lugar":"Pdvsa","titulo":"Procesos de Transformación de la Cultura Escolar Bajo el Enfoque de la Didáctica Crítica"},{"fecha":"17 al 19-09-2014","horas":"24","lugar":"Pdvsa","titulo":"Evaluación Liberadora"},{"fecha":"14 al 18 -09-2015","horas":"40","lugar":"Pdvsa","titulo":"Coaching Educativa Bu"},{"fecha":"23-07-2008","horas":"8","lugar":"Upel- - Ipm","titulo":"Ii Jornadas de Ciencias de la Tierra"},{"fecha":"17-06-2009","horas":"8","lugar":"Upel- -ipm","titulo":"Iii Jornadas de Ciencias de la Tierra"},{"fecha":"28-07-2009","horas":"8","lugar":"Upel- Ipm","titulo":"Iv Jornadas de Ciencias de la Tierra"},{"fecha":"Del 27 al 30 -03-2014","horas":"16","lugar":"Universidad de Carabobo - Universidad de los Andes","titulo":"Iii Congreso Internacional de Educación"}]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Paquetería Ofimática (Word, Excel, PowerPoint/Libres)","categoria":"Tecnología Educativa (EdTech)"},{"nivel":"Intermedio","titulo":"Liderazgo Pedagógico: Inspirar sin Autoritarismo","categoria":"Gestión y Liderazgo Educativo"},{"nivel":"Básico","titulo":"Design Thinking para Innovación Educativa","categoria":"Innovación y Desarrollo Profesional"},{"nivel":"Básico","titulo":"Prevención del Burnout Docente: Autocuidado Profesional","categoria":"Innovación y Desarrollo Profesional"},{"nivel":"Básico","titulo":"Comunicación Asertiva y Resolución de Conflictos","categoria":"Gestión y Liderazgo Educativo"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Juan Enrique Zambrano Rondón
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '14110180',
  'Juan Enrique Zambrano Rondón',
  'Docente',
  'lb',
  'jezr24679@gmail.com',
  '04249717566',
  '14110180', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '14110180',
  'Masculino',
  '1979-06-24',
  'Casado/a',
  'Monterrey 1, Casa 189, Parroquia Boquerón',
  'Licenciado en Educación Integral Mención Ciencias Naturales',
  'Licenciatura / Profesorado',
  'Universidad Nacional Experimental Simón Rodríguez',
  2012,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"","talla_braga":"","talla_camisa":"","talla_calzado":"","talla_chemise":"","emergencia_tel":"","talla_pantalon":"","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"","emergencia_nombre":""}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Escuela Manola Luna Silva"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Norkys Karyny Hernández Machuca","conyuge_cedula":"14703374","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"46 Años","cedula":"14703374","nombres":"Norkys Karyny Hernández Machuca","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1979-09-05","vive_con_trabajador":"Sí"},{"edad":"9 Años","cedula":"","nombres":"Juan Miguel Zambrano Hernández","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2016-12-23","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Básico","titulo":"Edición de Videos Educativos","categoria":"Tecnología Educativa (EdTech)"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Karina Del Valle Barreto
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '13092755',
  'Karina Del Valle Barreto',
  'Docente',
  'lb',
  'Karinabarreto2809@gmail.com',
  '04161948996',
  '13092755', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '13092755',
  'Femenino',
  '1975-09-28',
  'Divorciado/a',
  'Vía a Quiriquire, Campo Miraflores',
  'Prof Geohistoria',
  'Licenciatura / Profesorado',
  'Upel-ipm',
  2002,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"39","talla_braga":"46","talla_camisa":"XL","talla_calzado":"38","talla_chemise":"XL","emergencia_tel":"04249327017","talla_pantalon":"44","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Alergias Ambientales /asma","emergencia_nombre":"Mickaoll Salazar"}'::jsonb,
  '{"estado":"Monagas","municipio":"Punceres","parroquia":"Cachipo","centro_votacion":"Ue Libertador Bolívar"}'::jsonb,
  '{"tipo_prestamo":"Adicional/Adquisición","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"2) Habita en condición de arrimado, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"20 Años","cedula":"32213450","nombres":"Mickaoll Alejandro Salazar Barreto","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2005-12-28","vive_con_trabajador":"Sí"},{"edad":"13 Años","cedula":"34799411","nombres":"Alejandra Karina Salazar Barreto","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2012-07-24","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"2010","horas":"400","lugar":"Universidad del Zulia","titulo":"Diplomado: Orientación Integral de la Conducta"}]'::jsonb,
  '[]'::jsonb,
  'Excel y Diseño Gráfico'
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Yadelsi Carolina Peinado Jiménez
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '15044802',
  'Yadelsi Carolina Peinado Jiménez',
  'Docente',
  'lb',
  'yadelsipeinado10@gmail.com',
  '04262927664',
  '15044802', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '15044802',
  'Femenino',
  '1982-01-10',
  'Soltero/a',
  'Av. José Tadeo Monagas. Residencias los Alpes',
  'Profesora de Biología',
  'Licenciatura / Profesorado',
  'Upel',
  2006,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"40","talla_braga":"40","talla_camisa":"M","talla_calzado":"39","talla_chemise":"M","emergencia_tel":"04148575104","talla_pantalon":"32","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Asma, Rinitis, Alergias","emergencia_nombre":"Sebastián Hércules"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Boquerón","centro_votacion":"Eb Carmen Hernández de Milano"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"16 Años","cedula":"33832710","nombres":"Sebastián Hércules","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurodivergente","fecha_nacimiento":"2009-12-10","vive_con_trabajador":"Sí"},{"edad":"68 Años","cedula":"8358866","nombres":"Olivia Josefina Jiménez","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"","condicion_neuro":"Neurotípico","fecha_nacimiento":"1957-07-04","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Paquetería Ofimática (Word, Excel, PowerPoint/Libres)","categoria":"Tecnología Educativa (EdTech)"},{"nivel":"Básico","titulo":"Comunicación Asertiva y Resolución de Conflictos","categoria":"Gestión y Liderazgo Educativo"},{"nivel":"Básico","titulo":"Estrategias para la Neurodiversidad en el Aula","categoria":"Educación Inclusiva y Diversidad"},{"nivel":"Básico","titulo":"Oratoria y Comunicación Efectiva para Educadores","categoria":"Innovación y Desarrollo Profesional"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Eliana Lizkeira González Plaza
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '17546584',
  'Eliana Lizkeira González Plaza',
  'Docente',
  'lb',
  'elianagp2601@gmail.com',
  '04121275548',
  '17546584', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '17546584',
  'Femenino',
  '1986-01-26',
  'Casado/a',
  'Calle Principal del Barrio Morichal Casa 70-c',
  'Profesora de Inglés',
  'Licenciatura / Profesorado',
  'Upel-ipm',
  2009,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"38","talla_braga":"36","talla_camisa":"M","talla_calzado":"38","talla_chemise":"M","emergencia_tel":"04121942994","talla_pantalon":"30","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Rinitis Alérgica/polvo, Humo, Químicos","emergencia_nombre":"Randy Pérez"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Escuela Básica Juan Francisco Mila de la Roca"}'::jsonb,
  '{"tipo_prestamo":"Adicional/Mejoras","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Randy Perez","conyuge_cedula":"14111920","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"61 Años","cedula":"9280006","nombres":"Marisol Plaza","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1964-06-09","vive_con_trabajador":"No"},{"edad":"46 Años","cedula":"14111920","nombres":"Randy Perez","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1979-05-12","vive_con_trabajador":"Sí"},{"edad":"7 Años","cedula":"","nombres":"Victoria Pérez","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2019-03-29","vive_con_trabajador":"Sí"},{"edad":"1 Años","cedula":"","nombres":"Amira Perez","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"No Escolarizado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2024-11-17","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Básico","titulo":"Automatización de Tareas Docentes con IA","categoria":"Tecnología Educativa (EdTech)"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Patricia Carolina Díaz Molina
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '19080636',
  'Patricia Carolina Díaz Molina',
  'Docente',
  'lb',
  'prof.patriciadiaz88@gmail.com',
  '04169900981',
  '19080636', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '19080636',
  'Femenino',
  '1989-08-08',
  'Soltero/a',
  'Tipuro, Parroquia Boquerón',
  'Profesora en Educación Especial Mención Dificultad en el Aprendizaje',
  'Licenciatura / Profesorado',
  'Upel',
  2012,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"40","talla_braga":"36","talla_camisa":"M","talla_calzado":"39","talla_chemise":"M","emergencia_tel":"04249405628","talla_pantalon":"34","condicion_neuro":"Neurotípico","grupo_sanguineo":"A+","condicion_medica":"Ninguna","emergencia_nombre":"Hermano"}'::jsonb,
  '{"estado":"Monagas","municipio":"Punceres","parroquia":"Cachipo","centro_votacion":"Colegio Privado San Martín"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":2,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"3) Habita en condición de alquiler, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"70 Años","cedula":"5669121","nombres":"Esperanza Molina","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1955-06-28","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Inteligencia Artificial para el Aula","categoria":"Tecnología Educativa (EdTech)"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Fernanda Elisama López Carrasquero
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '16699098',
  'Fernanda Elisama López Carrasquero',
  'Docente',
  'lb',
  'profafernandalopez@gmail.com',
  '04249554985',
  '16699098', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '16699098',
  'Femenino',
  '1983-10-10',
  'Casado/a',
  'Bello Campo, Av Viboral, Parroquia Boquerón',
  'Educación Inicial',
  'Licenciatura / Profesorado',
  'Licenciado en Educación',
  2010,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"","talla_braga":"","talla_camisa":"","talla_calzado":"","talla_chemise":"","emergencia_tel":"","talla_pantalon":"","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"","emergencia_nombre":""}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Santa Cruz","centro_votacion":"Carmen Douglas"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Daniel Enrique Cedeño Zapata","conyuge_cedula":"12792653","conyuge_trabaja_pdvsa":"Trabajador(a) Activo(a)","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"51 Años","cedula":"12792653","nombres":"Daniel Enrique Cedeño Zapata","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Trabajador(a) Activo(a)","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1974-12-29","vive_con_trabajador":"Sí"},{"edad":"77 Años","cedula":"3047346","nombres":"Alida Lexaida Carrasquero Ibarra","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1948-11-10","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"2000","horas":"40","lugar":"A Weil. Ciudad Guayana","titulo":"Computación Básica, Manejo Windows"}]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Evaluación Formativa con Retroalimentación Efectiva","categoria":"Evaluación y Medición del Aprendizaje"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Minerva Josefina Martín Guzmán
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '14531830',
  'Minerva Josefina Martín Guzmán',
  'Docente',
  'lb',
  'martinminerva2@gmail.com',
  '04126072678',
  '14531830', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '14531830',
  'Femenino',
  '1980-01-02',
  'Casado/a',
  'Urbanización Juana la Avanzadora, Parroquia la Cruz',
  'Profesor. Especialidad Educación Inicial.',
  'Licenciatura / Profesorado',
  'Upel-ipm',
  2009,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"","talla_braga":"","talla_camisa":"","talla_calzado":"","talla_chemise":"","emergencia_tel":"","talla_pantalon":"","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"","emergencia_nombre":""}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"San Simón","centro_votacion":"Jardín de Infancia Carmen Verónica Coello"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":2,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"6 Años","cedula":"","nombres":"Emir Tineo","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Inicial","condicion_neuro":"Neurotípico","fecha_nacimiento":"2020-03-01","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Romina Del Valle Ruiz
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '18174495',
  'Romina Del Valle Ruiz',
  'Docente',
  'lb',
  'Romina.dvruiz13@gmail.com',
  '04249020993',
  '18174495', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '18174495',
  'Femenino',
  '1986-02-13',
  'Soltero/a',
  'Urbanización Juana la Avanzadora, Parroquia la Cruz',
  'Profesora Educación Inicial',
  'Licenciatura / Profesorado',
  'Upel',
  2012,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"39","talla_braga":"38","talla_camisa":"L","talla_calzado":"39","talla_chemise":"L","emergencia_tel":"04163979908","talla_pantalon":"30","condicion_neuro":"Neurotípico","grupo_sanguineo":"A+","condicion_medica":"Ninguna","emergencia_nombre":"Luis Looez"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Santa Cruz","centro_votacion":"La Llovizna Ue Padre Juan Suria"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":2,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"","prioridad":""}'::jsonb,
  '[{"edad":"17 Años","cedula":"32984014","nombres":"Ricardo Alfonso Lopez Ruiz","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2008-07-11","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"Marzo del 2009","horas":"12","lugar":"Maturin","titulo":"Atención de Trastornos Generalizados del Desarrollo"},{"fecha":"Agosto 2012","horas":"48","lugar":"Lecheria","titulo":"Formación de Psico- Educadora"}]'::jsonb,
  '[{"nivel":"Avanzado","titulo":"Aprendizaje Servicio: Conectar Aula y Comunidad","categoria":"Formación Pedagógica y Didáctica"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Marinellys Coromoto Rondón Villarroel
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '17092720',
  'Marinellys Coromoto Rondón Villarroel',
  'Docente',
  'lb',
  'marinellys83@gmail.com',
  '04261871200',
  '17092720', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '17092720',
  'Femenino',
  '1983-05-29',
  'Casado/a',
  'Urbanización el Faro. Calle Interna #5. Casa # 152',
  'Licenciada en Educación Integral.',
  'Licenciatura / Profesorado',
  'Universidad Nacional Experimental Simón Rodríguez.',
  2007,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"42","talla_braga":"40","talla_camisa":"XXL","talla_calzado":"39","talla_chemise":"XL","emergencia_tel":"04167970615","talla_pantalon":"44","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"","emergencia_nombre":"Jorge Pérez"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"San Simón","centro_votacion":"U.e. Isabel Padrino de Campos"}'::jsonb,
  '{"tipo_prestamo":"Adicional/Mejoras","num_convivientes":5,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Jorge Luis Pérez Guaina","conyuge_cedula":"16722404","conyuge_trabaja_pdvsa":"Trabajador(a) Activo(a)","condicion_habitabilidad":"1) Habita en condición de hacinamiento, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"79 Años","cedula":"3327875","nombres":"Roberto José Rondón Nuñez","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1947-04-03","vive_con_trabajador":"Sí"},{"edad":"42 Años","cedula":"16722404","nombres":"Jorge Luis Pérez Guaina","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Trabajador(a) Activo(a)","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1984-04-23","vive_con_trabajador":"Sí"},{"edad":"8 Años","cedula":"11817092720","nombres":"José Andrés Pérez Rondón","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2018-02-16","vive_con_trabajador":"Sí"},{"edad":"5 Años","cedula":"12017092720","nombres":"Andrea Victoria Pérez Rondón","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Inicial","condicion_neuro":"Neurotípico","fecha_nacimiento":"2020-05-05","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Básico","titulo":"Investigación-Acción en el Aula: Mejora Continua","categoria":"Innovación y Desarrollo Profesional"},{"nivel":"","titulo":"Pedagogía de la Pregunta: Fomentar la Curiosidad","categoria":"Formación Pedagógica y Didáctica"},{"nivel":"Básico","titulo":"Edición de Videos Educativos","categoria":"Tecnología Educativa (EdTech)"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Milagros Del Carmen Martínez Malpica
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '17113644',
  'Milagros Del Carmen Martínez Malpica',
  'Docente',
  'lb',
  'martinezmilagros.2911@gmail.com',
  '04122980380',
  '17113644', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '17113644',
  'Femenino',
  '1984-11-13',
  'Soltero/a',
  'Calle Principal la Palencia, Rancho Azucarito',
  'No registrado',
  'No registrado',
  'No registrada',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"36","talla_braga":"38","talla_camisa":"L","talla_calzado":"36","talla_chemise":"L","emergencia_tel":"04249287920","talla_pantalon":"38","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Alérgica a los Aines, Irritación en el Lado Parietal Izquierdo del Cerebro Desde Nacimiento y con Medicación por la Misma","emergencia_nombre":"Luisa Fermín"}'::jsonb,
  '{"estado":"Monagas","municipio":"Bolívar","parroquia":"Caripito","centro_votacion":"Lizandro Alvarado"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":1,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"","prioridad":""}'::jsonb,
  '[{"edad":"63 Años","cedula":"8936791","nombres":"Julio Martínez","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1963-04-02","vive_con_trabajador":"No"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Yudercy Alejandra Marcano Gallardo
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '15631248',
  'Yudercy Alejandra Marcano Gallardo',
  'Docente',
  'lb',
  NULL,
  NULL,
  '15631248', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '15631248',
  'Femenino',
  '1985-01-01',
  'Soltero/a',
  'No registrada',
  'No registrado',
  'No registrado',
  'No registrada',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"","talla_braga":"","talla_camisa":"","talla_calzado":"","talla_chemise":"","emergencia_tel":"","talla_pantalon":"","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"","emergencia_nombre":""}'::jsonb,
  '{"estado":"Monagas","municipio":"","parroquia":"","centro_votacion":""}'::jsonb,
  '{"tipo_prestamo":"","num_convivientes":1,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"","prioridad":""}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Yohandri Del Carmen Rondón García
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '22725746',
  'Yohandri Del Carmen Rondón García',
  'Docente',
  'lb',
  'yohandrirondon56@gmail.com',
  '04121030345',
  '22725746', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '22725746',
  'Femenino',
  '1993-01-29',
  'Concubino/a',
  'Urbanización los Apamates Condominio C, Calle8 Casa 144',
  'Profesora Especialista de Física',
  'Licenciatura / Profesorado',
  'Universidad Pedagógica Experimental Antonio Lira Alcalá',
  2018,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"38","talla_braga":"38","talla_camisa":"L","talla_calzado":"38","talla_chemise":"L","emergencia_tel":"04249221234","talla_pantalon":"36","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"","emergencia_nombre":"04126894169"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"U. e Francisco Verde"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"José Rafael González Idrogo","conyuge_cedula":"24504332","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"3) Habita en condición de alquiler, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"7 Años","cedula":"11822725746","nombres":"Anabella Valentina González Rondón","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2018-09-10","vive_con_trabajador":"Sí"},{"edad":"29 Años","cedula":"24504332","nombres":"José Rafael González Idrogo","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1996-06-21","vive_con_trabajador":"Sí"},{"edad":"57 Años","cedula":"9901530","nombres":"Carmen Ramona Garcia","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1968-11-15","vive_con_trabajador":"No"},{"edad":"55 Años","cedula":"11335232","nombres":"Jose Miguel Mendoza","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1970-12-22","vive_con_trabajador":"No"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: José Aly Jiménez Angulo
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '19080588',
  'José Aly Jiménez Angulo',
  'Docente',
  'lb',
  'josealy@gmail.com',
  '04224891518',
  '19080588', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '19080588',
  'Masculino',
  '1989-02-11',
  'Concubino/a',
  'Urbanización el Abanico, Carrera 3, Casa 27',
  'Profesor de Matemáticas',
  'Licenciatura / Profesorado',
  'Upel',
  2011,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"42","talla_braga":"38","talla_camisa":"XL","talla_calzado":"42","talla_chemise":"XL","emergencia_tel":"04122406062","talla_pantalon":"38","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Ninguna","emergencia_nombre":"Eylling González"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Ueb Mario Briceño Irragory"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":5,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Eylling Keyrovick González Yanez","conyuge_cedula":"18075785","conyuge_trabaja_pdvsa":"Trabajador(a) Activo(a)","condicion_habitabilidad":"2) Habita en condición de arrimado, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"0 Años","cedula":"","nombres":"Liam Alejandro Jiménez González","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"No Escolarizado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2025-07-21","vive_con_trabajador":"Sí"},{"edad":"77 Años","cedula":"4024012","nombres":"Violeta del Carmen Angulo Malave","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1949-03-05","vive_con_trabajador":"Sí"},{"edad":"78 Años","cedula":"3730798","nombres":"Aly José Jiménez","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1948-01-11","vive_con_trabajador":"Sí"},{"edad":"41 Años","cedula":"18075785","nombres":"Eylling Keyrovick González Yanez","conapdis":"No","parentesco":"Concubino(a)","estatus_pdvsa":"Trabajador(a) Activo(a)","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1985-04-20","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Apoyo a Estudiantes con Altas Capacidades","categoria":"Educación Inclusiva y Diversidad"},{"nivel":"Intermedio","titulo":"Creación de Contenidos Digitales Interactivos","categoria":"Tecnología Educativa (EdTech)"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Eylling Keyrovick González Yanez
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '18075785',
  'Eylling Keyrovick González Yanez',
  'Docente',
  'lb',
  'eylling1990@gmail.com',
  '04122406062',
  '18075785', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '18075785',
  'Femenino',
  '1985-04-20',
  'Concubino/a',
  'Urbanización el Abanico, Carrea 3 Casa 27 Parroquia Altos de los Godos',
  'Técnico en Educación Integral',
  'TSU',
  'Iutirla',
  2008,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"35","talla_braga":"36","talla_camisa":"M","talla_calzado":"36","talla_chemise":"M","emergencia_tel":"04224891518","talla_pantalon":"28","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Alérgica a los Aines, Medicamentos para la Tensión , Diclofenac e Ibuprofeno, Asa, Metamizol y Algunas Anestesia.","emergencia_nombre":"José Aly Jiménez"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"U.e.b. \"mario Briceño Iragorry\""}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"José Aly Jiménez Angulo","conyuge_cedula":"19080588","conyuge_trabaja_pdvsa":"Trabajador(a) Activo(a)","condicion_habitabilidad":"2) Habita en condición de arrimado, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"0 Años","cedula":"Sc","nombres":"Liam Alejandro Jiménez González","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"No Escolarizado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2025-07-21","vive_con_trabajador":"Sí"},{"edad":"71 Años","cedula":"6067653","nombres":"Carmen Teresa Yanez","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1955-04-03","vive_con_trabajador":"Sí"},{"edad":"37 Años","cedula":"19080588","nombres":"José Aly Jiménez Angulo","conapdis":"No","parentesco":"Concubino(a)","estatus_pdvsa":"Trabajador(a) Activo(a)","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1989-02-11","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Neida Margarita García Arenas
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '12067865',
  'Neida Margarita García Arenas',
  'Docente',
  'lb',
  'limeva1321@gmail.com',
  '04149989327',
  '12067865', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '12067865',
  'Femenino',
  '1974-06-11',
  'Divorciado/a',
  'Residencias la Trinidad, Avenida Juncal, Maturin',
  'Educación Integral',
  'Licenciatura / Profesorado',
  'Universidad Bolivariana de Venezuela',
  2007,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"","talla_braga":"","talla_camisa":"","talla_calzado":"","talla_chemise":"","emergencia_tel":"","talla_pantalon":"","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"","emergencia_nombre":""}'::jsonb,
  '{"estado":"Monagas","municipio":"Punceres","parroquia":"Cachipo","centro_votacion":"U.e. Leonardo Ruíz Pineda"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"","prioridad":""}'::jsonb,
  '[{"edad":"22 Años","cedula":"30198265","nombres":"Melanie Natasha Rojas García","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2004-02-21","vive_con_trabajador":"Sí"},{"edad":"70 Años","cedula":"6008138","nombres":"Noris Mercedes Arenas Villalobos","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1955-10-21","vive_con_trabajador":"Sí"},{"edad":"22 Años","cedula":"30198266","nombres":"Vanessa Paola Rojas García","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2004-02-21","vive_con_trabajador":"No"},{"edad":"25 Años","cedula":"28080586","nombres":"Lina Michelle Rojas García","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2000-12-13","vive_con_trabajador":"No"}]'::jsonb,
  '[{"fecha":"01/04/2011","horas":"12","lugar":"Ceoca","titulo":"Hiperactividad y Déficit de Atención"},{"fecha":"29/04/2011","horas":"12","lugar":"Ceoca","titulo":"Maltrato Infantil"}]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Creación de Contenidos Digitales Interactivos","categoria":"Tecnología Educativa (EdTech)"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Martín Eduardo Marcano
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '17241569',
  'Martín Eduardo Marcano',
  'Docente',
  'lb',
  'marcanom05@gmail.com',
  '04129429171',
  '17241569', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '17241569',
  'Masculino',
  '1984-11-16',
  'Soltero/a',
  'Urbanización los Apamates B, Calle 3, Casa #58',
  'Profesor de Matemáticas',
  'Licenciatura / Profesorado',
  'Upel -ipm',
  2008,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"41","talla_braga":"36","talla_camisa":"S","talla_calzado":"41","talla_chemise":"S","emergencia_tel":"04249416336","talla_pantalon":"28","condicion_neuro":"Neurotípico","grupo_sanguineo":"A+","condicion_medica":"","emergencia_nombre":"Teresa Cortez"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"La Pica","centro_votacion":"Creación la Pica"}'::jsonb,
  '{"tipo_prestamo":"","num_convivientes":5,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Teresa Cortez","conyuge_cedula":"16710908","conyuge_trabaja_pdvsa":"Trabajador(a) Activo(a)","condicion_habitabilidad":"1) Habita en condición de hacinamiento, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"43 Años","cedula":"16710908","nombres":"Teresa Cortez","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Trabajador(a) Activo(a)","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1982-11-28","vive_con_trabajador":"Sí"},{"edad":"13 Años","cedula":"34798757","nombres":"Angélica Marcano","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2012-06-25","vive_con_trabajador":"Sí"},{"edad":"8 Años","cedula":"","nombres":"Victoria Marcano","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2017-09-06","vive_con_trabajador":"Sí"},{"edad":"56 Años","cedula":"11338335","nombres":"Jenny Marcano","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1969-06-02","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Creación de Contenidos Digitales Interactivos","categoria":"Tecnología Educativa (EdTech)"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Nohely Soribel González Trejo
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '22720162',
  'Nohely Soribel González Trejo',
  'Docente',
  'lb',
  'gnohely094@gmail.com',
  '04148637262',
  '22720162', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '22720162',
  'Femenino',
  '1994-05-02',
  'Casado/a',
  'Sector José Antonio Páez. Calle 1. Casa 23',
  'Profesora de Lengua y Literatura',
  'Licenciatura / Profesorado',
  'Upel-ipmala',
  2017,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"38","talla_braga":"36","talla_camisa":"L","talla_calzado":"38","talla_chemise":"L","emergencia_tel":"04248557451","talla_pantalon":"34","condicion_neuro":"Neurotípico","grupo_sanguineo":"A+","condicion_medica":"","emergencia_nombre":"Esposo 04248557451/ Madre 04249198963"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Boquerón","centro_votacion":"Escuela Profa. María Teresa Gómez. Antes Menca de Leoni"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":2,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Manuel José Figueroa Lezama","conyuge_cedula":"19537194","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"58 Años","cedula":"11186341","nombres":"Nelda Zoraida Trejo","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1968-02-29","vive_con_trabajador":"No"},{"edad":"55 Años","cedula":"11339366","nombres":"Noel González la Rosa","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1970-09-18","vive_con_trabajador":"No"},{"edad":"36 Años","cedula":"19537194","nombres":"Manuel José Figueroa Lezama","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"","condicion_neuro":"Neurotípico","fecha_nacimiento":"1989-11-28","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"Abril 2015","horas":"16","lugar":"Upel (universidad Pedagógica Experimental Libertador)","titulo":"Estrategias para la Redacción de Textos Argumentativos… la Lectura Como Eje Central en la Formación Docente."},{"fecha":"Noviembre-2013","horas":"24","lugar":"Universidad Pedagógica Experimental Libertador","titulo":"Xxxiv Simposio de Docentes Investigadores de Literatura Venezolana."},{"fecha":"Noviembre-2013","horas":"16","lugar":"Universidad Pedagógica Experimental Libertador","titulo":"Rescate de Juegos Tradicionales, Deportivos y Cognitivos Como Herramienta Pedagógica."}]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Gestión de Aulas Virtuales con LMS","categoria":"Tecnología Educativa (EdTech)"},{"nivel":"Intermedio","titulo":"Programación Neurolingüística (PNL) en el Aula","categoria":"Gestión y Liderazgo Educativo"},{"nivel":"Avanzado","titulo":"Mentoría entre Pares y Comunidades de Aprendizaje","categoria":"Innovación y Desarrollo Profesional"},{"nivel":"Avanzado","titulo":"Gamificación Educativa: Motivación con Propósito","categoria":"Formación Pedagógica y Didáctica"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: María Alejandra Martínez Cabrera
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '20310911',
  'María Alejandra Martínez Cabrera',
  'Docente',
  'lb',
  'martinezmamc29@gmail.com',
  '04222031091',
  '20310911', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '20310911',
  'Femenino',
  '1990-10-18',
  'Soltero/a',
  'Las Carolinas Calle 2 Casa 32',
  'Profesora en Dificultades del Aprendizaje',
  'Licenciatura / Profesorado',
  'Instituto Pedagógico de Maturin',
  2009,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"39","talla_braga":"36","talla_camisa":"XL","talla_calzado":"38","talla_chemise":"XL","emergencia_tel":"04222031091","talla_pantalon":"28","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Ninguna","emergencia_nombre":"Mamá"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Jardín I Fantil Adriana de Sequera"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"3) Habita en condición de alquiler, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"11 Años","cedula":"36249054","nombres":"Aarón Eduardo García Martinez","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2014-07-23","vive_con_trabajador":"Sí"},{"edad":"10 Años","cedula":"36843721","nombres":"Ezequiel Alejandro García Martinez","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2015-08-18","vive_con_trabajador":"Sí"},{"edad":"58 Años","cedula":"9726688","nombres":"Irama Josefina Cabrera Martinez","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1967-09-18","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Liderazgo Pedagógico: Inspirar sin Autoritarismo","categoria":"Gestión y Liderazgo Educativo"}]'::jsonb,
  'Psicopedagogia'
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Luisa José Jiménez Nuñez
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '17723779',
  'Luisa José Jiménez Nuñez',
  'Docente',
  'lb',
  'luisajimenezn27@gmail.com',
  '04147701960',
  '17723779', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '17723779',
  'Femenino',
  '1987-04-27',
  'Casado/a',
  'Urbanización Valle Grande Country,condominio Timotes, Casa 5.5',
  'Profesora de Educación Especial- Mención Dificultad de Aprendizaje',
  'Licenciatura / Profesorado',
  'Upel-ipm',
  2012,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"37","talla_braga":"38","talla_camisa":"M","talla_calzado":"37","talla_chemise":"M","emergencia_tel":"04249193875","talla_pantalon":"30","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"","emergencia_nombre":"Esposo Manuel"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Santa Cruz","centro_votacion":"Escuela Básica Caripe"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Manrique Manuel Alejandro","conyuge_cedula":"16691883","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"6) Habita en vivienda prestada, bajo su cuidado.","prioridad":""}'::jsonb,
  '[{"edad":"6 Años","cedula":"","nombres":"Manrique Jiménez Alba Manrique","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Inicial","condicion_neuro":"Neurotípico","fecha_nacimiento":"2020-01-11","vive_con_trabajador":"Sí"},{"edad":"42 Años","cedula":"16691883","nombres":"Manrique Manuel Alejandro","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1983-10-17","vive_con_trabajador":"Sí"},{"edad":"8 Años","cedula":"","nombres":"Manrique Jiménez Diego Jesús","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2017-07-14","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Básico","titulo":"Sensibilización sobre Discapacidad Invisible","categoria":"Educación Inclusiva y Diversidad"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Yasivit Del Valle González Guisseppi
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '18788707',
  'Yasivit Del Valle González Guisseppi',
  'Docente',
  'lb',
  'gonzalezyasivit@gmail.com',
  '04126067512',
  '18788707', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '18788707',
  'Femenino',
  '1987-12-26',
  'Concubino/a',
  'Conjunto Residencial Valle Grande Country, Condomio Frailejones, Manzana 25, Casa 1, Zona Industrial.',
  'Profesor de Química',
  'Licenciatura / Profesorado',
  'Upel-ipm',
  2010,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"40","talla_braga":"42","talla_camisa":"XL","talla_calzado":"40","talla_chemise":"XL","emergencia_tel":"04147778899","talla_pantalon":"40","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"","emergencia_nombre":"Jesús Manuel Rivas Castro"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Cei Josefa Camejo."}'::jsonb,
  '{"tipo_prestamo":"Adicional/Mejoras","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Jesús Manuel Rivas Castro","conyuge_cedula":"13564789","conyuge_trabaja_pdvsa":"Trabajador(a) Activo(a)","condicion_habitabilidad":"","prioridad":""}'::jsonb,
  '[{"edad":"46 Años","cedula":"13564789","nombres":"Jesús Manuel Rivas Castro","conapdis":"No","parentesco":"Concubino(a)","estatus_pdvsa":"Trabajador(a) Activo(a)","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1980-04-12","vive_con_trabajador":"Sí"},{"edad":"6 Años","cedula":"","nombres":"Gabriela Alejandra Rivas González","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Inicial","condicion_neuro":"Neurotípico","fecha_nacimiento":"2020-05-15","vive_con_trabajador":"Sí"},{"edad":"8 Años","cedula":"","nombres":"Daniel Eduardo Rivas González","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2018-08-22","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Virginia Adrudis Aguilera
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '18463516',
  'Virginia Adrudis Aguilera',
  'Docente',
  'lb',
  'avirginia0711@gmail.com',
  '04249202587',
  '18463516', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '18463516',
  'Femenino',
  '1987-11-07',
  'Concubino/a',
  'Final Avenida los Próceres, Urbanización Villas de la Laguna, Casa 133',
  'Profesor de Inglés',
  'Licenciatura / Profesorado',
  'Upel - Ipm',
  2011,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"38","talla_braga":"40","talla_camisa":"L","talla_calzado":"38","talla_chemise":"L","emergencia_tel":"04166888893","talla_pantalon":"34","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"","emergencia_nombre":"Luis Sánchez"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Boquerón","centro_votacion":"Escuela Luisa Teresa Sosa"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":5,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Luis Alberto Sánchez Bermúdez","conyuge_cedula":"14543609","conyuge_trabaja_pdvsa":"Trabajador(a) Activo(a)","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"69 Años","cedula":"7879313","nombres":"Mirian Mercedes Vallenilla Aguilera","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"No Escolarizado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1957-03-26","vive_con_trabajador":"No"},{"edad":"47 Años","cedula":"14543609","nombres":"Luis Alberto Sánchez Bermúdez","conapdis":"No","parentesco":"Concubino(a)","estatus_pdvsa":"Trabajador(a) Activo(a)","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1979-04-07","vive_con_trabajador":"Sí"},{"edad":"15 Años","cedula":"33833563","nombres":"Sebastian Asdrúbal Sánchez Aguilera","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2010-12-09","vive_con_trabajador":"Sí"},{"edad":"12 Años","cedula":"34855343","nombres":"Luis Santiago Sánchez Aguilera","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2013-07-09","vive_con_trabajador":"Sí"},{"edad":"9 Años","cedula":"37516563","nombres":"Salvador Ignacio Sánchez Aguilera","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2016-09-22","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Básico","titulo":"Creación de Contenidos Digitales Interactivos","categoria":"Tecnología Educativa (EdTech)"}]'::jsonb,
  'Paquetería Ofimática'
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Daniela Carolina Pernia Henríquez
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '22714341',
  'Daniela Carolina Pernia Henríquez',
  'Docente',
  'lb',
  'perniadn@gmail.com',
  '04269634633',
  '22714341', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '22714341',
  'Femenino',
  '1994-05-06',
  'Soltero/a',
  'Pueblo Nuevo I de Quiriquire, Calle Nueva, Casa 13',
  'Profesora de Lengua y Literatura',
  'Licenciatura / Profesorado',
  'Upel-ipm',
  2018,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"40","talla_braga":"38","talla_camisa":"S","talla_calzado":"40","talla_chemise":"S","emergencia_tel":"04249056698","talla_pantalon":"30","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Comidas, Topicas","emergencia_nombre":"04261861231"}'::jsonb,
  '{"estado":"Monagas","municipio":"Punceres","parroquia":"Quiriquire","centro_votacion":"Escuela Básica Barquisimeto"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"1) Habita en condición de hacinamiento, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"62 Años","cedula":"9242063","nombres":"Pedro Pernia","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1964-03-03","vive_con_trabajador":"Sí"},{"edad":"55 Años","cedula":"11013486","nombres":"María Teresa Henriquez de Pernia","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1971-02-24","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Avanzado","titulo":"Oratoria y Comunicación Efectiva para Educadores","categoria":"Innovación y Desarrollo Profesional"}]'::jsonb,
  'Cursos de Inteligencia Emocional'
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Vanessa del Valle Urrieta Alexander
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '19415615',
  'Vanessa del Valle Urrieta Alexander',
  'Docente',
  'lb',
  'vaneurrieta7@gmail.com',
  '04161818173',
  '19415615', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '19415615',
  'Femenino',
  '1990-01-07',
  'Casado/a',
  'Tropical Vía Nacional de Caripito',
  'Profesora de Educación Física',
  'Licenciatura / Profesorado',
  'Upel-ipm',
  2014,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"41","talla_braga":"36","talla_camisa":"L","talla_calzado":"41","talla_chemise":"L","emergencia_tel":"04249036411","talla_pantalon":"34","condicion_neuro":"Neurotípico","grupo_sanguineo":"AB+","condicion_medica":"Hipotiroidismo","emergencia_nombre":"Mi Esposo"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"San Simón","centro_votacion":"Ue José Damián"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Pedro Luis, Limpio Alfonzo","conyuge_cedula":"16938242","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"5) Habita en vivienda catalogada de alto riesgo, así declarado por la autoridad competente (Protección Civil o Bomberos)","prioridad":""}'::jsonb,
  '[{"edad":"69 Años","cedula":"4339079","nombres":"Luisa Elena, Alexander de Rondón","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1957-01-10","vive_con_trabajador":"Sí"},{"edad":"41 Años","cedula":"16938242","nombres":"Pedro Luis, Limpio Alfonzo","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1985-01-22","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Básico","titulo":"Oratoria y Comunicación Efectiva para Educadores","categoria":"Innovación y Desarrollo Profesional"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Eira Alejandra León Peña
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '16375125',
  'Eira Alejandra León Peña',
  'Docente',
  'lb',
  'profe.eiraleon@gmail.com',
  '04149918333',
  '16375125', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '16375125',
  'Femenino',
  '1982-08-30',
  'Casado/a',
  'Villas los Ángeles Calle 7 Segunda Etapa',
  'Profesora en Lengua Extranjera Mencion Inglés',
  'Licenciatura / Profesorado',
  'Upel Ipm',
  2006,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"38","talla_braga":"38","talla_camisa":"M","talla_calzado":"38","talla_chemise":"M","emergencia_tel":"04149918333","talla_pantalon":"30","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"Cardiopatia","emergencia_nombre":"Miguel Peña"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"San Simón","centro_votacion":"Escuela Básica San Simón la Muralla"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":1,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"6) Habita en vivienda prestada, bajo su cuidado.","prioridad":""}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Adaptaciones Curriculares No Significativas","categoria":"Educación Inclusiva y Diversidad"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Nellys Josefina López Torres
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '18080019',
  'Nellys Josefina López Torres',
  'Docente',
  'lb',
  'nellyslopez2108@gmail.com',
  '04128655197',
  '18080019', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '18080019',
  'Femenino',
  '1986-10-23',
  'Soltero/a',
  'Doña Menca Ii Vereda 24 Casa Número 8',
  'No registrado',
  'No registrado',
  'No registrada',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"39","talla_braga":"36","talla_camisa":"XL","talla_calzado":"39","talla_chemise":"XL","emergencia_tel":"","talla_pantalon":"34","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"","emergencia_nombre":""}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Boquerón","centro_votacion":"Escuela Básica Menca de Leoni"}'::jsonb,
  '{"tipo_prestamo":"","num_convivientes":1,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"6) Habita en vivienda prestada, bajo su cuidado.","prioridad":""}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Isleny Adriana Fuenmayor Liporachi
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '19038253',
  'Isleny Adriana Fuenmayor Liporachi',
  'Docente',
  'lb',
  'islenyescuela@gmail.com',
  '04249091817',
  '19038253', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '19038253',
  'Femenino',
  '1989-04-10',
  'Soltero/a',
  'Sector Tipuro. Urbanizacion Palma Real. Condominio Río Claro. Casa Nro 34',
  'No registrado',
  'No registrado',
  'No registrada',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"38","talla_braga":"36","talla_camisa":"M","talla_calzado":"37","talla_chemise":"S","emergencia_tel":"04121016218","talla_pantalon":"30","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Fibromialgia. Discopatia Degenerativa y Rectificación en Columna Cervical y Lumbar. Nódulos Tiroideos en Control Anual. Disminución Prefrontal Occipital (sin Atención Médica por Falta de Presupuesto para Neurología y Estudios). Colon Irritable","emergencia_nombre":"Hermana Militza Liporachi"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Boquerón","centro_votacion":"Escuela Técnica Industrial"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":2,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"7) Habita en un inmueble asignado, propiedad de la Empresa.","prioridad":""}'::jsonb,
  '[{"edad":"","cedula":"5865361","nombres":"Hector Isidro Quijada","conapdis":"No","parentesco":"","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"","condicion_neuro":"Neurotípico","fecha_nacimiento":"","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Juan Cricelio González Barcelo
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '20001991',
  'Juan Cricelio González Barcelo',
  'Docente',
  'lb',
  'juang5871@gmail.com',
  '04249288814',
  '20001991', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '20001991',
  'Masculino',
  '1989-02-19',
  'Concubino/a',
  'Alto Guri 1 Calle Principal Casa Número 20',
  'No registrado',
  'No registrado',
  'No registrada',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"","talla_braga":"42","talla_camisa":"L","talla_calzado":"43","talla_chemise":"M","emergencia_tel":"04249324667","talla_pantalon":"34","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Ninguna","emergencia_nombre":"Yelis del Carmen"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"San Simón","centro_votacion":"Alejandro de Humboldt"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":1,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Luis José Rivas Romero
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '19079457',
  'Luis José Rivas Romero',
  'Docente',
  'lb',
  'lizluisliz3103@gmail.com',
  '04264255537',
  '19079457', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '19079457',
  'Masculino',
  '1988-03-10',
  'Soltero/a',
  'Calle Carrizal',
  'No registrado',
  'No registrado',
  'No registrada',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"40","talla_braga":"40","talla_camisa":"M","talla_calzado":"40","talla_chemise":"M","emergencia_tel":"","talla_pantalon":"34","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"","emergencia_nombre":""}'::jsonb,
  '{"estado":"Monagas","municipio":"Punceres","parroquia":"Quiriquire","centro_votacion":"Jardin de Infancia Domingo Ramón Hernández"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"","prioridad":""}'::jsonb,
  '[{"edad":"66 Años","cedula":"9297029","nombres":"Melida Romero","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1960-04-25","vive_con_trabajador":"Sí"},{"edad":"14 Años","cedula":"36603346","nombres":"Lisdailys Rivas","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2012-01-03","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Franchesca Greysiree Bermúdez González
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '22718748',
  'Franchesca Greysiree Bermúdez González',
  'Docente',
  'lb',
  'Bermudezfranchesca@gmail.com',
  '04249651651',
  '22718748', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '22718748',
  'Femenino',
  '2026-11-17',
  'Casado/a',
  'Calle Principal de Villas del Sur, Parroquia Amana',
  'No registrado',
  'No registrado',
  'No registrada',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"36","talla_braga":"38","talla_camisa":"M","talla_calzado":"36","talla_chemise":"S","emergencia_tel":"04126766573","talla_pantalon":"30","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Ninguna","emergencia_nombre":"Mi Hermana"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"San Simón","centro_votacion":"Juana Ramirez la Avanzadora"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":2,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"","prioridad":""}'::jsonb,
  '[{"edad":"0 Años","cedula":"8961441","nombres":"Antonio Bermudez","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2026-10-19","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  'No Tengo Vivienda, Vivo en Casa de Mi Padre'
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Sulmary María Bejas
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '18274289',
  'Sulmary María Bejas',
  'Docente',
  'lb',
  'sulmabejas@gmail.com',
  '04249329569',
  '18274289', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '18274289',
  'Femenino',
  '1987-11-02',
  'Casado/a',
  'Urbanización Juana la Avanzadora, Parroquia la Cruz',
  'No registrado',
  'No registrado',
  'No registrada',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"37","talla_braga":"","talla_camisa":"L","talla_calzado":"37","talla_chemise":"L","emergencia_tel":"","talla_pantalon":"36","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Ninguna","emergencia_nombre":""}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Fe y Alegría"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":1,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"6) Habita en vivienda prestada, bajo su cuidado.","prioridad":""}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Ana Eliut González Salazar
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '14367610',
  'Ana Eliut González Salazar',
  'Docente',
  'lb',
  'aegs1810@gmail.com',
  '04249464834',
  '14367610', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '14367610',
  'Femenino',
  '1979-10-18',
  'Casado/a',
  'Urb las Virgenes Carrera 6 Casa 22',
  'Profesor Especialidad Lengua y Literatura',
  'Licenciatura / Profesorado',
  'Universidad Pedagógica Experimental Libertador',
  2003,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"37","talla_braga":"36","talla_camisa":"S","talla_calzado":"37","talla_chemise":"S","emergencia_tel":"04265820479","talla_pantalon":"28","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Ninguna","emergencia_nombre":"Darwin Cordero"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Centro Educativo Cruz Hernández. Mangozal"}'::jsonb,
  '{"tipo_prestamo":"Adicional/Mejoras","num_convivientes":5,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Darwin José Cordero Gallardo","conyuge_cedula":"12538506","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"48 Años","cedula":"12538506","nombres":"Darwin José Cordero Gallardo","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1977-06-25","vive_con_trabajador":"Sí"},{"edad":"19 Años","cedula":"31650181","nombres":"Darliana Barbarita Cordero González","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2006-09-21","vive_con_trabajador":"Sí"},{"edad":"15 Años","cedula":"34100131","nombres":"Aidarlys Victoria Cordero González","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2010-06-22","vive_con_trabajador":"Sí"},{"edad":"77 Años","cedula":"3439068","nombres":"José Santiago González","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1948-07-25","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"14/11/1997","horas":"06","lugar":"Casa de la Poesía Monaguense","titulo":"Expresión Literaria"},{"fecha":"20/03/2003","horas":"12","lugar":"Universidad Nacional Experimental Simón Rodríguez","titulo":"Congreso Regional de Pedagogía"},{"fecha":"12 y 13/06/2002","horas":"20","lugar":"Universidad Pedagógica Experimental Libertador","titulo":"Léxico y Lexicografia en Venezuela"},{"fecha":"14 y 15/06/2002","horas":"20","lugar":"Universidad Pedagógica Experimental Libertador","titulo":"Revisión Ortografica"},{"fecha":"26/07/2002","horas":"12","lugar":"Instituto de la Cultura/gobernación del Estado Monagas","titulo":"El Ensayo Como Práctica de la Subjetividad"},{"fecha":"11/04/2010","horas":"16","lugar":"Upel - Aelac","titulo":"Formación Docente y Desarrollo Comunitario"},{"fecha":"18 y 19/10/2005","horas":"16","lugar":"Pdvsa","titulo":"Inducción para Nuevos Trabajadores"},{"fecha":"Del 11 al 13/09/2008","horas":"12","lugar":"Universidad Bolivariana de los Trabajadores","titulo":"Pensamiento Económico de la Clase Trabajadora"},{"fecha":"Del 11 al 13 /09/2008","horas":"12","lugar":"Universidad Bolivariana de los Trabajadores","titulo":"Pensamiento Pragmático de la Clase Trabajadora"},{"fecha":"20/06/2011","horas":"08","lugar":"Pdvsa","titulo":"Marco Ético Político Pdvsa"},{"fecha":"20/10/2009","horas":"08","lugar":"Pdvsa","titulo":"Buen Uso del Correo y Políticasde Seguridad de Información"},{"fecha":"Del 21 al 23/07/2008","horas":"24","lugar":"Pdvsa","titulo":"Corresponsabilidad en la Toma de Decisiones y Análisis de Problemas"},{"fecha":"10 y 11/12/2008","horas":"16","lugar":"Pdvsa","titulo":"5 Tiempos Petroleros"},{"fecha":"01 y 02/03/2012","horas":"16","lugar":"Pdvsa","titulo":"Excel Intermedio"},{"fecha":"Del 18 al 20/02/2013","horas":"24","lugar":"Pdvsa","titulo":"Excel Avanzado"},{"fecha":"Del 17 al 19/09/2014","horas":"24","lugar":"Pdvsa","titulo":"Evaluación Liberadora"},{"fecha":"04 al 05 y18 al 20/03/2013","horas":"40","lugar":"Pdvsa","titulo":"Taller Corporativo de Formación en Supervición y Gerencia"},{"fecha":"25 y 26/03/2014","horas":"16","lugar":"Pdvsa","titulo":"Proceso de Transformación de la Cultura Escolar"}]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Jamnymar José Jiménez Mata
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '17722878',
  'Jamnymar José Jiménez Mata',
  'Docente',
  'lb',
  'jimenezjjq@gmail.com',
  '04147686402',
  '17722878', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '17722878',
  'Femenino',
  '1986-10-24',
  'Casado/a',
  'Av. Alirio Ugarte Pelayo, Urb Villas de Aguasay Condominio 5 Casa 33',
  'Profesora de Educación Preescolar',
  'Licenciatura / Profesorado',
  'Upel-ipm',
  2008,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"38","talla_braga":"36","talla_camisa":"M","talla_calzado":"38","talla_chemise":"M","emergencia_tel":"04141916022","talla_pantalon":"30","condicion_neuro":"Neurotípico","grupo_sanguineo":"A+","condicion_medica":"","emergencia_nombre":"Carlos Márquez"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"E.b José Ángel Meza Verde"}'::jsonb,
  '{"tipo_prestamo":"Adicional/Mejoras","num_convivientes":5,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Carlos Gabriel Márquez Salazar","conyuge_cedula":"17713009","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"","prioridad":""}'::jsonb,
  '[{"edad":"39 Años","cedula":"17713009","nombres":"Carlos Gabriel Márquez Salazar","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1987-03-02","vive_con_trabajador":"Sí"},{"edad":"7 Años","cedula":"18117722878","nombres":"Gael Mateo Márquez Jiménez","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2018-11-28","vive_con_trabajador":"Sí"},{"edad":"5 Años","cedula":"18117722878","nombres":"Caleb Bautista Márquez Jiménez","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Inicial","condicion_neuro":"Neurotípico","fecha_nacimiento":"2020-09-15","vive_con_trabajador":"Sí"},{"edad":"2 Años","cedula":"","nombres":"Amir Gabriel Márquez Jiménez","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"No Escolarizado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2023-10-25","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Básico","titulo":"Oratoria y Comunicación Efectiva para Educadores","categoria":"Innovación y Desarrollo Profesional"},{"nivel":"Básico","titulo":"Pensamiento Crítico y Creatividad en el Aula","categoria":"Formación Pedagógica y Didáctica"},{"nivel":"Básico","titulo":"Estrategias para la Neurodiversidad en el Aula","categoria":"Educación Inclusiva y Diversidad"},{"nivel":"Básico","titulo":"Edición de Videos Educativos","categoria":"Tecnología Educativa (EdTech)"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Omar Rafael Rivas Villarroel
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '16174810',
  'Omar Rafael Rivas Villarroel',
  'Docente',
  'lb',
  'omarrivas.maxi@gmail.com',
  '04128614993',
  '16174810', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '16174810',
  'Masculino',
  '1981-12-30',
  'Soltero/a',
  'Parque Residencial Monterrey 3, Calle 5, Casa 55',
  'Profesor de Biología',
  'Licenciatura / Profesorado',
  'Upel',
  2012,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"42","talla_braga":"42","talla_camisa":"S","talla_calzado":"41","talla_chemise":"M","emergencia_tel":"04249049795","talla_pantalon":"32","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"","emergencia_nombre":"Madre"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"E,b Cacique Guanaguney"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":6,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"","prioridad":""}'::jsonb,
  '[{"edad":"73 Años","cedula":"4004609","nombres":"Mireya Concepción Villarroel Jiménez","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1953-03-26","vive_con_trabajador":"Sí"},{"edad":"70 Años","cedula":"8446759","nombres":"Omar Rafael Rivas","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1956-02-06","vive_con_trabajador":"Sí"},{"edad":"23 Años","cedula":"30079738","nombres":"Brayan Jesus Rivas Valdez","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2002-07-11","vive_con_trabajador":"Sí"},{"edad":"10 Años","cedula":"36960321","nombres":"Benjamin Javier Rivas Valdez","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2015-11-21","vive_con_trabajador":"Sí"},{"edad":"8 Años","cedula":"1201816940798","nombres":"Braulio José Rivas Valdez","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2018-01-02","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Pensamiento Crítico y Creatividad en el Aula","categoria":"Formación Pedagógica y Didáctica"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: José Angel Lucas Carrasquel
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '14703619',
  'José Angel Lucas Carrasquel',
  'Docente',
  'lb',
  'Josealucasc007@gmail.com',
  '04167926910',
  '14703619', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '14703619',
  'Masculino',
  '1980-06-23',
  'Casado/a',
  'Calle 1, Manzana 3 Casa Nro 10, Urb. Valle Grande Country Sector Iii los Sauces, Condominio Mucuchies',
  'Profesor Mención Física',
  'Licenciatura / Profesorado',
  'Upel- Ipm',
  2010,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"42","talla_braga":"42","talla_camisa":"M","talla_calzado":"41","talla_chemise":"M","emergencia_tel":"04249206699","talla_pantalon":"34","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"","emergencia_nombre":"María Smith"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"U e Felix Armando Núñez"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":6,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"María Gabriela Smith de Lucas","conyuge_cedula":"18652761","conyuge_trabaja_pdvsa":"Trabajador(a) Activo(a)","condicion_habitabilidad":"1) Habita en condición de hacinamiento, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"11 Años","cedula":"36882058","nombres":"Jesús Gabriel Lucas Smith","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2015-01-14","vive_con_trabajador":"Sí"},{"edad":"8 Años","cedula":"1718652761","nombres":"María José Lucas Smith","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2017-10-17","vive_con_trabajador":"Sí"},{"edad":"6 Años","cedula":"1918652761","nombres":"María Belén Lucas Smith","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2019-06-04","vive_con_trabajador":"Sí"},{"edad":"72 Años","cedula":"4896331","nombres":"Rosa Elena Carrasquel Rodríguez","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1953-12-13","vive_con_trabajador":"Sí"},{"edad":"38 Años","cedula":"18652761","nombres":"María Gabriela Smith de Lucas","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Trabajador(a) Activo(a)","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1987-09-16","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"1998","horas":"1600","lugar":"Ince","titulo":"Mecánica Automotriz"}]'::jsonb,
  '[{"nivel":"Avanzado","titulo":"Estrategias para la Gestión del Estrés Estudiantil","categoria":"Gestión y Liderazgo Educativo"}]'::jsonb,
  'Manejo Defensivo'
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Carmen Elena Rodríguez Pinto
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '9286272',
  'Carmen Elena Rodríguez Pinto',
  'Docente',
  'lb',
  'carmenelena0025@gmail.com',
  '04167883929',
  '9286272', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '9286272',
  'Femenino',
  '1967-04-06',
  'Soltero/a',
  'Urbanización Moriche, Parroquia la Cruz',
  'Profesora de Lengua, Mención Castellano y Literatura',
  'Licenciatura / Profesorado',
  'Upel Maturín',
  1994,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"35","talla_braga":"36","talla_camisa":"S","talla_calzado":"35","talla_chemise":"S","emergencia_tel":"04128714358","talla_pantalon":"28","condicion_neuro":"Neurotípico","grupo_sanguineo":"A+","condicion_medica":"Alergia a Aines y Tópica a Cosméticos","emergencia_nombre":"Francys Rodríguez"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Boquerón","centro_votacion":"Epe Luisa Teresa Sosa"}'::jsonb,
  '{"tipo_prestamo":"Adicional/Mejoras","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Juan Antonio Cervantes Brown","conyuge_cedula":"84603455","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"18 Años","cedula":"32734317","nombres":"Juan Diego Cervantes Rodríguez","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2007-09-04","vive_con_trabajador":"Sí"},{"edad":"59 Años","cedula":"84603455","nombres":"Juan Antonio Cervantes Brown","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1966-05-21","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"Noviembre 92,Marzo 1994","horas":"16","lugar":"Upel Caracas","titulo":"Talleres de Linguística/simposios Varioss"}]'::jsonb,
  '[{"nivel":"Básico","titulo":"Oratoria y Comunicación Efectiva para Educadores","categoria":"Innovación y Desarrollo Profesional"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Jeslhor Katherine Brito Hernández
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '16722294',
  'Jeslhor Katherine Brito Hernández',
  'Docente',
  'lb',
  'jeslhork@gmail.com',
  '04147617942',
  '16722294', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '16722294',
  'Femenino',
  '1985-06-06',
  'Soltero/a',
  'Tipuro, Parroquia Boquerón',
  'No registrado',
  'No registrado',
  'No registrada',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"","talla_braga":"","talla_camisa":"","talla_calzado":"","talla_chemise":"","emergencia_tel":"","talla_pantalon":"","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"","emergencia_nombre":""}'::jsonb,
  '{"estado":"Monagas","municipio":"Bolívar","parroquia":"Caripito","centro_votacion":"Ue David Eckar"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":2,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"63 Años","cedula":"8450597","nombres":"Lorena de Brito","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1963-03-11","vive_con_trabajador":"No"},{"edad":"15 Años","cedula":"34101598","nombres":"Bryan Serrano","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2010-12-30","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"01/02/2025","horas":"8","lugar":"Cp Azulgrana Cheer","titulo":"I Clínica de Porrismo"}]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Oratoria y Comunicación Efectiva para Educadores","categoria":"Innovación y Desarrollo Profesional"},{"nivel":"Intermedio","titulo":"Liderazgo Pedagógico: Inspirar sin Autoritarismo","categoria":"Gestión y Liderazgo Educativo"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Laurys Del Valle Millán De Rivas
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '13656273',
  'Laurys Del Valle Millán De Rivas',
  'Docente',
  'lb',
  'laurysmillan2025@gmail.com',
  '04143943175',
  '13656273', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '13656273',
  'Femenino',
  '1977-12-05',
  'Casado/a',
  'Urbanización Doña Gladys, Parroquia las Cocuizas',
  'Educación de Necesidades Educativa Especial',
  'Postgrado / Especialización',
  'Upel Maturín',
  2009,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"41","talla_braga":"40","talla_camisa":"XL","talla_calzado":"41","talla_chemise":"XL","emergencia_tel":"04264938001","talla_pantalon":"40","condicion_neuro":"Neurotípico","grupo_sanguineo":"A+","condicion_medica":"","emergencia_nombre":"Aquiles Rivas"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Cefit"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":5,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Jesús Aquiles Rivas Hernández","conyuge_cedula":"9899154","conyuge_trabaja_pdvsa":"Trabajador(a) Activo(a)","condicion_habitabilidad":"7) Habita en un inmueble asignado, propiedad de la Empresa.","prioridad":""}'::jsonb,
  '[{"edad":"17 Años","cedula":"33276037","nombres":"Jesús Aquiles Rivas Millán","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2008-07-28","vive_con_trabajador":"Sí"},{"edad":"16 Años","cedula":"33276040","nombres":"Jatniel Jesús Rivas Millán","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2010-02-11","vive_con_trabajador":"Sí"},{"edad":"6 Años","cedula":"","nombres":"Jahdiel Jesús Rivas Millán","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Inicial","condicion_neuro":"Neurotípico","fecha_nacimiento":"2020-02-27","vive_con_trabajador":"Sí"},{"edad":"59 Años","cedula":"9899154","nombres":"Jesús Aquiles Rivas Hernández","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Trabajador(a) Activo(a)","estudiante_de":"","condicion_neuro":"Neurotípico","fecha_nacimiento":"1966-05-12","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Básico","titulo":"Enseñanza Diferenciada: Atender la Diversidad","categoria":"Educación Inclusiva y Diversidad"}]'::jsonb,
  'Excel'
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Alberto Rafael Martínez Villahermosa
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '14622890',
  'Alberto Rafael Martínez Villahermosa',
  'Docente',
  'lb',
  'alberto4497@gmail.com',
  '04264941095',
  '14622890', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '14622890',
  'Masculino',
  '1981-01-15',
  'Concubino/a',
  '1er Calle Casa # 54',
  'Profesor Informática',
  'Licenciatura / Profesorado',
  'Upel',
  2013,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"","talla_braga":"","talla_camisa":"","talla_calzado":"","talla_chemise":"","emergencia_tel":"","talla_pantalon":"","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"","emergencia_nombre":""}'::jsonb,
  '{"estado":"Monagas","municipio":"Punceres","parroquia":"Cachipo","centro_votacion":"Colegio San Martin"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Yusmerys Valdiviezo","conyuge_cedula":"11006024","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"2) Habita en condición de arrimado, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"55 Años","cedula":"11006024","nombres":"Yusmerys Valdiviezo","conapdis":"No","parentesco":"Concubino(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1970-09-07","vive_con_trabajador":"Sí"},{"edad":"14 Años","cedula":"33840252","nombres":"Matías Martínez","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2011-10-01","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Programación Neurolingüística (PNL) en el Aula","categoria":"Gestión y Liderazgo Educativo"},{"nivel":"Intermedio","titulo":"Automatización de Tareas Docentes con IA","categoria":"Tecnología Educativa (EdTech)"},{"nivel":"Básico","titulo":"Estrategias para la Neurodiversidad en el Aula","categoria":"Educación Inclusiva y Diversidad"},{"nivel":"Intermedio","titulo":"Análisis de Datos Educativos con Excel","categoria":"Evaluación y Medición del Aprendizaje"},{"nivel":"Intermedio","titulo":"Oratoria y Comunicación Efectiva para Educadores","categoria":"Innovación y Desarrollo Profesional"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Denysse Josefina Hernández Machado
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '12891949',
  'Denysse Josefina Hernández Machado',
  'Docente',
  'lb',
  'hernandezdenysse@gmail.com',
  '04245725526',
  '12891949', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '12891949',
  'Femenino',
  '1976-10-30',
  'Concubino/a',
  'Urbanización Laguna Paraíso, Parroquia la Cruz',
  'Profesora de Inglés',
  'Licenciatura / Profesorado',
  'Upel Ipm',
  2005,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"42","talla_braga":"38","talla_camisa":"L","talla_calzado":"42","talla_chemise":"L","emergencia_tel":"04143201783","talla_pantalon":"32","condicion_neuro":"Neurotípico","grupo_sanguineo":"B+","condicion_medica":"Polvo, Codeina","emergencia_nombre":"Raúl Rodríguez"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Cefit"}'::jsonb,
  '{"tipo_prestamo":"Adicional/Mejoras","num_convivientes":6,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Raúl Antonio Rodriguez del Nogal","conyuge_cedula":"9094695","conyuge_trabaja_pdvsa":"Trabajador(a) Activo(a)","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"61 Años","cedula":"9094695","nombres":"Raúl Antonio Rodriguez del Nogal","conapdis":"No","parentesco":"Concubino(a)","estatus_pdvsa":"Trabajador(a) Activo(a)","estudiante_de":"","condicion_neuro":"Neurotípico","fecha_nacimiento":"1964-12-29","vive_con_trabajador":"Sí"},{"edad":"14 Años","cedula":"34492701","nombres":"Roman Ricardo Rodriguez Hernández","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2012-02-02","vive_con_trabajador":"Sí"},{"edad":"16 Años","cedula":"33679800","nombres":"Raúl Antonio Rodriguez Hernández","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2009-11-12","vive_con_trabajador":"Sí"},{"edad":"86 Años","cedula":"2489925","nombres":"Angel Ricardo Hernández Díaz","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1940-03-13","vive_con_trabajador":"Sí"},{"edad":"77 Años","cedula":"2489925","nombres":"Aura Josefina Machado Flores","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1948-08-31","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"2007","horas":"6","lugar":"Escuela Anaco","titulo":"Liderasgo"},{"fecha":"2009","horas":"12","lugar":"Escuela Anaco Plc","titulo":"Inglés con Propósito"},{"fecha":"2011","horas":"36","lugar":"On Line","titulo":"Elearning"}]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Betzaida Zaray González Vargas
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '19079220',
  'Betzaida Zaray González Vargas',
  'Docente',
  'lb',
  'betzaidagonzalez519@gmail.com',
  '04169824842',
  '19079220', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '19079220',
  'Femenino',
  '1988-11-02',
  'Soltero/a',
  'Urbanización Moriche, Parroquia la Cruz',
  'Profesora Especialista en Biología',
  'Licenciatura / Profesorado',
  'Universidad Pedagógica Experimental Libertador',
  2017,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"36","talla_braga":"36","talla_camisa":"S","talla_calzado":"36","talla_chemise":"S","emergencia_tel":"04263850766","talla_pantalon":"28","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Ninguna","emergencia_nombre":"Hermana"}'::jsonb,
  '{"estado":"Monagas","municipio":"Bolívar","parroquia":"Caripito","centro_votacion":"Escuela Básica Ciudad de los Teques"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"77 Años","cedula":"4335489","nombres":"Agarita Eriberta Vargas","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1949-03-16","vive_con_trabajador":"No"},{"edad":"11 Años","cedula":"36925234","nombres":"Matías Gabriel Palomo González","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2015-04-21","vive_con_trabajador":"Sí"},{"edad":"5 Años","cedula":"12019079220","nombres":"Belén Zaray González Vargas","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Inicial","condicion_neuro":"Neurotípico","fecha_nacimiento":"2020-10-06","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Elinor Del Valle Hurtado Marcano
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '16374774',
  'Elinor Del Valle Hurtado Marcano',
  'Docente',
  'lb',
  'hurtadoeli32@gmail.com',
  '04123340579',
  '16374774', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '16374774',
  'Femenino',
  '1982-07-27',
  'Soltero/a',
  'Lomas del Bosque Country Club, Avenida Principal de Tipuro, Parroquia Boquerón',
  'Profesora de Geografía e Historia',
  'Licenciatura / Profesorado',
  'Upel',
  2009,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"38","talla_braga":"36","talla_camisa":"S","talla_calzado":"38","talla_chemise":"M","emergencia_tel":"584249148894","talla_pantalon":"30","condicion_neuro":"Neurotípico","grupo_sanguineo":"B-","condicion_medica":"","emergencia_nombre":"04140991717"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Marlene Seque de Campos"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":2,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"7) Habita en un inmueble asignado, propiedad de la Empresa.","prioridad":""}'::jsonb,
  '[{"edad":"23 Años","cedula":"16374774","nombres":"Elihect José Campos Hurtado","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2003-02-19","vive_con_trabajador":"Sí"},{"edad":"","cedula":"4715614","nombres":"Luis Ramón Hurtado","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"","vive_con_trabajador":"No"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Básico","titulo":"Paquetería Ofimática (Word, Excel, PowerPoint/Libres)","categoria":"Tecnología Educativa (EdTech)"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Beatriz Josefina Nucci Cortéz
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '13915005',
  'Beatriz Josefina Nucci Cortéz',
  'Docente',
  'lb',
  'beatriznucci.colegio@gmail.com',
  '04148862811',
  '13915005', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '13915005',
  'Femenino',
  '1977-04-13',
  'Soltero/a',
  'Urb Francisco de Miranda Calle Simón Rodríguez #36',
  'No registrado',
  'No registrado',
  'No registrada',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"37","talla_braga":"40","talla_camisa":"L","talla_calzado":"37","talla_chemise":"L","emergencia_tel":"04244365660","talla_pantalon":"42","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"","emergencia_nombre":"Ruth Cortéz de Nucci"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Unidad Educativa José Ángel Meza Verde"}'::jsonb,
  '{"tipo_prestamo":"Adicional/Mejoras","num_convivientes":1,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Yenire Andreina García Larez
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '17933097',
  'Yenire Andreina García Larez',
  'Docente',
  'lb',
  'garciayenire72@gmail.com',
  '04249294422',
  '17933097', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '17933097',
  'Femenino',
  '1986-03-22',
  'Soltero/a',
  'Urbanización los Prados Iii Calle 5, Casa #322',
  'Licenciada en Educación Inicial',
  'Licenciatura / Profesorado',
  'Universidad Bolivariana de Venezuela',
  2011,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"37","talla_braga":"36","talla_camisa":"S","talla_calzado":"37","talla_chemise":"S","emergencia_tel":"04249202740","talla_pantalon":"28","condicion_neuro":"Neurotípico","grupo_sanguineo":"A+","condicion_medica":"Ninguna","emergencia_nombre":"04249202740"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Escuela Básica la Victoria Ramírez"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"7) Habita en un inmueble asignado, propiedad de la Empresa.","prioridad":""}'::jsonb,
  '[{"edad":"14 Años","cedula":"36014594","nombres":"Sebastian Arcangel Méndez García","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2011-08-19","vive_con_trabajador":"Sí"},{"edad":"9 Años","cedula":"","nombres":"Arlet de los Ángeles Méndez García","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2017-02-07","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Básico","titulo":"Aula Invertida: Estrategias Prácticas","categoria":"Formación Pedagógica y Didáctica"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Yaritza Gabriela Maita Torres
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '17090701',
  'Yaritza Gabriela Maita Torres',
  'Docente',
  'lb',
  'yaritzamaita@gmail.com',
  '04120913435',
  '17090701', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '17090701',
  'Femenino',
  '1985-03-23',
  'Soltero/a',
  'Urbanización Bella Vista, Parroquia Altos de los Godos',
  'Docente de Matemáticas',
  'Licenciatura / Profesorado',
  'Upel Ipm',
  2007,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"39","talla_braga":"42","talla_camisa":"XL","talla_calzado":"38","talla_chemise":"XL","emergencia_tel":"04249077094","talla_pantalon":"36","condicion_neuro":"Neurotípico","grupo_sanguineo":"O-","condicion_medica":"Sinusitis","emergencia_nombre":"Esposo Jesús"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Ue Carbonera"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Mejoras","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"7 Años","cedula":"11817090701","nombres":"Gabriel Clementt","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Inicial","condicion_neuro":"Neurodivergente","fecha_nacimiento":"2018-08-27","vive_con_trabajador":"Sí"},{"edad":"12 Años","cedula":"36319790","nombres":"Gabrieliz Clementt","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2013-07-12","vive_con_trabajador":"Sí"},{"edad":"61 Años","cedula":"8379990","nombres":"Noris Torres","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1964-09-11","vive_con_trabajador":"No"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Avanzado","titulo":"Estrategias para la Neurodiversidad en el Aula","categoria":"Educación Inclusiva y Diversidad"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Ruthmary Josefina Moreno Marcano
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '13814605',
  'Ruthmary Josefina Moreno Marcano',
  'Docente',
  'lb',
  'morenoruthmary@gmail.com',
  '04141921643',
  '13814605', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '13814605',
  'Femenino',
  '1979-04-25',
  'Soltero/a',
  'Villa los Ángeles, Parroquia Altos de los Godos',
  'Licenciada en Educación Integral',
  'Licenciatura / Profesorado',
  'Universidad Pedagógica Experimental',
  2009,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"","talla_braga":"","talla_camisa":"","talla_calzado":"","talla_chemise":"","emergencia_tel":"","talla_pantalon":"","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"","emergencia_nombre":""}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Ue Cruz Hernández Quijada"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Mejoras","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"19 Años","cedula":"32173175","nombres":"Gisellys Onixmar Carreño Moreno","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2006-05-24","vive_con_trabajador":"Sí"},{"edad":"16 Años","cedula":"33679610","nombres":"Arianny Nazaret Carreño Moreno","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2009-11-04","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"18 al 20 de marzo del 2004","horas":"24","lugar":"Upel","titulo":"Enseñanza y Evaluación de la Ortografía"},{"fecha":"16/06/2005","horas":"16","lugar":"Udo","titulo":"La Cuestión Filosófica Como Reflexión en la Teorizacion y Práctica de la Educación y la Pedagogía en Venezuela y Su Visión Latinoamericana"},{"fecha":"2007/2008","horas":"1350","lugar":"Liceo Bolivariano U.e. \"mario Briceño Iragorry\"","titulo":"Desempeño de las Actividades Académicas en Pro de la Institución. Año Escolar"},{"fecha":"29/07/2009","horas":"8","lugar":"Pdvsa","titulo":"Consolidar los Sueños y Metas Institucionales Trazadas para Este Año Escolar en Nuestra Casa de Estudios"},{"fecha":"11/05/2010","horas":"2","lugar":"Pdvsa","titulo":"Estrategias Metodológicas para la Enseñanza de las Matemáticas en Educación Primaria"},{"fecha":"19 al 21 de octubre del 2011","horas":"24","lugar":"Pdvsa","titulo":"Motivación Al Logro y Sentido de Pertenencia"},{"fecha":"14 y 15 de marzo del 2011","horas":"16","lugar":"Pdvsa","titulo":"Excel Básico"},{"fecha":"28 y 29 de junio del 2011","horas":"16","lugar":"Pdvsa","titulo":"Ética y Valores Socialistas"},{"fecha":"04 y 05 de agosto del 2011","horas":"16","lugar":"Pdvsa","titulo":"Cinco Tiempos Petroleros"},{"fecha":"11 y 12 de noviembre del 2011","horas":"18","lugar":"Colegio Universitario de Psicopedagogía","titulo":"Iv Jornadas Venezolanas de Actualización"},{"fecha":"20 y 21 de septiembre del 2012","horas":"16","lugar":"Pdvsa","titulo":"Estrategias de Facilitación de Contenidos, Auspiciando el Pensamiento Crítico"},{"fecha":"26 y 27 de septiembre del 2012","horas":"16","lugar":"Pdvsa","titulo":"Economía, Energía y Ambiente"},{"fecha":"14 al 18 de septiembre del 2015","horas":"80","lugar":"Facilitadores Internacionales de Aprendizaje","titulo":"Coaching Educativo"}]'::jsonb,
  '[]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

-- Docente: Juan Carlos Canelón
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '14859067',
  'Juan Carlos Canelón',
  'Docente',
  'lb',
  'juancanelon795@gmail.com',
  '04244238157',
  '14859067', -- Clave inicial igual a la cédula
  'Activo',
  true,
  false
)
ON CONFLICT (cedula) DO UPDATE SET
  nombre_completo = EXCLUDED.nombre_completo,
  email = COALESCE(usuarios.email, EXCLUDED.email),
  telefono = COALESCE(usuarios.telefono, EXCLUDED.telefono);

INSERT INTO public.expedientes_docentes (
  usuario_cedula, sexo, fecha_nacimiento, estado_civil, direccion,
  titulo_obtenido, nivel_instruccion, universidad, anio_egreso,
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos,
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra
)
VALUES (
  '14859067',
  'Masculino',
  '1981-02-01',
  'Casado/a',
  'Parque Residencial Monterrey Iii Casa 118',
  'Profesor Especialista en Quimica',
  'Licenciatura / Profesorado',
  'Upel Maturin',
  2010,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"40","talla_braga":"40","talla_camisa":"L","talla_calzado":"40","talla_chemise":"L","emergencia_tel":"04249640399","talla_pantalon":"34","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Ninguna","emergencia_nombre":"Mariellys Gonazalez (pareja)"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Boquerón","centro_votacion":"E.b. José Gregorio Monagas"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":2,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Mariellys Gonzales","conyuge_cedula":"V- 16710266  V- 34358009 V = 30013948","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"42 Años","cedula":"V- 16710266  V- 34358009 V = 30013948","nombres":"Mariellys Gonzales","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1983-08-03","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Básico","titulo":"Ética y Uso Responsable de la IA en Educación","categoria":"Tecnología Educativa (EdTech)"}]'::jsonb,
  ''
)
ON CONFLICT (usuario_cedula) DO UPDATE SET
  sexo = EXCLUDED.sexo,
  fecha_nacimiento = EXCLUDED.fecha_nacimiento,
  estado_civil = EXCLUDED.estado_civil,
  direccion = EXCLUDED.direccion,
  titulo_obtenido = EXCLUDED.titulo_obtenido,
  nivel_instruccion = EXCLUDED.nivel_instruccion,
  universidad = EXCLUDED.universidad,
  anio_egreso = EXCLUDED.anio_egreso,
  fecha_ingreso = EXCLUDED.fecha_ingreso,
  datos_salud = EXCLUDED.datos_salud,
  datos_electoral = EXCLUDED.datos_electoral,
  datos_vivienda = EXCLUDED.datos_vivienda,
  carga_familiar = EXCLUDED.carga_familiar,
  cursos_realizados = EXCLUDED.cursos_realizados,
  plan_formacion = EXCLUDED.plan_formacion,
  necesidades_extra = EXCLUDED.necesidades_extra;

COMMIT;
