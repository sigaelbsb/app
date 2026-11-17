import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  User, Lock, ArrowRight, ArrowLeft, Eye, EyeOff, 
  ShieldCheck, AlertCircle, Fingerprint, CheckCircle2, 
  KeyRound, HelpCircle, Sparkles, School, ChevronRight,
  RotateCcw, Users
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { registrarSesionActiva } from '../utils/activeSessionsHelper';
import TechNetworkBackground from '../components/TechNetworkBackground';
import { Security3DIcon, User3DIcon, Lock3DIcon } from '../components/Animated3DIcons';
import '../portal_sap.css';

export const Auth = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [view, setView] = useState<'selector' | 'login'>('login');
  const [school, setSchool] = useState<'sb' | 'lb' | null>(() => {
    return (localStorage.getItem('sigae_escuela_codigo') as 'sb' | 'lb' | null) || 'sb';
  });

  const handleSchoolChange = (selected: 'sb' | 'lb') => {
    setSchool(selected);
    localStorage.setItem('sigae_escuela_codigo', selected);
    localStorage.setItem('sigae_escuela_activa', selected === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
    setErrorMsg('');
  };
  
  // Login Steps: 'cedula' -> 'clave' OR 'invitado' OR 'recuperacion' OR 'primer-ingreso'
  const [loginStep, setLoginStep] = useState<'cedula' | 'clave' | 'invitado' | 'recuperacion' | 'primer-ingreso'>('cedula');
  
  const [cedula, setCedula] = useState('');
  const [clave, setClave] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState(''); // To show in Clave step
  const [usuarioDetalle, setUsuarioDetalle] = useState<{
    nombre: string;
    rol: string;
    cargo?: string;
    foto?: string;
    escuela?: string;
  } | null>(null);
  
  // Password Visibility States
  const [showClave, setShowClave] = useState(false);
  const [showRecClave1, setShowRecClave1] = useState(false);
  const [showRecClave2, setShowRecClave2] = useState(false);

  // First login states
  const [piClave1, setPiClave1] = useState('');
  const [piClave2, setPiClave2] = useState('');
  const [showPiClave1, setShowPiClave1] = useState(false);
  const [showPiClave2, setShowPiClave2] = useState(false);
  const [fuerzaPiClave, setFuerzaPiClave] = useState(0);
  const [piEmail, setPiEmail] = useState('');
  const [piTelefono, setPiTelefono] = useState('');
  const [preguntasSeguridad, setPreguntasSeguridad] = useState<any[]>([]);
  const [piPreg1, setPiPreg1] = useState('');
  const [piResp1, setPiResp1] = useState('');
  const [piPreg2, setPiPreg2] = useState('');
  const [piResp2, setPiResp2] = useState('');

  // Recovery States
  const [preguntaRecuperacion, setPreguntaRecuperacion] = useState('');
  const [preguntaRecuperacionIndice, setPreguntaRecuperacionIndice] = useState<1 | 2>(1);
  const [recCorreo, setRecCorreo] = useState('');
  const [recRespuesta, setRecRespuesta] = useState('');
  const [recClave1, setRecClave1] = useState('');
  const [recClave2, setRecClave2] = useState('');
  
  // Guest fields
  const [invNombres, setInvNombres] = useState('');
  const [invApellidos, setInvApellidos] = useState('');
  const [invCorreo, setInvCorreo] = useState('');
  const [invTelefono, setInvTelefono] = useState('');
  const [invMotivo, setInvMotivo] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isStandalone, setIsStandalone] = useState(false);
  

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const estadoSesion = localStorage.getItem('sesion_sigae');
    const uStr = localStorage.getItem('usuario_sigae');
    const escCodigo = localStorage.getItem('sigae_escuela_codigo') as 'sb' | 'lb' | null;

    if (estadoSesion === 'bloqueada' && uStr && escCodigo) {
      try {
        const u = JSON.parse(uStr);
        setSchool(escCodigo);
        setCedula(u.cedula);
        setNombreUsuario(u.nombre);
        setView('login');
        setLoginStep('clave');
        
        // Auto-trigger biometric login if configured and active
        const tieneHuella = localStorage.getItem('sigae_tiene_huella');
        const huellaHabilitada = localStorage.getItem('sigae_huella_habilitada') !== 'false';
        if (tieneHuella && huellaHabilitada) {
          setTimeout(() => {
            const btnHuella = document.getElementById('btn-biometrico-inicial');
            if (btnHuella) {
              btnHuella.click();
            }
          }, 600);
        }
      } catch (e) {
        console.error("Error al restaurar sesión bloqueada:", e);
      }
    }
  }, []);

  const handleSchoolSelect = (selected: 'sb' | 'lb') => {
    setSchool(selected);
    localStorage.setItem('sigae_escuela_codigo', selected);
    localStorage.setItem('sigae_escuela_activa', selected === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
    setView('login');
    setLoginStep('cedula');
    setCedula('');
    setClave('');
    setErrorMsg('');
  };

  const cargarPreguntas = async () => {
    try {
      const { data } = await supabase
        .from('conf_preguntas_seguridad')
        .select('pregunta')
        .order('pregunta', { ascending: true });
      if (data) {
        setPreguntasSeguridad(data);
      }
    } catch (e) {
      console.error("Error cargando preguntas de seguridad:", e);
    }
  };

  const handlePiClave1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPiClave1(val);
    let fuerza = 0;
    if (val.length >= 8) fuerza += 25;
    if (/[A-Z]/.test(val)) fuerza += 25;
    if (/[a-z]/.test(val)) fuerza += 25;
    if (/[0-9]/.test(val)) fuerza += 15;
    if (/[^A-Za-z0-9]/.test(val)) fuerza += 10;
    setFuerzaPiClave(fuerza);
  };

  const procesarPrimerIngreso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!piClave1 || !piClave2 || !piEmail || !piTelefono || !piPreg1 || !piResp1 || !piPreg2 || !piResp2) {
      setErrorMsg('Complete todos los campos obligatorios (*).');
      return;
    }
    if (piClave1 !== piClave2) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }
    if (fuerzaPiClave < 50) {
      setErrorMsg('Contraseña débil. Debe contener al menos 8 caracteres, incluyendo mayúsculas, números y símbolos.');
      return;
    }
    if (piPreg1 === piPreg2) {
      setErrorMsg('Debe seleccionar preguntas de seguridad distintas.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          clave: piClave1,
          email: piEmail.trim(),
          telefono: piTelefono.trim(),
          preguntas_seguridad: {
            pregunta_1: piPreg1,
            respuesta_1: piResp1.trim().toLowerCase(),
            pregunta_2: piPreg2,
            respuesta_2: piResp2.trim().toLowerCase()
          },
          primer_ingreso: false,
          fecha_ult_clave: new Date().toISOString()
        })
        .eq('cedula', cedula);

      if (error) throw error;

      const Swal = (window as any).Swal;
      if (Swal) {
        Swal.fire('¡Cuenta Configurada!', 'Su cuenta ha sido configurada exitosamente. Para ingresar, seleccione su institución e inicie sesión con sus credenciales.', 'success').then(() => {
          // Volver al selector de escuelas limpiamente para no confundir sesiones
          setLoginStep('cedula');
          setCedula('');
          setClave('');
          setNombreUsuario('');
          // Clear first login fields
          setPiClave1('');
          setPiClave2('');
          setPiEmail('');
          setPiTelefono('');
          setPiPreg1('');
          setPiResp1('');
          setPiPreg2('');
          setPiResp2('');
          setView('selector');
        });
      } else {
        alert('Cuenta configurada correctamente. Seleccione su institución e inicie sesión.');
        setLoginStep('cedula');
        setCedula('');
        setClave('');
        setNombreUsuario('');
        setView('selector');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('No se pudo configurar la cuenta en el servidor.');
    }
    setLoading(false);
  };

  const verificarCedula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula) {
      setErrorMsg('Debe ingresar cédula de identidad.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('cedula', cedula)
        .maybeSingle();

      if (error || !data) {
        // Verificar si la cédula ingresada corresponde a un estudiante registrado
        try {
          const cedulaLimpia = cedula.trim().replace(/\D/g, '');
          const { data: estData } = await supabase
            .from('estudiantes_vinculaciones')
            .select('nombres_estudiante, apellidos_estudiante, cedula_representante, nombres_representante')
            .or(`cedula_estudiante.eq.${cedula},cedula_estudiante.eq.${cedulaLimpia},cedula_estudiante.eq.CE-${cedulaLimpia}`)
            .limit(1)
            .maybeSingle();

          if (estData) {
            const nomEst = `${estData.nombres_estudiante || ''} ${estData.apellidos_estudiante || ''}`.trim();
            const repInfo = estData.cedula_representante ? ` (Cédula de Representante vinculada: ${estData.cedula_representante})` : '';
            setErrorMsg(`Esta cédula corresponde al estudiante "${nomEst}". Para actualizar la ficha integral o descargar constancias, el representante legal debe ingresar con su propia Cédula de Identidad${repInfo}.`);
            setLoading(false);
            return;
          }
        } catch (err) {}

        // No existe -> Invitado (verificar mantenimiento e inhabilitación de invitados antes)
        try {
          const targetSchool = school || (localStorage.getItem('sigae_escuela_codigo') as 'sb' | 'lb') || 'sb';
          const schoolNombre = targetSchool === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar';

          const { data: ajustes } = await supabase
            .from('ajustes_globales')
            .select('clave, valor')
            .in('clave', ['mantenimiento_sb', 'mantenimiento_lb', 'mantenimiento_activo', 'bloquear_invitados_sb', 'bloquear_invitados_lb', 'bloquear_invitados']);

          const maintKey = targetSchool === 'sb' ? 'mantenimiento_sb' : 'mantenimiento_lb';
          const schoolMaint = ajustes?.find(x => x.clave === maintKey);
          const globalMaint = ajustes?.find(x => x.clave === 'mantenimiento_activo');
          const isSchoolInMaint = schoolMaint ? (schoolMaint.valor === 'true') : (globalMaint?.valor === 'true');

          if (isSchoolInMaint) {
            setErrorMsg(`La institución (${schoolNombre}) se encuentra en mantenimiento y no permite acceso de visitantes.`);
            setLoading(false);
            return;
          }

          const guestKey = targetSchool === 'sb' ? 'bloquear_invitados_sb' : 'bloquear_invitados_lb';
          const guestSchool = ajustes?.find(x => x.clave === guestKey);
          const guestGlobal = ajustes?.find(x => x.clave === 'bloquear_invitados');
          let isGuestBlocked = guestSchool ? (guestSchool.valor === 'true') : (guestGlobal?.valor === 'true');

          if (!isGuestBlocked) {
            const { data: invRole } = await supabase
              .from('roles')
              .select('permisos')
              .eq('nombre', 'Invitado')
              .maybeSingle();

            if (invRole && invRole.permisos) {
              const parsed = typeof invRole.permisos === 'string' ? JSON.parse(invRole.permisos) : invRole.permisos;
              const escPerms = parsed[targetSchool] || {};
              if (escPerms.hasOwnProperty('__acceso_plantel__') && (escPerms['__acceso_plantel__']?.ver === false || escPerms['__acceso_plantel__'] === false)) {
                isGuestBlocked = true;
              }
            }
          }

          if (isGuestBlocked) {
            setErrorMsg(`El registro e ingreso de invitados y visitantes para ${schoolNombre} está temporalmente inhabilitado por la dirección.`);
            setLoading(false);
            return;
          }
        } catch (err) {}

        // Intentar autocompletar si es un visitante recurrente
        try {
          const { data: pastVisit } = await supabase
            .from('invitados')
            .select('nombres, apellidos, correo, telefono')
            .eq('cedula', cedula)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (pastVisit) {
            setInvNombres(pastVisit.nombres || '');
            setInvApellidos(pastVisit.apellidos || '');
            setInvCorreo(pastVisit.correo || '');
            setInvTelefono(pastVisit.telefono || '');
          } else {
            setInvNombres('');
            setInvApellidos('');
            setInvCorreo('');
            setInvTelefono('');
          }
        } catch (err) {}
        
        setInvMotivo('');
        setLoginStep('invitado');
      } else {
        // Existe -> Verificar si está en mantenimiento
        try {
          const activeSchool = school || (localStorage.getItem('sigae_escuela_codigo') as 'sb' | 'lb') || 'sb';
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
            let hasMaintAccess = false;
            if (data.rol === 'SuperAdmin') {
              hasMaintAccess = true;
            } else {
              let { data: roleData } = await supabase
                .from('roles')
                .select('permisos')
                .ilike('nombre', data.rol)
                .maybeSingle();

              if (!roleData && data.rol?.toLowerCase() === 'representante') {
                const { data: repRole } = await supabase.from('roles').select('permisos').eq('nombre', 'Representante').maybeSingle();
                roleData = repRole;
              }

              if (roleData && roleData.permisos) {
                const parsed = typeof roleData.permisos === 'string' ? JSON.parse(roleData.permisos) : roleData.permisos;
                const escPerms = parsed[activeSchool] || {};
                if (escPerms["Ingresar en Mantenimiento"]?.ver === true) {
                  hasMaintAccess = true;
                }
              }
            }

            if (!hasMaintAccess) {
              setErrorMsg(`La institución (${schoolNombre}) se encuentra actualmente en mantenimiento. Solo se permite el acceso a administradores y personal autorizado.`);
              setLoading(false);
              return;
            }
          }

          // Verificar si el rol del usuario está inhabilitado en la institución seleccionada
          const userRolStr = (data.rol || '').trim();
          if (userRolStr && !['SuperAdmin', 'Administrador', 'Administradora', 'Director', 'Directora'].some(r => r.toLowerCase() === userRolStr.toLowerCase())) {
            let { data: roleData } = await supabase
              .from('roles')
              .select('permisos, nombre')
              .ilike('nombre', userRolStr)
              .maybeSingle();

            if (!roleData && userRolStr.toLowerCase() === 'representante') {
              const { data: repRole } = await supabase.from('roles').select('permisos, nombre').eq('nombre', 'Representante').maybeSingle();
              roleData = repRole;
            }

            if (roleData && roleData.permisos) {
              const parsed = typeof roleData.permisos === 'string' ? JSON.parse(roleData.permisos) : roleData.permisos;
              const escPerms = parsed[activeSchool] || {};
              const isRoleBlocked = escPerms.hasOwnProperty('__acceso_plantel__')
                ? (escPerms['__acceso_plantel__']?.ver === false || escPerms['__acceso_plantel__'] === false)
                : false;

              if (isRoleBlocked) {
                setErrorMsg(`El acceso para el rol "${roleData.nombre || userRolStr}" en ${schoolNombre} está temporalmente inhabilitado por la dirección.`);
                setLoading(false);
                return;
              }
            }
          }
        } catch (err) {}

        // Existe -> Pedir clave
        if (data.estado === 'Bloqueado') {
          setErrorMsg('Usuario BLOQUEADO permanentemente.');
        } else if (data.bloqueo_hasta) {
          const bloqueo = new Date(data.bloqueo_hasta).getTime();
          const ahora = new Date().getTime();
          if (bloqueo > ahora) {
            const faltan = Math.ceil((bloqueo - ahora) / 60000);
            setErrorMsg(`Cuenta bloqueada temporalmente por seguridad. Intente en ${faltan} minutos.`);
          } else {
            const nomCompleto = data.nombre_completo || `${data.nombres || ''} ${data.apellidos || ''}`.trim() || data.nombre || 'Usuario';
            setNombreUsuario(nomCompleto);
            setUsuarioDetalle({
              nombre: nomCompleto,
              rol: data.rol || 'Personal SIGAE',
              cargo: data.cargo || '',
              foto: data.foto_url || data.foto_perfil || '',
              escuela: data.id_escuela || school || 'sb'
            });
            if (data.primer_ingreso === true || !data.clave) {
              await cargarPreguntas();
              setLoginStep('primer-ingreso');
            } else {
              setLoginStep('clave');
            }
          }
        } else {
          const nomCompleto = data.nombre_completo || `${data.nombres || ''} ${data.apellidos || ''}`.trim() || data.nombre || 'Usuario';
          setNombreUsuario(nomCompleto);
          setUsuarioDetalle({
            nombre: nomCompleto,
            rol: data.rol || 'Personal SIGAE',
            cargo: data.cargo || '',
            foto: data.foto_url || data.foto_perfil || '',
            escuela: data.id_escuela || school || 'sb'
          });
          if (data.primer_ingreso === true || !data.clave) {
            await cargarPreguntas();
            setLoginStep('primer-ingreso');
          } else {
            setLoginStep('clave');
          }
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de conexión.');
    }
    setLoading(false);
  };

  const decodificarBase32 = (base32: string) => {
    const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = "";
    let bytes = [];
    base32 = base32.replace(/=+$/, "").toUpperCase();
    for (let i = 0; i < base32.length; i++) {
      const val = alfabeto.indexOf(base32[i]);
      if (val === -1) throw new Error("Carácter Base32 no válido");
      bits += val.toString(2).padStart(5, '0');
    }
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substr(i, 8), 2));
    }
    return new Uint8Array(bytes);
  };

  const calcularTOTP = async (secretoBase32: string, tiempoSegs = Math.floor(Date.now() / 1000)) => {
    const claveBytes = decodificarBase32(secretoBase32);
    const paso = Math.floor(tiempoSegs / 30);
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setUint32(0, 0);
    view.setUint32(4, paso);
    
    const claveCrypto = await crypto.subtle.importKey(
      "raw",
      claveBytes,
      { name: "HMAC", hash: { name: "SHA-1" } },
      false,
      ["sign"]
    );
    
    const firmaBuffer = await crypto.subtle.sign("HMAC", claveCrypto, buffer);
    const hmac = new Uint8Array(firmaBuffer);
    
    const offset = hmac[hmac.length - 1] & 0xf;
    const codigoBinario = 
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
      
    const codigo = codigoBinario % 1000000;
    return String(codigo).padStart(6, '0');
  };

  const verificarTOTP = async (secretoBase32: string, codigoIngresado: string) => {
    const ahora = Math.floor(Date.now() / 1000);
    for (let desvio = -1; desvio <= 1; desvio++) {
      const codigoCalculado = await calcularTOTP(secretoBase32, ahora + (desvio * 30));
      if (codigoCalculado === String(codigoIngresado).trim()) {
        return true;
      }
    }
    return false;
  };

  const auditarAcceso = async (cedulaStr: string, nombreStr: string, accion: string, detalles: string = '') => {
    try {
      await supabase.from('historial_auditoria').insert([{
        usuario_cedula: cedulaStr,
        usuario_nombre: nombreStr,
        escuela: school || localStorage.getItem('sigae_escuela_codigo') || 'sb',
        modulo: 'Seguridad y Accesos',
        accion: accion,
        detalles: detalles
      }]);
    } catch (err) {
      console.warn('Error auditing:', err);
    }
  };

  const verifySchoolAccess = async (userData: any): Promise<'sb' | 'lb' | null> => {
    const rolStr = (userData.rol || '').trim();
    if (['SuperAdmin', 'Administrador', 'Administradora', 'Director', 'Directora'].some(r => r.toLowerCase() === rolStr.toLowerCase())) {
      return school || (localStorage.getItem('sigae_escuela_codigo') as 'sb' | 'lb') || 'sb';
    }

    try {
      let { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('permisos, nombre')
        .ilike('nombre', rolStr)
        .maybeSingle();

      if (!roleData && rolStr.toLowerCase() === 'representante') {
        const { data: repRole } = await supabase.from('roles').select('permisos, nombre').eq('nombre', 'Representante').maybeSingle();
        roleData = repRole;
      } else if (!roleData && rolStr.toLowerCase() === 'docente') {
        const { data: docRole } = await supabase.from('roles').select('permisos, nombre').eq('nombre', 'Docente').maybeSingle();
        roleData = docRole;
      }

      if (roleError || !roleData) {
        // Si no se encontró registro puntual del rol, permitir acceso a su escuela asignada
        const userSchool = (userData.id_escuela || '').trim().toLowerCase();
        if (userSchool === 'sb' || userSchool === 'lb') {
          return userSchool as 'sb' | 'lb';
        }
        return (school || localStorage.getItem('sigae_escuela_codigo') || 'sb') as 'sb' | 'lb';
      }

      let rolePerms: any = {};
      if (typeof roleData.permisos === 'string') {
        try { rolePerms = JSON.parse(roleData.permisos); } catch (e) {}
      } else {
        rolePerms = roleData.permisos || {};
      }

      const tieneAcceso = (cod: string) => {
        const privs = rolePerms[cod];
        if (!privs) return false;
        if (privs.hasOwnProperty('__acceso_plantel__')) {
          return privs['__acceso_plantel__']?.ver === true || privs['__acceso_plantel__'] === true;
        }
        for (let mod in privs) {
          if (privs[mod] && (privs[mod].ver === true || privs[mod] === true)) return true;
        }
        return false;
      };

      const selectedSchoolCode = school || (localStorage.getItem('sigae_escuela_codigo') as 'sb' | 'lb') || 'sb';
      
      // Si el usuario pertenece exclusivamente a una escuela, validar esa escuela
      const userSchool = (userData.id_escuela || '').trim().toLowerCase();
      if (userSchool === 'sb' || userSchool === 'lb') {
        if (tieneAcceso(userSchool)) {
          return userSchool as 'sb' | 'lb';
        }
        return null;
      }

      // Si seleccionó un plantel en el selector, validar estrictamente ese plantel
      if (tieneAcceso(selectedSchoolCode)) {
        return selectedSchoolCode;
      }

      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const completarLogin = async (userData: any, resolvedSchool?: 'sb' | 'lb') => {
    const activeSchool = resolvedSchool || school || (localStorage.getItem('sigae_escuela_codigo') as 'sb' | 'lb') || 'sb';
    
    // Check maintenance mode for the target school
    try {
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
        let hasMaintAccess = false;
        if (userData.rol === 'SuperAdmin') {
          hasMaintAccess = true;
        } else {
          let { data: roleData } = await supabase
            .from('roles')
            .select('permisos')
            .ilike('nombre', userData.rol)
            .maybeSingle();

          if (!roleData && userData.rol?.toLowerCase() === 'representante') {
            const { data: repRole } = await supabase.from('roles').select('permisos').eq('nombre', 'Representante').maybeSingle();
            roleData = repRole;
          }

          if (roleData && roleData.permisos) {
            const parsed = typeof roleData.permisos === 'string' ? JSON.parse(roleData.permisos) : roleData.permisos;
            const escPerms = parsed[activeSchool] || {};
            if (escPerms["Ingresar en Mantenimiento"]?.ver === true) {
              hasMaintAccess = true;
            }
          }
        }

        if (!hasMaintAccess) {
          setErrorMsg(`La institución (${schoolNombre}) se encuentra actualmente en mantenimiento. Solo se permite el acceso a administradores y personal autorizado.`);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error("Error al comprobar mantenimiento en login:", err);
    }

    // Normalizar rol al formato canónico
    let rolCanonico = userData.rol;
    if (rolCanonico?.toLowerCase() === 'representante') rolCanonico = 'Representante';
    else if (rolCanonico?.toLowerCase() === 'docente') rolCanonico = 'Docente';
    else if (rolCanonico?.toLowerCase() === 'administrador') rolCanonico = 'Administrador';

    // Si en la base de datos estaba con otra capitalización, normalizar en segundo plano
    if (userData.cedula && userData.rol !== rolCanonico) {
      supabase.from('usuarios').update({ rol: rolCanonico }).eq('cedula', userData.cedula).then();
    }

    const cleanUserData = {
      id: userData.id || userData.id_usuario,
      nombre: userData.nombre_completo || userData.nombre,
      cedula: userData.cedula,
      rol: rolCanonico,
      cargo: userData.cargo || '',
      id_escuela: userData.id_escuela || activeSchool,
      id_escuela_asignada: userData.id_escuela || activeSchool,
      perfil_acceso: userData.perfil_acceso || { instituciones: [] },
      nombre_escuela: activeSchool === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar',
      email: userData.email || userData.correo
    };
    localStorage.setItem('sesion_sigae', 'activa');
    localStorage.setItem('sigae_escuela_codigo', activeSchool);
    localStorage.setItem('sigae_escuela_activa', activeSchool === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
    localStorage.setItem('usuario_sigae', JSON.stringify(cleanUserData));
    localStorage.removeItem('sigae_bloqueado_total');
    
    // Registrar sesión de este dispositivo en la base de datos (Estilo WhatsApp Web)
    registrarSesionActiva(userData.cedula);

    auditarAcceso(userData.cedula, userData.nombre_completo || userData.nombre, 'Inicio de Sesión', 'El usuario accedió exitosamente al sistema.');
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.65 }
      });
    } catch (e) {}
    onLogin(cleanUserData);
  };

  const pedirCodigo2FA = (userData: any, secret: string, resolvedSchool: 'sb' | 'lb') => {
    const Swal = (window as any).Swal;
    if (!Swal) {
      const code = prompt("Ingresa el código de 2FA:");
      if (code && code.trim().length === 6) {
        verificarTOTP(secret, code).then(async verificado => {
          if (verificado) {
            await completarLogin(userData, resolvedSchool);
          } else {
            alert("Código incorrecto");
          }
        });
      }
      return;
    }

    Swal.fire({
      title: 'Código de Doble Factor',
      text: 'Ingresa el código de 6 dígitos de tu aplicación de autenticación:',
      input: 'text',
      inputPlaceholder: '000000',
      showCancelButton: true,
      confirmButtonText: 'Verificar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0066FF',
      inputAttributes: {
        maxlength: '6',
        autofocus: 'true',
        style: 'text-align: center; font-size: 1.5rem; letter-spacing: 5px; font-weight: bold;'
      },
      preConfirm: async (codigo: string) => {
        if (!codigo || codigo.trim().length !== 6) {
          Swal.showValidationMessage('Ingresa un código de 6 dígitos');
          return false;
        }
        const verificado = await verificarTOTP(secret, codigo);
        if (!verificado) {
          Swal.showValidationMessage('Código incorrecto o expirado');
          return false;
        }
        return true;
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        await completarLogin(userData, resolvedSchool);
      }
    });
  };

  const handleLoginBiometrico = async () => {
    const cedulaHuella = localStorage.getItem('sigae_tiene_huella');
    if (!cedulaHuella) return;

    try {
      const publicKeyCredentialRequestOptions: any = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        userVerification: "preferred",
        timeout: 60000
      };
      const assertion = await navigator.credentials.get({ publicKey: publicKeyCredentialRequestOptions }) as any;
      if (!assertion) return;

      setLoading(true);
      setErrorMsg('');

      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('cedula', String(cedulaHuella))
        .maybeSingle();

      if (error || !data || data.estado !== 'Activo') {
        setErrorMsg('Usuario bloqueado o no encontrado.');
        setLoading(false);
        return;
      }

      let rawId = Array.from(new Uint8Array(assertion.rawId)).map(b => b.toString(16).padStart(2, '0')).join('');
      if (data.credencial_biometrica !== rawId) {
        setErrorMsg('La huella o PIN proporcionado no coincide con el registrado en tu cuenta.');
        setLoading(false);
        return;
      }

      // Verify school access
      const resolvedSchool = await verifySchoolAccess(data);
      if (!resolvedSchool) {
        setErrorMsg('Su usuario no cuenta con accesos configurados para ningún plantel.');
        setLoading(false);
        return;
      }

      // Check 2FA
      let pregJSON: any = {};
      if (data.preguntas_seguridad) {
        try {
          pregJSON = typeof data.preguntas_seguridad === 'string'
            ? JSON.parse(data.preguntas_seguridad)
            : data.preguntas_seguridad;
        } catch(e) {}
      }

      if (pregJSON && pregJSON.otp_enabled === true && pregJSON.otp_secret) {
        setLoading(false);
        pedirCodigo2FA(data, pregJSON.otp_secret, resolvedSchool);
        return;
      }

      await completarLogin(data, resolvedSchool);
    } catch (e: any) {
      console.error(e);
      if (e.name !== "NotAllowedError") {
        setErrorMsg('No se pudo procesar la verificación biométrica.');
      }
    }
    setLoading(false);
  };

  const iniciarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clave) {
      setErrorMsg('Ingrese contraseña.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Volvemos a consultar para tener los datos de intentos_fallidos más recientes
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('cedula', cedula)
        .maybeSingle();

      if (error || !data) {
        setErrorMsg('Usuario no encontrado.');
        setLoading(false);
        return;
      }

      if (data.estado === 'Bloqueado') {
        setErrorMsg('Usuario BLOQUEADO permanentemente.');
        setLoading(false);
        return;
      }

      if (data.bloqueo_hasta) {
        const bloqueo = new Date(data.bloqueo_hasta).getTime();
        const ahora = new Date().getTime();
        if (bloqueo > ahora) {
          const faltan = Math.ceil((bloqueo - ahora) / 60000);
          setErrorMsg(`Cuenta bloqueada temporalmente por seguridad. Intente en ${faltan} minutos.`);
          setLoading(false);
          return;
        }
      }

      if (data.clave !== clave) {
        const intentos = (data.intentos_fallidos || 0) + 1;
        if (intentos >= 3) {
          const bloqueoHasta = new Date(new Date().getTime() + 30 * 60000).toISOString();
          await supabase.from('usuarios').update({ intentos_fallidos: 0, bloqueo_hasta: bloqueoHasta }).eq('cedula', cedula);
          setErrorMsg('Ha superado los 3 intentos fallidos. Su cuenta ha sido bloqueada por 30 minutos.');
        } else {
          await supabase.from('usuarios').update({ intentos_fallidos: intentos }).eq('cedula', cedula);
          setErrorMsg(`Contraseña incorrecta. Intento ${intentos} de 3. Le quedan ${3 - intentos} ${3 - intentos === 1 ? 'intento' : 'intentos'}.`);
        }
        setLoading(false);
        return;
      }

      // Login exitoso -> Restablecer intentos fallidos
      if (data.intentos_fallidos > 0 || data.bloqueo_hasta) {
        await supabase.from('usuarios').update({ intentos_fallidos: 0, bloqueo_hasta: null }).eq('cedula', cedula);
      }

      // Verify school access
      const resolvedSchool = await verifySchoolAccess(data);
      if (!resolvedSchool) {
        const activeSchool = school || (localStorage.getItem('sigae_escuela_codigo') as 'sb' | 'lb') || 'sb';
        const schoolNombre = activeSchool === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar';
        setErrorMsg(`El acceso para el rol "${data.rol}" en ${schoolNombre} está temporalmente inhabilitado por la dirección.`);
        setLoading(false);
        return;
      }

      // Check 2FA
      let pregJSON: any = {};
      if (data.preguntas_seguridad) {
        try {
          pregJSON = typeof data.preguntas_seguridad === 'string'
            ? JSON.parse(data.preguntas_seguridad)
            : data.preguntas_seguridad;
        } catch(e) {}
      }

      if (pregJSON && pregJSON.otp_enabled === true && pregJSON.otp_secret) {
        setLoading(false);
        pedirCodigo2FA(data, pregJSON.otp_secret, resolvedSchool);
        return;
      }

      await completarLogin(data, resolvedSchool);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de conexión.');
    }
    setLoading(false);
  };

  const registrarInvitado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invNombres || !invApellidos || !invMotivo) {
      setErrorMsg('Nombres, Apellidos y Motivo son obligatorios.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // Check maintenance mode and visitors blocking for the target school
      const escuelaID = (school || localStorage.getItem('sigae_escuela_codigo') || 'sb') as 'sb' | 'lb';
      const schoolNombre = escuelaID === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar';

      const { data: ajustes } = await supabase
        .from('ajustes_globales')
        .select('clave, valor')
        .in('clave', ['mantenimiento_sb', 'mantenimiento_lb', 'mantenimiento_activo', 'bloquear_invitados_sb', 'bloquear_invitados_lb', 'bloquear_invitados']);

      const maintKey = escuelaID === 'sb' ? 'mantenimiento_sb' : 'mantenimiento_lb';
      const schoolMaint = ajustes?.find(x => x.clave === maintKey);
      const globalMaint = ajustes?.find(x => x.clave === 'mantenimiento_activo');
      const isSchoolInMaint = schoolMaint ? (schoolMaint.valor === 'true') : (globalMaint?.valor === 'true');

      if (isSchoolInMaint) {
        setErrorMsg(`La institución (${schoolNombre}) se encuentra en mantenimiento. No se permiten accesos de visitantes.`);
        setLoading(false);
        return;
      }

      const guestKey = escuelaID === 'sb' ? 'bloquear_invitados_sb' : 'bloquear_invitados_lb';
      const guestSchool = ajustes?.find(x => x.clave === guestKey);
      const guestGlobal = ajustes?.find(x => x.clave === 'bloquear_invitados');
      const isGuestBlocked = guestSchool ? (guestSchool.valor === 'true') : (guestGlobal?.valor === 'true');

      if (isGuestBlocked) {
        setErrorMsg(`El registro e ingreso de invitados y visitantes para ${schoolNombre} está temporalmente inhabilitado por la dirección.`);
        setLoading(false);
        return;
      }

      // Insertar en la tabla de invitados
      const { error: insertError } = await supabase
        .from('invitados')
        .insert([{
          cedula: cedula,
          nombres: invNombres,
          apellidos: invApellidos,
          correo: invCorreo || null,
          telefono: invTelefono || null,
          razon_visita: invMotivo,
          escuela_id: escuelaID
        }]);

      if (insertError) {
        console.error('Error insertando invitado:', insertError);
        setErrorMsg('Error al guardar el registro en la base de datos.');
        setLoading(false);
        return;
      }

      const guestData = {
        id: 'guest-' + Date.now(),
        nombre: `${invNombres} ${invApellidos}`.trim(),
        nombres: invNombres,
        apellidos: invApellidos,
        cedula: cedula,
        rol: 'Invitado',
        email: invCorreo,
        telefono: invTelefono
      };
      localStorage.setItem('sesion_sigae', 'activa');
      localStorage.setItem('usuario_sigae', JSON.stringify(guestData));
      onLogin(guestData);
    } catch (err) {
      setErrorMsg('Error al registrar visita.');
    }
    setLoading(false);
  };

  const resetForm = () => {
    setLoginStep('cedula');
    setClave('');
    setErrorMsg('');
    setUsuarioDetalle(null);
  };

  const handleOlvidoClave = async () => {
    if (!cedula) {
      setErrorMsg('Por favor, ingrese su número de cédula en el recuadro para recuperar su contraseña.');
      const inp = document.getElementById('input-cedula-login');
      if (inp) inp.focus();
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('preguntas_seguridad, bloqueo_hasta, estado, email')
        .eq('cedula', cedula)
        .maybeSingle();
      
      if (error || !data) {
        setErrorMsg('Usuario no encontrado.');
        setLoading(false);
        return;
      }
      if (data.estado === 'Bloqueado') {
        setErrorMsg('Usuario bloqueado permanentemente.');
        setLoading(false);
        return;
      }
      
      let pregJSON: any = {};
      try {
        pregJSON = typeof data.preguntas_seguridad === 'string' 
          ? JSON.parse(data.preguntas_seguridad) 
          : (data.preguntas_seguridad || {});
      } catch(e) {}
      
      const p1 = pregJSON.pregunta_1;
      const p2 = pregJSON.pregunta_2;
      if (!p1 && !p2) {
        setErrorMsg('Este usuario no tiene preguntas de seguridad configuradas. Contacte a soporte.');
        setLoading(false);
        return;
      }
      
      const nP = (Math.random() < 0.5 && p1) ? 1 : (p2 ? 2 : 1);
      setPreguntaRecuperacion(nP === 1 ? p1 : p2);
      setPreguntaRecuperacionIndice(nP as 1 | 2);
      setRecCorreo('');
      setRecRespuesta('');
      setRecClave1('');
      setRecClave2('');
      setLoginStep('recuperacion');
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de conexión.');
    }
    setLoading(false);
  };

  const procesarRecuperacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recCorreo || !recRespuesta || !recClave1 || !recClave2) {
      setErrorMsg('Complete todos los campos de recuperación.');
      return;
    }
    if (recClave1 !== recClave2) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }
    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.])[A-Za-z\d@$!%*?&#.]{8,}$/.test(recClave1)) {
      setErrorMsg('Contraseña débil. Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 símbolo (@$!%*?&#.).');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('preguntas_seguridad, email')
        .eq('cedula', cedula)
        .maybeSingle();
        
      if (error || !data) {
        setErrorMsg('Error al verificar datos.');
        setLoading(false);
        return;
      }
      
      if (String(data.email).trim().toLowerCase() !== recCorreo.trim().toLowerCase()) {
        setErrorMsg('El correo ingresado no coincide con el registrado.');
        setLoading(false);
        return;
      }
      
      let pregJSON: any = {};
      try {
        pregJSON = typeof data.preguntas_seguridad === 'string'
          ? JSON.parse(data.preguntas_seguridad)
          : (data.preguntas_seguridad || {});
      } catch(e) {}
      
      const rReal = preguntaRecuperacionIndice === 1 ? pregJSON.respuesta_1 : pregJSON.respuesta_2;
      if (String(recRespuesta).trim().toLowerCase() !== String(rReal).trim().toLowerCase()) {
        setErrorMsg('Respuesta de seguridad incorrecta.');
        setLoading(false);
        return;
      }
      
      const { error: updErr } = await supabase
        .from('usuarios')
        .update({ 
          clave: recClave1, 
          intentos_fallidos: 0, 
          bloqueo_hasta: null, 
          fecha_ult_clave: new Date().toISOString() 
        })
        .eq('cedula', cedula);
        
      if (updErr) {
        setErrorMsg('Error al guardar la nueva contraseña.');
        setLoading(false);
        return;
      }
      
      if ((window as any).Swal) {
        (window as any).Swal.fire('¡Éxito!', 'Contraseña restablecida correctamente.', 'success').then(() => {
          setLoginStep('clave');
          setClave('');
        });
      } else {
        alert('Contraseña restablecida correctamente.');
        setLoginStep('clave');
        setClave('');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de conexión.');
    }
    setLoading(false);
  };

  const solicitarSoporte = async () => {
    if (!cedula) return;
    if ((window as any).Swal) {
      (window as any).Swal.fire({
        title: 'Soporte Técnico',
        text: '¿Desea enviar una solicitud al administrador para resetear su cuenta y volver a configurarla desde cero?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, enviar solicitud',
        cancelButtonText: 'Cancelar'
      }).then(async (result: any) => {
        if (result.isConfirmed) {
          setLoading(true);
          try {
            const escDestino = school || localStorage.getItem('sigae_escuela_codigo') || 'sb';

            // Insertar en notificaciones_globales para activar alerta en tiempo real al administrador
            await supabase.from('notificaciones_globales').insert([{
              escuela_codigo: escDestino,
              titulo: '⚠️ Solicitud de Reseteo de Cuenta',
              cuerpo: `El usuario con cédula ${cedula} olvidó sus datos y solicita reseteo de cuenta en Gestión de Usuarios.`,
              tipo: 'seguridad'
            }]);

            // Insertar confirmación personal para el usuario solicitante
            await supabase.from('notificaciones_globales').insert([{
              escuela_codigo: escDestino,
              titulo: '📨 Solicitud de Restablecimiento Enviada',
              cuerpo: 'Tu solicitud de reseteo de cuenta ha sido enviada al administrador escolar. Se te notificará por esta vía y por WhatsApp cuando sea procesada.',
              tipo: `usuario:${cedula}`
            }]);

            // Actualizar el estado del usuario
            await supabase.from('usuarios').update({ estado: 'Requiere Reseteo', solicito_reseteo: true }).eq('cedula', cedula);

            try {
              await supabase.from('notificaciones').insert([{
                id_notificacion: "NOT-" + new Date().getTime(),
                titulo: 'Solicitud de Reseteo de Clave',
                mensaje: `El usuario con cédula ${cedula} olvidó sus datos y solicita reseteo de cuenta.`,
                tipo: 'alerta',
                leido: false,
                roles_destino: 'Administrador,Director',
                id_escuela: escDestino
              }]);
            } catch (e) {}

            (window as any).Swal.fire({
              icon: 'success',
              title: 'Solicitud Enviada',
              text: 'El administrador ha recibido la notificación y procesará su solicitud pronto.',
              confirmButtonText: 'Entendido'
            }).then(() => {
              resetForm();
            });
          } catch (err) {
            console.error(err);
            (window as any).Swal.fire('Error', 'No se pudo enviar la solicitud al servidor.', 'error');
          }
          setLoading(false);
        }
      });
    } else {
      alert('Funcionalidad de soporte disponible.');
    }
  };

  const getFuerzaClave = (val: string) => {
    let fuerza = 0;
    if (val.length >= 8) fuerza += 25;
    if (/[A-Z]/.test(val)) fuerza += 25;
    if (/[a-z]/.test(val)) fuerza += 25;
    if (/[0-9]/.test(val)) fuerza += 15;
    if (/[^A-Za-z0-9]/.test(val)) fuerza += 10;
    return fuerza;
  };

  const selectedSchool = school || 'sb';
  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col justify-between overflow-x-hidden bg-[#f0f4f9] selection:bg-sky-500 selection:text-white">
      {/* 1. Fondo de red cibernetica interactiva */}
      <TechNetworkBackground theme="light" />

      {/* 2. Contenedor Central */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center px-4 py-4 sm:py-6">
        {/* Cabecera con Escudo y Titulo */}
        <div className="flex flex-col items-center text-center mb-3 sm:mb-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative mb-2 select-none"
          >
            <div className="absolute inset-0 bg-sky-400/20 blur-xl rounded-full"></div>
            <img 
              src="/img/sigae-logo.png" 
              alt="Escudo SIGAE" 
              className="relative w-16 h-16 sm:w-20 md:w-24 h-auto drop-shadow-md object-contain"
            />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-base sm:text-xl md:text-2xl font-black text-[#0f2e59] tracking-tight"
          >
            Sistema Integral de Gestión y Administración Escolar
          </motion.h1>
        </div>

        {/* Tarjeta Flotante Principal */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[440px] bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-xl shadow-sky-950/10 border border-slate-100 p-5 sm:p-6 relative z-10 transition-all"
        >
          {/* Mensaje de Error si existe */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs shadow-xs"
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{errorMsg}</div>
            </motion.div>
          )}

          {/* Selector de Escuela Activa */}
          <div className="mb-4">
            <div className="flex bg-slate-100/90 p-1 rounded-xl gap-1 border border-slate-200/60">
              <button
                type="button"
                onClick={() => handleSchoolChange('sb')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedSchool === 'sb'
                    ? 'bg-white text-sky-700 shadow-xs shadow-slate-300/50'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <School className="w-3.5 h-3.5" />
                <span>UE Santa Bárbara</span>
              </button>
              <button
                type="button"
                onClick={() => handleSchoolChange('lb')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedSchool === 'lb'
                    ? 'bg-white text-sky-700 shadow-xs shadow-slate-300/50'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <School className="w-3.5 h-3.5" />
                <span>UE Libertador Bolívar</span>
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* ========================================================
                PASO 1: CEDULA O USUARIO
            ======================================================== */}
            {loginStep === 'cedula' && (
              <motion.div
                key="paso-cedula"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <User3DIcon size={36} />
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Iniciar Sesión</h2>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight">
                      Ingresa tu cédula o usuario para continuar
                    </p>
                  </div>
                </div>

                <form onSubmit={verificarCedula} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Cédula o Usuario
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4 text-sky-600" />
                      </div>
                      <input
                        id="input-cedula-login"
                        type="text"
                        autoFocus
                        required
                        value={cedula}
                        onChange={(e) => {
                          setCedula(e.target.value.trim());
                          if (errorMsg) setErrorMsg('');
                        }}
                        placeholder="Ej: 12345678 o usuario"
                        className="w-full h-11 pl-9 pr-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d93d0] focus:bg-white text-slate-800 font-semibold transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !cedula}
                    className="w-full h-11 bg-gradient-to-r from-[#2189cf] to-[#2d93d0] hover:from-[#1c78b8] hover:to-[#2189cf] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-sky-600/25 hover:shadow-lg hover:shadow-sky-600/35 active:scale-[0.99] flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Verificando...</span>
                      </>
                    ) : (
                      <>
                        <span>Continuar</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Acceso Biometrico rapido si esta configurado en el dispositivo */}
                {localStorage.getItem('sigae_tiene_huella') &&
                 localStorage.getItem('sigae_huella_habilitada') !== 'false' && (
                  <button
                    type="button"
                    onClick={handleLoginBiometrico}
                    disabled={loading}
                    className="w-full mt-2.5 h-10 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Fingerprint className="w-4 h-4 text-emerald-600" />
                    <span>Ingresar con Huella / PIN</span>
                  </button>
                )}

                <div className="mt-3.5 flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleOlvidoClave}
                    className="text-[#2189cf] hover:text-[#1c78b8] font-bold hover:underline transition-colors focus:outline-none cursor-pointer"
                  >
                    ¿Olvidé mi contraseña?
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginStep('invitado')}
                    className="text-slate-500 hover:text-slate-700 font-medium hover:underline transition-colors focus:outline-none cursor-pointer"
                  >
                    Visitante / Invitado
                  </button>
                </div>
              </motion.div>
            )}

            {/* ========================================================
                PASO 2: CONTRASEÑA CON PREVIEW DEL USUARIO
            ======================================================== */}
            {loginStep === 'clave' && (
              <motion.div
                key="paso-clave"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Perfil Reconocido */}
                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-sky-50 to-blue-50/50 border border-sky-100 rounded-2xl">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#2189cf] to-sky-400 flex items-center justify-center text-white font-black text-sm shadow-sm overflow-hidden shrink-0">
                    {usuarioDetalle?.foto ? (
                      <img src={usuarioDetalle.foto} alt={nombreUsuario} className="w-full h-full object-cover" />
                    ) : (
                      <span>{nombreUsuario ? nombreUsuario.charAt(0).toUpperCase() : 'U'}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {nombreUsuario || 'Usuario'}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                        {usuarioDetalle?.rol || 'Personal SIGAE'}
                      </span>
                      {usuarioDetalle?.cargo && (
                        <span className="text-[10px] text-slate-500 truncate">
                          • {usuarioDetalle.cargo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <form onSubmit={iniciarSesion} className="space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Contraseña Institucional
                      </label>
                      <button
                        type="button"
                        onClick={handleOlvidoClave}
                        className="text-[11px] text-[#2189cf] hover:text-[#1c78b8] font-bold hover:underline transition-colors focus:outline-none cursor-pointer"
                      >
                        ¿Olvidé mi contraseña?
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4 text-sky-600" />
                      </div>
                      <input
                        type={showClave ? 'text' : 'password'}
                        autoFocus
                        required
                        value={clave}
                        onChange={(e) => {
                          setClave(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        placeholder="••••••••"
                        className="w-full h-11 pl-9 pr-10 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d93d0] focus:bg-white text-slate-800 font-semibold transition-all shadow-xs tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={() => setShowClave(!showClave)}
                        className="absolute right-2.5 inset-y-0 my-auto h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors rounded-lg focus:outline-none cursor-pointer"
                        title={showClave ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {showClave ? <EyeOff className="w-4 h-4 text-sky-600" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !clave}
                    className="w-full h-11 bg-gradient-to-r from-[#2189cf] to-[#2d93d0] hover:from-[#1c78b8] hover:to-[#2189cf] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-sky-600/25 hover:shadow-lg hover:shadow-sky-600/35 active:scale-[0.99] flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Ingresando...</span>
                      </>
                    ) : (
                      <>
                        <span>Ingresar al Sistema</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {localStorage.getItem('sigae_tiene_huella') && (
                  <button
                    type="button"
                    onClick={handleLoginBiometrico}
                    disabled={loading}
                    className="w-full h-10 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Fingerprint className="w-4 h-4 text-emerald-600" />
                    <span>Ingresar con Huella / PIN</span>
                  </button>
                )}

                <div className="pt-2 text-center border-t border-slate-100">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs text-slate-500 hover:text-sky-600 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Ingresar con otra cédula o usuario</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ========================================================
                PASO 3: RECUPERACIÓN CON PREGUNTAS DE SEGURIDAD
            ======================================================== */}
            {loginStep === 'recuperacion' && (
              <motion.div
                key="paso-recuperacion"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                className="space-y-3.5"
              >
                <div className="flex items-center gap-2.5 pb-1 border-b border-slate-100">
                  <Security3DIcon size={30} />
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800">Restablecer Contraseña</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Verificación de seguridad</p>
                  </div>
                </div>

                <form onSubmit={procesarRecuperacion} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Pregunta de Seguridad
                    </label>
                    <div className="p-2.5 bg-sky-50/70 border border-sky-100 rounded-xl text-xs font-semibold text-sky-900 leading-snug">
                      {preguntaRecuperacion || 'Pregunta registrada'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Tu Respuesta
                    </label>
                    <input
                      type="text"
                      required
                      value={recRespuesta}
                      onChange={(e) => setRecRespuesta(e.target.value)}
                      placeholder="Escribe tu respuesta exacta"
                      className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d93d0] focus:bg-white text-slate-800 font-medium transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Correo Electrónico Registrado
                    </label>
                    <input
                      type="email"
                      required
                      value={recCorreo}
                      onChange={(e) => setRecCorreo(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d93d0] focus:bg-white text-slate-800 font-medium transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Nueva Clave
                      </label>
                      <input
                        type={showRecClave1 ? 'text' : 'password'}
                        required
                        value={recClave1}
                        onChange={(e) => setRecClave1(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d93d0] text-slate-800 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        Confirmar Clave
                      </label>
                      <input
                        type={showRecClave2 ? 'text' : 'password'}
                        required
                        value={recClave2}
                        onChange={(e) => setRecClave2(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d93d0] text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 cursor-pointer"
                  >
                    {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-700 font-medium text-center cursor-pointer"
                  >
                    Cancelar y volver
                  </button>
                </form>
              </motion.div>
            )}

            {/* ========================================================
                PASO 4: PRIMER INGRESO (CONFIGURAR CLAVE Y 2 PREGUNTAS)
            ======================================================== */}
            {loginStep === 'primer-ingreso' && (
              <motion.div
                key="paso-primer-ingreso"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2.5 pb-1 border-b border-slate-100">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800">Bienvenido al SIGAE</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Configura tu contraseña y preguntas</p>
                  </div>
                </div>

                <form onSubmit={procesarPrimerIngreso} className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nueva Clave</label>
                      <input
                        type={showPiClave1 ? 'text' : 'password'}
                        required
                        value={piClave1}
                        onChange={handlePiClave1Change}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Confirmar Clave</label>
                      <input
                        type={showPiClave2 ? 'text' : 'password'}
                        required
                        value={piClave2}
                        onChange={e => setPiClave2(e.target.value)}
                        placeholder="Repetir clave"
                        className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        required
                        value={piEmail}
                        onChange={e => setPiEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Teléfono</label>
                      <input
                        type="tel"
                        required
                        value={piTelefono}
                        onChange={e => setPiTelefono(e.target.value)}
                        placeholder="04121234567"
                        className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Pregunta de Seguridad 1</label>
                    <select
                      value={piPreg1}
                      onChange={e => setPiPreg1(e.target.value)}
                      required
                      className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 mb-1"
                    >
                      <option value="">Seleccione una pregunta...</option>
                      {preguntasSeguridad.map(p => (
                        <option key={p.pregunta} value={p.pregunta}>{p.pregunta}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      value={piResp1}
                      onChange={e => setPiResp1(e.target.value)}
                      placeholder="Respuesta a la pregunta 1"
                      className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Pregunta de Seguridad 2</label>
                    <select
                      value={piPreg2}
                      onChange={e => setPiPreg2(e.target.value)}
                      required
                      className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 mb-1"
                    >
                      <option value="">Seleccione una pregunta...</option>
                      {preguntasSeguridad.map(p => (
                        <option key={p.pregunta} value={p.pregunta}>{p.pregunta}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      value={piResp2}
                      onChange={e => setPiResp2(e.target.value)}
                      placeholder="Respuesta a la pregunta 2"
                      className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md mt-2 cursor-pointer"
                  >
                    {loading ? 'Configurando cuenta...' : 'Completar Activación'}
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full py-1 text-xs text-slate-500 hover:text-slate-700 font-medium text-center cursor-pointer"
                  >
                    Cancelar
                  </button>
                </form>
              </motion.div>
            )}

            {/* ========================================================
                PASO 5: REGISTRO DE VISITANTE / INVITADO
            ======================================================== */}
            {loginStep === 'invitado' && (
              <motion.div
                key="paso-invitado"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2.5 pb-1 border-b border-slate-100">
                  <Users className="w-5 h-5 text-indigo-500" />
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800">Visitantes e Invitados</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Ingreso temporal institucional</p>
                  </div>
                </div>

                <form onSubmit={registrarInvitado} className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Nombres</label>
                      <input
                        type="text"
                        required
                        value={invNombres}
                        onChange={e => setInvNombres(e.target.value)}
                        placeholder="Nombres"
                        className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Apellidos</label>
                      <input
                        type="text"
                        required
                        value={invApellidos}
                        onChange={e => setInvApellidos(e.target.value)}
                        placeholder="Apellidos"
                        className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Correo</label>
                      <input
                        type="email"
                        required
                        value={invCorreo}
                        onChange={e => setInvCorreo(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Teléfono</label>
                      <input
                        type="tel"
                        required
                        value={invTelefono}
                        onChange={e => setInvTelefono(e.target.value)}
                        placeholder="04121234567"
                        className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Motivo de la Visita</label>
                    <textarea
                      required
                      rows={2}
                      value={invMotivo}
                      onChange={e => setInvMotivo(e.target.value)}
                      placeholder="Indique brevemente el motivo..."
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md mt-2 cursor-pointer"
                  >
                    {loading ? 'Registrando...' : 'Registrar e Ingresar'}
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full py-1 text-xs text-slate-500 hover:text-slate-700 font-medium text-center cursor-pointer"
                  >
                    Volver al login
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enlace al Portal Informativo */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center">
            <Link
              to={`/portal/${selectedSchool}`}
              className="text-[11px] font-bold text-slate-500 hover:text-sky-700 inline-flex items-center gap-1 transition-colors"
            >
              <span>Ver Portal Web Informativo de la Institución</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Sello Oficial MPPE */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col items-center select-none">
            <img
              src="/img/ministerio-educacion-logo.png"
              alt="Ministerio del Poder Popular para la Educación"
              className="h-7 w-auto object-contain opacity-95"
            />
            <span className="text-[9.5px] font-bold text-slate-400 mt-1 tracking-wider uppercase">
              República Bolivariana de Venezuela • MPPE
            </span>
          </div>
        </motion.div>
      </div>

      {/* 3. Footer Bicentenario de esquina a esquina sin separación */}
      <footer className="w-full shrink-0 flex justify-center items-end bg-transparent pointer-events-none z-10">
        <img
          src="/img/cintillo-footer-venezuela.png"
          alt="Bicentenario Venezuela"
          className="w-full h-auto max-h-[110px] sm:max-h-[135px] md:max-h-[155px] object-cover object-bottom select-none block"
        />
      </footer>
    </div>
  );
};

