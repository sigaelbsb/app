import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PURGA TOTAL DE CACHÉ Y FORZADO DE ACTUALIZACIÓN EN TODOS LOS DISPOSITIVOS
const SIGAE_BUILD_VERSION = 'v1.3.0-sigma-orbe-v6';
try {
  const currentVer = localStorage.getItem('sigae_cached_build_version');
  if (currentVer !== SIGAE_BUILD_VERSION) {
    console.log('[SIGAE Update] Nueva versión detectada:', SIGAE_BUILD_VERSION);
    localStorage.setItem('sigae_cached_build_version', SIGAE_BUILD_VERSION);
    if ('caches' in window) {
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)));
      }).then(() => {
        if (currentVer) {
          window.location.reload();
        }
      });
    }
  }
} catch (e) {
  console.error('[SIGAE Update] Error verificando versión:', e);
}

// REGISTRO Y AUTO-ACTUALIZACIÓN INMEDIATA DEL SERVICE WORKER (PWA & MÓVIL)
if ('serviceWorker' in navigator) {
  const isDevOrLocal = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isDevOrLocal) {
    // En desarrollo local desregistramos el SW y purgamos caché para no bloquear recargas ni alterar puertos
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
      }
    });
    if ('caches' in window) {
      caches.keys().then((names) => {
        return Promise.all(names.map((n) => caches.delete(n)));
      });
    }
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        // Verificar si hay nueva versión inmediatamente al iniciar
        reg.update();

        // Chequeo activo al detectar nueva versión
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });

        // Chequeo periódico de actualizaciones cada 60 segundos
        setInterval(() => {
          reg.update();
        }, 60 * 1000);

        // Chequeo inmediato al volver a la pestaña o abrir la app en el teléfono
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            reg.update();
          }
        });
      }).catch((err) => console.log('SW registration failed: ', err));

      // Si un nuevo Service Worker toma el control, recargar inmediatamente para servir el nuevo código
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  }
}
