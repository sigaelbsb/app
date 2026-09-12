/**
 * Motor Oficial de Generación de Normativa Interna Institucional - SIGAE
 * Basado en el documento oficial de Normas Internas de la U.E. Santa Bárbara / U.E. Libertador Bolívar.
 * Genera documento de 2 páginas con firmas protegidas, validación QR y exportación nítida a PDF.
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabase';
import { obtenerFirmaDirectorProtegida } from './firmasSeguras';
import { toTitulo } from '../lib/formatters';

declare const Swal: any;

export interface DatosEstudianteNormasInternas {
  codigo_unico?: string;
  codigo_escuela: 'sb' | 'lb';
  estudiante_nombres: string;
  estudiante_apellidos: string;
  estudiante_cedula?: string;
  grado_solicitado?: string;
  representante_nombres: string;
  representante_apellidos: string;
  representante_cedula: string;
  representante_telefono?: string;
  parentesco?: string;
  fecha_emision?: string;
}

export interface PlantillaNormasInternasConfig {
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

  // Cláusulas de Normas
  texto_introductorio: string;
  hora_entrada: string;
  uniforme_inicial: string[];
  uniforme_primaria: string[];
  uniforme_media: string[];
  uniforme_educacion_fisica: string[];
  transporte_escolar: string;
  otros_aspectos: string[];
  deberes_representantes: string[];
  zonificacion_residencia?: string[];
  apego_normativas?: string[];
  zonificacion_repitencias?: string[];
  texto_declaracion_compromiso: string;

  // Firmas y Autoridades
  titulo_director: string;
  nombre_director: string;
  cedula_director: string;
  cargo_director: string;
  firma_digital_url: string;
  mostrar_firma_digital: boolean;
  mostrar_codigo_qr: boolean;
}

export const PLANTILLAS_NORMAS_DEFAULT: Record<'sb' | 'lb', PlantillaNormasInternasConfig> = {
  sb: {
    id: 'NORMAS-CONV-SB',
    id_escuela: 'sb',
    nombre: 'Normativa Interna Oficial (U.E. Santa Bárbara)',
    titulo_documento: 'Normativa Interna',
    periodo_escolar: '2026 - 2027',
    membrete_linea1: 'República Bolivariana de Venezuela.',
    membrete_linea2: 'Ministerio del Poder Popular para la Educación.',
    membrete_nombre_escuela: 'Unidad Educativa Santa Bárbara',
    membrete_ubicacion: 'El Tejero, estado Monagas.',
    logo_escuela_url: '/assets/img/logo_sb.png',
    mostrar_bandera: true,
    texto_introductorio: 'Quien suscribe, el/la ciudadano(a): <b>{nombre_representante}</b>, titular de la C.I. N.° <b>{cedula_representante}</b>, en mi condición de Representante Legal del/la estudiante: <b>{nombre_estudiante}</b>, titular de la {tipo_cedula} N.° <b>{cedula_estudiante}</b>, cursante del <b>{grado_actual}</b> en la <b>{nombre_escuela}</b>; por medio de la presente declaro conocer, aceptar y comprometerme formalmente a cumplir y hacer cumplir la siguiente Normativa Interna de la institución:',
    hora_entrada: 'Educación Inicial, Educación Primaria y Educación Media General: 7:00 a.m. (Los portones se cerrarán puntualmente).',
    uniforme_inicial: [
      'Mono azul marino clásico escolar.',
      'Chemise amarilla con logotipo oficial de la institución bordado o estampado al lado izquierdo.',
      'Medias blancas escolares.',
      'Zapato escolar negro o marrón.',
      'Suéter escolar azul marino de botón o cierre, debidamente identificado con su nombre y logo institucional (opcional).'
    ],
    uniforme_primaria: [
      'Pantalón azul marino (corte escolar recto, no tipo tubo ni modificado).',
      'Chemise blanca con logotipo oficial de la institución al lado izquierdo.',
      'Medias blancas escolares.',
      'Zapatos escolares negro o marrón.',
      'Correa negra o marrón.',
      'Suéter escolar azul marino de botón o cierre identificado con su nombre y logo institucional (opcional).'
    ],
    uniforme_media: [
      'Pantalón azul marino (corte escolar recto, no tipo tubo ni modificado).',
      'Chemise azul celeste con logotipo de la escuela para estudiantes de 1ro a 3er Año.',
      'Chemise beige con logotipo de la escuela para estudiantes de 4to y 5to Año.',
      'Medias blancas escolares.',
      'Zapatos escolares negro o marrón y correa negra o marrón.',
      'Suéter escolar azul marino de botón o cierre debidamente identificado con su nombre y logo institucional (opcional).'
    ],
    uniforme_educacion_fisica: [
      'Mono azul marino deportivo institucional.',
      'Franela blanca con logotipo oficial de la institución.',
      'Medias blancas deportivas.',
      'Zapatos deportivos: negro, marrón o blanco (adecuados para actividad física).'
    ],
    transporte_escolar: 'En las unidades de Transporte Escolar, el estudiante deberá ir sentado obligatoriamente, manteniendo una actitud de absoluto respeto hacia el conductor, docentes acompañantes y el resto de sus compañeros, así como velar por el orden, la higiene y la preservación integral de la unidad que aborda. El incumplimiento de estas normas acarreará las medidas disciplinarias que amerite el caso.',
    otros_aspectos: [
      'Presentación Personal: No está permitido el uso de piercing, tintes llamativos en el cabello, uñas postizas y accesorios excesivos o extravagantes (collares gruesos, pulseras múltiples, zarcillos colgantes, maquillajes, pintura de uñas de colores no neutros).',
      'Corte de Cabello: Los niños y adolescentes usarán corte de cabello clásico y tradicional, sin degradados extremos, líneas o figuras rapadas.',
      'Prendas y Gorras: El uso de gorras sólo será permitido de manera exclusiva en actividades deportivas al aire libre y jornadas recreativas.',
      'Dispositivos Electrónicos: No está permitido el uso de celulares y equipos electrónicos (Mp4, iPods, consolas portátiles, tablets, cornetas portátiles, entre otros) en el recinto escolar que interfieran en el desarrollo de las actividades académicas. Solo se permitirá su uso con fines estrictamente pedagógicos o de emergencia médica, bajo la previa autorización del docente guía. La Institución no se hace responsable bajo ninguna circunstancia por deterioro, daño o extravío de dichos equipos.'
    ],
    deberes_representantes: [
      'Leer, cumplir y hacer cumplir las normas establecidas en el Manual de Convivencia Escolar y Comunitario vigente en la institución.',
      'Atención a Representantes: Los representantes serán atendidos únicamente durante las horas de atención administrativa del docente o previa convocatoria formal de la institución.',
      'Código de Vestimenta: Portar vestimenta acorde a las normativas de seguridad y convivencia exigidas por la Empresa PDVSA (no shorts, no bermudas, no franelillas, no escotes ni chancletas).',
      'Asistencia Obligatoria: Asistir con puntualidad a las reuniones, entregas de boletines y asambleas generales convocadas por la Dirección, Coordinación, Docentes Guías y Especialistas. En caso de inasistencia injustificada, se informará mediante comunicación oficial al supervisor inmediato en PDVSA.',
      'Acompañamiento Pedagógico: Acompañar activamente a su representado(a) a los eventos institucionales donde participe: cierres de proyectos pedagógicos, exposiciones, ferias científicas, actos culturales y encuentros deportivos.',
      'Comunidad Escolar: Mantener en todo momento un trato respetuoso, cortés y constructivo hacia directivos, docentes, personal administrativo, obrero y demás representantes.',
      'Emergencias de Salud: En situaciones donde el estudiante requiera atención médica de urgencia, la institución se comunicará de inmediato con el representante legal y, de ser estrictamente necesario, procederá a su traslado al centro asistencial o Clínica PDVSA.',
      'Salud y Medicamentos: Abstenerse de enviar a su representado a clases en caso de enfermedad infectocontagiosa, fiebre o heridas abiertas recientes. Es de obligatorio conocimiento que el personal docente no administrará medicamentos bajo ninguna circunstancia a ningún estudiante.',
      'Retiros en Horario de Clases: Notificar con debida anticipación ante la Coordinación de Evaluación y Control de Estudios cualquier retiro justificado del estudiante en horario regular.',
      'Autorizaciones por Escrito: Consignar por escrito ante la Dirección del plantel la autorización formal (con copia de cédula) de la persona delegada para retirar al estudiante en caso de no poder asistir el representante legal.',
      'Informes Médicos: Suministrar oportunamente a la institución los informes médicos actualizados y soportes clínicos en caso de que el estudiante posea alguna condición o requerimiento especial de salud.',
      'Rutas de Transporte: Informar formalmente y por escrito a la Coordinación de Transporte Escolar cualquier modificación o eventualidad relacionada con la ruta asignada al estudiante.',
      'Tratamientos y Dietas: Garantizar el cabal cumplimiento de tratamientos médicos o regímenes dietéticos prescritos por especialistas a su representado o personalizada.',
      'Corresponsabilidad Formativa (Art. 17 de la LOE): «Las familias tienen el deber, el derecho y la responsabilidad en la orientación y formación en principios, valores, creencias, actitudes y hábitos en los niños, niñas, adolescentes, jóvenes, adultos y adultas, para cultivar respeto, amor, honestidad, tolerancia, reflexión, participación, independencia y aceptación. Las familias, la escuela, la sociedad y el Estado son corresponsables en el proceso de educación ciudadana y desarrollo integral de sus integrantes».'
    ],
    zonificacion_residencia: [
      'Se define como Comunidad a aquellos estudiantes que residen en el entorno de la escuela y cuyo representante legal no es trabajador de PDVSA ni de empresas adscritas.',
      'En caso de que un estudiante de esta categoría cambie su lugar de residencia a localidades foráneas donde se requiera el uso de unidades de transporte obligatorio. La institución y el/la representante gestionará la zonificación y reasignación del estudiante a la Unidad Educativa correspondiente a su nueva localidad, a través del Centro de Desarrollo para la Calidad Educativa del municipio o estado.',
      'Garantía de Continuidad: Se garantiza el derecho irrenunciable del estudiante a culminar el año escolar en curso en esta institución. El proceso de zonificación y traslado se hará efectivo únicamente para el inicio del siguiente año escolar.'
    ],
    apego_normativas: [
      'Se establece de manera expresa que todas las normas, lineamientos, deberes y acuerdos establecidos en el presente documento son de cumplimiento obligatorio para toda la matrícula, incluyendo tanto a los familiares de trabajadores de PDVSA como a los estudiantes de la Comunidad.',
      'La admisión y permanencia del estudiante en esta Unidad Educativa implica la aceptación irrestricta de este reglamento interno, sin excepción alguna.'
    ],
    zonificacion_repitencias: [
      'Esta norma aplica a toda la matrícula sin distinción de categoría (familiares de trabajadores PDVSA y Comunidad).',
      'El/la estudiante que repita por segunda vez dentro del mismo nivel educativo (Educación Primaria o Media General) deberá ser zonificado(a) y reasignado(a) a otra Unidad Educativa, bajo la premisa de cambio de ambiente escolar.',
      'El cambio de ambiente escolar es una estrategia pedagógica orientada a ofrecer al estudiante la oportunidad de desenvolverse en un nuevo espacio educativo, con dinámicas, relaciones y entornos diferentes, que favorezcan su adaptación, motivación y rendimiento académico.',
      'La Dirección del plantel, en articulación con los departamentos de Evaluación y Orientación, notificará por escrito al representante legal sobre la procedencia de esta medida, acompañando la comunicación con las recomendaciones pertinentes para garantizar la continuidad del proceso formativo del/la estudiante en la nueva institución.'
    ],
    texto_declaracion_compromiso: 'Constancia que se suscribe en señal de plena conformidad, compromiso y corresponsabilidad mutua entre la familia y la institución para el estricto cumplimiento de la presente Normativa Interna durante el Año Escolar 2026 - 2027.',
    titulo_director: 'Profa.',
    nombre_director: 'Elika Dayana Chaviel Rondón',
    cedula_director: '16.808.608',
    cargo_director: 'Directora de Unidad Educativa Santa Bárbara',
    firma_digital_url: '/assets/img/firma_director_sb.png',
    mostrar_firma_digital: true,
    mostrar_codigo_qr: true
  },
  lb: {
    id: 'NORMAS-CONV-LB',
    id_escuela: 'lb',
    nombre: 'Normativa Interna Oficial (U.E. Libertador Bolívar)',
    titulo_documento: 'Normativa Interna',
    periodo_escolar: '2026 - 2027',
    membrete_linea1: 'República Bolivariana de Venezuela.',
    membrete_linea2: 'Ministerio del Poder Popular para la Educación.',
    membrete_nombre_escuela: 'Unidad Educativa Libertador Bolívar',
    membrete_ubicacion: 'Miraflores, estado Monagas.',
    logo_escuela_url: '/assets/img/logo_lb.png',
    mostrar_bandera: true,
    texto_introductorio: 'Quien suscribe, el/la ciudadano(a): <b>{nombre_representante}</b>, titular de la C.I. N.° <b>{cedula_representante}</b>, en mi condición de Representante Legal del/la estudiante: <b>{nombre_estudiante}</b>, titular de la {tipo_cedula} N.° <b>{cedula_estudiante}</b>, cursante del <b>{grado_actual}</b> en la <b>{nombre_escuela}</b>; por medio de la presente declaro conocer, aceptar y comprometerme formalmente a cumplir y hacer cumplir la siguiente Normativa Interna de la institución:',
    hora_entrada: 'Educación Inicial, Educación Primaria y Educación Media General: 7:00 a.m. (Los portones se cerrarán puntualmente).',
    uniforme_inicial: [
      'Mono azul marino clásico escolar.',
      'Chemise amarilla con logotipo oficial de la institución bordado o estampado al lado izquierdo.',
      'Medias blancas escolares.',
      'Zapato escolar negro o marrón.',
      'Suéter escolar azul marino de botón o cierre, debidamente identificado con su nombre y logo institucional (opcional).'
    ],
    uniforme_primaria: [
      'Pantalón azul marino (corte escolar recto, no tipo tubo ni modificado).',
      'Chemise blanca con logotipo oficial de la institución al lado izquierdo.',
      'Medias blancas escolares.',
      'Zapatos escolares negro o marrón.',
      'Correa negra o marrón.',
      'Suéter escolar azul marino de botón o cierre identificado con su nombre y logo institucional (opcional).'
    ],
    uniforme_media: [
      'Pantalón azul marino (corte escolar recto, no tipo tubo ni modificado).',
      'Chemise azul celeste con logotipo de la escuela para estudiantes de 1ro a 3er Año.',
      'Chemise beige con logotipo de la escuela para estudiantes de 4to y 5to Año.',
      'Medias blancas escolares.',
      'Zapatos escolares negro o marrón y correa negra o marrón.',
      'Suéter escolar azul marino de botón o cierre debidamente identificado con su nombre y logo institucional (opcional).'
    ],
    uniforme_educacion_fisica: [
      'Mono azul marino deportivo institucional.',
      'Franela blanca con logotipo oficial de la institución.',
      'Medias blancas deportivas.',
      'Zapatos deportivos: negro, marrón o blanco (adecuados para actividad física).'
    ],
    transporte_escolar: 'En las unidades de Transporte Escolar, el estudiante deberá ir sentado obligatoriamente, manteniendo una actitud de absoluto respeto hacia el conductor, docentes acompañantes y el resto de sus compañeros, así como velar por el orden, la higiene y la preservación integral de la unidad que aborda. El incumplimiento de estas normas acarreará las medidas disciplinarias que amerite el caso.',
    otros_aspectos: [
      'Presentación Personal: No está permitido el uso de piercing, tintes llamativos en el cabello, uñas postizas y accesorios excesivos o extravagantes (collares gruesos, pulseras múltiples, zarcillos colgantes, maquillajes, pintura de uñas de colores no neutros).',
      'Corte de Cabello: Los niños y adolescentes usarán corte de cabello clásico y tradicional, sin degradados extremos, líneas o figuras rapadas.',
      'Prendas y Gorras: El uso de gorras sólo será permitido de manera exclusiva en actividades deportivas al aire libre y jornadas recreativas.',
      'Dispositivos Electrónicos: No está permitido el uso de celulares y equipos electrónicos (Mp4, iPods, consolas portátiles, tablets, cornetas portátiles, entre otros) en el recinto escolar que interfieran en el desarrollo de las actividades académicas. Solo se permitirá su uso con fines estrictamente pedagógicos o de emergencia médica, bajo la previa autorización del docente guía. La Institución no se hace responsable bajo ninguna circunstancia por deterioro, daño o extravío de dichos equipos.'
    ],
    deberes_representantes: [
      'Leer, cumplir y hacer cumplir las normas establecidas en el Manual de Convivencia Escolar y Comunitario vigente en la institución.',
      'Atención a Representantes: Los representantes serán atendidos únicamente durante las horas de atención administrativa del docente o previa convocatoria formal de la institución.',
      'Código de Vestimenta: Portar vestimenta acorde a las normativas de seguridad y convivencia exigidas por la Empresa PDVSA (no shorts, no bermudas, no franelillas, no escotes ni chancletas).',
      'Asistencia Obligatoria: Asistir con puntualidad a las reuniones, entregas de boletines y asambleas generales convocadas por la Dirección, Coordinación, Docentes Guías y Especialistas. En caso de inasistencia injustificada, se informará mediante comunicación oficial al supervisor inmediato en PDVSA.',
      'Acompañamiento Pedagógico: Acompañar activamente a su representado(a) a los eventos institucionales donde participe: cierres de proyectos pedagógicos, exposiciones, ferias científicas, actos culturales y encuentros deportivos.',
      'Comunidad Escolar: Mantener en todo momento un trato respetuoso, cortés y constructivo hacia directivos, docentes, personal administrativo, obrero y demás representantes.',
      'Emergencias de Salud: En situaciones donde el estudiante requiera atención médica de urgencia, la institución se comunicará de inmediato con el representante legal y, de ser estrictamente necesario, procederá a su traslado al centro asistencial o Clínica PDVSA.',
      'Salud y Medicamentos: Abstenerse de enviar a su representado a clases en caso de enfermedad infectocontagiosa, fiebre o heridas abiertas recientes. Es de obligatorio conocimiento que el personal docente no administrará medicamentos bajo ninguna circunstancia a ningún estudiante.',
      'Retiros en Horario de Clases: Notificar con debida anticipación ante la Coordinación de Evaluación y Control de Estudios cualquier retiro justificado del estudiante en horario regular.',
      'Autorizaciones por Escrito: Consignar por escrito ante la Dirección del plantel la autorización formal (con copia de cédula) de la persona delegada para retirar al estudiante en caso de no poder asistir el representante legal.',
      'Informes Médicos: Suministrar oportunamente a la institución los informes médicos actualizados y soportes clínicos en caso de que el estudiante posea alguna condición o requerimiento especial de salud.',
      'Rutas de Transporte: Informar formalmente y por escrito a la Coordinación de Transporte Escolar cualquier modificación o eventualidad relacionada con la ruta asignada al estudiante.',
      'Tratamientos y Dietas: Garantizar el cabal cumplimiento de tratamientos médicos o regímenes dietéticos prescritos por especialistas a su representado o representada.',
      'Corresponsabilidad Formativa (Art. 17 de la LOE): «Las familias tienen el deber, el derecho y la responsabilidad en la orientación y formación en principios, valores, creencias, actitudes y hábitos en los niños, niñas, adolescentes, jóvenes, adultos y adultas, para cultivar respeto, amor, honestidad, tolerancia, reflexión, participación, independencia y aceptación. Las familias, la escuela, la sociedad y el Estado son corresponsables en el proceso de educación ciudadana y desarrollo integral de sus integrantes».'
    ],
    zonificacion_residencia: [
      'Se define como Comunidad a aquellos estudiantes que residen en el entorno de la escuela y cuyo representante legal no es trabajador de PDVSA ni de empresas adscritas.',
      'En caso de que un estudiante de esta categoría cambie su lugar de residencia a localidades foráneas donde se requiera el uso de unidades de transporte obligatorio. La institución y el/la representante gestionará la zonificación y reasignación del estudiante a la Unidad Educativa correspondiente a su nueva localidad, a través del Centro de Desarrollo para la Calidad Educativa del municipio o estado.',
      'Garantía de Continuidad: Se garantiza el derecho irrenunciable del estudiante a culminar el año escolar en curso en esta institución. El proceso de zonificación y traslado se hará efectivo únicamente para el inicio del siguiente año escolar.'
    ],
    apego_normativas: [
      'Se establece de manera expresa que todas las normas, lineamientos, deberes y acuerdos establecidos en el presente documento son de cumplimiento obligatorio para toda la matrícula, incluyendo tanto a los familiares de trabajadores de PDVSA como a los estudiantes de la Comunidad.',
      'La admisión y permanencia del estudiante en esta Unidad Educativa implica la aceptación irrestricta de este reglamento interno, sin excepción alguna.'
    ],
    zonificacion_repitencias: [
      'Esta norma aplica a toda la matrícula sin distinción de categoría (familiares de trabajadores PDVSA y Comunidad).',
      'El/la estudiante que repita por segunda vez dentro del mismo nivel educativo (Educación Primaria o Media General) deberá ser zonificado(a) y reasignado(a) a otra Unidad Educativa, bajo la premisa de cambio de ambiente escolar.',
      'El cambio de ambiente escolar es una estrategia pedagógica orientada a ofrecer al estudiante la oportunidad de desenvolverse en un nuevo espacio educativo, con dinámicas, relaciones y entornos diferentes, que favorezcan su adaptación, motivación y rendimiento académico.',
      'La Dirección del plantel, en articulación con los departamentos de Evaluación y Orientación, notificará por escrito al representante legal sobre la procedencia de esta medida, acompañando la comunicación con las recomendaciones pertinentes para garantizar la continuidad del proceso formativo del/la estudiante en la nueva institución.'
    ],
    texto_declaracion_compromiso: 'Constancia que se suscribe en señal de plena conformidad, compromiso y corresponsabilidad mutua entre la familia y la institución para el estricto cumplimiento de la presente Normativa Interna durante el Año Escolar 2026 - 2027.',
    titulo_director: 'Prof.',
    nombre_director: 'José Vicente Millán Montaño',
    cedula_director: '17.780.095',
    cargo_director: 'Director de Unidad Educativa Libertador Bolívar',
    firma_digital_url: '/assets/img/firma_director_lb.png',
    mostrar_firma_digital: true,
    mostrar_codigo_qr: true
  }
};

const STORAGE_KEY_NORMAS = 'sigae_plantillas_normas_internas_v1';

export const obtenerPlantillasNormasInternas = (): PlantillaNormasInternasConfig[] => {
  const fusionarConDefault = (custom: any, esc: 'sb' | 'lb'): PlantillaNormasInternasConfig => {
    const base = PLANTILLAS_NORMAS_DEFAULT[esc];
    return {
      ...base,
      ...custom,
      zonificacion_residencia: Array.isArray(custom?.zonificacion_residencia) && custom.zonificacion_residencia.length > 0
        ? custom.zonificacion_residencia
        : base.zonificacion_residencia,
      apego_normativas: Array.isArray(custom?.apego_normativas) && custom.apego_normativas.length > 0
        ? custom.apego_normativas
        : base.apego_normativas,
      zonificacion_repitencias: Array.isArray(custom?.zonificacion_repitencias) && custom.zonificacion_repitencias.length > 0
        ? custom.zonificacion_repitencias
        : base.zonificacion_repitencias,
    };
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY_NORMAS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: any) => {
          const esc: 'sb' | 'lb' = p.id_escuela === 'sb' ? 'sb' : 'lb';
          return fusionarConDefault(p, esc);
        });
      }
    }
  } catch (e) {
    console.warn('Fallo leyendo caché local de plantillas normas:', e);
  }

  try {
    const rawConst = typeof window !== 'undefined' ? localStorage.getItem('sigae_plantillas_constancias') : null;
    if (rawConst) {
      const parsed = JSON.parse(rawConst);
      if (Array.isArray(parsed)) {
        const lbCustom = parsed.find((p: any) => p.codigo_tipo === 'normas' && p.id_escuela === 'lb');
        const sbCustom = parsed.find((p: any) => p.codigo_tipo === 'normas' && p.id_escuela === 'sb');
        if (lbCustom || sbCustom) {
          return [
            fusionarConDefault(lbCustom || {}, 'lb'),
            fusionarConDefault(sbCustom || {}, 'sb')
          ];
        }
      }
    }
  } catch (_) {}

  return [PLANTILLAS_NORMAS_DEFAULT.lb, PLANTILLAS_NORMAS_DEFAULT.sb];
};

export const guardarPlantillasNormasInternas = async (plantillas: PlantillaNormasInternasConfig[]): Promise<boolean> => {
  try {
    localStorage.setItem(STORAGE_KEY_NORMAS, JSON.stringify(plantillas));
    try {
      await supabase.from('configuraciones_sistema').upsert({
        clave: 'plantillas_normas_internas',
        valor: plantillas,
        updated_at: new Date().toISOString()
      }, { onConflict: 'clave' });
    } catch (_) {}
    return true;
  } catch (err) {
    console.error('Error guardando plantillas normas internas:', err);
    return false;
  }
};

/**
 * Parser de formato enriquecido Markdown
 */
