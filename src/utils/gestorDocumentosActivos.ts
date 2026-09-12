import { supabase } from '../lib/supabase';

export type TipoDocumentoEstudiantil = 'inscripcion' | 'estudio' | 'conducta' | 'resumen' | 'carnet' | 'aceptacion' | 'normas';

export type TipoDisenoCreativo = 
  | 'certificados' 
  | 'flyers' 
  | 'invitaciones' 
  | 'tapas' 
  | 'comunicados' 
  | 'cumpleanos' 
  | 'encuestas';

export type ModoTemporadaEscolar = 'inscripciones' | 'clases_regulares' | 'personalizado';

export interface ConfiguracionDocumentosYDIsenos {
  // Modo de Temporada
  modo_temporada: ModoTemporadaEscolar;
  
  // Constancias por Escuela (SB)
  constancia_inscripcion_sb: boolean;
  constancia_estudio_sb: boolean;
  constancia_conducta_sb: boolean;
  resumen_ficha_sb: boolean;
  carnet_sb: boolean;
  carta_aceptacion_sb: boolean;
  normas_internas_sb: boolean;

  // Constancias por Escuela (LB)
  constancia_inscripcion_lb: boolean;
  constancia_estudio_lb: boolean;
  constancia_conducta_lb: boolean;
  resumen_ficha_lb: boolean;
  carnet_lb: boolean;
  carta_aceptacion_lb: boolean;
  normas_internas_lb: boolean;

  // Herramientas de Diseño Creativo (Global / Portal)
  diseno_certificados: boolean;
  diseno_flyers: boolean;
  diseno_invitaciones: boolean;
  diseno_tapas: boolean;
  diseno_comunicados: boolean;
  diseno_cumpleanos: boolean;
  diseno_encuestas: boolean;
}

export const CONFIGURACION_DEFAULT: ConfiguracionDocumentosYDIsenos = {
  modo_temporada: 'inscripciones',
  
  // SB
  constancia_inscripcion_sb: true,
  constancia_estudio_sb: false,
  constancia_conducta_sb: false,
  resumen_ficha_sb: true,
  carnet_sb: false,
  carta_aceptacion_sb: true,
  normas_internas_sb: true,

  // LB
  constancia_inscripcion_lb: true,
  constancia_estudio_lb: false,
  constancia_conducta_lb: false,
  resumen_ficha_lb: true,
  carnet_lb: false,
  carta_aceptacion_lb: true,
  normas_internas_lb: true,

  // Diseños Creativos
  diseno_certificados: true,
  diseno_flyers: true,
  diseno_invitaciones: true,
  diseno_tapas: true,
  diseno_comunicados: true,
  diseno_cumpleanos: true,
  diseno_encuestas: true
};

const STORAGE_KEY = 'sigae_config_documentos_activos';

/**
 * Obtiene la configuración actual desde localStorage (rápido y síncrono)
 */
export const obtenerConfiguracionDocumentos = (): ConfiguracionDocumentosYDIsenos => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...CONFIGURACION_DEFAULT, ...parsed };
    }
  } catch (e) {
    console.warn('Error leyendo configuración de documentos de localStorage:', e);
  }
  return { ...CONFIGURACION_DEFAULT };
};

/**
 * Guarda la configuración en localStorage y emite evento reactivo
 */
export const guardarConfiguracionDocumentosLocal = (config: ConfiguracionDocumentosYDIsenos) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    
    // Retrocompatibilidad con claves individuales de carnets y módulos existentes
    localStorage.setItem('sigae_carnet_activo_sb', config.carnet_sb ? 'true' : 'false');
    localStorage.setItem('sigae_carnet_activo_lb', config.carnet_lb ? 'true' : 'false');
    localStorage.setItem('sigae_carnet_activo', (config.carnet_sb || config.carnet_lb) ? 'true' : 'false');

    // Emitir evento para reactividad instantánea en cualquier componente
    window.dispatchEvent(new CustomEvent('sigae-documentos-config-changed', { detail: config }));
  } catch (e) {
    console.warn('Error guardando configuración local de documentos:', e);
  }
};

/**
 * Sincroniza y descarga la configuración más reciente desde Supabase (ajustes_globales)
 */
export const cargarConfiguracionDocumentosBD = async (): Promise<ConfiguracionDocumentosYDIsenos> => {
  try {
    const { data, error } = await supabase
      .from('ajustes_globales')
      .select('clave, valor')
      .eq('clave', 'config_documentos_disenos_activos')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Aviso leyendo config_documentos_disenos_activos de BD:', error);
    }

    if (data && data.valor) {
      try {
        const parsed = JSON.parse(data.valor);
        const merged: ConfiguracionDocumentosYDIsenos = { ...CONFIGURACION_DEFAULT, ...parsed };
        guardarConfiguracionDocumentosLocal(merged);
        return merged;
      } catch (err) {
        console.warn('Error al parsear config_documentos_disenos_activos:', err);
      }
    }
  } catch (e) {
    console.warn('Error en cargarConfiguracionDocumentosBD:', e);
  }
  return obtenerConfiguracionDocumentos();
};

/**
 * Guarda la configuración completa tanto en Supabase como en localStorage
 */
