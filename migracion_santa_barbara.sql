-- ========================================================
-- MIGRACIÓN DE EXPEDIENTES Y USUARIOS: SANTA BÁRBARA
-- Generado automáticamente: 2026-06-26T00:51:45.544Z
-- ========================================================

BEGIN;

-- Docente: Katherine Vanessa Bustamante Castillo
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '18165536',
  'Katherine Vanessa Bustamante Castillo',
  'Docente',
  'sb',
  'psicokatherinebustamante6@gmail.com',
  '04124374938',
  '18165536', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '18165536',
  'Femenino',
  '1988-02-16',
  'Soltero/a',
  'Calle Nueva Casa # S/n, Sector Casupal, el Tejero',
  'Profesor en Educación Especial Mención Dificultades de Aprendizaje',
  'Licenciatura / Profesorado',
  'Upel- Maracay',
  2014,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"39","talla_braga":"40","talla_camisa":"XL","talla_calzado":"38","talla_chemise":"XL","emergencia_tel":"04243414311","talla_pantalon":"38","condicion_neuro":"Neurotípico","grupo_sanguineo":"A+","condicion_medica":"","emergencia_nombre":"Hermano"}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"El Tejero","centro_votacion":"Escuela Básica Casupal"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"6) Habita en vivienda prestada, bajo su cuidado.","prioridad":""}'::jsonb,
  '[{"edad":"17 Años","cedula":"32733982","nombres":"Anthony Alejandro Bergoderi Bustamante","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2009-01-10","vive_con_trabajador":"Sí"},{"edad":"7 Años","cedula":"118165536","nombres":"Gianfranko de Jesús Bergoderi Bustamante","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2018-09-08","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"17/11/2025","horas":"36","lugar":"Pdvsa","titulo":"Oratoria"}]'::jsonb,
  '[{"nivel":"Avanzado","titulo":"Educación con Perspectiva de Género e Interculturalidad","categoria":"Educación Inclusiva y Diversidad"}]'::jsonb,
  '',
  '',
  '',
  '',
  'Inglés Básico',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2014","nivel":"Licenciatura / Profesorado","titulo":"Profesor en Educación Especial Mención Dificultades de Aprendizaje","institucion":"Upel- Maracay"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Mario José Prada Rivas
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '17240397',
  'Mario José Prada Rivas',
  'Docente',
  'sb',
  'pramattar@gmail.com',
  '04148755700',
  '17240397', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '17240397',
  'Masculino',
  '1986-01-02',
  'Casado/a',
  'Avenida Universidad, Parroquia Altos de los Godos Edificio los Pájaros #13',
  'Profesor Geografía e Historia',
  'Licenciatura / Profesorado',
  'Upel-ipm',
  2008,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"43","talla_braga":"50","talla_camisa":"XXXL","talla_calzado":"42","talla_chemise":"XXXL","emergencia_tel":"04267373781","talla_pantalon":"","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"","emergencia_nombre":"Franyerlin Rosillo"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Ji Héroes de Ayacucho"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Mejoras","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Franyerlin Rosillo","conyuge_cedula":"17224288","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"7 Años","cedula":"","nombres":"María José Prada Rosillo","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2018-08-07","vive_con_trabajador":"Sí"},{"edad":"40 Años","cedula":"17224288","nombres":"Franyerlin Rosillo","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1986-03-25","vive_con_trabajador":"Sí"},{"edad":"70 Años","cedula":"4951648","nombres":"Benita Rivas","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1956-03-20","vive_con_trabajador":"No"},{"edad":"66 Años","cedula":"8354414","nombres":"Jorge Prada","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1959-07-04","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2008","nivel":"Licenciatura / Profesorado","titulo":"Profesor Geografía e Historia","institucion":"Upel-ipm"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Jennyfertt Alexandra Navarro Campos
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '21051939',
  'Jennyfertt Alexandra Navarro Campos',
  'Docente',
  'sb',
  'jennyferttnavarro@gmail.com',
  '04140982824',
  '21051939', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '21051939',
  'Femenino',
  '1990-05-04',
  'Casado/a',
  'Sector Simón Bolivar, Calle Colombia Casa I12',
  'Profesor de Educación Especial en Dificultades del Aprendizaje',
  'Licenciatura / Profesorado',
  'Upel Ipm',
  2014,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"38","talla_braga":"36","talla_camisa":"S","talla_calzado":"37","talla_chemise":"S","emergencia_tel":"04129798822","talla_pantalon":"28","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"","emergencia_nombre":"Rommel Veracierta"}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"Punta de Mata","centro_votacion":"Bases de Misiones Simón Bolivar"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Rommel José Veracierta Idrogo","conyuge_cedula":"16312580","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"6) Habita en vivienda prestada, bajo su cuidado.","prioridad":""}'::jsonb,
  '[{"edad":"40 Años","cedula":"16312580","nombres":"Rommel José Veracierta Idrogo","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1985-05-07","vive_con_trabajador":"Sí"},{"edad":"8 Años","cedula":"","nombres":"Cameront Anttonelha Veracierta Navarro","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2018-04-04","vive_con_trabajador":"Sí"},{"edad":"3 Años","cedula":"","nombres":"Mijahil Samuel Veracierta Navarro","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Inicial","condicion_neuro":"Neurotípico","fecha_nacimiento":"2022-07-09","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"8 de febrero de 2014","horas":"8","lugar":"Renacseniv","titulo":"Evangelismo Creativo I"},{"fecha":"Del 15/07 al 15/10 del 2015","horas":"50","lugar":"Fundación Casa Bolivariana de la Mujer Zamorana","titulo":"Lenguaje de Señas Venezolanas Nivel Básico"}]'::jsonb,
  '[{"nivel":"Avanzado","titulo":"Rúbricas y Portafolios Digitales para Evaluar Competencias","categoria":"Evaluación y Medición del Aprendizaje"},{"nivel":"Avanzado","titulo":"Evaluación de Habilidades Blandas y Socioemocionales","categoria":"Evaluación y Medición del Aprendizaje"},{"nivel":"Intermedio","titulo":"Rutinas de Pensamiento para Desarrollar la Mente","categoria":"Formación Pedagógica y Didáctica"},{"nivel":"Avanzado","titulo":"Estrategias para la Neurodiversidad en el Aula","categoria":"Educación Inclusiva y Diversidad"},{"nivel":"Avanzado","titulo":"Programación Neurolingüística (PNL) en el Aula","categoria":"Gestión y Liderazgo Educativo"}]'::jsonb,
  'Lenguaje de Señas y Estrategias Prácticas para las Adaptaciones Curriculares ante los Casos de Neuro Diversidad',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2014","nivel":"Licenciatura / Profesorado","titulo":"Profesor de Educación Especial en Dificultades del Aprendizaje","institucion":"Upel Ipm"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Yracelys Del Valle Pérez Lara
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '15278892',
  'Yracelys Del Valle Pérez Lara',
  'Docente',
  'sb',
  'yralara79@gmail.com',
  '04124999757',
  '15278892', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '15278892',
  'Femenino',
  '1979-09-20',
  'Soltero/a',
  'Urb El Faro, Parroquia Santa Cruz',
  'Profesora Educación Integral',
  'Licenciatura / Profesorado',
  'Upel-ipm',
  2005,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"37","talla_braga":"36","talla_camisa":"M","talla_calzado":"38","talla_chemise":"M","emergencia_tel":"04128635646","talla_pantalon":"28","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"","emergencia_nombre":"Cruz Pérez"}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"El Tejero","centro_votacion":"Escuela Básica Lisandro Rivero"}'::jsonb,
  '{"tipo_prestamo":"Adicional/Mejoras","num_convivientes":2,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"67 Años","cedula":"4715074","nombres":"Yraida del Valle Lara","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1958-06-27","vive_con_trabajador":"No"},{"edad":"70 Años","cedula":"4715124","nombres":"Cruz José Pérez Velásquez","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1955-07-18","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  'Oratoria, Teatro.',
  '',
  '',
  '',
  'Ninguno',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2005","nivel":"Licenciatura / Profesorado","titulo":"Profesora Educación Integral","institucion":"Upel-ipm"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Amarelis Josefina Sifontes Jiménez
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '12058709',
  'Amarelis Josefina Sifontes Jiménez',
  'Docente',
  'sb',
  'sifontesamarelis@gmail.com',
  '04164983486',
  '12058709', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '12058709',
  'Femenino',
  '1974-12-15',
  'Casado/a',
  'Urbanización Reina Paulina Sur, Parroquia la Cruz, Calle 5, Casa 46',
  'Profesor en Lengua y Literatura',
  'Licenciatura / Profesorado',
  'Universidad Experimental Libertador - Ipm',
  2002,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"41","talla_braga":"38","talla_camisa":"XL","talla_calzado":"39","talla_chemise":"XL","emergencia_tel":"04268919546","talla_pantalon":"36","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"","emergencia_nombre":"Isbardo Giusseppe"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Escuela Básica Milá de la Roca"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":5,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Isnardo José Giusseppe Rodriguez","conyuge_cedula":"12794357","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"12 Años","cedula":"36143030","nombres":"Soohía Noemí Giusseppe Sifontes","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2014-02-25","vive_con_trabajador":"Sí"},{"edad":"18 Años","cedula":"33470262","nombres":"Johann Sebastián Giusseppe Sifontes","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurodivergente","fecha_nacimiento":"2007-09-21","vive_con_trabajador":"Sí"},{"edad":"71 Años","cedula":"5193936","nombres":"Juan Antonio Sifontes Rivero","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1954-07-05","vive_con_trabajador":"Sí"},{"edad":"48 Años","cedula":"12794357","nombres":"Isnardo José Giusseppe Rodriguez","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1977-10-16","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"13/02/2025","horas":"25","lugar":"Centro de Educación a Distancia para Adultos (ceadpa)","titulo":"Diplomado Educar sin Barreras: Diversidad e Inclusión"},{"fecha":"26/06/2025","horas":"20","lugar":"Centro de Educación a Distancia para Adultos (ceadpa)","titulo":"Diplomado Inteligencia Emocional"},{"fecha":"05/06/2024","horas":"20","lugar":"Centro de Educación a Distancia para Adultos (ceadpa)","titulo":"Diplomado Desarrollo de Habilidades de la Lectoescritura"},{"fecha":"Entre el 7 de febrero y el 29 de abril de 2022","horas":"12","lugar":"Profuturo","titulo":"Inteligencia Digital"},{"fecha":"30/07/2023","horas":"40","lugar":"Profuturo","titulo":"Aprendizaje Basado en Proyectos (abep)"},{"fecha":"24/08/2023","horas":"12","lugar":"Profuturo","titulo":"Dislexia en el Aula"},{"fecha":"21/11/1997","horas":"16","lugar":"Universidad Pedagógica Experimental Libertador","titulo":"Taller Creatividad y Enseñanza de la Literatura"},{"fecha":"29 al 31/10/1997","horas":"24","lugar":"Universidad Pedagógica Experimental Libertador","titulo":"Iii Jornadas de Enfermedades de Transmisión Sexual"},{"fecha":"Del 22 al 24/04/1999","horas":"20","lugar":"Universidad Pedagógica Experimental Libertador","titulo":"I Jornadas de Interacción con el Texto Escrito:"},{"fecha":"20 al 24/07/1999","horas":"32","lugar":"Universidad Pedagógica Experimental Libertador","titulo":"Talleres:"},{"fecha":"13/05 al 04/06/1999","horas":"","lugar":"Universidad Pedagógica Experimental Libertador","titulo":"Ii Jornadas de Actualización: Perspectivas de la Lingüística Actual para la Formación Docente: Taller"},{"fecha":"27 y 28/10/2000","horas":"12","lugar":"Universidad Pedagógica Experimental Libertador","titulo":"Taller"},{"fecha":"30 y 31/03/2001","horas":"12","lugar":"Universidad Pedagógica Experimental Libertador","titulo":"Taller"},{"fecha":"21/06/2002","horas":"32","lugar":"Gobernación del Estado Monagas, Instituto de la Cultura Conac","titulo":"Taller de Literatura Infantil"},{"fecha":"11 al 13/04/2002","horas":"24","lugar":"Universidad Pedagógica Experimental Libertador","titulo":"V Jornadas Institucionales de Investigación: Balance Histórico de las Letras Monaguenses"},{"fecha":"26/07/2002","horas":"12","lugar":"Gobernación del Estado Monagas, Instituto de la Cultura Conac","titulo":"Seminario de Ensayo"},{"fecha":"28 al 29/04/2008","horas":"16","lugar":"Petróleos de Venezuela, S.a.","titulo":"Power Point Intermedii"},{"fecha":"12 al 13/11/2010","horas":"16","lugar":"Petróleos de Venezuela, S.a.","titulo":"Investigación en el Aula"},{"fecha":"29 y 30/05/2003","horas":"16","lugar":"Universidad Pedagógica Experimental Libertador","titulo":"Ponente en el Taller"},{"fecha":"30/06/1999","horas":"12","lugar":"Universidad Pedagógica Experimental Libertador","titulo":"Facilitadora del Taller"}]'::jsonb,
  '[{"nivel":"Básico","titulo":"Adaptaciones Curriculares No Significativas","categoria":"Educación Inclusiva y Diversidad"}]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2002","nivel":"Licenciatura / Profesorado","titulo":"Profesor en Lengua y Literatura","institucion":"Universidad Experimental Libertador - Ipm"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Anicris Del Carmen Betancourt Espín
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '21499609',
  'Anicris Del Carmen Betancourt Espín',
  'Docente',
  'sb',
  'caroannys01@gmail.com',
  '04249383282',
  '21499609', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '21499609',
  'Femenino',
  '1990-04-22',
  'Concubino/a',
  'Calle Ruiz, Punta de Mata',
  'Informática',
  'TSU',
  'Instituto Universitario de Tecnología Caripito',
  2012,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"39","talla_braga":"40","talla_camisa":"XL","talla_calzado":"39","talla_chemise":"XL","emergencia_tel":"04128720428","talla_pantalon":"32","condicion_neuro":"Neurotípico","grupo_sanguineo":"O-","condicion_medica":"","emergencia_nombre":"Lenin Ramos"}'::jsonb,
  '{"estado":"Monagas","municipio":"Bolívar","parroquia":"Caripito","centro_votacion":"Club de Abuelos"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Lenin Vicente Ramos","conyuge_cedula":"18592595","conyuge_trabaja_pdvsa":"Trabajador(a) Activo(a)","condicion_habitabilidad":"3) Habita en condición de alquiler, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"36 Años","cedula":"18592595","nombres":"Lenin Vicente Ramos","conapdis":"No","parentesco":"Concubino(a)","estatus_pdvsa":"Trabajador(a) Activo(a)","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1989-08-04","vive_con_trabajador":"Sí"},{"edad":"55 Años","cedula":"8981181","nombres":"Graciana Carolina Spin de Betancourt","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1970-11-19","vive_con_trabajador":"No"},{"edad":"4 Años","cedula":"","nombres":"Lenin Said Ramos Betancourt","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Inicial","condicion_neuro":"Neurotípico","fecha_nacimiento":"2022-04-12","vive_con_trabajador":"Sí"},{"edad":"65 Años","cedula":"5881190","nombres":"Pedro Felipe Betancourt Padilla","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1960-07-23","vive_con_trabajador":"No"}]'::jsonb,
  '[{"fecha":"10/01/2010","horas":"16","lugar":"Mintur","titulo":"Orientación Al Turismo"},{"fecha":"30/01/2010","horas":"12","lugar":"Alcaldía del Municipio Bolívar","titulo":"Fortalecimiento de Valores, Actitudes y Logro de Metas"},{"fecha":"10/02/2010","horas":"16","lugar":"Mintur","titulo":"Relaciones Humanas"},{"fecha":"19/11/2015","horas":"8","lugar":"Sunsol Hoteles","titulo":"Seguridad y Salud Laboral"}]'::jsonb,
  '[]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2012","nivel":"TSU","titulo":"Informática","institucion":"Instituto Universitario de Tecnología Caripito"},{"anio":"2015","nivel":"Licenciatura / Profesorado","titulo":"Ing. en Informática","institucion":"Ludovico Silva"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Elika Dayana Chaviel Rondón
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '16808608',
  'Elika Dayana Chaviel Rondón',
  'Docente',
  'sb',
  'elikachaviel@gmail.com',
  '04249319096',
  '16808608', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '16808608',
  'Femenino',
  '1984-03-06',
  'Casado/a',
  'Urbanización Valle Grande, Condominio Timoteo, Manzana 3 Casa 9',
  'No registrado',
  'No registrado',
  'No registrada',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"36","talla_braga":"36","talla_camisa":"M","talla_calzado":"36","talla_chemise":"M","emergencia_tel":"04148625814","talla_pantalon":"32","condicion_neuro":"Neurotípico","grupo_sanguineo":"A-","condicion_medica":"","emergencia_nombre":"Emil Faria"}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"El Tejero","centro_votacion":"Ue Lisandro Rivero"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":6,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Emil Ramón Faria Rodríguez","conyuge_cedula":"14029604","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"16 Años","cedula":"33839858","nombres":"Angelo Emil Faria Chaviel","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2010-04-28","vive_con_trabajador":"Sí"},{"edad":"47 Años","cedula":"14029604","nombres":"Emil Ramón Faria Rodríguez","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1978-07-28","vive_con_trabajador":"Sí"},{"edad":"61 Años","cedula":"9281465","nombres":"Yasmelis del Carmen Rondón","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1964-10-18","vive_con_trabajador":"Sí"},{"edad":"17 Años","cedula":"32702425","nombres":"Emil Alejandro Faria Chaviel","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2008-10-31","vive_con_trabajador":"Sí"},{"edad":"19 Años","cedula":"32548968","nombres":"Angel Emil Faria Chaviel","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2007-01-19","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Maritza Coromoto Medina Bolívar
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '9896435',
  'Maritza Coromoto Medina Bolívar',
  'Docente',
  'sb',
  'maritza.medina435@gmail.com',
  '04143919204',
  '9896435', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '9896435',
  'Femenino',
  '1967-01-27',
  'Concubino/a',
  'Sector Campo Sur. Transversal D Casa D-3 el Tejero',
  'Profesora Educación Integral Mención Ciencias Sociales',
  'Licenciatura / Profesorado',
  'Upel-ipm',
  1995,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"39","talla_braga":"42","talla_camisa":"XL","talla_calzado":"39","talla_chemise":"XL","emergencia_tel":"041490065190424802703504242306568","talla_pantalon":"32","condicion_neuro":"Neurotípico","grupo_sanguineo":"A-","condicion_medica":"Chequeo Cada 6 Meses (paciente Oncológico)","emergencia_nombre":"Richard Alejo/ Angel Mata/ Nathacha Mata"}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"El Tejero","centro_votacion":"Complejo Educativo Santa Bárbara"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Richard Efrain Alejo Croquer","conyuge_cedula":"6133837","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"7) Habita en un inmueble asignado, propiedad de la Empresa.","prioridad":""}'::jsonb,
  '[{"edad":"63 Años","cedula":"6133837","nombres":"Richard Efrain Alejo Croquer","conapdis":"No","parentesco":"Concubino(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1962-11-15","vive_con_trabajador":"Sí"},{"edad":"76 Años","cedula":"6675535","nombres":"Nellys del Valle Bolivar de Medina","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1949-07-09","vive_con_trabajador":"No"},{"edad":"33 Años","cedula":"20598797","nombres":"Ángel José Mata Medina","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1993-02-24","vive_con_trabajador":"Sí"},{"edad":"37 Años","cedula":"19079027","nombres":"Nathacha del Valle Mata Medina","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1988-11-30","vive_con_trabajador":"No"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"1995","nivel":"Licenciatura / Profesorado","titulo":"Profesora Educación Integral Mención Ciencias Sociales","institucion":"Upel-ipm"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Maricarmen Díaz Febres
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '19090864',
  'Maricarmen Díaz Febres',
  'Docente',
  'sb',
  'diazmaricarmen346@gmail.com',
  '04129284104',
  '19090864', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '19090864',
  'Femenino',
  '1986-08-08',
  'Concubino/a',
  'Avenida Sucre, Sector el Travieso',
  'No registrado',
  'No registrado',
  'No registrada',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"38","talla_braga":"40","talla_camisa":"M","talla_calzado":"37","talla_chemise":"","emergencia_tel":"","talla_pantalon":"32","condicion_neuro":"Neurotípico","grupo_sanguineo":"A+","condicion_medica":"No","emergencia_nombre":""}'::jsonb,
  '{"estado":"Monagas","municipio":"","parroquia":"","centro_votacion":""}'::jsonb,
  '{"tipo_prestamo":"Adicional/Adquisición","num_convivientes":2,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"José Ortega","conyuge_cedula":"10838823","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"3) Habita en condición de alquiler, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"51 Años","cedula":"10838823","nombres":"José Ortega","conapdis":"No","parentesco":"Concubino(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1974-11-25","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Naireth Carolina Pérez García
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '16373334',
  'Naireth Carolina Pérez García',
  'Docente',
  'sb',
  'nairethperez83@gmail.com',
  '04249069974',
  '16373334', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '16373334',
  'Femenino',
  '1983-04-30',
  'Divorciado/a',
  'Calle Ppal los Guaros',
  'Profesor Mención Lengua Extranjera',
  'Licenciatura / Profesorado',
  'Upel - Ipm',
  2007,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"41","talla_braga":"42","talla_camisa":"L","talla_calzado":"41","talla_chemise":"L","emergencia_tel":"","talla_pantalon":"34","condicion_neuro":"Neurotípico","grupo_sanguineo":"O-","condicion_medica":"Alergia Al Polvillo. Cirugía de Hernia Discal Lumbar (2) . Cervicalgia Severa y Protrusion C4c5, C5c6, C6c7. Discopatia Degenerativa Lumbar Multininivel.","emergencia_nombre":"04249334127"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Escuela Básica Arturo Uslar Pietri"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"6) Habita en vivienda prestada, bajo su cuidado.","prioridad":""}'::jsonb,
  '[{"edad":"64 Años","cedula":"8377386","nombres":"Ledis Betzabeth García Bucarito","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1962-01-13","vive_con_trabajador":"Sí"},{"edad":"17 Años","cedula":"33471816","nombres":"Gianfranco Batipsta Bruni Pérez","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2008-11-13","vive_con_trabajador":"Sí"},{"edad":"10 Años","cedula":"37222888","nombres":"Ayliana Rosalía Bruni Pérez","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2015-12-12","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"2001","horas":"","lugar":"Manhattan English Institute","titulo":"Inglés Conversacional"}]'::jsonb,
  '[{"nivel":"Básico","titulo":"Creación de Contenidos Digitales Interactivos","categoria":"Tecnología Educativa (EdTech)"}]'::jsonb,
  '',
  '',
  '',
  '',
  'Inglés',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2007","nivel":"Licenciatura / Profesorado","titulo":"Profesor Mención Lengua Extranjera","institucion":"Upel - Ipm"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Dayvid del Valle Martínez Jiménez
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '13476169',
  'Dayvid del Valle Martínez Jiménez',
  'Docente',
  'sb',
  'martinezddu@gmail.com',
  '04124843781',
  '13476169', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '13476169',
  'Femenino',
  '1978-01-16',
  'Soltero/a',
  'Calle Rosimary, Casa #7, el Silencio de Campo Alegre.',
  'No registrado',
  'No registrado',
  'No registrada',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"38","talla_braga":"36","talla_camisa":"S","talla_calzado":"38","talla_chemise":"S","emergencia_tel":"04163426334","talla_pantalon":"28","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Vitíligo","emergencia_nombre":"Hermana Daidee Martinez"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Ji Carmen Verónica Coello"}'::jsonb,
  '{"tipo_prestamo":"Adicional/Mejoras","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"José Caña","conyuge_cedula":"15323499","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"72 Años","cedula":"4617087","nombres":"Haidee Jiménez","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1954-03-24","vive_con_trabajador":"No"},{"edad":"74 Años","cedula":"3700810","nombres":"David Martinez","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1952-02-02","vive_con_trabajador":"No"},{"edad":"47 Años","cedula":"15323499","nombres":"José Caña","conapdis":"No","parentesco":"Concubino(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1978-06-16","vive_con_trabajador":"Sí"},{"edad":"26 Años","cedula":"29589730","nombres":"David J. Caña M.","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2000-02-24","vive_con_trabajador":"No"},{"edad":"23 Años","cedula":"30079909","nombres":"Rafael A.caña M.","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2002-10-04","vive_con_trabajador":"Sí"},{"edad":"14 Años","cedula":"34357914","nombres":"Wladimir J. Caña M.","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2011-07-26","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Básico","titulo":"Paquetería Ofimática (Word, Excel, PowerPoint/Libres)","categoria":"Tecnología Educativa (EdTech)"}]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Diana Verónica Malavé Villanueva
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '14339477',
  'Diana Verónica Malavé Villanueva',
  'Docente',
  'sb',
  'malavedv@gmail.com',
  '04249572389',
  '14339477', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '14339477',
  'Femenino',
  '1980-01-10',
  'Soltero/a',
  'Urbanización Fundemos I Calle Cachipo #212o',
  'Profesora Biología',
  'Licenciatura / Profesorado',
  'Universidad Pedagógica Experimental Libertador',
  2007,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"36","talla_braga":"36","talla_camisa":"S","talla_calzado":"36","talla_chemise":"S","emergencia_tel":"04147672386","talla_pantalon":"28","condicion_neuro":"Neurotípico","grupo_sanguineo":"AB+","condicion_medica":"Cardiopatia Congénita, Hipertensión, Ansiedad","emergencia_nombre":"Ilana Marin"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Jardín de Infancia Catalina de Torres Kinder Ii"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Mejoras","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"71 Años","cedula":"4506208","nombres":"Diana Josefina Villanueva de Malavé","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1955-02-05","vive_con_trabajador":"Sí"},{"edad":"18 Años","cedula":"32708607","nombres":"Ilana Victoria Marín Malavé","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2008-01-29","vive_con_trabajador":"Sí"},{"edad":"74 Años","cedula":"4021408","nombres":"Víctor José Malavé Malavé","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1952-03-27","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"23 al 29/01/2021","horas":"14","lugar":"Creativediseños","titulo":"Diseño de Redes"},{"fecha":"Enero/ Marzo 2022","horas":"80","lugar":"Alfacreativos","titulo":"Diseño Gráfico Básico"},{"fecha":"Julio/septiembre 2022","horas":"80","lugar":"Alfacreativos","titulo":"Diseño Gráfico Avanzado"},{"fecha":"Julio/Diciembre 2007","horas":"300","lugar":"Ministerio del Poder Popular para la Educación","titulo":"La Educación Bolivariana"},{"fecha":"20 al 25/11/2011","horas":"36","lugar":"Universidad de los Andes","titulo":"Escuela Venezolana para la Enseñanza de la Quimica"},{"fecha":"7al8/06/2007","horas":"16","lugar":"Universidad Bolivariana de Venezuela","titulo":"Iii Jornada de Desarrollo Endógeno y Ambiente"},{"fecha":"3al4/07/2008","horas":"16","lugar":"Universidad Bolivariana de Venezuela","titulo":"Iv Jornadas de Desarrollo Endógeno y Ambiente"},{"fecha":"12/07/2006","horas":"8","lugar":"Upel-ipm","titulo":"I Jornada Psicología Educativa"},{"fecha":"7/06/2006","horas":"8","lugar":"Upel-ipm","titulo":"I Jornada de Parasitología Enfermedades Parasitarias Desde el Área Educativa"},{"fecha":"10al11/05/2006","horas":"16","lugar":"Upel-ipm","titulo":"Los Liceos Bolivarianos Dentro de la Educación Como un Continuo Humano. Área de Matemática y Ciencias Naturales"},{"fecha":"Noviembre 2012","horas":"36","lugar":"Universidad de los Andes","titulo":"Escuela Venezolana para la Enseñanza de la Quimica"},{"fecha":"Diciembre 2013","horas":"36","lugar":"Ivic /universidad de los Andes","titulo":"Ecología y Ambiente"},{"fecha":"Junio 2005/2006","horas":"16","lugar":"Upel-ipm","titulo":"Ii y Iii Jornada de Embriologia"},{"fecha":"13/07/2005","horas":"8","lugar":"Upel-ipm","titulo":"Foro Bioinorganica Química del Cuerpo"},{"fecha":"30/04/2004","horas":"8","lugar":"Pdvsa/upel-ipm","titulo":"Seminario de Investigación la Cuestión de la Complejidad y Lo Significativo en la Educación"},{"fecha":"25/02/2011 - 24/04/2014 - 20/11/2014","horas":"24","lugar":"Pdvsa","titulo":"Vi, X,xi Foro Prevención de Accidentes"},{"fecha":"5al6/4/2011","horas":"16","lugar":"Pdvsa","titulo":"Ética y Valores Socialistas"},{"fecha":"11al12/11/2013","horas":"16","lugar":"Pdvsa","titulo":"Clima Organizacional"},{"fecha":"25 al26/03/2014","horas":"16","lugar":"Pdvsa","titulo":"Procesos de Transformación de la Cultura Escolar Bajo el Enfoque de la Didáctica Crítica"},{"fecha":"10/09/2022","horas":"8","lugar":"Pdvsa","titulo":"Creación de Podcast para Docentes"},{"fecha":"9/09/2022","horas":"8","lugar":"Pdvsa","titulo":"Diseño Gráfico Intermedio para Docentes"},{"fecha":"16/12/2017 al 1/01/2018","horas":"60","lugar":"Ubtjr","titulo":"Autoformación Colectiva Inkscape Básico"}]'::jsonb,
  '[{"nivel":"Básico","titulo":"Design Thinking para Innovación Educativa","categoria":"Innovación y Desarrollo Profesional"},{"nivel":"Básico","titulo":"Diseño Programático de Contenidos Educativos","categoria":"Formación Pedagógica y Didáctica"},{"nivel":"Básico","titulo":"Huella Ecológica del Aula: Proyectos de Sostenibilidad","categoria":"Formación Pedagógica y Didáctica"},{"nivel":"Básico","titulo":"Investigación-Acción en el Aula: Mejora Continua","categoria":"Innovación y Desarrollo Profesional"},{"nivel":"Básico","titulo":"Inteligencia Emocional para Liderar el Aula","categoria":"Gestión y Liderazgo Educativo"}]'::jsonb,
  'Participación y Formación en Otras Áreas Inherentes a la Empresa, Estudios Avanzados Como Diplomados, Maestrías y Postgrados Además de la Formación Constante en el Área de Educación, Tecnología y Ciencias Naturales.',
  '',
  '',
  '',
  'Inglés (básico) Portugués (básico)',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2007","nivel":"Licenciatura / Profesorado","titulo":"Profesora Biología","institucion":"Universidad Pedagógica Experimental Libertador"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Lourdes Elena Guerra De Galban
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '18463048',
  'Lourdes Elena Guerra De Galban',
  'Docente',
  'sb',
  'guerralou.17@gmail.com',
  NULL,
  '18463048', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '18463048',
  'Femenino',
  '1986-10-05',
  'Casado/a',
  'Sector Brisas de Muri',
  'Licenciado en Educación',
  'Licenciatura / Profesorado',
  'Universidad Bolivariana de Venezuela',
  2011,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"38","talla_braga":"40","talla_camisa":"XL","talla_calzado":"39","talla_chemise":"XL","emergencia_tel":"04140916924","talla_pantalon":"38","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"","emergencia_nombre":""}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"Punta de Mata","centro_votacion":"U e Nicolás Aranguren"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"José Galbán","conyuge_cedula":"16518081","conyuge_trabaja_pdvsa":"Trabajador(a) Activo(a)","condicion_habitabilidad":"","prioridad":""}'::jsonb,
  '[{"edad":"45 Años","cedula":"16518081","nombres":"José Galbán","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Trabajador(a) Activo(a)","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1981-01-07","vive_con_trabajador":"Sí"},{"edad":"12 Años","cedula":"36238216","nombres":"Daniela Galbán","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2014-04-24","vive_con_trabajador":"Sí"},{"edad":"7 Años","cedula":"11818463048","nombres":"Aarón Galbán","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2018-12-17","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"01/09/12","horas":"16","lugar":"Casa Bolivariana de la Mujer Zamorana","titulo":"Foami Escolar"},{"fecha":"09/08/2012","horas":"44","lugar":"Casa Bolivariana de la Mujer Zamorana","titulo":"Dibujo y Pintura Artística"},{"fecha":"07/08/2009","horas":"16","lugar":"Universidad Bolivariana de Venezuela","titulo":"La Planificación en el Subsistema de Educación Inicial"},{"fecha":"11/05/2021","horas":"12","lugar":"Centro Simón Rodríguez","titulo":"Maltrato Infantil"},{"fecha":"19/05/2021","horas":"12","lugar":"Centro Simón Rodríguez","titulo":"Terapia de Lenguaje"},{"fecha":"03/05/2021","horas":"10","lugar":"Fundación Profuturo","titulo":"Ruta Innovación"},{"fecha":"03/05/2021","horas":"40","lugar":"Fundación Profuturo","titulo":"Revoluciona Tu Aula"},{"fecha":"24/12/25","horas":"46","lugar":"Fundación Profuturo","titulo":"Matemáticas Al Alcance de Todos"},{"fecha":"05/07/2021","horas":"10","lugar":"Fundación Profuturo","titulo":"Matemáticas Al Alcance de Todos"}]'::jsonb,
  '[{"nivel":"Avanzado","titulo":"Comunicación Asertiva y Resolución de Conflictos","categoria":"Gestión y Liderazgo Educativo"},{"nivel":"Intermedio","titulo":"Creación de Contenidos Digitales Interactivos","categoria":"Tecnología Educativa (EdTech)"},{"nivel":"Avanzado","titulo":"Automatización de Tareas Docentes con IA","categoria":"Tecnología Educativa (EdTech)"},{"nivel":"Intermedio","titulo":"Oratoria y Comunicación Efectiva para Educadores","categoria":"Innovación y Desarrollo Profesional"},{"nivel":"Avanzado","titulo":"Diseño y Desarrollo Web","categoria":"Tecnología Educativa (EdTech)"}]'::jsonb,
  'Capacitación Técnica y Pedagógica Que Cuenten con Certificación Oficial, Garantizando Que el Tiempo de Formación Sea Acreditado para el Crecimiento Profesional de los Docentes.',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2011","nivel":"Licenciatura / Profesorado","titulo":"Licenciado en Educación","institucion":"Universidad Bolivariana de Venezuela"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: María Del Valle Marcano Orta
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '14859468',
  'María Del Valle Marcano Orta',
  'Docente',
  'sb',
  'mariamarcano3110@gmail.com',
  '04148977788',
  '14859468', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '14859468',
  'Femenino',
  '1978-10-19',
  'Casado/a',
  'Av. Libertador. Conjunto Residencial los Jardines. Edificio las Rosas Pb-b',
  'Profesor: Especialidad Educación Prescolar',
  'Licenciatura / Profesorado',
  'Upel - Ipm',
  2002,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"38","talla_braga":"40","talla_camisa":"XXL","talla_calzado":"37","talla_chemise":"XXL","emergencia_tel":"0416383973084","talla_pantalon":"38","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Rinitis Alérgica Atópica, Hipotiroidismo e Hiperinsulinismo. Alergia a los Mariscos, Cloro, Humedad. Hemangioma Vertebral","emergencia_nombre":"Maria Emilia Marcano Orta"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Escuela Básica Victoria Ramírez"}'::jsonb,
  '{"tipo_prestamo":"Adicional/Mejoras","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Héctor Javier Córdova","conyuge_cedula":"12163360","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"50 Años","cedula":"12163360","nombres":"Héctor Javier Córdova","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1976-02-21","vive_con_trabajador":"Sí"},{"edad":"1 Años","cedula":"","nombres":"Héctor Jesús Córdova Marcano","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"No Escolarizado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2024-10-11","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"Julio 2024","horas":"16","lugar":"Ong Mentor y Brain Dx de México","titulo":"Taller Internacional de Educación Inclusiva"},{"fecha":"Octubre 2024","horas":"8","lugar":"Universidad Nacional Abierta Monagas","titulo":"Uso de las Tic''s Planificación de Educación Inicial"},{"fecha":"Abril 2024","horas":"5","lugar":"Mppe - Coord. Educación Básica y Calidad Educativa Educación Inicial Punta de Mata","titulo":"Jornada de Actualización, Planificación Evaluación y Ambientes de Aprendizaje en el Nivel de Educación Inicial"}]'::jsonb,
  '[{"nivel":"Básico","titulo":"Rúbricas y Portafolios Digitales para Evaluar Competencias","categoria":"Evaluación y Medición del Aprendizaje"},{"nivel":"Básico","titulo":"Plataformas de Evaluación en Línea","categoria":"Evaluación y Medición del Aprendizaje"},{"nivel":"Básico","titulo":"Detección y Primeras Respuestas ante Dificultades","categoria":"Educación Inclusiva y Diversidad"}]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2002","nivel":"Licenciatura / Profesorado","titulo":"Profesor: Especialidad Educación Prescolar","institucion":"Upel - Ipm"},{"anio":"2000","nivel":"TSU","titulo":"Maestro: Especialidad Preescolar","institucion":"Upel - Ipm"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Ana Damelis Figueroa Gil
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '16939474',
  'Ana Damelis Figueroa Gil',
  'Docente',
  'sb',
  'Profa.anafigueroa@gmail.com',
  '04148607854',
  '16939474', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '16939474',
  'Femenino',
  '1984-04-26',
  'Casado/a',
  'Sector los Samanes Apamates a Calle 1 Casa 14',
  'Profesora en Biología',
  'Licenciatura / Profesorado',
  'Universidad Pedagógica Experimental Libertador Maturín',
  2010,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"38","talla_braga":"36","talla_camisa":"M","talla_calzado":"37","talla_chemise":"M","emergencia_tel":"04128320385","talla_pantalon":"34","condicion_neuro":"Neurotípico","grupo_sanguineo":"A+","condicion_medica":"Ninguna","emergencia_nombre":"Mi Esposo Fiyar Valera"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Santa Cruz","centro_votacion":"Centro de Educación Inicial Caripe"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Mejoras","num_convivientes":5,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Fiyar José Valera Madriz","conyuge_cedula":"14.619.768","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"1) Habita en condición de hacinamiento, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"45 Años","cedula":"14.619.768","nombres":"Fiyar José Valera Madriz","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1981-03-14","vive_con_trabajador":"Sí"},{"edad":"11 Años","cedula":"36826960","nombres":"Fiyar Adrián Valera Figueroa","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2014-10-31","vive_con_trabajador":"Sí"},{"edad":"9 Años","cedula":"","nombres":"Ariadne Lucía Valera Figueroa","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2017-02-14","vive_con_trabajador":"Sí"},{"edad":"5 Años","cedula":"","nombres":"Ariana Trinidad Valera Figueroa","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Inicial","condicion_neuro":"Neurotípico","fecha_nacimiento":"2020-09-08","vive_con_trabajador":"Sí"},{"edad":"77 Años","cedula":"3347521","nombres":"Freidora Celestino Figueroa Guaipo","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1948-07-26","vive_con_trabajador":"No"},{"edad":"74 Años","cedula":"3824649","nombres":"Damelis María Gil González","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1951-12-29","vive_con_trabajador":"No"}]'::jsonb,
  '[{"fecha":"Maturín 24 de abril 2014","horas":"4","lugar":"Seguridad Industrial Pdvsa","titulo":"X Foro de Prevención de Accidentes Producción Oriente"},{"fecha":"26 al 27 septiembre 2012","horas":"16","lugar":"Pdvsa","titulo":"Taller Económia, Energía y Ambiente"},{"fecha":"20 al 21 de septiembre  de 2012","horas":"16","lugar":"Pdvsa","titulo":"Estrategias de Facilitación de Contenidos, Auspiciando el Pensamiento Crítico."},{"fecha":"23 al 24 de enero de 2008","horas":"16","lugar":"Upel- Instituto Pedagógico de Maturín","titulo":"Iv Jornada de Embriologia y I Jornada de Anatomía y Fisiología Animal. \"educación Preventiva: Miradas para la Trabsformacion\""},{"fecha":"7  junio 2006","horas":"8","lugar":"Upel- Instituto Pedagógico de Maturín","titulo":"I Jornada de Parasitología:\"enfermedades Parasitariasy Sus Prevención Desde el Área Educativa"}]'::jsonb,
  '[]'::jsonb,
  '-formaciones Continuas Sobre el Que Hacer Educativo. -relaciones Interpersonales en el Ámbito Laboral. -planificación y Elaboración de Estrategias Educativas.',
  '',
  '',
  '',
  'Inglés Básico',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2010","nivel":"Licenciatura / Profesorado","titulo":"Profesora en Biología","institucion":"Universidad Pedagógica Experimental Libertador Maturín"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Ingrid Lorena Centeno Gamboa
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '15322399',
  'Ingrid Lorena Centeno Gamboa',
  'Docente',
  'sb',
  'Ingridlcg085@gmail.com',
  '04249385717',
  '15322399', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '15322399',
  'Femenino',
  '1981-03-30',
  'Soltero/a',
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
  '{"conapdis":"No","talla_botas":"37","talla_braga":"36","talla_camisa":"M","talla_calzado":"37","talla_chemise":"M","emergencia_tel":"04126994442","talla_pantalon":"30","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"","emergencia_nombre":"04249308270"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Cruz Figuera Rondón"}'::jsonb,
  '{"tipo_prestamo":"Adicional/Adquisición","num_convivientes":2,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"","prioridad":""}'::jsonb,
  '[{"edad":"15 Años","cedula":"34100659","nombres":"Jesus Medina","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2011-03-25","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  'No',
  '',
  '',
  '',
  'Profesoras de Preescolar',
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Oswaldo José Rojas Caraballo
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '10884281',
  'Oswaldo José Rojas Caraballo',
  'Docente',
  'sb',
  'ojrcpdvsa@gmail.com',
  '04126336203',
  '10884281', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '10884281',
  'Masculino',
  '1971-06-24',
  'Divorciado/a',
  'Conjunto Residencial Armonía Torre 5 - Piso 4 Apartamento 4-a Calle Juan Maldonado Urbanización Juanico',
  'No registrado',
  'No registrado',
  'No registrada',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"44","talla_braga":"38","talla_camisa":"XL","talla_calzado":"44","talla_chemise":"XL","emergencia_tel":"04123870198","talla_pantalon":"36","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Hipertensión Arterial","emergencia_nombre":"Arlenis Rojas"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"San Simón","centro_votacion":"Unidad Educativa República del Uruguay"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":1,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"29 Años","cedula":"25892842","nombres":"Julio Juan José Rojas Moreno","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1997-02-07","vive_con_trabajador":"No"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Creación de Contenidos Digitales Interactivos","categoria":"Tecnología Educativa (EdTech)"}]'::jsonb,
  '',
  '',
  '',
  '',
  'Inglés',
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Karina Del Carmen Marcano Goitte
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '12968674',
  'Karina Del Carmen Marcano Goitte',
  'Docente',
  'sb',
  'karigoitte76@gmail.com',
  '04162987100',
  '12968674', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '12968674',
  'Femenino',
  '1976-02-10',
  'Casado/a',
  'Urbanización la Esmeralda Calle #2 Casa D-04',
  'Licenciada en Educación',
  'Licenciatura / Profesorado',
  'Universidad Bolivariana',
  2012,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"","talla_braga":"","talla_camisa":"","talla_calzado":"","talla_chemise":"","emergencia_tel":"","talla_pantalon":"","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"","emergencia_nombre":""}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"Punta de Mata","centro_votacion":"Escuela Básica 18 de Mayo"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Mejoras","num_convivientes":5,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Anderson José Barreto Rondón","conyuge_cedula":"13655080","conyuge_trabaja_pdvsa":"Trabajador(a) Activo(a)","condicion_habitabilidad":"1) Habita en condición de hacinamiento, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"48 Años","cedula":"13655080","nombres":"Anderson José Barreto Rondón","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Trabajador(a) Activo(a)","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1978-02-22","vive_con_trabajador":"Sí"},{"edad":"24 Años","cedula":"29642096","nombres":"Anderson Rafael Barreto Marcano","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2001-11-27","vive_con_trabajador":"Sí"},{"edad":"22 Años","cedula":"30563906","nombres":"Fabian Alejandro Barreto Marcano","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2003-09-27","vive_con_trabajador":"Sí"},{"edad":"16 Años","cedula":"32973894","nombres":"Christopher José Barreto Marcano","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2009-07-26","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Básico","titulo":"Design Thinking para Innovación Educativa","categoria":"Innovación y Desarrollo Profesional"}]'::jsonb,
  'Actualización',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2012","nivel":"Licenciatura / Profesorado","titulo":"Licenciada en Educación","institucion":"Universidad Bolivariana"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Milagros Alexandra Bolívar Figueredo
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '14192913',
  'Milagros Alexandra Bolívar Figueredo',
  'Docente',
  'sb',
  'bolivarfiguemilagrosa@gmail.com@gmail.com',
  '04148532210',
  '14192913', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '14192913',
  'Femenino',
  '1978-04-04',
  'Soltero/a',
  'Punta de Mata, Municipio Ezequiel Zamora',
  'Licenciado',
  'Licenciatura / Profesorado',
  'Universidad Bolivariana de Venezuela',
  2012,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"38","talla_braga":"42","talla_camisa":"XL","talla_calzado":"38","talla_chemise":"XL","emergencia_tel":"","talla_pantalon":"36","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Olores Químico","emergencia_nombre":""}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"Punta de Mata","centro_votacion":"Escuela Básica Alberto Ravell"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":6,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"José Rondón","conyuge_cedula":"19490396","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"2) Habita en condición de arrimado, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"78 Años","cedula":"2234002","nombres":"Sara Figueredo","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1947-09-27","vive_con_trabajador":"Sí"},{"edad":"41 Años","cedula":"19490396","nombres":"José Rondón","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1985-01-29","vive_con_trabajador":"Sí"},{"edad":"29 Años","cedula":"25355757","nombres":"Sandra Chacon","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1996-10-12","vive_con_trabajador":"Sí"},{"edad":"31 Años","cedula":"23524085","nombres":"Aaron Chacon","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1995-04-26","vive_con_trabajador":"Sí"},{"edad":"27 Años","cedula":"26650457","nombres":"Delvis Chacon Bolívar","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1998-11-28","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"06/05/2013","horas":"24","lugar":"Centro de Formación Petrolera Querecual C.a","titulo":"Perforación. Mecánico Ayudante"},{"fecha":"20 y 21-04-2013","horas":"16","lugar":"Sha de Venezuela","titulo":"Certificado Ocupacional - Operaciones de Taladros Petroleros"}]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Programación Neurolingüística (PNL) en el Aula","categoria":"Gestión y Liderazgo Educativo"}]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2012","nivel":"Licenciatura / Profesorado","titulo":"Licenciado","institucion":"Universidad Bolivariana de Venezuela"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Irvimar Josefina Fernández Guzmán
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '17090342',
  'Irvimar Josefina Fernández Guzmán',
  'Docente',
  'sb',
  'irvimar.f@gmail.com',
  NULL,
  '17090342', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '17090342',
  'Femenino',
  '1986-03-03',
  'Soltero/a',
  'Urbanización Canaima Calle G Casa 21',
  'Profesora',
  'Licenciatura / Profesorado',
  'Upel',
  2010,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"37","talla_braga":"38","talla_camisa":"M","talla_calzado":"37","talla_chemise":"M","emergencia_tel":"04249259787","talla_pantalon":"30","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"","emergencia_nombre":"Mis Padres"}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"Punta de Mata","centro_votacion":"E.b Doña Menca de Leoni"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"1) Habita en condición de hacinamiento, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"10 Años","cedula":"37200290","nombres":"Xavier Enrique García Fernández","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2016-01-15","vive_con_trabajador":"Sí"},{"edad":"60 Años","cedula":"9412649","nombres":"Mirian Josefina Guzmán de Fernández","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1965-07-19","vive_con_trabajador":"Sí"},{"edad":"71 Años","cedula":"5153077","nombres":"Juan Rafael Fernández Suárez","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1954-12-05","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2010","nivel":"Licenciatura / Profesorado","titulo":"Profesora","institucion":"Upel"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Neruska Mayerling Perozo Ramos
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '17719002',
  'Neruska Mayerling Perozo Ramos',
  'Docente',
  'sb',
  'neruperozo@gmail.com',
  '04147269667',
  '17719002', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '17719002',
  'Femenino',
  '1985-08-07',
  'Soltero/a',
  'Urbanización los Girasoles, Parroquia la Cruz',
  'Licenciado en Educación',
  'Licenciatura / Profesorado',
  'Universidad Bolivariana de Venezuela',
  2011,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"","talla_braga":"","talla_camisa":"","talla_calzado":"","talla_chemise":"","emergencia_tel":"","talla_pantalon":"","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"","emergencia_nombre":""}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"Punta de Mata","centro_votacion":"Unidad Educativa las Parcelas"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"","prioridad":""}'::jsonb,
  '[{"edad":"10 Años","cedula":"37258566","nombres":"Aisha Susej Rebeck Perozo","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2015-10-07","vive_con_trabajador":"Sí"},{"edad":"21 Años","cedula":"30933302","nombres":"Neyumar Rosana Ascanio Perozo","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2004-11-24","vive_con_trabajador":"Sí"},{"edad":"24 Años","cedula":"28247591","nombres":"Marcos David Ascanio Perozo","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2001-08-01","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Avanzado","titulo":"Creación de Contenidos Digitales Interactivos","categoria":"Tecnología Educativa (EdTech)"},{"nivel":"Avanzado","titulo":"Inteligencia Artificial para el Aula","categoria":"Tecnología Educativa (EdTech)"},{"nivel":"Avanzado","titulo":"Automatización de Tareas Docentes con IA","categoria":"Tecnología Educativa (EdTech)"},{"nivel":"Avanzado","titulo":"Oratoria y Comunicación Efectiva para Educadores","categoria":"Innovación y Desarrollo Profesional"},{"nivel":"Avanzado","titulo":"Rúbricas y Portafolios Digitales para Evaluar Competencias","categoria":"Evaluación y Medición del Aprendizaje"}]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2011","nivel":"Licenciatura / Profesorado","titulo":"Licenciado en Educación","institucion":"Universidad Bolivariana de Venezuela"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Vasny Rafael Jauregui Rodríguez
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '12288989',
  'Vasny Rafael Jauregui Rodríguez',
  'Docente',
  'sb',
  'vasnyjauregui@gmail.com',
  '04249295981',
  '12288989', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '12288989',
  'Masculino',
  '1973-05-05',
  'Casado/a',
  'No registrada',
  'Administración de Recursos Humanos',
  'Licenciatura / Profesorado',
  'Simon Rodriguez',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"41","talla_braga":"40","talla_camisa":"XXL","talla_calzado":"41","talla_chemise":"XXL","emergencia_tel":"04249298141","talla_pantalon":"40","condicion_neuro":"Neurotípico","grupo_sanguineo":"A+","condicion_medica":"","emergencia_nombre":"Yolimar de Jauregui"}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"Punta de Mata","centro_votacion":"Centro Educativo Cayetano Farias"}'::jsonb,
  '{"tipo_prestamo":"Adicional/Mejoras","num_convivientes":2,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Yolimar del Valle de Jauregui","conyuge_cedula":"16486650","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"5) Habita en vivienda catalogada de alto riesgo, así declarado por la autoridad competente (Protección Civil o Bomberos)","prioridad":""}'::jsonb,
  '[{"edad":"46 Años","cedula":"16486650","nombres":"Yolimar del Valle de Jauregui","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1979-09-28","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Edición de Videos Educativos","categoria":"Tecnología Educativa (EdTech)"}]'::jsonb,
  'Excel Básico e Intermedio',
  '',
  '',
  '',
  'Ingles Basico',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"","nivel":"Licenciatura / Profesorado","titulo":"Administración de Recursos Humanos","institucion":"Simon Rodriguez"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Ana Celeste Cordero Herrera
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '14853914',
  'Ana Celeste Cordero Herrera',
  'Docente',
  'sb',
  'corderoceleste365@gmail.com',
  '04148773757',
  '14853914', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '14853914',
  'Femenino',
  '1980-06-14',
  'Soltero/a',
  'Calle Nueva, Punta de Mata',
  'Licenciada en Educación Inicial',
  'Licenciatura / Profesorado',
  'Simón Rodríguez',
  2009,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"","talla_braga":"","talla_camisa":"","talla_calzado":"","talla_chemise":"","emergencia_tel":"","talla_pantalon":"","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"","emergencia_nombre":""}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"Punta de Mata","centro_votacion":"Eb Rafael Villavicencio"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":2,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"4) Habita en condición de alquiler, con solicitud u orden de desalojo.","prioridad":""}'::jsonb,
  '[{"edad":"11 Años","cedula":"36367785","nombres":"Marcus Díaz Cordero","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2014-12-01","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2009","nivel":"Licenciatura / Profesorado","titulo":"Licenciada en Educación Inicial","institucion":"Simón Rodríguez"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Karina Andrea Navarro González
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '17302888',
  'Karina Andrea Navarro González',
  'Docente',
  'sb',
  'karinnanavarroo425@gmail.com',
  '04129455074',
  '17302888', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '17302888',
  'Femenino',
  '1983-08-17',
  'Soltero/a',
  'Urbanización el Samán, Punta de Mata',
  'No registrado',
  'No registrado',
  'No registrada',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"39","talla_braga":"36","talla_camisa":"M","talla_calzado":"38","talla_chemise":"M","emergencia_tel":"04126953482","talla_pantalon":"32","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Ninguna","emergencia_nombre":"Enock Rivas (hijo) Mi Madre"}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"Punta de Mata","centro_votacion":"Panaderia y Productividad el Samán, Punta de Mata."}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"21 Años","cedula":"31011754","nombres":"Enock Gabriel Rivas Navarro","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2004-06-01","vive_con_trabajador":"Sí"},{"edad":"15 Años","cedula":"33839628","nombres":"Katlyn Andrea Rivas Navarro","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2011-01-18","vive_con_trabajador":"Sí"},{"edad":"62 Años","cedula":"23531309","nombres":"Gloria Patricia González Rodríguez","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1963-11-03","vive_con_trabajador":"No"},{"edad":"74 Años","cedula":"23138362","nombres":"Henrry Navarro Parra","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"No Escolarizado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1951-12-13","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  'Actualización en el uso de Excel.  ',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Dayana Alexandra Funes Oliveros
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '17042206',
  'Dayana Alexandra Funes Oliveros',
  'Docente',
  'sb',
  'funesdayana80@gmail.com',
  '04122961844',
  '17042206', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '17042206',
  'Femenino',
  '1984-01-07',
  'Soltero/a',
  'Campo Sur, Calle 1, Casa 1-7a',
  'Licenciada en Psicología',
  'Licenciatura / Profesorado',
  'Universidad Bicentenaria de Aragua',
  2007,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"39","talla_braga":"44","talla_camisa":"XL","talla_calzado":"38","talla_chemise":"XL","emergencia_tel":"04128625656","talla_pantalon":"40","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Epilepsia Focal, Hipertensión Arterial y Síndrome Metabólico","emergencia_nombre":"Marbella Oliveros"}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"El Tejero","centro_votacion":"Unidad Educativa Santa Bárbara"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"2) Habita en condición de arrimado, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"17 Años","cedula":"33.413.922","nombres":"Sebastian Augusto Carapaica Funes","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2009-01-09","vive_con_trabajador":"Sí"},{"edad":"5 Años","cedula":"","nombres":"Manuela Esperanza Funes Oliveros","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Inicial","condicion_neuro":"Neurotípico","fecha_nacimiento":"2020-05-08","vive_con_trabajador":"Sí"},{"edad":"68 Años","cedula":"4625499","nombres":"Gregoria Josefina Oliveros de Funes","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1957-07-26","vive_con_trabajador":"No"},{"edad":"77 Años","cedula":"3203497","nombres":"Alejandro Funes","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1948-06-06","vive_con_trabajador":"No"}]'::jsonb,
  '[{"fecha":"Septiembre 2023","horas":"120","lugar":"Sociedad Venezolana de Psicología Clínica y de la Salud","titulo":"Diplomado Terapia de Parejas"},{"fecha":"Septiembre 2024","horas":"120","lugar":"Sociedad Venezolana de Psicología Clínica y de la Salud","titulo":"Diplomado Abordaje de los Trastornos de Ansiedad"}]'::jsonb,
  '[]'::jsonb,
  'Psicología Educativa',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2007","nivel":"Licenciatura / Profesorado","titulo":"Licenciada en Psicología","institucion":"Universidad Bicentenaria de Aragua"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Deliz Violeta Clementt Betancourt
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '17240765',
  'Deliz Violeta Clementt Betancourt',
  'Docente',
  'sb',
  'delizclementt@gmail.com',
  '04120911478',
  '17240765', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '17240765',
  'Femenino',
  '1983-12-04',
  'Soltero/a',
  'Urbanización Laguna Paraíso Calle J Villa 383',
  'Lengua y Literatura',
  'Licenciatura / Profesorado',
  'Upel-ipm',
  2007,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"","talla_braga":"","talla_camisa":"","talla_calzado":"","talla_chemise":"","emergencia_tel":"","talla_pantalon":"","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"","emergencia_nombre":""}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Las Cocuizas","centro_votacion":"E.b. Andrés Bello"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":5,"discapacidad_trabajador":"No","discapacidad_familiar":"Sí","conyuge_nombre":"Emilio Barreto","conyuge_cedula":"12791252","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"","prioridad":""}'::jsonb,
  '[{"edad":"56 Años","cedula":"12791252","nombres":"Emilio Barreto","conapdis":"No","parentesco":"Concubino(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1969-08-04","vive_con_trabajador":"Sí"},{"edad":"11 Años","cedula":"36785494","nombres":"Gabriel Emilio Barreto Clementt","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2014-09-27","vive_con_trabajador":"Sí"},{"edad":"9 Años","cedula":"11617240765","nombres":"Aarón Emilio Barreto Clementt","conapdis":"Sí","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurodivergente","fecha_nacimiento":"2016-05-28","vive_con_trabajador":"Sí"},{"edad":"10 Años","cedula":"11526228308","nombres":"Santiago Emilio Barreto","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2015-12-30","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2007","nivel":"Licenciatura / Profesorado","titulo":"Lengua y Literatura","institucion":"Upel-ipm"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: María Gabriela Smith De Lucas
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '18652761',
  'María Gabriela Smith De Lucas',
  'Docente',
  'sb',
  'profamariasmith@gmail.com',
  '04249206699',
  '18652761', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '18652761',
  'Femenino',
  '1987-09-16',
  'Casado/a',
  'Calle 1,manzana 3, Casa 10,urb Valle Grande Country, Sector 3, los Sauces, Condominio Mucuchies',
  'Profesor Mención Física',
  'Licenciatura / Profesorado',
  'Upel /ipm',
  2010,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"41","talla_braga":"40","talla_camisa":"L","talla_calzado":"40","talla_chemise":"L","emergencia_tel":"04167926910","talla_pantalon":"30","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"","emergencia_nombre":"José Ángel Lucas"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Eb Miguel Eduardo Turmero"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":6,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"José Ángel Lucas Carrasquel","conyuge_cedula":"14703619","conyuge_trabaja_pdvsa":"Trabajador(a) Activo(a)","condicion_habitabilidad":"1) Habita en condición de hacinamiento, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"11 Años","cedula":"36882058","nombres":"Jesús Gabriel Lucas Smith","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2015-01-14","vive_con_trabajador":"Sí"},{"edad":"8 Años","cedula":"1718652761","nombres":"María José Lucas Smith","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2017-10-17","vive_con_trabajador":"Sí"},{"edad":"6 Años","cedula":"0418652761","nombres":"María Belén Lucas Smith","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2019-06-04","vive_con_trabajador":"Sí"},{"edad":"79 Años","cedula":"2635145","nombres":"Reina Orminda Williams Salazar","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1947-01-06","vive_con_trabajador":"Sí"},{"edad":"45 Años","cedula":"14703619","nombres":"José Ángel Lucas Carrasquel","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Trabajador(a) Activo(a)","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1980-06-23","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Avanzado","titulo":"Estrategias para la Gestión del Estrés Estudiantil","categoria":"Gestión y Liderazgo Educativo"}]'::jsonb,
  'Decisiones con Propósito, Liderazgo Personal y Sexualidad.',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2010","nivel":"Licenciatura / Profesorado","titulo":"Profesor Mención Física","institucion":"Upel /ipm"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: María Gabriela Rodríguez Marín
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '19446707',
  'María Gabriela Rodríguez Marín',
  'Docente',
  'sb',
  'mg.rodrig0305@gmail.com',
  '04249335040',
  '19446707', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '19446707',
  'Femenino',
  '1989-05-03',
  'Soltero/a',
  'Urbanización la Esmeralda. Calle 2 Casa Aii-14.',
  'Profesora de Educación Especial en Dificultades de Aprendizaje',
  'Licenciatura / Profesorado',
  'Universidad Experimental Pedagógica',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"39","talla_braga":"42","talla_camisa":"XXL","talla_calzado":"39","talla_chemise":"XXL","emergencia_tel":"04140978018","talla_pantalon":"40","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Ninguna","emergencia_nombre":"José Miguel Rivero"}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"Punta de Mata","centro_votacion":"Escuela Básica Doña Menca de Leonis"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Mejoras","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"7) Habita en un inmueble asignado, propiedad de la Empresa.","prioridad":""}'::jsonb,
  '[{"edad":"9 Años","cedula":"37570238","nombres":"María Verónica Rivero Rodríguez","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2016-10-17","vive_con_trabajador":"Sí"},{"edad":"3 Años","cedula":"","nombres":"María Sofía Rivero Rodríguez","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"No Escolarizado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2022-12-01","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '',
  '',
  '',
  '',
  'Inglés (poco)',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"","nivel":"Licenciatura / Profesorado","titulo":"Profesora de Educación Especial en Dificultades de Aprendizaje","institucion":"Universidad Experimental Pedagógica"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Elimar Milagros Velásquez Rodríguez
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '17090104',
  'Elimar Milagros Velásquez Rodríguez',
  'Docente',
  'sb',
  'Velásquezelimar40@gmail.com',
  '04140854316',
  '17090104', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '17090104',
  'Femenino',
  '1983-07-14',
  'Casado/a',
  'No registrada',
  'Licenciado en Educación Integral',
  'Licenciatura / Profesorado',
  'Universidad Nacional Experimental Simón Rodríguez',
  2008,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"38","talla_braga":"38","talla_camisa":"M","talla_calzado":"38","talla_chemise":"M","emergencia_tel":"04126970988","talla_pantalon":"30","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"","emergencia_nombre":"Mi Esposo Elisaul Marcano"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Santa Cruz","centro_votacion":"Conplejo Educativo Roraima \"las Carolinas"}'::jsonb,
  '{"tipo_prestamo":"Adicional/Adquisición","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Marcano Velásquez","conyuge_cedula":"Elisaul David","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"","prioridad":""}'::jsonb,
  '[{"edad":"38 Años","cedula":"Elisaul David","nombres":"Marcano Velásquez","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1988-02-11","vive_con_trabajador":"Sí"},{"edad":"15 Años","cedula":"33834470","nombres":"Tatiana Anthonella, Marcano Velásquez","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2011-04-05","vive_con_trabajador":"Sí"},{"edad":"13 Años","cedula":"35005069","nombres":"Elisaul José Marcano Velásquez","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2013-02-18","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"03-02- 2026","horas":"8","lugar":"Cefosez","titulo":"Primeros Auxilios"}]'::jsonb,
  '[{"nivel":"Básico","titulo":"Paquetería Ofimática (Word, Excel, PowerPoint/Libres)","categoria":"Tecnología Educativa (EdTech)"}]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2008","nivel":"Licenciatura / Profesorado","titulo":"Licenciado en Educación Integral","institucion":"Universidad Nacional Experimental Simón Rodríguez"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Yelitza Carolina Díaz Pacedo
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '18274614',
  'Yelitza Carolina Díaz Pacedo',
  'Docente',
  'sb',
  'yelitzadiaz24@gmail.com',
  '04249688473',
  '18274614', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '18274614',
  'Femenino',
  '1987-12-14',
  'Casado/a',
  'Urbanización los Apamates Condominio C, Casa 15',
  'No registrado',
  'No registrado',
  'No registrada',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"40","talla_braga":"42","talla_camisa":"XL","talla_calzado":"40","talla_chemise":"XL","emergencia_tel":"04242229334","talla_pantalon":"44","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"Rhinitis Alergicas","emergencia_nombre":"04249260414"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Preescolar Oscar Lugo"}'::jsonb,
  '{"tipo_prestamo":"Adicional/Mejoras","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"1) Habita en condición de hacinamiento, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"1 Años","cedula":"12418274614","nombres":"Rebeca Elisabeth Quijada Diaz","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Inicial","condicion_neuro":"Neurotípico","fecha_nacimiento":"2024-11-12","vive_con_trabajador":"Sí"},{"edad":"6 Años","cedula":"11918274614","nombres":"Luciano Alejandro Díaz Pacedo","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2019-11-06","vive_con_trabajador":"Sí"},{"edad":"14 Años","cedula":"34575377","nombres":"Sebasthian Josue Guacarán Díaz","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2012-04-23","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Paquetería Ofimática (Word, Excel, PowerPoint/Libres)","categoria":"Tecnología Educativa (EdTech)"}]'::jsonb,
  'Uso de Herramientas de Inteligencia Artificial',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Karelis Del Valle Martínez Guevara
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '17546889',
  'Karelis Del Valle Martínez Guevara',
  'Docente',
  'sb',
  'karelisuesb@gmail.com',
  '04243735355',
  '17546889', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '17546889',
  'Femenino',
  '1986-11-23',
  'Casado/a',
  'Urb.juana la Avanzadora. Zona Industrial de Maturín.',
  'Magíster en Lingüística',
  'Maestría',
  'Upel-ipm',
  2017,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"39","talla_braga":"42","talla_camisa":"L","talla_calzado":"","talla_chemise":"L","emergencia_tel":"04249708961","talla_pantalon":"38","condicion_neuro":"Neurotípico","grupo_sanguineo":"A+","condicion_medica":"","emergencia_nombre":""}'::jsonb,
  '{"estado":"Monagas","municipio":"Cedeño","parroquia":"Viento Fresco","centro_votacion":"Unidad Educativa Maestra María Francisca Bermudez Vegas"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"Sí","conyuge_nombre":"Cristóbal Antonio León Velásquez","conyuge_cedula":"13055375","conyuge_trabaja_pdvsa":"Trabajador(a) Activo(a)","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"16 Años","cedula":"33831999","nombres":"Isabella Andreina Martínez León","conapdis":"Sí","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurodivergente","fecha_nacimiento":"2010-04-29","vive_con_trabajador":"Sí"},{"edad":"8 Años","cedula":"11717546889","nombres":"Josué Alexander León Martínez","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2017-07-13","vive_con_trabajador":"Sí"},{"edad":"49 Años","cedula":"13055375","nombres":"Cristóbal Antonio León Velásquez","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Trabajador(a) Activo(a)","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1976-06-13","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"2023","horas":"4","lugar":"Centro Internacional Simón Rodríguez","titulo":"Conociendo el Trastorno del Espectro Autista"},{"fecha":"2023","horas":"4","lugar":"Centro Internacional Simón Rodríguez","titulo":"Manejo del Trastorno de Hiperactividad y el Déficit de Atención Tdah en el Aula y en el Hogar."}]'::jsonb,
  '[{"nivel":"Avanzado","titulo":"Adaptaciones Curriculares No Significativas","categoria":"Educación Inclusiva y Diversidad"}]'::jsonb,
  'Detección y Atención Temprana en el Aula en Estudiantes con Dificultades de Aprendizaje.',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2017","nivel":"Maestría","titulo":"Magíster en Lingüística","institucion":"Upel-ipm"},{"anio":"2010","nivel":"Licenciatura / Profesorado","titulo":"Profesora en Lengua y Literatura","institucion":"Upel-ipm"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Quismarys De Los Ángeles García De Hurtado
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '18268936',
  'Quismarys De Los Ángeles García De Hurtado',
  'Docente',
  'sb',
  'garciaquismarys@gmail.com',
  '04249324818',
  '18268936', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '18268936',
  'Femenino',
  '1988-05-27',
  'Casado/a',
  'Residencias Juanico, Avenida Raúl Leoni, Parroquia las Cocuizas',
  'No registrado',
  'No registrado',
  'No registrada',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"40","talla_braga":"44","talla_camisa":"XL","talla_calzado":"40","talla_chemise":"XL","emergencia_tel":"04148868108","talla_pantalon":"32","condicion_neuro":"Neurotípico","grupo_sanguineo":"A+","condicion_medica":"Ninguna","emergencia_nombre":"Marielba Garcia"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Las Cocuizas","centro_votacion":"Chucho Palacios"}'::jsonb,
  '{"tipo_prestamo":"","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"","prioridad":""}'::jsonb,
  '[{"edad":"10 Años","cedula":"36837531","nombres":"Aisquelys del Valle Hurtado Garcia","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2015-07-07","vive_con_trabajador":"Sí"},{"edad":"9 Años","cedula":"37397635","nombres":"Domingo Isaac Hurtado Garcia","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2016-08-24","vive_con_trabajador":"Sí"},{"edad":"71 Años","cedula":"4616460","nombres":"Diamarys Mercedes Ramirez de Garcia","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1955-04-02","vive_con_trabajador":"No"}]'::jsonb,
  '[{"fecha":"31/10/2024 al 09/11/2024","horas":"40","lugar":"Cil Latam","titulo":"Diplomado de Primeros Auxilios Psicológicos en el Ciclo Vital"},{"fecha":"09/11/2024.","horas":"140","lugar":"Cil Latam","titulo":"Diplomado de Educación Inclusiva y Tecnología: Herramientas Digitales para Estudiantes con Diversas Nee."},{"fecha":"31/10/2024","horas":"40","lugar":"Cil Latam","titulo":"Curso de Autocuidado del Proveedor y Grupos de Apoyo."},{"fecha":"09/11/2024","horas":"140","lugar":"Cil Latam","titulo":"Diplomado de Primeros Auxilios Psicológicos"},{"fecha":"12/11/2024","horas":"47","lugar":"Ceadpa","titulo":"Diplomado de Terapia de Pareja Avanzada."},{"fecha":"12/11/2024","horas":"40","lugar":"Ceadpa","titulo":"Etnografía y Observación en Educación"}]'::jsonb,
  '[{"nivel":"Básico","titulo":"Edición de Videos Educativos","categoria":"Tecnología Educativa (EdTech)"},{"nivel":"Básico","titulo":"Análisis de Datos Educativos con Excel","categoria":"Evaluación y Medición del Aprendizaje"},{"nivel":"Básico","titulo":"Estrategias para la Neurodiversidad en el Aula","categoria":"Educación Inclusiva y Diversidad"}]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Erika Del Valle Patete Marchan
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '14507966',
  'Erika Del Valle Patete Marchan',
  'Docente',
  'sb',
  'patetee88@gmail.com',
  '04148783403',
  '14507966', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '14507966',
  'Femenino',
  '1979-06-20',
  'Casado/a',
  'La Murallita Calle Principal N 16-1',
  'Profesora en Educación Integral',
  'Licenciatura / Profesorado',
  'Universidad Pedagógica Experimenta Libertador',
  2005,
  '2007-12-30',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"","talla_braga":"","talla_camisa":"","talla_calzado":"","talla_chemise":"","emergencia_tel":"02916521592","talla_pantalon":"","condicion_neuro":"Neurotípico","grupo_sanguineo":"B+","condicion_medica":"","emergencia_nombre":"Madre"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Padre Luis Antonio Ormieres Fe y Alegría"}'::jsonb,
  '{"tipo_prestamo":"Adicional/Mejoras","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"2) Habita en condición de arrimado, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"28 Años","cedula":"27248897","nombres":"Katherin Palma","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1998-04-27","vive_con_trabajador":"Sí"},{"edad":"16 Años","cedula":"33470346","nombres":"Calerith Palma","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2009-11-11","vive_con_trabajador":"Sí"},{"edad":"8 Años","cedula":"","nombres":"Carlos Aaron","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2018-02-02","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2005","nivel":"Licenciatura / Profesorado","titulo":"Profesora en Educación Integral","institucion":"Universidad Pedagógica Experimenta Libertador"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Lilian Norgalys Rodríguez Gimon
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '12792283',
  'Lilian Norgalys Rodríguez Gimon',
  'Docente',
  'sb',
  'rodriguezunesr@gmail.com',
  '04126522828',
  '12792283', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '12792283',
  'Femenino',
  '1975-03-03',
  'Soltero/a',
  'Guanaguanay, Parroquia Altos de los Godos',
  'Profesora de Lengua Extranjera: Mención Inglés',
  'Licenciatura / Profesorado',
  'Upel- Maturín',
  2005,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"39","talla_braga":"40","talla_camisa":"L","talla_calzado":"39","talla_chemise":"L","emergencia_tel":"04128375607","talla_pantalon":"38","condicion_neuro":"Neurotípico","grupo_sanguineo":"AB+","condicion_medica":"","emergencia_nombre":"Diana Patricia Rodríguez Gimon"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Unidad Educativa Francisco Verde"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"6) Habita en vivienda prestada, bajo su cuidado.","prioridad":""}'::jsonb,
  '[{"edad":"23 Años","cedula":"30537812","nombres":"Diana Patricia Rodríguez Gimon","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2002-09-21","vive_con_trabajador":"Sí"},{"edad":"17 Años","cedula":"33539609","nombres":"Sebastián Jhosué Rojas Rodríguez","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2008-08-18","vive_con_trabajador":"Sí"},{"edad":"74 Años","cedula":"4025634","nombres":"Antonio José Rodríguez Mijares","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1951-07-02","vive_con_trabajador":"No"},{"edad":"66 Años","cedula":"9297113","nombres":"Lilian Zenaida Gimon de Rodríguez","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1959-10-31","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Básico","titulo":"Creación de Contenidos Digitales Interactivos","categoria":"Tecnología Educativa (EdTech)"}]'::jsonb,
  '',
  '',
  '',
  '',
  'Inglés',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2005","nivel":"Licenciatura / Profesorado","titulo":"Profesora de Lengua Extranjera: Mención Inglés","institucion":"Upel- Maturín"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Mairennys Margarita Fuentes Butto
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '21348248',
  'Mairennys Margarita Fuentes Butto',
  'Docente',
  'sb',
  'mairefuentes@gmail.com',
  '04128785117',
  '21348248', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '21348248',
  'Femenino',
  '1990-10-19',
  'Casado/a',
  'Zona Industrial Urbanización Valle Grande, Condominio los Sauces Mucuchies Manzana 6 Casa 7',
  'Licenciada en Educación Integral',
  'Licenciatura / Profesorado',
  'Universidad Bolivariana de Venezuela',
  2012,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"38","talla_braga":"38","talla_camisa":"M","talla_calzado":"","talla_chemise":"M","emergencia_tel":"04129080752","talla_pantalon":"38","condicion_neuro":"Neurotípico","grupo_sanguineo":"A+","condicion_medica":"","emergencia_nombre":"Roger Gutierrez"}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"Punta de Mata","centro_votacion":"Escuela Bolivariana Francisco de Miranda"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Roger Alessandro Gutierrez Cordero","conyuge_cedula":"17404816","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"7) Habita en un inmueble asignado, propiedad de la Empresa.","prioridad":""}'::jsonb,
  '[{"edad":"65 Años","cedula":"9 287 939","nombres":"Octavia María Butto","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1961-03-23","vive_con_trabajador":"No"},{"edad":"72 Años","cedula":"9072566","nombres":"Celestino Benito Fuentes Marcano","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1954-01-12","vive_con_trabajador":"No"},{"edad":"42 Años","cedula":"17404816","nombres":"Roger Alessandro Gutierrez Cordero","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1983-05-08","vive_con_trabajador":"Sí"},{"edad":"6 Años","cedula":"11921348248","nombres":"Rosmaire Daniela Gutiérrez Fuentes","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2019-10-01","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Básico","titulo":"Inteligencia Artificial para el Aula","categoria":"Tecnología Educativa (EdTech)"}]'::jsonb,
  '',
  '',
  '',
  '',
  'Español',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2012","nivel":"Licenciatura / Profesorado","titulo":"Licenciada en Educación Integral","institucion":"Universidad Bolivariana de Venezuela"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Eulimar Archiles
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '11842683',
  'Eulimar Archiles',
  'Docente',
  'sb',
  'archileseulimar9@gmail.com',
  '04147702978',
  '11842683', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '11842683',
  'Femenino',
  '1974-05-05',
  'Soltero/a',
  'Urbanización la Esmeralda, Punta de Mata',
  'Licenciada en Educación Integral',
  'Licenciatura / Profesorado',
  'Universidad Nacional Abierta (una)',
  2009,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"40","talla_braga":"38","talla_camisa":"M","talla_calzado":"39","talla_chemise":"M","emergencia_tel":"04148725996","talla_pantalon":"30","condicion_neuro":"Neurotípico","grupo_sanguineo":"A+","condicion_medica":"Ninguna","emergencia_nombre":"04249513330"}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"Punta de Mata","centro_votacion":"Complejo Educativo Privado Cayetano Farias"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Mejoras","num_convivientes":2,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Luis Febres","conyuge_cedula":"4714613","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"17 Años","cedula":"33727675","nombres":"Bárbara a Febres Archiles","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2008-07-31","vive_con_trabajador":"No"},{"edad":"73 Años","cedula":"4714613","nombres":"Luis Febres","conapdis":"No","parentesco":"Concubino(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1952-07-09","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"24/11/95","horas":"220","lugar":"Ince","titulo":"Ingles Básico"},{"fecha":"03/05/96","horas":"220","lugar":"Ince","titulo":"Ingles Intermedio"},{"fecha":"14/08/96","horas":"220","lugar":"Ince","titulo":"Ingles Avanzado"},{"fecha":"27/09/2012","horas":"48","lugar":"Asociación Cooperativa Caprendizaje R.l","titulo":"Economía, Energía y Ambiente"},{"fecha":"21/09/2012","horas":"48","lugar":"Asociación Cooperativa Caprendizaje R.l","titulo":"Estrategias de Facilitación de Contenidos Auspiciando el Pensamiento Crítico"}]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Mindfulness y Atención Plena para Educadores","categoria":"Innovación y Desarrollo Profesional"}]'::jsonb,
  '',
  '',
  '',
  '',
  'Ingles Avanzado',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2009","nivel":"Licenciatura / Profesorado","titulo":"Licenciada en Educación Integral","institucion":"Universidad Nacional Abierta (una)"},{"anio":"1995","nivel":"TSU","titulo":"Técnico Superior en Informática","institucion":"Instituto Universitario de Tecnología Antonio José de Sucre"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Armando José Martínez Salazar
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '15551039',
  'Armando José Martínez Salazar',
  'Docente',
  'sb',
  'ajmsesc@gmail.com',
  '04241710994',
  '15551039', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '15551039',
  'Masculino',
  '1982-05-27',
  'Soltero/a',
  'Urbanización los Tapiales Calle B Casa 35b',
  'Profesor en Geografía e Historia',
  'Licenciatura / Profesorado',
  'Upel-ipm',
  2007,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"42","talla_braga":"46","talla_camisa":"XL","talla_calzado":"42","talla_chemise":"XL","emergencia_tel":"04249252926","talla_pantalon":"36","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"","emergencia_nombre":"Nileidys Martínez"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Las Cocuizas","centro_votacion":"Complejo Educativo Nacional Leonardo Infante"}'::jsonb,
  '{"tipo_prestamo":"","num_convivientes":1,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"6) Habita en vivienda prestada, bajo su cuidado.","prioridad":""}'::jsonb,
  '[{"edad":"71 Años","cedula":"V-5694501","nombres":"Hilda María Salazar","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1954-10-31","vive_con_trabajador":"No"},{"edad":"73 Años","cedula":"4895271","nombres":"Armando de la Cruz Martínez Salazar","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1952-05-23","vive_con_trabajador":"No"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2007","nivel":"Licenciatura / Profesorado","titulo":"Profesor en Geografía e Historia","institucion":"Upel-ipm"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Gabriela María Acosta Alfonzo
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '16396448',
  'Gabriela María Acosta Alfonzo',
  'Docente',
  'sb',
  'gabysroom83@gmail.com',
  '04141925202',
  '16396448', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '16396448',
  'Femenino',
  '1983-07-31',
  'Concubino/a',
  'Urb. Terrasur, Casa 48, Calle #2',
  'Profesor en Lengua y Literatura',
  'Licenciatura / Profesorado',
  'Pedagógica Experimental Libertador',
  2009,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"40","talla_braga":"36","talla_camisa":"M","talla_calzado":"40","talla_chemise":"M","emergencia_tel":"04249378722","talla_pantalon":"30","condicion_neuro":"Neurotípico","grupo_sanguineo":"A+","condicion_medica":"Asmática","emergencia_nombre":"04249378722"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"San Simón","centro_votacion":"Ep Paula Bastardo"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":3,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"16 Años","cedula":"33476149","nombres":"Aurora de Jesús Requena Acosta","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2010-01-21","vive_con_trabajador":"Sí"},{"edad":"13 Años","cedula":"33842239","nombres":"Andrea Isabel Requena Acosta","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2012-08-15","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Análisis de Datos Educativos con Excel","categoria":"Evaluación y Medición del Aprendizaje"}]'::jsonb,
  'Oratoria y Liderazgo',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2009","nivel":"Licenciatura / Profesorado","titulo":"Profesor en Lengua y Literatura","institucion":"Pedagógica Experimental Libertador"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Humberto José Villanueva Torres
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '12794086',
  'Humberto José Villanueva Torres',
  'Docente',
  'sb',
  'humbertovillanueva07@gmail.com',
  '04147702119',
  '12794086', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '12794086',
  'Masculino',
  '1975-01-15',
  'Concubino/a',
  'Calle Andrés Bello, Punta de Mata',
  'Licenciado en Educación',
  'Licenciatura / Profesorado',
  'Universidad Bolivariana de Venezuela',
  2017,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"","talla_braga":"","talla_camisa":"","talla_calzado":"","talla_chemise":"","emergencia_tel":"04220135995","talla_pantalon":"","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"","emergencia_nombre":"Marinelsy Veliz"}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"Punta de Mata","centro_votacion":"Escuela Básica Centurión"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Marinelsy Josefina Veliz Lopez","conyuge_cedula":"23818199","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"","prioridad":""}'::jsonb,
  '[{"edad":"37 Años","cedula":"23818199","nombres":"Marinelsy Josefina Veliz Lopez","conapdis":"No","parentesco":"Concubino(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1989-03-13","vive_con_trabajador":"Sí"},{"edad":"1 Años","cedula":"","nombres":"Humberto Ramón Villanueva Veliz","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"No Escolarizado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2025-01-25","vive_con_trabajador":"Sí"},{"edad":"77 Años","cedula":"3696656","nombres":"Romelia Josefina Torres","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1949-02-26","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Básico","titulo":"Programación Neurolingüística (PNL) en el Aula","categoria":"Gestión y Liderazgo Educativo"},{"nivel":"Básico","titulo":"Evaluación de Habilidades Blandas y Socioemocionales","categoria":"Evaluación y Medición del Aprendizaje"},{"nivel":"Básico","titulo":"Oratoria y Comunicación Efectiva para Educadores","categoria":"Innovación y Desarrollo Profesional"}]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2017","nivel":"Licenciatura / Profesorado","titulo":"Licenciado en Educación","institucion":"Universidad Bolivariana de Venezuela"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: María Antonella Astudillo Acosta
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '18983704',
  'María Antonella Astudillo Acosta',
  'Docente',
  'sb',
  'antonellaastudillo88@gmail.com',
  '04264961734',
  '18983704', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '18983704',
  'Femenino',
  '1988-08-22',
  'Soltero/a',
  'Los Guaritos, Parroquia Altos de los Godos',
  'Profesora en Educación Especial',
  'Licenciatura / Profesorado',
  'Upel',
  2012,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"36","talla_braga":"36","talla_camisa":"S","talla_calzado":"36","talla_chemise":"S","emergencia_tel":"04149972970","talla_pantalon":"28","condicion_neuro":"Neurotípico","grupo_sanguineo":"A+","condicion_medica":"","emergencia_nombre":"Pedro Astudillo"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Liceo Nacional los Guaritos"}'::jsonb,
  '{"tipo_prestamo":"","num_convivientes":2,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"2) Habita en condición de arrimado, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"65 Años","cedula":"5745705","nombres":"Noria Acosta","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1960-10-17","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Enseñanza Diferenciada: Atender la Diversidad","categoria":"Educación Inclusiva y Diversidad"}]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2012","nivel":"Licenciatura / Profesorado","titulo":"Profesora en Educación Especial","institucion":"Upel"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Sorinee Del Valle Maita Inagas
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '14859770',
  'Sorinee Del Valle Maita Inagas',
  'Docente',
  'sb',
  'sorinee2023@gmail.com',
  '04129411792',
  '14859770', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '14859770',
  'Femenino',
  '1982-01-01',
  'Soltero/a',
  'Conj Res Campo Claro',
  'Tsu en Educación Preescolar',
  'TSU',
  'Iutirla',
  2006,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"40","talla_braga":"38","talla_camisa":"XL","talla_calzado":"40","talla_chemise":"XL","emergencia_tel":"","talla_pantalon":"34","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"","emergencia_nombre":""}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"Punta de Mata","centro_votacion":"E.b Nicolás Aranguren 5 de Julio"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Mejoras","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"21 Años","cedula":"31871220","nombres":"Moisés Ortiz","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2005-02-25","vive_con_trabajador":"Sí"},{"edad":"15 Años","cedula":"33611534","nombres":"Esthefanía Ortiz","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"2010-07-06","vive_con_trabajador":"Sí"},{"edad":"63 Años","cedula":"8928862","nombres":"María Inagas","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"1962-09-10","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"Mayo 2005","horas":"32","lugar":"Zona Educativa","titulo":"Elaboración de Esculturas. en Animen"},{"fecha":"28/01/2011","horas":"","lugar":"Upel","titulo":"Taller de Planificación y Evaluación Práctica"},{"fecha":"04/06/2004","horas":"16","lugar":"Upel","titulo":"Jornada de Música, Folklore y y Danza"},{"fecha":"27/04/2007","horas":"","lugar":"Zona Educativa","titulo":"I Encuentro de Ajedrez en Educación Física Inicial"},{"fecha":"01/12/2000","horas":"300","lugar":"Intepi","titulo":"Informática y Computación"},{"fecha":"2008","horas":"","lugar":"Upel","titulo":"Integración en Administración Docente"},{"fecha":"20/07/2012","horas":"16","lugar":"Icum","titulo":"Taller de Formación Pintura"},{"fecha":"20/07/2012","horas":"8","lugar":"Icum","titulo":"Taller de Formación Aérea. Plastilina"}]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Estrategias para la Neurodiversidad en el Aula","categoria":"Educación Inclusiva y Diversidad"}]'::jsonb,
  'He Realizado Varios Cursos por Parte de la Empresa y No He Recibido los Certificados, Agradezco Información Sobre los Mismos Ya Que Me Sirven de Soporte para Currículum. Estoy Atenta y Dispuesta en Recibir Diversas Formación para Fortalecer Mis Conocimientos',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2006","nivel":"TSU","titulo":"Tsu en Educación Preescolar","institucion":"Iutirla"},{"anio":"2009","nivel":"Postgrado / Especialización","titulo":"Profesora en Educación Preescolar","institucion":"Upel"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Eudis Teresa Febres De López
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '15030333',
  'Eudis Teresa Febres De López',
  'Docente',
  'sb',
  'febreset79@gmail.com',
  '04141920564',
  '15030333', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '15030333',
  'Femenino',
  '1979-04-04',
  'Casado/a',
  'Sector Centro Este, Calle 18 de Octubre Número 24',
  'Profesor Biología',
  'Licenciatura / Profesorado',
  'Upel',
  2011,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"38","talla_braga":"36","talla_camisa":"XXL","talla_calzado":"38","talla_chemise":"XXL","emergencia_tel":"04141920564","talla_pantalon":"34","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"","emergencia_nombre":"José López"}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"Punta de Mata","centro_votacion":"Escuela Básica Alberto Ravell"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":6,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"José Manuel López Palma","conyuge_cedula":"11777593","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"21 Años","cedula":"31418664","nombres":"Manuella Estefanía López Febres","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2005-04-22","vive_con_trabajador":"Sí"},{"edad":"8 Años","cedula":"11715030333","nombres":"Romina Isabelle López Febres","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2017-06-02","vive_con_trabajador":"Sí"},{"edad":"28 Años","cedula":"","nombres":"Jonás Enmanuel López Febres","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1997-12-23","vive_con_trabajador":"Sí"},{"edad":"72 Años","cedula":"4021599","nombres":"Eudoris Ramón Torres Febres","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1954-01-20","vive_con_trabajador":"Sí"},{"edad":"51 Años","cedula":"11777593","nombres":"José Manuel López Palma","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1974-07-14","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Básico","titulo":"Oratoria y Comunicación Efectiva para Educadores","categoria":"Innovación y Desarrollo Profesional"}]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2011","nivel":"Licenciatura / Profesorado","titulo":"Profesor Biología","institucion":"Upel"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: José Miguel Idrogo Ponce
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '15117427',
  'José Miguel Idrogo Ponce',
  'Docente',
  'sb',
  'josemidrogoponce@gmail.com',
  '04120862610',
  '15117427', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '15117427',
  'Masculino',
  '1979-07-06',
  'Concubino/a',
  'Urbanización Juana la Avanzadora, Parroquia la Cruz',
  'Profesor en Educación Matematica',
  'Licenciatura / Profesorado',
  'Upel- Ipm',
  2002,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"43","talla_braga":"44","talla_camisa":"XXL","talla_calzado":"43","talla_chemise":"XXL","emergencia_tel":"04121162551","talla_pantalon":"38","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Ninguna","emergencia_nombre":"04124213653"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"U. e Francisco Verde"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Rosmelis María Calzadilla Lira","conyuge_cedula":"26228114","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"27 Años","cedula":"26228114","nombres":"Rosmelis María Calzadilla Lira","conapdis":"No","parentesco":"Concubino(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1998-07-24","vive_con_trabajador":"Sí"},{"edad":"70 Años","cedula":"4717554","nombres":"Miguel Antonio Idrogo Ramos","conapdis":"No","parentesco":"Padre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1955-06-03","vive_con_trabajador":"No"},{"edad":"7 Años","cedula":"","nombres":"Lucia Isabel Idrogo Calzadilla","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2018-07-18","vive_con_trabajador":"Sí"},{"edad":"4 Años","cedula":"","nombres":"Sofía Isabel Idrogo Calzadilla","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Inicial","condicion_neuro":"Neurotípico","fecha_nacimiento":"2022-02-18","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"21/06/2006","horas":"20","lugar":"Instituto Pedagógico de Maturin","titulo":"V Jornada de Investigación y Educación Matematica"},{"fecha":"21/06/2006 hasta 23/06/2006","horas":"20","lugar":"Upel- Ipm","titulo":"Vii Encuentro de Profesores de Matemáticas de la Región Nororiental, Insular y de Guayana en el Cálculo de Maple"},{"fecha":"05/06/2008","horas":"8","lugar":"Upel- Ipm","titulo":"Por Haber Asistido en Calidad de Participantes Al Taller de Aplicaciones de la Geometría Elemental y Analítica en el Marco de la Vi Jornada de Investigación y Educación Matemática"},{"fecha":"05/06/2008","horas":"20","lugar":"Upel- Ipm","titulo":"Vi Jornada de Investigación y Educación Matemática"},{"fecha":"13/06/2007","horas":"8","lugar":"Upel-ipm","titulo":"Jornada Alternativa Didáctica y de Investigación en Educación Matemática Como Facilitador en el Taller Algoritmo No Convencional para las Operaciones Matemáticas Básicas"},{"fecha":"05/05/2012","horas":"8","lugar":"Upel- Ipm","titulo":"Trastornos en el Proceso de Aprendizaje del Educando"},{"fecha":"06/ al 28/07 de 2011","horas":"32","lugar":"Centro Bolivariano de Informática y Telemática (cbit)","titulo":"Participante Al Curso Open Office Básico"},{"fecha":"03 al 23/02/2012","horas":"36","lugar":"Cbit","titulo":"Open Office Avenzado"},{"fecha":"30/09 al 01/10 de 2010","horas":"8","lugar":"Universidad Bolivariana de Venezuela Maturin","titulo":"1era Jornada Estadal de la Enseñanza de las Ciencias en el Subsistema de Educación Basica"}]'::jsonb,
  '[{"nivel":"Intermedio","titulo":"Oratoria y Comunicación Efectiva para Educadores","categoria":"Innovación y Desarrollo Profesional"},{"nivel":"Intermedio","titulo":"Educación para el Desarrollo Sostenible (ODS en el Aula)","categoria":"Formación Pedagógica y Didáctica"}]'::jsonb,
  '',
  '',
  '',
  '',
  'Ninguno',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2002","nivel":"Licenciatura / Profesorado","titulo":"Profesor en Educación Matematica","institucion":"Upel- Ipm"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Emilsa Veruska López Zabala
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '18272669',
  'Emilsa Veruska López Zabala',
  'Docente',
  'sb',
  'emilsalopez29@gmail.com',
  '04249393018',
  '18272669', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '18272669',
  'Femenino',
  '1989-01-29',
  'Casado/a',
  'Urbanización la Esmeralda, Punta de Mata',
  'No registrado',
  'No registrado',
  'No registrada',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"40","talla_braga":"40","talla_camisa":"L","talla_calzado":"39","talla_chemise":"L","emergencia_tel":"04249196810","talla_pantalon":"34","condicion_neuro":"Neurotípico","grupo_sanguineo":"A+","condicion_medica":"","emergencia_nombre":"Modesto Cedeño"}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"Punta de Mata","centro_votacion":"Escuela Básica Doña Menca de Leonis"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Mejoras","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Modesto José Cedeño Febres","conyuge_cedula":"16518794","conyuge_trabaja_pdvsa":"Trabajador(a) Activo(a)","condicion_habitabilidad":"1) Habita en condición de hacinamiento, solo o con su grupo familiar.","prioridad":""}'::jsonb,
  '[{"edad":"10 Años","cedula":"36760468","nombres":"Milan Miguel Cedeño López","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2015-05-29","vive_con_trabajador":"Sí"},{"edad":"4 Años","cedula":"","nombres":"Miller Miguel Cedeño López","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Inicial","condicion_neuro":"Neurotípico","fecha_nacimiento":"2021-06-18","vive_con_trabajador":"Sí"},{"edad":"64 Años","cedula":"8367940","nombres":"Morelia Mercedes Zabala Rodríguez","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1962-03-28","vive_con_trabajador":"No"},{"edad":"43 Años","cedula":"16518794","nombres":"Modesto José Cedeño Febres","conapdis":"No","parentesco":"Concubino(a)","estatus_pdvsa":"Trabajador(a) Activo(a)","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1982-05-12","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Básico","titulo":"Video Educativo: Grabación y Edición Básica","categoria":"Tecnología Educativa (EdTech)"}]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Yurimar Del Valle Gómez Gómez
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '14661452',
  'Yurimar Del Valle Gómez Gómez',
  'Docente',
  'sb',
  'Yuripdvsa@gmail.com',
  '04121792357',
  '14661452', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '14661452',
  'Femenino',
  '1981-05-10',
  'Casado/a',
  'Urbanización Moriche, Parroquia la Cruz',
  'Licenciado en Educación',
  'Postgrado / Especialización',
  'Universidad Bolivariana de Venezuela',
  2014,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"","talla_braga":"48","talla_camisa":"XXL","talla_calzado":"","talla_chemise":"XXL","emergencia_tel":"04226458260","talla_pantalon":"","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Asmatica","emergencia_nombre":"Mi Esposo"}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"Punta de Mata","centro_votacion":"Panadería Productiva el Samán"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":2,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Dubis González","conyuge_cedula":"16373593","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"","prioridad":""}'::jsonb,
  '[{"edad":"44 Años","cedula":"16373593","nombres":"Dubis González","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1981-06-29","vive_con_trabajador":"Sí"}]'::jsonb,
  '[{"fecha":"25 al 26 02/2014","horas":"16","lugar":"Petróleos de Venezuela,s.a.","titulo":"Radacción de Informes"},{"fecha":"marzo 2009","horas":"20","lugar":"Petróleos de Venezuela","titulo":"Inducción Petrolera"},{"fecha":"26,27 de noviembre 2012","horas":"8","lugar":"Universidad Bolivariana de Venezuela","titulo":"Prueba Técnica Pericial Forense"},{"fecha":"18 de Julio 2009","horas":"90","lugar":"Unesco","titulo":"Conocimiento Integral de la Locución"},{"fecha":"21/03/1999","horas":"28","lugar":"Zona Educativa del Estado Sucre","titulo":"Catastro Autogestionado Área Mayor 03"},{"fecha":"21,22,23/03/2003","horas":"20","lugar":"Ince","titulo":"Seguridad Industrial"},{"fecha":"23/05/2014","horas":"8","lugar":"Ministerio Público","titulo":"Seminaria Referente a la Ley Orgánica de Drogas"},{"fecha":"2024","horas":"8663","lugar":"Universidad del Magisterio. Samuel Robinsón","titulo":"Especialización"},{"fecha":"14/11/2012","horas":"8","lugar":"Contraloría Sanitaria","titulo":"Manipulación de Alimentos"}]'::jsonb,
  '[{"nivel":"Avanzado","titulo":"Programación Neurolingüística (PNL) en el Aula","categoria":"Gestión y Liderazgo Educativo"}]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2014","nivel":"Postgrado / Especialización","titulo":"Licenciado en Educación","institucion":"Universidad Bolivariana de Venezuela"},{"anio":"2016","nivel":"Postgrado / Especialización","titulo":"Abogada","institucion":"Universidad Bolivariana de Venezuela"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Soiry Mar Archiles
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '12362435',
  'Soiry Mar Archiles',
  'Docente',
  'sb',
  'archilessoirymar@gmail.com',
  '04148725996',
  '12362435', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '12362435',
  'Femenino',
  '1976-08-21',
  'Casado/a',
  'Urb. Doña Menca de Leoni. Calle Zafiro. S/n',
  'Licencia en Educación Integral',
  'Licenciatura / Profesorado',
  'Universidad Nacional Abierta',
  2010,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"38","talla_braga":"36","talla_camisa":"XL","talla_calzado":"38","talla_chemise":"XL","emergencia_tel":"04249519493","talla_pantalon":"32","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"A los Aines","emergencia_nombre":"German Dunn"}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"Punta de Mata","centro_votacion":"Cayetano Farias"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":2,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"German E. Dunn F.","conyuge_cedula":"12680617","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"","prioridad":""}'::jsonb,
  '[{"edad":"51 Años","cedula":"12680617","nombres":"German E. Dunn F.","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Media General","condicion_neuro":"Neurotípico","fecha_nacimiento":"1974-08-03","vive_con_trabajador":"Sí"},{"edad":"20 Años","cedula":"32085201","nombres":"José E. Dunn Archiles","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Estudios de Pregrado","condicion_neuro":"Neurotípico","fecha_nacimiento":"2006-01-20","vive_con_trabajador":"No"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Básico","titulo":"Inteligencia Artificial para el Aula","categoria":"Tecnología Educativa (EdTech)"}]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2010","nivel":"Licenciatura / Profesorado","titulo":"Licencia en Educación Integral","institucion":"Universidad Nacional Abierta"},{"anio":"1997","nivel":"TSU","titulo":"Tsu en Informática (analista)","institucion":"Iut Antonio José de Sucre"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Marianny José Brito Flores
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '17487413',
  'Marianny José Brito Flores',
  'Docente',
  'sb',
  'britofm2025@gmail.com',
  '04249576055',
  '17487413', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '17487413',
  'Femenino',
  '1986-12-16',
  'Casado/a',
  'Urbanización el Faro, Condominio Margarita, Casa 054',
  'No registrado',
  'No registrado',
  'No registrada',
  2026,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"40","talla_braga":"44","talla_camisa":"XL","talla_calzado":"40","talla_chemise":"XL","emergencia_tel":"04141915011","talla_pantalon":"40","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"","emergencia_nombre":"Tirso Hernández"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Santa Cruz","centro_votacion":"Ue Padre Juan Vives Suria"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Mejoras","num_convivientes":5,"discapacidad_trabajador":"No","discapacidad_familiar":"Sí","conyuge_nombre":"Tirso Hernández","conyuge_cedula":"18337325","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"68 Años","cedula":"4895321","nombres":"Carmen Flores","conapdis":"No","parentesco":"Madre","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1958-03-14","vive_con_trabajador":"Sí"},{"edad":"39 Años","cedula":"18337325","nombres":"Tirso Hernández","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1986-10-02","vive_con_trabajador":"Sí"},{"edad":"11 Años","cedula":"36612339","nombres":"Isaac Hernández","conapdis":"Sí","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurodivergente","fecha_nacimiento":"2015-04-14","vive_con_trabajador":"Sí"},{"edad":"4 Años","cedula":"12217487413","nombres":"Thiago Hernández","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Inicial","condicion_neuro":"Neurotípico","fecha_nacimiento":"2022-03-16","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[{"nivel":"Avanzado","titulo":"Diseño Universal para el Aprendizaje (DUA)","categoria":"Educación Inclusiva y Diversidad"},{"nivel":"Avanzado","titulo":"Liderazgo Pedagógico: Inspirar sin Autoritarismo","categoria":"Gestión y Liderazgo Educativo"}]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Yesenia Margarita López Jiménez
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '18010857',
  'Yesenia Margarita López Jiménez',
  'Docente',
  'sb',
  'avrilu30@gmail.com',
  '04249528651',
  '18010857', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '18010857',
  'Femenino',
  '1987-04-20',
  'Casado/a',
  'Urbanización los Samanes, Parroquia Altos de los Godos',
  'Profesor de Lengua y Literatura',
  'Licenciatura / Profesorado',
  'Upel- Ipm',
  2004,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"35","talla_braga":"36","talla_camisa":"S","talla_calzado":"35","talla_chemise":"S","emergencia_tel":"04249148631","talla_pantalon":"28","condicion_neuro":"Neurotípico","grupo_sanguineo":"","condicion_medica":"","emergencia_nombre":"0424-9528651"}'::jsonb,
  '{"estado":"Monagas","municipio":"Maturín","parroquia":"Alto de los Godos","centro_votacion":"Carmen Evelia Douglas"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":4,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"Pedro Daniel Luna Rengel","conyuge_cedula":"16175670","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"10 Años","cedula":"36748835","nombres":"Grecia Daniela Luna López","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2015-06-17","vive_con_trabajador":"Sí"},{"edad":"6 Años","cedula":"11918010857","nombres":"Avril Daniela Luna López","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Primaria","condicion_neuro":"Neurotípico","fecha_nacimiento":"2019-12-30","vive_con_trabajador":"Sí"},{"edad":"42 Años","cedula":"16175670","nombres":"Pedro Daniel Luna Rengel","conapdis":"No","parentesco":"Esposo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Graduado","condicion_neuro":"Neurotípico","fecha_nacimiento":"1984-04-03","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2004","nivel":"Licenciatura / Profesorado","titulo":"Profesor de Lengua y Literatura","institucion":"Upel- Ipm"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

