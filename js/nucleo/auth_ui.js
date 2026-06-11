/* =========================================================================
   SIGAE - LOGICA DE UI (auth_ui.js)
   ========================================================================= */

window.ejecutarTransicionDigital = function(callback) {
    const contenedor = document.getElementById('contenedor-transicion');
    if(!contenedor) {
        if(callback) callback();
        return;
    }
    
    contenedor.style.display = 'block';
    contenedor.classList.remove('fade-out-global');
    
    let gridHtml = '<div class="grid-container">';
    for(let i=0; i<100; i++) {
        gridHtml += `<div class="grid-box" style="transition-delay: ${Math.random() * 0.4}s"></div>`;
    }
    gridHtml += '</div>';
    contenedor.innerHTML = gridHtml;
    
    setTimeout(() => {
        document.querySelectorAll('.grid-box').forEach(el => el.classList.add('play'));
    }, 50);

    setTimeout(() => {
        if(callback) callback(); 
        contenedor.classList.add('fade-out-global');
        setTimeout(() => {
            contenedor.style.display = 'none';
            contenedor.innerHTML = '';
        }, 600); 
    }, 750); 
};

// Lógica para Selección de Escuela
window.escuelaActual = '';
window.codigoEscuelaActual = '';

window.seleccionarEscuela = function(nombre, codigo) {
    window.escuelaActual = nombre;
    window.codigoEscuelaActual = codigo;
    localStorage.setItem('sigae_escuela_activa', nombre);
    localStorage.setItem('sigae_escuela_codigo', codigo);

    // Cambiar textos y logos según escuela seleccionada
    const txtNombre = document.getElementById('txt-nombre-escuela-login');
    const imgLogo = document.getElementById('img-logo-login');
    
    if(txtNombre) txtNombre.innerHTML = nombre.replace('UE ', 'UE <br class="d-none d-md-block">');
    if(imgLogo) {
        imgLogo.src = 'assets/img/logo_' + codigo + '.png';
        imgLogo.onerror = function() { this.src = 'assets/img/sigae.png'; };
    }

    // Transición suave
    const vistaSelector = document.getElementById('vista-selector');
    const vistaFormulario = document.getElementById('vista-formulario');
    
    if(vistaSelector && vistaFormulario) {
        vistaSelector.classList.remove('animate__fadeIn');
        vistaSelector.classList.add('animate__fadeOut');
        
        setTimeout(() => {
            vistaSelector.style.display = 'none';
            vistaSelector.classList.remove('animate__fadeOut');
            
            vistaFormulario.style.display = 'flex';
        }, 500);
    }
}

