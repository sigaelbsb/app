import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';

interface ConocimientoItem {
  id: string;
  tema: string;
  palabras_clave: string[];
  respuesta: string;
  accion_tipo: string | null;
  accion_valor: string | null;
  roles_permitidos: string[];
  creado_en?: string;
}

interface PreguntaPendiente {
  id: string;
  pregunta: string;
  fecha: string;
  estado: string;
}

export const CerebroSigma = () => {
  const navigate = useNavigate();
  const { tienePermiso, loading: permLoading } = usePermisos();
  const Swal = (window as any).Swal;

  const [conocimientos, setConocimientos] = useState<ConocimientoItem[]>([]);
  const [pendientes, setPendientes] = useState<PreguntaPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'conocimiento' | 'pendientes'>('conocimiento');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formId, setFormId] = useState('');
  const [formTema, setFormTema] = useState('');
  const [formClaves, setFormClaves] = useState('');
  const [formRespuesta, setFormRespuesta] = useState('');
  const [formAccionTipo, setFormAccionTipo] = useState('');
  const [formAccionValor, setFormAccionValor] = useState('');
  const [formRoles, setFormRoles] = useState('');
  const [formTitle, setFormTitle] = useState('Enseñar a Sigma');
  const [pendienteActivoId, setPendienteActivoId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const isRestricted = !permLoading && !tienePermiso('Cerebro de Sigma', 'ver');
  const canEdit = tienePermiso('Cerebro de Sigma', 'editar') || tienePermiso('Cerebro de Sigma', 'crear');

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // 1. Cargar Base de Conocimiento
      const { data: dataConocimiento, error: errorConocimiento } = await supabase
        .from('sigma_conocimiento')
        .select('*')
        .order('creado_en', { ascending: false });

      if (errorConocimiento) throw errorConocimiento;
      setConocimientos(dataConocimiento || []);

      // 2. Cargar Preguntas Pendientes
      const { data: dataPendientes, error: errorPendientes } = await supabase
        .from('sigma_preguntas_pendientes')
        .select('*')
        .eq('estado', 'pendiente')
        .order('fecha', { ascending: false });

      if (errorPendientes) {
        console.warn("No se pudo cargar la tabla sigma_preguntas_pendientes.");
      } else {
        setPendientes(dataPendientes || []);
      }
    } catch (e: any) {
      console.error(e);
      if (Swal) Swal.fire("Error", "No se pudo cargar el conocimiento de Sigma.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permLoading && tienePermiso('Cerebro de Sigma', 'ver')) {
      cargarDatos();
    }
  }, [permLoading]);

  useEffect(() => {
    const handlePendingRefresh = () => {
      if (!permLoading && tienePermiso('Cerebro de Sigma', 'ver')) {
        cargarDatos();
      }
    };
    window.addEventListener('sigae-sigma-pending-refresh', handlePendingRefresh);
    return () => {
      window.removeEventListener('sigae-sigma-pending-refresh', handlePendingRefresh);
    };
  }, [permLoading]);

  if (permLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando permisos...</span>
        </div>
      </div>
    );
  }

  if (isRestricted) {
    return (
      <div className="col-12 text-center py-5 mt-4">
        <div className="bg-light d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm border" style={{ width: '100px', height: '100px' }}>
          <i className="bi bi-shield-lock-fill text-muted" style={{ fontSize: '3.5rem' }}></i>
        </div>
        <h4 className="text-dark fw-bold mb-2">Área Restringida</h4>
        <p className="text-muted mb-0">No tienes permisos asignados para acceder a la configuración del Cerebro de Sigma.</p>
      </div>
    );
  }

  const abrirModalNuevo = () => {
    if (!canEdit) {
      if (Swal) Swal.fire("Acceso Denegado", "No tienes permisos para modificar el cerebro de Sigma.", "error");
      return;
    }
    setPendienteActivoId(null);
    setFormId('');
    setFormTema('');
    setFormClaves('');
    setFormRespuesta('');
    setFormAccionTipo('');
    setFormAccionValor('');
    setFormRoles('');
    setFormTitle('Enseñar a Sigma');
    setModalOpen(true);
  };

  const abrirModalEditar = (item: ConocimientoItem) => {
    if (!canEdit) {
      if (Swal) Swal.fire("Acceso Denegado", "No tienes permisos para modificar el cerebro de Sigma.", "error");
      return;
    }
    setPendienteActivoId(null);
    setFormId(item.id);
    setFormTema(item.tema);
    setFormClaves((item.palabras_clave || []).join(', '));
    setFormRespuesta(item.respuesta);
    setFormAccionTipo(item.accion_tipo || '');
    setFormAccionValor(item.accion_valor || '');
    setFormRoles((item.roles_permitidos || []).join(', '));
    setFormTitle('Editar Conocimiento');
    setModalOpen(true);
  };

  const responderPregunta = (item: PreguntaPendiente) => {
    if (!canEdit) {
      if (Swal) Swal.fire("Acceso Denegado", "No tienes permisos para responder preguntas pendientes.", "error");
      return;
    }
    setPendienteActivoId(item.id);
    setFormId('');
    setFormTema(item.pregunta);
    // Filtrar palabras de más de 3 letras como sugerencia de palabras clave
    const sugeridas = item.pregunta.split(' ').filter(w => w.length > 3).join(', ');
    setFormClaves(sugeridas);
    setFormRespuesta('');
    setFormAccionTipo('');
    setFormAccionValor('');
    setFormRoles('');
    setFormTitle('Responder a Pregunta Pendiente');
    setModalOpen(true);
  };

  const guardar = async () => {
    const tema = formTema.trim();
    const clavesStr = formClaves.trim();
    const respuesta = formRespuesta.trim();

    if (!tema || !clavesStr || !respuesta) {
      if (Swal) Swal.fire('Atención', 'Tema, Palabras Clave y Respuesta son obligatorios.', 'warning');
      return;
    }

    const palabras_clave = clavesStr.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
    const roles_permitidos = formRoles.trim() ? formRoles.split(',').map(s => s.trim().toLowerCase()).filter(s => s) : [];

    const payload = {
      tema,
      palabras_clave,
      respuesta,
      accion_tipo: formAccionTipo || null,
      accion_valor: formAccionValor.trim() || null,
      roles_permitidos
    };

    setGuardando(true);
    try {
      if (formId) {
        // Actualizar
        const { error } = await supabase.from('sigma_conocimiento').update(payload).eq('id', formId);
        if (error) throw error;
        await auditar('Cerebro de Sigma', 'Actualizar Conocimiento', `Tema: ${tema}`);
      } else {
        // Crear
        const { error } = await supabase.from('sigma_conocimiento').insert([payload]);
        if (error) throw error;
        await auditar('Cerebro de Sigma', 'Nuevo Conocimiento', `Tema: ${tema}`);
      }

      // Si viene de resolver una pendiente
      if (pendienteActivoId) {
        const { error: errPend } = await supabase
          .from('sigma_preguntas_pendientes')
          .update({ estado: 'resuelta' })
          .eq('id', pendienteActivoId);
        if (errPend) console.error("Falla al marcar pregunta como resuelta:", errPend);
      }

      setModalOpen(false);
      if (Swal) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Conocimiento guardado correctamente',
          showConfirmButton: false,
          timer: 1500
        });
      }

      // Notificar al chatbot flotante de recargar caché
      window.dispatchEvent(new CustomEvent('sigae-sigma-refresh'));

      cargarDatos();
    } catch (e: any) {
      console.error(e);
      if (Swal) Swal.fire('Error', 'No se pudo guardar el conocimiento.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = (id: string) => {
    if (!tienePermiso('Cerebro de Sigma', 'eliminar')) {
      if (Swal) Swal.fire("Acceso Denegado", "No tienes permisos para eliminar conocimientos.", "error");
      return;
    }

    if (!Swal) return;

    Swal.fire({
      title: '¿Olvidar esto?',
      text: "Sigma ya no responderá a estas palabras clave.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, olvidar',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        try {
          const { error } = await supabase.from('sigma_conocimiento').delete().eq('id', id);
          if (error) throw error;
          
          await auditar('Cerebro de Sigma', 'Olvidar Conocimiento', `ID: ${id}`);
          
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Conocimiento olvidado',
            showConfirmButton: false,
            timer: 1500
          });

          // Notificar al chatbot flotante
          window.dispatchEvent(new CustomEvent('sigae-sigma-refresh'));

          cargarDatos();
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo eliminar.', 'error');
        }
      }
    });
  };

  const eliminarPendiente = (id: string) => {
    if (!canEdit) {
      if (Swal) Swal.fire("Acceso Denegado", "No tienes permisos para descartar preguntas.", "error");
      return;
    }

    if (!Swal) return;

    Swal.fire({
      title: '¿Descartar pregunta?',
      text: "Esta pregunta se eliminará de la bandeja de pendientes.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Sí, descartar',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        try {
          const { error } = await supabase.from('sigma_preguntas_pendientes').delete().eq('id', id);
          if (error) throw error;

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Pregunta descartada',
            showConfirmButton: false,
            timer: 1500
          });

          cargarDatos();
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo descartar.', 'error');
        }
      }
    });
  };

  // Filtrado local de conocimiento
  const filteredConocimientos = conocimientos.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.tema.toLowerCase().includes(term) ||
      item.respuesta.toLowerCase().includes(term) ||
      (item.palabras_clave && item.palabras_clave.join(', ').toLowerCase().includes(term))
    );
  });

  return (
    <div className="modulo-animado">
      <div className="row mb-4 animate__animated animate__fadeInDown">
        <div className="col-12">
          <div 
            className="banner-modulo p-4 p-md-5 text-white shadow-sm" 
            style={{ 
              background: 'linear-gradient(135deg, #4f46e5 0%, #312e81 100%)', 
              borderRadius: '24px', 
              position: 'relative', 
              overflow: 'hidden' 
            }}
          >
            <div className="burbuja-3d burbuja-1"></div>
            <div className="burbuja-3d burbuja-2"></div>
            <div className="burbuja-3d burbuja-3"></div>
            <div className="row align-items-center position-relative z-1">
              <div className="col-12 text-center text-md-start mb-3 mb-md-0">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <span className="badge bg-white text-primary px-3 py-2 shadow-sm fw-bold" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>
                  <i className="bi bi-cpu-fill me-1"></i> ASISTENTE VIRTUAL
                </span>
                <button 
                  onClick={() => navigate('/categoria/Direcci%C3%B3n%20y%20Sistema')} 
                  className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                >
                  <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
                </button>
              </div>
                <h1 className="fw-bolder mb-2 text-white" style={{ fontSize: '2.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  <i className="bi bi-robot me-3"></i>Cerebro de Sigma
                </h1>
                <p className="mb-4 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Gestiona la base de conocimientos, respuestas y acciones del asistente virtual del sistema.
                </p>
                {canEdit && (
                  <button className="btn btn-light text-primary rounded-pill shadow-sm fw-bold px-4 py-2 hover-efecto" onClick={abrirModalNuevo}>
                    <i className="bi bi-plus-lg me-2"></i> Añadir Conocimiento
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid animate__animated animate__fadeIn">
        {/* Navegación por pestañas */}
        <ul className="nav nav-pills mb-4" id="sigmaTabs" role="tablist">
          <li className="nav-item" role="presentation">
            <button 
              className={`nav-link rounded-pill px-4 fw-bold shadow-sm ${activeTab === 'conocimiento' ? 'active' : ''}`}
              onClick={() => setActiveTab('conocimiento')}
              type="button"
            >
              <i className="bi bi-brain me-2"></i>Base de Conocimiento
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button 
              className={`nav-link rounded-pill px-4 fw-bold ms-2 shadow-sm ${activeTab === 'pendientes' ? 'active' : ''}`}
              onClick={() => setActiveTab('pendientes')}
              type="button"
            >
              <i className="bi bi-inbox me-2"></i>Bandeja de Pendientes 
              {pendientes.length > 0 && (
                <span className="badge bg-danger rounded-pill ms-1">{pendientes.length}</span>
              )}
            </button>
          </li>
        </ul>

        {loading ? (
          <div className="text-center py-5 text-muted">
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <div>Cargando Cerebro de Sigma...</div>
          </div>
        ) : (
          <div className="tab-content" id="sigmaTabsContent">
            {/* Pestaña de Conocimiento */}
            {activeTab === 'conocimiento' && (
              <div className="tab-pane fade show active">
                {/* Filtros y Buscador */}
                <div className="card border-0 shadow-sm rounded-4 mb-4">
                  <div className="card-body p-3">
                    <div className="row g-2">
                      <div className="col-md-6">
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
                          <input 
                            type="text" 
                            className="form-control border-start-0 bg-light" 
                            placeholder="Buscar por tema o respuesta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabla de Conocimiento */}
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light text-muted small fw-bold text-uppercase">
                          <tr>
                            <th className="ps-4">Tema y Roles</th>
                            <th>Palabras Clave</th>
                            <th>Respuesta y Acción</th>
                            <th className="text-center pe-4" style={{ width: '120px' }}>Opciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredConocimientos.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-5 text-muted">
                                <i className="bi bi-inbox fs-2 d-block mb-2"></i>No hay conocimientos registrados.
                              </td>
                            </tr>
                          ) : (
                            filteredConocimientos.map((item) => {
                              const rolesStr = (!item.roles_permitidos || item.roles_permitidos.length === 0) ? (
                                <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2" style={{ fontSize: '0.7rem' }}>Público</span>
                              ) : (
                                item.roles_permitidos.map((r, i) => (
                                  <span key={i} className="badge bg-secondary rounded-pill px-2 me-1" style={{ fontSize: '0.65rem' }}>{r}</span>
                                ))
                              );

                              let palabras = (item.palabras_clave || []).join(', ');
                              if (palabras.length > 50) palabras = palabras.substring(0, 50) + '...';

                              return (
                                <tr key={item.id} className="hover-efecto">
                                  <td className="ps-4 py-3">
                                    <div className="fw-bold text-dark">{item.tema}</div>
                                    <div className="mt-1">{rolesStr}</div>
                                  </td>
                                  <td className="py-3">
                                    <div className="text-muted small">{palabras}</div>
                                  </td>
                                  <td className="py-3">
                                    <div className="small text-dark text-truncate" style={{ maxWidth: '300px' }} title={item.respuesta}>
                                      {item.respuesta}
                                    </div>
                                    {item.accion_tipo && (
                                      <div className="mt-1">
                                        <span className="badge bg-primary bg-opacity-10 text-primary" style={{ fontSize: '0.7rem' }}>
                                          <i className={`bi ${item.accion_tipo === 'navegar' ? 'bi-link' : 'bi-window'} me-1`}></i>
                                          {item.accion_valor}
                                        </span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="text-center pe-4 py-3">
                                    {canEdit && (
                                      <button 
                                        className="btn btn-sm btn-light text-primary rounded-circle shadow-sm me-2" 
                                        onClick={() => abrirModalEditar(item)} 
                                        title="Editar"
                                      >
                                        <i className="bi bi-pencil-square"></i>
                                      </button>
                                    )}
                                    {tienePermiso('Cerebro de Sigma', 'eliminar') && (
                                      <button 
                                        className="btn btn-sm btn-light text-danger rounded-circle shadow-sm" 
                                        onClick={() => eliminar(item.id)} 
                                        title="Eliminar"
                                      >
                                        <i className="bi bi-trash3-fill"></i>
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pestaña de Pendientes */}
            {activeTab === 'pendientes' && (
              <div className="tab-pane fade show active">
                <div className="card border-0 shadow-sm rounded-4">
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light text-muted small fw-bold text-uppercase">
                          <tr>
                            <th className="ps-4">Pregunta del Usuario</th>
                            <th>Fecha de Registro</th>
                            <th>Estado</th>
                            <th className="text-center pe-4" style={{ width: '180px' }}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendientes.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-5 text-muted">
                                <i className="bi bi-check-circle fs-2 d-block mb-2 text-success"></i>No hay preguntas pendientes. ¡Sigma está al día!
                              </td>
                            </tr>
                          ) : (
                            pendientes.map((item) => (
                              <tr key={item.id} className="hover-efecto">
                                <td className="ps-4 py-3">
                                  <div className="fw-bold text-dark">
                                    <i className="bi bi-question-circle text-primary me-2"></i>{item.pregunta}
                                  </div>
                                </td>
                                <td className="py-3 text-muted small">
                                  {new Date(item.fecha).toLocaleString()}
                                </td>
                                <td className="py-3">
                                  <span className="badge bg-warning text-dark rounded-pill">Pendiente</span>
                                </td>
                                <td className="text-center pe-4 py-3">
                                  {canEdit && (
                                    <>
                                      <button 
                                        className="btn btn-sm btn-primary rounded-pill shadow-sm px-3 me-2" 
                                        onClick={() => responderPregunta(item)} 
                                        title="Responder y Enseñar"
                                      >
                                        <i className="bi bi-reply-fill me-1"></i>Responder
                                      </button>
                                      <button 
                                        className="btn btn-sm btn-light text-danger rounded-circle shadow-sm" 
                                        onClick={() => eliminarPendiente(item.id)} 
                                        title="Descartar"
                                      >
                                        <i className="bi bi-x-lg"></i>
                                      </button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para Crear/Editar Conocimiento */}
      {modalOpen && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15,23,42,0.45)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-robot text-primary me-2"></i>{formTitle}
                </h5>
                <button type="button" className="btn-close" onClick={() => setModalOpen(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label fw-bold small text-muted">Tema o Título <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    className="form-control rounded-3" 
                    placeholder="Ej: Gestión de Notas"
                    value={formTema}
                    onChange={(e) => setFormTema(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold small text-muted">Palabras Clave (Separadas por coma) <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    className="form-control rounded-3" 
                    placeholder="Ej: notas, calificaciones, cargar notas"
                    value={formClaves}
                    onChange={(e) => setFormClaves(e.target.value)}
                  />
                  <div className="form-text small text-muted">Sigma usará esto para saber de qué habla el usuario.</div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold small text-muted">Respuesta de Sigma <span className="text-danger">*</span></label>
                  <textarea 
                    className="form-control rounded-3" 
                    rows={3} 
                    placeholder="Ej: ¡Hola {nombre}! Te llevo al módulo de notas."
                    value={formRespuesta}
                    onChange={(e) => setFormRespuesta(e.target.value)}
                  />
                  <div className="form-text small text-muted">Puedes usar <code>{"{nombre}"}</code> para que Sigma diga el nombre del usuario.</div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-muted">Acción (Opcional)</label>
                    <select 
                      className="form-select rounded-3"
                      value={formAccionTipo}
                      onChange={(e) => setFormAccionTipo(e.target.value)}
                    >
                      <option value="">Solo texto (Ninguna)</option>
                      <option value="navegar">Navegar a otra vista</option>
                      <option value="abrir_modal">Abrir un Modal (Emergente)</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-muted">Valor de la Acción</label>
                    <input 
                      type="text" 
                      className="form-control rounded-3" 
                      placeholder="Ej: #notas o modalNotas"
                      value={formAccionValor}
                      onChange={(e) => setFormAccionValor(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold small text-muted">Roles Permitidos (Opcional)</label>
                  <input 
                    type="text" 
                    className="form-control rounded-3" 
                    placeholder="Ej: admin, directivo, control_estudio"
                    value={formRoles}
                    onChange={(e) => setFormRoles(e.target.value)}
                  />
                  <div className="form-text small text-muted">Si lo dejas en blanco, cualquier usuario (incluso visitantes) podrá recibir esta respuesta. Sepáralos con coma.</div>
                </div>
              </div>
              <div className="modal-footer border-top-0 pt-0 pe-4 pb-4">
                <button type="button" className="btn btn-light rounded-pill fw-bold" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button 
                  type="button" 
                  className="btn btn-primary rounded-pill fw-bold px-4" 
                  disabled={guardando}
                  onClick={guardar}
                >
                  {guardando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Guardando...
                    </>
                  ) : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
