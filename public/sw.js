/**
 * SIGAE - SERVICE WORKER (PWA & LIVE AUTO-UPDATE)
 * Garantiza auto-actualizaciones instantáneas en línea y soporte offline.
 */

const CACHE_NAME = 'sigae-live-v14';

const urlsToCache = [
  '/',
  '/index.html',
  '/assets/img/sigae.png',
  '/assets/img/icono.png',
  '/assets/img/logoMPPE.png'
];

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'SET_BADGE') {
    var count = Number(event.data.count) || 0;
    if (navigator.setAppBadge) {
      if (count > 0) {
        navigator.setAppBadge(count).catch(function() {});
      } else if (navigator.clearAppBadge) {
        navigator.clearAppBadge().catch(function() {});
      }
    }
  }
  if (event.data && event.data.type === 'CLEAR_BADGE') {
    if (navigator.clearAppBadge) {
      navigator.clearAppBadge().catch(function() {});
    }
  }
});

self.addEventListener('install', function(event) {
  // Activar inmediatamente el nuevo Service Worker sin esperar cierre de pestañas
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Eliminar cachés antiguos para no mantener código desactualizado
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', function(event) {
  // No interceptar peticiones a la base de datos Supabase
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  // Estrategia Network-First para navegación y documentos HTML
  // Garantiza que siempre se descargue la última versión desplegada en Vercel
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          if (response && response.status === 200) {
            var responseClone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(function() {
          return caches.match(event.request).then(function(res) {
            return res || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Para otros recursos (JS con hash, CSS, imágenes):
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        if (response && response.status === 200 && event.request.method === 'GET') {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        return caches.match(event.request);
      })
  );
});

// GESTIÓN DE NOTIFICACIONES PUSH EN SEGUNDO PLANO (ESTILO WHATSAPP)
self.addEventListener('push', function(event) {
  var data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = {
        title: 'Notificación SIGAE',
        body: event.data.text()
      };
    }
  } else {
    data = {
      title: 'Aviso Escolar SIGAE',
      body: 'Tiene un nuevo aviso importante en el sistema escolar.'
    };
  }

  var options = {
    body: data.body || 'Nuevo comunicado escolar disponible.',
    icon: data.icon || '/assets/img/sigae.png',
    badge: '/assets/img/sigae.png',
    vibrate: data.vibrate || [300, 100, 300, 100, 300],
    tag: data.tag || ('sigae-notif-' + (data.id || Date.now())),
    renotify: true,
    requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : false,
    data: {
      url: data.url || '/',
      id: data.id || null,
      creado_en: data.creado_en || new Date().toISOString()
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'SIGAE Escolar', options).then(function() {
      // Actualizar insignia roja (Punto rojo y cantidad) en el icono de la aplicación en el teléfono
      if (navigator.setAppBadge) {
        return self.registration.getNotifications().then(function(notifications) {
          var unreadCount = notifications ? notifications.length : 1;
          return navigator.setAppBadge(unreadCount).catch(function() {});
        });
      }
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Actualizar o limpiar el contador de insignia (App Badge) al abrir
  if (navigator.setAppBadge && self.registration.getNotifications) {
    self.registration.getNotifications().then(function(remaining) {
      if (remaining && remaining.length > 0) {
        navigator.setAppBadge(remaining.length).catch(function() {});
      } else if (navigator.clearAppBadge) {
        navigator.clearAppBadge().catch(function() {});
      }
    }).catch(function() {});
  } else if (navigator.clearAppBadge) {
    navigator.clearAppBadge().catch(function() {});
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      var targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';
      var urlToOpen = new URL(targetUrl, self.location.origin).href;

      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
