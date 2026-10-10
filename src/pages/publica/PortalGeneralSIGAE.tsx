/**
 * ==============================================================================
 * ARCHIVO: src/pages/publica/PortalGeneralSIGAE.tsx
 * PROPÓSITO: Portal Web General (Landing Page Centralizada) de SIGAE.
 * ESTILO VISUAL: SAP Fiori Horizon + Apple Glassmorphism + Mobile-First.
 * DESCRIPCIÓN:
 *  - Presenta qué es el sistema SIGAE y sus módulos (Control, Transporte, Cupos, QR).
 *  - Ofrece el botón central "🏛️ Ingresar a mi Escuela" que abre el Selector Dinámico.
 *  - Expone el validador público de documentos criptográficos oficiales.
 *  - Código completamente comentado en español línea por línea.
 * ==============================================================================
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSchool } from '../../context/SchoolContext';
import { SelectorEscuelaModal } from '../../components/escuelas/SelectorEscuelaModal';
import '../../portal_publico.css';

export const PortalGeneralSIGAE: React.FC = () => {
  const navigate = useNavigate();
  const { escuelas, setSelectorModalAbierto } = useSchool();

  // Estado para el buscador directo de constancias oficiales
  const [codigoHash, setCodigoHash] = useState<string>('');

  // Función para abrir el selector dinámico de instituciones
  const abrirSelectorEscuela = () => {
    setSelectorModalAbierto(true);
  };

  // Función para validar un documento oficial por código
  const handleValidarDocumento = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigoHash.trim()) {
      navigate(`/validar-constancia/${codigoHash.trim()}`);
    }
  };

  return (
    <div className="portal-pub-container portal-tema-lb">
      
      {/* Luz ambiental sutil en el fondo */}
      <div className="portal-pub-ambient-glow"></div>

      {/* ── 1. CINTILLO INSTITUCIONAL OFICIAL (MPPE) ── */}
      <div className="portal-mppe-ribbon d-flex align-items-center justify-content-between px-3 px-md-4">
        <div className="d-flex align-items-center gap-2">
          <img 
            src="/assets/img/logoMPPE.png" 
            alt="Ministerio del Poder Popular para la Educación" 
            className="portal-mppe-banner-img"
          />
        </div>
        <div className="portal-mppe-text d-none d-sm-block text-end">
          <span>República Bolivariana de Venezuela &bull; Plataforma Educativa Oficial</span>
        </div>
      </div>

      {/* ── 2. SHELLBAR SUPERIOR CENTRALIZADO (DARK GLASS) ── */}
      <header className="portal-shellbar py-2 px-3 px-md-4">
        <div className="container-fluid p-0 d-flex align-items-center justify-content-between">
          
          {/* Logo y Marca SIGAE */}
          <Link to="/" className="portal-brand-badge" title="SIGAE - Inicio">
            <div className="portal-escudo-wrapper" style={{ boxShadow: '0 0 16px rgba(0, 98, 255, 0.4)' }}>
              <img 
                src="/assets/img/sigae.png" 
                alt="Escudo SIGAE" 
                className="portal-escudo-img" 
              />
            </div>
            <div>
              <h2 className="portal-brand-title">SIGAE</h2>
              <p className="portal-brand-subtitle">Gestión y Administración Escolar</p>
            </div>
          </Link>

          {/* Menú de Navegación Rápida */}
          <nav className="d-none d-lg-flex align-items-center gap-2">
            <a href="#inicio" className="portal-nav-link">
              <i className="bi bi-house-door"></i>
              <span>Inicio</span>
            </a>
            <a href="#modulos" className="portal-nav-link">
              <i className="bi bi-grid-3x3-gap"></i>
              <span>Capacidades</span>
            </a>
            <a href="#escuelas" className="portal-nav-link">
              <i className="bi bi-buildings"></i>
              <span>Planteles</span>
            </a>
            <a href="#verificar" className="portal-nav-link">
              <i className="bi bi-shield-check"></i>
              <span>Validar Constancia</span>
            </a>
          </nav>

          {/* Acciones de Acceso */}
          <div className="d-flex align-items-center gap-2">
            {/* Botón Central: Seleccionar Escuela */}
            <button 
              type="button" 
              className="portal-btn-sede"
              onClick={abrirSelectorEscuela}
              title="Elegir tu institución educativa"
            >
              <i className="bi bi-buildings text-info"></i>
              <span className="d-none d-sm-inline">Seleccionar Escuela</span>
              <span className="d-inline d-sm-none">Escuelas</span>
              <i className="bi bi-chevron-down small opacity-75"></i>
            </button>

            {/* Botón Ingresar */}
            <button 
              type="button"
              className="portal-btn-ingresar"
              onClick={abrirSelectorEscuela}
              title="Acceder al Campus Digital"
            >
              <i className="bi bi-shield-lock-fill"></i>
              <span>Ingresar</span>
            </button>
          </div>

        </div>
      </header>

      {/* ── 3. HERO CENTRAL DE BIENVENIDA Y ACCESO AL ECOSISTEMA ── */}
      <section id="inicio" className="portal-hero-section">
        <div className="container py-3 py-lg-5">
          <div className="row align-items-center g-4 g-lg-5">
            
            {/* Información Principal del Sistema */}
            <div className="col-lg-7 text-center text-lg-start">
              
              <div className="portal-badge-status mb-3">
                <i className="bi bi-cpu-fill text-primary"></i>
                <span>Ecosistema Multi-Escuela &bull; Costo Cero de Operación</span>
              </div>

              <h1 className="portal-hero-title">
                Sistema Integral de Gestión y Administración Escolar
              </h1>

              <p className="portal-hero-peic mx-auto mx-lg-0 mb-4" style={{ fontSize: '1.12rem' }}>
                Plataforma unificada para la gestión académica, control de cupos, rutas de transporte y verificación criptográfica de documentos para las instituciones educativas de Venezuela.
              </p>

              {/* Botones Centrales de Acción */}
              <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start gap-3">
                
                {/* BOTÓN CENTRAL: INGRESAR A MI ESCUELA */}
                <button 
                  type="button" 
                  className="btn btn-lg px-4 py-2.5 rounded-pill text-white fw-bold shadow-sm d-inline-flex align-items-center gap-2"
                  style={{ background: 'var(--pub-gradient)' }}
                  onClick={abrirSelectorEscuela}
                >
                  <i className="bi bi-buildings-fill"></i>
                  <span>🏛️ Ingresar a mi Escuela</span>
                </button>

                {/* Botón Secundario: Validar Constancia */}
                <a 
                  href="#verificar" 
                  className="btn btn-lg btn-white border px-3.5 py-2.5 rounded-pill text-dark fw-semibold shadow-xs d-inline-flex align-items-center gap-2"
                >
                  <i className="bi bi-qr-code-scan text-primary"></i>
                  <span>Validar Constancia QR</span>
                </a>

              </div>

              {/* Resumen de estadísticas o sedes disponibles */}
              <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start gap-3 mt-4 pt-2 text-muted small">
                <span className="d-inline-flex align-items-center gap-1.5">
                  <i className="bi bi-check-circle-fill text-success"></i> 2 Sedes Activas
                </span>
                <span className="d-inline-flex align-items-center gap-1.5">
                  <i className="bi bi-shield-fill-check text-info"></i> Seguridad RLS
                </span>
                <span className="d-inline-flex align-items-center gap-1.5">
                  <i className="bi bi-phone-fill text-warning"></i> 100% Mobile-First
                </span>
              </div>

            </div>

            {/* Escudo 3D Central de SIGAE */}
            <div className="col-lg-5 text-center">
              <div className="portal-hero-shield-card">
                <img 
                  src="/assets/img/sigae.png" 
                  alt="Escudo Central SIGAE" 
                  className="portal-hero-shield-img"
                  style={{ width: '190px', height: '190px' }}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 4. CAPACIDADES Y MÓDULOS DEL SISTEMA (TARJETAS 3D) ── */}
      <section id="modulos" className="py-5 px-3">
        <div className="container">
          
          <div className="text-center max-w-xl mx-auto mb-5">
            <span className="badge bg-white text-dark border px-3 py-1.5 rounded-pill fw-bold text-uppercase small shadow-xs">
              <i className="bi bi-stars text-warning me-1"></i>
              Capacidades Tecnológicas
            </span>
            <h2 className="fw-bolder fs-2 text-dark mt-2 mb-2">Todo el Ecosistema Escolar en un Solo Lugar</h2>
            <p className="text-muted small">Herramientas diseñadas para directores, docentes, estudiantes y representantes.</p>
          </div>

          <div className="row g-4">
            
            {/* Módulo 1: Admisiones y Formalización */}
            <div className="col-md-6 col-lg-3">
              <div className="portal-card-3d">
                <img src="/assets/img/formalizacion_3d.png" alt="Admisiones Digitales" className="portal-card-3d-header-img" />
                <div className="portal-card-3d-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="portal-icon-box">
                      <i className="bi bi-person-check-fill"></i>
                    </div>
                    <h3 className="fs-5 fw-bold text-dark m-0">Admisiones en Línea</h3>
                  </div>
                  <p className="text-muted small mb-0" style={{ lineHeight: 1.6 }}>
                    Solicitud de cupos y carga de recaudos digitalmente desde el celular con cero costo de almacenamiento.
                  </p>
                </div>
              </div>
            </div>

            {/* Módulo 2: Transporte Escolar */}
            <div className="col-md-6 col-lg-3">
              <div className="portal-card-3d">
                <img src="/assets/img/censo_3d.png" alt="Transporte Escolar" className="portal-card-3d-header-img" />
                <div className="portal-card-3d-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="portal-icon-box">
                      <i className="bi bi-bus-front-fill"></i>
                    </div>
                    <h3 className="fs-5 fw-bold text-dark m-0">Red de Transporte</h3>
                  </div>
                  <p className="text-muted small mb-0" style={{ lineHeight: 1.6 }}>
                    Gestión de unidades, rutogramas por comunidad, censo estudiantil y control de horarios matutinos.
                  </p>
                </div>
              </div>
            </div>

            {/* Módulo 3: Ciberseguridad y QR */}
            <div className="col-md-6 col-lg-3">
              <div className="portal-card-3d">
                <img src="/assets/img/seguridad_3d.png" alt="Ciberseguridad SIGAE" className="portal-card-3d-header-img" />
                <div className="portal-card-3d-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="portal-icon-box">
                      <i className="bi bi-shield-lock-fill"></i>
                    </div>
                    <h3 className="fs-5 fw-bold text-dark m-0">Seguridad & RLS</h3>
                  </div>
                  <p className="text-muted small mb-0" style={{ lineHeight: 1.6 }}>
                    Aislamiento estricto de datos por institución educativa y verificación criptográfica de constancias con QR.
                  </p>
                </div>
              </div>
            </div>

            {/* Módulo 4: Gestión Docente y Expedientes */}
            <div className="col-md-6 col-lg-3">
              <div className="portal-card-3d">
                <img src="/assets/img/personal_3d.png" alt="Gestión Docente" className="portal-card-3d-header-img" />
                <div className="portal-card-3d-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="portal-icon-box">
                      <i className="bi bi-journal-bookmark-fill"></i>
                    </div>
                    <h3 className="fs-5 fw-bold text-dark m-0">Control Pedagógico</h3>
                  </div>
                  <p className="text-muted small mb-0" style={{ lineHeight: 1.6 }}>
                    Gestión diaria docente, expedientes del personal, matrícula escolar, actas y emisión de constancias.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── 5. PLANTELES EDUCATIVOS ACTIVOS EN EL SIGAE ── */}
      <section id="escuelas" className="py-5 px-3 bg-white border-top border-bottom">
        <div className="container">
          
          <div className="text-center max-w-xl mx-auto mb-5">
            <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill fw-bold text-uppercase small shadow-xs">
              <i className="bi bi-buildings-fill text-primary me-1"></i>
              Red de Instituciones
            </span>
            <h2 className="fw-bolder fs-2 text-dark mt-2 mb-2">Planteles Conectados al Sistema</h2>
            <p className="text-muted small">Selecciona tu institución para acceder a su portal o ingresar al campus:</p>
          </div>

          <div className="row g-4 justify-content-center">
            {escuelas.map((esc) => {
              const esSB = esc.id_escuela === 'sb';
              const colorTema = esSB ? '#10b981' : '#0062ff';

              return (
                <div key={esc.id_escuela} className="col-md-6 col-lg-5">
                  <div 
                    className="p-4 p-lg-5 rounded-4 border h-100 d-flex flex-column justify-content-between shadow-xs transition-all"
                    style={{ background: '#ffffff', borderColor: '#e2e8f0' }}
                  >
                    <div>
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <div 
                          className="rounded-3 p-1.5 border d-flex align-items-center justify-content-center bg-white shadow-xs"
                          style={{ width: '64px', height: '64px', flexShrink: 0 }}
                        >
                          <img 
                            src={esc.logo_url || `/assets/img/logo_${esc.id_escuela}.png`} 
                            alt={esc.nombre_institucion}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                          />
                        </div>
                        <div>
                          <h3 className="fw-bolder fs-5 text-dark m-0">{esc.nombre_institucion}</h3>
                          <span className="badge bg-light text-muted border extra-small mt-1">
                            DEA: {esc.codigo_dea}
                          </span>
                        </div>
                      </div>

                      <p className="text-muted small mb-3">
                        <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                        {esc.direccion}
                      </p>

                      <p className="text-secondary small fst-italic mb-4" style={{ fontSize: '0.82rem' }}>
                        &ldquo;{esc.peic || 'Educación integral y valores comunitarios.'}&rdquo;
                      </p>
                    </div>

                    {/* Botones de Acción por Escuela */}
                    <div className="d-flex gap-2">
                      <Link 
                        to={`/portal/${esc.id_escuela}`} 
                        className="btn btn-outline-secondary rounded-pill py-2 px-3 fw-bold small flex-grow-1"
                      >
                        Ver Portal Escolar
                      </Link>
                      <button 
                        type="button" 
                        className="btn rounded-pill py-2 px-3 fw-bold small text-white flex-grow-1"
                        style={{ backgroundColor: colorTema }}
                        onClick={() => {
                          // Fijamos la escuela y abrimos el login
                          localStorage.setItem('sigae_escuela_codigo', esc.id_escuela);
                          navigate('/login');
                        }}
                      >
                        Ingresar 🔐
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── 6. VALIDADOR PÚBLICO DE CONSTANCIAS (CIBERSEGURIDAD QR) ── */}
      <section id="verificar" className="py-5 px-3">
        <div className="container">
          <div className="row align-items-center g-4">
            
            <div className="col-lg-4 text-center">
              <img 
                src="/assets/img/seguridad_3d.png" 
                alt="Validador Criptográfico" 
                style={{ width: '160px', height: '160px', objectFit: 'contain' }}
              />
            </div>

            <div className="col-lg-8">
              <span className="badge bg-white text-dark border px-3 py-1 rounded-pill small fw-bold mb-2 d-inline-block shadow-xs">
                <i className="bi bi-shield-check text-success me-1"></i>
                Validación Oficial Criptográfica
              </span>
              <h3 className="fs-3 fw-bold text-dark mb-2">Portal Público de Verificación de Documentos</h3>
              <p className="text-muted small mb-4" style={{ maxWidth: '640px' }}>
                Cualquier institución o representante puede comprobar la legitimidad de una constancia de estudio, retiro, carnet o carta emitida por SIGAE ingresando el código hash impreso en el documento:
              </p>

              <form onSubmit={handleValidarDocumento} className="d-flex flex-column flex-sm-row gap-2 max-w-lg">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-qr-code-scan text-muted"></i>
                  </span>
                  <input 
                    type="text" 
                    className="form-control border-start-0" 
                    placeholder="Ingresa el código hash (ej: CE-2026-XYZ123)"
                    value={codigoHash}
                    onChange={(e) => setCodigoHash(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-dark rounded-pill px-4 fw-semibold text-nowrap">
                  Validar Documento
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* ── 7. PIE DE PÁGINA (FOOTER CORPORATIVO OFICIAL) ── */}
      <footer className="portal-footer">
        <div className="container">
          <div className="row g-4 align-items-center">
            
            <div className="col-md-6 text-center text-md-start">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-2">
                <img src="/assets/img/sigae.png" alt="SIGAE Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                <span className="fw-bolder text-white fs-5">SIGAE</span>
                <span className="badge bg-secondary bg-opacity-25 text-light border border-secondary border-opacity-50 extra-small">
                  v1.4.0
                </span>
              </div>
              <p className="small text-muted m-0" style={{ maxWidth: '420px', lineHeight: 1.5 }}>
                Sistema Integral de Gestión y Administración Escolar. Solución tecnológica unificada con arquitectura multi-escuela protegida por Row Level Security (RLS).
              </p>
            </div>

            <div className="col-md-6 text-center text-md-end">
              <p className="extra-small text-muted mb-1" style={{ fontSize: '0.78rem' }}>
                &copy; 2026 SIGAE &bull; República Bolivariana de Venezuela
              </p>
              <p className="extra-small text-muted m-0" style={{ fontSize: '0.74rem' }}>
                Ministerio del Poder Popular para la Educación &bull; Estado Monagas
              </p>
            </div>

          </div>
        </div>
      </footer>

      {/* ── 8. MODAL INTERACTIVO DE SELECCIÓN DE ESCUELA ── */}
      <SelectorEscuelaModal destino="login" />

    </div>
  );
};
