import React, { useEffect, useState } from 'react';

export const InstallPwaModal: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Detect if already running as standalone PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return; // Ya está instalada y abierta como PWA

    // 2. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // 3. Listen for beforeinstallprompt event (Chrome, Edge, Android)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Si es primera vez y ya capturamos el evento, mostrar modal
      const promptStatus = localStorage.getItem('sigae_pwa_prompt_status');
      if (!promptStatus) {
        setTimeout(() => setShowModal(true), 1500);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Si es primera vez (o iOS donde no dispara el evento), programar mostrar modal en 2.5 segundos
    const promptStatus = localStorage.getItem('sigae_pwa_prompt_status');
    if (!promptStatus && !standalone) {
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 2500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    // 5. Escuchar evento manual para abrir desde botones en la interfaz
    const handleManualShow = () => {
      setShowModal(true);
    };
    window.addEventListener('show-pwa-modal', handleManualShow);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('show-pwa-modal', handleManualShow);
    };
  }, []);

  // Listen for appinstalled event
  useEffect(() => {
    const handleAppInstalled = () => {
      localStorage.setItem('sigae_pwa_prompt_status', 'installed');
      setShowModal(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem('sigae_pwa_prompt_status', 'installed');
        setShowModal(false);
      }
      setDeferredPrompt(null);
    } else {
      // Si no hay deferredPrompt listo pero es Chrome/Desktop, mostrar instrucciones y cerrar
      localStorage.setItem('sigae_pwa_prompt_status', 'dismissed');
      setShowModal(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('sigae_pwa_prompt_status', 'dismissed');
    setShowModal(false);
  };

  if (!showModal || isStandalone) return null;

  return (
    <div 
      className="modal show d-block animate__animated animate__fadeIn" 
      tabIndex={-1} 
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', zIndex: 9999 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
        <div 
          className="modal-content border-0 shadow-lg" 
          style={{ 
            borderRadius: '24px', 
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' 
          }}
        >
          {/* Header con gradiente azul y decoraciones */}
          <div 
            className="p-4 text-white text-center position-relative" 
            style={{ 
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0066FF 100%)',
              paddingBottom: '35px !important'
            }}
          >
            <div className="position-absolute" style={{ top: '15px', right: '15px' }}>
              <button 
                type="button" 
                className="btn-close btn-close-white opacity-75 hover-efecto" 
                onClick={handleDismiss}
                aria-label="Cerrar"
              ></button>
            </div>
            <div 
              className="d-inline-flex align-items-center justify-content-center bg-white p-2 rounded-4 shadow-sm mb-3"
              style={{ width: '74px', height: '74px' }}
            >
              <img 
                src="/assets/img/icono.png" 
                alt="SIGAE App" 
                style={{ width: '58px', height: '58px', objectFit: 'contain' }} 
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <i className="bi bi-app-indicator text-primary fs-1" style={{ display: 'none' }}></i>
            </div>
            <h4 className="fw-bolder mb-1">¡Instala SIGAE en tu equipo!</h4>
            <p className="small mb-0 opacity-90">
              Acceso institucional directo, rápido y optimizado
            </p>
          </div>

          {/* Body */}
          <div className="p-4 pt-3 text-dark">
            <div className="d-flex flex-column gap-3 my-2">
              <div className="d-flex align-items-start gap-3 p-2 rounded-3" style={{ background: 'rgba(0, 102, 255, 0.05)' }}>
                <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3 flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-lightning-charge-fill fs-5"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-1 fs-6 text-dark">Ingreso Instantáneo</h6>
                  <p className="small text-muted mb-0">Abre el sistema con un solo toque desde tu escritorio o pantalla de inicio del celular.</p>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3 p-2 rounded-3" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                <div className="p-2 bg-success bg-opacity-10 text-success rounded-3 flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-qr-code-scan fs-5"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-1 fs-6 text-dark">Comprobantes y Código QR</h6>
                  <p className="small text-muted mb-0">Lleva tus solicitudes, pases escolares y soportes siempre a mano y listos para mostrar.</p>
                </div>
              </div>

              <div className="d-flex align-items-start gap-3 p-2 rounded-3" style={{ background: 'rgba(99, 102, 241, 0.05)' }}>
                <div className="p-2 bg-indigo bg-opacity-10 text-primary rounded-3 flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-shield-check fs-5"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-1 fs-6 text-dark">Experiencia 100% Pantalla Completa</h6>
                  <p className="small text-muted mb-0">Navega sin barras del navegador ni distracciones con máxima seguridad en tus datos.</p>
                </div>
              </div>
            </div>

            {/* Instrucciones personalizadas si es iOS o si no hay deferredPrompt en escritorio */}
            {isIOS ? (
              <div className="alert alert-info border-0 rounded-4 p-3 mt-3 mb-2 small text-dark d-flex flex-column gap-2" style={{ background: '#e0f2fe' }}>
                <div className="fw-bold text-primary d-flex align-items-center gap-2">
                  <i className="bi bi-apple fs-5"></i> ¿Cómo instalar en iPhone o iPad?
                </div>
                <div>
                  1. Presiona el botón <strong>Compartir</strong> <i className="bi bi-share"></i> en la barra inferior o superior de Safari.
                </div>
                <div>
                  2. Desliza hacia abajo y selecciona <strong>"Agregar a inicio"</strong> <i className="bi bi-plus-square"></i>.
                </div>
              </div>
            ) : !deferredPrompt ? (
              <div className="alert alert-secondary border-0 rounded-4 p-3 mt-3 mb-2 small text-dark" style={{ background: '#f1f5f9' }}>
                <div className="fw-bold text-dark mb-1">
                  <i className="bi bi-three-dots-vertical text-primary me-1"></i> Para instalar manualmente:
                </div>
                <div>
                  Presiona el menú del navegador (<strong>⋮</strong> en la esquina superior) y selecciona <strong>"Instalar SIGAE"</strong> o <strong>"Agregar a la pantalla principal"</strong>.
                </div>
              </div>
            ) : null}

            {/* Acciones */}
            <div className="d-flex flex-column gap-2 mt-4 pt-1">
              {deferredPrompt ? (
                <button 
                  type="button" 
                  className="btn btn-primary rounded-pill py-3 fw-bold fs-6 shadow-sm d-flex align-items-center justify-content-center gap-2 hover-efecto"
                  onClick={handleInstallClick}
                  style={{ background: 'var(--color-primario, #0066FF)', border: 'none' }}
                >
                  <i className="bi bi-download fs-5"></i> Instalar Aplicación Ahora
                </button>
              ) : isIOS ? (
                <button 
                  type="button" 
                  className="btn btn-primary rounded-pill py-3 fw-bold fs-6 shadow-sm hover-efecto"
                  onClick={handleDismiss}
                  style={{ background: 'var(--color-primario, #0066FF)', border: 'none' }}
                >
                  ¡Entendido, lo instalaré!
                </button>
              ) : (
                <button 
                  type="button" 
                  className="btn btn-primary rounded-pill py-3 fw-bold fs-6 shadow-sm hover-efecto"
                  onClick={handleDismiss}
                  style={{ background: 'var(--color-primario, #0066FF)', border: 'none' }}
                >
                  Entendido
                </button>
              )}

              <button 
                type="button" 
                className="btn btn-light rounded-pill py-2 fw-semibold text-muted small hover-efecto"
                onClick={handleDismiss}
              >
                No por ahora, continuar en la web
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
