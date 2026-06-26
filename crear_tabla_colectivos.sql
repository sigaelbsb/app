-- ============================================================
-- SIGAE - Script de migración: MÓDULO GESTIÓN DE COLECTIVOS
-- Ejecutar en el SQL Editor de Supabase (una sola vez)
-- ============================================================

-- 1. Crear la tabla colectivos
CREATE TABLE IF NOT EXISTS public.colectivos (
    id_colectivo        VARCHAR(50)  PRIMARY KEY,
    nombre_colectivo    VARCHAR(150) NOT NULL,
    descripcion         TEXT,
    id_escuela          VARCHAR(10)  NOT NULL,
    vocero_cedula       VARCHAR(20)  NOT NULL,
    vocero_nombre       VARCHAR(150) NOT NULL,
    integrantes         JSONB        NOT NULL DEFAULT '[]'::jsonb,
    planificacion_anual JSONB        NOT NULL DEFAULT '[]'::jsonb,
    reportes_gestion    JSONB        NOT NULL DEFAULT '[]'::jsonb,
    creado_en           TIMESTAMPTZ  DEFAULT NOW()
);

-- 2. Si la tabla ya existía con la columna vocero_tipo, la eliminamos
ALTER TABLE public.colectivos DROP COLUMN IF EXISTS vocero_tipo;

-- 3. Índice para búsquedas rápidas por plantel
CREATE INDEX IF NOT EXISTS idx_colectivos_escuela
    ON public.colectivos(id_escuela);

-- 4. Habilitar Row Level Security
ALTER TABLE public.colectivos ENABLE ROW LEVEL SECURITY;

-- 5. Limpiar políticas previas (evita conflictos si se re-ejecuta)
DROP POLICY IF EXISTS "Permitir lectura de colectivos"          ON public.colectivos;
DROP POLICY IF EXISTS "Permitir insercion de colectivos"        ON public.colectivos;
DROP POLICY IF EXISTS "Permitir actualizacion de colectivos"    ON public.colectivos;
DROP POLICY IF EXISTS "Permitir eliminacion de colectivos"      ON public.colectivos;

-- 6. Crear políticas abiertas (SIGAE usa autenticación propia, no la de Supabase)
CREATE POLICY "Permitir lectura de colectivos"
    ON public.colectivos FOR SELECT USING (true);

CREATE POLICY "Permitir insercion de colectivos"
    ON public.colectivos FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualizacion de colectivos"
    ON public.colectivos FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminacion de colectivos"
    ON public.colectivos FOR DELETE USING (true);

