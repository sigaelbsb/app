-- =========================================================================
-- SIGAE - Migración: Rutograma Oficial y Despacho WhatsApp de Transporte
-- =========================================================================
-- Ejecutar en Supabase SQL Editor si se desea persistir las columnas dedicadas:
-- https://supabase.com/dashboard/project/nbsrlauuugxfcgjavfve/sql

ALTER TABLE transporte_rutas
ADD COLUMN IF NOT EXISTS motivo_inactivo TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS docente_telefono TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS chofer_telefono TEXT DEFAULT '';

COMMENT ON COLUMN transporte_rutas.motivo_inactivo IS 'Razón o condición técnica de la unidad cuando la ruta está inactiva/inhabilitada';
COMMENT ON COLUMN transporte_rutas.docente_telefono IS 'Teléfono de contacto directo del docente de guardia para la ruta';
