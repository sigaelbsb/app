-- ========================================================
-- MIGRACIÓN: DICCIONARIO EDUCATIVO VENEZOLANO PARA SIGMA
-- Tabla: public.sigma_conocimiento
-- Generado: 2026-06-23T10:10:42.112Z
-- ========================================================

BEGIN;

-- Tema: PEIC (Proyecto Educativo Integral Comunitario)
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'PEIC (Proyecto Educativo Integral Comunitario)',
  ARRAY['peic', 'proyecto educativo integral comunitario', 'que es peic', 'significado de peic', 'definicion de peic']::text[],
  '<b>PEIC (Proyecto Educativo Integral Comunitario)</b>:<br/><br/>Es un proyecto institucional de carácter pedagógico, social y comunitario que define las metas, directrices y acciones de una escuela basándose en las necesidades y potencialidades de su comunidad y entorno.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: PA (Proyecto de Aprendizaje)
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'PA (Proyecto de Aprendizaje)',
  ARRAY['pa', 'proyecto de aprendizaje', 'que es pa', 'significado de pa', 'definicion de pa', 'proyectos de aprendizaje']::text[],
  '<b>PA (Proyecto de Aprendizaje)</b>:<br/><br/>Es una estrategia pedagógica de planificación didáctica que el docente diseña para integrar los contenidos de las distintas materias partiendo de los intereses, necesidades y curiosidades de los estudiantes.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: CRA (Centro de Recursos para el Aprendizaje)
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'CRA (Centro de Recursos para el Aprendizaje)',
  ARRAY['cra', 'centro de recursos para el aprendizaje', 'biblioteca', 'bibliotecas', 'que es cra', 'significado de cra', 'definicion de cra']::text[],
  '<b>CRA (Centro de Recursos para el Aprendizaje)</b>:<br/><br/>Es el espacio dentro de los planteles educativos (antiguamente llamado biblioteca escolar) destinado al uso de libros, computadoras, mapas y herramientas pedagógicas para la investigación escolar y el fomento de la lectura.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: OBE (Organización Bolivariana de Estudiantes)
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'OBE (Organización Bolivariana de Estudiantes)',
  ARRAY['obe', 'organizacion bolivariana de estudiantes', 'movimiento estudiantil', 'estudiantes', 'que es obe', 'significado de obe', 'definicion de obe']::text[],
  '<b>OBE (Organización Bolivariana de Estudiantes)</b>:<br/><br/>Es el movimiento estudiantil que representa y defiende los derechos, participación ciudadana y vocería de los alumnos de educación media general y técnica en los liceos venezolanos.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: MBF (Movimiento Bolivariano de Familias)
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'MBF (Movimiento Bolivariano de Familias)',
  ARRAY['mbf', 'movimiento bolivariano de familias', 'familias', 'padres', 'representantes', 'que es mbf', 'significado de mbf', 'definicion de mbf']::text[],
  '<b>MBF (Movimiento Bolivariano de Familias)</b>:<br/><br/>Es una organización que agrupa a padres, madres y representantes en las escuelas con el fin de promover su corresponsabilidad y participación activa en los proyectos y el mantenimiento escolar.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: LOPNNA (Ley Orgánica para la Protección de Niños, Niñas y Adolescentes)
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'LOPNNA (Ley Orgánica para la Protección de Niños, Niñas y Adolescentes)',
  ARRAY['lopnna', 'ley organica para la proteccion de ninos ninas y adolescentes', 'proteccion del menor', 'convivencia escolar', 'que es lopnna', 'significado de lopnna', 'definicion de lopnna']::text[],
  '<b>LOPNNA (Ley Orgánica para la Protección de Niños, Niñas y Adolescentes)</b>:<br/><br/>Es la ley venezolana que consagra y defiende los derechos y deberes de todos los menores de 18 años, la cual norma los acuerdos de convivencia de los estudiantes y la disciplina en los liceos.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: LOE (Ley Orgánica de Educación)
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'LOE (Ley Orgánica de Educación)',
  ARRAY['loe', 'ley organica de educacion', 'ley de educacion', 'leyes educativas', 'que es loe', 'significado de loe', 'definicion de loe']::text[],
  '<b>LOE (Ley Orgánica de Educación)</b>:<br/><br/>Es el instrumento legal que establece las directrices, principios, fines y bases del subsistema educativo nacional venezolano.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: Lapsos Académicos / Momentos Pedagógicos
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'Lapsos Académicos / Momentos Pedagógicos',
  ARRAY['lapso', 'lapsos', 'momentos', 'momentos pedagogicos', 'periodos escolares', 'lapso academico', 'momento pedagogico']::text[],
  '<b>Lapsos Académicos / Momentos Pedagógicos</b>:<br/><br/>Son los períodos trimestrales en los que se organiza el año escolar venezolano para las evaluaciones y calificaciones. Consta de 3 momentos pedagógicos en el calendario escolar.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: Momento Pedagógico
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'Momento Pedagógico',
  ARRAY['momento pedagogico', 'momentos pedagogicos', 'periodo de evaluacion', 'momentos de evaluacion']::text[],
  '<b>Momento Pedagógico</b>:<br/><br/>Denominación oficial del Ministerio de Educación (MPPE) para cada uno de los tres períodos de evaluación didáctica y administrativa (lapsos) que conforman el año escolar.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: Vocero / Vocería Estudiantil
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'Vocero / Vocería Estudiantil',
  ARRAY['vocero', 'vocera', 'vocerias', 'vocero estudiantil', 'vocera estudiantil', 'que es vocero', 'definicion de vocero']::text[],
  '<b>Vocero / Vocería Estudiantil</b>:<br/><br/>Estudiante electo de forma democrática por sección para representar la opinión, necesidades y propuestas de sus compañeros ante el colectivo docente e institucional.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: Zona Educativa
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'Zona Educativa',
  ARRAY['zona educativa', 'zonas educativas', 'mppe regional', 'que es zona educativa', 'definicion de zona educativa']::text[],
  '<b>Zona Educativa</b>:<br/><br/>Oficina estatal adscrita al Ministerio del Poder Popular para la Educación (MPPE) que coordina y ejecuta las directrices de políticas públicas de educación en cada estado del país.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: PAE (Programa de Alimentación Escolar)
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'PAE (Programa de Alimentación Escolar)',
  ARRAY['pae', 'programa de alimentacion escolar', 'comedor', 'alimentacion', 'comida escolar', 'que es pae', 'significado de pae', 'definicion de pae']::text[],
  '<b>PAE (Programa de Alimentación Escolar)</b>:<br/><br/>Es el programa bandera del Ministerio de Educación en Venezuela que garantiza una alimentación diaria, sana, balanceada y gratuita a las y los alumnos de planteles públicos.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: Consejo Educativo
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'Consejo Educativo',
  ARRAY['consejo educativo', 'consejos educativos', 'gestion escolar', 'que es consejo educativo', 'definicion de consejo educativo']::text[],
  '<b>Consejo Educativo</b>:<br/><br/>Órgano colegiado formado por directivos, docentes, obreros, administrativos, padres y estudiantes que asume de manera conjunta la planificación, ejecución y contraloría de la gestión escolar.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: Colectivo Pedagógico
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'Colectivo Pedagógico',
  ARRAY['colectivo pedagogico', 'colectivos pedagogicos', 'reunion de docentes', 'planificacion docente', 'que es colectivo pedagogico']::text[],
  '<b>Colectivo Pedagógico</b>:<br/><br/>Espacio semanal o quincenal de autoformación, evaluación colectiva y planificación escolar donde los docentes del plantel debaten y acuerdan las mejoras para la enseñanza.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: MPPE (Ministerio del Poder Popular para la Educación)
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'MPPE (Ministerio del Poder Popular para la Educación)',
  ARRAY['mppe', 'ministerio de educacion', 'ministerio del poder popular para la educacion', 'ente rector', 'que es mppe', 'significado de mppe']::text[],
  '<b>MPPE (Ministerio del Poder Popular para la Educación)</b>:<br/><br/>El Ministerio de Educación de Venezuela, ente rector nacional que formula y ejecuta las políticas del sistema educativo básico.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: Educación Media General
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'Educación Media General',
  ARRAY['media general', 'bachillerato general', 'bachiller', 'bachillerato', 'educacion media general']::text[],
  '<b>Educación Media General</b>:<br/><br/>Nivel de bachillerato general regular que dura cinco años escolares (de 1° a 5° año) y otorga el título de Bachiller de la República.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: Educación Media Técnica
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'Educación Media Técnica',
  ARRAY['media tecnica', 'bachillerato tecnico', 'tecnico medio', 'educacion media tecnica']::text[],
  '<b>Educación Media Técnica</b>:<br/><br/>Bachillerato especializado de seis años escolares (de 1° a 6° año) enfocado en preparar profesionalmente al estudiante en sectores industrial, comercial, salud o agropecuario, otorgando el título de Técnico Medio.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: Liceo
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'Liceo',
  ARRAY['liceo', 'liceos', 'secundaria', 'instituto de bachillerato']::text[],
  '<b>Liceo</b>:<br/><br/>Nombre común que reciben los planteles educativos de educación media general y técnica en Venezuela.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: Proyecto Canaima Educativo
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'Proyecto Canaima Educativo',
  ARRAY['canaima', 'proyecto canaima', 'computadora canaima', 'tableta canaima', 'canaimas']::text[],
  '<b>Proyecto Canaima Educativo</b>:<br/><br/>Programa tecnológico escolar del Estado venezolano que distribuye computadoras portátiles (''Canaimitas'') y tabletas con contenido didáctico interactivo a estudiantes y docentes.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: Canaimita
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'Canaimita',
  ARRAY['canaimita', 'computadora canaima escolar', 'portatil escolar']::text[],
  '<b>Canaimita</b>:<br/><br/>Computadora portátil escolar entregada por el Estado a estudiantes venezolanos como parte de los recursos de aprendizaje tecnológicos.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: Colección Bicentenario
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'Colección Bicentenario',
  ARRAY['coleccion bicentenario', 'libros bicentenario', 'libros oficiales', 'libros del ministerio']::text[],
  '<b>Colección Bicentenario</b>:<br/><br/>Serie oficial de libros de texto de distribución gratuita editados por el MPPE para las diferentes asignaturas y niveles de educación básica.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: Carga Familiar
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'Carga Familiar',
  ARRAY['carga familiar', 'cargas familiares', 'hijos', 'dependientes', 'registro de familiares']::text[],
  '<b>Carga Familiar</b>:<br/><br/>Conjunto de personas (hijos, cónyuge, padres dependientes) registradas bajo la responsabilidad del trabajador para sus beneficios de seguridad social y convenciones colectivas.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: Estatus Laboral
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'Estatus Laboral',
  ARRAY['estatus laboral', 'condicion laboral', 'activo', 'jubilado', 'contratado', 'incapacitado']::text[],
  '<b>Estatus Laboral</b>:<br/><br/>Condición administrativa del personal docente, administrativo u obrero del plantel (Activo, Contratado, Jubilado, Incapacitado o en Comisión de Servicio).',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: Matrícula Inicial
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'Matrícula Inicial',
  ARRAY['matricula inicial', 'inscritos al inicio', 'estudiantes al inicio']::text[],
  '<b>Matrícula Inicial</b>:<br/><br/>Total de estudiantes registrados formalmente inscritos al inicio del año escolar académico.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: Matrícula Final
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'Matrícula Final',
  ARRAY['matricula final', 'promovidos', 'desertores', 'reprobados al final']::text[],
  '<b>Matrícula Final</b>:<br/><br/>Total de estudiantes registrados al culminar el periodo escolar, reportando promovidos, no promovidos y desertores.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: Consejo de Sección
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'Consejo de Sección',
  ARRAY['consejo de seccion', 'consejos de seccion', 'evaluacion de seccion', 'reunion de notas']::text[],
  '<b>Consejo de Sección</b>:<br/><br/>Reunión formal de los docentes de un grupo/año con el orientador y el equipo directivo para evaluar el progreso académico, asistencia y conducta de los estudiantes al cierre de cada lapso o año escolar.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: Boletín Informativo
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'Boletín Informativo',
  ARRAY['boletin', 'boletin informativo', 'boletines', 'boleta de notas', 'boleta']::text[],
  '<b>Boletín Informativo</b>:<br/><br/>Reporte oficial y periódico entregado a padres y representantes al finalizar cada lapso pedagógico con las calificaciones cuantitativas y apreciaciones del estudiante.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: Plan de Evaluación
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'Plan de Evaluación',
  ARRAY['plan de evaluacion', 'planes de evaluacion', 'evaluaciones planificadas', 'ponderacion de notas']::text[],
  '<b>Plan de Evaluación</b>:<br/><br/>Planificación formal estructurada por el docente a inicio del lapso donde se detallan fechas, contenidos, técnicas e instrumentos de evaluación con sus respectivas ponderaciones.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: Plan de Formación
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'Plan de Formación',
  ARRAY['plan de formacion', 'planes de formacion', 'capacitacion docente', 'talleres de docentes']::text[],
  '<b>Plan de Formación</b>:<br/><br/>Cronograma e iniciativas de capacitación profesional y metodológica continua diseñados para actualizar los colectivos docentes del plantel.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: Efemérides Escolares
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'Efemérides Escolares',
  ARRAY['efemerides', 'efemerides escolares', 'fechas patrias', 'efemerides del mes']::text[],
  '<b>Efemérides Escolares</b>:<br/><br/>Fechas patrias, históricas, culturales o conmemorativas nacionales e internacionales que forman parte de la planificación pedagógica mensual y se celebran en la institución.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

-- Tema: Ficha de Inscripción
INSERT INTO public.sigma_conocimiento (tema, palabras_clave, respuesta, accion_tipo, accion_valor, roles_permitidos)
VALUES (
  'Ficha de Inscripción',
  ARRAY['ficha de inscripcion', 'ficha', 'fichas de inscripcion', 'registro de inscripcion']::text[],
  '<b>Ficha de Inscripción</b>:<br/><br/>Documento oficial del plantel donde se asientan todos los datos personales, de salud, sociodemográficos e históricos del estudiante y su representante al formalizar el cupo escolar.',
  NULL,
  NULL,
  ARRAY[]::text[]
)
ON CONFLICT (tema) DO UPDATE SET
  palabras_clave = EXCLUDED.palabras_clave,
  respuesta = EXCLUDED.respuesta,
  roles_permitidos = EXCLUDED.roles_permitidos;

COMMIT;
