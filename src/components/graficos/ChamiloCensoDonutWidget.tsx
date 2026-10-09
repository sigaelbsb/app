import React from 'react';
import { ChamiloDonutChart } from './ChamiloDonutChart';

interface ChamiloCensoDonutWidgetProps {
  total: number;
  actualizados: number;
  iniciados: number;
  noIniciados: number;
  pctActualizados: number;
  pctIniciados: number;
  pctNoIniciados: number;
  darkTheme?: boolean;
}

export const ChamiloCensoDonutWidget: React.FC<ChamiloCensoDonutWidgetProps> = ({
  total,
  actualizados,
  iniciados,
  noIniciados,
  pctActualizados,
  pctIniciados,
  pctNoIniciados,
  darkTheme = false,
}) => {
  return (
    <div className="w-100 d-flex align-items-center justify-content-between gap-2.5 my-1" style={{ userSelect: 'none', minHeight: '82px' }}>
      {/* ── GRÁFICO DONUT ANIMADO DE EXPEDIENTES (78px) ── */}
      <div className="position-relative flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: 78, height: 78 }}>
        <ChamiloDonutChart
          segments={[
            { label: 'Actualizados', value: actualizados, color: '#10b981' },
            { label: 'En Proceso', value: iniciados, color: '#f59e0b' },
            { label: 'Sin Iniciar', value: noIniciados, color: '#94a3b8' },
          ]}
          total={total || 1}
          size={78}
          thickness={8}
          centerTitle={`${pctActualizados}%`}
          centerSubtitle="Al Día"
          showLegend={false}
          darkTheme={darkTheme}
        />
      </div>

      {/* ── ESTATUS DE EXPEDIENTES EN PASTILLAS COMPACTAS ── */}
      <div className="flex-grow-1 d-flex flex-column justify-content-between gap-1" style={{ minWidth: 0 }}>
        {/* Fila 1: Actualizados (Destacado) */}
        <div 
          className="p-1 px-1.5 rounded-2 border bg-white d-flex align-items-center justify-content-between shadow-2xs hover-efecto"
          style={{ borderColor: 'rgba(16, 185, 129, 0.25)', minWidth: 0 }}
        >
          <span className="text-success text-truncate me-1" style={{ fontSize: '0.62rem' }}>
            <i className="bi bi-check2-circle me-1"></i>Actualizados
          </span>
          <strong className="text-success" style={{ fontSize: '0.78rem' }}>
            {actualizados} <span className="extra-small fw-normal text-muted">({pctActualizados}%)</span>
          </strong>
        </div>

        {/* Fila 2: En Proceso & Sin Iniciar */}
        <div className="d-flex gap-1">
          <div 
            className="p-1 px-1.5 rounded-2 border bg-white flex-grow-1 d-flex align-items-center justify-content-between shadow-2xs hover-efecto"
            style={{ borderColor: 'rgba(245, 158, 11, 0.25)', minWidth: 0 }}
          >
            <span className="text-warning text-truncate me-1" style={{ fontSize: '0.60rem' }}>
              <i className="bi bi-clock-history me-1"></i>Proceso
            </span>
            <strong className="text-warning" style={{ fontSize: '0.74rem' }}>{iniciados}</strong>
          </div>

          <div 
            className="p-1 px-1.5 rounded-2 border bg-white flex-grow-1 d-flex align-items-center justify-content-between shadow-2xs hover-efecto"
            style={{ borderColor: 'rgba(148, 163, 184, 0.3)', minWidth: 0 }}
          >
            <span className="text-secondary text-truncate me-1" style={{ fontSize: '0.60rem' }}>
              <i className="bi bi-dash-circle me-1"></i>Sin Iniciar
            </span>
            <strong className="text-secondary" style={{ fontSize: '0.74rem' }}>{noIniciados}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChamiloCensoDonutWidget;
