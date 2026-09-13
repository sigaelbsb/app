import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Función para obtener el nombre amigable del módulo al que se navega
 */
const resolverNombreModulo = (path: string): string => {
  if (!path || path === '/') return 'Menú Principal';
  
  const segments = path.split('/').filter(Boolean);
  
  if (segments[0] === 'categoria') {
    if (segments[2]) {
      try {
        return decodeURIComponent(segments[2]);
      } catch {
        return segments[2];
      }
    }
    if (segments[1]) {
      try {
        return decodeURIComponent(segments[1]);
      } catch {
        return segments[1];
      }
    }
  }

  // Rutas directas específicas
  if (path.includes('transporte')) return 'Transporte Escolar';
  if (path.includes('perfil')) return 'Mi Perfil';
  if (path.includes('usuarios')) return 'Gestión de Usuarios';
  if (path.includes('roles')) return 'Roles y Privilegios';
  if (path.includes('preguntas')) return 'Preguntas de Seguridad';
  if (path.includes('auditoria')) return 'Auditoría del Sistema';
  if (path.includes('expediente')) return 'Expediente Docente';
  if (path.includes('admisiones')) return 'Gestión de Admisiones';
  if (path.includes('vincular')) return 'Vincular Estudiante';
  if (path.includes('actualizacion')) return 'Actualización de Datos';
  if (path.includes('verificaciones')) return 'Verificaciones';
  if (path.includes('disenos')) return 'Estudio de Diseño';

  return 'Módulo Escolar';
};

