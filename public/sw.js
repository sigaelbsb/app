/**
 * SIGAE - SERVICE WORKER (PWA)
 * Gestiona la instalación de la app y el caché básico.
 */

const CACHE_NAME = 'sigae-cache-v9-20260708';

const urlsToCache = [
  '/',
  '/index.html',
  '/assets/img/sigae.png?v=8',
  '/assets/img/icono.png?v=8',
  '/assets/img/logoMPPE.png'
];

self.addEventListener('install', function(event) {
  // Fuerza a que el nuevo service worker se active inmediatamente
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Caché abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        return response;
      })
      .catch(function() {
        return caches.match(event.request).then(function(res) {
          return res || new Response("Offline");
        });
      })
  );
});

self.addEventListener('activate', function(event) {
  var cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    Promise.all([
      // Reclamar control de los clientes de inmediato
      self.clients.claim(),
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});


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
    
    // Activar el punto rojo (App Badge) en el icono de la app
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
