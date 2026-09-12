import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { usePermisos } from '../../hooks/usePermisos';
import { auditar } from '../../lib/audit';
import { resolverEscuelaEstudiante } from '../../utils/firmasSeguras';
import { ChamiloBreadcrumb, ChamiloHelpCallout, IconoDocumentoDigital } from '../../components/chamilo';
import { 
  obtenerPlantillaCarnet, 
  guardarPlantillaCarnet, 
  prepararDatosCarnet, 
  renderCarnetContainerHTML,
  descargarCarnetPDF
} from '../../utils/generadorCarnet';
import {
  PLANTILLAS_ACEPTACION_DEFAULT,
  renderCartaAceptacionHTML,
  descargarCartaAceptacionPDF,
  obtenerPlantillasCartaAceptacion,
  guardarPlantillasCartaAceptacion,
  obtenerFasesPlantilla,
  type PlantillaCartaAceptacionConfig,
  type DatosAspiranteCartaAceptacion,
  type PasoFaseAceptacion
} from '../../utils/generadorCartaAceptacion';
import {
  PLANTILLAS_NORMAS_DEFAULT,
  renderNormasInternasHTML,
  descargarNormasInternasPDF,
  obtenerPlantillasNormasInternas,
  guardarPlantillasNormasInternas,
  type PlantillaNormasInternasConfig,
  type DatosEstudianteNormasInternas
} from '../../utils/generadorNormasInternas';
import { 
  esDocumentoActivo, 
  obtenerConfiguracionDocumentos, 
  guardarConfiguracionDocumentosBD
} from '../../utils/gestorDocumentosActivos';
import type { ConfiguracionDocumentosYDIsenos } from '../../utils/gestorDocumentosActivos';
import type { DatosCarnetProcesados } from '../../utils/generadorCarnet';

declare const Swal: any;
declare const html2pdf: any;

export interface PlantillaConstancia {
  id: string;
  codigo_tipo: string; // 'inscripcion', 'estudio', 'conducta', 'retiro', 'personalizada', 'carnet', 'aceptacion'
  nombre: string;
  id_escuela: string; // 'sb', 'lb', 'todas'
  titulo_documento: string;
  
  // Encabezado y Membrete
  mostrar_bandera_venezuela: boolean;
  logo_escuela_url: string;
  membrete_linea1: string;
  membrete_linea2: string;
  membrete_nombre_escuela: string;
  membrete_ubicacion: string;
  
  // Redacción de Párrafos
  parrafo_certificacion: string;
  parrafo_representante: string;
  parrafo_expedicion: string;
  ciudad_expedicion: string;
  
  // Firmante / Dirección
  titulo_director: string; // Profa. / Prof.
  nombre_director: string; // Elika Dayana Chaviel Rondón / José Vicente Millán Montaño
  cedula_director: string; // 16.808.608 / 17.780.095
  cargo_director: string;  // Directora de la Unidad Educativa Santa Bárbara
  cargo_generico: string;  // Directora / Director
  firma_digital_url: string; // /assets/img/firma_director_sb.png
  mostrar_firma_digital: boolean;
  
  // Sello y QR
  sello_humedo_url?: string;
  mostrar_sello_humedo: boolean;
  mostrar_codigo_qr: boolean;
  logo_mppe_url: string;
  
  // Estilos
  fuente_familia: string;
  tamano_fuente: number;
  interlineado: number;

  // Campos específicos de Carta de Aceptación
  periodo_escolar?: string;
  texto_notificacion_intro?: string;
  texto_aprobacion_parrafo?: string;
  texto_fases_intro?: string;
  fases?: PasoFaseAceptacion[];
  fase1_titulo?: string;
  fase1_texto?: string;
  fase2_titulo?: string;
  fase2_texto?: string;
  fase3_titulo?: string;
  fase3_fecha?: string;
  fase3_lugar?: string;
  fase3_hora?: string;
  fase3_texto?: string;
  recaudos_carpeta_nota?: string;
  recaudos_inicial?: string | string[];
  recaudos_primaria_hijos?: string | string[];
  recaudos_primaria_familiares?: string | string[];
  recaudos_media_hijos?: string | string[];
  recaudos_media_familiares?: string | string[];
  orientaciones_generales?: string | string[];
  texto_agradecimiento_final?: string;

  // Campos específicos de Normas Internas
  hora_entrada?: string;
  uniforme_inicial?: string | string[];
  uniforme_primaria?: string | string[];
  uniforme_media?: string | string[];
  uniforme_educacion_fisica?: string | string[];
  transporte_escolar?: string;
  otros_aspectos?: string | string[];
  deberes_representantes?: string | string[];
  zonificacion_residencia?: string | string[];
  apego_normativas?: string | string[];
  zonificacion_repitencias?: string | string[];
  texto_declaracion_compromiso?: string;
  
  created_at?: string;
  updated_at?: string;
}

const PLANTILLAS_PREDETERMINADAS: PlantillaConstancia[] = [
  {
    id: 'CONST-INSC-SB',
    codigo_tipo: 'inscripcion',
    nombre: 'Constancia de Inscripción Oficial (U.E. Santa Bárbara)',
    id_escuela: 'sb',
    titulo_documento: 'Constancia de Inscripción',
    mostrar_bandera_venezuela: true,
    logo_escuela_url: '/assets/img/logo_sb.png',
    membrete_linea1: 'República Bolivariana de Venezuela',
    membrete_linea2: 'Ministerio del Poder Popular para la Educación',
    membrete_nombre_escuela: 'Unidad Educativa Santa Bárbara',
    membrete_ubicacion: 'El Tejero, estado Monagas',
    parrafo_certificacion: `Quien suscribe, <b>{titulo_director} {nombre_director}</b>, {cargo_generico} de la <b>{nombre_escuela}</b>, que funciona en <b>{ubicacion_escuela}</b>, por medio de la presente hace constar que el/la estudiante: <b>{nombre_estudiante}</b>, natural de <b>{lugar_nacimiento}</b>, estado <b>{estado_nacimiento}</b>, titular de la {tipo_cedula} N.° <b>{cedula_estudiante}</b>, fue inscrito/a para cursar el <b>{grado_actual}</b> de <b>{nivel_educativo}</b> en este instituto durante el año escolar <b>{periodo_escolar}</b>.`,
    parrafo_representante: `Asimismo, se deja constancia que el representante legal del/de la estudiante es <b>{nombre_representante}</b>, titular de la cédula de identidad N.° <b>{cedula_representante}</b>, quien ha cumplido con los requisitos establecidos para la formalización de la inscripción.`,
    parrafo_expedicion: `Constancia que se expide para los efectos y fines consiguientes en <b>{ciudad_expedicion}</b>, a los {dia_expedicion} días del mes de {mes_expedicion} del año {ano_expedicion}.`,
    ciudad_expedicion: 'El Tejero',
    titulo_director: 'Profa.',
    nombre_director: 'Elika Dayana Chaviel Rondón',
    cedula_director: '16.808.608',
    cargo_director: 'Directora de la Unidad Educativa Santa Bárbara',
    cargo_generico: 'Directora',
    firma_digital_url: '/assets/img/firma_director_sb.png',
    mostrar_firma_digital: true,
    sello_humedo_url: '',
    mostrar_sello_humedo: false,
    mostrar_codigo_qr: true,
    logo_mppe_url: '/assets/img/logoMPPE.png',
    fuente_familia: 'Arial, Helvetica, sans-serif',
    tamano_fuente: 14.5,
    interlineado: 2.15
  },
  {
    id: 'CONST-INSC-LB',
    codigo_tipo: 'inscripcion',
    nombre: 'Constancia de Inscripción Oficial (U.E. Libertador Bolívar)',
    id_escuela: 'lb',
    titulo_documento: 'Constancia de Inscripción',
    mostrar_bandera_venezuela: true,
    logo_escuela_url: '/assets/img/logo_lb.png',
    membrete_linea1: 'República Bolivariana de Venezuela',
    membrete_linea2: 'Ministerio del Poder Popular para la Educación',
    membrete_nombre_escuela: 'Unidad Educativa Libertador Bolívar',
    membrete_ubicacion: 'Miraflores, estado Monagas',
    parrafo_certificacion: `Quien suscribe, <b>{titulo_director} {nombre_director}</b>, {cargo_generico} de la <b>{nombre_escuela}</b>, que funciona en <b>{ubicacion_escuela}</b>, por medio de la presente hace constar que el/la estudiante: <b>{nombre_estudiante}</b>, natural de <b>{lugar_nacimiento}</b>, estado <b>{estado_nacimiento}</b>, titular de la {tipo_cedula} N.° <b>{cedula_estudiante}</b>, fue inscrito/a para cursar el <b>{grado_actual}</b> de <b>{nivel_educativo}</b> en este instituto durante el año escolar <b>{periodo_escolar}</b>.`,
    parrafo_representante: `Asimismo, se deja constancia que el representante legal del/de la estudiante es <b>{nombre_representante}</b>, titular de la cédula de identidad N.° <b>{cedula_representante}</b>, quien ha cumplido con los requisitos establecidos para la formalización de la inscripción.`,
    parrafo_expedicion: `Constancia que se expide para los efectos y fines consiguientes en <b>{ciudad_expedicion}</b>, a los {dia_expedicion} días del mes de {mes_expedicion} del año {ano_expedicion}.`,
    ciudad_expedicion: 'Miraflores',
    titulo_director: 'Prof.',
    nombre_director: 'José Vicente Millán Montaño',
    cedula_director: '17.780.095',
    cargo_director: 'Director de la Unidad Educativa Libertador Bolívar',
    cargo_generico: 'Director',
    firma_digital_url: '/assets/img/firma_director_lb.png',
    mostrar_firma_digital: true,
    sello_humedo_url: '',
    mostrar_sello_humedo: false,
    mostrar_codigo_qr: true,
    logo_mppe_url: '/assets/img/logoMPPE.png',
    fuente_familia: 'Arial, Helvetica, sans-serif',
    tamano_fuente: 14.5,
    interlineado: 2.15
  },
  {
    id: 'CONST-ESTUDIO-GEN',
    codigo_tipo: 'estudio',
    nombre: 'Constancia de Estudio Regular',
    id_escuela: 'todas',
    titulo_documento: 'Constancia de Estudio',
    mostrar_bandera_venezuela: true,
    logo_escuela_url: '/assets/img/logo_sb.png',
    membrete_linea1: 'República Bolivariana de Venezuela',
    membrete_linea2: 'Ministerio del Poder Popular para la Educación',
    membrete_nombre_escuela: '{nombre_escuela}',
    membrete_ubicacion: '{ubicacion_escuela}',
    parrafo_certificacion: `Quien suscribe, la Dirección de la <b>{nombre_escuela}</b>, hace constar por medio de la presente que el/la estudiante: <b>{nombre_estudiante}</b>, titular de la {tipo_cedula} N.° <b>{cedula_estudiante}</b>, es estudiante regular y se encuentra cursando activamente el <b>{grado_actual}</b> de <b>{nivel_educativo}</b> durante el año escolar <b>{periodo_escolar}</b>.`,
    parrafo_representante: `Se deja constancia de su intachable rendimiento escolar y asistencia en las actividades académicas programadas por la institución.`,
    parrafo_expedicion: `Constancia que se expide a solicitud de la parte interesada a los fines consiguientes en <b>{ciudad_expedicion}</b>, a los {dia_expedicion} días del mes de {mes_expedicion} del año {ano_expedicion}.`,
    ciudad_expedicion: 'El Tejero',
    titulo_director: 'Profa.',
    nombre_director: 'Elika Dayana Chaviel Rondón',
    cedula_director: '16.808.608',
    cargo_director: 'Directora General',
    cargo_generico: 'Directora',
    firma_digital_url: '/assets/img/firma_director_sb.png',
    mostrar_firma_digital: true,
    sello_humedo_url: '',
    mostrar_sello_humedo: false,
    mostrar_codigo_qr: true,
    logo_mppe_url: '/assets/img/logoMPPE.png',
    fuente_familia: 'Arial, Helvetica, sans-serif',
    tamano_fuente: 14.5,
    interlineado: 2.15
  },
  {
    id: 'CONST-CONDUCTA-GEN',
    codigo_tipo: 'conducta',
    nombre: 'Constancia de Buena Conducta',
    id_escuela: 'todas',
    titulo_documento: 'Constancia de Buena Conducta',
    mostrar_bandera_venezuela: true,
    logo_escuela_url: '/assets/img/logo_lb.png',
    membrete_linea1: 'República Bolivariana de Venezuela',
    membrete_linea2: 'Ministerio del Poder Popular para la Educación',
    membrete_nombre_escuela: '{nombre_escuela}',
    membrete_ubicacion: '{ubicacion_escuela}',
    parrafo_certificacion: `Quien suscribe, la Dirección de la <b>{nombre_escuela}</b>, hace constar por medio de la presente que el/la estudiante: <b>{nombre_estudiante}</b>, titular de la {tipo_cedula} N.° <b>{cedula_estudiante}</b>, quien cursa el <b>{grado_actual}</b> de <b>{nivel_educativo}</b>, ha observado durante su permanencia en nuestra institución una <b>EXCELENTE CONDUCTA</b>, demostrando respeto por las normas de convivencia y valores ciudadanos.`,
    parrafo_representante: `Asimismo, se deja constancia de su intachable colaboración en las actividades comunitarias y formativas de la institución.`,
    parrafo_expedicion: `Constancia que se expide a solicitud de la parte interesada en <b>{ciudad_expedicion}</b>, a los {dia_expedicion} días del mes de {mes_expedicion} del año {ano_expedicion}.`,
    ciudad_expedicion: 'Miraflores',
    titulo_director: 'Prof.',
    nombre_director: 'José Vicente Millán Montaño',
    cedula_director: '17.780.095',
    cargo_director: 'Director General',
    cargo_generico: 'Director',
    firma_digital_url: '/assets/img/firma_director_lb.png',
    mostrar_firma_digital: true,
    sello_humedo_url: '',
    mostrar_sello_humedo: false,
    mostrar_codigo_qr: true,
    logo_mppe_url: '/assets/img/logoMPPE.png',
    fuente_familia: 'Arial, Helvetica, sans-serif',
    tamano_fuente: 14.5,
    interlineado: 2.15
  },
  {
    id: 'CARNET-ESTUDIANTIL-SB',
    codigo_tipo: 'carnet',
    nombre: 'Carnet Estudiantil Oficial (U.E. Santa Bárbara)',
    id_escuela: 'sb',
    titulo_documento: 'Carnet Estudiantil',
    mostrar_bandera_venezuela: true,
    logo_escuela_url: '/assets/img/logo_sb.png',
    membrete_linea1: 'República Bolivariana de Venezuela',
    membrete_linea2: 'Ministerio del Poder Popular para la Educación',
    membrete_nombre_escuela: 'Unidad Educativa Santa Bárbara',
    membrete_ubicacion: 'El Tejero, estado Monagas',
    parrafo_certificacion: 'Este carnet es personal e intransferible. Acredita a <b>{nombre_estudiante}</b> (C.I. {cedula_estudiante}) como estudiante regular de la <b>{nombre_escuela}</b> para el Año Escolar <b>{periodo_escolar}</b>.',
    parrafo_representante: 'En caso de emergencia o extravío, favor contactar al representante legal <b>{nombre_representante}</b> al teléfono <b>{telefono_representante}</b>.',
    parrafo_expedicion: 'Válido durante el Año Escolar {periodo_escolar}.',
    ciudad_expedicion: 'El Tejero',
    titulo_director: 'Profa.',
    nombre_director: 'Elika Dayana Chaviel Rondón',
    cedula_director: '16.808.608',
    cargo_director: 'Directora de la Unidad Educativa Santa Bárbara',
    cargo_generico: 'Directora',
    firma_digital_url: '/assets/img/firma_director_sb.png',
    mostrar_firma_digital: true,
    sello_humedo_url: '',
    mostrar_sello_humedo: false,
    mostrar_codigo_qr: true,
    logo_mppe_url: '/assets/img/logoMPPE.png',
    fuente_familia: 'Arial, Helvetica, sans-serif',
    tamano_fuente: 12,
    interlineado: 1.5
  },
  {
    id: 'CARNET-ESTUDIANTIL-LB',
    codigo_tipo: 'carnet',
    nombre: 'Carnet Estudiantil Oficial (U.E. Libertador Bolívar)',
    id_escuela: 'lb',
    titulo_documento: 'Carnet Estudiantil',
    mostrar_bandera_venezuela: true,
    logo_escuela_url: '/assets/img/logo_lb.png',
    membrete_linea1: 'República Bolivariana de Venezuela',
    membrete_linea2: 'Ministerio del Poder Popular para la Educación',
    membrete_nombre_escuela: 'Unidad Educativa Libertador Bolívar',
    membrete_ubicacion: 'Miraflores, estado Monagas',
    parrafo_certificacion: 'Este carnet es personal e intransferible. Acredita a <b>{nombre_estudiante}</b> (C.I. {cedula_estudiante}) como estudiante regular de la <b>{nombre_escuela}</b> para el Año Escolar <b>{periodo_escolar}</b>.',
    parrafo_representante: 'En caso de emergencia o extravío, favor contactar al representante legal <b>{nombre_representante}</b> al teléfono <b>{telefono_representante}</b>.',
    parrafo_expedicion: 'Válido durante el Año Escolar {periodo_escolar}.',
    ciudad_expedicion: 'Miraflores',
    titulo_director: 'Prof.',
    nombre_director: 'José Vicente Millán Montaño',
    cedula_director: '17.780.095',
    cargo_director: 'Director de la Unidad Educativa Libertador Bolívar',
    cargo_generico: 'Director',
    firma_digital_url: '/assets/img/firma_director_lb.png',
    mostrar_firma_digital: true,
    sello_humedo_url: '',
    mostrar_sello_humedo: false,
    mostrar_codigo_qr: true,
    logo_mppe_url: '/assets/img/logoMPPE.png',
    fuente_familia: 'Arial, Helvetica, sans-serif',
    tamano_fuente: 12,
    interlineado: 1.5
  },
  {
    id: 'CONST-ACEPT-LB',
    codigo_tipo: 'aceptacion',
    nombre: 'Carta de Aceptación Oficial (U.E. Libertador Bolívar)',
    id_escuela: 'lb',
    titulo_documento: 'Carta de Aceptación',
    periodo_escolar: '2026 - 2027',
    mostrar_bandera_venezuela: true,
    logo_escuela_url: '/assets/img/logo_lb.png',
    membrete_linea1: 'República Bolivariana de Venezuela.',
    membrete_linea2: 'Ministerio del Poder Popular para la Educación.',
    membrete_nombre_escuela: 'Unidad Educativa Libertador Bolívar',
    membrete_ubicacion: 'Miraflores, estado Monagas.',
    parrafo_certificacion: 'Por medio de la presente, nos complace informarle que su solicitud de inscripción para el año escolar 2026-2027 ha sido evaluada y aprobada satisfactoriamente, ya que contamos con la disponibilidad de cupos para admitir a su representado(a).',
    parrafo_representante: ' ',
    parrafo_expedicion: 'El proceso de inscripción se llevará a cabo en tres (3) fases, las cuales detallamos a continuación:',
    texto_fases_intro: 'El proceso de inscripción se llevará a cabo en tres (3) fases, las cuales detallamos a continuación:',
    ciudad_expedicion: 'Miraflores',
    titulo_director: 'Prof.',
    nombre_director: 'José Vicente Millán Montaño',
    cedula_director: '17.780.095',
    cargo_director: 'Director de Unidad Educativa Libertador Bolívar',
    cargo_generico: 'Director',
    firma_digital_url: '/assets/img/firma_director_lb.png',
    mostrar_firma_digital: true,
    sello_humedo_url: '',
    mostrar_sello_humedo: false,
    mostrar_codigo_qr: true,
    logo_mppe_url: '/assets/img/logoMPPE.png',
    fuente_familia: 'Arial, Helvetica, sans-serif',
    tamano_fuente: 13.5,
    interlineado: 1.5,
    fases: PLANTILLAS_ACEPTACION_DEFAULT.lb.fases,
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
    recaudos_inicial: PLANTILLAS_ACEPTACION_DEFAULT.lb.recaudos_inicial,
    recaudos_primaria_hijos: PLANTILLAS_ACEPTACION_DEFAULT.lb.recaudos_primaria_hijos,
    recaudos_primaria_familiares: PLANTILLAS_ACEPTACION_DEFAULT.lb.recaudos_primaria_familiares,
    recaudos_media_hijos: PLANTILLAS_ACEPTACION_DEFAULT.lb.recaudos_media_hijos,
    recaudos_media_familiares: PLANTILLAS_ACEPTACION_DEFAULT.lb.recaudos_media_familiares,
    orientaciones_generales: PLANTILLAS_ACEPTACION_DEFAULT.lb.orientaciones_generales,
    texto_agradecimiento_final: 'Gracias por usar el Sistema Integral de Gestión y Administración Escolar de la Unidad Educativa Libertador Bolívar y preferirnos para la formación de su representado o representada.'
  },
  {
    id: 'CONST-ACEPT-SB',
    codigo_tipo: 'aceptacion',
    nombre: 'Carta de Aceptación Oficial (U.E. Santa Bárbara)',
    id_escuela: 'sb',
    titulo_documento: 'Carta de Aceptación',
    periodo_escolar: '2026 - 2027',
    mostrar_bandera_venezuela: true,
    logo_escuela_url: '/assets/img/logo_sb.png',
    membrete_linea1: 'República Bolivariana de Venezuela.',
    membrete_linea2: 'Ministerio del Poder Popular para la Educación.',
    membrete_nombre_escuela: 'Unidad Educativa Santa Bárbara',
    membrete_ubicacion: 'El Tejero, estado Monagas.',
    parrafo_certificacion: 'Por medio de la presente, nos complace informarle que su solicitud de inscripción para el año escolar 2026-2027 ha sido evaluada y aprobada satisfactoriamente, ya que contamos con la disponibilidad de cupos para admitir a su representado(a).',
    parrafo_representante: ' ',
    parrafo_expedicion: 'El proceso de inscripción se llevará a cabo en tres (3) fases, las cuales detallamos a continuación:',
    texto_fases_intro: 'El proceso de inscripción se llevará a cabo en tres (3) fases, las cuales detallamos a continuación:',
    ciudad_expedicion: 'El Tejero',
    titulo_director: 'Profa.',
    nombre_director: 'Elika Dayana Chaviel Rondón',
    cedula_director: '16.808.608',
    cargo_director: 'Directora de Unidad Educativa Santa Bárbara',
    cargo_generico: 'Directora',
    firma_digital_url: '/assets/img/firma_director_sb.png',
    mostrar_firma_digital: true,
    sello_humedo_url: '',
    mostrar_sello_humedo: false,
    mostrar_codigo_qr: true,
    logo_mppe_url: '/assets/img/logoMPPE.png',
    fuente_familia: 'Arial, Helvetica, sans-serif',
    tamano_fuente: 13.5,
    interlineado: 1.5,
    fases: PLANTILLAS_ACEPTACION_DEFAULT.sb.fases,
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
    recaudos_inicial: PLANTILLAS_ACEPTACION_DEFAULT.sb.recaudos_inicial,
    recaudos_primaria_hijos: PLANTILLAS_ACEPTACION_DEFAULT.sb.recaudos_primaria_hijos,
    recaudos_primaria_familiares: PLANTILLAS_ACEPTACION_DEFAULT.sb.recaudos_primaria_familiares,
    recaudos_media_hijos: PLANTILLAS_ACEPTACION_DEFAULT.sb.recaudos_media_hijos,
    recaudos_media_familiares: PLANTILLAS_ACEPTACION_DEFAULT.sb.recaudos_media_familiares,
    orientaciones_generales: PLANTILLAS_ACEPTACION_DEFAULT.sb.orientaciones_generales,
    texto_agradecimiento_final: 'Gracias por usar el Sistema Integral de Gestión y Administración Escolar de la Unidad Educativa Santa Bárbara y preferirnos para la formación de su representado o personalizada.'
  },
  {
    id: 'NORMAS-CONV-SB',
    codigo_tipo: 'normas',
    nombre: 'Normativa Interna Oficial (U.E. Santa Bárbara)',
    id_escuela: 'sb',
    titulo_documento: 'Normativa Interna',
    periodo_escolar: '2026 - 2027',
    mostrar_bandera_venezuela: true,
    logo_escuela_url: '/assets/img/logo_sb.png',
    membrete_linea1: 'República Bolivariana de Venezuela.',
    membrete_linea2: 'Ministerio del Poder Popular para la Educación.',
    membrete_nombre_escuela: 'Unidad Educativa Santa Bárbara',
    membrete_ubicacion: 'El Tejero, estado Monagas.',
    parrafo_certificacion: PLANTILLAS_NORMAS_DEFAULT.sb.texto_introductorio,
    parrafo_representante: '',
    parrafo_expedicion: '',
    ciudad_expedicion: 'El Tejero',
    titulo_director: 'Profa.',
    nombre_director: 'Elika Dayana Chaviel Rondón',
    cedula_director: '16.808.608',
    cargo_director: 'Directora de Unidad Educativa Santa Bárbara',
    cargo_generico: 'Directora',
    firma_digital_url: '/assets/img/firma_director_sb.png',
    mostrar_firma_digital: true,
    sello_humedo_url: '',
    mostrar_sello_humedo: false,
    mostrar_codigo_qr: true,
    logo_mppe_url: '/assets/img/logoMPPE.png',
    fuente_familia: 'Arial, Helvetica, sans-serif',
    tamano_fuente: 12,
    interlineado: 1.4,
    hora_entrada: PLANTILLAS_NORMAS_DEFAULT.sb.hora_entrada,
    uniforme_inicial: PLANTILLAS_NORMAS_DEFAULT.sb.uniforme_inicial,
    uniforme_primaria: PLANTILLAS_NORMAS_DEFAULT.sb.uniforme_primaria,
    uniforme_media: PLANTILLAS_NORMAS_DEFAULT.sb.uniforme_media,
    uniforme_educacion_fisica: PLANTILLAS_NORMAS_DEFAULT.sb.uniforme_educacion_fisica,
    transporte_escolar: PLANTILLAS_NORMAS_DEFAULT.sb.transporte_escolar,
    otros_aspectos: PLANTILLAS_NORMAS_DEFAULT.sb.otros_aspectos,
    deberes_representantes: PLANTILLAS_NORMAS_DEFAULT.sb.deberes_representantes,
    zonificacion_residencia: PLANTILLAS_NORMAS_DEFAULT.sb.zonificacion_residencia,
    apego_normativas: PLANTILLAS_NORMAS_DEFAULT.sb.apego_normativas,
    zonificacion_repitencias: PLANTILLAS_NORMAS_DEFAULT.sb.zonificacion_repitencias,
    texto_declaracion_compromiso: PLANTILLAS_NORMAS_DEFAULT.sb.texto_declaracion_compromiso
  },
  {
    id: 'NORMAS-CONV-LB',
    codigo_tipo: 'normas',
    nombre: 'Normativa Interna Oficial (U.E. Libertador Bolívar)',
    id_escuela: 'lb',
    titulo_documento: 'Normativa Interna',
    periodo_escolar: '2026 - 2027',
    mostrar_bandera_venezuela: true,
    logo_escuela_url: '/assets/img/logo_lb.png',
    membrete_linea1: 'República Bolivariana de Venezuela.',
    membrete_linea2: 'Ministerio del Poder Popular para la Educación.',
    membrete_nombre_escuela: 'Unidad Educativa Libertador Bolívar',
    membrete_ubicacion: 'Miraflores, estado Monagas.',
    parrafo_certificacion: PLANTILLAS_NORMAS_DEFAULT.lb.texto_introductorio,
    parrafo_representante: '',
    parrafo_expedicion: '',
    ciudad_expedicion: 'Miraflores',
    titulo_director: 'Prof.',
    nombre_director: 'José Vicente Millán Montaño',
    cedula_director: '17.780.095',
    cargo_director: 'Director de Unidad Educativa Libertador Bolívar',
    cargo_generico: 'Director',
    firma_digital_url: '/assets/img/firma_director_lb.png',
    mostrar_firma_digital: true,
    sello_humedo_url: '',
    mostrar_sello_humedo: false,
    mostrar_codigo_qr: true,
    logo_mppe_url: '/assets/img/logoMPPE.png',
    fuente_familia: 'Arial, Helvetica, sans-serif',
    tamano_fuente: 12,
    interlineado: 1.4,
    hora_entrada: PLANTILLAS_NORMAS_DEFAULT.lb.hora_entrada,
    uniforme_inicial: PLANTILLAS_NORMAS_DEFAULT.lb.uniforme_inicial,
    uniforme_primaria: PLANTILLAS_NORMAS_DEFAULT.lb.uniforme_primaria,
    uniforme_media: PLANTILLAS_NORMAS_DEFAULT.lb.uniforme_media,
    uniforme_educacion_fisica: PLANTILLAS_NORMAS_DEFAULT.lb.uniforme_educacion_fisica,
    transporte_escolar: PLANTILLAS_NORMAS_DEFAULT.lb.transporte_escolar,
    otros_aspectos: PLANTILLAS_NORMAS_DEFAULT.lb.otros_aspectos,
    deberes_representantes: PLANTILLAS_NORMAS_DEFAULT.lb.deberes_representantes,
    zonificacion_residencia: PLANTILLAS_NORMAS_DEFAULT.lb.zonificacion_residencia,
    apego_normativas: PLANTILLAS_NORMAS_DEFAULT.lb.apego_normativas,
    zonificacion_repitencias: PLANTILLAS_NORMAS_DEFAULT.lb.zonificacion_repitencias,
    texto_declaracion_compromiso: PLANTILLAS_NORMAS_DEFAULT.lb.texto_declaracion_compromiso
  }
];

