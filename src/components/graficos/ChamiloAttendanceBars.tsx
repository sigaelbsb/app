import React, { useState } from 'react';

export interface AttendanceDay {
  day: string;
  percent: number;
  presentes: number;
  total: number;
}

interface ChamiloAttendanceBarsProps {
  data?: AttendanceDay[];
  color?: string;
  height?: number;
  darkTheme?: boolean;
}

export const ChamiloAttendanceBars: React.FC<ChamiloAttendanceBarsProps> = ({
  data = [
    { day: 'Lun', percent: 92, presentes: 561, total: 610 },
    { day: 'Mar', percent: 95, presentes: 580, total: 610 },
    { day: 'Mié', percent: 90, presentes: 549, total: 610 },
    { day: 'Jue', percent: 94, presentes: 573, total: 610 },
    { day: 'Vie', percent: 91, presentes: 555, total: 610 },
  ],
  color = '#10b981',
  height = 95,
  darkTheme = true
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const hoyIdx = 3; // Jueves como referencia visual

  return (
    <div className="w-100 position-relative py-1">
      {/* Tooltip flotante si está en hover */}
      {hoveredIdx !== null && (
        <div
          className="position-absolute rounded-pill px-2.5 py-1 extra-small shadow-sm d-flex align-items-center gap-1.5 animate__animated animate__fadeIn animate__faster pointer-events-none"
          style={{
            top: '-8px',
            left: `${((hoveredIdx + 0.5) / data.length) * 100}%`,
            transform: 'translateX(-50%)',
            zIndex: 10,
            whiteSpace: 'nowrap',
            fontSize: '0.72rem',
            backgroundColor: '#030712',
            color: '#f8fafc',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)'
          }}
        >
          <span style={{ fontWeight: 700 }}>{data[hoveredIdx].day}:</span>
          <strong style={{ color: '#fbbf24' }}>{data[hoveredIdx].percent}%</strong>
          <span style={{ color: '#94a3b8' }}>({data[hoveredIdx].presentes} alumnos)</span>
        </div>
      )}

      {/* Contenedor de barras */}
      <div
        className="d-flex align-items-end justify-content-between gap-2 px-1"
        style={{ height: `${height}px` }}
      >
        {data.map((item, idx) => {
          const isHovered = hoveredIdx === idx;
          const isToday = idx === hoyIdx;

          return (
            <div
              key={idx}
              className="d-flex flex-column align-items-center flex-grow-1 cursor-pointer"
              style={{ height: '100%', justifyContent: 'flex-end' }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onTouchStart={() => setHoveredIdx(idx)}
            >
              {/* Badge con porcentaje encima de cada barra */}
              <span
                className="extra-small fw-bold mb-1 transition-all"
                style={{
                  fontSize: '0.68rem',
                  color: isHovered || isToday ? (darkTheme ? '#34d399' : color) : (darkTheme ? '#94a3b8' : '#64748b'),
                  fontWeight: isHovered || isToday ? 800 : 600,
                  transform: isHovered ? 'scale(1.15)' : 'none'
                }}
              >
                {item.percent}%
              </span>

              {/* Barra de progreso vertical tipo ecualizador */}
              <div
                className="w-100 rounded-pill position-relative overflow-hidden"
                style={{
                  height: `${item.percent}%`,
                  maxHeight: '62px',
                  background: isHovered || isToday
                    ? `linear-gradient(180deg, #34d399 0%, #0284c7 100%)`
                    : darkTheme
                      ? `linear-gradient(180deg, ${color}99 0%, ${color}20 100%)`
                      : `linear-gradient(180deg, ${color}90 0%, ${color}40 100%)`,
                  boxShadow: isHovered || isToday ? `0 0 16px ${color}80` : 'none',
                  border: darkTheme ? `1px solid ${color}40` : 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  minWidth: '16px'
                }}
              >
                {/* Resplandor superior en la barra */}
                <div
                  className="w-100"
                  style={{
                    height: '3px',
                    backgroundColor: '#ffffff',
                    opacity: isHovered || isToday ? 0.9 : 0.4
                  }}
                />
              </div>

              {/* Día de la semana */}
              <span
                className="extra-small fw-bold mt-1.5"
                style={{
                  fontSize: '0.68rem',
                  color: isToday ? (darkTheme ? '#38bdf8' : '#0066FF') : (darkTheme ? '#94a3b8' : '#64748b'),
                  fontWeight: isToday ? 800 : 600
                }}
              >
                {item.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default ChamiloAttendanceBars;
