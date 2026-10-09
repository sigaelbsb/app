import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Fuse from 'fuse.js';
import { supabase } from '../lib/supabase';
import { usePermisos } from '../hooks/usePermisos';
import { ModulosSistema } from '../pages/CategoryDashboard';
import { obtenerInfoModulo } from '../lib/guiasZoeMaxData';

/**
 * Figura Visual de Guías Escolares (Zoe y Max)
 * Figuras 3D transparentes utilizadas en CerebroSigma y vistas del sistema
 */
export interface SigmaFiguraVisualProps { 
  style?: React.CSSProperties; 
  className?: string;
  personaje?: 'zoe' | 'max' | 'duo' | 'sigma';
  pose?: 'saludo' | 'documentos' | 'senala' | 'pulgar';
}

export const SigmaFiguraVisual: React.FC<SigmaFiguraVisualProps> = ({ 
  style, 
  className = "",
  personaje = 'zoe',
  pose = 'saludo'
}) => {
  let srcImg = '/zoe_saludo.png';
  if (personaje === 'zoe') {
    switch (pose) {
      case 'documentos':
        srcImg = '/zoe_documentos.png';
        break;
      case 'senala':
        srcImg = '/zoe_senala.png';
        break;
      case 'pulgar':
        srcImg = '/zoe_pulgar.png';
        break;
      case 'saludo':
      default:
        srcImg = '/zoe_saludo.png';
        break;
    }
  } else if (personaje === 'max') {
    switch (pose) {
      case 'documentos':
        srcImg = '/max_documentos.png';
        break;
      case 'senala':
        srcImg = '/max_senala.png';
        break;
      case 'pulgar':
        srcImg = '/max_pulgar.png';
        break;
      case 'saludo':
      default:
        srcImg = '/max_saludo.png';
        break;
    }
  } else if (personaje === 'duo') {
    srcImg = '/zoe_max_duo_3d.png';
  } else {
    srcImg = '/sigma-avatar.png';
  }

  return (
    <div className={`sigma-mascot-container ${className}`} style={style}>
      <img 
        src={srcImg} 
        alt={personaje === 'zoe' ? 'Zoe - Guía Escolar' : (personaje === 'max' ? 'Max - Guía Escolar' : 'Guía Escolar')} 
        className="sigma-mascot-base"
        draggable={false}
      />
    </div>
  );
};

export const SigmaFiguraAnimada = SigmaFiguraVisual;

/**
 * ChatbotSigma: Asistente Integrado en el Cintillo Superior
 * (Zoe y Max - Guías Escolares SIGAE)
 */
