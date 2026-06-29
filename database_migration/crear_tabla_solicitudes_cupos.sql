-- ============================================================
-- SIGAE - Script de migración: CREACIÓN DE TABLA SOLICITUD DE CUPOS
-- Versión 2.0 - Incluye todos los campos del formulario oficial
-- Ejecutar en el SQL Editor de Supabase (una sola vez)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.solicitud_cupos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_escuela VARCHAR(10) NOT NULL, -- 'sb' (Santa Bárbara) o 'lb' (Libertador Bolívar)
    codigo_unico VARCHAR(30) UNIQUE,     -- Código único verificable con QR: SC-LB-2025-XXXXXXXX

    -- Términos y Condiciones
    acepta_terminos BOOLEAN NOT NULL DEFAULT FALSE,

    -- Datos del Estudiante
    estudiante_nombres VARCHAR(100) NOT NULL,
    estudiante_apellidos VARCHAR(100) NOT NULL,
    estudiante_cedula VARCHAR(20),
    estudiante_fecha_nacimiento DATE NOT NULL,
    estudiante_sexo VARCHAR(10) NOT NULL,
    estudiante_orden_nacimiento SMALLINT,         -- N° de hijo en la familia (orden de nacimiento)
    estudiante_condicion_neuro VARCHAR(50),       -- Neurotípico o Neurodivergente
    estudiante_informe_neuro BOOLEAN,             -- Si tiene informe médico
    grado_solicitado VARCHAR(50) NOT NULL,
    parentesco VARCHAR(50) NOT NULL,              -- Parentesco del representante con el estudiante
    plantel_procedencia VARCHAR(150),
    direccion_habitacion TEXT,
    estado_habitacion VARCHAR(100),              -- Estado venezolano de residencia
    municipio_habitacion VARCHAR(150),           -- Municipio de residencia
    parroquia_habitacion VARCHAR(150),           -- Parroquia/Sector de residencia
    tiene_otros_inscritos BOOLEAN DEFAULT FALSE,  -- Otros representados inscritos en el plantel

    -- Datos del Representante Principal (Padre/Madre/Otro)
    representante_nombres VARCHAR(100) NOT NULL,
    representante_apellidos VARCHAR(100) NOT NULL,
    representante_cedula VARCHAR(20) NOT NULL,
    representante_telefono VARCHAR(30) NOT NULL,
    representante_telefono2 VARCHAR(30),          -- Teléfono alternativo
    representante_email VARCHAR(150) NOT NULL,
    representante_parentesco VARCHAR(50) NOT NULL,
    representante_trabaja_pdvsa VARCHAR(50) NOT NULL DEFAULT 'No',

    -- Datos PDVSA del Representante (si aplica)
    pdvsa_condicion_laboral VARCHAR(50),          -- Activo / Jubilado / etc.
    pdvsa_tipo_nomina VARCHAR(50),                -- Contractual / No Contractual / etc.
    pdvsa_negocio_filial VARCHAR(100),            -- Negocios / Filiales
    pdvsa_gerencia VARCHAR(100),                  -- Organización/Gerencia
    pdvsa_email_empresa VARCHAR(150),             -- Correo corporativo
    pdvsa_localidad_trabajo VARCHAR(100),         -- Ciudad/Localidad de trabajo

    -- Datos de la Madre (si aplica)
    madre_cedula VARCHAR(20),
    madre_email VARCHAR(150),
    madre_trabaja_pdvsa BOOLEAN DEFAULT FALSE,

    -- Transporte Escolar
    requiere_transporte BOOLEAN DEFAULT FALSE,
    ruta_transporte VARCHAR(200),                 -- Ruta seleccionada

    -- Documentos Adjuntos
    doc_ficha TEXT,
    doc_foto_estudiante TEXT,
    doc_partida_nacimiento TEXT,
    doc_cedula_estudiante TEXT,

    -- Estado e Historial
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente', -- 'Pendiente', 'Aprobado', 'Rechazado'
    observaciones TEXT,
    creado_por VARCHAR(20) NOT NULL,              -- Cédula del usuario que creó la solicitud
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único para el código único
CREATE UNIQUE INDEX IF NOT EXISTS idx_solicitud_cupos_codigo_unico 
    ON public.solicitud_cupos(codigo_unico) 
    WHERE codigo_unico IS NOT NULL;

-- Índice para búsquedas por escuela y estado
CREATE INDEX IF NOT EXISTS idx_solicitud_cupos_escuela_estado 
    ON public.solicitud_cupos(codigo_escuela, estado);

