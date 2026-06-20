/**
 * SIGAE - SERVICE WORKER (PWA)
 * Gestiona la instalación de la app y el caché básico.
 */

const CACHE_NAME = 'sigae-cache-v4';

const urlsToCache = [
  '/',
  '/index.html',
  '/assets/img/sigae.png',
  '/assets/img/logoMPPE.png'
];

self.addEventListener('install', event => {
  (event as any).waitUntil(
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
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
