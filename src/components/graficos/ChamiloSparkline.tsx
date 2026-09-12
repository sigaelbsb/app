import React, { useState } from 'react';

export interface SparklinePoint {
  label: string;
  value: number;
  sublabel?: string;
}

interface ChamiloSparklineProps {
  data: SparklinePoint[];
  height?: number;
  color?: string;
  gradientId?: string;
  showPoints?: boolean;
}

export const ChamiloSparkline: React.FC<ChamiloSparklineProps> = ({
  data,
  height = 90,
  color = '#0066FF',
  gradientId = 'chamilo-sparkline-grad',
  showPoints = true
}) => {
  const [activePoint, setActivePoint] = useState<SparklinePoint | null>(null);
  const [activeX, setActiveX] = useState<number | null>(null);

  if (!data || data.length < 2) {
    return <div className="text-muted extra-small text-center py-3">Datos insuficientes</div>;
  }

  const values = data.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = (maxVal - minVal) || 1;

  const width = 320;
  const paddingX = 20;
  const paddingTop = 15;
  const paddingBottom = 25;
  const chartHeight = height - paddingTop - paddingBottom;

  // Coordenadas calculadas
  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * (width - paddingX * 2);
    const y = paddingTop + chartHeight - ((d.value - minVal) / range) * chartHeight;
    return { x, y, ...d };
  });

  // Generar curva Bezier suave (catmull-rom o cubic bezier)
  const pathD = points.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = arr[i - 1];
    const cpx1 = prev.x + (point.x - prev.x) / 2;
    const cpy1 = prev.y;
    const cpx2 = prev.x + (point.x - prev.x) / 2;
    const cpy2 = point.y;
    return `${acc} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${point.x} ${point.y}`;
  }, '');

  // Path cerrado para el gradiente
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom + 5} L ${points[0].x} ${height - paddingBottom + 5} Z`;

  return (
    <div className="position-relative w-100">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-100 overflow-visible"
        style={{ height: `${height}px` }}
        onMouseLeave={() => { setActivePoint(null); setActiveX(null); }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Área sombreada */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Línea principal */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Puntos y etiquetas de eje X */}
        {points.map((p, i) => {
          const isActive = activePoint?.label === p.label;
          return (
            <g key={i} className="cursor-pointer">
              {/* Línea vertical guía en hover */}
              {isActive && (
                <line
                  x1={p.x}
                  y1={paddingTop}
                  x2={p.x}
                  y2={height - paddingBottom}
                  stroke={color}
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.6"
                />
              )}

              {/* Punto circular */}
              {showPoints && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isActive ? 6 : 4}
                  fill="#ffffff"
                  stroke={color}
                  strokeWidth={isActive ? 3 : 2}
                  style={{ transition: 'all 0.2s ease' }}
                  onMouseEnter={() => { setActivePoint(p); setActiveX(p.x); }}
                  onTouchStart={() => { setActivePoint(p); setActiveX(p.x); }}
                />
              )}

              {/* Texto del día / etiqueta en eje X */}
              <text
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                fontSize="10"
                fontWeight={isActive ? "700" : "600"}
                fill={isActive ? color : "#94a3b8"}
              >
                {p.label}
              </text>

              {/* Zona invisible más grande para touch amigable */}
              <rect
                x={p.x - 15}
                y={0}
                width={30}
                height={height}
                fill="transparent"
                onMouseEnter={() => { setActivePoint(p); setActiveX(p.x); }}
                onTouchStart={() => { setActivePoint(p); setActiveX(p.x); }}
              />
            </g>
          );
        })}
      </svg>

      {/* Tooltip dinámico de alta tecnología */}
      {activePoint && activeX !== null && (
        <div
          className="position-absolute bg-dark text-white rounded-pill px-2.5 py-1 extra-small shadow-sm animate__animated animate__fadeIn animate__faster pointer-events-none d-flex align-items-center gap-1.5"
          style={{
            top: '0px',
            left: `${(activeX / width) * 100}%`,
            transform: 'translateX(-50%)',
            fontSize: '0.72rem',
            whiteSpace: 'nowrap',
            zIndex: 10
          }}
        >
          <span className="text-white-50">{activePoint.label}:</span>
          <strong className="text-warning">{activePoint.value}</strong>
          {activePoint.sublabel && <span className="text-white-50">({activePoint.sublabel})</span>}
        </div>
      )}
    </div>
  );
};