-- Docente: Julio Rafael Bermúdez Hernández
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '15510687',
  'Julio Rafael Bermúdez Hernández',
  'Docente',
  'sb',
  'gruposabana.jb@gmail.com',
  '04148576342',
  '15510687', -- Clave inicial igual a la cédula
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
  datos_salud, datos_electoral, datos_vivienda, carga_familiar, cursos_realizados, plan_formacion, necesidades_extra,
  gerencia, organizacion_proceso, desarrollo_carrera, otros_idiomas, experiencia_externa, historico_pdvsa, estudios_superiores
)
VALUES (
  '15510687',
  'Masculino',
  '1982-02-08',
  'Divorciado/a',
  'Urb. Raúl Leoni, Carrera 6, Casa 137',
  'Licenciado en Educación, Mención Desarrollo Cultural',
  'Licenciatura / Profesorado',
  'Universidad, Nacional Simón Rodríguez',
  2019,
  '2020-01-01',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb,
  '{"conapdis":"No","talla_botas":"43","talla_braga":"38","talla_camisa":"XL","talla_calzado":"42","talla_chemise":"XL","emergencia_tel":"","talla_pantalon":"38","condicion_neuro":"Neurotípico","grupo_sanguineo":"O+","condicion_medica":"Ninguna","emergencia_nombre":"04249267711"}'::jsonb,
  '{"estado":"Monagas","municipio":"Ezequiel Zamora","parroquia":"Punta de Mata","centro_votacion":"E. B. Centurión"}'::jsonb,
  '{"tipo_prestamo":"Inicial/Adquisición","num_convivientes":2,"discapacidad_trabajador":"No","discapacidad_familiar":"No","conyuge_nombre":"","conyuge_cedula":"","conyuge_trabaja_pdvsa":"Nunca ha trabajado en PDVSA","condicion_habitabilidad":"8) Habita un inmueble bajo otra condición diferente a las anteriores","prioridad":""}'::jsonb,
  '[{"edad":"5 Años","cedula":"12025581771","nombres":"Dyland Abraham Bermúdez Pérez","conapdis":"No","parentesco":"Hijo(a)","estatus_pdvsa":"Nunca ha trabajado en PDVSA","estudiante_de":"Educación Inicial","condicion_neuro":"Neurotípico","fecha_nacimiento":"2020-07-03","vive_con_trabajador":"Sí"}]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '[]'::jsonb,
  '[]'::jsonb,
  '[{"anio":"2019","nivel":"Licenciatura / Profesorado","titulo":"Licenciado en Educación, Mención Desarrollo Cultural","institucion":"Universidad, Nacional Simón Rodríguez"}]'::jsonb
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
  necesidades_extra = EXCLUDED.necesidades_extra,
  gerencia = EXCLUDED.gerencia,
  organizacion_proceso = EXCLUDED.organizacion_proceso,
  desarrollo_carrera = EXCLUDED.desarrollo_carrera,
  otros_idiomas = EXCLUDED.otros_idiomas,
  experiencia_externa = EXCLUDED.experiencia_externa,
  historico_pdvsa = EXCLUDED.historico_pdvsa,
  estudios_superiores = EXCLUDED.estudios_superiores;

COMMIT;
