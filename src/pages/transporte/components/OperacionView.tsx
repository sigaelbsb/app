import React from 'react';

interface OperacionViewProps {
  onBack?: () => void;
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
  onBack,
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
    <div className="card shadow-sm border-0 rounded-4 animate__animated animate__fadeInRight overflow-hidden">
      <div className="card-body p-3 p-md-4">
        {/* Cabecera del Submódulo y Acciones de Despacho */}
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2 border-bottom pb-3">
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
                <i className="bi bi-broadcast text-success"></i>
                <span>Operación de Recorrido</span>
                {offlineMode && (
                  <span className="badge bg-warning text-dark rounded-pill fw-bold" style={{ fontSize: '0.72rem' }}>
                    <i className="bi bi-wifi-off me-1"></i> Offline
                  </span>
                )}
              </h5>
              <small className="text-muted" style={{ fontSize: '0.78rem' }}>
                Panel de control para conductores y monitores de ruta escolar.
              </small>
            </div>
          </div>

          <div className="d-flex align-items-center gap-1.5 flex-wrap">
            {opActual && (
              <button 
                className="btn btn-sm btn-outline-warning rounded-pill px-3 shadow-xs fw-bold" 
                onClick={resetRutaActual}
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i>Reiniciar Ruta
              </button>
            )}
            {canControlCoordinacion && (
              <>
                {opSentido === 'Escuela - Casa' && (
                  <button 
                    className="btn btn-sm btn-success rounded-pill px-3 shadow-xs fw-bold d-flex align-items-center gap-1" 
                    onClick={salidaMasiva}
                  >
                    <i className="bi bi-play-all-fill"></i>
                    <span>Salida Masiva</span>
                  </button>
                )}
                <button 
                  className="btn btn-sm btn-outline-danger rounded-pill px-3 shadow-xs fw-bold" 
                  onClick={resetMasivo}
                >
                  <i className="bi bi-exclamation-triangle me-1"></i>Reset General
                </button>
              </>
            )}
          </div>
        </div>

        {/* Selector de Ruta y Momento (Responsive Grid) */}
        <div className="row g-2 g-md-3 mb-3">
          <div className="col-12 col-md-6">
            <label className="small text-muted fw-bold mb-1 d-flex align-items-center gap-1">
              <i className="bi bi-signpost-split-fill text-primary"></i>
              <span>Ruta Escolar Asignada</span>
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
              <span>Sentido de la Jornada</span>
            </label>
            <select 
              className="form-select form-select-sm bg-light border fw-bold rounded-3 shadow-xs" 
              value={opSentido} 
              onChange={e => setOpSentido(e.target.value)}
              style={{ fontSize: '0.88rem', padding: '9px 12px' }}
            >
              <option value="Casa - Escuela">🌅 Ida hacia la Escuela (Mañana)</option>
              <option value="Escuela - Casa">🌇 Retorno a Casa (Tarde)</option>
            </select>
          </div>
        </div>

