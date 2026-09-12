import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// REGISTRO Y AUTO-ACTUALIZACIÓN SILENCIOSA DEL SERVICE WORKER (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // Verificar si hay nueva versión inmediatamente al iniciar
      reg.update();

      // Chequeo periódico de actualizaciones cada 10 minutos
      setInterval(() => {
        reg.update();
      }, 10 * 60 * 1000);

      // Chequeo al volver a la pestaña o app
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          reg.update();
        }
      });
    }).catch((err) => console.log('SW registration failed: ', err));

    // Si un nuevo Service Worker toma el control, actualizar sin recargar forzosamente
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('Nueva versión de SIGAE detectada e instalada en segundo plano.');
      }
    });
  });
}
