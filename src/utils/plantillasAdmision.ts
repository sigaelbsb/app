import { supabase } from '../lib/supabase';
import { toTitulo } from '../lib/formatters';

export type EstadoAdmisionTipo = 'Aprobado' | 'Rechazado' | 'Formalizado' | 'En Evaluación' | 'No Apto';
export type CanalMensaje = 'whatsapp' | 'email';

export interface PlantillaMensajeAdmision {
  id: string;
  id_escuela: 'sb' | 'lb' | 'ambas';
  estado_solicitud: EstadoAdmisionTipo;
  canal: CanalMensaje;
  titulo_plantilla: string;
  asunto_email?: string;
  cuerpo_mensaje: string;
  activo: boolean;
  actualizado_el?: string;
}

export const VARIABLES_DISPONIBLES = [
  { tag: '{{nombre_representante}}', desc: 'Nombre del Representante Legal' },
  { tag: '{{cedula_representante}}', desc: 'Cédula del Representante' },
  { tag: '{{telefono_representante}}', desc: 'Teléfono del Representante' },
  { tag: '{{nombre_estudiante}}', desc: 'Nombre del Estudiante / Aspirante' },
  { tag: '{{cedula_estudiante}}', desc: 'Cédula o C. Escolar del Estudiante' },
  { tag: '{{grado_solicitado}}', desc: 'Grado / Año Solicitado' },
  { tag: '{{codigo_solicitud}}', desc: 'Código Único de Solicitud (ej. CR-SB-1234)' },
  { tag: '{{nombre_escuela}}', desc: 'Nombre Oficial del Plantel Educativo' },
  { tag: '{{estado_solicitud}}', desc: 'Estado Actual (Aprobado, Rechazado, etc.)' },
  { tag: '{{observaciones}}', desc: 'Observaciones o Motivos del Dictamen' },
  { tag: '{{ano_escolar}}', desc: 'Período Escolar Actual (ej. 2025-2026)' },
  { tag: '{{enlace_portal}}', desc: 'Enlace web al Portal SIGAE' },
  { tag: '{{enlace_validacion}}', desc: 'Enlace de verificación digital' },
  { tag: '{{fecha_actual}}', desc: 'Fecha de emisión del mensaje' }
];

