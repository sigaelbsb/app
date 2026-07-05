/**
 * SIGAE - SERVICE WORKER (PWA)
 * Gestiona la instalación de la app y el caché básico.
 */

const CACHE_NAME = 'sigae-cache-v5';

const urlsToCache = [
  '/',
  '/index.html',
  '/assets/img/sigae.png',
  '/assets/img/logoMPPE.png'
];

self.addEventListener('install', event => {
  // Fuerza a que el nuevo service worker se active inmediatamente
  (self as any).skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caché abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  const reqEvent = event as FetchEvent;
  if (reqEvent.request.url.includes('supabase.co')) {
    return;
  }

  reqEvent.respondWith(
    fetch(reqEvent.request)
      .then(response => {
        return response;
      })
      .catch(() => {
        return caches.match(reqEvent.request).then(res => res || new Response("Offline"));
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  (event as any).waitUntil(
    Promise.all([
      // Reclamar control de los clientes de inmediato
      (self as any).clients.claim(),
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
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
    const data = event.data.json();
    const options = {
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
      const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
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


