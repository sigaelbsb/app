import React, { useState } from 'react';

interface ConfiguracionViewProps {
  configTab: 'Paradas' | 'Rutas' | 'Asignacion';
  setConfigTab: (tab: 'Paradas' | 'Rutas' | 'Asignacion') => void;
  canManageParadas: boolean;
  canManageRutas: boolean;
  paradas: any[];
  rutas: any[];
  docentes: any[];
  setParadaForm: (form: any) => void;
  setShowModalParada: (show: boolean) => void;
  setRutaForm: (form: any) => void;
  setParadasTemporales: (pTemp: any[]) => void;
  setShowModalRuta: (show: boolean) => void;
  setShowModalAsignacion: (show: boolean) => void;
  setShowModalCargaMasiva: (show: boolean) => void;
  deleteParada: (id: string) => void;
  deleteParadasMasivo: (ids: string[]) => void;
  deleteRuta: (id: string) => void;
  deleteRutasMasivo: (ids: string[]) => void;
  compartirRuta: (r: any) => void;
  compartirRutasMasivo: (ids: string[]) => void;
  limpiarAsignacionesMasivo: (ids: string[]) => void;
  editRuta: (r: any) => void;
  BusStopIcon: React.ComponentType<{ size?: number; active?: boolean }>;
  AnimatedBusSVG: React.ComponentType<{ size?: number; color?: string; className?: string }>;
}

