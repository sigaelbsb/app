import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';

const ESTRUCTURA_ACCESOS = {
  "Dirección y Sistema": {
    "Perfil de la Escuela": [],
    "Espacios Escolares": [],
    "Gestión de Registros": [],
    "División Territorial": [],
    "Configuración del Sistema": ["Tarjeta: Períodos Escolares", "Tarjeta: Lapsos Académicos", "Tarjeta: Niveles Educativos"],
    "Cerebro de Sigma": [],
    "Calendario Escolar": ["Tarjeta: Calendario Oficial MPPE", "Tarjeta: Calendario Administrativo", "Tarjeta: Calendario Pedagógico", "Tarjeta: Planificador"],
    "Panel de Control": [] 
  },
  "Organización Escolar": {
    "Cargos Institucionales": ["Tarjeta: Definir Cargos", "Tarjeta: Asignar Personal"],
    "Cadena Supervisoria": ["Función: Estructurar Cadena", "Función: Imprimir Organigrama"],
    "Gestión de Colectivos": [],
    "Estructura Empresa": ["Diccionario: Nómina", "Diccionario: Parentesco", "Diccionario: Condición"]
  },
  "Control de Estudios": {
    "Grados y Salones": ["Tarjeta: Configurar Grados", "Tarjeta: Configurar Secciones", "Tarjeta: Apertura de Salones"]
  },
  "Gestión Estudiantil": {
    "Gestión de Admisiones": [], 
    "Gestión de Matrícula": [], 
    "Vincular Estudiante": [],
    "Expediente Estudiantil": [], 
    "Actualización de Datos": [], 
    "Solicitud de Cupos": [], 
    "Mis Solicitudes": [], 
    "Verificaciones": ["Función: Escanear QR", "Función: Re-imprimir Comprobante"]
  },
  "Gestión Docente": {
    "Asignar Guiaturas": [], 
    "Mi Expediente": [], 
    "Gestor de Expedientes": []
  },
  "Formación y Capacitación": {
    "Gestor de Catálogo": ["Función: Crear Cursos", "Función: Editar Cursos", "Función: Eliminar Cursos"],
    "Oferta Académica": [], 
    "Mis Certificados": [], 
    "Creador de Certificados": []
  },
  "Servicios y Bienestar": {
    "Transporte Escolar": ["Tarjeta: Gestión de Rutas", "Tarjeta: Gestión de Paradas", "Tarjeta: Operación (Tracking)", "Tarjeta: Visor de Recorrido"]
  },
  "Seguridad y Accesos": {
    "Mi Perfil": [], 
    "Métodos de Acceso": [], 
    "Gestión de Usuarios": [], 
    "Roles y Privilegios": [], 
    "Preguntas de Seguridad": [], 
    "Auditoría del Sistema": []
  }
};

const SUPER_PODERES = { ver: true, crear: true, eliminar: true, modificar: true, masivo: true, escanear: true, imprimir: true, registrar: true, exportar: true, resetear: true };

