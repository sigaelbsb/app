import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';
import { 
  ChamiloBreadcrumb, 
  ChamiloHelpCallout, 
  IconoEstructuraEmpresa3D,
  IconoParametroCorporativo,
  IconoListaCargos
} from '../../components/chamilo';

interface DiccionarioItem {
  id_parametro: string;
  categoria: string;
  valor: string;
}

export const EstructuraEmpresa = () => {
  const navigate = useNavigate();
  const { tienePermiso, tienePermisoEnEscuela, loading: permLoading } = usePermisos();
  const Swal = (window as any).Swal;

  const [datos, setDatos] = useState<DiccionarioItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter Tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [tabActiva, setTabActiva] = useState<'todos' | 'nomina' | 'pdvsa' | 'salud'>('todos');

  // Campus dual y selector interactivo
  const hasSbVer = tienePermisoEnEscuela('sb', 'Estructura Empresa', 'ver');
  const hasLbVer = tienePermisoEnEscuela('lb', 'Estructura Empresa', 'ver');
  const isDualAccess = hasSbVer && hasLbVer;
  const activeSchoolCode = localStorage.getItem('sigae_escuela_codigo') || 'sb';

  const cambiarEscuelaActiva = (nuevaEscuela: 'sb' | 'lb') => {
    if (nuevaEscuela === activeSchoolCode) return;
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
    window.location.reload();
  };

  // Card permissions
  const hasVerNomina = tienePermiso('Diccionario: Nómina', 'ver');
  const hasVerParentesco = tienePermiso('Diccionario: Parentesco', 'ver');
  const hasVerCondicion = tienePermiso('Diccionario: Condición', 'ver');
  const hasVerNegocio = tienePermiso('Diccionario: Negocio/Filial', 'ver');
  const hasVerGerencia = tienePermiso('Diccionario: Organización/Gerencia', 'ver');
  const hasVerLocalidad = tienePermiso('Diccionario: Localidad', 'ver');
  const hasVerCondicionNeuro = tienePermiso('Diccionario: Condición Neuro', 'ver');
  const hasVerCondicionMedica = tienePermiso('Diccionario: Condición Médica', 'ver');
  const hasVerAlergia = tienePermiso('Diccionario: Alergias', 'ver');
  
  const hasVerModulo = tienePermiso('Estructura Empresa', 'ver');

  const canCrear = tienePermiso('Estructura Empresa', 'crear');
  const canEliminar = tienePermiso('Estructura Empresa', 'eliminar');
  const canEditar = tienePermiso('Estructura Empresa', 'editar') || canCrear;

  const isModuleRestricted = !permLoading && !hasVerModulo;

  useEffect(() => {
    if (!permLoading && hasVerModulo) {
      cargarDatos();
    }
  }, [permLoading]);

  const cargarDatos = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('diccionarios_empresa')
        .select('*')
        .order('valor', { ascending: true });

      if (error) throw error;
      setDatos(data || []);
    } catch (e: any) {
      console.error(e);
      if (e.code === 'PGRST205' || (e.message && e.message.includes('Could not find the table'))) {
        if (Swal) {
          Swal.fire({
            title: 'Tabla No Encontrada',
            html: `La tabla <code>diccionarios_empresa</code> no existe en el esquema de su base de datos Supabase.<br><br>Por favor, ejecute la consulta SQL provista para crearla.`,
            icon: 'warning',
            confirmButtonColor: '#0f172a'
          });
        }
      } else {
        if (Swal) Swal.fire('Error', 'No se pudieron cargar los datos de la estructura corporativa.', 'error');
      }
    }
    if (!silencioso) setLoading(false);
  };

  const nuevoItem = (categoria: string) => {
    if (!canCrear) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para añadir registros.', 'error');
      return;
    }

    if (!Swal) return;

    Swal.fire({
      title: `Añadir a ${categoria}`,
      html: `<input type="text" id="swal-valor-dic" class="swal2-input input-moderno m-0 w-100" placeholder="Escriba el nombre...">`,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      confirmButtonColor: '#0f172a',
      preConfirm: () => {
        const valor = (document.getElementById('swal-valor-dic') as HTMLInputElement).value.trim();
        if (!valor) {
          Swal.showValidationMessage('El nombre es obligatorio');
          return false;
        }
        return valor;
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        // Prevent duplicates in the same category
        const existe = datos.find(
          d => d.categoria === categoria && d.valor.toLowerCase() === result.value.toLowerCase()
        );
        if (existe) {
          Swal.fire('Atención', 'Este registro ya existe en la lista.', 'warning');
          return;
        }

        setLoading(true);
        try {
          const payload = {
            id_parametro: "EMP-" + new Date().getTime(),
            categoria: categoria,
            valor: result.value
          };

          const { error } = await supabase.from('diccionarios_empresa').insert([payload]);
          if (error) throw error;

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Añadido exitosamente',
            showConfirmButton: false,
            timer: 1500
          });

          auditar('Estructura Empresa', 'Nuevo Registro', `Se añadió "${result.value}" a la lista de ${categoria}.`);
          cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla en base de datos al guardar.', 'error');
          setLoading(false);
        }
      }
    });
  };

  const editarItem = (id: string, valorActual: string, categoria: string) => {
    if (!canEditar) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para modificar registros.', 'error');
      return;
    }

    if (!Swal) return;

    Swal.fire({
      title: `Editar Registro`,
      html: `<input type="text" id="swal-valor-dic-edit" class="swal2-input input-moderno m-0 w-100" value="${valorActual}" placeholder="Escriba el nombre...">`,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      confirmButtonColor: '#0f172a',
      preConfirm: () => {
        const valor = (document.getElementById('swal-valor-dic-edit') as HTMLInputElement).value.trim();
        if (!valor) {
          Swal.showValidationMessage('El nombre es obligatorio');
          return false;
        }
        return valor;
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        const existe = datos.find(
          d => d.categoria === categoria && 
               d.id_parametro !== id &&
               d.valor.toLowerCase() === result.value.toLowerCase()
        );
        if (existe) {
          Swal.fire('Atención', 'Este registro ya existe en la lista.', 'warning');
          return;
        }

        setLoading(true);
        try {
          const { error } = await supabase
            .from('diccionarios_empresa')
            .update({ valor: result.value })
            .eq('id_parametro', id);

          if (error) throw error;

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Actualizado exitosamente',
            showConfirmButton: false,
            timer: 1500
          });

          auditar('Estructura Empresa', 'Editar Registro', `Se actualizó el registro en ${categoria} de "${valorActual}" a "${result.value}".`);
          cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla en base de datos al guardar.', 'error');
          setLoading(false);
        }
      }
    });
  };

  const eliminarItem = (id: string, valor: string, categoria: string) => {
    if (!canEliminar) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para eliminar registros.', 'error');
      return;
    }

    if (!Swal) return;

    Swal.fire({
      title: '¿Eliminar Registro?',
      text: `Se borrará "${valor}" de las opciones disponibles.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase.from('diccionarios_empresa').delete().eq('id_parametro', id);
          if (error) throw error;

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Eliminado',
            showConfirmButton: false,
            timer: 1500
          });

          auditar('Estructura Empresa', 'Eliminar Registro', `Se eliminó "${valor}" de la lista de ${categoria}.`);
          cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla de conexión al eliminar.', 'error');
          setLoading(false);
        }
      }
    });
  };

  const renderizarTarjeta = (titulo: string, categoria: string, _icono: string, colorBorder: string, bgColor: string) => {
    const todosDeCategoria = datos.filter(d => d.categoria === categoria);
    const filtrados = todosDeCategoria.filter(d => {
      if (!searchQuery.trim()) return true;
      return d.valor.toLowerCase().includes(searchQuery.toLowerCase().trim());
    });

    // Si hay búsqueda activa y esta tarjeta no tiene resultados coincidentes, la ocultamos para despejar la vista
    if (searchQuery.trim() && filtrados.length === 0) {
      return null;
    }

    return (
      <div className="card border-0 shadow-sm rounded-4 h-100" style={{ borderTop: `5px solid ${colorBorder} !important` }}>
        <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center rounded-top-4">
          <div className="d-flex align-items-center gap-2.5">
            <div 
              className="p-1.5 rounded-3 d-flex align-items-center justify-content-center shadow-xs" 
              style={{ backgroundColor: bgColor, border: `1px solid ${colorBorder}33`, width: '40px', height: '40px' }}
            >
              <IconoParametroCorporativo size={26} color={colorBorder} />
            </div>
            <div>
              <h6 className="mb-0 fw-bold text-dark">{titulo}</h6>
              <span className="text-muted extra-small fw-bold" style={{ fontSize: '0.7rem' }}>
                {searchQuery.trim() ? `${filtrados.length} de ${todosDeCategoria.length} coinciden` : `${filtrados.length} items activos`}
              </span>
            </div>
          </div>
          {canCrear && (
            <button 
              className="btn btn-sm text-white fw-bold shadow-sm hover-efecto rounded-pill px-3" 
              style={{ background: colorBorder }} 
              onClick={() => nuevoItem(categoria)}
              title={`Añadir registro a ${titulo}`}
            >
              <i className="bi bi-plus-lg me-1"></i>Añadir
            </button>
          )}
        </div>
        <div className="card-body p-0" style={{ maxHeight: '280px', overflowY: 'auto' }}>
          {filtrados.length === 0 ? (
            <div className="p-4 text-center text-muted">
              <i className="bi bi-inbox fs-3 text-muted"></i>
              <p className="mb-0 small fw-bold mt-2 text-muted">
                {searchQuery.trim() ? 'Sin coincidencias' : 'No hay registros'}
              </p>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {filtrados.map(item => (
                <div key={item.id_parametro} className="list-group-item p-3 border-0 border-bottom d-flex justify-content-between align-items-center hover-efecto">
                  <div className="fw-bold text-dark d-flex align-items-center gap-2" style={{ fontSize: '0.9rem' }}>
                    <i className="bi bi-record-circle-fill text-muted" style={{ fontSize: '0.5rem' }}></i> {item.valor}
                  </div>
                  <div className="d-flex gap-1">
                    {canEditar && (
                      <button 
                        className="btn btn-sm btn-light text-primary rounded-circle shadow-sm border hover-efecto" 
                        onClick={() => editarItem(item.id_parametro, item.valor, categoria)}
                        title="Editar"
                      >
                        <i className="bi bi-pencil-fill" style={{ fontSize: '0.8rem' }}></i>
                      </button>
                    )}
                    {canEliminar && (
                      <button 
                        className="btn btn-sm btn-light text-danger rounded-circle shadow-sm border hover-efecto" 
                        onClick={() => eliminarItem(item.id_parametro, item.valor, categoria)}
                        title="Eliminar"
                      >
                        <i className="bi bi-trash3-fill" style={{ fontSize: '0.8rem' }}></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (permLoading || (loading && datos.length === 0)) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5 h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (isModuleRestricted) {
    return (
      <div className="col-12 text-center py-5 mt-4">
        <div className="bg-light d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm border" style={{ width: '100px', height: '100px' }}>
          <i className="bi bi-shield-lock-fill text-muted" style={{ fontSize: '3.5rem' }}></i>
        </div>
        <h4 className="text-dark fw-bold mb-2">Área Restringida</h4>
        <p className="text-muted mb-0">No tienes permisos asignados para acceder a la estructura de la empresa.</p>
      </div>
    );
  }

  return (
    <div className="modulo-animado container-fluid p-0 animate__animated animate__fadeIn">

      {/* 1. MIGAS DE PAN CHAMILO */}
      <ChamiloBreadcrumb
        category="Organización Escolar"
        currentModule="Estructura Empresa"
      />

      {/* 2. CUADRO DE AYUDA METODOLÓGICA CHAMILO */}
      <ChamiloHelpCallout
        id="ayuda_estructura_empresa"
        title="Guía de Diccionarios y Estructura Organizativa"
        content="Configure los parámetros empresariales e institucionales: tipos de nómina, negocios y filiales, gerencias y departamentos, parentescos y catálogos de salud utilizados en todo el sistema."
        icon="bi-buildings-fill"
      />

      {/* ── 3. CABECERA INSTITUCIONAL 3D ── */}
      <div 
        className="banner-modulo p-4 p-md-5 mb-4 shadow-sm text-white position-relative overflow-hidden rounded-4 animate__animated animate__fadeInDown" 
        style={{ background: 'linear-gradient(135deg, #e11d48 0%, #be123c 50%, #9f1239 100%)' }}
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
              title="Módulo de Estructura Empresa"
            >
              <IconoEstructuraEmpresa3D size={64} />
            </div>
          </div>

          <div className="col-12 col-md text-center text-md-start">
            <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-2 flex-wrap">
              <span className="badge bg-white text-danger px-3 py-1.5 shadow-sm fw-bold rounded-pill badge-3d">
                <i className="bi bi-buildings-fill me-1"></i>Organización Estratégica & PDVSA
              </span>
              <span className="badge bg-white bg-opacity-20 text-white border border-white border-opacity-25 px-2.5 py-1.5 rounded-pill small fw-bold shadow-sm">
                <i className="bi bi-list-check me-1"></i><b>{datos.length}</b> Parámetros
              </span>
              <span className="badge bg-white bg-opacity-20 text-white border border-white border-opacity-25 px-2.5 py-1.5 rounded-pill small fw-bold shadow-sm">
                <i className="bi bi-tags-fill me-1"></i><b>{[...new Set(datos.map(d => d.categoria))].length}</b> Categorías
              </span>
            </div>

            <h1 className="fw-bolder mb-1 text-white" style={{ fontSize: 'calc(1.6rem + 0.8vw)', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              Estructura de la Empresa
            </h1>

            <p className="mb-0 text-white text-opacity-90 fs-5 fw-semibold" style={{ maxWidth: '820px' }}>
              Gestión de diccionarios corporativos, filiales petroleras, tipos de nómina, gerencias y parentescos vinculados al personal y representantes.
            </p>
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

        {/* Selector Dual de Escuela Chamilo Tech */}
        {isDualAccess && (
          <div 
            className="mt-4 pt-3 border-top border-white border-opacity-25 d-flex align-items-center justify-content-between flex-wrap gap-2 position-relative z-1"
          >
            <div className="d-flex align-items-center gap-2">
              <span className="extra-small fw-bold text-white text-uppercase" style={{ fontSize: '0.75rem', opacity: 0.9 }}>Plantel Activo:</span>
              <div className="btn-group btn-group-sm shadow-sm rounded-pill overflow-hidden bg-white p-0.5" role="group">
                <button 
                  onClick={() => cambiarEscuelaActiva('sb')} 
                  className={`btn btn-xs px-3 py-1 fw-bold rounded-pill transition-all ${
                    activeSchoolCode === 'sb' ? 'btn-success text-white shadow-sm' : 'text-dark bg-transparent'
                  }`}
                  style={{ fontSize: '0.8rem' }}
                >
                  🟢 UE Santa Bárbara
                </button>
                <button 
                  onClick={() => cambiarEscuelaActiva('lb')} 
                  className={`btn btn-xs px-3 py-1 fw-bold rounded-pill transition-all ${
                    activeSchoolCode === 'lb' ? 'btn-primary text-white shadow-sm' : 'text-dark bg-transparent'
                  }`}
                  style={{ fontSize: '0.8rem' }}
                >
                  🔵 UE Libertador Bolívar
                </button>
              </div>
            </div>
            <div className="text-white extra-small" style={{ opacity: 0.9 }}>
              <i className="bi bi-shield-check me-1"></i>Acceso dual administrativo
            </div>
          </div>
        )}
      </div>

      {/* Métricas Clave - Chamilo Tech Design */}
      <div className="row g-3 mb-4 animate__animated animate__fadeIn">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 d-flex flex-row align-items-center gap-3">
            <div className="p-2 rounded-3 bg-light d-flex align-items-center justify-content-center shadow-xs">
              <IconoParametroCorporativo size={36} color="#e11d48" />
            </div>
            <div>
              <span className="text-muted extra-small text-uppercase fw-bold d-block">Total Parámetros</span>
              <h4 className="fw-bolder mb-0 text-dark">{datos.length}</h4>
              <span className="badge bg-danger bg-opacity-10 text-danger rounded-pill extra-small mt-1">
                Catálogos activos
              </span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 d-flex flex-row align-items-center gap-3">
            <div className="p-2 rounded-3 bg-light d-flex align-items-center justify-content-center shadow-xs">
              <IconoEstructuraEmpresa3D size={36} color="#0284c7" />
            </div>
            <div>
              <span className="text-muted extra-small text-uppercase fw-bold d-block">Categorías Activas</span>
              <h4 className="fw-bolder mb-0 text-dark">{[...new Set(datos.map(d => d.categoria))].length}</h4>
              <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill extra-small mt-1">
                Grupos corporativos
              </span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 d-flex flex-row align-items-center gap-3">
            <div className="p-2 rounded-3 bg-light d-flex align-items-center justify-content-center shadow-xs">
              <IconoListaCargos size={36} color="#10b981" />
            </div>
            <div>
              <span className="text-muted extra-small text-uppercase fw-bold d-block">Nómina & Filiales</span>
              <h4 className="fw-bolder mb-0 text-dark">
                {datos.filter(d => ['Nómina', 'Condición', 'Parentesco', 'Negocio/Filial', 'Organización/Gerencia', 'Localidad'].includes(d.categoria)).length}
              </h4>
              <span className="badge bg-success bg-opacity-10 text-success rounded-pill extra-small mt-1">
                Personal y PDVSA
              </span>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 d-flex flex-row align-items-center gap-3">
            <div className="p-2 rounded-3 bg-danger bg-opacity-10 text-danger d-flex align-items-center justify-content-center shadow-xs" style={{ width: '48px', height: '48px' }}>
              <i className="bi bi-heart-pulse-fill fs-3"></i>
            </div>
            <div>
              <span className="text-muted extra-small text-uppercase fw-bold d-block">Salud & Bienestar</span>
              <h4 className="fw-bolder mb-0 text-dark">
                {datos.filter(d => ['Condición / Discapacidad', 'Condición Médica', 'Medicamento (Alergia)', 'Alimento (Alergia)', 'Otra (Alergia)'].includes(d.categoria)).length}
              </h4>
              <span className="badge bg-warning bg-opacity-10 text-dark rounded-pill extra-small mt-1">
                Alergias y condiciones
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BARRA DE OPERACIONES Y FILTRADO ── */}
      <div className="row g-3 mb-4 align-items-center justify-content-between">
        {/* Píldoras de Filtro Temático */}
        <div className="col-12 col-lg-auto">
          <div className="nav nav-pills gap-1 bg-white p-1 rounded-pill shadow-xs border d-inline-flex flex-wrap" role="tablist">
            <button 
              type="button"
              className={`nav-link rounded-pill px-3 py-1.5 extra-small fw-bold transition-all ${
                tabActiva === 'todos' ? 'active shadow-xs text-white' : 'text-muted'
              }`}
              style={{ backgroundColor: tabActiva === 'todos' ? '#e11d48' : 'transparent' }}
              onClick={() => setTabActiva('todos')}
            >
              Todos ({datos.length})
            </button>
            <button 
              type="button"
              className={`nav-link rounded-pill px-3 py-1.5 extra-small fw-bold transition-all ${
                tabActiva === 'nomina' ? 'active shadow-xs text-white' : 'text-muted'
              }`}
              style={{ backgroundColor: tabActiva === 'nomina' ? '#334155' : 'transparent' }}
              onClick={() => setTabActiva('nomina')}
            >
              Nómina y Personal
            </button>
            <button 
              type="button"
              className={`nav-link rounded-pill px-3 py-1.5 extra-small fw-bold transition-all ${
                tabActiva === 'pdvsa' ? 'active shadow-xs text-white' : 'text-muted'
              }`}
              style={{ backgroundColor: tabActiva === 'pdvsa' ? '#0f172a' : 'transparent' }}
              onClick={() => setTabActiva('pdvsa')}
            >
              Estructura PDVSA
            </button>
            <button 
              type="button"
              className={`nav-link rounded-pill px-3 py-1.5 extra-small fw-bold transition-all ${
                tabActiva === 'salud' ? 'active shadow-xs text-white' : 'text-muted'
              }`}
              style={{ backgroundColor: tabActiva === 'salud' ? '#7c3aed' : 'transparent' }}
              onClick={() => setTabActiva('salud')}
            >
              Salud y Bienestar
            </button>
          </div>
        </div>

        {/* Buscador Global con Botón Limpiar */}
        <div className="col-12 col-lg-4">
          <div className="input-group shadow-sm rounded-pill overflow-hidden border bg-white">
            <span className="input-group-text bg-white border-0 ps-3"><i className="bi bi-search text-muted"></i></span>
            <input 
              type="text" 
              className="form-control border-0 px-2 py-2" 
              placeholder="Buscar parámetro en cualquier catálogo..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button" 
                className="btn btn-link text-muted border-0 pe-3" 
                onClick={() => setSearchQuery('')}
                title="Limpiar búsqueda"
              >
                <i className="bi bi-x-circle-fill text-secondary"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Banner de búsqueda vacía */}
      {searchQuery.trim() && datos.filter(d => d.valor.toLowerCase().includes(searchQuery.toLowerCase().trim())).length === 0 && (
        <div className="col-12 text-center py-5 bg-white rounded-4 border shadow-sm my-3 animate__animated animate__fadeIn">
          <i className="bi bi-search fs-1 text-muted d-block mb-2"></i>
          <h6 className="fw-bold text-dark mb-1">No se encontraron resultados para "{searchQuery}"</h6>
          <p className="text-muted small mb-3">Intenta buscar con otra palabra clave o limpia el filtro de búsqueda.</p>
          <button 
            className="btn btn-sm btn-outline-danger rounded-pill px-4 fw-bold" 
            onClick={() => setSearchQuery('')}
          >
            <i className="bi bi-x-circle me-1"></i>Limpiar Búsqueda
          </button>
        </div>
      )}

      {/* Grid de Catálogos y Diccionarios */}
      <div className="row g-4 animate__animated animate__fadeInUp">
        {/* Tipos de Nómina */}
        {hasVerNomina && (tabActiva === 'todos' || tabActiva === 'nomina') && (
          <div className="col-12 col-md-6 col-xl-4">
            {renderizarTarjeta('Tipos de Nómina', 'Nómina', 'bi-card-checklist', '#334155', '#e2e8f0')}
          </div>
        )}

        {/* Parentesco */}
        {hasVerParentesco && (tabActiva === 'todos' || tabActiva === 'nomina') && (
          <div className="col-12 col-md-6 col-xl-4">
            {renderizarTarjeta('Parentesco', 'Parentesco', 'bi-people-fill', '#475569', '#f1f5f9')}
          </div>
        )}

        {/* Condición Laboral */}
        {hasVerCondicion && (tabActiva === 'todos' || tabActiva === 'nomina') && (
          <div className="col-12 col-md-6 col-xl-4">
            {renderizarTarjeta('Condición Laboral', 'Condición', 'bi-person-badge-fill', '#64748b', '#f8fafc')}
          </div>
        )}

        {/* Negocios / Filiales */}
        {hasVerNegocio && (tabActiva === 'todos' || tabActiva === 'pdvsa') && (
          <div className="col-12 col-md-6 col-xl-4">
            {renderizarTarjeta('Negocios / Filiales', 'Negocio/Filial', 'bi-building', '#0f172a', '#e2e8f0')}
          </div>
        )}

        {/* Gerencias / Dptos */}
        {hasVerGerencia && (tabActiva === 'todos' || tabActiva === 'pdvsa') && (
          <div className="col-12 col-md-6 col-xl-4">
            {renderizarTarjeta('Gerencias / Dptos.', 'Organización/Gerencia', 'bi-briefcase-fill', '#1e293b', '#e2e8f0')}
          </div>
        )}

        {/* Localidades */}
        {hasVerLocalidad && (tabActiva === 'todos' || tabActiva === 'pdvsa') && (
          <div className="col-12 col-md-6 col-xl-4">
            {renderizarTarjeta('Localidades de Trabajo', 'Localidad', 'bi-geo-alt-fill', '#047857', '#d1fae5')}
          </div>
        )}

        {/* Condición Neuro / Discapacidad */}
        {hasVerCondicionNeuro && (tabActiva === 'todos' || tabActiva === 'salud') && (
          <div className="col-12 col-md-6 col-xl-4">
            {renderizarTarjeta('Condición Neurológica / Discapacidad', 'Condición / Discapacidad', 'bi-person-wheelchair', '#7c3aed', '#ede9fe')}
          </div>
        )}

        {/* Condición Médica */}
        {hasVerCondicionMedica && (tabActiva === 'todos' || tabActiva === 'salud') && (
          <div className="col-12 col-md-6 col-xl-4">
            {renderizarTarjeta('Condición Médica', 'Condición Médica', 'bi-heart-pulse-fill', '#be123c', '#ffe4e6')}
          </div>
        )}

        {/* Alergias */}
        {hasVerAlergia && (tabActiva === 'todos' || tabActiva === 'salud') && (
          <>
            <div className="col-12 col-md-6 col-xl-4">
              {renderizarTarjeta('Alergias a Medicamentos', 'Medicamento (Alergia)', 'bi-capsule', '#ea580c', '#ffedd5')}
            </div>
            <div className="col-12 col-md-6 col-xl-4">
              {renderizarTarjeta('Alergias a Alimentos', 'Alimento (Alergia)', 'bi-cup-hot-fill', '#d97706', '#fef3c7')}
            </div>
            <div className="col-12 col-md-6 col-xl-4">
              {renderizarTarjeta('Otras Alergias / Intolerancias', 'Otra (Alergia)', 'bi-virus', '#ef4444', '#fee2e2')}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EstructuraEmpresa;
