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
  const [versionDetectada, setVersionDetectada] = useState<string>('1.1');

  useEffect(() => {
    // 0. Detectar versión previa en caché o almacenamiento local
    let ver = localStorage.getItem('sigae_version_instalada') || 
              localStorage.getItem('sigae_app_version');
    
    if (!ver) {
      // Verificar si hay registros de versiones previas en caché del navegador
      const buildCached = localStorage.getItem('sigae_cached_build_version') || '';
      if (buildCached.includes('v1.0') || buildCached.includes('1.0')) {
        ver = '1.0';
      } else if (buildCached.includes('v2.0') || buildCached.includes('2.0')) {
        ver = '2.0';
      } else if (buildCached.includes('v1.3') || buildCached.includes('1.3')) {
        ver = '1.3';
      } else {
        const tieneHistorialPrevio = localStorage.getItem('sigae_recordar_identificador') || localStorage.getItem('usuario_sigae');
        ver = tieneHistorialPrevio ? '1.1' : '1.3';
      }
    }
    setVersionDetectada(ver);

    // Si ya está comprobado en 1.3 y no hay necesidad de actualización, no molestar con el aviso
    const yaEstaEn1_3 = ver === '1.3' && localStorage.getItem('sigae_version_instalada') === '1.3';

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
      
      const promptStatus = localStorage.getItem('sigae_pwa_prompt_v1_3_status');
      if (!promptStatus) {
        setTimeout(() => setShowModal(true), 1200);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Si ya está en versión anterior o desactualizada, consultar versión almacenada
    if (!yaEstaEn1_3 && !localStorage.getItem('sigae_pwa_prompt_v1_3_status')) {
      // Notificar proactivamente para actualizar a la 1.3
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }

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
    a.download = 'SIGAE_v1.3_Escritorio.url';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDismiss = () => {
    localStorage.setItem('sigae_pwa_prompt_v1_3_status', 'dismissed');
    setShowModal(false);
    setMostrarGuiaManual(false);
  };

  if (!showModal) return null;

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate__animated animate__fadeIn"
    >
      <div 
        className="relative w-full max-w-[480px] rounded-3xl overflow-hidden bg-white/95 backdrop-blur-xl border border-cyan-200/90 shadow-[0_20px_60px_-15px_rgba(0,188,212,0.35)] text-slate-800"
      >
        {/* Cabecera Estilo EdTech SIGAE con degradado Cian/Azul y burbujas suaves */}
        <div 
          className="p-5 pb-6 text-white text-center relative overflow-hidden bg-gradient-to-r from-[#00bcd4] via-[#0288d1] to-[#01579b]"
        >
          {/* Luces y Reflejos 3D Suaves */}
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-white/15 blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-cyan-300/20 blur-lg pointer-events-none" />

          <button 
            type="button" 
            className="absolute top-3.5 right-3.5 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer" 
            onClick={handleDismiss}
            aria-label="Cerrar"
          >
            ✕
          </button>
          
          <div className="relative z-10 flex flex-col items-center">
            {/* Contenedor del Icono Oficial con Fondo Blanco y Borde Cian 3D */}
            <div 
              className="w-20 h-20 bg-white rounded-2xl p-2.5 shadow-xl flex items-center justify-center mb-2.5 ring-4 ring-cyan-200/50"
            >
              <img 
                src="/assets/img/icono.png" 
                alt="SIGAE App" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/img/sigae.png';
                }}
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-[11px] font-black uppercase tracking-wider mb-1.5 border border-white/25">
              <span>Actualización Obligatoria</span>
              <span className="bg-amber-400 text-slate-900 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold">v1.3</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-xs">
              Nueva Versión SIGAE v1.3
            </h3>
            <p className="text-xs text-cyan-50 font-medium mt-1">
              Ingresando con: <span className="underline font-bold text-amber-300">Versión {versionDetectada}</span> &bull; Actualizar a: <span className="font-bold text-white">Versión 1.3</span>
            </p>
          </div>
        </div>

        {/* Cuerpo del Diálogo */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Bloque Destacado de Desinstalación Previa */}
          <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 flex flex-col gap-1.5 shadow-2xs">
            <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-amber-800">
              <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-xs shrink-0 font-bold">!</span>
              <span>Paso 1 Obligatorio: Eliminar icono de v{versionDetectada}</span>
            </div>
            <p className="text-[11.5px] leading-relaxed text-amber-900/90 font-medium">
              Tu equipo tiene registrado un acceso con la versión anterior. Debes <strong>desinstalar o borrar el icono viejo</strong> de tu pantalla o escritorio para evitar que se quede guardada la versión previa y poder instalar la nueva <strong>Versión 1.3</strong>.
            </p>
          </div>

          {/* Guía según la plataforma */}
          {isInAppBrowser ? (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <span>⚠️ Estás dentro del navegador de una red social</span>
              </p>
              <p>Para instalar la app limpia en tu teléfono:</p>
              <ol className="list-decimal list-inside space-y-1 font-medium">
                <li>Toca los <strong>3 puntos (⋮)</strong> en la esquina superior.</li>
                <li>Selecciona <strong>"Abrir en Chrome"</strong> (o Safari en iPhone).</li>
              </ol>
            </div>
          ) : isIOS ? (
            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-950 space-y-2">
              <p className="font-bold text-sky-900">Pasos en iPhone / iPad (Safari):</p>
              <div className="space-y-1.5 font-medium">
                <p>1. Presiona el botón <strong>Compartir</strong> (icono de cuadrado con flecha arriba).</p>
                <p>2. Desliza hacia abajo y toca <strong>"Agregar al inicio"</strong>.</p>
                <p>3. Pulsa <strong>"Agregar"</strong> arriba a la derecha.</p>
              </div>
            </div>
          ) : isDesktop ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-cyan-200 text-xs text-slate-800 space-y-2">
                <p className="font-bold text-cyan-900 text-sm">Cómo instalar en tu Computadora (PC / Laptop):</p>
                <div className="space-y-1.5 font-medium text-[11.5px]">
                  <p>1. Mira arriba a la derecha en la <strong>barra de direcciones URL</strong> del navegador.</p>
                  <p>2. Haz clic en el icono <strong>[ 🖥️ ⬇️ ]</strong> o <strong>[ ➕ ]</strong> que dice <i>"Instalar SIGAE v1.3"</i>.</p>
                  <p>3. (Alternativa): Pulsa <strong>(⋮)</strong> &gt; <strong>"Guardar y compartir"</strong> &gt; <strong>"Instalar SIGAE v1.3"</strong>.</p>
                </div>
              </div>

              {isWindows && !isStandalone && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">Acceso Directo Windows (.url)</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">1 Clic</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Descarga el acceso directo y colócalo en tu Escritorio para ingresar siempre con un clic:
                  </p>
                  <button
                    type="button"
                    onClick={descargarAccesoDirecto}
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-cyan-300 text-cyan-900 font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                  >
                    <span>⬇ Descargar Acceso Directo (.url)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-2xl bg-sky-50 border border-cyan-200 text-xs text-slate-800 space-y-2">
                <p className="font-bold text-cyan-900">Cómo añadir a la pantalla en Android:</p>
                <div className="space-y-1 font-medium text-[11.5px]">
                  <p>1. Toca los <strong>3 puntos (⋮)</strong> en la esquina superior de Chrome.</p>
                  <p>2. Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Añadir a pantalla principal"</strong>.</p>
                  <p>3. Confirma en <strong>"Instalar"</strong> y aparecerá el icono con marco oficial.</p>
                </div>
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="pt-2 flex flex-col gap-2">
            {deferredPrompt && !isInAppBrowser ? (
              <button 
                type="button" 
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                onClick={handleInstallClick}
              >
                <span>⬇ Instalar Versión 1.3 Oficial Ahora</span>
              </button>
            ) : null}

            <button 
              type="button" 
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              onClick={handleDismiss}
            >
              {isStandalone ? 'Cerrar' : 'Entendido, continuar a la aplicación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
