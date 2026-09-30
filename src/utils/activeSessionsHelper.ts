import { supabase } from '../lib/supabase';

export interface SesionDispositivo {
  id: string;
  tipo_dispositivo: 'computadora' | 'telefono' | 'tablet';
  dispositivo_nombre: string;
  sistema_operativo: string;
  navegador: string;
  ip_o_red: string;
  fecha_inicio: string;
  fecha_actividad: string;
  activa: boolean;
}

// Obtener o generar identificador único para el navegador / pestaña actual
export const getOrInitSessionId = (): string => {
  let sessionId = localStorage.getItem('sigae_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('sigae_session_id', sessionId);
  }
  return sessionId;
};

// Detectar información del cliente / equipo de forma amigable (como WhatsApp Web)
export const detectarInfoDispositivo = (): {
  tipo: 'computadora' | 'telefono' | 'tablet';
  dispositivo: string;
  sistema: string;
  navegador: string;
} => {
  const ua = navigator.userAgent || '';
  
  // Sistema Operativo
  let sistema = 'Windows';
  if (/android/i.test(ua)) sistema = 'Android';
  else if (/iPad|iPhone|iPod/.test(ua)) sistema = 'iOS (Apple)';
  else if (/Macintosh|Mac OS X/i.test(ua)) sistema = 'macOS';
  else if (/Linux/i.test(ua)) sistema = 'Linux';
  else if (/Windows/i.test(ua)) sistema = 'Windows';

  // Tipo de Dispositivo
  let tipo: 'computadora' | 'telefono' | 'tablet' = 'computadora';
  if (/tablet|ipad/i.test(ua)) tipo = 'tablet';
  else if (/mobile|android|iphone/i.test(ua)) tipo = 'telefono';

  // Navegador
  let navegador = 'Navegador Web';
  if (/edg/i.test(ua)) navegador = 'Microsoft Edge';
  else if (/chrome|crios/i.test(ua)) navegador = 'Google Chrome';
  else if (/firefox|fxios/i.test(ua)) navegador = 'Mozilla Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) navegador = 'Apple Safari';
  else if (/opr\//i.test(ua)) navegador = 'Opera';

  let dispositivo = tipo === 'telefono' 
    ? `Teléfono Móvil (${sistema})` 
    : tipo === 'tablet' 
      ? `Tablet (${sistema})` 
      : `Computadora (${sistema})`;

  return { tipo, dispositivo, sistema, navegador };
};

// Detectar si el entorno actual se encuentra en Modo Virtualización / Emulación
export const isEmulacionActiva = (): boolean => {
  try {
    const usrStr = localStorage.getItem('usuario_sigae');
    const u = usrStr ? JSON.parse(usrStr) : null;
    return !!(
      u?.es_emulacion ||
      localStorage.getItem('sigae_usuario_original_admin') ||
      sessionStorage.getItem('sigae_emulacion_activa') === 'true'
    );
  } catch {
    return false;
  }
};

// Purgar inmediatamente cualquier rastro de la sesión del emulador que haya quedado grabada previamente
export const purgarSesionEmulacionSiExiste = async (cedula: string): Promise<void> => {
  if (!cedula) return;
  const sessionId = getOrInitSessionId();
  try {
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('perfil_acceso')
      .eq('cedula', cedula)
      .maybeSingle();

    if (error || !usuario) return;

    let perfilAcceso: any = usuario.perfil_acceso || {};
    if (typeof perfilAcceso === 'string') {
      try { perfilAcceso = JSON.parse(perfilAcceso); } catch (e) { perfilAcceso = {}; }
    }

    if (!Array.isArray(perfilAcceso.sesiones_activas)) return;

    const sesionesLimpias = perfilAcceso.sesiones_activas.filter((s: SesionDispositivo) => s.id !== sessionId && !(s as any).es_emulacion);
    if (sesionesLimpias.length !== perfilAcceso.sesiones_activas.length) {
      perfilAcceso.sesiones_activas = sesionesLimpias;
      await supabase
        .from('usuarios')
        .update({ perfil_acceso: perfilAcceso })
        .eq('cedula', cedula);
    }
  } catch (err) {
    console.warn("Error purgando sesión de emulación previa:", err);
  }
};

// Registrar o actualizar sesión activa en Supabase
export const registrarSesionActiva = async (cedula: string): Promise<void> => {
  if (!cedula) return;

  // REGLA CRÍTICA DE PRIVACIDAD Y SEGURIDAD:
  // Cuando se virtualicen los usuarios o los roles, NUNCA debe grabarse ni actualizarse
  // la sesión en los dispositivos vinculados bajo ninguna circunstancia.
  if (isEmulacionActiva()) {
    return;
  }

  const sessionId = getOrInitSessionId();
  const info = detectarInfoDispositivo();

  try {
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('perfil_acceso')
      .eq('cedula', cedula)
      .maybeSingle();

    if (error || !usuario) return;

    let perfilAcceso: any = usuario.perfil_acceso || {};
    if (typeof perfilAcceso === 'string') {
      try { perfilAcceso = JSON.parse(perfilAcceso); } catch (e) { perfilAcceso = {}; }
    }

    let sesiones: SesionDispositivo[] = Array.isArray(perfilAcceso.sesiones_activas) 
      ? [...perfilAcceso.sesiones_activas] 
      : [];

    const ahora = new Date().toISOString();
    const index = sesiones.findIndex(s => s.id === sessionId);

    const sesionActual: SesionDispositivo = {
      id: sessionId,
      tipo_dispositivo: info.tipo,
      dispositivo_nombre: info.dispositivo,
      sistema_operativo: info.sistema,
      navegador: info.navegador,
      ip_o_red: 'Conexión Web Segura',
      fecha_inicio: index >= 0 ? sesiones[index].fecha_inicio : ahora,
      fecha_actividad: ahora,
      activa: true
    };

    if (index >= 0) {
      sesiones[index] = sesionActual;
    } else {
      // Limitar a las últimas 15 sesiones para no sobrecargar el JSON
      sesiones = [sesionActual, ...sesiones.filter(s => s.id !== sessionId)].slice(0, 15);
    }

    perfilAcceso.sesiones_activas = sesiones;

    await supabase
      .from('usuarios')
      .update({ perfil_acceso: perfilAcceso })
      .eq('cedula', cedula);
  } catch (err) {
    console.warn("No se pudo registrar la sesión activa:", err);
  }
};

// Obtener todas las sesiones de este usuario (ocultando cualquier sesión de emulación)
export const obtenerSesionesUsuario = async (cedula: string): Promise<SesionDispositivo[]> => {
  if (!cedula) return [];
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('perfil_acceso')
      .eq('cedula', cedula)
      .maybeSingle();

    if (error || !data) return [];
    let perfil: any = data.perfil_acceso;
    if (typeof perfil === 'string') {
      try { perfil = JSON.parse(perfil); } catch (e) { perfil = {}; }
    }
    let lista: SesionDispositivo[] = Array.isArray(perfil?.sesiones_activas) ? perfil.sesiones_activas : [];

    // REGLA CRÍTICA:
    // Si se está en modo emulación/virtualización, no mostrar la sesión actual del emulador
    // ni ninguna sesión que haya sido etiquetada como de emulación previa
    if (isEmulacionActiva()) {
      const currentId = getOrInitSessionId();
      lista = lista.filter(s => s.id !== currentId && !(s as any).es_emulacion);
    }

    return lista;
  } catch (err) {
    console.error("Error al obtener sesiones:", err);
    return [];
  }
};