export const RolesPrivilegios = () => {
  const navigate = useNavigate();
  const { tienePermiso, loading: permLoading } = usePermisos();

  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolSeleccionado, setRolSeleccionado] = useState<any>(null);

  // Privileges matrix representation
  // We represent it as a nested state object: { lb: { [nombre]: boolean }, sb: { [nombre]: boolean } }
  const [permisosState, setPermisosState] = useState<any>({ lb: {}, sb: {} });

  const Swal = (window as any).Swal;

  useEffect(() => {
    if (!permLoading && tienePermiso('Roles y Privilegios', 'ver')) {
      cargarRoles();
    }
  }, [permLoading]);

  const cargarRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;

      const mapped = (data || []).map(r => ({
        id: r.id_usuario || r.idx || r.nombre,
        nombre: r.nombre,
        privilegios: typeof r.permisos === 'string' ? JSON.parse(r.permisos || '{}') : (r.permisos || {})
      }));

      setRoles(mapped);

      // Sincronizar rol seleccionado actual
      if (rolSeleccionado) {
        const matching = mapped.find(r => r.nombre === rolSeleccionado.nombre);
        if (matching) {
          seleccionarRol(matching);
        }
      }
    } catch (e) {
      console.error(e);
      if (Swal) Swal.fire('Error', 'Falla al cargar roles de Supabase.', 'error');
    }
    setLoading(false);
  };

  const seleccionarRol = (r: any) => {
    setRolSeleccionado(r);

    let lbPriv: any = {};
    let sbPriv: any = {};

    const rawLb = r.privilegios?.lb || {};
    const rawSb = r.privilegios?.sb || {};

    // Map boolean values
    const mapBooleans = (raw: any, dest: any) => {
      // Check Acceso Plantel
      dest['__acceso_plantel__'] = !!(raw['__acceso_plantel__']?.ver);

      for (const [_cat, submods] of Object.entries(ESTRUCTURA_ACCESOS)) {
        for (const [subName, subcards] of Object.entries(submods)) {
          dest[subName] = !!(raw[subName]?.ver);
          subcards.forEach(card => {
            dest[card] = !!(raw[card]?.ver);
          });
        }
      }
    };

    mapBooleans(rawLb, lbPriv);
    mapBooleans(rawSb, sbPriv);

    setPermisosState({ lb: lbPriv, sb: sbPriv });
  };

  const handleCheckboxChange = (escuela: 'lb' | 'sb', item: string, isParent: boolean, parentName?: string, subcards?: string[]) => {
    setPermisosState((prev: any) => {
      const copyEsc = { ...prev[escuela] };
      const newValue = !copyEsc[item];
      copyEsc[item] = newValue;

      if (isParent) {
        // Cascada hacia abajo: marcar/desmarcar todos los hijos
        if (subcards) {
          subcards.forEach(child => {
            copyEsc[child] = newValue;
          });
        }
      } else if (parentName) {
        // Cascada hacia arriba: si se marca un hijo, forzar a marcar el padre
        if (newValue) {
          copyEsc[parentName] = true;
        }
      }

      return {
        ...prev,
        [escuela]: copyEsc
      };
    });
  };

  const handleToggleTodos = (escuela: 'lb' | 'sb', checked: boolean) => {
    setPermisosState((prev: any) => {
      const copyEsc = { ...prev[escuela] };
      
      copyEsc['__acceso_plantel__'] = checked;

      for (const [_cat, submods] of Object.entries(ESTRUCTURA_ACCESOS)) {
        for (const [subName, subcards] of Object.entries(submods)) {
          copyEsc[subName] = checked;
          subcards.forEach(card => {
            copyEsc[card] = checked;
          });
        }
      }

      return {
        ...prev,
        [escuela]: copyEsc
      };
    });
  };

  const isTodosMarcados = (escuela: 'lb' | 'sb') => {
    const list = permisosState[escuela];
    if (Object.keys(list).length === 0) return false;

    // Check Acceso Plantel
    if (!list['__acceso_plantel__']) return false;

    for (const [_cat, submods] of Object.entries(ESTRUCTURA_ACCESOS)) {
      for (const [subName, subcards] of Object.entries(submods)) {
        if (!list[subName]) return false;
        for (let card of subcards) {
          if (!list[card]) return false;
        }
      }
    }
    return true;
  };

  const guardarPrivilegios = async () => {
    if (!rolSeleccionado) return;

    setLoading(true);
    try {
      // Build permission payload matching the standard structure
      const buildEscPayload = (esc: 'lb' | 'sb') => {
        const raw = permisosState[esc];
        const dest: any = {};

        // Acceso Plantel
        dest['__acceso_plantel__'] = { ver: !!raw['__acceso_plantel__'] };

        for (const [_cat, submods] of Object.entries(ESTRUCTURA_ACCESOS)) {
          for (const [subName, subcards] of Object.entries(submods)) {
            if (raw[subName]) {
              dest[subName] = { ...SUPER_PODERES };
            }
            subcards.forEach(card => {
              if (raw[card]) {
                dest[card] = { ...SUPER_PODERES };
              }
            });
          }
        }
        return dest;
      };

      const finalPermisos = {
        lb: buildEscPayload('lb'),
        sb: buildEscPayload('sb')
      };

      const { error } = await supabase
        .from('roles')
        .update({ permisos: finalPermisos })
        .eq('nombre', rolSeleccionado.nombre);

      if (error) throw error;

      if (Swal) Swal.fire('¡Éxito!', 'Los accesos y privilegios se han guardado correctamente.', 'success');
      auditar('Roles y Privilegios', 'Actualizar Privilegios', `Accesos simplificados actualizados para: ${rolSeleccionado.nombre}`);

      // Refresh current user's locally stored session permissions if modified
      const stored = localStorage.getItem('usuario_sigae');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.rol === rolSeleccionado.nombre) {
          // Force reload or sync window object
          (window as any).location.reload();
        }
      }

      cargarRoles();
    } catch (e) {
      console.error(e);
      if (Swal) Swal.fire('Error', 'No se pudieron guardar los privilegios.', 'error');
    }
    setLoading(false);
  };

  const crearRol = () => {
    if (!Swal) return;

    Swal.fire({
      title: 'Nuevo Rol Global',
      input: 'text',
      inputPlaceholder: 'Nombre del Rol (Ej. Coordinador)',
      showCancelButton: true,
      confirmButtonText: 'Crear Rol',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0066FF',
      preConfirm: (valor: string) => {
        if (!valor || !valor.trim()) {
          Swal.showValidationMessage('El nombre es obligatorio');
          return false;
        }
        return valor.trim();
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase
            .from('roles')
            .insert([{ 
              nombre: result.value, 
              permisos: { lb: {}, sb: {} },
              id_escuela: 'global' 
            }]);

          if (error) throw error;

          Swal.fire('¡Rol Creado!', `El rol '${result.value}' ha sido creado exitosamente.`, 'success');
          auditar('Roles y Privilegios', 'Nuevo Rol', `Se creó el rol de acceso global: ${result.value}`);
          cargarRoles();
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo crear el rol.', 'error');
        }
        setLoading(false);
      }
    });
  };

  const eliminarRolActual = () => {
    if (!rolSeleccionado || !Swal) return;

    Swal.fire({
      title: `¿Eliminar Rol ${rolSeleccionado.nombre}?`,
      text: "Los usuarios con este rol perderán todos sus accesos de forma inmediata.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (res: any) => {
      if (res.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase
            .from('roles')
            .delete()
            .eq('nombre', rolSeleccionado.nombre);

          if (error) throw error;

          Swal.fire('¡Eliminado!', 'El rol ha sido eliminado permanentemente.', 'success');
          auditar('Roles y Privilegios', 'Eliminar Rol', `Se eliminó el rol: ${rolSeleccionado.nombre}`);
          setRolSeleccionado(null);
          cargarRoles();
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo eliminar el rol.', 'error');
        }
        setLoading(false);
      }
    });
  };

  if (permLoading || (loading && roles.length === 0)) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5 h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!tienePermiso('Roles y Privilegios', 'ver')) {
    return (
      <div className="col-12 text-center py-5 mt-4">
        <div className="bg-light d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm border" style={{ width: '100px', height: '100px' }}>
          <i className="bi bi-shield-lock-fill text-muted" style={{ fontSize: '3.5rem' }}></i>
        </div>
        <h4 className="text-dark fw-bold mb-2">Área Restringida</h4>
        <p className="text-muted mb-0">No tienes permisos asignados para visualizar este módulo.</p>
      </div>
    );
  }

  return (
    <div className="row g-4 container-fluid p-0 animate__animated animate__fadeIn">
      {/* Banner */}
      <div className="col-12 animate__animated animate__fadeInDown">
        <div 
          className="banner-modulo p-4 p-md-5 text-white shadow-sm" 
          style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #1e1b4b 100%)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
        >
          <div className="burbuja-3d burbuja-1" style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.15)', position: 'absolute', top: '-50px', right: '-20px', borderRadius: '50%' }}></div>
          <div className="burbuja-3d burbuja-2" style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.08)', position: 'absolute', bottom: '-20px', left: '20px', borderRadius: '50%' }}></div>
          <div className="row align-items-center position-relative z-1">
            <div className="col-12 text-center text-md-start">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <span className="badge bg-white text-info px-3 py-2 shadow-sm fw-bold" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>
                  <i className="bi bi-shield-lock-fill me-1"></i> SEGURIDAD Y ACCESOS
                </span>
                <button 
                  onClick={() => navigate('/categoria/Seguridad%20y%20Accesos')} 
                  className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                >
                  <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
                </button>
              </div>
              <h1 className="fw-bolder mb-2 text-white" style={{ fontSize: '2.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                <i className="bi bi-person-lines-fill me-3"></i>Roles y Privilegios
              </h1>
              <p className="mb-0 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Controla a qué pantallas del sistema tiene acceso cada rol.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 animate__animated animate__fadeInUp align-items-start mt-2">
        {/* Left Side List */}
        <div className="col-md-4 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center rounded-top-4">
              <h5 className="mb-0 fw-bold text-dark fs-6">Niveles de Acceso</h5>
              <button 
                className="btn btn-sm text-white fw-bold shadow-sm hover-efecto" 
                style={{ backgroundColor: '#0ea5e9' }}
                onClick={crearRol} 
                title="Nuevo Rol"
              >
                <i className="bi bi-plus-lg"></i>
              </button>
            </div>
            <div className="card-body p-0" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <div className="list-group list-group-flush p-2">
                {roles.length === 0 ? (
                  <div className="p-4 text-center text-muted">
                    No hay roles creados.
                  </div>
                ) : (
                  roles.map(r => {
                    const esActivo = rolSeleccionado && rolSeleccionado.nombre === r.nombre;
                    return (
                      <a 
                        key={r.nombre}
                        href="#" 
                        onClick={(e) => { e.preventDefault(); seleccionarRol(r); }}
                        className={`list-group-item list-group-item-action p-3 border d-flex align-items-center mb-2 rounded-3 hover-efecto ${esActivo ? 'bg-light border-primary' : 'border-transparent'}`}
                      >
                        <div className="bg-white shadow-sm p-2 rounded-circle me-3 border">
                          <i className="bi bi-person-badge text-primary fs-5"></i>
                        </div>
                        <div className="fw-bold text-dark">{r.nombre}</div>
                      </a>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Matrix */}
        <div className="col-md-8 col-xl-9">
          {rolSeleccionado ? (
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-bottom p-4 rounded-top-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <h4 className="mb-0 fw-bold text-dark">{rolSeleccionado.nombre}</h4>
                    <small className="text-muted">Activa o desactiva los submódulos a los que este rol puede acceder.</small>
                  </div>
                  <div>
                    <button 
                      className="btn btn-outline-danger btn-sm rounded-pill fw-bold px-3 shadow-sm" 
                      onClick={eliminarRolActual}
                    >
                      <i className="bi bi-trash3-fill me-1"></i>Borrar Rol
                    </button>
                    <button 
                      className="btn btn-primary btn-sm fw-bold px-4 rounded-pill shadow-sm hover-efecto ms-2" 
                      style={{ backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' }}
                      onClick={guardarPrivilegios}
                    >
                      <i className="bi bi-floppy-fill me-2"></i>Guardar Privilegios
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="card-body p-4 bg-light rounded-bottom-4">
                <div className="row g-4">
                  {/* UE Libertador Bolívar Panel */}
                  <div className="col-lg-6">
                    <div className="card border-0 shadow-sm rounded-4 h-100 border-top border-primary border-5">
                      <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center rounded-top-4">
                        <h6 className="mb-0 fw-bold text-primary"><i className="bi bi-building me-2"></i>UE Libertador Bolívar</h6>
                        <div className="form-check form-switch m-0">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="chk-marcar-todos-lb"
                            checked={isTodosMarcados('lb')}
                            onChange={(e) => handleToggleTodos('lb', e.target.checked)}
                            style={{ cursor: 'pointer' }}
                          />
                          <label className="form-check-label small fw-bold text-dark ms-1 mt-1" htmlFor="chk-marcar-todos-lb" style={{ cursor: 'pointer' }}>Otorgar Todo</label>
                        </div>
                      </div>
                      
                      <div className="card-body p-3 bg-light">
                        {/* Acceso plantel check */}
                        <div className="alert d-flex align-items-center justify-content-between mb-3 border border-2 border-white shadow-sm rounded-4 bg-light">
                          <div>
                            <h6 className="mb-0 fw-bold text-dark"><i className="bi bi-door-open-fill text-primary me-2"></i>Acceso al Plantel (Inicio)</h6>
                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>Permite ver esta escuela en la pantalla principal.</small>
                          </div>
                          <div className="form-check form-switch m-0 fs-5">
                            <input 
                              className="form-check-input" 
                              type="checkbox"
                              checked={!!permisosState.lb['__acceso_plantel__']}
                              onChange={() => handleCheckboxChange('lb', '__acceso_plantel__', false)}
                            />
                          </div>
                        </div>

                        {/* Módulos */}
                        {Object.entries(ESTRUCTURA_ACCESOS).map(([categoria, submods]) => (
                          <div key={categoria} className="card border-0 shadow-sm rounded-4 mb-3">
                            <div className="card-header text-white py-2 rounded-top-4 bg-primary">
                              <h6 className="mb-0 fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>
                                <i className="bi bi-folder-fill text-warning me-2"></i>{categoria}
                              </h6>
                            </div>
                            <div className="card-body p-2 bg-white rounded-bottom-4">
                              <div className="row g-2">
                                {Object.entries(submods).map(([subName, subcards]) => (
                                  <div key={subName} className="col-12">
                                    <div className="p-2 border rounded-2 border-light">
                                      <div className="d-flex justify-content-between align-items-center">
                                        <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                                          <i className="bi bi-box me-2 text-primary"></i>{subName}
                                        </div>
                                        <div className="form-check form-switch m-0">
                                          <input 
                                            className="form-check-input" 
                                            type="checkbox"
                                            checked={!!permisosState.lb[subName]}
                                            onChange={() => handleCheckboxChange('lb', subName, true, undefined, subcards)}
                                          />
                                        </div>
                                      </div>

                                      {subcards.length > 0 && (
                                        <div className="row g-1 mt-2 ps-3 border-start ms-1 border-primary border-opacity-25 animate__animated animate__fadeIn">
                                          {subcards.map(card => (
                                            <div key={card} className="col-12">
                                              <div className="d-flex justify-content-between align-items-center bg-light p-1 rounded">
                                                <span className="small fw-bold text-muted text-truncate" style={{ fontSize: '0.75rem' }} title={card}>
                                                  <i className="bi bi-window-stack me-1 text-secondary"></i>
                                                  {card.replace('Tarjeta: ', '').replace('Función: ', '').replace('Diccionario: ', '')}
                                                </span>
                                                <div className="form-check form-switch m-0">
                                                  <input 
                                                    className="form-check-input" 
                                                    type="checkbox"
                                                    checked={!!permisosState.lb[card]}
                                                    onChange={() => handleCheckboxChange('lb', card, false, subName)}
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* UE Santa Bárbara Panel */}
                  <div className="col-lg-6">
                    <div className="card border-0 shadow-sm rounded-4 h-100 border-top border-success border-5">
                      <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center rounded-top-4">
                        <h6 className="mb-0 fw-bold text-success"><i className="bi bi-building me-2"></i>UE Santa Bárbara</h6>
                        <div className="form-check form-switch m-0">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="chk-marcar-todos-sb"
                            checked={isTodosMarcados('sb')}
                            onChange={(e) => handleToggleTodos('sb', e.target.checked)}
                            style={{ cursor: 'pointer' }}
                          />
                          <label className="form-check-label small fw-bold text-dark ms-1 mt-1" htmlFor="chk-marcar-todos-sb" style={{ cursor: 'pointer' }}>Otorgar Todo</label>
                        </div>
                      </div>
                      
                      <div className="card-body p-3 bg-light">
                        {/* Acceso plantel check */}
                        <div className="alert d-flex align-items-center justify-content-between mb-3 border border-2 border-white shadow-sm rounded-4 bg-light">
                          <div>
                            <h6 className="mb-0 fw-bold text-dark"><i className="bi bi-door-open-fill text-success me-2"></i>Acceso al Plantel (Inicio)</h6>
                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>Permite ver esta escuela en la pantalla principal.</small>
                          </div>
                          <div className="form-check form-switch m-0 fs-5">
                            <input 
                              className="form-check-input" 
                              type="checkbox"
                              checked={!!permisosState.sb['__acceso_plantel__']}
                              onChange={() => handleCheckboxChange('sb', '__acceso_plantel__', false)}
                            />
                          </div>
                        </div>

                        {/* Módulos */}
                        {Object.entries(ESTRUCTURA_ACCESOS).map(([categoria, submods]) => (
                          <div key={categoria} className="card border-0 shadow-sm rounded-4 mb-3">
                            <div className="card-header text-white py-2 rounded-top-4 bg-success">
                              <h6 className="mb-0 fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>
                                <i className="bi bi-folder-fill text-warning me-2"></i>{categoria}
                              </h6>
                            </div>
                            <div className="card-body p-2 bg-white rounded-bottom-4">
                              <div className="row g-2">
                                {Object.entries(submods).map(([subName, subcards]) => (
                                  <div key={subName} className="col-12">
                                    <div className="p-2 border rounded-2 border-light">
                                      <div className="d-flex justify-content-between align-items-center">
                                        <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                                          <i className="bi bi-box me-2 text-success"></i>{subName}
                                        </div>
                                        <div className="form-check form-switch m-0">
                                          <input 
                                            className="form-check-input" 
                                            type="checkbox"
                                            checked={!!permisosState.sb[subName]}
                                            onChange={() => handleCheckboxChange('sb', subName, true, undefined, subcards)}
                                          />
                                        </div>
                                      </div>

                                      {subcards.length > 0 && (
                                        <div className="row g-1 mt-2 ps-3 border-start ms-1 border-success border-opacity-25 animate__animated animate__fadeIn">
                                          {subcards.map(card => (
                                            <div key={card} className="col-12">
                                              <div className="d-flex justify-content-between align-items-center bg-light p-1 rounded">
                                                <span className="small fw-bold text-muted text-truncate" style={{ fontSize: '0.75rem' }} title={card}>
                                                  <i className="bi bi-window-stack me-1 text-secondary"></i>
                                                  {card.replace('Tarjeta: ', '').replace('Función: ', '').replace('Diccionario: ', '')}
                                                </span>
                                                <div className="form-check form-switch m-0">
                                                  <input 
                                                    className="form-check-input" 
                                                    type="checkbox"
                                                    checked={!!permisosState.sb[card]}
                                                    onChange={() => handleCheckboxChange('sb', card, false, subName)}
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div id="panel-vacio-roles" className="panel-vacio-moderno d-flex flex-column align-items-center justify-content-center text-center animate__animated animate__fadeIn bg-white p-5 rounded-4 shadow-sm" style={{ minHeight: '350px' }}>
              <div className="bg-light p-4 rounded-circle shadow-sm mb-4 d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                <i className="bi bi-shield-lock-fill text-primary" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <h4 className="fw-bold text-dark mb-2">Área de Privilegios</h4>
              <p className="text-muted mx-auto" style={{ maxWidth: '400px' }}>
                Seleccione un rol del panel lateral para configurar detalladamente sus accesos al sistema.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
