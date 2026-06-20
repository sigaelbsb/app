import { useEffect, useState } from 'react';
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
  const [escuelas, setEscuelas] = useState<EscuelaPerfil[]>([]);
  const [fechaTexto, setFechaTexto] = useState('Cargando fecha...');
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const { tieneAccesoEscuela, loading: permLoading } = usePermisos();

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
                  <h4 className="fw-bolder mb-3 text-white" id="lbl-nombre-escuela-lb" style={{ lineHeight: 1.2 }}>{lbData.nombre_institucion}</h4>
                  <p className="mb-3 d-flex align-items-center text-white opacity-75 small text-truncate">
                    <i className="bi bi-geo-alt-fill text-warning me-2"></i>
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
                      <div className="flip-card-front" style={{ padding: '1.5rem' }}>
                        <img src="/assets/img/3.png" alt="Misión" className="img-fluid mb-2" style={{ height: '150px' }} />
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
                      <div className="flip-card-front" style={{ padding: '1.5rem' }}>
                        <img src="/assets/img/4.png" alt="Visión" className="img-fluid mb-2" style={{ height: '150px' }} />
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
                      <div className="flip-card-front" style={{ padding: '1.5rem' }}>
                        <img src="/assets/img/5.png" alt="Valores" className="img-fluid mb-2" style={{ height: '150px' }} />
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
                      <div className="flip-card-front" style={{ padding: '1.5rem' }}>
                        <img src="/assets/img/6.png" alt="PEIC" className="img-fluid mb-2" style={{ height: '150px' }} />
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
                  <h4 className="fw-bolder mb-3 text-white" id="lbl-nombre-escuela-sb" style={{ lineHeight: 1.2 }}>{sbData.nombre_institucion}</h4>
                  <p className="mb-3 d-flex align-items-center text-white opacity-75 small text-truncate">
                    <i className="bi bi-geo-alt-fill text-warning me-2"></i>
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
                      <div className="flip-card-front" style={{ padding: '1.5rem' }}>
                        <img src="/assets/img/3.png" alt="Misión" className="img-fluid mb-2" style={{ height: '150px' }} />
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
                      <div className="flip-card-front" style={{ padding: '1.5rem' }}>
                        <img src="/assets/img/4.png" alt="Visión" className="img-fluid mb-2" style={{ height: '150px' }} />
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
                      <div className="flip-card-front" style={{ padding: '1.5rem' }}>
                        <img src="/assets/img/5.png" alt="Valores" className="img-fluid mb-2" style={{ height: '150px' }} />
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
                      <div className="flip-card-front" style={{ padding: '1.5rem' }}>
                        <img src="/assets/img/6.png" alt="PEIC" className="img-fluid mb-2" style={{ height: '150px' }} />
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
          onClick={() => {
            if ((window as any).Swal) {
              (window as any).Swal.fire({
                title: 'Módulo en Migración',
                text: 'El módulo de Estructura Organizativa / Organigrama se encuentra en proceso de migración.',
                icon: 'info',
                confirmButtonColor: 'var(--color-primario)'
              });
            } else {
              alert('El módulo de Estructura Organizativa / Organigrama se encuentra en proceso de migración.');
            }
          }}
        >
          <i className="bi bi-search me-2"></i> Explorar Organigrama
        </button>
      </div>
    </div>
  );
};
