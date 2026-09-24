import React, { useState } from 'react';

interface ConfiguracionViewProps {
  onBack?: () => void;
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
  onBack,
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
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const itemsPerPage = 10;

  // Filtrado de paradas por texto
  const paradasFiltradas = paradas.filter(p => {
    if (!busquedaTexto.trim()) return true;
    const q = busquedaTexto.toLowerCase();
    return (p.nombre_parada || '').toLowerCase().includes(q) || (p.descripcion || '').toLowerCase().includes(q);
  });

  // Filtrado de rutas por texto
  const rutasFiltradas = rutas.filter(r => {
    if (!busquedaTexto.trim()) return true;
    const q = busquedaTexto.toLowerCase();
    return (r.nombre || '').toLowerCase().includes(q) || (r.chofer_nombre || '').toLowerCase().includes(q);
  });

  // Paginated Paradas
  const totalPagesParadas = Math.ceil(paradasFiltradas.length / itemsPerPage);
  const startIndexParadas = (currentPageParadas - 1) * itemsPerPage;
  const paginatedParadas = paradasFiltradas.slice(startIndexParadas, startIndexParadas + itemsPerPage);

  // Paginated Rutas
  const totalPagesRutas = Math.ceil(rutasFiltradas.length / itemsPerPage);
  const startIndexRutas = (currentPageRutas - 1) * itemsPerPage;
  const paginatedRutas = rutasFiltradas.slice(startIndexRutas, startIndexRutas + itemsPerPage);

