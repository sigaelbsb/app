/**
 * Motor Oficial de Generación de Carta de Aceptación - SIGAE
 * Basado en el formato oficial de 3 páginas de la Unidad Educativa Libertador Bolívar / Santa Bárbara.
 * Soporta firmas digitales protegidas, código QR criptográfico de verificación y exportación PDF.
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabase';
import { obtenerFirmaDirectorProtegida } from './firmasSeguras';
import { toTitulo } from '../lib/formatters';

declare const Swal: any;
declare const html2pdf: any;

export interface PasoFaseAceptacion {
  id: string;
  titulo: string;
  texto: string;
  fecha?: string;
  lugar?: string;
  hora?: string;
}

export interface PlantillaCartaAceptacionConfig {
  id: string;
  id_escuela: 'sb' | 'lb' | 'ambas';
  nombre: string;
  titulo_documento: string;
  periodo_escolar: string;

  // Membrete
  membrete_linea1: string;
  membrete_linea2: string;
  membrete_nombre_escuela: string;
  membrete_ubicacion: string;
  logo_escuela_url: string;
  mostrar_bandera: boolean;

  // Introducción y especificaciones
  texto_notificacion_intro: string;
  texto_aprobacion_parrafo: string;

  // Fases del proceso (dinámicas)
  texto_fases_intro: string;
  fases?: PasoFaseAceptacion[];
  fase1_titulo: string;
  fase1_texto: string;
  fase2_titulo: string;
  fase2_texto: string;
  fase3_titulo: string;
  fase3_fecha: string;
  fase3_lugar: string;
  fase3_hora: string;
  fase3_texto?: string;

  // Recaudos
  recaudos_carpeta_nota: string;
  recaudos_inicial: string[];
  recaudos_primaria_hijos: string[];
  recaudos_primaria_familiares: string[];
  recaudos_media_hijos: string[];
  recaudos_media_familiares: string[];

  // Orientaciones
  orientaciones_generales: string[];

  // Dirección y Firmas
  titulo_director: string;
  nombre_director: string;
  cedula_director: string;
  cargo_director: string;
  firma_digital_url: string;
  mostrar_firma_digital: boolean;
  sello_humedo_url: string;
  mostrar_sello_humedo: boolean;
  mostrar_codigo_qr: boolean;

  texto_agradecimiento_final: string;
}

export interface DatosAspiranteCartaAceptacion {
  codigo_unico: string;
  codigo_escuela: 'sb' | 'lb';
  representante_nombres: string;
  representante_apellidos: string;
  representante_cedula: string;
  representante_telefono?: string;
  representante_email?: string;
  representante_email_empresa?: string;
  estudiante_nombres: string;
  estudiante_apellidos: string;
  estudiante_cedula?: string;
  grado_solicitado: string;
  parentesco?: string;
  trabajador_nombre?: string;
  trabajador_cedula?: string;
  observaciones?: string;
  fecha_emision?: string;
}

export const PLANTILLAS_ACEPTACION_DEFAULT: Record<string, PlantillaCartaAceptacionConfig> = {
  lb: {
    id: 'aceptacion-lb',
    id_escuela: 'lb',
    nombre: 'Carta de Aceptación Oficial (U.E. Libertador Bolívar)',
    titulo_documento: 'Carta de Aceptación',
    periodo_escolar: '2026 - 2027',
    membrete_linea1: 'República Bolivariana de Venezuela.',
    membrete_linea2: 'Ministerio del Poder Popular para la Educación.',
    membrete_nombre_escuela: 'Unidad Educativa Libertador Bolívar',
    membrete_ubicacion: 'Miraflores, estado Monagas.',
    logo_escuela_url: '/assets/img/logo_lb.png',
    mostrar_bandera: true,
    texto_notificacion_intro: 'Por medio de la presente, nos complace informarle que su solicitud de inscripción para el año escolar 2026-2027 ha sido evaluada y aprobada satisfactoriamente, ya que contamos con la disponibilidad de cupos para admitir a su representado(a).',
    texto_aprobacion_parrafo: ' ',
    texto_fases_intro: 'El proceso de inscripción se llevará a cabo en tres (3) fases, las cuales detallamos a continuación:',
    fases: [
      {
        id: 'fase-1',
        titulo: 'Fase 1: Ingreso al Sistema y Actualización de Ficha',
        texto: 'Ingrese a la plataforma web oficial (https://sigaelbsb.vercel.app/) con su número de cédula en el campo Usuario. Cree su contraseña segura y configure sus preguntas de seguridad. Luego, diríjase al módulo de Gestión Estudiantil y proceda a actualizar y completar detalladamente la ficha del estudiante.'
      },
      {
        id: 'fase-2',
        titulo: 'Fase 2: Descarga e Impresión de Recaudos',
        texto: 'Al finalizar la actualización de la ficha del estudiante, descargue e imprima: la Hoja de Resumen de Admisión, la presente Carta de Aceptación Oficial (2 copias) y las Normas Internas de Convivencia Escolar.'
      },
      {
        id: 'fase-3',
        titulo: 'Fase 3: Convocatoria Presencial y Formalización de Matrícula',
        texto: 'Presentar en carpeta la documentación impresa conjuntamente con todos los recaudos físicos requeridos en esta Carta de Aceptación, asistiendo a la escuela en las fechas y horarios de la convocatoria oficial para la revisión de la documentación física.\n__**Nota Importante:**__ Doce (12) horas después de la verificación presencial de documentos, podrá ingresar nuevamente al sistema y descargar la Constancia de Inscripción Definitiva.\n\n¡Bienvenidos a la Unidad Educativa Libertador Bolívar!',
        fecha: '16, 17 y 18/09/2026',
        lugar: 'Unidad Educativa Libertador Bolívar - Sala Audiovisual',
        hora: '8:30 a.m. a 11:30 a.m.'
      }
    ],
    fase1_titulo: 'Fase 1: Ingreso al Sistema y Actualización de Ficha',
    fase1_texto: 'Ingrese a la plataforma web oficial (https://sigaelbsb.vercel.app/) con su número de cédula en el campo Usuario. Cree su contraseña segura y configure sus preguntas de seguridad. Luego, diríjase al módulo de Gestión Estudiantil y proceda a actualizar y completar detalladamente la ficha del estudiante.',
    fase2_titulo: 'Fase 2: Descarga e Impresión de Recaudos',
    fase2_texto: 'Al finalizar la actualización de la ficha del estudiante, descargue e imprima: la Hoja de Resumen de Admisión, la presente Carta de Aceptación Oficial (2 copias) y las Normas Internas de Convivencia Escolar.',
    fase3_titulo: 'Fase 3: Convocatoria Presencial y Formalización de Matrícula',
    fase3_fecha: '16, 17 y 18/09/2026',
    fase3_lugar: 'Unidad Educativa Libertador Bolívar - Sala Audiovisual',
    fase3_hora: '8:30 a.m. a 11:30 a.m.',
    fase3_texto: 'Presentar en carpeta la documentación impresa conjuntamente con todos los recaudos físicos requeridos en esta Carta de Aceptación, asistiendo a la escuela en las fechas y horarios de la convocatoria oficial para la revisión de la documentación física.\n__**Nota Importante:**__ Doce (12) horas después de la verificación presencial de documentos, podrá ingresar nuevamente al sistema y descargar la Constancia de Inscripción Definitiva.\n\n¡Bienvenidos a la Unidad Educativa Libertador Bolívar!',
    recaudos_carpeta_nota: 'Consignar los siguientes recaudos, según el nivel educativo, en una carpeta marrón brillante tamaño oficio (nueva y con gancho):',
    recaudos_inicial: [
      'Copia del carnet del trabajador(a).',
      'Copia de la cédula de identidad de la madre y del padre.',
      'Copia legible de la partida de nacimiento del estudiante, con vista a la original.',
      'Copia de la tarjeta de vacunas actualizada.',
      'Constancia de retiro (si cursó estudios en otra institución).',
      'Dos fotos tipo carnet.',
      'Informe médico de especialista (en caso de tener alguna condición de salud).',
      'Constancia de prosecución de estudios (año escolar anterior).',
      'Informe descriptivo.'
    ],
    recaudos_primaria_hijos: [
      'Copia del carnet del trabajador(a).',
      'Copia de la cédula de identidad de la madre y del padre.',
      'Copia legible de la partida de nacimiento del estudiante, con vista a la original.',
      'Copia de la cédula de identidad del estudiante (a partir de los 9 años de edad).',
      'Constancia de prosecución de estudios (año escolar anterior).',
      'Boletín descriptivo.',
      'Constancia de retiro.',
      'Informe médico de especialista, en caso de tener alguna condición de salud.',
      'Dos fotos tipo carnet.'
    ],
    recaudos_primaria_familiares: [
      'Copia del carnet del trabajador(a).',
      'Copia legible de la partida de nacimiento del estudiante, con vista a la original.',
      'Copia de la partida de nacimiento del trabajador, con vista a la original.',
      'Copia de la partida de nacimiento del padre o madre, hermano(a) del trabajador(a) o algún otro documento probatorio de la filiación, con vista a la original.',
      'Copia de la cédula de identidad del estudiante (a partir de los 9 años de edad).',
      'Copia de la cédula de identidad de la madre y del padre.',
      'Constancia de prosecución de estudios (año escolar anterior).',
      'Boletín descriptivo.',
      'Constancia de retiro.',
      'Dos fotos tipo carnet.',
      'Informe médico de especialista, en caso de tener alguna condición de salud.'
    ],
    recaudos_media_hijos: [
      'Copia del carnet del trabajador(a).',
      'Copia de la cédula de identidad de la madre y del padre.',
      'Copia legible de la partida de nacimiento del estudiante, con vista a la original.',
      'Copia ampliada de la cédula de identidad del estudiante.',
      'Certificado de promoción de educación primaria (1er Año).',
      'Informe descriptivo (1er Año).',
      'Carta de retiro.',
      'Dos fotos tipo carnet.',
      'Notas certificadas del último año cursado (original).'
    ],
    recaudos_media_familiares: [
      'Copia legible de la partida de nacimiento del estudiante, con vista a la original.',
      'Copia legible de partida de nacimiento del trabajador, con vista a la original.',
      'Copia de la partida de nacimiento del padre o madre, hermano(a) del trabajador(a) o algún otro documento probatorio de la filiación, con vista a la original.',
      'Copia del carnet del trabajador(a).',
      'Copia de la cédula de Identidad del estudiante.',
      'Copia de la cédula de identidad de la madre y del padre.',
      'Boletín descriptivo/informativo.',
      'Carta de retiro.',
      'Dos fotos tipo carnet.',
      'Certificación de Notas del último grado cursado (original).'
    ],
    orientaciones_generales: [
      'Si cursó algún grado de Educación Media General en otro estado de Venezuela, la Certificación de Notas debe tener el sello y firma de la Zona Educativa correspondiente.',
      'El representante legal es el único responsable ante la Empresa y la Institución de inscribir a su representado.',
      'En el momento de la inscripción, el representante legal recibirá información sobre el compromiso que debe asumir para el éxito de la formación integral de su(s) representado(s) durante el año escolar {periodo_escolar}.',
      'El representante legal tiene la responsabilidad ineludible de acudir a cualquier llamado por parte de la institución, asistir a las reuniones previamente convocadas y realizar seguimiento continuo y permanente del rendimiento académico de su representado, en cada período del año escolar {periodo_escolar}.'
    ],
    titulo_director: 'Prof.',
    nombre_director: 'José Vicente Millán Montaño',
    cedula_director: '17.780.095',
    cargo_director: 'Director de Unidad Educativa Libertador Bolívar',
    firma_digital_url: '/assets/img/firma_director_lb.png',
    mostrar_firma_digital: true,
    sello_humedo_url: '',
    mostrar_sello_humedo: false,
    mostrar_codigo_qr: true,
    texto_agradecimiento_final: 'Gracias por usar el Sistema Integral de Gestión y Administración Escolar de la Unidad Educativa Libertador Bolívar y preferirnos para la formación de su representado o representada.'
  },
  sb: {
    id: 'aceptacion-sb',
    id_escuela: 'sb',
    nombre: 'Carta de Aceptación Oficial (U.E. Santa Bárbara)',
    titulo_documento: 'Carta de Aceptación',
    periodo_escolar: '2026 - 2027',
    membrete_linea1: 'República Bolivariana de Venezuela.',
    membrete_linea2: 'Ministerio del Poder Popular para la Educación.',
    membrete_nombre_escuela: 'Unidad Educativa Santa Bárbara',
    membrete_ubicacion: 'El Tejero, estado Monagas.',
    logo_escuela_url: '/assets/img/logo_sb.png',
    mostrar_bandera: true,
    texto_notificacion_intro: 'Por medio de la presente, nos complace informarle que su solicitud de inscripción para el año escolar 2026-2027 ha sido evaluada y aprobada satisfactoriamente, ya que contamos con la disponibilidad de cupos para admitir a su representado(a).',
    texto_aprobacion_parrafo: ' ',
    texto_fases_intro: 'El proceso de inscripción se llevará a cabo en tres (3) fases, las cuales detallamos a continuación:',
    fases: [
      {
        id: 'fase-1',
        titulo: 'Fase 1: Ingreso al Sistema y Actualización de Ficha',
        texto: 'Ingrese a la plataforma web oficial (https://sigaelbsb.vercel.app/) con su número de cédula en el campo Usuario. Cree su contraseña segura y configure sus preguntas de seguridad. Luego, diríjase al módulo de Gestión Estudiantil y proceda a actualizar y completar detalladamente la ficha del estudiante.'
      },
      {
        id: 'fase-2',
        titulo: 'Fase 2: Descarga e Impresión de Recaudos',
        texto: 'Al finalizar la actualización de la ficha del estudiante, descargue e imprima: la Hoja de Resumen de Admisión, la presente Carta de Aceptación Oficial (2 copias) y las Normas Internas de Convivencia Escolar.'
      },
      {
        id: 'fase-3',
        titulo: 'Fase 3: Convocatoria Presencial y Formalización de Matrícula',
        texto: 'Presentar en carpeta la documentación impresa conjuntamente con todos los recaudos físicos requeridos en esta Carta de Aceptación, asistiendo a la escuela en las fechas y horarios de la convocatoria oficial para la revisión de la documentación física.\n__**Nota Importante:**__ Doce (12) horas después de la verificación presencial de documentos, podrá ingresar nuevamente al sistema y descargar la Constancia de Inscripción Definitiva.\n\n¡Bienvenidos a la Unidad Educativa Santa Bárbara!',
        fecha: '16, 17 y 18/09/2026',
        lugar: 'Unidad Educativa Santa Bárbara - Sala Audiovisual',
        hora: '8:30 a.m. a 11:30 a.m.'
      }
    ],
    fase1_titulo: 'Fase 1: Ingreso al Sistema y Actualización de Ficha',
    fase1_texto: 'Ingrese a la plataforma web oficial (https://sigaelbsb.vercel.app/) con su número de cédula en el campo Usuario. Cree su contraseña segura y configure sus preguntas de seguridad. Luego, diríjase al módulo de Gestión Estudiantil y proceda a actualizar y completar detalladamente la ficha del estudiante.',
    fase2_titulo: 'Fase 2: Descarga e Impresión de Recaudos',
    fase2_texto: 'Al finalizar la actualización de la ficha del estudiante, descargue e imprima: la Hoja de Resumen de Admisión, la presente Carta de Aceptación Oficial (2 copias) y las Normas Internas de Convivencia Escolar.',
    fase3_titulo: 'Fase 3: Convocatoria Presencial y Formalización de Matrícula',
    fase3_fecha: '16, 17 y 18/09/2026',
    fase3_lugar: 'Unidad Educativa Santa Bárbara - Sala Audiovisual',
    fase3_hora: '8:30 a.m. a 11:30 a.m.',
    fase3_texto: 'Presentar en carpeta la documentación impresa conjuntamente con todos los recaudos físicos requeridos en esta Carta de Aceptación, asistiendo a la escuela en las fechas y horarios de la convocatoria oficial para la revisión de la documentación física.\n__**Nota Importante:**__ Doce (12) horas después de la verificación presencial de documentos, podrá ingresar nuevamente al sistema y descargar la Constancia de Inscripción Definitiva.\n\n¡Bienvenidos a la Unidad Educativa Santa Bárbara!',
    recaudos_carpeta_nota: 'Consignar los siguientes recaudos, según el nivel educativo, en una carpeta marrón brillante tamaño oficio (nueva y con gancho):',
    recaudos_inicial: [
      'Copia del carnet del trabajador(a).',
      'Copia de la cédula de identidad de la madre y del padre.',
      'Copia legible de la partida de nacimiento del estudiante, con vista a la original.',
      'Copia de la tarjeta de vacunas actualizada.',
      'Constancia de retiro (si cursó estudios en otra institución).',
      'Dos fotos tipo carnet.',
      'Informe médico de especialista (en caso de tener alguna condición de salud).',
      'Constancia de prosecución de estudios (año escolar anterior).',
      'Informe descriptivo.'
    ],
    recaudos_primaria_hijos: [
      'Copia del carnet del trabajador(a).',
      'Copia de la cédula de identidad de la madre y del padre.',
      'Copia legible de la partida de nacimiento del estudiante, con vista a la original.',
      'Copia de la cédula de identidad del estudiante (a partir de los 9 años de edad).',
      'Constancia de prosecución de estudios (año escolar anterior).',
      'Boletín descriptivo.',
      'Constancia de retiro.',
      'Informe médico de especialista, en caso de tener alguna condición de salud.',
      'Dos fotos tipo carnet.'
    ],
    recaudos_primaria_familiares: [
      'Copia del carnet del trabajador(a).',
      'Copia legible de la partida de nacimiento del estudiante, con vista a la original.',
      'Copia de la partida de nacimiento del trabajador, con vista a la original.',
      'Copia de la partida de nacimiento del padre o madre, hermano(a) del trabajador(a) o documento probatorio de filiación con vista a la original.',
      'Copia de la cédula de identidad del estudiante (a partir de los 9 años de edad).',
      'Copia de la cédula de identidad de la madre y del padre.',
      'Constancia de prosecución de estudios (año escolar anterior).',
      'Boletín descriptivo.',
      'Constancia de retiro.',
      'Dos fotos tipo carnet.',
      'Informe médico de especialista, en caso de tener alguna condición de salud.'
    ],
    recaudos_media_hijos: [
      'Copia del carnet del trabajador(a).',
      'Copia de la cédula de identidad de la madre y del padre.',
      'Copia legible de la partida de nacimiento del estudiante, con vista a la original.',
      'Copia ampliada de la cédula de identidad del estudiante.',
      'Certificado de promoción de educación primaria (1er Año).',
      'Informe descriptivo (1er Año).',
      'Carta de retiro.',
      'Dos fotos tipo carnet.',
      'Notas certificadas del último año cursado (original).'
    ],
    recaudos_media_familiares: [
      'Copia legible de la partida de nacimiento del estudiante, con vista a la original.',
      'Copia legible de partida de nacimiento del trabajador, con vista a la original.',
      'Copia de la partida de nacimiento del padre o madre, hermano(a) del trabajador(a) o documento probatorio de filiación con vista a la original.',
      'Copia del carnet del trabajador(a).',
      'Copia de la cédula de Identidad del estudiante.',
      'Copia de la cédula de identidad de la madre y del padre.',
      'Boletín descriptivo/informativo.',
      'Carta de retiro.',
      'Dos fotos tipo carnet.',
      'Certificación de Notas del último grado cursado (original).'
    ],
    orientaciones_generales: [
      'Si cursó algún grado de Educación Media General en otro estado de Venezuela, la Certificación de Notas debe tener el sello y firma de la Zona Educativa correspondiente.',
      'El representante legal es el único responsable ante la Empresa y la Institución de inscribir a su representado.',
      'En el momento de la inscripción, el representante legal recibirá información sobre el compromiso que debe asumir para el éxito de la formación integral de su(s) representado(s) durante el año escolar {periodo_escolar}.',
      'El representante legal tiene la responsabilidad ineludible de acudir a cualquier llamado por parte de la institución, asistir a las reuniones previamente convocadas y realizar seguimiento continuo y permanente del rendimiento académico de su representado, en cada período del año escolar {periodo_escolar}.'
    ],
    titulo_director: 'Profa.',
    nombre_director: 'Elika Dayana Chaviel Rondón',
    cedula_director: '16.808.608',
    cargo_director: 'Directora de Unidad Educativa Santa Bárbara',
    firma_digital_url: '/assets/img/firma_director_sb.png',
    mostrar_firma_digital: true,
    sello_humedo_url: '',
    mostrar_sello_humedo: false,
    mostrar_codigo_qr: true,
    texto_agradecimiento_final: 'Gracias por usar el Sistema Integral de Gestión y Administración Escolar de la Unidad Educativa Santa Bárbara y preferirnos para la formación de su representado o representada.'
  }
};

const STORAGE_KEY_ACEPTACION = 'sigae_plantillas_carta_aceptacion_v1';

export const obtenerPlantillasCartaAceptacion = (): PlantillaCartaAceptacionConfig[] => {
  const normalizarConfig = (cfg: any, esc: 'sb' | 'lb'): PlantillaCartaAceptacionConfig => {
    const base = PLANTILLAS_ACEPTACION_DEFAULT[esc];
    const res: PlantillaCartaAceptacionConfig = { ...base, ...cfg };
    const fasesNorm = obtenerFasesPlantilla(res);
    res.fases = fasesNorm;
    if (fasesNorm[0]) {
      res.fase1_titulo = fasesNorm[0].titulo;
      res.fase1_texto = fasesNorm[0].texto;
    }
    if (fasesNorm[1]) {
      res.fase2_titulo = fasesNorm[1].titulo;
      res.fase2_texto = fasesNorm[1].texto;
    }
    if (fasesNorm[2]) {
      res.fase3_titulo = fasesNorm[2].titulo;
      res.fase3_fecha = fasesNorm[2].fecha || res.fase3_fecha;
      res.fase3_lugar = fasesNorm[2].lugar || res.fase3_lugar;
      res.fase3_hora = fasesNorm[2].hora || res.fase3_hora;
      if (fasesNorm[2].texto) res.fase3_texto = fasesNorm[2].texto;
    }
    return res;
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACEPTACION);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: any) => {
          const esc: 'sb' | 'lb' = p.id_escuela === 'sb' ? 'sb' : 'lb';
          return normalizarConfig(p, esc);
        });
      }
    }
  } catch (e) {
    console.warn('Fallo leyendo caché local de plantillas carta de aceptación:', e);
  }

  try {
    const rawConst = typeof window !== 'undefined' ? localStorage.getItem('sigae_plantillas_constancias') : null;
    if (rawConst) {
      const parsed = JSON.parse(rawConst);
      if (Array.isArray(parsed)) {
        const lbCustom = parsed.find((p: any) => p.codigo_tipo === 'aceptacion' && p.id_escuela === 'lb');
        const sbCustom = parsed.find((p: any) => p.codigo_tipo === 'aceptacion' && p.id_escuela === 'sb');
        if (lbCustom || sbCustom) {
          return [
            normalizarConfig(lbCustom || {}, 'lb'),
            normalizarConfig(sbCustom || {}, 'sb')
          ];
        }
      }
    }
  } catch (_) {}

  return [PLANTILLAS_ACEPTACION_DEFAULT.lb, PLANTILLAS_ACEPTACION_DEFAULT.sb];
};

export const guardarPlantillasCartaAceptacion = async (plantillas: PlantillaCartaAceptacionConfig[]): Promise<boolean> => {
  try {
    localStorage.setItem(STORAGE_KEY_ACEPTACION, JSON.stringify(plantillas));
    try {
      await supabase.from('configuraciones_sistema').upsert({
        clave: 'plantillas_carta_aceptacion',
        valor: plantillas,
        updated_at: new Date().toISOString()
      }, { onConflict: 'clave' });
    } catch (_) {}
    return true;
  } catch (err) {
    console.error('Error guardando plantillas carta de aceptación:', err);
    return false;
  }
};

/**
 * Helper para interpretar formato enriquecido (Markdown + etiquetas HTML y comandos)
 */
