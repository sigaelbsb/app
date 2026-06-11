/**
 * MÓDULO: ESPACIOS Y AMBIENTES
 * ✨ INCLUYE PAGINACIÓN, FILTRO, CAPACIDAD INSTALADA Y SEGURIDAD DINÁMICA POR ESCUELA ✨
 */
window.ModEspacios = {
    espacios: [], 
    espaciosFiltrados: [],
    escuelasAutorizadas: [],
    editandoId: null,

    // Variables de Paginación
    itemsPorPagina: 7,
    paginaActual: 1,

    init: function() { 
        // Obtener escuelas autorizadas según permisos de rol
        this.escuelasAutorizadas = this.obtenerEscuelasAutorizadas();

        // ✨ VALIDACIÓN DE SEGURIDAD MAESTRA: Permitir si tiene acceso a al menos un plantel ✨
        if (this.escuelasAutorizadas.length === 0) {
            let contenedor = document.querySelector('.row.animate__animated.animate__fadeInUp');
            if (contenedor) {
                contenedor.innerHTML = `
                <div class="col-12 text-center py-5 mt-4">
                    <div class="bg-light d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm border" style="width: 100px; height: 100px;">
                        <i class="bi bi-shield-lock-fill text-muted" style="font-size: 3.5rem;"></i>
                    </div>
                    <h4 class="text-dark fw-bold mb-2">Área Restringida</h4>
                    <p class="text-muted mb-0">No tienes permisos asignados para visualizar los espacios escolares en ningún plantel.</p>
                </div>`;
            }
            return; 
        }

        // Verificar si tiene permiso de crear en al menos una de las escuelas autorizadas
        let puedeCrearAlguna = this.escuelasAutorizadas.some(esc => this.tienePermisoCrear(esc));

        // Ocultar el formulario de creación si no hay permiso en ninguna escuela
        if (!puedeCrearAlguna) {
            let colForm = document.getElementById('columna-formulario-espacios');
            let colTabla = document.getElementById('columna-tabla-espacios');
            if(colForm) colForm.style.display = 'none';
            if(colTabla) colTabla.classList.replace('col-xl-8', 'col-xl-12'); // Expande la tabla para que ocupe todo el ancho
        } else {
            let colForm = document.getElementById('columna-formulario-espacios');
            let colTabla = document.getElementById('columna-tabla-espacios');
            if(colForm) colForm.style.display = 'block';
            if(colTabla) colTabla.classList.replace('col-xl-12', 'col-xl-8');

            // Mostrar el selector en el formulario si tiene acceso de escritura a más de una escuela
            let divEsc = document.getElementById('div-select-escuela');
            if (divEsc) {
                let escuelasConCrear = this.escuelasAutorizadas.filter(esc => this.tienePermisoCrear(esc));
                if (escuelasConCrear.length > 1) {
                    divEsc.style.display = 'block';
                    let selectEsc = document.getElementById('esp-escuela');
                    if (selectEsc) {
                        let htmlSelect = '<option value="">Seleccione...</option>';
                        if (escuelasConCrear.includes('sb')) htmlSelect += '<option value="sb">U.E. Santa Bárbara</option>';
                        if (escuelasConCrear.includes('lb')) htmlSelect += '<option value="lb">U.E. Libertador Bolívar</option>';
                        selectEsc.innerHTML = htmlSelect;
                    }
                } else {
                    divEsc.style.display = 'none';
                }
            }
        }

        this.aplicarEventos();
        this.cargarEspacios(); 
    },

    aplicarEventos: function() {
        const btnGuardar = document.getElementById('btn-guardar-espacio');
        if (btnGuardar) btnGuardar.onclick = () => this.guardarEspacio();

        const btnCancelar = document.getElementById('btn-cancelar-edicion');
        if (btnCancelar) btnCancelar.onclick = () => this.cancelarEdicion();

        const buscador = document.getElementById('buscador-espacios');
        if (buscador) buscador.oninput = () => this.filtrar();

        const tabla = document.getElementById('tabla-espacios');
        if (tabla) {
            tabla.onclick = (e) => {
                const btnEditar = e.target.closest('.btn-editar-espacio');
                if (btnEditar) {
                    const id = btnEditar.getAttribute('data-id');
                    this.editarEspacio(id);
                    return;
                }
                const btnEliminar = e.target.closest('.btn-eliminar-espacio');
                if (btnEliminar) {
                    const id = btnEliminar.getAttribute('data-id');
                    this.eliminarEspacio(id);
                    return;
                }
            };
        }

        const paginacion = document.getElementById('paginacion-espacios');
        if (paginacion) {
            paginacion.onclick = (e) => {
                const btn = e.target.closest('.btn-pagina');
                if (!btn) return;
                if (btn.parentElement.classList.contains('disabled')) return;
                const pag = parseInt(btn.getAttribute('data-pagina'));
                if (!isNaN(pag)) {
                    this.cambiarPagina(pag);
                }
            };
        }
    },

    obtenerEscuelasAutorizadas: function() {
        const user = window.Aplicacion.usuario;
        if (!user) return [];
        if (user.rol === 'SuperAdmin') return ['sb', 'lb'];
        
        let escuelas = [];
        // Buscar el rol del usuario en la lista de roles del sistema
        if (window.Aplicacion.rolesDelSistema) {
            const miRol = window.Aplicacion.rolesDelSistema.find(r => r.nombre === user.rol);
            if (miRol && miRol.permisos) {
                try {
                    const permisos = typeof miRol.permisos === 'string' ? JSON.parse(miRol.permisos) : miRol.permisos;
                    if (permisos.sb && permisos.sb['Espacios Escolares'] && permisos.sb['Espacios Escolares'].ver) {
                        escuelas.push('sb');
                    }
                    if (permisos.lb && permisos.lb['Espacios Escolares'] && permisos.lb['Espacios Escolares'].ver) {
                        escuelas.push('lb');
                    }
                } catch(e) {
                    console.error("Error parseando permisos de rol:", e);
                }
            }
        }
        
        // Si no se encuentra información del rol, caemos en la escuela activa de la sesión
        if (escuelas.length === 0) {
            const activa = localStorage.getItem('sigae_escuela_codigo') || user.id_escuela;
            if (activa) {
                escuelas.push(activa);
            } else {
                escuelas.push('sb'); // Fallback seguro
            }
        }
        
        return escuelas;
    },

    tienePermisoCrear: function(idEscuela) {
        const user = window.Aplicacion.usuario;
        if (!user) return false;
        if (user.rol === 'SuperAdmin') return true;
        
        if (window.Aplicacion.rolesDelSistema) {
            const miRol = window.Aplicacion.rolesDelSistema.find(r => r.nombre === user.rol);
            if (miRol && miRol.permisos) {
                try {
                    const permisos = typeof miRol.permisos === 'string' ? JSON.parse(miRol.permisos) : miRol.permisos;
                    if (permisos[idEscuela] && permisos[idEscuela]['Espacios Escolares']) {
                        return permisos[idEscuela]['Espacios Escolares'].crear === true;
                    }
                } catch(e) {}
            }
        }
        return false;
    },

    tienePermisoEliminar: function(idEscuela) {
        const user = window.Aplicacion.usuario;
        if (!user) return false;
        if (user.rol === 'SuperAdmin') return true;
        
        if (window.Aplicacion.rolesDelSistema) {
            const miRol = window.Aplicacion.rolesDelSistema.find(r => r.nombre === user.rol);
            if (miRol && miRol.permisos) {
                try {
                    const permisos = typeof miRol.permisos === 'string' ? JSON.parse(miRol.permisos) : miRol.permisos;
                    if (permisos[idEscuela] && permisos[idEscuela]['Espacios Escolares']) {
                        return permisos[idEscuela]['Espacios Escolares'].eliminar === true;
                    }
                } catch(e) {}
            }
        }
        return false;
    },

    cargarEspacios: async function() { 
        window.Aplicacion.mostrarCarga(); 
        try {
            let query = window.supabaseDB.from('espacios').select('*');
            
            // Filtrar en base de datos según los planteles permitidos
            if (this.escuelasAutorizadas.length === 1) {
                query = query.eq('id_escuela', this.escuelasAutorizadas[0]);
            } else if (this.escuelasAutorizadas.length === 0) {
                query = query.eq('id_escuela', 'ninguna');
            }
            
            const { data, error } = await query
                .order('tipo', { ascending: true })
                .order('nombre', { ascending: true });
                
            window.Aplicacion.ocultarCarga();
            if (error) throw error;
            
            this.espacios = data || []; 
            this.espaciosFiltrados = [...this.espacios];
            this.paginaActual = 1;
            
            // Calcular capacidades e imprimirlas en las tarjetas superiores
            this.calcularCapacidades();
            
            this.dibujarTabla(); 
            
        } catch (e) {
            window.Aplicacion.ocultarCarga();
            console.error(e);
            if (e.code === 'PGRST205' || (e.message && e.message.includes('Could not find the table'))) {
                Swal.fire({
                    title: 'Tabla No Encontrada',
                    html: `La tabla <code>espacios</code> no existe en el esquema de su base de datos Supabase.<br><br>Por favor, ejecute la consulta SQL provista en el <strong>Plan de Implementación</strong> desde el SQL Editor de su panel de Supabase para crearla.`,
                    icon: 'warning',
                    confirmButtonColor: '#0dcaf0'
                });
            } else {
                Swal.fire('Error', 'No se pudieron cargar los espacios desde Supabase.', 'error');
            }
        }
    },

    calcularCapacidades: function() {
        let totalGlobal = 0;
        let totalSb = 0;
        let totalLb = 0;
        
        this.espacios.forEach(e => {
            const cap = parseInt(e.capacidad) || 0;
            totalGlobal += cap;
            if (e.id_escuela === 'sb') totalSb += cap;
            if (e.id_escuela === 'lb') totalLb += cap;
        });
        
        // Renderizar valores en la interfaz
        const elGlobal = document.getElementById('cap-total-global');
        const elSb = document.getElementById('cap-total-sb');
        const elLb = document.getElementById('cap-total-lb');
        
        if (elGlobal) elGlobal.innerText = totalGlobal;
        if (elSb) elSb.innerText = totalSb;
        if (elLb) elLb.innerText = totalLb;
        
        // Mostrar/ocultar las tarjetas de capacidad según los planteles autorizados
        const cardSb = document.getElementById('card-cap-sb');
        const cardLb = document.getElementById('card-cap-lb');
        
        if (cardSb) cardSb.style.display = this.escuelasAutorizadas.includes('sb') ? 'block' : 'none';
        if (cardLb) cardLb.style.display = this.escuelasAutorizadas.includes('lb') ? 'block' : 'none';
    },

    filtrar: function() {
        let txt = document.getElementById('buscador-espacios').value.toLowerCase();
        this.espaciosFiltrados = this.espacios.filter(e => 
            e.nombre.toLowerCase().includes(txt) || 
            e.tipo.toLowerCase().includes(txt)
        );
        this.paginaActual = 1;
        this.dibujarTabla();
    },

    dibujarTabla: function() {
        const tbody = document.getElementById('tabla-espacios'); 
        if(!tbody) return;

        // Lógica de Paginación
        let totalPaginas = Math.ceil(this.espaciosFiltrados.length / this.itemsPorPagina) || 1;
        if(this.paginaActual > totalPaginas) this.paginaActual = totalPaginas;
        let inicio = (this.paginaActual - 1) * this.itemsPorPagina;
        let datosPagina = this.espaciosFiltrados.slice(inicio, inicio + this.itemsPorPagina);

        if (datosPagina.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center py-5"><i class="bi bi-building-slash fs-1 text-muted d-block mb-3"></i><span class="text-muted fw-bold">No se encontraron espacios.</span></td></tr>`;
            document.getElementById('paginacion-espacios').innerHTML = '';
            return;
        }

        let html = '';

        datosPagina.forEach(e => {
            let colorBadge = e.tipo.includes('Aula') ? 'primary' : (e.tipo.includes('Laboratorio') ? 'success' : (e.tipo.includes('Cancha') ? 'danger' : 'secondary'));
            let capVisual = (e.capacidad) ? e.capacidad : 0;
            
            // Badge distintivo para la escuela
            let badgeEscuela = '';
            if (e.id_escuela === 'sb') {
                badgeEscuela = `<span class="badge bg-info bg-opacity-10 text-info border border-info px-2 py-1 shadow-sm"><i class="bi bi-mortarboard-fill me-1"></i>Santa Bárbara</span>`;
            } else if (e.id_escuela === 'lb') {
                badgeEscuela = `<span class="badge bg-primary bg-opacity-10 text-primary border border-primary px-2 py-1 shadow-sm"><i class="bi bi-book-fill me-1"></i>Libertador Bolívar</span>`;
            } else {
                badgeEscuela = `<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary px-2 py-1 shadow-sm">Global</span>`;
            }
            
            // Verificar permisos específicos de la escuela del registro
            let pCrearEsp = this.tienePermisoCrear(e.id_escuela);
            let pElimEsp = this.tienePermisoEliminar(e.id_escuela);

            let btnEditar = pCrearEsp ? `<button class="btn btn-sm btn-light border text-primary me-1 shadow-sm btn-editar-espacio" data-id="${e.id}" title="Editar"><i class="bi bi-pencil"></i></button>` : '';
            let btnEliminar = pElimEsp ? `<button class="btn btn-sm btn-light border text-danger shadow-sm btn-eliminar-espacio" data-id="${e.id}" title="Eliminar"><i class="bi bi-trash"></i></button>` : '';

            html += `
            <tr class="hover-efecto">
                <td class="ps-4 align-middle">${badgeEscuela}</td>
                <td class="align-middle"><span class="badge bg-${colorBadge} bg-opacity-10 text-${colorBadge} border border-${colorBadge} px-2 py-1 shadow-sm">${e.tipo}</span></td>
                <td class="align-middle fw-bold text-dark fs-6">${e.nombre}</td>
                <td class="align-middle text-center"><span class="badge bg-light text-dark border"><i class="bi bi-people-fill me-1 text-info"></i> ${capVisual} pax</span></td>
                <td class="text-end pe-4 align-middle text-nowrap">
                    ${btnEditar}
                    ${btnEliminar}
                </td>
            </tr>`;
        });
        tbody.innerHTML = html;
        this.generarPaginacion(totalPaginas);
    },

    generarPaginacion: function(totalPaginas) {
        const contenedor = document.getElementById('paginacion-espacios');
        if (totalPaginas <= 1) { contenedor.innerHTML = ''; return; }
        
        let html = `<li class="page-item ${this.paginaActual === 1 ? 'disabled' : ''}"><button class="page-link btn-pagina" data-pagina="${this.paginaActual - 1}"><i class="bi bi-chevron-left"></i></button></li>`;
        for (let i = 1; i <= totalPaginas; i++) {
            if (i === 1 || i === totalPaginas || (i >= this.paginaActual - 2 && i <= this.paginaActual + 2)) {
                html += `<li class="page-item ${this.paginaActual === i ? 'active' : ''}"><button class="page-link btn-pagina" data-pagina="${i}">${i}</button></li>`;
            } else if (i === this.paginaActual - 3 || i === this.paginaActual + 3) {
                html += `<li class="page-item disabled"><span class="page-link border-0 text-muted">...</span></li>`;
            }
        }
        html += `<li class="page-item ${this.paginaActual === totalPaginas ? 'disabled' : ''}"><button class="page-link btn-pagina" data-pagina="${this.paginaActual + 1}"><i class="bi bi-chevron-right"></i></button></li>`;
        contenedor.innerHTML = html;
    },

    cambiarPagina: function(pag) {
        this.paginaActual = pag;
        this.dibujarTabla();
    },

    // 🚀 INSERTAR / ACTUALIZAR EN SUPABASE
    guardarEspacio: async function() {
        // Obtener escuela correspondiente para validar permisos
        let idEscuela = '';
        const escuelasConCrear = this.escuelasAutorizadas.filter(esc => this.tienePermisoCrear(esc));

        if (escuelasConCrear.length > 1) {
            idEscuela = document.getElementById('esp-escuela').value;
            if(!idEscuela) return Swal.fire('Aviso', 'Debe seleccionar la escuela correspondiente.', 'warning');
        } else {
            idEscuela = escuelasConCrear[0] || this.escuelasAutorizadas[0] || 'sb';
        }

        if (!this.tienePermisoCrear(idEscuela)) {
            return Swal.fire('Error', 'No posee privilegios para registrar espacios en este plantel.', 'error');
        }

        let n = document.getElementById('esp-nombre').value.trim(); 
        let t = document.getElementById('esp-tipo').value;
        let c = document.getElementById('esp-capacidad').value.trim(); 
        
        if(!n || !t) return Swal.fire('Aviso', 'Debe ingresar el nombre y seleccionar el tipo.', 'warning');
        
        window.Aplicacion.mostrarCarga(); 
        
        try {
            const payload = {
                nombre: n,
                tipo: t,
                capacidad: parseInt(c) || 0,
                id_escuela: idEscuela
            };

            let errorGuardado;
            let accionRegistro = 'Añadir Espacio';

            if (this.editandoId) {
                const { error } = await window.supabaseDB.from('espacios').update(payload).eq('id', this.editandoId);
                errorGuardado = error;
                accionRegistro = 'Editar Espacio';
            } else {
                payload.id = 'ESP-' + new Date().getTime();
                const { error } = await window.supabaseDB.from('espacios').insert([payload]);
                errorGuardado = error;
            }

            window.Aplicacion.ocultarCarga(); 
            if (errorGuardado) throw errorGuardado;
            
            Swal.fire({toast:true, position:'top-end', icon:'success', title:'Guardado exitosamente', timer:2000, showConfirmButton:false}); 
            
            // ✨ REGISTRO EN AUDITORÍA ✨
            window.Aplicacion.auditar('Espacios Escolares', accionRegistro, `Se guardó el espacio: ${n} (${t}) con capacidad para ${c} pax en el plantel ${idEscuela.toUpperCase()}.`);
            
            this.cancelarEdicion();
            this.cargarEspacios();  
            
        } catch (e) {
            window.Aplicacion.ocultarCarga(); 
            Swal.fire('Error', 'Falla al guardar en la base de datos.', 'error'); 
        }
    },

    // 🚀 ELIMINAR EN SUPABASE
    eliminarEspacio: function(id) { 
        let e = this.espacios.find(x => x.id === id); 
        if (!e) return;
        
        if (!this.tienePermisoEliminar(e.id_escuela)) {
            return Swal.fire('Error', 'No posee privilegios de eliminación en este plantel.', 'error');
        }

        let nombreEspacio = e.nombre;

        Swal.fire({
            title:'¿Eliminar este ambiente?', 
            icon:'warning', 
            showCancelButton:true,
            confirmButtonColor: '#d33'
        }).then(async r => { 
            if(r.isConfirmed) { 
                window.Aplicacion.mostrarCarga();
                try {
                    const { error } = await window.supabaseDB.from('espacios').delete().eq('id', id);
                    window.Aplicacion.ocultarCarga();
                    if (error) throw error;
                    
                    Swal.fire({toast:true, position:'top-end', icon:'success', title:'Eliminado', timer:2000, showConfirmButton:false});
                    
                    // ✨ REGISTRO EN AUDITORÍA ✨
                    window.Aplicacion.auditar('Espacios Escolares', 'Eliminar Espacio', `Se eliminó el espacio: ${nombreEspacio}`);

                    this.cargarEspacios();
                } catch(e) {
                    window.Aplicacion.ocultarCarga();
                    Swal.fire('Error', 'No se pudo eliminar el registro.', 'error');
                }
            } 
        }); 
    },
    
    // ⚙️ PREPARAR FORMULARIO PARA EDICIÓN
    editarEspacio: function(id) { 
        let e = this.espacios.find(x => x.id === id); 
        if(e) { 
            this.editandoId = id; 
            document.getElementById('esp-nombre').value = e.nombre; 
            document.getElementById('esp-tipo').value = e.tipo; 
            document.getElementById('esp-capacidad').value = e.capacidad || ''; 
            
            let selectEscuela = document.getElementById('esp-escuela');
            if (selectEscuela) {
                selectEscuela.value = e.id_escuela || '';
            }
            
            document.getElementById('titulo-form').innerText = 'Editar Espacio';
            document.getElementById('btn-guardar-espacio').innerHTML = '<i class="bi bi-save-fill me-2"></i>Actualizar Espacio'; 
            document.getElementById('btn-cancelar-edicion').classList.remove('d-none');
        } 
    },
    
    // ⚙️ LIMPIAR FORMULARIO
    cancelarEdicion: function() { 
        this.editandoId = null; 
        document.getElementById('esp-nombre').value = ''; 
        document.getElementById('esp-tipo').value = ''; 
        document.getElementById('esp-capacidad').value = ''; 
        
        let selectEscuela = document.getElementById('esp-escuela');
        if (selectEscuela) {
            selectEscuela.value = '';
        }
        
        document.getElementById('titulo-form').innerText = 'Registrar Espacio';
        document.getElementById('btn-guardar-espacio').innerHTML = '<i class="bi bi-save-fill me-2"></i>Guardar Espacio'; 
        document.getElementById('btn-cancelar-edicion').classList.add('d-none');
    }
};

window.init_Espacios_Escolares = function() { window.ModEspacios.init(); };