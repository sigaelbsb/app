import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermisos } from '../hooks/usePermisos';

interface ProtectedRouteProps {
  modulo: string;
  accion?: string;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ modulo, accion = 'ver', children }) => {
  const navigate = useNavigate();
  const { tienePermiso, loading, user } = usePermisos();

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center py-5" style={{ minHeight: '450px' }}>
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Cargando permisos...</span>
        </div>
        <span className="text-muted fw-bold small">Verificando credenciales y privilegios de acceso...</span>
      </div>
    );
  }

  // SuperAdmin siempre tiene acceso completo
  if (user?.rol === 'SuperAdmin') {
    return <>{children}</>;
  }

  const permitido = tienePermiso(modulo, accion);

  if (!permitido) {
    return (
      <div className="container py-5 animate__animated animate__fadeIn">
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white mx-auto" style={{ maxWidth: '650px' }}>
          <div className="mb-4">
            <div className="d-inline-flex p-4 rounded-circle bg-danger bg-opacity-10 text-danger mb-3 shadow-sm border border-danger border-opacity-25">
              <i className="bi bi-shield-lock-fill" style={{ fontSize: '3.5rem' }}></i>
            </div>
            <h3 className="fw-bolder text-dark mb-2">Acceso Restringido</h3>
            <p className="text-muted mb-4 fs-6">
              Tu rol actual (<b className="text-danger">{user?.rol || 'Sin Rol Asignado'}</b>) no cuenta con los privilegios necesarios en la institución activa para acceder al módulo <b className="text-primary">{modulo}</b>.
            </p>
            <div className="p-3 bg-light rounded-3 border text-start small text-muted mb-4">
              <i className="bi bi-info-circle-fill text-primary me-2"></i>
              Si consideras que deberías tener acceso a esta sección, solicita al <b>Administrador del Sistema</b> o a la <b>Dirección del Plantel</b> que habilite los privilegios correspondientes en el módulo de <i>Roles y Privilegios</i>.
            </div>
          </div>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <button 
              onClick={() => navigate(-1)} 
              className="btn btn-outline-secondary rounded-pill px-4 py-2 fw-bold shadow-sm"
            >
              <i className="bi bi-arrow-left me-2"></i>Regresar
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm"
              style={{ backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' }}
            >
              <i className="bi bi-house-door-fill me-2"></i>Ir al Panel Principal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
