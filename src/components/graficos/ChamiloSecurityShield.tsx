import React, { useState } from 'react';

interface ChamiloSecurityShieldProps {
  protectionScore?: number; // 0 to 100
  activeSessions?: number;
  twoFactorEnabled?: boolean;
  backupStatus?: 'al-dia' | 'pendiente' | 'proceso';
  lastAudit?: string;
  roleName?: string;
  darkTheme?: boolean;
}

export const ChamiloSecurityShield: React.FC<ChamiloSecurityShieldProps> = ({
  protectionScore = 98,
  activeSessions = 3,
  twoFactorEnabled = true,
  backupStatus = 'al-dia',
  lastAudit = 'Hoy 08:00 AM',
  roleName = 'Superadmin / Rector',
  darkTheme = true,
}) => {
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);

  // SVG parameters for radial gauge arc
  const radius = 32;
  const strokeWidth = 5.5;
  const circumference = 2 * Math.PI * radius;
  // We use a 240-degree arc
  const arcLength = circumference * (240 / 360);
  const strokeDashoffset = arcLength - (arcLength * (protectionScore / 100));

  return (
    <div style={{ width: '100%', marginTop: '4px', userSelect: 'none' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.72rem',
            fontWeight: 700,
            background: darkTheme ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
            color: darkTheme ? '#818cf8' : '#4f46e5',
            border: `1px solid ${darkTheme ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.25)'}`
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Nivel Alto
          </span>
          <span style={{ fontSize: '0.73rem', color: darkTheme ? '#94a3b8' : '#64748b', fontWeight: 500 }}>
            {roleName}
          </span>
        </div>

        <div style={{ fontSize: '0.72rem', color: darkTheme ? '#94a3b8' : '#64748b' }}>
          Auditoría: <strong style={{ color: darkTheme ? '#f8fafc' : '#0f172a' }}>{lastAudit}</strong>
        </div>
      </div>

      {/* Main Gauge & Badges Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: darkTheme ? 'rgba(11, 18, 36, 0.75)' : 'rgba(248, 250, 252, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: '12px',
        padding: '8px 12px',
        border: darkTheme ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
        gap: '12px'
      }}>
        {/* Radial Arc Gauge */}
        <div style={{ position: 'relative', width: '74px', height: '62px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="74" height="62" viewBox="0 0 80 72" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <filter id="shieldGlow">
                <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#818cf8" floodOpacity="0.5" />
              </filter>
            </defs>

            {/* Background Arc */}
            <circle
              cx="40"
              cy="36"
              r={radius}
              fill="none"
              stroke={darkTheme ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              transform="rotate(150 40 36)"
            />

            {/* Foreground Arc */}
            <circle
              cx="40"
              cy="36"
              r={radius}
              fill="none"
              stroke="url(#shieldGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(150 40 36)"
              filter="url(#shieldGlow)"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>

          {/* Center text */}
          <div style={{
            position: 'absolute',
            top: '52%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: darkTheme ? '#ffffff' : '#0f172a', lineHeight: 1 }}>
              {protectionScore}%
            </div>
            <div style={{ fontSize: '0.58rem', fontWeight: 700, color: '#34d399', marginTop: '2px', textTransform: 'uppercase' }}>
              SEGURO
            </div>
          </div>
        </div>

        {/* Security Feature Pills */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {/* Item 1: 2FA */}
          <div
            onMouseEnter={() => setHoveredBadge('2fa')}
            onMouseLeave={() => setHoveredBadge(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
              padding: '3px 8px',
              borderRadius: '6px',
              background: hoveredBadge === '2fa' ? (darkTheme ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9') : 'transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: darkTheme ? '#e2e8f0' : '#334155' }}>
              <span style={{ color: '#34d399' }}>✓</span> 2FA Token Biométrico
            </span>
            <span style={{ fontWeight: 700, color: '#34d399', fontSize: '0.68rem' }}>
              {twoFactorEnabled ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          {/* Item 2: Cifrado */}
          <div
            onMouseEnter={() => setHoveredBadge('aes')}
            onMouseLeave={() => setHoveredBadge(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
              padding: '3px 8px',
              borderRadius: '6px',
              background: hoveredBadge === 'aes' ? (darkTheme ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9') : 'transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: darkTheme ? '#e2e8f0' : '#334155' }}>
              <span style={{ color: '#818cf8' }}>🔒</span> Cifrado SSL / AES-256
            </span>
            <span style={{ fontWeight: 700, color: '#818cf8', fontSize: '0.68rem' }}>
              Blindado
            </span>
          </div>

          {/* Item 3: Sesiones Activas */}
          <div
            onMouseEnter={() => setHoveredBadge('sessions')}
            onMouseLeave={() => setHoveredBadge(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
              padding: '3px 8px',
              borderRadius: '6px',
              background: hoveredBadge === 'sessions' ? (darkTheme ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9') : 'transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: darkTheme ? '#e2e8f0' : '#334155' }}>
              <span style={{ color: '#38bdf8' }}>💻</span> Dispositivos en Línea
            </span>
            <span style={{ fontWeight: 700, color: darkTheme ? '#ffffff' : '#0f172a', fontSize: '0.68rem' }}>
              {activeSessions} sesiones
            </span>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.7rem', color: darkTheme ? '#94a3b8' : '#64748b' }}>
        <span>Copia de Respaldo: <strong style={{ color: backupStatus === 'al-dia' ? '#34d399' : backupStatus === 'proceso' ? '#38bdf8' : '#f59e0b' }}>{backupStatus === 'al-dia' ? 'En la Nube' : backupStatus === 'proceso' ? 'Sincronizando' : 'Pendiente'}</strong></span>
        <span style={{ color: '#818cf8', fontWeight: 600 }}>Permisos OK</span>
      </div>
    </div>
  );
};
export default ChamiloSecurityShield;
