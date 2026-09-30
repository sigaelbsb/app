/**
 * sessionHelper.ts
 * Utilidades para la gestión limpia de sesión y emulación de usuarios/roles en SIGAE.
 * Evita recargas forzadas (`window.location.href = '/'`) que provocan pantallas blancas en móviles,
 * Electron y Capacitor WebView.
 */

import { purgarSesionEmulacionSiExiste } from './activeSessionsHelper';

export const notificarCambioSesion = (nuevoUsuario?: any) => {
  try {
    window.dispatchEvent(new CustomEvent('sigae-session-update', { detail: nuevoUsuario }));
    window.dispatchEvent(new CustomEvent('sigae-permisos-refresh', { detail: nuevoUsuario }));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.warn('Error al despachar sigae-session-update:', e);
  }
};

export const notificarCambioEscuela = (escuelaCodigo: string, escuelaNombre: string) => {
  try {
    localStorage.setItem('sigae_escuela_codigo', escuelaCodigo);
    localStorage.setItem('sigae_escuela_activa', escuelaNombre);
    window.dispatchEvent(new CustomEvent('sigae-escuela-update', { detail: { escuelaCodigo, escuelaNombre } }));
    window.dispatchEvent(new CustomEvent('sigae-permisos-refresh', { detail: { escuelaCodigo, escuelaNombre } }));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.warn('Error al despachar sigae-escuela-update:', e);
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

  // Asegurar que el dispositivo del emulador NUNCA quede registrado en la cuenta emulada
  if (usuarioEmulado?.cedula) {
    purgarSesionEmulacionSiExiste(usuarioEmulado.cedula);
  }

  notificarCambioSesion(usuarioEmulado);
};

export const salirEmulacionSesion = () => {
  const currentStr = localStorage.getItem('usuario_sigae');
  if (currentStr) {
    try {
      const uCurrent = JSON.parse(currentStr);
      if (uCurrent?.cedula && uCurrent?.es_emulacion) {
        purgarSesionEmulacionSiExiste(uCurrent.cedula);
      }
    } catch (_) {}
  }

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
