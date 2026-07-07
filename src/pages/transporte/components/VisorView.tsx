import React from 'react';

interface VisorViewProps {
  opRutaId: string;
  setOpRutaId: (id: string) => void;
  opSentido: string;
  setOpSentido: (sentido: string) => void;
  rutas: any[];
  opActual: any;
  getIdsWithEscuela: (ruta: any, sentido: 'Casa - Escuela' | 'Escuela - Casa') => string[];
  getParadasWithEscuela: (pids: string[]) => any[];
  BusProgressBar: React.ComponentType<{ total: number; current: number; finalizada: boolean }>;
  AnimatedBusSVG: React.ComponentType<{ size?: number; className?: string }>;
  BusStopIcon: React.ComponentType<{ size?: number; active?: boolean }>;
}

export const VisorView: React.FC<VisorViewProps> = ({
  opRutaId,
  setOpRutaId,
  opSentido,
  setOpSentido,
  rutas,
  opActual,
  getIdsWithEscuela,
  getParadasWithEscuela,
  BusProgressBar,
  AnimatedBusSVG,
  BusStopIcon
}) => {

  const rutaObj = rutas.find(r => r.id === opRutaId);
  const originalPids = rutaObj ? getIdsWithEscuela(rutaObj, opSentido as any) : [];
  const pids = opActual?.historial_paradas?._custom_order ?? originalPids;
  const orderedParadas = getParadasWithEscuela(pids);

  return (
    <div className="card shadow-sm border-0 rounded-4 animate__animated animate__fadeInRight">
      <div className="card-body p-4 p-md-5">
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <h5 className="fw-bold text-dark mb-0">
            <i className="bi bi-eye-fill text-success me-2"></i>
            Visor de Recorrido (Seguimiento En Vivo)
          </h5>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <label className="small text-muted fw-bold mb-1">Ruta Escolar</label>
            <select className="form-select input-moderno fw-bold" value={opRutaId} onChange={e => setOpRutaId(e.target.value)}>
              <option value="">Seleccione una ruta...</option>
              {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </div>
          <div className="col-md-6">
            <label className="small text-muted fw-bold mb-1">Momento</label>
            <select className="form-select input-moderno" value={opSentido} onChange={e => setOpSentido(e.target.value)}>
              <option value="Casa - Escuela">Ida (Casa - Escuela)</option>
              <option value="Escuela - Casa">Retorno (Escuela - Casa)</option>
            </select>
          </div>
        </div>

        {!opRutaId ? (
          <div className="text-center py-5 text-muted bg-light rounded-4 border">
            <i className="bi bi-map fs-1 text-secondary mb-3 d-block"></i>
            <h6 className="fw-bold">Seleccione una ruta</h6>
            <p className="small mb-0">Para visualizar el avance en vivo.</p>
          </div>
        ) : (
          <div className="map-bg">
            {opActual ? (() => {
              const currentIdx2 = pids.findIndex((id: string) => id === opActual.ubicacion_actual);
              const progressIdx = opActual.estado === 'Finalizada' ? pids.length - 1 : currentIdx2;
              return (
                <div className="status-bus-banner shadow-sm mb-4"
                  style={{ 
                    background: opActual.estado === 'Finalizada'
                      ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)'
                      : 'linear-gradient(135deg, #dbeafe, #eff6ff)',
                    border: opActual.estado === 'Finalizada' ? '1.5px solid #6ee7b7' : '1.5px solid #93c5fd' 
                  }}
                >
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <div>
                      <h6 className="fw-bold mb-0" style={{ color: opActual.estado === 'Finalizada' ? '#065f46' : '#1e40af' }}>
                        {opActual.estado === 'Finalizada' ? '🏁 Ruta Finalizada con Éxito' : '🚍 En Ruta — Recorrido Activo'}
                      </h6>
                      <div className="small" style={{ color: opActual.estado === 'Finalizada' ? '#047857' : '#1d4ed8' }}>
                        Última actualización: {new Date(opActual.ultima_actualizacion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    {opActual.estado !== 'Finalizada' && (
                      <div className="ms-auto">
                        <span className="bus-here-badge">
                          <span className="live-dot"></span>
                          EN VIVO
                        </span>
                      </div>
                    )}
                  </div>
                  {pids.length > 0 && (
                    <BusProgressBar
                      total={pids.length}
                      current={progressIdx >= 0 ? progressIdx : 0}
                      finalizada={opActual.estado === 'Finalizada'}
                    />
                  )}
                  <div className="road-marquee"></div>
                </div>
              );
            })() : (
              <div className="alert alert-info border rounded-4 d-flex align-items-center gap-3 shadow-sm mb-4">
                <i className="bi bi-info-circle-fill fs-4 text-primary"></i>
                <div>
                  <div className="fw-bold">Ruta no iniciada</div>
                  <div className="small">El bus escolar aún no ha iniciado su recorrido para esta ruta y momento hoy.</div>
                </div>
              </div>
            )}

            <div className="route-stepper" style={{ paddingLeft: 4 }}>
              {orderedParadas.map((parada: any, index: number) => {
                const isStart = index === 0;
                const isSchool = parada.id === 'escuela_virtual';

                let passed = false;
                let isActive = false;

                if (opActual) {
                  const currentIdx = pids.findIndex((id: string) => id === opActual.ubicacion_actual);
                  if (opActual.estado === 'Finalizada') {
                    passed = true;
                  } else if (index < currentIdx) {
                    passed = true;
                  } else if (index === currentIdx) {
                    isActive = true;
                  }
                }

                const pinClass = isActive ? 'active' : passed ? 'passed' : isSchool ? 'school' : isStart ? 'origin' : 'pending';
                const cardClass = isActive ? 'active' : passed ? 'passed' : isSchool ? 'school' : isStart ? 'origin' : '';
                const horaRegistrada = opActual?.historial_paradas?.[parada.id];

                return (
                  <div
                    key={`stop-${parada.id}`}
                    className="stepper-stop"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className={`stepper-pin ${pinClass}`} style={{ overflow: 'hidden' }}>
                      {isActive ? (
                        <AnimatedBusSVG size={26} />
                      ) : passed ? (
                        <i className="bi bi-check-lg"></i>
                      ) : isSchool ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#a855f7' }}>
                          <path d="m2 10 10-6 10 6" />
                          <path d="M4 10v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10" />
                          <path d="M9 22V12h6v10" />
                          <path d="M12 4v2" />
                          <circle cx="12" cy="7.5" r="1.5" fill="currentColor" />
                        </svg>
                      ) : isStart ? (
                        <BusStopIcon size={22} active={false} />
                      ) : (
                        <i className="bi bi-circle-fill" style={{ fontSize: '0.45rem' }}></i>
                      )}
                    </div>
                    <div className={`stepper-card ${cardClass}`}>
                      <div className="stepper-card-info">
                        <div className="stepper-step-num" style={{ color: isActive ? '#10b981' : passed ? '#3b82f6' : isSchool ? '#a855f7' : '#94a3b8' }}>
                          {isStart ? 'Origen' : isSchool ? 'Destino Final' : `Parada ${index}`}
                        </div>
                        <div className="stepper-name">{parada.nombre_parada}</div>
                        {parada.descripcion && <div className="stepper-desc">{parada.descripcion}</div>}
                        {horaRegistrada && (
                          <div className="stepper-hora">
                            <i className="bi bi-clock-fill"></i>
                            {horaRegistrada}
                          </div>
                        )}
                      </div>

                      {isActive && (
                        <div className="d-flex flex-column align-items-center gap-1">
                          <div className="bus-here-badge">
                            <span className="live-dot"></span>
                            🚍 Aquí
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
