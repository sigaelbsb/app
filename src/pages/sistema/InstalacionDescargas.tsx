import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChamiloBreadcrumb, 
  ChamiloHelpCallout, 
  IconoInstalacionDescargas,
  IconoWindowsApp,
  IconoAndroidApp,
  IconoLinuxApp,
  IconoAppleApp,
  IconoQrEscaner
} from '../../components/chamilo';

export const InstalacionDescargas: React.FC = () => {
  const [tabActivo, setTabActivo] = useState<'windows' | 'android' | 'ios' | 'linux' | 'mac'>('windows');
  const [soDetectado, setSoDetectado] = useState<string>('Detectando...');
  const [soTipo, setSoTipo] = useState<'windows' | 'android' | 'ios' | 'linux' | 'mac'>('windows');
  const [mostrarModalQR, setMostrarModalQR] = useState<boolean>(false);

  // Detección automática del sistema operativo del usuario
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('win')) {
      setSoDetectado('Windows 11 / 10 / 8');
      setSoTipo('windows');
      setTabActivo('windows');
    } else if (ua.includes('android')) {
      setSoDetectado('Android Móvil / Tablet');
      setSoTipo('android');
      setTabActivo('android');
    } else if (ua.includes('iphone') || ua.includes('ipad')) {
      setSoDetectado('Apple iOS (iPhone / iPad)');
      setSoTipo('ios');
      setTabActivo('ios');
    } else if (ua.includes('linux')) {
      setSoDetectado('Linux / Canaima GNU');
      setSoTipo('linux');
      setTabActivo('linux');
    } else if (ua.includes('mac')) {
      setSoDetectado('macOS');
      setSoTipo('mac');
      setTabActivo('mac');
    } else {
      setSoDetectado('Navegador Web Multiplataforma');
      setSoTipo('windows');
      setTabActivo('windows');
    }
  }, []);

  // Bloqueo de scroll de fondo y tecla Escape para el modal QR
  useEffect(() => {
    if (mostrarModalQR) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMostrarModalQR(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  }, [mostrarModalQR]);

  const abrirInstaladorPWA = async () => {
    const promptEvent = (window as any).deferredPwaPrompt;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === 'accepted') {
          localStorage.setItem('sigae_pwa_prompt_status', 'installed');
          (window as any).deferredPwaPrompt = null;
          return;
        }
      } catch (err) {
        console.warn('Error al invocar prompt de instalación:', err);
      }
    }
    window.dispatchEvent(new Event('show-pwa-modal'));
  };

  const descargarAccesoDirectoWindows = () => {
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

  // URL Oficial en la Nube
  const URL_PRODUCCION_OFICIAL = 'https://app-delta-ten-80.vercel.app/';
  const escuelaCodigo = localStorage.getItem('sigae_escuela_codigo') || 'sb';
  const logoPath = `/assets/img/logo_${escuelaCodigo}.png`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(URL_PRODUCCION_OFICIAL)}`;

  return (
    <div className="modulo-animado container-fluid px-3 px-md-4 py-3 animate__animated animate__fadeIn">

      {/* MIGAS DE PAN */}
      <ChamiloBreadcrumb
        category="Dirección y Sistema"
        currentModule="Instalación Universal Web App"
      />

      {/* CUADRO DE AYUDA METODOLÓGICA */}
      <ChamiloHelpCallout
        id="ayuda_instalacion_descargas"
        title="Instalación Universal Web de SIGAE v1.1 (Multiplataforma)"
        content="SIGAE funciona con tecnología de Aplicación Web Progresiva (PWA): se instala en 1 clic directamente en tu Escritorio o Pantalla de Inicio en Windows, Android, iPhone, iPad, Linux y Mac, sin descargas pesadas de 500 MB ni archivos corruptos, y con auto-actualizaciones instantáneas en segundo plano."
        icon="bi-phone-fill"
      />

      {/* ── CABECERA PRINCIPAL HERO ── */}
      <div 
        className="tech-card overflow-hidden mb-4 shadow-sm animate__animated animate__fadeInDown"
        style={{
          border: '2px solid #fed7aa',
          borderTop: '6px solid #FF8D00',
          background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 45%, #ffedd5 100%)',
          borderRadius: '26px'
        }}
      >
        <div className="p-3 p-sm-4 p-md-4">
          <div className="row align-items-center g-3 g-md-4">
            
            {/* Ícono de Instalación + Escudo */}
            <div className="col-12 col-md-auto text-center text-md-start">
              <div className="d-inline-flex align-items-center gap-3">
                <div 
                  className="tech-icon-wrapper bg-white shadow-sm d-inline-flex align-items-center justify-content-center p-2 position-relative"
                  style={{ 
                    width: '96px', 
                    height: '96px', 
                    borderRadius: '24px', 
                    border: '2.5px solid #fed7aa',
                    boxShadow: '0 10px 24px rgba(249, 115, 22, 0.15)'
                  }}
                >
                  <IconoInstalacionDescargas size={62} color="#FF8D00" />
                  <span 
                    className="position-absolute badge rounded-pill bg-success border border-white text-white extra-small"
                    style={{ bottom: '-6px', right: '-6px', fontSize: '0.68rem', padding: '3px 7px' }}
                  >
                    PWA v1.1
                  </span>
                </div>
                <div 
                  className="bg-white shadow-xs d-none d-sm-inline-flex align-items-center justify-content-center p-2 rounded-4 border"
                  style={{ width: '68px', height: '68px', borderColor: '#fed7aa' }}
                >
                  <img 
                    src={logoPath} 
                    alt="Escudo Institucional" 
                    className="img-fluid"
                    style={{ maxHeight: '52px', maxWidth: '52px', objectFit: 'contain' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                  />
                </div>
              </div>
            </div>

            {/* Título y Métricas Clave */}
            <div className="col-12 col-md text-center text-md-start">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-2 flex-wrap">
                <span 
                  className="badge text-white fw-bold px-3 py-1.5 rounded-pill shadow-xs d-inline-flex align-items-center gap-1.5"
                  style={{ backgroundColor: '#FF8D00', fontSize: '0.78rem' }}
                >
                  <i className="bi bi-stars"></i>Centro de Instalación Oficial
                </span>

                <div 
                  className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill bg-white border shadow-xs"
                  style={{ borderColor: '#fed7aa' }}
                >
                  <span className="status-beacon-live" style={{ color: '#ea580c' }}></span>
                  <span 
                    className="extra-small fw-bold" 
                    style={{ fontSize: '0.72rem', color: '#c2410c' }}
                  >
                    Tu Equipo: <b>{soDetectado}</b>
                  </span>
                </div>

                <a 
                  href={URL_PRODUCCION_OFICIAL} 
                  target="_blank" 
                  rel="noreferrer"
                  className="badge bg-primary text-white border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs text-decoration-none hover-efecto" 
                  style={{ borderColor: '#93c5fd' }}
                  title="Abrir web oficial en producción"
                >
                  <i className="bi bi-globe me-1"></i>Web Oficial: <b>app-delta-ten-80.vercel.app</b>
                </a>
              </div>

              <h1 className="fw-bolder mb-1 text-dark fs-3 fs-md-2" style={{ letterSpacing: '-0.5px' }}>
                Instalación Universal de SIGAE
              </h1>

              <p className="mb-0 text-muted small" style={{ maxWidth: '820px' }}>
                Instala SIGAE en 1 clic en tu computadora, teléfono o tablet. Funciona en su propia ventana independiente, sin descargas pesadas, sin consumir espacio y con auto-actualizaciones instantáneas.
              </p>
            </div>

            {/* Acciones Principales (ÚNICAS Y CENTRALIZADAS) */}
            <div className="col-12 col-md-auto text-md-end text-center">
              <div className="d-flex align-items-center justify-content-center justify-content-md-end gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={abrirInstaladorPWA}
                  className="btn btn-primary rounded-pill px-4 py-2.5 fw-bold shadow-sm d-inline-flex align-items-center justify-content-center gap-2 hover-efecto"
                  style={{ backgroundColor: '#FF8D00', borderColor: '#FF8D00', fontSize: '0.94rem' }}
                >
                  <i className="bi bi-download fs-5"></i>
                  <span>Instalar en {soTipo === 'windows' ? 'Windows' : soTipo === 'android' ? 'Android' : soTipo === 'ios' ? 'iPhone' : 'este Equipo'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMostrarModalQR(true)}
                  className="btn btn-white bg-white text-dark rounded-pill px-3.5 py-2.5 fw-bold d-inline-flex align-items-center justify-content-center gap-1.5 hover-efecto shadow-xs border"
                  style={{ borderColor: '#fed7aa', fontSize: '0.88rem' }}
                  title="Abrir código QR para escanear con la cámara del celular"
                >
                  <i className="bi bi-qr-code-scan text-primary"></i>
                  <span>Escanear QR Móvil</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── SELECTOR DE SISTEMAS OPERATIVOS (GUÍAS PASO A PASO) ── */}
      <div className="row g-2.5 mb-4">
        
        {/* WINDOWS */}
        <div className="col-6 col-md">
          <button
            type="button"
            onClick={() => setTabActivo('windows')}
            className={`btn w-100 p-2.5 rounded-4 fw-bold shadow-xs d-flex align-items-center gap-2 border-0 transition-all text-start download-platform-tab ${
              tabActivo === 'windows' ? 'active-windows' : ''
            }`}
          >
            <div className="p-1 bg-white bg-opacity-75 rounded-3 shadow-xs d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
              <IconoWindowsApp size={26} />
            </div>
            <div className="overflow-hidden">
              <span className="text-truncate small d-block">Windows</span>
              <small className={tabActivo === 'windows' ? 'text-white-50' : 'text-muted'} style={{ fontSize: '0.68rem' }}>
                11 / 10 / 8
              </small>
            </div>
          </button>
        </div>

        {/* ANDROID */}
        <div className="col-6 col-md">
          <button
            type="button"
            onClick={() => setTabActivo('android')}
            className={`btn w-100 p-2.5 rounded-4 fw-bold shadow-xs d-flex align-items-center gap-2 border-0 transition-all text-start download-platform-tab ${
              tabActivo === 'android' ? 'active-android' : ''
            }`}
          >
            <div className="p-1 bg-white bg-opacity-75 rounded-3 shadow-xs d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
              <IconoAndroidApp size={26} />
            </div>
            <div className="overflow-hidden">
              <span className="text-truncate small d-block">Android</span>
              <small className={tabActivo === 'android' ? 'text-white-50' : 'text-muted'} style={{ fontSize: '0.68rem' }}>
                Móvil y Tablet
              </small>
            </div>
          </button>
        </div>

        {/* APPLE IOS */}
        <div className="col-6 col-md">
          <button
            type="button"
            onClick={() => setTabActivo('ios')}
            className={`btn w-100 p-2.5 rounded-4 fw-bold shadow-xs d-flex align-items-center gap-2 border-0 transition-all text-start download-platform-tab ${
              tabActivo === 'ios' ? 'active-pwa' : ''
            }`}
          >
            <div className="p-1 bg-white bg-opacity-75 rounded-3 shadow-xs d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
              <IconoAppleApp size={26} />
            </div>
            <div className="overflow-hidden">
              <span className="text-truncate small d-block">iPhone / iPad</span>
              <small className={tabActivo === 'ios' ? 'text-white-50' : 'text-muted'} style={{ fontSize: '0.68rem' }}>
                Apple Safari
              </small>
            </div>
          </button>
        </div>

        {/* LINUX / CANAIMA */}
        <div className="col-6 col-md">
          <button
            type="button"
            onClick={() => setTabActivo('linux')}
            className={`btn w-100 p-2.5 rounded-4 fw-bold shadow-xs d-flex align-items-center gap-2 border-0 transition-all text-start download-platform-tab ${
              tabActivo === 'linux' ? 'active-linux' : ''
            }`}
          >
            <div className="p-1 bg-white bg-opacity-75 rounded-3 shadow-xs d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
              <IconoLinuxApp size={26} />
            </div>
            <div className="overflow-hidden">
              <span className="text-truncate small d-block">Linux / Canaima</span>
              <small className={tabActivo === 'linux' ? 'text-white-50' : 'text-muted'} style={{ fontSize: '0.68rem' }}>
                Ubuntu / Debian
              </small>
            </div>
          </button>
        </div>

        {/* MACOS */}
        <div className="col-12 col-md">
          <button
            type="button"
            onClick={() => setTabActivo('mac')}
            className={`btn w-100 p-2.5 rounded-4 fw-bold shadow-xs d-flex align-items-center gap-2 border-0 transition-all text-start download-platform-tab ${
              tabActivo === 'mac' ? 'active-pwa' : ''
            }`}
          >
            <div className="p-1 bg-white bg-opacity-75 rounded-3 shadow-xs d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
              <i className="bi bi-display fs-5 text-secondary"></i>
            </div>
            <div className="overflow-hidden">
              <span className="text-truncate small d-block">macOS</span>
              <small className={tabActivo === 'mac' ? 'text-white-50' : 'text-muted'} style={{ fontSize: '0.68rem' }}>
                MacBook e iMac
              </small>
            </div>
          </button>
        </div>

      </div>

      {/* ── CONTENEDOR DINÁMICO DE GUÍA DE INSTALACIÓN SEGÚN PESTAÑA ── */}
      <div className="card border-0 rounded-4 shadow-sm p-4 p-md-5 mb-4 bg-white">
        
        {/* GUÍA WINDOWS */}
        {tabActivo === 'windows' && (
          <div className="animate__animated animate__fadeIn">
            <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
              <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-4 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                <IconoWindowsApp size={40} />
              </div>
              <div>
                <h4 className="fw-bolder mb-1 text-dark">Cómo Instalar SIGAE en Windows</h4>
                <p className="text-muted small mb-0">Compatible con Microsoft Edge, Google Chrome, Brave u Opera en Windows 11 y Windows 10.</p>
              </div>
            </div>

            <div className="row g-4 align-items-center">
              <div className="col-lg-7">
                <div className="d-flex flex-column gap-3.5">
                  <div className="d-flex gap-3 align-items-start">
                    <span className="badge bg-primary text-white rounded-circle p-2 fs-6 d-flex align-items-center justify-content-center shadow-xs" style={{ width: '36px', height: '36px' }}>1</span>
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">Presiona el botón de instalación</h6>
                      <p className="text-muted small mb-0">
                        Haz clic en el botón azul <b>"Instalar en este Dispositivo"</b> de abajo o pulsa el icono de pantalla con flecha en la barra de direcciones de tu navegador.
                      </p>
                    </div>
                  </div>

                  <div className="d-flex gap-3 align-items-start">
                    <span className="badge bg-primary text-white rounded-circle p-2 fs-6 d-flex align-items-center justify-content-center shadow-xs" style={{ width: '36px', height: '36px' }}>2</span>
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">Confirma la instalación</h6>
                      <p className="text-muted small mb-0">
                        El navegador mostrará un mensaje confirmando: <i>"¿Instalar SIGAE v1.1?"</i>. Pulsa <b>"Instalar"</b>.
                      </p>
                    </div>
                  </div>

                  <div className="d-flex gap-3 align-items-start">
                    <span className="badge bg-primary text-white rounded-circle p-2 fs-6 d-flex align-items-center justify-content-center shadow-xs" style={{ width: '36px', height: '36px' }}>3</span>
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">¡Listo! Acceso directo en tu Escritorio</h6>
                      <p className="text-muted small mb-0">
                        SIGAE se abrirá en su propia ventana independiente, sin barra de direcciones, y tendrás el icono oficial en tu Escritorio y en el Menú Inicio de Windows.
                      </p>
                    </div>
                  </div>
                </div>

                {/* OPCIÓN RÁPIDA DE ACCESO DIRECTO (.URL) */}
                <div className="mt-4 p-3 rounded-4 border bg-light d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2.5">
                  <div>
                    <span className="fw-bold small text-dark d-block">
                      <i className="bi bi-windows text-primary me-1.5"></i>¿Deseas el archivo de acceso directo para tu Escritorio?
                    </span>
                    <span className="text-muted extra-small">
                      Descarga este archivo oficial de 1 KB para abrir SIGAE siempre con doble clic sin pasar por el navegador.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={descargarAccesoDirectoWindows}
                    className="btn btn-outline-primary btn-sm rounded-pill fw-bold d-inline-flex align-items-center gap-1.5 flex-shrink-0"
                  >
                    <i className="bi bi-download"></i>
                    <span>Descargar .url</span>
                  </button>
                </div>

                {/* NOTA ACLARATORIA DE INSTALACIÓN EN PC */}
                <div className="mt-3 p-3 rounded-4 border-0 small" style={{ background: '#f1f5f9' }}>
                  <div className="fw-bold text-dark d-flex align-items-center gap-2 mb-1">
                    <i className="bi bi-info-circle-fill text-primary"></i>
                    <span>¿Por qué tu navegador puede no abrir la ventana de instalación?</span>
                  </div>
                  <ul className="text-muted extra-small mb-0 ps-3">
                    <li className="mb-0.5"><b>En Google Chrome / Edge:</b> El icono oficial de instalación está en la <b>barra de direcciones URL arriba a la derecha</b>: haz clic en el icono <code>[ 🖥️ ⬇️ ]</code> o <code>[ ➕ ]</code> para instalarla.</li>
                    <li className="mb-0.5"><b>Si ya la tienes instalada:</b> Tu navegador oculta el instalador porque la app ya existe en tu Escritorio o Menú Inicio.</li>
                    <li><b>Si no aparece:</b> Puedes usar el botón <i>«Descargar .url»</i> de arriba para tener el icono en tu Escritorio de inmediato.</li>
                  </ul>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="p-4 rounded-4 bg-light border text-center">
                  <i className="bi bi-shield-check text-success fs-1 mb-2 d-block"></i>
                  <h6 className="fw-bold text-dark">Ventajas en Windows:</h6>
                  <div className="text-muted small text-start mt-3 d-flex flex-column gap-2">
                    <div><i className="bi bi-check-circle-fill text-success me-1.5"></i><b>0 Megabytes descargados:</b> No satura tu disco duro.</div>
                    <div><i className="bi bi-check-circle-fill text-success me-1.5"></i><b>Sin SmartScreen ni bloqueos:</b> Certificado seguro por el navegador.</div>
                    <div><i className="bi bi-check-circle-fill text-success me-1.5"></i><b>Auto-actualización:</b> Siempre en la última versión estable.</div>
                    <div><i className="bi bi-check-circle-fill text-success me-1.5"></i><b>Cámara y escaneo habilitado:</b> Para validar carnets y constancias.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GUÍA ANDROID */}
        {tabActivo === 'android' && (
          <div className="animate__animated animate__fadeIn">
            <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
              <div className="p-3 bg-success bg-opacity-10 text-success rounded-4 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                <IconoAndroidApp size={40} />
              </div>
              <div>
                <h4 className="fw-bolder mb-1 text-dark">Cómo Instalar SIGAE en Android</h4>
                <p className="text-muted small mb-0">Para celulares y tablets Samsung, Xiaomi, Motorola, Huawei, etc.</p>
              </div>
            </div>

            <div className="row g-4 align-items-center">
              <div className="col-lg-7">
                <div className="d-flex flex-column gap-3.5">
                  <div className="d-flex gap-3 align-items-start">
                    <span className="badge bg-success text-white rounded-circle p-2 fs-6 d-flex align-items-center justify-content-center shadow-xs" style={{ width: '36px', height: '36px' }}>1</span>
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">Abre la página o escanea el QR</h6>
                      <p className="text-muted small mb-0">
                        Entra en Google Chrome en tu celular a <b>app-delta-ten-80.vercel.app</b> o apunta la cámara al código QR de la pantalla.
                      </p>
                    </div>
                  </div>

                  <div className="d-flex gap-3 align-items-start">
                    <span className="badge bg-success text-white rounded-circle p-2 fs-6 d-flex align-items-center justify-content-center shadow-xs" style={{ width: '36px', height: '36px' }}>2</span>
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">Presiona "Instalar en Celular"</h6>
                      <p className="text-muted small mb-0">
                        Pulsa el botón de instalación o presiona los 3 puntos del navegador y elige <b>"Instalar aplicación"</b> o <b>"Agregar a pantalla principal"</b>.
                      </p>
                    </div>
                  </div>

                  <div className="d-flex gap-3 align-items-start">
                    <span className="badge bg-success text-white rounded-circle p-2 fs-6 d-flex align-items-center justify-content-center shadow-xs" style={{ width: '36px', height: '36px' }}>3</span>
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">Accede desde tus aplicaciones</h6>
                      <p className="text-muted small mb-0">
                        El icono oficial de SIGAE aparecerá junto a tus demás aplicaciones nativas con inicio en pantalla completa.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setMostrarModalQR(true)}
                    className="btn btn-outline-success btn-sm rounded-pill fw-bold shadow-xs d-inline-flex align-items-center gap-1.5 hover-efecto"
                  >
                    <i className="bi bi-qr-code-scan"></i>
                    <span>Escanear Código QR con tu Teléfono</span>
                  </button>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="p-4 rounded-4 bg-light border text-center">
                  <i className="bi bi-phone-vibrate text-success fs-1 mb-2 d-block"></i>
                  <h6 className="fw-bold text-dark">Beneficios en tu Celular:</h6>
                  <div className="text-muted small text-start mt-3 d-flex flex-column gap-2">
                    <div><i className="bi bi-check-circle-fill text-success me-1.5"></i><b>Sin tiendas de apps:</b> No necesitas Play Store ni cuentas de Google.</div>
                    <div><i className="bi bi-check-circle-fill text-success me-1.5"></i><b>Sin permisos peligrosos:</b> Seguridad y privacidad total.</div>
                    <div><i className="bi bi-check-circle-fill text-success me-1.5"></i><b>Lectura QR instantánea:</b> Tu cámara lee códigos QR en vivo.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GUÍA APPLE IOS */}
        {tabActivo === 'ios' && (
          <div className="animate__animated animate__fadeIn">
            <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
              <div className="p-3 bg-info bg-opacity-10 text-primary rounded-4 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                <IconoAppleApp size={40} />
              </div>
              <div>
                <h4 className="fw-bolder mb-1 text-dark">Cómo Instalar SIGAE en iPhone y iPad</h4>
                <p className="text-muted small mb-0">Instalación directa oficial mediante Safari (iOS 14 en adelante).</p>
              </div>
            </div>

            <div className="row g-4 align-items-center">
              <div className="col-lg-7">
                <div className="d-flex flex-column gap-3.5">
                  <div className="d-flex gap-3 align-items-start">
                    <span className="badge bg-primary text-white rounded-circle p-2 fs-6 d-flex align-items-center justify-content-center shadow-xs" style={{ width: '36px', height: '36px', backgroundColor: '#4f46e5' }}>1</span>
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">Abre la web en Safari</h6>
                      <p className="text-muted small mb-0">
                        En tu iPhone o iPad, abre la aplicación <b>Safari</b> e ingresa a <b>app-delta-ten-80.vercel.app</b>.
                      </p>
                    </div>
                  </div>

                  <div className="d-flex gap-3 align-items-start">
                    <span className="badge bg-primary text-white rounded-circle p-2 fs-6 d-flex align-items-center justify-content-center shadow-xs" style={{ width: '36px', height: '36px', backgroundColor: '#4f46e5' }}>2</span>
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">Toca el botón Compartir</h6>
                      <p className="text-muted small mb-0">
                        Pulsa el icono de <b>Compartir</b> en la barra de Safari (el cuadrado con una flecha hacia arriba <i className="bi bi-box-arrow-up"></i>).
                      </p>
                    </div>
                  </div>

                  <div className="d-flex gap-3 align-items-start">
                    <span className="badge bg-primary text-white rounded-circle p-2 fs-6 d-flex align-items-center justify-content-center shadow-xs" style={{ width: '36px', height: '36px', backgroundColor: '#4f46e5' }}>3</span>
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">Selecciona "Agregar a pantalla de inicio"</h6>
                      <p className="text-muted small mb-0">
                        Baja en el menú y toca <b>"Agregar a pantalla de inicio"</b> (<i className="bi bi-plus-square"></i>), luego pulsa <b>"Agregar"</b> en la esquina superior derecha.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setMostrarModalQR(true)}
                    className="btn btn-outline-primary btn-sm rounded-pill fw-bold shadow-xs d-inline-flex align-items-center gap-1.5 hover-efecto"
                    style={{ borderColor: '#4f46e5', color: '#4f46e5' }}
                  >
                    <i className="bi bi-qr-code-scan"></i>
                    <span>Escanear QR con tu iPhone</span>
                  </button>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="p-4 rounded-4 bg-light border text-center">
                  <i className="bi bi-apple fs-1 mb-2 d-block text-dark"></i>
                  <h6 className="fw-bold text-dark">Experiencia Nativa en Apple:</h6>
                  <div className="text-muted small text-start mt-3 d-flex flex-column gap-2">
                    <div><i className="bi bi-check-circle-fill text-success me-1.5"></i><b>Sin App Store:</b> Instalación oficial libre de restricciones.</div>
                    <div><i className="bi bi-check-circle-fill text-success me-1.5"></i><b>Icono Retina HD:</b> En tu pantalla junto a tus demás aplicaciones.</div>
                    <div><i className="bi bi-check-circle-fill text-success me-1.5"></i><b>Modo Pantalla Completa:</b> Sin barras de Safari.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GUÍA LINUX / CANAIMA */}
        {tabActivo === 'linux' && (
          <div className="animate__animated animate__fadeIn">
            <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
              <div className="p-3 bg-dark bg-opacity-10 text-dark rounded-4 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                <IconoLinuxApp size={40} />
              </div>
              <div>
                <h4 className="fw-bolder mb-1 text-dark">Cómo Instalar SIGAE en Linux y Canaima</h4>
                <p className="text-muted small mb-0">Compatible con Canaima GNU/Linux, Ubuntu, Debian, Fedora y derivados.</p>
              </div>
            </div>

            <div className="row g-4 align-items-center">
              <div className="col-lg-7">
                <div className="d-flex flex-column gap-3.5">
                  <div className="d-flex gap-3 align-items-start">
                    <span className="badge bg-dark text-white rounded-circle p-2 fs-6 d-flex align-items-center justify-content-center shadow-xs" style={{ width: '36px', height: '36px' }}>1</span>
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">Abre en tu navegador de Linux</h6>
                      <p className="text-muted small mb-0">
                        En Google Chrome, Chromium, Brave o Firefox, ingresa a <b>app-delta-ten-80.vercel.app</b>.
                      </p>
                    </div>
                  </div>

                  <div className="d-flex gap-3 align-items-start">
                    <span className="badge bg-dark text-white rounded-circle p-2 fs-6 d-flex align-items-center justify-content-center shadow-xs" style={{ width: '36px', height: '36px' }}>2</span>
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">Haz clic en Instalar Aplicación</h6>
                      <p className="text-muted small mb-0">
                        Pulsa el icono de instalación en la barra de direcciones o el botón superior para añadir SIGAE al sistema.
                      </p>
                    </div>
                  </div>

                  <div className="d-flex gap-3 align-items-start">
                    <span className="badge bg-dark text-white rounded-circle p-2 fs-6 d-flex align-items-center justify-content-center shadow-xs" style={{ width: '36px', height: '36px' }}>3</span>
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">Integración con el menú de Canaima</h6>
                      <p className="text-muted small mb-0">
                        Se creará el lanzador en tu menú de aplicaciones (Educación / Oficina) y en el escritorio sin necesidad de terminal ni <code>sudo</code>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="p-4 rounded-4 bg-light border text-center">
                  <i className="bi bi-terminal text-dark fs-1 mb-2 d-block"></i>
                  <h6 className="fw-bold text-dark">Ventajas en Canaima y Linux:</h6>
                  <div className="text-muted small text-start mt-3 d-flex flex-column gap-2">
                    <div><i className="bi bi-check-circle-fill text-success me-1.5"></i><b>Sin dependencias rotas:</b> Funciona de inmediato sin instalar librerías.</div>
                    <div><i className="bi bi-check-circle-fill text-success me-1.5"></i><b>Sin permisos root:</b> No altera el sistema operativo base.</div>
                    <div><i className="bi bi-check-circle-fill text-success me-1.5"></i><b>Rendimiento ligero:</b> Ideal para computadoras portátiles Canaima.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GUÍA MACOS */}
        {tabActivo === 'mac' && (
          <div className="animate__animated animate__fadeIn">
            <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
              <div className="p-3 bg-secondary bg-opacity-10 text-dark rounded-4 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                <i className="bi bi-laptop fs-2"></i>
              </div>
              <div>
                <h4 className="fw-bolder mb-1 text-dark">Cómo Instalar SIGAE en macOS</h4>
                <p className="text-muted small mb-0">Para computadoras MacBook, Mac Mini, iMac y Mac Studio con procesadores Apple Silicon o Intel.</p>
              </div>
            </div>

            <div className="row g-4 align-items-center">
              <div className="col-lg-7">
                <div className="d-flex flex-column gap-3.5">
                  <div className="d-flex gap-3 align-items-start">
                    <span className="badge bg-secondary text-white rounded-circle p-2 fs-6 d-flex align-items-center justify-content-center shadow-xs" style={{ width: '36px', height: '36px' }}>1</span>
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">En Safari (macOS Sonoma en adelante)</h6>
                      <p className="text-muted small mb-0">
                        Haz clic en el menú <b>Archivo</b> en la barra superior de tu Mac y selecciona <b>"Agregar al Dock..."</b>.
                      </p>
                    </div>
                  </div>

                  <div className="d-flex gap-3 align-items-start">
                    <span className="badge bg-secondary text-white rounded-circle p-2 fs-6 d-flex align-items-center justify-content-center shadow-xs" style={{ width: '36px', height: '36px' }}>2</span>
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">En Google Chrome / Edge para Mac</h6>
                      <p className="text-muted small mb-0">
                        Haz clic en el botón superior o presiona el icono de instalación en la barra de direcciones para agregarlo a tu carpeta de <b>Aplicaciones</b>.
                      </p>
                    </div>
                  </div>

                  <div className="d-flex gap-3 align-items-start">
                    <span className="badge bg-secondary text-white rounded-circle p-2 fs-6 d-flex align-items-center justify-content-center shadow-xs" style={{ width: '36px', height: '36px' }}>3</span>
                    <div>
                      <h6 className="fw-bold mb-1 text-dark">Apertura como App de Mac</h6>
                      <p className="text-muted small mb-0">
                        Quedará guardada en tu Dock y en Spotlight como cualquier aplicación oficial de tu Mac.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="p-4 rounded-4 bg-light border text-center">
                  <i className="bi bi-command fs-1 mb-2 d-block text-secondary"></i>
                  <h6 className="fw-bold text-dark">Integración con macOS:</h6>
                  <div className="text-muted small text-start mt-3 d-flex flex-column gap-2">
                    <div><i className="bi bi-check-circle-fill text-success me-1.5"></i><b>Ubicada en /Applications:</b> Se abre con Spotlight (Cmd + Espacio).</div>
                    <div><i className="bi bi-check-circle-fill text-success me-1.5"></i><b>Sin descargas pesadas:</b> Inicio instantáneo.</div>
                    <div><i className="bi bi-check-circle-fill text-success me-1.5"></i><b>Modo oscuro y soporte de gestos:</b> Diseñada para Trackpad y Magic Mouse.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── CUADRO RESUMEN DE VENTAJAS UNIVERSALES DE LA PWA ── */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 rounded-4 p-3 shadow-2xs h-100 bg-white">
            <div className="d-flex align-items-center gap-2.5 mb-2">
              <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3">
                <i className="bi bi-lightning-charge-fill fs-5"></i>
              </div>
              <h6 className="fw-bold mb-0 text-dark">0 MB Descargados</h6>
            </div>
            <p className="text-muted extra-small mb-0">
              No esperas por descargas pesadas de 500 MB ni ocupas la memoria de tu equipo. Se instala en 2 segundos.
            </p>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 rounded-4 p-3 shadow-2xs h-100 bg-white">
            <div className="d-flex align-items-center gap-2.5 mb-2">
              <div className="p-2 bg-success bg-opacity-10 text-success rounded-3">
                <i className="bi bi-arrow-repeat fs-5"></i>
              </div>
              <h6 className="fw-bold mb-0 text-dark">Siempre Actualizada</h6>
            </div>
            <p className="text-muted extra-small mb-0">
              Cualquier mejora o actualización del sistema se refleja de inmediato sin que tengas que reinstalar nada.
            </p>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 rounded-4 p-3 shadow-2xs h-100 bg-white">
            <div className="d-flex align-items-center gap-2.5 mb-2">
              <div className="p-2 bg-info bg-opacity-10 text-info rounded-3">
                <i className="bi bi-camera-fill fs-5"></i>
              </div>
              <h6 className="fw-bold mb-0 text-dark">Acceso a Hardware</h6>
            </div>
            <p className="text-muted extra-small mb-0">
              Acceso nativo a tu cámara para escanear carnets estudiantiles y generación de constancias oficiales en PDF.
            </p>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 rounded-4 p-3 shadow-2xs h-100 bg-white">
            <div className="d-flex align-items-center gap-2.5 mb-2">
              <div className="p-2 bg-warning bg-opacity-10 text-warning rounded-3">
                <i className="bi bi-shield-lock-fill fs-5"></i>
              </div>
              <h6 className="fw-bold mb-0 text-dark">Seguridad Máxima</h6>
            </div>
            <p className="text-muted extra-small mb-0">
              Aislada en el entorno seguro de tu navegador, sin virus, sin adware y sin alterar los archivos de tu sistema operativo.
            </p>
          </div>
        </div>
      </div>

      {/* ── MODAL INTERACTIVO DE CÓDIGO QR PARA CELULARES Y TABLETS (PORTAL EN BODY) ── */}
      {mostrarModalQR && createPortal(
        <div 
          className="modal fade show d-flex align-items-center justify-content-center" 
          tabIndex={-1} 
          role="dialog"
          aria-modal="true"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.75)', 
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 99999,
            margin: 0,
            padding: '1rem',
            overflowY: 'auto'
          }}
          onClick={() => setMostrarModalQR(false)}
        >
          <div 
            className="modal-dialog modal-dialog-centered my-auto"
            style={{ maxWidth: '440px', width: '100%', margin: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden animate__animated animate__zoomIn animate__faster">
              <div className="modal-header bg-gradient text-white p-3 border-0" style={{ background: 'linear-gradient(135deg, #FF8D00 0%, #ea580c 100%)' }}>
                <div className="d-flex align-items-center gap-2">
                  <IconoQrEscaner size={26} color="#ffffff" />
                  <h6 className="modal-title fw-bold text-white mb-0">Escanear para Instalar en Móvil</h6>
                </div>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setMostrarModalQR(false)}
                ></button>
              </div>

              <div className="modal-body p-4 text-center">
                <p className="text-muted small mb-3">
                  Apunta la cámara de tu teléfono móvil o tablet a este código QR para abrir o instalar SIGAE v1.1 directamente:
                </p>

                <div 
                  className="p-3 bg-white border rounded-4 d-inline-block shadow-sm mb-3 position-relative"
                  style={{ border: '2px dashed #FF8D00' }}
                >
                  <img 
                    src={qrCodeUrl} 
                    alt="Código QR de SIGAE v1.1" 
                    className="img-fluid rounded-3"
                    style={{ width: '220px', height: '220px' }}
                  />
                  <div className="position-absolute top-50 start-50 translate-middle bg-white p-1 rounded-circle shadow-xs border">
                    <img 
                      src={logoPath} 
                      alt="Logo" 
                      style={{ width: '36px', height: '36px', objectFit: 'contain' }}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                    />
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-center gap-2 text-dark fw-bold small mb-2 flex-wrap">
                  <span className="badge bg-success rounded-pill px-2.5 py-1">v1.1 Oficial</span>
                  <a href={URL_PRODUCCION_OFICIAL} target="_blank" rel="noreferrer" className="text-primary text-decoration-none fw-bold">
                    {URL_PRODUCCION_OFICIAL} <i className="bi bi-box-arrow-up-right extra-small"></i>
                  </a>
                </div>

                <p className="text-muted extra-small mb-0">
                  Compatible con la cámara de cualquier celular Android, iPhone o iPad para abrir la app al instante.
                </p>
              </div>

              <div className="modal-footer bg-light p-3 border-0 justify-content-center">
                <button 
                  type="button" 
                  className="btn btn-secondary rounded-pill px-4 btn-sm fw-bold" 
                  onClick={() => setMostrarModalQR(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default InstalacionDescargas;
