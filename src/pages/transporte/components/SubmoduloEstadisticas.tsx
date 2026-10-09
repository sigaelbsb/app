import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';

interface SubmoduloEstadisticasProps {
  onBack?: () => void;
  escCodigo: 'sb' | 'lb';
  rutas: any[];
  paradas: any[];
  estudiantes: any[];
  docentes: any[];
}

export const SubmoduloEstadisticas: React.FC<SubmoduloEstadisticasProps> = ({
  onBack,
  escCodigo,
  rutas,
  paradas,
  estudiantes,
  docentes
}) => {
  const hoyStr = new Date().toISOString().split('T')[0];
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(hoyStr);
  const [operacionesFecha, setOperacionesFecha] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rutaFiltro, setRutaFiltro] = useState<string>('todas');

  // Cargar operaciones de transporte registradas en la fecha seleccionada
  useEffect(() => {
    const cargarOperacionesFecha = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('transporte_operaciones')
          .select('*')
          .eq('escuela_codigo', escCodigo)
          .eq('fecha', fechaSeleccionada);

        if (error) throw error;
        setOperacionesFecha(data || []);
      } catch (err) {
        console.error('Error cargando estadísticas de transporte:', err);
        setOperacionesFecha([]);
      } finally {
        setLoading(false);
      }
    };

    cargarOperacionesFecha();
  }, [fechaSeleccionada, escCodigo]);

  // Consolidar datos estadísticos por ruta en la fecha
  const estadisticasPorRuta = useMemo(() => {
    return rutas.map(r => {
      const rutaNorm = String(r.nombre || '').trim().toLowerCase();
      
      // Operación de ida y retorno en la fecha
      const opIda = operacionesFecha.find(o => o.ruta_id === r.id && o.sentido === 'Casa - Escuela');
      const opRetorno = operacionesFecha.find(o => o.ruta_id === r.id && o.sentido === 'Escuela - Casa');
      const opGeneral = opRetorno || opIda;

      // Estudiantes asignados a esta ruta
      const alumnosRuta = (estudiantes || []).filter(est => {
        const d = est.datos_actualizados || {};
        return String(d.ruta_transporte || '').trim().toLowerCase() === rutaNorm;
      });

      // Asistencia tomada en la operación (si existe)
      const asistenciaIda = opIda?.historial_paradas?._asistencia || {};
      const asistenciaRetorno = opRetorno?.historial_paradas?._asistencia || {};
      const asistenciaCombinada = { ...asistenciaIda, ...asistenciaRetorno };

      const presentes = alumnosRuta.filter(a => asistenciaCombinada[a.id] === 'presente').length;
      const inasistentes = alumnosRuta.filter(a => asistenciaCombinada[a.id] === 'ausente');

      // Novedades de esta ruta en la fecha
      const novsIda = opIda?.historial_paradas?._novedades || [];
      const novsRetorno = opRetorno?.historial_paradas?._novedades || [];
      const novedadesRuta = [...novsIda, ...novsRetorno];

      // Paradas de la ruta
      let pids: string[] = [];
      if (Array.isArray(r.paradas_json)) pids = r.paradas_json;
      else if (typeof r.paradas_json === 'string') {
        try { pids = JSON.parse(r.paradas_json); } catch (e) {}
      }

      // Conteo de estudiantes por parada
      const paradaConteo: Record<string, number> = {};
      alumnosRuta.forEach(a => {
        const pNom = a.datos_actualizados?.parada_transporte || 'General';
        paradaConteo[pNom] = (paradaConteo[pNom] || 0) + 1;
      });

      const totalAsignados = alumnosRuta.length;
      const porcentaje = totalAsignados > 0 ? Math.round((presentes / totalAsignados) * 100) : 0;

      const docente = docentes.find(d => d.id_usuario === r.docente_id);

      return {
        ruta: r,
        docente,
        totalAsignados,
        presentes,
        inasistentes,
        porcentajeAsistencia: porcentaje,
        novedades: novedadesRuta,
        paradaConteo,
        totalParadas: pids.length,
        opIda,
        opRetorno,
        haOperado: !!(opIda || opRetorno)
      };
    });
  }, [rutas, operacionesFecha, estudiantes, docentes]);

  // Rutas filtradas
  const rutasFiltradas = estadisticasPorRuta.filter(item => {
    if (rutaFiltro === 'todas') return true;
    return item.ruta.id === rutaFiltro;
  });

  // Métricas globales
  const totalRutasDespachadas = estadisticasPorRuta.filter(item => item.haOperado).length;
  const totalEstudiantesAsignados = estadisticasPorRuta.reduce((acc, curr) => acc + curr.totalAsignados, 0);
  const totalEstudiantesPresentes = estadisticasPorRuta.reduce((acc, curr) => acc + curr.presentes, 0);
  const totalEstudiantesAusentes = estadisticasPorRuta.reduce((acc, curr) => acc + curr.inasistentes.length, 0);
  const totalNovedadesDia = estadisticasPorRuta.reduce((acc, curr) => acc + curr.novedades.length, 0);
  const tasaGeneralAsistencia = totalEstudiantesAsignados > 0 
    ? Math.round((totalEstudiantesPresentes / totalEstudiantesAsignados) * 100) 
    : 0;

  return (
    <div className="transporte-submod-card card-stat animate__animated animate__fadeInRight mb-4">
      {/* ── BARRA SUPERIOR DEL SUBMÓDULO ── */}
      <div className="transporte-submod-card-header">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <div className="d-flex align-items-center gap-2.5">
            {onBack && (
              <button 
                type="button"
                className="btn btn-sm btn-white border rounded-pill px-3 py-1.5 fw-bold text-dark d-flex align-items-center gap-1.5 shadow-xs hover-efecto"
                style={{ fontSize: '0.82rem' }}
                onClick={onBack}
                title="Volver al Dashboard"
              >
                <i className="bi bi-arrow-left text-primary"></i>
                <span>Volver</span>
              </button>
            )}
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-white flex-shrink-0"
              style={{
                width: '42px',
                height: '42px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)'
              }}
            >
              <i className="bi bi-bar-chart-line-fill fs-5"></i>
            </div>
            <div>
              <h5 className="fw-black text-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: '1.2rem', letterSpacing: '-0.3px' }}>
                <span>Estadísticas y Asistencia Diaria</span>
                <span 
                  className="badge rounded-pill fw-bold px-2.5 py-0.5 text-white shadow-xs" 
                  style={{ 
                    background: escCodigo === 'sb' ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'linear-gradient(135deg, #0284c7 0%, #0066ff 100%)',
                    fontSize: '0.72rem' 
                  }}
                >
                  {escCodigo === 'sb' ? 'Sede SB' : 'Sede LB'}
                </span>
              </h5>
              <small className="text-secondary fw-semibold" style={{ fontSize: '0.78rem' }}>
                Registro detallado y estadístico por ruta, parada y control de asistencia de estudiantes por día.
              </small>
            </div>
          </div>

          {/* Selector de Fecha */}
          <div className="d-flex align-items-center gap-2">
            <label className="small text-muted fw-bold mb-0 text-nowrap">
              <i className="bi bi-calendar3 text-primary me-1"></i>Fecha de Registro:
            </label>
            <input
              type="date"
              className="form-control form-control-sm rounded-pill fw-bold bg-light border shadow-xs"
              style={{ width: 160 }}
              value={fechaSeleccionada}
              onChange={e => setFechaSeleccionada(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card-body p-3 p-md-4">
        {/* ── BARRA RESUMEN DE TELEMETRÍA Y ASISTENCIA DEL DÍA ── */}
        <div className="row g-2 g-md-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center text-primary" style={{ width: '42px', height: '42px', background: '#eff6ff', fontSize: '1.25rem' }}>
                <i className="bi bi-bus-front-fill"></i>
              </div>
              <div className="min-w-0">
                <div className="fw-bold text-dark fs-5 line-height-1">{totalRutasDespachadas} / {rutas.length}</div>
                <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>Rutas Despachadas Hoy</div>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center text-success" style={{ width: '42px', height: '42px', background: '#f0fdf4', fontSize: '1.25rem' }}>
                <i className="bi bi-check-circle-fill"></i>
              </div>
              <div className="min-w-0">
                <div className="fw-bold text-dark fs-5 line-height-1">{totalEstudiantesPresentes}</div>
                <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>Pasajeros Presentes</div>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center text-danger" style={{ width: '42px', height: '42px', background: '#fef2f2', fontSize: '1.25rem' }}>
                <i className="bi bi-x-circle-fill"></i>
              </div>
              <div className="min-w-0">
                <div className="fw-bold text-dark fs-5 line-height-1">{totalEstudiantesAusentes}</div>
                <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>Inasistencias Registradas</div>
              </div>
            </div>
          </div>

          <div className="col-6 col-md-3">
            <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3">
              <div className="rounded-3 d-flex align-items-center justify-content-center text-warning" style={{ width: '42px', height: '42px', background: '#fffbeb', fontSize: '1.25rem' }}>
                <i className="bi bi-exclamation-triangle-fill"></i>
              </div>
              <div className="min-w-0">
                <div className="fw-bold text-dark fs-5 line-height-1">{totalNovedadesDia}</div>
                <div className="text-muted small text-truncate" style={{ fontSize: '0.72rem' }}>Novedades Reportadas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtro por Ruta */}
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-table text-primary"></i>
            <span>Detalle Estadístico por Ruta ({rutasFiltradas.length})</span>
          </h6>

          <div style={{ minWidth: 220 }}>
            <select
              className="form-select form-select-sm rounded-pill bg-light border fw-bold"
              value={rutaFiltro}
              onChange={e => setRutaFiltro(e.target.value)}
            >
              <option value="todas">-- Todas las rutas escolares --</option>
              {rutas.map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── TABLA PRINCIPAL DE ESTADÍSTICAS POR RUTA ── */}
        {loading ? (
          <div className="text-center py-5 text-muted">
            <div className="spinner-border text-primary mb-2" role="status"></div>
            <div>Cargando estadísticas del día...</div>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3 mb-4">
            {rutasFiltradas.map(item => (
              <div key={item.ruta.id} className="card border rounded-4 shadow-xs overflow-hidden bg-white">
                <div className="card-header bg-light bg-opacity-75 p-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary rounded-circle p-2">
                      <i className="bi bi-bus-front-fill text-white"></i>
                    </span>
                    <div>
                      <h6 className="fw-bold text-dark mb-0">{item.ruta.nombre}</h6>
                      <small className="text-muted">
                        Chofer: <b>{item.ruta.chofer_nombre || 'Sin chofer'}</b> &bull; Docente: <b>{item.docente?.nombre_completo || 'Sin docente'}</b>
                        {item.docente?.telefono && ` (${item.docente.telefono})`}
                      </small>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className="badge bg-white border text-dark px-2.5 py-1 fw-bold">
                      👥 {item.totalAsignados} Estudiantes
                    </span>
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 fw-bold">
                      ✅ {item.presentes} Presentes
                    </span>
                    <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1 fw-bold">
                      ❌ {item.inasistentes.length} Inasistentes
                    </span>
                    <span className="badge bg-primary text-white px-2.5 py-1 fw-bold">
                      {item.porcentajeAsistencia}% Asistencia
                    </span>
                  </div>
                </div>

                <div className="card-body p-3">
                  <div className="row g-3">
                    {/* Demanda por Paradas de la Ruta */}
                    <div className="col-12 col-md-6 border-md-end">
                      <div className="fw-bold small text-dark mb-2 d-flex align-items-center gap-1">
                        <i className="bi bi-geo-alt-fill text-warning"></i>
                        <span>Distribución de Demanda por Parada ({item.totalParadas} paradas)</span>
                      </div>
                      <div className="d-flex flex-wrap gap-1.5" style={{ maxHeight: 150, overflowY: 'auto' }}>
                        {Object.entries(item.paradaConteo).length === 0 ? (
                          <div className="text-muted extra-small fst-italic">Sin estudiantes registrados en paradas.</div>
                        ) : (
                          Object.entries(item.paradaConteo).map(([paradaNom, cant]) => (
                            <span key={paradaNom} className="badge bg-light text-dark border p-2 rounded-3 small">
                              📍 <b>{paradaNom}</b>: <span className="text-primary fw-bold">{cant}</span> alumnos
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Inasistencias y Novedades de la Ruta */}
                    <div className="col-12 col-md-6">
                      <div className="fw-bold small text-danger mb-2 d-flex align-items-center gap-1">
                        <i className="bi bi-person-x-fill"></i>
                        <span>Estudiantes Inasistentes Hoy ({item.inasistentes.length})</span>
                      </div>

                      {item.inasistentes.length === 0 ? (
                        <div className="text-success extra-small bg-success bg-opacity-10 p-2 rounded-3 border border-success border-opacity-25 fw-semibold">
                          <i className="bi bi-check-circle-fill me-1"></i>
                          {item.haOperado ? '¡Asistencia completa! Ningún estudiante inasistente registrado.' : 'Ruta sin registros de inasistencias en esta fecha.'}
                        </div>
                      ) : (
                        <div className="d-flex flex-column gap-1.5" style={{ maxHeight: 150, overflowY: 'auto' }}>
                          {item.inasistentes.map(ina => {
                            const d = ina.datos_actualizados || {};
                            const tlf = d.representante_telefono || ina.representante_telefono;

                            return (
                              <div key={ina.id} className="p-2 bg-light border border-danger border-opacity-25 rounded-3 d-flex justify-content-between align-items-center small">
                                <div>
                                  <div className="fw-bold text-dark">{ina.nombres_estudiante} {ina.apellidos_estudiante}</div>
                                  <small className="text-muted">Parada: {d.parada_transporte || 'General'} &bull; Grado: {ina.grado_actual || ''}</small>
                                </div>
                                <div className="text-end">
                                  {tlf ? (
                                    <a href={`tel:${tlf}`} className="badge bg-white text-danger border text-decoration-none">
                                      📞 {tlf}
                                    </a>
                                  ) : (
                                    <span className="badge bg-light text-muted border">Sin tlf</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Novedades reportadas */}
                      {item.novedades.length > 0 && (
                        <div className="mt-3 pt-2 border-top">
                          <div className="fw-bold small text-warning-emphasis mb-1">
                            <i className="bi bi-journal-text me-1"></i>
                            Novedades reportadas por docente ({item.novedades.length})
                          </div>
                          {item.novedades.map((nov: any, nIdx: number) => (
                            <div key={nIdx} className="extra-small text-muted bg-light p-1.5 rounded border mb-1">
                              <b>{nov.hora}</b> &bull; {nov.texto} ({nov.docente})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
