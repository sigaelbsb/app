import { useState, useEffect } from 'react';
// import { supabase } from '../../lib/supabase';
import { usePermisos } from '../../hooks/usePermisos';
// import { useNavigate } from 'react-router-dom';

export const TransporteEscolar = () => {
  const { user, loading: permLoading } = usePermisos();
  // const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'operaciones' | 'rutas' | 'guardias'>('operaciones');

  const [rutas, setRutas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal state
  const [showModalRuta, setShowModalRuta] = useState(false);
  const [savingRuta, setSavingRuta] = useState(false);
  const [rutaForm, setRutaForm] = useState<any>({
    id: '', nombre: '', sectores: '', chofer_nombre: '', chofer_telefono: '', unidad_placa: '', unidad_modelo: ''
  });

  const escCodigo = localStorage.getItem('sigae_escuela_codigo') || 'sb';
  const Swal = (window as any).Swal;

  // Determine user role and permissions
  const isAdmin = ['SuperAdmin', 'Administrador', 'Director', 'Coordinador'].includes(user?.rol || '');
  const isDocente = user?.rol === 'Docente';
  // If not admin and not docente, assume representant/worker viewing their child's transport status.
  const isRepresentante = !isAdmin && !isDocente;

  const fetchRutas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transporte_rutas')
        .select('*')
        .eq('escuela_codigo', escCodigo)
        .order('nombre', { ascending: true });
      if (error) throw error;
      setRutas(data || []);
    } catch (err) {
      console.error('Error fetching rutas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'rutas' && isAdmin) {
      fetchRutas();
    }
  }, [activeTab, escCodigo, isAdmin]);

  const openNewRuta = () => {
    setRutaForm({ id: '', nombre: '', sectores: '', chofer_nombre: '', chofer_telefono: '', unidad_placa: '', unidad_modelo: '' });
    setShowModalRuta(true);
  };

  const openEditRuta = (ruta: any) => {
    setRutaForm({ ...ruta });
    setShowModalRuta(true);
  };

  const saveRuta = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRuta(true);
    try {
      const payload = {
        escuela_codigo: escCodigo,
        nombre: rutaForm.nombre,
        sectores: rutaForm.sectores,
        chofer_nombre: rutaForm.chofer_nombre,
        chofer_telefono: rutaForm.chofer_telefono,
        unidad_placa: rutaForm.unidad_placa,
        unidad_modelo: rutaForm.unidad_modelo,
      };

      if (rutaForm.id) {
        const { error } = await supabase.from('transporte_rutas').update(payload).eq('id', rutaForm.id);
        if (error) throw error;
        Swal.fire('Actualizado', 'Ruta actualizada con éxito', 'success');
      } else {
        const { error } = await supabase.from('transporte_rutas').insert([payload]);
        if (error) throw error;
        Swal.fire('Creado', 'Ruta creada con éxito', 'success');
      }
      setShowModalRuta(false);
      fetchRutas();
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setSavingRuta(false);
    }
  };

  const deleteRuta = async (id: string) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar ruta?',
      text: "Se eliminarán todas las paradas y guardias asociadas.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirm.isConfirmed) {
      try {
        const { error } = await supabase.from('transporte_rutas').delete().eq('id', id);
        if (error) throw error;
        Swal.fire('Eliminado', 'Ruta eliminada', 'success');
        fetchRutas();
      } catch (err: any) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  // Supabase real-time subscription for operations
  useEffect(() => {
    // We will implement real-time tracking here
  }, []);

  if (permLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 animate__animated animate__fadeIn">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
          <i className="bi bi-bus-front text-primary"></i>
          Transporte Escolar
        </h4>
        <div className="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle px-3 py-2 rounded-pill">
          <i className="bi bi-geo-alt-fill me-1"></i>
          Módulo de Monitoreo
        </div>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <ul className="nav nav-pills mb-4 gap-2 border-bottom pb-3">
        <li className="nav-item">
          <button
            className={`nav-link rounded-pill fw-semibold px-4 transition-all ${activeTab === 'operaciones' ? 'active bg-primary text-white shadow-sm' : 'text-muted hover-bg-light'}`}
            onClick={() => setActiveTab('operaciones')}
          >
            <i className="bi bi-broadcast-pin me-2"></i> Operaciones en Vivo
          </button>
        </li>
        {isAdmin && (
          <>
            <li className="nav-item">
              <button
                className={`nav-link rounded-pill fw-semibold px-4 transition-all ${activeTab === 'guardias' ? 'active bg-primary text-white shadow-sm' : 'text-muted hover-bg-light'}`}
                onClick={() => setActiveTab('guardias')}
              >
                <i className="bi bi-shield-check me-2"></i> Docentes de Guardia
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link rounded-pill fw-semibold px-4 transition-all ${activeTab === 'rutas' ? 'active bg-primary text-white shadow-sm' : 'text-muted hover-bg-light'}`}
                onClick={() => setActiveTab('rutas')}
              >
                <i className="bi bi-map me-2"></i> Gestión de Rutas
              </button>
            </li>
          </>
        )}
      </ul>

      {/* CONTENIDO DE LAS PESTAÑAS */}
      <div className="bg-white rounded-4 shadow-sm border p-4">
        {activeTab === 'operaciones' && (
          <div>
            <h5 className="fw-bold text-dark mb-4">Monitor de Rutas en Tiempo Real</h5>
            {isRepresentante && (
              <div className="alert alert-info border-info bg-info bg-opacity-10 rounded-3">
                <i className="bi bi-info-circle-fill me-2"></i>
                Como representante, solo podrás visualizar el estado de las rutas donde tus representados tienen asignación de transporte.
              </div>
            )}
            
            <div className="row g-4">
              <div className="col-12 text-center py-5 text-muted">
                <i className="bi bi-cone-striped fs-1 text-secondary mb-3 d-block"></i>
                <h6>Módulo en construcción</h6>
                <p className="small">Estamos integrando la base de datos de rutas y paradas.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'guardias' && isAdmin && (
          <div>
            <h5 className="fw-bold text-dark mb-4">Asignación de Guardias Semanales</h5>
            <div className="text-center py-5 text-muted">
              <i className="bi bi-shield-lock fs-1 text-secondary mb-3 d-block"></i>
              <h6>Módulo en construcción</h6>
            </div>
          </div>
        )}

        {activeTab === 'rutas' && isAdmin && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold text-dark mb-0">Gestión de Rutas y Paradas</h5>
              <button className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm" onClick={openNewRuta}>
                <i className="bi bi-plus-lg me-1"></i> Nueva Ruta
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Cargando...</span></div>
              </div>
            ) : rutas.length === 0 ? (
              <div className="text-center py-5 text-muted bg-light rounded-4 border">
                <i className="bi bi-signpost-split fs-1 text-secondary mb-3 d-block"></i>
                <h6 className="fw-bold">No hay rutas registradas</h6>
                <p className="small mb-0">Crea la primera ruta de transporte para esta institución.</p>
              </div>
            ) : (
              <div className="row g-3">
                {rutas.map(ruta => (
                  <div key={ruta.id} className="col-md-6 col-lg-4">
                    <div className="card border rounded-4 shadow-sm h-100 hover-card">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="fw-bold text-dark mb-0"><i className="bi bi-bus-front-fill text-primary me-2"></i>{ruta.nombre}</h6>
                          <div className="dropdown">
                            <button className="btn btn-sm btn-light rounded-circle" data-bs-toggle="dropdown">
                              <i className="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                              <li><button className="dropdown-item" onClick={() => openEditRuta(ruta)}><i className="bi bi-pencil me-2 text-primary"></i>Editar Ruta</button></li>
                              <li><button className="dropdown-item"><i className="bi bi-geo-alt me-2 text-success"></i>Gestionar Paradas</button></li>
                              <li><hr className="dropdown-divider" /></li>
                              <li><button className="dropdown-item text-danger" onClick={() => deleteRuta(ruta.id)}><i className="bi bi-trash me-2"></i>Eliminar</button></li>
                            </ul>
                          </div>
                        </div>
                        <div className="small text-muted mb-2">
                          <i className="bi bi-pin-map-fill me-1"></i> <strong>Sectores:</strong> {ruta.sectores || 'No especificados'}
                        </div>
                        <div className="small text-muted mb-2">
                          <i className="bi bi-person-badge-fill me-1"></i> <strong>Chofer:</strong> {ruta.chofer_nombre || 'No asignado'} ({ruta.chofer_telefono || 'S/N'})
                        </div>
                        <div className="small text-muted">
                          <i className="bi bi-truck-front-fill me-1"></i> <strong>Unidad:</strong> {ruta.unidad_modelo || 'S/M'} - {ruta.unidad_placa || 'S/P'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL RUTAS */}
      {showModalRuta && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom bg-light rounded-top-4">
                <h5 className="modal-title fw-bold text-dark">
                  {rutaForm.id ? 'Editar Ruta de Transporte' : 'Nueva Ruta de Transporte'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModalRuta(false)}></button>
              </div>
              <form onSubmit={saveRuta}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Nombre de la Ruta <span className="text-danger">*</span></label>
                    <input type="text" className="form-control input-moderno" required placeholder="Ej. Ruta 1 - La Cruz"
                      value={rutaForm.nombre} onChange={e => setRutaForm({ ...rutaForm, nombre: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Sectores que abarca</label>
                    <textarea className="form-control input-moderno" rows={2} placeholder="Ej. La Cruz, San Vicente, Centro..."
                      value={rutaForm.sectores} onChange={e => setRutaForm({ ...rutaForm, sectores: e.target.value })}></textarea>
                  </div>
                  
                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Nombre del Chofer</label>
                      <input type="text" className="form-control input-moderno" placeholder="Ej. Juan Pérez"
                        value={rutaForm.chofer_nombre} onChange={e => setRutaForm({ ...rutaForm, chofer_nombre: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Teléfono del Chofer</label>
                      <input type="text" className="form-control input-moderno" placeholder="Ej. 0414-1234567"
                        value={rutaForm.chofer_telefono} onChange={e => setRutaForm({ ...rutaForm, chofer_telefono: e.target.value })} />
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Modelo de la Unidad</label>
                      <input type="text" className="form-control input-moderno" placeholder="Ej. Encava 2012"
                        value={rutaForm.unidad_modelo} onChange={e => setRutaForm({ ...rutaForm, unidad_modelo: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Placa</label>
                      <input type="text" className="form-control input-moderno text-uppercase" placeholder="Ej. AB123CD"
                        value={rutaForm.unidad_placa} onChange={e => setRutaForm({ ...rutaForm, unidad_placa: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top bg-light rounded-bottom-4">
                  <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowModalRuta(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={savingRuta}>
                    {savingRuta ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save me-2"></i>}
                    Guardar Ruta
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