export const PLANTILLAS_PREDETERMINADAS_ADMISION: PlantillaMensajeAdmision[] = [
  // ─── APROBADO (WHATSAPP) ───
  {
    id: 'adm-sb-aprobado-wa',
    id_escuela: 'sb',
    estado_solicitud: 'Aprobado',
    canal: 'whatsapp',
    titulo_plantilla: 'Notificación de Aprobación / Admisión (SB)',
    cuerpo_mensaje: `🏛️ *SIGAE - NOTIFICACIÓN OFICIAL DE ADMISIÓN*
🏫 *{{nombre_escuela}}*

Estimado(a) Representante *{{nombre_representante}}*:

Reciba un cordial y afectuoso saludo institucional. Nos complace informarle que la solicitud de cupo escolar para su representado(a) ha sido *ADMITIDA SATISFACTORIAMENTE*.

📋 *DATOS DEL ASPIRANTE:*
• 👤 *Estudiante:* {{nombre_estudiante}}
• 🆔 *Cédula / Identificador:* {{cedula_estudiante}}
• 📚 *Grado Asignado:* {{grado_solicitado}}
• 🔖 *Código de Solicitud:* *{{codigo_solicitud}}*
• 📅 *Período Escolar:* {{ano_escolar}}

🎉 *RESULTADO DEL COMITÉ:*
✅ *ESTATUS: ADMITIDO / APROBADO*
Le invitamos a consignar los recaudos físicos en la sede de la institución para proceder a la formalización definitiva de la matrícula.

{{observaciones}}

🌐 *Portal Web SIGAE:* {{enlace_portal}}
_Comité de Admisiones y Control de Estudios_`,
    activo: true
  },
  {
    id: 'adm-lb-aprobado-wa',
    id_escuela: 'lb',
    estado_solicitud: 'Aprobado',
    canal: 'whatsapp',
    titulo_plantilla: 'Notificación de Aprobación / Admisión (LB)',
    cuerpo_mensaje: `🏛️ *SIGAE - NOTIFICACIÓN OFICIAL DE ADMISIÓN*
🏫 *{{nombre_escuela}}*

Estimado(a) Representante *{{nombre_representante}}*:

Nos complace comunicarle que la solicitud de admisión para el período escolar {{ano_escolar}} ha sido *APROBADA*.

📋 *DATOS DEL ASPIRANTE:*
• 👤 *Estudiante:* {{nombre_estudiante}}
• 🆔 *Cédula:* {{cedula_estudiante}}
• 📚 *Grado Solicitado:* {{grado_solicitado}}
• 🔖 *Código Único:* *{{codigo_solicitud}}*

🎉 *RESULTADO OFICIAL:*
✅ *ESTATUS: ADMITIDO / APROBADO*
Favor presentarse en la Dirección del Plantel en el horario de atención con los documentos de soporte para la firma de la matrícula.

{{observaciones}}

🌐 *Portal Oficial:* {{enlace_portal}}
_Dirección y Comité de Admisiones_`,
    activo: true
  },

  // ─── RECHAZADO (WHATSAPP) ───
  {
    id: 'adm-sb-rechazado-wa',
    id_escuela: 'sb',
    estado_solicitud: 'Rechazado',
    canal: 'whatsapp',
    titulo_plantilla: 'Notificación de No Admisión / Rechazo (SB)',
    cuerpo_mensaje: `🏛️ *SIGAE - COMUNICADO DE ADMISIONES*
🏫 *{{nombre_escuela}}*

Estimado(a) Representante *{{nombre_representante}}*:

Un cordial saludo. A través de la presente, el Comité de Admisiones le informa sobre el estatus de la solicitud de cupo escolar:

📋 *DATOS DEL ASPIRANTE:*
• 👤 *Estudiante:* {{nombre_estudiante}}
• 🆔 *Cédula:* {{cedula_estudiante}}
• 📚 *Grado:* {{grado_solicitado}}
• 🔖 *Código:* {{codigo_solicitud}}

📊 *DICTAMEN OFICIAL:*
❌ *ESTATUS: NO ADMITIDO (CUPO NO DISPONIBLE)*
Agradecemos sinceramente su interés y participación en nuestro proceso de solicitudes para el período escolar {{ano_escolar}}. Lamentablemente, debido a la capacidad de matrícula disponible, no ha sido posible otorgar el cupo en esta oportunidad.

{{observaciones}}

_Comité de Admisiones y Gestión Escolar_`,
    activo: true
  },
  {
    id: 'adm-lb-rechazado-wa',
    id_escuela: 'lb',
    estado_solicitud: 'Rechazado',
    canal: 'whatsapp',
    titulo_plantilla: 'Notificación de No Admisión / Rechazo (LB)',
    cuerpo_mensaje: `🏛️ *SIGAE - COMUNICADO DE ADMISIONES*
🏫 *{{nombre_escuela}}*

Estimado(a) Representante *{{nombre_representante}}*:

Por medio de la presente, le informamos sobre la evaluación de la solicitud de cupo escolar:

📋 *DATOS DEL POSTULANTE:*
• 👤 *Estudiante:* {{nombre_estudiante}}
• 🆔 *Cédula:* {{cedula_estudiante}}
• 📚 *Grado:* {{grado_solicitado}}
• 🔖 *Código:* {{codigo_solicitud}}

📊 *DICTAMEN:*
❌ *ESTATUS: NO ASIGNADO*
Agradecemos su postulación en el proceso de admisiones {{ano_escolar}}. En esta convocatoria la solicitud no pudo ser procesada favorablemente por límite de cupos disponibles.

{{observaciones}}

_Dirección del Plantel y Comité Evaluador_`,
    activo: true
  },

  // ─── FORMALIZADO (WHATSAPP) ───
  {
    id: 'adm-sb-formalizado-wa',
    id_escuela: 'sb',
    estado_solicitud: 'Formalizado',
    canal: 'whatsapp',
    titulo_plantilla: 'Confirmación de Matrícula Formalizada (SB)',
    cuerpo_mensaje: `🏛️ *SIGAE - CONFIRMACIÓN DE MATRÍCULA*
🏫 *{{nombre_escuela}}*

Estimado(a) Representante *{{nombre_representante}}*:

🎉 *¡MATRÍCULA FORMALIZADA CON ÉXITO!*
Nos complace confirmar que el estudiante *{{nombre_estudiante}}* ha sido formalmente inscrito(a) en *{{grado_solicitado}}* para el Año Escolar *{{ano_escolar}}*.

📋 *ACCESO AL PORTAL DEL ESTUDIANTE:*
🌐 *Portal Web:* {{enlace_portal}}
👤 *Usuario:* {{cedula_representante}}
🔑 *Contraseña Inicial:* {{cedula_representante}}

Desde su cuenta podrá completar la Ficha Integral, descargar la Constancia de Inscripción y emitir el Carnet Estudiantil Digital.

{{observaciones}}

_Control de Estudios y Gestión Estudiantil_`,
    activo: true
  },

  // ─── EN EVALUACIÓN (WHATSAPP) ───
  {
    id: 'adm-sb-evaluacion-wa',
    id_escuela: 'sb',
    estado_solicitud: 'En Evaluación',
    canal: 'whatsapp',
    titulo_plantilla: 'Notificación de Solicitud en Evaluación (SB)',
    cuerpo_mensaje: `🏛️ *SIGAE - ESTADO DE SOLICITUD*
🏫 *{{nombre_escuela}}*

Estimado(a) Representante *{{nombre_representante}}*:

Le informamos que la solicitud de cupo escolar para *{{nombre_estudiante}}* (C.I: {{cedula_estudiante}}) se encuentra actualmente:

⏳ *ESTATUS: EN EVALUACIÓN Y VERIFICACIÓN DE RECAUDOS*
El Comité de Admisiones está revisando la documentación y baremo correspondiente. Le notificaremos oportunamente cualquier novedad.

{{observaciones}}

🔖 *Código de Seguimiento:* *{{codigo_solicitud}}*
🌐 *Consultar Estado:* {{enlace_portal}}

_Comité de Admisiones_`,
    activo: true
  },

  // ─── EMAIL TEMPLATES ───
  {
    id: 'adm-sb-aprobado-email',
    id_escuela: 'sb',
    estado_solicitud: 'Aprobado',
    canal: 'email',
    titulo_plantilla: 'Correo Oficial de Aprobación de Cupo (SB)',
    asunto_email: '¡Solicitud Admitida! Proceso de Admisión Escolar {{ano_escolar}} - {{nombre_estudiante}}',
    cuerpo_mensaje: `Estimado(a) Representante {{nombre_representante}},

Por medio del presente correo institucional, el Comité de Admisiones de {{nombre_escuela}} tiene el agrado de informarle que la solicitud de cupo escolar para su representado(a) ha sido APROBADA SATISFACTORIAMENTE.

RESUMEN DE LA ADMISIÓN:
- Estudiante: {{nombre_estudiante}}
- Cédula / Identificador: {{cedula_estudiante}}
- Grado Asignado: {{grado_solicitado}}
- Código de Solicitud: {{codigo_solicitud}}
- Período Escolar: {{ano_escolar}}

PASOS A SEGUIR:
1. Favor acudir a la sede de la institución en el horario de atención para consignar los recaudos en físico.
2. Formalizar la inscripción en el departamento de Control de Estudios.

{{observaciones}}

Atentamente,
Comité de Admisiones y Control de Estudios
{{nombre_escuela}}
Sistema SIGAE`,
    activo: true
  },
  {
    id: 'adm-sb-rechazado-email',
    id_escuela: 'sb',
    estado_solicitud: 'Rechazado',
    canal: 'email',
    titulo_plantilla: 'Correo Oficial de Dictamen de No Admisión (SB)',
    asunto_email: 'Resultado del Proceso de Solicitud de Cupo {{ano_escolar}} - {{nombre_estudiante}}',
    cuerpo_mensaje: `Estimado(a) Representante {{nombre_representante}},

Le enviamos un cordial saludo. Por medio de la presente comunicación, le notificamos sobre el resultado del proceso de evaluación de solicitudes de cupos para el período escolar {{ano_escolar}}.

DATOS DE LA SOLICITUD:
- Estudiante: {{nombre_estudiante}}
- Cédula: {{cedula_estudiante}}
- Grado Solicitado: {{grado_solicitado}}
- Código de Trámite: {{codigo_solicitud}}

DICTAMEN OFICIAL:
Lamentamos informarle que, debido a la alta demanda y al límite de capacidad de la matrícula disponible para este grado, no ha sido posible admitir la solicitud en este período.

Agradecemos su interés y confianza depositada en {{nombre_escuela}}.

{{observaciones}}

Atentamente,
Dirección y Comité de Admisiones
{{nombre_escuela}}`,
    activo: true
  }
];

