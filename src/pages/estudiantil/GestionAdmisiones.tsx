import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';
import * as XLSX from 'xlsx';
import {
  buscarPlantillaAdmision,
  renderizarMensajeAdmision,
  generarEnlaceWhatsAppAdmision,
  sincronizarPlantillasAdmisionDesdeBD
} from '../../utils/plantillasAdmision';
import {
  PLANTILLAS_ACEPTACION_DEFAULT,
  descargarCartaAceptacionPDF,
  obtenerPlantillasCartaAceptacion,
  type DatosAspiranteCartaAceptacion
} from '../../utils/generadorCartaAceptacion';
import { ChamiloBreadcrumb, ChamiloHelpCallout, IconoGestionAdmisiones } from '../../components/chamilo';

const Swal = (window as any).Swal;

export interface SolicitudAdmision {
  id: string | number;
  codigo_unico: string;
  codigo_escuela: string;
  estudiante_nombres: string;
  estudiante_apellidos: string;
  estudiante_cedula?: string;
  estudiante_fecha_nacimiento?: string;
  estudiante_sexo?: string;
  estudiante_condicion_neuro?: string;
  estudiante_condicion_medica?: string;
  grado_solicitado: string;
  plantel_procedencia?: string;
  representante_nombres: string;
  representante_apellidos: string;
  representante_cedula: string;
  representante_telefono?: string;
  representante_telefono2?: string;
  representante_email?: string;
  representante_parentesco?: string;
  parentesco?: string;
  representante_trabaja_pdvsa?: string | boolean;
  pdvsa_condicion_laboral?: string;
  pdvsa_tipo_nomina?: string;
  pdvsa_negocio_filial?: string;
  pdvsa_gerencia?: string;
  pdvsa_localidad_trabajo?: string;
  pdvsa_email_empresa?: string;
  es_personal_escuela?: boolean;
  madre_nombres?: string;
  madre_apellidos?: string;
  madre_cedula?: string;
  madre_telefono?: string;
  madre_trabaja_pdvsa?: string | boolean;
  padre_nombres?: string;
  padre_apellidos?: string;
  padre_cedula?: string;
  padre_telefono?: string;
  padre_trabaja_pdvsa?: string | boolean;
  estado_habitacion?: string;
  municipio_habitacion?: string;
  parroquia_habitacion?: string;
  direccion_habitacion?: string;
  requiere_transporte?: boolean;
  ruta_transporte?: string;
  doc_ficha?: string;
  doc_foto_estudiante?: string;
  doc_partida_nacimiento?: string;
  doc_cedula_estudiante?: string;
  doc_partida_trabajador?: string;
  doc_partida_nexo?: string;
  foto_partida_nacimiento_url?: string;
  foto_cedula_estudiante_url?: string;
  foto_carnet_url?: string;
  foto_informe_medico_url?: string;
  foto_carnet_conapdis_url?: string;
  foto_cedula_madre_url?: string;
  foto_cedula_padre_url?: string;
  constancia_cultura_url?: string;
  constancia_danza_url?: string;
  constancia_deporte_url?: string;
  documentos_adjuntos?: any;
  datos_actualizados?: any;
  estado: string; // 'Pendiente' | 'Aprobado' | 'Rechazado' | 'En Evaluación' | 'Formalizado' | 'Borrador'
  aptitud?: 'Apto' | 'No Apto' | 'En Evaluación' | string;
  prioridad_manual?: number | null;
  instruccion_jerarquica?: boolean;
  instruccion_quien?: string | null;
  instruccion_motivo?: string;
  whatsapp_notificado?: boolean;
  whatsapp_fecha?: string | null;
  whatsapp_estado?: string | null;
  acceso_habilitado?: boolean;
  acceso_fecha?: string | null;
  observaciones?: string;
  creado_por?: string;
  created_at?: string;
}

export interface DocumentoAdjuntoItem {
  id: string;
  tipo: string;
  titulo: string;
  subtitulo?: string;
  url: string;
  icono: string;
  color: string;
}

export const obtenerDocumentosSolicitud = (sol?: SolicitudAdmision | null): DocumentoAdjuntoItem[] => {
  if (!sol) return [];
  const list: DocumentoAdjuntoItem[] = [];

  const addDoc = (tipo: string, titulo: string, url?: string | null, icono = 'bi-file-earmark-text', color = '#2563eb', subtitulo?: string) => {
    if (url && typeof url === 'string' && url.trim().length > 5) {
      const cleanUrl = url.trim();
      if (!list.some(d => d.url === cleanUrl)) {
        list.push({ id: `${tipo}-${list.length}`, tipo, titulo, subtitulo, url: cleanUrl, icono, color });
      }
    }
  };

  // 1. Partida de Nacimiento del Estudiante
  addDoc('partida', 'Partida de Nacimiento del Estudiante', sol.doc_partida_nacimiento || sol.foto_partida_nacimiento_url, 'bi-file-earmark-person-fill', '#16a34a', 'Requisito Principal');
  
  // 2. Cédula del Estudiante
  addDoc('cedula_estudiante', 'Cédula de Identidad / Escolar', sol.doc_cedula_estudiante || sol.foto_cedula_estudiante_url, 'bi-card-heading', '#0284c7', 'Identificación Estudiante');

  // 3. Foto tipo carnet
  addDoc('foto_estudiante', 'Foto tipo Carnet', sol.doc_foto_estudiante || sol.foto_carnet_url, 'bi-person-bounding-box', '#8b5cf6', 'Fotografía Aspirante');

  // 4. Ficha / Constancia del Trabajador
  addDoc('ficha_trabajador', 'Ficha / Constancia del Trabajador', sol.doc_ficha, 'bi-building-fill', '#d97706', 'Vínculo Laboral PDVSA/Filial');

  // 5. Partida de Nacimiento del Trabajador (Sobrino/Hermano)
  addDoc('partida_trabajador', 'Partida de Nacimiento del Trabajador', sol.doc_partida_trabajador, 'bi-file-earmark-medical-fill', '#b45309', 'Nexo Familiar Trabajador');

  // 6. Partida de Nacimiento de Padre/Madre (Nexo)
  addDoc('partida_nexo', 'Partida de Nacimiento de Padre/Madre (Nexo)', sol.doc_partida_nexo, 'bi-diagram-3-fill', '#c026d3', 'Comprobante de Filiación');

  // 7. Informes médicos / Neurodivergencia
  addDoc('informe_medico', 'Informe Médico / Diagnóstico', sol.foto_informe_medico_url, 'bi-heart-pulse-fill', '#dc2626', 'Salud y Bienestar');

  // 8. Carnet CONAPDIS
  addDoc('conapdis', 'Certificado / Carnet CONAPDIS', sol.foto_carnet_conapdis_url, 'bi-person-wheelchair', '#ea580c', 'Discapacidad / Inclusión');

  // 9. Cédulas Padre / Madre
  addDoc('cedula_madre', 'Cédula de la Madre', sol.foto_cedula_madre_url, 'bi-gender-female', '#db2777', 'Documento Progenitor');
  addDoc('cedula_padre', 'Cédula del Padre', sol.foto_cedula_padre_url, 'bi-gender-male', '#2563eb', 'Documento Progenitor');

  // 10. Talentos / Constancias
  addDoc('cultura', 'Constancia Cultural / Música', sol.constancia_cultura_url, 'bi-music-note-beamed', '#4f46e5', 'Actividades Extracurriculares');
  addDoc('danza', 'Constancia de Danza / Teatro', sol.constancia_danza_url, 'bi-stars', '#7c3aed', 'Actividades Extracurriculares');
  addDoc('deporte', 'Constancia Deportiva', sol.constancia_deporte_url, 'bi-trophy-fill', '#059669', 'Actividades Extracurriculares');

  // 11. Extraer de JSON datos_actualizados o documentos_adjuntos si existen
  if (sol.datos_actualizados && typeof sol.datos_actualizados === 'object') {
    const d = sol.datos_actualizados;
    addDoc('partida', 'Partida de Nacimiento', d.foto_partida_nacimiento_url || d.doc_partida_nacimiento, 'bi-file-earmark-person-fill', '#16a34a');
    addDoc('cedula_estudiante', 'Cédula Estudiante', d.foto_cedula_estudiante_url || d.doc_cedula_estudiante, 'bi-card-heading', '#0284c7');
    addDoc('foto_estudiante', 'Foto Carnet', d.foto_carnet_url || d.doc_foto_estudiante, 'bi-person-bounding-box', '#8b5cf6');
    addDoc('informe_medico', 'Informe Médico', d.foto_informe_medico_url, 'bi-heart-pulse-fill', '#dc2626');
    addDoc('conapdis', 'Carnet CONAPDIS', d.foto_carnet_conapdis_url, 'bi-person-wheelchair', '#ea580c');
  }

  return list;
};

export interface BaremoResult {
  nivel: number; // 0 (VIP) a 8
  codigo: string; // 'P0', 'P1', ..., 'P8'
  etiqueta: string;
  badgeBg: string;
  badgeText: string;
  descripcion: string;
}

export interface UsuarioPersonal {
  cedula: string;
  rol: string;
  id_escuela: string;
  nombre_completo: string;
}

const NOMBRE_ESCUELA_MAP: Record<string, string> = {
  sb: 'U.E. Santa Bárbara',
  lb: 'U.E. Libertador Bolívar',
  todas: 'Todas las Escuelas',
};

// ── LIMPIEZA DE CÉDULA ─────────────────────────────────────────────────────────
export const cleanCedula = (c?: string): string => (c || '').replace(/\D/g, '');

// ── FORMATEADOR DE NOMBRES COMPLETOS CON ESPACIADO GARANTIZADO ─────────────────
export const nombreCompleto = (nombres?: string, apellidos?: string): string => {
  const n = (nombres || '').trim();
  const a = (apellidos || '').trim();
  if (n && a) return `${n} ${a}`;
  return n || a || 'Sin nombre registrado';
};

// ── NORMALIZACIÓN DE GRADOS PARA COMPARACIÓN UNIFICADA (SIN FALSOS POSITIVOS) ──
export const normalizarGrado = (g?: string): string => {
  if (!g) return '';
  const str = g.toLowerCase().trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remover acentos
    .replace(/[°º]/g, '');

  // Maternal / Lactante
  if (str.includes('maternal') || str.includes('lactante') || str.includes('guarder') || str.includes('sala cuna')) return 'maternal';

  // Grupos inicial: Evaluar III Grupo antes de II Grupo para evitar que "iii" contenga "ii"
  if (/\b(3|3er|3ro|tercer|tercero|iii)\b/i.test(str) && str.includes('grupo')) return '3_grupo';
  if (/\b(2|2do|2da|segundo|segunda|ii)\b/i.test(str) && str.includes('grupo')) return '2_grupo';
  if (/\b(1|1er|1ro|1ra|primer|primero|primera|i)\b/i.test(str) && str.includes('grupo')) return '1_grupo';

  // Primaria Grados
  if (/\b(1|1er|1ro|primer|primero|primera)\b/i.test(str) && str.includes('grado')) return '1_grado';
  if (/\b(2|2do|2da|segundo|segunda)\b/i.test(str) && str.includes('grado')) return '2_grado';
  if (/\b(3|3er|3ro|tercer|tercero|tercera)\b/i.test(str) && str.includes('grado')) return '3_grado';
  if (/\b(4|4to|4ta|cuarto|cuarta)\b/i.test(str) && str.includes('grado')) return '4_grado';
  if (/\b(5|5to|5ta|quinto|quinta)\b/i.test(str) && str.includes('grado')) return '5_grado';
  if (/\b(6|6to|6ta|sexto|sexta)\b/i.test(str) && str.includes('grado')) return '6_grado';

  // Secundaria Años
  if (/\b(1|1er|1ro|primer|primero)\b/i.test(str) && (str.includes('ano') || str.includes('anio'))) return '1_ano';
  if (/\b(2|2do|segundo)\b/i.test(str) && (str.includes('ano') || str.includes('anio'))) return '2_ano';
  if (/\b(3|3er|3ro|tercer|tercero)\b/i.test(str) && (str.includes('ano') || str.includes('anio'))) return '3_ano';
  if (/\b(4|4to|cuarto)\b/i.test(str) && (str.includes('ano') || str.includes('anio'))) return '4_ano';
  if (/\b(5|5to|quinto)\b/i.test(str) && (str.includes('ano') || str.includes('anio'))) return '5_ano';

  return str.replace(/\s+/g, '_');
};

// ── VERIFICACIÓN EXHAUSTIVA DE ACCESO HABILITADO EN SIGAE ──────────────────────
export const verificarAccesoHabilitado = (
  sol?: SolicitudAdmision | null,
  matriculaBD?: any[]
): { habilitado: boolean; fecha?: string } => {
  if (!sol) return { habilitado: false };
  if (sol.estado === 'Formalizado') return { habilitado: true };
  if (sol.acceso_habilitado) return { habilitado: true, fecha: sol.acceso_fecha || undefined };

  const obs = sol.observaciones || '';
  const matchAcceso = obs.match(/\[Acceso Habilitado en SIGAE(?: el ([^\]]+))?\]/i) ||
                      obs.match(/\[Acceso SIGAE Habilitado(?: el ([^\]]+))?\]/i) ||
                      obs.match(/\[Inscripción Física Formalizada(?: el ([^\]]+))?\]/i);
  if (matchAcceso) {
    return { habilitado: true, fecha: matchAcceso[1]?.trim() };
  }

  // Comprobar si existe en estudiantesMatriculaBD
  if (matriculaBD && matriculaBD.length > 0) {
    const cedEst = cleanCedula(sol.estudiante_cedula);
    const codEst = `t-${(sol.codigo_unico || '').toLowerCase()}`;
    const codEsc = `esc-${(sol.codigo_unico || '').toLowerCase()}`;
    const cedRep = cleanCedula(sol.representante_cedula);

    const vinc = matriculaBD.find((v: any) => {
      const c = (v.cedula_estudiante || '').toLowerCase().trim();
      const r = cleanCedula(v.cedula_representante);
      const creadoPor = (v.creado_por || '').toLowerCase();

      const matchEst = (cedEst && cleanCedula(c) === cedEst) || c === codEst || c === codEsc;
      const matchRep = cedRep && r === cedRep;

      return (matchEst && matchRep) || (matchEst && creadoPor.includes('admisiones'));
    });

    if (vinc) return { habilitado: true };
  }

  return { habilitado: false };
};

// ── PARSER Y SERIALIZADOR DE OBSERVACIONES / METADATOS ──────────────────────────
export const parsearObservaciones = (obs?: string) => {
  let aptitud = 'En Evaluación';
  let instruccion_jerarquica = false;
  let instruccion_quien: string | null = null;
  let prioridad_manual: number | null = null;
  let es_personal_escuela = false;
  let whatsapp_notificado = false;
  let whatsapp_fecha: string | null = null;
  let whatsapp_estado: string | null = null;
  let whatsapp_orientaciones_notificado = false;
  let whatsapp_orientaciones_fecha: string | null = null;
  let acceso_habilitado = false;
  let acceso_fecha: string | null = null;
  let textoLimpio = obs || '';

  if (obs) {
    const matchApt = obs.match(/\[Aptitud:\s*([^\]]+)\]/i);
    if (matchApt) {
      aptitud = matchApt[1].trim();
      textoLimpio = textoLimpio.replace(matchApt[0], '').trim();
    }

    const matchJer = obs.match(/\[Jerarquía:\s*([^|\]]+)(?:\|\s*Quien:\s*([^|\]]+))?(?:\|\s*P:\s*(\d+))?\]/i);
    if (matchJer) {
      instruccion_jerarquica = matchJer[1].trim().toLowerCase() === 'sí' || matchJer[1].trim().toLowerCase() === 'si';
      instruccion_quien = matchJer[2]?.trim() || null;
      prioridad_manual = matchJer[3] ? parseInt(matchJer[3], 10) : 0;
      textoLimpio = textoLimpio.replace(matchJer[0], '').trim();
    }

    const matchPers = obs.match(/\[PersonalEscuela:\s*([^\]]+)\]/i);
    if (matchPers) {
      es_personal_escuela = matchPers[1].trim().toLowerCase() === 'sí' || matchPers[1].trim().toLowerCase() === 'si';
      textoLimpio = textoLimpio.replace(matchPers[0], '').trim();
    }

    const matchWA = obs.match(/\[(?:WhatsApp Aceptación|WhatsApp):\s*([^|\]]+)(?:\|\s*Fecha:\s*([^|\]]+))?(?:\|\s*Estado:\s*([^|\]]+))?\]/i);
    if (matchWA) {
      whatsapp_notificado = matchWA[1].trim().toLowerCase() === 'enviado' || matchWA[1].trim().toLowerCase() === 'si' || matchWA[1].trim().toLowerCase() === 'sí';
      whatsapp_fecha = matchWA[2]?.trim() || null;
      whatsapp_estado = matchWA[3]?.trim() || null;
      textoLimpio = textoLimpio.replace(matchWA[0], '').trim();
    }

    const matchWAOrientaciones = obs.match(/\[(?:WhatsApp )?Orientaciones:\s*([^|\]]+)(?:\|\s*Fecha:\s*([^|\]]+))?(?:\|\s*Estado:\s*([^|\]]+))?\]/i);
    if (matchWAOrientaciones) {
      whatsapp_orientaciones_notificado = matchWAOrientaciones[1].trim().toLowerCase() === 'enviado' || matchWAOrientaciones[1].trim().toLowerCase() === 'si' || matchWAOrientaciones[1].trim().toLowerCase() === 'sí';
      whatsapp_orientaciones_fecha = matchWAOrientaciones[2]?.trim() || null;
      textoLimpio = textoLimpio.replace(matchWAOrientaciones[0], '').trim();
    }

    const matchAcceso = obs.match(/\[Acceso Habilitado en SIGAE(?: el ([^\]]+))?\]/i) ||
                        obs.match(/\[Acceso SIGAE Habilitado(?: el ([^\]]+))?\]/i) ||
                        obs.match(/\[Inscripción Física Formalizada(?: el ([^\]]+))?\]/i);
    if (matchAcceso) {
      acceso_habilitado = true;
      acceso_fecha = matchAcceso[1]?.trim() || null;
    }
  }

  return {
    aptitud,
    instruccion_jerarquica,
    instruccion_quien,
    prioridad_manual,
    es_personal_escuela,
    whatsapp_notificado,
    whatsapp_fecha,
    whatsapp_estado,
    whatsapp_aceptacion_notificado: whatsapp_notificado,
    whatsapp_aceptacion_fecha: whatsapp_fecha,
    whatsapp_orientaciones_notificado,
    whatsapp_orientaciones_fecha,
    acceso_habilitado,
    acceso_fecha,
    textoLimpio
  };
};

export const estructurarObservaciones = (
  textoBase: string,
  aptitud: string,
  esJerarquica: boolean,
  quienInstruye?: string | null,
  prioridad?: number | null,
  esPersonalEscuela?: boolean,
  whatsappNotificado?: boolean,
  whatsappFecha?: string | null,
  whatsappEstado?: string | null
): string => {
  let cleanText = (textoBase || '')
    .replace(/\[Aptitud:\s*[^\]]+\]/gi, '')
    .replace(/\[Jerarquía:\s*[^\]]+\]/gi, '')
    .replace(/\[PersonalEscuela:\s*[^\]]+\]/gi, '')
    .replace(/\[WhatsApp:\s*[^\]]+\]/gi, '')
    .trim();

  let tags = `[Aptitud: ${aptitud || 'En Evaluación'}]`;
  if (esJerarquica) {
    tags += ` [Jerarquía: Sí | Quien: ${quienInstruye || 'Nivel Superior'} | P: ${prioridad ?? 0}]`;
  }
  if (esPersonalEscuela) {
    tags += ` [PersonalEscuela: Sí]`;
  }
  if (whatsappNotificado) {
    tags += ` [WhatsApp: Enviado${whatsappFecha ? ` | Fecha: ${whatsappFecha}` : ''}${whatsappEstado ? ` | Estado: ${whatsappEstado}` : ''}]`;
  }

  return cleanText ? `${tags} ${cleanText}` : tags;
};

// ── DETERMINADOR DE ENTORNO LOCAL DE LA ESCUELA ──────────────────────────────────
export const esLocalidadEntorno = (
  escuela: string,
  municipio?: string,
  direccion?: string,
  localidadTrabajo?: string
): boolean => {
  const esc = (escuela || '').toLowerCase();
  const text = `${municipio || ''} ${direccion || ''} ${localidadTrabajo || ''}`.toLowerCase();

  if (esc.includes('sb') || esc.includes('bárbara') || esc.includes('barbara')) {
    return (
      text.includes('santa bárbara') ||
      text.includes('santa barbara') ||
      text.includes('punta de mata') ||
      text.includes('tejero') ||
      text.includes('tapir') ||
      text.includes('zamora')
    );
  } else if (esc.includes('lb') || esc.includes('libertador') || esc.includes('bolívar') || esc.includes('bolivar')) {
    return (
      text.includes('caripito') ||
      text.includes('bolívar') ||
      text.includes('bolivar') ||
      text.includes('san vicente')
    );
  }
  return (
    text.includes('santa bárbara') ||
    text.includes('santa barbara') ||
    text.includes('punta de mata') ||
    text.includes('tejero') ||
    text.includes('caripito')
  );
};

// ── ALGORITMO DEL BAREMO OFICIAL EN 8 NIVELES (+ P0 JERÁRQUICA) ──────────────────
export const calcularBaremoPrioridad = (
  s: SolicitudAdmision,
  personalMap?: Map<string, UsuarioPersonal>
): BaremoResult => {
  if (s.instruccion_jerarquica) {
    const n = s.prioridad_manual !== undefined && s.prioridad_manual !== null ? s.prioridad_manual : 0;
    return {
      nivel: n,
      codigo: `P${n}`,
      etiqueta: `Prioridad ${n} (Instrucción Jerárquica)`,
      badgeBg: '#EC4899',
      badgeText: '#ffffff',
      descripcion: s.instruccion_quien ? `Instruido por: ${s.instruccion_quien}` : 'Instrucción Jerárquica Superior'
    };
  }

  const parentesco = (s.parentesco || s.representante_parentesco || '').toLowerCase();
  const isHijo = parentesco.includes('hijo') || parentesco.includes('hija') || parentesco.includes('padre') || parentesco.includes('madre') || parentesco === '' || !parentesco;
  
  const nomina = (s.pdvsa_tipo_nomina || '').toLowerCase();
  const condicion = (s.pdvsa_condicion_laboral || '').toLowerCase();
  const trabajaPdvsa = s.representante_trabaja_pdvsa === true || s.representante_trabaja_pdvsa === 'true' || s.representante_trabaja_pdvsa === 'Sí' || (s.pdvsa_tipo_nomina && !nomina.includes('comunidad'));

  // ── 1. DETERMINACIÓN ESTRICTA DE P1: PERSONAL REGISTRADO EN GESTIÓN DOCENTE ────
  // Se cruzan las cédulas del representante, madre o padre con los expedientes de personal/docentes
  const escSol = (s.codigo_escuela || '').trim().toLowerCase();
  const cedRep = cleanCedula(s.representante_cedula);
  const cedMad = cleanCedula(s.madre_cedula);
  const cedPad = cleanCedula(s.padre_cedula);

  const staffRep = cedRep && personalMap ? personalMap.get(cedRep) : undefined;
  const staffMad = cedMad && personalMap ? personalMap.get(cedMad) : undefined;
  const staffPad = cedPad && personalMap ? personalMap.get(cedPad) : undefined;

  const matchMismaEscuela = (staff?: UsuarioPersonal): boolean => {
    if (!staff) return false;
    const escStaff = (staff.id_escuela || '').toLowerCase();
    if (!escStaff || escStaff === 'todas' || escStaff === 'ambas' || escStaff === 'global') return true;
    if (escSol.includes('sb') && escStaff.includes('sb')) return true;
    if (escSol.includes('lb') && escStaff.includes('lb')) return true;
    return escStaff === escSol;
  };

  const staffEncontrado = matchMismaEscuela(staffRep)
    ? staffRep
    : matchMismaEscuela(staffMad)
    ? staffMad
    : matchMismaEscuela(staffPad)
    ? staffPad
    : undefined;

  const esDocenteGestor = Boolean(staffEncontrado) || Boolean(s.es_personal_escuela);

  if (isHijo && esDocenteGestor) {
    const rolEtiqueta = staffEncontrado?.rol || 'Personal de la Escuela';
    return {
      nivel: 1,
      codigo: 'P1',
      etiqueta: '1. Hijos de Docentes y Trabajadores de la Escuela',
      badgeBg: '#8B5CF6',
      badgeText: '#ffffff',
      descripcion: `Hijos de personal registrado en Gestión Docente (${rolEtiqueta}${staffEncontrado?.nombre_completo ? `: ${staffEncontrado.nombre_completo}` : ''})`
    };
  }

  const isContractual = nomina.includes('contractual') && !nomina.includes('no contractual');
  const isNoContractual = nomina.includes('no contractual') || nomina.includes('mayor') || nomina.includes('directivo');
  const isActivoJubilado = condicion.includes('activo') || condicion.includes('jubilado') || condicion.includes('sobreviviente') || condicion === '';
  const isLocal = esLocalidadEntorno(s.codigo_escuela, s.municipio_habitacion, s.direccion_habitacion, s.pdvsa_localidad_trabajo);

  if (isHijo && isContractual && isActivoJubilado && isLocal) {
    return {
      nivel: 2,
      codigo: 'P2',
      etiqueta: '2. Hijos Contractual (Entorno/Local)',
      badgeBg: '#0284C7',
      badgeText: '#ffffff',
      descripcion: 'Hijos de trabajadores activos o jubilados nómina contractual que viven en la localidad/entorno'
    };
  }

  if (isHijo && isNoContractual && isActivoJubilado && isLocal) {
    return {
      nivel: 3,
      codigo: 'P3',
      etiqueta: '3. Hijos No Contractual (Entorno/Local)',
      badgeBg: '#0D9488',
      badgeText: '#ffffff',
      descripcion: 'Hijos de trabajadores activos o jubilados nómina no contractual que viven en la localidad/entorno'
    };
  }

  if (isHijo && isContractual && isActivoJubilado && !isLocal) {
    return {
      nivel: 4,
      codigo: 'P4',
      etiqueta: '4. Hijos Contractual (Foráneo)',
      badgeBg: '#F59E0B',
      badgeText: '#ffffff',
      descripcion: 'Hijos de trabajadores contractuales residentes en localidades foráneas'
    };
  }

  if (isHijo && isNoContractual && isActivoJubilado && !isLocal) {
    return {
      nivel: 5,
      codigo: 'P5',
      etiqueta: '5. Hijos No Contractual (Foráneo)',
      badgeBg: '#EA580C',
      badgeText: '#ffffff',
      descripcion: 'Hijos de trabajadores no contractuales residentes en localidades foráneas'
    };
  }

  if (trabajaPdvsa && isLocal) {
    return {
      nivel: 6,
      codigo: 'P6',
      etiqueta: '6. Otro Parentesco (Entorno/Local)',
      badgeBg: '#475569',
      badgeText: '#ffffff',
      descripcion: 'Cualquier otro parentesco de cualquier nómina que residan en el entorno escolar'
    };
  }

  if (trabajaPdvsa && !isLocal) {
    return {
      nivel: 7,
      codigo: 'P7',
      etiqueta: '7. Otro Parentesco (Foráneo)',
      badgeBg: '#64748B',
      badgeText: '#ffffff',
      descripcion: 'Cualquier otro parentesco de cualquier nómina residentes foráneos'
    };
  }

  return {
    nivel: 8,
    codigo: 'P8',
    etiqueta: '8. Comunidad General',
    badgeBg: '#94A3B8',
    badgeText: '#ffffff',
    descripcion: 'Aspirantes pertenecientes a la comunidad general sin filiación petrolera'
  };
};

export const GestionAdmisiones: React.FC = () => {
  const { tienePermiso, loading: permLoading, user } = usePermisos();
  const navigate = useNavigate();
  const hasAccess = tienePermiso('Gestión de Admisiones', 'ver');

  // Detección granular de permisos y aislamiento de Taquilla de Formalización
  const isSuperAdmin = (user?.rol || '').trim() === 'SuperAdmin';
  const esRolFormalizador = (user?.rol || '').trim().toLowerCase() === 'formalizador';
  const puedeVerBaremo = isSuperAdmin || (!esRolFormalizador && tienePermiso('Tarjeta: Baremo y Clasificación', 'ver'));
  const puedeVerUnoAUno = isSuperAdmin || (!esRolFormalizador && tienePermiso('Tarjeta: Auditoría Uno por Uno', 'ver'));
  const puedeVerFormalizacion = isSuperAdmin || esRolFormalizador || tienePermiso('Tarjeta: Formalización de Matrícula', 'ver');
  const esSoloFormalizador = esRolFormalizador || (puedeVerFormalizacion && !puedeVerBaremo && !puedeVerUnoAUno);

  const [solicitudes, setSolicitudes] = useState<SolicitudAdmision[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudAdmision | null>(null);
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [guardandoEstado, setGuardandoEstado] = useState<boolean>(false);

  // ── ESTADOS DEL REPORTE Y MODAL ESTADÍSTICO (ESTILO CHAMILO LMS) ───────────────
  const [modalEstadisticas, setModalEstadisticas] = useState<boolean>(false);
  const [escuelaReporte, setEscuelaReporte] = useState<'todas' | 'sb' | 'lb'>('todas');
  const [tipoGrafico, setTipoGrafico] = useState<'dossier' | 'resumen_niveles' | 'torta' | 'anillos' | 'picos' | 'barras' | 'radar' | 'tacometro' | 'tabla'>('dossier');
  const [criterioAgrupacion, setCriterioAgrupacion] = useState<'grados' | 'niveles' | 'estados' | 'nomina'>('grados');
  const [generandoPDF, setGenerandoPDF] = useState<boolean>(false);

  // ── PERSONAL / DOCENTES DE LAS ESCUELAS (CARGADOS DE GESTIÓN DOCENTE) ───────────
  const [personalEscuelaMap, setPersonalEscuelaMap] = useState<Map<string, UsuarioPersonal>>(new Map());

  // ── MODO DE VISTAS ─────────────────────────────────────────────────────────────
  const [vistaActiva, setVistaActiva] = useState<'tabla' | 'uno_a_uno' | 'formalizacion'>(() => {
    try {
      const usrStr = localStorage.getItem('usuario_sigae');
      if (usrStr) {
        const u = JSON.parse(usrStr);
        if ((u.rol || '').trim().toLowerCase() === 'formalizador') return 'formalizacion';
      }
    } catch (e) {}
    return 'tabla';
  });

  useEffect(() => {
    if (esSoloFormalizador && vistaActiva !== 'formalizacion') {
      setVistaActiva('formalizacion');
    }
  }, [esSoloFormalizador, vistaActiva]);

  // Detección estricta de asignación institucional del usuario (sb, lb o ambas)
  const escuelaUsuarioAsignada = (user?.id_escuela || '').trim().toLowerCase();
  const esSedeFija = !isSuperAdmin && (escuelaUsuarioAsignada === 'sb' || escuelaUsuarioAsignada === 'lb');
  const escuelaInicialFiltro = esSedeFija 
    ? escuelaUsuarioAsignada 
    : ((localStorage.getItem('sigae_escuela_codigo') as string) || 'todas').toLowerCase();

  // Filtros interactivos para la Taquilla de Formalización Física
  const [busquedaFormalizacion, setBusquedaFormalizacion] = useState<string>('');
  const [filtroEstadoFormalizacion, setFiltroEstadoFormalizacion] = useState<'todos' | 'pendientes' | 'formalizados'>('todos');
  const [filtroEscuelaFormalizacion, setFiltroEscuelaFormalizacion] = useState<string>(() => {
    return esSedeFija ? escuelaUsuarioAsignada : (escuelaInicialFiltro === 'sb' || escuelaInicialFiltro === 'lb' ? escuelaInicialFiltro : 'todas');
  });
  const [filtroGradoFormalizacion, setFiltroGradoFormalizacion] = useState<string>('todos');
  const [filtroSeccionFormalizacion, setFiltroSeccionFormalizacion] = useState<string>('todas');
  const [filtroWhatsAppFormalizacion, setFiltroWhatsAppFormalizacion] = useState<string>('todos');
  const [indiceUnoAUno, setIndiceUnoAUno] = useState<number>(0);

  // ── MODO EDICIÓN EN UNO POR UNO ────────────────────────────────────────────────
  const [modoEdicionUnoAUno, setModoEdicionUnoAUno] = useState<boolean>(false);
  const [formEdicion, setFormEdicion] = useState<Partial<SolicitudAdmision>>({});
  const [guardandoEdicion, setGuardandoEdicion] = useState<boolean>(false);

  // ── FORMALIZACIÓN DE INSCRIPCIÓN FÍSICA ────────────────────────────────────────
  const [solicitudParaFormalizar, setSolicitudParaFormalizar] = useState<SolicitudAdmision | null>(null);
  const [modalFormalizarAbierto, setModalFormalizarAbierto] = useState<boolean>(false);
  const [seccionFormalizacion, setSeccionFormalizacion] = useState<string>('A');
  const [editandoDatosFormalizar, setEditandoDatosFormalizar] = useState<boolean>(false);
  const [formDatosFormalizar, setFormDatosFormalizar] = useState<{
    estudiante_nombres: string;
    estudiante_apellidos: string;
    estudiante_cedula: string;
    grado_solicitado: string;
    codigo_escuela: string;
    representante_nombres: string;
    representante_apellidos: string;
    representante_cedula: string;
    representante_telefono: string;
    representante_email: string;
  }>({
    estudiante_nombres: '',
    estudiante_apellidos: '',
    estudiante_cedula: '',
    grado_solicitado: '',
    codigo_escuela: 'sb',
    representante_nombres: '',
    representante_apellidos: '',
    representante_cedula: '',
    representante_telefono: '',
    representante_email: ''
  });
  const [recaudosVerificados, setRecaudosVerificados] = useState<{ [key: string]: boolean }>({
    partida_nacimiento: true,
    cedula_estudiante: true,
    cedula_representante: true,
    fotos_carnet: true,
    constancia_trabajo: true,
    boleta_promocion: true,
  });
  const [procesandoFormalizacion, setProcesandoFormalizacion] = useState<boolean>(false);

  // ── REGISTRO DE ADMISIÓN DIRECTA / EXTEMPORÁNEA ────────────────────────────────
  const [modalRegistroDirectoAbierto, setModalRegistroDirectoAbierto] = useState<boolean>(false);
  const [guardandoRegistroDirecto, setGuardandoRegistroDirecto] = useState<boolean>(false);
  const [buscandoRepDirecto, setBuscandoRepDirecto] = useState<boolean>(false);
  const [sinCedulaEstudianteDirecto, setSinCedulaEstudianteDirecto] = useState<boolean>(false);
  const [repDirectoExistente, setRepDirectoExistente] = useState<{
    existe: boolean;
    nombre_completo?: string;
    rol?: string;
  } | null>(null);

  const [formRegistroDirecto, setFormRegistroDirecto] = useState({
    representante_cedula: '',
    representante_nombres: '',
    representante_apellidos: '',
    representante_telefono: '',
    representante_email: '',
    parentesco: 'Hijo(a)',
    trabaja_pdvsa: false,
    pdvsa_condicion_laboral: '',
    pdvsa_tipo_nomina: '',
    estudiante_cedula: '',
    estudiante_nombres: '',
    estudiante_apellidos: '',
    estudiante_sexo: 'M',
    estudiante_fecha_nacimiento: '',
    codigo_escuela: 'sb',
    grado_solicitado: '1er Grado',
    seccion: 'Sin Asignar',
    plantel_procedencia: '',
    estado_ingreso: 'Formalizado' as 'Formalizado' | 'Aprobado',
    observaciones: ''
  });

  // ── MODAL CONSTANCIA / RESUMEN IMPRIMIBLE ──────────────────────────────────────
  const [solicitudConstancia, setSolicitudConstancia] = useState<SolicitudAdmision | null>(null);
  const [modalConstanciaAbierto, setModalConstanciaAbierto] = useState<boolean>(false);

  // ── HABILITACIÓN DE ACCESO DE REPRESENTANTE Y ESTUDIANTE (UNO A UNO) ─────────
  const [modalHabilitarAccesoAbierto, setModalHabilitarAccesoAbierto] = useState<boolean>(false);
  const [solicitudHabilitar, setSolicitudHabilitar] = useState<SolicitudAdmision | null>(null);
  const [formHabilitar, setFormHabilitar] = useState({
    representante_cedula: '',
    representante_nombres: '',
    representante_apellidos: '',
    representante_telefono: '',
    representante_email: '',
    estudiante_cedula: '',
    estudiante_nombres: '',
    estudiante_apellidos: '',
    grado_solicitado: '',
    codigo_escuela: 'sb'
  });
  const [repExistenteInfo, setRepExistenteInfo] = useState<{
    existe: boolean;
    nombre_completo?: string;
    rol?: string;
    id_escuela?: string;
  } | null>(null);
  const [verificandoCedulaRep, setVerificandoCedulaRep] = useState<boolean>(false);
  const [procesandoHabilitacion, setProcesandoHabilitacion] = useState<boolean>(false);

  // ── HABILITACIÓN MASIVA DE ACCESO SIGAE (NUEVOS INGRESOS APROBADOS) ─────────
  const [modalHabilitarMasivoAbierto, setModalHabilitarMasivoAbierto] = useState<boolean>(false);
  const [seleccionadosHabilitarMasivo, setSeleccionadosHabilitarMasivo] = useState<Set<string | number>>(new Set());
  const [filtroEscuelaHabilitarMasivo, setFiltroEscuelaHabilitarMasivo] = useState<string>(() => {
    return esSedeFija ? escuelaUsuarioAsignada : 'todas';
  });
  const [filtroGradoHabilitarMasivo, setFiltroGradoHabilitarMasivo] = useState<string>('todos');
  const [filtroEstadoAccesoMasivo, setFiltroEstadoAccesoMasivo] = useState<'pendientes' | 'todos' | 'habilitados'>('pendientes');
  const [procesandoHabilitacionMasiva, setProcesandoHabilitacionMasiva] = useState<boolean>(false);
  const [progresoHabilitacionMasiva, setProgresoHabilitacionMasiva] = useState<{
    actual: number;
    total: number;
    nombreEstudiante: string;
    creadosNuevos: number;
    vinculadosExistentes: number;
    completado: boolean;
  } | null>(null);

  // ── DIFUSIÓN MASIVA WHATSAPP PARA NUEVOS INGRESOS APROBADOS ─────────────────
  const [modalDifusionAbierto, setModalDifusionAbierto] = useState<boolean>(false);
  const [filtroEscuelaDifusion, setFiltroEscuelaDifusion] = useState<string>(() => {
    return esSedeFija ? escuelaUsuarioAsignada : 'todas';
  });
  const [filtroGradoDifusion, setFiltroGradoDifusion] = useState<string>('todos');
  const [filtroEstadoEnvioDifusion, setFiltroEstadoEnvioDifusion] = useState<'todos' | 'pendientes' | 'enviados'>('todos');
  const [mensajePlantillaDifusion, setMensajePlantillaDifusion] = useState<string>('');
  const [aspiranteActivoDifusionIdx, setAspiranteActivoDifusionIdx] = useState<number>(0);

  // ── VISOR INTERACTIVO DE DOCUMENTOS Y RECAUDOS ─────────────────────────────────
  const [solicitudVisorDocs, setSolicitudVisorDocs] = useState<SolicitudAdmision | null>(null);
  const [docVisorActivoIndex, setDocVisorActivoIndex] = useState<number>(0);
  const [modalVisorDocsAbierto, setModalVisorDocsAbierto] = useState<boolean>(false);
  const [zoomNivel, setZoomNivel] = useState<number>(1);
  const [rotacionNivel, setRotacionNivel] = useState<number>(0);

  const abrirVisorDocumentos = (sol: SolicitudAdmision, indexInicial = 0) => {
    const docs = obtenerDocumentosSolicitud(sol);
    if (docs.length === 0) {
      if (Swal) {
        Swal.fire({
          icon: 'info',
          title: 'Sin Documentos Adjuntos',
          text: 'Esta solicitud no posee archivos o imágenes de recaudos adjuntas en el sistema.',
          confirmButtonText: 'Entendido'
        });
      }
      return;
    }
    setSolicitudVisorDocs(sol);
    setDocVisorActivoIndex(Math.max(0, Math.min(indexInicial, docs.length - 1)));
    setZoomNivel(1);
    setRotacionNivel(0);
    setModalVisorDocsAbierto(true);
  };

  const cerrarVisorDocumentos = () => {
    setModalVisorDocsAbierto(false);
    setSolicitudVisorDocs(null);
    setZoomNivel(1);
    setRotacionNivel(0);
  };

  // ── ESTADOS DE FILTROS ──────────────────────────────────────────────────────────
  const [filtroEscuela, setFiltroEscuela] = useState<string>(() => {
    return esSedeFija ? escuelaUsuarioAsignada : (escuelaInicialFiltro === 'sb' || escuelaInicialFiltro === 'lb' ? escuelaInicialFiltro : 'todas');
  });
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todas');
  const [filtroAptitud, setFiltroAptitud] = useState<string>('todas');
  const [filtroNomina, setFiltroNomina] = useState<string>('todas');
  const [filtroLocalidad, setFiltroLocalidad] = useState<string>('todas');
  const [filtroCondicionLaboral, setFiltroCondicionLaboral] = useState<string>('todas');
  const [filtroGrado, setFiltroGrado] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroWhatsApp, setFiltroWhatsApp] = useState<'todos' | 'notificado' | 'sin_notificar'>('todos');
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtrosPanelAbierto, setFiltrosPanelAbierto] = useState<boolean>(false);
  const [modalMatrizCapacidadAbierto, setModalMatrizCapacidadAbierto] = useState<boolean>(false);

  // ── CATÁLOGOS CARGADOS DESDE LA BD ─────────────────────────────────────────────
  const [opcionesNomina, setOpcionesNomina] = useState<string[]>([]);
  const [opcionesLocalidad, setOpcionesLocalidad] = useState<string[]>([]);
  const [opcionesCondicionLaboral, setOpcionesCondicionLaboral] = useState<string[]>([]);
  const [opcionesGrado, setOpcionesGrado] = useState<string[]>([]);
  const [opcionesParentesco, setOpcionesParentesco] = useState<string[]>([]);

  // Formulario para calificación
  const [nuevoEstado, setNuevoEstado] = useState<string>('Pendiente');
  const [nuevaAptitud, setNuevaAptitud] = useState<string>('En Evaluación');
  const [esJerarquica, setEsJerarquica] = useState<boolean>(false);
  const [quienInstruye, setQuienInstruye] = useState<string>('');
  const [prioridadAsignada, setPrioridadAsignada] = useState<number>(1);
  const [esPersonalEscuelaForm, setEsPersonalEscuelaForm] = useState<boolean>(false);
  const [nuevasObservaciones, setNuevasObservaciones] = useState<string>('');

  // ── MODALES DE DEPURACIÓN ──────────────────────────────────────────────────────
  const [modalDuplicadosAbierto, setModalDuplicadosAbierto] = useState<boolean>(false);
  const [gruposDuplicados, setGruposDuplicados] = useState<SolicitudAdmision[][]>([]);
  const [seleccionadosParaEliminar, setSeleccionadosParaEliminar] = useState<Set<string | number>>(new Set());
  const [eliminandoDuplicados, setEliminandoDuplicados] = useState<boolean>(false);

  const [modalVaciosAbierto, setModalVaciosAbierto] = useState<boolean>(false);
  const [tipoVacios, setTipoVacios] = useState<'representante' | 'estudiante'>('representante');
  const [registrosVacios, setRegistrosVacios] = useState<SolicitudAdmision[]>([]);
  const [seleccionadosVacios, setSeleccionadosVacios] = useState<Set<string | number>>(new Set());
  const [eliminandoVacios, setEliminandoVacios] = useState<boolean>(false);

  const [modalRegularesAbierto, setModalRegularesAbierto] = useState<boolean>(false);
  const [registrosRegulares, setRegistrosRegulares] = useState<SolicitudAdmision[]>([]);
  const [seleccionadosRegulares, setSeleccionadosRegulares] = useState<Set<string | number>>(new Set());
  const [eliminandoRegulares, setEliminandoRegulares] = useState<boolean>(false);
  const [detectandoRegulares, setDetectandoRegulares] = useState<boolean>(false);

  // ── SELECCIÓN Y ELIMINACIÓN EN LISTADO GENERAL ──────────────────────────────────
  const [seleccionadosListadoGeneral, setSeleccionadosListadoGeneral] = useState<Set<string>>(new Set());
  const [eliminandoSolicitudes, setEliminandoSolicitudes] = useState<boolean>(false);

  // ── BLOQUEO DE SCROLL EN FONDO CUANDO HAY UN MODAL ABIERTO ─────────────────────
  const algunModalAbierto = Boolean(
    modalMatrizCapacidadAbierto ||
    modalFormalizarAbierto ||
    modalRegistroDirectoAbierto ||
    modalHabilitarAccesoAbierto ||
    modalHabilitarMasivoAbierto ||
    modalDifusionAbierto ||
    modalConstanciaAbierto ||
    modalAbierto ||
    modalDuplicadosAbierto ||
    modalVaciosAbierto ||
    modalRegularesAbierto ||
    modalVisorDocsAbierto
  );

  useEffect(() => {
    if (algunModalAbierto) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [algunModalAbierto]);

  // ── CARGA DEL PERSONAL DESDE `usuarios` Y `expedientes_docentes` ────────────────
  const cargarPersonalEscuela = async () => {
    try {
      const map = new Map<string, UsuarioPersonal>();

      // 1. Cargar usuarios de gestión docente / personal
      const { data: userRes, error: userError } = await supabase
        .from('usuarios')
        .select('cedula, rol, id_escuela, nombre_completo, estado');

      if (!userError && userRes) {
        userRes.forEach((u: any) => {
          const rol = (u.rol || '').trim().toLowerCase();
          // Descontar únicamente 'representante' y 'visitante'
          if (rol && rol !== 'representante' && rol !== 'visitante') {
            const ced = cleanCedula(u.cedula);
            if (ced) {
              map.set(ced, {
                cedula: u.cedula,
                rol: u.rol || 'Personal Docente/Institucional',
                id_escuela: (u.id_escuela || '').trim().toLowerCase(),
                nombre_completo: u.nombre_completo || '',
              });
            }
          }
        });
      }

      // 2. Cargar expedientes de docentes
      try {
        const { data: expRes } = await supabase
          .from('expedientes_docentes')
          .select('usuario_cedula, cargo_actual');

        if (expRes) {
          expRes.forEach((e: any) => {
            const ced = cleanCedula(e.usuario_cedula);
            if (ced && !map.has(ced)) {
              map.set(ced, {
                cedula: e.usuario_cedula,
                rol: e.cargo_actual || 'Docente / Personal Institucional',
                id_escuela: 'todas',
                nombre_completo: '',
              });
            }
          });
        }
      } catch (errExp) {
        console.warn('Tabla expedientes_docentes no disponible:', errExp);
      }

      // 3. Cargar desde demo local si estuviese en simulación
      try {
        const localData = localStorage.getItem('sigae_gestor_expedientes_demo');
        if (localData) {
          const parsed = JSON.parse(localData);
          if (Array.isArray(parsed)) {
            parsed.forEach((d: any) => {
              const ced = cleanCedula(d.cedula);
              if (ced && !map.has(ced)) {
                map.set(ced, {
                  cedula: d.cedula,
                  rol: d.rol || d.cargo_actual || 'Docente',
                  id_escuela: (d.escuela || 'sb').trim().toLowerCase(),
                  nombre_completo: d.nombre || '',
                });
              }
            });
          }
        }
      } catch (e) {
        // Ignorar
      }

      setPersonalEscuelaMap(map);
    } catch (err) {
      console.error('Excepción al cargar personal docente:', err);
    }
  };

  // ── CARGA DE CATÁLOGOS DESDE SUPABASE ──────────────────────────────────────────
  const cargarCatalogos = async () => {
    try {
      const [gradosRes, nominasRes, condRes, localidadesRes, parentescosRes] = await Promise.all([
        supabase.from('conf_grados').select('valor').order('orden', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Nómina').order('valor', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Condición').order('valor', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Localidad').order('valor', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Parentesco').order('valor', { ascending: true }),
      ]);

      setOpcionesGrado(
        gradosRes.data && gradosRes.data.length > 0
          ? gradosRes.data.map((g: any) => g.valor)
          : ['II Grupo (Inicial)', 'III Grupo (Inicial)', '1° Grado', '2° Grado', '3° Grado', '4° Grado', '5° Grado', '6° Grado', '1° Año', '2° Año', '3° Año', '4° Año', '5° Año']
      );

      setOpcionesNomina(
        nominasRes.data && nominasRes.data.length > 0
          ? nominasRes.data.map((p: any) => p.valor)
          : ['Comunidad', 'Jubilado', 'Nómina Contractual (Menor)', 'Nómina No Contractual (Mayor)']
      );

      setOpcionesCondicionLaboral(
        condRes.data && condRes.data.length > 0
          ? condRes.data.map((p: any) => p.valor)
          : ['Activo', 'Comunidad', 'Jubilado', 'Sobreviviente']
      );

      setOpcionesLocalidad(
        localidadesRes.data && localidadesRes.data.length > 0
          ? localidadesRes.data.map((p: any) => p.valor)
          : []
      );

      setOpcionesParentesco(
        parentescosRes.data && parentescosRes.data.length > 0
          ? parentescosRes.data.map((p: any) => p.valor)
          : ['Hijo(a)', 'Hermano(a)', 'Nieto(a)', 'Sobrino(a)']
      );
    } catch (e) {
      console.error('Error cargando catálogos de admisiones:', e);
    }
  };

  // ── CARGA DE DATOS DESDE SUPABASE ──────────────────────────────────────────────
  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('solicitud_cupos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al consultar solicitudes de cupo:', error);
        if (Swal) {
          Swal.fire({
            icon: 'error',
            title: 'Error de Carga',
            text: 'No se pudieron cargar las solicitudes de admisión desde la base de datos: ' + error.message,
          });
        }
      } else {
        const mapeadas = (data || []).map((s: any) => {
          const parsed = parsearObservaciones(s.observaciones);
          return {
            ...s,
            aptitud: s.aptitud || parsed.aptitud,
            instruccion_jerarquica: s.instruccion_jerarquica !== undefined ? s.instruccion_jerarquica : parsed.instruccion_jerarquica,
            instruccion_quien: s.instruccion_quien || parsed.instruccion_quien,
            prioridad_manual: s.prioridad_manual !== undefined ? s.prioridad_manual : parsed.prioridad_manual,
            es_personal_escuela: s.es_personal_escuela !== undefined ? s.es_personal_escuela : parsed.es_personal_escuela,
            whatsapp_notificado: parsed.whatsapp_notificado,
            whatsapp_fecha: parsed.whatsapp_fecha,
            whatsapp_estado: parsed.whatsapp_estado,
            acceso_habilitado: parsed.acceso_habilitado,
            acceso_fecha: parsed.acceso_fecha,
          };
        });
        setSolicitudes(mapeadas);
      }
    } catch (err: any) {
      console.error('Excepción al cargar solicitudes:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── CAPACIDAD, SALONES Y MATRÍCULA ESCOLAR REAL ────────────────────────────────
  const [salonesBD, setSalonesBD] = useState<any[]>([]);
  const [espaciosBD, setEspaciosBD] = useState<any[]>([]);
  const [estudiantesMatriculaBD, setEstudiantesMatriculaBD] = useState<any[]>([]);

  // ── CARGA DE CAPACIDAD DE AMBIENTES Y MATRÍCULA REAL ───────────────────────────
  const cargarCapacidadEscolar = async () => {
    try {
      const [salRes, espRes] = await Promise.all([
        supabase.from('salones').select('*'),
        supabase.from('espacios').select('*')
      ]);

      if (salRes.data) setSalonesBD(salRes.data);
      if (espRes.data) setEspaciosBD(espRes.data);

      // Cargar estudiantes vinculados con paginación paralela completa
      const chunks = await Promise.all([
        supabase.from('estudiantes_vinculaciones').select('id, cedula_estudiante, grado_actual, seccion_actual, codigo_escuela, estado').eq('estado', 'Activo').range(0, 999),
        supabase.from('estudiantes_vinculaciones').select('id, cedula_estudiante, grado_actual, seccion_actual, codigo_escuela, estado').eq('estado', 'Activo').range(1000, 1999),
        supabase.from('estudiantes_vinculaciones').select('id, cedula_estudiante, grado_actual, seccion_actual, codigo_escuela, estado').eq('estado', 'Activo').range(2000, 2999),
      ]);

      const todosEst = chunks.flatMap(c => c.data || []);
      setEstudiantesMatriculaBD(todosEst);
    } catch (e) {
      console.error('Error cargando datos de capacidad y matrícula:', e);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
    cargarCatalogos();
    cargarPersonalEscuela();
    cargarCapacidadEscolar();
    sincronizarPlantillasAdmisionDesdeBD();
  }, []);

  // ── CÁLCULO DINÁMICO DE CUPOS, SALONES Y VACANTES POR GRADO ───────────────────
  const metricasCapacidadGrado = useMemo(() => {
    const escuelaActual = filtroEscuela; // 'sb', 'lb', 'todas'
    const espaciosMap = new Map(espaciosBD.map(esp => [esp.id, Number(esp.capacidad) || 38]));

    // Helper para identificar si un estudiante vinculado es un nuevo ingreso aprobado/formalizado
    // para evitar que se sume dos veces (como regular y como nuevo ingreso)
    const clavesNuevosIngresosAprobados = new Set<string>();
    solicitudes.forEach(s => {
      if (s.estado === 'Aprobado' || s.estado === 'Formalizado') {
        if (s.estudiante_cedula) {
          const c = s.estudiante_cedula.trim().toUpperCase();
          clavesNuevosIngresosAprobados.add(c);
          clavesNuevosIngresosAprobados.add(c.replace(/^T-/, ''));
          const dig = c.replace(/[^0-9]/g, '');
          if (dig.length >= 6) clavesNuevosIngresosAprobados.add(dig);
        }
        if (s.codigo_unico) {
          const cu = s.codigo_unico.trim().toUpperCase();
          clavesNuevosIngresosAprobados.add(cu);
          clavesNuevosIngresosAprobados.add(cu.replace(/^T-/, ''));
          const dig = cu.replace(/[^0-9]/g, '');
          if (dig.length >= 6) clavesNuevosIngresosAprobados.add(dig);
        }
      }
    });

    const esEstudianteNuevoIngreso = (e: any) => {
      const c = (e.cedula_estudiante || '').trim().toUpperCase();
      const cSinT = c.replace(/^T-/, '');
      const cDig = c.replace(/[^0-9]/g, '');
      return (c && clavesNuevosIngresosAprobados.has(c)) ||
             (cSinT && clavesNuevosIngresosAprobados.has(cSinT)) ||
             (cDig.length >= 6 && clavesNuevosIngresosAprobados.has(cDig));
    };

    if (filtroGrado === 'todos') {
      // Cálculo consolidado de la escuela seleccionada o ambas escuelas
      const solEscuela = solicitudes.filter(s => {
        if (escuelaActual === 'todas') return true;
        return (s.codigo_escuela || '').toLowerCase() === escuelaActual.toLowerCase();
      });

      const soloAprobados = solEscuela.filter(s => s.estado === 'Aprobado').length;
      const soloFormalizados = solEscuela.filter(s => s.estado === 'Formalizado').length;
      const solAprobadasYFormalizadas = soloAprobados + soloFormalizados;
      const solPendientes = solEscuela.filter(s => s.estado === 'Pendiente' || s.estado === 'En Evaluación').length;
      const solRechazadas = solEscuela.filter(s => s.estado === 'Rechazado').length;

      const estEscuela = estudiantesMatriculaBD.filter(e => {
        if (escuelaActual === 'todas') return true;
        return (e.codigo_escuela || '').toLowerCase() === escuelaActual.toLowerCase();
      });

      const salonesEscuela = salonesBD.filter(s => {
        if (escuelaActual === 'todas') return true;
        return (s.id_escuela || '').toLowerCase() === escuelaActual.toLowerCase();
      });

      let capacidadTotal = 0;
      if (salonesEscuela.length > 0) {
        salonesEscuela.forEach(s => {
          const cap = espaciosMap.get(s.id_espacio) || 38;
          capacidadTotal += cap;
        });
      } else {
        capacidadTotal = estEscuela.length > 0 ? Math.ceil(estEscuela.length / 38) * 38 : 0;
      }

      // Estudiantes regulares = estudiantes vinculados que NO son nuevos ingresos de admisión
      const estudiantesRegulares = estEscuela.filter(e => !esEstudianteNuevoIngreso(e)).length;
      const totalMatriculados = estEscuela.length;
      // Los cupos ocupados reales son los regulares más los nuevos ingresos otorgados (sin duplicar)
      const totalOcupados = estudiantesRegulares + solAprobadasYFormalizadas;
      const cuposDisponibles = Math.max(0, capacidadTotal - totalOcupados);

      return {
        esGradoEspecifico: false,
        gradoNombre: 'Todos los Grados',
        escuelaNombre: escuelaActual === 'sb' ? 'U.E. Santa Bárbara' : escuelaActual === 'lb' ? 'U.E. Libertador Bolívar' : 'Todas las Escuelas',
        totalSalones: salonesEscuela.length,
        salonesDetalle: salonesEscuela.map(s => ({
          ...s,
          capacidad: espaciosMap.get(s.id_espacio) || 38
        })),
        capacidadTotal,
        estudiantesRegulares,
        estudiantesMatriculados: estudiantesRegulares,
        totalMatriculadosEnBD: totalMatriculados,
        aprobados: soloAprobados,
        formalizados: soloFormalizados,
        totalAprobadosYFormalizados: solAprobadasYFormalizadas,
        cuposAprobados: solAprobadasYFormalizadas,
        totalOcupados,
        cuposDisponibles,
        solicitudesPendientes: solPendientes,
        solicitudesRechazadas: solRechazadas,
        totalSolicitudes: solEscuela.length,
        porcentajeOcupacion: capacidadTotal > 0 ? Math.min(100, Math.round((totalOcupados / capacidadTotal) * 100)) : 0,
        desgloseSB: undefined as any,
        desgloseLB: undefined as any
      };
    }

    // CUANDO SE FILTRA POR UN GRADO ESPECÍFICO
    const gradoNormalizado = normalizarGrado(filtroGrado);

    // Helper para calcular métricas de una escuela específica ('sb' o 'lb')
    const calcularMetricasEscuelaIndividual = (codEsc: 'sb' | 'lb') => {
      const salonesEsc = salonesBD.filter(s => {
        const estatus = (s.estatus || 'Activo').toLowerCase().trim();
        if (estatus !== 'activo') return false;
        const matchEsc = (s.id_escuela || '').toLowerCase().trim() === codEsc;
        const matchGrd = normalizarGrado(s.grado_anio) === gradoNormalizado;
        return matchEsc && matchGrd;
      });

      const estudiantesEsc = estudiantesMatriculaBD.filter(e => {
        const matchEsc = (e.codigo_escuela || '').toLowerCase().trim() === codEsc;
        const matchGrd = normalizarGrado(e.grado_actual) === gradoNormalizado;
        return matchEsc && matchGrd;
      });

      let capTotalEsc = 0;
      if (salonesEsc.length > 0) {
        salonesEsc.forEach(s => {
          capTotalEsc += espaciosMap.get(s.id_espacio) || 38;
        });
      } else {
        const seccionesDetectadas = new Set(
          estudiantesEsc.map(e => (e.seccion_actual || 'A').toUpperCase().trim()).filter(Boolean)
        );
        const totSal = Math.max(1, seccionesDetectadas.size || 1);
        capTotalEsc = totSal * 38;
      }

      const solicitudesEsc = solicitudes.filter(s => {
        const matchEsc = (s.codigo_escuela || '').toLowerCase().trim() === codEsc;
        const matchGrd = normalizarGrado(s.grado_solicitado) === gradoNormalizado;
        return matchEsc && matchGrd;
      });

      const soloAprobados = solicitudesEsc.filter(s => s.estado === 'Aprobado').length;
      const soloFormalizados = solicitudesEsc.filter(s => s.estado === 'Formalizado').length;
      const pendientes = solicitudesEsc.filter(s => s.estado === 'Pendiente' || s.estado === 'En Evaluación').length;
      const rechazados = solicitudesEsc.filter(s => s.estado === 'Rechazado').length;
      const regulares = estudiantesEsc.filter(e => !esEstudianteNuevoIngreso(e)).length;
      const ocupadosEsc = regulares + soloAprobados + soloFormalizados;
      const disponibles = Math.max(0, capTotalEsc - ocupadosEsc);

      return {
        codigo: codEsc,
        nombre: codEsc === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar',
        totalSalones: salonesEsc.length || 1,
        salonesDetalle: salonesEsc,
        capacidadTotal: capTotalEsc,
        estudiantesRegulares: regulares,
        estudiantesMatriculados: regulares,
        totalMatriculadosEnBD: estudiantesEsc.length,
        aprobados: soloAprobados,
        formalizados: soloFormalizados,
        totalAprobadosYFormalizados: soloAprobados + soloFormalizados,
        cuposAprobados: soloAprobados + soloFormalizados,
        totalOcupados: ocupadosEsc,
        cuposDisponibles: disponibles,
        solicitudesPendientes: pendientes,
        solicitudesRechazadas: rechazados,
        totalSolicitudes: solicitudesEsc.length
      };
    };

    const desgloseSB = calcularMetricasEscuelaIndividual('sb');
    const desgloseLB = calcularMetricasEscuelaIndividual('lb');

    // 1. Salones configurados para este grado y escuela seleccionada
    const salonesCoincidentes = salonesBD.filter(s => {
      const estatus = (s.estatus || 'Activo').toLowerCase().trim();
      if (estatus !== 'activo') return false;
      const matchEsc = escuelaActual === 'todas' || (s.id_escuela || '').toLowerCase().trim() === escuelaActual.toLowerCase().trim();
      const matchGrd = normalizarGrado(s.grado_anio) === gradoNormalizado;
      return matchEsc && matchGrd;
    });

    let capacidadTotal = 0;
    const salonesConCapacidad = salonesCoincidentes.map(s => {
      const cap = espaciosMap.get(s.id_espacio) || 38;
      capacidadTotal += cap;
      return {
        ...s,
        capacidad: cap
      };
    });

    // 2. Estudiantes ya vinculados en este grado
    const estudiantesEnGrado = estudiantesMatriculaBD.filter(e => {
      const matchEsc = escuelaActual === 'todas' || (e.codigo_escuela || '').toLowerCase().trim() === escuelaActual.toLowerCase().trim();
      const matchGrd = normalizarGrado(e.grado_actual) === gradoNormalizado;
      return matchEsc && matchGrd;
    });

    // Si es consolidado (todas las escuelas), sumar las métricas de ambas escuelas
    let totalSalones = salonesCoincidentes.length;
    if (escuelaActual === 'todas') {
      totalSalones = desgloseSB.totalSalones + desgloseLB.totalSalones;
      capacidadTotal = desgloseSB.capacidadTotal + desgloseLB.capacidadTotal;
    } else if (totalSalones === 0) {
      const seccionesDetectadas = new Set(
        estudiantesEnGrado.map(e => (e.seccion_actual || 'A').toUpperCase().trim()).filter(Boolean)
      );
      totalSalones = Math.max(1, seccionesDetectadas.size || 1);
      capacidadTotal = totalSalones * 38; // 38 por defecto
    }

    // 3. Solicitudes de Admisión para este grado
    const solicitudesEnGrado = solicitudes.filter(s => {
      const matchEsc = escuelaActual === 'todas' || (s.codigo_escuela || '').toLowerCase().trim() === escuelaActual.toLowerCase().trim();
      const matchGrd = normalizarGrado(s.grado_solicitado) === gradoNormalizado;
      return matchEsc && matchGrd;
    });

    const soloAprobados = solicitudesEnGrado.filter(s => s.estado === 'Aprobado').length;
    const soloFormalizados = solicitudesEnGrado.filter(s => s.estado === 'Formalizado').length;
    const solicitudesPendientes = solicitudesEnGrado.filter(s => s.estado === 'Pendiente' || s.estado === 'En Evaluación').length;
    const solicitudesRechazadas = solicitudesEnGrado.filter(s => s.estado === 'Rechazado').length;
    const regularesEnGrado = estudiantesEnGrado.filter(e => !esEstudianteNuevoIngreso(e)).length;

    // Cupos disponibles descontando los regulares y los nuevos ingresos aprobados y formalizados
    const totalOcupados = regularesEnGrado + soloAprobados + soloFormalizados;
    const cuposDisponibles = Math.max(0, capacidadTotal - totalOcupados);
    const porcentajeOcupacion = capacidadTotal > 0 ? Math.min(100, Math.round((totalOcupados / capacidadTotal) * 100)) : 0;

    return {
      esGradoEspecifico: true,
      gradoNombre: filtroGrado,
      escuelaNombre: escuelaActual === 'sb' ? 'U.E. Santa Bárbara' : escuelaActual === 'lb' ? 'U.E. Libertador Bolívar' : 'Ambas Escuelas (Consolidado)',
      totalSalones,
      salonesDetalle: salonesConCapacidad,
      capacidadTotal,
      estudiantesRegulares: regularesEnGrado,
      estudiantesMatriculados: regularesEnGrado,
      totalMatriculadosEnBD: estudiantesEnGrado.length,
      aprobados: soloAprobados,
      formalizados: soloFormalizados,
      totalAprobadosYFormalizados: soloAprobados + soloFormalizados,
      cuposAprobados: soloAprobados + soloFormalizados,
      totalOcupados,
      cuposDisponibles,
      solicitudesPendientes,
      solicitudesRechazadas,
      totalSolicitudes: solicitudesEnGrado.length,
      porcentajeOcupacion,
      desgloseSB,
      desgloseLB
    };
  }, [filtroGrado, filtroEscuela, salonesBD, espaciosBD, estudiantesMatriculaBD, solicitudes]);

  // ── OPCIONES DE FILTROS ENRIQUECIDAS ───────────────────────────────────────────
  const opcionesNominaEnriquecidas = useMemo(() => {
    const set = new Set<string>(opcionesNomina);
    solicitudes.forEach(s => {
      if (s.pdvsa_tipo_nomina?.trim()) set.add(s.pdvsa_tipo_nomina.trim());
    });
    return Array.from(set).sort();
  }, [opcionesNomina, solicitudes]);

  const opcionesLocalidadEnriquecidas = useMemo(() => {
    const set = new Set<string>(opcionesLocalidad);
    solicitudes.forEach(s => {
      if (s.pdvsa_localidad_trabajo?.trim()) set.add(s.pdvsa_localidad_trabajo.trim());
    });
    return Array.from(set).sort();
  }, [opcionesLocalidad, solicitudes]);

  const opcionesCondicionEnriquecidas = useMemo(() => {
    const set = new Set<string>(opcionesCondicionLaboral);
    solicitudes.forEach(s => {
      if (s.pdvsa_condicion_laboral?.trim()) set.add(s.pdvsa_condicion_laboral.trim());
    });
    return Array.from(set).sort();
  }, [opcionesCondicionLaboral, solicitudes]);

  const opcionesGradoEnriquecidos = useMemo(() => {
    const set = new Set<string>(opcionesGrado);
    solicitudes.forEach(s => {
      if (s.grado_solicitado?.trim()) set.add(s.grado_solicitado.trim());
    });
    return Array.from(set);
  }, [opcionesGrado, solicitudes]);

  const opcionesParentescoEnriquecidas = useMemo(() => {
    const base = ['Hijo(a)', 'Hermano(a)', 'Nieto(a)', 'Sobrino(a)'];
    const set = new Set<string>([...base, ...opcionesParentesco]);
    solicitudes.forEach(s => {
      const p = s.parentesco?.trim();
      const rp = s.representante_parentesco?.trim();
      if (p) set.add(p);
      if (rp && rp !== 'Padre' && rp !== 'Madre' && rp !== 'Representante Legal') set.add(rp);
    });
    return Array.from(set).filter(Boolean).sort();
  }, [opcionesParentesco, solicitudes]);

  // ── CONTEO DE FILTROS ACTIVOS ──────────────────────────────────────────────────
  const filtrosActivosCount = useMemo(() => {
    let count = 0;
    if (filtroEscuela !== 'todas') count++;
    if (filtroPrioridad !== 'todas') count++;
    if (filtroAptitud !== 'todas') count++;
    if (filtroNomina !== 'todas') count++;
    if (filtroLocalidad !== 'todas') count++;
    if (filtroCondicionLaboral !== 'todas') count++;
    if (filtroGrado !== 'todos') count++;
    if (filtroEstado !== 'todos') count++;
    if (filtroWhatsApp !== 'todos') count++;
    if (busqueda.trim() !== '') count++;
    return count;
  }, [
    filtroEscuela,
    filtroPrioridad,
    filtroAptitud,
    filtroNomina,
    filtroLocalidad,
    filtroCondicionLaboral,
    filtroGrado,
    filtroEstado,
    filtroWhatsApp,
    busqueda
  ]);

  // ── RESUMEN DE CAPACIDAD Y VACANTES DE TODOS LOS GRADOS ───────────────────────
  const resumenCapacidadTodosGrados = useMemo(() => {
    const escuelaActual = filtroEscuela; // 'sb', 'lb', 'todas'
    const espaciosMap = new Map(espaciosBD.map(esp => [esp.id, Number(esp.capacidad) || 38]));

    // Helper para identificar si un estudiante vinculado es un nuevo ingreso aprobado/formalizado
    const clavesNuevosIngresosAprobados = new Set<string>();
    solicitudes.forEach(s => {
      if (s.estado === 'Aprobado' || s.estado === 'Formalizado') {
        if (s.estudiante_cedula) {
          const c = s.estudiante_cedula.trim().toUpperCase();
          clavesNuevosIngresosAprobados.add(c);
          clavesNuevosIngresosAprobados.add(c.replace(/^T-/, ''));
          const dig = c.replace(/[^0-9]/g, '');
          if (dig.length >= 6) clavesNuevosIngresosAprobados.add(dig);
        }
        if (s.codigo_unico) {
          const cu = s.codigo_unico.trim().toUpperCase();
          clavesNuevosIngresosAprobados.add(cu);
          clavesNuevosIngresosAprobados.add(cu.replace(/^T-/, ''));
          const dig = cu.replace(/[^0-9]/g, '');
          if (dig.length >= 6) clavesNuevosIngresosAprobados.add(dig);
        }
      }
    });

    const esEstudianteNuevoIngreso = (e: any) => {
      const c = (e.cedula_estudiante || '').trim().toUpperCase();
      const cSinT = c.replace(/^T-/, '');
      const cDig = c.replace(/[^0-9]/g, '');
      return (c && clavesNuevosIngresosAprobados.has(c)) ||
             (cSinT && clavesNuevosIngresosAprobados.has(cSinT)) ||
             (cDig.length >= 6 && clavesNuevosIngresosAprobados.has(cDig));
    };

    const gradosBase = [
      'Maternal',
      '1er Grupo',
      '2do Grupo',
      '3er Grupo',
      '1er Grado',
      '2do Grado',
      '3er Grado',
      '4to Grado',
      '5to Grado',
      '6to Grado',
      '1er Año',
      '2do Año',
      '3er Año',
      '4to Año',
      '5to Año'
    ];

    const todosGrados = Array.from(new Set([...gradosBase, ...opcionesGradoEnriquecidos]));

    return todosGrados.map(grd => {
      const gNorm = normalizarGrado(grd);

      const calcularPorEscuela = (codEsc: 'sb' | 'lb') => {
        const salones = salonesBD.filter(s => {
          const estatus = (s.estatus || 'Activo').toLowerCase().trim();
          if (estatus !== 'activo') return false;
          return (s.id_escuela || '').toLowerCase().trim() === codEsc && normalizarGrado(s.grado_anio) === gNorm;
        });

        const estudiantes = estudiantesMatriculaBD.filter(e => {
          return (e.codigo_escuela || '').toLowerCase().trim() === codEsc && normalizarGrado(e.grado_actual) === gNorm;
        });

        let capTotal = 0;
        if (salones.length > 0) {
          salones.forEach(s => { capTotal += espaciosMap.get(s.id_espacio) || 38; });
        } else {
          const secciones = new Set(estudiantes.map(e => (e.seccion_actual || 'A').toUpperCase().trim()).filter(Boolean));
          capTotal = Math.max(1, secciones.size || 1) * 38;
        }

        const solicitudesGrd = solicitudes.filter(s => {
          return (s.codigo_escuela || '').toLowerCase().trim() === codEsc && normalizarGrado(s.grado_solicitado) === gNorm;
        });

        const soloAprob = solicitudesGrd.filter(s => s.estado === 'Aprobado').length;
        const soloForm = solicitudesGrd.filter(s => s.estado === 'Formalizado').length;
        const aprob = soloAprob + soloForm;
        const pend = solicitudesGrd.filter(s => s.estado === 'Pendiente' || s.estado === 'En Evaluación').length;
        const regulares = estudiantes.filter(e => !esEstudianteNuevoIngreso(e)).length;
        const ocupados = regulares + aprob;
        const disp = Math.max(0, capTotal - ocupados);

        return {
          salones: salones.length || 1,
          capacidad: capTotal,
          matriculados: regulares,
          estudiantesRegulares: regulares,
          totalMatriculadosEnBD: estudiantes.length,
          aprobados: soloAprob,
          formalizados: soloForm,
          totalAprobados: aprob,
          ocupados,
          pendientes: pend,
          disponibles: disp,
          totalSol: solicitudesGrd.length
        };
      };

      const sb = calcularPorEscuela('sb');
      const lb = calcularPorEscuela('lb');

      const totalSal = escuelaActual === 'sb' ? sb.salones : escuelaActual === 'lb' ? lb.salones : sb.salones + lb.salones;
      const capTot = escuelaActual === 'sb' ? sb.capacidad : escuelaActual === 'lb' ? lb.capacidad : sb.capacidad + lb.capacidad;
      const matTot = escuelaActual === 'sb' ? sb.matriculados : escuelaActual === 'lb' ? lb.matriculados : sb.matriculados + lb.matriculados;
      const soloAprTot = escuelaActual === 'sb' ? sb.aprobados : escuelaActual === 'lb' ? lb.aprobados : sb.aprobados + lb.aprobados;
      const soloFormTot = escuelaActual === 'sb' ? sb.formalizados : escuelaActual === 'lb' ? lb.formalizados : sb.formalizados + lb.formalizados;
      const aprTot = soloAprTot + soloFormTot;
      const pendTot = escuelaActual === 'sb' ? sb.pendientes : escuelaActual === 'lb' ? lb.pendientes : sb.pendientes + lb.pendientes;
      const ocupTot = matTot + aprTot;
      const dispTot = Math.max(0, capTot - ocupTot);
      const totSol = escuelaActual === 'sb' ? sb.totalSol : escuelaActual === 'lb' ? lb.totalSol : sb.totalSol + lb.totalSol;

      return {
        grado: grd,
        gradoNorm: gNorm,
        totalSalones: totalSal,
        capacidadTotal: capTot,
        estudiantesMatriculados: matTot,
        estudiantesRegulares: matTot,
        aprobados: soloAprTot,
        formalizados: soloFormTot,
        cuposAprobados: aprTot,
        totalOcupados: ocupTot,
        solicitudesPendientes: pendTot,
        cuposDisponibles: dispTot,
        totalSolicitudes: totSol,
        sb,
        lb
      };
    });
  }, [filtroEscuela, espaciosBD, salonesBD, estudiantesMatriculaBD, solicitudes, opcionesGradoEnriquecidos]);

  // ── FILTRADO Y ORDENAMIENTO POR BAREMO ─────────────────────────────────────────
  const solicitudesFiltradas = useMemo(() => {
    const filtradas = solicitudes.filter(s => {
      // Si el usuario pertenece a una sede fija (sb o lb), aislamiento total de solicitudes
      if (esSedeFija && s.codigo_escuela?.toLowerCase() !== escuelaUsuarioAsignada) {
        return false;
      }

      if (filtroEscuela !== 'todas' && s.codigo_escuela?.toLowerCase() !== filtroEscuela.toLowerCase()) {
        return false;
      }

      const baremo = calcularBaremoPrioridad(s, personalEscuelaMap);
      if (filtroPrioridad !== 'todas') {
        if (baremo.codigo !== filtroPrioridad) return false;
      }

      if (filtroAptitud !== 'todas') {
        const apt = s.aptitud || 'Sin Evaluar';
        if (filtroAptitud === 'Sin Evaluar' && (s.aptitud && s.aptitud !== 'Sin Evaluar')) return false;
        if (filtroAptitud !== 'Sin Evaluar' && apt.toLowerCase() !== filtroAptitud.toLowerCase()) return false;
      }

      if (filtroNomina !== 'todas' && s.pdvsa_tipo_nomina?.toLowerCase() !== filtroNomina.toLowerCase()) {
        return false;
      }

      if (filtroLocalidad !== 'todas' && s.pdvsa_localidad_trabajo?.toLowerCase() !== filtroLocalidad.toLowerCase()) {
        return false;
      }

      if (filtroCondicionLaboral !== 'todas' && s.pdvsa_condicion_laboral?.toLowerCase() !== filtroCondicionLaboral.toLowerCase()) {
        return false;
      }

      if (filtroGrado !== 'todos' && s.grado_solicitado?.toLowerCase() !== filtroGrado.toLowerCase()) {
        return false;
      }

      if (filtroEstado !== 'todos' && s.estado?.toLowerCase() !== filtroEstado.toLowerCase()) {
        return false;
      }

      if (filtroWhatsApp === 'notificado') {
        const parsed = parsearObservaciones(s.observaciones);
        if (!parsed.whatsapp_notificado) return false;
      } else if (filtroWhatsApp === 'sin_notificar') {
        const parsed = parsearObservaciones(s.observaciones);
        if (parsed.whatsapp_notificado) return false;
      }

      if (busqueda.trim() !== '') {
        const query = busqueda.toLowerCase().trim();
        const nomEst = `${s.estudiante_nombres || ''} ${s.estudiante_apellidos || ''}`.toLowerCase();
        const cedEst = (s.estudiante_cedula || '').toLowerCase();
        const nomRep = `${s.representante_nombres || ''} ${s.representante_apellidos || ''}`.toLowerCase();
        const cedRep = (s.representante_cedula || '').toLowerCase();
        const codUni = (s.codigo_unico || '').toLowerCase();

        if (
          !nomEst.includes(query) &&
          !cedEst.includes(query) &&
          !nomRep.includes(query) &&
          !cedRep.includes(query) &&
          !codUni.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });

    return filtradas.sort((a, b) => {
      const bA = calcularBaremoPrioridad(a, personalEscuelaMap).nivel;
      const bB = calcularBaremoPrioridad(b, personalEscuelaMap).nivel;
      if (bA !== bB) return bA - bB;
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    });
  }, [
    solicitudes,
    personalEscuelaMap,
    filtroEscuela,
    filtroPrioridad,
    filtroAptitud,
    filtroNomina,
    filtroLocalidad,
    filtroCondicionLaboral,
    filtroGrado,
    filtroEstado,
    filtroWhatsApp,
    busqueda,
  ]);

  // Solicitudes aceptadas para la 3ra pestaña de formalización
  const solicitudesAceptadasParaFormalizar = useMemo(() => {
    return solicitudes.filter(s => {
      const est = (s.estado || '').toLowerCase();
      return est === 'aprobado' || est === 'formalizado' || est === 'inscrito';
    }).sort((a, b) => {
      const isFormA = (a.estado || '').toLowerCase() === 'formalizado' ? 1 : 0;
      const isFormB = (b.estado || '').toLowerCase() === 'formalizado' ? 1 : 0;
      if (isFormA !== isFormB) return isFormA - isFormB;
      return `${a.estudiante_apellidos || ''} ${a.estudiante_nombres || ''}`.localeCompare(`${b.estudiante_apellidos || ''} ${b.estudiante_nombres || ''}`);
    });
  }, [solicitudes]);

  // Listados dinámicos de opciones disponibles para los filtros de Formalización
  const gradosDisponiblesFormalizacion = useMemo(() => {
    const setG = new Set<string>();
    solicitudesAceptadasParaFormalizar.forEach(s => {
      if (s.grado_solicitado) setG.add(s.grado_solicitado.trim());
    });
    return Array.from(setG).sort();
  }, [solicitudesAceptadasParaFormalizar]);

  // Lista filtrada específicamente para la Taquilla de Formalización Física
  const solicitudesFormalizacionFiltradas = useMemo(() => {
    return solicitudesAceptadasParaFormalizar.filter(sol => {
      // Aislamiento estricto si el usuario pertenece a una sede fija
      if (esSedeFija && (sol.codigo_escuela || '').toLowerCase() !== escuelaUsuarioAsignada) {
        return false;
      }

      // 1. Filtro por Escuela (específico de formalización o global)
      const escFiltro = filtroEscuelaFormalizacion !== 'todas' ? filtroEscuelaFormalizacion : filtroEscuela;
      if (escFiltro !== 'todas' && sol.codigo_escuela !== escFiltro) return false;

      // 2. Filtro por Estado (Pendientes / Formalizados)
      const esFormalizado = sol.estado === 'Formalizado' || sol.estado === 'Inscrito';
      if (filtroEstadoFormalizacion === 'pendientes' && esFormalizado) return false;
      if (filtroEstadoFormalizacion === 'formalizados' && !esFormalizado) return false;

      // 3. Filtro por Grado Solicitado
      if (filtroGradoFormalizacion !== 'todos' && (sol.grado_solicitado || '').trim() !== filtroGradoFormalizacion) {
        return false;
      }

      // 4. Filtro por Sección Asignada
      if (filtroSeccionFormalizacion !== 'todas') {
        const obs = sol.observaciones || '';
        const matchForm = obs.match(/\[Inscripción Física Formalizada(?: el [^\]\s]+)?(?: en Sección ([^\]]+))?\]/i);
        const secAsig = (matchForm?.[2] || sol.datos_actualizados?.seccion_actual || '').trim().toUpperCase();
        if (filtroSeccionFormalizacion === 'sin_seccion') {
          if (secAsig) return false;
        } else if (secAsig !== filtroSeccionFormalizacion.toUpperCase()) {
          return false;
        }
      }

      // 5. Filtro por Estado de Notificación WhatsApp
      if (filtroWhatsAppFormalizacion !== 'todos') {
        const parsed = parsearObservaciones(sol.observaciones);
        if (filtroWhatsAppFormalizacion === 'enviado' && !parsed.whatsapp_notificado) return false;
        if (filtroWhatsAppFormalizacion === 'pendiente' && parsed.whatsapp_notificado) return false;
      }

      // 6. Búsqueda inteligente multi-campo en tiempo real
      if (busquedaFormalizacion.trim()) {
        const q = busquedaFormalizacion.toLowerCase().trim();
        const nomEst = `${sol.estudiante_nombres || ''} ${sol.estudiante_apellidos || ''}`.toLowerCase();
        const nomRep = `${sol.representante_nombres || ''} ${sol.representante_apellidos || ''}`.toLowerCase();
        const cedEst = (sol.estudiante_cedula || '').toLowerCase();
        const cedRep = (sol.representante_cedula || '').toLowerCase();
        const telRep = (sol.representante_telefono || '').toLowerCase();
        const cod = (sol.codigo_unico || '').toLowerCase();
        const grado = (sol.grado_solicitado || '').toLowerCase();
        return (
          nomEst.includes(q) ||
          nomRep.includes(q) ||
          cedEst.includes(q) ||
          cedRep.includes(q) ||
          telRep.includes(q) ||
          cod.includes(q) ||
          grado.includes(q)
        );
      }
      return true;
    });
  }, [
    solicitudesAceptadasParaFormalizar,
    filtroEscuelaFormalizacion,
    filtroEscuela,
    filtroEstadoFormalizacion,
    filtroGradoFormalizacion,
    filtroSeccionFormalizacion,
    filtroWhatsAppFormalizacion,
    busquedaFormalizacion
  ]);

  const kpisFormalizacion = useMemo(() => {
    const base = solicitudesFormalizacionFiltradas;
    const formalizados = base.filter(s => s.estado === 'Formalizado' || s.estado === 'Inscrito').length;
    const pendientes = base.length - formalizados;
    return { total: base.length, formalizados, pendientes };
  }, [solicitudesFormalizacionFiltradas]);

  const limpiarFiltrosFormalizacion = () => {
    setBusquedaFormalizacion('');
    setFiltroEstadoFormalizacion('todos');
    setFiltroEscuelaFormalizacion(esSedeFija ? escuelaUsuarioAsignada : 'todas');
    setFiltroGradoFormalizacion('todos');
    setFiltroSeccionFormalizacion('todas');
    setFiltroWhatsAppFormalizacion('todos');
  };

  // ── ESTADÍSTICAS E INDICADORES KPI ──────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = solicitudesFiltradas.length;
    const aprobados = solicitudesFiltradas.filter(s => s.estado === 'Aprobado').length;
    const formalizados = solicitudesFiltradas.filter(s => s.estado === 'Formalizado').length;
    const pendientes = solicitudesFiltradas.filter(s => s.estado === 'Pendiente' || !s.estado).length;
    const evaluacion = solicitudesFiltradas.filter(s => s.estado === 'En Evaluación').length;
    const rechazados = solicitudesFiltradas.filter(s => s.estado === 'Rechazado').length;
    const aptos = solicitudesFiltradas.filter(s => s.aptitud === 'Apto').length;

    return { total, aprobados, formalizados, pendientes, evaluacion, rechazados, aptos };
  }, [solicitudesFiltradas]);

  const limpiarFiltros = () => {
    setFiltroEscuela(esSedeFija ? escuelaUsuarioAsignada : 'todas');
    setFiltroPrioridad('todas');
    setFiltroAptitud('todas');
    setFiltroNomina('todas');
    setFiltroLocalidad('todas');
    setFiltroCondicionLaboral('todas');
    setFiltroGrado('todos');
    setFiltroEstado('todos');
    setFiltroWhatsApp('todos');
    setBusqueda('');
  };

  // ── EXPORTAR A EXCEL ─────────────────────────────────────────────────────────────
  const exportarExcel = () => {
    if (solicitudesFiltradas.length === 0) {
      if (Swal) Swal.fire({ icon: 'warning', title: 'Sin Registros', text: 'No hay solicitudes para exportar.' });
      return;
    }

    const dataExcel = solicitudesFiltradas.map((s, idx) => {
      const baremo = calcularBaremoPrioridad(s, personalEscuelaMap);
      return {
        'Posición Baremo': idx + 1,
        'Nivel Prioridad': baremo.codigo,
        'Categoría Baremo': baremo.etiqueta,
        'Código Único': s.codigo_unico || 'N/A',
        Escuela: NOMBRE_ESCUELA_MAP[s.codigo_escuela] || s.codigo_escuela,
        Estudiante: nombreCompleto(s.estudiante_nombres, s.estudiante_apellidos),
        'Cédula Estudiante': s.estudiante_cedula || 'N/A',
        'Grado Solicitado': s.grado_solicitado || 'N/A',
        Representante: nombreCompleto(s.representante_nombres, s.representante_apellidos),
        'Cédula Representante': s.representante_cedula || 'N/A',
        Parentesco: s.parentesco || s.representante_parentesco || 'Representante',
        'Teléfono Contacto': s.representante_telefono || 'N/A',
        'Correo Contacto': s.representante_email || 'N/A',
        'Trabaja PDVSA': s.representante_trabaja_pdvsa ? 'Sí' : 'No',
        'Nómina PDVSA': s.pdvsa_tipo_nomina || 'N/A',
        'Localidad Trabajo': s.pdvsa_localidad_trabajo || 'N/A',
        'Condición Laboral': s.pdvsa_condicion_laboral || 'N/A',
        Gerencia: s.pdvsa_gerencia || 'N/A',
        'Aptitud Técnica': s.aptitud || 'Sin Evaluar',
        'Estatus Oficial': s.estado || 'Pendiente',
        'Instrucción Jerárquica': s.instruccion_jerarquica ? `Sí (${s.instruccion_quien || 'Nivel Superior'})` : 'No',
        'Fecha Registro': s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A',
        Observaciones: s.observaciones || '',
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gestion_Admisiones');
    const fechaStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `SIGAE_Baremo_Admisiones_${fechaStr}.xlsx`);

    auditar('Gestión de Admisiones', 'Exportar Excel', `Exportadas ${solicitudesFiltradas.length} solicitudes con baremo`);
  };

  // ── EXPORTAR A EXCEL FORMALIZACIÓN FÍSICA DE MATRÍCULA ──────────────────────────
  const exportarExcelFormalizacion = () => {
    if (solicitudesFormalizacionFiltradas.length === 0) {
      if (Swal) {
        Swal.fire({
          icon: 'warning',
          title: 'Sin Registros',
          text: 'No hay registros en la lista de formalización para exportar con los filtros actuales.'
        });
      }
      return;
    }

    const dataExcel = solicitudesFormalizacionFiltradas.map((sol, idx) => {
      const esFormalizado = sol.estado === 'Formalizado' || sol.estado === 'Inscrito';
      const parsed = parsearObservaciones(sol.observaciones);
      const matchForm = (sol.observaciones || '').match(/\[Inscripción Física Formalizada(?: el ([^\]\s]+))?(?: en Sección ([^\]]+))?\]/i);
      const fechaForm = matchForm?.[1] || (esFormalizado && sol.created_at ? new Date(sol.created_at).toLocaleDateString('es-VE') : (esFormalizado ? 'Registrado' : 'Pendiente'));
      const seccion = matchForm?.[2]?.trim() || sol.datos_actualizados?.seccion_actual || (esFormalizado ? 'A' : 'Sin Asignar');
      const accF = verificarAccesoHabilitado(sol, estudiantesMatriculaBD);

      return {
        'N.°': idx + 1,
        'Código Único': sol.codigo_unico || 'N/A',
        'Sede Institucional': NOMBRE_ESCUELA_MAP[sol.codigo_escuela] || sol.codigo_escuela,
        'Estatus Formalización': esFormalizado ? 'Inscrito / Formalizado' : 'Pendiente por Consignar Físico',
        'Fecha Formalización': fechaForm,
        'Grado Solicitado': sol.grado_solicitado || 'N/A',
        'Sección Asignada': seccion,
        'Aspirante / Estudiante': nombreCompleto(sol.estudiante_nombres, sol.estudiante_apellidos),
        'Cédula Estudiante': sol.estudiante_cedula || 'En trámite',
        'Representante Legal': nombreCompleto(sol.representante_nombres, sol.representante_apellidos),
        'Cédula Representante': sol.representante_cedula || 'N/A',
        'Parentesco': sol.representante_parentesco || sol.parentesco || 'Representante',
        'Teléfono Principal': sol.representante_telefono || 'N/A',
        'Teléfono Alternativo': sol.representante_telefono2 || 'N/A',
        'Correo Electrónico': sol.representante_email || 'N/A',
        'Notificación WhatsApp': parsed.whatsapp_notificado ? `Enviado (${parsed.whatsapp_fecha || ''})` : 'Pendiente',
        'Acceso SIGAE': accF.habilitado ? `Habilitado${accF.fecha ? ` (${accF.fecha})` : ''}` : 'Pendiente',
        'Trabaja en PDVSA': sol.representante_trabaja_pdvsa ? 'Sí' : 'No',
        'Nómina': sol.pdvsa_tipo_nomina || 'N/A',
        'Localidad': sol.pdvsa_localidad_trabajo || 'N/A',
        'Observaciones': parsed.textoLimpio || sol.observaciones || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataExcel);

    // Ajuste automático y estético del ancho de columnas
    const colWidths = Object.keys(dataExcel[0] || {}).map(key => ({
      wch: Math.max(key.length + 3, ...dataExcel.map(r => String((r as any)[key] || '').length + 2).slice(0, 100))
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Formalizacion_Matricula');
    const fechaStr = new Date().toISOString().slice(0, 10);
    const escuelaSufijo = filtroEscuelaFormalizacion !== 'todas' ? `_${filtroEscuelaFormalizacion.toUpperCase()}` : '';
    XLSX.writeFile(wb, `SIGAE_Formalizacion_Matricula${escuelaSufijo}_${fechaStr}.xlsx`);

    auditar(
      'Formalización de Admisiones',
      'Exportar Excel',
      `Exportados ${solicitudesFormalizacionFiltradas.length} aspirantes en formalización a Excel (.xlsx)`
    );

    if (Swal) {
      Swal.fire({
        icon: 'success',
        title: '¡Descarga Exitosa!',
        text: `Se exportaron ${solicitudesFormalizacionFiltradas.length} registros de formalización en formato Excel (.xlsx).`,
        timer: 2500,
        showConfirmButton: false
      });
    }
  };

  // ── ENVIAR MENSAJE OFICIAL POR WHATSAPP AL REPRESENTANTE (SOPORTE MULTITELÉFONO) ─
  const notificarRepresentanteWhatsApp = async (sol: SolicitudAdmision, telefonoDirecto?: string) => {
    const nomEst = nombreCompleto(sol.estudiante_nombres, sol.estudiante_apellidos);
    const estado = sol.estado || 'Pendiente';
    const esAceptacion = estado === 'Aprobado' || estado === 'Formalizado';

    // Recopilar todos los números de teléfono registrados para este aspirante
    const telefonosDisponibles: { etiqueta: string; numero: string }[] = [];
    const pushTel = (etiqueta: string, val?: string) => {
      if (!val) return;
      const clean = val.replace(/\D/g, '');
      if (clean.length >= 7 && !telefonosDisponibles.some(t => t.numero.replace(/\D/g, '') === clean)) {
        telefonosDisponibles.push({ etiqueta, numero: val.trim() });
      }
    };

    pushTel(`Representante (${sol.representante_parentesco || 'Principal'})`, sol.representante_telefono);
    pushTel('Teléfono Alternativo / Contacto', sol.representante_telefono2);
    pushTel(`Madre${sol.madre_nombres ? `: ${sol.madre_nombres}` : ''}`, sol.madre_telefono);
    pushTel(`Padre${sol.padre_nombres ? `: ${sol.padre_nombres}` : ''}`, sol.padre_telefono);

    if (telefonosDisponibles.length === 0) {
      if (Swal) {
        Swal.fire({
          icon: 'warning',
          title: 'Sin Teléfono Registrado',
          text: `La solicitud de ${nomEst} no cuenta con ningún número de teléfono válido registrado.`,
        });
      } else {
        alert('No hay un número de teléfono registrado para el representante.');
      }
      return;
    }

    const enviarANumero = async (telRaw: string, etiquetaTel: string) => {
      const nombreEscuela = NOMBRE_ESCUELA_MAP[sol.codigo_escuela] || 'U.E. Santa Bárbara / U.E. Libertador Bolívar';
      const plantilla = buscarPlantillaAdmision(sol.codigo_escuela, estado, 'whatsapp');
      const msg = renderizarMensajeAdmision(plantilla.cuerpo_mensaje, sol, nombreEscuela);

      const waUrl = generarEnlaceWhatsAppAdmision(telRaw, msg);
      window.open(waUrl, '_blank');

      const ahora = new Date();
      const fechaHoraStr = ahora.toLocaleDateString('es-VE') + ' ' + ahora.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
      
      const parsed = parsearObservaciones(sol.observaciones);
      const nuevasObsConWA = estructurarObservaciones(
        parsed.textoLimpio,
        sol.aptitud || parsed.aptitud,
        sol.instruccion_jerarquica !== undefined ? !!sol.instruccion_jerarquica : parsed.instruccion_jerarquica,
        sol.instruccion_quien || parsed.instruccion_quien || undefined,
        sol.prioridad_manual !== undefined && sol.prioridad_manual !== null ? sol.prioridad_manual : (parsed.prioridad_manual ?? undefined),
        sol.es_personal_escuela !== undefined ? !!sol.es_personal_escuela : parsed.es_personal_escuela,
        true,
        fechaHoraStr,
        estado
      );

      try {
        await supabase
          .from('solicitud_cupos')
          .update({ observaciones: nuevasObsConWA })
          .eq('id', sol.id);

        const updateData = {
          observaciones: nuevasObsConWA,
          whatsapp_notificado: true,
          whatsapp_fecha: fechaHoraStr,
          whatsapp_estado: estado
        };

        setSolicitudes(prev => prev.map(s => s.id === sol.id ? { ...s, ...updateData } : s));
        
        if (solicitudSeleccionada && solicitudSeleccionada.id === sol.id) {
          setSolicitudSeleccionada(prev => prev ? { ...prev, ...updateData } : null);
        }

        auditar('Gestión de Admisiones', 'Notificación WhatsApp', `Enviada notificación por WhatsApp (${esAceptacion ? 'Carta de Aceptación' : estado}) a ${etiquetaTel} (${telRaw}) para ${nomEst}`);

        if (Swal) {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `WhatsApp enviado a ${etiquetaTel}`,
            text: `${esAceptacion ? 'Carta de Aceptación Notificada' : `Estatus: ${estado}`} (${fechaHoraStr})`,
            showConfirmButton: false,
            timer: 2500
          });
        }
      } catch (errWA) {
        console.warn('Error guardando registro de WhatsApp en BD:', errWA);
      }
    };

    // Si se especificó un número directo, enviarlo
    if (telefonoDirecto) {
      return enviarANumero(telefonoDirecto, 'Teléfono');
    }

    // Si solo hay un número registrado, enviar directo
    if (telefonosDisponibles.length === 1) {
      return enviarANumero(telefonosDisponibles[0].numero, telefonosDisponibles[0].etiqueta);
    }

    // Si hay múltiples números registrados, permitir elegir a cuál o a todos
    if (Swal) {
      Swal.fire({
        title: esAceptacion ? 'Notificar Carta de Aceptación' : 'Notificar por WhatsApp',
        html: `
          <div class="text-start">
            <p class="small text-muted mb-3">
              El aspirante <b>${nomEst}</b> tiene <b>${telefonosDisponibles.length}</b> números telefónicos registrados. Haz clic en el número al que deseas enviar el mensaje oficial:
            </p>
            <div class="d-grid gap-2">
              ${telefonosDisponibles.map((t, idx) => `
                <button type="button" id="btn-wa-sel-${idx}" class="btn btn-outline-success p-2.5 rounded-3 d-flex align-items-center justify-content-between text-start hover-efecto shadow-xs">
                  <div>
                    <div class="fw-bold text-dark fs-6">${t.etiqueta}</div>
                    <small class="text-muted font-monospace"><i class="bi bi-telephone me-1"></i>${t.numero}</small>
                  </div>
                  <span class="badge bg-success text-white rounded-pill px-2.5 py-1.5 d-flex align-items-center gap-1">
                    <i class="bi bi-whatsapp"></i> Enviar
                  </span>
                </button>
              `).join('')}
            </div>
          </div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Cerrar',
        didOpen: () => {
          telefonosDisponibles.forEach((t, idx) => {
            const btn = document.getElementById(`btn-wa-sel-${idx}`);
            if (btn) {
              btn.onclick = () => {
                Swal.close();
                enviarANumero(t.numero, t.etiqueta);
              };
            }
          });
        }
      });
    } else {
      enviarANumero(telefonosDisponibles[0].numero, telefonosDisponibles[0].etiqueta);
    }
  };

  // ── DESCARGA DE CARTA DE ACEPTACIÓN OFICIAL (PDF 3 PÁGINAS) ───────────────────
  const descargarCartaAceptacionAspirante = async (sol: SolicitudAdmision) => {
    try {
      const escCode: 'sb' | 'lb' = (sol.codigo_escuela === 'sb' ? 'sb' : 'lb');
      const baseConfig = PLANTILLAS_ACEPTACION_DEFAULT[escCode];

      let config = baseConfig;
      try {
        const plantillas = obtenerPlantillasCartaAceptacion();
        const encontrada = plantillas.find(p => p.id_escuela === escCode);
        if (encontrada) {
          config = encontrada;
        }
      } catch (e) {
        console.warn('Usando configuración predeterminada de carta de aceptación:', e);
      }

      const datosAspirante: DatosAspiranteCartaAceptacion = {
        codigo_unico: sol.codigo_unico || `CR-${escCode.toUpperCase()}-2025-${sol.id}`,
        codigo_escuela: escCode,
        representante_nombres: sol.representante_nombres || '',
        representante_apellidos: sol.representante_apellidos || '',
        representante_cedula: sol.representante_cedula || '',
        representante_telefono: sol.representante_telefono || sol.representante_telefono2 || '',
        representante_email: sol.representante_email || '',
        representante_email_empresa: sol.pdvsa_email_empresa || '',
        estudiante_nombres: sol.estudiante_nombres || '',
        estudiante_apellidos: sol.estudiante_apellidos || '',
        estudiante_cedula: sol.estudiante_cedula || '',
        grado_solicitado: sol.grado_solicitado || '1er Grado',
        parentesco: sol.representante_parentesco || sol.parentesco || 'Madre / Padre / Representante',
        trabajador_nombre: sol.representante_nombres ? `${sol.representante_nombres} ${sol.representante_apellidos}` : '',
        trabajador_cedula: sol.representante_cedula || '',
        observaciones: typeof sol.observaciones === 'string' ? sol.observaciones : ''
      };

      await descargarCartaAceptacionPDF(config, datosAspirante);
      auditar('Gestión de Admisiones', 'Descarga Carta de Aceptación', `Descargó Carta de Aceptación para ${sol.estudiante_nombres} ${sol.estudiante_apellidos} (${sol.codigo_unico})`);
    } catch (err) {
      console.error('Error generando Carta de Aceptación PDF:', err);
      if (Swal) {
        Swal.fire('Error', 'No se pudo generar el documento PDF de la Carta de Aceptación.', 'error');
      }
    }
  };

  // ── ABRIR MODAL DE DETALLE Y GESTIÓN ───────────────────────────────────────────
  const abrirDetalle = (sol: SolicitudAdmision) => {
    const parsed = parsearObservaciones(sol.observaciones);
    setSolicitudSeleccionada(sol);
    setNuevoEstado(sol.estado || 'Pendiente');
    setNuevaAptitud(sol.aptitud || parsed.aptitud || 'En Evaluación');
    setEsJerarquica(sol.instruccion_jerarquica !== undefined ? !!sol.instruccion_jerarquica : parsed.instruccion_jerarquica);
    setQuienInstruye(sol.instruccion_quien || parsed.instruccion_quien || '');
    setPrioridadAsignada(sol.prioridad_manual !== undefined && sol.prioridad_manual !== null ? sol.prioridad_manual : (parsed.prioridad_manual ?? 1));
    setEsPersonalEscuelaForm(sol.es_personal_escuela !== undefined ? !!sol.es_personal_escuela : parsed.es_personal_escuela);
    setNuevasObservaciones(parsed.textoLimpio || '');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setSolicitudSeleccionada(null);
  };

  // ── GUARDAR EVALUACIÓN Y CAMBIOS DE ESTADO ─────────────────────────────────────
  const guardarEvaluacion = async (sol: SolicitudAdmision, avanzarSiguiente: boolean = false) => {
    setGuardandoEstado(true);
    try {
      const parsedActual = parsearObservaciones(sol.observaciones);
      const obsEstructuradas = estructurarObservaciones(
        nuevasObservaciones,
        nuevaAptitud,
        esJerarquica,
        quienInstruye,
        prioridadAsignada,
        esPersonalEscuelaForm,
        parsedActual.whatsapp_notificado,
        parsedActual.whatsapp_fecha,
        parsedActual.whatsapp_estado
      );

      // Payload estricto con campos que existen físicamente en la BD
      const dbPayload = {
        estado: nuevoEstado,
        observaciones: obsEstructuradas,
      };

      const { error } = await supabase
        .from('solicitud_cupos')
        .update(dbPayload)
        .eq('id', sol.id);

      if (error) throw error;

      await auditar(
        'Gestión de Admisiones',
        'Evaluación Solicitud',
        `Solicitud ${sol.codigo_unico} calificada como ${nuevaAptitud}, estado ${nuevoEstado}`
      );

      // Actualizar memoria local de React
      const updatesEnMemoria: Partial<SolicitudAdmision> = {
        estado: nuevoEstado,
        aptitud: nuevaAptitud,
        instruccion_jerarquica: esJerarquica,
        instruccion_quien: esJerarquica ? quienInstruye : null,
        prioridad_manual: esJerarquica ? prioridadAsignada : null,
        es_personal_escuela: esPersonalEscuelaForm,
        observaciones: obsEstructuradas,
        whatsapp_notificado: parsedActual.whatsapp_notificado,
        whatsapp_fecha: parsedActual.whatsapp_fecha,
        whatsapp_estado: parsedActual.whatsapp_estado
      };

      setSolicitudes(prev =>
        prev.map(s => (s.id === sol.id ? ({ ...s, ...updatesEnMemoria } as SolicitudAdmision) : s))
      );

      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: 'Evaluación Guardada',
          text: `La solicitud ${sol.codigo_unico} fue actualizada correctamente.`,
          timer: 1800,
          showConfirmButton: false,
        });
      }

      if (modalAbierto) cerrarModal();

      if (avanzarSiguiente && indiceUnoAUno < solicitudesFiltradas.length - 1) {
        const nextIdx = indiceUnoAUno + 1;
        setIndiceUnoAUno(nextIdx);
        cargarDatosFormulario(solicitudesFiltradas[nextIdx]);
      }
    } catch (err: any) {
      console.error('Error al guardar evaluación:', err);
      if (Swal) {
        Swal.fire({
          icon: 'error',
          title: 'Error al Guardar',
          text: 'No se pudo guardar la evaluación: ' + (err.message || 'Error desconocido'),
        });
      }
    } finally {
      setGuardandoEstado(false);
    }
  };

  // ── INICIAR Y GUARDAR EDICIÓN DE EXPEDIENTE ─────────────────────────────────────
  const iniciarEdicionExpediente = (sol: SolicitudAdmision) => {
    setFormEdicion({ ...sol });
    setModoEdicionUnoAUno(true);
  };

  const cancelarEdicionExpediente = () => {
    setModoEdicionUnoAUno(false);
    setFormEdicion({});
  };

  const guardarEdicionExpediente = async () => {
    if (!formEdicion.id) return;
    setGuardandoEdicion(true);
    try {
      // Whitelist estricto de columnas físicas existentes en la tabla `solicitud_cupos`
      const columnasPermitidas = [
        'codigo_unico',
        'codigo_escuela',
        'estudiante_nombres',
        'estudiante_apellidos',
        'estudiante_cedula',
        'estudiante_fecha_nacimiento',
        'estudiante_sexo',
        'estudiante_condicion_neuro',
        'estudiante_condicion_medica',
        'grado_solicitado',
        'plantel_procedencia',
        'representante_nombres',
        'representante_apellidos',
        'representante_cedula',
        'representante_telefono',
        'representante_telefono2',
        'representante_email',
        'parentesco',
        'representante_parentesco',
        'representante_trabaja_pdvsa',
        'pdvsa_condicion_laboral',
        'pdvsa_tipo_nomina',
        'pdvsa_negocio_filial',
        'pdvsa_gerencia',
        'pdvsa_localidad_trabajo',
        'pdvsa_email_empresa',
        'madre_nombres',
        'madre_apellidos',
        'madre_cedula',
        'madre_telefono',
        'madre_trabaja_pdvsa',
        'padre_nombres',
        'padre_apellidos',
        'padre_cedula',
        'padre_telefono',
        'padre_trabaja_pdvsa',
        'estado_habitacion',
        'municipio_habitacion',
        'parroquia_habitacion',
        'direccion_habitacion',
        'requiere_transporte',
        'ruta_transporte',
        'estado',
        'observaciones',
        'foto_partida_nacimiento_url',
        'foto_cedula_estudiante_url',
        'foto_carnet_url',
        'foto_informe_medico_url',
        'foto_carnet_conapdis_url',
        'foto_cedula_madre_url',
        'foto_cedula_padre_url',
        'constancia_cultura_url',
        'constancia_danza_url',
        'constancia_deporte_url',
        'documentos_adjuntos'
      ];

      const payloadBD: any = {};
      columnasPermitidas.forEach(col => {
        if ((formEdicion as any)[col] !== undefined) {
          payloadBD[col] = (formEdicion as any)[col];
        }
      });

      // Asegurar que tanto 'parentesco' como 'representante_parentesco' queden actualizados con el mismo valor
      const parentescoElegido = formEdicion.parentesco || formEdicion.representante_parentesco;
      if (parentescoElegido !== undefined) {
        payloadBD.parentesco = parentescoElegido;
        payloadBD.representante_parentesco = parentescoElegido;
      }

      const { error } = await supabase
        .from('solicitud_cupos')
        .update(payloadBD)
        .eq('id', formEdicion.id);

      if (error) throw error;

      // Sincronizar hacia estudiantes_vinculaciones si se modificó el representante o datos del aspirante
      if (payloadBD.representante_cedula || payloadBD.parentesco) {
        try {
          const codUni = formEdicion.codigo_unico;
          const cedEst = formEdicion.estudiante_cedula;
          const nomEst = formEdicion.estudiante_nombres;
          const apeEst = formEdicion.estudiante_apellidos;
          const payloadVinc: any = {
            updated_at: new Date().toISOString()
          };
          if (payloadBD.representante_cedula) {
            payloadVinc.cedula_representante = payloadBD.representante_cedula;
            payloadVinc.nombres_representante = payloadBD.representante_nombres || formEdicion.representante_nombres;
            payloadVinc.apellidos_representante = payloadBD.representante_apellidos || formEdicion.representante_apellidos;
          }

          if (cedEst) {
            await supabase.from('estudiantes_vinculaciones').update(payloadVinc).eq('cedula_estudiante', cedEst);
          }
          if (codUni) {
            await supabase.from('estudiantes_vinculaciones').update(payloadVinc).eq('cedula_estudiante', codUni);
            await supabase.from('estudiantes_vinculaciones').update(payloadVinc).eq('cedula_estudiante', `T-${codUni.replace(/^T-/, '')}`);
          }
          if (nomEst && apeEst) {
            await supabase.from('estudiantes_vinculaciones').update(payloadVinc)
              .ilike('nombres_estudiante', `%${nomEst.trim()}%`)
              .ilike('apellidos_estudiante', `%${apeEst.trim()}%`);
          }
        } catch (eSync) {
          console.warn('Nota sincronizando vinculación desde admisiones:', eSync);
        }
      }

      const nomEstEdit = nombreCompleto(formEdicion.estudiante_nombres, formEdicion.estudiante_apellidos);
      await auditar(
        'Gestión de Admisiones',
        'Edición de Expediente',
        `Se editaron datos del aspirante ${nomEstEdit} (${formEdicion.codigo_unico})`
      );

      const objetoActualizado = {
        ...formEdicion,
        parentesco: parentescoElegido,
        representante_parentesco: parentescoElegido
      };

      setSolicitudes(prev =>
        prev.map(s => (s.id === formEdicion.id ? ({ ...s, ...objetoActualizado } as SolicitudAdmision) : s))
      );

      setModoEdicionUnoAUno(false);

      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: 'Datos Actualizados',
          text: 'La información del expediente fue guardada con éxito.',
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (err: any) {
      console.error('Error al guardar edición de expediente:', err);
      if (Swal) {
        Swal.fire({
          icon: 'error',
          title: 'Error al Guardar',
          text: 'No se pudo actualizar el expediente: ' + (err.message || 'Error desconocido'),
        });
      }
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // ── EJECUTAR FORMALIZACIÓN AUTOMÁTICA DE MATRÍCULA ──────────────────────────────
  const abrirModalFormalizar = (sol: SolicitudAdmision) => {
    setSolicitudParaFormalizar(sol);
    setSeccionFormalizacion('A');
    setEditandoDatosFormalizar(false);
    setFormDatosFormalizar({
      estudiante_nombres: sol.estudiante_nombres || '',
      estudiante_apellidos: sol.estudiante_apellidos || '',
      estudiante_cedula: sol.estudiante_cedula || '',
      grado_solicitado: sol.grado_solicitado || '1er Grado',
      codigo_escuela: sol.codigo_escuela || 'sb',
      representante_nombres: sol.representante_nombres || '',
      representante_apellidos: sol.representante_apellidos || '',
      representante_cedula: cleanCedula(sol.representante_cedula) || (sol.representante_cedula || ''),
      representante_telefono: sol.representante_telefono || '',
      representante_email: sol.representante_email || ''
    });
    setRecaudosVerificados({
      partida_nacimiento: true,
      cedula_estudiante: true,
      cedula_representante: true,
      fotos_carnet: true,
      constancia_trabajo: true,
      boleta_promocion: true,
    });
    setModalFormalizarAbierto(true);
  };

  const ejecutarFormalizacion = async () => {
    if (!solicitudParaFormalizar) return;

    // Tomar los datos posiblemente corregidos del formulario
    const cedRep = cleanCedula(formDatosFormalizar.representante_cedula) || (solicitudParaFormalizar.representante_cedula || '').trim();
    const nomRep = formDatosFormalizar.representante_nombres.trim() || (solicitudParaFormalizar.representante_nombres || '').trim();
    const apeRep = formDatosFormalizar.representante_apellidos.trim() || (solicitudParaFormalizar.representante_apellidos || '').trim();
    const cedEst = cleanCedula(formDatosFormalizar.estudiante_cedula) || (solicitudParaFormalizar.estudiante_cedula || '').trim() || `ESC-${solicitudParaFormalizar.codigo_unico}`;
    const nomEst = formDatosFormalizar.estudiante_nombres.trim() || (solicitudParaFormalizar.estudiante_nombres || '').trim();
    const apeEst = formDatosFormalizar.estudiante_apellidos.trim() || (solicitudParaFormalizar.estudiante_apellidos || '').trim();
    const gradoEst = formDatosFormalizar.grado_solicitado.trim() || solicitudParaFormalizar.grado_solicitado;
    const escEst = formDatosFormalizar.codigo_escuela || solicitudParaFormalizar.codigo_escuela || 'sb';
    const telRep = formDatosFormalizar.representante_telefono.trim();
    const emailRep = formDatosFormalizar.representante_email.trim();

    if (!cedRep) {
      if (Swal) Swal.fire('Cédula Requerida', 'La cédula del representante no puede estar vacía.', 'warning');
      return;
    }
    if (!nomRep || !apeRep) {
      if (Swal) Swal.fire('Datos Requeridos', 'Indique nombres y apellidos del representante legal.', 'warning');
      return;
    }
    if (!nomEst || !apeEst) {
      if (Swal) Swal.fire('Datos Requeridos', 'Indique nombres y apellidos del estudiante a inscribir.', 'warning');
      return;
    }

    setProcesandoFormalizacion(true);

    try {
      const sol = solicitudParaFormalizar;
      const nomCompletoRep = `${nomRep} ${apeRep}`.trim();
      const nomCompletoEst = `${nomEst} ${apeEst}`.trim();

      // 1. Crear o Asegurar Usuario en tabla `usuarios`
      const { data: usuarioExistente } = await supabase
        .from('usuarios')
        .select('cedula, rol, id_escuela')
        .eq('cedula', cedRep)
        .maybeSingle();

      if (!usuarioExistente) {
        const { error: errUsuario } = await supabase
          .from('usuarios')
          .insert([{
            cedula: cedRep,
            nombre_completo: nomCompletoRep,
            rol: 'Representante',
            id_escuela: sol.codigo_escuela,
            email: sol.representante_email?.trim() || null,
            telefono: sol.representante_telefono?.trim() || null,
            estado: 'Activo',
            primer_ingreso: true,
            clave: null, // El usuario definirá su contraseña en su primer ingreso
            solicito_reseteo: false
          }]);

        if (errUsuario) {
          console.warn('Nota al crear usuario:', errUsuario.message);
        }
      } else if (usuarioExistente.id_escuela && usuarioExistente.id_escuela !== sol.codigo_escuela && usuarioExistente.id_escuela !== 'ambas') {
        await supabase.from('usuarios').update({ id_escuela: 'ambas' }).eq('cedula', cedRep);
      }

      // 2. Vincular Estudiante en `estudiantes_vinculaciones` con datos corregidos evitando duplicados
      const datosActPayload = {
        ...sol,
        estudiante_nombres: nomEst,
        estudiante_apellidos: apeEst,
        estudiante_cedula: cedEst,
        grado_solicitado: gradoEst,
        codigo_escuela: escEst,
        representante_nombres: nomRep,
        representante_apellidos: apeRep,
        representante_cedula: cedRep,
        representante_telefono: telRep || sol.representante_telefono,
        representante_email: emailRep || sol.representante_email,
        direccion_habitacion: sol.direccion_habitacion,
        estado_habitacion: sol.estado_habitacion,
        municipio_habitacion: sol.municipio_habitacion,
        parroquia_habitacion: sol.parroquia_habitacion,
        pdvsa_tipo_nomina: sol.pdvsa_tipo_nomina,
        pdvsa_condicion_laboral: sol.pdvsa_condicion_laboral,
        pdvsa_localidad_trabajo: sol.pdvsa_localidad_trabajo,
        madre_nombres: sol.madre_nombres,
        madre_cedula: sol.madre_cedula,
        padre_nombres: sol.padre_nombres,
        padre_cedula: sol.padre_cedula,
        origen_admision: 'nuevo_ingreso',
        formalizado_en_fisico: true // Desbloquea la Constancia de Inscripción
      };

      const payloadVincRow = {
        cedula_representante: cedRep,
        nombres_representante: nomRep,
        apellidos_representante: apeRep,
        cedula_estudiante: cedEst,
        nombres_estudiante: nomEst,
        apellidos_estudiante: apeEst,
        grado_actual: gradoEst,
        seccion_actual: seccionFormalizacion || 'A',
        codigo_escuela: escEst,
        estado: 'Activo',
        datos_actualizados: datosActPayload,
        creado_por: 'Docente / Admisiones SIGAE - Formalización'
      };

      // Verificar si ya existía una fila con el código provisional o la nueva cédula
      const codUniSinT = (sol.codigo_unico || '').replace(/^T-/, '');
      const { data: filasExistentes } = await supabase
        .from('estudiantes_vinculaciones')
        .select('id, cedula_estudiante')
        .or(`cedula_estudiante.eq.${cedEst},cedula_estudiante.eq.${sol.codigo_unico},cedula_estudiante.eq.T-${codUniSinT},cedula_estudiante.eq.${codUniSinT}`);

      if (filasExistentes && filasExistentes.length > 0) {
        const filaDestino = filasExistentes[0];
        const { error: errUpd } = await supabase
          .from('estudiantes_vinculaciones')
          .update(payloadVincRow)
          .eq('id', filaDestino.id);

        if (errUpd) throw errUpd;

        // Si habían filas sobrantes secundarias, eliminarlas para garantizar 1 sola fila limpia
        for (let i = 1; i < filasExistentes.length; i++) {
          await supabase.from('estudiantes_vinculaciones').delete().eq('id', filasExistentes[i].id);
        }
      } else {
        const { error: errVinculo } = await supabase
          .from('estudiantes_vinculaciones')
          .upsert([payloadVincRow], { onConflict: 'cedula_estudiante' });

        if (errVinculo) throw errVinculo;
      }

      // 3. Actualizar Datos y Estado en `solicitud_cupos` a 'Formalizado'
      const obsFormalizacion = `[Inscripción Física Formalizada el ${new Date().toLocaleDateString('es-VE')} en Sección ${seccionFormalizacion}]`;
      const { error: errSol } = await supabase
        .from('solicitud_cupos')
        .update({
          estudiante_nombres: nomEst,
          estudiante_apellidos: apeEst,
          estudiante_cedula: cleanCedula(cedEst) || null,
          grado_solicitado: gradoEst,
          codigo_escuela: escEst,
          representante_nombres: nomRep,
          representante_apellidos: apeRep,
          representante_cedula: cedRep,
          representante_telefono: telRep || null,
          representante_email: emailRep || sol.representante_email || `rep.${cleanCedula(cedRep)}@sigae.local`,
          estado: 'Formalizado',
          observaciones: sol.observaciones ? `${sol.observaciones} | ${obsFormalizacion}` : obsFormalizacion
        })
        .eq('id', sol.id);

      if (errSol) throw errSol;

      // Auditar
      await auditar(
        'Formalización de Admisiones',
        'Inscripción Formalizada',
        `Estudiante ${nomCompletoEst} formalizado en ${sol.grado_solicitado} sección ${seccionFormalizacion}`
      );

      // Actualizar memoria local con datos posiblemente modificados
      const solActualizada: SolicitudAdmision = {
        ...sol,
        estudiante_nombres: nomEst,
        estudiante_apellidos: apeEst,
        estudiante_cedula: cedEst,
        grado_solicitado: gradoEst,
        codigo_escuela: escEst,
        representante_nombres: nomRep,
        representante_apellidos: apeRep,
        representante_cedula: cedRep,
        representante_telefono: telRep || sol.representante_telefono,
        representante_email: emailRep || sol.representante_email,
        estado: 'Formalizado',
        observaciones: sol.observaciones ? `${sol.observaciones} | ${obsFormalizacion}` : obsFormalizacion
      };

      setSolicitudes(prev =>
        prev.map(s => (s.id === sol.id ? solActualizada : s))
      );

      setModalFormalizarAbierto(false);

      // Abrir constancia de inscripción
      setSolicitudConstancia(solActualizada);
      setModalConstanciaAbierto(true);

      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Inscripción Formalizada con Éxito!',
          html: `
            <div class="text-start small">
              <p>✅ <b>Estudiante matriculado:</b> ${nomCompletoEst}</p>
              <p>✅ <b>Vínculo registrado:</b> Representante C.I. ${cedRep}</p>
              <p>🔑 <b>Usuario habilitado en SIGAE:</b> <code>${cedRep}</code> (Primer ingreso: define su clave al acceder)</p>
            </div>
          `,
          confirmButtonText: 'Ver e Imprimir Constancia',
        });
      }
    } catch (err: any) {
      console.error('Error al formalizar inscripción:', err);
      if (Swal) {
        Swal.fire({
          icon: 'error',
          title: 'Error en la Formalización',
          text: 'No se pudo completar el proceso: ' + (err.message || 'Error de base de datos'),
        });
      }
    } finally {
      setProcesandoFormalizacion(false);
    }
  };

  // ── LÓGICA: ADMISIÓN DIRECTA / EXTEMPORÁNEA ────────────────────────────────────
  const generarCodigoUnicoAdmision = (esc: string) => {
    const anio = new Date().getFullYear();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suf = '';
    for (let i = 0; i < 6; i++) {
      suf += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `SC-${esc.toUpperCase()}-${anio}-DIR${suf}`;
  };

  const capitalizarPalabras = (txt: string) => {
    if (!txt) return '';
    return txt
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  };

  const abrirModalRegistroDirecto = () => {
    const escDefecto = esSedeFija ? escuelaUsuarioAsignada : (filtroEscuela === 'sb' || filtroEscuela === 'lb' ? filtroEscuela : 'sb');
    setFormRegistroDirecto({
      representante_cedula: '',
      representante_nombres: '',
      representante_apellidos: '',
      representante_telefono: '',
      representante_email: '',
      parentesco: 'Hijo(a)',
      trabaja_pdvsa: false,
      pdvsa_condicion_laboral: '',
      pdvsa_tipo_nomina: '',
      estudiante_cedula: '',
      estudiante_nombres: '',
      estudiante_apellidos: '',
      estudiante_sexo: 'M',
      estudiante_fecha_nacimiento: '',
      codigo_escuela: escDefecto,
      grado_solicitado: escDefecto === 'lb' ? '1er Año' : '1er Grado',
      seccion: 'Sin Asignar',
      plantel_procedencia: '',
      estado_ingreso: 'Formalizado',
      observaciones: ''
    });
    setSinCedulaEstudianteDirecto(false);
    setRepDirectoExistente(null);
    setModalRegistroDirectoAbierto(true);
  };

  const buscarRepresentanteDirecto = async (cedulaIngresada: string) => {
    const cedLimpia = cleanCedula(cedulaIngresada);
    if (!cedLimpia || cedLimpia.length < 5) {
      setRepDirectoExistente(null);
      return;
    }

    setBuscandoRepDirecto(true);
    try {
      // 1. Buscar en tabla usuarios
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('cedula, nombre_completo, rol, email, telefono, id_escuela')
        .eq('cedula', cedLimpia)
        .maybeSingle();

      // 2. Buscar en estudiantes_vinculaciones por si hay nombres separados
      const { data: vinculo } = await supabase
        .from('estudiantes_vinculaciones')
        .select('nombres_representante, apellidos_representante')
        .eq('cedula_representante', cedLimpia)
        .limit(1)
        .maybeSingle();

      // 3. Buscar en solicitud_cupos por si tiene email o teléfono previo
      const { data: solPrevia } = await supabase
        .from('solicitud_cupos')
        .select('representante_nombres, representante_apellidos, representante_telefono, representante_email')
        .eq('representante_cedula', cedLimpia)
        .limit(1)
        .maybeSingle();

      if (usuario || vinculo || solPrevia) {
        const nombreCompleto = usuario?.nombre_completo || '';
        let nombres = vinculo?.nombres_representante || solPrevia?.representante_nombres || '';
        let apellidos = vinculo?.apellidos_representante || solPrevia?.representante_apellidos || '';

        if (!nombres && nombreCompleto) {
          const partes = nombreCompleto.trim().split(/\s+/);
          if (partes.length === 1) {
            nombres = partes[0];
          } else if (partes.length === 2) {
            nombres = partes[0];
            apellidos = partes[1];
          } else {
            nombres = partes.slice(0, 2).join(' ');
            apellidos = partes.slice(2).join(' ');
          }
        }

        setFormRegistroDirecto(prev => ({
          ...prev,
          representante_nombres: prev.representante_nombres || nombres,
          representante_apellidos: prev.representante_apellidos || apellidos,
          representante_telefono: prev.representante_telefono || usuario?.telefono || solPrevia?.representante_telefono || '',
          representante_email: prev.representante_email || usuario?.email || solPrevia?.representante_email || ''
        }));

        setRepDirectoExistente({
          existe: true,
          nombre_completo: nombreCompleto || `${nombres} ${apellidos}`.trim(),
          rol: usuario?.rol || 'Representante'
        });
      } else {
        setRepDirectoExistente({ existe: false });
      }
    } catch (err) {
      console.warn('Error buscando representante directo:', err);
      setRepDirectoExistente(null);
    } finally {
      setBuscandoRepDirecto(false);
    }
  };

  const handleGuardarRegistroDirecto = async () => {
    const cedRep = cleanCedula(formRegistroDirecto.representante_cedula);
    const nomRep = capitalizarPalabras(formRegistroDirecto.representante_nombres.trim());
    const apeRep = capitalizarPalabras(formRegistroDirecto.representante_apellidos.trim());
    const telRep = formRegistroDirecto.representante_telefono.trim();
    const emailRep = formRegistroDirecto.representante_email.trim();
    const parentesco = formRegistroDirecto.parentesco || 'Hijo(a)';

    const nomEst = capitalizarPalabras(formRegistroDirecto.estudiante_nombres.trim());
    const apeEst = capitalizarPalabras(formRegistroDirecto.estudiante_apellidos.trim());
    const escEst = formRegistroDirecto.codigo_escuela || 'sb';
    const gradoEst = formRegistroDirecto.grado_solicitado || '1er Grado';
    const seccionEst = (!formRegistroDirecto.seccion || formRegistroDirecto.seccion === 'Sin Asignar') ? 'Sin Asignar' : formRegistroDirecto.seccion;
    const sexoEst = formRegistroDirecto.estudiante_sexo || 'M';
    const fNacEst = formRegistroDirecto.estudiante_fecha_nacimiento || '2015-01-01';

    // Validaciones
    if (!cedRep) {
      if (Swal) Swal.fire('Cédula Requerida', 'Debe ingresar la cédula del representante legal.', 'warning');
      return;
    }
    if (!nomRep || !apeRep) {
      if (Swal) Swal.fire('Datos Requeridos', 'Indique nombres y apellidos del representante legal.', 'warning');
      return;
    }
    if (!nomEst || !apeEst) {
      if (Swal) Swal.fire('Datos Requeridos', 'Indique nombres y apellidos del estudiante aspirante.', 'warning');
      return;
    }
    if (!gradoEst) {
      if (Swal) Swal.fire('Grado Requerido', 'Seleccione el grado a cursar del estudiante.', 'warning');
      return;
    }

    setGuardandoRegistroDirecto(true);

    try {
      const codUnico = generarCodigoUnicoAdmision(escEst);
      const anioCorto = new Date().getFullYear().toString().slice(-2);
      const escUpper = (escEst || 'sb').toUpperCase().slice(0, 2);
      const randomNum = Math.floor(10000000 + Math.random() * 90000000);
      const cedulaEscolarAuto = `ESC-${escUpper}${anioCorto}-${randomNum}`; // 17 caracteres (ej: ESC-SB26-48291048)

      const cedEstLimpia = cleanCedula(formRegistroDirecto.estudiante_cedula);
      const cedEst = sinCedulaEstudianteDirecto || !cedEstLimpia
        ? cedulaEscolarAuto
        : cedEstLimpia.slice(0, 20);
      const nomCompletoRep = `${nomRep} ${apeRep}`.trim();
      const nomCompletoEst = `${nomEst} ${apeEst}`.trim();
      const estadoFinal = formRegistroDirecto.estado_ingreso;

      // 1. Asegurar o crear Usuario en `usuarios`
      const { data: userExiste } = await supabase
        .from('usuarios')
        .select('cedula, rol, id_escuela, email, telefono')
        .eq('cedula', cedRep)
        .maybeSingle();

      // Generar email válido por defecto si no fue provisto (evita violar restricción NOT NULL en solicitud_cupos)
      const finalEmailRep = emailRep || (userExiste?.email || '').trim() || `rep.${cleanCedula(cedRep)}@sigae.local`;

      if (!userExiste) {
        const { error: errUser } = await supabase.from('usuarios').insert([{
          cedula: cedRep,
          nombre_completo: nomCompletoRep,
          rol: 'Representante',
          id_escuela: escEst,
          email: finalEmailRep,
          telefono: telRep || null,
          estado: 'Activo',
          primer_ingreso: true,
          clave: null,
          solicito_reseteo: false
        }]);
        if (errUser) console.warn('Nota creando usuario representante:', errUser.message);
      } else if (userExiste.id_escuela && userExiste.id_escuela !== escEst && userExiste.id_escuela !== 'ambas') {
        await supabase.from('usuarios').update({ id_escuela: 'ambas' }).eq('cedula', cedRep);
      }

      // 2. Insertar en `solicitud_cupos`
      const obsTexto = `Admisión Directa Extemporánea - ${new Date().toLocaleDateString('es-VE')} por ${user?.nombre_completo || user?.cedula || 'Dirección'}${formRegistroDirecto.observaciones ? ' - ' + formRegistroDirecto.observaciones.trim() : ''}`;
      const obsDirecto = estructurarObservaciones(
        obsTexto,
        'Apto',
        true,
        user?.nombre_completo || user?.cedula || 'Dirección',
        1
      );

      const payloadSolicitud: any = {
        codigo_unico: codUnico,
        codigo_escuela: escEst,
        grado_solicitado: gradoEst,
        estudiante_nombres: nomEst,
        estudiante_apellidos: apeEst,
        estudiante_cedula: cedEst,
        estudiante_sexo: sexoEst,
        estudiante_fecha_nacimiento: fNacEst,
        plantel_procedencia: formRegistroDirecto.plantel_procedencia?.trim() || 'Ingreso Extemporáneo Directo',
        representante_cedula: cedRep,
        representante_nombres: nomRep,
        representante_apellidos: apeRep,
        representante_telefono: telRep || null,
        representante_email: finalEmailRep,
        parentesco: parentesco,
        representante_parentesco: parentesco,
        representante_trabaja_pdvsa: formRegistroDirecto.trabaja_pdvsa ? 'Sí' : 'No',
        pdvsa_condicion_laboral: formRegistroDirecto.trabaja_pdvsa ? formRegistroDirecto.pdvsa_condicion_laboral || null : null,
        pdvsa_tipo_nomina: formRegistroDirecto.trabaja_pdvsa ? formRegistroDirecto.pdvsa_tipo_nomina || null : null,
        requiere_transporte: false,
        ruta_transporte: '',
        estado: estadoFinal,
        observaciones: obsDirecto,
        creado_por: (user?.cedula || 'Dirección').slice(0, 20)
      };

      const { data: solInsertada, error: errSol } = await supabase
        .from('solicitud_cupos')
        .insert([payloadSolicitud])
        .select()
        .single();

      if (errSol) throw errSol;

      // 3. Si es 'Formalizado', insertar/upsert en `estudiantes_vinculaciones`
      if (estadoFinal === 'Formalizado') {
        const datosActPayload = {
          ...payloadSolicitud,
          id: solInsertada?.id,
          seccion_actual: seccionEst,
          origen_admision: 'nuevo_ingreso',
          formalizado_en_fisico: true,
          requiere_transporte: false
        };

        const payloadVincRow = {
          cedula_representante: cedRep,
          nombres_representante: nomRep,
          apellidos_representante: apeRep,
          cedula_estudiante: cedEst,
          nombres_estudiante: nomEst,
          apellidos_estudiante: apeEst,
          grado_actual: gradoEst,
          seccion_actual: seccionEst,
          codigo_escuela: escEst,
          estado: 'Activo',
          datos_actualizados: datosActPayload,
          creado_por: `Admisión Directa - ${user?.nombre_completo || user?.cedula || 'SIGAE'}`
        };

        const { error: errVinc } = await supabase
          .from('estudiantes_vinculaciones')
          .upsert([payloadVincRow], { onConflict: 'cedula_estudiante' });

        if (errVinc) throw errVinc;
      }

      // 4. Auditar acción
      await auditar(
        'Gestión de Admisiones',
        'Admisión Directa Registrada',
        `Estudiante ${nomCompletoEst} (C.I. ${cedEst}) admitido como ${estadoFinal} en ${gradoEst} (${escEst.toUpperCase()}) por ${user?.nombre_completo || user?.cedula}`
      );

      // 5. Refrescar datos en memoria y capacidad escolar
      await cargarSolicitudes();
      await cargarCapacidadEscolar();

      setModalRegistroDirectoAbierto(false);

      // 6. Notificación exitosa
      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: estadoFinal === 'Formalizado' ? '¡Estudiante Admitido y Matriculado!' : '¡Aspirante Admitido con Éxito!',
          html: `
            <div class="text-start small">
              <div class="p-2.5 mb-2 bg-light rounded border">
                <p class="mb-1">📋 <b>Código de Admisión:</b> <code class="text-primary fw-bold">${codUnico}</code></p>
                <p class="mb-1">🎓 <b>Estudiante:</b> ${nomCompletoEst} (C.I./Esc: <b>${cedEst}</b>)</p>
                <p class="mb-1">🏫 <b>Plantel:</b> ${escEst.toUpperCase() === 'SB' ? 'U.E. Simón Bolívar' : 'Liceo Bolivariano'} • ${gradoEst} ${estadoFinal === 'Formalizado' ? `Sección "${seccionEst}"` : ''}</p>
                <p class="mb-0">👤 <b>Representante:</b> ${nomCompletoRep} (C.I. <b>${cedRep}</b>) • ${parentesco}</p>
              </div>
              <p class="mb-1">🔑 <b>Acceso Representante SIGAE:</b> Cédula <code>${cedRep}</code> (Primer ingreso activo).</p>
              <p class="text-success mb-0 fw-bold">${estadoFinal === 'Formalizado' ? '✅ Cupo formalizado y contabilizado en la matrícula del plantel.' : '🕒 Registrado como "Aprobado", listo para formalizar presencialmente en taquilla.'}</p>
            </div>
          `,
          showCancelButton: estadoFinal === 'Formalizado',
          confirmButtonText: estadoFinal === 'Formalizado' ? 'Ver Constancia' : 'Aceptar',
          cancelButtonText: 'Cerrar'
        }).then((result: any) => {
          if (result.isConfirmed && estadoFinal === 'Formalizado' && solInsertada) {
            setSolicitudConstancia(solInsertada);
            setModalConstanciaAbierto(true);
          }
        });
      }

    } catch (err: any) {
      console.error('Error al registrar admisión directa:', err);
      if (Swal) {
        Swal.fire({
          icon: 'error',
          title: 'Error al Registrar Admisión',
          text: err?.message || 'Ocurrió un error inesperado al procesar la admisión directa.'
        });
      }
    } finally {
      setGuardandoRegistroDirecto(false);
    }
  };

  const gradosDisponiblesDirecto = useMemo(() => {
    const esc = (formRegistroDirecto.codigo_escuela || 'sb').toLowerCase().trim();
    const gradosEnSalones = salonesBD
      .filter(s => (s.id_escuela || '').toLowerCase().trim() === esc && (s.estatus || 'Activo').toLowerCase() === 'activo')
      .map(s => s.grado_anio)
      .filter(Boolean);

    if (esc === 'lb') {
      const listaLb = ['1er Año', '2do Año', '3er Año', '4to Año', '5to Año'];
      const extra = opcionesGradoEnriquecidos.filter(g => g.toLowerCase().includes('año'));
      return Array.from(new Set([...listaLb, ...extra, ...gradosEnSalones]));
    } else {
      const listaSb = [
        'Maternal',
        '1er Grupo',
        '2do Grupo',
        '3er Grupo',
        '1er Grado',
        '2do Grado',
        '3er Grado',
        '4to Grado',
        '5to Grado',
        '6to Grado'
      ];
      const extra = opcionesGradoEnriquecidos.filter(g => !g.toLowerCase().includes('año'));
      return Array.from(new Set([...listaSb, ...extra, ...gradosEnSalones]));
    }
  }, [formRegistroDirecto.codigo_escuela, opcionesGradoEnriquecidos, salonesBD]);

  const seccionesDisponiblesDirecto = useMemo(() => {
    const esc = (formRegistroDirecto.codigo_escuela || 'sb').toLowerCase().trim();
    const gradoNorm = normalizarGrado(formRegistroDirecto.grado_solicitado);

    // Salones configurados en la base de datos para esta escuela y grado
    const salonesCoincidentes = salonesBD.filter(s => {
      const matchEsc = (s.id_escuela || '').toLowerCase().trim() === esc;
      const matchGrd = normalizarGrado(s.grado_anio) === gradoNorm;
      const estatus = (s.estatus || 'Activo').toLowerCase().trim();
      return matchEsc && matchGrd && estatus === 'activo';
    });

    const secciones = Array.from(
      new Set(
        salonesCoincidentes
          .map(s => (s.seccion || s.nombre_salon || '').trim().toUpperCase())
          .filter(Boolean)
      )
    ).sort();

    return secciones;
  }, [formRegistroDirecto.codigo_escuela, formRegistroDirecto.grado_solicitado, salonesBD]);

  // ── LÓGICA: HABILITACIÓN DE ACCESO DE REPRESENTANTE Y ESTUDIANTE (UNO A UNO) ────
  const abrirModalHabilitarAcceso = async (sol: SolicitudAdmision) => {
    setSolicitudHabilitar(sol);
    const cedulaLimpiaRep = cleanCedula(sol.representante_cedula);
    const cedulaLimpiaEst = cleanCedula(sol.estudiante_cedula);

    setFormHabilitar({
      representante_cedula: cedulaLimpiaRep || (sol.representante_cedula || '').trim(),
      representante_nombres: (sol.representante_nombres || '').trim(),
      representante_apellidos: (sol.representante_apellidos || '').trim(),
      representante_telefono: (sol.representante_telefono || sol.representante_telefono2 || '').trim(),
      representante_email: (sol.representante_email || '').trim(),
      estudiante_cedula: cedulaLimpiaEst || (sol.estudiante_cedula || '').trim(),
      estudiante_nombres: (sol.estudiante_nombres || '').trim(),
      estudiante_apellidos: (sol.estudiante_apellidos || '').trim(),
      grado_solicitado: sol.grado_solicitado || '1er Grado',
      codigo_escuela: sol.codigo_escuela || 'sb'
    });

    setModalHabilitarAccesoAbierto(true);

    // Verificar en la BD si el usuario ya existe
    if (cedulaLimpiaRep) {
      setVerificandoCedulaRep(true);
      try {
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('cedula, nombre_completo, rol, id_escuela')
          .eq('cedula', cedulaLimpiaRep)
          .maybeSingle();

        if (usuario) {
          setRepExistenteInfo({
            existe: true,
            nombre_completo: usuario.nombre_completo,
            rol: usuario.rol,
            id_escuela: usuario.id_escuela
          });
        } else {
          setRepExistenteInfo({ existe: false });
        }
      } catch (err) {
        console.warn('Error verificando usuario existente:', err);
        setRepExistenteInfo(null);
      } finally {
        setVerificandoCedulaRep(false);
      }
    } else {
      setRepExistenteInfo(null);
    }
  };

  const verificarCedulaRepEnVivo = async (cedula: string) => {
    const cedLimpia = cleanCedula(cedula);
    if (!cedLimpia || cedLimpia.length < 5) {
      setRepExistenteInfo(null);
      return;
    }
    setVerificandoCedulaRep(true);
    try {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('cedula, nombre_completo, rol, id_escuela')
        .eq('cedula', cedLimpia)
        .maybeSingle();

      if (usuario) {
        setRepExistenteInfo({
          existe: true,
          nombre_completo: usuario.nombre_completo,
          rol: usuario.rol,
          id_escuela: usuario.id_escuela
        });
      } else {
        setRepExistenteInfo({ existe: false });
      }
    } catch (e) {
      console.warn('Error en verificación en vivo:', e);
    } finally {
      setVerificandoCedulaRep(false);
    }
  };

  const ejecutarHabilitacionAcceso = async () => {
    if (!solicitudHabilitar) return;

    const cedRep = cleanCedula(formHabilitar.representante_cedula);
    const nomRep = formHabilitar.representante_nombres.trim();
    const apeRep = formHabilitar.representante_apellidos.trim();

    const cedEst = cleanCedula(formHabilitar.estudiante_cedula) || `T-${solicitudHabilitar.codigo_unico}`;
    const nomEst = formHabilitar.estudiante_nombres.trim();
    const apeEst = formHabilitar.estudiante_apellidos.trim();

    if (!cedRep) {
      if (Swal) Swal.fire('Cédula Requerida', 'La cédula del representante no puede estar vacía.', 'warning');
      return;
    }
    if (!nomRep || !apeRep) {
      if (Swal) Swal.fire('Nombres Requeridos', 'Indica nombres y apellidos completos del representante.', 'warning');
      return;
    }
    if (!nomEst || !apeEst) {
      if (Swal) Swal.fire('Datos de Aspirante Requeridos', 'Indica nombres y apellidos del estudiante.', 'warning');
      return;
    }

    setProcesandoHabilitacion(true);
    try {
      // 1. Consultar si el usuario ya existe en `usuarios`
      const { data: usuarioExistente } = await supabase
        .from('usuarios')
        .select('cedula, rol, id_escuela, nombre_completo')
        .eq('cedula', cedRep)
        .maybeSingle();

      let usuarioCreadoNuevo = false;

      if (!usuarioExistente) {
        // CREAR USUARIO NUEVO SIN CONTRASEÑA PREVIA (primer_ingreso: true, clave: null)
        const { error: errCrearUsuario } = await supabase
          .from('usuarios')
          .insert([{
            cedula: cedRep,
            nombre_completo: `${nomRep} ${apeRep}`,
            rol: 'Representante',
            id_escuela: formHabilitar.codigo_escuela,
            email: formHabilitar.representante_email?.trim() || null,
            telefono: formHabilitar.representante_telefono?.trim() || null,
            estado: 'Activo',
            primer_ingreso: true,
            clave: null, // NO lleva contraseña: la crea en su primer inicio
            solicito_reseteo: false
          }]);

        if (errCrearUsuario) throw errCrearUsuario;
        usuarioCreadoNuevo = true;
      } else {
        // USUARIO EXISTENTE: NO MODIFICAR CLAVE, PREGUNTAS NI ROL
        // Únicamente si pertenece a otra escuela, ampliar id_escuela a 'ambas'
        if (usuarioExistente.id_escuela && usuarioExistente.id_escuela !== formHabilitar.codigo_escuela && usuarioExistente.id_escuela !== 'ambas') {
          await supabase.from('usuarios').update({ id_escuela: 'ambas' }).eq('cedula', cedRep);
        }
      }

      // 2. Vincular al Estudiante en `estudiantes_vinculaciones`
      // La constancia permanece bloqueada en datos_actualizados (formalizado_en_fisico: false)
      const { error: errVinculo } = await supabase
        .from('estudiantes_vinculaciones')
        .upsert([{
          cedula_representante: cedRep,
          nombres_representante: nomRep,
          apellidos_representante: apeRep,
          cedula_estudiante: cedEst,
          nombres_estudiante: nomEst,
          apellidos_estudiante: apeEst,
          grado_actual: formHabilitar.grado_solicitado,
          seccion_actual: 'A',
          codigo_escuela: formHabilitar.codigo_escuela,
          estado: 'Activo',
          datos_actualizados: {
            ...(solicitudHabilitar.datos_actualizados || {}),
            ...solicitudHabilitar,
            representante_cedula: cedRep,
            representante_nombres: nomRep,
            representante_apellidos: apeRep,
            representante_telefono: formHabilitar.representante_telefono?.trim() || '',
            representante_email: formHabilitar.representante_email?.trim() || '',
            estudiante_cedula: cedEst,
            estudiante_nombres: nomEst,
            estudiante_apellidos: apeEst,
            grado_solicitado: formHabilitar.grado_solicitado,
            codigo_escuela: formHabilitar.codigo_escuela,
            origen_admision: 'nuevo_ingreso',
            formalizado_en_fisico: false // Bloquea la constancia de inscripción hasta que se formalice en físico
          },
          creado_por: 'Admisiones SIGAE - Alta de Representante'
        }], { onConflict: 'cedula_estudiante' });

      if (errVinculo) throw errVinculo;

      // 3. Sincronizar cambios en `solicitud_cupos` en caso de correcciones
      const obsRegistro = `[Acceso Habilitado en SIGAE el ${new Date().toLocaleDateString('es-VE')}]`;
      const nuevasObservaciones = solicitudHabilitar.observaciones
        ? (solicitudHabilitar.observaciones.includes('[Acceso Habilitado en SIGAE')
            ? solicitudHabilitar.observaciones
            : `${solicitudHabilitar.observaciones} | ${obsRegistro}`)
        : obsRegistro;

      await supabase
        .from('solicitud_cupos')
        .update({
          representante_cedula: cedRep,
          representante_nombres: nomRep,
          representante_apellidos: apeRep,
          representante_telefono: formHabilitar.representante_telefono?.trim() || null,
          representante_email: formHabilitar.representante_email?.trim() || `rep.${cleanCedula(cedRep)}@sigae.local`,
          estudiante_cedula: cleanCedula(formHabilitar.estudiante_cedula) || null,
          estudiante_nombres: nomEst,
          estudiante_apellidos: apeEst,
          grado_solicitado: formHabilitar.grado_solicitado,
          codigo_escuela: formHabilitar.codigo_escuela,
          observaciones: nuevasObservaciones
        })
        .eq('id', solicitudHabilitar.id);

      // 4. Auditar acción
      await auditar(
        'Gestión de Admisiones',
        'Habilitar Acceso SIGAE',
        `Acceso habilitado para Rep. ${nomRep} ${apeRep} (C.I. ${cedRep}) con estudiante ${nomEst} ${apeEst} (${formHabilitar.grado_solicitado})`
      );

      // 5. Actualizar estado en memoria local
      const solActualizada: SolicitudAdmision = {
        ...solicitudHabilitar,
        representante_cedula: cedRep,
        representante_nombres: nomRep,
        representante_apellidos: apeRep,
        representante_telefono: formHabilitar.representante_telefono?.trim() || '',
        representante_email: formHabilitar.representante_email?.trim() || '',
        estudiante_cedula: cleanCedula(formHabilitar.estudiante_cedula) || '',
        estudiante_nombres: nomEst,
        estudiante_apellidos: apeEst,
        grado_solicitado: formHabilitar.grado_solicitado,
        codigo_escuela: formHabilitar.codigo_escuela,
        observaciones: nuevasObservaciones,
        acceso_habilitado: true,
        acceso_fecha: new Date().toLocaleDateString('es-VE')
      };

      setSolicitudes(prev => prev.map(s => (s.id === solicitudHabilitar.id ? solActualizada : s)));
      await cargarCapacidadEscolar(); // Sincronizar vinculaciones en memoria inmediatamente
      setModalHabilitarAccesoAbierto(false);

      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: usuarioCreadoNuevo ? '¡Usuario Creado y Vinculado!' : '¡Estudiante Vinculado a Usuario Existente!',
          html: `
            <div class="text-start small">
              <p>👤 <b>Representante:</b> ${nomRep} ${apeRep} (C.I. <code>${cedRep}</code>)</p>
              <p>🎓 <b>Estudiante:</b> ${nomEst} ${apeEst} (Grado: <b>${formHabilitar.grado_solicitado}</b>)</p>
              ${usuarioCreadoNuevo ? `
                <div class="alert alert-primary p-2.5 rounded-3 mb-2">
                  <i class="bi bi-shield-lock-fill me-1"></i> <b>Nuevo Usuario SIGAE:</b><br/>
                  El representante ingresará con su C.I. <code>${cedRep}</code>. En su primer inicio definirá su propia clave y preguntas de seguridad.
                </div>
              ` : `
                <div class="alert alert-success p-2.5 rounded-3 mb-2">
                  <i class="bi bi-person-check-fill me-1"></i> <b>Usuario ya registrado:</b><br/>
                  Sus credenciales y claves no sufrieron modificaciones. El estudiante ya está visible en su portal.
                </div>
              `}
              <div class="alert alert-warning p-2.5 rounded-3 mb-0">
                <i class="bi bi-lock-fill me-1"></i> <b>Constancia de Inscripción:</b><br/>
                Permanecerá bloqueada en el portal del representante con candado oficial hasta la formalización presencial en la institución.
              </div>
            </div>
          `,
          confirmButtonText: 'Entendido'
        });
      }
    } catch (err: any) {
      console.error('Error al habilitar acceso:', err);
      if (Swal) {
        Swal.fire('Error', 'No se pudo habilitar el acceso: ' + (err.message || 'Error desconocido'), 'error');
      }
    } finally {
      setProcesandoHabilitacion(false);
    }
  };

  // ── LÓGICA: HABILITACIÓN MASIVA DE ACCESO SIGAE (SELECCIÓN MÚLTIPLE) ───────
  const abrirModalHabilitarMasivo = () => {
    // Por defecto seleccionar todos los aspirantes aprobados o formalizados pendientes de acceso
    const pendientes = solicitudes.filter(s => {
      const esAprobado = s.estado === 'Aprobado' || s.estado === 'Formalizado';
      if (!esAprobado) return false;
      const acc = verificarAccesoHabilitado(s, estudiantesMatriculaBD);
      return !acc.habilitado;
    });

    const idsPendientes = new Set<string | number>();
    pendientes.forEach(s => { if (s.id) idsPendientes.add(s.id); });
    setSeleccionadosHabilitarMasivo(idsPendientes);
    setFiltroEscuelaHabilitarMasivo('todas');
    setFiltroGradoHabilitarMasivo('todos');
    setFiltroEstadoAccesoMasivo('pendientes');
    setModalHabilitarMasivoAbierto(true);
  };

  const toggleSeleccionHabilitarMasivo = (id: string | number) => {
    setSeleccionadosHabilitarMasivo(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const ejecutarHabilitacionMasiva = async () => {
    if (seleccionadosHabilitarMasivo.size === 0) {
      if (Swal) Swal.fire('Sin Selecciones', 'Por favor selecciona al menos un aspirante en la lista para habilitar su acceso.', 'warning');
      return;
    }

    const solParaProcesar = solicitudes.filter(s => seleccionadosHabilitarMasivo.has(s.id));
    if (solParaProcesar.length === 0) return;

    setProcesandoHabilitacionMasiva(true);
    setProgresoHabilitacionMasiva({
      actual: 0,
      total: solParaProcesar.length,
      nombreEstudiante: 'Iniciando verificación en el servidor...',
      creadosNuevos: 0,
      vinculadosExistentes: 0,
      completado: false
    });
    let creadosNuevos = 0;
    let vinculadosExistentes = 0;
    let errores = 0;
    const fechaHora = new Date().toLocaleDateString('es-VE');

    try {
      const cedulasReps = Array.from(new Set(solParaProcesar.map(s => cleanCedula(s.representante_cedula)).filter(Boolean)));
      const { data: usuariosExistentesBD } = await supabase
        .from('usuarios')
        .select('cedula, rol, id_escuela, nombre_completo')
        .in('cedula', cedulasReps);

      const mapUsuarios = new Map<string, any>();
      (usuariosExistentesBD || []).forEach((u: any) => {
        mapUsuarios.set(cleanCedula(u.cedula), u);
      });

      const solActualizadasList: SolicitudAdmision[] = [];

      for (let i = 0; i < solParaProcesar.length; i++) {
        const sol = solParaProcesar[i];
        const nomCompletoEst = nombreCompleto(sol.estudiante_nombres, sol.estudiante_apellidos);
        setProgresoHabilitacionMasiva({
          actual: i + 1,
          total: solParaProcesar.length,
          nombreEstudiante: nomCompletoEst,
          creadosNuevos,
          vinculadosExistentes,
          completado: false
        });

        // Pequeño retardo de 75ms para animación visual fluida del porcentaje
        await new Promise(r => setTimeout(r, 75));

        try {
          const cedRep = cleanCedula(sol.representante_cedula);
          const nomRep = (sol.representante_nombres || '').trim();
          const apeRep = (sol.representante_apellidos || '').trim();
          const cedEst = cleanCedula(sol.estudiante_cedula) || `T-${sol.codigo_unico}`;
          const nomEst = (sol.estudiante_nombres || '').trim();
          const apeEst = (sol.estudiante_apellidos || '').trim();

          if (!cedRep) {
            errores++;
            continue;
          }

          const usuarioExistente = mapUsuarios.get(cedRep);

          if (!usuarioExistente) {
            // Usuario nuevo: sin contraseña previa (primer_ingreso = true, clave = null)
            const { error: errInsertUser } = await supabase
              .from('usuarios')
              .insert([{
                cedula: cedRep,
                nombre_completo: `${nomRep} ${apeRep}`.trim() || 'Representante',
                rol: 'Representante',
                id_escuela: sol.codigo_escuela || 'sb',
                email: sol.representante_email?.trim() || null,
                telefono: sol.representante_telefono?.trim() || null,
                estado: 'Activo',
                primer_ingreso: true,
                clave: null,
                solicito_reseteo: false
              }]);

            if (!errInsertUser) {
              creadosNuevos++;
              mapUsuarios.set(cedRep, { cedula: cedRep, rol: 'Representante', id_escuela: sol.codigo_escuela });
            } else {
              vinculadosExistentes++;
            }
          } else {
            vinculadosExistentes++;
            if (usuarioExistente.id_escuela && usuarioExistente.id_escuela !== sol.codigo_escuela && usuarioExistente.id_escuela !== 'ambas') {
              await supabase.from('usuarios').update({ id_escuela: 'ambas' }).eq('cedula', cedRep);
            }
          }

          // Vincular en estudiantes_vinculaciones
          const { error: errVinculo } = await supabase
            .from('estudiantes_vinculaciones')
            .upsert([{
              cedula_representante: cedRep,
              nombres_representante: nomRep,
              apellidos_representante: apeRep,
              cedula_estudiante: cedEst,
              nombres_estudiante: nomEst,
              apellidos_estudiante: apeEst,
              grado_actual: sol.grado_solicitado || '1er Grado',
              seccion_actual: 'A',
              codigo_escuela: sol.codigo_escuela || 'sb',
              estado: 'Activo',
              datos_actualizados: {
                ...(sol.datos_actualizados || {}),
                ...sol,
                representante_cedula: cedRep,
                representante_nombres: nomRep,
                representante_apellidos: apeRep,
                estudiante_cedula: cedEst,
                estudiante_nombres: nomEst,
                estudiante_apellidos: apeEst,
                grado_solicitado: sol.grado_solicitado,
                codigo_escuela: sol.codigo_escuela,
                origen_admision: 'nuevo_ingreso',
                formalizado_en_fisico: false
              },
              creado_por: 'Admisiones SIGAE - Habilitación Masiva'
            }], { onConflict: 'cedula_estudiante' });

          if (errVinculo) {
            console.error('Error en vinculo masivo:', errVinculo);
            errores++;
            continue;
          }

          // Actualizar observaciones en solicitud_cupos
          const obsRegistro = `[Acceso Habilitado en SIGAE el ${fechaHora}]`;
          const obsNuevas = sol.observaciones
            ? (sol.observaciones.includes('[Acceso Habilitado en SIGAE')
                ? sol.observaciones
                : `${sol.observaciones} | ${obsRegistro}`)
            : obsRegistro;

          await supabase
            .from('solicitud_cupos')
            .update({ observaciones: obsNuevas })
            .eq('id', sol.id);

          solActualizadasList.push({
            ...sol,
            observaciones: obsNuevas,
            acceso_habilitado: true,
            acceso_fecha: fechaHora
          });
        } catch (eSol) {
          console.error('Error procesando aspirante:', eSol);
          errores++;
        }
      }

      await auditar(
        'Gestión de Admisiones',
        'Habilitación Masiva de Accesos SIGAE',
        `Se procesó habilitación masiva de ${solActualizadasList.length} aspirantes (${creadosNuevos} nuevos usuarios, ${vinculadosExistentes} vinculaciones existentes)`
      );

      const actualizadosMap = new Map(solActualizadasList.map(s => [s.id, s]));
      setSolicitudes(prev => prev.map(s => actualizadosMap.get(s.id) || s));

      await cargarCapacidadEscolar();
      
      setProgresoHabilitacionMasiva({
        actual: solParaProcesar.length,
        total: solParaProcesar.length,
        nombreEstudiante: '¡Todos los registros procesados con éxito!',
        creadosNuevos,
        vinculadosExistentes,
        completado: true
      });
      setProcesandoHabilitacionMasiva(false);

      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Habilitación Masiva Completada al 100%!',
          html: `
            <div class="text-start small">
              <p class="mb-1">✅ <b>Aspirantes Procesados con Éxito:</b> ${solActualizadasList.length}</p>
              <p class="mb-1">👤 <b>Nuevos Usuarios Creados:</b> ${creadosNuevos} (sin contraseña previa)</p>
              <p class="mb-1">🔗 <b>Vinculados a Usuarios Ya Existentes:</b> ${vinculadosExistentes} (claves intactas)</p>
              ${errores > 0 ? `<p class="mb-1 text-danger">⚠️ <b>Errores / Omitidos:</b> ${errores}</p>` : ''}
              <div class="alert alert-warning p-2.5 rounded-3 mt-2 mb-0">
                <i class="bi bi-lock-fill me-1"></i> <b>Constancias de Inscripción:</b><br/>
                Permanecen bloqueadas con candado en el portal del representante hasta la formalización presencial.
              </div>
            </div>
          `,
          confirmButtonText: 'Entendido'
        });
      }
    } catch (err: any) {
      console.error('Error general en habilitación masiva:', err);
      if (Swal) Swal.fire('Error', 'Ocurrió un error en el proceso masivo: ' + (err.message || 'Error desconocido'), 'error');
    } finally {
      setProcesandoHabilitacionMasiva(false);
      setProgresoHabilitacionMasiva(null);
    }
  };

  // ── LÓGICA: DIFUSIÓN MASIVA WHATSAPP PARA CUPOS APROBADOS ───────────────────
  const PLANTILLA_WHATSAPP_DIFUSION_DEFAULT = `*Comunicado oficial • Comité de admisiones*
*{ESCUELA}*
_Sistema Integral de Gestión y Administración Escolar (SIGAE)_

Estimado(a) Representante: *{REPRESENTANTE}* (C.I. *{CEDULA_REP}*)

En seguimiento a la confirmación de asignación y aceptación de cupo para su representado(a) *{ESTUDIANTE}* en el nivel *{GRADO}*, le hacemos llegar las *orientaciones oficiales y la guía paso a paso* para la actualización de datos y formalización de su inscripción:

*1️⃣ Paso 1: Ingreso al sistema y creación de contraseña*
• Ingrese desde su teléfono o computadora a nuestro portal web:
🌐 *https://sigaelbsb.vercel.app/*
• En la casilla *Usuario*, ingrese su número de cédula de identidad: *{CEDULA_REP}* (sin puntos ni letras).
• *Primer ingreso:* Si es su primera vez en el sistema, cree su contraseña segura y configure sus preguntas de seguridad personalizadas. Si ya posee cuenta en SIGAE, ingrese con su clave habitual.

*2️⃣ Paso 2: Gestión estudiantil y actualización de ficha*
• Ingrese al módulo de *Gestión Estudiantil* (o Mis Representados).
• Seleccione al estudiante y proceda a actualizar y completar detalladamente la *Ficha del Estudiante*.

*3️⃣ Paso 3: Descarga de recaudos digitales*
• Al finalizar la actualización de la ficha, descargue los siguientes tres (3) documentos obligatorios:
   📄 *Hoja de Resumen de Admisión*
   📜 *Carta de Aceptación Oficial*
   📑 *Normas Internas de Convivencia Escolar*

*4️⃣ Paso 4: Impresión y recaudos físicos en carpeta*
• Imprima los documentos descargados en el Paso 3.
• Arme una carpeta de manila adjuntando dichos recaudos impresos conjuntamente con todos los recaudos físicos requeridos en el documento de la Carta de Aceptación.

*5️⃣ Paso 5: Convocatoria presencial en la escuela*
• Asista a la escuela en las fechas y horarios de la convocatoria oficial para la revisión y validación de la documentación física ante Control de Estudios.

*6️⃣ Paso 6: Constancia de inscripción (12 horas)*
• En un lapso de doce (12) horas posteriores a la verificación presencial de sus documentos, ingrese nuevamente al sistema SIGAE y descargue su *Constancia de Inscripción Definitiva*.

*¡Bienvenidos a la {ESCUELA}!*
Para dudas o asistencia técnica, comuníquese con los canales autorizados de la institución.`;

  const abrirModalDifusion = () => {
    if (!mensajePlantillaDifusion) {
      setMensajePlantillaDifusion(PLANTILLA_WHATSAPP_DIFUSION_DEFAULT);
    }
    setFiltroEscuelaDifusion(filtroEscuela !== 'todas' ? filtroEscuela : 'todas');
    setFiltroGradoDifusion(filtroGrado !== 'todos' ? filtroGrado : 'todos');
    setFiltroEstadoEnvioDifusion('todos');
    setAspiranteActivoDifusionIdx(0);
    setModalDifusionAbierto(true);
  };

  const generarMensajeDifusionWhatsApp = (sol: SolicitudAdmision, plantillaPersonalizada?: string): string => {
    const template = plantillaPersonalizada || mensajePlantillaDifusion || PLANTILLA_WHATSAPP_DIFUSION_DEFAULT;
    const escNom = sol.codigo_escuela === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar';
    const nomRep = nombreCompleto(sol.representante_nombres, sol.representante_apellidos);
    const nomEst = nombreCompleto(sol.estudiante_nombres, sol.estudiante_apellidos);
    const cedRep = cleanCedula(sol.representante_cedula);
    const grd = sol.grado_solicitado || 'Grado Asignado';

    return template
      .replace(/{ESCUELA}/g, escNom)
      .replace(/{REPRESENTANTE}/g, nomRep)
      .replace(/{ESTUDIANTE}/g, nomEst)
      .replace(/{CEDULA_REP}/g, cedRep)
      .replace(/{GRADO}/g, grd)
      .replace(/{CODIGO}/g, sol.codigo_unico || '');
  };

  const enviarWhatsAppIndividualDifusion = async (sol: SolicitudAdmision, numDirecto?: string) => {
    const telefono = numDirecto || sol.representante_telefono || sol.representante_telefono2 || '';
    const telLimpio = cleanCedula(telefono);

    if (!telLimpio || telLimpio.length < 7) {
      if (Swal) Swal.fire('Teléfono Inválido', 'Este aspirante no posee un número de teléfono válido registrado.', 'warning');
      return;
    }

    let numWA = telLimpio;
    if (numWA.startsWith('0')) numWA = '58' + numWA.substring(1);
    if (!numWA.startsWith('58')) numWA = '58' + numWA;

    const textoMensaje = generarMensajeDifusionWhatsApp(sol);
    const urlWA = `https://wa.me/${numWA}?text=${encodeURIComponent(textoMensaje)}`;

    window.open(urlWA, '_blank');

    // Registrar notificación en la BD
    await marcarEstadoWhatsAppDifusion(sol.id, true);
  };

  const marcarEstadoWhatsAppDifusion = async (solId: string | number, notificado: boolean) => {
    const sol = solicitudes.find(s => s.id === solId);
    if (!sol) return;

    const parsed = parsearObservaciones(sol.observaciones);
    const fechaHora = new Date().toLocaleDateString('es-VE') + ' ' + new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

    const obsEstructuradas = estructurarObservaciones(
      parsed.textoLimpio,
      sol.aptitud || parsed.aptitud || 'Apto',
      sol.instruccion_jerarquica ?? parsed.instruccion_jerarquica,
      sol.instruccion_quien ?? parsed.instruccion_quien,
      sol.prioridad_manual ?? parsed.prioridad_manual,
      sol.es_personal_escuela ?? parsed.es_personal_escuela,
      notificado,
      notificado ? fechaHora : null,
      notificado ? 'Difusión Masiva Enviada' : null
    );

    try {
      await supabase
        .from('solicitud_cupos')
        .update({ observaciones: obsEstructuradas })
        .eq('id', solId);

      const solActualizada: SolicitudAdmision = {
        ...sol,
        observaciones: obsEstructuradas,
        whatsapp_notificado: notificado,
        whatsapp_fecha: notificado ? fechaHora : null,
        whatsapp_estado: notificado ? 'Difusión Masiva Enviada' : null
      };

      setSolicitudes(prev => prev.map(s => (s.id === solId ? solActualizada : s)));
    } catch (e) {
      console.warn('Error actualizando estatus WhatsApp:', e);
    }
  };

  const cargarDatosFormulario = (sol: SolicitudAdmision) => {
    const parsed = parsearObservaciones(sol.observaciones);
    setNuevoEstado(sol.estado || 'Pendiente');
    setNuevaAptitud(sol.aptitud || parsed.aptitud || 'En Evaluación');
    setEsJerarquica(sol.instruccion_jerarquica !== undefined ? !!sol.instruccion_jerarquica : parsed.instruccion_jerarquica);
    setQuienInstruye(sol.instruccion_quien || parsed.instruccion_quien || '');
    setPrioridadAsignada(sol.prioridad_manual !== undefined && sol.prioridad_manual !== null ? sol.prioridad_manual : (parsed.prioridad_manual ?? 1));
    setEsPersonalEscuelaForm(sol.es_personal_escuela !== undefined ? !!sol.es_personal_escuela : parsed.es_personal_escuela);
    setNuevasObservaciones(parsed.textoLimpio || '');
    setModoEdicionUnoAUno(false);
  };

  const cambiarVistaUnoAUno = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, solicitudesFiltradas.length - 1));
    setIndiceUnoAUno(clampedIndex);
    if (solicitudesFiltradas[clampedIndex]) {
      cargarDatosFormulario(solicitudesFiltradas[clampedIndex]);
    }
    setVistaActiva('uno_a_uno');
  };

  // ── AUXILIARES DE BADGES (ALTO CONTRASTE Y ESTILO CHAMILO) ─────────────────────
  const renderBadgeEstado = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'formalizado':
      case 'inscrito':
        return (
          <span className="badge rounded-pill fw-bold px-2.5 py-1 text-white shadow-xs" style={{ backgroundColor: '#7C3AED', fontSize: '11px' }}>
            <i className="bi bi-person-check-fill me-1"></i>Formalizado
          </span>
        );
      case 'aprobado':
        return (
          <span className="badge rounded-pill fw-bold px-2.5 py-1 text-white shadow-xs" style={{ backgroundColor: '#059669', fontSize: '11px' }}>
            <i className="bi bi-check-circle-fill me-1"></i>Aprobado
          </span>
        );
      case 'rechazado':
        return (
          <span className="badge rounded-pill fw-bold px-2.5 py-1 text-white shadow-xs" style={{ backgroundColor: '#DC2626', fontSize: '11px' }}>
            <i className="bi bi-x-circle-fill me-1"></i>Rechazado
          </span>
        );
      case 'en evaluación':
      case 'en evaluacion':
        return (
          <span className="badge rounded-pill fw-bold px-2.5 py-1 text-white shadow-xs" style={{ backgroundColor: '#0284C7', fontSize: '11px' }}>
            <i className="bi bi-hourglass-split me-1"></i>En Evaluación
          </span>
        );
      case 'borrador':
        return (
          <span className="badge rounded-pill fw-bold px-2.5 py-1 text-white shadow-xs" style={{ backgroundColor: '#475569', fontSize: '11px' }}>
            <i className="bi bi-pencil-square me-1"></i>Borrador
          </span>
        );
      default:
        return (
          <span className="badge rounded-pill fw-bold px-2.5 py-1 text-white shadow-xs" style={{ backgroundColor: '#D97706', fontSize: '11px' }}>
            <i className="bi bi-clock-history me-1"></i>Pendiente
          </span>
        );
    }
  };

  // ── CLASIFICADOR OFICIAL DE GRADO Y ETAPA PARA ADMISIONES ───────────────────────
  const clasificarGradoAdmision = (gradoRaw?: string): { canonical: string; etapa: 'Educación Inicial' | 'Educación Primaria' | 'Educación Media General' } => {
    if (!gradoRaw) return { canonical: 'Sin Grado Asignado', etapa: 'Educación Primaria' };
    const str = gradoRaw.toLowerCase().trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[°º]/g, '');

    // 1. Maternal / Lactante
    if (str.includes('maternal') || str.includes('lactante') || str.includes('guarder') || str.includes('sala cuna') || str.includes('cunas')) {
      return { canonical: 'Maternal', etapa: 'Educación Inicial' };
    }

    // 2. Inicial - III Grupo / 3er Nivel (Revisar III antes de II para evitar colisión de subcadenas)
    if (
      str.includes('iii') ||
      str.includes('3 grupo') ||
      str.includes('3er grupo') ||
      str.includes('3ro grupo') ||
      str.includes('3er nivel') ||
      str.includes('3ro nivel') ||
      str.includes('3 nivel') ||
      str.includes('tercer grupo') ||
      str.includes('tercer nivel') ||
      (str.includes('3') && (str.includes('inicial') || str.includes('preescolar') || str.includes('kinder') || str.includes('sala de 5')))
    ) {
      return { canonical: 'III Grupo (Inicial)', etapa: 'Educación Inicial' };
    }

    // 3. Inicial - II Grupo / 2do Nivel
    if (
      str.includes('ii') ||
      str.includes('2 grupo') ||
      str.includes('2do grupo') ||
      str.includes('2da grupo') ||
      str.includes('2do nivel') ||
      str.includes('2da nivel') ||
      str.includes('2 nivel') ||
      str.includes('segundo grupo') ||
      str.includes('segundo nivel') ||
      (str.includes('2') && (str.includes('inicial') || str.includes('preescolar') || str.includes('kinder') || str.includes('sala de 4')))
    ) {
      return { canonical: 'II Grupo (Inicial)', etapa: 'Educación Inicial' };
    }

    // 4. Inicial - I Grupo / 1er Nivel
    if (
      str.includes('i grupo') ||
      str.includes('1 grupo') ||
      str.includes('1er grupo') ||
      str.includes('1ra grupo') ||
      str.includes('1er nivel') ||
      str.includes('1ra nivel') ||
      str.includes('1 nivel') ||
      str.includes('primer grupo') ||
      str.includes('primer nivel') ||
      (str.includes('1') && (str.includes('inicial') || str.includes('preescolar') || str.includes('kinder') || str.includes('sala de 3')))
    ) {
      return { canonical: 'I Grupo (Inicial)', etapa: 'Educación Inicial' };
    }

    // Si dice Inicial o Preescolar genérico
    if (str.includes('inicial') || str.includes('preescolar') || str.includes('pre-escolar')) {
      return { canonical: 'Educación Inicial', etapa: 'Educación Inicial' };
    }

    // 5. Media General / Bachillerato (Años)
    if (str.includes('ano') || str.includes('anio') || str.includes('media') || str.includes('secundaria') || str.includes('bachillerato') || str.includes('emg')) {
      if (str.includes('5') || str.includes('quinto')) return { canonical: '5° Año', etapa: 'Educación Media General' };
      if (str.includes('4') || str.includes('cuarto')) return { canonical: '4° Año', etapa: 'Educación Media General' };
      if (str.includes('3') || str.includes('tercer')) return { canonical: '3° Año', etapa: 'Educación Media General' };
      if (str.includes('2') || str.includes('segundo')) return { canonical: '2° Año', etapa: 'Educación Media General' };
      if (str.includes('1') || str.includes('primer')) return { canonical: '1° Año', etapa: 'Educación Media General' };
      return { canonical: 'Educación Media General', etapa: 'Educación Media General' };
    }

    // 6. Primaria (Grados)
    if (str.includes('6') || str.includes('sexto') || str.includes('sexta')) return { canonical: '6° Grado', etapa: 'Educación Primaria' };
    if (str.includes('5') || str.includes('quinto') || str.includes('quinta')) return { canonical: '5° Grado', etapa: 'Educación Primaria' };
    if (str.includes('4') || str.includes('cuarto') || str.includes('cuarta')) return { canonical: '4° Grado', etapa: 'Educación Primaria' };
    if (str.includes('3') || str.includes('tercer') || str.includes('tercera')) return { canonical: '3° Grado', etapa: 'Educación Primaria' };
    if (str.includes('2') || str.includes('segundo') || str.includes('segunda')) return { canonical: '2° Grado', etapa: 'Educación Primaria' };
    if (str.includes('1') || str.includes('primer') || str.includes('primera')) return { canonical: '1° Grado', etapa: 'Educación Primaria' };

    return { canonical: gradoRaw.trim() || 'Otros Grados', etapa: 'Educación Primaria' };
  };

  // ── MOTOR DE CÁLCULO ESTADÍSTICO DE ADMISIONES (CHAMILO LMS) ───────────────────
  const calcularEstadisticasAdmisiones = (escuela: 'todas' | 'sb' | 'lb' = 'todas') => {
    let dataset = solicitudes;
    if (escuela === 'sb') {
      dataset = solicitudes.filter(s => (s.codigo_escuela || '').trim().toLowerCase() === 'sb');
    } else if (escuela === 'lb') {
      dataset = solicitudes.filter(s => (s.codigo_escuela || '').trim().toLowerCase() === 'lb');
    }

    const totalGeneral = dataset.length;
    let aprobadosGeneral = 0;
    let formalizadosGeneral = 0;
    let enEvaluacionGeneral = 0;
    let pendientesGeneral = 0;
    let rechazadosGeneral = 0;
    let borradorGeneral = 0;
    let aptosGeneral = 0;
    let notificadosGeneral = 0;

    // Mapa de etapas acumulativo
    const etapasMap: Record<string, { total: number; aprobados: number; enEvaluacion: number; rechazados: number }> = {
      'Educación Inicial': { total: 0, aprobados: 0, enEvaluacion: 0, rechazados: 0 },
      'Educación Primaria': { total: 0, aprobados: 0, enEvaluacion: 0, rechazados: 0 },
      'Educación Media General': { total: 0, aprobados: 0, enEvaluacion: 0, rechazados: 0 }
    };

    // Conteo por Grados Canónicos
    const GRADOS_ORDEN = [
      'Maternal', 'I Grupo (Inicial)', 'II Grupo (Inicial)', 'III Grupo (Inicial)',
      '1° Grado', '2° Grado', '3° Grado', '4° Grado', '5° Grado', '6° Grado',
      '1° Año', '2° Año', '3° Año', '4° Año', '5° Año'
    ];

    const mapaGrados: Record<string, { total: number; aprobados: number; enEvaluacion: number; rechazados: number; etapa: string }> = {};
    GRADOS_ORDEN.forEach(g => {
      const etapa = g.includes('Grupo') || g.includes('Maternal') 
        ? 'Educación Inicial' 
        : (g.includes('Año') ? 'Educación Media General' : 'Educación Primaria');
      mapaGrados[g] = { total: 0, aprobados: 0, enEvaluacion: 0, rechazados: 0, etapa };
    });

    // Conteo por Nómina
    const mapaNomina: Record<string, { total: number; aprobados: number }> = {
      'PDVSA Contractual': { total: 0, aprobados: 0 },
      'PDVSA No Contractual': { total: 0, aprobados: 0 },
      'Filiales / Mixtas': { total: 0, aprobados: 0 },
      'Comunidad General': { total: 0, aprobados: 0 }
    };

    dataset.forEach(s => {
      const st = (s.estado || '').trim().toLowerCase();
      const esAprobado = ['aprobado', 'aprobada', 'formalizado', 'formalizada', 'inscrito', 'inscrita', 'admitido', 'admitida', 'aceptado', 'aceptada'].includes(st);
      const esFormalizado = ['formalizado', 'formalizada', 'inscrito', 'inscrita'].includes(st);
      const esEnEvaluacion = ['en evaluación', 'en evaluacion', 'evaluación', 'evaluacion', 'en proceso', 'proceso', 'en revisión', 'revision', 'revisión'].includes(st);
      const esRechazado = ['rechazado', 'rechazada', 'no apto', 'no admitido', 'no admitida', 'desestimado', 'desestimada'].includes(st);
      const esBorrador = ['borrador', 'incompleto', 'incompleta'].includes(st);

      if (esAprobado) {
        aprobadosGeneral++;
        if (esFormalizado) formalizadosGeneral++;
      } else if (esEnEvaluacion) {
        enEvaluacionGeneral++;
      } else if (esRechazado) {
        rechazadosGeneral++;
      } else if (esBorrador) {
        borradorGeneral++;
      } else {
        pendientesGeneral++;
      }

      if (s.aptitud === 'Apto') aptosGeneral++;
      const parsed = parsearObservaciones(s.observaciones);
      if (parsed.whatsapp_notificado) notificadosGeneral++;

      // Clasificación del grado y etapa
      const infoGrado = clasificarGradoAdmision(s.grado_solicitado);
      const keyGrado = infoGrado.canonical;
      const keyEtapa = infoGrado.etapa;

      if (!mapaGrados[keyGrado]) {
        mapaGrados[keyGrado] = { total: 0, aprobados: 0, enEvaluacion: 0, rechazados: 0, etapa: keyEtapa };
      }
      mapaGrados[keyGrado].total++;

      if (!etapasMap[keyEtapa]) {
        etapasMap[keyEtapa] = { total: 0, aprobados: 0, enEvaluacion: 0, rechazados: 0 };
      }
      etapasMap[keyEtapa].total++;

      if (esAprobado) {
        mapaGrados[keyGrado].aprobados++;
        etapasMap[keyEtapa].aprobados++;
      } else if (esEnEvaluacion || (!esRechazado && !esBorrador)) {
        mapaGrados[keyGrado].enEvaluacion++;
        etapasMap[keyEtapa].enEvaluacion++;
      } else {
        mapaGrados[keyGrado].rechazados++;
        etapasMap[keyEtapa].rechazados++;
      }

      // Clasificación de nómina
      const tn = (s.pdvsa_tipo_nomina || '').trim().toLowerCase();
      let keyNom = 'Comunidad General';
      if (tn.includes('contractual') && !tn.includes('no contractual')) keyNom = 'PDVSA Contractual';
      else if (tn.includes('no contractual') || tn.includes('no-contractual')) keyNom = 'PDVSA No Contractual';
      else if (tn.includes('filial') || tn.includes('mixta')) keyNom = 'Filiales / Mixtas';
      else if (s.representante_trabaja_pdvsa === true || s.representante_trabaja_pdvsa === 'Sí' || s.representante_trabaja_pdvsa === 'si') keyNom = 'PDVSA Contractual';

      mapaNomina[keyNom].total++;
      if (esAprobado) {
        mapaNomina[keyNom].aprobados++;
      }
    });

    const listosTotal = aprobadosGeneral;
    const enTramiteTotal = enEvaluacionGeneral + pendientesGeneral;
    const noConformesTotal = rechazadosGeneral + borradorGeneral;

    const pctGeneral = totalGeneral > 0 ? Math.round((listosTotal / totalGeneral) * 100) : 0;
    const pctEnTramite = totalGeneral > 0 ? Math.round((enTramiteTotal / totalGeneral) * 100) : 0;
    const pctNoConformes = totalGeneral > 0 ? Math.round((noConformesTotal / totalGeneral) * 100) : 0;

    const desglosePorGrado = Object.keys(mapaGrados)
      .filter(k => mapaGrados[k].total > 0 || GRADOS_ORDEN.includes(k))
      .map(grado => {
        const d = mapaGrados[grado];
        const pctCompletado = d.total > 0 ? Math.round((d.aprobados / d.total) * 100) : 0;
        return {
          grado,
          total: d.total,
          completados: d.aprobados,
          enProceso: d.enEvaluacion,
          sinIniciar: d.rechazados,
          pctCompletado,
          etapa: d.etapa
        };
      });

    const desgloseEtapas = [
      {
        etapa: 'Educación Inicial',
        total: etapasMap['Educación Inicial']?.total || 0,
        completados: etapasMap['Educación Inicial']?.aprobados || 0,
        enProceso: etapasMap['Educación Inicial']?.enEvaluacion || 0,
        sinIniciar: etapasMap['Educación Inicial']?.rechazados || 0,
        pct: (etapasMap['Educación Inicial']?.total || 0) > 0 ? Math.round(((etapasMap['Educación Inicial']?.aprobados || 0) / (etapasMap['Educación Inicial']?.total || 1)) * 100) : 0
      },
      {
        etapa: 'Educación Primaria',
        total: etapasMap['Educación Primaria']?.total || 0,
        completados: etapasMap['Educación Primaria']?.aprobados || 0,
        enProceso: etapasMap['Educación Primaria']?.enEvaluacion || 0,
        sinIniciar: etapasMap['Educación Primaria']?.rechazados || 0,
        pct: (etapasMap['Educación Primaria']?.total || 0) > 0 ? Math.round(((etapasMap['Educación Primaria']?.aprobados || 0) / (etapasMap['Educación Primaria']?.total || 1)) * 100) : 0
      },
      {
        etapa: 'Educación Media General',
        total: etapasMap['Educación Media General']?.total || 0,
        completados: etapasMap['Educación Media General']?.aprobados || 0,
        enProceso: etapasMap['Educación Media General']?.enEvaluacion || 0,
        sinIniciar: etapasMap['Educación Media General']?.rechazados || 0,
        pct: (etapasMap['Educación Media General']?.total || 0) > 0 ? Math.round(((etapasMap['Educación Media General']?.aprobados || 0) / (etapasMap['Educación Media General']?.total || 1)) * 100) : 0
      }
    ];

    const desgloseEstados = [
      { nombre: 'Aprobados / Formalizados', total: aprobadosGeneral, completados: aprobadosGeneral, pct: totalGeneral > 0 ? Math.round((aprobadosGeneral / totalGeneral) * 100) : 0, color: '#059669' },
      { nombre: 'En Evaluación', total: enEvaluacionGeneral, completados: enEvaluacionGeneral, pct: totalGeneral > 0 ? Math.round((enEvaluacionGeneral / totalGeneral) * 100) : 0, color: '#0284C7' },
      { nombre: 'En Evaluación / Trámite', total: pendientesGeneral, completados: pendientesGeneral, pct: totalGeneral > 0 ? Math.round((pendientesGeneral / totalGeneral) * 100) : 0, color: '#D97706' },
      { nombre: 'Rechazados / No Admitidos', total: rechazadosGeneral, completados: rechazadosGeneral, pct: totalGeneral > 0 ? Math.round((rechazadosGeneral / totalGeneral) * 100) : 0, color: '#DC2626' },
      { nombre: 'Borrador / Incompleto', total: borradorGeneral, completados: borradorGeneral, pct: totalGeneral > 0 ? Math.round((borradorGeneral / totalGeneral) * 100) : 0, color: '#475569' }
    ];

    const desgloseNomina = Object.keys(mapaNomina).map(k => {
      const it = mapaNomina[k];
      return {
        nombre: k,
        total: it.total,
        completados: it.aprobados,
        pct: it.total > 0 ? Math.round((it.aprobados / it.total) * 100) : 0,
        color: k === 'PDVSA Contractual' ? '#8B5CF6' : (k === 'PDVSA No Contractual' ? '#0284C7' : (k === 'Filiales / Mixtas' ? '#10B981' : '#F59E0B'))
      };
    });

    // Desglose por Escuelas
    const totalSB = solicitudes.filter(s => (s.codigo_escuela || '').trim().toLowerCase() === 'sb').length;
    const aprobSB = solicitudes.filter(s => (s.codigo_escuela || '').trim().toLowerCase() === 'sb' && ['aprobado', 'formalizado', 'inscrito'].includes((s.estado || '').toLowerCase())).length;
    const pctSB = totalSB > 0 ? Math.round((aprobSB / totalSB) * 100) : 0;

    const totalLB = solicitudes.filter(s => (s.codigo_escuela || '').trim().toLowerCase() === 'lb').length;
    const aprobLB = solicitudes.filter(s => (s.codigo_escuela || '').trim().toLowerCase() === 'lb' && ['aprobado', 'formalizado', 'inscrito'].includes((s.estado || '').toLowerCase())).length;
    const pctLB = totalLB > 0 ? Math.round((aprobLB / totalLB) * 100) : 0;

    const fechaHoraReporte = new Date().toLocaleString('es-VE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return {
      totalGeneral,
      completadosGeneral: listosTotal,
      enProcesoGeneral: enTramiteTotal,
      sinIniciarGeneral: noConformesTotal,
      aprobadosGeneral,
      formalizadosGeneral,
      enEvaluacionGeneral,
      pendientesGeneral,
      rechazadosGeneral,
      borradorGeneral,
      aptosGeneral,
      notificadosGeneral,
      pctGeneral,
      pctEnTramite,
      pctNoConformes,
      desglosePorGrado,
      desgloseEtapas,
      desgloseEstados,
      desgloseNomina,
      totalSB,
      aprobSB,
      pctSB,
      totalLB,
      aprobLB,
      pctLB,
      fechaHoraReporte
    };
  };

  // ── EXPORTACIÓN A EXCEL DE ADMISIONES ───────────────────────────────────────────
  const exportarEstadisticasExcel = () => {
    const stats = calcularEstadisticasAdmisiones(escuelaReporte);
    const nombreInstitucion = escuelaReporte === 'todas' 
      ? 'GENERAL ESCUELAS DEP ORIENTE' 
      : (escuelaReporte === 'sb' ? 'U.E. SANTA BÁRBARA' : 'U.E. LIBERTADOR BOLÍVAR');

    const wb = XLSX.utils.book_new();

    const wsData: any[][] = [
      ['SISTEMA INTEGRAL DE ADMINISTRACIÓN ESCOLAR (SIGAE) - DEP ORIENTE'],
      ['REPORTE ESTADÍSTICO DE GESTIÓN Y ADMISIÓN DE ASPIRANTES'],
      [],
      ['ÁMBITO INSTITUCIONAL:', nombreInstitucion],
      ['FECHA Y HORA DEL REPORTE:', stats.fechaHoraReporte.toUpperCase()],
      ['EMITIDO POR:', (user?.nombre_completo || user?.cedula || 'Comité de Admisiones').toUpperCase()],
      [],
      ['=== RESUMEN GENERAL DE ADMISIONES ==='],
      ['Métrica', 'Cantidad', 'Porcentaje'],
      ['Total Solicitudes Registradas', stats.totalGeneral, '100%'],
      ['Aprobadas / Formalizadas', stats.aprobadosGeneral, `${stats.pctGeneral}%`],
      ['En Evaluación / En Trámite', stats.enProcesoGeneral, `${stats.pctEnTramite}%`],
      ['Rechazadas / No Conformes', stats.rechazadosGeneral, `${stats.pctNoConformes}%`],
      ['Aptos Calificados', stats.aptosGeneral, `${stats.totalGeneral > 0 ? Math.round((stats.aptosGeneral / stats.totalGeneral) * 100) : 0}%`],
      ['Notificados vía WhatsApp', stats.notificadosGeneral, `${stats.totalGeneral > 0 ? Math.round((stats.notificadosGeneral / stats.totalGeneral) * 100) : 0}%`],
      [],
      ['=== DESGLOSE POR GRUPO, GRADO O AÑO ESCOLAR ==='],
      ['Grupo / Grado / Año Escolar', 'Total Solicitudes', 'Aprobadas (100%)', 'En Trámite', 'Rechazadas / Borrador', '% Aprobación']
    ];

    stats.desglosePorGrado.forEach(g => {
      wsData.push([
        g.grado,
        g.total,
        g.completados,
        g.enProceso,
        g.sinIniciar,
        `${g.pctCompletado}%`
      ]);
    });

    wsData.push([
      'TOTAL GENERAL CONSOLIDADO',
      stats.totalGeneral,
      stats.completadosGeneral,
      stats.enProcesoGeneral,
      stats.sinIniciarGeneral,
      `${stats.pctGeneral}%`
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Estadísticas Admisión');

    const filename = `Reporte_Estadistico_Admision_${escuelaReporte.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  // ── GENERADOR HTML OFICIAL DE ALTO CONTRASTE (PDF / IMPRESIÓN / IMAGEN) ─────────
  const generarReporteHTML = (stats: any, nombreInstitucion: string, tipo: string = 'dossier', agrupacion: string = 'grados') => {
    let itemsDesglose: any[] = [];
    let tituloDesglose = 'Por Grados / Años Solicitados';
    if (agrupacion === 'niveles') {
      itemsDesglose = stats.desgloseEtapas || [];
      tituloDesglose = 'Por Niveles y Etapas Educativas';
    } else if (agrupacion === 'estados') {
      itemsDesglose = stats.desgloseEstados || [];
      tituloDesglose = 'Por Estatus de Admisión';
    } else if (agrupacion === 'nomina') {
      itemsDesglose = stats.desgloseNomina || [];
      tituloDesglose = 'Por Tipo de Nómina / Comunidad';
    } else {
      itemsDesglose = stats.desglosePorGrado || [];
      tituloDesglose = 'Por Grados / Años Solicitados';
    }

    return `
      <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #0F172A; background-color: #ffffff; padding: 20px 24px; max-width: 800px; margin: 0 auto; line-height: 1.35; font-size: 11px;">
        
        <!-- MEMBRETE OFICIAL INSTITUCIONAL CON BORDE MORADO CHAMILO -->
        <div style="border-top: 4px solid #8B5CF6; border-bottom: 2px solid #8B5CF6; padding: 12px 14px; margin-bottom: 14px; background-color: #F8FAFC; border-radius: 8px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="/assets/img/logoEscuelas.png" style="height: 48px; width: auto;" alt="Escudo" />
              <div>
                <div style="font-size: 11.5px; font-weight: 900; color: #6D28D9; text-transform: uppercase; letter-spacing: 0.5px;">REPÚBLICA BOLIVARIANA DE VENEZUELA</div>
                <div style="font-size: 10px; font-weight: 700; color: #334155;">MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN</div>
                <div style="font-size: 9px; font-weight: 600; color: #64748B;">DIRECCIÓN EJECUTIVA DE PRODUCCIÓN ORIENTE • SIGAE</div>
              </div>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; background-color: #EDE9FE; color: #6D28D9; border: 1px solid #DDD6FE; font-size: 9px; font-weight: 800; padding: 3px 10px; border-radius: 9999px; text-transform: uppercase;">
                ${nombreInstitucion}
              </span>
              <div style="font-size: 8.5px; color: #334155; font-weight: 700; margin-top: 4px;">${stats.fechaHoraReporte}</div>
            </div>
          </div>
        </div>

        <!-- TÍTULO DEL REPORTE -->
        <div style="text-align: center; margin-bottom: 12px;">
          <h2 style="margin: 0; font-size: 14.5px; font-weight: 900; color: #4C1D95; text-transform: uppercase; letter-spacing: 0.5px;">
            📊 Reporte Oficial de Gestión y Admisión de Aspirantes
          </h2>
          <div style="font-size: 9.5px; font-weight: 700; color: #334155; margin-top: 3px;">
            Auditoría de Solicitudes y Control de Matrícula
          </div>
        </div>

        <!-- 4 TARJETAS KPIS CON ACENTO LATERAL Y MÁXIMO CONTRASTE -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px;">
          <div style="background: #FFFFFF; border: 1.5px solid #E2E8F0; border-left: 4.5px solid #8B5CF6; border-radius: 8px; padding: 8px 10px;">
            <div style="font-size: 8.5px; font-weight: 800; color: #4B5563; text-transform: uppercase;">Total Solicitudes</div>
            <div style="display: flex; align-items: baseline; justify-content: space-between; margin-top: 2px;">
              <span style="font-size: 20px; font-weight: 900; color: #1E1B4B;">${stats.totalGeneral}</span>
              <span style="background-color: #EDE9FE; color: #6D28D9; font-weight: 800; font-size: 8.5px; padding: 1px 6px; border-radius: 9999px;">100%</span>
            </div>
          </div>

          <div style="background: #FFFFFF; border: 1.5px solid #E2E8F0; border-left: 4.5px solid #10B981; border-radius: 8px; padding: 8px 10px;">
            <div style="font-size: 8.5px; font-weight: 800; color: #065F46; text-transform: uppercase;">Aprobadas / Listas</div>
            <div style="display: flex; align-items: baseline; justify-content: space-between; margin-top: 2px;">
              <span style="font-size: 20px; font-weight: 900; color: #065F46;">${stats.completadosGeneral}</span>
              <span style="background-color: #059669; color: #FFFFFF; font-weight: 800; font-size: 8.5px; padding: 1px 6px; border-radius: 9999px;">${stats.pctGeneral}%</span>
            </div>
          </div>

          <div style="background: #FFFFFF; border: 1.5px solid #E2E8F0; border-left: 4.5px solid #F59E0B; border-radius: 8px; padding: 8px 10px;">
            <div style="font-size: 8.5px; font-weight: 800; color: #92400E; text-transform: uppercase;">En Evaluación</div>
            <div style="display: flex; align-items: baseline; justify-content: space-between; margin-top: 2px;">
              <span style="font-size: 20px; font-weight: 900; color: #92400E;">${stats.enProcesoGeneral}</span>
              <span style="background-color: #D97706; color: #FFFFFF; font-weight: 800; font-size: 8.5px; padding: 1px 6px; border-radius: 9999px;">${stats.pctEnTramite}%</span>
            </div>
          </div>

          <div style="background: #FFFFFF; border: 1.5px solid #E2E8F0; border-left: 4.5px solid #64748B; border-radius: 8px; padding: 8px 10px;">
            <div style="font-size: 8.5px; font-weight: 800; color: #334155; text-transform: uppercase;">Rechazadas / Borrador</div>
            <div style="display: flex; align-items: baseline; justify-content: space-between; margin-top: 2px;">
              <span style="font-size: 20px; font-weight: 900; color: #334155;">${stats.sinIniciarGeneral}</span>
              <span style="background-color: #475569; color: #FFFFFF; font-weight: 800; font-size: 8.5px; padding: 1px 6px; border-radius: 9999px;">${stats.pctNoConformes}%</span>
            </div>
          </div>
        </div>

        <!-- GRÁFICO DINÁMICO SEGÚN VISTA -->
        ${tipo === 'dossier' || tipo === 'resumen_niveles' ? `
        <div style="background-color: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px;">
          <div style="font-size: 10px; font-weight: 800; color: #4C1D95; text-transform: uppercase; margin-bottom: 8px;">
            📈 Desglose por Etapas y Niveles Educativos
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
            ${(stats.desgloseEtapas || []).map((et: any) => `
              <div style="background: #FFFFFF; border: 1.5px solid #E2E8F0; border-top: 3.5px solid ${et.pct >= 75 ? '#10B981' : (et.pct >= 40 ? '#F59E0B' : '#EF4444')}; border-radius: 6px; padding: 8px;">
                <div style="font-weight: 900; font-size: 9.5px; color: #0F172A;">${et.etapa}</div>
                <div style="font-size: 8px; color: #64748B; margin-bottom: 4px;">Total: <strong>${et.total}</strong> aspirantes</div>
                <div style="font-size: 8.5px; font-weight: 700; color: #047857;">🟢 Aprobados: <strong>${et.completados}</strong> (${et.pct}%)</div>
                <div style="font-size: 8.5px; font-weight: 700; color: #B45309;">🟡 En Trámite: <strong>${et.enProceso}</strong></div>
                <div style="font-size: 8.5px; font-weight: 700; color: #475569;">⚪ No Conformes: <strong>${et.sinIniciar}</strong></div>
                <div style="background: #E2E8F0; border-radius: 9999px; height: 6px; overflow: hidden; margin-top: 6px; display: flex;">
                  <div style="background: #10B981; width: ${et.pct}%; height: 100%;"></div>
                  <div style="background: #F59E0B; width: ${et.total > 0 ? (et.enProceso / et.total) * 100 : 0}%; height: 100%;"></div>
                  <div style="background: #94A3B8; width: ${et.total > 0 ? (et.sinIniciar / et.total) * 100 : 0}%; height: 100%;"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- TABLA DETALLADA CON ALTO CONTRASTE -->
        <table style="width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 12px; border: 1.5px solid #CBD5E1;">
          <thead>
            <tr style="background-color: #7C3AED; color: #FFFFFF; text-align: center; font-weight: 800;">
              <th style="padding: 6px 8px; text-align: left;">${tituloDesglose}</th>
              <th style="padding: 6px 4px; width: 65px;">Total</th>
              <th style="padding: 6px 4px; width: 85px;">Aprobadas</th>
              <th style="padding: 6px 4px; width: 80px;">En Trámite</th>
              <th style="padding: 6px 4px; width: 80px;">Rechazadas</th>
              <th style="padding: 6px 6px; width: 125px;">% Aprobación</th>
            </tr>
          </thead>
          <tbody>
            ${itemsDesglose.map((it: any, idx: number) => {
              const label = it.grado || it.etapa || it.nombre || `Ítem ${idx + 1}`;
              const tot = it.total || 0;
              const comp = it.completados || 0;
              const proc = it.enProceso || (tot - comp);
              const sin = it.sinIniciar || 0;
              const p = it.pctCompletado ?? it.pct ?? (tot > 0 ? Math.round((comp / tot) * 100) : 0);
              const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

              return `
              <tr style="background-color: ${bg}; border-bottom: 1px solid #E2E8F0; text-align: center;">
                <td style="padding: 5px 8px; text-align: left; font-weight: 700; color: #0F172A;">${label}</td>
                <td style="padding: 5px 4px; font-weight: 800; color: #0F172A;">${tot}</td>
                <td style="padding: 5px 4px;">
                  <span style="background-color: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; font-weight: 800; padding: 1px 6px; border-radius: 9999px; font-size: 8.5px;">${comp}</span>
                </td>
                <td style="padding: 5px 4px;">
                  <span style="background-color: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; font-weight: 800; padding: 1px 6px; border-radius: 9999px; font-size: 8.5px;">${proc}</span>
                </td>
                <td style="padding: 5px 4px;">
                  <span style="background-color: #F1F5F9; color: #334155; border: 1px solid #E2E8F0; font-weight: 700; padding: 1px 6px; border-radius: 9999px; font-size: 8.5px;">${sin}</span>
                </td>
                <td style="padding: 5px 6px;">
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <div style="background-color: #E2E8F0; border-radius: 9999px; height: 6px; overflow: hidden; width: 100%;">
                      <div style="background-color: #10B981; height: 100%; width: ${p}%;"></div>
                    </div>
                    <span style="min-width: 26px; font-weight: 800; color: #047857; font-size: 9px;">${p}%</span>
                  </div>
                </td>
              </tr>
              `;
            }).join('')}

            <!-- TOTAL CONSOLIDADO -->
            <tr style="background-color: #EDE9FE; text-align: center; font-weight: 900; border-top: 2px solid #8B5CF6; color: #4C1D95;">
              <td style="padding: 6px 8px; text-align: left;">TOTAL GENERAL CONSOLIDADO</td>
              <td style="padding: 6px 4px;">${stats.totalGeneral}</td>
              <td style="padding: 6px 4px; color: #15803D;">${stats.completadosGeneral}</td>
              <td style="padding: 6px 4px; color: #B45309;">${stats.enProcesoGeneral}</td>
              <td style="padding: 6px 4px; color: #475569;">${stats.sinIniciarGeneral}</td>
              <td style="padding: 6px 6px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <div style="background-color: #DDD6FE; border-radius: 9999px; height: 7px; overflow: hidden; width: 100%;">
                    <div style="background-color: #10B981; height: 100%; width: ${stats.pctGeneral}%;"></div>
                  </div>
                  <span style="min-width: 26px; font-weight: 900; color: #6D28D9; font-size: 9.5px;">${stats.pctGeneral}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- PIE INSTITUCIONAL -->
        <div style="border-top: 1.5px solid #CBD5E1; padding-top: 8px; margin-top: 12px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center;">
            <img src="/assets/img/logoMPPE.png" style="height: 32px; width: auto;" alt="MPPE" />
          </div>
          <div style="text-align: right; color: #64748B; font-size: 8px; line-height: 1.3;">
            <strong style="color: #7C3AED;">SIGAE • Gestión de Admisiones</strong><br>
            Documento de control académico emitido automáticamente.
          </div>
        </div>
      </div>
    `;
  };

  const generarReportePDFBlob = async (stats: any, nombreInstitucion: string, tipo: string = 'dossier', agrupacion: string = 'grados'): Promise<{ blob: Blob; nombreArchivo: string }> => {
    const contenedor = document.createElement('div');
    contenedor.style.position = 'fixed';
    contenedor.style.left = '-9999px';
    contenedor.style.top = '0';
    contenedor.style.width = '800px';
    contenedor.style.backgroundColor = '#ffffff';
    contenedor.innerHTML = generarReporteHTML(stats, nombreInstitucion, tipo, agrupacion);

    document.body.appendChild(contenedor);
    await new Promise(r => setTimeout(r, 80));

    const canvas = await html2canvas(contenedor, {
      scale: 1.5,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true
    });

    document.body.removeChild(contenedor);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(imgHeight, pdfHeight), undefined, 'FAST');

    const nombreArchivo = `Reporte_Admisiones_${escuelaReporte.toUpperCase()}_${tipo}_${new Date().toISOString().slice(0, 10)}.pdf`;
    const blob = pdf.output('blob');
    return { blob, nombreArchivo };
  };

  const descargarReportePDF = async () => {
    try {
      setGenerandoPDF(true);
      const stats = calcularEstadisticasAdmisiones(escuelaReporte);
      const nombreInstitucion = escuelaReporte === 'todas' 
        ? 'GENERAL ESCUELAS DEP ORIENTE' 
        : (escuelaReporte === 'sb' ? 'U.E. SANTA BÁRBARA' : 'U.E. LIBERTADOR BOLÍVAR');

      const { blob, nombreArchivo } = await generarReportePDFBlob(stats, nombreInstitucion, tipoGrafico, criterioAgrupacion);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error al generar PDF de admisiones:', err);
      alert('Ocurrió un error al generar el archivo PDF.');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const imprimirReporteEstadistico = () => {
    const stats = calcularEstadisticasAdmisiones(escuelaReporte);
    const nombreInstitucion = escuelaReporte === 'todas' 
      ? 'GENERAL ESCUELAS DEP ORIENTE' 
      : (escuelaReporte === 'sb' ? 'U.E. SANTA BÁRBARA' : 'U.E. LIBERTADOR BOLÍVAR');

    const contenidoHTML = generarReporteHTML(stats, nombreInstitucion, tipoGrafico, criterioAgrupacion);
    const ventana = window.open('', '_blank', 'width=900,height=700');
    if (!ventana) return;

    ventana.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reporte Estadístico de Admisiones - SIGAE</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              @page { size: letter portrait; margin: 10mm; }
            }
          </style>
        </head>
        <body>
          ${contenidoHTML}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    ventana.document.close();
  };

  const enviarWhatsAppImagen = async (
    stats: any, 
    nombreInstitucion: string, 
    tipo: string = 'dossier', 
    agrupacion: string = 'grados'
  ) => {
    try {
      const contenedor = document.createElement('div');
      contenedor.style.position = 'fixed';
      contenedor.style.left = '-9999px';
      contenedor.style.top = '0';
      contenedor.style.width = '800px';
      contenedor.style.backgroundColor = '#ffffff';
      contenedor.innerHTML = generarReporteHTML(stats, nombreInstitucion, tipo, agrupacion);

      document.body.appendChild(contenedor);
      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(contenedor, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      document.body.removeChild(contenedor);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('No se pudo generar la imagen del reporte.');
          return;
        }

        try {
          if (navigator.clipboard && (window as any).ClipboardItem) {
            await navigator.clipboard.write([
              new (window as any).ClipboardItem({ 'image/png': blob })
            ]);
            if (Swal) {
              Swal.fire({
                icon: 'success',
                title: '¡Imagen Copiada al Portapapeles!',
                text: 'La imagen del reporte de admisiones está lista. Abre WhatsApp Web y presiona Ctrl + V para enviarla.',
                confirmButtonColor: '#8B5CF6'
              });
            } else {
              alert('Imagen copiada al portapapeles. Abre WhatsApp y presiona Ctrl + V.');
            }
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Reporte_Admisiones_${new Date().toISOString().slice(0, 10)}.png`;
            a.click();
            URL.revokeObjectURL(url);
            if (Swal) {
              Swal.fire({
                icon: 'info',
                title: 'Imagen Descargada',
                text: 'Se descargó la imagen PNG del reporte para que puedas adjuntarla en WhatsApp.',
                confirmButtonColor: '#8B5CF6'
              });
            }
          }
        } catch (errCopy) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Reporte_Admisiones_${new Date().toISOString().slice(0, 10)}.png`;
          a.click();
          URL.revokeObjectURL(url);
          if (Swal) {
            Swal.fire({
              icon: 'info',
              title: 'Imagen Descargada',
              text: 'Se descargó la imagen PNG del reporte para que puedas compartirla.',
              confirmButtonColor: '#8B5CF6'
            });
          }
        }
      }, 'image/png');
    } catch (err: any) {
      console.error('Error al generar imagen para WhatsApp:', err);
      alert('Ocurrió un error al preparar la imagen del reporte.');
    }
  };

  // ── DETECCIÓN DE DUPLICADOS ─────────────────────────────────────────────────────
  const detectarDuplicados = () => {
    const mapaDuplicados: Record<string, SolicitudAdmision[]> = {};

    solicitudes.forEach(s => {
      const cedEst = cleanCedula(s.estudiante_cedula);
      const nomEst = (s.estudiante_nombres || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const apeEst = (s.estudiante_apellidos || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const fullNomEst = `${nomEst} ${apeEst}`.trim();
      const cedRep = cleanCedula(s.representante_cedula);
      const esc = (s.codigo_escuela || '').trim().toLowerCase();

      // Criterio de clave de duplicado:
      // 1. Cédula del estudiante si tiene al menos 4 dígitos
      // 2. Si no tiene cédula, nombre completo del estudiante + escuela
      // 3. Cédula del representante + nombre completo del estudiante
      let clave = '';
      if (cedEst && cedEst.length >= 4) {
        clave = `ced_est:${cedEst}`;
      } else if (fullNomEst && fullNomEst.length >= 5) {
        clave = `nom_est:${fullNomEst}|esc:${esc}`;
      } else if (cedRep && cedRep.length >= 4 && nomEst) {
        clave = `rep:${cedRep}|nom_est:${nomEst}`;
      }

      if (!clave) return;

      if (!mapaDuplicados[clave]) mapaDuplicados[clave] = [];
      mapaDuplicados[clave].push(s);
    });

    const gruposDetectados: SolicitudAdmision[][] = [];
    Object.values(mapaDuplicados).forEach(grupo => {
      if (grupo.length > 1) {
        // Ordenar del más reciente al más antiguo
        grupo.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        gruposDetectados.push(grupo);
      }
    });

    gruposDetectados.sort((a, b) => b.length - a.length);
    setGruposDuplicados(gruposDetectados);

    if (gruposDetectados.length === 0) {
      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Sin Duplicados!',
          text: 'No se detectaron solicitudes duplicadas en la base de datos de admisiones.',
          confirmButtonColor: '#8B5CF6'
        });
      }
      return;
    }

    // Preseleccionar los duplicados más antiguos (todos excepto el primero/más reciente)
    const preseleccion = new Set<string | number>();
    gruposDetectados.forEach(grupo => {
      grupo.slice(1).forEach(s => {
        if (s.id !== undefined) preseleccion.add(s.id);
      });
    });
    setSeleccionadosParaEliminar(preseleccion);
    setModalDuplicadosAbierto(true);
  };

  const toggleSeleccion = (id: string | number) => {
    setSeleccionadosParaEliminar(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const eliminarSeleccionados = async () => {
    if (seleccionadosParaEliminar.size === 0) {
      if (Swal) Swal.fire('Atención', 'No has seleccionado ningún registro para eliminar.', 'warning');
      return;
    }

    setEliminandoDuplicados(true);
    try {
      const idsArray = Array.from(seleccionadosParaEliminar);
      const { error } = await supabase
        .from('solicitud_cupos')
        .delete()
        .in('id', idsArray);

      if (error) throw error;

      await auditar('Gestión de Admisiones', 'Eliminar Duplicados', `Se eliminaron ${idsArray.length} registros duplicados de solicitud_cupos`);
      
      const idsSet = new Set(idsArray.map(String));
      setSolicitudes(prev => prev.filter(s => !idsSet.has(String(s.id))));
      setModalDuplicadosAbierto(false);
      setGruposDuplicados([]);
      setSeleccionadosParaEliminar(new Set());

      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Duplicados Eliminados!',
          text: `Se eliminaron con éxito ${idsArray.length} registro(s) duplicado(s).`,
          confirmButtonColor: '#8B5CF6'
        });
      }
    } catch (err: any) {
      console.error('Error al eliminar duplicados:', err);
      if (Swal) Swal.fire('Error', 'No se pudieron eliminar los registros: ' + (err.message || 'Error de base de datos'), 'error');
    } finally {
      setEliminandoDuplicados(false);
    }
  };

  // ── DEPURACIÓN DE VACÍOS ────────────────────────────────────────────────────────
  const detectarVacios = (tipo: 'representante' | 'estudiante') => {
    setTipoVacios(tipo);
    const vacios = solicitudes.filter(s => {
      if (tipo === 'representante') {
        const nom = (s.representante_nombres || '').trim();
        const ape = (s.representante_apellidos || '').trim();
        const ced = (s.representante_cedula || '').trim();
        return (!nom && !ape && !ced) || nom === 'Sin nombre' || (nom.length < 2 && ced.length < 3);
      } else {
        const nom = (s.estudiante_nombres || '').trim();
        const ape = (s.estudiante_apellidos || '').trim();
        const ced = (s.estudiante_cedula || '').trim();
        return (!nom && !ape && !ced) || nom === 'Sin nombre' || (nom.length < 2 && ced.length < 3);
      }
    });

    if (vacios.length === 0) {
      if (Swal) {
        Swal.fire({
          icon: 'info',
          title: 'Sin Registros Vacíos',
          text: `Todas las solicitudes contienen información válida de ${tipo === 'representante' ? 'representantes' : 'aspirantes'}.`,
          confirmButtonColor: '#8B5CF6'
        });
      }
      return;
    }

    setRegistrosVacios(vacios);
    const todosIds = new Set<string | number>();
    vacios.forEach(s => { if (s.id !== undefined) todosIds.add(s.id); });
    setSeleccionadosVacios(todosIds);
    setModalVaciosAbierto(true);
  };

  const toggleSeleccionVacio = (id: string | number) => {
    setSeleccionadosVacios(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const eliminarVaciosSeleccionados = async () => {
    if (seleccionadosVacios.size === 0) {
      if (Swal) Swal.fire('Atención', 'No has seleccionado ningún registro para eliminar.', 'warning');
      return;
    }

    setEliminandoVacios(true);
    try {
      const idsArray = Array.from(seleccionadosVacios);
      const { error } = await supabase
        .from('solicitud_cupos')
        .delete()
        .in('id', idsArray);

      if (error) throw error;

      await auditar('Gestión de Admisiones', 'Eliminar Vacíos', `Se eliminaron ${idsArray.length} registros vacíos`);
      
      const idsSet = new Set(idsArray.map(String));
      setSolicitudes(prev => prev.filter(s => !idsSet.has(String(s.id))));
      setModalVaciosAbierto(false);
      setRegistrosVacios([]);
      setSeleccionadosVacios(new Set());

      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Registros Vacíos Eliminados!',
          text: `Se eliminaron con éxito ${idsArray.length} registro(s) vacíos.`,
          confirmButtonColor: '#8B5CF6'
        });
      }
    } catch (err: any) {
      console.error('Error al eliminar vacíos:', err);
      if (Swal) Swal.fire('Error', 'No se pudieron eliminar los registros: ' + (err.message || 'Error de base de datos'), 'error');
    } finally {
      setEliminandoVacios(false);
    }
  };

  // ── DEPURACIÓN DE REGULARES ──────────────────────────────────────────────────────
  const detectarRegulares = async () => {
    setDetectandoRegulares(true);
    try {
      // 1. Obtener matrícula regular completa desde estudiantes_vinculaciones
      const chunksReg = await Promise.all([
        supabase.from('estudiantes_vinculaciones').select('cedula_estudiante, nombres_estudiante, apellidos_estudiante, codigo_escuela, grado_actual').range(0, 999),
        supabase.from('estudiantes_vinculaciones').select('cedula_estudiante, nombres_estudiante, apellidos_estudiante, codigo_escuela, grado_actual').range(1000, 1999),
        supabase.from('estudiantes_vinculaciones').select('cedula_estudiante, nombres_estudiante, apellidos_estudiante, codigo_escuela, grado_actual').range(2000, 2999),
      ]);
      const estRegulares = chunksReg.flatMap(c => c.data || []);

      const setCedulas = new Set<string>();
      const setNombres = new Set<string>();

      // Combinar los de la consulta y los de memoria local
      const matriculaCombinada = [...(estRegulares || []), ...estudiantesMatriculaBD];

      matriculaCombinada.forEach((e: any) => {
        const c = cleanCedula(e.cedula_estudiante);
        if (c && c.length >= 4) setCedulas.add(c);

        const nom = (e.nombres_estudiante || e.nombres || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const ape = (e.apellidos_estudiante || e.apellidos || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const fullNom = `${nom} ${ape}`.trim();
        if (fullNom && fullNom.length >= 5) setNombres.add(fullNom);
      });

      const encontrados = solicitudes.filter(s => {
        const ced = cleanCedula(s.estudiante_cedula);
        const nom = (s.estudiante_nombres || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const ape = (s.estudiante_apellidos || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const fullNom = `${nom} ${ape}`.trim();

        if (ced && ced.length >= 4 && setCedulas.has(ced)) return true;
        if (fullNom && fullNom.length >= 5 && setNombres.has(fullNom)) return true;
        return false;
      });

      if (encontrados.length === 0) {
        if (Swal) {
          Swal.fire({
            icon: 'info',
            title: 'Sin Coincidencias de Regulares',
            text: 'Ninguno de los aspirantes solicitantes coincide con estudiantes que ya estén matriculados como regulares.',
            confirmButtonColor: '#0D9488'
          });
        }
        return;
      }

      setRegistrosRegulares(encontrados);
      const todosIds = new Set<string | number>();
      encontrados.forEach(s => { if (s.id !== undefined) todosIds.add(s.id); });
      setSeleccionadosRegulares(todosIds);
      setModalRegularesAbierto(true);
    } catch (err: any) {
      console.error('Error detectando regulares:', err);
      if (Swal) Swal.fire('Error', 'Falla al consultar la matrícula de regulares: ' + err.message, 'error');
    } finally {
      setDetectandoRegulares(false);
    }
  };

  const toggleSeleccionRegular = (id: string | number) => {
    setSeleccionadosRegulares(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const eliminarRegularesSeleccionados = async () => {
    if (seleccionadosRegulares.size === 0) {
      if (Swal) Swal.fire('Atención', 'No has seleccionado ningún registro para depurar.', 'warning');
      return;
    }

    setEliminandoRegulares(true);
    try {
      const idsArray = Array.from(seleccionadosRegulares);
      const { error } = await supabase.from('solicitud_cupos').delete().in('id', idsArray);
      if (error) throw error;

      await auditar('Gestión de Admisiones', 'Depurar Regulares', `Se depuraron ${idsArray.length} solicitudes de estudiantes que ya eran regulares`);
      
      const idsSet = new Set(idsArray.map(String));
      setSolicitudes(prev => prev.filter(s => !idsSet.has(String(s.id))));
      setModalRegularesAbierto(false);
      setRegistrosRegulares([]);
      setSeleccionadosRegulares(new Set());

      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Solicitudes de Regulares Depuradas!',
          text: `Se depuraron con éxito ${idsArray.length} solicitud(es).`,
          confirmButtonColor: '#0284c7'
        });
      }
    } catch (err: any) {
      console.error('Error al eliminar regulares:', err);
      if (Swal) Swal.fire('Error', 'No se pudieron depurar las solicitudes: ' + (err.message || 'Error de base de datos'), 'error');
    } finally {
      setEliminandoRegulares(false);
    }
  };

  // ── MÉTODOS DE ELIMINACIÓN Y SELECCIÓN EN LISTADO GENERAL ───────────────────────
  const todosFiltradosSeleccionados = useMemo(() => {
    if (solicitudesFiltradas.length === 0) return false;
    return solicitudesFiltradas.every(s => seleccionadosListadoGeneral.has(String(s.id)));
  }, [solicitudesFiltradas, seleccionadosListadoGeneral]);

  const toggleSeleccionarTodo = () => {
    if (todosFiltradosSeleccionados) {
      setSeleccionadosListadoGeneral(prev => {
        const next = new Set(prev);
        solicitudesFiltradas.forEach(s => next.delete(String(s.id)));
        return next;
      });
    } else {
      setSeleccionadosListadoGeneral(prev => {
        const next = new Set(prev);
        solicitudesFiltradas.forEach(s => next.add(String(s.id)));
        return next;
      });
    }
  };

  const toggleSeleccionarSolicitud = (id: string | number) => {
    const strId = String(id);
    setSeleccionadosListadoGeneral(prev => {
      const next = new Set(prev);
      if (next.has(strId)) next.delete(strId);
      else next.add(strId);
      return next;
    });
  };

  const eliminarSolicitudIndividual = async (sol: SolicitudAdmision) => {
    const nomEst = nombreCompleto(sol.estudiante_nombres, sol.estudiante_apellidos);
    const codUni = sol.codigo_unico || 'S/C';

    const confirm = await Swal.fire({
      title: '¿Eliminar Solicitud?',
      html: `
        <div style="text-align: left; font-size: 14px;">
          <p class="mb-2">¿Estás seguro de que deseas eliminar permanentemente esta solicitud de admisión?</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
            <div><b>Aspirante:</b> ${nomEst}</div>
            <div><b>Cédula:</b> ${sol.estudiante_cedula || 'En trámite'}</div>
            <div><b>Código Único:</b> <span style="font-family: monospace; color: #2563eb;">${codUni}</span></div>
            <div><b>Plantel / Grado:</b> ${sol.codigo_escuela?.toUpperCase() === 'SB' ? 'Santa Bárbara' : 'Libertador Bolívar'} - ${sol.grado_solicitado}</div>
            <div><b>Estatus actual:</b> ${sol.estado || 'Pendiente'}</div>
          </div>
          <p style="color: #dc2626; font-size: 12px; margin: 0;"><b>Advertencia:</b> Esta acción no se puede deshacer.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: '<i class="bi bi-trash-fill me-1"></i> Sí, Eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    setEliminandoSolicitudes(true);
    try {
      // 1. Eliminar de solicitud_cupos
      const { error: errSol } = await supabase
        .from('solicitud_cupos')
        .delete()
        .eq('id', sol.id);

      if (errSol) throw errSol;

      // 2. Si estaba formalizada o con identificador ESC-, limpiar vinculación si aplica
      if (sol.estado === 'Formalizado' || (sol.estudiante_cedula && (sol.estudiante_cedula.startsWith('ESC-') || sol.estudiante_cedula.startsWith('SC-')))) {
        await supabase
          .from('estudiantes_vinculaciones')
          .delete()
          .or(`cedula_estudiante.eq.${sol.estudiante_cedula},cedula_estudiante.eq.${sol.codigo_unico}`);
      }

      // 3. Registrar auditoría
      await auditar(
        'Gestión de Admisiones',
        'Eliminar Solicitud Individual',
        `Solicitud eliminada: ${nomEst} (${codUni}) - C.I. ${sol.estudiante_cedula || 'N/A'}`
      );

      // 4. Actualizar estado local
      setSolicitudes(prev => prev.filter(s => s.id !== sol.id));
      setSeleccionadosListadoGeneral(prev => {
        const next = new Set(prev);
        next.delete(String(sol.id));
        return next;
      });

      // 5. Refrescar capacidad escolar
      await cargarCapacidadEscolar();

      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Solicitud Eliminada!',
          text: `La solicitud de ${nomEst} ha sido eliminada con éxito.`,
          confirmButtonColor: '#0284c7',
          timer: 2200
        });
      }
    } catch (err: any) {
      console.error('Error al eliminar solicitud:', err);
      if (Swal) {
        Swal.fire('Error', 'No se pudo eliminar la solicitud: ' + (err.message || 'Error de base de datos'), 'error');
      }
    } finally {
      setEliminandoSolicitudes(false);
    }
  };

  const eliminarSolicitudesSeleccionadas = async () => {
    const total = seleccionadosListadoGeneral.size;
    if (total === 0) {
      if (Swal) Swal.fire('Atención', 'No has seleccionado ninguna solicitud para eliminar.', 'warning');
      return;
    }

    const confirm = await Swal.fire({
      title: `¿Eliminar ${total} ${total === 1 ? 'Solicitud' : 'Solicitudes'}?`,
      html: `
        <div style="text-align: left; font-size: 14px;">
          <p class="mb-2">¿Estás seguro de que deseas eliminar permanentemente las <b>${total}</b> solicitudes seleccionadas?</p>
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin-bottom: 10px; color: #991b1b;">
            <i class="bi bi-exclamation-triangle-fill me-1"></i>
            Esta acción removerá las solicitudes de la base de datos y no se puede deshacer.
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: `<i class="bi bi-trash-fill me-1"></i> Sí, Eliminar ${total}`,
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    setEliminandoSolicitudes(true);
    try {
      const idsArray = Array.from(seleccionadosListadoGeneral);
      const solicitudesAEliminar = solicitudes.filter(s => seleccionadosListadoGeneral.has(String(s.id)));

      // 1. Eliminar de solicitud_cupos
      const { error: errSol } = await supabase
        .from('solicitud_cupos')
        .delete()
        .in('id', idsArray);

      if (errSol) throw errSol;

      // 2. Limpiar vinculaciones si tenían Cédula Escolar o código único provisional
      const cedulasAEliminar = solicitudesAEliminar
        .map(s => s.estudiante_cedula)
        .filter((c): c is string => Boolean(c && (c.startsWith('ESC-') || c.startsWith('SC-'))));

      if (cedulasAEliminar.length > 0) {
        await supabase
          .from('estudiantes_vinculaciones')
          .delete()
          .in('cedula_estudiante', cedulasAEliminar);
      }

      // 3. Registrar auditoría
      await auditar(
        'Gestión de Admisiones',
        'Eliminar Múltiples Solicitudes',
        `Se eliminaron ${total} solicitudes seleccionadas manualmente del listado general`
      );

      // 4. Actualizar estado local
      const idsSet = new Set(idsArray);
      setSolicitudes(prev => prev.filter(s => !idsSet.has(String(s.id))));
      setSeleccionadosListadoGeneral(new Set());

      // 5. Refrescar capacidad
      await cargarCapacidadEscolar();

      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Solicitudes Eliminadas!',
          text: `Se eliminaron con éxito ${total} ${total === 1 ? 'solicitud' : 'solicitudes'}.`,
          confirmButtonColor: '#0284c7',
          timer: 2200
        });
      }
    } catch (err: any) {
      console.error('Error al eliminar solicitudes:', err);
      if (Swal) {
        Swal.fire('Error', 'No se pudieron eliminar las solicitudes: ' + (err.message || 'Error de base de datos'), 'error');
      }
    } finally {
      setEliminandoSolicitudes(false);
    }
  };

  // Solicitud activa para la vista Uno a Uno
  const solicitudUnoAUno = solicitudesFiltradas[indiceUnoAUno] || null;
  const baremoUnoAUno = solicitudUnoAUno ? calcularBaremoPrioridad(solicitudUnoAUno, personalEscuelaMap) : null;

  if (permLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando permisos...</span>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container-fluid py-5 text-center">
        <div className="card border-0 shadow-sm rounded-4 p-5 mx-auto" style={{ maxWidth: '600px', backgroundColor: '#ffffff' }}>
          <i className="bi bi-shield-lock-fill text-danger fs-1 mb-3"></i>
          <h4 className="fw-bold text-dark">Acceso Restringido</h4>
          <p className="text-muted mb-0">
            No posees privilegios suficientes para ingresar al módulo de <b>Gestión de Admisiones</b>. Contacta al administrador del sistema.
          </p>
        </div>
      </div>
    );
  }

  const escuelaCodigo = (filtroEscuela === 'todas' ? (localStorage.getItem('sigae_escuela_codigo') || 'sb') : filtroEscuela);
  const logoPath = `/assets/img/logo_${escuelaCodigo}.png`;

  return (
    <div className="modulo-animado container-fluid px-2 px-sm-3 px-md-4 py-3 animate__animated animate__fadeIn p-0" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* 1. Miga de Pan Chamilo */}
      <ChamiloBreadcrumb
        items={[
          { label: 'Gestión Estudiantil', url: '/categoria/Gesti%C3%B3n%20Estudiantil', icon: 'bi-mortarboard-fill' },
          { label: 'Gestión de Admisiones', icon: 'bi-ui-checks' }
        ]}
      />

      {/* ── 2. CABECERA INSTITUCIONAL CHAMILO TECH ── */}
      <div 
        className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 border-top border-4" 
        style={{ 
          borderColor: '#8B5CF6',
          background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 50%, #f5f3ff 100%)'
        }}
      >
        <div className="p-4 p-md-5">
          <div className="row align-items-center g-4">
            
            {/* Contenedor Dual: Icono 3D Isométrico + Escudo Institucional */}
            <div className="col-12 col-md-auto text-center text-md-start">
              <div className="d-inline-flex align-items-center gap-3 p-2 bg-white rounded-4 shadow-sm border border-purple-subtle" style={{ borderColor: '#ddd6fe' }}>
                <div 
                  className="rounded-4 p-2 d-inline-flex align-items-center justify-content-center shadow-xs" 
                  style={{ 
                    width: '88px', 
                    height: '88px',
                    background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                    border: '1px solid #ddd6fe'
                  }}
                  title="Gestión de Admisiones Chamilo Tech"
                >
                  <IconoGestionAdmisiones size={58} color="#8b5cf6" />
                </div>
                <div 
                  className="rounded-4 p-2 bg-light border d-inline-flex align-items-center justify-content-center shadow-xs" 
                  style={{ width: '88px', height: '88px' }}
                >
                  <img 
                    src={logoPath} 
                    alt="Escudo Institucional" 
                    className="img-fluid"
                    style={{ maxHeight: '72px', objectFit: 'contain' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                  />
                </div>
              </div>
            </div>

            {/* Título y Métricas Clave */}
            <div className="col-12 col-md">
              <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                <span className="badge text-white fw-bold px-3 py-1.5 rounded-pill small shadow-xs" style={{ backgroundColor: '#8B5CF6' }}>
                  <i className="bi bi-mortarboard-fill me-1"></i>Gestión de Admisiones
                </span>
                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs">
                  <i className="bi bi-file-earmark-person-fill text-primary me-1"></i><b>{kpis.total}</b> Solicitudes
                </span>
                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs">
                  <i className="bi bi-check-circle-fill text-success me-1"></i><b>{kpis.aprobados}</b> Aprobados
                </span>
                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs">
                  <i className="bi bi-journal-check text-info me-1"></i><b>{kpis.formalizados}</b> Formalizados
                </span>
                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs">
                  <span className="d-inline-block rounded-circle bg-success me-1.5 animate__animated animate__pulse animate__infinite" style={{ width: '8px', height: '8px' }}></span>
                  <span className="text-success fw-bold">Live</span> / Sincronizado
                </span>
              </div>

              <h1 className="fw-bolder mb-1.5 text-dark" style={{ fontSize: 'calc(1.5rem + 0.7vw)', letterSpacing: '-0.5px' }}>
                Gestión de Admisiones
              </h1>

              <p className="mb-0 text-muted small" style={{ maxWidth: '780px' }}>
                Auditoría y revisión de solicitudes con baremo PDVSA/Comunidad, evaluación uno a uno en vivo, formalización de matrícula física y notificaciones oficiales.
              </p>
            </div>

            {/* Selector de Sede Interactivo */}
            <div className="col-12 col-md-auto text-md-end text-center d-flex flex-column align-items-md-end align-items-center gap-2">
              <div className="d-inline-flex p-1 bg-white rounded-pill border shadow-xs" style={{ borderColor: '#ddd6fe' }}>
                {!esSedeFija && (
                  <button
                    type="button"
                    onClick={() => setFiltroEscuela('todas')}
                    className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${filtroEscuela === 'todas' ? 'text-white shadow-xs' : 'text-muted'}`}
                    style={{
                      backgroundColor: filtroEscuela === 'todas' ? '#8B5CF6' : 'transparent',
                      fontSize: '0.78rem'
                    }}
                  >
                    Todas las Sedes
                  </button>
                )}
                {(!esSedeFija || escuelaUsuarioAsignada === 'sb') && (
                  <button
                    type="button"
                    onClick={() => setFiltroEscuela('sb')}
                    className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${filtroEscuela === 'sb' ? 'text-white shadow-xs' : 'text-muted'}`}
                    style={{
                      backgroundColor: filtroEscuela === 'sb' ? '#8B5CF6' : 'transparent',
                      fontSize: '0.78rem'
                    }}
                  >
                    Santa Bárbara
                  </button>
                )}
                {(!esSedeFija || escuelaUsuarioAsignada === 'lb') && (
                  <button
                    type="button"
                    onClick={() => setFiltroEscuela('lb')}
                    className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${filtroEscuela === 'lb' ? 'text-white shadow-xs' : 'text-muted'}`}
                    style={{
                      backgroundColor: filtroEscuela === 'lb' ? '#8B5CF6' : 'transparent',
                      fontSize: '0.78rem'
                    }}
                  >
                    Libertador Bolívar
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Barra de Herramientas de Admisión Chamilo */}
        <div className="px-4 py-2.5 bg-light border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {!esSoloFormalizador && (
              <>
                <button
                  className="btn btn-white bg-white text-primary border rounded-pill px-3 py-1.5 fw-bold shadow-xs hover-efecto d-flex align-items-center gap-1.5"
                  style={{ fontSize: '0.82rem' }}
                  onClick={() => navigate('/categoria/Gestión%20Estudiantil/Mensajes%20de%20Admisión')}
                  title="Configurar y redactar mensajes oficiales de admisión"
                >
                  <i className="bi bi-chat-heart-fill text-danger"></i>
                  <span>Redactor de Mensajes</span>
                </button>

                <button
                  className="btn btn-success rounded-pill px-3 py-1.5 fw-bold text-white shadow-xs hover-efecto d-flex align-items-center gap-1.5"
                  style={{ fontSize: '0.82rem' }}
                  onClick={exportarExcel}
                >
                  <i className="bi bi-file-earmark-excel-fill"></i>
                  <span>Exportar Excel</span>
                </button>

                <button
                  className="btn rounded-pill px-3.5 py-1.5 fw-bold text-white shadow-xs hover-efecto d-flex align-items-center gap-1.5"
                  style={{ fontSize: '0.82rem', backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }}
                  onClick={() => setModalEstadisticas(true)}
                  title="Ver análisis estadístico, gráficos interactivos y reporte oficial Chamilo"
                >
                  <i className="bi bi-bar-chart-fill"></i>
                  <span>Reporte de Estadística</span>
                </button>
              </>
            )}

            {!esSoloFormalizador && vistaActiva !== 'formalizacion' && (
              <button
                className="btn rounded-pill px-3 py-1.5 fw-bold text-white shadow-xs hover-efecto d-flex align-items-center gap-1.5"
                style={{ fontSize: '0.82rem', backgroundColor: '#0284C7', borderColor: '#0284C7' }}
                onClick={abrirModalRegistroDirecto}
                title="Registrar nuevo aspirante y representante directamente sin solicitud previa web"
              >
                <i className="bi bi-person-plus-fill"></i>
                <span>Admisión Directa / Extemporánea</span>
              </button>
            )}

            <button
              className="btn btn-white bg-white text-muted border rounded-pill px-3 py-1.5 fw-bold shadow-xs hover-efecto d-flex align-items-center gap-1"
              style={{ fontSize: '0.82rem' }}
              onClick={cargarSolicitudes}
              title="Recargar registros y validar nuevas admisiones"
            >
              <i className="bi bi-arrow-clockwise"></i>
              <span>Actualizar</span>
            </button>

            {!esSoloFormalizador && (
              <>
                <button
                  className="btn text-white rounded-pill px-3 py-1.5 fw-bold shadow-xs hover-efecto d-flex align-items-center gap-1.5"
                  style={{ fontSize: '0.82rem', backgroundColor: '#6366F1', borderColor: '#4F46E5' }}
                  onClick={abrirModalHabilitarMasivo}
                  title="Habilitar Acceso Masivo en SIGAE seleccionando aspirantes aprobados"
                >
                  <i className="bi bi-people-fill"></i>
                  <span>Habilitación Masiva</span>
                </button>

                <button
                  className="btn text-white rounded-pill px-3 py-1.5 fw-bold shadow-xs hover-efecto d-flex align-items-center gap-1.5"
                  style={{ fontSize: '0.82rem', backgroundColor: '#10B981', borderColor: '#059669' }}
                  onClick={abrirModalDifusion}
                  title="Difusión Masiva por WhatsApp a Aspirantes con Cupos Aprobados"
                >
                  <i className="bi bi-whatsapp"></i>
                  <span>Difusión WhatsApp</span>
                  {kpis.aprobados + kpis.formalizados > 0 && (
                    <span className="badge bg-white text-success rounded-pill px-1.5 py-0.5" style={{ fontSize: '9.5px' }}>
                      {kpis.aprobados + kpis.formalizados}
                    </span>
                  )}
                </button>

                <button
                  className="btn text-white rounded-pill px-3 py-1.5 fw-bold shadow-xs hover-efecto d-flex align-items-center gap-1.5"
                  style={{ fontSize: '0.82rem', backgroundColor: '#059669', borderColor: '#047857' }}
                  onClick={() => navigate(`/categoria/Diseños/Orientaciones%20Nuevos%20Ingresos?escuela=${filtroEscuela === 'todas' ? 'sb' : filtroEscuela}`)}
                  title="Módulo Completo de Orientaciones Paso a Paso y Despacho Masivo con Escudo Anti-Spam"
                >
                  <i className="bi bi-shield-check"></i>
                  <span>WhatsApp Anti-Spam</span>
                  <span className="badge bg-warning text-dark rounded-pill px-1.5 py-0.5" style={{ fontSize: '9px' }}>
                    NUEVO
                  </span>
                </button>
              </>
            )}
          </div>

          {!esSoloFormalizador && (
            <div className="d-flex align-items-center gap-1.5 flex-wrap">
              <button 
                className="btn btn-white bg-white text-muted border rounded-pill px-2.5 py-1 fw-bold extra-small hover-efecto"
                onClick={detectarDuplicados}
              >
                <i className="bi bi-copy text-warning me-1"></i>
                <span>Duplicados</span>
                {gruposDuplicados.length > 0 && (
                  <span className="badge bg-danger rounded-pill ms-1">{gruposDuplicados.length}</span>
                )}
              </button>

              <button 
                className="btn btn-white bg-white text-muted border rounded-pill px-2.5 py-1 fw-bold extra-small hover-efecto"
                onClick={() => detectarVacios('representante')}
              >
                <i className="bi bi-person-x text-warning me-1"></i>
                <span>Vacíos</span>
              </button>

              <button 
                className="btn btn-white bg-white text-muted border rounded-pill px-2.5 py-1 fw-bold extra-small hover-efecto"
                onClick={detectarRegulares} 
                disabled={detectandoRegulares}
              >
                <i className="bi bi-shield-check text-info me-1"></i>
                <span>Depurar Regulares</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Guía contextual de ayuda estilo Chamilo */}
      <ChamiloHelpCallout
        title="Orientación para el Proceso de Admisión"
        storageKey="gestion_admisiones"
      >
        <p className="mb-1">
          Este centro de admisiones clasifica a los aspirantes según el <strong>Nivel de Prioridad Oficial PDVSA / Comunidad (P1 a P5)</strong>.
          Permite evaluar expedientes uno por uno, validar cupos y vacantes por grado, formalizar la inscripción física y notificar a los representantes mediante WhatsApp.
        </p>
        <small className="text-muted">
          <i className="bi bi-lightbulb-fill text-warning me-1"></i> Tip: Utiliza la pestaña <strong>2. Auditoría Uno por Uno</strong> para revisar y corregir recaudos en tiempo real con visor de documentos adjuntos.
        </small>
      </ChamiloHelpCallout>

      {/* ── SELECTOR DE PESTAÑAS O BANNER DE FORMALIZACIÓN EXCLUSIVO ──────────── */}
      {!esSoloFormalizador ? (
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2 gap-2">
          <ul className="nav nav-pills flex-nowrap overflow-x-auto text-nowrap pb-1 gap-1.5 w-100" style={{ scrollbarWidth: 'none' }}>
            {puedeVerBaremo && (
              <li className="nav-item">
                <button
                  className={`nav-link fw-bold px-3 py-1.5 ${vistaActiva === 'tabla' ? 'active shadow-xs text-white' : 'bg-white text-secondary border'}`}
                  onClick={() => setVistaActiva('tabla')}
                  style={{ backgroundColor: vistaActiva === 'tabla' ? '#8B5CF6' : undefined, fontSize: '13px' }}
                >
                  <i className="bi bi-table me-1.5"></i>
                  <span>1. Listado General <span className="d-none d-sm-inline">de Solicitudes</span></span>
                </button>
              </li>
            )}
            {puedeVerUnoAUno && (
              <li className="nav-item">
                <button
                  className={`nav-link fw-bold px-3 py-1.5 ${vistaActiva === 'uno_a_uno' ? 'active shadow-xs text-white' : 'bg-white text-secondary border'}`}
                  onClick={() => cambiarVistaUnoAUno(indiceUnoAUno)}
                  style={{ backgroundColor: vistaActiva === 'uno_a_uno' ? '#0284C7' : undefined, fontSize: '13px' }}
                >
                  <i className="bi bi-person-bounding-box me-1.5"></i>
                  <span>2. Auditoría <span className="d-none d-sm-inline">Uno por Uno</span></span>
                </button>
              </li>
            )}
            {puedeVerFormalizacion && (
              <li className="nav-item">
                <button
                  className={`nav-link fw-bold px-3 py-1.5 ${vistaActiva === 'formalizacion' ? 'active shadow-xs text-white' : 'bg-white text-secondary border'}`}
                  onClick={() => setVistaActiva('formalizacion')}
                  style={{ backgroundColor: vistaActiva === 'formalizacion' ? '#0D9488' : undefined, fontSize: '13px' }}
                >
                  <i className="bi bi-journal-check me-1.5"></i>
                  <span>3. Formalización <span className="d-none d-sm-inline">Física</span></span>
                  <span className="badge bg-white text-dark ms-1.5" style={{ fontSize: '10px' }}>
                    {solicitudesAceptadasParaFormalizar.length}
                  </span>
                </button>
              </li>
            )}
          </ul>

          {vistaActiva === 'uno_a_uno' && (
            <div className="d-none d-md-flex align-items-center gap-2 flex-shrink-0">
              <span className="badge bg-light text-dark border px-2.5 py-1.5 fw-bold">
                Aspirante {solicitudesFiltradas.length > 0 ? indiceUnoAUno + 1 : 0} de {solicitudesFiltradas.length}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="d-flex align-items-center justify-content-between mb-3 p-3 bg-white rounded-3 border shadow-xs flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2.5">
            <div className="rounded-circle p-2 d-flex align-items-center justify-content-center text-white shadow-xs" style={{ backgroundColor: '#0D9488', width: '40px', height: '40px' }}>
              <i className="bi bi-journal-check fs-5"></i>
            </div>
            <div>
              <h6 className="mb-0 fw-bold text-dark">Taquilla de Formalización Presencial de Matrícula</h6>
              <small className="text-muted">Módulo exclusivo de verificación y formalización física de cupos admitidos</small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge px-3 py-2 rounded-pill fw-bold text-white shadow-xs" style={{ backgroundColor: '#0D9488', fontSize: '0.82rem' }}>
              <i className="bi bi-person-check-fill me-1"></i> {kpisFormalizacion.total} Aspirantes Admitidos
            </span>
          </div>
        </div>
      )}

      {/* ── TARJETAS KPI / MÉTRICAS COMPACTAS ─────────────────────────────────── */}
      {/* ── TARJETAS KPI / MÉTRICAS COMPACTAS ─────────────────────────────────── */}
      {!esSoloFormalizador ? (
        filtroGrado !== 'todos' ? (
          <div className="mb-3">
            {/* Banner Informativo del Grado Filtrado */}
            <div className="d-flex align-items-center justify-content-between p-2.5 px-3 mb-2 rounded-3 border bg-white shadow-xs flex-wrap gap-2" style={{ borderLeft: '5px solid #4F46E5' }}>
              <div className="d-flex align-items-center gap-2">
                <div className="rounded-circle p-1.5 d-flex align-items-center justify-content-center text-white shadow-xs" style={{ backgroundColor: '#4F46E5', width: '34px', height: '34px' }}>
                  <i className="bi bi-mortarboard-fill fs-6"></i>
                </div>
                <div>
                  <div className="fw-bold text-dark d-flex align-items-center gap-2 flex-wrap" style={{ fontSize: '0.92rem' }}>
                    <span>Capacidad y Matrícula: <span className="text-primary">{filtroGrado}</span></span>
                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-0.5 extra-small">
                      {metricasCapacidadGrado.escuelaNombre}
                    </span>
                  </div>
                  <div className="text-muted extra-small">
                    Capacidad instalada vs. estudiantes regulares inscritos + nuevos aspirantes admitidos y formalizados
                  </div>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="badge bg-light text-dark border px-2.5 py-1.5 extra-small">
                  <i className="bi bi-file-earmark-person me-1 text-primary"></i>
                  Solicitudes en grado: <strong>{metricasCapacidadGrado.totalSolicitudes}</strong>
                  {metricasCapacidadGrado.solicitudesPendientes > 0 && (
                    <span className="text-warning ms-1">({metricasCapacidadGrado.solicitudesPendientes} pend.)</span>
                  )}
                  {metricasCapacidadGrado.solicitudesRechazadas > 0 && (
                    <span className="text-danger ms-1">({metricasCapacidadGrado.solicitudesRechazadas} rech.)</span>
                  )}
                </span>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm py-1 px-2 extra-small"
                  onClick={() => setFiltroGrado('todos')}
                  title="Ver métricas globales de todos los grados"
                >
                  <i className="bi bi-x-circle me-1"></i>Ver todos los grados
                </button>
              </div>
            </div>

            {/* Fila de 6 Tarjetas Específicas de Capacidad del Grado */}
            <div className="row g-2">
              {/* 1. Capacidad Total */}
              <div className="col-6 col-md-4 col-xl-2">
                <div className="card border-0 shadow-xs rounded-3 h-100 bg-white" style={{ borderLeft: '4px solid #8B5CF6' }}>
                  <div className="card-body p-2 p-sm-2.5">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="text-muted extra-small fw-bold text-uppercase text-truncate" style={{ color: '#8B5CF6' }}>
                        Capacidad
                      </div>
                      <span className="badge bg-light text-dark border extra-small px-1.5 py-0.5" style={{ fontSize: '10px' }}>
                        {metricasCapacidadGrado.totalSalones} {metricasCapacidadGrado.totalSalones === 1 ? 'salón' : 'salones'}
                      </span>
                    </div>
                    <div className="fs-5 fw-bold text-dark mt-0.5 lh-1">{metricasCapacidadGrado.capacidadTotal}</div>
                    <div className="text-muted extra-small mt-1" style={{ fontSize: '11px' }}>Puestos instalados</div>
                  </div>
                </div>
              </div>

              {/* 2. Estudiantes Regulares */}
              <div className="col-6 col-md-4 col-xl-2">
                <div className="card border-0 shadow-xs rounded-3 h-100 bg-white" style={{ borderLeft: '4px solid #2563eb' }}>
                  <div className="card-body p-2 p-sm-2.5">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="extra-small fw-bold text-uppercase text-truncate" style={{ color: '#2563eb' }}>
                        Regulares
                      </div>
                      <i className="bi bi-people-fill extra-small" style={{ color: '#2563eb' }}></i>
                    </div>
                    <div className="fs-5 fw-bold mt-0.5 lh-1" style={{ color: '#2563eb' }}>
                      {metricasCapacidadGrado.estudiantesRegulares}
                    </div>
                    <div className="text-muted extra-small mt-1" style={{ fontSize: '11px' }}>Matrícula existente</div>
                  </div>
                </div>
              </div>

              {/* 3. Aprobados (Nuevos Cupos Asignados) */}
              <div className="col-6 col-md-4 col-xl-2">
                <div className="card border-0 shadow-xs rounded-3 h-100 bg-white" style={{ borderLeft: '4px solid #16a34a' }}>
                  <div className="card-body p-2 p-sm-2.5">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="extra-small fw-bold text-uppercase text-success text-truncate">
                        Aprobados
                      </div>
                      <i className="bi bi-check-circle-fill text-success extra-small"></i>
                    </div>
                    <div className="fs-5 fw-bold text-success mt-0.5 lh-1">
                      {metricasCapacidadGrado.aprobados}
                    </div>
                    <div className="text-muted extra-small mt-1" style={{ fontSize: '11px' }}>Cupo asignado</div>
                  </div>
                </div>
              </div>

              {/* 4. Formalizados (Inscripción Física en Plantel) */}
              <div className="col-6 col-md-4 col-xl-2">
                <div className="card border-0 shadow-xs rounded-3 h-100 bg-white" style={{ borderLeft: '4px solid #0D9488' }}>
                  <div className="card-body p-2 p-sm-2.5">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="extra-small fw-bold text-uppercase text-truncate" style={{ color: '#0D9488' }}>
                        Formalizados
                      </div>
                      <i className="bi bi-patch-check-fill extra-small" style={{ color: '#0D9488' }}></i>
                    </div>
                    <div className="fs-5 fw-bold mt-0.5 lh-1" style={{ color: '#0D9488' }}>
                      {metricasCapacidadGrado.formalizados}
                    </div>
                    <div className="text-muted extra-small mt-1" style={{ fontSize: '11px' }}>En plantel físico</div>
                  </div>
                </div>
              </div>

              {/* 5. Total Ocupados */}
              <div className="col-6 col-md-4 col-xl-2">
                <div className="card border-0 shadow-xs rounded-3 h-100 bg-white" style={{ borderLeft: '4px solid #ea580c' }}>
                  <div className="card-body p-2 p-sm-2.5">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="extra-small fw-bold text-uppercase text-truncate" style={{ color: '#ea580c' }}>
                        Total Ocupados
                      </div>
                      <span className="badge rounded-pill extra-small px-1.5" style={{ backgroundColor: '#ffedd5', color: '#c2410c', fontSize: '10px' }}>
                        {metricasCapacidadGrado.porcentajeOcupacion}%
                      </span>
                    </div>
                    <div className="fs-5 fw-bold mt-0.5 lh-1" style={{ color: '#ea580c' }}>
                      {metricasCapacidadGrado.totalOcupados}
                    </div>
                    <div className="text-muted extra-small mt-1" style={{ fontSize: '11px' }}>Reg + Aprob + Form</div>
                  </div>
                </div>
              </div>

              {/* 6. Cupos Disponibles / Vacantes Libres */}
              <div className="col-6 col-md-4 col-xl-2">
                <div className="card border-0 shadow-xs rounded-3 h-100 bg-white" style={{ borderLeft: `4px solid ${metricasCapacidadGrado.cuposDisponibles > 0 ? '#059669' : '#dc2626'}` }}>
                  <div className="card-body p-2 p-sm-2.5">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className={`extra-small fw-bold text-uppercase text-truncate ${metricasCapacidadGrado.cuposDisponibles > 0 ? 'text-success' : 'text-danger'}`}>
                        Disponibles
                      </div>
                      <i className={`bi ${metricasCapacidadGrado.cuposDisponibles > 0 ? 'bi-door-open-fill text-success' : 'bi-slash-circle-fill text-danger'} extra-small`}></i>
                    </div>
                    <div className={`fs-5 fw-bold mt-0.5 lh-1 ${metricasCapacidadGrado.cuposDisponibles > 0 ? 'text-success' : 'text-danger'}`}>
                      {metricasCapacidadGrado.cuposDisponibles}
                    </div>
                    <div className="text-muted extra-small mt-1" style={{ fontSize: '11px' }}>
                      {metricasCapacidadGrado.cuposDisponibles > 0 ? 'Vacantes libres' : 'Capacidad copada'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desglose por Escuela si está en modo Consolidado (Ambas Escuelas) */}
            {filtroEscuela === 'todas' && metricasCapacidadGrado.desgloseSB && metricasCapacidadGrado.desgloseLB && (
              <div className="row g-2 mt-1">
                <div className="col-12 col-md-6">
                  <div className="p-2 px-3 rounded-2 border bg-light d-flex align-items-center justify-content-between flex-wrap gap-1 extra-small">
                    <span className="fw-bold text-dark">
                      <i className="bi bi-building me-1 text-primary"></i> U.E. Santa Bárbara:
                    </span>
                    <div className="d-flex align-items-center gap-1.5 text-muted flex-wrap">
                      <span>Cap: <strong className="text-dark">{metricasCapacidadGrado.desgloseSB?.capacidadTotal ?? 0}</strong> ({metricasCapacidadGrado.desgloseSB?.totalSalones ?? 0} {(metricasCapacidadGrado.desgloseSB?.totalSalones ?? 0) === 1 ? 'salón' : 'salones'})</span>
                      <span>|</span>
                      <span>Reg: <strong style={{ color: '#2563eb' }}>{metricasCapacidadGrado.desgloseSB?.estudiantesRegulares ?? 0}</strong></span>
                      <span>|</span>
                      <span>Aprob: <strong className="text-success">{metricasCapacidadGrado.desgloseSB?.aprobados ?? 0}</strong></span>
                      <span>|</span>
                      <span>Form: <strong style={{ color: '#0D9488' }}>{metricasCapacidadGrado.desgloseSB?.formalizados ?? 0}</strong></span>
                      <span>|</span>
                      <span className={(metricasCapacidadGrado.desgloseSB?.cuposDisponibles ?? 0) > 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                        Disp: <strong>{metricasCapacidadGrado.desgloseSB?.cuposDisponibles ?? 0}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="p-2 px-3 rounded-2 border bg-light d-flex align-items-center justify-content-between flex-wrap gap-1 extra-small">
                    <span className="fw-bold text-dark">
                      <i className="bi bi-building me-1 text-primary"></i> U.E. Libertador Bolívar:
                    </span>
                    <div className="d-flex align-items-center gap-1.5 text-muted flex-wrap">
                      <span>Cap: <strong className="text-dark">{metricasCapacidadGrado.desgloseLB?.capacidadTotal ?? 0}</strong> ({metricasCapacidadGrado.desgloseLB?.totalSalones ?? 0} {(metricasCapacidadGrado.desgloseLB?.totalSalones ?? 0) === 1 ? 'salón' : 'salones'})</span>
                      <span>|</span>
                      <span>Reg: <strong style={{ color: '#2563eb' }}>{metricasCapacidadGrado.desgloseLB?.estudiantesRegulares ?? 0}</strong></span>
                      <span>|</span>
                      <span>Aprob: <strong className="text-success">{metricasCapacidadGrado.desgloseLB?.aprobados ?? 0}</strong></span>
                      <span>|</span>
                      <span>Form: <strong style={{ color: '#0D9488' }}>{metricasCapacidadGrado.desgloseLB?.formalizados ?? 0}</strong></span>
                      <span>|</span>
                      <span className={(metricasCapacidadGrado.desgloseLB?.cuposDisponibles ?? 0) > 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                        Disp: <strong>{metricasCapacidadGrado.desgloseLB?.cuposDisponibles ?? 0}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="row g-2 mb-3">
            <div className="col-6 col-md-4 col-xl-2">
              <div className="card border-0 shadow-xs rounded-3 h-100 bg-white" style={{ borderLeft: '4px solid #8B5CF6' }}>
                <div className="card-body p-2 p-sm-2.5">
                  <div className="text-muted extra-small fw-bold text-uppercase text-truncate">Total Solicitudes</div>
                  <div className="fs-5 fw-bold text-dark mt-0.5 lh-1">{kpis.total}</div>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-4 col-xl-2">
              <div className="card border-0 shadow-xs rounded-3 h-100 bg-white" style={{ borderLeft: '4px solid #16a34a' }}>
                <div className="card-body p-2 p-sm-2.5">
                  <div className="text-muted extra-small fw-bold text-uppercase text-success text-truncate">Aprobados</div>
                  <div className="fs-5 fw-bold text-success mt-0.5 lh-1">{kpis.aprobados}</div>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-4 col-xl-2">
              <div className="card border-0 shadow-xs rounded-3 h-100 bg-white" style={{ borderLeft: '4px solid #0D9488' }}>
                <div className="card-body p-2 p-sm-2.5">
                  <div className="text-muted extra-small fw-bold text-uppercase text-truncate" style={{ color: '#0D9488' }}>Formalizados</div>
                  <div className="fs-5 fw-bold mt-0.5 lh-1" style={{ color: '#0D9488' }}>{kpis.formalizados}</div>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-4 col-xl-2">
              <div className="card border-0 shadow-xs rounded-3 h-100 bg-white" style={{ borderLeft: '4px solid #0284C7' }}>
                <div className="card-body p-2 p-sm-2.5">
                  <div className="text-muted extra-small fw-bold text-uppercase text-primary text-truncate">Aptos Calificados</div>
                  <div className="fs-5 fw-bold text-primary mt-0.5 lh-1">{kpis.aptos}</div>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-4 col-xl-2">
              <div className="card border-0 shadow-xs rounded-3 h-100 bg-white" style={{ borderLeft: '4px solid #eab308' }}>
                <div className="card-body p-2 p-sm-2.5">
                  <div className="text-muted extra-small fw-bold text-uppercase text-warning text-truncate">Pendientes</div>
                  <div className="fs-5 fw-bold text-warning mt-0.5 lh-1">{kpis.pendientes}</div>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-4 col-xl-2">
              <div className="card border-0 shadow-xs rounded-3 h-100 bg-white" style={{ borderLeft: '4px solid #dc2626' }}>
                <div className="card-body p-2 p-sm-2.5">
                  <div className="text-muted extra-small fw-bold text-uppercase text-danger text-truncate">Rechazados</div>
                  <div className="fs-5 fw-bold text-danger mt-0.5 lh-1">{kpis.rechazados}</div>
                </div>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="row g-2 mb-3">
          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-xs rounded-3 h-100 bg-white" style={{ borderLeft: '5px solid #0D9488' }}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-muted small fw-bold text-uppercase">Total Admitidos para Formalizar</div>
                    <div className="fs-3 fw-bold mt-1 lh-1" style={{ color: '#0D9488' }}>{kpisFormalizacion.total}</div>
                  </div>
                  <div className="rounded-circle p-2 bg-light text-muted">
                    <i className="bi bi-people-fill fs-4" style={{ color: '#0D9488' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-xs rounded-3 h-100 bg-white" style={{ borderLeft: '5px solid #eab308' }}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-muted small fw-bold text-uppercase text-warning">Pendientes por Consignar Físico</div>
                    <div className="fs-3 fw-bold text-warning mt-1 lh-1">{kpisFormalizacion.pendientes}</div>
                  </div>
                  <div className="rounded-circle p-2 bg-light text-muted">
                    <i className="bi bi-clock-history fs-4 text-warning"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card border-0 shadow-xs rounded-3 h-100 bg-white" style={{ borderLeft: '5px solid #16a34a' }}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-muted small fw-bold text-uppercase text-success">Formalizados en Plantel</div>
                    <div className="fs-3 fw-bold text-success mt-1 lh-1">{kpisFormalizacion.formalizados}</div>
                  </div>
                  <div className="rounded-circle p-2 bg-light text-muted">
                    <i className="bi bi-check-circle-fill fs-4 text-success"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BARRA DE FILTROS BAREMO Y MULTICRITERIO (Visible en pestañas 1 y 2) ─── */}
      {vistaActiva !== 'formalizacion' && (
        <div className="card border-0 shadow-sm rounded-3 mb-3 bg-white">
          <div className="card-body p-2.5 p-md-3">
            {/* Fila principal: Búsqueda rápida + Escuela + Botón de Filtros Avanzados */}
            <div className="row g-2 align-items-center">
              {/* Buscador general optimizado */}
              <div className="col-12 col-md-7 col-lg-7">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light text-muted border-end-0">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Buscar por aspirante, cédula, representante o código..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                  />
                  {busqueda && (
                    <button
                      className="btn btn-outline-secondary border-start-0"
                      type="button"
                      onClick={() => setBusqueda('')}
                      title="Limpiar búsqueda"
                    >
                      <i className="bi bi-x-circle-fill text-muted"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Selector de Grado + Filtros Avanzados */}
              <div className="col-12 col-md-5 col-lg-5 d-flex align-items-center gap-1.5">
                <div className="input-group input-group-sm flex-grow-1">
                  <span className="input-group-text bg-light text-muted">
                    <i className="bi bi-mortarboard"></i>
                  </span>
                  <select
                    className="form-select form-select-sm"
                    value={filtroGrado}
                    onChange={e => setFiltroGrado(e.target.value)}
                    title="Filtrar por Grado"
                  >
                    <option value="todos">Todos los Grados</option>
                    {opcionesGradoEnriquecidos.map(grd => (
                      <option key={grd} value={grd}>{grd}</option>
                    ))}
                  </select>
                </div>

                {/* Botón Alternar Filtros Avanzados */}
                <button
                  type="button"
                  className={`btn btn-sm text-nowrap fw-bold d-flex align-items-center gap-1.5 shadow-xs ${
                    filtrosActivosCount > 0
                      ? 'btn-primary text-white'
                      : filtrosPanelAbierto
                      ? 'btn-dark'
                      : 'btn-outline-secondary'
                  }`}
                  onClick={() => setFiltrosPanelAbierto(!filtrosPanelAbierto)}
                  title={filtrosPanelAbierto ? 'Ocultar panel de filtros' : 'Abrir más filtros'}
                >
                  <i className="bi bi-funnel-fill"></i>
                  <span className="d-none d-sm-inline">Filtros</span>
                  {filtrosActivosCount > 0 && (
                    <span className="badge bg-white text-primary rounded-pill px-1.5 py-0.5" style={{ fontSize: '10px' }}>
                      {filtrosActivosCount}
                    </span>
                  )}
                  <i className={`bi bi-chevron-${filtrosPanelAbierto ? 'up' : 'down'} extra-small`}></i>
                </button>
              </div>
            </div>

            {/* Chips de Filtros Activos con eliminación rápida en 1 tap */}
            {filtrosActivosCount > 0 && (
              <div className="d-flex align-items-center flex-wrap gap-1.5 mt-2 pt-2 border-top">
                <span className="extra-small text-muted fw-bold me-1">
                  <i className="bi bi-check2-all text-primary me-1"></i>Activos:
                </span>

                {filtroEscuela !== 'todas' && (
                  <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2 py-1 extra-small d-inline-flex align-items-center gap-1">
                    Escuela: {filtroEscuela === 'sb' ? 'Santa Bárbara' : 'Libertador Bolívar'}
                    <button type="button" className="btn-close btn-close-white ms-1" style={{ fontSize: '7px' }} onClick={() => setFiltroEscuela('todas')}></button>
                  </span>
                )}

                {filtroGrado !== 'todos' && (
                  <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle rounded-pill px-2 py-1 extra-small d-inline-flex align-items-center gap-1">
                    Grado: {filtroGrado}
                    <button type="button" className="btn-close ms-1" style={{ fontSize: '7px' }} onClick={() => setFiltroGrado('todos')}></button>
                  </span>
                )}

                {filtroPrioridad !== 'todas' && (
                  <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-2 py-1 extra-small d-inline-flex align-items-center gap-1">
                    Prioridad: {filtroPrioridad}
                    <button type="button" className="btn-close ms-1" style={{ fontSize: '7px' }} onClick={() => setFiltroPrioridad('todas')}></button>
                  </span>
                )}

                {filtroAptitud !== 'todas' && (
                  <span className="badge bg-secondary-subtle text-dark border rounded-pill px-2 py-1 extra-small d-inline-flex align-items-center gap-1">
                    Aptitud: {filtroAptitud}
                    <button type="button" className="btn-close ms-1" style={{ fontSize: '7px' }} onClick={() => setFiltroAptitud('todas')}></button>
                  </span>
                )}

                {filtroEstado !== 'todos' && (
                  <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle rounded-pill px-2 py-1 extra-small d-inline-flex align-items-center gap-1">
                    Estatus: {filtroEstado}
                    <button type="button" className="btn-close ms-1" style={{ fontSize: '7px' }} onClick={() => setFiltroEstado('todos')}></button>
                  </span>
                )}

                {filtroNomina !== 'todas' && (
                  <span className="badge bg-light text-dark border rounded-pill px-2 py-1 extra-small d-inline-flex align-items-center gap-1">
                    Nómina: {filtroNomina}
                    <button type="button" className="btn-close ms-1" style={{ fontSize: '7px' }} onClick={() => setFiltroNomina('todas')}></button>
                  </span>
                )}

                {filtroLocalidad !== 'todas' && (
                  <span className="badge bg-light text-dark border rounded-pill px-2 py-1 extra-small d-inline-flex align-items-center gap-1">
                    Localidad: {filtroLocalidad}
                    <button type="button" className="btn-close ms-1" style={{ fontSize: '7px' }} onClick={() => setFiltroLocalidad('todas')}></button>
                  </span>
                )}

                {filtroCondicionLaboral !== 'todas' && (
                  <span className="badge bg-light text-dark border rounded-pill px-2 py-1 extra-small d-inline-flex align-items-center gap-1">
                    Condición: {filtroCondicionLaboral}
                    <button type="button" className="btn-close ms-1" style={{ fontSize: '7px' }} onClick={() => setFiltroCondicionLaboral('todas')}></button>
                  </span>
                )}

                {filtroWhatsApp !== 'todos' && (
                  <span className="badge bg-success-subtle text-success border rounded-pill px-2 py-1 extra-small d-inline-flex align-items-center gap-1">
                    WA: {filtroWhatsApp === 'notificado' ? 'Notificados' : 'Sin Notificar'}
                    <button type="button" className="btn-close ms-1" style={{ fontSize: '7px' }} onClick={() => setFiltroWhatsApp('todos')}></button>
                  </span>
                )}

                {busqueda && (
                  <span className="badge bg-dark-subtle text-dark border rounded-pill px-2 py-1 extra-small d-inline-flex align-items-center gap-1">
                    Texto: "{busqueda.length > 15 ? busqueda.substring(0, 15) + '...' : busqueda}"
                    <button type="button" className="btn-close ms-1" style={{ fontSize: '7px' }} onClick={() => setBusqueda('')}></button>
                  </span>
                )}

                <button
                  type="button"
                  className="btn btn-link text-danger p-0 extra-small fw-bold text-decoration-none ms-auto"
                  onClick={limpiarFiltros}
                >
                  <i className="bi bi-trash3 me-1"></i>Limpiar Todo
                </button>
              </div>
            )}

            {/* Panel Plegable con Todos los Filtros Avanzados */}
            {filtrosPanelAbierto && (
              <div className="mt-3 pt-3 border-top bg-light p-3 rounded-3">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="fw-bold small text-dark d-flex align-items-center gap-1.5">
                    <i className="bi bi-sliders text-primary"></i> Filtros Multicriterio
                  </span>
                  <button
                    type="button"
                    className="btn btn-link btn-sm text-secondary p-0 extra-small text-decoration-none"
                    onClick={limpiarFiltros}
                  >
                    Restablecer valores
                  </button>
                </div>

                <div className="row g-2.5">
                  <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                    <label className="form-label extra-small fw-bold text-secondary mb-1">
                      <i className="bi bi-sort-numeric-down me-1"></i> Nivel de Prioridad
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={filtroPrioridad}
                      onChange={e => setFiltroPrioridad(e.target.value)}
                    >
                      <option value="todas">Todos los Niveles</option>
                      <option value="P0">P0 - Instrucción Jerárquica (VIP)</option>
                      <option value="P1">P1 - Hijos de Docentes y Trabajadores</option>
                      <option value="P2">P2 - Hijos Contractual (Entorno)</option>
                      <option value="P3">P3 - Hijos No Contractual (Entorno)</option>
                      <option value="P4">P4 - Hijos Contractual (Foráneo)</option>
                      <option value="P5">P5 - Hijos No Contractual (Foráneo)</option>
                      <option value="P6">P6 - Otros Parentescos (Entorno)</option>
                      <option value="P7">P7 - Otros Parentescos (Foráneo)</option>
                      <option value="P8">P8 - Comunidad General</option>
                    </select>
                  </div>

                  <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                    <label className="form-label extra-small fw-bold text-secondary mb-1">
                      <i className="bi bi-patch-check me-1"></i> Aptitud Técnica
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={filtroAptitud}
                      onChange={e => setFiltroAptitud(e.target.value)}
                    >
                      <option value="todas">Todas las Aptitudes</option>
                      <option value="Apto">Apto</option>
                      <option value="No Apto">No Apto</option>
                      <option value="En Evaluación">En Evaluación</option>
                      <option value="Sin Evaluar">Sin Evaluar</option>
                    </select>
                  </div>

                  <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                    <label className="form-label extra-small fw-bold text-secondary mb-1">
                      <i className="bi bi-flag me-1"></i> Estatus Oficial
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={filtroEstado}
                      onChange={e => setFiltroEstado(e.target.value)}
                    >
                      <option value="todos">Todos los Estados</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Evaluación">En Evaluación</option>
                      <option value="Aprobado">Aprobado</option>
                      <option value="Formalizado">Formalizado</option>
                      <option value="Rechazado">Rechazado</option>
                    </select>
                  </div>

                  <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                    <label className="form-label extra-small fw-bold text-secondary mb-1">
                      <i className="bi bi-person-badge me-1"></i> Nómina
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={filtroNomina}
                      onChange={e => setFiltroNomina(e.target.value)}
                    >
                      <option value="todas">Todas las Nóminas</option>
                      {opcionesNominaEnriquecidas.map(nom => (
                        <option key={nom} value={nom}>{nom}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                    <label className="form-label extra-small fw-bold text-secondary mb-1">
                      <i className="bi bi-geo-alt me-1"></i> Localidad Trabajo
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={filtroLocalidad}
                      onChange={e => setFiltroLocalidad(e.target.value)}
                    >
                      <option value="todas">Todas las Localidades</option>
                      {opcionesLocalidadEnriquecidas.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                    <label className="form-label extra-small fw-bold text-secondary mb-1">
                      <i className="bi bi-person-workspace me-1"></i> Condición Laboral
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={filtroCondicionLaboral}
                      onChange={e => setFiltroCondicionLaboral(e.target.value)}
                    >
                      <option value="todas">Todas las Condiciones</option>
                      {opcionesCondicionEnriquecidas.map(con => (
                        <option key={con} value={con}>{con}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-sm-6 col-md-4 col-lg-3">
                    <label className="form-label extra-small fw-bold text-secondary mb-1">
                      <i className="bi bi-whatsapp text-success me-1"></i> Notificación WhatsApp
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={filtroWhatsApp}
                      onChange={e => setFiltroWhatsApp(e.target.value as any)}
                    >
                      <option value="todos">Todos los Estados</option>
                      <option value="notificado">💬 Notificados por WhatsApp</option>
                      <option value="sin_notificar">⏳ Pendientes por Notificar</option>
                    </select>
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-2 pt-2 border-top">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm px-3 fw-bold"
                    onClick={() => setFiltrosPanelAbierto(false)}
                  >
                    <i className="bi bi-check2 me-1"></i> Aplicar y Ocultar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}



      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* VISTA 1: TABLA GENERAL Y BAREMO                                           */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {vistaActiva === 'tabla' && (
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-header bg-white py-3 border-bottom d-flex flex-column gap-2">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 w-100">
              <div className="fw-bold text-dark d-flex align-items-center gap-2">
                <span>Listado General de Aspirantes</span>
                <span className="badge bg-primary rounded-pill px-2.5 py-1">
                  {solicitudesFiltradas.length} {solicitudesFiltradas.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>
              <small className="text-muted">
                Orden automático: <b>P0 (Jerarquía) &gt; P1 (Docentes y Trabajadores Escuela) &gt; P2..P8</b> + Antigüedad de solicitud
              </small>
            </div>

            {/* BARRA DE ACCIONES MASIVAS CUANDO HAY SELECCIÓN */}
            {seleccionadosListadoGeneral.size > 0 && (
              <div className="bg-danger-subtle border border-danger-subtle py-2 px-3 rounded-2 d-flex align-items-center justify-content-between flex-wrap gap-2 w-100">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-check2-square text-danger fs-5"></i>
                  <span className="fw-bold text-danger small">
                    {seleccionadosListadoGeneral.size} {seleccionadosListadoGeneral.size === 1 ? 'solicitud seleccionada' : 'solicitudes seleccionadas'}
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary py-1 px-2.5 extra-small fw-bold"
                    onClick={() => setSeleccionadosListadoGeneral(new Set())}
                    disabled={eliminandoSolicitudes}
                  >
                    Deseleccionar todas
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger py-1 px-3 extra-small fw-bold d-flex align-items-center gap-1 shadow-xs"
                    onClick={eliminarSolicitudesSeleccionadas}
                    disabled={eliminandoSolicitudes}
                  >
                    {eliminandoSolicitudes ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        <span>Eliminando...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-trash-fill"></i>
                        <span>Eliminar Seleccionadas ({seleccionadosListadoGeneral.size})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-2" role="status"></div>
                <p className="text-muted small">Cargando registros de admisiones...</p>
              </div>
            ) : solicitudesFiltradas.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
                <h6 className="fw-bold text-dark mb-1">No se encontraron solicitudes</h6>
                <p className="text-muted small mb-3">No hay registros con los filtros aplicados.</p>
                <button className="btn btn-sm btn-outline-primary" onClick={limpiarFiltros}>
                  Restablecer Filtros
                </button>
              </div>
            ) : (
              <>
                {/* ── VISTA ESCRITORIO: TABLA COMPLETA (≥ lg) ──────────────────── */}
                <div className="table-responsive d-none d-lg-block">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '38px' }} className="text-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={todosFiltradosSeleccionados}
                            onChange={toggleSeleccionarTodo}
                            title="Seleccionar o deseleccionar todas las solicitudes filtradas"
                          />
                        </th>
                        <th style={{ width: '35px' }} className="text-center text-muted small">#</th>
                        <th style={{ width: '135px' }}>Prioridad / Nivel</th>
                        <th>Código Único</th>
                        <th>Escuela</th>
                        <th>Aspirante</th>
                        <th>Grado</th>
                        <th>Representante</th>
                        <th>Nómina / Condición</th>
                        <th className="text-center">Aptitud</th>
                        <th className="text-center">Estatus</th>
                        <th className="text-end" style={{ width: '160px' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {solicitudesFiltradas.map((sol, idx) => {
                        const baremo = calcularBaremoPrioridad(sol, personalEscuelaMap);
                        const nomEst = nombreCompleto(sol.estudiante_nombres, sol.estudiante_apellidos);
                        const nomRep = nombreCompleto(sol.representante_nombres, sol.representante_apellidos);

                        return (
                          <tr key={sol.id || sol.codigo_unico} className={seleccionadosListadoGeneral.has(String(sol.id)) ? 'table-danger' : undefined}>
                            <td className="text-center">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={seleccionadosListadoGeneral.has(String(sol.id))}
                                onChange={() => toggleSeleccionarSolicitud(sol.id)}
                              />
                            </td>
                            <td className="text-center fw-bold text-muted small">{idx + 1}</td>
                            <td>
                              <div className="d-flex flex-column gap-0.5">
                                <span
                                  className="badge fw-bold text-white d-inline-block text-truncate"
                                  style={{ backgroundColor: baremo.badgeBg, maxWidth: '130px', fontSize: '11px' }}
                                  title={baremo.descripcion}
                                >
                                  {baremo.codigo}: {baremo.etiqueta.split('(')[0]}
                                </span>
                                {sol.instruccion_jerarquica && (
                                  <span className="badge text-white extra-small" style={{ backgroundColor: '#EC4899', fontSize: '9.5px' }}>
                                    <i className="bi bi-star-fill me-1"></i> Jerarquía
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="fw-bold text-primary font-monospace">{sol.codigo_unico || 'N/A'}</span>
                            </td>
                            <td>
                              <span className="badge bg-light text-dark border">
                                {sol.codigo_escuela?.toUpperCase() === 'SB' ? 'Santa Bárbara' : 'Libertador B.'}
                              </span>
                            </td>
                            <td>
                              <div className="fw-bold text-dark">{nomEst}</div>
                              <div className="text-muted extra-small">C.I: {sol.estudiante_cedula || 'En trámite'}</div>
                              {(() => {
                                const acc = verificarAccesoHabilitado(sol, estudiantesMatriculaBD);
                                return acc.habilitado ? (
                                  <span
                                    className="badge rounded-pill extra-small px-2 py-0.5 fw-bold d-inline-flex align-items-center gap-1 mt-1 shadow-xs"
                                    style={{ backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', fontSize: '9.5px' }}
                                    title={`Acceso habilitado en SIGAE${acc.fecha ? ` el ${acc.fecha}` : ''}`}
                                  >
                                    <i className="bi bi-person-check-fill"></i> Acceso Habilitado
                                  </span>
                                ) : null;
                              })()}
                              {(() => {
                                const docsSol = obtenerDocumentosSolicitud(sol);
                                return docsSol.length > 0 ? (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-link p-0 text-decoration-none fw-bold extra-small mt-0.5 d-inline-flex align-items-center gap-1 text-primary"
                                    onClick={() => abrirVisorDocumentos(sol, 0)}
                                    title="Ver documentos adjuntos"
                                  >
                                    <i className="bi bi-paperclip fs-6 text-danger"></i>
                                    <span>{docsSol.length} {docsSol.length === 1 ? 'recaudo' : 'recaudos'}</span>
                                  </button>
                                ) : (
                                  <span className="text-muted extra-small d-block">Sin adjuntos</span>
                                );
                              })()}
                            </td>
                            <td>
                              <span className="badge bg-secondary-subtle text-secondary border">
                                {sol.grado_solicitado || 'Sin grado'}
                              </span>
                            </td>
                            <td>
                              <div>{nomRep}</div>
                              <div className="text-muted extra-small">
                                {sol.representante_cedula} ({sol.parentesco || sol.representante_parentesco || 'Representante'})
                              </div>
                            </td>
                            <td>
                              <div className="small fw-semibold">{sol.pdvsa_tipo_nomina || 'Comunidad'}</div>
                              <div className="text-muted extra-small">{sol.pdvsa_condicion_laboral || 'N/A'}</div>
                            </td>
                            <td className="text-center">
                              {sol.aptitud === 'Apto' ? (
                                <span className="badge extra-small rounded-pill fw-bold px-2 py-0.5" style={{ backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC' }}>
                                  Apto
                                </span>
                              ) : sol.aptitud === 'No Apto' ? (
                                <span className="badge extra-small rounded-pill fw-bold px-2 py-0.5" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}>
                                  No Apto
                                </span>
                              ) : (
                                <span className="badge extra-small rounded-pill fw-bold px-2 py-0.5" style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                                  {sol.aptitud || 'Pendiente'}
                                </span>
                              )}
                            </td>
                            <td className="text-center">
                              <div className="d-flex flex-column align-items-center gap-1">
                                {renderBadgeEstado(sol.estado)}
                                {(() => {
                                  const parsed = parsearObservaciones(sol.observaciones);
                                  return (
                                    <div className="d-flex flex-column align-items-center gap-1">
                                      {/* Marca 1: Aceptación */}
                                      {parsed.whatsapp_notificado ? (
                                        <span
                                          className="badge extra-small rounded-pill d-inline-flex align-items-center gap-1 py-0.5 px-2 fw-bold"
                                          style={{ backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', fontSize: '9px', cursor: 'help' }}
                                          title={`1. Mensaje de Aceptación enviado por WhatsApp${parsed.whatsapp_fecha ? ` el ${parsed.whatsapp_fecha}` : ''}`}
                                        >
                                          <i className="bi bi-check2-circle"></i> Aceptación Enviada
                                        </span>
                                      ) : (
                                        <span
                                          className="badge extra-small rounded-pill d-inline-flex align-items-center gap-1 py-0.5 px-2 fw-semibold"
                                          style={{ backgroundColor: '#F8FAFC', color: '#64748B', border: '1px solid #CBD5E1', fontSize: '9px' }}
                                          title="Pendiente por enviar mensaje de Aceptación"
                                        >
                                          <i className="bi bi-clock"></i> Aceptación Pendiente
                                        </span>
                                      )}

                                      {/* Marca 2: Orientaciones */}
                                      {parsed.whatsapp_orientaciones_notificado ? (
                                        <span
                                          className="badge extra-small rounded-pill d-inline-flex align-items-center gap-1 py-0.5 px-2 fw-bold"
                                          style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE', fontSize: '9px', cursor: 'help' }}
                                          title={`2. Mensaje de Orientaciones Paso a Paso enviado por WhatsApp${parsed.whatsapp_orientaciones_fecha ? ` el ${parsed.whatsapp_orientaciones_fecha}` : ''}`}
                                        >
                                          <i className="bi bi-signpost-split-fill"></i> Orientaciones Enviadas
                                        </span>
                                      ) : (
                                        <span
                                          className="badge extra-small rounded-pill d-inline-flex align-items-center gap-1 py-0.5 px-2 fw-semibold"
                                          style={{ backgroundColor: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A', fontSize: '9px' }}
                                          title="Pendiente por enviar mensaje de Orientaciones Paso a Paso"
                                        >
                                          <i className="bi bi-hourglass-split"></i> Orientaciones Pendiente
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                {(() => {
                                  const docsSol = obtenerDocumentosSolicitud(sol);
                                  return (
                                    <button
                                      className={`btn ${docsSol.length > 0 ? 'btn-outline-danger' : 'btn-outline-secondary'}`}
                                      onClick={() => abrirVisorDocumentos(sol, 0)}
                                      title={docsSol.length > 0 ? `Ver ${docsSol.length} documento(s) adjunto(s)` : 'Sin documentos adjuntos'}
                                      disabled={docsSol.length === 0}
                                    >
                                      <i className="bi bi-file-earmark-pdf"></i>
                                      {docsSol.length > 0 && (
                                        <span className="badge bg-danger ms-1 px-1 py-0.2" style={{ fontSize: '9px' }}>
                                          {docsSol.length}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })()}
                                <button
                                  className="btn btn-outline-primary"
                                  onClick={() => cambiarVistaUnoAUno(idx)}
                                  title="Evaluar y editar expediente uno a uno"
                                >
                                  <i className="bi bi-pencil-square"></i>
                                </button>
                                <button
                                  className="btn btn-outline-secondary"
                                  onClick={() => abrirDetalle(sol)}
                                  title="Ver Ficha y Expediente"
                                >
                                  <i className="bi bi-eye"></i>
                                </button>
                                {(sol.estado === 'Aprobado' || sol.estado === 'Formalizado') && (
                                  <>
                                    <button
                                      className="btn btn-outline-info"
                                      onClick={() => descargarCartaAceptacionAspirante(sol)}
                                      title="Descargar Carta de Aceptación Oficial (PDF 3 Páginas)"
                                    >
                                      <i className="bi bi-file-earmark-check"></i>
                                    </button>
                                    {(() => {
                                      const acc = verificarAccesoHabilitado(sol, estudiantesMatriculaBD);
                                      return (
                                        <button
                                          className={`btn ${acc.habilitado ? 'btn-success text-white shadow-xs' : 'btn-outline-primary'}`}
                                          style={!acc.habilitado ? { borderColor: '#6366F1', color: '#4F46E5' } : undefined}
                                          onClick={() => abrirModalHabilitarAcceso(sol)}
                                          title={acc.habilitado ? `✅ Acceso SIGAE ya Habilitado${acc.fecha ? ` el ${acc.fecha}` : ''}. Clic para ver o modificar datos.` : 'Habilitar o Vincular Usuario en SIGAE para el Representante y Estudiante'}
                                        >
                                          <i className={`bi ${acc.habilitado ? 'bi-check-circle-fill' : 'bi-person-plus-fill'}`}></i>
                                        </button>
                                      );
                                    })()}
                                  </>
                                )}
                                {(() => {
                                  const parsed = parsearObservaciones(sol.observaciones);
                                  return (
                                    <button
                                      className={`btn ${parsed.whatsapp_notificado ? 'btn-success text-white shadow-xs' : 'btn-outline-success'}`}
                                      onClick={() => notificarRepresentanteWhatsApp(sol)}
                                      title={
                                        parsed.whatsapp_notificado
                                          ? `WhatsApp enviado${parsed.whatsapp_fecha ? ` el ${parsed.whatsapp_fecha}` : ''}${parsed.whatsapp_estado ? ` (${parsed.whatsapp_estado})` : ''}. Clic para reenviar.`
                                          : 'Enviar Notificación Oficial de Estatus por WhatsApp'
                                      }
                                    >
                                      <i className="bi bi-whatsapp"></i>
                                      {parsed.whatsapp_notificado && <i className="bi bi-check ms-0.5 fw-bold"></i>}
                                    </button>
                                  );
                                })()}
                                <button
                                  type="button"
                                  className="btn btn-outline-danger"
                                  onClick={() => eliminarSolicitudIndividual(sol)}
                                  title="Eliminar Solicitud de Admisión"
                                  disabled={eliminandoSolicitudes}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── VISTA MÓVIL: TARJETAS RESPONSIVAS (< lg) ─────────────────── */}
                <div className="d-block d-lg-none p-2 p-sm-3 bg-light">
                  <div className="d-flex flex-column gap-2.5">
                    {solicitudesFiltradas.map((sol, idx) => {
                      const baremo = calcularBaremoPrioridad(sol, personalEscuelaMap);
                      const nomEst = nombreCompleto(sol.estudiante_nombres, sol.estudiante_apellidos);
                      const nomRep = nombreCompleto(sol.representante_nombres, sol.representante_apellidos);
                      const docsSol = obtenerDocumentosSolicitud(sol);
                      const parsed = parsearObservaciones(sol.observaciones);

                      return (
                        <div key={sol.id || sol.codigo_unico} className="card border-0 shadow-xs rounded-3 bg-white overflow-hidden">
                          {/* Header de la tarjeta */}
                          <div className="card-header bg-white py-2 px-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-1">
                            <div className="d-flex align-items-center gap-1.5 flex-wrap">
                              <input
                                type="checkbox"
                                className="form-check-input mt-0 me-1"
                                checked={seleccionadosListadoGeneral.has(String(sol.id))}
                                onChange={() => toggleSeleccionarSolicitud(sol.id)}
                              />
                              <span className="badge bg-dark text-white rounded-pill extra-small px-2 py-0.5">
                                #{idx + 1}
                              </span>
                              <span
                                className="badge fw-bold text-white extra-small"
                                style={{ backgroundColor: baremo.badgeBg, fontSize: '10.5px' }}
                                title={baremo.descripcion}
                              >
                                {baremo.codigo} • {baremo.etiqueta.split('(')[0]}
                              </span>
                              {sol.instruccion_jerarquica && (
                                <span className="badge text-white extra-small" style={{ backgroundColor: '#EC4899', fontSize: '9px' }}>
                                  <i className="bi bi-star-fill"></i>
                                </span>
                              )}
                            </div>

                            <div className="d-flex align-items-center gap-1">
                              {renderBadgeEstado(sol.estado)}
                            </div>
                          </div>

                          {/* Cuerpo de la tarjeta */}
                          <div className="card-body p-3">
                            {/* Nombre del Aspirante */}
                            <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                              <div>
                                <h6 className="fw-bold text-dark mb-0 fs-6">
                                  {nomEst}
                                </h6>
                                <small className="text-muted extra-small d-block">
                                  C.I: <b>{sol.estudiante_cedula || 'En trámite'}</b> • Cód: <b className="font-monospace text-primary">{sol.codigo_unico || 'N/A'}</b>
                                </small>
                                {(() => {
                                  const acc = verificarAccesoHabilitado(sol, estudiantesMatriculaBD);
                                  return acc.habilitado ? (
                                    <span
                                      className="badge rounded-pill extra-small px-2 py-0.5 fw-bold d-inline-flex align-items-center gap-1 mt-1 shadow-xs"
                                      style={{ backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', fontSize: '9.5px' }}
                                      title={`Acceso habilitado en SIGAE${acc.fecha ? ` el ${acc.fecha}` : ''}`}
                                    >
                                      <i className="bi bi-person-check-fill"></i> Acceso Habilitado
                                    </span>
                                  ) : null;
                                })()}
                              </div>

                              <span className="badge bg-light text-dark border extra-small flex-shrink-0">
                                {sol.codigo_escuela?.toUpperCase() === 'SB' ? 'Santa Bárbara' : 'Libertador B.'}
                              </span>
                            </div>

                            {/* Datos Clave: Grado, Representante, Nómina */}
                            <div className="bg-light p-2.5 rounded-3 mb-2 small">
                              <div className="row g-1.5 extra-small">
                                <div className="col-6">
                                  <span className="text-muted d-block">Grado Solicitado:</span>
                                  <strong className="text-primary">{sol.grado_solicitado || 'Sin asignar'}</strong>
                                </div>
                                <div className="col-6">
                                  <span className="text-muted d-block">Aptitud Técnica:</span>
                                  <strong className={sol.aptitud === 'Apto' ? 'text-success' : sol.aptitud === 'No Apto' ? 'text-danger' : 'text-warning'}>
                                    {sol.aptitud || 'En Evaluación'}
                                  </strong>
                                </div>
                                <div className="col-12 pt-1 border-top border-secondary-subtle">
                                  <span className="text-muted d-block">Representante:</span>
                                  <strong className="text-dark">{nomRep}</strong> ({sol.representante_cedula}) • <span className="text-secondary">{sol.parentesco || sol.representante_parentesco || 'Representante'}</span>
                                </div>
                                <div className="col-12">
                                  <span className="text-muted d-block">Nómina / Condición:</span>
                                  <span className="text-dark fw-semibold">{sol.pdvsa_tipo_nomina || 'Comunidad'}</span> {sol.pdvsa_condicion_laboral ? `(${sol.pdvsa_condicion_laboral})` : ''}
                                </div>
                              </div>
                            </div>

                            {/* Recaudos y WhatsApp info */}
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-1">
                              {docsSol.length > 0 ? (
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm py-0.5 px-2 rounded-pill extra-small fw-bold d-inline-flex align-items-center gap-1"
                                  onClick={() => abrirVisorDocumentos(sol, 0)}
                                >
                                  <i className="bi bi-paperclip"></i>
                                  <span>{docsSol.length} {docsSol.length === 1 ? 'Recaudo' : 'Recaudos'}</span>
                                </button>
                              ) : (
                                <span className="text-muted extra-small">Sin adjuntos</span>
                              )}

                              {parsed.whatsapp_notificado ? (
                                <span className="badge extra-small rounded-pill py-0.5 px-2 fw-bold" style={{ backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC' }}>
                                  <i className="bi bi-whatsapp me-1"></i> WA Notificado
                                </span>
                              ) : (
                                <span className="badge extra-small rounded-pill py-0.5 px-2 fw-semibold" style={{ backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #CBD5E1' }}>
                                  <i className="bi bi-clock-history me-1"></i> WA Pendiente
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Footer de Acciones Rápidas */}
                          <div className="card-footer bg-light py-2 px-3 border-top d-flex align-items-center justify-content-between gap-1.5 flex-wrap">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm flex-grow-1 fw-bold py-1 extra-small shadow-xs d-flex align-items-center justify-content-center gap-1"
                              onClick={() => cambiarVistaUnoAUno(idx)}
                            >
                              <i className="bi bi-pencil-square"></i>
                              <span>Auditar / Calificar</span>
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm py-1 px-2.5 extra-small fw-bold"
                              onClick={() => abrirDetalle(sol)}
                              title="Ver Ficha y Expediente"
                            >
                              <i className="bi bi-eye me-1"></i>Ficha
                            </button>

                            {(sol.estado === 'Aprobado' || sol.estado === 'Formalizado') && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-outline-info btn-sm py-1 px-2.5 extra-small fw-bold"
                                  onClick={() => descargarCartaAceptacionAspirante(sol)}
                                  title="Descargar Carta de Aceptación Oficial (PDF)"
                                >
                                  <i className="bi bi-file-earmark-check me-1"></i>Carta
                                </button>
                                {(() => {
                                  const acc = verificarAccesoHabilitado(sol, estudiantesMatriculaBD);
                                  return acc.habilitado ? (
                                    <button
                                      type="button"
                                      className="btn btn-success btn-sm py-1 px-2.5 extra-small fw-bold text-white shadow-xs d-inline-flex align-items-center gap-1"
                                      onClick={() => abrirModalHabilitarAcceso(sol)}
                                      title={`✅ Acceso SIGAE Habilitado${acc.fecha ? ` el ${acc.fecha}` : ''}. Clic para ver o modificar.`}
                                    >
                                      <i className="bi bi-check-circle-fill"></i>
                                      <span>Habilitado</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn btn-outline-primary btn-sm py-1 px-2.5 extra-small fw-bold d-inline-flex align-items-center gap-1"
                                      style={{ borderColor: '#6366F1', color: '#4F46E5' }}
                                      onClick={() => abrirModalHabilitarAcceso(sol)}
                                      title="Habilitar Acceso SIGAE para Representante y Estudiante"
                                    >
                                      <i className="bi bi-person-plus-fill"></i>
                                      <span>Acceso</span>
                                    </button>
                                  );
                                })()}
                              </>
                            )}

                            <button
                              type="button"
                              className={`btn btn-sm py-1 px-2.5 extra-small fw-bold ${parsed.whatsapp_notificado ? 'btn-success text-white' : 'btn-outline-success'}`}
                              onClick={() => notificarRepresentanteWhatsApp(sol)}
                              title="Notificar por WhatsApp"
                            >
                              <i className="bi bi-whatsapp"></i>
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm py-1 px-2.5 extra-small fw-bold"
                              onClick={() => eliminarSolicitudIndividual(sol)}
                              title="Eliminar Solicitud"
                              disabled={eliminandoSolicitudes}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* VISTA 2: AUDITORÍA Y EDICIÓN UNO POR UNO                                   */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {vistaActiva === 'uno_a_uno' && (
        <div>
          {/* BARRA DE NAVEGACIÓN RESPONSIVA */}
          <div className="card border-0 shadow-xs rounded-3 mb-3 bg-white">
            <div className="card-body p-2.5 p-sm-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="d-flex align-items-center gap-1.5 flex-grow-1 flex-sm-grow-0">
                <button
                  className="btn btn-outline-secondary btn-sm py-1 px-2.5 fw-bold"
                  onClick={() => {
                    const prev = Math.max(0, indiceUnoAUno - 1);
                    cambiarVistaUnoAUno(prev);
                  }}
                  disabled={indiceUnoAUno === 0}
                >
                  <i className="bi bi-chevron-left me-1"></i> Anterior
                </button>

                <button
                  className="btn btn-outline-secondary btn-sm py-1 px-2.5 fw-bold"
                  onClick={() => {
                    const next = Math.min(solicitudesFiltradas.length - 1, indiceUnoAUno + 1);
                    cambiarVistaUnoAUno(next);
                  }}
                  disabled={indiceUnoAUno >= solicitudesFiltradas.length - 1}
                >
                  Siguiente <i className="bi bi-chevron-right ms-1"></i>
                </button>
              </div>

              <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ minWidth: '220px' }}>
                <span className="fw-bold text-dark extra-small text-nowrap d-none d-md-inline">
                  Aspirante <span className="text-primary fs-6">#{indiceUnoAUno + 1}</span> de {solicitudesFiltradas.length}
                </span>

                <select
                  className="form-select form-select-sm flex-grow-1"
                  value={indiceUnoAUno}
                  onChange={e => cambiarVistaUnoAUno(Number(e.target.value))}
                >
                  {solicitudesFiltradas.map((s, i) => (
                    <option key={s.id || s.codigo_unico} value={i}>
                      #{i + 1} - {nombreCompleto(s.estudiante_nombres, s.estudiante_apellidos)} ({s.codigo_unico})
                    </option>
                  ))}
                </select>
              </div>

              <div className="d-flex gap-1.5 flex-wrap ms-auto">
                {!modoEdicionUnoAUno && solicitudUnoAUno && (
                  <button
                    className="btn btn-outline-warning btn-sm fw-bold text-dark py-1 px-2.5 shadow-xs"
                    onClick={() => iniciarEdicionExpediente(solicitudUnoAUno)}
                  >
                    <i className="bi bi-pencil-fill me-1"></i>
                    <span className="d-none d-sm-inline">Editar Expediente</span>
                    <span className="d-inline d-sm-none">Editar</span>
                  </button>
                )}
                <button className="btn btn-outline-dark btn-sm py-1 px-2.5" onClick={() => setVistaActiva('tabla')}>
                  <i className="bi bi-table me-1"></i>
                  <span className="d-none d-sm-inline">Volver al Listado</span>
                  <span className="d-inline d-sm-none">Listado</span>
                </button>
              </div>
            </div>
          </div>

          {!solicitudUnoAUno ? (
            <div className="text-center py-5 bg-white rounded-3 shadow-sm">
              <i className="bi bi-inbox fs-1 text-muted mb-2 d-block"></i>
              <h5 className="fw-bold text-dark">No hay solicitud seleccionada</h5>
              <p className="text-muted">Ajusta los filtros para cargar registros a evaluar.</p>
            </div>
          ) : (
            <div className="row g-3">
              {/* COLUMNA IZQUIERDA: DATOS O MODO EDICIÓN */}
              <div className="col-12 col-lg-7">
                {modoEdicionUnoAUno ? (
                  /* ── FORMULARIO DE EDICIÓN DEL EXPEDIENTE ─────────────────── */
                  <div className="card border-0 shadow-sm rounded-3 mb-3 bg-white border-top border-4 border-warning">
                    <div className="card-header bg-warning-subtle py-2.5 d-flex justify-content-between align-items-center">
                      <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                        <i className="bi bi-pencil-square text-warning"></i> Modo Edición de Datos del Expediente
                      </h6>
                      <span className="badge bg-dark font-monospace">{formEdicion.codigo_unico}</span>
                    </div>

                    <div className="card-body p-3 small">
                      <h6 className="fw-bold text-primary border-bottom pb-1 mb-2">1. Datos del Estudiante</h6>
                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <label className="form-label extra-small fw-bold">Nombres:</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={formEdicion.estudiante_nombres || ''}
                            onChange={e => setFormEdicion({ ...formEdicion, estudiante_nombres: e.target.value })}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label extra-small fw-bold">Apellidos:</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={formEdicion.estudiante_apellidos || ''}
                            onChange={e => setFormEdicion({ ...formEdicion, estudiante_apellidos: e.target.value })}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label extra-small fw-bold">Cédula / Identificador Escolar:</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={formEdicion.estudiante_cedula || ''}
                            onChange={e => setFormEdicion({ ...formEdicion, estudiante_cedula: e.target.value })}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label extra-small fw-bold">Fecha de Nacimiento:</label>
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={formEdicion.estudiante_fecha_nacimiento || ''}
                            onChange={e => setFormEdicion({ ...formEdicion, estudiante_fecha_nacimiento: e.target.value })}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label extra-small fw-bold">Sexo:</label>
                          <select
                            className="form-select form-select-sm"
                            value={formEdicion.estudiante_sexo || ''}
                            onChange={e => setFormEdicion({ ...formEdicion, estudiante_sexo: e.target.value })}
                          >
                            <option value="">Seleccionar...</option>
                            <option value="M">Masculino (M)</option>
                            <option value="F">Femenino (F)</option>
                          </select>
                        </div>
                        <div className="col-6">
                          <label className="form-label extra-small fw-bold">Grado Solicitado:</label>
                          <select
                            className="form-select form-select-sm"
                            value={formEdicion.grado_solicitado || ''}
                            onChange={e => setFormEdicion({ ...formEdicion, grado_solicitado: e.target.value })}
                          >
                            {opcionesGradoEnriquecidos.map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-12">
                          <label className="form-label extra-small fw-bold">Plantel de Procedencia:</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={formEdicion.plantel_procedencia || ''}
                            onChange={e => setFormEdicion({ ...formEdicion, plantel_procedencia: e.target.value })}
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label extra-small fw-bold text-warning">Condición Neurodivergente:</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={formEdicion.estudiante_condicion_neuro || ''}
                            onChange={e => setFormEdicion({ ...formEdicion, estudiante_condicion_neuro: e.target.value })}
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label extra-small fw-bold text-danger">Condición Médica / Alergias:</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={formEdicion.estudiante_condicion_medica || ''}
                            onChange={e => setFormEdicion({ ...formEdicion, estudiante_condicion_medica: e.target.value })}
                          />
                        </div>
                      </div>

                      <h6 className="fw-bold text-primary border-bottom pb-1 mb-2">2. Datos del Representante Legal</h6>
                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <label className="form-label extra-small fw-bold">Nombres Representante:</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={formEdicion.representante_nombres || ''}
                            onChange={e => setFormEdicion({ ...formEdicion, representante_nombres: e.target.value })}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label extra-small fw-bold">Apellidos Representante:</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={formEdicion.representante_apellidos || ''}
                            onChange={e => setFormEdicion({ ...formEdicion, representante_apellidos: e.target.value })}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label extra-small fw-bold">Cédula Representante:</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={formEdicion.representante_cedula || ''}
                            onChange={e => setFormEdicion({ ...formEdicion, representante_cedula: e.target.value })}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label extra-small fw-bold">
                            Parentesco: <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-select form-select-sm"
                            value={formEdicion.parentesco || formEdicion.representante_parentesco || ''}
                            onChange={e => {
                              const val = e.target.value;
                              setFormEdicion({ ...formEdicion, parentesco: val, representante_parentesco: val });
                            }}
                          >
                            <option value="">Seleccionar Parentesco...</option>
                            {opcionesParentescoEnriquecidas.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                            {/* Si el valor actual no está en la lista estándar, agregarlo para no perderlo */}
                            {(formEdicion.parentesco || formEdicion.representante_parentesco) &&
                              !opcionesParentescoEnriquecidas.includes((formEdicion.parentesco || formEdicion.representante_parentesco)!) && (
                                <option value={formEdicion.parentesco || formEdicion.representante_parentesco}>
                                  {formEdicion.parentesco || formEdicion.representante_parentesco} (Personalizado)
                                </option>
                              )}
                          </select>
                        </div>
                        <div className="col-6">
                          <label className="form-label extra-small fw-bold">Teléfono Principal:</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={formEdicion.representante_telefono || ''}
                            onChange={e => setFormEdicion({ ...formEdicion, representante_telefono: e.target.value })}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label extra-small fw-bold">Teléfono Secundario:</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={formEdicion.representante_telefono2 || ''}
                            onChange={e => setFormEdicion({ ...formEdicion, representante_telefono2: e.target.value })}
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label extra-small fw-bold">Correo Electrónico:</label>
                          <input
                            type="email"
                            className="form-control form-control-sm"
                            value={formEdicion.representante_email || ''}
                            onChange={e => setFormEdicion({ ...formEdicion, representante_email: e.target.value })}
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label extra-small fw-bold">Dirección de Habitación:</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={formEdicion.direccion_habitacion || ''}
                            onChange={e => setFormEdicion({ ...formEdicion, direccion_habitacion: e.target.value })}
                          />
                        </div>
                      </div>

                      <h6 className="fw-bold text-primary border-bottom pb-1 mb-2">3. Vínculo Laboral y Nómina PDVSA</h6>
                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <label className="form-label extra-small fw-bold">Tipo de Nómina:</label>
                          <select
                            className="form-select form-select-sm"
                            value={formEdicion.pdvsa_tipo_nomina || ''}
                            onChange={e => setFormEdicion({ ...formEdicion, pdvsa_tipo_nomina: e.target.value })}
                          >
                            <option value="">Seleccionar...</option>
                            {opcionesNominaEnriquecidas.map(n => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-6">
                          <label className="form-label extra-small fw-bold">Condición Laboral:</label>
                          <select
                            className="form-select form-select-sm"
                            value={formEdicion.pdvsa_condicion_laboral || ''}
                            onChange={e => setFormEdicion({ ...formEdicion, pdvsa_condicion_laboral: e.target.value })}
                          >
                            <option value="">Seleccionar...</option>
                            {opcionesCondicionEnriquecidas.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-6">
                          <label className="form-label extra-small fw-bold">Localidad de Trabajo:</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={formEdicion.pdvsa_localidad_trabajo || ''}
                            onChange={e => setFormEdicion({ ...formEdicion, pdvsa_localidad_trabajo: e.target.value })}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label extra-small fw-bold">Gerencia / Negocio:</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={formEdicion.pdvsa_gerencia || ''}
                            onChange={e => setFormEdicion({ ...formEdicion, pdvsa_gerencia: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* ACCIONES DE EDICIÓN */}
                      <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={cancelarEdicionExpediente}
                          disabled={guardandoEdicion}
                        >
                          Cancelar Edición
                        </button>
                        <button
                          type="button"
                          className="btn btn-warning btn-sm fw-bold px-3 text-dark"
                          onClick={guardarEdicionExpediente}
                          disabled={guardandoEdicion}
                        >
                          {guardandoEdicion ? 'Guardando...' : '💾 Guardar Cambios en Expediente'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── VISTA LECTURA DEL EXPEDIENTE ──────────────────────────── */
                  <>
                    {/* 1. TARJETA ASPIRANTE */}
                    <div className="card border-0 shadow-sm rounded-3 mb-3 bg-white">
                      <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2">
                          <i className="bi bi-person-badge-fill text-primary fs-5"></i>
                          <div>
                            <h6 className="fw-bold mb-0 text-dark">
                              {nombreCompleto(solicitudUnoAUno.estudiante_nombres, solicitudUnoAUno.estudiante_apellidos)}
                            </h6>
                            <small className="text-muted">Código Único: <b className="text-primary font-monospace">{solicitudUnoAUno.codigo_unico}</b></small>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-1.5">
                          <span
                            className="badge px-2.5 py-1.5 fw-bold text-white shadow-sm"
                            style={{ backgroundColor: baremoUnoAUno?.badgeBg }}
                          >
                            {baremoUnoAUno?.codigo}: {baremoUnoAUno?.etiqueta}
                          </span>
                        </div>
                      </div>

                      <div className="card-body p-3">
                        <div className="row g-2 small">
                          <div className="col-6 col-md-4">
                            <span className="text-muted d-block">Cédula / Identificador:</span>
                            <strong className="text-dark">{solicitudUnoAUno.estudiante_cedula || 'En trámite'}</strong>
                          </div>
                          <div className="col-6 col-md-4">
                            <span className="text-muted d-block">Grado Solicitado:</span>
                            <strong className="text-primary">{solicitudUnoAUno.grado_solicitado}</strong>
                          </div>
                          <div className="col-6 col-md-4">
                            <span className="text-muted d-block">Escuela Asignada:</span>
                            <strong className="text-dark">{NOMBRE_ESCUELA_MAP[solicitudUnoAUno.codigo_escuela] || solicitudUnoAUno.codigo_escuela}</strong>
                          </div>
                          <div className="col-6 col-md-4">
                            <span className="text-muted d-block">Fecha Nacimiento:</span>
                            <strong className="text-dark">{solicitudUnoAUno.estudiante_fecha_nacimiento || 'N/A'}</strong>
                          </div>
                          <div className="col-6 col-md-4">
                            <span className="text-muted d-block">Sexo:</span>
                            <strong className="text-dark">{solicitudUnoAUno.estudiante_sexo || 'N/A'}</strong>
                          </div>
                          <div className="col-6 col-md-4">
                            <span className="text-muted d-block">Plantel de Procedencia:</span>
                            <strong className="text-dark">{solicitudUnoAUno.plantel_procedencia || 'N/A'}</strong>
                          </div>

                          {solicitudUnoAUno.estudiante_condicion_neuro && (
                            <div className="col-12 text-warning bg-warning-subtle p-2 rounded mt-1">
                              <i className="bi bi-info-circle-fill me-1"></i>
                              <strong>Condición Neurodivergente:</strong> {solicitudUnoAUno.estudiante_condicion_neuro}
                            </div>
                          )}

                          {solicitudUnoAUno.estudiante_condicion_medica && (
                            <div className="col-12 text-danger bg-danger-subtle p-2 rounded mt-1">
                              <i className="bi bi-heart-pulse-fill me-1"></i>
                              <strong>Condición Médica / Alergias:</strong> {solicitudUnoAUno.estudiante_condicion_medica}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2. TARJETA REPRESENTANTE */}
                    <div className="card border-0 shadow-sm rounded-3 mb-3 bg-white">
                      <div className="card-header bg-white py-2.5 border-bottom fw-bold text-dark small d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <i className="bi bi-briefcase-fill text-primary"></i> Datos del Representante y Filiación PDVSA
                        </div>
                      </div>
                      <div className="card-body p-3">
                        <div className="row g-2 small">
                          <div className="col-12 col-md-6">
                            <span className="text-muted d-block">Representante Legal:</span>
                            <strong className="text-dark">{nombreCompleto(solicitudUnoAUno.representante_nombres, solicitudUnoAUno.representante_apellidos)}</strong>
                          </div>
                          <div className="col-6 col-md-3">
                            <span className="text-muted d-block">Cédula:</span>
                            <strong className="text-dark">{solicitudUnoAUno.representante_cedula}</strong>
                          </div>
                          <div className="col-6 col-md-3">
                            <span className="text-muted d-block">Parentesco:</span>
                            <strong className="text-primary">{solicitudUnoAUno.parentesco || solicitudUnoAUno.representante_parentesco || 'Representante'}</strong>
                          </div>

                          <div className="col-6 col-md-4">
                            <span className="text-muted d-block">Teléfono Principal:</span>
                            <strong className="text-dark">{solicitudUnoAUno.representante_telefono || 'N/A'}</strong>
                          </div>
                          <div className="col-6 col-md-4">
                            <span className="text-muted d-block">Teléfono Secundario:</span>
                            <strong className="text-dark">{solicitudUnoAUno.representante_telefono2 || 'N/A'}</strong>
                          </div>
                          <div className="col-12 col-md-4">
                            <span className="text-muted d-block">Correo Electrónico:</span>
                            <strong className="text-dark">{solicitudUnoAUno.representante_email || 'N/A'}</strong>
                          </div>

                          <div className="col-12"><hr className="my-1 text-muted" /></div>

                          <div className="col-6 col-md-3">
                            <span className="text-muted d-block">Tipo de Nómina:</span>
                            <strong className="text-primary">{solicitudUnoAUno.pdvsa_tipo_nomina || 'Comunidad'}</strong>
                          </div>
                          <div className="col-6 col-md-3">
                            <span className="text-muted d-block">Condición Laboral:</span>
                            <strong className="text-dark">{solicitudUnoAUno.pdvsa_condicion_laboral || 'N/A'}</strong>
                          </div>
                          <div className="col-6 col-md-3">
                            <span className="text-muted d-block">Localidad de Trabajo:</span>
                            <strong className="text-dark">{solicitudUnoAUno.pdvsa_localidad_trabajo || 'N/A'}</strong>
                          </div>
                          <div className="col-6 col-md-3">
                            <span className="text-muted d-block">Gerencia / Negocio:</span>
                            <strong className="text-dark">{solicitudUnoAUno.pdvsa_gerencia || 'N/A'}</strong>
                          </div>

                          <div className="col-12">
                            <span className="text-muted d-block">Dirección de Habitación / Entorno:</span>
                            <span className="text-dark">
                              {solicitudUnoAUno.direccion_habitacion || 'N/A'}, {solicitudUnoAUno.parroquia_habitacion || ''}, {solicitudUnoAUno.municipio_habitacion || ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 3. DOCUMENTOS ADJUNTOS */}
                    {(() => {
                      const docsUnoAUno = obtenerDocumentosSolicitud(solicitudUnoAUno);
                      return (
                        <div className="card border-0 shadow-sm rounded-3 bg-white mb-3">
                          <div className="card-header bg-white py-2.5 border-bottom fw-bold text-dark small d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center gap-2">
                              <i className="bi bi-file-earmark-pdf-fill text-danger fs-5"></i>
                              <span>Recaudos y Documentos Adjuntos</span>
                            </div>
                            <span className={`badge ${docsUnoAUno.length > 0 ? 'bg-primary' : 'bg-secondary'} rounded-pill px-2.5 py-1`}>
                              {docsUnoAUno.length} {docsUnoAUno.length === 1 ? 'documento' : 'documentos'}
                            </span>
                          </div>

                          <div className="card-body p-3">
                            {docsUnoAUno.length === 0 ? (
                              <div className="text-center py-4 text-muted bg-light rounded-3 border">
                                <i className="bi bi-file-earmark-x fs-2 d-block mb-1 text-secondary"></i>
                                <span className="small">No se han registrado documentos digitales adjuntos para esta solicitud.</span>
                              </div>
                            ) : (
                              <div className="row g-2.5">
                                {docsUnoAUno.map((doc, dIdx) => (
                                  <div key={doc.id} className="col-12 col-md-6">
                                    <div className="p-3 bg-light border rounded-3 d-flex flex-column justify-content-between h-100 shadow-xs hover-shadow transition-all">
                                      <div className="d-flex align-items-center gap-2.5 mb-2.5">
                                        <div
                                          className="p-2.5 rounded-3 text-white d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                                          style={{ backgroundColor: doc.color, width: '42px', height: '42px' }}
                                        >
                                          <i className={`bi ${doc.icono} fs-4`}></i>
                                        </div>
                                        <div className="overflow-hidden">
                                          <strong className="d-block text-dark text-truncate small" title={doc.titulo}>
                                            {doc.titulo}
                                          </strong>
                                          {doc.subtitulo && (
                                            <span className="badge bg-white text-muted border extra-small mt-0.5">
                                              {doc.subtitulo}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="d-flex gap-2 pt-1 border-top border-secondary-subtle">
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-primary w-100 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-1.5 shadow-sm"
                                          onClick={() => abrirVisorDocumentos(solicitudUnoAUno, dIdx)}
                                        >
                                          <i className="bi bi-eye-fill"></i>
                                          <span>Ver / Inspeccionar</span>
                                        </button>
                                        <a
                                          href={doc.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 d-flex align-items-center justify-content-center flex-shrink-0"
                                          title="Abrir en pestaña nueva o descargar"
                                        >
                                          <i className="bi bi-box-arrow-up-right"></i>
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>

              {/* COLUMNA DERECHA: PANEL DE EVALUACIÓN OFICIAL */}
              <div className="col-12 col-lg-5">
                <div className="card border-0 shadow-sm rounded-3 bg-white sticky-top" style={{ top: '15px' }}>
                  <div className="card-header bg-primary text-white py-3">
                    <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                      <i className="bi bi-sliders2-vertical"></i> Panel de Calificación y Estatus Oficial
                    </h6>
                  </div>

                  <div className="card-body p-3.5">
                    {/* DETALLE DE PRIORIDAD */}
                    <div className="alert alert-light border p-2.5 mb-3 small">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold text-dark">Nivel Prelación:</span>
                        <span className="badge fw-bold" style={{ backgroundColor: baremoUnoAUno?.badgeBg, color: '#fff' }}>
                          {baremoUnoAUno?.codigo}
                        </span>
                      </div>
                      <div className="text-muted extra-small">{baremoUnoAUno?.descripcion}</div>
                    </div>

                    {/* VÍNCULO CON LA ESCUELA (PERSONAL / TRABAJADOR DE LA ESCUELA) */}
                    <div className="card border p-2.5 mb-3 bg-light rounded-3">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="checkPersonalEscuela"
                          checked={esPersonalEscuelaForm}
                          onChange={e => setEsPersonalEscuelaForm(e.target.checked)}
                        />
                        <label className="form-check-label fw-bold small text-dark" htmlFor="checkPersonalEscuela">
                          <i className="bi bi-building-check text-primary me-1"></i> Trabajador(a) / Docente de la Escuela (P1)
                        </label>
                      </div>
                      <small className="text-muted extra-small d-block mt-1">
                        Aplica a docentes, directivos, subdirectores, coordinadores, administrativos y obreros de la institución.
                      </small>
                    </div>

                    {/* 1. INSTRUCCIÓN JERÁRQUICA */}
                    <div className="card border p-2.5 mb-3 bg-light rounded-3">
                      <div className="form-check form-switch mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="checkJerarquica"
                          checked={esJerarquica}
                          onChange={e => setEsJerarquica(e.target.checked)}
                        />
                        <label className="form-check-label fw-bold small text-dark" htmlFor="checkJerarquica">
                          <i className="bi bi-award-fill text-danger me-1"></i> Instrucción por Nivel Jerárquico
                        </label>
                      </div>

                      {esJerarquica && (
                        <div className="mt-2 pt-2 border-top">
                          <div className="mb-2">
                            <label className="form-label extra-small fw-bold text-secondary mb-1">
                              Autoridad / Nivel Jerárquico que instruye:
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Ej: Presidencia, Dirección Ejecutiva, Gerencia General..."
                              value={quienInstruye}
                              onChange={e => setQuienInstruye(e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="form-label extra-small fw-bold text-secondary mb-1">
                              Prioridad Asignada:
                            </label>
                            <select
                              className="form-select form-select-sm"
                              value={prioridadAsignada}
                              onChange={e => setPrioridadAsignada(Number(e.target.value))}
                            >
                              <option value={0}>Prioridad 0 - Máxima Especial (VIP)</option>
                              <option value={1}>Prioridad 1 - Alta Prelación</option>
                              <option value={2}>Prioridad 2</option>
                              <option value={3}>Prioridad 3</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. DETERMINACIÓN DE APTITUD */}
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-dark d-block mb-1.5">
                        1. Determinación de Aptitud:
                      </label>
                      <div className="btn-group w-100" role="group">
                        <button
                          type="button"
                          className={`btn btn-sm ${nuevaAptitud === 'Apto' ? 'btn-success fw-bold' : 'btn-outline-success'}`}
                          onClick={() => setNuevaAptitud('Apto')}
                        >
                          <i className="bi bi-check-circle-fill me-1"></i> Apto
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${nuevaAptitud === 'No Apto' ? 'btn-danger fw-bold' : 'btn-outline-danger'}`}
                          onClick={() => setNuevaAptitud('No Apto')}
                        >
                          <i className="bi bi-x-circle-fill me-1"></i> No Apto
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${nuevaAptitud === 'En Evaluación' ? 'btn-warning fw-bold text-dark' : 'btn-outline-warning text-dark'}`}
                          onClick={() => setNuevaAptitud('En Evaluación')}
                        >
                          <i className="bi bi-hourglass-split me-1"></i> En Evaluación
                        </button>
                      </div>
                    </div>

                    {/* 3. ESTATUS OFICIAL */}
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-dark d-block mb-1.5">
                        2. Estatus Oficial de la Solicitud:
                      </label>
                      <select
                        className="form-select form-select-sm"
                        value={nuevoEstado}
                        onChange={e => setNuevoEstado(e.target.value)}
                      >
                        <option value="Pendiente">Pendiente (Sin Dictamen Final)</option>
                        <option value="En Evaluación">Sigue en Evaluación</option>
                        <option value="Aprobado">Aprobado (Aceptar para Inscripción Física)</option>
                        <option value="Formalizado">Formalizado (Inscrito Oficial)</option>
                        <option value="Rechazado">Rechazado (No Admitido)</option>
                      </select>
                    </div>

                    {/* 4. OBSERVACIONES */}
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-dark mb-1">
                        Observaciones / Dictamen Técnico:
                      </label>
                      <textarea
                        className="form-control form-control-sm"
                        rows={3}
                        placeholder="Ingrese justificación de aptitud, motivos de desaprobación o notas internas..."
                        value={nuevasObservaciones}
                        onChange={e => setNuevasObservaciones(e.target.value)}
                      ></textarea>
                    </div>

                    {/* BOTONES DE ACCIÓN */}
                    <div className="d-grid gap-2">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm fw-bold py-2 shadow-sm"
                        onClick={() => guardarEvaluacion(solicitudUnoAUno, false)}
                        disabled={guardandoEstado}
                      >
                        {guardandoEstado ? (
                          <><span className="spinner-border spinner-border-sm me-1"></span> Guardando...</>
                        ) : (
                          <><i className="bi bi-save me-1"></i> Guardar Evaluación</>
                        )}
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm fw-bold py-2"
                        onClick={() => guardarEvaluacion(solicitudUnoAUno, true)}
                        disabled={guardandoEstado || indiceUnoAUno >= solicitudesFiltradas.length - 1}
                      >
                        <i className="bi bi-check2-circle me-1"></i> Guardar y Siguiente Aspirante ⏩
                      </button>

                      {solicitudUnoAUno.estado === 'Aprobado' && (
                        <button
                          type="button"
                          className="btn btn-teal btn-sm fw-bold py-2 text-white shadow-sm"
                          style={{ backgroundColor: '#0D9488' }}
                          onClick={() => abrirModalFormalizar(solicitudUnoAUno)}
                        >
                          <i className="bi bi-journal-check me-1"></i> 📝 Formalizar Inscripción Física
                        </button>
                      )}

                      {solicitudUnoAUno.estado === 'Formalizado' && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm fw-bold py-2"
                          onClick={() => {
                            setSolicitudConstancia(solicitudUnoAUno);
                            setModalConstanciaAbierto(true);
                          }}
                        >
                          <i className="bi bi-printer me-1"></i> 🖨️ Imprimir Constancia / Resumen
                        </button>
                      )}

                      {(solicitudUnoAUno.estado === 'Aprobado' || solicitudUnoAUno.estado === 'Formalizado') && (
                        <>
                          <button
                            type="button"
                            className="btn btn-outline-info btn-sm fw-bold py-2 mt-2 w-100 d-flex align-items-center justify-content-center gap-1"
                            onClick={() => descargarCartaAceptacionAspirante(solicitudUnoAUno)}
                          >
                            <i className="bi bi-file-earmark-check-fill text-info"></i>
                            <span>Descargar Carta de Aceptación (PDF Oficial)</span>
                          </button>
                          {(() => {
                            const accUno = verificarAccesoHabilitado(solicitudUnoAUno, estudiantesMatriculaBD);
                            return (
                              <>
                                {accUno.habilitado && (
                                  <div className="alert alert-success border-0 shadow-xs p-2.5 rounded-3 mt-2 mb-1 d-flex align-items-center gap-2" style={{ backgroundColor: '#F0FDF4', borderLeft: '4px solid #16A34A' }}>
                                    <i className="bi bi-check-circle-fill text-success fs-5"></i>
                                    <div className="small">
                                      <strong className="text-success d-block">Acceso SIGAE Habilitado</strong>
                                      <span className="text-muted extra-small">Este estudiante ya cuenta con acceso activo en el portal del representante.</span>
                                    </div>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  className={`btn btn-sm fw-bold py-2 mt-2 w-100 text-white shadow-sm d-flex align-items-center justify-content-center gap-1.5 ${
                                    accUno.habilitado ? 'btn-success' : ''
                                  }`}
                                  style={{ backgroundColor: accUno.habilitado ? '#16A34A' : '#6366F1' }}
                                  onClick={() => abrirModalHabilitarAcceso(solicitudUnoAUno)}
                                >
                                  <i className={`bi ${accUno.habilitado ? 'bi-check-circle-fill' : 'bi-person-plus-fill'}`}></i>
                                  <span>{accUno.habilitado ? 'Acceso Habilitado (Ver / Modificar)' : 'Habilitar / Vincular Acceso Representante'}</span>
                                </button>
                              </>
                            );
                          })()}
                        </>
                      )}

                      {(() => {
                        const parsed = parsearObservaciones(solicitudUnoAUno.observaciones);
                        return (
                          <div className="mt-2 p-2.5 rounded-3 border bg-light">
                            <div className="d-flex align-items-center justify-content-between mb-1.5 flex-wrap gap-1">
                              <small className="fw-bold text-dark extra-small">
                                <i className="bi bi-whatsapp text-success me-1"></i> Estado Notificación WhatsApp:
                              </small>
                              {parsed.whatsapp_notificado ? (
                                <span className="badge extra-small rounded-pill py-0.5 px-2 fw-bold" style={{ backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC' }}>
                                  <i className="bi bi-check-circle-fill me-1"></i> Enviado ({parsed.whatsapp_estado || 'Notificado'})
                                </span>
                              ) : (
                                <span className="badge extra-small rounded-pill py-0.5 px-2 fw-semibold" style={{ backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #CBD5E1' }}>
                                  <i className="bi bi-clock-history me-1"></i> Sin Notificar
                                </span>
                              )}
                            </div>
                            {parsed.whatsapp_notificado && parsed.whatsapp_fecha && (
                              <div className="extra-small text-muted mb-2">
                                <i className="bi bi-calendar3 me-1"></i> Registrado el: <b>{parsed.whatsapp_fecha}</b>
                              </div>
                            )}
                            <button
                              type="button"
                              className="btn btn-success btn-sm fw-bold py-1.5 text-white shadow-sm w-100 d-flex align-items-center justify-content-center gap-1.5"
                              style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
                              onClick={() => notificarRepresentanteWhatsApp(solicitudUnoAUno)}
                            >
                              <i className="bi bi-whatsapp"></i>
                              <span>{solicitudUnoAUno.estado === 'Aprobado' || solicitudUnoAUno.estado === 'Formalizado' ? (parsed.whatsapp_notificado ? '📲 Reenviar Carta de Aceptación por WhatsApp' : '📲 Notificar Carta de Aceptación por WhatsApp') : (parsed.whatsapp_notificado ? '📲 Reenviar Notificación por WhatsApp' : '📲 Enviar Notificación por WhatsApp')}</span>
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* VISTA 3: FORMALIZACIÓN DE INSCRIPCIÓN FÍSICA (PARA DOCENTES)               */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {vistaActiva === 'formalizacion' && (
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div>
              <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-journal-check" style={{ color: '#0D9488' }}></i>
                Aspirantes Aceptados y Formalización de Matrícula Física
              </h5>
              <small className="text-muted">
                Espacio de trabajo para los docentes y personal directivo encargados de verificar recaudos físicos e inscribir formalmente.
              </small>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="badge px-3 py-2 fw-bold" style={{ backgroundColor: '#0D9488', color: '#fff' }}>
                {solicitudesFormalizacionFiltradas.length} de {solicitudesAceptadasParaFormalizar.length} Aceptados
              </span>
              <button
                type="button"
                onClick={exportarExcelFormalizacion}
                className="btn btn-sm btn-success fw-bold px-3 py-1.5 shadow-sm d-flex align-items-center gap-1.5 hover-efecto"
                style={{ backgroundColor: '#107c41', borderColor: '#107c41' }}
                title="Descargar data filtrada de formalización a Excel (.xlsx)"
              >
                <i className="bi bi-file-earmark-excel-fill"></i>
                <span>Descargar Excel ({solicitudesFormalizacionFiltradas.length})</span>
              </button>
            </div>
          </div>

          {/* Barra interactiva de Búsqueda, Filtros Avanzados y Acciones para Formalización */}
          <div className="p-3 bg-light border-bottom">
            {/* Fila 1: Búsqueda y Filtro de Estado Rápido */}
            <div className="row g-2 align-items-center mb-2.5">
              <div className="col-12 col-lg-6">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-white text-muted border-end-0">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    placeholder="Buscar por estudiante, cédula, representante, teléfono, código..."
                    value={busquedaFormalizacion}
                    onChange={e => setBusquedaFormalizacion(e.target.value)}
                  />
                  {busquedaFormalizacion && (
                    <button
                      className="btn btn-outline-secondary border-start-0 bg-white"
                      type="button"
                      onClick={() => setBusquedaFormalizacion('')}
                      title="Borrar texto de búsqueda"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                </div>
              </div>

              <div className="col-12 col-lg-6 d-flex justify-content-lg-end align-items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFiltroEstadoFormalizacion('todos')}
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${filtroEstadoFormalizacion === 'todos' ? 'text-white shadow-xs' : 'bg-white text-muted border'}`}
                  style={{ backgroundColor: filtroEstadoFormalizacion === 'todos' ? '#0D9488' : undefined, fontSize: '0.78rem' }}
                >
                  Todos ({solicitudesAceptadasParaFormalizar.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroEstadoFormalizacion('pendientes')}
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${filtroEstadoFormalizacion === 'pendientes' ? 'text-white shadow-xs' : 'bg-white text-muted border'}`}
                  style={{ backgroundColor: filtroEstadoFormalizacion === 'pendientes' ? '#eab308' : undefined, fontSize: '0.78rem' }}
                >
                  Pendientes ({kpisFormalizacion.pendientes})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroEstadoFormalizacion('formalizados')}
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${filtroEstadoFormalizacion === 'formalizados' ? 'text-white shadow-xs' : 'bg-white text-muted border'}`}
                  style={{ backgroundColor: filtroEstadoFormalizacion === 'formalizados' ? '#16a34a' : undefined, fontSize: '0.78rem' }}
                >
                  Formalizados ({kpisFormalizacion.formalizados})
                </button>
                {(busquedaFormalizacion || filtroEstadoFormalizacion !== 'todos' || filtroEscuelaFormalizacion !== 'todas' || filtroGradoFormalizacion !== 'todos' || filtroSeccionFormalizacion !== 'todas' || filtroWhatsAppFormalizacion !== 'todos') && (
                  <button
                    type="button"
                    onClick={limpiarFiltrosFormalizacion}
                    className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-1 extra-small fw-bold"
                    title="Restablecer todos los filtros"
                  >
                    <i className="bi bi-arrow-counterclockwise me-1"></i>Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Fila 2: Filtros Selectores Específicos (Sede, Grado, Sección, WhatsApp) */}
            <div className="row g-2 align-items-center">
              {/* Filtro Sede / Escuela */}
              <div className="col-6 col-md-3">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-white text-secondary extra-small fw-bold">
                    <i className="bi bi-building me-1"></i>Sede
                  </span>
                  <select
                    className="form-select form-select-sm"
                    value={filtroEscuelaFormalizacion}
                    onChange={e => setFiltroEscuelaFormalizacion(e.target.value)}
                    disabled={esSedeFija}
                    title={esSedeFija ? `Asignado exclusivamente a ${escuelaUsuarioAsignada === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar'}` : undefined}
                  >
                    {!esSedeFija && <option value="todas">Todas las Sedes</option>}
                    {(!esSedeFija || escuelaUsuarioAsignada === 'sb') && <option value="sb">U.E. Santa Bárbara</option>}
                    {(!esSedeFija || escuelaUsuarioAsignada === 'lb') && <option value="lb">U.E. Libertador Bolívar</option>}
                  </select>
                </div>
              </div>

              {/* Filtro Grado */}
              <div className="col-6 col-md-3">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-white text-secondary extra-small fw-bold">
                    <i className="bi bi-mortarboard me-1"></i>Grado
                  </span>
                  <select
                    className="form-select form-select-sm"
                    value={filtroGradoFormalizacion}
                    onChange={e => setFiltroGradoFormalizacion(e.target.value)}
                  >
                    <option value="todos">Todos los Grados</option>
                    {gradosDisponiblesFormalizacion.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filtro Sección */}
              <div className="col-6 col-md-3">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-white text-secondary extra-small fw-bold">
                    <i className="bi bi-grid-3x3 me-1"></i>Sección
                  </span>
                  <select
                    className="form-select form-select-sm"
                    value={filtroSeccionFormalizacion}
                    onChange={e => setFiltroSeccionFormalizacion(e.target.value)}
                  >
                    <option value="todas">Todas las Secciones</option>
                    <option value="A">Sección A</option>
                    <option value="B">Sección B</option>
                    <option value="C">Sección C</option>
                    <option value="D">Sección D</option>
                    <option value="sin_seccion">Sin Asignar</option>
                  </select>
                </div>
              </div>

              {/* Filtro Notificación WhatsApp */}
              <div className="col-6 col-md-3">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-white text-secondary extra-small fw-bold">
                    <i className="bi bi-whatsapp text-success me-1"></i>Aviso
                  </span>
                  <select
                    className="form-select form-select-sm"
                    value={filtroWhatsAppFormalizacion}
                    onChange={e => setFiltroWhatsAppFormalizacion(e.target.value)}
                  >
                    <option value="todos">Todos los Avisos</option>
                    <option value="enviado">Notificados por WhatsApp</option>
                    <option value="pendiente">Sin Notificar por WhatsApp</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            {solicitudesFormalizacionFiltradas.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
                <h6 className="fw-bold text-dark mb-1">No hay aspirantes con estatus Aprobado o Formalizado</h6>
                <p className="text-muted small">
                  Apruebe solicitudes en la pestaña de <b>Baremo</b> o <b>Auditoría Uno por Uno</b> para que aparezcan disponibles aquí.
                </p>
              </div>
            ) : (
              <>
                {/* ── VISTA ESCRITORIO: TABLA (≥ lg) ──────────────────────────── */}
                <div className="table-responsive d-none d-lg-block">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '40px' }} className="text-center">#</th>
                        <th>Código Único</th>
                        <th>Escuela</th>
                        <th>Aspirante</th>
                        <th>Grado Solicitado</th>
                        <th>Representante Legal</th>
                        <th>Teléfono Contacto</th>
                        <th className="text-center">Estado Formalización</th>
                        <th className="text-end" style={{ width: '220px' }}>Acción Docente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {solicitudesFormalizacionFiltradas.map((sol, idx) => {
                        const esFormalizado = sol.estado === 'Formalizado' || sol.estado === 'Inscrito';
                        const nomEst = nombreCompleto(sol.estudiante_nombres, sol.estudiante_apellidos);
                        const nomRep = nombreCompleto(sol.representante_nombres, sol.representante_apellidos);

                        return (
                          <tr key={sol.id || sol.codigo_unico} className={esFormalizado ? 'table-light' : ''}>
                            <td className="text-center fw-bold text-muted small">{idx + 1}</td>
                            <td>
                              <span className="fw-bold text-primary font-monospace">{sol.codigo_unico}</span>
                            </td>
                            <td>
                              <span className="badge bg-light text-dark border">
                                {NOMBRE_ESCUELA_MAP[sol.codigo_escuela] || sol.codigo_escuela}
                              </span>
                            </td>
                            <td>
                              <div className="fw-bold text-dark">{nomEst}</div>
                              <div className="text-muted extra-small">C.I: {sol.estudiante_cedula || 'En trámite'}</div>
                            </td>
                            <td>
                              <span className="badge bg-secondary-subtle text-secondary border">
                                {sol.grado_solicitado}
                              </span>
                            </td>
                            <td>
                              <div>{nomRep}</div>
                              <div className="text-muted extra-small">C.I. {sol.representante_cedula}</div>
                            </td>
                            <td>
                              <span className="text-dark small">{sol.representante_telefono || 'N/A'}</span>
                            </td>
                            <td className="text-center">
                              {esFormalizado ? (
                                <span className="badge bg-success-subtle text-success border border-success px-2.5 py-1 rounded-pill">
                                  <i className="bi bi-check-circle-fill me-1"></i> Inscrito / Formalizado
                                </span>
                              ) : (
                                <span className="badge bg-warning-subtle text-warning-emphasis border border-warning px-2.5 py-1 rounded-pill">
                                  <i className="bi bi-clock-fill me-1"></i> Pendiente por Consignar Físico
                                </span>
                              )}
                            </td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                {!esFormalizado ? (
                                  <button
                                    className="btn btn-sm fw-bold text-white shadow-sm"
                                    style={{ backgroundColor: '#0D9488' }}
                                    onClick={() => abrirModalFormalizar(sol)}
                                    title="Verificar recaudos físicos y formalizar"
                                  >
                                    <i className="bi bi-journal-check me-1"></i> Formalizar
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => {
                                      setSolicitudConstancia(sol);
                                      setModalConstanciaAbierto(true);
                                    }}
                                    title="Imprimir Constancia de Matrícula"
                                  >
                                    <i className="bi bi-printer-fill me-1"></i> Constancia
                                  </button>
                                )}
                                {(() => {
                                  const accF = verificarAccesoHabilitado(sol, estudiantesMatriculaBD);
                                  return (
                                    <button
                                      className={`btn btn-sm ${accF.habilitado ? 'btn-success text-white shadow-xs' : 'btn-outline-primary'}`}
                                      style={!accF.habilitado ? { borderColor: '#6366F1', color: '#4F46E5' } : undefined}
                                      onClick={() => abrirModalHabilitarAcceso(sol)}
                                      title={accF.habilitado ? `✅ Acceso SIGAE Habilitado${accF.fecha ? ` el ${accF.fecha}` : ''}. Clic para ver o modificar.` : 'Habilitar o Vincular Acceso Representante en SIGAE'}
                                    >
                                      <i className={`bi ${accF.habilitado ? 'bi-check-circle-fill' : 'bi-person-plus-fill'}`}></i>
                                    </button>
                                  );
                                })()}
                                <button
                                  className="btn btn-sm btn-outline-success"
                                  onClick={() => notificarRepresentanteWhatsApp(sol)}
                                  title="Notificar por WhatsApp"
                                >
                                  <i className="bi bi-whatsapp"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── VISTA MÓVIL: TARJETAS DE FORMALIZACIÓN (< lg) ───────────── */}
                <div className="d-block d-lg-none p-2 p-sm-3 bg-light">
                  <div className="d-flex flex-column gap-2.5">
                    {solicitudesFormalizacionFiltradas.map((sol, idx) => {
                      const esFormalizado = sol.estado === 'Formalizado' || sol.estado === 'Inscrito';
                      const nomEst = nombreCompleto(sol.estudiante_nombres, sol.estudiante_apellidos);
                      const nomRep = nombreCompleto(sol.representante_nombres, sol.representante_apellidos);

                      return (
                        <div key={sol.id || sol.codigo_unico} className="card border-0 shadow-xs rounded-3 bg-white overflow-hidden">
                          {/* Header */}
                          <div className="card-header bg-white py-2 px-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-1">
                            <div className="d-flex align-items-center gap-1.5">
                              <span className="badge bg-dark text-white rounded-pill extra-small px-2 py-0.5">
                                #{idx + 1}
                              </span>
                              <span className="fw-bold text-primary font-monospace extra-small">
                                {sol.codigo_unico}
                              </span>
                            </div>

                            {esFormalizado ? (
                              <span className="badge bg-success text-white extra-small rounded-pill py-0.5 px-2">
                                <i className="bi bi-check-circle-fill me-1"></i> Inscrito
                              </span>
                            ) : (
                              <span className="badge bg-warning text-dark extra-small rounded-pill py-0.5 px-2">
                                <i className="bi bi-clock-fill me-1"></i> Pendiente Físico
                              </span>
                            )}
                          </div>

                          {/* Body */}
                          <div className="card-body p-3">
                            <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                              <div>
                                <h6 className="fw-bold text-dark mb-0 fs-6">
                                  {nomEst}
                                </h6>
                                <small className="text-muted extra-small d-block">
                                  C.I: <b>{sol.estudiante_cedula || 'En trámite'}</b> • Grado: <b className="text-primary">{sol.grado_solicitado}</b>
                                </small>
                              </div>
                              <span className="badge bg-light text-dark border extra-small flex-shrink-0">
                                {NOMBRE_ESCUELA_MAP[sol.codigo_escuela] || sol.codigo_escuela}
                              </span>
                            </div>

                            <div className="bg-light p-2.5 rounded-3 mb-2 small">
                              <div className="row g-1 extra-small">
                                <div className="col-12">
                                  <span className="text-muted d-block">Representante Legal:</span>
                                  <strong className="text-dark">{nomRep}</strong> (C.I. {sol.representante_cedula})
                                </div>
                                <div className="col-12 pt-1 border-top border-secondary-subtle d-flex align-items-center justify-content-between">
                                  <span>
                                    <span className="text-muted">Teléfono: </span>
                                    <strong className="text-dark">{sol.representante_telefono || 'N/A'}</strong>
                                  </span>
                                  {sol.representante_telefono && (
                                    <a
                                      href={`tel:${sol.representante_telefono}`}
                                      className="btn btn-outline-secondary btn-sm py-0.2 px-2 extra-small rounded-pill"
                                    >
                                      <i className="bi bi-telephone-fill me-1"></i> Llamar
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="card-footer bg-light py-2 px-3 border-top d-flex align-items-center justify-content-between gap-1.5 flex-wrap">
                            {!esFormalizado ? (
                              <button
                                type="button"
                                className="btn btn-teal btn-sm flex-grow-1 fw-bold text-white shadow-xs py-1.5 extra-small d-flex align-items-center justify-content-center gap-1"
                                style={{ backgroundColor: '#0D9488' }}
                                onClick={() => abrirModalFormalizar(sol)}
                              >
                                <i className="bi bi-journal-check"></i>
                                <span>Formalizar Matrícula Física</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm flex-grow-1 fw-bold py-1.5 extra-small d-flex align-items-center justify-content-center gap-1"
                                onClick={() => {
                                  setSolicitudConstancia(sol);
                                  setModalConstanciaAbierto(true);
                                }}
                              >
                                <i className="bi bi-printer-fill"></i>
                                <span>Ver / Imprimir Constancia</span>
                              </button>
                            )}

                            {(() => {
                              const accFM = verificarAccesoHabilitado(sol, estudiantesMatriculaBD);
                              return accFM.habilitado ? (
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm py-1.5 px-2.5 extra-small fw-bold text-white shadow-xs d-inline-flex align-items-center gap-1"
                                  onClick={() => abrirModalHabilitarAcceso(sol)}
                                  title={`✅ Acceso SIGAE Habilitado${accFM.fecha ? ` el ${accFM.fecha}` : ''}. Clic para ver o modificar.`}
                                >
                                  <i className="bi bi-check-circle-fill"></i>
                                  <span>Habilitado</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-outline-primary btn-sm py-1.5 px-2.5 extra-small fw-bold d-inline-flex align-items-center gap-1"
                                  style={{ borderColor: '#6366F1', color: '#4F46E5' }}
                                  onClick={() => abrirModalHabilitarAcceso(sol)}
                                  title="Habilitar Acceso SIGAE para Representante y Estudiante"
                                >
                                  <i className="bi bi-person-plus-fill"></i>
                                  <span>Acceso</span>
                                </button>
                              );
                            })()}
                            <button
                              type="button"
                              className="btn btn-outline-success btn-sm py-1.5 px-2.5 extra-small fw-bold"
                              onClick={() => notificarRepresentanteWhatsApp(sol)}
                              title="Notificar por WhatsApp"
                            >
                              <i className="bi bi-whatsapp"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL INTERACTIVO DE FORMALIZACIÓN FÍSICA DE MATRÍCULA ───────────── */}
      {modalFormalizarAbierto && solicitudParaFormalizar && createPortal(
        <div
          className="modal fade show d-flex align-items-center justify-content-center"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 1060,
            overflowY: 'auto',
            padding: '12px'
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down my-auto mx-auto w-100" style={{ maxWidth: '900px', maxHeight: '92vh' }}>
            <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
              <div className="modal-header py-3 text-white" style={{ backgroundColor: '#0D9488' }}>
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-journal-check fs-4"></i> Formalización de Inscripción Física
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setModalFormalizarAbierto(false)}
                ></button>
              </div>

              <div className="modal-body p-4" style={{ fontSize: '13.5px' }}>
                {/* 1. VERIFICACIÓN Y CONSULTA DE DATOS CON OPCIÓN DE MODIFICACIÓN */}
                <div className="card mb-3 border shadow-xs overflow-hidden rounded-3">
                  <div className="card-header py-2.5 px-3 bg-light d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge rounded-circle p-1.5 text-white" style={{ backgroundColor: '#0D9488' }}>
                        <i className="bi bi-person-check-fill fs-6"></i>
                      </span>
                      <div>
                        <strong className="small text-dark d-block">1. Verificación de Datos del Estudiante y Representante</strong>
                        <small className="text-muted extra-small">
                          ¿Los datos del aspirante o representante son correctos? Modifíquelos de ser necesario.
                        </small>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`btn btn-xs rounded-pill px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-1.5 shadow-2xs ${editandoDatosFormalizar ? 'btn-success text-white' : 'btn-outline-primary bg-white'}`}
                      onClick={() => setEditandoDatosFormalizar(!editandoDatosFormalizar)}
                      title={editandoDatosFormalizar ? 'Finalizar edición' : 'Permite corregir nombres, cédulas, teléfonos o grado asignado'}
                    >
                      <i className={`bi ${editandoDatosFormalizar ? 'bi-check-lg' : 'bi-pencil-square'}`}></i>
                      <span>{editandoDatosFormalizar ? 'Guardar Cambios' : 'Modificar Datos'}</span>
                    </button>
                  </div>

                  <div className="card-body p-3 bg-white">
                    {editandoDatosFormalizar ? (
                      /* FORMULARIO DE MODIFICACIÓN ACTIVO */
                      <div className="p-3 rounded-3 border" style={{ backgroundColor: '#F8FAFC' }}>
                        <div className="alert alert-warning py-2 px-3 mb-3 small d-flex align-items-center gap-2 border-0">
                          <i className="bi bi-exclamation-triangle-fill text-warning fs-5"></i>
                          <span>
                            <b>Modo de corrección activo:</b> Los cambios que aplique aquí actualizarán el expediente en la matrícula oficial, en el usuario del representante y en la constancia de inscripción física.
                          </span>
                        </div>

                        <div className="row g-3">
                          {/* Columna Estudiante */}
                          <div className="col-12 col-md-6 border-end-md">
                            <h6 className="fw-bold text-primary small mb-2.5 d-flex align-items-center gap-1.5">
                              <i className="bi bi-mortarboard-fill"></i>
                              <span>Datos del Estudiante / Aspirante</span>
                            </h6>

                            <div className="mb-2">
                              <label className="form-label extra-small fw-bold text-secondary mb-1">Cédula / Identificador Escolar:</label>
                              <input
                                type="text"
                                className="form-control form-control-sm font-monospace"
                                value={formDatosFormalizar.estudiante_cedula}
                                onChange={e => setFormDatosFormalizar({ ...formDatosFormalizar, estudiante_cedula: e.target.value })}
                                placeholder="Cédula de identidad o escolar"
                              />
                            </div>

                            <div className="row g-2 mb-2">
                              <div className="col-6">
                                <label className="form-label extra-small fw-bold text-secondary mb-1">Nombres *:</label>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={formDatosFormalizar.estudiante_nombres}
                                  onChange={e => setFormDatosFormalizar({ ...formDatosFormalizar, estudiante_nombres: e.target.value })}
                                />
                              </div>
                              <div className="col-6">
                                <label className="form-label extra-small fw-bold text-secondary mb-1">Apellidos *:</label>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={formDatosFormalizar.estudiante_apellidos}
                                  onChange={e => setFormDatosFormalizar({ ...formDatosFormalizar, estudiante_apellidos: e.target.value })}
                                />
                              </div>
                            </div>

                            <div className="row g-2">
                              <div className="col-7">
                                <label className="form-label extra-small fw-bold text-secondary mb-1">Grado Solicitado *:</label>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={formDatosFormalizar.grado_solicitado}
                                  onChange={e => setFormDatosFormalizar({ ...formDatosFormalizar, grado_solicitado: e.target.value })}
                                />
                              </div>
                              <div className="col-5">
                                <label className="form-label extra-small fw-bold text-secondary mb-1">Plantel *:</label>
                                <select
                                  className="form-select form-select-sm"
                                  value={formDatosFormalizar.codigo_escuela}
                                  onChange={e => setFormDatosFormalizar({ ...formDatosFormalizar, codigo_escuela: e.target.value })}
                                >
                                  <option value="sb">Santa Bárbara</option>
                                  <option value="lb">Libertador B.</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Columna Representante */}
                          <div className="col-12 col-md-6">
                            <h6 className="fw-bold text-primary small mb-2.5 d-flex align-items-center gap-1.5">
                              <i className="bi bi-person-fill"></i>
                              <span>Datos del Representante Legal</span>
                            </h6>

                            <div className="mb-2">
                              <label className="form-label extra-small fw-bold text-secondary mb-1">Cédula del Representante *:</label>
                              <input
                                type="text"
                                className="form-control form-control-sm font-monospace"
                                value={formDatosFormalizar.representante_cedula}
                                onChange={e => setFormDatosFormalizar({ ...formDatosFormalizar, representante_cedula: e.target.value })}
                                placeholder="V-12345678"
                              />
                            </div>

                            <div className="row g-2 mb-2">
                              <div className="col-6">
                                <label className="form-label extra-small fw-bold text-secondary mb-1">Nombres *:</label>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={formDatosFormalizar.representante_nombres}
                                  onChange={e => setFormDatosFormalizar({ ...formDatosFormalizar, representante_nombres: e.target.value })}
                                />
                              </div>
                              <div className="col-6">
                                <label className="form-label extra-small fw-bold text-secondary mb-1">Apellidos *:</label>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={formDatosFormalizar.representante_apellidos}
                                  onChange={e => setFormDatosFormalizar({ ...formDatosFormalizar, representante_apellidos: e.target.value })}
                                />
                              </div>
                            </div>

                            <div className="row g-2">
                              <div className="col-6">
                                <label className="form-label extra-small fw-bold text-secondary mb-1">Teléfono:</label>
                                <input
                                  type="text"
                                  className="form-control form-control-sm font-monospace"
                                  value={formDatosFormalizar.representante_telefono}
                                  onChange={e => setFormDatosFormalizar({ ...formDatosFormalizar, representante_telefono: e.target.value })}
                                  placeholder="04141234567"
                                />
                              </div>
                              <div className="col-6">
                                <label className="form-label extra-small fw-bold text-secondary mb-1">Correo Electrónico:</label>
                                <input
                                  type="email"
                                  className="form-control form-control-sm"
                                  value={formDatosFormalizar.representante_email}
                                  onChange={e => setFormDatosFormalizar({ ...formDatosFormalizar, representante_email: e.target.value })}
                                  placeholder="correo@ejemplo.com"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* VISTA DE LECTURA Y CONFIRMACIÓN RÁPIDA */
                      <div className="p-3 rounded-3 border bg-light">
                        <div className="row g-3">
                          <div className="col-12 col-md-6 border-end-md">
                            <span className="text-muted d-block extra-small fw-bold text-uppercase mb-1">Estudiante a Inscribir:</span>
                            <div className="d-flex align-items-baseline gap-2">
                              <strong className="text-dark fs-6">
                                {formDatosFormalizar.estudiante_nombres || formDatosFormalizar.estudiante_apellidos
                                  ? `${formDatosFormalizar.estudiante_nombres} ${formDatosFormalizar.estudiante_apellidos}`.trim()
                                  : nombreCompleto(solicitudParaFormalizar.estudiante_nombres, solicitudParaFormalizar.estudiante_apellidos)}
                              </strong>
                              <span className="badge bg-light text-dark border extra-small">
                                C.I: {formDatosFormalizar.estudiante_cedula || solicitudParaFormalizar.estudiante_cedula || `T-${solicitudParaFormalizar.codigo_unico}`}
                              </span>
                            </div>
                            <div className="d-flex align-items-center gap-2 mt-1.5">
                              <span className="badge bg-primary-subtle text-primary border border-primary-subtle extra-small">
                                Grado: {formDatosFormalizar.grado_solicitado || solicitudParaFormalizar.grado_solicitado}
                              </span>
                              <span className="badge bg-success-subtle text-success border border-success-subtle extra-small">
                                Plantel: {formDatosFormalizar.codigo_escuela?.toUpperCase() || solicitudParaFormalizar.codigo_escuela?.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div className="col-12 col-md-6">
                            <span className="text-muted d-block extra-small fw-bold text-uppercase mb-1">Representante Legal:</span>
                            <div className="d-flex align-items-baseline gap-2">
                              <strong className="text-dark fs-6">
                                {formDatosFormalizar.representante_nombres || formDatosFormalizar.representante_apellidos
                                  ? `${formDatosFormalizar.representante_nombres} ${formDatosFormalizar.representante_apellidos}`.trim()
                                  : nombreCompleto(solicitudParaFormalizar.representante_nombres, solicitudParaFormalizar.representante_apellidos)}
                              </strong>
                              <span className="badge bg-light text-dark border extra-small">
                                C.I: {formDatosFormalizar.representante_cedula || solicitudParaFormalizar.representante_cedula}
                              </span>
                            </div>
                            <div className="small text-muted mt-1.5 font-monospace">
                              <i className="bi bi-telephone-fill me-1 text-secondary"></i>
                              <span>{formDatosFormalizar.representante_telefono || solicitudParaFormalizar.representante_telefono || 'Sin teléfono'}</span>
                              {formDatosFormalizar.representante_email && (
                                <span className="ms-2">
                                  <i className="bi bi-envelope-fill me-1 text-secondary"></i>
                                  {formDatosFormalizar.representante_email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
                          <span className="extra-small text-success fw-bold d-flex align-items-center gap-1">
                            <i className="bi bi-check-circle-fill"></i>
                            <span>Verifique si los nombres, cédula o teléfono coinciden con los documentos físicos.</span>
                          </span>
                          <button
                            type="button"
                            className="btn btn-link btn-xs p-0 text-decoration-none fw-bold extra-small text-primary"
                            onClick={() => setEditandoDatosFormalizar(true)}
                          >
                            <i className="bi bi-pencil me-1"></i> Corregir algún dato
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ASIGNACIÓN DE SECCIÓN */}
                <div className="card mb-3 border">
                  <div className="card-header bg-light py-2 fw-bold text-dark small">
                    <i className="bi bi-grid-3x3-gap-fill me-1 text-primary"></i> 1. Asignación de Sección Escolar
                  </div>
                  <div className="card-body p-3">
                    <div className="row align-items-center">
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-bold small text-dark mb-1">Sección Asignada para el Estudiante:</label>
                        <select
                          className="form-select form-select-sm"
                          value={seccionFormalizacion}
                          onChange={e => setSeccionFormalizacion(e.target.value)}
                        >
                          <option value="A">Sección "A"</option>
                          <option value="B">Sección "B"</option>
                          <option value="C">Sección "C"</option>
                          <option value="D">Sección "D"</option>
                          <option value="U">Sección Única</option>
                        </select>
                      </div>
                      <div className="col-12 col-md-6">
                        <small className="text-muted d-block">
                          Esta sección será registrada en la matrícula oficial y vinculada a la cuenta del representante.
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CHECKLIST DE RECAUDOS FÍSICOS */}
                <div className="card mb-3 border">
                  <div className="card-header bg-light py-2 fw-bold text-dark small">
                    <i className="bi bi-check2-square me-1 text-success"></i> 2. Verificación de Recaudos Físicos en Taquilla
                  </div>
                  <div className="card-body p-3">
                    <p className="extra-small text-muted mb-2">Marque los documentos físicos entregados y validados por la institución:</p>
                    <div className="row g-2">
                      <div className="col-12 col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="recPartida"
                            checked={recaudosVerificados.partida_nacimiento}
                            onChange={e => setRecaudosVerificados({ ...recaudosVerificados, partida_nacimiento: e.target.checked })}
                          />
                          <label className="form-check-label small" htmlFor="recPartida">
                            Copia de Partida de Nacimiento
                          </label>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="recCedEst"
                            checked={recaudosVerificados.cedula_estudiante}
                            onChange={e => setRecaudosVerificados({ ...recaudosVerificados, cedula_estudiante: e.target.checked })}
                          />
                          <label className="form-check-label small" htmlFor="recCedEst">
                            Cédula de Identidad / Escolar
                          </label>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="recCedRep"
                            checked={recaudosVerificados.cedula_representante}
                            onChange={e => setRecaudosVerificados({ ...recaudosVerificados, cedula_representante: e.target.checked })}
                          />
                          <label className="form-check-label small" htmlFor="recCedRep">
                            Cédula del Representante Legal
                          </label>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="recFotos"
                            checked={recaudosVerificados.fotos_carnet}
                            onChange={e => setRecaudosVerificados({ ...recaudosVerificados, fotos_carnet: e.target.checked })}
                          />
                          <label className="form-check-label small" htmlFor="recFotos">
                            Fotos tipo Carnet del Estudiante
                          </label>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="recTrabajo"
                            checked={recaudosVerificados.constancia_trabajo}
                            onChange={e => setRecaudosVerificados({ ...recaudosVerificados, constancia_trabajo: e.target.checked })}
                          />
                          <label className="form-check-label small" htmlFor="recTrabajo">
                            Ficha / Constancia de Trabajo (PDVSA / Filial)
                          </label>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="recBoleta"
                            checked={recaudosVerificados.boleta_promocion}
                            onChange={e => setRecaudosVerificados({ ...recaudosVerificados, boleta_promocion: e.target.checked })}
                          />
                          <label className="form-check-label small" htmlFor="recBoleta">
                            Boleta de Promoción o Certificado de Calificaciones
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AVISO DE CREACIÓN AUTOMÁTICA */}
                <div className="alert alert-info border-0 p-3 mb-0 small">
                  <div className="d-flex align-items-start gap-2">
                    <i className="bi bi-shield-check fs-5 text-info"></i>
                    <div>
                      <strong>Automatización del Sistema:</strong>
                      <p className="mb-0 mt-1">
                        Al confirmar, el sistema creará automáticamente el <b>Usuario del Representante</b> en la plataforma con su número de cédula (<code>{solicitudParaFormalizar.representante_cedula}</code>), vinculará al estudiante en la matrícula activa y emitirá la <b>Constancia Oficial de Inscripción</b> con las credenciales de acceso.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light py-2 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setModalFormalizarAbierto(false)}
                  disabled={procesandoFormalizacion}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-teal btn-sm fw-bold px-4 text-white shadow-sm"
                  style={{ backgroundColor: '#0D9488' }}
                  onClick={ejecutarFormalizacion}
                  disabled={procesandoFormalizacion}
                >
                  {procesandoFormalizacion ? (
                    <><span className="spinner-border spinner-border-sm me-1" role="status"></span> Formalizando...</>
                  ) : (
                    <><i className="bi bi-check2-circle me-1"></i> Confirmar y Formalizar Inscripción</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL DE CONSTANCIA OFICIAL DE INSCRIPCIÓN Y CREDENCIALES ────────── */}
      {modalConstanciaAbierto && solicitudConstancia && createPortal(
        <div
          className="modal fade show d-flex align-items-center justify-content-center"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 99999,
            overflowY: 'auto',
            padding: '12px'
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down my-auto mx-auto w-100" style={{ maxWidth: '900px', maxHeight: '92vh' }}>
            <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
              <div className="modal-header py-3 bg-dark text-white d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-printer-fill"></i> Constancia Oficial de Admisión e Inscripción
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setModalConstanciaAbierto(false)}
                ></button>
              </div>

              <div className="modal-body p-4 bg-white" id="area-imprimible-constancia">
                {/* MEMBRETE */}
                <div className="text-center pb-3 mb-3 border-bottom">
                  <h6 className="fw-bold text-uppercase mb-1" style={{ fontSize: '13px', letterSpacing: '0.5px' }}>
                    República Bolivariana de Venezuela
                  </h6>
                  <h6 className="fw-bold text-uppercase mb-1" style={{ fontSize: '12px' }}>
                    Ministerio del Poder Popular para la Educación | PDVSA Oriente
                  </h6>
                  <h5 className="fw-bold text-primary mb-0 mt-2">
                    {NOMBRE_ESCUELA_MAP[solicitudConstancia.codigo_escuela] || 'UNIDAD EDUCATIVA'}
                  </h5>
                  <p className="text-muted extra-small mb-0">Sistema Integral de Gestión y Administración Escolar (SIGAE)</p>
                </div>

                {/* TÍTULO */}
                <div className="text-center my-3 py-1 bg-light rounded border">
                  <h6 className="fw-bold text-dark mb-0 text-uppercase" style={{ letterSpacing: '1px' }}>
                    Constancia Oficial de Formalización de Matrícula
                  </h6>
                  <small className="text-muted">Año Escolar 2026 - 2027 | Código Único: <b>{solicitudConstancia.codigo_unico}</b></small>
                </div>

                {/* CUERPO DE LA CONSTANCIA */}
                <div className="row g-3 small mb-3">
                  <div className="col-12">
                    <div className="p-3 border rounded bg-white">
                      <h6 className="fw-bold text-primary mb-2 border-bottom pb-1">I. Datos del Estudiante Matriculado</h6>
                      <div className="row g-2">
                        <div className="col-8">
                          <strong>Nombres y Apellidos:</strong> {nombreCompleto(solicitudConstancia.estudiante_nombres, solicitudConstancia.estudiante_apellidos)}
                        </div>
                        <div className="col-4">
                          <strong>Cédula / Identificador:</strong> {solicitudConstancia.estudiante_cedula || 'En trámite'}
                        </div>
                        <div className="col-6">
                          <strong>Grado Asignado:</strong> {solicitudConstancia.grado_solicitado}
                        </div>
                        <div className="col-6">
                          <strong>Fecha de Registro:</strong> {new Date().toLocaleDateString('es-VE')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="p-3 border rounded bg-white">
                      <h6 className="fw-bold text-primary mb-2 border-bottom pb-1">II. Datos del Representante Legal</h6>
                      <div className="row g-2">
                        <div className="col-8">
                          <strong>Nombres y Apellidos:</strong> {nombreCompleto(solicitudConstancia.representante_nombres, solicitudConstancia.representante_apellidos)}
                        </div>
                        <div className="col-4">
                          <strong>Cédula de Identidad:</strong> {solicitudConstancia.representante_cedula}
                        </div>
                        <div className="col-6">
                          <strong>Teléfono de Contacto:</strong> {solicitudConstancia.representante_telefono || 'N/A'}
                        </div>
                        <div className="col-6">
                          <strong>Filiación PDVSA / Nómina:</strong> {solicitudConstancia.pdvsa_tipo_nomina || 'Comunidad'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CREDENCIALES DE ACCESO AL SISTEMA */}
                  <div className="col-12">
                    <div className="p-3 border-2 border-primary rounded bg-light">
                      <h6 className="fw-bold text-primary mb-1 d-flex align-items-center gap-1.5">
                        <i className="bi bi-key-fill"></i> III. Credenciales de Acceso al Portal SIGAE para el Representante
                      </h6>
                      <p className="extra-small text-muted mb-2">
                        El representante debe ingresar al portal oficial para completar su ficha socioeconómica digital y descargar sus constancias en línea:
                      </p>
                      <div className="row g-2 bg-white p-2.5 rounded border">
                        <div className="col-6">
                          <span className="text-muted d-block extra-small">Usuario de Acceso:</span>
                          <strong className="text-dark font-monospace fs-6">{solicitudConstancia.representante_cedula}</strong>
                        </div>
                        <div className="col-6">
                          <span className="text-muted d-block extra-small">Contraseña Temporal:</span>
                          <strong className="text-dark font-monospace fs-6">{solicitudConstancia.representante_cedula}</strong>
                        </div>
                        <div className="col-12 mt-1 extra-small text-secondary">
                          <i className="bi bi-info-circle me-1"></i> Se le solicitará cambiar la contraseña en su primer inicio de sesión.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FIRMAS Y SELLOS */}
                <div className="row mt-4 pt-4 text-center">
                  <div className="col-6">
                    <div className="border-top pt-2" style={{ width: '80%', margin: '0 auto' }}>
                      <strong className="d-block small">Firma y Sello de la Dirección / Docente</strong>
                      <small className="text-muted extra-small">Comité de Admisiones y Matrícula</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border-top pt-2" style={{ width: '80%', margin: '0 auto' }}>
                      <strong className="d-block small">Firma del Representante Legal</strong>
                      <small className="text-muted extra-small">C.I: {solicitudConstancia.representante_cedula}</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light py-2 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setModalConstanciaAbierto(false)}
                >
                  Cerrar
                </button>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-success btn-sm fw-bold"
                    onClick={() => notificarRepresentanteWhatsApp(solicitudConstancia)}
                  >
                    <i className="bi bi-whatsapp me-1"></i> Enviar por WhatsApp
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm fw-bold px-3"
                    onClick={() => window.print()}
                  >
                    <i className="bi bi-printer me-1"></i> Imprimir Resumen / Constancia
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL DE DETALLE RÁPIDO ───────────────────────────────────────────── */}
      {modalAbierto && solicitudSeleccionada && createPortal(
        <div
          className="modal fade show d-flex align-items-center justify-content-center"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 99999,
            overflowY: 'auto',
            padding: '12px'
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down my-auto mx-auto w-100" style={{ maxWidth: '900px', maxHeight: '92vh' }}>
            <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
              <div className="modal-header bg-primary text-white py-3">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-clipboard-check"></i> Expediente: {solicitudSeleccionada.codigo_unico}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={cerrarModal}></button>
              </div>

              <div className="modal-body p-4" style={{ fontSize: '13.5px' }}>
                <div className="card mb-3 border-light bg-light">
                  <div className="card-body">
                    <h6 className="fw-bold text-primary border-bottom pb-2 mb-2">
                      <i className="bi bi-person-fill me-2"></i>Datos del Aspirante
                    </h6>
                    <div className="row g-2">
                      <div className="col-12 col-md-6">
                        <strong>Nombres y Apellidos:</strong> {nombreCompleto(solicitudSeleccionada.estudiante_nombres, solicitudSeleccionada.estudiante_apellidos)}
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Cédula / Escolar:</strong> {solicitudSeleccionada.estudiante_cedula || 'En trámite'}
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Grado Solicitado:</strong> {solicitudSeleccionada.grado_solicitado}
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Escuela Asignada:</strong> {NOMBRE_ESCUELA_MAP[solicitudSeleccionada.codigo_escuela] || solicitudSeleccionada.codigo_escuela}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card mb-3 border-light bg-light">
                  <div className="card-body">
                    <h6 className="fw-bold text-primary border-bottom pb-2 mb-2">
                      <i className="bi bi-building-gear me-2"></i>Datos del Representante y Empresa
                    </h6>
                    <div className="row g-2">
                      <div className="col-12 col-md-6">
                        <strong>Representante Legal:</strong> {nombreCompleto(solicitudSeleccionada.representante_nombres, solicitudSeleccionada.representante_apellidos)}
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Cédula:</strong> {solicitudSeleccionada.representante_cedula} ({solicitudSeleccionada.parentesco || solicitudSeleccionada.representante_parentesco || 'Representante'})
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Teléfono:</strong> {solicitudSeleccionada.representante_telefono || 'N/A'}
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Tipo de Nómina:</strong> {solicitudSeleccionada.pdvsa_tipo_nomina || 'Comunidad'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RECAUDOS Y DOCUMENTOS ADJUNTOS EN MODAL DETALLE */}
                {(() => {
                  const docsDetalle = obtenerDocumentosSolicitud(solicitudSeleccionada);
                  return (
                    <div className="card mb-3 border-light bg-light">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                          <h6 className="fw-bold text-primary mb-0 d-flex align-items-center gap-2">
                            <i className="bi bi-file-earmark-pdf-fill text-danger"></i>
                            <span>Recaudos y Documentos Consignados</span>
                          </h6>
                          <span className={`badge ${docsDetalle.length > 0 ? 'bg-success' : 'bg-secondary'} rounded-pill`}>
                            {docsDetalle.length} {docsDetalle.length === 1 ? 'Archivo' : 'Archivos'}
                          </span>
                        </div>

                        {docsDetalle.length === 0 ? (
                          <div className="p-3 text-center text-muted bg-white rounded border">
                            <i className="bi bi-file-earmark-x fs-3 d-block mb-1 text-secondary"></i>
                            <span className="small">No se han registrado documentos digitales adjuntos para esta solicitud.</span>
                          </div>
                        ) : (
                          <div className="row g-2">
                            {docsDetalle.map((doc, dIdx) => (
                              <div key={doc.id} className="col-12 col-md-6">
                                <div className="p-2.5 bg-white border rounded-3 d-flex align-items-center justify-content-between gap-2 shadow-xs hover-shadow transition-all">
                                  <div className="d-flex align-items-center gap-2 overflow-hidden">
                                    <div
                                      className="p-2 rounded-2 text-white d-flex align-items-center justify-content-center flex-shrink-0"
                                      style={{ backgroundColor: doc.color, width: '36px', height: '36px' }}
                                    >
                                      <i className={`bi ${doc.icono} fs-5`}></i>
                                    </div>
                                    <div className="text-truncate">
                                      <strong className="d-block text-dark text-truncate small" title={doc.titulo}>
                                        {doc.titulo}
                                      </strong>
                                      {doc.subtitulo && (
                                        <small className="text-muted extra-small d-block">{doc.subtitulo}</small>
                                      )}
                                    </div>
                                  </div>
                                  <div className="d-flex gap-1 flex-shrink-0">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-primary rounded-pill px-2.5 py-1 fw-bold d-flex align-items-center gap-1"
                                      style={{ fontSize: '11px' }}
                                      onClick={() => abrirVisorDocumentos(solicitudSeleccionada, dIdx)}
                                      title="Visualizar documento en pantalla completa"
                                    >
                                      <i className="bi bi-eye-fill"></i> Ver
                                    </button>
                                    <a
                                      href={doc.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-1"
                                      style={{ fontSize: '11px' }}
                                      title="Abrir en pestaña nueva o descargar"
                                    >
                                      <i className="bi bi-box-arrow-up-right"></i>
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="card border-primary">
                  <div className="card-header bg-primary-subtle fw-bold text-primary">
                    <i className="bi bi-sliders me-2"></i>Gestión de Estatus y Aptitud
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-bold small">Aptitud:</label>
                        <select className="form-select form-select-sm" value={nuevaAptitud} onChange={e => setNuevaAptitud(e.target.value)}>
                          <option value="Apto">Apto</option>
                          <option value="No Apto">No Apto</option>
                          <option value="En Evaluación">En Evaluación</option>
                        </select>
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label fw-bold small">Estatus Oficial:</label>
                        <select className="form-select form-select-sm" value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)}>
                          <option value="Pendiente">Pendiente</option>
                          <option value="En Evaluación">En Evaluación</option>
                          <option value="Aprobado">Aprobado</option>
                          <option value="Formalizado">Formalizado</option>
                          <option value="Rechazado">Rechazado</option>
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-bold small">Observaciones:</label>
                        <textarea
                          className="form-control form-control-sm"
                          rows={2}
                          value={nuevasObservaciones}
                          onChange={e => setNuevasObservaciones(e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light py-2.5 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  {(() => {
                    const parsed = parsearObservaciones(solicitudSeleccionada.observaciones);
                    return (
                      <>
                        <button
                          type="button"
                          className={`btn ${parsed.whatsapp_notificado ? 'btn-success text-white shadow-xs' : 'btn-outline-success'} btn-sm fw-bold d-flex align-items-center gap-1.5`}
                          style={{ backgroundColor: parsed.whatsapp_notificado ? '#16a34a' : undefined }}
                          onClick={() => notificarRepresentanteWhatsApp(solicitudSeleccionada)}
                        >
                          <i className="bi bi-whatsapp"></i>
                          <span>{parsed.whatsapp_notificado ? 'Reenviar WhatsApp' : 'Notificar por WhatsApp'}</span>
                        </button>
                        {parsed.whatsapp_notificado ? (
                          <span className="badge extra-small rounded-pill py-1 px-2 fw-bold" style={{ backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC' }}>
                            <i className="bi bi-check-all me-1"></i> Enviado: {parsed.whatsapp_fecha} ({parsed.whatsapp_estado || 'Notificado'})
                          </span>
                        ) : (
                          <span className="badge extra-small rounded-pill py-1 px-2 fw-semibold" style={{ backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #CBD5E1' }}>
                            <i className="bi bi-clock me-1"></i> Sin Notificar
                          </span>
                        )}
                        {(solicitudSeleccionada.estado === 'Aprobado' || solicitudSeleccionada.estado === 'Formalizado') && (
                          <button
                            type="button"
                            className="btn btn-outline-info btn-sm fw-bold d-flex align-items-center gap-1 ms-1"
                            onClick={() => descargarCartaAceptacionAspirante(solicitudSeleccionada)}
                          >
                            <i className="bi bi-file-earmark-check-fill text-info"></i>
                            <span>Carta de Aceptación (PDF)</span>
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={cerrarModal}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm fw-bold px-3"
                    onClick={() => guardarEvaluacion(solicitudSeleccionada, false)}
                    disabled={guardandoEstado}
                  >
                    {guardandoEstado ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODALES DE DEPURACIÓN (DUPLICADOS, VACÍOS, REGULARES) ────────────────── */}
      {modalDuplicadosAbierto && createPortal(
        <div
          className="modal fade show d-flex align-items-center justify-content-center"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 99999,
            overflowY: 'auto',
            padding: '12px'
          }}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down my-auto mx-auto w-100" style={{ maxWidth: '1050px', maxHeight: '92vh' }}>
            <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
              <div className="modal-header py-3 bg-danger text-white d-flex align-items-center justify-content-between">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-0">
                  <i className="bi bi-copy fs-5"></i> Detector y Depurador de Duplicados ({gruposDuplicados.length} grupos detectados)
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setModalDuplicadosAbierto(false)}></button>
              </div>
              <div className="modal-body p-3 p-md-4">
                <div className="alert alert-warning border-0 shadow-xs rounded-3 p-2.5 mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2 small">
                    <i className="bi bi-info-circle-fill fs-5 text-warning"></i>
                    <span>Por seguridad, el sistema preselecciona automáticamente las copias más antiguas para su eliminación, conservando el registro más reciente.</span>
                  </div>
                  <div className="d-flex gap-1.5">
                    <button
                      type="button"
                      className="btn btn-xs btn-white bg-white border fw-bold rounded-pill px-2.5 py-1"
                      onClick={() => {
                        const todos = new Set<string | number>();
                        gruposDuplicados.forEach(g => g.slice(1).forEach(s => { if (s.id) todos.add(s.id); }));
                        setSeleccionadosParaEliminar(todos);
                      }}
                    >
                      Sugeridos (Antiguos)
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-white bg-white border fw-bold rounded-pill px-2.5 py-1"
                      onClick={() => setSeleccionadosParaEliminar(new Set())}
                    >
                      Desmarcar Todo
                    </button>
                  </div>
                </div>

                <div className="d-flex flex-column gap-3">
                  {gruposDuplicados.map((g, gi) => (
                    <div key={gi} className="card border rounded-3 overflow-hidden shadow-xs">
                      <div className="card-header py-2 px-3 bg-light border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <span className="fw-bold text-dark small">
                          <i className="bi bi-person-fill text-danger me-1"></i>
                          Grupo {gi + 1}: {nombreCompleto(g[0].estudiante_nombres, g[0].estudiante_apellidos)}
                          {g[0].estudiante_cedula && <span className="badge bg-secondary ms-2">C.I: {g[0].estudiante_cedula}</span>}
                        </span>
                        <span className="badge bg-danger bg-opacity-10 text-danger border border-danger rounded-pill px-2 py-0.5 extra-small">
                          {g.length} solicitudes coincidentes
                        </span>
                      </div>
                      <div className="card-body p-2 p-md-3">
                        <div className="list-group list-group-flush gap-1">
                          {g.map((sol, solIdx) => {
                            const esMasReciente = solIdx === 0;
                            const isChecked = seleccionadosParaEliminar.has(sol.id);
                            return (
                              <label
                                key={sol.id}
                                className={`list-group-item list-group-item-action rounded-3 border d-flex align-items-center justify-content-between p-2.5 cursor-pointer ${
                                  isChecked ? 'bg-danger bg-opacity-10 border-danger' : (esMasReciente ? 'bg-success bg-opacity-10 border-success' : 'bg-white')
                                }`}
                              >
                                <div className="d-flex align-items-center gap-2.5 overflow-hidden">
                                  <input
                                    type="checkbox"
                                    className="form-check-input flex-shrink-0"
                                    checked={isChecked}
                                    onChange={() => toggleSeleccion(sol.id)}
                                  />
                                  <div className="overflow-hidden">
                                    <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                      <span className="font-monospace fw-bold small text-primary">{sol.codigo_unico}</span>
                                      <span className="badge bg-light text-dark border extra-small">{sol.grado_solicitado}</span>
                                      <span className={`badge ${sol.codigo_escuela === 'sb' ? 'bg-primary' : 'bg-success'} text-white extra-small`}>
                                        {sol.codigo_escuela?.toUpperCase()}
                                      </span>
                                      <span className="badge bg-secondary extra-small">{sol.estado}</span>
                                      {esMasReciente && (
                                        <span className="badge bg-success text-white extra-small">
                                          <i className="bi bi-star-fill me-1"></i>Más Reciente (Conservar)
                                        </span>
                                      )}
                                    </div>
                                    <small className="text-muted extra-small d-block text-truncate mt-0.5">
                                      Rep: <b>{nombreCompleto(sol.representante_nombres, sol.representante_apellidos)}</b> (C.I. {sol.representante_cedula || 'S/N'}) | Tel: {sol.representante_telefono || 'N/A'} | Fecha: {sol.created_at ? new Date(sol.created_at).toLocaleString('es-VE') : 'Sin fecha'}
                                    </small>
                                  </div>
                                </div>

                                <span className={`badge rounded-pill px-2 py-1 extra-small ms-2 flex-shrink-0 ${isChecked ? 'bg-danger text-white' : 'bg-light text-muted border'}`}>
                                  {isChecked ? 'Para Eliminar' : 'Conservar'}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer bg-light py-2.5 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <span className="small text-muted fw-bold">
                  {seleccionadosParaEliminar.size} solicitud(es) seleccionada(s) para eliminación definitiva.
                </span>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-secondary btn-sm rounded-pill px-3" onClick={() => setModalDuplicadosAbierto(false)}>Cerrar</button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm rounded-pill px-4 fw-bold shadow-xs"
                    onClick={eliminarSeleccionados}
                    disabled={eliminandoDuplicados || seleccionadosParaEliminar.size === 0}
                  >
                    {eliminandoDuplicados ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-trash-fill me-1"></i>}
                    Eliminar Seleccionados ({seleccionadosParaEliminar.size})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {modalVaciosAbierto && createPortal(
        <div
          className="modal fade show d-flex align-items-center justify-content-center"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 99999,
            overflowY: 'auto',
            padding: '12px'
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down my-auto mx-auto w-100" style={{ maxWidth: '900px', maxHeight: '92vh' }}>
            <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
              <div className="modal-header py-3 bg-danger text-white d-flex align-items-center justify-content-between">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-0">
                  <i className="bi bi-person-x fs-5"></i> Solicitudes con Datos Vacíos ({registrosVacios.length})
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setModalVaciosAbierto(false)}></button>
              </div>
              <div className="modal-body p-3 p-md-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <p className="small text-muted mb-0">Se encontraron {registrosVacios.length} registros sin datos válidos de {tipoVacios}.</p>
                  <div className="d-flex gap-1.5">
                    <button
                      type="button"
                      className="btn btn-xs btn-outline-secondary rounded-pill px-2 py-0.5"
                      onClick={() => {
                        const todos = new Set<string | number>();
                        registrosVacios.forEach(s => { if (s.id) todos.add(s.id); });
                        setSeleccionadosVacios(todos);
                      }}
                    >
                      Seleccionar Todo
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline-secondary rounded-pill px-2 py-0.5"
                      onClick={() => setSeleccionadosVacios(new Set())}
                    >
                      Desmarcar
                    </button>
                  </div>
                </div>

                <div className="list-group gap-1.5">
                  {registrosVacios.map(sol => (
                    <label key={sol.id} className="list-group-item list-group-item-action rounded-3 border d-flex align-items-center gap-2.5 small p-2.5">
                      <input
                        type="checkbox"
                        className="form-check-input me-1"
                        checked={seleccionadosVacios.has(sol.id)}
                        onChange={() => toggleSeleccionVacio(sol.id)}
                      />
                      <div className="overflow-hidden flex-grow-1">
                        <div className="d-flex align-items-center gap-1.5">
                          <span className="font-monospace fw-bold text-primary">{sol.codigo_unico}</span>
                          <span className="badge bg-light text-dark border extra-small">{sol.codigo_escuela?.toUpperCase()}</span>
                          <span className="badge bg-secondary extra-small">{sol.grado_solicitado || 'Sin grado'}</span>
                        </div>
                        <small className="text-muted extra-small d-block mt-0.5">
                          Aspirante: {nombreCompleto(sol.estudiante_nombres, sol.estudiante_apellidos)} | Rep: {nombreCompleto(sol.representante_nombres, sol.representante_apellidos)} ({sol.created_at ? new Date(sol.created_at).toLocaleDateString('es-VE') : 'Sin fecha'})
                        </small>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-footer bg-light py-2.5 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <span className="small text-muted fw-bold">
                  {seleccionadosVacios.size} registro(s) seleccionados.
                </span>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-secondary btn-sm rounded-pill px-3" onClick={() => setModalVaciosAbierto(false)}>Cerrar</button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm rounded-pill px-4 fw-bold shadow-xs"
                    onClick={eliminarVaciosSeleccionados}
                    disabled={eliminandoVacios || seleccionadosVacios.size === 0}
                  >
                    {eliminandoVacios ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-trash-fill me-1"></i>}
                    Eliminar ({seleccionadosVacios.size})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {modalRegularesAbierto && createPortal(
        <div
          className="modal fade show d-flex align-items-center justify-content-center"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 99999,
            overflowY: 'auto',
            padding: '12px'
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down my-auto mx-auto w-100" style={{ maxWidth: '950px', maxHeight: '92vh' }}>
            <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
              <div className="modal-header py-3 bg-info text-dark d-flex align-items-center justify-content-between">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2 mb-0">
                  <i className="bi bi-shield-check fs-5"></i> Solicitudes de Estudiantes ya Matriculados / Regulares ({registrosRegulares.length})
                </h5>
                <button type="button" className="btn-close" onClick={() => setModalRegularesAbierto(false)}></button>
              </div>
              <div className="modal-body p-3 p-md-4" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <div className="alert alert-info border-0 shadow-xs rounded-3 p-2.5 mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <span className="small">Estos estudiantes ya cuentan con matrícula activa en el sistema. Puedes depurar sus solicitudes para no duplicar cupos ni alterar estadísticas de nuevo ingreso.</span>
                  <div className="d-flex gap-1.5">
                    <button
                      type="button"
                      className="btn btn-xs btn-white bg-white border fw-bold rounded-pill px-2.5 py-1"
                      onClick={() => {
                        const todos = new Set<string | number>();
                        registrosRegulares.forEach(s => { if (s.id) todos.add(s.id); });
                        setSeleccionadosRegulares(todos);
                      }}
                    >
                      Seleccionar Todo
                    </button>
                    <button
                      type="button"
                      className="btn btn-xs btn-white bg-white border fw-bold rounded-pill px-2.5 py-1"
                      onClick={() => setSeleccionadosRegulares(new Set())}
                    >
                      Desmarcar
                    </button>
                  </div>
                </div>

                <div className="list-group gap-1.5">
                  {registrosRegulares.map(sol => (
                    <label key={sol.id} className="list-group-item list-group-item-action rounded-3 border d-flex align-items-center justify-content-between p-2.5 cursor-pointer">
                      <div className="d-flex align-items-center gap-2.5 overflow-hidden">
                        <input
                          type="checkbox"
                          className="form-check-input flex-shrink-0 me-1"
                          checked={seleccionadosRegulares.has(sol.id)}
                          onChange={() => toggleSeleccionRegular(sol.id)}
                        />
                        <div className="overflow-hidden">
                          <div className="d-flex align-items-center gap-1.5 flex-wrap">
                            <span className="fw-bold text-dark">{nombreCompleto(sol.estudiante_nombres, sol.estudiante_apellidos)}</span>
                            {sol.estudiante_cedula && <span className="badge bg-secondary extra-small">C.I: {sol.estudiante_cedula}</span>}
                            <span className={`badge ${sol.codigo_escuela === 'sb' ? 'bg-primary' : 'bg-success'} text-white extra-small`}>
                              {sol.codigo_escuela?.toUpperCase()}
                            </span>
                            <span className="badge bg-light text-dark border extra-small">{sol.grado_solicitado}</span>
                          </div>
                          <small className="text-muted extra-small d-block mt-0.5">
                            Código: <span className="font-monospace text-primary fw-bold">{sol.codigo_unico}</span> | Rep: {nombreCompleto(sol.representante_nombres, sol.representante_apellidos)} | Estado Actual: {sol.estado}
                          </small>
                        </div>
                      </div>

                      <span className="badge bg-info text-dark rounded-pill px-2 py-1 extra-small ms-2 flex-shrink-0">
                        Regular en BD
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-footer bg-light py-2.5 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <span className="small text-muted fw-bold">
                  {seleccionadosRegulares.size} solicitud(es) seleccionada(s) para depuración.
                </span>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-secondary btn-sm rounded-pill px-3" onClick={() => setModalRegularesAbierto(false)}>Cerrar</button>
                  <button
                    type="button"
                    className="btn btn-info text-dark btn-sm rounded-pill px-4 fw-bold shadow-xs"
                    onClick={eliminarRegularesSeleccionados}
                    disabled={eliminandoRegulares || seleccionadosRegulares.size === 0}
                  >
                    {eliminandoRegulares ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-trash-fill me-1"></i>}
                    Depurar Solicitudes ({seleccionadosRegulares.size})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL VISOR INTERACTIVO DE DOCUMENTOS Y RECAUDOS ─────────────────── */}
      {modalVisorDocsAbierto && solicitudVisorDocs && (() => {
        const docs = obtenerDocumentosSolicitud(solicitudVisorDocs);
        const docActual = docs[docVisorActivoIndex] || docs[0];
        const esPdf = docActual?.url?.toLowerCase().includes('.pdf');

        return createPortal(
          <div
            className="modal fade show d-flex align-items-center justify-content-center"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              zIndex: 99999,
              backdropFilter: 'blur(8px)',
              overflowY: 'auto',
              padding: '12px'
            }}
          >
            <div className="modal-dialog modal-xl modal-dialog-centered w-100 my-auto mx-auto" style={{ maxWidth: '95vw', height: '94vh' }}>
              <div className="modal-content border-0 shadow-2xl rounded-4 h-100 d-flex flex-column overflow-hidden bg-dark text-white">
                {/* Header Visor */}
                <div className="modal-header py-2.5 px-4 bg-black bg-opacity-60 border-bottom border-secondary d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2.5 overflow-hidden">
                    <span className="p-2 rounded-circle text-white shadow-sm flex-shrink-0" style={{ backgroundColor: docActual?.color || '#2563eb' }}>
                      <i className={`bi ${docActual?.icono || 'bi-file-earmark'} fs-5`}></i>
                    </span>
                    <div className="overflow-hidden">
                      <h5 className="modal-title fw-bold text-white mb-0 text-truncate" style={{ fontSize: '16px' }}>
                        {docActual?.titulo || 'Documento Adjunto'}
                      </h5>
                      <small className="text-secondary extra-small d-block text-truncate">
                        Aspirante: <span className="text-info fw-bold">{nombreCompleto(solicitudVisorDocs.estudiante_nombres, solicitudVisorDocs.estudiante_apellidos)}</span> | C.I: {solicitudVisorDocs.estudiante_cedula || 'En trámite'} | Código: <span className="font-monospace text-warning">{solicitudVisorDocs.codigo_unico}</span>
                      </small>
                    </div>
                  </div>

                  {/* Controles de Vista y Acciones */}
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-secondary px-3 py-1.5 rounded-pill fw-bold" style={{ fontSize: '12px' }}>
                      Doc {docVisorActivoIndex + 1} de {docs.length}
                    </span>

                    {!esPdf && (
                      <div className="btn-group btn-group-sm bg-secondary bg-opacity-25 rounded-pill p-1">
                        <button
                          type="button"
                          className="btn btn-dark btn-sm rounded-pill text-white"
                          onClick={() => setZoomNivel(z => Math.max(0.5, z - 0.25))}
                          title="Reducir Zoom"
                        >
                          <i className="bi bi-zoom-out"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-dark btn-sm text-white px-2"
                          onClick={() => setZoomNivel(1)}
                          title="Restablecer Zoom"
                        >
                          {Math.round(zoomNivel * 100)}%
                        </button>
                        <button
                          type="button"
                          className="btn btn-dark btn-sm rounded-pill text-white"
                          onClick={() => setZoomNivel(z => Math.min(3, z + 0.25))}
                          title="Aumentar Zoom"
                        >
                          <i className="bi bi-zoom-in"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-dark btn-sm rounded-pill text-white ms-1"
                          onClick={() => setRotacionNivel(r => (r + 90) % 360)}
                          title="Girar 90 grados"
                        >
                          <i className="bi bi-arrow-clockwise"></i>
                        </button>
                      </div>
                    )}

                    <a
                      href={docActual?.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm btn-outline-light rounded-pill px-3 fw-bold d-flex align-items-center gap-1"
                    >
                      <i className="bi bi-box-arrow-up-right"></i> Abrir / Descargar
                    </a>

                    <button
                      type="button"
                      className="btn btn-sm btn-close btn-close-white ms-2"
                      onClick={cerrarVisorDocumentos}
                      aria-label="Cerrar visor"
                    ></button>
                  </div>
                </div>

                {/* Body del Visor con soporte de imagen y PDF */}
                <div
                  className="modal-body p-0 flex-grow-1 position-relative d-flex align-items-center justify-content-center overflow-auto"
                  style={{ backgroundColor: '#0B0F19' }}
                >
                  {/* Botón Navegar Anterior */}
                  {docs.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-dark btn-lg position-absolute top-50 start-0 translate-middle-y ms-3 rounded-circle shadow-lg text-white border border-secondary"
                      style={{ width: '48px', height: '48px', zIndex: 10, opacity: docVisorActivoIndex === 0 ? 0.4 : 0.9 }}
                      disabled={docVisorActivoIndex === 0}
                      onClick={() => {
                        setDocVisorActivoIndex(i => Math.max(0, i - 1));
                        setZoomNivel(1);
                        setRotacionNivel(0);
                      }}
                      title="Documento Anterior"
                    >
                      <i className="bi bi-chevron-left fs-5"></i>
                    </button>
                  )}

                  {/* Renderizado de Documento */}
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center p-3 text-center">
                    {esPdf ? (
                      <iframe
                        src={docActual?.url}
                        title={docActual?.titulo}
                        className="w-100 h-100 rounded-3 border-0"
                        style={{ minHeight: '65vh' }}
                      />
                    ) : (
                      <div
                        className="d-inline-block transition-all"
                        style={{
                          transform: `scale(${zoomNivel}) rotate(${rotacionNivel}deg)`,
                          transformOrigin: 'center center',
                          maxWidth: '100%',
                          maxHeight: '100%'
                        }}
                      >
                        <img
                          src={docActual?.url}
                          alt={docActual?.titulo}
                          className="img-fluid rounded-3 shadow-lg"
                          style={{ maxHeight: '72vh', objectFit: 'contain' }}
                          onError={(e) => {
                            (e.target as any).src = 'https://placehold.co/800x600/1e293b/ffffff?text=Documento+No+Disponible';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Botón Navegar Siguiente */}
                  {docs.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-dark btn-lg position-absolute top-50 end-0 translate-middle-y me-3 rounded-circle shadow-lg text-white border border-secondary"
                      style={{ width: '48px', height: '48px', zIndex: 10, opacity: docVisorActivoIndex >= docs.length - 1 ? 0.4 : 0.9 }}
                      disabled={docVisorActivoIndex >= docs.length - 1}
                      onClick={() => {
                        setDocVisorActivoIndex(i => Math.min(docs.length - 1, i + 1));
                        setZoomNivel(1);
                        setRotacionNivel(0);
                      }}
                      title="Documento Siguiente"
                    >
                      <i className="bi bi-chevron-right fs-5"></i>
                    </button>
                  )}
                </div>

                {/* Footer del Visor: Tira de miniaturas de todos los documentos */}
                <div className="modal-footer py-2 px-4 bg-black bg-opacity-75 border-top border-secondary d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2 overflow-auto py-1" style={{ maxWidth: '75vw' }}>
                    {docs.map((doc, idx) => {
                      const esSeleccionado = idx === docVisorActivoIndex;
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          className={`btn btn-sm d-flex align-items-center gap-1.5 rounded-pill px-3 py-1.5 text-nowrap transition-all ${
                            esSeleccionado ? 'btn-primary shadow-sm fw-bold border-2 border-white' : 'btn-outline-secondary text-white'
                          }`}
                          onClick={() => {
                            setDocVisorActivoIndex(idx);
                            setZoomNivel(1);
                            setRotacionNivel(0);
                          }}
                        >
                          <i className={`bi ${doc.icono}`}></i>
                          <span style={{ fontSize: '11.5px' }}>{doc.titulo}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm rounded-pill px-4"
                    onClick={cerrarVisorDocumentos}
                  >
                    Cerrar Visor
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* ── MODAL MATRIZ COMPLETA DE CAPACIDAD Y VACANTES POR GRADO (PORTAL) ─── */}
      {modalMatrizCapacidadAbierto && createPortal(
        <div
          className="modal fade show d-flex align-items-center justify-content-center"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 99999,
            overflowY: 'auto',
            padding: '12px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalMatrizCapacidadAbierto(false);
          }}
        >
          <div
            className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down w-100 my-auto"
            style={{ maxWidth: '1100px', maxHeight: '92vh' }}
          >
            <div className="modal-content shadow-2xl border-0 rounded-4 overflow-hidden h-100 d-flex flex-column bg-white">
              {/* Modal Header */}
              <div className="modal-header bg-primary text-white py-3 px-3 px-md-4 d-flex align-items-center justify-content-between flex-shrink-0">
                <div className="d-flex align-items-center gap-2.5">
                  <div className="p-2 bg-white bg-opacity-20 rounded-3 text-white">
                    <i className="bi bi-grid-3x3 fs-5"></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0 text-white fs-6 fs-md-5">
                      Matriz de Capacidad, Ambientes y Vacantes
                    </h5>
                    <p className="text-white-50 extra-small mb-0 d-none d-sm-block">
                      Disponibilidad en tiempo real por cada grado y plantel escolar
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setModalMatrizCapacidadAbierto(false)}
                  aria-label="Cerrar"
                ></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-2.5 p-md-4 overflow-auto flex-grow-1">
                {/* Selector rápido de plantel dentro del modal */}
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 bg-light p-2.5 rounded-3 border">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="extra-small fw-bold text-secondary">
                      <i className="bi bi-building me-1"></i>Plantel:
                    </span>
                    <div className="btn-group btn-group-sm" role="group">
                      {!esSedeFija && (
                        <button
                          type="button"
                          className={`btn btn-sm ${filtroEscuela === 'todas' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
                          onClick={() => setFiltroEscuela('todas')}
                        >
                          Ambas Escuelas
                        </button>
                      )}
                      {(!esSedeFija || escuelaUsuarioAsignada === 'sb') && (
                        <button
                          type="button"
                          className={`btn btn-sm ${filtroEscuela === 'sb' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
                          onClick={() => setFiltroEscuela('sb')}
                        >
                          Santa Bárbara
                        </button>
                      )}
                      {(!esSedeFija || escuelaUsuarioAsignada === 'lb') && (
                        <button
                          type="button"
                          className={`btn btn-sm ${filtroEscuela === 'lb' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
                          onClick={() => setFiltroEscuela('lb')}
                        >
                          Libertador Bolívar
                        </button>
                      )}
                    </div>
                  </div>

                  <span className="badge bg-white text-secondary border extra-small">
                    <b>{resumenCapacidadTodosGrados.length} Grados</b> evaluados
                  </span>
                </div>

                {/* VISTA ESCRITORIO: TABLA (≥ md) */}
                <div className="table-responsive d-none d-md-block">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                    <thead className="table-light">
                      <tr>
                        <th>Grado / Nivel</th>
                        <th className="text-center">Ambientes</th>
                        <th className="text-center">Capacidad</th>
                        <th className="text-center" style={{ color: '#2563eb' }}>Regulares</th>
                        <th className="text-center text-success">Aprobados</th>
                        <th className="text-center" style={{ color: '#0D9488' }}>Formalizados</th>
                        <th className="text-center">Vacantes Libres</th>
                        <th className="text-center">En Espera</th>
                        <th className="text-end">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumenCapacidadTodosGrados.map(item => {
                        const tieneCupos = item.cuposDisponibles > 0;
                        return (
                          <tr key={item.grado} className={item.cuposDisponibles === 0 ? 'table-light' : ''}>
                            <td className="fw-bold text-dark">
                              <i className="bi bi-mortarboard me-1.5 text-primary"></i>
                              {item.grado}
                            </td>
                            <td className="text-center">
                              <span className="badge bg-light text-dark border">
                                {item.totalSalones} {item.totalSalones === 1 ? 'salón' : 'salones'}
                              </span>
                            </td>
                            <td className="text-center fw-semibold text-secondary">
                              {item.capacidadTotal} puestos
                            </td>
                            <td className="text-center">
                              <span className="fw-bold" style={{ color: '#2563eb' }}>{item.estudiantesRegulares ?? item.estudiantesMatriculados}</span>
                            </td>
                            <td className="text-center">
                              <span className="fw-bold text-success">{item.aprobados ?? 0}</span>
                            </td>
                            <td className="text-center">
                              <span className="fw-bold" style={{ color: '#0D9488' }}>{item.formalizados ?? 0}</span>
                            </td>
                            <td className="text-center">
                              <span
                                className={`badge rounded-pill px-2.5 py-1 fw-bold ${
                                  tieneCupos ? 'bg-success text-white' : 'bg-danger text-white'
                                }`}
                                style={{ fontSize: '11px' }}
                              >
                                {tieneCupos ? `${item.cuposDisponibles} vacantes` : 'Agotado (0)'}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-light text-muted border">
                                {item.solicitudesPendientes}
                              </span>
                            </td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-outline-primary btn-sm py-0.5 px-2 extra-small fw-bold"
                                onClick={() => {
                                  setFiltroGrado(item.grado);
                                  setModalMatrizCapacidadAbierto(false);
                                }}
                              >
                                <i className="bi bi-funnel me-1"></i>Filtrar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* VISTA MÓVIL: TARJETAS COMPACTAS (< md) */}
                <div className="d-block d-md-none">
                  <div className="d-flex flex-column gap-2">
                    {resumenCapacidadTodosGrados.map(item => {
                      const tieneCupos = item.cuposDisponibles > 0;
                      return (
                        <div
                          key={item.grado}
                          className={`p-2.5 rounded-3 border bg-white shadow-xs ${
                            tieneCupos ? 'border-success-subtle' : 'border-danger-subtle'
                          }`}
                        >
                          <div className="d-flex align-items-center justify-content-between mb-1.5">
                            <strong className="text-dark fs-6 d-flex align-items-center gap-1.5">
                              <span className={`rounded-circle d-inline-block ${tieneCupos ? 'bg-success' : 'bg-danger'}`} style={{ width: '8px', height: '8px' }}></span>
                              {item.grado}
                            </strong>
                            <span
                              className={`badge rounded-pill px-2 py-0.5 fw-bold ${
                                tieneCupos ? 'bg-success text-white' : 'bg-danger text-white'
                              }`}
                              style={{ fontSize: '10.5px' }}
                            >
                              {tieneCupos ? `${item.cuposDisponibles} vacantes` : 'Sin cupo (0)'}
                            </span>
                          </div>

                          <div className="row g-1 extra-small text-muted mb-2 bg-light p-2 rounded-2">
                            <div className="col-6">
                              Ambientes: <strong className="text-dark">{item.totalSalones} salones</strong>
                            </div>
                            <div className="col-6">
                              Capacidad: <strong className="text-dark">{item.capacidadTotal} puestos</strong>
                            </div>
                            <div className="col-4">
                              Regulares: <strong style={{ color: '#2563eb' }}>{item.estudiantesRegulares ?? item.estudiantesMatriculados}</strong>
                            </div>
                            <div className="col-4">
                              Aprobados: <strong className="text-success">{item.aprobados ?? 0}</strong>
                            </div>
                            <div className="col-4">
                              Formalizados: <strong style={{ color: '#0D9488' }}>{item.formalizados ?? 0}</strong>
                            </div>
                          </div>

                          <div className="d-flex align-items-center justify-content-between pt-1">
                            <span className="extra-small text-muted">
                              <i className="bi bi-clock me-1"></i><b>{item.solicitudesPendientes}</b> en espera
                            </span>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm py-0.5 px-3 extra-small fw-bold shadow-xs"
                              onClick={() => {
                                setFiltroGrado(item.grado);
                                setModalMatrizCapacidadAbierto(false);
                              }}
                            >
                              <i className="bi bi-funnel me-1"></i> Filtrar este Grado
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer py-2 px-3 px-md-4 bg-light d-flex align-items-center justify-content-between flex-shrink-0">
                <span className="text-muted extra-small d-none d-sm-inline">
                  Vacantes Libres = Capacidad - (Estudiantes Regulares + Nuevos Ingresos Otorgados)
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm px-4 fw-bold ms-auto"
                  onClick={() => setModalMatrizCapacidadAbierto(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL INTERACTIVO DE ESTADÍSTICAS Y GRÁFICOS CHAMILO LMS ──────────── */}
      {modalEstadisticas && (() => {
        const stats = calcularEstadisticasAdmisiones(escuelaReporte);
        const nombreInstitucion = escuelaReporte === 'todas'
          ? 'Todas las Escuelas (DEP Oriente)'
          : (escuelaReporte === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar');

        let dataset: any[] = [];
        let tituloVista = 'Por Grados / Años Solicitados';
        if (criterioAgrupacion === 'niveles') {
          dataset = stats.desgloseEtapas || [];
          tituloVista = 'Por Niveles y Etapas Educativas';
        } else if (criterioAgrupacion === 'estados') {
          dataset = stats.desgloseEstados || [];
          tituloVista = 'Por Estatus de Admisión';
        } else if (criterioAgrupacion === 'nomina') {
          dataset = stats.desgloseNomina || [];
          tituloVista = 'Por Tipo de Nómina / Comunidad';
        } else {
          dataset = stats.desglosePorGrado || [];
          tituloVista = 'Por Grados / Años Solicitados';
        }

        return createPortal(
          <div 
            className="modal fade show d-block" 
            tabIndex={-1} 
            style={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.78)', 
              backdropFilter: 'blur(5px)', 
              zIndex: 1060,
              padding: '0.25rem'
            }}
          >
            <div className="modal-dialog modal-fullscreen-sm-down modal-xl modal-dialog-centered modal-dialog-scrollable my-sm-3">
              <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden" style={{ borderTop: '5px solid #8B5CF6' }}>
                
                {/* CABECERA DEL MODAL */}
                <div className="modal-header bg-white px-3 px-md-4 py-3 border-bottom d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2.5">
                    <div className="p-2 rounded-circle flex-shrink-0" style={{ backgroundColor: '#EDE9FE', color: '#7C3AED' }}>
                      <i className="bi bi-bar-chart-line-fill fs-5"></i>
                    </div>
                    <div>
                      <h5 className="modal-title fw-bolder mb-0 d-flex align-items-center gap-2 flex-wrap" style={{ color: '#0F172A', fontSize: '1.05rem' }}>
                        <span>Reporte Estadístico de Admisiones</span>
                        <span className="badge rounded-pill fw-bold" style={{ backgroundColor: '#EDE9FE', color: '#6D28D9', fontSize: '0.7rem' }}>
                          Chamilo LMS
                        </span>
                      </h5>
                      <small className="fw-semibold d-block mt-0.5" style={{ fontSize: '0.72rem', color: '#475569' }}>
                        Consolidado oficial • <span className="fw-bold" style={{ color: '#1E1B4B' }}>{stats.fechaHoraReporte}</span>
                      </small>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setModalEstadisticas(false)}
                    aria-label="Cerrar"
                  ></button>
                </div>

                {/* CUERPO DEL MODAL (RESPONSIVE TOUCH SCROLL) */}
                <div className="modal-body p-2 p-sm-3 p-md-4 bg-light">
                  <div className="d-flex flex-column gap-2.5">
                    
                    {/* BARRA DE HERRAMIENTAS Y SELECTORES MÓVIL-FRIENDLY */}
                    <div className="card border-0 shadow-sm rounded-4 p-2.5 p-sm-3 bg-white">
                      <div className="d-flex flex-column gap-2.5">
                        
                        {/* Fila 1: Ámbito Escolar y Desglose */}
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                          {/* Selector de Ámbito Escolar */}
                          <div className="d-flex align-items-center gap-1.5 overflow-x-auto text-nowrap pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                            <span className="fw-bold text-uppercase me-1 d-none d-sm-inline" style={{ fontSize: '0.7rem', color: '#475569' }}>
                              <i className="bi bi-building me-1 text-primary"></i>Ámbito:
                            </span>
                            <div className="btn-group btn-group-sm bg-light p-0.5 rounded-pill border" role="group">
                              {[
                                { id: 'todas', label: 'Ambas Escuelas' },
                                { id: 'sb', label: 'Santa Bárbara' },
                                { id: 'lb', label: 'Libertador Bolívar' },
                              ].map((esc) => (
                                <button
                                  key={esc.id}
                                  type="button"
                                  className={`btn btn-sm px-2.5 px-sm-3 py-1 rounded-pill fw-bold border-0 transition-all ${
                                    escuelaReporte === esc.id 
                                      ? 'text-white shadow-xs' 
                                      : 'text-secondary hover-efecto'
                                  }`}
                                  onClick={() => setEscuelaReporte(esc.id as any)}
                                  style={{ 
                                    fontSize: '0.75rem',
                                    backgroundColor: escuelaReporte === esc.id ? '#8B5CF6' : 'transparent' 
                                  }}
                                >
                                  {esc.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Selector de Desglose / Agrupación */}
                          {tipoGrafico !== 'resumen_niveles' && (
                            <div className="d-flex align-items-center gap-1 overflow-x-auto text-nowrap pb-1 ms-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                              <span className="fw-bold text-muted me-1 d-none d-md-inline" style={{ fontSize: '0.72rem' }}>
                                <i className="bi bi-funnel-fill text-primary me-1"></i>Desglose:
                              </span>
                              <div className="btn-group btn-group-sm bg-light p-0.5 rounded-pill border" role="group">
                                {[
                                  { id: 'grados', label: 'Grados' },
                                  { id: 'niveles', label: 'Niveles' },
                                  { id: 'estados', label: 'Estatus' },
                                  { id: 'nomina', label: 'Nómina' },
                                ].map((g) => (
                                  <button
                                    key={g.id}
                                    type="button"
                                    className={`btn btn-sm py-1 px-2 px-sm-2.5 fw-bold rounded-pill border-0 transition-all ${
                                      criterioAgrupacion === g.id 
                                        ? 'text-white shadow-xs' 
                                        : 'text-secondary hover-efecto'
                                    }`}
                                    onClick={() => setCriterioAgrupacion(g.id as any)}
                                    style={{ 
                                      fontSize: '0.72rem', 
                                      backgroundColor: criterioAgrupacion === g.id ? '#7C3AED' : 'transparent' 
                                    }}
                                  >
                                    {g.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Fila 2: Carrusel Horizontal de Tipos de Gráficas (Chamilo LMS) */}
                        <div className="d-flex align-items-center gap-1.5 overflow-x-auto text-nowrap pb-1 pt-1 border-top" style={{ WebkitOverflowScrolling: 'touch' }}>
                          {[
                            { id: 'resumen_niveles', label: 'Por Niveles', icon: 'bi-diagram-3-fill' },
                            { id: 'dossier', label: 'Dossier 360°', icon: 'bi-grid-1x2-fill' },
                            { id: 'torta', label: 'Torta 3D', icon: 'bi-pie-chart-fill' },
                            { id: 'anillos', label: 'Anillos', icon: 'bi-record-circle' },
                            { id: 'picos', label: 'Picos', icon: 'bi-graph-up' },
                            { id: 'barras', label: 'Barras', icon: 'bi-bar-chart-steps' },
                            { id: 'radar', label: 'Radar', icon: 'bi-bullseye' },
                            { id: 'tacometro', label: 'Tacómetro', icon: 'bi-speedometer2' },
                            { id: 'tabla', label: 'Tabla', icon: 'bi-table' },
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              className={`btn btn-sm px-2.5 py-1 rounded-pill fw-bold flex-shrink-0 transition-all ${
                                tipoGrafico === t.id 
                                  ? 'text-white shadow-xs' 
                                  : 'bg-light text-secondary border-0 hover-efecto'
                              }`}
                              onClick={() => setTipoGrafico(t.id as any)}
                              style={{ 
                                fontSize: '0.75rem', 
                                backgroundColor: tipoGrafico === t.id ? '#8B5CF6' : undefined 
                              }}
                            >
                              <i className={`bi ${t.icon} me-1`}></i>
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* FRANJA DE METRICAS KPIS AL ESTILO CHAMILO */}
                      {tipoGrafico !== 'resumen_niveles' && (
                        <div className="row g-2 g-sm-3 mt-1">
                          {/* 1. TOTAL SOLICITUDES */}
                          <div className="col-6 col-md-3">
                            <div className="bg-white p-2.5 p-sm-3 rounded-4 shadow-sm border d-flex align-items-center justify-content-between h-100" style={{ borderLeft: '4px solid #8B5CF6' }}>
                              <div>
                                <span className="text-uppercase fw-bolder d-block mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px', color: '#475569' }}>
                                  Total Solicitudes
                                </span>
                                <div className="d-flex align-items-baseline gap-1.5">
                                  <span className="fs-3 fw-bolder lh-1" style={{ color: '#1E1B4B' }}>{stats.totalGeneral}</span>
                                  <span className="badge rounded-pill fw-bold px-2 py-0.5" style={{ backgroundColor: '#EDE9FE', color: '#5B21B6', fontSize: '0.7rem' }}>
                                    100%
                                  </span>
                                </div>
                              </div>
                              <div className="p-2 rounded-circle d-none d-sm-block" style={{ backgroundColor: '#F3E8FF', color: '#7C3AED' }}>
                                <i className="bi bi-people-fill fs-5"></i>
                              </div>
                            </div>
                          </div>

                          {/* 2. APROBADAS / FORMALIZADAS */}
                          <div className="col-6 col-md-3">
                            <div className="bg-white p-2.5 p-sm-3 rounded-4 shadow-sm border d-flex align-items-center justify-content-between h-100" style={{ borderLeft: '4px solid #059669' }}>
                              <div>
                                <span className="text-uppercase fw-bolder d-block mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px', color: '#065F46' }}>
                                  Aprobadas / Listas
                                </span>
                                <div className="d-flex align-items-baseline gap-1.5">
                                  <span className="fs-3 fw-bolder lh-1" style={{ color: '#065F46' }}>{stats.completadosGeneral}</span>
                                  <span className="badge rounded-pill fw-bold px-2 py-0.5" style={{ backgroundColor: '#059669', color: '#FFFFFF', fontSize: '0.7rem' }}>
                                    {stats.pctGeneral}%
                                  </span>
                                </div>
                              </div>
                              <div className="p-2 rounded-circle d-none d-sm-block" style={{ backgroundColor: '#D1FAE5', color: '#059669' }}>
                                <i className="bi bi-check-circle-fill fs-5"></i>
                              </div>
                            </div>
                          </div>

                          {/* 3. EN EVALUACIÓN */}
                          <div className="col-6 col-md-3">
                            <div className="bg-white p-2.5 p-sm-3 rounded-4 shadow-sm border d-flex align-items-center justify-content-between h-100" style={{ borderLeft: '4px solid #D97706' }}>
                              <div>
                                <span className="text-uppercase fw-bolder d-block mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px', color: '#78350F' }}>
                                  En Evaluación
                                </span>
                                <div className="d-flex align-items-baseline gap-1.5">
                                  <span className="fs-3 fw-bolder lh-1" style={{ color: '#78350F' }}>{stats.enProcesoGeneral}</span>
                                  <span className="badge rounded-pill fw-bold px-2 py-0.5" style={{ backgroundColor: '#D97706', color: '#FFFFFF', fontSize: '0.7rem' }}>
                                    {stats.pctEnTramite}%
                                  </span>
                                </div>
                              </div>
                              <div className="p-2 rounded-circle d-none d-sm-block" style={{ backgroundColor: '#FEF3C7', color: '#D97706' }}>
                                <i className="bi bi-hourglass-split fs-5"></i>
                              </div>
                            </div>
                          </div>

                          {/* 4. RECHAZADAS / BORRADOR */}
                          <div className="col-6 col-md-3">
                            <div className="bg-white p-2.5 p-sm-3 rounded-4 shadow-sm border d-flex align-items-center justify-content-between h-100" style={{ borderLeft: '4px solid #475569' }}>
                              <div>
                                <span className="text-uppercase fw-bolder d-block mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px', color: '#1E293B' }}>
                                  Rechazadas / Borrador
                                </span>
                                <div className="d-flex align-items-baseline gap-1.5">
                                  <span className="fs-3 fw-bolder lh-1" style={{ color: '#1E293B' }}>{stats.sinIniciarGeneral}</span>
                                  <span className="badge rounded-pill fw-bold px-2 py-0.5" style={{ backgroundColor: '#475569', color: '#FFFFFF', fontSize: '0.7rem' }}>
                                    {stats.pctNoConformes}%
                                  </span>
                                </div>
                              </div>
                              <div className="p-2 rounded-circle d-none d-sm-block" style={{ backgroundColor: '#F1F5F9', color: '#475569' }}>
                                <i className="bi bi-dash-circle fs-5"></i>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* ─── LIENZO CENTRAL DINÁMICO SEGÚN TIPO DE GRÁFICO ─── */}

                    {/* 0. REPORTE SINTÉTICO POR NIVELES (VISTA PRINCIPAL MÓVIL) */}
                    {tipoGrafico === 'resumen_niveles' && (
                      <div className="animate__animated animate__fadeIn">
                        <div className="row g-2.5 g-sm-3">
                          {/* BANNER INSTITUCIONAL CON TARJETAS EN BLANCO SÓLIDO (MÁXIMO CONTRASTE) */}
                          <div className="col-12">
                            <div 
                              className="card border-0 shadow-sm rounded-4 p-3 p-sm-3.5 text-white overflow-hidden position-relative" 
                              style={{ 
                                background: 'linear-gradient(135deg, #4C1D95 0%, #6D28D9 50%, #4338CA 100%)' 
                              }}
                            >
                              <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 position-relative" style={{ zIndex: 1 }}>
                                <div>
                                  <span className="badge rounded-pill px-3 py-1.5 mb-2 fw-bolder text-uppercase shadow-xs" style={{ backgroundColor: '#FFFFFF', color: '#5B21B6', fontSize: '0.72rem' }}>
                                    {nombreInstitucion}
                                  </span>
                                  <h4 className="fw-bolder mb-1 text-white" style={{ fontSize: '1.2rem' }}>Resumen Global de Admisiones</h4>
                                  <p className="mb-0 small" style={{ color: '#E0E7FF', fontSize: '0.82rem' }}>
                                    Total de <strong className="text-white">{stats.totalGeneral} solicitudes</strong> evaluadas en el proceso.
                                  </p>
                                </div>

                                <div className="d-flex align-items-center gap-2 w-100 w-sm-auto justify-content-between justify-content-sm-end mt-1 mt-sm-0">
                                  <div className="text-center bg-white p-2 px-3 rounded-4 shadow-sm" style={{ minWidth: '95px' }}>
                                    <div className="fs-3 fw-bolder lh-1" style={{ color: '#059669' }}>{stats.pctGeneral}%</div>
                                    <small className="fw-bolder text-uppercase d-block mt-1" style={{ fontSize: '0.65rem', color: '#475569', letterSpacing: '0.5px' }}>Aprobadas</small>
                                  </div>
                                  <div className="text-center bg-white p-2 px-3 rounded-4 shadow-sm" style={{ minWidth: '95px' }}>
                                    <div className="fs-3 fw-bolder lh-1" style={{ color: '#1E1B4B' }}>{stats.completadosGeneral}</div>
                                    <small className="fw-bolder text-uppercase d-block mt-1" style={{ fontSize: '0.65rem', color: '#475569', letterSpacing: '0.5px' }}>Listas</small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Tarjetas por Etapa / Nivel (Inicial, Primaria, Media General) */}
                          <div className="col-12">
                            <div className="row g-2.5 g-sm-3">
                              {(stats.desgloseEtapas || []).map((et: any, idx: number) => {
                                const c = et.pct >= 75 ? '#059669' : (et.pct >= 40 ? '#D97706' : '#DC2626');
                                const icono = et.etapa.includes('Inicial') ? 'bi-emoji-smile-fill' : (et.etapa.includes('Primaria') ? 'bi-backpack2-fill' : 'bi-mortarboard-fill');
                                const pComp = et.pct;
                                const pProc = et.total > 0 ? Math.round((et.enProceso / et.total) * 100) : 0;
                                const pSin = et.total > 0 ? Math.round((et.sinIniciar / et.total) * 100) : 0;

                                return (
                                  <div key={idx} className="col-12 col-md-4">
                                    <div className="card border-0 shadow-sm rounded-4 p-3 p-sm-3.5 h-100 bg-white" style={{ borderTop: `4px solid ${c}` }}>
                                      <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom">
                                        <div className="d-flex align-items-center gap-2">
                                          <div className="p-2 rounded-circle" style={{ backgroundColor: `${c}15`, color: c }}>
                                            <i className={`bi ${icono} fs-5`}></i>
                                          </div>
                                          <div>
                                            <h6 className="fw-bolder mb-0" style={{ color: '#0F172A', fontSize: '0.95rem' }}>{et.etapa}</h6>
                                            <small className="fw-bold" style={{ fontSize: '0.72rem', color: '#475569' }}>Total: {et.total} aspirantes</small>
                                          </div>
                                        </div>
                                        <div className="text-end">
                                          <span className="fs-4 fw-bolder lh-1 d-block" style={{ color: c }}>{et.pct}%</span>
                                        </div>
                                      </div>

                                      {/* Estados detallados con valores y badges bien separados */}
                                      <div className="d-flex flex-column gap-1.5 my-2">
                                        {/* Aprobadas */}
                                        <div className="p-2 px-2.5 rounded-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                                          <span className="fw-bold" style={{ color: '#14532D', fontSize: '0.8rem' }}>🟢 Aprobadas:</span>
                                          <div className="d-flex align-items-center gap-2">
                                            <span className="fw-bolder" style={{ color: '#0F172A', fontSize: '0.88rem' }}>{et.completados}</span>
                                            <span className="badge rounded-pill fw-bolder px-2 py-0.5" style={{ backgroundColor: '#059669', color: '#FFFFFF', fontSize: '0.72rem', minWidth: '46px', textAlign: 'center' }}>
                                              {pComp}%
                                            </span>
                                          </div>
                                        </div>

                                        {/* En Trámite */}
                                        <div className="p-2 px-2.5 rounded-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                                          <span className="fw-bold" style={{ color: '#78350F', fontSize: '0.8rem' }}>🟡 En Trámite:</span>
                                          <div className="d-flex align-items-center gap-2">
                                            <span className="fw-bolder" style={{ color: '#0F172A', fontSize: '0.88rem' }}>{et.enProceso}</span>
                                            <span className="badge rounded-pill fw-bolder px-2 py-0.5" style={{ backgroundColor: '#D97706', color: '#FFFFFF', fontSize: '0.72rem', minWidth: '46px', textAlign: 'center' }}>
                                              {pProc}%
                                            </span>
                                          </div>
                                        </div>

                                        {/* No Conformes */}
                                        <div className="p-2 px-2.5 rounded-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                                          <span className="fw-bold" style={{ color: '#1E293B', fontSize: '0.8rem' }}>⚪ No Conformes:</span>
                                          <div className="d-flex align-items-center gap-2">
                                            <span className="fw-bolder" style={{ color: '#0F172A', fontSize: '0.88rem' }}>{et.sinIniciar}</span>
                                            <span className="badge rounded-pill fw-bolder px-2 py-0.5" style={{ backgroundColor: '#475569', color: '#FFFFFF', fontSize: '0.72rem', minWidth: '46px', textAlign: 'center' }}>
                                              {pSin}%
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Barra Multicolor Compuesta */}
                                      <div className="progress rounded-pill shadow-inner mt-auto" style={{ height: '9px', backgroundColor: '#E2E8F0' }}>
                                        <div className="progress-bar" style={{ width: `${pComp}%`, backgroundColor: '#059669' }} title={`Aprobadas: ${pComp}%`}></div>
                                        <div className="progress-bar" style={{ width: `${pProc}%`, backgroundColor: '#D97706' }} title={`En Trámite: ${pProc}%`}></div>
                                        <div className="progress-bar" style={{ width: `${pSin}%`, backgroundColor: '#64748B' }} title={`Rechazadas: ${pSin}%`}></div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 1. DOSSIER 360° EJECUTIVO */}
                    {tipoGrafico === 'dossier' && (() => {
                      const R = 48;
                      const C = 2 * Math.PI * R;
                      const lenComp = stats.totalGeneral > 0 ? (stats.completadosGeneral / stats.totalGeneral) * C : 0;
                      const lenProc = stats.totalGeneral > 0 ? (stats.enProcesoGeneral / stats.totalGeneral) * C : 0;
                      const lenSin = stats.totalGeneral > 0 ? (stats.sinIniciarGeneral / stats.totalGeneral) * C : 0;
                      const pct = stats.pctGeneral;
                      const needleAngle = -90 + (pct / 100) * 180;
                      const gaugeColor = pct >= 75 ? '#059669' : (pct >= 40 ? '#D97706' : '#DC2626');

                      return (
                        <div className="animate__animated animate__fadeIn">
                          <div className="row g-2.5 g-sm-3 mb-3">
                            {/* Tacómetro Radial */}
                            <div className="col-12 col-md-4">
                              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 text-center d-flex flex-column justify-content-between">
                                <div className="d-flex justify-content-between align-items-center mb-1 pb-1 border-bottom">
                                  <span className="fw-bold small" style={{ color: '#0F172A' }}><i className="bi bi-speedometer2 text-primary me-1"></i>Meta de Aprobación</span>
                                  <span className="badge bg-light text-dark border">100%</span>
                                </div>
                                <div className="py-1 position-relative d-flex justify-content-center align-items-center" style={{ height: '95px' }}>
                                  <svg width="170" height="95" viewBox="0 0 140 85">
                                    <path d="M 15 75 A 55 55 0 0 1 125 75" fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round" />
                                    <path d="M 15 75 A 55 55 0 0 1 125 75" fill="none" stroke={gaugeColor} strokeWidth="12" strokeLinecap="round" strokeDasharray="172.78" strokeDashoffset={172.78 * (1 - pct / 100)} />
                                    <g transform={`translate(70, 75) rotate(${needleAngle})`}>
                                      <line x1="0" y1="0" x2="0" y2="-40" stroke="#1e40af" strokeWidth="3.5" strokeLinecap="round" />
                                      <circle cx="0" cy="0" r="4.5" fill="#1e40af" />
                                    </g>
                                  </svg>
                                </div>
                                <div className="mt-1">
                                  <div className="fs-3 fw-bolder lh-1" style={{ color: gaugeColor }}>{stats.pctGeneral}%</div>
                                  <span className="badge px-2.5 py-1 rounded-pill fw-bold mt-1" style={{ 
                                    fontSize: '0.75rem',
                                    backgroundColor: pct >= 75 ? '#DCFCE7' : (pct >= 40 ? '#FEF3C7' : '#FEE2E2'),
                                    color: pct >= 75 ? '#14532D' : (pct >= 40 ? '#78350F' : '#7F1D1D'),
                                    border: `1px solid ${pct >= 75 ? '#86EFAC' : (pct >= 40 ? '#FCD34D' : '#FCA5A5')}`
                                  }}>
                                    {pct >= 75 ? '🟢 Nivel Óptimo' : (pct >= 40 ? '🟡 En Progreso' : '🔴 Atención Prioritaria')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Donut Concéntrico */}
                            <div className="col-12 col-md-4">
                              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 text-center d-flex flex-column justify-content-between">
                                <div className="d-flex justify-content-between align-items-center mb-1 pb-1 border-bottom">
                                  <span className="fw-bold small" style={{ color: '#0F172A' }}><i className="bi bi-pie-chart-fill text-primary me-1"></i>Distribución</span>
                                  <span className="badge bg-light text-dark border">Proporción</span>
                                </div>
                                <div className="py-1 position-relative d-flex justify-content-center align-items-center">
                                  <svg width="115" height="115" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
                                    <circle cx="65" cy="65" r={R} fill="none" stroke="#f1f5f9" strokeWidth="16" />
                                    {lenComp > 0 && <circle cx="65" cy="65" r={R} fill="none" stroke="#059669" strokeWidth="16" strokeDasharray={`${lenComp} ${C - lenComp}`} strokeDashoffset={0} />}
                                    {lenProc > 0 && <circle cx="65" cy="65" r={R} fill="none" stroke="#D97706" strokeWidth="16" strokeDasharray={`${lenProc} ${C - lenProc}`} strokeDashoffset={-lenComp} />}
                                    {lenSin > 0 && <circle cx="65" cy="65" r={R} fill="none" stroke="#475569" strokeWidth="16" strokeDasharray={`${lenSin} ${C - lenSin}`} strokeDashoffset={-(lenComp + lenProc)} />}
                                  </svg>
                                  <div className="position-absolute text-center">
                                    <span className="fs-5 fw-bolder text-dark d-block lh-1">{stats.totalGeneral}</span>
                                    <span className="fw-bold" style={{ fontSize: '0.65rem', color: '#475569' }}>SOLICITUDES</span>
                                  </div>
                                </div>
                                <div className="d-flex justify-content-around text-center pt-1 border-top" style={{ fontSize: '0.74rem' }}>
                                  <div><span className="fw-bolder d-block" style={{ color: '#059669' }}>{stats.completadosGeneral}</span><span className="fw-bold" style={{ color: '#0F172A' }}>Listas</span></div>
                                  <div><span className="fw-bolder d-block" style={{ color: '#D97706' }}>{stats.enProcesoGeneral}</span><span className="fw-bold" style={{ color: '#0F172A' }}>Trámite</span></div>
                                  <div><span className="fw-bolder d-block" style={{ color: '#475569' }}>{stats.sinIniciarGeneral}</span><span className="fw-bold" style={{ color: '#0F172A' }}>Rechaz.</span></div>
                                </div>
                              </div>
                            </div>

                            {/* Niveles Educativos */}
                            <div className="col-12 col-md-4">
                              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 d-flex flex-column justify-content-between">
                                <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom">
                                  <span className="fw-bold small" style={{ color: '#0F172A' }}><i className="bi bi-diagram-3-fill text-primary me-1"></i>Avance por Nivel</span>
                                  <span className="badge bg-primary bg-opacity-10 text-primary border">Etapas</span>
                                </div>
                                <div className="d-flex flex-column gap-2">
                                  {stats.desgloseEtapas?.map((et: any, idx: number) => (
                                    <div key={idx} className="p-2 rounded-3 bg-light border">
                                      <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '0.78rem' }}>
                                        <span className="fw-bold" style={{ color: '#0F172A' }}>{et.etapa}</span>
                                        <span className="badge rounded-pill fw-bold" style={{ backgroundColor: '#DCFCE7', color: '#14532D', border: '1px solid #86EFAC' }}>
                                          {et.completados}/{et.total} ({et.pct}%)
                                        </span>
                                      </div>
                                      <div className="progress rounded-pill shadow-inner" style={{ height: '7px', backgroundColor: '#E2E8F0' }}>
                                        <div className="progress-bar" style={{ width: `${et.pct}%`, backgroundColor: '#059669' }}></div>
                                        <div className="progress-bar" style={{ width: `${et.total > 0 ? (et.enProceso / et.total) * 100 : 0}%`, backgroundColor: '#D97706' }}></div>
                                        <div className="progress-bar" style={{ width: `${et.total > 0 ? (et.sinIniciar / et.total) * 100 : 0}%`, backgroundColor: '#64748B' }}></div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Picos Skyline por Grado */}
                          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                            <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom">
                              <span className="fw-bold small" style={{ color: '#0F172A' }}><i className="bi bi-graph-up text-primary me-1"></i>Picos de Demanda por Grado ({stats.desglosePorGrado.length} Grados)</span>
                              <span className="badge bg-light text-dark border">Maternal a 5to Año</span>
                            </div>
                            <div style={{ height: '110px' }} className="d-flex align-items-flex-end gap-1.5 pt-3 px-1 border-bottom bg-light rounded-3">
                              {stats.desglosePorGrado.map((g: any, idx: number) => {
                                const h = Math.max(g.pctCompletado, 6);
                                const color = g.pctCompletado >= 75 ? '#059669' : (g.pctCompletado >= 40 ? '#D97706' : '#DC2626');
                                return (
                                  <div key={idx} className="flex-grow-1 d-flex flex-column align-items-center justify-content-end h-100 position-relative">
                                    <span className="fw-bold" style={{ fontSize: '0.64rem', color: color, marginBottom: '1px' }}>{g.pctCompletado}%</span>
                                    <div className="w-100 rounded-top shadow-sm" style={{ height: `${h}%`, backgroundColor: color, maxWidth: '24px' }}></div>
                                    <span className="fw-bold text-truncate mt-1" style={{ fontSize: '0.62rem', maxWidth: '36px', color: '#334155' }} title={g.grado}>
                                      {g.grado.replace('Educación ', '').replace('Grado', 'G').replace('Año', 'A')}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 2. TORTA 3D ISOMÉTRICA */}
                    {tipoGrafico === 'torta' && (() => {
                      const palette = [
                        '#00C3FF', '#8B5CF6', '#00E676', '#FF8D00', '#EC4899', '#3B82F6', 
                        '#10B981', '#F59E0B', '#06B6D4', '#6366F1', '#14B8A6', '#84CC16'
                      ];
                      const darkPalette = [
                        '#0095C2', '#6D28D9', '#00B359', '#CC7000', '#BE185D', '#1D4ED8', 
                        '#059669', '#D97706', '#0891B2', '#4338CA', '#0D9488', '#65A30D'
                      ];

                      const totalVal = dataset.reduce((acc, it) => acc + (it.completados || it.total || it.pct || 1), 0);
                      let accumAngle = -Math.PI / 2;
                      const cx = 155;
                      const cy = 95;
                      const rx = 120;
                      const ry = 58;
                      const depth = 22;

                      const slices = dataset.map((it, idx) => {
                        const val = it.completados !== undefined ? (it.completados || (it.total ? 0.01 : 1)) : (it.pct || 1);
                        const fraction = totalVal > 0 ? (val / totalVal) : (1 / dataset.length);
                        const angleSpan = fraction * 2 * Math.PI;
                        const startAngle = accumAngle;
                        const endAngle = accumAngle + angleSpan;
                        accumAngle = endAngle;

                        const x1 = cx + rx * Math.cos(startAngle);
                        const y1 = cy + ry * Math.sin(startAngle);
                        const x2 = cx + rx * Math.cos(endAngle);
                        const y2 = cy + ry * Math.sin(endAngle);
                        const largeArc = angleSpan > Math.PI ? 1 : 0;
                        const midAngle = startAngle + angleSpan / 2;
                        const color = it.color || palette[idx % palette.length];
                        const darkColor = darkPalette[idx % darkPalette.length];
                        const label = it.grado || it.etapa || it.nombre || `Segmento ${idx + 1}`;
                        const pctDisplay = it.pctCompletado ?? it.pct ?? Math.round(fraction * 100);

                        return {
                          it, idx, val, fraction, startAngle, endAngle, angleSpan,
                          x1, y1, x2, y2, largeArc, midAngle, color, darkColor, label, pctDisplay
                        };
                      });

                      return (
                        <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white animate__animated animate__fadeIn">
                          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-wrap gap-2">
                            <div>
                              <h6 className="fw-bold mb-0" style={{ color: '#0F172A' }}>
                                <i className="bi bi-pie-chart-fill text-primary me-2"></i>
                                Torta 3D Volumétrica: {tituloVista}
                              </h6>
                              <small className="fw-bold" style={{ color: '#475569' }}>Proporciones volumétricas con valores proyectados por color.</small>
                            </div>
                            <span className="badge bg-primary bg-opacity-10 text-primary border px-3 py-1 fw-bold">{nombreInstitucion}</span>
                          </div>

                          <div className="row align-items-center g-4">
                            {/* SVG 3D */}
                            <div className="col-12 col-lg-6 text-center">
                              <div className="position-relative d-inline-block">
                                <svg width="290" height="210" viewBox="0 0 310 230" style={{ overflow: 'visible', maxWidth: '100%' }}>
                                  {/* Capa de Profundidad 3D */}
                                  <g id="pie3d-depth">
                                    {slices.map((s) => {
                                      if (Math.sin(s.midAngle) <= -0.15 && Math.sin(s.startAngle) < 0 && Math.sin(s.endAngle) < 0) return null;
                                      return (
                                        <path
                                          key={`depth-${s.idx}`}
                                          d={`
                                            M ${s.x1} ${s.y1}
                                            A ${rx} ${ry} 0 ${s.largeArc} 1 ${s.x2} ${s.y2}
                                            L ${s.x2} ${s.y2 + depth}
                                            A ${rx} ${ry} 0 ${s.largeArc} 0 ${s.x1} ${s.y1 + depth}
                                            Z
                                          `}
                                          fill={s.darkColor}
                                          opacity="0.95"
                                        />
                                      );
                                    })}
                                  </g>

                                  {/* Capa Superior de la Torta */}
                                  <g id="pie3d-top">
                                    {slices.map((s) => (
                                      <path
                                        key={`top-${s.idx}`}
                                        d={`
                                          M ${cx} ${cy}
                                          L ${s.x1} ${s.y1}
                                          A ${rx} ${ry} 0 ${s.largeArc} 1 ${s.x2} ${s.y2}
                                          Z
                                        `}
                                        fill={s.color}
                                        stroke="#ffffff"
                                        strokeWidth="1.5"
                                      />
                                    ))}
                                  </g>

                                  {/* Etiquetas flotantes */}
                                  <g id="pie3d-labels">
                                    {slices.map((s) => {
                                      if (s.fraction < 0.04) return null;
                                      const labelRadiusX = rx * 0.7;
                                      const labelRadiusY = ry * 0.7;
                                      const lx = cx + labelRadiusX * Math.cos(s.midAngle);
                                      const ly = cy + labelRadiusY * Math.sin(s.midAngle);
                                      return (
                                        <g key={`lbl-${s.idx}`}>
                                          <rect
                                            x={lx - 16}
                                            y={ly - 9}
                                            width="32"
                                            height="18"
                                            rx="9"
                                            fill="#ffffff"
                                            stroke={s.color}
                                            strokeWidth="1.5"
                                            filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.15))"
                                          />
                                          <text
                                            x={lx}
                                            y={ly + 4}
                                            textAnchor="middle"
                                            fill="#0f172a"
                                            fontSize="9.5"
                                            fontWeight="900"
                                          >
                                            {s.pctDisplay}%
                                          </text>
                                        </g>
                                      );
                                    })}
                                  </g>
                                </svg>
                              </div>
                            </div>

                            {/* LEYENDA */}
                            <div className="col-12 col-lg-6">
                              <div className="d-flex flex-column gap-1.5" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                {slices.map((s) => (
                                  <div key={s.idx} className="p-2 rounded-3 bg-light border d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center gap-2 overflow-hidden">
                                      <div className="rounded-circle flex-shrink-0" style={{ width: '12px', height: '12px', backgroundColor: s.color }}></div>
                                      <span className="fw-bold small text-truncate" title={s.label} style={{ fontSize: '0.8rem', color: '#0F172A' }}>{s.label}</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                                      <small className="fw-bold" style={{ fontSize: '0.72rem', color: '#475569' }}>
                                        {s.it.completados !== undefined ? `${s.it.completados}/${s.it.total || stats.totalGeneral}` : ''}
                                      </small>
                                      <span className="badge fw-bold" style={{ backgroundColor: s.color, color: '#ffffff', fontSize: '0.72rem' }}>
                                        {s.pctDisplay}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 3. ANILLOS DONUT */}
                    {tipoGrafico === 'anillos' && (() => {
                      const R = 38;
                      const C = 2 * Math.PI * R;
                      return (
                        <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white animate__animated animate__fadeIn">
                          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <h6 className="fw-bold mb-0" style={{ color: '#0F172A' }}><i className="bi bi-record-circle text-primary me-2"></i>Gráfica en Anillos: {tituloVista}</h6>
                            <span className="badge bg-primary bg-opacity-10 text-primary border">{dataset.length} Categorías</span>
                          </div>
                          <div className="row g-2.5">
                            {dataset.map((it, idx) => {
                              const label = it.grado || it.etapa || it.nombre || '';
                              const itemPct = it.pctCompletado ?? it.pct ?? 0;
                              const itemColor = itemPct >= 75 ? '#059669' : (itemPct >= 40 ? '#D97706' : '#DC2626');
                              const itTot = it.total || stats.totalGeneral || 0;
                              const itComp = it.completados || 0;
                              const itemLen = itTot > 0 ? (itComp / itTot) * C : 0;
                              return (
                                <div key={idx} className="col-6 col-md-4 col-lg-3">
                                  <div className="p-2.5 rounded-3 bg-light border text-center h-100">
                                    <div className="fw-bold small text-truncate mb-1" title={label} style={{ fontSize: '0.78rem', color: '#0F172A' }}>{label}</div>
                                    <div className="position-relative d-flex justify-content-center align-items-center my-1">
                                      <svg width="85" height="85" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                                        <circle cx="50" cy="50" r={R} fill="none" stroke="#e2e8f0" strokeWidth="12" />
                                        <circle cx="50" cy="50" r={R} fill="none" stroke={itemColor} strokeWidth="12" strokeDasharray={`${itemLen} ${C - itemLen}`} strokeDashoffset={0} />
                                      </svg>
                                      <div className="position-absolute text-center">
                                        <span className="fw-bolder" style={{ color: itemColor, fontSize: '0.88rem' }}>{itemPct}%</span>
                                      </div>
                                    </div>
                                    <span className="badge bg-white border fw-bold" style={{ fontSize: '0.7rem', color: '#334155' }}>{itComp} / {itTot} listos</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* 4. PICOS DE RENDIMIENTO */}
                    {tipoGrafico === 'picos' && (
                      <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white animate__animated animate__fadeIn">
                        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                          <div>
                            <h6 className="fw-bold mb-0" style={{ color: '#0F172A' }}><i className="bi bi-graph-up text-primary me-2"></i>Picos de Demanda y Admisión: {tituloVista}</h6>
                            <small className="fw-bold" style={{ color: '#475569' }}>Cimas porcentuales alcanzadas en la asignación de cupos.</small>
                          </div>
                          <span className="badge bg-primary bg-opacity-10 text-primary border">0% - 100%</span>
                        </div>

                        <div style={{ height: '140px', overflowX: 'auto' }} className="d-flex align-items-flex-end gap-1.5 pt-4 px-2 border-bottom bg-light rounded-3 mb-3">
                          {dataset.map((it, idx) => {
                            const label = it.grado || it.etapa || it.nombre || '';
                            const itemPct = it.pctCompletado ?? it.pct ?? 0;
                            const h = Math.max(itemPct, 6);
                            const color = itemPct >= 75 ? '#059669' : (itemPct >= 40 ? '#D97706' : '#DC2626');
                            return (
                              <div key={idx} className="flex-grow-1 d-flex flex-column align-items-center justify-content-end h-100 position-relative" style={{ minWidth: '32px' }}>
                                <span className="fw-bold" style={{ fontSize: '0.65rem', color: color, marginBottom: '2px' }}>{itemPct}%</span>
                                <div className="w-100 rounded-top shadow-sm" style={{ height: `${h}%`, backgroundColor: color, maxWidth: '28px' }}></div>
                                <span className="fw-bold text-truncate mt-1" style={{ fontSize: '0.62rem', maxWidth: '38px', color: '#334155' }} title={label}>
                                  {label.replace('Educación ', '').replace('Grado', 'G').replace('Año', 'A')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 5. BARRAS COMPARATIVAS */}
                    {tipoGrafico === 'barras' && (
                      <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white animate__animated animate__fadeIn">
                        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                          <h6 className="fw-bold mb-0" style={{ color: '#0F172A' }}><i className="bi bi-bar-chart-steps text-primary me-2"></i>Barras de Avance: {tituloVista}</h6>
                          <span className="badge bg-primary bg-opacity-10 text-primary border">{dataset.length} Registros</span>
                        </div>
                        <div className="row g-2.5">
                          {dataset.map((it, idx) => {
                            const label = it.grado || it.etapa || it.nombre || '';
                            const itemPct = it.pctCompletado ?? it.pct ?? 0;
                            const itTot = it.total || stats.totalGeneral || 0;
                            const itComp = it.completados || 0;
                            const colorHex = itemPct >= 75 ? '#059669' : (itemPct >= 40 ? '#D97706' : '#DC2626');
                            return (
                              <div key={idx} className="col-12 col-md-6">
                                <div className="p-2.5 rounded-3 bg-light border h-100">
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="fw-bold small text-truncate" title={label} style={{ fontSize: '0.8rem', color: '#0F172A' }}>{label}</span>
                                    <span className="badge fw-bold" style={{ fontSize: '0.72rem', backgroundColor: colorHex, color: '#ffffff' }}>{itemPct}%</span>
                                  </div>
                                  <div className="progress rounded-pill shadow-inner mb-1" style={{ height: '8px', backgroundColor: '#E2E8F0' }}>
                                    <div className="progress-bar" style={{ width: `${itemPct}%`, backgroundColor: colorHex }}></div>
                                  </div>
                                  <div className="d-flex justify-content-between fw-bold" style={{ fontSize: '0.7rem', color: '#475569' }}>
                                    <span style={{ color: '#059669' }}>🟢 {itComp} aprobados</span>
                                    <span>Total: {itTot}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 6. RADAR */}
                    {tipoGrafico === 'radar' && (
                      <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white animate__animated animate__fadeIn">
                        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                          <div>
                            <h6 className="fw-bold mb-0" style={{ color: '#0F172A' }}><i className="bi bi-bullseye text-primary me-2"></i>Radar Multidimensional: {tituloVista}</h6>
                            <small className="fw-bold" style={{ color: '#475569' }}>Balance de solicitudes y adjudicación en todas las dimensiones evaluadas.</small>
                          </div>
                          <span className="badge bg-primary bg-opacity-10 text-primary border">{stats.totalGeneral} Solicitudes</span>
                        </div>

                        <div className="row g-2.5">
                          {dataset.map((it, idx) => {
                            const label = it.grado || it.etapa || it.nombre || '';
                            const itemPct = it.pctCompletado ?? it.pct ?? 0;
                            const itTot = it.total || stats.totalGeneral || 0;
                            const itComp = it.completados || 0;
                            const colorHex = itemPct >= 75 ? '#059669' : (itemPct >= 40 ? '#D97706' : '#DC2626');
                            return (
                              <div key={idx} className="col-12 col-md-6">
                                <div className="p-2.5 rounded-3 bg-light border h-100">
                                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                                    <div className="d-flex align-items-center gap-2">
                                      <div className="p-1.5 rounded-circle bg-primary bg-opacity-10 text-primary">
                                        <i className="bi bi-compass-fill" style={{ fontSize: '0.85rem' }}></i>
                                      </div>
                                      <div>
                                        <span className="fw-bold d-block small" style={{ fontSize: '0.8rem', color: '#0F172A' }}>{label}</span>
                                        <small className="fw-bold" style={{ fontSize: '0.7rem', color: '#475569' }}>{itComp} de {itTot} aprobados</small>
                                      </div>
                                    </div>
                                    <span className="fw-bolder" style={{ fontSize: '0.92rem', color: '#4338CA' }}>{itemPct}%</span>
                                  </div>
                                  <div className="progress rounded-pill shadow-inner" style={{ height: '7px', backgroundColor: '#E2E8F0' }}>
                                    <div className="progress-bar" style={{ width: `${itemPct}%`, backgroundColor: colorHex }}></div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 7. TACÓMETROS */}
                    {tipoGrafico === 'tacometro' && (
                      <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white animate__animated animate__fadeIn">
                        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                          <h6 className="fw-bold mb-0" style={{ color: '#0F172A' }}><i className="bi bi-speedometer2 text-primary me-2"></i>Tacómetros de Meta: {tituloVista}</h6>
                          <span className="badge bg-primary bg-opacity-10 text-primary border">180° Gauges</span>
                        </div>
                        <div className="row g-2.5">
                          {dataset.map((it, idx) => {
                            const label = it.grado || it.etapa || it.nombre || '';
                            const itemPct = it.pctCompletado ?? it.pct ?? 0;
                            const itemColor = itemPct >= 75 ? '#059669' : (itemPct >= 40 ? '#D97706' : '#DC2626');
                            const needleAngle = -90 + (itemPct / 100) * 180;
                            const itTot = it.total || stats.totalGeneral || 0;
                            const itComp = it.completados || 0;
                            return (
                              <div key={idx} className="col-6 col-md-4 col-lg-3">
                                <div className="p-2.5 rounded-3 bg-light border text-center h-100">
                                  <div className="fw-bold small text-truncate mb-1" title={label} style={{ fontSize: '0.78rem', color: '#0F172A' }}>{label}</div>
                                  <div className="position-relative d-flex justify-content-center align-items-center my-1" style={{ height: '70px' }}>
                                    <svg width="120" height="70" viewBox="0 0 140 85">
                                      <path d="M 15 75 A 55 55 0 0 1 125 75" fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round" />
                                      <path d="M 15 75 A 55 55 0 0 1 125 75" fill="none" stroke={itemColor} strokeWidth="12" strokeLinecap="round" strokeDasharray="172.78" strokeDashoffset={172.78 * (1 - itemPct / 100)} />
                                      <g transform={`translate(70, 75) rotate(${needleAngle})`}>
                                        <line x1="0" y1="0" x2="0" y2="-40" stroke="#1e40af" strokeWidth="3" strokeLinecap="round" />
                                        <circle cx="0" cy="0" r="4.5" fill="#1e40af" />
                                      </g>
                                    </svg>
                                  </div>
                                  <div className="fw-bolder" style={{ color: itemColor, fontSize: '0.92rem' }}>{itemPct}%</div>
                                  <span className="badge bg-white border fw-bold" style={{ fontSize: '0.7rem', color: '#334155' }}>{itComp}/{itTot}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 8. TABLA DETALLADA CON ALTO CONTRASTE */}
                    {tipoGrafico === 'tabla' && (
                      <div className="bg-white rounded-4 shadow-sm border overflow-hidden animate__animated animate__fadeIn mb-2">
                        <div className="p-2.5 bg-light border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                          <span className="fw-bold small" style={{ color: '#0F172A' }}>
                            <i className="bi bi-table me-2 text-primary"></i>
                            Matriz Tabular Consolidada: {tituloVista}
                          </span>
                          <span className="badge bg-dark bg-opacity-10 text-dark border px-2.5 py-1 fw-bold" style={{ fontSize: '0.72rem' }}>{nombreInstitucion}</span>
                        </div>
                        <div className="table-responsive">
                          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                            <thead style={{ backgroundColor: '#EDE9FE', color: '#4C1D95' }} className="small">
                              <tr>
                                <th className="ps-3 fw-bolder" style={{ color: '#4C1D95' }}>{tituloVista}</th>
                                <th className="text-center fw-bolder" style={{ color: '#4C1D95' }}>Total</th>
                                <th className="text-center fw-bolder" style={{ color: '#065F46' }}>Aprobadas / Listas</th>
                                <th className="text-center fw-bolder" style={{ color: '#92400E' }}>En Trámite</th>
                                <th className="text-center fw-bolder" style={{ color: '#334155' }}>Rechazadas / Borrador</th>
                                <th style={{ width: '180px', color: '#4C1D95' }} className="fw-bolder">Progreso</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dataset.map((it: any, idx: number) => {
                                const label = it.grado || it.etapa || it.nombre || `Ítem ${idx + 1}`;
                                const tot = it.total || 0;
                                const comp = it.completados || 0;
                                const proc = it.enProceso || (tot - comp);
                                const sin = it.sinIniciar || 0;
                                const p = it.pctCompletado ?? it.pct ?? (tot > 0 ? Math.round((comp / tot) * 100) : 0);

                                return (
                                  <tr key={idx}>
                                    <td className="ps-3 fw-bold" style={{ color: '#0F172A' }}>{label}</td>
                                    <td className="text-center fw-bolder" style={{ color: '#0F172A' }}>{tot}</td>
                                    <td className="text-center">
                                      <span className="badge rounded-pill fw-bold px-2.5 py-1" style={{ backgroundColor: '#059669', color: '#FFFFFF' }}>
                                        {comp}
                                      </span>
                                    </td>
                                    <td className="text-center">
                                      <span className="badge rounded-pill fw-bold px-2.5 py-1" style={{ backgroundColor: '#D97706', color: '#FFFFFF' }}>
                                        {proc}
                                      </span>
                                    </td>
                                    <td className="text-center">
                                      <span className="badge rounded-pill fw-bold px-2.5 py-1" style={{ backgroundColor: '#475569', color: '#FFFFFF' }}>
                                        {sin}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="d-flex align-items-center gap-1.5">
                                        <div className="progress flex-grow-1 rounded-pill" style={{ height: '7px', backgroundColor: '#E2E8F0' }}>
                                          <div className="progress-bar" role="progressbar" style={{ width: `${p}%`, backgroundColor: '#059669' }}></div>
                                        </div>
                                        <span className="small fw-bolder" style={{ minWidth: '35px', fontSize: '0.76rem', color: '#059669' }}>{p}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                              <tr className="fw-bold border-top border-2" style={{ fontSize: '0.88rem', backgroundColor: '#EDE9FE', color: '#3B0764' }}>
                                <td className="ps-3" style={{ color: '#3B0764' }}>TOTAL GENERAL CONSOLIDADO</td>
                                <td className="text-center" style={{ color: '#3B0764' }}>{stats.totalGeneral}</td>
                                <td className="text-center" style={{ color: '#047857' }}>{stats.completadosGeneral}</td>
                                <td className="text-center" style={{ color: '#B45309' }}>{stats.enProcesoGeneral}</td>
                                <td className="text-center" style={{ color: '#334155' }}>{stats.sinIniciarGeneral}</td>
                                <td>
                                  <div className="d-flex align-items-center gap-1.5">
                                    <div className="progress flex-grow-1 rounded-pill" style={{ height: '9px', backgroundColor: '#DDD6FE' }}>
                                      <div className="progress-bar" role="progressbar" style={{ width: `${stats.pctGeneral}%`, backgroundColor: '#7C3AED' }}></div>
                                    </div>
                                    <span className="small fw-bolder" style={{ minWidth: '35px', fontSize: '0.8rem', color: '#5B21B6' }}>{stats.pctGeneral}%</span>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PIE DEL MODAL CON ACCIONES DE EXPORTACIÓN (MOBILE RESPONSIVE) */}
                  <div className="modal-footer bg-white border-top px-3 px-md-4 py-2.5 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2.5 mt-2 rounded-bottom-4">
                    <div className="d-flex align-items-center justify-content-center w-100 w-sm-auto">
                      <img src="/assets/img/logoMPPE.png" style={{ height: '26px', width: 'auto' }} alt="MPPE" className="opacity-75" />
                    </div>

                    <div className="d-flex align-items-center justify-content-center justify-content-sm-end gap-1.5 flex-wrap w-100 w-sm-auto">
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm rounded-pill px-2.5 px-sm-3 py-1.5 fw-bold d-flex align-items-center gap-1 shadow-xs flex-grow-1 flex-sm-grow-0 justify-content-center"
                        onClick={exportarEstadisticasExcel}
                        title="Exportar archivo Excel estructurado"
                      >
                        <i className="bi bi-file-earmark-excel-fill text-success"></i>
                        <span>Excel</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm rounded-pill px-2.5 px-sm-3 py-1.5 fw-bold d-flex align-items-center gap-1 shadow-xs flex-grow-1 flex-sm-grow-0 justify-content-center"
                        onClick={imprimirReporteEstadistico}
                        title="Imprimir reporte en hoja carta"
                      >
                        <i className="bi bi-printer-fill"></i>
                        <span>Imprimir</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm rounded-pill px-2.5 px-sm-3 py-1.5 fw-bold d-flex align-items-center gap-1 shadow-xs flex-grow-1 flex-sm-grow-0 justify-content-center"
                        onClick={() => enviarWhatsAppImagen(stats, nombreInstitucion, tipoGrafico, criterioAgrupacion)}
                        title="Copiar imagen PNG del reporte para WhatsApp"
                      >
                        <i className="bi bi-whatsapp"></i>
                        <span>WhatsApp</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-primary btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1 shadow-xs flex-grow-1 flex-sm-grow-0 justify-content-center"
                        onClick={descargarReportePDF}
                        disabled={generandoPDF}
                        style={{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' }}
                        title="Descargar documento PDF oficial con membrete institucional"
                      >
                        {generandoPDF ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            <span>PDF...</span>
                          </>
                        ) : (
                          <>
                            <i className="bi bi-file-earmark-pdf-fill"></i>
                            <span>Descargar PDF</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        className="btn btn-light border btn-sm rounded-pill px-3 py-1.5 fw-bold text-muted flex-grow-1 flex-sm-grow-0 justify-content-center"
                        onClick={() => setModalEstadisticas(false)}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* ── MODAL HABILITAR ACCESO DE REPRESENTANTE Y ESTUDIANTE EN SIGAE ───────── */}
      {modalHabilitarAccesoAbierto && solicitudHabilitar && createPortal(
        <div
          className="modal fade show d-flex align-items-center justify-content-center"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 99999,
            overflowY: 'auto',
            padding: '12px'
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down my-auto mx-auto w-100" style={{ maxWidth: '850px', maxHeight: '94vh' }}>
            <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden bg-white">
              {/* Header */}
              <div className="modal-header py-3 px-4 text-white d-flex align-items-center justify-content-between" style={{ backgroundColor: '#4F46E5' }}>
                <div className="d-flex align-items-center gap-2.5">
                  <span className="p-2 bg-white bg-opacity-20 rounded-circle text-white d-flex align-items-center justify-content-center shadow-xs">
                    <i className="bi bi-person-check-fill fs-5"></i>
                  </span>
                  <div>
                    <h5 className="modal-title fw-bold mb-0" style={{ fontSize: '1.1rem' }}>
                      Habilitar Acceso SIGAE al Representante
                    </h5>
                    <small className="opacity-75 extra-small">
                      Alta y vinculación oficial de usuarios para primer ingreso al sistema
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setModalHabilitarAccesoAbierto(false)}
                  disabled={procesandoHabilitacion}
                ></button>
              </div>

              {/* Body */}
              <div className="modal-body p-3 p-md-4" style={{ fontSize: '13.5px' }}>
                {/* Banner Reactivo de Verificación de Cédula */}
                <div className="mb-3">
                  {verificandoCedulaRep ? (
                    <div className="alert alert-light border d-flex align-items-center gap-2 p-2.5 rounded-3 mb-0">
                      <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                      <span className="small text-muted">Consultando estado del usuario en la base de datos...</span>
                    </div>
                  ) : repExistenteInfo?.existe ? (
                    <div className="alert alert-success border-0 shadow-xs p-3 rounded-3 mb-0 d-flex align-items-start gap-2.5" style={{ backgroundColor: '#F0FDF4', borderLeft: '4px solid #16A34A' }}>
                      <i className="bi bi-check-circle-fill text-success fs-5 flex-shrink-0 mt-0.5"></i>
                      <div>
                        <strong className="d-block text-success">Usuario Existente Registrado en SIGAE</strong>
                        <span className="small text-dark d-block mt-0.5">
                          La cédula <b>{cleanCedula(formHabilitar.representante_cedula)}</b> ya pertenece al usuario <b>{repExistenteInfo.nombre_completo || 'Representante'}</b> con rol <span className="badge bg-success-subtle text-success border border-success-subtle">{repExistenteInfo.rol}</span>.
                        </span>
                        <small className="text-muted extra-small d-block mt-1">
                          <i className="bi bi-shield-check text-success me-1"></i>
                          <b>Seguridad garantizada:</b> No se modificará su contraseña, preguntas de seguridad ni datos personales registrados previamente. Al confirmar, <b>únicamente se le vinculará el estudiante</b>.
                        </small>
                      </div>
                    </div>
                  ) : repExistenteInfo && !repExistenteInfo.existe ? (
                    <div className="alert alert-primary border-0 shadow-xs p-3 rounded-3 mb-0 d-flex align-items-start gap-2.5" style={{ backgroundColor: '#EEF2FF', borderLeft: '4px solid #6366F1' }}>
                      <i className="bi bi-person-plus-fill text-primary fs-5 flex-shrink-0 mt-0.5"></i>
                      <div>
                        <strong className="d-block text-primary">Nuevo Usuario para Primer Ingreso en SIGAE</strong>
                        <span className="small text-dark d-block mt-0.5">
                          No existe cuenta previa registrada para la cédula <b>{cleanCedula(formHabilitar.representante_cedula)}</b>. Se creará su usuario oficial con rol <b>representante</b>.
                        </span>
                        <small className="text-muted extra-small d-block mt-1">
                          <i className="bi bi-key-fill text-primary me-1"></i>
                          <b>Sin clave previa:</b> Se registrará con <code>clave: null</code> y <code>primer_ingreso: true</code>. El representante creará su propia contraseña confidencial y preguntas de seguridad al ingresar por primera vez con su cédula.
                        </small>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Formulario Editable en 2 Columnas */}
                <div className="row g-3">
                  {/* Columna 1: Representante Legal */}
                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded-3 border h-100">
                      <h6 className="fw-bold text-dark border-bottom pb-2 mb-2.5 d-flex align-items-center gap-1.5" style={{ fontSize: '13px' }}>
                        <i className="bi bi-person-badge text-primary"></i>
                        <span>Datos del Representante Legal</span>
                      </h6>

                      <div className="mb-2">
                        <label className="form-label extra-small fw-bold text-secondary mb-1">
                          Cédula de Identidad *
                        </label>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text bg-white text-muted">V / E</span>
                          <input
                            type="text"
                            className="form-control fw-bold font-monospace"
                            placeholder="Ej: 12345678"
                            value={formHabilitar.representante_cedula}
                            onChange={e => {
                              const val = e.target.value;
                              setFormHabilitar(prev => ({ ...prev, representante_cedula: val }));
                              verificarCedulaRepEnVivo(val);
                            }}
                          />
                        </div>
                      </div>

                      <div className="row g-2 mb-2">
                        <div className="col-6">
                          <label className="form-label extra-small fw-bold text-secondary mb-1">
                            Nombres *
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={formHabilitar.representante_nombres}
                            onChange={e => setFormHabilitar(prev => ({ ...prev, representante_nombres: e.target.value }))}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label extra-small fw-bold text-secondary mb-1">
                            Apellidos *
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={formHabilitar.representante_apellidos}
                            onChange={e => setFormHabilitar(prev => ({ ...prev, representante_apellidos: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="mb-2">
                        <label className="form-label extra-small fw-bold text-secondary mb-1">
                          Teléfono de Contacto (WhatsApp)
                        </label>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text bg-white text-success">
                            <i className="bi bi-whatsapp"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Ej: 04141234567"
                            value={formHabilitar.representante_telefono}
                            onChange={e => setFormHabilitar(prev => ({ ...prev, representante_telefono: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="mb-0">
                        <label className="form-label extra-small fw-bold text-secondary mb-1">
                          Correo Electrónico
                        </label>
                        <input
                          type="email"
                          className="form-control form-control-sm"
                          placeholder="representante@email.com"
                          value={formHabilitar.representante_email}
                          onChange={e => setFormHabilitar(prev => ({ ...prev, representante_email: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Columna 2: Aspirante / Estudiante */}
                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded-3 border h-100">
                      <h6 className="fw-bold text-dark border-bottom pb-2 mb-2.5 d-flex align-items-center gap-1.5" style={{ fontSize: '13px' }}>
                        <i className="bi bi-mortarboard text-info"></i>
                        <span>Datos del Aspirante a Vincular</span>
                      </h6>

                      <div className="row g-2 mb-2">
                        <div className="col-6">
                          <label className="form-label extra-small fw-bold text-secondary mb-1">
                            Nombres *
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-sm fw-bold"
                            value={formHabilitar.estudiante_nombres}
                            onChange={e => setFormHabilitar(prev => ({ ...prev, estudiante_nombres: e.target.value }))}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label extra-small fw-bold text-secondary mb-1">
                            Apellidos *
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-sm fw-bold"
                            value={formHabilitar.estudiante_apellidos}
                            onChange={e => setFormHabilitar(prev => ({ ...prev, estudiante_apellidos: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="mb-2">
                        <label className="form-label extra-small fw-bold text-secondary mb-1">
                          Cédula / Identificador Escolar
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm font-monospace"
                          placeholder={`Por defecto: T-${solicitudHabilitar.codigo_unico}`}
                          value={formHabilitar.estudiante_cedula}
                          onChange={e => setFormHabilitar(prev => ({ ...prev, estudiante_cedula: e.target.value }))}
                        />
                        <small className="text-muted extra-small">
                          Si no posee cédula de identidad, se registrará con código temporal.
                        </small>
                      </div>

                      <div className="row g-2 mb-0">
                        <div className="col-7">
                          <label className="form-label extra-small fw-bold text-secondary mb-1">
                            Grado Asignado *
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={formHabilitar.grado_solicitado}
                            onChange={e => setFormHabilitar(prev => ({ ...prev, grado_solicitado: e.target.value }))}
                          />
                        </div>
                        <div className="col-5">
                          <label className="form-label extra-small fw-bold text-secondary mb-1">
                            Escuela *
                          </label>
                          <select
                            className="form-select form-select-sm"
                            value={formHabilitar.codigo_escuela}
                            onChange={e => setFormHabilitar(prev => ({ ...prev, codigo_escuela: e.target.value }))}
                          >
                            <option value="sb">Santa Bárbara</option>
                            <option value="lb">Libertador B.</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nota de Políticas de Documentación y Constancia Bloqueada */}
                <div className="alert alert-warning border-0 shadow-xs p-3 rounded-3 mt-3 mb-0 d-flex align-items-start gap-2.5" style={{ backgroundColor: '#FFFBEB', borderLeft: '4px solid #F59E0B' }}>
                  <i className="bi bi-lock-fill text-warning fs-5 flex-shrink-0 mt-0.5"></i>
                  <div className="small">
                    <strong className="text-dark d-block">Política de Descarga de Documentos y Bloqueo de Constancia:</strong>
                    <span className="text-secondary d-block mt-0.5">
                      Al completar esta habilitación, el representante podrá ingresar a SIGAE para descargar su <b>Carta de Aceptación Oficial</b>, la <b>Hoja de Resumen de Admisión</b> y las <b>Normas Internas</b>.
                    </span>
                    <span className="text-dark fw-bold d-block mt-1">
                      🔒 La Constancia Oficial de Inscripción permanecerá bloqueada con candado institucional en el portal del representante hasta que la escuela confirme la formalización física en la sede.
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer bg-light py-2.5 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm rounded-pill px-3"
                  onClick={() => setModalHabilitarAccesoAbierto(false)}
                  disabled={procesandoHabilitacion}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-1.5 text-white"
                  style={{ backgroundColor: '#4F46E5', borderColor: '#4338CA' }}
                  onClick={ejecutarHabilitacionAcceso}
                  disabled={procesandoHabilitacion}
                >
                  {procesandoHabilitacion ? (
                    <><span className="spinner-border spinner-border-sm" role="status"></span> Guardando...</>
                  ) : (
                    <><i className="bi bi-person-check-fill"></i> Confirmar y Habilitar Acceso en SIGAE</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL DIFUSIÓN MASIVA WHATSAPP PARA CUPOS APROBADOS ───────────────── */}
      {modalDifusionAbierto && (() => {
        // Filtrar aspirantes con cupo Aprobado o Formalizado
        const aspirantesAprobados = solicitudes.filter(s => s.estado === 'Aprobado' || s.estado === 'Formalizado');
        const aspirantesFiltradosDifusion = aspirantesAprobados.filter(s => {
          if (filtroEscuelaDifusion !== 'todas' && s.codigo_escuela !== filtroEscuelaDifusion) return false;
          if (filtroGradoDifusion !== 'todos' && s.grado_solicitado !== filtroGradoDifusion) return false;
          const parsed = parsearObservaciones(s.observaciones);
          if (filtroEstadoEnvioDifusion === 'pendientes' && parsed.whatsapp_notificado) return false;
          if (filtroEstadoEnvioDifusion === 'enviados' && !parsed.whatsapp_notificado) return false;
          return true;
        });

        const totalAprobados = aspirantesAprobados.length;
        const totalConTel = aspirantesAprobados.filter(s => {
          const t = cleanCedula(s.representante_telefono || s.representante_telefono2);
          return t && t.length >= 7;
        }).length;
        const totalNotificados = aspirantesAprobados.filter(s => parsearObservaciones(s.observaciones).whatsapp_notificado).length;
        const totalPendientes = totalAprobados - totalNotificados;

        const aspActual = aspirantesFiltradosDifusion[aspiranteActivoDifusionIdx] || aspirantesFiltradosDifusion[0];

        return createPortal(
          <div
            className="modal fade show d-flex align-items-center justify-content-center"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(6px)',
              zIndex: 99999,
              overflowY: 'auto',
              padding: '12px'
            }}
          >
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down my-auto mx-auto w-100" style={{ maxWidth: '1100px', maxHeight: '94vh' }}>
              <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden bg-white">
                {/* Header */}
                <div className="modal-header py-3 px-4 text-white d-flex align-items-center justify-content-between" style={{ backgroundColor: '#10B981' }}>
                  <div className="d-flex align-items-center gap-2.5">
                    <span className="p-2 bg-white bg-opacity-20 rounded-circle text-white d-flex align-items-center justify-content-center shadow-xs">
                      <i className="bi bi-whatsapp fs-5"></i>
                    </span>
                    <div>
                      <h5 className="modal-title fw-bold mb-0" style={{ fontSize: '1.1rem' }}>
                        Difusión Masiva por WhatsApp • Orientaciones de Inscripción
                      </h5>
                      <small className="opacity-90 extra-small">
                        Notificación estructurada paso a paso para aspirantes con cupo aprobado
                      </small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setModalDifusionAbierto(false)}
                  ></button>
                </div>

                {/* Body */}
                <div className="modal-body p-3 p-md-4" style={{ fontSize: '13.5px' }}>
                  {/* Banner de Acceso al Despachador Anti-Spam Avanzado */}
                  <div className="alert alert-success border-0 shadow-xs rounded-3 p-3 mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2" style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                    <div className="d-flex align-items-center gap-2">
                      <div className="p-2 bg-success text-white rounded-circle d-flex align-items-center justify-content-center shadow-xs" style={{ width: '36px', height: '36px' }}>
                        <i className="bi bi-shield-lock-fill fs-5"></i>
                      </div>
                      <div>
                        <div className="fw-bold text-dark" style={{ fontSize: '13.5px' }}>
                          ¿Quieres evitar bloqueos o reportes de spam por Meta/WhatsApp?
                        </div>
                        <small className="text-muted" style={{ fontSize: '12px' }}>
                          Usa el nuevo módulo <strong>Orientaciones Nuevos Ingresos</strong> con rotación Spintax, retardo humano programable y lotes seguros.
                        </small>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-success btn-sm rounded-pill px-3 py-1.5 fw-bold shadow-xs d-flex align-items-center gap-1.5"
                      onClick={() => {
                        setModalDifusionAbierto(false);
                        navigate(`/categoria/Diseños/Orientaciones%20Nuevos%20Ingresos?escuela=${filtroEscuela === 'todas' ? 'sb' : filtroEscuela}`);
                      }}
                    >
                      <i className="bi bi-box-arrow-up-right"></i>
                      <span>Abrir Despachador Anti-Spam</span>
                    </button>
                  </div>

                  {/* KPIs de Difusión */}
                  <div className="row g-2 mb-3">
                    <div className="col-6 col-md-3">
                      <div className="p-2.5 rounded-3 border bg-light text-center">
                        <small className="text-muted extra-small fw-bold text-uppercase d-block">Total Aprobados</small>
                        <strong className="fs-5 text-dark">{totalAprobados}</strong>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="p-2.5 rounded-3 border bg-light text-center">
                        <small className="text-muted extra-small fw-bold text-uppercase d-block">Con Teléfono</small>
                        <strong className="fs-5 text-primary">{totalConTel}</strong>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="p-2.5 rounded-3 border text-center" style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }}>
                        <small className="extra-small fw-bold text-uppercase d-block text-success">Notificados WA</small>
                        <strong className="fs-5 text-success">{totalNotificados}</strong>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="p-2.5 rounded-3 border text-center" style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}>
                        <small className="extra-small fw-bold text-uppercase d-block text-warning">Pendientes</small>
                        <strong className="fs-5 text-warning">{totalPendientes}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Barra de Filtros */}
                  <div className="p-2.5 bg-light border rounded-3 mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2 flex-wrap flex-grow-1">
                      <div className="d-flex align-items-center gap-1">
                        <span className="extra-small fw-bold text-secondary">Escuela:</span>
                        <select
                          className="form-select form-select-sm"
                          style={{ width: '160px' }}
                          value={filtroEscuelaDifusion}
                          onChange={e => {
                            setFiltroEscuelaDifusion(e.target.value);
                            setAspiranteActivoDifusionIdx(0);
                          }}
                          disabled={esSedeFija}
                        >
                          {!esSedeFija && <option value="todas">Todas</option>}
                          {(!esSedeFija || escuelaUsuarioAsignada === 'sb') && <option value="sb">Santa Bárbara</option>}
                          {(!esSedeFija || escuelaUsuarioAsignada === 'lb') && <option value="lb">Libertador B.</option>}
                        </select>
                      </div>

                      <div className="d-flex align-items-center gap-1">
                        <span className="extra-small fw-bold text-secondary">Grado:</span>
                        <select
                          className="form-select form-select-sm"
                          style={{ width: '160px' }}
                          value={filtroGradoDifusion}
                          onChange={e => {
                            setFiltroGradoDifusion(e.target.value);
                            setAspiranteActivoDifusionIdx(0);
                          }}
                        >
                          <option value="todos">Todos los Grados</option>
                          {opcionesGradoEnriquecidos.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>

                      <div className="d-flex align-items-center gap-1">
                        <span className="extra-small fw-bold text-secondary">Estado Envío:</span>
                        <select
                          className="form-select form-select-sm"
                          style={{ width: '170px' }}
                          value={filtroEstadoEnvioDifusion}
                          onChange={e => {
                            setFiltroEstadoEnvioDifusion(e.target.value as any);
                            setAspiranteActivoDifusionIdx(0);
                          }}
                        >
                          <option value="todos">Todos ({aspirantesAprobados.length})</option>
                          <option value="pendientes">Pendientes ({totalPendientes})</option>
                          <option value="enviados">Ya Enviados ({totalNotificados})</option>
                        </select>
                      </div>
                    </div>

                    <span className="badge bg-white text-dark border px-2.5 py-1.5 fw-bold">
                      {aspirantesFiltradosDifusion.length} destinatarios
                    </span>
                  </div>

                  {/* Asistente Secuencial de Envío Rápido */}
                  {aspActual && (
                    <div className="card border-0 shadow-xs rounded-3 mb-3 text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)' }}>
                      <div className="card-body p-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div>
                          <span className="badge bg-white text-success rounded-pill px-2 py-0.5 extra-small fw-bold mb-1">
                            Aspirante {aspiranteActivoDifusionIdx + 1} de {aspirantesFiltradosDifusion.length}
                          </span>
                          <h6 className="fw-bold mb-0 text-white fs-6">
                            {nombreCompleto(aspActual.estudiante_nombres, aspActual.estudiante_apellidos)}
                          </h6>
                          <small className="opacity-90 extra-small d-block">
                            Grado: <b>{aspActual.grado_solicitado}</b> • Plantel: <b>{aspActual.codigo_escuela?.toUpperCase() === 'SB' ? 'Santa Bárbara' : 'Libertador B.'}</b> • Rep: <b>{nombreCompleto(aspActual.representante_nombres, aspActual.representante_apellidos)}</b> ({aspActual.representante_telefono || 'Sin teléfono'})
                          </small>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-light btn-sm fw-bold px-3 py-1.5 shadow-sm d-flex align-items-center gap-1.5 text-success"
                            onClick={() => {
                              enviarWhatsAppIndividualDifusion(aspActual);
                              if (aspiranteActivoDifusionIdx < aspirantesFiltradosDifusion.length - 1) {
                                setAspiranteActivoDifusionIdx(prev => prev + 1);
                              }
                            }}
                          >
                            <i className="bi bi-whatsapp fs-6"></i>
                            <span>Enviar WA y Avanzar ⏩</span>
                          </button>

                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-light"
                              disabled={aspiranteActivoDifusionIdx === 0}
                              onClick={() => setAspiranteActivoDifusionIdx(prev => Math.max(0, prev - 1))}
                            >
                              <i className="bi bi-chevron-left"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-light"
                              disabled={aspiranteActivoDifusionIdx >= aspirantesFiltradosDifusion.length - 1}
                              onClick={() => setAspiranteActivoDifusionIdx(prev => Math.min(aspirantesFiltradosDifusion.length - 1, prev + 1))}
                            >
                              <i className="bi bi-chevron-right"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tabla de Destinatarios */}
                  <div className="card border rounded-3 overflow-hidden">
                    <div className="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center justify-content-between">
                      <span className="fw-bold small text-dark d-flex align-items-center gap-1.5">
                        <i className="bi bi-people-fill text-primary"></i>
                        <span>Lista de Destinatarios de Difusión ({aspirantesFiltradosDifusion.length})</span>
                      </span>
                      <small className="text-muted extra-small">
                        Haz clic en Enviar para abrir WhatsApp con el mensaje preformateado
                      </small>
                    </div>

                    <div className="table-responsive" style={{ maxHeight: '340px' }}>
                      <table className="table table-hover align-middle mb-0" style={{ fontSize: '12.5px' }}>
                        <thead className="table-light extra-small text-uppercase">
                          <tr>
                            <th className="ps-3">#</th>
                            <th>Aspirante / Grado</th>
                            <th>Plantel</th>
                            <th>Representante / Cédula</th>
                            <th>Teléfono WhatsApp</th>
                            <th className="text-center">Estado Envío</th>
                            <th className="text-end pe-3">Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aspirantesFiltradosDifusion.map((s, idx) => {
                            const parsed = parsearObservaciones(s.observaciones);
                            const tel = s.representante_telefono || s.representante_telefono2 || '';
                            const telClean = cleanCedula(tel);
                            const tieneTelValido = Boolean(telClean && telClean.length >= 7);

                            return (
                              <tr key={s.id || s.codigo_unico} className={aspiranteActivoDifusionIdx === idx ? 'table-primary bg-opacity-10' : ''}>
                                <td className="ps-3 fw-bold text-muted extra-small">{idx + 1}</td>
                                <td>
                                  <strong className="d-block text-dark">{nombreCompleto(s.estudiante_nombres, s.estudiante_apellidos)}</strong>
                                  <small className="text-muted extra-small">{s.grado_solicitado}</small>
                                </td>
                                <td>
                                  <span className={`badge ${s.codigo_escuela === 'sb' ? 'bg-primary' : 'bg-success'} text-white extra-small`}>
                                    {s.codigo_escuela?.toUpperCase()}
                                  </span>
                                </td>
                                <td>
                                  <div className="text-dark">{nombreCompleto(s.representante_nombres, s.representante_apellidos)}</div>
                                  <small className="text-muted extra-small">C.I. {cleanCedula(s.representante_cedula)}</small>
                                </td>
                                <td>
                                  {tieneTelValido ? (
                                    <span className="font-monospace text-dark fw-bold">
                                      <i className="bi bi-telephone text-success me-1"></i>{tel}
                                    </span>
                                  ) : (
                                    <span className="badge bg-danger-subtle text-danger extra-small">
                                      Sin teléfono válido
                                    </span>
                                  )}
                                </td>
                                <td className="text-center">
                                  {parsed.whatsapp_notificado ? (
                                    <span className="badge extra-small rounded-pill py-1 px-2 fw-bold" style={{ backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC' }}>
                                      <i className="bi bi-check-circle-fill me-1"></i> Enviado
                                    </span>
                                  ) : (
                                    <span className="badge extra-small rounded-pill py-1 px-2 fw-semibold" style={{ backgroundColor: '#F8FAFC', color: '#475569', border: '1px solid #CBD5E1' }}>
                                      <i className="bi bi-clock-history me-1"></i> Pendiente
                                    </span>
                                  )}
                                </td>
                                <td className="text-end pe-3">
                                  <div className="btn-group btn-group-sm">
                                    <button
                                      type="button"
                                      className={`btn btn-sm ${parsed.whatsapp_notificado ? 'btn-success text-white' : 'btn-outline-success'} fw-bold px-2.5 d-inline-flex align-items-center gap-1`}
                                      disabled={!tieneTelValido}
                                      onClick={() => {
                                        setAspiranteActivoDifusionIdx(idx);
                                        enviarWhatsAppIndividualDifusion(s);
                                      }}
                                      title="Enviar mensaje oficial por WhatsApp"
                                    >
                                      <i className="bi bi-whatsapp"></i>
                                      <span className="d-none d-sm-inline">Enviar</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-outline-secondary btn-sm"
                                      onClick={() => marcarEstadoWhatsAppDifusion(s.id, !parsed.whatsapp_notificado)}
                                      title={parsed.whatsapp_notificado ? 'Marcar como pendiente' : 'Marcar como enviado'}
                                    >
                                      <i className={`bi bi-${parsed.whatsapp_notificado ? 'arrow-counterclockwise' : 'check2'}`}></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="modal-footer bg-light py-2.5 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <small className="text-muted">
                    <i className="bi bi-shield-check text-success me-1"></i>
                    El mensaje orienta a los representantes a ingresar con su cédula para definir clave y descargar la Carta de Aceptación, Hoja de Resumen y Normas Internas.
                  </small>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm rounded-pill px-4 fw-bold"
                    onClick={() => setModalDifusionAbierto(false)}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* ── MODAL DE HABILITACIÓN MASIVA DE ACCESO SIGAE ─────────────────────────── */}
      {modalHabilitarMasivoAbierto && (() => {
        // Filtrar aspirantes aprobados o formalizados
        const aprobados = solicitudes.filter(s => s.estado === 'Aprobado' || s.estado === 'Formalizado');
        const filtradosMasivo = aprobados.filter(s => {
          if (filtroEscuelaHabilitarMasivo !== 'todas' && s.codigo_escuela !== filtroEscuelaHabilitarMasivo) return false;
          if (filtroGradoHabilitarMasivo !== 'todos' && s.grado_solicitado !== filtroGradoHabilitarMasivo) return false;
          const acc = verificarAccesoHabilitado(s, estudiantesMatriculaBD);
          if (filtroEstadoAccesoMasivo === 'pendientes' && acc.habilitado) return false;
          if (filtroEstadoAccesoMasivo === 'habilitados' && !acc.habilitado) return false;
          return true;
        });

        const totalAprob = aprobados.length;
        const totalYaHabilitados = aprobados.filter(s => verificarAccesoHabilitado(s, estudiantesMatriculaBD).habilitado).length;
        const totalPendientesAcc = totalAprob - totalYaHabilitados;

        const todosSeleccionados = filtradosMasivo.length > 0 && filtradosMasivo.every(s => seleccionadosHabilitarMasivo.has(s.id));

        const porcentajeAvance = progresoHabilitacionMasiva && progresoHabilitacionMasiva.total > 0
          ? Math.round((progresoHabilitacionMasiva.actual / progresoHabilitacionMasiva.total) * 100)
          : 0;

        const estaEnProgreso = procesandoHabilitacionMasiva || (progresoHabilitacionMasiva !== null);

        return createPortal(
          <div
            className="modal fade show d-flex align-items-center justify-content-center"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(6px)',
              zIndex: 1060,
              overflowY: 'auto',
              padding: '12px'
            }}
          >
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down my-auto mx-auto w-100" style={{ maxWidth: '1100px', maxHeight: '94vh' }}>
              <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden bg-white">
                {/* Header */}
                <div className="modal-header py-3 px-4 text-white d-flex align-items-center justify-content-between" style={{ backgroundColor: '#4F46E5' }}>
                  <div className="d-flex align-items-center gap-2.5">
                    <span className="p-2 bg-white bg-opacity-20 rounded-circle text-white d-flex align-items-center justify-content-center shadow-xs">
                      <i className="bi bi-people-fill fs-5"></i>
                    </span>
                    <div>
                      <h5 className="modal-title fw-bold mb-0" style={{ fontSize: '1.1rem' }}>
                        Habilitación Masiva de Acceso SIGAE
                      </h5>
                      <small className="opacity-90 extra-small">
                        {estaEnProgreso 
                          ? 'Ejecución en lote con verificación reactiva y vinculación de matrícula' 
                          : 'Selecciona múltiples aspirantes para dar de alta a sus representantes y vincular a los estudiantes'}
                      </small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => {
                      if (!procesandoHabilitacionMasiva) {
                        setModalHabilitarMasivoAbierto(false);
                        setProgresoHabilitacionMasiva(null);
                      }
                    }}
                    disabled={procesandoHabilitacionMasiva}
                  ></button>
                </div>

                {/* Body */}
                <div className="modal-body p-3 p-md-4" style={{ fontSize: '13.5px' }}>
                  {/* SI ESTÁ PROCESANDO O COMPLETADO: MOSTRAR PANEL CENTRAL DE PORCENTAJE DE AVANCE */}
                  {estaEnProgreso && progresoHabilitacionMasiva ? (
                    <div className="py-4 px-3 px-md-5 text-center animate__animated animate__fadeIn">
                      {/* Icono de Estado */}
                      <div className="mb-3">
                        {progresoHabilitacionMasiva.completado ? (
                          <div className="d-inline-flex p-3 rounded-circle shadow-sm" style={{ backgroundColor: '#DCFCE7' }}>
                            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
                          </div>
                        ) : (
                          <div className="d-inline-flex p-3 rounded-circle shadow-sm" style={{ backgroundColor: '#EEF2FF' }}>
                            <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem', borderWidth: '4px' }} role="status"></div>
                          </div>
                        )}
                      </div>

                      {/* Porcentaje Numérico Destacado */}
                      <div className="mb-2">
                        <span 
                          className="fw-bolder" 
                          style={{ 
                            fontSize: '3.5rem', 
                            lineHeight: '1',
                            color: progresoHabilitacionMasiva.completado ? '#10B981' : '#4F46E5',
                            letterSpacing: '-1.5px'
                          }}
                        >
                          {porcentajeAvance}%
                        </span>
                        <span className="text-muted fs-6 d-block mt-1 fw-bold text-uppercase">
                          {progresoHabilitacionMasiva.completado ? '¡Completado al 100%!' : 'Porcentaje de Avance'}
                        </span>
                      </div>

                      {/* Barra de Porcentajes de Avance */}
                      <div className="my-3 mx-auto" style={{ maxWidth: '650px' }}>
                        <div className="progress rounded-pill shadow-inner" style={{ height: '26px', backgroundColor: '#E2E8F0', padding: '3px' }}>
                          <div
                            className="progress-bar progress-bar-striped progress-bar-animated rounded-pill fw-bold text-white d-flex align-items-center justify-content-center shadow-sm"
                            role="progressbar"
                            style={{
                              width: `${porcentajeAvance}%`,
                              backgroundColor: progresoHabilitacionMasiva.completado ? '#10B981' : '#4F46E5',
                              fontSize: '12px',
                              transition: 'width 0.25s ease'
                            }}
                          >
                            {porcentajeAvance > 8 ? `${porcentajeAvance}%` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Información del Aspirante en Proceso */}
                      <div className="p-3 bg-light border rounded-4 mb-4 mx-auto text-start shadow-2xs" style={{ maxWidth: '650px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-1">
                          <small className="text-muted fw-bold text-uppercase extra-small">
                            {progresoHabilitacionMasiva.completado ? 'Resumen Final' : 'Aspirante en Proceso'}
                          </small>
                          <span className="badge bg-primary rounded-pill px-2.5 py-1 extra-small fw-bold">
                            {progresoHabilitacionMasiva.actual} de {progresoHabilitacionMasiva.total} Estudiantes
                          </span>
                        </div>
                        <h6 className="fw-bold text-dark mb-1 d-flex align-items-center gap-1.5">
                          <i className="bi bi-person-badge text-primary"></i>
                          <span>{progresoHabilitacionMasiva.nombreEstudiante}</span>
                        </h6>
                        <small className="text-muted d-block">
                          {progresoHabilitacionMasiva.completado
                            ? 'Todos los aspirantes fueron validados y sincronizados en la base de datos de SIGAE.'
                            : 'Verificando cédula en usuarios, aplicando rol representante sin clave previa y vinculando matrícula...'}
                        </small>
                      </div>

                      {/* Métricas en Vivo */}
                      <div className="row g-2 justify-content-center mx-auto mb-4" style={{ maxWidth: '650px' }}>
                        <div className="col-6 col-sm-4">
                          <div className="p-2.5 rounded-3 border text-center" style={{ backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }}>
                            <small className="extra-small fw-bold text-uppercase d-block" style={{ color: '#7E22CE' }}>Nuevos Usuarios</small>
                            <strong className="fs-5" style={{ color: '#6B21A8' }}>{progresoHabilitacionMasiva.creadosNuevos}</strong>
                          </div>
                        </div>
                        <div className="col-6 col-sm-4">
                          <div className="p-2.5 rounded-3 border text-center" style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}>
                            <small className="extra-small fw-bold text-uppercase d-block text-primary">Existentes Vinculados</small>
                            <strong className="fs-5 text-primary">{progresoHabilitacionMasiva.vinculadosExistentes}</strong>
                          </div>
                        </div>
                        <div className="col-12 col-sm-4">
                          <div className="p-2.5 rounded-3 border text-center" style={{ backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }}>
                            <small className="extra-small fw-bold text-uppercase d-block" style={{ color: '#92400E' }}>Constancias Bloqueadas</small>
                            <strong className="fs-5" style={{ color: '#B45309' }}>{progresoHabilitacionMasiva.actual}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Botón de Finalización cuando está al 100% */}
                      {progresoHabilitacionMasiva.completado && (
                        <div className="mt-3">
                          <button
                            type="button"
                            className="btn btn-success btn-lg rounded-pill px-5 py-2.5 fw-bold shadow-sm d-inline-flex align-items-center gap-2 hover-efecto"
                            onClick={() => {
                              setModalHabilitarMasivoAbierto(false);
                              setProgresoHabilitacionMasiva(null);
                              setSeleccionadosHabilitarMasivo(new Set());
                            }}
                          >
                            <i className="bi bi-check-lg fs-5"></i>
                            <span>Aceptar y Ver Resultados en la Tabla</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* SI NO ESTÁ PROCESANDO: MOSTRAR FILTROS Y TABLA DE SELECCIÓN */
                    <>
                      {/* Resumen métrico */}
                      <div className="row g-2 mb-3">
                        <div className="col-6 col-md-4">
                          <div className="p-2.5 rounded-3 border bg-light text-center">
                            <small className="text-muted extra-small fw-bold text-uppercase d-block">Aprobados Totales</small>
                            <strong className="fs-5 text-dark">{totalAprob}</strong>
                          </div>
                        </div>
                        <div className="col-6 col-md-4">
                          <div className="p-2.5 rounded-3 border text-center" style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }}>
                            <small className="extra-small fw-bold text-uppercase d-block text-success">Acceso Ya Habilitado</small>
                            <strong className="fs-5 text-success">{totalYaHabilitados}</strong>
                          </div>
                        </div>
                        <div className="col-12 col-md-4">
                          <div className="p-2.5 rounded-3 border text-center" style={{ backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }}>
                            <small className="extra-small fw-bold text-uppercase d-block text-primary">Pendientes por Habilitar</small>
                            <strong className="fs-5 text-primary">{totalPendientesAcc}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Barra de Filtros y Acciones Rápidas */}
                      <div className="p-2.5 bg-light border rounded-3 mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2 flex-wrap flex-grow-1">
                          <div className="d-flex align-items-center gap-1">
                            <span className="extra-small fw-bold text-secondary">Escuela:</span>
                            <select
                              className="form-select form-select-sm"
                              style={{ width: '150px' }}
                              value={filtroEscuelaHabilitarMasivo}
                              onChange={e => setFiltroEscuelaHabilitarMasivo(e.target.value)}
                              disabled={esSedeFija}
                            >
                              {!esSedeFija && <option value="todas">Todas</option>}
                              {(!esSedeFija || escuelaUsuarioAsignada === 'sb') && <option value="sb">Santa Bárbara</option>}
                              {(!esSedeFija || escuelaUsuarioAsignada === 'lb') && <option value="lb">Libertador B.</option>}
                            </select>
                          </div>

                          <div className="d-flex align-items-center gap-1">
                            <span className="extra-small fw-bold text-secondary">Grado:</span>
                            <select
                              className="form-select form-select-sm"
                              style={{ width: '160px' }}
                              value={filtroGradoHabilitarMasivo}
                              onChange={e => setFiltroGradoHabilitarMasivo(e.target.value)}
                            >
                              <option value="todos">Todos los Grados</option>
                              {opcionesGradoEnriquecidos.map(g => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </select>
                          </div>

                          <div className="d-flex align-items-center gap-1">
                            <span className="extra-small fw-bold text-secondary">Mostrar:</span>
                            <select
                              className="form-select form-select-sm"
                              style={{ width: '170px' }}
                              value={filtroEstadoAccesoMasivo}
                              onChange={e => setFiltroEstadoAccesoMasivo(e.target.value as any)}
                            >
                              <option value="pendientes">Solo Pendientes ({totalPendientesAcc})</option>
                              <option value="habilitados">Ya Habilitados ({totalYaHabilitados})</option>
                              <option value="todos">Todos ({totalAprob})</option>
                            </select>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            className="btn btn-xs btn-white bg-white border fw-bold rounded-pill px-2.5 py-1 extra-small"
                            onClick={() => {
                              const ids = new Set<string | number>(seleccionadosHabilitarMasivo);
                              filtradosMasivo.forEach(s => { if (s.id) ids.add(s.id); });
                              setSeleccionadosHabilitarMasivo(ids);
                            }}
                          >
                            <i className="bi bi-check2-all me-1 text-primary"></i>
                            Seleccionar Filtrados ({filtradosMasivo.length})
                          </button>

                          <button
                            type="button"
                            className="btn btn-xs btn-white bg-white border fw-bold rounded-pill px-2.5 py-1 extra-small text-danger"
                            onClick={() => setSeleccionadosHabilitarMasivo(new Set())}
                          >
                            Desmarcar
                          </button>
                        </div>
                      </div>

                      {/* Tabla de Aspirantes con Checkboxes */}
                      <div className="card border rounded-3 overflow-hidden">
                        <div className="card-header bg-light py-2 px-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-1">
                          <span className="fw-bold small text-dark d-flex align-items-center gap-1.5">
                            <i className="bi bi-list-check text-primary"></i>
                            <span>Aspirantes Disponibles ({filtradosMasivo.length})</span>
                          </span>
                          <span className="badge bg-primary text-white rounded-pill px-2.5 py-1 extra-small fw-bold">
                            {seleccionadosHabilitarMasivo.size} seleccionado(s)
                          </span>
                        </div>

                        <div className="table-responsive" style={{ maxHeight: '360px' }}>
                          <table className="table table-hover align-middle mb-0" style={{ fontSize: '12.5px' }}>
                            <thead className="table-light extra-small text-uppercase">
                              <tr>
                                <th className="ps-3" style={{ width: '40px' }}>
                                  <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={todosSeleccionados}
                                    onChange={() => {
                                      if (todosSeleccionados) {
                                        setSeleccionadosHabilitarMasivo(new Set());
                                      } else {
                                        const next = new Set<string | number>(seleccionadosHabilitarMasivo);
                                        filtradosMasivo.forEach(s => { if (s.id) next.add(s.id); });
                                        setSeleccionadosHabilitarMasivo(next);
                                      }
                                    }}
                                  />
                                </th>
                                <th>Aspirante / Cédula</th>
                                <th>Grado</th>
                                <th>Escuela</th>
                                <th>Representante / Cédula</th>
                                <th>Teléfono</th>
                                <th className="text-center pe-3">Estado Acceso</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filtradosMasivo.map(s => {
                                const acc = verificarAccesoHabilitado(s, estudiantesMatriculaBD);
                                const seleccionado = seleccionadosHabilitarMasivo.has(s.id);

                                return (
                                  <tr
                                    key={s.id || s.codigo_unico}
                                    className={seleccionado ? 'table-primary bg-opacity-10' : ''}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => toggleSeleccionHabilitarMasivo(s.id)}
                                  >
                                    <td className="ps-3" onClick={e => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={seleccionado}
                                        onChange={() => toggleSeleccionHabilitarMasivo(s.id)}
                                      />
                                    </td>
                                    <td>
                                      <strong className="d-block text-dark">{nombreCompleto(s.estudiante_nombres, s.estudiante_apellidos)}</strong>
                                      <small className="text-muted extra-small">C.I: {s.estudiante_cedula || `T-${s.codigo_unico}`}</small>
                                    </td>
                                    <td>
                                      <span className="badge bg-light text-dark border extra-small">{s.grado_solicitado}</span>
                                    </td>
                                    <td>
                                      <span className={`badge ${s.codigo_escuela === 'sb' ? 'bg-primary' : 'bg-success'} text-white extra-small`}>
                                        {s.codigo_escuela?.toUpperCase()}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="text-dark">{nombreCompleto(s.representante_nombres, s.representante_apellidos)}</div>
                                      <small className="text-muted extra-small">C.I. {cleanCedula(s.representante_cedula)}</small>
                                    </td>
                                    <td>
                                      <small className="font-monospace text-dark">{s.representante_telefono || 'N/A'}</small>
                                    </td>
                                    <td className="text-center pe-3">
                                      {acc.habilitado ? (
                                        <span
                                          className="badge extra-small rounded-pill py-1 px-2.5 fw-bold d-inline-flex align-items-center gap-1"
                                          style={{ backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC' }}
                                        >
                                          <i className="bi bi-check-circle-fill"></i> Habilitado
                                        </span>
                                      ) : (
                                        <span
                                          className="badge extra-small rounded-pill py-1 px-2.5 fw-semibold d-inline-flex align-items-center gap-1"
                                          style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}
                                        >
                                          <i className="bi bi-clock-history"></i> Pendiente
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                {!estaEnProgreso && (
                  <div className="modal-footer bg-light py-2.5 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="small text-muted fw-bold">
                        {seleccionadosHabilitarMasivo.size} aspirante(s) seleccionado(s).
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm rounded-pill px-3"
                        onClick={() => {
                          setModalHabilitarMasivoAbierto(false);
                          setProgresoHabilitacionMasiva(null);
                        }}
                      >
                        Cerrar
                      </button>

                      <button
                        type="button"
                        className="btn btn-primary btn-sm rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-1.5 text-white"
                        style={{ backgroundColor: '#4F46E5', borderColor: '#4338CA' }}
                        onClick={ejecutarHabilitacionMasiva}
                        disabled={seleccionadosHabilitarMasivo.size === 0}
                      >
                        <i className="bi bi-person-check-fill"></i>
                        <span>Habilitar Accesos ({seleccionadosHabilitarMasivo.size})</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* ── MODAL: REGISTRAR ADMISIÓN DIRECTA / EXTEMPORÁNEA ──────────────── */}
      {modalRegistroDirectoAbierto && createPortal(
        <div
          className="modal fade show d-flex align-items-center justify-content-center"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.82)',
            backdropFilter: 'blur(6px)',
            zIndex: 1060,
            overflowY: 'auto',
            padding: '16px'
          }}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable my-auto mx-auto w-100" style={{ maxWidth: '980px', maxHeight: '92vh' }}>
            <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
              
              {/* Header */}
              <div className="modal-header py-3 px-4 text-white position-relative" style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle bg-white text-primary p-2.5 d-flex align-items-center justify-content-center shadow-xs" style={{ width: '44px', height: '44px' }}>
                    <i className="bi bi-person-plus-fill fs-4" style={{ color: '#0284C7' }}></i>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold mb-0 text-white">Registrar Admisión Directa / Extemporánea</h5>
                    <small className="text-white-50" style={{ fontSize: '0.82rem' }}>
                      Inscripción y admisión oficial de nuevos aspirantes y representantes sin requerir solicitud web previa
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => !guardandoRegistroDirecto && setModalRegistroDirectoAbierto(false)}
                  disabled={guardandoRegistroDirecto}
                ></button>
              </div>

              {/* Body */}
              <div className="modal-body p-4 bg-light" style={{ fontSize: '13.5px' }}>
                
                {/* Banner Informativo */}
                <div className="alert alert-primary bg-white border-primary-subtle shadow-xs rounded-3 p-3 mb-3 d-flex align-items-start gap-2.5">
                  <i className="bi bi-info-circle-fill fs-5 text-primary mt-0.5"></i>
                  <div className="small">
                    <strong className="text-primary d-block mb-0.5">Flujo Unificado de Admisión Directa</strong>
                    <span className="text-muted">
                      Este formulario genera automáticamente el <b>Código Único de Admisión</b> oficial, habilita la cuenta de acceso al sistema para el representante legal (con rol Representante y primer ingreso activo), y si selecciona <b>Formalizado</b>, inscribe al estudiante en la matrícula escolar actualizando de inmediato la capacidad de salones y cupos.
                    </span>
                  </div>
                </div>

                <div className="row g-3">
                  
                  {/* SECCIÓN 1: DATOS DEL REPRESENTANTE LEGAL */}
                  <div className="col-12 col-lg-6">
                    <div className="card h-100 border-0 shadow-xs rounded-3 bg-white overflow-hidden">
                      <div className="card-header bg-white py-2.5 px-3 border-bottom d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge rounded-circle p-1.5 text-white" style={{ backgroundColor: '#0284C7' }}>
                            <i className="bi bi-person-badge-fill fs-6"></i>
                          </span>
                          <strong className="text-dark small">1. Representante Legal</strong>
                        </div>
                        {repDirectoExistente?.existe && (
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1">
                            <i className="bi bi-check-circle-fill me-1"></i> Registrado en SIGAE
                          </span>
                        )}
                      </div>

                      <div className="card-body p-3">
                        {/* Cédula y Búsqueda */}
                        <div className="mb-2.5">
                          <label className="form-label fw-bold small text-secondary mb-1">
                            Cédula de Identidad <span className="text-danger">*</span>
                          </label>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text bg-light text-muted">V / E</span>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Ej: 12345678"
                              value={formRegistroDirecto.representante_cedula}
                              onChange={e => {
                                const val = e.target.value;
                                setFormRegistroDirecto(prev => ({ ...prev, representante_cedula: val }));
                              }}
                              onBlur={() => buscarRepresentanteDirecto(formRegistroDirecto.representante_cedula)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  buscarRepresentanteDirecto(formRegistroDirecto.representante_cedula);
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-outline-primary fw-bold"
                              onClick={() => buscarRepresentanteDirecto(formRegistroDirecto.representante_cedula)}
                              disabled={buscandoRepDirecto || !formRegistroDirecto.representante_cedula.trim()}
                            >
                              {buscandoRepDirecto ? (
                                <span className="spinner-border spinner-border-sm"></span>
                              ) : (
                                <><i className="bi bi-search me-1"></i> Buscar</>
                              )}
                            </button>
                          </div>
                          
                          {/* Alerta de detección */}
                          {repDirectoExistente && (
                            <div className="mt-1.5">
                              {repDirectoExistente.existe ? (
                                <div className="alert alert-success py-1.5 px-2.5 mb-0 rounded-2 extra-small d-flex align-items-center gap-1.5">
                                  <i className="bi bi-person-check-fill text-success"></i>
                                  <span>
                                    Usuario activo: <b>{repDirectoExistente.nombre_completo}</b> (Rol: {repDirectoExistente.rol}). Datos autocompletados.
                                  </span>
                                </div>
                              ) : (
                                <div className="alert alert-info py-1.5 px-2.5 mb-0 rounded-2 extra-small d-flex align-items-center gap-1.5">
                                  <i className="bi bi-magic text-primary"></i>
                                  <span>Nuevo representante. Se creará su cuenta oficial en SIGAE.</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Nombres y Apellidos */}
                        <div className="row g-2 mb-2.5">
                          <div className="col-6">
                            <label className="form-label fw-bold small text-secondary mb-1">
                              Nombres <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Nombres"
                              value={formRegistroDirecto.representante_nombres}
                              onChange={e => setFormRegistroDirecto(prev => ({ ...prev, representante_nombres: e.target.value }))}
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label fw-bold small text-secondary mb-1">
                              Apellidos <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Apellidos"
                              value={formRegistroDirecto.representante_apellidos}
                              onChange={e => setFormRegistroDirecto(prev => ({ ...prev, representante_apellidos: e.target.value }))}
                            />
                          </div>
                        </div>

                        {/* Teléfono y Correo */}
                        <div className="row g-2 mb-2.5">
                          <div className="col-6">
                            <label className="form-label fw-bold small text-secondary mb-1">Teléfono (WhatsApp)</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Ej: 0414-1234567"
                              value={formRegistroDirecto.representante_telefono}
                              onChange={e => setFormRegistroDirecto(prev => ({ ...prev, representante_telefono: e.target.value }))}
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label fw-bold small text-secondary mb-1">Correo Electrónico</label>
                            <input
                              type="email"
                              className="form-control form-control-sm"
                              placeholder="correo@ejemplo.com"
                              value={formRegistroDirecto.representante_email}
                              onChange={e => setFormRegistroDirecto(prev => ({ ...prev, representante_email: e.target.value }))}
                            />
                          </div>
                        </div>

                        {/* Parentesco */}
                        <div className="mb-2.5">
                          <label className="form-label fw-bold small text-secondary mb-1">
                            Parentesco con el Estudiante <span className="text-danger">*</span>
                          </label>
                          <select
                            className="form-select form-select-sm"
                            value={formRegistroDirecto.parentesco}
                            onChange={e => setFormRegistroDirecto(prev => ({ ...prev, parentesco: e.target.value }))}
                          >
                            {opcionesParentescoEnriquecidas.map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>

                        {/* Filiación PDVSA */}
                        <div className="p-2.5 rounded-3 bg-light border mt-3">
                          <div className="form-check form-switch mb-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              id="checkTrabajaPdvsaDirecto"
                              checked={formRegistroDirecto.trabaja_pdvsa}
                              onChange={e => setFormRegistroDirecto(prev => ({ ...prev, trabaja_pdvsa: e.target.checked }))}
                            />
                            <label className="form-check-label fw-bold small text-dark" htmlFor="checkTrabajaPdvsaDirecto">
                              ¿Trabajador PDVSA / Filial petrolera?
                            </label>
                          </div>

                          {formRegistroDirecto.trabaja_pdvsa && (
                            <div className="row g-2 mt-1">
                              <div className="col-6">
                                <label className="form-label fw-bold extra-small text-secondary mb-1">Condición Laboral</label>
                                <select
                                  className="form-select form-select-sm"
                                  value={formRegistroDirecto.pdvsa_condicion_laboral}
                                  onChange={e => setFormRegistroDirecto(prev => ({ ...prev, pdvsa_condicion_laboral: e.target.value }))}
                                >
                                  <option value="">Seleccione...</option>
                                  {opcionesCondicionEnriquecidas.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-6">
                                <label className="form-label fw-bold extra-small text-secondary mb-1">Tipo de Nómina</label>
                                <select
                                  className="form-select form-select-sm"
                                  value={formRegistroDirecto.pdvsa_tipo_nomina}
                                  onChange={e => setFormRegistroDirecto(prev => ({ ...prev, pdvsa_tipo_nomina: e.target.value }))}
                                >
                                  <option value="">Seleccione...</option>
                                  {opcionesNominaEnriquecidas.map(n => (
                                    <option key={n} value={n}>{n}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 2: DATOS DEL ESTUDIANTE ASPIRANTE */}
                  <div className="col-12 col-lg-6">
                    <div className="card h-100 border-0 shadow-xs rounded-3 bg-white overflow-hidden">
                      <div className="card-header bg-white py-2.5 px-3 border-bottom d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge rounded-circle p-1.5 text-white" style={{ backgroundColor: '#10B981' }}>
                            <i className="bi bi-mortarboard-fill fs-6"></i>
                          </span>
                          <strong className="text-dark small">2. Estudiante Aspirante</strong>
                        </div>
                        <span className="badge bg-light text-secondary border">Nuevo Ingreso</span>
                      </div>

                      <div className="card-body p-3">
                        {/* Cédula de Estudiante o Escolar */}
                        <div className="mb-2.5">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <label className="form-label fw-bold small text-secondary mb-0">Cédula de Identidad / Escolar</label>
                            <div className="form-check extra-small mb-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id="checkSinCedulaDirecto"
                                checked={sinCedulaEstudianteDirecto}
                                onChange={e => {
                                  setSinCedulaEstudianteDirecto(e.target.checked);
                                  if (e.target.checked) {
                                    setFormRegistroDirecto(prev => ({ ...prev, estudiante_cedula: '' }));
                                  }
                                }}
                              />
                              <label className="form-check-label text-muted" htmlFor="checkSinCedulaDirecto">
                                Sin cédula (Generar Cédula Escolar)
                              </label>
                            </div>
                          </div>

                          {sinCedulaEstudianteDirecto ? (
                            <div className="py-2 px-3 bg-light rounded border text-muted small d-flex align-items-center gap-2">
                              <i className="bi bi-magic text-success"></i>
                              <span>Se asignará automáticamente la Cédula Escolar oficial (ej. <b>ESC-{(formRegistroDirecto.codigo_escuela || 'sb').toUpperCase()}{new Date().getFullYear().toString().slice(-2)}-...</b>)</span>
                            </div>
                          ) : (
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Ej: V-34567890 o Cédula Escolar previa"
                              value={formRegistroDirecto.estudiante_cedula}
                              onChange={e => setFormRegistroDirecto(prev => ({ ...prev, estudiante_cedula: e.target.value }))}
                            />
                          )}
                        </div>

                        {/* Nombres y Apellidos */}
                        <div className="row g-2 mb-2.5">
                          <div className="col-6">
                            <label className="form-label fw-bold small text-secondary mb-1">
                              Nombres <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Nombres"
                              value={formRegistroDirecto.estudiante_nombres}
                              onChange={e => setFormRegistroDirecto(prev => ({ ...prev, estudiante_nombres: e.target.value }))}
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label fw-bold small text-secondary mb-1">
                              Apellidos <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Apellidos"
                              value={formRegistroDirecto.estudiante_apellidos}
                              onChange={e => setFormRegistroDirecto(prev => ({ ...prev, estudiante_apellidos: e.target.value }))}
                            />
                          </div>
                        </div>

                        {/* Sexo y Fecha de Nacimiento */}
                        <div className="row g-2 mb-2.5">
                          <div className="col-6">
                            <label className="form-label fw-bold small text-secondary mb-1">Sexo</label>
                            <select
                              className="form-select form-select-sm"
                              value={formRegistroDirecto.estudiante_sexo}
                              onChange={e => setFormRegistroDirecto(prev => ({ ...prev, estudiante_sexo: e.target.value }))}
                            >
                              <option value="M">Masculino</option>
                              <option value="F">Femenino</option>
                            </select>
                          </div>
                          <div className="col-6">
                            <label className="form-label fw-bold small text-secondary mb-1">Fecha de Nacimiento</label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={formRegistroDirecto.estudiante_fecha_nacimiento}
                              onChange={e => setFormRegistroDirecto(prev => ({ ...prev, estudiante_fecha_nacimiento: e.target.value }))}
                            />
                          </div>
                        </div>

                        {/* Plantel / Escuela y Grado */}
                        <div className="row g-2 mb-2.5">
                          <div className="col-5">
                            <label className="form-label fw-bold small text-secondary mb-1">Plantel</label>
                            <select
                              className="form-select form-select-sm fw-bold"
                              value={formRegistroDirecto.codigo_escuela}
                              onChange={e => {
                                const esc = e.target.value;
                                setFormRegistroDirecto(prev => ({
                                  ...prev,
                                  codigo_escuela: esc,
                                  grado_solicitado: esc === 'lb' ? '1er Año' : '1er Grado',
                                  seccion: 'Sin Asignar'
                                }));
                              }}
                            >
                              <option value="sb">U.E. Santa Bárbara</option>
                              <option value="lb">U.E. Libertador Bolívar</option>
                            </select>
                          </div>
                          <div className="col-7">
                            <label className="form-label fw-bold small text-secondary mb-1">
                              Grado / Año a Cursar <span className="text-danger">*</span>
                            </label>
                            <select
                              className="form-select form-select-sm"
                              value={formRegistroDirecto.grado_solicitado}
                              onChange={e => setFormRegistroDirecto(prev => ({ ...prev, grado_solicitado: e.target.value, seccion: 'Sin Asignar' }))}
                            >
                              {gradosDisponiblesDirecto.map(g => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Sección Asignada y Procedencia */}
                        <div className="row g-2 mb-1">
                          <div className="col-5">
                            <label className="form-label fw-bold small text-secondary mb-1">Sección Asignada</label>
                            <select
                              className="form-select form-select-sm"
                              value={formRegistroDirecto.seccion || 'Sin Asignar'}
                              onChange={e => setFormRegistroDirecto(prev => ({ ...prev, seccion: e.target.value }))}
                            >
                              <option value="Sin Asignar">Sin Asignar</option>
                              {seccionesDisponiblesDirecto.length > 0 ? (
                                seccionesDisponiblesDirecto.map(sec => (
                                  <option key={sec} value={sec}>
                                    {sec === 'U' ? 'Sección "U" (Única)' : `Sección "${sec}"`}
                                  </option>
                                ))
                              ) : (
                                ['A', 'B', 'C'].map(sec => (
                                  <option key={sec} value={sec}>Sección "{sec}"</option>
                                ))
                              )}
                            </select>
                          </div>
                          <div className="col-7">
                            <label className="form-label fw-bold small text-secondary mb-1">Plantel de Procedencia</label>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Ej: U.E. San José (Opcional)"
                              value={formRegistroDirecto.plantel_procedencia}
                              onChange={e => setFormRegistroDirecto(prev => ({ ...prev, plantel_procedencia: e.target.value }))}
                            />
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN 3: MODALIDAD DE INGRESO Y OBSERVACIONES */}
                  <div className="col-12">
                    <div className="card border-0 shadow-xs rounded-3 bg-white p-3">
                      <div className="row g-3 align-items-center">
                        <div className="col-12 col-md-6">
                          <label className="form-label fw-bold small text-secondary mb-1.5 d-block">
                            3. Estado de Admisión Inicial <span className="text-danger">*</span>
                          </label>
                          <div className="d-flex gap-2">
                            <div
                              className={`flex-fill p-2.5 rounded-3 border transition-all ${formRegistroDirecto.estado_ingreso === 'Formalizado' ? 'border-success bg-success-subtle' : 'bg-light'}`}
                              onClick={() => setFormRegistroDirecto(prev => ({ ...prev, estado_ingreso: 'Formalizado' }))}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <input
                                  type="radio"
                                  name="estadoIngresoDirecto"
                                  id="radioFormalizado"
                                  className="form-check-input mt-0"
                                  checked={formRegistroDirecto.estado_ingreso === 'Formalizado'}
                                  onChange={() => setFormRegistroDirecto(prev => ({ ...prev, estado_ingreso: 'Formalizado' }))}
                                />
                                <label htmlFor="radioFormalizado" className="fw-bold small text-dark mb-0 cursor-pointer">
                                  Formalización Inmediata
                                </label>
                                <span className="badge bg-success rounded-pill extra-small">Recomendado</span>
                              </div>
                              <p className="extra-small text-muted mb-0 ps-4">
                                Matricula al estudiante de inmediato en el salón y vincula al representante.
                              </p>
                            </div>

                            <div
                              className={`flex-fill p-2.5 rounded-3 border transition-all ${formRegistroDirecto.estado_ingreso === 'Aprobado' ? 'border-primary bg-primary-subtle' : 'bg-light'}`}
                              onClick={() => setFormRegistroDirecto(prev => ({ ...prev, estado_ingreso: 'Aprobado' }))}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <input
                                  type="radio"
                                  name="estadoIngresoDirecto"
                                  id="radioAprobado"
                                  className="form-check-input mt-0"
                                  checked={formRegistroDirecto.estado_ingreso === 'Aprobado'}
                                  onChange={() => setFormRegistroDirecto(prev => ({ ...prev, estado_ingreso: 'Aprobado' }))}
                                />
                                <label htmlFor="radioAprobado" className="fw-bold small text-dark mb-0 cursor-pointer">
                                  Aprobado para Taquilla
                                </label>
                              </div>
                              <p className="extra-small text-muted mb-0 ps-4">
                                Se genera cupo aprobado; formalizará en taquilla presencial.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="col-12 col-md-6">
                          <label className="form-label fw-bold small text-secondary mb-1">
                            Observaciones Administrativas
                          </label>
                          <textarea
                            className="form-control form-control-sm"
                            rows={2}
                            placeholder="Motivo de ingreso extemporáneo, número de memorando, etc. (Opcional)"
                            value={formRegistroDirecto.observaciones}
                            onChange={e => setFormRegistroDirecto(prev => ({ ...prev, observaciones: e.target.value }))}
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* Footer */}
              <div className="modal-footer bg-light py-2.5 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                <span className="small text-muted">
                  <i className="bi bi-shield-check text-success me-1"></i>
                  La acción quedará registrada en el módulo de auditoría SIGAE.
                </span>

                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm rounded-pill px-3"
                    onClick={() => setModalRegistroDirectoAbierto(false)}
                    disabled={guardandoRegistroDirecto}
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm rounded-pill px-4 fw-bold shadow-sm d-flex align-items-center gap-1.5 text-white"
                    style={{ backgroundColor: '#0284C7', borderColor: '#0369A1' }}
                    onClick={handleGuardarRegistroDirecto}
                    disabled={guardandoRegistroDirecto}
                  >
                    {guardandoRegistroDirecto ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Registrando e Inscribiendo...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle-fill"></i>
                        <span>Registrar Admisión</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default GestionAdmisiones;