const parseTexto = (texto?: string): string => {
  if (!texto) return '';
  let str = texto;
  str = str.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  str = str.replace(/__(.*?)__/g, '<u>$1</u>');
  str = str.replace(/~~(.*?)~~/g, '<s>$1</s>');
  str = str.replace(/==(.*?)==/g, '<mark style="background-color: #fef08a; padding: 1px 4px; border-radius: 3px; color: #1e293b;">$1</mark>');
  str = str.replace(/(^|[^\*])\*([^\*\n]+)\*([^\*]|$)/g, '$1<i>$2</i>$3');
  return str;
};

const renderListaItems = (items: string[] | string): string => {
  const arr = Array.isArray(items) ? items : (typeof items === 'string' ? items.split('\n').filter(Boolean) : []);
  return arr.map(it => `<li style="margin-bottom: 2px;">${parseTexto(it)}</li>`).join('');
};

export const obtenerPlantillaNormasInternas = (escCodigo: 'sb' | 'lb'): PlantillaNormasInternasConfig => {
  const lista = obtenerPlantillasNormasInternas();
  const encontrada = Array.isArray(lista) 
    ? lista.find(p => p.id_escuela === escCodigo)
    : (lista as any)[escCodigo];
  return encontrada || PLANTILLAS_NORMAS_DEFAULT[escCodigo] || PLANTILLAS_NORMAS_DEFAULT.sb;
};

