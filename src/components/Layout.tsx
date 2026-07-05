import { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ModulosSistema } from '../pages/CategoryDashboard';
import { usePermisos } from '../hooks/usePermisos';
import { supabase } from '../lib/supabase';
import { subscribeToWebPush } from '../lib/webPush';
import { ChatbotSigma } from './ChatbotSigma';

export const Layout = ({ onLogout }: { onLogout: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tienePermiso, loading: permLoading } = usePermisos();

  const [anioEscolar, setAnioEscolar] = useState<string>('Cargando...');
  const [lapsoEscolar, setLapsoEscolar] = useState<string>('Cargando...');
  
  // Lógica de Notificaciones
  const [notificaciones, setNotificaciones] = useState<any[]>(() => {
    try {
      const items = localStorage.getItem('sigae_notificaciones');
      return items ? JSON.parse(items) : [];
    } catch (e) {
      return [];
    }
  });
  const [mostrarNotifDropdown, setMostrarNotifDropdown] = useState(false);

  useEffect(() => {
    localStorage.setItem('sigae_notificaciones', JSON.stringify(notificaciones));
  }, [notificaciones]);

  const cargarConfigGlobal = async () => {
    try {
      const [perRes, lapRes] = await Promise.all([
        supabase.from('conf_periodos').select('*'),
        supabase.from('conf_lapsos').select('*')
      ]);

      const hoy = new Date().getTime();
      const encontrarActivo = (lista: any[]) => {
        if (!lista || lista.length === 0) return null;
        const activo = lista.find(item => {
          if (item.fecha_inicio && item.fecha_fin) {
            const pIn = new Date(item.fecha_inicio + "T00:00:00").getTime();
            const pOut = new Date(item.fecha_fin + "T23:59:59").getTime();
            return hoy >= pIn && hoy <= pOut;
          }
          return false;
        });
        return activo ? activo.valor : null;
      };

      const activeAnio = encontrarActivo(perRes.data || []) || 'No definido';
      const activeLapso = encontrarActivo(lapRes.data || []) || 'Fuera de Fase / Vacaciones';

      setAnioEscolar(activeAnio);
      setLapsoEscolar(activeLapso);
    } catch (err) {
      console.error("Error cargando configuración global en barra superior:", err);
      setAnioEscolar('Error');
      setLapsoEscolar('Error');
    }
  };

  const verificarMantenimiento = async () => {
    const usrStr = localStorage.getItem('usuario_sigae');
    if (!usrStr) return;
    
    let usr: any;
    try {
      usr = JSON.parse(usrStr);
    } catch (e) {
      return;
    }

    try {
      const { data: maintData } = await supabase
        .from('ajustes_globales')
        .select('valor')
        .eq('clave', 'mantenimiento_activo')
        .maybeSingle();

      if (maintData && maintData.valor === 'true') {
        let hasAccess = false;
        if (usr.rol === 'SuperAdmin') {
          hasAccess = true;
        } else {
          const { data: roleData } = await supabase
            .from('roles')
            .select('permisos')
            .eq('nombre', usr.rol)
            .maybeSingle();

          if (roleData && roleData.permisos) {
            const parsed = typeof roleData.permisos === 'string' ? JSON.parse(roleData.permisos) : roleData.permisos;
            const escPerms = parsed[usr.id_escuela || 'sb'] || {};
            if (escPerms["Ingresar en Mantenimiento"]?.ver === true) {
              hasAccess = true;
            }
          }
        }

        if (!hasAccess) {
          const disconnectUser = () => {
            localStorage.removeItem('sesion_sigae');
            localStorage.removeItem('usuario_sigae');
            onLogout();
            navigate('/login');
          };

          const Swal = (window as any).Swal;
          if (Swal) {
            Swal.fire({
              title: 'Sistema en Mantenimiento',
              text: 'El sistema ha entrado en mantenimiento global (acceso restringido solo a administradores y personal autorizado). Tu sesión ha sido finalizada.',
              icon: 'warning',
              confirmButtonColor: '#FF8D00',
              confirmButtonText: 'Entendido',
              allowOutsideClick: false,
              allowEscapeKey: false
            }).then(() => {
              disconnectUser();
            });
          } else {
            alert('El sistema ha entrado en mantenimiento global. Tu sesión ha sido finalizada.');
            disconnectUser();
          }
        }
      }
    } catch (e) {
      console.error("Error al comprobar mantenimiento activo:", e);
    }
  };

  useEffect(() => {
    cargarConfigGlobal();
    verificarMantenimiento();

    // Listen for custom events when config changes in ConfiguracionSistema
    const handleConfigChange = () => {
      cargarConfigGlobal();
    };

    const handleMaintenanceChange = () => {
      verificarMantenimiento();
    };

    const intervalMaint = setInterval(verificarMantenimiento, 20000);

    window.addEventListener('sigae-config-changed', handleConfigChange);
    window.addEventListener('sigae-maintenance-changed', handleMaintenanceChange);

    return () => {
      clearInterval(intervalMaint);
      window.removeEventListener('sigae-config-changed', handleConfigChange);
      window.removeEventListener('sigae-maintenance-changed', handleMaintenanceChange);
    };
  }, [location.pathname]);

  // Efecto persistente de notificaciones (solo al montar/desmontar la app)
  useEffect(() => {
    // Auto-suscribir a Web Push si ya tiene permisos concedidos
    subscribeToWebPush();

    const playChime = () => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = ctx.currentTime;
        [880, 1100].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.15);
          gain.gain.setValueAtTime(0, now + i * 0.15);
          gain.gain.linearRampToValueAtTime(0.25, now + i * 0.15 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.35);
          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.36);
        });
      } catch (e) {}
    };

    const handleNotification = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      
      setNotificaciones(prev => {
        const updated = [
          {
            id: detail.id || String(Date.now()),
            titulo: detail.titulo || 'Notificación',
            cuerpo: detail.cuerpo || '',
            leido: false,
            fecha: detail.fecha || new Date().toISOString(),
            tipo: detail.tipo || 'info'
          },
          ...prev
        ];
        return updated.slice(0, 30);
      });

      playChime();
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#campana-notificaciones')) {
        setMostrarNotifDropdown(false);
      }
    };

    window.addEventListener('sigae-notification', handleNotification);
    document.addEventListener('click', handleClickOutside);

    return () => {
      window.removeEventListener('sigae-notification', handleNotification);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // ─── GLOBAL TRACKING LISTENER PARA TRANSPORTE ESCOLAR ───
  const transTrackingRef = useRef<Record<string, { ubicacion_actual: string, estado: string }>>({});
  
  useEffect(() => {
    const usrStr = localStorage.getItem('usuario_sigae');
    if (!usrStr) return;
    let escCodigo = 'sb';
    try {
      escCodigo = JSON.parse(usrStr).id_escuela || 'sb';
    } catch(e) {}

    const playBusChime = (tipo: 'parada' | 'llegada') => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = ctx.currentTime;
        if (tipo === 'llegada') {
          const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.18);
            gain.gain.setValueAtTime(0, now + i * 0.18);
            gain.gain.linearRampToValueAtTime(0.28, now + i * 0.18 + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.35);
            osc.start(now + i * 0.18);
            osc.stop(now + i * 0.18 + 0.36);
          });
        } else {
          [880, 1100].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.22);
            gain.gain.setValueAtTime(0, now + i * 0.22);
            gain.gain.linearRampToValueAtTime(0.22, now + i * 0.22 + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.22 + 0.3);
            osc.start(now + i * 0.22);
            osc.stop(now + i * 0.22 + 0.31);
          });
        }
      } catch (e) {}
    };

    const sendBusNotification = (titulo: string, cuerpo: string) => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const opciones: any = {
        body: cuerpo,
        icon: '/assets/img/pdvsa.svg',
        badge: '/assets/img/pdvsa.svg',
        tag: 'bus-parada',
        renotify: true,
        vibrate: [200, 100, 200],
        silent: false,
      };
      try {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => reg.showNotification(titulo, opciones)).catch(() => {
            try { new Notification(titulo, opciones); } catch(err) {}
          });
        } else {
          new Notification(titulo, opciones);
        }
      } catch (e) {}
    };

    const channel = supabase.channel('global_tracking_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transporte_operaciones' }, async (payload: any) => {
        const row = payload.new;
        if (!row || row.escuela_codigo !== escCodigo) return;

        const isUpdate = payload.eventType === 'UPDATE';
        const isInsert = payload.eventType === 'INSERT';
        const prevState = transTrackingRef.current[row.id];

        transTrackingRef.current[row.id] = { ubicacion_actual: row.ubicacion_actual, estado: row.estado };

        let triggerNotif = false;
        let isEnd = false;

        if (isInsert && row.estado === 'En Ruta') {
          triggerNotif = true;
        } else if (isUpdate && prevState) {
          const cambioParada = row.ubicacion_actual !== prevState.ubicacion_actual;
          const finalizadaRecien = row.estado === 'Finalizada' && prevState.estado !== 'Finalizada';
          if (cambioParada || finalizadaRecien) {
            triggerNotif = true;
            isEnd = row.estado === 'Finalizada' || row.ubicacion_actual === 'escuela_virtual';
          }
        } else if (isUpdate && !prevState && row.estado !== 'Finalizada') {
          triggerNotif = true;
          isEnd = row.ubicacion_actual === 'escuela_virtual';
        }

        if (triggerNotif) {
          let paradaDisplay = row.ubicacion_actual;
          if (row.ubicacion_actual === 'escuela_virtual') {
            paradaDisplay = 'Escuela';
          } else {
            try {
              const { data: pData } = await supabase.from('transporte_paradas').select('nombre_parada').eq('id', row.ubicacion_actual).maybeSingle();
              if (pData) paradaDisplay = pData.nombre_parada;
            } catch(e) {}
          }
          let rutaDisplay = 'Ruta';
          try {
            const { data: rData } = await supabase.from('transporte_rutas').select('nombre').eq('id', row.ruta_id).maybeSingle();
            if (rData) rutaDisplay = rData.nombre;
          } catch(e) {}

          const titulo = isEnd ? '🏁 Destino Alcanzado' : (isInsert ? 'Ruta Iniciada 🚌' : '📍 Paso por Parada');
          const cuerpo = isEnd 
            ? `El recorrido de "${rutaDisplay}" finalizó con éxito en la escuela.`
            : (isInsert ? `Se ha iniciado el recorrido para la ruta "${rutaDisplay}" (${row.sentido}).` 
                        : `El bus de "${rutaDisplay}" pasó por la parada: ${paradaDisplay}.`);

          playBusChime(isEnd ? 'llegada' : 'parada');
          sendBusNotification(titulo, cuerpo);

          window.dispatchEvent(new CustomEvent('sigae-notification', {
            detail: {
              id: String(Date.now()),
              titulo,
              cuerpo,
              fecha: new Date().toISOString(),
              tipo: 'transporte'
            }
          }));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleBloquearSesion = () => {
    localStorage.setItem('sesion_sigae', 'bloqueada');
    onLogout();
    navigate('/login');
  };

  const handleLogout = () => {
    const Swal = (window as any).Swal;
    if (Swal) {
      Swal.fire({
        title: 'Cierre de Sesión',
        text: '¿Cómo deseas salir del sistema?',
        icon: 'question',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: '<i class="bi bi-moon-stars-fill me-1"></i> Hibernar (Huella / PIN)',
        denyButtonText: '<i class="bi bi-power me-1"></i> Cerrar Sesión',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0066FF',
        denyButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d'
      }).then((result: any) => {
        if (result.isConfirmed) {
          // Hibernar: mantener usuario en localstorage para reingreso rápido
          handleBloquearSesion();
        } else if (result.isDenied) {
          // Cerrar sesión por completo: limpiar todo
          localStorage.removeItem('sesion_sigae');
          localStorage.removeItem('usuario_sigae');
          onLogout();
          navigate('/login');
        }
      });
    } else {
      const hibernar = window.confirm("¿Deseas hibernar la sesión para reingresar con huella/PIN? (Cancelar cierra la sesión por completo)");
      if (hibernar) {
        handleBloquearSesion();
      } else {
        localStorage.removeItem('sesion_sigae');
        localStorage.removeItem('usuario_sigae');
        onLogout();
        navigate('/login');
      }
    }
  };

  // Inactivity tracking (30 minutes)
  useEffect(() => {
    const TIEMPO_INACTIVIDAD = 30 * 60 * 1000; // 30 minutos
    const TIEMPO_ADVERTENCIA = 30 * 1000; // 30 segundos
    let timerInactividad: any;
    let timerAdvertencia: any;

    const resetTimer = () => {
      clearTimeout(timerInactividad);
      clearTimeout(timerAdvertencia);
      timerInactividad = setTimeout(mostrarAdvertencia, TIEMPO_INACTIVIDAD - TIEMPO_ADVERTENCIA);
    };

    const mostrarAdvertencia = () => {
      const Swal = (window as any).Swal;
      let contador = 30;
      let intervalContador: any;

      if (Swal) {
        Swal.fire({
          title: '¿Sigues ahí?',
          html: 'Tu sesión se bloqueará por inactividad en <b>30</b> segundos.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, mantener activa',
          cancelButtonText: 'Bloquear ahora',
          confirmButtonColor: '#0066FF',
          cancelButtonColor: '#dc3545',
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            const b = Swal.getHtmlContainer().querySelector('b');
            intervalContador = setInterval(() => {
              contador--;
              if (b) b.textContent = String(contador);
              if (contador <= 0) {
                clearInterval(intervalContador);
                Swal.clickCancel();
              }
            }, 1000);
          },
          willClose: () => {
            clearInterval(intervalContador);
          }
        }).then((result: any) => {
          if (result.isConfirmed) {
            resetTimer();
          } else {
            handleBloquearSesion();
          }
        });
      } else {
        const mantener = window.confirm("Tu sesión está inactiva. ¿Deseas mantenerte activo?");
        if (mantener) {
          resetTimer();
        } else {
          handleBloquearSesion();
        }
      }
    };

    const eventos = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    eventos.forEach(evt => window.addEventListener(evt, resetTimer));

    resetTimer();

    return () => {
      clearTimeout(timerInactividad);
      clearTimeout(timerAdvertencia);
      eventos.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [navigate, onLogout]);

  const usuarioStr = localStorage.getItem('usuario_sigae');
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : { nombre: 'Usuario', rol: 'Rol' };
  const escuelaNombre = localStorage.getItem('sigae_escuela_activa') || 'UE Santa Bárbara';
  const escuelaCodigo = localStorage.getItem('sigae_escuela_codigo') || 'sb';
  
  const logoPath = `/assets/img/logo_${escuelaCodigo}.png`;

  const toggleSidebar = () => {
    document.body.classList.toggle('menu-colapsado');
  };

  const toggleMobileSidebar = () => {
    document.body.classList.toggle('menu-abierto');
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    document.body.classList.remove('menu-abierto');
  }, [location.pathname]);

  const activeCategory = location.pathname === '/' 
    ? 'Inicio' 
    : location.pathname.startsWith('/categoria/')
      ? decodeURIComponent(location.pathname.replace('/categoria/', '')).split('/')[0]
      : '';

  return (
    <div id="vista-app" className="vista-app-estilo">
      <aside id="menu-lateral" className="glass-sidebar shadow-lg">
        <div className="sidebar-header d-flex align-items-center justify-content-between">
          <div id="btn-logo-nav" onClick={() => navigate('/')} className="d-flex align-items-center cursor-pointer">
            <img 
              src={logoPath} 
              width="40" 
              className="me-2 logo-img" 
              alt="Logo SIGAE" 
              onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
            />
            <span className="fw-bold text-dark sidebar-texto">SIGAE {escuelaNombre.replace('UE ', '')}</span>
          </div>
          <button id="btn-colapsar-menu" onClick={toggleSidebar} className="btn-colapsar d-none d-lg-block ms-auto">
            <i className="bi bi-list"></i>
          </button>
        </div>
        
        <div id="contenedor-enlaces" className="sidebar-menu pb-5">
          {/* PANEL PRINCIPAL / INICIO */}
          <div className="px-4 mb-3">
            <button 
              onClick={() => navigate('/')} 
              id="btn-menu-Inicio" 
              className={`btn-moderno w-100 btn-inicio-sidebar text-start ${activeCategory === 'Inicio' ? 'btn-primario' : 'btn-secundario'}`} 
              style={{ 
                padding: '12px', 
                display: 'flex', 
                alignItems: 'center',
                background: activeCategory === 'Inicio' ? 'var(--color-primario)' : 'transparent',
                color: activeCategory === 'Inicio' ? 'white' : 'var(--color-primario)',
                border: activeCategory === 'Inicio' ? 'none' : '2px solid var(--color-primario)',
                boxShadow: activeCategory === 'Inicio' ? 'var(--sombra-neon)' : 'none'
              }}
            >
              <i className="bi bi-house-door-fill me-3 fs-5"></i>
              <span className="texto-menu-ocultable fw-bold">Panel Principal</span>
            </button>
          </div>

          {/* CATEGORIAS DINAMICAS */}
          <div className="px-3">
            <div className="small text-muted fw-bold mb-2 px-3 texto-menu-ocultable" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
              MÓDULOS DEL SISTEMA
            </div>
            
            {Object.entries(ModulosSistema).map(([nombreCategoria, datosModulo]) => {
              // Mientras cargan permisos, no mostrar nada (evita flash de módulos sin filtrar)
              if (permLoading) return null;
              if (!datosModulo.items.some((item: any) => tienePermiso(item.vista, 'ver'))) {
                return null;
              }
              const isActive = activeCategory === nombreCategoria;
              return (
                <a 
                  key={nombreCategoria}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/categoria/${encodeURIComponent(nombreCategoria)}`);
                  }}
                  id={`btn-menu-${nombreCategoria.replace(/[\s/()]/g, '-')}`}
                  className={`menu-item d-flex align-items-center mb-1 rounded-3 ${isActive ? 'activo' : ''}`}
                  style={{ 
                    padding: '12px 20px', 
                    textDecoration: 'none',
                    background: isActive ? 'rgba(0, 102, 255, 0.08)' : 'transparent',
                    borderLeft: isActive ? '4px solid var(--color-primario)' : '4px solid transparent'
                  }}
                >
                  <i className={`bi ${datosModulo.icono} me-3 fs-5`} style={{ color: datosModulo.color }}></i>
                  <span className="texto-menu-ocultable">{nombreCategoria}</span>
                </a>
              );
            })}
          </div>
        </div>
      </aside>

      <main id="contenido-principal" className="d-flex flex-column min-vh-100">
        <header className="glass-header shadow-sm d-flex align-items-center px-4 bg-white auth-header">
          <button id="btn-menu-movil" onClick={toggleMobileSidebar} className="btn-movil d-lg-none me-3">
            <i className="bi bi-list fs-3"></i>
          </button>
          <h5 id="titulo-pagina" className="mb-0 fw-bold text-dark d-none d-md-block">
            {activeCategory === 'Inicio' ? 'Panel Principal' : activeCategory}
          </h5>

          <div className="ms-auto d-flex align-items-center">
            <div className="d-none d-lg-flex flex-column align-items-end me-4 pe-4 border-end">
              <span className="fw-bold text-primary text-anio" id="global-anio-escolar">
                <i className="bi bi-calendar3 me-1"></i> Año Escolar: <span className="fw-bold">{anioEscolar}</span>
              </span>
              <span className="text-muted fw-bold text-lapso" id="global-lapso-escolar">
                <i className="bi bi-clock-history me-1"></i> Fase Actual: <span className={lapsoEscolar.includes('Fuera') || lapsoEscolar === 'Error' ? 'text-danger fw-bold' : (lapsoEscolar === 'Cargando...' ? 'text-muted' : 'text-success fw-bold')}>{lapsoEscolar}</span>
              </span>
            </div>

            <div className="position-relative me-3 cursor-pointer" id="btn-dark-mode">
              <i className="bi bi-moon-stars-fill fs-4 text-secondary hover-efecto" id="icono-tema"></i>
            </div>

            <div 
              className="position-relative me-3 me-md-4" 
              id="campana-notificaciones"
              style={{ display: 'inline-block' }}
            >
              <div 
                onClick={() => setMostrarNotifDropdown(!mostrarNotifDropdown)} 
                className="cursor-pointer position-relative d-flex align-items-center"
              >
                <i className="bi bi-bell-fill fs-4 text-secondary hover-efecto" id="icono-campana"></i>
                {notificaciones.filter(n => !n.leido).length > 0 && (
                  <span 
                    className="position-absolute translate-middle badge rounded-pill bg-danger" 
                    style={{
                      top: '4px',
                      right: '-8px',
                      fontSize: '0.65rem',
                      padding: '4px 6px',
                      boxShadow: '0 0 0 2px white',
                      animation: 'pulse-badge 1.5s infinite'
                    }}
                  >
                    {notificaciones.filter(n => !n.leido).length}
                  </span>
                )}
              </div>

              {mostrarNotifDropdown && (
                <div 
                  className="dropdown-menu show dropdown-menu-end shadow-lg border-0 rounded-3 p-0"
                  style={{
                    position: 'absolute',
                    top: '38px',
                    right: 0,
                    width: '320px',
                    maxHeight: '400px',
                    zIndex: 1050,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'fadeInUp 0.2s ease-out'
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light rounded-top">
                    <span className="fw-bold text-dark mb-0 small">Notificaciones</span>
                    {notificaciones.length > 0 && (
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-link btn-sm p-0 text-primary fw-semibold small text-decoration-none"
                          onClick={() => {
                            setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));
                          }}
                        >
                          Leer todo
                        </button>
                        <span className="text-muted">|</span>
                        <button 
                          className="btn btn-link btn-sm p-0 text-danger fw-semibold small text-decoration-none"
                          onClick={() => setNotificaciones([])}
                        >
                          Limpiar
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="overflow-auto" style={{ maxHeight: '320px', flexGrow: 1 }}>
                    {notificaciones.length === 0 ? (
                      <div className="text-center py-4 text-muted small">
                        <i className="bi bi-bell-slash fs-3 d-block mb-2 text-secondary"></i>
                        No tienes notificaciones
                      </div>
                    ) : (
                      notificaciones.map((notif) => (
                        <div 
                          key={notif.id}
                          onClick={() => {
                            setNotificaciones(prev => prev.map(n => n.id === notif.id ? { ...n, leido: true } : n));
                          }}
                          className={`d-flex p-3 border-bottom cursor-pointer hover-bg-light transition-all ${!notif.leido ? 'bg-aliceblue' : ''}`}
                          style={{
                            backgroundColor: !notif.leido ? '#f0f7ff' : '#ffffff',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <div className="me-3">
                            <span 
                              className={`d-flex align-items-center justify-content-center rounded-circle`}
                              style={{
                                width: '32px',
                                height: '32px',
                                background: notif.tipo === 'transporte' ? '#fffbeb' : '#eff6ff',
                                color: notif.tipo === 'transporte' ? '#d97706' : '#2563eb',
                                border: notif.tipo === 'transporte' ? '1px solid #fde68a' : '1px solid #bfdbfe'
                              }}
                            >
                              <i className={`bi ${notif.tipo === 'transporte' ? 'bi-bus-front' : 'bi-info-circle-fill'} small`}></i>
                            </span>
                          </div>
                          <div style={{ flexGrow: 1, minWidth: 0 }}>
                            <div className="d-flex justify-content-between align-items-start mb-1">
                              <span className="fw-bold text-dark text-truncate small" style={{ maxWidth: '160px' }}>
                                {notif.titulo}
                              </span>
                              <span className="text-muted style-date" style={{ fontSize: '0.65rem' }}>
                                {new Date(notif.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-muted mb-0 small text-wrap-break" style={{ fontSize: '0.75rem', lineHeight: '1.25' }}>
                              {notif.cuerpo}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="usuario-info me-3 text-end d-none d-md-block">
              <div id="nombre-usuario-nav" className="fw-bold text-dark">{usuario.nombre}</div>
              <div id="rol-usuario-nav" className="small texto-gradiente fw-bold">{usuario.rol}</div>
            </div>
            
            <button onClick={handleLogout} id="btn-cerrar-sesion" className="btn-circulo btn-peligro shadow-sm">
              <i className="bi bi-power"></i>
            </button>
          </div>
        </header>

        <div id="area-dinamica" className="contenedor-dinamico p-4 p-md-5 flex-grow-1">
          <Outlet />
        </div>

        <footer className="w-100 d-flex flex-column align-items-center py-4 mt-auto border-top bg-light bg-opacity-50">
          <div className="d-flex justify-content-center align-items-center gap-4 mb-3">
            <img src="/assets/img/logoMPPE.png" alt="MPPE" className="footer-logo-mppe" height="40" />
            <img src="/assets/img/logo_carga.png" alt="SIGAE" className="footer-logo-sigae" height="55" />
          </div>
          <div className="fw-bold text-center mb-2 footer-anio">
            Escuelas DEP Oriente <span>{new Date().getFullYear()}</span> | <span className="text-primary">Versión 1.0</span>
          </div>
        </footer>
      </main>
      <ChatbotSigma />
    </div>
  );
};
