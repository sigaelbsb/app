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
                        <stop offset="0%" stop-color="#e2e8f0" />
                        <stop offset="50%" stop-color="#94a3b8" />
                        <stop offset="100%" stop-color="#475569" />
                    </linearGradient>
                    <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="2" dy="5" stdDeviation="3" flood-color="#000000" flood-opacity="0.4"/>
                    </filter>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#0066FF" flood-opacity="0.8"/>
                    </filter>
                </defs>

                <g filter="url(#shadow3d)" class="sigma-body-group">
                    <!-- Símbolo Sigma brillante de fondo para identidad -->
                    <text x="55" y="55" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="55" font-weight="bold" fill="rgba(0, 102, 255, 0.15)" filter="url(#glow)">Σ</text>

                    <!-- Forma de Sigma como clip doblado -->
                    <path d="M 85 20 L 25 20 L 55 50 L 25 80 L 85 80" 
                          fill="none" 
                          stroke="url(#metalGradient)" 
                          stroke-width="12" 
                          stroke-linecap="round" 
                          stroke-linejoin="round" />
                    
                    <!-- Elemento Escolar: Birrete de Graduación (Tamaño Grande y Centrado arriba de los ojos) -->
                    <g class="sigma-grad-cap">
                        <!-- Copa del sombrero -->
                        <path d="M 40 -27 L 40 -17 Q 55 -11 70 -17 L 70 -27 Z" fill="#0f172a" />
                        <!-- Tapa plana (Rombo) -->
                        <polygon points="55,-43 15,-27 55,-11 95,-27" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
                        <!-- Botón central -->
                        <circle cx="55" cy="-27" r="4" fill="#f59e0b" />
                        <!-- Borla cayendo a la derecha -->
                        <path d="M 55 -27 L 85 -17 L 88 -3" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                        <circle cx="88" cy="0" r="3.5" fill="#f59e0b" />
                    </g>
                    
                    <!-- Ojos Grandes (Descansando SOBRE el borde superior de la Sigma) -->
                    <g class="sigma-eyes-group">
                        <!-- Escleróticas (fondo blanco) -->
                        <ellipse cx="40" cy="5" rx="13" ry="17" fill="white" stroke="#334155" stroke-width="2"/>
                        <ellipse cx="68" cy="5" rx="13" ry="17" fill="white" stroke="#334155" stroke-width="2"/>

                        <!-- Pupilas -->
                        <g class="sigma-pupils">
                            <circle cx="45" cy="8" r="5" fill="#0f172a" />
                            <circle cx="63" cy="8" r="5" fill="#0f172a" />
                        </g>
                    </g>

                    <!-- Cejas Expresivas (Restaurando ambas) -->
                    <g class="sigma-eyebrows-group">
                        <path d="M 25 -15 Q 40 -25 50 -12" fill="none" stroke="#0f172a" stroke-width="4.5" stroke-linecap="round" />
                        <path d="M 55 -12 Q 68 -25 85 -15" fill="none" stroke="#0f172a" stroke-width="4.5" stroke-linecap="round" />
                    </g>

                    <!-- Elemento Escolar: Lápiz Flotante a la izquierda -->
                    <g class="sigma-pencil" transform="translate(-8, 30) rotate(-15)">
                        <polygon points="15,40 20,40 17.5,50" fill="#fcd34d" />
                        <polygon points="15,10 20,10 20,40 15,40" fill="#fbbf24" stroke="#d97706" stroke-width="1" />
                        <rect x="15" y="5" width="5" height="5" fill="#94a3b8" />
                        <rect x="15" y="0" width="5" height="5" fill="#f43f5e" rx="1" />
                    </g>
                </g>
            </svg>
        `;
    },

    init: function() {
        if (document.getElementById('sigma-container')) return;
        
        this.inyectarHTML();
        this.enlazarEventos();
        this.hookEnrutador();
        
        console.log("🌌 Sigma IA inicializada.");
        this.saludar();
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

        btnSend.onclick = () => this.procesarPreguntaGemini();
        input.onkeypress = (e) => {
            if (e.key === 'Enter') this.procesarPreguntaGemini();
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
    // NÚCLEO DE INTELIGENCIA ARTIFICIAL (GEMINI API)
    // ==========================================================
    procesarPreguntaGemini: async function() {
        const input = document.getElementById('sigma-input');
        const query = input.value.trim();
        if (!query) return;

        input.value = '';
        
        const apiKey = localStorage.getItem('sigae_gemini_api_key');
        if (!apiKey) {
            this.mostrarMensaje(`
                <strong class="d-block mb-1 text-danger">⚠️ Requiere Configuración API</strong>
                <p class="small text-muted mb-2">Para que pueda usar mi motor cognitivo avanzado, necesito que ingreses tu clave de Google Gemini API.</p>
                <div class="d-flex gap-2">
                    <input type="password" id="sigma-api-key" class="form-control form-control-sm rounded-pill" placeholder="AIzaSy...">
                    <button class="btn btn-sm btn-primary rounded-pill fw-bold" id="btn-save-sigma-key">Conectar</button>
                </div>
            `);
            
            setTimeout(() => {
                const btn = document.getElementById('btn-save-sigma-key');
                const inp = document.getElementById('sigma-api-key');
                if (btn && inp) {
                    btn.onclick = () => {
                        const val = inp.value.trim();
                        if(val) {
                            localStorage.setItem('sigae_gemini_api_key', val);
                            this.mostrarMensaje("✨ ¡Conexión neuronal establecida! Ya puedes preguntarme lo que sea.");
                        }
                    };
                }
            }, 100);
            return;
        }

        this.setThinking(true);
        this.mostrarMensaje("<div class='text-center'><span class='spinner-border spinner-border-sm text-primary'></span> <i>Procesando en la red neuronal...</i></div>");

        try {
            const systemPrompt = `Eres Sigma, un orbe holográfico abstracto y minimalista que actúa como la IA central del sistema escolar SIGAE. 
Tu personalidad es profesional, muy analítica, concisa, y elegante, parecida a un asistente virtual futurista de alta tecnología. 
Estás integrado directamente en la pantalla de los usuarios como un asistente que flota.
Responde estrictamente a las preguntas relacionadas con la gestión escolar y el uso del sistema SIGAE (matrículas, roles, aulas, importaciones). No uses párrafos largos; utiliza listas viñetadas y formato limpio.
Responde siempre en español.`;

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: query }] }],
                    systemInstruction: { parts: [{ text: systemPrompt }] }
                })
            });

            this.setThinking(false);

            if (!response.ok) {
                const errData = await response.json();
                if (response.status === 400 || response.status === 403) {
                    this.mostrarMensaje("Mi núcleo lógico detectó que la clave API ha caducado o es inválida. Por favor, revísala.");
                    localStorage.removeItem('sigae_gemini_api_key');
                } else {
                    throw new Error(errData.error?.message || "Falla de conectividad");
                }
                return;
            }

            const data = await response.json();
            const answer = data.candidates[0].content.parts[0].text;
            
            // Formatear markdown básico a HTML
            const htmlAnswer = answer
                .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                .replace(/\*(.*?)\*/g, '<i>$1</i>')
                .replace(/\n/g, '<br>');
                
            this.mostrarMensaje(htmlAnswer);

        } catch (e) {
            this.setThinking(false);
            console.error("Sigma Error:", e);
            this.mostrarMensaje("Hubo un error de conectividad en mis sensores. Por favor, intenta de nuevo en unos segundos.");
        }
    }
};

// Auto inicialización
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.Sigma.init());
} else {
    window.Sigma.init();
}
