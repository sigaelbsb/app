/* ==========================================================
   MÓDULO DE SIGMA (ASISTENTE IA FLOTANTE TIPO CLIPPY)
   ✨ PERSONAJE ARRASTRABLE E INTERACTIVO IMPULSADO POR GEMINI ✨
============================================================= */

window.Sigma = {
    activo: false,
    escribiendo: false,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    
    // Generador del SVG del Personaje Sigma (Escolar + Clippy)
    obtenerSvgSigma: function() {
        return `
            <svg viewBox="-10 -50 120 150" class="sigma-svg">
                <defs>
                    <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#ffffff" />
                        <stop offset="20%" stop-color="#cbd5e1" />
                        <stop offset="50%" stop-color="#94a3b8" />
                        <stop offset="80%" stop-color="#64748b" />
                        <stop offset="100%" stop-color="#1e293b" />
                    </linearGradient>
                    <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="2" dy="6" stdDeviation="4" flood-color="#000000" flood-opacity="0.35"/>
                    </filter>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#0066FF" flood-opacity="0.6"/>
                    </filter>
                </defs>

                <g filter="url(#shadow3d)" class="sigma-body-group">
                    <!-- Símbolo Sigma brillante de fondo para identidad -->
                    <text x="55" y="55" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="65" font-weight="bold" fill="rgba(0, 102, 255, 0.12)" filter="url(#glow)">Σ</text>

                    <!-- Forma de Sigma como clip doblado -->
                    <path d="M 85 20 L 25 20 L 55 50 L 25 80 L 85 80" 
                          fill="none" 
                          stroke="url(#metalGradient)" 
                          stroke-width="13" 
                          stroke-linecap="round" 
                          stroke-linejoin="round" />
                    
                    <!-- Elemento Escolar: Birrete de Graduación (Tamaño Grande y Centrado) -->
                    <g class="sigma-grad-cap">
                        <!-- Copa del sombrero -->
                        <path d="M 40 -27 L 40 -17 Q 55 -10 70 -17 L 70 -27 Z" fill="#0f172a" />
                        <!-- Tapa plana (Rombo) -->
                        <polygon points="55,-45 12,-27 55,-9 98,-27" fill="#1e293b" stroke="#475569" stroke-width="2" stroke-linejoin="round" />
                        <!-- Botón central -->
                        <circle cx="55" cy="-27" r="4.5" fill="#f59e0b" />
                        <!-- Borla cayendo a la derecha -->
                        <path d="M 55 -27 L 88 -14 L 92 2" fill="none" stroke="#f59e0b" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
                        <circle cx="92" cy="5" r="4" fill="#f59e0b" />
                    </g>
                    
                    <!-- Ojos Grandes (Descansando SOBRE el borde superior de la Sigma) -->
                    <g class="sigma-eyes-group">
                        <!-- Escleróticas (fondo blanco) -->
                        <ellipse cx="38" cy="4" rx="14" ry="18" fill="#ffffff" stroke="#1e293b" stroke-width="2.5"/>
                        <ellipse cx="68" cy="4" rx="14" ry="18" fill="#ffffff" stroke="#1e293b" stroke-width="2.5"/>

                        <!-- Pupilas -->
                        <g class="sigma-pupils">
                            <circle cx="43" cy="7" r="5.5" fill="#0f172a" />
                            <circle cx="41.5" cy="5.5" r="2" fill="#ffffff" opacity="0.9" /> <!-- Catchlight -->
                            <circle cx="63" cy="7" r="5.5" fill="#0f172a" />
                            <circle cx="61.5" cy="5.5" r="2" fill="#ffffff" opacity="0.9" /> <!-- Catchlight -->
                        </g>
                    </g>

                    <!-- Cejas Expresivas -->
                    <g class="sigma-eyebrows-group">
                        <path d="M 23 -16 Q 38 -27 48 -13" fill="none" stroke="#0f172a" stroke-width="5" stroke-linecap="round" />
                        <path d="M 58 -13 Q 68 -27 83 -16" fill="none" stroke="#0f172a" stroke-width="5" stroke-linecap="round" />
                    </g>

                    <!-- Elemento Escolar: Lápiz Flotante a la izquierda (Altamente Detallado) -->
                    <g class="sigma-pencil" transform="translate(-10, 32) rotate(-15)">
                        <!-- Madera -->
                        <polygon points="15,40 20,40 17.5,50" fill="#fcd34d" />
                        <!-- Punta (Grafito) -->
                        <polygon points="16.5,46 18.5,46 17.5,50" fill="#334155" />
                        <!-- Cuerpo Principal -->
                        <polygon points="15,10 20,10 20,40 15,40" fill="#fbbf24" stroke="#d97706" stroke-width="1" stroke-linejoin="round" />
                        <!-- Línea central del lápiz hex -->
                        <line x1="17.5" y1="10" x2="17.5" y2="40" stroke="#f59e0b" stroke-width="1" />
                        <!-- Metal del borrador -->
                        <rect x="14" y="5" width="7" height="5" fill="#cbd5e1" stroke="#64748b" stroke-width="1" />
                        <!-- Borrador -->
                        <rect x="14" y="0" width="7" height="5" fill="#f43f5e" rx="1.5" />
                    </g>
                </g>
            </svg>
        `;
    },

    conocimientoCache: [],
    fuseInstance: null,

    init: async function() {
        if (document.getElementById('sigma-container')) return;
        
        this.inyectarHTML();
        this.enlazarEventos();
        this.hookEnrutador();
        
        console.log("🌌 Sigma IA inicializada.");
        this.saludar();
        await this.cargarConocimiento();
    },

    cargarConocimiento: async function() {
        try {
            if (!window.supabaseClient) {
                console.warn("Supabase no inicializado. Sigma operará en modo offline.");
                return;
            }
            const { data, error } = await window.supabaseClient
                .from('sigma_conocimiento')
                .select('*');
                
            if (error) throw error;
            if (data) {
                this.conocimientoCache = data;
                
                // Configurar Fuse.js para búsqueda difusa
                const opcionesFuse = {
                    includeScore: true,
                    threshold: 0.4, // Tolerancia a errores (0 es exacto, 1 es muy suelto)
                    keys: [
                        { name: 'palabras_clave', weight: 0.7 },
                        { name: 'tema', weight: 0.3 }
                    ]
                };
                // El Fuse busca dentro del array de palabras clave
                this.fuseInstance = new Fuse(this.conocimientoCache, opcionesFuse);
                console.log("🧠 Conocimiento de Sigma cargado:", data.length, "temas.");
            }
        } catch (e) {
            console.error("Error cargando conocimiento de Sigma:", e);
        }
    },

    inyectarHTML: function() {
        // Recuperar posición guardada o usar por defecto, asegurando que no se salga de la pantalla
        let savedX = parseInt(localStorage.getItem('sigma_pos_x'));
        let savedY = parseInt(localStorage.getItem('sigma_pos_y'));
        
        let maxX = window.innerWidth - 100;
        let maxY = window.innerHeight - 100;
        
        if (isNaN(savedX) || savedX < 0 || savedX > maxX) savedX = maxX - 20;
        if (isNaN(savedY) || savedY < 0 || savedY > maxY) savedY = maxY - 20;

        let posX = savedX + 'px';
        let posY = savedY + 'px';

        const container = document.createElement('div');
        container.id = 'sigma-container';
        container.className = 'sigma-container';
        container.style.left = posX;
        container.style.top = posY;

        container.innerHTML = `
            <!-- Burbuja de Diálogo Interactiva -->
            <div class="sigma-speech-bubble" id="sigma-speech-bubble">
                <div class="sigma-bubble-header">
                    <span class="sigma-bubble-title"><i class="bi bi-stars"></i> Sigma IA</span>
                    <button class="sigma-bubble-close" id="btn-close-sigma">&times;</button>
                </div>
                
                <div class="sigma-bubble-content" id="sigma-bubble-text">
                    ¡Iniciando sistemas...!
                </div>
                
                <!-- Input de Interacción -->
                <div class="sigma-input-group">
                    <input type="text" id="sigma-input" class="sigma-input" placeholder="Pregunta algo sobre SIGAE...">
                    <button id="btn-send-sigma" class="sigma-btn-send"><i class="bi bi-send-fill"></i></button>
                </div>
            </div>

            <!-- Avatar Gráfico de Sigma -->
            <div class="sigma-avatar-wrapper" id="sigma-avatar">
                ${this.obtenerSvgSigma()}
            </div>
            
            <!-- Sombra de profundidad -->
            <div class="sigma-shadow"></div>
        `;
        document.body.appendChild(container);
    },

    enlazarEventos: function() {
        const container = document.getElementById('sigma-container');
        const avatar = document.getElementById('sigma-avatar');
        const bubble = document.getElementById('sigma-speech-bubble');
        const btnClose = document.getElementById('btn-close-sigma');
        const btnSend = document.getElementById('btn-send-sigma');
        const input = document.getElementById('sigma-input');

        // ==========================================
        // Lógica de Arrastre (Drag & Drop)
        // ==========================================
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        const onDragStart = (e) => {
            if (e.target.closest('.sigma-speech-bubble')) return; // No arrastrar desde la burbuja
            isDragging = true;
            container.style.transition = 'none'; // Quitar transición suave al arrastrar
            
            // Soportar Mouse y Touch
            let clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            let clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

            startX = clientX;
            startY = clientY;
            initialLeft = container.offsetLeft;
            initialTop = container.offsetTop;
        };

        const onDragMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();

            let clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            let clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

            let dx = clientX - startX;
            let dy = clientY - startY;

            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;

            // Mantener dentro de los límites de la ventana
            if (newLeft < 0) newLeft = 0;
            if (newTop < 0) newTop = 0;
            if (newLeft + container.offsetWidth > window.innerWidth) newLeft = window.innerWidth - container.offsetWidth;
            if (newTop + container.offsetHeight > window.innerHeight) newTop = window.innerHeight - container.offsetHeight;

            container.style.left = newLeft + 'px';
            container.style.top = newTop + 'px';

            // Ajustar posición de la burbuja para que no se salga de la pantalla
            if (newLeft < 350) {
                bubble.style.right = 'auto';
                bubble.style.left = '-20px';
                bubble.style.setProperty('--sigma-arrow-pos', '10%');
            } else {
                bubble.style.left = 'auto';
                bubble.style.right = '-20px';
                bubble.style.setProperty('--sigma-arrow-pos', '90%');
            }
        };

        const onDragEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;
            container.style.transition = 'top 0.3s, left 0.3s';
            
            // Guardar posición
            localStorage.setItem('sigma_pos_x', container.style.left);
            localStorage.setItem('sigma_pos_y', container.style.top);

            // Si el movimiento fue mínimo, tratarlo como un clic para abrir la burbuja
            let clientX = e.type.includes('mouse') ? e.clientX : (e.changedTouches ? e.changedTouches[0].clientX : startX);
            let clientY = e.type.includes('mouse') ? e.clientY : (e.changedTouches ? e.changedTouches[0].clientY : startY);
            let dist = Math.abs(clientX - startX) + Math.abs(clientY - startY);
            
            if (dist < 5) {
                this.toggleBurbuja();
            }
        };

        avatar.addEventListener('mousedown', onDragStart);
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);

        avatar.addEventListener('touchstart', onDragStart, {passive: false});
        document.addEventListener('touchmove', onDragMove, {passive: false});
        document.addEventListener('touchend', onDragEnd);

        // ==========================================
        // Eventos de UI
        // ==========================================
        btnClose.onclick = () => this.toggleBurbuja(false);

        btnSend.onclick = () => this.procesarPreguntaUsuario();
        input.onkeypress = (e) => {
            if (e.key === 'Enter') this.procesarPreguntaUsuario();
        };
    },

    toggleBurbuja: function(forzar) {
        const bubble = document.getElementById('sigma-speech-bubble');
        if (!bubble) return;
        
        if (forzar !== undefined) {
            if (forzar) bubble.classList.add('active');
            else bubble.classList.remove('active');
        } else {
            bubble.classList.toggle('active');
        }

        // Foco automático en el input al abrir
        if (bubble.classList.contains('active')) {
            setTimeout(() => document.getElementById('sigma-input').focus(), 300);
        }
    },

    setThinking: function(isThinking) {
        const container = document.getElementById('sigma-container');
        if (!container) return;
        if (isThinking) {
            container.classList.add('thinking');
            container.classList.remove('talking');
            this.escribiendo = true;
        } else {
            container.classList.remove('thinking');
            this.escribiendo = false;
        }
    },

    setTalking: function(isTalking) {
        const container = document.getElementById('sigma-container');
        if (!container) return;
        if (isTalking) {
            container.classList.add('talking');
        } else {
            container.classList.remove('talking');
        }
    },

    mostrarMensaje: function(htmlTexto, autohide = false) {
        const textContainer = document.getElementById('sigma-bubble-text');
        if (!textContainer) return;
        
        textContainer.innerHTML = htmlTexto;
        this.toggleBurbuja(true);
        this.setTalking(true);

        setTimeout(() => this.setTalking(false), 2000);

        if (autohide) {
            setTimeout(() => this.toggleBurbuja(false), 6000);
        }
    },

    saludar: function() {
        const esLogueado = (document.getElementById('vista-app') && !document.getElementById('vista-app').classList.contains('d-none'));
        let msj = esLogueado ? 
            "¡Hola! Soy <b>Sigma</b>, la Inteligencia Artificial del SIGAE. Estoy listo para asistirte en la plataforma. Arrástrame por la pantalla y pregúntame lo que necesites." : 
            "Saludos, soy <b>Sigma</b>. Bienvenido a SIGAE. Si eres visitante, busca el acceso en tu escuela. Si tienes dudas, pregúntame directamente aquí.";
        
        this.mostrarMensaje(msj);
    },

    hookEnrutador: function() {
        if (window.Enrutador) {
            const originalCargarVista = window.Enrutador.cargarVista;
            const self = this;
            window.Enrutador.cargarVista = async function(nombreVista, guardarHistorial = true) {
                await originalCargarVista.call(window.Enrutador, nombreVista, guardarHistorial);
                self.notificarCambioModulo(nombreVista);
            };
        }
    },

    notificarCambioModulo: function(nombreVista) {
        this.mostrarMensaje(`Has ingresado al módulo de <b>${nombreVista}</b>. Si no sabes cómo utilizar esta sección, consúltame y te explicaré paso a paso.`, true);
    },

    // ==========================================================
    // NÚCLEO DE ASISTENTE DE ACCIÓN (SUPABASE + FUSE.JS)
    // ==========================================================
    procesarPreguntaUsuario: function(textoManual = null) {
        const input = document.getElementById('sigma-input');
        const query = textoManual !== null ? textoManual : input.value.trim();
        if (!query) return;

        input.value = '';
        this.setThinking(true);
        this.mostrarMensaje("<div class='text-center'><span class='spinner-border spinner-border-sm text-primary'></span> <i>Analizando solicitud...</i></div>");
        
        // Simular un pequeño tiempo de "pensamiento" para interactividad
        setTimeout(() => {
            this.setThinking(false);
            
            if (!this.fuseInstance) {
                this.mostrarMensaje("Actualmente estoy desconectado de la base de datos central. No puedo procesar tu solicitud.");
                return;
            }

            const resultados = this.fuseInstance.search(query);

            if (resultados.length > 0) {
                // Tomamos el mejor match
                const mejorCoincidencia = resultados[0].item;
                const score = resultados[0].score;

                // Si hay más de un resultado y los scores son similares (ambigüedad), podríamos mostrar opciones.
                // Por ahora ejecutamos el mejor directamente para mayor velocidad.
                this.ejecutarRespuesta(mejorCoincidencia);
            } else {
                this.mostrarMensaje("Lo siento, no entendí eso. ¿Podrías intentar usar otras palabras? (ej: 'inscribir alumno', 'cargar notas', 'asistencia')");
            }
        }, 500);
    },

    ejecutarRespuesta: function(item) {
        let htmlRespuesta = item.respuesta;

        // Validar si la respuesta tiene una acción de navegación o interfaz
        if (item.accion_tipo === 'navegar' && item.accion_valor) {
            // Se le dice al enrutador que cambie la vista automáticamente
            const vista = item.accion_valor.replace('#', '');
            if (window.Enrutador && window.Enrutador.cargarVista) {
                window.location.hash = vista;
            }
        } else if (item.accion_tipo === 'abrir_modal' && item.accion_valor) {
            const modalEl = document.getElementById(item.accion_valor);
            if (modalEl) {
                const modal = new bootstrap.Modal(modalEl);
                modal.show();
            }
        }

        // Mostrar la respuesta en texto
        this.mostrarMensaje(htmlRespuesta, false);
    }
};

// Auto inicialización
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Sigma.init());
} else {
    window.Sigma.init();
}