/**
 * Renderiza el HTML oficial de 2 páginas de las Normas Internas
 */
export const renderNormasInternasHTML = (
  plantilla: PlantillaNormasInternasConfig,
  datos: DatosEstudianteNormasInternas,
  firmaProtegidaBase64?: string
): string => {
  const escCode = (datos.codigo_escuela || plantilla.id_escuela || 'lb').toLowerCase() as 'sb' | 'lb';
  const cPrim = escCode === 'sb' ? '#047857' : '#1d4ed8';
  const nombreEscuela = plantilla.membrete_nombre_escuela;
  const logoEscuela = plantilla.logo_escuela_url || `/assets/img/logo_${escCode}.png`;
  const anoEscolar = plantilla.periodo_escolar || '2026 - 2027';

  // Cédulas limpias
  const repCedulaLimpia = (datos.representante_cedula || '0000').replace(/\D/g, '');
  const estCedulaLimpia = (datos.estudiante_cedula || '').replace(/\D/g, '');
  const idRef = estCedulaLimpia || repCedulaLimpia || Math.floor(1000 + Math.random() * 9000).toString();
  const anoRef = (anoEscolar.split('-')[0] || new Date().getFullYear().toString()).replace(/\D/g, '').trim();

  // Código único anti-falsificación para el estudiante
  const codigoDoc = datos.codigo_unico && (datos.codigo_unico.startsWith('NI-') || datos.codigo_unico.startsWith('NORMAS-'))
    ? datos.codigo_unico
    : `NI-${escCode.toUpperCase()}-${idRef}-${anoRef}`;

  // Hash determinista de autenticidad
  const rawHash = `${escCode.toUpperCase()}:${repCedulaLimpia}:${estCedulaLimpia}:${anoEscolar}:NORMAS-SIGAE-2026`;
  let hashNum = 0;
  for (let i = 0; i < rawHash.length; i++) {
    hashNum = ((hashNum << 5) - hashNum) + rawHash.charCodeAt(i);
    hashNum |= 0;
  }
  const hexHash = Math.abs(hashNum).toString(16).toUpperCase().padStart(8, '0');
  const hashSeguridad = `${hexHash.slice(0, 4)}-${hexHash.slice(4, 8)}`;

  const esLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const baseUrlVerificacion = esLocal ? 'https://app-delta-ten-80.vercel.app' : (typeof window !== 'undefined' ? window.location.origin : 'https://app-delta-ten-80.vercel.app');
  const qrValidationUrl = `${baseUrlVerificacion}/validar-constancia/${encodeURIComponent(codigoDoc)}`;
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=3&data=${encodeURIComponent(qrValidationUrl)}`;

  const repNombre = toTitulo(`${datos.representante_nombres || ''} ${datos.representante_apellidos || ''}`.trim()) || 'Representante Legal';
  const estNombre = toTitulo(`${datos.estudiante_nombres || ''} ${datos.estudiante_apellidos || ''}`.trim()) || 'Estudiante';
  const gradoTxt = toTitulo(datos.grado_solicitado || '1er Grado');

  const cedEst = (datos.estudiante_cedula || '').trim();
  const tipoCedula = cedEst.toUpperCase().startsWith('CE') || cedEst.replace(/\D/g, '').length >= 10 ? 'Cédula Escolar' : 'Cédula de Identidad';

  const firmaDirectorSrc = firmaProtegidaBase64 || plantilla.firma_digital_url || `/assets/img/firma_director_${escCode}.png`;
  const mostrarFirma = plantilla.mostrar_firma_digital !== false;

  const intro = plantilla.texto_introductorio
    .replace(/{nombre_representante}/g, repNombre)
    .replace(/{cedula_representante}/g, datos.representante_cedula || 'N/A')
    .replace(/{nombre_estudiante}/g, estNombre)
    .replace(/{tipo_cedula}/g, tipoCedula)
    .replace(/{cedula_estudiante}/g, cedEst || 'N/A')
    .replace(/{grado_actual}/g, gradoTxt)
    .replace(/{nombre_escuela}/g, nombreEscuela);

  // Bandera Tricolor Nacional de Venezuela con las 8 estrellas blancas
  const banderaTricolorHTML = plantilla.mostrar_bandera ? `
    <div style="width: 100%; display: flex; flex-direction: column; overflow: hidden; border-radius: 4px; margin-bottom: 8px;">
      <div style="height: 5px; background-color: #facc15;"></div>
      <div style="height: 9px; background-color: #003893; display: flex; justify-content: center; align-items: center; gap: 4px; color: #ffffff; font-size: 7.5px; line-height: 1; font-weight: bold; user-select: none;">
        <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
      </div>
      <div style="height: 5px; background-color: #cf142b;"></div>
    </div>
  ` : '';

  // Encabezado institucional oficial (Logo de la escuela a la izquierda, membrete central y espaciador simétrico a la derecha)
  const encabezadoHTML = () => `
    ${banderaTricolorHTML}
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 8px; position: relative;">
      <div style="width: 72px; height: 62px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <img src="${logoEscuela}" alt="Escudo" crossOrigin="anonymous" style="max-height: 60px; max-width: 70px; object-fit: contain;" />
      </div>
      <div style="flex: 1; text-align: center; padding: 0 10px; line-height: 1.3;">
        <div style="font-size: 10.5px; font-weight: bold; text-transform: uppercase; color: #334155; letter-spacing: 0.5px;">${plantilla.membrete_linea1}</div>
        <div style="font-size: 9.5px; font-weight: bold; text-transform: uppercase; color: #64748b;">${plantilla.membrete_linea2}</div>
        <div style="font-size: 12.5px; font-weight: bold; text-transform: uppercase; color: ${cPrim}; margin-top: 1px;">${plantilla.membrete_nombre_escuela}</div>
        <div style="font-size: 9.5px; color: #475569;">${plantilla.membrete_ubicacion}</div>
      </div>
      <div style="width: 72px; flex-shrink: 0;"></div>
    </div>
  `;

  // Pie de página institucional oficial con el logo del MPPE en el pie de página
  const piePaginaHTML = (numPagina: number) => `
    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1.5px dashed #cbd5e1; padding-top: 6px; margin-top: 8px; font-size: 8.5px; color: #64748b;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <img src="/assets/img/logoMPPE.png" alt="MPPE" crossOrigin="anonymous" style="height: 24px; width: auto; object-fit: contain;" onError="this.style.display='none'" />
        <div style="line-height: 1.25;">
          <b style="color: #1e293b; font-size: 8.5px; text-transform: uppercase;">Ministerio del Poder Popular para la Educación</b><br/>
          <span style="color: #64748b; font-size: 8px;">SIGAE &bull; Control Estudiantil &bull; Normativa Interna Institucional</span>
        </div>
      </div>
      <div style="text-align: right; line-height: 1.25;">
        Cód. Verificación: <b style="color: #166534; font-family: monospace;">${codigoDoc}</b> &bull; Hash: <b style="font-family: monospace; color: #0f172a;">${hashSeguridad}</b><br/>
        <b>Página ${numPagina} de 3 Oficial</b>
      </div>
    </div>
  `;

  return `
  <div class="normas-internas-documento" style="font-family: Arial, Helvetica, sans-serif; color: #000000; font-size: 11.5px; line-height: 1.35; background: #ffffff;">
    
    <!-- ══════════════════════ PÁGINA 1 ══════════════════════ -->
    <div class="carta-pagina" style="width: 816px; min-height: 1045px; padding: 22px 38px 16px 38px; box-sizing: border-box; background: #ffffff; position: relative; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always;">
      <div>
        ${encabezadoHTML()}

        <!-- Cinta Distintiva del Documento y Período Escolar -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 5px solid ${cPrim}; border-radius: 6px; padding: 4px 12px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 10px; font-weight: bold; color: ${cPrim}; text-transform: uppercase; letter-spacing: 0.5px;">
            DOCUMENTO OFICIAL &bull; NORMATIVA INTERNA &bull; PÁGINA 1 DE 3
          </span>
          <span style="font-size: 9.5px; font-weight: bold; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 2px 8px; border-radius: 8px;">
            Año Escolar: ${anoEscolar}
          </span>
        </div>

        <!-- Título Principal -->
        <div style="text-align: center; margin-bottom: 6px;">
          <h2 style="margin: 0; font-size: 14.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
            ${plantilla.titulo_documento}
          </h2>
        </div>

        <!-- Introducción de Compromiso con datos del estudiante y representante -->
        <div style="font-size: 11px; line-height: 1.4; text-align: justify; margin-bottom: 7px; padding: 6px 10px; background: #f8fafc; border-left: 3.5px solid ${cPrim}; border-radius: 4px; border: 1px solid #e2e8f0;">
          ${intro}
        </div>

        <!-- 1. Hora de Entrada -->
        <div style="margin-bottom: 6px;">
          <div style="font-size: 11px; font-weight: bold; color: ${cPrim}; margin-bottom: 2px;">
            1. Hora de Entrada:
          </div>
          <div style="font-size: 10.5px; padding-left: 10px; color: #1e293b; line-height: 1.35;">
            ${parseTexto(plantilla.hora_entrada)}
          </div>
        </div>

        <!-- 2. Uniforme de Educación Inicial -->
        <div style="margin-bottom: 6px;">
          <div style="font-size: 11px; font-weight: bold; color: ${cPrim}; margin-bottom: 2px;">
            2. Uniforme de Educación Inicial (II y III Grupo):
          </div>
          <ul style="margin: 0 0 0 18px; padding: 0; font-size: 10.2px; color: #1e293b; line-height: 1.3;">
            ${renderListaItems(plantilla.uniforme_inicial)}
          </ul>
        </div>

        <!-- 3. Uniforme de Educación Primaria -->
        <div style="margin-bottom: 6px;">
          <div style="font-size: 11px; font-weight: bold; color: ${cPrim}; margin-bottom: 2px;">
            3. Uniforme de Educación Primaria:
          </div>
          <ul style="margin: 0 0 0 18px; padding: 0; font-size: 10.2px; color: #1e293b; line-height: 1.3;">
            ${renderListaItems(plantilla.uniforme_primaria)}
          </ul>
        </div>

        <!-- 4. Uniforme de Educación Media General -->
        <div style="margin-bottom: 6px;">
          <div style="font-size: 11px; font-weight: bold; color: ${cPrim}; margin-bottom: 2px;">
            4. Uniforme de Educación Media General:
          </div>
          <ul style="margin: 0 0 0 18px; padding: 0; font-size: 10.2px; color: #1e293b; line-height: 1.3;">
            ${renderListaItems(plantilla.uniforme_media)}
          </ul>
        </div>

        <!-- 5. Uniforme de Educación Física -->
        <div style="margin-bottom: 6px;">
          <div style="font-size: 11px; font-weight: bold; color: ${cPrim}; margin-bottom: 2px;">
            5. Uniforme de Educación Física (Preescolar, Primaria y Media General):
          </div>
          <ul style="margin: 0 0 0 18px; padding: 0; font-size: 10.2px; color: #1e293b; line-height: 1.3;">
            ${renderListaItems(plantilla.uniforme_educacion_fisica)}
          </ul>
        </div>

        <!-- 6. Transporte Escolar -->
        <div style="margin-bottom: 6px;">
          <div style="font-size: 11px; font-weight: bold; color: ${cPrim}; margin-bottom: 2px;">
            6. Transporte Escolar:
          </div>
          <div style="font-size: 10.2px; line-height: 1.35; padding-left: 10px; color: #1e293b; text-align: justify;">
            ${parseTexto(plantilla.transporte_escolar)}
          </div>
        </div>

        <!-- Cintillo de Rúbrica Pág 1 con el nombre del representante impreso debajo -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 12px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; margin-top: 6px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px; background: #ffffff;">
              <img src="${qrImageSrc}" alt="QR" crossOrigin="anonymous" style="width: 38px; height: 38px; display: block;" />
            </div>
            <div style="line-height: 1.25; font-size: 7.5px; font-family: monospace; color: #475569;">
              <b style="color: #166534;">VERIFICACIÓN PÁG. 1/3</b><br/>
              CÓD: ${codigoDoc}<br/>
              EST: ${estNombre}
            </div>
          </div>
          <div style="text-align: center; width: 250px;">
            <div style="height: 20px;"></div>
            <div style="border-top: 1.2px solid #0f172a; width: 210px; margin: 0 auto 2px auto;"></div>
            <div style="font-size: 9.5px; font-weight: bold; color: #0f172a; text-transform: uppercase; line-height: 1.2;">
              ${repNombre}
            </div>
            <div style="font-size: 8px; color: #475569;">
              Rúbrica de Conformidad (Pág. 1) &bull; C.I.: ${datos.representante_cedula || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      ${piePaginaHTML(1)}
    </div>

    <!-- ══════════════════════ PÁGINA 2 ══════════════════════ -->
    <div class="carta-pagina" style="width: 816px; min-height: 1045px; padding: 22px 38px 16px 38px; box-sizing: border-box; background: #ffffff; position: relative; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always;">
      <div>
        ${encabezadoHTML()}

        <!-- Cinta Distintiva Superior Pág 2 -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 5px solid ${cPrim}; border-radius: 6px; padding: 4px 12px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 10px; font-weight: bold; color: ${cPrim}; text-transform: uppercase; letter-spacing: 0.5px;">
            NORMATIVA INTERNA &bull; ASPECTOS GENERALES Y DEBERES &bull; PÁGINA 2 DE 3
          </span>
          <span style="font-size: 9.5px; color: #475569; font-family: monospace;">
            ESTUDIANTE: <b style="color: #0f172a;">${estNombre}</b> (${cedEst || 'S/C'})
          </span>
        </div>

        <!-- 7. Otros Aspectos a considerar -->
        <div style="margin-bottom: 7px;">
          <div style="font-size: 11px; font-weight: bold; color: ${cPrim}; margin-bottom: 2px;">
            7. Otros Aspectos a Considerar:
          </div>
          <ul style="margin: 0 0 0 18px; padding: 0; font-size: 10px; color: #1e293b; text-align: justify; line-height: 1.35;">
            ${renderListaItems(plantilla.otros_aspectos)}
          </ul>
        </div>

        <!-- 8. Deberes de los Padres, Representantes o Responsables -->
        <div style="margin-bottom: 8px;">
          <div style="font-size: 11px; font-weight: bold; color: ${cPrim}; margin-bottom: 2px;">
            8. Deberes de los Padres, Representantes o Responsables:
          </div>
          <ol style="margin: 0 0 0 18px; padding: 0; font-size: 9.5px; line-height: 1.35; color: #1e293b; text-align: justify;">
            ${(Array.isArray(plantilla.deberes_representantes) ? plantilla.deberes_representantes : []).map(d => `
              <li style="margin-bottom: 2px;">${parseTexto(d)}</li>
            `).join('')}
          </ol>
        </div>

        <!-- Cintillo de Rúbrica Pág 2 con el nombre del representante impreso debajo -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 12px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; margin-top: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px; background: #ffffff;">
              <img src="${qrImageSrc}" alt="QR" crossOrigin="anonymous" style="width: 38px; height: 38px; display: block;" />
            </div>
            <div style="line-height: 1.25; font-size: 7.5px; font-family: monospace; color: #475569;">
              <b style="color: #166534;">VERIFICACIÓN PÁG. 2/3</b><br/>
              CÓD: ${codigoDoc}<br/>
              EST: ${estNombre}
            </div>
          </div>
          <div style="text-align: center; width: 250px;">
            <div style="height: 20px;"></div>
            <div style="border-top: 1.2px solid #0f172a; width: 210px; margin: 0 auto 2px auto;"></div>
            <div style="font-size: 9.5px; font-weight: bold; color: #0f172a; text-transform: uppercase; line-height: 1.2;">
              ${repNombre}
            </div>
            <div style="font-size: 8px; color: #475569;">
              Rúbrica de Conformidad (Pág. 2) &bull; C.I.: ${datos.representante_cedula || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      ${piePaginaHTML(2)}
    </div>

    <!-- ══════════════════════ PÁGINA 3 ══════════════════════ -->
    <div class="carta-pagina" style="width: 816px; min-height: 1045px; padding: 22px 38px 16px 38px; box-sizing: border-box; background: #ffffff; position: relative; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        ${encabezadoHTML()}

        <!-- Cinta Distintiva Superior Pág 3 -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-left: 5px solid ${cPrim}; border-radius: 6px; padding: 4px 12px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 10px; font-weight: bold; color: ${cPrim}; text-transform: uppercase; letter-spacing: 0.5px;">
            NORMATIVA INTERNA &bull; ZONIFICACIÓN Y COMPROMISO &bull; PÁGINA 3 DE 3
          </span>
          <span style="font-size: 9.5px; color: #475569; font-family: monospace;">
            ESTUDIANTE: <b style="color: #0f172a;">${estNombre}</b> (${cedEst || 'S/C'})
          </span>
        </div>

        <!-- 9. Zonificación por Cambio de Residencia (Comunidad) -->
        <div style="margin-bottom: 8px;">
          <div style="font-size: 11px; font-weight: bold; color: ${cPrim}; margin-bottom: 2px;">
            9. Zonificación por Cambio de Residencia (Comunidad):
          </div>
          <ul style="margin: 0 0 0 18px; padding: 0; font-size: 9.8px; line-height: 1.35; color: #1e293b; text-align: justify;">
            ${renderListaItems(plantilla.zonificacion_residencia || [])}
          </ul>
        </div>

        <!-- 10. Apego Total a las Normativas Institucionales (General) -->
        <div style="margin-bottom: 8px;">
          <div style="font-size: 11px; font-weight: bold; color: ${cPrim}; margin-bottom: 2px;">
            10. Apego Total a las Normativas Institucionales (General):
          </div>
          <ul style="margin: 0 0 0 18px; padding: 0; font-size: 9.8px; line-height: 1.35; color: #1e293b; text-align: justify;">
            ${renderListaItems(plantilla.apego_normativas || [])}
          </ul>
        </div>

        <!-- 11. Zonificación por Repitencias (Cambio de Ambiente Escolar) -->
        <div style="margin-bottom: 8px;">
          <div style="font-size: 11px; font-weight: bold; color: ${cPrim}; margin-bottom: 2px;">
            11. Zonificación por Repitencias (Cambio de Ambiente Escolar):
          </div>
          <ul style="margin: 0 0 0 18px; padding: 0; font-size: 9.8px; line-height: 1.35; color: #1e293b; text-align: justify;">
            ${renderListaItems(plantilla.zonificacion_repitencias || [])}
          </ul>
        </div>

        <!-- Declaración Final de Compromiso -->
        <div style="font-size: 10px; line-height: 1.35; text-align: justify; font-style: italic; color: #334155; padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 8px;">
          ${plantilla.texto_declaracion_compromiso}
        </div>

        <!-- Bloque Oficial de Firmas con QR y Datos -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; padding: 8px 14px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; margin-bottom: 2px;">
          
          <!-- Sello y QR de Verificación de Página 3 -->
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 3px; background: #ffffff; text-align: center;">
              <img src="${qrImageSrc}" alt="QR Verificación" crossOrigin="anonymous" style="width: 60px; height: 60px; display: block; margin: 0 auto;" />
              <span style="font-size: 6.5px; font-weight: bold; color: #166534; font-family: monospace; display: block; margin-top: 2px;">
                VERIFICADO
              </span>
            </div>
            <div style="line-height: 1.25;">
              <span style="font-size: 7.5px; font-weight: bold; color: #0f172a; display: block;">NORMATIVA INTERNA</span>
              <span style="font-size: 6.5px; color: #64748b; font-family: monospace; display: block;">${codigoDoc}</span>
              <span style="font-size: 6.5px; color: #64748b; font-family: monospace; display: block;">HASH: SEC-${hashSeguridad}</span>
              <span style="font-size: 6.5px; color: #166534; font-weight: 600; display: block;">✓ Doble Firma Certificada</span>
              <span style="font-size: 6.5px; color: #475569; display: block;">Página 3 de 3 Oficial</span>
            </div>
          </div>

          <!-- Firma del Representante Legal con nombre impreso debajo de la línea -->
          <div style="text-align: center; width: 250px; position: relative;">
            <p style="margin: 0 0 2px; font-size: 10px; font-weight: bold; color: #000000; text-transform: uppercase; letter-spacing: 0.5px;">Por el Representante Legal:</p>
            
            <div style="height: 48px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 2px;">
              <span style="font-size: 8px; color: #94a3b8; font-style: italic;">(Firma autógrafa / Huella dactilar)</span>
            </div>
            
            <div style="border-top: 1.5px solid #0f172a; width: 210px; margin: 0 auto 3px auto;"></div>
            
            <!-- Nombre del representante legal impreso debajo -->
            <div style="font-weight: bold; font-size: 10.5px; color: #0f172a; line-height: 1.25; text-transform: uppercase;">
              ${repNombre}
            </div>
            <div style="font-size: 8.5px; color: #334155; line-height: 1.2;">
              C.I.: ${datos.representante_cedula || 'N/A'}${datos.representante_telefono ? ` &bull; Tel: ${datos.representante_telefono}` : ''}
            </div>
            <div style="font-size: 8.5px; font-weight: bold; color: #475569; line-height: 1.2;">
              Representante Legal${datos.parentesco ? ` (${toTitulo(datos.parentesco)})` : ''}
            </div>
          </div>

          <!-- Firma Digital del Director (Idéntica a la Carta de Aceptación) -->
          <div style="text-align: center; width: 250px; position: relative;">
            <p style="margin: 0 0 2px; font-size: 10px; font-weight: bold; color: #000000; text-transform: uppercase; letter-spacing: 0.5px;">Atentamente,</p>
            
            ${mostrarFirma && firmaDirectorSrc ? `
              <div style="height: 48px; display: flex; align-items: center; justify-content: center; margin-bottom: 2px;">
                <img src="${firmaDirectorSrc}" alt="Firma Director" crossOrigin="anonymous" style="max-height: 46px; max-width: 150px; object-fit: contain; display: block;" />
              </div>
            ` : `
              <div style="height: 48px;"></div>
            `}
            
            <div style="border-top: 1.5px solid #0f172a; width: 210px; margin: 0 auto 3px auto;"></div>
            
            <!-- Nombre y datos del director -->
            <div style="font-weight: bold; font-size: 10.5px; color: #0f172a; line-height: 1.25;">
              ${plantilla.titulo_director} ${plantilla.nombre_director}
            </div>
            <div style="font-size: 8.5px; color: #334155; line-height: 1.2;">
              C.I.: ${plantilla.cedula_director}
            </div>
            <div style="font-size: 8.5px; font-weight: bold; color: #0f172a; line-height: 1.2;">
              ${plantilla.cargo_director}
            </div>
          </div>

        </div>
      </div>

      ${piePaginaHTML(3)}
    </div>

  </div>
  `;
};

/**
 * Genera y descarga el PDF oficial de 3 páginas de las Normas Internas
 */
export const descargarNormasInternasPDF = async (
  plantilla: PlantillaNormasInternasConfig,
  datos: DatosEstudianteNormasInternas
): Promise<boolean> => {
  try {
    if (Swal) {
      Swal.fire({
        title: 'Generando Normativa Interna...',
        text: 'Compilando documento de 3 páginas con firmas y código QR...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
    }

    let firmaBase64 = '';
    try {
      firmaBase64 = await obtenerFirmaDirectorProtegida(datos.codigo_escuela, datos.codigo_unico);
    } catch (e) {
      console.warn('No se pudo cargar firma digital:', e);
    }

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '816px';
    container.style.background = '#ffffff';
    container.style.zIndex = '-1000';
    document.body.appendChild(container);

    container.innerHTML = renderNormasInternasHTML(plantilla, datos, firmaBase64);

    const images = container.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    });
    await Promise.all(imagePromises);
    await new Promise(r => setTimeout(r, 250));

    const pages = container.querySelectorAll('.carta-pagina');
    if (!pages || pages.length === 0) {
      throw new Error('No se encontraron páginas para renderizar.');
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
      compress: true
    });

    const pdfWidth = 215.9; // Carta en mm
    const pdfHeight = 279.4;

    for (let i = 0; i < pages.length; i++) {
      const pageEl = pages[i] as HTMLElement;
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      if (i > 0) pdf.addPage('letter', 'portrait');
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    const nombreLimpio = `${datos.estudiante_apellidos || ''}_${datos.estudiante_nombres || ''}`
      .trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const escUpper = (datos.codigo_escuela || 'LB').toUpperCase();
    const nombreArchivo = `Normativa_Interna_${escUpper}_${nombreLimpio || 'Estudiante'}.pdf`;

    pdf.save(nombreArchivo);

    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }

    if (Swal) {
      Swal.close();
      Swal.fire({
        icon: 'success',
        title: '¡Documento Descargado!',
        text: `El archivo ${nombreArchivo} se generó exitosamente.`,
        confirmButtonColor: '#00BCD4',
        timer: 3500
      });
    }

    return true;
  } catch (error: any) {
    console.error('Error generando PDF de Normativa Interna:', error);
    if (Swal) {
      Swal.close();
      Swal.fire('Error', 'No se pudo generar el documento: ' + (error.message || ''), 'error');
    }
    return false;
  }
};
