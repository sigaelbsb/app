import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface TourStep {
  selector: string | (() => string);
  titulo: string;
  descripcion: string;
  icono: string;
  posicion?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export const TourOrientacion: React.FC = () => {
  const [activo, setActivo] = useState<boolean>(false);
  const [paso, setPaso] = useState<number>(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const location = useLocation();

  const pasos: TourStep[] = [
    {
      selector: () => window.innerWidth < 992 ? '#btn-menu-movil' : '#btn-colapsar-menu',
      titulo: 'Menú Principal de SIGAE',
      descripcion: 'Haz clic en este botón para expandir o contraer el panel lateral. Desde allí puedes explorar las categorías de Gestión Estudiantil, Transporte, Finanzas, Dirección y más.',
      icono: 'bi-list-ul',
      posicion: 'bottom'
    },
    {
      selector: '#card-accesos-rapidos',
      titulo: 'Botonera de Accesos Rápidos',
      descripcion: 'En esta tarjeta encontrarás los módulos principales activados según tus permisos de usuario. Es un atajo para ingresar rápidamente a tus funciones diarias.',
      icono: 'bi-grid-fill',
      posicion: 'top'
    },
    {
      selector: '#sigma-container',
      titulo: 'Cerebro y Asistente Sigma',
      descripcion: '¿Tienes alguna consulta o necesitas ayuda en la plataforma? Nuestro asistente inteligente Sigma está siempre disponible en la esquina inferior para orientarte.',
      icono: 'bi-robot',
      posicion: 'top'
    }
  ];

  const iniciarTour = () => {
    setPaso(0);
    setActivo(true);
  };

  const finalizarOmitirTour = () => {
    setActivo(false);
    localStorage.setItem('sigae_tour_orientacion_v1_omitido', 'true');
  };

  useEffect(() => {
    const handleIniciar = () => {
      iniciarTour();
    };
    window.addEventListener('sigae-iniciar-tour', handleIniciar);

    // Si es la primera vez que ingresa a Inicio y no ha omitido/terminado el tour
    if (location.pathname === '/' && !localStorage.getItem('sigae_tour_orientacion_v1_omitido')) {
      const temporizador = setTimeout(() => {
        iniciarTour();
      }, 1200);
      return () => {
        clearTimeout(temporizador);
        window.removeEventListener('sigae-iniciar-tour', handleIniciar);
      };
    }

    return () => window.removeEventListener('sigae-iniciar-tour', handleIniciar);
  }, [location.pathname]);

  // Actualizar la posición del elemento destacado en cada paso o redimensión
  useEffect(() => {
    if (!activo) return;

    const actualizarPosicion = () => {
      const pasoActual = pasos[paso];
      if (!pasoActual) return;

      const sel = typeof pasoActual.selector === 'function' ? pasoActual.selector() : pasoActual.selector;
      const el = document.querySelector(sel);

      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        setTimeout(() => {
          const bounding = el.getBoundingClientRect();
          setRect(bounding);
        }, 300);
      } else {
        // Si no se halla el elemento en este dispositivo, centrar el popover
        setRect(null);
      }
    };

    actualizarPosicion();
    window.addEventListener('resize', actualizarPosicion);
    window.addEventListener('scroll', actualizarPosicion, true);

    return () => {
      window.removeEventListener('resize', actualizarPosicion);
      window.removeEventListener('scroll', actualizarPosicion, true);
    };
  }, [activo, paso]);

  if (!activo) return null;

  const pasoActual = pasos[paso];
  const esUltimoPaso = paso === pasos.length - 1;

  // Calcular la posición del card flotante en base a rect y al tipo de posición preferida
  const calcularEstilosCard = (): React.CSSProperties => {
    if (!rect) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 100005,
        width: '90%',
        maxWidth: '420px'
      };
    }

    const anchoCard = Math.min(window.innerWidth - 32, 400);
    let topPos = rect.bottom + 15;
    let leftPos = rect.left;

    if (pasoActual.posicion === 'top' || topPos + 260 > window.innerHeight) {
      topPos = Math.max(16, rect.top - 250);
    }

    if (leftPos + anchoCard > window.innerWidth - 16) {
      leftPos = Math.max(16, window.innerWidth - anchoCard - 16);
    }

    return {
      position: 'fixed',
      top: `${topPos}px`,
      left: `${leftPos}px`,
      width: `${anchoCard}px`,
      zIndex: 100005
    };
  };

  return (
    <div className="tour-orientacion-overlay" style={{ position: 'fixed', inset: 0, zIndex: 100000, pointerEvents: 'auto' }}>
      {/* Spotlight (Corte del fondo oscuro en el elemento destacado) */}
      {rect ? (
        <div
          className="tour-spotlight-box animate__animated animate__fadeIn"
          style={{
            position: 'fixed',
            top: `${Math.max(0, rect.top - 6)}px`,
            left: `${Math.max(0, rect.left - 6)}px`,
            width: `${rect.width + 12}px`,
            height: `${rect.height + 12}px`,
            borderRadius: '16px',
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75), 0 0 25px rgba(0, 102, 255, 0.8)',
            border: '2px solid #0066ff',
            pointerEvents: 'none',
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 100001
          }}
        />
      ) : (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 100001
          }}
        />
      )}

      {/* Tarjeta de Guía Flotante */}
      <div
        className="card border-0 shadow-lg rounded-4 overflow-hidden animate__animated animate__fadeInUp"
        style={calcularEstilosCard()}
      >
        <div className="bg-primary text-white p-3 px-4 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-white text-primary fw-bold rounded-pill px-2.5 py-1">
              Paso {paso + 1} de {pasos.length}
            </span>
            <span className="fw-bold small mb-0">Orientación Inicial</span>
          </div>
          <button
            type="button"
            onClick={finalizarOmitirTour}
            className="btn-close btn-close-white"
            title="Omitir orientación"
            aria-label="Cerrar"
          ></button>
        </div>

        <div className="p-4 bg-white">
          <div className="d-flex align-items-start gap-3 mb-3">
            <div
              className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: '46px', height: '46px', fontSize: '1.4rem' }}
            >
              <i className={`bi ${pasoActual.icono}`}></i>
            </div>
            <div>
              <h5 className="fw-bold text-dark mb-1">{pasoActual.titulo}</h5>
              <p className="text-muted small mb-0 lh-base">{pasoActual.descripcion}</p>
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-between pt-3 border-top mt-3">
            <button
              type="button"
              onClick={finalizarOmitirTour}
              className="btn btn-sm btn-link text-muted text-decoration-none fw-semibold px-0 hover-efecto"
            >
              Omitir guía
            </button>

            <div className="d-flex align-items-center gap-2">
              {paso > 0 && (
                <button
                  type="button"
                  onClick={() => setPaso(paso - 1)}
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold"
                >
                  <i className="bi bi-chevron-left"></i> Anterior
                </button>
              )}

              {esUltimoPaso ? (
                <button
                  type="button"
                  onClick={finalizarOmitirTour}
                  className="btn btn-sm btn-success rounded-pill px-4 fw-bold shadow-sm"
                >
                  ¡Entendido! <i className="bi bi-check2-circle ms-1"></i>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setPaso(paso + 1)}
                  className="btn btn-sm btn-primary rounded-pill px-4 fw-bold shadow-sm"
                >
                  Siguiente <i className="bi bi-chevron-right ms-1"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