// Activar o desactivar (cerrar) una sesión remota específica
export const cambiarEstadoSesion = async (cedula: string, targetSessionId: string, nuevoEstado: boolean): Promise<boolean> => {
  if (!cedula || !targetSessionId) return false;
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('perfil_acceso')
      .eq('cedula', cedula)
      .maybeSingle();

    if (error || !data) return false;
    let perfil: any = data.perfil_acceso || {};
    if (typeof perfil === 'string') {
      try { perfil = JSON.parse(perfil); } catch (e) { perfil = {}; }
    }

    let sesiones: SesionDispositivo[] = Array.isArray(perfil.sesiones_activas) ? [...perfil.sesiones_activas] : [];
    sesiones = sesiones.map(s => {
      if (s.id === targetSessionId) {
        return { ...s, activa: nuevoEstado, fecha_actividad: new Date().toISOString() };
      }
      return s;
    });

    perfil.sesiones_activas = sesiones;

    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ perfil_acceso: perfil })
      .eq('cedula', cedula);

    return !updateError;
  } catch (err) {
    console.error("Error al cambiar estado de sesión:", err);
    return false;
  }
};

// Cerrar todas las demás sesiones (menos la actual)
export const cerrarTodasLasDemasSesiones = async (cedula: string): Promise<boolean> => {
  if (!cedula) return false;
  const currentId = getOrInitSessionId();
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('perfil_acceso')
      .eq('cedula', cedula)
      .maybeSingle();

    if (error || !data) return false;
    let perfil: any = data.perfil_acceso || {};
    if (typeof perfil === 'string') {
      try { perfil = JSON.parse(perfil); } catch (e) { perfil = {}; }
    }

    let sesiones: SesionDispositivo[] = Array.isArray(perfil.sesiones_activas) ? [...perfil.sesiones_activas] : [];
    sesiones = sesiones.map(s => {
      if (s.id !== currentId) {
        return { ...s, activa: false };
      }
      return { ...s, activa: true, fecha_actividad: new Date().toISOString() };
    });

    perfil.sesiones_activas = sesiones;

    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ perfil_acceso: perfil })
      .eq('cedula', cedula);

    return !updateError;
  } catch (err) {
    console.error("Error al cerrar todas las sesiones:", err);
    return false;
  }
};

// Verificar si la sesión actual sigue estando activa (para revocación remota instantánea)
export const verificarSesionActualValida = async (cedula: string): Promise<boolean> => {
  if (!cedula) return true;
  if (isEmulacionActiva()) return true;
  const currentId = getOrInitSessionId();
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('perfil_acceso')
      .eq('cedula', cedula)
      .maybeSingle();

    if (error || !data) return true;
    let perfil: any = data.perfil_acceso;
    if (typeof perfil === 'string') {
      try { perfil = JSON.parse(perfil); } catch (e) { perfil = {}; }
    }

    const sesiones: SesionDispositivo[] = Array.isArray(perfil?.sesiones_activas) ? perfil.sesiones_activas : [];
    const sesionActual = sesiones.find(s => s.id === currentId);

    // Si la sesión existe explícitamente y está marcada como no activa, fue revocada remotamente
    if (sesionActual && sesionActual.activa === false) {
      return false;
    }
    return true;
  } catch (err) {
    return true;
  }
};
