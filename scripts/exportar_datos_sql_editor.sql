-- ==============================================================================
-- CONSULTA PARA EXPORTAR TODOS LOS DATOS EN 1 SEGUNDO DESDE EL SQL EDITOR
-- Copia y pega esto en el SQL Editor del proyecto VIEJO y dale a "RUN"
-- ==============================================================================

SELECT jsonb_pretty(jsonb_build_object(
  'perfil_escuela', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.perfil_escuela t),
  'roles', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.roles t),
  'usuarios', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.usuarios t),
  'solicitud_cupos', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.solicitud_cupos t),
  'estudiantes_vinculaciones', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.estudiantes_vinculaciones t),
  'conf_preguntas_seguridad', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.conf_preguntas_seguridad t),
  'conf_periodos', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.conf_periodos t),
  'conf_lapsos', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.conf_lapsos t),
  'conf_niveles', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.conf_niveles t),
  'conf_grados', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.conf_grados t),
  'conf_secciones', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.conf_secciones t),
  'espacios', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.espacios t),
  'salones', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.salones t),
  'cargos', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.cargos t),
  'expedientes_docentes', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.expedientes_docentes t),
  'colectivos', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.colectivos t),
  'ajustes_globales', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.ajustes_globales t),
  'transporte_rutas', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.transporte_rutas t),
  'transporte_paradas', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.transporte_paradas t),
  'transporte_operaciones', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.transporte_operaciones t),
  'transporte_asignaciones', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.transporte_asignaciones t),
  'notificaciones_globales', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.notificaciones_globales t),
  'encuestas', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.encuestas t),
  'encuestas_respuestas', (SELECT coalesce(jsonb_agg(t), '[]'::jsonb) FROM public.encuestas_respuestas t)
)) AS backup_completo_sigae;
