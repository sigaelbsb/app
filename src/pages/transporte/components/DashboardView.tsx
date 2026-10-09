import React, { useState } from 'react';

interface DashboardViewProps {
  canManageParadas: boolean;
  canManageRutas: boolean;
  canOperateTracking: boolean;
  canViewRecorrido: boolean;
  setVistaActual: (vista: any) => void;
  setConfigTab: (tab: 'Paradas' | 'Rutas' | 'Asignacion') => void;
  AnimatedBusSVG: React.ComponentType<{ size?: number; className?: string }>;
  rutas: any[];
  user: any;
  compartirRuta: (ruta: any) => void;
  escCodigo?: 'sb' | 'lb';
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
  compartirRuta,
  escCodigo
}) => {
  const [showList, setShowList] = useState(false);

  // Filtrar rutas según rol del usuario y asignación
  const misRutasAsignadas = (user?.rol === 'SuperAdmin' || canManageRutas)
    ? rutas
    : rutas.filter(r => r.docente_id === user?.id_usuario || r.docente_id === user?.id);

  const rutasActivas = rutas.filter(r => r.activo !== false).length;
  const choferesAsignados = rutas.filter(r => r.chofer_nombre).length;

  return (
    <div className="animate__animated animate__fadeIn">
      {/* ── BARRA RESUMEN DE TELEMETRÍA RÁPIDA VIBRANTE ── */}
      <div className="row g-2 g-md-3 mb-4">
        <div className="col-6 col-lg-3">
          <div 
            className="transporte-kpi-card"
            style={{ 
              borderLeft: '4px solid #2563eb',
              background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)' 
            }}
          >
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-white flex-shrink-0" 
              style={{ 
                width: '46px', 
                height: '46px', 
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
                fontSize: '1.3rem',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
              }}
            >
              <i className="bi bi-signpost-split-fill"></i>
            </div>
            <div className="min-w-0">
              <div className="fw-black text-dark fs-4 line-height-1" style={{ letterSpacing: '-0.5px' }}>{rutas.length}</div>
              <div className="text-secondary fw-semibold text-truncate" style={{ fontSize: '0.74rem' }}>Rutas Diseñadas</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div 
            className="transporte-kpi-card"
            style={{ 
              borderLeft: '4px solid #10b981',
              background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' 
            }}
          >
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-white flex-shrink-0" 
              style={{ 
                width: '46px', 
                height: '46px', 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                fontSize: '1.3rem',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
              }}
            >
              <i className="bi bi-check2-circle"></i>
            </div>
            <div className="min-w-0">
              <div className="fw-black text-dark fs-4 line-height-1" style={{ letterSpacing: '-0.5px' }}>{rutasActivas}</div>
              <div className="text-secondary fw-semibold text-truncate" style={{ fontSize: '0.74rem' }}>Rutas Activas</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div 
            className="transporte-kpi-card"
            style={{ 
              borderLeft: '4px solid #f59e0b',
              background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)' 
            }}
          >
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-white flex-shrink-0" 
              style={{ 
                width: '46px', 
                height: '46px', 
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                fontSize: '1.3rem',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
              }}
            >
              <i className="bi bi-person-badge-fill"></i>
            </div>
            <div className="min-w-0">
              <div className="fw-black text-dark fs-4 line-height-1" style={{ letterSpacing: '-0.5px' }}>{choferesAsignados}</div>
              <div className="text-secondary fw-semibold text-truncate" style={{ fontSize: '0.74rem' }}>Choferes Activos</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div 
            className="transporte-kpi-card"
            style={{ 
              borderLeft: '4px solid #ef4444',
              background: 'linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)' 
            }}
          >
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-white flex-shrink-0" 
              style={{ 
                width: '46px', 
                height: '46px', 
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                fontSize: '1.3rem',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)'
              }}
            >
              <i className="bi bi-broadcast"></i>
            </div>
            <div className="min-w-0">
              <div className="fw-black text-dark fs-4 line-height-1 d-flex align-items-center gap-1.5" style={{ letterSpacing: '-0.5px' }}>
                <span className="d-inline-block rounded-circle bg-success animate__animated animate__pulse animate__infinite" style={{ width: '8px', height: '8px' }}></span>
                <span>En Vivo</span>
              </div>
              <div className="text-secondary fw-semibold text-truncate" style={{ fontSize: '0.74rem' }}>Despacho Satelital</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CUADRÍCULA DE LOS 5 SUBMÓDULOS DE TRANSPORTE ESCOLAR (DINÁMICAS & VIBRANTES) ── */}
      <div className="row g-3 g-md-4">
        {/* ── Submódulo 1: Coordinación y Rutas ── */}
        {(canManageParadas || canManageRutas) && (
          <div className="col-12 col-sm-6 col-xl-4 animate__animated animate__fadeInUp">
            <div
              className="transporte-feature-card w-100"
              style={{ 
                borderTop: '5px solid #2563eb',
                borderColor: '#bfdbfe',
                background: 'linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)'
              }}
              onClick={() => setVistaActual('coordinacion')}
            >
              <i className="bi bi-sliders transporte-bg-watermark" style={{ color: '#2563eb' }}></i>
              
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div 
                  className="transporte-card-icon text-white" 
                  style={{ 
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
                    boxShadow: '0 8px 18px rgba(37, 99, 235, 0.38)' 
                  }}
                >
                  <i className="bi bi-sliders"></i>
                </div>
                <span className="badge rounded-pill px-3 py-1 fw-bold" style={{ background: '#dbeafe', color: '#1e40af', fontSize: '0.72rem' }}>
                  Submódulo 1
                </span>
              </div>

              <h4 className="fw-black text-dark mb-1" style={{ fontSize: '1.18rem', letterSpacing: '-0.3px' }}>Coordinación y Rutas</h4>
              <p className="text-secondary small mb-3" style={{ fontSize: '0.84rem', lineHeight: '1.45' }}>
                Catálogo de paradas, diseño y orden de rutas, asignación de chofer y docente con teléfono, salida masiva, reinicio y 4 tipos de cambios de ruta.
              </p>
              
              <div className="d-flex gap-1.5 mb-3 flex-wrap">
                <span className="badge rounded-pill bg-white text-primary border border-primary border-opacity-25 shadow-xs px-2.5 py-1" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                  <i className="bi bi-geo-alt-fill me-1 text-danger"></i>Paradas
                </span>
                <span className="badge rounded-pill bg-white text-primary border border-primary border-opacity-25 shadow-xs px-2.5 py-1" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                  <i className="bi bi-signpost-2-fill me-1 text-primary"></i>Rutas Ordenadas
                </span>
                <span className="badge rounded-pill bg-white text-success border border-success border-opacity-25 shadow-xs px-2.5 py-1" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                  <i className="bi bi-arrow-left-right me-1 text-success"></i>Cambios de Ruta
                </span>
              </div>

              <div className="mt-auto pt-2.5 border-top d-flex align-items-center justify-content-between" style={{ borderColor: 'rgba(37, 99, 235, 0.15)' }}>
                <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: '#1d4ed8' }}>
                  Abrir Coordinación <i className="bi bi-arrow-right"></i>
                </span>
                <i className="bi bi-chevron-right text-primary small"></i>
              </div>
            </div>
          </div>
        )}

        {/* ── Submódulo 2: Operación y Guardia ── */}
        <div className="col-12 col-sm-6 col-xl-4 animate__animated animate__fadeInUp" style={{ animationDelay: '0.04s' }}>
          <div
            className={`transporte-feature-card w-100 ${!canOperateTracking ? 'card-disabled' : ''}`}
            style={{ 
              borderTop: '5px solid #10b981',
              borderColor: '#bbf7d0',
              background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)'
            }}
            onClick={() => canOperateTracking && setVistaActual('operacion')}
          >
            <i className="bi bi-broadcast transporte-bg-watermark" style={{ color: '#059669' }}></i>
            
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div 
                className="transporte-card-icon text-white" 
                style={{ 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                  boxShadow: '0 8px 18px rgba(16, 185, 129, 0.38)' 
                }}
              >
                <i className="bi bi-broadcast"></i>
              </div>
              <span className="badge rounded-pill px-3 py-1 fw-bold" style={{ background: '#bbf7d0', color: '#14532d', fontSize: '0.72rem' }}>
                Submódulo 2
              </span>
            </div>

            <h4 className="fw-black text-dark mb-1" style={{ fontSize: '1.18rem', letterSpacing: '-0.3px' }}>Operación y Guardia</h4>
            <p className="text-secondary small mb-3" style={{ fontSize: '0.84rem', lineHeight: '1.45' }}>
              Control del autobús en ruta para el docente de guardia: marcado de paradas, desvíos en caliente, lista con verde (incluidos) y rojo (excluidos), asistencia y novedades.
            </p>
            
            <div className="d-flex gap-1.5 mb-3 flex-wrap">
              <span className="badge rounded-pill bg-white text-success border border-success border-opacity-25 shadow-xs px-2.5 py-1" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                <i className="bi bi-check2-circle me-1 text-success"></i>Marcado de Paso
              </span>
              <span className="badge rounded-pill bg-white text-dark border shadow-xs px-2.5 py-1" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                🟢 Verde / 🔴 Rojo
              </span>
              <span className="badge rounded-pill bg-white text-danger border border-danger border-opacity-25 shadow-xs px-2.5 py-1" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                <i className="bi bi-person-x-fill me-1 text-danger"></i>Inasistencias
              </span>
            </div>

            <div className="mt-auto pt-2.5 border-top d-flex align-items-center justify-content-between" style={{ borderColor: 'rgba(16, 185, 129, 0.15)' }}>
              <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: '#059669' }}>
                Entrar a Operación <i className="bi bi-arrow-right"></i>
              </span>
              <i className="bi bi-chevron-right text-success small"></i>
            </div>
          </div>
        </div>

        {/* ── Submódulo 3: Monitoreo en Vivo (Representantes) ── */}
        <div className="col-12 col-sm-6 col-xl-4 animate__animated animate__fadeInUp" style={{ animationDelay: '0.08s' }}>
          <div
            className={`transporte-feature-card w-100 ${!canViewRecorrido ? 'card-disabled' : ''}`}
            style={{ 
              borderTop: '5px solid #0284c7',
              borderColor: '#bae6fd',
              background: 'linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%)'
            }}
            onClick={() => canViewRecorrido && setVistaActual('visor')}
          >
            <i className="bi bi-eye-fill transporte-bg-watermark" style={{ color: '#0284c7' }}></i>
            
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div 
                className="transporte-card-icon text-white" 
                style={{ 
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', 
                  boxShadow: '0 8px 18px rgba(2, 132, 199, 0.38)' 
                }}
              >
                <i className="bi bi-eye-fill"></i>
              </div>
              <span className="badge rounded-pill px-3 py-1 fw-bold" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem' }}>
                Submódulo 3
              </span>
            </div>

            <h4 className="fw-black text-dark mb-1" style={{ fontSize: '1.18rem', letterSpacing: '-0.3px' }}>Monitoreo en Vivo</h4>
            <p className="text-secondary small mb-3" style={{ fontSize: '0.84rem', lineHeight: '1.45' }}>
              Submódulo exclusivo para representantes y familias: seguimiento satelital de ida y retorno filtrado solo a sus representados, stepper y contacto del docente.
            </p>
            
            <div className="d-flex gap-1.5 mb-3 flex-wrap">
              <span className="badge rounded-pill bg-white text-info border border-info border-opacity-25 shadow-xs px-2.5 py-1" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                🌅 Casa ➡️ Escuela
              </span>
              <span className="badge rounded-pill bg-white text-warning-emphasis border border-warning border-opacity-25 shadow-xs px-2.5 py-1" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                🌇 Escuela ➡️ Casa
              </span>
              <span className="badge rounded-pill bg-white text-success border border-success border-opacity-25 shadow-xs px-2.5 py-1" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                📞 Teléfono Docente
              </span>
            </div>

            <div className="mt-auto pt-2.5 border-top d-flex align-items-center justify-content-between" style={{ borderColor: 'rgba(2, 132, 199, 0.15)' }}>
              <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: '#0284c7' }}>
                Ver Monitoreo <i className="bi bi-arrow-right"></i>
              </span>
              <i className="bi bi-chevron-right text-info small"></i>
            </div>
          </div>
        </div>

        {/* ── Submódulo 4: Censo y Listados Oficiales (Carta) ── */}
        <div className="col-12 col-sm-6 col-xl-4 animate__animated animate__fadeInUp" style={{ animationDelay: '0.12s' }}>
          <div
            className="transporte-feature-card w-100"
            style={{ 
              borderTop: '5px solid #8b5cf6',
              borderColor: '#ddd6fe',
              background: 'linear-gradient(180deg, #ffffff 0%, #faf5ff 100%)'
            }}
            onClick={() => setVistaActual('listados')}
          >
            <i className="bi bi-file-earmark-text-fill transporte-bg-watermark" style={{ color: '#7c3aed' }}></i>
            
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div 
                className="transporte-card-icon text-white" 
                style={{ 
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', 
                  boxShadow: '0 8px 18px rgba(139, 92, 246, 0.38)' 
                }}
              >
                <i className="bi bi-file-earmark-text-fill"></i>
              </div>
              <span className="badge rounded-pill px-3 py-1 fw-bold" style={{ background: '#ede9fe', color: '#6d28d9', fontSize: '0.72rem' }}>
                Submódulo 4
              </span>
            </div>

            <h4 className="fw-black text-dark mb-1" style={{ fontSize: '1.18rem', letterSpacing: '-0.3px' }}>Censo y Listados Carta</h4>
            <p className="text-secondary small mb-3" style={{ fontSize: '0.84rem', lineHeight: '1.45' }}>
              Visualizar y editar ruta/parada de estudiantes in-situ (aun sin ficha completa) y descargar listados oficiales en formato Constancia ajustados a Hoja Tipo Carta.
            </p>
            
            <div className="d-flex gap-1.5 mb-3 flex-wrap">
              <span className="badge rounded-pill bg-white text-primary border border-primary border-opacity-25 shadow-xs px-2.5 py-1" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                <i className="bi bi-pencil-fill me-1 text-primary"></i>Edición In-situ
              </span>
              <span className="badge rounded-pill bg-white text-success border border-success border-opacity-25 shadow-xs px-2.5 py-1" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                <i className="bi bi-printer-fill me-1 text-success"></i>Hoja Carta
              </span>
              <span className="badge rounded-pill bg-white text-danger border border-danger border-opacity-25 shadow-xs px-2.5 py-1" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                ⚠️ Alerta Teléfonos
              </span>
            </div>

            <div className="mt-auto pt-2.5 border-top d-flex align-items-center justify-content-between" style={{ borderColor: 'rgba(139, 92, 246, 0.15)' }}>
              <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: '#7c3aed' }}>
                Generar Listados <i className="bi bi-arrow-right"></i>
              </span>
              <i className="bi bi-chevron-right text-muted small"></i>
            </div>
          </div>
        </div>

        {/* ── Submódulo 5: Estadísticas y Asistencia ── */}
        <div className="col-12 col-sm-6 col-xl-4 animate__animated animate__fadeInUp" style={{ animationDelay: '0.16s' }}>
          <div
            className="transporte-feature-card w-100"
            style={{ 
              borderTop: '5px solid #f59e0b',
              borderColor: '#fef08a',
              background: 'linear-gradient(180deg, #ffffff 0%, #fffbeb 100%)'
            }}
            onClick={() => setVistaActual('estadisticas')}
          >
            <i className="bi bi-bar-chart-fill transporte-bg-watermark" style={{ color: '#d97706' }}></i>
            
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div 
                className="transporte-card-icon text-white" 
                style={{ 
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                  boxShadow: '0 8px 18px rgba(245, 158, 11, 0.38)' 
                }}
              >
                <i className="bi bi-bar-chart-fill"></i>
              </div>
              <span className="badge rounded-pill px-3 py-1 fw-bold" style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.72rem' }}>
                Submódulo 5
              </span>
            </div>

            <h4 className="fw-black text-dark mb-1" style={{ fontSize: '1.18rem', letterSpacing: '-0.3px' }}>Estadísticas y Asistencia</h4>
            <p className="text-secondary small mb-3" style={{ fontSize: '0.84rem', lineHeight: '1.45' }}>
              Registro diario y detallado por ruta, parada y asistencia de los estudiantes, bitácora de inasistencias por fecha y reporte de situaciones de los docentes.
            </p>
            
            <div className="d-flex gap-1.5 mb-3 flex-wrap">
              <span className="badge rounded-pill bg-white text-primary border border-primary border-opacity-25 shadow-xs px-2.5 py-1" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                <i className="bi bi-calendar3 me-1 text-primary"></i>Diario & Histórico
              </span>
              <span className="badge rounded-pill bg-white text-success border border-success border-opacity-25 shadow-xs px-2.5 py-1" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                <i className="bi bi-check2-all me-1 text-success"></i>Asistencia %
              </span>
              <span className="badge rounded-pill bg-white text-warning-emphasis border border-warning border-opacity-25 shadow-xs px-2.5 py-1" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                <i className="bi bi-journal-text me-1 text-warning"></i>Novedades
              </span>
            </div>

            <div className="mt-auto pt-2.5 border-top d-flex align-items-center justify-content-between" style={{ borderColor: 'rgba(245, 158, 11, 0.15)' }}>
              <span className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: '#d97706' }}>
                Ver Estadísticas <i className="bi bi-arrow-right"></i>
              </span>
              <i className="bi bi-chevron-right text-warning small"></i>
            </div>
          </div>
        </div>

        {/* ── Tarjeta Extra: Difusión Rutograma WhatsApp ── */}
        <div className="col-12 col-sm-6 col-xl-4 animate__animated animate__fadeInUp" style={{ animationDelay: '0.2s' }}>
          <div
            className="transporte-feature-card w-100"
            style={{ 
              borderTop: '5px solid #16a34a',
              borderColor: '#bbf7d0',
              background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)'
            }}
            onClick={() => setShowList(!showList)}
          >
            <i className="bi bi-whatsapp transporte-bg-watermark" style={{ color: '#16a34a' }}></i>
            
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div 
                className="transporte-card-icon text-white" 
                style={{ 
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', 
                  boxShadow: '0 8px 18px rgba(22, 163, 74, 0.38)' 
                }}
              >
                <i className="bi bi-whatsapp"></i>
              </div>
              <span className="badge rounded-pill px-3 py-1 fw-bold" style={{ background: '#dcfce7', color: '#14532d', fontSize: '0.72rem' }}>
                {misRutasAsignadas.length} Rutas
              </span>
            </div>

            <h4 className="fw-black text-dark mb-1" style={{ fontSize: '1.18rem', letterSpacing: '-0.3px' }}>Difusión WhatsApp</h4>
            <p className="text-secondary small mb-3" style={{ fontSize: '0.84rem', lineHeight: '1.45' }}>
              Envío rápido del rutograma consolidado oficial y avisos de despacho directamente por WhatsApp a las familias y docentes.
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
                <span className="fw-bold small d-flex align-items-center gap-1" style={{ color: '#16a34a' }}>
                  Ver rutas para difusión ({misRutasAsignadas.length}) <i className="bi bi-chevron-down"></i>
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