-- ============================================================
-- SCRIPT DE MIGRACIÓN (solo si la tabla ya existe)
-- Ejecutar solo si ya tienes la tabla creada con la versión anterior
-- ============================================================
-- ALTER TABLE public.solicitud_cupos ADD COLUMN IF NOT EXISTS codigo_unico VARCHAR(30) UNIQUE;
-- ALTER TABLE public.solicitud_cupos ADD COLUMN IF NOT EXISTS acepta_terminos BOOLEAN NOT NULL DEFAULT FALSE;
-- ALTER TABLE public.solicitud_cupos ADD COLUMN IF NOT EXISTS estudiante_orden_nacimiento SMALLINT;
-- ALTER TABLE public.solicitud_cupos ADD COLUMN IF NOT EXISTS estudiante_condicion_neuro VARCHAR(50);
-- ALTER TABLE public.solicitud_cupos ADD COLUMN IF NOT EXISTS estudiante_informe_neuro BOOLEAN;
-- ALTER TABLE public.solicitud_cupos ADD COLUMN IF NOT EXISTS parentesco VARCHAR(50);
-- ALTER TABLE public.solicitud_cupos ADD COLUMN IF NOT EXISTS estado_habitacion VARCHAR(100);
-- ALTER TABLE public.solicitud_cupos ADD COLUMN IF NOT EXISTS municipio_habitacion VARCHAR(150);
-- ALTER TABLE public.solicitud_cupos ADD COLUMN IF NOT EXISTS parroquia_habitacion VARCHAR(150);
-- ALTER TABLE public.solicitud_cupos ADD COLUMN IF NOT EXISTS tiene_otros_inscritos BOOLEAN DEFAULT FALSE;
-- ALTER TABLE public.solicitud_cupos ADD COLUMN IF NOT EXISTS representante_telefono2 VARCHAR(30);
-- ALTER TABLE public.solicitud_cupos ADD COLUMN IF NOT EXISTS pdvsa_condicion_laboral VARCHAR(50);
-- ALTER TABLE public.solicitud_cupos ADD COLUMN IF NOT EXISTS pdvsa_tipo_nomina VARCHAR(50);
-- ALTER TABLE public.solicitud_cupos ADD COLUMN IF NOT EXISTS pdvsa_negocio_filial VARCHAR(100);
-- ALTER TABLE public.solicitud_cupos ADD COLUMN IF NOT EXISTS pdvsa_gerencia VARCHAR(100);
-- ALTER TABLE public.solicitud_cupos ADD COLUMN IF NOT EXISTS pdvsa_email_empresa VARCHAR(150);
-- ALTER TABLE public.solicitud_cupos ADD COLUMN IF NOT EXISTS pdvsa_localidad_trabajo VARCHAR(100);
-- ALTER TABLE public.solicitud_cupos ADD COLUMN IF NOT EXISTS madre_cedula VARCHAR(20);
-- ALTER TABLE public.solicitud_cupos ADD COLUMN IF NOT EXISTS madre_email VARCHAR(150);
-- ALTER TABLE public.solicitud_cupos ADD COLUMN IF NOT EXISTS madre_trabaja_pdvsa BOOLEAN DEFAULT FALSE;
-- ALTER TABLE public.solicitud_cupos ADD COLUMN IF NOT EXISTS requiere_transporte BOOLEAN DEFAULT FALSE;
-- ALTER TABLE public.solicitud_cupos ADD COLUMN IF NOT EXISTS ruta_transporte VARCHAR(200);

-- ============================================================
-- HABILITAR RLS Y POLÍTICAS
-- ============================================================
ALTER TABLE public.solicitud_cupos ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas previas
DROP POLICY IF EXISTS "Permitir lectura de solicitudes" ON public.solicitud_cupos;
DROP POLICY IF EXISTS "Permitir insercion de solicitudes" ON public.solicitud_cupos;
DROP POLICY IF EXISTS "Permitir modificacion de solicitudes" ON public.solicitud_cupos;

-- Crear nuevas políticas
CREATE POLICY "Permitir lectura de solicitudes" ON public.solicitud_cupos 
    FOR SELECT USING (true);

CREATE POLICY "Permitir insercion de solicitudes" ON public.solicitud_cupos 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir modificacion de solicitudes" ON public.solicitud_cupos 
    FOR ALL USING (true) WITH CHECK (true);

-- Notificar recarga de esquema de PostgREST
NOTIFY pgrst, 'reload schema';
