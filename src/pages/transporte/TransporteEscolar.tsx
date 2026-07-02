import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { usePermisos } from '../../hooks/usePermisos';
// import { useNavigate } from 'react-router-dom';

export const TransporteEscolar = () => {
  const { loading: permLoading, tienePermiso } = usePermisos();
  // const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'operaciones' | 'rutas' | 'guardias'>('operaciones');

  const [rutas, setRutas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [showModalRuta, setShowModalRuta] = useState(false);
  const [savingRuta, setSavingRuta] = useState(false);
  const [rutaForm, setRutaForm] = useState<any>({
    id: '', nombre: '', sectores: '', chofer_nombre: '', chofer_telefono: '', unidad_placa: '', unidad_modelo: ''
  });

  // Modal Paradas state
  const [showModalParadas, setShowModalParadas] = useState(false);
  const [rutaActivaParaParadas, setRutaActivaParaParadas] = useState<any>(null);
  const [paradas, setParadas] = useState<any[]>([]);
  const [loadingParadas, setLoadingParadas] = useState(false);
  const [paradaForm, setParadaForm] = useState({ id: '', nombre: '', descripcion: '', orden: 1 });
  const [savingParada, setSavingParada] = useState(false);

  // Guardias state
  const [guardias, setGuardias] = useState<any[]>([]);
  const [loadingGuardias, setLoadingGuardias] = useState(false);
  const [showModalGuardia, setShowModalGuardia] = useState(false);
  const [savingGuardia, setSavingGuardia] = useState(false);
  const [guardiaForm, setGuardiaForm] = useState({ id: '', ruta_id: '', docente_id: '', docente_nombre: '', semana_inicio: '', semana_fin: '' });
  const [docentesOptions, setDocentesOptions] = useState<any[]>([]);

  // Tracking / Operaciones state
  const [opRutaId, setOpRutaId] = useState('');
  const [opSentido, setOpSentido] = useState('Casa - Escuela');
  const [opActual, setOpActual] = useState<any>(null);
  const [opParadas, setOpParadas] = useState<any[]>([]);
  const [loadingTracking, setLoadingTracking] = useState(false);

  const escCodigo = localStorage.getItem('sigae_escuela_codigo') || 'sb';
  const Swal = (window as any).Swal;

  // Determine user role and permissions using precise sub-permissions
  const canManageRutas = tienePermiso('Gestión de Rutas');
  const canManageParadas = tienePermiso('Gestión de Paradas');
  const canOperateTracking = tienePermiso('Operación (Tracking)');

  // Si no tiene ningún permiso específico, asumimos rol base (SuperAdmin tiene todo por defecto)

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
    if (activeTab === 'rutas' && canManageRutas) {
      fetchRutas();
    }
    if (activeTab === 'guardias' && canOperateTracking) {
      fetchGuardias();
      if (canManageRutas) {
        fetchRutas();
        fetchDocentes();
      }
    }
    if (activeTab === 'operaciones') {
      fetchRutas(); // Needed for dropdown
    }
  }, [activeTab, escCodigo, canManageRutas, canOperateTracking]);

  useEffect(() => {
    if (activeTab === 'operaciones' && opRutaId) {
      cargarTracking(opRutaId, opSentido);
    }
  }, [opRutaId, opSentido]);

  const cargarTracking = async (rutaId: string, sentido: string) => {
    setLoadingTracking(true);
    try {
      // Fetch Paradas
      const { data: paradasData } = await supabase
        .from('transporte_paradas')
        .select('*')
        .eq('ruta_id', rutaId)
        .order('orden', { ascending: true });
      
      let orderedParadas = paradasData || [];
      if (sentido === 'Escuela - Casa') {
        // En reversa si es de la escuela a la casa
        orderedParadas = [...orderedParadas].reverse();
      }
      setOpParadas(orderedParadas);

      // Fetch Operacion actual (Today)
      const today = new Date().toISOString().split('T')[0];
      const { data: opData } = await supabase
        .from('transporte_operaciones')
        .select('*')
        .eq('ruta_id', rutaId)
        .eq('escuela_codigo', escCodigo)
        .eq('fecha', today)
        .eq('sentido', sentido)
        .maybeSingle();

      setOpActual(opData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingTracking(false);
    }
  };

  const iniciarRecorrido = async () => {
    try {
      const payload = {
        ruta_id: opRutaId,
        escuela_codigo: escCodigo,
        sentido: opSentido,
        estado: 'En Ruta',
        ubicacion_actual: opParadas.length > 0 ? opParadas[0].id : null,
      };
      const { error } = await supabase.from('transporte_operaciones').insert([payload]);
      if (error) throw error;
      cargarTracking(opRutaId, opSentido);
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  const actualizarUbicacion = async (paradaId: string, index: number) => {
    if (!opActual) return;
    const isEnd = index === opParadas.length - 1;
    try {
      const { error } = await supabase
        .from('transporte_operaciones')
        .update({ 
          ubicacion_actual: paradaId, 
          estado: isEnd ? 'Finalizada' : 'En Ruta',
          ultima_actualizacion: new Date().toISOString()
        })
        .eq('id', opActual.id);
      if (error) throw error;
      cargarTracking(opRutaId, opSentido);
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  const fetchGuardias = async () => {
    setLoadingGuardias(true);
    try {
      const { data, error } = await supabase
        .from('transporte_guardias')
        .select('*, ruta:transporte_rutas!inner(nombre, escuela_codigo)')
        .eq('ruta.escuela_codigo', escCodigo)
        .order('semana_inicio', { ascending: false });
      if (error) throw error;
      setGuardias(data || []);
    } catch (err: any) {
      console.error('Error fetching guardias:', err);
    } finally {
      setLoadingGuardias(false);
    }
  };

  const fetchDocentes = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nombres, apellidos, id_escuela')
        .eq('rol', 'Docente');
      if (error) throw error;
      // As teachers can be in multiple schools via JSON, this basic filter handles direct association, 
      // but ideally you list all and let the coordinator pick.
      setDocentesOptions(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const saveGuardia = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGuardia(true);
    try {
      const payload = {
        ruta_id: guardiaForm.ruta_id,
        docente_id: guardiaForm.docente_id,
        docente_nombre: guardiaForm.docente_nombre,
        semana_inicio: guardiaForm.semana_inicio,
        semana_fin: guardiaForm.semana_fin
      };
      if (guardiaForm.id) {
        const { error } = await supabase.from('transporte_guardias').update(payload).eq('id', guardiaForm.id);
        if (error) throw error;
        Swal.fire('Actualizado', 'Guardia actualizada', 'success');
      } else {
        const { error } = await supabase.from('transporte_guardias').insert([payload]);
        if (error) throw error;
        Swal.fire('Creado', 'Guardia asignada', 'success');
      }
      setShowModalGuardia(false);
      fetchGuardias();
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setSavingGuardia(false);
    }
  };

  const deleteGuardia = async (id: string) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar guardia?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
    });
    if (confirm.isConfirmed) {
      try {
        const { error } = await supabase.from('transporte_guardias').delete().eq('id', id);
        if (error) throw error;
        fetchGuardias();
      } catch (err: any) {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

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

  const openGestionarParadas = async (ruta: any) => {
    setRutaActivaParaParadas(ruta);
    setParadaForm({ id: '', nombre: '', descripcion: '', orden: 1 });
    setShowModalParadas(true);
    fetchParadas(ruta.id);
  };

  const fetchParadas = async (rutaId: string) => {
    setLoadingParadas(true);
    try {
      const { data, error } = await supabase
        .from('transporte_paradas')
        .select('*')
        .eq('ruta_id', rutaId)
        .order('orden', { ascending: true });
      if (error) throw error;
      setParadas(data || []);
      setParadaForm({ id: '', nombre: '', descripcion: '', orden: (data?.length || 0) + 1 });
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingParadas(false);
    }
  };

  const saveParada = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingParada(true);
    try {
      const payload = {
        ruta_id: rutaActivaParaParadas.id,
        nombre: paradaForm.nombre,
        descripcion: paradaForm.descripcion,
        orden: paradaForm.orden
      };
      
      if (paradaForm.id) {
        const { error } = await supabase.from('transporte_paradas').update(payload).eq('id', paradaForm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('transporte_paradas').insert([payload]);
        if (error) throw error;
      }
      fetchParadas(rutaActivaParaParadas.id);
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    } finally {
      setSavingParada(false);
    }
  };

  const deleteParada = async (id: string) => {
    try {
      const { error } = await supabase.from('transporte_paradas').delete().eq('id', id);
      if (error) throw error;
      fetchParadas(rutaActivaParaParadas.id);
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
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
        {canOperateTracking && (
          <>
            <li className="nav-item">
              <button
                className={`nav-link rounded-pill fw-semibold px-4 transition-all ${activeTab === 'guardias' ? 'active bg-primary text-white shadow-sm' : 'text-muted hover-bg-light'}`}
                onClick={() => setActiveTab('guardias')}
              >
                <i className="bi bi-shield-check me-2"></i> Docentes de Guardia
              </button>
            </li>
          </>
        )}
        {canManageRutas && (
          <>
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
        {/* CSS para el Rutograma tipo Metro */}
        <style>{`
          .timeline-rutograma { border-left: 4px solid #0dcaf0; margin-left: 20px; padding-left: 25px; position: relative; margin-top: 10px; padding-bottom: 5px; }
          .timeline-rutograma.finalizada { border-left-color: #198754; }
          .timeline-node { position: relative; margin-bottom: 15px; }
          .timeline-icon { position: absolute; left: -45px; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border-radius: 50%; background: white; border: 4px solid #0dcaf0; display: flex; align-items: center; justify-content: center; z-index: 2; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 1.1rem; }
          .timeline-icon.start { border-color: #f97316; color: #f97316; }
          .timeline-icon.active { border-color: #198754; color: #198754; animation: pulse-border 1.5s infinite; background: #d1e7dd; }
          .timeline-icon.passed { border-color: #198754; color: #198754; }
          .timeline-icon.end { border-color: #dc3545; color: #dc3545; }
          .timeline-content { background: #f8fafc; padding: 12px 18px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; }
          .timeline-content:hover { background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .timeline-content.active { border-color: #198754; background: #f8fff9; }
          @keyframes pulse-border { 0% { box-shadow: 0 0 0 0 rgba(25, 135, 84, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(25, 135, 84, 0); } 100% { box-shadow: 0 0 0 0 rgba(25, 135, 84, 0); } }
        `}</style>

        {activeTab === 'operaciones' && (
          <div>
            <div className="card shadow-sm border-0 rounded-4">
              <div className="card-body p-4 p-md-5">
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3 border-bottom pb-3">
                  <h5 className="fw-bold text-dark mb-0"><i className="bi bi-geo-alt-fill text-success me-2"></i>Seguimiento en Vivo (Rutograma)</h5>
                  {canOperateTracking && opRutaId && !opActual && (
                    <button className="btn btn-warning rounded-pill px-4 fw-bold shadow-sm" onClick={iniciarRecorrido}>
                      <i className="bi bi-play-circle me-2"></i>Iniciar Recorrido
                    </button>
                  )}
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="small text-muted fw-bold mb-1">Ruta</label>
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

                {loadingTracking ? (
                  <div className="text-center py-5"><div className="spinner-border text-success" role="status"></div></div>
                ) : !opRutaId ? (
                  <div className="text-center py-5 text-muted bg-light rounded-4 border">
                    <i className="bi bi-map fs-1 text-secondary mb-3 d-block"></i>
                    <h6 className="fw-bold">Seleccione una ruta</h6>
                    <p className="small mb-0">Para visualizar o iniciar el recorrido.</p>
                  </div>
                ) : opParadas.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-geo fs-1 mb-2 d-block"></i>
                    Esta ruta no tiene paradas registradas.
                  </div>
                ) : (
                  <div>
                    {opActual && (
                      <div className={`alert ${opActual.estado === 'Finalizada' ? 'alert-success' : 'alert-primary'} rounded-4 border-0 shadow-sm mb-4 d-flex align-items-center`}>
                        <div className="fs-1 me-3">
                          {opActual.estado === 'Finalizada' ? <i className="bi bi-check-circle-fill"></i> : <i className="bi bi-bus-front-fill"></i>}
                        </div>
                        <div>
                          <h6 className="fw-bold mb-1">Estado: {opActual.estado}</h6>
                          <div className="small opacity-75">Última actualización: {new Date(opActual.ultima_actualizacion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                      </div>
                    )}

                    <div className={`timeline-rutograma ${opActual?.estado === 'Finalizada' ? 'finalizada' : ''}`}>
                      {opParadas.map((parada, index) => {
                        const isStart = index === 0;
                        const isEnd = index === opParadas.length - 1;
                        let iconClass = isStart ? 'start' : isEnd ? 'end' : 'stop';
                        let passed = false;
                        let isActive = false;

                        if (opActual) {
                          const currentIdx = opParadas.findIndex(p => p.id === opActual.ubicacion_actual);
                          if (index < currentIdx) {
                            passed = true;
                            iconClass = 'passed';
                          } else if (index === currentIdx && opActual.estado !== 'Finalizada') {
                            isActive = true;
                            iconClass = 'active';
                          } else if (opActual.estado === 'Finalizada') {
                            passed = true;
                            iconClass = 'passed';
                          }
                        }

                        return (
                          <div key={parada.id} className="timeline-node">
                            <div className={`timeline-icon ${iconClass}`}>
                              {isActive ? <i className="bi bi-bus-front"></i> : isEnd ? <i className="bi bi-flag"></i> : passed ? <i className="bi bi-check"></i> : <i className="bi bi-geo"></i>}
                            </div>
                            <div className={`timeline-content ${isActive ? 'active shadow-sm' : ''}`}>
                              <div>
                                <h6 className="fw-bold mb-1 text-dark">{parada.nombre}</h6>
                                {parada.descripcion && <p className="small text-muted mb-0">{parada.descripcion}</p>}
                              </div>
                              
                              {canOperateTracking && opActual?.estado === 'En Ruta' && !passed && !isActive && (
                                <button 
                                  className="btn btn-sm btn-outline-success rounded-pill fw-bold" 
                                  onClick={() => actualizarUbicacion(parada.id, index)}
                                >
                                  Pasar por aquí
                                </button>
                              )}
                              
                              {isActive && (
                                <span className="badge bg-success shadow-sm rounded-pill px-3 py-2">
                                  <span className="spinner-grow spinner-grow-sm me-2" role="status" style={{width: '10px', height: '10px'}}></span>
                                  Unidad aquí
                                </span>
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
          </div>
        )}

        {activeTab === 'guardias' && canOperateTracking && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold text-dark mb-0">Asignación de Guardias Semanales</h5>
              {canManageRutas && (
                <button className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm" onClick={() => {
                  setGuardiaForm({ id: '', ruta_id: '', docente_id: '', docente_nombre: '', semana_inicio: '', semana_fin: '' });
                  setShowModalGuardia(true);
                }}>
                  <i className="bi bi-shield-plus me-1"></i> Nueva Asignación
                </button>
              )}
            </div>
            
            {loadingGuardias ? (
              <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
            ) : guardias.length === 0 ? (
              <div className="text-center py-5 text-muted bg-light rounded-4 border">
                <i className="bi bi-shield-x fs-1 text-secondary mb-3 d-block"></i>
                <h6 className="fw-bold">No hay guardias asignadas</h6>
                <p className="small mb-0">Asigna docentes a las rutas para que realicen el tracking.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Docente de Guardia</th>
                      <th>Ruta Asignada</th>
                      <th>Semana</th>
                      <th>Estado</th>
                      {canManageRutas && <th className="text-end">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {guardias.map(guardia => {
                      const today = new Date().toISOString().split('T')[0];
                      const isPast = today > guardia.semana_fin;
                      const isCurrent = today >= guardia.semana_inicio && today <= guardia.semana_fin;
                      
                      return (
                        <tr key={guardia.id}>
                          <td>
                            <div className="fw-bold text-dark"><i className="bi bi-person-badge text-primary me-2"></i>{guardia.docente_nombre}</div>
                          </td>
                          <td><span className="badge bg-secondary bg-opacity-10 text-secondary border">{guardia.ruta?.nombre}</span></td>
                          <td>
                            <div className="small text-muted">Del {guardia.semana_inicio}</div>
                            <div className="small text-muted">Al {guardia.semana_fin}</div>
                          </td>
                          <td>
                            {isCurrent ? <span className="badge bg-success">Activa</span> : 
                             isPast ? <span className="badge bg-secondary">Finalizada</span> : 
                             <span className="badge bg-warning text-dark">Programada</span>}
                          </td>
                          {canManageRutas && (
                            <td className="text-end">
                              <button className="btn btn-sm text-primary" onClick={() => {
                                setGuardiaForm(guardia);
                                setShowModalGuardia(true);
                              }}><i className="bi bi-pencil"></i></button>
                              <button className="btn btn-sm text-danger" onClick={() => deleteGuardia(guardia.id)}><i className="bi bi-trash"></i></button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rutas' && canManageRutas && (
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
                              {canManageParadas && (
                                <li><button className="dropdown-item" onClick={() => openGestionarParadas(ruta)}><i className="bi bi-geo-alt me-2 text-success"></i>Gestionar Paradas</button></li>
                              )}
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

      {/* MODAL PARADAS */}
      {showModalParadas && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom bg-light rounded-top-4">
                <h5 className="modal-title fw-bold text-dark">
                  Paradas: {rutaActivaParaParadas?.nombre}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModalParadas(false)}></button>
              </div>
              <div className="modal-body p-4 bg-light">
                <div className="row g-4">
                  <div className="col-md-5">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                      <div className="card-body">
                        <h6 className="fw-bold mb-3">{paradaForm.id ? 'Editar Parada' : 'Nueva Parada'}</h6>
                        <form onSubmit={saveParada}>
                          <div className="mb-3">
                            <label className="form-label fw-semibold small">Orden en el recorrido</label>
                            <input type="number" className="form-control input-moderno" required min="1"
                              value={paradaForm.orden} onChange={e => setParadaForm({ ...paradaForm, orden: parseInt(e.target.value) })} />
                          </div>
                          <div className="mb-3">
                            <label className="form-label fw-semibold small">Nombre de la parada <span className="text-danger">*</span></label>
                            <input type="text" className="form-control input-moderno" required placeholder="Ej. Panadería El Trigal"
                              value={paradaForm.nombre} onChange={e => setParadaForm({ ...paradaForm, nombre: e.target.value })} />
                          </div>
                          <div className="mb-3">
                            <label className="form-label fw-semibold small">Referencia / Descripción</label>
                            <textarea className="form-control input-moderno" rows={2} placeholder="Frente a la farmacia..."
                              value={paradaForm.descripcion} onChange={e => setParadaForm({ ...paradaForm, descripcion: e.target.value })}></textarea>
                          </div>
                          <button type="submit" className="btn btn-primary w-100 rounded-pill fw-semibold" disabled={savingParada}>
                            {savingParada ? 'Guardando...' : 'Guardar Parada'}
                          </button>
                          {paradaForm.id && (
                            <button type="button" className="btn btn-light w-100 rounded-pill mt-2" 
                              onClick={() => setParadaForm({ id: '', nombre: '', descripcion: '', orden: paradas.length + 1 })}>
                              Cancelar Edición
                            </button>
                          )}
                        </form>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-7">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                      <div className="card-body">
                        <h6 className="fw-bold mb-3">Recorrido de la Ruta</h6>
                        {loadingParadas ? (
                          <div className="text-center py-4"><div className="spinner-border text-primary spinner-border-sm" role="status"></div></div>
                        ) : paradas.length === 0 ? (
                          <div className="text-center text-muted py-4 small">
                            <i className="bi bi-geo text-secondary fs-3 d-block mb-2"></i>
                            No hay paradas registradas aún.
                          </div>
                        ) : (
                          <ul className="list-group list-group-flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {paradas.map((parada, index) => (
                              <li key={parada.id} className="list-group-item px-0 py-3 border-bottom-0 d-flex align-items-start">
                                <div className="me-3 mt-1 d-flex flex-column align-items-center">
                                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', fontSize: '0.85rem' }}>
                                    {parada.orden}
                                  </div>
                                  {index < paradas.length - 1 && (
                                    <div style={{ width: '2px', height: '100%', backgroundColor: '#dee2e6', marginTop: '4px', minHeight: '30px' }}></div>
                                  )}
                                </div>
                                <div className="flex-grow-1">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <h6 className="mb-0 fw-bold">{parada.nombre}</h6>
                                    <div>
                                      <button className="btn btn-sm text-primary py-0 px-1" onClick={() => setParadaForm({ ...parada })}><i className="bi bi-pencil"></i></button>
                                      <button className="btn btn-sm text-danger py-0 px-1" onClick={() => deleteParada(parada.id)}><i className="bi bi-trash"></i></button>
                                    </div>
                                  </div>
                                  {parada.descripcion && <p className="small text-muted mb-0 mt-1">{parada.descripcion}</p>}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GUARDIAS */}
      {showModalGuardia && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom bg-light rounded-top-4">
                <h5 className="modal-title fw-bold text-dark">
                  {guardiaForm.id ? 'Editar Guardia' : 'Asignar Guardia Semanal'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModalGuardia(false)}></button>
              </div>
              <form onSubmit={saveGuardia}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Ruta de Transporte <span className="text-danger">*</span></label>
                    <select className="form-select input-moderno" required value={guardiaForm.ruta_id} onChange={e => setGuardiaForm({ ...guardiaForm, ruta_id: e.target.value })}>
                      <option value="">Seleccione una ruta...</option>
                      {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Docente de Guardia <span className="text-danger">*</span></label>
                    <select className="form-select input-moderno" required value={guardiaForm.docente_id} onChange={e => {
                      const selected = docentesOptions.find(d => d.id === e.target.value);
                      setGuardiaForm({ 
                        ...guardiaForm, 
                        docente_id: e.target.value, 
                        docente_nombre: selected ? `${selected.nombres} ${selected.apellidos}` : '' 
                      });
                    }}>
                      <option value="">Seleccione un docente...</option>
                      {docentesOptions.map(d => <option key={d.id} value={d.id}>{d.nombres} {d.apellidos}</option>)}
                    </select>
                  </div>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Fecha Inicio <span className="text-danger">*</span></label>
                      <input type="date" className="form-control input-moderno" required
                        value={guardiaForm.semana_inicio} onChange={e => setGuardiaForm({ ...guardiaForm, semana_inicio: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Fecha Fin <span className="text-danger">*</span></label>
                      <input type="date" className="form-control input-moderno" required
                        value={guardiaForm.semana_fin} onChange={e => setGuardiaForm({ ...guardiaForm, semana_fin: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top bg-light rounded-bottom-4">
                  <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowModalGuardia(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={savingGuardia}>
                    {savingGuardia ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save me-2"></i>}
                    Asignar Guardia
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
