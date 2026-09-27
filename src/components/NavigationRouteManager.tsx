import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMobileBackNavigation } from '../hooks/useMobileBackNavigation';

export const NavigationRouteManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  // Activación del controlador inteligente de botón de retroceso móvil (físico y navegador)
  useMobileBackNavigation();

  // Limpieza rigurosa de overlays, modal-backdrops y desbordamiento congelado
  useEffect(() => {
    try {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(b => b.remove());
    } catch (_) {}

    // Scroll to top suave al cambiar de página
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch (_) {}
  }, [location.pathname]);

  return <>{children}</>;
};
