/**
 * MÓDULO: MI PERFIL (Versión Final Blindada)
 * Sincronización exacta con esquema SQL y manejo defensivo de DOM.
 */

window.ModPerfil = {
    preguntasBase: [],
    
    init: function() {
        console.log("Iniciando Módulo de Perfil...");
        this.aplicarEventos();
        this.cargarTodo();
    },

    aplicarEventos: function() {
        // Manejador de visibilidad para Clave
        const chkClave = document.getElementById('check-clave');
        if(chkClave) {
            chkClave.onchange = () => {
                const blk = document.getElementById('bloque-claves');
                if(blk) {
                    blk.classList.toggle('d-none', !chkClave.checked);
                    blk.classList.toggle('d-flex', chkClave.checked);
                }
            };
        }
        
        // Manejador de visibilidad para Preguntas
        const chkPreguntas = document.getElementById('check-preguntas');
        if(chkPreguntas) {
            chkPreguntas.onchange = () => {
                const blk = document.getElementById('bloque-preguntas');
                if(blk) {
                    blk.classList.toggle('d-none', !chkPreguntas.checked);
                    blk.classList.toggle('d-flex', chkPreguntas.checked);
                }
            };
        }

        // Manejador de visibilidad para Biometría
        const chkBiometrico = document.getElementById('check-biometrico');
        if(chkBiometrico) {
            chkBiometrico.onchange = () => {
                const blk = document.getElementById('bloque-biometrico');
                if(blk) {
                    blk.classList.toggle('d-none', !chkBiometrico.checked);
                    blk.classList.toggle('d-flex', chkBiometrico.checked);
                }
            };
        }

        // Botón de configurar biometría
        const btnBiometrico = document.getElementById('btn-configurar-biometria');
        if(btnBiometrico) {
            btnBiometrico.onclick = () => {
                if(window.Aplicacion && typeof window.Aplicacion.registrarHuella === 'function') {
                    window.Aplicacion.registrarHuella();
                }
            };
        }

        // Manejador del Formulario
        const form = document.getElementById('form-mi-perfil');
        if(form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                this.guardarCambios();
            };
        }

        // Manejador de Fuerza de Contraseña
        const inputClaveNueva = document.getElementById('perfil-clave-nueva');
        if(inputClaveNueva) {
            inputClaveNueva.oninput = (e) => {
                this.evaluarFuerzaClaveLocal(e.target.value);
            };
        }
    },

    evaluarFuerzaClaveLocal: function(clave) {
        let fuerza = 0;
        if (clave.length >= 8) fuerza += 25;
        if (/[A-Z]/.test(clave)) fuerza += 25;
        if (/[a-z]/.test(clave)) fuerza += 25;
        if (/[0-9]/.test(clave)) fuerza += 15;
        if (/[^A-Za-z0-9]/.test(clave)) fuerza += 10;
        
        let barra = document.getElementById('perfil-fuerza-barra');
        let texto = document.getElementById('perfil-fuerza-texto');
        if (!barra || !texto) return;

        barra.style.width = fuerza + '%';
        if (fuerza < 50) {
            barra.className = 'progress-bar bg-danger';
            texto.className = 'text-danger mt-1 d-block';
            texto.innerText = 'Débil (Requiere mayúscula, minúscula, número y símbolo)';
        } else if (fuerza < 75) {
            barra.className = 'progress-bar bg-warning';
            texto.className = 'text-warning mt-1 d-block';
            texto.innerText = 'Media (Agregue símbolos o números)';
        } else {
            barra.className = 'progress-bar bg-success';
            texto.className = 'text-success mt-1 d-block';
            texto.innerText = 'Fuerte (Contraseña segura)';
        }
    },

    cargarTodo: async function() {
        let appUser = window.Aplicacion.usuario;
        if (!appUser) {
            const stored = localStorage.getItem('sigae_usuario');
            if (stored) appUser = JSON.parse(stored);
        }
        if (!appUser) return;
        
        const cedula = String(appUser.cedula).trim();
        window.Aplicacion.mostrarCarga();
        
        try {
            // 1. Cargar catálogo de preguntas
            const { data: qData } = await window.supabaseDB
                .from('conf_preguntas_seguridad')
                .select('pregunta')
                .order('pregunta', { ascending: true });
            
            this.preguntasBase = qData || [];

            // 2. Cargar datos reales
            let user = null;
            if (appUser.rol === 'Invitado' || appUser.rol === 'Visitante') {
                const { data: invData, error: invErr } = await window.supabaseDB
                    .from('invitados')
                    .select('*')
                    .eq('cedula', cedula)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                
                if (invErr) throw invErr;
                
                user = { ...appUser };
                if (invData) {
                    user.nombre_completo = (invData.nombres + ' ' + invData.apellidos).trim();
                    user.email = invData.correo;
                    user.telefono = invData.telefono;
                } else {
                    user.nombre_completo = appUser.nombre || 'Visitante';
                }
            } else {
                const { data: dbUser, error: userErr } = await window.supabaseDB
                    .from('usuarios')
                    .select('*')
                    .eq('cedula', cedula)
                    .maybeSingle();

                if (userErr) throw userErr;
                user = dbUser || appUser;
            }

            window.Aplicacion.ocultarCarga();

            if (user) {
                // Sincronización con columnas: nombre_completo, email, telefono
                const nom = user.nombre_completo || user.nombre || 'Usuario';
                if(document.getElementById('perfil-nombre-display')) document.getElementById('perfil-nombre-display').innerText = nom;
                if(document.getElementById('perfil-cedula-display')) document.getElementById('perfil-cedula-display').innerText = user.cedula;
                if(document.getElementById('perfil-rol-display')) document.getElementById('perfil-rol-display').innerText = user.rol || 'Sin Rol';
                
                if(document.getElementById('perfil-nombre')) document.getElementById('perfil-nombre').value = nom;
                if(document.getElementById('perfil-email')) document.getElementById('perfil-email').value = user.email || '';
                if(document.getElementById('perfil-telefono')) document.getElementById('perfil-telefono').value = user.telefono || '';
                
                let pregJSON = {};
                try { pregJSON = typeof user.preguntas_seguridad === 'string' ? JSON.parse(user.preguntas_seguridad) : (user.preguntas_seguridad || {}); } catch(e){}

                this.llenarSelects(pregJSON.pregunta_1, pregJSON.pregunta_2);
                
                user.pregJSON = pregJSON; // Inyectado para calcularTermometro
                this.calcularTermometro(user);

                // Estado biométrico
                const statusTxt = document.getElementById('txt-biometrico-status');
                const btnBiom = document.getElementById('btn-configurar-biometria');
                const hasBiometric = user.credencial_biometrica && user.credencial_biometrica.trim().length > 0;
                
                if (statusTxt) {
                    if (hasBiometric) {
                        statusTxt.innerHTML = '<strong>¡Configurado!</strong> Credencial registrada en el sistema.';
                        statusTxt.className = 'small text-success';
                    } else {
                        statusTxt.innerText = 'No configurado en este perfil.';
                        statusTxt.className = 'small text-muted';
                    }
                }
                
                if (btnBiom) {
                    btnBiom.innerHTML = hasBiometric ? '<i class="bi bi-arrow-repeat me-2"></i>Actualizar Huella' : '<i class="bi bi-plus-circle-fill me-2"></i>Registrar Huella';
                }

                // Ocultar características de seguridad para Invitados
                if (user.rol === 'Invitado' || user.rol === 'Visitante') {
                    const chkClave = document.getElementById('check-clave');
                    if (chkClave && chkClave.parentElement) chkClave.parentElement.classList.add('d-none');
                    
                    const chkPreg = document.getElementById('check-preguntas');
                    if (chkPreg && chkPreg.parentElement) chkPreg.parentElement.classList.add('d-none');

                    const chkBiom = document.getElementById('check-biometrico');
                    if (chkBiom && chkBiom.parentElement) chkBiom.parentElement.classList.add('d-none');
                    
                    // Ocultar encabezado "Seguridad"
                    const formRow = document.querySelector('#form-mi-perfil .row.g-4');
                    if (formRow) {
                        const h5s = formRow.querySelectorAll('h5');
                        h5s.forEach(h => { 
                            if(h.innerText.includes('Seguridad') && h.parentElement) {
                                h.parentElement.classList.add('d-none'); 
                            }
                        });
                    }
                    
                    // (Ya no ocultamos el Termómetro Global para invitados)
                }

            }

        } catch (e) {
            window.Aplicacion.ocultarCarga();
            console.error("Error cargando perfil:", e);
            Swal.fire('Error', 'Falla al conectar con el servidor de datos.', 'error');
        }
    },

    calcularTermometro: function(user) {
        let score = 0;
        const isGuest = (user.rol === 'Invitado' || user.rol === 'Visitante');
        
        const setCheck = (id, isValid, points) => {
            const icon = document.getElementById(id);
            if(icon) {
                if(isValid) {
                    icon.className = 'bi bi-check-circle-fill text-success fs-4 me-3';
                    score += points;
                } else {
                    icon.className = 'bi bi-x-circle-fill text-danger fs-4 me-3';
                }
            }
        };

        if (isGuest) {
            // Invitados: 50% email, 50% teléfono
            setCheck('icon-chk-email', user.email && user.email.trim().length > 0, 50);
            setCheck('icon-chk-telefono', user.telefono && user.telefono.trim().length > 0, 50);
            
            // Ocultar de la lista los que no aplican
            ['icon-chk-clave', 'icon-chk-preg1', 'icon-chk-preg2', 'icon-chk-biometrico'].forEach(id => {
                const el = document.getElementById(id);
                if(el && el.closest('.list-group-item')) el.closest('.list-group-item').classList.add('d-none');
            });
        } else {
            // Usuarios Regulares: 6 items (email/phone/preguntas = 15% cada uno; clave/biometría = 20% cada uno)
            setCheck('icon-chk-email', user.email && user.email.trim().length > 0, 15);
            setCheck('icon-chk-telefono', user.telefono && user.telefono.trim().length > 0, 15);
            
            let claveVigente = false;
            if(user.fecha_ult_clave) {
                const diffDias = Math.floor((new Date() - new Date(user.fecha_ult_clave)) / (1000 * 60 * 60 * 24));
                if(diffDias < 30) claveVigente = true;
            }
            setCheck('icon-chk-clave', claveVigente, 20);
            setCheck('icon-chk-preg1', user.pregJSON && user.pregJSON.pregunta_1 && user.pregJSON.respuesta_1, 15);
            setCheck('icon-chk-preg2', user.pregJSON && user.pregJSON.pregunta_2 && user.pregJSON.respuesta_2, 15);
            
            let biometriaConfigurada = user.credencial_biometrica && user.credencial_biometrica.trim().length > 0;
            setCheck('icon-chk-biometrico', biometriaConfigurada, 20);

            // Asegurar que el ítem de biometría sea visible
            const elBiom = document.getElementById('icon-chk-biometrico');
            if(elBiom && elBiom.closest('.list-group-item')) {
                elBiom.closest('.list-group-item').classList.remove('d-none');
                elBiom.closest('.list-group-item').classList.add('d-flex');
            }
        }

        // Actualizar UI del Termómetro Circular
        const circle = document.getElementById('svg-seguridad-progreso');
        const lbl = document.getElementById('lbl-seguridad-porcentaje');
        
        if(circle) circle.style.strokeDasharray = `${score}, 100`;
        if(lbl) lbl.innerText = `${score}%`;
        
        if(circle) {
            if(score < 50) circle.setAttribute('stroke', '#dc3545'); // danger
            else if(score < 100) circle.setAttribute('stroke', '#ffc107'); // warning
            else circle.setAttribute('stroke', '#198754'); // success
        }
    },

    llenarSelects: function(p1, p2) {
        const s1 = document.getElementById('perfil-preg1');
        const s2 = document.getElementById('perfil-preg2');
        if (!s1 || !s2) return;

        let html = '<option value="">-- Seleccione Pregunta --</option>';
        this.preguntasBase.forEach(item => {
            html += `<option value="${item.pregunta}">${item.pregunta}</option>`;
        });

        s1.innerHTML = html;
        s2.innerHTML = html;

        if (p1) s1.value = p1;
        if (p2) s2.value = p2;
    },

    guardarCambios: async function() {
        const cedula = window.Aplicacion.usuario.cedula;
        const nombreVal = document.getElementById('perfil-nombre').value.trim();
        const emailVal  = document.getElementById('perfil-email').value.trim();
        const telfVal   = document.getElementById('perfil-telefono').value.trim();

        const updClave = document.getElementById('check-clave')?.checked;
        const updPreg  = document.getElementById('check-preguntas')?.checked;

        if (updClave) {
            const cAct = document.getElementById('perfil-clave-actual').value;
            const cNue = document.getElementById('perfil-clave-nueva').value;
            const cCon = document.getElementById('perfil-clave-confirmar').value;
            if (!cAct || !cNue || !cCon) return Swal.fire('Atención', 'Debe completar todos los campos de clave.', 'warning');
            if (cNue !== cCon) return Swal.fire('Atención', 'La confirmación no coincide.', 'warning');
        }

        window.Aplicacion.mostrarCarga();

        try {
            // Verificación de clave actual
            if (updClave) {
                const { data: vUser } = await window.supabaseDB
                    .from('usuarios').select('password').eq('cedula', cedula).single();
                
                if (vUser.password !== document.getElementById('perfil-clave-actual').value) {
                    window.Aplicacion.ocultarCarga();
                    return Swal.fire('Error', 'La clave actual es incorrecta.', 'error');
                }
            }

            // PAYLOAD DEFINITIVO (Sin columnas fantasma)
            let payload = {
                nombre_completo: nombreVal,
                email: emailVal,
                telefono: telfVal
            };

            if (updClave) {
                payload.password = document.getElementById('perfil-clave-nueva').value;
                payload.primer_ingreso = false;
            }

            if (updPreg) {
                payload.preguntas_seguridad = JSON.stringify({
                    pregunta_1: document.getElementById('perfil-preg1').value,
                    respuesta_1: document.getElementById('perfil-resp1').value.trim().toLowerCase(),
                    pregunta_2: document.getElementById('perfil-preg2').value,
                    respuesta_2: document.getElementById('perfil-resp2').value.trim().toLowerCase()
                });
            }

            const { error: updErr } = await window.supabaseDB
                .from('usuarios')
                .update(payload)
                .eq('cedula', cedula);

            window.Aplicacion.ocultarCarga();

            if (updErr) throw updErr;

            // Actualizar sesión local
            window.Aplicacion.usuario.nombre = nombreVal;
            localStorage.setItem('sigae_usuario', JSON.stringify(window.Aplicacion.usuario));

            Swal.fire('¡Éxito!', 'Perfil actualizado correctamente.', 'success').then(() => {
                location.reload(); 
            });

        } catch (err) {
            window.Aplicacion.ocultarCarga();
            console.error("Fallo al guardar:", err);
            Swal.fire('Error de Servidor', `Detalle: ${err.message}`, 'error');
        }
    }
};

window.init_Mi_Perfil = function() { window.ModPerfil.init(); };