export const ConfiguracionView: React.FC<ConfiguracionViewProps> = ({
  configTab,
  setConfigTab,
  canManageParadas,
  canManageRutas,
  paradas,
  rutas,
  docentes,
  setParadaForm,
  setShowModalParada,
  setRutaForm,
  setParadasTemporales,
  setShowModalRuta,
  setShowModalAsignacion,
  setShowModalCargaMasiva,
  deleteParada,
  deleteParadasMasivo,
  deleteRuta,
  deleteRutasMasivo,
  compartirRuta,
  compartirRutasMasivo,
  limpiarAsignacionesMasivo,
  editRuta,
  BusStopIcon,
  AnimatedBusSVG
}) => {
  const [selectedRutaIds, setSelectedRutaIds] = useState<string[]>([]);
  const [selectedParadaIds, setSelectedParadaIds] = useState<string[]>([]);
  const [selectedAsignacionIds, setSelectedAsignacionIds] = useState<string[]>([]);
  const [currentPageParadas, setCurrentPageParadas] = useState(1);
  const [currentPageRutas, setCurrentPageRutas] = useState(1);
  const itemsPerPage = 10;

  // Paginated Paradas
  const totalPagesParadas = Math.ceil(paradas.length / itemsPerPage);
  const startIndexParadas = (currentPageParadas - 1) * itemsPerPage;
  const paginatedParadas = paradas.slice(startIndexParadas, startIndexParadas + itemsPerPage);

  // Paginated Rutas
  const totalPagesRutas = Math.ceil(rutas.length / itemsPerPage);
  const startIndexRutas = (currentPageRutas - 1) * itemsPerPage;
  const paginatedRutas = rutas.slice(startIndexRutas, startIndexRutas + itemsPerPage);
  return (
    <div className="card shadow-sm border-0 rounded-4 animate__animated animate__fadeInRight">
      <div className="card-header bg-white pt-4 pb-0 border-bottom-0">
        <ul className="nav nav-tabs border-bottom-0">
          {canManageParadas && (
            <li className="nav-item">
              <button className={`nav-link fw-bold ${configTab === 'Paradas' ? 'active border-bottom-0 bg-light text-primary' : 'text-muted'}`} onClick={() => setConfigTab('Paradas')}>
                <i className="bi bi-geo-alt-fill me-2"></i>Catálogo de Paradas
              </button>
            </li>
          )}
          {canManageRutas && (
            <li className="nav-item">
              <button className={`nav-link fw-bold ${configTab === 'Rutas' ? 'active border-bottom-0 bg-light text-primary' : 'text-muted'}`} onClick={() => setConfigTab('Rutas')}>
                <i className="bi bi-signpost-split-fill me-2"></i>Secuencia de Rutas
              </button>
            </li>
          )}
          {canManageRutas && (
            <li className="nav-item">
              <button className={`nav-link fw-bold ${configTab === 'Asignacion' ? 'active border-bottom-0 bg-light text-primary' : 'text-muted'}`} onClick={() => setConfigTab('Asignacion')}>
                <i className="bi bi-person-badge-fill me-2"></i>Asignación de Personal
              </button>
            </li>
          )}
        </ul>
      </div>
      
      <div className="card-body p-4 p-md-5 bg-light rounded-bottom-4">
        
        {/* TAB: PARADAS */}
        {configTab === 'Paradas' && canManageParadas && (
          <div className="animate__animated animate__fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold text-dark mb-0">Listado de Paradas</h5>
              <div className="d-flex gap-2">
                {selectedParadaIds.length > 0 && (
                  <button className="btn btn-outline-danger rounded-pill px-3 fw-semibold shadow-sm" onClick={() => { deleteParadasMasivo(selectedParadaIds); setSelectedParadaIds([]); }}>
                    <i className="bi bi-trash-fill me-1"></i> Eliminar Seleccionadas ({selectedParadaIds.length})
                  </button>
                )}
                {paradas.length > 0 && (
                  <button className="btn btn-outline-danger rounded-pill px-3 fw-semibold shadow-sm" onClick={() => deleteParadasMasivo(paradas.map(p => p.id))}>
                    <i className="bi bi-x-circle-fill me-1"></i> Eliminar Todas
                  </button>
                )}
                <button className="btn btn-outline-success rounded-pill px-3 fw-semibold shadow-sm" onClick={() => setShowModalCargaMasiva(true)}>
                  <i className="bi bi-file-earmark-excel me-1"></i> Carga Masiva
                </button>
                <button className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm" onClick={() => { setParadaForm({ id: '', nombre: '', descripcion: '' }); setShowModalParada(true); }}>
                  <i className="bi bi-plus-lg me-1"></i> Nueva Parada
                </button>
              </div>
            </div>
            
            <div className="table-responsive px-2">
              <table className="table table-moderna w-100">
                <thead className="text-muted small text-uppercase">
                  <tr>
                    <th className="border-0 pb-3" style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        className="form-check-input"
                        checked={selectedParadaIds.length === paradas.length && paradas.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedParadaIds(paradas.map(p => p.id));
                          } else {
                            setSelectedParadaIds([]);
                          }
                        }}
                      />
                    </th>
                    <th className="border-0 pb-3">Nombre de Parada</th>
                    <th className="border-0 pb-3">Referencia</th>
                    <th className="text-end border-0 pb-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paradas.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <div className="text-center py-5">
                          <BusStopIcon size={56} />
                          <div className="text-muted mt-2">No hay paradas registradas en el catálogo.</div>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedParadas.map((p) => (
                    <tr key={p.id}>
                      <td className="px-3" style={{ width: '40px' }}>
                        <input 
                          type="checkbox" 
                          className="form-check-input"
                          checked={selectedParadaIds.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedParadaIds([...selectedParadaIds, p.id]);
                            } else {
                              setSelectedParadaIds(selectedParadaIds.filter((id: string) => id !== p.id));
                            }
                          }}
                        />
                      </td>
                      <td className="px-3">
                        <div className="d-flex align-items-center gap-2">
                          <BusStopIcon size={28} />
                          <span className="fw-bold text-dark">{p.nombre_parada}</span>
                        </div>
                      </td>
                      <td className="text-muted small">{p.descripcion || 'Sin referencia'}</td>
                      <td className="text-end text-nowrap px-3">
                        <button className="btn btn-sm btn-light border text-primary me-1 shadow-sm" onClick={() => { setParadaForm({ id: p.id, nombre: p.nombre_parada, descripcion: p.descripcion || '' }); setShowModalParada(true); }}><i className="bi bi-pencil-fill"></i></button>
                        <button className="btn btn-sm btn-light border text-danger shadow-sm" onClick={() => deleteParada(p.id)}><i className="bi bi-trash-fill"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPagesParadas > 1 && (
              <nav className="d-flex justify-content-between align-items-center mt-4 px-2 small">
                <span className="text-muted fw-semibold">
                  Mostrando {startIndexParadas + 1}-{Math.min(startIndexParadas + itemsPerPage, paradas.length)} de {paradas.length} paradas
                </span>
                <ul className="pagination pagination-sm m-0">
                  <li className={`page-item ${currentPageParadas === 1 ? 'disabled' : ''}`}>
                    <button className="page-link rounded-start-pill px-3" onClick={() => setCurrentPageParadas(prev => Math.max(prev - 1, 1))}>
                      Anterior
                    </button>
                  </li>
                  {Array.from({ length: totalPagesParadas }, (_, i) => i + 1).map(page => (
                    <li key={page} className={`page-item ${currentPageParadas === page ? 'active' : ''}`}>
                      <button className="page-link px-3" onClick={() => setCurrentPageParadas(page)}>
                        {page}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPageParadas === totalPagesParadas ? 'disabled' : ''}`}>
                    <button className="page-link rounded-end-pill px-3" onClick={() => setCurrentPageParadas(prev => Math.min(prev + 1, totalPagesParadas))}>
                      Siguiente
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        )}

        {/* TAB: RUTAS */}
        {configTab === 'Rutas' && canManageRutas && (
          <div className="animate__animated animate__fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <h5 className="fw-bold text-dark mb-0">Diseño y Secuencia</h5>
              <div className="d-flex gap-2">
                {selectedRutaIds.length > 0 && (
                  <button className="btn btn-outline-success rounded-pill px-3 fw-bold shadow-sm" onClick={() => compartirRutasMasivo(selectedRutaIds)}>
                    <i className="bi bi-whatsapp me-1"></i> Compartir Seleccionadas ({selectedRutaIds.length})
                  </button>
                )}
                {rutas.length > 0 && (
                  <button className="btn btn-outline-secondary rounded-pill px-3 fw-bold shadow-sm" onClick={() => compartirRutasMasivo(rutas.map((r: any) => r.id))}>
                    <i className="bi bi-share-fill me-1"></i> Compartir Todas
                  </button>
                )}
                {selectedRutaIds.length > 0 && (
                  <button className="btn btn-outline-danger rounded-pill px-3 fw-bold shadow-sm" onClick={() => { deleteRutasMasivo(selectedRutaIds); setSelectedRutaIds([]); }}>
                    <i className="bi bi-trash-fill me-1"></i> Eliminar Seleccionadas ({selectedRutaIds.length})
                  </button>
                )}
                {rutas.length > 0 && (
                  <button className="btn btn-outline-danger rounded-pill px-3 fw-bold shadow-sm" onClick={() => deleteRutasMasivo(rutas.map((r: any) => r.id))}>
                    <i className="bi bi-x-circle-fill me-1"></i> Eliminar Todas
                  </button>
                )}
                <button className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" onClick={() => { setRutaForm({ id: '', nombre: '', chofer: '', docente_id: '', validez_desde: '', validez_hasta: '' }); setParadasTemporales([]); setShowModalRuta(true); }}>
                  <i className="bi bi-plus-circle me-1"></i> Nueva Ruta
                </button>
              </div>
            </div>

            <div className="table-responsive px-2">
              <table className="table table-moderna w-100">
                <thead className="text-muted small text-uppercase">
                  <tr>
                    <th className="border-0 pb-3" style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        className="form-check-input"
                        checked={selectedRutaIds.length === rutas.length && rutas.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRutaIds(rutas.map(r => r.id));
                          } else {
                            setSelectedRutaIds([]);
                          }
                        }}
                      />
                    </th>
                    <th className="border-0 pb-3">Ruta</th>
                    <th className="text-center border-0 pb-3">Paradas</th>
                    <th className="text-end border-0 pb-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rutas.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <div className="text-center py-5">
                          <AnimatedBusSVG size={64} color="#cbd5e1" />
                          <div className="text-muted mt-2">No hay rutas diseñadas. ¡Crea tu primera ruta!</div>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedRutas.map((r) => {
                    let len = 0;
                    if (Array.isArray(r.paradas_json)) len = r.paradas_json.length;
                    else if (typeof r.paradas_json === 'string') { try { len = JSON.parse(r.paradas_json).length; } catch(e){} }
                    
                    return (
                      <tr key={r.id}>
                        <td className="px-3" style={{ width: '40px' }}>
                          <input 
                            type="checkbox" 
                            className="form-check-input"
                            checked={selectedRutaIds.includes(r.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRutaIds([...selectedRutaIds, r.id]);
                              } else {
                                setSelectedRutaIds(selectedRutaIds.filter((id: string) => id !== r.id));
                              }
                            }}
                          />
                        </td>
                        <td className="px-3">
                          <div className="d-flex align-items-center gap-2">
                            <AnimatedBusSVG size={32} color="#2563eb" />
                            <div>
                              <span className="fw-bold text-primary">{r.nombre}</span>
                              <div className="mt-1">
                                {r.activo !== false ? (
                                  <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle rounded-pill" style={{ fontSize: '0.65rem' }}>Activa</span>
                                ) : (
                                  <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle rounded-pill" style={{ fontSize: '0.65rem' }}>Inactiva</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-success rounded-pill px-2 py-1">
                            <i className="bi bi-signpost-2-fill me-1"></i>{len} paradas
                          </span>
                        </td>
                        <td className="text-end text-nowrap px-3">
                          <button className="btn btn-sm btn-light border text-success shadow-sm me-1" title="Compartir WhatsApp" onClick={() => compartirRuta(r)}><i className="bi bi-whatsapp"></i></button>
                          <button className="btn btn-sm btn-light border text-primary shadow-sm me-1" onClick={() => editRuta(r)}><i className="bi bi-pencil-fill"></i></button>
                          <button className="btn btn-sm btn-light border text-danger shadow-sm" onClick={() => deleteRuta(r.id)}><i className="bi bi-trash-fill"></i></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPagesRutas > 1 && (
              <nav className="d-flex justify-content-between align-items-center mt-4 px-2 small">
                <span className="text-muted fw-semibold">
                  Mostrando {startIndexRutas + 1}-{Math.min(startIndexRutas + itemsPerPage, rutas.length)} de {rutas.length} rutas
                </span>
                <ul className="pagination pagination-sm m-0">
                  <li className={`page-item ${currentPageRutas === 1 ? 'disabled' : ''}`}>
                    <button className="page-link rounded-start-pill px-3" onClick={() => setCurrentPageRutas(prev => Math.max(prev - 1, 1))}>
                      Anterior
                    </button>
                  </li>
                  {Array.from({ length: totalPagesRutas }, (_, i) => i + 1).map(page => (
                    <li key={page} className={`page-item ${currentPageRutas === page ? 'active' : ''}`}>
                      <button className="page-link px-3" onClick={() => setCurrentPageRutas(page)}>
                        {page}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPageRutas === totalPagesRutas ? 'disabled' : ''}`}>
                    <button className="page-link rounded-end-pill px-3" onClick={() => setCurrentPageRutas(prev => Math.min(prev + 1, totalPagesRutas))}>
                      Siguiente
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        )}

        {/* TAB: ASIGNACION */}
        {configTab === 'Asignacion' && canManageRutas && (
          <div className="animate__animated animate__fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <h5 className="fw-bold text-dark mb-0">Personal Asignado a Rutas</h5>
              {selectedAsignacionIds.length > 0 && (
                <button
                  className="btn btn-outline-danger rounded-pill px-3 fw-bold shadow-sm"
                  onClick={() => {
                    limpiarAsignacionesMasivo(selectedAsignacionIds);
                    setSelectedAsignacionIds([]);
                  }}
                >
                  <i className="bi bi-eraser-fill me-1"></i> Limpiar Asignación ({selectedAsignacionIds.length})
                </button>
              )}
            </div>

            <div className="table-responsive px-2">
              <table className="table table-moderna w-100">
                <thead className="text-muted small text-uppercase">
                  <tr>
                    <th className="border-0 pb-3" style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedAsignacionIds.length === rutas.length && rutas.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAsignacionIds(rutas.map(r => r.id));
                          } else {
                            setSelectedAsignacionIds([]);
                          }
                        }}
                      />
                    </th>
                    <th className="border-0 pb-3">Ruta</th>
                    <th className="border-0 pb-3">Estatus</th>
                    <th className="border-0 pb-3">Chofer Asignado</th>
                    <th className="border-0 pb-3">Docentes de Guardia</th>
                    <th className="border-0 pb-3">Vigencia</th>
                    <th className="text-end border-0 pb-3">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {rutas.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-4 text-muted">Debe diseñar una ruta primero.</td></tr>
                  ) : rutas.map((r) => {
                    const doc = docentes.find(d => d.id_usuario === r.docente_id);
                    return (
                      <tr key={r.id}>
                        <td className="px-3" style={{ width: '40px' }}>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedAsignacionIds.includes(r.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAsignacionIds([...selectedAsignacionIds, r.id]);
                              } else {
                                setSelectedAsignacionIds(selectedAsignacionIds.filter(id => id !== r.id));
                              }
                            }}
                          />
                        </td>
                        <td className="fw-bold text-dark px-3">{r.nombre}</td>
                        <td className="px-3">
                          {r.activo !== false ? (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle rounded-pill">Activa</span>
                          ) : (
                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle rounded-pill">Inactiva</span>
                          )}
                        </td>
                        <td>
                          <div className="text-muted small"><i className="bi bi-person-vcard me-1"></i>Nombre</div>
                          <div className="fw-bold">{r.chofer_nombre || <span className="text-danger">Sin asignar</span>}</div>
                        </td>
                        <td>
                          <div className="text-muted small"><i className="bi bi-person-video3 me-1"></i>Guardia</div>
                          <div className="fw-bold">{doc ? doc.nombre_completo : <span className="text-danger">Sin asignar</span>}</div>
                        </td>
                        <td>
                          <div className="text-muted small"><i className="bi bi-calendar-range me-1"></i>Periodo</div>
                          <div className="fw-bold text-secondary small">
                            {r.validez_desde && r.validez_hasta ? (
                              <span>Desde: <b>{r.validez_desde}</b><br />Hasta: <b>{r.validez_hasta}</b></span>
                            ) : (
                              <span className="text-muted">No establecida</span>
                            )}
                          </div>
                        </td>
                        <td className="text-end px-3">
                          <button className="btn btn-sm btn-outline-primary rounded-pill fw-bold" onClick={() => {
                            setRutaForm(r);
                            setShowModalAsignacion(true);
                          }}>
                            <i className="bi bi-person-lines-fill me-1"></i>Asignar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