        {!opRutaId ? (
          <div className="text-center py-5 text-muted bg-light rounded-4 border p-4">
            <div className="d-inline-flex p-3 bg-white rounded-circle shadow-xs border mb-2 text-primary">
              <i className="bi bi-bus-front fs-2"></i>
            </div>
            <h6 className="fw-bold text-dark mt-2 mb-1">Selecciona una ruta para operar</h6>
            <p className="small text-muted mb-0">Elige la unidad en el menú desplegable superior para iniciar o marcar paradas.</p>
          </div>
        ) : (
          <div className="map-bg p-2 p-md-3 rounded-4">
            {/* Barra de Inicio y Reordenamiento */}
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              {!opActual && (
                <button 
                  className="btn btn-warning text-white rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2" 
                  style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', border: 'none' }}
                  onClick={iniciarRecorrido}
                >
                  <i className="bi bi-play-circle-fill fs-5"></i>
                  <span>INICIAR RECORRIDO AHORA</span>
                </button>
              )}
              {!opActual && customPids && (
                <button
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3 shadow-xs"
                  onClick={() => setCustomPids(null)}
                  title="Restaurar orden original de la ruta"
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i>Restablecer orden
                </button>
              )}
              {!opActual && (
                <span className="badge bg-white text-muted border rounded-pill px-3 py-1.5 small shadow-xs">
                  <i className="bi bi-arrows-expand-vertical me-1 text-primary"></i>
                  Usa ↑↓ para reordenar paradas antes de partir
                </span>
              )}
            </div>

            {/* Banner de Estado en Vivo */}
            {opActual && (() => {
              const pids2 = rutaObj ? getIdsWithEscuela(rutaObj, opSentido as any) : [];
              const currentIdx2 = pids2.findIndex((id: string) => id === opActual.ubicacion_actual);
              const progressIdx = opActual.estado === 'Finalizada' ? pids2.length - 1 : currentIdx2;
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
                        <span>{opActual.estado === 'Finalizada' ? '🏁 Ruta Finalizada con Éxito' : '🚍 En Ruta — Recorrido Activo'}</span>
                      </h6>
                      <div className="small text-muted" style={{ fontSize: '0.72rem' }}>
                        Última parada marcada: {new Date(opActual.ultima_actualizacion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    {opActual.estado !== 'Finalizada' && (
                      <span className="bus-here-badge shadow-xs">
                        <span className="live-dot"></span>
                        TRANSMITIENDO EN VIVO
                      </span>
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

            {/* Stepper Timeline de Paradas */}
            <div className="route-stepper">
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
                      animationDelay: `${index * 0.04}s`,
                      opacity: (!isSchool && dragIdx === index) ? 0.45 : 1,
                      outline: (dragIdx !== null && dragIdx !== index && !isSchool) ? '2px dashed #f97316' : 'none',
                      outlineOffset: 3,
                      borderRadius: 14,
                      transition: 'opacity 0.15s, outline 0.15s',
                      cursor: !isSchool && !opActual ? 'grab' : 'default',
                      marginBottom: '8px'
                    }}
                    draggable={!isSchool && !opActual}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    {/* Pin del Stepper */}
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

                    {/* Tarjeta de la Parada */}
                    <div className={`stepper-card ${cardClass}`}>
                      <div className="stepper-card-info" style={{ minWidth: 0, flex: 1 }}>
                        <div className="stepper-step-num" style={{ color: isActive ? '#10b981' : passed ? '#3b82f6' : isSchool ? '#a855f7' : '#94a3b8' }}>
                          {isStart ? 'Punto de Partida' : isSchool ? 'Destino / Plantel' : `Parada ${index}`}
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

                      {/* Botones de Reordenamiento (Antes de iniciar) */}
                      {!isSchool && !opActual && (
                        <div className="d-flex align-items-center gap-1 flex-shrink-0">
                          <button
                            className="btn btn-sm btn-light border rounded-circle shadow-xs"
                            style={{ width: '32px', height: '32px', padding: 0 }}
                            disabled={index === 0}
                            onClick={() => moverParada(index, -1)}
                            title="Subir parada"
                          >
                            <i className="bi bi-chevron-up"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-light border rounded-circle shadow-xs"
                            style={{ width: '32px', height: '32px', padding: 0 }}
                            disabled={index >= orderedParadas.length - 2}
                            onClick={() => moverParada(index, 1)}
                            title="Bajar parada"
                          >
                            <i className="bi bi-chevron-down"></i>
                          </button>
                        </div>
                      )}

                      {/* Badge de parada actual */}
                      {isActive && (
                        <div className="flex-shrink-0">
                          <span className="bus-here-badge shadow-xs">
                            <span className="live-dot"></span>
                            🚍 Aquí
                          </span>
                        </div>
                      )}

                      {/* Botón de Confirmación para el Conductor */}
                      {opActual?.estado === 'En Ruta' && !passed && !isActive && (
                        <button 
                          className={`btn-pasamos ${isDestino ? 'btn-llegamos' : ''} flex-shrink-0`} 
                          onClick={() => marcarParada(parada.id, index, pids)}
                          style={isDestino ? { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' } : {}}
                        >
                          <i className={`bi ${isDestino ? 'bi-flag-fill' : 'bi-check2-circle'} me-1`}></i>
                          <span>{isDestino ? '¡Llegamos!' : '¡Pasamos!'}</span>
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
