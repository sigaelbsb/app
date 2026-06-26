import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Fuse from 'fuse.js';
import { supabase } from '../lib/supabase';
import { usePermisos } from '../hooks/usePermisos';

export const ChatbotSigma = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tienePermiso } = usePermisos();

  const [activo, setActivo] = useState(false);
  const [pensando, setPensando] = useState(false);
  const [hablando, setHablando] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [minimizado, setMinimizado] = useState(false);

  const [position, setPosition] = useState({ x: window.innerWidth - 120, y: window.innerHeight - 150 });
  const [mensaje, setMensaje] = useState('¡Iniciando sistemas...!');
  const [acciones, setAcciones] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  
  const [efectoHover, setEfectoHover] = useState('');
  const [particles, setParticles] = useState<Array<{ id: number; text: string; color: string; style: React.CSSProperties }>>([]);
  const [sparkles, setSparkles] = useState<Array<{ id: number; color: string; style: React.CSSProperties }>>([]);
  const [portalRing, setPortalRing] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);

  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });
  const dragMoved = useRef(false);
  const particleId = useRef(0);
  const lastPath = useRef(location.pathname);
  
  const [conocimientoCache, setConocimientoCache] = useState<any[]>([]);
  const [fuseInstance, setFuseInstance] = useState<Fuse<any> | null>(null);

  // Generador del SVG del Personaje Sigma
  const obtenerSvgSigma = () => {
    return (
      <svg viewBox="-10 -50 120 150" className="sigma-svg">
        <defs>
          <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="20%" stopColor="#cbd5e1" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="80%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="6" stdDeviation="4" floodColor="#000000" floodOpacity="0.35" />
          </filter>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#0066FF" floodOpacity="0.6" />
          </filter>
        </defs>

        <g filter="url(#shadow3d)" className="sigma-body-group">
          {/* Símbolo Sigma brillante de fondo */}
          <text x="55" y="55" textAnchor="middle" dominantBaseline="middle" fontFamily="Arial" fontSize="65" fontWeight="bold" fill="rgba(0, 102, 255, 0.12)" filter="url(#glow)">Σ</text>

          {/* Forma de Sigma como clip doblado */}
          <path d="M 85 20 L 25 20 L 55 50 L 25 80 L 85 80" 
                fill="none" 
                stroke="url(#metalGradient)" 
                strokeWidth="13" 
                strokeLinecap="round" 
                strokeLinejoin="round" />
          
          {/* Birrete de Graduación */}
          <g className="sigma-grad-cap">
            <path d="M 40 -27 L 40 -17 Q 55 -10 70 -17 L 70 -27 Z" fill="#0f172a" />
            <polygon points="55,-45 12,-27 55,-9 98,-27" fill="#1e293b" stroke="#475569" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="55" cy="-27" r="4.5" fill="#f59e0b" />
            <path d="M 55 -27 L 88 -14 L 92 2" fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="92" cy="5" r="4" fill="#f59e0b" />
          </g>
          
          {/* Ojos Grandes */}
          <g className="sigma-eyes-group">
            <ellipse cx="38" cy="4" rx="14" ry="18" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
            <ellipse cx="68" cy="4" rx="14" ry="18" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />

            <g className="sigma-pupils">
              <circle cx="43" cy="7" r="5.5" fill="#0f172a" />
              <circle cx="41.5" cy="5.5" r="2" fill="#ffffff" opacity="0.9" />
              <circle cx="63" cy="7" r="5.5" fill="#0f172a" />
              <circle cx="61.5" cy="5.5" r="2" fill="#ffffff" opacity="0.9" />
            </g>
          </g>

          {/* Cejas */}
          <g className="sigma-eyebrows-group">
            <path d="M 23 -16 Q 38 -27 48 -13" fill="none" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
            <path d="M 58 -13 Q 68 -27 83 -16" fill="none" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />
          </g>

          {/* Lápiz Flotante */}
          <g className="sigma-pencil" transform="translate(-10, 32) rotate(-15)">
            <polygon points="15,40 20,40 17.5,50" fill="#fcd34d" />
            <polygon points="16.5,46 18.5,46 17.5,50" fill="#334155" />
            <polygon points="15,10 20,10 20,40 15,40" fill="#fbbf24" stroke="#d97706" strokeWidth="1" strokeLinejoin="round" />
            <line x1="17.5" y1="10" x2="17.5" y2="40" stroke="#f59e0b" strokeWidth="1" />
            <rect x="14" y="5" width="7" height="5" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
            <rect x="14" y="0" width="7" height="5" fill="#f43f5e" rx="1.5" />
          </g>
        </g>
      </svg>
    );
  };

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

  // Cargar datos al montar y escuchar eventos de cambio de conocimiento
  useEffect(() => {
    cargarConocimiento();

    // Permitir refrescar el cache de conocimiento si se actualiza en el cerebro de sigma
    const refrescarCanal = () => {
      cargarConocimiento();
    };
    window.addEventListener('sigae-sigma-refresh', refrescarCanal);
    return () => {
      window.removeEventListener('sigae-sigma-refresh', refrescarCanal);
    };
  }, []);

  // Saludo de bienvenida
  useEffect(() => {
    let saludo = "¡Hola! Soy <b>Sigma</b>, el Asistente Virtual de SIGAE. Estoy listo para asistirte en la plataforma. Desplázame por la pantalla y pregúntame lo que necesites.";
    
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

    // Cargar posición y estado minimizado
    const isMin = localStorage.getItem('sigma_minimizada') === 'true';
    setMinimizado(isMin);
    
    let savedX = parseInt(localStorage.getItem('sigma_pos_x') || '');
    let savedY = parseInt(localStorage.getItem('sigma_pos_y') || '');
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 120;
    
    if (isNaN(savedX) || savedX < 0 || savedX > maxX) savedX = maxX - 20;
    if (isNaN(savedY) || savedY < 0 || savedY > maxY) savedY = maxY - 20;
    
    setPosition({ x: savedX, y: savedY });
    setActivo(!isMin);
  }, [conocimientoCache]);

  // Notificar cambio de sección
  useEffect(() => {
    if (location.pathname === lastPath.current) return;
    lastPath.current = location.pathname;

    const pathParts = location.pathname.split('/');
    let currentModule = '';
    if (location.pathname === '/') {
      currentModule = 'Inicio';
    } else if (pathParts.includes('categoria')) {
      const category = decodeURIComponent(pathParts[pathParts.indexOf('categoria') + 1] || '');
      const view = decodeURIComponent(pathParts[pathParts.indexOf('categoria') + 2] || '');
      currentModule = view || category;
    }

    if (currentModule && !minimizado) {
      const schoolCode = localStorage.getItem('sigae_escuela_codigo') || 'sb';
      const schoolName = localStorage.getItem('sigae_escuela_activa') || (schoolCode === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
      
      setMensaje(`Has ingresado al módulo de <b>${currentModule}</b> para la institución <b>${schoolName}</b>. Si no sabes cómo utilizar esta sección, consúltame y te explicaré paso a paso.`);
      setAcciones([]);
      setActivo(true);
    }
  }, [location.pathname, minimizado]);

  // Drag logic handlers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.sigma-speech-bubble')) return;
    if ((e.target as HTMLElement).closest('.sigma-btn-minimize')) return;
    
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
    setMinimizado(true);
    setActivo(false);
    localStorage.setItem('sigma_minimizada', 'true');
  };

  const restaurar = () => {
    setMinimizado(false);
    setActivo(true);
    localStorage.setItem('sigma_minimizada', 'false');
  };

  // Reacciones hover animadas
  const triggerHoverReaction = () => {
    if (efectoHover || isDragging || minimizado) return;

    const effect = Math.floor(Math.random() * 8);

    if (effect === 0) {
      setEfectoHover('react-spin');
      setTimeout(() => setEfectoHover(''), 850);
    } else if (effect === 1) {
      createParticles('?', '#00C3FF', 8);
    } else if (effect === 2) {
      createParticles('!', '#FF3D00', 8);
    } else if (effect === 3) {
      createSparkles();
    } else if (effect === 4) {
      setEfectoHover('react-rainbow');
      setTimeout(() => setEfectoHover(''), 2000);
    } else if (effect === 5) {
      setEfectoHover('react-bounce');
      createParticles('🎵', '#E040FB', 4);
      setTimeout(() => {
        createParticles('🎶', '#FF4081', 4);
      }, 200);
      setTimeout(() => setEfectoHover(''), 1200);
    } else if (effect === 6) {
      setEfectoHover('react-shake');
      createParticles('💦', '#00B0FF', 6);
      setTimeout(() => setEfectoHover(''), 800);
    } else if (effect === 7) {
      setEfectoHover('react-portal');
      createPortalRing();
      setTimeout(() => setEfectoHover(''), 900);
    }
  };

  const createParticles = (text: string, color: string, count: number) => {
    const newParticles: any[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 60 + 40;
      const dx = Math.cos(angle) * distance + 'px';
      const dy = (Math.sin(angle) * distance - 40) + 'px';
      const rot = (Math.random() * 180 - 90) + 'deg';
      const id = ++particleId.current;

      newParticles.push({
        id,
        text,
        color,
        style: {
          color,
          fontSize: (Math.random() * 1.5 + 1.2) + 'rem',
          '--dx': dx,
          '--dy': dy,
          '--rot': rot,
          left: '40%',
          top: '40%',
          animation: 'float-question ' + (Math.random() * 0.4 + 0.8) + 's forwards cubic-bezier(0.1, 0.8, 0.3, 1)'
        } as React.CSSProperties
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
    }, 1200);
  };

  const createSparkles = () => {
    const colores = ['#FF3D00', '#00E676', '#2979FF', '#FFEA00', '#D500F9', '#00E5FF'];
    const count = 20;
    const newSparkles: any[] = [];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 70 + 30;
      const dx = Math.cos(angle) * distance + 'px';
      const dy = Math.sin(angle) * distance + 'px';
      const color = colores[Math.floor(Math.random() * colores.length)];
      const id = ++particleId.current;

      newSparkles.push({
        id,
        color,
        style: {
          background: color,
          boxShadow: `0 0 6px ${color}`,
          '--dx': dx,
          '--dy': dy,
          left: '45%',
          top: '45%',
          animation: 'explode-sparkle ' + (Math.random() * 0.3 + 0.6) + 's forwards cubic-bezier(0.1, 0.8, 0.3, 1)'
        } as React.CSSProperties
      });
    }

    setSparkles(prev => [...prev, ...newSparkles]);
    setTimeout(() => {
      setSparkles(prev => prev.filter(s => !newSparkles.some(ns => ns.id === s.id)));
    }, 1000);
  };

  const createPortalRing = () => {
    const id = ++particleId.current;
    const newRing = {
      id,
      style: {
        animation: 'ring-expand 0.9s forwards cubic-bezier(0.1, 0.8, 0.3, 1)'
      } as React.CSSProperties
    };
    setPortalRing(prev => [...prev, newRing]);
    setTimeout(() => {
      setPortalRing(prev => prev.filter(r => r.id !== id));
    }, 1000);
  };

  // Procesar preguntas del usuario
  const procesarPreguntaUsuario = (textoManual: string | null = null) => {
    const query = (textoManual !== null ? textoManual : inputValue).trim();
    if (!query) return;

    setInputValue('');
    setPensando(true);
    setMensaje("<div class='text-center'><span class='spinner-border spinner-border-sm text-primary'></span> <i>Analizando solicitud...</i></div>");
    setAcciones([]);
    setActivo(true);

    const queryClean = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 1. CHEQUEAR PALABRAS CLAVE DEL DICCIONARIO (DINÁMICAMENTE DESDE LA BASE DE DATOS)
    const pideDiccionario = /\b(diccionario|glosario|terminos|conceptos|definiciones)\b/i.test(queryClean);
    if (pideDiccionario) {
      setTimeout(() => {
        setPensando(false);
        // Filtrar temas que no sean saludos o bienvenidas
        const terminosList = conocimientoCache
          .filter(item => {
            const t = item.tema.toLowerCase();
            return !t.includes('bienvenida') && !t.includes('saludo') && !t.includes('despedida') && !t.includes('hola');
          })
          .map(item => item.tema)
          .filter((value, index, self) => self.indexOf(value) === index);
        
        const terminosHtml = terminosList.map(t => `<li>${t}</li>`).join('');
        
        setMensaje(`📚 <b>Diccionario Educativo y Guía de SIGAE</b><br/><br/>
          Aquí tienes una lista de conceptos y temas del ámbito escolar que puedo definirte. Escribe su nombre o pregúntame por ellos:<br/><br/>
          <ul>${terminosHtml}</ul>`);
        
        // Sugerir clics de los primeros 4 conceptos del glosario cargados
        const glosarioItems = conocimientoCache.filter(item => {
          const t = item.tema.toLowerCase();
          return !t.includes('bienvenida') && !t.includes('saludo') && !t.includes('despedida') && !t.includes('hola');
        });

        const quickActions = glosarioItems
          .slice(0, 4)
          .map(item => ({
            id: item.id,
            tipo: 'pregunta',
            valor: item.tema,
            tema: item.tema.includes('(') ? item.tema.split(' ')[0] : item.tema.substring(0, 15),
            esAlternativa: true
          }));

        setAcciones(quickActions);
      }, 500);
      return;
    }
    
    // Detectar si pregunta por la escuela/plantel
    const preguntaEscuela = /\b(escuela|plantel|colegio|sede|institucion|institución|donde estoy|dónde estoy|en que escuela|en qué escuela)\b/i.test(queryClean);
    // Detectar si pregunta por módulos/permisos/accesos
    const preguntaModulos = /\b(modulo|módulo|seccion|sección|activo|permiso|acceso|que puedo hacer|qué puedo hacer|mis accesos)\b/i.test(queryClean);

    if (preguntaEscuela || preguntaModulos) {
      setTimeout(() => {
        setPensando(false);
        const schoolCode = localStorage.getItem('sigae_escuela_codigo') || 'sb';
        const schoolName = localStorage.getItem('sigae_escuela_activa') || (schoolCode === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
        
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
          setAcciones([{
            id: 'escuela-acc',
            tipo: 'navegar',
            valor: 'Perfil de la Escuela',
            tema: 'Perfil de la Escuela',
            allowed: tienePermiso('Perfil de la Escuela', 'ver')
          }]);
        } else if (preguntaModulos && !preguntaEscuela) {
          const modulosPermitidos: string[] = [];
          const modulosPosibles = [
            'Perfil de la Escuela', 'Roles y Privilegios', 'Gestión de Usuarios', 'Auditoría del Sistema',
            'Espacios Escolares', 'Grados y Salones', 'Gestión de Matrícula', 'Gestión de Admisiones',
            'Carga de Notas y Calificaciones', 'Vincular Estudiante',
            'Expediente Estudiantil', 'Mi Expediente', 'Cargos Institucionales', 'Cadena Supervisoria',
            'Gestión de Colectivos', 'Transporte Escolar', 'Solicitud de Cupos', 'Cerebro de Sigma'
          ];
          
          modulosPosibles.forEach(mod => {
            if (tienePermiso(mod, 'ver')) {
              modulosPermitidos.push(mod);
            }
          });

          if (userRole === 'SuperAdmin') {
            setMensaje(`Hola <b>${userName}</b>, al ser <b>SuperAdmin</b> tienes acceso total a <b>todos los módulos</b> del sistema en <b>${schoolName}</b>.`);
          } else if (modulosPermitidos.length > 0) {
            const listHtml = modulosPermitidos.map(m => `<li><b>${m}</b></li>`).join('');
            setMensaje(`Hola <b>${userName}</b>, de acuerdo con tu rol de <b>${userRole}</b> en <b>${schoolName}</b>, tienes los siguientes módulos activos:<br/><br/><ul>${listHtml}</ul>`);
          } else {
            setMensaje(`Hola <b>${userName}</b>, actualmente no posees ningún módulo con permisos activos en <b>${schoolName}</b>.`);
          }
          setAcciones([]);
        } else {
          const modulosPermitidos: string[] = [];
          const modulosPosibles = [
            'Perfil de la Escuela', 'Roles y Privilegios', 'Gestión de Usuarios', 'Auditoría del Sistema',
            'Espacios Escolares', 'Grados y Salones', 'Gestión de Matrícula', 'Gestión de Admisiones',
            'Carga de Notas y Calificaciones', 'Vincular Estudiante',
            'Expediente Estudiantil', 'Mi Expediente', 'Cargos Institucionales', 'Cadena Supervisoria',
            'Gestión de Colectivos', 'Transporte Escolar', 'Solicitud de Cupos', 'Cerebro de Sigma'
          ];
          
          modulosPosibles.forEach(mod => {
            if (tienePermiso(mod, 'ver')) {
              modulosPermitidos.push(mod);
            }
          });

          let modsText = '';
          if (userRole === 'SuperAdmin') {
            modsText = `acceso total como <b>SuperAdmin</b> a todos los módulos.`;
          } else if (modulosPermitidos.length > 0) {
            modsText = `los siguientes módulos activos:<br/><br/><ul>${modulosPermitidos.map(m => `<li><b>${m}</b></li>`).join('')}</ul>`;
          } else {
            modsText = `ningún módulo activo.`;
          }

          setMensaje(`Te encuentras en la institución: <b>${schoolName}</b> (Código: <b>${schoolCode.toUpperCase()}</b>) con el rol de <b>${userRole}</b>.<br/><br/>Tienes ${modsText}`);
          setAcciones([]);
        }
      }, 500);
      return;
    }

    setTimeout(() => {
      setPensando(false);

      if (!fuseInstance) {
        setMensaje("Actualmente estoy desconectado de la base de datos central. No puedo procesar tu solicitud.");
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
    setMensaje("Lo siento, aún no conozco la respuesta a esa pregunta. La he registrado para que mis administradores me enseñen y así poder ayudarte mejor en el futuro.");
    setAcciones([]);
    try {
      const { error } = await supabase.from('sigma_preguntas_pendientes').insert([
        { pregunta: query, estado: 'pendiente' }
      ]);
      if (error) {
        console.error("Error de Supabase al insertar pregunta pendiente:", error);
      } else {
        window.dispatchEvent(new CustomEvent('sigae-sigma-pending-refresh'));
      }
    } catch (e) {
      console.error("Error registrando pregunta pendiente:", e);
    }
  };

  const ejecutarRespuesta = (items: any[]) => {
    const item = items[0];
    let htmlRespuesta = item.respuesta;

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
    if (item.accion_tipo && item.accion_valor) {
      const vistaInfo = getVistaFromKeyword(item.accion_valor);
      const allowed = tienePermiso(vistaInfo, 'ver') || vistaInfo === 'Inicio' || vistaInfo === 'Mi Perfil' || !vistaInfo;
      listAcciones.push({
        id: item.id,
        tipo: item.accion_tipo,
        valor: item.accion_valor,
        tema: item.tema,
        allowed
      });
    }

    // Sugerencias alternativas
    if (items.length > 1) {
      for (let i = 1; i < items.length; i++) {
        const alt = items[i];
        const vistaInfoAlt = getVistaFromKeyword(alt.accion_valor || '');
        const allowedAlt = tienePermiso(vistaInfoAlt, 'ver') || vistaInfoAlt === 'Inicio' || vistaInfoAlt === 'Mi Perfil' || !vistaInfoAlt;
        listAcciones.push({
          id: alt.id,
          tipo: alt.accion_tipo || 'pregunta',
          valor: alt.accion_valor || alt.tema,
          tema: alt.tema,
          allowed: allowedAlt,
          esAlternativa: true
        });
      }
    }

    setAcciones(listAcciones);
    setHablando(true);
    setTimeout(() => setHablando(false), 2000);
  };

  const getVistaFromKeyword = (keyword: string): string => {
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
      'mis_solicitudes': 'Mis Solicitudes',
      'sigma': 'Cerebro de Sigma',
      'inicio': 'Inicio',
      'panel': 'Panel de Control'
    };
    return mapToView[claveLimpia] || keyword;
  };

  const mapVistaToUrl = (vista: string): string => {
    const v = vista.toLowerCase().trim();
    if (v === 'inicio' || v === 'panel principal' || v === '/') return '/';
    if (v === 'mi perfil') return '/categoria/Seguridad y Accesos/Mi Perfil';
    if (v === 'métodos de acceso' || v === 'metodos de acceso') return '/categoria/Seguridad y Accesos/M%C3%A9todos%20de%20Acceso';
    if (v === 'gestión de usuarios' || v === 'gestion de usuarios') return '/categoria/Seguridad y Accesos/Gestión de Usuarios';
    if (v === 'roles y privilegios') return '/categoria/Seguridad y Accesos/Roles y Privilegios';
    if (v === 'preguntas de seguridad') return '/categoria/Seguridad y Accesos/Preguntas de Seguridad';
    if (v === 'auditoría del sistema' || v === 'auditoria del sistema') return '/categoria/Seguridad y Accesos/Auditoría del Sistema';
    if (v === 'perfil de la escuela') return '/categoria/Dirección y Sistema/Perfil de la Escuela';
    if (v === 'espacios escolares') return '/categoria/Dirección y Sistema/Espacios Escolares';
    if (v === 'configuración del sistema' || v === 'configuracion del sistema') return '/categoria/Dirección y Sistema/Configuración del Sistema';
    if (v === 'división territorial' || v === 'division territorial') return '/categoria/Dirección y Sistema/División Territorial';
    if (v === 'cerebro de sigma') return '/categoria/Dirección y Sistema/Cerebro de Sigma';
    return '';
  };

  const ejecutarAccion = (tipo: string, valor: string) => {
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
      <div className={`sigma-speech-bubble ${activo ? 'active' : ''}`} id="sigma-speech-bubble">
        <div className="sigma-bubble-header">
          <span className="sigma-bubble-title"><i className="bi bi-stars"></i> Asistente Sigma</span>
          <button className="sigma-bubble-close" onClick={() => setActivo(false)}>&times;</button>
        </div>
        
        <div className="sigma-bubble-content">
          <div dangerouslySetInnerHTML={{ __html: mensaje }} />
          
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
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') procesarPreguntaUsuario(); }}
            className="sigma-input" 
            placeholder="Pregunta algo sobre SIGAE..."
          />
          <button onClick={() => procesarPreguntaUsuario()} className="sigma-btn-send">
            <i className="bi bi-send-fill"></i>
          </button>
        </div>
      </div>

      {/* Avatar Gráfico de Sigma */}
      <div 
        className={`sigma-avatar-wrapper ${efectoHover}`} 
        id="sigma-avatar"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        onMouseEnter={triggerHoverReaction}
      >
        <button className="sigma-btn-minimize" onClick={minimizar} title="Ocultar Asistente">
          <i className="bi bi-eye-slash-fill"></i>
        </button>
        {obtenerSvgSigma()}

        {/* Partículas de Texto */}
        {particles.map((p) => (
          <div key={p.id} className="sigma-particle-text" style={p.style}>
            {p.text}
          </div>
        ))}

        {/* Chispas / Sparkles */}
        {sparkles.map((s) => (
          <div key={s.id} className="sigma-sparkle" style={s.style} />
        ))}

        {/* Portal Rings */}
        {portalRing.map((r) => (
          <div key={r.id} className="sigma-portal-ring" style={r.style} />
        ))}
      </div>
      
      {/* Sombra de profundidad */}
      <div className="sigma-shadow"></div>

      {/* Lanzador Flotante (minimizado) */}
      <div 
        className="sigma-launcher" 
        onClick={restaurar}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        title="Mostrar Sigma"
      >
        <span>Σ</span>
      </div>
    </div>
  );
};
