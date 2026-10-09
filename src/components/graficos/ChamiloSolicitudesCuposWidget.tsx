import React from 'react';
import { ChamiloDonutChart } from './ChamiloDonutChart';

interface ChamiloSolicitudesCuposWidgetProps {
  total: number;
  aprobados: number;
  evaluacion: number;
  rechazados: number;
  pctAprobados: number;
  darkTheme?: boolean;
}

export const ChamiloSolicitudesCuposWidget: React.FC<ChamiloSolicitudesCuposWidgetProps> = ({
  total,
  aprobados,
  evaluacion,
  rechazados,
  pctAprobados,
  darkTheme = false,
}) => {
  return (
    <div className="w-100 d-flex align-items-center justify-content-between gap-2.5 my-1" style={{ userSelect: 'none', minHeight: '82px' }}>
      {/* ── GRÁFICO DONUT ANIMADO DE CUPOS (78px) ── */}
      <div className="position-relative flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: 78, height: 78 }}>
        <ChamiloDonutChart
          segments={[
            { label: 'Aprobados', value: aprobados, color: '#10b981' },
            { label: 'En Evaluación', value: evaluacion, color: '#f59e0b' },
            { label: 'Rechazados', value: rechazados, color: '#ef4444' },
          ]}
          total={total || 1}
          size={78}
          thickness={8}
          centerTitle={`${pctAprobados}%`}
          centerSubtitle="Cupos"
          showLegend={false}
          darkTheme={darkTheme}
        />
      </div>

      {/* ── CUADRÍCULA 2x2 DE DISTRIBUCIÓN DE CUPOS ── */}
      <div className="flex-grow-1 d-flex flex-column justify-content-between gap-1" style={{ minWidth: 0 }}>
        {/* Fila 1: Aprobados & En Evaluación */}
        <div className="d-flex gap-1">
          <div 
            className="p-1 px-1.5 rounded-2 border bg-white flex-grow-1 d-flex align-items-center justify-content-between shadow-2xs hover-efecto"
            style={{ borderColor: 'rgba(16, 185, 129, 0.25)', minWidth: 0 }}
          >
            <span className="text-success text-truncate me-1" style={{ fontSize: '0.62rem' }}>
              <i className="bi bi-check-circle-fill me-1"></i>Aprobados
            </span>
            <strong className="text-success" style={{ fontSize: '0.78rem' }}>{aprobados}</strong>
          </div>

          <div 
            className="p-1 px-1.5 rounded-2 border bg-white flex-grow-1 d-flex align-items-center justify-content-between shadow-2xs hover-efecto"
            style={{ borderColor: 'rgba(245, 158, 11, 0.35)', minWidth: 0 }}
          >
            <span className="text-warning text-truncate me-1" style={{ fontSize: '0.62rem' }}>
              <i className="bi bi-hourglass-split me-1"></i>Revisión
            </span>
            <strong className="text-warning" style={{ fontSize: '0.78rem' }}>{evaluacion}</strong>
          </div>
        </div>

        {/* Fila 2: Total Solicitudes & Rechazados */}
        <div className="d-flex gap-1">
          <div 
            className="p-1 px-1.5 rounded-2 border bg-white flex-grow-1 d-flex align-items-center justify-content-between shadow-2xs hover-efecto"
            style={{ borderColor: 'rgba(139, 92, 246, 0.25)', minWidth: 0 }}
          >
            <span className="text-secondary text-truncate me-1" style={{ fontSize: '0.62rem' }}>
              <i className="bi bi-inbox-fill text-purple me-1" style={{ color: '#8b5cf6' }}></i>Recibidas
            </span>
            <strong className="text-dark" style={{ fontSize: '0.78rem' }}>{total}</strong>
          </div>

          <div 
            className="p-1 px-1.5 rounded-2 border bg-white flex-grow-1 d-flex align-items-center justify-content-between shadow-2xs hover-efecto"
            style={{ borderColor: 'rgba(239, 68, 68, 0.25)', minWidth: 0 }}
          >
            <span className="text-danger text-truncate me-1" style={{ fontSize: '0.62rem' }}>
              <i className="bi bi-x-circle-fill me-1"></i>Rechazados
            </span>
            <strong className="text-danger" style={{ fontSize: '0.78rem' }}>{rechazados}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChamiloSolicitudesCuposWidget;
