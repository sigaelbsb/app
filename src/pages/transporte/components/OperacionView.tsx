import React from 'react';

interface OperacionViewProps {
  opRutaId: string;
  setOpRutaId: (id: string) => void;
  opSentido: string;
  setOpSentido: (sentido: string) => void;
  rutas: any[];
  opActual: any;
  customPids: string[] | null;
  setCustomPids: (pids: string[] | null) => void;
  dragIdx: number | null;
  setDragIdx: (idx: number | null) => void;
  iniciarRecorrido: () => void;
  marcarParada: (paradaId: string, index: number, orderedIds: string[]) => void;
  resetRutaActual: () => void;
  resetMasivo: () => void;
  getIdsWithEscuela: (ruta: any, sentido: 'Casa - Escuela' | 'Escuela - Casa') => string[];
  getParadasWithEscuela: (pids: string[]) => any[];
  BusProgressBar: React.ComponentType<{ total: number; current: number; finalizada: boolean }>;
  AnimatedBusSVG: React.ComponentType<{ size?: number; className?: string }>;
  BusStopIcon: React.ComponentType<{ size?: number; active?: boolean }>;
  canControlCoordinacion: boolean;
  salidaMasiva: () => void;
  offlineMode?: boolean;
}

export const OperacionView: React.FC<OperacionViewProps> = ({
  opRutaId,
  setOpRutaId,
  opSentido,
  setOpSentido,
  rutas,
  opActual,
  customPids,
  setCustomPids,
  dragIdx,
  setDragIdx,
  iniciarRecorrido,
  marcarParada,
  resetRutaActual,
  resetMasivo,
  getIdsWithEscuela,
  getParadasWithEscuela,
  BusProgressBar,
  AnimatedBusSVG,
  BusStopIcon,
  canControlCoordinacion,
  salidaMasiva,
  offlineMode
}) => {

  const rutaObj = rutas.find(r => r.id === opRutaId);
  const originalPids = rutaObj ? getIdsWithEscuela(rutaObj, opSentido as any) : [];
  const pids = customPids ?? (opActual?.historial_paradas?._custom_order ?? originalPids);
  const orderedParadas = getParadasWithEscuela(pids);

  const moverParada = (idx: number, dir: number) => {
    const base = customPids ?? originalPids;
    if (base[idx] === 'escuela_virtual' || base[idx + dir] === 'escuela_virtual') return;
    const arr = [...base];
    const tmp = arr[idx]; arr[idx] = arr[idx + dir]; arr[idx + dir] = tmp;
    setCustomPids(arr);
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragEnd = () => setDragIdx(null);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const base = customPids ?? originalPids;
    if (base[idx] === 'escuela_virtual' || base[dragIdx] === 'escuela_virtual') return;
    const arr = [...base];
    const moved = arr.splice(dragIdx, 1)[0];
    arr.splice(idx, 0, moved);
    setCustomPids(arr);
    setDragIdx(idx);
  };

  return (
    <div className="card shadow-sm border-0 rounded-4 animate__animated animate__fadeInRight">
      <div className="card-body p-4 p-md-5">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3 border-bottom pb-3">
          <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-broadcast text-success me-2"></i>
            Operación de Ruta (Conductor)
            {offlineMode && (
              <span className="badge bg-warning text-dark rounded-pill fw-bold" style={{ fontSize: '0.75rem', animation: 'pulse 2s infinite' }}>
                <i className="bi bi-wifi-off me-1"></i> Sin Conexión
              </span>
            )}
          </h5>
          <div className="d-flex flex-wrap gap-2">
            {opActual && (
              <button className="btn btn-outline-warning rounded-pill px-3 shadow-sm" onClick={resetRutaActual}>
                <i className="bi bi-arrow-counterclockwise me-1"></i>Reset Ruta
              </button>
            )}
            {canControlCoordinacion && (
              <>
                {opSentido === 'Escuela - Casa' && (
                  <button className="btn btn-success rounded-pill px-3 shadow-sm fw-bold" onClick={salidaMasiva}>
                    <i className="bi bi-play-all-fill me-1"></i>Salida Masiva
                  </button>
                )}
                <button className="btn btn-outline-danger rounded-pill px-3 shadow-sm" onClick={resetMasivo}>
                  <i className="bi bi-exclamation-triangle-fill me-1"></i>Reset Masivo
                </button>
              </>
            )}
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <label className="small text-muted fw-bold mb-1">Seleccione la Ruta</label>
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
            <p className="small mb-0">Para visualizar e iniciar la operación.</p>
          </div>
        ) : (
          <div className="map-bg">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              {!opActual && (
                <button className="btn btn-warning rounded-pill px-4 fw-bold shadow-sm" onClick={iniciarRecorrido}>
                  <i className="bi bi-play-circle me-2"></i>Iniciar Recorrido
                </button>
              )}
              {!opActual && customPids && (
                <button
                  className="btn btn-outline-secondary rounded-pill px-3 shadow-sm"
                  onClick={() => setCustomPids(null)}
                  title="Restaurar orden original de la ruta"
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i>Restablecer orden
                </button>
              )}
              {!opActual && (
                <span className="badge bg-light text-muted border rounded-pill px-3 py-2 small">
                  <i className="bi bi-arrows-expand-vertical me-1"></i>
                  Arrastra o usa ↑↓ para reordenar antes de iniciar
                </span>
              )}
            </div>

            {opActual && (() => {
              const pids2 = rutaObj ? getIdsWithEscuela(rutaObj, opSentido as any) : [];
              const currentIdx2 = pids2.findIndex((id: string) => id === opActual.ubicacion_actual);
              const progressIdx = opActual.estado === 'Finalizada' ? pids2.length - 1 : currentIdx2;
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
                  {pids2.length > 0 && (
                    <BusProgressBar
                      total={pids2.length}
                      current={progressIdx >= 0 ? progressIdx : 0}
                      finalizada={opActual.estado === 'Finalizada'}
                    />
                  )}
                  <div className="road-marquee"></div>
                </div>
              );
            })()}

            <div className="route-stepper" style={{ paddingLeft: 4 }}>
              {orderedParadas.map((parada: any, index: number) => {
                const isStart = index === 0;
                const isSchool = parada.id === 'escuela_virtual';
                const isDestino = index === orderedParadas.length - 1;

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
                    style={{
                      animationDelay: `${index * 0.05}s`,
                      opacity: (!isSchool && dragIdx === index) ? 0.45 : 1,
                      outline: (dragIdx !== null && dragIdx !== index && !isSchool) ? '2px dashed #6366f1' : 'none',
                      outlineOffset: 3,
                      borderRadius: 12,
                      transition: 'opacity 0.15s, outline 0.15s',
                      cursor: !isSchool ? 'grab' : 'default',
                    }}
                    draggable={!isSchool && !opActual}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
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

                      {!isSchool && !opActual && (
                        <div className="d-flex flex-column gap-1" style={{ flexShrink: 0 }}>
                          <button
                            className="btn btn-sm btn-light border rounded-circle p-0 shadow-sm"
                            style={{ width: 28, height: 28, lineHeight: 1 }}
                            disabled={index === 0}
                            onClick={() => moverParada(index, -1)}
                            title="Subir parada"
                          >
                            <i className="bi bi-chevron-up" style={{ fontSize: '0.7rem' }}></i>
                          </button>
                          <button
                            className="btn btn-sm btn-light border rounded-circle p-0 shadow-sm"
                            style={{ width: 28, height: 28, lineHeight: 1 }}
                            disabled={index >= orderedParadas.length - 2}
                            onClick={() => moverParada(index, 1)}
                            title="Bajar parada"
                          >
                            <i className="bi bi-chevron-down" style={{ fontSize: '0.7rem' }}></i>
                          </button>
                        </div>
                      )}

                      {isActive && (
                        <div className="d-flex flex-column align-items-center gap-1">
                          <div className="bus-here-badge">
                            <span className="live-dot"></span>
                            🚍 Aquí
                          </div>
                        </div>
                      )}

                      {opActual?.estado === 'En Ruta' && !passed && !isActive && (
                        <button 
                          className={`btn-pasamos ${isDestino ? 'btn-llegamos' : ''}`} 
                          onClick={() => marcarParada(parada.id, index, pids)}
                          style={isDestino ? { background: 'linear-gradient(135deg, #3b82f6, #2563eb)' } : {}}
                        >
                          <i className={`bi ${isDestino ? 'bi-flag-fill' : 'bi-check2-circle'} me-1`}></i>
                          {isDestino ? 'Llegamos' : 'Pasamos'}
                        </button>
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
