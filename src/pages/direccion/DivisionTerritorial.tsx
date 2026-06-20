import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';

interface DivisionRecord {
  id: number;
  estado: string;
  municipio: string;
  parroquia: string;
}

export const DivisionTerritorial = () => {
  const navigate = useNavigate();
  const { tienePermiso, user, loading: permLoading } = usePermisos();
  const Swal = (window as any).Swal;

  const [records, setRecords] = useState<DivisionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Selections
  const [estadoSel, setEstadoSel] = useState<string | null>(null);
  const [municipioSel, setMunicipioSel] = useState<string | null>(null);

  const esAdmin = user?.rol && user.rol.toLowerCase().includes('administrador');
  const hasVer = esAdmin || tienePermiso('División Territorial', 'ver');
  const hasCrear = esAdmin || tienePermiso('División Territorial', 'crear');
  const hasEliminar = esAdmin || tienePermiso('División Territorial', 'eliminar');

  const isModuleRestricted = !permLoading && !hasVer;

  useEffect(() => {
    if (!permLoading && hasVer) {
      cargarDatos();
    }
  }, [permLoading]);

  const cargarDatos = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('div_pol_vzla')
        .select('*')
        .order('estado', { ascending: true })
        .order('municipio', { ascending: true })
        .order('parroquia', { ascending: true });

      if (error) throw error;
      setRecords(data || []);
    } catch (e) {
      console.error(e);
      if (Swal) Swal.fire('Error', 'No se pudo conectar con la base de datos de divisiones territoriales.', 'error');
    }
    if (!silencioso) setLoading(false);
  };

  // Helper arrays derived from records state
  const estadosUnicos = [...new Set(records.map(r => r.estado))].sort();

  const municipiosFiltrados = estadoSel
    ? [...new Set(records
        .filter(r => r.estado === estadoSel)
        .map(r => r.municipio))]
        .filter(m => m !== 'Sin Municipio' && m !== 'N/A')
        .sort()
    : [];

  const parroquiasFiltradas = (estadoSel && municipioSel)
    ? records
        .filter(r => r.estado === estadoSel && r.municipio === municipioSel)
        .map(r => ({ id: r.id, valor: r.parroquia }))
        .filter(p => p.valor !== 'Sin Parroquia' && p.valor !== 'N/A')
        .sort((a, b) => a.valor.localeCompare(b.valor))
    : [];

  const seleccionarEstado = (estado: string) => {
    setEstadoSel(estado);
    setMunicipioSel(null);
  };

  const seleccionarMunicipio = (muni: string) => {
    setMunicipioSel(muni);
  };

  const nuevoEstado = () => {
    if (!hasCrear) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para añadir estados.', 'error');
      return;
    }
    if (!Swal) return;

    Swal.fire({
      title: 'Añadir Estado',
      html: `<input type="text" id="swal-estado" class="swal2-input input-moderno m-0 w-100" placeholder="Nombre del Estado (ej: Monagas)">`,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      confirmButtonColor: '#0f172a',
      preConfirm: () => {
        const valor = (document.getElementById('swal-estado') as HTMLInputElement).value.trim();
        if (!valor) {
          Swal.showValidationMessage('El nombre del Estado es obligatorio');
          return false;
        }
        return valor;
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        const existe = records.find(r => r.estado.toLowerCase() === result.value.toLowerCase());
        if (existe) {
          Swal.fire('Atención', 'Este estado ya existe en el sistema.', 'warning');
          return;
        }

        setLoading(true);
        try {
          const payload = {
            estado: result.value,
            municipio: 'Sin Municipio',
            parroquia: 'Sin Parroquia'
          };
          const { error } = await supabase.from('div_pol_vzla').insert([payload]);
          if (error) throw error;

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Estado creado exitosamente', showConfirmButton: false, timer: 1500 });
          auditar('División Territorial', 'Nuevo Estado', `Se añadió el Estado "${result.value}".`);
          await cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla en base de datos al guardar.', 'error');
        }
        setLoading(false);
      }
    });
  };

  const nuevoMunicipio = () => {
    if (!estadoSel) return;
    if (!hasCrear) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para añadir municipios.', 'error');
      return;
    }
    if (!Swal) return;

    Swal.fire({
      title: `Añadir Municipio a ${estadoSel}`,
      html: `<input type="text" id="swal-muni" class="swal2-input input-moderno m-0 w-100" placeholder="Nombre del Municipio (ej: Maturín)">`,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      confirmButtonColor: '#1e293b',
      preConfirm: () => {
        const valor = (document.getElementById('swal-muni') as HTMLInputElement).value.trim();
        if (!valor) {
          Swal.showValidationMessage('El nombre del Municipio es obligatorio');
          return false;
        }
        return valor;
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        const existe = records.find(r => r.estado === estadoSel && r.municipio.toLowerCase() === result.value.toLowerCase());
        if (existe) {
          Swal.fire('Atención', 'Este municipio ya existe en el estado seleccionado.', 'warning');
          return;
        }

        setLoading(true);
        try {
          const payload = {
            estado: estadoSel,
            municipio: result.value,
            parroquia: 'Sin Parroquia'
          };
          const { error } = await supabase.from('div_pol_vzla').insert([payload]);
          if (error) throw error;

          // Borrar comodines 'Sin Municipio' para este estado
          await supabase.from('div_pol_vzla')
            .delete()
            .eq('estado', estadoSel)
            .eq('municipio', 'Sin Municipio');

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Municipio creado', showConfirmButton: false, timer: 1500 });
          auditar('División Territorial', 'Nuevo Municipio', `Se añadió el Municipio "${result.value}" al Estado ${estadoSel}.`);
          await cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla en base de datos al guardar.', 'error');
        }
        setLoading(false);
      }
    });
  };

  const nuevaParroquia = () => {
    if (!estadoSel || !municipioSel) return;
    if (!hasCrear) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para añadir parroquias.', 'error');
      return;
    }
    if (!Swal) return;

    Swal.fire({
      title: `Añadir Parroquia`,
      html: `
        <div class="text-start">
          <p class="small text-muted mb-2">Se creará en: <strong>${estadoSel} &gt; ${municipioSel}</strong></p>
          <input type="text" id="swal-parr" class="swal2-input input-moderno m-0 w-100" placeholder="Nombre de la Parroquia (ej: Las Cocuizas)">
        </div>`,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      confirmButtonColor: '#334155',
      preConfirm: () => {
        const valor = (document.getElementById('swal-parr') as HTMLInputElement).value.trim();
        if (!valor) {
          Swal.showValidationMessage('El nombre de la Parroquia es obligatorio');
          return false;
        }
        return valor;
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        const existe = records.find(r => r.estado === estadoSel && r.municipio === municipioSel && r.parroquia.toLowerCase() === result.value.toLowerCase());
        if (existe) {
          Swal.fire('Atención', 'Esta parroquia ya existe en el municipio seleccionado.', 'warning');
          return;
        }

        setLoading(true);
        try {
          const payload = {
            estado: estadoSel,
            municipio: municipioSel,
            parroquia: result.value
          };
          const { error } = await supabase.from('div_pol_vzla').insert([payload]);
          if (error) throw error;

          // Borrar comodines 'Sin Parroquia' para este estado y municipio
          await supabase.from('div_pol_vzla')
            .delete()
            .eq('estado', estadoSel)
            .eq('municipio', municipioSel)
            .eq('parroquia', 'Sin Parroquia');

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Parroquia creada', showConfirmButton: false, timer: 1500 });
          auditar('División Territorial', 'Nueva Parroquia', `Se añadió la Parroquia "${result.value}" a ${estadoSel} &gt; ${municipioSel}.`);
          await cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla en base de datos al guardar.', 'error');
        }
        setLoading(false);
      }
    });
  };

  const eliminarEstado = (nombre: string) => {
    if (!hasEliminar) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para eliminar estados.', 'error');
      return;
    }
    if (!Swal) return;

    Swal.fire({
      title: '¿Eliminar Estado?',
      text: `Se borrará el Estado "${nombre}", todos sus municipios y parroquias asociadas de forma permanente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, borrar todo',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase.from('div_pol_vzla').delete().eq('estado', nombre);
          if (error) throw error;

          if (estadoSel === nombre) {
            setEstadoSel(null);
            setMunicipioSel(null);
          }

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Estado eliminado', showConfirmButton: false, timer: 1500 });
          auditar('División Territorial', 'Eliminar Estado', `Se eliminó el Estado "${nombre}" con su respectiva geografía.`);
          await cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla al eliminar el estado.', 'error');
        }
        setLoading(false);
      }
    });
  };

  const eliminarMunicipio = (nombre: string) => {
    if (!estadoSel) return;
    if (!hasEliminar) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para eliminar municipios.', 'error');
      return;
    }
    if (!Swal) return;

    Swal.fire({
      title: '¿Eliminar Municipio?',
      text: `Se borrará "${nombre}" y todas las parroquias contenidas en él de forma permanente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar todo',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase
            .from('div_pol_vzla')
            .delete()
            .eq('estado', estadoSel)
            .eq('municipio', nombre);

          if (error) throw error;

          // Comprobar si quedaban municipios en el estado
          const restantes = records.filter(r => r.estado === estadoSel && r.municipio !== nombre);
          if (restantes.length === 0) {
            // Insertar comodín
            await supabase.from('div_pol_vzla').insert([{
              estado: estadoSel,
              municipio: 'Sin Municipio',
              parroquia: 'Sin Parroquia'
            }]);
          }

          if (municipioSel === nombre) {
            setMunicipioSel(null);
          }

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Municipio eliminado', showConfirmButton: false, timer: 1500 });
          auditar('División Territorial', 'Eliminar Municipio', `Se eliminó el Municipio "${nombre}" y sus parroquias en el Estado ${estadoSel}.`);
          await cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla al eliminar el municipio.', 'error');
        }
        setLoading(false);
      }
    });
  };

  const eliminarParroquia = (id: number, nombre: string) => {
    if (!estadoSel || !municipioSel) return;
    if (!hasEliminar) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para eliminar parroquias.', 'error');
      return;
    }
    if (!Swal) return;

    Swal.fire({
      title: '¿Eliminar Parroquia?',
      text: `Se borrará "${nombre}" permanentemente del sistema.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase.from('div_pol_vzla').delete().eq('id', id);
          if (error) throw error;

          // Comprobar si quedaban parroquias
          const restantes = records.filter(r => r.estado === estadoSel && r.municipio === municipioSel && r.id !== id);
          if (restantes.length === 0) {
            await supabase.from('div_pol_vzla').insert([{
              estado: estadoSel,
              municipio: municipioSel,
              parroquia: 'Sin Parroquia'
            }]);
          }

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Parroquia eliminada', showConfirmButton: false, timer: 1500 });
          auditar('División Territorial', 'Eliminar Parroquia', `Se eliminó la Parroquia "${nombre}" de ${estadoSel} &gt; ${municipioSel}.`);
          await cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla al eliminar la parroquia.', 'error');
        }
        setLoading(false);
      }
    });
  };

  if (permLoading || (loading && records.length === 0)) {
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
        <p className="text-muted mb-0">No tienes permisos asignados para acceder a la división territorial.</p>
      </div>
    );
  }

  return (
    <div className="modulo-animado">
      {/* Banner */}
      <div className="row mb-4 animate__animated animate__fadeInDown">
        <div className="col-12">
          <div 
            className="banner-modulo p-4 p-md-5 text-white shadow-sm" 
            style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
          >
            <div className="burbuja-3d burbuja-1"></div>
            <div className="burbuja-3d burbuja-2"></div>
            <div className="row align-items-center position-relative z-1">
              <div className="col-12 text-center text-md-start mb-3 mb-md-0">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <span className="badge bg-white px-3 py-2 shadow-sm fw-bold" style={{ color: '#0f172a', letterSpacing: '1px', fontSize: '0.85rem' }}>
                    <i className="bi bi-geo-alt-fill me-1"></i> GEOGRAFÍA NACIONAL
                  </span>
                  <button 
                    onClick={() => navigate('/categoria/Direcci%C3%B3n%20y%20Sistema')} 
                    className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                  >
                    <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
                  </button>
                </div>
                <h1 className="fw-bolder mb-2 text-white" style={{ fontSize: '2.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  <i className="bi bi-geo-alt-fill me-3"></i>División Territorial
                </h1>
                <p className="mb-0 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Gestión jerárquica de Estados, Municipios y Parroquias de Venezuela.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 animate__animated animate__fadeInUp">
        {/* Column: Estados */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100" style={{ borderTop: '5px solid #0f172a' }}>
            <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center rounded-top-4">
              <h6 className="mb-0 fw-bold text-dark"><i className="bi bi-map-fill me-2 text-secondary"></i>Estados</h6>
              {hasCrear && (
                <button className="btn btn-sm text-white fw-bold shadow-sm hover-efecto" style={{ background: '#0f172a' }} onClick={nuevoEstado}>
                  <i className="bi bi-plus-lg"></i>
                </button>
              )}
            </div>
            <div className="card-body p-0" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {estadosUnicos.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  <i className="bi bi-inbox fs-2"></i>
                  <p className="mb-0 small fw-bold mt-2">No hay estados</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {estadosUnicos.map(est => {
                    const activeClass = (estadoSel === est) ? 'active bg-primary text-white' : 'text-dark bg-white';
                    const iconColor = (estadoSel === est) ? 'text-white' : 'text-primary';
                    const btnTrashColor = (estadoSel === est) ? 'btn-primary text-white border-white' : 'btn-light text-danger border';

                    return (
                      <div 
                        key={est} 
                        className={`list-group-item p-3 border-0 border-bottom d-flex justify-content-between align-items-center hover-efecto cursor-pointer ${activeClass}`} 
                        onClick={() => seleccionarEstado(est)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="fw-bold d-flex align-items-center gap-2">
                          <i className={`bi bi-map-fill ${iconColor}`}></i> {est}
                        </div>
                        {hasEliminar && (
                          <div>
                            <button 
                              className={`btn btn-sm ${btnTrashColor} rounded-circle shadow-sm hover-efecto`} 
                              onClick={(e) => { e.stopPropagation(); eliminarEstado(est); }} 
                              title="Eliminar Estado"
                            >
                              <i className="bi bi-trash3-fill"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column: Municipios */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100" style={{ borderTop: '5px solid #1e293b' }}>
            <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center rounded-top-4">
              <h6 className="mb-0 fw-bold text-dark"><i className="bi bi-compass-fill me-2 text-secondary"></i>Municipios</h6>
              {hasCrear && (
                <button 
                  className={`btn btn-sm text-white fw-bold shadow-sm hover-efecto ${!estadoSel ? 'disabled' : ''}`} 
                  style={{ background: '#1e293b' }} 
                  onClick={nuevoMunicipio}
                  disabled={!estadoSel}
                >
                  <i className="bi bi-plus-lg"></i>
                </button>
              )}
            </div>
            <div className="card-body p-0" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {!estadoSel ? (
                <div className="p-4 text-center text-muted">
                  <i className="bi bi-map fs-2"></i>
                  <p className="mb-0 small fw-bold mt-2">Seleccione un Estado</p>
                </div>
              ) : municipiosFiltrados.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  <i className="bi bi-inbox fs-2"></i>
                  <p className="mb-0 small fw-bold mt-2">No hay municipios agregados</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {municipiosFiltrados.map(muni => {
                    const activeClass = (municipioSel === muni) ? 'active bg-primary text-white' : 'text-dark bg-white';
                    const iconColor = (municipioSel === muni) ? 'text-white' : 'text-success';
                    const btnTrashColor = (municipioSel === muni) ? 'btn-primary text-white border-white' : 'btn-light text-danger border';

                    return (
                      <div 
                        key={muni} 
                        className={`list-group-item p-3 border-0 border-bottom d-flex justify-content-between align-items-center hover-efecto cursor-pointer ${activeClass}`} 
                        onClick={() => seleccionarMunicipio(muni)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="fw-bold d-flex align-items-center gap-2">
                          <i className={`bi bi-compass-fill ${iconColor}`}></i> {muni}
                        </div>
                        {hasEliminar && (
                          <div>
                            <button 
                              className={`btn btn-sm ${btnTrashColor} rounded-circle shadow-sm hover-efecto`} 
                              onClick={(e) => { e.stopPropagation(); eliminarMunicipio(muni); }} 
                              title="Eliminar Municipio"
                            >
                              <i className="bi bi-trash3-fill"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column: Parroquias */}
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 h-100" style={{ borderTop: '5px solid #334155' }}>
            <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center rounded-top-4">
              <h6 className="mb-0 fw-bold text-dark"><i className="bi bi-geo-fill me-2 text-secondary"></i>Parroquias</h6>
              {hasCrear && (
                <button 
                  className={`btn btn-sm text-white fw-bold shadow-sm hover-efecto ${!municipioSel ? 'disabled' : ''}`} 
                  style={{ background: '#334155' }} 
                  onClick={nuevaParroquia}
                  disabled={!municipioSel}
                >
                  <i className="bi bi-plus-lg"></i>
                </button>
              )}
            </div>
            <div className="card-body p-0" style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {!municipioSel ? (
                <div className="p-4 text-center text-muted">
                  <i className="bi bi-compass fs-2"></i>
                  <p className="mb-0 small fw-bold mt-2">Seleccione un Municipio</p>
                </div>
              ) : parroquiasFiltradas.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  <i className="bi bi-inbox fs-2"></i>
                  <p className="mb-0 small fw-bold mt-2">No hay parroquias agregadas</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {parroquiasFiltradas.map(parr => (
                    <div key={parr.id} className="list-group-item p-3 border-0 border-bottom d-flex justify-content-between align-items-center hover-efecto text-dark bg-white">
                      <div className="fw-bold d-flex align-items-center gap-2">
                        <i className="bi bi-geo-fill text-danger"></i> {parr.valor}
                      </div>
                      {hasEliminar && (
                        <div>
                          <button 
                            className="btn btn-sm btn-light text-danger rounded-circle shadow-sm hover-efecto border" 
                            onClick={() => eliminarParroquia(parr.id, parr.valor)} 
                            title="Eliminar Parroquia"
                          >
                            <i className="bi bi-trash3-fill"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
