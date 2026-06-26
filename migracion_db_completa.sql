-- ==============================================================================
-- SIGAE - Script de migración consolidado: ACTUALIZACIÓN COMPLETA DE EXPEDIENTES
-- ==============================================================================
-- Ejecute este script completo en el editor SQL de Supabase (o consola PostgreSQL)
-- para agregar todas las columnas requeridas por el Gestor de Expedientes y la Ficha PAAV.

BEGIN;

-- 1. Modificar columnas laborales originales para permitir valores nulos (DROP NOT NULL)
ALTER TABLE public.expedientes_docentes ALTER COLUMN fecha_ingreso DROP NOT NULL;
ALTER TABLE public.expedientes_docentes ALTER COLUMN tipo_nomina DROP NOT NULL;
ALTER TABLE public.expedientes_docentes ALTER COLUMN carga_horaria DROP NOT NULL;
ALTER TABLE public.expedientes_docentes ALTER COLUMN estatus_laboral DROP NOT NULL;

-- 2. Agregar columnas para la Ficha Técnica e Historial (Paso 7 y 8)
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS n_personal VARCHAR(50);
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS grupo VARCHAR(50);
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS gerencia VARCHAR(150);
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS organizacion_proceso VARCHAR(150);
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS experiencia_externa JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS historico_pdvsa JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS acciones_personal JSONB DEFAULT '{"promocion": [], "evaluacion": [], "salario": []}'::jsonb;
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS otros_idiomas TEXT;
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS destrezas_habilidades TEXT;
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS desarrollo_carrera TEXT;
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS observaciones_ficha TEXT;
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS estudios_superiores JSONB DEFAULT '[]'::jsonb;

-- 3. Agregar columnas para la Planificación PAAV (Paso 10)
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS fecha_aniversaria DATE;
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS periodo_vacacional VARCHAR(50);
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS vacaciones_desde DATE;
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS vacaciones_hasta DATE;
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS dias_habiles INT;
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS dias_continuos INT;
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS fecha_retorno DATE;

-- 4. Agregar columnas adicionales para el formato de vacaciones oficiales y supervisor
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS cargo_actual VARCHAR(150);
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS indicador VARCHAR(50);
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS supervisor_nombre VARCHAR(150);
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS supervisor_cedula VARCHAR(20);
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS supervisor_telefono VARCHAR(20);

COMMIT;

-- 5. Forzar la recarga del caché de esquema en Supabase
NOTIFY pgrst, 'reload schema';
