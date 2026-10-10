/**
 * ==============================================================================
 * ARCHIVO: src/pages/publica/PortalGeneralSIGAE.tsx
 * PROPÓSITO: Landing Page Centralizada Oficial de SIGAE inspirada en BDT (bdt.com.ve).
 * CARACTERÍSTICAS VISUALES (IDÉNTICAS AL BANCO DIGITAL DE LOS TRABAJADORES):
 *  1. Cabecera institucional superior blanca con logos oficiales.
 *  2. Barra de utilidades azul noche con redes sociales y botones de acceso rápido.
 *  3. BARRA DE MENÚ FLOTANTE CÁPSULA:
 *     - Flotante con border-radius de 40px, fondo #0D1739 y sticky en scroll.
 *     - Botón cápsula azul eléctrico integrado: "SIGAE en Línea" (Acceso multi-escuela).
 *  4. Hero Banner azul espacial con constelación de puntos y 4 tarjetas con checks de colores.
 *  5. Tipografías: 'Ruda' para títulos y 'Open Sans' para textos.
 *  6. 100% comentado en español línea por línea.
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

  // Contexto multi-escuela global (provee lista de escuelas y control del modal selector)
  const { escuelas, setSelectorModalAbierto, cambiarEscuela } = useSchool();

  // Estado para capturar el código hash en el validador de constancias
  const [codigoHash, setCodigoHash] = useState<string>('');

  // Función para abrir la ventana modal del selector de escuelas
  const abrirSelectorEscuela = () => {
    setSelectorModalAbierto(true);
  };

  // Función para verificar una constancia oficial por su código hash
  const handleValidarDocumento = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigoHash.trim()) {
      navigate(`/validar-constancia/${codigoHash.trim()}`);
    }
  };

  return (
    <div className="portal-bdt-wrapper">
      
      {/* ── 1. CABECERA SUPERIOR INSTITUCIONAL BLANCA (TOP HEADER BDT) ── */}
      <div className="bdt-top-institutional-header">
        <div className="d-flex align-items-center gap-3">
          {/* Cintillo oficial del Ministerio del Poder Popular para la Educación */}
          <img 
            src="/assets/img/logoMPPE.png" 
            alt="Ministerio del Poder Popular para la Educación" 
            className="bdt-mppe-logo"
          />
        </div>
        <div className="d-flex align-items-center gap-2">
          {/* Escudo institucional oficial de SIGAE */}
          <img 
            src="/assets/img/sigae.png" 
            alt="SIGAE Institucional" 
            className="bdt-bicentenario-logo"
          />
        </div>
      </div>

      {/* ── 2. BARRA DE UTILIDADES AZUL NOCHE (SUB-HEADER BDT) ── */}
      <div className="bdt-utility-bar d-none d-md-flex">
        {/* Redes sociales institucionales en circulitos blancos */}
        <div className="d-flex align-items-center gap-2">
          <span className="small me-1 text-light opacity-75">Canales oficiales:</span>
          <a href="#" className="bdt-social-icon" title="Instagram"><i className="bi bi-instagram"></i></a>
          <a href="#" className="bdt-social-icon" title="Facebook"><i className="bi bi-facebook"></i></a>
          <a href="#" className="bdt-social-icon" title="Telegram"><i className="bi bi-telegram"></i></a>
        </div>

        {/* Botones cápsula de Sedes y Validador */}
        <div className="d-flex align-items-center gap-2.5">
          <button 
            type="button" 
            className="bdt-btn-pill-white"
            onClick={abrirSelectorEscuela}
          >
            <i className="bi bi-geo-alt-fill text-danger"></i>
            <span>SEDES EDUCATIVAS</span>
          </button>

          <a href="#verificar" className="bdt-btn-pill-green">
            <i className="bi bi-qr-code-scan"></i>
            <span>VALIDAR CONSTANCIA</span>
          </a>
        </div>
      </div>

      {/* ── 3. BARRA DE MENÚ FLOTANTE CÁPSULA (ESTILO EXACTO BDT) ── */}
      <div className="bdt-floating-navbar-container">
        <nav className="bdt-floating-navbar">
          
          {/* Logo y Nombre de la Barra Flotante */}
          <Link to="/" className="bdt-float-brand" title="SIGAE">
            <div className="bdt-float-logo-badge">
              <img 
                src="/assets/img/sigae.png" 
                alt="SIGAE Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <h2 className="bdt-float-brand-title">SIGAE</h2>
              <p className="bdt-float-brand-sub">Gestión Escolar</p>
            </div>
          </Link>

          {/* Enlaces de Navegación Centrales */}
          <div className="d-none d-lg-flex align-items-center gap-1">
            <a href="#inicio" className="bdt-float-navlink">
              <span>Conócenos</span>
            </a>
            <a href="#razones" className="bdt-float-navlink">
              <span>Beneficios</span>
            </a>
            <a href="#planteles" className="bdt-float-navlink">
              <span>Planteles</span>
            </a>
            <a href="#servicios" className="bdt-float-navlink">
              <span>Servicios</span>
            </a>
            <a href="#verificar" className="bdt-float-navlink">
              <span>Validar QR</span>
            </a>
          </div>

          {/* Botón Píldora Azul Eléctrico: "SIGAE en Línea" (Abre el Selector de Escuelas) */}
          <div className="d-flex align-items-center gap-2">
            <button 
              type="button" 
              className="bdt-btn-en-linea"
              onClick={abrirSelectorEscuela}
              title="Acceder a tu institución educativa"
            >
              <i className="bi bi-shield-lock-fill"></i>
              <span>SIGAE en Línea</span>
            </button>
          </div>

        </nav>
      </div>

      {/* ── 4. HERO BANNER AZUL ESPACIAL CON CONSTELACIÓN DE PUNTOS Y RAZONES BDT ── */}
      <section id="inicio" className="bdt-hero-section">
        <div className="container py-3 py-lg-4 position-relative" style={{ zIndex: 2 }}>
          <div className="row align-items-center g-4 g-lg-5">
            
            {/* Columna Izquierda: Titular y Botón de Ingreso */}
            <div className="col-lg-6 text-center text-lg-start">
              
              <div className="bdt-hero-badge">
                <i className="bi bi-patch-check-fill text-warning"></i>
                <span>Plataforma Oficial Multi-Institución &bull; MPPE 2026-2027</span>
              </div>

              <h1 className="bdt-hero-title">
                4 Razones para Unirte al Ecosistema Escolar SIGAE
              </h1>

              <p className="bdt-hero-desc mx-auto mx-lg-0">
                La solución digital unificada que transforma la gestión de instituciones educativas con costo cero de operación y máxima ciberseguridad.
              </p>

              {/* Botón de Acción Principal */}
              <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start gap-3">
                <button 
                  type="button" 
                  className="bdt-btn-pill-green py-2.5 px-4 fs-6 shadow-sm"
                  onClick={abrirSelectorEscuela}
                >
                  <i className="bi bi-buildings-fill"></i>
                  <span>🏛️ Ingresar a mi Escuela</span>
                </button>

                <a 
                  href="#planteles" 
                  className="btn btn-outline-light rounded-pill px-4 py-2.5 fw-semibold d-inline-flex align-items-center gap-2 font-ruda"
                  style={{ fontSize: '0.86rem' }}
                >
                  <i className="bi bi-arrow-down-circle"></i>
                  <span>Ver Sedes Activas</span>
                </a>
              </div>

            </div>

            {/* Columna Derecha: Las 4 Tarjetas de Razones con Checks de Colores (Estilo BDT) */}
            <div id="razones" className="col-lg-6">
              
              {/* Razón 1: Check Verde */}
              <div className="bdt-reason-card">
                <div className="bdt-reason-check" style={{ backgroundColor: 'var(--bdt-green-accent)' }}>
                  <i className="bi bi-check-lg"></i>
                </div>
                <p className="bdt-reason-text">
                  Garantizas la seguridad, confidencialidad y aislamiento de datos de cada escuela con Row Level Security (RLS).
                </p>
              </div>

              {/* Razón 2: Check Azul Cielo */}
              <div className="bdt-reason-card">
                <div className="bdt-reason-check" style={{ backgroundColor: 'var(--bdt-sky-accent)' }}>
                  <i className="bi bi-check-lg"></i>
                </div>
                <p className="bdt-reason-text">
                  Cumplimiento estricto de las directrices y normativas pedagógicas del Ministerio del Poder Popular para la Educación.
                </p>
              </div>

              {/* Razón 3: Check Púrpura */}
              <div className="bdt-reason-card">
                <div className="bdt-reason-check" style={{ backgroundColor: 'var(--bdt-purple-accent)' }}>
                  <i className="bi bi-check-lg"></i>
                </div>
                <p className="bdt-reason-text">
                  Cero costo de operación integrando el almacenamiento de documentos pesados en Google Drive Pro institucional (5TB).
                </p>
              </div>

              {/* Razón 4: Check Naranja */}
              <div className="bdt-reason-card">
                <div className="bdt-reason-check" style={{ backgroundColor: 'var(--bdt-orange-accent)' }}>
                  <i className="bi bi-check-lg"></i>
                </div>
                <p className="bdt-reason-text">
                  Automatización completa de admisiones en línea, red de transporte escolar y validación criptográfica de constancias QR.
                </p>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ── 5. PLANTELES EDUCATIVOS AFILIADOS (SEDES ACTIVAS) ── */}
      <section id="planteles" className="py-5 px-3">
        <div className="container py-2">
          
          <div className="text-center max-w-xl mx-auto mb-5">
            <span className="badge bg-light text-primary border px-3 py-1.5 rounded-pill fw-bold text-uppercase small">
              <i className="bi bi-buildings-fill me-1"></i>
              Red de Sedes Escolares
            </span>
            <h2 className="fw-bolder fs-2 text-dark mt-2 mb-2 font-ruda">
              Instituciones Educativas Conectadas
            </h2>
            <p className="text-muted small">
              Haz clic en tu plantel para ingresar a la plataforma o consultar información institucional:
            </p>
          </div>

          <div className="row g-4 justify-content-center">
            {escuelas.map((esc) => {
              const esSB = esc.id_escuela === 'sb';
              return (
                <div key={esc.id_escuela} className="col-md-6 col-lg-5">
                  <div className="bdt-school-card">
                    <div>
                      {/* Cabecera con Escudo y Códigos */}
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <div 
                          className="rounded-3 p-1 border d-flex align-items-center justify-content-center bg-white shadow-xs"
                          style={{ width: '58px', height: '58px', flexShrink: 0 }}
                        >
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

                      {/* Dirección */}
                      <p className="text-muted small mb-2" style={{ fontSize: '0.85rem' }}>
                        <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                        {esc.direccion}
                      </p>

                      {/* PEIC */}
                      <p className="text-secondary small fst-italic mb-4" style={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                        &ldquo;{esc.peic || 'Educación integral y valores comunitarios.'}&rdquo;
                      </p>
                    </div>

                    {/* Botones de Acción */}
                    <div className="d-flex gap-2 pt-2 border-top">
                      <Link 
                        to={`/portal/${esc.id_escuela}`} 
                        className="btn btn-outline-secondary rounded-pill py-2 px-3 fw-bold small flex-grow-1 font-ruda"
                      >
                        Ver Información
                      </Link>
                      
                      <button 
                        type="button" 
                        className="btn rounded-pill py-2 px-3 fw-bold small text-white flex-grow-1 shadow-xs font-ruda"
                        style={{ backgroundColor: esSB ? '#059669' : '#2A52BE' }}
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

      {/* ── 6. SERVICIOS Y MÓDULOS DE LA PLATAFORMA ── */}
      <section id="servicios" className="py-5 px-3 bg-white border-top border-bottom">
        <div className="container py-2">
          
          <div className="text-center max-w-xl mx-auto mb-5">
            <span className="badge bg-light text-primary border px-3 py-1.5 rounded-pill fw-bold text-uppercase small">
              <i className="bi bi-cpu-fill me-1"></i>
              Servicios Digitales
            </span>
            <h2 className="fw-bolder fs-2 text-dark mt-2 mb-2 font-ruda">
              Capacidades Integradas del SIGAE
            </h2>
            <p className="text-muted small">
              Gestión centralizada para la comunidad escolar con máxima disponibilidad y seguridad.
            </p>
          </div>

          <div className="row g-4">
            
            {/* Servicio 1: Admisiones en Línea */}
            <div className="col-md-6 col-lg-3">
              <div className="p-3.5 bg-light rounded-4 border h-100 d-flex flex-column">
                <img 
                  src="/assets/img/formalizacion_3d.png" 
                  alt="Admisiones" 
                  style={{ width: '100%', height: '140px', objectFit: 'contain' }} 
                  className="mb-2"
                />
                <h4 className="fs-6 fw-bold text-dark font-ruda mb-1">Admisiones Digitales</h4>
                <p className="text-muted small m-0" style={{ lineHeight: 1.5 }}>
                  Solicitud de cupos, recaudos digitalizados y asignación transparente de matrícula.
                </p>
              </div>
            </div>

            {/* Servicio 2: Red de Transporte */}
            <div className="col-md-6 col-lg-3">
              <div className="p-3.5 bg-light rounded-4 border h-100 d-flex flex-column">
                <img 
                  src="/assets/img/censo_3d.png" 
                  alt="Transporte" 
                  style={{ width: '100%', height: '140px', objectFit: 'contain' }} 
                  className="mb-2"
                />
                <h4 className="fs-6 fw-bold text-dark font-ruda mb-1">Rutas de Transporte</h4>
                <p className="text-muted small m-0" style={{ lineHeight: 1.5 }}>
                  Censo estudiantil, rutogramas por sector, paradas y control de unidades Yutong/Encava.
                </p>
              </div>
            </div>

            {/* Servicio 3: Ciberseguridad y RLS */}
            <div className="col-md-6 col-lg-3">
              <div className="p-3.5 bg-light rounded-4 border h-100 d-flex flex-column">
                <img 
                  src="/assets/img/seguridad_3d.png" 
                  alt="Seguridad" 
                  style={{ width: '100%', height: '140px', objectFit: 'contain' }} 
                  className="mb-2"
                />
                <h4 className="fs-6 fw-bold text-dark font-ruda mb-1">Seguridad & RLS</h4>
                <p className="text-muted small m-0" style={{ lineHeight: 1.5 }}>
                  Políticas Row Level Security en Supabase: los datos de cada escuela quedan totalmente blindados.
                </p>
              </div>
            </div>

            {/* Servicio 4: Control Pedagógico */}
            <div className="col-md-6 col-lg-3">
              <div className="p-3.5 bg-light rounded-4 border h-100 d-flex flex-column">
                <img 
                  src="/assets/img/personal_3d.png" 
                  alt="Docentes" 
                  style={{ width: '100%', height: '140px', objectFit: 'contain' }} 
                  className="mb-2"
                />
                <h4 className="fs-6 fw-bold text-dark font-ruda mb-1">Gestión Pedagógica</h4>
                <p className="text-muted small m-0" style={{ lineHeight: 1.5 }}>
                  Reportes diarios de clase, expedientes docentes y expedientes académicos de los estudiantes.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── 7. VALIDADOR PÚBLICO CRIPTOGRÁFICO DE CONSTANCIAS QR ── */}
      <section id="verificar" className="py-5 px-3">
        <div className="container py-2">
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
                  className="btn btn-dark rounded-pill px-4 fw-bold text-nowrap font-ruda"
                >
                  Validar Documento
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* ── 8. PIE DE PÁGINA CORPORATIVO (FOOTER BDT) ── */}
      <footer className="bdt-footer">
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

      {/* ── 9. MODAL INTERACTIVO DE SELECCIÓN DE ESCUELA ── */}
      <SelectorEscuelaModal destino="login" />

    </div>
  );
};