/**
 * Sincroniza y descarga las plantillas personalizadas desde Supabase (ajustes_globales)
 * y actualiza el caché de localStorage. Permite que cualquier cambio guardado desde la PC
 * esté disponible de inmediato en teléfonos móviles y otros equipos.
 */
export const sincronizarPlantillasAdmisionDesdeBD = async (): Promise<PlantillaMensajeAdmision[]> => {
  try {
    const { data, error } = await supabase
      .from('ajustes_globales')
      .select('valor')
      .eq('clave', 'plantillas_admisiones')
      .maybeSingle();

    if (!error && data?.valor) {
      const parsed = typeof data.valor === 'string' ? JSON.parse(data.valor) : data.valor;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const ids = new Set(parsed.map((p: any) => p.id));
        const faltantes = PLANTILLAS_PREDETERMINADAS_ADMISION.filter(p => !ids.has(p.id));
        const merged = [...parsed, ...faltantes];
        localStorage.setItem('sigae_plantillas_admisiones', JSON.stringify(merged));
        return merged;
      }
    }
  } catch (e) {
    console.warn('Aviso sincronizando plantillas de admisiones desde Supabase:', e);
  }
  return obtenerPlantillasAdmision();
};

/**
 * Obtiene las plantillas de mensajes de admisión desde localStorage o predeterminadas
 */
