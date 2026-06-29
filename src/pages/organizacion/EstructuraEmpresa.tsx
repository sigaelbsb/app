import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';

interface DiccionarioItem {
  id_parametro: string;
  categoria: string;
  valor: string;
}

export const EstructuraEmpresa = () => {
  const navigate = useNavigate();
  const { tienePermiso, loading: permLoading } = usePermisos();
  const Swal = (window as any).Swal;

  const [datos, setDatos] = useState<DiccionarioItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Card permissions
  const hasVerNomina = tienePermiso('Diccionario: Nómina', 'ver');
  const hasVerParentesco = tienePermiso('Diccionario: Parentesco', 'ver');
  const hasVerCondicion = tienePermiso('Diccionario: Condición', 'ver');
  const hasVerNegocio = tienePermiso('Diccionario: Negocio/Filial', 'ver');
  const hasVerGerencia = tienePermiso('Diccionario: Organización/Gerencia', 'ver');
  const hasVerLocalidad = tienePermiso('Diccionario: Localidad', 'ver');
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

  const renderizarTarjeta = (titulo: string, categoria: string, icono: string, colorBorder: string, bgColor: string) => {
    const filtrados = datos.filter(d => d.categoria === categoria);

    return (
      <div className="card border-0 shadow-sm rounded-4 h-100" style={{ borderTop: `5px solid ${colorBorder} !important` }}>
        <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center rounded-top-4">
          <div className="d-flex align-items-center">
            <div className={`p-2 rounded-circle me-2 d-flex align-items-center justify-content-center`} style={{ backgroundColor: bgColor, color: colorBorder, width: '36px', height: '36px' }}>
              <i className={`bi ${icono}`}></i>
            </div>
            <div>
              <h6 className="mb-0 fw-bold text-dark">{titulo}</h6>
              <span className="text-muted small fw-bold" style={{ fontSize: '0.7rem' }}>{filtrados.length} items</span>
            </div>
          </div>
          {canCrear && (
            <button 
              className="btn btn-sm text-white fw-bold shadow-sm hover-efecto" 
              style={{ background: colorBorder }} 
              onClick={() => nuevoItem(categoria)}
            >
              <i className="bi bi-plus-lg"></i>
            </button>
          )}
        </div>
        <div className="card-body p-0" style={{ maxHeight: '280px', overflowY: 'auto' }}>
          {filtrados.length === 0 ? (
            <div className="p-4 text-center text-muted">
              <i className="bi bi-inbox fs-3 text-muted"></i>
              <p className="mb-0 small fw-bold mt-2 text-muted">No hay registros</p>
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
    <div className="modulo-animado container-fluid p-0">
      {/* Banner */}
      <div className="row mb-4 animate__animated animate__fadeInDown">
        <div className="col-12">
          <div 
            className="banner-modulo p-4 p-md-5 text-white shadow-sm" 
            style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
          >
            <div className="burbuja-3d burbuja-1" style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.06)', position: 'absolute', top: '-50px', right: '-20px', borderRadius: '50%' }}></div>
            <div className="burbuja-3d burbuja-2" style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.04)', position: 'absolute', bottom: '-20px', left: '20px', borderRadius: '50%' }}></div>
            <div className="row align-items-center position-relative z-1">
              <div className="col-12 text-center text-md-start">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <span className="badge bg-white mb-0 px-3 py-2 shadow-sm fw-bold" style={{ color: '#0f172a', letterSpacing: '1px', fontSize: '0.85rem' }}>
                    <i className="bi bi-buildings-fill me-1"></i> ORGANIZACIÓN ESTRATÉGICA
                  </span>
                  <button 
                    onClick={() => navigate('/categoria/Organizaci%C3%B3n%20Escolar')} 
                    className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                  >
                    <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
                  </button>
                </div>
                <h1 className="fw-bolder mb-2 text-white" style={{ fontSize: '2.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  <i className="bi bi-buildings-fill me-3"></i>Estructura de la Empresa
                </h1>
                <p className="mb-0 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Gestión de datos corporativos, filiales, nóminas y parentescos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 animate__animated animate__fadeInUp">
        {/* Tipos de Nómina */}
        {hasVerNomina && (
          <div className="col-12 col-md-6 col-xl-4">
            {renderizarTarjeta('Tipos de Nómina', 'Nómina', 'bi-card-checklist', '#334155', '#e2e8f0')}
          </div>
        )}

        {/* Parentesco */}
        {hasVerParentesco && (
          <div className="col-12 col-md-6 col-xl-4">
            {renderizarTarjeta('Parentesco', 'Parentesco', 'bi-people-fill', '#475569', '#f1f5f9')}
          </div>
        )}

        {/* Condición Laboral */}
        {hasVerCondicion && (
          <div className="col-12 col-md-6 col-xl-4">
            {renderizarTarjeta('Condición Laboral', 'Condición', 'bi-person-badge-fill', '#64748b', '#f8fafc')}
          </div>
        )}

        {/* Negocios / Filiales */}
        {hasVerNegocio && (
          <div className="col-12 col-md-6 col-xl-4">
            {renderizarTarjeta('Negocios / Filiales', 'Negocio/Filial', 'bi-building', '#0f172a', '#e2e8f0')}
          </div>
        )}

        {/* Gerencias / Dptos */}
        {hasVerGerencia && (
          <div className="col-12 col-md-6 col-xl-4">
            {renderizarTarjeta('Gerencias / Dptos.', 'Organización/Gerencia', 'bi-briefcase-fill', '#1e293b', '#e2e8f0')}
          </div>
        )}

        {/* Localidades */}
        {hasVerLocalidad && (
          <div className="col-12 col-md-6 col-xl-4">
            {renderizarTarjeta('Localidades de Trabajo', 'Localidad', 'bi-geo-alt-fill', '#047857', '#d1fae5')}
          </div>
        )}
      </div>
    </div>
  );
};
