import React, { useState } from 'react';

interface DashboardViewProps {
  canManageParadas: boolean;
  canManageRutas: boolean;
  canOperateTracking: boolean;
  canViewRecorrido: boolean;
  setVistaActual: (vista: 'dashboard' | 'Configuracion' | 'Operacion' | 'Visor' | 'CargaMasiva') => void;
  setConfigTab: (tab: 'Paradas' | 'Rutas' | 'Asignacion') => void;
  AnimatedBusSVG: React.ComponentType<{ size?: number; className?: string }>;
  rutas: any[];
  user: any;
  compartirRuta: (ruta: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  canManageParadas,
  canManageRutas,
  canOperateTracking,
  canViewRecorrido,
  setVistaActual,
  setConfigTab,
  AnimatedBusSVG,
  rutas,
  user,
  compartirRuta
}) => {
  const [showList, setShowList] = useState(false);

  // Filter routes based on user role and assignment
  const misRutasAsignadas = (user?.rol === 'SuperAdmin' || canManageRutas)
    ? rutas
    : rutas.filter(r => r.docente_id === user?.id_usuario || r.docente_id === user?.id);

  return (
    <div className="row g-4">
      {/* ── Tarjeta: Configuración (Paradas + Rutas unificadas) ── */}
      {(canManageParadas || canManageRutas) && (
        <div className="col-12 col-md-6 col-xl-3 animate__animated animate__fadeInUp" style={{ animationDelay: '0s' }}>
          <div
            className="tarjeta-modulo-nueva shadow-sm w-100"
            style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)', border: '2px solid #fde68a' }}
            onClick={() => {
              setConfigTab(canManageParadas ? 'Paradas' : 'Rutas');
              setVistaActual('Configuracion');
            }}
          >
            <i className="bi bi-signpost-split-fill bg-icono-gigante" style={{ color: '#d97706' }}></i>
            <div className="contenido-t">
              <div className="icono-caja shadow-sm" style={{ color: '#d97706', border: '1px solid #fde68a', background: 'white' }}>
                <i className="bi bi-signpost-split-fill"></i>
              </div>
              <h4 className="titulo-t" style={{ fontSize: '1.25rem', marginTop: '1.5rem', marginBottom: '0.4rem', fontWeight: 800 }}>Paradas y Rutas</h4>
              <p className="small text-muted mb-3">Gestionar catálogo de paradas, diseño de rutas y asignación de personal.</p>
              
              <div className="d-flex gap-2 mt-auto" style={{ flexWrap: 'wrap' }}>
                {canManageParadas && <span className="badge rounded-pill" style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.65rem' }}><i className="bi bi-geo-alt-fill me-1"></i>Paradas</span>}
                {canManageRutas   && <span className="badge rounded-pill" style={{ background: '#fed7aa', color: '#9a3412', fontSize: '0.65rem' }}><i className="bi bi-signpost-2-fill me-1"></i>Rutas</span>}
                {canManageRutas   && <span className="badge rounded-pill" style={{ background: '#e9d5ff', color: '#6b21a8', fontSize: '0.65rem' }}><i className="bi bi-person-badge-fill me-1"></i>Personal</span>}
              </div>
              <span className="link-t mt-3" style={{ color: '#d97706' }}>Entrar al submódulo <i className="bi bi-arrow-right"></i></span>
            </div>
          </div>
        </div>
      )}

      {/* ── Tarjeta: Gestor de Recorrido (Operación) ── */}
      <div className="col-12 col-md-6 col-xl-3 animate__animated animate__fadeInUp" style={{ animationDelay: '0.2s' }}>
        <div
          className={`tarjeta-modulo-nueva shadow-sm w-100 ${!canOperateTracking ? 'bloqueado' : ''}`}
          style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)', border: '2px solid #ddd6fe' }}
          onClick={() => canOperateTracking && setVistaActual('Operacion')}
        >
          <i className="bi bi-broadcast bg-icono-gigante" style={{ color: '#6d28d9' }}></i>
          <div className="contenido-t">
            <div className="icono-caja shadow-sm" style={{ color: '#6d28d9', border: '1px solid #ddd6fe', background: 'white' }}>
              <i className="bi bi-broadcast"></i>
            </div>
            <h4 className="titulo-t" style={{ fontSize: '1.25rem', marginTop: '1.5rem', marginBottom: '0.4rem', fontWeight: 800 }}>Gestor de Recorrido</h4>
            <p className="small text-muted mb-3">Iniciar ruta y marcar avance en tiempo real.</p>
            
            <div className="mt-auto">
              {!canOperateTracking ? (
                <span className="badge bg-secondary rounded-pill" style={{ fontSize: '0.65rem' }}>
                  <i className="bi bi-lock-fill me-1"></i>Sin permiso
                </span>
              ) : (
                <div className="d-flex align-items-center justify-content-between">
                  <span className="link-t" style={{ color: '#6d28d9' }}>Entrar al submódulo <i className="bi bi-arrow-right"></i></span>
                  <div className="bus-drive">
                    <AnimatedBusSVG size={24} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tarjeta: Visor de Recorrido ── */}
      <div className="col-12 col-md-6 col-xl-3 animate__animated animate__fadeInUp" style={{ animationDelay: '0.3s' }}>
        <div
          className={`tarjeta-modulo-nueva shadow-sm w-100 ${!canViewRecorrido ? 'bloqueado' : ''}`}
          style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', border: '2px solid #bbf7d0' }}
          onClick={() => canViewRecorrido && setVistaActual('Visor')}
        >
          <i className="bi bi-eye-fill bg-icono-gigante" style={{ color: '#198754' }}></i>
          <div className="contenido-t">
            <div className="icono-caja shadow-sm" style={{ color: '#198754', border: '1px solid #bbf7d0', background: 'white' }}>
              <i className="bi bi-eye-fill"></i>
            </div>
            <h4 className="titulo-t" style={{ fontSize: '1.25rem', marginTop: '1.5rem', marginBottom: '0.4rem', fontWeight: 800 }}>Visor de Recorrido</h4>
            <p className="small text-muted mb-3">Seguimiento en vivo para representantes y docentes.</p>
            
            <div className="mt-auto">
              {!canViewRecorrido ? (
                <span className="badge bg-secondary rounded-pill" style={{ fontSize: '0.65rem' }}>
                  <i className="bi bi-lock-fill me-1"></i>Sin permiso
                </span>
              ) : (
                <span className="link-t" style={{ color: '#198754' }}>Entrar al submódulo <i className="bi bi-arrow-right"></i></span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tarjeta: Mis Rutas (WhatsApp Compartir) ── */}
      <div className="col-12 col-md-6 col-xl-3 animate__animated animate__fadeInUp" style={{ animationDelay: '0.4s' }}>
        <div
          className="tarjeta-modulo-nueva shadow-sm w-100"
          style={{ background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)', border: '2px solid #bfdbfe', cursor: 'pointer' }}
          onClick={() => setShowList(!showList)}
        >
          <i className="bi bi-folder-symlink-fill bg-icono-gigante" style={{ color: '#2563eb' }}></i>
          <div className="contenido-t w-100">
            <div className="icono-caja shadow-sm" style={{ color: '#2563eb', border: '1px solid #bfdbfe', background: 'white' }}>
              <i className="bi bi-folder-symlink-fill"></i>
            </div>
            <h4 className="titulo-t" style={{ fontSize: '1.25rem', marginTop: '1.5rem', marginBottom: '0.4rem', fontWeight: 800 }}>Mis Rutas</h4>
            <p className="small text-muted mb-3">Consulta y comparte el rutograma de tu unidad asignada directamente a WhatsApp.</p>
            
            {showList ? (
              <div className="mt-2 animate__animated animate__slideInDown text-start" onClick={e => e.stopPropagation()}>
                {misRutasAsignadas.length === 0 ? (
                  <div className="text-center text-muted small py-2 bg-light rounded-3 border">
                    No tienes rutas asignadas
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {misRutasAsignadas.map(r => (
                      <div key={r.id} className="d-flex justify-content-between align-items-center p-2 bg-white rounded-3 border shadow-sm">
                        <div className="text-start pe-2" style={{ minWidth: 0, flex: 1 }}>
                          <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.8rem' }}>{r.nombre}</div>
                          <div className="text-muted text-truncate" style={{ fontSize: '0.68rem' }}>Chofer: {r.chofer_nombre || 'Sin asignar'}</div>
                        </div>
                        <button 
                          className="btn btn-sm btn-success rounded-pill px-2 fw-bold d-flex align-items-center gap-1 shadow-sm flex-shrink-0"
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => compartirRuta(r)}
                        >
                          <i className="bi bi-whatsapp"></i> Compartir
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className="link-t mt-auto" style={{ color: '#2563eb' }}>Ver mis rutas ({misRutasAsignadas.length}) <i className="bi bi-chevron-down"></i></span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
