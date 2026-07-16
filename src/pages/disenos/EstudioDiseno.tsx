import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';

export type TipoHerramienta = 'certificados' | 'flyers' | 'invitaciones' | 'tapas' | 'comunicados' | 'cumpleanos' | 'galeria';

interface EstudioDisenoProps {
  herramientaInicial?: TipoHerramienta;
}

interface PlantillaDiseno {
  id: string;
  tipo: TipoHerramienta;
  nombre: string;
  descripcion: string;
  icono: string;
  badge: string;
  colorAcento: string;
  colorFondo: string;
  estiloBorde: 'ornamental-dorado' | 'moderno-azul' | 'elegante-verde' | 'minimalista' | 'institucional-rojo';
  titulo: string;
  subtitulo: string;
  destinatario: string;
  cuerpo: string;
  pieFirma: string;
  cargoFirma: string;
  fecha: string;
  ocultarQR?: boolean;
}

const PLANTILLAS_PREDEFINIDAS: PlantillaDiseno[] = [
  // CERTIFICADOS
  {
    id: 'cert-merito',
    tipo: 'certificados',
    nombre: 'Honor al Mérito Académico',
    descripcion: 'Reconocimiento oficial a estudiantes destacados con excelente rendimiento pedagógico.',
    icono: 'bi-patch-check-fill',
    badge: 'Académico VIP',
    colorAcento: '#b45309', // Dorado/Bronce elegante
    colorFondo: '#fffbeb',
    estiloBorde: 'ornamental-dorado',
    titulo: 'CERTIFICADO DE HONOR AL MÉRITO',
    subtitulo: 'La Dirección de la Institución otorga el presente reconocimiento a:',
    destinatario: 'CARLOS ANDRÉS MENDOZA SILVA',
    cuerpo: 'Por su sobresaliente desempeño académico, ejemplar conducta ciudadana y constante espíritu de superación durante el Año Escolar 2025-2026, siendo orgullo y motivación para toda nuestra comunidad educativa.',
    pieFirma: 'MSc. María Elena Rojas',
    cargoFirma: 'Dirección Académica del Plantel',
    fecha: 'Caracas, 15 de Julio de 2026'
  },
  {
    id: 'cert-promocion',
    tipo: 'certificados',
    nombre: 'Diploma de Promoción Escolar',
    descripcion: 'Certificado de paso de grado o culminación satisfactoria del nivel educativo.',
    icono: 'bi-mortarboard-fill',
    badge: 'Fin de Curso',
    colorAcento: '#1d4ed8', // Azul Real
    colorFondo: '#eff6ff',
    estiloBorde: 'moderno-azul',
    titulo: 'DIPLOMA DE PROMOCIÓN ACADÉMICA',
    subtitulo: 'Hace constar legal y formalmente que el (la) estudiante:',
    destinatario: 'VALERIA SOFÍA RODRÍGUEZ PÉREZ',
    cuerpo: 'Ha cumplido a cabalidad con todos los requisitos curriculares y pedagógicos exigidos por el Ministerio del Poder Popular para la Educación, siendo PROMOVIDO(A) satisfactoriamente al Grado Superior inmediato.',
    pieFirma: 'Prof. José Gregorio Bastidas',
    cargoFirma: 'Coordinación de Control de Estudios',
    fecha: 'Caracas, 22 de Julio de 2026'
  },
  {
    id: 'cert-docente',
    tipo: 'certificados',
    nombre: 'Reconocimiento a Excelencia Docente',
    descripcion: 'Diploma especial de gratitud al personal docente por labor ininterrumpida y vocación.',
    icono: 'bi-award-fill',
    badge: 'Personal Docente',
    colorAcento: '#15803d', // Verde Esmeralda
    colorFondo: '#f0fdf4',
    estiloBorde: 'elegante-verde',
    titulo: 'RECONOCIMIENTO A LA VOCACIÓN DOCENTE',
    subtitulo: 'El Consejo Directivo de la Institución rinde merecido homenaje a:',
    destinatario: 'LIC. ANA TERESA CORDERO HERNÁNDEZ',
    cuerpo: 'En testimonio de gratitud por su innegable compromiso pedagógico, ética profesional e incansable dedicación en la formación integral de nuestros niños, niñas y jóvenes durante el periodo lectivo.',
    pieFirma: 'Dr. Fernando Salazar',
    cargoFirma: 'Dirección General de Instituciones',
    fecha: 'Caracas, 15 de Mayo de 2026'
  },

  // FLYERS
  {
    id: 'flyer-inscripciones',
    tipo: 'flyers',
    nombre: 'Volante: Proceso de Inscripciones 2026-2027',
    descripcion: 'Flyer promocional para compartir en WhatsApp y redes sobre apertura de cupos.',
    icono: 'bi-megaphone-fill',
    badge: 'Cupos Abiertos',
    colorAcento: '#2563eb',
    colorFondo: '#ffffff',
    estiloBorde: 'moderno-azul',
    titulo: '¡PROCESO DE ADMISIONES ABIERTO!',
    subtitulo: 'Asegura el futuro de tus hijos en nuestra comunidad escolar',
    destinatario: 'AÑO ESCOLAR 2026 - 2027',
    cuerpo: 'Ofrecemos Educación Inicial y Primaria con excelencia pedagógica, computación, deportes, inglés formativo y orientación familiar permanente. ¡Reserva tu cupo hoy mismo en nuestra plataforma digital SIGAE o en secretaría del plantel!',
    pieFirma: 'Horario de Atención: 8:00 AM a 1:00 PM',
    cargoFirma: 'Información: (0212) 555-0199 / WhatsApp Escolar',
    fecha: 'Inscripciones desde el 1° de Julio'
  },
  {
    id: 'flyer-deporte',
    tipo: 'flyers',
    nombre: 'Volante: Gran Olimpiada Escolar',
    descripcion: 'Flyer deportivo para invitar a juegos intercolegiales y actividades físicas.',
    icono: 'bi-trophy-fill',
    badge: 'Deporte & Salud',
    colorAcento: '#dc2626',
    colorFondo: '#fef2f2',
    estiloBorde: 'institucional-rojo',
    titulo: 'GRAN OLIMPIADA DEPORTIVA ESCOLAR',
    subtitulo: 'Unión, disciplina, fraternidad y juego limpio',
    destinatario: 'COPA INSTITUCIONAL SIGAE 2026',
    cuerpo: 'Te invitamos a disfrutar de emocionantes competencias en Fútbol Sala, Voleibol, Atletismo y Ajedrez. Ven con toda tu familia a apoyar a nuestros atletas escolares en una jornada llena de alegría y sano esparcimiento.',
    pieFirma: 'Lugar: Canchas Centrales de la Institución',
    cargoFirma: 'Coordinación de Educación Física y Deportes',
    fecha: 'Sábado, 28 de Noviembre de 2026 - 8:30 AM'
  },

  // INVITACIONES
  {
    id: 'inv-acto-grado',
    tipo: 'invitaciones',
    nombre: 'Invitación VIP: Acto de Promoción',
    descripcion: 'Tarjeta formal de invitación para padres y representantes a la graduación.',
    icono: 'bi-envelope-paper-heart-fill',
    badge: 'Gala Escolar',
    colorAcento: '#7c3aed', // Púrpura Elegante
    colorFondo: '#faf5ff',
    estiloBorde: 'ornamental-dorado',
    titulo: 'INVITACIÓN AL ACTO DE PROMOCIÓN',
    subtitulo: 'El Personal Directivo, Docente y Administrativo se complace en invitar a la Familia:',
    destinatario: 'MENDOZA SILVA Y REPRESENTANTES',
    cuerpo: 'A la Solemne Ceremonia de Promoción de los Estudiantes del Grado Académico Superior. Será un honor contar con su distinguida presencia para celebrar el esfuerzo, la perseverancia y el éxito de nuestros jóvenes estudiantes.',
    pieFirma: 'Teatro Auditorio Principal de la Institución',
    cargoFirma: 'Se agradece puntualidad y traje formal (RSVP)',
    fecha: 'Viernes, 24 de Julio de 2026 - 10:00 AM'
  },
  {
    id: 'inv-asamblea',
    tipo: 'invitaciones',
    nombre: 'Invitación: Asamblea General de Padres',
    descripcion: 'Convocatoria oficial para elección del Comité de Padres y asuntos pedagógicos.',
    icono: 'bi-people-fill',
    badge: 'Participación',
    colorAcento: '#0284c7',
    colorFondo: '#f0f9ff',
    estiloBorde: 'moderno-azul',
    titulo: 'ASAMBLEA GENERAL DE PADRES Y REPRESENTANTES',
    subtitulo: 'Juntos construimos la escuela que queremos para nuestros hijos',
    destinatario: 'COMUNIDAD EDUCATIVA GENERAL',
    cuerpo: 'Por medio de la presente, convocamos con carácter de importancia a todos los representantes para tratar puntos clave sobre el Proyecto Educativo Integral Comunitario (PEIC), informe de gestión escolar y rendición de cuentas del período.',
    pieFirma: 'Asistencia Obligatoria por Grupo Familiar',
    cargoFirma: 'Consejo Directivo y Comité Escolar',
    fecha: 'Miércoles, 14 de Octubre de 2026 - 7:30 AM'
  },

  // TAPAS Y PORTADAS
  {
    id: 'tapa-expediente',
    tipo: 'tapas',
    nombre: 'Portada Oficial: Expediente Estudiantil',
    descripcion: 'Tapa para identificación de carpetas físicas en el archivo de Control de Estudios.',
    icono: 'bi-journal-album',
    badge: 'Archivo Escolar',
    colorAcento: '#1e3a8a',
    colorFondo: '#ffffff',
    estiloBorde: 'moderno-azul',
    titulo: 'EXPEDIENTE ACADÉMICO ESTUDIANTIL',
    subtitulo: 'REPÚBLICA BOLIVARIANA DE VENEZUELA - MINISTERIO DE EDUCACIÓN',
    destinatario: 'APELLIDOS Y NOMBRES DEL ESTUDIANTE:',
    cuerpo: 'CARLOS ANDRÉS MENDOZA SILVA\n\nCÉDULA O CÓDIGO ESCOLAR: V-32.145.889\n\nGRADO / SECCIÓN: 5° Grado - Sección "A"\n\nREPRESENTANTE LEGAL: LUIS MENDOZA (V-14.225.887)\n\nTELÉFONO DE CONTACTO: (0414) 112-2334',
    pieFirma: 'AÑO ESCOLAR: 2025 - 2026',
    cargoFirma: 'ARCHIVADO EN CONTROL DE ESTUDIOS',
    fecha: 'REGISTRO INSTITUCIONAL SIGAE'
  },
  {
    id: 'tapa-proyecto',
    tipo: 'tapas',
    nombre: 'Tapa: Proyecto Pedagógico de Aula (PPA)',
    descripcion: 'Portada para presentación de proyectos de investigación científica o humanística.',
    icono: 'bi-book-half',
    badge: 'Pedagogía',
    colorAcento: '#059669',
    colorFondo: '#f0fdf4',
    estiloBorde: 'elegante-verde',
    titulo: 'PROYECTO PEDAGÓGICO DE AULA',
    subtitulo: 'Investigación, Ciencia, Tecnología e Innovación Escolar',
    destinatario: 'TÍTULO DEL PROYECTO:',
    cuerpo: '"EL HUERTO ESCOLAR SUSTENTABLE COMO HERRAMIENTA PARA LA VIDA Y EL CUIDADO AMBIENTAL"\n\nAUTOR(ES): Equipo de Trabajo Científico 4° Grado\n\nDOCENTE ASESOR: Lic. Ana Teresa Cordero\n\nÁREA CURRICULAR: Ciencias Naturales y Sociedad',
    pieFirma: 'ESCUELA DE EDUCACIÓN PRIMARIA',
    cargoFirma: 'PRESENTACIÓN FINAL ACADÉMICA',
    fecha: 'Julio 2026'
  },

  // COMUNICADOS
  {
    id: 'com-circular',
    tipo: 'comunicados',
    nombre: 'Circular Directiva Oficial (Membretada)',
    descripcion: 'Comunicado formal de dirección con numeración y formato institucional MPPE.',
    icono: 'bi-file-earmark-text-fill',
    badge: 'Oficial Directivo',
    colorAcento: '#0f172a',
    colorFondo: '#ffffff',
    estiloBorde: 'minimalista',
    titulo: 'CIRCULAR OFICIAL N° 042-2026',
    subtitulo: 'ASUNTO: NORMATIVA DE UNIFORME ESCOLAR Y PUNTUALIDAD',
    destinatario: 'PARA: TODO EL PERSONAL DOCENTE, PADRES Y REPRESENTANTES',
    cuerpo: 'Estimada Comunidad Educativa:\n\nNos dirigimos a ustedes para recordar el estricto cumplimiento del Reglamento Interno de Convivencia Escolar. El ingreso de los estudiantes a las aulas inicia puntualmente a las 7:00 AM (turno mañana) y 1:00 PM (turno tarde). Asimismo, se solicita velar por el uso correcto del uniforme escolar según el día que corresponda.\n\nAgradecemos su valiosa colaboración en el fortalecimiento de los hábitos de responsabilidad y orden de nuestros estudiantes.',
    pieFirma: 'MSc. María Elena Rojas',
    cargoFirma: 'DIRECCIÓN DEL PLANTEL',
    fecha: 'Caracas, 05 de Febrero de 2026'
  },
  {
    id: 'com-autorizacion',
    tipo: 'comunicados',
    nombre: 'Autorización de Salida / Permiso Especial',
    descripcion: 'Plantilla de autorización formal para paseos, excursiones o retiros anticipados.',
    icono: 'bi-shield-check',
    badge: 'Seguridad Legal',
    colorAcento: '#b91c1c',
    colorFondo: '#fff5f5',
    estiloBorde: 'institucional-rojo',
    titulo: 'AUTORIZACIÓN FORMAL DE SALIDA PEDAGÓGICA',
    subtitulo: 'PERMISO LEGAL DEL PADRE, MADRE O REPRESENTANTE',
    destinatario: 'DATOS DEL ESTUDIANTE AUTORIZADO:',
    cuerpo: 'Yo, titular de la Cédula de Identidad N° V-_____________, en mi condición de Representante Legal, autorizo formalmente a mi representado(a): ______________________________, cursante del Grado/Sección: ________, para asistir a la visita guiada al Museo de Ciencias los días programados en el cronograma escolar.\n\nDeclaro conocer el itinerario, normas de seguridad y acompañamiento docente del plantel.',
    pieFirma: 'FIRMA DEL REPRESENTANTE: ___________________',
    cargoFirma: 'CÉDULA Y HUELLA DACTILAR',
    fecha: 'Fecha de emisión: ____ / ____ / 2026'
  },

  // CUMPLEAÑOS
  {
    id: 'cumple-estudiante',
    tipo: 'cumpleanos',
    nombre: 'Tarjeta de Feliz Cumpleaños Estudiantil',
    descripcion: 'Diseño alegre y colorido para felicitar a los estudiantes de la institución en su día.',
    icono: 'bi-balloon-heart-fill',
    badge: 'Cumpleaños Estudiante',
    colorAcento: '#ec4899',
    colorFondo: '#fdf2f8',
    estiloBorde: 'ornamental-dorado',
    titulo: '¡FELIZ CUMPLEAÑOS!',
    subtitulo: 'HOY CELEBRAMOS CON ALEGRÍA Y CARIÑO LA VIDA DE:',
    destinatario: 'CARLOS ALBERTO MENDOZA PÉREZ',
    cuerpo: '¡De parte de la Dirección, todo el Equipo Docente, Compañeros y Administrativo te deseamos un maravilloso cumpleaños!\n\nQue este nuevo año de vida esté repleto de sonrisas, grandes aprendizajes, salud infinita y momentos inolvidables en nuestra gran familia escolar. ¡Sigue brillando y alcanzando todas tus metas con esa hermosa energía que te caracteriza!',
    pieFirma: 'MSc. María Elena Rojas / Lcda. Carmen Ruiz',
    cargoFirma: 'DIRECCIÓN Y DOCENTE DE AULA',
    fecha: 'Caracas, 12 de Julio de 2026'
  },
  {
    id: 'cumple-personal',
    tipo: 'cumpleanos',
    nombre: 'Felicitación Institucional de Cumpleaños (Personal)',
    descripcion: 'Reconocimiento y felicitación formal para docentes, administrativos y personal obrero en su natalicio.',
    icono: 'bi-gift-fill',
    badge: 'Cumpleaños Personal',
    colorAcento: '#8b5cf6',
    colorFondo: '#f5f3ff',
    estiloBorde: 'elegante-verde',
    titulo: '¡FELICIDADES EN SU DÍA ESPECIAL!',
    subtitulo: 'RECONOCIMIENTO Y CELEBRACIÓN DE NATALICIO DE NUESTRO VALIOSO PERSONAL:',
    destinatario: 'PROF. ROBERTO ANTONIO GÓMEZ',
    cuerpo: 'En nombre de toda la Comunidad Educativa, le extendemos nuestras más cálidas y sinceras felicitaciones con motivo de su cumpleaños.\n\nAgradecemos profundamente su inmensa vocación, compromiso pedagógico y la huella positiva que deja cada día en la formación de nuestros jóvenes. ¡Que la salud, el bienestar y el éxito acompañen siempre su camino profesional y personal!',
    pieFirma: 'MSc. María Elena Rojas',
    cargoFirma: 'DIRECCIÓN Y COMUNIDAD ESCOLAR',
    fecha: 'Caracas, 12 de Julio de 2026'
  }
];