export const guardarConfiguracionDocumentosBD = async (
  config: ConfiguracionDocumentosYDIsenos
): Promise<boolean> => {
  // 1. Guardar de inmediato en local
  guardarConfiguracionDocumentosLocal(config);

  // 2. Persistir en Supabase
  try {
    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from('ajustes_globales')
      .upsert({
        clave: 'config_documentos_disenos_activos',
        valor: JSON.stringify(config),
        descripcion: 'Configuración maestra de documentos, constancias y diseños activos en el sistema',
        actualizado_en: nowIso
      }, { onConflict: 'clave' });

    // También sincronizar las claves de carnets individuales para compatibilidad histórica
    await supabase.from('ajustes_globales').upsert([
      { clave: 'carnet_activo_sb', valor: String(config.carnet_sb), actualizado_en: nowIso },
      { clave: 'carnet_activo_lb', valor: String(config.carnet_lb), actualizado_en: nowIso },
      { clave: 'carnet_activo', valor: String(config.carnet_sb || config.carnet_lb), actualizado_en: nowIso }
    ], { onConflict: 'clave' });

    if (error) {
      console.warn('Error persistiendo en ajustes_globales:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Error conectando con Supabase para guardar configuración:', e);
    return false;
  }
};

/**
 * Consulta si un documento específico está activo para una escuela determinada
 */
export const esDocumentoActivo = (
  tipo: TipoDocumentoEstudiantil, 
  escCodigo?: string
): boolean => {
  const config = obtenerConfiguracionDocumentos();
  const esc = (escCodigo || 'sb').toLowerCase().trim();

  if (tipo === 'carnet') {
    return esc === 'lb' ? config.carnet_lb : config.carnet_sb;
  }
  if (tipo === 'inscripcion') {
    return esc === 'lb' ? config.constancia_inscripcion_lb : config.constancia_inscripcion_sb;
  }
  if (tipo === 'estudio') {
    return esc === 'lb' ? config.constancia_estudio_lb : config.constancia_estudio_sb;
  }
  if (tipo === 'conducta') {
    return esc === 'lb' ? config.constancia_conducta_lb : config.constancia_conducta_sb;
  }
  if (tipo === 'resumen') {
    return esc === 'lb' ? config.resumen_ficha_lb : config.resumen_ficha_sb;
  }
  if (tipo === 'aceptacion') {
    return esc === 'lb' ? config.carta_aceptacion_lb : config.carta_aceptacion_sb;
  }
  if (tipo === 'normas') {
    return esc === 'lb' ? config.normas_internas_lb : config.normas_internas_sb;
  }
  return true;
};

/**
 * Consulta si una herramienta del estudio de diseño está activa
 */
export const esDisenoActivo = (tipo: TipoDisenoCreativo): boolean => {
  const config = obtenerConfiguracionDocumentos();
  switch (tipo) {
    case 'certificados': return config.diseno_certificados;
    case 'flyers': return config.diseno_flyers;
    case 'invitaciones': return config.diseno_invitaciones;
    case 'tapas': return config.diseno_tapas;
    case 'comunicados': return config.diseno_comunicados;
    case 'cumpleanos': return config.diseno_cumpleanos;
    case 'encuestas': return config.diseno_encuestas;
    default: return true;
  }
};

/**
 * Aplica un preset rápido de temporada (Inscripciones vs Clases Regulares)
 */
export const aplicarPresetTemporada = async (
  modo: ModoTemporadaEscolar,
  escuelaTarget: 'sb' | 'lb' | 'ambas' = 'ambas'
): Promise<ConfiguracionDocumentosYDIsenos> => {
  const config = { ...obtenerConfiguracionDocumentos() };
  config.modo_temporada = modo;

  if (modo === 'inscripciones') {
    if (escuelaTarget === 'sb' || escuelaTarget === 'ambas') {
      config.constancia_inscripcion_sb = true;
      config.constancia_estudio_sb = false;
      config.resumen_ficha_sb = true;
      config.carnet_sb = true;
    }
    if (escuelaTarget === 'lb' || escuelaTarget === 'ambas') {
      config.constancia_inscripcion_lb = true;
      config.constancia_estudio_lb = false;
      config.resumen_ficha_lb = true;
      config.carnet_lb = true;
    }
  } else if (modo === 'clases_regulares') {
    if (escuelaTarget === 'sb' || escuelaTarget === 'ambas') {
      config.constancia_inscripcion_sb = false;
      config.constancia_estudio_sb = true;
      config.constancia_conducta_sb = true;
      config.resumen_ficha_sb = true;
      config.carnet_sb = true;
    }
    if (escuelaTarget === 'lb' || escuelaTarget === 'ambas') {
      config.constancia_inscripcion_lb = false;
      config.constancia_estudio_lb = true;
      config.constancia_conducta_lb = true;
      config.resumen_ficha_lb = true;
      config.carnet_lb = true;
    }
  }

  await guardarConfiguracionDocumentosBD(config);
  return config;
};

/**
 * Modifica una propiedad individual y sincroniza
 */
export const modificarAjusteDocumento = async (
  campo: keyof ConfiguracionDocumentosYDIsenos,
  valor: any
): Promise<ConfiguracionDocumentosYDIsenos> => {
  const config = { ...obtenerConfiguracionDocumentos(), [campo]: valor };
  config.modo_temporada = 'personalizado';
  await guardarConfiguracionDocumentosBD(config);
  return config;
};
