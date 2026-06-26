-- ============================================================
-- SIGAE - Script de migración: AJUSTES GLOBALES (MODO MANTENIMIENTO)
-- Ejecutar en el SQL Editor de Supabase (una sola vez)
-- ============================================================

-- 1. Crear la tabla de ajustes globales
CREATE TABLE IF NOT EXISTS public.ajustes_globales (
    clave           VARCHAR(100) PRIMARY KEY,
    valor           TEXT NOT NULL,
    descripcion     TEXT,
    creado_en       TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar Row Level Security
ALTER TABLE public.ajustes_globales ENABLE ROW LEVEL SECURITY;

-- 3. Limpiar políticas previas si existen
DROP POLICY IF EXISTS "Permitir lectura de ajustes" ON public.ajustes_globales;
DROP POLICY IF EXISTS "Permitir modificacion de ajustes" ON public.ajustes_globales;

-- 4. Crear políticas abiertas (SIGAE maneja su propia autenticación)
CREATE POLICY "Permitir lectura de ajustes"
    ON public.ajustes_globales FOR SELECT USING (true);

CREATE POLICY "Permitir modificacion de ajustes"
    ON public.ajustes_globales FOR ALL USING (true) WITH CHECK (true);

-- 5. Insertar parámetros iniciales si no existen
INSERT INTO public.ajustes_globales (clave, valor, descripcion)
VALUES 
    ('mantenimiento_activo', 'false', 'Indica si el sistema está en modo mantenimiento (true/false)'),
    ('bloquear_invitados', 'false', 'Indica si el ingreso de invitados/visitantes está inhabilitado (true/false)')
ON CONFLICT (clave) DO NOTHING;