  return (
    <div className="card shadow-sm border-0 rounded-4 animate__animated animate__fadeInRight overflow-hidden">
      {/* ── NAVEGADOR DE PESTAÑAS RESPONSIVE (Scroll Horizontal en Teléfonos) ── */}
      <div className="card-header bg-white pt-3 pb-2 px-3 px-md-4 border-bottom">
        <div className="d-flex align-items-center gap-2 overflow-x-auto text-nowrap pb-1 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
          {onBack && (
            <button 
              type="button"
              className="btn btn-xs btn-light border rounded-pill px-3 py-1.5 fw-bold text-dark d-flex align-items-center gap-1.5 flex-shrink-0 shadow-xs hover-efecto"
              style={{ fontSize: '0.82rem' }}
              onClick={onBack}
              title="Volver al Dashboard"
            >
              <i className="bi bi-arrow-left text-primary"></i>
              <span>Volver</span>
            </button>
          )}

          {canManageParadas && (
            <button 
              type="button"
              className={`btn btn-xs rounded-pill px-3 py-1.5 fw-bold transition-all d-flex align-items-center gap-1.5 flex-shrink-0 ${
                configTab === 'Paradas' 
                  ? 'btn-primary text-white shadow-xs' 
                  : 'btn-light text-muted border'
              }`}
              style={{
                backgroundColor: configTab === 'Paradas' ? '#f97316' : undefined,
                borderColor: configTab === 'Paradas' ? '#ea580c' : undefined,
                fontSize: '0.82rem'
              }}
              onClick={() => { setConfigTab('Paradas'); setBusquedaTexto(''); }}
            >
              <i className="bi bi-geo-alt-fill"></i>
              <span>Catálogo de Paradas</span>
              <span className="badge bg-white text-dark rounded-pill ms-1" style={{ fontSize: '0.68rem' }}>
                {paradas.length}
              </span>
            </button>
          )}

          {canManageRutas && (
            <button 
              type="button"
              className={`btn btn-xs rounded-pill px-3 py-1.5 fw-bold transition-all d-flex align-items-center gap-1.5 flex-shrink-0 ${
                configTab === 'Rutas' 
                  ? 'btn-primary text-white shadow-xs' 
                  : 'btn-light text-muted border'
              }`}
              style={{
                backgroundColor: configTab === 'Rutas' ? '#f97316' : undefined,
                borderColor: configTab === 'Rutas' ? '#ea580c' : undefined,
                fontSize: '0.82rem'
              }}
              onClick={() => { setConfigTab('Rutas'); setBusquedaTexto(''); }}
            >
              <i className="bi bi-signpost-split-fill"></i>
              <span>Secuencia de Rutas</span>
              <span className="badge bg-white text-dark rounded-pill ms-1" style={{ fontSize: '0.68rem' }}>
                {rutas.length}
              </span>
            </button>
          )}

          {canManageRutas && (
            <button 
              type="button"
              className={`btn btn-xs rounded-pill px-3 py-1.5 fw-bold transition-all d-flex align-items-center gap-1.5 flex-shrink-0 ${
                configTab === 'Asignacion' 
                  ? 'btn-primary text-white shadow-xs' 
                  : 'btn-light text-muted border'
              }`}
              style={{
                backgroundColor: configTab === 'Asignacion' ? '#f97316' : undefined,
                borderColor: configTab === 'Asignacion' ? '#ea580c' : undefined,
                fontSize: '0.82rem'
              }}
              onClick={() => { setConfigTab('Asignacion'); setBusquedaTexto(''); }}
            >
              <i className="bi bi-person-badge-fill"></i>
              <span>Asignación de Personal</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="card-body p-3 p-md-4 bg-light rounded-bottom-4">
        
        {/* =========================================================
            TAB 1: PARADAS
           ========================================================= */}
        {configTab === 'Paradas' && canManageParadas && (
          <div className="animate__animated animate__fadeIn">
            {/* Barra de Búsqueda y Botones de Acción Responsive */}
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div className="input-group" style={{ maxWidth: '300px' }}>
                <span className="input-group-text bg-white border-end-0 rounded-start-pill text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-white border-start-0 rounded-end-pill form-control-sm"
                  placeholder="Buscar parada o referencia..."
                  value={busquedaTexto}
                  onChange={e => { setBusquedaTexto(e.target.value); setCurrentPageParadas(1); }}
                />
              </div>

              <div className="d-flex align-items-center gap-1.5 flex-wrap">
                {selectedParadaIds.length > 0 && (
                  <button 
                    className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold shadow-xs" 
                    onClick={() => { deleteParadasMasivo(selectedParadaIds); setSelectedParadaIds([]); }}
                  >
                    <i className="bi bi-trash-fill me-1"></i> Borrar ({selectedParadaIds.length})
                  </button>
                )}
                {paradas.length > 0 && (
                  <button 
                    className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold shadow-xs d-none d-sm-inline-flex align-items-center" 
                    onClick={() => deleteParadasMasivo(paradas.map(p => p.id))}
                  >
                    <i className="bi bi-x-circle-fill me-1"></i> Eliminar Todas
                  </button>
                )}
                <button 
                  className="btn btn-sm btn-outline-success rounded-pill px-3 fw-bold shadow-xs d-flex align-items-center gap-1" 
                  onClick={() => setShowModalCargaMasiva(true)}
                >
                  <i className="bi bi-file-earmark-excel"></i>
                  <span>Carga Masiva</span>
                </button>
                <button 
                  className="btn btn-sm btn-warning text-white rounded-pill px-3 fw-bold shadow-xs d-flex align-items-center gap-1" 
                  style={{ backgroundColor: '#f97316', borderColor: '#ea580c' }}
                  onClick={() => { setParadaForm({ id: '', nombre: '', descripcion: '' }); setShowModalParada(true); }}
                >
                  <i className="bi bi-plus-lg"></i>
                  <span>Nueva Parada</span>
                </button>
              </div>
            </div>
            
            {/* VISTA ESCRITORIO: TABLA (>= 768px) */}
            <div className="d-none d-md-block table-responsive px-1">
              <table className="table table-moderna w-100 align-middle">
                <thead className="text-muted small text-uppercase">
                  <tr>
                    <th className="border-0 pb-3" style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        className="form-check-input"
                        checked={selectedParadaIds.length === paradasFiltradas.length && paradasFiltradas.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedParadaIds(paradasFiltradas.map(p => p.id));
                          } else {
                            setSelectedParadaIds([]);
                          }
                        }}
                      />
                    </th>
                    <th className="border-0 pb-3">Nombre de Parada</th>
                    <th className="border-0 pb-3">Punto de Referencia</th>
                    <th className="text-end border-0 pb-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paradasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <div className="text-center py-5">
                          <BusStopIcon size={56} />
                          <div className="text-muted mt-2 fw-semibold">No se encontraron paradas en el catálogo.</div>
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
                          <BusStopIcon size={26} />
                          <span className="fw-bold text-dark">{p.nombre_parada}</span>
                        </div>
                      </td>
                      <td className="text-muted small">{p.descripcion || 'Sin referencia registrada'}</td>
                      <td className="text-end text-nowrap px-3">
                        <button 
                          className="btn btn-sm btn-light border text-primary me-1 shadow-xs" 
                          onClick={() => { setParadaForm({ id: p.id, nombre: p.nombre_parada, descripcion: p.descripcion || '' }); setShowModalParada(true); }}
                          title="Editar parada"
                        >
                          <i className="bi bi-pencil-fill"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-light border text-danger shadow-xs" 
                          onClick={() => deleteParada(p.id)}
                          title="Eliminar parada"
                        >
                          <i className="bi bi-trash-fill"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* VISTA MÓVIL: TARJETAS RESPONSIVE (< 768px) */}
            <div className="d-block d-md-none">
              {paradasFiltradas.length === 0 ? (
                <div className="text-center py-5 bg-white rounded-4 border p-3">
                  <BusStopIcon size={46} />
                  <div className="text-muted small mt-2">No se encontraron paradas en el catálogo.</div>
                </div>
              ) : (
                paginatedParadas.map(p => (
                  <div key={p.id} className="mobile-entity-card">
                    <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                      <div className="d-flex align-items-center gap-2 min-w-0">
                        <input 
                          type="checkbox" 
                          className="form-check-input mt-0"
                          checked={selectedParadaIds.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedParadaIds([...selectedParadaIds, p.id]);
                            } else {
                              setSelectedParadaIds(selectedParadaIds.filter((id: string) => id !== p.id));
                            }
                          }}
                        />
                        <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.92rem' }}>
                          {p.nombre_parada}
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-1 flex-shrink-0">
                        <button 
                          className="btn btn-sm btn-light border text-primary rounded-circle p-1" 
                          style={{ width: '32px', height: '32px' }}
                          onClick={() => { setParadaForm({ id: p.id, nombre: p.nombre_parada, descripcion: p.descripcion || '' }); setShowModalParada(true); }}
                        >
                          <i className="bi bi-pencil-fill"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-light border text-danger rounded-circle p-1" 
                          style={{ width: '32px', height: '32px' }}
                          onClick={() => deleteParada(p.id)}
                        >
                          <i className="bi bi-trash-fill"></i>
                        </button>
                      </div>
                    </div>
                    <div className="text-muted small bg-light p-2 rounded-3 border">
                      <i className="bi bi-geo-alt me-1 text-secondary"></i>
                      {p.descripcion || 'Sin referencia registrada'}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Paginación Responsive */}
            {totalPagesParadas > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3 px-1 flex-wrap gap-2 small">
                <span className="text-muted fw-semibold" style={{ fontSize: '0.78rem' }}>
                  {startIndexParadas + 1}-{Math.min(startIndexParadas + itemsPerPage, paradasFiltradas.length)} de {paradasFiltradas.length}
                </span>
                <ul className="pagination pagination-sm m-0">
                  <li className={`page-item ${currentPageParadas === 1 ? 'disabled' : ''}`}>
                    <button className="page-link rounded-start-pill px-2.5" onClick={() => setCurrentPageParadas(prev => Math.max(prev - 1, 1))}>
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  {Array.from({ length: totalPagesParadas }, (_, i) => i + 1).map(page => (
                    <li key={page} className={`page-item ${currentPageParadas === page ? 'active' : ''}`}>
                      <button className="page-link px-2.5" onClick={() => setCurrentPageParadas(page)}>
                        {page}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPageParadas === totalPagesParadas ? 'disabled' : ''}`}>
                    <button className="page-link rounded-end-pill px-2.5" onClick={() => setCurrentPageParadas(prev => Math.min(prev + 1, totalPagesParadas))}>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 2: RUTAS
           ========================================================= */}
        {configTab === 'Rutas' && canManageRutas && (
          <div className="animate__animated animate__fadeIn">
            {/* Barra de Filtro y Acciones de Rutas */}
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div className="input-group" style={{ maxWidth: '300px' }}>
                <span className="input-group-text bg-white border-end-0 rounded-start-pill text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-white border-start-0 rounded-end-pill form-control-sm"
                  placeholder="Buscar ruta o chofer..."
                  value={busquedaTexto}
                  onChange={e => { setBusquedaTexto(e.target.value); setCurrentPageRutas(1); }}
                />
              </div>

              <div className="d-flex align-items-center gap-1.5 flex-wrap">
                {selectedRutaIds.length > 0 && (
                  <button 
                    className="btn btn-sm btn-outline-success rounded-pill px-3 fw-bold shadow-xs" 
                    onClick={() => compartirRutasMasivo(selectedRutaIds)}
                  >
                    <i className="bi bi-whatsapp me-1"></i> WhatsApp ({selectedRutaIds.length})
                  </button>
                )}
                {selectedRutaIds.length > 0 && (
                  <button 
                    className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold shadow-xs" 
                    onClick={() => { deleteRutasMasivo(selectedRutaIds); setSelectedRutaIds([]); }}
                  >
                    <i className="bi bi-trash-fill me-1"></i> Borrar ({selectedRutaIds.length})
                  </button>
                )}
                <button 
                  className="btn btn-sm btn-warning text-white rounded-pill px-3 fw-bold shadow-xs d-flex align-items-center gap-1" 
                  style={{ backgroundColor: '#f97316', borderColor: '#ea580c' }}
                  onClick={() => { 
                    setRutaForm({ id: '', nombre: '', chofer: '', docente_id: '', validez_desde: '', validez_hasta: '' }); 
                    setParadasTemporales([]); 
                    setShowModalRuta(true); 
                  }}
                >
                  <i className="bi bi-plus-lg"></i>
                  <span>Nueva Ruta</span>
                </button>
              </div>
            </div>

            {/* VISTA ESCRITORIO: TABLA (>= 768px) */}
            <div className="d-none d-md-block table-responsive px-1">
              <table className="table table-moderna w-100 align-middle">
                <thead className="text-muted small text-uppercase">
                  <tr>
                    <th className="border-0 pb-3" style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        className="form-check-input"
                        checked={selectedRutaIds.length === rutasFiltradas.length && rutasFiltradas.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRutaIds(rutasFiltradas.map((r: any) => r.id));
                          } else {
                            setSelectedRutaIds([]);
                          }
                        }}
                      />
                    </th>
                    <th className="border-0 pb-3">Ruta</th>
                    <th className="border-0 pb-3">Paradas en Secuencia</th>
                    <th className="border-0 pb-3">Chofer Asignado</th>
                    <th className="border-0 pb-3">Estatus</th>
                    <th className="text-end border-0 pb-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rutasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="text-center py-5">
                          <AnimatedBusSVG size={48} />
                          <div className="text-muted mt-2 fw-semibold">No hay rutas creadas en el sistema.</div>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedRutas.map((r: any) => {
                    const cantParadas = r.paradas_ruta?.length || 0;
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
                          <div className="fw-bold text-dark">{r.nombre}</div>
                          <div className="text-muted small">ID: {r.id.slice(0, 8)}...</div>
                        </td>
                        <td>
                          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle rounded-pill px-2.5 py-1">
                            <i className="bi bi-geo-alt-fill me-1"></i>{cantParadas} paradas
                          </span>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark small">{r.chofer_nombre || <span className="text-muted fst-italic">Sin chofer</span>}</div>
                        </td>
                        <td>
                          {r.activo !== false ? (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle rounded-pill">Activa</span>
                          ) : (
                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle rounded-pill">Inactiva</span>
                          )}
                        </td>
                        <td className="text-end text-nowrap px-3">
                          <button 
                            className="btn btn-sm btn-light border text-success me-1 shadow-xs" 
                            onClick={() => compartirRuta(r)}
                            title="Compartir por WhatsApp"
                          >
                            <i className="bi bi-whatsapp"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-light border text-primary me-1 shadow-xs" 
                            onClick={() => editRuta(r)}
                            title="Editar ruta"
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-light border text-danger shadow-xs" 
                            onClick={() => deleteRuta(r.id)}
                            title="Eliminar ruta"
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* VISTA MÓVIL: TARJETAS RESPONSIVE (< 768px) */}
            <div className="d-block d-md-none">
              {rutasFiltradas.length === 0 ? (
                <div className="text-center py-5 bg-white rounded-4 border p-3">
                  <AnimatedBusSVG size={40} />
                  <div className="text-muted small mt-2">No hay rutas creadas en el sistema.</div>
                </div>
              ) : (
                paginatedRutas.map((r: any) => {
                  const cantParadas = r.paradas_ruta?.length || 0;
                  return (
                    <div key={r.id} className="mobile-entity-card">
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                        <div className="d-flex align-items-center gap-2 min-w-0">
                          <input 
                            type="checkbox" 
                            className="form-check-input mt-0"
                            checked={selectedRutaIds.includes(r.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRutaIds([...selectedRutaIds, r.id]);
                              } else {
                                setSelectedRutaIds(selectedRutaIds.filter((id: string) => id !== r.id));
                              }
                            }}
                          />
                          <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.92rem' }}>
                            {r.nombre}
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-1 flex-shrink-0">
                          <button 
                            className="btn btn-sm btn-light border text-success rounded-circle p-1" 
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => compartirRuta(r)}
                            title="Compartir por WhatsApp"
                          >
                            <i className="bi bi-whatsapp"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-light border text-primary rounded-circle p-1" 
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => editRuta(r)}
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-light border text-danger rounded-circle p-1" 
                            style={{ width: '32px', height: '32px' }}
                            onClick={() => deleteRuta(r.id)}
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      </div>

                      <div className="d-flex align-items-center justify-content-between bg-light p-2 rounded-3 border flex-wrap gap-2 small">
                        <div>
                          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle rounded-pill me-1.5">
                            {cantParadas} paradas
                          </span>
                          {r.activo !== false ? (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle rounded-pill">Activa</span>
                          ) : (
                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle rounded-pill">Inactiva</span>
                          )}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          <i className="bi bi-person me-1"></i>Chofer: <b>{r.chofer_nombre || 'Sin asignar'}</b>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Paginación Rutas */}
            {totalPagesRutas > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3 px-1 flex-wrap gap-2 small">
                <span className="text-muted fw-semibold" style={{ fontSize: '0.78rem' }}>
                  {startIndexRutas + 1}-{Math.min(startIndexRutas + itemsPerPage, rutasFiltradas.length)} de {rutasFiltradas.length}
                </span>
                <ul className="pagination pagination-sm m-0">
                  <li className={`page-item ${currentPageRutas === 1 ? 'disabled' : ''}`}>
                    <button className="page-link rounded-start-pill px-2.5" onClick={() => setCurrentPageRutas(prev => Math.max(prev - 1, 1))}>
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  {Array.from({ length: totalPagesRutas }, (_, i) => i + 1).map(page => (
                    <li key={page} className={`page-item ${currentPageRutas === page ? 'active' : ''}`}>
                      <button className="page-link px-2.5" onClick={() => setCurrentPageRutas(page)}>
                        {page}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPageRutas === totalPagesRutas ? 'disabled' : ''}`}>
                    <button className="page-link rounded-end-pill px-2.5" onClick={() => setCurrentPageRutas(prev => Math.min(prev + 1, totalPagesRutas))}>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 3: ASIGNACIÓN DE PERSONAL
           ========================================================= */}
        {configTab === 'Asignacion' && canManageRutas && (
          <div className="animate__animated animate__fadeIn">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h6 className="fw-bold text-dark mb-0">Personal Asignado a Unidades</h6>
              {selectedAsignacionIds.length > 0 && (
                <button
                  className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold shadow-xs"
                  onClick={() => {
                    limpiarAsignacionesMasivo(selectedAsignacionIds);
                    setSelectedAsignacionIds([]);
                  }}
                >
                  <i className="bi bi-eraser-fill me-1"></i> Limpiar Asignación ({selectedAsignacionIds.length})
                </button>
              )}
            </div>

            {/* VISTA ESCRITORIO: TABLA (>= 768px) */}
            <div className="d-none d-md-block table-responsive px-1">
              <table className="table table-moderna w-100 align-middle">
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
                          <div className="fw-bold">{r.chofer_nombre || <span className="text-danger small">Sin asignar</span>}</div>
                        </td>
                        <td>
                          <div className="fw-bold">{doc ? doc.nombre_completo : <span className="text-danger small">Sin asignar</span>}</div>
                        </td>
                        <td>
                          <div className="text-secondary small">
                            {r.validez_desde && r.validez_hasta ? (
                              <span>{r.validez_desde} a {r.validez_hasta}</span>
                            ) : (
                              <span className="text-muted">Permanente</span>
                            )}
                          </div>
                        </td>
                        <td className="text-end px-3">
                          <button 
                            className="btn btn-sm btn-outline-primary rounded-pill fw-bold" 
                            onClick={() => {
                              setRutaForm(r);
                              setShowModalAsignacion(true);
                            }}
                          >
                            <i className="bi bi-person-lines-fill me-1"></i>Asignar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* VISTA MÓVIL: CARDS (< 768px) */}
            <div className="d-block d-md-none">
              {rutas.length === 0 ? (
                <div className="text-center py-4 bg-white rounded-4 border text-muted small">Debe diseñar una ruta primero.</div>
              ) : (
                rutas.map(r => {
                  const doc = docentes.find(d => d.id_usuario === r.docente_id);
                  return (
                    <div key={r.id} className="mobile-entity-card">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="fw-bold text-dark">{r.nombre}</div>
                        <button 
                          className="btn btn-xs btn-outline-primary rounded-pill px-3 py-1 fw-bold"
                          onClick={() => {
                            setRutaForm(r);
                            setShowModalAsignacion(true);
                          }}
                        >
                          <i className="bi bi-pencil-fill me-1"></i> Asignar
                        </button>
                      </div>
                      <div className="bg-light p-2.5 rounded-3 border small">
                        <div className="mb-1">
                          <i className="bi bi-person-vcard text-secondary me-1"></i>
                          <b>Chofer:</b> {r.chofer_nombre || <span className="text-danger">Sin chofer</span>}
                        </div>
                        <div className="mb-1">
                          <i className="bi bi-person-video3 text-secondary me-1"></i>
                          <b>Docente:</b> {doc ? doc.nombre_completo : <span className="text-danger">Sin asignar</span>}
                        </div>
                        <div>
                          <i className="bi bi-calendar-check text-secondary me-1"></i>
                          <b>Vigencia:</b> {r.validez_desde ? `${r.validez_desde} a ${r.validez_hasta || ''}` : 'Permanente'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