export const parseFormatoTexto = (texto?: string): string => {
  if (!texto) return '';
  let str = texto;

  // 1. Salto de página forzado
  str = str.replace(
    /\[SALTO_PAGINA\]|\[SALTO_DE_PAGINA\]/gi,
    '<div style="page-break-before: always; height: 1px; margin: 15px 0;"></div>'
  );

  // 2. Negrita: **texto** o <b> o <strong>
  str = str.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

  // 3. Subrayado: __texto__
  str = str.replace(/__(.*?)__/g, '<u>$1</u>');

  // 4. Tachado: ~~texto~~
  str = str.replace(/~~(.*?)~~/g, '<s>$1</s>');

  // 5. Resaltado: ==texto==
  str = str.replace(/==(.*?)==/g, '<mark style="background-color: #fef08a; padding: 1px 4px; border-radius: 3px; color: #1e293b;">$1</mark>');

  // 6. Cursiva: *texto* (que no sea doble *)
  str = str.replace(/(^|[^\*])\*([^\*\n]+)\*([^\*]|$)/g, '$1<i>$2</i>$3');

  return str;
};

/**
 * Helper para obtener las fases dinámicas con fallback retrocompatible
 * Garantiza:
 * 1. Paso 1 / Fase 1 = Registro Electrónico
 * 2. Paso 2 / Fase 2 = Documentación (incluyendo impresión de Carta, Hoja de Resumen y Normas Internas)
 * 3. Paso 3 / Fase 3 = Inscripción
 */
