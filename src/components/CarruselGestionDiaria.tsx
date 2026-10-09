import React, { useState, useEffect, useRef } from 'react';
import { gestionDiariaService, type ReporteGestionDiaria } from '../services/gestionDiariaService';
import { ModalDetalleReporteGestion } from './ModalDetalleReporteGestion';

interface CarruselGestionDiariaProps {
  activeSchoolCode: string; // 'sb' | 'lb'
}

export const CarruselGestionDiaria: React.FC<CarruselGestionDiariaProps> = ({ activeSchoolCode }) => {
  const [reportes, setReportes] = useState<ReporteGestionDiaria[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [reporteModal, setReporteModal] = useState<ReporteGestionDiaria | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const timerRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);

  const SLIDE_DURATION = 8500; // 8.5s

  // Cargar reportes activos y aprobados del carrusel
  const cargarDatos = async () => {
    try {
      const items = await gestionDiariaService.obtenerReportesCarrusel(activeSchoolCode);
      setReportes(items);
    } catch (e) {
      console.error('Error cargando gestión diaria para carrusel:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();

    // Escuchar eventos de actualización
    const handleUpdate = () => cargarDatos();
    window.addEventListener('sigae-reportes-actualizados', handleUpdate);
    return () => window.removeEventListener('sigae-reportes-actualizados', handleUpdate);
  }, [activeSchoolCode]);

  // Autoplay con barra de progreso fluida
  useEffect(() => {
    if (reportes.length <= 1) {
      setProgress(0);
      return;
    }

    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    // Reset progress on slide change
    setProgress(0);
    const stepMs = 50;
    const progressIncrement = (stepMs / SLIDE_DURATION) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + progressIncrement;
      });
    }, stepMs);

    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % reportes.length);
      setProgress(0);
    }, SLIDE_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [currentIndex, reportes.length, isPaused]);

  // Control manual
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + reportes.length) % reportes.length);
    setProgress(0);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % reportes.length);
    setProgress(0);
  };

  const isSb = activeSchoolCode === 'sb';
  const colorAcento = isSb ? '#10b981' : '#0284c7';
  const colorGradiente = isSb 
    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
    : 'linear-gradient(135deg, #0284c7 0%, #0066ff 100%)';
  const colorSuave = isSb ? '#f0fdf4' : '#f0f9ff';
  const colorBorde = isSb ? '#a7f3d0' : '#bae6fd';

  // Si está cargando
  if (loading) {
    return (
      <div 
        className="card border-0 mb-4 rounded-4 shadow-sm p-4 text-center"
        style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid #e2e8f0' }}
      >
        <div className="d-flex align-items-center justify-content-center gap-2">
          <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
          <span className="fw-semibold text-secondary" style={{ fontSize: '0.85rem' }}>
            Sincronizando bitácora de gestión diaria institucional...
          </span>
        </div>
      </div>
    );
  }

  // Si no hay reportes vigentes
  if (reportes.length === 0) {
    return (
      <div 
        className="card border-0 mb-4 rounded-4 shadow-sm overflow-hidden"
        style={{ 
          border: `1.5px solid ${colorBorde}`, 
          background: `linear-gradient(135deg, ${colorSuave} 0%, #ffffff 100%)` 
        }}
      >
        <div className="p-3.5 p-md-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div 
              className="rounded-4 d-flex align-items-center justify-content-center text-white shadow-sm"
              style={{ width: '52px', height: '52px', background: colorGradiente }}
            >
              <i className="bi bi-megaphone-fill fs-4"></i>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 mb-0.5">
                <h6 className="fw-black mb-0 text-dark" style={{ letterSpacing: '-0.3px' }}>
                  Gestión Diaria & Novedades Institucionales
                </h6>
                <span 
                  className="badge rounded-pill fw-bold px-2.5 py-1 d-inline-flex align-items-center gap-1.5 shadow-2xs"
                  style={{ 
                    fontSize: '0.68rem', 
                    backgroundColor: isSb ? '#dcfce7' : '#e0f2fe',
                    color: isSb ? '#15803d' : '#0369a1',
                    border: `1.2px solid ${isSb ? '#86efac' : '#7dd3fc'}`
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isSb ? '#16a34a' : '#0284c7', display: 'inline-block' }}></span>
                  Canal Activo
                </span>
              </div>
              <p className="text-secondary mb-0 extra-small" style={{ fontSize: '0.78rem' }}>
                No hay actividades publicadas esta semana. Los reportes validados por supervisión se visualizarán dinámicamente en este carrusel.
              </p>
            </div>
          </div>
          <span className="badge bg-white text-secondary border rounded-pill px-3 py-1.5 extra-small shadow-xs d-inline-flex align-items-center gap-1.5">
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
            Visualizador en Tiempo Real
          </span>
        </div>
      </div>
    );
  }

  const reporteActual = reportes[currentIndex] || reportes[0];

  return (
    <>
      <div 
        className="card border-0 mb-4 rounded-4 shadow-md overflow-hidden position-relative carrusel-modern-container"
        style={{
          border: `1.5px solid ${colorBorde}`,
          background: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Barra de progreso de cuenta regresiva de la lámina */}
        {reportes.length > 1 && (
          <div 
            style={{ 
              width: '100%', 
              height: '4px', 
              backgroundColor: isSb ? '#d1fae5' : '#e0f2fe',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{
                width: `${progress}%`,
                height: '100%',
                background: colorGradiente,
                transition: isPaused ? 'none' : 'width 50ms linear',
                boxShadow: `0 0 8px ${colorAcento}`
              }}
            />
          </div>
        )}

        {/* Barra Superior con Glassmorphism y Navegación */}
        <div 
          className="px-3.5 py-2.5 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2"
          style={{ 
            background: isSb 
              ? 'linear-gradient(90deg, #ecfdf5 0%, #ffffff 70%)' 
              : 'linear-gradient(90deg, #f0f9ff 0%, #ffffff 70%)',
            backdropFilter: 'blur(8px)'
          }}
        >
          {/* Título de la Sección e Indicador Dinámico */}
          <div className="d-flex align-items-center gap-2.5">
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-xs"
              style={{ width: '32px', height: '32px', background: colorGradiente }}
            >
              <i className="bi bi-newspaper fs-6"></i>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="fw-black text-dark" style={{ fontSize: '0.88rem', letterSpacing: '-0.3px', lineHeight: '1.2' }}>
                  Gestión Diaria & Novedades Institucionales
                </span>
                <span 
                  className="badge rounded-pill fw-bold text-white shadow-xs d-none d-sm-inline-flex align-items-center gap-1"
                  style={{ fontSize: '0.64rem', background: colorGradiente, padding: '2px 8px' }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ffffff', display: 'inline-block' }}></span>
                  En Vivo
                </span>
              </div>
              <span className="text-muted extra-small d-flex align-items-center gap-1" style={{ fontSize: '0.70rem' }}>
                <i className="bi bi-clock-history text-primary"></i>
                Publicación semanal activa &bull; Lámina {currentIndex + 1} de {reportes.length}
                {isPaused && <span className="text-warning fw-bold ms-1">(Pausado)</span>}
              </span>
            </div>
          </div>

          {/* Flechas de Navegación del Carrusel con diseño frosted glass & botón Pausa/Play */}
          {reportes.length > 1 && (
            <div className="d-flex align-items-center gap-2 ms-auto">
              <span className="badge bg-white text-secondary border rounded-pill extra-small px-2.5 py-1 shadow-xs d-none d-sm-inline" style={{ fontSize: '0.70rem' }}>
                {currentIndex + 1} / {reportes.length}
              </span>
              <div className="btn-group btn-group-sm shadow-xs rounded-pill overflow-hidden border bg-white">
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="btn btn-light btn-sm px-2.5 py-1 text-secondary border-0"
                  title={isPaused ? "Reanudar rotación automática" : "Pausar rotación automática"}
                  style={{ fontSize: '0.78rem' }}
                >
                  <i className={`bi bi-${isPaused ? 'play-fill text-success' : 'pause-fill text-warning'}`}></i>
                </button>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="btn btn-light btn-sm px-2.5 py-1 text-secondary border-0 border-start"
                  title="Lámina anterior"
                  style={{ fontSize: '0.78rem' }}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn btn-light btn-sm px-2.5 py-1 text-secondary border-0 border-start"
                  title="Lámina siguiente"
                  style={{ fontSize: '0.78rem' }}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── CUERPO DEL CARRUSEL: FORMATO HORIZONTAL ADAPTATIVO MODERNO ── */}
        <div className="p-3 p-md-4">
          <div className="row g-3 g-lg-4 align-items-stretch">
            
            {/* ── COLUMNA 1: EVIDENCIA FOTOGRÁFICA Y BANNER ── */}
            <div className="col-12 col-lg-5 d-flex flex-column">
              <div 
                className="rounded-4 overflow-hidden border shadow-sm position-relative flex-grow-1 cursor-pointer group-hover-zoom"
                style={{ 
                  minHeight: '240px', 
                  maxHeight: '340px',
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)'
                }}
                onClick={() => setReporteModal(reporteActual)}
                title="Clic para ampliar en pantalla completa"
              >
                {reporteActual.imagenes && reporteActual.imagenes.length > 0 ? (
                  <img 
                    src={reporteActual.banner_superior || reporteActual.imagenes[0]} 
                    alt={reporteActual.actividad}
                    className="w-100 h-100 object-fit-cover transition-all"
                    style={{ 
                      maxHeight: '340px', 
                      transition: 'transform 0.4s ease' 
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/img/gestion_diaria/reporte_ejemplo_collage.png';
                    }}
                  />
                ) : (
                  <div className="text-white text-center p-4">
                    <i className="bi bi-images fs-1 d-block mb-2 opacity-50"></i>
                    <span className="small">Evidencia fotográfica institucional</span>
                  </div>
                )}

                {/* Overlay inferior con badge de fotos y zoom */}
                <div 
                  className="position-absolute bottom-0 start-0 end-0 p-2.5 text-white d-flex align-items-center justify-content-between"
                  style={{ background: 'linear-gradient(to top, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.4) 60%, transparent 100%)' }}
                >
                  <span className="extra-small fw-semibold text-truncate me-2 d-flex align-items-center gap-1.5" style={{ fontSize: '0.74rem' }}>
                    <i className="bi bi-zoom-in text-info"></i> Clic para pantalla completa
                  </span>
                  <span className="badge bg-white bg-opacity-90 text-dark rounded-pill extra-small px-2.5 py-1 shadow-xs fw-bold">
                    <i className="bi bi-camera-fill me-1 text-primary"></i>
                    {reporteActual.imagenes?.length || 1} fotos
                  </span>
                </div>
              </div>
            </div>

            {/* ── COLUMNA 2: DETALLES ESTRUCTURADOS CON CHIPS Y CONTENIDO ── */}
            <div className="col-12 col-lg-7 d-flex flex-column justify-content-between">
              <div>
                {/* Metadatos superiores con píldoras translúcidas */}
                <div className="d-flex align-items-center gap-1.5 flex-wrap mb-2">
                  <span 
                    className="badge text-white fw-bold px-2.5 py-1 rounded-pill extra-small shadow-xs"
                    style={{ 
                      fontSize: '0.68rem',
                      background: colorGradiente
                    }}
                  >
                    🏫 Actividad Institucional
                  </span>
                  
                  <span className="badge bg-light text-dark border rounded-pill extra-small px-2 py-0.5 shadow-xs">
                    📍 Región: {reporteActual.region} &bull; {reporteActual.division}
                  </span>

                  <span className="badge bg-light text-dark border rounded-pill extra-small px-2 py-0.5 shadow-xs">
                    📁 {reporteActual.gerencia} &bull; 📅 {reporteActual.ano_escolar}
                  </span>
                </div>

                {/* Título de la Actividad */}
                <h5 
                  className="fw-black mb-1.5 text-dark" 
                  style={{ 
                    fontSize: 'clamp(1.05rem, 2.6vw, 1.3rem)', 
                    letterSpacing: '-0.4px',
                    lineHeight: '1.28'
                  }}
                >
                  {reporteActual.actividad}
                </h5>

                {/* Fecha y Lugar */}
                <div className="text-secondary extra-small mb-2.5 d-flex align-items-center gap-1.5 flex-wrap" style={{ fontSize: '0.76rem' }}>
                  <span className="badge bg-secondary-subtle text-secondary rounded-pill px-2 py-0.5">
                    <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                    {reporteActual.fecha_lugar || `${reporteActual.fecha_actividad} • ${reporteActual.lugar_actividad}`}
                  </span>
                </div>

                {/* Resumen de la Descripción */}
                <p 
                  className="text-secondary mb-3" 
                  style={{ 
                    fontSize: '0.84rem', 
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    color: '#475569'
                  }}
                >
                  {reporteActual.descripcion}
                </p>

                {/* Micro-Píldoras de Participantes con estilo moderno */}
                <div className="d-flex align-items-center gap-1.5 flex-wrap mb-3 p-2.5 rounded-4" style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0' }}>
                  <span className="extra-small fw-bold text-dark me-1 d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                    <i className="bi bi-people-fill text-primary"></i> Participantes:
                  </span>
                  <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill extra-small px-2.5 py-1 fw-bold">
                    🎓 {reporteActual.participantes?.estudiantes || 0} Estudiantes
                  </span>
                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill extra-small px-2.5 py-1 fw-bold">
                    👩‍🏫 {reporteActual.participantes?.docentes || 0} Docentes
                  </span>
                  <span className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-50 rounded-pill extra-small px-2.5 py-1 fw-bold">
                    👔 {reporteActual.participantes?.directivos || 0} Directivos
                  </span>
                  <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill extra-small px-2.5 py-1 fw-bold">
                    👨‍👩‍👧 {reporteActual.participantes?.representantes || 0} Representantes
                  </span>
                </div>
              </div>

              {/* Pie de la Tarjeta: Fuente + Botón Ver Completo */}
              <div className="pt-2.5 border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="text-muted extra-small d-flex align-items-center gap-1" style={{ fontSize: '0.73rem' }}>
                  <i className="bi bi-shield-check text-success"></i>
                  <strong>Fuente Oficial:</strong> {reporteActual.fuente}
                </div>

                <button
                  type="button"
                  onClick={() => setReporteModal(reporteActual)}
                  className="btn btn-sm text-white rounded-pill px-3.5 py-1.5 fw-bold d-inline-flex align-items-center gap-1.5 shadow-sm hover-efecto"
                  style={{ 
                    fontSize: '0.78rem',
                    background: colorGradiente,
                    border: 'none',
                    boxShadow: `0 4px 14px ${colorAcento}40`
                  }}
                >
                  <span>Ver Reporte Completo</span>
                  <i className="bi bi-arrow-right"></i>
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* Indicadores de Puntos Inferiores con transición fluida */}
        {reportes.length > 1 && (
          <div className="d-flex align-items-center justify-content-center gap-2 pb-3">
            {reportes.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  setProgress(0);
                }}
                className="border-0 rounded-pill p-0"
                style={{
                  width: currentIndex === idx ? '28px' : '8px',
                  height: '8px',
                  backgroundColor: currentIndex === idx ? colorAcento : '#cbd5e1',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer'
                }}
                aria-label={`Ir a lámina ${idx + 1}`}
              ></button>
            ))}
          </div>
        )}

      </div>

      {/* Modal con Vista Detallada del Reporte */}
      {reporteModal && (
        <ModalDetalleReporteGestion 
          reporte={reporteModal} 
          onClose={() => setReporteModal(null)} 
        />
      )}
    </>
  );
};
