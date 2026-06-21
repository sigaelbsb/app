-- ========================================================
-- MIGRACIÓN DE EXPEDIENTES Y USUARIOS: LIBERTADOR BOLÍVAR
-- Generado automáticamente: 2026-06-21T13:29:51.994Z
-- ========================================================

-- 1. Crear tabla si no existe
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
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.expedientes_docentes ENABLE ROW LEVEL SECURITY;

-- 3. Limpiar políticas previas
DROP POLICY IF EXISTS "Permitir lectura individual de su expediente" ON public.expedientes_docentes;
DROP POLICY IF EXISTS "Permitir modificacion de su propio expediente" ON public.expedientes_docentes;

-- 4. Crear nuevas políticas
CREATE POLICY "Permitir lectura individual de su expediente" ON public.expedientes_docentes
    FOR SELECT USING (
        auth.uid()::text = usuario_cedula 
        OR (SELECT rol FROM public.usuarios WHERE cedula = auth.uid()::text) = 'Administrador'
    );

CREATE POLICY "Permitir modificacion de su propio expediente" ON public.expedientes_docentes
    FOR ALL USING (
        auth.uid()::text = usuario_cedula 
        OR (SELECT rol FROM public.usuarios WHERE cedula = auth.uid()::text) = 'Administrador'
    );

BEGIN;

-- Docente: Luis Alfredo Velásquez Alcázar
INSERT INTO public.usuarios (cedula, nombre_completo, rol, id_escuela, email, telefono, clave, estado, primer_ingreso, solicito_reseteo)
VALUES (
  '17242954',
  'Luis Alfredo Velásquez Alcázar',
  'Docente',
  'lb',
  'velarcaz@gmail.com',
  '04249107303',
  '17242954', -- Clave inicial igual a la cédula
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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
)
VALUES (
  '17242954',
  'Masculino',
  '1985-11-14',
  'Concubino/a',
  'Urbanización los Frailejones, Manzana 25, Casa 1, Zona Industrial',
  'Profesor de Matemáticas',
  'Licenciatura / Profesorado',
  'Universidad Pedagógica Experimental Libertador',
  2008,
  '2008-04-04',
  'Fijo',
  36,
  'Activo',
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

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
  fecha_ingreso, tipo_nomina, carga_horaria, estatus_laboral, documentos
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
  '{"cedula": true, "titulo": true, "cv": true, "constancia": false}'::jsonb
)
ON CONFLICT (usuario_cedula) DO NOTHING;

COMMIT;
