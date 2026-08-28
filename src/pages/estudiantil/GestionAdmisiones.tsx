import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
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

    const matchWA = obs.match(/\[WhatsApp:\s*([^|\]]+)(?:\|\s*Fecha:\s*([^|\]]+))?(?:\|\s*Estado:\s*([^|\]]+))?\]/i);
    if (matchWA) {
      whatsapp_notificado = matchWA[1].trim().toLowerCase() === 'enviado' || matchWA[1].trim().toLowerCase() === 'si' || matchWA[1].trim().toLowerCase() === 'sí';
      whatsapp_fecha = matchWA[2]?.trim() || null;
      whatsapp_estado = matchWA[3]?.trim() || null;
      textoLimpio = textoLimpio.replace(matchWA[0], '').trim();
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
    textoLimpio
  };
};

export const estructurarObservaciones = (
  textoBase: string,
  aptitud: string,
  esJerarquica: boolean,
  quienInstruye?: string,
  prioridad?: number,
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
  const { tienePermiso, loading: permLoading } = usePermisos();
  const navigate = useNavigate();
  const hasAccess = tienePermiso('Gestión de Admisiones', 'ver');

  const [solicitudes, setSolicitudes] = useState<SolicitudAdmision[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudAdmision | null>(null);
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [guardandoEstado, setGuardandoEstado] = useState<boolean>(false);

  // ── PERSONAL / DOCENTES DE LAS ESCUELAS (CARGADOS DE GESTIÓN DOCENTE) ───────────
  const [personalEscuelaMap, setPersonalEscuelaMap] = useState<Map<string, UsuarioPersonal>>(new Map());

  // ── MODO DE VISTAS ─────────────────────────────────────────────────────────────
  const [vistaActiva, setVistaActiva] = useState<'tabla' | 'uno_a_uno' | 'formalizacion'>('tabla');
  const [indiceUnoAUno, setIndiceUnoAUno] = useState<number>(0);

  // ── MODO EDICIÓN EN UNO POR UNO ────────────────────────────────────────────────
  const [modoEdicionUnoAUno, setModoEdicionUnoAUno] = useState<boolean>(false);
  const [formEdicion, setFormEdicion] = useState<Partial<SolicitudAdmision>>({});
  const [guardandoEdicion, setGuardandoEdicion] = useState<boolean>(false);

  // ── FORMALIZACIÓN DE INSCRIPCIÓN FÍSICA ────────────────────────────────────────
  const [solicitudParaFormalizar, setSolicitudParaFormalizar] = useState<SolicitudAdmision | null>(null);
  const [modalFormalizarAbierto, setModalFormalizarAbierto] = useState<boolean>(false);
  const [seccionFormalizacion, setSeccionFormalizacion] = useState<string>('A');
  const [recaudosVerificados, setRecaudosVerificados] = useState<{ [key: string]: boolean }>({
    partida_nacimiento: true,
    cedula_estudiante: true,
    cedula_representante: true,
    fotos_carnet: true,
    constancia_trabajo: true,
    boleta_promocion: true,
  });
  const [procesandoFormalizacion, setProcesandoFormalizacion] = useState<boolean>(false);

  // ── MODAL CONSTANCIA / RESUMEN IMPRIMIBLE ──────────────────────────────────────
  const [solicitudConstancia, setSolicitudConstancia] = useState<SolicitudAdmision | null>(null);
  const [modalConstanciaAbierto, setModalConstanciaAbierto] = useState<boolean>(false);

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
  const [filtroEscuela, setFiltroEscuela] = useState<string>('todas');
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

  // ── BLOQUEO DE SCROLL EN FONDO CUANDO HAY UN MODAL ABIERTO ─────────────────────
  const algunModalAbierto = Boolean(
    modalMatrizCapacidadAbierto ||
    modalFormalizarAbierto ||
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
      const [gradosRes, nominasRes, condRes, localidadesRes] = await Promise.all([
        supabase.from('conf_grados').select('valor').order('orden', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Nómina').order('valor', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Condición').order('valor', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Localidad').order('valor', { ascending: true }),
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

      // Cargar estudiantes vinculados con paginación
      let todosEst: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: estData, error: estErr } = await supabase
          .from('estudiantes_vinculaciones')
          .select('id, cedula_estudiante, grado_actual, seccion_actual, codigo_escuela, estado')
          .eq('estado', 'Activo')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (estErr) {
          console.warn('Error al cargar matrícula para cálculo de cupos:', estErr);
          hasMore = false;
        } else if (estData && estData.length > 0) {
          todosEst = [...todosEst, ...estData];
          if (estData.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

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

    if (filtroGrado === 'todos') {
      // Cálculo consolidado de la escuela seleccionada o ambas escuelas
      const solEscuela = solicitudes.filter(s => {
        if (escuelaActual === 'todas') return true;
        return (s.codigo_escuela || '').toLowerCase() === escuelaActual.toLowerCase();
      });

      const solAprobadas = solEscuela.filter(s => s.estado === 'Aprobado' || s.estado === 'Formalizado').length;
      const solPendientes = solEscuela.filter(s => s.estado === 'Pendiente' || s.estado === 'En Evaluación').length;

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

      const totalMatriculados = estEscuela.length;
      const cuposDisponibles = Math.max(0, capacidadTotal - totalMatriculados - solAprobadas);

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
        estudiantesMatriculados: totalMatriculados,
        cuposAprobados: solAprobadas,
        cuposDisponibles,
        solicitudesPendientes: solPendientes,
        totalSolicitudes: solEscuela.length,
        porcentajeOcupacion: capacidadTotal > 0 ? Math.min(100, Math.round(((totalMatriculados + solAprobadas) / capacidadTotal) * 100)) : 0
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

      const aprobados = solicitudesEsc.filter(s => s.estado === 'Aprobado' || s.estado === 'Formalizado').length;
      const pendientes = solicitudesEsc.filter(s => s.estado === 'Pendiente' || s.estado === 'En Evaluación').length;
      const matriculados = estudiantesEsc.length;
      const disponibles = Math.max(0, capTotalEsc - matriculados - aprobados);

      return {
        codigo: codEsc,
        nombre: codEsc === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar',
        totalSalones: salonesEsc.length || 1,
        salonesDetalle: salonesEsc,
        capacidadTotal: capTotalEsc,
        estudiantesMatriculados: matriculados,
        cuposAprobados: aprobados,
        cuposDisponibles: disponibles,
        solicitudesPendientes: pendientes,
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

    // Si no hay salones registrados explícitos pero hay secciones en estudiantes o solicitudes
    let totalSalones = salonesCoincidentes.length;
    if (totalSalones === 0) {
      if (escuelaActual === 'todas') {
        totalSalones = desgloseSB.totalSalones + desgloseLB.totalSalones;
        capacidadTotal = desgloseSB.capacidadTotal + desgloseLB.capacidadTotal;
      } else {
        const seccionesDetectadas = new Set(
          estudiantesEnGrado.map(e => (e.seccion_actual || 'A').toUpperCase().trim()).filter(Boolean)
        );
        totalSalones = Math.max(1, seccionesDetectadas.size || 1);
        capacidadTotal = totalSalones * 38; // 38 solo o 38+38=76
      }
    }

    // 3. Solicitudes de Admisión para este grado
    const solicitudesEnGrado = solicitudes.filter(s => {
      const matchEsc = escuelaActual === 'todas' || (s.codigo_escuela || '').toLowerCase().trim() === escuelaActual.toLowerCase().trim();
      const matchGrd = normalizarGrado(s.grado_solicitado) === gradoNormalizado;
      return matchEsc && matchGrd;
    });

    const cuposAprobados = solicitudesEnGrado.filter(s => s.estado === 'Aprobado' || s.estado === 'Formalizado').length;
    const solicitudesPendientes = solicitudesEnGrado.filter(s => s.estado === 'Pendiente' || s.estado === 'En Evaluación').length;
    const matriculados = estudiantesEnGrado.length;

    // Cupos disponibles descontando los matriculados y los ya aprobados
    const cuposDisponibles = Math.max(0, capacidadTotal - matriculados - cuposAprobados);
    const totalOcupados = matriculados + cuposAprobados;
    const porcentajeOcupacion = capacidadTotal > 0 ? Math.min(100, Math.round((totalOcupados / capacidadTotal) * 100)) : 0;

    return {
      esGradoEspecifico: true,
      gradoNombre: filtroGrado,
      escuelaNombre: escuelaActual === 'sb' ? 'U.E. Santa Bárbara' : escuelaActual === 'lb' ? 'U.E. Libertador Bolívar' : 'Ambas Escuelas (Consolidado)',
      totalSalones,
      salonesDetalle: salonesConCapacidad,
      capacidadTotal,
      estudiantesMatriculados: matriculados,
      cuposAprobados,
      cuposDisponibles,
      solicitudesPendientes,
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

        const aprob = solicitudesGrd.filter(s => s.estado === 'Aprobado' || s.estado === 'Formalizado').length;
        const pend = solicitudesGrd.filter(s => s.estado === 'Pendiente' || s.estado === 'En Evaluación').length;
        const mat = estudiantes.length;
        const disp = Math.max(0, capTotal - mat - aprob);

        return {
          salones: salones.length || 1,
          capacidad: capTotal,
          matriculados: mat,
          aprobados: aprob,
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
      const aprTot = escuelaActual === 'sb' ? sb.aprobados : escuelaActual === 'lb' ? lb.aprobados : sb.aprobados + lb.aprobados;
      const pendTot = escuelaActual === 'sb' ? sb.pendientes : escuelaActual === 'lb' ? lb.pendientes : sb.pendientes + lb.pendientes;
      const dispTot = Math.max(0, capTot - matTot - aprTot);
      const totSol = escuelaActual === 'sb' ? sb.totalSol : escuelaActual === 'lb' ? lb.totalSol : sb.totalSol + lb.totalSol;

      return {
        grado: grd,
        gradoNorm: gNorm,
        totalSalones: totalSal,
        capacidadTotal: capTot,
        estudiantesMatriculados: matTot,
        cuposAprobados: aprTot,
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

  // ── ESTADÍSTICAS E INDICADORES KPI ──────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = solicitudesFiltradas.length;
    const aprobados = solicitudesFiltradas.filter(s => s.estado === 'Aprobado').length;
    const formalizados = solicitudes.filter(s => s.estado === 'Formalizado').length;
    const pendientes = solicitudesFiltradas.filter(s => s.estado === 'Pendiente' || !s.estado).length;
    const evaluacion = solicitudesFiltradas.filter(s => s.estado === 'En Evaluación').length;
    const rechazados = solicitudesFiltradas.filter(s => s.estado === 'Rechazado').length;
    const aptos = solicitudesFiltradas.filter(s => s.aptitud === 'Apto').length;

    return { total, aprobados, formalizados, pendientes, evaluacion, rechazados, aptos };
  }, [solicitudesFiltradas, solicitudes]);

  const limpiarFiltros = () => {
    setFiltroEscuela('todas');
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

  // ── ENVIAR MENSAJE OFICIAL POR WHATSAPP AL REPRESENTANTE (SIN BAREMO Y SIN "LE") ─
  const notificarRepresentanteWhatsApp = async (sol: SolicitudAdmision) => {
    const telRaw = (sol.representante_telefono || sol.representante_telefono2 || '').replace(/\D/g, '');
    const nomEst = nombreCompleto(sol.estudiante_nombres, sol.estudiante_apellidos);
    const nomRep = nombreCompleto(sol.representante_nombres, sol.representante_apellidos);

    if (!telRaw) {
      if (Swal) {
        Swal.fire({
          icon: 'warning',
          title: 'Sin Teléfono Registrado',
          text: `La solicitud de ${nomEst} no cuenta con un número de teléfono válido registrado.`,
        });
      } else {
        alert('No hay un número de teléfono registrado para el representante.');
      }
      return;
    }

    let tel = telRaw;
    if (tel.startsWith('0')) {
      tel = '58' + tel.substring(1);
    } else if (!tel.startsWith('58') && tel.length === 10) {
      tel = '58' + tel;
    }

    const nombreEscuela = NOMBRE_ESCUELA_MAP[sol.codigo_escuela] || 'U.E. Santa Bárbara / U.E. Libertador Bolívar';
    const estado = sol.estado || 'Pendiente';

    // Obtener plantilla personalizada del redactor o predeterminada
    const plantilla = buscarPlantillaAdmision(sol.codigo_escuela, estado, 'whatsapp');
    const msg = renderizarMensajeAdmision(plantilla.cuerpo_mensaje, sol, nombreEscuela);

    const waUrl = generarEnlaceWhatsAppAdmision(telRaw, msg);
    window.open(waUrl, '_blank');

    // Registrar fecha y hora de notificación
    const ahora = new Date();
    const fechaHoraStr = ahora.toLocaleDateString('es-VE') + ' ' + ahora.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    
    // Parsear observaciones actuales y estructurar con el tag de WhatsApp
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

      // Actualizar estado local
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

      auditar('Gestión de Admisiones', 'Notificación WhatsApp', `Enviada notificación por WhatsApp a ${nomRep} (${telRaw}) para ${nomEst} - Estado: ${estado}`);

      if (Swal) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `WhatsApp registrado para ${nomEst}`,
          text: `Estatus notificado: ${estado} (${fechaHoraStr})`,
          showConfirmButton: false,
          timer: 2500
        });
      }
    } catch (errWA) {
      console.warn('Error guardando registro de WhatsApp en BD:', errWA);
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

      const { error } = await supabase
        .from('solicitud_cupos')
        .update(payloadBD)
        .eq('id', formEdicion.id);

      if (error) throw error;

      const nomEstEdit = nombreCompleto(formEdicion.estudiante_nombres, formEdicion.estudiante_apellidos);
      await auditar(
        'Gestión de Admisiones',
        'Edición de Expediente',
        `Se editaron datos del aspirante ${nomEstEdit} (${formEdicion.codigo_unico})`
      );

      setSolicitudes(prev =>
        prev.map(s => (s.id === formEdicion.id ? ({ ...s, ...formEdicion } as SolicitudAdmision) : s))
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
    setProcesandoFormalizacion(true);

    try {
      const sol = solicitudParaFormalizar;
      const cedRep = (sol.representante_cedula || '').trim();
      const cedEst = (sol.estudiante_cedula && sol.estudiante_cedula.trim()) || `ESC-${sol.codigo_unico}`;
      const nomCompletoRep = nombreCompleto(sol.representante_nombres, sol.representante_apellidos);
      const nomCompletoEst = nombreCompleto(sol.estudiante_nombres, sol.estudiante_apellidos);

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
            rol: 'representante',
            id_escuela: sol.codigo_escuela,
            email: sol.representante_email?.trim() || null,
            telefono: sol.representante_telefono?.trim() || null,
            estado: 'Activo',
            primer_ingreso: true,
            clave: cedRep,
            solicito_reseteo: false
          }]);

        if (errUsuario) {
          console.warn('Nota al crear usuario:', errUsuario.message);
        }
      } else if (usuarioExistente.id_escuela && usuarioExistente.id_escuela !== sol.codigo_escuela && usuarioExistente.id_escuela !== 'ambas') {
        await supabase.from('usuarios').update({ id_escuela: 'ambas' }).eq('cedula', cedRep);
      }

      // 2. Vincular Estudiante en `estudiantes_vinculaciones`
      const { error: errVinculo } = await supabase
        .from('estudiantes_vinculaciones')
        .upsert([{
          cedula_representante: cedRep,
          nombres_representante: (sol.representante_nombres || '').trim(),
          apellidos_representante: (sol.representante_apellidos || '').trim(),
          cedula_estudiante: cedEst,
          nombres_estudiante: (sol.estudiante_nombres || '').trim(),
          apellidos_estudiante: (sol.estudiante_apellidos || '').trim(),
          grado_actual: sol.grado_solicitado,
          seccion_actual: seccionFormalizacion || 'A',
          codigo_escuela: sol.codigo_escuela,
          estado: 'Activo',
          datos_actualizados: {
            estudiante_nombres: sol.estudiante_nombres,
            estudiante_apellidos: sol.estudiante_apellidos,
            estudiante_cedula: sol.estudiante_cedula,
            estudiante_fecha_nacimiento: sol.estudiante_fecha_nacimiento,
            estudiante_sexo: sol.estudiante_sexo,
            representante_nombres: sol.representante_nombres,
            representante_apellidos: sol.representante_apellidos,
            representante_cedula: sol.representante_cedula,
            representante_telefono: sol.representante_telefono,
            representante_email: sol.representante_email,
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
            padre_cedula: sol.padre_cedula
          },
          creado_por: 'Docente / Admisiones SIGAE'
        }], { onConflict: 'cedula_estudiante' });

      if (errVinculo) throw errVinculo;

      // 3. Actualizar Estado en `solicitud_cupos` a 'Formalizado'
      const obsFormalizacion = `[Inscripción Física Formalizada el ${new Date().toLocaleDateString('es-VE')} en Sección ${seccionFormalizacion}]`;
      const { error: errSol } = await supabase
        .from('solicitud_cupos')
        .update({
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

      // Actualizar memoria local
      const solActualizada: SolicitudAdmision = {
        ...sol,
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
              <p>🔑 <b>Usuario habilitado en SIGAE:</b> <code>${cedRep}</code> (Clave temporal: <code>${cedRep}</code>)</p>
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

  // ── AUXILIARES DE BADGES ───────────────────────────────────────────────────────
  const renderBadgeEstado = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'formalizado':
      case 'inscrito':
        return <span className="badge bg-primary text-white px-2.5 py-1 rounded-pill"><i className="bi bi-person-check-fill me-1"></i>Formalizado</span>;
      case 'aprobado':
        return <span className="badge bg-success text-white px-2.5 py-1 rounded-pill"><i className="bi bi-check-circle-fill me-1"></i>Aprobado</span>;
      case 'rechazado':
        return <span className="badge bg-danger text-white px-2.5 py-1 rounded-pill"><i className="bi bi-x-circle-fill me-1"></i>Rechazado</span>;
      case 'en evaluación':
      case 'en evaluacion':
        return <span className="badge bg-info text-dark px-2.5 py-1 rounded-pill"><i className="bi bi-hourglass-split me-1"></i>En Evaluación</span>;
      case 'borrador':
        return <span className="badge bg-secondary text-white px-2.5 py-1 rounded-pill"><i className="bi bi-pencil-square me-1"></i>Borrador</span>;
      default:
        return <span className="badge bg-warning text-dark px-2.5 py-1 rounded-pill"><i className="bi bi-clock-history me-1"></i>Pendiente</span>;
    }
  };

  // ── DETECCIÓN DE DUPLICADOS ─────────────────────────────────────────────────────
  const detectarDuplicados = () => {
    const porRepresentante: Record<string, SolicitudAdmision[]> = {};

    solicitudes.forEach(s => {
      const cedRep = (s.representante_cedula || '').trim();
      if (!cedRep) return;

      const cedEst = (s.estudiante_cedula || '').trim();
      const nomEst = nombreCompleto(s.estudiante_nombres, s.estudiante_apellidos).trim();
      if (!cedEst && !nomEst) return;

      if (!porRepresentante[cedRep]) porRepresentante[cedRep] = [];
      porRepresentante[cedRep].push(s);
    });

    const gruposDetectados: SolicitudAdmision[][] = [];

    Object.values(porRepresentante).forEach(registrosRep => {
      const porEstudiante: Record<string, SolicitudAdmision[]> = {};

      registrosRep.forEach(s => {
        const cedEst = (s.estudiante_cedula || '').trim();
        const nomEst = nombreCompleto(s.estudiante_nombres, s.estudiante_apellidos).trim().toLowerCase();
        const escuela = (s.codigo_escuela || '').trim().toLowerCase();

        const claveEst = cedEst
          ? `ci:${cedEst}|esc:${escuela}`
          : `nom:${nomEst}|esc:${escuela}`;

        if (!porEstudiante[claveEst]) porEstudiante[claveEst] = [];
        porEstudiante[claveEst].push(s);
      });

      Object.values(porEstudiante).forEach(grupo => {
        if (grupo.length > 1) {
          grupo.sort((a, b) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
          gruposDetectados.push(grupo);
        }
      });
    });

    gruposDetectados.sort((a, b) => b.length - a.length);
    setGruposDuplicados(gruposDetectados);

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
    if (seleccionadosParaEliminar.size === 0) return;

    const confirmar = await (Swal ? Swal.fire({
      icon: 'warning',
      title: `¿Eliminar ${seleccionadosParaEliminar.size} registro(s) duplicado(s)?`,
      html: `<p>Esta acción eliminará de forma permanente los duplicados seleccionados.</p>`,
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Sí, eliminar duplicados',
      cancelButtonText: 'Cancelar',
    }) : { isConfirmed: confirm(`¿Eliminar ${seleccionadosParaEliminar.size} registros duplicados?`) });

    if (!confirmar?.isConfirmed && confirmar !== true) return;

    setEliminandoDuplicados(true);
    try {
      const idsArray = Array.from(seleccionadosParaEliminar);
      const { error } = await supabase
        .from('solicitud_cupos')
        .delete()
        .in('id', idsArray);

      if (error) throw error;

      await auditar('Gestión de Admisiones', 'Eliminar Duplicados', `Se eliminaron ${idsArray.length} registros duplicados`);
      setSolicitudes(prev => prev.filter(s => !seleccionadosParaEliminar.has(s.id as any)));
      setModalDuplicadosAbierto(false);
      setGruposDuplicados([]);
      setSeleccionadosParaEliminar(new Set());
    } catch (err: any) {
      console.error('Error al eliminar duplicados:', err);
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
        return !nom && !ape && !ced;
      } else {
        const nom = (s.estudiante_nombres || '').trim();
        const ape = (s.estudiante_apellidos || '').trim();
        const ced = (s.estudiante_cedula || '').trim();
        return !nom && !ape && !ced;
      }
    });

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
    if (seleccionadosVacios.size === 0) return;

    const confirmar = await (Swal ? Swal.fire({
      icon: 'warning',
      title: `¿Eliminar ${seleccionadosVacios.size} registro(s) vacíos?`,
      html: `<p>Esta acción eliminará de forma permanente los registros que no contienen datos válidos.</p>`,
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }) : { isConfirmed: confirm(`¿Eliminar ${seleccionadosVacios.size} registros vacíos?`) });

    if (!confirmar?.isConfirmed && confirmar !== true) return;

    setEliminandoVacios(true);
    try {
      const idsArray = Array.from(seleccionadosVacios);
      const { error } = await supabase
        .from('solicitud_cupos')
        .delete()
        .in('id', idsArray);

      if (error) throw error;

      setSolicitudes(prev => prev.filter(s => !seleccionadosVacios.has(s.id as any)));
      setModalVaciosAbierto(false);
      setRegistrosVacios([]);
      setSeleccionadosVacios(new Set());
    } catch (err: any) {
      console.error('Error al eliminar vacíos:', err);
    } finally {
      setEliminandoVacios(false);
    }
  };

  // ── DEPURACIÓN DE REGULARES ──────────────────────────────────────────────────────
  const detectarRegulares = async () => {
    setDetectandoRegulares(true);
    try {
      const { data: estRegulares, error } = await supabase
        .from('estudiantes')
        .select('cedula_estudiante, nombres, apellidos, codigo_escuela');

      if (error) throw error;

      const setCedulas = new Set<string>();
      const setNombres = new Set<string>();

      (estRegulares || []).forEach((e: any) => {
        if (e.cedula_estudiante?.trim()) setCedulas.add(e.cedula_estudiante.trim().toLowerCase());
        const fullNom = `${e.nombres || ''} ${e.apellidos || ''}`.trim().toLowerCase();
        if (fullNom) setNombres.add(fullNom);
      });

      const encontrados = solicitudes.filter(s => {
        const ced = (s.estudiante_cedula || '').trim().toLowerCase();
        const nom = nombreCompleto(s.estudiante_nombres, s.estudiante_apellidos).trim().toLowerCase();
        if (ced && setCedulas.has(ced)) return true;
        if (nom && setNombres.has(nom)) return true;
        return false;
      });

      setRegistrosRegulares(encontrados);
      const todosIds = new Set<string | number>();
      encontrados.forEach(s => { if (s.id !== undefined) todosIds.add(s.id); });
      setSeleccionadosRegulares(todosIds);
      setModalRegularesAbierto(true);
    } catch (err: any) {
      console.error('Error detectando regulares:', err);
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
    if (seleccionadosRegulares.size === 0) return;

    const confirmar = await (Swal ? Swal.fire({
      icon: 'warning',
      title: `¿Eliminar ${seleccionadosRegulares.size} solicitudes de estudiantes regulares?`,
      html: `<p>Estos estudiantes ya forman parte de la matrícula regular de la escuela.</p>`,
      showCancelButton: true,
      confirmButtonColor: '#0284c7',
      confirmButtonText: 'Sí, depurar',
      cancelButtonText: 'Cancelar',
    }) : { isConfirmed: confirm(`¿Eliminar ${seleccionadosRegulares.size} solicitudes regulares?`) });

    if (!confirmar?.isConfirmed && confirmar !== true) return;

    setEliminandoRegulares(true);
    try {
      const idsArray = Array.from(seleccionadosRegulares);
      const { error } = await supabase.from('solicitud_cupos').delete().in('id', idsArray);
      if (error) throw error;

      setSolicitudes(prev => prev.filter(s => !seleccionadosRegulares.has(s.id as any)));
      setModalRegularesAbierto(false);
      setRegistrosRegulares([]);
      setSeleccionadosRegulares(new Set());
    } catch (err: any) {
      console.error('Error al eliminar regulares:', err);
    } finally {
      setEliminandoRegulares(false);
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
            No posees privilegios suficientes para ingresar al módulo de <b>Gestión de Admisiones y Baremos</b>. Contacta al administrador del sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-2 px-sm-3 px-md-4 py-3" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* ── ENCABEZADO DE LA VISTA ────────────────────────────────────────────── */}
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 pb-2.5 border-bottom gap-2">
        <div className="d-flex align-items-center gap-2">
          <span
            className="p-2 rounded-3 text-white shadow-sm d-flex align-items-center justify-content-center"
            style={{ backgroundColor: '#8B5CF6', width: '40px', height: '40px' }}
          >
            <i className="bi bi-ui-checks-grid fs-5"></i>
          </span>
          <div>
            <h4 className="fw-bold mb-0 text-dark" style={{ fontSize: 'calc(1.1rem + 0.3vw)' }}>
              Gestión, Baremo y Admisiones
            </h4>
            <p className="text-muted extra-small mb-0 d-none d-sm-block">
              Clasificación de prelación, auditoría con edición de datos, formalización de matrícula y credenciales
            </p>
          </div>
        </div>

        {/* Acciones del encabezado */}
        <div className="d-flex gap-1.5 flex-wrap align-items-center ms-auto">
          <button
            className="btn btn-outline-primary btn-sm fw-bold shadow-xs d-flex align-items-center gap-1.5 py-1 px-2.5"
            onClick={() => navigate('/categoria/Gestión%20Estudiantil/Mensajes%20de%20Admisión')}
            title="Configurar y redactar mensajes oficiales de admisión"
          >
            <i className="bi bi-chat-heart-fill text-primary"></i>
            <span className="d-none d-sm-inline">Redactor de Mensajes</span>
            <span className="d-inline d-sm-none">Mensajes</span>
          </button>

          <button
            className="btn btn-outline-secondary btn-sm shadow-xs py-1 px-2"
            onClick={cargarSolicitudes}
            title="Recargar registros"
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span className="d-none d-md-inline ms-1">Actualizar</span>
          </button>

          {/* Botones completos en Desktop */}
          <div className="d-none d-lg-flex gap-1.5 align-items-center">
            <button className="btn btn-outline-warning btn-sm fw-bold shadow-xs py-1 px-2.5 text-dark" onClick={detectarDuplicados}>
              <i className="bi bi-copy me-1"></i> Duplicados
              {gruposDuplicados.length > 0 && (
                <span className="badge bg-danger ms-1">{gruposDuplicados.length}</span>
              )}
            </button>
            <button className="btn btn-outline-danger btn-sm fw-bold shadow-xs py-1 px-2.5" onClick={() => detectarVacios('representante')}>
              <i className="bi bi-person-x me-1"></i> Vacíos
            </button>
            <button className="btn btn-outline-info btn-sm fw-bold text-dark shadow-xs py-1 px-2.5" onClick={detectarRegulares} disabled={detectandoRegulares}>
              <i className="bi bi-shield-check me-1"></i> Depurar Regulares
            </button>
            <button className="btn btn-success btn-sm fw-bold text-white shadow-xs py-1 px-2.5" onClick={exportarExcel}>
              <i className="bi bi-file-earmark-excel-fill me-1"></i> Exportar Baremo Excel
            </button>
          </div>

          {/* Menú de Herramientas desplegable en Móvil/Tablet */}
          <div className="dropdown d-inline-block d-lg-none">
            <button
              className="btn btn-outline-secondary btn-sm dropdown-toggle fw-bold py-1 px-2 shadow-xs"
              type="button"
              id="dropdownHerramientasMobile"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <i className="bi bi-tools me-1"></i> Herramientas
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 rounded-3 small p-2" aria-labelledby="dropdownHerramientasMobile">
              <li>
                <button className="dropdown-item py-2 d-flex align-items-center gap-2" onClick={detectarDuplicados}>
                  <i className="bi bi-copy text-warning"></i>
                  <span>Detectar Duplicados</span>
                  {gruposDuplicados.length > 0 && <span className="badge bg-danger ms-auto">{gruposDuplicados.length}</span>}
                </button>
              </li>
              <li>
                <button className="dropdown-item py-2 d-flex align-items-center gap-2" onClick={() => detectarVacios('representante')}>
                  <i className="bi bi-person-x text-danger"></i>
                  <span>Detectar Registros Vacíos</span>
                </button>
              </li>
              <li>
                <button className="dropdown-item py-2 d-flex align-items-center gap-2" onClick={detectarRegulares} disabled={detectandoRegulares}>
                  <i className="bi bi-shield-check text-info"></i>
                  <span>Depurar Estudiantes Regulares</span>
                </button>
              </li>
              <li><hr className="dropdown-divider my-1" /></li>
              <li>
                <button className="dropdown-item py-2 d-flex align-items-center gap-2 text-success fw-bold" onClick={exportarExcel}>
                  <i className="bi bi-file-earmark-excel-fill"></i>
                  <span>Exportar Baremo a Excel</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── SELECTOR DE PESTAÑAS DE VISTA (DESLIZABLE EN MÓVIL) ────────────────── */}
      <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2 gap-2">
        <ul className="nav nav-pills flex-nowrap overflow-x-auto text-nowrap pb-1 gap-1.5 w-100" style={{ scrollbarWidth: 'none' }}>
          <li className="nav-item">
            <button
              className={`nav-link fw-bold px-3 py-1.5 ${vistaActiva === 'tabla' ? 'active shadow-xs text-white' : 'bg-white text-secondary border'}`}
              onClick={() => setVistaActiva('tabla')}
              style={{ backgroundColor: vistaActiva === 'tabla' ? '#8B5CF6' : undefined, fontSize: '13px' }}
            >
              <i className="bi bi-table me-1.5"></i>
              <span>1. Listado General <span className="d-none d-sm-inline">y Baremo</span></span>
            </button>
          </li>
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
        </ul>

        {vistaActiva === 'uno_a_uno' && (
          <div className="d-none d-md-flex align-items-center gap-2 flex-shrink-0">
            <span className="badge bg-light text-dark border px-2.5 py-1.5 fw-bold">
              Aspirante {solicitudesFiltradas.length > 0 ? indiceUnoAUno + 1 : 0} de {solicitudesFiltradas.length}
            </span>
          </div>
        )}
      </div>

      {/* ── TARJETAS KPI / MÉTRICAS COMPACTAS ─────────────────────────────────── */}
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

      {/* ── BARRA DE FILTROS BAREMO Y MULTICRITERIO (Visible en pestañas 1 y 2) ─── */}
      {vistaActiva !== 'formalizacion' && (
        <div className="card border-0 shadow-sm rounded-3 mb-3 bg-white">
          <div className="card-body p-2.5 p-md-3">
            {/* Fila principal: Búsqueda rápida + Escuela + Botón de Filtros Avanzados */}
            <div className="row g-2 align-items-center">
              {/* Buscador general */}
              <div className="col-12 col-md-5 col-lg-5">
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
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setBusqueda('')}
                      title="Limpiar búsqueda"
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Selector Rápido de Escuela */}
              <div className="col-6 col-md-3 col-lg-3">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light text-muted">
                    <i className="bi bi-building"></i>
                  </span>
                  <select
                    className="form-select form-select-sm"
                    value={filtroEscuela}
                    onChange={e => setFiltroEscuela(e.target.value)}
                    title="Filtrar por Escuela"
                  >
                    <option value="todas">Todas las Escuelas</option>
                    <option value="sb">U.E. Santa Bárbara</option>
                    <option value="lb">U.E. Libertador Bolívar</option>
                  </select>
                </div>
              </div>

              {/* Selector Rápido de Grado */}
              <div className="col-6 col-md-4 col-lg-4 d-flex align-items-center gap-1.5">
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
                    Baremo: {filtroPrioridad}
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
                    <i className="bi bi-sliders text-primary"></i> Filtros Multicriterio y Baremo
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
                      <i className="bi bi-sort-numeric-down me-1"></i> Baremo de Prioridad
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

      {/* ── PANEL DE ANÁLISIS DE CAPACIDAD, AMBIENTES Y CUPOS DISPONIBLES (MÓVIL Y DESKTOP) ─── */}
      <div className="mb-3">
        {metricasCapacidadGrado.esGradoEspecifico ? (
          <div className="card border-0 shadow-sm rounded-3 overflow-hidden bg-white border-top border-4 border-primary">
            {/* Header del Banner de Capacidad por Grado */}
            <div className="card-header bg-primary bg-opacity-10 py-2 px-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <span className="p-1.5 bg-primary text-white rounded-2 d-flex align-items-center justify-content-center shadow-xs">
                  <i className="bi bi-bar-chart-fill fs-6"></i>
                </span>
                <div>
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center flex-wrap gap-1.5">
                    <span>Disponibilidad:</span>
                    <span className="text-primary">{metricasCapacidadGrado.gradoNombre}</span>
                  </h6>
                  <small className="text-muted extra-small d-block">
                    Plantel: <b>{metricasCapacidadGrado.escuelaNombre}</b> | <b>{metricasCapacidadGrado.totalSalones} {metricasCapacidadGrado.totalSalones === 1 ? 'Ambiente' : 'Ambientes'}</b> ({metricasCapacidadGrado.capacidadTotal} puestos)
                  </small>
                </div>
              </div>

              <div className="d-flex align-items-center gap-1.5 flex-wrap ms-auto">
                <span
                  className={`badge rounded-pill px-2.5 py-1.5 fw-bold d-flex align-items-center gap-1 ${
                    metricasCapacidadGrado.cuposDisponibles > 0 ? 'bg-success text-white' : 'bg-danger text-white'
                  }`}
                  style={{ fontSize: '11.5px' }}
                >
                  <i className={`bi ${metricasCapacidadGrado.cuposDisponibles > 0 ? 'bi-check-circle-fill' : 'bi-slash-circle-fill'}`}></i>
                  <span>{metricasCapacidadGrado.cuposDisponibles > 0 ? `${metricasCapacidadGrado.cuposDisponibles} Vacantes` : 'Sin Cupos'}</span>
                </span>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm py-1 px-2 extra-small fw-bold"
                  onClick={() => setFiltroGrado('todos')}
                  title="Ver todos los grados"
                >
                  Ver Todos
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm py-1 px-2 extra-small fw-bold"
                  onClick={() => setModalMatrizCapacidadAbierto(true)}
                  title="Ver matriz completa de todos los grados"
                >
                  <i className="bi bi-grid-3x3 me-1"></i> Matriz
                </button>
              </div>
            </div>

            {/* 4 Tarjetas de Métricas Clave (2x2 en móviles, 4 en desktop) */}
            <div className="card-body p-2.5 p-md-3">
              {/* Desglose por Escuela si está en "Todas las Escuelas" */}
              {filtroEscuela === 'todas' && metricasCapacidadGrado.desgloseSB && metricasCapacidadGrado.desgloseLB && (
                <div className="row g-2 mb-2.5">
                  <div className="col-12 col-md-6">
                    <div className="p-2 bg-light border border-primary-subtle rounded-3 d-flex align-items-center justify-content-between shadow-xs">
                      <div>
                        <strong className="d-block text-primary small">
                          <i className="bi bi-building me-1"></i> U.E. Santa Bárbara
                        </strong>
                        <small className="text-muted extra-small">
                          <b>{metricasCapacidadGrado.desgloseSB.totalSalones}</b> sal. ({metricasCapacidadGrado.desgloseSB.capacidadTotal} p.) • <b>{metricasCapacidadGrado.desgloseSB.estudiantesMatriculados}</b> vinc. • <b>{metricasCapacidadGrado.desgloseSB.cuposAprobados}</b> aprob.
                        </small>
                      </div>
                      <span className={`badge ${metricasCapacidadGrado.desgloseSB.cuposDisponibles > 0 ? 'bg-success' : 'bg-danger'} rounded-pill px-2 py-1 fw-bold`} style={{ fontSize: '10.5px' }}>
                        {metricasCapacidadGrado.desgloseSB.cuposDisponibles} vacantes
                      </span>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="p-2 bg-light border border-primary-subtle rounded-3 d-flex align-items-center justify-content-between shadow-xs">
                      <div>
                        <strong className="d-block text-primary small">
                          <i className="bi bi-building me-1"></i> U.E. Libertador Bolívar
                        </strong>
                        <small className="text-muted extra-small">
                          <b>{metricasCapacidadGrado.desgloseLB.totalSalones}</b> sal. ({metricasCapacidadGrado.desgloseLB.capacidadTotal} p.) • <b>{metricasCapacidadGrado.desgloseLB.estudiantesMatriculados}</b> vinc. • <b>{metricasCapacidadGrado.desgloseLB.cuposAprobados}</b> aprob.
                        </small>
                      </div>
                      <span className={`badge ${metricasCapacidadGrado.desgloseLB.cuposDisponibles > 0 ? 'bg-success' : 'bg-danger'} rounded-pill px-2 py-1 fw-bold`} style={{ fontSize: '10.5px' }}>
                        {metricasCapacidadGrado.desgloseLB.cuposDisponibles} vacantes
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="row g-2 mb-2.5">
                {/* 1. Capacidad de Ambientes */}
                <div className="col-6 col-lg-3">
                  <div className="p-2 rounded-3 bg-light border border-primary-subtle d-flex align-items-center gap-2 h-100">
                    <div
                      className="p-2 rounded-2 text-white d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ backgroundColor: '#4F46E5', width: '36px', height: '36px' }}
                    >
                      <i className="bi bi-door-open-fill fs-6"></i>
                    </div>
                    <div className="overflow-hidden">
                      <small className="text-muted extra-small d-block fw-semibold text-truncate">Capacidad</small>
                      <span className="fs-5 fw-bold text-dark d-block lh-1">
                        {metricasCapacidadGrado.capacidadTotal} <small className="fs-7 fw-normal text-muted">puestos</small>
                      </span>
                      <small className="text-secondary extra-small text-truncate d-block">
                        {metricasCapacidadGrado.totalSalones} {metricasCapacidadGrado.totalSalones === 1 ? 'salón' : 'salones'}
                      </small>
                    </div>
                  </div>
                </div>

                {/* 2. Estudiantes Vinculados */}
                <div className="col-6 col-lg-3">
                  <div className="p-2 rounded-3 bg-light border border-info-subtle d-flex align-items-center gap-2 h-100">
                    <div
                      className="p-2 rounded-2 text-white d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ backgroundColor: '#0284C7', width: '36px', height: '36px' }}
                    >
                      <i className="bi bi-people-fill fs-6"></i>
                    </div>
                    <div className="overflow-hidden">
                      <small className="text-muted extra-small d-block fw-semibold text-truncate">Vinculados</small>
                      <span className="fs-5 fw-bold text-info-emphasis d-block lh-1">
                        {metricasCapacidadGrado.estudiantesMatriculados} <small className="fs-7 fw-normal text-muted">est.</small>
                      </span>
                      <small className="text-secondary extra-small text-truncate d-block">Matrícula regular</small>
                    </div>
                  </div>
                </div>

                {/* 3. Cupos Aprobados Admisión */}
                <div className="col-6 col-lg-3">
                  <div className="p-2 rounded-3 bg-light border border-warning-subtle d-flex align-items-center gap-2 h-100">
                    <div
                      className="p-2 rounded-2 text-white d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ backgroundColor: '#D97706', width: '36px', height: '36px' }}
                    >
                      <i className="bi bi-person-check-fill fs-6"></i>
                    </div>
                    <div className="overflow-hidden">
                      <small className="text-muted extra-small d-block fw-semibold text-truncate">Aprobados</small>
                      <span className="fs-5 fw-bold text-warning-emphasis d-block lh-1">
                        {metricasCapacidadGrado.cuposAprobados} <small className="fs-7 fw-normal text-muted">asig.</small>
                      </span>
                      <small className="text-secondary extra-small text-truncate d-block">En admisión</small>
                    </div>
                  </div>
                </div>

                {/* 4. Cupos Disponibles Reales */}
                <div className="col-6 col-lg-3">
                  <div
                    className={`p-2 rounded-3 border d-flex align-items-center gap-2 h-100 ${
                      metricasCapacidadGrado.cuposDisponibles > 0 ? 'bg-success-subtle border-success' : 'bg-danger-subtle border-danger'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-2 text-white d-flex align-items-center justify-content-center flex-shrink-0 ${
                        metricasCapacidadGrado.cuposDisponibles > 0 ? 'bg-success' : 'bg-danger'
                      }`}
                      style={{ width: '36px', height: '36px' }}
                    >
                      <i className={`bi ${metricasCapacidadGrado.cuposDisponibles > 0 ? 'bi-check-all' : 'bi-exclamation-triangle-fill'} fs-6`}></i>
                    </div>
                    <div className="overflow-hidden">
                      <small className="text-muted extra-small d-block fw-bold text-truncate">VACANTES</small>
                      <span className={`fs-5 fw-bold d-block lh-1 ${metricasCapacidadGrado.cuposDisponibles > 0 ? 'text-success' : 'text-danger'}`}>
                        {metricasCapacidadGrado.cuposDisponibles} <small className="fs-7 fw-normal text-muted">libres</small>
                      </span>
                      <small className="extra-small d-block text-muted text-truncate">
                        Disponibles reales
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barra Visual de Ocupación */}
              <div className="bg-light p-2 rounded-3 border">
                <div className="d-flex justify-content-between align-items-center mb-1 small flex-wrap gap-1">
                  <span className="fw-semibold text-dark extra-small">
                    Ocupación: <b>{metricasCapacidadGrado.estudiantesMatriculados + metricasCapacidadGrado.cuposAprobados} de {metricasCapacidadGrado.capacidadTotal} ({metricasCapacidadGrado.porcentajeOcupacion}%)</b>
                  </span>
                  <span className="badge bg-white text-secondary border extra-small">
                    <i className="bi bi-hourglass-split me-1 text-warning"></i>
                    <b>{metricasCapacidadGrado.solicitudesPendientes}</b> en espera
                  </span>
                </div>

                <div className="progress" style={{ height: '8px', backgroundColor: '#e2e8f0' }}>
                  <div
                    className="progress-bar bg-info"
                    role="progressbar"
                    style={{
                      width: `${metricasCapacidadGrado.capacidadTotal > 0 ? (metricasCapacidadGrado.estudiantesMatriculados / metricasCapacidadGrado.capacidadTotal) * 100 : 0}%`
                    }}
                    title={`Estudiantes Vinculados: ${metricasCapacidadGrado.estudiantesMatriculados}`}
                  ></div>
                  <div
                    className="progress-bar bg-warning"
                    role="progressbar"
                    style={{
                      width: `${metricasCapacidadGrado.capacidadTotal > 0 ? (metricasCapacidadGrado.cuposAprobados / metricasCapacidadGrado.capacidadTotal) * 100 : 0}%`
                    }}
                    title={`Cupos Aprobados Admisión: ${metricasCapacidadGrado.cuposAprobados}`}
                  ></div>
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={{
                      width: `${metricasCapacidadGrado.capacidadTotal > 0 ? (metricasCapacidadGrado.cuposDisponibles / metricasCapacidadGrado.capacidadTotal) * 100 : 0}%`
                    }}
                    title={`Cupos Disponibles: ${metricasCapacidadGrado.cuposDisponibles}`}
                  ></div>
                </div>

                <div className="d-flex align-items-center justify-content-between mt-1.5 flex-wrap gap-2 extra-small text-muted">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span><span className="d-inline-block rounded-circle bg-info me-1" style={{ width: '7px', height: '7px' }}></span><b>{metricasCapacidadGrado.estudiantesMatriculados}</b> Vinculados</span>
                    <span><span className="d-inline-block rounded-circle bg-warning me-1" style={{ width: '7px', height: '7px' }}></span><b>{metricasCapacidadGrado.cuposAprobados}</b> Aprobados</span>
                    <span><span className="d-inline-block rounded-circle bg-success me-1" style={{ width: '7px', height: '7px' }}></span><b>{metricasCapacidadGrado.cuposDisponibles}</b> Libres</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* VISTA CUANDO NO HAY UN GRADO SELECCIONADO: RESUMEN GLOBAL + SELECTOR DE GRADOS DIRECTO */
          <div className="card border-0 shadow-sm rounded-3 bg-white border-start border-4 border-info">
            <div className="card-body p-2.5 p-md-3">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="p-1.5 bg-info-subtle text-info rounded-circle d-flex align-items-center justify-content-center">
                    <i className="bi bi-bar-chart-fill fs-6"></i>
                  </span>
                  <div>
                    <h6 className="fw-bold text-dark mb-0">Análisis y Disponibilidad de Cupos por Grado</h6>
                    <small className="text-muted extra-small">
                      Toca cualquier grado para filtrar y ver la disponibilidad exacta de vacantes y ambientes:
                    </small>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm fw-bold px-2.5 py-1 extra-small shadow-xs ms-auto"
                  onClick={() => setModalMatrizCapacidadAbierto(true)}
                >
                  <i className="bi bi-grid-3x3 me-1"></i> Matriz Completa
                </button>
              </div>

              {/* Tira interactiva de grados con vacantes en tiempo real */}
              <div className="d-flex align-items-center gap-1.5 overflow-auto py-1 pb-2">
                {resumenCapacidadTodosGrados.map(item => {
                  const tieneCupos = item.cuposDisponibles > 0;
                  return (
                    <button
                      key={item.grado}
                      type="button"
                      className={`btn btn-sm text-nowrap rounded-pill px-2.5 py-1 extra-small d-inline-flex align-items-center gap-1.5 transition-all shadow-xs ${
                        tieneCupos
                          ? 'btn-light border border-success-subtle text-dark'
                          : 'btn-light border border-danger-subtle text-muted'
                      }`}
                      style={{ fontSize: '11px' }}
                      onClick={() => setFiltroGrado(item.grado)}
                      title={`Ver análisis de ${item.grado}: ${item.cuposDisponibles} vacantes disponibles de ${item.capacidadTotal} puestos`}
                    >
                      <span className={`rounded-circle d-inline-block ${tieneCupos ? 'bg-success' : 'bg-danger'}`} style={{ width: '7px', height: '7px' }}></span>
                      <strong className="text-dark">{item.grado}</strong>
                      <span className={`badge ${tieneCupos ? 'bg-success text-white' : 'bg-danger text-white'} rounded-pill px-1.5 py-0.5`} style={{ fontSize: '9px' }}>
                        {tieneCupos ? `${item.cuposDisponibles}` : '0'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Resumen Global Consolidado */}
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-2 border-top extra-small text-muted mt-1">
                <span>
                  <i className="bi bi-building me-1 text-primary"></i> <b>{metricasCapacidadGrado.totalSalones}</b> Ambientes Globales ({metricasCapacidadGrado.capacidadTotal} puestos)
                </span>
                <span>
                  <i className="bi bi-people me-1 text-info"></i> <b>{metricasCapacidadGrado.estudiantesMatriculados}</b> Matriculados
                </span>
                <span>
                  <i className="bi bi-person-check me-1 text-warning"></i> <b>{metricasCapacidadGrado.cuposAprobados}</b> Aprobados
                </span>
                <span className="text-success fw-bold">
                  <i className="bi bi-check-circle-fill me-1"></i> <b>{metricasCapacidadGrado.cuposDisponibles}</b> Vacantes Libres Totales
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {/* VISTA 1: TABLA GENERAL Y BAREMO                                           */}
      {/* ══════════════════════════════════════════════════════════════════════════ */}
      {vistaActiva === 'tabla' && (
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="fw-bold text-dark d-flex align-items-center gap-2">
              <span>Listado de Aspirantes por Orden de Baremo</span>
              <span className="badge bg-primary rounded-pill px-2.5 py-1">
                {solicitudesFiltradas.length} {solicitudesFiltradas.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>
            <small className="text-muted">
              Orden automático: <b>P0 (Jerarquía) &gt; P1 (Docentes y Trabajadores Escuela) &gt; P2..P8</b> + Antigüedad de solicitud
            </small>
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
                        <th style={{ width: '45px' }} className="text-center">#</th>
                        <th style={{ width: '135px' }}>Baremo / Nivel</th>
                        <th>Código Único</th>
                        <th>Escuela</th>
                        <th>Aspirante</th>
                        <th>Grado</th>
                        <th>Representante</th>
                        <th>Nómina / Condición</th>
                        <th className="text-center">Aptitud</th>
                        <th className="text-center">Estatus</th>
                        <th className="text-end" style={{ width: '150px' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {solicitudesFiltradas.map((sol, idx) => {
                        const baremo = calcularBaremoPrioridad(sol, personalEscuelaMap);
                        const nomEst = nombreCompleto(sol.estudiante_nombres, sol.estudiante_apellidos);
                        const nomRep = nombreCompleto(sol.representante_nombres, sol.representante_apellidos);

                        return (
                          <tr key={sol.id || sol.codigo_unico}>
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
                              <span className={`badge extra-small ${sol.aptitud === 'Apto' ? 'bg-success-subtle text-success border border-success' : sol.aptitud === 'No Apto' ? 'bg-danger-subtle text-danger border border-danger' : 'bg-warning-subtle text-warning-emphasis border border-warning'}`}>
                                {sol.aptitud || 'Pendiente'}
                              </span>
                            </td>
                            <td className="text-center">
                              <div className="d-flex flex-column align-items-center gap-1">
                                {renderBadgeEstado(sol.estado)}
                                {(() => {
                                  const parsed = parsearObservaciones(sol.observaciones);
                                  return parsed.whatsapp_notificado ? (
                                    <span
                                      className="badge bg-success bg-opacity-15 text-success border border-success extra-small rounded-pill d-inline-flex align-items-center gap-1 py-0.5 px-1.5 shadow-xs"
                                      style={{ fontSize: '9.5px', cursor: 'help' }}
                                      title={`Notificación oficial enviada por WhatsApp${parsed.whatsapp_fecha ? ` el ${parsed.whatsapp_fecha}` : ''}${parsed.whatsapp_estado ? ` (${parsed.whatsapp_estado})` : ''}`}
                                    >
                                      <i className="bi bi-whatsapp"></i> Notificado
                                    </span>
                                  ) : (
                                    <span
                                      className="badge bg-light text-muted border extra-small rounded-pill d-inline-flex align-items-center gap-1 py-0.5 px-1.5"
                                      style={{ fontSize: '9px' }}
                                      title="Pendiente por enviar notificación de estatus por WhatsApp"
                                    >
                                      <i className="bi bi-clock-history"></i> Sin Notificar
                                    </span>
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
                                <span className="badge bg-success bg-opacity-15 text-success border border-success extra-small rounded-pill py-0.5 px-2">
                                  <i className="bi bi-whatsapp me-1"></i> WA Notificado
                                </span>
                              ) : (
                                <span className="badge bg-light text-muted border extra-small rounded-pill py-0.5 px-1.5">
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

                            <button
                              type="button"
                              className={`btn btn-sm py-1 px-2.5 extra-small fw-bold ${parsed.whatsapp_notificado ? 'btn-success text-white' : 'btn-outline-success'}`}
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
                          <label className="form-label extra-small fw-bold">Parentesco:</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={formEdicion.parentesco || formEdicion.representante_parentesco || ''}
                            onChange={e => setFormEdicion({ ...formEdicion, parentesco: e.target.value, representante_parentesco: e.target.value })}
                          />
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
                    {/* BAREMO DETALLE */}
                    <div className="alert alert-light border p-2.5 mb-3 small">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold text-dark">Baremo Prelación:</span>
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

                      {(() => {
                        const parsed = parsearObservaciones(solicitudUnoAUno.observaciones);
                        return (
                          <div className="mt-2 p-2.5 rounded-3 border bg-light">
                            <div className="d-flex align-items-center justify-content-between mb-1.5 flex-wrap gap-1">
                              <small className="fw-bold text-dark extra-small">
                                <i className="bi bi-whatsapp text-success me-1"></i> Estado Notificación WhatsApp:
                              </small>
                              {parsed.whatsapp_notificado ? (
                                <span className="badge bg-success bg-opacity-15 text-success border border-success extra-small rounded-pill py-0.5 px-2">
                                  <i className="bi bi-check-circle-fill me-1"></i> Enviado ({parsed.whatsapp_estado || 'Notificado'})
                                </span>
                              ) : (
                                <span className="badge bg-secondary bg-opacity-10 text-secondary border extra-small rounded-pill py-0.5 px-2">
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
                              <span>{parsed.whatsapp_notificado ? '📲 Reenviar Notificación por WhatsApp' : '📲 Enviar Notificación por WhatsApp'}</span>
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

            <span className="badge px-3 py-2 fw-bold" style={{ backgroundColor: '#0D9488', color: '#fff' }}>
              {solicitudesAceptadasParaFormalizar.length} Aceptados en Total
            </span>
          </div>

          <div className="card-body p-0">
            {solicitudesAceptadasParaFormalizar.length === 0 ? (
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
                      {solicitudesAceptadasParaFormalizar.map((sol, idx) => {
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
                    {solicitudesAceptadasParaFormalizar.map((sol, idx) => {
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
            zIndex: 99999,
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
                {/* RESUMEN DEL ASPIRANTE */}
                <div className="alert alert-light border p-3 mb-3">
                  <div className="row g-2">
                    <div className="col-12 col-md-6">
                      <span className="text-muted d-block extra-small">Estudiante a Inscribir:</span>
                      <strong className="text-dark fs-6">{nombreCompleto(solicitudParaFormalizar.estudiante_nombres, solicitudParaFormalizar.estudiante_apellidos)}</strong>
                    </div>
                    <div className="col-6 col-md-3">
                      <span className="text-muted d-block extra-small">Grado:</span>
                      <strong className="text-primary">{solicitudParaFormalizar.grado_solicitado}</strong>
                    </div>
                    <div className="col-6 col-md-3">
                      <span className="text-muted d-block extra-small">Escuela:</span>
                      <strong className="text-dark">{NOMBRE_ESCUELA_MAP[solicitudParaFormalizar.codigo_escuela] || solicitudParaFormalizar.codigo_escuela}</strong>
                    </div>
                    <div className="col-12 col-md-6 mt-2">
                      <span className="text-muted d-block extra-small">Representante Legal:</span>
                      <strong className="text-dark">{nombreCompleto(solicitudParaFormalizar.representante_nombres, solicitudParaFormalizar.representante_apellidos)} (C.I. {solicitudParaFormalizar.representante_cedula})</strong>
                    </div>
                    <div className="col-12 col-md-6 mt-2">
                      <span className="text-muted d-block extra-small">Teléfono Contacto:</span>
                      <strong className="text-dark">{solicitudParaFormalizar.representante_telefono || 'N/A'}</strong>
                    </div>
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
                          <span className="badge bg-success bg-opacity-15 text-success border border-success extra-small rounded-pill py-1 px-2">
                            <i className="bi bi-check-all me-1"></i> Enviado: {parsed.whatsapp_fecha} ({parsed.whatsapp_estado || 'Notificado'})
                          </span>
                        ) : (
                          <span className="badge bg-light text-muted border extra-small rounded-pill py-1 px-2">
                            <i className="bi bi-clock me-1"></i> Sin Notificar
                          </span>
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
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down my-auto mx-auto w-100" style={{ maxWidth: '1000px', maxHeight: '92vh' }}>
            <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
              <div className="modal-header py-3 bg-danger text-white">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-copy fs-5"></i> Detector de Duplicados ({gruposDuplicados.length} grupos)
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setModalDuplicadosAbierto(false)}></button>
              </div>
              <div className="modal-body p-3">
                <p className="small text-muted mb-2">Selecciona los duplicados más antiguos para depurar.</p>
                {gruposDuplicados.map((g, gi) => (
                  <div key={gi} className="card mb-2 border">
                    <div className="card-header py-1 bg-light small fw-bold">
                      Grupo {gi + 1}: {nombreCompleto(g[0].estudiante_nombres, g[0].estudiante_apellidos)}
                    </div>
                    <div className="card-body p-2">
                      {g.map(sol => (
                        <div key={sol.id} className="d-flex align-items-center gap-2 mb-1 small">
                          <input
                            type="checkbox"
                            checked={seleccionadosParaEliminar.has(sol.id)}
                            onChange={() => toggleSeleccion(sol.id)}
                          />
                          <span>{sol.codigo_unico} - {sol.created_at ? new Date(sol.created_at).toLocaleDateString() : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="modal-footer bg-light py-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalDuplicadosAbierto(false)}>Cerrar</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={eliminarSeleccionados} disabled={eliminandoDuplicados}>
                  Eliminar Seleccionados ({seleccionadosParaEliminar.size})
                </button>
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
              <div className="modal-header py-3 bg-danger text-white">
                <h5 className="modal-title fw-bold">Registros Vacíos ({registrosVacios.length})</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setModalVaciosAbierto(false)}></button>
              </div>
              <div className="modal-body p-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <p className="small text-muted">Se encontraron {registrosVacios.length} registros sin datos de {tipoVacios}.</p>
                <div className="list-group">
                  {registrosVacios.map(sol => (
                    <label key={sol.id} className="list-group-item list-group-item-action d-flex align-items-center gap-2 small">
                      <input
                        type="checkbox"
                        className="form-check-input me-1"
                        checked={seleccionadosVacios.has(sol.id)}
                        onChange={() => toggleSeleccionVacio(sol.id)}
                      />
                      <span><b>{sol.codigo_unico}</b> - {nombreCompleto(sol.estudiante_nombres, sol.estudiante_apellidos)} ({sol.created_at ? new Date(sol.created_at).toLocaleDateString() : 'Sin fecha'})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-footer bg-light py-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalVaciosAbierto(false)}>Cerrar</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={eliminarVaciosSeleccionados} disabled={eliminandoVacios}>
                  Eliminar ({seleccionadosVacios.size})
                </button>
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
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down my-auto mx-auto w-100" style={{ maxWidth: '900px', maxHeight: '92vh' }}>
            <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
              <div className="modal-header py-3 bg-info text-dark">
                <h5 className="modal-title fw-bold">Solicitudes de Estudiantes Regulares ({registrosRegulares.length})</h5>
                <button type="button" className="btn-close" onClick={() => setModalRegularesAbierto(false)}></button>
              </div>
              <div className="modal-body p-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                <p className="small text-muted">Estudiantes que ya existen en la matrícula activa.</p>
                <div className="list-group">
                  {registrosRegulares.map(sol => (
                    <label key={sol.id} className="list-group-item list-group-item-action d-flex align-items-center gap-2 small">
                      <input
                        type="checkbox"
                        className="form-check-input me-1"
                        checked={seleccionadosRegulares.has(sol.id)}
                        onChange={() => toggleSeleccionRegular(sol.id)}
                      />
                      <span><b>{sol.codigo_unico}</b> - {nombreCompleto(sol.estudiante_nombres, sol.estudiante_apellidos)} (C.I: {sol.estudiante_cedula || 'N/A'})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-footer bg-light py-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalRegularesAbierto(false)}>Cerrar</button>
                <button type="button" className="btn btn-info text-dark btn-sm" onClick={eliminarRegularesSeleccionados} disabled={eliminandoRegulares}>
                  Eliminar ({seleccionadosRegulares.size})
                </button>
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
                      <button
                        type="button"
                        className={`btn btn-sm ${filtroEscuela === 'todas' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
                        onClick={() => setFiltroEscuela('todas')}
                      >
                        Ambas Escuelas
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${filtroEscuela === 'sb' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
                        onClick={() => setFiltroEscuela('sb')}
                      >
                        Santa Bárbara
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${filtroEscuela === 'lb' ? 'btn-primary fw-bold' : 'btn-outline-secondary'}`}
                        onClick={() => setFiltroEscuela('lb')}
                      >
                        Libertador Bolívar
                      </button>
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
                        <th className="text-center">Matriculados</th>
                        <th className="text-center">Aprobados</th>
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
                              <span className="text-info fw-bold">{item.estudiantesMatriculados}</span>
                            </td>
                            <td className="text-center">
                              <span className="text-warning-emphasis fw-bold">{item.cuposAprobados}</span>
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
                            <div className="col-6">
                              Matriculados: <strong className="text-info">{item.estudiantesMatriculados}</strong>
                            </div>
                            <div className="col-6">
                              Aprobados: <strong className="text-warning-emphasis">{item.cuposAprobados}</strong>
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
                  Vacantes = Capacidad - Matriculados - Aprobados
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
    </div>
  );
};

export default GestionAdmisiones;
