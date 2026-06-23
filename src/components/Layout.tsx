import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ModulosSistema } from '../pages/CategoryDashboard';
import { usePermisos } from '../hooks/usePermisos';
import { supabase } from '../lib/supabase';
import { ChatbotSigma } from './ChatbotSigma';

export const Layout = ({ onLogout }: { onLogout: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tienePermiso, loading: permLoading } = usePermisos();

  const [anioEscolar, setAnioEscolar] = useState<string>('Cargando...');
  const [lapsoEscolar, setLapsoEscolar] = useState<string>('Cargando...');

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

  useEffect(() => {
    cargarConfigGlobal();

    // Listen for custom events when config changes in ConfiguracionSistema
    const handleConfigChange = () => {
      cargarConfigGlobal();
    };
    window.addEventListener('sigae-config-changed', handleConfigChange);
    return () => {
      window.removeEventListener('sigae-config-changed', handleConfigChange);
    };
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
    <div id="vista-app" className="vista-app-estilo" style={{ display: 'flex' }}>
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
              if (!permLoading && !datosModulo.items.some((item: any) => tienePermiso(item.vista, 'ver'))) {
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

            <div className="position-relative me-3 me-md-4 cursor-pointer" id="campana-notificaciones">
              <i className="bi bi-bell-fill fs-4 text-secondary hover-efecto" id="icono-campana"></i>
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
            <img src="/assets/img/logoMPPE.png" alt="MPPE" height="45" />
            <img src="/assets/img/logo_carga.png" alt="SIGAE" height="70" />
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
