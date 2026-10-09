import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gestionDiariaService, type ReporteGestionDiaria } from '../../services/gestionDiariaService';
import { ChamiloBreadcrumb } from '../../components/chamilo';
import { ModalDetalleReporteGestion } from '../../components/ModalDetalleReporteGestion';

export const AprobacionGestionDiariaPage: React.FC = () => {
  const navigate = useNavigate();
  const [reportes, setReportes] = useState<ReporteGestionDiaria[]>([]);
  const [filtroTab, setFiltroTab] = useState<'pendientes' | 'aprobados' | 'rechazados' | 'todos'>('pendientes');
  const [filtroEscuela, setFiltroEscuela] = useState<'todas' | 'sb' | 'lb'>('todas');
  const [reporteSeleccionado, setReporteSeleccionado] = useState<ReporteGestionDiaria | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Usuario en sesión
  const userStr = localStorage.getItem('usuario_sigae');
  const usuario = userStr ? JSON.parse(userStr) : { nombre: 'Director / Aprobador', rol: 'Administrador' };

  const cargarReportes = async () => {
    setLoading(true);
    try {
      const todos = await gestionDiariaService.obtenerTodos();
      setReportes(todos);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReportes();
    const handleUpdate = () => cargarReportes();
    window.addEventListener('sigae-reportes-actualizados', handleUpdate);
    return () => window.removeEventListener('sigae-reportes-actualizados', handleUpdate);
  }, []);

  // Manejador de Aprobación
  const handleAprobar = async (rep: ReporteGestionDiaria) => {
    const Swal = (window as any).Swal;
    const confirm = Swal ? await Swal.fire({
      icon: 'question',
      title: '¿Aprobar y Publicar en el Carrusel?',
      html: `
        <p>La actividad <strong>"${rep.actividad}"</strong> se publicará de inmediato en el carrusel principal.</p>
        <span class="badge bg-primary-subtle text-primary border border-primary-subtle p-2">
          <i class="bi bi-clock-history me-1"></i> Duración programada: 1 semana (7 días activos)
        </span>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, Publicar en Carrusel',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#059669'
    }) : { isConfirmed: window.confirm('¿Aprobar y publicar en carrusel?') };

    if (confirm.isConfirmed) {
      await gestionDiariaService.aprobarReporte(rep.id, { nombre: usuario.nombre || 'Dirección General', rol: usuario.rol });
      if (Swal) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Reporte Aprobado',
          text: 'Publicado con éxito en el carrusel principal.',
          showConfirmButton: false,
          timer: 3000
        });
      }
      cargarReportes();
    }
  };

  // Manejador de Rechazo
  const handleRechazar = async (rep: ReporteGestionDiaria) => {
    const Swal = (window as any).Swal;
    let motivo = '';

    if (Swal) {
      const { value, isConfirmed } = await Swal.fire({
        title: 'Rechazar Reporte de Gestión',
        input: 'textarea',
        inputLabel: 'Motivo u observaciones para el docente/coordinador:',
        inputPlaceholder: 'Indica qué correcciones se requieren (ej. Corregir fotos o fecha)...',
        showCancelButton: true,
        confirmButtonText: 'Confirmar Rechazo',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc2626'
      });
      if (!isConfirmed) return;
      motivo = value || 'Rechazado por el equipo de supervisión.';
    } else {
      const resp = window.prompt('Indica el motivo del rechazo:');
      if (!resp) return;
      motivo = resp;
    }

    await gestionDiariaService.rechazarReporte(rep.id, motivo, { nombre: usuario.nombre || 'Dirección General' });
    if (Swal) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Reporte Rechazado',
        text: 'Se enviaron las observaciones al redactor.',
        showConfirmButton: false,
        timer: 3000
      });
    }
    cargarReportes();
  };

  // Alternar fijado en carrusel
  const handleToggleFijado = async (rep: ReporteGestionDiaria) => {
    await gestionDiariaService.toggleFijadoCarrusel(rep.id);
    cargarReportes();
  };

  // Filtrado de reportes
  const reportesFiltrados = reportes.filter((r) => {
    if (filtroEscuela !== 'todas' && r.escuela_codigo !== 'ambas' && r.escuela_codigo !== filtroEscuela) {
      return false;
    }
    if (filtroTab === 'pendientes') return r.estado === 'pendiente';
    if (filtroTab === 'aprobados') return r.estado === 'aprobado';
    if (filtroTab === 'rechazados') return r.estado === 'rechazado';
    return true;
  });

  const pendientesCount = reportes.filter(r => r.estado === 'pendiente').length;
  const aprobadosCount = reportes.filter(r => r.estado === 'aprobado').length;
  const rechazadosCount = reportes.filter(r => r.estado === 'rechazado').length;

  return (
    <div className="container-fluid p-3 p-md-4 animate__animated animate__fadeIn">
      
      {/* Breadcrumb */}
      <ChamiloBreadcrumb
        items={[
          { label: 'Dirección y Supervisión', url: '/categoria/Dirección y Sistema' },
          { label: 'Aprobación de Gestión Diaria' }
        ]}
      />

      {/* Cabecera Principal */}
      <div className="card border-0 shadow-xs rounded-4 mb-4 p-3 p-md-4 bg-white">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div 
              className="rounded-4 p-3 d-flex align-items-center justify-content-center shadow-xs"
              style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0066ff 100%)', color: '#fff', width: '56px', height: '56px' }}
            >
              <i className="bi bi-shield-check fs-3"></i>
            </div>
            <div>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill extra-small px-2 py-0.5 mb-1">
                Moderación & Control Editorial
              </span>
              <h4 className="fw-black mb-0 text-dark" style={{ letterSpacing: '-0.3px' }}>
                Aprobación de Gestión Diaria & Publicación en Carrusel
              </h4>
              <p className="text-muted small mb-0">
                Revisa, aprueba y modera las actividades cargadas por docentes y coordinadores antes de ser exhibidas en el panel principal.
              </p>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/categoria/Gestión Docente/Reporte de Gestión Diaria')}
              className="btn btn-outline-primary btn-sm rounded-pill px-3"
            >
              <i className="bi bi-plus-circle me-1"></i> Cargar Reporte
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-outline-secondary btn-sm rounded-pill px-3"
            >
              <i className="bi bi-arrow-left me-1"></i> Panel Principal
            </button>
          </div>
        </div>
      </div>

      {/* Pestañas de Filtro & Selector de Plantel */}
      <div className="card border-0 shadow-xs rounded-4 p-2.5 bg-white mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          
          <div className="d-flex align-items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFiltroTab('pendientes')}
              className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold transition-all ${
                filtroTab === 'pendientes' ? 'btn-warning text-dark shadow-xs' : 'btn-light text-muted'
              }`}
              style={{ fontSize: '0.78rem' }}
            >
              <i className="bi bi-hourglass-split me-1"></i>
              Pendientes ({pendientesCount})
            </button>

            <button
              type="button"
              onClick={() => setFiltroTab('aprobados')}
              className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold transition-all ${
                filtroTab === 'aprobados' ? 'btn-success text-white shadow-xs' : 'btn-light text-muted'
              }`}
              style={{ fontSize: '0.78rem' }}
            >
              <i className="bi bi-check-circle-fill me-1"></i>
              Aprobados en Carrusel ({aprobadosCount})
            </button>

            <button
              type="button"
              onClick={() => setFiltroTab('rechazados')}
              className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold transition-all ${
                filtroTab === 'rechazados' ? 'btn-danger text-white shadow-xs' : 'btn-light text-muted'
              }`}
              style={{ fontSize: '0.78rem' }}
            >
              <i className="bi bi-x-circle-fill me-1"></i>
              Rechazados ({rechazadosCount})
            </button>

            <button
              type="button"
              onClick={() => setFiltroTab('todos')}
              className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold transition-all ${
                filtroTab === 'todos' ? 'btn-dark text-white shadow-xs' : 'btn-light text-muted'
              }`}
              style={{ fontSize: '0.78rem' }}
            >
              Todos ({reportes.length})
            </button>
          </div>

          <div className="d-flex align-items-center gap-2">
            <label className="extra-small text-muted fw-bold">Plantel:</label>
            <select
              className="form-select form-select-sm rounded-pill"
              style={{ width: '190px', fontSize: '0.76rem' }}
              value={filtroEscuela}
              onChange={(e) => setFiltroEscuela(e.target.value as any)}
            >
              <option value="todas">Todas las Sedes</option>
              <option value="sb">U.E. Santa Bárbara</option>
              <option value="lb">U.E. Libertador Bolívar</option>
            </select>
          </div>

        </div>
      </div>

      {/* Lista de Reportes */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <div className="text-muted extra-small mt-2">Cargando reportes para moderación...</div>
        </div>
      ) : reportesFiltrados.length === 0 ? (
        <div className="card border-0 shadow-xs rounded-4 p-5 text-center bg-white">
          <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
          <h6 className="fw-bold text-dark">No hay reportes en este estado</h6>
          <p className="text-muted extra-small mb-3">
            {filtroTab === 'pendientes'
              ? 'No hay actividades pendientes de aprobación. Todo está al día.'
              : 'No se encontraron registros con los filtros seleccionados.'}
          </p>
          <button
            type="button"
            onClick={() => setFiltroTab('todos')}
            className="btn btn-outline-secondary btn-sm rounded-pill px-3 mx-auto"
          >
            Ver todos los reportes
          </button>
        </div>
      ) : (
        <div className="row g-3">
          {reportesFiltrados.map((rep) => {
            const isSb = rep.escuela_codigo === 'sb';
            const colorTema = isSb ? '#059669' : '#0284c7';

            return (
              <div key={rep.id} className="col-12">
                <div 
                  className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white hover-shadow transition-all"
                  style={{ borderLeft: `6px solid ${colorTema}` }}
                >
                  <div className="p-3.5 p-md-4">
                    <div className="row g-3 align-items-center">
                      
                      {/* Miniatura / Portada */}
                      <div className="col-12 col-md-3 col-lg-2">
                        <div 
                          className="rounded-3 overflow-hidden border shadow-xs position-relative bg-dark cursor-pointer"
                          style={{ height: '120px' }}
                          onClick={() => setReporteSeleccionado(rep)}
                          title="Clic para ampliar"
                        >
                          <img 
                            src={rep.banner_superior || rep.imagenes?.[0] || '/assets/img/gestion_diaria/reporte_ejemplo_collage.png'} 
                            alt={rep.actividad}
                            className="w-100 h-100 object-fit-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/img/gestion_diaria/reporte_ejemplo_collage.png';
                            }}
                          />
                          <span className="badge bg-black bg-opacity-75 text-white extra-small position-absolute bottom-0 end-0 m-1 rounded-pill">
                            <i className="bi bi-camera-fill me-0.5"></i> {rep.imagenes?.length || 1}
                          </span>
                        </div>
                      </div>

                      {/* Información Principal */}
                      <div className="col-12 col-md-6 col-lg-7">
                        <div className="d-flex align-items-center gap-1.5 flex-wrap mb-1">
                          <span 
                            className="badge text-white fw-bold extra-small rounded-pill px-2 py-0.5"
                            style={{ backgroundColor: colorTema }}
                          >
                            {rep.proceso}
                          </span>
                          <span className="badge bg-light text-dark border extra-small rounded-pill px-2 py-0.5">
                            📅 {rep.ano_escolar}
                          </span>
                          <span className="text-muted extra-small">
                            🗓️ {rep.fecha_actividad}
                          </span>

                          {/* Badge de Estado */}
                          {rep.estado === 'pendiente' && (
                            <span className="badge bg-warning text-dark extra-small rounded-pill px-2 py-0.5 fw-bold">
                              <i className="bi bi-hourglass-split me-1"></i>Pendiente de Aprobación
                            </span>
                          )}
                          {rep.estado === 'aprobado' && (
                            <span className="badge bg-success text-white extra-small rounded-pill px-2 py-0.5 fw-bold">
                              <i className="bi bi-check-circle-fill me-1"></i>Activo en Carrusel
                            </span>
                          )}
                          {rep.estado === 'rechazado' && (
                            <span className="badge bg-danger text-white extra-small rounded-pill px-2 py-0.5 fw-bold">
                              <i className="bi bi-x-circle-fill me-1"></i>Rechazado
                            </span>
                          )}
                        </div>

                        <h6 className="fw-black mb-1 text-dark" style={{ fontSize: '0.96rem' }}>
                          📚 {rep.actividad}
                        </h6>

                        <p className="text-secondary extra-small mb-1.5 text-truncate-2" style={{ lineHeight: '1.4' }}>
                          📖 {rep.descripcion}
                        </p>

                        <div className="d-flex align-items-center gap-2 flex-wrap text-muted extra-small" style={{ fontSize: '0.72rem' }}>
                          <span>👥 <strong>Participantes:</strong> {rep.participantes?.total || 0}</span>
                          <span>•</span>
                          <span>📄 <strong>Fuente:</strong> {rep.fuente}</span>
                          <span>•</span>
                          <span>Cargado por: <strong>{rep.creado_por_nombre}</strong> ({rep.creado_por_rol})</span>
                        </div>

                        {rep.observaciones_aprobacion && (
                          <div className="alert alert-danger extra-small p-2 mt-2 mb-0 rounded-3">
                            <strong>Observación de Revisión:</strong> {rep.observaciones_aprobacion}
                          </div>
                        )}
                      </div>

                      {/* Botones de Acción de Moderación */}
                      <div className="col-12 col-md-3 col-lg-3 text-md-end border-top border-md-0 pt-2 pt-md-0">
                        <div className="d-flex flex-column gap-1.5 justify-content-end">
                          
                          {/* Botón Ver Completo */}
                          <button
                            type="button"
                            onClick={() => setReporteSeleccionado(rep)}
                            className="btn btn-outline-primary btn-sm rounded-pill fw-bold"
                            style={{ fontSize: '0.74rem' }}
                          >
                            <i className="bi bi-eye-fill me-1"></i> Ver Ficha Completa
                          </button>

                          {/* Acciones para Pendientes */}
                          {rep.estado === 'pendiente' && (
                            <div className="d-flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAprobar(rep)}
                                className="btn btn-success btn-sm rounded-pill fw-bold flex-grow-1"
                                style={{ fontSize: '0.74rem' }}
                              >
                                <i className="bi bi-check-lg me-1"></i> Aprobar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRechazar(rep)}
                                className="btn btn-outline-danger btn-sm rounded-pill fw-bold flex-grow-1"
                                style={{ fontSize: '0.74rem' }}
                              >
                                <i className="bi bi-x-lg me-1"></i> Rechazar
                              </button>
                            </div>
                          )}

                          {/* Acciones para Aprobados */}
                          {rep.estado === 'aprobado' && (
                            <div className="d-flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleFijado(rep)}
                                className={`btn btn-xs rounded-pill flex-grow-1 ${rep.fijado_carrusel ? 'btn-info text-white' : 'btn-outline-secondary'}`}
                                style={{ fontSize: '0.70rem' }}
                                title="Mantener siempre destacado en el carrusel sin expirar"
                              >
                                <i className={`bi ${rep.fijado_carrusel ? 'bi-pin-angle-fill' : 'bi-pin-angle'} me-1`}></i>
                                {rep.fijado_carrusel ? 'Fijado' : 'Fijar'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRechazar(rep)}
                                className="btn btn-outline-warning btn-xs rounded-pill"
                                style={{ fontSize: '0.70rem' }}
                                title="Retirar del carrusel"
                              >
                                Retirar
                              </button>
                            </div>
                          )}

                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalle */}
      {reporteSeleccionado && (
        <ModalDetalleReporteGestion 
          reporte={reporteSeleccionado}
          onClose={() => setReporteSeleccionado(null)}
        />
      )}

    </div>
  );
};
