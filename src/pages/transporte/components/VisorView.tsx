import React from 'react';

interface VisorViewProps {
  onBack?: () => void;
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
  onBack,
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
    <div className="card shadow-sm border-0 rounded-4 animate__animated animate__fadeInRight overflow-hidden">
      <div className="card-body p-3 p-md-4">
        {/* Cabecera del Visor */}
        <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-3 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            {onBack && (
              <button 
                type="button"
                className="btn btn-sm btn-light border rounded-pill px-3 py-1.5 fw-bold text-dark d-flex align-items-center gap-1.5 shadow-xs hover-efecto"
                style={{ fontSize: '0.82rem' }}
                onClick={onBack}
                title="Volver al Dashboard"
              >
                <i className="bi bi-arrow-left text-primary"></i>
                <span>Volver</span>
              </button>
            )}
            <div>
              <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: '1.15rem' }}>
                <i className="bi bi-eye-fill text-success"></i>
                <span>Visor de Recorrido en Tiempo Real</span>
              </h5>
              <small className="text-muted" style={{ fontSize: '0.78rem' }}>
                Seguimiento satelital y avance de paradas para representantes y personal.
              </small>
            </div>
          </div>
          {opActual?.estado === 'En Ruta' && (
            <span className="badge rounded-pill bg-success text-white px-3 py-1.5 shadow-xs fw-bold d-flex align-items-center gap-1.5">
              <span className="live-dot"></span>
              <span>UNIDAD EN MOVIMIENTO</span>
            </span>
          )}
        </div>

        {/* Selectores de Ruta y Sentido (Responsive) */}
        <div className="row g-2 g-md-3 mb-3">
          <div className="col-12 col-md-6">
            <label className="small text-muted fw-bold mb-1 d-flex align-items-center gap-1">
              <i className="bi bi-signpost-split-fill text-primary"></i>
              <span>Ruta de la Unidad</span>
            </label>
            <select 
              className="form-select form-select-sm bg-light border fw-bold rounded-3 shadow-xs" 
              value={opRutaId} 
              onChange={e => setOpRutaId(e.target.value)}
              style={{ fontSize: '0.88rem', padding: '9px 12px' }}
            >
              <option value="">Seleccione una ruta...</option>
              {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-6">
            <label className="small text-muted fw-bold mb-1 d-flex align-items-center gap-1">
              <i className="bi bi-clock-history text-warning"></i>
              <span>Horario / Momento</span>
            </label>
            <select 
              className="form-select form-select-sm bg-light border fw-bold rounded-3 shadow-xs" 
              value={opSentido} 
              onChange={e => setOpSentido(e.target.value)}
              style={{ fontSize: '0.88rem', padding: '9px 12px' }}
            >
              <option value="Casa - Escuela">🌅 Ida hacia la Escuela</option>
              <option value="Escuela - Casa">🌇 Retorno a Casa</option>
            </select>
          </div>
        </div>

        {!opRutaId ? (
          <div className="text-center py-5 text-muted bg-light rounded-4 border p-4">
            <div className="d-inline-flex p-3 bg-white rounded-circle shadow-xs border mb-2 text-primary">
              <i className="bi bi-map fs-2"></i>
            </div>
            <h6 className="fw-bold text-dark mt-2 mb-1">Selecciona una ruta para observar</h6>
            <p className="small text-muted mb-0">Podrás visualizar el progreso y la llegada del transporte en tiempo real.</p>
          </div>
        ) : (
          <div className="map-bg p-2 p-md-3 rounded-4">
            {opActual ? (() => {
              const currentIdx2 = pids.findIndex((id: string) => id === opActual.ubicacion_actual);
              const progressIdx = opActual.estado === 'Finalizada' ? pids.length - 1 : currentIdx2;
              return (
                <div 
                  className="status-bus-banner shadow-sm mb-3"
                  style={{ 
                    background: opActual.estado === 'Finalizada'
                      ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)'
                      : 'linear-gradient(135deg, #dbeafe, #eff6ff)',
                    border: opActual.estado === 'Finalizada' ? '1.5px solid #6ee7b7' : '1.5px solid #93c5fd',
                    padding: '14px 16px'
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between gap-2 mb-2 flex-wrap">
                    <div>
                      <h6 className="fw-bold mb-0 d-flex align-items-center gap-1.5" style={{ color: opActual.estado === 'Finalizada' ? '#065f46' : '#1e40af' }}>
                        <span>{opActual.estado === 'Finalizada' ? '🏁 Unidad Llegó a Destino' : '🚍 En Ruta — Recorrido en Vivo'}</span>
                      </h6>
                      <div className="small text-muted" style={{ fontSize: '0.72rem' }}>
                        Última parada reportada: {new Date(opActual.ultima_actualizacion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    {opActual.estado !== 'Finalizada' && (
                      <span className="bus-here-badge shadow-xs">
                        <span className="live-dot"></span>
                        TRANSMITIENDO EN VIVO
                      </span>
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
              <div className="alert alert-info border rounded-4 d-flex align-items-center gap-3 shadow-xs mb-3 p-3">
                <i className="bi bi-info-circle-fill fs-3 text-primary flex-shrink-0"></i>
                <div>
                  <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>Ruta no iniciada por el conductor</div>
                  <div className="small text-muted" style={{ fontSize: '0.78rem' }}>El autobús escolar aún no ha comenzado su recorrido oficial para esta ruta hoy.</div>
                </div>
              </div>
            )}

            {/* Stepper Timeline de Paradas */}
            <div className="route-stepper">
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
                    style={{ animationDelay: `${index * 0.04}s`, marginBottom: '8px' }}
                  >
                    <div className={`stepper-pin ${pinClass}`} style={{ overflow: 'hidden', flexShrink: 0 }}>
                      {isActive ? (
                        <AnimatedBusSVG size={24} />
                      ) : passed ? (
                        <i className="bi bi-check-lg fw-bold"></i>
                      ) : isSchool ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#a855f7' }}>
                          <path d="m2 10 10-6 10 6" />
                          <path d="M4 10v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10" />
                          <path d="M9 22V12h6v10" />
                          <circle cx="12" cy="7.5" r="1.5" fill="currentColor" />
                        </svg>
                      ) : isStart ? (
                        <BusStopIcon size={20} active={false} />
                      ) : (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{index}</span>
                      )}
                    </div>

                    <div className={`stepper-card ${cardClass}`}>
                      <div className="stepper-card-info" style={{ minWidth: 0, flex: 1 }}>
                        <div className="stepper-step-num" style={{ color: isActive ? '#10b981' : passed ? '#3b82f6' : isSchool ? '#a855f7' : '#94a3b8' }}>
                          {isStart ? 'Punto de Partida' : isSchool ? 'Destino Final' : `Parada ${index}`}
                        </div>
                        <div className="stepper-name text-truncate">{parada.nombre_parada}</div>
                        {parada.descripcion && (
                          <div className="stepper-desc text-truncate">{parada.descripcion}</div>
                        )}
                        {horaRegistrada && (
                          <div className="stepper-hora">
                            <i className="bi bi-clock-fill"></i>
                            <span>{horaRegistrada}</span>
                          </div>
                        )}
                      </div>

                      {isActive && (
                        <div className="flex-shrink-0">
                          <span className="bus-here-badge shadow-xs">
                            <span className="live-dot"></span>
                            🚍 Aquí
                          </span>
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
