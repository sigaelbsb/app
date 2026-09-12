import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

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
