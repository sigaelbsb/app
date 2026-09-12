import React from 'react';

export interface ActionButtonItem {
  id?: string;
  label: string;
  icon: string;
  onClick?: () => void;
  variant?: 'primary' | 'success' | 'outline' | 'danger' | 'warning';
  disabled?: boolean;
  title?: string;
}

interface ChamiloActionBarProps {
  title?: string;
  subtitle?: string;
  actions?: ActionButtonItem[];
  secondaryActions?: ActionButtonItem[];
  children?: React.ReactNode;
}

export const ChamiloActionBar: React.FC<ChamiloActionBarProps> = ({
  title,
  subtitle,
  actions = [],
  secondaryActions = [],
  children
}) => {
  const getButtonClass = (variant: ActionButtonItem['variant'] = 'outline') => {
    switch (variant) {
      case 'primary':
        return 'chamilo-btn-action btn-primary-action';
      case 'success':
        return 'chamilo-btn-action btn-success-action';
      case 'danger':
        return 'chamilo-btn-action btn btn-danger text-white border-0';
      case 'warning':
        return 'chamilo-btn-action btn btn-warning text-dark border-0';
      default:
        return 'chamilo-btn-action btn-outline-action';
    }
  };

  return (
    <div className="chamilo-action-bar animate__animated animate__fadeIn">
      {/* Título o información contextual izquierda */}
      {(title || subtitle) && (
        <div className="d-flex flex-column me-auto">
          {title && <h6 className="mb-0 fw-bold text-dark">{title}</h6>}
          {subtitle && <small className="text-muted" style={{ fontSize: '0.78rem' }}>{subtitle}</small>}
        </div>
      )}

      {/* Contenido personalizado (por ejemplo inputs de búsqueda o filtros) */}
      {children && <div className="d-flex align-items-center gap-2 flex-grow-1">{children}</div>}

      {/* Grupo de botones principales */}
      <div className="chamilo-action-group ms-auto">
        {secondaryActions.map((act, i) => (
          <button
            key={`sec-${i}`}
            id={act.id}
            onClick={act.onClick}
            disabled={act.disabled}
            className={getButtonClass(act.variant || 'outline')}
            title={act.title || act.label}
          >
            <i className={`bi ${act.icon}`}></i>
            <span>{act.label}</span>
          </button>
        ))}

        {actions.map((act, i) => (
          <button
            key={`pri-${i}`}
            id={act.id}
            onClick={act.onClick}
            disabled={act.disabled}
            className={getButtonClass(act.variant || 'primary')}
            title={act.title || act.label}
          >
            <i className={`bi ${act.icon}`}></i>
            <span>{act.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