interface BarraHerramientasFormatoProps {
  textareaId: string;
  value: string;
  onChange: (val: string) => void;
  mostrarSaltoPagina?: boolean;
}

const BarraHerramientasFormato: React.FC<BarraHerramientasFormatoProps> = ({
  textareaId,
  value,
  onChange,
  mostrarSaltoPagina = false
}) => {
  const aplicar = (prefix: string, suffix: string = '', placeholder: string = '') => {
    const el = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    const str = value || '';
    if (!el) {
      onChange(str + prefix + placeholder + suffix);
      return;
    }
    const start = el.selectionStart ?? str.length;
    const end = el.selectionEnd ?? str.length;
    const seleccionado = str.substring(start, end);
    const insertar = seleccionado.length > 0
      ? `${prefix}${seleccionado}${suffix}`
      : `${prefix}${placeholder}${suffix}`;
    const nuevo = str.substring(0, start) + insertar + str.substring(end);
    onChange(nuevo);

    setTimeout(() => {
      el.focus();
      if (seleccionado.length > 0) {
        el.setSelectionRange(start, start + insertar.length);
      } else {
        el.setSelectionRange(start + prefix.length, start + prefix.length + placeholder.length);
      }
    }, 15);
  };

  return (
    <div className="d-flex flex-wrap align-items-center gap-1 mb-1 p-1 bg-light border border-bottom-0 rounded-top" style={{ fontSize: '11px' }}>
      <span className="text-muted small fw-semibold px-1 me-1 d-none d-sm-inline">
        <i className="bi bi-fonts me-1"></i>Formato:
      </span>
      <button
        type="button"
        className="btn btn-xs btn-white border shadow-xs px-2 py-0.5 fw-bold"
        title="Negrita (**texto**)"
        onClick={() => aplicar('**', '**', 'texto en negrita')}
      >
        <i className="bi bi-type-bold"></i> <strong>B</strong>
      </button>
      <button
        type="button"
        className="btn btn-xs btn-white border shadow-xs px-2 py-0.5 fst-italic"
        title="Cursiva (*texto*)"
        onClick={() => aplicar('*', '*', 'texto en cursiva')}
      >
        <i className="bi bi-type-italic"></i> <em>I</em>
      </button>
      <button
        type="button"
        className="btn btn-xs btn-white border shadow-xs px-2 py-0.5 text-decoration-underline"
        title="Subrayado (__texto__)"
        onClick={() => aplicar('__', '__', 'texto subrayado')}
      >
        <i className="bi bi-type-underline"></i> <u>U</u>
      </button>
      <button
        type="button"
        className="btn btn-xs btn-white border shadow-xs px-2 py-0.5 text-decoration-line-through text-muted"
        title="Tachado (~~texto~~)"
        onClick={() => aplicar('~~', '~~', 'texto tachado')}
      >
        <i className="bi bi-type-strikethrough"></i> S
      </button>
      <button
        type="button"
        className="btn btn-xs btn-warning-subtle text-warning-emphasis border shadow-xs px-2 py-0.5 fw-semibold"
        title="Resaltado (==texto==)"
        onClick={() => aplicar('==', '==', 'texto resaltado')}
      >
        <i className="bi bi-highlighter me-0.5"></i> Resaltar
      </button>
      {mostrarSaltoPagina && (
        <button
          type="button"
          className="btn btn-xs btn-info-subtle text-info-emphasis border shadow-xs px-2 py-0.5 fw-semibold ms-auto"
          title="Insertar Salto a Nueva Página Oficial"
          onClick={() => aplicar('\n[SALTO_PAGINA]\n', '', '')}
        >
          <i className="bi bi-file-earmark-break me-1"></i> Salto de Página
        </button>
      )}
    </div>
  );
};

export interface EditorConstanciasProps {
  tipoInicial?: 'TODAS' | 'CONSTANCIAS' | 'CARNETS' | 'ACEPTACION' | 'NORMAS';
}

