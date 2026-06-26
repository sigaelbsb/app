-- ==============================================================================
-- SIGAE - Script de migración: ADICIÓN DE CAMPOS ADICIONALES PARA PAAV VACACIONES
-- ==============================================================================

-- 1. Agregar columnas adicionales para alineación con el Formato Oficial PAAV
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS cargo_actual VARCHAR(150);
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS indicador VARCHAR(50);
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS supervisor_nombre VARCHAR(150);
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS supervisor_cedula VARCHAR(20);
ALTER TABLE public.expedientes_docentes ADD COLUMN IF NOT EXISTS supervisor_telefono VARCHAR(20);

-- 2. Recargar esquema para PostgREST (Supabase)
NOTIFY pgrst, 'reload schema';
