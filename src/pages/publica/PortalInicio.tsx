/**
 * ==============================================================================
 * ARCHIVO: src/pages/publica/PortalInicio.tsx
 * PROPÓSITO: Web Informativa Oficial y Pública por Institución Educativa.
 * ESTILO VISUAL: SAP Fiori Horizon + Apple Glassmorphism + Mobile-First.
 * DESCRIPCIÓN:
 *  - Presenta la identidad, oferta académica, rutas de transporte y proceso de
 *    admisiones de cada plantel (U.E. Santa Bárbara o U.E. Libertador Bolívar).
 *  - Integra ilustraciones 3D reales del proyecto (Misión, Visión, PEIC, Rutas).
 *  - Ofrece enlaces directos para representantes y verificador de constancias QR.
 *  - Completamente adaptado y optimizado para teléfonos celulares (Mobile-First).
 * ==============================================================================
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { NavbarPublica } from '../../components/layout/NavbarPublica';
import '../../portal_publico.css';

// ── DEFINICIÓN DE TIPOS DE DATOS ──
// Estructura de la información institucional cargada desde Supabase
interface PerfilEscuelaData {
  id_escuela: string;
  nombre_institucion: string;
  codigo_dea: string;
  rif: string;
  direccion: string;
  mision: string;
  vision: string;
  objetivo: string;
  peic: string;
  telefono?: string;
  email?: string;
}

export const PortalInicio: React.FC = () => {
  // Parámetro de la ruta: /portal/:schoolId ('sb' o 'lb')
  const { schoolId } = useParams<{ schoolId?: string }>();
  const navigate = useNavigate();

  // Determinamos el código activo ('sb' por defecto si no es 'lb')
  const escuelaCodigo: 'sb' | 'lb' = (schoolId === 'lb' ? 'lb' : 'sb');
  const esSantaBarbara = escuelaCodigo === 'sb';

  // Estado para los datos institucionales desde Supabase
  const [perfil, setPerfil] = useState<PerfilEscuelaData | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  // Estado para el buscador rápido de constancias por código
  const [codigoVerificacion, setCodigoVerificacion] = useState<string>('');

  // ── EFECTO: CARGAR DATOS INSTITUCIONALES DESDE SUPABASE ──
  useEffect(() => {
    let cancelado = false;

    async function cargarDatosColegio() {
      setCargando(true);
      try {
        // Consultamos la tabla `perfil_escuela` para la sede seleccionada
        const { data, error } = await supabase
          .from('perfil_escuela')
          .select('*')
          .eq('id_escuela', escuelaCodigo)
          .maybeSingle();

        if (error) {
          console.warn('Aviso al consultar perfil de escuela:', error.message);
        }

        if (!cancelado) {
          if (data) {
            setPerfil(data as PerfilEscuelaData);
          } else {
            // Valores de respaldo si la base de datos aún no tiene registros
            setPerfil({
              id_escuela: escuelaCodigo,
              nombre_institucion: esSantaBarbara ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar',
              codigo_dea: esSantaBarbara ? 'OD05241620' : 'OD05241621',
              rif: esSantaBarbara ? 'J-30589123-0' : 'J-30589124-0',
              direccion: esSantaBarbara 
                ? 'Sector Santa Bárbara, Municipio Santa Bárbara, Monagas, Venezuela' 
                : 'Av. Bolívar cruce con Calle Comercio, Punta de Mata, Monagas, Venezuela',
              mision: 'Formar integralmente a niños, niñas y jóvenes mediante una educación humanista, científica y productiva, afianzando valores de identidad, disciplina y excelencia.',
              vision: 'Consolidarse como la institución educativa líder y vanguardista del oriente venezolano, destacada por la innovación tecnológica comunitaria y calidad docente.',
              objetivo: 'Garantizar una educación pública de máxima calidad, inclusiva y participativa en articulación con las familias y la comunidad.',
              peic: esSantaBarbara
                ? 'Innovación pedagógica, ciencia y valores para la transformación comunitaria de Santa Bárbara.'
                : 'Educación bolivariana, amor patrio y liderazgo productivo para el porvenir de Punta de Mata.',
              telefono: '(0292) 332-1145',
              email: esSantaBarbara ? 'contacto@uesantabarbara.edu.ve' : 'contacto@uelibertadorbolivar.edu.ve'
            });
          }
        }
      } catch (err) {
        console.error('Error de conexión:', err);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargarDatosColegio();

    return () => {
      cancelado = true;
    };
  }, [escuelaCodigo, esSantaBarbara]);

  // Función para cambiar de institución
  const handleCambiarEscuela = (nueva: 'sb' | 'lb') => {
    navigate(`/portal/${nueva}`);
  };

  // Función para redirigir a la verificación de constancia
  const handleVerificarConstancia = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigoVerificacion.trim()) {
      navigate(`/validar-constancia/${codigoVerificacion.trim()}`);
    }
  };

  // Logo y nombres oficiales según la sede
  const logoColegio = `/assets/img/logo_${escuelaCodigo}.png`;
  const nombreColegio = perfil?.nombre_institucion || (esSantaBarbara ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar');

  return (
    <div className={`portal-pub-container ${esSantaBarbara ? 'portal-tema-sb' : 'portal-tema-lb'}`}>
      
      {/* Luz ambiental sutil en el fondo */}
      <div className="portal-pub-ambient-glow"></div>

      {/* ── 1. BARRA SUPERIOR INSTITUCIONAL (SHELLBAR DE ALTA GAMA) ── */}
      <NavbarPublica 
        escuelaActiva={escuelaCodigo} 
        onCambiarEscuela={handleCambiarEscuela} 
      />

      {/* ── 2. SECCIÓN HERO DE BIENVENIDA Y PRESENTACIÓN ── */}
      <section id="inicio" className="portal-hero-section">
        <div className="container py-2 py-lg-4">
          <div className="row align-items-center g-4 g-lg-5">
            
            {/* Columna Izquierda: Información Principal y Accesos */}
            <div className="col-lg-7 text-center text-lg-start">
              
              {/* Badge de Estatus Oficial */}
              <div className="portal-badge-status mb-3">
                <i className="bi bi-patch-check-fill text-success"></i>
                <span>Año Escolar 2026-2027 &bull; Plantel Oficial MPPE</span>
              </div>

              {/* Título Oficial de la Institución */}
              <h1 className="portal-hero-title">
                {nombreColegio}
              </h1>

              {/* Datos Legales y Ubicación */}
              <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start gap-2 mb-3">
                <span className="badge bg-white text-dark border px-2.5 py-1.5 fw-semibold shadow-xs">
                  <i className="bi bi-file-earmark-check text-primary me-1"></i>
                  DEA: {perfil?.codigo_dea || 'OD05241620'}
                </span>
                <span className="badge bg-white text-dark border px-2.5 py-1.5 fw-semibold shadow-xs">
                  <i className="bi bi-building text-secondary me-1"></i>
                  RIF: {perfil?.rif || 'J-30589123-0'}
                </span>
                <span className="badge bg-white text-dark border px-2.5 py-1.5 fw-semibold shadow-xs">
                  <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                  Monagas, Venezuela
                </span>
              </div>

              {/* Lema Institucional (PEIC) */}
              <p className="portal-hero-peic mx-auto mx-lg-0 mb-4">
                &ldquo;{perfil?.peic || 'Educación integral y valores comunitarios para el futuro de nuestras familias.'}&rdquo;
              </p>

              {/* Botones de Acción Rápida (Mobile-First) */}
              <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start gap-3">
                <a href="#admisiones" className="btn btn-lg px-4 py-2.5 rounded-pill text-white fw-bold shadow-sm d-inline-flex align-items-center gap-2" style={{ background: 'var(--pub-gradient)' }}>
                  <i className="bi bi-pencil-square"></i>
                  <span>Solicitar Cupo Escolar</span>
                </a>
                <a href="#transporte" className="btn btn-lg btn-white border px-3.5 py-2.5 rounded-pill text-dark fw-semibold shadow-xs d-inline-flex align-items-center gap-2">
                  <i className="bi bi-bus-front text-primary"></i>
                  <span>Rutas de Transporte</span>
                </a>
                <Link to="/login" className="btn btn-lg btn-light border px-3 py-2.5 rounded-pill text-secondary fw-semibold shadow-xs d-inline-flex align-items-center gap-2">
                  <i className="bi bi-shield-lock-fill text-warning"></i>
                  <span>Acceso Campus</span>
                </Link>
              </div>

            </div>

            {/* Columna Derecha: Escudo Institucional 3D con Aura */}
            <div className="col-lg-5 text-center">
              <div className="portal-hero-shield-card">
                <img 
                  src={logoColegio} 
                  alt={`Escudo oficial ${nombreColegio}`} 
                  className="portal-hero-shield-img"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. SECCIÓN DE IDENTIDAD: MISIÓN, VISIÓN, VALORES Y PEIC (TARJETAS 3D) ── */}
      <section id="identidad" className="py-5 px-3">
        <div className="container">
          
          <div className="text-center max-w-xl mx-auto mb-5">
            <span className="badge bg-white text-dark border px-3 py-1.5 rounded-pill fw-bold text-uppercase small shadow-xs">
              <i className="bi bi-award-fill text-warning me-1"></i>
              Pilares Fundamentales
            </span>
            <h2 className="fw-bolder fs-2 text-dark mt-2 mb-2">Identidad Institucional</h2>
            <p className="text-muted small">Nuestros principios rectores para la formación de las futuras generaciones.</p>
          </div>

          <div className="row g-4">
            
            {/* Tarjeta 1: Misión Institucional */}
            <div className="col-md-6 col-lg-3">
              <div className="portal-card-3d">
                <img src="/assets/img/mision_3d.jpg" alt="Misión Institucional" className="portal-card-3d-header-img" />
                <div className="portal-card-3d-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="portal-icon-box">
                      <i className="bi bi-compass"></i>
                    </div>
                    <h3 className="fs-5 fw-bold text-dark m-0">Nuestra Misión</h3>
                  </div>
                  <p className="text-muted small mb-0" style={{ lineHeight: 1.6 }}>
                    {perfil?.mision}
                  </p>
                </div>
              </div>
            </div>

            {/* Tarjeta 2: Visión de Futuro */}
            <div className="col-md-6 col-lg-3">
              <div className="portal-card-3d">
                <img src="/assets/img/vision_3d.jpg" alt="Visión Institucional" className="portal-card-3d-header-img" />
                <div className="portal-card-3d-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="portal-icon-box">
                      <i className="bi bi-eye"></i>
                    </div>
                    <h3 className="fs-5 fw-bold text-dark m-0">Nuestra Visión</h3>
                  </div>
                  <p className="text-muted small mb-0" style={{ lineHeight: 1.6 }}>
                    {perfil?.vision}
                  </p>
                </div>
              </div>
            </div>

            {/* Tarjeta 3: Valores y Convivencia */}
            <div className="col-md-6 col-lg-3">
              <div className="portal-card-3d">
                <img src="/assets/img/valores_3d.jpg" alt="Valores Institucionales" className="portal-card-3d-header-img" />
                <div className="portal-card-3d-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="portal-icon-box">
                      <i className="bi bi-heart-pulse"></i>
                    </div>
                    <h3 className="fs-5 fw-bold text-dark m-0">Valores Clave</h3>
                  </div>
                  <p className="text-muted small mb-0" style={{ lineHeight: 1.6 }}>
                    Responsabilidad, honestidad, disciplina escolar, patriotismo, solidaridad y trabajo colaborativo para la comunidad.
                  </p>
                </div>
              </div>
            </div>

            {/* Tarjeta 4: Proyecto Educativo (PEIC) */}
            <div className="col-md-6 col-lg-3">
              <div className="portal-card-3d">
                <img src="/assets/img/peic_3d.png" alt="PEIC Institucional" className="portal-card-3d-header-img" />
                <div className="portal-card-3d-body">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div className="portal-icon-box">
                      <i className="bi bi-lightbulb"></i>
                    </div>
                    <h3 className="fs-5 fw-bold text-dark m-0">Proyecto PEIC</h3>
                  </div>
                  <p className="text-muted small mb-0" style={{ lineHeight: 1.6 }}>
                    {perfil?.peic}
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── 4. OFERTA ACADÉMICA / NIVELES EDUCATIVOS (GALERÍA OFICIAL) ── */}
      <section id="niveles" className="py-5 px-3 bg-white border-top border-bottom">
        <div className="container">
          
          <div className="text-center max-w-xl mx-auto mb-5">
            <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill fw-bold text-uppercase small shadow-xs">
              <i className="bi bi-mortarboard-fill text-primary me-1"></i>
              Niveles de Formación
            </span>
            <h2 className="fw-bolder fs-2 text-dark mt-2 mb-2">Oferta Académica</h2>
            <p className="text-muted small">Desde la educación inicial hasta la educación media general.</p>
          </div>

          <div className="row g-4 align-items-stretch">
            
            {/* Nivel 1: Educación Inicial */}
            <div className="col-md-4">
              <div className="portal-card-3d">
                <img src="/assets/img/nivel_inicial.jpg" alt="Educación Inicial" className="portal-card-3d-header-img" />
                <div className="portal-card-3d-body">
                  <span className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-50 small mb-2 w-auto align-self-start">
                    Maternal &bull; Preescolar
                  </span>
                  <h3 className="fs-5 fw-bold text-dark mb-2">Educación Inicial</h3>
                  <p className="text-muted small mb-3" style={{ lineHeight: 1.6 }}>
                    Desarrollo integral psicomotor, social y cognitivo en un entorno seguro, cálido y estimulante para los más pequeños.
                  </p>
                  <ul className="list-unstyled small text-secondary mt-auto">
                    <li className="mb-1"><i className="bi bi-check2 text-success me-1.5"></i> Estimulación temprana</li>
                    <li className="mb-1"><i className="bi bi-check2 text-success me-1.5"></i> Ambientes lúdicos seguros</li>
                    <li><i className="bi bi-check2 text-success me-1.5"></i> Turno matutino</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Nivel 2: Educación Primaria */}
            <div className="col-md-4">
              <div className="portal-card-3d">
                <img src="/assets/img/nivel_primaria.jpg" alt="Educación Primaria" className="portal-card-3d-header-img" />
                <div className="portal-card-3d-body">
                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-50 small mb-2 w-auto align-self-start">
                    1° a 6° Grado
                  </span>
                  <h3 className="fs-5 fw-bold text-dark mb-2">Educación Primaria</h3>
                  <p className="text-muted small mb-3" style={{ lineHeight: 1.6 }}>
                    Consolidación de competencias en lectura, cálculo, ciencia básica, formación en valores patrios e informática.
                  </p>
                  <ul className="list-unstyled small text-secondary mt-auto">
                    <li className="mb-1"><i className="bi bi-check2 text-success me-1.5"></i> Proyectos de aprendizaje</li>
                    <li className="mb-1"><i className="bi bi-check2 text-success me-1.5"></i> Actividades culturales y deportivas</li>
                    <li><i className="bi bi-check2 text-success me-1.5"></i> Laboratorio digital escolar</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Nivel 3: Educación Media General */}
            <div className="col-md-4">
              <div className="portal-card-3d">
                <img src="/assets/img/nivel_media.jpg" alt="Educación Media" className="portal-card-3d-header-img" />
                <div className="portal-card-3d-body">
                  <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-50 small mb-2 w-auto align-self-start">
                    1° a 5° Año &bull; Bachillerato
                  </span>
                  <h3 className="fs-5 fw-bold text-dark mb-2">Educación Media General</h3>
                  <p className="text-muted small mb-3" style={{ lineHeight: 1.6 }}>
                    Formación científica rigurosa, tecnológica y cívica preparando a los jóvenes bachilleres para la universidad.
                  </p>
                  <ul className="list-unstyled small text-secondary mt-auto">
                    <li className="mb-1"><i className="bi bi-check2 text-success me-1.5"></i> Ciencias exactas y naturales</li>
                    <li className="mb-1"><i className="bi bi-check2 text-success me-1.5"></i> Orientación vocacional</li>
                    <li><i className="bi bi-check2 text-success me-1.5"></i> Certificación oficial MPPE</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── 5. TRANSPORTE ESCOLAR Y RUTAS ACTIVAS ── */}
      <section id="transporte" className="py-5 px-3">
        <div className="container">
          
          <div className="row align-items-center g-4 mb-4">
            <div className="col-lg-8">
              <span className="badge bg-white text-dark border px-3 py-1.5 rounded-pill fw-bold text-uppercase small shadow-xs">
                <i className="bi bi-bus-front-fill text-info me-1"></i>
                Logística y Movilidad
              </span>
              <h2 className="fw-bolder fs-2 text-dark mt-2 mb-2">Sistema de Transporte Escolar</h2>
              <p className="text-muted small m-0">Rutas seguras y planificadas para el traslado de los estudiantes en las comunidades de la región.</p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <div className="d-inline-flex align-items-center gap-2 p-2 bg-white rounded-pill border shadow-xs">
                <img src="/assets/img/censo_3d.png" alt="Censo 3D" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                <div className="text-start pe-2">
                  <div className="fw-bold small text-dark">Monitoreo Oficial</div>
                  <div className="text-muted extra-small" style={{ fontSize: '0.72rem' }}>Padrón y Rutograma Activo</div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3">
            {esSantaBarbara ? (
              <>
                <div className="col-md-6 col-lg-3">
                  <div className="p-3 bg-white rounded-4 border shadow-xs h-100">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-success bg-opacity-10 text-success fw-bold">Ruta 1</span>
                      <span className="small text-muted">06:15 AM</span>
                    </div>
                    <div className="fw-bold text-dark small">Campo Rojo &bull; Centro</div>
                    <p className="text-muted extra-small mt-1 mb-2" style={{ fontSize: '0.75rem' }}>Garita Campo Rojo &rarr; Plaza Bolívar &rarr; Potrero</p>
                    <span className="badge bg-light text-muted border extra-small">Unidad 02 &bull; Interceptor</span>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3">
                  <div className="p-3 bg-white rounded-4 border shadow-xs h-100">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-success bg-opacity-10 text-success fw-bold">Ruta 5</span>
                      <span className="small text-muted">06:20 AM</span>
                    </div>
                    <div className="fw-bold text-dark small">La Esmeralda &bull; Menca</div>
                    <p className="text-muted extra-small mt-1 mb-2" style={{ fontSize: '0.75rem' }}>Cancha La Esmeralda &rarr; Menca &rarr; Av. Bolívar</p>
                    <span className="badge bg-light text-muted border extra-small">Unidad 04 &bull; Encava</span>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3">
                  <div className="p-3 bg-white rounded-4 border shadow-xs h-100">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-success bg-opacity-10 text-success fw-bold">Ruta 8</span>
                      <span className="small text-muted">06:20 AM</span>
                    </div>
                    <div className="fw-bold text-dark small">Casupal &bull; El Tejero</div>
                    <p className="text-muted extra-small mt-1 mb-2" style={{ fontSize: '0.75rem' }}>El Tanque &rarr; Tejero Viejo &rarr; Redoma Sucre</p>
                    <span className="badge bg-light text-muted border extra-small">Unidad 06 &bull; Yutong</span>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3">
                  <div className="p-3 bg-white rounded-4 border shadow-xs h-100">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-success bg-opacity-10 text-success fw-bold">Ruta 2</span>
                      <span className="small text-muted">06:25 AM</span>
                    </div>
                    <div className="fw-bold text-dark small">Osiris &bull; El Samán</div>
                    <p className="text-muted extra-small mt-1 mb-2" style={{ fontSize: '0.75rem' }}>El Samán &rarr; Garita Osiris &rarr; Sector Don Luis</p>
                    <span className="badge bg-light text-muted border extra-small">Unidad 03 &bull; Encava</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="col-md-6 col-lg-3">
                  <div className="p-3 bg-white rounded-4 border shadow-xs h-100">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-primary bg-opacity-10 text-primary fw-bold">Ruta 1</span>
                      <span className="small text-muted">06:20 AM</span>
                    </div>
                    <div className="fw-bold text-dark small">Puertas del Sur &bull; Valle</div>
                    <p className="text-muted extra-small mt-1 mb-2" style={{ fontSize: '0.75rem' }}>Entrada Garita &rarr; Valle de Luna &rarr; Bello Campo</p>
                    <span className="badge bg-light text-muted border extra-small">Unidad 01 &bull; Yutong</span>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3">
                  <div className="p-3 bg-white rounded-4 border shadow-xs h-100">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-primary bg-opacity-10 text-primary fw-bold">Ruta 2</span>
                      <span className="small text-muted">06:15 AM</span>
                    </div>
                    <div className="fw-bold text-dark small">Las Flores &bull; Centro CVP</div>
                    <p className="text-muted extra-small mt-1 mb-2" style={{ fontSize: '0.75rem' }}>Las Flores &rarr; Edif. CVP &rarr; Terranostra</p>
                    <span className="badge bg-light text-muted border extra-small">Unidad 05 &bull; Encava</span>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3">
                  <div className="p-3 bg-white rounded-4 border shadow-xs h-100">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-primary bg-opacity-10 text-primary fw-bold">Ruta 4</span>
                      <span className="small text-muted">06:20 AM</span>
                    </div>
                    <div className="fw-bold text-dark small">Las Vírgenes &bull; Arboleda</div>
                    <p className="text-muted extra-small mt-1 mb-2" style={{ fontSize: '0.75rem' }}>Plaza Central &rarr; La Arboleda &rarr; Las Casitas</p>
                    <span className="badge bg-light text-muted border extra-small">Unidad 07 &bull; Yutong</span>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3">
                  <div className="p-3 bg-white rounded-4 border shadow-xs h-100">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-primary bg-opacity-10 text-primary fw-bold">Ruta 19</span>
                      <span className="small text-muted">06:25 AM</span>
                    </div>
                    <div className="fw-bold text-dark small">Campo Miraflores &bull; CC</div>
                    <p className="text-muted extra-small mt-1 mb-2" style={{ fontSize: '0.75rem' }}>Garita Miraflores &rarr; Tecnológico &rarr; CC Mañoca</p>
                    <span className="badge bg-light text-muted border extra-small">Unidad 09 &bull; Shuttle</span>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </section>

      {/* ── 6. PROCESO DE ADMISIONES Y NUEVOS INGRESOS (BANNER DESTACADO) ── */}
      <section id="admisiones" className="py-5 px-3">
        <div className="container">
          <div className="portal-admissions-banner">
            <div className="row align-items-center g-4">
              
              <div className="col-lg-8">
                <span className="badge bg-white bg-opacity-20 text-white border border-white border-opacity-25 px-3 py-1 rounded-pill small fw-bold mb-3 d-inline-block">
                  <i className="bi bi-clock-history me-1.5"></i>
                  Proceso de Inscripción y Cupos 2026-2027
                </span>
                <h2 className="display-6 fw-bold text-white mb-3">
                  ¡Asegura el Futuro Escolar de tu Representado!
                </h2>
                <p className="text-light opacity-90 mb-4" style={{ maxWidth: '650px', lineHeight: 1.6 }}>
                  El proceso de admisión es 100% digital, transparente y simplificado. Como padre o representante puedes registrar la solicitud desde tu teléfono móvil.
                </p>

                {/* Pasos Visuales del Proceso */}
                <div className="row g-3 mb-4">
                  <div className="col-sm-4">
                    <div className="portal-step-pill">
                      <div className="fw-bold text-white small">1. Solicitud en Línea</div>
                      <div className="text-light opacity-75 extra-small">Llenar datos del estudiante</div>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="portal-step-pill">
                      <div className="fw-bold text-white small">2. Carga de Recaudos</div>
                      <div className="text-light opacity-75 extra-small">Partida y fotos sin costo</div>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="portal-step-pill">
                      <div className="fw-bold text-white small">3. Formalización</div>
                      <div className="text-light opacity-75 extra-small">Asignación oficial de matrícula</div>
                    </div>
                  </div>
                </div>

                {/* Botón hacia el Sistema Privado / Login de Admisión */}
                <Link to="/login" className="btn btn-light btn-lg rounded-pill px-4 py-2.5 fw-bold text-dark shadow-sm d-inline-flex align-items-center gap-2">
                  <i className="bi bi-send-fill text-primary"></i>
                  <span>Iniciar Solicitud de Cupo Ahora</span>
                </Link>

              </div>

              {/* Imagen 3D de Formalización y Admisión */}
              <div className="col-lg-4 text-center">
                <img 
                  src="/assets/img/formalizacion_3d.png" 
                  alt="Formalización de Matrícula" 
                  style={{ maxHeight: '230px', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.3))' }}
                />
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── 7. VERIFICACIÓN DE CONSTANCIAS (CIBERSEGURIDAD QR) ── */}
      <section className="py-5 px-3 bg-white border-top border-bottom">
        <div className="container">
          <div className="row align-items-center g-4">
            
            <div className="col-lg-4 text-center">
              <img 
                src="/assets/img/seguridad_3d.png" 
                alt="Seguridad y Criptografía SIGAE" 
                style={{ width: '160px', height: '160px', objectFit: 'contain' }}
              />
            </div>

            <div className="col-lg-8">
              <span className="badge bg-light text-dark border px-3 py-1 rounded-pill small fw-bold mb-2 d-inline-block">
                <i className="bi bi-shield-check text-success me-1"></i>
                Validador Público de Autenticidad
              </span>
              <h3 className="fs-3 fw-bold text-dark mb-2">Verificación de Constancias y Documentos</h3>
              <p className="text-muted small mb-4" style={{ maxWidth: '640px' }}>
                Cualquier constancia de estudio, retiro, carnet o carta de aceptación emitida por SIGAE posee un código hash criptográfico y un código QR único para validar su autenticidad oficial.
              </p>

              {/* Formulario de Verificación por Código */}
              <form onSubmit={handleVerificarConstancia} className="d-flex flex-column flex-sm-row gap-2 max-w-lg">
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-qr-code-scan text-muted"></i>
                  </span>
                  <input 
                    type="text" 
                    className="form-control border-start-0" 
                    placeholder="Ingresa el código hash (ej: CE-2026-XYZ123)"
                    value={codigoVerificacion}
                    onChange={(e) => setCodigoVerificacion(e.target.value)}
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

      {/* ── 8. SECCIÓN DE CONTACTO Y UBICACIÓN GEOGRÁFICA ── */}
      <section id="contacto" className="py-5 px-3">
        <div className="container">
          <div className="row g-4">
            
            {/* Información de Contacto */}
            <div className="col-lg-5">
              <span className="badge bg-white text-dark border px-3 py-1.5 rounded-pill fw-bold text-uppercase small shadow-xs">
                <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                Comunícate con Nosotros
              </span>
              <h2 className="fw-bolder fs-2 text-dark mt-2 mb-3">Atención a la Comunidad</h2>
              <p className="text-muted small mb-4">
                Estamos al servicio de las familias. Puedes visitarnos en nuestra sede o escribirnos a través de los canales institucionales.
              </p>

              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-start gap-3 p-3 bg-white rounded-4 border shadow-xs">
                  <div className="portal-icon-box">
                    <i className="bi bi-geo-alt-fill"></i>
                  </div>
                  <div>
                    <div className="fw-bold small text-dark">Dirección de la Sede</div>
                    <div className="text-muted extra-small" style={{ fontSize: '0.8rem' }}>{perfil?.direccion}</div>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3 p-3 bg-white rounded-4 border shadow-xs">
                  <div className="portal-icon-box">
                    <i className="bi bi-telephone-fill"></i>
                  </div>
                  <div>
                    <div className="fw-bold small text-dark">Teléfono Institucional</div>
                    <div className="text-muted extra-small" style={{ fontSize: '0.8rem' }}>{perfil?.telefono || '(0292) 332-1145'}</div>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3 p-3 bg-white rounded-4 border shadow-xs">
                  <div className="portal-icon-box">
                    <i className="bi bi-envelope-fill"></i>
                  </div>
                  <div>
                    <div className="fw-bold small text-dark">Correo Electrónico Oficial</div>
                    <div className="text-muted extra-small" style={{ fontSize: '0.8rem' }}>{perfil?.email || 'contacto@escuela.edu.ve'}</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Cuadro de Horarios y Atención Docente */}
            <div className="col-lg-7">
              <div className="p-4 p-md-5 bg-white rounded-4 border shadow-xs h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-calendar-week fs-3 text-primary"></i>
                    <h3 className="fs-4 fw-bold text-dark m-0">Horarios de Atención</h3>
                  </div>
                  <p className="text-muted small mb-4">
                    Jornadas administrativas y atención al representante en la dirección del plantel:
                  </p>

                  <div className="table-responsive">
                    <table className="table table-sm table-borderless small">
                      <tbody>
                        <tr className="border-bottom">
                          <td className="fw-bold py-2 text-dark">Lunes a Viernes (Turno Mañana)</td>
                          <td className="text-end text-muted py-2">07:00 AM &ndash; 12:00 PM</td>
                        </tr>
                        <tr className="border-bottom">
                          <td className="fw-bold py-2 text-dark">Lunes a Jueves (Turno Tarde)</td>
                          <td className="text-end text-muted py-2">01:00 PM &ndash; 05:00 PM</td>
                        </tr>
                        <tr>
                          <td className="fw-bold py-2 text-dark">Atención a Representantes (Docentes)</td>
                          <td className="text-end text-muted py-2">Previa cita programada</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="p-3 rounded-3 bg-light border mt-4">
                  <div className="small fw-bold text-dark mb-1">
                    <i className="bi bi-info-circle-fill text-info me-1.5"></i>
                    Constancias y Trámites Digitales
                  </div>
                  <div className="extra-small text-muted" style={{ fontSize: '0.78rem' }}>
                    Si eres representante registrado en SIGAE, puedes solicitar y descargar tus constancias de estudio en línea las 24 horas del día ingresando al campus con tu cédula.
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 9. DOCK FLOTANTE INFERIOR PARA TELÉFONOS MÓVILES (MOBILE-FIRST) ── */}
      <nav className="portal-mobile-dock" aria-label="Navegación Móvil Rápida">
        <a href="#inicio" className="portal-mobile-dock-btn activo">
          <i className="bi bi-house-door"></i>
          <span>Inicio</span>
        </a>
        <a href="#identidad" className="portal-mobile-dock-btn">
          <i className="bi bi-award"></i>
          <span>Identidad</span>
        </a>
        <a href="#niveles" className="portal-mobile-dock-btn">
          <i className="bi bi-mortarboard"></i>
          <span>Niveles</span>
        </a>
        <a href="#transporte" className="portal-mobile-dock-btn">
          <i className="bi bi-bus-front"></i>
          <span>Rutas</span>
        </a>
        <Link to="/login" className="portal-mobile-dock-btn destacado">
          <i className="bi bi-shield-lock-fill"></i>
          <span>Ingresar</span>
        </Link>
      </nav>

      {/* ── 10. PIE DE PÁGINA (FOOTER CORPORATIVO OFICIAL) ── */}
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
                Sistema Integral de Gestión y Administración Escolar. Solución tecnológica oficial multi-escuela para el control pedagógico y comunitario.
              </p>
            </div>

            <div className="col-md-6 text-center text-md-end">
              <p className="extra-small text-muted mb-1" style={{ fontSize: '0.78rem' }}>
                &copy; 2026 {nombreColegio}. Todos los derechos reservados.
              </p>
              <p className="extra-small text-muted m-0" style={{ fontSize: '0.74rem' }}>
                Ministerio del Poder Popular para la Educación &bull; República Bolivariana de Venezuela
              </p>
            </div>

          </div>
        </div>
      </footer>

    </div>
  );
};