export const obtenerPlantillasAdmision = (): PlantillaMensajeAdmision[] => {
  try {
    const raw = localStorage.getItem('sigae_plantillas_admisiones');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge con predeterminadas para asegurar que no falte ninguna nueva
        const ids = new Set(parsed.map((p: any) => p.id));
        const faltantes = PLANTILLAS_PREDETERMINADAS_ADMISION.filter(p => !ids.has(p.id));
        return [...parsed, ...faltantes];
      }
    }
  } catch (e) {
    console.warn('Error leyendo plantillas de admisiones de localStorage:', e);
  }
  return PLANTILLAS_PREDETERMINADAS_ADMISION;
};

/**
 * Guarda las plantillas de mensajes en localStorage y sincroniza con Supabase en tiempo real
 */
export const guardarPlantillasAdmision = async (plantillas: PlantillaMensajeAdmision[]): Promise<void> => {
  localStorage.setItem('sigae_plantillas_admisiones', JSON.stringify(plantillas));
  try {
    const { error } = await supabase.from('ajustes_globales').upsert({
      clave: 'plantillas_admisiones',
      valor: JSON.stringify(plantillas),
      descripcion: 'Plantillas de redacción de mensajes de admisión (WhatsApp y Email)'
    }, { onConflict: 'clave' });

    if (error) {
      console.error('Error al guardar plantillas en Supabase:', error);
      throw error;
    }
  } catch (e) {
    console.warn('Aviso sincronizando plantillas de admisión en BD:', e);
    throw e;
  }
};

/**
 * Busca la plantilla más adecuada según escuela, estado y canal
 */
export const buscarPlantillaAdmision = (
  escCodigo: string,
  estado: EstadoAdmisionTipo | string,
  canal: CanalMensaje = 'whatsapp'
): PlantillaMensajeAdmision => {
  const plantillas = obtenerPlantillasAdmision();
  const esc = (escCodigo || 'sb').toLowerCase();
  const estadoNormalizado = estado === 'Formalizado' ? 'Formalizado'
    : estado === 'Aprobado' ? 'Aprobado'
    : estado === 'Rechazado' ? 'Rechazado'
    : estado === 'No Apto' ? 'No Apto'
    : 'En Evaluación';

  // Buscar coincidencia exacta por escuela, estado y canal
  const encontrada = plantillas.find(p => 
    p.canal === canal && 
    p.estado_solicitud === estadoNormalizado && 
    (p.id_escuela === esc || p.id_escuela === 'ambas') &&
    p.activo
  );

  if (encontrada) return encontrada;

  // Fallback por estado y canal
  const fallback = plantillas.find(p => p.canal === canal && p.estado_solicitud === estadoNormalizado);
  if (fallback) return fallback;

  return plantillas[0] || PLANTILLAS_PREDETERMINADAS_ADMISION[0];
};

