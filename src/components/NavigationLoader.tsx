import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const NavigationLoader: React.FC = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [loadingText, setLoadingText] = useState('Cargando módulo escolar...');

  useEffect(() => {
    // Al cambiar la ruta (location.pathname), iniciamos la barra de carga
    startLoading('Cargando módulo y datos escolares...');

    // Simulamos la carga de la vista y sus peticiones iniciales
    const t1 = setTimeout(() => setProgress(45), 80);
    const t2 = setTimeout(() => setProgress(85), 250);
    const t3 = setTimeout(() => {
      setProgress(100);
    }, 450);

    const t4 = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [location.pathname]);

  // Escuchar eventos personalizados por si módulos o peticiones lentas quieren mostrar la barra
  useEffect(() => {
    const handleStart = (e: any) => {
      const text = e.detail || 'Procesando información...';
      startLoading(text);
    };

    const handleEnd = () => {
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 350);
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
        @keyframes flipBookPage {
          0%, 100% { transform: rotateY(0deg) scale(1); }
          50% { transform: rotateY(-30deg) scale(1.15); color: #00C853; }
        }
        @keyframes floatEduIcon {
          0%, 100% { transform: translateY(0px) rotate(-4deg); }
          50% { transform: translateY(-3px) rotate(4deg); }
        }
        @keyframes sparkleEdu {
          0%, 100% { opacity: 0.25; transform: scale(0.75); }
          50% { opacity: 1; transform: scale(1.25); }
        }
      `}</style>

      {/* 1. BARRA DE PROGRESO SUPERIOR TIPO NPROGRESS CON BRILLO NEÓN */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          zIndex: 999999,
          pointerEvents: 'none',
          backgroundColor: 'rgba(0,0,0,0.05)',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #00C853, #64DD17, #00E676)',
            boxShadow: '0 0 12px rgba(0, 230, 118, 0.9), 0 0 6px rgba(0, 200, 83, 0.6)',
            transition: 'width 0.25s ease-out, opacity 0.3s ease',
            opacity: progress === 100 ? 0 : 1,
            borderRadius: '0 4px 4px 0',
          }}
        />
      </div>

      {/* 2. PÍLDORA FLOTANTE ELEGANTE CON ELEMENTO EDUCATIVO (LIBRO ANIMADO / BIRRETE) */}
      <div
        className="animate__animated animate__fadeInDown animate__faster"
        style={{
          position: 'fixed',
          top: '76px',
          right: '24px',
          zIndex: 999998,
          pointerEvents: 'none',
        }}
      >
        <div
          className="d-flex align-items-center gap-3 px-4 py-2 rounded-pill shadow-lg border"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(10px)',
            borderColor: 'rgba(0, 200, 83, 0.3)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          }}
        >
          {progress < 100 ? (
            <div
              className="position-relative d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
              style={{
                backgroundColor: 'rgba(0, 200, 83, 0.12)',
                width: '42px',
                height: '42px',
              }}
            >
              <i
                className="bi bi-book-half text-success fs-4"
                style={{
                  animation: 'flipBookPage 1.2s infinite ease-in-out, floatEduIcon 2s infinite ease-in-out',
                }}
              ></i>
              <i
                className="bi bi-stars text-warning position-absolute"
                style={{
                  top: '2px',
                  right: '2px',
                  fontSize: '0.8rem',
                  animation: 'sparkleEdu 1.5s infinite ease-in-out',
                }}
              ></i>
            </div>
          ) : (
            <div
              className="position-relative d-flex align-items-center justify-content-center rounded-circle bg-success text-white flex-shrink-0 shadow-sm animate__animated animate__bounceIn"
              style={{ width: '42px', height: '42px' }}
            >
              <i className="bi bi-mortarboard-fill fs-5 animate__animated animate__tada"></i>
            </div>
          )}

          <div className="d-flex flex-column">
            <span className="fw-bold text-dark" style={{ fontSize: '0.85rem', lineHeight: 1.2 }}>
              {progress < 100 ? loadingText : '¡Módulo Escolar Listo!'}
            </span>
            <span className="text-muted" style={{ fontSize: '0.72rem' }}>
              {progress < 100 ? `Abriendo recursos (${progress}%)` : 'Graduado y cargado'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
