/**
 * ==============================================================================
 * ARCHIVO: src/pages/publica/PortalGeneralSIGAE.tsx
 * PROPÓSITO: Landing Page Centralizada Institucional del Sistema SIGAE.
 * ESTILO VISUAL: Portal Corporativo / Bancario de Alta Gama (Inspirado en BDT).
 * CARACTERÍSTICAS:
 *  - Tipografías oficiales: 'Ruda' (Títulos formales) y 'Open Sans' (Textos limpios).
 *  - Paleta de color: Azul institucional (#26367B), blanco, grises sutiles y
 *    acento dorado/ámbar (#f59e0b) para botones de acción destacados.
 *  - Componentes:
 *      1. Cintillo superior oficial MPPE y datos institucionales.
 *      2. Barra de navegación corporativa estilo Banca en Línea.
 *      3. Hero banner con escudo 3D flotante y llamado central de acceso.
 *      4. Banda de 4 accesos rápidos flotantes con iconos grandes e intuitivos.
 *      5. Red de planteles educativos conectados (SB y LB).
 *      6. Módulo de ciberseguridad, RLS en Supabase y almacenamiento en Google Drive.
 *      7. Validador público directo de constancias oficiales.
 *      8. Pie de página institucional y dock flotante para móviles.
 *  - 100% comentado en español línea por línea para facilitar auditoría y comprensión.
 * ==============================================================================
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSchool } from '../../context/SchoolContext';
import { SelectorEscuelaModal } from '../../components/escuelas/SelectorEscuelaModal';
import '../../portal_publico.css';

export const PortalGeneralSIGAE: React.FC = () => {
  // Hook de navegación de React Router
  const navigate = useNavigate();

  // Contexto multi-escuela global (proporciona la lista de escuelas y control del modal)
  const { escuelas, setSelectorModalAbierto, cambiarEscuela } = useSchool();

  // Estado para capturar el código hash introducido en el validador de constancias
  const [codigoHash, setCodigoHash] = useState<string>('');

  // Función para abrir la ventana modal de selección de institución
  const abrirSelectorEscuela = () => {
    setSelectorModalAbierto(true);
  };

  // Función para enviar el formulario de validación de constancia oficial
  const handleValidarDocumento = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigoHash.trim()) {
      // Redirige a la vista de validación con el código ingresado
      navigate(`/validar-constancia/${codigoHash.trim()}`);
    }
  };

  return (
    <div className="portal-pub-container">
      
      {/* ── SECCIÓN 1: CINTILLO INSTITUCIONAL OFICIAL (MPPE Y GOBIERNO) ── */}
      <div className="portal-mppe-ribbon d-flex align-items-center justify-content-between px-3 px-md-4">
        <div className="d-flex align-items-center gap-2">
          {/* Logo del Ministerio del Poder Popular para la Educación */}
          <img 
            src="/assets/img/logoMPPE.png" 
            alt="Ministerio del Poder Popular para la Educación" 
            className="portal-mppe-banner-img"
          />
        </div>
        <div className="d-none d-sm-flex align-items-center gap-3">
          <span>República Bolivariana de Venezuela</span>
          <span className="opacity-50">|</span>
          <span>Plataforma Educativa Oficial Multi-Institución</span>
        </div>
      </div>

      {/* ── SECCIÓN 2: BARRA DE NAVEGACIÓN CORPORATIVA TIPO BANCO (BDT STYLE) ── */}
      <header className="portal-bdt-navbar py-2.5 px-3 px-md-4">
        <div className="container-fluid p-0 d-flex align-items-center justify-content-between">
          
          {/* Marca Institucional y Escudo Oficial */}
          <Link to="/" className="portal-bdt-brand" title="SIGAE - Portal Central">
            <div className="portal-bdt-brand-logo">
              <img 
                src="/assets/img/sigae.png" 
                alt="Escudo Oficial SIGAE" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
            </div>
            <div>
              <h2 className="portal-bdt-brand-title">SIGAE</h2>
              <p className="portal-bdt-brand-sub">Gestión y Administración Escolar</p>
            </div>
          </Link>

          {/* Menú de Navegación en Computadoras */}
          <nav className="d-none d-lg-flex align-items-center gap-1">
            <a href="#inicio" className="portal-bdt-navlink">
              <i className="bi bi-house-door"></i>
              <span>Inicio</span>
            </a>
            <a href="#servicios" className="portal-bdt-navlink">
              <i className="bi bi-grid-3x3-gap"></i>
              <span>Servicios</span>
            </a>
            <a href="#planteles" className="portal-bdt-navlink">
              <i className="bi bi-buildings"></i>
              <span>Planteles Conectados</span>
            </a>
            <a href="#seguridad" className="portal-bdt-navlink">
              <i className="bi bi-shield-check"></i>
              <span>Seguridad RLS</span>
            </a>
            <a href="#verificar" className="portal-bdt-navlink">
              <i className="bi bi-qr-code-scan"></i>
              <span>Validar Constancia</span>
            </a>
          </nav>

          {/* Botón Central Estilo "Banca en Línea" / Acceso al Campus */}
          <div className="d-flex align-items-center gap-2">
            <button 
              type="button"
              className="btn-bdt-acceso"
              onClick={abrirSelectorEscuela}
              title="Seleccionar institución y acceder al campus"
            >
              <i className="bi bi-buildings-fill"></i>
              <span>Ingresar a mi Escuela</span>
            </button>
          </div>

        </div>
      </header>

      {/* ── SECCIÓN 3: HERO BANNER INSTITUCIONAL CORPORATIVO ── */}
      <section id="inicio" className="portal-bdt-hero">
        <div className="container py-3 py-lg-4">
          <div className="row align-items-center g-4 g-lg-5">
            
            {/* Titular y Descripción Formal */}
            <div className="col-lg-7 text-center text-lg-start">
              
              {/* Badge de Estatus Oficial */}
              <div className="portal-bdt-hero-badge">
                <i className="bi bi-patch-check-fill text-warning"></i>
                <span>Plataforma Digital Oficial Multi-Escuela &bull; Año 2026-2027</span>
              </div>

              {/* Título en Fuente 'Ruda' */}
              <h1 className="portal-bdt-hero-title">
                Sistema Integral de Gestión y Administración Escolar
              </h1>

              {/* Subtítulo en Fuente 'Open Sans' */}
              <p className="portal-bdt-hero-desc mx-auto mx-lg-0">
                La solución tecnológica institucional para la administración escolar, admisiones digitales sin costo operativo, control de rutas de transporte y verificación criptográfica con respaldo en la nube.
              </p>

              {/* Botón de Acción Prominente (Acento Dorado/Ámbar) */}
              <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start gap-3">
                <button 
                  type="button" 
                  className="btn-bdt-accent"
                  onClick={abrirSelectorEscuela}
                >
                  <i className="bi bi-buildings-fill"></i>
                  <span>🏛️ Seleccionar mi Institución y Acceder</span>
                </button>

                <a 
                  href="#verificar" 
                  className="btn btn-outline-light rounded-pill px-4 py-2.5 fw-semibold d-inline-flex align-items-center gap-2"
                  style={{ fontFamily: 'var(--font-title)', fontSize: '0.88rem' }}
                >
                  <i className="bi bi-qr-code-scan"></i>
                  <span>Validar Constancia QR</span>
                </a>
              </div>

              {/* Métricas de Seguridad y Alcance */}
              <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start gap-3 mt-4 pt-2 small text-light opacity-80">
                <span className="d-inline-flex align-items-center gap-1.5">
                  <i className="bi bi-shield-lock-fill text-warning"></i> Blindaje Supabase RLS
                </span>
                <span className="d-inline-flex align-items-center gap-1.5">
                  <i className="bi bi-cloud-arrow-up-fill text-info"></i> Google Drive Pro (5TB)
                </span>
                <span className="d-inline-flex align-items-center gap-1.5">
                  <i className="bi bi-phone-fill text-success"></i> Optimizado Móvil (Mobile-First)
                </span>
              </div>

            </div>

            {/* Tarjeta Flotante con Escudo 3D */}
            <div className="col-lg-5 text-center">
              <div className="portal-bdt-hero-card">
                <img 
                  src="/assets/img/sigae.png" 
                  alt="Escudo Central SIGAE" 
                  className="portal-bdt-hero-shield-img mb-3"
                />
                <h3 className="fw-bolder fs-5 text-dark m-0 font-ruda">
                  Ecosistema Escolar Centralizado
                </h3>
                <p className="text-muted extra-small mt-1 mb-3" style={{ fontSize: '0.78rem' }}>
                  Conexión segura para directores, docentes, estudiantes y representantes
                </p>
                <div className="d-flex justify-content-center gap-2">
                  <span className="badge bg-light text-primary border px-2.5 py-1.5 extra-small fw-semibold">
                    U.E. Santa Bárbara
                  </span>
                  <span className="badge bg-light text-primary border px-2.5 py-1.5 extra-small fw-semibold">
                    U.E. Libertador Bolívar
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECCIÓN 4: BANDA DE ACCESOS RÁPIDOS ESTILO BANCARIO (QUICK ACTIONS) ── */}
      <section className="portal-bdt-quickactions container">
        <div className="row g-3">
          
          {/* Tarjeta Rápida 1: Solicitud de Cupos */}
          <div className="col-sm-6 col-lg-3">
            <a href="#planteles" className="portal-bdt-quick-card">
              <div className="portal-bdt-quick-icon">
                <i className="bi bi-person-plus-fill"></i>
              </div>
              <div>
                <h4 className="portal-bdt-quick-title">Solicitud de Cupos</h4>
                <p className="portal-bdt-quick-desc">Admisiones en línea 2026-2027</p>
              </div>
            </a>
          </div>

          {/* Tarjeta Rápida 2: Red de Transporte */}
          <div className="col-sm-6 col-lg-3">
            <a href="#servicios" className="portal-bdt-quick-card">
              <div className="portal-bdt-quick-icon">
                <i className="bi bi-bus-front-fill"></i>
              </div>
              <div>
                <h4 className="portal-bdt-quick-title">Transporte Escolar</h4>
                <p className="portal-bdt-quick-desc">Rutas, paradas y horarios</p>
              </div>
            </a>
          </div>

          {/* Tarjeta Rápida 3: Verificación Criptográfica */}
          <div className="col-sm-6 col-lg-3">
            <a href="#verificar" className="portal-bdt-quick-card">
              <div className="portal-bdt-quick-icon">
                <i className="bi bi-qr-code-scan"></i>
              </div>
              <div>
                <h4 className="portal-bdt-quick-title">Validar Documento</h4>
                <p className="portal-bdt-quick-desc">Comprobación con código hash</p>
              </div>
            </a>
          </div>

          {/* Tarjeta Rápida 4: Campus Privado */}
          <div className="col-sm-6 col-lg-3">
            <div className="portal-bdt-quick-card cursor-pointer" onClick={abrirSelectorEscuela}>
              <div className="portal-bdt-quick-icon">
                <i className="bi bi-shield-lock-fill"></i>
              </div>
              <div>
                <h4 className="portal-bdt-quick-title">Acceso Institucional</h4>
                <p className="portal-bdt-quick-desc">Personal, directivos y docentes</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── SECCIÓN 5: PLANTELES CONECTADOS (RED MULTI-ESCUELA) ── */}
      <section id="planteles" className="py-5 px-3">
        <div className="container py-3">
          
          <div className="text-center max-w-xl mx-auto mb-5">
            <span className="badge bg-light text-primary border px-3 py-1.5 rounded-pill fw-bold text-uppercase small">
              <i className="bi bi-buildings-fill me-1"></i>
              Red de Instituciones Afiliadas
            </span>
            <h2 className="fw-bolder fs-2 text-dark mt-2 mb-2 font-ruda">
              Planteles Educativos Activos
            </h2>
            <p className="text-muted small">
              Elige tu institución para iniciar sesión en el campus o consultar su información académica:
            </p>
          </div>

          <div className="row g-4 justify-content-center">
            {escuelas.map((esc) => {
              const esSB = esc.id_escuela === 'sb';
              return (
                <div key={esc.id_escuela} className="col-md-6 col-lg-5">
                  <div className="portal-bdt-school-card">
                    <div>
                      {/* Cabecera con Escudo y Código DEA */}
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <div className="portal-bdt-school-logo">
                          <img 
                            src={esc.logo_url || `/assets/img/logo_${esc.id_escuela}.png`} 
                            alt={esc.nombre_institucion}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                          />
                        </div>
                        <div>
                          <h3 className="fw-bolder fs-5 text-dark m-0 font-ruda">
                            {esc.nombre_institucion}
                          </h3>
                          <span className="badge bg-light text-muted border extra-small mt-1">
                            DEA: {esc.codigo_dea} &bull; RIF: {esc.rif}
                          </span>
                        </div>
                      </div>

                      {/* Dirección Geográfica */}
                      <p className="text-muted small mb-2" style={{ fontSize: '0.85rem' }}>
                        <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                        {esc.direccion}
                      </p>

                      {/* Lema Institucional PEIC */}
                      <p className="text-secondary small fst-italic mb-4" style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                        &ldquo;{esc.peic || 'Educación integral y valores comunitarios para el futuro.'}&rdquo;
                      </p>
                    </div>

                    {/* Botones de Acción */}
                    <div className="d-flex gap-2 pt-2 border-top">
                      <Link 
                        to={`/portal/${esc.id_escuela}`} 
                        className="btn btn-outline-secondary rounded-pill py-2 px-3 fw-bold small flex-grow-1"
                        style={{ fontFamily: 'var(--font-title)' }}
                      >
                        Ver Información
                      </Link>
                      
                      <button 
                        type="button" 
                        className="btn rounded-pill py-2 px-3 fw-bold small text-white flex-grow-1 shadow-xs"
                        style={{ 
                          backgroundColor: esSB ? '#059669' : '#26367B',
                          fontFamily: 'var(--font-title)' 
                        }}
                        onClick={() => {
                          cambiarEscuela(esc.id_escuela);
                          navigate('/login');
                        }}
                      >
                        <span>Ingresar 🔐</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── SECCIÓN 6: CAPACIDADES Y SERVICIOS INSTITUCIONALES (TARJETAS CORPORATIVAS) ── */}
      <section id="servicios" className="py-5 px-3 bg-white border-top border-bottom">
        <div className="container py-3">
          
          <div className="text-center max-w-xl mx-auto mb-5">
            <span className="badge bg-light text-primary border px-3 py-1.5 rounded-pill fw-bold text-uppercase small">
              <i className="bi bi-cpu-fill me-1"></i>
              Arquitectura de Servicios
            </span>
            <h2 className="fw-bolder fs-2 text-dark mt-2 mb-2 font-ruda">
              Tecnología de Vanguardia al Servicio de la Educación
            </h2>
            <p className="text-muted small">
              Módulos diseñados bajo estrictas normas de formalidad, seguridad y alta disponibilidad.
            </p>
          </div>

          <div className="row g-4">
            
            {/* Tarjeta 1: Admisiones Digitales */}
            <div className="col-md-6 col-lg-3">
              <div className="portal-bdt-feature-card">
                <img src="/assets/img/formalizacion_3d.png" alt="Admisiones" className="portal-bdt-feature-img" />
                <div className="portal-bdt-feature-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="bi bi-person-check-fill text-primary fs-5"></i>
                    <h3 className="fs-6 fw-bold text-dark m-0 font-ruda">Admisiones en Línea</h3>
                  </div>
                  <p className="text-muted small mb-0" style={{ lineHeight: 1.55 }}>
                    Registro de solicitudes, carga de partida de nacimiento y asignación de matrícula sin colas presenciales.
                  </p>
                </div>
              </div>
            </div>

            {/* Tarjeta 2: Red de Transporte */}
            <div className="col-md-6 col-lg-3">
              <div className="portal-bdt-feature-card">
                <img src="/assets/img/censo_3d.png" alt="Transporte Escolar" className="portal-bdt-feature-img" />
                <div className="portal-bdt-feature-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="bi bi-bus-front-fill text-info fs-5"></i>
                    <h3 className="fs-6 fw-bold text-dark m-0 font-ruda">Rutas de Transporte</h3>
                  </div>
                  <p className="text-muted small mb-0" style={{ lineHeight: 1.55 }}>
                    Censo de estudiantes, unidades de transporte (Yutong/Encava), paradas y monitoreo de rutogramas por sector.
                  </p>
                </div>
              </div>
            </div>

            {/* Tarjeta 3: Ciberseguridad y RLS */}
            <div className="col-md-6 col-lg-3">
              <div className="portal-bdt-feature-card">
                <img src="/assets/img/seguridad_3d.png" alt="Ciberseguridad" className="portal-bdt-feature-img" />
                <div className="portal-bdt-feature-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="bi bi-shield-check text-success fs-5"></i>
                    <h3 className="fs-6 fw-bold text-dark m-0 font-ruda">Seguridad y RLS</h3>
                  </div>
                  <p className="text-muted small mb-0" style={{ lineHeight: 1.55 }}>
                    Aislamiento total de bases de datos por escuela. Ningún usuario puede ver registros ajenos a su institución.
                  </p>
                </div>
              </div>
            </div>

            {/* Tarjeta 4: Gestión Docente y Expedientes */}
            <div className="col-md-6 col-lg-3">
              <div className="portal-bdt-feature-card">
                <img src="/assets/img/personal_3d.png" alt="Gestión Docente" className="portal-bdt-feature-img" />
                <div className="portal-bdt-feature-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i className="bi bi-journal-text text-warning fs-5"></i>
                    <h3 className="fs-6 fw-bold text-dark m-0 font-ruda">Control Pedagógico</h3>
                  </div>
                  <p className="text-muted small mb-0" style={{ lineHeight: 1.55 }}>
                    Reportes diarios de clase, expedientes de estudiantes y personal, notas y emisión de constancias oficiales.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── SECCIÓN 7: VALIDADOR PÚBLICO DE DOCUMENTOS Y CONSTANCIAS QR ── */}
      <section id="verificar" className="py-5 px-3">
        <div className="container py-3">
          <div className="row align-items-center g-4">
            
            <div className="col-lg-4 text-center">
              <img 
                src="/assets/img/seguridad_3d.png" 
                alt="Validador de Constancias" 
                style={{ width: '150px', height: '150px', objectFit: 'contain' }}
              />
            </div>

            <div className="col-lg-8">
              <span className="badge bg-light text-primary border px-3 py-1 rounded-pill small fw-bold mb-2 d-inline-block">
                <i className="bi bi-patch-check-fill text-success me-1"></i>
                Validador Oficial Criptográfico
              </span>
              <h3 className="fs-3 fw-bold text-dark mb-2 font-ruda">
                Verificación de Autenticidad de Constancias
              </h3>
              <p className="text-muted small mb-4" style={{ maxWidth: '640px' }}>
                Cualquier organismo, empleador o representante puede certificar la autenticidad de una constancia de estudio, notas, carnet o retiro emitida por SIGAE introduciendo el código hash único impreso en el documento:
              </p>

              {/* Formulario de Verificación Directo */}
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
                <button 
                  type="submit" 
                  className="btn btn-dark rounded-pill px-4 fw-bold text-nowrap"
                  style={{ fontFamily: 'var(--font-title)' }}
                >
                  Validar Documento
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECCIÓN 8: DOCK FLOTANTE MÓVIL (MOBILE-FIRST) ── */}
      <nav className="portal-bdt-mobile-dock" aria-label="Navegación Móvil Rápida">
        <a href="#inicio" className="portal-bdt-mobile-dock-btn activo">
          <i className="bi bi-house-door"></i>
          <span>Inicio</span>
        </a>
        <a href="#planteles" className="portal-bdt-mobile-dock-btn">
          <i className="bi bi-buildings"></i>
          <span>Planteles</span>
        </a>
        <a href="#servicios" className="portal-bdt-mobile-dock-btn">
          <i className="bi bi-grid"></i>
          <span>Servicios</span>
        </a>
        <a href="#verificar" className="portal-bdt-mobile-dock-btn">
          <i className="bi bi-qr-code-scan"></i>
          <span>Validar</span>
        </a>
        <button 
          type="button" 
          className="portal-bdt-mobile-dock-btn destacado border-0"
          onClick={abrirSelectorEscuela}
        >
          <i className="bi bi-shield-lock-fill"></i>
          <span>Ingresar</span>
        </button>
      </nav>

      {/* ── SECCIÓN 9: PIE DE PÁGINA (FOOTER CORPORATIVO BANCARIO) ── */}
      <footer className="portal-bdt-footer">
        <div className="container">
          <div className="row g-4 align-items-center">
            
            <div className="col-md-6 text-center text-md-start">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-2">
                <img src="/assets/img/sigae.png" alt="SIGAE Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                <span className="fw-bolder text-white fs-5 font-ruda">SIGAE</span>
                <span className="badge bg-secondary bg-opacity-25 text-light border border-secondary border-opacity-50 extra-small">
                  v1.4.0
                </span>
              </div>
              <p className="small text-muted m-0" style={{ maxWidth: '440px', lineHeight: 1.5 }}>
                Sistema Integral de Gestión y Administración Escolar. Solución institucional centralizada multi-escuela para el control pedagógico y comunitario.
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

      {/* ── SECCIÓN 10: MODAL INTERACTIVO DE SELECCIÓN DE ESCUELA ── */}
      <SelectorEscuelaModal destino="login" />

    </div>
  );
};
