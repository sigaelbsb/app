import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ModulosSistema } from '../pages/CategoryDashboard';
import { usePermisos } from '../hooks/usePermisos';
import { supabase } from '../lib/supabase';
import { subscribeToWebPush } from '../lib/webPush';
import { ChatbotSigma } from './ChatbotSigma';
import { TourOrientacion } from './TourOrientacion';
import { NavigationLoader } from './NavigationLoader';

export const Layout = ({ onLogout }: { onLogout: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tienePermiso, tieneAccesoEscuela, loading: permLoading } = usePermisos();
  const usuarioStr = localStorage.getItem('usuario_sigae');
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : { nombre: 'Usuario', rol: 'Rol' };
  const escuelaCodigo = localStorage.getItem('sigae_escuela_codigo') || 'sb';
  const escuelaNombre = escuelaCodigo === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
  const logoPath = `/assets/img/logo_${escuelaCodigo}.png`;

  const [anioEscolar, setAnioEscolar] = useState<string>('Cargando...');
  const [lapsoEscolar, setLapsoEscolar] = useState<string>('Cargando...');
  const [isStandalone, setIsStandalone] = useState(false);
  
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
  }, []);
  
  // Lógica de Notificaciones
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [leidasIds, setLeidasIds] = useState<string[]>(() => {
    try {
      const items = localStorage.getItem('sigae_notif_leidas');
      return items ? JSON.parse(items) : [];
    } catch (e) {
      return [];
    }
  });
  const [mostrarNotifDropdown, setMostrarNotifDropdown] = useState(false);

  useEffect(() => {
    localStorage.setItem('sigae_notif_leidas', JSON.stringify(leidasIds));
    const unreadCount = notificaciones.filter(n => !n.leido).length;
    if ('setAppBadge' in navigator) {
      if (unreadCount > 0) {
        navigator.setAppBadge(unreadCount).catch(() => {});
      } else {
        navigator.clearAppBadge().catch(() => {});
      }
    }
  }, [leidasIds, notificaciones]);

  const cargarConfigGlobal = async () => {
    try {
      const [perRes, lapRes] = await Promise.all([
        supabase.from('conf_periodos').select('*'),
        supabase.from('conf_lapsos').select('*')
      ]);

      const hoy = new Date().getTime();
      const encontrarActivo = (lista: any[]) => {
        if (!lista || lista.length === 0) return null;
        const activo = lista.find(item => {
          if (item.fecha_inicio && item.fecha_fin) {
            const pIn = new Date(item.fecha_inicio + "T00:00:00").getTime();
            const pOut = new Date(item.fecha_fin + "T23:59:59").getTime();
            return hoy >= pIn && hoy <= pOut;
          }
          return false;
        });
        return activo ? activo.valor : null;
      };

      const activeAnio = encontrarActivo(perRes.data || []) || 'No definido';
      const activeLapso = encontrarActivo(lapRes.data || []) || 'Fuera de Fase / Vacaciones';

      setAnioEscolar(activeAnio);
      setLapsoEscolar(activeLapso);
    } catch (err) {
      console.error("Error cargando configuración global en barra superior:", err);
      setAnioEscolar('Error');
      setLapsoEscolar('Error');
    }
  };

  const verificarMantenimiento = async () => {
    const usrStr = localStorage.getItem('usuario_sigae');
    if (!usrStr) return;
    
    let usr: any;
    try {
      usr = JSON.parse(usrStr);
    } catch (e) {
      return;
    }

    try {
      const activeSchool = (usr.id_escuela || localStorage.getItem('sigae_escuela_codigo') || 'sb') as 'sb' | 'lb';
      const schoolNombre = activeSchool === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar';

      const { data: ajustes } = await supabase
        .from('ajustes_globales')
        .select('clave, valor')
        .in('clave', ['mantenimiento_sb', 'mantenimiento_lb', 'mantenimiento_activo']);

      const maintKey = activeSchool === 'sb' ? 'mantenimiento_sb' : 'mantenimiento_lb';
      const schoolMaint = ajustes?.find(x => x.clave === maintKey);
      const globalMaint = ajustes?.find(x => x.clave === 'mantenimiento_activo');
      const isSchoolInMaint = schoolMaint ? (schoolMaint.valor === 'true') : (globalMaint?.valor === 'true');

      if (isSchoolInMaint) {
        let hasAccess = false;
        if (usr.rol === 'SuperAdmin') {
          hasAccess = true;
        } else {
          const { data: roleData } = await supabase
            .from('roles')
            .select('permisos')
            .eq('nombre', usr.rol)
            .maybeSingle();

          if (roleData && roleData.permisos) {
            const parsed = typeof roleData.permisos === 'string' ? JSON.parse(roleData.permisos) : roleData.permisos;
            const escPerms = parsed[activeSchool] || {};
            if (escPerms["Ingresar en Mantenimiento"]?.ver === true) {
              hasAccess = true;
            }
          }
        }

        if (!hasAccess) {
          const disconnectUser = () => {
            localStorage.removeItem('sesion_sigae');
            localStorage.removeItem('usuario_sigae');
            onLogout();
            navigate('/login');
          };

          const Swal = (window as any).Swal;
          if (Swal) {
            Swal.fire({
              title: 'Institución en Mantenimiento',
              text: `La institución ${schoolNombre} ha entrado en modo mantenimiento (acceso restringido solo a administradores y personal autorizado). Tu sesión ha sido finalizada.`,
              icon: 'warning',
              confirmButtonColor: '#FF8D00',
              confirmButtonText: 'Entendido',
              allowOutsideClick: false,
              allowEscapeKey: false
            }).then(() => {
              disconnectUser();
            });
          } else {
            alert(`La institución ${schoolNombre} ha entrado en modo mantenimiento. Tu sesión ha sido finalizada.`);
            disconnectUser();
          }
        }
      }
    } catch (e) {
      console.error("Error al comprobar mantenimiento activo:", e);
    }
  };

  useEffect(() => {
    cargarConfigGlobal();
    verificarMantenimiento();

    // Listen for custom events when config changes in ConfiguracionSistema
    const handleConfigChange = () => {
      cargarConfigGlobal();
    };

    const handleMaintenanceChange = () => {
      verificarMantenimiento();
    };

    const intervalMaint = setInterval(verificarMantenimiento, 20000);

    window.addEventListener('sigae-config-changed', handleConfigChange);
    window.addEventListener('sigae-maintenance-changed', handleMaintenanceChange);

    return () => {
      clearInterval(intervalMaint);
      window.removeEventListener('sigae-config-changed', handleConfigChange);
      window.removeEventListener('sigae-maintenance-changed', handleMaintenanceChange);
    };
  }, [location.pathname]);

  // Efecto persistente de notificaciones (solo al montar/desmontar la app)
  useEffect(() => {
    // Auto-suscribir a Web Push si ya tiene permisos concedidos
    subscribeToWebPush();

    const usrStr = localStorage.getItem('usuario_sigae');
    if (usrStr) {
      try {
        const usr = JSON.parse(usrStr);
        const esc = usr.id_escuela || 'sb';
        
        const cargarHistorial = async () => {
          try {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            
            let query = supabase
              .from('notificaciones_globales')
              .select('*')
              .gte('creado_en', hoy.toISOString())
              .order('creado_en', { ascending: false });

            if (usr.rol !== 'SuperAdmin') {
              query = query.or(`escuela_codigo.eq.${esc},escuela_codigo.eq.todas,escuela_codigo.is.null`);
            }

            const { data, error } = await query;
            if (error) throw error;
            let list: any[] = [];
            const esAdminODirectivo = ['SuperAdmin', 'Director', 'Directora', 'Administrador', 'Subdirector', 'Coordinador'].includes(usr.rol || '');

            if (data) {
              list = data
                .filter((d: any) => {
                  const esSeg = d.tipo === 'seguridad' || d.tipo === 'alerta' || (d.titulo && d.titulo.toLowerCase().includes('reseteo'));
                  // Si es notificación de seguridad o reseteo, SOLO mostrar a administradores y directivos
                  if (esSeg && !esAdminODirectivo) return false;
                  return true;
                })
                .map((d: any) => ({
                  id: String(d.id),
                  titulo: d.titulo,
                  cuerpo: d.cuerpo,
                  fecha: d.creado_en,
                  tipo: d.tipo || 'transporte',
                  leido: leidasIds.includes(String(d.id))
                }));
            }

            // Si es un rol directivo o administrativo, verificar solicitudes de reseteo pendientes
            if (esAdminODirectivo) {
              try {
                const { data: resets } = await supabase
                  .from('usuarios')
                  .select('cedula, nombre_completo, id_escuela, updated_at')
                  .eq('solicito_reseteo', true);

                if (resets && resets.length > 0) {
                  const filtered = resets.filter((r: any) => usr.rol === 'SuperAdmin' || !r.id_escuela || r.id_escuela === 'ambas' || r.id_escuela === esc);
                  const resetNotifs = filtered.map((r: any) => ({
                    id: 'reset-' + r.cedula,
                    titulo: '⚠️ Solicitud de Reseteo: ' + (r.nombre_completo || r.cedula),
                    cuerpo: `El usuario con C.I. ${r.cedula} tiene una solicitud de reseteo pendiente en Gestión de Usuarios.`,
                    fecha: r.updated_at || new Date().toISOString(),
                    tipo: 'seguridad',
                    leido: leidasIds.includes('reset-' + r.cedula)
                  }));
                  const existingIds = new Set(list.map(n => n.id));
                  const nuevos = resetNotifs.filter(rn => !existingIds.has(rn.id));
                  list = [...nuevos, ...list];
                }
              } catch (e) {}
            }

            setNotificaciones(list);
          } catch (err) {
            console.error("Error al cargar historial de notificaciones:", err);
          }
        };
        cargarHistorial();
      } catch (e) {}
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#campana-notificaciones')) {
        setMostrarNotifDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const escCodigo = localStorage.getItem('sigae_escuela_codigo') || 'sb';
    
    // Solicitar permiso de notificaciones push nativas
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const playBusChime = (tipo = 'parada') => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (tipo === 'parada') {
          const osc1 = audioCtx.createOscillator();
          const gain1 = audioCtx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
          gain1.gain.setValueAtTime(0.12, audioCtx.currentTime);
          gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
          osc1.connect(gain1);
          gain1.connect(audioCtx.destination);
          osc1.start();
          osc1.stop(audioCtx.currentTime + 0.5);

          setTimeout(() => {
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
            gain2.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.start();
            osc2.stop(audioCtx.currentTime + 0.6);
          }, 150);
        } else {
          // Tono de llegada a destino
          [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
            setTimeout(() => {
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
              gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.4);
            }, idx * 120);
          });
        }
      } catch (e) {}
    };

    const playAlertSound = () => {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        [600, 800, 600, 800].forEach((freq, idx) => {
          setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.2);
          }, idx * 120);
        });
      } catch (e) {}
    };

    const sendSystemNotification = (title: string, body: string, iconType = 'bus-parada') => {
      if ('Notification' in window && Notification.permission === 'granted') {
        const iconMap: Record<string, string> = {
          'bus-parada': '/assets/img/bus_parada.png',
          'bus-tramo': '/assets/img/bus_tramo.png',
          'bus-llegada': '/assets/img/bus_llegada.png',
          'seguridad': '/assets/img/sigae.png'
        };
        try {
          new Notification(title, {
            body: body,
            icon: iconMap[iconType] || '/assets/img/sigae.png',
            badge: '/assets/img/sigae.png'
          });
        } catch (e) {}
      }
    };

    const channel = supabase.channel('global_notifications_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notificaciones_globales' }, async (payload: any) => {
        if (payload.eventType === 'INSERT') {
          const row = payload.new;
          if (!row) return;

          const isSuperAdmin = usuario?.rol === 'SuperAdmin';
          if (!isSuperAdmin && row.escuela_codigo && row.escuela_codigo !== 'todas' && row.escuela_codigo !== escCodigo) return;

          const isSeguridad = row.tipo === 'seguridad' || row.tipo === 'alerta' || (row.titulo && row.titulo.toLowerCase().includes('reseteo'));
          const esAdminODirectivo = ['SuperAdmin', 'Director', 'Directora', 'Administrador', 'Subdirector', 'Coordinador'].includes(usuario?.rol || '');

          // SEGURIDAD ESTRICTA: Las notificaciones de reseteo/seguridad son EXCLUSIVAS de administradores y directivos
          if (isSeguridad && !esAdminODirectivo) {
            return;
          }

          const isEnd = (row.titulo || '').toLowerCase().includes('finalizada') || (row.titulo || '').toLowerCase().includes('destino') || (row.titulo || '').toLowerCase().includes('alcanzado');
          
          if (isSeguridad) {
            playAlertSound();
            const Swal = (window as any).Swal;
            if (Swal) {
              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'warning',
                title: row.titulo,
                text: row.cuerpo,
                showConfirmButton: true,
                confirmButtonText: 'Ir a Usuarios',
                showCancelButton: true,
                cancelButtonText: 'Cerrar',
                timer: 10000,
                timerProgressBar: true
              }).then((result: any) => {
                if (result.isConfirmed) {
                  navigate('/categoria/Seguridad y Accesos/Gestión de Usuarios');
                }
              });
            }
          } else {
            playBusChime(isEnd ? 'llegada' : 'parada');
          }

          sendSystemNotification(row.titulo, row.cuerpo, isSeguridad ? 'seguridad' : 'bus-parada');

          setNotificaciones(prev => {
            if (prev.some(n => n.id === String(row.id))) return prev;
            const newNotif = {
              id: String(row.id),
              titulo: row.titulo,
              cuerpo: row.cuerpo,
              leido: leidasIds.includes(String(row.id)),
              fecha: row.creado_en || new Date().toISOString(),
              tipo: row.tipo || (isSeguridad ? 'seguridad' : 'transporte')
            };
            return [newNotif, ...prev].slice(0, 30);
          });
        } else if (payload.eventType === 'DELETE') {
          const row = payload.old;
          if (!row) return;
          setNotificaciones(prev => prev.filter(n => n.id !== String(row.id)));
        }
      })
      .subscribe();

    // Canal en tiempo real para cambios en usuarios (solicitud de reseteo directa)
    const userChannel = supabase.channel('usuarios_reseteo_listener')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, (payload: any) => {
        const u = payload.new;
        if (u && u.solicito_reseteo === true) {
          const rol = usuario?.rol || '';
          const esDirectivo = ['SuperAdmin', 'Director', 'Directora', 'Administrador', 'Subdirector', 'Coordinador'].includes(rol);
          if (!esDirectivo) return;

          // Aislamiento por escuela: solo alertar si coincide con la escuela activa o es SuperAdmin
          const isSuperAdmin = rol === 'SuperAdmin';
          if (!isSuperAdmin && u.id_escuela && u.id_escuela !== 'ambas' && u.id_escuela !== escCodigo) {
            return;
          }
            playAlertSound();
            const Swal = (window as any).Swal;
            if (Swal) {
              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'warning',
                title: '⚠️ Solicitud de Reseteo de Cuenta',
                text: `El usuario ${u.nombre_completo || u.cedula} (${u.cedula}) solicita reseteo de cuenta.`,
                showConfirmButton: true,
                confirmButtonText: 'Ir a Gestión de Usuarios',
                showCancelButton: true,
                cancelButtonText: 'Cerrar',
                timer: 10000,
                timerProgressBar: true
              }).then((result: any) => {
                if (result.isConfirmed) {
                  navigate('/categoria/Seguridad y Accesos/Gestión de Usuarios');
                }
              });
            }

            const notifId = 'reset-' + u.cedula;
            setNotificaciones(prev => {
              if (prev.some(n => n.id === notifId)) return prev;
              return [{
                id: notifId,
                titulo: '⚠️ Solicitud de Reseteo: ' + (u.nombre_completo || u.cedula),
                cuerpo: `El usuario con C.I. ${u.cedula} ha solicitado restablecer su cuenta.`,
                leido: false,
                fecha: new Date().toISOString(),
                tipo: 'seguridad'
              }, ...prev].slice(0, 30);
            });
          }
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
      supabase.removeChannel(userChannel);
    };
  }, [leidasIds, usuario?.rol]);

  const handleBloquearSesion = () => {
    localStorage.setItem('sesion_sigae', 'bloqueada');
    onLogout();
    navigate('/login');
  };

  const esModoEmulacion = !!(usuario?.es_emulacion || localStorage.getItem('sigae_usuario_original_admin'));

  const handleLogout = () => {
    const Swal = (window as any).Swal;

    // Flujo especial si está en Modo Emulación
    if (esModoEmulacion) {
      if (Swal) {
        Swal.fire({
          title: `<div class="d-flex align-items-center justify-content-center gap-2"><i class="bi bi-person-bounding-box text-warning"></i> <span>Cierre de Sesión (Emulación)</span></div>`,
          html: `
            <p class="text-muted small mb-3">
              Actualmente te encuentras emulando el rol <strong>${usuario.rol}</strong>.
            </p>
            <p class="fw-semibold text-dark small mb-0">¿Cómo deseas proceder?</p>
          `,
          icon: 'question',
          showDenyButton: true,
          showCancelButton: true,
          confirmButtonText: '<i class="bi bi-arrow-counterclockwise me-1"></i> Restaurar mi Administrador',
          denyButtonText: '<i class="bi bi-door-open me-1"></i> Simular Cierre Real (Ir a Login)',
          cancelButtonText: 'Seguir en Emulación',
          confirmButtonColor: '#0ea5e9',
          denyButtonColor: '#dc3545',
          cancelButtonColor: '#6c757d'
        }).then((result: any) => {
          if (result.isConfirmed) {
            handleSalirEmulacion();
          } else if (result.isDenied) {
            // Simular cierre de sesión real hacia el login
            localStorage.removeItem('sesion_sigae');
            localStorage.removeItem('usuario_sigae');
            sessionStorage.removeItem('sigae_emulacion_activa');
            onLogout();
            navigate('/login');
          }
        });
        return;
      }
    }

    if (Swal) {
      Swal.fire({
        title: 'Cierre de Sesión',
        text: '¿Cómo deseas salir del sistema?',
        icon: 'question',
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: '<i class="bi bi-moon-stars-fill me-1"></i> Hibernar (Huella / PIN)',
        denyButtonText: '<i class="bi bi-power me-1"></i> Cerrar Sesión',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0066FF',
        denyButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d'
      }).then((result: any) => {
        if (result.isConfirmed) {
          // Hibernar: mantener usuario en localstorage para reingreso rápido
          handleBloquearSesion();
        } else if (result.isDenied) {
          // Cerrar sesión por completo: limpiar todo
          localStorage.removeItem('sesion_sigae');
          localStorage.removeItem('usuario_sigae');
          localStorage.removeItem('sigae_escuela_codigo');
          localStorage.removeItem('sigae_escuela_activa');
          onLogout();
          navigate('/login');
        }
      });
    } else {
      const hibernar = window.confirm("¿Deseas hibernar la sesión para reingresar con huella/PIN? (Cancelar cierra la sesión por completo)");
      if (hibernar) {
        handleBloquearSesion();
      } else {
        localStorage.removeItem('sesion_sigae');
        localStorage.removeItem('usuario_sigae');
        localStorage.removeItem('sigae_escuela_codigo');
        localStorage.removeItem('sigae_escuela_activa');
        onLogout();
        navigate('/login');
      }
    }
  };

  const handleSalirEmulacion = () => {
    const isUserEmulation = usuario?.tipo_emulacion === 'usuario';
    const originalStr = localStorage.getItem('sigae_usuario_original_admin');
    if (originalStr) {
      try {
        const originalUser = JSON.parse(originalStr);
        localStorage.setItem('usuario_sigae', JSON.stringify(originalUser));
        if (originalUser.id_escuela && originalUser.id_escuela !== 'ambas' && originalUser.id_escuela !== 'todas') {
          localStorage.setItem('sigae_escuela_codigo', originalUser.id_escuela);
          localStorage.setItem('sigae_escuela_activa', originalUser.id_escuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
        }
      } catch (e) {}
    }
    localStorage.removeItem('sigae_usuario_original_admin');
    sessionStorage.removeItem('sigae_emulacion_activa');
    localStorage.removeItem('sigae_cache_permisos');
    localStorage.removeItem('sigae_cache_full_permisos');
    if (isUserEmulation) {
      window.location.href = '/categoria/Seguridad%20y%20Accesos/Gestión%20de%20Usuarios';
    } else {
      window.location.href = '/categoria/Seguridad%20y%20Accesos/Roles%20y%20Privilegios';
    }
  };

  // Inactivity tracking (30 minutes with mobile visibility & file picker awareness)
  useEffect(() => {
    const TIEMPO_INACTIVIDAD = 30 * 60 * 1000; // 30 minutos
    const TIEMPO_ADVERTENCIA = 60 * 1000; // 60 segundos de advertencia
    
    let lastActivityTime = Date.now();
    let isWarningActive = false;
    let checkInterval: any;

    const actualizarActividad = () => {
      if (!isWarningActive) {
        lastActivityTime = Date.now();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Al regresar a la pestaña (por ejemplo, después de buscar fotos en la galería o cámara), refrescar actividad
        actualizarActividad();
      }
    };

    const handleResetInactivity = () => {
      isWarningActive = false;
      lastActivityTime = Date.now();
    };

    const checkInactividad = () => {
      if (isWarningActive) return;
      // No disparar alerta si el usuario tiene la pestaña en segundo plano (p. ej. eligiendo archivos en galería)
      if (document.visibilityState === 'hidden') return;

      const timeSinceLastActivity = Date.now() - lastActivityTime;
      
      if (timeSinceLastActivity >= TIEMPO_INACTIVIDAD - TIEMPO_ADVERTENCIA) {
        isWarningActive = true;
        mostrarAdvertencia();
      }
    };

    const mostrarAdvertencia = () => {
      const Swal = (window as any).Swal;
      let contador = 60;
      let intervalContador: any;

      if (Swal) {
        Swal.fire({
          title: '¿Sigues ahí?',
          html: 'Tu sesión se bloqueará por inactividad en <b>60</b> segundos.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, mantener activa',
          cancelButtonText: 'Bloquear ahora',
          confirmButtonColor: '#0066FF',
          cancelButtonColor: '#dc3545',
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            const b = Swal.getHtmlContainer()?.querySelector('b');
            intervalContador = setInterval(() => {
              // Si la pestaña está oculta, pausar el conteo
              if (document.visibilityState === 'hidden') return;
              contador--;
              if (b) b.textContent = String(contador);
              if (contador <= 0) {
                clearInterval(intervalContador);
                Swal.clickCancel();
              }
            }, 1000);
          },
          willClose: () => {
            if (intervalContador) clearInterval(intervalContador);
          }
        }).then((result: any) => {
          if (result.isConfirmed) {
            isWarningActive = false;
            lastActivityTime = Date.now();
          } else {
            handleBloquearSesion();
          }
        });
      } else {
        const mantener = window.confirm("Tu sesión está inactiva. ¿Deseas mantenerte activo?");
        if (mantener) {
          isWarningActive = false;
          lastActivityTime = Date.now();
        } else {
          handleBloquearSesion();
        }
      }
    };

    const eventos = ['mousedown', 'mousemove', 'keypress', 'keydown', 'scroll', 'touchstart', 'touchend', 'input', 'change', 'focus'];
    eventos.forEach(evt => window.addEventListener(evt, actualizarActividad));
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('reset-inactivity-timer', handleResetInactivity);

    // Check inactividad cada 10 segundos
    checkInterval = setInterval(checkInactividad, 10000);

    return () => {
      clearInterval(checkInterval);
      eventos.forEach(evt => window.removeEventListener(evt, actualizarActividad));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('reset-inactivity-timer', handleResetInactivity);
    };
  }, [navigate, onLogout]);

  const toggleSidebar = () => {
    document.body.classList.toggle('menu-colapsado');
  };

  const toggleMobileSidebar = () => {
    document.body.classList.toggle('menu-abierto');
  };



  // Close mobile sidebar on route change
  useEffect(() => {
    document.body.classList.remove('menu-abierto');
  }, [location.pathname]);

  const activeCategory = location.pathname === '/' 
    ? 'Inicio' 
    : location.pathname.startsWith('/categoria/')
      ? decodeURIComponent(location.pathname.replace('/categoria/', '')).split('/')[0]
      : '';

  return (
    <div id="vista-app" className="vista-app-estilo">
      <aside id="menu-lateral" className="glass-sidebar shadow-lg">
        <div className="sidebar-header d-flex align-items-center justify-content-between">
          <div id="btn-logo-nav" onClick={() => navigate('/')} className="d-flex align-items-center cursor-pointer">
            <img 
              src={logoPath} 
              width="40" 
              className="me-2 logo-img" 
              alt="Logo SIGAE" 
              onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
            />
            <span className="fw-bold text-dark sidebar-texto">SIGAE {escuelaNombre.replace('UE ', '')}</span>
          </div>
          <div className="d-flex align-items-center ms-auto gap-2">
            <button 
              id="btn-colapsar-menu" 
              onClick={toggleSidebar} 
              className="btn-colapsar d-none d-lg-block position-relative" 
              title="Contraer/Expandir Menú Lateral"
            >
              <i className="bi bi-list"></i>
            </button>
          </div>
        </div>
        
        <div id="contenedor-enlaces" className="sidebar-menu pb-5">
          {/* PANEL PRINCIPAL / INICIO */}
          <div className="px-4 mb-3">
            <button 
              onClick={() => navigate('/')} 
              id="btn-menu-Inicio" 
              className={`btn-moderno w-100 btn-inicio-sidebar text-start ${activeCategory === 'Inicio' ? 'btn-primario' : 'btn-secundario'}`} 
              style={{ 
                padding: '12px', 
                display: 'flex', 
                alignItems: 'center',
                background: activeCategory === 'Inicio' ? 'var(--color-primario)' : 'transparent',
                color: activeCategory === 'Inicio' ? 'white' : 'var(--color-primario)',
                border: activeCategory === 'Inicio' ? 'none' : '2px solid var(--color-primario)',
                boxShadow: activeCategory === 'Inicio' ? 'var(--sombra-neon)' : 'none'
              }}
            >
              <i className="bi bi-house-door-fill me-3 fs-5"></i>
              <span className="texto-menu-ocultable fw-bold">Panel Principal</span>
            </button>
          </div>

          {/* CATEGORIAS DINAMICAS */}
          <div className="px-3">
            <div className="small text-muted fw-bold mb-2 px-3 texto-menu-ocultable" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>
              MÓDULOS DEL SISTEMA
            </div>
            
            {Object.entries(ModulosSistema).map(([nombreCategoria, datosModulo]) => {
              // Mientras cargan permisos, no mostrar nada (evita flash de módulos sin filtrar)
              if (permLoading) return null;
              if (!datosModulo.items.some((item: any) => tienePermiso(item.vista, 'ver'))) {
                return null;
              }
              const isActive = activeCategory === nombreCategoria;
              return (
                <a 
                  key={nombreCategoria}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/categoria/${encodeURIComponent(nombreCategoria)}`);
                  }}
                  id={`btn-menu-${nombreCategoria.replace(/[\s/()]/g, '-')}`}
                  className={`menu-item d-flex align-items-center mb-1 rounded-3 ${isActive ? 'activo' : ''}`}
                  style={{ 
                    padding: '12px 20px', 
                    textDecoration: 'none',
                    background: isActive ? 'rgba(0, 102, 255, 0.08)' : 'transparent',
                    borderLeft: isActive ? '4px solid var(--color-primario)' : '4px solid transparent'
                  }}
                >
                  <i className={`bi ${datosModulo.icono} me-3 fs-5`} style={{ color: datosModulo.color }}></i>
                  <span className="texto-menu-ocultable">{nombreCategoria}</span>
                </a>
              );
            })}
          </div>
        </div>
      </aside>

      <main id="contenido-principal" className="d-flex flex-column min-vh-100">
        {/* BANNER FLOTANTE DE MODO EMULACIÓN */}
        {esModoEmulacion && (
          <div 
            className="w-100 px-3 px-md-4 py-2 text-white shadow d-flex align-items-center justify-content-between flex-wrap gap-2 animate__animated animate__fadeInDown"
            style={{ 
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              position: 'sticky',
              top: 0,
              zIndex: 1060,
              borderBottom: '2px solid rgba(255,255,255,0.2)'
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-dark text-warning p-2 rounded-circle shadow-sm">
                <i className="bi bi-person-bounding-box fs-6"></i>
              </span>
              <div>
                <span className="fw-bold text-white small me-2" style={{ letterSpacing: '0.5px' }}>
                  MODO EMULACIÓN ACTIVO:
                </span>
                <span className="badge bg-white text-dark fw-bold px-2.5 py-1 me-1 shadow-sm">
                  <i className="bi bi-person-badge-fill text-warning me-1"></i>
                  {usuario?.tipo_emulacion === 'usuario' 
                    ? `Visualizando como: ${usuario.nombre || usuario.nombre_completo} (${usuario.rol})`
                    : `Visualizando como: ${usuario.rol}`
                  }
                </span>
                <span className="badge bg-dark bg-opacity-25 text-white fw-semibold px-2 py-1">
                  <i className="bi bi-building me-1"></i>
                  {escuelaNombre}
                </span>
                <span className="d-none d-lg-inline ms-2 text-white-50 small">
                  (Sesión real de administrador segura)
                </span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleSalirEmulacion}
                className="btn btn-sm btn-dark rounded-pill px-3 py-1.5 fw-bold shadow-sm d-flex align-items-center gap-2 hover-efecto"
                style={{ border: '1px solid rgba(255,255,255,0.3)' }}
              >
                <i className="bi bi-box-arrow-left text-warning"></i>
                <span>Salir de Emulación y Restaurar Administrador</span>
              </button>
            </div>
          </div>
        )}

        <header className="glass-header shadow-sm d-flex align-items-center px-4 bg-white auth-header">
          <div className="d-flex align-items-center d-lg-none me-3">
            <button id="btn-menu-movil" onClick={toggleMobileSidebar} className="btn-movil position-relative" title="Abrir Menú de Categorías">
              <i className="bi bi-list fs-2 text-primary"></i>
            </button>
          </div>
          <h5 id="titulo-pagina" className="mb-0 fw-bold text-dark d-none d-md-block">
            {activeCategory === 'Inicio' ? 'Panel Principal' : activeCategory}
          </h5>

          <div className="ms-auto d-flex align-items-center">
            <div className="d-none d-lg-flex flex-column align-items-end me-4 pe-4 border-end">
              <span className="fw-bold text-primary text-anio" id="global-anio-escolar">
                <i className="bi bi-calendar3 me-1"></i> Año Escolar: <span className="fw-bold">{anioEscolar}</span>
              </span>
              <span className="text-muted fw-bold text-lapso" id="global-lapso-escolar">
                <i className="bi bi-clock-history me-1"></i> Fase Actual: <span className={lapsoEscolar.includes('Fuera') || lapsoEscolar === 'Error' ? 'text-danger fw-bold' : (lapsoEscolar === 'Cargando...' ? 'text-muted' : 'text-success fw-bold')}>{lapsoEscolar}</span>
              </span>
            </div>

            {/* BOTON RAPIDO EMULAR ROL EN NAVBAR */}
            {!esModoEmulacion && (usuario.rol === 'SuperAdmin' || usuario.rol === 'Administrador' || tienePermiso('Función: Emulación de Roles', 'ver')) && (
              <button 
                type="button" 
                onClick={() => navigate('/categoria/Seguridad%20y%20Accesos/Roles%20y%20Privilegios')}
                className="btn btn-sm rounded-pill px-3 fw-bold me-3 d-none d-md-inline-flex align-items-center gap-1.5 shadow-sm text-dark hover-efecto"
                style={{ backgroundColor: '#fef3c7', borderColor: '#fde68a' }}
                title="Probar y Emular Roles del Sistema"
              >
                <i className="bi bi-person-bounding-box text-warning fs-6"></i>
                <span>Emular Rol</span>
              </button>
            )}

            {!isStandalone && (
              <button 
                type="button" 
                onClick={() => window.dispatchEvent(new Event('show-pwa-modal'))}
                className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold me-3 d-none d-sm-inline-flex align-items-center gap-1 shadow-sm hover-efecto"
                title="Instalar Aplicación en tu dispositivo"
              >
                <i className="bi bi-download"></i>
                <span>Instalar App</span>
              </button>
            )}

            <div className="position-relative me-3 cursor-pointer" id="btn-dark-mode">
              <i className="bi bi-moon-stars-fill fs-4 text-secondary hover-efecto" id="icono-tema"></i>
            </div>

            <div 
              className="position-relative me-3 me-md-4" 
              id="campana-notificaciones"
              style={{ display: 'inline-block' }}
            >
              <div 
                onClick={() => setMostrarNotifDropdown(!mostrarNotifDropdown)} 
                className="cursor-pointer position-relative d-flex align-items-center"
              >
                <i className="bi bi-bell-fill fs-4 text-secondary hover-efecto" id="icono-campana"></i>
                {notificaciones.filter(n => !n.leido).length > 0 && (
                  <span 
                    className="position-absolute translate-middle badge rounded-pill bg-danger" 
                    style={{
                      top: '4px',
                      right: '-8px',
                      fontSize: '0.65rem',
                      padding: '4px 6px',
                      boxShadow: '0 0 0 2px white',
                      animation: 'pulse-badge 1.5s infinite'
                    }}
                  >
                    {notificaciones.filter(n => !n.leido).length}
                  </span>
                )}
              </div>

              {mostrarNotifDropdown && (
                <div 
                  className="dropdown-menu show dropdown-menu-end shadow-lg border-0 rounded-3 p-0"
                  style={{
                    position: 'absolute',
                    top: '38px',
                    right: 0,
                    width: '320px',
                    maxHeight: '400px',
                    zIndex: 1050,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'fadeInUp 0.2s ease-out'
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light rounded-top">
                    <span className="fw-bold text-dark mb-0 small">Notificaciones</span>
                    {notificaciones.length > 0 && (
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-link btn-sm p-0 text-primary fw-semibold small text-decoration-none"
                          onClick={() => {
                            setNotificaciones(prev => {
                              const updated = prev.map(n => ({ ...n, leido: true }));
                              setLeidasIds(updated.map(n => String(n.id)));
                              return updated;
                            });
                          }}
                        >
                          Leer todo
                        </button>
                        <span className="text-muted">|</span>
                        <button 
                          className="btn btn-link btn-sm p-0 text-danger fw-semibold small text-decoration-none"
                          onClick={() => {
                            setNotificaciones([]);
                            setLeidasIds([]);
                          }}
                        >
                          Limpiar
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="overflow-auto" style={{ maxHeight: '320px', flexGrow: 1 }}>
                    {notificaciones.length === 0 ? (
                      <div className="text-center py-4 text-muted small">
                        <i className="bi bi-bell-slash fs-3 d-block mb-2 text-secondary"></i>
                        No tienes notificaciones
                      </div>
                    ) : (
                      notificaciones.map((notif) => {
                        const isSeguridad = notif.tipo === 'seguridad' || notif.tipo === 'alerta' || (notif.titulo || '').toLowerCase().includes('reseteo');
                        return (
                        <div 
                          key={notif.id}
                          onClick={() => {
                            setNotificaciones(prev => prev.map(n => n.id === notif.id ? { ...n, leido: true } : n));
                            setLeidasIds(prevLeidas => {
                              const stringId = String(notif.id);
                              if (!prevLeidas.includes(stringId)) {
                                return [...prevLeidas, stringId];
                              }
                              return prevLeidas;
                            });
                            if (isSeguridad) {
                              navigate('/categoria/Seguridad y Accesos/Gestión de Usuarios');
                              setMostrarNotifDropdown(false);
                            }
                          }}
                          className={`d-flex p-3 border-bottom cursor-pointer hover-bg-light transition-all ${!notif.leido ? 'bg-aliceblue' : ''}`}
                          style={{
                            backgroundColor: !notif.leido ? (isSeguridad ? '#fff1f2' : '#f0f7ff') : '#ffffff',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <div className="me-3">
                            <span 
                              className={`d-flex align-items-center justify-content-center rounded-circle`}
                              style={{
                                width: '32px',
                                height: '32px',
                                background: isSeguridad ? '#fef2f2' : notif.tipo === 'transporte' ? '#fffbeb' : '#eff6ff',
                                color: isSeguridad ? '#dc2626' : notif.tipo === 'transporte' ? '#d97706' : '#2563eb',
                                border: isSeguridad ? '1px solid #fecaca' : notif.tipo === 'transporte' ? '1px solid #fde68a' : '1px solid #bfdbfe'
                              }}
                            >
                              <i className={`bi ${isSeguridad ? 'bi-shield-exclamation' : notif.tipo === 'transporte' ? 'bi-bus-front' : 'bi-info-circle-fill'} small`}></i>
                            </span>
                          </div>
                          <div style={{ flexGrow: 1, minWidth: 0 }}>
                            <div className="d-flex justify-content-between align-items-start mb-1">
                              <span className={`fw-bold text-truncate small ${isSeguridad ? 'text-danger' : 'text-dark'}`} style={{ maxWidth: '160px' }}>
                                {notif.titulo}
                              </span>
                              <span className="text-muted style-date" style={{ fontSize: '0.65rem' }}>
                                {notif.fecha ? new Date(notif.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                            <p className="text-muted mb-0 small text-wrap-break" style={{ fontSize: '0.75rem', lineHeight: '1.25' }}>
                              {notif.cuerpo}
                            </p>
                          </div>
                        </div>
                      );})
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SELECTOR RAPIDO DE ESCUELA PARA ADMINISTRADORES/CON ACCESO DUAL */}
            {((usuario.rol === 'SuperAdmin' || ['Administrador', 'Director', 'Coordinador'].includes(usuario.rol) || usuario.id_escuela === 'ambas' || usuario.id_escuela === 'todas') && tieneAccesoEscuela('sb') && tieneAccesoEscuela('lb')) && (
              <div className="dropdown me-3 d-none d-sm-block">
                <button 
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold d-flex align-items-center gap-2 shadow-sm bg-white hover-efecto" 
                  type="button" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                  title="Cambiar Plantel Activo"
                >
                  <span className={`badge ${escuelaCodigo === 'sb' ? 'bg-success' : 'bg-primary'} rounded-circle p-1`}></span>
                  <span style={{ fontSize: '0.8rem' }}>{escuelaCodigo === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar'}</span>
                  <i className="bi bi-chevron-down small text-muted"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-4 p-2 mt-2" style={{ minWidth: '240px' }}>
                  <li>
                    <h6 className="dropdown-header small fw-bold text-muted text-uppercase d-flex align-items-center gap-2">
                      <i className="bi bi-buildings text-primary"></i> Cambiar Escuela Activa
                    </h6>
                  </li>
                  <li>
                    <button 
                      className={`dropdown-item rounded-3 py-2 d-flex align-items-center justify-content-between ${escuelaCodigo === 'sb' ? 'bg-success bg-opacity-10 text-success fw-bold' : ''}`}
                      onClick={() => {
                        if (escuelaCodigo !== 'sb') {
                          localStorage.setItem('sigae_escuela_codigo', 'sb');
                          localStorage.setItem('sigae_escuela_activa', 'UE Santa Bárbara');
                          try {
                            const u = JSON.parse(localStorage.getItem('usuario_sigae') || '{}');
                            u.id_escuela = 'sb';
                            u.nombre_escuela = 'UE Santa Bárbara';
                            localStorage.setItem('usuario_sigae', JSON.stringify(u));
                          } catch(e) {}
                          window.location.reload();
                        }
                      }}
                    >
                      <span className="d-flex align-items-center gap-2">
                        <i className="bi bi-building"></i> UE Santa Bárbara
                      </span>
                      {escuelaCodigo === 'sb' && <i className="bi bi-check-circle-fill"></i>}
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`dropdown-item rounded-3 py-2 d-flex align-items-center justify-content-between mt-1 ${escuelaCodigo === 'lb' ? 'bg-primary bg-opacity-10 text-primary fw-bold' : ''}`}
                      onClick={() => {
                        if (escuelaCodigo !== 'lb') {
                          localStorage.setItem('sigae_escuela_codigo', 'lb');
                          localStorage.setItem('sigae_escuela_activa', 'UE Libertador Bolívar');
                          try {
                            const u = JSON.parse(localStorage.getItem('usuario_sigae') || '{}');
                            u.id_escuela = 'lb';
                            u.nombre_escuela = 'UE Libertador Bolívar';
                            localStorage.setItem('usuario_sigae', JSON.stringify(u));
                          } catch(e) {}
                          window.location.reload();
                        }
                      }}
                    >
                      <span className="d-flex align-items-center gap-2">
                        <i className="bi bi-building"></i> UE Libertador Bolívar
                      </span>
                      {escuelaCodigo === 'lb' && <i className="bi bi-check-circle-fill"></i>}
                    </button>
                  </li>
                </ul>
              </div>
            )}

            <div className="usuario-info me-3 text-end d-none d-md-block">
              <div id="nombre-usuario-nav" className="fw-bold text-dark">{usuario.nombre}</div>
              <div id="rol-usuario-nav" className="small texto-gradiente fw-bold">{usuario.rol}</div>
            </div>
            
            <button onClick={handleLogout} id="btn-cerrar-sesion" className="btn-circulo btn-peligro shadow-sm">
              <i className="bi bi-power"></i>
            </button>
          </div>
        </header>

        <div id="area-dinamica" className="contenedor-dinamico p-4 p-md-5 flex-grow-1">
          <Outlet />
        </div>

        <footer className="w-100 d-flex flex-column align-items-center py-4 mt-auto border-top bg-light bg-opacity-50">
          <div className="d-flex justify-content-center align-items-center gap-4 mb-3">
            <img src="/assets/img/logoMPPE.png" alt="MPPE" className="footer-logo-mppe" height="40" />
            <img src="/assets/img/sigae.png" alt="Sistema Integral de Gestión y Administración Escolar" className="footer-logo-sigae" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <div className="fw-bold text-center mb-2 footer-anio">
            Escuelas DEP Oriente <span>{new Date().getFullYear()}</span> | <span className="text-primary">Versión 1.0</span>
          </div>
        </footer>
      </main>
      <NavigationLoader />
      <ChatbotSigma />
      <TourOrientacion />
    </div>
  );
};

