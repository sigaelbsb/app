import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';

export const PreguntasSeguridad = () => {
  const navigate = useNavigate();
  const { tienePermiso, loading: permLoading } = usePermisos();

  const [preguntas, setPreguntas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  const Swal = (window as any).Swal;

  useEffect(() => {
    if (!permLoading && tienePermiso('Preguntas de Seguridad', 'ver')) {
      cargarPreguntas();
    }
  }, [permLoading]);

  const cargarPreguntas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conf_preguntas_seguridad')
        .select('*')
        .order('pregunta', { ascending: true });

      if (error) throw error;
      setPreguntas(data || []);
    } catch (e) {
      console.error(e);
      if (Swal) Swal.fire('Error', 'No se pudo cargar el banco de preguntas.', 'error');
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

  if (!tienePermiso('Preguntas de Seguridad', 'ver')) {
    return (
      <div className="col-12 text-center py-5 mt-4">
        <div className="bg-light d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm border" style={{ width: '100px', height: '100px' }}>
          <i className="bi bi-shield-lock-fill text-muted" style={{ fontSize: '3.5rem' }}></i>
        </div>
        <h4 className="text-dark fw-bold mb-2">Área Restringida</h4>
        <p className="text-muted mb-0">No tienes permisos asignados para visualizar este catálogo.</p>
      </div>
    );
  }

  // Filtering
  const preguntasFiltradas = preguntas.filter(p => 
    (p.pregunta || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPaginas = Math.ceil(preguntasFiltradas.length / itemsPorPagina) || 1;
  const indexInicio = (paginaActual - 1) * itemsPorPagina;
  const preguntasPaginadas = preguntasFiltradas.slice(indexInicio, indexInicio + itemsPorPagina);

  const cambiarPagina = (pag: number) => {
    if (pag >= 1 && pag <= totalPaginas) {
      setPaginaActual(pag);
    }
  };

  const nuevaPregunta = () => {
    if (!Swal) return;

    Swal.fire({
      title: 'Nueva Pregunta',
      input: 'text',
      inputPlaceholder: 'Ej: ¿Cuál es tu banda favorita?',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      confirmButtonColor: '#0ea5e9',
      preConfirm: (valor: string) => {
        if (!valor || !valor.trim()) {
          Swal.showValidationMessage('La pregunta no puede estar vacía');
          return false;
        }
        return valor.trim();
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase
            .from('conf_preguntas_seguridad')
            .insert([{ pregunta: result.value }]);

          if (error) {
            if (error.code === '23505') {
              Swal.fire('Error', 'Esta pregunta ya existe en el sistema.', 'error');
              setLoading(false);
              return;
            }
            throw error;
          }
          Swal.fire('¡Éxito!', 'La pregunta se ha guardado correctamente.', 'success');
          auditar('Preguntas de Seguridad', 'Crear Pregunta', `Se añadió al banco: "${result.value}"`);
          cargarPreguntas();
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo guardar la pregunta.', 'error');
        }
        setLoading(false);
      }
    });
  };

  const editarPregunta = (p: any) => {
    if (!Swal) return;

    Swal.fire({
      title: 'Editar Pregunta',
      input: 'text',
      inputValue: p.pregunta,
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      confirmButtonColor: '#0ea5e9',
      preConfirm: (valor: string) => {
        if (!valor || !valor.trim()) {
          Swal.showValidationMessage('La pregunta no puede estar vacía');
          return false;
        }
        return valor.trim();
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase
            .from('conf_preguntas_seguridad')
            .update({ pregunta: result.value })
            .eq('id', p.id);

          if (error) {
            if (error.code === '23505') {
              Swal.fire('Error', 'Ya existe otra pregunta exactamente igual.', 'error');
              setLoading(false);
              return;
            }
            throw error;
          }
          Swal.fire('¡Éxito!', 'La pregunta se ha actualizado correctamente.', 'success');
          auditar('Preguntas de Seguridad', 'Editar Pregunta', `Se modificó a: "${result.value}"`);
          cargarPreguntas();
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo actualizar la pregunta.', 'error');
        }
        setLoading(false);
      }
    });
  };

  const eliminarPregunta = (p: any) => {
    if (!Swal) return;

    Swal.fire({
      title: '¿Eliminar Pregunta?',
      text: "Esta acción no afectará a los usuarios que ya la hayan respondido en sus perfiles.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('conf_preguntas_seguridad')
            .delete()
            .eq('id', p.id)
            .select();

          if (error) throw error;

          if (data && data.length === 0) {
            Swal.fire('Atención', 'No se pudo encontrar la pregunta.', 'warning');
            setLoading(false);
            return;
          }

          Swal.fire('¡Éxito!', 'La pregunta ha sido eliminada del banco oficial.', 'success');
          auditar('Preguntas de Seguridad', 'Eliminar Pregunta', `Se eliminó una pregunta del banco oficial.`);
          cargarPreguntas();
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo eliminar la pregunta.', 'error');
        }
        setLoading(false);
      }
    });
  };

  return (
    <div className="row g-4 container-fluid p-0 animate__animated animate__fadeIn">
      {/* Banner */}
      <div className="col-12 animate__animated animate__fadeInDown">
        <div 
          className="banner-modulo p-4 p-md-5 text-white shadow-sm" 
          style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
        >
          <div className="burbuja-3d burbuja-1" style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.15)', position: 'absolute', top: '-50px', right: '-20px', borderRadius: '50%' }}></div>
          <div className="burbuja-3d burbuja-2" style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.08)', position: 'absolute', bottom: '-20px', left: '20px', borderRadius: '50%' }}></div>
          <div className="row align-items-center position-relative z-1">
            <div className="col-12 text-center text-md-start">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <span className="badge bg-white text-info px-3 py-2 shadow-sm fw-bold" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>
                  <i className="bi bi-shield-lock me-1"></i> SEGURIDAD Y ACCESOS
                </span>
                <button 
                  onClick={() => navigate('/categoria/Seguridad%20y%20Accesos')} 
                  className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                >
                  <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
                </button>
              </div>
              <h1 className="fw-bolder mb-2 text-white" style={{ fontSize: '2.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                <i className="bi bi-patch-question-fill me-3"></i>Preguntas de Seguridad
              </h1>
              <p className="mb-0 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Banco de preguntas para la recuperación de cuentas de usuario.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Directory table */}
      <div className="col-md-12 col-xl-8 mx-auto animate__animated animate__fadeInUp">
        <div className="card border-0 shadow-sm rounded-4 h-100" style={{ borderTop: '5px solid #0ea5e9 !important' }}>
          <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-patch-question-fill text-info me-2"></i>Banco de Preguntas</h5>
              <small className="text-muted">Preguntas disponibles para el registro inicial.</small>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <input 
                type="text" 
                className="input-moderno form-control border-info w-auto" 
                placeholder="Buscar pregunta..." 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPaginaActual(1); }}
                style={{ maxWidth: '250px' }}
              />
              <button 
                className="btn fw-bold shadow-sm px-4 rounded-pill hover-efecto text-white" 
                style={{ backgroundColor: '#0ea5e9' }}
                onClick={nuevaPregunta}
              >
                <i className="bi bi-plus-lg me-2"></i>Añadir Pregunta
              </button>
            </div>
          </div>
          
          <div className="card-body p-0">
            {loading ? (
              <div className="d-flex justify-content-center align-items-center py-5">
                <div className="spinner-border text-info" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light text-muted small">
                    <tr>
                      <th className="ps-4">Pregunta de Seguridad</th>
                      <th className="text-end pe-4" style={{ width: '150px' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preguntasPaginadas.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="text-center p-4 text-muted">
                          <i className="bi bi-question-circle fs-2 d-block mb-2"></i>
                          No se encontraron preguntas.
                        </td>
                      </tr>
                    ) : (
                      preguntasPaginadas.map(p => (
                        <tr key={p.id} className="align-middle hover-efecto">
                          <td className="fw-bold text-dark ps-4">{p.pregunta}</td>
                          <td className="text-end pe-4 text-nowrap">
                            <button 
                              className="btn btn-sm btn-light text-primary shadow-sm border me-1" 
                              onClick={() => editarPregunta(p)} 
                              title="Editar"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-light text-danger shadow-sm border" 
                              onClick={() => eliminarPregunta(p)} 
                              title="Eliminar"
                            >
                              <i className="bi bi-trash3-fill"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card-footer bg-white border-top p-3 d-flex justify-content-center rounded-bottom-4">
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
  );
};
