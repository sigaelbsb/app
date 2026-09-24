-- ==============================================================================
-- MIGRACIÓN: SISTEMA DE NOTIFICACIONES PUSH EN SEGUNDO PLANO Y BADGES (SIGAE)
-- Ejecutar en el SQL Editor de Supabase:
-- https://supabase.com/dashboard/project/nbsrlauuugxfcgjavfve/sql
-- ==============================================================================

-- 1. Crear tabla para almacenar las suscripciones Web Push de los dispositivos de representantes y personal
CREATE TABLE IF NOT EXISTS public.notificaciones_suscripciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id TEXT,
    cedula TEXT,
    escuela_codigo TEXT NOT NULL DEFAULT 'sb',
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de alto rendimiento para despacho masivo en menos de 100ms
CREATE INDEX IF NOT EXISTS idx_notif_subs_esc ON public.notificaciones_suscripciones(escuela_codigo);
CREATE INDEX IF NOT EXISTS idx_notif_subs_ced ON public.notificaciones_suscripciones(cedula);
CREATE INDEX IF NOT EXISTS idx_notif_subs_usr ON public.notificaciones_suscripciones(usuario_id);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.notificaciones_suscripciones ENABLE ROW LEVEL SECURITY;

-- 3. Crear política permisiva para que la PWA y los clientes puedan registrar/actualizar su token
DROP POLICY IF EXISTS "Permitir suscripciones push a usuarios SIGAE" ON public.notificaciones_suscripciones;
CREATE POLICY "Permitir suscripciones push a usuarios SIGAE" ON public.notificaciones_suscripciones
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 4. Comentarios informativos
COMMENT ON TABLE public.notificaciones_suscripciones IS 'Tokens criptográficos de Web Push (Chrome, Edge, Safari iOS) para notificaciones en segundo plano con la app cerrada y contador de insignia roja (Badging API).';
