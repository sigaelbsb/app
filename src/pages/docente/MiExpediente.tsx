import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';

interface Familiar {
  nombres: string;
  parentesco: string;
  cedula: string;
  fecha_nacimiento: string;
  vive_con_trabajador: string;
  condicion_neuro: string;
}

interface Curso {
  titulo: string;
  lugar: string;
  horas: string;
  fecha: string;
}

interface ExpedienteData {
  sexo: string;
  fecha_nacimiento: string;
  estado_civil: string;
  direccion: string;
  titulo_obtenido: string;
  nivel_instruccion: string;
  universidad: string;
  anio_egreso: number;
  fecha_ingreso: string;
  tipo_nomina: string;
  carga_horaria: number;
  estatus_laboral: string;
  documentos: {
    cedula: boolean;
    titulo: boolean;
    cv: boolean;
    constancia: boolean;
  };
  datos_salud: {
    conapdis: string;
    talla_botas: string;
    talla_braga: string;
    talla_camisa: string;
    talla_calzado: string;
    talla_chemise: string;
    emergencia_tel: string;
    talla_pantalon: string;
    condicion_neuro: string;
    grupo_sanguineo: string;
    condicion_medica: string;
    emergencia_nombre: string;
  };
  datos_electoral: {
    estado: string;
    municipio: string;
    parroquia: string;
    centro_votacion: string;
  };
  datos_vivienda: {
    tipo: string;
    condicion: string;
    detalle_otra: string;
    credito_5_sueldos: string;
  };
  carga_familiar: Familiar[];
  cursos_realizados: Curso[];
}

const DEFAULT_SALUD = {
  conapdis: 'No',
  talla_botas: '',
  talla_braga: '',
  talla_camisa: '',
  talla_calzado: '',
  talla_chemise: '',
  emergencia_tel: '',
  talla_pantalon: '',
  condicion_neuro: 'Neurotípico',
  grupo_sanguineo: '',
  condicion_medica: '',
  emergencia_nombre: ''
};

const DEFAULT_ELECTORAL = {
  estado: '',
  municipio: '',
  parroquia: '',
  centro_votacion: ''
};

const DEFAULT_VIVIENDA = {
  tipo: '',
  condicion: '',
  detalle_otra: '',
  credito_5_sueldos: 'No Solicitado'
};

const DEFAULT_EXPEDIENTE: ExpedienteData = {
  sexo: '',
  fecha_nacimiento: '',
  estado_civil: '',
  direccion: '',
  titulo_obtenido: '',
  nivel_instruccion: '',
  universidad: '',
  anio_egreso: new Date().getFullYear(),
  fecha_ingreso: '',
  tipo_nomina: 'Fijo',
  carga_horaria: 36,
  estatus_laboral: 'Activo',
  documentos: {
    cedula: false,
    titulo: false,
    cv: false,
    constancia: false
  },
  datos_salud: DEFAULT_SALUD,
  datos_electoral: DEFAULT_ELECTORAL,
  datos_vivienda: DEFAULT_VIVIENDA,
  carga_familiar: [],
  cursos_realizados: []
};

