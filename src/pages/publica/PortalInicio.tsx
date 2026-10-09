/**
 * ==============================================================================
 * ARCHIVO: src/pages/publica/PortalInicio.tsx
 * PROPÓSITO: Página principal de presentación pública e institucional por colegio.
 * DESCRIPCIÓN:
 *  - Carga los datos oficiales del colegio desde la tabla `perfil_escuela` en Supabase.
 *  - Ofrece una experiencia visualmente moderna, rápida y totalmente adaptada a celulares.
 *  - Incluye accesos directos para que los representantes inicien trámites o verifiquen documentos.
 * ==============================================================================
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { NavbarPublica } from '../../components/layout/NavbarPublica';

// Interfaz para tipar los datos institucionales provenientes de Supabase
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
}

export const PortalInicio: React.FC = () => {
  // Obtenemos el parámetro de la URL (ej: /portal/sb o /portal/lb)
  const { schoolId } = useParams<{ schoolId?: string }>();
  const navigate = useNavigate();

  // Validamos si la escuela en la URL es válida ('sb' o 'lb'); de lo contrario, usamos 'sb'
  const escuelaCodigo: 'sb' | 'lb' = (schoolId === 'lb' ? 'lb' : 'sb');

  // Estado para guardar los datos cargados desde la base de datos Supabase
  const [perfil, setPerfil] = useState<PerfilEscuelaData | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  // Paleta de colores institucional según la escuela
  const esSantaBarbara = escuelaCodigo === 'sb';
  const colorPrimario = esSantaBarbara ? '#10b981' : '#2563eb'; // Verde Esmeralda vs Azul Real
  const colorFondoSuave = esSantaBarbara ? 'rgba(16, 185, 129, 0.08)' : 'rgba(37, 99, 235, 0.08)';

  // EFECTO: Carga los datos de la institución desde Supabase cada vez que cambia la escuela
  useEffect(() => {
    let cancelado = false;

    async function cargarPerfilInstitucional() {
      setCargando(true);
      try {
        // Consultamos la tabla perfil_escuela filtrando por id_escuela ('sb' o 'lb')
        const { data, error } = await supabase
          .from('perfil_escuela')
          .select('*')
          .eq('id_escuela', escuelaCodigo)
          .maybeSingle();

        if (error) {
          console.warn('Aviso al cargar perfil de escuela pública:', error.message);
        }

        if (!cancelado) {
          if (data) {
            setPerfil(data as PerfilEscuelaData);
          } else {
            // Si la base de datos no tiene datos aún, usamos valores de respaldo predeterminados
            setPerfil({
              id_escuela: escuelaCodigo,
              nombre_institucion: esSantaBarbara ? 'Unidad Educativa Santa Bárbara' : 'Unidad Educativa Libertador Bolívar',
              codigo_dea: esSantaBarbara ? 'OD05241620' : 'OD05241621',
              rif: esSantaBarbara ? 'J-30589123-0' : 'J-30589124-0',
              direccion: esSantaBarbara ? 'Sector Santa Bárbara, Monagas, Venezuela' : 'Av. Bolívar, Punta de Mata, Monagas, Venezuela',
              mision: 'Formar integralmente a niños, niñas y jóvenes mediante una educación liberadora, científica y humanista.',
              vision: 'Ser una institución modelo de excelencia pedagógica y tecnológica comunitaria en el oriente venezolano.',
              objetivo: 'Garantizar el pleno desarrollo de las capacidades de los estudiantes en un ambiente seguro y participativo.',
              peic: 'Educando con amor, ciencia e innovación tecnológica para el desarrollo de la patria.'
            });
          }
        }
      } catch (err) {
        console.error('Error de red al cargar escuela pública:', err);
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargarPerfilInstitucional();

    return () => {
      cancelado = true;
    };
  }, [escuelaCodigo, esSantaBarbara]);

  // Función para alternar de colegio
  const handleCambiarEscuela = (nueva: 'sb' | 'lb') => {
    navigate(`/portal/${nueva}`);
  };

  return (
    <div className="min-vh-100 bg-light d-flex flex-column text-dark">
      {/* ── BARRA SUPERIOR PÚBLICA ── */}
      <NavbarPublica 
        escuelaActiva={escuelaCodigo} 
        onCambiarEscuela={handleCambiarEscuela} 
      />

      {/* ── SECCIÓN 1: HERO BANNER INSTITUCIONAL ── */}
      <section 
        id="inicio"
        className="py-5 px-3 position-relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colorFondoSuave} 0%, #ffffff 100%)`,
          borderBottom: '1px solid rgba(0,0,0,0.06)'
        }}
      >
        <div className="container py-3">
          <div className="row align-items-center g-4">
            
            {/* Texto y Título Principal */}
            <div className="col-lg-7 text-center text-lg-start">
              
              {/* Insignia / Badge de Bienvenida */}
              <div 
                className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3 shadow-xs border"
                style={{ backgroundColor: '#ffffff', color: colorPrimario, fontSize: '0.8rem', fontWeight: 700 }}
              >
                <i className="bi bi-patch-check-fill"></i>
                <span>Año Escolar 2026-2027 &bull; Matrícula Abierta</span>
              </div>

              {/* Nombre de la Institución */}
              <h1 className="fw-bolder display-5 mb-2 text-dark" style={{ letterSpacing: '-0.5px' }}>
                {perfil?.nombre_institucion || (esSantaBarbara ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar')}
              </h1>

              {/* Subtítulo / Códigos Ministeriales */}
              <p className="text-muted fs-6 mb-3">
                <span className="fw-semibold text-dark">DEA: {perfil?.codigo_dea || 'Registrado MPPE'}</span> &bull; 
                <span className="ms-1">RIF: {perfil?.rif || 'G-20000000'}</span>
              </p>

              {/* Lema Educativo (PEIC) */}
              <p className="lead text-secondary mb-4 fs-6 pe-lg-4" style={{ lineHeight: 1.6 }}>
                &ldquo;{perfil?.peic || 'Educación integral y valores para el futuro de nuestras familias.'}&rdquo;
              </p>

              {/* Botones de Acción Inmediata (Mobile-First) */}
              <div className="d-flex flex-wrap justify-content-center justify-content-lg-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="btn btn-primary px-4 py-2.5 rounded-pill shadow-sm fw-bold d-flex align-items-center gap-2"
                  style={{ backgroundColor: colorPrimario, borderColor: colorPrimario }}
                >
                  <i className="bi bi-door-open-fill"></i>
                  <span>Ingresar al Campus Digital</span>
                </button>

                <a
                  href="#admisiones"
                  className="btn btn-outline-secondary px-4 py-2.5 rounded-pill fw-bold d-flex align-items-center gap-2 bg-white"
                >
                  <i className="bi bi-clipboard2-plus"></i>
                  <span>Solicitar Cupo</span>
                </a>
              </div>
            </div>

            {/* Escudo Gigante / Ilustración Institucional */}
            <div className="col-lg-5 text-center">
              <div className="position-relative d-inline-block p-3">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center mx-auto shadow-lg bg-white p-4 border"
                  style={{ width: '230px', height: '230px', maxWidth: '85vw', maxHeight: '85vw' }}
                >
                  <img 
                    src={`/assets/img/logo_${escuelaCodigo}.png`} 
                    alt="Escudo Oficial" 
                    className="img-fluid"
                    style={{ maxHeight: '180px', objectFit: 'contain' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECCIÓN 2: TARJETAS DE SERVICIOS RÁPIDOS PARA FAMILIAS ── */}
      <section className="py-4 px-3 bg-white border-bottom">
        <div className="container">
          <div className="row g-3">
            
            {/* Tarjeta 1: Solicitud de Cupos */}
            <div className="col-12 col-md-4">
              <div 
                className="p-3.5 rounded-4 border bg-light h-100 d-flex flex-column justify-content-between hover-shadow transition-all"
                style={{ borderLeft: `4px solid ${colorPrimario}` }}
              >
                <div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="p-2 rounded-3 bg-white text-primary shadow-xs">
                      <i className="bi bi-person-plus-fill fs-5" style={{ color: colorPrimario }}></i>
                    </span>
                    <h5 className="fw-bold mb-0 fs-6">Admisiones & Nuevos Ingresos</h5>
                  </div>
                  <p className="small text-muted mb-3">
                    Registra la postulación de tu representado para el período escolar 2026-2027 de forma 100% digital.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="btn btn-sm btn-outline-dark rounded-pill fw-semibold w-100"
                >
                  Iniciar Solicitud &rarr;
                </button>
              </div>
            </div>

            {/* Tarjeta 2: Transporte Escolar */}
            <div className="col-12 col-md-4">
              <div 
                className="p-3.5 rounded-4 border bg-light h-100 d-flex flex-column justify-content-between hover-shadow transition-all"
                style={{ borderLeft: `4px solid #f59e0b` }}
              >
                <div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="p-2 rounded-3 bg-white text-warning shadow-xs">
                      <i className="bi bi-bus-front-fill fs-5 text-warning"></i>
                    </span>
                    <h5 className="fw-bold mb-0 fs-6">Rutas de Transporte</h5>
                  </div>
                  <p className="small text-muted mb-3">
                    Consulta las unidades activas, paradas autorizadas y horarios de los recorridos escolares.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="btn btn-sm btn-outline-dark rounded-pill fw-semibold w-100"
                >
                  Ver Horarios &rarr;
                </button>
              </div>
            </div>

            {/* Tarjeta 3: Validación de Constancias */}
            <div className="col-12 col-md-4">
              <div 
                className="p-3.5 rounded-4 border bg-light h-100 d-flex flex-column justify-content-between hover-shadow transition-all"
                style={{ borderLeft: `4px solid #0062ff` }}
              >
                <div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span className="p-2 rounded-3 bg-white text-primary shadow-xs">
                      <i className="bi bi-shield-check fs-5 text-primary"></i>
                    </span>
                    <h5 className="fw-bold mb-0 fs-6">Verificación de Documentos</h5>
                  </div>
                  <p className="small text-muted mb-3">
                    Comprueba la autenticidad de constancias de estudio y notas certificadas con código QR y serial único.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/validar-constancia/buscar')}
                  className="btn btn-sm btn-outline-dark rounded-pill fw-semibold w-100"
                >
                  Validar Código &rarr;
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECCIÓN 3: IDENTIDAD INSTITUCIONAL (MISIÓN Y VISIÓN) ── */}
      <section id="identidad" className="py-5 px-3">
        <div className="container">
          <div className="text-center mb-4">
            <span className="badge bg-secondary-subtle text-secondary px-3 py-1 rounded-pill extra-small fw-bold text-uppercase">
              Filosofía Pedagógica
            </span>
            <h2 className="fw-bolder fs-3 mt-2 text-dark">Nuestros Principios y Compromiso</h2>
          </div>

          <div className="row g-4">
            {/* Misión */}
            <div className="col-md-6">
              <div className="card h-100 border-0 shadow-sm rounded-4 p-4 bg-white">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="rounded-3 p-2.5 text-white shadow-xs" style={{ backgroundColor: colorPrimario }}>
                    <i className="bi bi-compass-fill fs-5"></i>
                  </div>
                  <h4 className="fw-bold mb-0 fs-5">Nuestra Misión</h4>
                </div>
                <p className="text-muted small" style={{ lineHeight: 1.7 }}>
                  {perfil?.mision || 'Brindar educación de calidad sustentada en valores éticos, morales y comunitarios, desarrollando las potencialidades cognitivas y creativas de los estudiantes.'}
                </p>
              </div>
            </div>

            {/* Visión */}
            <div className="col-md-6">
              <div className="card h-100 border-0 shadow-sm rounded-4 p-4 bg-white">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="rounded-3 p-2.5 text-white shadow-xs bg-dark">
                    <i className="bi bi-eye-fill fs-5"></i>
                  </div>
                  <h4 className="fw-bold mb-0 fs-5">Nuestra Visión</h4>
                </div>
                <p className="text-muted small" style={{ lineHeight: 1.7 }}>
                  {perfil?.vision || 'Consolidarnos como un referente educativo nacional por nuestra innovación pedagógica, disciplina y compromiso con la formación integral de los ciudadanos del mañana.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 4: PROCESO DE ADMISIONES 2026-2027 ── */}
      <section id="admisiones" className="py-5 px-3 bg-white border-top border-bottom">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <span className="badge bg-success-subtle text-success px-3 py-1 rounded-pill extra-small fw-bold text-uppercase mb-2">
                Convocatoria Activa
              </span>
              <h2 className="fw-bolder fs-3 text-dark mb-3">¿Deseas Inscribir a tu Representado?</h2>
              <p className="text-muted small mb-4" style={{ lineHeight: 1.6 }}>
                El proceso de solicitud de cupos para Educación Inicial, Primaria y Media General se gestiona de forma transparente y sin intermediarios a través de nuestro campus digital.
              </p>

              <div className="d-flex flex-column gap-2 mb-4">
                <div className="d-flex align-items-start gap-2">
                  <i className="bi bi-check2-circle text-success fs-5"></i>
                  <span className="small text-dark"><strong>Paso 1:</strong> Ingresa al sistema o solicita el registro como nuevo representante.</span>
                </div>
                <div className="d-flex align-items-start gap-2">
                  <i className="bi bi-check2-circle text-success fs-5"></i>
                  <span className="small text-dark"><strong>Paso 2:</strong> Completa los datos médicos, residenciales y académicos del alumno.</span>
                </div>
                <div className="d-flex align-items-start gap-2">
                  <i className="bi bi-check2-circle text-success fs-5"></i>
                  <span className="small text-dark"><strong>Paso 3:</strong> Adjunta la partida de nacimiento y cédula digitalmente.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="btn btn-primary px-4 py-2.5 rounded-pill shadow-xs fw-bold"
                style={{ backgroundColor: colorPrimario, borderColor: colorPrimario }}
              >
                Comenzar Registro Digital &rarr;
              </button>
            </div>

            <div className="col-lg-6 text-center">
              <div className="p-4 bg-light rounded-4 border text-start">
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <i className="bi bi-file-earmark-text text-primary"></i>
                  <span>Requisitos Básicos Obligatorios</span>
                </h5>
                <ul className="list-unstyled d-flex flex-column gap-2 mb-0 small text-muted">
                  <li>&bull; Fotocopia de la Cédula de Identidad del Representante legal.</li>
                  <li>&bull; Partida de Nacimiento legible del estudiante.</li>
                  <li>&bull; Informe o certificación médica actualizada.</li>
                  <li>&bull; Boleta de calificaciones o constancia de promoción del año anterior.</li>
                  <li>&bull; Comprobante de residencia reciente.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PIE DE PÁGINA (FOOTER) INSTITUCIONAL ── */}
      <footer id="contacto" className="py-4 px-3 bg-dark text-white-50 mt-auto">
        <div className="container">
          <div className="row g-4 mb-3">
            <div className="col-md-6">
              <h5 className="text-white fw-bold mb-2">
                {perfil?.nombre_institucion || 'Institución Educativa'}
              </h5>
              <p className="small mb-1 text-white-50">
                <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                {perfil?.direccion || 'Monagas, Venezuela'}
              </p>
              <p className="small mb-0 text-white-50">
                <i className="bi bi-envelope-fill text-primary me-1"></i>
                soporte@sigae.com
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="small text-white-50 mb-1">
                Sistema Integral de Gestión y Administración Escolar (SIGAE v1.1)
              </p>
              <p className="extra-small text-secondary mb-0">
                Plataforma tecnológica multi-escuela con costo cero &bull; 2026-2027
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
