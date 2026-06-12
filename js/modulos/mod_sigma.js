/**
 * MÓDULO: CEREBRO DE SIGMA (Configuración IA)
 * Permite gestionar las palabras clave, respuestas, acciones y roles permitidos.
 */
window.ModSigma = {
    datosCache: [],

    init: function() {
        if (!window.Aplicacion.permiso('Cerebro de Sigma', 'ver')) {
            let contenedor = document.querySelector('.container-fluid.animate__animated.animate__fadeIn');
            if (contenedor) {
                contenedor.innerHTML = `
                <div class="col-12 text-center py-5 animate__animated animate__fadeIn mt-4">
                    <div class="bg-light d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm border" style="width: 100px; height: 100px;">
                        <i class="bi bi-robot text-muted" style="font-size: 3.5rem;"></i>
                    </div>
                    <h4 class="text-dark fw-bold mb-2">Área Restringida</h4>
                    <p class="text-muted mb-0">No tienes permisos para configurar el Cerebro de Sigma.</p>
                </div>`;
            }
            return;
        }

        // Mover el modal al body para evitar problemas de z-index (que quede detrás del fondo oscuro)
        const modalEl = document.getElementById('modalSigma');
        if (modalEl && modalEl.parentNode !== document.body) {
            document.body.appendChild(modalEl);
        }

        this.enlazarEventos();
        this.cargarDatos();
    },

    enlazarEventos: function() {
        const buscador = document.getElementById('sigma-buscar');
        if (buscador) {
            buscador.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtrados = this.datosCache.filter(item => 
                    item.tema.toLowerCase().includes(term) || 
                    item.respuesta.toLowerCase().includes(term) ||
                    (item.palabras_clave && item.palabras_clave.join(', ').toLowerCase().includes(term))
                );
                this.renderizarTabla(filtrados);
            });
        }
    },

    cargarDatos: async function() {
        window.Aplicacion.mostrarCarga();
        try {
            const { data, error } = await window.supabaseDB
                .from('sigma_conocimiento')
                .select('*')
                .order('creado_en', { ascending: false });

            window.Aplicacion.ocultarCarga();
            if (error) throw error;
            
            this.datosCache = data || [];
            this.renderizarTabla(this.datosCache);
        } catch (e) {
            window.Aplicacion.ocultarCarga();
            console.error(e);
            Swal.fire("Error", "No se pudo cargar el conocimiento de Sigma. Verifica tu conexión a Supabase.", "error");
        }
    },

    renderizarTabla: function(datos) {
        const tbody = document.getElementById('tabla-sigma');
        if (!tbody) return;

        if (datos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-5 text-muted"><i class="bi bi-inbox fs-2 d-block mb-2"></i>No hay conocimientos registrados.</td></tr>`;
            return;
        }

        let html = '';
        datos.forEach(item => {
            let rolesStr = (!item.roles_permitidos || item.roles_permitidos.length === 0) ? 
                '<span class="badge bg-success bg-opacity-10 text-success rounded-pill px-2" style="font-size: 0.7rem;">Público</span>' : 
                item.roles_permitidos.map(r => `<span class="badge bg-secondary rounded-pill px-2 me-1" style="font-size: 0.65rem;">${r}</span>`).join('');
            
            let palabras = (item.palabras_clave || []).join(', ');
            if (palabras.length > 50) palabras = palabras.substring(0, 50) + '...';

            let accionBadge = '';
            if (item.accion_tipo) {
                let icon = item.accion_tipo === 'navegar' ? 'bi-link' : 'bi-window';
                accionBadge = `<br><span class="badge bg-primary bg-opacity-10 text-primary mt-1" style="font-size: 0.7rem;"><i class="bi ${icon} me-1"></i>${item.accion_valor}</span>`;
            }

            html += `
            <tr class="hover-efecto">
                <td class="ps-4 py-3">
                    <div class="fw-bold text-dark">${item.tema}</div>
                    <div class="mt-1">${rolesStr}</div>
                </td>
                <td class="py-3">
                    <div class="text-muted small">${palabras}</div>
                </td>
                <td class="py-3">
                    <div class="small text-dark" style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.respuesta}</div>
                    ${accionBadge}
                </td>
                <td class="text-center pe-4 py-3">
                    <button class="btn btn-sm btn-light text-primary rounded-circle shadow-sm me-1" onclick="window.ModSigma.abrirModalEditar('${item.id}')" title="Editar"><i class="bi bi-pencil-square"></i></button>
                    <button class="btn btn-sm btn-light text-danger rounded-circle shadow-sm" onclick="window.ModSigma.eliminar('${item.id}')" title="Eliminar"><i class="bi bi-trash3-fill"></i></button>
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
    },

    abrirModalNuevo: function() {
        document.getElementById('sigma-id').value = '';
        document.getElementById('sigma-tema').value = '';
        document.getElementById('sigma-claves').value = '';
        document.getElementById('sigma-respuesta').value = '';
        document.getElementById('sigma-accion-tipo').value = '';
        document.getElementById('sigma-accion-valor').value = '';
        document.getElementById('sigma-roles').value = '';
        document.getElementById('modalSigmaTitle').innerHTML = '<i class="bi bi-robot text-primary me-2"></i>Enseñar a Sigma';
        
        let modalEl = document.getElementById('modalSigma');
        let modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.show();
    },

    abrirModalEditar: function(id) {
        const item = this.datosCache.find(d => d.id === id);
        if (!item) return;

        document.getElementById('sigma-id').value = item.id;
        document.getElementById('sigma-tema').value = item.tema;
        document.getElementById('sigma-claves').value = (item.palabras_clave || []).join(', ');
        document.getElementById('sigma-respuesta').value = item.respuesta;
        document.getElementById('sigma-accion-tipo').value = item.accion_tipo || '';
        document.getElementById('sigma-accion-valor').value = item.accion_valor || '';
        document.getElementById('sigma-roles').value = (item.roles_permitidos || []).join(', ');
        document.getElementById('modalSigmaTitle').innerHTML = '<i class="bi bi-pencil-square text-primary me-2"></i>Editar Conocimiento';

        let modalEl = document.getElementById('modalSigma');
        let modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        modal.show();
    },

    guardar: async function() {
        const id = document.getElementById('sigma-id').value;
        const tema = document.getElementById('sigma-tema').value.trim();
        const clavesStr = document.getElementById('sigma-claves').value.trim();
        const respuesta = document.getElementById('sigma-respuesta').value.trim();
        const accionTipo = document.getElementById('sigma-accion-tipo').value;
        const accionValor = document.getElementById('sigma-accion-valor').value.trim();
        const rolesStr = document.getElementById('sigma-roles').value.trim();

        if (!tema || !clavesStr || !respuesta) {
            Swal.fire('Atención', 'Tema, Palabras Clave y Respuesta son obligatorios.', 'warning');
            return;
        }

        const palabras_clave = clavesStr.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
        const roles_permitidos = rolesStr ? rolesStr.split(',').map(s => s.trim().toLowerCase()).filter(s => s) : [];

        const payload = {
            tema: tema,
            palabras_clave: palabras_clave,
            respuesta: respuesta,
            accion_tipo: accionTipo || null,
            accion_valor: accionValor || null,
            roles_permitidos: roles_permitidos
        };

        const btn = document.getElementById('btn-guardar-sigma');
        const oldText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
        btn.disabled = true;

        try {
            if (id) {
                // Actualizar
                const { error } = await window.supabaseDB.from('sigma_conocimiento').update(payload).eq('id', id);
                if (error) throw error;
                window.Aplicacion.auditar('Cerebro de Sigma', 'Actualizar Conocimiento', `Tema: ${tema}`);
            } else {
                // Crear
                const { error } = await window.supabaseDB.from('sigma_conocimiento').insert([payload]);
                if (error) throw error;
                window.Aplicacion.auditar('Cerebro de Sigma', 'Nuevo Conocimiento', `Tema: ${tema}`);
            }

            let modalEl = document.getElementById('modalSigma');
            let modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) {
                modal.hide();
            } else {
                // Fallback de limpieza manual si Bootstrap falla
                modalEl.classList.remove('show');
                modalEl.style.display = 'none';
                document.body.classList.remove('modal-open');
                document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            }

            Swal.fire({toast: true, position: 'top-end', icon: 'success', title: 'Conocimiento guardado', showConfirmButton: false, timer: 1500});
            
            this.cargarDatos();

            // Refrescar la memoria de Sigma en el chatbot.js actual
            if (window.Sigma && window.Sigma.cargarConocimiento) {
                window.Sigma.cargarConocimiento();
            }
        } catch (e) {
            console.error(e);
            let modalEl = document.getElementById('modalSigma');
            let modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
            Swal.fire('Error', 'No se pudo guardar el conocimiento. Es posible que te falte ejecutar el script SQL en Supabase.', 'error');
        } finally {
            btn.innerHTML = oldText;
            btn.disabled = false;
        }
    },

    eliminar: function(id) {
        Swal.fire({
            title: '¿Olvidar esto?',
            text: "Sigma ya no responderá a estas palabras clave.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, olvidar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                window.Aplicacion.mostrarCarga();
                try {
                    const { error } = await window.supabaseDB.from('sigma_conocimiento').delete().eq('id', id);
                    window.Aplicacion.ocultarCarga();
                    if (error) throw error;
                    
                    window.Aplicacion.auditar('Cerebro de Sigma', 'Olvidar Conocimiento', `ID: ${id}`);
                    this.cargarDatos();

                    // Refrescar memoria de Sigma
                    if (window.Sigma && window.Sigma.cargarConocimiento) {
                        window.Sigma.cargarConocimiento();
                    }
                } catch(e) {
                    window.Aplicacion.ocultarCarga();
                    Swal.fire('Error', 'No se pudo eliminar.', 'error');
                }
            }
        });
    }
};
