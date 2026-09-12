import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export interface MoodleHeaderProps {
  title: string;
  subtitle?: string;
  category?: string;
  icon?: string;
  escuelaCodigo?: string;
  modoEdicion?: boolean;
  onToggleModoEdicion?: (activo: boolean) => void;
  stats?: Array<{ label: string; value: string | number; icon?: string; color?: string }>;
  activeTab?: string;
}

export const MoodleHeader: React.FC<MoodleHeaderProps> = ({
  title,
  subtitle = 'Gestión del personal, puestos de trabajo, cadena supervisoria y colectivos pedagógicos.',
  category = 'Organización Escolar',
  icon = 'bi-diagram-3-fill',
  escuelaCodigo = localStorage.getItem('sigae_escuela_codigo') || 'sb',
  modoEdicion = true,
  onToggleModoEdicion,
  stats = []
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Cargos Institucionales', path: '/categoria/Organizaci%C3%B3n%20Escolar/Cargos%20Institucionales', icon: 'bi-briefcase-fill' },
    { label: 'Cadena Supervisoria', path: '/categoria/Organizaci%C3%B3n%20Escolar/Cadena%20Supervisoria', icon: 'bi-diagram-2-fill' },
    { label: 'Gestión de Colectivos', path: '/categoria/Organizaci%C3%B3n%20Escolar/Gesti%C3%B3n%20de%20Colectivos', icon: 'bi-people-fill' },
    { label: 'Estructura Empresa', path: '/categoria/Organizaci%C3%B3n%20Escolar/Estructura%20Empresa', icon: 'bi-buildings-fill' }
  ];

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white border-top border-4" style={{ borderColor: '#F98012' }}>
      <div className="p-4 p-md-5">
        <div className="row align-items-center g-4">
          
          {/* Logo / Escudo con badge Moodle */}
          <div className="col-12 col-md-auto text-center text-md-start">
            <div className="position-relative d-inline-block">
              <div className="rounded-4 p-2 bg-light border d-inline-flex align-items-center justify-content-center shadow-xs" style={{ width: '105px', height: '105px' }}>
                <img 
                  src={`/assets/img/logo_${escuelaCodigo}.png`} 
                  alt="Escudo Institucional" 
                  className="img-fluid"
                  style={{ maxHeight: '85px', objectFit: 'contain' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                />
              </div>
              <span className="position-absolute bottom-0 end-0 badge rounded-pill text-white fw-bold shadow-xs extra-small" style={{ backgroundColor: '#F98012', fontSize: '0.65rem' }}>
                MOODLE
              </span>
            </div>
          </div>

          {/* Título y Métricas */}
          <div className="col-12 col-md">
            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <span className="badge text-white fw-bold px-3 py-1.5 rounded-pill small" style={{ backgroundColor: '#F98012' }}>
                <i className={`bi ${icon} me-1.5`}></i>{category}
              </span>
              {stats.map((stat, idx) => (
                <span key={idx} className="badge bg-light text-dark border px-2.5 py-1.5 rounded-pill small fw-bold">
                  {stat.icon && <i className={`bi ${stat.icon} ${stat.color || 'text-primary'} me-1`}></i>}
                  {stat.label}: <b>{stat.value}</b>
                </span>
              ))}
            </div>

            <h1 className="fw-bolder mb-1.5 text-dark" style={{ fontSize: 'calc(1.5rem + 0.7vw)', letterSpacing: '-0.5px' }}>
              {title}
            </h1>

            <p className="mb-0 text-muted small">
              {subtitle}
            </p>
          </div>

          {/* Modo de Edición Moodle & Retorno */}
          <div className="col-12 col-md-auto text-md-end text-center">
            <div className="d-flex flex-column flex-md-row align-items-center justify-content-md-end gap-2.5">
              {onToggleModoEdicion && (
                <div className="d-flex align-items-center gap-2 px-3 py-1.5 rounded-pill bg-light border shadow-xs">
                  <span className="extra-small fw-bold text-dark">Modo edición</span>
                  <div className="form-check form-switch mb-0 fs-5">
                    <input
                      className="form-check-input hover-mano"
                      type="checkbox"
                      role="switch"
                      checked={modoEdicion}
                      onChange={(e) => onToggleModoEdicion(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => navigate('/categoria/Organizaci%C3%B3n%20Escolar')}
                className="btn btn-light rounded-pill px-3.5 py-2 fw-bold text-muted d-inline-flex align-items-center gap-1.5 hover-efecto shadow-xs"
                style={{ fontSize: '0.82rem' }}
              >
                <i className="bi bi-grid-fill text-warning"></i>
                <span>Menú Moodle</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Pestañas de Navegación Secundaria de Moodle 4.x */}
      <div className="px-4 py-2.5 bg-light border-top d-flex justify-content-start align-items-center flex-wrap gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname.includes(item.path) || location.pathname.endsWith(encodeURIComponent(item.label));
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.path)}
              className={`btn btn-xs rounded-pill px-3 py-1.5 fw-bold transition-all ${
                isActive 
                  ? 'btn-dark text-white shadow-xs' 
                  : 'btn-white bg-white text-muted border hover-efecto'
              }`}
              style={{ 
                fontSize: '0.82rem',
                backgroundColor: isActive ? '#0F172A' : undefined,
                borderColor: isActive ? '#0F172A' : undefined
              }}
            >
              <i className={`bi ${item.icon} me-1.5 ${isActive ? 'text-warning' : 'text-muted'}`}></i>
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
