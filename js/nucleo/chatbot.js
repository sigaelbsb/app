/* ==========================================================
   MÓDULO DE SIGMA (ASISTENTE IA FLOTANTE TIPO CLIPPY)
   ✨ PERSONAJE ARRASTRABLE E INTERACTIVO IMPULSADO POR GEMINI ✨
============================================================= */

window.Sigma = {
    activo: false,
    escribiendo: false,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    
    // Generador del SVG Holográfico de Sigma
    obtenerSvgSigma: function() {
        return `
            <svg viewBox="0 0 100 100" class="sigma-svg">
                <!-- Anillos Exteriores -->
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0, 195, 255, 0.2)" stroke-width="2" class="sigma-ring-1" stroke-dasharray="60 20" />
                <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(123, 36, 241, 0.3)" stroke-width="1.5" class="sigma-ring-2" stroke-dasharray="40 30" />
                
                <!-- Orbe Central Glassmorphism -->
                <circle cx="50" cy="50" r="28" fill="url(#sigmaGradient)" filter="drop-shadow(0 0 10px rgba(0, 195, 255, 0.6))" />
                
                <!-- Brillo de Cristal -->
                <path d="M 35 35 Q 50 25 65 35 A 25 25 0 0 0 35 35" fill="rgba(255,255,255,0.4)" />
                
                <!-- Símbolo Sigma en el Centro -->
                <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="28" font-weight="bold" fill="#ffffff" filter="drop-shadow(0 0 5px rgba(255,255,255,0.8))">Σ</text>
                
                <defs>
                    <linearGradient id="sigmaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#00C3FF" />
                        <stop offset="100%" stop-color="#0b2e59" />
                    </linearGradient>
                </defs>
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
        // Recuperar posición guardada o usar por defecto
        let posX = localStorage.getItem('sigma_pos_x') || (window.innerWidth - 120) + 'px';
        let posY = localStorage.getItem('sigma_pos_y') || (window.innerHeight - 120) + 'px';

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
        this.mostrarMensaje("<div class="text-center"><span class="spinner-border spinner-border-sm text-primary"></span> <i>Procesando en la red neuronal...</i></div>");

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
