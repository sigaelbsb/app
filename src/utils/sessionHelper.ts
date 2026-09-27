/**
 * sessionHelper.ts
 * Utilidades para la gestión limpia de sesión y emulación de usuarios/roles en SIGAE.
 * Evita recargas forzadas (`window.location.href = '/'`) que provocan pantallas blancas en móviles,
 * Electron y Capacitor WebView.
 */

export const notificarCambioSesion = (nuevoUsuario?: any) => {
  try {
    window.dispatchEvent(new CustomEvent('sigae-session-update', { detail: nuevoUsuario }));
  } catch (e) {
    console.warn('Error al despachar sigae-session-update:', e);
  }
};

export const iniciarEmulacionSesion = (
  usuarioEmulado: any, 
  targetEscuela: string, 
  targetEscuelaNombre: string
) => {
  localStorage.setItem('usuario_sigae', JSON.stringify(usuarioEmulado));
  localStorage.setItem('sesion_sigae', 'activa');
  localStorage.setItem('sigae_escuela_codigo', targetEscuela);
  localStorage.setItem('sigae_escuela_activa', targetEscuelaNombre);
  sessionStorage.setItem('sigae_emulacion_activa', 'true');

  localStorage.removeItem('sigae_cache_permisos');
  localStorage.removeItem('sigae_cache_full_permisos');

  notificarCambioSesion(usuarioEmulado);
};

export const salirEmulacionSesion = () => {
  const originalStr = localStorage.getItem('sigae_usuario_original_admin');
  let restoredUser: any = null;

  if (originalStr) {
    try {
      restoredUser = JSON.parse(originalStr);
      localStorage.setItem('usuario_sigae', JSON.stringify(restoredUser));
      localStorage.setItem('sesion_sigae', 'activa');
      const targetEsc = (restoredUser.id_escuela && restoredUser.id_escuela !== 'ambas' && restoredUser.id_escuela !== 'todas')
        ? restoredUser.id_escuela
        : (localStorage.getItem('sigae_escuela_codigo') || 'sb');
      localStorage.setItem('sigae_escuela_codigo', targetEsc);
      localStorage.setItem('sigae_escuela_activa', targetEsc === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
    } catch (e) {
      console.error('Error al restaurar usuario original:', e);
    }
  } else {
    localStorage.setItem('sesion_sigae', 'activa');
    if (!localStorage.getItem('sigae_escuela_codigo')) {
      localStorage.setItem('sigae_escuela_codigo', 'sb');
      localStorage.setItem('sigae_escuela_activa', 'UE Santa Bárbara');
    }
    const currentStr = localStorage.getItem('usuario_sigae');
    if (currentStr) {
      try {
        restoredUser = JSON.parse(currentStr);
      } catch (_) {}
    }
  }

  localStorage.removeItem('sigae_usuario_original_admin');
  sessionStorage.removeItem('sigae_emulacion_activa');
  localStorage.removeItem('sigae_cache_permisos');
  localStorage.removeItem('sigae_cache_full_permisos');

  notificarCambioSesion(restoredUser);
};
