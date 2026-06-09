/**
 * MÓDULO: PANEL PRINCIPAL (INICIO)
 * ADAPTADO AL DISEÑO 3D CON IMÁGENES ILUSTRATIVAS Y CÁLCULO DE FASES
 */

window.ModInicio = {
    init: function() {
        this.dibujarInterfaz();
    },

    dibujarInterfaz: function() {
        const contenedor = document.getElementById('area-dinamica');
        
        let nombreUsuario = "Usuario";
        if (window.Aplicacion && window.Aplicacion.usuario && window.Aplicacion.usuario.nombre) {
            nombreUsuario = window.Aplicacion.usuario.nombre.split(' ')[0];
        }

        // El HTML ahora se carga desde vistas/inicio.html vía el Enrutador
        if(contenedor) {
            // Actualizar Saludo
            let lblSaludo = document.getElementById('lbl-saludo-usuario');
            if(lblSaludo) lblSaludo.innerText = `¡Hola, ${nombreUsuario}!`;

            document.getElementById('titulo-pagina').innerText = "Inicio";
            window.Aplicacion.marcarMenuActivo("Inicio");
            
            // Disparar las lecturas
            this.configurarFechaInmediata();
            this.cargarPerfilEscuela();
            this.actualizarHeaderGlobal();
            
            // Ocultar tarjetas de las escuelas sin acceso
            if(window.Aplicacion && typeof window.Aplicacion.tieneAccesoEscuela === 'function') {
                const colLB = document.getElementById('tarjeta-inicio-lb');
                const colSB = document.getElementById('tarjeta-inicio-sb');
                
                if (colLB) {
                    if(!window.Aplicacion.tieneAccesoEscuela('lb')) {
                        colLB.style.display = 'none';
                    } else {
                        // Si se oculta SB, LB ocupa todo el ancho
                        if(!window.Aplicacion.tieneAccesoEscuela('sb')) {
                            colLB.classList.remove('col-xl-6');
                            colLB.classList.add('col-xl-12');
                        }
                    }
                }
                
                if (colSB) {
                    if(!window.Aplicacion.tieneAccesoEscuela('sb')) {
                        colSB.style.display = 'none';
                    } else {
                        // Si se oculta LB, SB ocupa todo el ancho
                        if(!window.Aplicacion.tieneAccesoEscuela('lb')) {
                            colSB.classList.remove('col-xl-6');
                            colSB.classList.add('col-xl-12');
                        }
                    }
                }
            }
        }
    },

    configurarFechaInmediata: function() {
        let opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        let fechaReal = window.Aplicacion.obtenerFechaReal ? window.Aplicacion.obtenerFechaReal() : new Date(); 
        let textoFecha = fechaReal.toLocaleDateString('es-VE', opcionesFecha);
        textoFecha = textoFecha.charAt(0).toUpperCase() + textoFecha.slice(1);
        
        let cajaFecha = document.getElementById('reloj-vivo');
        if (cajaFecha) cajaFecha.innerText = textoFecha;
    },

    cargarPerfilEscuela: async function() {
        try {
            // Quitamos el limit(1) para traer ambas escuelas
            const { data, error } = await window.supabaseDB.from('perfil_escuela').select('*');
            if (error) throw error;
            
            if (data && data.length > 0) {
                let inyectar = (id, texto) => { let el = document.getElementById(id); if (el && texto) el.innerText = texto; };
                
                data.forEach(escuela => {
                    let prefijo = escuela.id_escuela; // 'sb' o 'lb'
                    if(!prefijo) return;
                    
                    inyectar(`lbl-nombre-escuela-${prefijo}`, escuela.nombre_institucion || 'Sin nombre');
                    inyectar(`lbl-dea-escuela-${prefijo}`, escuela.codigo_dea || 'N/A');
                    inyectar(`lbl-rif-escuela-${prefijo}`, escuela.rif || 'N/A');
                    inyectar(`lbl-direccion-escuela-${prefijo}`, escuela.direccion || 'Sin dirección registrada');
                    
                    inyectar(`lbl-mision-back-${prefijo}`, escuela.mision || 'No registrada.');
                    inyectar(`lbl-vision-back-${prefijo}`, escuela.vision || 'No registrada.');
                    inyectar(`lbl-objetivo-back-${prefijo}`, escuela.objetivo || 'No registrados.'); 
                    inyectar(`lbl-peic-back-${prefijo}`, escuela.peic || 'No registrado.');
                });
            }
        } catch (e) {
            console.error("Error al obtener perfil desde Supabase:", e);
        }
    },

    // 🚀 NUEVA LECTURA DEL HEADER: Ahora calcula con fechas reales
    actualizarHeaderGlobal: async function() {
        try {
            // Bajamos todos los periodos y lapsos
            const [perRes, lapRes] = await Promise.all([
                window.supabaseDB.from('conf_periodos').select('*'),
                window.supabaseDB.from('conf_lapsos').select('*')
            ]);
            
            let hoy = new Date().getTime();

            // Función matemática para saber cuál está activo en base a hoy
            let encontrarActivo = (lista) => {
                if (!lista || lista.length === 0) return null;
                let activo = lista.find(item => {
                    if (item.fecha_inicio && item.fecha_fin) {
                        let pIn = new Date(item.fecha_inicio + "T00:00:00").getTime();
                        let pOut = new Date(item.fecha_fin + "T23:59:59").getTime();
                        // ¿La fecha de hoy está entre el inicio y el fin?
                        return hoy >= pIn && hoy <= pOut;
                    }
                    return false;
                });
                return activo ? activo.valor : null;
            };

            let anio = encontrarActivo(perRes.data) || 'No definido';
            let lapso = encontrarActivo(lapRes.data) || 'Fuera de Fase / Vacaciones';

            const elAnio = document.getElementById('global-anio-escolar'); 
            const elLapso = document.getElementById('global-lapso-escolar');
            
            if(elAnio) elAnio.innerHTML = `<i class="bi bi-calendar3 me-1"></i> Año Escolar: <span class="fw-bold">${anio}</span>`;
            if(elLapso) { 
                let claseColor = lapso.includes('Fuera') ? 'text-danger' : 'text-success'; 
                elLapso.innerHTML = `<i class="bi bi-clock-history me-1"></i> Fase Actual: <span class="${claseColor} fw-bold">${lapso}</span>`; 
            }
        } catch(e) { 
            console.error("Error al actualizar header global:", e); 
        }
    }
};

window.init_Inicio = function() { window.ModInicio.init(); };
window.init_Panel_Principal = function() { window.ModInicio.init(); };