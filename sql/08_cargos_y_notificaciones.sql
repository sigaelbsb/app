-- 1. Crear tabla de cargos institucionales
CREATE TABLE IF NOT EXISTS public.cargos (
    id_cargo text PRIMARY KEY,
    nombre_cargo text NOT NULL,
    tipo_cargo text NOT NULL,
    descripcion text,
    depende_de text
);

-- 2. Asegurarnos de que la tabla notificaciones tenga la columna 'leido'
ALTER TABLE public.notificaciones ADD COLUMN IF NOT EXISTS leido boolean DEFAULT false;

-- 3. SOLUCIÓN AL ERROR DE SEGURIDAD (RLS): 
-- Deshabilitar Row Level Security o crear una política abierta para que el sistema pueda insertar y editar.
ALTER TABLE public.cargos DISABLE ROW LEVEL SECURITY;

-- En caso de que prefieras mantener RLS activo pero permitir el paso, ejecuta esto también:
-- DROP POLICY IF EXISTS "Permitir todo a cargos" ON public.cargos;
-- CREATE POLICY "Permitir todo a cargos" ON public.cargos FOR ALL USING (true) WITH CHECK (true);
