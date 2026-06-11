/**
 * MÓDULO: CONFIGURACIÓN GLOBAL (Edición Tablas Independientes + Edición)
 * ✨ CONEXIÓN TOTAL CON MATRIZ DE ROLES Y SEGURIDAD ✨
 */
window.ModConfiguracion = {
    init: function() { 
        // ✨ 1. VALIDACIÓN MAESTRA DEL MÓDULO ✨
        if (!window.Aplicacion.permiso('Configuración del Sistema', 'ver')) {
            let contenedor = document.querySelector('.row.g-4.animate__animated.animate__fadeIn');
            if (contenedor) {
                contenedor.innerHTML = `
                <div class="col-12 text-center py-5 animate__animated animate__fadeIn mt-4">
                    <div class="bg-light d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm border" style="width: 100px; height: 100px;">
                        <i class="bi bi-shield-lock-fill text-muted" style="font-size: 3.5rem;"></i>
                    </div>
                    <h4 class="text-dark fw-bold mb-2">Área Restringida</h4>
                    <p class="text-muted mb-0">No tienes permisos asignados para acceder a la configuración del sistema.</p>
                </div>`;
            }
            return; // Bloqueamos ejecución
        }

        this.aplicarSeguridadVisual();
        this.aplicarEventos();
        this.cargarConfiguraciones(); 
    },

    aplicarEventos: function() {
        const btnImpPer = document.getElementById('btn-importar-periodos');
        if(btnImpPer) btnImpPer.onclick = () => this.abrirImportadorCSV('conf_periodos');

        const btnNuePer = document.getElementById('btn-nuevo-periodo');
        if(btnNuePer) btnNuePer.onclick = () => this.nuevoParametro('Periodo_Escolar');

        const btnImpLap = document.getElementById('btn-importar-lapsos');
        if(btnImpLap) btnImpLap.onclick = () => this.abrirImportadorCSV('conf_lapsos');

        const btnNueLap = document.getElementById('btn-nuevo-lapso');
        if(btnNueLap) btnNueLap.onclick = () => this.nuevoParametro('Fase_Escolar');

        const btnImpNiv = document.getElementById('btn-importar-niveles');
        if(btnImpNiv) btnImpNiv.onclick = () => this.abrirImportadorCSV('conf_niveles');

        const btnNueNiv = document.getElementById('btn-nuevo-nivel');
        if(btnNueNiv) btnNueNiv.onclick = () => this.nuevoParametro('Nivel_Educativo', false);

        // Delegación de eventos para botones dinámicos de las listas (Editar y Eliminar)
        const listas = ['lista-periodos', 'lista-lapsos', 'lista-niveles'];
        listas.forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                el.onclick = (e) => {
                    const btn = e.target.closest('button');
                    if(!btn) return;
                    
                    const idParam = btn.getAttribute('data-id');
                    const tabla = btn.getAttribute('data-tabla');
                    
                    if(btn.classList.contains('btn-editar-param')) {
                        const valor = btn.getAttribute('data-valor');
                        const inicio = btn.getAttribute('data-inicio') === 'null' ? null : btn.getAttribute('data-inicio');
                        const fin = btn.getAttribute('data-fin') === 'null' ? null : btn.getAttribute('data-fin');
                        const reqFechas = btn.getAttribute('data-req-fechas') === 'true';
                        this.editar(idParam, tabla, valor, inicio, fin, reqFechas);
                    } else if(btn.classList.contains('btn-eliminar-param')) {
                        this.eliminar(idParam, tabla);
                    }
                };
            }
        });
    },

    // ✨ 2. OCULTAMIENTO DE TARJETAS Y BOTONES (VER Y CREAR) ✨
    aplicarSeguridadVisual: function() {
        let colPeriodos = document.getElementById('lista-periodos')?.closest('.col-md-4');
        let colLapsos = document.getElementById('lista-lapsos')?.closest('.col-md-4');
        let colNiveles = document.getElementById('lista-niveles')?.closest('.col-md-4');

        // Visibilidad de las columnas
        if (!window.Aplicacion.permiso('Tarjeta: Períodos Escolares', 'ver') && colPeriodos) colPeriodos.style.display = 'none';
        if (!window.Aplicacion.permiso('Tarjeta: Lapsos Académicos', 'ver') && colLapsos) colLapsos.style.display = 'none';
        if (!window.Aplicacion.permiso('Tarjeta: Niveles Educativos', 'ver') && colNiveles) colNiveles.style.display = 'none';

        // Ocultar botones superiores de Crear (+)
        if (!window.Aplicacion.permiso('Tarjeta: Períodos Escolares', 'crear')) {
            let btn = document.querySelector(`button[onclick="window.ModConfiguracion.nuevoParametro('Periodo_Escolar')"]`);
            if (btn) btn.style.display = 'none';
        }
        if (!window.Aplicacion.permiso('Tarjeta: Lapsos Académicos', 'crear')) {
            let btn = document.querySelector(`button[onclick="window.ModConfiguracion.nuevoParametro('Fase_Escolar')"]`);
            if (btn) btn.style.display = 'none';
        }
        if (!window.Aplicacion.permiso('Tarjeta: Niveles Educativos', 'crear')) {
            let btn = document.querySelector(`button[onclick="window.ModConfiguracion.nuevoParametro('Nivel_Educativo', false)"]`);
            if (btn) btn.style.display = 'none';
        }
    },

    cargarConfiguraciones: async function() {
        window.Aplicacion.mostrarCarga();
        try {
            const [perRes, lapRes, nivRes] = await Promise.all([
                window.supabaseDB.from('conf_periodos').select('*').order('valor', { ascending: false }),
                window.supabaseDB.from('conf_lapsos').select('*').order('valor', { ascending: true }),
                window.supabaseDB.from('conf_niveles').select('*').order('valor', { ascending: true })
            ]);
            
            window.Aplicacion.ocultarCarga();
            if (perRes.error) throw perRes.error;

            let periodos = this.procesarConFechas(perRes.data || [], 'conf_periodos');
            let lapsos = this.procesarConFechas(lapRes.data || [], 'conf_lapsos');
            let niveles = (nivRes.data || []).map(n => ({ id: n.id_parametro, valor: n.valor, tabla: 'conf_niveles' }));

            // Solo renderizamos si el usuario tiene permiso de ver esa tarjeta
            if (window.Aplicacion.permiso('Tarjeta: Períodos Escolares', 'ver')) this.renderizarLista('lista-periodos', periodos, true);
            if (window.Aplicacion.permiso('Tarjeta: Lapsos Académicos', 'ver')) this.renderizarLista('lista-lapsos', lapsos, true);
            if (window.Aplicacion.permiso('Tarjeta: Niveles Educativos', 'ver')) this.renderizarLista('lista-niveles', niveles, false);
        } catch (e) {
            window.Aplicacion.ocultarCarga();
            console.error(e);
            if (e.code === 'PGRST205' || (e.message && e.message.includes('Could not find the table'))) {
                Swal.fire({
                    title: 'Tablas de Configuración No Encontradas',
                    html: `Las tablas de configuración (<code>conf_periodos</code>, <code>conf_lapsos</code> o <code>conf_niveles</code>) no existen en el esquema de su base de datos Supabase.<br><br>Por favor, ejecute la consulta SQL de creación provista en el <strong>Plan de Implementación</strong> desde el SQL Editor de su panel de Supabase.`,
                    icon: 'warning',
                    confirmButtonColor: '#4F46E5'
                });
            } else {
                Swal.fire("Error", "No se pudieron cargar las configuraciones.", "error");
            }
        }
    },

    procesarConFechas: function(data, nombreTabla) {
        let hoy = new Date().getTime(); 
        return data.map(item => {
            let estadoDinamico = "Sin Fechas";
            if (item.fecha_inicio && item.fecha_fin) {
                let pIn = new Date(item.fecha_inicio + "T00:00:00").getTime();
                let pOut = new Date(item.fecha_fin + "T23:59:59").getTime();
                if (hoy < pIn) estadoDinamico = "Próximo";
                else if (hoy > pOut) estadoDinamico = "Finalizado";
                else estadoDinamico = "Activo";
            }
            return { id: item.id_parametro, valor: item.valor, estado: estadoDinamico, inicio: item.fecha_inicio, fin: item.fecha_fin, tabla: nombreTabla };
        });
    },

    renderizarLista: function(idContenedor, listaDatos, requiereFechas) {
        const contenedor = document.getElementById(idContenedor);
        if(!contenedor) return;

        if(!listaDatos || listaDatos.length === 0) {
            contenedor.innerHTML = `<div class="p-4 text-center text-muted"><i class="bi bi-inbox fs-2"></i><p class="mb-0 small fw-bold mt-2">No hay registros</p></div>`;
            return;
        }

        // Determinar qué permisos aplicar según la tarjeta
        let cardName = "";
        if (idContenedor === 'lista-periodos') cardName = 'Tarjeta: Períodos Escolares';
        if (idContenedor === 'lista-lapsos') cardName = 'Tarjeta: Lapsos Académicos';
        if (idContenedor === 'lista-niveles') cardName = 'Tarjeta: Niveles Educativos';

        let pCrear = window.Aplicacion.permiso(cardName, 'crear'); 
        let pElim = window.Aplicacion.permiso(cardName, 'eliminar');

        let html = '';
        listaDatos.forEach(item => {
            let badgeHTML = '';
            if (requiereFechas) {
                if(item.estado === 'Activo') badgeHTML = `<span class="badge bg-success rounded-pill px-2 shadow-sm" style="font-size: 0.7rem;">Activo</span>`;
                else if(item.estado === 'Próximo') badgeHTML = `<span class="badge bg-warning text-dark rounded-pill px-2 shadow-sm" style="font-size: 0.7rem;">Próximo</span>`;
                else badgeHTML = `<span class="badge bg-secondary rounded-pill px-2 shadow-sm" style="font-size: 0.7rem;">Finalizado</span>`;
            }

            let infoFechas = requiereFechas ? `<div class="small text-muted mt-1" style="font-size: 0.75rem;"><i class="bi bi-calendar2-range me-1"></i>${item.inicio || '?'} al ${item.fin || '?'}</div>` : '';

            let valInicio = item.inicio ? `'${item.inicio}'` : `null`;
            let valFin = item.fin ? `'${item.fin}'` : `null`;
            
            // ✨ 3. BLOQUEO DE BOTONES DE EDICIÓN Y ELIMINACIÓN ✨
            let btnEditar = pCrear ? `<button class="btn btn-sm btn-light text-primary rounded-circle shadow-sm me-1 btn-editar-param" data-id="${item.id}" data-tabla="${item.tabla}" data-valor="${item.valor}" data-inicio="${item.inicio || null}" data-fin="${item.fin || null}" data-req-fechas="${requiereFechas}" title="Editar"><i class="bi bi-pencil-square"></i></button>` : '';
            let btnEliminar = pElim ? `<button class="btn btn-sm btn-light text-danger rounded-circle shadow-sm btn-eliminar-param" data-id="${item.id}" data-tabla="${item.tabla}" title="Eliminar"><i class="bi bi-trash3-fill"></i></button>` : '';

            html += `
            <div class="list-group-item p-3 border-0 border-bottom d-flex justify-content-between align-items-center hover-efecto" style="transition: background 0.2s;">
                <div>
                    <div class="fw-bold text-dark d-flex align-items-center gap-2">${item.valor} ${badgeHTML}</div>
                    ${infoFechas}
                </div>
                <div class="d-flex">
                    ${btnEditar}
                    ${btnEliminar}
                </div>
            </div>`;
        });
        contenedor.innerHTML = html;
    },

    nuevoParametro: function(categoria, requiereFechas = true) {
        let cardName = categoria === 'Periodo_Escolar' ? 'Tarjeta: Períodos Escolares' : (categoria === 'Fase_Escolar' ? 'Tarjeta: Lapsos Académicos' : 'Tarjeta: Niveles Educativos');
        if (!window.Aplicacion.permiso(cardName, 'crear')) return Swal.fire('Acceso Denegado', 'No tienes permiso para crear registros en esta categoría.', 'error');

        let htmlForm = `<input type="text" id="swal-valor" class="swal2-input input-moderno mb-3" placeholder="Ej: ${categoria === 'Periodo_Escolar' ? '2025 - 2026' : (categoria === 'Fase_Escolar' ? '1er Momento' : 'Educación Media')}">`;
        if (requiereFechas) {
            htmlForm += `<div class="row text-start mt-3"><div class="col-6"><label class="small fw-bold text-muted mb-1">Inicio</label><input type="date" id="swal-inicio" class="swal2-input m-0 w-100 input-moderno text-muted"></div><div class="col-6"><label class="small fw-bold text-muted mb-1">Fin</label><input type="date" id="swal-fin" class="swal2-input m-0 w-100 input-moderno text-muted"></div></div>`;
        }
        Swal.fire({ title: 'Nuevo Registro', html: htmlForm, showCancelButton: true, confirmButtonText: 'Guardar', preConfirm: () => {
            const valor = document.getElementById('swal-valor').value;
            if (!valor) { Swal.showValidationMessage('Obligatorio'); return false; }
            let inicio = null, fin = null;
            if (requiereFechas) {
                inicio = document.getElementById('swal-inicio').value; fin = document.getElementById('swal-fin').value;
                if (!inicio || !fin) { Swal.showValidationMessage('Fechas obligatorias'); return false; }
            }
            return { valor: valor, inicio: inicio, fin: fin };
        }}).then((result) => { if (result.isConfirmed) this.guardar(categoria, result.value); });
    },

    editar: function(id, tabla, valorActual, inicioActual, finActual, requiereFechas) {
        let cardName = tabla === 'conf_periodos' ? 'Tarjeta: Períodos Escolares' : (tabla === 'conf_lapsos' ? 'Tarjeta: Lapsos Académicos' : 'Tarjeta: Niveles Educativos');
        if (!window.Aplicacion.permiso(cardName, 'crear')) return Swal.fire('Acceso Denegado', 'No tienes permiso para editar registros en esta categoría.', 'error');

        let valIn = inicioActual && inicioActual !== 'null' ? inicioActual : '';
        let valOut = finActual && finActual !== 'null' ? finActual : '';

        let htmlForm = `<input type="text" id="swal-valor-ed" class="swal2-input input-moderno mb-3" value="${valorActual}">`;
        if (requiereFechas) {
            htmlForm += `<div class="row text-start mt-3"><div class="col-6"><label class="small fw-bold text-muted mb-1">Inicio</label><input type="date" id="swal-inicio-ed" class="swal2-input m-0 w-100 input-moderno text-muted" value="${valIn}"></div><div class="col-6"><label class="small fw-bold text-muted mb-1">Fin</label><input type="date" id="swal-fin-ed" class="swal2-input m-0 w-100 input-moderno text-muted" value="${valOut}"></div></div>`;
        }

        Swal.fire({
            title: 'Editar Registro',
            html: htmlForm,
            showCancelButton: true,
            confirmButtonText: 'Actualizar',
            confirmButtonColor: '#0066FF',
            preConfirm: () => {
                const valor = document.getElementById('swal-valor-ed').value;
                if (!valor) { Swal.showValidationMessage('Obligatorio'); return false; }
                let inicio = null, fin = null;
                if (requiereFechas) {
                    inicio = document.getElementById('swal-inicio-ed').value;
                    fin = document.getElementById('swal-fin-ed').value;
                    if (!inicio || !fin) { Swal.showValidationMessage('Fechas obligatorias'); return false; }
                }
                return { valor: valor, inicio: inicio, fin: fin };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                window.Aplicacion.mostrarCarga();
                try {
                    const payload = { valor: result.value.valor };
                    if (requiereFechas) {
                        payload.fecha_inicio = result.value.inicio;
                        payload.fecha_fin = result.value.fin;
                    }

                    const { error } = await window.supabaseDB.from(tabla).update(payload).eq('id_parametro', id);
                    window.Aplicacion.ocultarCarga();
                    if (error) throw error;
                    
                    Swal.fire({toast: true, position: 'top-end', icon: 'success', title: 'Registro actualizado', showConfirmButton: false, timer: 1500});
                    
                    // ✨ AUDITORÍA ✨
                    window.Aplicacion.auditar('Configuración del Sistema', 'Editar Parámetro', `Se actualizó un registro en la tabla ${tabla} al valor: ${result.value.valor}`);
                    
                    this.cargarConfiguraciones();
                } catch(e) {
                    window.Aplicacion.ocultarCarga();
                    Swal.fire('Error', 'No se pudo actualizar en la base de datos.', 'error');
                }
            }
        });
    },

    guardar: async function(categoria, datos) {
        window.Aplicacion.mostrarCarga();
        let tabla = categoria === 'Periodo_Escolar' ? 'conf_periodos' : (categoria === 'Fase_Escolar' ? 'conf_lapsos' : 'conf_niveles');
        try {
            const payload = { id_parametro: "CONF-" + new Date().getTime(), valor: datos.valor };
            if (datos.inicio) { payload.fecha_inicio = datos.inicio; payload.fecha_fin = datos.fin; }
            const { error } = await window.supabaseDB.from(tabla).insert([payload]);
            window.Aplicacion.ocultarCarga();
            if (error) throw error;
            
            Swal.fire({toast: true, position: 'top-end', icon: 'success', title: 'Guardado', showConfirmButton: false, timer: 1500});
            
            // ✨ AUDITORÍA ✨
            window.Aplicacion.auditar('Configuración del Sistema', 'Nuevo Parámetro', `Se agregó "${datos.valor}" a la configuración de ${categoria.replace('_', ' ')}`);
            
            this.cargarConfiguraciones();
        } catch(e) { window.Aplicacion.ocultarCarga(); Swal.fire('Error', 'No se pudo guardar.', 'error'); }
    },

    eliminar: function(id, tabla) {
        let cardName = tabla === 'conf_periodos' ? 'Tarjeta: Períodos Escolares' : (tabla === 'conf_lapsos' ? 'Tarjeta: Lapsos Académicos' : 'Tarjeta: Niveles Educativos');
        if (!window.Aplicacion.permiso(cardName, 'eliminar')) return Swal.fire('Acceso Denegado', 'No tienes permiso para eliminar registros.', 'error');

        Swal.fire({ title: '¿Eliminar?', text: "Se borrará del sistema.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, eliminar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                window.Aplicacion.mostrarCarga();
                try {
                    const { error } = await window.supabaseDB.from(tabla).delete().eq('id_parametro', id);
                    window.Aplicacion.ocultarCarga();
                    if (error) throw error;
                    
                    // ⚙️ AUDITORÍA ⚙️
                    window.Aplicacion.auditar('Configuración del Sistema', 'Eliminar Parámetro', `Se eliminó un parámetro de configuración interno.`);
                    
                    this.cargarConfiguraciones();
                } catch(e) { window.Aplicacion.ocultarCarga(); Swal.fire('Error', 'No se pudo eliminar.', 'error'); }
            }
        });
    },

    abrirImportadorCSV: function(tabla) {
        let cardName = tabla === 'conf_periodos' ? 'Tarjeta: Períodos Escolares' : (tabla === 'conf_lapsos' ? 'Tarjeta: Lapsos Académicos' : 'Tarjeta: Niveles Educativos');
        if (!window.Aplicacion.permiso(cardName, 'crear')) {
            return Swal.fire('Acceso Denegado', 'No tienes permiso para importar registros.', 'error');
        }

        Swal.fire({
            title: 'Carga Masiva CSV',
            html: `
                <div class="text-start">
                    <p class="small text-muted mb-2">Sube un archivo <b>CSV (separado por punto y coma o comas)</b> con el formato correcto.</p>
                    <p class="small text-muted mb-2">Columnas esperadas: <code>id_parametro</code>, <code>valor</code>, y opcionalmente <code>fecha_inicio</code>, <code>fecha_fin</code>.</p>
                    <input type="file" id="file-csv-config" class="form-control border-primary" accept=".csv">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: '<i class="bi bi-cloud-upload-fill me-1"></i> Procesar',
            confirmButtonColor: '#4F46E5',
            preConfirm: () => {
                const file = document.getElementById('file-csv-config').files[0];
                if(!file) {
                    Swal.showValidationMessage('Debes seleccionar un archivo CSV');
                    return false;
                }
                return file;
            }
        }).then(res => {
            if(res.isConfirmed) this.procesarCSV(res.value, tabla);
        });
    },

    procesarCSV: function(file, tabla) {
        let reader = new FileReader();
        reader.onload = async (e) => {
            let text = e.target.result;
            let lines = text.split(/\r?\n/);
            let validos = [];
            let rechazados = [];
            let startIndex = 0;
            
            // Detectar encabezado
            if(lines.length > 0 && (lines[0].toLowerCase().includes('id_parametro') || lines[0].toLowerCase().includes('valor'))) {
                startIndex = 1;
            }

            for(let i = startIndex; i < lines.length; i++) {
                let line = lines[i].trim();
                if(!line) continue;
                let row = line.split(/[;,]/);
                
                if(row.length < 2) {
                    rechazados.push({ linea: i+1, datos: line, motivo: "Columnas insuficientes (se requiere al menos id_parametro y valor)." });
                    continue;
                }

                let id = row[0].trim();
                let valor = row[1].trim();
                let inicio = row.length > 2 ? row[2].trim() : null;
                let fin = row.length > 3 ? row[3].trim() : null;

                if(!id || !valor) {
                    rechazados.push({ linea: i+1, datos: line, motivo: "id_parametro o valor están en blanco." });
                    continue;
                }

                let registro = { id_parametro: id, valor: valor };
                if (tabla !== 'conf_niveles') {
                    if (inicio) registro.fecha_inicio = inicio;
                    if (fin) registro.fecha_fin = fin;
                }
                validos.push(registro);
            }

            if(validos.length === 0 && rechazados.length === 0) {
                return Swal.fire('Error', 'El archivo está vacío o el formato es incorrecto.', 'error');
            }

            window.Aplicacion.mostrarCarga();
            let insertados = 0;
            let actualizados = 0;

            try {
                if (validos.length > 0) {
                    // Obtener IDs existentes para clasificar en insertar vs actualizar
                    let idsNuevos = validos.map(v => v.id_parametro);
                    const { data: existentes, error: queryErr } = await window.supabaseDB.from(tabla).select('id_parametro').in('id_parametro', idsNuevos);
                    if (queryErr) throw queryErr;
                    
                    let idsBD = (existentes || []).map(ex => ex.id_parametro);
                    let registrosIns = [];
                    let registrosUpd = [];

                    validos.forEach(v => {
                        if(idsBD.includes(v.id_parametro)) {
                            registrosUpd.push(v);
                        } else {
                            registrosIns.push(v);
                        }
                    });

                    if(registrosIns.length > 0) {
                        const { error } = await window.supabaseDB.from(tabla).insert(registrosIns);
                        if(error) throw error;
                        insertados = registrosIns.length;
                    }

                    if(registrosUpd.length > 0) {
                        const { error } = await window.supabaseDB.from(tabla).upsert(registrosUpd, { onConflict: 'id_parametro' });
                        if(error) throw error;
                        actualizados = registrosUpd.length;
                    }
                }

                window.Aplicacion.ocultarCarga();
                this._rechazadosTemporales = rechazados;
                
                let htmlResumen = `
                    <div class="text-start">
                        <p class="mb-3 text-muted">Se leyeron <b>${validos.length + rechazados.length}</b> filas del archivo.</p>
                        <div class="bg-light p-3 border rounded-3 mb-2">
                            <p class="text-success m-0 fw-bold"><i class="bi bi-check-circle-fill me-2"></i>Nuevos agregados: ${insertados}</p>
                            <p class="text-info m-0 mt-2 fw-bold"><i class="bi bi-arrow-repeat me-2"></i>Actualizados: ${actualizados}</p>
                            <p class="text-danger m-0 mt-2 fw-bold"><i class="bi bi-x-circle-fill me-2"></i>Rechazados: ${rechazados.length}</p>
                        </div>
                    </div>
                `;

                let confText = '<i class="bi bi-check-lg"></i> Entendido';
                let cancelText = '';
                let showCancel = false;
                
                if (rechazados.length > 0) {
                    showCancel = true;
                    cancelText = '<i class="bi bi-download me-1"></i> Bajar Errores';
                }

                Swal.fire({
                    title: 'Resumen de Carga',
                    html: htmlResumen,
                    icon: rechazados.length > 0 ? 'warning' : 'success',
                    showCancelButton: showCancel,
                    confirmButtonText: confText,
                    cancelButtonText: cancelText,
                    cancelButtonColor: '#dc3545',
                    confirmButtonColor: '#4F46E5',
                    reverseButtons: true
                }).then((result) => {
                    if (result.dismiss === Swal.DismissReason.cancel && rechazados.length > 0) {
                        this.descargarRechazados(tabla);
                    }
                });

                this.cargarConfiguraciones();
                window.Aplicacion.auditar('Configuración del Sistema', 'Carga Masiva', `Tabla: ${tabla}, Insertados: ${insertados}, Actualizados: ${actualizados}, Rechazados: ${rechazados.length}`);
            } catch(errorDb) {
                window.Aplicacion.ocultarCarga();
                Swal.fire('Error en Base de Datos', 'No se pudo procesar la carga masiva. ' + errorDb.message, 'error');
            }
        };
        reader.readAsText(file);
    },

    descargarRechazados: function(tabla) {
        if(!this._rechazadosTemporales || this._rechazadosTemporales.length === 0) return;
        let csv = "Linea_Excel;Datos_Originales;Motivo_del_Rechazo\n";
        this._rechazadosTemporales.forEach(r => {
            let datosSafe = r.datos.replace(/"/g, '""');
            let motivoSafe = r.motivo.replace(/"/g, '""');
            csv += `${r.linea};"${datosSafe}";"${motivoSafe}"\n`;
        });
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Rechazados_${tabla}_${new Date().getTime()}.csv`;
        link.click();
    }
};

window.init_Configuracion_del_Sistema = function() { window.ModConfiguracion.init(); };
window.init_Configuración_del_Sistema = function() { window.ModConfiguracion.init(); };