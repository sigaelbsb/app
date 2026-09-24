import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nbsrlauuugxfcgjavfve.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_5fWhLgihhav9Vu-t2HdyYg_pnayrzg7';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BClJY617XAIN2tmINIV-Y-wqWsDRymIYxxNJPSZuBLKot7AVYuv_IwB5kn5AwEAhKwGrSACYp9x7sbd5LPY3sYY';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'mr7sHPkrOn30VpheNsFbImNR0ed1g8LyW_DGUETrNkc';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:soporte@sigae.com';

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} catch (e) {
  console.warn('Error configurando VAPID en send-push:', e);
}

export default async function handler(req, res) {
  // Configuración de cabeceras CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Use POST.' });
  }

  try {
    const payload = req.body || {};
    // Soporta tanto llamada directa con { titulo, cuerpo, ... } como webhook de Supabase con { record: { ... } }
    const record = payload.record || payload;

    const titulo = record.titulo || record.title || 'Aviso Escolar SIGAE';
    const cuerpo = record.cuerpo || record.body || 'Nuevo comunicado disponible.';
    const escuelaCodigo = record.escuela_codigo || 'todas';
    const url = record.url || (tipo === 'transporte' ? '/categoria/Servicios%20y%20Bienestar/Transporte%20Escolar' : '/');

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Consultar las suscripciones activas
    let query = supabase.from('notificaciones_suscripciones').select('*');
    if (escuelaCodigo && escuelaCodigo !== 'todas') {
      query = query.or(`escuela_codigo.eq.${escuelaCodigo},escuela_codigo.eq.todas`);
    }

    // Si es personal para un usuario (tipo: 'usuario:12345678')
    if (tipo && tipo.startsWith('usuario:')) {
      const cedulaDestino = tipo.replace('usuario:', '').trim();
      query = query.eq('cedula', cedulaDestino);
    }

    const { data: subs, error: errSubs } = await query;

    if (errSubs) {
      console.error('Error consultando notificaciones_suscripciones:', errSubs);
      return res.status(200).json({ 
        success: false, 
        warning: 'Tabla notificaciones_suscripciones no encontrada o vacía', 
        error: errSubs.message 
      });
    }

    if (!subs || subs.length === 0) {
      return res.status(200).json({ success: true, count: 0, message: 'No hay dispositivos suscritos para esta escuela.' });
    }

    const notifData = JSON.stringify({
      title: titulo,
      body: cuerpo,
      icon: '/assets/img/sigae.png',
      badge: '/assets/img/sigae.png',
      url: url,
      tipo: tipo,
      id: record.id || Date.now(),
      vibrate: tipo === 'transporte' ? [300, 100, 300, 100, 300] : [200, 100, 200]
    });

    const pushPromises = subs.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, notifData, {
          TTL: 86400 // 24 horas de vigencia si el teléfono está apagado
        });
        return { success: true, endpoint: sub.endpoint };
      } catch (err) {
        console.error('Error enviando push a:', sub.endpoint, err.statusCode);
        // Si el endpoint expiró o la app fue desinstalada (410 o 404), limpiar automáticamente de la BD
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('notificaciones_suscripciones').delete().eq('endpoint', sub.endpoint);
        }
        return { success: false, error: err.message };
      }
    });

    const results = await Promise.all(pushPromises);
    const sentCount = results.filter(r => r.success).length;

    return res.status(200).json({
      success: true,
      total: subs.length,
      sent: sentCount
    });
  } catch (error) {
    console.error('Error general en send-push:', error);
    return res.status(500).json({ error: error.message || 'Error interno al despachar push' });
  }
}
