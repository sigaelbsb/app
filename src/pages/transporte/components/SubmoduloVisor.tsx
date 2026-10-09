import React, { useMemo } from 'react';

interface SubmoduloVisorProps {
  onBack?: () => void;
  opRutaId: string;
  setOpRutaId: (id: string) => void;
  opSentido: string;
  setOpSentido: (sentido: string) => void;
  rutas: any[];
  opActual: any;
  user: any;
  estudiantes: any[];
  docentes: any[];
  getIdsWithEscuela: (ruta: any, sentido: 'Casa - Escuela' | 'Escuela - Casa') => string[];
  getParadasWithEscuela: (pids: string[]) => any[];
  BusProgressBar: React.ComponentType<{ total: number; current: number; finalizada: boolean }>;
  AnimatedBusSVG: React.ComponentType<{ size?: number; className?: string }>;
  BusStopIcon: React.ComponentType<{ size?: number; active?: boolean }>;
  escCodigo?: 'sb' | 'lb';
}

export const SubmoduloVisor: React.FC<SubmoduloVisorProps> = ({
  onBack,
  opRutaId,
  setOpRutaId,
  opSentido,
  setOpSentido,
  rutas,
  opActual,
  user,
  estudiantes,
  docentes,
  getIdsWithEscuela,
  getParadasWithEscuela,
  BusProgressBar,
  AnimatedBusSVG,
  BusStopIcon,
  escCodigo = 'sb'
}) => {
  const esRepresentante = (user?.rol || '').toLowerCase().includes('representante');
  const userCedulaNorm = (user?.cedula || '').replace(/\D/g, '');

  // =========================================================================
  // AISLAMIENTO ESTRICTO PARA REPRESENTANTES:
  // Solo rutas asignadas a los hijos/representados en la escuela
  // =========================================================================
  const { misRepresentados, rutasPermitidas } = useMemo(() => {
    if (!esRepresentante) {
      return { misRepresentados: [], rutasPermitidas: rutas };
    }

    // Filtrar los estudiantes que corresponden a este representante
    const hijos = (estudiantes || []).filter(est => {
      const repCed = (est.cedula_representante || est.datos_actualizados?.representante_cedula || '').replace(/\D/g, '');
      const idRep = est.id_representante || est.datos_actualizados?.id_representante;
      return (userCedulaNorm && repCed === userCedulaNorm) || (idRep && idRep === user?.id_usuario);
    });

    // Rutas asignadas a los hijos (nombres o IDs)
    const rutasHijosNombres = new Set<string>();
    hijos.forEach(h => {
      const r = h.datos_actualizados?.ruta_transporte;
      if (r) rutasHijosNombres.add(String(r).trim().toLowerCase());
    });

    const rutasFiltradas = rutas.filter(r => {
      const nom = String(r.nombre || '').trim().toLowerCase();
      const id = String(r.id || '').trim().toLowerCase();
      return rutasHijosNombres.has(nom) || rutasHijosNombres.has(id);
    });

    return { misRepresentados: hijos, rutasPermitidas: rutasFiltradas };
  }, [esRepresentante, userCedulaNorm, user, estudiantes, rutas]);

  // Si la ruta activa no está en las permitidas, o si no hay ruta seleccionada y hay permitidas, autoseleccionar
  React.useEffect(() => {
    if (rutasPermitidas.length > 0) {
      if (!opRutaId || !rutasPermitidas.some(r => r.id === opRutaId)) {
        setOpRutaId(rutasPermitidas[0].id);
      }
    }
  }, [rutasPermitidas, opRutaId, setOpRutaId]);

  const rutaObj = rutas.find(r => r.id === opRutaId);
  const originalPids = rutaObj ? getIdsWithEscuela(rutaObj, opSentido as any) : [];
  const pids = opActual?.historial_paradas?._custom_order ?? originalPids;
  const orderedParadas = getParadasWithEscuela(pids);

  // Ficha de contacto del Docente de Guardia y Chofer
  const docenteAsignado = docentes.find(d => d.id_usuario === rutaObj?.docente_id);

  return (
    <div className="transporte-submod-card card-visor animate__animated animate__fadeInRight mb-4">
      {/* Cabecera del Visor */}
      <div className="transporte-submod-card-header">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2.5">
            {onBack && (
              <button 
                type="button"
                className="btn btn-sm btn-white border rounded-pill px-3 py-1.5 fw-bold text-dark d-flex align-items-center gap-1.5 shadow-xs hover-efecto"
                style={{ fontSize: '0.82rem' }}
                onClick={onBack}
                title="Volver al Dashboard"
              >
                <i className="bi bi-arrow-left text-primary"></i>
                <span>Volver</span>
              </button>
            )}
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-white flex-shrink-0"
              style={{
                width: '42px',
                height: '42px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
              }}
            >
              <i className="bi bi-eye-fill fs-5"></i>
            </div>
            <div>
              <h5 className="fw-black text-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: '1.2rem', letterSpacing: '-0.3px' }}>
                <span>Monitoreo en Vivo de Transporte Escolar</span>
                <span 
                  className="badge rounded-pill fw-bold px-2.5 py-0.5 text-white shadow-xs" 
                  style={{ 
                    background: escCodigo === 'sb' ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'linear-gradient(135deg, #0284c7 0%, #0066ff 100%)',
                    fontSize: '0.72rem' 
                  }}
                >
                  {escCodigo === 'sb' ? 'Sede SB' : 'Sede LB'}
                </span>
              </h5>
              <small className="text-secondary fw-semibold" style={{ fontSize: '0.78rem' }}>
                {esRepresentante 
                  ? 'Seguimiento satelital exclusivo para las rutas asignadas a tus representados.'
                  : 'Seguimiento satelital y avance de paradas para representantes, familias y comunidad escolar.'}
              </small>
            </div>
          </div>

          {opActual?.estado === 'En Ruta' && (
            <span className="badge rounded-pill bg-success text-white px-3 py-1.5 shadow-xs fw-bold d-flex align-items-center gap-1.5">
              <span className="live-dot"></span>
              <span>UNIDAD EN MOVIMIENTO EN VIVO</span>
            </span>
          )}
        </div>
      </div>

      <div className="card-body p-3 p-md-4">

        {/* Alerta de Aislamiento si es Representante */}
        {esRepresentante && (
          <div className="alert alert-light border rounded-4 p-3 mb-3 shadow-xs d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2.5">
              <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-circle">
                <i className="bi bi-shield-check fs-5"></i>
              </div>
              <div>
                <div className="fw-bold text-dark small">Vista Protegida para Representantes Legales</div>
                <div className="text-muted extra-small">
                  Mostrando únicamente las rutas de tus hijos: {misRepresentados.map(h => `${h.nombres_estudiante} (${h.datos_actualizados?.ruta_transporte || 'Sin ruta'})`).join(', ')}
                </div>
              </div>
            </div>
            <span className="badge bg-primary rounded-pill px-3 py-1 text-white fw-bold" style={{ fontSize: '0.72rem' }}>
              {rutasPermitidas.length} {rutasPermitidas.length === 1 ? 'Ruta asignada' : 'Rutas asignadas'}
            </span>
          </div>
        )}

        {/* En caso de que el representante no tenga rutas asignadas */}
        {esRepresentante && rutasPermitidas.length === 0 ? (
          <div className="text-center py-5 bg-light rounded-4 border p-4 text-muted">
            <div className="d-inline-flex p-3 bg-white rounded-circle shadow-xs border mb-2 text-warning">
              <i className="bi bi-exclamation-triangle fs-2"></i>
            </div>
            <h6 className="fw-bold text-dark mt-2 mb-1">Sin Rutas Asignadas</h6>
            <p className="small text-muted mb-0" style={{ maxWidth: 480, margin: '0 auto' }}>
              Tus representados aún no tienen una ruta de transporte escolar registrada en su ficha. Comunícate con la Coordinación de Transporte Escolar para formalizar su asignación.
            </p>
          </div>
        ) : (
          <div>
            {/* Selectores de Ruta y Sentido (Ida / Retorno) */}
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
                  {rutasPermitidas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label className="small text-muted fw-bold mb-1 d-flex align-items-center gap-1">
                  <i className="bi bi-clock-history text-warning"></i>
                  <span>Trayecto / Sentido</span>
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

            {/* FICHA DE CONTACTO DEL PERSONAL ASIGNADO (DOCENTE CON TELÉFONO Y CHOFER) */}
            {rutaObj && (
              <div className="card border rounded-4 p-3 mb-3 shadow-xs bg-white">
                <div className="row align-items-center g-3">
                  {/* Docente de Guardia */}
                  <div className="col-12 col-md-7 border-md-end">
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-2.5 bg-primary bg-opacity-10 text-primary rounded-circle fs-4 flex-shrink-0">
                        <i className="bi bi-person-badge-fill"></i>
                      </div>
                      <div className="min-w-0">
                        <div className="text-muted extra-small fw-bold">DOCENTE DE GUARDIA DE LA RUTA</div>
                        <div className="fw-bold text-dark fs-6 text-truncate">
                          {docenteAsignado?.nombre_completo || 'Docente asignado por coordinación'}
                        </div>
                        {docenteAsignado?.telefono ? (
                          <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
                            <span className="badge bg-light text-dark border fw-bold">
                              📞 {docenteAsignado.telefono}
                            </span>
                            <a
                              href={`tel:${docenteAsignado.telefono}`}
                              className="btn btn-xs btn-success rounded-pill px-2.5 py-0.5 fw-bold d-inline-flex align-items-center gap-1 shadow-xs text-decoration-none"
                              style={{ fontSize: '0.72rem' }}
                            >
                              <i className="bi bi-telephone-fill"></i> Llamar
                            </a>
                            <a
                              href={`https://wa.me/${docenteAsignado.telefono.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-xs btn-outline-success rounded-pill px-2.5 py-0.5 fw-bold d-inline-flex align-items-center gap-1 shadow-xs text-decoration-none"
                              style={{ fontSize: '0.72rem' }}
                            >
                              <i className="bi bi-whatsapp"></i> WhatsApp
                            </a>
                          </div>
                        ) : (
                          <span className="badge bg-warning bg-opacity-10 text-warning-emphasis border extra-small mt-1">
                            Teléfono no registrado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Chofer y Unidad */}
                  <div className="col-12 col-md-5">
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-2.5 bg-warning bg-opacity-10 text-warning-emphasis rounded-circle fs-4 flex-shrink-0">
                        <i className="bi bi-bus-front-fill"></i>
                      </div>
                      <div className="min-w-0">
                        <div className="text-muted extra-small fw-bold">CONDUCTOR Y UNIDAD</div>
                        <div className="fw-bold text-dark fs-6 text-truncate">
                          {rutaObj.chofer_nombre || 'Chofer en asignación'}
                        </div>
                        <div className="small text-muted mt-0.5">
                          {rutaObj.chofer_telefono && <span>📞 {rutaObj.chofer_telefono} &bull; </span>}
                          <span>Placa: {rutaObj.unidad_placa || 'Oficial'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Visualización de la Ruta y Progreso Satelital */}
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
                            <span>{opActual.estado === 'Finalizada' ? '🏁 Unidad Llegó a Destino Final' : '🚍 En Ruta — Recorrido en Vivo'}</span>
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
                      <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>Ruta no iniciada todavía</div>
                      <div className="small text-muted" style={{ fontSize: '0.78rem' }}>El autobús escolar aún no ha comenzado su recorrido para esta ruta hoy. Tan pronto inicie la marcha podrás ver su avance parada por parada.</div>
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
                        key={`stop-${parada.id}-${index}`}
                        className="stepper-stop"
                        style={{ animationDelay: `${index * 0.04}s`, marginBottom: '8px' }}
                      >
                        <div className={`stepper-pin ${pinClass}`} style={{ overflow: 'hidden', flexShrink: 0 }}>
                          {isActive ? (
                            <AnimatedBusSVG size={24} />
                          ) : passed ? (
                            <i className="bi bi-check-lg fw-bold text-white"></i>
                          ) : isSchool ? (
                            <i className="bi bi-building-fill text-purple"></i>
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
                            <div className="stepper-name text-truncate fw-bold">{parada.nombre_parada}</div>
                            {parada.descripcion && (
                              <div className="stepper-desc text-muted extra-small">{parada.descripcion}</div>
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
        )}
      </div>
    </div>
  );
};
