import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';
import { 
  ChamiloBreadcrumb, 
  ChamiloHelpCallout, 
  IconoCargosInstitucionales3D,
  IconoCrearCargo,
  IconoListaCargos,
  IconoAsignarPersonal
} from '../../components/chamilo';
import { esCargoInterinstitucional } from './CadenaSupervisoria';

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

  // Escuela Activa y Dual Switcher
  const [escuelaCodigo, setEscuelaCodigo] = useState<string>(() => localStorage.getItem('sigae_escuela_codigo') || 'sb');
  const [filtroTipoTab, setFiltroTipoTab] = useState<string>('todos');

  const cambiarEscuelaActiva = (nuevaEscuela: 'sb' | 'lb') => {
    if (nuevaEscuela === escuelaCodigo) return;
    setEscuelaCodigo(nuevaEscuela);
    localStorage.setItem('sigae_escuela_codigo', nuevaEscuela);
    localStorage.setItem('sigae_escuela_activa', nuevaEscuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
    try {
      const u = JSON.parse(localStorage.getItem('usuario_sigae') || '{}');
      u.id_escuela = nuevaEscuela;
      u.nombre_escuela = nuevaEscuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
      localStorage.setItem('usuario_sigae', JSON.stringify(u));
    } catch {
      // ignorar
    }
    setFiltroEscuela(nuevaEscuela);
    window.location.reload();
  };

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
      
      // Excluir taxativamente representantes, estudiantes, invitados y visitantes (sin importar mayúsculas/minúsculas)
      const rolesNoPersonal = [
        'representante',
        'estudiante',
        'alumno',
        'alumna',
        'invitado',
        'visitante',
        'padre',
        'madre',
        'tutor',
        'apoderado'
      ];
      let validUsers = (data || []).filter((u: any) => {
        const r = String(u.rol || '').trim().toLowerCase();
        if (!r) return false;
        if (rolesNoPersonal.includes(r)) return false;
        if (r.includes('representante') || r.includes('estudiante') || r.includes('alumno') || r.includes('invitado') || r.includes('visitante')) {
          return false;
        }
        return true;
      });

      // Filtrar por permisos de asignación por escuela (Líder y Apoyo son comunes a ambas instituciones)
      if (!isDualAccess) {
        if (canAsignarSB) {
          validUsers = validUsers.filter((u: any) => u.id_escuela === 'sb' || (u.cargo && esCargoInterinstitucional(u.cargo)));
        } else if (canAsignarLB) {
          validUsers = validUsers.filter((u: any) => u.id_escuela === 'lb' || (u.cargo && esCargoInterinstitucional(u.cargo)));
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
        (filtroEscuela === 'todos' || u.id_escuela === filtroEscuela || (u.cargo && esCargoInterinstitucional(u.cargo)))
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
  const filteredCargos = cargos.filter(c => {
    const matchBusqueda = c.nombre_cargo.toLowerCase().includes(busquedaCargo.toLowerCase()) || (c.descripcion || '').toLowerCase().includes(busquedaCargo.toLowerCase());
    const matchEscuela = filtroEscuela === 'todos' || c.id_escuela === filtroEscuela || !c.id_escuela;
    const matchTipo = filtroTipoTab === 'todos' || c.tipo_cargo === filtroTipoTab;
    return matchBusqueda && matchEscuela && matchTipo;
  });

  const personalAsignado = usuarios.filter(u => u.cargo).length;
  const porcentajeAsignados = usuarios.length > 0 ? Math.round((personalAsignado / usuarios.length) * 100) : 0;

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
    <div className="modulo-animado container-fluid p-0 animate__animated animate__fadeIn">

      {/* 1. MIGAS DE PAN CHAMILO */}
      <ChamiloBreadcrumb
        category="Organización Escolar"
        currentModule="Cargos Institucionales"
      />

      {/* 2. CUADRO DE AYUDA METODOLÓGICA CHAMILO */}
      <ChamiloHelpCallout
        id="ayuda_cargos_institucionales"
        title="Guía de Cargos y Responsabilidades Institucionales"
        content="Defina el catálogo oficial de puestos de trabajo directivos, coordinaciones docentes, personal administrativo y obrero. Asigne responsabilidades específicas a los miembros de la nómina activa."
        icon="bi-briefcase-fill"
      />

      {/* ── 3. CABECERA INSTITUCIONAL 3D ── */}
      <div 
        className="banner-modulo p-4 p-md-5 mb-4 shadow-sm text-white position-relative overflow-hidden rounded-4 animate__animated animate__fadeInDown" 
        style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)' }}
      >
        <div className="burbuja-3d burbuja-1"></div>
        <div className="burbuja-3d burbuja-2"></div>
        <div className="burbuja-3d burbuja-3"></div>

        <div className="row align-items-center position-relative z-1 g-4">
          <div className="col-12 col-md-auto text-center text-md-start">
            <div 
              className="rounded-4 p-2 bg-white d-inline-flex align-items-center justify-content-center shadow-lg"
              style={{
                width: '95px',
                height: '95px',
                border: '2.5px solid rgba(255,255,255,0.4)',
                boxShadow: '0 10px 24px rgba(0,0,0,0.2)'
              }}
              title="Módulo de Cargos Institucionales"
            >
              <IconoCargosInstitucionales3D size={64} />
            </div>
          </div>

          <div className="col-12 col-md text-center text-md-start">
            <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-2 flex-wrap">
              <span className="badge bg-white text-primary px-3 py-1.5 shadow-sm fw-bold rounded-pill badge-3d">
                <i className="bi bi-briefcase-fill me-1"></i>Planta Docente & Cargos
              </span>
              <span className="badge bg-white bg-opacity-20 text-white border border-white border-opacity-25 px-2.5 py-1.5 rounded-pill small fw-bold shadow-sm">
                <i className="bi bi-briefcase-fill me-1"></i><b>{cargos.length}</b> Cargos Creados
              </span>
              <span className="badge bg-white bg-opacity-20 text-white border border-white border-opacity-25 px-2.5 py-1.5 rounded-pill small fw-bold shadow-sm">
                <i className="bi bi-people-fill me-1"></i><b>{usuarios.length}</b> Personal Registrado
              </span>
              <span className="badge bg-white bg-opacity-20 text-white border border-white border-opacity-25 px-2.5 py-1.5 rounded-pill small fw-bold shadow-sm">
                <i className="bi bi-check-circle-fill me-1"></i><b>{personalAsignado}</b> Asignados ({porcentajeAsignados}%)
              </span>
            </div>

            <h1 className="fw-bolder mb-1 text-white" style={{ fontSize: 'calc(1.6rem + 0.8vw)', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              Cargos Institucionales
            </h1>

            <p className="mb-0 text-white text-opacity-90 fs-5 fw-semibold" style={{ maxWidth: '820px' }}>
              Definición del catálogo de puestos de trabajo y asignación de responsabilidades al personal docente, administrativo y obrero.
            </p>

            {/* Barra de Cobertura Nominal de Cargos */}
            <div className="mt-3" style={{ maxWidth: '440px' }}>
              <div className="d-flex justify-content-between align-items-center small fw-bold text-white mb-1">
                <span><i className="bi bi-person-check-fill me-1"></i>Cobertura Nominal de Personal</span>
                <span>{porcentajeAsignados}%</span>
              </div>
              <div className="progress rounded-pill shadow-xs" style={{ height: '7px', backgroundColor: 'rgba(255,255,255,0.3)' }}>
                <div 
                  className="progress-bar rounded-pill bg-white" 
                  role="progressbar" 
                  style={{ 
                    width: `${porcentajeAsignados}%`, 
                    boxShadow: '0 0 10px rgba(255,255,255,0.8)',
                    transition: 'width 0.6s ease'
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-3 text-end d-none d-lg-block">
            <img 
              src={`/assets/img/logo_${localStorage.getItem('sigae_escuela_codigo') || 'sb'}.png`} 
              alt="Logo Escuela" 
              className="logo-escuela-banner"
              onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
            />
          </div>
        </div>

        {/* Barra de Control Dual y Pestañas Integradas */}
        <div 
          className="mt-4 pt-3 border-top border-white border-opacity-25 d-flex justify-content-between align-items-center flex-wrap gap-3 position-relative z-1"
        >
          {/* Pestañas de Navegación */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {pDefinirVer && (
              <button 
                onClick={() => setActiveTab('definir')} 
                className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-bold transition-all d-inline-flex align-items-center gap-2 ${
                  activeTab === 'definir' 
                    ? 'btn-white bg-white text-primary shadow-sm' 
                    : 'text-white border border-white border-opacity-25 bg-white bg-opacity-10 hover-efecto'
                }`}
                style={{ fontSize: '0.85rem' }}
              >
                <IconoListaCargos size={18} color={activeTab === 'definir' ? '#2563eb' : '#ffffff'} />
                <span>1. Definir Catálogo de Cargos</span>
              </button>
            )}
            {pAsignarVer && (
              <button 
                onClick={() => setActiveTab('asignar')} 
                className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-bold transition-all d-inline-flex align-items-center gap-2 ${
                  activeTab === 'asignar' 
                    ? 'btn-white bg-white text-primary shadow-sm' 
                    : 'text-white border border-white border-opacity-25 bg-white bg-opacity-10 hover-efecto'
                }`}
                style={{ fontSize: '0.85rem' }}
              >
                <IconoAsignarPersonal size={18} color={activeTab === 'asignar' ? '#2563eb' : '#ffffff'} />
                <span>2. Asignar Personal a Cargos</span>
              </button>
            )}
          </div>

          {/* Selector Dual SB / LB */}
          <div className="d-flex align-items-center gap-2">
            <span className="extra-small fw-bold text-white text-uppercase" style={{ fontSize: '0.75rem', opacity: 0.9 }}>Plantel:</span>
            <div className="btn-group btn-group-sm shadow-sm rounded-pill overflow-hidden bg-white p-0.5" role="group">
              <button 
                onClick={() => cambiarEscuelaActiva('sb')} 
                className={`btn btn-xs px-3 py-1 fw-bold rounded-pill transition-all ${
                  escuelaCodigo === 'sb' ? 'btn-success text-white shadow-sm' : 'text-dark bg-transparent'
                }`}
                style={{ fontSize: '0.8rem' }}
              >
                🟢 SB
              </button>
              <button 
                onClick={() => cambiarEscuelaActiva('lb')} 
                className={`btn btn-xs px-3 py-1 fw-bold rounded-pill transition-all ${
                  escuelaCodigo === 'lb' ? 'btn-primary text-white shadow-sm' : 'text-dark bg-transparent'
                }`}
                style={{ fontSize: '0.8rem' }}
              >
                🔵 LB
              </button>
            </div>
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
                <div className="d-flex align-items-center gap-3">
                  <div 
                    className="p-2 rounded-3 d-flex align-items-center justify-content-center shadow-xs" 
                    style={{ backgroundColor: '#eff6ff', border: '1.5px solid #bfdbfe', width: '44px', height: '44px' }}
                  >
                    <IconoCrearCargo size={26} color="#2563eb" />
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold text-dark">
                      {formId ? 'Actualizar Cargo' : 'Registrar Nuevo Cargo'}
                    </h5>
                    <span className="text-muted extra-small" style={{ fontSize: '0.75rem' }}>
                      {formId ? 'Modificar perfil y nivel jerárquico' : 'Creación de nuevo puesto en el catálogo'}
                    </span>
                  </div>
                </div>
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
                        <option value="sb">UE Santa Bárbara</option>
                        <option value="lb">UE Libertador Bolívar</option>
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
                        className="btn w-100 rounded-pill fw-bold text-white shadow-xs hover-efecto"
                        style={{ backgroundColor: formId ? '#16a34a' : '#2563eb', borderColor: formId ? '#16a34a' : '#2563eb' }}
                      >
                        <i className={`bi ${formId ? 'bi-save-fill' : 'bi-floppy-fill'} me-2`}></i>
                        {formId ? 'Actualizar' : 'Guardar Cargo'}
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
                <div className="d-flex align-items-center gap-3">
                  <div 
                    className="p-2 rounded-3 d-flex align-items-center justify-content-center shadow-xs" 
                    style={{ backgroundColor: '#eff6ff', border: '1.5px solid #bfdbfe', width: '44px', height: '44px' }}
                  >
                    <IconoListaCargos size={26} color="#2563eb" />
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold text-dark">Listado de Cargos</h5>
                    <span className="text-muted extra-small" style={{ fontSize: '0.75rem' }}>Puestos registrados en la institución</span>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {/* Píldoras de Clasificación */}
                  <div className="btn-group btn-group-sm rounded-pill border bg-light p-0.5" role="group">
                    {['todos', 'Directivo', 'Supervisorio', 'Docente/Administrativo', 'Obrero/Apoyo'].map(tipo => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => { setFiltroTipoTab(tipo); setPaginaCargos(1); }}
                        className={`btn btn-xs rounded-pill px-2.5 py-1 fw-bold transition-all ${
                          filtroTipoTab === tipo ? 'btn-primary text-white shadow-xs' : 'btn-light text-muted'
                        }`}
                        style={{ fontSize: '0.72rem' }}
                      >
                        {tipo === 'todos' ? 'Todos' : tipo.split('/')[0]}
                      </button>
                    ))}
                  </div>

                  <div className="position-relative" style={{ minWidth: '220px' }}>
                    <span className="position-absolute start-0 top-50 translate-middle-y ms-3 text-muted">
                      <i className="bi bi-search"></i>
                    </span>
                    <input 
                      type="text" 
                      className="form-control form-control-sm rounded-pill ps-5 pe-4 input-moderno" 
                      placeholder="Buscar cargo..." 
                      value={busquedaCargo}
                      onChange={(e) => { setBusquedaCargo(e.target.value); setPaginaCargos(1); }}
                    />
                    {busquedaCargo && (
                      <button
                        type="button"
                        onClick={() => { setBusquedaCargo(''); setPaginaCargos(1); }}
                        className="btn btn-link position-absolute end-0 top-50 translate-middle-y p-0 me-2 text-muted border-0"
                        title="Limpiar búsqueda"
                      >
                        <i className="bi bi-x-circle-fill small"></i>
                      </button>
                    )}
                  </div>
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
                  <div className="d-flex align-items-center gap-3">
                    <div 
                      className="p-2 rounded-3 d-flex align-items-center justify-content-center shadow-xs" 
                      style={{ backgroundColor: '#eff6ff', border: '1.5px solid #bfdbfe', width: '44px', height: '44px' }}
                    >
                      <IconoAsignarPersonal size={26} color="#2563eb" />
                    </div>
                    <div>
                      <h5 className="mb-0 fw-bold text-dark">Asignación de Cargos al Personal</h5>
                      <span className="text-muted extra-small" style={{ fontSize: '0.75rem' }}>Vinculación nominal y responsabilidades de nómina</span>
                    </div>
                  </div>
                  
                  {/* Selector de escuela */}
                  <div className="btn-group btn-group-sm shadow-xs border rounded-pill overflow-hidden bg-white" role="group">
                    {isDualAccess && (
                      <button 
                        type="button" 
                        onClick={() => setFiltroEscuela('todos')} 
                        className={`btn btn-sm px-3 fw-bold transition-all ${filtroEscuela === 'todos' ? 'text-white' : 'text-muted'}`}
                        style={{ backgroundColor: filtroEscuela === 'todos' ? '#e11d48' : 'transparent', border: 'none' }}
                      >
                        🏢 Todas las Sedes
                      </button>
                    )}
                    {(canAsignarSB || isDualAccess) && (
                      <button 
                        type="button" 
                        onClick={() => setFiltroEscuela('sb')} 
                        className={`btn btn-sm px-3 fw-bold transition-all ${filtroEscuela === 'sb' ? 'text-white' : 'text-muted'}`}
                        style={{ backgroundColor: filtroEscuela === 'sb' ? '#10b981' : 'transparent', border: 'none' }}
                      >
                        🟢 UE Santa Bárbara
                      </button>
                    )}
                    {(canAsignarLB || isDualAccess) && (
                      <button 
                        type="button" 
                        onClick={() => setFiltroEscuela('lb')} 
                        className={`btn btn-sm px-3 fw-bold transition-all ${filtroEscuela === 'lb' ? 'text-white' : 'text-muted'}`}
                        style={{ backgroundColor: filtroEscuela === 'lb' ? '#0284c7' : 'transparent', border: 'none' }}
                      >
                        🔵 UE Libertador Bolívar
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
                      className="form-control rounded-pill ps-5 pe-4 input-moderno" 
                      placeholder="Buscar personal (Nombre o C.I.)..." 
                      value={busquedaPersonal}
                      onChange={(e) => handleFiltrarPersonal(e.target.value)}
                    />
                    {busquedaPersonal && (
                      <button
                        type="button"
                        onClick={() => handleFiltrarPersonal('')}
                        className="btn btn-link position-absolute end-0 top-50 translate-middle-y p-0 me-3 text-muted border-0"
                        title="Limpiar búsqueda"
                      >
                        <i className="bi bi-x-circle-fill small"></i>
                      </button>
                    )}
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
                                    {u.id_escuela === 'sb' ? 'UE Santa Bárbara' : u.id_escuela === 'lb' ? 'UE Libertador Bolívar' : 'Global/Soporte'}
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