export const MiExpediente = () => {
  const navigate = useNavigate();
  const { tienePermiso, loading: permLoading } = usePermisos();
  const Swal = (window as any).Swal;

  const [activeStep, setActiveStep] = useState<number>(1);
  const [loadingData, setLoadingData] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Session User Info
  const storedUser = localStorage.getItem('usuario_sigae');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userCedula = user?.cedula;

  // Contact Parity States
  const [userEmail, setUserEmail] = useState<string>('');
  const [userTelefono, setUserTelefono] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<ExpedienteData>(DEFAULT_EXPEDIENTE);

  // Dynamic Add inputs: Familiar
  const [famNombre, setFamNombre] = useState('');
  const [famParentesco, setFamParentesco] = useState('Hijo(a)');
  const [famCedula, setFamCedula] = useState('');
  const [famFechaNac, setFamFechaNac] = useState('');
  const [famVive, setFamVive] = useState('Sí');

  // Dynamic Add inputs: Curso
  const [curTitulo, setCurTitulo] = useState('');
  const [curLugar, setCurLugar] = useState('');
  const [curHoras, setCurHoras] = useState('');
  const [curFecha, setCurFecha] = useState('');

  const hasAccess = tienePermiso('Mi Expediente', 'ver');
  const canUpdate = tienePermiso('Mi Expediente', 'modificar') || tienePermiso('Mi Expediente', 'crear');

  useEffect(() => {
    if (permLoading || !hasAccess || !user) return;

    const cargarExpediente = async () => {
      setLoadingData(true);
      try {
        // Cargar email y teléfono en tiempo real de la tabla usuarios para mantener paridad
        const { data: dbUser, error: userError } = await supabase
          .from('usuarios')
          .select('email, telefono')
          .eq('cedula', user.cedula)
          .maybeSingle();

        if (!userError && dbUser) {
          setUserEmail(dbUser.email || '');
          setUserTelefono(dbUser.telefono || '');
        } else {
          setUserEmail(user.email || '');
          setUserTelefono(user.telefono || '');
        }

        const { data, error } = await supabase
          .from('expedientes_docentes')
          .select('*')
          .eq('usuario_cedula', user.cedula)
          .maybeSingle();

        if (error) {
          // If table does not exist, trigger demo/simulation mode
          if (error.code === 'PGRST205' || error.message.includes('relation "public.expedientes_docentes" does not exist')) {
            console.warn("Table 'expedientes_docentes' not found. Activating simulation mode.");
            setIsDemoMode(true);
            const localDemo = localStorage.getItem(`sigae_expediente_demo_${user.cedula}`);
            if (localDemo) {
              setFormData(JSON.parse(localDemo));
            }
            // En simulación local, cargamos del localStorage del usuario
            const stored = localStorage.getItem('usuario_sigae');
            if (stored) {
              const parsed = JSON.parse(stored);
              setUserEmail(parsed.email || '');
              setUserTelefono(parsed.telefono || '');
            }
          } else {
            throw error;
          }
        } else if (data) {
          setFormData({
            sexo: data.sexo || '',
            fecha_nacimiento: data.fecha_nacimiento || '',
            estado_civil: data.estado_civil || '',
            direccion: data.direccion || '',
            titulo_obtenido: data.titulo_obtenido || '',
            nivel_instruccion: data.nivel_instruccion || '',
            universidad: data.universidad || '',
            anio_egreso: data.anio_egreso || new Date().getFullYear(),
            fecha_ingreso: data.fecha_ingreso || '',
            tipo_nomina: data.tipo_nomina || 'Fijo',
            carga_horaria: data.carga_horaria || 36,
            estatus_laboral: data.estatus_laboral || 'Activo',
            documentos: data.documentos || DEFAULT_EXPEDIENTE.documentos,
            datos_salud: data.datos_salud || DEFAULT_SALUD,
            datos_electoral: data.datos_electoral || DEFAULT_ELECTORAL,
            datos_vivienda: data.datos_vivienda || DEFAULT_VIVIENDA,
            carga_familiar: data.carga_familiar || [],
            cursos_realizados: data.cursos_realizados || []
          });
        }
      } catch (e: any) {
        console.error("Error loading teacher profile:", e);
        if (Swal) Swal.fire("Aviso", "No se pudo sincronizar el expediente con la nube. Cargando borrador local.", "info");
      } finally {
        setLoadingData(false);
      }
    };

    cargarExpediente();
  }, [permLoading, hasAccess, userCedula]);

  const handleChange = (field: keyof ExpedienteData, val: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleNestedChange = (parent: 'datos_salud' | 'datos_electoral' | 'datos_vivienda', field: string, val: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: val
      }
    }));
  };

  const handleDocumentToggle = (docKey: keyof ExpedienteData['documentos']) => {
    setFormData(prev => ({
      ...prev,
      documentos: {
        ...prev.documentos,
        [docKey]: !prev.documentos[docKey]
      }
    }));
  };

  const agregarFamiliar = () => {
    if (!famNombre.trim()) {
      if (Swal) Swal.fire("Atención", "El nombre del familiar es requerido.", "warning");
      return;
    }
    const nuevo: Familiar = {
      nombres: famNombre.trim(),
      parentesco: famParentesco,
      cedula: famCedula.trim(),
      fecha_nacimiento: famFechaNac,
      vive_con_trabajador: famVive,
      condicion_neuro: 'Neurotípico'
    };
    setFormData(prev => ({
      ...prev,
      carga_familiar: [...prev.carga_familiar, nuevo]
    }));
    // Clear inputs
    setFamNombre('');
    setFamCedula('');
    setFamFechaNac('');
  };

  const eliminarFamiliar = (index: number) => {
    setFormData(prev => ({
      ...prev,
      carga_familiar: prev.carga_familiar.filter((_, idx) => idx !== index)
    }));
  };

  const agregarCurso = () => {
    if (!curTitulo.trim()) {
      if (Swal) Swal.fire("Atención", "El título del curso es requerido.", "warning");
      return;
    }
    const nuevo: Curso = {
      titulo: curTitulo.trim(),
      lugar: curLugar.trim(),
      horas: curHoras.trim(),
      fecha: curFecha
    };
    setFormData(prev => ({
      ...prev,
      cursos_realizados: [...prev.cursos_realizados, nuevo]
    }));
    // Clear inputs
    setCurTitulo('');
    setCurLugar('');
    setCurHoras('');
    setCurFecha('');
  };

  const eliminarCurso = (index: number) => {
    setFormData(prev => ({
      ...prev,
      cursos_realizados: prev.cursos_realizados.filter((_, idx) => idx !== index)
    }));
  };

  const validarPaso = (step: number): boolean => {
    if (step === 1) {
      if (!userEmail.trim()) {
        if (Swal) Swal.fire("Atención", "El correo electrónico es requerido.", "warning");
        return false;
      }
      if (!userTelefono.trim()) {
        if (Swal) Swal.fire("Atención", "El teléfono celular es requerido.", "warning");
        return false;
      }
      if (!formData.sexo) {
        if (Swal) Swal.fire("Atención", "Debe seleccionar su género.", "warning");
        return false;
      }
      if (!formData.fecha_nacimiento) {
        if (Swal) Swal.fire("Atención", "Debe ingresar su fecha de nacimiento.", "warning");
        return false;
      }
      if (!formData.estado_civil) {
        if (Swal) Swal.fire("Atención", "Debe seleccionar su estado civil.", "warning");
        return false;
      }
      if (!formData.direccion.trim()) {
        if (Swal) Swal.fire("Atención", "La dirección de habitación es requerida.", "warning");
        return false;
      }
    } else if (step === 5) {
      if (!formData.nivel_instruccion) {
        if (Swal) Swal.fire("Atención", "Debe indicar su nivel de instrucción.", "warning");
        return false;
      }
      if (!formData.titulo_obtenido.trim()) {
        if (Swal) Swal.fire("Atención", "El título profesional es requerido.", "warning");
        return false;
      }
      if (!formData.universidad.trim()) {
        if (Swal) Swal.fire("Atención", "La universidad/institución es requerida.", "warning");
        return false;
      }
    } else if (step === 6) {
      if (!formData.fecha_ingreso) {
        if (Swal) Swal.fire("Atención", "Debe ingresar la fecha de ingreso al plantel.", "warning");
        return false;
      }
      if (!formData.tipo_nomina) {
        if (Swal) Swal.fire("Atención", "Debe seleccionar el tipo de nómina.", "warning");
        return false;
      }
      if (formData.carga_horaria <= 0) {
        if (Swal) Swal.fire("Atención", "Carga horaria inválida.", "warning");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validarPaso(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleGuardar = async () => {
    if (!validarPaso(activeStep)) return;
    if (!canUpdate) {
      if (Swal) Swal.fire("Acceso Denegado", "Tu rol no tiene privilegios para guardar o actualizar el expediente.", "error");
      return;
    }

    setGuardando(true);
    try {
      if (isDemoMode) {
        // Local simulation save
        localStorage.setItem(`sigae_expediente_demo_${user.cedula}`, JSON.stringify(formData));
        
        // Simular guardado de correo y teléfono del usuario en local storage
        const stored = localStorage.getItem('usuario_sigae');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.email = userEmail;
          parsed.telefono = userTelefono;
          localStorage.setItem('usuario_sigae', JSON.stringify(parsed));
        }

        if (Swal) {
          Swal.fire({
            title: "¡Expediente Guardado!",
            html: "Los datos se guardaron en la <b>Simulación Local (Borrador)</b> de tu navegador debido a que la tabla <code>expedientes_docentes</code> aún no está migrada en la base de datos Supabase.<br/><br/><small className='text-muted'>Pide a tu administrador aplicar el script de migración para activar el almacenamiento en la nube.</small>",
            icon: "success",
            confirmButtonColor: "#00E676"
          });
        }
      } else {
        // Real cloud save (upsert)
        const payload = {
          usuario_cedula: user.cedula,
          ...formData,
          actualizado_en: new Date().toISOString()
        };

        const { error } = await supabase
          .from('expedientes_docentes')
          .upsert(payload, { onConflict: 'usuario_cedula' });

        if (error) throw error;

        // Actualizar el correo y teléfono en la tabla 'usuarios' para mantener paridad
        const { error: userError } = await supabase
          .from('usuarios')
          .update({
            email: userEmail.trim() || null,
            telefono: userTelefono.trim() || null
          })
          .eq('cedula', user.cedula);

        if (userError) throw userError;

        // Sincronizar local storage para reflejar el cambio inmediato
        const stored = localStorage.getItem('usuario_sigae');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.email = userEmail;
          parsed.telefono = userTelefono;
          localStorage.setItem('usuario_sigae', JSON.stringify(parsed));
        }

        auditar('Mi Expediente', 'Actualizar Expediente', `El docente ${user.nombre_completo || user.nombre} actualizó su expediente personal y datos de contacto.`);

        if (Swal) Swal.fire("¡Éxito!", "Tu expediente y datos de contacto se han guardado correctamente.", "success");
      }
    } catch (err: any) {
      console.error(err);
      if (Swal) Swal.fire("Error", "Ocurrió un error al guardar el expediente en el servidor.", "error");
    }
    setGuardando(false);
  };

  if (permLoading || (loadingData && hasAccess)) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5 h-100">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Cargando expediente...</span>
        </div>
      </div>
    );
  }

  if (!hasAccess || !user) {
    return (
      <div className="col-12 text-center py-5 mt-4">
        <div className="bg-light d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm border" style={{ width: '100px', height: '100px' }}>
          <i className="bi bi-shield-lock-fill text-muted" style={{ fontSize: '3.5rem' }}></i>
        </div>
        <h4 className="text-dark fw-bold mb-2">Área Restringida</h4>
        <p className="text-muted mb-0">No tienes permisos asignados para visualizar tu expediente.</p>
      </div>
    );
  }

  return (
    <div className="modulo-animado container-fluid p-0">
      {/* Banner */}
      <div className="row mb-4 animate__animated animate__fadeInDown">
        <div className="col-12">
          <div 
            className="banner-modulo p-4 p-md-5 text-white shadow-sm" 
            style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
          >
            <div className="burbuja-3d burbuja-1" style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.06)', position: 'absolute', top: '-50px', right: '-20px', borderRadius: '50%' }}></div>
            <div className="burbuja-3d burbuja-2" style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.04)', position: 'absolute', bottom: '-20px', left: '20px', borderRadius: '50%' }}></div>
            <div className="row align-items-center position-relative z-1">
              <div className="col-12 text-center text-md-start">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <span className="badge bg-white text-success mb-0 px-3 py-2 shadow-sm fw-bold" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>
                    <i className="bi bi-person-workspace me-1"></i> GESTIÓN DOCENTE
                  </span>
                  <button 
                    onClick={() => navigate('/categoria/Gestión%20Docente')} 
                    className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                  >
                    <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
                  </button>
                </div>
                <h1 className="fw-bolder mb-2 text-white" style={{ fontSize: '2.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  <i className="bi bi-person-vcard me-3"></i>Mi Expediente
                </h1>
                <p className="mb-0 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Consulta y edita tu expediente laboral, datos de salud, núcleo familiar y formación.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isDemoMode && (
        <div className="alert alert-warning border border-warning rounded-4 shadow-sm py-3 px-4 mb-4 d-flex align-items-center gap-3 animate__animated animate__fadeIn">
          <i className="bi bi-exclamation-triangle-fill fs-3 text-warning"></i>
          <div>
            <h6 className="mb-1 fw-bold text-dark">Modo de Simulación Local Activo</h6>
            <p className="mb-0 small text-muted">
              La tabla <code>expedientes_docentes</code> no está creada en la base de datos Supabase. Los datos se guardarán temporalmente en tu borrador de navegador.
            </p>
          </div>
        </div>
      )}

      {/* Wizard Card */}
      <div className="row g-4 justify-content-center">
        <div className="col-lg-12">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
            
            {/* Steps Stepper */}
            <div className="wizard-container mt-2" style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', overflowX: 'auto', paddingBottom: '10px' }}>
              <div className="wizard-line" style={{ width: '92%' }}></div>
              
              <div 
                className={`wizard-step-wrapper ${activeStep === 1 ? 'activo' : ''} ${activeStep > 1 ? 'completado' : ''}`}
                onClick={() => activeStep > 1 && setActiveStep(1)}
              >
                <div className="wizard-step">1</div>
                <span className="wizard-label">Identificación</span>
              </div>

              <div 
                className={`wizard-step-wrapper ${activeStep === 2 ? 'activo' : ''} ${activeStep > 2 ? 'completado' : ''}`}
                onClick={() => activeStep > 2 && setActiveStep(2)}
              >
                <div className="wizard-step">2</div>
                <span className="wizard-label">Salud y Tallas</span>
              </div>

              <div 
                className={`wizard-step-wrapper ${activeStep === 3 ? 'activo' : ''} ${activeStep > 3 ? 'completado' : ''}`}
                onClick={() => activeStep > 3 && setActiveStep(3)}
              >
                <div className="wizard-step">3</div>
                <span className="wizard-label">Votación y Vivienda</span>
              </div>

              <div 
                className={`wizard-step-wrapper ${activeStep === 4 ? 'activo' : ''} ${activeStep > 4 ? 'completado' : ''}`}
                onClick={() => activeStep > 4 && setActiveStep(4)}
              >
                <div className="wizard-step">4</div>
                <span className="wizard-label">Núcleo Familiar</span>
              </div>

              <div 
                className={`wizard-step-wrapper ${activeStep === 5 ? 'activo' : ''} ${activeStep > 5 ? 'completado' : ''}`}
                onClick={() => activeStep > 5 && setActiveStep(5)}
              >
                <div className="wizard-step">5</div>
                <span className="wizard-label">Formación</span>
              </div>

              <div 
                className={`wizard-step-wrapper ${activeStep === 6 ? 'activo' : ''}`}
                onClick={() => activeStep > 6 && setActiveStep(6)}
              >
                <div className="wizard-step">6</div>
                <span className="wizard-label">Laboral y Soportes</span>
              </div>
            </div>

            <hr className="my-4 text-muted opacity-25" />

            {/* STEP 1: PERSONAL INFORMATION */}
            <div className={`wizard-panel ${activeStep === 1 ? 'activo' : ''}`}>
              <div className="seccion-titulo"><i className="bi bi-person-fill me-2 text-success"></i>Paso 1: Información Personal y de Contacto</div>
              
              {/* Account Data Box (Read-Only) */}
              <div className="bg-light p-3 rounded-4 mb-4 border">
                <div className="row g-3">
                  <div className="col-md-6">
                    <span className="small fw-bold text-muted d-block">Nombre Completo</span>
                    <span className="fw-bold text-dark">{user.nombre_completo || user.nombre}</span>
                  </div>
                  <div className="col-md-6">
                    <span className="small fw-bold text-muted d-block">Cédula de Identidad</span>
                    <span className="fw-bold text-dark">{user.cedula}</span>
                  </div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Correo Electrónico <span className="text-danger">*</span></label>
                  <input 
                    type="email"
                    className="form-control input-moderno"
                    placeholder="correo@ejemplo.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Teléfono Celular <span className="text-danger">*</span></label>
                  <input 
                    type="text"
                    className="form-control input-moderno"
                    placeholder="Ej. 04121234567"
                    value={userTelefono}
                    onChange={(e) => setUserTelefono(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Género <span className="text-danger">*</span></label>
                  <select 
                    className="form-select input-moderno"
                    value={formData.sexo}
                    onChange={(e) => handleChange('sexo', e.target.value)}
                  >
                    <option value="">Seleccione...</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Fecha de Nacimiento <span className="text-danger">*</span></label>
                  <input 
                    type="date"
                    className="form-control input-moderno"
                    value={formData.fecha_nacimiento}
                    onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Estado Civil <span className="text-danger">*</span></label>
                  <select 
                    className="form-select input-moderno"
                    value={formData.estado_civil}
                    onChange={(e) => handleChange('estado_civil', e.target.value)}
                  >
                    <option value="">Seleccione...</option>
                    <option value="Soltero/a">Soltero/a</option>
                    <option value="Casado/a">Casado/a</option>
                    <option value="Divorciado/a">Divorciado/a</option>
                    <option value="Viudo/a">Viudo/a</option>
                    <option value="Concubino/a">Concubino/a</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">Dirección de Habitación <span className="text-danger">*</span></label>
                  <textarea 
                    className="form-control input-moderno"
                    rows={3}
                    placeholder="Ingresa la dirección detallada de domicilio..."
                    value={formData.direccion}
                    onChange={(e) => handleChange('direccion', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* STEP 2: HEALTH & UNIFORM SIZES */}
            <div className={`wizard-panel ${activeStep === 2 ? 'activo' : ''}`}>
              <div className="seccion-titulo"><i className="bi bi-heart-pulse-fill me-2 text-success"></i>Paso 2: Datos de Salud y Tallas de Uniforme</div>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Grupo Sanguíneo</label>
                  <select 
                    className="form-select input-moderno"
                    value={formData.datos_salud.grupo_sanguineo}
                    onChange={(e) => handleNestedChange('datos_salud', 'grupo_sanguineo', e.target.value)}
                  >
                    <option value="">Seleccione...</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">¿Posee carnet CONAPDIS?</label>
                  <select 
                    className="form-select input-moderno"
                    value={formData.datos_salud.conapdis}
                    onChange={(e) => handleNestedChange('datos_salud', 'conapdis', e.target.value)}
                  >
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Condición Neurodivergente</label>
                  <select 
                    className="form-select input-moderno"
                    value={formData.datos_salud.condicion_neuro}
                    onChange={(e) => handleNestedChange('datos_salud', 'condicion_neuro', e.target.value)}
                  >
                    <option value="Neurotípico">Neurotípico</option>
                    <option value="Neurodivergente">Neurodivergente</option>
                  </select>
                </div>
                
                <div className="col-12 col-md-6">
                  <label className="form-label">Condición Médica / Alergias</label>
                  <input 
                    type="text"
                    className="form-control input-moderno"
                    placeholder="Ej. Hipertensión, Asma, Alérgica a la Penicilina..."
                    value={formData.datos_salud.condicion_medica}
                    onChange={(e) => handleNestedChange('datos_salud', 'condicion_medica', e.target.value)}
                  />
                </div>

                <div className="col-md-6">
                  <div className="row g-2">
                    <div className="col-6 col-md-3">
                      <label className="form-label">Talla Camisa</label>
                      <input type="text" className="form-control input-moderno" placeholder="Ej. L" value={formData.datos_salud.talla_camisa} onChange={(e) => handleNestedChange('datos_salud', 'talla_camisa', e.target.value)} />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label">Talla Chemise</label>
                      <input type="text" className="form-control input-moderno" placeholder="Ej. L" value={formData.datos_salud.talla_chemise} onChange={(e) => handleNestedChange('datos_salud', 'talla_chemise', e.target.value)} />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label">Talla Pantalón</label>
                      <input type="text" className="form-control input-moderno" placeholder="Ej. 34" value={formData.datos_salud.talla_pantalon} onChange={(e) => handleNestedChange('datos_salud', 'talla_pantalon', e.target.value)} />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label">Talla Calzado</label>
                      <input type="text" className="form-control input-moderno" placeholder="Ej. 41" value={formData.datos_salud.talla_calzado} onChange={(e) => handleNestedChange('datos_salud', 'talla_calzado', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Nombre del Contacto de Emergencia</label>
                  <input 
                    type="text"
                    className="form-control input-moderno"
                    placeholder="Nombre completo del familiar/pareja"
                    value={formData.datos_salud.emergencia_nombre}
                    onChange={(e) => handleNestedChange('datos_salud', 'emergencia_nombre', e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Teléfono del Contacto de Emergencia</label>
                  <input 
                    type="text"
                    className="form-control input-moderno"
                    placeholder="Ej. 04141234567"
                    value={formData.datos_salud.emergencia_tel}
                    onChange={(e) => handleNestedChange('datos_salud', 'emergencia_tel', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* STEP 3: ELECTORAL DATA & HOUSING */}
            <div className={`wizard-panel ${activeStep === 3 ? 'activo' : ''}`}>
              <div className="seccion-titulo"><i className="bi bi-geo-alt-fill me-2 text-success"></i>Paso 3: Información Electoral y de Vivienda</div>
              <div className="row g-3">
                <div className="col-md-6 col-lg-3">
                  <label className="form-label">Estado Electoral</label>
                  <input type="text" className="form-control input-moderno" placeholder="Ej. Monagas" value={formData.datos_electoral.estado} onChange={(e) => handleNestedChange('datos_electoral', 'estado', e.target.value)} />
                </div>
                <div className="col-md-6 col-lg-3">
                  <label className="form-label">Municipio Electoral</label>
                  <input type="text" className="form-control input-moderno" placeholder="Ej. Maturín" value={formData.datos_electoral.municipio} onChange={(e) => handleNestedChange('datos_electoral', 'municipio', e.target.value)} />
                </div>
                <div className="col-md-6 col-lg-3">
                  <label className="form-label">Parroquia Electoral</label>
                  <input type="text" className="form-control input-moderno" placeholder="Ej. Santa Cruz" value={formData.datos_electoral.parroquia} onChange={(e) => handleNestedChange('datos_electoral', 'parroquia', e.target.value)} />
                </div>
                <div className="col-md-6 col-lg-3">
                  <label className="form-label">Centro de Votación</label>
                  <input type="text" className="form-control input-moderno" placeholder="Nombre de la escuela centro" value={formData.datos_electoral.centro_votacion} onChange={(e) => handleNestedChange('datos_electoral', 'centro_votacion', e.target.value)} />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Tipo de Vivienda</label>
                  <select 
                    className="form-select input-moderno"
                    value={formData.datos_vivienda.tipo}
                    onChange={(e) => handleNestedChange('datos_vivienda', 'tipo', e.target.value)}
                  >
                    <option value="">Seleccione...</option>
                    <option value="Casa">Casa</option>
                    <option value="Apartamento">Apartamento</option>
                    <option value="Quinta">Quinta</option>
                    <option value="Habitación">Habitación</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Condición de Habitación</label>
                  <select 
                    className="form-select input-moderno"
                    value={formData.datos_vivienda.condicion}
                    onChange={(e) => handleNestedChange('datos_vivienda', 'condicion', e.target.value)}
                  >
                    <option value="">Seleccione...</option>
                    <option value="Propia">Propia</option>
                    <option value="Alquilada">Alquilada</option>
                    <option value="Arrimado/a">Arrimado/a</option>
                    <option value="Prestada">Prestada / Cedida</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Crédito Habitacional (5 Sueldos)</label>
                  <select 
                    className="form-select input-moderno"
                    value={formData.datos_vivienda.credito_5_sueldos}
                    onChange={(e) => handleNestedChange('datos_vivienda', 'credito_5_sueldos', e.target.value)}
                  >
                    <option value="No Solicitado">No Solicitado</option>
                    <option value="Solicitado (En Espera)">Solicitado (En Espera)</option>
                    <option value="Pagando">Pagando</option>
                    <option value="Pagado">Pagado</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">Detalle sobre la condición de la vivienda (Opcional)</label>
                  <input type="text" className="form-control input-moderno" placeholder="Ej. Casa en terreno mancomunado / requiere ampliación..." value={formData.datos_vivienda.detalle_otra} onChange={(e) => handleNestedChange('datos_vivienda', 'detalle_otra', e.target.value)} />
                </div>
              </div>
            </div>

            {/* STEP 4: DEPENDENTS FAMILY */}
            <div className={`wizard-panel ${activeStep === 4 ? 'activo' : ''}`}>
              <div className="seccion-titulo"><i className="bi bi-people-fill me-2 text-success"></i>Paso 4: Carga Familiar y Dependientes</div>
              <p className="small text-muted mb-3">Registra los miembros de tu núcleo familiar directo (hijos, cónyuge, padres dependientes).</p>
              
              {/* Form to add familiar */}
              <div className="bg-light p-3 border rounded-4 mb-4">
                <div className="row g-2 align-items-end">
                  <div className="col-md-3">
                    <label className="small fw-bold text-muted mb-1">Nombre Completo</label>
                    <input type="text" className="form-control input-moderno animate__animated animate__fadeIn" placeholder="Ej. Siuly Velásquez" value={famNombre} onChange={(e) => setFamNombre(e.target.value)} />
                  </div>
                  <div className="col-md-2">
                    <label className="small fw-bold text-muted mb-1">Parentesco</label>
                    <select className="form-select input-moderno" value={famParentesco} onChange={(e) => setFamParentesco(e.target.value)}>
                      <option value="Hijo(a)">Hijo(a)</option>
                      <option value="Esposo(a)">Esposo(a)</option>
                      <option value="Concubino(a)">Concubino(a)</option>
                      <option value="Madre">Madre</option>
                      <option value="Padre">Padre</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="small fw-bold text-muted mb-1">Cédula</label>
                    <input type="text" className="form-control input-moderno" placeholder="Ej. 30123456" value={famCedula} onChange={(e) => setFamCedula(e.target.value)} />
                  </div>
                  <div className="col-md-2">
                    <label className="small fw-bold text-muted mb-1">Fecha Nac.</label>
                    <input type="date" className="form-control input-moderno" value={famFechaNac} onChange={(e) => setFamFechaNac(e.target.value)} />
                  </div>
                  <div className="col-md-1">
                    <label className="small fw-bold text-muted mb-1">¿Vive contigo?</label>
                    <select className="form-select input-moderno" value={famVive} onChange={(e) => setFamVive(e.target.value)}>
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <button type="button" onClick={agregarFamiliar} className="btn btn-success w-100 rounded-pill fw-bold hover-efecto"><i className="bi bi-plus-circle me-1"></i> Agregar</button>
                  </div>
                </div>
              </div>

              {/* Table of family charges */}
              <div className="table-responsive">
                <table className="table table-hover align-middle border">
                  <thead className="bg-light text-muted small">
                    <tr>
                      <th>Nombre Completo</th>
                      <th>Parentesco</th>
                      <th>Cédula</th>
                      <th>Fecha de Nacimiento</th>
                      <th>¿Vive con Trabajador?</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.carga_familiar.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-muted">
                          No tienes cargas familiares registradas.
                        </td>
                      </tr>
                    ) : (
                      formData.carga_familiar.map((f, idx) => (
                        <tr key={idx}>
                          <td className="fw-bold">{f.nombres}</td>
                          <td><span className="badge bg-light text-dark border">{f.parentesco}</span></td>
                          <td>{f.cedula || 'Sin Cédula'}</td>
                          <td>{f.fecha_nacimiento || 'No registrada'}</td>
                          <td>{f.vive_con_trabajador}</td>
                          <td className="text-end">
                            <button type="button" onClick={() => eliminarFamiliar(idx)} className="btn btn-sm btn-outline-danger rounded-pill"><i className="bi bi-trash-fill"></i> Eliminar</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* STEP 5: ACADEMIC PROFILE & COMPLETED COURSES */}
            <div className={`wizard-panel ${activeStep === 5 ? 'activo' : ''}`}>
              <div className="seccion-titulo"><i className="bi bi-mortarboard-fill me-2 text-success"></i>Paso 5: Formación Académica y Cursos Realizados</div>
              
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label">Último Grado de Instrucción <span className="text-danger">*</span></label>
                  <select 
                    className="form-select input-moderno"
                    value={formData.nivel_instruccion}
                    onChange={(e) => handleChange('nivel_instruccion', e.target.value)}
                  >
                    <option value="">Seleccione...</option>
                    <option value="T.S.U.">T.S.U. (Técnico Superior Universitario)</option>
                    <option value="Licenciatura / Profesorado">Licenciatura / Profesorado</option>
                    <option value="Especialización">Especialización</option>
                    <option value="Maestría">Maestría</option>
                    <option value="Doctorado">Doctorado</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Título Universitario <span className="text-danger">*</span></label>
                  <input 
                    type="text"
                    className="form-control input-moderno"
                    placeholder="Ej. Licenciado en Educación mención Ciencias"
                    value={formData.titulo_obtenido}
                    onChange={(e) => handleChange('titulo_obtenido', e.target.value)}
                  />
                </div>
                <div className="col-md-8">
                  <label className="form-label">Universidad / Instituto Egreso <span className="text-danger">*</span></label>
                  <input 
                    type="text"
                    className="form-control input-moderno"
                    placeholder="Ej. Universidad de Oriente (UDO)"
                    value={formData.universidad}
                    onChange={(e) => handleChange('universidad', e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Año de Egreso <span className="text-danger">*</span></label>
                  <input 
                    type="number"
                    className="form-control input-moderno"
                    min="1970"
                    max={new Date().getFullYear()}
                    value={formData.anio_egreso}
                    onChange={(e) => handleChange('anio_egreso', parseInt(e.target.value) || new Date().getFullYear())}
                  />
                </div>
              </div>

              <div className="seccion-titulo mt-4"><i className="bi bi-patch-check-fill me-2 text-success"></i>Cursos y Certificados Realizados</div>
              
              {/* Form to add course */}
              <div className="bg-light p-3 border rounded-4 mb-4">
                <div className="row g-2 align-items-end">
                  <div className="col-md-4">
                    <label className="small fw-bold text-muted mb-1">Título del Curso / Taller</label>
                    <input type="text" className="form-control input-moderno" placeholder="Ej. Inteligencia Artificial en el Aula" value={curTitulo} onChange={(e) => setCurTitulo(e.target.value)} />
                  </div>
                  <div className="col-md-3">
                    <label className="small fw-bold text-muted mb-1">Institución / Lugar</label>
                    <input type="text" className="form-control input-moderno" placeholder="Ej. CIED Maturín" value={curLugar} onChange={(e) => setCurLugar(e.target.value)} />
                  </div>
                  <div className="col-md-2">
                    <label className="small fw-bold text-muted mb-1">Horas Duración</label>
                    <input type="text" className="form-control input-moderno" placeholder="Ej. 16 Horas" value={curHoras} onChange={(e) => setCurHoras(e.target.value)} />
                  </div>
                  <div className="col-md-2">
                    <label className="small fw-bold text-muted mb-1">Fecha / Año</label>
                    <input type="text" className="form-control input-moderno" placeholder="Ej. 2014" value={curFecha} onChange={(e) => setCurFecha(e.target.value)} />
                  </div>
                  <div className="col-md-1">
                    <button type="button" onClick={agregarCurso} className="btn btn-success w-100 rounded-pill fw-bold hover-efecto"><i className="bi bi-plus-circle me-1"></i></button>
                  </div>
                </div>
              </div>

              {/* Table of courses */}
              <div className="table-responsive">
                <table className="table table-hover align-middle border">
                  <thead className="bg-light text-muted small">
                    <tr>
                      <th>Título del Curso / Taller</th>
                      <th>Lugar de Realización</th>
                      <th>Horas</th>
                      <th>Fecha / Año</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.cursos_realizados.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-muted">
                          No tienes cursos ni talleres certificados registrados.
                        </td>
                      </tr>
                    ) : (
                      formData.cursos_realizados.map((c, idx) => (
                        <tr key={idx}>
                          <td className="fw-bold">{c.titulo}</td>
                          <td>{c.lugar}</td>
                          <td>{c.horas || 'N/A'}</td>
                          <td>{c.fecha}</td>
                          <td className="text-end">
                            <button type="button" onClick={() => eliminarCurso(idx)} className="btn btn-sm btn-outline-danger rounded-pill"><i className="bi bi-trash-fill"></i> Eliminar</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* STEP 6: LABOR DATA & DOCUMENTS */}
            <div className={`wizard-panel ${activeStep === 6 ? 'activo' : ''}`}>
              <div className="seccion-titulo"><i className="bi bi-briefcase-fill me-2 text-success"></i>Paso 6: Datos Laborales y Documentos Soporte</div>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label">Fecha de Ingreso al Plantel <span className="text-danger">*</span></label>
                  <input 
                    type="date"
                    className="form-control input-moderno"
                    value={formData.fecha_ingreso}
                    onChange={(e) => handleChange('fecha_ingreso', e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Tipo de Nómina <span className="text-danger">*</span></label>
                  <select 
                    className="form-select input-moderno"
                    value={formData.tipo_nomina}
                    onChange={(e) => handleChange('tipo_nomina', e.target.value)}
                  >
                    <option value="">Seleccione...</option>
                    <option value="Fijo">Fijo (Docente Titular)</option>
                    <option value="Contratado">Contratado</option>
                    <option value="Interino">Interino</option>
                    <option value="Jubilado">Jubilado (Activo)</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Carga Horaria Semanal <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <input 
                      type="number"
                      className="form-control input-moderno"
                      min="1"
                      max="50"
                      value={formData.carga_horaria}
                      onChange={(e) => handleChange('carga_horaria', parseInt(e.target.value) || 0)}
                    />
                    <span className="input-group-text bg-light text-muted fw-bold">Horas</span>
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Estatus Laboral <span className="text-danger">*</span></label>
                  <select 
                    className="form-select input-moderno"
                    value={formData.estatus_laboral}
                    onChange={(e) => handleChange('estatus_laboral', e.target.value)}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Incapacitado / Reposo">Incapacitado / Reposo</option>
                    <option value="Comisión de Servicio">Comisión de Servicio</option>
                    <option value="Permiso No Remunerado">Permiso No Remunerado</option>
                  </select>
                </div>
              </div>

              <div className="seccion-titulo mt-4"><i className="bi bi-file-earmark-arrow-up-fill me-2 text-success"></i>Consignación de Documentos Soporte</div>
              <p className="small text-muted mb-4">
                Indica los documentos que has entregado físicamente en la carpeta de tu expediente.
              </p>

              <div className="row g-3">
                <div className="col-md-6">
                  <div className="caja-dinamica d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="mb-1 fw-bold text-dark"><i className="bi bi-card-image text-muted me-2"></i>Cédula de Identidad</h6>
                      <small className="text-muted">Copia ampliada y legible.</small>
                    </div>
                    <div className="form-check form-switch fs-4">
                      <input 
                        className="form-check-input"
                        type="checkbox"
                        checked={formData.documentos.cedula}
                        onChange={() => handleDocumentToggle('cedula')}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="caja-dinamica d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="mb-1 fw-bold text-dark"><i className="bi bi-award text-muted me-2"></i>Título Universitario</h6>
                      <small className="text-muted">Título registrado y visible.</small>
                    </div>
                    <div className="form-check form-switch fs-4">
                      <input 
                        className="form-check-input"
                        type="checkbox"
                        checked={formData.documentos.titulo}
                        onChange={() => handleDocumentToggle('titulo')}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="caja-dinamica d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="mb-1 fw-bold text-dark"><i className="bi bi-file-earmark-person text-muted me-2"></i>Síntesis Curricular</h6>
                      <small className="text-muted">CV actualizado y firmado.</small>
                    </div>
                    <div className="form-check form-switch fs-4">
                      <input 
                        className="form-check-input"
                        type="checkbox"
                        checked={formData.documentos.cv}
                        onChange={() => handleDocumentToggle('cv')}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="caja-dinamica d-flex align-items-center justify-content-between">
                    <div>
                      <h6 className="mb-1 fw-bold text-dark"><i className="bi bi-file-earmark-check text-muted me-2"></i>Constancia de Trabajo</h6>
                      <small className="text-muted">Credencial de nómina activa.</small>
                    </div>
                    <div className="form-check form-switch fs-4">
                      <input 
                        className="form-check-input"
                        type="checkbox"
                        checked={formData.documentos.constancia}
                        onChange={() => handleDocumentToggle('constancia')}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stepper Footer Controls */}
            <hr className="my-4 text-muted opacity-25" />
            <div className="d-flex justify-content-between">
              {activeStep > 1 ? (
                <button 
                  onClick={handleBack}
                  className="btn btn-secondary rounded-pill px-4 fw-bold shadow-sm hover-efecto"
                >
                  <i className="bi bi-arrow-left-short me-1"></i> Atrás
                </button>
              ) : (
                <div></div>
              )}

              {activeStep < 6 ? (
                <button 
                  onClick={handleNext}
                  className="btn btn-success rounded-pill px-4 fw-bold shadow-sm hover-efecto text-white"
                >
                  Siguiente <i className="bi bi-arrow-right-short ms-1"></i>
                </button>
              ) : (
                <button 
                  onClick={handleGuardar}
                  className="btn btn-success rounded-pill px-5 fw-bold shadow-sm hover-efecto text-white"
                  disabled={guardando}
                >
                  {guardando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-floppy-fill me-2"></i>Guardar Expediente
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
