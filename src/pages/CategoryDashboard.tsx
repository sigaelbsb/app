import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePermisos } from '../hooks/usePermisos';
import { 
  ChamiloBreadcrumb, 
  ChamiloActionBar, 
  ChamiloHelpCallout, 
  ChamiloToolCard,
  IconoPerfilEscuela,
  IconoConfiguracionSistema,
  IconoCerebroSigma,
  IconoCalendarioEscolar,
  IconoDivisionTerritorial,
  IconoPanelControl,
  IconoInstalacionDescargas,
  IconoEstudiante,
  IconoUnidadTransporte,
  IconoSeguridadRol,
  IconoPersonalDocente,
  IconoCargosInstitucionales,
  IconoCadenaSupervisoria,
  IconoGestionColectivos,
  IconoEstructuraEmpresa,
  IconoGradosSalones,
  IconoGestionAdmisiones,
  IconoMensajesAdmision,
  IconoVincularEstudiante,
  IconoActualizacionDatos,
  IconoVerificaciones,
  IconoSolicitudCupos3D,
  IconoDocumentoDigital,
  IconoEstudioDiseno,
  IconoModuloDisenos
} from '../components/chamilo';

export const ModulosSistema = {
  "Dirección y Sistema": { 
    icono: "bi-bank", color: "#FF8D00", desc: "Gestión institucional, calendario oficial, parámetros maestros y configuración global.", 
    ayuda: "En esta caja de herramientas de Dirección podrás configurar los datos de la institución, gestionar los períodos escolares, lapsos, división territorial y herramientas de control del sistema.",
    items: [
      { 
        vista: "Perfil de la Escuela", 
        icono: "bi-building", 
        color: "#0284c7",
        desc: "Datos jurídicos, código DEA, PEIC, misión, visión y directivos.", 
        tag: "Planteles", 
        badgeText: "Configurado",
        badgeType: "active",
        hint: "UE Santa Bárbara & UE Libertador Bolívar"
      }, 
      { 
        vista: "Configuración Escolar", 
        icono: "bi-sliders", 
        color: "#f59e0b",
        desc: "Períodos lectivos, lapsos académicos y niveles educativos.", 
        tag: "Parámetros", 
        badgeText: "2025 - 2026",
        badgeType: "active",
        hint: "Período Lectivo Activo"
      },
      { 
        vista: "Cerebro de Sigma", 
        icono: "bi-robot", 
        color: "#8b5cf6",
        desc: "Inteligencia artificial y motor de asistencia institucional.", 
        tag: "IA Sigma", 
        badgeText: "En línea",
        badgeType: "active",
        hint: "Asistente Neural Institucional"
      },
      { 
        vista: "Calendario Escolar", 
        icono: "bi-calendar-range", 
        color: "#ec4899",
        desc: "Planificador de eventos, asuetos y efemérides del MPPE.", 
        tag: "MPPE Oficial", 
        badgeText: "Planificado",
        badgeType: "active",
        hint: "Cronograma Escolar MPPE"
      },
      { 
        vista: "División Territorial", 
        icono: "bi-geo-alt-fill", 
        color: "#10b981",
        desc: "Estructura geopolítica de estados, municipios y parroquias.", 
        tag: "Monagas", 
        badgeText: "Georreferenciado",
        badgeType: "active",
        hint: "División Político Territorial"
      },
      { 
        vista: "Panel de Control", 
        icono: "bi-terminal-fill", 
        color: "#f97316",
        desc: "Monitoreo técnico, modo mantenimiento y logs del servidor.", 
        tag: "Control Maestro", 
        badgeText: "Operativo",
        badgeType: "active",
        hint: "Telemetría y Servicios"
      },
      { 
        vista: "Instalación y Descargas", 
        icono: "bi-cloud-arrow-down-fill", 
        color: "#0066FF",
        desc: "Descarga de ejecutables para Windows, Android APK y guías PWA.", 
        tag: "SIGAE v1.1", 
        badgeText: "Multiplataforma",
        badgeType: "active",
        hint: "Instalador Windows & Android"
      }
    ] 
  },
  "Organización Escolar": { 
    icono: "bi-diagram-3", color: "#e11d48", desc: "Cargos institucionales, organigrama, colectivos pedagógicos y estructura corporativa.", 
    ayuda: "Herramientas de organización del personal, jerarquía supervisoria, agrupaciones de colectivos y nóminas de filiales PDVSA.",
    items: [
      { 
        vista: "Cargos Institucionales", 
        icono: "bi-briefcase-fill", 
        color: "#2563eb",
        desc: "Catálogo de puestos de trabajo y asignación de personal docente/obrero.",
        tag: "Planta Docente",
        badgeText: "Activo",
        badgeType: "active",
        hint: "Asignación & Catálogo de Cargos"
      }, 
      { 
        vista: "Cadena Supervisoria", 
        icono: "bi-diagram-2", 
        color: "#7c3aed",
        desc: "Organigrama jerárquico y líneas de reporte institucional.",
        tag: "Jerarquía",
        badgeText: "Estructurado",
        badgeType: "active",
        hint: "Organigrama Institucional"
      },
      { 
        vista: "Gestión de Colectivos", 
        icono: "bi-people-fill", 
        color: "#059669",
        desc: "Colectivos de formación pedagógica, estudiantes y comunidad.",
        tag: "Colectivos",
        badgeText: "Planificado",
        badgeType: "active",
        hint: "Comités & Colectivos Escolares"
      },
      { 
        vista: "Estructura Empresa", 
        icono: "bi-buildings-fill", 
        color: "#e11d48",
        desc: "Diccionarios de filiales petroleras, tipos de nómina y parentescos.",
        tag: "PDVSA Filiales",
        badgeText: "Vinculado",
        badgeType: "active",
        hint: "Parámetros Corporativos"
      }
    ] 
  },
  "Control de Estudios": { 
    icono: "bi-folder-check", color: "#0284c7", desc: "Estructura académica, ambientes físicos, grados, salones y secciones.", 
    ayuda: "Administra las capacidades de las aulas, apertura de salones, configuración de grados y asignación de docentes guías.",
    items: [
      { 
        vista: "Grados y Salones", 
        icono: "bi-grid-3x3-gap-fill", 
        color: "#0284c7",
        desc: "Configuración de ambientes, grados, secciones y docentes guías.",
        tag: "Aulas & Grados",
        badgeText: "Estructurado",
        badgeType: "active",
        hint: "Capacidad & Secciones Escolares"
      }
    ] 
  },
  "Gestión Estudiantil": { 
    icono: "bi-mortarboard-fill", color: "#8b5cf6", desc: "Inscripciones, vinculaciones, expedientes estudiantiles y solicitudes.", 
    ayuda: "Herramientas integrales para el proceso de admisión, vinculación de representantes con alumnos, emisión de comprobantes y recaudos.",
    items: [
      { 
        vista: "Gestión de Admisiones", 
        icono: "bi-ui-checks", 
        color: "#7c3aed",
        desc: "Baremo de admisión, auditoría uno a uno y formalización de cupo.",
        tag: "Admisiones",
        badgeText: "Baremo Activo",
        badgeType: "active",
        hint: "Auditoría & Clasificación"
      },
      { 
        vista: "Mensajes de Admisión", 
        icono: "bi-chat-heart-fill", 
        color: "#10b981",
        desc: "Plantillas de notificación vía WhatsApp para admitidos y asignaciones.",
        tag: "WhatsApp",
        badgeText: "Certificado",
        badgeType: "active",
        hint: "Plantillas de Notificación"
      },
      { 
        vista: "Orientaciones Nuevos Ingresos", 
        icono: "bi-whatsapp", 
        color: "#10b981",
        desc: "Guía oficial paso a paso y difusión masiva anti-spam por WhatsApp para nuevos ingresos.",
        tag: "WhatsApp Masivo",
        badgeText: "Anti-Spam Meta",
        badgeType: "active",
        hint: "Paso a Paso Nuevos Ingresos"
      },
      { 
        vista: "Vincular Estudiante", 
        icono: "bi-person-plus-fill", 
        color: "#0284c7",
        desc: "Registro formal de matrícula, ficha de inscripción y vinculación.",
        tag: "Matrícula",
        badgeText: "Inscripciones",
        badgeType: "active",
        hint: "Vinculación Representante-Alumno"
      },
      { 
        vista: "Actualización de Datos", 
        icono: "bi-arrow-repeat", 
        color: "#f59e0b",
        desc: "Asistente guiado por pasos para ratificación de datos del representante.",
        tag: "Censo Anual",
        badgeText: "Paso a Paso",
        badgeType: "active",
        hint: "Ratificación de Ficha Escolar"
      },
      { 
        vista: "Solicitud de Cupos", 
        icono: "bi-envelope-paper-fill", 
        color: "#8b5cf6",
        desc: "Recepción y validación de nuevas solicitudes de nuevo ingreso.",
        tag: "Nuevo Ingreso",
        badgeText: "Convocatoria",
        badgeType: "active",
        hint: "Registro Digital de Cupos"
      },
      { 
        vista: "Verificaciones", 
        icono: "bi-shield-check", 
        color: "#0d9488",
        desc: "Escaneo de códigos QR y re-impresión de comprobantes oficiales.",
        tag: "Seguridad QR",
        badgeText: "Auditoría",
        badgeType: "active",
        hint: "Validación de Autenticidad"
      },
      { 
        vista: "Mis Solicitudes", 
        icono: "bi-card-checklist", 
        color: "#f97316",
        desc: "Seguimiento del estado de solicitudes de trámites estudiantiles.",
        tag: "Seguimiento",
        badgeText: "En Línea",
        badgeType: "active",
        hint: "Consulta por Código Único"
      }
    ] 
  },
  "Gestión Docente": { 
    icono: "bi-person-workspace", color: "#00E676", desc: "Administración del personal docente, expedientes y asignaciones.", 
    ayuda: "Control de expedientes de profesores, carga horaria, asignaturas y registros de desempeño laboral.",
    items: [
      { vista: "Mi Expediente", icono: "bi-person-vcard", color: "#0284c7", desc: "Ficha personal, títulos, experiencia y datos de contacto del docente." },
      { vista: "Gestor de Expedientes", icono: "bi-folder-symlink", color: "#10b981", desc: "Buscador global de expedientes de la nómina docente activa." }
    ] 
  },
  "Diseños": { 
    icono: "bi-palette-fill", color: "#EC4899", desc: "Estudio de diseño creativo, constancias, carnets, comunicados y encuestas.", 
    ayuda: "Generador de documentos oficiales con firmas seguras, membretes, sellos digitales y creador de piezas gráficas.",
    items: [
      { 
        vista: "Galería y Plantillas", 
        icono: "bi-grid-1x2-fill", 
        color: "#ec4899", 
        desc: "Catálogo de plantillas oficiales listas para personalizar y exportar.",
        tag: "Plantillas",
        badgeText: "Catálogo VIP",
        badgeType: "active",
        hint: "Plantillas Gráficas Oficiales"
      },
      { 
        vista: "Editor de Constancias", 
        icono: "bi-file-earmark-richtext-fill", 
        color: "#0284c7", 
        desc: "Generación y edición de constancias de inscripción, estudio y conducta con QR.",
        tag: "Constancias",
        badgeText: "Firmas & Sellos",
        badgeType: "active",
        hint: "Inscripción, Estudio y Conducta"
      },
      { 
        vista: "Carta de Aceptación", 
        icono: "bi-file-earmark-check-fill", 
        color: "#0d9488", 
        desc: "Edición y personalización oficial de la Carta de Aceptación (3 páginas con firmas y QR).",
        tag: "Aceptación",
        badgeText: "Oficial 3 Páginas",
        badgeType: "active",
        hint: "Admisiones & Cupos U.E. LB y SB"
      },
      { 
        vista: "Carnet Estudiantil", 
        icono: "bi-person-badge-fill", 
        color: "#10b981", 
        desc: "Diseño y exportación en alta calidad de carnets escolares con foto y barras.",
        tag: "Carnetización",
        badgeText: "Digital & PDF",
        badgeType: "active",
        hint: "Formato Anverso y Reverso"
      },
      { 
        vista: "Creador de Certificados", 
        icono: "bi-patch-check-fill", 
        color: "#f59e0b", 
        desc: "Plantillas oficiales de reconocimientos, diplomas y méritos académicos.",
        tag: "Diplomas",
        badgeText: "Alta Calidad",
        badgeType: "active",
        hint: "Mérito Académico & Graduación"
      },
      { 
        vista: "Creador de Flyers", 
        icono: "bi-file-earmark-image-fill", 
        color: "#8b5cf6", 
        desc: "Afiches y volantes digitales para eventos y actividades de la institución.",
        tag: "Eventos",
        badgeText: "Creativo",
        badgeType: "active",
        hint: "Afiches Promocionales"
      },
      { 
        vista: "Creador de Invitaciones", 
        icono: "bi-envelope-paper-heart-fill", 
        color: "#f43f5e", 
        desc: "Tarjetas de invitación a actos de grado, asambleas y reuniones.",
        tag: "Tarjetas",
        badgeText: "Elegante",
        badgeType: "active",
        hint: "Invitaciones Institucionales"
      },
      { 
        vista: "Creador de Tapas", 
        icono: "bi-journal-album", 
        color: "#0d9488", 
        desc: "Carátulas y portadas para carpetas de expedientes y planificadores.",
        tag: "Carátulas",
        badgeText: "Editorial",
        badgeType: "active",
        hint: "Portadas de Expedientes"
      },
      { 
        vista: "Creador de Comunicados", 
        icono: "bi-megaphone-fill", 
        color: "#2563eb", 
        desc: "Circulares oficiales con membrete ministerial para enviar a la comunidad.",
        tag: "Circulares",
        badgeText: "Oficial MPPE",
        badgeType: "active",
        hint: "Comunicados Directivos"
      },
      { 
        vista: "Creador de Cumpleaños", 
        icono: "bi-balloon-heart-fill", 
        color: "#eab308", 
        desc: "Afiches de felicitaciones para docentes, obreros y estudiantes.",
        tag: "Efemérides",
        badgeText: "Celebraciones",
        badgeType: "active",
        hint: "Tarjetas de Felicitación"
      },
      { 
        vista: "Encuesta", 
        icono: "bi-ui-checks-grid", 
        color: "#059669", 
        desc: "Constructor de formularios y encuestas de satisfacción escolar.",
        tag: "Formularios",
        badgeText: "Estadísticas",
        badgeType: "active",
        hint: "Sondeos & Diagnósticos"
      }
    ] 
  },
  "Servicios y Bienestar": { 
    icono: "bi-heart-pulse", color: "#FF3D00", desc: "Rutas, paradas y monitoreo en tiempo real del transporte escolar.", 
    ayuda: "Control de unidades de transporte escolar, trazado de rutas, paradas y notificaciones push de recorridos.",
    items: [
      { vista: "Transporte Escolar", icono: "bi-bus-front", color: "#f97316", desc: "Tracking de rutas, paradas, despacho masivo y rutogramas." }
    ] 
  },
  "Seguridad y Accesos": { 
    icono: "bi-shield-lock", color: "#455A64", desc: "Usuarios, credenciales biométricas, roles y auditoría del sistema.", 
    ayuda: "Administración de cuentas de acceso, matriz de privilegios por escuela, contraseñas y trazabilidad de eventos.",
    items: [
      { vista: "Mi Perfil", icono: "bi-person-badge", color: "#0284c7", desc: "Actualización de datos personales, clave y preguntas secretas." }, 
      { vista: "Métodos de Acceso", icono: "bi-fingerprint", color: "#7c3aed", desc: "Configuración de huella biométrica, FaceID y doble factor TOTP." },
      { vista: "Gestión de Usuarios", icono: "bi-people", color: "#10b981", desc: "Creación de cuentas, reseteos de contraseña y altas masivas." }, 
      { vista: "Roles y Privilegios", icono: "bi-key", color: "#f59e0b", desc: "Matriz granular de permisos y accesos diferenciados SB / LB." },
      { vista: "Preguntas de Seguridad", icono: "bi-patch-question", color: "#0d9488", desc: "Catálogo de preguntas para recuperación automática de cuentas." },
      { vista: "Auditoría del Sistema", icono: "bi-list-check", color: "#e11d48", desc: "Bitácora cronológica completa de movimientos y operaciones." } 
    ] 
  }
};

