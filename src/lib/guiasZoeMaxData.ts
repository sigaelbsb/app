export interface ModuloInfo {
  titulo: string;
  icono: string;
  categoria: string;
  descZoe: string;
  descMax: string;
  tip: string;
  accionesSugeridas?: Array<{ texto: string; comando?: string }>;
}

export const DESCRIPCIONES_MODULOS: Record<string, ModuloInfo> = {
  // Gestión Estudiantil
  "Actualización de Datos": {
    titulo: "Actualización de Datos & Ficha Integral",
    icono: "bi-arrow-repeat",
    categoria: "Gestión Estudiantil",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. En este módulo puedes ratificar o completar la Ficha Integral del estudiante paso a paso (10 secciones). Recuerda guardar cada sección antes de avanzar.",
    descMax: "¡Qué tal! Soy <b>Max</b> 👦. Aquí los representantes actualizan sus datos familiares, salud y socioeconómicos. Al completar los 10 pasos, podrás generar la planilla resumen de una sola página.",
    tip: "Verifica que la cédula y fecha de nacimiento coincidan exactamente con la partida de nacimiento.",
    accionesSugeridas: [
      { texto: "📝 Pasos de la Ficha" },
      { texto: "📄 Descargar Resumen" }
    ]
  },
  "Solicitud de Cupos": {
    titulo: "Solicitud de Cupos (Nuevos Ingresos)",
    icono: "bi-envelope-paper-fill",
    categoria: "Gestión Estudiantil",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Aquí se registran y procesan las solicitudes de cupos para aspirantes de nuevo ingreso en la U.E. Santa Bárbara o U.E. Libertador Bolívar.",
    descMax: "¡Saludos! Soy <b>Max</b> 👦. Gestiona y verifica la recepción de solicitudes para el nuevo año escolar. Revisa los datos de contacto del representante para notificarlo.",
    tip: "Los aspirantes con hermanos en el plantel tienen prioridad en el baremo institucional de admisión.",
    accionesSugeridas: [
      { texto: "📋 Registrar Solicitud" },
      { texto: "📊 Ver Baremos" }
    ]
  },
  "Gestión de Admisiones": {
    titulo: "Gestión de Admisiones & Baremos",
    icono: "bi-ui-checks",
    categoria: "Gestión Estudiantil",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. En este módulo el equipo directivo audita el baremo de los aspirantes, califica las solicitudes y formaliza los cupos aprobados.",
    descMax: "¡Buen día! Soy <b>Max</b> 👦. Administra la asignación oficial de cupos con total transparencia. Puedes filtrar por escuela, nivel educativo y puntaje.",
    tip: "Puedes formalizar admisiones directas o extemporáneas de manera inmediata con validación automática.",
    accionesSugeridas: [
      { texto: "⚖️ Auditar Baremos" },
      { texto: "✉️ Enviar Notificaciones" }
    ]
  },
  "Mensajes de Admisión": {
    titulo: "Notificaciones & Mensajes de Admisión",
    icono: "bi-chat-heart-fill",
    categoria: "Gestión Estudiantil",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Envía notificaciones oficiales vía WhatsApp a los representantes cuyos representados fueron admitidos.",
    descMax: "¡Hola! Soy <b>Max</b> 👦. Mantén informada a la comunidad con mensajes claros sobre recaudos, fechas de formalización y bienvenida escolar.",
    tip: "Las plantillas incluyen automáticamente el nombre del estudiante y el plantel asignado.",
    accionesSugeridas: [
      { texto: "📲 Plantillas WhatsApp" },
      { texto: "👥 Lista de Admitidos" }
    ]
  },
  "Orientaciones Nuevos Ingresos": {
    titulo: "Orientaciones para Nuevos Ingresos",
    icono: "bi-whatsapp",
    categoria: "Gestión Estudiantil",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Aquí encuentras la guía oficial paso a paso y herramientas de difusión masiva para orientar a las familias de nuevo ingreso.",
    descMax: "¡Hola! Soy <b>Max</b> 👦. Asegura que ningún representante se quede sin saber los pasos de formalización y consignación de documentos en físico.",
    tip: "Los mensajes cumplen con los lineamientos oficiales para evitar bloqueos en WhatsApp.",
    accionesSugeridas: [
      { texto: "📢 Enviar Difusión" },
      { texto: "📌 Ver Requisitos" }
    ]
  },
  "Vincular Estudiante": {
    titulo: "Vinculación Representante - Estudiante",
    icono: "bi-person-plus-fill",
    categoria: "Gestión Estudiantil",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Este módulo te permite enlazar rápidamente la cédula del representante con la del estudiante para habilitar su ficha escolar.",
    descMax: "¡Qué tal! Soy <b>Max</b> 👦. Asocia legalmente a los alumnos con sus representantes, asigna su parentesco y verifica su estatus de escolaridad.",
    tip: "Si el estudiante aún no tiene cédula, utiliza el código único de nuevo ingreso (ej. T-...).",
    accionesSugeridas: [
      { texto: "🔗 Nueva Vinculación" },
      { texto: "🔍 Buscar Alumno" }
    ]
  },
  "Verificaciones": {
    titulo: "Verificación de Comprobantes & QR",
    icono: "bi-shield-check",
    categoria: "Gestión Estudiantil",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Escanea o introduce el código de cualquier documento emitido por SIGAE para comprobar su validez y autenticidad.",
    descMax: "¡Hola! Soy <b>Max</b> 👦. Auditoría instantánea con sello digital y código QR para constancias, cartas de aceptación y resúmenes de ficha.",
    tip: "Cada comprobante emitido está firmado y registrado en la base de datos oficial de SIGAE.",
    accionesSugeridas: [
      { texto: "📷 Escanear QR" }
    ]
  },
  "Mis Solicitudes": {
    titulo: "Seguimiento de Mis Solicitudes",
    icono: "bi-card-checklist",
    categoria: "Gestión Estudiantil",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Consulta el estado en tiempo real de las solicitudes de cupo enviadas para tus representados.",
    descMax: "¡Hola! Soy <b>Max</b> 👦. Monitorea si tu solicitud está en espera, en baremo, o si ya fue aprobada por la comisión de admisiones.",
    tip: "Mantente atento a las observaciones del plantel en caso de requerir algún recaudo adicional.",
    accionesSugeridas: [
      { texto: "📑 Estado de Solicitud" }
    ]
  },

  // Control de Estudios
  "Grados y Salones": {
    titulo: "Grados, Salones y Secciones",
    icono: "bi-door-open-fill",
    categoria: "Control de Estudios",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Organiza la distribución de aulas físicas, capacidades máximas por salón y asignación de docentes guías.",
    descMax: "¡Saludos! Soy <b>Max</b> 👦. Controla el aforo estudiantil de cada sección y asegura una distribución equitativa de la matrícula escolar.",
    tip: "Verifica que los salones tengan un docente titular asignado antes de iniciar el lapso.",
    accionesSugeridas: [
      { texto: "🏫 Ver Salones" },
      { texto: "👥 Asignar Secciones" }
    ]
  },

  // Servicios
  "Transporte Escolar": {
    titulo: "Rutas y Unidades de Transporte Escolar",
    icono: "bi-bus-front-fill",
    categoria: "Servicios Estudiantiles",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Coordina el servicio de transporte institucional, consulta paradas autorizadas y horarios de llegada de las unidades.",
    descMax: "¡Qué tal! Soy <b>Max</b> 👦. Gestiona las unidades de transporte escolar, choferes asignados y alumnos inscritos en cada ruta de Monagas.",
    tip: "Revisa la lista de paradas para asegurar cobertura en los sectores y comunidades más alejadas.",
    accionesSugeridas: [
      { texto: "🚌 Rutas Activas" },
      { texto: "📍 Ver Paradas" }
    ]
  },

  // Dirección y Sistema
  "Perfil de la Escuela": {
    titulo: "Perfil Institucional de los Planteles",
    icono: "bi-building",
    categoria: "Dirección y Sistema",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Consulta y actualiza los datos jurídicos, código DEA, directores, misión, visión y PEIC de cada institución.",
    descMax: "¡Hola! Soy <b>Max</b> 👦. Información legal e institucional de la U.E. Santa Bárbara y U.E. Libertador Bolívar.",
    tip: "Los datos registrados aquí aparecen automáticamente en los membretes de todos los documentos.",
    accionesSugeridas: [
      { texto: "🏛️ Datos DEA y PEIC" }
    ]
  },
  "Configuración Escolar": {
    titulo: "Configuración Escolar & Parámetros",
    icono: "bi-sliders",
    categoria: "Dirección y Sistema",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Configura los períodos académicos activos, fechas de corte de lapsos y parámetros generales de evaluación.",
    descMax: "¡Saludos! Soy <b>Max</b> 👦. Ajustes maestros del sistema. Controla la apertura y cierre de procesos administrativos del año lectivo.",
    tip: "Solo los administradores y directivos pueden modificar los períodos activos.",
    accionesSugeridas: [
      { texto: "⚙️ Período Escolar" }
    ]
  },
  "Cerebro de Sigma": {
    titulo: "Cerebro de SIGMA (IA Institucional)",
    icono: "bi-robot",
    categoria: "Dirección y Sistema",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Explora la base de conocimientos y módulos de inteligencia artificial que asisten a la comunidad educativa en SIGAE.",
    descMax: "¡Hola! Soy <b>Max</b> 👦. Aquí entrenamos las respuestas inteligentes de orientación sobre procesos de matrícula, horarios y trámites.",
    tip: "Puedes consultar a SIGMA en cualquier momento desde el asistente flotante.",
    accionesSugeridas: [
      { texto: "🧠 Entrenar Respuestas" }
    ]
  },
  "Calendario Escolar": {
    titulo: "Calendario Escolar Oficial MPPE",
    icono: "bi-calendar-range-fill",
    categoria: "Dirección y Sistema",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Planifica las actividades académicas, efemérides patrias, semanas pedagógicas y asuetos del cronograma oficial.",
    descMax: "¡Buen día! Soy <b>Max</b> 👦. Cronograma de eventos institucionales y fechas límite para entrega de recaudos y notas.",
    tip: "Puedes filtrar eventos por mes o por categoría pedagógica.",
    accionesSugeridas: [
      { texto: "📅 Ver Efemérides" }
    ]
  },
  "División Territorial": {
    titulo: "División Territorial Georreferenciada",
    icono: "bi-geo-alt-fill",
    categoria: "Dirección y Sistema",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Estructura geopolítica del estado Monagas: municipios, parroquias y sectores donde residen nuestras familias.",
    descMax: "¡Hola! Soy <b>Max</b> 👦. Base territorial para asociar direcciones de habitación, zonificación escolar y rutas de transporte.",
    tip: "Mantener actualizados los sectores facilita la asignación de transporte escolar.",
    accionesSugeridas: [
      { texto: "🗺️ Municipios y Sectores" }
    ]
  },
  "Panel de Control": {
    titulo: "Panel de Control Maestro & Servidor",
    icono: "bi-terminal-fill",
    categoria: "Dirección y Sistema",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Monitor de servicios, estado de la base de datos de Supabase y telemetría general de la plataforma.",
    descMax: "¡Qué tal! Soy <b>Max</b> 👦. Herramientas técnicas de diagnóstico, modo de mantenimiento institucional y registros de conexión.",
    tip: "Si vas a realizar una actualización masiva, activa temporalmente el modo mantenimiento.",
    accionesSugeridas: [
      { texto: "⚡ Estado de Servicios" }
    ]
  },
  "Instalación y Descargas": {
    titulo: "Instalación de SIGAE en Dispositivos",
    icono: "bi-download",
    categoria: "Dirección y Sistema",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Instala SIGAE como aplicación de escritorio en tu computadora o en tu teléfono móvil para un acceso rápido y seguro.",
    descMax: "¡Saludos! Soy <b>Max</b> 👦. Guía para instalar la Progressive Web App (PWA) y acceder sin necesidad de escribir la dirección en el navegador.",
    tip: "En Chrome o Edge, pulsa el ícono de instalar en la barra de direcciones para crear el acceso directo.",
    accionesSugeridas: [
      { texto: "💻 Instalar App" }
    ]
  },

  // Organización Escolar
  "Cargos Institucionales": {
    titulo: "Cargos Institucionales & Puestos",
    icono: "bi-person-badge-fill",
    categoria: "Organización Escolar",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Administra el catálogo de puestos docentes, directivos, administrativos y obreros de ambos planteles.",
    descMax: "¡Hola! Soy <b>Max</b> 👦. Define las responsabilidades y jerarquías laborales dentro del organigrama de las escuelas DEP Oriente.",
    tip: "Cada cargo institucional tiene un perfil de competencias asignado.",
    accionesSugeridas: [
      { texto: "👔 Ver Cargos" }
    ]
  },
  "Cadena Supervisoria": {
    titulo: "Cadena Supervisoria & Jerarquía",
    icono: "bi-diagram-3-fill",
    categoria: "Organización Escolar",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Visualiza la línea de supervisión y reporte entre directivos, coordinadores, docentes y personal de apoyo.",
    descMax: "¡Buen día! Soy <b>Max</b> 👦. Mapa organizativo claro para la toma de decisiones y canalización de solicitudes administrativas.",
    tip: "Facilita el flujo de aprobaciones de constancias y permisos del personal.",
    accionesSugeridas: [
      { texto: "📊 Ver Organigrama" }
    ]
  },
  "Gestión de Colectivos": {
    titulo: "Gestión de Colectivos de Trabajo",
    icono: "bi-people-fill",
    categoria: "Organización Escolar",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Coordina los equipos de trabajo escolar, brigadas pedagógicas, personal obrero y comités escolares.",
    descMax: "¡Hola! Soy <b>Max</b> 👦. Registro de colectivos activos para el mantenimiento, logística y resguardo de las instalaciones educativas.",
    tip: "Los colectivos pueden asignarse a turnos específicos en cada sede escolar.",
    accionesSugeridas: [
      { texto: "🤝 Ver Colectivos" }
    ]
  },
  "Mi Expediente": {
    titulo: "Expediente Profesional del Docente",
    icono: "bi-person-vcard-fill",
    categoria: "Gestión Docente",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Revisa tu historial laboral, síntesis curricular, años de servicio y asignaciones académicas vigentes.",
    descMax: "¡Hola! Soy <b>Max</b> 👦. Tu hoja de vida profesional digitalizada con comprobantes de acreditación y carga horaria.",
    tip: "Mantén actualizado tu número de teléfono y correo electrónico institucional.",
    accionesSugeridas: [
      { texto: "📑 Mi Hoja de Vida" }
    ]
  },

  // Seguridad
  "Gestión de Usuarios": {
    titulo: "Gestión de Usuarios & Cuentas",
    icono: "bi-person-gear",
    categoria: "Seguridad y Accesos",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Administra las cuentas de usuario de la plataforma, restablece contraseñas y asigna planteles de trabajo.",
    descMax: "¡Saludos! Soy <b>Max</b> 👦. Control de accesos y credenciales. Puedes activar o suspender usuarios según los protocolos de seguridad.",
    tip: "Recuerda utilizar contraseñas seguras que combinen letras, números y símbolos.",
    accionesSugeridas: [
      { texto: "👤 Crear Usuario" }
    ]
  },
  "Roles y Privilegios": {
    titulo: "Roles, Permisos y Emulación",
    icono: "bi-shield-lock-fill",
    categoria: "Seguridad y Accesos",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Configura qué herramientas puede ver, crear o editar cada rol (Administrador, Director, Docente, Representante).",
    descMax: "¡Hola! Soy <b>Max</b> 👦. Matriz de permisos granular. Utiliza la emulación de rol para verificar la experiencia visual de cada usuario.",
    tip: "La emulación te permite comprobar qué ve exactamente un representante o docente.",
    accionesSugeridas: [
      { texto: "🛡️ Matriz de Permisos" }
    ]
  },
  "Auditoría del Sistema": {
    titulo: "Auditoría & Trazabilidad de Eventos",
    icono: "bi-journal-code",
    categoria: "Seguridad y Accesos",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Registro cronológico detallado de todos los movimientos, cambios de notas, inscripciones y accesos al sistema.",
    descMax: "¡Hola! Soy <b>Max</b> 👦. Bitácora de seguridad con fecha, hora, dirección IP y usuario responsable de cada acción registrada.",
    tip: "Esta herramienta garantiza la total transparencia administrativa de los planteles.",
    accionesSugeridas: [
      { texto: "📜 Ver Bitácora" }
    ]
  },
  "Mi Perfil": {
    titulo: "Mi Perfil de Usuario",
    icono: "bi-person-circle",
    categoria: "Seguridad y Accesos",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Actualiza tu información personal, foto de perfil y preferencias dentro del sistema SIGAE.",
    descMax: "¡Hola! Soy <b>Max</b> 👦. Gestiona tus datos de acceso y revisa los roles y planteles a los que tienes autorización.",
    tip: "Si cambias tus datos, guarda los cambios antes de salir de la pantalla.",
    accionesSugeridas: [
      { texto: "✏️ Editar Perfil" }
    ]
  },
  "Métodos de Acceso": {
    titulo: "Métodos de Acceso & Seguridad",
    icono: "bi-key-fill",
    categoria: "Seguridad y Accesos",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Configura tus métodos de autenticación, cambio periódico de clave y verificación de identidad.",
    descMax: "¡Hola! Soy <b>Max</b> 👦. Protege tu cuenta con métodos de acceso modernos y opciones de recuperación seguras.",
    tip: "No compartas tu clave con terceros para proteger la información confidencial de los alumnos.",
    accionesSugeridas: [
      { texto: "🔐 Cambiar Clave" }
    ]
  },

  // Diseños
  "Editor de Constancias": {
    titulo: "Editor de Constancias Oficiales",
    icono: "bi-file-earmark-pdf-fill",
    categoria: "Diseños & Formatos",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Emite y personaliza las constancias de estudio, inscripción y buena conducta con firmas y código QR.",
    descMax: "¡Hola! Soy <b>Max</b> 👦. Generador de documentos oficiales con membrete del MPPE y validación digital instantánea.",
    tip: "Puedes imprimir directamente en formato carta o exportar a archivo PDF.",
    accionesSugeridas: [
      { texto: "📄 Generar Constancia" }
    ]
  },
  "Carta de Aceptación": {
    titulo: "Carta de Aceptación con Código QR",
    icono: "bi-patch-check-fill",
    categoria: "Diseños & Formatos",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Genera la carta oficial de asignación de cupo con código QR para que los representantes formalicen su inscripción.",
    descMax: "¡Hola! Soy <b>Max</b> 👦. Documento probatorio de cupo con el sello oficial del departamento de control de estudios.",
    tip: "El código QR permite a la escuela verificar la validez del documento al consignarlo.",
    accionesSugeridas: [
      { texto: "🖨️ Imprimir Carta" }
    ]
  },
  "Carnet Estudiantil": {
    titulo: "Carnet Estudiantil Digital",
    icono: "bi-person-badge",
    categoria: "Diseños & Formatos",
    descZoe: "¡Hola! Soy <b>Zoe</b> 👧. Diseña y genera el carnet de identificación escolar con foto del alumno, grado y código de barras.",
    descMax: "¡Hola! Soy <b>Max</b> 👦. Identificación escolar moderna para acceso a las instalaciones y servicio de transporte.",
    tip: "Puedes imprimir carnets en lote por sección o grado.",
    accionesSugeridas: [
      { texto: "🪪 Emitir Carnets" }
    ]
  }
};

