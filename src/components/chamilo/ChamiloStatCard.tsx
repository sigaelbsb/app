import React from 'react';

export interface ChamiloStatCardProps {
  id?: string;
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: string;
  customIcon?: React.ReactNode;
  color?: string;
  percentage?: number;
  statusBadge?: {
    text: string;
    type: 'success' | 'warning' | 'danger' | 'info';
  };
  breakdown?: {
    sb?: number | string;
    lb?: number | string;
  };
  actionButton?: {
    label: string;
    onClick?: () => void;
    icon?: string;
  };
  onClick?: () => void;
  children?: React.ReactNode;
}

export const ChamiloStatCard: React.FC<ChamiloStatCardProps> = ({
  id,
  title,
  value,
  subtitle,
  icon = 'bi-bar-chart',
  customIcon,
  color = '#0066FF',
  percentage,
  statusBadge,
  breakdown,
  actionButton,
  onClick,
  children
}) => {
  const getBadgeClass = () => {
    switch (statusBadge?.type) {
      case 'success':
        return 'badge bg-success bg-opacity-10 text-success border border-success border-opacity-25';
      case 'warning':
        return 'badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25';
      case 'danger':
        return 'badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25';
      case 'info':
      default:
        return 'badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25';
    }
  };

  return (
    <div
      id={id}
      className={`tech-card h-100 d-flex flex-column justify-content-between ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      style={{
        border: '1.5px solid #e2e8f0',
        borderTop: `4px solid ${color}`,
        backgroundColor: '#ffffff',
        borderRadius: '22px',
        padding: '22px',
        height: '100%',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
        <div style={{ flex: 1, minWidth: 0 }}>
          <span 
            className="text-muted extra-small fw-bold text-uppercase d-block" 
            style={{ fontSize: '0.68rem', letterSpacing: '0.5px', color: '#64748b' }}
          >
            {title}
          </span>
          <div className="fw-bolder mb-0 mt-0.5 text-dark" style={{ letterSpacing: '-0.3px' }}>
            {value}
          </div>
        </div>

        <div
          className="tech-icon-wrapper flex-shrink-0 d-flex align-items-center justify-content-center"
          style={{
            width: '46px',
            height: '46px',
            background: `linear-gradient(135deg, ${color}15 0%, ${color}28 100%)`,
            border: `1.5px solid ${color}40`,
            color: color,
            borderRadius: '14px',
            boxShadow: `0 6px 16px ${color}20`
          }}
        >
          {customIcon ? customIcon : <i className={`bi ${icon} fs-5`}></i>}
        </div>
      </div>

      {percentage !== undefined && (
        <div className="my-1.5">
          <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '0.68rem' }}>
            <span className="text-muted fw-semibold">Progreso Operativo</span>
            <span className="fw-bold" style={{ color: color }}>{percentage}%</span>
          </div>
          <div style={{ height: '6px', borderRadius: '10px', backgroundColor: '#f1f5f9', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <div
              style={{
                height: '100%',
                borderRadius: '10px',
                width: `${Math.min(100, Math.max(0, percentage))}%`,
                background: `linear-gradient(90deg, ${color} 0%, ${color}dd 100%)`,
                boxShadow: `0 0 8px ${color}60`,
                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            ></div>
          </div>
        </div>
      )}

      {children && (
        <div className="flex-grow-1 d-flex flex-column justify-content-center w-100 my-1">
          {children}
        </div>
      )}

      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-auto pt-2 border-top border-light">
        <div className="d-flex align-items-center gap-1.5 flex-wrap">
          {statusBadge && (
            <span className={`${getBadgeClass()} rounded-pill px-2 py-0.5 fw-bold`} style={{ fontSize: '0.67rem' }}>
              {statusBadge.text}
            </span>
          )}
          {subtitle && <small className="text-muted" style={{ fontSize: '0.70rem' }}>{subtitle}</small>}
        </div>

        {actionButton && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (actionButton.onClick) actionButton.onClick();
              else if (onClick) onClick();
            }}
            className="btn btn-xs rounded-pill px-2.5 py-0.5 fw-bold shadow-xs d-inline-flex align-items-center gap-1 hover-efecto ms-auto"
            style={{
              backgroundColor: `${color}15`,
              color: color,
              border: `1px solid ${color}40`,
              fontSize: '0.71rem'
            }}
          >
            {actionButton.icon && <i className={`bi ${actionButton.icon}`}></i>}
            <span>{actionButton.label}</span>
            <i className="bi bi-chevron-right extra-small opacity-75"></i>
          </button>
        )}

        {breakdown && (
          <div className="d-flex gap-1.5 extra-small ms-auto">
            {breakdown.sb !== undefined && (
              <span className="badge bg-light text-secondary border">SB: <b>{breakdown.sb}</b></span>
            )}
            {breakdown.lb !== undefined && (
              <span className="badge bg-light text-secondary border">LB: <b>{breakdown.lb}</b></span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default ChamiloStatCard;
