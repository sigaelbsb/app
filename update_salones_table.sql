-- ========================================================
-- MIGRACIÓN: AGREGAR DOCENTES GUÍAS A LA TABLA DE SALONES
-- Tabla: public.salones
-- ========================================================

-- Agregar la columna docentes_guias a la tabla salones si no existe
ALTER TABLE public.salones
ADD COLUMN IF NOT EXISTS docentes_guias VARCHAR(20)[] DEFAULT ARRAY[]::VARCHAR(20)[];

-- Comentario sobre el propósito de la columna
COMMENT ON COLUMN public.salones.docentes_guias IS 'Arreglo de cédulas de los docentes guías/responsables de la sección (hasta 3).';
