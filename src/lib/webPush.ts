export const PUBLIC_VAPID_KEY = 'BClJY617XAIN2tmINIV-Y-wqWsDRymIYxxNJPSZuBLKot7AVYuv_IwB5kn5AwEAhKwGrSACYp9x7sbd5LPY3sYY';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

/**
 * Suscribe el dispositivo al servicio Web Push en segundo plano (Chrome, Safari iOS 16.4+, Edge, Android)
 */
export const subscribeToWebPush = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.info('Web Push no soportado en este navegador');
    return false;
  }
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    // Si ya existe suscripción, verificar si necesita renovación
    if (subscription) {
      try {
        const subJson = subscription.toJSON();
        // Si no tiene keys válidas, desuscribir y renovar
        if (!subJson.keys || !subJson.keys.p256dh) {
          await subscription.unsubscribe();
          subscription = null;
        }
      } catch (e) {
        subscription = null;
      }
    }

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
      });
    }

    // Guardar o actualizar la suscripción en Supabase
    const subJson = subscription.toJSON();
    const usrStr = localStorage.getItem('usuario_sigae');
    const usr = usrStr ? JSON.parse(usrStr) : null;
    const escCodigo = usr?.id_escuela || localStorage.getItem('sigae_escuela_codigo') || 'sb';
    const cedula = usr?.cedula ? String(usr.cedula).trim() : null;

    const { supabase } = await import('../lib/supabase');
    const { error } = await supabase.from('notificaciones_suscripciones').upsert({
      usuario_id: usr?.id_usuario || usr?.id || 'anonimo',
      cedula: cedula,
      escuela_codigo: escCodigo,
      endpoint: subJson.endpoint,
      p256dh: subJson.keys?.p256dh,
      auth: subJson.keys?.auth,
      user_agent: navigator.userAgent?.substring(0, 150)
    }, { onConflict: 'endpoint' });

    if (error) {
      console.warn('Advertencia guardando suscripción Web Push en Supabase:', error.message);
    } else {
      console.info('✅ Dispositivo suscrito exitosamente a Web Push (notificaciones con app cerrada).');
    }

    return true;
  } catch (error) {
    console.warn('Error en subscribeToWebPush:', error);
    return false;
  }
};

/**
 * Solicita permisos de notificación al usuario mediante acción explícita (clic o banner)
 */
export const solicitarPermisoWebPush = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;

  try {
    const permission = await Notification.requestPermission();
    localStorage.setItem('sigae_push_permission_requested', 'true');
    if (permission === 'granted') {
      await subscribeToWebPush();
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error solicitando permiso de notificación:', err);
    return false;
  }
};

/**
 * Despacha la notificación Push a los servidores de Google FCM / Apple APNs para entrega en segundo plano
 */
export const despacharPushNotificacion = async (payload: {
  titulo: string;
  cuerpo: string;
  escuela_codigo?: string;
  tipo?: string;
  url?: string;
}) => {
  try {
    // 1. Intentar despachar mediante endpoint serverless Vercel (/api/send-push)
    const resp = await fetch('/api/send-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (resp.ok) {
      const data = await resp.json();
      console.info('📡 Notificación Push despachada vía /api/send-push:', data);
      return data;
    }
  } catch (e) {
    console.warn('No se pudo enviar push vía /api/send-push:', e);
  }

  // 2. Fallback a Supabase Edge Function si estuviese configurada
  try {
    const { supabase } = await import('../lib/supabase');
    await supabase.functions.invoke('push-notificaciones', {
      body: { record: payload, type: 'INSERT' }
    });
  } catch (e) {
    // Silencioso para no romper ningún flujo del personal
  }
};

/**
 * Actualiza la insignia (punto rojo y cantidad) en el icono del móvil (App Badging API)
 */
export const actualizarAppBadge = (count: number) => {
  if (typeof window === 'undefined') return;
  const num = Math.max(0, count);

  // 1. API nativa del navegador / PWA
  if ('setAppBadge' in navigator) {
    if (num > 0) {
      (navigator as any).setAppBadge(num).catch(() => {});
    } else if ('clearAppBadge' in navigator) {
      (navigator as any).clearAppBadge().catch(() => {});
    }
  }

  // 2. Enviar mensaje al Service Worker activo
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: num > 0 ? 'SET_BADGE' : 'CLEAR_BADGE',
      count: num
    });
  }
};
