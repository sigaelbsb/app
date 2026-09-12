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
const SIGAE_BUILD_VERSION = 'v1.2.0-brand-escudo-3d';
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
