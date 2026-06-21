import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';

interface Espacio {
  id: string;
  nombre: string;
  tipo: string;
  capacidad: number;
  id_escuela: string;
  nombre_escuela: string;
  capacidad_ocupada: number;
}

export const EspaciosEscolares = () => {
  const navigate = useNavigate();
  const { tienePermisoEnEscuela, loading: permLoading } = usePermisos();

  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [idEscuelaForm, setIdEscuelaForm] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 7;

  const Swal = (window as any).Swal;

  const hasAccessSB = tienePermisoEnEscuela('sb', 'Espacios Escolares', 'ver');
  const hasAccessLB = tienePermisoEnEscuela('lb', 'Espacios Escolares', 'ver');
  const escuelasAutorizadas = [
    ...(hasAccessSB ? ['sb'] : []),
    ...(hasAccessLB ? ['lb'] : [])
  ];

  const canCreateSB = tienePermisoEnEscuela('sb', 'Espacios Escolares', 'crear');
  const canCreateLB = tienePermisoEnEscuela('lb', 'Espacios Escolares', 'crear');
  const escuelasConCrear = [
    ...(canCreateSB ? ['sb'] : []),
    ...(canCreateLB ? ['lb'] : [])
  ];
  const puedeCrearAlguna = escuelasConCrear.length > 0;

  // Initialize form school selection once permissions are loaded
  useEffect(() => {
    if (!permLoading && puedeCrearAlguna) {
      if (escuelasConCrear.length === 1) {
        setIdEscuelaForm(escuelasConCrear[0]);
      }
    }
  }, [permLoading, puedeCrearAlguna]);

  useEffect(() => {
    if (!permLoading && escuelasAutorizadas.length > 0) {
      cargarEspacios();
    }
  }, [permLoading]);

  const cargarEspacios = async () => {
    setLoading(true);
    try {
      let query = supabase.from('espacios').select('*');

      // Filter query based on authorized schools
      if (escuelasAutorizadas.length === 1) {
        query = query.eq('id_escuela', escuelasAutorizadas[0]);
      } else if (escuelasAutorizadas.length === 0) {
        query = query.eq('id_escuela', 'ninguna');
      }

      const { data, error } = await query
        .order('tipo', { ascending: true })
        .order('nombre', { ascending: true });

      if (error) throw error;
      setEspacios(data || []);
    } catch (e: any) {
      console.error(e);
      if (e.code === 'PGRST205' || (e.message && e.message.includes('Could not find the table'))) {
        if (Swal) {
          Swal.fire({
            title: 'Tabla No Encontrada',
            html: `La tabla <code>espacios</code> no existe en el esquema de su base de datos Supabase.<br><br>Por favor, ejecute la consulta SQL provista en el panel de Supabase para crearla.`,
            icon: 'warning',
            confirmButtonColor: '#0dcaf0'
          });
        }
      } else {
        if (Swal) Swal.fire('Error', 'No se pudieron cargar los espacios desde Supabase.', 'error');
      }
    }
    setLoading(false);
  };

  if (permLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5 h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (escuelasAutorizadas.length === 0) {
    return (
      <div className="col-12 text-center py-5 mt-4">
        <div className="bg-light d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm border" style={{ width: '100px', height: '100px' }}>
          <i className="bi bi-shield-lock-fill text-muted" style={{ fontSize: '3.5rem' }}></i>
        </div>
        <h4 className="text-dark fw-bold mb-2">Área Restringida</h4>
        <p className="text-muted mb-0">No tienes permisos asignados para visualizar los espacios escolares en ningún plantel.</p>
      </div>
    );
  }

  // Filter local spaces array
  const espaciosFiltrados = espacios.filter(e => 
    (e.nombre || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (e.tipo || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPaginas = Math.ceil(espaciosFiltrados.length / itemsPorPagina) || 1;
  const indexInicio = (paginaActual - 1) * itemsPorPagina;
  const espaciosPaginados = espaciosFiltrados.slice(indexInicio, indexInicio + itemsPorPagina);

  const cambiarPagina = (pag: number) => {
    if (pag >= 1 && pag <= totalPaginas) {
      setPaginaActual(pag);
    }
  };

  // Capacity calculations
  const capTotalGlobal = espacios.reduce((sum, e) => sum + (Number(e.capacidad) || 0), 0);
  const capTotalSB = espacios.filter(e => e.id_escuela === 'sb').reduce((sum, e) => sum + (Number(e.capacidad) || 0), 0);
  const capTotalLB = espacios.filter(e => e.id_escuela === 'lb').reduce((sum, e) => sum + (Number(e.capacidad) || 0), 0);

  const handleCancelarEdicion = () => {
    setEditandoId(null);
    setNombre('');
    setTipo('');
    setCapacidad('');
    if (escuelasConCrear.length === 1) {
      setIdEscuelaForm(escuelasConCrear[0]);
    } else {
      setIdEscuelaForm('');
    }
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();

    let escuelaTarget = idEscuelaForm;
    if (escuelasConCrear.length === 1) {
      escuelaTarget = escuelasConCrear[0];
    }

    if (!escuelaTarget) {
      if (Swal) Swal.fire('Aviso', 'Debe seleccionar la escuela correspondiente.', 'warning');
      return;
    }

    if (!tienePermisoEnEscuela(escuelaTarget, 'Espacios Escolares', 'crear')) {
      if (Swal) Swal.fire('Error', 'No posee privilegios para registrar espacios en este plantel.', 'error');
      return;
    }

    if (!nombre.trim() || !tipo) {
      if (Swal) Swal.fire('Aviso', 'Debe ingresar el nombre y seleccionar el tipo.', 'warning');
      return;
    }

    if (Swal) {
      Swal.fire({
        title: 'Guardando Espacio',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
    }

    try {
      const payload = {
        nombre: nombre.trim(),
        tipo: tipo,
        capacidad: parseInt(capacidad) || 0,
        id_escuela: escuelaTarget
      };

      let errorGuardado;
      let accionRegistro = 'Añadir Espacio';

      if (editandoId) {
        const { error } = await supabase.from('espacios').update(payload).eq('id', editandoId);
        errorGuardado = error;
        accionRegistro = 'Editar Espacio';
      } else {
        const payloadInsert = {
          ...payload,
          id: 'ESP-' + new Date().getTime()
        };
        const { error } = await supabase.from('espacios').insert([payloadInsert]);
        errorGuardado = error;
      }

      if (Swal) Swal.close();
      if (errorGuardado) throw errorGuardado;

      if (Swal) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Guardado exitosamente',
          timer: 2000,
          showConfirmButton: false
        });
      }

      auditar('Espacios Escolares', accionRegistro, `Se guardó el espacio: ${payload.nombre} (${payload.tipo}) con capacidad para ${payload.capacidad} pax en el plantel ${payload.id_escuela.toUpperCase()}.`);
      
      handleCancelarEdicion();
      cargarEspacios();
    } catch (err) {
      if (Swal) {
        Swal.close();
        Swal.fire('Error', 'Falla al guardar en la base de datos.', 'error');
      }
    }
  };

  const handleEditar = (e: Espacio) => {
    setEditandoId(e.id);
    setNombre(e.nombre);
    setTipo(e.tipo);
    setCapacidad(String(e.capacidad || ''));
    setIdEscuelaForm(e.id_escuela);
  };

  const handleEliminar = (e: Espacio) => {
    if (!tienePermisoEnEscuela(e.id_escuela, 'Espacios Escolares', 'eliminar')) {
      if (Swal) Swal.fire('Error', 'No posee privilegios de eliminación en este plantel.', 'error');
      return;
    }

    if (!Swal) return;

    Swal.fire({
      title: '¿Eliminar este ambiente?',
      text: `Se eliminará permanentemente el espacio "${e.nombre}" del sistema.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Eliminando...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        try {
          const { error } = await supabase.from('espacios').delete().eq('id', e.id);
          Swal.close();
          if (error) throw error;

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Eliminado correctamente',
            timer: 2000,
            showConfirmButton: false
          });

          auditar('Espacios Escolares', 'Eliminar Espacio', `Se eliminó el espacio: ${e.nombre}`);
          cargarEspacios();
        } catch (err) {
          Swal.close();
          Swal.fire('Error', 'No se pudo eliminar el registro.', 'error');
        }
      }
    });
  };

  return (
    <div className="modulo-animado container-fluid p-0">
      <div className="row mb-4 animate__animated animate__fadeInDown">
        <div className="col-12">
          <div 
            className="banner-modulo p-4 p-md-5 text-white shadow-sm" 
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
          >
            <div className="burbuja-3d burbuja-1"></div>
            <div className="burbuja-3d burbuja-2"></div>
            <div className="burbuja-3d burbuja-3"></div>
            <div className="row align-items-center position-relative z-1">
              <div className="col-12 text-center text-md-start mb-3 mb-md-0">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <span className="badge bg-white px-3 py-2 shadow-sm fw-bold text-dark" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>
                  <i className="bi bi-door-open me-1"></i> DIRECCIÓN Y SISTEMA
                </span>
                <button 
                  onClick={() => navigate('/categoria/Direcci%C3%B3n%20y%20Sistema')} 
                  className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                >
                  <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
                </button>
              </div>
                <h1 className="fw-bolder mb-2 text-white" style={{ fontSize: '2.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  <i className="bi bi-door-open me-3"></i>Espacios y Ambientes
                </h1>
                <p className="mb-0 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Gestión de infraestructura y capacidad instalada.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Capacities summary cards */}
      <div className="row g-3 mb-4 animate__animated animate__fadeInDown">
        <div className="col-12 col-md-4">
          <div className="card p-3 border-0 shadow-sm rounded-4 text-white h-100" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}>
            <div className="d-flex justify-content-between align-items-center h-100">
              <div>
                <span className="small fw-bold opacity-75">Capacidad Total Instalada</span>
                <h3 className="fw-bold m-0 mt-1">{capTotalGlobal}</h3>
              </div>
              <i className="bi bi-building fs-1 opacity-50"></i>
            </div>
          </div>
        </div>
        {hasAccessSB && (
          <div className="col-12 col-md-4">
            <div className="card p-3 border-0 shadow-sm rounded-4 text-dark bg-white border-start border-4 border-info h-100">
              <div className="d-flex justify-content-between align-items-center h-100">
                <div>
                  <span className="small fw-bold text-muted">U.E. Santa Bárbara</span>
                  <h3 className="fw-bold m-0 mt-1 text-info">{capTotalSB}</h3>
                </div>
                <i className="bi bi-mortarboard-fill fs-1 text-info opacity-25"></i>
              </div>
            </div>
          </div>
        )}
        {hasAccessLB && (
          <div className="col-12 col-md-4">
            <div className="card p-3 border-0 shadow-sm rounded-4 text-dark bg-white border-start border-4 border-primary h-100">
              <div className="d-flex justify-content-between align-items-center h-100">
                <div>
                  <span className="small fw-bold text-muted">U.E. Libertador Bolívar</span>
                  <h3 className="fw-bold m-0 mt-1 text-primary">{capTotalLB}</h3>
                </div>
                <i className="bi bi-book-fill fs-1 text-primary opacity-25"></i>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="row g-4 animate__animated animate__fadeInUp">
        {puedeCrearAlguna && (
          <div className="col-12 col-xl-4">
            <div className="card p-4 bg-white shadow-sm border-0 h-100">
              <h5 className="fw-bold text-dark mb-4 border-bottom pb-3">
                <i className="bi bi-plus-square-fill text-info me-2"></i>
                <span>{editandoId ? 'Editar Espacio' : 'Registrar Espacio'}</span>
              </h5>
              <form onSubmit={handleGuardar} className="row g-3">
                <div className="col-12">
                  <label className="fw-bold text-muted small mb-2">Nombre o Identificador <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    className="form-control input-moderno fw-bold border-info" 
                    placeholder="Ej: Aula 1er Grado A"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>
                <div className="col-12">
                  <label className="fw-bold text-muted small mb-2">Tipo de Ambiente <span className="text-danger">*</span></label>
                  <select 
                    className="form-select input-moderno bg-light fw-bold text-dark border-info"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                  >
                    <option value="">Seleccione...</option>
                    <option value="Aula Clásica">Aula Clásica</option>
                    <option value="Laboratorio">Laboratorio Especializado</option>
                    <option value="Cancha / Área Deportiva">Cancha / Área Deportiva</option>
                    <option value="Auditorio / Usos Múltiples">Auditorio / Usos Múltiples</option>
                    <option value="Oficina Administrativa">Oficina Administrativa</option>
                    <option value="Baños">Baños</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="fw-bold text-muted small mb-2">Capacidad (Personas)</label>
                  <input 
                    type="number" 
                    className="form-control input-moderno border-info" 
                    placeholder="Ej: 35"
                    value={capacidad}
                    onChange={(e) => setCapacidad(e.target.value)}
                  />
                </div>
                {escuelasConCrear.length > 1 && (
                  <div className="col-12">
                    <label className="fw-bold text-muted small mb-2">Escuela / Plantel <span className="text-danger">*</span></label>
                    <select 
                      className="form-select input-moderno bg-light fw-bold text-dark border-info"
                      value={idEscuelaForm}
                      onChange={(e) => setIdEscuelaForm(e.target.value)}
                    >
                      <option value="">Seleccione...</option>
                      {escuelasConCrear.includes('sb') && <option value="sb">U.E. Santa Bárbara</option>}
                      {escuelasConCrear.includes('lb') && <option value="lb">U.E. Libertador Bolívar</option>}
                    </select>
                  </div>
                )}
                <div className="col-12 pt-3">
                  <button type="submit" className="btn btn-info text-white px-4 shadow-sm fw-bold w-100 mb-2 hover-efecto rounded-pill">
                    <i className="bi bi-save-fill me-2"></i>{editandoId ? 'Actualizar Espacio' : 'Guardar Espacio'}
                  </button>
                  {editandoId && (
                    <button 
                      type="button" 
                      className="btn btn-light border text-danger fw-bold w-100 rounded-pill hover-efecto"
                      onClick={handleCancelarEdicion}
                    >
                      Cancelar Edición
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        <div className={puedeCrearAlguna ? 'col-12 col-xl-8' : 'col-12'}>
          <div className="card bg-white shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
              <h5 className="fw-bold text-dark m-0"><i className="bi bi-list-columns-reverse text-info me-2"></i>Directorio de Ambientes</h5>
              <input 
                type="text" 
                className="input-moderno form-control border-info w-auto" 
                placeholder="Buscar espacio o tipo..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPaginaActual(1); }}
                style={{ maxWidth: '250px' }}
              />
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="d-flex justify-content-center align-items-center py-5">
                  <div className="spinner-border text-info" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              ) : (
                <div className="table-responsive border-bottom-0 rounded-bottom-0">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light text-muted small">
                      <tr>
                        <th className="ps-4 py-3" style={{ width: '20%' }}>Escuela</th>
                        <th className="py-3" style={{ width: '20%' }}>Tipo</th>
                        <th className="py-3">Nombre / Identificador</th>
                        <th className="py-3 text-center" style={{ width: '15%' }}>Capacidad</th>
                        <th className="py-3 text-end pe-4" style={{ width: '15%' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {espaciosPaginados.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-5 text-muted">
                            <i className="bi bi-building-slash fs-1 text-muted d-block mb-3"></i>
                            <span className="text-muted fw-bold">No se encontraron espacios.</span>
                          </td>
                        </tr>
                      ) : (
                        espaciosPaginados.map(e => {
                          const colorBadge = e.tipo.includes('Aula') ? 'primary' : (e.tipo.includes('Laboratorio') ? 'success' : (e.tipo.includes('Cancha') ? 'danger' : 'secondary'));
                          
                          let badgeEscuela = '';
                          if (e.id_escuela === 'sb') {
                            badgeEscuela = 'Santa Bárbara';
                          } else if (e.id_escuela === 'lb') {
                            badgeEscuela = 'Libertador Bolívar';
                          } else {
                            badgeEscuela = 'Global';
                          }

                          const pCrearEsp = tienePermisoEnEscuela(e.id_escuela, 'Espacios Escolares', 'crear');
                          const pElimEsp = tienePermisoEnEscuela(e.id_escuela, 'Espacios Escolares', 'eliminar');

                          return (
                            <tr key={e.id} className="hover-efecto">
                              <td className="ps-4 align-middle">
                                <span className={`badge ${e.id_escuela === 'sb' ? 'bg-info bg-opacity-10 text-info border border-info' : 'bg-primary bg-opacity-10 text-primary border border-primary'} px-2 py-1 shadow-sm`}>
                                  <i className={`bi ${e.id_escuela === 'sb' ? 'bi-mortarboard-fill' : 'bi-book-fill'} me-1`}></i>
                                  {badgeEscuela}
                                </span>
                              </td>
                              <td className="align-middle">
                                <span className={`badge bg-${colorBadge} bg-opacity-10 text-${colorBadge} border border-${colorBadge} px-2 py-1 shadow-sm`}>
                                  {e.tipo}
                                </span>
                              </td>
                              <td className="align-middle fw-bold text-dark fs-6">{e.nombre}</td>
                              <td className="align-middle text-center">
                                <span className="badge bg-light text-dark border">
                                  <i className="bi bi-people-fill me-1 text-info"></i> {e.capacidad || 0} pax
                                </span>
                              </td>
                              <td className="text-end pe-4 align-middle text-nowrap">
                                {pCrearEsp && (
                                  <button 
                                    className="btn btn-sm btn-light border text-primary me-1 shadow-sm" 
                                    onClick={() => handleEditar(e)}
                                    title="Editar"
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                )}
                                {pElimEsp && (
                                  <button 
                                    className="btn btn-sm btn-light border text-danger shadow-sm" 
                                    onClick={() => handleEliminar(e)}
                                    title="Eliminar"
                                  >
                                    <i className="bi bi-trash"></i>
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
              )}
            </div>
            <div className="card-footer bg-white border-top p-3 d-flex justify-content-center">
              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item ${paginaActual === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => cambiarPagina(paginaActual - 1)}>
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
                    <li key={p} className={`page-item ${paginaActual === p ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => cambiarPagina(p)}>{p}</button>
                    </li>
                  ))}
                  <li className={`page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => cambiarPagina(paginaActual + 1)}>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