/**
 * Reemplaza todas las variables dinámicas en el texto del mensaje
 */
export const renderizarMensajeAdmision = (
  cuerpo: string,
  solicitud: any,
  escuelaNombreParam?: string
): string => {
  if (!cuerpo) return '';
  const s = solicitud || {};
  const escKey = (s.codigo_escuela || s.id_escuela || 'sb').toLowerCase();
  const nombreEscuela = escuelaNombreParam || (escKey === 'sb' ? 'Unidad Educativa Santa Bárbara' : 'Unidad Educativa Libertador Bolívar');
  
  const repNombres = s.representante_nombres || s.nombres_representante || 'Representante Legal';
  const repApellidos = s.representante_apellidos || s.apellidos_representante || '';
  const nombreRepresentante = toTitulo(`${repNombres} ${repApellidos}`.trim());

  const estNombres = s.estudiante_nombres || s.nombres_estudiante || 'Estudiante';
  const estApellidos = s.estudiante_apellidos || s.apellidos_estudiante || '';
  const nombreEstudiante = toTitulo(`${estNombres} ${estApellidos}`.trim());

  const cedulaRep = s.representante_cedula || s.cedula_representante || 'Sin registrar';
  const telRep = s.representante_telefono || s.telefono_representante || 'Sin registrar';
  const cedulaEst = s.estudiante_cedula || s.cedula_estudiante || 'En trámite';
  const grado = s.grado_solicitado || s.grado_actual || 'Grado asignado';
  const codigo = s.codigo_unico || s.codigo_solicitud || 'CR-0000';
  const estado = s.estado || 'Pendiente';
  
  const obsLimpia = s.observaciones ? `📌 *Observaciones del Dictamen:* ${s.observaciones}` : '';
  const anoEscolar = '2025 - 2026';
  
  const esLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const baseUrl = esLocal ? 'https://app-delta-ten-80.vercel.app' : (typeof window !== 'undefined' ? window.location.origin : 'https://app-delta-ten-80.vercel.app');
  const enlacePortal = `${baseUrl}/login`;
  const enlaceValidacion = `${baseUrl}/validar-constancia/${encodeURIComponent(codigo)}`;
  const fechaActual = new Date().toLocaleDateString('es-VE');

  let resultado = cuerpo
    .replace(/\{\{nombre_representante\}\}/g, nombreRepresentante)
    .replace(/\{\{cedula_representante\}\}/g, cedulaRep)
    .replace(/\{\{telefono_representante\}\}/g, telRep)
    .replace(/\{\{nombre_estudiante\}\}/g, nombreEstudiante)
    .replace(/\{\{cedula_estudiante\}\}/g, cedulaEst)
    .replace(/\{\{grado_solicitado\}\}/g, grado)
    .replace(/\{\{codigo_solicitud\}\}/g, codigo)
    .replace(/\{\{nombre_escuela\}\}/g, nombreEscuela)
    .replace(/\{\{estado_solicitud\}\}/g, estado)
    .replace(/\{\{observaciones\}\}/g, obsLimpia)
    .replace(/\{\{ano_escolar\}\}/g, anoEscolar)
    .replace(/\{\{enlace_portal\}\}/g, enlacePortal)
    .replace(/\{\{enlace_validacion\}\}/g, enlaceValidacion)
    .replace(/\{\{fecha_actual\}\}/g, fechaActual);

  return resultado;
};

/**
 * Genera el enlace oficial de WhatsApp listo para abrir
 */
export const generarEnlaceWhatsAppAdmision = (
  telefono: string,
  mensaje: string
): string => {
  let tel = (telefono || '').replace(/\D/g, '');
  if (tel.startsWith('0')) tel = tel.substring(1);
  if (!tel.startsWith('58') && tel.length > 0) tel = '58' + tel;
  
  if (!tel) return `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
  return `https://api.whatsapp.com/send?phone=${tel}&text=${encodeURIComponent(mensaje)}`;
};
