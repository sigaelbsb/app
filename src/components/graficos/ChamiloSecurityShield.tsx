import React from 'react';

interface ChamiloSecurityShieldProps {
  protectionScore?: number; // 0 to 100
  activeSessions?: number;
  deviceSummary?: string;
  twoFactorEnabled?: boolean;
  backupStatus?: 'al-dia' | 'pendiente' | 'proceso';
  lastAudit?: string;
  roleName?: string;
  darkTheme?: boolean;
}

export const ChamiloSecurityShield: React.FC<ChamiloSecurityShieldProps> = ({
  protectionScore = 100,
  activeSessions = 2,
  deviceSummary,
  twoFactorEnabled = true,
  backupStatus = 'al-dia',
  lastAudit = 'Hoy Activa',
  darkTheme = false,
}) => {
  const size = 78;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (protectionScore / 100) * circumference;

  return (
    <div className="w-100 d-flex align-items-center justify-content-between gap-2.5 my-1" style={{ userSelect: 'none', minHeight: '82px' }}>
      {/* ── GRÁFICO 1: RADIAL SECURITY GAUGE CON GLOW Y ANIMACIÓN ── */}
      <div className="position-relative flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible" style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <filter id="shieldGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0284c7" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Anillo de fondo */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={darkTheme ? 'rgba(255, 255, 255, 0.08)' : 'rgba(2, 132, 199, 0.12)'}
            strokeWidth={strokeWidth}
          />

          {/* Anillo de progreso animado */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="url(#shieldGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#shieldGlowFilter)"
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />
        </svg>

        {/* Centro del radar de seguridad */}
        <div 
          className="position-absolute text-center d-flex flex-column align-items-center justify-content-center"
          style={{ inset: 0 }}
        >
          <span className="fw-black text-dark" style={{ fontSize: '0.98rem', lineHeight: 1, letterSpacing: '-0.5px' }}>
            {protectionScore}%
          </span>
          <span 
            className="fw-bold text-uppercase mt-0.5" 
            style={{ 
              fontSize: '0.52rem', 
              letterSpacing: '0.4px', 
              color: '#0284c7',
              lineHeight: 1
            }}
          >
            Blindado
          </span>
        </div>
      </div>

      {/* ── CUADRÍCULA 2x2 DE PARÁMETROS CRÍTICOS DE ACCESO ── */}
      <div className="flex-grow-1 d-flex flex-column justify-content-between gap-1" style={{ minWidth: 0 }}>
        {/* Fila 1: 2FA & Cifrado */}
        <div className="d-flex gap-1">
          <div 
            className="p-1 px-1.5 rounded-2 border bg-white flex-grow-1 d-flex align-items-center justify-content-between shadow-2xs hover-efecto"
            style={{ borderColor: 'rgba(16, 185, 129, 0.25)', minWidth: 0 }}
          >
            <span className="text-secondary text-truncate me-1" style={{ fontSize: '0.62rem' }}>
              <i className="bi bi-shield-check text-success me-1"></i>2FA Token
            </span>
            <strong className="text-success" style={{ fontSize: '0.68rem' }}>{twoFactorEnabled ? 'Activo' : 'Off'}</strong>
          </div>

          <div 
            className="p-1 px-1.5 rounded-2 border bg-white flex-grow-1 d-flex align-items-center justify-content-between shadow-2xs hover-efecto"
            style={{ borderColor: 'rgba(2, 132, 199, 0.25)', minWidth: 0 }}
          >
            <span className="text-secondary text-truncate me-1" style={{ fontSize: '0.62rem' }}>
              <i className="bi bi-key-fill text-primary me-1"></i>SSL
            </span>
            <strong className="text-primary" style={{ fontSize: '0.68rem' }}>AES-256</strong>
          </div>
        </div>

        {/* Fila 2: Sesiones Activas & Nube */}
        <div className="d-flex gap-1">
          <div 
            className="p-1 px-1.5 rounded-2 border bg-white flex-grow-1 d-flex align-items-center justify-content-between shadow-2xs hover-efecto"
            style={{ borderColor: 'rgba(14, 165, 233, 0.25)', minWidth: 0 }}
          >
            <span className="text-secondary text-truncate me-1" style={{ fontSize: '0.62rem' }}>
              <i className="bi bi-laptop text-info me-1"></i>Sesiones
            </span>
            <strong className="text-dark text-nowrap" style={{ fontSize: '0.68rem' }} title={deviceSummary || `${activeSessions} sesiones activas`}>
              {activeSessions} {activeSessions === 1 ? 'activa' : 'activas'}
            </strong>
          </div>

          <div 
            className="p-1 px-1.5 rounded-2 border bg-white flex-grow-1 d-flex align-items-center justify-content-between shadow-2xs hover-efecto"
            style={{ borderColor: 'rgba(13, 148, 136, 0.25)', minWidth: 0 }}
          >
            <span className="text-secondary text-truncate me-1" style={{ fontSize: '0.62rem' }}>
              <i className="bi bi-cloud-check-fill me-1" style={{ color: '#0d9488' }}></i>Cloud
            </span>
            <strong style={{ fontSize: '0.68rem', color: '#0d9488' }}>{backupStatus === 'al-dia' ? 'Al día' : 'Pend.'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChamiloSecurityShield;
