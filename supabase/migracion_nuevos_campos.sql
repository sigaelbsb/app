-- Migración para añadir los nuevos campos requeridos al sistema de Solicitud de Cupos
-- Ejecuta este script en el SQL Editor de tu panel de Supabase (https://supabase.com/dashboard/project/nbsrlauuugxfcgjavfve/sql)

-- 1. Campos adicionales generales y para la sección ¿Con quién vive el estudiante? y reconocimiento legal (Paso 3)
ALTER TABLE solicitud_cupos 
ADD COLUMN IF NOT EXISTS observaciones TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS estudiante_con_quien_vive TEXT,
ADD COLUMN IF NOT EXISTS estudiante_reconocido_por_padre TEXT DEFAULT 'Sí';

-- 2. Campos para la información biológica y personal de la Madre (Paso 4)
ALTER TABLE solicitud_cupos 
ADD COLUMN IF NOT EXISTS madre_vive TEXT DEFAULT 'Sí',
ADD COLUMN IF NOT EXISTS madre_es_representante BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS madre_nombres TEXT,
ADD COLUMN IF NOT EXISTS madre_apellidos TEXT,
ADD COLUMN IF NOT EXISTS madre_cedula TEXT,
ADD COLUMN IF NOT EXISTS madre_fecha_nacimiento TEXT,
ADD COLUMN IF NOT EXISTS madre_telefono TEXT,
ADD COLUMN IF NOT EXISTS madre_email TEXT,
ADD COLUMN IF NOT EXISTS madre_trabaja_pdvsa BOOLEAN DEFAULT false;

-- 3. Campos para la información biológica y personal del Padre (Paso 4)
ALTER TABLE solicitud_cupos 
ADD COLUMN IF NOT EXISTS padre_vive TEXT DEFAULT 'Sí',
ADD COLUMN IF NOT EXISTS padre_es_representante BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS padre_nombres TEXT,
ADD COLUMN IF NOT EXISTS padre_apellidos TEXT,
ADD COLUMN IF NOT EXISTS padre_cedula TEXT,
ADD COLUMN IF NOT EXISTS padre_fecha_nacimiento TEXT,
ADD COLUMN IF NOT EXISTS padre_email TEXT,
ADD COLUMN IF NOT EXISTS padre_telefono TEXT,
ADD COLUMN IF NOT EXISTS padre_trabaja_pdvsa BOOLEAN DEFAULT false;
