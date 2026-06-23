-- ========================================================
-- MIGRACIÓN Y POLÍTICAS DE RLS PARA LA TABLA: INVITADOS
-- Ejecutar este script en el editor SQL de Supabase para
-- solucionar el problema de eliminación silenciosa de visitas.
-- ========================================================

-- 1. Crear tabla si no existe con columnas completas
CREATE TABLE IF NOT EXISTS public.invitados (
    id_invitado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cedula VARCHAR(20) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    correo VARCHAR(150),
    telefono VARCHAR(50),
    razon_visita TEXT NOT NULL,
    escuela_id VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS en invitados (si no está habilitado)
ALTER TABLE public.invitados ENABLE ROW LEVEL SECURITY;

-- 3. Limpiar políticas previas para evitar conflictos
DROP POLICY IF EXISTS "Permitir todo para todos" ON public.invitados;
DROP POLICY IF EXISTS "Permitir lectura de invitados" ON public.invitados;
DROP POLICY IF EXISTS "Permitir insercion de invitados" ON public.invitados;
DROP POLICY IF EXISTS "Permitir eliminacion de invitados" ON public.invitados;

-- 4. Crear nuevas políticas para permitir operaciones públicas/anónimas (SIGAE Custom Auth)
CREATE POLICY "Permitir lectura de invitados" ON public.invitados 
    FOR SELECT USING (true);

CREATE POLICY "Permitir insercion de invitados" ON public.invitados 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir eliminacion de invitados" ON public.invitados 
    FOR DELETE USING (true);
