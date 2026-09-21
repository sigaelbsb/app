import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export type PersonajeGuiaTour = 'zoe' | 'max' | 'duo';

interface TourStep {
  selector?: string | (() => string);
  titulo: string;
  descripcion: string;
  icono: string;
  consejo?: string;
  posicion?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export const TourOrientacion: React.FC = () => {
  const [activo, setActivo] = useState<boolean>(false);
  const [paso, setPaso] = useState<number>(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [guia, setGuia] = useState<PersonajeGuiaTour>(() => {
    try {
      const g = localStorage.getItem('sigae_guia_tour');
      if (g === 'zoe' || g === 'max' || g === 'duo') return g;
    } catch (e) {}
    return 'duo';
  });
  const location = useLocation();

  const pasos: TourStep[] = [
    {
      titulo: '¡Bienvenidos a SIGAE con Zoe y Max!',
      descripcion: 'Somos tus compañeros y guías en la plataforma escolar. Te acompañaremos en un breve recorrido interactivo para que aprendas a moverte por el sistema con rapidez y comodidad.',
      icono: 'bi-stars',
      consejo: 'Puedes elegir si deseas que te acompañe Zoe, Max o ambos juntos en este recorrido.'
    },
    {
      selector: () => (window.innerWidth < 992 ? '#btn-menu-movil' : '#btn-colapsar-menu'),
      titulo: 'Menú Principal y Categorías',
      descripcion: 'Haz clic en este botón para expandir o contraer el panel lateral. Desde allí puedes acceder a Gestión Estudiantil, Rutas de Transporte, Personal, Dirección y Seguridad.',
      icono: 'bi-list-ul',
      consejo: 'Colapsar el menú te dará más espacio libre para visualizar tablas y formularios extensos.',
      posicion: 'bottom'
    },
    {
      selector: '#card-accesos-rapidos',
      titulo: 'Botonera de Accesos Rápidos',
      descripcion: 'En este panel principal encontrarás accesos directos a los módulos esenciales autorizados según tu rol de usuario. ¡Es el camino más veloz para tus gestiones cotidianas!',
      icono: 'bi-grid-fill',
      consejo: 'Si algún botón no aparece, recuerda que las funciones se adaptan a los permisos de tu cuenta.',
      posicion: 'top'
    },
    {
      selector: '#sigma-container',
      titulo: 'Tus Guías Virtuales siempre contigo',
      descripcion: 'En la esquina inferior izquierda nos encontrarás siempre listos para ayudarte. Puedes chatear con nosotros, buscar cualquier módulo al instante o activar nuestro micro-video interactivo de saludo.',
      icono: 'bi-chat-heart-fill',
      consejo: '¡Puedes alternar entre Zoe y Max con un solo clic en la cabecera del chat!',
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

  const cambiarGuia = (nuevoGuia: PersonajeGuiaTour) => {
    setGuia(nuevoGuia);
    localStorage.setItem('sigae_guia_tour', nuevoGuia);
  };

  useEffect(() => {
    const handleIniciar = () => {
      iniciarTour();
    };
    window.addEventListener('sigae-iniciar-tour', handleIniciar);
    return () => window.removeEventListener('sigae-iniciar-tour', handleIniciar);
  }, [location.pathname]);

  // Actualizar la posición del elemento destacado en cada paso o redimensión
  useEffect(() => {
    if (!activo) return;

    const actualizarPosicion = () => {
      const pasoActual = pasos[paso];
      if (!pasoActual || !pasoActual.selector) {
        setRect(null);
        return;
      }

      const sel = typeof pasoActual.selector === 'function' ? pasoActual.selector() : pasoActual.selector;
      const el = document.querySelector(sel);

      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        setTimeout(() => {
          const bounding = el.getBoundingClientRect();
          setRect(bounding);
        }, 300);
      } else {
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

  // Resolver imagen del guía actual adaptada a la gesticulación de cada paso
  const resolverImagenGuia = () => {
    if (paso === 0) return '/zoe_max_duo_3d.png';
    if (paso === 1) return guia === 'zoe' ? '/zoe_saludo.png' : '/max_senala.png';
    if (paso === 2) return guia === 'max' ? '/max_pulgar.png' : '/zoe_documentos.png';
    if (paso === 3) return guia === 'zoe' ? '/zoe_saludo.png' : '/max_pulgar.png';
    return guia === 'zoe' ? '/zoe_avatar.png' : (guia === 'max' ? '/max_avatar.png' : '/zoe_max_duo_3d.png');
  };

  const resolverNombreGuia = () => {
    if (guia === 'zoe') return 'Zoe';
    if (guia === 'max') return 'Max';
    return 'Zoe y Max';
  };

  // Calcular la posición del card flotante adaptado a móviles
  const calcularEstilosCard = (): React.CSSProperties => {
    const esMovil = typeof window !== 'undefined' && window.innerWidth < 768;

    // En teléfonos móviles siempre centrado y con scroll seguro
    if (esMovil || !rect || !pasoActual.selector) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 100005,
        width: 'calc(100vw - 24px)',
        maxWidth: '430px',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: '22px'
      };
    }

    const anchoCard = Math.min(window.innerWidth - 32, 430);
    let topPos = rect.bottom + 16;
    let leftPos = rect.left;

    if (pasoActual.posicion === 'top' || topPos + 320 > window.innerHeight) {
      topPos = Math.max(16, rect.top - 310);
    }

    if (leftPos + anchoCard > window.innerWidth - 16) {
      leftPos = Math.max(16, window.innerWidth - anchoCard - 16);
    }

    return {
      position: 'fixed',
      top: `${topPos}px`,
      left: `${leftPos}px`,
      width: `${anchoCard}px`,
      maxHeight: '90vh',
      overflowY: 'auto',
      borderRadius: '22px',
      zIndex: 100005
    };
  };

  const esPantallaPequena = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="tour-orientacion-overlay" style={{ position: 'fixed', inset: 0, zIndex: 100000, pointerEvents: 'auto' }}>
      {/* Spotlight (Corte del fondo oscuro en el elemento destacado) */}
      {rect ? (
        <div
          className="tour-spotlight-box animate__animated animate__fadeIn"
          style={{
            position: 'fixed',
            top: `${Math.max(0, rect.top - 8)}px`,
            left: `${Math.max(0, rect.left - 8)}px`,
            width: `${rect.width + 16}px`,
            height: `${rect.height + 16}px`,
            borderRadius: '18px',
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.78), 0 0 30px rgba(0, 102, 255, 0.85)',
            border: '2.5px solid #0066ff',
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
            backgroundColor: 'rgba(15, 23, 42, 0.78)',
            zIndex: 100001
          }}
        />
      )}

      {/* Contenedor Flotante Centrado para Celulares y Desktop (Garantiza 0 desbordamiento) */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '14px',
          zIndex: 100005,
          pointerEvents: 'none'
        }}
      >
        <div
          className="card border-0 shadow-lg overflow-hidden animate__animated animate__fadeInUp"
          style={{
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: '430px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '24px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
            border: '1.5px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          {/* Cabecera temática con Zoe y Max */}
          <div 
            className="text-white p-3 px-3 px-sm-4 d-flex align-items-center justify-content-between flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)' }}
          >
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-white text-primary fw-bold rounded-pill px-2.5 py-1" style={{ fontSize: '0.72rem' }}>
                Paso {paso + 1} de {pasos.length}
              </span>
              <span className="fw-bold small mb-0 d-flex align-items-center gap-1.5" style={{ fontSize: '0.82rem' }}>
                <i className="bi bi-compass-fill text-warning"></i> Guía: {resolverNombreGuia()}
              </span>
            </div>
            <button
              type="button"
              onClick={finalizarOmitirTour}
              className="btn-close btn-close-white"
              title="Omitir recorrido"
              aria-label="Cerrar"
              style={{ transform: 'scale(0.85)' }}
            ></button>
          </div>

          <div className="p-3 p-sm-4 bg-white overflow-y-auto" style={{ flexGrow: 1 }}>
            {/* Si es el paso 0, mostramos al Dúo en formato adaptable a móviles */}
            {paso === 0 ? (
              <div className="text-center mb-2">
                <div className="d-flex justify-content-center mb-2">
                  <img
                    src="/zoe_max_duo_3d.png"
                    alt="Zoe y Max"
                    style={{ 
                      maxHeight: '135px',
                      maxWidth: '100%',
                      objectFit: 'contain', 
                      filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.18))' 
                    }}
                  />
                </div>
                <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '1.15rem' }}>
                  {pasoActual.titulo}
                </h5>
                <p className="text-muted small mb-2.5" style={{ fontSize: '0.82rem', lineHeight: 1.35 }}>
                  {pasoActual.descripcion}
                </p>

                {/* Selector de Guía preferido */}
                <div className="bg-light p-2.5 rounded-3 border mb-2 text-start">
                  <div className="extra-small text-muted fw-bold mb-1.5 text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                    <i className="bi bi-person-heart me-1 text-primary"></i> Elige tu anfitrión para este recorrido:
                  </div>
                  <div className="d-flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => cambiarGuia('zoe')}
                      className={`btn btn-sm flex-fill rounded-pill fw-bold d-flex align-items-center justify-content-center gap-1.5 py-1.5 px-2 ${guia === 'zoe' ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
                      style={{ fontSize: '0.76rem' }}
                    >
                      <img src="/zoe_avatar.png" alt="Zoe" className="rounded-circle" style={{ width: '18px', height: '18px' }} />
                      Zoe
                    </button>
                    <button
                      type="button"
                      onClick={() => cambiarGuia('max')}
                      className={`btn btn-sm flex-fill rounded-pill fw-bold d-flex align-items-center justify-content-center gap-1.5 py-1.5 px-2 ${guia === 'max' ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
                      style={{ fontSize: '0.76rem' }}
                    >
                      <img src="/max_avatar.png" alt="Max" className="rounded-circle" style={{ width: '18px', height: '18px' }} />
                      Max
                    </button>
                    <button
                      type="button"
                      onClick={() => cambiarGuia('duo')}
                      className={`btn btn-sm flex-fill rounded-pill fw-bold d-flex align-items-center justify-content-center gap-1.5 py-1.5 px-2 ${guia === 'duo' ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
                      style={{ fontSize: '0.76rem' }}
                    >
                      <i className="bi bi-people-fill text-warning"></i>
                      Ambos
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="d-flex align-items-start gap-2.5 mb-2">
                <div className="position-relative flex-shrink-0">
                  <img
                    src={resolverImagenGuia()}
                    alt={resolverNombreGuia()}
                    className="rounded-circle border border-2 border-primary shadow-sm"
                    style={{ width: '52px', height: '52px', objectFit: 'cover' }}
                  />
                  <span 
                    className="badge bg-success rounded-circle position-absolute"
                    style={{ bottom: '0px', right: '0px', width: '13px', height: '13px', border: '2px solid #fff' }}
                    title="En línea"
                  />
                </div>

                <div className="flex-grow-1">
                  <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '1.05rem' }}>{pasoActual.titulo}</h5>
                  <p className="text-muted small mb-2 lh-base" style={{ fontSize: '0.82rem' }}>{pasoActual.descripcion}</p>

                  {pasoActual.consejo && (
                    <div className="p-2 rounded-2 bg-primary bg-opacity-10 border border-primary border-opacity-25 text-primary small d-flex align-items-start">
                      <i className="bi bi-lightbulb-fill me-2 fs-6 flex-shrink-0 mt-0.5 text-warning"></i>
                      <span style={{ fontSize: '0.76rem' }}><b>Consejo de {resolverNombreGuia()}:</b> {pasoActual.consejo}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botonera de control del Tour */}
            <div className="d-flex align-items-center justify-content-between pt-2.5 border-top mt-2 flex-wrap gap-2">
              <button
                type="button"
                onClick={finalizarOmitirTour}
                className="btn btn-sm btn-link text-muted text-decoration-none fw-semibold px-0 hover-efecto"
                style={{ fontSize: '0.78rem' }}
              >
                Omitir guía
              </button>

              <div className="d-flex align-items-center gap-1.5 ms-auto">
                {paso > 0 && (
                  <button
                    type="button"
                    onClick={() => setPaso(paso - 1)}
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold"
                    style={{ fontSize: '0.78rem', minHeight: '36px' }}
                  >
                    <i className="bi bi-chevron-left"></i> Anterior
                  </button>
                )}

                {esUltimoPaso ? (
                  <button
                    type="button"
                    onClick={finalizarOmitirTour}
                    className="btn btn-sm btn-success rounded-pill px-3.5 fw-bold shadow-sm d-flex align-items-center gap-1"
                    style={{ fontSize: '0.82rem', minHeight: '36px' }}
                  >
                    <span>¡Comenzar a Explorar!</span> <i className="bi bi-rocket-takeoff-fill"></i>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPaso(paso + 1)}
                    className="btn btn-sm btn-primary rounded-pill px-3.5 fw-bold shadow-sm d-flex align-items-center gap-1"
                    style={{ fontSize: '0.82rem', minHeight: '36px' }}
                  >
                    <span>{paso === 0 ? 'Iniciar Recorrido' : 'Siguiente'}</span> <i className="bi bi-chevron-right"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

