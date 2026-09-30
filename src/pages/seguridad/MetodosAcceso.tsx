import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { ChamiloBreadcrumb, ChamiloHelpCallout } from '../../components/chamilo';
import { 
  obtenerSesionesUsuario, 
  cambiarEstadoSesion, 
  cerrarTodasLasDemasSesiones, 
  getOrInitSessionId, 
  registrarSesionActiva,
  type SesionDispositivo 
} from '../../utils/activeSessionsHelper';

export const MetodosAcceso = () => {
  const navigate = useNavigate();
  const [appUser, setAppUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // States
  const [biometriaHabilitadaLocal, setBiometriaHabilitadaLocal] = useState(true);
  const [biometriaConfigurada, setBiometriaConfigurada] = useState(false);
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [pregJSON, setPregJSON] = useState<any>({});

  // Active Sessions State (Tipo WhatsApp Web)
  const [sesiones, setSesiones] = useState<SesionDispositivo[]>([]);
  const [loadingSesiones, setLoadingSesiones] = useState(false);
  const currentSessionId = getOrInitSessionId();

  const esModoEmulacion = !!(
    appUser?.es_emulacion ||
    localStorage.getItem('sigae_usuario_original_admin') ||
    sessionStorage.getItem('sigae_emulacion_activa') === 'true'
  );

  const Swal = (window as any).Swal;

  useEffect(() => {
    cargarEstado();
  }, []);

  const cargarEstado = async () => {
    setLoading(true);
    let sessionUser: any = null;
    const stored = localStorage.getItem('usuario_sigae');
    if (stored) {
      try {
        sessionUser = JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    if (!sessionUser) {
      setLoading(false);
      return;
    }

    const cedula = String(sessionUser.cedula).trim();

    try {
      // 1. Cargar estado local
      const isLocalEnabled = localStorage.getItem('sigae_huella_habilitada') !== 'false';
      setBiometriaHabilitadaLocal(isLocalEnabled);

      // 2. Cargar estado de Supabase
      const { data: dbUser, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('cedula', cedula)
        .maybeSingle();

      if (error) throw error;

      if (dbUser) {
        setAppUser(dbUser);
        
        let parsedPreg: any = {};
        if (dbUser.preguntas_seguridad) {
          try {
            parsedPreg = typeof dbUser.preguntas_seguridad === 'string'
              ? JSON.parse(dbUser.preguntas_seguridad)
              : dbUser.preguntas_seguridad;
          } catch (e) {
            console.error(e);
          }
        }
        setPregJSON(parsedPreg);
        setOtpEnabled(parsedPreg && parsedPreg.otp_enabled === true && parsedPreg.otp_secret);
        setBiometriaConfigurada(!!(dbUser.credencial_biometrica && dbUser.credencial_biometrica.trim().length > 0));
        
        // Cargar sesiones de dispositivos (Tipo WhatsApp Web)
        await cargarSesiones(cedula);
      }
    } catch (e) {
      console.error("Error loading access methods:", e);
      if (Swal) Swal.fire('Error', 'Falla al cargar estado de métodos de acceso.', 'error');
    }
    setLoading(false);
  };

  const cargarSesiones = async (ced: string) => {
    if (!ced) return;
    setLoadingSesiones(true);
    try {
      const isEmul = !!(
        localStorage.getItem('sigae_usuario_original_admin') ||
        sessionStorage.getItem('sigae_emulacion_activa') === 'true' ||
        appUser?.es_emulacion
      );

      if (!isEmul) {
        await registrarSesionActiva(ced);
      }
      const list = await obtenerSesionesUsuario(ced);

      // REGLA CRÍTICA: En modo emulación, no mostrar la sesión actual del emulador
      const sesionesFiltradas = isEmul 
        ? list.filter(s => s.id !== currentSessionId && !(s as any).es_emulacion)
        : list;

      setSesiones(sesionesFiltradas);
    } catch (e) {
      console.error("Error al cargar sesiones:", e);
    } finally {
      setLoadingSesiones(false);
    }
  };

  const handleToggleSesion = async (targetId: string, nuevoEstado: boolean) => {
    if (!appUser?.cedula) return;

    if (esModoEmulacion) {
      if (Swal) {
        Swal.fire({
          icon: 'info',
          title: 'Modo Virtualización / Emulación',
          text: 'Te encuentras en una sesión de auditoría técnica. No está permitido modificar los dispositivos reales de este usuario.',
          confirmButtonColor: '#0066FF'
        });
      }
      return;
    }
    
    if (!nuevoEstado) {
      if (Swal) {
        const confirm = await Swal.fire({
          title: '¿Cerrar sesión en este dispositivo?',
          text: 'Ese equipo o navegador será desconectado inmediatamente.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, cerrar sesión',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#dc3545'
        });
        if (!confirm.isConfirmed) return;
      }
    }

    const exito = await cambiarEstadoSesion(appUser.cedula, targetId, nuevoEstado);
    if (exito) {
      if (Swal) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: nuevoEstado ? 'Sesión reactivada con éxito' : 'Sesión cerrada remotamente',
          showConfirmButton: false,
          timer: 2500
        });
      }
      auditar('Seguridad', nuevoEstado ? 'Reactivar Sesión Remota' : 'Cerrar Sesión Remota', `Sesión ID: ${targetId}`);
      await cargarSesiones(appUser.cedula);
    } else {
      if (Swal) Swal.fire('Error', 'No se pudo actualizar el estado de la sesión.', 'error');
    }
  };

  const handleCerrarTodasLasDemas = async () => {
    if (!appUser?.cedula) return;

    if (esModoEmulacion) {
      if (Swal) {
        Swal.fire({
          icon: 'info',
          title: 'Modo Virtualización / Emulación',
          text: 'Te encuentras en una sesión de auditoría técnica. No está permitido revocar los dispositivos reales de este usuario.',
          confirmButtonColor: '#0066FF'
        });
      }
      return;
    }

    if (Swal) {
      const confirm = await Swal.fire({
        title: '¿Cerrar todas las demás sesiones?',
        text: 'Se cerrará la sesión en todas las computadoras y teléfonos excepto en este dispositivo actual.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cerrar en todos los equipos',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545'
      });
      if (!confirm.isConfirmed) return;
    }

    const exito = await cerrarTodasLasDemasSesiones(appUser.cedula);
    if (exito) {
      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Sesiones Cerradas!',
          text: 'Todas las demás sesiones remotas han sido finalizadas con éxito.',
          confirmButtonColor: '#0066FF'
        });
      }
      auditar('Seguridad', 'Cerrar Todas las Sesiones', 'El usuario cerró todas las sesiones remotas.');
      await cargarSesiones(appUser.cedula);
    } else {
      if (Swal) Swal.fire('Error', 'No se pudieron cerrar las demás sesiones.', 'error');
    }
  };

  const formatearFecha = (iso: string) => {
    if (!iso) return 'Reciente';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('es-VE', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return iso;
    }
  };

  const handleBiometriaLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setBiometriaHabilitadaLocal(checked);
    localStorage.setItem('sigae_huella_habilitada', checked ? 'true' : 'false');

    if (Swal) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: checked ? 'success' : 'info',
        title: checked ? 'Autenticación biométrica habilitada' : 'Autenticación biométrica deshabilitada',
        showConfirmButton: false,
        timer: 2000
      });
    }

    auditar('Seguridad', checked ? 'Habilitar Biometría' : 'Deshabilitar Biometría', 'El usuario modificó el estado de acceso biométrico en este equipo.');
  };

  const registrarHuella = async () => {
    if (!window.PublicKeyCredential) {
      if (Swal) Swal.fire('No soportado', 'Tu dispositivo o navegador actual no soporta tecnología biométrica o Passkeys.', 'warning');
      return;
    }

    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = new TextEncoder().encode(String(appUser.id_usuario));

      const publicKeyCredentialCreationOptions: any = {
        challenge: challenge,
        rp: { name: "SIGAE" },
        user: {
          id: userId,
          name: appUser.cedula,
          displayName: appUser.nombre_completo || 'Usuario',
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
        authenticatorSelection: {
          userVerification: "preferred",
          residentKey: "required",
          requireResidentKey: true
        },
        timeout: 60000,
        attestation: "none"
      };

      const credential: any = await navigator.credentials.create({ publicKey: publicKeyCredentialCreationOptions });
      if (!credential) return;

      let rawId = Array.from(new Uint8Array(credential.rawId)).map(b => b.toString(16).padStart(2, '0')).join('');

      if (Swal) {
        Swal.fire({
          title: 'Registrando Huella...',
          allowOutsideClick: false,
          didOpen: () => { Swal.showLoading(); }
        });
      }

      const { error } = await supabase
        .from('usuarios')
        .update({ credencial_biometrica: rawId })
        .eq('id_usuario', appUser.id_usuario);

      if (Swal) Swal.close();
      if (error) throw error;

      // Update local storage user info
      const stored = localStorage.getItem('usuario_sigae');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.credencial_biometrica = rawId;
        localStorage.setItem('usuario_sigae', JSON.stringify(parsed));
      }

      localStorage.setItem('sigae_tiene_huella', appUser.cedula);
      localStorage.setItem('sigae_huella_habilitada', 'true');
      setBiometriaConfigurada(true);
      setBiometriaHabilitadaLocal(true);

      if (Swal) {
        Swal.fire('¡Huella Registrada!', 'La próxima vez que inicies sesión en este dispositivo, verás un botón para usar tu huella o PIN.', 'success');
      } else {
        alert('¡Huella Registrada!');
      }

      auditar('Seguridad', 'Registro Biométrico', 'El usuario configuró una Passkey/Huella para su cuenta.');
    } catch (e: any) {
      console.error(e);
      if (Swal) Swal.close();
      if (e.name !== "NotAllowedError") {
        if (Swal) Swal.fire('Error FIDO2', 'Falla técnica: ' + e.name + ' - ' + e.message + '. Asegúrate de usar localhost o HTTPS.', 'error');
      }
    }
  };

  // 2FA - TOTP helper logic
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

  const generarSecretoBase32 = () => {
    const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let secreto = "";
    for (let i = 0; i < 16; i++) {
      secreto += alfabeto[Math.floor(Math.random() * alfabeto.length)];
    }
    return secreto;
  };

  const configurar2FA = async () => {
    const QRCodeClass = (window as any).QRCode;
    if (!QRCodeClass) {
      if (Swal) Swal.fire('Error', 'Librería de códigos QR no cargada. Reintente en unos instantes.', 'error');
      return;
    }

    const secret = generarSecretoBase32();
    const uri = `otpauth://totp/SIGAE:${appUser.cedula}?secret=${secret}&issuer=SIGAE`;

    if (!Swal) {
      alert("SweetAlert2 es requerido para configurar 2FA.");
      return;
    }

    Swal.fire({
      title: 'Configurar Doble Factor (2FA)',
      html: `
        <div class="text-start">
          <p class="small text-muted mb-3">1. Escanea este código QR con tu aplicación de autenticación (Google Authenticator, Authy, etc.):</p>
          <div id="qrcode-2fa-container" class="d-flex justify-content-center p-3 bg-white border rounded-4 mb-3 mx-auto shadow-sm" style="width: 200px; height: 200px;"></div>
          <p class="small text-muted mb-2">O introduce esta clave secreta manualmente en tu app:</p>
          <div class="bg-light p-2 text-center rounded-3 border fw-bold mb-3" style="letter-spacing: 2px; font-family: monospace; font-size: 1.1rem; user-select: all;">${secret}</div>
          <p class="small text-muted mb-2">2. Ingresa el código de 6 dígitos generado por tu aplicación móvil para confirmar:</p>
          <input type="text" id="swal-2fa-code" class="form-control text-center fw-bold fs-4 input-pill mb-3" placeholder="000000" maxlength="6">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Verificar y Activar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0066FF',
      didOpen: () => {
        const container = document.getElementById('qrcode-2fa-container');
        if (container) {
          new QRCodeClass(container, {
            text: uri,
            width: 168,
            height: 168
          });
        }
      },
      preConfirm: async () => {
        const inputCode = (document.getElementById('swal-2fa-code') as HTMLInputElement).value.trim();
        if (inputCode.length !== 6) {
          Swal.showValidationMessage('Ingresa un código de 6 dígitos');
          return false;
        }
        const verificado = await verificarTOTP(secret, inputCode);
        if (!verificado) {
          Swal.showValidationMessage('Código incorrecto o expirado');
          return false;
        }
        return secret;
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Guardando Configuración...',
          allowOutsideClick: false,
          didOpen: () => { Swal.showLoading(); }
        });

        try {
          const payloadPreg = {
            ...pregJSON,
            otp_secret: result.value,
            otp_enabled: true
          };

          const { error } = await supabase
            .from('usuarios')
            .update({ preguntas_seguridad: JSON.stringify(payloadPreg) })
            .eq('cedula', appUser.cedula);

          Swal.close();
          if (error) throw error;

          Swal.fire('¡Activado!', 'La autenticación en dos pasos ha sido habilitada exitosamente.', 'success');
          setPregJSON(payloadPreg);
          setOtpEnabled(true);
          
          auditar('Seguridad', 'Habilitar 2FA', 'El usuario activó la autenticación TOTP (Doble Factor).');
        } catch (e) {
          Swal.close();
          Swal.fire('Error', 'No se pudo guardar la configuración en la base de datos.', 'error');
        }
      }
    });
  };

  const desactivar2FA = async () => {
    if (!Swal) return;

    Swal.fire({
      title: '¿Desactivar Doble Factor?',
      text: 'Esto disminuirá la seguridad de tu cuenta notablemente. ¿Estás seguro de continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Desactivando 2FA...',
          allowOutsideClick: false,
          didOpen: () => { Swal.showLoading(); }
        });

        try {
          const payloadPreg = {
            ...pregJSON,
            otp_secret: null,
            otp_enabled: false
          };

          const { error } = await supabase
            .from('usuarios')
            .update({ preguntas_seguridad: JSON.stringify(payloadPreg) })
            .eq('cedula', appUser.cedula);

          Swal.close();
          if (error) throw error;

          Swal.fire('Desactivado', 'La autenticación en dos pasos ha sido deshabilitada de tu cuenta.', 'info');
          setPregJSON(payloadPreg);
          setOtpEnabled(false);

          auditar('Seguridad', 'Deshabilitar 2FA', 'El usuario desactivó la autenticación TOTP (Doble Factor).');
        } catch (e) {
          Swal.close();
          Swal.fire('Error', 'No se pudo guardar la desactivación en la base de datos.', 'error');
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5 h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 animate__animated animate__fadeIn">

      {/* MIGAS DE PAN CHAMILO */}
      <ChamiloBreadcrumb
        category="Seguridad y Accesos"
        currentModule="Métodos de Acceso"
      />

      {/* CUADRO DE AYUDA METODOLÓGICA CHAMILO */}
      <ChamiloHelpCallout
        id="ayuda_metodos_acceso"
        title="Guía de Métodos de Acceso, Biometría y 2FA"
        content="Configure métodos de autenticación avanzados para su cuenta institucional: inicio de sesión por huella dactilar o reconocimiento facial (WebAuthn/Passkeys) y doble factor TOTP con Google Authenticator."
        icon="bi-fingerprint"
      />

      {/* Header Banner */}
      <div 
        className="banner-modulo p-4 p-md-5 mb-4 shadow-sm text-white position-relative overflow-hidden rounded-4" 
        style={{ background: 'linear-gradient(135deg, #0066FF 0%, #00C3FF 100%)' }}
      >
        <div className="burbuja-3d burbuja-1"></div>
        <div className="burbuja-3d burbuja-2"></div>
        <div className="burbuja-3d burbuja-3"></div>
        <div className="row align-items-center position-relative z-1">
          <div className="col-lg-9 text-center text-md-start mb-3 mb-lg-0">
            <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
              <span className="badge bg-white text-primary px-3 py-2 shadow-sm fw-bold rounded-pill badge-3d" style={{ letterSpacing: '0.5px' }}>
                <i className="bi bi-fingerprint me-1"></i> SEGURIDAD, BIOMETRÍA & 2FA
              </span>
            </div>
            <h1 className="fw-bolder mb-2 text-white" style={{ fontSize: 'calc(1.6rem + 1vw)', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              <i className="bi bi-shield-lock-fill me-2"></i>Métodos de Acceso y Seguridad
            </h1>
            <p className="mb-0 fw-semibold fs-5 text-white text-opacity-90" style={{ maxWidth: '820px' }}>
              Configuración de inicio de sesión biométrico (huella/FaceID), doble factor de autenticación TOTP y Passkeys.
            </p>
          </div>
          <div className="col-lg-3 text-end d-none d-lg-block">
            <img 
              src={`/assets/img/logo_${localStorage.getItem('sigae_escuela_codigo') || 'sb'}.png`} 
              alt="Logo Escuela" 
              className="logo-escuela-banner"
              onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
            />
          </div>
        </div>
      </div>

      <div className="row g-4 justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body p-4 p-md-5">
              <h4 className="fw-bold text-dark mb-4 border-bottom pb-2">Acceso Rápido Biométrico (Passkeys)</h4>

              <div className="d-flex align-items-center mb-4">
                <div className="bg-success bg-opacity-10 p-4 rounded-circle me-4">
                  <i className="bi bi-person-bounding-box fs-1 text-success"></i>
                </div>
                <div>
                  <h5 className="fw-bold text-dark mb-2">Ingresa usando tu Huella o FaceID</h5>
                  <p className="text-muted mb-0">
                    Reemplaza tu contraseña por el método de desbloqueo nativo de este dispositivo. Es mucho más rápido y seguro contra ataques de phishing, ya que la credencial nunca sale de tu equipo físico.
                  </p>
                </div>
              </div>

              <div className="alert alert-info border-0 shadow-sm rounded-3 d-flex align-items-start mb-5">
                <i className="bi bi-info-circle-fill fs-4 me-3 mt-1"></i>
                <div>
                  <strong className="d-block mb-1">¿Cómo funciona?</strong>
                  <span className="small">
                    Al configurar esto, el sistema vinculará matemáticamente tu navegador actual con el lector de huellas o PIN de tu teléfono o computadora. La próxima vez que inicies sesión en este mismo equipo, solo tendrás que usar tu huella.
                  </span>
                </div>
              </div>

              {/* Toggle local biometric service */}
              <div className="p-3 rounded-4 bg-light d-flex justify-content-between align-items-center mb-4 border border-light shadow-sm hover-efecto">
                <div className="d-flex align-items-center">
                  <div className="bg-success bg-opacity-10 p-2 rounded-circle me-3" style={{ padding: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="bi bi-power fs-4 text-success"></i>
                  </div>
                  <div>
                    <span className="fw-bold d-block text-dark">Servicio de Autenticación Biométrica</span>
                    <small className="text-muted d-block" style={{ fontSize: '0.8rem' }}>
                      Activa o desactiva el inicio de sesión con huella en este navegador. {biometriaConfigurada && <span className="text-success fw-bold">(Huella Registrada)</span>}
                    </small>
                  </div>
                </div>
                <div className="form-check form-switch ps-5">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="switch-huella-habilitada" 
                    style={{ width: '2.8em', height: '1.4em', cursor: 'pointer' }}
                    checked={biometriaHabilitadaLocal}
                    onChange={handleBiometriaLocalChange}
                  />
                </div>
              </div>

              {/* Set credential button */}
              <div className="text-center mt-4">
                <button 
                  type="button" 
                  id="btn-configurar-huella-metodos" 
                  disabled={!biometriaHabilitadaLocal}
                  className={`btn btn-success fw-bold px-5 py-3 rounded-pill shadow-sm hover-efecto ${!biometriaHabilitadaLocal ? 'disabled' : ''}`} 
                  onClick={registrarHuella}
                  style={{ fontSize: '1.1rem' }}
                >
                  <i className="bi bi-plus-circle-fill me-2"></i> Configurar Huella en este Dispositivo
                </button>
              </div>

              {/* Advanced Authentication methods */}
              <div className="mt-5 pt-4 border-top">
                <h6 className="fw-bold text-muted mb-3">
                  <i className="bi bi-lock me-2"></i>Otros métodos de autenticación
                </h6>

                {/* 2FA google authenticator */}
                <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-4 mb-3 border hover-efecto">
                  <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-10 p-2 rounded-circle me-3" style={{ padding: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="bi bi-shield-lock-fill fs-4 text-primary"></i>
                    </div>
                    <div>
                      <span className="fw-bold d-block text-dark">Aplicación de Autenticación (2FA)</span>
                      <small id="txt-2fa-status" className="text-muted d-block" style={{ fontSize: '0.8rem' }}>
                        {otpEnabled ? (
                          <span className="text-success fw-bold">
                            <i className="bi bi-shield-fill-check me-1"></i>Habilitado
                          </span>
                        ) : (
                          'Protege tu cuenta con códigos temporales generados en tu móvil.'
                        )}
                      </small>
                    </div>
                  </div>
                  <div>
                    {otpEnabled ? (
                      <button 
                        type="button" 
                        id="btn-toggle-2fa" 
                        onClick={desactivar2FA}
                        className="btn btn-sm btn-danger fw-bold rounded-pill px-3 py-1.5 shadow-sm hover-efecto"
                      >
                        Desactivar
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        id="btn-toggle-2fa" 
                        onClick={configurar2FA}
                        className="btn btn-sm btn-outline-primary fw-bold rounded-pill px-3 py-1.5 shadow-sm hover-efecto"
                      >
                        Configurar
                      </button>
                    )}
                  </div>
                </div>

                {/* USB physical security key */}
                <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-4 border opacity-50">
                  <div className="d-flex align-items-center">
                    <div className="bg-secondary bg-opacity-10 p-2 rounded-circle me-3" style={{ padding: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="bi bi-usb-symbol fs-4 text-secondary"></i>
                    </div>
                    <div>
                      <span className="fw-bold d-block">Llave de Seguridad Física (USB/NFC)</span>
                      <small className="d-block" style={{ fontSize: '0.8rem' }}>
                        YubiKey o similar (Requiere dispositivo físico)
                      </small>
                    </div>
                  </div>
                  <span className="badge bg-secondary rounded-pill px-3 py-1.5">Próximamente</span>
                </div>
              </div>

              {/* Sección WhatsApp Web: Dispositivos Conectados y Sesiones Activas */}
              <div className="mt-5 pt-4 border-top">
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <h5 className="fw-bold text-dark mb-0">
                        <i className="bi bi-display text-primary me-2"></i>Dispositivos y Sesiones Activas
                      </h5>
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2.5 py-1 small">
                        <i className="bi bi-whatsapp me-1"></i> Control Tipo WhatsApp Web
                      </span>
                    </div>
                    <p className="text-muted small mb-0">
                      Supervisa las computadoras y teléfonos donde has iniciado sesión. Puedes activar o desactivar sesiones remotamente para proteger tu cuenta.
                    </p>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary rounded-pill px-3 shadow-sm hover-efecto"
                      onClick={() => appUser?.cedula && cargarSesiones(appUser.cedula)}
                      disabled={loadingSesiones}
                      title="Refrescar dispositivos"
                    >
                      <i className={`bi bi-arrow-clockwise me-1 ${loadingSesiones ? 'spin-icon' : ''}`}></i>
                      Refrescar
                    </button>
                    {sesiones.filter(s => s.id !== currentSessionId && s.activa).length > 0 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger fw-semibold rounded-pill px-3 shadow-sm hover-efecto"
                        onClick={handleCerrarTodasLasDemas}
                      >
                        <i className="bi bi-shield-x me-1"></i>
                        Cerrar todas las demás
                      </button>
                    )}
                  </div>
                </div>

                {esModoEmulacion && (
                  <div className="alert alert-warning border-0 rounded-3 p-3 mb-3 d-flex align-items-center gap-2 small text-dark" style={{ background: '#fffbeb', borderLeft: '4px solid #f59e0b' }}>
                    <i className="bi bi-shield-lock-fill text-warning fs-5"></i>
                    <span>
                      Modo Virtualización Activo: Esta sesión de auditoría temporal <strong>no se graba ni se muestra como dispositivo vinculado</strong> en la cuenta.
                    </span>
                  </div>
                )}

                {loadingSesiones ? (
                  <div className="text-center py-4 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Cargando dispositivos vinculados...
                  </div>
                ) : sesiones.length === 0 ? (
                  <div className="text-center py-4 bg-light rounded-4 border border-dashed">
                    <i className="bi bi-laptop fs-1 text-muted opacity-50 d-block mb-2"></i>
                    <p className="text-muted small mb-0">
                      {esModoEmulacion ? 'Sin dispositivos físicos vinculados para este usuario.' : 'No se registran otras sesiones concurrentes.'}
                    </p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {sesiones.map((s) => {
                      const esActual = s.id === currentSessionId;
                      const esPC = s.tipo_dispositivo === 'computadora' || s.sistema_operativo.includes('Windows') || s.sistema_operativo.includes('macOS') || s.sistema_operativo.includes('Linux');
                      
                      return (
                        <div 
                          key={s.id} 
                          className={`p-3 rounded-4 border shadow-sm transition-all d-flex flex-wrap justify-content-between align-items-center gap-3 ${
                            esActual 
                              ? 'bg-primary bg-opacity-10 border-primary border-opacity-30' 
                              : s.activa 
                                ? 'bg-light border-light-subtle' 
                                : 'bg-light border-light-subtle opacity-75'
                          }`}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div 
                              className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm ${
                                esActual ? 'bg-primary text-white' : s.activa ? 'bg-white text-dark border' : 'bg-secondary bg-opacity-25 text-muted'
                              }`} 
                              style={{ width: '48px', height: '48px' }}
                            >
                              <i className={`bi ${esPC ? 'bi-laptop fs-4' : 'bi-phone fs-4'}`}></i>
                            </div>

                            <div>
                              <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                                <span className="fw-bold text-dark">{s.dispositivo_nombre || (esPC ? 'Computadora' : 'Teléfono Móvil')}</span>
                                {esActual && (
                                  <span className="badge bg-success text-white rounded-pill px-2 py-0.5" style={{ fontSize: '0.75rem' }}>
                                    <i className="bi bi-check-circle-fill me-1"></i> Este dispositivo (Sesión actual)
                                  </span>
                                )}
                                {!esActual && s.activa && (
                                  <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill px-2 py-0.5" style={{ fontSize: '0.75rem' }}>
                                    <span className="spinner-grow spinner-grow-sm me-1" style={{ width: '6px', height: '6px' }}></span> Activa
                                  </span>
                                )}
                                {!s.activa && (
                                  <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2 py-0.5" style={{ fontSize: '0.75rem' }}>
                                    Desactivada / Cerrada
                                  </span>
                                )}
                              </div>
                              <div className="text-muted small d-flex flex-wrap gap-x-3 gap-y-1 align-items-center" style={{ fontSize: '0.8rem' }}>
                                <span><i className="bi bi-browser-chrome me-1"></i>{s.navegador || 'Navegador Web'}</span>
                                <span className="text-secondary opacity-50">•</span>
                                <span><i className="bi bi-clock-history me-1"></i>Inicio: {formatearFecha(s.fecha_inicio)}</span>
                                <span className="text-secondary opacity-50">•</span>
                                <span><i className="bi bi-activity me-1"></i>Última actividad: {formatearFecha(s.fecha_actividad)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="ms-auto d-flex align-items-center gap-2">
                            {esActual ? (
                              <span className="text-success small fw-semibold">
                                <i className="bi bi-circle-fill text-success me-1" style={{ fontSize: '0.5rem' }}></i> En uso ahora
                              </span>
                            ) : s.activa ? (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger fw-semibold rounded-pill px-3 shadow-sm hover-efecto"
                                onClick={() => handleToggleSesion(s.id, false)}
                                title="Desconectar este dispositivo remotamente"
                              >
                                <i className="bi bi-power me-1"></i> Cerrar Sesión
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success fw-semibold rounded-pill px-3 shadow-sm hover-efecto"
                                onClick={() => handleToggleSesion(s.id, true)}
                                title="Permitir reconexión a este dispositivo"
                              >
                                <i className="bi bi-arrow-repeat me-1"></i> Reactivar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