export const obtenerFasesPlantilla = (cfg: PlantillaCartaAceptacionConfig): PasoFaseAceptacion[] => {
  const esc = (cfg.id_escuela === 'sb' ? 'sb' : 'lb');
  const baseFase1Texto = PLANTILLAS_ACEPTACION_DEFAULT[esc].fase1_texto;
  const baseFase2Texto = PLANTILLAS_ACEPTACION_DEFAULT[esc].fase2_texto;

  let fasesResultado: PasoFaseAceptacion[] = [];

  if (Array.isArray(cfg.fases) && cfg.fases.length > 0) {
    const fasesClon = cfg.fases.map(f => ({ ...f }));
    const f0Titulo = (fasesClon[0]?.titulo || '').toLowerCase();
    const f0Texto = (fasesClon[0]?.texto || '').toLowerCase();
    const f1Titulo = (fasesClon[1]?.titulo || '').toLowerCase();
    const f1Texto = (fasesClon[1]?.texto || '').toLowerCase();

    const fase1EsDoc = f0Titulo.includes('documentación') || f0Texto.includes('imprima la presente carta');
    const fase2EsReg = f1Titulo.includes('registro') || f1Texto.includes('registro-estudiantil');

    if (fase1EsDoc || fase2EsReg) {
      const fDoc = {
        ...fasesClon[0],
        id: 'fase-2',
        titulo: (fasesClon[0].titulo || 'Fase 2: Documentación').replace(/1/g, '2').replace(/Paso\s*1/i, 'Paso 2')
      };
      const fReg = fasesClon[1] ? {
        ...fasesClon[1],
        id: 'fase-1',
        titulo: (fasesClon[1].titulo || 'Fase 1: Registro Electrónico').replace(/2/g, '1').replace(/Paso\s*2/i, 'Paso 1')
      } : {
        id: 'fase-1',
        titulo: 'Fase 1: Registro Electrónico',
        texto: baseFase1Texto
      };
      fasesResultado = [fReg, fDoc, ...fasesClon.slice(2)];
    } else {
      fasesResultado = fasesClon;
    }
  } else {
    // Si no hay arreglo fases, construir desde los campos independientes
    const f1Tit = (cfg.fase1_titulo || '').toLowerCase();
    const f1Txt = (cfg.fase1_texto || '').toLowerCase();
    const fase1EsDoc = f1Tit.includes('documentación') || f1Txt.includes('imprima la presente carta');

    if (fase1EsDoc) {
      fasesResultado.push({
        id: 'fase-1',
        titulo: cfg.fase2_titulo ? cfg.fase2_titulo.replace(/2/g, '1').replace(/Paso\s*2/i, 'Paso 1') : 'Fase 1: Registro Electrónico',
        texto: cfg.fase2_texto || baseFase1Texto
      });
      fasesResultado.push({
        id: 'fase-2',
        titulo: cfg.fase1_titulo ? cfg.fase1_titulo.replace(/1/g, '2').replace(/Paso\s*1/i, 'Paso 2') : 'Fase 2: Documentación',
        texto: cfg.fase1_texto || baseFase2Texto
      });
    } else {
      if (cfg.fase1_titulo || cfg.fase1_texto) {
        fasesResultado.push({
          id: 'fase-1',
          titulo: cfg.fase1_titulo || 'Fase 1: Registro Electrónico',
          texto: cfg.fase1_texto || baseFase1Texto
        });
      }
      if (cfg.fase2_titulo || cfg.fase2_texto) {
        fasesResultado.push({
          id: 'fase-2',
          titulo: cfg.fase2_titulo || 'Fase 2: Documentación',
          texto: cfg.fase2_texto || baseFase2Texto
        });
      }
    }

    if (cfg.fase3_titulo || cfg.fase3_fecha || cfg.fase3_lugar || cfg.fase3_hora) {
      fasesResultado.push({
        id: 'fase-3',
        titulo: cfg.fase3_titulo || 'Fase 3: Inscripción',
        texto: cfg.fase3_texto || '',
        fecha: cfg.fase3_fecha,
        lugar: cfg.fase3_lugar,
        hora: cfg.fase3_hora
      });
    }
  }

  // Si no hay ninguna fase generada, usar las del default
  if (fasesResultado.length === 0) {
    fasesResultado = (PLANTILLAS_ACEPTACION_DEFAULT[esc]?.fases || []).map(f => ({ ...f }));
  }

  // Asegurar que la Fase de Documentación contenga la indicación de imprimir la Carta de Aceptación, la Hoja de Resumen y las Normas Internas
  return fasesResultado.map((fase, index) => {
    const tituloLower = (fase.titulo || '').toLowerCase();
    const textoLower = (fase.texto || '').toLowerCase();
    const esDoc = index === 1 || 
                  tituloLower.includes('documentación') || 
                  fase.id === 'fase-2' || 
                  textoLower.includes('imprima la presente carta');

    if (esDoc) {
      const tieneNormas = fase.texto?.includes('Normas Internas');
      const tieneResumen = fase.texto?.includes('Hoja de Resumen') || fase.texto?.includes('hoja de resumen');
      if (!fase.texto || !tieneNormas || !tieneResumen) {
        return {
          ...fase,
          texto: baseFase2Texto
        };
      }
    }
    return fase;
  });
};