window.volverASelectorEscuela = function() {
    const vistaSelector = document.getElementById('vista-selector');
    const vistaFormulario = document.getElementById('vista-formulario');
    
    if(vistaSelector && vistaFormulario) {
        vistaFormulario.classList.remove('animate__zoomIn');
        vistaFormulario.classList.add('animate__zoomOut');
        
        setTimeout(() => {
            vistaFormulario.style.display = 'none';
            vistaFormulario.classList.remove('animate__zoomOut');
            vistaFormulario.classList.add('animate__zoomIn');
            
            vistaSelector.style.display = 'block';
            vistaSelector.classList.add('animate__fadeIn');
        }, 500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Configurar el footer
    const anioActual = new Date().getFullYear();
    const elAnio = document.getElementById('anio-actual-footer-app');
    if(elAnio) {
        elAnio.textContent = anioActual;
    }
    
    // Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => { 
            navigator.serviceWorker.register('./sw.js?v=4').catch(()=>{}); 
        });
    }

    // --- Enlaces de Eventos Dinámicos (Evitando Inline JS) ---
    
    // Selector de Escuelas
    const btnSb = document.getElementById('btn-seleccionar-sb');
    if(btnSb) btnSb.addEventListener('click', () => seleccionarEscuela('UE Santa Bárbara', 'sb'));

    const btnLb = document.getElementById('btn-seleccionar-lb');
    if(btnLb) btnLb.addEventListener('click', () => seleccionarEscuela('UE Libertador Bolívar', 'lb'));

    const btnVolverSelector = document.getElementById('btn-volver-selector');
    if(btnVolverSelector) btnVolverSelector.addEventListener('click', volverASelectorEscuela);

    // Paso Cédula
    const btnVerificarUsr = document.getElementById('btn-verificar-usuario');
    if(btnVerificarUsr) btnVerificarUsr.addEventListener('click', () => {
        if(window.Aplicacion && typeof window.Aplicacion.verificarUsuario === 'function') {
            window.Aplicacion.verificarUsuario();
        }
    });

    const btnLoginBiometrico = document.getElementById('btn-login-biometrico');
    if(btnLoginBiometrico) btnLoginBiometrico.addEventListener('click', () => {
        if(window.Aplicacion && typeof window.Aplicacion.loginBiometrico === 'function') {
            window.Aplicacion.loginBiometrico();
        }
    });

    // Paso Clave
    const btnAlternarClaveLogin = document.getElementById('btn-alternar-clave-login');
    if(btnAlternarClaveLogin) btnAlternarClaveLogin.addEventListener('click', () => {
        if(window.Aplicacion && typeof window.Aplicacion.alternarClave === 'function') {
            window.Aplicacion.alternarClave('inputClave');
        }
    });

    const btnIniciarSesion = document.getElementById('btn-iniciar-sesion');
    if(btnIniciarSesion) btnIniciarSesion.addEventListener('click', () => {
        if(window.Aplicacion && typeof window.Aplicacion.iniciarSesion === 'function') {
            window.Aplicacion.iniciarSesion();
        }
    });

    const btnOlvidoClave = document.getElementById('btn-olvido-clave');
    if(btnOlvidoClave) btnOlvidoClave.addEventListener('click', () => {
        if(window.Aplicacion && typeof window.Aplicacion.iniciarRecuperacion === 'function') {
            window.Aplicacion.iniciarRecuperacion();
        }
    });

    // Paso Recuperación
    const btnAlternarRecClave1 = document.getElementById('btn-alternar-rec-clave1');
    if(btnAlternarRecClave1) btnAlternarRecClave1.addEventListener('click', () => {
        if(window.Aplicacion && typeof window.Aplicacion.alternarClave === 'function') {
            window.Aplicacion.alternarClave('rec-clave1');
        }
    });

    const btnAlternarRecClave2 = document.getElementById('btn-alternar-rec-clave2');
    if(btnAlternarRecClave2) btnAlternarRecClave2.addEventListener('click', () => {
        if(window.Aplicacion && typeof window.Aplicacion.alternarClave === 'function') {
            window.Aplicacion.alternarClave('rec-clave2');
        }
    });

    const inputRecClave1 = document.getElementById('rec-clave1');
    if(inputRecClave1) inputRecClave1.addEventListener('input', (e) => {
        if(window.Aplicacion && typeof window.Aplicacion.evaluarFuerzaClaveRecuperacion === 'function') {
            window.Aplicacion.evaluarFuerzaClaveRecuperacion(e.target.value);
        }
    });

    const btnProcesarRec = document.getElementById('btn-procesar-recuperacion');
    if(btnProcesarRec) btnProcesarRec.addEventListener('click', () => {
        if(window.Aplicacion && typeof window.Aplicacion.procesarRecuperacion === 'function') {
            window.Aplicacion.procesarRecuperacion();
        }
    });

    const btnSolicitarSoporte = document.getElementById('btn-solicitar-soporte');
    if(btnSolicitarSoporte) btnSolicitarSoporte.addEventListener('click', () => {
        if(window.Aplicacion && typeof window.Aplicacion.solicitarSoporteAdministrador === 'function') {
            window.Aplicacion.solicitarSoporteAdministrador();
        }
    });

    const btnCancelarRec = document.getElementById('btn-cancelar-recuperacion');
    if(btnCancelarRec) btnCancelarRec.addEventListener('click', () => {
        if(window.Aplicacion && typeof window.Aplicacion.cancelarRecuperacion === 'function') {
            window.Aplicacion.cancelarRecuperacion();
        }
    });

    // Paso Primer Ingreso
    const inputPiClave1 = document.getElementById('pi-clave1');
    if(inputPiClave1) inputPiClave1.addEventListener('input', (e) => {
        if(window.Aplicacion && typeof window.Aplicacion.evaluarFuerzaClave === 'function') {
            window.Aplicacion.evaluarFuerzaClave(e.target.value);
        }
    });

    const btnAlternarPiClave1 = document.getElementById('btn-alternar-pi-clave1');
    if(btnAlternarPiClave1) btnAlternarPiClave1.addEventListener('click', () => {
        if(window.Aplicacion && typeof window.Aplicacion.alternarClave === 'function') {
            window.Aplicacion.alternarClave('pi-clave1');
        }
    });

    const btnAlternarPiClave2 = document.getElementById('btn-alternar-pi-clave2');
    if(btnAlternarPiClave2) btnAlternarPiClave2.addEventListener('click', () => {
        if(window.Aplicacion && typeof window.Aplicacion.alternarClave === 'function') {
            window.Aplicacion.alternarClave('pi-clave2');
        }
    });

    const inputPiTelefono = document.getElementById('pi-telefono');
    if(inputPiTelefono) inputPiTelefono.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    const btnProcesarPi = document.getElementById('btn-procesar-primer-ingreso');
    if(btnProcesarPi) btnProcesarPi.addEventListener('click', () => {
        if(window.Aplicacion && typeof window.Aplicacion.procesarPrimerIngreso === 'function') {
            window.Aplicacion.procesarPrimerIngreso();
        }
    });

    // Paso Invitado
    const btnEnviarRegistroInvitado = document.getElementById('btn-enviar-registro-invitado');
    if(btnEnviarRegistroInvitado) btnEnviarRegistroInvitado.addEventListener('click', () => {
        if(window.Aplicacion && typeof window.Aplicacion.enviarRegistroInvitado === 'function') {
            window.Aplicacion.enviarRegistroInvitado();
        }
    });

    // Botones con recarga general
    document.querySelectorAll('.btn-recargar-pagina').forEach(btn => {
        btn.addEventListener('click', () => location.reload());
    });
});

// Lógica para el Prompt de Instalación PWA Automático
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Verificar si el usuario ya declinó la instalación
    if (localStorage.getItem('sigae_pwa_declined')) return;
    
    // Esperar unos segundos para no interrumpir la carga inicial
    setTimeout(() => {
        if (typeof Swal !== 'undefined' && deferredPrompt) {
            Swal.fire({
                title: '📲 Instalar Aplicación',
                text: '¿Deseas instalar SIGAE en tu dispositivo? Obtendrás acceso directo y una experiencia más rápida a pantalla completa.',
                icon: 'info',
                showCancelButton: true,
                confirmButtonColor: '#0066FF',
                cancelButtonColor: '#6c757d',
                confirmButtonText: '<i class="bi bi-download me-1"></i> Instalar',
                cancelButtonText: 'Más tarde'
            }).then((result) => {
                if (result.isConfirmed) {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'dismissed') {
                            localStorage.setItem('sigae_pwa_declined', 'true');
                        }
                        deferredPrompt = null;
                    });
                } else {
                    localStorage.setItem('sigae_pwa_declined', 'true');
                }
            });
        }
    }, 2500);
});
