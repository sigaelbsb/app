/**
 * MÓDULO: PERFIL DE LA ESCUELA (Supabase Edition)
 * Gestiona la información institucional, misión, visión y PEIC.
 * ✨ MULTI-INSTITUCIÓN: PANTALLA DIVIDIDA ✨
 */

window.ModEscuela = {
    init: function() {
        this.cargarPerfil();
        
        // Ocultar tarjetas de las escuelas sin acceso
        const colLB = document.getElementById('col-perfil-lb');
        const colSB = document.getElementById('col-perfil-sb');
        
        if(colLB) {
            if(!window.Aplicacion.tieneAccesoEscuela('lb')) {
                colLB.style.display = 'none';
            }
        }
        if(colSB) {
            if(!window.Aplicacion.tieneAccesoEscuela('sb')) {
                colSB.style.display = 'none';
            }
        }
        
        // Si ambas están ocultas (no debería pasar por lógica de negocio, pero por seguridad)
        if(colLB && colSB && colLB.style.display === 'none' && colSB.style.display === 'none') {
            const container = colLB.parentElement;
            if(container) {
                container.innerHTML = `<div class="col-12"><div class="alert alert-warning text-center rounded-4 shadow-sm border-0"><i class="bi bi-shield-lock-fill fs-1 d-block mb-3"></i><h4>Acceso Restringido</h4><p>Usted no tiene acceso al perfil de ninguna institución.</p></div></div>`;
            }
        }
    },

    cargarPerfil: async function() {
        window.Aplicacion.mostrarCarga();
        
        try {
            // Ya no buscamos limit(1), sino todos los perfiles de escuela (lb y sb)
            const { data, error } = await window.supabaseDB
                .from('perfil_escuela')
                .select('*');

            window.Aplicacion.ocultarCarga();
            if (error) throw error;

            if (data && data.length > 0) {
                const setVal = (id, val) => {
                    let el = document.getElementById(id);
                    if(el) el.value = val || '';
                };

                // Iteramos por las escuelas que vengan de la base de datos
                data.forEach(escuela => {
                    let prefijo = escuela.id_escuela; // Será 'lb' o 'sb'
                    if(!prefijo) return;

                    setVal(`pe-nombre-${prefijo}`, escuela.nombre_institucion);
                    setVal(`pe-dea-${prefijo}`, escuela.codigo_dea);
                    setVal(`pe-rif-${prefijo}`, escuela.rif);
                    setVal(`pe-direccion-${prefijo}`, escuela.direccion);
                    setVal(`pe-mision-${prefijo}`, escuela.mision);
                    setVal(`pe-vision-${prefijo}`, escuela.vision);
                    setVal(`pe-objetivo-${prefijo}`, escuela.objetivo);
                    setVal(`pe-peic-${prefijo}`, escuela.peic);
                });
            }
        } catch (e) {
            window.Aplicacion.ocultarCarga();
            console.error("Error cargando los perfiles:", e);
            Swal.fire('Error al Cargar', e.message || 'No se pudo leer la base de datos', 'error');
        }
    },

    guardarPerfil: async function() {
        const getVal = (id) => document.getElementById(id) ? document.getElementById(id).value.trim() : '';

        // Extraer datos de LB
        let nombreLB = getVal('pe-nombre-lb');
        let deaLB    = getVal('pe-dea-lb');
        
        // Extraer datos de SB
        let nombreSB = getVal('pe-nombre-sb');
        let deaSB    = getVal('pe-dea-sb');

        if(!nombreLB || !nombreSB) {
            return Swal.fire('Atención', 'El nombre oficial de ambas instituciones es obligatorio.', 'warning');
        }

        window.Aplicacion.mostrarCarga();

        try {
            // Actualizamos LB
            const { error: errLB } = await window.supabaseDB
                .from('perfil_escuela')
                .update({
                    nombre_institucion: nombreLB,
                    codigo_dea: deaLB,
                    rif: getVal('pe-rif-lb'),
                    direccion: getVal('pe-direccion-lb'),
                    mision: getVal('pe-mision-lb'),
                    vision: getVal('pe-vision-lb'),
                    objetivo: getVal('pe-objetivo-lb'),
                    peic: getVal('pe-peic-lb')
                })
                .eq('id_escuela', 'lb');

            if (errLB) throw errLB;

            // Actualizamos SB
            const { error: errSB } = await window.supabaseDB
                .from('perfil_escuela')
                .update({
                    nombre_institucion: nombreSB,
                    codigo_dea: deaSB,
                    rif: getVal('pe-rif-sb'),
                    direccion: getVal('pe-direccion-sb'),
                    mision: getVal('pe-mision-sb'),
                    vision: getVal('pe-vision-sb'),
                    objetivo: getVal('pe-objetivo-sb'),
                    peic: getVal('pe-peic-sb')
                })
                .eq('id_escuela', 'sb');

            if (errSB) throw errSB;

            Swal.fire({
                toast: true, position: 'top-end', icon: 'success', title: 'Complejo Educativo Actualizado', showConfirmButton: false, timer: 2500
            });
            
            window.Aplicacion.auditar('Perfil de la Escuela', 'Actualizar Complejo', `Se actualizaron los perfiles de ambas escuelas simultáneamente.`);
            window.Aplicacion.ocultarCarga();

        } catch(e) {
            window.Aplicacion.ocultarCarga();
            console.error("Error crítico en guardarPerfil:", e);
            
            Swal.fire({
                title: 'Error de Supabase',
                text: e.message || 'Error desconocido al guardar.',
                icon: 'error'
            });
        }
    }
};

window.init_Perfil_de_la_Escuela = function() { window.ModEscuela.init(); };