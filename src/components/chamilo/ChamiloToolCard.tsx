import React from 'react';

export interface ChamiloToolCardProps {
  id?: string;
  title: string;
  description: string;
  icon?: string;
  customIcon?: React.ReactNode;
  categoryColor?: string;
  badgeText?: string;
  badgeType?: 'active' | 'pending' | 'locked' | 'info';
  isRestricted?: boolean;
  tag?: string;
  hint?: string;
  onClick: () => void;
}

export const ChamiloToolCard: React.FC<ChamiloToolCardProps> = ({
  id,
  title,
  description,
  icon = 'bi-gear-fill',
  customIcon,
  categoryColor = '#0066FF',
  badgeText,
  badgeType = 'active',
  isRestricted = false,
  tag,
  hint,
  onClick
}) => {
  const getBadgeClass = () => {
    switch (badgeType) {
      case 'active':
        return 'chamilo-status-badge status-active';
      case 'pending':
        return 'chamilo-status-badge status-pending';
      case 'locked':
        return 'chamilo-status-badge status-locked';
      case 'info':
      default:
        return 'chamilo-status-badge status-info';
    }
  };

  return (
    <div
      id={id}
      className={`chamilo-tool-card position-relative ${isRestricted ? 'opacity-75' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      style={{
        '--card-cat-color': categoryColor
      } as React.CSSProperties}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Micro-etiqueta tecnológica superior si existe */}
      {tag && (
        <span 
          className="position-absolute top-0 end-0 m-3 px-2 py-0.5 rounded-pill fw-bold"
          style={{
            fontSize: '0.68rem',
            letterSpacing: '0.5px',
            backgroundColor: `${categoryColor}15`,
            color: categoryColor,
            border: `1px solid ${categoryColor}30`,
            backdropFilter: 'blur(4px)'
          }}
        >
          {tag}
        </span>
      )}

      {/* Icono de herramienta con fondo circular tintado y micro-sombra */}
      <div
        className="chamilo-tool-icon-wrapper"
        style={{
          backgroundColor: `${categoryColor}15`,
          color: categoryColor,
          border: `1px solid ${categoryColor}30`,
          boxShadow: `0 8px 20px ${categoryColor}20`
        }}
      >
        {customIcon ? (
          customIcon
        ) : (
          <i className={`bi ${icon}`}></i>
        )}
      </div>

      {/* Título de la herramienta */}
      <h6 className="chamilo-tool-title">{title}</h6>

      {/* Badge de estado si existe */}
      {badgeText && (
        <div className="mb-2">
          <span className={getBadgeClass()}>{badgeText}</span>
        </div>
      )}

      {/* Descripción concisa */}
      <p className="chamilo-tool-desc">{description}</p>

      {/* Sub-información / Hint institucional si existe */}
      {hint && (
        <div className="w-100 mb-2.5">
          <div 
            className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill extra-small text-truncate w-100 justify-content-center"
            style={{ 
              fontSize: '0.72rem', 
              color: '#64748b', 
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontWeight: '600'
            }}
            title={hint}
          >
            <i className="bi bi-info-circle-fill flex-shrink-0" style={{ color: categoryColor, fontSize: '0.7rem' }}></i>
            <span className="text-truncate">{hint}</span>
          </div>
        </div>
      )}

      {/* Botón de acceso de la herramienta */}
      <button className="chamilo-tool-btn" tabIndex={-1}>
        <span>{isRestricted ? 'Acceso Restringido' : 'Abrir Herramienta'}</span>
        <i className={`bi ${isRestricted ? 'bi-lock-fill' : 'bi-arrow-right-short'} fs-5`}></i>
      </button>
    </div>
  );
};