export const NavigationLoader: React.FC = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [moduloNombre, setModuloNombre] = useState('Módulo Escolar');
  const [loadingText, setLoadingText] = useState('Cargando registros escolares...');

  useEffect(() => {
    const nombre = resolverNombreModulo(location.pathname);
    setModuloNombre(nombre);
    startLoading(`Abriendo ${nombre}...`);

    // Progresión fluida y rápida de carga
    const t1 = setTimeout(() => setProgress(35), 60);
    const t2 = setTimeout(() => setProgress(75), 180);
    const t3 = setTimeout(() => {
      setProgress(100);
    }, 380);

    const t4 = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 750);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [location.pathname]);

  // Soporte para eventos personalizados disparados por subprocesos
  useEffect(() => {
    const handleStart = (e: any) => {
      const text = typeof e.detail === 'string' ? e.detail : 'Procesando información...';
      startLoading(text);
    };

    const handleEnd = () => {
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 400);
    };

    window.addEventListener('sigae-loading-start', handleStart);
    window.addEventListener('sigae-loading-end', handleEnd);

    return () => {
      window.removeEventListener('sigae-loading-start', handleStart);
      window.removeEventListener('sigae-loading-end', handleEnd);
    };
  }, []);

  const startLoading = (text: string) => {
    setLoadingText(text);
    setProgress(15);
    setVisible(true);
  };

  if (!visible && progress === 0) return null;

  return (
    <>
      <style>{`
        /* Barra de luz superior y destello continuo */
        @keyframes sigae-glow-sweep {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* Rotación suave del halo cuántico alrededor del escudo */
        @keyframes sigae-halo-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Micro-levitación del escudo oficial 3D */
        @keyframes sigae-shield-float {
          0%, 100% { transform: translateY(0) scale(1); filter: drop-shadow(0 4px 10px rgba(0, 102, 255, 0.3)); }
          50% { transform: translateY(-2.5px) scale(1.04); filter: drop-shadow(0 8px 16px rgba(0, 195, 255, 0.45)); }
        }

        /* Brillo de las partículas doradas */
        @keyframes sigae-sparkle-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        .sigae-nav-pill {
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1.5px solid rgba(0, 102, 255, 0.16);
          border-radius: 50px;
          padding: 8px 16px 8px 10px;
          box-shadow: 0 14px 36px rgba(15, 23, 42, 0.12), 0 2px 10px rgba(0, 102, 255, 0.08);
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .sigae-nav-shield-container {
          position: relative;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(240, 246, 255, 0.95) 100%);
          box-shadow: 0 2px 8px rgba(0, 102, 255, 0.12);
        }

        .sigae-nav-shield-halo {
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: #0066FF;
          border-right-color: #00C3FF;
          border-bottom-color: #ec4899;
          animation: sigae-halo-spin 1.2s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
          filter: drop-shadow(0 0 5px rgba(0, 195, 255, 0.65));
        }

        .sigae-nav-shield-img {
          width: 32px;
          height: 32px;
          object-fit: contain;
          z-index: 2;
          animation: sigae-shield-float 2.4s ease-in-out infinite;
          user-select: none;
          pointer-events: none;
        }

        .sigae-nav-badge-ready {
          position: absolute;
          bottom: -1px;
          right: -1px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          width: 17px;
          height: 17px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          border: 1.5px solid #ffffff;
          box-shadow: 0 2px 5px rgba(16, 185, 129, 0.5);
          z-index: 3;
        }
      `}</style>

      {/* 1. BARRA DE PROGRESO SUPERIOR ULTRA-FINA NEÓN SIGAE */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '3.5px',
          zIndex: 999999,
          pointerEvents: 'none',
          backgroundColor: 'rgba(0, 102, 255, 0.06)',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #0066FF 0%, #00C3FF 40%, #ec4899 75%, #00e5ff 100%)',
            backgroundSize: '200% 100%',
            boxShadow: '0 0 14px rgba(0, 195, 255, 0.9), 0 0 6px rgba(0, 102, 255, 0.6)',
            transition: 'width 0.22s ease-out, opacity 0.3s ease',
            opacity: progress === 100 ? 0 : 1,
            borderRadius: '0 4px 4px 0',
            animation: 'sigae-glow-sweep 1.8s linear infinite',
          }}
        />
      </div>

      {/* 2. CÁPSULA FLOTANTE DE TRANSICIÓN CON EL ESCUDO 3D DE SIGAE */}
      <div
        className="animate__animated animate__fadeInDown animate__faster"
        style={{
          position: 'fixed',
          top: '74px',
          right: '24px',
          zIndex: 999998,
          pointerEvents: 'none',
        }}
      >
        <div className="d-flex align-items-center gap-3 sigae-nav-pill">
          {/* Contenedor del Escudo Oficial con Halo Cuántico */}
          <div className="sigae-nav-shield-container flex-shrink-0">
            {progress < 100 && (
              <div className="sigae-nav-shield-halo" />
            )}
            
            <img 
              src="/assets/img/sigae.png?v=escudo3d" 
              alt="SIGAE - Sistema Integral de Gestión y Administración Escolar" 
              className="sigae-nav-shield-img"
              draggable={false}
            />

            {progress === 100 && (
              <div className="sigae-nav-badge-ready animate__animated animate__zoomIn">
                <i className="bi bi-check-lg fw-bold"></i>
              </div>
            )}
          </div>

          {/* Información del Módulo y Estado */}
          <div className="d-flex flex-column" style={{ minWidth: '160px' }}>
            <div className="d-flex align-items-center justify-content-between gap-2">
              <span 
                className="fw-bold text-dark text-truncate" 
                style={{ 
                  fontSize: '0.85rem', 
                  lineHeight: 1.2,
                  maxWidth: '220px',
                  letterSpacing: '-0.2px'
                }}
              >
                {progress < 100 ? moduloNombre : `¡${moduloNombre} Listo!`}
              </span>
              
              <span 
                className="badge rounded-pill fw-semibold" 
                style={{ 
                  fontSize: '0.68rem',
                  backgroundColor: progress === 100 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 102, 255, 0.1)',
                  color: progress === 100 ? '#059669' : '#0066FF',
                  padding: '3px 7px'
                }}
              >
                {progress}%
              </span>
            </div>

            <span 
              className="text-muted d-flex align-items-center gap-1.5 mt-0.5" 
              style={{ fontSize: '0.72rem' }}
            >
              {progress < 100 ? (
                <>
                  <span 
                    className="spinner-grow spinner-grow-sm text-primary" 
                    style={{ width: '6px', height: '6px' }}
                  ></span>
                  <span>{loadingText}</span>
                </>
              ) : (
                <>
                  <i className="bi bi-shield-fill-check text-success"></i>
                  <span>Módulo verificado y activo</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
