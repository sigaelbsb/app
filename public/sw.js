/**
 * SIGAE - SERVICE WORKER (PWA & LIVE AUTO-UPDATE)
 * Garantiza auto-actualizaciones instantáneas en línea y soporte offline.
 */

const CACHE_NAME = 'sigae-live-v13';

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

// GESTIÓN DE NOTIFICACIONES PUSH
self.addEventListener('push', function(event) {
  if (event.data) {
    var data = event.data.json();
    var options = {
      body: data.body,
      icon: data.icon || '/assets/img/sigae.png',
      badge: '/assets/img/sigae.png',
      vibrate: data.vibrate || [200, 100, 200, 100, 200, 100, 200],
      data: {
        url: data.url || '/'
      }
    };
    
    if (navigator.setAppBadge) {
      navigator.setAppBadge(1).catch(console.error);
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (navigator.clearAppBadge) {
    navigator.clearAppBadge().catch(console.error);
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      var urlToOpen = new URL(event.notification.data.url, self.location.origin).href;
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
