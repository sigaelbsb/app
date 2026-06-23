import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';

interface Cargo {
  id_cargo: string;
  nombre_cargo: string;
  tipo_cargo: string;
  descripcion: string;
  id_escuela: string | null;
}

interface Usuario {
  id_usuario: string;
  cedula: string;
  nombre_completo: string;
  rol: string;
  cargo: string | null;
  id_escuela: string | null;
}

export const CargosInstitucionales = () => {
  const navigate = useNavigate();
  const { tienePermiso, tienePermisoEnEscuela, loading: permLoading } = usePermisos();
  const Swal = (window as any).Swal;

  // Tabs state
  const [activeTab, setActiveTab] = useState<'definir' | 'asignar'>('definir');

  // Cargos data state
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loadingCargos, setLoadingCargos] = useState(true);

  // Form state
  const [formId, setFormId] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formTipo, setFormTipo] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formEscuela, setFormEscuela] = useState('');
  const [busquedaCargo, setBusquedaCargo] = useState('');

  // Pagination for cargos
  const [paginaCargos, setPaginaCargos] = useState(1);
  const itemsPorPaginaCargos = 6;

  // Personal/Usuarios state
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([]);
  const [busquedaPersonal, setBusquedaPersonal] = useState('');
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [filtroEscuela, setFiltroEscuela] = useState<string>(localStorage.getItem('sigae_escuela_codigo') || 'todos');

  // Pagination for personal
  const [paginaUsuarios, setPaginaUsuarios] = useState(1);
  const itemsPorPaginaUsuarios = 8;

  // Temporary assignments state (local select state to allow bulk save)
  const [asignacionesLocales, setAsignacionesLocales] = useState<{ [userId: string]: string }>({});

  // Permisos
  const pDefinirVer = tienePermiso('Tarjeta: Definir Cargos', 'ver');
  const pDefinirCrear = tienePermiso('Tarjeta: Definir Cargos', 'crear');
  const pDefinirEliminar = tienePermiso('Tarjeta: Definir Cargos', 'eliminar');
  
  const canAsignarSB = tienePermisoEnEscuela('sb', 'Tarjeta: Asignar Personal', 'ver');
  const canAsignarLB = tienePermisoEnEscuela('lb', 'Tarjeta: Asignar Personal', 'ver');
  const isDualAccess = canAsignarSB && canAsignarLB;

  const pAsignarVer = canAsignarSB || canAsignarLB;
  const pAsignarMasivo = tienePermisoEnEscuela('sb', 'Tarjeta: Asignar Personal', 'masivo') || tienePermisoEnEscuela('lb', 'Tarjeta: Asignar Personal', 'masivo');

  const hasModuloAcceso = tienePermiso('Cargos Institucionales', 'ver');
  const isRestricted = !permLoading && !hasModuloAcceso;

  useEffect(() => {
    if (!permLoading && hasModuloAcceso) {
      cargarCargos();
      cargarPersonal();
    }
  }, [permLoading]);

  // Sync default tab based on permission
  useEffect(() => {
    if (!permLoading) {
      if (pDefinirVer) setActiveTab('definir');
      else if (pAsignarVer) setActiveTab('asignar');
    }
  }, [permLoading, pDefinirVer, pAsignarVer]);

  // Sincronizar filtro de escuela según permisos del usuario
  useEffect(() => {
    if (!permLoading) {
      if (canAsignarSB && !canAsignarLB) {
        setFiltroEscuela('sb');
      } else if (canAsignarLB && !canAsignarSB) {
        setFiltroEscuela('lb');
      } else if (isDualAccess) {
        const activeSchool = localStorage.getItem('sigae_escuela_codigo');
        setFiltroEscuela(activeSchool === 'sb' || activeSchool === 'lb' ? activeSchool : 'todos');
      }
    }
  }, [permLoading, canAsignarSB, canAsignarLB, isDualAccess]);

  const cargarCargos = async (silencioso = false) => {
    if (!silencioso) setLoadingCargos(true);
    try {
      const { data, error } = await supabase
        .from('cargos')
        .select('*')
        .order('nombre_cargo', { ascending: true });

      if (error) throw error;
      setCargos(data || []);
    } catch (e: any) {
      console.error(e);
      if (Swal) Swal.fire('Error', 'No se pudieron cargar los cargos de la base de datos.', 'error');
    }
    if (!silencioso) setLoadingCargos(false);
  };

  const cargarPersonal = async (silencioso = false) => {
    if (!silencioso) setLoadingUsuarios(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id_usuario, cedula, nombre_completo, rol, cargo, id_escuela')
        .order('nombre_completo', { ascending: true });

      if (error) throw error;
      
      // Excluir estudiantes, representantes, visitantes
      const rolesExcluidos = ['Estudiante', 'Representante', 'Invitado', 'Visitante'];
      let validUsers = (data || []).filter((u: any) => !rolesExcluidos.includes(u.rol));

      // Filtrar por permisos de asignación por escuela
      if (!isDualAccess) {
        if (canAsignarSB) {
          validUsers = validUsers.filter((u: any) => u.id_escuela === 'sb');
        } else if (canAsignarLB) {
          validUsers = validUsers.filter((u: any) => u.id_escuela === 'lb');
        } else {
          validUsers = [];
        }
      }

      setUsuarios(validUsers);
      setUsuariosFiltrados(validUsers);
      
      // Initialize local assignments state from fetched cargo
      const initialLocals: { [userId: string]: string } = {};
      validUsers.forEach((u: any) => {
        initialLocals[u.id_usuario] = u.cargo || '';
      });
      setAsignacionesLocales(initialLocals);

    } catch (e: any) {
      console.error(e);
      if (Swal) Swal.fire('Error', 'No se pudo cargar el listado de personal.', 'error');
    }
    if (!silencioso) setLoadingUsuarios(false);
  };

  // Filter personal list in real-time reactively
  const handleFiltrarPersonal = (text: string) => {
    setBusquedaPersonal(text);
  };

  useEffect(() => {
    const search = busquedaPersonal.toLowerCase();
    const filtrados = usuarios.filter(
      u =>
        (u.nombre_completo.toLowerCase().includes(search) ||
         u.cedula.toLowerCase().includes(search)) &&
        (filtroEscuela === 'todos' || u.id_escuela === filtroEscuela)
    );
    setUsuariosFiltrados(filtrados);
    setPaginaUsuarios(1);
  }, [busquedaPersonal, filtroEscuela, usuarios]);

  // Form handlers
  const handleSaveCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pDefinirCrear) {
      if (Swal) Swal.fire('Acceso Denegado', 'No posees permisos de creación o edición.', 'error');
      return;
    }

    const nombreLimpio = formNombre.trim();
    if (!nombreLimpio || !formTipo) {
      if (Swal) Swal.fire('Atención', 'El nombre y el tipo de cargo son obligatorios.', 'warning');
      return;
    }

    setLoadingCargos(true);
    try {
      const payload = {
        nombre_cargo: nombreLimpio,
        tipo_cargo: formTipo,
        descripcion: formDescripcion.trim(),
        id_escuela: formEscuela || null
      };

      if (formId) {
        // Edit Mode
        const { error } = await supabase
          .from('cargos')
          .update(payload)
          .eq('id_cargo', formId);

        if (error) throw error;

        if (Swal) {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Cargo actualizado',
            showConfirmButton: false,
            timer: 1500
          });
        }
        auditar('Cargos Institucionales', 'Editar Cargo', `Se actualizó el cargo: ${nombreLimpio} (${formTipo})`);
      } else {
        // Create Mode
        const id_generado = 'CAR-' + new Date().getTime();
        const { error } = await supabase
          .from('cargos')
          .insert([{ id_cargo: id_generado, ...payload }]);

        if (error) throw error;

        if (Swal) {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Cargo registrado',
            showConfirmButton: false,
            timer: 1500
          });
        }
        auditar('Cargos Institucionales', 'Nuevo Cargo', `Se registró el cargo: ${nombreLimpio} (${formTipo})`);
      }

      handleCancelForm();
      cargarCargos(true);
    } catch (err: any) {
      console.error(err);
      if (Swal) Swal.fire('Error', 'Falla al guardar el cargo en base de datos.', 'error');
    }
    setLoadingCargos(false);
  };

  const handleEditCargo = (c: Cargo) => {
    setFormId(c.id_cargo);
    setFormNombre(c.nombre_cargo);
    setFormTipo(c.tipo_cargo);
    setFormDescripcion(c.descripcion || '');
    setFormEscuela(c.id_escuela || '');
  };

  const handleCancelForm = () => {
    setFormId('');
    setFormNombre('');
    setFormTipo('');
    setFormDescripcion('');
    setFormEscuela('');
  };

  const handleDeleteCargo = (id: string, nombre: string) => {
    if (!pDefinirEliminar) {
      if (Swal) Swal.fire('Acceso Denegado', 'No posees permisos de eliminación.', 'error');
      return;
    }

    if (!Swal) return;

    Swal.fire({
      title: '¿Eliminar cargo?',
      text: `Se borrará "${nombre}". Esto no afectará a los usuarios, solo los dejará sin cargo asignado temporalmente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoadingCargos(true);
        try {
          const { error } = await supabase
            .from('cargos')
            .delete()
            .eq('id_cargo', id);

          if (error) throw error;

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Eliminado',
            showConfirmButton: false,
            timer: 1500
          });

          auditar('Cargos Institucionales', 'Eliminar Cargo', `Se eliminó el cargo: ${nombre}`);
          cargarCargos(true);
        } catch (e: any) {
          console.error(e);
          Swal.fire('Error', 'Falla al intentar eliminar en base de datos.', 'error');
        }
        setLoadingCargos(false);
      }
    });
  };

  // Bulk save assignments for current page
  const handleSaveBulkAssignments = async (usuariosPagina: Usuario[]) => {
    if (!pAsignarMasivo) {
      if (Swal) Swal.fire('Acceso Denegado', 'No posees permisos de asignación masiva.', 'error');
      return;
    }

    if (usuariosPagina.length === 0) return;

    if (Swal) {
      Swal.fire({
        title: 'Asignando Cargos...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });
    }

    try {
      const promesas = usuariosPagina.map(u => {
        const cargoAsignar = asignacionesLocales[u.id_usuario] || null;
        return supabase
          .from('usuarios')
          .update({ cargo: cargoAsignar })
          .eq('id_usuario', u.id_usuario);
      });

      await Promise.all(promesas);

      if (Swal) {
        Swal.close();
        Swal.fire('¡Sincronizado!', 'Las asignaciones de esta página se guardaron correctamente.', 'success');
      }

      auditar('Cargos Institucionales', 'Asignación Masiva', `Se actualizaron los cargos de ${usuariosPagina.length} usuarios.`);
      cargarPersonal(true);
    } catch (e: any) {
      console.error(e);
      if (Swal) {
        Swal.close();
        Swal.fire('Error', 'Ocurrió un error al guardar las asignaciones.', 'error');
      }
    }
  };

  const handleLocalSelectChange = (userId: string, val: string) => {
    setAsignacionesLocales(prev => ({
      ...prev,
      [userId]: val
    }));
  };

  // Helper render for paginations
  const renderPagination = (
    totalItems: number,
    itemsPerPage: number,
    currentPage: number,
    setPage: (p: number) => void
  ) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return (
      <nav className="mt-3">
        <ul className="pagination pagination-sm justify-content-center mb-0">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => setPage(currentPage - 1)}>
              <i className="bi bi-chevron-left"></i>
            </button>
          </li>
          {pages.map(p => (
            <li key={p} className={`page-item ${currentPage === p ? 'active' : ''}`}>
              <button className="page-link" onClick={() => setPage(p)}>
                {p}
              </button>
            </li>
          ))}
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => setPage(currentPage + 1)}>
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  // Filtering lists of cargos
  const filteredCargos = cargos.filter(c =>
    c.nombre_cargo.toLowerCase().includes(busquedaCargo.toLowerCase()) &&
    (filtroEscuela === 'todos' || c.id_escuela === filtroEscuela || !c.id_escuela)
  );

  const startCargos = (paginaCargos - 1) * itemsPorPaginaCargos;
  const pageCargos = filteredCargos.slice(startCargos, startCargos + itemsPorPaginaCargos);

  const startUsuarios = (paginaUsuarios - 1) * itemsPorPaginaUsuarios;
  const pageUsuarios = usuariosFiltrados.slice(startUsuarios, startUsuarios + itemsPorPaginaUsuarios);

  if (permLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5 h-100">
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
        <p className="text-muted mb-0">No tienes permisos asignados para acceder a la gestión de cargos.</p>
      </div>
    );
  }

  return (
    <div className="modulo-animado container-fluid p-0">
      {/* Banner */}
      <div className="row mb-4 animate__animated animate__fadeInDown">
        <div className="col-12">
          <div 
            className="banner-modulo p-4 p-md-5 text-white shadow-sm" 
            style={{ background: 'linear-gradient(135deg, #0066FF 0%, #003399 100%)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
          >
            <div className="burbuja-3d burbuja-1" style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.06)', position: 'absolute', top: '-50px', right: '-20px', borderRadius: '50%' }}></div>
            <div className="burbuja-3d burbuja-2" style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.04)', position: 'absolute', bottom: '-20px', left: '20px', borderRadius: '50%' }}></div>
            <div className="row align-items-center position-relative z-1">
              <div className="col-12 text-center text-md-start">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <span className="badge bg-white mb-0 px-3 py-2 shadow-sm fw-bold" style={{ color: '#0066FF', letterSpacing: '1px', fontSize: '0.85rem' }}>
                    <i className="bi bi-briefcase-fill me-1"></i> ORGANIZACIÓN INSTITUCIONAL
                  </span>
                  <button 
                    onClick={() => navigate('/categoria/Organizaci%C3%B3n%20Escolar')} 
                    className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                  >
                    <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
                  </button>
                </div>
                <h1 className="fw-bolder mb-2 text-white" style={{ fontSize: '2.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  <i className="bi bi-briefcase-fill me-3"></i>Cargos Institucionales
                </h1>
                <p className="mb-0 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Definición y asignación de responsabilidades al personal docente y administrativo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="bg-white p-2 rounded-4 shadow-sm border d-inline-flex gap-2">
            {pDefinirVer && (
              <button 
                onClick={() => setActiveTab('definir')} 
                className={`btn rounded-pill px-4 fw-bold hover-efecto ${activeTab === 'definir' ? 'btn-primary' : 'btn-light text-muted'}`}
              >
                <i className="bi bi-sliders2-vertical me-2"></i> Definir Cargos
              </button>
            )}
            {pAsignarVer && (
              <button 
                onClick={() => setActiveTab('asignar')} 
                className={`btn rounded-pill px-4 fw-bold hover-efecto ${activeTab === 'asignar' ? 'btn-primary' : 'btn-light text-muted'}`}
              >
                <i className="bi bi-people-fill me-2"></i> Asignar Personal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido de Pestañas */}
      {activeTab === 'definir' && pDefinirVer && (
        <div className="row g-4 animate__animated animate__fadeIn">
          {/* Formulario */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-header bg-white border-bottom p-4">
                <h5 className="mb-0 fw-bold text-dark">
                  <i className={`bi ${formId ? 'bi-pencil-square text-success' : 'bi-plus-circle-fill text-primary'} me-2`}></i>
                  {formId ? 'Actualizar Cargo' : 'Registrar Nuevo Cargo'}
                </h5>
              </div>
              <div className="card-body p-4">
                {pDefinirCrear ? (
                  <form onSubmit={handleSaveCargo}>
                    <input type="hidden" value={formId} />
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-muted">Nombre del Cargo *</label>
                      <input 
                        type="text" 
                        className="form-control input-moderno" 
                        placeholder="Ej: Docente de 3er Grado, Coordinador..."
                        value={formNombre}
                        onChange={(e) => setFormNombre(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-muted">Tipo/Clasificación *</label>
                      <select 
                        className="form-select input-moderno" 
                        value={formTipo}
                        onChange={(e) => setFormTipo(e.target.value)}
                        required
                      >
                        <option value="">-- Seleccione --</option>
                        <option value="Directivo">Directivo</option>
                        <option value="Supervisorio">Supervisorio</option>
                        <option value="Docente/Administrativo">Docente/Administrativo</option>
                        <option value="Obrero/Apoyo">Obrero/Apoyo</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-muted">Escuela o Plantel *</label>
                      <select 
                        className="form-select input-moderno" 
                        value={formEscuela}
                        onChange={(e) => setFormEscuela(e.target.value)}
                      >
                        <option value="">Global / Ambas Escuelas</option>
                        <option value="sb">U.E. Santa Bárbara</option>
                        <option value="lb">U.E. Libertador Bolívar</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="form-label small fw-bold text-muted">Descripción (Opcional)</label>
                      <textarea 
                        className="form-control input-moderno" 
                        rows={4}
                        placeholder="Describa brevemente las funciones asociadas a este cargo..."
                        value={formDescripcion}
                        onChange={(e) => setFormDescripcion(e.target.value)}
                      ></textarea>
                    </div>
                    <div className="d-flex gap-2">
                      <button 
                        type="submit" 
                        className={`btn w-100 rounded-pill fw-bold ${formId ? 'btn-success' : 'btn-primary'}`}
                      >
                        <i className={`bi ${formId ? 'bi-save-fill' : 'bi-floppy-fill'} me-2`}></i>
                        {formId ? 'Actualizar' : 'Guardar'}
                      </button>
                      {formId && (
                        <button 
                          type="button" 
                          onClick={handleCancelForm} 
                          className="btn btn-outline-secondary w-100 rounded-pill"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="alert alert-warning text-center my-4 py-4">
                    <i className="bi bi-lock-fill fs-2 d-block mb-2 text-warning"></i>
                    No posees privilegios para crear o modificar cargos.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabla de Cargos */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                <h5 className="mb-0 fw-bold text-dark">Listado de Cargos</h5>
                <div className="position-relative" style={{ maxWidth: '280px', width: '100%' }}>
                  <span className="position-absolute start-0 top-50 translate-middle-y ms-3 text-muted">
                    <i className="bi bi-search"></i>
                  </span>
                  <input 
                    type="text" 
                    className="form-control form-control-sm rounded-pill ps-5 input-moderno" 
                    placeholder="Buscar cargo..." 
                    value={busquedaCargo}
                    onChange={(e) => { setBusquedaCargo(e.target.value); setPaginaCargos(1); }}
                  />
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light text-muted small fw-bold">
                      <tr>
                        <th className="ps-4 py-3">Nombre del Cargo</th>
                        <th className="py-3">Clasificación</th>
                        <th className="py-3">Descripción</th>
                        <th className="pe-4 py-3 text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingCargos ? (
                        <tr>
                          <td colSpan={4} className="text-center py-5">
                            <span className="spinner-border spinner-border-sm text-primary me-2"></span>
                            Cargando listado de cargos...
                          </td>
                        </tr>
                      ) : pageCargos.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-5 text-muted">
                            <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                            No hay cargos registrados.
                          </td>
                        </tr>
                      ) : (
                        pageCargos.map(c => {
                          const badgeColor =
                            c.tipo_cargo === 'Directivo'
                              ? 'danger'
                              : c.tipo_cargo === 'Supervisorio'
                              ? 'warning text-dark'
                              : c.tipo_cargo === 'Docente/Administrativo'
                              ? 'primary'
                              : 'secondary';

                          return (
                            <tr key={c.id_cargo} className="hover-efecto">
                              <td className="ps-4 fw-bold text-dark">
                                {c.nombre_cargo}
                                <div className="mt-1 d-flex gap-1">
                                  {c.id_escuela === 'sb' && (
                                    <span className="badge bg-success bg-opacity-10 text-success border border-success" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                      Santa Bárbara
                                    </span>
                                  )}
                                  {c.id_escuela === 'lb' && (
                                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                      Libertador Bolívar
                                    </span>
                                  )}
                                  {!c.id_escuela && (
                                    <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                      Global
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <span className={`badge bg-${badgeColor} bg-opacity-10 text-${badgeColor.replace(' text-dark', '')} border border-${badgeColor.replace(' text-dark', '')} px-2 py-1`}>
                                  {c.tipo_cargo}
                                </span>
                              </td>
                              <td className="text-muted small text-truncate" style={{ maxWidth: '250px' }}>
                                {c.descripcion || 'Sin descripción'}
                              </td>
                              <td className="pe-4 text-end text-nowrap">
                                {pDefinirCrear && (
                                  <button 
                                    onClick={() => handleEditCargo(c)} 
                                    className="btn btn-sm btn-light text-primary border shadow-sm me-1 hover-efecto"
                                    title="Editar"
                                  >
                                    <i className="bi bi-pencil-fill"></i>
                                  </button>
                                )}
                                {pDefinirEliminar && (
                                  <button 
                                    onClick={() => handleDeleteCargo(c.id_cargo, c.nombre_cargo)} 
                                    className="btn btn-sm btn-light text-danger border shadow-sm hover-efecto"
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
                {renderPagination(filteredCargos.length, itemsPorPaginaCargos, paginaCargos, setPaginaCargos)}
                <div className="p-3 text-muted small border-top text-end fw-bold">
                  Total Cargos: {filteredCargos.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'asignar' && pAsignarVer && (
        <div className="row animate__animated animate__fadeIn">
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <h5 className="mb-0 fw-bold text-dark">Asignación de Cargos al Personal</h5>
                  
                  {/* Selector de escuela */}
                  <div className="btn-group btn-group-sm shadow-sm border rounded-pill overflow-hidden" role="group">
                    {isDualAccess && (
                      <button 
                        type="button" 
                        onClick={() => setFiltroEscuela('todos')} 
                        className={`btn btn-sm px-3 fw-bold ${filtroEscuela === 'todos' ? 'btn-primary' : 'btn-light text-muted'}`}
                        style={{ border: 'none' }}
                      >
                        Todos
                      </button>
                    )}
                    {(canAsignarSB || isDualAccess) && (
                      <button 
                        type="button" 
                        onClick={() => setFiltroEscuela('sb')} 
                        className={`btn btn-sm px-3 fw-bold ${filtroEscuela === 'sb' ? 'btn-primary' : 'btn-light text-muted'}`}
                        style={{ border: 'none' }}
                      >
                        UE Santa Bárbara
                      </button>
                    )}
                    {(canAsignarLB || isDualAccess) && (
                      <button 
                        type="button" 
                        onClick={() => setFiltroEscuela('lb')} 
                        className={`btn btn-sm px-3 fw-bold ${filtroEscuela === 'lb' ? 'btn-primary' : 'btn-light text-muted'}`}
                        style={{ border: 'none' }}
                      >
                        UE Libertador Bolívar
                      </button>
                    )}
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap w-100 w-md-auto" style={{ maxWidth: '500px' }}>
                  <div className="position-relative flex-grow-1">
                    <span className="position-absolute start-0 top-50 translate-middle-y ms-3 text-muted">
                      <i className="bi bi-search"></i>
                    </span>
                    <input 
                      type="text" 
                      className="form-control rounded-pill ps-5 input-moderno" 
                      placeholder="Buscar personal (Nombre o C.I.)..." 
                      value={busquedaPersonal}
                      onChange={(e) => handleFiltrarPersonal(e.target.value)}
                    />
                  </div>
                  {pAsignarMasivo && (
                    <button 
                      onClick={() => handleSaveBulkAssignments(pageUsuarios)} 
                      className="btn btn-success rounded-pill fw-bold hover-efecto text-nowrap"
                    >
                      <i className="bi bi-cloud-arrow-up-fill me-2"></i> Guardar Página
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light text-muted small fw-bold">
                      <tr>
                        <th className="ps-4 py-3">Personal</th>
                        <th className="py-3">Rol Administrativo</th>
                        <th className="pe-4 py-3" style={{ width: '380px' }}>Cargo Asignado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingUsuarios ? (
                        <tr>
                          <td colSpan={3} className="text-center py-5">
                            <span className="spinner-border spinner-border-sm text-primary me-2"></span>
                            Cargando listado de personal...
                          </td>
                        </tr>
                      ) : pageUsuarios.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center py-5 text-muted">
                            <i className="bi bi-search fs-2 d-block mb-2"></i>
                            No se encontró personal apto o que coincida con la búsqueda.
                          </td>
                        </tr>
                      ) : (
                        pageUsuarios.map((u) => {
                          const localVal = asignacionesLocales[u.id_usuario] ?? (u.cargo || '');
                          const hasChanged = localVal !== (u.cargo || '');

                          return (
                            <tr key={u.id_usuario} className="hover-efecto">
                              <td className="ps-4">
                                <div className="fw-bold text-dark">{u.nombre_completo}</div>
                                <div className="small text-muted"><i className="bi bi-person-vcard me-1"></i>{u.cedula}</div>
                              </td>
                              <td>
                                <div className="d-flex flex-column gap-1 align-items-start">
                                  <span className="badge bg-dark bg-opacity-10 text-dark border px-2 py-1 shadow-sm small">
                                    {u.rol}
                                  </span>
                                  <span className={`badge ${u.id_escuela === 'sb' ? 'bg-primary' : 'bg-info'} bg-opacity-10 ${u.id_escuela === 'sb' ? 'text-primary' : 'text-info'} border px-2 py-0.5`} style={{ fontSize: '0.75rem' }}>
                                    {u.id_escuela === 'sb' ? 'U.E. Santa Bárbara' : u.id_escuela === 'lb' ? 'U.E. Libertador Bolívar' : 'Global/Soporte'}
                                  </span>
                                </div>
                              </td>
                              <td className="pe-4">
                                <div 
                                  className="input-group input-group-sm shadow-sm hover-efecto" 
                                  style={{ borderRadius: '10px', overflow: 'hidden', border: `1px solid ${hasChanged ? 'var(--bs-primary)' : '#ced4da'}` }}
                                >
                                  <span className={`input-group-text bg-opacity-10 border-0 ${hasChanged ? 'bg-primary text-primary' : 'bg-secondary text-secondary'}`}>
                                    <i className="bi bi-briefcase-fill"></i>
                                  </span>
                                  <select 
                                    className="form-select border-0 fw-bold text-dark" 
                                    value={localVal}
                                    onChange={(e) => handleLocalSelectChange(u.id_usuario, e.target.value)}
                                    disabled={!pAsignarMasivo}
                                    style={{ backgroundColor: '#f8fafc', cursor: 'pointer' }}
                                  >
                                    <option value="">-- Sin cargo asignado --</option>
                                    {cargos
                                      .filter(c => !c.id_escuela || c.id_escuela === u.id_escuela)
                                      .map(c => (
                                        <option key={c.id_cargo} value={c.nombre_cargo}>
                                          {c.nombre_cargo}
                                        </option>
                                      ))}
                                  </select>
                                </div>
                                {hasChanged && (
                                  <small className="text-primary fw-bold d-block mt-1 ps-2 animate__animated animate__pulse animate__infinite">
                                    <i className="bi bi-exclamation-circle-fill me-1"></i>Cambio sin guardar
                                  </small>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {renderPagination(usuariosFiltrados.length, itemsPorPaginaUsuarios, paginaUsuarios, setPaginaUsuarios)}
                <div className="p-3 text-muted small border-top text-end fw-bold d-flex justify-content-between align-items-center px-4">
                  <span className="text-muted">Aptos para Cargo: {usuariosFiltrados.length}</span>
                  {pAsignarMasivo && (
                    <span className="text-primary">
                      <i className="bi bi-info-circle me-1"></i>Realiza las asignaciones y haz clic en <strong>"Guardar Página"</strong> para salvar en Supabase.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
