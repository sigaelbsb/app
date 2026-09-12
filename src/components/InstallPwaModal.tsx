import React, { useEffect, useState } from 'react';

export const InstallPwaModal: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isWindows, setIsWindows] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [mostrarGuiaManual, setMostrarGuiaManual] = useState(false);

  useEffect(() => {
    // 1. Detectar si ya está corriendo como PWA instalada
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // 2. Detectar Sistema Operativo y Navegadores internos (WhatsApp, Instagram, etc.)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    const mobile = /iphone|ipad|ipod|android/.test(userAgent);
    const win = /win/.test(userAgent);
    
    setIsIOS(ios);
    setIsDesktop(!mobile);
    setIsWindows(win);

    const inApp = /fban|fbav|instagram|whatsapp|wv|line|micromessenger|tiktok|twitter|snapchat/.test(userAgent) ||
                  (userAgent.includes('android') && userAgent.includes('version/4.0'));
    setIsInAppBrowser(inApp);

    // 3. Revisar si ya se capturó el prompt anticipadamente
    if ((window as any).deferredPwaPrompt) {
      setDeferredPrompt((window as any).deferredPwaPrompt);
    }

    const handlePwaReady = () => {
      if ((window as any).deferredPwaPrompt) {
        setDeferredPrompt((window as any).deferredPwaPrompt);
      }
    };
    window.addEventListener('sigae-pwa-ready', handlePwaReady);

    // 4. Capturar evento oficial del navegador (Chrome, Edge, Samsung Internet, Android)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPwaPrompt = e;
      
      const promptStatus = localStorage.getItem('sigae_pwa_prompt_status');
      if (!promptStatus) {
        setTimeout(() => setShowModal(true), 1500);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Escuchar evento manual para abrir desde botones en la interfaz
    const handleManualShow = () => {
      if ((window as any).deferredPwaPrompt) {
        setDeferredPrompt((window as any).deferredPwaPrompt);
      }
      setShowModal(true);
      setMostrarGuiaManual(true);
    };
    window.addEventListener('show-pwa-modal', handleManualShow);

    return () => {
      window.removeEventListener('sigae-pwa-ready', handlePwaReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('show-pwa-modal', handleManualShow);
    };
  }, []);

  // Escuchar cuando la app se instala con éxito
  useEffect(() => {
    const handleAppInstalled = () => {
      localStorage.setItem('sigae_pwa_prompt_status', 'installed');
      setShowModal(false);
      setDeferredPrompt(null);
      (window as any).deferredPwaPrompt = null;
    };
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, []);

  const handleInstallClick = async () => {
    const activePrompt = deferredPrompt || (window as any).deferredPwaPrompt;
    if (activePrompt) {
      try {
        activePrompt.prompt();
        const { outcome } = await activePrompt.userChoice;
        if (outcome === 'accepted') {
          localStorage.setItem('sigae_pwa_prompt_status', 'installed');
          setShowModal(false);
        }
        setDeferredPrompt(null);
        (window as any).deferredPwaPrompt = null;
      } catch (err) {
        console.warn('Fallo al ejecutar prompt nativo:', err);
        setMostrarGuiaManual(true);
      }
    } else {
      setMostrarGuiaManual(true);
    }
  };

  const descargarAccesoDirecto = () => {
    const targetUrl = 'https://app-delta-ten-80.vercel.app/';
    const content = `[InternetShortcut]\r\nURL=${targetUrl}\r\nIconIndex=0\r\n`;
    const blob = new Blob([content], { type: 'application/internet-shortcut' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SIGAE_v1.1_Escritorio.url';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDismiss = () => {
    localStorage.setItem('sigae_pwa_prompt_status', 'dismissed');
    setShowModal(false);
    setMostrarGuiaManual(false);
  };

  if (!showModal) return null;

  return (
    <div 
      className="modal show d-block animate__animated animate__fadeIn" 
      tabIndex={-1} 
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.82)', backdropFilter: 'blur(8px)', zIndex: 99999 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '490px' }}>
        <div 
          className="modal-content border-0 shadow-lg" 
          style={{ 
            borderRadius: '24px', 
            overflow: 'hidden',
            background: '#ffffff'
          }}
        >
          {/* Cabecera Institucional SIGAE con Burbujas 3D */}
          <div 
            className="p-4 text-white text-center position-relative overflow-hidden" 
            style={{ 
              background: 'linear-gradient(135deg, #0066FF 0%, #00C3FF 100%)',
              paddingBottom: '26px'
            }}
          >
            {/* Burbujas 3D Flotantes */}
            <div className="burbuja-3d burbuja-1" style={{ width: '180px', height: '180px', top: '-60px', right: '-40px', opacity: 0.35 }}></div>
            <div className="burbuja-3d burbuja-2" style={{ width: '120px', height: '120px', bottom: '-40px', left: '-20px', opacity: 0.35 }}></div>

            <div className="position-absolute" style={{ top: '15px', right: '15px', zIndex: 10 }}>
              <button 
                type="button" 
                className="btn-close btn-close-white opacity-75 hover-efecto" 
                onClick={handleDismiss}
                aria-label="Cerrar"
              ></button>
            </div>
            
            <div className="position-relative z-1">
              <div 
                className="d-inline-flex align-items-center justify-content-center bg-white p-2 rounded-4 shadow mb-2"
                style={{ width: '76px', height: '76px' }}
              >
                <img 
                  src="./assets/img/icono.png" 
                  alt="SIGAE App" 
                  style={{ width: '60px', height: '60px', objectFit: 'contain' }} 
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="d-flex justify-content-center mb-1">
                <span className="badge bg-white text-primary rounded-pill px-3 py-1 fw-bold shadow-xs small">
                  <i className="bi bi-stars text-warning me-1"></i> {isStandalone ? 'App Instalada' : 'Instalación Oficial'}
                </span>
              </div>
              <h4 className="fw-bolder mb-1 text-white">
                {isStandalone ? 'SIGAE v1.1 en Ejecución' : 'Instalar SIGAE v1.1'}
              </h4>
              <p className="small mb-0 text-white text-opacity-90">
                {isStandalone ? 'Ya estás disfrutando de la versión instalada' : 'Aplicación oficial en tu pantalla o escritorio'}
              </p>
            </div>
          </div>

          {/* Cuerpo */}
          <div className="p-4 pt-3 text-dark">
            {/* Si está dentro de WhatsApp / Instagram */}
            {isInAppBrowser ? (
              <div className="alert alert-warning border-0 rounded-4 p-3 mb-3 small text-dark" style={{ background: '#fef3c7' }}>
                <div className="fw-bold text-warning-emphasis d-flex align-items-center gap-2 mb-2 fs-6">
                  <i className="bi bi-exclamation-triangle-fill fs-5 text-warning"></i> 
                  <span>Estás dentro de WhatsApp / Red Social</span>
                </div>
                <p className="mb-2">
                  Para instalar la aplicación en tu celular, debes abrir el enlace en tu navegador:
                </p>
                <ol className="ps-3 mb-0">
                  <li className="mb-1">Toca los <strong>3 puntos (⋮)</strong> en la esquina superior.</li>
                  <li>Selecciona <strong>"Abrir en Chrome"</strong> (o Safari en iPhone).</li>
                </ol>
              </div>
            ) : isIOS ? (
              /* Caso iPhone / iPad */
              <div className="alert alert-primary border-0 rounded-4 p-3 mb-3 small text-dark" style={{ background: '#eff6ff' }}>
                <div className="fw-bold text-primary d-flex align-items-center gap-2 mb-2 fs-6">
                  <i className="bi bi-apple fs-5"></i> Pasos para instalar en iPhone / iPad (Safari):
                </div>
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-start gap-2">
                    <span className="badge bg-primary rounded-circle px-2 py-1 flex-shrink-0">1</span>
                    <span>Presiona el botón <strong>Compartir</strong> <i className="bi bi-box-arrow-up text-primary fw-bold ms-1"></i> (en la barra de Safari).</span>
                  </div>
                  <div className="d-flex align-items-start gap-2">
                    <span className="badge bg-primary rounded-circle px-2 py-1 flex-shrink-0">2</span>
                    <span>Desliza hacia abajo y toca <strong>"Agregar al inicio"</strong> <i className="bi bi-plus-square text-primary fw-bold ms-1"></i>.</span>
                  </div>
                  <div className="d-flex align-items-start gap-2">
                    <span className="badge bg-primary rounded-circle px-2 py-1 flex-shrink-0">3</span>
                    <span>Pulsa <strong>"Agregar"</strong> arriba a la derecha y listo.</span>
                  </div>
                </div>
              </div>
            ) : isDesktop ? (
              /* Caso Computadora de Escritorio (Windows / Mac / Linux) */
              <div className="d-flex flex-column gap-2 mb-3">
                {isStandalone ? (
                  <div className="alert alert-success border-0 rounded-4 p-3 mb-2 small text-dark" style={{ background: '#dcfce7' }}>
                    <div className="fw-bold text-success d-flex align-items-center gap-2 mb-1 fs-6">
                      <i className="bi bi-check-circle-fill fs-5"></i> ¡SIGAE ya está instalada en tu equipo!
                    </div>
                    <p className="mb-0 text-muted">
                      Esta ventana ya está funcionando como aplicación independiente en tu PC. Puedes anclarla a tu Barra de Tareas o acceder desde el Menú Inicio.
                    </p>
                  </div>
                ) : (
                  <div className="alert alert-primary border-0 rounded-4 p-3 mb-2 small text-dark" style={{ background: '#eff6ff' }}>
                    <div className="fw-bold text-primary d-flex align-items-center gap-2 mb-2 fs-6">
                      <i className="bi bi-pc-display fs-5"></i> Cómo instalar en tu Computadora (PC / Laptop):
                    </div>
                    <div className="d-flex flex-column gap-2.5">
                      <div className="d-flex align-items-start gap-2">
                        <span className="badge bg-primary rounded-circle px-2 py-1 flex-shrink-0">1</span>
                        <span>
                          Mira arriba a la derecha en la <strong>barra de direcciones URL</strong> de tu navegador (donde está el link <code>app-delta-ten-80.vercel.app</code>).
                        </span>
                      </div>
                      <div className="d-flex align-items-start gap-2">
                        <span className="badge bg-primary rounded-circle px-2 py-1 flex-shrink-0">2</span>
                        <span>
                          Haz clic en el icono <strong>[ 🖥️ ⬇️ ]</strong> o <strong>[ ➕ ]</strong> que dice <i>"Instalar SIGAE v1.1"</i> o <i>"Aplicación disponible"</i>.
                        </span>
                      </div>
                      <div className="d-flex align-items-start gap-2">
                        <span className="badge bg-primary rounded-circle px-2 py-1 flex-shrink-0">3</span>
                        <span>
                          (Alternativa): Pulsa los <strong>3 puntos (⋮)</strong> arriba a la derecha &gt; <strong>"Guardar y compartir"</strong> &gt; <strong>"Instalar SIGAE v1.1"</strong>.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {isWindows && !isStandalone && (
                  <div className="p-3 rounded-4 border bg-light d-flex flex-column gap-2">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-windows text-primary fs-5"></i>
                        <span className="fw-bold small text-dark">Acceso directo inmediato en Windows</span>
                      </div>
                      <span className="badge bg-success-subtle text-success border border-success-subtle extra-small">1 Clic</span>
                    </div>
                    <p className="extra-small text-muted mb-1">
                      Si tu navegador no muestra el cartel automático, descarga este acceso directo (.url) y guárdalo en tu Escritorio para abrir SIGAE siempre con 1 clic:
                    </p>
                    <button
                      type="button"
                      onClick={descargarAccesoDirecto}
                      className="btn btn-outline-primary btn-sm rounded-pill fw-bold d-inline-flex align-items-center justify-content-center gap-2 hover-efecto py-2"
                    >
                      <i className="bi bi-download"></i> Descargar Acceso Directo (.url)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Caso Celular Android */
              <div className="d-flex flex-column gap-2 mb-3">
                {(!deferredPrompt || mostrarGuiaManual) && (
                  <div className="alert alert-info border-0 rounded-4 p-3 mb-2 small text-dark" style={{ background: '#e0f2fe' }}>
                    <div className="fw-bold text-primary d-flex align-items-center gap-2 mb-2 fs-6">
                      <i className="bi bi-phone text-primary fs-5"></i> Cómo añadir a tu pantalla de inicio en Android:
                    </div>
                    <div className="d-flex flex-column gap-2">
                      <div className="d-flex align-items-start gap-2">
                        <span className="badge bg-primary rounded-circle px-2 py-1 flex-shrink-0">1</span>
                        <span>Toca los <strong>3 puntos (⋮)</strong> en la esquina superior derecha de tu navegador Chrome.</span>
                      </div>
                      <div className="d-flex align-items-start gap-2">
                        <span className="badge bg-primary rounded-circle px-2 py-1 flex-shrink-0">2</span>
                        <span>Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Añadir a pantalla principal"</strong>.</span>
                      </div>
                      <div className="d-flex align-items-start gap-2">
                        <span className="badge bg-primary rounded-circle px-2 py-1 flex-shrink-0">3</span>
                        <span>Confirma en <strong>"Instalar"</strong> y el icono aparecerá de inmediato en tu celular.</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="d-flex align-items-center gap-3 p-2 rounded-3" style={{ background: 'rgba(0, 102, 255, 0.05)' }}>
                  <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3 flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                    <i className="bi bi-lightning-charge-fill fs-5"></i>
                  </div>
                  <div className="small">
                    <span className="fw-bold text-dark d-block">Acceso con 1 toque</span>
                    <span className="text-muted">Abre directamente desde el icono en tu pantalla como app oficial.</span>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3 p-2 rounded-3" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                  <div className="p-2 bg-success bg-opacity-10 text-success rounded-3 flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                    <i className="bi bi-arrow-repeat fs-5"></i>
                  </div>
                  <div className="small">
                    <span className="fw-bold text-dark d-block">Auto-actualizaciones en vivo</span>
                    <span className="text-muted">Recibe siempre las últimas funciones sin tener que reinstalar.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="d-flex flex-column gap-2 mt-3">
              {deferredPrompt && !isInAppBrowser ? (
                <button 
                  type="button" 
                  className="btn btn-primary rounded-pill py-3 fw-bold fs-6 shadow-sm d-flex align-items-center justify-content-center gap-2 hover-efecto"
                  onClick={handleInstallClick}
                  style={{ background: 'var(--color-primario, #0066FF)', border: 'none' }}
                >
                  <i className="bi bi-download fs-5"></i> Instalar Aplicación Ahora
                </button>
              ) : isWindows && !isStandalone ? (
                <button 
                  type="button" 
                  className="btn btn-primary rounded-pill py-3 fw-bold fs-6 shadow-sm d-flex align-items-center justify-content-center gap-2 hover-efecto"
                  onClick={descargarAccesoDirecto}
                  style={{ background: '#FF8D00', border: 'none' }}
                >
                  <i className="bi bi-box-arrow-down fs-5"></i> Descargar Acceso Directo para Windows (.url)
                </button>
              ) : null}

              <button 
                type="button" 
                className="btn btn-light rounded-pill py-2 fw-semibold text-muted small hover-efecto"
                onClick={handleDismiss}
              >
                {isStandalone ? 'Cerrar' : 'Entendido, continuar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