export const EditorConstancias: React.FC<EditorConstanciasProps> = ({ tipoInicial }) => {
  usePermisos();
  const [plantillas, setPlantillas] = useState<PlantillaConstancia[]>(PLANTILLAS_PREDETERMINADAS);
  const [plantillaActivaId, setPlantillaActivaId] = useState<string>(PLANTILLAS_PREDETERMINADAS[0].id);
  const [plantillaEdicion, setPlantillaEdicion] = useState<PlantillaConstancia>(PLANTILLAS_PREDETERMINADAS[0]);
  
  // Categoría de filtro de plantillas
  const [filtroTipoPlantilla, setFiltroTipoPlantilla] = useState<'TODAS' | 'CONSTANCIAS' | 'CARNETS' | 'ACEPTACION' | 'NORMAS'>(tipoInicial || 'TODAS');

  // Pestañas del Editor
  const [tabEditor, setTabEditor] = useState<'grafica' | 'redaccion' | 'firmas' | 'seguridad'>('firmas');
  
  // Datos para el Probador en Vivo
  const [estudiantesMuestra, setEstudiantesMuestra] = useState<any[]>([]);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<any | null>(null);
  const [searchEstudianteMuestra, setSearchEstudianteMuestra] = useState<string>('');
  
  // Estado para el Carnet en vivo
  const [datosCarnetPrueba, setDatosCarnetPrueba] = useState<DatosCarnetProcesados | null>(null);
  const [configDocs, setConfigDocs] = useState<ConfiguracionDocumentosYDIsenos>(obtenerConfiguracionDocumentos());

  useEffect(() => {
    const handleCfgChange = () => setConfigDocs(obtenerConfiguracionDocumentos());
    window.addEventListener('sigae-documentos-config-changed', handleCfgChange);
    return () => window.removeEventListener('sigae-documentos-config-changed', handleCfgChange);
  }, []);

  const esPlantillaActualActiva = useMemo(() => {
    const esc = plantillaEdicion?.id_escuela || 'sb';
    const tipo = plantillaEdicion?.codigo_tipo;
    if (tipo === 'carnet') return esDocumentoActivo('carnet', esc);
    if (tipo === 'inscripcion') return esDocumentoActivo('inscripcion', esc);
    if (tipo === 'estudio') return esDocumentoActivo('estudio', esc);
    if (tipo === 'conducta') return esDocumentoActivo('conducta', esc);
    if (tipo === 'aceptacion') return esDocumentoActivo('aceptacion', esc);
    if (tipo === 'normas') return esDocumentoActivo('normas', esc);
    return true;
  }, [plantillaEdicion, configDocs]);

  const handleToggleEstadoPlantillaActual = async () => {
    const esc = plantillaEdicion?.id_escuela || 'sb';
    const tipo = plantillaEdicion?.codigo_tipo;
    const nuevoEstado = !esPlantillaActualActiva;
    const nuevaCfg = { ...configDocs };

    if (tipo === 'carnet') {
      if (esc === 'sb' || esc === 'todas') nuevaCfg.carnet_sb = nuevoEstado;
      if (esc === 'lb' || esc === 'todas') nuevaCfg.carnet_lb = nuevoEstado;
    } else if (tipo === 'inscripcion') {
      if (esc === 'sb' || esc === 'todas') nuevaCfg.constancia_inscripcion_sb = nuevoEstado;
      if (esc === 'lb' || esc === 'todas') nuevaCfg.constancia_inscripcion_lb = nuevoEstado;
    } else if (tipo === 'estudio') {
      if (esc === 'sb' || esc === 'todas') nuevaCfg.constancia_estudio_sb = nuevoEstado;
      if (esc === 'lb' || esc === 'todas') nuevaCfg.constancia_estudio_lb = nuevoEstado;
    } else if (tipo === 'conducta') {
      if (esc === 'sb' || esc === 'todas') nuevaCfg.constancia_conducta_sb = nuevoEstado;
      if (esc === 'lb' || esc === 'todas') nuevaCfg.constancia_conducta_lb = nuevoEstado;
    } else if (tipo === 'aceptacion') {
      if (esc === 'sb' || esc === 'todas') nuevaCfg.carta_aceptacion_sb = nuevoEstado;
      if (esc === 'lb' || esc === 'todas') nuevaCfg.carta_aceptacion_lb = nuevoEstado;
    } else if (tipo === 'normas') {
      if (esc === 'sb' || esc === 'todas') nuevaCfg.normas_internas_sb = nuevoEstado;
      if (esc === 'lb' || esc === 'todas') nuevaCfg.normas_internas_lb = nuevoEstado;
    }

    nuevaCfg.modo_temporada = 'personalizado';
    await guardarConfiguracionDocumentosBD(nuevaCfg);
    setConfigDocs(nuevaCfg);

    if (Swal) {
      const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2500 });
      Toast.fire({
        icon: nuevoEstado ? 'success' : 'info',
        title: `${plantillaEdicion.nombre}: ${nuevoEstado ? 'ACTIVADA EN PORTAL' : 'PAUSADA / OCULTA'}`
      });
    }
  };

  // Estados de carga y guardado
  const [guardando, setGuardando] = useState<boolean>(false);
  const [zoomPreview, setZoomPreview] = useState<number>(100);

  const previewRef = useRef<HTMLDivElement>(null);

  // ──────────────────────────────────────────────────────────
  // CARGA DE PLANTILLAS Y ESTUDIANTES REALES
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    cargarDatos();
  }, []);

  // Efecto para actualizar el Carnet en tiempo real cuando se edita
  useEffect(() => {
    if (plantillaEdicion.codigo_tipo === 'carnet') {
      const cargarCarnet = async () => {
        try {
          const escKey = (plantillaEdicion.id_escuela === 'todas' ? 'sb' : plantillaEdicion.id_escuela) as 'sb' | 'lb';
          const cfg = obtenerPlantillaCarnet(escKey);
          // Sobrescribir con lo que se está editando en vivo
          cfg.titulo_carnet = plantillaEdicion.titulo_documento || cfg.titulo_carnet;
          cfg.subtitulo_carnet = plantillaEdicion.membrete_nombre_escuela || cfg.subtitulo_carnet;
          cfg.mostrar_bandera = plantillaEdicion.mostrar_bandera_venezuela;
          cfg.mostrar_firma_director = plantillaEdicion.mostrar_firma_digital;
          cfg.mostrar_qr = plantillaEdicion.mostrar_codigo_qr;
          if (plantillaEdicion.parrafo_certificacion) cfg.leyenda_reverso = plantillaEdicion.parrafo_certificacion;
          if (plantillaEdicion.parrafo_expedicion) cfg.texto_validez = plantillaEdicion.parrafo_expedicion;

          const d = await prepararDatosCarnet(estudianteSeleccionado, {
            id_escuela: escKey,
            codigo_escuela: escKey,
            nombre_escuela: plantillaEdicion.membrete_nombre_escuela
          });
          d.config = cfg;
          d.nombreDirector = `${plantillaEdicion.titulo_director} ${plantillaEdicion.nombre_director}`;
          d.cargoDirector = plantillaEdicion.cargo_director;
          if (plantillaEdicion.firma_digital_url) d.base64FirmaDirector = plantillaEdicion.firma_digital_url;
          setDatosCarnetPrueba(d);
        } catch (e) {
          console.warn('Error preparando carnet en vivo:', e);
        }
      };
      cargarCarnet();
    }
  }, [plantillaEdicion, estudianteSeleccionado]);

  const cargarDatos = async () => {
    try {
      const guardadas = localStorage.getItem('sigae_plantillas_constancias');
      let plantillasFinales = PLANTILLAS_PREDETERMINADAS;
      if (guardadas) {
        try {
          const parsed = JSON.parse(guardadas);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // MERGE automático de plantillas nuevas (Carnets y Constancias)
            const idsExistentes = new Set(parsed.map((p: any) => p.id));
            const faltantes = PLANTILLAS_PREDETERMINADAS.filter(p => !idsExistentes.has(p.id));
            plantillasFinales = [...parsed, ...faltantes];
          }
        } catch (err) {
          console.error("Error parseando plantillas locales:", err);
        }
      }
      
      // Sincronizar plantillas guardadas en la nube (ajustes_globales)
      try {
        const { data: cloudPlantillas } = await supabase
          .from('ajustes_globales')
          .select('*')
          .like('clave', 'plantilla_%');

        if (cloudPlantillas && cloudPlantillas.length > 0) {
          cloudPlantillas.forEach((row: any) => {
            try {
              const plCloud = typeof row.valor === 'string' ? JSON.parse(row.valor) : row.valor;
              if (plCloud && plCloud.id) {
                const idx = plantillasFinales.findIndex(p => p.id === plCloud.id);
                if (idx >= 0) {
                  plantillasFinales[idx] = { ...plantillasFinales[idx], ...plCloud };
                } else {
                  plantillasFinales.push(plCloud);
                }
              }
            } catch (_) {}
          });
        }
      } catch (errCloud) {
        console.warn('Aviso: No se pudieron cargar plantillas de Supabase:', errCloud);
      }

      // Enriquecer plantillas con valores por defecto si faltan campos y normalizar fases
      plantillasFinales = plantillasFinales.map(p => {
        const defaultPl = PLANTILLAS_PREDETERMINADAS.find(dp => dp.id === p.id);
        let res = defaultPl ? { ...defaultPl, ...p } : p;
        if (res.codigo_tipo === 'aceptacion') {
          const escKey: 'sb' | 'lb' = (res.id_escuela === 'sb' ? 'sb' : 'lb');
          const baseCfg = PLANTILLAS_ACEPTACION_DEFAULT[escKey] || PLANTILLAS_ACEPTACION_DEFAULT.lb;
          const fasesNorm = obtenerFasesPlantilla({ ...baseCfg, ...res } as any);
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
          }
        }
        return res;
      });

      let plantillaInicial = plantillasFinales[0];
      const pathActual = typeof window !== 'undefined' ? decodeURIComponent(window.location.pathname) : '';
      const filtro = tipoInicial || (
        pathActual.includes('Normas') || pathActual.includes('normas') ? 'NORMAS' :
        (pathActual.includes('Carta de Aceptaci') || pathActual.includes('aceptacion') ? 'ACEPTACION' : 
        (pathActual.includes('Carnet') ? 'CARNETS' : 'TODAS'))
      );

      if (filtro === 'NORMAS') {
        const found = plantillasFinales.find(p => p.codigo_tipo === 'normas');
        if (found) plantillaInicial = found;
        setFiltroTipoPlantilla('NORMAS');
      } else if (filtro === 'ACEPTACION') {
        const found = plantillasFinales.find(p => p.codigo_tipo === 'aceptacion');
        if (found) plantillaInicial = found;
        setFiltroTipoPlantilla('ACEPTACION');
      } else if (filtro === 'CARNETS') {
        const found = plantillasFinales.find(p => p.codigo_tipo === 'carnet');
        if (found) plantillaInicial = found;
        setFiltroTipoPlantilla('CARNETS');
      } else if (filtro === 'CONSTANCIAS') {
        const found = plantillasFinales.find(p => p.codigo_tipo !== 'carnet' && p.codigo_tipo !== 'aceptacion' && p.codigo_tipo !== 'normas');
        if (found) plantillaInicial = found;
        setFiltroTipoPlantilla('CONSTANCIAS');
      }

      setPlantillas(plantillasFinales);
      setPlantillaActivaId(plantillaInicial.id);
      setPlantillaEdicion(plantillaInicial);
      localStorage.setItem('sigae_plantillas_constancias', JSON.stringify(plantillasFinales));

      let allEsts: any[] = [];
      let page = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('estudiantes_vinculaciones')
          .select('*')
          .eq('estado', 'Activo')
          .range(page * limit, (page + 1) * limit - 1);

        if (error) break;
        if (data && data.length > 0) {
          allEsts = [...allEsts, ...data];
          if (data.length < limit) hasMore = false;
          else page++;
        } else {
          hasMore = false;
        }
      }

      setEstudiantesMuestra(allEsts);
      if (allEsts.length > 0) {
        setEstudianteSeleccionado(allEsts[0]);
      }
    } catch (e: any) {
      console.error("Error al cargar datos del editor:", e);
    }
  };

  const seleccionarPlantilla = (id: string) => {
    const pl = plantillas.find(p => p.id === id);
    if (pl) {
      setPlantillaActivaId(id);
      setPlantillaEdicion(JSON.parse(JSON.stringify(pl)));
    }
  };

  const handleCrearNuevaPlantilla = () => {
    if (!Swal) return;
    Swal.fire({
      title: 'Crear Nueva Plantilla',
      html: `
        <div class="text-start">
          <label class="small fw-bold text-muted mb-1">Tipo de Formato:</label>
          <select id="swal-new-tipo" class="swal2-input m-0 mb-3 w-100">
            <option value="inscripcion">Constancia de Inscripción</option>
            <option value="estudio">Constancia de Estudio</option>
            <option value="carnet">Carnet Estudiantil</option>
            <option value="conducta">Constancia de Buena Conducta</option>
            <option value="personalizada">Formato Personalizado</option>
          </select>

          <label class="small fw-bold text-muted mb-1">Nombre de la Plantilla:</label>
          <input id="swal-new-nom" class="swal2-input m-0 mb-3 w-100" placeholder="Ej: Carnet Escolar 2026..." />
          
          <label class="small fw-bold text-muted mb-1">Título Oficial del Documento:</label>
          <input id="swal-new-tit" class="swal2-input m-0 mb-3 w-100" placeholder="Ej: CARNET ESTUDIANTIL" />
          
          <label class="small fw-bold text-muted mb-1">Plantel / Escuela:</label>
          <select id="swal-new-esc" class="swal2-input m-0 w-100">
            <option value="todas">Ambas Escuelas (Global)</option>
            <option value="sb">U.E. Santa Bárbara</option>
            <option value="lb">U.E. Libertador Bolívar</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Crear Plantilla',
      confirmButtonColor: '#00BCD4',
      preConfirm: () => {
        const tipo = (document.getElementById('swal-new-tipo') as HTMLSelectElement).value;
        const nom = (document.getElementById('swal-new-nom') as HTMLInputElement).value;
        const tit = (document.getElementById('swal-new-tit') as HTMLInputElement).value;
        const esc = (document.getElementById('swal-new-esc') as HTMLSelectElement).value;
        if (!nom.trim() || !tit.trim()) {
          Swal.showValidationMessage('El nombre y título son obligatorios');
          return false;
        }
        return { tipo, nom: nom.trim(), tit: tit.trim(), esc };
      }
    }).then((res: any) => {
      if (res.isConfirmed && res.value) {
        const base = PLANTILLAS_PREDETERMINADAS.find(p => p.codigo_tipo === res.value.tipo) || PLANTILLAS_PREDETERMINADAS[0];
        const nueva: PlantillaConstancia = {
          ...JSON.parse(JSON.stringify(base)),
          id: (res.value.tipo === 'carnet' ? 'CARNET-CUSTOM-' : 'CONST-CUSTOM-') + new Date().getTime(),
          codigo_tipo: res.value.tipo,
          nombre: res.value.nom,
          titulo_documento: res.value.tit,
          id_escuela: res.value.esc
        };

        const nuevasPlantillas = [...plantillas, nueva];
        setPlantillas(nuevasPlantillas);
        setPlantillaActivaId(nueva.id);
        setPlantillaEdicion(nueva);
        localStorage.setItem('sigae_plantillas_constancias', JSON.stringify(nuevasPlantillas));
        Swal.fire('¡Plantilla Creada!', 'Ya puedes personalizar sus firmantes, redacción y estructura.', 'success');
      }
    });
  };

  const construirConfigCartaAceptacion = (pl: PlantillaConstancia): PlantillaCartaAceptacionConfig => {
    const escCode: 'sb' | 'lb' = (pl.id_escuela === 'sb' ? 'sb' : 'lb');
    const baseConfig = PLANTILLAS_ACEPTACION_DEFAULT[escCode] || PLANTILLAS_ACEPTACION_DEFAULT.lb;

    const toArray = (v: any, fallback: string[] = []): string[] => {
      if (Array.isArray(v)) return v.filter(Boolean);
      if (typeof v === 'string') return v.split('\n').map(s => s.trim()).filter(Boolean);
      return fallback;
    };

    const tempParaFases: PlantillaCartaAceptacionConfig = {
      ...baseConfig,
      ...pl,
      id_escuela: escCode,
      fases: (pl.fases && pl.fases.length > 0) ? pl.fases : (baseConfig.fases || []),
      fase1_titulo: pl.fase1_titulo || baseConfig.fase1_titulo,
      fase1_texto: pl.fase1_texto || baseConfig.fase1_texto,
      fase2_titulo: pl.fase2_titulo || baseConfig.fase2_titulo,
      fase2_texto: pl.fase2_texto || baseConfig.fase2_texto,
      fase3_titulo: pl.fase3_titulo || baseConfig.fase3_titulo,
      fase3_fecha: pl.fase3_fecha || baseConfig.fase3_fecha,
      fase3_lugar: pl.fase3_lugar || baseConfig.fase3_lugar,
      fase3_hora: pl.fase3_hora || baseConfig.fase3_hora,
    } as any;

    const fasesNorm = obtenerFasesPlantilla(tempParaFases);

    return {
      ...tempParaFases,
      id: pl.id || baseConfig.id,
      id_escuela: escCode,
      nombre: pl.nombre || baseConfig.nombre,
      titulo_documento: pl.titulo_documento || baseConfig.titulo_documento,
      periodo_escolar: pl.periodo_escolar || baseConfig.periodo_escolar,
      membrete_linea1: pl.membrete_linea1 || baseConfig.membrete_linea1,
      membrete_linea2: pl.membrete_linea2 || baseConfig.membrete_linea2,
      membrete_nombre_escuela: pl.membrete_nombre_escuela || baseConfig.membrete_nombre_escuela,
      membrete_ubicacion: pl.membrete_ubicacion || baseConfig.membrete_ubicacion,
      logo_escuela_url: pl.logo_escuela_url || baseConfig.logo_escuela_url,
      mostrar_bandera: pl.mostrar_bandera_venezuela !== undefined ? pl.mostrar_bandera_venezuela : true,
      texto_notificacion_intro: pl.parrafo_certificacion || pl.texto_notificacion_intro || baseConfig.texto_notificacion_intro,
      texto_aprobacion_parrafo: pl.parrafo_representante || pl.texto_aprobacion_parrafo || baseConfig.texto_aprobacion_parrafo,
      texto_fases_intro: pl.texto_fases_intro || pl.parrafo_expedicion || baseConfig.texto_fases_intro,
      fases: fasesNorm,
      fase1_titulo: fasesNorm[0]?.titulo || baseConfig.fase1_titulo,
      fase1_texto: fasesNorm[0]?.texto || baseConfig.fase1_texto,
      fase2_titulo: fasesNorm[1]?.titulo || baseConfig.fase2_titulo,
      fase2_texto: fasesNorm[1]?.texto || baseConfig.fase2_texto,
      fase3_titulo: fasesNorm[2]?.titulo || baseConfig.fase3_titulo,
      fase3_fecha: fasesNorm[2]?.fecha || pl.fase3_fecha || baseConfig.fase3_fecha,
      fase3_lugar: fasesNorm[2]?.lugar || pl.fase3_lugar || baseConfig.fase3_lugar,
      fase3_hora: fasesNorm[2]?.hora || pl.fase3_hora || baseConfig.fase3_hora,
      recaudos_carpeta_nota: pl.recaudos_carpeta_nota || baseConfig.recaudos_carpeta_nota,
      recaudos_inicial: toArray(pl.recaudos_inicial, baseConfig.recaudos_inicial),
      recaudos_primaria_hijos: toArray(pl.recaudos_primaria_hijos, baseConfig.recaudos_primaria_hijos),
      recaudos_primaria_familiares: toArray(pl.recaudos_primaria_familiares, baseConfig.recaudos_primaria_familiares),
      recaudos_media_hijos: toArray(pl.recaudos_media_hijos, baseConfig.recaudos_media_hijos),
      recaudos_media_familiares: toArray(pl.recaudos_media_familiares, baseConfig.recaudos_media_familiares),
      orientaciones_generales: toArray(pl.orientaciones_generales, baseConfig.orientaciones_generales),
      texto_agradecimiento_final: pl.texto_agradecimiento_final || baseConfig.texto_agradecimiento_final,
      titulo_director: pl.titulo_director || baseConfig.titulo_director,
      nombre_director: pl.nombre_director || baseConfig.nombre_director,
      cedula_director: pl.cedula_director || baseConfig.cedula_director,
      cargo_director: pl.cargo_director || baseConfig.cargo_director,
      firma_digital_url: pl.firma_digital_url || baseConfig.firma_digital_url,
      mostrar_firma_digital: pl.mostrar_firma_digital !== undefined ? pl.mostrar_firma_digital : true,
      sello_humedo_url: pl.sello_humedo_url || '',
      mostrar_sello_humedo: pl.mostrar_sello_humedo || false,
      mostrar_codigo_qr: pl.mostrar_codigo_qr !== undefined ? pl.mostrar_codigo_qr : true
    };
  };

  const construirConfigNormasInternas = (pl: PlantillaConstancia): PlantillaNormasInternasConfig => {
    const escCode: 'sb' | 'lb' = (pl.id_escuela === 'lb' ? 'lb' : 'sb');
    const baseConfig = PLANTILLAS_NORMAS_DEFAULT[escCode];

    const toArray = (v: any, fallback: string[] = []): string[] => {
      if (Array.isArray(v)) return v.filter(Boolean);
      if (typeof v === 'string') return v.split('\n').map(s => s.trim()).filter(Boolean);
      return fallback;
    };

    return {
      id: pl.id || baseConfig.id,
      id_escuela: escCode,
      nombre: pl.nombre || baseConfig.nombre,
      titulo_documento: pl.titulo_documento || baseConfig.titulo_documento,
      periodo_escolar: pl.periodo_escolar || baseConfig.periodo_escolar,
      membrete_linea1: pl.membrete_linea1 || baseConfig.membrete_linea1,
      membrete_linea2: pl.membrete_linea2 || baseConfig.membrete_linea2,
      membrete_nombre_escuela: pl.membrete_nombre_escuela || baseConfig.membrete_nombre_escuela,
      membrete_ubicacion: pl.membrete_ubicacion || baseConfig.membrete_ubicacion,
      logo_escuela_url: pl.logo_escuela_url || baseConfig.logo_escuela_url,
      mostrar_bandera: pl.mostrar_bandera_venezuela !== undefined ? pl.mostrar_bandera_venezuela : true,
      texto_introductorio: pl.parrafo_certificacion || baseConfig.texto_introductorio,
      hora_entrada: pl.hora_entrada || baseConfig.hora_entrada,
      uniforme_inicial: toArray(pl.uniforme_inicial, baseConfig.uniforme_inicial),
      uniforme_primaria: toArray(pl.uniforme_primaria, baseConfig.uniforme_primaria),
      uniforme_media: toArray(pl.uniforme_media, baseConfig.uniforme_media),
      uniforme_educacion_fisica: toArray(pl.uniforme_educacion_fisica, baseConfig.uniforme_educacion_fisica),
      transporte_escolar: pl.transporte_escolar || baseConfig.transporte_escolar,
      otros_aspectos: toArray(pl.otros_aspectos, baseConfig.otros_aspectos),
      deberes_representantes: toArray(pl.deberes_representantes, baseConfig.deberes_representantes),
      zonificacion_residencia: toArray(pl.zonificacion_residencia, baseConfig.zonificacion_residencia),
      apego_normativas: toArray(pl.apego_normativas, baseConfig.apego_normativas),
      zonificacion_repitencias: toArray(pl.zonificacion_repitencias, baseConfig.zonificacion_repitencias),
      texto_declaracion_compromiso: pl.texto_declaracion_compromiso || baseConfig.texto_declaracion_compromiso,
      titulo_director: pl.titulo_director || baseConfig.titulo_director,
      nombre_director: pl.nombre_director || baseConfig.nombre_director,
      cedula_director: pl.cedula_director || baseConfig.cedula_director,
      cargo_director: pl.cargo_director || baseConfig.cargo_director,
      firma_digital_url: pl.firma_digital_url || baseConfig.firma_digital_url,
      mostrar_firma_digital: pl.mostrar_firma_digital !== undefined ? pl.mostrar_firma_digital : true,
      mostrar_codigo_qr: pl.mostrar_codigo_qr !== undefined ? pl.mostrar_codigo_qr : true
    };
  };

  const handleGuardarPlantilla = async () => {
    setGuardando(true);
    try {
      const actualizadas = plantillas.map(p => p.id === plantillaEdicion.id ? plantillaEdicion : p);
      setPlantillas(actualizadas);
      localStorage.setItem('sigae_plantillas_constancias', JSON.stringify(actualizadas));

      // Si es plantilla de carnet, guardar en la configuración del generador de carnet
      if (plantillaEdicion.codigo_tipo === 'carnet') {
        const escKey = (plantillaEdicion.id_escuela === 'todas' ? 'sb' : plantillaEdicion.id_escuela) as 'sb' | 'lb';
        const cfg = obtenerPlantillaCarnet(escKey);
        cfg.titulo_carnet = plantillaEdicion.titulo_documento || cfg.titulo_carnet;
        cfg.subtitulo_carnet = plantillaEdicion.membrete_nombre_escuela || cfg.subtitulo_carnet;
        cfg.mostrar_bandera = plantillaEdicion.mostrar_bandera_venezuela;
        cfg.mostrar_firma_director = plantillaEdicion.mostrar_firma_digital;
        cfg.mostrar_qr = plantillaEdicion.mostrar_codigo_qr;
        if (plantillaEdicion.parrafo_certificacion) cfg.leyenda_reverso = plantillaEdicion.parrafo_certificacion;
        if (plantillaEdicion.parrafo_expedicion) cfg.texto_validez = plantillaEdicion.parrafo_expedicion;
        guardarPlantillaCarnet(cfg);

        if (plantillaEdicion.id_escuela === 'todas') {
          const cfgLb = obtenerPlantillaCarnet('lb');
          cfgLb.titulo_carnet = cfg.titulo_carnet;
          cfgLb.mostrar_bandera = cfg.mostrar_bandera;
          cfgLb.mostrar_firma_director = cfg.mostrar_firma_director;
          cfgLb.mostrar_qr = cfg.mostrar_qr;
          guardarPlantillaCarnet(cfgLb);
        }
      }

      // Si es plantilla de carta de aceptación, guardar en la configuración de admisión
      if (plantillaEdicion.codigo_tipo === 'aceptacion') {
        const escKey = (plantillaEdicion.id_escuela === 'todas' ? 'lb' : plantillaEdicion.id_escuela) as 'sb' | 'lb';
        const cfgAcept = construirConfigCartaAceptacion(plantillaEdicion);
        const todasAcept = obtenerPlantillasCartaAceptacion();
        const nuevasAcept = todasAcept.map(ca => ca.id_escuela === escKey ? cfgAcept : ca);
        if (!nuevasAcept.some(ca => ca.id_escuela === escKey)) {
          nuevasAcept.push(cfgAcept);
        }
        await guardarPlantillasCartaAceptacion(nuevasAcept);
      }

      // Si es plantilla de normas internas, guardar en la configuración de normas
      if (plantillaEdicion.codigo_tipo === 'normas') {
        const escKey = (plantillaEdicion.id_escuela === 'todas' ? 'sb' : plantillaEdicion.id_escuela) as 'sb' | 'lb';
        const cfgNormas = construirConfigNormasInternas(plantillaEdicion);
        const todasNormas = [...obtenerPlantillasNormasInternas()];
        const idx = todasNormas.findIndex(p => p.id_escuela === escKey);
        if (idx >= 0) {
          todasNormas[idx] = cfgNormas;
        } else {
          todasNormas.push(cfgNormas);
        }
        if (plantillaEdicion.id_escuela === 'todas') {
          const idxLb = todasNormas.findIndex(p => p.id_escuela === 'lb');
          const cfgLb = { ...cfgNormas, id: 'NORMAS-CONV-LB', id_escuela: 'lb' as const };
          if (idxLb >= 0) {
            todasNormas[idxLb] = cfgLb;
          } else {
            todasNormas.push(cfgLb);
          }
        }
        await guardarPlantillasNormasInternas(todasNormas);
      }

      try {
        await supabase.from('ajustes_globales').upsert({
          clave: 'plantilla_' + plantillaEdicion.id,
          valor: JSON.stringify(plantillaEdicion),
          descripcion: 'Configuración de plantilla ' + plantillaEdicion.nombre
        }, { onConflict: 'clave' });
      } catch (errDb) {
        console.warn("Aviso guardado BD:", errDb);
      }

      auditar('Diseños', 'Modificar Plantilla', `Actualizó la plantilla: ${plantillaEdicion.nombre}`);
      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Plantilla Guardada!',
          text: 'Los cambios se aplicaron exitosamente en todo el sistema.',
          confirmButtonColor: '#00BCD4'
        });
      }
    } catch (e: any) {
      console.error(e);
      if (Swal) Swal.fire('Error', 'No se pudieron guardar los cambios de la plantilla.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleRestaurarPredeterminados = () => {
    if (!Swal) return;
    Swal.fire({
      title: '¿Restaurar Formatos Originales?',
      text: 'Se restablecerán las constancias oficiales idénticas a las emitidas por Control de Estudios.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar'
    }).then((res: any) => {
      if (res.isConfirmed) {
        setPlantillas(PLANTILLAS_PREDETERMINADAS);
        setPlantillaActivaId(PLANTILLAS_PREDETERMINADAS[0].id);
        setPlantillaEdicion(PLANTILLAS_PREDETERMINADAS[0]);
        localStorage.setItem('sigae_plantillas_constancias', JSON.stringify(PLANTILLAS_PREDETERMINADAS));
        Swal.fire('Restaurado', 'Se han restablecido los formatos oficiales originales de Santa Bárbara y Libertador Bolívar.', 'success');
      }
    });
  };

  const insertarTagEnCertificacion = (tag: string) => {
    setPlantillaEdicion(prev => ({
      ...prev,
      parrafo_certificacion: (prev.parrafo_certificacion || '') + ' ' + tag + ' '
    }));
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'logo_escuela' | 'firma' | 'sello' | 'logo_mppe') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      if (Swal) Swal.fire('Archivo muy grande', 'La imagen no debe superar los 2 MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (tipo === 'logo_escuela') {
        setPlantillaEdicion(prev => ({ ...prev, logo_escuela_url: base64 }));
      } else if (tipo === 'firma') {
        setPlantillaEdicion(prev => ({ ...prev, firma_digital_url: base64 }));
      } else if (tipo === 'sello') {
        setPlantillaEdicion(prev => ({ ...prev, sello_humedo_url: base64, mostrar_sello_humedo: true }));
      } else if (tipo === 'logo_mppe') {
        setPlantillaEdicion(prev => ({ ...prev, logo_mppe_url: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  // ──────────────────────────────────────────────────────────
  // GESTIÓN DINÁMICA DE PASOS / FASES (CARTA DE ACEPTACIÓN)
  // ──────────────────────────────────────────────────────────
  const fasesEdicion: PasoFaseAceptacion[] = useMemo(() => {
    return obtenerFasesPlantilla(construirConfigCartaAceptacion(plantillaEdicion));
  }, [plantillaEdicion]);

  const actualizarFasesEdicion = (nuevasFases: PasoFaseAceptacion[]) => {
    const updated: PlantillaConstancia = {
      ...plantillaEdicion,
      fases: nuevasFases
    };
    if (nuevasFases[0]) {
      updated.fase1_titulo = nuevasFases[0].titulo;
      updated.fase1_texto = nuevasFases[0].texto;
    }
    if (nuevasFases[1]) {
      updated.fase2_titulo = nuevasFases[1].titulo;
      updated.fase2_texto = nuevasFases[1].texto;
    }
    if (nuevasFases[2]) {
      updated.fase3_titulo = nuevasFases[2].titulo;
      updated.fase3_fecha = nuevasFases[2].fecha || '';
      updated.fase3_lugar = nuevasFases[2].lugar || '';
      updated.fase3_hora = nuevasFases[2].hora || '';
    }
    setPlantillaEdicion(updated);
  };

  const handleAgregarFase = () => {
    const nuevoNum = fasesEdicion.length + 1;
    const nuevaFase: PasoFaseAceptacion = {
      id: `fase-${Date.now()}`,
      titulo: `Fase ${nuevoNum}: Nuevo Paso del Proceso`,
      texto: 'Descripción detallada de las acciones e instrucciones que debe realizar el representante en este paso.',
      fecha: '',
      lugar: '',
      hora: ''
    };
    actualizarFasesEdicion([...fasesEdicion, nuevaFase]);
  };

  const handleEliminarFase = (index: number) => {
    if (fasesEdicion.length <= 1) {
      if (Swal) {
        Swal.fire('Atención', 'El proceso de aceptación debe tener al menos un paso o fase configurado.', 'warning');
      }
      return;
    }
    const nuevas = fasesEdicion.filter((_, idx) => idx !== index);
    actualizarFasesEdicion(nuevas);
  };

  const handleMoverFase = (index: number, direccion: 'arriba' | 'abajo') => {
    const target = direccion === 'arriba' ? index - 1 : index + 1;
    if (target < 0 || target >= fasesEdicion.length) return;
    const nuevas = [...fasesEdicion];
    const temp = nuevas[index];
    nuevas[index] = nuevas[target];
    nuevas[target] = temp;
    actualizarFasesEdicion(nuevas);
  };

  const handleEditarFase = (index: number, campo: keyof PasoFaseAceptacion, valor: string) => {
    const nuevas = fasesEdicion.map((f, idx) => {
      if (idx === index) {
        return { ...f, [campo]: valor };
      }
      return f;
    });
    actualizarFasesEdicion(nuevas);
  };

  // ──────────────────────────────────────────────────────────
  // GENERACIÓN DE TEXTO CON VARIABLES REEMPLAZADAS EN VIVO
  // (Réplica Exacta del Motor de VincularEstudiante / Verificaciones)
  // ──────────────────────────────────────────────────────────
  const textoProcesado = useMemo(() => {
    const est = estudianteSeleccionado || {
      nombres_estudiante: 'Juan Carlos',
      apellidos_estudiante: 'Pérez Rodríguez',
      cedula_estudiante: '32145678',
      grado_actual: '1er Grado',
      seccion_actual: 'A',
      codigo_escuela: plantillaEdicion.id_escuela === 'lb' ? 'lb' : 'sb',
      nombres_representante: 'María Elena',
      apellidos_representante: 'Rodríguez de Pérez',
      cedula_representante: '14567890'
    };

    const escuelaCodigo = resolverEscuelaEstudiante(est, { id_escuela: plantillaEdicion.id_escuela });
    const esSantaBarbara = escuelaCodigo === 'sb';

    const nombreEscuelaTexto = esSantaBarbara ? 'Unidad Educativa Santa Bárbara' : 'Unidad Educativa Libertador Bolívar';
    const ubicacionEscuelaTexto = esSantaBarbara ? 'El Tejero, estado Monagas' : 'Miraflores, estado Monagas';
    const ciudadExpedicionTexto = esSantaBarbara ? 'El Tejero' : 'Miraflores';

    const anoActual = new Date().getFullYear();
    const anoProximo = anoActual + 1;
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const diaExpedicion = new Date().getDate();
    const mesExpedicion = meses[new Date().getMonth()];
    const anoExpedicion = anoActual;

    const cedulaLimpia = (est.cedula_estudiante || '0000').toString().replace(/\D/g, '');
    const codigoConstancia = `CI-${escuelaCodigo.toUpperCase()}-${cedulaLimpia}-${anoActual}`;

    const esLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const baseUrlVerificacion = esLocal ? 'https://app-delta-ten-80.vercel.app' : (typeof window !== 'undefined' ? window.location.origin : '');
    const urlQrConstancia = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`${baseUrlVerificacion}/validar-constancia/${encodeURIComponent(codigoConstancia)}`)}&bgcolor=ffffff&color=166534&margin=2`;

    // Tipo de documento (cédula escolar vs cédula de identidad)
    const cedStr = (est.cedula_estudiante || '').toString().trim().toUpperCase();
    const tipoCedulaTexto = cedStr.startsWith('CE') || cedStr.startsWith('CE-') || cedStr.replace(/\D/g, '').length >= 10
      ? 'cédula escolar'
      : 'cédula de identidad';

    const gradoLimpio = (est.grado_actual || '1er Grado')
      .replace(/\s+de\s+(Educación\s+Primaria|Educación\s+Inicial|Educación\s+Media\s+General|Media\s+General|Primaria|Inicial)/gi, '')
      .replace(/\s+correspondiente\s+al\s+Nivel\s+de.*/gi, '')
      .trim();

    let nivelEducativo = 'Educación Primaria';
    const gLower = (est.grado_actual || '').toLowerCase();
    if (gLower.includes('maternal') || gLower.includes('preescolar') || gLower.includes('inicial') || gLower.includes('grupo')) {
      nivelEducativo = 'Educación Inicial';
    } else if (gLower.includes('año') || gLower.includes('media') || gLower.includes('bachillerato')) {
      nivelEducativo = 'Educación Media General';
    }

    const lugarNac = est.estudiante_municipio_nacimiento || est.estudiante_lugar_nacimiento || (esSantaBarbara ? 'El Tejero' : 'Miraflores');
    const estadoNac = est.estudiante_estado_nacimiento || 'Monagas';
    const nombreCompletoEstudiante = `${est.nombres_estudiante || ''} ${est.apellidos_estudiante || ''}`.trim();
    const nombreCompletoRepresentante = `${est.nombres_representante || ''} ${est.apellidos_representante || ''}`.trim() || 'No registrado';

    // Reemplazo en Párrafo 1
    let p1 = plantillaEdicion.parrafo_certificacion || '';
    p1 = p1.replace(/\{titulo_director\}/g, plantillaEdicion.titulo_director);
    p1 = p1.replace(/\{nombre_director\}/g, plantillaEdicion.nombre_director);
    p1 = p1.replace(/\{cargo_generico\}/g, plantillaEdicion.cargo_generico.toLowerCase());
    p1 = p1.replace(/\{nombre_escuela\}/g, nombreEscuelaTexto);
    p1 = p1.replace(/\{ubicacion_escuela\}/g, ubicacionEscuelaTexto);
    p1 = p1.replace(/\{nombre_estudiante\}/g, nombreCompletoEstudiante);
    p1 = p1.replace(/\{lugar_nacimiento\}/g, lugarNac);
    p1 = p1.replace(/\{estado_nacimiento\}/g, estadoNac);
    p1 = p1.replace(/\{tipo_cedula\}/g, tipoCedulaTexto);
    p1 = p1.replace(/\{cedula_estudiante\}/g, est.cedula_estudiante || 'No registrada');
    p1 = p1.replace(/\{grado_actual\}/g, gradoLimpio);
    p1 = p1.replace(/\{nivel_educativo\}/g, nivelEducativo);
    p1 = p1.replace(/\{periodo_escolar\}/g, `${anoActual}-${anoProximo}`);

    // Reemplazo en Párrafo 2
    let p2 = plantillaEdicion.parrafo_representante || '';
    p2 = p2.replace(/\{nombre_representante\}/g, nombreCompletoRepresentante);
    p2 = p2.replace(/\{cedula_representante\}/g, est.cedula_representante || 'No registrada');

    // Reemplazo en Párrafo 3
    let p3 = plantillaEdicion.parrafo_expedicion || '';
    p3 = p3.replace(/\{ciudad_expedicion\}/g, plantillaEdicion.ciudad_expedicion || ciudadExpedicionTexto);
    p3 = p3.replace(/\{dia_expedicion\}/g, diaExpedicion.toString());
    p3 = p3.replace(/\{mes_expedicion\}/g, mesExpedicion);
    p3 = p3.replace(/\{ano_expedicion\}/g, anoExpedicion.toString());

    // Membrete
    const membreteEscuela = plantillaEdicion.membrete_nombre_escuela.replace(/\{nombre_escuela\}/g, nombreEscuelaTexto);
    const membreteUbicacion = plantillaEdicion.membrete_ubicacion.replace(/\{ubicacion_escuela\}/g, ubicacionEscuelaTexto);

    const formatTextoConstancia = (str: string) => {
      if (!str) return '';
      return str
        .replace(/\[SALTO_PAGINA\]|\[SALTO_DE_PAGINA\]/gi, '<div style="page-break-before: always; height: 1px; margin: 15px 0;"></div>')
        .split('\n')
        .map(l => l.trim())
        .join('<br/>');
    };

    p1 = formatTextoConstancia(p1);
    p2 = formatTextoConstancia(p2);
    p3 = formatTextoConstancia(p3);

    return {
      p1,
      p2,
      p3,
      membreteEscuela,
      membreteUbicacion,
      codigoConstancia,
      urlQrConstancia
    };
  }, [plantillaEdicion, estudianteSeleccionado]);

  // Vista previa HTML de Carta de Aceptación Oficial
  const htmlCartaAceptacionPreview = useMemo(() => {
    if (plantillaEdicion.codigo_tipo !== 'aceptacion') return '';
    const escCode: 'sb' | 'lb' = (plantillaEdicion.id_escuela === 'sb' ? 'sb' : 'lb');
    const configAceptacion = construirConfigCartaAceptacion(plantillaEdicion);

    const repNombres = estudianteSeleccionado?.nombres_representante || estudianteSeleccionado?.representante_nombres || 'Giddiel Ramón';
    const repApellidos = estudianteSeleccionado?.apellidos_representante || estudianteSeleccionado?.representante_apellidos || 'Reyes Figuera';
    const estNombres = estudianteSeleccionado?.nombres_estudiante || estudianteSeleccionado?.estudiante_nombres || 'Abig Alejandra';
    const estApellidos = estudianteSeleccionado?.apellidos_estudiante || estudianteSeleccionado?.estudiante_apellidos || 'Reyes Molina';

    const datosAspirante: DatosAspiranteCartaAceptacion = {
      codigo_unico: estudianteSeleccionado?.codigo_unico || (escCode === 'sb' ? 'CR-SB-2025-0142' : 'CR-LB-2025-0142'),
      codigo_escuela: escCode,
      representante_nombres: repNombres,
      representante_apellidos: repApellidos,
      representante_cedula: estudianteSeleccionado?.cedula_representante || estudianteSeleccionado?.representante_cedula || '15.876.993',
      representante_telefono: estudianteSeleccionado?.telefono_representante || estudianteSeleccionado?.representante_telefono || '0414-1234567',
      representante_email: 'giddielreyes@gmail.com',
      representante_email_empresa: 'reyegl@petroquiriquire.pdvsa.com',
      estudiante_nombres: estNombres,
      estudiante_apellidos: estApellidos,
      estudiante_cedula: estudianteSeleccionado?.cedula_estudiante || estudianteSeleccionado?.estudiante_cedula || '33.124.568',
      grado_solicitado: estudianteSeleccionado?.grado_actual || estudianteSeleccionado?.grado_solicitado || '1er Grado'
    };

    return renderCartaAceptacionHTML(configAceptacion, datosAspirante);
  }, [plantillaEdicion, estudianteSeleccionado]);

  // Vista previa HTML de Normativa Interna Oficial
  const htmlNormasInternasPreview = useMemo(() => {
    if (plantillaEdicion.codigo_tipo !== 'normas') return '';
    const escCode: 'sb' | 'lb' = (plantillaEdicion.id_escuela === 'lb' ? 'lb' : 'sb');
    const configNormas = construirConfigNormasInternas(plantillaEdicion);

    const repNombres = estudianteSeleccionado?.nombres_representante || estudianteSeleccionado?.representante_nombres || 'Giddiel Ramón';
    const repApellidos = estudianteSeleccionado?.apellidos_representante || estudianteSeleccionado?.representante_apellidos || 'Reyes Figuera';
    const estNombres = estudianteSeleccionado?.nombres_estudiante || estudianteSeleccionado?.estudiante_nombres || 'Abig Alejandra';
    const estApellidos = estudianteSeleccionado?.apellidos_estudiante || estudianteSeleccionado?.estudiante_apellidos || 'Reyes Molina';

    const datosEst: DatosEstudianteNormasInternas = {
      codigo_unico: estudianteSeleccionado?.codigo_unico || (escCode === 'sb' ? 'NI-SB-2026-0089' : 'NI-LB-2026-0089'),
      codigo_escuela: escCode,
      representante_nombres: repNombres,
      representante_apellidos: repApellidos,
      representante_cedula: estudianteSeleccionado?.cedula_representante || estudianteSeleccionado?.representante_cedula || '15.876.993',
      representante_telefono: estudianteSeleccionado?.telefono_representante || estudianteSeleccionado?.representante_telefono || '0414-1234567',
      estudiante_nombres: estNombres,
      estudiante_apellidos: estApellidos,
      estudiante_cedula: estudianteSeleccionado?.cedula_estudiante || estudianteSeleccionado?.estudiante_cedula || '33.124.568',
      grado_solicitado: estudianteSeleccionado?.grado_actual || estudianteSeleccionado?.grado_solicitado || '1er Grado'
    };

    return renderNormasInternasHTML(configNormas, datosEst);
  }, [plantillaEdicion, estudianteSeleccionado]);

  // Descarga de PDF de Prueba
  const handleDescargarPdfPrueba = () => {
    if (plantillaEdicion.codigo_tipo === 'carnet') {
      if (datosCarnetPrueba) {
        descargarCarnetPDF(datosCarnetPrueba);
      } else {
        if (Swal) Swal.fire('Aviso', 'Cargando datos del carnet...', 'info');
      }
      return;
    }

    if (plantillaEdicion.codigo_tipo === 'aceptacion') {
      const escCode: 'sb' | 'lb' = (plantillaEdicion.id_escuela === 'sb' ? 'sb' : 'lb');
      const configAceptacion = construirConfigCartaAceptacion(plantillaEdicion);

      const repNombres = estudianteSeleccionado?.nombres_representante || estudianteSeleccionado?.representante_nombres || 'Giddiel Ramón';
      const repApellidos = estudianteSeleccionado?.apellidos_representante || estudianteSeleccionado?.representante_apellidos || 'Reyes Figuera';
      const estNombres = estudianteSeleccionado?.nombres_estudiante || estudianteSeleccionado?.estudiante_nombres || 'Abig Alejandra';
      const estApellidos = estudianteSeleccionado?.apellidos_estudiante || estudianteSeleccionado?.estudiante_apellidos || 'Reyes Molina';

      const datosAspirante: DatosAspiranteCartaAceptacion = {
        codigo_unico: estudianteSeleccionado?.codigo_unico || (escCode === 'sb' ? 'CR-SB-2025-0142' : 'CR-LB-2025-0142'),
        codigo_escuela: escCode,
        representante_nombres: repNombres,
        representante_apellidos: repApellidos,
        representante_cedula: estudianteSeleccionado?.cedula_representante || estudianteSeleccionado?.representante_cedula || '15.876.993',
        representante_telefono: estudianteSeleccionado?.telefono_representante || estudianteSeleccionado?.representante_telefono || '0414-1234567',
        representante_email: 'giddielreyes@gmail.com',
        representante_email_empresa: 'reyegl@petroquiriquire.pdvsa.com',
        estudiante_nombres: estNombres,
        estudiante_apellidos: estApellidos,
        estudiante_cedula: estudianteSeleccionado?.cedula_estudiante || estudianteSeleccionado?.estudiante_cedula || '33.124.568',
        grado_solicitado: estudianteSeleccionado?.grado_actual || estudianteSeleccionado?.grado_solicitado || '1er Grado'
      };

      descargarCartaAceptacionPDF(configAceptacion, datosAspirante);
      auditar('Diseños', 'Descarga Carta Aceptación PDF', `Descargó prueba de ${plantillaEdicion.nombre}`);
      return;
    }

    if (plantillaEdicion.codigo_tipo === 'normas') {
      const escCode: 'sb' | 'lb' = (plantillaEdicion.id_escuela === 'lb' ? 'lb' : 'sb');
      const configNormas = construirConfigNormasInternas(plantillaEdicion);

      const repNombres = estudianteSeleccionado?.nombres_representante || estudianteSeleccionado?.representante_nombres || 'Giddiel Ramón';
      const repApellidos = estudianteSeleccionado?.apellidos_representante || estudianteSeleccionado?.representante_apellidos || 'Reyes Figuera';
      const estNombres = estudianteSeleccionado?.nombres_estudiante || estudianteSeleccionado?.estudiante_nombres || 'Abig Alejandra';
      const estApellidos = estudianteSeleccionado?.apellidos_estudiante || estudianteSeleccionado?.estudiante_apellidos || 'Reyes Molina';

      const datosEst: DatosEstudianteNormasInternas = {
        codigo_unico: estudianteSeleccionado?.codigo_unico || (escCode === 'sb' ? 'NI-SB-2026-0089' : 'NI-LB-2026-0089'),
        codigo_escuela: escCode,
        representante_nombres: repNombres,
        representante_apellidos: repApellidos,
        representante_cedula: estudianteSeleccionado?.cedula_representante || estudianteSeleccionado?.representante_cedula || '15.876.993',
        representante_telefono: estudianteSeleccionado?.telefono_representante || estudianteSeleccionado?.representante_telefono || '0414-1234567',
        estudiante_nombres: estNombres,
        estudiante_apellidos: estApellidos,
        estudiante_cedula: estudianteSeleccionado?.cedula_estudiante || estudianteSeleccionado?.estudiante_cedula || '33.124.568',
        grado_solicitado: estudianteSeleccionado?.grado_actual || estudianteSeleccionado?.grado_solicitado || '1er Grado'
      };

      descargarNormasInternasPDF(configNormas, datosEst);
      auditar('Diseños', 'Descarga Normas Internas PDF', `Descargó prueba de ${plantillaEdicion.nombre}`);
      return;
    }

    if (!html2pdf) {
      if (Swal) Swal.fire('Aviso', 'El motor PDF está cargando.', 'info');
      return;
    }

    const element = previewRef.current;
    if (!element) return;

    const opt = {
      margin: 8,
      filename: `Constancia_Inscripcion_Oficial_${plantillaEdicion.id_escuela.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };

    if (Swal) {
      Swal.fire({
        title: 'Generando PDF Oficial...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
    }

    html2pdf().set(opt).from(element).save().then(() => {
      if (Swal) Swal.close();
      auditar('Diseños', 'Descarga Prueba PDF', `Descargó prueba de ${plantillaEdicion.nombre}`);
    }).catch((err: any) => {
      console.error(err);
      if (Swal) {
        Swal.close();
        Swal.fire('Error', 'Falla al procesar el archivo PDF.', 'error');
      }
    });
  };

  const plantillasFiltradas = useMemo(() => {
    if (filtroTipoPlantilla === 'CONSTANCIAS') {
      return plantillas.filter(p => p.codigo_tipo !== 'carnet' && p.codigo_tipo !== 'aceptacion' && p.codigo_tipo !== 'normas');
    }
    if (filtroTipoPlantilla === 'CARNETS') {
      return plantillas.filter(p => p.codigo_tipo === 'carnet');
    }
    if (filtroTipoPlantilla === 'ACEPTACION') {
      return plantillas.filter(p => p.codigo_tipo === 'aceptacion');
    }
    if (filtroTipoPlantilla === 'NORMAS') {
      return plantillas.filter(p => p.codigo_tipo === 'normas');
    }
    return plantillas;
  }, [plantillas, filtroTipoPlantilla]);

  const estudiantesFiltradosMuestra = useMemo(() => {
    if (!searchEstudianteMuestra.trim()) return estudiantesMuestra.slice(0, 10);
    const q = searchEstudianteMuestra.toLowerCase();
    return estudiantesMuestra.filter(e => 
      (e.nombres_estudiante || '').toLowerCase().includes(q) ||
      (e.apellidos_estudiante || '').toLowerCase().includes(q) ||
      (e.cedula_estudiante || '').toLowerCase().includes(q)
    ).slice(0, 10);
  }, [estudiantesMuestra, searchEstudianteMuestra]);

  return (
    <div className="modulo-animado container-fluid py-4 px-3 px-md-4 animate__animated animate__fadeIn">

      {/* MIGAS DE PAN CHAMILO */}
      <ChamiloBreadcrumb
        category="Área de Diseños"
        currentModule="Editor de Constancias"
      />

      {/* CUADRO DE AYUDA METODOLÓGICA CHAMILO */}
      <ChamiloHelpCallout
        id="ayuda_editor_constancias"
        title="Guía del Editor Visual de Constancias y Carnets"
        content="Diseñe y personalice las plantillas oficiales de constancias de estudio, inscripción, retiro, buena conducta y carnets inteligentes con previsualización en vivo y etiquetas dinámicas."
        icon="bi-file-earmark-richtext-fill"
      />

      {/* ── 2. CABECERA INSTITUCIONAL CHAMILO TECH ── */}
      <div 
        className="tech-card overflow-hidden mb-4 animate__animated animate__fadeInDown" 
        style={{ 
          border: '2px solid #fbcfe8',
          borderTop: '6px solid #ec4899',
          background: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 45%, #fce7f3 100%)',
          borderRadius: '26px'
        }}
      >
        <div className="p-4 p-md-5">
          <div className="row align-items-center g-4">
            
            {/* Contenedor Doble: Ícono 3D de Documento Digital + Escudo Oficial de la Escuela */}
            <div className="col-12 col-md-auto text-center text-md-start">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 flex-wrap">
                {/* Ícono 3D Documento Digital */}
                <div 
                  className="tech-icon-wrapper bg-white d-inline-flex align-items-center justify-content-center p-2"
                  style={{ 
                    width: '105px', 
                    height: '105px',
                    borderRadius: '24px',
                    border: '2.5px solid #fbcfe8',
                    boxShadow: '0 10px 24px rgba(236, 72, 153, 0.15)'
                  }}
                  title="Editor Oficial de Documentos Digitales"
                >
                  <IconoDocumentoDigital size={54} color="#ec4899" />
                </div>

                {/* Logo Oficial de la Escuela */}
                <div 
                  className="tech-icon-wrapper bg-white d-inline-flex align-items-center justify-content-center p-2"
                  style={{ 
                    width: '105px', 
                    height: '105px',
                    borderRadius: '24px',
                    border: '2.5px solid #fbcfe8',
                    boxShadow: '0 10px 24px rgba(236, 72, 153, 0.15)'
                  }}
                  title={`Sede Activa: ${plantillaEdicion.id_escuela === 'sb' ? 'UE Santa Bárbara' : (plantillaEdicion.id_escuela === 'lb' ? 'UE Libertador Bolívar' : 'Todas las Sedes')}`}
                >
                  <img 
                    src={`/assets/img/logo_${plantillaEdicion.id_escuela === 'todas' ? (localStorage.getItem('sigae_escuela_codigo') || 'sb') : plantillaEdicion.id_escuela}.png`} 
                    alt="Escudo Institucional" 
                    className="img-fluid"
                    style={{ maxHeight: '85px', maxWidth: '85px', objectFit: 'contain' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                  />
                </div>
              </div>
            </div>

            {/* Título, Badges y Beacon Tecnológico */}
            <div className="col-12 col-md">
              <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                {/* Live Campus Beacon */}
                <div 
                  className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill bg-white border shadow-xs"
                  style={{ borderColor: '#fbcfe8' }}
                >
                  <span className="status-beacon-live" style={{ color: '#ec4899' }}></span>
                  <span 
                    className="extra-small fw-bold text-uppercase" 
                    style={{ fontSize: '0.72rem', color: '#be185d', letterSpacing: '0.5px' }}
                  >
                    Campus Diseños &bull; Generador de Documentos Oficiales
                  </span>
                </div>

                <span className="badge text-white fw-bold px-3 py-1.5 rounded-pill small shadow-xs" style={{ backgroundColor: '#ec4899' }}>
                  <i className="bi bi-palette-fill me-1"></i>Formatos Oficiales & Carnets
                </span>
                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs">
                  <i className="bi bi-file-earmark-richtext text-primary me-1"></i><b>{plantillas.length}</b> Plantillas
                </span>
                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs">
                  <i className="bi bi-building me-1"></i>Sede: <b>{plantillaEdicion.id_escuela === 'sb' ? 'Santa Bárbara' : (plantillaEdicion.id_escuela === 'lb' ? 'Libertador Bolívar' : 'Todas las Sedes')}</b>
                </span>
              </div>

              <h1 className="fw-bolder mb-1.5 text-dark" style={{ fontSize: 'calc(1.5rem + 0.75vw)', letterSpacing: '-0.6px' }}>
                Editor de Constancias & Carnets
              </h1>

              <p className="mb-0 text-muted small d-flex align-items-center gap-1.5 flex-wrap">
                <i className="bi bi-info-circle-fill text-primary flex-shrink-0"></i>
                <span className="fw-semibold">Ajuste las firmas digitales, membretes, sellos húmedos, colores y textos de las constancias y carnets oficiales con código QR.</span>
              </p>
            </div>

            {/* Acciones Rápidas */}
            <div className="col-12 col-md-auto text-md-end text-center">
              <button
                type="button"
                onClick={() => window.location.href = '/categoria/Diseños'}
                className="btn btn-white bg-white text-dark rounded-pill px-4 py-2 fw-bold shadow-xs hover-efecto border d-inline-flex align-items-center gap-2"
                style={{ fontSize: '0.85rem', borderColor: '#fbcfe8' }}
              >
                <i className="bi bi-arrow-left" style={{ color: '#be185d' }}></i>
                <span>Volver a Diseños</span>
              </button>
            </div>

          </div>
        </div>

        {/* Barra de Herramientas Chamilo */}
        <div className="px-4 py-2.5 bg-light border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              className="btn btn-success rounded-pill px-3.5 py-1.5 fw-bold shadow-xs hover-efecto d-flex align-items-center gap-1.5"
              style={{ fontSize: '0.82rem' }}
              onClick={handleGuardarPlantilla}
              disabled={guardando}
            >
              {guardando ? (
                <span className="spinner-border spinner-border-sm"></span>
              ) : (
                <i className="bi bi-floppy-fill"></i>
              )}
              <span>Guardar y Aplicar al Sistema</span>
            </button>

            <button
              className="btn btn-white bg-white text-muted border rounded-pill px-3 py-1.5 fw-bold shadow-xs hover-efecto d-flex align-items-center gap-1"
              style={{ fontSize: '0.82rem' }}
              onClick={handleRestaurarPredeterminados}
              title="Restaurar a las constancias y carnets oficiales consolidados"
            >
              <i className="bi bi-arrow-counterclockwise text-warning"></i>
              <span>Restaurar Originales</span>
            </button>
          </div>

          <div className="d-flex align-items-center gap-1.5">
            <span className="text-muted extra-small">
              <i className="bi bi-check-circle-fill text-success me-1"></i>Editor Sincronizado
            </span>
          </div>
        </div>
      </div>

      {/* Selector de Plantilla y Herramientas Superiores */}
      <div className="card bg-white shadow-sm border-0 rounded-4 p-3 mb-4">
        {/* Filtros Rápidos de Tipo */}
        <div className="d-flex align-items-center gap-2 mb-3 border-bottom pb-3 flex-wrap">
          <span className="small fw-bold text-muted me-2">
            <i className="bi bi-funnel-fill text-primary me-1"></i>Filtrar Formatos:
          </span>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 fw-bold ${filtroTipoPlantilla === 'TODAS' ? 'btn-dark shadow-sm' : 'btn-outline-secondary'}`}
            onClick={() => setFiltroTipoPlantilla('TODAS')}
          >
            Todos ({plantillas.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 fw-bold ${filtroTipoPlantilla === 'CONSTANCIAS' ? 'btn-primary shadow-sm' : 'btn-outline-primary'}`}
            onClick={() => {
              setFiltroTipoPlantilla('CONSTANCIAS');
              const firstConst = plantillas.find(p => p.codigo_tipo !== 'carnet' && p.codigo_tipo !== 'aceptacion');
              if (firstConst) seleccionarPlantilla(firstConst.id);
            }}
          >
            <i className="bi bi-file-earmark-text-fill me-1"></i>
            Constancias Oficiales ({plantillas.filter(p => p.codigo_tipo !== 'carnet' && p.codigo_tipo !== 'aceptacion').length})
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 fw-bold ${filtroTipoPlantilla === 'CARNETS' ? 'btn-warning text-dark shadow-sm' : 'btn-outline-warning text-dark'}`}
            onClick={() => {
              setFiltroTipoPlantilla('CARNETS');
              const firstCarnet = plantillas.find(p => p.codigo_tipo === 'carnet');
              if (firstCarnet) seleccionarPlantilla(firstCarnet.id);
            }}
          >
            <i className="bi bi-person-badge-fill me-1"></i>
            Carnets Estudiantiles ({plantillas.filter(p => p.codigo_tipo === 'carnet').length})
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 fw-bold ${filtroTipoPlantilla === 'ACEPTACION' ? 'btn-info text-white shadow-sm' : 'btn-outline-info'}`}
            onClick={() => {
              setFiltroTipoPlantilla('ACEPTACION');
              const firstAcept = plantillas.find(p => p.codigo_tipo === 'aceptacion');
              if (firstAcept) seleccionarPlantilla(firstAcept.id);
            }}
          >
            <i className="bi bi-envelope-paper-check-fill me-1"></i>
            Cartas de Aceptación ({plantillas.filter(p => p.codigo_tipo === 'aceptacion').length})
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 fw-bold ${filtroTipoPlantilla === 'NORMAS' ? 'btn-danger text-white shadow-sm' : 'btn-outline-danger'}`}
            onClick={() => {
              setFiltroTipoPlantilla('NORMAS');
              const firstNormas = plantillas.find(p => p.codigo_tipo === 'normas');
              if (firstNormas) seleccionarPlantilla(firstNormas.id);
            }}
          >
            <i className="bi bi-file-earmark-ruled-fill me-1"></i>
            Normas Internas ({plantillas.filter(p => p.codigo_tipo === 'normas').length})
          </button>
        </div>

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '650px' }}>
            <label className="small fw-bold text-muted text-nowrap m-0">
              <i className="bi bi-file-earmark-text-fill text-primary me-1"></i>Plantilla Activa:
            </label>
            <select 
              className="form-select form-select-sm border-info rounded-pill fw-bold"
              value={plantillaActivaId}
              onChange={(e) => seleccionarPlantilla(e.target.value)}
            >
              {plantillasFiltradas.map(p => (
                <option key={p.id} value={p.id}>
                  {p.codigo_tipo === 'carnet' ? '🪪 ' : (p.codigo_tipo === 'aceptacion' ? '✉️ ' : (p.codigo_tipo === 'normas' ? '📜 ' : '📄 '))}
                  {p.nombre} ({p.id_escuela === 'todas' ? 'Ambas Escuelas' : p.id_escuela.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="d-flex align-items-center flex-wrap gap-2">
            <button 
              type="button"
              className={`btn btn-sm ${esPlantillaActualActiva ? 'btn-success' : 'btn-outline-danger'} rounded-pill px-3 fw-bold shadow-sm d-flex align-items-center gap-1.5`}
              onClick={handleToggleEstadoPlantillaActual}
              title="Haz clic para activar o desactivar este documento en el portal de representantes"
            >
              <i className={`bi ${esPlantillaActualActiva ? 'bi-toggle-on fs-5' : 'bi-toggle-off fs-5'}`}></i>
              <span>{esPlantillaActualActiva ? 'En Portal: Activo' : 'En Portal: Inactivo'}</span>
            </button>
            <button 
              className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold"
              onClick={handleCrearNuevaPlantilla}
            >
              <i className="bi bi-plus-lg me-1"></i>Crear Nueva Plantilla
            </button>
            <button 
              className={`btn btn-sm ${plantillaEdicion.codigo_tipo === 'carnet' ? 'btn-warning text-dark' : (plantillaEdicion.codigo_tipo === 'aceptacion' ? 'btn-info text-white' : (plantillaEdicion.codigo_tipo === 'normas' ? 'btn-danger text-white' : 'btn-success'))} rounded-pill px-3 fw-bold shadow-sm`}
              onClick={handleDescargarPdfPrueba}
              title={plantillaEdicion.codigo_tipo === 'carnet' ? 'Descargar Carnet Estudiantil en PDF' : (plantillaEdicion.codigo_tipo === 'aceptacion' ? 'Descargar Carta de Aceptación Oficial en PDF' : (plantillaEdicion.codigo_tipo === 'normas' ? 'Descargar Normas y Acuerdos Internos en PDF' : 'Descargar prueba de la constancia oficial en PDF'))}
            >
              <i className={`bi ${plantillaEdicion.codigo_tipo === 'carnet' ? 'bi-person-badge-fill' : (plantillaEdicion.codigo_tipo === 'aceptacion' ? 'bi-envelope-paper-check-fill' : (plantillaEdicion.codigo_tipo === 'normas' ? 'bi-file-earmark-ruled-fill' : 'bi-file-earmark-pdf-fill'))} me-1`}></i>
              {plantillaEdicion.codigo_tipo === 'carnet' ? 'Descargar PDF Carnet' : (plantillaEdicion.codigo_tipo === 'aceptacion' ? 'Descargar PDF Aceptación' : (plantillaEdicion.codigo_tipo === 'normas' ? 'Descargar PDF Normas' : 'Descargar PDF Oficial'))}
            </button>
          </div>
        </div>
      </div>

      {/* Área de Trabajo: Editor (Izquierda) + Vista Previa Oficial (Derecha) */}
      <div className="row g-4">
        {/* PANEL IZQUIERDO: CONTROLES DEL EDITOR */}
        <div className="col-12 col-xl-5">
          <div className="card bg-white shadow-sm border-0 rounded-4 overflow-hidden h-100">
            {/* Pestañas del Editor */}
            <div className="card-header bg-white border-bottom p-3">
              <div className="btn-group w-100 shadow-sm rounded-pill p-1 bg-light border" role="group">
                <button 
                  type="button" 
                  className={`btn btn-sm rounded-pill fw-bold ${tabEditor === 'firmas' ? 'btn-primary text-white shadow-sm' : 'btn-light text-dark'}`}
                  onClick={() => setTabEditor('firmas')}
                >
                  <i className="bi bi-pen-fill me-1"></i> 1. Firmas & Dirección
                </button>
                <button 
                  type="button" 
                  className={`btn btn-sm rounded-pill fw-bold ${tabEditor === 'redaccion' ? 'btn-primary text-white shadow-sm' : 'btn-light text-dark'}`}
                  onClick={() => setTabEditor('redaccion')}
                >
                  <i className="bi bi-textarea-t me-1"></i> 2. Textos & Párrafos
                </button>
                <button 
                  type="button" 
                  className={`btn btn-sm rounded-pill fw-bold ${tabEditor === 'grafica' ? 'btn-primary text-white shadow-sm' : 'btn-light text-dark'}`}
                  onClick={() => setTabEditor('grafica')}
                >
                  <i className="bi bi-building me-1"></i> 3. Membrete & Logos
                </button>
              </div>
            </div>

            <div className="card-body p-4" style={{ maxHeight: '720px', overflowY: 'auto' }}>
              {/* PESTAÑA 1: FIRMAS Y DIRECCIÓN */}
              {tabEditor === 'firmas' && (
                <div className="animate__animated animate__fadeIn">
                  <h6 className="fw-bold text-dark mb-2">
                    <i className="bi bi-person-badge-fill text-primary me-2"></i>Datos del Director(a) Firmante
                  </h6>
                  <p className="small text-muted mb-3">
                    Configura el nombre del directivo, cédula y sube su firma digitalizada oficial en formato PNG transparente.
                  </p>

                  <div className="row g-2 mb-3">
                    <div className="col-4">
                      <label className="small fw-bold text-muted">Prefijo/Título:</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm"
                        placeholder="Prof. / Profa."
                        value={plantillaEdicion.titulo_director}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, titulo_director: e.target.value })}
                      />
                    </div>
                    <div className="col-8">
                      <label className="small fw-bold text-muted">Nombre Completo del Director:</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm fw-bold"
                        value={plantillaEdicion.nombre_director}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, nombre_director: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="small fw-bold text-muted">Cédula de Identidad:</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm font-monospace"
                        placeholder="17.780.095"
                        value={plantillaEdicion.cedula_director}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, cedula_director: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="small fw-bold text-muted">Cargo Genérico:</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm"
                        placeholder="Director / Directora"
                        value={plantillaEdicion.cargo_generico}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, cargo_generico: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="small fw-bold text-muted">Cargo Institucional Completo:</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm"
                        placeholder="Director de la Unidad Educativa..."
                        value={plantillaEdicion.cargo_director}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, cargo_director: e.target.value })}
                      />
                    </div>
                  </div>

                  <hr className="text-muted" />

                  {/* Imagen de la Firma Digital */}
                  <h6 className="fw-bold text-dark mb-2">Firma Digitalizada del Director</h6>
                  <div className="p-3 border rounded-3 bg-light d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <img 
                        src={plantillaEdicion.firma_digital_url || `/assets/img/firma_director_${plantillaEdicion.id_escuela === 'sb' ? 'sb' : 'lb'}.png`} 
                        alt="Firma Director" 
                        style={{ height: '55px', maxWidth: '160px', objectFit: 'contain' }}
                        className="border rounded p-1 bg-white"
                      />
                      <div>
                        <span className="small fw-bold text-dark d-block">Firma Actual</span>
                        <span className="text-muted" style={{ fontSize: '11px' }}>PNG con fondo transparente</span>
                      </div>
                    </div>
                    <label className="btn btn-sm btn-outline-primary rounded-pill px-3 cursor-pointer m-0">
                      <i className="bi bi-upload me-1"></i>Cambiar Firma
                      <input 
                        type="file" 
                        accept="image/png,image/jpeg" 
                        className="d-none" 
                        onChange={(e) => handleUploadImage(e, 'firma')} 
                      />
                    </label>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="sw-mostrar-firma"
                      checked={plantillaEdicion.mostrar_firma_digital}
                      onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, mostrar_firma_digital: e.target.checked })}
                    />
                    <label className="form-check-label small fw-bold text-dark cursor-pointer" htmlFor="sw-mostrar-firma">
                      Estampar Firma Digitalizada en la Constancia
                    </label>
                  </div>
                </div>
              )}

              {/* PESTAÑA 2: TEXTOS Y PÁRRAFOS */}
              {tabEditor === 'redaccion' && (
                <div className="animate__animated animate__fadeIn">
                  <h6 className="fw-bold text-dark mb-2">
                    <i className="bi bi-textarea-t text-primary me-2"></i>
                    {plantillaEdicion.codigo_tipo === 'aceptacion' ? 'Redacción Oficial de la Carta de Aceptación' : 'Redacción Oficial de los Párrafos'}
                  </h6>

                  {plantillaEdicion.codigo_tipo === 'aceptacion' ? (
                    <div className="d-flex flex-column gap-3">
                      <div className="alert alert-primary py-2.5 px-3 rounded-3 small mb-0 d-flex align-items-center gap-2">
                        <i className="bi bi-file-earmark-richtext-fill fs-5 text-primary"></i>
                        <div>
                          <strong>Editor Integral de Carta de Aceptación (3 Páginas)</strong>
                          <div className="text-muted" style={{ fontSize: '11px' }}>
                            Personaliza todos los textos oficiales de las páginas 1, 2 y 3. Los cambios se actualizan en vivo en la vista previa y en el PDF oficial.
                          </div>
                        </div>
                      </div>

                      {/* SUB-SECCIÓN 1: PÁGINA 1 - IDENTIFICACIÓN E INTRODUCCIÓN */}
                      <div className="card border rounded-3 overflow-hidden shadow-xs">
                        <div className="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                          <span className="small fw-bold text-dark">
                            <i className="bi bi-1-circle-fill text-primary me-1.5"></i> 1. Encabezado, Período e Introducción
                          </span>
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle">Pág. 1</span>
                        </div>
                        <div className="card-body p-3">
                          <div className="row g-2 mb-3">
                            <div className="col-12 col-md-7">
                              <label className="small fw-bold text-muted mb-1">Título Oficial del Documento:</label>
                              <input 
                                type="text" 
                                className="form-control form-control-sm fw-bold"
                                value={plantillaEdicion.titulo_documento || ''}
                                onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, titulo_documento: e.target.value })}
                              />
                            </div>
                            <div className="col-12 col-md-5">
                              <label className="small fw-bold text-muted mb-1">Año Escolar / Período:</label>
                              <input 
                                type="text" 
                                className="form-control form-control-sm font-monospace fw-bold text-primary"
                                placeholder="2026 - 2027"
                                value={plantillaEdicion.periodo_escolar || '2026 - 2027'}
                                onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, periodo_escolar: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="small fw-bold text-muted mb-1">Notificación Inicial:</label>
                            <BarraHerramientasFormato
                              textareaId="ta-acept-notif-intro"
                              value={plantillaEdicion.parrafo_certificacion || ''}
                              onChange={(val) => setPlantillaEdicion({ ...plantillaEdicion, parrafo_certificacion: val })}
                              mostrarSaltoPagina={true}
                            />
                            <textarea 
                              id="ta-acept-notif-intro"
                              className="form-control form-control-sm rounded-top-0"
                              rows={4}
                              value={plantillaEdicion.parrafo_certificacion || ''}
                              onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, parrafo_certificacion: e.target.value })}
                            />
                            <div className="form-text text-muted" style={{ fontSize: '11px' }}>
                              Tip: Utiliza la barra superior para resaltar, negritas o saltos de página. Admite <code>{'{periodo_escolar}'}</code>.
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="small fw-bold text-muted mb-1">Párrafo de Aprobación de Cupo:</label>
                            <BarraHerramientasFormato
                              textareaId="ta-acept-aprobacion"
                              value={plantillaEdicion.parrafo_representante || ''}
                              onChange={(val) => setPlantillaEdicion({ ...plantillaEdicion, parrafo_representante: val })}
                              mostrarSaltoPagina={true}
                            />
                            <textarea 
                              id="ta-acept-aprobacion"
                              className="form-control form-control-sm rounded-top-0"
                              rows={3}
                              placeholder="Opcional. Si se deja vacío, no ocupará espacio adicional."
                              value={plantillaEdicion.parrafo_representante || ''}
                              onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, parrafo_representante: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="small fw-bold text-muted mb-1">Párrafo Introductorio a las Fases:</label>
                            <BarraHerramientasFormato
                              textareaId="ta-acept-fases-intro"
                              value={plantillaEdicion.texto_fases_intro || plantillaEdicion.parrafo_expedicion || ''}
                              onChange={(val) => setPlantillaEdicion({ 
                                ...plantillaEdicion, 
                                texto_fases_intro: val,
                                parrafo_expedicion: val 
                              })}
                            />
                            <textarea 
                              id="ta-acept-fases-intro"
                              className="form-control form-control-sm rounded-top-0"
                              rows={2}
                              value={plantillaEdicion.texto_fases_intro || plantillaEdicion.parrafo_expedicion || ''}
                              onChange={(e) => setPlantillaEdicion({ 
                                ...plantillaEdicion, 
                                texto_fases_intro: e.target.value,
                                parrafo_expedicion: e.target.value 
                              })}
                            />
                          </div>
                        </div>
                      </div>

                      {/* SUB-SECCIÓN 2: PÁGINA 1 - DETALLE DINÁMICO DE PASOS / FASES */}
                      <div className="card border rounded-3 overflow-hidden shadow-xs">
                        <div className="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-2">
                            <span className="small fw-bold text-dark">
                              <i className="bi bi-list-ol text-success me-1.5"></i> 2. Pasos y Fases del Proceso
                            </span>
                            <span className="badge bg-success-subtle text-success border border-success-subtle">
                              {fasesEdicion.length} {fasesEdicion.length === 1 ? 'Paso' : 'Pasos'}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-xs btn-primary rounded-pill px-2.5 py-1 fw-bold shadow-xs"
                            onClick={handleAgregarFase}
                          >
                            <i className="bi bi-plus-circle me-1"></i> Agregar Paso
                          </button>
                        </div>
                        <div className="card-body p-3">
                          <div className="text-muted small mb-3" style={{ fontSize: '11px' }}>
                            Agrega, reordena o retira pasos del proceso de inscripción según las directrices del año escolar. Puedes incluir fechas, horarios y lugares de atención.
                          </div>

                          {fasesEdicion.map((fase, idx) => (
                            <div key={fase.id || `fase-${idx}`} className="p-3 rounded-3 bg-white border mb-3 shadow-xs">
                              <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                                <div className="d-flex align-items-center gap-2">
                                  <span className="badge bg-primary text-white rounded-pill px-2 py-0.5" style={{ fontSize: '10.5px' }}>
                                    Paso {idx + 1}
                                  </span>
                                  <span className="fw-bold text-dark small">{fase.titulo || `Paso ${idx + 1}`}</span>
                                </div>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-xs py-0.5 px-2"
                                    title="Mover Paso Arriba"
                                    disabled={idx === 0}
                                    onClick={() => handleMoverFase(idx, 'arriba')}
                                  >
                                    <i className="bi bi-arrow-up"></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-xs py-0.5 px-2"
                                    title="Mover Paso Abajo"
                                    disabled={idx === fasesEdicion.length - 1}
                                    onClick={() => handleMoverFase(idx, 'abajo')}
                                  >
                                    <i className="bi bi-arrow-down"></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-xs py-0.5 px-2"
                                    title="Eliminar este Paso"
                                    onClick={() => handleEliminarFase(idx)}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </div>
                              </div>

                              <div className="mb-2">
                                <label className="small fw-bold text-dark mb-1">Título del Paso / Fase:</label>
                                <input 
                                  type="text" 
                                  className="form-control form-control-sm fw-bold text-primary"
                                  placeholder={`Fase ${idx + 1}: Título descriptivo`}
                                  value={fase.titulo || ''}
                                  onChange={(e) => handleEditarFase(idx, 'titulo', e.target.value)}
                                />
                              </div>

                              <div className="mb-2">
                                <label className="small fw-bold text-muted mb-1">Instrucciones y Requisitos del Paso:</label>
                                <BarraHerramientasFormato
                                  textareaId={`ta-fase-texto-${idx}`}
                                  value={fase.texto || ''}
                                  onChange={(val) => handleEditarFase(idx, 'texto', val)}
                                  mostrarSaltoPagina={true}
                                />
                                <textarea 
                                  id={`ta-fase-texto-${idx}`}
                                  className="form-control form-control-sm rounded-top-0"
                                  rows={3}
                                  placeholder="Detalla las instrucciones para este paso. Presiona Enter para saltos de línea."
                                  value={fase.texto || ''}
                                  onChange={(e) => handleEditarFase(idx, 'texto', e.target.value)}
                                />
                              </div>

                              {/* Parámetros Logísticos Opcionales */}
                              <div className="p-2.5 rounded-2 bg-light border mt-2">
                                <div className="d-flex align-items-center justify-content-between mb-1.5">
                                  <span className="small fw-bold text-secondary" style={{ fontSize: '11px' }}>
                                    <i className="bi bi-geo-alt-fill text-danger me-1"></i>Logística Opcional (Jornada, Lugar, Horario):
                                  </span>
                                  <span className="text-muted" style={{ fontSize: '10px' }}>Opcional (se omite si está vacío)</span>
                                </div>
                                <div className="row g-2">
                                  <div className="col-12 col-md-4">
                                    <label className="text-muted mb-0" style={{ fontSize: '10.5px' }}>Fecha / Días de Jornada:</label>
                                    <input 
                                      type="text" 
                                      className="form-control form-control-sm font-monospace"
                                      placeholder="16, 17 y 18/09/2026"
                                      value={fase.fecha || ''}
                                      onChange={(e) => handleEditarFase(idx, 'fecha', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-12 col-md-4">
                                    <label className="text-muted mb-0" style={{ fontSize: '10.5px' }}>Lugar de Atención:</label>
                                    <input 
                                      type="text" 
                                      className="form-control form-control-sm"
                                      placeholder="Sala Audiovisual / Auditorio"
                                      value={fase.lugar || ''}
                                      onChange={(e) => handleEditarFase(idx, 'lugar', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-12 col-md-4">
                                    <label className="text-muted mb-0" style={{ fontSize: '10.5px' }}>Horario:</label>
                                    <input 
                                      type="text" 
                                      className="form-control form-control-sm font-monospace"
                                      placeholder="8:30 a.m. a 11:30 a.m."
                                      value={fase.hora || ''}
                                      onChange={(e) => handleEditarFase(idx, 'hora', e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          <div className="text-center pt-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary rounded-pill px-4 fw-semibold"
                              onClick={handleAgregarFase}
                            >
                              <i className="bi bi-plus-circle me-1.5"></i> Agregar Nuevo Paso / Fase
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* SUB-SECCIÓN 3: PÁGINAS 1 Y 2 - RECAUDOS POR NIVEL EDUCATIVO */}
                      <div className="card border rounded-3 overflow-hidden shadow-xs">
                        <div className="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                          <span className="small fw-bold text-dark">
                            <i className="bi bi-folder-check text-warning me-1.5"></i> 3. Recaudos por Nivel Educativo
                          </span>
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">Págs. 1 y 2</span>
                        </div>
                        <div className="card-body p-3">
                          <div className="mb-3">
                            <label className="small fw-bold text-muted mb-1">Instrucción de Carpeta y Presentación:</label>
                            <BarraHerramientasFormato
                              textareaId="ta-acept-carpeta-nota"
                              value={plantillaEdicion.recaudos_carpeta_nota || ''}
                              onChange={(val) => setPlantillaEdicion({ ...plantillaEdicion, recaudos_carpeta_nota: val })}
                            />
                            <textarea 
                              id="ta-acept-carpeta-nota"
                              className="form-control form-control-sm rounded-top-0"
                              rows={2}
                              value={plantillaEdicion.recaudos_carpeta_nota || ''}
                              onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, recaudos_carpeta_nota: e.target.value })}
                            />
                          </div>

                          <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <label className="small fw-bold text-dark">Recaudos - Educación Inicial:</label>
                              <span className="text-muted" style={{ fontSize: '11px' }}>1 ítem por salto de línea</span>
                            </div>
                            <BarraHerramientasFormato
                              textareaId="ta-acept-rec-inicial"
                              value={Array.isArray(plantillaEdicion.recaudos_inicial) ? plantillaEdicion.recaudos_inicial.join('\n') : (plantillaEdicion.recaudos_inicial || '')}
                              onChange={(val) => setPlantillaEdicion({ ...plantillaEdicion, recaudos_inicial: val })}
                            />
                            <textarea 
                              id="ta-acept-rec-inicial"
                              className="form-control form-control-sm rounded-top-0"
                              rows={4}
                              value={Array.isArray(plantillaEdicion.recaudos_inicial) ? plantillaEdicion.recaudos_inicial.join('\n') : (plantillaEdicion.recaudos_inicial || '')}
                              onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, recaudos_inicial: e.target.value })}
                            />
                          </div>

                          <div className="row g-2 mb-3">
                            <div className="col-12 col-md-6">
                              <label className="small fw-bold text-dark mb-1">Primaria - Hijos de Trabajadores:</label>
                              <BarraHerramientasFormato
                                textareaId="ta-acept-rec-prim-hijos"
                                value={Array.isArray(plantillaEdicion.recaudos_primaria_hijos) ? plantillaEdicion.recaudos_primaria_hijos.join('\n') : (plantillaEdicion.recaudos_primaria_hijos || '')}
                                onChange={(val) => setPlantillaEdicion({ ...plantillaEdicion, recaudos_primaria_hijos: val })}
                              />
                              <textarea 
                                id="ta-acept-rec-prim-hijos"
                                className="form-control form-control-sm rounded-top-0"
                                rows={5}
                                value={Array.isArray(plantillaEdicion.recaudos_primaria_hijos) ? plantillaEdicion.recaudos_primaria_hijos.join('\n') : (plantillaEdicion.recaudos_primaria_hijos || '')}
                                onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, recaudos_primaria_hijos: e.target.value })}
                              />
                            </div>
                            <div className="col-12 col-md-6">
                              <label className="small fw-bold text-dark mb-1">Primaria - Hermanos, Sobrinos y Nietos:</label>
                              <BarraHerramientasFormato
                                textareaId="ta-acept-rec-prim-fam"
                                value={Array.isArray(plantillaEdicion.recaudos_primaria_familiares) ? plantillaEdicion.recaudos_primaria_familiares.join('\n') : (plantillaEdicion.recaudos_primaria_familiares || '')}
                                onChange={(val) => setPlantillaEdicion({ ...plantillaEdicion, recaudos_primaria_familiares: val })}
                              />
                              <textarea 
                                id="ta-acept-rec-prim-fam"
                                className="form-control form-control-sm rounded-top-0"
                                rows={5}
                                value={Array.isArray(plantillaEdicion.recaudos_primaria_familiares) ? plantillaEdicion.recaudos_primaria_familiares.join('\n') : (plantillaEdicion.recaudos_primaria_familiares || '')}
                                onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, recaudos_primaria_familiares: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="row g-2">
                            <div className="col-12 col-md-6">
                              <label className="small fw-bold text-dark mb-1">Media General - Hijos de Trabajadores:</label>
                              <BarraHerramientasFormato
                                textareaId="ta-acept-rec-med-hijos"
                                value={Array.isArray(plantillaEdicion.recaudos_media_hijos) ? plantillaEdicion.recaudos_media_hijos.join('\n') : (plantillaEdicion.recaudos_media_hijos || '')}
                                onChange={(val) => setPlantillaEdicion({ ...plantillaEdicion, recaudos_media_hijos: val })}
                              />
                              <textarea 
                                id="ta-acept-rec-med-hijos"
                                className="form-control form-control-sm rounded-top-0"
                                rows={5}
                                value={Array.isArray(plantillaEdicion.recaudos_media_hijos) ? plantillaEdicion.recaudos_media_hijos.join('\n') : (plantillaEdicion.recaudos_media_hijos || '')}
                                onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, recaudos_media_hijos: e.target.value })}
                              />
                            </div>
                            <div className="col-12 col-md-6">
                              <label className="small fw-bold text-dark mb-1">Media General - Hermanos, Sobrinos y Nietos:</label>
                              <BarraHerramientasFormato
                                textareaId="ta-acept-rec-med-fam"
                                value={Array.isArray(plantillaEdicion.recaudos_media_familiares) ? plantillaEdicion.recaudos_media_familiares.join('\n') : (plantillaEdicion.recaudos_media_familiares || '')}
                                onChange={(val) => setPlantillaEdicion({ ...plantillaEdicion, recaudos_media_familiares: val })}
                              />
                              <textarea 
                                id="ta-acept-rec-med-fam"
                                className="form-control form-control-sm rounded-top-0"
                                rows={5}
                                value={Array.isArray(plantillaEdicion.recaudos_media_familiares) ? plantillaEdicion.recaudos_media_familiares.join('\n') : (plantillaEdicion.recaudos_media_familiares || '')}
                                onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, recaudos_media_familiares: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SUB-SECCIÓN 4: PÁGINA 3 - ORIENTACIONES GENERALES Y DESPEDIDA */}
                      <div className="card border rounded-3 overflow-hidden shadow-xs">
                        <div className="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                          <span className="small fw-bold text-dark">
                            <i className="bi bi-info-square-fill text-info me-1.5"></i> 4. Orientaciones Generales & Cierre
                          </span>
                          <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle">Pág. 3</span>
                        </div>
                        <div className="card-body p-3">
                          <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <label className="small fw-bold text-dark">Orientaciones Generales para el Proceso:</label>
                              <span className="text-muted" style={{ fontSize: '11px' }}>1 orientación numerada por línea</span>
                            </div>
                            <BarraHerramientasFormato
                              textareaId="ta-acept-orientaciones"
                              value={Array.isArray(plantillaEdicion.orientaciones_generales) ? plantillaEdicion.orientaciones_generales.join('\n') : (plantillaEdicion.orientaciones_generales || '')}
                              onChange={(val) => setPlantillaEdicion({ ...plantillaEdicion, orientaciones_generales: val })}
                            />
                            <textarea 
                              id="ta-acept-orientaciones"
                              className="form-control form-control-sm rounded-top-0"
                              rows={4}
                              value={Array.isArray(plantillaEdicion.orientaciones_generales) ? plantillaEdicion.orientaciones_generales.join('\n') : (plantillaEdicion.orientaciones_generales || '')}
                              onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, orientaciones_generales: e.target.value })}
                            />
                          </div>

                          <div className="mb-3">
                            <label className="small fw-bold text-dark mb-1">Mensaje de Agradecimiento Final:</label>
                            <BarraHerramientasFormato
                              textareaId="ta-acept-agradecimiento"
                              value={plantillaEdicion.texto_agradecimiento_final || ''}
                              onChange={(val) => setPlantillaEdicion({ ...plantillaEdicion, texto_agradecimiento_final: val })}
                            />
                            <textarea 
                              id="ta-acept-agradecimiento"
                              className="form-control form-control-sm rounded-top-0"
                              rows={2}
                              value={plantillaEdicion.texto_agradecimiento_final || ''}
                              onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, texto_agradecimiento_final: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="small fw-bold text-muted mb-1">Ciudad de Expedición:</label>
                            <input 
                              type="text" 
                              className="form-control form-control-sm"
                              placeholder="Miraflores / El Tejero"
                              value={plantillaEdicion.ciudad_expedicion || ''}
                              onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, ciudad_expedicion: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : plantillaEdicion.codigo_tipo === 'normas' ? (
                    <div className="d-flex flex-column gap-3">
                      <div className="alert alert-danger py-2.5 px-3 rounded-3 small mb-0 d-flex align-items-center gap-2">
                        <i className="bi bi-file-earmark-ruled-fill fs-5 text-danger"></i>
                        <div>
                          <strong>Editor de Normativa Interna (3 Páginas)</strong>
                          <div className="text-muted" style={{ fontSize: '11px' }}>
                            Personaliza los 11 artículos de la normativa interna (horarios, uniformes, transporte, deberes del Art. 17 LOE, zonificación y compromiso legal).
                          </div>
                        </div>
                      </div>

                      {/* SUB-SECCIÓN 1: PÁGINA 1 - DATOS Y NORMAS 1 A 6 */}
                      <div className="card border rounded-3 overflow-hidden shadow-xs">
                        <div className="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                          <span className="small fw-bold text-dark">
                            <i className="bi bi-1-circle-fill text-danger me-1.5"></i> 1. Título, Introducción y Cláusulas 1 a 6
                          </span>
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle">Pág. 1</span>
                        </div>
                        <div className="card-body p-3">
                          <div className="row g-2 mb-3">
                            <div className="col-12 col-md-7">
                              <label className="small fw-bold text-muted mb-1">Título del Documento:</label>
                              <input 
                              type="text" 
                              className="form-control form-control-sm fw-bold"
                              value={plantillaEdicion.titulo_documento || ''}
                              onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, titulo_documento: e.target.value })}
                            />
                          </div>
                          <div className="col-12 col-md-5">
                            <label className="small fw-bold text-muted mb-1">Año Escolar:</label>
                            <input 
                              type="text" 
                              className="form-control form-control-sm font-monospace fw-bold text-danger"
                              value={plantillaEdicion.periodo_escolar || '2026 - 2027'}
                              onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, periodo_escolar: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="small fw-bold text-muted mb-1">Texto Introductorio / Declaración del Representante:</label>
                          <BarraHerramientasFormato
                            textareaId="ta-normas-intro"
                            value={plantillaEdicion.parrafo_certificacion || ''}
                            onChange={(val) => setPlantillaEdicion({ ...plantillaEdicion, parrafo_certificacion: val })}
                          />
                          <textarea 
                            id="ta-normas-intro"
                            className="form-control form-control-sm rounded-top-0"
                            rows={4}
                            value={plantillaEdicion.parrafo_certificacion || ''}
                            onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, parrafo_certificacion: e.target.value })}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="small fw-bold text-dark mb-1">1. Hora de Entrada:</label>
                          <input 
                            type="text" 
                            className="form-control form-control-sm"
                            value={plantillaEdicion.hora_entrada || ''}
                            onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, hora_entrada: e.target.value })}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="small fw-bold text-dark mb-1">2. Uniforme Educación Inicial (1 prenda/ítem por línea):</label>
                          <textarea 
                            className="form-control form-control-sm"
                            rows={3}
                            value={Array.isArray(plantillaEdicion.uniforme_inicial) ? plantillaEdicion.uniforme_inicial.join('\n') : (plantillaEdicion.uniforme_inicial || '')}
                            onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, uniforme_inicial: e.target.value })}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="small fw-bold text-dark mb-1">3. Uniforme Educación Primaria (1 prenda/ítem por línea):</label>
                          <textarea 
                            className="form-control form-control-sm"
                            rows={3}
                            value={Array.isArray(plantillaEdicion.uniforme_primaria) ? plantillaEdicion.uniforme_primaria.join('\n') : (plantillaEdicion.uniforme_primaria || '')}
                            onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, uniforme_primaria: e.target.value })}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="small fw-bold text-dark mb-1">4. Uniforme Media General (1 prenda/ítem por línea):</label>
                          <textarea 
                            className="form-control form-control-sm"
                            rows={3}
                            value={Array.isArray(plantillaEdicion.uniforme_media) ? plantillaEdicion.uniforme_media.join('\n') : (plantillaEdicion.uniforme_media || '')}
                            onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, uniforme_media: e.target.value })}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="small fw-bold text-dark mb-1">5. Uniforme Educación Física y Deporte (1 prenda por línea):</label>
                          <textarea 
                            className="form-control form-control-sm"
                            rows={3}
                            value={Array.isArray(plantillaEdicion.uniforme_educacion_fisica) ? plantillaEdicion.uniforme_educacion_fisica.join('\n') : (plantillaEdicion.uniforme_educacion_fisica || '')}
                            onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, uniforme_educacion_fisica: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="small fw-bold text-dark mb-1">6. Transporte Escolar:</label>
                          <textarea 
                            className="form-control form-control-sm"
                            rows={3}
                            value={plantillaEdicion.transporte_escolar || ''}
                            onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, transporte_escolar: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* SUB-SECCIÓN 2: PÁGINA 2 - NORMAS 7 A 8 */}
                    <div className="card border rounded-3 overflow-hidden shadow-xs">
                      <div className="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                        <span className="small fw-bold text-dark">
                          <i className="bi bi-2-circle-fill text-danger me-1.5"></i> 2. Otros Aspectos Disciplinarios y Deberes Art. 17 LOE
                        </span>
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle">Pág. 2</span>
                      </div>
                      <div className="card-body p-3">
                        <div className="mb-3">
                          <label className="small fw-bold text-dark mb-1">7. Otros Aspectos Disciplinarios (1 regla por línea):</label>
                          <textarea 
                            className="form-control form-control-sm"
                            rows={4}
                            value={Array.isArray(plantillaEdicion.otros_aspectos) ? plantillaEdicion.otros_aspectos.join('\n') : (plantillaEdicion.otros_aspectos || '')}
                            onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, otros_aspectos: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="small fw-bold text-dark mb-1">8. Deberes de los Padres, Madres y Representantes (Art. 17 LOE - 1 deber por línea):</label>
                          <textarea 
                            className="form-control form-control-sm"
                            rows={5}
                            value={Array.isArray(plantillaEdicion.deberes_representantes) ? plantillaEdicion.deberes_representantes.join('\n') : (plantillaEdicion.deberes_representantes || '')}
                            onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, deberes_representantes: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* SUB-SECCIÓN 3: PÁGINA 3 - ZONIFICACIÓN 9 A 11, COMPROMISO Y FIRMAS */}
                    <div className="card border rounded-3 overflow-hidden shadow-xs">
                      <div className="card-header bg-light py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                        <span className="small fw-bold text-dark">
                          <i className="bi bi-3-circle-fill text-danger me-1.5"></i> 3. Zonificación, Normativas & Compromiso
                        </span>
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle">Pág. 3</span>
                      </div>
                      <div className="card-body p-3">
                        <div className="mb-3">
                          <label className="small fw-bold text-dark mb-1">9. Zonificación por Cambio de Residencia (Comunidad) (1 punto por línea):</label>
                          <textarea 
                            className="form-control form-control-sm"
                            rows={4}
                            value={Array.isArray(plantillaEdicion.zonificacion_residencia) ? plantillaEdicion.zonificacion_residencia.join('\n') : (plantillaEdicion.zonificacion_residencia || '')}
                            onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, zonificacion_residencia: e.target.value })}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="small fw-bold text-dark mb-1">10. Apego Total a las Normativas Institucionales (General) (1 punto por línea):</label>
                          <textarea 
                            className="form-control form-control-sm"
                            rows={3}
                            value={Array.isArray(plantillaEdicion.apego_normativas) ? plantillaEdicion.apego_normativas.join('\n') : (plantillaEdicion.apego_normativas || '')}
                            onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, apego_normativas: e.target.value })}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="small fw-bold text-dark mb-1">11. Zonificación por Repitencias (Cambio de Ambiente Escolar) (1 punto por línea):</label>
                          <textarea 
                            className="form-control form-control-sm"
                            rows={5}
                            value={Array.isArray(plantillaEdicion.zonificacion_repitencias) ? plantillaEdicion.zonificacion_repitencias.join('\n') : (plantillaEdicion.zonificacion_repitencias || '')}
                            onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, zonificacion_repitencias: e.target.value })}
                          />
                        </div>

                        <div className="mb-3">
                          <label className="small fw-bold text-dark mb-1">Declaración de Compromiso y Aceptación Final:</label>
                          <BarraHerramientasFormato
                            textareaId="ta-normas-compromiso"
                            value={plantillaEdicion.texto_declaracion_compromiso || ''}
                            onChange={(val) => setPlantillaEdicion({ ...plantillaEdicion, texto_declaracion_compromiso: val })}
                          />
                          <textarea 
                            id="ta-normas-compromiso"
                            className="form-control form-control-sm rounded-top-0"
                            rows={3}
                            value={plantillaEdicion.texto_declaracion_compromiso || ''}
                            onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, texto_declaracion_compromiso: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="small fw-bold text-muted mb-1">Ciudad de Expedición:</label>
                          <input 
                            type="text" 
                            className="form-control form-control-sm"
                            placeholder="Miraflores / El Tejero"
                            value={plantillaEdicion.ciudad_expedicion || ''}
                            onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, ciudad_expedicion: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  ) : (
                    <div>
                      <p className="small text-muted mb-3">
                        Personaliza la redacción manteniendo las etiquetas dinámicas para la sustitución automática de datos:
                      </p>

                      <div className="d-flex flex-wrap gap-1 mb-3 p-2 bg-light border rounded-3">
                        <button type="button" className="btn btn-xs btn-white border shadow-sm rounded-pill fw-bold text-primary" onClick={() => insertarTagEnCertificacion('{nombre_estudiante}')}>
                          + {`{nombre_estudiante}`}
                        </button>
                        <button type="button" className="btn btn-xs btn-white border shadow-sm rounded-pill fw-bold text-primary" onClick={() => insertarTagEnCertificacion('{cedula_estudiante}')}>
                          + {`{cedula_estudiante}`}
                        </button>
                        <button type="button" className="btn btn-xs btn-white border shadow-sm rounded-pill fw-bold text-primary" onClick={() => insertarTagEnCertificacion('{grado_actual}')}>
                          + {`{grado_actual}`}
                        </button>
                        <button type="button" className="btn btn-xs btn-white border shadow-sm rounded-pill fw-bold text-primary" onClick={() => insertarTagEnCertificacion('{periodo_escolar}')}>
                          + {`{periodo_escolar}`}
                        </button>
                        <button type="button" className="btn btn-xs btn-white border shadow-sm rounded-pill fw-bold text-primary" onClick={() => insertarTagEnCertificacion('{nombre_representante}')}>
                          + {`{nombre_representante}`}
                        </button>
                      </div>

                      <div className="mb-3">
                        <label className="small fw-bold text-muted mb-1">Título del Documento:</label>
                        <input 
                          type="text" 
                          className="form-control form-control-sm fw-bold"
                          value={plantillaEdicion.titulo_documento}
                          onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, titulo_documento: e.target.value })}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="small fw-bold text-muted mb-1">Párrafo 1: Certificación del Estudiante:</label>
                        <BarraHerramientasFormato
                          textareaId="ta-const-certificacion"
                          value={plantillaEdicion.parrafo_certificacion}
                          onChange={(val) => setPlantillaEdicion({ ...plantillaEdicion, parrafo_certificacion: val })}
                          mostrarSaltoPagina={true}
                        />
                        <textarea 
                          id="ta-const-certificacion"
                          className="form-control form-control-sm font-monospace rounded-top-0"
                          rows={6}
                          value={plantillaEdicion.parrafo_certificacion}
                          onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, parrafo_certificacion: e.target.value })}
                          style={{ fontSize: '12.5px', lineHeight: '1.5' }}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="small fw-bold text-muted mb-1">Párrafo 2: Representante Legal:</label>
                        <BarraHerramientasFormato
                          textareaId="ta-const-representante"
                          value={plantillaEdicion.parrafo_representante}
                          onChange={(val) => setPlantillaEdicion({ ...plantillaEdicion, parrafo_representante: val })}
                        />
                        <textarea 
                          id="ta-const-representante"
                          className="form-control form-control-sm font-monospace rounded-top-0"
                          rows={3}
                          value={plantillaEdicion.parrafo_representante}
                          onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, parrafo_representante: e.target.value })}
                          style={{ fontSize: '12.5px' }}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="small fw-bold text-muted mb-1">Párrafo 3: Expedición y Fecha:</label>
                        <BarraHerramientasFormato
                          textareaId="ta-const-expedicion"
                          value={plantillaEdicion.parrafo_expedicion}
                          onChange={(val) => setPlantillaEdicion({ ...plantillaEdicion, parrafo_expedicion: val })}
                        />
                        <textarea 
                          id="ta-const-expedicion"
                          className="form-control form-control-sm font-monospace rounded-top-0"
                          rows={2}
                          value={plantillaEdicion.parrafo_expedicion}
                          onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, parrafo_expedicion: e.target.value })}
                          style={{ fontSize: '12.5px' }}
                        />
                      </div>

                      <div className="mb-3">
                        <label className="small fw-bold text-muted mb-1">Ciudad de Expedición:</label>
                        <input 
                          type="text" 
                          className="form-control form-control-sm"
                          placeholder="El Tejero / Miraflores"
                          value={plantillaEdicion.ciudad_expedicion}
                          onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, ciudad_expedicion: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PESTAÑA 3: MEMBRETE Y LOGOS */}
              {tabEditor === 'grafica' && (
                <div className="animate__animated animate__fadeIn">
                  <h6 className="fw-bold text-dark mb-2">
                    <i className="bi bi-building text-primary me-2"></i>Membrete y Logotipos Oficiales
                  </h6>
                  <p className="small text-muted mb-3">
                    Configuración del encabezado oficial y logotipo institucional del plantel:
                  </p>

                  <div className="form-check form-switch mb-3">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="sw-bandera"
                      checked={plantillaEdicion.mostrar_bandera_venezuela}
                      onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, mostrar_bandera_venezuela: e.target.checked })}
                    />
                    <label className="form-check-label small fw-bold text-dark cursor-pointer" htmlFor="sw-bandera">
                      Mostrar Bandera Tricolor de Venezuela con 8 Estrellas
                    </label>
                  </div>

                  {/* Logo Escuela */}
                  <div className="p-3 border rounded-3 bg-light d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <img 
                        src={plantillaEdicion.logo_escuela_url || `/assets/img/logo_${plantillaEdicion.id_escuela === 'sb' ? 'sb' : 'lb'}.png`} 
                        alt="Logo Escuela" 
                        style={{ height: '55px', maxWidth: '80px', objectFit: 'contain' }}
                        className="border rounded p-1 bg-white"
                      />
                      <div>
                        <span className="small fw-bold text-dark d-block">Escudo del Plantel</span>
                        <span className="text-muted" style={{ fontSize: '11px' }}>Logo izquierdo oficial</span>
                      </div>
                    </div>
                    <label className="btn btn-sm btn-outline-primary rounded-pill px-3 cursor-pointer m-0">
                      <i className="bi bi-upload me-1"></i>Cambiar Escudo
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="d-none" 
                        onChange={(e) => handleUploadImage(e, 'logo_escuela')} 
                      />
                    </label>
                  </div>

                  {/* Líneas de Membrete */}
                  <div className="row g-2 mb-3">
                    <div className="col-12">
                      <label className="small text-muted">Línea 1:</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm"
                        value={plantillaEdicion.membrete_linea1}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, membrete_linea1: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="small text-muted">Línea 2:</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm"
                        value={plantillaEdicion.membrete_linea2}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, membrete_linea2: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="small text-muted">Nombre de la Escuela:</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm fw-bold"
                        value={plantillaEdicion.membrete_nombre_escuela}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, membrete_nombre_escuela: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="small text-muted">Ubicación Institucional:</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm"
                        value={plantillaEdicion.membrete_ubicacion}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, membrete_ubicacion: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: VISTA PREVIA EXACTA (RÉPLICA OFICIAL) */}
        <div className="col-12 col-xl-7">
          <div className="card bg-white shadow-sm border-0 rounded-4 overflow-hidden h-100">
            <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1.5 rounded-pill fw-bold">
                  <i className="bi bi-check-circle-fill me-1"></i> Formato Réplica Oficial Idéntico
                </span>
              </div>

              {/* Selector de Estudiante de Prueba */}
              <div className="d-flex align-items-center gap-2">
                <div className="dropdown">
                  <button 
                    className="btn btn-sm btn-outline-secondary rounded-pill dropdown-toggle fw-bold"
                    type="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <i className="bi bi-person-bounding-box me-1"></i>
                    {estudianteSeleccionado ? `${estudianteSeleccionado.apellidos_estudiante}, ${estudianteSeleccionado.nombres_estudiante}` : 'Estudiante de Prueba'}
                  </button>
                  <div className="dropdown-menu dropdown-menu-end shadow-lg p-2 rounded-4" style={{ minWidth: '320px', maxHeight: '350px', overflowY: 'auto' }}>
                    <div className="p-2">
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-white border-end-0 rounded-start-pill text-muted">
                          <i className="bi bi-search"></i>
                        </span>
                        <input 
                          type="text" 
                          className="form-control form-control-sm border-start-0 border-end-0"
                          placeholder="Buscar por cédula o nombre..."
                          value={searchEstudianteMuestra}
                          onChange={(e) => setSearchEstudianteMuestra(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {searchEstudianteMuestra ? (
                          <button
                            type="button"
                            className="input-group-text bg-white border-start-0 rounded-end-pill text-muted hover-efecto"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchEstudianteMuestra('');
                            }}
                            title="Limpiar búsqueda"
                          >
                            <i className="bi bi-x-circle-fill text-danger"></i>
                          </button>
                        ) : (
                          <span className="input-group-text bg-white border-start-0 rounded-end-pill"></span>
                        )}
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    {estudiantesFiltradosMuestra.map((e) => (
                      <button 
                        key={e.cedula_estudiante}
                        className="dropdown-item p-2 rounded-3 text-truncate"
                        onClick={() => setEstudianteSeleccionado(e)}
                      >
                        <div className="fw-bold text-dark">{e.apellidos_estudiante}, {e.nombres_estudiante}</div>
                        <div className="small text-muted">C.I. {e.cedula_estudiante} | {e.grado_actual} "{e.seccion_actual}"</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="btn-group btn-group-sm">
                  <button className="btn btn-light border" onClick={() => setZoomPreview(prev => Math.max(70, prev - 10))} title="Alejar zoom">-</button>
                  <span className="btn btn-light border disabled fw-bold" style={{ width: '55px' }}>{zoomPreview}%</span>
                  <button className="btn btn-light border" onClick={() => setZoomPreview(prev => Math.min(130, prev + 10))} title="Acercar zoom">+</button>
                </div>
              </div>
            </div>

            {/* Hoja de la Constancia o Carnet Estudiantil */}
            <div className="card-body p-4 bg-light d-flex justify-content-center align-items-start overflow-auto" style={{ maxHeight: '720px' }}>
              {plantillaEdicion.codigo_tipo === 'carnet' ? (
                <div className="d-flex flex-column align-items-center w-100 animate__animated animate__fadeIn">
                  <div className="alert alert-warning py-2 px-4 rounded-pill small fw-bold mb-3 d-flex align-items-center gap-2 shadow-sm">
                    <i className="bi bi-person-badge-fill text-dark"></i>
                    <span>Vista Previa Oficial del Carnet Estudiantil (Anverso y Reverso CR-80)</span>
                  </div>
                  {datosCarnetPrueba ? (
                    <div 
                      style={{
                        transform: `scale(${zoomPreview / 100})`,
                        transformOrigin: 'top center'
                      }}
                      dangerouslySetInnerHTML={{ __html: renderCarnetContainerHTML(datosCarnetPrueba) }}
                    />
                  ) : (
                    <div className="text-center py-5">
                      <div className="spinner-border text-warning" role="status"></div>
                      <p className="mt-2 small text-muted">Cargando vista previa del carnet...</p>
                    </div>
                  )}
                </div>
              ) : plantillaEdicion.codigo_tipo === 'aceptacion' ? (
                <div className="d-flex flex-column align-items-center w-100 animate__animated animate__fadeIn">
                  <div className="alert alert-info py-2 px-4 rounded-pill small fw-bold mb-3 d-flex align-items-center gap-2 shadow-sm">
                    <i className="bi bi-file-earmark-check-fill text-info"></i>
                    <span>Vista Previa Oficial de la Carta de Aceptación (3 Páginas Réplica Idéntica)</span>
                  </div>
                  <div 
                    style={{
                      transform: `scale(${zoomPreview / 100})`,
                      transformOrigin: 'top center',
                      width: '820px',
                      maxWidth: '100%'
                    }}
                    dangerouslySetInnerHTML={{ __html: htmlCartaAceptacionPreview }}
                  />
                </div>
              ) : plantillaEdicion.codigo_tipo === 'normas' ? (
                <div className="d-flex flex-column align-items-center w-100 animate__animated animate__fadeIn">
                  <div className="alert alert-danger py-2 px-4 rounded-pill small fw-bold mb-3 d-flex align-items-center gap-2 shadow-sm">
                    <i className="bi bi-file-earmark-ruled-fill text-danger"></i>
                    <span>Vista Previa Oficial de Normativa Interna (3 Páginas Réplica Idéntica)</span>
                  </div>
                  <div 
                    style={{
                      transform: `scale(${zoomPreview / 100})`,
                      transformOrigin: 'top center',
                      width: '820px',
                      maxWidth: '100%'
                    }}
                    dangerouslySetInnerHTML={{ __html: htmlNormasInternasPreview }}
                  />
                </div>
              ) : (
                <div 
                  ref={previewRef}
                  className="bg-white shadow rounded-4 animate__animated animate__fadeIn mx-auto"
                  style={{
                    width: '800px',
                    maxWidth: '100%',
                    border: '2px solid #94a3b8',
                    color: '#000000',
                    boxSizing: 'border-box',
                    minHeight: '1035px',
                    padding: '42px 48px 35px 48px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    fontFamily: plantillaEdicion.fuente_familia || 'Arial, Helvetica, sans-serif',
                    transform: `scale(${zoomPreview / 100})`,
                    transformOrigin: 'top center'
                  }}
                >
                  <div>
                    {/* BANDERA DE VENEZUELA CON 8 ESTRELLAS */}
                    {plantillaEdicion.mostrar_bandera_venezuela && (
                      <div style={{ marginBottom: '16px', borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: '6px', backgroundColor: '#facc15' }}></div>
                        <div style={{ height: '9px', backgroundColor: '#003893', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', color: '#ffffff', fontSize: '7.5px', lineHeight: '1', fontWeight: 'bold', userSelect: 'none' }}>
                          <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: '#cf142b' }}></div>
                      </div>
                    )}

                    {/* ENCABEZADO INSTITUCIONAL */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '2px solid #cbd5e1', paddingBottom: '16px', marginBottom: '25px', position: 'relative' }}>
                      <img 
                        src={plantillaEdicion.logo_escuela_url || `/assets/img/logo_${plantillaEdicion.id_escuela === 'sb' ? 'sb' : 'lb'}.png`} 
                        alt="Escuela" 
                        style={{ height: '70px', width: 'auto', position: 'absolute', left: 0 }} 
                      />
                      <div style={{ textAlign: 'center', width: '100%' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1.45', textTransform: 'uppercase', color: '#000000' }}>
                          {plantillaEdicion.membrete_linea1}<br/>
                          {plantillaEdicion.membrete_linea2}<br/>
                          {textoProcesado.membreteEscuela}<br/>
                          <span style={{ fontWeight: 'normal', fontSize: '12px', textTransform: 'none', color: '#334155' }}>
                            {textoProcesado.membreteUbicacion}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* TÍTULO DE LA CONSTANCIA */}
                    <div style={{ textAlign: 'center', margin: '28px 0 24px' }}>
                      <h2 style={{ margin: 0, fontSize: 21, fontWeight: 'bold', color: '#000000', letterSpacing: '0.5px' }}>
                        {plantillaEdicion.titulo_documento}
                      </h2>
                    </div>

                    {/* PÁRRAFO 1: CERTIFICACIÓN */}
                    <p 
                      style={{ fontSize: `${plantillaEdicion.tamano_fuente || 14.5}px`, lineHeight: plantillaEdicion.interlineado || 2.15, color: '#000000', textAlign: 'justify', marginBottom: '24px', textIndent: '35px' }}
                      dangerouslySetInnerHTML={{ __html: textoProcesado.p1 }}
                    />

                    {/* PÁRRAFO 2: REPRESENTANTE */}
                    <p 
                      style={{ fontSize: `${plantillaEdicion.tamano_fuente || 14.5}px`, lineHeight: plantillaEdicion.interlineado || 2.15, color: '#000000', textAlign: 'justify', marginBottom: '24px', textIndent: '35px' }}
                      dangerouslySetInnerHTML={{ __html: textoProcesado.p2 }}
                    />

                    {/* PÁRRAFO 3: FECHA Y EXPEDICIÓN */}
                    <p 
                      style={{ fontSize: `${plantillaEdicion.tamano_fuente || 14.5}px`, lineHeight: plantillaEdicion.interlineado || 2.15, color: '#000000', textAlign: 'justify', marginBottom: '28px', textIndent: '35px' }}
                      dangerouslySetInnerHTML={{ __html: textoProcesado.p3 }}
                    />
                  </div>

                  <div>
                    {/* ATENTAMENTE Y FIRMA DEL DIRECTOR CON QR */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px', paddingTop: '15px', borderTop: '1.5px solid #cbd5e1' }}>
                      <div style={{ textAlign: 'center', flex: 1, maxWidth: '440px', margin: '0 auto' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '13.5px', fontWeight: 'bold', color: '#000000' }}>Atentamente</p>
                        
                        {plantillaEdicion.mostrar_firma_digital && (
                          <img 
                            src={plantillaEdicion.firma_digital_url || `/assets/img/firma_director_${plantillaEdicion.id_escuela === 'sb' ? 'sb' : 'lb'}.png`} 
                            alt="Firma Director" 
                            style={{ height: '105px', width: 'auto', display: 'block', margin: '0 auto 5px' }} 
                          />
                        )}
                        
                        <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#000000' }}>
                          {plantillaEdicion.titulo_director} {plantillaEdicion.nombre_director}
                        </div>
                        <div style={{ fontSize: '12px', color: '#333333' }}>
                          C.I.: {plantillaEdicion.cedula_director}
                        </div>
                        <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#000000' }}>
                          {plantillaEdicion.cargo_director}
                        </div>
                      </div>

                      {plantillaEdicion.mostrar_codigo_qr && (
                        <div style={{ textAlign: 'center', border: '1.5px solid #cbd5e1', padding: '6px', borderRadius: '10px', background: '#ffffff', minWidth: '95px' }}>
                          <img 
                            src={textoProcesado.urlQrConstancia} 
                            alt="QR Verificación" 
                            style={{ height: '72px', width: '72px', display: 'block', margin: '0 auto' }} 
                          />
                          <span style={{ fontSize: '7.5px', fontWeight: 'bold', color: '#166534', fontFamily: 'monospace', display: 'block', marginTop: '4px' }}>
                            VERIFICACIÓN QR
                          </span>
                          <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#0f172a', fontFamily: 'monospace', display: 'block' }}>
                            {textoProcesado.codigoConstancia}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* PIE DE PÁGINA */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '10px', marginTop: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img 
                          src={plantillaEdicion.logo_mppe_url || '/assets/img/logoMPPE.png'} 
                          alt="MPPE" 
                          style={{ height: '40px', width: 'auto' }} 
                        />
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '8.5px', color: '#64748b' }}>
                        SIGAE - Control Estudiantil | Constancia Oficial de Inscripción Verificable mediante Código QR<br/>
                        Cód. Autenticidad: <b style={{ color: '#166534', fontFamily: 'monospace' }}>{textoProcesado.codigoConstancia}</b>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorConstancias;
