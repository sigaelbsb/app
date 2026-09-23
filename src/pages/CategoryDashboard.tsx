import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePermisos } from '../hooks/usePermisos';
import { 
  ChamiloBreadcrumb, 
  ChamiloActionBar, 
  ChamiloHelpCallout, 
  ChamiloToolCard,
  IconoPerfilEscuela,
  IconoCerebroSigma,
  IconoVincularEstudiante,
  IconoActualizacionDatos,
  IconoVerificaciones,
  IconoGestionAdmisiones,
  IconoMensajesAdmision,
  IconoConfiguracionEscolar3D,
  IconoCalendarioEscolar3D,
  IconoDivisionTerritorial3D,
  IconoPanelControl3D,
  IconoInstalacionDescargas3D,
  IconoCargosInstitucionales3D,
  IconoCadenaSupervisoria3D,
  IconoGestionColectivos3D,
  IconoEstructuraEmpresa3D,
  IconoGradosSalones3D,
  IconoExpedienteEstudiantil3D,
  IconoGestionMatricula3D,
  IconoSolicitudCupos3D,
  IconoOrientacionesNuevosIngresos3D,
  IconoMisSolicitudes3D,
  IconoMiExpediente3D,
  IconoGestorExpedientes3D,
  IconoGaleriaPlantillas3D,
  IconoEditorConstancias3D,
  IconoCartaAceptacion3D,
  IconoCarnetEstudiantil3D,
  IconoCreadorCertificados3D,
  IconoCreadorFlyers3D,
  IconoCreadorInvitaciones3D,
  IconoCreadorTapas3D,
  IconoCreadorComunicados3D,
  IconoCreadorCumpleanos3D,
  IconoEncuesta3D,
  IconoTransporteEscolar3D,
  IconoMiPerfil3D,
  IconoMetodosAcceso3D,
  IconoGestionUsuarios3D,
  IconoRolesPrivilegios3D,
  IconoPreguntasSeguridad3D,
  IconoAuditoriaSistema3D
} from '../components/chamilo';

