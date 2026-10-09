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
  const [isHovered, setIsHovered] = React.useState(false);

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
      className={`tech-card h-100 d-flex flex-column position-relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={onClick ? 'button' : undefined}
      style={{
        border: `1.8px solid ${isHovered ? color : `${color}28`}`,
        background: isHovered 
          ? `linear-gradient(180deg, ${color}12 0%, #ffffff 45%, #ffffff 100%)` 
          : `linear-gradient(180deg, ${color}08 0%, #ffffff 40%, #ffffff 100%)`,
        borderRadius: '20px',
        padding: 'clamp(12px, 2vw, 16px)',
        height: '100%',
        boxShadow: isHovered 
          ? `0 18px 38px -8px ${color}35, 0 4px 14px rgba(15, 23, 42, 0.05)`
          : `0 4px 18px ${color}10, 0 1px 3px rgba(15, 23, 42, 0.03)`,
        transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'all 0.32s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Barra superior luminosa con degradado */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${color} 0%, ${color}99 100%)`,
          boxShadow: isHovered ? `0 0 16px ${color}` : `0 0 8px ${color}60`,
          transition: 'box-shadow 0.3s ease'
        }}
      />

      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="d-flex align-items-center gap-1.5 mb-1">
            <span 
              className="badge rounded-pill fw-bold text-uppercase d-inline-flex align-items-center gap-1 shadow-2xs text-nowrap" 
              style={{ 
                fontSize: '0.66rem', 
                letterSpacing: '0.4px', 
                backgroundColor: `${color}15`, 
                color: color,
                border: `1px solid ${color}35`,
                padding: '3px 8px'
              }}
            >
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }}></span>
              {title}
            </span>
          </div>
          <div className="fw-bolder mb-0 mt-0.5 text-dark" style={{ letterSpacing: '-0.3px' }}>
            {value}
          </div>
        </div>

        <div className="position-relative flex-shrink-0 d-inline-flex align-items-center justify-content-center">
          <div 
            style={{ 
              position: 'absolute', 
              inset: '-4px', 
              borderRadius: '16px', 
              background: `radial-gradient(circle, ${color}50 0%, transparent 70%)`,
              opacity: isHovered ? 0.95 : 0.5,
              filter: 'blur(8px)',
              transition: 'opacity 0.3s ease'
            }} 
          />
          <div
            className="tech-icon-wrapper position-relative d-flex align-items-center justify-content-center"
            style={{
              width: 'clamp(42px, 3.5vw, 48px)',
              height: 'clamp(42px, 3.5vw, 48px)',
              minWidth: 'clamp(42px, 3.5vw, 48px)',
              minHeight: 'clamp(42px, 3.5vw, 48px)',
              background: customIcon 
                ? 'radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(240, 249, 255, 0.85) 100%)' 
                : `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
              border: customIcon ? `1.5px solid ${color}35` : 'none',
              color: '#ffffff',
              borderRadius: '14px',
              boxShadow: isHovered ? `0 8px 20px ${color}50` : `0 4px 12px ${color}25`,
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: isHovered ? 'scale(1.08) rotate(2deg)' : 'scale(1)'
            }}
          >
            {customIcon ? customIcon : <i className={`bi ${icon} fs-5`}></i>}
          </div>
        </div>
      </div>

      {percentage !== undefined && (
        <div className="my-1.5">
          <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '0.68rem' }}>
            <span className="text-muted fw-semibold">Progreso Operativo</span>
            <span className="fw-bold" style={{ color: color }}>{percentage}%</span>
          </div>
          <div style={{ height: '6px', borderRadius: '10px', backgroundColor: `${color}15`, overflow: 'hidden', border: `1px solid ${color}25` }}>
            <div
              style={{
                height: '100%',
                borderRadius: '10px',
                width: `${Math.min(100, Math.max(0, percentage))}%`,
                background: `linear-gradient(90deg, ${color} 0%, ${color}ee 100%)`,
                boxShadow: isHovered ? `0 0 12px ${color}` : `0 0 6px ${color}70`,
                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            ></div>
          </div>
        </div>
      )}

      {children && (
        <div className="w-100 my-1 py-0.5">
          {children}
        </div>
      )}

      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-auto pt-1.5 border-top border-light">
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
            className="btn btn-xs rounded-pill px-2.5 py-1 fw-bold shadow-xs d-inline-flex align-items-center gap-1.5 hover-efecto ms-auto transition-all"
            style={{
              backgroundColor: isHovered ? color : `${color}18`,
              color: isHovered ? '#ffffff' : color,
              border: `1px solid ${color}40`,
              fontSize: '0.71rem',
              boxShadow: isHovered ? `0 4px 12px ${color}40` : 'none',
              transition: 'all 0.25s ease'
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