/**
 * Función auxiliar para obtener la información contextual según la URL
 */
export function obtenerInfoModulo(pathname: string): { nombre: string; categoria: string; info: ModuloInfo } | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0 || pathname === '/' || pathname === '/login') {
    return null;
  }

  let modName = '';
  let catName = '';

  if (parts[0] === 'categoria') {
    catName = decodeURIComponent(parts[1] || '');
    modName = decodeURIComponent(parts[2] || parts[1] || '');
  } else if (parts[0] === 'instalar-sigae') {
    modName = 'Instalación y Descargas';
    catName = 'Dirección y Sistema';
  } else if (parts[0] === 'redactor-mensajes-admision') {
    modName = 'Mensajes de Admisión';
    catName = 'Gestión Estudiantil';
  } else if (parts[0] === 'orientaciones-nuevos-ingresos') {
    modName = 'Orientaciones Nuevos Ingresos';
    catName = 'Gestión Estudiantil';
  } else {
    modName = parts[0];
  }

  const info = DESCRIPCIONES_MODULOS[modName] || {
    titulo: modName,
    icono: "bi-app-indicator",
    categoria: catName || "Módulo Institucional",
    descZoe: `¡Hola! Soy <b>Zoe</b> 👧. Te doy la bienvenida al módulo de <b>${modName}</b>. Aquí puedes gestionar las opciones y herramientas correspondientes a tu perfil.`,
    descMax: `¡Qué tal! Soy <b>Max</b> 👦. Estás en la sección de <b>${modName}</b>. Utiliza los paneles y opciones de esta pantalla para llevar a cabo tus gestiones con facilidad.`,
    tip: "Si tienes alguna duda sobre esta sección, pregúntamela aquí en el chat."
  };

  return { nombre: modName, categoria: catName, info };
}
