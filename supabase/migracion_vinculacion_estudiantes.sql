-- Migración para el Módulo de Vinculación y Actualización de Datos Estudiantiles (SIGAE)
-- Ejecuta este script en el SQL Editor de tu panel de Supabase (https://supabase.com/dashboard/project/nbsrlauuugxfcgjavfve/sql)

-- 1. Tabla de Vinculación de Estudiantes con Representantes/Usuarios
CREATE TABLE IF NOT EXISTS estudiantes_vinculaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_escuela TEXT NOT NULL CHECK (codigo_escuela IN ('sb', 'lb')),
    
    -- Datos Primarios del Representante Legal (Cédula referencia a usuarios.cedula)
    cedula_representante TEXT NOT NULL,
    nombres_representante TEXT NOT NULL,
    apellidos_representante TEXT NOT NULL,
    
    -- Datos Primarios del Estudiante (INMUTABLES DURANTE ACTUALIZACIÓN POR PARTE DEL USUARIO)
    cedula_estudiante TEXT NOT NULL UNIQUE,
    nombres_estudiante TEXT NOT NULL,
    apellidos_estudiante TEXT NOT NULL,
    
    -- Ubicación académica en el plantel
    grado_actual TEXT DEFAULT 'Sin Grado Asignado',
    seccion_actual TEXT DEFAULT 'A',
    
    -- Estado de la vinculación y auditoría
    estado TEXT DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    creado_por TEXT,
    
    -- Ficha y Datos Integrales actualizados por el representante (Contacto, Salud, Biometría, Transporte, Autorizados)
    datos_actualizados JSONB DEFAULT '{}'::jsonb,
    fecha_ultima_actualizacion TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda ultrarrápida al iniciar sesión el representante o consultar por estudiante
CREATE INDEX IF NOT EXISTS idx_est_vinc_rep ON estudiantes_vinculaciones(cedula_representante);
CREATE INDEX IF NOT EXISTS idx_est_vinc_est ON estudiantes_vinculaciones(cedula_estudiante);
CREATE INDEX IF NOT EXISTS idx_est_vinc_esc ON estudiantes_vinculaciones(codigo_escuela);
CREATE INDEX IF NOT EXISTS idx_est_vinc_est_st ON estudiantes_vinculaciones(estado);

-- Comentarios explicativos sobre las columnas clave
COMMENT ON TABLE estudiantes_vinculaciones IS 'Almacena la relación entre usuarios representantes/docentes y sus estudiantes asignados en las escuelas de la DEP Oriente.';
COMMENT ON COLUMN estudiantes_vinculaciones.cedula_estudiante IS 'Cédula de Identidad o Cédula Escolar única del alumno. Es campo inmutable en actualización de datos por usuarios standard.';
COMMENT ON COLUMN estudiantes_vinculaciones.datos_actualizados IS 'Objeto JSONB que contiene la ficha integral del alumno (salud, biometría, residencia, transporte y personas autorizadas para retiro).';

-- 2. Políticas de Seguridad (Row Level Security - RLS)
-- Habilitar RLS y otorgar políticas de acceso para permitir creación, consulta, actualización y eliminación
ALTER TABLE estudiantes_vinculaciones ENABLE ROW LEVEL SECURITY;

-- Eliminar política previa si existiera para recrearla limpiamente
DROP POLICY IF EXISTS "Acceso completo para operaciones SIGAE" ON estudiantes_vinculaciones;

-- Crear política de acceso total para usuarios y administradores del portal SIGAE
CREATE POLICY "Acceso completo para operaciones SIGAE" ON estudiantes_vinculaciones
    FOR ALL
    USING (true)
    WITH CHECK (true);
