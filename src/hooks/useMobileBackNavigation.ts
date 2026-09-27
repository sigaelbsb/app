import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';

export const useMobileBackNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Limpieza automática de modales y desbordamiento en cada cambio de ruta
    const cleanupResidualDom = () => {
      try {
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach((b) => b.remove());
      } catch (_) {}
    };

    cleanupResidualDom();

    // 2. Manejador para navegadores móviles estándar (evento popstate / gesto de retroceso)
    const handlePopState = () => {
      // Si hay un modal SweetAlert abierto, cerrarlo primero
      const swalContainer = document.querySelector('.swal2-container');
      if (swalContainer && (window as any).Swal) {
        try {
          (window as any).Swal.close();
        } catch (_) {}
      }

      // Si hay un modal Bootstrap abierto, cerrarlo
      const openModal = document.querySelector('.modal.show');
      if (openModal) {
        const closeBtn = openModal.querySelector<HTMLElement>('[data-bs-dismiss="modal"], .btn-close');
        if (closeBtn) {
          closeBtn.click();
        }
      }

      cleanupResidualDom();
    };

    window.addEventListener('popstate', handlePopState);

    // 3. Manejador para Capacitor Android (botón de retroceso físico / barra de navegación)
    let backListenerHandle: any = null;

    const setupCapacitorBackButton = async () => {
      try {
        const isCapacitorAvailable = typeof (window as any).Capacitor !== 'undefined' || (CapacitorApp && typeof CapacitorApp.addListener === 'function');
        if (!isCapacitorAvailable) return;

        backListenerHandle = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          // A. Si hay SweetAlert abierto, cerrarlo
          const swalContainer = document.querySelector('.swal2-container');
          if (swalContainer && (window as any).Swal) {
            try {
              (window as any).Swal.close();
              return;
            } catch (_) {}
          }

          // B. Si hay modal de Bootstrap abierto, cerrarlo
          const openModal = document.querySelector('.modal.show');
          if (openModal) {
            const closeBtn = openModal.querySelector<HTMLElement>('[data-bs-dismiss="modal"], .btn-close');
            if (closeBtn) {
              closeBtn.click();
              cleanupResidualDom();
              return;
            }
          }

          // C. Si estamos en la raíz del sistema (/ o /login), minimizar/salir de la app sin pantalla blanca
          const currentPath = window.location.pathname;
          const currentHash = window.location.hash;
          const isAtHome = currentPath === '/' || currentPath === '/login' || currentHash === '#/' || currentHash === '#/login' || currentPath === '';

          if (isAtHome) {
            cleanupResidualDom();
            CapacitorApp.exitApp();
            return;
          }

          // D. Si estamos en un submódulo, regresar al panel de la categoría o al inicio
          cleanupResidualDom();
          if (currentPath.includes('/categoria/')) {
            const segments = currentPath.split('/').filter(Boolean);
            if (segments.length >= 3) {
              // Submódulo dentro de categoría -> ir a la categoría
              navigate(`/categoria/${segments[1]}`, { replace: true });
              return;
            } else {
              // Categoría -> ir al inicio
              navigate('/', { replace: true });
              return;
            }
          }

          // E. Por defecto, retroceder de forma segura o ir al inicio
          if (canGoBack && window.history.length > 1) {
            navigate(-1);
          } else {
            navigate('/', { replace: true });
          }
        });
      } catch (err) {
        console.warn('Capacitor BackButton no disponible en este entorno:', err);
      }
    };

    setupCapacitorBackButton();

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (backListenerHandle && typeof backListenerHandle.remove === 'function') {
        backListenerHandle.remove();
      }
    };
  }, [navigate, location.pathname]);
};
