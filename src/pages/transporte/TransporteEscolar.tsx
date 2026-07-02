import { useState, useEffect } from 'react';
// import { supabase } from '../../lib/supabase';
import { usePermisos } from '../../hooks/usePermisos';
// import { useNavigate } from 'react-router-dom';

export const TransporteEscolar = () => {
  const { user, loading: permLoading } = usePermisos();
  // const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'operaciones' | 'rutas' | 'guardias'>('operaciones');

  // Supabase real-time subscription for operations
  useEffect(() => {
    // We will implement real-time tracking here
  }, []);

  if (permLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  // Determine user role and permissions
  const isAdmin = ['SuperAdmin', 'Administrador', 'Director', 'Coordinador'].includes(user?.rol || '');
  const isDocente = user?.rol === 'Docente';
  // If not admin and not docente, assume representant/worker viewing their child's transport status.
  const isRepresentante = !isAdmin && !isDocente;

  return (
    <div className="container-fluid py-4 animate__animated animate__fadeIn">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
          <i className="bi bi-bus-front text-primary"></i>
          Transporte Escolar
        </h4>
        <div className="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle px-3 py-2 rounded-pill">
          <i className="bi bi-geo-alt-fill me-1"></i>
          Módulo de Monitoreo
        </div>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <ul className="nav nav-pills mb-4 gap-2 border-bottom pb-3">
        <li className="nav-item">
          <button
            className={`nav-link rounded-pill fw-semibold px-4 transition-all ${activeTab === 'operaciones' ? 'active bg-primary text-white shadow-sm' : 'text-muted hover-bg-light'}`}
            onClick={() => setActiveTab('operaciones')}
          >
            <i className="bi bi-broadcast-pin me-2"></i> Operaciones en Vivo
          </button>
        </li>
        {isAdmin && (
          <>
            <li className="nav-item">
              <button
                className={`nav-link rounded-pill fw-semibold px-4 transition-all ${activeTab === 'guardias' ? 'active bg-primary text-white shadow-sm' : 'text-muted hover-bg-light'}`}
                onClick={() => setActiveTab('guardias')}
              >
                <i className="bi bi-shield-check me-2"></i> Docentes de Guardia
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link rounded-pill fw-semibold px-4 transition-all ${activeTab === 'rutas' ? 'active bg-primary text-white shadow-sm' : 'text-muted hover-bg-light'}`}
                onClick={() => setActiveTab('rutas')}
              >
                <i className="bi bi-map me-2"></i> Gestión de Rutas
              </button>
            </li>
          </>
        )}
      </ul>

      {/* CONTENIDO DE LAS PESTAÑAS */}
      <div className="bg-white rounded-4 shadow-sm border p-4">
        {activeTab === 'operaciones' && (
          <div>
            <h5 className="fw-bold text-dark mb-4">Monitor de Rutas en Tiempo Real</h5>
            {isRepresentante && (
              <div className="alert alert-info border-info bg-info bg-opacity-10 rounded-3">
                <i className="bi bi-info-circle-fill me-2"></i>
                Como representante, solo podrás visualizar el estado de las rutas donde tus representados tienen asignación de transporte.
              </div>
            )}
            
            <div className="row g-4">
              <div className="col-12 text-center py-5 text-muted">
                <i className="bi bi-cone-striped fs-1 text-secondary mb-3 d-block"></i>
                <h6>Módulo en construcción</h6>
                <p className="small">Estamos integrando la base de datos de rutas y paradas.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'guardias' && isAdmin && (
          <div>
            <h5 className="fw-bold text-dark mb-4">Asignación de Guardias Semanales</h5>
            <div className="text-center py-5 text-muted">
              <i className="bi bi-shield-lock fs-1 text-secondary mb-3 d-block"></i>
              <h6>Módulo en construcción</h6>
            </div>
          </div>
        )}

        {activeTab === 'rutas' && isAdmin && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold text-dark mb-0">Gestión de Rutas y Paradas</h5>
              <button className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm">
                <i className="bi bi-plus-lg me-1"></i> Nueva Ruta
              </button>
            </div>
            <div className="text-center py-5 text-muted">
              <i className="bi bi-signpost-split fs-1 text-secondary mb-3 d-block"></i>
              <h6>Módulo en construcción</h6>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
