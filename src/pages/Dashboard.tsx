import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { usePermisos } from '../hooks/usePermisos';

interface EscuelaPerfil {
  id_escuela: string;
  nombre_institucion: string;
  codigo_dea: string;
  rif: string;
  direccion: string;
  mision: string;
  vision: string;
  objetivo: string;
  peic: string;
}

export const Dashboard = () => {
  const navigate = useNavigate();
  const [escuelas, setEscuelas] = useState<EscuelaPerfil[]>([]);
  const [fechaTexto, setFechaTexto] = useState('Cargando fecha...');
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const { tieneAccesoEscuela, tienePermiso, loading: permLoading } = usePermisos();

  const activeSchoolCode = localStorage.getItem('sigae_escuela_codigo') || 'sb';

  const cambiarEscuelaActiva = (nuevaEscuela: 'sb' | 'lb') => {
    localStorage.setItem('sigae_escuela_codigo', nuevaEscuela);
    localStorage.setItem('sigae_escuela_activa', nuevaEscuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
    
    // Si el usuario en localStorage tiene id_escuela, lo actualizamos también
    const stored = localStorage.getItem('usuario_sigae');
    if (stored) {
      try {
        const usr = JSON.parse(stored);
        usr.id_escuela = nuevaEscuela;
        usr.nombre_escuela = nuevaEscuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
        localStorage.setItem('usuario_sigae', JSON.stringify(usr));
      } catch (e) {}
    }
    
    window.location.reload();
  };

  const userStr = localStorage.getItem('usuario_sigae');
  const usuario = userStr ? JSON.parse(userStr) : { nombre: 'Usuario' };
  const primerNombre = usuario.nombre ? usuario.nombre.split(' ')[0] : 'Usuario';

  useEffect(() => {
    // Reloj
    const opcionesFecha: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const hoy = new Date();
    let texto = hoy.toLocaleDateString('es-VE', opcionesFecha);
    texto = texto.charAt(0).toUpperCase() + texto.slice(1);
    setFechaTexto(texto);

    // Cargar caché local primero para renderizado instantáneo (fluidez)
    const cacheKey = 'sigae_cached_perfiles';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setEscuelas(JSON.parse(cached));
      } catch (e) {}
    }

    // Fetch escuela data
    const fetchEscuelas = async () => {
      try {
        const { data, error } = await supabase.from('perfil_escuela').select('*');
        if (!error && data) {
          setEscuelas(data);
          localStorage.setItem(cacheKey, JSON.stringify(data));
        }
      } catch (err) {
        console.error('Error fetching profiles:', err);
      }
    };
    fetchEscuelas();
  }, []);

  const handleCardClick = (cardId: string) => {
    setFlipped(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  // Helper to find data by school code
  const getEscuelaData = (code: string): EscuelaPerfil => {
    const esc = escuelas.find(e => e.id_escuela?.toLowerCase() === code.toLowerCase());
    return esc || {
      id_escuela: code,
      nombre_institucion: code === 'lb' ? 'UE Libertador Bolívar' : 'UE Santa Bárbara',
      codigo_dea: 'N/A',
      rif: 'N/A',
      direccion: 'Cargando...',
      mision: 'Cargando...',
      vision: 'Cargando...',
      objetivo: 'Cargando...',
      peic: 'Cargando...'
    };
  };

  const lbData = getEscuelaData('lb');
  const sbData = getEscuelaData('sb');

  const hasAccessSB = tieneAccesoEscuela('sb');
  const hasAccessLB = tieneAccesoEscuela('lb');

  const accesosRapidosLista = [
    {
      vista: 'Solicitud de Cupos',
      ruta: '/categoria/Gestión Estudiantil/Solicitud de Cupos',
      icono: 'bi-person-lines-fill',
      subtitulo: 'Admisión estudiantil',
      badge: 'Trámite',
      badgeColor: 'bg-success text-white',
      iconBg: 'bg-success text-white',
      btnBg: '#f0fdf4',
      btnBorder: '#bbf7d0',
      textClass: 'fw-bolder text-success'
    },
    {
      vista: 'Transporte Escolar',
      ruta: '/categoria/Servicios y Bienestar/Transporte Escolar',
      icono: 'bi-bus-front-fill',
      subtitulo: 'Rutas y paradas',
      badge: 'Servicio',
      badgeColor: 'bg-primary text-white',
      iconBg: 'bg-primary text-white',
      btnBg: '#eff6ff',
      btnBorder: '#bfdbfe',
      textClass: 'fw-bold text-dark'
    },
    {
      vista: 'Grados y Salones',
      ruta: '/categoria/Control de Estudios/Grados y Salones',
      icono: 'bi-building-check',
      subtitulo: 'Control académico',
      badge: 'Aulas',
      badgeColor: 'bg-info text-white',
      iconBg: 'bg-info text-white',
      btnBg: '#f0f9ff',
      btnBorder: '#bae6fd',
      textClass: 'fw-bold text-dark'
    },
    {
      vista: 'Gestor de Expedientes',
      ruta: '/categoria/Gestión Docente/Gestor de Expedientes',
      icono: 'bi-folder2-open',
      subtitulo: 'Gestión docente',
      badge: 'Personal',
      badgeColor: 'bg-warning text-dark',
      iconBg: 'bg-warning text-dark',
      btnBg: '#fefce8',
      btnBorder: '#fde047',
      textClass: 'fw-bold text-dark'
    },
    {
      vista: 'Mi Expediente',
      ruta: '/categoria/Gestión Docente/Mi Expediente',
      icono: 'bi-file-earmark-person-fill',
      subtitulo: 'Expediente propio',
      badge: 'Docente',
      badgeColor: 'bg-warning text-dark',
      iconBg: 'bg-warning text-dark',
      btnBg: '#fefce8',
      btnBorder: '#fde047',
      textClass: 'fw-bold text-dark'
    },
    {
      vista: 'Perfil de la Escuela',
      ruta: '/categoria/Dirección y Sistema/Perfil de la Escuela',
      icono: 'bi-house-heart-fill',
      subtitulo: 'Dirección y datos',
      badge: 'Planteles',
      badgeColor: 'bg-danger text-white',
      iconBg: 'bg-danger text-white',
      btnBg: '#fff1f2',
      btnBorder: '#fecdd3',
      textClass: 'fw-bold text-dark'
    },
    {
      vista: 'Mi Perfil',
      ruta: '/categoria/Seguridad y Accesos/Mi Perfil',
      icono: 'bi-person-badge-fill',
      subtitulo: 'Privilegios de usuario',
      badge: 'Cuenta',
      badgeColor: 'bg-secondary text-white',
      iconBg: 'bg-secondary text-white',
      btnBg: '#f8fafc',
      btnBorder: '#cbd5e1',
      textClass: 'fw-bold text-dark'
    }
  ];

  const accesosPermitidos = accesosRapidosLista.filter(item => {
    // Si el usuario ya ve Gestor de Expedientes, evitamos duplicar con Mi Expediente
    if (item.vista === 'Mi Expediente' && tienePermiso('Gestor de Expedientes', 'ver')) {
      return false;
    }
    return tienePermiso(item.vista, 'ver');
  });

  if (permLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando permisos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate__animated animate__fadeIn">
      {/* SALUDO GLOBAL */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h1 className="fw-bolder mb-1 text-dark" id="lbl-saludo-usuario" style={{ fontSize: '2.5rem', letterSpacing: '-1px' }}>
            <i className="bi bi-clock me-3"></i>¡Hola, {primerNombre}!
          </h1>
          <p className="text-muted mb-0 fs-5">Resumen de nuestras instituciones educativas</p>
        </div>
        <div className="text-end">
          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-4 py-2 rounded-pill shadow-sm fs-6">
            <i className="bi bi-clock me-1"></i> <span id="reloj-vivo">{fechaTexto}</span>
          </span>
        </div>
      </div>

      {/* PANTALLA DIVIDIDA: LAS DOS ESCUELAS */}
      <div className="row g-4 mb-4">
        
        {/* COLUMNA IZQUIERDA: UE Libertador Bolívar (lb) */}
        {hasAccessLB && (
          <div className={hasAccessSB ? "col-xl-6" : "col-12"} id="tarjeta-inicio-lb">
          <div className="card border-0 shadow-sm rounded-4 h-100 border-top border-primary border-5 hover-efecto">
            <div className="banner-inicio mb-4 rounded-top-4 p-4 position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0066FF 0%, #00C3FF 100%)' }}>
              <div className="banner-orb" style={{ width: '150px', height: '150px', top: '-50px', left: '-20px', opacity: 0.3 }}></div>
              <div className="banner-orb" style={{ width: '100px', height: '100px', bottom: '-20px', right: '20%', opacity: 0.2 }}></div>
              <div className="row align-items-center position-relative z-1">
                <div className="col-8">
                  <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                    <h4 className="fw-bolder mb-0 text-white" id="lbl-nombre-escuela-lb" style={{ lineHeight: 1.2 }}>{lbData.nombre_institucion}</h4>
                    {activeSchoolCode === 'lb' ? (
                      <span className="badge bg-white text-success border shadow-sm px-2.5 py-1.5 fw-bold" style={{ fontSize: '0.7rem' }}>
                        <i className="bi bi-check-circle-fill me-1"></i>Activa
                      </span>
                    ) : (
                      <button 
                        onClick={() => cambiarEscuelaActiva('lb')}
                        className="btn btn-xs btn-outline-light rounded-pill px-2.5 py-1 fw-bold border-white"
                        style={{ fontSize: '0.65rem', border: '1.5px solid white' }}
                      >
                        Activar Escuela
                      </button>
                    )}
                  </div>
                  <p className="mb-3 d-flex align-items-start text-white opacity-75 small">
                    <i className="bi bi-geo-alt-fill text-warning me-2 mt-1 flex-shrink-0"></i>
                    <span id="lbl-direccion-escuela-lb">{lbData.direccion}</span>
                  </p>
                  <div className="d-flex gap-2 flex-wrap">
                    <span className="badge bg-white text-primary px-2 py-1 shadow-sm"><i className="bi bi-building"></i> DEA: <span id="lbl-dea-escuela-lb">{lbData.codigo_dea}</span></span>
                    <span className="badge bg-white text-primary px-2 py-1 shadow-sm"><i className="bi bi-hash"></i> RIF: <span id="lbl-rif-escuela-lb">{lbData.rif}</span></span>
                  </div>
                </div>
                <div className="col-4 text-end">
                  <img src="/assets/img/logo_lb.png" id="img-logo-escuela-banner-lb" alt="Logo LB" className="img-fluid" style={{ maxHeight: '90px', filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.3))' }} onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }} />
                </div>
              </div>
            </div>

            <div className="card-body p-4 pt-0">
              <div className="row g-3">
                <div className="col-6">
                  <div className={`flip-card ${flipped['lb-mision'] ? 'flipped' : ''}`} onClick={() => handleCardClick('lb-mision')}>
                    <div className="flip-card-inner">
                      <div className="flip-card-front">
                        <img src="/assets/img/3.png" alt="Misión" className="img-tarjeta-inicio" />
                        <h6 style={{ color: '#0066FF' }} className="mb-0 fw-bold text-uppercase">Misión</h6>
                      </div>
                      <div className="flip-card-back p-3" style={{ borderColor: '#0066FF', overflowY: 'auto' }}>
                        <h6 style={{ color: '#0066FF', fontSize: '0.8rem' }} className="text-uppercase fw-bold"><i className="bi bi-bullseye me-1"></i>Misión</h6>
                        <p id="lbl-mision-back-lb" className="small mb-0 text-muted">{lbData.mision}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className={`flip-card ${flipped['lb-vision'] ? 'flipped' : ''}`} onClick={() => handleCardClick('lb-vision')}>
                    <div className="flip-card-inner">
                      <div className="flip-card-front">
                        <img src="/assets/img/4.png" alt="Visión" className="img-tarjeta-inicio" />
                        <h6 style={{ color: '#00C3FF' }} className="mb-0 fw-bold text-uppercase">Visión</h6>
                      </div>
                      <div className="flip-card-back p-3" style={{ borderColor: '#00C3FF', overflowY: 'auto' }}>
                        <h6 style={{ color: '#00C3FF', fontSize: '0.8rem' }} className="text-uppercase fw-bold"><i className="bi bi-eye me-1"></i>Visión</h6>
                        <p id="lbl-vision-back-lb" className="small mb-0 text-muted">{lbData.vision}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className={`flip-card ${flipped['lb-valores'] ? 'flipped' : ''}`} onClick={() => handleCardClick('lb-valores')}>
                    <div className="flip-card-inner">
                      <div className="flip-card-front">
                        <img src="/assets/img/5.png" alt="Valores" className="img-tarjeta-inicio" />
                        <h6 style={{ color: '#34A853' }} className="mb-0 fw-bold text-uppercase">Valores</h6>
                      </div>
                      <div className="flip-card-back p-3" style={{ borderColor: '#34A853', overflowY: 'auto' }}>
                        <h6 style={{ color: '#34A853', fontSize: '0.8rem' }} className="text-uppercase fw-bold"><i className="bi bi-gem me-1"></i>Valores</h6>
                        <p id="lbl-objetivo-back-lb" className="small mb-0 text-muted">{lbData.objetivo}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className={`flip-card ${flipped['lb-peic'] ? 'flipped' : ''}`} onClick={() => handleCardClick('lb-peic')}>
                    <div className="flip-card-inner">
                      <div className="flip-card-front">
                        <img src="/assets/img/6.png" alt="PEIC" className="img-tarjeta-inicio" />
                        <h6 style={{ color: '#FF8D00' }} className="mb-0 fw-bold text-uppercase">PEIC</h6>
                      </div>
                      <div className="flip-card-back p-3" style={{ borderColor: '#FF8D00', overflowY: 'auto' }}>
                        <h6 style={{ color: '#FF8D00', fontSize: '0.8rem' }} className="text-uppercase fw-bold"><i className="bi bi-journal-bookmark me-1"></i>P.E.I.C.</h6>
                        <p id="lbl-peic-back-lb" className="small mb-0 text-muted">{lbData.peic}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* COLUMNA DERECHA: UE Santa Bárbara (sb) */}
        {hasAccessSB && (
          <div className={hasAccessLB ? "col-xl-6" : "col-12"} id="tarjeta-inicio-sb">
          <div className="card border-0 shadow-sm rounded-4 h-100 border-top border-success border-5 hover-efecto">
            <div className="banner-inicio mb-4 rounded-top-4 p-4 position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' }}>
              <div className="banner-orb" style={{ width: '150px', height: '150px', top: '-50px', left: '-20px', opacity: 0.3 }}></div>
              <div className="banner-orb" style={{ width: '100px', height: '100px', bottom: '-20px', right: '20%', opacity: 0.2 }}></div>
              <div className="row align-items-center position-relative z-1">
                <div className="col-8">
                  <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                    <h4 className="fw-bolder mb-0 text-white" id="lbl-nombre-escuela-sb" style={{ lineHeight: 1.2 }}>{sbData.nombre_institucion}</h4>
                    {activeSchoolCode === 'sb' ? (
                      <span className="badge bg-white text-success border shadow-sm px-2.5 py-1.5 fw-bold" style={{ fontSize: '0.7rem' }}>
                        <i className="bi bi-check-circle-fill me-1"></i>Activa
                      </span>
                    ) : (
                      <button 
                        onClick={() => cambiarEscuelaActiva('sb')}
                        className="btn btn-xs btn-outline-light rounded-pill px-2.5 py-1 fw-bold border-white"
                        style={{ fontSize: '0.65rem', border: '1.5px solid white' }}
                      >
                        Activar Escuela
                      </button>
                    )}
                  </div>
                  <p className="mb-3 d-flex align-items-start text-white opacity-75 small">
                    <i className="bi bi-geo-alt-fill text-warning me-2 mt-1 flex-shrink-0"></i>
                    <span id="lbl-direccion-escuela-sb">{sbData.direccion}</span>
                  </p>
                  <div className="d-flex gap-2 flex-wrap">
                    <span className="badge bg-white text-success px-2 py-1 shadow-sm"><i className="bi bi-building"></i> DEA: <span id="lbl-dea-escuela-sb">{sbData.codigo_dea}</span></span>
                    <span className="badge bg-white text-success px-2 py-1 shadow-sm"><i className="bi bi-hash"></i> RIF: <span id="lbl-rif-escuela-sb">{sbData.rif}</span></span>
                  </div>
                </div>
                <div className="col-4 text-end">
                  <img src="/assets/img/logo_sb.png" id="img-logo-escuela-banner-sb" alt="Logo SB" className="img-fluid" style={{ maxHeight: '90px', filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.3))' }} onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }} />
                </div>
              </div>
            </div>

            <div className="card-body p-4 pt-0">
              <div className="row g-3">
                <div className="col-6">
                  <div className={`flip-card ${flipped['sb-mision'] ? 'flipped' : ''}`} onClick={() => handleCardClick('sb-mision')}>
                    <div className="flip-card-inner">
                      <div className="flip-card-front">
                        <img src="/assets/img/3.png" alt="Misión" className="img-tarjeta-inicio" />
                        <h6 style={{ color: '#10b981' }} className="mb-0 fw-bold text-uppercase">Misión</h6>
                      </div>
                      <div className="flip-card-back p-3" style={{ borderColor: '#10b981', overflowY: 'auto' }}>
                        <h6 style={{ color: '#10b981', fontSize: '0.8rem' }} className="text-uppercase fw-bold"><i className="bi bi-bullseye me-1"></i>Misión</h6>
                        <p id="lbl-mision-back-sb" className="small mb-0 text-muted">{sbData.mision}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className={`flip-card ${flipped['sb-vision'] ? 'flipped' : ''}`} onClick={() => handleCardClick('sb-vision')}>
                    <div className="flip-card-inner">
                      <div className="flip-card-front">
                        <img src="/assets/img/4.png" alt="Visión" className="img-tarjeta-inicio" />
                        <h6 style={{ color: '#34d399' }} className="mb-0 fw-bold text-uppercase">Visión</h6>
                      </div>
                      <div className="flip-card-back p-3" style={{ borderColor: '#34d399', overflowY: 'auto' }}>
                        <h6 style={{ color: '#34d399', fontSize: '0.8rem' }} className="text-uppercase fw-bold"><i className="bi bi-eye me-1"></i>Visión</h6>
                        <p id="lbl-vision-back-sb" className="small mb-0 text-muted">{sbData.vision}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className={`flip-card ${flipped['sb-valores'] ? 'flipped' : ''}`} onClick={() => handleCardClick('sb-valores')}>
                    <div className="flip-card-inner">
                      <div className="flip-card-front">
                        <img src="/assets/img/5.png" alt="Valores" className="img-tarjeta-inicio" />
                        <h6 style={{ color: '#059669' }} className="mb-0 fw-bold text-uppercase">Valores</h6>
                      </div>
                      <div className="flip-card-back p-3" style={{ borderColor: '#059669', overflowY: 'auto' }}>
                        <h6 style={{ color: '#059669', fontSize: '0.8rem' }} className="text-uppercase fw-bold"><i className="bi bi-gem me-1"></i>Valores</h6>
                        <p id="lbl-objetivo-back-sb" className="small mb-0 text-muted">{sbData.objetivo}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className={`flip-card ${flipped['sb-peic'] ? 'flipped' : ''}`} onClick={() => handleCardClick('sb-peic')}>
                    <div className="flip-card-inner">
                      <div className="flip-card-front">
                        <img src="/assets/img/6.png" alt="PEIC" className="img-tarjeta-inicio" />
                        <h6 style={{ color: '#047857' }} className="mb-0 fw-bold text-uppercase">PEIC</h6>
                      </div>
                      <div className="flip-card-back p-3" style={{ borderColor: '#047857', overflowY: 'auto' }}>
                        <h6 style={{ color: '#047857', fontSize: '0.8rem' }} className="text-uppercase fw-bold"><i className="bi bi-journal-bookmark me-1"></i>P.E.I.C.</h6>
                        <p id="lbl-peic-back-sb" className="small mb-0 text-muted">{sbData.peic}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* BOTONERA DE ACCESOS RÁPIDOS Y GUÍA DE MENÚ */}
      {accesosPermitidos.length > 0 && (
        <div id="card-accesos-rapidos" className="card border-0 shadow-sm rounded-4 p-4 mb-4" style={{ background: 'white', borderTop: '4px solid #16a34a' }}>
          <div className="d-flex flex-column flex-xl-row align-items-stretch align-items-xl-center justify-content-between mb-3 pb-3 border-bottom gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px', fontSize: '1.5rem' }}>
                <i className="bi bi-grid-fill"></i>
              </div>
              <div>
                <h5 className="fw-bold text-dark mb-1">Botonera de Accesos Rápidos</h5>
                <p className="text-muted small mb-0">Selecciona un módulo para ingresar directamente o utiliza el menú lateral para explorar más opciones.</p>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap bg-light p-2.5 rounded-4 border border-primary border-opacity-25 shadow-sm">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm" style={{ width: '38px', height: '38px', fontSize: '1.2rem' }}>
                <i className="bi bi-list"></i>
              </div>
              <div className="me-2">
                <span className="d-block fw-bold text-dark small mb-0">
                  <i className="bi bi-compass-fill text-primary me-1"></i> ¿Buscas más módulos y funciones?
                </span>
                <span className="text-muted" style={{ fontSize: '0.76rem' }}>
                  Ubica el <strong>Botón de Menú (<i className="bi bi-list"></i>)</strong> en la esquina o la barra lateral izquierda para explorar todo el sistema.
                </span>
              </div>
              <button 
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('sigae-iniciar-tour'));
                }}
                className="btn btn-sm btn-primary rounded-pill fw-bold px-3 ms-auto shadow-sm flex-shrink-0 hover-efecto d-flex align-items-center gap-1"
              >
                <i className="bi bi-compass-fill"></i> Ver Orientación Inicial
              </button>
            </div>
          </div>

          <div className="row g-3">
            {accesosPermitidos.map((acceso) => (
              <div key={acceso.vista} className="col-6 col-md-4 col-lg-2">
                <button
                  onClick={() => navigate(acceso.ruta)}
                  className="btn btn-light w-100 p-3 rounded-4 shadow-sm border text-start d-flex flex-column justify-content-between h-100 hover-efecto position-relative overflow-hidden"
                  style={{ transition: 'all 0.3s', backgroundColor: acceso.btnBg, borderColor: acceso.btnBorder }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2 w-100">
                    <div className={`${acceso.iconBg} rounded-3 d-flex align-items-center justify-content-center shadow-sm flex-shrink-0`} style={{ width: '42px', height: '42px', fontSize: '1.3rem' }}>
                      <i className={`bi ${acceso.icono}`}></i>
                    </div>
                    <span className={`badge ${acceso.badgeColor} small shadow-sm`} style={{ fontSize: '0.65rem' }}>{acceso.badge}</span>
                  </div>
                  <div className="mt-2">
                    <div className={`${acceso.textClass} small mb-0`}>{acceso.vista}</div>
                    <small className="text-muted d-block text-truncate" style={{ fontSize: '0.7rem' }}>{acceso.subtitulo}</small>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Organigrama */}
      <div className="barra-organigrama shadow-sm mb-2 rounded-4 p-4 d-flex justify-content-between align-items-center flex-wrap gap-3" style={{ background: 'white' }}>
        <div className="d-flex align-items-center">
          <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex justify-content-center align-items-center me-3" style={{ width: '60px', height: '60px', fontSize: '1.8rem' }}>
            <i className="bi bi-diagram-3-fill"></i>
          </div>
          <div>
            <h4 className="fw-bold mb-1 text-dark" style={{ fontSize: '1.3rem' }}>Estructura Organizativa Institucional</h4>
            <p className="text-muted mb-0 d-none d-md-block">Consulte el mapa oficial de dependencias, la cadena supervisoria y el personal activo de ambas instituciones.</p>
          </div>
        </div>
        <button 
          className="btn btn-primary rounded-pill px-4 py-3 fw-bold shadow-sm hover-efecto" 
          onClick={() => navigate('/categoria/Organizaci%C3%B3n%20Escolar/Cadena%20Supervisoria')}
        >
          <i className="bi bi-search me-2"></i> Explorar Organigrama
        </button>
      </div>
    </div>
  );
};