export const ModulosSistema = {
  "Dirección y Sistema": { 
    icono: "bi-building-gear", 
    icono3d: "/icons3d/icono_direccion_3d.png",
    color: "#FF8D00", desc: "Gestión institucional, calendario oficial, parámetros maestros y configuración global.", 
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
    icono: "bi-diagram-3", 
    icono3d: "/icons3d/icono_organizacion_3d.png",
    color: "#e11d48", desc: "Cargos institucionales, organigrama, colectivos pedagógicos y estructura corporativa.", 
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
    icono: "bi-folder-check", 
    icono3d: "/icons3d/icono_academico_3d.png",
    color: "#0284c7", desc: "Estructura académica, ambientes físicos, grados, salones y secciones.", 
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
    icono: "bi-mortarboard-fill", 
    icono3d: "/icons3d/icono_estudiantil_3d.png",
    color: "#8b5cf6", desc: "Inscripciones, vinculaciones, ratificación de fichas y comprobantes.", 
    ayuda: "Herramientas integrales para el proceso de vinculación de representantes con alumnos, emisión de comprobantes, censo y recaudos.",
    items: [
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
        vista: "Verificaciones", 
        icono: "bi-shield-check", 
        color: "#0d9488",
        desc: "Escaneo de códigos QR y re-impresión de comprobantes oficiales.",
        tag: "Seguridad QR",
        badgeText: "Auditoría",
        badgeType: "active",
        hint: "Validación de Autenticidad"
      }
    ] 
  },
  "Admisiones y Nuevos Ingresos": { 
    icono: "bi-clipboard2-check-fill", 
    icono3d: "/icons3d/icono_admisiones_3d.png",
    color: "#059669", desc: "Recepción de solicitudes, baremo institucional, auditoría y formalización de cupo.", 
    ayuda: "Herramientas dedicadas a la convocatoria, recepción de solicitudes de cupos, baremo de clasificación y formalización de nuevos ingresos.",
    items: [
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
    icono: "bi-person-workspace", 
    icono3d: "/icons3d/icono_personal_3d.png",
    color: "#00E676", desc: "Administración del personal docente, expedientes y asignaciones.", 
    ayuda: "Control de expedientes de profesores, carga horaria, asignaturas y registros de desempeño laboral.",
    items: [
      { vista: "Mi Expediente", icono: "bi-person-vcard", color: "#0284c7", desc: "Ficha personal, títulos, experiencia y datos de contacto del docente." },
      { vista: "Gestor de Expedientes", icono: "bi-folder-symlink", color: "#10b981", desc: "Buscador global de expedientes de la nómina docente activa." }
    ] 
  },
  "Diseños": { 
    icono: "bi-palette-fill", 
    icono3d: "/icons3d/icono_disenos_3d.png",
    color: "#EC4899", desc: "Estudio de diseño creativo, constancias, carnets, comunicados y encuestas.", 
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
    icono: "bi-heart-pulse", 
    icono3d: "/icons3d/icono_transporte_3d.png",
    color: "#FF3D00", desc: "Rutas, paradas y monitoreo en tiempo real del transporte escolar.", 
    ayuda: "Control de unidades de transporte escolar, trazado de rutas, paradas y notificaciones push de recorridos.",
    items: [
      { vista: "Transporte Escolar", icono: "bi-bus-front", color: "#f97316", desc: "Tracking de rutas, paradas, despacho masivo y rutogramas." }
    ] 
  },
  "Seguridad y Accesos": { 
    icono: "bi-shield-lock", 
    icono3d: "/icons3d/icono_seguridad_3d.png",
    color: "#455A64", desc: "Usuarios, credenciales biométricas, roles y auditoría del sistema.", 
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

  // Personaje Guía institucional (Zoe o Max) asignado aleatoriamente para este módulo
  const [guiaAsignado] = useState<'zoe' | 'max'>(() => Math.random() < 0.5 ? 'zoe' : 'max');
  const [poseGuia] = useState<'saludo' | 'senala' | 'documentos' | 'pulgar'>(() => {
    const poses: Array<'saludo' | 'senala' | 'documentos' | 'pulgar'> = ['senala', 'saludo', 'pulgar', 'documentos'];
    return poses[Math.floor(Math.random() * poses.length)];
  });

  const decodedCategory = categoryName ? decodeURIComponent(categoryName) : '';
  const modulo = (ModulosSistema as any)[decodedCategory];

  const isDireccion = decodedCategory === 'Dirección y Sistema';
  const isOrganizacion = decodedCategory === 'Organización Escolar';
  const isControlEstudios = decodedCategory === 'Control de Estudios';
  const isGestionEstudiantil = decodedCategory === 'Gestión Estudiantil';
  const isAdmisiones = decodedCategory === 'Admisiones y Nuevos Ingresos';
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
  } : (isAdmisiones ? {
    borderTop: '6px solid #059669',
    border: '2px solid #a7f3d0',
    bg: 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 45%, #d1fae5 100%)',
    badgeBg: '#059669',
    accentColor: '#047857',
    boxShadow: '0 10px 24px rgba(5, 150, 105, 0.15)',
    logoBorder: '2.5px solid #a7f3d0',
    beaconColor: '#059669',
    beaconBorder: '#a7f3d0',
    backBtnBorder: '#a7f3d0',
    backBtnIcon: '#047857'
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
  })))));

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
        return <IconoPerfilEscuela size={50} color={color} />;
      case 'Configuración Escolar':
      case 'Configuración del Sistema':
        return <IconoConfiguracionEscolar3D size={48} color={color} />;
      case 'Cerebro de Sigma':
        return <IconoCerebroSigma size={52} color={color} />;
      case 'Calendario Escolar':
        return <IconoCalendarioEscolar3D size={48} color={color} />;
      case 'División Territorial':
        return <IconoDivisionTerritorial3D size={48} color={color} />;
      case 'Panel de Control':
        return <IconoPanelControl3D size={48} color={color} />;
      case 'Instalación y Descargas':
        return <IconoInstalacionDescargas3D size={48} color={color} />;

      // Organización Escolar
      case 'Cargos Institucionales':
        return <IconoCargosInstitucionales3D size={48} color={color} />;
      case 'Cadena Supervisoria':
        return <IconoCadenaSupervisoria3D size={48} color={color} />;
      case 'Gestión de Colectivos':
        return <IconoGestionColectivos3D size={48} color={color} />;
      case 'Estructura Empresa':
        return <IconoEstructuraEmpresa3D size={48} color={color} />;

      // Control de Estudios
      case 'Grados y Salones':
        return <IconoGradosSalones3D size={48} color={color} />;

      // Gestión Estudiantil
      case 'Vincular Estudiante':
        return <IconoVincularEstudiante size={48} color={color} />;
      case 'Expediente Estudiantil':
        return <IconoExpedienteEstudiantil3D size={48} color={color} />;
      case 'Actualización de Datos':
        return <IconoActualizacionDatos size={48} color={color} />;
      case 'Verificaciones':
        return <IconoVerificaciones size={48} color={color} />;
      case 'Gestión de Matrícula':
        return <IconoGestionMatricula3D size={48} color={color} />;

      // Admisiones y Nuevos Ingresos
      case 'Solicitud de Cupos':
        return <IconoSolicitudCupos3D size={48} color={color} />;
      case 'Gestión de Admisiones':
        return <IconoGestionAdmisiones size={48} color={color} />;
      case 'Mensajes de Admisión':
        return <IconoMensajesAdmision size={48} color={color} />;
      case 'Orientaciones Nuevos Ingresos':
        return <IconoOrientacionesNuevosIngresos3D size={48} color={color} />;
      case 'Mis Solicitudes':
        return <IconoMisSolicitudes3D size={48} color={color} />;

      // Personal Docente
      case 'Mi Expediente':
        return <IconoMiExpediente3D size={48} color={color} />;
      case 'Gestor de Expedientes':
        return <IconoGestorExpedientes3D size={48} color={color} />;

      // Diseños y Formatos
      case 'Galería y Plantillas':
        return <IconoGaleriaPlantillas3D size={48} color={color} />;
      case 'Editor de Constancias':
        return <IconoEditorConstancias3D size={48} color={color} />;
      case 'Carta de Aceptación':
        return <IconoCartaAceptacion3D size={48} color={color} />;
      case 'Carnet Estudiantil':
        return <IconoCarnetEstudiantil3D size={48} color={color} />;
      case 'Creador de Certificados':
        return <IconoCreadorCertificados3D size={48} color={color} />;
      case 'Creador de Flyers':
        return <IconoCreadorFlyers3D size={48} color={color} />;
      case 'Creador de Invitaciones':
        return <IconoCreadorInvitaciones3D size={48} color={color} />;
      case 'Creador de Tapas':
        return <IconoCreadorTapas3D size={48} color={color} />;
      case 'Creador de Comunicados':
        return <IconoCreadorComunicados3D size={48} color={color} />;
      case 'Creador de Cumpleaños':
        return <IconoCreadorCumpleanos3D size={48} color={color} />;
      case 'Encuesta':
        return <IconoEncuesta3D size={48} color={color} />;

      // Servicios
      case 'Transporte Escolar':
        return <IconoTransporteEscolar3D size={48} color={color} />;

      // Seguridad y Auditoría
      case 'Mi Perfil':
        return <IconoMiPerfil3D size={48} color={color} />;
      case 'Métodos de Acceso':
        return <IconoMetodosAcceso3D size={48} color={color} />;
      case 'Gestión de Usuarios':
        return <IconoGestionUsuarios3D size={48} color={color} />;
      case 'Roles y Privilegios':
        return <IconoRolesPrivilegios3D size={48} color={color} />;
      case 'Preguntas de Seguridad':
        return <IconoPreguntasSeguridad3D size={48} color={color} />;
      case 'Auditoría del Sistema':
        return <IconoAuditoriaSistema3D size={48} color={color} />;

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
                  className="badge text-white fw-bold px-3 py-1.5 rounded-pill small shadow-xs d-inline-flex align-items-center gap-2"
                  style={{ backgroundColor: theme.badgeBg }}
                >
                  {modulo.icono3d ? (
                    <img 
                      src={modulo.icono3d} 
                      alt={decodedCategory} 
                      style={{ width: '28px', height: '28px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} 
                    />
                  ) : (
                    <i className={`bi ${modulo.icono}`}></i>
                  )}
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

            {/* Icono 3D Oficial del Módulo en perspectiva Pixar/Disney */}
            {modulo.icono3d && (
              <div className="col-12 col-md-auto text-center text-md-end ms-md-auto d-none d-md-block">
                <div 
                  className="p-3 bg-white bg-opacity-90 d-inline-flex align-items-center justify-content-center position-relative shadow-sm"
                  style={{ 
                    width: '140px', 
                    height: '140px',
                    borderRadius: '32px',
                    border: theme.logoBorder,
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 16px 36px rgba(0,0,0,0.12)'
                  }}
                  title={`Icono 3D Oficial: ${decodedCategory}`}
                >
                  <img 
                    src={modulo.icono3d} 
                    alt={`Icono 3D ${decodedCategory}`} 
                    className="img-fluid animate__animated animate__pulse animate__infinite animate__slower"
                    style={{ maxHeight: '115px', maxWidth: '115px', objectFit: 'contain', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Guía contextual de ayuda estilo Chamilo con Zoe o Max */}
      {modulo.ayuda && (
        <ChamiloHelpCallout 
          title={`Orientación de ${guiaAsignado === 'zoe' ? 'Zoe' : 'Max'} sobre ${decodedCategory}`}
          storageKey={`cat_${decodedCategory.replace(/\s+/g, '_')}`}
        >
          <div className="d-flex align-items-center gap-3">
            <div className="flex-shrink-0 d-none d-sm-block">
              <img 
                src={
                  guiaAsignado === 'zoe' 
                    ? (poseGuia === 'senala' ? '/zoe_senala.png' : (poseGuia === 'pulgar' ? '/zoe_pulgar.png' : (poseGuia === 'documentos' ? '/zoe_documentos.png' : '/zoe_saludo.png')))
                    : (poseGuia === 'senala' ? '/max_senala.png' : (poseGuia === 'pulgar' ? '/max_pulgar.png' : (poseGuia === 'documentos' ? '/max_documentos.png' : '/max_saludo.png')))
                }
                alt={guiaAsignado === 'zoe' ? 'Zoe' : 'Max'}
                style={{ 
                  height: '75px', 
                  objectFit: 'contain',
                  filter: guiaAsignado === 'zoe' 
                    ? 'drop-shadow(0 4px 10px rgba(236, 72, 153, 0.35))' 
                    : 'drop-shadow(0 4px 10px rgba(2, 132, 199, 0.35))'
                }}
              />
            </div>
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-1.5 mb-1">
                <span 
                  className="badge rounded-pill px-2.5 py-0.5 fw-bold"
                  style={{
                    backgroundColor: guiaAsignado === 'zoe' ? '#fdf2f8' : '#f0f9ff',
                    color: guiaAsignado === 'zoe' ? '#db2777' : '#0284c7',
                    border: `1px solid ${guiaAsignado === 'zoe' ? '#fbcfe8' : '#bae6fd'}`,
                    fontSize: '0.72rem'
                  }}
                >
                  <i className={`bi ${guiaAsignado === 'zoe' ? 'bi-heart-fill' : 'bi-stars'} me-1`}></i>
                  Guía {guiaAsignado === 'zoe' ? 'Zoe' : 'Max'}
                </span>
              </div>
              <p className="mb-1 text-dark small">{modulo.ayuda}</p>
              <small className="text-muted d-block">
                <i className="bi bi-info-circle me-1"></i> Selecciona cualquiera de las herramientas disponibles a continuación para comenzar a trabajar.
              </small>
            </div>
          </div>
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

