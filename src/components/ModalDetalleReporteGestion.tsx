import React, { useState } from 'react';
import type { ReporteGestionDiaria } from '../services/gestionDiariaService';

interface ModalDetalleReporteProps {
  reporte: ReporteGestionDiaria | null;
  onClose: () => void;
}

export const ModalDetalleReporteGestion: React.FC<ModalDetalleReporteProps> = ({ reporte, onClose }) => {
  const [fotoActiva, setFotoActiva] = useState<string | null>(null);

  if (!reporte) return null;

  const isSb = reporte.escuela_codigo === 'sb';
  const colorTema = isSb ? '#059669' : '#0284c7';
  const colorBorde = isSb ? '#a7f3d0' : '#bae6fd';

  return (
    <div 
      className="modal fade show d-block" 
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 1060, backdropFilter: 'blur(5px)' }}
      tabIndex={-1}
      role="dialog"
      onClick={onClose}
    >
      <div 
        className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" 
        role="document"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '780px' }}
      >
        <div className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden">
          
          {/* Header con estilo institucional */}
          <div 
            className="modal-header text-white px-4 py-3 d-flex align-items-center justify-content-between"
            style={{ 
              background: isSb 
                ? 'linear-gradient(135deg, #065f46 0%, #059669 100%)' 
                : 'linear-gradient(135deg, #075985 0%, #0284c7 100%)' 
            }}
          >
            <div className="d-flex align-items-center gap-2.5">
              <span className="fs-4">🏫</span>
              <div>
                <h5 className="modal-title fw-bold mb-0" style={{ fontSize: '1.05rem', letterSpacing: '-0.2px' }}>
                  Reporte Oficial de Actividades y Gestión Diaria
                </h5>
                <span className="extra-small opacity-90 text-light">
                  {reporte.proceso} &bull; Año Escolar {reporte.ano_escolar}
                </span>
              </div>
            </div>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              aria-label="Cerrar" 
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body p-4 bg-light bg-opacity-50">
            
            {/* Galería / Banner Visual del Evento */}
            {reporte.imagenes && reporte.imagenes.length > 0 && (
              <div className="mb-4">
                <div 
                  className="rounded-4 overflow-hidden border shadow-sm bg-dark position-relative text-center"
                  style={{ maxHeight: '420px', minHeight: '220px' }}
                >
                  <img 
                    src={fotoActiva || reporte.banner_superior || reporte.imagenes[0]} 
                    alt={reporte.actividad}
                    className="img-fluid w-100"
                    style={{ maxHeight: '420px', objectFit: 'contain', backgroundColor: '#0f172a' }}
                  />
                  <div className="position-absolute bottom-0 start-0 end-0 p-2.5 bg-gradient-to-t from-black text-white text-start d-flex justify-content-between align-items-end" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }}>
                    <span className="small fw-semibold text-truncate me-2">
                      <i className="bi bi-camera-fill me-1"></i> Evidencia Fotográfica Oficial
                    </span>
                    <span className="badge bg-white text-dark extra-small rounded-pill">
                      {reporte.imagenes.length} {reporte.imagenes.length === 1 ? 'Foto' : 'Fotos'}
                    </span>
                  </div>
                </div>

                {/* Miniaturas de Fotos */}
                {reporte.imagenes.length > 1 && (
                  <div className="d-flex gap-2 mt-2 overflow-auto pb-1">
                    {reporte.imagenes.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFotoActiva(imgUrl)}
                        className={`btn p-0 rounded-3 overflow-hidden border flex-shrink-0 transition-all ${
                          (fotoActiva || reporte.imagenes[0]) === imgUrl ? 'border-primary shadow-sm ring-2' : 'opacity-75'
                        }`}
                        style={{ width: '64px', height: '64px' }}
                      >
                        <img src={imgUrl} alt={`Foto ${idx + 1}`} className="w-100 h-100 object-fit-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Ficha Estructurada idéntica al Formato Requerido */}
            <div 
              className="bg-white rounded-4 p-3.5 p-md-4 border shadow-xs"
              style={{ borderColor: colorBorde }}
            >
              {/* Encabezado Institucional y Metadatos PDVSA */}
              <div className="border-bottom pb-3 mb-3">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                  <span className="fw-bolder text-uppercase" style={{ color: colorTema, fontSize: '0.88rem' }}>
                    🏫 Reporte de Actividades 🏫
                  </span>
                  <span 
                    className="badge rounded-pill fw-bold extra-small px-2.5 py-1"
                    style={{ 
                      backgroundColor: reporte.estado === 'aprobado' ? '#ecfdf5' : '#fffbeb',
                      color: reporte.estado === 'aprobado' ? '#047857' : '#b45309',
                      border: `1px solid ${reporte.estado === 'aprobado' ? '#a7f3d0' : '#fde68a'}`
                    }}
                  >
                    <i className={`bi ${reporte.estado === 'aprobado' ? 'bi-check-circle-fill' : 'bi-hourglass-split'} me-1`}></i>
                    {reporte.estado === 'aprobado' ? 'Aprobado & Publicado' : 'Pendiente de Revisión'}
                  </span>
                </div>

                <div className="row g-2 text-dark extra-small" style={{ fontSize: '0.82rem' }}>
                  <div className="col-12 col-sm-6">
                    <div>🗺️ <strong>Región:</strong> {reporte.region}</div>
                    <div>🛢️ <strong>División:</strong> {reporte.division}</div>
                    <div>📑 <strong>Gerencia:</strong> {reporte.gerencia}</div>
                  </div>
                  <div className="col-12 col-sm-6">
                    <div>🎒 <strong>Proceso:</strong> {reporte.proceso}</div>
                    <div>📅 <strong>Año Escolar:</strong> {reporte.ano_escolar}</div>
                    {reporte.hora_publicacion && (
                      <div>⏰ <strong>Hora de Emisión:</strong> {reporte.hora_publicacion}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Título de la Actividad */}
              <div className="mb-3">
                <div className="d-flex align-items-start gap-2">
                  <span className="fs-5">📚</span>
                  <div>
                    <strong className="text-secondary text-uppercase extra-small d-block" style={{ fontSize: '0.70rem' }}>
                      Actividad Desarrollada
                    </strong>
                    <h6 className="fw-black text-dark mb-1" style={{ fontSize: '1.05rem', lineHeight: '1.3' }}>
                      {reporte.actividad}
                    </h6>
                  </div>
                </div>
              </div>

              {/* Fecha y Lugar */}
              <div className="mb-3 p-2.5 rounded-3 bg-light border d-flex align-items-center gap-2 text-dark" style={{ fontSize: '0.82rem' }}>
                <span className="fs-5">🗓️</span>
                <div>
                  <strong>Fecha y Lugar:</strong> {reporte.fecha_lugar || `${reporte.fecha_actividad} &bull; ${reporte.lugar_actividad}`}
                </div>
              </div>

              {/* Descripción Narrativa */}
              <div className="mb-3.5">
                <div className="d-flex align-items-center gap-1.5 mb-1.5">
                  <span className="fs-5">📖</span>
                  <strong className="text-dark" style={{ fontSize: '0.86rem' }}>Descripción:</strong>
                </div>
                <p 
                  className="text-secondary mb-0 p-3 rounded-3 bg-light bg-opacity-70 border"
                  style={{ fontSize: '0.85rem', lineHeight: '1.6', textAlign: 'justify' }}
                >
                  {reporte.descripcion}
                </p>
              </div>

              {/* Desglose de Participantes */}
              <div className="mb-3.5">
                <div className="d-flex align-items-center gap-1.5 mb-2">
                  <span className="fs-5">👥</span>
                  <strong className="text-dark" style={{ fontSize: '0.86rem' }}>Número de Participantes:</strong>
                  <span className="badge bg-primary text-white rounded-pill ms-auto extra-small">
                    Total: {reporte.participantes?.total || 0}
                  </span>
                </div>
                
                <div className="row g-2 text-center">
                  <div className="col-6 col-sm-3">
                    <div className="p-2 rounded-3 border bg-light">
                      <div className="fw-bold fs-6 text-primary">{reporte.participantes?.estudiantes || 0}</div>
                      <div className="text-muted extra-small" style={{ fontSize: '0.68rem' }}>Estudiantes</div>
                    </div>
                  </div>
                  <div className="col-6 col-sm-3">
                    <div className="p-2 rounded-3 border bg-light">
                      <div className="fw-bold fs-6 text-success">{reporte.participantes?.docentes || 0}</div>
                      <div className="text-muted extra-small" style={{ fontSize: '0.68rem' }}>Docentes</div>
                    </div>
                  </div>
                  <div className="col-6 col-sm-3">
                    <div className="p-2 rounded-3 border bg-light">
                      <div className="fw-bold fs-6 text-warning">{reporte.participantes?.directivos || 0}</div>
                      <div className="text-muted extra-small" style={{ fontSize: '0.68rem' }}>Directivos</div>
                    </div>
                  </div>
                  <div className="col-6 col-sm-3">
                    <div className="p-2 rounded-3 border bg-light">
                      <div className="fw-bold fs-6 text-info">{reporte.participantes?.representantes || 0}</div>
                      <div className="text-muted extra-small" style={{ fontSize: '0.68rem' }}>Representantes</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fuente y Firma Institucional */}
              <div className="pt-2.5 border-top d-flex align-items-center justify-content-between flex-wrap gap-2 text-muted extra-small" style={{ fontSize: '0.78rem' }}>
                <div>
                  📄 <strong>Fuente:</strong> <span className="text-dark fw-semibold">{reporte.fuente}</span>
                </div>
                <div>
                  Cargado por: <strong>{reporte.creado_por_nombre}</strong> ({reporte.creado_por_rol})
                </div>
              </div>

            </div>

          </div>

          <div className="modal-footer bg-white border-top p-3 d-flex justify-content-between">
            <span className="text-muted extra-small">
              <i className="bi bi-clock-history me-1"></i>
              Vigencia programada: 1 semana en el carrusel principal
            </span>
            <div className="d-flex gap-2">
              <button 
                type="button" 
                onClick={() => window.print()} 
                className="btn btn-outline-secondary btn-sm rounded-pill px-3"
              >
                <i className="bi bi-printer me-1"></i> Imprimir Reporte
              </button>
              <button 
                type="button" 
                className="btn btn-primary btn-sm rounded-pill px-4" 
                onClick={onClose}
              >
                Entendido
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
