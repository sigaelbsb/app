import React, { useEffect, useState } from 'react';

export const InstallPwaModal: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Detect if already running as standalone PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return; // Ya está instalada y abierta como PWA

    // 2. Detect OS & In-App Browser (WhatsApp, Instagram, Facebook, Telegram, etc.)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    const inApp = /fban|fbav|instagram|whatsapp|wv|line|micromessenger|tiktok|twitter|snapchat/.test(userAgent) ||
                  (userAgent.includes('android') && userAgent.includes('version/4.0'));
    setIsInAppBrowser(inApp);

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
      // Si no hay deferredPrompt listo pero es Chrome/Desktop, indicar que se abra desde el menú
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
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)', zIndex: 99999 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '460px' }}>
        <div 
          className="modal-content border-0 shadow-lg" 
          style={{ 
            borderRadius: '24px', 
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' 
          }}
        >
          {/* Header con gradiente institucional */}
          <div 
            className="p-4 text-white text-center position-relative" 
            style={{ 
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0066FF 100%)',
              paddingBottom: '30px'
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
            </div>
            <h4 className="fw-bolder mb-1">¡Instala SIGAE en tu Celular o PC!</h4>
            <p className="small mb-0 opacity-90">
              Aplicación oficial directa y ligera (PWA)
            </p>
          </div>

          {/* Body */}
          <div className="p-4 pt-3 text-dark">
            {/* Beneficios */}
            <div className="d-flex flex-column gap-2 mb-3">
              <div className="d-flex align-items-center gap-3 p-2 rounded-3" style={{ background: 'rgba(0, 102, 255, 0.05)' }}>
                <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3 flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                  <i className="bi bi-lightning-charge-fill fs-5"></i>
                </div>
                <div className="small">
                  <span className="fw-bold text-dark d-block">Acceso con 1 toque</span>
                  <span className="text-muted">Abre directamente desde el icono en tu pantalla de inicio.</span>
                </div>
              </div>

              <div className="d-flex align-items-center gap-3 p-2 rounded-3" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                <div className="p-2 bg-success bg-opacity-10 text-success rounded-3 flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                  <i className="bi bi-phone-fill fs-5"></i>
                </div>
                <div className="small">
                  <span className="fw-bold text-dark d-block">Sin descargas pesadas ni virus</span>
                  <span className="text-muted">No ocupa espacio extra en la memoria interna de tu dispositivo.</span>
                </div>
              </div>
            </div>

            {/* CASO 1: NAVEGADOR DENTRO DE WHATSAPP / INSTAGRAM / FACEBOOK */}
            {isInAppBrowser && (
              <div className="alert alert-warning border-0 rounded-4 p-3 mb-3 small text-dark" style={{ background: '#fef3c7' }}>
                <div className="fw-bold text-warning-emphasis d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-exclamation-triangle-fill fs-5 text-warning"></i> 
                  <span>Estás dentro de WhatsApp / Red Social</span>
                </div>
                <p className="mb-2">
                  Para poder instalar la App en tu pantalla de inicio:
                </p>
                <ol className="ps-3 mb-0">
                  <li className="mb-1">Toca los <strong>3 puntos (⋮)</strong> o el icono de compartir en la esquina superior.</li>
                  <li>Selecciona <strong>"Abrir en Chrome"</strong> (o Safari en iPhone).</li>
                </ol>
              </div>
            )}

            {/* CASO 2: IPHONE / IPAD (iOS) */}
            {isIOS && !isInAppBrowser && (
              <div className="alert alert-info border-0 rounded-4 p-3 mb-3 small text-dark" style={{ background: '#e0f2fe' }}>
                <div className="fw-bold text-primary d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-apple fs-5"></i> ¿Cómo instalar en iPhone o iPad (Safari)?
                </div>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary rounded-circle px-2 py-1">1</span>
                    <span>Presiona el botón <strong>Compartir</strong> <i className="bi bi-share-fill text-primary ms-1"></i> (en la barra de Safari).</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary rounded-circle px-2 py-1">2</span>
                    <span>Desliza hacia abajo y elige <strong>"Agregar al inicio"</strong> <i className="bi bi-plus-square text-primary ms-1"></i>.</span>
                  </div>
                </div>
              </div>
            )}

            {/* CASO 3: ANDROID / DESKTOP SIN PROMPT AUTOMÁTICO DISPONIBLE */}
            {!deferredPrompt && !isIOS && !isInAppBrowser && (
              <div className="alert alert-secondary border-0 rounded-4 p-3 mb-3 small text-dark" style={{ background: '#f1f5f9' }}>
                <div className="fw-bold text-dark d-flex align-items-center gap-2 mb-2">
                  <i className="bi bi-phone text-primary fs-5"></i> Pasos para instalar en tu móvil:
                </div>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-dark rounded-circle px-2 py-1">1</span>
                    <span>Toca el menú de tu navegador (los <strong>3 puntos ⋮</strong> arriba a la derecha).</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary rounded-circle px-2 py-1">2</span>
                    <span>Toca <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="d-flex flex-column gap-2 mt-3">
              {deferredPrompt ? (
                <button 
                  type="button" 
                  className="btn btn-primary rounded-pill py-3 fw-bold fs-6 shadow-sm d-flex align-items-center justify-content-center gap-2 hover-efecto"
                  onClick={handleInstallClick}
                  style={{ background: 'var(--color-primario, #0066FF)', border: 'none' }}
                >
                  <i className="bi bi-download fs-5"></i> Instalar Aplicación Ahora
                </button>
              ) : (
                <button 
                  type="button" 
                  className="btn btn-primary rounded-pill py-3 fw-bold fs-6 shadow-sm hover-efecto"
                  onClick={handleDismiss}
                  style={{ background: 'var(--color-primario, #0066FF)', border: 'none' }}
                >
                  <i className="bi bi-check-circle me-1"></i> ¡Entendido!
                </button>
              )}

              <button 
                type="button" 
                className="btn btn-light rounded-pill py-2 fw-semibold text-muted small hover-efecto"
                onClick={handleDismiss}
              >
                Cerrar / Continuar en la web
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

