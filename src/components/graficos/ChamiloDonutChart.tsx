import React, { useState } from 'react';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
  sublabel?: string;
}

interface ChamiloDonutChartProps {
  segments?: DonutSegment[];
  total?: number;
  size?: number;
  strokeWidth?: number;
  thickness?: number;
  centerTitle?: string;
  centerSubtitle?: string;
  centerLabel?: string;
  centerSublabel?: string;
  centerPercent?: number;
  darkTheme?: boolean;
}

export const ChamiloDonutChart: React.FC<ChamiloDonutChartProps> = ({
  segments = [],
  total: propTotal,
  size = 140,
  strokeWidth: propStrokeWidth,
  thickness = 16,
  centerTitle,
  centerSubtitle,
  centerLabel,
  centerSublabel,
  centerPercent,
  darkTheme = true
}) => {
  const strokeWidth = propStrokeWidth || thickness;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const calculatedTotal = segments.reduce((sum, s) => sum + s.value, 0);
  const total = propTotal || calculatedTotal;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Escala tipográfica armónica y proporcional al diámetro del gráfico
  const numberFontSize = size <= 100 ? '1.05rem' : (size <= 130 ? '1.2rem' : '1.42rem');
  const labelFontSize = size <= 100 ? '0.56rem' : (size <= 130 ? '0.62rem' : '0.68rem');

  if (total === 0) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center p-2">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={darkTheme ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}
            strokeWidth={strokeWidth}
          />
        </svg>
        <span className="extra-small mt-2" style={{ fontSize: '0.68rem', color: darkTheme ? '#94a3b8' : '#64748b' }}>Sin datos</span>
      </div>
    );
  }

  let accumulatedPercent = 0;

  return (
    <div className="d-flex flex-column align-items-center justify-content-center position-relative">
      <div className="position-relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          {/* Anillo de fondo */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={darkTheme ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9'}
            strokeWidth={strokeWidth}
          />

          {/* Segmentos de color */}
          {segments.map((segment, index) => {
            if (segment.value <= 0) return null;
            const segmentPercent = segment.value / (calculatedTotal || 1);
            const strokeDasharray = `${circumference * segmentPercent} ${circumference * (1 - segmentPercent)}`;
            const strokeDashoffset = -circumference * accumulatedPercent;
            accumulatedPercent += segmentPercent;

            const isHovered = hoveredIndex === index;

            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={segment.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  filter: isHovered 
                    ? `drop-shadow(0 0 10px ${segment.color})` 
                    : `drop-shadow(0 0 4px ${segment.color}50)`
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onTouchStart={() => setHoveredIndex(index)}
              />
            );
          })}
        </svg>

        {/* Centro del Anillo */}
        <div
          className="position-absolute top-50 start-50 translate-middle text-center pointer-events-none d-flex flex-column align-items-center justify-content-center"
          style={{ width: size - strokeWidth * 2.2, height: size - strokeWidth * 2.2 }}
        >
          {hoveredIndex !== null ? (
            <div className="animate__animated animate__fadeIn animate__faster">
              <span 
                className="fw-bolder d-block lh-1" 
                style={{ fontSize: numberFontSize, color: segments[hoveredIndex].color }}
              >
                {segments[hoveredIndex].value}
              </span>
              <span 
                className="fw-bold d-block text-truncate mt-0.5" 
                style={{ 
                  maxWidth: `${size - strokeWidth * 2.3}px`, 
                  fontSize: labelFontSize,
                  color: darkTheme ? '#e2e8f0' : '#64748b' 
                }}
              >
                {segments[hoveredIndex].label}
              </span>
            </div>
          ) : (
            <div>
              <span 
                className="fw-bolder d-block lh-1"
                style={{ 
                  fontSize: numberFontSize,
                  color: darkTheme ? '#ffffff' : '#0f172a' 
                }}
              >
                {centerSublabel || (centerPercent !== undefined ? `${centerPercent}%` : (centerTitle || total))}
              </span>
              <span 
                className="fw-bold text-uppercase d-block mt-0.5" 
                style={{ 
                  fontSize: labelFontSize, 
                  letterSpacing: '0.4px',
                  color: darkTheme ? '#94a3b8' : '#64748b',
                  lineHeight: 1.1
                }}
              >
                {centerSubtitle || centerLabel || (centerPercent !== undefined ? 'Avance' : 'Total')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Leyenda interactiva debajo */}
      <div className="d-flex flex-wrap justify-content-center gap-1.5 mt-2">
        {segments.map((segment, index) => {
          const isHovered = hoveredIndex === index;
          return (
            <button
              key={index}
              type="button"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => setHoveredIndex(hoveredIndex === index ? null : index)}
              className="btn btn-xs p-1 px-2 border-0 rounded-pill d-inline-flex align-items-center gap-1.5 transition-all"
              style={{
                backgroundColor: isHovered 
                  ? `${segment.color}25` 
                  : (darkTheme ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc'),
                border: `1px solid ${isHovered ? segment.color : (darkTheme ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0')}`,
                transform: isHovered ? 'scale(1.05)' : 'none',
                cursor: 'pointer'
              }}
            >
              <span
                className="rounded-circle d-inline-block"
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: segment.color,
                  boxShadow: isHovered ? `0 0 8px ${segment.color}` : 'none'
                }}
              />
              <span className="extra-small fw-bold" style={{ fontSize: '0.67rem', color: darkTheme ? '#cbd5e1' : '#0f172a' }}>
                {segment.label}:
              </span>
              <span className="extra-small fw-bolder" style={{ fontSize: '0.67rem', color: segment.color }}>
                {segment.value}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default ChamiloDonutChart;
