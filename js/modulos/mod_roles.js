/**
 * MÓDULO: ROLES Y PRIVILEGIOS (SIGAE v1.0)
 * Matriz Simplificada (UX): Un solo interruptor de Acceso Total por Tarjeta.
 * ✨ INCLUYE AUDITORÍA ✨
 */

window.ModRoles = {
    roles: [],
    rolActual: null,

    init: function() {
        // Asignar el logo dinámicamente según la escuela activa
        let codigoEscuela = localStorage.getItem('sigae_escuela_codigo');
        let imgLogo = document.getElementById('img-logo-escuela-roles');
        if (imgLogo && codigoEscuela) {
            imgLogo.src = `assets/img/logo_${codigoEscuela}.png`;
        }
        
        this.cargarDatos();
    },

    cargarDatos: async function() {
        window.Aplicacion.mostrarCarga();
        try {
            const { data, error } = await window.supabaseDB
                .from('roles')
                .select('*')
                .order('nombre', { ascending: true });

            window.Aplicacion.ocultarCarga();
            if (error) throw error;

            this.roles = (data || []).map(r => ({
                idx: r.idx,
                nombre: r.nombre,
                privilegios: typeof r.permisos === 'string' ? JSON.parse(r.permisos || '{}') : (r.permisos || {})
            }));

            this.renderizarListaRoles();
            if(this.rolActual) {
                this.seleccionarRol(this.rolActual.nombre);
            }
        } catch (e) {
            window.Aplicacion.ocultarCarga();
            Swal.fire("Error", "Error al sincronizar con Supabase.", "error");
        }
    },

    renderizarListaRoles: function() {
        const lista = document.getElementById('lista-roles-ui');
        if(!lista) return;
        let html = '';
        this.roles.forEach(r => {
            let activo = (this.rolActual && this.rolActual.nombre === r.nombre) ? 'bg-light border-primary' : 'border-transparent';
            html += `
            <a href="javascript:void(0)" class="list-group-item list-group-item-action p-3 border ${activo} d-flex align-items-center mb-2 rounded-3 hover-efecto" onclick="window.ModRoles.seleccionarRol('${r.nombre}')">
                <div class="bg-white shadow-sm p-2 rounded-circle me-3 border"><i class="bi bi-person-badge text-primary fs-5"></i></div>
                <div class="fw-bold text-dark">${r.nombre}</div>
            </a>`;
        });
        lista.innerHTML = html;
    },

    seleccionarRol: function(nombre) {
        this.rolActual = this.roles.find(r => r.nombre === nombre);
        if (!this.rolActual) return;

        let pVacio = document.getElementById('panel-vacio-roles');
        let pPriv = document.getElementById('panel-privilegios');
        if (pVacio) pVacio.style.display = 'none';
        if (pPriv) pPriv.style.display = 'block';

        let lblTitulo = document.getElementById('lbl-rol-actual') || document.getElementById('titulo-rol-seleccionado');
        let lblDesc = document.getElementById('lbl-rol-desc');

        if (lblTitulo) lblTitulo.innerText = this.rolActual.nombre;
        if (lblDesc) lblDesc.innerText = "Active o desactive el acceso a los módulos y tarjetas.";

        this.dibujarMatrizSimplificada();
    },

    dibujarMatrizSimplificada: function() {
        const contenedor = document.getElementById('contenedor-permisos-dinamicos');
        if(!contenedor) return;

        const estructura = {
            "Dirección y Sistema": {
                "Perfil de la Escuela": [],
                "Espacios Escolares": [],
                "Gestión de Registros": [],
                "Configuración del Sistema": ["Tarjeta: Períodos Escolares", "Tarjeta: Lapsos Académicos", "Tarjeta: Niveles Educativos"],
                "Calendario Escolar": ["Tarjeta: Calendario Oficial MPPE", "Tarjeta: Calendario Administrativo", "Tarjeta: Calendario Pedagógico", "Tarjeta: Planificador"],
                "Panel de Control": [] 
            },
            "Organización Escolar": {
                "Cargos Institucionales": ["Tarjeta: Definir Cargos", "Tarjeta: Asignar Personal"],
                "Cadena Supervisoria": ["Función: Estructurar Cadena", "Función: Imprimir Organigrama"],
                "Gestión de Colectivos": [],
                "Estructura Empresa": ["Diccionario: Nómina", "Diccionario: Parentesco", "Diccionario: Condición"]
            },
            "Control de Estudios": {
                "Grados y Salones": ["Tarjeta: Configurar Grados", "Tarjeta: Configurar Secciones", "Tarjeta: Apertura de Salones"]
            },
            "Gestión Estudiantil": {
                "Gestión de Admisiones": [], "Gestión de Matrícula": [], "Vincular Estudiante": [],
                "Expediente Estudiantil": [], "Actualización de Datos": [], "Solicitud de Cupos": [], "Mis Solicitudes": [], 
                "Verificaciones": ["Función: Escanear QR", "Función: Re-imprimir Comprobante"]
            },
            "Gestión Docente": {
                "Asignar Guiaturas": [], "Mi Expediente": [], "Gestor de Expedientes": []
            },
            "Formación y Capacitación": {
                "Gestor de Catálogo": ["Función: Crear Cursos", "Función: Editar Cursos", "Función: Eliminar Cursos"],
                "Oferta Académica": [], "Mis Certificados": []
            },
            "Servicios y Bienestar": {
                "Transporte Escolar": ["Tarjeta: Gestión de Rutas", "Tarjeta: Gestión de Paradas", "Tarjeta: Operación (Tracking)", "Tarjeta: Visor de Recorrido"]
            },
            "Seguridad y Accesos": {
                "Mi Perfil": [], "Métodos de Acceso": [], "Gestión de Usuarios": [], "Roles y Privilegios": [], "Preguntas de Seguridad": [], "Auditoría del Sistema": []
            }
        };

        let privs = this.rolActual.privilegios || {};
        // Asegurar que existan las dos raíces si es un rol viejo
        if (!privs.lb) privs.lb = {};
        if (!privs.sb) privs.sb = {};

        let html = `
        <div class="row g-4">
            <div class="col-lg-6">
                ${this.generarColumnaEscuela('lb', 'UE Libertador Bolívar', 'primary', estructura, privs.lb)}
            </div>
            <div class="col-lg-6">
                ${this.generarColumnaEscuela('sb', 'UE Santa Bárbara', 'success', estructura, privs.sb)}
            </div>
        </div>
        `;

        contenedor.innerHTML = html;
        this.evaluarCheckTodos('lb');
        this.evaluarCheckTodos('sb');
    },

    generarColumnaEscuela: function(codigoEscuela, nombreEscuela, color, estructura, privsEscuela) {
        let html = `
        <div class="card border-0 shadow-sm rounded-4 h-100 border-top border-${color} border-5">
            <div class="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center rounded-top-4">
                <h6 class="mb-0 fw-bold text-${color}"><i class="bi bi-building me-2"></i>${nombreEscuela}</h6>
                <div class="form-check form-switch m-0">
                    <input class="form-check-input roles-chk-largo" type="checkbox" id="chk-marcar-todos-${codigoEscuela}" onchange="window.ModRoles.toggleTodosPermisos(this.checked, '${codigoEscuela}')">
                    <label class="form-check-label small fw-bold text-dark ms-1 mt-1 roles-cursor-ptr" for="chk-marcar-todos-${codigoEscuela}">Otorgar Todo</label>
                </div>
            </div>
            <div class="card-body p-3 bg-light">
                <div class="alert d-flex align-items-center justify-content-between mb-3 border border-2 border-white shadow-sm rounded-4" style="background: rgba(0,0,0,0.04);">
                    <div>
                        <h6 class="mb-0 fw-bold text-dark"><i class="bi bi-door-open-fill text-${color} me-2"></i>Acceso al Plantel (Inicio)</h6>
                        <small class="text-muted" style="font-size:0.75rem;">Permite ver esta escuela en la pantalla principal.</small>
                    </div>
                    <div class="form-check form-switch m-0 fs-5">
                        <input class="form-check-input chk-acceso" type="checkbox" data-nombre="__acceso_plantel__" data-escuela="${codigoEscuela}" ${privsEscuela['__acceso_plantel__'] && privsEscuela['__acceso_plantel__'].ver ? 'checked' : ''}>
                    </div>
                </div>
        `;

        for (const [categoria, modulos] of Object.entries(estructura)) {
            html += `
            <div class="card border-0 shadow-sm rounded-4 mb-3">
                <div class="card-header text-white py-2 rounded-top-4 roles-cat-header bg-${color}">
                    <h6 class="mb-0 fw-bold text-uppercase roles-cat-titulo" style="font-size:0.75rem;"><i class="bi bi-folder-fill text-warning me-2"></i>${categoria}</h6>
                </div>
                <div class="card-body p-2 bg-white rounded-bottom-4">
                    <div class="row g-2">`;

            for (const [nombreModulo, tarjetasHijas] of Object.entries(modulos)) {
                let hasAccessMod = (privsEscuela[nombreModulo] && privsEscuela[nombreModulo]["ver"]) ? 'checked' : '';

                html += `
                <div class="col-12 mod-container" data-escuela="${codigoEscuela}">
                    <div class="p-2 border rounded-2 border-light">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="fw-bold text-dark" style="font-size:0.85rem;"><i class="bi bi-box me-2 text-${color}"></i>${nombreModulo}</div>
                            <div class="form-check form-switch m-0">
                                <input class="form-check-input chk-acceso chk-padre roles-chk-largo" type="checkbox" data-nombre="${nombreModulo}" data-escuela="${codigoEscuela}" ${hasAccessMod} onchange="window.ModRoles.evaluarCascada(this, '${codigoEscuela}')">
                            </div>
                        </div>`;

                if (tarjetasHijas.length > 0) {
                    html += `<div class="row g-1 mt-2 ps-3 border-start ms-1 border-${color} border-opacity-25">`;
                    tarjetasHijas.forEach(tarjeta => {
                        let hasAccessTarj = (privsEscuela[tarjeta] && privsEscuela[tarjeta]["ver"]) ? 'checked' : '';
                        html += `
                        <div class="col-12">
                            <div class="d-flex justify-content-between align-items-center bg-light p-1 rounded">
                                <span class="small fw-bold text-muted text-truncate" style="font-size:0.75rem;" title="${tarjeta}"><i class="bi bi-window-stack me-1 text-secondary"></i>${tarjeta.replace('Tarjeta: ', '').replace('Función: ', '').replace('Diccionario: ', '')}</span>
                                <div class="form-check form-switch m-0">
                                    <input class="form-check-input chk-acceso chk-hijo roles-cursor-ptr" type="checkbox" data-nombre="${tarjeta}" data-padre="${nombreModulo}" data-escuela="${codigoEscuela}" ${hasAccessTarj} onchange="window.ModRoles.evaluarHijo(this, '${codigoEscuela}')">
                                </div>
                            </div>
                        </div>`;
                    });
                    html += `</div>`;
                }
                html += `</div></div>`;
            }
            html += `</div></div></div>`;
        }
        
        html += `</div></div>`;
        return html;
    },

    evaluarCascada: function(chkPadre, escuela) {
        let contenedor = chkPadre.closest('.mod-container');
        if (contenedor) {
            contenedor.querySelectorAll(`.chk-hijo[data-escuela="${escuela}"]`).forEach(chk => chk.checked = chkPadre.checked);
        }
        this.evaluarCheckTodos(escuela);
    },

    evaluarHijo: function(chkHijo, escuela) {
        if (chkHijo.checked) {
            let contenedor = chkHijo.closest('.mod-container');
            if (contenedor) {
                let chkPadre = contenedor.querySelector(`.chk-padre[data-escuela="${escuela}"]`);
                if (chkPadre) chkPadre.checked = true;
            }
        }
        this.evaluarCheckTodos(escuela);
    },

    toggleTodosPermisos: function(estado, escuela) {
        document.querySelectorAll(`.chk-acceso[data-escuela="${escuela}"]`).forEach(chk => chk.checked = estado);
    },

    evaluarCheckTodos: function(escuela) {
        const todos = document.querySelectorAll(`.chk-acceso[data-escuela="${escuela}"]`);
        const marcados = document.querySelectorAll(`.chk-acceso[data-escuela="${escuela}"]:checked`);
        const chkTodos = document.getElementById(`chk-marcar-todos-${escuela}`);
        if(chkTodos && todos.length > 0) chkTodos.checked = (todos.length === marcados.length);
    },

    guardarPrivilegios: async function() {
        if (!this.rolActual) return;
        
        let nuevosPriv = { lb: {}, sb: {} };
        const superPoderes = { ver: true, crear: true, eliminar: true, modificar: true, masivo: true, escanear: true, imprimir: true, registrar: true, exportar: true, resetear: true };

        document.querySelectorAll('.chk-acceso:checked').forEach(chk => {
            let nombre = chk.getAttribute('data-nombre');
            let escuela = chk.getAttribute('data-escuela');
            if (escuela && nombre !== '__acceso_plantel__') {
                nuevosPriv[escuela][nombre] = { ...superPoderes };
            }
        });

        // Guardar explícitamente el estado del acceso al plantel, esté marcado o desmarcado
        ['lb', 'sb'].forEach(esc => {
            const chkAcceso = document.querySelector(`.chk-acceso[data-nombre="__acceso_plantel__"][data-escuela="${esc}"]`);
            if (chkAcceso) {
                nuevosPriv[esc]['__acceso_plantel__'] = { ver: chkAcceso.checked };
            }
        });

        window.Aplicacion.mostrarCarga();
        try {
            const { error } = await window.supabaseDB
                .from('roles')
                .update({ permisos: nuevosPriv })
                .eq('nombre', this.rolActual.nombre);

            window.Aplicacion.ocultarCarga();
            if (error) throw error;
            
            Swal.fire('¡Éxito!', 'Los accesos y privilegios se han guardado correctamente.', 'success');
            window.Aplicacion.auditar('Roles y Privilegios', 'Actualizar Privilegios', `Accesos simplificados actualizados para: ${this.rolActual.nombre}`);
            
            // Recargamos el rol en sesión si es el mío para que se refresque el menú instantáneamente
            if (window.Aplicacion.usuario && window.Aplicacion.usuario.rol === this.rolActual.nombre) {
                let escuelaActiva = window.Aplicacion.usuario.id_escuela || localStorage.getItem('sigae_escuela_codigo') || 'sb';
                window.Aplicacion.permisosActuales = nuevosPriv[escuelaActiva] || {};
                window.Aplicacion.dibujarMenuPrincipal();
                window.Aplicacion.marcarMenuActivo(Enrutador.vistaActual);
            }

            this.cargarDatos();
        } catch (e) {
            window.Aplicacion.ocultarCarga();
            Swal.fire('Error', 'No se pudo guardar la matriz.', 'error');
        }
    },

    eliminarRolActual: function() {
        if (!this.rolActual) return;
        Swal.fire({
            title: '¿Eliminar Rol?', text: "Los usuarios con este rol perderán todos sus accesos.", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
        }).then(async (res) => {
            if(res.isConfirmed) {
                window.Aplicacion.mostrarCarga();
                try {
                    const { error } = await window.supabaseDB.from('roles').delete().eq('nombre', this.rolActual.nombre);
                    window.Aplicacion.ocultarCarga();
                    if (error) throw error;

                    Swal.fire('¡Eliminado!', 'El rol ha sido eliminado permanentemente del sistema.', 'success');
                    window.Aplicacion.auditar('Roles y Privilegios', 'Eliminar Rol', `Se eliminó el rol: ${this.rolActual.nombre}`);
                    this.rolActual = null;
                    this.cargarDatos(); 
                } catch (e) {
                    window.Aplicacion.ocultarCarga();
                    Swal.fire('Error', 'Falla al eliminar el rol.', 'error');
                }
            }
        });
    },

    crearRol: function() {
        Swal.fire({
            title: 'Nuevo Rol Global',
            html: `
                <input type="text" id="swal-rol-nombre" class="swal2-input input-moderno mb-3" placeholder="Nombre del Rol (Ej. Coordinador)">
                <small class="text-muted d-block mt-1">Los privilegios por escuela se asignarán después de crearlo.</small>
            `,
            showCancelButton: true, confirmButtonText: 'Crear Rol', cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const nombre = document.getElementById('swal-rol-nombre').value.trim();
                if (!nombre) { Swal.showValidationMessage('El nombre es obligatorio'); return false; }
                return { nombre };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                window.Aplicacion.mostrarCarga();
                try {
                    const { error } = await window.supabaseDB.from('roles').insert([{ 
                        nombre: result.value.nombre, 
                        permisos: { lb: {}, sb: {} },
                        id_escuela: 'global' 
                    }]);
                    window.Aplicacion.ocultarCarga();
                    if(error) throw error;
                    Swal.fire('¡Rol Creado!', `El rol '${result.value.nombre}' ha sido creado. Ahora puedes asignarle privilegios.`, 'success');
                    window.Aplicacion.auditar('Roles y Privilegios', 'Nuevo Rol', `Se creó el rol de acceso global: ${result.value.nombre}`);
                    this.cargarDatos();
                } catch (e) {
                    window.Aplicacion.ocultarCarga();
                    Swal.fire('Error de Base de Datos', 'No se pudo crear el rol.', 'error');
                }
            }
        });
    }
};

window.init_Roles_y_Privilegios = function() { window.ModRoles.init(); };