import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';

export const MiPerfil = () => {
  const navigate = useNavigate();
  const [appUser, setAppUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form inputs
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');

  // Switch states
  const [cambiarClave, setCambiarClave] = useState(false);
  const [cambiarPreguntas, setCambiarPreguntas] = useState(false);
  const [cambiarBiometria, setCambiarBiometria] = useState(false);

  // Clave inputs
  const [claveActual, setClaveActual] = useState('');
  const [claveNueva, setClaveNueva] = useState('');
  const [claveConfirmar, setClaveConfirmar] = useState('');
  const [fuerzaClave, setFuerzaClave] = useState(0);

  // Preguntas inputs
  const [preguntasBase, setPreguntasBase] = useState<any[]>([]);
  const [preg1, setPreg1] = useState('');
  const [resp1, setResp1] = useState('');
  const [preg2, setPreg2] = useState('');
  const [resp2, setResp2] = useState('');

  // Biometric details
  const [biometriaConfigurada, setBiometriaConfigurada] = useState(false);
  const [biometriaHabilitadaLocal, setBiometriaHabilitadaLocal] = useState(true);

  // Score states
  const [score, setScore] = useState(0);

  // Questions JSON state
  const [pregJSON, setPregJSON] = useState<any>({});
  const [claveUltimaFecha, setClaveUltimaFecha] = useState<string | null>(null);

  const Swal = (window as any).Swal;

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (appUser) {
      calcularTermometro();
    }
  }, [nombre, email, telefono, claveUltimaFecha, preg1, resp1, preg2, resp2, biometriaConfigurada, biometriaHabilitadaLocal, pregJSON]);

  const cargarDatos = async () => {
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
      // 1. Cargar catálogo de preguntas
      const { data: qData } = await supabase
        .from('conf_preguntas_seguridad')
        .select('pregunta')
        .order('pregunta', { ascending: true });
      setPreguntasBase(qData || []);

      // 2. Cargar datos reales
      let userDetails = null;
      if (sessionUser.rol === 'Invitado' || sessionUser.rol === 'Visitante') {
        const { data: invData, error: invErr } = await supabase
          .from('invitados')
          .select('*')
          .eq('cedula', cedula)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (invErr) throw invErr;

        userDetails = { ...sessionUser };
        if (invData) {
          userDetails.nombre_completo = (invData.nombres + ' ' + invData.apellidos).trim();
          userDetails.email = invData.correo;
          userDetails.telefono = invData.telefono;
        } else {
          userDetails.nombre_completo = sessionUser.nombre || 'Visitante';
        }
      } else {
        const { data: dbUser, error: userErr } = await supabase
          .from('usuarios')
          .select('*')
          .eq('cedula', cedula)
          .maybeSingle();

        if (userErr) throw userErr;
        userDetails = dbUser || sessionUser;
      }

      if (userDetails) {
        setAppUser(userDetails);
        setNombre(userDetails.nombre_completo || userDetails.nombre || 'Usuario');
        setEmail(userDetails.email || '');
        setTelefono(userDetails.telefono || '');
        setClaveUltimaFecha(userDetails.fecha_ult_clave || null);

        let parsedPreg: any = {};
        if (userDetails.preguntas_seguridad) {
          try {
            parsedPreg = typeof userDetails.preguntas_seguridad === 'string'
              ? JSON.parse(userDetails.preguntas_seguridad)
              : userDetails.preguntas_seguridad;
          } catch (e) {
            console.error("Error parsing preguntas_seguridad", e);
          }
        }
        setPregJSON(parsedPreg);
        setPreg1(parsedPreg.pregunta_1 || '');
        setResp1(parsedPreg.respuesta_1 ? '••••••••' : '');
        setPreg2(parsedPreg.pregunta_2 || '');
        setResp2(parsedPreg.respuesta_2 ? '••••••••' : '');

        const hasBio = !!(userDetails.credencial_biometrica && userDetails.credencial_biometrica.trim().length > 0);
        setBiometriaConfigurada(hasBio);

        const isLocalEnabled = localStorage.getItem('sigae_huella_habilitada') !== 'false';
        setBiometriaHabilitadaLocal(isLocalEnabled);
      }
    } catch (e) {
      console.error("Error loading profile details:", e);
      if (Swal) {
        Swal.fire('Error', 'Falla al conectar con el servidor de datos.', 'error');
      } else {
        alert('Falla al conectar con el servidor de datos.');
      }
    }
    setLoading(false);
  };

  const evaluarFuerzaClaveLocal = (clave: string) => {
    let strength = 0;
    if (clave.length >= 8) strength += 25;
    if (/[A-Z]/.test(clave)) strength += 25;
    if (/[a-z]/.test(clave)) strength += 25;
    if (/[0-9]/.test(clave)) strength += 15;
    if (/[^A-Za-z0-9]/.test(clave)) strength += 10;
    setFuerzaClave(strength);
  };

  const handleClaveNuevaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setClaveNueva(val);
    evaluarFuerzaClaveLocal(val);
  };

  const calcularTermometro = () => {
    if (!appUser) return;
    let scoreCalculated = 0;
    const isGuest = appUser.rol === 'Invitado' || appUser.rol === 'Visitante';

    if (isGuest) {
      if (email && email.trim().length > 0) scoreCalculated += 50;
      if (telefono && telefono.trim().length > 0) scoreCalculated += 50;
    } else {
      if (email && email.trim().length > 0) scoreCalculated += 10;
      if (telefono && telefono.trim().length > 0) scoreCalculated += 10;

      let claveVigente = false;
      if (claveUltimaFecha) {
        const diffDias = Math.floor((new Date().getTime() - new Date(claveUltimaFecha).getTime()) / (1000 * 60 * 60 * 24));
        if (diffDias < 30) claveVigente = true;
      }
      if (claveVigente) scoreCalculated += 20;

      const hasPreg1 = preg1 && resp1 && resp1.trim().length > 0;
      const hasPreg2 = preg2 && resp2 && resp2.trim().length > 0;
      if (hasPreg1) scoreCalculated += 15;
      if (hasPreg2) scoreCalculated += 15;

      const hasBio = biometriaConfigurada && biometriaHabilitadaLocal;
      if (hasBio) scoreCalculated += 15;

      const tfaHabilitado = pregJSON && pregJSON.otp_enabled === true;
      if (tfaHabilitado) scoreCalculated += 15;
    }
    setScore(scoreCalculated);
  };

  const registrarHuella = async () => {
    if (!window.PublicKeyCredential) {
      if (Swal) {
        Swal.fire('No soportado', 'Tu dispositivo o navegador actual no soporta tecnología biométrica o Passkeys.', 'warning');
      } else {
        alert('Tu dispositivo o navegador actual no soporta tecnología biométrica.');
      }
      return;
    }

    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = new TextEncoder().encode(String(appUser.id_usuario || appUser.id));

      const publicKeyCredentialCreationOptions: any = {
        challenge: challenge,
        rp: { name: "SIGAE" },
        user: {
          id: userId,
          name: appUser.cedula,
          displayName: nombre,
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
        .eq('id_usuario', appUser.id_usuario || appUser.id);

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
        alert('¡Huella Registrada exitosamente!');
      }

      auditar('Seguridad', 'Registro Biométrico', 'El usuario configuró una Passkey/Huella para su cuenta.');
    } catch (e: any) {
      console.error(e);
      if (Swal) Swal.close();
      if (e.name !== "NotAllowedError") {
        if (Swal) {
          Swal.fire('Error FIDO2', 'Falla técnica: ' + e.name + ' - ' + e.message + '. Asegúrate de usar localhost o HTTPS.', 'error');
        } else {
          alert('Error FIDO2: ' + e.message);
        }
      }
    }
  };

  const guardarCambios = async (e: React.FormEvent) => {
    e.preventDefault();
    const isGuest = appUser.rol === 'Invitado' || appUser.rol === 'Visitante';

    if (cambiarClave && !isGuest) {
      if (!claveActual || !claveNueva || !claveConfirmar) {
        if (Swal) Swal.fire('Atención', 'Debe completar todos los campos de clave.', 'warning');
        return;
      }
      if (claveNueva !== claveConfirmar) {
        if (Swal) Swal.fire('Atención', 'La confirmación no coincide.', 'warning');
        return;
      }
      if (fuerzaClave < 50) {
        if (Swal) Swal.fire('Contraseña Débil', 'Por seguridad, elija una contraseña más robusta.', 'warning');
        return;
      }
    }

    if (cambiarPreguntas && !isGuest) {
      if (!preg1 || !resp1 || !preg2 || !resp2) {
        if (Swal) Swal.fire('Atención', 'Debe seleccionar y responder las dos preguntas de seguridad.', 'warning');
        return;
      }
      if (preg1 === preg2) {
        if (Swal) Swal.fire('Atención', 'Las preguntas de seguridad deben ser distintas.', 'warning');
        return;
      }
    }

    if (Swal) {
      Swal.fire({
        title: 'Guardando Cambios...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });
    }

    try {
      if (cambiarClave && !isGuest) {
        // Verificar clave actual
        const { data: vUser, error: vErr } = await supabase
          .from('usuarios')
          .select('clave')
          .eq('cedula', appUser.cedula)
          .single();

        if (vErr || !vUser || vUser.clave !== claveActual) {
          if (Swal) {
            Swal.fire('Error', 'La clave actual es incorrecta.', 'error');
          } else {
            alert('La clave actual es incorrecta.');
          }
          return;
        }
      }

      if (isGuest) {
        // Guardar visitante/invitado
        const { error: invErr } = await supabase
          .from('invitados')
          .update({
            nombres: nombre.split(' ')[0] || nombre,
            apellidos: nombre.split(' ').slice(1).join(' ') || '',
            correo: email,
            telefono: telefono
          })
          .eq('cedula', appUser.cedula);

        if (invErr) throw invErr;
      } else {
        // Guardar usuario
        let payload: any = {
          nombre_completo: nombre,
          email: email,
          telefono: telefono
        };

        if (cambiarClave) {
          payload.clave = claveNueva;
          payload.primer_ingreso = false;
          payload.fecha_ult_clave = new Date().toISOString();
        }

        if (cambiarPreguntas) {
          // Si el input de respuesta tiene asteriscos es porque no cambió
          const finalResp1 = resp1 === '••••••••' ? (pregJSON.respuesta_1 || '') : resp1.trim().toLowerCase();
          const finalResp2 = resp2 === '••••••••' ? (pregJSON.respuesta_2 || '') : resp2.trim().toLowerCase();

          const newPregJSON = {
            ...pregJSON,
            pregunta_1: preg1,
            respuesta_1: finalResp1,
            pregunta_2: preg2,
            respuesta_2: finalResp2
          };

          payload.preguntas_seguridad = JSON.stringify(newPregJSON);
        }

        const { error: userErr } = await supabase
          .from('usuarios')
          .update(payload)
          .eq('cedula', appUser.cedula);

        if (userErr) throw userErr;
      }

      // Actualizar localStorage y estado del usuario
      const stored = localStorage.getItem('usuario_sigae');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.nombre = nombre;
        parsed.email = email;
        localStorage.setItem('usuario_sigae', JSON.stringify(parsed));
      }

      if (Swal) {
        Swal.fire('¡Éxito!', 'Perfil actualizado correctamente.', 'success').then(() => {
          window.location.reload();
        });
      } else {
        alert('Perfil actualizado correctamente.');
        window.location.reload();
      }

      auditar('Seguridad', 'Actualización de Perfil', 'El usuario modificó sus datos personales o de seguridad.');
    } catch (err: any) {
      console.error(err);
      if (Swal) {
        Swal.fire('Error de Servidor', `Detalle: ${err.message}`, 'error');
      } else {
        alert('Falla al guardar los datos.');
      }
    }
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

  if (!appUser) {
    return (
      <div className="alert alert-danger text-center">
        No se pudo obtener la información de la sesión actual.
      </div>
    );
  }

  const isGuest = appUser.rol === 'Invitado' || appUser.rol === 'Visitante';

  return (
    <div className="container-fluid p-0 animate__animated animate__fadeIn">
      {/* Banner */}
      <div className="rounded-4 p-4 p-md-5 mb-4 position-relative overflow-hidden shadow-sm banner-perfil" style={{ background: 'linear-gradient(135deg, var(--color-primario) 0%, #00d2ff 100%)' }}>
        <div className="burbuja-3d burbuja-1" style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.15)', position: 'absolute', top: '-50px', right: '-20px', borderRadius: '50%' }}></div>
        <div className="burbuja-3d burbuja-2" style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.08)', position: 'absolute', bottom: '-20px', left: '20px', borderRadius: '50%' }}></div>
        <div className="row align-items-center position-relative z-1">
          <div className="col-md-auto text-center mb-3 mb-md-0">
            <div className="rounded-circle shadow-lg d-inline-flex align-items-center justify-content-center bg-white avatar-perfil-caja" style={{ width: '90px', height: '90px' }}>
              <i className="bi bi-shield-lock-fill text-primary avatar-perfil-icono" style={{ fontSize: '3rem' }}></i>
            </div>
          </div>
          <div className="col-md text-center text-md-start text-white">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
              <h1 className="fw-bolder mb-0" id="perfil-nombre-display">
                <i className="bi bi-shield-check me-3"></i>{nombre}
              </h1>
              <button 
                onClick={() => navigate('/categoria/Seguridad%20y%20Accesos')} 
                className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
              >
                <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
              </button>
            </div>
            <p className="mb-0 opacity-75 fw-bold mt-1">
              <i className="bi bi-person-vcard me-2"></i>C.I: <span id="perfil-cedula-display">{appUser.cedula}</span>
            </p>
            <div className="mt-2">
              <span className="badge bg-white text-primary rounded-pill px-3 py-2 fw-bold shadow-sm">
                <i className="bi bi-shield-check me-1"></i> <span id="perfil-rol-display">{appUser.rol}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Formulario */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-body p-4 p-md-5">
              <form id="form-mi-perfil" onSubmit={guardarCambios}>
                <div className="row g-4">
                  <div className="col-12">
                    <h5 className="fw-bold text-dark border-bottom pb-2 mb-4">Información Personal</h5>
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted">Nombre Completo</label>
                    <input 
                      type="text" 
                      className="input-moderno form-control" 
                      value={nombre} 
                      onChange={(e) => setNombre(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-muted">Correo Electrónico</label>
                    <input 
                      type="email" 
                      className="input-moderno form-control" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small fw-bold text-muted">Teléfono</label>
                    <input 
                      type="text" 
                      className="input-moderno form-control" 
                      value={telefono} 
                      onChange={(e) => setTelefono(e.target.value)} 
                    />
                  </div>

                  {!isGuest && (
                    <React.Fragment>
                      <div className="col-12 mt-5">
                        <h5 className="fw-bold text-dark border-bottom pb-2 mb-4 text-danger">Seguridad</h5>
                      </div>

                      {/* Cambio de Clave switch */}
                      <div className="col-12 form-check form-switch mb-3 ps-5">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="check-clave" 
                          checked={cambiarClave} 
                          onChange={(e) => setCambiarClave(e.target.checked)} 
                        />
                        <label className="form-check-label fw-bold" htmlFor="check-clave">Deseo cambiar mi contraseña</label>
                      </div>

                      {cambiarClave && (
                        <div className="row g-3 d-flex animate__animated animate__fadeIn" id="bloque-claves">
                          <div className="col-md-4">
                            <label className="form-label small fw-bold text-muted">Clave Actual</label>
                            <input 
                              type="password" 
                              className="input-moderno form-control border-danger" 
                              value={claveActual}
                              onChange={(e) => setClaveActual(e.target.value)}
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small fw-bold text-muted">Nueva Clave</label>
                            <input 
                              type="password" 
                              className="input-moderno form-control border-success" 
                              value={claveNueva}
                              onChange={handleClaveNuevaChange}
                            />
                            <div className="progress mt-2 progreso-fuerza-contenedor" style={{ height: '6px' }}>
                              <div 
                                className={`progress-bar ${fuerzaClave < 50 ? 'bg-danger' : fuerzaClave < 75 ? 'bg-warning' : 'bg-success'}`} 
                                role="progressbar" 
                                style={{ width: `${fuerzaClave}%` }}
                              ></div>
                            </div>
                            <small className={`mt-1 d-block perfil-fuerza-texto ${fuerzaClave < 50 ? 'text-danger' : fuerzaClave < 75 ? 'text-warning' : 'text-success'}`}>
                              {fuerzaClave < 50 && 'Débil (Requiere mayúscula, minúscula, número y símbolo)'}
                              {fuerzaClave >= 50 && fuerzaClave < 75 && 'Media (Agregue símbolos o números)'}
                              {fuerzaClave >= 75 && 'Fuerte (Contraseña segura)'}
                            </small>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small fw-bold text-muted">Confirmar Nueva</label>
                            <input 
                              type="password" 
                              className="input-moderno form-control border-success" 
                              value={claveConfirmar}
                              onChange={(e) => setClaveConfirmar(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {/* Preguntas de Seguridad switch */}
                      <div className="col-12 form-check form-switch mb-3 ps-5 mt-4">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="check-preguntas" 
                          checked={cambiarPreguntas}
                          onChange={(e) => setCambiarPreguntas(e.target.checked)}
                        />
                        <label className="form-check-label fw-bold" htmlFor="check-preguntas">Deseo actualizar mis preguntas de seguridad</label>
                      </div>

                      {cambiarPreguntas && (
                        <div className="row g-3 d-flex animate__animated animate__fadeIn" id="bloque-preguntas">
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-muted">Pregunta 1</label>
                            <select 
                              className="input-moderno form-select" 
                              value={preg1}
                              onChange={(e) => setPreg1(e.target.value)}
                            >
                              <option value="">-- Seleccione Pregunta --</option>
                              {preguntasBase.map(item => (
                                <option key={item.pregunta} value={item.pregunta}>{item.pregunta}</option>
                              ))}
                            </select>
                            <input 
                              type="password" 
                              className="input-moderno form-control mt-2" 
                              placeholder="Respuesta 1"
                              value={resp1}
                              onChange={(e) => setResp1(e.target.value)}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label small fw-bold text-muted">Pregunta 2</label>
                            <select 
                              className="input-moderno form-select" 
                              value={preg2}
                              onChange={(e) => setPreg2(e.target.value)}
                            >
                              <option value="">-- Seleccione Pregunta --</option>
                              {preguntasBase.map(item => (
                                <option key={item.pregunta} value={item.pregunta}>{item.pregunta}</option>
                              ))}
                            </select>
                            <input 
                              type="password" 
                              className="input-moderno form-control mt-2" 
                              placeholder="Respuesta 2"
                              value={resp2}
                              onChange={(e) => setResp2(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {/* Registro Biometrico switch */}
                      <div className="col-12 form-check form-switch mb-3 ps-5 mt-4">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="check-biometrico" 
                          checked={cambiarBiometria}
                          onChange={(e) => setCambiarBiometria(e.target.checked)}
                        />
                        <label className="form-check-label fw-bold text-dark" htmlFor="check-biometrico">Deseo configurar acceso biométrico (Huella o PIN)</label>
                      </div>

                      {cambiarBiometria && (
                        <div className="row g-3 d-flex animate__animated animate__fadeIn" id="bloque-biometrico">
                          <div className="col-12">
                            <div className="p-4 rounded-4 d-flex align-items-center justify-content-between border biometrico-caja bg-light">
                              <div className="d-flex align-items-center">
                                <div className="bg-success bg-opacity-10 p-3 rounded-circle me-3">
                                  <i className="bi bi-fingerprint fs-3 text-success"></i>
                                </div>
                                <div>
                                  <strong className="d-block text-dark">Lector Biométrico / Passkey</strong>
                                  {biometriaConfigurada && biometriaHabilitadaLocal ? (
                                    <span id="txt-biometrico-status" className="small text-success">
                                      <strong>¡Configurado!</strong> Credencial registrada en el sistema.
                                    </span>
                                  ) : biometriaConfigurada && !biometriaHabilitadaLocal ? (
                                    <span id="txt-biometrico-status" className="small text-warning">
                                      <strong>Configurado pero Desactivado</strong> en este navegador.
                                    </span>
                                  ) : (
                                    <span id="txt-biometrico-status" className="small text-muted">
                                      No configurado en este perfil.
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button 
                                type="button" 
                                onClick={registrarHuella} 
                                className="btn btn-sm btn-success fw-bold rounded-pill px-4 py-2 shadow-sm hover-efecto"
                              >
                                <i className={`bi ${biometriaConfigurada ? 'bi-arrow-repeat' : 'bi-plus-circle-fill'} me-2`}></i>
                                {biometriaConfigurada ? 'Actualizar Huella' : 'Registrar Huella'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  )}
                </div>

                <div className="text-end border-top pt-4 mt-5">
                  <button type="submit" className="btn btn-primary fw-bold px-5 rounded-pill shadow-sm">
                    <i className="bi bi-floppy-fill me-2"></i>Guardar Perfil
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Nivel de Seguridad Lateral */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 h-100 bg-perfil-lateral" style={{ background: '#f8fafc' }}>
            <div className="card-body p-4">
              <h5 className="fw-bold text-dark text-center mb-4">
                <i className="bi bi-shield-lock-fill text-primary me-2"></i>Nivel de Seguridad
              </h5>

              {/* Termómetro Circular */}
              <div className="text-center mb-4">
                <div className="position-relative d-inline-block" style={{ width: '150px', height: '150px' }}>
                  <svg viewBox="0 0 36 36" className="termometro-circular" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                    <path 
                      className="circle-bg" 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                      fill="none" 
                      stroke="#e2e8f0" 
                      strokeWidth="3.5"
                    />
                    <path 
                      id="svg-seguridad-progreso" 
                      className="circle" 
                      strokeDasharray={`${score}, 100`} 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                      fill="none" 
                      stroke={score < 50 ? '#dc3545' : score < 100 ? '#ffc107' : '#198754'} 
                      strokeWidth="3.5"
                      style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.5s ease' }}
                    />
                  </svg>
                  <div className="position-absolute top-50 start-50 translate-middle">
                    <span id="lbl-seguridad-porcentaje" className="fs-2 fw-bolder text-dark">{score}%</span>
                  </div>
                </div>
              </div>

              {/* Lista de Chequeo */}
              <div className="list-group list-group-flush bg-transparent">
                {/* Correo */}
                <div className="list-group-item bg-transparent px-0 d-flex align-items-center py-3 border-bottom-0">
                  <i className={`bi ${email ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} fs-4 me-3`}></i>
                  <div>
                    <h6 className="mb-0 fw-bold text-dark">Correo Electrónico</h6>
                    <small className="text-muted list-item-subtexto">Para notificaciones y recuperación</small>
                  </div>
                </div>

                {/* Teléfono */}
                <div className="list-group-item bg-transparent px-0 d-flex align-items-center py-3 border-bottom-0">
                  <i className={`bi ${telefono ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} fs-4 me-3`}></i>
                  <div>
                    <h6 className="mb-0 fw-bold text-dark">Teléfono Celular</h6>
                    <small className="text-muted list-item-subtexto">Contacto en caso de emergencias</small>
                  </div>
                </div>

                {!isGuest && (
                  <React.Fragment>
                    {/* Clave Vigente */}
                    <div className="list-group-item bg-transparent px-0 d-flex align-items-center py-3 border-bottom-0">
                      <i className={`bi ${(claveUltimaFecha && Math.floor((new Date().getTime() - new Date(claveUltimaFecha).getTime()) / (1000 * 60 * 60 * 24)) < 30) ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} fs-4 me-3`}></i>
                      <div>
                        <h6 className="mb-0 fw-bold text-dark">Contraseña Vigente</h6>
                        <small className="text-muted list-item-subtexto">Cambiada hace menos de 30 días</small>
                      </div>
                    </div>

                    {/* Pregunta 1 */}
                    <div className="list-group-item bg-transparent px-0 d-flex align-items-center py-3 border-bottom-0">
                      <i className={`bi ${(preg1 && resp1) ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} fs-4 me-3`}></i>
                      <div>
                        <h6 className="mb-0 fw-bold text-dark">Pregunta de Seguridad 1</h6>
                        <small className="text-muted list-item-subtexto">Método de recuperación alterno</small>
                      </div>
                    </div>

                    {/* Pregunta 2 */}
                    <div className="list-group-item bg-transparent px-0 d-flex align-items-center py-3 border-bottom-0">
                      <i className={`bi ${(preg2 && resp2) ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} fs-4 me-3`}></i>
                      <div>
                        <h6 className="mb-0 fw-bold text-dark">Pregunta de Seguridad 2</h6>
                        <small className="text-muted list-item-subtexto">Doble factor de validación</small>
                      </div>
                    </div>

                    {/* Biometría */}
                    <div className="list-group-item bg-transparent px-0 d-flex align-items-center py-3 border-bottom-0">
                      <i className={`bi ${(biometriaConfigurada && biometriaHabilitadaLocal) ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} fs-4 me-3`}></i>
                      <div>
                        <h6 className="mb-0 fw-bold text-dark">Configuración Biométrica</h6>
                        <small className="text-muted list-item-subtexto">Acceso rápido con Huella/PIN/FaceID</small>
                      </div>
                    </div>

                    {/* 2FA */}
                    <div className="list-group-item bg-transparent px-0 d-flex align-items-center py-3 border-bottom-0">
                      <i className={`bi ${(pregJSON && pregJSON.otp_enabled === true) ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} fs-4 me-3`}></i>
                      <div>
                        <h6 className="mb-0 fw-bold text-dark">Doble Factor (2FA)</h6>
                        <small className="text-muted list-item-subtexto">Código temporal de seguridad en app móvil</small>
                      </div>
                    </div>
                  </React.Fragment>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
