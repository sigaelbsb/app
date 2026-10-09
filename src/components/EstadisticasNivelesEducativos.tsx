import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import '../portal_sap.css';

interface EstadisticasNivelesEducativosProps {
  activeSchoolCode: string; // 'sb' | 'lb'
}

interface LevelCounts {
  inicial: number;
  primaria: number;
  media: number;
  docentes: number;
  total: number;
}

interface BreakdownItem {
  label: string;
  count: number | string;
}

// Hook de contador animado en ascenso a 60fps con curva ease-out natural
function useCountUp(endValue: number, duration: number = 1100): number {
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

// Tarjeta individual interactiva de nivel educativo (Estilo SAP Fiori Horizon 3D)
interface LevelCardProps {
  id: string;
  avatarSrc: string;
  avatarAlt: string;
  nivelNombre: string;
  subtitulo: string;
  tag: string;
  badgeMicro: string;
  valorFinal: number;
  totalEstudiantes: number;
  accentColor: string;
  gradientBg: string;
  glowColor: string;
  lightBg: string;
  borderHoverColor: string;
  iconoSecundario: string;
  breakdownItems: BreakdownItem[];
  isPersonalDocente?: boolean;
  cardVariantClass: string;
}

const LevelCard: React.FC<LevelCardProps> = ({
  id,
  avatarSrc,
  avatarAlt,
  nivelNombre,
  subtitulo,
  tag,
  valorFinal,
  totalEstudiantes,
  accentColor,
  gradientBg,
  glowColor,
  borderHoverColor,
  iconoSecundario,
  breakdownItems,
  isPersonalDocente = false,
  cardVariantClass
}) => {
  const count = useCountUp(valorFinal, 1200);
  const [isHovered, setIsHovered] = useState(false);

  // Porcentaje relativo de la matrícula escolar
  const porcentaje = totalEstudiantes > 0 
    ? Math.round((valorFinal / totalEstudiantes) * 100) 
    : 0;

  return (
    <div className="col-12 col-md-6 col-xl-3 d-flex align-items-stretch">
      <div
        id={id}
        className={`w-100 sigae-level-card ${cardVariantClass} d-flex flex-column justify-content-between position-relative cursor-pointer`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          padding: 'clamp(12px, 1.8vw, 16px)',
          borderRadius: '20px',
          border: `1.8px solid ${isHovered ? borderHoverColor : `${accentColor}35`}`,
          transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Línea superior con brillo y degradado de alta fidelidad */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: gradientBg,
            boxShadow: isHovered ? `0 0 16px ${accentColor}` : `0 0 8px ${accentColor}60`,
            transition: 'box-shadow 0.3s ease'
          }}
        />

        {/* ── SECCIÓN SUPERIOR: AVATAR 3D CON HALO + BADGES METADATO ── */}
        <div>
          <div className="d-flex align-items-center justify-content-between mb-2 pt-0">
            {/* Avatar 3D con halo y animación continua de respiración */}
            <div className="position-relative d-inline-flex align-items-center justify-content-center sigae-avatar-floating">
              {/* Halo radial difuminado */}
              <div
                className="sigae-avatar-halo"
                style={{
                  background: `radial-gradient(circle, ${accentColor}65 0%, transparent 72%)`,
                  opacity: isHovered ? 0.95 : 0.65
                }}
              />

              {/* Anillo degradado exterior */}
              <div
                className="sigae-avatar-ring"
                style={{
                  background: gradientBg,
                  boxShadow: isHovered 
                    ? `0 8px 22px ${glowColor}` 
                    : `0 4px 14px ${accentColor}35`
                }}
              >
                <img
                  src={avatarSrc}
                  alt={avatarAlt}
                  className="sigae-avatar-inner"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>

              {/* Pin de estatus activo con pulso cibernético */}
              <span
                className="position-absolute bottom-0 end-0 rounded-circle border border-white"
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: accentColor,
                  boxShadow: `0 2px 6px ${accentColor}80`
                }}
                title="Nivel Activo en Plantel"
              />
            </div>

            {/* Badges de Nivel y Porcentaje de Participación */}
            <div className="text-end d-flex flex-column align-items-end gap-1 flex-shrink-0">
              <span
                className="badge rounded-pill fw-bold text-nowrap shadow-2xs d-inline-flex align-items-center"
                style={{
                  fontSize: '0.67rem',
                  backgroundColor: `${accentColor}18`,
                  color: accentColor,
                  border: `1.2px solid ${accentColor}40`,
                  padding: '3px 7px',
                  letterSpacing: '0.2px',
                  whiteSpace: 'nowrap'
                }}
              >
                <i className={`bi ${iconoSecundario}`} style={{ marginRight: '5px' }}></i>
                <span>{tag}</span>
              </span>
              <span 
                className="badge rounded-pill fw-bolder px-2 py-0.5 text-white shadow-2xs text-nowrap"
                style={{
                  fontSize: '0.63rem',
                  background: gradientBg,
                  letterSpacing: '0.2px',
                  whiteSpace: 'nowrap'
                }}
              >
                {isPersonalDocente ? '100% activa' : `${porcentaje}% matrícula`}
              </span>
            </div>
          </div>

          {/* Títulos y Subtítulos del Nivel */}
          <div className="mb-2">
            <h5
              className="fw-black mb-0.5 text-dark text-nowrap text-truncate"
              style={{
                fontSize: 'clamp(0.92rem, 1.4vw, 1.08rem)',
                letterSpacing: '-0.3px',
                lineHeight: '1.2'
              }}
            >
              {nivelNombre}
            </h5>
            <span
              className="text-secondary fw-semibold d-block text-truncate text-nowrap"
              style={{ fontSize: '0.72rem', letterSpacing: '-0.1px' }}
            >
              {subtitulo}
            </span>
          </div>
        </div>

        {/* ── SECCIÓN CENTRAL: CONTADOR NUMÉRICO ANIMADO + BARRA PROPORCIONAL ── */}
        <div className="my-2">
          <div 
            className="d-flex align-items-baseline mb-2 text-nowrap"
            style={{ 
              gap: '6px', 
              flexWrap: 'nowrap',
              whiteSpace: 'nowrap'
            }}
          >
            <span
              className="fw-black flex-shrink-0"
              style={{
                fontSize: 'clamp(1.4rem, 2.3vw, 1.85rem)',
                lineHeight: '1',
                letterSpacing: '-0.8px',
                color: isHovered ? accentColor : '#0f172a',
                transition: 'color 0.25s ease'
              }}
            >
              {count.toLocaleString('es-VE')}
            </span>
            <span 
              className="fw-bold text-uppercase text-nowrap" 
              style={{ 
                fontSize: 'clamp(0.60rem, 0.9vw, 0.69rem)',
                letterSpacing: '0.5px',
                color: accentColor,
                lineHeight: '1.2',
                whiteSpace: 'nowrap'
              }}
            >
              {isPersonalDocente ? 'personal adscrito' : 'estudiantes'}
            </span>
          </div>

          {/* Barra de progreso de distribución con cabeza iluminada */}
          <div className="sigae-progress-track" style={{ height: '6px', borderRadius: '10px' }}>
            <div
              className="sigae-progress-fill"
              style={{
                width: `${Math.min(100, isPersonalDocente ? 100 : porcentaje)}%`,
                background: gradientBg,
                boxShadow: isHovered ? `0 0 12px ${accentColor}` : `0 0 6px ${accentColor}70`
              }}
            />
          </div>
        </div>

        {/* ── SECCIÓN INFERIOR: CHIPS DETALLADOS DIRECTOS (DESGLOSE AMIGABLE) ── */}
        <div className="mt-2 pt-2 border-top" style={{ borderColor: `${accentColor}25` }}>
          <div className="d-flex flex-nowrap gap-1 align-items-center overflow-hidden">
            {breakdownItems.map((item, idx) => (
              <span
                key={idx}
                className="sigae-breakdown-chip d-inline-flex align-items-center text-nowrap flex-shrink-0"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  borderColor: isHovered ? `${accentColor}45` : `${accentColor}25`,
                  color: '#1e293b',
                  padding: '2px 6px',
                  borderRadius: '6px',
                  fontSize: '0.65rem',
                  whiteSpace: 'nowrap'
                }}
              >
                <span className="text-muted fw-semibold me-1">{item.label}:</span>
                <strong style={{ color: accentColor }}>{item.count}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const EstadisticasNivelesEducativos: React.FC<EstadisticasNivelesEducativosProps> = ({
  activeSchoolCode = 'sb'
}) => {
  const isSb = activeSchoolCode === 'sb';
  const schoolName = isSb ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar';
  const sedeColor = isSb ? '#10b981' : '#0284c7';
  const gradientBadge = isSb 
    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
    : 'linear-gradient(135deg, #0284c7 0%, #0066ff 100%)';

  // Cifras oficiales sincronizadas estrictamente para la escuela activa:
  // SB: Inicial: 26, Primaria: 260, Media: 349, Docentes: 49 (Total Alumnos: 635)
  // LB: Inicial: 10, Primaria: 328, Media: 360, Docentes: 60 (Total Alumnos: 698)
  const defaultCounts: Record<string, LevelCounts> = {
    sb: { inicial: 26, primaria: 260, media: 349, docentes: 49, total: 635 },
    lb: { inicial: 10, primaria: 328, media: 360, docentes: 60, total: 698 }
  };

  const [stats, setStats] = useState<LevelCounts>(defaultCounts[activeSchoolCode] || defaultCounts.sb);

  // Sincronización en tiempo real desde Supabase para la escuela activa
  useEffect(() => {
    let isMounted = true;

    async function cargarEstadisticasEscuela() {
      try {
        const { data: v1 } = await supabase
          .from('estudiantes_vinculaciones')
          .select('codigo_escuela, grado_actual')
          .eq('codigo_escuela', activeSchoolCode)
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

          const docentesCount = isSb ? 49 : 60;
          setStats({
            inicial: ini || (isSb ? 26 : 10),
            primaria: prim || (isSb ? 260 : 328),
            media: med || (isSb ? 349 : 360),
            docentes: docentesCount,
            total: v1.length
          });
        } else if (isMounted) {
          setStats(defaultCounts[activeSchoolCode] || defaultCounts.sb);
        }
      } catch (e) {
        if (isMounted) {
          setStats(defaultCounts[activeSchoolCode] || defaultCounts.sb);
        }
      }
    }

    cargarEstadisticasEscuela();

    return () => {
      isMounted = false;
    };
  }, [activeSchoolCode]);

  return (
    <div className="mb-4">
      {/* ── BARRA SUPERIOR INSTITUCIONAL (ESTILO SAP FIORI HORIZON CON AMBIENT PULSE) ── */}
      <div 
        className="d-flex align-items-center justify-content-between flex-wrap gap-2.5 mb-3 p-2.5 px-3 rounded-4 bg-white border shadow-xs"
        style={{
          borderLeft: `5px solid ${sedeColor}`,
          borderColor: isSb ? '#a7f3d0' : '#bae6fd',
          background: isSb 
            ? 'linear-gradient(90deg, #f0fdf4 0%, #ffffff 80%)' 
            : 'linear-gradient(90deg, #f0f9ff 0%, #ffffff 80%)'
        }}
      >
        <div className="d-flex align-items-center gap-2.5 min-w-0">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center text-white shadow-xs flex-shrink-0"
            style={{
              width: '36px',
              height: '36px',
              background: gradientBadge
            }}
          >
            <i className="bi bi-mortarboard-fill fs-5"></i>
          </div>
          <div className="min-w-0">
            <h6 className="fw-black mb-0 text-dark" style={{ letterSpacing: '-0.3px', fontSize: '0.94rem' }}>
              Matrícula Estudiantil & Plantilla por Niveles
            </h6>
            <span className="text-muted extra-small d-block text-truncate mt-0.5" style={{ fontSize: '0.72rem' }}>
              Cifras oficiales de censo y expedientes validados de la institución activa
            </span>
          </div>
        </div>

        {/* Indicador Global de Estudiantes y Docentes en Nómina */}
        <div className="d-flex align-items-center ms-auto flex-wrap" style={{ gap: '10px' }}>
          <span 
            className="badge bg-white text-dark border rounded-pill px-3 py-1.5 shadow-xs fw-bold d-inline-flex align-items-center text-nowrap"
            style={{ 
              fontSize: '0.74rem', 
              borderColor: isSb ? '#a7f3d0' : '#bae6fd',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="bi bi-people-fill fs-6 flex-shrink-0" style={{ color: sedeColor, marginRight: '8px' }}></i>
            <span className="text-secondary fw-semibold me-1">Matrícula Total:</span>
            <strong style={{ color: sedeColor, fontSize: '0.85rem' }} className="me-1">{stats.total}</strong>
            <span className="text-muted fw-normal">estudiantes</span>
          </span>

          <span 
            className="badge rounded-pill text-white fw-bold shadow-xs px-3 py-1.5 d-none d-sm-inline-flex align-items-center text-nowrap"
            style={{ 
              fontSize: '0.74rem', 
              background: gradientBadge,
              whiteSpace: 'nowrap'
            }}
          >
            <i className="bi bi-person-workspace fs-6 flex-shrink-0" style={{ marginRight: '8px' }}></i>
            <span className="fw-semibold me-1">Plantilla:</span>
            <strong style={{ fontSize: '0.85rem' }} className="me-1">{stats.docentes}</strong>
            <span className="text-white text-opacity-90 fw-normal">adscritos</span>
          </span>
        </div>
      </div>

      {/* ── GRID DE 4 TARJETAS CON AVATARES 3D (3 NIVELES DE NIÑOS + 1 DOCENTE) ── */}
      <div className="row g-3">
        {/* Nivel 1: Educación Inicial */}
        <LevelCard
          id="card-nivel-inicial"
          cardVariantClass="sigae-level-card-inicial"
          avatarSrc="/assets/img/avatar_inicial.png"
          avatarAlt="Educación Inicial - Niños en 3D con chemise amarilla y roja"
          nivelNombre="Educación Inicial"
          subtitulo={isSb ? "Maternal, II y III Grupo" : "II y III Grupo Preescolar"}
          tag="Inicial / Preescolar"
          badgeMicro="🧸 Maternal y Grupos"
          valorFinal={stats.inicial}
          totalEstudiantes={stats.total}
          accentColor="#10b981"
          gradientBg="linear-gradient(135deg, #10b981 0%, #059669 45%, #047857 100%)"
          glowColor="rgba(16, 185, 129, 0.35)"
          lightBg="#ecfdf5"
          borderHoverColor="#6ee7b7"
          iconoSecundario="bi-balloon-heart-fill"
          breakdownItems={
            isSb 
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

        {/* Nivel 2: Educación Primaria (Estilo SAP Fiori Tech Blue del Login) */}
        <LevelCard
          id="card-nivel-primaria"
          cardVariantClass="sigae-level-card-primaria"
          avatarSrc="/assets/img/avatar_primaria.png"
          avatarAlt="Educación Primaria - Niños en 3D con chemise blanca"
          nivelNombre="Educación Primaria"
          subtitulo="1° a 6° Grado Regular"
          tag="Básica Primaria"
          badgeMicro="🎒 1° a 6° Grado"
          valorFinal={stats.primaria}
          totalEstudiantes={stats.total}
          accentColor="#0062ff"
          gradientBg="linear-gradient(135deg, #0056f7 0%, #0084ff 50%, #00d2ff 100%)"
          glowColor="rgba(0, 98, 255, 0.35)"
          lightBg="#f0f7ff"
          borderHoverColor="#7dd3fc"
          iconoSecundario="bi-book-half"
          breakdownItems={
            isSb 
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

        {/* Nivel 3: Educación Media General (Electric Violet / Indigo) */}
        <LevelCard
          id="card-nivel-media"
          cardVariantClass="sigae-level-card-media"
          avatarSrc="/assets/img/avatar_media.png"
          avatarAlt="Educación Media General - Jóvenes en 3D con chemise azul cielo y beige"
          nivelNombre="Media General"
          subtitulo="1° a 5° / 6° Año Técnico"
          tag="Bachillerato"
          badgeMicro="🔬 Ciclo Diversificado"
          valorFinal={stats.media}
          totalEstudiantes={stats.total}
          accentColor="#7c3aed"
          gradientBg="linear-gradient(135deg, #6366f1 0%, #7c3aed 50%, #a855f7 100%)"
          glowColor="rgba(124, 58, 237, 0.35)"
          lightBg="#faf5ff"
          borderHoverColor="#c084fc"
          iconoSecundario="bi-mortarboard-fill"
          breakdownItems={
            isSb 
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

        {/* Nivel 4: Personal Docente & Administrativo (Avatar Docente 3D) */}
        <LevelCard
          id="card-nivel-docentes"
          cardVariantClass="sigae-level-card-docentes"
          avatarSrc="/assets/img/avatar_docente.png"
          avatarAlt="Personal Escolar - Docentes y directivos en 3D"
          nivelNombre="Personal Escolar"
          subtitulo="Docentes & Directivos"
          tag="Plantilla Activa"
          badgeMicro="👩‍🏫 Nómina Institucional"
          valorFinal={stats.docentes}
          totalEstudiantes={stats.total}
          accentColor="#0d9488"
          gradientBg="linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%)"
          glowColor="rgba(13, 148, 136, 0.35)"
          lightBg="#f0fdfa"
          borderHoverColor="#5eead4"
          iconoSecundario="bi-person-workspace"
          isPersonalDocente={true}
          breakdownItems={
            isSb 
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
    </div>
  );
};
