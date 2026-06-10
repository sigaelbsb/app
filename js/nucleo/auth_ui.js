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
});
