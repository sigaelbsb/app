/**
 * ==============================================================================
 * ARCHIVO: src/pages/publica/PortalGeneralSIGAE.tsx
 * PROPÓSITO: Portal Web General Centralizado de SIGAE (Landing Page Pública).
 * INTEGRACIÓN VISUAL Y DE CONTENIDO:
 *  1. Arquitectura Visual Corporativa BDT:
 *     - Barra de menú flotante en cápsula alargada continua (#1b2c6e, border-radius: 9999px).
 *     - Botón píldora azul institucional "SIGAEenLínea" (#2957cd).
 *     - Cintillo superior blanco y barra de utilidades azul marino.
 *  2. Acompañamiento 3D de Zoe y Max:
 *     - Personajes oficiales 3D (/zoe_max_duo_3d.png) con globo de diálogo dinámico.
 *     - Widget flotante interactivo en la esquina inferior derecha.
 *  3. Rescate Fiel de la Web Anterior (https://uelibertadorbolivar.github.io/web/inicio.html):
 *     - Cintillo superior dinámico con ubicación: "Miraflores, municipio Punceres, estado Monagas: Hoy [fecha]".
 *     - Paleta de colores rescatada: Púrpura Bicentenario (#92278f), Naranja Vivo (#f26522), Verde Lima (#8dc63f).
 *     - Las 4 Modalidades Educativas: Presencial, E-Learning, B-Learning y M-Learning.
 *     - Módulos Más Populares: Boletines, Actualización de Datos, Solicitud de Cupos, Guías Pedagógicas / Colección Bicentenario, Constancias QR.
 *     - Reseña Histórica Oficial: Fundación en 1948, servicio al trabajador petrolero y comunidad de Miraflores.
 *     - Misión, Visión y Caracterización de Matrícula (Inicial, Primaria, Media General, Docentes).
 *     - Créditos institucionales y Licencia Creative Commons (Prof. Luis Velásquez, Prof. Luis Salmerón).
 *  4. 100% comentado en español línea por línea para usuarios no programadores.
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSchool } from '../../context/SchoolContext';
import { SelectorEscuelaModal } from '../../components/escuelas/SelectorEscuelaModal';
import '../../portal_publico.css';

export const PortalGeneralSIGAE: React.FC = () => {
  // Hook de navegación de React Router para redirigir entre páginas
  const navigate = useNavigate();

  // Contexto multi-escuela global (provee lista de escuelas y control del modal selector)
  const { escuelas, setSelectorModalAbierto, cambiarEscuela } = useSchool();

  // Estado para capturar el código hash en el validador de constancias
  const [codigoHash, setCodigoHash] = useState<string>('');

  // Estado para alternar el mensaje de asistencia de Zoe y Max
  const [mensajeAsistente, setMensajeAsistente] = useState<string>(
    '¡Hola! Somos Zoe y Max, tus guías escolares en SIGAE. Te damos la bienvenida a nuestro portal unificado.'
  );

  // Control para asegurar que la barra flote fija sobre todo el contenido al hacer scroll (efecto cápsula BDT)
  const [esFlotante, setEsFlotante] = useState<boolean>(false);

  // Efecto para escuchar el desplazamiento vertical y activar la clase flotante
  useEffect(() => {
    const handleScroll = () => {
      // Si el usuario hace scroll hacia abajo más de 35px, fijamos la barra en el aire
      if (window.scrollY > 35) {
        setEsFlotante(true);
      } else {
        setEsFlotante(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Formateo de la fecha actual en español rescatado del comportamiento del portal anterior
  const fechaHoyTexto = new Date().toLocaleDateString('es-VE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="portal-bdt-wrapper">
      
      {/* ── 1. LA AUTÉNTICA BARRA SUPERPUESTA Y FLOTANTE (ESTILO BDT CON LOGO SIGAE AL CENTRO) ── */}
      <header className="bdt-floating-navbar-container">
        <nav className="bdt-floating-navbar">
          
          {/* LADO IZQUIERDO: Enlaces de navegación rápida (sin logo ministerial en el menú) */}
          <div className="d-none d-lg-flex align-items-center gap-1">
            <a href="#inicio" className="bdt-float-navlink">
              <span>Inicio</span>
            </a>
            <a href="#modalidades" className="bdt-float-navlink">
              <span>Modalidades</span>
            </a>
            <a href="#modulos" className="bdt-float-navlink">
              <span>Módulos</span>
            </a>
            <a href="#planteles" className="bdt-float-navlink">
              <span>Planteles</span>
            </a>
            <a href="#verificar" className="bdt-float-navlink">
              <span>Validar QR</span>
            </a>
          </div>

          {/* CENTRO PROTAGONISTA: ESCUDO FLOTANTE DE SIGAE (ESTILO LOGIN CON RESPLANDOR Y LEVITACIÓN) Y TÍTULO INSTITUCIONAL */}
          <Link to="/" className="bdt-float-center-branding" title="SIGAE - Sistema Integral de Gestión y Administración Escolar">
            <div className="sigae-login-style-shield-wrapper">
              <div className="sigae-login-style-shield-glow"></div>
              <img 
                src="/assets/img/sigae.png?v=escudo3d" 
                alt="Escudo Oficial SIGAE 3D Flotante" 
                className="sigae-login-style-shield-img"
              />
            </div>
            <div className="bdt-float-title-group">
              <span className="bdt-float-brand-acronym">SIGAE</span>
              <span className="bdt-float-brand-full">Sistema Integral de Gestión y Administración Escolar</span>
            </div>
          </Link>

          {/* LADO DERECHO: Badge Zoe & Max + Botón Cápsula 'SIGAEenLínea' */}
          <div className="d-flex align-items-center gap-2 gap-md-2.5">
            
            {/* Badge de Asistentes Zoe & Max */}
            <div className="bdt-badge-renace d-none d-lg-flex" title="Asistentes Inteligentes Escolares">
              <i className="bi bi-stars text-warning fs-6"></i>
              <div>
                <div className="bdt-badge-renace-title">ZOE & MAX</div>
                <div className="bdt-badge-renace-sub">IA ESCOLAR ★</div>
              </div>
            </div>

            {/* BOTÓN PÍLDORA EXACTO: 'SIGAEenLínea' (Equivalente fiel a BDTenLínea) */}
            <button 
              type="button" 
              className="bdt-btn-en-linea"
              onClick={abrirSelectorEscuela}
              title="Acceder a tu institución escolar"
            >
              <i className="bi bi-shield-lock-fill"></i>
              <span>SIGAEenLínea</span>
            </button>

          </div>

        </nav>
      </header>

      {/* ── 5. HERO BANNER PRINCIPAL CON ZOE Y MAX (ASISTENTES INSTITUCIONALES) ── */}
      <section id="inicio" className="bdt-hero-section">
        <div className="container py-3 py-lg-4 position-relative" style={{ zIndex: 2 }}>
          <div className="row align-items-center g-4 g-lg-5">
            
            {/* Columna Izquierda: Titular y Llamado a la Acción */}
            <div className="col-lg-6 text-center text-lg-start">
              
              <div className="d-inline-flex flex-wrap align-items-center gap-2 bg-white border border-secondary border-opacity-25 px-3 py-1.5 rounded-pill mb-3 small fw-bold shadow-xs text-dark">
                <i className="bi bi-geo-alt-fill text-warning"></i>
                <span>Miraflores, municipio Punceres &bull; Hoy {fechaHoyTexto.charAt(0).toUpperCase() + fechaHoyTexto.slice(1)}</span>
              </div>

              <h1 className="bdt-hero-title">
                Portal Integral de Gestión y Administración Escolar
              </h1>

              <p className="bdt-hero-desc mx-auto mx-lg-0">
                La plataforma unificada de las instituciones educativas de Punceres y Monagas. Administración pedagógica, boletines de calificaciones, control de matrícula y expedientes con seguridad RLS y costo cero.
              </p>

              {/* Botón de Acción Principal */}
              <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start gap-3">
                <button 
                  type="button" 
                  className="btn rounded-pill py-2.5 px-4 fs-6 shadow-sm text-white fw-bold d-inline-flex align-items-center gap-2 font-ruda"
                  style={{ backgroundColor: 'var(--bdt-orange-action)', border: 'none' }}
                  onClick={abrirSelectorEscuela}
                >
                  <i className="bi bi-buildings-fill"></i>
                  <span>🏛️ Ingresar a mi Escuela</span>
                </button>

                <a 
                  href="#modulos" 
                  className="btn btn-outline-primary rounded-pill px-4 py-2.5 fw-bold d-inline-flex align-items-center gap-2 font-ruda shadow-xs"
                  style={{ fontSize: '0.86rem', borderColor: '#0e2c53', color: '#0e2c53', backgroundColor: '#ffffff' }}
                >
                  <i className="bi bi-grid-fill text-warning"></i>
                  <span>Explorar Módulos Populares</span>
                </a>
              </div>

            </div>

            {/* Columna Derecha: Ilustración 3D de Zoe y Max con Globo de Diálogo */}
            <div id="asistentes" className="col-lg-6 text-center">
              <div className="bdt-zoe-max-hero-card">
                
                {/* Globo de Diálogo de Zoe y Max */}
                <div className="bdt-zoe-max-speech-bubble mx-auto">
                  <div className="d-flex align-items-center gap-1.5 fw-bold text-primary small mb-1">
                    <i className="bi bi-chat-quote-fill text-warning"></i>
                    <span>Zoe & Max te dan la bienvenida</span>
                  </div>
                  <p className="m-0 extra-small text-secondary" style={{ fontSize: '0.82rem', lineHeight: 1.45 }}>
                    {mensajeAsistente}
                  </p>
                </div>

                {/* Ilustración 3D Oficial de Zoe y Max */}
                <img 
                  src="/zoe_max_duo_3d.png" 
                  alt="Zoe y Max - Asistentes Escolares SIGAE" 
                  className="bdt-zoe-max-img"
                  onError={(e) => {
                    // Respaldo alternativo en caso de no cargar el archivo 3D
                    (e.target as HTMLImageElement).src = '/zoe_max_duo.png';
                  }}
                />

                <div className="mt-2 text-secondary small fw-bold">
                  <span style={{ color: '#0284c7' }}>Zoe &bull; Inteligencia Pedagógica</span> &bull; <span style={{ color: '#ea580c' }}>Max &bull; Asistente Tecnológico</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 6. SECCIÓN DE LAS 4 RAZONES CON CHECKS MULTICOLOR (ESTILO BDT) ── */}
      <section className="py-5 px-3 bg-white border-bottom">
        <div className="container py-2">
          
          <div className="text-center max-w-xl mx-auto mb-5">
            <span className="badge bg-light text-primary border px-3 py-1.5 rounded-pill fw-bold text-uppercase small">
              <i className="bi bi-shield-check me-1"></i>
              Pilares de Confianza
            </span>
            <h2 className="fw-bolder fs-2 text-dark mt-2 mb-2 font-ruda">
              4 Garantías del Ecosistema Institucional
            </h2>
            <p className="text-muted small">
              Estructura formal diseñada para la tranquilidad de directores, docentes y familias:
            </p>
          </div>

          <div className="row g-3">
            
            {/* Razón 1: Check Verde */}
            <div className="col-md-6 col-lg-3">
              <div className="p-3.5 bg-light rounded-4 border h-100 d-flex flex-column">
                <div className="d-flex align-items-center gap-2.5 mb-2">
                  <div className="bdt-reason-check" style={{ backgroundColor: 'var(--bdt-green)' }}>
                    <i className="bi bi-check-lg"></i>
                  </div>
                  <h3 className="fs-6 fw-bold text-dark font-ruda m-0">Aislamiento RLS</h3>
                </div>
                <p className="text-muted small m-0" style={{ lineHeight: 1.5 }}>
                  Row Level Security en Supabase garantiza que cada escuela accede exclusivamente a sus propios registros de forma hermética.
                </p>
              </div>
            </div>

            {/* Razón 2: Check Azul Cielo */}
            <div className="col-md-6 col-lg-3">
              <div className="p-3.5 bg-light rounded-4 border h-100 d-flex flex-column">
                <div className="d-flex align-items-center gap-2.5 mb-2">
                  <div className="bdt-reason-check" style={{ backgroundColor: '#0ea5e9' }}>
                    <i className="bi bi-check-lg"></i>
                  </div>
                  <h3 className="fs-6 fw-bold text-dark font-ruda m-0">Normativa MPPE</h3>
                </div>
                <p className="text-muted small m-0" style={{ lineHeight: 1.5 }}>
                  Cumplimiento estricto con los formatos oficiales, PEIC y directrices del Ministerio de Educación y Colección Bicentenario.
                </p>
              </div>
            </div>

            {/* Razón 3: Check Púrpura Bicentenario */}
            <div className="col-md-6 col-lg-3">
              <div className="p-3.5 bg-light rounded-4 border h-100 d-flex flex-column">
                <div className="d-flex align-items-center gap-2.5 mb-2">
                  <div className="bdt-reason-check" style={{ backgroundColor: 'var(--bdt-purple-bicentenario)' }}>
                    <i className="bi bi-check-lg"></i>
                  </div>
                  <h3 className="fs-6 fw-bold text-dark font-ruda m-0">Google Drive Pro</h3>
                </div>
                <p className="text-muted small m-0" style={{ lineHeight: 1.5 }}>
                  Almacenamiento institucional para archivos pesados (hasta 5TB) a costo cero sin saturar la base de datos de Supabase.
                </p>
              </div>
            </div>

            {/* Razón 4: Check Naranja de Acción */}
            <div className="col-md-6 col-lg-3">
              <div className="p-3.5 bg-light rounded-4 border h-100 d-flex flex-column">
                <div className="d-flex align-items-center gap-2.5 mb-2">
                  <div className="bdt-reason-check" style={{ backgroundColor: 'var(--bdt-orange-action)' }}>
                    <i className="bi bi-check-lg"></i>
                  </div>
                  <h3 className="fs-6 fw-bold text-dark font-ruda m-0">Validación QR</h3>
                </div>
                <p className="text-muted small m-0" style={{ lineHeight: 1.5 }}>
                  Constancias de estudio, carnets y notas con código hash criptográfico inviolable verificable públicamente en línea.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── 7. SECCIÓN RESCATADA: LAS 4 MODALIDADES EDUCATIVAS TIC ── */}
      <section id="modalidades" className="py-5 px-3" style={{ background: '#f8fafc' }}>
        <div className="container py-2">
          
          <div className="text-center max-w-2xl mx-auto mb-5">
            <span 
              className="badge px-3 py-1.5 rounded-pill fw-bold text-uppercase small text-white"
              style={{ backgroundColor: 'var(--bdt-purple-bicentenario)' }}
            >
              <i className="bi bi-laptop me-1"></i>
              Transformación Digital e Innovación
            </span>
            <h2 className="fw-bolder fs-2 text-dark mt-2 mb-2 font-ruda">
              4 Modalidades Educativas Integradas
            </h2>
            <p className="text-muted small" style={{ maxWidth: '680px', margin: '0 auto' }}>
              Desde la transición post-pandemia y el avance tecnológico, nuestras instituciones implementan Tecnologías de la Información y Comunicación (TIC) para garantizar la continuidad formativa:
            </p>
          </div>

          <div className="row g-4">
            
            {/* Modalidad 1: Presencial */}
            <div className="col-md-6 col-lg-3">
              <div className="bdt-modalidad-card">
                <div className="bdt-modalidad-icon" style={{ backgroundColor: 'var(--bdt-navy-primary)' }}>
                  <i className="bi bi-person-video3"></i>
                </div>
                <h3 className="fs-5 fw-bold text-dark font-ruda mb-2">Presencial</h3>
                <p className="text-muted small m-0" style={{ lineHeight: 1.6 }}>
                  Es la modalidad tradicional en la que los estudiantes asisten físicamente a las aulas de clase, interactuando directamente con sus profesores y compañeros de estudio.
                </p>
                <div className="mt-3 pt-3 border-top d-flex align-items-center gap-1 extra-small text-primary fw-bold">
                  <i className="bi bi-building"></i>
                  <span>Aulas, laboratorios y talleres</span>
                </div>
              </div>
            </div>

            {/* Modalidad 2: E-Learning */}
            <div className="col-md-6 col-lg-3">
              <div className="bdt-modalidad-card">
                <div className="bdt-modalidad-icon" style={{ backgroundColor: 'var(--bdt-purple-bicentenario)' }}>
                  <i className="bi bi-cloud-arrow-down-fill"></i>
                </div>
                <h3 className="fs-5 fw-bold text-dark font-ruda mb-2">E-Learning</h3>
                <p className="text-muted small m-0" style={{ lineHeight: 1.6 }}>
                  Educación completamente en línea, donde los estudiantes acceden a materiales de estudio, guías pedagógicas, evaluaciones y foros a través de plataformas virtuales.
                </p>
                <div className="mt-3 pt-3 border-top d-flex align-items-center gap-1 extra-small fw-bold" style={{ color: 'var(--bdt-purple-bicentenario)' }}>
                  <i className="bi bi-globe"></i>
                  <span>Campus virtual y recursos web</span>
                </div>
              </div>
            </div>

            {/* Modalidad 3: B-Learning (Híbrido) */}
            <div className="col-md-6 col-lg-3">
              <div className="bdt-modalidad-card">
                <div className="bdt-modalidad-icon" style={{ backgroundColor: 'var(--bdt-orange-action)' }}>
                  <i className="bi bi-diagram-3-fill"></i>
                </div>
                <h3 className="fs-5 fw-bold text-dark font-ruda mb-2">B-Learning</h3>
                <p className="text-muted small m-0" style={{ lineHeight: 1.6 }}>
                  Modalidad semipresencial o híbrida que combina la enseñanza directa en el aula con el aprendizaje en línea, complementando las clases con recursos digitales interactivos.
                </p>
                <div className="mt-3 pt-3 border-top d-flex align-items-center gap-1 extra-small fw-bold" style={{ color: 'var(--bdt-orange-action)' }}>
                  <i className="bi bi-arrow-repeat"></i>
                  <span>Enseñanza mixta y combinada</span>
                </div>
              </div>
            </div>

            {/* Modalidad 4: M-Learning (Móvil) */}
            <div className="col-md-6 col-lg-3">
              <div className="bdt-modalidad-card">
                <div className="bdt-modalidad-icon" style={{ backgroundColor: 'var(--bdt-lime-green)' }}>
                  <i className="bi bi-phone-fill"></i>
                </div>
                <h3 className="fs-5 fw-bold text-dark font-ruda mb-2">M-Learning</h3>
                <p className="text-muted small m-0" style={{ lineHeight: 1.6 }}>
                  Aprendizaje adaptativo a través de dispositivos móviles como teléfonos inteligentes y tabletas. Permite a los estudiantes y familias acceder desde cualquier lugar sin barreras.
                </p>
                <div className="mt-3 pt-3 border-top d-flex align-items-center gap-1 extra-small fw-bold" style={{ color: '#15803d' }}>
                  <i className="bi bi-phone"></i>
                  <span>Diseño Mobile-First optimizado</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── 8. SECCIÓN RESCATADA: MÓDULOS MÁS POPULARES DE LA WEB ESCOLAR ── */}
      <section id="modulos" className="py-5 px-3 bg-white border-top border-bottom">
        <div className="container py-2">
          
          <div className="text-center max-w-xl mx-auto mb-5">
            <span 
              className="badge px-3 py-1.5 rounded-pill fw-bold text-uppercase small text-white"
              style={{ backgroundColor: 'var(--bdt-orange-action)' }}
            >
              <i className="bi bi-fire me-1"></i>
              Módulos Más Solicitados
            </span>
            <h2 className="fw-bolder fs-2 text-dark mt-2 mb-2 font-ruda">
              Servicios Frecuentes de la Comunidad
            </h2>
            <p className="text-muted small">
              Los accesos y trámites administrativos más utilizados por directores, docentes y representantes:
            </p>
          </div>

          <div className="row g-3">
            
            {/* Módulo Popular 1: Boletines y Calificaciones */}
            <div className="col-md-6 col-lg-4">
              <div 
                className="bdt-popular-card cursor-pointer"
                onClick={abrirSelectorEscuela}
                title="Consultar boletines académicos"
              >
                <div className="bdt-popular-icon">
                  <i className="bi bi-file-earmark-bar-graph-fill"></i>
                </div>
                <div>
                  <h4 className="fs-6 fw-bold m-0 font-ruda">Boletines y Resumen</h4>
                  <p className="text-muted extra-small m-0 mt-1" style={{ lineHeight: 1.45 }}>
                    Consulta de progreso académico, calificaciones por lapso, asistencias y observaciones docentes.
                  </p>
                </div>
              </div>
            </div>

            {/* Módulo Popular 2: Actualización de Datos */}
            <div className="col-md-6 col-lg-4">
              <div 
                className="bdt-popular-card cursor-pointer"
                onClick={abrirSelectorEscuela}
                title="Actualizar datos escolares"
              >
                <div className="bdt-popular-icon" style={{ color: 'var(--bdt-purple-bicentenario)', background: '#fae8ff' }}>
                  <i className="bi bi-person-vcard-fill"></i>
                </div>
                <div>
                  <h4 className="fs-6 fw-bold m-0 font-ruda">Actualización de Datos</h4>
                  <p className="text-muted extra-small m-0 mt-1" style={{ lineHeight: 1.45 }}>
                    Simplificación de trámites y expedientes familiares actualizados para la matrícula escolar.
                  </p>
                </div>
              </div>
            </div>

            {/* Módulo Popular 3: Solicitud de Cupos */}
            <div className="col-md-6 col-lg-4">
              <div 
                className="bdt-popular-card cursor-pointer"
                onClick={abrirSelectorEscuela}
                title="Solicitar cupo escolar"
              >
                <div className="bdt-popular-icon" style={{ color: '#0284c7', background: '#e0f2fe' }}>
                  <i className="bi bi-envelope-paper-fill"></i>
                </div>
                <div>
                  <h4 className="fs-6 fw-bold m-0 font-ruda">Solicitud de Cupos</h4>
                  <p className="text-muted extra-small m-0 mt-1" style={{ lineHeight: 1.45 }}>
                    Recepción digital de requerimientos educativos según la disponibilidad de grupos, grado y año.
                  </p>
                </div>
              </div>
            </div>

            {/* Módulo Popular 4: Guías Pedagógicas & Colección Bicentenario */}
            <div className="col-md-6 col-lg-4">
              <div 
                className="bdt-popular-card cursor-pointer"
                onClick={abrirSelectorEscuela}
                title="Descargar recursos educativos"
              >
                <div className="bdt-popular-icon" style={{ color: '#16a34a', background: '#dcfce7' }}>
                  <i className="bi bi-book-half"></i>
                </div>
                <div>
                  <h4 className="fs-6 fw-bold m-0 font-ruda">Colección Bicentenario</h4>
                  <p className="text-muted extra-small m-0 mt-1" style={{ lineHeight: 1.45 }}>
                    Guías pedagógicas digitales, libros de texto oficiales y banco de actividades formativas.
                  </p>
                </div>
              </div>
            </div>

            {/* Módulo Popular 5: Constancias y Carnetización con QR */}
            <div className="col-md-6 col-lg-4">
              <a 
                href="#verificar"
                className="bdt-popular-card"
                title="Validar o tramitar constancias con QR"
              >
                <div className="bdt-popular-icon" style={{ color: '#d97706', background: '#fef3c7' }}>
                  <i className="bi bi-qr-code-scan"></i>
                </div>
                <div>
                  <h4 className="fs-6 fw-bold m-0 font-ruda">Constancias con Código QR</h4>
                  <p className="text-muted extra-small m-0 mt-1" style={{ lineHeight: 1.45 }}>
                    Emisión y validación criptográfica instantánea de constancias de estudio, conducta y notas.
                  </p>
                </div>
              </a>
            </div>

            {/* Módulo Popular 6: Rutas de Transporte Escolar */}
            <div className="col-md-6 col-lg-4">
              <div 
                className="bdt-popular-card cursor-pointer"
                onClick={abrirSelectorEscuela}
                title="Consultar censo y rutas de transporte"
              >
                <div className="bdt-popular-icon" style={{ color: '#6366f1', background: '#e0e7ff' }}>
                  <i className="bi bi-bus-front-fill"></i>
                </div>
                <div>
                  <h4 className="fs-6 fw-bold m-0 font-ruda">Transporte y Rutogramas</h4>
                  <p className="text-muted extra-small m-0 mt-1" style={{ lineHeight: 1.45 }}>
                    Censo de movilidad comunitaria, control de paradas y asignación de unidades para estudiantes.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── 9. SECCIÓN RESCATADA: HISTORIA INSTITUCIONAL (1948 - HOY) Y CARACTERIZACIÓN ── */}
      <section id="historia" className="py-5 px-3" style={{ background: '#fdfcf9' }}>
        <div className="container py-2">
          
          <div className="row g-4 g-lg-5 align-items-center mb-5">
            <div className="col-lg-6">
              <span className="badge bg-light text-primary border px-3 py-1.5 rounded-pill fw-bold text-uppercase small mb-2">
                <i className="bi bi-clock-history me-1"></i>
                Identidad y Raíces Históricas
              </span>
              <h2 className="fw-bolder fs-2 text-dark mb-3 font-ruda">
                Más de 75 Años de Tradición y Compromiso Educativo
              </h2>
              <p className="text-muted" style={{ lineHeight: 1.7, fontSize: '0.94rem' }}>
                La institución posee una rica trayectoria en la población de <strong>Miraflores, municipio Punceres</strong>. Desde su fundación en <strong>1948</strong>, ha desempeñado un papel protagónico y fundamental en la comunidad, destacándose por su firme vocación de brindar educación de calidad, bienestar y desarrollo integral al trabajador petrolero, a su familia y a todo el entorno social.
              </p>
              
              <div className="p-3 bg-white rounded-3 border-start border-4 border-warning shadow-xs mt-3">
                <h5 className="fs-6 fw-bold text-dark font-ruda m-0 mb-1">
                  Misión Oficial MPPE
                </h5>
                <p className="text-muted extra-small m-0" style={{ lineHeight: 1.55 }}>
                  Asegurar una educación de calidad mediante la ejecución de programas educativos emanados del MPPE, aplicando las mejores prácticas pedagógicas con un personal idóneo altamente capacitado y comprometido con el sistema educativo bolivariano.
                </p>
              </div>

              <div className="p-3 bg-white rounded-3 border-start border-4 border-primary shadow-xs mt-3">
                <h5 className="fs-6 fw-bold text-dark font-ruda m-0 mb-1">
                  Visión Oficial
                </h5>
                <p className="text-muted extra-small m-0" style={{ lineHeight: 1.55 }}>
                  Ser una institución de reconocida excelencia, formadora de nuevos republicanos y republicanas, transformadora de su entorno en los aspectos educativos, sociales, culturales y del fortalecimiento de la patria.
                </p>
              </div>
            </div>

            {/* Cajas de Caracterización de Matrícula (Rescatadas del HTML original) */}
            <div className="col-lg-6">
              <div className="row g-3">
                
                <div className="col-sm-6">
                  <div className="bdt-stat-box">
                    <div className="fs-2 text-primary mb-1">
                      <i className="bi bi-balloon-heart-fill" style={{ color: '#ec4899' }}></i>
                    </div>
                    <h4 className="fs-6 fw-bold text-dark font-ruda m-0">Educación Inicial</h4>
                    <span className="badge bg-light text-muted border extra-small mt-1">De 4 a 5 Años</span>
                    <p className="text-muted extra-small m-0 mt-2">
                      Desarrollo psicomotor, afectivo y social en las etapas maternal y preescolar.
                    </p>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="bdt-stat-box">
                    <div className="fs-2 text-primary mb-1">
                      <i className="bi bi-backpack-fill" style={{ color: '#3b82f6' }}></i>
                    </div>
                    <h4 className="fs-6 fw-bold text-dark font-ruda m-0">Educación Primaria</h4>
                    <span className="badge bg-light text-muted border extra-small mt-1">De 6 a 11 Años</span>
                    <p className="text-muted extra-small m-0 mt-2">
                      Lectoescritura, pensamiento lógico-matemático y valores de convivencia.
                    </p>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="bdt-stat-box">
                    <div className="fs-2 text-primary mb-1">
                      <i className="bi bi-mortarboard-fill" style={{ color: 'var(--bdt-purple-bicentenario)' }}></i>
                    </div>
                    <h4 className="fs-6 fw-bold text-dark font-ruda m-0">Media General</h4>
                    <span className="badge bg-light text-muted border extra-small mt-1">De 12 a 16 Años</span>
                    <p className="text-muted extra-small m-0 mt-2">
                      Formación científica, humanística, tecnológica y orientación vocacional.
                    </p>
                  </div>
                </div>

                <div className="col-sm-6">
                  <div className="bdt-stat-box">
                    <div className="fs-2 text-primary mb-1">
                      <i className="bi bi-people-fill" style={{ color: 'var(--bdt-orange-action)' }}></i>
                    </div>
                    <h4 className="fs-6 fw-bold text-dark font-ruda m-0">Talento Humano</h4>
                    <span className="badge bg-light text-muted border extra-small mt-1">Directivos y Especialistas</span>
                    <p className="text-muted extra-small m-0 mt-2">
                      Equipo docente multidisciplinario, administrativo, obrero y de salud escolar.
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── 10. PLANTELES EDUCATIVOS AFILIADOS (SEDES ACTIVAS EN SIGAE) ── */}
      <section id="planteles" className="py-5 px-3 bg-white border-top">
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
              Selecciona tu escuela para acceder al portal individual o iniciar sesión en el sistema:
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
                          style={{ width: '60px', height: '60px', flexShrink: 0 }}
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
                        style={{ backgroundColor: esSB ? '#059669' : '#2957cd' }}
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

      {/* ── 11. VALIDADOR PÚBLICO CRIPTOGRÁFICO DE CONSTANCIAS QR ── */}
      <section id="verificar" className="py-5 px-3" style={{ background: '#f8fafc' }}>
        <div className="container py-2">
          <div className="row align-items-center g-4">
            
            <div className="col-lg-4 text-center">
              <img 
                src="/assets/img/seguridad_3d.png" 
                alt="Validador de Constancias" 
                style={{ width: '160px', height: '160px', objectFit: 'contain' }}
              />
            </div>

            <div className="col-lg-8">
              <span className="badge bg-light text-primary border px-3 py-1 rounded-pill small fw-bold mb-2 d-inline-block">
                <i className="bi bi-patch-check-fill text-success me-1"></i>
                Validador Oficial Criptográfico
              </span>
              <h3 className="fs-3 fw-bold text-dark mb-2 font-ruda">
                Verificación de Autenticidad de Constancias y Documentos
              </h3>
              <p className="text-muted small mb-4" style={{ maxWidth: '640px' }}>
                Cualquier organismo, empleador, universidad o representante puede certificar la autenticidad de una constancia de estudio, carnet, notas o retiro emitida por SIGAE introduciendo el código hash único impreso en el documento:
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

      {/* ── 12. WIDGET FLOTANTE INTERACTIVO DE ZOE Y MAX (ASISTENTE ESCOLAR) ── */}
      <div 
        className="bdt-zoe-max-floating-widget" 
        onClick={() => {
          setMensajeAsistente(
            'Para ingresar a tu escuela o solicitar un cupo escolar, haz clic en el botón azul "SIGAEenLínea" arriba en el menú flotante.'
          );
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        title="Consultar orientación con Zoe y Max"
      >
        <img 
          src="/zoe_avatar.png" 
          alt="Avatar Zoe" 
          className="bdt-zoe-max-widget-avatar"
          onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
        />
        <div>
          <div className="bdt-zoe-max-widget-title">Asistente Zoe & Max</div>
          <div className="bdt-zoe-max-widget-sub">¿Preguntas sobre el sistema?</div>
        </div>
      </div>

      {/* ── 13. PIE DE PÁGINA CORPORATIVO (FOOTER BDT + CRÉDITOS RESCATADOS) ── */}
      <footer className="bdt-footer">
        <div className="container">
          <div className="row g-4 align-items-center mb-4">
            
            <div className="col-md-6 text-center text-md-start">
              {/* Logo Oficial del Ministerio del Poder Popular para la Educación (trasladado al pie de página) */}
              <div className="mb-3 d-inline-block p-2 bg-white rounded-3 shadow-xs">
                <img 
                  src="/assets/img/logoMPPE.png" 
                  alt="Ministerio del Poder Popular para la Educación" 
                  style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
                />
              </div>

              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-2">
                <img src="/assets/img/sigae.png" alt="SIGAE Logo" style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
                <span className="fw-bolder fs-5 font-ruda" style={{ color: 'var(--bdt-navy-deep)' }}>SIGAE</span>
                <span className="badge bg-light text-primary border extra-small">
                  v1.4.0
                </span>
              </div>
              <p className="small text-muted m-0" style={{ maxWidth: '480px', lineHeight: 1.55 }}>
                Sistema Integral de Gestión y Administración Escolar. Solución institucional centralizada multi-escuela para el control pedagógico, académico y comunitario de Punceres y Monagas.
              </p>
            </div>

            <div className="col-md-6 text-center text-md-end">
              <div className="p-3 rounded-3 bg-white border shadow-xs d-inline-block text-start">
                <div className="small fw-bold mb-1" style={{ color: 'var(--bdt-navy-deep)' }}>
                  <i className="bi bi-code-slash text-warning me-1"></i>
                  Créditos de Desarrollo Institucional:
                </div>
                <div className="extra-small text-secondary">
                  Desarrollador y Diseñador: <strong className="text-dark">Prof. Luis Velásquez</strong>
                </div>
                <div className="extra-small text-secondary">
                  Asesor Pedagógico: <strong className="text-dark">Prof. Luis Salmerón</strong>
                </div>
                <div className="extra-small text-muted mt-1">
                  Vía Nacional Monagas - Sucre, Campo Monagas Miraflores.
                </div>
              </div>
            </div>

          </div>

          <div className="pt-3 border-top border-slate-200 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 extra-small text-muted">
            <div>
              &copy; 2026 SIGAE &bull; Licencia Creative Commons Atribución-CompartirIgual 3.0 Venezuela
            </div>
            <div>
              Ministerio del Poder Popular para la Educación &bull; Escuelas DEP Oriente
            </div>
          </div>

        </div>
      </footer>

      {/* ── 14. MODAL INTERACTIVO DE SELECCIÓN DE ESCUELA ── */}
      <SelectorEscuelaModal destino="login" />

    </div>
  );
};
