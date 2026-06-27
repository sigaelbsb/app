import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const Auth = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [view, setView] = useState<'selector' | 'login'>('selector');
  const [school, setSchool] = useState<'sb' | 'lb' | null>(null);
  
  // Login Steps: 'cedula' -> 'clave' OR 'invitado' OR 'recuperacion' OR 'primer-ingreso'
  const [loginStep, setLoginStep] = useState<'cedula' | 'clave' | 'invitado' | 'recuperacion' | 'primer-ingreso'>('cedula');
  
  const [cedula, setCedula] = useState('');
  const [clave, setClave] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState(''); // To show in Clave step
  
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
  


  useEffect(() => {
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
        Swal.fire('¡Éxito!', 'Cuenta configurada correctamente. Inicie sesión con su nueva contraseña.', 'success').then(() => {
          setLoginStep('clave');
          setClave('');
          // Clear first login fields
          setPiClave1('');
          setPiClave2('');
          setPiEmail('');
          setPiTelefono('');
          setPiPreg1('');
          setPiResp1('');
          setPiPreg2('');
          setPiResp2('');
        });
      } else {
        alert('Cuenta configurada correctamente. Inicie sesión con su nueva contraseña.');
        setLoginStep('clave');
        setClave('');
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
        // No existe -> Invitado (verificar mantenimiento e inhabilitación de invitados antes)
        try {
          const [maintRes, guestRes] = await Promise.all([
            supabase.from('ajustes_globales').select('valor').eq('clave', 'mantenimiento_activo').maybeSingle(),
            supabase.from('ajustes_globales').select('valor').eq('clave', 'bloquear_invitados').maybeSingle()
          ]);

          if (maintRes.data && maintRes.data.valor === 'true') {
            setErrorMsg('El sistema se encuentra en mantenimiento global y solo se permitirá el acceso a los administradores y personal autorizado.');
            setLoading(false);
            return;
          }

          if (guestRes.data && guestRes.data.valor === 'true') {
            setErrorMsg('El registro e ingreso de invitados y visitantes está temporalmente inhabilitado por la dirección.');
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
          const { data: maintData } = await supabase
            .from('ajustes_globales')
            .select('valor')
            .eq('clave', 'mantenimiento_activo')
            .maybeSingle();

          if (maintData && maintData.valor === 'true') {
            let hasMaintAccess = false;
            if (data.rol === 'SuperAdmin') {
              hasMaintAccess = true;
            } else {
              const activeSchool = school || (localStorage.getItem('sigae_escuela_codigo') as 'sb' | 'lb') || 'sb';
              const { data: roleData } = await supabase
                .from('roles')
                .select('permisos')
                .eq('nombre', data.rol)
                .maybeSingle();

              if (roleData && roleData.permisos) {
                const parsed = typeof roleData.permisos === 'string' ? JSON.parse(roleData.permisos) : roleData.permisos;
                const escPerms = parsed[activeSchool] || {};
                if (escPerms["Ingresar en Mantenimiento"]?.ver === true) {
                  hasMaintAccess = true;
                }
              }
            }

            if (!hasMaintAccess) {
              setErrorMsg('El sistema se encuentra en mantenimiento global y solo se permitirá el acceso a los administradores y personal autorizado.');
              setLoading(false);
              return;
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
            setNombreUsuario(data.nombre_completo || `${data.nombres || ''} ${data.apellidos || ''}`.trim());
            if (data.primer_ingreso === true || !data.clave) {
              await cargarPreguntas();
              setLoginStep('primer-ingreso');
            } else {
              setLoginStep('clave');
            }
          }
        } else {
          setNombreUsuario(data.nombre_completo || `${data.nombres || ''} ${data.apellidos || ''}`.trim());
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
    if (userData.rol === 'SuperAdmin') {
      return school || (localStorage.getItem('sigae_escuela_codigo') as 'sb' | 'lb') || 'sb';
    }

    try {
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('permisos')
        .eq('nombre', userData.rol)
        .maybeSingle();

      if (roleError || !roleData) {
        return null;
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
          return privs['__acceso_plantel__']?.ver === true;
        }
        for (let mod in privs) {
          if (privs[mod] && (privs[mod].ver === true || privs[mod] === true)) return true;
        }
        return false;
      };

      const selectedSchoolCode = school || (localStorage.getItem('sigae_escuela_codigo') as 'sb' | 'lb') || 'sb';
      if (tieneAcceso(selectedSchoolCode)) {
        return selectedSchoolCode;
      }

      const otherSchool = selectedSchoolCode === 'sb' ? 'lb' : 'sb';
      if (tieneAcceso(otherSchool)) {
        return otherSchool;
      }

      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const completarLogin = async (userData: any, resolvedSchool?: 'sb' | 'lb') => {
    const activeSchool = resolvedSchool || school || (localStorage.getItem('sigae_escuela_codigo') as 'sb' | 'lb') || 'sb';
    
    // Check maintenance mode
    try {
      const { data: maintData } = await supabase
        .from('ajustes_globales')
        .select('valor')
        .eq('clave', 'mantenimiento_activo')
        .maybeSingle();

      if (maintData && maintData.valor === 'true') {
        let hasMaintAccess = false;
        if (userData.rol === 'SuperAdmin') {
          hasMaintAccess = true;
        } else {
          const { data: roleData } = await supabase
            .from('roles')
            .select('permisos')
            .eq('nombre', userData.rol)
            .maybeSingle();

          if (roleData && roleData.permisos) {
            const parsed = typeof roleData.permisos === 'string' ? JSON.parse(roleData.permisos) : roleData.permisos;
            const escPerms = parsed[activeSchool] || {};
            if (escPerms["Ingresar en Mantenimiento"]?.ver === true) {
              hasMaintAccess = true;
            }
          }
        }

        if (!hasMaintAccess) {
          setErrorMsg('El sistema se encuentra en mantenimiento global y solo se permitirá el acceso a los administradores y personal autorizado.');
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error("Error al comprobar mantenimiento en login:", err);
    }

    const cleanUserData = {
      id: userData.id || userData.id_usuario,
      nombre: userData.nombre_completo || userData.nombre,
      cedula: userData.cedula,
      rol: userData.rol,
      cargo: userData.cargo || '',
      id_escuela: activeSchool,
      nombre_escuela: activeSchool === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar',
      email: userData.email || userData.correo
    };
    localStorage.setItem('sesion_sigae', 'activa');
    localStorage.setItem('sigae_escuela_codigo', activeSchool);
    localStorage.setItem('sigae_escuela_activa', activeSchool === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
    localStorage.setItem('usuario_sigae', JSON.stringify(cleanUserData));
    localStorage.removeItem('sigae_bloqueado_total');
    
    auditarAcceso(userData.cedula, userData.nombre_completo || userData.nombre, 'Inicio de Sesión', 'El usuario accedió exitosamente al sistema.');
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
      // Check maintenance mode and visitors blocking
      const [maintRes, guestRes] = await Promise.all([
        supabase.from('ajustes_globales').select('valor').eq('clave', 'mantenimiento_activo').maybeSingle(),
        supabase.from('ajustes_globales').select('valor').eq('clave', 'bloquear_invitados').maybeSingle()
      ]);

      if (maintRes.data && maintRes.data.valor === 'true') {
        setErrorMsg('El sistema se encuentra en mantenimiento global. No se permiten accesos de visitantes.');
        setLoading(false);
        return;
      }

      if (guestRes.data && guestRes.data.valor === 'true') {
        setErrorMsg('El registro e ingreso de invitados y visitantes está temporalmente inhabilitado por la dirección.');
        setLoading(false);
        return;
      }

      // Insertar en la tabla de invitados
      const escuelaID = school || localStorage.getItem('sigae_escuela_codigo') || 'sb';
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
        nombre: invNombres,
        apellido: invApellidos,
        cedula: cedula,
        rol: 'Invitado',
        email: invCorreo
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
  };

  const handleOlvidoClave = async () => {
    if (!cedula) {
      setErrorMsg('Debe ingresar su cédula primero.');
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
            await supabase.from('notificaciones').insert([{
              id_notificacion: "NOT-" + new Date().getTime(),
              titulo: 'Solicitud de Reseteo de Clave',
              mensaje: `El usuario con cédula ${cedula} olvidó sus datos y solicita reseteo de cuenta.`,
              tipo: 'alerta',
              leido: false,
              roles_destino: 'Administrador,Director',
              id_escuela: school || localStorage.getItem('sigae_escuela_codigo') || 'sb'
            }]);
            
            await supabase.from('usuarios').update({ estado: 'Requiere Reseteo', solicito_reseteo: true }).eq('cedula', cedula);
            (window as any).Swal.fire('Solicitud Enviada', 'El administrador procesará su solicitud pronto. Por favor contacte con dirección.', 'success').then(() => {
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

  return (
    <div id="vista-login" className="contenedor-login contenedor-login-estilo flex-column min-vh-100" style={{ display: 'flex' }}>
      <div className="bg-login-dark-overlay"></div>

      <div className="m-auto w-100 d-flex justify-content-center align-items-center py-4 px-3">
        
        {view === 'selector' && (
          <div id="vista-selector" className="vista-seleccion-escuela activa animate__animated animate__fadeIn">
            <img src="/assets/img/sigae.png" alt="SIGAE" className="mb-3 img-fluid logo-selector-escuela" />
            <h1 className="fw-bolder text-white mb-1 mt-2 selector-titulo">Escuelas DEP Oriente</h1>
            <h4 className="text-white mb-5 fw-normal selector-subtitulo">Seleccione su Institución</h4>

            <div className="row g-4 justify-content-center mx-auto">
              <div className="col-md-6">
                <div onClick={() => handleSchoolSelect('sb')} style={{ cursor: 'pointer' }} className="tarjeta-escuela glassmorphism p-4 p-md-5 text-center h-100 d-flex flex-column">
                  <div className="mb-auto">
                    <img src="/assets/img/logo_sb.png" alt="Logo UE Santa Bárbara" className="mb-3 logo-escuela img-fluid" />
                    <h4 className="fw-bold text-dark mb-1">UE Santa Bárbara</h4>
                    <h6 className="text-primary fw-bold mb-3 lh-sm escuela-subtexto">
                      El Tejero<br/><small className="text-muted fw-normal">Municipio Ezequiel Zamora</small>
                    </h6>
                  </div>
                  <button className="btn btn-primario w-100 rounded-pill fw-bold mt-4 btn-seleccionar">Ingresar aquí</button>
                </div>
              </div>
              <div className="col-md-6">
                <div onClick={() => handleSchoolSelect('lb')} style={{ cursor: 'pointer' }} className="tarjeta-escuela glassmorphism p-4 p-md-5 text-center h-100 d-flex flex-column">
                  <div className="mb-auto">
                    <img src="/assets/img/logo_lb.png" alt="Logo UE Libertador Bolívar" className="mb-3 logo-escuela img-fluid" />
                    <h4 className="fw-bold text-dark mb-1">UE Libertador Bolívar</h4>
                    <h6 className="text-primary fw-bold mb-3 lh-sm escuela-subtexto">
                      Miraflores<br/><small className="text-muted fw-normal">Municipio Punceres</small>
                    </h6>
                  </div>
                  <button className="btn btn-primario w-100 rounded-pill fw-bold mt-4 btn-seleccionar">Ingresar aquí</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'login' && (
          <div id="vista-formulario" className="tarjeta-split animate__animated animate__zoomIn" style={{ display: 'flex' }}>
            <div className="panel-color">
              <div className="forma f-verde"></div>
              <div className="forma f-amarilla"></div>
              <div className="forma f-morada"></div>
              <div className="forma f-roja"></div>
              <div className="panel-contenido-z">
                <div className="logo-login-container">
                  <div className="logo-destello"></div>
                  <img 
                    src={school === 'sb' ? '/assets/img/logo_sb.png' : school === 'lb' ? '/assets/img/logo_lb.png' : '/assets/img/sigae.png'} 
                    id="img-logo-login" 
                    alt="Logo Escuela" 
                    className="logo-login-animado" 
                  />
                </div>
                <h2 id="txt-nombre-escuela-login" className="text-white">
                  {school === 'sb' ? <React.Fragment>UE Santa <br className="d-none d-md-block"/>Bárbara</React.Fragment> : <React.Fragment>UE Libertador <br className="d-none d-md-block"/>Bolívar</React.Fragment>}
                </h2>
                <h3 className="text-white opacity-75">Sistema Integral de Gestión y Administración Escolar</h3>
                <h1 className="text-white">¡Bienvenid@!</h1>
                <p className="text-white opacity-75">Accede a tu cuenta para gestionar toda la información institucional.</p>
                <button onClick={() => setView('selector')} className="btn btn-sm btn-light text-primary mt-3 fw-bold rounded-pill shadow-sm btn-fit">
                  <i className="bi bi-arrow-left me-1"></i> Cambiar Escuela
                </button>
              </div>
            </div>

            <div className="panel-form">
              <div className="login-formulario w-100 mx-auto login-form-container">
                
                {errorMsg && <div className="alert alert-danger animate__animated animate__headShake">{errorMsg}</div>}

                {/* PASO 1: CEDULA */}
                {loginStep === 'cedula' && (
                  <div id="paso-cedula" className="animate__animated animate__fadeIn">
                    <h4>Iniciar Sesión</h4>
                    <form onSubmit={verificarCedula}>
                      <label className="fw-bold text-muted small mb-2 ps-2">Cédula de Identidad</label>
                      <input 
                        type="number" 
                        className="form-control input-pill mb-4" 
                        placeholder="Ej: 12345678"
                        value={cedula}
                        onChange={(e) => setCedula(e.target.value)}
                      />
                      <button type="submit" disabled={loading} className="btn btn-primary w-100 btn-pill mb-3">
                        {loading ? 'Verificando...' : <React.Fragment>Continuar <i className="bi bi-arrow-right ms-1"></i></React.Fragment>}
                      </button>
                    </form>
                    
                    {localStorage.getItem('sigae_tiene_huella') && 
                     localStorage.getItem('sigae_huella_habilitada') !== 'false' && 
                     localStorage.getItem('sigae_bloqueado_total') !== 'true' && (
                      <div id="btn-biometrico-container" className="text-center mt-3 border-top pt-3" style={{ display: 'block' }}>
                        <button 
                          type="button" 
                          id="btn-biometrico-inicial"
                          onClick={handleLoginBiometrico} 
                          className="btn btn-outline-success w-100 btn-pill fw-bold btn-border-2"
                        >
                          <i className="bi bi-fingerprint fs-4 me-2 align-middle"></i>Ingresar con Huella / PIN
                        </button>
                        <small className="text-muted d-block mt-2">Acceso rápido configurado en este dispositivo</small>
                      </div>
                    )}
                  </div>
                )}

                {/* PASO 2: CLAVE */}
                {loginStep === 'clave' && (
                  <div id="paso-clave" className="animate__animated animate__fadeInRight" style={{ display: 'block' }}>
                    <h4>Contraseña</h4>
                    <div className="d-flex align-items-center bg-light p-2 rounded-pill mb-4 border px-3">
                        <i className="bi bi-person-circle fs-4 text-primary me-2"></i>
                        <span className="fw-bold text-dark text-truncate">{nombreUsuario}</span>
                    </div>
                    <form onSubmit={iniciarSesion}>
                      <label className="fw-bold text-muted small mb-2 ps-2">Clave de Acceso</label>
                      <div className="position-relative mb-4">
                        <input 
                          type={showClave ? 'text' : 'password'} 
                          className="form-control input-pill pe-5" 
                          placeholder="Ingresa tu contraseña"
                          value={clave}
                          onChange={(e) => setClave(e.target.value)}
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowClave(!showClave)} 
                          className="btn border-0 position-absolute end-0 top-50 translate-middle-y me-2"
                        >
                          <i className={`bi bi-eye${showClave ? '-slash' : ''} text-muted`}></i>
                        </button>
                      </div>
                      <button type="submit" disabled={loading} className="btn btn-primary w-100 btn-pill mb-3">
                        {loading ? 'Entrando...' : <React.Fragment>Ingresar <i className="bi bi-box-arrow-in-right ms-1"></i></React.Fragment>}
                      </button>
                    </form>
                    {localStorage.getItem('sigae_tiene_huella') && 
                     localStorage.getItem('sigae_huella_habilitada') !== 'false' && 
                     localStorage.getItem('sigae_bloqueado_total') !== 'true' && (
                      <div id="btn-biometrico-container-clave" className="text-center mt-3 border-top pt-3" style={{ display: 'block' }}>
                        <button 
                          type="button" 
                          id="btn-biometrico-inicial"
                          onClick={handleLoginBiometrico} 
                          className="btn btn-outline-success w-100 btn-pill fw-bold btn-border-2 mb-3"
                        >
                          <i className="bi bi-fingerprint fs-4 me-2 align-middle"></i>Ingresar con Huella / PIN
                        </button>
                      </div>
                    )}

                    <div className="text-center">
                        <button type="button" onClick={handleOlvidoClave} className="btn btn-link text-primary text-decoration-none small fw-bold mb-2">¿Olvidaste tu contraseña?</button><br/>
                        <button onClick={resetForm} className="btn btn-link text-muted text-decoration-none small">Volver al inicio</button>
                    </div>
                  </div>
                )}

                {/* PASO: RECUPERACION DE CONTRASEÑA */}
                {loginStep === 'recuperacion' && (
                  <div id="paso-recuperacion" className="animate__animated animate__fadeInRight" style={{ display: 'block' }}>
                    <h4>Recuperar Acceso</h4>
                    <form onSubmit={procesarRecuperacion}>
                      <div className="mb-3">
                        <label className="small fw-bold text-dark mb-2 ps-2">Correo Electrónico Registrado</label>
                        <input 
                          type="email" 
                          className="form-control input-pill" 
                          placeholder="correo@ejemplo.com"
                          value={recCorreo}
                          onChange={(e) => setRecCorreo(e.target.value)}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="small fw-bold text-dark mb-2 ps-2" id="lbl-pregunta-recuperacion">
                          {preguntaRecuperacion || 'Cargando pregunta...'}
                        </label>
                        <input 
                          type="text" 
                          className="form-control input-pill" 
                          placeholder="Respuesta exacta"
                          value={recRespuesta}
                          onChange={(e) => setRecRespuesta(e.target.value)}
                          required
                        />
                      </div>
                      <div className="position-relative mb-3">
                        <input 
                          type={showRecClave1 ? 'text' : 'password'} 
                          className="form-control input-pill pe-5" 
                          placeholder="Nueva Contraseña"
                          value={recClave1}
                          onChange={(e) => setRecClave1(e.target.value)}
                          required
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowRecClave1(!showRecClave1)} 
                          className="btn border-0 position-absolute end-0 top-50 translate-middle-y me-2"
                        >
                          <i className={`bi bi-eye${showRecClave1 ? '-slash' : ''} text-muted`}></i>
                        </button>
                      </div>
                      
                      <div className="progress mb-3 progress-clave" style={{ height: '6px' }}>
                        <div 
                          className={`progress-bar ${getFuerzaClave(recClave1) < 50 ? 'bg-danger' : getFuerzaClave(recClave1) < 75 ? 'bg-warning' : 'bg-success'}`} 
                          role="progressbar" 
                          style={{ width: `${getFuerzaClave(recClave1)}%` }}
                        ></div>
                      </div>

                      <div className="position-relative mb-4">
                        <input 
                          type={showRecClave2 ? 'text' : 'password'} 
                          className="form-control input-pill pe-5" 
                          placeholder="Confirmar Contraseña"
                          value={recClave2}
                          onChange={(e) => setRecClave2(e.target.value)}
                          required
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowRecClave2(!showRecClave2)} 
                          className="btn border-0 position-absolute end-0 top-50 translate-middle-y me-2"
                        >
                          <i className={`bi bi-eye${showRecClave2 ? '-slash' : ''} text-muted`}></i>
                        </button>
                      </div>

                      <button type="submit" disabled={loading} className="btn btn-primary w-100 btn-pill mb-3">
                        {loading ? 'Procesando...' : 'Restablecer Contraseña'}
                      </button>
                      
                      <button type="button" onClick={solicitarSoporte} className="btn btn-outline-danger w-100 btn-pill mb-3">
                        No recuerdo nada (Soporte)
                      </button>
                      
                      <div className="text-center">
                        <button type="button" onClick={() => setLoginStep('clave')} className="btn btn-link text-muted text-decoration-none">
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* PASO 3: INVITADO */}
                {loginStep === 'invitado' && (
                  <div id="paso-invitado" className="animate__animated animate__fadeInUp" style={{ display: 'block' }}>
                    <h4>Visitante</h4>
                    <p className="small text-muted mb-3">Ingresa tus datos para registrar tu visita.</p>
                    <form onSubmit={registrarInvitado}>
                      <input type="number" className="form-control input-pill mb-3" value={cedula} disabled />
                      <input type="text" className="form-control input-pill mb-3" placeholder="Nombres *" value={invNombres} onChange={e => setInvNombres(e.target.value)} />
                      <input type="text" className="form-control input-pill mb-3" placeholder="Apellidos *" value={invApellidos} onChange={e => setInvApellidos(e.target.value)} />
                      <input type="email" className="form-control input-pill mb-3" placeholder="Correo Electrónico" value={invCorreo} onChange={e => setInvCorreo(e.target.value)} />
                      <input type="text" className="form-control input-pill mb-3" placeholder="Número de Teléfono" value={invTelefono} onChange={e => setInvTelefono(e.target.value)} />
                      <input type="text" className="form-control input-pill mb-4" placeholder="Motivo de la Visita *" value={invMotivo} onChange={e => setInvMotivo(e.target.value)} />
                      
                      <button type="submit" disabled={loading} className="btn btn-primary w-100 btn-pill mb-3">Registrar Ingreso</button>
                      <button type="button" onClick={resetForm} className="btn btn-outline-secondary w-100 btn-pill">Volver</button>
                    </form>
                  </div>
                )}

                {/* PASO: PRIMER INGRESO */}
                {loginStep === 'primer-ingreso' && (
                  <div id="paso-primer-ingreso" className="animate__animated animate__fadeInUp" style={{ display: 'block' }}>
                    <h4 className="mb-3 text-primary">Configuración Inicial</h4>
                    <p className="small text-muted mb-4">
                      Hola <span className="fw-bold text-dark">{nombreUsuario}</span>, por ser tu primer ingreso debes configurar tu cuenta.
                    </p>
                    <form onSubmit={procesarPrimerIngreso}>
                      <div className="position-relative mb-1">
                        <input 
                          type={showPiClave1 ? 'text' : 'password'} 
                          className="form-control input-pill pe-5" 
                          placeholder="Crea tu contraseña *" 
                          value={piClave1}
                          onChange={handlePiClave1Change}
                          required 
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPiClave1(!showPiClave1)} 
                          className="btn border-0 position-absolute end-0 top-50 translate-middle-y me-2"
                        >
                          <i className={`bi bi-eye${showPiClave1 ? '-slash' : ''} text-muted`}></i>
                        </button>
                      </div>

                      <div className="progress mb-2 progress-clave" style={{ height: '6px' }}>
                        <div 
                          className={`progress-bar ${fuerzaPiClave < 50 ? 'bg-danger' : fuerzaPiClave < 75 ? 'bg-warning' : 'bg-success'}`} 
                          role="progressbar" 
                          style={{ width: `${fuerzaPiClave}%` }}
                        ></div>
                      </div>
                      <small className={`d-block mb-3 ps-2 ${fuerzaPiClave < 50 ? 'text-danger' : fuerzaPiClave < 75 ? 'text-warning' : 'text-success'}`} style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {fuerzaPiClave === 0 && ''}
                        {fuerzaPiClave > 0 && fuerzaPiClave < 50 && 'Contraseña débil (Mínimo 8 caracteres, letras y números)'}
                        {fuerzaPiClave >= 50 && fuerzaPiClave < 75 && 'Contraseña media (Agregue mayúsculas y símbolos)'}
                        {fuerzaPiClave >= 75 && 'Contraseña fuerte (Segura)'}
                      </small>

                      <div className="position-relative mb-3">
                        <input 
                          type={showPiClave2 ? 'text' : 'password'} 
                          className="form-control input-pill pe-5" 
                          placeholder="Confirma tu contraseña *" 
                          value={piClave2}
                          onChange={e => setPiClave2(e.target.value)}
                          required 
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPiClave2(!showPiClave2)} 
                          className="btn border-0 position-absolute end-0 top-50 translate-middle-y me-2"
                        >
                          <i className={`bi bi-eye${showPiClave2 ? '-slash' : ''} text-muted`}></i>
                        </button>
                      </div>

                      <input 
                        type="email" 
                        className="form-control input-pill mb-3" 
                        placeholder="Correo Electrónico (Ej: usuario@correo.com) *" 
                        value={piEmail}
                        onChange={e => setPiEmail(e.target.value)}
                        required 
                      />

                      <input 
                        type="tel" 
                        className="form-control input-pill mb-3" 
                        placeholder="Teléfono Celular (Ej: 04121234567) *" 
                        value={piTelefono}
                        onChange={e => setPiTelefono(e.target.value)}
                        required 
                        maxLength={11}
                      />

                      <label className="small text-muted fw-bold ps-2 mb-1">Preguntas de Seguridad (Obligatorias) *</label>
                      <select 
                        className="form-select input-pill mb-2" 
                        value={piPreg1} 
                        onChange={e => setPiPreg1(e.target.value)}
                        required
                      >
                        <option value="">Seleccione una pregunta...</option>
                        {preguntasSeguridad.map(p => (
                          <option key={p.pregunta} value={p.pregunta}>{p.pregunta}</option>
                        ))}
                      </select>
                      <input 
                        type="text" 
                        className="form-control input-pill mb-3" 
                        placeholder="Respuesta 1 *" 
                        value={piResp1}
                        onChange={e => setPiResp1(e.target.value)}
                        required 
                      />

                      <select 
                        className="form-select input-pill mb-2" 
                        value={piPreg2} 
                        onChange={e => setPiPreg2(e.target.value)}
                        required
                      >
                        <option value="">Seleccione una pregunta...</option>
                        {preguntasSeguridad.map(p => (
                          <option key={p.pregunta} value={p.pregunta}>{p.pregunta}</option>
                        ))}
                      </select>
                      <input 
                        type="text" 
                        className="form-control input-pill mb-4" 
                        placeholder="Respuesta 2 *" 
                        value={piResp2}
                        onChange={e => setPiResp2(e.target.value)}
                        required 
                      />

                      <button type="submit" disabled={loading} className="btn btn-primary w-100 btn-pill mb-3">
                        {loading ? 'Procesando...' : 'Completar Registro'}
                      </button>
                      <button type="button" onClick={resetForm} className="btn btn-outline-secondary w-100 btn-pill">
                        Cancelar
                      </button>
                    </form>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
