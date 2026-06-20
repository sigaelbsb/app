import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';

export const MetodosAcceso = () => {
  const navigate = useNavigate();
  const [appUser, setAppUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // States
  const [biometriaHabilitadaLocal, setBiometriaHabilitadaLocal] = useState(true);
  const [biometriaConfigurada, setBiometriaConfigurada] = useState(false);
  const [otpEnabled, setOtpEnabled] = useState(false);
  const [pregJSON, setPregJSON] = useState<any>({});

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
      }
    } catch (e) {
      console.error("Error loading access methods:", e);
      if (Swal) Swal.fire('Error', 'Falla al cargar estado de métodos de acceso.', 'error');
    }
    setLoading(false);
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
        rp: { name: "SIGAE Unificado" },
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
      {/* Header Banner */}
      <div 
        className="rounded-4 p-4 p-md-5 mb-4 position-relative overflow-hidden shadow-sm" 
        style={{ background: 'linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%)' }}
      >
        <div className="burbuja-3d burbuja-1" style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.2)', position: 'absolute', top: '-50px', right: '-20px', borderRadius: '50%' }}></div>
        <div className="burbuja-3d burbuja-2" style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.1)', position: 'absolute', bottom: '-20px', left: '20px', borderRadius: '50%' }}></div>
        <div className="row align-items-center position-relative z-1">
          <div className="col-md-auto text-center mb-3 mb-md-0">
            <div className="rounded-circle shadow-lg d-inline-flex align-items-center justify-content-center bg-white" style={{ width: '100px', height: '100px' }}>
              <i className="bi bi-fingerprint text-success" style={{ fontSize: '4rem' }}></i>
            </div>
          </div>
          <div className="col-md text-center text-md-start text-dark">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
              <h1 className="fw-bolder mb-0">Métodos de Acceso</h1>
              <button 
                onClick={() => navigate('/categoria/Seguridad%20y%20Accesos')} 
                className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
              >
                <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
              </button>
            </div>
            <p className="mb-0 opacity-75 fw-bold mt-1">
              <i className="bi bi-shield-check me-2"></i>Configuración de inicio de sesión seguro
            </p>
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

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
