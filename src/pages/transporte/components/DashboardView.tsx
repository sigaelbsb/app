import React, { useState } from 'react';
import { IconoTransporteEscolar3D } from '../../../components/chamilo';

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

  // Filtrar rutas según rol del usuario y asignación
  const misRutasAsignadas = (user?.rol === 'SuperAdmin' || canManageRutas)
    ? rutas
    : rutas.filter(r => r.docente_id === user?.id_usuario || r.docente_id === user?.id);

  // Contadores rápidos para la barra de telemetría
  const rutasActivas = rutas.filter(r => r.activo !== false).length;
  const choferesAsignados = rutas.filter(r => r.chofer_nombre).length;

  return (
    <div className="animate__animated animate__fadeIn">
      {/* ── BARRA RESUMEN DE TELEMETRÍA RÁPIDA (Responsive Grid) ── */}
      <div className="row g-2 g-md-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3">
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-primary" 
              style={{ width: '42px', height: '42px', background: '#eff6ff', fontSize: '1.25rem' }}
            >
              <i className="bi bi-signpost-split-fill"></i>
            </div>
            <div className="min-w-0">
              <div className="fw-bold text-dark fs-5 line-height-1">{rutas.length}</div>
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>Rutas Diseñadas</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3">
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-success" 
              style={{ width: '42px', height: '42px', background: '#f0fdf4', fontSize: '1.25rem' }}
            >
              <i className="bi bi-check2-circle"></i>
            </div>
            <div className="min-w-0">
              <div className="fw-bold text-dark fs-5 line-height-1">{rutasActivas}</div>
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>Rutas Activas</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3">
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-warning" 
              style={{ width: '42px', height: '42px', background: '#fffbeb', fontSize: '1.25rem' }}
            >
              <i className="bi bi-person-badge-fill"></i>
            </div>
            <div className="min-w-0">
              <div className="fw-bold text-dark fs-5 line-height-1">{choferesAsignados}</div>
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>Choferes Activos</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3">
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-danger" 
              style={{ width: '42px', height: '42px', background: '#fff1f2', fontSize: '1.25rem' }}
            >
              <i className="bi bi-broadcast"></i>
            </div>
            <div className="min-w-0">
              <div className="fw-bold text-dark fs-5 line-height-1 d-flex align-items-center gap-1.5">
                <span className="d-inline-block rounded-circle bg-success animate__animated animate__pulse animate__infinite" style={{ width: '7px', height: '7px' }}></span>
                <span>En Vivo</span>
              </div>
              <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>GPS & Despacho</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CUADRÍCULA DE SUBMÓDULOS DE TRANSPORTE ESCOLAR ── */}
      <div className="row g-3 g-md-4">
        {/* ── Tarjeta 1: Paradas y Rutas ── */}
        {(canManageParadas || canManageRutas) && (
          <div className="col-12 col-sm-6 col-xl-3 animate__animated animate__fadeInUp">
            <div
              className="transporte-feature-card w-100"
              style={{ 
                borderTop: '4px solid #f59e0b',
                background: 'linear-gradient(180deg, #ffffff 0%, #fffdfa 100%)'
              }}
              onClick={() => {
                setConfigTab(canManageParadas ? 'Paradas' : 'Rutas');
                setVistaActual('Configuracion');
              }}
            >
              <i className="bi bi-signpost-split-fill transporte-bg-watermark" style={{ color: '#d97706' }}></i>
              
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="transporte-card-icon shadow-xs" style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
                  <i className="bi bi-signpost-split-fill"></i>
                </div>
                <span className="badge rounded-pill px-2.5 py-1" style={{ background: '#fef3c7', color: '#b45309', fontSize: '0.7rem', fontWeight: 700 }}>
                  Maestros
                </span>
              </div>

              <h4 className="fw-bold text-dark mb-1" style={{ fontSize: '1.15rem' }}>Paradas y Rutas</h4>
              <p className="text-muted small mb-3" style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>
                Catálogo de paradas, secuencia de recorrido y asignación de personal docente y choferes.
              </p>
              
              <div className="d-flex gap-1.5 mb-3 flex-wrap">
                {canManageParadas && (
                  <span className="badge rounded-pill bg-light text-primary border" style={{ fontSize: '0.65rem' }}>
                    <i className="bi bi-geo-alt-fill me-1"></i>Paradas
                  </span>
                )}
                {canManageRutas && (
                  <span className="badge rounded-pill bg-light text-warning border" style={{ fontSize: '0.65rem' }}>
                    <i className="bi bi-signpost-2-fill me-1"></i>Rutas
                  </span>
                )}
                {canManageRutas && (
                  <span className="badge rounded-pill bg-light text-secondary border" style={{ fontSize: '0.65rem' }}>
                    <i className="bi bi-person-badge-fill me-1"></i>Personal
                  </span>
                )}
              </div>

              <div className="mt-auto pt-2 border-top d-flex align-items-center justify-content-between">
                <span className="fw-bold small d-flex align-items-center gap-1" style={{ color: '#d97706' }}>
                  Entrar al submódulo <i className="bi bi-arrow-right"></i>
                </span>
                <i className="bi bi-chevron-right text-muted small"></i>
              </div>
            </div>
          </div>
        )}

        {/* ── Tarjeta 2: Gestor de Recorrido (Operación) ── */}
        <div className="col-12 col-sm-6 col-xl-3 animate__animated animate__fadeInUp" style={{ animationDelay: '0.1s' }}>
          <div
            className={`transporte-feature-card w-100 ${!canOperateTracking ? 'card-disabled' : ''}`}
            style={{ 
              borderTop: '4px solid #8b5cf6',
              background: 'linear-gradient(180deg, #ffffff 0%, #faf8ff 100%)'
            }}
            onClick={() => canOperateTracking && setVistaActual('Operacion')}
          >
            <i className="bi bi-broadcast transporte-bg-watermark" style={{ color: '#6d28d9' }}></i>
            
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="transporte-card-icon shadow-xs" style={{ background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' }}>
                <i className="bi bi-broadcast"></i>
              </div>
              <span className="badge rounded-pill px-2.5 py-1" style={{ background: '#ede9fe', color: '#6b21a8', fontSize: '0.7rem', fontWeight: 700 }}>
                Conductor
              </span>
            </div>

            <h4 className="fw-bold text-dark mb-1" style={{ fontSize: '1.15rem' }}>Gestor de Recorrido</h4>
            <p className="text-muted small mb-3" style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>
              Control del autobús en tiempo real: despacho de salida y confirmación de llegada parada por parada.
            </p>
            
            <div className="mt-auto">
              {!canOperateTracking ? (
                <span className="badge bg-secondary rounded-pill" style={{ fontSize: '0.68rem' }}>
                  <i className="bi bi-lock-fill me-1"></i>Sin permiso
                </span>
              ) : (
                <div className="pt-2 border-top d-flex align-items-center justify-content-between">
                  <span className="fw-bold small d-flex align-items-center gap-1" style={{ color: '#6d28d9' }}>
                    Entrar al submódulo <i className="bi bi-arrow-right"></i>
                  </span>
                  <div className="d-flex align-items-center">
                    <AnimatedBusSVG size={22} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Tarjeta 3: Visor de Recorrido ── */}
        <div className="col-12 col-sm-6 col-xl-3 animate__animated animate__fadeInUp" style={{ animationDelay: '0.2s' }}>
          <div
            className={`transporte-feature-card w-100 ${!canViewRecorrido ? 'card-disabled' : ''}`}
            style={{ 
              borderTop: '4px solid #10b981',
              background: 'linear-gradient(180deg, #ffffff 0%, #f7fdfa 100%)'
            }}
            onClick={() => canViewRecorrido && setVistaActual('Visor')}
          >
            <i className="bi bi-eye-fill transporte-bg-watermark" style={{ color: '#059669' }}></i>
            
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="transporte-card-icon shadow-xs" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                <i className="bi bi-eye-fill"></i>
              </div>
              <span className="badge rounded-pill px-2.5 py-1" style={{ background: '#d1fae5', color: '#047857', fontSize: '0.7rem', fontWeight: 700 }}>
                Comunidad
              </span>
            </div>

            <h4 className="fw-bold text-dark mb-1" style={{ fontSize: '1.15rem' }}>Visor de Recorrido</h4>
            <p className="text-muted small mb-3" style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>
              Seguimiento en vivo para representantes y docentes del estado y avance de las unidades.
            </p>
            
            <div className="mt-auto">
              {!canViewRecorrido ? (
                <span className="badge bg-secondary rounded-pill" style={{ fontSize: '0.68rem' }}>
                  <i className="bi bi-lock-fill me-1"></i>Sin permiso
                </span>
              ) : (
                <div className="pt-2 border-top d-flex align-items-center justify-content-between">
                  <span className="fw-bold small d-flex align-items-center gap-1" style={{ color: '#059669' }}>
                    Entrar al submódulo <i className="bi bi-arrow-right"></i>
                  </span>
                  <i className="bi bi-chevron-right text-muted small"></i>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Tarjeta 4: Mis Rutas y WhatsApp ── */}
        <div className="col-12 col-sm-6 col-xl-3 animate__animated animate__fadeInUp" style={{ animationDelay: '0.3s' }}>
          <div
            className="transporte-feature-card w-100"
            style={{ 
              borderTop: '4px solid #2563eb',
              background: 'linear-gradient(180deg, #ffffff 0%, #f8faff 100%)'
            }}
            onClick={() => setShowList(!showList)}
          >
            <i className="bi bi-folder-symlink-fill transporte-bg-watermark" style={{ color: '#2563eb' }}></i>
            
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="transporte-card-icon shadow-xs" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                <i className="bi bi-whatsapp"></i>
              </div>
              <span className="badge rounded-pill px-2.5 py-1" style={{ background: '#dbeafe', color: '#1e40af', fontSize: '0.7rem', fontWeight: 700 }}>
                {misRutasAsignadas.length} Rutas
              </span>
            </div>

            <h4 className="fw-bold text-dark mb-1" style={{ fontSize: '1.15rem' }}>Mis Rutas Oficiales</h4>
            <p className="text-muted small mb-3" style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>
              Difusión rápida del rutograma oficial con las familias directamente por WhatsApp.
            </p>
            
            {showList ? (
              <div className="mt-2 animate__animated animate__slideInDown text-start" onClick={e => e.stopPropagation()}>
                {misRutasAsignadas.length === 0 ? (
                  <div className="text-center text-muted small py-3 bg-light rounded-3 border">
                    <i className="bi bi-info-circle me-1"></i> No hay rutas asignadas a tu cuenta
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {misRutasAsignadas.map(r => (
                      <div key={r.id} className="d-flex justify-content-between align-items-center p-2.5 bg-white rounded-3 border shadow-xs">
                        <div className="text-start pe-2" style={{ minWidth: 0, flex: 1 }}>
                          <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.82rem' }}>{r.nombre}</div>
                          <div className="text-muted text-truncate" style={{ fontSize: '0.7rem' }}>
                            <i className="bi bi-person me-1"></i>Chofer: {r.chofer_nombre || 'Sin asignar'}
                          </div>
                        </div>
                        <button 
                          className="btn btn-sm btn-success rounded-pill px-2.5 py-1 fw-bold d-flex align-items-center gap-1 shadow-xs flex-shrink-0"
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => compartirRuta(r)}
                          title="Compartir rutograma por WhatsApp"
                        >
                          <i className="bi bi-whatsapp"></i>
                          <span>Enviar</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-auto pt-2 border-top d-flex align-items-center justify-content-between">
                <span className="fw-bold small d-flex align-items-center gap-1" style={{ color: '#2563eb' }}>
                  Ver mis rutas ({misRutasAsignadas.length}) <i className="bi bi-chevron-down"></i>
                </span>
                <i className="bi bi-share text-muted small"></i>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
