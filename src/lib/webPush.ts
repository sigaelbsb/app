const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
  return outputArray;
};

export const subscribeToWebPush = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (Notification.permission !== 'granted') return;
  
  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Clave pública VAPID generada
      const publicVapidKey = 'BLBkrlyA_w_vSR_OvH1EHSOlu--pJ9ypA-LPzlqomOzdHg_M5Ze7k51iWewRpEDyoKNrd0A0q0CXPR0m_yKdl8Q';
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
    }

    // Guardar suscripción en Supabase
    const subJson = subscription.toJSON();
    const usrStr = localStorage.getItem('usuario_sigae');
    if (!usrStr) return;
    const usr = JSON.parse(usrStr);
    const escCodigo = usr.id_escuela || localStorage.getItem('sigae_escuela_codigo') || 'sb';
    
    const { supabase } = await import('../lib/supabase');
    await supabase.from('notificaciones_suscripciones').upsert({
      usuario_id: usr.id_usuario,
      escuela_codigo: escCodigo,
      endpoint: subJson.endpoint,
      p256dh: subJson.keys?.p256dh,
      auth: subJson.keys?.auth
    }, { onConflict: 'endpoint' });

  } catch (error) {
    console.error('Error suscribiendo a Web Push:', error);
  }
};
