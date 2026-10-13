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

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSchool } from '../../context/SchoolContext';
import { SelectorEscuelaModal } from '../../components/escuelas/SelectorEscuelaModal';
import { gestionDiariaService, type ReporteGestionDiaria } from '../../services/gestionDiariaService';
import { ModalDetalleReporteGestion } from '../../components/ModalDetalleReporteGestion';
import { supabase } from '../../lib/supabase';
import '../../portal_publico.css';

// ── INTERFACES Y HOOKS DE LA MATRÍCULA ESCOLAR INTEGRAL DEL PORTAL ──
interface CifrasMatriculaNivel {
  inicial: number;
  primaria: number;
  media: number;
  docentes: number;
  total: number;
}

const CIFRAS_OFICIALES_CENSO: Record<string, CifrasMatriculaNivel> = {
  sb: { inicial: 26, primaria: 260, media: 349, docentes: 49, total: 635 },
  lb: { inicial: 10, primaria: 328, media: 360, docentes: 60, total: 698 }
};

// Hook de contador animado suave a 60fps con curva ease-out natural
function useCountUpPortal(endValue: number, duration: number = 1000): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = 0;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (endValue - startValue) * easeProgress);
      setCount(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(endValue);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [endValue, duration]);

  return count;
}

// Componente de texto interactivo con ola líquida letra por letra (efecto auténtico BDT btn-hover-txt-liquid-y)
const LiquidWaveText: React.FC<{ text: string }> = ({ text }) => {
  return (
    <span className="bdt-liquid-wave-wrap">
      {text.split('').map((char, index) => (
        <span 
          key={index} 
          className="bdt-liquid-char-box"
        >
          <span 
            className="bdt-liquid-char-up" 
            style={{ transitionDelay: `${index * 0.025}s` }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
          <span 
            className="bdt-liquid-char-down" 
            aria-hidden="true" 
            style={{ transitionDelay: `${index * 0.025}s` }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        </span>
      ))}
    </span>
  );
};

// Tarjeta de Nivel Educativo adaptada 100% a la identidad tipográfica y estética del portal
interface TarjetaNivelMatriculaProps {
  id: string;
  avatarSrc: string;
  titulo: string;
  subtitulo: string;
  badgeNivel: string;
  iconoBadge: string;
  valorFinal: number;
  totalEstudiantes: number;
  colorTema: string;
  gradienteTema: string;
  sombraTema: string;
  desglose: { label: string; count: number | string }[];
  esPersonal?: boolean;
}

const TarjetaNivelMatricula: React.FC<TarjetaNivelMatriculaProps> = ({
  id,
  avatarSrc,
  titulo,
  subtitulo,
  badgeNivel,
  iconoBadge,
  valorFinal,
  totalEstudiantes,
  colorTema,
  gradienteTema,
  sombraTema,
  desglose,
  esPersonal = false,
}) => {
  const count = useCountUpPortal(valorFinal, 1100);
  const porcentaje = totalEstudiantes > 0 
    ? Math.round((valorFinal / totalEstudiantes) * 100) 
    : 0;

  return (
    <div className="col-12 col-md-6 col-xl-3 d-flex align-items-stretch">
      <div 
        id={id}
        className="w-100 bdt-matricula-card"
        style={{
          '--card-accent': colorTema,
          '--card-accent-grad': gradienteTema,
          '--card-shadow': sombraTema,
        } as React.CSSProperties}
      >
        <div>
          {/* Cabecera: Avatar 3D con anillo de respiración + Badges */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="bdt-matricula-avatar-wrap">
              <div className="bdt-matricula-avatar-ring">
                <img 
                  src={avatarSrc} 
                  alt={titulo} 
                  className="bdt-matricula-avatar-img"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                />
              </div>
              <span 
                className="position-absolute bottom-0 end-0 rounded-circle border border-white"
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: colorTema,
                  boxShadow: `0 2px 6px ${colorTema}80`
                }}
                title="Nivel Activo"
              />
            </div>

            <div className="text-end d-flex flex-column align-items-end gap-1">
              <span 
                className="badge rounded-pill fw-bold font-ruda px-2.5 py-1"
                style={{
                  fontSize: '0.68rem',
                  backgroundColor: `${colorTema}14`,
                  color: colorTema,
                  border: `1.2px solid ${colorTema}35`,
                  letterSpacing: '0.2px'
                }}
              >
                <i className={`bi ${iconoBadge} me-1`}></i>
                {badgeNivel}
              </span>
              <span 
                className="badge rounded-pill fw-bold text-white font-ruda px-2.5 py-0.5"
                style={{
                  fontSize: '0.64rem',
                  background: gradienteTema,
                  letterSpacing: '0.2px'
                }}
              >
                {esPersonal ? '100% activa' : `${porcentaje}% matrícula`}
              </span>
            </div>
          </div>

          {/* Títulos adaptados a Tipografía Ruda del Portal */}
          <h4 className="font-ruda fw-black text-dark m-0 mb-0.5 fs-5">
            {titulo}
          </h4>
          <p className="text-muted extra-small m-0 font-body" style={{ fontSize: '0.78rem' }}>
            {subtitulo}
          </p>
        </div>

        {/* Métrica Central con Tipografía Ruda y Barra Proporcional */}
        <div className="my-3">
          <div className="d-flex align-items-baseline gap-2 mb-2">
            <span 
              className="font-ruda fw-black" 
              style={{ 
                fontSize: '2.1rem', 
                color: colorTema, 
                lineHeight: 1,
                letterSpacing: '-0.8px' 
              }}
            >
              {count.toLocaleString('es-VE')}
            </span>
            <span 
              className="font-ruda fw-bold text-uppercase small"
              style={{ color: '#64748b', fontSize: '0.76rem', letterSpacing: '0.4px' }}
            >
              {esPersonal ? 'PERSONAL ADSCRITO' : 'ESTUDIANTES'}
            </span>
          </div>

          <div className="bdt-matricula-progress-bg">
            <div 
              className="bdt-matricula-progress-bar"
              style={{ width: `${esPersonal ? 100 : Math.min(porcentaje, 100)}%` }}
            />
          </div>
        </div>

        {/* Desglose Inferior con Píldoras Estilizadas */}
        <div className="d-flex flex-wrap gap-1.5 pt-2 border-top border-light">
          {desglose.map((item, idx) => (
            <span key={idx} className="bdt-matricula-pill-item">
              <span>{item.label}:</span>
              <strong>{item.count}</strong>
            </span>
          ))}
        </div>

      </div>
    </div>
  );
};

export const PortalGeneralSIGAE: React.FC = () => {
  // Hook de navegación de React Router para redirigir entre páginas
  const navigate = useNavigate();

  // Contexto multi-escuela global (provee lista de escuelas y control del modal selector)
  const { escuelas, escuelaActiva, setSelectorModalAbierto, cambiarEscuela } = useSchool();

  // Estado local para seleccionar la institución cuyas estadísticas de matrícula se desean visualizar ('sb' | 'lb')
  const [escuelaStatsActiva, setEscuelaStatsActiva] = useState<'sb' | 'lb'>(
    (escuelaActiva as 'sb' | 'lb') || 'sb'
  );

  // Sincronizar si cambia la escuela activa del contexto multi-escuela
  useEffect(() => {
    if (escuelaActiva === 'sb' || escuelaActiva === 'lb') {
      setEscuelaStatsActiva(escuelaActiva);
    }
  }, [escuelaActiva]);

  // Cifras oficiales sincronizadas en tiempo real para la escuela activa seleccionada
  const [cifrasMatricula, setCifrasMatricula] = useState<CifrasMatriculaNivel>(
    CIFRAS_OFICIALES_CENSO[escuelaStatsActiva] || CIFRAS_OFICIALES_CENSO.sb
  );

  // Sincronización en tiempo real desde Supabase para la escuela activa
  useEffect(() => {
    let isMounted = true;
    async function cargarEstadisticas() {
      try {
        const { data: v1 } = await supabase
          .from('estudiantes_vinculaciones')
          .select('codigo_escuela, grado_actual')
          .eq('codigo_escuela', escuelaStatsActiva)
          .range(0, 999);

        if (v1 && v1.length > 0 && isMounted) {
          let ini = 0;
          let prim = 0;
          let med = 0;

          v1.forEach((v: any) => {
            const g = (v.grado_actual || '').toLowerCase();
            if (g.includes('maternal') || g.includes('grupo') || g.includes('preescolar')) {
              ini++;
            } else if (g.includes('grado')) {
              prim++;
            } else if (g.includes('año') || g.includes('ano')) {
              med++;
            }
          });

          const esSB = escuelaStatsActiva === 'sb';
          setCifrasMatricula({
            inicial: ini || (esSB ? 26 : 10),
            primaria: prim || (esSB ? 260 : 328),
            media: med || (esSB ? 349 : 360),
            docentes: esSB ? 49 : 60,
            total: v1.length
          });
        } else if (isMounted) {
          setCifrasMatricula(CIFRAS_OFICIALES_CENSO[escuelaStatsActiva] || CIFRAS_OFICIALES_CENSO.sb);
        }
      } catch {
        if (isMounted) {
          setCifrasMatricula(CIFRAS_OFICIALES_CENSO[escuelaStatsActiva] || CIFRAS_OFICIALES_CENSO.sb);
        }
      }
    }

    cargarEstadisticas();
    return () => { isMounted = false; };
  }, [escuelaStatsActiva]);

  // Estado para capturar el código hash en el validador de constancias
  const [codigoHash, setCodigoHash] = useState<string>('');

  // Estado para alternar el mensaje de asistencia de Zoe y Max
  const [mensajeAsistente, setMensajeAsistente] = useState<string>(
    '¡Hola! Somos Zoe y Max, tus guías escolares en SIGAE. Te damos la bienvenida a nuestro portal unificado.'
  );

  // Control para asegurar que la barra flote fija sobre todo el contenido al hacer scroll (efecto cápsula BDT)
  const [esFlotante, setEsFlotante] = useState<boolean>(false);

  // ── ESTADOS DEL CARRUSEL DE GESTIÓN DIARIA APROBADA ──
  // Reportes de actividades escolares aprobadas en el sistema (UE Libertador Bolívar, UE Santa Bárbara)
  const [reportesGestion, setReportesGestion] = useState<ReporteGestionDiaria[]>([]);
  // Índice de la diapositiva activa (0 = Bienvenida con Zoe y Max, 1..N = Reportes de Gestión Diaria)
  const [slideActivo, setSlideActivo] = useState<number>(0);
  // Pausar rotación automática cuando el usuario pasa el ratón por encima
  const [carruselPausado, setCarruselPausado] = useState<boolean>(false);
  // Reporte seleccionado para visualizar en el modal emergente con detalles oficiales
  const [reporteModal, setReporteModal] = useState<ReporteGestionDiaria | null>(null);

  // ── ESTADO DEL MENÚ REDUCIDO PARA TELÉFONOS (MOBILE DRAWER) ──
  const [menuMovilAbierto, setMenuMovilAbierto] = useState<boolean>(false);

  // Cargar reportes de gestión diaria aprobados desde el servicio
  useEffect(() => {
    const cargarReportes = async () => {
      try {
        const datos = await gestionDiariaService.obtenerReportesCarrusel();
        setReportesGestion(datos);
      } catch (e) {
        console.error('Error cargando reportes de gestión diaria para el carrusel:', e);
      }
    };

    cargarReportes();

    // Escuchar actualizaciones dinámicas si se aprueba un nuevo reporte en el sistema
    const handleActualizacion = () => cargarReportes();
    window.addEventListener('sigae-reportes-actualizados', handleActualizacion);
    return () => window.removeEventListener('sigae-reportes-actualizados', handleActualizacion);
  }, []);

  // Autoplay del carrusel del Hero Banner cada 7 segundos (estilo BDT)
  useEffect(() => {
    const totalSlides = 5 + reportesGestion.length;
    if (totalSlides <= 1 || carruselPausado) return;

    const timer = setInterval(() => {
      setSlideActivo((prev) => (prev + 1) % totalSlides);
    }, 7000);

    return () => clearInterval(timer);
  }, [carruselPausado, reportesGestion.length]);

  // Soporte para gestos táctiles (swipe) en dispositivos móviles para el carrusel
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX - touchEndX;
    if (diffX > 45) {
      slideSiguiente();
    } else if (diffX < -45) {
      slideAnterior();
    }
    setTouchStartX(null);
  };

  const totalSlides = 5 + reportesGestion.length;
  const slideAnterior = () => {
    setSlideActivo((prev) => (prev - 1 + totalSlides) % totalSlides);
  };
  const slideSiguiente = () => {
    setSlideActivo((prev) => (prev + 1) % totalSlides);
  };

  // ── MOTOR GLOBAL DE PARALLAX INTERACTIVO (MOUSE 3D EN TODA LA WEB + PROFUNDIDAD SCROLL) ──
  const portalRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [scrollParallax, setScrollParallax] = useState(0);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // Rango: -1 a 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // Rango: -1 a 1
    setParallaxOffset({ x, y });
  };

  const handleHeroMouseLeave = () => {
    setCarruselPausado(false);
  };

  // Efecto para escuchar el mouse y desplazamiento vertical en toda la ventana (Parallax Global)
  useEffect(() => {
    let ticking = false;
    let currentX = 0;
    let currentY = 0;
    let currentScroll = window.scrollY;

    const updateCSSVariables = () => {
      if (portalRef.current) {
        portalRef.current.style.setProperty('--global-px', currentX.toFixed(4));
        portalRef.current.style.setProperty('--global-py', currentY.toFixed(4));
        portalRef.current.style.setProperty('--parallax-x', currentX.toFixed(4));
        portalRef.current.style.setProperty('--parallax-y', currentY.toFixed(4));
        portalRef.current.style.setProperty('--global-scroll', `${currentScroll}px`);
        portalRef.current.style.setProperty('--scroll-parallax', `${(currentScroll * 0.22).toFixed(2)}px`);
      }
      ticking = false;
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Coordenadas normalizadas respecto a la ventana completa (-1 a 1)
      currentX = ((e.clientX / window.innerWidth) - 0.5) * 2;
      currentY = ((e.clientY / window.innerHeight) - 0.5) * 2;

      if (!ticking) {
        window.requestAnimationFrame(updateCSSVariables);
        ticking = true;
      }
    };

    const handleScroll = () => {
      currentScroll = window.scrollY;
      if (window.scrollY > 35) {
        setEsFlotante(true);
      } else {
        setEsFlotante(false);
      }
      if (window.scrollY < 1200) {
        setScrollParallax(window.scrollY);
      }

      if (!ticking) {
        window.requestAnimationFrame(updateCSSVariables);
        ticking = true;
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
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
    <div 
      ref={portalRef}
      className="portal-bdt-wrapper"
      style={{
        '--global-px': parallaxOffset.x,
        '--global-py': parallaxOffset.y,
        '--parallax-x': parallaxOffset.x,
        '--parallax-y': parallaxOffset.y,
        '--scroll-parallax': `${scrollParallax * 0.22}px`,
      } as React.CSSProperties}
    >
      
      {/* ── 1. LA AUTÉNTICA BARRA SUPERPUESTA Y FLOTANTE (ESTILO BDT CON LOGO SIGAE AL CENTRO) ── */}
      <header className="bdt-floating-navbar-container">
        <nav className="bdt-floating-navbar">
          
          {/* LADO IZQUIERDO: Enlaces de navegación rápida tipo cápsula con efecto Liquid-Y al estilo BDT */}
          <div className="d-none d-lg-flex align-items-center gap-1.5">
            <a href="#inicio" className="bdt-float-navlink bdt-navlink-inicio" title="Ir al inicio del portal">
              <img src="/icons3d/icono_inicio_3d.png" alt="Inicio" className="bdt-menu-icon-3d" />
              <LiquidWaveText text="INICIO" />
            </a>

            <a href="#matricula" className="bdt-float-navlink bdt-navlink-matricula" title="Consultar matrícula escolar y estadísticas oficiales">
              <img src="/icons3d/icono_estudiantil_3d.png" alt="Matrícula" className="bdt-menu-icon-3d" />
              <LiquidWaveText text="MATRÍCULA" />
            </a>

            <a href="#modalidades" className="bdt-float-navlink bdt-navlink-modalidades" title="Ver modalidades educativas integradas">
              <img src="/icons3d/icono_academico_3d.png" alt="Modalidades" className="bdt-menu-icon-3d" />
              <LiquidWaveText text="MODALIDADES" />
            </a>

            <a href="#modulos" className="bdt-float-navlink bdt-navlink-modulos" title="Explorar servicios y módulos más solicitados">
              <img src="/icons3d/icono_organizacion_3d.png" alt="Módulos" className="bdt-menu-icon-3d" />
              <LiquidWaveText text="MÓDULOS" />
            </a>

            <a href="#planteles" className="bdt-float-navlink bdt-navlink-planteles" title="Red de planteles conectados">
              <img src="/icons3d/icono_direccion_3d.png" alt="Planteles" className="bdt-menu-icon-3d" />
              <LiquidWaveText text="PLANTELES" />
            </a>

            <a href="#verificar" className="bdt-float-navlink bdt-navlink-verificar" title="Verificar validez de documentos QR">
              <img src="/icons3d/icono_seguridad_3d.png" alt="Validar QR" className="bdt-menu-icon-3d" />
              <LiquidWaveText text="VALIDAR QR" />
            </a>
          </div>

          {/* CENTRO PROTAGONISTA: ESCUDO FLOTANTE DE SIGAE LIMPIO Y JUSTIFICADO SOBRE LA BARRA DE MENÚ */}
          <Link to="/" className="bdt-float-center-branding" title="SIGAE - Sistema Integral de Gestión y Administración Escolar">
            <div className="sigae-login-style-shield-wrapper">
              <img 
                src="/assets/img/sigae.png?v=escudo3d" 
                alt="Escudo Oficial SIGAE Flotante" 
                className="sigae-login-style-shield-img"
              />
            </div>
            <div className="bdt-float-title-group">
              <span className="bdt-float-brand-acronym">SIGAE</span>
              <span className="bdt-float-brand-full">Sistema Integral de Gestión y Administración Escolar</span>
            </div>
          </Link>

          {/* LADO DERECHO: Badge Zoe & Max + Botón Cápsula 'SIGAEenLínea' + Botón Menú Móvil */}
          <div className="d-flex align-items-center gap-2 gap-md-2.5">
            
            {/* Botón Asistente IA Zoe & Max Integrado en la Barra de Menú */}
            <button
              type="button"
              className="bdt-menu-ia-btn d-none d-sm-inline-flex"
              onClick={() => {
                setMensajeAsistente(
                  '¡Hola! Somos Zoe y Max. Puedes ingresar a tu institución educativa con el botón naranja "SIGAEenLínea", explorar los módulos escolares o verificar constancias con código QR.'
                );
                const elem = document.getElementById('asistentes');
                if (elem) {
                  elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              title="Consultar orientación con los asistentes Zoe y Max"
            >
              <div className="bdt-menu-ia-avatars">
                <img 
                  src="/zoe_avatar.png" 
                  alt="Zoe" 
                  className="bdt-menu-ia-avatar zoe" 
                  onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }} 
                />
                <img 
                  src="/max_avatar.png" 
                  alt="Max" 
                  className="bdt-menu-ia-avatar max" 
                  onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }} 
                />
              </div>
              <div className="bdt-menu-ia-text">
                <span className="bdt-menu-ia-title">Zoe & Max</span>
                <span className="bdt-menu-ia-sub">Asistente IA ★</span>
              </div>
            </button>

            {/* BOTÓN PÍLDORA EXACTO: 'SIGAEenLínea' (Equivalente fiel con naranja de acción de la web vieja) */}
            <button 
              type="button" 
              className="bdt-btn-en-linea"
              onClick={abrirSelectorEscuela}
              title="Acceder a tu institución escolar"
            >
              <i className="bi bi-shield-lock-fill"></i>
              <LiquidWaveText text="SIGAEenLínea" />
            </button>

            {/* BOTÓN HAMBURGUESA PARA TELÉFONOS (VISUALIZACIÓN DE PARTES DE LA WEB EN MÓVIL) */}
            <button
              type="button"
              className="bdt-mobile-menu-btn d-flex d-lg-none"
              onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
              title="Ver todas las secciones del portal"
              aria-label="Abrir menú de navegación móvil"
            >
              <i className={`bi ${menuMovilAbierto ? 'bi-x-lg' : 'bi-list'}`}></i>
            </button>

          </div>

        </nav>
      </header>

      {/* ── 2. MENÚ MÓVIL DESPLEGABLE REDUCIDO CON ICONOS 3D PARA TELÉFONOS ── */}
      {menuMovilAbierto && (
        <div className="bdt-mobile-drawer-backdrop" onClick={() => setMenuMovilAbierto(false)}>
          <div className="bdt-mobile-drawer" onClick={(e) => e.stopPropagation()}>
            
            {/* Cabecera del Menú Móvil */}
            <div className="bdt-mobile-drawer-header">
              <div className="d-flex align-items-center gap-2.5">
                <img 
                  src="/assets/img/sigae.png?v=escudo3d" 
                  alt="Escudo SIGAE" 
                  style={{ width: '38px', height: '38px', objectFit: 'contain' }} 
                />
                <div>
                  <span className="fw-black text-dark font-ruda fs-6 d-block" style={{ lineHeight: 1.1 }}>SIGAE</span>
                  <span className="extra-small fw-bold" style={{ color: 'var(--bdt-purple-bicentenario)', fontSize: '0.68rem' }}>
                    Menú del Portal Escolar
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                className="btn-close"
                aria-label="Cerrar menú"
                onClick={() => setMenuMovilAbierto(false)}
              ></button>
            </div>

            {/* Lista de Secciones con Iconos 3D */}
            <div className="bdt-mobile-drawer-body">
              
              <a 
                href="#inicio" 
                className="bdt-mobile-drawer-link bdt-navlink-inicio"
                onClick={() => setMenuMovilAbierto(false)}
              >
                <img src="/icons3d/icono_inicio_3d.png" alt="Inicio" className="bdt-mobile-menu-icon-3d" />
                <div>
                  <span className="d-block font-ruda fw-bold">Inicio y Bienvenida</span>
                  <span className="extra-small text-muted fw-normal" style={{ fontSize: '0.72rem' }}>Portada principal y novedades</span>
                </div>
              </a>

              <a 
                href="#matricula" 
                className="bdt-mobile-drawer-link bdt-navlink-matricula"
                onClick={() => setMenuMovilAbierto(false)}
              >
                <img src="/icons3d/icono_estudiantil_3d.png" alt="Matrícula" className="bdt-mobile-menu-icon-3d" />
                <div>
                  <span className="d-block font-ruda fw-bold">Matrícula Escolar & Cifras</span>
                  <span className="extra-small text-muted fw-normal" style={{ fontSize: '0.72rem' }}>Estadísticas oficiales por nivel educativo</span>
                </div>
              </a>

              <a 
                href="#modalidades" 
                className="bdt-mobile-drawer-link bdt-navlink-modalidades"
                onClick={() => setMenuMovilAbierto(false)}
              >
                <img src="/icons3d/icono_academico_3d.png" alt="Modalidades" className="bdt-mobile-menu-icon-3d" />
                <div>
                  <span className="d-block font-ruda fw-bold">Modalidades Educativas</span>
                  <span className="extra-small text-muted fw-normal" style={{ fontSize: '0.72rem' }}>Presencial, E-Learning, B-Learning y M-Learning</span>
                </div>
              </a>

              <a 
                href="#modulos" 
                className="bdt-mobile-drawer-link bdt-navlink-modulos"
                onClick={() => setMenuMovilAbierto(false)}
              >
                <img src="/icons3d/icono_organizacion_3d.png" alt="Módulos" className="bdt-mobile-menu-icon-3d" />
                <div>
                  <span className="d-block font-ruda fw-bold">Servicios y Módulos Frecuentes</span>
                  <span className="extra-small text-muted fw-normal" style={{ fontSize: '0.72rem' }}>Boletines, cupos, datos y transporte</span>
                </div>
              </a>

              <a 
                href="#planteles" 
                className="bdt-mobile-drawer-link bdt-navlink-planteles"
                onClick={() => setMenuMovilAbierto(false)}
              >
                <img src="/icons3d/icono_direccion_3d.png" alt="Planteles" className="bdt-mobile-menu-icon-3d" />
                <div>
                  <span className="d-block font-ruda fw-bold">Planteles y Sedes Conectadas</span>
                  <span className="extra-small text-muted fw-normal" style={{ fontSize: '0.72rem' }}>UE Libertador Bolívar y UE Santa Bárbara</span>
                </div>
              </a>

              <a 
                href="#verificar" 
                className="bdt-mobile-drawer-link bdt-navlink-verificar"
                onClick={() => setMenuMovilAbierto(false)}
              >
                <img src="/icons3d/icono_seguridad_3d.png" alt="Validar QR" className="bdt-mobile-menu-icon-3d" />
                <div>
                  <span className="d-block font-ruda fw-bold">Validar Constancia con Código QR</span>
                  <span className="extra-small text-muted fw-normal" style={{ fontSize: '0.72rem' }}>Verificador criptográfico de documentos</span>
                </div>
              </a>

              {/* Acceso a Asistentes Zoe y Max */}
              <div 
                className="p-3 rounded-4 d-flex align-items-center justify-content-between cursor-pointer mt-1"
                style={{ background: '#fff8eb', border: '1.5px solid #fed7aa' }}
                onClick={() => {
                  setMenuMovilAbierto(false);
                  const elem = document.getElementById('asistentes');
                  if (elem) elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              >
                <div className="d-flex align-items-center gap-2">
                  <div className="d-flex align-items-center">
                    <img src="/zoe_avatar.png" alt="Zoe" style={{ width: '30px', height: '30px', borderRadius: '50%', border: '2px solid #fff' }} />
                    <img src="/max_avatar.png" alt="Max" style={{ width: '30px', height: '30px', borderRadius: '50%', border: '2px solid #fff', marginLeft: '-9px' }} />
                  </div>
                  <div>
                    <span className="fw-bold d-block text-dark small" style={{ lineHeight: 1.1 }}>Zoe & Max</span>
                    <span className="extra-small text-muted" style={{ fontSize: '0.7rem' }}>Asistentes de Inteligencia Escolar</span>
                  </div>
                </div>
                <span className="badge rounded-pill text-white px-2.5 py-1 extra-small fw-bold" style={{ backgroundColor: 'var(--bdt-orange-action)' }}>
                  Orientación ★
                </span>
              </div>

              {/* Botón de Acceso en Línea y Plantel */}
              <div className="pt-2 border-top mt-2 d-flex flex-column gap-2">
                <button 
                  type="button" 
                  className="btn text-white fw-bold rounded-pill py-2.5 d-flex align-items-center justify-content-center gap-2 w-100 font-ruda shadow-sm"
                  style={{ background: 'linear-gradient(135deg, var(--bdt-orange-action) 0%, #e05314 100%)', border: 'none' }}
                  onClick={() => {
                    setMenuMovilAbierto(false);
                    abrirSelectorEscuela();
                  }}
                >
                  <i className="bi bi-shield-lock-fill"></i>
                  <span>Acceder a SIGAEenLínea</span>
                </button>

                <button 
                  type="button" 
                  className="btn btn-outline-secondary fw-bold rounded-pill py-2 d-flex align-items-center justify-content-center gap-2 w-100 font-ruda extra-small"
                  onClick={() => {
                    setMenuMovilAbierto(false);
                    abrirSelectorEscuela();
                  }}
                >
                  <i className="bi bi-buildings"></i>
                  <span>Seleccionar Mi Plantel Educativo</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ── 5. HERO BANNER PRINCIPAL: CARRUSEL ESCOLAR CON EFECTO PARALLAX INTERACTIVO ── */}
      <section 
        id="inicio" 
        ref={heroRef}
        className="bdt-hero-section"
        onMouseEnter={() => setCarruselPausado(true)}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        style={{
          '--parallax-x': parallaxOffset.x,
          '--parallax-y': parallaxOffset.y,
          '--scroll-parallax': `${scrollParallax * 0.22}px`,
          '--slide-bg-offset': `${slideActivo * 25}px`,
        } as React.CSSProperties}
      >
        {/* Atmósfera Digital y Resplandor Radial BDT */}
        <div className="bdt-hero-glow-atmosphere"></div>

        {/* Partículas Neón Cuadradas Flotantes (Idénticas a www.bdt.com.ve) */}
        <div className="bdt-neon-square sq-yellow"></div>
        <div className="bdt-neon-square sq-pink"></div>
        <div className="bdt-neon-square sq-green"></div>
        <div className="bdt-neon-square sq-cyan"></div>

        <div className="container py-3 py-lg-4 position-relative" style={{ zIndex: 3 }}>
          
          <div className="bdt-hero-carousel-wrapper">
            
            {/* Flechas de Navegación Glassmorphic Circulares BDT (< y >) */}
            {totalSlides > 1 && (
              <>
                <button
                  type="button"
                  className="bdt-hero-nav-arrow prev"
                  onClick={slideAnterior}
                  title="Ver diapositiva anterior"
                  aria-label="Anterior"
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button
                  type="button"
                  className="bdt-hero-nav-arrow next"
                  onClick={slideSiguiente}
                  title="Ver diapositiva siguiente"
                  aria-label="Siguiente"
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </>
            )}

            {/* CONTENEDOR VIEWPORT Y TRACK CONTINUO CON DESPLAZAMIENTO HORIZONTAL ESTILO BDT */}
            <div 
              className="bdt-hero-carousel-viewport"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div 
                className="bdt-hero-carousel-track"
                style={{
                  transform: `translateX(-${slideActivo * 100}%)`,
                  transition: 'transform 0.65s cubic-bezier(0.25, 1, 0.5, 1)'
                }}
              >
                
                {/* ── DIAPOSITIVA 0: MÓDULO APP 1 - CONTROL DE ESTUDIOS & BOLETINES ── */}
                <div className={`bdt-hero-slide-item ${slideActivo === 0 ? 'is-active' : ''}`}>
                  <div className="row align-items-center g-4 g-lg-5 bdt-hero-slide">
                    
                    {/* Columna Izquierda: Información del Módulo de Control de Estudios */}
                    <div className="col-lg-6 text-center text-lg-start bdt-hero-text-col">
                      <div className="d-inline-flex flex-wrap align-items-center gap-2 bg-primary bg-opacity-10 border border-primary border-opacity-25 px-3 py-1.5 rounded-pill mb-3 small fw-bold shadow-xs text-primary">
                        <i className="bi bi-mortarboard-fill text-primary"></i>
                        <span>MÓDULO DE LA APP &bull; CONTROL DE ESTUDIOS</span>
                      </div>

                      <div className="bdt-hero-title-top">
                        CONTROL DE ESTUDIOS
                      </div>
                      <div className="bdt-hero-title-mid" style={{ color: '#1d4ed8' }}>
                        Boletines Oficiales & Evaluación Continua
                      </div>
                      <div className="bdt-hero-title-bottom">
                        ¡Calificaciones en Tiempo Real!
                      </div>

                      <p className="bdt-hero-desc mx-auto mx-lg-0">
                        Módulo académico oficial de la APP: registro de calificaciones por lapsos I, II y III, actas de evaluación continua según normativa MPPE y emisión instantánea de boletines de calificaciones oficiales con firma digital y sello institucional.
                      </p>

                      <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start gap-3">
                        <button 
                          type="button" 
                          className="btn rounded-pill py-2.5 px-4 fs-6 shadow-sm text-white fw-bold d-inline-flex align-items-center gap-2 font-ruda"
                          style={{ backgroundColor: 'var(--bdt-orange-action)', border: 'none', boxShadow: '0 8px 24px rgba(242, 101, 34, 0.45)' }}
                          onClick={abrirSelectorEscuela}
                        >
                          <i className="bi bi-mortarboard-fill"></i>
                          <span>🏛️ Ingresar a Control de Estudios</span>
                        </button>

                        <a 
                          href="#modulos" 
                          className="btn btn-outline-primary rounded-pill px-4 py-2.5 fw-bold d-inline-flex align-items-center gap-2 font-ruda shadow-xs"
                          style={{ fontSize: '0.86rem', backgroundColor: '#ffffff', borderColor: '#2563eb' }}
                        >
                          <i className="bi bi-file-earmark-bar-graph-fill text-primary"></i>
                          <span>Consultar Boletines</span>
                        </a>
                      </div>
                    </div>

                    {/* Columna Derecha: Showcase 3D del Módulo con Icono y Tarjetas Flotantes */}
                    <div id="asistentes" className="col-lg-6 text-center bdt-hero-visual-col">
                      <div className="bdt-3d-showcase-box">
                        
                        {/* Tarjeta Central del Módulo con Icono 3D Académico */}
                        <div className="bdt-module-showcase-card">
                          <div className="bdt-module-3d-icon-wrap">
                            <img 
                              src="/icons3d/icono_academico_3d.png" 
                              alt="Control de Estudios 3D" 
                              className="bdt-module-3d-icon-img"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                            />
                          </div>
                          <h5 className="fw-black text-dark font-ruda mb-1">Control de Estudios & Notas</h5>
                          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3 py-1 extra-small fw-bold mb-3">
                            Lapsos I, II y III Sincronizados
                          </span>
                          <div className="w-100 p-2.5 rounded-3 bg-light border text-start">
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <span className="extra-small text-muted fw-bold">PROMEDIO OFICIAL:</span>
                              <span className="badge bg-success text-white extra-small fw-bold">19.8 / 20</span>
                            </div>
                            <div className="d-flex align-items-center justify-content-between">
                              <span className="extra-small text-muted">Estatus Académico:</span>
                              <span className="extra-small text-primary fw-bold">● Aprobado con Excelencia</span>
                            </div>
                          </div>
                        </div>

                        {/* Tarjeta Boletín Digital Flotante */}
                        <div className="bdt-floating-card-boletin d-none d-sm-block" style={{ top: '6%', left: '-25px', bottom: 'auto', right: 'auto', transform: 'rotate(-8deg)' }}>
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <span className="badge bg-light text-success extra-small fw-bold px-1.5 py-0.5 rounded">BOLETÍN OFICIAL</span>
                            <i className="bi bi-award-fill text-warning fs-6"></i>
                          </div>
                          <div className="text-start mb-1">
                            <div className="fw-bold text-white" style={{ fontSize: '0.76rem' }}>Calificaciones Aprobadas</div>
                            <div className="text-light opacity-80" style={{ fontSize: '0.65rem' }}>Promedio General: 19.8 / 20</div>
                          </div>
                          <div className="d-flex align-items-center justify-content-between pt-1 border-top border-white border-opacity-20">
                            <span className="badge bg-white bg-opacity-20 text-white extra-small" style={{ fontSize: '0.62rem' }}>Lapsos I, II, III</span>
                            <span className="text-white fw-bold extra-small" style={{ fontSize: '0.62rem' }}>Aprobado ★</span>
                          </div>
                        </div>

                        {/* Zoe & Max 3D integrados con Globo de Diálogo */}
                        <div className="bdt-zoe-max-hero-card d-none d-md-flex" style={{ position: 'absolute', right: '-10px', bottom: '-15px', zIndex: 6 }}>
                          <div className="bdt-zoe-max-speech-bubble mx-auto mb-1" style={{ maxWidth: '240px', padding: '8px 12px' }}>
                            <div className="d-flex align-items-center gap-1 fw-bold text-primary extra-small mb-0.5">
                              <i className="bi bi-chat-quote-fill text-warning"></i>
                              <span>Zoe & Max</span>
                            </div>
                            <p className="m-0 text-secondary" style={{ fontSize: '0.75rem', lineHeight: 1.35 }}>
                              {mensajeAsistente}
                            </p>
                          </div>
                          <img 
                            src="/zoe_max_duo_3d.png" 
                            alt="Zoe y Max" 
                            className="bdt-zoe-max-img"
                            style={{ maxHeight: '250px' }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/zoe_max_duo.png';
                            }}
                          />
                        </div>

                      </div>
                    </div>

                  </div>
                </div>

                {/* ── DIAPOSITIVA 1: MÓDULO APP 2 - CARNETIZACIÓN & VALIDACIÓN QR ── */}
                <div className={`bdt-hero-slide-item ${slideActivo === 1 ? 'is-active' : ''}`}>
                  <div className="row align-items-center g-4 g-lg-5 bdt-hero-slide">
                    
                    {/* Columna Izquierda: Información de Carnetización y Seguridad */}
                    <div className="col-lg-6 text-center text-lg-start bdt-hero-text-col">
                      <div className="d-inline-flex flex-wrap align-items-center gap-2 bg-success bg-opacity-10 border border-success border-opacity-25 px-3 py-1.5 rounded-pill mb-3 small fw-bold shadow-xs text-success">
                        <i className="bi bi-shield-check text-success"></i>
                        <span>MÓDULO DE LA APP &bull; CARNETIZACIÓN & SEGURIDAD</span>
                      </div>

                      <div className="bdt-hero-title-top">
                        CARNETIZACIÓN DIGITAL
                      </div>
                      <div className="bdt-hero-title-mid" style={{ color: '#059669' }}>
                        Identidad Escolar & Validación Criptográfica
                      </div>
                      <div className="bdt-hero-title-bottom">
                        ¡Verificación Instantánea con QR!
                      </div>

                      <p className="bdt-hero-desc mx-auto mx-lg-0">
                        Emisión automatizada de carnets institucionales inteligentes con fotografía del estudiante, código QR institucional inviolable y verificación pública de constancias de estudio sin costo para las familias.
                      </p>

                      <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start gap-3">
                        <a 
                          href="#verificar" 
                          className="btn rounded-pill py-2.5 px-4 fs-6 shadow-sm text-white fw-bold d-inline-flex align-items-center gap-2 font-ruda"
                          style={{ backgroundColor: '#059669', border: 'none', boxShadow: '0 8px 24px rgba(5, 150, 105, 0.4)' }}
                        >
                          <i className="bi bi-qr-code-scan"></i>
                          <span>🔍 Validar Carnet o Constancia</span>
                        </a>

                        <button 
                          type="button" 
                          className="btn btn-outline-success rounded-pill px-4 py-2.5 fw-bold d-inline-flex align-items-center gap-2 font-ruda shadow-xs"
                          style={{ fontSize: '0.86rem', backgroundColor: '#ffffff', borderColor: '#059669' }}
                          onClick={abrirSelectorEscuela}
                        >
                          <i className="bi bi-person-badge-fill text-success"></i>
                          <span>Expedición de Carnets</span>
                        </button>
                      </div>
                    </div>

                    {/* Columna Derecha: Showcase 3D del Carnet con QR y Foto */}
                    <div className="col-lg-6 text-center bdt-hero-visual-col">
                      <div className="bdt-3d-showcase-box">
                        
                        {/* Tarjeta Central del Módulo con Icono 3D de Seguridad */}
                        <div className="bdt-module-showcase-card">
                          <div className="bdt-module-3d-icon-wrap">
                            <img 
                              src="/icons3d/icono_seguridad_3d.png" 
                              alt="Seguridad QR 3D" 
                              className="bdt-module-3d-icon-img"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                            />
                          </div>
                          <h5 className="fw-black text-dark font-ruda mb-1">Carnetización & Validación QR</h5>
                          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-1 extra-small fw-bold mb-3">
                            100% Criptográfico y Antifraude
                          </span>
                          <div className="w-100 p-2.5 rounded-3 bg-light border text-start">
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <span className="extra-small text-muted fw-bold">TECNOLOGÍA:</span>
                              <span className="badge bg-primary text-white extra-small fw-bold">QR SHA-256</span>
                            </div>
                            <div className="d-flex align-items-center justify-content-between">
                              <span className="extra-small text-muted">Validación Pública:</span>
                              <span className="extra-small text-success fw-bold">● En Línea y Offline</span>
                            </div>
                          </div>
                        </div>

                        {/* Carnet Estudiantil Digital Flotante en 3D */}
                        <div className="bdt-floating-card-carnet d-none d-sm-block">
                          <div className="d-flex align-items-center justify-content-between mb-1.5">
                            <span className="badge bg-warning text-dark extra-small fw-black px-1.5 py-0.5 rounded">CARNET QR</span>
                            <i className="bi bi-wifi text-white fs-6"></i>
                          </div>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <div className="rounded-2 bg-white p-0.5 shadow-xs" style={{ width: 36, height: 36 }}>
                              <img src="/assets/img/avatar_inicial.png" alt="Estudiante" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                            </div>
                            <div className="text-start">
                              <div className="fw-bold text-white text-truncate" style={{ fontSize: '0.72rem', maxWidth: 120 }}>Estudiante Activo</div>
                              <div className="text-light extra-small opacity-75" style={{ fontSize: '0.62rem' }}>U.E. Libertador Bolívar</div>
                            </div>
                          </div>
                          <div className="d-flex align-items-center justify-content-between pt-1 border-top border-white border-opacity-20 extra-small">
                            <span style={{ fontSize: '0.62rem' }}>V-34.891.204</span>
                            <span className="text-warning fw-bold" style={{ fontSize: '0.62rem' }}>VERIFICADO</span>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>

                {/* ── DIAPOSITIVA 2: MÓDULO APP 3 - FICHA ESTUDIANTIL & EXPEDIENTE ── */}
                <div className={`bdt-hero-slide-item ${slideActivo === 2 ? 'is-active' : ''}`}>
                  <div className="row align-items-center g-4 g-lg-5 bdt-hero-slide">
                    
                    {/* Columna Izquierda: Información de Ficha Estudiantil y Matrícula */}
                    <div className="col-lg-6 text-center text-lg-start bdt-hero-text-col">
                      <div className="d-inline-flex flex-wrap align-items-center gap-2 px-3 py-1.5 rounded-pill mb-3 small fw-bold shadow-xs" style={{ backgroundColor: 'rgba(146, 39, 143, 0.1)', color: '#92278f', border: '1px solid rgba(146, 39, 143, 0.25)' }}>
                        <i className="bi bi-person-lines-fill"></i>
                        <span>MÓDULO DE LA APP &bull; EXPEDIENTE & MATRÍCULA</span>
                      </div>

                      <div className="bdt-hero-title-top">
                        FICHA ESTUDIANTIL
                      </div>
                      <div className="bdt-hero-title-mid" style={{ color: '#92278f' }}>
                        Expediente Integral & Matrícula Familiar
                      </div>
                      <div className="bdt-hero-title-bottom">
                        ¡Actualización de Datos en Línea!
                      </div>

                      <p className="bdt-hero-desc mx-auto mx-lg-0">
                        Expediente único del estudiante: ficha médica, datos de contacto del representante, antecedentes académicos y censo unificado con protección hermética por escuela mediante Row Level Security.
                      </p>

                      <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start gap-3">
                        <button 
                          type="button" 
                          className="btn rounded-pill py-2.5 px-4 fs-6 shadow-sm text-white fw-bold d-inline-flex align-items-center gap-2 font-ruda"
                          style={{ backgroundColor: 'var(--bdt-purple-bicentenario)', border: 'none', boxShadow: '0 8px 24px rgba(146, 39, 143, 0.4)' }}
                          onClick={abrirSelectorEscuela}
                        >
                          <i className="bi bi-pencil-square"></i>
                          <span>📝 Actualizar Datos Escolares</span>
                        </button>

                        <a 
                          href="#matricula" 
                          className="btn btn-outline-secondary rounded-pill px-4 py-2.5 fw-bold d-inline-flex align-items-center gap-2 font-ruda shadow-xs"
                          style={{ fontSize: '0.86rem', backgroundColor: '#ffffff', borderColor: '#92278f', color: '#92278f' }}
                        >
                          <i className="bi bi-people-fill text-primary"></i>
                          <span>Ver Cifras de Matrícula</span>
                        </a>
                      </div>
                    </div>

                    {/* Columna Derecha: Showcase 3D del Módulo con Icono Estudiantil */}
                    <div className="col-lg-6 text-center bdt-hero-visual-col">
                      <div className="bdt-3d-showcase-box">
                        
                        {/* Tarjeta Central del Módulo con Icono 3D Estudiantil */}
                        <div className="bdt-module-showcase-card">
                          <div className="bdt-module-3d-icon-wrap">
                            <img 
                              src="/icons3d/icono_estudiantil_3d.png" 
                              alt="Ficha Estudiantil 3D" 
                              className="bdt-module-3d-icon-img"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                            />
                          </div>
                          <h5 className="fw-black text-dark font-ruda mb-1">Ficha Estudiantil Digital</h5>
                          <span className="badge rounded-pill px-3 py-1 extra-small fw-bold mb-3" style={{ backgroundColor: 'rgba(146, 39, 143, 0.1)', color: '#92278f', border: '1px solid rgba(146, 39, 143, 0.25)' }}>
                            1,333 Expedientes Validados
                          </span>
                          <div className="w-100 p-2.5 rounded-3 bg-light border text-start">
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <span className="extra-small text-muted fw-bold">NIVELES:</span>
                              <span className="badge bg-secondary text-white extra-small fw-bold">Inicial &bull; Primaria &bull; Media</span>
                            </div>
                            <div className="d-flex align-items-center justify-content-between">
                              <span className="extra-small text-muted">Aislamiento RLS:</span>
                              <span className="extra-small text-success fw-bold">● Hermético por Escuela</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>

                {/* ── DIAPOSITIVA 3: MÓDULO APP 4 - SOLICITUD DE CUPOS & ADMISIONES ── */}
                <div className={`bdt-hero-slide-item ${slideActivo === 3 ? 'is-active' : ''}`}>
                  <div className="row align-items-center g-4 g-lg-5 bdt-hero-slide">
                    
                    {/* Columna Izquierda: Información de Admisiones y Cupos */}
                    <div className="col-lg-6 text-center text-lg-start bdt-hero-text-col">
                      <div className="d-inline-flex flex-wrap align-items-center gap-2 bg-warning bg-opacity-20 border border-warning border-opacity-40 px-3 py-1.5 rounded-pill mb-3 small fw-bold shadow-xs text-dark">
                        <i className="bi bi-backpack-fill text-warning"></i>
                        <span>MÓDULO DE LA APP &bull; ADMISIONES & CUPOS</span>
                      </div>

                      <div className="bdt-hero-title-top">
                        SOLICITUD DE CUPOS
                      </div>
                      <div className="bdt-hero-title-mid" style={{ color: '#d97706' }}>
                        Admisión Transparente para Nuevos Ingresos
                      </div>
                      <div className="bdt-hero-title-bottom">
                        ¡Trámite Escolar 100% Digital!
                      </div>

                      <p className="bdt-hero-desc mx-auto mx-lg-0">
                        Recepción de solicitudes de cupos por nivel académico (Educación Inicial, Primaria y Media General). Asignación equitativa, seguimiento del estado de la postulación y formalización de inscripción sin filas presenciales.
                      </p>

                      <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start gap-3">
                        <a 
                          href="#modulos" 
                          className="btn rounded-pill py-2.5 px-4 fs-6 shadow-sm text-white fw-bold d-inline-flex align-items-center gap-2 font-ruda"
                          style={{ backgroundColor: 'var(--bdt-orange-action)', border: 'none', boxShadow: '0 8px 24px rgba(242, 101, 34, 0.45)' }}
                        >
                          <i className="bi bi-backpack-fill"></i>
                          <span>🎒 Solicitar Cupo Escolar</span>
                        </a>

                        <a 
                          href="#planteles" 
                          className="btn btn-outline-warning rounded-pill px-4 py-2.5 fw-bold d-inline-flex align-items-center gap-2 font-ruda shadow-xs text-dark"
                          style={{ fontSize: '0.86rem', backgroundColor: '#ffffff', borderColor: '#d97706' }}
                        >
                          <i className="bi bi-buildings-fill text-warning"></i>
                          <span>Sedes y Disponibilidad</span>
                        </a>
                      </div>
                    </div>

                    {/* Columna Derecha: Showcase 3D del Módulo con Icono de Admisiones */}
                    <div className="col-lg-6 text-center bdt-hero-visual-col">
                      <div className="bdt-3d-showcase-box">
                        
                        {/* Tarjeta Central del Módulo con Icono 3D de Admisiones */}
                        <div className="bdt-module-showcase-card">
                          <div className="bdt-module-3d-icon-wrap">
                            <img 
                              src="/icons3d/icono_admisiones_3d.png" 
                              alt="Admisiones 3D" 
                              className="bdt-module-3d-icon-img"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                            />
                          </div>
                          <h5 className="fw-black text-dark font-ruda mb-1">Admisiones & Solicitud de Cupos</h5>
                          <span className="badge bg-warning bg-opacity-20 text-dark border border-warning border-opacity-40 rounded-pill px-3 py-1 extra-small fw-bold mb-3">
                            Preinscripción Transparente
                          </span>
                          <div className="w-100 p-2.5 rounded-3 bg-light border text-start">
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <span className="extra-small text-muted fw-bold">ESTADO DE CUPOS:</span>
                              <span className="badge bg-success text-white extra-small fw-bold">Disponibles</span>
                            </div>
                            <div className="d-flex align-items-center justify-content-between">
                              <span className="extra-small text-muted">Asignación Directa:</span>
                              <span className="extra-small text-primary fw-bold">● Cero Papel y Cero Colas</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>

                {/* ── DIAPOSITIVA 4: MÓDULO APP 5 - TRANSPORTE ESCOLAR & RUTOGRAMAS ── */}
                <div className={`bdt-hero-slide-item ${slideActivo === 4 ? 'is-active' : ''}`}>
                  <div className="row align-items-center g-4 g-lg-5 bdt-hero-slide">
                    
                    {/* Columna Izquierda: Información de Transporte y Rutas */}
                    <div className="col-lg-6 text-center text-lg-start bdt-hero-text-col">
                      <div className="d-inline-flex flex-wrap align-items-center gap-2 bg-info bg-opacity-10 border border-info border-opacity-30 px-3 py-1.5 rounded-pill mb-3 small fw-bold shadow-xs text-primary">
                        <i className="bi bi-bus-front-fill text-info"></i>
                        <span>MÓDULO DE LA APP &bull; LOGÍSTICA & TRANSPORTE</span>
                      </div>

                      <div className="bdt-hero-title-top">
                        TRANSPORTE Y RUTOGRAMAS
                      </div>
                      <div className="bdt-hero-title-mid" style={{ color: '#0284c7' }}>
                        Movilidad Estudiantil de Punceres
                      </div>
                      <div className="bdt-hero-title-bottom">
                        ¡Control de Paradas y Unidades!
                      </div>

                      <p className="bdt-hero-desc mx-auto mx-lg-0">
                        Censo de movilidad para estudiantes de Miraflores, Cachipo, Puente Punceres y sectores aledaños. Rutogramas oficiales, control de paradas escolares y asignación de unidades para traslados seguros y puntuales.
                      </p>

                      <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start gap-3">
                        <a 
                          href="#modulos" 
                          className="btn rounded-pill py-2.5 px-4 fs-6 shadow-sm text-white fw-bold d-inline-flex align-items-center gap-2 font-ruda"
                          style={{ backgroundColor: '#0284c7', border: 'none', boxShadow: '0 8px 24px rgba(2, 132, 199, 0.4)' }}
                        >
                          <i className="bi bi-bus-front-fill"></i>
                          <span>🚌 Ver Rutas y Paradas</span>
                        </a>

                        <button 
                          type="button" 
                          className="btn btn-outline-info rounded-pill px-4 py-2.5 fw-bold d-inline-flex align-items-center gap-2 font-ruda shadow-xs text-primary"
                          style={{ fontSize: '0.86rem', backgroundColor: '#ffffff', borderColor: '#0284c7' }}
                          onClick={abrirSelectorEscuela}
                        >
                          <i className="bi bi-shield-lock-fill"></i>
                          <span>Ingresar a la Plataforma</span>
                        </button>
                      </div>
                    </div>

                    {/* Columna Derecha: Showcase 3D del Módulo con Icono de Transporte */}
                    <div className="col-lg-6 text-center bdt-hero-visual-col">
                      <div className="bdt-3d-showcase-box">
                        
                        {/* Tarjeta Central del Módulo con Icono 3D de Transporte */}
                        <div className="bdt-module-showcase-card">
                          <div className="bdt-module-3d-icon-wrap">
                            <img 
                              src="/icons3d/icono_transporte_3d.png" 
                              alt="Transporte 3D" 
                              className="bdt-module-3d-icon-img"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                            />
                          </div>
                          <h5 className="fw-black text-dark font-ruda mb-1">Transporte y Rutas Escolares</h5>
                          <span className="badge bg-info bg-opacity-15 text-primary border border-info border-opacity-30 rounded-pill px-3 py-1 extra-small fw-bold mb-3">
                            Monitoreo de Movilidad
                          </span>
                          <div className="w-100 p-2.5 rounded-3 bg-light border text-start">
                            <div className="d-flex align-items-center justify-content-between mb-1">
                              <span className="extra-small text-muted fw-bold">COBERTURA:</span>
                              <span className="badge bg-warning text-dark extra-small fw-bold">Miraflores &bull; Cachipo</span>
                            </div>
                            <div className="d-flex align-items-center justify-content-between">
                              <span className="extra-small text-muted">Logística de Paradas:</span>
                              <span className="extra-small text-success fw-bold">● Rutograma Oficial Activo</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                </div>

                {/* ── DIAPOSITIVAS 5..N: GESTIONES DIARIAS ESCOLARES APROBADAS EN LA APP ── */}
                {reportesGestion.map((rep, idx) => {
                  const num = idx + 5;
                  const nombreEscuela = rep.proceso || (rep.escuela_codigo === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
                  const fotoBanner = rep.banner_superior || rep.imagenes?.[0] || '/assets/img/gestion_diaria/reporte_ejemplo_collage.png';
                  const isActive = slideActivo === num;

                  return (
                    <div key={rep.id} className={`bdt-hero-slide-item ${isActive ? 'is-active' : ''}`}>
                      <div className="row align-items-center g-4 g-lg-5 bdt-hero-slide">
                        
                        {/* Columna Izquierda: Información de la Gestión Diaria Aprobada */}
                        <div className="col-lg-6 text-center text-lg-start bdt-hero-text-col">
                          
                          {/* Badges de Verificación y Escuela */}
                          <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start gap-2 mb-3">
                            <span 
                              className="badge rounded-pill px-3 py-1.5 fw-bold shadow-xs d-inline-flex align-items-center gap-1.5"
                              style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.4)', fontSize: '0.78rem' }}
                            >
                              <i className="bi bi-patch-check-fill text-success"></i>
                              <span>Gestión Aprobada en Sistema</span>
                            </span>

                            <span 
                              className="badge rounded-pill px-3 py-1.5 fw-bold shadow-xs bg-white bg-opacity-15 text-white d-inline-flex align-items-center gap-1.5 border border-white border-opacity-25"
                              style={{ fontSize: '0.78rem' }}
                            >
                              <i className="bi bi-building text-info"></i>
                              <span>{nombreEscuela}</span>
                            </span>

                            <span 
                              className="badge rounded-pill px-2.5 py-1.5 fw-semibold bg-white bg-opacity-10 text-white-50 d-inline-flex align-items-center gap-1 border border-white border-opacity-15 extra-small"
                              style={{ fontSize: '0.75rem' }}
                            >
                              <i className="bi bi-calendar-event"></i>
                              <span>{rep.fecha_actividad}</span>
                            </span>
                          </div>

                          {/* Título de la Actividad */}
                          <div className="bdt-hero-title-top" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}>
                            {rep.actividad}
                          </div>

                          {/* Descripción de la Actividad */}
                          <p className="bdt-hero-desc mx-auto mx-lg-0 mb-3" style={{ fontSize: '0.98rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {rep.descripcion}
                          </p>

                          {/* Indicadores de Participación Escolar */}
                          {rep.participantes && (
                            <div className="d-inline-flex flex-wrap align-items-center gap-2.5 bg-white bg-opacity-10 p-2.5 px-3 rounded-4 border border-white border-opacity-20 shadow-xs mb-3.5 small text-white">
                              <span className="fw-bold text-white d-inline-flex align-items-center gap-1.5">
                                <i className="bi bi-people-fill text-warning"></i>
                                <span>{rep.participantes.total} Asistentes</span>
                              </span>
                              <span className="text-white-50">&bull;</span>
                              <span>{rep.participantes.estudiantes || 0} Estudiantes</span>
                              <span className="text-white-50">&bull;</span>
                              <span>{rep.participantes.docentes || 0} Docentes</span>
                              {rep.lugar_actividad && (
                                <>
                                  <span className="text-white-50">&bull;</span>
                                  <span className="text-white-50 text-truncate" style={{ maxWidth: '180px' }}>📍 {rep.lugar_actividad}</span>
                                </>
                              )}
                            </div>
                          )}

                          {/* Botones de Acción para la Gestión Diaria */}
                          <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start gap-3">
                            <button 
                              type="button" 
                              className="btn rounded-pill py-2.5 px-4 fs-6 shadow-sm text-white fw-bold d-inline-flex align-items-center gap-2 font-ruda"
                              style={{ backgroundColor: 'var(--bdt-purple-bicentenario)', border: 'none', boxShadow: '0 8px 24px rgba(146, 39, 143, 0.4)' }}
                              onClick={() => setReporteModal(rep)}
                            >
                              <i className="bi bi-file-earmark-text-fill"></i>
                              <span>📖 Ver Reporte Completo de Gestión</span>
                            </button>

                            <button 
                              type="button" 
                              className="btn btn-outline-light rounded-pill px-4 py-2.5 fw-bold d-inline-flex align-items-center gap-2 font-ruda shadow-xs"
                              style={{ fontSize: '0.86rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)' }}
                              onClick={() => {
                                if (rep.escuela_codigo === 'sb' || rep.escuela_codigo === 'lb') {
                                  cambiarEscuela(rep.escuela_codigo);
                                  navigate('/login');
                                } else {
                                  abrirSelectorEscuela();
                                }
                              }}
                            >
                              <i className="bi bi-box-arrow-in-right"></i>
                              <span>Ir al Plantel</span>
                            </button>
                          </div>

                        </div>

                        {/* Columna Derecha: Tarjeta Fotográfica de la Actividad Escolar */}
                        <div className="col-lg-6 text-center bdt-hero-visual-col">
                          <div 
                            className="bdt-hero-photo-card cursor-pointer"
                            onClick={() => setReporteModal(rep)}
                            title="Haz clic para ver la galería completa y detalles oficiales"
                          >
                            <img 
                              src={fotoBanner} 
                              alt={rep.actividad} 
                              className="bdt-hero-photo-img"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/img/gestion_diaria/reporte_ejemplo_collage.png';
                              }}
                            />
                            <div className="bdt-hero-photo-overlay d-flex align-items-end justify-content-between">
                              <div className="text-start">
                                <div className="extra-small fw-bold text-uppercase tracking-wider opacity-90 text-warning mb-0.5">
                                  {rep.fuente || 'Gestión Escolar Comprobada'}
                                </div>
                                <h6 className="fw-bold mb-0 text-white text-truncate" style={{ maxWidth: '380px' }}>
                                  {rep.actividad}
                                </h6>
                              </div>
                              <span className="badge bg-white text-dark rounded-pill px-3 py-1.5 shadow-sm fw-bold extra-small">
                                🔍 Ampliar
                              </span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}

              </div>
            </div>

            {/* Indicadores de Puntos Inferiores (Dots de Módulos APP y Gestión) */}
            {totalSlides > 1 && (
              <div className="bdt-hero-dots-container">
                <button
                  type="button"
                  className={`bdt-hero-dot ${slideActivo === 0 ? 'active' : ''}`}
                  onClick={() => setSlideActivo(0)}
                  title="Módulo APP: Control de Estudios & Boletines"
                >
                  <span>📊 Control de Estudios</span>
                </button>

                <button
                  type="button"
                  className={`bdt-hero-dot ${slideActivo === 1 ? 'active' : ''}`}
                  onClick={() => setSlideActivo(1)}
                  title="Módulo APP: Carnetización & Seguridad QR"
                >
                  <span>🪪 Carnetización QR</span>
                </button>

                <button
                  type="button"
                  className={`bdt-hero-dot ${slideActivo === 2 ? 'active' : ''}`}
                  onClick={() => setSlideActivo(2)}
                  title="Módulo APP: Ficha Estudiantil & Expediente"
                >
                  <span>📋 Ficha Estudiantil</span>
                </button>

                <button
                  type="button"
                  className={`bdt-hero-dot ${slideActivo === 3 ? 'active' : ''}`}
                  onClick={() => setSlideActivo(3)}
                  title="Módulo APP: Solicitud de Cupos & Admisiones"
                >
                  <span>🎒 Solicitud de Cupos</span>
                </button>

                <button
                  type="button"
                  className={`bdt-hero-dot ${slideActivo === 4 ? 'active' : ''}`}
                  onClick={() => setSlideActivo(4)}
                  title="Módulo APP: Transporte Escolar & Rutas"
                >
                  <span>🚌 Transporte Escolar</span>
                </button>

                {reportesGestion.map((rep, idx) => {
                  const num = idx + 5;
                  const etiqueta = rep.escuela_codigo === 'sb' 
                    ? `UE Santa Bárbara #${idx + 1}` 
                    : rep.escuela_codigo === 'lb' 
                      ? `UE Lib. Bolívar #${idx + 1}` 
                      : `Gestión #${idx + 1}`;
                  return (
                    <button
                      key={rep.id}
                      type="button"
                      className={`bdt-hero-dot ${slideActivo === num ? 'active' : ''}`}
                      onClick={() => setSlideActivo(num)}
                      title={rep.actividad}
                    >
                      <span>🏛️ {etiqueta}</span>
                    </button>
                  );
                })}
              </div>
            )}

          </div>
        </div>

        {/* ── CINTILLO / TICKER INFORMATIVO BDT ── */}
        <div className="bdt-ticker-strip">
          <div className="container d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary bg-opacity-35 text-white border border-info border-opacity-30 px-2 py-1 rounded-pill extra-small">
                ESTADO MONAGAS
              </span>
              <span>Miraflores, Municipio Punceres &bull; Hoy {fechaHoyTexto.charAt(0).toUpperCase() + fechaHoyTexto.slice(1)}</span>
            </div>
            <div className="d-flex align-items-center gap-3 ms-auto extra-small">
              <span><strong>Matrícula Activa:</strong> 1,333 Estudiantes Validados</span>
              <span className="d-none d-md-inline text-white-50">&bull;</span>
              <span className="d-none d-md-inline text-success fw-bold">● Sistema Operativo 100% en Línea</span>
            </div>
          </div>
        </div>

        {/* ── CINTA DE 5 TARJETAS DE ACCESOS RÁPIDOS BDT (WWW.BDT.COM.VE) ── */}
        <div className="bdt-quick-access-ribbon">
          <button 
            type="button" 
            className="bdt-quick-tile border-0" 
            onClick={abrirSelectorEscuela}
            title="Seleccionar mi escuela para ingresar al sistema"
          >
            <i className="bi bi-buildings-fill bdt-quick-tile-icon"></i>
            <span className="bdt-quick-tile-title">Ingreso a mi Escuela</span>
          </button>

          <a 
            href="#modulos" 
            className="bdt-quick-tile"
            title="Consulta y descarga de boletines de calificaciones"
          >
            <i className="bi bi-file-earmark-bar-graph-fill bdt-quick-tile-icon"></i>
            <span className="bdt-quick-tile-title">Boletines y Notas</span>
          </a>

          <a 
            href="#modulos" 
            className="bdt-quick-tile"
            title="Actualización de datos y ficha familiar escolar"
          >
            <i className="bi bi-person-lines-fill bdt-quick-tile-icon"></i>
            <span className="bdt-quick-tile-title">Actualización de Datos</span>
          </a>

          <a 
            href="#modulos" 
            className="bdt-quick-tile"
            title="Preinscripciones y solicitudes de cupos para nuevos ingresos"
          >
            <i className="bi bi-backpack-fill bdt-quick-tile-icon"></i>
            <span className="bdt-quick-tile-title">Solicitud de Cupos</span>
          </a>

          <a 
            href="#validador" 
            className="bdt-quick-tile"
            title="Verificación de autenticidad de constancias con código QR"
          >
            <i className="bi bi-qr-code-scan bdt-quick-tile-icon"></i>
            <span className="bdt-quick-tile-title">Validación QR</span>
          </a>
        </div>

      </section>

      {/* Ventana Modal de Detalle de Gestión Diaria Oficial */}
      <ModalDetalleReporteGestion 
        reporte={reporteModal} 
        onClose={() => setReporteModal(null)} 
      />

      {/* ── 6. SECCIÓN DE MATRÍCULA ESCOLAR EN VIVO & GARANTÍAS INSTITUCIONALES ── */}
      <section id="matricula" className="py-5 px-3 bg-white border-bottom">
        <div className="container py-2">
          
          {/* Encabezado y Conmutador de Plantel Escolar para Matrícula */}
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
            <div>
              <span className="badge bg-light text-primary border px-3 py-1.5 rounded-pill fw-bold text-uppercase small">
                <i className="bi bi-mortarboard-fill me-1 text-success"></i>
                Censo & Expedientes Validados
              </span>
              <h2 className="fw-bolder fs-2 text-dark mt-2 mb-1 font-ruda">
                Matrícula Estudiantil & Plantilla Escolar
              </h2>
              <p className="text-muted small m-0">
                Cifras oficiales de censo y expedientes validados en tiempo real por nivel formativo:
              </p>
            </div>

            {/* Selector interactivo de escuela activa para estadísticas en tiempo real */}
            <div className="d-flex align-items-center gap-2 p-1.5 bg-light rounded-pill border shadow-2xs flex-wrap">
              <span className="text-muted extra-small fw-bold px-2 d-none d-sm-inline" style={{ fontSize: '0.75rem' }}>
                Sede Activa:
              </span>
              <button
                type="button"
                onClick={() => setEscuelaStatsActiva('sb')}
                className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-2 bdt-school-switch-btn ${
                  escuelaStatsActiva === 'sb'
                    ? 'btn-success text-white shadow-xs active'
                    : 'text-secondary border-0 bg-transparent'
                }`}
                style={{ fontSize: '0.82rem' }}
                title="Ver matrícula oficial de UE Santa Bárbara"
              >
                <img 
                  src="/assets/img/logo_sb.png" 
                  alt="UE Santa Bárbara" 
                  style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                />
                <span>UE Santa Bárbara</span>
              </button>

              <button
                type="button"
                onClick={() => setEscuelaStatsActiva('lb')}
                className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-2 bdt-school-switch-btn ${
                  escuelaStatsActiva === 'lb'
                    ? 'btn-primary text-white shadow-xs active'
                    : 'text-secondary border-0 bg-transparent'
                }`}
                style={{ fontSize: '0.82rem' }}
                title="Ver matrícula oficial de UE Libertador Bolívar"
              >
                <img 
                  src="/assets/img/logo_lb.png" 
                  alt="UE Libertador Bolívar" 
                  style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                />
                <span>UE Libertador Bolívar</span>
              </button>
            </div>
          </div>

          {/* Barra Institucional Superior con Tipografía Ruda, Acento Escolar y Transición Fluida */}
          <div 
            key={`summary-matricula-${escuelaStatsActiva}`}
            className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4 p-3 px-3.5 rounded-4 bg-white border shadow-xs bdt-matricula-summary-bar"
            style={{
              borderLeft: `5px solid ${escuelaStatsActiva === 'sb' ? '#10b981' : '#1b2c6e'}`,
              borderColor: escuelaStatsActiva === 'sb' ? '#a7f3d0' : '#cbd5e1'
            }}
          >
            <div className="d-flex align-items-center gap-3 min-w-0">
              <div 
                className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-xs flex-shrink-0"
                style={{
                  width: '38px',
                  height: '38px',
                  background: escuelaStatsActiva === 'sb'
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                    : 'linear-gradient(135deg, #1b2c6e 0%, #2563eb 100%)'
                }}
              >
                <i className="bi bi-mortarboard-fill fs-5"></i>
              </div>
              <div className="min-w-0">
                <h6 className="font-ruda fw-black mb-0 text-dark" style={{ fontSize: '0.96rem' }}>
                  Matrícula Estudiantil & Plantilla por Niveles
                </h6>
                <span className="text-muted extra-small d-block text-truncate mt-0.5 font-body" style={{ fontSize: '0.74rem' }}>
                  Cifras oficiales de censo y expedientes validados de {escuelaStatsActiva === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar'}
                </span>
              </div>
            </div>

            {/* Badges de Cifras Totales */}
            <div className="d-flex align-items-center ms-auto flex-wrap gap-2">
              <span 
                className="badge bg-white text-dark border rounded-pill px-3 py-1.5 shadow-2xs font-ruda fw-bold d-inline-flex align-items-center"
                style={{ fontSize: '0.76rem', borderColor: escuelaStatsActiva === 'sb' ? '#a7f3d0' : '#cbd5e1' }}
              >
                <i className="bi bi-people-fill fs-6 me-2" style={{ color: escuelaStatsActiva === 'sb' ? '#10b981' : '#1b2c6e' }}></i>
                <span className="text-muted fw-normal me-1 font-body">Matrícula Total:</span>
                <strong style={{ color: escuelaStatsActiva === 'sb' ? '#10b981' : '#1b2c6e', fontSize: '0.88rem' }} className="me-1">
                  {cifrasMatricula.total}
                </strong>
                <span className="text-muted fw-normal font-body">estudiantes</span>
              </span>

              <span 
                className="badge rounded-pill text-white font-ruda fw-bold shadow-2xs px-3 py-1.5 d-inline-flex align-items-center"
                style={{ 
                  fontSize: '0.76rem',
                  background: escuelaStatsActiva === 'sb'
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                    : 'linear-gradient(135deg, #1b2c6e 0%, #2563eb 100%)'
                }}
              >
                <i className="bi bi-person-workspace fs-6 me-2"></i>
                <span className="fw-normal me-1 font-body">Plantilla:</span>
                <strong style={{ fontSize: '0.88rem' }} className="me-1">{cifrasMatricula.docentes}</strong>
                <span className="text-white text-opacity-90 fw-normal font-body">adscritos</span>
              </span>
            </div>
          </div>

          {/* Grid de 4 Tarjetas de Matrícula Adaptadas al Diseño y Tipografías del Portal con Animación Escalonada */}
          <div key={`grid-matricula-${escuelaStatsActiva}`} className="row g-3 mb-5 bdt-matricula-cards-grid">
            {/* Nivel 1: Educación Inicial */}
            <TarjetaNivelMatricula
              id="nivel-inicial"
              avatarSrc="/assets/img/avatar_inicial.png"
              titulo="Educación Inicial"
              subtitulo={escuelaStatsActiva === 'sb' ? "Maternal, II y III Grupo" : "II y III Grupo Preescolar"}
              badgeNivel="Inicial / Preescolar"
              iconoBadge="bi-balloon-heart-fill"
              valorFinal={cifrasMatricula.inicial}
              totalEstudiantes={cifrasMatricula.total}
              colorTema="#10b981"
              gradienteTema="linear-gradient(135deg, #10b981 0%, #059669 100%)"
              sombraTema="rgba(16, 185, 129, 0.25)"
              desglose={
                escuelaStatsActiva === 'sb' 
                  ? [
                      { label: 'Maternal', count: 6 },
                      { label: 'II Grupo', count: 10 },
                      { label: 'III Grupo', count: 10 }
                    ]
                  : [
                      { label: 'II Grupo', count: 5 },
                      { label: 'III Grupo', count: 5 }
                    ]
              }
            />

            {/* Nivel 2: Educación Primaria */}
            <TarjetaNivelMatricula
              id="nivel-primaria"
              avatarSrc="/assets/img/avatar_primaria.png"
              titulo="Educación Primaria"
              subtitulo="1° a 6° Grado Regular"
              badgeNivel="Básica Primaria"
              iconoBadge="bi-book-half"
              valorFinal={cifrasMatricula.primaria}
              totalEstudiantes={cifrasMatricula.total}
              colorTema="#1b2c6e"
              gradienteTema="linear-gradient(135deg, #1b2c6e 0%, #2563eb 100%)"
              sombraTema="rgba(27, 44, 110, 0.25)"
              desglose={
                escuelaStatsActiva === 'sb' 
                  ? [
                      { label: '1° a 3° Grado', count: 132 },
                      { label: '4° a 6° Grado', count: 128 }
                    ]
                  : [
                      { label: '1° a 3° Grado', count: 164 },
                      { label: '4° a 6° Grado', count: 164 }
                    ]
              }
            />

            {/* Nivel 3: Media General */}
            <TarjetaNivelMatricula
              id="nivel-media"
              avatarSrc="/assets/img/avatar_media.png"
              titulo="Media General"
              subtitulo="1° a 5° / 6° Año Técnico"
              badgeNivel="Bachillerato"
              iconoBadge="bi-mortarboard-fill"
              valorFinal={cifrasMatricula.media}
              totalEstudiantes={cifrasMatricula.total}
              colorTema="#92278f"
              gradienteTema="linear-gradient(135deg, #92278f 0%, #7c3aed 100%)"
              sombraTema="rgba(146, 39, 143, 0.25)"
              desglose={
                escuelaStatsActiva === 'sb' 
                  ? [
                      { label: '1° a 3° Año', count: 215 },
                      { label: '4° a 5° Año', count: 134 }
                    ]
                  : [
                      { label: '1° a 3° Año', count: 220 },
                      { label: '4° a 5° Año', count: 140 }
                    ]
              }
            />

            {/* Nivel 4: Personal Escolar */}
            <TarjetaNivelMatricula
              id="nivel-personal"
              avatarSrc="/assets/img/avatar_docente.png"
              titulo="Personal Escolar"
              subtitulo="Docentes & Directivos"
              badgeNivel="Plantilla Activa"
              iconoBadge="bi-person-workspace"
              valorFinal={cifrasMatricula.docentes}
              totalEstudiantes={cifrasMatricula.total}
              colorTema="#f26522"
              gradienteTema="linear-gradient(135deg, #f26522 0%, #ea580c 100%)"
              sombraTema="rgba(242, 101, 34, 0.25)"
              esPersonal={true}
              desglose={
                escuelaStatsActiva === 'sb' 
                  ? [
                      { label: 'Docentes', count: 32 },
                      { label: 'Directivos', count: 4 },
                      { label: 'Admin/Obreros', count: 13 }
                    ]
                  : [
                      { label: 'Docentes', count: 39 },
                      { label: 'Directivos', count: 5 },
                      { label: 'Admin/Obreros', count: 16 }
                    ]
              }
            />
          </div>

          {/* ── Subsección: 4 Garantías del Ecosistema Institucional (Estilo BDT) ── */}
          <div className="pt-4 border-top">
            <div className="text-center max-w-xl mx-auto mb-4">
              <span className="badge bg-light text-primary border px-3 py-1.5 rounded-pill fw-bold text-uppercase small">
                <i className="bi bi-shield-check me-1"></i>
                Pilares de Confianza
              </span>
              <h3 className="fw-bolder fs-3 text-dark mt-2 mb-2 font-ruda">
                4 Garantías del Ecosistema Institucional
              </h3>
              <p className="text-muted small">
                Estructura formal diseñada para la tranquilidad de directores, docentes y familias:
              </p>
            </div>

            <div className="row g-3">
              
              {/* Razón 1: Check Verde */}
              <div className="col-md-6 col-lg-3">
                <div className="p-3.5 bg-light rounded-4 border h-100 d-flex flex-column bdt-guarantee-card">
                  <div className="d-flex align-items-center gap-2.5 mb-2">
                    <div className="bdt-reason-check" style={{ backgroundColor: 'var(--bdt-green)' }}>
                      <i className="bi bi-check-lg"></i>
                    </div>
                    <h4 className="fs-6 fw-bold text-dark font-ruda m-0">Aislamiento RLS</h4>
                  </div>
                  <p className="text-muted small m-0" style={{ lineHeight: 1.5 }}>
                    Row Level Security en Supabase garantiza que cada escuela accede exclusivamente a sus propios registros de forma hermética.
                  </p>
                </div>
              </div>

              {/* Razón 2: Check Azul Cielo */}
              <div className="col-md-6 col-lg-3">
                <div className="p-3.5 bg-light rounded-4 border h-100 d-flex flex-column bdt-guarantee-card">
                  <div className="d-flex align-items-center gap-2.5 mb-2">
                    <div className="bdt-reason-check" style={{ backgroundColor: '#0ea5e9' }}>
                      <i className="bi bi-check-lg"></i>
                    </div>
                    <h4 className="fs-6 fw-bold text-dark font-ruda m-0">Normativa MPPE</h4>
                  </div>
                  <p className="text-muted small m-0" style={{ lineHeight: 1.5 }}>
                    Cumplimiento estricto con los formatos oficiales, PEIC y directrices del Ministerio de Educación y Colección Bicentenario.
                  </p>
                </div>
              </div>

              {/* Razón 3: Check Púrpura Bicentenario */}
              <div className="col-md-6 col-lg-3">
                <div className="p-3.5 bg-light rounded-4 border h-100 d-flex flex-column bdt-guarantee-card">
                  <div className="d-flex align-items-center gap-2.5 mb-2">
                    <div className="bdt-reason-check" style={{ backgroundColor: 'var(--bdt-purple-bicentenario)' }}>
                      <i className="bi bi-check-lg"></i>
                    </div>
                    <h4 className="fs-6 fw-bold text-dark font-ruda m-0">Google Drive Pro</h4>
                  </div>
                  <p className="text-muted small m-0" style={{ lineHeight: 1.5 }}>
                    Almacenamiento institucional para archivos pesados (hasta 5TB) a costo cero sin saturar la base de datos de Supabase.
                  </p>
                </div>
              </div>

              {/* Razón 4: Check Naranja de Acción */}
              <div className="col-md-6 col-lg-3">
                <div className="p-3.5 bg-light rounded-4 border h-100 d-flex flex-column bdt-guarantee-card">
                  <div className="d-flex align-items-center gap-2.5 mb-2">
                    <div className="bdt-reason-check" style={{ backgroundColor: 'var(--bdt-orange-action)' }}>
                      <i className="bi bi-check-lg"></i>
                    </div>
                    <h4 className="fs-6 fw-bold text-dark font-ruda m-0">Validación QR</h4>
                  </div>
                  <p className="text-muted small m-0" style={{ lineHeight: 1.5 }}>
                    Constancias de estudio, carnets y notas con código hash criptográfico inviolable verificable públicamente en línea.
                  </p>
                </div>
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
            
            {/* Módulo Popular 1: Boletines y Calificaciones con Icono 3D */}
            <div className="col-md-6 col-lg-4">
              <div 
                className="bdt-popular-card cursor-pointer"
                onClick={abrirSelectorEscuela}
                title="Consultar boletines académicos"
              >
                <div className="bdt-popular-icon" style={{ background: 'transparent' }}>
                  <img src="/icons3d/icono_academico_3d.png" alt="Boletines" className="bdt-module-icon-3d" />
                </div>
                <div>
                  <h4 className="fs-6 fw-bold m-0 font-ruda">Boletines y Resumen</h4>
                  <p className="text-muted extra-small m-0 mt-1" style={{ lineHeight: 1.45 }}>
                    Consulta de progreso académico, calificaciones por lapso, asistencias y observaciones docentes.
                  </p>
                </div>
              </div>
            </div>

            {/* Módulo Popular 2: Actualización de Datos con Icono 3D */}
            <div className="col-md-6 col-lg-4">
              <div 
                className="bdt-popular-card cursor-pointer"
                onClick={abrirSelectorEscuela}
                title="Actualizar datos escolares"
              >
                <div className="bdt-popular-icon" style={{ background: 'transparent' }}>
                  <img src="/icons3d/icono_estudiantil_3d.png" alt="Actualización" className="bdt-module-icon-3d" />
                </div>
                <div>
                  <h4 className="fs-6 fw-bold m-0 font-ruda">Actualización de Datos</h4>
                  <p className="text-muted extra-small m-0 mt-1" style={{ lineHeight: 1.45 }}>
                    Simplificación de trámites y expedientes familiares actualizados para la matrícula escolar.
                  </p>
                </div>
              </div>
            </div>

            {/* Módulo Popular 3: Solicitud de Cupos con Icono 3D */}
            <div className="col-md-6 col-lg-4">
              <div 
                className="bdt-popular-card cursor-pointer"
                onClick={abrirSelectorEscuela}
                title="Solicitar cupo escolar"
              >
                <div className="bdt-popular-icon" style={{ background: 'transparent' }}>
                  <img src="/icons3d/icono_admisiones_3d.png" alt="Cupos" className="bdt-module-icon-3d" />
                </div>
                <div>
                  <h4 className="fs-6 fw-bold m-0 font-ruda">Solicitud de Cupos</h4>
                  <p className="text-muted extra-small m-0 mt-1" style={{ lineHeight: 1.45 }}>
                    Recepción digital de requerimientos educativos según la disponibilidad de grupos, grado y año.
                  </p>
                </div>
              </div>
            </div>

            {/* Módulo Popular 4: Guías Pedagógicas & Colección Bicentenario con Icono 3D */}
            <div className="col-md-6 col-lg-4">
              <div 
                className="bdt-popular-card cursor-pointer"
                onClick={abrirSelectorEscuela}
                title="Descargar recursos educativos"
              >
                <div className="bdt-popular-icon" style={{ background: 'transparent' }}>
                  <img src="/icons3d/icono_disenos_3d.png" alt="Bicentenario" className="bdt-module-icon-3d" />
                </div>
                <div>
                  <h4 className="fs-6 fw-bold m-0 font-ruda">Colección Bicentenario</h4>
                  <p className="text-muted extra-small m-0 mt-1" style={{ lineHeight: 1.45 }}>
                    Guías pedagógicas digitales, libros de texto oficiales y banco de actividades formativas.
                  </p>
                </div>
              </div>
            </div>

            {/* Módulo Popular 5: Constancias y Carnetización con QR con Icono 3D */}
            <div className="col-md-6 col-lg-4">
              <a 
                href="#verificar"
                className="bdt-popular-card"
                title="Validar o tramitar constancias con QR"
              >
                <div className="bdt-popular-icon" style={{ background: 'transparent' }}>
                  <img src="/icons3d/icono_seguridad_3d.png" alt="Constancias QR" className="bdt-module-icon-3d" />
                </div>
                <div>
                  <h4 className="fs-6 fw-bold m-0 font-ruda">Constancias con Código QR</h4>
                  <p className="text-muted extra-small m-0 mt-1" style={{ lineHeight: 1.45 }}>
                    Emisión y validación criptográfica instantánea de constancias de estudio, conducta y notas.
                  </p>
                </div>
              </a>
            </div>

            {/* Módulo Popular 6: Rutas de Transporte Escolar con Icono 3D */}
            <div className="col-md-6 col-lg-4">
              <div 
                className="bdt-popular-card cursor-pointer"
                onClick={abrirSelectorEscuela}
                title="Consultar censo y rutas de transporte"
              >
                <div className="bdt-popular-icon" style={{ background: 'transparent' }}>
                  <img src="/icons3d/icono_transporte_3d.png" alt="Transporte" className="bdt-module-icon-3d" />
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
              <div className="bdt-verifier-3d-wrap">
                <div className="bdt-verifier-glow-circle"></div>
                <img 
                  src="/assets/img/seguridad_3d.png" 
                  alt="Validador de Constancias" 
                  className="bdt-verifier-3d-shield"
                  style={{ width: '165px', height: '165px', objectFit: 'contain' }}
                />
              </div>
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

      {/* ── 12. PIE DE PÁGINA CORPORATIVO (FOOTER BDT + CRÉDITOS RESCATADOS) ── */}
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
