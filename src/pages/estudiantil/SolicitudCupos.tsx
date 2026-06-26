import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';

interface Solicitud {
  id?: string;
  codigo_escuela: string;
  estudiante_nombres: string;
  estudiante_apellidos: string;
  estudiante_cedula?: string | null;
  estudiante_fecha_nacimiento: string;
  estudiante_sexo: string;
  grado_solicitado: string;
  plantel_procedencia?: string | null;
  direccion_habitacion?: string | null;
  representante_nombres: string;
  representante_apellidos: string;
  representante_cedula: string;
  representante_telefono: string;
  representante_email: string;
  representante_parentesco: string;
  representante_trabaja_pdvsa: string;
  estado: string;
  observaciones: string;
  creado_por: string;
  created_at?: string;
  updated_at?: string;
}

export const SolicitudCupos = () => {
  const navigate = useNavigate();
  const { user, loading: permLoading } = usePermisos();
  const Swal = (window as any).Swal;

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'mis_solicitudes' | 'nueva_solicitud' | 'gestion'>('mis_solicitudes');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form states: Estudiante
  const [estNombres, setEstNombres] = useState('');
  const [estApellidos, setEstApellidos] = useState('');
  const [estCedula, setEstCedula] = useState('');
  const [estFechaNac, setEstFechaNac] = useState('');
  const [estSexo, setEstSexo] = useState('Femenino');
  const [estGrado, setEstGrado] = useState('');
  const [estPlantel, setEstPlantel] = useState('');
  const [estDireccion, setEstDireccion] = useState('');

  // Form states: Representante
  const [repNombres, setRepNombres] = useState('');
  const [repApellidos, setRepApellidos] = useState('');
  const [repCedula, setRepCedula] = useState('');
  const [repTelefono, setRepTelefono] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [repParentesco, setRepParentesco] = useState('Padre');
  const [repPdvsa, setRepPdvsa] = useState('No');

  // Management Action states
  const [selectedSol, setSelectedSol] = useState<Solicitud | null>(null);
  const [evalEstado, setEvalEstado] = useState('Aprobado');
  const [evalObs, setEvalObs] = useState('');

  const escCodigo = localStorage.getItem('sigae_escuela_codigo') || 'sb';
  const escNombre = escCodigo === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';

  const isUserAdmin = ['SuperAdmin', 'Director', 'Administrador', 'Coordinador'].includes(user?.rol);

  useEffect(() => {
    if (!permLoading && user) {
      if (isUserAdmin) {
        setActiveTab('gestion');
      } else {
        setActiveTab('mis_solicitudes');
      }
      cargarDatos();
    }
  }, [permLoading, user, escCodigo]);

  // Autofill representative info with logged user info if applicable
  useEffect(() => {
    if (user && activeTab === 'nueva_solicitud') {
      const nombresSplit = user.nombre ? user.nombre.split(' ') : [];
      setRepNombres(nombresSplit.slice(0, 2).join(' ') || '');
      setRepApellidos(nombresSplit.slice(2).join(' ') || '');
      setRepCedula(user.cedula || '');
      setRepEmail(user.email || '');
      setRepTelefono(user.telefono || '');
    }
  }, [user, activeTab]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      let query = supabase.from('solicitud_cupos').select('*');
      
      // Filtrar solicitudes por escuela
      query = query.eq('codigo_escuela', escCodigo);

      // Si no es administrador, filtrar solo sus solicitudes creadas
      if (!isUserAdmin && user) {
        query = query.eq('creado_por', user.cedula);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setSolicitudes(data || []);
    } catch (e) {
      console.error("Error cargando solicitudes de cupo:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estNombres.trim() || !estApellidos.trim() || !estFechaNac || !estGrado || !repNombres.trim() || !repApellidos.trim() || !repCedula.trim() || !repTelefono.trim() || !repEmail.trim()) {
      if (Swal) Swal.fire("Atención", "Por favor completa todos los campos obligatorios (*)", "warning");
      return;
    }

    try {
      const payload: Solicitud = {
        codigo_escuela: escCodigo,
        estudiante_nombres: estNombres.trim(),
        estudiante_apellidos: estApellidos.trim(),
        estudiante_cedula: estCedula.trim() || null,
        estudiante_fecha_nacimiento: estFechaNac,
        estudiante_sexo: estSexo,
        grado_solicitado: estGrado,
        plantel_procedencia: estPlantel.trim() || null,
        direccion_habitacion: estDireccion.trim() || null,
        representante_nombres: repNombres.trim(),
        representante_apellidos: repApellidos.trim(),
        representante_cedula: repCedula.trim(),
        representante_telefono: repTelefono.trim(),
        representante_email: repEmail.trim(),
        representante_parentesco: repParentesco,
        representante_trabaja_pdvsa: repPdvsa,
        estado: 'Pendiente',
        observaciones: '',
        creado_por: user?.cedula || repCedula.trim()
      };

      const { error } = await supabase.from('solicitud_cupos').insert([payload]);
      if (error) throw error;

      await auditar('Solicitud de Cupos', 'Crear Solicitud', `Nueva solicitud para el estudiante: ${payload.estudiante_nombres} ${payload.estudiante_apellidos}`);

      if (Swal) {
        Swal.fire("¡Solicitud Enviada!", "Tu solicitud de cupo ha sido registrada exitosamente y se encuentra en estado 'Pendiente' para su evaluación.", "success");
      }

      // Reset Student fields only
      setEstNombres('');
      setEstApellidos('');
      setEstCedula('');
      setEstFechaNac('');
      setEstGrado('');
      setEstPlantel('');
      setEstDireccion('');

      // Reload lists and switch tab
      cargarDatos();
      setActiveTab(isUserAdmin ? 'gestion' : 'mis_solicitudes');
    } catch (e: any) {
      console.error("Error al registrar solicitud:", e);
      if (Swal) Swal.fire("Error", "No se pudo registrar la solicitud: " + e.message, "error");
    }
  };

  const handleEvaluarSolicitud = async () => {
    if (!selectedSol) return;
    try {
      const { error } = await supabase
        .from('solicitud_cupos')
        .update({
          estado: evalEstado,
          observaciones: evalObs.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSol.id);

      if (error) throw error;

      await auditar('Solicitud de Cupos', 'Evaluar Solicitud', `Evaluación de solicitud de ${selectedSol.estudiante_nombres} ${selectedSol.estudiante_apellidos} - Nuevo estado: ${evalEstado}`);

      if (Swal) Swal.fire("Evaluación Guardada", `La solicitud ha sido clasificada como '${evalEstado}'.`, "success");

      // Close modal & reload
      const closeBtn = document.getElementById('btn-close-eval-modal');
      if (closeBtn) closeBtn.click();
      cargarDatos();
    } catch (e: any) {
      console.error("Error evaluando solicitud:", e);
      if (Swal) Swal.fire("Error", "No se pudo actualizar el estado: " + e.message, "error");
    }
  };

  const handleEliminarSolicitud = async (sol: Solicitud) => {
    if (!sol.id || !Swal) return;
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Esta acción eliminará de forma permanente la solicitud de cupo para ${sol.estudiante_nombres} ${sol.estudiante_apellidos}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        try {
          const { error } = await supabase
            .from('solicitud_cupos')
            .delete()
            .eq('id', sol.id);

          if (error) throw error;

          await auditar('Solicitud de Cupos', 'Eliminar Solicitud', `Eliminada solicitud de cupo para: ${sol.estudiante_nombres} ${sol.estudiante_apellidos}`);
          Swal.fire("Eliminada", "La solicitud ha sido eliminada correctamente.", "success");
          cargarDatos();
        } catch (e: any) {
          console.error("Error al eliminar solicitud:", e);
          Swal.fire("Error", "No se pudo eliminar la solicitud: " + e.message, "error");
        }
      }
    });
  };

  // Filter and Search requests
  const filteredSolicitudes = solicitudes.filter(sol => {
    const matchesEstado = filterEstado === 'TODOS' || sol.estado === filterEstado;
    const searchString = `${sol.estudiante_nombres} ${sol.estudiante_apellidos} ${sol.representante_nombres} ${sol.representante_apellidos} ${sol.representante_cedula}`.toLowerCase();
    const matchesQuery = searchString.includes(searchQuery.toLowerCase());
    return matchesEstado && matchesQuery;
  });

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'Aprobado':
        return <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle px-3 py-1.5 rounded-pill"><i className="bi bi-check-circle-fill me-1"></i> Aprobado</span>;
      case 'Rechazado':
        return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle px-3 py-1.5 rounded-pill"><i className="bi bi-x-circle-fill me-1"></i> Rechazado</span>;
      default:
        return <span className="badge bg-warning bg-opacity-10 text-warning border border-warning-subtle px-3 py-1.5 rounded-pill"><i className="bi bi-clock-fill me-1"></i> Pendiente</span>;
    }
  };

  const getStats = () => {
    const total = solicitudes.length;
    const pendientes = solicitudes.filter(s => s.estado === 'Pendiente').length;
    const aprobados = solicitudes.filter(s => s.estado === 'Aprobado').length;
    const rechazados = solicitudes.filter(s => s.estado === 'Rechazado').length;
    return { total, pendientes, aprobados, rechazados };
  };

  const stats = getStats();

  const GRADOS = [
    "Educación Inicial - Maternal",
    "Educación Inicial - Preescolar",
    "Educación Primaria - 1er Grado",
    "Educación Primaria - 2do Grado",
    "Educación Primaria - 3er Grado",
    "Educación Primaria - 4to Grado",
    "Educación Primaria - 5to Grado",
    "Educación Primaria - 6to Grado",
    "Media General - 1er Año",
    "Media General - 2do Año",
    "Media General - 3er Año",
    "Media General - 4to Año",
    "Media General - 5to Año"
  ];

  return (
    <div className="container-fluid py-4 animate__animated animate__fadeIn">
      {/* HEADER SECTION */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 bg-white p-4 border rounded-4 shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-success bg-opacity-10 text-success p-3 rounded-4" style={{ border: '1px solid rgba(25, 135, 84, 0.2)' }}>
            <i className="bi bi-envelope-paper-fill fs-3"></i>
          </div>
          <div>
            <h4 className="fw-bold text-dark mb-1">Solicitud de Cupos Escolares</h4>
            <p className="text-muted small mb-0">
              <i className="bi bi-building-fill text-success me-1"></i> {escNombre} &nbsp;|&nbsp; 
              <span className="ms-1 badge bg-light text-secondary border">Módulo de Admisión</span>
            </p>
          </div>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <button onClick={() => navigate(-1)} className="btn btn-outline-secondary rounded-pill hover-efecto">
            <i className="bi bi-arrow-left me-1"></i> Volver
          </button>
        </div>
      </div>

      {/* DASHBOARD CARDS (ADMIN ONLY) */}
      {isUserAdmin && (
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card border rounded-4 p-3 shadow-sm bg-white hover-card">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-muted small text-uppercase fw-bold mb-1">Total Solicitudes</h6>
                  <h3 className="fw-bold text-dark mb-0">{stats.total}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 text-primary p-2.5 rounded-3">
                  <i className="bi bi-inbox fs-4"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border rounded-4 p-3 shadow-sm bg-white hover-card">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-muted small text-uppercase fw-bold mb-1">Pendientes</h6>
                  <h3 className="fw-bold text-warning mb-0">{stats.pendientes}</h3>
                </div>
                <div className="bg-warning bg-opacity-10 text-warning p-2.5 rounded-3">
                  <i className="bi bi-clock-history fs-4"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border rounded-4 p-3 shadow-sm bg-white hover-card">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-muted small text-uppercase fw-bold mb-1">Aprobadas</h6>
                  <h3 className="fw-bold text-success mb-0">{stats.aprobados}</h3>
                </div>
                <div className="bg-success bg-opacity-10 text-success p-2.5 rounded-3">
                  <i className="bi bi-check2-all fs-4"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border rounded-4 p-3 shadow-sm bg-white hover-card">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="text-muted small text-uppercase fw-bold mb-1">Rechazadas</h6>
                  <h3 className="fw-bold text-danger mb-0">{stats.rechazados}</h3>
                </div>
                <div className="bg-danger bg-opacity-10 text-danger p-2.5 rounded-3">
                  <i className="bi bi-x-octagon fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div className="d-flex gap-2 border-bottom pb-3 mb-4 overflow-x-auto">
        {isUserAdmin && (
          <button 
            onClick={() => setActiveTab('gestion')} 
            className={`btn rounded-pill px-4 fw-bold hover-efecto ${activeTab === 'gestion' ? 'btn-success shadow' : 'btn-outline-secondary'}`}
          >
            <i className="bi bi-list-task me-1"></i> Listado General
          </button>
        )}
        <button 
          onClick={() => setActiveTab('mis_solicitudes')} 
          className={`btn rounded-pill px-4 fw-bold hover-efecto ${activeTab === 'mis_solicitudes' ? 'btn-success shadow' : 'btn-outline-secondary'}`}
        >
          <i className="bi bi-inbox-fill me-1"></i> Mis Solicitudes
        </button>
        <button 
          onClick={() => setActiveTab('nueva_solicitud')} 
          className={`btn rounded-pill px-4 fw-bold hover-efecto ${activeTab === 'nueva_solicitud' ? 'btn-success shadow' : 'btn-outline-secondary'}`}
        >
          <i className="bi bi-plus-lg me-1"></i> Nueva Solicitud
        </button>
      </div>

      {/* TABS CONTAINER */}
      <div className="bg-white border rounded-4 p-4 shadow-sm">
        
        {/* TAB 1: LISTADO GENERAL (ADMIN ONLY) */}
        {activeTab === 'gestion' && isUserAdmin && (
          <div>
            <h5 className="fw-bold text-dark mb-3"><i className="bi bi-card-checklist text-success me-2"></i>Control de Solicitudes de Admisión</h5>
            
            {/* Filter and search bar */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="small fw-bold text-muted mb-1">Filtrar por Estado</label>
                <select className="form-select input-moderno" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
                  <option value="TODOS">Todos los estados</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Aprobado">Aprobado</option>
                  <option value="Rechazado">Rechazado</option>
                </select>
              </div>
              <div className="col-md-8">
                <label className="small fw-bold text-muted mb-1">Buscar Solicitud</label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 border-secondary border-opacity-25" style={{ borderRadius: '12px 0 0 12px' }}><i className="bi bi-search text-muted"></i></span>
                  <input 
                    type="text" 
                    className="form-control border-start-0 border-secondary border-opacity-25" 
                    placeholder="Buscar por estudiante, representante o cédula..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ borderRadius: '0 12px 12px 0', boxShadow: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* List Table */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status"><span className="visually-hidden">Cargando...</span></div>
                <div className="text-muted mt-2 small">Cargando solicitudes de la base de datos...</div>
              </div>
            ) : filteredSolicitudes.length === 0 ? (
              <div className="text-center py-5 text-muted bg-light rounded-4 border">
                <i className="bi bi-mailbox fs-2 text-secondary mb-2 d-block"></i>
                <div className="fw-bold">No se encontraron solicitudes</div>
                <div className="small">No existen registros que coincidan con los filtros aplicados.</div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle border rounded-4 overflow-hidden">
                  <thead className="bg-light text-muted small text-uppercase">
                    <tr>
                      <th className="ps-3">Estudiante</th>
                      <th>Grado Solicitado</th>
                      <th>Representante</th>
                      <th>Contacto</th>
                      <th>Estado</th>
                      <th className="text-end pe-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSolicitudes.map((sol, index) => (
                      <tr key={index}>
                        <td className="ps-3">
                          <div className="fw-bold text-dark">{sol.estudiante_apellidos}, {sol.estudiante_nombres}</div>
                          <span className="text-muted small"><i className="bi bi-person-badge me-1"></i>{sol.estudiante_cedula || 'Sin Cédula'}</span>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border px-2.5 py-1.5" style={{ fontSize: '0.8rem' }}>{sol.grado_solicitado}</span>
                        </td>
                        <td>
                          <div className="fw-semibold">{sol.representante_nombres} {sol.representante_apellidos}</div>
                          <span className="text-muted small">C.I: {sol.representante_cedula} ({sol.representante_parentesco})</span>
                        </td>
                        <td>
                          <div className="small"><i className="bi bi-telephone-fill text-muted me-1"></i>{sol.representante_telefono}</div>
                          <div className="small text-muted"><i className="bi bi-envelope-fill text-muted me-1"></i>{sol.representante_email}</div>
                        </td>
                        <td>{getStatusBadge(sol.estado)}</td>
                        <td className="text-end pe-3">
                          <div className="d-flex justify-content-end gap-1.5">
                            <button 
                              type="button" 
                              onClick={() => {
                                setSelectedSol(sol);
                                setEvalEstado(sol.estado);
                                setEvalObs(sol.observaciones || '');
                              }} 
                              className="btn btn-sm btn-outline-success rounded-pill hover-efecto"
                              data-bs-toggle="modal"
                              data-bs-target="#evalSolicitudModal"
                            >
                              <i className="bi bi-pencil-square"></i> Evaluar
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleEliminarSolicitud(sol)} 
                              className="btn btn-sm btn-outline-danger rounded-pill hover-efecto"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MIS SOLICITUDES */}
        {activeTab === 'mis_solicitudes' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-dark mb-0"><i className="bi bi-mailbox2 text-success me-2"></i>Historial de Solicitudes Registradas</h5>
              <button onClick={() => setActiveTab('nueva_solicitud')} className="btn btn-success rounded-pill btn-sm fw-semibold">
                <i className="bi bi-plus-circle me-1"></i> Solicitar Cupo
              </button>
            </div>
            
            <p className="text-muted small mb-4">
              En este listado puedes hacer seguimiento en tiempo real al estado de las solicitudes que has enviado para esta escuela.
            </p>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status"><span className="visually-hidden">Cargando...</span></div>
              </div>
            ) : solicitudes.length === 0 ? (
              <div className="text-center py-5 text-muted bg-light rounded-4 border">
                <i className="bi bi-journal-plus fs-2 text-secondary mb-2 d-block"></i>
                <div className="fw-bold">No tienes solicitudes registradas</div>
                <div className="small mb-3">Aún no has registrado ninguna solicitud de cupo en esta institución.</div>
                <button onClick={() => setActiveTab('nueva_solicitud')} className="btn btn-sm btn-success rounded-pill px-3">Registrar la Primera</button>
              </div>
            ) : (
              <div className="row g-3">
                {solicitudes.map((sol, index) => (
                  <div className="col-md-6" key={index}>
                    <div className="card border rounded-4 p-3 shadow-sm bg-white hover-card">
                      <div className="d-flex justify-content-between align-items-start border-bottom pb-2.5 mb-2.5">
                        <div>
                          <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle mb-1.5">{sol.grado_solicitado}</span>
                          <h6 className="fw-bold text-dark mb-0">{sol.estudiante_apellidos}, {sol.estudiante_nombres}</h6>
                          <small className="text-muted text-uppercase" style={{ fontSize: '0.72rem' }}>C.I: {sol.estudiante_cedula || 'Sin Cédula'}</small>
                        </div>
                        <div className="text-end">
                          {getStatusBadge(sol.estado)}
                          <div className="text-muted small mt-1" style={{ fontSize: '0.7rem' }}>
                            {sol.created_at ? new Date(sol.created_at).toLocaleDateString() : ''}
                          </div>
                        </div>
                      </div>
                      <div className="row g-2 mb-2.5">
                        <div className="col-6">
                          <span className="text-muted small d-block mb-0.5">Representante:</span>
                          <span className="fw-semibold text-dark small">{sol.representante_nombres} {sol.representante_apellidos}</span>
                        </div>
                        <div className="col-6">
                          <span className="text-muted small d-block mb-0.5">Parentesco / Teléfono:</span>
                          <span className="fw-semibold text-dark small">{sol.representante_parentesco} | {sol.representante_telefono}</span>
                        </div>
                      </div>

                      {/* Observations banner */}
                      <div className={`p-2.5 rounded-3 border ${sol.estado === 'Aprobado' ? 'bg-success bg-opacity-10 text-success border-success-subtle' : sol.estado === 'Rechazado' ? 'bg-danger bg-opacity-10 text-danger border-danger-subtle' : 'bg-light text-secondary'}`}>
                        <div className="small fw-bold mb-0.5"><i className="bi bi-chat-left-text-fill me-1"></i> Comentarios de Dirección:</div>
                        <div className="small">{sol.observaciones || <em>Ninguna observación registrada todavía. Tu solicitud está en proceso.</em>}</div>
                      </div>

                      {sol.estado === 'Pendiente' && (
                        <div className="text-end mt-2.5">
                          <button onClick={() => handleEliminarSolicitud(sol)} className="btn btn-sm btn-outline-danger border-0 rounded-pill"><i className="bi bi-trash-fill me-1"></i> Cancelar</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: NUEVA SOLICITUD FORM */}
        {activeTab === 'nueva_solicitud' && (
          <form onSubmit={handleCrearSolicitud}>
            <h5 className="fw-bold text-dark mb-3"><i className="bi bi-file-earmark-person-fill text-success me-2"></i>Formulario de Solicitud de Cupo Nuevo</h5>
            <p className="text-muted small mb-4">
              Por favor completa la información del estudiante y del representante para solicitar el cupo en el plantel.
            </p>

            <div className="row g-3">
              {/* SECTION: ESTUDIANTE */}
              <div className="col-12 border-bottom pb-2">
                <span className="fw-bold text-success text-uppercase small"><i className="bi bi-mortarboard-fill me-2"></i>1. Datos del Estudiante</span>
              </div>
              
              <div className="col-md-4">
                <label className="form-label">Nombres del Estudiante <span className="text-danger">*</span></label>
                <input type="text" className="form-control input-moderno" placeholder="Nombres completos" value={estNombres} onChange={(e) => setEstNombres(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Apellidos del Estudiante <span className="text-danger">*</span></label>
                <input type="text" className="form-control input-moderno" placeholder="Apellidos completos" value={estApellidos} onChange={(e) => setEstApellidos(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Cédula de Identidad (Opcional)</label>
                <input type="text" className="form-control input-moderno" placeholder="Ej. V-32123456" value={estCedula} onChange={(e) => setEstCedula(e.target.value)} />
              </div>

              <div className="col-md-3">
                <label className="form-label">Fecha de Nacimiento <span className="text-danger">*</span></label>
                <input type="date" className="form-control input-moderno" value={estFechaNac} onChange={(e) => setEstFechaNac(e.target.value)} required />
              </div>
              <div className="col-md-3">
                <label className="form-label">Sexo <span className="text-danger">*</span></label>
                <select className="form-select input-moderno" value={estSexo} onChange={(e) => setEstSexo(e.target.value)}>
                  <option value="Femenino">Femenino</option>
                  <option value="Masculino">Masculino</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Grado Solicitado <span className="text-danger">*</span></label>
                <select className="form-select input-moderno" value={estGrado} onChange={(e) => setEstGrado(e.target.value)} required>
                  <option value="">Seleccione...</option>
                  {GRADOS.map((g, idx) => <option key={idx} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Plantel de Procedencia</label>
                <input type="text" className="form-control input-moderno" placeholder="Escuela anterior" value={estPlantel} onChange={(e) => setEstPlantel(e.target.value)} />
              </div>

              <div className="col-12">
                <label className="form-label">Dirección de Habitación del Estudiante</label>
                <textarea className="form-control input-moderno" rows={2} placeholder="Dirección detallada" value={estDireccion} onChange={(e) => setEstDireccion(e.target.value)} />
              </div>

              {/* SECTION: REPRESENTANTE */}
              <div className="col-12 border-bottom pb-2 mt-4">
                <span className="fw-bold text-success text-uppercase small"><i className="bi bi-people-fill me-2"></i>2. Datos del Representante Legal</span>
              </div>

              <div className="col-md-4">
                <label className="form-label">Nombres del Representante <span className="text-danger">*</span></label>
                <input type="text" className="form-control input-moderno" placeholder="Nombres" value={repNombres} onChange={(e) => setRepNombres(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Apellidos del Representante <span className="text-danger">*</span></label>
                <input type="text" className="form-control input-moderno" placeholder="Apellidos" value={repApellidos} onChange={(e) => setRepApellidos(e.target.value)} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Cédula de Identidad <span className="text-danger">*</span></label>
                <input type="text" className="form-control input-moderno" placeholder="Cédula de identidad" value={repCedula} onChange={(e) => setRepCedula(e.target.value)} required />
              </div>

              <div className="col-md-3">
                <label className="form-label">Teléfono de Contacto <span className="text-danger">*</span></label>
                <input type="text" className="form-control input-moderno" placeholder="Número móvil/fijo" value={repTelefono} onChange={(e) => setRepTelefono(e.target.value)} required />
              </div>
              <div className="col-md-3">
                <label className="form-label">Correo Electrónico <span className="text-danger">*</span></label>
                <input type="email" className="form-control input-moderno" placeholder="Correo de contacto" value={repEmail} onChange={(e) => setRepEmail(e.target.value)} required />
              </div>
              <div className="col-md-3">
                <label className="form-label">Parentesco con Estudiante <span className="text-danger">*</span></label>
                <select className="form-select input-moderno" value={repParentesco} onChange={(e) => setRepParentesco(e.target.value)}>
                  <option value="Padre">Padre</option>
                  <option value="Madre">Madre</option>
                  <option value="Abuelo/a">Abuelo/a</option>
                  <option value="Tío/a">Tío/a</option>
                  <option value="Representante Legal">Otro Representante Legal</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">¿Trabaja en PDVSA? <span className="text-danger">*</span></label>
                <select className="form-select input-moderno" value={repPdvsa} onChange={(e) => setRepPdvsa(e.target.value)}>
                  <option value="No">No</option>
                  <option value="Sí">Sí (Trabajador Activo)</option>
                  <option value="Jubilado">Sí (Jubilado / Pensionado)</option>
                </select>
              </div>

              {/* ACTION BUTTONS */}
              <div className="col-12 text-end mt-4">
                <button type="button" onClick={() => setActiveTab(isUserAdmin ? 'gestion' : 'mis_solicitudes')} className="btn btn-outline-secondary rounded-pill px-4 me-2 fw-semibold">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success rounded-pill px-4 fw-semibold shadow hover-efecto">
                  <i className="bi bi-send-check me-1"></i> Enviar Solicitud de Cupo
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* EVALUATE REQUEST MODAL */}
      <div className="modal fade" id="evalSolicitudModal" tabIndex={-1} aria-labelledby="evalSolicitudModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 rounded-4 shadow-lg">
            <div className="modal-header bg-success text-white py-3" style={{ borderRadius: '16px 16px 0 0' }}>
              <h5 className="modal-title fw-bold" id="evalSolicitudModalLabel">
                <i className="bi bi-file-earmark-check-fill me-2"></i>Evaluar Solicitud de Admisión
              </h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" id="btn-close-eval-modal"></button>
            </div>
            
            <div className="modal-body p-4 bg-light">
              {selectedSol && (
                <div className="row g-3">
                  {/* Student Details Card */}
                  <div className="col-md-6">
                    <div className="card rounded-4 p-3 border-0 shadow-sm bg-white h-100">
                      <div className="fw-bold border-bottom pb-2 mb-2 text-success small text-uppercase">
                        <i className="bi bi-person-fill"></i> Datos del Estudiante
                      </div>
                      <div className="mb-2"><span className="text-muted small">Nombre:</span> <strong className="d-block text-dark">{selectedSol.estudiante_nombres} {selectedSol.estudiante_apellidos}</strong></div>
                      <div className="mb-2"><span className="text-muted small">Cédula:</span> <span className="fw-semibold d-block text-dark">{selectedSol.estudiante_cedula || 'Sin Cédula'}</span></div>
                      <div className="mb-2"><span className="text-muted small">Fecha de Nacimiento:</span> <span className="fw-semibold d-block text-dark">{selectedSol.estudiante_fecha_nacimiento}</span></div>
                      <div className="mb-2"><span className="text-muted small">Sexo:</span> <span className="fw-semibold d-block text-dark">{selectedSol.estudiante_sexo}</span></div>
                      <div className="mb-2"><span className="text-muted small">Grado Solicitado:</span> <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle d-inline-block">{selectedSol.grado_solicitado}</span></div>
                      <div className="mb-2"><span className="text-muted small">Plantel de Procedencia:</span> <span className="fw-semibold d-block text-dark">{selectedSol.plantel_procedencia || 'Ninguno / Inicial'}</span></div>
                      <div><span className="text-muted small">Dirección:</span> <span className="fw-semibold d-block text-dark small">{selectedSol.direccion_habitacion || 'No registrada'}</span></div>
                    </div>
                  </div>

                  {/* Representative Details Card */}
                  <div className="col-md-6">
                    <div className="card rounded-4 p-3 border-0 shadow-sm bg-white h-100">
                      <div className="fw-bold border-bottom pb-2 mb-2 text-success small text-uppercase">
                        <i className="bi bi-people-fill"></i> Datos del Representante
                      </div>
                      <div className="mb-2"><span className="text-muted small">Nombre:</span> <strong className="d-block text-dark">{selectedSol.representante_nombres} {selectedSol.representante_apellidos}</strong></div>
                      <div className="mb-2"><span className="text-muted small">Cédula:</span> <span className="fw-semibold d-block text-dark">{selectedSol.representante_cedula}</span></div>
                      <div className="mb-2"><span className="text-muted small">Parentesco:</span> <span className="fw-semibold d-block text-dark">{selectedSol.representante_parentesco}</span></div>
                      <div className="mb-2"><span className="text-muted small">Contacto:</span> <span className="fw-semibold d-block text-dark">{selectedSol.representante_telefono}</span></div>
                      <div className="mb-2"><span className="text-muted small">Correo:</span> <span className="fw-semibold d-block text-dark small text-truncate">{selectedSol.representante_email}</span></div>
                      <div><span className="text-muted small">¿Trabaja en PDVSA?:</span> <span className="badge bg-light text-dark border d-inline-block">{selectedSol.representante_trabaja_pdvsa}</span></div>
                    </div>
                  </div>

                  {/* Evaluation form */}
                  <div className="col-12 mt-3 pt-3 border-top">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label fw-bold text-dark">Definir Estado del Cupo</label>
                        <select className="form-select input-moderno border-secondary border-opacity-25" value={evalEstado} onChange={(e) => setEvalEstado(e.target.value)}>
                          <option value="Pendiente">Pendiente (En evaluación)</option>
                          <option value="Aprobado">Aprobado (Asignar Cupo)</option>
                          <option value="Rechazado">Rechazado (No Asignado)</option>
                        </select>
                      </div>
                      <div className="col-md-8">
                        <label className="form-label fw-bold text-dark">Observaciones / Instrucciones para el Representante</label>
                        <textarea 
                          className="form-control input-moderno border-secondary border-opacity-25" 
                          rows={3} 
                          placeholder="Ingresa los comentarios de la Dirección Escolar. Estos serán visibles en tiempo real por el representante."
                          value={evalObs}
                          onChange={(e) => setEvalObs(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer bg-white py-3 rounded-bottom-4 border-top">
              <button type="button" className="btn btn-outline-secondary rounded-pill px-4 fw-semibold" data-bs-dismiss="modal">
                Cerrar
              </button>
              <button type="button" onClick={handleEvaluarSolicitud} className="btn btn-success rounded-pill px-4 fw-semibold shadow hover-efecto">
                <i className="bi bi-save me-1"></i> Guardar Evaluación
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
