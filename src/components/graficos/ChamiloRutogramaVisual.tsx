import React, { useState } from 'react';

export interface RouteStop {
  id: string;
  name: string;
  time: string;
  status: 'passed' | 'current' | 'upcoming';
  studentsCount?: number;
}

interface ChamiloRutogramaVisualProps {
  routeName?: string;
  busNumber?: string;
  occupancyPercent?: number;
  percentLabel?: string;
  statusText?: string;
  nextStopName?: string;
  stops?: RouteStop[];
  accentColor?: string;
  darkTheme?: boolean;
}

export const ChamiloRutogramaVisual: React.FC<ChamiloRutogramaVisualProps> = ({
  routeName = 'Ruta R-01 • Escolar Matutino',
  busNumber = 'Unidad 04',
  occupancyPercent = 94,
  percentLabel = 'avance',
  statusText = 'En Ruta',
  nextStopName,
  stops = [
    { id: '1', name: 'Base Terminal', time: '06:30 AM', status: 'passed', studentsCount: 0 },
    { id: '2', name: 'Parada Miraflores', time: '06:55 AM', status: 'current', studentsCount: 18 },
    { id: '3', name: 'Plantel Educativo', time: '07:20 AM', status: 'upcoming', studentsCount: 32 },
  ],
  accentColor = '#f59e0b',
  darkTheme = true,
}) => {
  const [activeStop, setActiveStop] = useState<RouteStop | null>(null);

  // Calcular posición dinámica de la línea de avance según la parada actual
  const currentIndex = stops.findIndex(s => s.status === 'current');
  const passedCount = stops.filter(s => s.status === 'passed').length;
  let progressX = 20;
  if (currentIndex >= 0) {
    progressX = 20 + currentIndex * ((300 - 20) / Math.max(1, stops.length - 1));
  } else if (passedCount === stops.length && stops.length > 0) {
    progressX = 300;
  } else if (passedCount > 0) {
    progressX = 20 + (passedCount - 1) * ((300 - 20) / Math.max(1, stops.length - 1));
  }

  const dotColor = statusText.toLowerCase().includes('ruta') || statusText.toLowerCase().includes('activa')
    ? '#10b981'
    : (statusText.toLowerCase().includes('final') || statusText.toLowerCase().includes('complet') ? '#3b82f6' : '#f59e0b');

  // Determinar parada próxima o en curso
  const upcomingStop = stops.find(s => s.status === 'upcoming');
  const currentStop = stops.find(s => s.status === 'current');
  const proximaCalculada = nextStopName || upcomingStop?.name || currentStop?.name || stops[stops.length - 1]?.name || 'Destino';

  return (
    <div style={{ width: '100%', marginTop: '4px', userSelect: 'none' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.68rem',
            fontWeight: 700,
            background: darkTheme ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.12)',
            color: darkTheme ? '#fbbf24' : '#b45309',
            border: `1px solid ${darkTheme ? 'rgba(245, 158, 11, 0.4)' : 'rgba(245, 158, 11, 0.25)'}`
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: dotColor,
              boxShadow: `0 0 8px ${dotColor}`,
              display: 'inline-block'
            }} />
            {busNumber} • {statusText}
          </span>
          <span style={{ fontSize: '0.70rem', color: darkTheme ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
            {routeName}
          </span>
        </div>

        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: darkTheme ? '#f8fafc' : '#0f172a' }}>
          <span style={{ color: accentColor }}>{occupancyPercent}%</span>
          <span style={{ fontSize: '0.66rem', color: darkTheme ? '#94a3b8' : '#64748b', fontWeight: 500, marginLeft: '3px' }}>{percentLabel}</span>
        </div>
      </div>

      {/* Visual Timeline SVG */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '52px',
        background: darkTheme ? 'rgba(11, 18, 36, 0.75)' : 'rgba(248, 250, 252, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: '12px',
        padding: '6px 14px',
        border: darkTheme ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center'
      }}>
        <svg viewBox="0 0 320 48" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          {/* Background Track Line */}
          <line
            x1="20"
            y1="24"
            x2="300"
            y2="24"
            stroke={darkTheme ? '#1e293b' : '#e2e8f0'}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Progress Active Track */}
          <line
            x1="20"
            y1="24"
            x2={progressX}
            y2="24"
            stroke="url(#routeGradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Stop Nodes */}
          {stops.map((stop, idx) => {
            const xPos = 20 + idx * ((300 - 20) / (stops.length - 1));
            const isPassed = stop.status === 'passed';
            const isCurrent = stop.status === 'current';

            return (
              <g
                key={stop.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setActiveStop(stop)}
                onMouseLeave={() => setActiveStop(null)}
              >
                {/* Pulse ring for current */}
                {isCurrent && (
                  <circle
                    cx={xPos}
                    cy="24"
                    r="11"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    opacity="0.8"
                    className="pulse-ring"
                  >
                    <animate
                      attributeName="r"
                      values="8;13;8"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.9;0.3;0.9"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Main Node Circle */}
                <circle
                  cx={xPos}
                  cy="24"
                  r={isCurrent ? '7.5' : '6'}
                  fill={isPassed ? '#10b981' : isCurrent ? '#f59e0b' : (darkTheme ? '#1e293b' : '#ffffff')}
                  stroke={isPassed ? '#10b981' : isCurrent ? '#d97706' : (darkTheme ? '#475569' : '#cbd5e1')}
                  strokeWidth="2.5"
                  filter={isCurrent ? 'url(#glowEffect)' : undefined}
                />

                {/* Inner dot for destination or passed */}
                {isPassed && (
                  <circle cx={xPos} cy="24" r="2.5" fill="#ffffff" />
                )}

                {/* Label text */}
                <text
                  x={xPos}
                  y="42"
                  textAnchor={idx === 0 ? 'start' : idx === stops.length - 1 ? 'end' : 'middle'}
                  fontSize="8.5"
                  fontWeight={isCurrent ? '700' : '500'}
                  fill={isCurrent ? '#fbbf24' : (darkTheme ? '#94a3b8' : '#64748b')}
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  {stop.name.length > 14 ? stop.name.slice(0, 13) + '…' : stop.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {activeStop && (
          <div style={{
            position: 'absolute',
            bottom: '48px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#030712',
            color: '#f8fafc',
            padding: '4px 10px',
            borderRadius: '8px',
            fontSize: '0.72rem',
            whiteSpace: 'nowrap',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span style={{ fontWeight: 700 }}>{activeStop.name}</span>
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ color: '#38bdf8' }}>{activeStop.time}</span>
            {activeStop.studentsCount !== undefined && (
              <>
                <span style={{ color: '#64748b' }}>•</span>
                <span style={{ color: '#fbbf24' }}>{activeStop.studentsCount} est.</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Progress Sub-Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.7rem', color: darkTheme ? '#94a3b8' : '#64748b' }}>
        <span>📍 Próxima: <strong style={{ color: darkTheme ? '#f8fafc' : '#0f172a' }}>{proximaCalculada}</strong></span>
        <span style={{ color: '#34d399', fontWeight: 600 }}>Puntual (+0 min)</span>
      </div>
    </div>
  );
};
export default ChamiloRutogramaVisual;