export const ChatbotSigma = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tienePermiso, tienePermisoEnEscuela } = usePermisos();

  const [activo, setActivo] = useState(false);
  const [pensando, setPensando] = useState(false);
  const [hablando, setHablando] = useState(false);

  // Personaje activo (Zoe o Max)
  const [personaje, setPersonaje] = useState<'zoe' | 'max'>(() => {
    return Math.random() < 0.5 ? 'zoe' : 'max';
  });

  const [poseActual, setPoseActual] = useState<'saludo' | 'documentos' | 'senala' | 'pulgar'>('saludo');

  // Estados para Navegación y Recomendaciones
  const [modulosRecomendados, setModulosRecomendados] = useState<any[]>([]);
  const [chipsSugeridos, setChipsSugeridos] = useState<Array<{ texto: string; accion: () => void }>>([]);
  const [mensaje, setMensaje] = useState('¡Hola! Conectando mis sistemas...');
  const [acciones, setAcciones] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');

  const chatInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPath = useRef<string | null>(null);

  const [conocimientoCache, setConocimientoCache] = useState<any[]>([]);
  const [fuseInstance, setFuseInstance] = useState<Fuse<any> | null>(null);

  const alternarPersonaje = () => {
    const nuevo = personaje === 'zoe' ? 'max' : 'zoe';
    setPersonaje(nuevo);
    setMensaje(
      nuevo === 'zoe'
        ? '¡Hola! Soy <b>Zoe</b> 👧. ¡Qué gusto acompañarte en SIGAE! Dime qué necesitas gestionar hoy.'
        : '¡Hola! Soy <b>Max</b> 👦. ¡Listo para ayudarte a navegar por el sistema! ¿En qué te puedo orientar?'
    );
  };

  // Cierre al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActivo(false);
      }
    };
    if (activo) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activo]);

  // Cierre con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activo) {
        setActivo(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activo]);

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

  // Mapeo semántico de palabras clave
  const KEYWORDS_MAP: Record<string, string[]> = {
    "Perfil de la Escuela": ["escuela", "plantel", "colegio", "dea", "director", "directora", "mision", "vision", "peic", "sede"],
    "Configuración Escolar": ["configuracion", "parametros", "lapsos", "periodos", "periodo", "niveles", "fases", "año", "ano", "escolar"],
    "Cerebro de Zoe y Max": ["zoe", "max", "sigma", "cerebro", "ia", "inteligencia", "preguntas", "respuestas", "conocimiento", "bot"],
    "Cerebro de Sigma": ["zoe", "max", "sigma", "cerebro", "ia", "inteligencia", "preguntas", "respuestas", "conocimiento", "bot"],
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

  // Herramientas disponibles según permisos
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
    setHablando(true);
    setMensaje(`🚀 Abriendo <b>${item.submodulo}</b>...`);
    setModulosRecomendados([]);
    setChipsSugeridos([]);
    setTimeout(() => {
      navigate(item.url);
      setActivo(false);
      setHablando(false);
    }, 350);
  };

  const abrirChatSigma = () => {
    setActivo(true);
    setHablando(true);
    setTimeout(() => setHablando(false), 1000);

    const nombreGuia = personaje === 'zoe' ? 'Zoe' : 'Max';
    const modData = obtenerInfoModulo(location.pathname);

    if (modData) {
      const textoGuia = personaje === 'zoe' ? modData.info.descZoe : modData.info.descMax;
      setMensaje(`
        <div class="guia-modulo-chat-wrapper">
          <div class="d-flex align-items-center gap-1.5 mb-2">
            <span class="badge ${personaje === 'zoe' ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary'} rounded-pill px-2.5 py-1" style="font-size: 0.72rem; font-weight: 700;">
              <i class="bi ${modData.info.icono} me-1"></i> ${modData.info.titulo}
            </span>
            <span class="badge bg-light text-secondary border" style="font-size: 0.68rem;">
              ${modData.info.categoria}
            </span>
          </div>
          <div style="font-size: 0.86rem; line-height: 1.45; color: #1e293b;" class="mb-2">
            ${textoGuia}
          </div>
          ${modData.info.tip ? `
            <div class="p-2 rounded-3 border bg-light text-secondary d-flex align-items-start gap-1.5" style="font-size: 0.78rem; line-height: 1.38;">
              <i class="bi bi-lightbulb-fill text-warning flex-shrink-0 mt-0.5"></i>
              <span><b>Tip:</b> ${modData.info.tip}</span>
            </div>
          ` : ''}
        </div>
      `);
    } else {
      setMensaje(`¡Hola! Soy <b>${nombreGuia}</b> 👋, tu guía en SIGAE. ¿En qué te puedo orientar o qué necesitas gestionar hoy?`);
    }

    setModulosRecomendados(toolsIndex.slice(0, 4));
    setAcciones([]);
    setChipsSugeridos([
      { texto: '🎒 Tour Guiado', accion: () => { setActivo(false); window.dispatchEvent(new CustomEvent('sigae-iniciar-tour')); } },
      { texto: `🔄 Hablar con ${personaje === 'zoe' ? 'Max' : 'Zoe'}`, accion: () => alternarPersonaje() },
      { texto: '🚌 Transporte Escolar', accion: () => procesarPreguntaUsuario('transporte') },
      { texto: '👥 Usuarios y Claves', accion: () => procesarPreguntaUsuario('usuarios') },
      { texto: '🏫 Grados y Salones', accion: () => procesarPreguntaUsuario('grados') },
      { texto: '📋 Mis módulos activos', accion: () => procesarPreguntaUsuario('mis modulos') }
    ]);
    setTimeout(() => chatInputRef.current?.focus(), 100);
  };

  // Cargar datos al montar y escuchar eventos de apertura
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
    window.addEventListener('sigae-abrir-guia', handleAbrirChat);
    return () => {
      window.removeEventListener('sigae-sigma-refresh', refrescarCanal);
      window.removeEventListener('sigae-abrir-sigma-busqueda', handleAbrirChat);
      window.removeEventListener('sigae-abrir-guia', handleAbrirChat);
    };
  }, [toolsIndex]);

  // Actualizar contenido contextual al cambiar de ruta
  useEffect(() => {
    if (location.pathname === lastPath.current) return;
    lastPath.current = location.pathname;

    const modData = obtenerInfoModulo(location.pathname);
    if (modData) {
      const guiaAleatorio: 'zoe' | 'max' = Math.random() < 0.5 ? 'zoe' : 'max';
      setPersonaje(guiaAleatorio);

      const pathLower = location.pathname.toLowerCase();
      const nombreLower = (modData.nombre || '').toLowerCase();
      let poseElegida: 'saludo' | 'documentos' | 'senala' | 'pulgar' = 'saludo';
      
      if (/ficha|actualiza|documento|expediente|constancia|recaudo|formulario|inscrip|solicitud/i.test(nombreLower) || 
          /ficha|actualiza|documento|solicitud|cupo|inscrip/i.test(pathLower)) {
        poseElegida = 'documentos';
      } else if (/seguridad|control|auditoria|sistema|red|rol|permiso|notas|baremo|evalua|config/i.test(nombreLower) || 
                 /seguridad|auditoria|direccion|config|rol/i.test(pathLower)) {
        poseElegida = 'senala';
      } else if (/transporte|ruta|carnet|asistencia|pago|reporte|verific|bienvenida|exito/i.test(nombreLower) || 
                 /transporte|carnet|reporte/i.test(pathLower)) {
        poseElegida = 'pulgar';
      }
      setPoseActual(poseElegida);

      const textoGuia = guiaAleatorio === 'zoe' ? modData.info.descZoe : modData.info.descMax;
      const htmlMensaje = `
        <div class="guia-modulo-chat-wrapper">
          <div class="d-flex align-items-center gap-1.5 mb-2">
            <span class="badge ${guiaAleatorio === 'zoe' ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary'} rounded-pill px-2.5 py-1" style="font-size: 0.72rem; font-weight: 700;">
              <i class="bi ${modData.info.icono} me-1"></i> ${modData.info.titulo}
            </span>
            <span class="badge bg-light text-secondary border" style="font-size: 0.68rem;">
              ${modData.info.categoria}
            </span>
          </div>
          <div style="font-size: 0.86rem; line-height: 1.45; color: #1e293b;" class="mb-2">
            ${textoGuia}
          </div>
          ${modData.info.tip ? `
            <div class="p-2 rounded-3 border bg-light text-secondary d-flex align-items-start gap-1.5" style="font-size: 0.78rem; line-height: 1.38;">
              <i class="bi bi-lightbulb-fill text-warning flex-shrink-0 mt-0.5"></i>
              <span><b>Tip:</b> ${modData.info.tip}</span>
            </div>
          ` : ''}
        </div>
      `;

      setMensaje(htmlMensaje);
      setModulosRecomendados([]);
      setAcciones([]);

      const chips: Array<{ texto: string; accion: () => void }> = [
        { 
          texto: `🔄 Cambiar a ${guiaAleatorio === 'zoe' ? 'Max' : 'Zoe'}`, 
          accion: () => alternarPersonaje() 
        },
        { 
          texto: '🎒 Tour Guiado', 
          accion: () => { 
            setActivo(false);
            window.dispatchEvent(new CustomEvent('sigae-iniciar-tour')); 
          } 
        }
      ];

      if (modData.info.accionesSugeridas) {
        modData.info.accionesSugeridas.forEach(a => {
          chips.push({
            texto: a.texto,
            accion: () => procesarPreguntaUsuario(a.texto)
          });
        });
      }

      setChipsSugeridos(chips);
    }
  }, [location.pathname]);

  // Procesar preguntas del usuario y búsqueda de módulos
  const procesarPreguntaUsuario = (textoManual: string | null = null) => {
    const query = (textoManual !== null ? textoManual : inputValue).trim();
    if (!query) return;

    setInputValue('');
    setPensando(true);
    setMensaje("<div class='text-center py-3'><span class='spinner-border spinner-border-sm text-primary me-2'></span><i>Consultando mis módulos y conocimientos...</i></div>");
    setAcciones([]);
    setModulosRecomendados([]);
    setChipsSugeridos([]);
    setActivo(true);

    const queryClean = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Si pregunta por capacidades
    const pideCapacidades = /\b(que puedes hacer|que haces|para que sirves|ayuda|funciones|capacidades|quien eres)\b/i.test(queryClean);
    if (pideCapacidades) {
      setTimeout(() => {
        setPensando(false);
        setHablando(true);
        setTimeout(() => setHablando(false), 1500);
        setMensaje(`¡Hola! Soy <b>${personaje === 'zoe' ? 'Zoe' : 'Max'}</b>, tu guía para SIGAE (junto a mi compañero <b>${personaje === 'zoe' ? 'Max' : 'Zoe'}</b>).<br><br>
          Podemos orientarte sobre procesos escolares, resolver dudas frecuentes y acompañarte de inmediato al módulo que necesites. Escribe lo que buscas (por ejemplo: <i>"cargar notas"</i>, <i>"transporte"</i> o <i>"crear usuarios"</i>).<br><br>
          Accesos rápidos recomendados:`);
        setModulosRecomendados(toolsIndex.slice(0, 4));
        setAcciones([]);
        setChipsSugeridos([
          { texto: '📋 Ver todos mis módulos', accion: () => procesarPreguntaUsuario('mis modulos') },
          { texto: '🏫 ¿En qué escuela estoy?', accion: () => procesarPreguntaUsuario('escuela') },
          { texto: '🧭 Tour de Orientación', accion: () => { setActivo(false); window.dispatchEvent(new CustomEvent('sigae-iniciar-tour')); } }
        ]);
      }, 300);
      return;
    }

    const queryFiltrada = queryClean
      .replace(/\b(donde|dónde|puedo|ver|esta|está|estan|están|como|cómo|hago|para|quiero|necesito|muestrame|muéstrame|abrir|ir|al|a|la|el|los|las|de|del|en|un|una|por|favor|busca|buscame|búscame|consultar|gestionar)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    const terminoBusqueda = queryFiltrada.length >= 2 ? queryFiltrada : queryClean;

    // Búsqueda en módulos del sistema
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

    if (modulosCoincidentes.length > 0) {
      setTimeout(() => {
        setPensando(false);
        setHablando(true);
        setTimeout(() => setHablando(false), 1500);

        if (modulosCoincidentes.length === 1) {
          const m = modulosCoincidentes[0];
          const descHtml = m.desc ? `<div class="p-2 my-2 rounded bg-light border-start border-3 border-primary text-secondary small">${m.desc}</div>` : '';
          setMensaje(`¡Por supuesto! Para gestionar eso, el módulo indicado es <b>${m.submodulo}</b> (${m.categoria}).${descHtml}Toca la tarjeta para abrirlo:`);
          setModulosRecomendados([m]);
        } else {
          setMensaje(`Encontré <b>${modulosCoincidentes.length} secciones</b> disponibles para tu perfil que pueden ayudarte:`);
          setModulosRecomendados(modulosCoincidentes.slice(0, 4));
        }

        setAcciones([]);
        setChipsSugeridos([
          { texto: '📋 Ver todos mis módulos', accion: () => procesarPreguntaUsuario('mis modulos') },
          { texto: '💬 Otra consulta', accion: () => { setModulosRecomendados([]); setMensaje('Dime qué otra duda tienes y te oriento:'); } }
        ]);
      }, 350);
      return;
    }

    // Chequear glosario/diccionario
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
        setMensaje(`📚 <b>Glosario Educativo SIGAE</b><br/><br/>
          Conceptos y temas disponibles:<br/><br/>
          <ul class="mb-0 ps-3">${terminosHtml}</ul>`);
        
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
      }, 400);
      return;
    }
    
    // Preguntas por escuela o módulos
    const preguntaEscuela = /\b(escuela|plantel|colegio|sede|institucion|institución|donde estoy|dónde estoy|en que escuela|en qué escuela)\b/i.test(queryClean);
    const preguntaModulos = /\b(modulo|módulo|modulos|módulos|seccion|sección|activo|permiso|acceso|que puedo hacer|qué puedo hacer|mis accesos)\b/i.test(queryClean);

    if (preguntaEscuela || preguntaModulos) {
      setTimeout(() => {
        setPensando(false);
        const schoolCode = localStorage.getItem('sigae_escuela_codigo') || 'sb';
        const schoolName = schoolCode === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
        
        let userRole = 'Invitado';
        let userName = 'visitante';
        try {
          const usStr = localStorage.getItem('usuario_sigae');
          if (usStr) {
            const userObj = JSON.parse(usStr);
            userRole = userObj.rol || 'Invitado';
            userName = (userObj.nombre || userObj.nombres || 'visitante').split(' ')[0];
          }
        } catch (e) {}

        if (preguntaEscuela && !preguntaModulos) {
          setMensaje(`Hola <b>${userName}</b>, estás en la sede: <b>${schoolName}</b> (Código: <b>${schoolCode.toUpperCase()}</b>).`);
          const escuelaTool = toolsIndex.find(t => t.submodulo === 'Perfil de la Escuela');
          if (escuelaTool) {
            setModulosRecomendados([escuelaTool]);
          }
        } else {
          setMensaje(`Hola <b>${userName}</b>, con tu rol de <b>${userRole}</b> en <b>${schoolName}</b> tienes <b>${toolsIndex.length} módulos disponibles</b>:`);
          setModulosRecomendados(toolsIndex.slice(0, 5));
        }
        setAcciones([]);
        setChipsSugeridos([
          { texto: '📋 Ver todos mis módulos', accion: () => procesarPreguntaUsuario('mis modulos') },
          { texto: '🏫 Ver datos de la escuela', accion: () => procesarPreguntaUsuario('escuela') }
        ]);
      }, 350);
      return;
    }

    // Consulta Fuse en la base de datos
    setTimeout(() => {
      setPensando(false);

      if (!fuseInstance) {
        setMensaje("En este momento estoy sincronizando con la base de datos, pero puedes navegar directamente con los módulos recomendados.");
        setModulosRecomendados(toolsIndex.slice(0, 3));
        return;
      }

      const resultados = fuseInstance.search(query);

      if (resultados.length > 0) {
        const topMatches = resultados.slice(0, 3).map(r => r.item);
        ejecutarRespuesta(topMatches);
      } else {
        registrarPreguntaPendiente(query);
      }
    }, 400);
  };

  const registrarPreguntaPendiente = async (query: string) => {
    setMensaje(`Aún no tengo una respuesta exacta para "<b>${query}</b>", pero registré tu consulta para que el equipo la incorpore pronto.<br><br>¿Deseas explorar tus módulos activos?`);
    setAcciones([]);
    setModulosRecomendados(toolsIndex.slice(0, 3));
    setChipsSugeridos([
      { texto: '📋 Ver módulos disponibles', accion: () => procesarPreguntaUsuario('mis modulos') },
      { texto: '🧭 Tour de Orientación', accion: () => { setActivo(false); window.dispatchEvent(new CustomEvent('sigae-iniciar-tour')); } }
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
    setTimeout(() => setHablando(false), 1500);
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
      'zoe': 'Cerebro de Zoe y Max',
      'max': 'Cerebro de Zoe y Max',
      'sigma': 'Cerebro de Zoe y Max',
      'inicio': 'Inicio',
      'panel': 'Panel de Control'
    };
    return mapToView[claveLimpia] || keyword;
  };

  const mapVistaToUrl = (vista: string): string => {
    if (!vista || typeof vista !== 'string') return '';
    const v = vista.toLowerCase().trim();
    if (v === 'inicio' || v === 'panel principal' || v === '/') return '/';

    const foundTool = toolsIndex.find(t => 
      t.submodulo && t.submodulo.toLowerCase().trim() === v
    );
    if (foundTool && foundTool.url) return foundTool.url;

    if (v === 'mi perfil') return '/categoria/Seguridad y Accesos/Mi Perfil';
    if (v === 'métodos de acceso' || v === 'metodos de acceso') return '/categoria/Seguridad y Accesos/M%C3%A9todos%20de%20Acceso';
    if (v === 'dispositivos y sesiones' || v === 'sesiones activas' || v === 'sesiones' || v === 'dispositivos') return '/categoria/Seguridad y Accesos/Dispositivos y Sesiones';
    if (v === 'gestión de usuarios' || v === 'gestion de usuarios') return '/categoria/Seguridad y Accesos/Gestión de Usuarios';
    if (v === 'roles y privilegios') return '/categoria/Seguridad y Accesos/Roles y Privilegios';
    if (v === 'preguntas de seguridad') return '/categoria/Seguridad y Accesos/Preguntas de Seguridad';
    if (v === 'auditoría del sistema' || v === 'auditoria del sistema') return '/categoria/Seguridad y Accesos/Auditoría del Sistema';
    if (v === 'perfil de la escuela') return '/categoria/Dirección y Sistema/Perfil de la Escuela';
    if (v === 'configuración escolar' || v === 'configuracion escolar' || v === 'configuración del sistema' || v === 'configuracion del sistema') return '/categoria/Dirección y Sistema/Configuración Escolar';
    if (v === 'espacios escolares' || v === 'ambientes escolares' || v === 'salones' || v === 'grados y salones') return '/categoria/Control de Estudios/Grados y Salones';
    if (v === 'división territorial' || v === 'division territorial') return '/categoria/Dirección y Sistema/División Territorial';
    if (v === 'cerebro de zoe y max' || v === 'cerebro de sigma') return '/categoria/Dirección y Sistema/Cerebro de Zoe y Max';
    if (v === 'vincular estudiante' || v === 'vincular') return '/categoria/Gestión Estudiantil/Vincular Estudiante';
    if (v === 'actualización de datos' || v === 'actualizacion de datos' || v === 'actualizacion') return '/categoria/Gestión Estudiantil/Actualización de Datos';
    if (v === 'solicitud de cupos' || v === 'solicitud') return '/categoria/Gestión Estudiantil/Solicitud de Cupos';
    return '';
  };

  const ejecutarAccion = (tipo: string, valor: string) => {
    if (tipo === 'navegar') {
      const vistaNombre = getVistaFromKeyword(valor);
      const url = mapVistaToUrl(vistaNombre);
      if (url) {
        navigate(url);
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

  return (
    <div 
      id="sigma-container" 
      ref={containerRef}
      className={`position-relative bot-cintillo-wrapper ${personaje === 'zoe' ? 'tema-zoe' : 'tema-max'}`}
      style={{ display: 'inline-block' }}
    >
      {/* Botón interactivo en el Cintillo Superior */}
      <button
        type="button"
        id="btn-bot-cintillo"
        onClick={() => {
          if (!activo) {
            abrirChatSigma();
          } else {
            setActivo(false);
          }
        }}
        className={`btn btn-sm d-flex align-items-center gap-1.5 gap-md-2 rounded-pill px-2.5 py-1.5 border shadow-xs transition-all ${
          activo
            ? (personaje === 'zoe' ? 'btn-danger text-white border-0' : 'btn-primary text-white border-0')
            : 'btn-light border text-dark'
        }`}
        style={{
          height: '38px',
          background: activo
            ? (personaje === 'zoe' ? 'linear-gradient(135deg, #ec4899, #f43f5e)' : 'linear-gradient(135deg, #0284c7, #2563eb)')
            : '#ffffff',
          borderColor: activo ? 'transparent' : '#e2e8f0',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        title={`Guía Escolar Virtual (${personaje === 'zoe' ? 'Zoe' : 'Max'}) - Clic para abrir asistencia y orientación`}
      >
        <div className="position-relative d-flex align-items-center justify-content-center" style={{ width: '26px', height: '26px' }}>
          <img 
            src={personaje === 'zoe' ? '/zoe_avatar.png' : '/max_avatar.png'}
            alt={personaje === 'zoe' ? 'Zoe' : 'Max'}
            className="rounded-circle shadow-xs"
            style={{ width: '26px', height: '26px', objectFit: 'cover' }}
          />
          <span 
            className="position-absolute rounded-circle"
            style={{
              width: '8px',
              height: '8px',
              bottom: '-1px',
              right: '-1px',
              backgroundColor: '#22c55e',
              border: '1.5px solid #fff'
            }}
          />
        </div>
        <div className="d-none d-md-flex flex-column text-start" style={{ lineHeight: 1.1 }}>
          <span className="fw-bold" style={{ fontSize: '0.78rem', color: activo ? '#ffffff' : '#1e293b' }}>
            {personaje === 'zoe' ? 'Zoe' : 'Max'}
          </span>
          <span className="extra-small" style={{ fontSize: '0.64rem', color: activo ? 'rgba(255,255,255,0.85)' : '#64748b' }}>
            Guía SIGAE
          </span>
        </div>
        <i 
          className={`bi ${activo ? 'bi-chevron-up text-white' : 'bi-stars'} ms-0.5`}
          style={{ 
            fontSize: '0.8rem', 
            color: activo ? '#ffffff' : (personaje === 'zoe' ? '#ec4899' : '#0284c7') 
          }}
        />
      </button>

      {/* Menú desplegable del Asistente en el Cintillo Superior */}
      {activo && (
        <div 
          className="dropdown-menu show dropdown-menu-end shadow-lg border-0 p-0 sigma-cintillo-dropdown animate__animated animate__fadeIn"
          style={{
            position: 'absolute',
            top: '44px',
            right: 0,
            width: 'min(420px, 94vw)',
            maxHeight: 'min(620px, 86vh)',
            zIndex: 1060,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '20px',
            border: '1px solid rgba(0,0,0,0.08)',
            overflow: 'hidden',
            background: '#ffffff',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.2), 0 0 1px rgba(0,0,0,0.1)'
          }}
        >
          {/* Cabecera del Asistente */}
          <div 
            className="d-flex align-items-center justify-content-between p-3 border-bottom"
            style={{
              background: personaje === 'zoe' 
                ? 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)' 
                : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderBottomColor: personaje === 'zoe' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(2, 132, 199, 0.2)'
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <div className="position-relative">
                <img 
                  src={personaje === 'zoe' ? '/zoe_avatar.png' : '/max_avatar.png'} 
                  alt={personaje === 'zoe' ? 'Zoe' : 'Max'} 
                  className="rounded-circle shadow-xs border border-white" 
                  style={{ width: '32px', height: '32px', objectFit: 'cover' }} 
                />
                <span 
                  style={{ 
                    position: 'absolute', 
                    bottom: '-1px', 
                    right: '-1px', 
                    width: '9px', 
                    height: '9px', 
                    borderRadius: '50%', 
                    backgroundColor: '#22c55e', 
                    border: '1.5px solid #fff' 
                  }} 
                />
              </div>
              <div>
                <div className="fw-bold small d-flex align-items-center gap-1.5" style={{ color: personaje === 'zoe' ? '#db2777' : '#0284c7', lineHeight: 1.2 }}>
                  <i className="bi bi-stars"></i>
                  <span>{personaje === 'zoe' ? 'Zoe' : 'Max'} &bull; Guía Virtual</span>
                </div>
                <div className="text-muted extra-small" style={{ fontSize: '0.68rem' }}>
                  Asistente Inteligente SIGAE
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-1.5">
              <button 
                type="button"
                className={`btn btn-sm py-0.5 px-2 rounded-pill fw-bold hover-efecto ${
                  personaje === 'zoe' 
                    ? 'btn-outline-primary border-primary-subtle text-primary bg-primary bg-opacity-10' 
                    : 'btn-outline-danger border-danger-subtle text-danger bg-danger bg-opacity-10'
                }`}
                style={{ fontSize: '0.72rem' }}
                onClick={alternarPersonaje}
                title={`Cambiar de guía a ${personaje === 'zoe' ? 'Max' : 'Zoe'}`}
              >
                {personaje === 'zoe' ? '👦 Max' : '👧 Zoe'}
              </button>
              <button 
                type="button"
                className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center text-muted border-0"
                style={{ width: '28px', height: '28px' }}
                onClick={() => setActivo(false)}
                title="Cerrar Asistente"
              >
                <i className="bi bi-x-lg" style={{ fontSize: '0.75rem' }}></i>
              </button>
            </div>
          </div>

          {/* Cuerpo conversacional con scroll */}
          <div 
            className="p-3 overflow-auto flex-grow-1"
            style={{ maxHeight: 'min(460px, 60vh)', backgroundColor: '#fafbfc' }}
          >
            <div 
              className="p-3 rounded-4 bg-white shadow-xs border mb-2.5"
              style={{ 
                borderColor: personaje === 'zoe' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(2, 132, 199, 0.2)',
                fontSize: '0.84rem',
                lineHeight: 1.45,
                color: '#1e293b'
              }}
              dangerouslySetInnerHTML={{ __html: mensaje }} 
            />

            {/* Tarjetas Interactivas de Módulos */}
            {modulosRecomendados.length > 0 && (
              <div className="sigma-interactive-cards mb-2.5">
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
              <div className="sigma-quick-chips mb-2.5">
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

            {/* Tour Guiado */}
            {location.pathname === '/' && modulosRecomendados.length === 0 && (
              <div className="mb-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary rounded-pill px-3 shadow-sm w-100 mb-1 fw-bold text-start d-flex align-items-center justify-content-between hover-efecto"
                  onClick={() => {
                    setActivo(false);
                    window.dispatchEvent(new CustomEvent('sigae-iniciar-tour'));
                  }}
                >
                  <span><i className="bi bi-compass-fill me-1"></i> Ver Tour / Orientación Inicial</span>
                  <span className="badge bg-primary rounded-pill"><i className="bi bi-play-fill"></i></span>
                </button>
              </div>
            )}

            {/* Acciones */}
            {acciones.length > 0 && (
              <div className="mt-2.5">
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

          {/* Barra de entrada de texto */}
          <div className="p-2.5 bg-white border-top">
            <div className="sigma-input-group">
              <input 
                ref={chatInputRef}
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { 
                  if (e.key === 'Enter') {
                    procesarPreguntaUsuario(); 
                  }
                }}
                className="sigma-input" 
                placeholder="Pregúntame o escribe qué deseas hacer..."
              />
              <button 
                onClick={() => procesarPreguntaUsuario()} 
                className="sigma-btn-send" 
                title="Consultar a Zoe y Max"
              >
                <i className="bi bi-send-fill"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