/**
 * Genera el HTML completo de 3 páginas de la Carta de Aceptación
 */
export const renderCartaAceptacionHTML = (
  plantilla: PlantillaCartaAceptacionConfig,
  datos: DatosAspiranteCartaAceptacion,
  firmaProtegidaBase64?: string
): string => {
  const nombreEscuela = plantilla.membrete_nombre_escuela;
  const logoEscuela = plantilla.logo_escuela_url || `/assets/img/logo_${datos.codigo_escuela}.png`;

  const esLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const baseUrlVerificacion = esLocal ? 'https://app-delta-ten-80.vercel.app' : (typeof window !== 'undefined' ? window.location.origin : 'https://app-delta-ten-80.vercel.app');

  const escCode = (datos.codigo_escuela || plantilla.id_escuela || 'lb').toLowerCase();
  const cPrim = escCode === 'sb' ? '#047857' : '#1d4ed8';
  const anoEscolarDoc = plantilla.periodo_escolar || '2026 - 2027';
  const repCedulaLimpia = (datos.representante_cedula || '0000').replace(/\D/g, '');
  const codigoDoc = `CA-${escCode.toUpperCase()}-${repCedulaLimpia}-${new Date().getFullYear()}`;

  // Hash criptográfico determinista anti-falsificación de 8 caracteres
  const rawHash = `${escCode.toUpperCase()}:${repCedulaLimpia}:${datos.grado_solicitado || ''}:${anoEscolarDoc}:SIGAE-SECURE-KEY-2026`;
  let hashNum = 0;
  for (let i = 0; i < rawHash.length; i++) {
    hashNum = ((hashNum << 5) - hashNum) + rawHash.charCodeAt(i);
    hashNum |= 0;
  }
  const hexHash = Math.abs(hashNum).toString(16).toUpperCase().padStart(8, '0');
  const hashSeguridad = `${hexHash.slice(0, 4)}-${hexHash.slice(4, 8)}`;

  const qrValidationUrl = `${baseUrlVerificacion}/validar-constancia/${encodeURIComponent(codigoDoc)}`;
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=3&data=${encodeURIComponent(qrValidationUrl)}`;

  const repNombre = toTitulo(`${datos.representante_nombres || ''} ${datos.representante_apellidos || ''}`);
  const estNombre = toTitulo(`${datos.estudiante_nombres || ''} ${datos.estudiante_apellidos || ''}`);
  const gradoTxt = toTitulo(datos.grado_solicitado || '1er Grado');
  const repCedula = (datos.representante_cedula || 'N/A').trim();
  const correo1 = (datos.representante_email || 'correo@registrado.com').trim().toLowerCase();
  const correo2 = datos.representante_email_empresa
    ? datos.representante_email_empresa.trim().toLowerCase()
    : (datos.representante_telefono || 'N/A').trim();

  const intro = plantilla.texto_notificacion_intro.replace(/{periodo_escolar}/g, anoEscolarDoc);

  const toArray = (v: any, fallback: string[] = []): string[] => {
    if (Array.isArray(v)) return v.filter(Boolean);
    if (typeof v === 'string') return v.split('\n').map(s => s.trim()).filter(Boolean);
    return fallback;
  };

  const defaultListas = PLANTILLAS_ACEPTACION_DEFAULT[escCode] || PLANTILLAS_ACEPTACION_DEFAULT.lb;
  const recInicial = toArray(plantilla.recaudos_inicial, defaultListas.recaudos_inicial);
  const recPrimHijos = toArray(plantilla.recaudos_primaria_hijos, defaultListas.recaudos_primaria_hijos);
  const recPrimFam = toArray(plantilla.recaudos_primaria_familiares, defaultListas.recaudos_primaria_familiares);
  const recMedHijos = toArray(plantilla.recaudos_media_hijos, defaultListas.recaudos_media_hijos);
  const recMedFam = toArray(plantilla.recaudos_media_familiares, defaultListas.recaudos_media_familiares);
  const orientaciones = toArray(plantilla.orientaciones_generales, defaultListas.orientaciones_generales);

  const listaFases = obtenerFasesPlantilla(plantilla);

  // Helper para convertir saltos de línea y párrafos preservando formato
  const renderParrafosHTML = (texto?: string, estiloP?: string): string => {
    if (!texto) return '';
    const trimmed = texto.trim();
    if (!trimmed) return '';

    const formateado = parseFormatoTexto(trimmed);

    // Dividir por doble salto de línea para párrafos independientes
    const bloques = formateado.split(/\n\s*\n/);
    return bloques.map(bloque => {
      const lineas = bloque.split('\n').map(l => l.trim()).join('<br/>');
      return `<p style="${estiloP || 'text-align: justify; margin-bottom: 10px; line-height: 1.45; font-size: 12.5px; color: #1e293b;'}">${lineas}</p>`;
    }).join('');
  };

  const renderTextoConSaltos = (texto?: string): string => {
    if (!texto) return '';
    const trimmed = texto.trim();
    if (!trimmed) return '';
    const formateado = parseFormatoTexto(trimmed);
    return formateado.split('\n').map(l => l.trim()).join('<br/>');
  };

  // Componente de Bandera Tricolor Nacional de Venezuela con 8 estrellas
  const banderaTricolorHTML = plantilla.mostrar_bandera ? `
    <div style="width: 100%; display: flex; flex-direction: column; overflow: hidden; border-radius: 4px; margin-bottom: 12px;">
      <div style="height: 5px; background-color: #facc15;"></div>
      <div style="height: 9px; background-color: #003893; display: flex; justify-content: center; align-items: center; gap: 4px; color: #ffffff; font-size: 7.5px; line-height: 1; font-weight: bold; user-select: none;">
        <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
      </div>
      <div style="height: 5px; background-color: #cf142b;"></div>
    </div>
  ` : '';

  // Ruta y estado de la firma digitalizada del director (garantiza renderizado tanto en preview como en PDF)
  const firmaDirectorSrc = firmaProtegidaBase64 || plantilla.firma_digital_url || `/assets/img/firma_director_${escCode}.png`;
  const mostrarFirma = plantilla.mostrar_firma_digital !== false;

  // Encabezado institucional oficial idéntico al de la Constancia de Inscripción (sin logo MPPE arriba pues ya está en el cintillo inferior)
  const encabezadoHTML = () => `
    ${banderaTricolorHTML}
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #cbd5e1; padding-bottom: 10px; margin-bottom: 12px; position: relative;">
      <div style="width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <img src="${logoEscuela}" alt="Escudo" crossOrigin="anonymous" style="max-height: 70px; max-width: 70px; object-fit: contain;" />
      </div>
      <div style="flex: 1; text-align: center; padding: 0 10px; line-height: 1.35;">
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #334155; letter-spacing: 0.5px;">${plantilla.membrete_linea1}</div>
        <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b;">${plantilla.membrete_linea2}</div>
        <div style="font-size: 13.5px; font-weight: bold; text-transform: uppercase; color: #0f172a; margin-top: 2px;">${plantilla.membrete_nombre_escuela}</div>
        <div style="font-size: 11px; color: #475569;">${plantilla.membrete_ubicacion}</div>
      </div>
      <div style="width: 72px; flex-shrink: 0;"></div>
    </div>
  `;

  // Pie de página institucional oficial con código de autenticidad, hash y número de página
  const piePaginaHTML = (numPagina: number) => `
    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #cbd5e1; padding-top: 8px; margin-top: 10px; font-size: 8.5px; color: #64748b;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <img src="/assets/img/logoMPPE.png" alt="MPPE" crossOrigin="anonymous" style="height: 22px; width: auto;" onError="this.style.display='none'" />
        <span>SIGAE - Control Estudiantil | Carta Oficial de Aceptación</span>
      </div>
      <div style="text-align: right;">
        Cód. Autenticidad: <b style="color: #166534; font-family: monospace;">${codigoDoc}</b> &bull; Hash: <b style="font-family: monospace; color: #0f172a;">${hashSeguridad}</b> &bull; <b>Página ${numPagina} de 3</b>
      </div>
    </div>
  `;

  // Bloque inferior con Código QR de Verificación y Silueta de Rúbrica / Media Firma de la Dirección (Páginas 1 y 2)
  const bloqueQrYRubricaHTML = (numPagina: number) => `
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 12px; padding: 6px 14px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px;">
      <!-- QR de Verificación de Página -->
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 3px; background: #ffffff;">
          <img src="${qrImageSrc}" alt="QR Verificación" crossOrigin="anonymous" style="width: 52px; height: 52px; display: block;" />
        </div>
        <div style="line-height: 1.25;">
          <span style="font-size: 7.5px; font-weight: bold; color: #166534; font-family: monospace; display: block;">VERIFICACIÓN QR &bull; PÁG ${numPagina}/3</span>
          <span style="font-size: 7px; font-weight: bold; color: #0f172a; font-family: monospace; display: block;">${codigoDoc}</span>
          <span style="font-size: 6.5px; color: #64748b; font-family: monospace; display: block;">SEC-HASH: ${hashSeguridad}</span>
        </div>
      </div>

      <!-- Silueta de Media Firma / Rúbrica de la Dirección -->
      <div style="text-align: center; width: 230px; position: relative;">
        ${mostrarFirma && firmaDirectorSrc ? `
          <div style="height: 44px; display: flex; align-items: center; justify-content: center; margin-bottom: 2px;">
            <img src="${firmaDirectorSrc}" alt="Rúbrica Dirección" crossOrigin="anonymous" style="max-height: 42px; max-width: 140px; object-fit: contain;" />
          </div>
        ` : `
          <div style="height: 32px;"></div>
        `}
        <div style="border-top: 1px solid #334155; width: 175px; margin: 0 auto 2px auto;"></div>
        <div style="font-size: 9.5px; font-weight: bold; color: #0f172a; line-height: 1.2;">
          ${plantilla.titulo_director} ${plantilla.nombre_director}
        </div>
        <div style="font-size: 8px; color: #475569;">
          ${plantilla.cargo_director} (Rúbrica de Validación)
        </div>
      </div>
    </div>
  `;

  return `
  <div class="carta-aceptacion-documento" style="font-family: Arial, Helvetica, sans-serif; color: #000000; font-size: 13px; line-height: 1.45; background: #ffffff;">
    
    <!-- ══════════════════════ PÁGINA 1 ══════════════════════ -->
    <div class="carta-pagina" style="width: 816px; min-height: 1045px; padding: 28px 42px 22px 42px; box-sizing: border-box; position: relative; border: 2px solid #94a3b8; border-radius: 8px; margin-bottom: 24px; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between;">
      
      <div>
        ${encabezadoHTML()}

        <!-- Cinta Distintiva del Documento y Período Escolar -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 5px solid ${cPrim}; border-radius: 6px; padding: 5px 14px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 11px; font-weight: bold; color: ${cPrim}; text-transform: uppercase; letter-spacing: 0.5px;">
            DOCUMENTO OFICIAL DE ADMISIÓN &bull; PÁGINA 1 DE 3
          </span>
          <span style="font-size: 10.5px; font-weight: bold; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 2px 10px; border-radius: 10px;">
            Año Escolar: ${anoEscolarDoc}
          </span>
        </div>

        <!-- Título Central -->
        <div style="text-align: center; margin: 8px 0 12px 0;">
          <h2 style="margin: 0; font-size: 19px; font-weight: bold; letter-spacing: 0.5px; color: #0f172a;">
            ${plantilla.titulo_documento}
          </h2>
        </div>

        <!-- Párrafo de Notificación -->
        ${renderParrafosHTML(intro, 'text-align: justify; margin-bottom: 10px; line-height: 1.45; font-size: 12.5px; color: #1e293b;')}

        <!-- Tarjeta Estilizada de Datos del Aspirante -->
        <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-left: 5px solid ${cPrim}; border-radius: 8px; padding: 8px 16px; margin-bottom: 12px; font-size: 12.3px; line-height: 1.55;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px 18px;">
            <div><span style="color: #64748b; font-weight: 600;">Representante Legal:</span> <b style="color: #0f172a;">${repNombre}</b></div>
            <div><span style="color: #64748b; font-weight: 600;">C.I. Representante:</span> <b style="color: #0f172a;">${repCedula}</b></div>
            <div><span style="color: #64748b; font-weight: 600;">Estudiante Aspirante:</span> <b style="color: #0f172a;">${estNombre}</b></div>
            <div><span style="color: #64748b; font-weight: 600;">Grado / Nivel Asignado:</span> <b style="color: ${cPrim};">${gradoTxt}</b></div>
            <div><span style="color: #64748b; font-weight: 600;">Correo Principal:</span> <span style="color: #334155;">${correo1}</span></div>
            <div><span style="color: #64748b; font-weight: 600;">Contacto / Correo 2:</span> <span style="color: #334155;">${correo2}</span></div>
          </div>
        </div>

        <!-- Párrafo de Aprobación -->
        ${renderParrafosHTML(plantilla.texto_aprobacion_parrafo, 'text-align: justify; margin-bottom: 10px; line-height: 1.45; font-size: 12.5px; color: #1e293b;')}

        <!-- Fases del Proceso -->
        ${renderParrafosHTML(plantilla.texto_fases_intro, 'text-align: justify; margin-bottom: 8px; line-height: 1.45; font-size: 12.5px; color: #1e293b;')}

        <!-- Detalle Fases Dinámicas -->
        ${listaFases.map((fase) => `
          <div style="margin-bottom: 8px; background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid ${cPrim}; border-radius: 6px; padding: 7px 12px;">
            <div style="font-weight: bold; color: ${cPrim}; font-size: 12.3px; margin-bottom: 2px;">
              ${parseFormatoTexto(fase.titulo)}
            </div>
            ${fase.texto ? `
              <div style="text-align: justify; line-height: 1.45; font-size: 11.8px; color: #1e293b; white-space: normal;">
                ${renderTextoConSaltos(fase.texto.replace(/{nombre_escuela}/g, nombreEscuela))}
              </div>
            ` : ''}
            ${(fase.fecha || fase.lugar || fase.hora) ? `
              <div style="display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 11.8px; color: #1e293b; line-height: 1.4; margin-top: ${fase.texto ? '5px' : '0'};">
                ${fase.fecha ? `<div><b>Fecha:</b> ${parseFormatoTexto(fase.fecha)}</div>` : ''}
                ${fase.lugar ? `<div><b>Lugar:</b> ${parseFormatoTexto(fase.lugar)}</div>` : ''}
                ${fase.hora ? `<div><b>Hora:</b> ${parseFormatoTexto(fase.hora)}</div>` : ''}
              </div>
            ` : ''}
          </div>
        `).join('')}

        <!-- Inicio Recaudos -->
        <div style="margin-bottom: 6px; font-weight: bold; font-size: 12px; color: #0f172a; text-decoration: underline; white-space: pre-line;">
          ${renderTextoConSaltos(plantilla.recaudos_carpeta_nota)}
        </div>

        <div style="margin-bottom: 4px; font-weight: bold; font-size: 12px; color: ${cPrim};">
          Educación Inicial (II Grupo, III Grupo)
        </div>
        <ul style="margin: 0 0 6px 18px; padding: 0; line-height: 1.35; font-size: 11.5px; color: #1e293b;">
          ${recInicial.slice(0, 5).map(r => `<li style="margin-bottom: 2px;">${r}</li>`).join('')}
        </ul>
      </div>

      <div>
        ${bloqueQrYRubricaHTML(1)}
        ${piePaginaHTML(1)}
      </div>
    </div>

    <!-- ══════════════════════ PÁGINA 2 ══════════════════════ -->
    <div class="carta-pagina" style="width: 816px; min-height: 1045px; padding: 28px 42px 22px 42px; box-sizing: border-box; position: relative; page-break-before: always; border: 2px solid #94a3b8; border-radius: 8px; margin-bottom: 24px; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between;">
      
      <div>
        ${encabezadoHTML()}

        <!-- Cinta Distintiva -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 5px solid ${cPrim}; border-radius: 6px; padding: 5px 14px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 11px; font-weight: bold; color: ${cPrim}; text-transform: uppercase; letter-spacing: 0.5px;">
            RECAUDOS OFICIALES PARA FORMALIZACIÓN &bull; PÁGINA 2 DE 3
          </span>
          <span style="font-size: 10.5px; font-weight: bold; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 2px 10px; border-radius: 10px;">
            Año Escolar: ${anoEscolarDoc}
          </span>
        </div>

        <!-- Continuación Educación Inicial -->
        <div style="margin-bottom: 4px; font-weight: bold; font-size: 12.3px; color: ${cPrim};">
          Continuación Educación Inicial:
        </div>
        <ul style="margin: 0 0 14px 18px; padding: 0; line-height: 1.4; font-size: 12px; color: #1e293b;">
          ${recInicial.slice(5).map(r => `<li style="margin-bottom: 2px;">${r}</li>`).join('')}
        </ul>

        <!-- Sección Primaria -->
        <div style="background: #f1f5f9; border-left: 4px solid ${cPrim}; padding: 4px 10px; margin-bottom: 8px; font-weight: bold; font-size: 12.8px; color: #0f172a;">
          Educación Primaria
        </div>
        
        <div style="font-weight: bold; margin-left: 4px; margin-bottom: 3px; font-size: 12.3px; color: #334155;">Hijos:</div>
        <ul style="margin: 0 0 12px 18px; padding: 0; line-height: 1.4; font-size: 11.8px; color: #1e293b;">
          ${recPrimHijos.map(r => `<li style="margin-bottom: 2px;">${r}</li>`).join('')}
        </ul>

        <div style="font-weight: bold; margin-left: 4px; margin-bottom: 3px; font-size: 12.3px; color: #334155; text-decoration: underline;">Hermanos, Sobrinos y Nietos:</div>
        <ul style="margin: 0 0 14px 18px; padding: 0; line-height: 1.4; font-size: 11.8px; color: #1e293b;">
          ${recPrimFam.map(r => `<li style="margin-bottom: 2px;">${r}</li>`).join('')}
        </ul>

        <!-- Sección Media General -->
        <div style="background: #f1f5f9; border-left: 4px solid ${cPrim}; padding: 4px 10px; margin-bottom: 8px; font-weight: bold; font-size: 12.8px; color: #0f172a;">
          Educación Media General
        </div>

        <div style="font-weight: bold; margin-left: 4px; margin-bottom: 3px; font-size: 12.3px; color: #334155;">Hijos:</div>
        <ul style="margin: 0 0 12px 18px; padding: 0; line-height: 1.4; font-size: 11.8px; color: #1e293b;">
          ${recMedHijos.map(r => `<li style="margin-bottom: 2px;">${r}</li>`).join('')}
        </ul>

        <div style="font-weight: bold; margin-left: 4px; margin-bottom: 3px; font-size: 12.3px; color: #334155; text-decoration: underline;">Hermanos, Sobrinos y Nietos:</div>
        <ul style="margin: 0 0 12px 18px; padding: 0; line-height: 1.4; font-size: 11.8px; color: #1e293b;">
          ${recMedFam.map(r => `<li style="margin-bottom: 2px;">${r}</li>`).join('')}
        </ul>
      </div>

      <div>
        ${bloqueQrYRubricaHTML(2)}
        ${piePaginaHTML(2)}
      </div>
    </div>

    <!-- ══════════════════════ PÁGINA 3 ══════════════════════ -->
    <div class="carta-pagina" style="width: 816px; min-height: 1045px; padding: 28px 42px 22px 42px; box-sizing: border-box; position: relative; page-break-before: always; border: 2px solid #94a3b8; border-radius: 8px; margin-bottom: 24px; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between;">
      
      <div>
        ${encabezadoHTML()}

        <!-- Cinta Distintiva -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 5px solid ${cPrim}; border-radius: 6px; padding: 5px 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 11px; font-weight: bold; color: ${cPrim}; text-transform: uppercase; letter-spacing: 0.5px;">
            ORIENTACIONES GENERALES & FIRMAS AUTORIZADAS &bull; PÁGINA 3 DE 3
          </span>
          <span style="font-size: 10.5px; font-weight: bold; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 2px 10px; border-radius: 10px;">
            Año Escolar: ${anoEscolarDoc}
          </span>
        </div>

        <!-- Título Orientaciones Generales -->
        <div style="text-align: center; margin-bottom: 16px;">
          <h3 style="margin: 0; font-size: 15.5px; font-weight: bold; color: #0f172a;">
            Orientaciones Generales para el Proceso de Inscripción
          </h3>
        </div>

        <!-- Lista Numerada de Orientaciones -->
        <ol style="margin: 0 0 28px 22px; padding: 0; line-height: 1.55; text-align: justify; font-size: 12.5px; color: #1e293b;">
          ${orientaciones.map(o => `
            <li style="margin-bottom: 12px; padding-left: 4px; white-space: pre-line;">
              ${renderTextoConSaltos(o.replace(/{periodo_escolar}/g, anoEscolarDoc))}
            </li>
          `).join('')}
        </ol>
      </div>

      <!-- Bloque de Firma Oficial, Sellos y QR de Verificación -->
      <div>
        <div style="display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 14px; padding: 8px 16px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px;">
          
          <!-- Sello y QR de Verificación de Página 3 -->
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="text-align: center; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px; background: #ffffff;">
              <img src="${qrImageSrc}" alt="QR Verificación" crossOrigin="anonymous" style="width: 64px; height: 64px; display: block; margin: 0 auto;" />
              <span style="font-size: 7px; font-weight: bold; color: #166534; font-family: monospace; display: block; margin-top: 2px;">
                VERIFICACIÓN QR
              </span>
              <span style="font-size: 6.5px; font-weight: bold; color: #0f172a; font-family: monospace; display: block;">
                ${codigoDoc}
              </span>
            </div>
            <div style="line-height: 1.3;">
              <span style="font-size: 8px; font-weight: bold; color: #0f172a; display: block;">DOCUMENTO AUTÉNTICO</span>
              <span style="font-size: 7px; color: #64748b; font-family: monospace; display: block;">HASH: SEC-${hashSeguridad}</span>
              <span style="font-size: 7px; color: #166534; font-weight: 600; display: block;">✓ Firma Digital Certificada</span>
              <span style="font-size: 7px; color: #475569; display: block;">Página 3 de 3 Oficial</span>
            </div>
          </div>

          <!-- Firma del Director (Ajustada proporcionalmente dentro del recuadro) -->
          <div style="text-align: center; width: 280px; position: relative;">
            <p style="margin: 0 0 2px; font-size: 11px; font-weight: bold; color: #000000; text-transform: uppercase; letter-spacing: 0.5px;">Atentamente,</p>
            
            ${mostrarFirma && firmaDirectorSrc ? `
              <div style="height: 52px; display: flex; align-items: center; justify-content: center; margin-bottom: 2px;">
                <img src="${firmaDirectorSrc}" alt="Firma Digital" crossOrigin="anonymous" style="max-height: 50px; max-width: 160px; object-fit: contain; display: block;" />
              </div>
            ` : `
              <div style="height: 40px;"></div>
            `}
            
            <div style="border-top: 1.5px solid #0f172a; width: 210px; margin: 0 auto 3px auto;"></div>
            <div style="font-weight: bold; font-size: 11.5px; color: #000000; line-height: 1.25;">
              ${plantilla.titulo_director} ${plantilla.nombre_director}
            </div>
            <div style="font-size: 10px; color: #334155; line-height: 1.2;">
              C.I.: ${plantilla.cedula_director}
            </div>
            <div style="font-size: 10.5px; font-weight: bold; color: #0f172a; line-height: 1.2;">
              ${plantilla.cargo_director}
            </div>
          </div>

        </div>

        <!-- Mensaje de Agradecimiento Final -->
        <div style="text-align: center; font-weight: bold; font-size: 12.5px; line-height: 1.45; padding: 0 20px; margin-bottom: 14px; color: #334155; white-space: pre-line;">
          ${renderTextoConSaltos(plantilla.texto_agradecimiento_final.replace(/{nombre_escuela}/g, nombreEscuela))}
        </div>

        ${piePaginaHTML(3)}
      </div>

    </div>

  </div>
  `;
};

/**
 * Genera y descarga el PDF oficial de 3 páginas de la Carta de Aceptación
 */
export const descargarCartaAceptacionPDF = async (
  plantilla: PlantillaCartaAceptacionConfig,
  datos: DatosAspiranteCartaAceptacion,
  elementHtmlOrId?: HTMLElement | string
): Promise<boolean> => {
  try {
    if (Swal) {
      Swal.fire({
        title: 'Generando Carta de Aceptación Oficial...',
        text: 'Compilando formato con firmas digitales y QR de verificación...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
    }

    // 1. Obtener la firma protegida en alta definición
    let firmaBase64 = '';
    try {
      firmaBase64 = await obtenerFirmaDirectorProtegida(datos.codigo_escuela);
    } catch (e) {
      console.warn('No se pudo cargar firma digital:', e);
    }

    // 2. Si se pasó un contenedor ya renderizado, usarlo; de lo contrario crear uno temporal visible
    let container: HTMLElement;
    let isTemp = false;

    if (elementHtmlOrId instanceof HTMLElement) {
      container = elementHtmlOrId;
    } else if (typeof elementHtmlOrId === 'string' && document.getElementById(elementHtmlOrId)) {
      container = document.getElementById(elementHtmlOrId)!;
    } else {
      isTemp = true;
      container = document.createElement('div');
      container.id = 'sigae-temp-carta-pdf';
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '816px'; // Ancho de página carta (8.5in a 96dpi)
      container.style.zIndex = '-9999';
      container.style.backgroundColor = '#ffffff';
      container.style.pointerEvents = 'none';
      container.style.visibility = 'visible';
      container.style.opacity = '1';
      container.innerHTML = renderCartaAceptacionHTML(plantilla, datos, firmaBase64);
      document.body.appendChild(container);
    }

    const filename = `Carta_Aceptacion_${datos.codigo_escuela.toUpperCase()}_${datos.representante_cedula.replace(/\D/g, '')}_${datos.estudiante_apellidos.replace(/\s+/g, '_')}.pdf`;

    // 3. Esperar que todas las imágenes internas (logos, QR, firma) se hayan cargado
    const imgs = Array.from(container.querySelectorAll('img'));
    await Promise.all(
      imgs.map(img => {
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
          setTimeout(resolve, 2000);
        });
      })
    );
    // Pausa breve para renderizado de fuentes
    await new Promise(r => setTimeout(r, 200));

    // 4. Capturar página por página con html2canvas y jsPDF para garantizar contenido nítido y sin hojas en blanco
    const pages = container.querySelectorAll('.carta-pagina');
    if (pages.length === 0) {
      throw new Error('No se encontraron páginas para renderizar en la Carta de Aceptación.');
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    for (let i = 0; i < pages.length; i++) {
      const pageEl = pages[i] as HTMLElement;
      
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 816,
        windowWidth: 1024
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      if (i > 0) {
        doc.addPage('letter', 'p');
      }
      // Tamaño Carta exacto: 215.9mm ancho x 279.4mm alto
      doc.addImage(imgData, 'JPEG', 0, 0, 215.9, 279.4);
    }

    doc.save(filename);

    if (isTemp && container.parentNode) {
      container.parentNode.removeChild(container);
    }

    if (Swal) {
      Swal.close();
      Swal.fire({
        icon: 'success',
        title: '¡Carta de Aceptación Descargada!',
        text: 'El documento oficial de 3 páginas con firma digital y código QR se ha generado correctamente.',
        confirmButtonColor: '#047857'
      });
    }

    return true;
  } catch (err: any) {
    console.error('Error generando Carta de Aceptación PDF:', err);
    if (Swal) {
      Swal.close();
      Swal.fire('Error', 'No se pudo generar el archivo PDF de la carta de aceptación.', 'error');
    }
    return false;
  }
};