export const CategoryDashboard = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();
  const { tienePermiso, tienePermisoEnEscuela, loading: permLoading } = usePermisos();

  const [filtroTexto, setFiltroTexto] = useState('');
  const escuelaCodigo = localStorage.getItem('sigae_escuela_codigo') || 'sb';
  const nombreEscuela = escuelaCodigo === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
  const isSB = escuelaCodigo === 'sb';

  const decodedCategory = categoryName ? decodeURIComponent(categoryName) : '';
  const modulo = (ModulosSistema as any)[decodedCategory];

  const isDireccion = decodedCategory === 'Dirección y Sistema';
  const isOrganizacion = decodedCategory === 'Organización Escolar';
  const isControlEstudios = decodedCategory === 'Control de Estudios';
  const isGestionEstudiantil = decodedCategory === 'Gestión Estudiantil';
  const isDisenos = decodedCategory === 'Diseños';

  const theme = isDireccion ? {
    borderTop: '6px solid #FF8D00',
    border: '2px solid #fed7aa',
    bg: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 45%, #ffedd5 100%)',
    badgeBg: '#FF8D00',
    accentColor: '#c2410c',
    boxShadow: '0 10px 24px rgba(249, 115, 22, 0.15)',
    logoBorder: '2.5px solid #fed7aa',
    beaconColor: '#ea580c',
    beaconBorder: '#fed7aa',
    backBtnBorder: '#fed7aa',
    backBtnIcon: '#ea580c'
  } : (isOrganizacion ? {
    borderTop: '6px solid #e11d48',
    border: '2px solid #fecdd3',
    bg: 'linear-gradient(135deg, #ffffff 0%, #fff1f2 45%, #ffe4e6 100%)',
    badgeBg: '#e11d48',
    accentColor: '#be123c',
    boxShadow: '0 10px 24px rgba(225, 29, 72, 0.15)',
    logoBorder: '2.5px solid #fecdd3',
    beaconColor: '#e11d48',
    beaconBorder: '#fecdd3',
    backBtnBorder: '#fecdd3',
    backBtnIcon: '#be123c'
  } : (isControlEstudios ? {
    borderTop: '6px solid #0284c7',
    border: '2px solid #bae6fd',
    bg: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 45%, #e0f2fe 100%)',
    badgeBg: '#0284c7',
    accentColor: '#0369a1',
    boxShadow: '0 10px 24px rgba(2, 132, 199, 0.15)',
    logoBorder: '2.5px solid #bae6fd',
    beaconColor: '#0284c7',
    beaconBorder: '#bae6fd',
    backBtnBorder: '#bae6fd',
    backBtnIcon: '#0284c7'
  } : (isGestionEstudiantil ? {
    borderTop: '6px solid #8b5cf6',
    border: '2px solid #ddd6fe',
    bg: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 45%, #ede9fe 100%)',
    badgeBg: '#8b5cf6',
    accentColor: '#6d28d9',
    boxShadow: '0 10px 24px rgba(139, 92, 246, 0.15)',
    logoBorder: '2.5px solid #ddd6fe',
    beaconColor: '#8b5cf6',
    beaconBorder: '#ddd6fe',
    backBtnBorder: '#ddd6fe',
    backBtnIcon: '#6d28d9'
  } : (isDisenos ? {
    borderTop: '6px solid #ec4899',
    border: '2px solid #fbcfe8',
    bg: 'linear-gradient(135deg, #ffffff 0%, #fdf2f8 45%, #fce7f3 100%)',
    badgeBg: '#ec4899',
    accentColor: '#be185d',
    boxShadow: '0 10px 24px rgba(236, 72, 153, 0.15)',
    logoBorder: '2.5px solid #fbcfe8',
    beaconColor: '#ec4899',
    beaconBorder: '#fbcfe8',
    backBtnBorder: '#fbcfe8',
    backBtnIcon: '#be185d'
  } : {
    borderTop: `6px solid ${isSB ? '#10b981' : '#0284c7'}`,
    border: isSB ? '2px solid #a7f3d0' : '2px solid #bae6fd',
    bg: isSB
      ? 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 45%, #d1fae5 100%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 45%, #dbeafe 100%)',
    badgeBg: isSB ? '#10b981' : '#0284c7',
    accentColor: isSB ? '#047857' : '#0369a1',
    boxShadow: isSB ? '0 10px 24px rgba(16, 185, 129, 0.15)' : '0 10px 24px rgba(2, 132, 199, 0.15)',
    logoBorder: isSB ? '2.5px solid #a7f3d0' : '2.5px solid #bae6fd',
    beaconColor: isSB ? '#10b981' : '#0284c7',
    beaconBorder: isSB ? '#a7f3d0' : '#bae6fd',
    backBtnBorder: isSB ? '#a7f3d0' : '#bae6fd',
    backBtnIcon: isSB ? '#10b981' : '#0284c7'
  }))));

  if (permLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando herramientas...</span>
        </div>
      </div>
    );
  }

  if (!modulo) {
    return (
      <div className="text-center py-5">
        <h3>Categoría no encontrada</h3>
        <button className="btn btn-primary rounded-pill mt-3 px-4" onClick={() => navigate('/')}>
          Volver al Inicio
        </button>
      </div>
    );
  }

  const logoPath = `/assets/img/logo_${escuelaCodigo}.png`;

  const handleSubmoduloClick = (vista: string) => {
    navigate(`/categoria/${encodeURIComponent(decodedCategory)}/${encodeURIComponent(vista)}`);
  };

  const getCustomIconForTool = (vista: string, color: string) => {
    switch (vista) {
      // Dirección y Sistema
      case 'Perfil de la Escuela':
        return <IconoPerfilEscuela size={46} color={color} />;
      case 'Configuración Escolar':
      case 'Configuración del Sistema':
        return <IconoConfiguracionSistema size={46} color={color} />;
      case 'Cerebro de Sigma':
        return <IconoCerebroSigma size={54} color={color} />;
      case 'Calendario Escolar':
        return <IconoCalendarioEscolar size={46} color={color} />;
      case 'División Territorial':
        return <IconoDivisionTerritorial size={46} color={color} />;
      case 'Panel de Control':
        return <IconoPanelControl size={46} color={color} />;
      case 'Instalación y Descargas':
        return <IconoInstalacionDescargas size={46} color={color} />;

      // Organización Escolar
      case 'Cargos Institucionales':
        return <IconoCargosInstitucionales size={46} color={color} />;
      case 'Cadena Supervisoria':
        return <IconoCadenaSupervisoria size={46} color={color} />;
      case 'Gestión de Colectivos':
        return <IconoGestionColectivos size={46} color={color} />;
      case 'Estructura Empresa':
        return <IconoEstructuraEmpresa size={46} color={color} />;

      // Control de Estudios
      case 'Grados y Salones':
        return <IconoGradosSalones size={46} color={color} />;

      // Gestión Estudiantil
      case 'Gestión de Admisiones':
        return <IconoGestionAdmisiones size={46} color={color} />;
      case 'Mensajes de Admisión':
      case 'Orientaciones Nuevos Ingresos':
        return <IconoMensajesAdmision size={46} color={color} />;
      case 'Vincular Estudiante':
        return <IconoVincularEstudiante size={46} color={color} />;
      case 'Expediente Estudiantil':
        return <IconoEstudiante size={46} color={color} />;
      case 'Actualización de Datos':
        return <IconoActualizacionDatos size={46} color={color} />;
      case 'Solicitud de Cupos':
      case 'Mis Solicitudes':
        return <IconoSolicitudCupos3D size={46} color={color} />;
      case 'Verificaciones':
        return <IconoVerificaciones size={46} color={color} />;
      case 'Gestión de Matrícula':
        return <IconoEstudiante size={46} color={color} />;

      // Diseños
      case 'Galería y Plantillas':
        return <IconoModuloDisenos size={46} color={color} />;
      case 'Editor de Constancias':
        return <IconoDocumentoDigital size={46} color={color} />;
      case 'Carta de Aceptación':
        return <IconoDocumentoDigital size={46} color={color} />;
      case 'Carnet Estudiantil':
        return <IconoEstudiante size={46} color={color} />;
      case 'Creador de Certificados':
      case 'Creador de Flyers':
      case 'Creador de Invitaciones':
      case 'Creador de Tapas':
      case 'Creador de Comunicados':
      case 'Creador de Cumpleaños':
      case 'Encuesta':
        return <IconoEstudioDiseno size={46} color={color} />;

      // Otros módulos
      case 'Transporte Escolar':
        return <IconoUnidadTransporte size={46} color={color} />;
      case 'Mi Expediente':
      case 'Gestor de Expedientes':
        return <IconoPersonalDocente size={46} color={color} />;
      case 'Roles y Privilegios':
      case 'Auditoría del Sistema':
      case 'Métodos de Acceso':
        return <IconoSeguridadRol size={46} color={color} />;
      default:
        return null;
    }
  };

  const herramientasFiltradas = modulo.items.filter((item: any) => {
    // 1. Filtrar por permisos
    let tieneAcceso = false;
    if (item.vista === 'Gestión de Colectivos') {
      tieneAcceso = tienePermisoEnEscuela('sb', item.vista, 'ver') || tienePermisoEnEscuela('lb', item.vista, 'ver');
    } else {
      tieneAcceso = tienePermiso(item.vista, 'ver');
    }

    if (!tieneAcceso) return false;

    // 2. Filtrar por texto de búsqueda
    if (!filtroTexto.trim()) return true;
    const q = filtroTexto.toLowerCase();
    return item.vista.toLowerCase().includes(q) || (item.desc || '').toLowerCase().includes(q) || (item.tag || '').toLowerCase().includes(q);
  });

  return (
    <div className="modulo-animado container-fluid p-0">
      {/* 1. Miga de pan Chamilo */}
      <ChamiloBreadcrumb
        items={[
          { label: decodedCategory, icon: modulo.icono }
        ]}
      />

      {/* 2. Cabecera Institucional Tecnológica (Mismo Diseño de la Principal con Naranja Muy Claro en Dirección) */}
      <div 
        className="tech-card overflow-hidden mb-4 animate__animated animate__fadeInDown" 
        style={{ 
          border: theme.border,
          borderTop: theme.borderTop,
          background: theme.bg,
          borderRadius: '26px'
        }}
      >
        <div className="p-4 p-md-5">
          <div className="row align-items-center g-4">
            
            {/* Logo Oficial de la Escuela */}
            <div className="col-12 col-md-auto text-center text-md-start">
              <div 
                className="tech-icon-wrapper bg-white shadow-sm d-inline-flex align-items-center justify-content-center p-2"
                style={{ 
                  width: '105px', 
                  height: '105px',
                  borderRadius: '24px',
                  border: theme.logoBorder,
                  boxShadow: theme.boxShadow
                }}
                title={`Plantel Activo: ${nombreEscuela}`}
              >
                <img 
                  src={logoPath} 
                  alt="Escudo Oficial de la Escuela" 
                  className="img-fluid"
                  style={{ maxHeight: '85px', maxWidth: '85px', objectFit: 'contain' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                />
              </div>
            </div>

            {/* Datos Jurídicos, Identidad y Beacon Tecnológico */}
            <div className="col-12 col-md">
              <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                {/* Live Campus Beacon */}
                <div 
                  className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill bg-white border shadow-xs"
                  style={{ borderColor: theme.beaconBorder }}
                >
                  <span 
                    className="status-beacon-live" 
                    style={{ color: theme.beaconColor }}
                  ></span>
                  <span 
                    className="extra-small fw-bold text-uppercase" 
                    style={{ fontSize: '0.72rem', color: theme.accentColor, letterSpacing: '0.5px' }}
                  >
                    Campus Conectado &bull; {nombreEscuela}
                  </span>
                </div>

                <span 
                  className="badge text-white fw-bold px-3 py-1.5 rounded-pill small shadow-xs d-inline-flex align-items-center gap-1.5"
                  style={{ backgroundColor: theme.badgeBg }}
                >
                  <i className={`bi ${modulo.icono}`}></i>
                  <span>{decodedCategory}</span>
                </span>

                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs">
                  <i className="bi bi-grid-fill text-primary me-1"></i>
                  {herramientasFiltradas.length} de {modulo.items.length} Herramientas Activas
                </span>

                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs">
                  <i className="bi bi-shield-fill-check text-success me-1"></i>
                  Control Operativo
                </span>
              </div>

              <h1 className="fw-bolder mb-1.5 text-dark" style={{ fontSize: 'calc(1.5rem + 0.75vw)', letterSpacing: '-0.6px' }}>
                {decodedCategory}
              </h1>

              <p className="mb-0 text-muted small d-flex align-items-center gap-1.5 flex-wrap">
                <i className="bi bi-info-circle-fill text-primary flex-shrink-0"></i>
                <span className="fw-semibold">{modulo.desc}</span>
                <span className="badge bg-white text-secondary border px-2 py-0.5 rounded-pill extra-small ms-1 d-none d-lg-inline">
                  <i className="bi bi-building me-1 text-primary"></i>DEP PDVSA Oriente
                </span>
              </p>

              {/* Cinta de Telemetría Escolar Interactiva */}
              <div className="d-flex align-items-center gap-2 mt-3 flex-wrap">
                <div 
                  className="tech-pill-badge shadow-xs cursor-pointer" 
                  title="Ciclo Académico Actual"
                >
                  <i className="bi bi-calendar-check-fill text-success"></i>
                  <span className="text-secondary">Periodo 2025-2026</span>
                </div>
                <div 
                  className="tech-pill-badge shadow-xs cursor-pointer" 
                  title="Caja de Herramientas"
                >
                  <i className="bi bi-grid-3x3-gap-fill text-primary"></i>
                  <span className="font-monospace fw-bold text-dark">{herramientasFiltradas.length} de {modulo.items.length} Módulos</span>
                </div>
                <div 
                  className="tech-pill-badge shadow-xs cursor-pointer" 
                  title="Estado Institucional"
                >
                  <i className="bi bi-shield-fill-check text-warning"></i>
                  <span className="text-secondary">100% Operativo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Guía contextual de ayuda estilo Chamilo */}
      {modulo.ayuda && (
        <ChamiloHelpCallout 
          title={`Orientación sobre ${decodedCategory}`}
          storageKey={`cat_${decodedCategory.replace(/\s+/g, '_')}`}
        >
          <p className="mb-1">{modulo.ayuda}</p>
          <small className="text-muted">
            <i className="bi bi-info-circle me-1"></i> Selecciona cualquiera de las herramientas disponibles a continuación para comenzar a trabajar.
          </small>
        </ChamiloHelpCallout>
      )}

      {/* 4. Barra de Acciones y Búsqueda de Herramientas */}
      <ChamiloActionBar
        title="Herramientas Disponibles"
        subtitle={`${herramientasFiltradas.length} de ${modulo.items.length} herramientas activas para tu rol`}
      >
        <div className="input-group" style={{ maxWidth: '350px' }}>
          <span className="input-group-text bg-light border-end-0 rounded-start-3">
            <i className="bi bi-search text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control bg-light border-start-0 rounded-end-3"
            placeholder="Buscar herramienta o etiqueta..."
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
          />
          {filtroTexto && (
            <button 
              className="btn btn-light border"
              onClick={() => setFiltroTexto('')}
              title="Limpiar búsqueda"
            >
              <i className="bi bi-x"></i>
            </button>
          )}
        </div>
      </ChamiloActionBar>

      {/* 5. Rejilla de Cajas de Herramientas Chamilo con Iconos Personalizados y Micro-interactividad */}
      {herramientasFiltradas.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white my-3">
          <div className="p-3 bg-light rounded-circle d-inline-flex mx-auto mb-3">
            <i className="bi bi-search text-muted fs-2"></i>
          </div>
          <h5 className="fw-bold text-dark mb-1">No se encontraron herramientas</h5>
          <p className="text-muted small mb-3">No hay herramientas que coincidan con el término de búsqueda "{filtroTexto}".</p>
          <div>
            <button className="btn btn-outline-primary rounded-pill px-4" onClick={() => setFiltroTexto('')}>
              Restablecer Filtro
            </button>
          </div>
        </div>
      ) : (
        <div className="chamilo-toolbox-grid animate__animated animate__fadeInUp">
          {herramientasFiltradas.map((item: any, idx: number) => {
            const cardColor = item.color || modulo.color;
            const customIcon = getCustomIconForTool(item.vista, cardColor);

            return (
              <ChamiloToolCard
                key={item.vista}
                id={`tool-card-${idx}`}
                title={item.vista}
                description={item.desc || `Acceso a la herramienta de ${item.vista}.`}
                icon={item.icono}
                customIcon={customIcon}
                categoryColor={cardColor}
                tag={item.tag}
                hint={item.hint}
                badgeText={item.badgeText || "Disponible"}
                badgeType={item.badgeType || "active"}
                onClick={() => handleSubmoduloClick(item.vista)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