export const EstudioDiseno: React.FC<EstudioDisenoProps> = ({ herramientaInicial = 'galeria' }) => {
  const [herramienta, setHerramienta] = useState<TipoHerramienta>(herramientaInicial);
  const [plantillaActiva, setPlantillaActiva] = useState<PlantillaDiseno>(PLANTILLAS_PREDEFINIDAS[0]);
  const [escuelaSeleccionada, setEscuelaSeleccionada] = useState<'sb' | 'lb'>(
    (localStorage.getItem('sigae_escuela_codigo') as 'sb' | 'lb') || 'sb'
  );
  const [zoomLienzo, setZoomLienzo] = useState<number>(90);
  const [guardandoImg, setGuardandoImg] = useState(false);
  const [disenosGuardados, setDisenosGuardados] = useState<PlantillaDiseno[]>([]);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const lienzoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHerramienta(herramientaInicial);
    if (herramientaInicial !== 'galeria') {
      const encontradas = PLANTILLAS_PREDEFINIDAS.filter(p => p.tipo === herramientaInicial);
      if (encontradas.length > 0) {
        setPlantillaActiva(encontradas[0]);
      }
    }
  }, [herramientaInicial]);

  useEffect(() => {
    const stored = localStorage.getItem('sigae_disenos_guardados');
    if (stored) {
      try {
        setDisenosGuardados(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleEscuelaChange = (esc: 'sb' | 'lb') => {
    setEscuelaSeleccionada(esc);
  };

  const infoEscuela = escuelaSeleccionada === 'sb'
    ? {
        nombre: 'UNIDAD EDUCATIVA SANTA BÁRBARA',
        codigoDea: 'DEA: S0152D0105 - RIF: J-30124587-0',
        direccion: 'Av. Principal de Santa Bárbara, Caracas, Distrito Capital',
        logo: '/assets/img/logo-sb.png',
        color: '#FF8D00'
      }
    : {
        nombre: 'UNIDAD EDUCATIVA LIBERTADOR BOLÍVAR',
        codigoDea: 'DEA: S0244D0102 - RIF: J-40258741-9',
        direccion: 'Calle Bolívar, Sector Centro, Libertador, Caracas',
        logo: '/assets/img/logo-lb.png',
        color: '#0066FF'
      };

  const seleccionarPlantilla = (p: PlantillaDiseno) => {
    setPlantillaActiva({ ...p });
    setHerramienta(p.tipo);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCampoChange = (campo: keyof PlantillaDiseno, valor: string | boolean) => {
    setPlantillaActiva(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleGuardarEnGaleria = () => {
    const nuevoDiseno: PlantillaDiseno = {
      ...plantillaActiva,
      id: `custom-${Date.now()}`,
      nombre: `${plantillaActiva.nombre} (Guardado)`
    };
    const nuevaLista = [nuevoDiseno, ...disenosGuardados];
    setDisenosGuardados(nuevaLista);
    localStorage.setItem('sigae_disenos_guardados', JSON.stringify(nuevaLista));
    setMensajeExito('¡Diseño guardado exitosamente en tu galería local del estudio!');
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const handleDescargarPNG = async () => {
    if (!lienzoRef.current) return;
    setGuardandoImg(true);
    try {
      const canvas = await html2canvas(lienzoRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: plantillaActiva.colorFondo || '#ffffff'
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `SIGAE_${plantillaActiva.tipo.toUpperCase()}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error('Error generando imagen PNG:', e);
      alert('Hubo un inconveniente al exportar la imagen. Verifica tu navegador.');
    } finally {
      setGuardandoImg(false);
    }
  };

  const handleImprimirPDF = () => {
    window.print();
  };

  const eliminarDisenoGuardado = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtrada = disenosGuardados.filter(d => d.id !== id);
    setDisenosGuardados(filtrada);
    localStorage.setItem('sigae_disenos_guardados', JSON.stringify(filtrada));
  };

  const plantillasFiltradas = herramienta === 'galeria'
    ? PLANTILLAS_PREDEFINIDAS
    : PLANTILLAS_PREDEFINIDAS.filter(p => p.tipo === herramienta);

  return (
    <div className="container-fluid py-4 animate__animated animate__fadeIn">
      {/* ESTILO DE IMPRESIÓN Y MARCOS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #lienzo-impresion, #lienzo-impresion * {
            visibility: visible;
          }
          #lienzo-impresion {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            transform: scale(1) !important;
          }
          .ocultar-impresion {
            display: none !important;
          }
        }

        .lienzo-borde-ornamental-dorado {
          border: 14px double #b45309;
          box-shadow: inset 0 0 0 6px #fef3c7, inset 0 0 0 8px #d97706;
        }
        .lienzo-borde-moderno-azul {
          border: 8px solid #2563eb;
          box-shadow: inset 0 0 0 4px #eff6ff, inset 0 0 0 6px #60a5fa;
        }
        .lienzo-borde-elegante-verde {
          border: 10px solid #15803d;
          box-shadow: inset 0 0 0 5px #f0fdf4, inset 0 0 0 7px #4ade80;
        }
        .lienzo-borde-institucional-rojo {
          border: 10px solid #dc2626;
          box-shadow: inset 0 0 0 4px #fef2f2, inset 0 0 0 6px #f87171;
        }
        .lienzo-borde-minimalista {
          border: 2px solid #334155;
          box-shadow: inset 0 0 0 1px #94a3b8;
        }

        .tab-diseno-btn {
          transition: all 0.2s ease;
          border-radius: 12px;
          font-weight: 600;
        }
        .tab-diseno-btn:hover {
          transform: translateY(-2px);
        }
      `}</style>

      {/* ENCABEZADO MAESTRO */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #4c0519 100%)', color: 'white' }}>
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-white bg-opacity-10 p-3 rounded-4 border border-white border-opacity-25 d-flex align-items-center justify-content-center shadow-lg" style={{ width: '64px', height: '64px' }}>
              <i className="bi bi-palette-fill fs-2 text-warning"></i>
            </div>
            <div>
              <span className="badge rounded-pill bg-warning text-dark fw-bolder px-3 py-1 mb-2">
                <i className="bi bi-stars me-1"></i> Módulo Creativo SIGAE
              </span>
              <h2 className="fw-bolder mb-1">Estudio de Diseño Gráfico e Impresión</h2>
              <p className="mb-0 text-light text-opacity-75 small">
                Crea, personaliza, exporta y archiva certificados académicos, flyers promocionales, invitaciones oficiales, tapas de expedientes y comunicados directivos.
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="bg-dark bg-opacity-50 px-3 py-2 rounded-3 border border-white border-opacity-15 d-flex align-items-center gap-2">
              <span className="small text-light">Membrete:</span>
              <button
                type="button"
                onClick={() => handleEscuelaChange('sb')}
                className={`btn btn-sm fw-bold rounded-pill px-3 ${escuelaSeleccionada === 'sb' ? 'btn-warning text-dark shadow' : 'btn-outline-light'}`}
              >
                UE Santa Bárbara
              </button>
              <button
                type="button"
                onClick={() => handleEscuelaChange('lb')}
                className={`btn btn-sm fw-bold rounded-pill px-3 ${escuelaSeleccionada === 'lb' ? 'btn-info text-dark shadow' : 'btn-outline-light'}`}
              >
                UE Libertador Bolívar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MENÚ DE HERRAMIENTAS (TABS) */}
      <div className="row g-2 mb-4 ocultar-impresion">
        <div className="col-6 col-md-4 col-xl">
          <button
            type="button"
            onClick={() => setHerramienta('galeria')}
            className={`btn w-100 py-3 tab-diseno-btn d-flex flex-column align-items-center justify-content-center shadow-sm ${herramienta === 'galeria' ? 'btn-dark text-warning border-warning border-2' : 'btn-white bg-white border text-dark'}`}
          >
            <i className="bi bi-grid-1x2-fill fs-4 mb-1"></i>
            <span>Galería de Plantillas</span>
          </button>
        </div>
        <div className="col-6 col-md-4 col-xl">
          <button
            type="button"
            onClick={() => {
              setHerramienta('certificados');
              seleccionarPlantilla(PLANTILLAS_PREDEFINIDAS.find(p => p.tipo === 'certificados') || PLANTILLAS_PREDEFINIDAS[0]);
            }}
            className={`btn w-100 py-3 tab-diseno-btn d-flex flex-column align-items-center justify-content-center shadow-sm ${herramienta === 'certificados' ? 'btn-dark text-warning border-warning border-2' : 'btn-white bg-white border text-dark'}`}
          >
            <i className="bi bi-patch-check-fill fs-4 text-warning mb-1"></i>
            <span>Certificados y Diplomas</span>
          </button>
        </div>
        <div className="col-6 col-md-4 col-xl">
          <button
            type="button"
            onClick={() => {
              setHerramienta('flyers');
              seleccionarPlantilla(PLANTILLAS_PREDEFINIDAS.find(p => p.tipo === 'flyers') || PLANTILLAS_PREDEFINIDAS[3]);
            }}
            className={`btn w-100 py-3 tab-diseno-btn d-flex flex-column align-items-center justify-content-center shadow-sm ${herramienta === 'flyers' ? 'btn-dark text-warning border-warning border-2' : 'btn-white bg-white border text-dark'}`}
          >
            <i className="bi bi-file-earmark-image-fill fs-4 text-primary mb-1"></i>
            <span>Flyers y Volantes</span>
          </button>
        </div>
        <div className="col-6 col-md-4 col-xl">
          <button
            type="button"
            onClick={() => {
              setHerramienta('invitaciones');
              seleccionarPlantilla(PLANTILLAS_PREDEFINIDAS.find(p => p.tipo === 'invitaciones') || PLANTILLAS_PREDEFINIDAS[5]);
            }}
            className={`btn w-100 py-3 tab-diseno-btn d-flex flex-column align-items-center justify-content-center shadow-sm ${herramienta === 'invitaciones' ? 'btn-dark text-warning border-warning border-2' : 'btn-white bg-white border text-dark'}`}
          >
            <i className="bi bi-envelope-paper-heart-fill fs-4 text-danger mb-1"></i>
            <span>Invitaciones y RSVP</span>
          </button>
        </div>
        <div className="col-6 col-md-4 col-xl">
          <button
            type="button"
            onClick={() => {
              setHerramienta('tapas');
              seleccionarPlantilla(PLANTILLAS_PREDEFINIDAS.find(p => p.tipo === 'tapas') || PLANTILLAS_PREDEFINIDAS[7]);
            }}
            className={`btn w-100 py-3 tab-diseno-btn d-flex flex-column align-items-center justify-content-center shadow-sm ${herramienta === 'tapas' ? 'btn-dark text-warning border-warning border-2' : 'btn-white bg-white border text-dark'}`}
          >
            <i className="bi bi-journal-album fs-4 text-success mb-1"></i>
            <span>Tapas y Portadas</span>
          </button>
        </div>
        <div className="col-6 col-md-4 col-xl">
          <button
            type="button"
            onClick={() => {
              setHerramienta('comunicados');
              seleccionarPlantilla(PLANTILLAS_PREDEFINIDAS.find(p => p.tipo === 'comunicados') || PLANTILLAS_PREDEFINIDAS[9]);
            }}
            className={`btn w-100 py-3 tab-diseno-btn d-flex flex-column align-items-center justify-content-center shadow-sm ${herramienta === 'comunicados' ? 'btn-dark text-warning border-warning border-2' : 'btn-white bg-white border text-dark'}`}
          >
            <i className="bi bi-megaphone-fill fs-4 text-info mb-1"></i>
            <span>Comunicados y Avisos</span>
          </button>
        </div>
        <div className="col-6 col-md-4 col-xl">
          <button
            type="button"
            onClick={() => {
              setHerramienta('cumpleanos');
              seleccionarPlantilla(PLANTILLAS_PREDEFINIDAS.find(p => p.tipo === 'cumpleanos') || PLANTILLAS_PREDEFINIDAS[11]);
            }}
            className={`btn w-100 py-3 tab-diseno-btn d-flex flex-column align-items-center justify-content-center shadow-sm ${herramienta === 'cumpleanos' ? 'btn-dark text-warning border-warning border-2' : 'btn-white bg-white border text-dark'}`}
          >
            <i className="bi bi-balloon-heart-fill fs-4 text-pink mb-1" style={{ color: '#ec4899' }}></i>
            <span>Cumpleaños y Felicitaciones</span>
          </button>
        </div>
      </div>

      {mensajeExito && (
        <div className="alert alert-success d-flex align-items-center shadow-sm rounded-4 mb-4 animate__animated animate__fadeInDown" role="alert">
          <i className="bi bi-check-circle-fill fs-4 me-3"></i>
          <div>{mensajeExito}</div>
        </div>
      )}

      {/* VISTA 1: GALERÍA DE PLANTILLAS PREDEFINIDAS Y GUARDADAS */}
      {herramienta === 'galeria' ? (
        <div className="animate__animated animate__fadeIn">
          {/* SECCIÓN DE DISEÑOS GUARDADOS POR EL USUARIO */}
          {disenosGuardados.length > 0 && (
            <div className="mb-5">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bolder mb-0 text-dark">
                  <i className="bi bi-folder-check me-2 text-primary"></i>Mis Diseños Guardados en el Estudio
                </h4>
                <span className="badge bg-primary rounded-pill">{disenosGuardados.length} archivos en galería</span>
              </div>
              <div className="row g-4">
                {disenosGuardados.map(diseno => (
                  <div className="col-12 col-md-6 col-xl-4" key={diseno.id}>
                    <div className="card border-0 shadow-sm rounded-4 h-100 position-relative overflow-hidden hover-efecto">
                      <div className="card-header border-0 p-3 d-flex justify-content-between align-items-center" style={{ background: diseno.colorFondo, borderBottom: `3px solid ${diseno.colorAcento}` }}>
                        <span className="badge rounded-pill fw-bold text-white px-3 py-1" style={{ background: diseno.colorAcento }}>
                          {diseno.tipo.toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => eliminarDisenoGuardado(diseno.id, e)}
                          className="btn btn-sm btn-outline-danger rounded-circle p-1"
                          title="Eliminar de mi galería"
                        >
                          <i className="bi bi-trash3-fill"></i>
                        </button>
                      </div>
                      <div className="card-body p-4 d-flex flex-column justify-content-between">
                        <div>
                          <h5 className="fw-bolder text-dark mb-2">{diseno.nombre}</h5>
                          <p className="text-muted small mb-3">{diseno.titulo}</p>
                          <div className="p-3 bg-light rounded-3 border mb-3 small text-truncate" style={{ maxHeight: '65px' }}>
                            {diseno.destinatario} - {diseno.cuerpo}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => seleccionarPlantilla(diseno)}
                          className="btn btn-dark w-100 rounded-pill fw-bold"
                        >
                          <i className="bi bi-pencil-square me-2"></i>Cargar y Editar en Estudio
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <hr className="my-5" />
            </div>
          )}

          {/* SECCIÓN DE PLANTILLAS OFICIALES */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="fw-bolder mb-1 text-dark">
                <i className="bi bi-stack me-2 text-warning"></i>Catálogo Oficial de Plantillas y Modelos
              </h4>
              <p className="text-muted small mb-0">Selecciona cualquier modelo oficial para abrir el editor en vivo y personalizarlo.</p>
            </div>
          </div>

          <div className="row g-4">
            {plantillasFiltradas.map(plantilla => (
              <div className="col-12 col-md-6 col-xl-4" key={plantilla.id}>
                <div className="card border-0 shadow-sm rounded-4 h-100 position-relative overflow-hidden hover-efecto d-flex flex-column justify-content-between">
                  <div className="p-4 rounded-top-4 d-flex justify-content-between align-items-start" style={{ background: plantilla.colorFondo, borderBottom: `4px solid ${plantilla.colorAcento}` }}>
                    <div>
                      <span className="badge rounded-pill text-white px-3 py-1 mb-2 fw-bold" style={{ background: plantilla.colorAcento }}>
                        {plantilla.badge}
                      </span>
                      <h5 className="fw-bolder text-dark mb-1">{plantilla.nombre}</h5>
                      <p className="small text-muted mb-0">{plantilla.descripcion}</p>
                    </div>
                    <div className="p-3 rounded-circle shadow-sm bg-white text-center" style={{ width: '54px', height: '54px' }}>
                      <i className={`bi ${plantilla.icono} fs-3`} style={{ color: plantilla.colorAcento }}></i>
                    </div>
                  </div>

                  <div className="card-body p-4 bg-white d-flex flex-column justify-content-between">
                    <div className="mb-4">
                      <div className="small fw-bold text-muted text-uppercase mb-1">Muestra de Estructura:</div>
                      <div className="p-3 rounded-3 border bg-light text-dark small">
                        <div className="fw-bolder text-truncate mb-1" style={{ color: plantilla.colorAcento }}>{plantilla.titulo}</div>
                        <div className="text-muted text-truncate mb-2">{plantilla.destinatario}</div>
                        <div className="text-secondary text-opacity-75" style={{ fontSize: '0.78rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {plantilla.cuerpo}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => seleccionarPlantilla(plantilla)}
                      className="btn w-100 rounded-pill fw-bold text-white shadow-sm py-2 d-flex align-items-center justify-content-center gap-2"
                      style={{ background: plantilla.colorAcento }}
                    >
                      <i className="bi bi-brush-fill"></i> Personalizar y Exportar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* VISTA 2: ESTUDIO DE EDICIÓN EN VIVO Y LIENZO (LIVE CANVAS) */
        <div className="row g-4 animate__animated animate__fadeIn">
          {/* PANEL IZQUIERDO: CONTROLES Y PARÁMETROS DEL DISEÑO (40%) */}
          <div className="col-12 col-xl-5 ocultar-impresion">
            <div className="card border-0 shadow-sm rounded-4 p-4 sticky-xl-top" style={{ top: '20px', zIndex: 10 }}>
              <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge rounded-pill px-3 py-1 text-white fw-bold" style={{ background: plantillaActiva.colorAcento }}>
                    {plantillaActiva.tipo.toUpperCase()}
                  </span>
                  <h5 className="fw-bolder mb-0 text-dark">Panel de Personalización</h5>
                </div>
                <button
                  type="button"
                  onClick={() => setHerramienta('galeria')}
                  className="btn btn-sm btn-outline-secondary rounded-pill"
                >
                  <i className="bi bi-arrow-left me-1"></i>Volver a Galería
                </button>
              </div>

              {/* SELECTOR RÁPIDO DE PRESETS DE LA HERRAMIENTA ACTIVA */}
              <div className="mb-4">
                <label className="form-label small fw-bold text-muted text-uppercase">Cambiar de Modelo ({plantillaActiva.tipo}):</label>
                <select
                  className="form-select border-primary fw-semibold"
                  value={plantillaActiva.id}
                  onChange={(e) => {
                    const sel = PLANTILLAS_PREDEFINIDAS.find(p => p.id === e.target.value);
                    if (sel) setPlantillaActiva({ ...sel });
                  }}
                >
                  {PLANTILLAS_PREDEFINIDAS.filter(p => p.tipo === plantillaActiva.tipo).map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              {/* EDICIÓN DE CAMPOS DEL DISEÑO */}
              <div className="d-flex flex-column gap-3 mb-4" style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '6px' }}>
                <div>
                  <label className="form-label small fw-bold text-dark">Título Principal del Documento:</label>
                  <input
                    type="text"
                    className="form-control fw-bold"
                    value={plantillaActiva.titulo}
                    onChange={(e) => handleCampoChange('titulo', e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label small fw-bold text-dark">Subtítulo / Introducción:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={plantillaActiva.subtitulo}
                    onChange={(e) => handleCampoChange('subtitulo', e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label small fw-bold text-dark">Destinatario / Estudiante / Título Central:</label>
                  <input
                    type="text"
                    className="form-control fw-bolder text-primary"
                    value={plantillaActiva.destinatario}
                    onChange={(e) => handleCampoChange('destinatario', e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label small fw-bold text-dark">Cuerpo de Texto / Párrafo / Contenido:</label>
                  <textarea
                    rows={5}
                    className="form-control"
                    value={plantillaActiva.cuerpo}
                    onChange={(e) => handleCampoChange('cuerpo', e.target.value)}
                  ></textarea>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label small fw-bold text-dark">Firmante / Pie de Firma:</label>
                    <input
                      type="text"
                      className="form-control small"
                      value={plantillaActiva.pieFirma}
                      onChange={(e) => handleCampoChange('pieFirma', e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-bold text-dark">Cargo / Departamento:</label>
                    <input
                      type="text"
                      className="form-control small"
                      value={plantillaActiva.cargoFirma}
                      onChange={(e) => handleCampoChange('cargoFirma', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label small fw-bold text-dark">Fecha / Lugar de Emisión:</label>
                  <input
                    type="text"
                    className="form-control small"
                    value={plantillaActiva.fecha}
                    onChange={(e) => handleCampoChange('fecha', e.target.value)}
                  />
                </div>

                {/* OPCIONES VISUALES DEL LIENZO */}
                <div className="p-3 bg-light rounded-4 border mt-2">
                  <h6 className="small fw-bolder text-uppercase mb-3"><i className="bi bi-sliders me-2"></i>Estilos Visuales del Lienzo</h6>
                  
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small text-muted">Estilo de Borde:</label>
                      <select
                        className="form-select form-select-sm"
                        value={plantillaActiva.estiloBorde}
                        onChange={(e) => handleCampoChange('estiloBorde', e.target.value as any)}
                      >
                        <option value="ornamental-dorado">Ornamental Dorado (Diplomas)</option>
                        <option value="moderno-azul">Moderno Azul Institucional</option>
                        <option value="elegante-verde">Elegante Verde Académico</option>
                        <option value="institucional-rojo">Institucional Rojo/Vibrante</option>
                        <option value="minimalista">Minimalista Fino (Comunicados)</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small text-muted">Color de Acento Principal:</label>
                      <input
                        type="color"
                        className="form-control form-control-color w-100"
                        value={plantillaActiva.colorAcento}
                        onChange={(e) => handleCampoChange('colorAcento', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-check form-switch small">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="check-qr"
                      checked={!plantillaActiva.ocultarQR}
                      onChange={(e) => handleCampoChange('ocultarQR', !e.target.checked)}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="check-qr">
                      Incluir Sello y Código QR de Verificación Digital SIGAE
                    </label>
                  </div>
                </div>
              </div>

              {/* ACCIONES DE EXPORTACIÓN Y GUARDADO */}
              <div className="d-flex flex-column gap-2 pt-3 border-top">
                <button
                  type="button"
                  onClick={handleDescargarPNG}
                  disabled={guardandoImg}
                  className="btn btn-success rounded-pill fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                >
                  {guardandoImg ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Generando Imagen HD...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-image-fill fs-5"></i> Descargar Imagen PNG Alta Calidad
                    </>
                  )}
                </button>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    onClick={handleImprimirPDF}
                    className="btn btn-outline-primary rounded-pill fw-bold w-50 py-2 d-flex align-items-center justify-content-center gap-1"
                  >
                    <i className="bi bi-printer-fill fs-5"></i> Imprimir / PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleGuardarEnGaleria}
                    className="btn btn-dark rounded-pill fw-bold w-50 py-2 d-flex align-items-center justify-content-center gap-1"
                  >
                    <i className="bi bi-folder-plus fs-5 text-warning"></i> Guardar Proyecto
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PANEL DERECHO: PREVISUALIZACIÓN EN VIVO (LIVE CANVAS - 60%) */}
          <div className="col-12 col-xl-7">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-light d-flex flex-column align-items-center">
              {/* BARRA SUPERIOR DEL LIENZO */}
              <div className="w-100 d-flex justify-content-between align-items-center mb-4 ocultar-impresion">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-dark text-warning rounded-pill px-3 py-1">
                    <i className="bi bi-eye-fill me-1"></i> Previsualización en Tiempo Real
                  </span>
                  <span className="small text-muted">Lienzo adaptado para impresión A4 / Carta</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="small text-muted">Zoom:</span>
                  <button
                    type="button"
                    onClick={() => setZoomLienzo(z => Math.max(60, z - 10))}
                    className="btn btn-sm btn-outline-secondary rounded-circle px-2 py-0"
                    title="Reducir zoom"
                  >
                    -
                  </button>
                  <span className="badge bg-white text-dark border px-2 py-1">{zoomLienzo}%</span>
                  <button
                    type="button"
                    onClick={() => setZoomLienzo(z => Math.min(130, z + 10))}
                    className="btn btn-sm btn-outline-secondary rounded-circle px-2 py-0"
                    title="Aumentar zoom"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* CONTENEDOR CENTRAL DEL LIENZO */}
              <div className="w-100 overflow-auto d-flex justify-content-center py-2" style={{ minHeight: '680px' }}>
                <div
                  style={{
                    transform: `scale(${zoomLienzo / 100})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  {/* AQUÍ ESTÁ EL LIENZO QUE SE EXPORTA E IMPRIME */}
                  <div
                    ref={lienzoRef}
                    id="lienzo-impresion"
                    className={`bg-white p-5 position-relative d-flex flex-column justify-content-between shadow-lg lienzo-borde-${plantillaActiva.estiloBorde}`}
                    style={{
                      width: '780px',
                      minHeight: plantillaActiva.tipo === 'certificados' || plantillaActiva.tipo === 'tapas' ? '580px' : '980px',
                      background: plantillaActiva.colorFondo,
                      color: '#1e293b'
                    }}
                  >
                    {/* MARCA DE AGUA INSTITUCIONAL DE FONDO */}
                    <div
                      className="position-absolute top-50 start-50 translate-middle pointer-events-none"
                      style={{
                        opacity: 0.05,
                        zIndex: 0,
                        width: '420px',
                        height: '420px',
                        backgroundImage: `url(${infoEscuela.logo})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center'
                      }}
                    ></div>

                    {/* ENCABEZADO OFICIAL DEL DOCUMENTO */}
                    <div className="d-flex justify-content-between align-items-center border-bottom pb-4 mb-4 position-relative" style={{ zIndex: 1, borderColor: `${plantillaActiva.colorAcento}40` }}>
                      <div className="d-flex align-items-center gap-3">
                        <img src={infoEscuela.logo} alt="Escudo" style={{ width: '82px', height: '82px', objectFit: 'contain' }} />
                        <div>
                          <div className="small fw-bold text-uppercase text-muted" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                            REPÚBLICA BOLIVARIANA DE VENEZUELA<br />
                            MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN
                          </div>
                          <h6 className="fw-bolder mb-0 text-dark mt-1" style={{ fontSize: '1.05rem', color: plantillaActiva.colorAcento }}>
                            {infoEscuela.nombre}
                          </h6>
                          <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                            {infoEscuela.codigoDea}
                          </div>
                        </div>
                      </div>

                      <div className="text-end">
                        <span className="badge rounded-pill text-white px-3 py-2 fw-bold shadow-sm" style={{ background: plantillaActiva.colorAcento, fontSize: '0.85rem' }}>
                          SIGAE OFICIAL
                        </span>
                        <div className="small text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                          {plantillaActiva.fecha}
                        </div>
                      </div>
                    </div>

                    {/* CUERPO CENTRAL DEL DISEÑO */}
                    <div className="my-auto py-4 text-center position-relative" style={{ zIndex: 1 }}>
                      <h3
                        className="fw-bolder text-uppercase mb-3"
                        style={{
                          color: plantillaActiva.colorAcento,
                          fontSize: plantillaActiva.tipo === 'certificados' ? '2.1rem' : '1.75rem',
                          letterSpacing: '1px',
                          textShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                      >
                        {plantillaActiva.titulo}
                      </h3>

                      <p className="text-muted fs-6 mb-4 px-4">
                        {plantillaActiva.subtitulo}
                      </p>

                      <div
                        className="p-4 my-4 rounded-4 shadow-sm mx-auto"
                        style={{
                          maxWidth: '680px',
                          background: 'rgba(255, 255, 255, 0.85)',
                          border: `2px dashed ${plantillaActiva.colorAcento}60`
                        }}
                      >
                        <h2 className="fw-bolder mb-0 text-dark" style={{ fontSize: '1.85rem', letterSpacing: '0.5px' }}>
                          {plantillaActiva.destinatario}
                        </h2>
                      </div>

                      <div className="px-5 my-4 mx-auto" style={{ maxWidth: '700px' }}>
                        <p
                          className="fs-6 text-dark"
                          style={{
                            lineHeight: '1.8',
                            whiteSpace: 'pre-line',
                            textAlign: plantillaActiva.tipo === 'tapas' || plantillaActiva.tipo === 'comunicados' ? 'left' : 'center'
                          }}
                        >
                          {plantillaActiva.cuerpo}
                        </p>
                      </div>
                    </div>

                    {/* PIE DE FIRMA Y SELLOS OFICIALES */}
                    <div className="pt-5 mt-4 border-top position-relative d-flex justify-content-between align-items-end" style={{ zIndex: 1, borderColor: `${plantillaActiva.colorAcento}30` }}>
                      <div className="text-center mx-auto" style={{ minWidth: '260px' }}>
                        <div className="border-bottom border-dark mb-2 mx-auto" style={{ width: '220px' }}></div>
                        <h6 className="fw-bolder mb-0 text-dark">{plantillaActiva.pieFirma}</h6>
                        <span className="small text-muted d-block" style={{ fontSize: '0.8rem' }}>{plantillaActiva.cargoFirma}</span>
                        <span className="small fw-bold mt-1 d-inline-block" style={{ fontSize: '0.72rem', color: plantillaActiva.colorAcento }}>
                          {infoEscuela.nombre}
                        </span>
                      </div>

                      {!plantillaActiva.ocultarQR && (
                        <div className="d-flex align-items-center gap-2 p-2 rounded-3 bg-light border ms-auto">
                          <div className="bg-white p-1 border rounded">
                            <i className="bi bi-qr-code fs-2 text-dark"></i>
                          </div>
                          <div className="text-start" style={{ fontSize: '0.68rem', lineHeight: '1.2' }}>
                            <strong className="d-block text-dark">VALIDADO EN SIGAE</strong>
                            <span className="text-muted">Código de Autenticidad</span><br />
                            <code style={{ fontSize: '0.65rem' }}>#{plantillaActiva.id.toUpperCase()}-2026</code>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default EstudioDiseno;
