import { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ModulosSistema } from '../pages/CategoryDashboard';
import { usePermisos } from '../hooks/usePermisos';
import { supabase } from '../lib/supabase';
import { subscribeToWebPush } from '../lib/webPush';
import { ChatbotSigma } from './ChatbotSigma';
import { TourOrientacion } from './TourOrientacion';
import { NavigationLoader } from './NavigationLoader';
import { ModalAsignacionSorpresa } from './ModalAsignacionSorpresa';
import { MobileBottomNav } from './MobileBottomNav';

export const Layout = ({ onLogout }: { onLogout: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { tienePermiso, tieneAccesoEscuela, tienePermisoEnEscuela, loading: permLoading } = usePermisos();
  const usuarioStr = localStorage.getItem('usuario_sigae');
  const usuario = usuarioStr ? JSON.parse(usuarioStr) : { nombre: 'Usuario', rol: 'Rol' };
  const rolNorm = (usuario?.rol || '').toLowerCase();
  const esPersonalEscuela = !['representante', 'estudiante', 'visitante', 'invitado'].includes(rolNorm) && (
    rolNorm.includes('docente') ||
    rolNorm.includes('profesor') ||
    rolNorm.includes('maestr') ||
    rolNorm.includes('direct') ||
    rolNorm.includes('coordinad') ||
    rolNorm.includes('administra') ||
    rolNorm.includes('obrero') ||
    rolNorm.includes('especialista') ||
    rolNorm.includes('control') ||
    rolNorm.includes('secretar') ||
    rolNorm.includes('subdirector') ||
    usuario?.rol === 'SuperAdmin'
  );
  const escuelaCodigo = localStorage.getItem('sigae_escuela_codigo') || 'sb';
  const escuelaNombre = escuelaCodigo === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
  const logoPath = `/assets/img/logo_${escuelaCodigo}.png`;

  const [anioEscolar, setAnioEscolar] = useState<string>('Cargando...');
  const [lapsoEscolar, setLapsoEscolar] = useState<string>('Cargando...');
  
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
  const [mostrarUserDropdown, setMostrarUserDropdown] = useState(false);
  const [mostrarAsignacionManual, setMostrarAsignacionManual] = useState(false);
  const [mostrarSheetMovil, setMostrarSheetMovil] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [silenciarTransporte, setSilenciarTransporte] = useState<boolean>(() => {
    return localStorage.getItem('sigae_silenciar_transporte') === 'true';
  });
  const [filtroNotif, setFiltroNotif] = useState<'todas' | 'seguridad' | 'transporte'>('todas');
  const [misRutasRepresentante, setMisRutasRepresentante] = useState<string[]>([]);
  const misRutasRef = useRef<string[]>([]);
  misRutasRef.current = misRutasRepresentante;
  const [mantenimientoActivo, setMantenimientoActivo] = useState<boolean>(false);
  const [invitadosBloqueados, setInvitadosBloqueados] = useState<boolean>(false);

  const toggleSilenciarTransporte = () => {
    setSilenciarTransporte(prev => {
      const nextVal = !prev;
      localStorage.setItem('sigae_silenciar_transporte', String(nextVal));
      return nextVal;
    });
  };

  // Cargar las rutas asociadas a los representados si el usuario es Representante
  useEffect(() => {
    const fetchRutasRepresentante = async () => {
      const usrStr = localStorage.getItem('usuario_sigae');
      if (!usrStr) return;
      try {
        const u = JSON.parse(usrStr);
        if (!u.cedula) return;
        const { data: vincs } = await supabase
          .from('estudiantes_vinculaciones')
          .select('datos_actualizados')
          .eq('cedula_representante', u.cedula);

        if (vincs && vincs.length > 0) {
          const rutas: string[] = [];
          vincs.forEach((item: any) => {
            const r = item.datos_actualizados?.ruta_transporte;
            if (r && typeof r === 'string') {
              rutas.push(r.toLowerCase());
            }
          });
          setMisRutasRepresentante(rutas);
        }
      } catch (err) {
        console.warn('Error al cargar rutas del representante:', err);
      }
    };
    fetchRutasRepresentante();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('sigae-abrir-sigma-busqueda'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        .in('clave', [
          'mantenimiento_sb', 'mantenimiento_lb', 'mantenimiento_activo',
          'bloquear_invitados_sb', 'bloquear_invitados_lb', 'bloquear_invitados'
        ]);

      const maintKey = activeSchool === 'sb' ? 'mantenimiento_sb' : 'mantenimiento_lb';
      const schoolMaint = ajustes?.find(x => x.clave === maintKey);
      const globalMaint = ajustes?.find(x => x.clave === 'mantenimiento_activo');
      const isSchoolInMaint = schoolMaint ? (schoolMaint.valor === 'true') : (globalMaint?.valor === 'true');

      const guestKey = activeSchool === 'sb' ? 'bloquear_invitados_sb' : 'bloquear_invitados_lb';
      const guestSchool = ajustes?.find(x => x.clave === guestKey);
      const guestGlobal = ajustes?.find(x => x.clave === 'bloquear_invitados');
      const isGuestBlocked = guestSchool ? (guestSchool.valor === 'true') : (guestGlobal?.valor === 'true');

      setMantenimientoActivo(isSchoolInMaint);
      setInvitadosBloqueados(isGuestBlocked);

      // Si se está emulando un rol (incluido Invitado) o una cuenta de usuario, el sistema debe permitir
      // operar y navegar libremente sin desconexión ni bloqueos aunque la institución o el sistema estén
      // en mantenimiento o el rol de invitados esté inhabilitado por la dirección.
      const esEmulacion = !!(
        usr?.es_emulacion ||
        localStorage.getItem('sigae_usuario_original_admin') ||
        sessionStorage.getItem('sigae_emulacion_activa') === 'true'
      );

      if (esEmulacion) {
        // Acceso técnico concedido: la sesión emulada permanece activa
        return;
      }

      // Verificación en caliente para usuarios reales con rol 'Invitado' cuando está inhabilitado
      if (usr.rol === 'Invitado' && isGuestBlocked) {
        const disconnectUser = () => {
          localStorage.removeItem('sesion_sigae');
          localStorage.removeItem('usuario_sigae');
          onLogout();
          navigate('/login');
        };

        const Swal = (window as any).Swal;
        if (Swal) {
          Swal.fire({
            title: 'Acceso de Invitados Inhabilitado',
            text: `La institución ${schoolNombre} ha inhabilitado temporalmente el acceso para visitantes e invitados. Tu sesión ha sido finalizada.`,
            icon: 'warning',
            confirmButtonColor: '#FF8D00',
            confirmButtonText: 'Entendido',
            allowOutsideClick: false,
            allowEscapeKey: false
          }).then(() => {
            disconnectUser();
          });
        } else {
          alert(`La institución ${schoolNombre} ha inhabilitado temporalmente el acceso para visitantes e invitados.`);
          disconnectUser();
        }
        return;
      }

      if (isSchoolInMaint) {
        let hasAccess = false;
        if (usr.rol === 'SuperAdmin') {
          hasAccess = true;
        } else {
          const { data: roleData } = await supabase
            .from('roles')
            .select('permisos')
            .ilike('nombre', usr.rol)
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

            // Cargar rutas de representados para filtrado exacto si es Representante
            let misRutas: string[] = [];
            if (usr.rol === 'Representante' && usr.cedula) {
              try {
                const { data: vincs } = await supabase
                  .from('estudiantes_vinculaciones')
                  .select('datos_actualizados')
                  .eq('cedula_representante', usr.cedula);
                if (vincs && vincs.length > 0) {
                  vincs.forEach((item: any) => {
                    const r = item.datos_actualizados?.ruta_transporte;
                    if (r && typeof r === 'string') misRutas.push(r.toLowerCase());
                  });
                }
              } catch (e) {}
            }

            if (data) {
              list = data
                .filter((d: any) => {
                  // 1. Notificación personal para el usuario actual
                  if (d.tipo && d.tipo.startsWith('usuario:')) {
                    const targetCedula = d.tipo.replace('usuario:', '').trim().toLowerCase();
                    const myCedula = String(usr.cedula || '').trim().toLowerCase();
                    return targetCedula === myCedula;
                  }

                  // 2. Notificación de seguridad / reseteo general
                  const esSeg = d.tipo === 'seguridad' || d.tipo === 'alerta' || (d.titulo && d.titulo.toLowerCase().includes('reseteo'));
                  if (esSeg) {
                    return esAdminODirectivo;
                  }

                  // 3. Notificación de transporte
                  if (d.tipo === 'transporte') {
                    if (usr.rol === 'Representante') {
                      if (misRutas.length === 0) return false;
                      const textoNotif = ((d.titulo || '') + ' ' + (d.cuerpo || '')).toLowerCase();
                      return misRutas.some(ruta => {
                        const palabras = ruta.split(/[-–—]/).map((p: string) => p.trim()).filter(Boolean);
                        return palabras.some((p: string) => p.length > 3 && textoNotif.includes(p)) || textoNotif.includes(ruta);
                      });
                    }
                    return true;
                  }

                  return true;
                })
                .map((d: any) => ({
                  id: String(d.id),
                  titulo: d.titulo,
                  cuerpo: d.cuerpo,
                  fecha: d.creado_en,
                  tipo: (d.tipo && d.tipo.startsWith('usuario:')) ? 'personal' : (d.tipo || 'transporte'),
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

          const isPersonal = row.tipo && row.tipo.startsWith('usuario:');
          const miCedula = String(usuario?.cedula || '').trim().toLowerCase();

          // 1. Notificación personal dirigida a un usuario específico
          if (isPersonal) {
            const cedulaDestino = row.tipo.replace('usuario:', '').trim().toLowerCase();
            if (cedulaDestino !== miCedula) {
              return; // Notificación dirigida a otra persona, ignorar
            }
          }

          const isSeguridad = row.tipo === 'seguridad' || row.tipo === 'alerta' || (row.titulo && row.titulo.toLowerCase().includes('reseteo'));
          const esAdminODirectivo = ['SuperAdmin', 'Director', 'Directora', 'Administrador', 'Subdirector', 'Coordinador'].includes(usuario?.rol || '');

          if (!isPersonal) {
            // SEGURIDAD ESTRICTA: Las notificaciones generales de seguridad son EXCLUSIVAS de administradores y directivos
            if (isSeguridad && !esAdminODirectivo) {
              return;
            }

            // SEGMENTACIÓN DE TRANSPORTE PARA REPRESENTANTES:
            // El representante solo debe recibir la alerta si corresponde a la ruta de su representado
            if (row.tipo === 'transporte' && usuario?.rol === 'Representante') {
              const misRutas = misRutasRef.current;
              if (!misRutas || misRutas.length === 0) {
                return; // Si el representante no tiene rutas registradas, no recibe alertas de transporte
              }
              const textoAlerta = ((row.titulo || '') + ' ' + (row.cuerpo || '')).toLowerCase();
              const rutaCoincide = misRutas.some(r => r && textoAlerta.includes(r.toLowerCase()));
              if (!rutaCoincide) {
                return; // La ruta no pertenece a ninguno de sus representados
              }
            }
          }

          const isEnd = (row.titulo || '').toLowerCase().includes('finalizada') || (row.titulo || '').toLowerCase().includes('destino') || (row.titulo || '').toLowerCase().includes('alcanzado');
          const transporteSilenciado = localStorage.getItem('sigae_silenciar_transporte') === 'true';
          
          if (isPersonal) {
            playAlertSound();
            const Swal = (window as any).Swal;
            if (Swal) {
              Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: row.titulo,
                text: row.cuerpo,
                showConfirmButton: false,
                timer: 8000,
                timerProgressBar: true
              });
            }
            sendSystemNotification(row.titulo, row.cuerpo, 'info');
          } else if (isSeguridad) {
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
            sendSystemNotification(row.titulo, row.cuerpo, 'seguridad');
          } else if (row.tipo === 'transporte') {
            // El administrador o usuario puede silenciar alertas de rutas
            if (!transporteSilenciado) {
              playBusChime(isEnd ? 'llegada' : 'parada');
              sendSystemNotification(row.titulo, row.cuerpo, 'bus-parada');
            }
          } else {
            playAlertSound();
            sendSystemNotification(row.titulo, row.cuerpo, 'info');
          }

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
    const originalStr = localStorage.getItem('sigae_usuario_original_admin');
    if (originalStr) {
      try {
        const originalUser = JSON.parse(originalStr);
        localStorage.setItem('usuario_sigae', JSON.stringify(originalUser));
        localStorage.setItem('sesion_sigae', 'activa');
        const targetEsc = (originalUser.id_escuela && originalUser.id_escuela !== 'ambas' && originalUser.id_escuela !== 'todas')
          ? originalUser.id_escuela
          : (localStorage.getItem('sigae_escuela_codigo') || 'sb');
        localStorage.setItem('sigae_escuela_codigo', targetEsc);
        localStorage.setItem('sigae_escuela_activa', targetEsc === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
      } catch (e) {
        console.error('Error restaurando usuario original:', e);
      }
    } else {
      localStorage.setItem('sesion_sigae', 'activa');
      if (!localStorage.getItem('sigae_escuela_codigo')) {
        localStorage.setItem('sigae_escuela_codigo', 'sb');
        localStorage.setItem('sigae_escuela_activa', 'UE Santa Bárbara');
      }
    }
    localStorage.removeItem('sigae_usuario_original_admin');
    sessionStorage.removeItem('sigae_emulacion_activa');
    localStorage.removeItem('sigae_cache_permisos');
    localStorage.removeItem('sigae_cache_full_permisos');
    
    // Redirección segura a la raíz del panel principal
    window.location.href = '/';
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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarColapsado, setSidebarColapsado] = useState(() => {
    return typeof document !== 'undefined' ? document.body.classList.contains('menu-colapsado') : false;
  });

  const toggleSidebar = () => {
    if (window.innerWidth < 992) {
      toggleMobileSidebar();
      return;
    }
    const isColapsado = document.body.classList.toggle('menu-colapsado');
    setSidebarColapsado(isColapsado);
  };

  const closeMobileSidebar = () => {
    document.body.classList.remove('menu-abierto');
    if (window.innerWidth < 992) {
      document.body.classList.remove('menu-colapsado');
      setSidebarColapsado(false);
    }
    setMobileMenuOpen(false);
  };

  const toggleMobileSidebar = () => {
    document.body.classList.remove('menu-colapsado');
    setSidebarColapsado(false);
    const isOpen = document.body.classList.toggle('menu-abierto');
    setMobileMenuOpen(isOpen);
  };

  // Cierre de barra lateral móvil y menús desplegables al cambiar de ruta
  useEffect(() => {
    closeMobileSidebar();
    setMostrarUserDropdown(false);
    setMostrarNotifDropdown(false);
  }, [location.pathname]);

  // Listener de redimensionamiento de ventana para ajustar el layout inmediatamente
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 992) {
        document.body.classList.remove('menu-colapsado');
        setSidebarColapsado(false);
      }
    };
    window.addEventListener('resize', handleResize);
    // Ejecutar una vez al montar para corregir si arrancó en pantalla pequeña con clase previa
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cierre y recogida automática al hacer clic fuera de la barra lateral (en móvil y desktop)
  useEffect(() => {
    const handleClickAfuera = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const menuLateral = document.getElementById('menu-lateral');
      const btnColapsar = document.getElementById('btn-colapsar-menu');
      const btnToggleDesktop = document.getElementById('btn-toggle-sidebar-desktop');
      const btnMovil = document.getElementById('btn-menu-movil');
      const btnCerrarMovil = document.getElementById('btn-cerrar-menu-movil');

      // Si el clic fue dentro de la barra lateral o sobre sus botones de apertura/cierre, ignorar
      if (
        (menuLateral && menuLateral.contains(target)) ||
        (btnColapsar && btnColapsar.contains(target)) ||
        (btnToggleDesktop && btnToggleDesktop.contains(target)) ||
        (btnMovil && btnMovil.contains(target)) ||
        (btnCerrarMovil && btnCerrarMovil.contains(target))
      ) {
        return;
      }

      // En móviles/tablets: si está abierta, cerrarla y asegurar que no quede menu-colapsado
      if (window.innerWidth < 992) {
        document.body.classList.remove('menu-colapsado');
        setSidebarColapsado(false);
        if (document.body.classList.contains('menu-abierto')) {
          closeMobileSidebar();
        }
        return;
      }

      // En desktop (pantallas grandes): si la barra está desplegada, recogerla automáticamente al hacer clic afuera
      if (window.innerWidth >= 992 && !document.body.classList.contains('menu-colapsado')) {
        document.body.classList.add('menu-colapsado');
        setSidebarColapsado(true);
      }
    };

    document.addEventListener('mousedown', handleClickAfuera);
    document.addEventListener('touchstart', handleClickAfuera);
    return () => {
      document.removeEventListener('mousedown', handleClickAfuera);
      document.removeEventListener('touchstart', handleClickAfuera);
    };
  }, []);

  const activeCategory = location.pathname === '/' 
    ? 'Inicio' 
    : location.pathname.startsWith('/categoria/')
      ? decodeURIComponent(location.pathname.replace('/categoria/', '')).split('/')[0]
      : '';

  return (
    <div id="vista-app" className="vista-app-estilo">
      {/* TELÓN DE FONDO (OVERLAY) PARA CERRAR LA BARRA LATERAL AL HACER CLIC AFUERA */}
      {mobileMenuOpen && (
        <div 
          id="sidebar-backdrop-overlay"
          onClick={closeMobileSidebar}
          className="animate__animated animate__fadeIn"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 999,
            cursor: 'pointer'
          }}
          title="Haga clic afuera para cerrar la barra lateral"
        />
      )}

      <aside id="menu-lateral" className="glass-sidebar chamilo-sidebar shadow-sm d-none d-lg-flex flex-column">
        {/* CABECERA INSTITUCIONAL CHAMILO */}
        <div className="chamilo-sidebar-brand d-flex align-items-center justify-content-between">
          <div 
            id="btn-logo-nav" 
            onClick={() => { navigate('/'); closeMobileSidebar(); }} 
            className="d-flex align-items-center gap-2.5 cursor-pointer text-decoration-none"
            title="Ir al Portal Principal"
          >
            <div className="chamilo-sidebar-logo-frame">
              <img 
                src={logoPath} 
                className="logo-img" 
                alt="Escuela SIGAE" 
                onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
              />
            </div>
            <div className="sidebar-texto">
              <div className="chamilo-sidebar-title text-truncate" style={{ maxWidth: '170px' }}>
                {escuelaNombre}
              </div>
              <div className="chamilo-sidebar-subtitle">
                PDVSA Oriente &bull; <span className="text-primary fw-bold">{escuelaCodigo.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-1">
            {/* Botón Colapsar en Pantallas Grandes (Desktop) */}
            <button 
              id="btn-colapsar-menu" 
              onClick={toggleSidebar} 
              className="btn-colapsar d-none d-lg-flex align-items-center justify-content-center p-1.5 rounded-3 text-muted hover-efecto" 
              title={sidebarColapsado ? "Expandir Barra Lateral" : "Contraer Barra Lateral"}
            >
              <i className={`bi ${sidebarColapsado ? 'bi-chevron-right text-primary fw-bold' : 'bi-layout-sidebar-inset'} fs-5`}></i>
            </button>

            {/* Botón Cerrar en Pantallas Móviles y Tablets */}
            <button 
              id="btn-cerrar-menu-movil" 
              onClick={closeMobileSidebar} 
              className="btn btn-sm btn-light rounded-circle d-flex d-lg-none align-items-center justify-content-center border shadow-xs text-secondary hover-efecto" 
              style={{ width: '34px', height: '34px' }}
              title="Cerrar Barra Lateral"
            >
              <i className="bi bi-x-lg fs-6"></i>
            </button>
          </div>
        </div>
        
        {/* LISTADO DE CAJAS DE HERRAMIENTAS (ESTILO CHAMILO) */}
        <div id="contenedor-enlaces" className="sidebar-menu flex-grow-1 overflow-auto py-3">
          {/* SECCIÓN 1: PORTAL PRINCIPAL */}
          <div className="chamilo-nav-section-title sidebar-texto">
            Portal Oficial
          </div>

          <div 
            onClick={() => { navigate('/'); closeMobileSidebar(); }} 
            id="btn-menu-Inicio" 
            className={`chamilo-menu-link ${activeCategory === 'Inicio' ? 'active' : ''}`}
            role="button"
          >
            <div className="d-flex align-items-center">
              <div 
                className="chamilo-menu-icon-box"
                style={{ 
                  backgroundColor: activeCategory === 'Inicio' ? '#0066FF' : '#eff6ff',
                  color: activeCategory === 'Inicio' ? '#ffffff' : '#0066FF'
                }}
              >
                <i className="bi bi-house-door-fill"></i>
              </div>
              <span className="texto-menu-ocultable">Panel Principal</span>
            </div>

            <span className="chamilo-menu-badge texto-menu-ocultable" title="Módulos autorizados para tu rol">
              {Object.values(ModulosSistema).flatMap(cat => cat.items).filter((item: any) => {
                if (item.vista === 'Mi Expediente' && tienePermiso('Gestor de Expedientes', 'ver')) return false;
                if (item.vista === 'Gestión de Colectivos') {
                  return tienePermisoEnEscuela('sb', item.vista, 'ver') || tienePermisoEnEscuela('lb', item.vista, 'ver');
                }
                return tienePermiso(item.vista, 'ver');
              }).length}
            </span>
          </div>

          {/* SECCIÓN 2: CAJAS DE HERRAMIENTAS DINÁMICAS */}
          <div className="chamilo-nav-section-title sidebar-texto mt-2">
            Cajas de Herramientas
          </div>
          
          {Object.entries(ModulosSistema).map(([nombreCategoria, datosModulo]) => {
            if (permLoading) return null;

            const itemsPermitidos = datosModulo.items.filter((item: any) => {
              if (item.vista === 'Mi Expediente' && tienePermiso('Gestor de Expedientes', 'ver')) return false;
              if (item.vista === 'Gestión de Colectivos') {
                return tienePermisoEnEscuela('sb', item.vista, 'ver') || tienePermisoEnEscuela('lb', item.vista, 'ver');
              }
              return tienePermiso(item.vista, 'ver');
            });

            if (itemsPermitidos.length === 0) return null;

            const isActive = activeCategory === nombreCategoria;

            return (
              <div
                key={nombreCategoria}
                onClick={() => {
                  navigate(`/categoria/${encodeURIComponent(nombreCategoria)}`);
                  closeMobileSidebar();
                }}
                id={`btn-menu-${nombreCategoria.replace(/[\s/()]/g, '-')}`}
                className={`chamilo-menu-link ${isActive ? 'active' : ''}`}
                role="button"
                title={`${nombreCategoria} (${itemsPermitidos.length} herramientas)`}
              >
                <div className="d-flex align-items-center text-truncate">
                  <div 
                    className="chamilo-menu-icon-box d-flex align-items-center justify-content-center"
                    style={{ 
                      backgroundColor: isActive ? datosModulo.color : `${datosModulo.color}15`,
                      color: isActive ? '#ffffff' : datosModulo.color,
                      border: isActive ? `1.5px solid ${datosModulo.color}` : `1px solid ${datosModulo.color}25`
                    }}
                  >
                    <i className={`bi ${datosModulo.icono}`}></i>
                  </div>
                  <span className="texto-menu-ocultable text-truncate">{nombreCategoria}</span>
                </div>

                <span className="chamilo-menu-badge texto-menu-ocultable">
                  {itemsPermitidos.length}
                </span>
              </div>
            );
          })}
        </div>

        {/* PIE INSTITUCIONAL DEL MENÚ LATERAL */}
        <div className="chamilo-sidebar-footer sidebar-texto">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="extra-small text-muted fw-bold">Sede Activa:</span>
            <span className={`badge ${escuelaCodigo === 'sb' ? 'bg-success' : 'bg-primary'} rounded-pill extra-small px-2 py-0.5`}>
              {escuelaCodigo === 'sb' ? 'Santa Bárbara' : 'Libertador Bolívar'}
            </span>
          </div>

          <div className="d-flex gap-1.5">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('sigae-iniciar-tour'))}
              className="btn btn-xs btn-light border w-100 rounded-pill fw-bold text-muted d-flex align-items-center justify-content-center gap-1 hover-efecto"
              style={{ fontSize: '0.74rem' }}
              title="Guía interactiva"
            >
              <i className="bi bi-question-circle text-primary"></i>
              <span>Orientación</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/categoria/Seguridad%20y%20Accesos/Mi%20Perfil')}
              className="btn btn-xs btn-light border w-100 rounded-pill fw-bold text-muted d-flex align-items-center justify-content-center gap-1 hover-efecto"
              style={{ fontSize: '0.74rem' }}
              title="Mi Perfil"
            >
              <i className="bi bi-person-gear text-secondary"></i>
              <span>Mi Perfil</span>
            </button>
          </div>
        </div>
      </aside>

      <main 
        id="contenido-principal" 
        className="d-flex flex-column min-vh-100"
        style={esModoEmulacion ? { paddingTop: '120px' } : undefined}
      >
        {/* BANNER FLOTANTE DE MODO EMULACIÓN */}
        {esModoEmulacion && (
          <div 
            className="w-100 px-3 px-md-4 py-2 text-white shadow d-flex align-items-center justify-content-between flex-wrap gap-2 animate__animated animate__fadeInDown"
            style={{ 
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
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
                {mantenimientoActivo && (
                  <span 
                    className="badge bg-danger text-white fw-bold px-2.5 py-1 ms-1 shadow-sm animate__animated animate__pulse animate__infinite"
                    title="Plantel en Modo Mantenimiento para usuarios normales. Acceso de emulación técnica habilitado sin restricciones."
                  >
                    <i className="bi bi-cone-striped me-1"></i>
                    Modo Mantenimiento (Acceso Habilitado en Emulación)
                  </span>
                )}
                {invitadosBloqueados && usuario?.rol === 'Invitado' && (
                  <span 
                    className="badge bg-warning text-dark fw-bold px-2.5 py-1 ms-1 shadow-sm animate__animated animate__pulse animate__infinite"
                    title="El rol Invitado se encuentra inhabilitado en esta institución para visitantes públicos, pero la emulación está permitida sin restricciones"
                  >
                    <i className="bi bi-person-x-fill me-1"></i>
                    Invitado Inhabilitado (Acceso Habilitado en Emulación)
                  </span>
                )}
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

        <header 
          className={`chamilo-top-header d-flex align-items-center px-3 px-md-4 ${isScrolled ? 'barra-flotante-activa' : ''}`}
          style={esModoEmulacion ? { top: '48px' } : undefined}
        >
          <div className="d-flex align-items-center d-lg-none me-2">
            <button 
              id="btn-menu-movil" 
              onClick={() => setMostrarSheetMovil(true)} 
              className="btn-movil position-relative p-1 d-flex align-items-center justify-content-center" 
              title="Abrir Todas las Cajas de Herramientas"
              style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#eff6ff' }}
            >
              <i className="bi bi-grid-fill fs-5 text-primary"></i>
            </button>
          </div>

          {/* MARCA INSTITUCIONAL EN MÓVIL */}
          <div 
            className="d-flex d-lg-none align-items-center gap-2 cursor-pointer"
            onClick={() => setMostrarSheetMovil(true)}
            title="Cajas de Herramientas"
          >
            <div 
              className="rounded-circle p-0.5 bg-light border d-flex align-items-center justify-content-center"
              style={{ width: '30px', height: '30px', flexShrink: 0 }}
            >
              <img 
                src={logoPath} 
                alt="Logo" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
              />
            </div>
            <span className="fw-bold text-dark small text-truncate" style={{ maxWidth: '140px' }}>
              {activeCategory === 'Inicio' ? escuelaNombre : activeCategory}
            </span>
          </div>

          {/* BOTÓN TOGGLE SIDEBAR EN DESKTOP (SIEMPRE DISPONIBLE Y VISIBLE) */}
          <div className="d-none d-lg-flex align-items-center me-2.5">
            <button 
              id="btn-toggle-sidebar-desktop" 
              onClick={toggleSidebar} 
              className="btn btn-sm btn-light rounded-3 p-1.5 border shadow-xs hover-efecto d-flex align-items-center justify-content-center" 
              title={sidebarColapsado ? "Expandir Menú Lateral" : "Contraer Menú Lateral"}
              style={{ width: '36px', height: '36px', color: sidebarColapsado ? '#0066FF' : '#64748b' }}
            >
              <i className={`bi ${sidebarColapsado ? 'bi-layout-sidebar fs-5' : 'bi-layout-sidebar-inset fs-5'}`}></i>
            </button>
          </div>

          {/* TÍTULO / MIGA DE PAN DE LA SECCIÓN */}
          <div className="d-none d-md-flex align-items-center gap-2">
            <h5 id="titulo-pagina" className="mb-0 fw-bold text-dark">
              {activeCategory === 'Inicio' ? 'Panel Principal' : activeCategory}
            </h5>
          </div>

          <div className="ms-auto d-flex align-items-center gap-2 gap-md-3">
            {/* DISTINTIVO AÑO ESCOLAR Y FASE */}
            <div className="d-none d-xl-flex align-items-center gap-2 px-3 py-1.5 bg-light rounded-pill border">
              <i className="bi bi-calendar-event text-primary"></i>
              <span className="small fw-bold text-dark">{anioEscolar}</span>
              <span className="text-muted extra-small">&bull; {lapsoEscolar}</span>
            </div>

            {/* CAMPANA DE NOTIFICACIONES */}
            <div 
              className="position-relative" 
              id="campana-notificaciones"
              style={{ display: 'inline-block' }}
            >
              <button 
                type="button"
                onClick={() => setMostrarNotifDropdown(!mostrarNotifDropdown)} 
                className="btn btn-sm btn-light rounded-circle p-2 border shadow-xs d-flex align-items-center justify-content-center text-muted hover-efecto position-relative"
                style={{ width: '38px', height: '38px' }}
                title="Notificaciones"
              >
                <i className="bi bi-bell-fill fs-6"></i>
                {notificaciones.filter(n => !n.leido).length > 0 && (
                  <span 
                    className="position-absolute translate-middle badge rounded-pill bg-danger" 
                    style={{
                      top: '6px',
                      right: '-4px',
                      fontSize: '0.62rem',
                      padding: '3px 5px',
                      boxShadow: '0 0 0 2px white'
                    }}
                  >
                    {notificaciones.filter(n => !n.leido).length}
                  </span>
                )}
              </button>

              {mostrarNotifDropdown && (
                <div 
                  className="dropdown-menu show dropdown-menu-end shadow-lg border-0 rounded-4 p-0"
                  style={{
                    position: 'absolute',
                    top: '44px',
                    right: 0,
                    width: '340px',
                    maxHeight: '440px',
                    zIndex: 1050,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'fadeInUp 0.2s ease-out'
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light rounded-top">
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-bold text-dark mb-0 small">Notificaciones</span>
                      {notificaciones.filter(n => !n.leido).length > 0 && (
                        <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger-subtle" style={{ fontSize: '0.68rem' }}>
                          {notificaciones.filter(n => !n.leido).length} nuevas
                        </span>
                      )}
                    </div>
                    {notificaciones.length > 0 && (
                      <div className="d-flex gap-2 align-items-center">
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

                  {/* BARRA DE SILENCIAR RUTAS DE TRANSPORTE */}
                  <div className="px-3 py-1.5 bg-white border-bottom d-flex align-items-center justify-content-between">
                    <span className="text-muted extra-small">Alertas de Rutas:</span>
                    <button
                      type="button"
                      onClick={toggleSilenciarTransporte}
                      className={`btn btn-xs rounded-pill d-flex align-items-center gap-1.5 px-2.5 py-0.5 text-decoration-none border shadow-xs transition-all ${
                        silenciarTransporte 
                          ? 'btn-outline-secondary bg-light text-muted' 
                          : 'btn-outline-warning text-dark bg-warning-subtle'
                      }`}
                      style={{ fontSize: '0.72rem' }}
                      title={silenciarTransporte ? 'Alertas sonoras silenciadas. Clic para activar sonido.' : 'Alertas sonoras activas. Clic para silenciar.'}
                    >
                      <i className={`bi ${silenciarTransporte ? 'bi-volume-mute-fill text-danger' : 'bi-volume-up-fill text-warning'}`}></i>
                      <span>{silenciarTransporte ? 'Silenciadas' : 'Con Sonido'}</span>
                    </button>
                  </div>

                  {/* PESTAÑAS DE FILTRO */}
                  <div className="d-flex border-bottom bg-light px-2.5 py-1.5 gap-1">
                    <button
                      type="button"
                      onClick={() => setFiltroNotif('todas')}
                      className={`btn btn-sm py-0.5 px-2 rounded-pill border-0 fw-semibold extra-small transition-all ${
                        filtroNotif === 'todas' ? 'bg-primary text-white shadow-xs' : 'text-muted bg-transparent'
                      }`}
                      style={{ fontSize: '0.72rem' }}
                    >
                      Todas ({notificaciones.length})
                    </button>
                    {['SuperAdmin', 'Director', 'Directora', 'Administrador', 'Subdirector', 'Coordinador'].includes(usuario?.rol || '') && (
                      <button
                        type="button"
                        onClick={() => setFiltroNotif('seguridad')}
                        className={`btn btn-sm py-0.5 px-2 rounded-pill border-0 fw-semibold extra-small transition-all ${
                          filtroNotif === 'seguridad' ? 'bg-danger text-white shadow-xs' : 'text-muted bg-transparent'
                        }`}
                        style={{ fontSize: '0.72rem' }}
                      >
                        Seguridad ({notificaciones.filter(n => n.tipo === 'seguridad' || n.tipo === 'alerta' || (n.titulo || '').toLowerCase().includes('reseteo')).length})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setFiltroNotif('transporte')}
                      className={`btn btn-sm py-0.5 px-2 rounded-pill border-0 fw-semibold extra-small transition-all ${
                        filtroNotif === 'transporte' ? 'bg-warning text-dark shadow-xs' : 'text-muted bg-transparent'
                      }`}
                      style={{ fontSize: '0.72rem' }}
                    >
                      Transporte ({notificaciones.filter(n => n.tipo === 'transporte').length})
                    </button>
                  </div>

                  {/* LISTADO DE NOTIFICACIONES */}
                  <div className="overflow-auto" style={{ maxHeight: '300px', flexGrow: 1 }}>
                    {(() => {
                      const notifsFiltradas = notificaciones.filter(n => {
                        if (filtroNotif === 'todas') return true;
                        if (filtroNotif === 'seguridad') {
                          return n.tipo === 'seguridad' || n.tipo === 'alerta' || (n.titulo || '').toLowerCase().includes('reseteo');
                        }
                        if (filtroNotif === 'transporte') {
                          return n.tipo === 'transporte';
                        }
                        return true;
                      });

                      if (notifsFiltradas.length === 0) {
                        return (
                          <div className="text-center py-4 text-muted small">
                            <i className="bi bi-bell-slash fs-3 d-block mb-2 text-secondary"></i>
                            No hay notificaciones en este filtro
                          </div>
                        );
                      }

                      return notifsFiltradas.map((notif) => {
                        const isPersonal = notif.tipo && notif.tipo.startsWith('usuario:');
                        const isSeguridad = notif.tipo === 'seguridad' || notif.tipo === 'alerta' || (notif.titulo || '').toLowerCase().includes('reseteo');
                        const isTransporte = notif.tipo === 'transporte';

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
                              backgroundColor: !notif.leido 
                                ? (isPersonal ? '#f5f3ff' : isSeguridad ? '#fff1f2' : '#fefce8') 
                                : '#ffffff',
                              transition: 'background-color 0.2s'
                            }}
                          >
                            <div className="me-3">
                              <span 
                                className="d-flex align-items-center justify-content-center rounded-circle"
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  background: isPersonal ? '#ede9fe' : isSeguridad ? '#fef2f2' : isTransporte ? '#fffbeb' : '#eff6ff',
                                  color: isPersonal ? '#7c3aed' : isSeguridad ? '#dc2626' : isTransporte ? '#d97706' : '#2563eb',
                                  border: isPersonal ? '1px solid #ddd6fe' : isSeguridad ? '1px solid #fecaca' : isTransporte ? '1px solid #fde68a' : '1px solid #bfdbfe'
                                }}
                              >
                                <i className={`bi ${isPersonal ? 'bi-person-badge-fill' : isSeguridad ? 'bi-shield-exclamation' : isTransporte ? 'bi-bus-front' : 'bi-info-circle-fill'} small`}></i>
                              </span>
                            </div>
                            <div style={{ flexGrow: 1, minWidth: 0 }}>
                              <div className="d-flex justify-content-between align-items-start mb-1">
                                <div className="d-flex align-items-center gap-1.5 flex-wrap">
                                  <span className={`fw-bold text-truncate small ${isPersonal ? 'text-primary' : isSeguridad ? 'text-danger' : 'text-dark'}`} style={{ maxWidth: '140px' }}>
                                    {notif.titulo}
                                  </span>
                                  {isPersonal && (
                                    <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-1 py-0 rounded" style={{ fontSize: '0.62rem' }}>
                                      Personal
                                    </span>
                                  )}
                                </div>
                                <span className="text-muted style-date" style={{ fontSize: '0.65rem' }}>
                                  {notif.fecha ? new Date(notif.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              <p className="text-muted mb-0 small text-wrap-break" style={{ fontSize: '0.75rem', lineHeight: '1.25' }}>
                                {notif.cuerpo}
                              </p>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* MENÚ DE USUARIO UNIFICADO (ESTILO CHAMILO) */}
            <div className="position-relative" id="menu-usuario-chamilo">
              <div 
                onClick={() => setMostrarUserDropdown(!mostrarUserDropdown)}
                className="chamilo-user-pill shadow-xs"
                role="button"
                title="Opciones de Cuenta"
              >
                <div className="chamilo-avatar-circle">
                  {usuario.nombre ? usuario.nombre.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                </div>
                <div className="d-none d-md-block text-start" style={{ lineHeight: 1.2 }}>
                  <div className="fw-bold text-dark small text-truncate" style={{ maxWidth: '130px' }}>
                    {usuario.nombre || 'Usuario'}
                  </div>
                  <div className="text-primary extra-small fw-bold">
                    {usuario.rol || 'Comunidad'}
                  </div>
                </div>
                <i className="bi bi-chevron-down text-muted small ms-1"></i>
              </div>

              {mostrarUserDropdown && (
                <div 
                  className="dropdown-menu show dropdown-menu-end chamilo-user-dropdown-menu shadow-lg border bg-white"
                  style={{
                    position: 'absolute',
                    top: '46px',
                    right: 0,
                    zIndex: 1050
                  }}
                >
                  {/* Encabezado del Usuario */}
                  <div className="p-3 border-bottom bg-light rounded-top-3 mb-1">
                    <div className="fw-bolder text-dark small">{usuario.nombre || 'Usuario SIGAE'}</div>
                    <div className="extra-small text-muted mb-1">C.I. {usuario.cedula || 'N/A'}</div>
                    <span className="badge bg-primary text-white rounded-pill extra-small px-2 py-0.5 fw-bold">
                      {usuario.rol || 'Comunidad'}
                    </span>
                  </div>

                  {/* Opciones Principales */}
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarUserDropdown(false);
                      navigate('/categoria/Seguridad y Accesos/Mi Perfil');
                    }}
                    className="chamilo-dropdown-item"
                  >
                    <i className="bi bi-person-badge text-primary"></i>
                    <span>Mi Perfil y Cuenta</span>
                  </button>

                  {/* Ver Asignación de Responsabilidades (Solo Personal Escolar) */}
                  {esPersonalEscuela && (
                    <button
                      type="button"
                      onClick={() => {
                        setMostrarUserDropdown(false);
                        setMostrarAsignacionManual(true);
                      }}
                      className="chamilo-dropdown-item"
                    >
                      <i className="bi bi-stars text-warning"></i>
                      <span>Mi Asignación 2026-2027</span>
                    </button>
                  )}

                  {/* Selector de Sede Dual si está autorizado */}
                  {((usuario.rol === 'SuperAdmin' || ['Administrador', 'Director', 'Coordinador'].includes(usuario.rol) || usuario.id_escuela === 'ambas' || usuario.id_escuela === 'todas') && tieneAccesoEscuela('sb') && tieneAccesoEscuela('lb')) && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = escuelaCodigo === 'sb' ? 'lb' : 'sb';
                        localStorage.setItem('sigae_escuela_codigo', target);
                        localStorage.setItem('sigae_escuela_activa', target === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
                        try {
                          const u = JSON.parse(localStorage.getItem('usuario_sigae') || '{}');
                          u.id_escuela = target;
                          u.nombre_escuela = target === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
                          localStorage.setItem('usuario_sigae', JSON.stringify(u));
                        } catch {
                          // ignorar error de lectura/escritura de json
                        }
                        window.location.reload();
                      }}
                      className="chamilo-dropdown-item"
                    >
                      <i className="bi bi-arrow-left-right text-success"></i>
                      <span>Cambiar a {escuelaCodigo === 'sb' ? 'U.E. Libertador Bolívar' : 'U.E. Santa Bárbara'}</span>
                    </button>
                  )}

                  {/* Emulación de Rol si está autorizado */}
                  {!esModoEmulacion && (usuario.rol === 'SuperAdmin' || usuario.rol === 'Administrador' || tienePermiso('Función: Emulación de Roles', 'ver')) && (
                    <button
                      type="button"
                      onClick={() => {
                        setMostrarUserDropdown(false);
                        navigate('/categoria/Seguridad y Accesos/Roles y Privilegios');
                      }}
                      className="chamilo-dropdown-item"
                    >
                      <i className="bi bi-person-bounding-box text-warning"></i>
                      <span>Emular Rol / Permisos</span>
                    </button>
                  )}

                  {/* Instalación y Descargas */}
                  {tienePermiso('Instalación y Descargas', 'ver') && (
                    <button
                      type="button"
                      onClick={() => {
                        setMostrarUserDropdown(false);
                        navigate('/categoria/Dirección y Sistema/Instalación y Descargas');
                      }}
                      className="chamilo-dropdown-item"
                    >
                      <i className="bi bi-cloud-arrow-down text-info"></i>
                      <span>Instalar SIGAE / App</span>
                    </button>
                  )}

                  <div className="dropdown-divider my-1"></div>

                  {/* Cerrar Sesión */}
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarUserDropdown(false);
                      handleLogout();
                    }}
                    className="chamilo-dropdown-item item-danger"
                  >
                    <i className="bi bi-power text-danger"></i>
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        <div id="area-dinamica" className="contenedor-dinamico p-2 p-sm-3 p-md-4 p-lg-5 flex-grow-1">
          <Outlet />
        </div>

        <footer className="w-100 d-flex flex-column align-items-center py-4 mt-auto border-top bg-light bg-opacity-50">
          <div className="d-flex justify-content-center align-items-center gap-4 mb-3">
            <img src="/assets/img/logoMPPE.png" alt="MPPE" className="footer-logo-mppe" height="40" />
            <img src="/assets/img/sigae.png?v=escudo3d" alt="Sistema Integral de Gestión y Administración Escolar" className="footer-logo-sigae" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <div className="fw-bold text-center mb-2 footer-anio">
            Escuelas DEP Oriente <span>{new Date().getFullYear()}</span> | <span className="text-primary">Versión 1.1</span>
          </div>
        </footer>
      </main>
      <NavigationLoader />
      <MobileBottomNav 
        activeCategory={activeCategory}
        tienePermiso={tienePermiso}
        tienePermisoEnEscuela={tienePermisoEnEscuela}
        permLoading={permLoading}
        escuelaCodigo={escuelaCodigo}
        escuelaNombre={escuelaNombre}
        logoPath={logoPath}
        usuario={usuario}
        onLogout={handleLogout}
        abrirSheetExterno={mostrarSheetMovil}
        onCerrarSheetExterno={() => setMostrarSheetMovil(false)}
      />
      <ChatbotSigma />
      <TourOrientacion />
      {esPersonalEscuela && (
        <ModalAsignacionSorpresa 
          forzarApertura={mostrarAsignacionManual} 
          onClose={() => setMostrarAsignacionManual(false)} 
        />
      )}
    </div>
  );
};

