-- ==============================================================================
-- SIGAE - Script de migración: ACTUALIZACIÓN DE TABLA EXPEDIENTES (SINTAXIS ROBUSTA)
-- ==============================================================================

-- 1. Modificar columnas laborales para permitir valores nulos (DROP NOT NULL)
ALTER TABLE public.expedientes_docentes ALTER COLUMN fecha_ingreso DROP NOT NULL;
ALTER TABLE public.expedientes_docentes ALTER COLUMN tipo_nomina DROP NOT NULL;
ALTER TABLE public.expedientes_docentes ALTER COLUMN carga_horaria DROP NOT NULL;
ALTER TABLE public.expedientes_docentes ALTER COLUMN estatus_laboral DROP NOT NULL;

-- 2. Agregar nuevas columnas para la Ficha Docente (Una por una para máxima compatibilidad)
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

-- 3. Agregar columnas para la Planilla PAAV (Vacaciones)
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS fecha_aniversaria DATE;
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS periodo_vacacional VARCHAR(50);
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS vacaciones_desde DATE;
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS vacaciones_hasta DATE;
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS dias_habiles INT;
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS dias_continuos INT;
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS fecha_retorno DATE;

-- 4. Forzar recarga de caché de la API
NOTIFY pgrst, 'reload schema';
