import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  url?: string;
  icon?: string;
}

export interface ChamiloBreadcrumbProps {
  items?: BreadcrumbItem[];
  category?: string;
  currentModule?: string;
  currentCategoryUrl?: string;
  escuelaActiva?: string;
  onCambiarEscuela?: (escuela: 'sb' | 'lb') => void;
  showSchoolSelector?: boolean;
}

export const ChamiloBreadcrumb: React.FC<ChamiloBreadcrumbProps> = ({
  items,
  category,
  currentModule,
  currentCategoryUrl,
  escuelaActiva,
  onCambiarEscuela,
  showSchoolSelector = false
}) => {
  const navigate = useNavigate();
  const currentSchool = escuelaActiva || localStorage.getItem('sigae_escuela_codigo') || 'sb';

  // Construir lista de items si se pasaron category y currentModule
  const finalItems: BreadcrumbItem[] = items || [];
  if (!items && (category || currentModule)) {
    if (category) {
      finalItems.push({
        label: category,
        url: currentCategoryUrl || `/categoria/${encodeURIComponent(category)}`
      });
    }
    if (currentModule) {
      finalItems.push({
        label: currentModule
      });
    }
  }

  return (
    <nav aria-label="breadcrumb" className="chamilo-breadcrumb d-flex justify-content-between align-items-center flex-wrap mb-3">
      <div className="d-flex align-items-center flex-wrap gap-2">
        {/* Inicio siempre primero */}
        <span 
          onClick={() => navigate('/')} 
          className="chamilo-breadcrumb-item"
          title="Ir al Inicio Principal"
          style={{ cursor: 'pointer' }}
        >
          <i className="bi bi-house-door-fill text-primary"></i> Inicio
        </span>

        {finalItems.map((item, index) => {
          const isLast = index === finalItems.length - 1;
          return (
            <React.Fragment key={index}>
              <span className="chamilo-breadcrumb-separator">
                <i className="bi bi-chevron-right text-muted small"></i>
              </span>
              {isLast ? (
                <span className="chamilo-breadcrumb-item active fw-bold text-dark">
                  {item.icon && <i className={`bi ${item.icon} text-primary me-1`}></i>}
                  {item.label}
                </span>
              ) : (
                <span 
                  onClick={() => item.url && navigate(item.url)} 
                  className="chamilo-breadcrumb-item"
                  style={{ cursor: item.url ? 'pointer' : 'default' }}
                >
                  {item.icon && <i className={`bi ${item.icon} me-1`}></i>}
                  {item.label}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {showSchoolSelector && onCambiarEscuela && (
        <div className="d-flex align-items-center gap-1 ms-auto">
          <div className="btn-group bg-light p-1 rounded-pill border shadow-xs" style={{ fontSize: '0.78rem' }}>
            <button
              onClick={() => onCambiarEscuela('sb')}
              className={`btn btn-xs rounded-pill px-2.5 py-1 fw-bold ${currentSchool === 'sb' ? 'btn-success text-white shadow-xs' : 'btn-light text-muted border-0'}`}
              style={{ fontSize: '0.78rem' }}
            >
              Santa Bárbara
            </button>
            <button
              onClick={() => onCambiarEscuela('lb')}
              className={`btn btn-xs rounded-pill px-2.5 py-1 fw-bold ${currentSchool === 'lb' ? 'btn-primary text-white shadow-xs' : 'btn-light text-muted border-0'}`}
              style={{ fontSize: '0.78rem' }}
            >
              Libertador
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
