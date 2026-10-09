import React from 'react';
import { ChamiloDonutChart } from './ChamiloDonutChart';

interface ChamiloFormalizacionGaugeProps {
  solicitados: number;
  aprobados: number;
  formalizados: number;
  porFormalizar: number;
  rechazados: number;
  porcentaje?: number;
  darkTheme?: boolean;
}

export const ChamiloFormalizacionGauge: React.FC<ChamiloFormalizacionGaugeProps> = ({
  solicitados,
  aprobados,
  formalizados,
  porFormalizar,
  rechazados,
  darkTheme = false,
}) => {
  const total = Math.max(1, solicitados || (aprobados + rechazados));
  const pctAprobados = Math.round((aprobados / total) * 100);
  const pctFormalizadosDeAprobados = aprobados > 0 ? Math.round((formalizados / aprobados) * 100) : 0;
  const pctPendientesDeAprobados = Math.max(0, 100 - pctFormalizadosDeAprobados);
  const pctRechazados = Math.round((rechazados / total) * 100);

  return (
    <div className="w-100 d-flex align-items-center justify-content-between gap-2.5 my-1" style={{ userSelect: 'none', minHeight: '82px' }}>
      {/* ── DONUT CHART CON LOS 3 SEGMENTOS REALES DE LAS 186 SOLICITUDES ── */}
      <div className="position-relative flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: 78, height: 78 }}>
        <ChamiloDonutChart
          segments={[
            { label: 'Formalizados', value: formalizados, color: '#10b981' },
            { label: 'Por Formalizar', value: porFormalizar, color: '#f59e0b' },
            { label: 'Rechazados', value: rechazados, color: '#ef4444' },
          ]}
          total={total}
          size={78}
          thickness={8}
          centerTitle={`${pctAprobados}%`}
          centerSubtitle="Aprobados"
          showLegend={false}
          darkTheme={darkTheme}
        />
      </div>

      {/* ── CUADRÍCULA 2x2 DE LOS 4 VALORES EXACTOS DE LA TARJETA ── */}
      <div className="flex-grow-1 d-flex flex-column justify-content-between gap-1" style={{ minWidth: 0 }}>
        {/* Fila 1: Aprobados & Formalizados */}
        <div className="d-flex gap-1">
          <div
            className="p-1 px-1.5 rounded-2 border bg-white flex-grow-1 d-flex align-items-center justify-content-between shadow-2xs hover-efecto"
            style={{ borderColor: 'rgba(16, 185, 129, 0.25)', minWidth: 0 }}
            title={`${aprobados} solicitudes aprobadas de ${total} (${pctAprobados}%)`}
          >
            <span className="text-success text-truncate me-1" style={{ fontSize: '0.62rem' }}>
              <i className="bi bi-check-circle-fill me-1"></i>Aprobados
            </span>
            <strong className="text-success" style={{ fontSize: '0.78rem' }}>
              {aprobados} <span className="extra-small fw-normal text-muted" style={{ fontSize: '0.64rem' }}>({pctAprobados}%)</span>
            </strong>
          </div>

          <div
            className="p-1 px-1.5 rounded-2 border bg-white flex-grow-1 d-flex align-items-center justify-content-between shadow-2xs hover-efecto"
            style={{ borderColor: 'rgba(13, 148, 136, 0.25)', backgroundColor: 'rgba(204, 251, 241, 0.2)', minWidth: 0 }}
            title={`${formalizados} formalizados en taquilla (${pctFormalizadosDeAprobados}% de aprobados)`}
          >
            <span className="text-truncate me-1" style={{ fontSize: '0.62rem', color: '#0d9488' }}>
              <i className="bi bi-clipboard-check-fill me-1"></i>Formalizados
            </span>
            <strong style={{ fontSize: '0.78rem', color: '#0d9488' }}>
              {formalizados} <span className="extra-small fw-normal text-muted" style={{ fontSize: '0.64rem' }}>({pctFormalizadosDeAprobados}%)</span>
            </strong>
          </div>
        </div>

        {/* Fila 2: Por Formalizar (Pendientes) & Rechazados */}
        <div className="d-flex gap-1">
          <div
            className="p-1 px-1.5 rounded-2 border bg-white flex-grow-1 d-flex align-items-center justify-content-between shadow-2xs hover-efecto"
            style={{ borderColor: 'rgba(245, 158, 11, 0.35)', backgroundColor: 'rgba(254, 243, 199, 0.25)', minWidth: 0 }}
            title={`${porFormalizar} pendientes por formalizar (${pctPendientesDeAprobados}% de aprobados)`}
          >
            <span className="text-warning text-truncate me-1" style={{ fontSize: '0.62rem' }}>
              <i className="bi bi-hourglass-split me-1"></i>Pendientes
            </span>
            <strong className="text-warning" style={{ fontSize: '0.78rem' }}>
              {porFormalizar} <span className="extra-small fw-normal text-muted" style={{ fontSize: '0.64rem' }}>({pctPendientesDeAprobados}%)</span>
            </strong>
          </div>

          <div
            className="p-1 px-1.5 rounded-2 border bg-white flex-grow-1 d-flex align-items-center justify-content-between shadow-2xs hover-efecto"
            style={{ borderColor: 'rgba(239, 68, 68, 0.25)', minWidth: 0 }}
            title={`${rechazados} solicitudes no aprobadas (${pctRechazados}% del total)`}
          >
            <span className="text-danger text-truncate me-1" style={{ fontSize: '0.62rem' }}>
              <i className="bi bi-x-circle-fill me-1"></i>Rechazados
            </span>
            <strong className="text-danger" style={{ fontSize: '0.78rem' }}>
              {rechazados} <span className="extra-small fw-normal text-muted" style={{ fontSize: '0.64rem' }}>({pctRechazados}%)</span>
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChamiloFormalizacionGauge;
