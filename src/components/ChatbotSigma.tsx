import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Fuse from 'fuse.js';
import { supabase } from '../lib/supabase';
import { usePermisos } from '../hooks/usePermisos';
import { ModulosSistema } from '../pages/CategoryDashboard';
/**
 * Figura Visual Oficial de SIGMA - Opción 3 Seleccionada
 * (100% Transparente, sin fondo, ojos animados, cabello y estructura iluminada)
 */
export const SigmaFiguraVisual: React.FC<{ 
  style?: React.CSSProperties; 
  className?: string;
  animado?: boolean;
}> = ({ style, className = "", animado = true }) => (
  <div className={`sigma-mascot-container ${className}`} style={style}>
    <img 
      src="/sigma-avatar.png?v=opcion4-mentora-doble-mano" 
      alt="SIGMA - La Mentora Esbelta" 
      className="sigma-mascot-base"
      draggable={false}
    />
    {animado && (
      <div className="sigma-anim-layer">
        {/* Destello de energía en el símbolo Sigma levitante */}
        <div className="sigma-quantum-core-glow" style={{ top: '40%', left: '32%', width: '14%', height: '14%' }} />
      </div>
    )}
  </div>
);

export const SigmaFiguraAnimada = SigmaFiguraVisual;

export const ChatbotSigma = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tienePermiso, tienePermisoEnEscuela } = usePermisos();

  const [activo, setActivo] = useState(false);
  const [pensando, setPensando] = useState(false);
  const [hablando, setHablando] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [minimizado, setMinimizado] = useState(false);

  // Estados para Navegación y Recomendaciones Interactivas
  const [modulosRecomendados, setModulosRecomendados] = useState<any[]>([]);
  const [chipsSugeridos, setChipsSugeridos] = useState<Array<{ texto: string; accion: () => void }>>([]);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const [position, setPosition] = useState({ x: window.innerWidth - 120, y: window.innerHeight - 150 });
  const [mensaje, setMensaje] = useState('¡Hola! Conectando mis sistemas...');
  const [acciones, setAcciones] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });
  const dragMoved = useRef(false);
  const lastPath = useRef(location.pathname);
  const userInteractedRef = useRef(false);
  const autoRetireTimerRef = useRef<any>(null);
  
  const inactividadTimerRef = useRef<any>(null);
  const isHoveringBubbleRef = useRef(false);
  const isInputFocusedRef = useRef(false);
  
  const [conocimientoCache, setConocimientoCache] = useState<any[]>([]);
  const [fuseInstance, setFuseInstance] = useState<Fuse<any> | null>(null);


  // Carga de conocimientos y filtrado por rol
  const cargarConocimiento = async () => {
    try {
      const { data, error } = await supabase
        .from('sigma_conocimiento')
        .select('*');

      if (error) throw error;
      if (data) {
        let userRole = 'invitado';
        try {
          const usStr = localStorage.getItem('usuario_sigae');
          if (usStr) {
            const us = JSON.parse(usStr);
            if (us && us.rol) {
              userRole = us.rol.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            }
          }
        } catch (e) {}

        const conocimientoFiltrado = data.filter((item: any) => {
          if (!item.roles_permitidos || item.roles_permitidos.length === 0) return true;
          return item.roles_permitidos.some((rolPermitido: string) => 
            userRole.includes(rolPermitido.toLowerCase())
          );
        });

        setConocimientoCache(conocimientoFiltrado);

        const options = {
          includeScore: true,
          threshold: 0.4,
          keys: [
            { name: 'palabras_clave', weight: 0.7 },
            { name: 'tema', weight: 0.3 }
          ]
        };
        const fuse = new Fuse(conocimientoFiltrado, options);
        setFuseInstance(fuse);
      }
    } catch (e) {
      console.error("Error cargando conocimiento de Sigma:", e);
    }
  };

  // Mapeo semántico de palabras clave para navegación interactiva
  const KEYWORDS_MAP: Record<string, string[]> = {
    "Perfil de la Escuela": ["escuela", "plantel", "colegio", "dea", "director", "directora", "mision", "vision", "peic", "sede"],
    "Configuración Escolar": ["configuracion", "parametros", "lapsos", "periodos", "periodo", "niveles", "fases", "año", "ano", "escolar"],
    "Cerebro de Sigma": ["sigma", "cerebro", "ia", "inteligencia", "preguntas", "respuestas", "conocimiento", "bot"],
    "Calendario Escolar": ["calendario", "fechas", "feriados", "efemerides", "actividades", "eventos"],
    "División Territorial": ["division", "territorio", "estados", "municipios", "parroquias", "ciudades", "sectores", "geografia", "mapa"],
    "Instalación y Descargas": ["instalar", "descargas", "instalador", "desktop", "pwa", "app", "aplicacion"],
    "Panel de Control": ["panel", "control", "estadisticas", "metricas", "resumen", "kpi", "graficos"],
    "Grados y Salones": ["grados", "salones", "aulas", "secciones", "cursos", "ambientes"],
    "Espacios Escolares": ["espacios", "ambientes", "canchas", "laboratorios", "biblioteca", "instalaciones"],
    "Carga de Notas y Calificaciones": ["notas", "calificaciones", "boletin", "evaluacion", "cargar notas", "promedios", "materias"],
    "Gestión de Matrícula": ["matricula", "estudiantes activos", "listado estudiantes", "censo"],
    "Expediente Estudiantil": ["expediente", "historial alumno", "estudiante", "documentos alumno", "hoja de vida"],
    "Solicitud de Cupos": ["cupos", "solicitar cupo", "nuevo ingreso", "solicitud"],
    "Vincular Estudiante": ["vincular", "asignar", "representante", "hijo", "representado", "vincular estudiante"],
    "Actualización de Datos": ["actualizacion", "actualizar datos", "ficha", "datos personales", "censo"],
    "Mis Solicitudes": ["mis solicitudes", "estado de solicitud", "seguimiento cupo"],
    "Gestión de Admisiones": ["admisiones", "admitir", "aceptar cupo", "inscripciones", "inscribir"],
    "Cargos Institucionales": ["cargos", "personal", "puestos", "docentes", "obreros", "administrativos"],
    "Cadena Supervisoria": ["cadena", "supervisoria", "jerarquia", "organigrama", "jefes", "supervisores"],
    "Mi Expediente": ["mi expediente", "datos docente", "mi curriculum", "mis datos laborales"],
    "Gestión de Colectivos": ["colectivos", "colectivo", "obreros", "grupos"],
    "Transporte Escolar": ["transporte", "ruta", "rutas", "bus", "autobus", "paradas", "chofer", "unidad"],
    "Mi Perfil": ["perfil", "mi cuenta", "mis datos", "usuario actual"],
    "Métodos de Acceso": ["metodos de acceso", "seguridad", "doble factor", "recuperacion"],
    "Gestión de Usuarios": ["usuarios", "crear usuario", "clave", "contraseña", "resetear", "restablecer", "bloquear"],
    "Roles y Privilegios": ["roles", "privilegios", "permisos", "emulacion", "emular"],
    "Preguntas de Seguridad": ["preguntas", "seguridad", "respuestas secretas"],
    "Auditoría del Sistema": ["auditoria", "logs", "movimientos", "historial", "acciones", "quien hizo"]
  };

  // Índice de herramientas disponibles con permisos para búsqueda interactiva
  const toolsIndex = React.useMemo(() => {
    const list: Array<{
      categoria: string;
      submodulo: string;
      icono: string;
      categoriaIcono: string;
      color: string;
      desc?: string;
      url: string;
      keywords: string[];
    }> = [];

    Object.entries(ModulosSistema).forEach(([catNombre, catData]: [string, any]) => {
      (catData.items || []).forEach((item: any) => {
        let tieneAcceso = false;
        if (item.vista === 'Gestión de Colectivos') {
          tieneAcceso = tienePermisoEnEscuela('sb', item.vista, 'ver') || tienePermisoEnEscuela('lb', item.vista, 'ver');
        } else {
          tieneAcceso = tienePermiso(item.vista, 'ver');
        }

        if (tieneAcceso) {
          list.push({
            categoria: catNombre,
            submodulo: item.vista,
            icono: item.icono || catData.icono || 'bi-app',
            categoriaIcono: catData.icono || 'bi-folder',
            color: catData.color || '#0066FF',
            desc: item.desc || catData.desc,
            url: `/categoria/${encodeURIComponent(catNombre)}/${encodeURIComponent(item.vista)}`,
            keywords: KEYWORDS_MAP[item.vista] || []
          });
        }
      });
    });
    return list;
  }, [tienePermiso, tienePermisoEnEscuela]);

  const navegarInteractivo = (item: any) => {
    marcarInteraccionUsuario();
    setHablando(true);
    setMensaje(`🚀 <b>¡Excelente!</b> Abriendo <b>${item.submodulo}</b>...`);
    setModulosRecomendados([]);
    setChipsSugeridos([]);
    setTimeout(() => {
      navigate(item.url);
      setActivo(false);
      setHablando(false);
    }, 450);
  };

  const abrirChatSigma = () => {
    marcarInteraccionUsuario();
    setMinimizado(false);
    setActivo(true);
    setHablando(true);
    setTimeout(() => setHablando(false), 1200);

    setMensaje(`¡Hola! Dime qué necesitas gestionar o qué duda tienes sobre SIGAE. Como tu asistente virtual con IA, puedo orientarte y acompañarte directamente a cualquier sección:`);
    setModulosRecomendados(toolsIndex.slice(0, 4));
    setAcciones([]);
    setChipsSugeridos([
      { texto: '🚌 Transporte Escolar', accion: () => procesarPreguntaUsuario('transporte') },
      { texto: '👥 Usuarios y Claves', accion: () => procesarPreguntaUsuario('usuarios') },
      { texto: '🏫 Grados y Salones', accion: () => procesarPreguntaUsuario('grados') },
      { texto: '📝 Carga de Notas', accion: () => procesarPreguntaUsuario('notas') },
      { texto: '⚙️ Configuración Escolar', accion: () => procesarPreguntaUsuario('configuracion') },
      { texto: '📋 Ver mis módulos', accion: () => procesarPreguntaUsuario('mis modulos') }
    ]);
    setTimeout(() => chatInputRef.current?.focus(), 80);
  };

  // Cargar datos al montar y escuchar eventos de cambio de conocimiento y apertura de chat
  useEffect(() => {
    cargarConocimiento();

    const refrescarCanal = () => {
      cargarConocimiento();
    };

    const handleAbrirChat = () => {
      abrirChatSigma();
    };

    window.addEventListener('sigae-sigma-refresh', refrescarCanal);
    window.addEventListener('sigae-abrir-sigma-busqueda', handleAbrirChat);
    return () => {
      window.removeEventListener('sigae-sigma-refresh', refrescarCanal);
      window.removeEventListener('sigae-abrir-sigma-busqueda', handleAbrirChat);
      if (autoRetireTimerRef.current) clearTimeout(autoRetireTimerRef.current);
    };
  }, [toolsIndex]);

  // Saludo de bienvenida y presentación automática al ingresar
  useEffect(() => {
    let saludo = "¡Hola! Soy <b>SIGMA</b>. Tócame si necesitas ayuda o deseas ir a algún módulo.";
    
    if (conocimientoCache.length > 0) {
      const saludoBD = conocimientoCache.find(c => 
        c.tema && (
          c.tema.toLowerCase() === 'bienvenida' || 
          c.tema.toLowerCase() === 'saludo' || 
          c.tema.toLowerCase() === 'mensaje de bienvenida'
        )
      );

      if (saludoBD) {
        saludo = saludoBD.respuesta;
        let userName = 'visitante';
        try {
          const usStr = localStorage.getItem('usuario_sigae');
          if (usStr) {
            const us = JSON.parse(usStr);
            if (us && (us.nombre || us.nombres)) {
              userName = (us.nombre || us.nombres).split(' ')[0];
            }
          }
        } catch (e) {}
        saludo = saludo.replace(/\{\s*nombre\s*\}/gi, userName);
      }
    }
    setMensaje(saludo);
    setAcciones([]);
    setModulosRecomendados([]);
    setChipsSugeridos([
      { texto: '💬 ¿Qué puedes hacer?', accion: () => procesarPreguntaUsuario('que puedes hacer') },
      { texto: '🧭 Tour de Orientación', accion: () => { marcarInteraccionUsuario(); window.dispatchEvent(new CustomEvent('sigae-iniciar-tour')); } },
      { texto: '🚀 Mis módulos activos', accion: () => procesarPreguntaUsuario('mis modulos') },
      { texto: '🏫 ¿En qué escuela estoy?', accion: () => procesarPreguntaUsuario('escuela') }
    ]);

    // Cargar posición guardada
    let savedX = parseInt(localStorage.getItem('sigma_pos_x') || '');
    let savedY = parseInt(localStorage.getItem('sigma_pos_y') || '');
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 120;
    
    if (isNaN(savedX) || savedX < 0 || savedX > maxX) savedX = maxX - 20;
    if (isNaN(savedY) || savedY < 0 || savedY > maxY) savedY = maxY - 20;
    setPosition({ x: savedX, y: savedY });

    // Verificar si Sigma ya se presentó en esta sesión al ingresar
    const yaPresentado = sessionStorage.getItem('sigma_presentado') === 'true';
    const presentandoAhora = sessionStorage.getItem('sigma_presentando_ahora') === 'true';

    if (!yaPresentado || presentandoAhora) {
      // Al ingresar al sistema: breve saludo discreto que se retira rápido
      setMinimizado(false);
      setActivo(true);
      sessionStorage.setItem('sigma_presentado', 'true');
      sessionStorage.setItem('sigma_presentando_ahora', 'true');

      if (!yaPresentado) {
        userInteractedRef.current = false;
      }

      if (autoRetireTimerRef.current) clearTimeout(autoRetireTimerRef.current);

      // Desaparecer rápidamente tras 2.5 segundos para no interferir con la pantalla
      autoRetireTimerRef.current = setTimeout(() => {
        if (!userInteractedRef.current) {
          sessionStorage.removeItem('sigma_presentando_ahora');
          setActivo(false);
          setMinimizado(true);
          localStorage.setItem('sigma_minimizada', 'true');
        } else {
          sessionStorage.removeItem('sigma_presentando_ahora');
        }
      }, 2500);
    } else {
      // Si ya se presentó previamente en la sesión, respetar el estado guardado
      const isMin = localStorage.getItem('sigma_minimizada') === 'true';
      setMinimizado(isMin);
      setActivo(!isMin);
    }
  }, [conocimientoCache]);

  // Registro de cambio de sección silencioso (sin desplegar mensajes invasivos en pantalla)
  useEffect(() => {
    if (location.pathname === lastPath.current) return;
    lastPath.current = location.pathname;
  }, [location.pathname]);

  const cancelarTemporizadorInactividad = () => {
    if (inactividadTimerRef.current) {
      clearTimeout(inactividadTimerRef.current);
      inactividadTimerRef.current = null;
    }
  };

  const reiniciarTemporizadorInactividad = (segundos = 10) => {
    cancelarTemporizadorInactividad();

    // Si el usuario tiene el cursor sobre la conversación o está con el input enfocado, no cerrar
    if (isHoveringBubbleRef.current || isInputFocusedRef.current) {
      return;
    }

    inactividadTimerRef.current = setTimeout(() => {
      if (!isHoveringBubbleRef.current && !isInputFocusedRef.current) {
        setActivo(false);
      }
    }, segundos * 1000);
  };

  useEffect(() => {
    if (activo) {
      reiniciarTemporizadorInactividad(10);
    } else {
      cancelarTemporizadorInactividad();
    }
    return () => {
      cancelarTemporizadorInactividad();
    };
  }, [activo, mensaje]);

  const marcarInteraccionUsuario = () => {
    userInteractedRef.current = true;
    if (autoRetireTimerRef.current) clearTimeout(autoRetireTimerRef.current);
    sessionStorage.removeItem('sigma_presentando_ahora');
    reiniciarTemporizadorInactividad(10);
  };

  // Drag logic handlers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.sigma-speech-bubble')) return;
    if ((e.target as HTMLElement).closest('.sigma-btn-minimize')) return;
    
    marcarInteraccionUsuario();
    setIsDragging(true);
    dragMoved.current = false;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStart.current = { x: clientX, y: clientY };
    initialPos.current = { x: position.x, y: position.y };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const dx = clientX - dragStart.current.x;
      const dy = clientY - dragStart.current.y;

      let newLeft = initialPos.current.x + dx;
      let newTop = initialPos.current.y + dy;

      const maxX = window.innerWidth - 100;
      const maxY = window.innerHeight - 120;

      if (newLeft < 0) newLeft = 0;
      if (newTop < 0) newTop = 0;
      if (newLeft > maxX) newLeft = maxX;
      if (newTop > maxY) newTop = maxY;

      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        dragMoved.current = true;
      }

      setPosition({ x: newLeft, y: newTop });
    };

    const handleEnd = (_e: MouseEvent | TouchEvent) => {
      setIsDragging(false);
      localStorage.setItem('sigma_pos_x', String(position.x));
      localStorage.setItem('sigma_pos_y', String(position.y));

      // Si el movimiento fue mínimo, tratar como click
      if (!dragMoved.current) {
        if (minimizado) {
          restaurar();
        } else {
          setActivo(prev => !prev);
        }
      }
    };

    window.addEventListener('mousemove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, position, minimizado]);

  const minimizar = (e: React.MouseEvent) => {
    e.stopPropagation();
    marcarInteraccionUsuario();
    setMinimizado(true);
    setActivo(false);
    localStorage.setItem('sigma_minimizada', 'true');
  };

  const restaurar = () => {
    marcarInteraccionUsuario();
    setMinimizado(false);
    setActivo(true);
    localStorage.setItem('sigma_minimizada', 'false');
  };



  // Procesar preguntas del usuario y búsqueda interactiva de módulos
  const procesarPreguntaUsuario = (textoManual: string | null = null) => {
    const query = (textoManual !== null ? textoManual : inputValue).trim();
    if (!query) return;

    marcarInteraccionUsuario();
    setInputValue('');
    setPensando(true);
    setMensaje("<div class='text-center py-2'><span class='spinner-border spinner-border-sm text-primary'></span> <i>Procesando tu solicitud y consultando mis módulos...</i></div>");
    setAcciones([]);
    setModulosRecomendados([]);
    setChipsSugeridos([]);
    setActivo(true);

    const queryClean = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Si pregunta por capacidades o qué puede hacer
    const pideCapacidades = /\b(que puedes hacer|que haces|para que sirves|ayuda|funciones|capacidades|quien eres)\b/i.test(queryClean);
    if (pideCapacidades) {
      setTimeout(() => {
        setPensando(false);
        setHablando(true);
        setTimeout(() => setHablando(false), 1500);
        setMensaje(`¡Hola! Soy <b>SIGMA</b>, tu asistente de Inteligencia Artificial para SIGAE.<br><br>
          Puedo orientarte sobre cualquier proceso escolar, explicarte términos del sistema y acompañarte al instante al módulo que necesites. Solo dime qué deseas hacer (por ejemplo: <i>"cargar notas"</i>, <i>"gestionar colectivos"</i>, <i>"ver transporte"</i> o <i>"crear usuarios"</i>).<br><br>
          Aquí tienes algunos accesos recomendados para tu perfil:`);
        setModulosRecomendados(toolsIndex.slice(0, 4));
        setAcciones([]);
        setChipsSugeridos([
          { texto: '📋 Ver todos mis módulos', accion: () => procesarPreguntaUsuario('mis modulos') },
          { texto: '🏫 ¿En qué escuela estoy?', accion: () => procesarPreguntaUsuario('escuela') },
          { texto: '🧭 Tour de Orientación', accion: () => { marcarInteraccionUsuario(); window.dispatchEvent(new CustomEvent('sigae-iniciar-tour')); } }
        ]);
      }, 350);
      return;
    }

    // Limpiamos preámbulos y palabras de relleno para detectar el tema/módulo central
    const queryFiltrada = queryClean
      .replace(/\b(donde|dónde|puedo|ver|esta|está|estan|están|como|cómo|hago|para|quiero|necesito|muestrame|muéstrame|abrir|ir|al|a|la|el|los|las|de|del|en|un|una|por|favor|busca|buscame|búscame|consultar|gestionar)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    const terminoBusqueda = queryFiltrada.length >= 2 ? queryFiltrada : queryClean;

    // 0. BÚSQUEDA INTELIGENTE DE MÓDULOS INTEGRADA EN LAS RESPUESTAS
    const modulosCoincidentes = toolsIndex.filter(t => {
      const sub = t.submodulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const cat = t.categoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const desc = (t.desc || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const keys = (t.keywords || []).map(k => k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

      const matchExacto = sub.includes(queryClean) || cat.includes(queryClean) || desc.includes(queryClean);
      const matchFiltrado = terminoBusqueda ? (sub.includes(terminoBusqueda) || cat.includes(terminoBusqueda) || desc.includes(terminoBusqueda)) : false;
      const matchKeywords = keys.some(k => queryClean.includes(k) || k.includes(queryClean) || (terminoBusqueda && (terminoBusqueda.includes(k) || k.includes(terminoBusqueda))));
      return matchExacto || matchFiltrado || matchKeywords;
    });

    // Si coincide con herramientas del sistema, responder conversacionalmente como IA:
    if (modulosCoincidentes.length > 0) {
      setTimeout(() => {
        setPensando(false);
        setHablando(true);
        setTimeout(() => setHablando(false), 2000);

        if (modulosCoincidentes.length === 1) {
          const m = modulosCoincidentes[0];
          const descHtml = m.desc ? `<div class="p-2 my-2 rounded bg-light border-start border-3 border-primary text-secondary small">${m.desc}</div>` : '';
          setMensaje(`¡Por supuesto! Para gestionar eso, el módulo indicado es <b>${m.submodulo}</b> (en la sección de <i>${m.categoria}</i>).${descHtml}Toca la tarjeta a continuación y te llevaré de inmediato:`);
          setModulosRecomendados([m]);
        } else {
          setMensaje(`¡Entendido! Encontré <b>${modulosCoincidentes.length} secciones</b> en SIGAE disponibles para tu rol que pueden ayudarte. Pulsa sobre la que deseas abrir:`);
          setModulosRecomendados(modulosCoincidentes.slice(0, 4));
        }

        setAcciones([]);
        setChipsSugeridos([
          { texto: '📋 Ver todos mis módulos', accion: () => procesarPreguntaUsuario('mis modulos') },
          { texto: '💬 Hacer otra consulta', accion: () => { setModulosRecomendados([]); setMensaje('Dime qué otra duda o requerimiento tienes y con gusto te oriento:'); } }
        ]);
      }, 400);
      return;
    }

    // 1. CHEQUEAR PALABRAS CLAVE DEL DICCIONARIO
    const pideDiccionario = /\b(diccionario|glosario|terminos|conceptos|definiciones)\b/i.test(queryClean);
    if (pideDiccionario) {
      setTimeout(() => {
        setPensando(false);
        const terminosList = conocimientoCache
          .filter(item => {
            if (!item || !item.tema || typeof item.tema !== 'string') return false;
            const t = item.tema.toLowerCase();
            return !t.includes('bienvenida') && !t.includes('saludo') && !t.includes('despedida') && !t.includes('hola');
          })
          .map(item => item.tema)
          .filter((value, index, self) => self.indexOf(value) === index);
        
        const terminosHtml = terminosList.map(t => `<li>${t}</li>`).join('');
        
        setMensaje(`📚 <b>Glosario Educativo y Guía de SIGAE</b><br/><br/>
          Aquí tienes una lista de conceptos y temas del ámbito escolar que puedo explicarte. Escribe su nombre o pregúntame sobre ellos:<br/><br/>
          <ul>${terminosHtml}</ul>`);
        
        const glosarioItems = conocimientoCache.filter(item => {
          if (!item || !item.tema || typeof item.tema !== 'string') return false;
          const t = item.tema.toLowerCase();
          return !t.includes('bienvenida') && !t.includes('saludo') && !t.includes('despedida') && !t.includes('hola');
        });

        const quickActions = glosarioItems
          .slice(0, 4)
          .map(item => ({
            id: item.id,
            tipo: 'pregunta',
            valor: item.tema,
            tema: (item.tema || '').includes('(') ? (item.tema || '').split(' ')[0] : (item.tema || '').substring(0, 15),
            esAlternativa: true
          }));

        setAcciones(quickActions);
      }, 500);
      return;
    }
    
    // 2. DETECTAR SI PREGUNTA POR LA ESCUELA O MÓDULOS ACTIVOS
    const preguntaEscuela = /\b(escuela|plantel|colegio|sede|institucion|institución|donde estoy|dónde estoy|en que escuela|en qué escuela)\b/i.test(queryClean);
    const preguntaModulos = /\b(modulo|módulo|modulos|módulos|seccion|sección|activo|permiso|acceso|que puedo hacer|qué puedo hacer|mis accesos)\b/i.test(queryClean);

    if (preguntaEscuela || preguntaModulos) {
      setTimeout(() => {
        setPensando(false);
        const schoolCode = localStorage.getItem('sigae_escuela_codigo') || 'sb';
        const schoolName = schoolCode === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
        
        let userRole = 'Invitado';
        let userName = 'visitante';
        let userObj: any = null;
        try {
          const usStr = localStorage.getItem('usuario_sigae');
          if (usStr) {
            userObj = JSON.parse(usStr);
            userRole = userObj.rol || 'Invitado';
            userName = (userObj.nombre || userObj.nombres || 'visitante').split(' ')[0];
          }
        } catch (e) {}

        if (preguntaEscuela && !preguntaModulos) {
          setMensaje(`Hola <b>${userName}</b>, actualmente has ingresado a la institución: <b>${schoolName}</b> (Código: <b>${schoolCode.toUpperCase()}</b>).<br/><br/>Toda la información y registros que gestiones corresponden a esta sede.`);
          const escuelaTool = toolsIndex.find(t => t.submodulo === 'Perfil de la Escuela');
          if (escuelaTool) {
            setModulosRecomendados([escuelaTool]);
          }
        } else if (preguntaModulos && !preguntaEscuela) {
          if (toolsIndex.length > 0) {
            setMensaje(`Hola <b>${userName}</b>, con tu rol de <b>${userRole}</b> en <b>${schoolName}</b> tienes <b>${toolsIndex.length} herramientas activas</b>. Toca cualquiera para ir directamente:`);
            setModulosRecomendados(toolsIndex.slice(0, 5));
          } else {
            setMensaje(`Hola <b>${userName}</b>, actualmente no posees ningún módulo con permisos activos en <b>${schoolName}</b>.`);
            setModulosRecomendados([]);
          }
          setAcciones([]);
          setChipsSugeridos([
            { texto: '📋 Ver todos mis módulos', accion: () => procesarPreguntaUsuario('mis modulos') },
            { texto: '🏫 Ver datos de la escuela', accion: () => procesarPreguntaUsuario('escuela') }
          ]);
        } else {
          setMensaje(`Te encuentras en la institución: <b>${schoolName}</b> (Código: <b>${schoolCode.toUpperCase()}</b>) con el rol de <b>${userRole}</b>.<br/><br/>Tienes <b>${toolsIndex.length} módulos disponibles</b> en el sistema:`);
          setModulosRecomendados(toolsIndex.slice(0, 4));
          setAcciones([]);
        }
      }, 450);
      return;
    }

    // 3. CONSULTA A LA BASE DE CONOCIMIENTO (FUSE SEARCH)
    setTimeout(() => {
      setPensando(false);

      if (!fuseInstance) {
        setMensaje("En este momento estoy desconectada de la base de datos central, pero sigo disponible para orientarte en tus módulos.");
        return;
      }

      const resultados = fuseInstance.search(query);

      if (resultados.length > 0) {
        const topMatches = resultados.slice(0, 3).map(r => r.item);
        ejecutarRespuesta(topMatches);
      } else {
        registrarPreguntaPendiente(query);
      }
    }, 500);
  };

  const registrarPreguntaPendiente = async (query: string) => {
    setMensaje(`Aún no tengo una respuesta exacta para "<b>${query}</b>", pero ya registré tu consulta para que la directiva me la enseñe pronto.<br><br>¿Deseas que te oriente hacia alguno de tus módulos principales?`);
    setAcciones([]);
    setModulosRecomendados(toolsIndex.slice(0, 3));
    setChipsSugeridos([
      { texto: '📋 Ver módulos disponibles', accion: () => procesarPreguntaUsuario('mis modulos') },
      { texto: '🧭 Iniciar Tour de Orientación', accion: () => { marcarInteraccionUsuario(); window.dispatchEvent(new CustomEvent('sigae-iniciar-tour')); } }
    ]);
    try {
      const { error } = await supabase.from('sigma_preguntas_pendientes').insert([
        { pregunta: query, estado: 'pendiente' }
      ]);
      if (!error) {
        window.dispatchEvent(new CustomEvent('sigae-sigma-pending-refresh'));
      }
    } catch (e) {
      console.error("Error registrando pregunta pendiente:", e);
    }
  };

  const ejecutarRespuesta = (items: any[]) => {
    marcarInteraccionUsuario();
    if (!items || items.length === 0) return;
    const item = items[0];
    let htmlRespuesta = item?.respuesta || '';

    let userName = 'visitante';
    try {
      const usStr = localStorage.getItem('usuario_sigae');
      if (usStr) {
        const us = JSON.parse(usStr);
        if (us && (us.nombre || us.nombres)) {
          userName = (us.nombre || us.nombres).split(' ')[0];
        }
      }
    } catch (e) {}

    htmlRespuesta = htmlRespuesta.replace(/\{\s*nombre\s*\}/gi, userName);
    setMensaje(htmlRespuesta);

    const listAcciones: any[] = [];
    
    // Acción principal
    if (item?.accion_tipo && item?.accion_valor) {
      const vistaInfo = getVistaFromKeyword(item.accion_valor);
      const allowed = tienePermiso(vistaInfo, 'ver') || vistaInfo === 'Inicio' || vistaInfo === 'Mi Perfil' || !vistaInfo;
      listAcciones.push({
        id: item.id,
        tipo: item.accion_tipo,
        valor: item.accion_valor,
        tema: item.tema || '',
        allowed
      });
    }

    // Sugerencias alternativas
    if (items.length > 1) {
      for (let i = 1; i < items.length; i++) {
        const alt = items[i];
        if (!alt) continue;
        const vistaInfoAlt = getVistaFromKeyword(alt.accion_valor || '');
        const allowedAlt = tienePermiso(vistaInfoAlt, 'ver') || vistaInfoAlt === 'Inicio' || vistaInfoAlt === 'Mi Perfil' || !vistaInfoAlt;
        listAcciones.push({
          id: alt.id,
          tipo: alt.accion_tipo || 'pregunta',
          valor: alt.accion_valor || alt.tema || '',
          tema: alt.tema || '',
          allowed: allowedAlt,
          esAlternativa: true
        });
      }
    }

    setAcciones(listAcciones);
    setHablando(true);
    setTimeout(() => setHablando(false), 2000);
  };

  const getVistaFromKeyword = (keyword: string | null | undefined): string => {
    if (!keyword || typeof keyword !== 'string') return '';
    const claveLimpia = keyword.replace('#', '').toLowerCase().trim();
    const mapToView: { [key: string]: string } = {
      'escuela': 'Perfil de la Escuela',
      'roles': 'Roles y Privilegios',
      'usuarios': 'Gestión de Usuarios',
      'auditoria': 'Auditoría del Sistema',
      'calendario': 'Calendario Escolar',
      'espacios': 'Espacios Escolares',
      'salones': 'Grados y Salones',
      'matricula': 'Gestión de Matrícula',
      'admisiones': 'Gestión de Admisiones',
      'inscripcion': 'Gestión de Admisiones',
      'inscripciones': 'Gestión de Admisiones',
      'actualizacion': 'Actualización de Datos',
      'notas': 'Carga de Notas y Calificaciones',
      'asignacion': 'Vincular Estudiante',
      'expediente': 'Expediente Estudiantil',
      'expediente_docente': 'Mi Expediente',
      'cargos': 'Cargos Institucionales',
      'jerarquia': 'Cadena Supervisoria',
      'colectivos': 'Gestión de Colectivos',
      'transporte': 'Transporte Escolar',
      'solicitud': 'Solicitud de Cupos',
      'vincular': 'Vincular Estudiante',
      'mis_solicitudes': 'Mis Solicitudes',
      'sigma': 'Cerebro de Sigma',
      'inicio': 'Inicio',
      'panel': 'Panel de Control'
    };
    return mapToView[claveLimpia] || keyword;
  };

  const mapVistaToUrl = (vista: string): string => {
    if (!vista || typeof vista !== 'string') return '';
    const v = vista.toLowerCase().trim();
    if (v === 'inicio' || v === 'panel principal' || v === '/') return '/';

    // Búsqueda dinámica en herramientas disponibles
    const foundTool = toolsIndex.find(t => 
      t.submodulo && t.submodulo.toLowerCase().trim() === v
    );
    if (foundTool && foundTool.url) return foundTool.url;

    if (v === 'mi perfil') return '/categoria/Seguridad y Accesos/Mi Perfil';
    if (v === 'métodos de acceso' || v === 'metodos de acceso') return '/categoria/Seguridad y Accesos/M%C3%A9todos%20de%20Acceso';
    if (v === 'gestión de usuarios' || v === 'gestion de usuarios') return '/categoria/Seguridad y Accesos/Gestión de Usuarios';
    if (v === 'roles y privilegios') return '/categoria/Seguridad y Accesos/Roles y Privilegios';
    if (v === 'preguntas de seguridad') return '/categoria/Seguridad y Accesos/Preguntas de Seguridad';
    if (v === 'auditoría del sistema' || v === 'auditoria del sistema') return '/categoria/Seguridad y Accesos/Auditoría del Sistema';
    if (v === 'perfil de la escuela') return '/categoria/Dirección y Sistema/Perfil de la Escuela';
    if (v === 'configuración escolar' || v === 'configuracion escolar' || v === 'configuración del sistema' || v === 'configuracion del sistema') return '/categoria/Dirección y Sistema/Configuración Escolar';
    if (v === 'espacios escolares' || v === 'ambientes escolares' || v === 'salones' || v === 'grados y salones') return '/categoria/Control de Estudios/Grados y Salones';
    if (v === 'división territorial' || v === 'division territorial') return '/categoria/Dirección y Sistema/División Territorial';
    if (v === 'cerebro de sigma') return '/categoria/Dirección y Sistema/Cerebro de Sigma';
    if (v === 'vincular estudiante' || v === 'vincular') return '/categoria/Gestión Estudiantil/Vincular Estudiante';
    if (v === 'actualización de datos' || v === 'actualizacion de datos' || v === 'actualizacion') return '/categoria/Gestión Estudiantil/Actualización de Datos';
    if (v === 'solicitud de cupos' || v === 'solicitud') return '/categoria/Gestión Estudiantil/Solicitud de Cupos';
    return '';
  };

  const ejecutarAccion = (tipo: string, valor: string) => {
    marcarInteraccionUsuario();
    if (tipo === 'navegar') {
      const vistaNombre = getVistaFromKeyword(valor);
      const url = mapVistaToUrl(vistaNombre);
      if (url) {
        navigate(url);
      } else {
        console.warn(`No se encontró ruta para la vista: ${vistaNombre}`);
      }
    } else if (tipo === 'abrir_modal') {
      const bootstrap = (window as any).bootstrap;
      if (bootstrap) {
        const mEl = document.getElementById(valor);
        if (mEl) {
          try {
            const modal = bootstrap.Modal.getInstance(mEl) || new bootstrap.Modal(mEl);
            modal.show();
          } catch (e) {
            console.error("Error abriendo modal:", e);
          }
        }
      }
    }
    setActivo(false);
  };

  const stylePosition = {
    left: `${position.x}px`,
    top: `${position.y}px`,
    right: 'auto',
    bottom: 'auto'
  };

  return (
    <div 
      id="sigma-container" 
      className={`sigma-container ${minimizado ? 'minimized' : ''} ${pensando ? 'thinking' : ''} ${hablando ? 'talking' : ''} ${isDragging ? 'dragging' : ''}`}
      style={stylePosition}
    >
      {/* Burbuja de Diálogo Interactiva */}
      <div 
        className={`sigma-speech-bubble ${activo ? 'active' : ''}`} 
        id="sigma-speech-bubble"
        onMouseEnter={() => {
          isHoveringBubbleRef.current = true;
          cancelarTemporizadorInactividad();
        }}
        onMouseMove={() => {
          isHoveringBubbleRef.current = true;
          cancelarTemporizadorInactividad();
        }}
        onMouseLeave={() => {
          isHoveringBubbleRef.current = false;
          if (activo) {
            reiniciarTemporizadorInactividad(10);
          }
        }}
      >
        <div className="sigma-bubble-header d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <img 
              src="/sigma-avatar.png?v=opcion4-mentora-doble-mano" 
              alt="SIGMA" 
              className="rounded-circle shadow-xs border border-white" 
              style={{ width: '24px', height: '24px', objectFit: 'cover', objectPosition: 'center 20%' }} 
            />
            <span className="sigma-bubble-title">
              <i className="bi bi-stars text-warning me-1"></i> SIGMA &bull; Asistente Virtual
            </span>
          </div>

          <div className="d-flex align-items-center gap-1.5">
            <button className="sigma-bubble-close" onClick={() => { marcarInteraccionUsuario(); setActivo(false); }}>&times;</button>
          </div>
        </div>

        <div className="sigma-bubble-content">
          <div dangerouslySetInnerHTML={{ __html: mensaje }} />

          {/* Tarjetas Interactivas de Módulos */}
          {modulosRecomendados.length > 0 && (
            <div className="sigma-interactive-cards">
              {modulosRecomendados.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => navegarInteractivo(item)}
                  className="sigma-module-card"
                  title={`Abrir ${item.submodulo}`}
                >
                  <div className="sigma-module-icon" style={{ backgroundColor: item.color }}>
                    <i className={`bi ${item.icono}`}></i>
                  </div>
                  <div className="sigma-module-info">
                    <div className="sigma-module-title">{item.submodulo}</div>
                    <div className="sigma-module-sub">{item.categoria}</div>
                  </div>
                  <span className="badge bg-primary text-white rounded-pill px-2 py-1 extra-small d-flex align-items-center gap-1">
                    Ir <i className="bi bi-arrow-right"></i>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Chips Interactivos de Sugerencia / Accesos Rápidos */}
          {chipsSugeridos.length > 0 && (
            <div className="sigma-quick-chips">
              {chipsSugeridos.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={chip.accion}
                  className="sigma-chip-btn"
                >
                  {chip.texto}
                </button>
              ))}
            </div>
          )}

          {location.pathname === '/' && modulosRecomendados.length === 0 && (
            <div className="mt-2.5">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary rounded-pill px-3 shadow-sm w-100 mb-1 fw-bold text-start d-flex align-items-center justify-content-between hover-efecto"
                onClick={() => {
                  marcarInteraccionUsuario();
                  window.dispatchEvent(new CustomEvent('sigae-iniciar-tour'));
                }}
              >
                <span><i className="bi bi-compass-fill me-1"></i> Ver Tour / Orientación Inicial</span>
                <span className="badge bg-primary rounded-pill"><i className="bi bi-play-fill"></i></span>
              </button>
            </div>
          )}

          {acciones.length > 0 && (
            <div className="mt-3">
              {/* Acción Principal */}
              {acciones.filter(a => !a.esAlternativa).map((act, idx) => {
                if (act.tipo === 'navegar') {
                  return act.allowed ? (
                    <button 
                      key={idx}
                      className="btn btn-sm btn-primary rounded-pill px-3 shadow-sm w-100 mb-2"
                      onClick={() => ejecutarAccion(act.tipo, act.valor)}
                    >
                      <i className="bi bi-link me-1"></i> Ir a {act.tema}
                    </button>
                  ) : (
                    <button 
                      key={idx}
                      className="btn btn-sm btn-secondary rounded-pill px-3 shadow-sm w-100 mb-2 opacity-75"
                      disabled
                    >
                      <i className="bi bi-lock-fill me-1"></i> Acceso denegado a {act.tema}
                    </button>
                  );
                } else if (act.tipo === 'abrir_modal') {
                  return (
                    <button 
                      key={idx}
                      className="btn btn-sm btn-primary rounded-pill px-3 shadow-sm w-100 mb-2"
                      onClick={() => ejecutarAccion(act.tipo, act.valor)}
                    >
                      <i className="bi bi-window me-1"></i> Abrir {act.tema}
                    </button>
                  );
                }
                return null;
              })}

              {/* Sugerencias Alternativas */}
              {acciones.some(a => a.esAlternativa) && (
                <>
                  <hr className="my-2 border-secondary" />
                  <div className="small text-muted mb-2"><i className="bi bi-info-circle me-1"></i>¿O te referías a...?</div>
                  {acciones.filter(a => a.esAlternativa).map((act, idx) => {
                    if (act.tipo === 'navegar') {
                      return act.allowed ? (
                        <button 
                          key={idx}
                          className="btn btn-sm btn-outline-secondary rounded-pill px-2 shadow-sm w-100 mb-1 text-start text-truncate"
                          onClick={() => ejecutarAccion(act.tipo, act.valor)}
                        >
                          <i className="bi bi-link me-1"></i> {act.tema}
                        </button>
                      ) : (
                        <button 
                          key={idx}
                          className="btn btn-sm btn-outline-secondary rounded-pill px-2 shadow-sm w-100 mb-1 text-start text-truncate opacity-50"
                          disabled
                        >
                          <i className="bi bi-lock-fill me-1 text-danger"></i> {act.tema}
                        </button>
                      );
                    } else if (act.tipo === 'abrir_modal') {
                      return (
                        <button 
                          key={idx}
                          className="btn btn-sm btn-outline-secondary rounded-pill px-2 shadow-sm w-100 mb-1 text-start text-truncate"
                          onClick={() => ejecutarAccion(act.tipo, act.valor)}
                        >
                          <i className="bi bi-window me-1"></i> {act.tema}
                        </button>
                      );
                    } else {
                      return (
                        <button 
                          key={idx}
                          className="btn btn-sm btn-outline-secondary rounded-pill px-2 shadow-sm w-100 mb-1 text-start text-truncate"
                          onClick={() => {
                            if (act.tipo === 'texto') {
                              procesarPreguntaUsuario(act.valor);
                            } else {
                              const itemMatch = conocimientoCache.filter(c => c.id === act.id);
                              if (itemMatch.length > 0) ejecutarRespuesta(itemMatch);
                            }
                          }}
                        >
                          <i className="bi bi-chat-dots me-1"></i> {act.tema}
                        </button>
                      );
                    }
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* Entrada de texto */}
        <div className="sigma-input-group">
          <input 
            ref={chatInputRef}
            type="text" 
            value={inputValue}
            onFocus={() => {
              isInputFocusedRef.current = true;
              marcarInteraccionUsuario();
              cancelarTemporizadorInactividad();
            }}
            onBlur={() => {
              isInputFocusedRef.current = false;
              if (activo) {
                reiniciarTemporizadorInactividad(10);
              }
            }}
            onChange={(e) => {
              marcarInteraccionUsuario();
              setInputValue(e.target.value);
              cancelarTemporizadorInactividad();
            }}
            onKeyDown={(e) => { 
              if (e.key === 'Enter') {
                procesarPreguntaUsuario(); 
              } else {
                cancelarTemporizadorInactividad();
              }
            }}
            className="sigma-input" 
            placeholder="Pregúntame lo que necesites o qué deseas gestionar..."
          />
          <button onClick={() => procesarPreguntaUsuario()} className="sigma-btn-send" title="Consultar a SIGMA">
            <i className="bi bi-send-fill"></i>
          </button>
        </div>
      </div>

      {/* Avatar Gráfico de Sigma (Figura transparente con micro-animaciones) */}
      <div 
        className="sigma-avatar-wrapper" 
        id="sigma-avatar"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <button className="sigma-btn-minimize" onClick={minimizar} title="Minimizar a SIGMA">
          <i className="bi bi-eye-slash-fill"></i>
        </button>
        <SigmaFiguraVisual />
      </div>
      
      {/* Sombra de profundidad */}
      <div className="sigma-shadow"></div>

      {/* Lanzador Flotante (minimizado) */}
      <div 
        className="sigma-launcher" 
        onClick={restaurar}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        title="Hablar con SIGMA"
      >
        <img 
          src="/sigma-avatar.png?v=opcion4-mentora-doble-mano" 
          alt="SIGMA" 
          className="sigma-launcher-img" 
          draggable={false}
        />
        <span className="sigma-launcher-badge">Σ</span>
      </div>
    </div>
  );
};
