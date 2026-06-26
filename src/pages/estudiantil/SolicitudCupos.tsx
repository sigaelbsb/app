import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';

// ─── CONSTANTES ────────────────────────────────────────────────────────────────

const GRADOS = [
  'II Grupo (Inicial)',
  'III Grupo (Inicial)',
  '1° Grado',
  '2° Grado',
  '3° Grado',
  '4° Grado',
  '5° Grado',
  '6° Grado',
  '1° Año (Media General)',
  '2° Año (Media General)',
  '3° Año (Media General)',
  '4° Año (Media General)',
  '5° Año (Media General)',
];

const PARENTESCOS = [
  'Hijo o Hija',
  'Sobrino o Sobrina',
  'Nieto o Nieta',
  'Hermano o Hermana',
  'Otro',
];

const GERENCIAS_PDVSA = [
  'Ambiente',
  'Asuntos Públicos',
  'Automatización, Informática y Telecomunicaciones',
  'Calidad',
  'Confiabilidad Operacional',
  'Contratación',
  'Logística',
  'Mantenimiento',
  'Optimización de Producción',
  'Planificación y Presupuesto',
  'Planta de Gas y Agua',
  'Producción',
  'Propiedades y Catastro',
  'Proyectos Mayores',
  'Recursos Humanos',
  'Relaciones Gubernamentales',
  'Salud Integral',
  'Seguridad Industrial e Higiene',
  'Servicios Eléctricos',
  'Servicios Logísticos',
  'Perforación RA/RC',
  'Subgerencia Operativa',
  'Subsuelo',
  'Transporte Terrestre',
  'TRAVI',
  'PDVSA Gas',
  'FAJA',
  'Transporte Aéreo',
  'Desarrollo Urbano',
  'Auditoría Interna',
  'BARIVEN',
  'MINPET',
  'OTROS',
];

const ANIOS_PREVIOS = ['2021 - 2022', '2022 - 2023', '2023 - 2024', 'Ninguna'];

// ─── GENERACIÓN DE CÓDIGO ÚNICO ────────────────────────────────────────────────

const generarCodigoUnico = (escCodigo: string): string => {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SC-${escCodigo.toUpperCase()}-${year}-${suffix}`;
};

// ─── INTERFACES ────────────────────────────────────────────────────────────────

interface SolicitudForm {
  // Paso 1 - Términos
  acepta_terminos: boolean;
  codigo_unico: string;

  // Paso 2 - Estudiante
  estudiante_nombres: string;
  estudiante_apellidos: string;
  estudiante_cedula: string;
  estudiante_fecha_nacimiento: string;
  estudiante_sexo: string;
  estudiante_orden_nacimiento: string;
  grado_solicitado: string;
  parentesco: string;
  direccion_habitacion: string;
  localidad_habitacion: string;
  solicitudes_previas: string[];
  tiene_otros_inscritos: boolean;
  plantel_procedencia: string;

  // Paso 3 - Representante
  representante_nombres: string;
  representante_apellidos: string;
  representante_cedula: string;
  representante_telefono: string;
  representante_telefono2: string;
  representante_email: string;
  representante_parentesco: string;
  representante_trabaja_pdvsa: string;

  // Paso 4 - PDVSA / Madre
  pdvsa_tipo_nomina: string;
  pdvsa_gerencia: string;
  pdvsa_email_empresa: string;
  pdvsa_localidad_trabajo: string;
  madre_cedula: string;
  madre_email: string;
  madre_trabaja_pdvsa: boolean;
  requiere_transporte: boolean;
  ruta_transporte: string;
}

interface SolicitudDB extends SolicitudForm {
  id?: string;
  codigo_escuela: string;
  estado: string;
  observaciones: string;
  creado_por: string;
  created_at?: string;
  updated_at?: string;
}

const defaultForm = (): SolicitudForm => ({
  acepta_terminos: false,
  codigo_unico: '',
  estudiante_nombres: '',
  estudiante_apellidos: '',
  estudiante_cedula: '',
  estudiante_fecha_nacimiento: '',
  estudiante_sexo: 'Femenino',
  estudiante_orden_nacimiento: '',
  grado_solicitado: '',
  parentesco: 'Hijo o Hija',
  direccion_habitacion: '',
  localidad_habitacion: '',
  solicitudes_previas: [],
  tiene_otros_inscritos: false,
  plantel_procedencia: '',
  representante_nombres: '',
  representante_apellidos: '',
  representante_cedula: '',
  representante_telefono: '',
  representante_telefono2: '',
  representante_email: '',
  representante_parentesco: 'Padre',
  representante_trabaja_pdvsa: 'No',
  pdvsa_tipo_nomina: 'Contractual',
  pdvsa_gerencia: '',
  pdvsa_email_empresa: '',
  pdvsa_localidad_trabajo: '',
  madre_cedula: '',
  madre_email: '',
  madre_trabaja_pdvsa: false,
  requiere_transporte: false,
  ruta_transporte: '',
});

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────

export const SolicitudCupos = () => {
  const navigate = useNavigate();
  const { user, loading: permLoading } = usePermisos();
  const Swal = (window as any).Swal;

  const [solicitudes, setSolicitudes] = useState<SolicitudDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'mis_solicitudes' | 'nueva_solicitud' | 'gestion'>('mis_solicitudes');
  const [filterEstado, setFilterEstado] = useState('TODOS');
  const [searchQuery, setSearchQuery] = useState('');

  // Wizard state
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SolicitudForm>(defaultForm());
  const [solicitudGuardada, setSolicitudGuardada] = useState<SolicitudDB | null>(null);

  // Evaluation state
  const [selectedSol, setSelectedSol] = useState<SolicitudDB | null>(null);
  const [evalEstado, setEvalEstado] = useState('Aprobado');
  const [evalObs, setEvalObs] = useState('');

  const escCodigo = localStorage.getItem('sigae_escuela_codigo') || 'sb';
  const escNombre = escCodigo === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
  const isUserAdmin = ['SuperAdmin', 'Director', 'Administrador', 'Coordinador'].includes(user?.rol);

  useEffect(() => {
    if (!permLoading && user) {
      setActiveTab(isUserAdmin ? 'gestion' : 'mis_solicitudes');
      cargarDatos();
    }
  }, [permLoading, user, escCodigo]);

  // Autofill representative info
  useEffect(() => {
    if (user && activeTab === 'nueva_solicitud') {
      const nombresSplit = user.nombre ? user.nombre.split(' ') : [];
      setForm(prev => ({
        ...prev,
        representante_nombres: nombresSplit.slice(0, 2).join(' ') || '',
        representante_apellidos: nombresSplit.slice(2).join(' ') || '',
        representante_cedula: user.cedula || '',
        representante_email: user.email || '',
        representante_telefono: user.telefono || '',
      }));
    }
  }, [user, activeTab]);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('solicitud_cupos').select('*').eq('codigo_escuela', escCodigo);
      if (!isUserAdmin && user) query = query.eq('creado_por', user.cedula);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setSolicitudes((data as SolicitudDB[]) || []);
    } catch (e) {
      console.error('Error cargando solicitudes de cupo:', e);
    } finally {
      setLoading(false);
    }
  }, [escCodigo, isUserAdmin, user]);

  const updateForm = (field: keyof SolicitudForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleSolicitudPrevia = (anio: string) => {
    const prev = form.solicitudes_previas;
    if (anio === 'Ninguna') {
      setForm(f => ({ ...f, solicitudes_previas: prev.includes('Ninguna') ? [] : ['Ninguna'] }));
    } else {
      const sinNinguna = prev.filter(a => a !== 'Ninguna');
      if (sinNinguna.includes(anio)) {
        setForm(f => ({ ...f, solicitudes_previas: sinNinguna.filter(a => a !== anio) }));
      } else {
        setForm(f => ({ ...f, solicitudes_previas: [...sinNinguna, anio] }));
      }
    }
  };

  const handleIniciarSolicitud = () => {
    if (!form.acepta_terminos) {
      if (Swal) Swal.fire('Atención', 'Debes aceptar los términos y condiciones para continuar.', 'warning');
      return;
    }
    const codigo = generarCodigoUnico(escCodigo);
    setForm(prev => ({ ...prev, codigo_unico: codigo }));
    setStep(2);
  };

  const handleSubmitFinal = async () => {
    if (!form.representante_cedula || !form.representante_telefono || !form.representante_email) {
      if (Swal) Swal.fire('Atención', 'Por favor completa todos los campos obligatorios (*)', 'warning');
      return;
    }

    try {
      const payload: Omit<SolicitudDB, 'id' | 'created_at' | 'updated_at'> = {
        ...form,
        codigo_escuela: escCodigo,
        estudiante_orden_nacimiento: form.estudiante_orden_nacimiento,
        solicitudes_previas: form.solicitudes_previas,
        estado: 'Pendiente',
        observaciones: '',
        creado_por: user?.cedula || form.representante_cedula,
      };

      const { data, error } = await supabase.from('solicitud_cupos').insert([payload]).select().single();
      if (error) throw error;

      await auditar('Solicitud de Cupos', 'Crear Solicitud',
        `Nueva solicitud ${form.codigo_unico} para: ${form.estudiante_nombres} ${form.estudiante_apellidos}`);

      setSolicitudGuardada(data as SolicitudDB);
      setStep(5);
    } catch (e: any) {
      console.error('Error al registrar solicitud:', e);
      if (Swal) Swal.fire('Error', 'No se pudo registrar la solicitud: ' + e.message, 'error');
    }
  };

  const handleNuevaSolicitud = () => {
    setForm(prev => ({
      ...defaultForm(),
      representante_nombres: prev.representante_nombres,
      representante_apellidos: prev.representante_apellidos,
      representante_cedula: prev.representante_cedula,
      representante_email: prev.representante_email,
      representante_telefono: prev.representante_telefono,
    }));
    setSolicitudGuardada(null);
    setStep(1);
  };

  const handleEvaluarSolicitud = async () => {
    if (!selectedSol) return;
    try {
      const { error } = await supabase
        .from('solicitud_cupos')
        .update({ estado: evalEstado, observaciones: evalObs.trim(), updated_at: new Date().toISOString() })
        .eq('id', selectedSol.id);
      if (error) throw error;
      await auditar('Solicitud de Cupos', 'Evaluar Solicitud',
        `Evaluación de ${selectedSol.estudiante_nombres} ${selectedSol.estudiante_apellidos} → ${evalEstado}`);
      if (Swal) Swal.fire('Evaluación Guardada', `La solicitud ha sido clasificada como '${evalEstado}'.`, 'success');
      const closeBtn = document.getElementById('btn-close-eval-modal');
      if (closeBtn) closeBtn.click();
      cargarDatos();
    } catch (e: any) {
      if (Swal) Swal.fire('Error', 'No se pudo actualizar el estado: ' + e.message, 'error');
    }
  };

  const handleEliminarSolicitud = async (sol: SolicitudDB) => {
    if (!sol.id || !Swal) return;
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Esta acción eliminará la solicitud de cupo para ${sol.estudiante_nombres} ${sol.estudiante_apellidos}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        try {
          const { error } = await supabase.from('solicitud_cupos').delete().eq('id', sol.id);
          if (error) throw error;
          await auditar('Solicitud de Cupos', 'Eliminar Solicitud', `Eliminada solicitud: ${sol.codigo_unico}`);
          Swal.fire('Eliminada', 'La solicitud ha sido eliminada correctamente.', 'success');
          cargarDatos();
        } catch (e: any) {
          Swal.fire('Error', 'No se pudo eliminar la solicitud: ' + e.message, 'error');
        }
      }
    });
  };

  const filteredSolicitudes = solicitudes.filter(sol => {
    const matchesEstado = filterEstado === 'TODOS' || sol.estado === filterEstado;
    const s = `${sol.estudiante_nombres} ${sol.estudiante_apellidos} ${sol.representante_nombres} ${sol.representante_apellidos} ${sol.representante_cedula} ${sol.codigo_unico || ''}`.toLowerCase();
    return matchesEstado && s.includes(searchQuery.toLowerCase());
  });

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'Aprobado':
        return <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle px-3 py-1 rounded-pill"><i className="bi bi-check-circle-fill me-1"></i>Aprobado</span>;
      case 'Rechazado':
        return <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle px-3 py-1 rounded-pill"><i className="bi bi-x-circle-fill me-1"></i>Rechazado</span>;
      default:
        return <span className="badge bg-warning bg-opacity-10 text-warning border border-warning-subtle px-3 py-1 rounded-pill"><i className="bi bi-clock-fill me-1"></i>Pendiente</span>;
    }
  };

  const stats = {
    total: solicitudes.length,
    pendientes: solicitudes.filter(s => s.estado === 'Pendiente').length,
    aprobados: solicitudes.filter(s => s.estado === 'Aprobado').length,
    rechazados: solicitudes.filter(s => s.estado === 'Rechazado').length,
  };

  // ─── QR URL ─────────────────────────────────────────────────────────────────
  const getQrUrl = (codigo: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=SC:${encodeURIComponent(codigo)}&bgcolor=ffffff&color=166534&margin=10`;

  // ─── WIZARD STEPPER ──────────────────────────────────────────────────────────
  const STEPS = [
    { num: 1, label: 'Términos', icon: 'bi-file-text' },
    { num: 2, label: 'Estudiante', icon: 'bi-mortarboard' },
    { num: 3, label: 'Representante', icon: 'bi-person-lines-fill' },
    { num: 4, label: 'PDVSA & Transporte', icon: 'bi-buildings' },
    { num: 5, label: 'Confirmación', icon: 'bi-patch-check' },
  ];

  const renderStepper = () => (
    <div className="d-flex align-items-center justify-content-between mb-4 px-2" style={{ overflowX: 'auto' }}>
      {STEPS.map((s, idx) => (
        <React.Fragment key={s.num}>
          <div className="d-flex flex-column align-items-center" style={{ minWidth: 70 }}>
            <div
              className={`rounded-circle d-flex align-items-center justify-content-center fw-bold mb-1 ${step === s.num ? 'bg-success text-white shadow' : step > s.num ? 'bg-success bg-opacity-25 text-success' : 'bg-light text-muted border'}`}
              style={{ width: 44, height: 44, fontSize: 18, transition: 'all 0.3s' }}
            >
              {step > s.num ? <i className="bi bi-check-lg"></i> : <i className={`bi ${s.icon}`}></i>}
            </div>
            <span className={`text-center fw-semibold`} style={{ fontSize: '0.7rem', color: step >= s.num ? '#166534' : '#9ca3af' }}>
              {s.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className="flex-grow-1 mx-1"
              style={{ height: 3, borderRadius: 4, background: step > s.num ? 'linear-gradient(90deg,#16a34a,#22c55e)' : '#e5e7eb', transition: 'background 0.4s' }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // ─── PASO 1: TÉRMINOS Y CONDICIONES ──────────────────────────────────────────
  const renderStep1 = () => (
    <div className="animate__animated animate__fadeIn">
      <div className="text-center mb-4">
        <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 72, height: 72, border: '2px solid rgba(22,163,74,0.2)' }}>
          <i className="bi bi-shield-check text-success" style={{ fontSize: 32 }}></i>
        </div>
        <h5 className="fw-bold text-dark mb-1">Términos y Condiciones</h5>
        <p className="text-muted small">Bienvenido/a al módulo de Solicitud de Cupos para el año escolar {new Date().getFullYear()} – {new Date().getFullYear() + 1}.</p>
      </div>

      <div className="bg-light rounded-4 p-4 border mb-4" style={{ maxHeight: 260, overflowY: 'auto', fontSize: '0.88rem', lineHeight: 1.7 }}>
        <p><strong>Estimado/a representante:</strong></p>
        <p>
          A continuación se presenta el formulario oficial de solicitud de cupos para el <strong>{escNombre}</strong>.
          Lea detenidamente cada sección y proceda a dar respuesta a cada pregunta de forma veraz y actualizada.
        </p>
        <ul>
          <li>La información suministrada será utilizada exclusivamente con fines académicos e institucionales.</li>
          <li>Toda información falsa o inexacta puede resultar en la anulación de la solicitud.</li>
          <li>Una vez enviada, recibirá un <strong>código único de seguimiento</strong> con código QR para verificar el estado de su solicitud.</li>
          <li>La institución se reserva el derecho de aprobar o rechazar las solicitudes según disponibilidad de cupos y criterios internos.</li>
          <li>La solicitud de cupo <strong>no garantiza</strong> la inscripción definitiva del estudiante.</li>
        </ul>
        <p>
          Al aceptar, declara que la información aportada en este formulario es <strong>veraz y actualizada</strong>, y autoriza al plantel a procesar dicha información conforme a sus políticas institucionales.
        </p>
      </div>

      <div
        className={`p-4 rounded-4 border-2 mb-4 cursor-pointer ${form.acepta_terminos ? 'bg-success bg-opacity-10 border-success' : 'bg-white border'}`}
        style={{ cursor: 'pointer', borderStyle: 'solid', borderWidth: 2, borderColor: form.acepta_terminos ? '#16a34a' : '#d1d5db', transition: 'all 0.3s' }}
        onClick={() => updateForm('acepta_terminos', !form.acepta_terminos)}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className={`rounded d-flex align-items-center justify-content-center flex-shrink-0 ${form.acepta_terminos ? 'bg-success text-white' : 'bg-white border'}`}
            style={{ width: 28, height: 28, border: form.acepta_terminos ? 'none' : '2px solid #d1d5db', transition: 'all 0.2s' }}
          >
            {form.acepta_terminos && <i className="bi bi-check-lg fw-bold"></i>}
          </div>
          <div>
            <div className={`fw-bold ${form.acepta_terminos ? 'text-success' : 'text-dark'}`}>Acepto los términos y condiciones</div>
            <div className="text-muted small">Declaro que la información que proporcionaré es veraz y actualizada.</div>
          </div>
        </div>
      </div>

      <div className="text-end">
        <button
          className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto"
          onClick={handleIniciarSolicitud}
          disabled={!form.acepta_terminos}
        >
          Continuar <i className="bi bi-arrow-right ms-1"></i>
        </button>
      </div>
    </div>
  );

  // ─── PASO 2: DATOS DEL ESTUDIANTE ─────────────────────────────────────────────
  const renderStep2 = () => (
    <div className="animate__animated animate__fadeIn">
      <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
        <i className="bi bi-mortarboard-fill text-success fs-5"></i>
        <h6 className="fw-bold text-dark mb-0">Datos del Estudiante</h6>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label fw-semibold">Nombres y Apellidos del Estudiante <span className="text-danger">*</span></label>
          <input type="text" className="form-control input-moderno" placeholder="Ej. María Alejandra García López"
            value={`${form.estudiante_nombres}${form.estudiante_apellidos ? ' ' + form.estudiante_apellidos : ''}`}
            onChange={(e) => {
              const parts = e.target.value.split(' ');
              const mid = Math.ceil(parts.length / 2);
              updateForm('estudiante_nombres', parts.slice(0, mid).join(' '));
              updateForm('estudiante_apellidos', parts.slice(mid).join(' '));
            }} required />
          <div className="form-text">Escribe el nombre completo (nombres y apellidos)</div>
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold">N° Cédula / Escolar</label>
          <input type="text" className="form-control input-moderno" placeholder="Ej. 32123456"
            value={form.estudiante_cedula} onChange={(e) => updateForm('estudiante_cedula', e.target.value)} />
          <div className="form-text">Solo si posee cédula o carnet escolar</div>
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold">Género <span className="text-danger">*</span></label>
          <div className="d-flex gap-2 mt-1">
            {['Femenino', 'Masculino'].map(g => (
              <button key={g} type="button"
                className={`btn rounded-pill flex-grow-1 fw-semibold ${form.estudiante_sexo === g ? 'btn-success shadow' : 'btn-outline-secondary'}`}
                onClick={() => updateForm('estudiante_sexo', g)}>
                <i className={`bi ${g === 'Femenino' ? 'bi-gender-female' : 'bi-gender-male'} me-1`}></i>{g}
              </button>
            ))}
          </div>
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold">Fecha de Nacimiento <span className="text-danger">*</span></label>
          <input type="date" className="form-control input-moderno" value={form.estudiante_fecha_nacimiento}
            onChange={(e) => updateForm('estudiante_fecha_nacimiento', e.target.value)} required />
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold">N° de Hijo/a en la Familia <span className="text-danger">*</span></label>
          <input type="number" min="1" max="20" className="form-control input-moderno" placeholder="Ej. 2"
            value={form.estudiante_orden_nacimiento} onChange={(e) => updateForm('estudiante_orden_nacimiento', e.target.value)} />
          <div className="form-text">Orden de nacimiento entre sus hermanos</div>
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold">Grado o Año a Cursar <span className="text-danger">*</span></label>
          <select className="form-select input-moderno" value={form.grado_solicitado}
            onChange={(e) => updateForm('grado_solicitado', e.target.value)} required>
            <option value="">Seleccione...</option>
            {GRADOS.map((g, i) => <option key={i} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold">Parentesco <span className="text-danger">*</span></label>
          <select className="form-select input-moderno" value={form.parentesco}
            onChange={(e) => updateForm('parentesco', e.target.value)} required>
            {PARENTESCOS.map((p, i) => <option key={i} value={p}>{p}</option>)}
          </select>
          <div className="form-text">Parentesco con quien llena el formulario</div>
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Dirección de Habitación <span className="text-danger">*</span></label>
          <input type="text" className="form-control input-moderno"
            placeholder="Ej. Guaritos I, Vereda 52, Casa #24"
            value={form.direccion_habitacion} onChange={(e) => updateForm('direccion_habitacion', e.target.value)} required />
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold">Localidad <span className="text-danger">*</span></label>
          <input type="text" className="form-control input-moderno" placeholder="Ej. Guaritos, El Tigre..."
            value={form.localidad_habitacion} onChange={(e) => updateForm('localidad_habitacion', e.target.value)} required />
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold">Plantel de Procedencia</label>
          <input type="text" className="form-control input-moderno" placeholder="Escuela anterior (si aplica)"
            value={form.plantel_procedencia} onChange={(e) => updateForm('plantel_procedencia', e.target.value)} />
        </div>

        <div className="col-12">
          <label className="form-label fw-semibold">Solicitudes Realizadas en Años Anteriores <span className="text-danger">*</span></label>
          <div className="d-flex flex-wrap gap-2 mt-1">
            {ANIOS_PREVIOS.map(anio => (
              <button key={anio} type="button"
                className={`btn rounded-pill px-3 fw-semibold ${form.solicitudes_previas.includes(anio) ? 'btn-success shadow' : 'btn-outline-secondary'}`}
                onClick={() => toggleSolicitudPrevia(anio)}>
                {form.solicitudes_previas.includes(anio) && <i className="bi bi-check-lg me-1"></i>}
                {anio}
              </button>
            ))}
          </div>
        </div>

        <div className="col-12">
          <label className="form-label fw-semibold">¿Tiene otro(s) representado(s) inscrito(s) en el plantel? <span className="text-danger">*</span></label>
          <div className="d-flex gap-3 mt-1">
            {[{ label: 'Sí', val: true }, { label: 'No', val: false }].map(opt => (
              <button key={opt.label} type="button"
                className={`btn rounded-pill px-4 fw-semibold ${form.tiene_otros_inscritos === opt.val ? 'btn-success shadow' : 'btn-outline-secondary'}`}
                onClick={() => updateForm('tiene_otros_inscritos', opt.val)}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between mt-4 pt-3 border-top">
        <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(1)}>
          <i className="bi bi-arrow-left me-1"></i> Anterior
        </button>
        <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto"
          onClick={() => {
            if (!form.estudiante_nombres || !form.estudiante_fecha_nacimiento || !form.grado_solicitado || !form.direccion_habitacion || !form.localidad_habitacion) {
              if (Swal) Swal.fire('Atención', 'Por favor completa todos los campos obligatorios (*)', 'warning');
              return;
            }
            setStep(3);
          }}>
          Continuar <i className="bi bi-arrow-right ms-1"></i>
        </button>
      </div>
    </div>
  );

  // ─── PASO 3: DATOS DEL REPRESENTANTE ─────────────────────────────────────────
  const renderStep3 = () => (
    <div className="animate__animated animate__fadeIn">
      <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
        <i className="bi bi-person-lines-fill text-success fs-5"></i>
        <h6 className="fw-bold text-dark mb-0">Datos del Representante Legal</h6>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label fw-semibold">Nombres y Apellidos (Representante) <span className="text-danger">*</span></label>
          <input type="text" className="form-control input-moderno" placeholder="Nombres completos"
            value={`${form.representante_nombres}${form.representante_apellidos ? ' ' + form.representante_apellidos : ''}`}
            onChange={(e) => {
              const parts = e.target.value.split(' ');
              const mid = Math.ceil(parts.length / 2);
              updateForm('representante_nombres', parts.slice(0, mid).join(' '));
              updateForm('representante_apellidos', parts.slice(mid).join(' '));
            }} required />
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold">N° Cédula de Identidad (Padre/Rep.) <span className="text-danger">*</span></label>
          <input type="text" className="form-control input-moderno" placeholder="Ej. 13567896"
            value={form.representante_cedula} onChange={(e) => updateForm('representante_cedula', e.target.value)} required />
          <div className="form-text">Solo el número, sin puntos ni letras</div>
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold">Parentesco <span className="text-danger">*</span></label>
          <select className="form-select input-moderno" value={form.representante_parentesco}
            onChange={(e) => updateForm('representante_parentesco', e.target.value)}>
            <option>Padre</option>
            <option>Madre</option>
            <option>Abuelo/a</option>
            <option>Tío/a</option>
            <option>Representante Legal</option>
          </select>
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold">Teléfono Principal <span className="text-danger">*</span></label>
          <input type="text" className="form-control input-moderno" placeholder="Ej. 0291-6518384 ó 0416-6263890"
            value={form.representante_telefono} onChange={(e) => updateForm('representante_telefono', e.target.value)} required />
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold">Teléfono Alternativo</label>
          <input type="text" className="form-control input-moderno" placeholder="Ej. 0291-6518384 ó 0416-6263890"
            value={form.representante_telefono2} onChange={(e) => updateForm('representante_telefono2', e.target.value)} />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Correo Electrónico <span className="text-danger">*</span></label>
          <input type="email" className="form-control input-moderno" placeholder="correo@ejemplo.com"
            value={form.representante_email} onChange={(e) => updateForm('representante_email', e.target.value)} required />
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold">¿Trabaja en PDVSA? <span className="text-danger">*</span></label>
          <div className="d-flex flex-column gap-1 mt-1">
            {['No', 'Sí - Contractual', 'Sí - No Contractual', 'Jubilado/Pensionado'].map(op => (
              <button key={op} type="button"
                className={`btn btn-sm text-start rounded-3 fw-semibold ${form.representante_trabaja_pdvsa === op ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => updateForm('representante_trabaja_pdvsa', op)}>
                {form.representante_trabaja_pdvsa === op && <i className="bi bi-check-circle-fill me-1"></i>}{op}
              </button>
            ))}
          </div>
        </div>

        {/* DATOS DE LA MADRE */}
        <div className="col-12 mt-2 pt-3 border-top">
          <div className="d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-person-heart text-success fs-5"></i>
            <h6 className="fw-bold text-dark mb-0">Datos de la Madre</h6>
            <span className="badge bg-light text-muted border ms-1" style={{ fontSize: '0.7rem' }}>Opcional</span>
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold">N° Cédula de Identidad (Madre)</label>
              <input type="text" className="form-control input-moderno" placeholder="Ej. 13567896"
                value={form.madre_cedula} onChange={(e) => updateForm('madre_cedula', e.target.value)} />
              <div className="form-text">Solo el número entero, sin puntos</div>
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">Correo Electrónico (Madre)</label>
              <input type="email" className="form-control input-moderno" placeholder="correo@ejemplo.com"
                value={form.madre_email} onChange={(e) => updateForm('madre_email', e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">¿La Madre Trabaja en PDVSA?</label>
              <div className="d-flex gap-3 mt-2">
                {[{ label: 'Sí', val: true }, { label: 'No', val: false }].map(opt => (
                  <button key={opt.label} type="button"
                    className={`btn rounded-pill px-4 fw-semibold ${form.madre_trabaja_pdvsa === opt.val ? 'btn-success shadow' : 'btn-outline-secondary'}`}
                    onClick={() => updateForm('madre_trabaja_pdvsa', opt.val)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between mt-4 pt-3 border-top">
        <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(2)}>
          <i className="bi bi-arrow-left me-1"></i> Anterior
        </button>
        <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto"
          onClick={() => {
            if (!form.representante_cedula || !form.representante_telefono || !form.representante_email) {
              if (Swal) Swal.fire('Atención', 'Por favor completa los campos obligatorios del representante (*)', 'warning');
              return;
            }
            setStep(4);
          }}>
          Continuar <i className="bi bi-arrow-right ms-1"></i>
        </button>
      </div>
    </div>
  );

  // ─── PASO 4: PDVSA Y TRANSPORTE ───────────────────────────────────────────────
  const renderStep4 = () => {
    const tienePdvsa = form.representante_trabaja_pdvsa !== 'No' || form.madre_trabaja_pdvsa;
    return (
      <div className="animate__animated animate__fadeIn">
        {tienePdvsa && (
          <>
            <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <i className="bi bi-buildings text-success fs-5"></i>
              <h6 className="fw-bold text-dark mb-0">Información PDVSA</h6>
            </div>
            <div className="row g-3 mb-4">
              <div className="col-12">
                <label className="form-label fw-semibold">Tipo de Nómina <span className="text-danger">*</span></label>
                <div className="d-flex flex-wrap gap-2 mt-1">
                  {['Contractual', 'No Contractual', 'Jubilado'].map(tipo => (
                    <button key={tipo} type="button"
                      className={`btn rounded-pill px-4 fw-semibold ${form.pdvsa_tipo_nomina === tipo ? 'btn-success shadow' : 'btn-outline-secondary'}`}
                      onClick={() => updateForm('pdvsa_tipo_nomina', tipo)}>
                      {form.pdvsa_tipo_nomina === tipo && <i className="bi bi-check-circle-fill me-1"></i>}{tipo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Organización / Gerencia <span className="text-danger">*</span></label>
                <select className="form-select input-moderno" value={form.pdvsa_gerencia}
                  onChange={(e) => updateForm('pdvsa_gerencia', e.target.value)}>
                  <option value="">Seleccione su gerencia...</option>
                  {GERENCIAS_PDVSA.map((g, i) => <option key={i} value={g}>{g}</option>)}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Correo Corporativo (Empresa)</label>
                <input type="email" className="form-control input-moderno" placeholder="usuario@pdvsa.com"
                  value={form.pdvsa_email_empresa} onChange={(e) => updateForm('pdvsa_email_empresa', e.target.value)} />
              </div>

              <div className="col-md-3">
                <label className="form-label fw-semibold">Localidad de Trabajo <span className="text-danger">*</span></label>
                <input type="text" className="form-control input-moderno" placeholder="Ej. El Tigre, Maturín..."
                  value={form.pdvsa_localidad_trabajo} onChange={(e) => updateForm('pdvsa_localidad_trabajo', e.target.value)} />
              </div>
            </div>
          </>
        )}

        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
          <i className="bi bi-bus-front text-success fs-5"></i>
          <h6 className="fw-bold text-dark mb-0">Transporte Escolar</h6>
        </div>
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label fw-semibold">¿El estudiante requiere transporte escolar? <span className="text-danger">*</span></label>
            <div className="d-flex gap-3 mt-1">
              {[{ label: 'Sí, requiere transporte', val: true }, { label: 'No requiere', val: false }].map(opt => (
                <button key={opt.label} type="button"
                  className={`btn rounded-pill px-4 fw-semibold ${form.requiere_transporte === opt.val ? 'btn-success shadow' : 'btn-outline-secondary'}`}
                  onClick={() => updateForm('requiere_transporte', opt.val)}>
                  <i className={`bi ${opt.val ? 'bi-bus-front' : 'bi-x-circle'} me-1`}></i>{opt.label}
                </button>
              ))}
            </div>
          </div>

          {form.requiere_transporte && (
            <div className="col-md-8">
              <label className="form-label fw-semibold">Ruta de Transporte Preferida</label>
              <input type="text" className="form-control input-moderno"
                placeholder="Indica tu ruta o sector (Ej. Ruta 3 - Guaritos, Ruta 7 - El Tigre Centro)"
                value={form.ruta_transporte} onChange={(e) => updateForm('ruta_transporte', e.target.value)} />
              <div className="form-text">La asignación final de ruta queda sujeta a la disponibilidad del plantel.</div>
            </div>
          )}
        </div>

        <div className="d-flex justify-content-between mt-4 pt-3 border-top">
          <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(3)}>
            <i className="bi bi-arrow-left me-1"></i> Anterior
          </button>
          <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto" onClick={handleSubmitFinal}>
            <i className="bi bi-send-check me-1"></i> Enviar Solicitud
          </button>
        </div>
      </div>
    );
  };

  // ─── PASO 5: CONFIRMACIÓN + QR ────────────────────────────────────────────────
  const renderStep5 = () => {
    const sol = solicitudGuardada;
    if (!sol) return null;
    const qrUrl = getQrUrl(sol.codigo_unico || '');
    return (
      <div className="animate__animated animate__fadeIn text-center">
        <div className="mb-3">
          <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
            style={{ width: 80, height: 80, border: '3px solid #16a34a' }}>
            <i className="bi bi-patch-check-fill text-success" style={{ fontSize: 38 }}></i>
          </div>
          <h5 className="fw-bold text-success mb-1">¡Solicitud Registrada Exitosamente!</h5>
          <p className="text-muted small">Tu solicitud ha sido recibida y se encuentra en estado <strong>Pendiente</strong> de evaluación.</p>
        </div>

        <div className="row g-3 justify-content-center mb-4">
          {/* QR CODE CARD */}
          <div className="col-md-5">
            <div className="card rounded-4 border-0 shadow p-4 h-100" style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '2px solid #86efac' }}>
              <div className="fw-bold text-success text-uppercase small mb-2">
                <i className="bi bi-qr-code-scan me-1"></i> Código de Verificación
              </div>
              <div className="bg-white rounded-3 p-2 d-inline-block mb-3 shadow-sm mx-auto">
                <img src={qrUrl} alt="QR Code Solicitud" width={180} height={180}
                  style={{ display: 'block', borderRadius: 8 }} />
              </div>
              <div className="bg-success text-white rounded-3 py-2 px-3 d-inline-block mx-auto mb-2 fw-bold letter-spacing"
                style={{ fontSize: '1rem', letterSpacing: 2, fontFamily: 'monospace' }}>
                {sol.codigo_unico}
              </div>
              <p className="text-muted small mb-0">
                Guarda este código. Podrás usarlo para verificar el estado de tu solicitud en cualquier momento.
              </p>
            </div>
          </div>

          {/* RESUMEN CARD */}
          <div className="col-md-7">
            <div className="card rounded-4 border shadow-sm p-4 text-start h-100 bg-white">
              <div className="fw-bold text-dark text-uppercase small mb-3 border-bottom pb-2">
                <i className="bi bi-receipt-cutoff text-success me-1"></i> Resumen de Solicitud
              </div>
              <div className="row g-2 small">
                <div className="col-5 text-muted">Estudiante:</div>
                <div className="col-7 fw-semibold">{sol.estudiante_nombres} {sol.estudiante_apellidos}</div>

                <div className="col-5 text-muted">Grado Solicitado:</div>
                <div className="col-7 fw-semibold">{sol.grado_solicitado}</div>

                <div className="col-5 text-muted">Representante:</div>
                <div className="col-7 fw-semibold">{sol.representante_nombres} {sol.representante_apellidos}</div>

                <div className="col-5 text-muted">C.I. Representante:</div>
                <div className="col-7 fw-semibold">{sol.representante_cedula}</div>

                <div className="col-5 text-muted">Teléfono:</div>
                <div className="col-7 fw-semibold">{sol.representante_telefono}</div>

                <div className="col-5 text-muted">Correo:</div>
                <div className="col-7 fw-semibold text-truncate">{sol.representante_email}</div>

                <div className="col-5 text-muted">Plantel:</div>
                <div className="col-7 fw-semibold">{escNombre}</div>

                <div className="col-5 text-muted">Fecha de Registro:</div>
                <div className="col-7 fw-semibold">{sol.created_at ? new Date(sol.created_at).toLocaleDateString('es-VE') : new Date().toLocaleDateString('es-VE')}</div>

                <div className="col-5 text-muted">Estado:</div>
                <div className="col-7">{getStatusBadge('Pendiente')}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-warning bg-opacity-10 border border-warning-subtle rounded-4 p-3 mb-4 text-start">
          <div className="d-flex gap-2">
            <i className="bi bi-info-circle-fill text-warning fs-5 flex-shrink-0 mt-1"></i>
            <div className="small text-muted">
              <strong className="text-dark">Próximos pasos:</strong> La Dirección del plantel evaluará tu solicitud y recibirás una notificación de respuesta.
              Puedes hacer seguimiento en la sección <strong>"Mis Solicitudes"</strong> usando el código de verificación arriba.
            </div>
          </div>
        </div>

        <div className="d-flex gap-3 justify-content-center">
          <button className="btn btn-outline-success rounded-pill px-4 fw-semibold" onClick={handleNuevaSolicitud}>
            <i className="bi bi-plus-circle me-1"></i> Registrar Otro Estudiante
          </button>
          <button className="btn btn-success rounded-pill px-4 fw-semibold shadow hover-efecto"
            onClick={() => { cargarDatos(); setActiveTab('mis_solicitudes'); }}>
            <i className="bi bi-inbox-fill me-1"></i> Ver Mis Solicitudes
          </button>
        </div>
      </div>
    );
  };

  // ─── RENDER PRINCIPAL ────────────────────────────────────────────────────────
  return (
    <div className="container-fluid py-4 animate__animated animate__fadeIn">
      {/* HEADER */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 bg-white p-4 border rounded-4 shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-success bg-opacity-10 text-success p-3 rounded-4" style={{ border: '1px solid rgba(25, 135, 84, 0.2)' }}>
            <i className="bi bi-envelope-paper-fill fs-3"></i>
          </div>
          <div>
            <h4 className="fw-bold text-dark mb-1">Solicitud de Cupos Escolares</h4>
            <p className="text-muted small mb-0">
              <i className="bi bi-building-fill text-success me-1"></i> {escNombre} &nbsp;|&nbsp;
              <span className="ms-1 badge bg-light text-secondary border">Módulo de Admisión</span>
            </p>
          </div>
        </div>
        <button onClick={() => navigate(-1)} className="btn btn-outline-secondary rounded-pill hover-efecto mt-2 mt-md-0">
          <i className="bi bi-arrow-left me-1"></i> Volver
        </button>
      </div>

      {/* STATS (admin only) */}
      {isUserAdmin && (
        <div className="row g-3 mb-4">
          {[
            { label: 'Total', val: stats.total, color: 'primary', icon: 'bi-inbox' },
            { label: 'Pendientes', val: stats.pendientes, color: 'warning', icon: 'bi-clock-history' },
            { label: 'Aprobadas', val: stats.aprobados, color: 'success', icon: 'bi-check2-all' },
            { label: 'Rechazadas', val: stats.rechazados, color: 'danger', icon: 'bi-x-octagon' },
          ].map(({ label, val, color, icon }) => (
            <div className="col-md-3" key={label}>
              <div className="card border rounded-4 p-3 shadow-sm bg-white hover-card">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="text-muted small text-uppercase fw-bold mb-1">{label}</h6>
                    <h3 className={`fw-bold text-${color} mb-0`}>{val}</h3>
                  </div>
                  <div className={`bg-${color} bg-opacity-10 text-${color} p-2 rounded-3`}>
                    <i className={`bi ${icon} fs-4`}></i>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TABS */}
      <div className="d-flex gap-2 border-bottom pb-3 mb-4 overflow-x-auto">
        {isUserAdmin && (
          <button onClick={() => setActiveTab('gestion')}
            className={`btn rounded-pill px-4 fw-bold hover-efecto ${activeTab === 'gestion' ? 'btn-success shadow' : 'btn-outline-secondary'}`}>
            <i className="bi bi-list-task me-1"></i> Listado General
          </button>
        )}
        <button onClick={() => setActiveTab('mis_solicitudes')}
          className={`btn rounded-pill px-4 fw-bold hover-efecto ${activeTab === 'mis_solicitudes' ? 'btn-success shadow' : 'btn-outline-secondary'}`}>
          <i className="bi bi-inbox-fill me-1"></i> Mis Solicitudes
        </button>
        <button onClick={() => { setActiveTab('nueva_solicitud'); setStep(1); setSolicitudGuardada(null); }}
          className={`btn rounded-pill px-4 fw-bold hover-efecto ${activeTab === 'nueva_solicitud' ? 'btn-success shadow' : 'btn-outline-secondary'}`}>
          <i className="bi bi-plus-lg me-1"></i> Nueva Solicitud
        </button>
      </div>

      {/* CONTENIDO */}
      <div className="bg-white border rounded-4 p-4 shadow-sm">

        {/* TAB: GESTIÓN (admin) */}
        {activeTab === 'gestion' && isUserAdmin && (
          <div>
            <h5 className="fw-bold text-dark mb-3"><i className="bi bi-card-checklist text-success me-2"></i>Control de Solicitudes de Admisión</h5>
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="small fw-bold text-muted mb-1">Filtrar por Estado</label>
                <select className="form-select input-moderno" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
                  <option value="TODOS">Todos los estados</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Aprobado">Aprobado</option>
                  <option value="Rechazado">Rechazado</option>
                </select>
              </div>
              <div className="col-md-8">
                <label className="small fw-bold text-muted mb-1">Buscar Solicitud</label>
                <div className="input-group">
                  <span className="input-group-text bg-white border-end-0 border-secondary border-opacity-25" style={{ borderRadius: '12px 0 0 12px' }}>
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input type="text" className="form-control border-start-0 border-secondary border-opacity-25"
                    placeholder="Buscar por nombre, cédula, código..." value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ borderRadius: '0 12px 12px 0', boxShadow: 'none' }} />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status"><span className="visually-hidden">Cargando...</span></div>
                <div className="text-muted mt-2 small">Cargando solicitudes...</div>
              </div>
            ) : filteredSolicitudes.length === 0 ? (
              <div className="text-center py-5 text-muted bg-light rounded-4 border">
                <i className="bi bi-mailbox fs-2 text-secondary mb-2 d-block"></i>
                <div className="fw-bold">No se encontraron solicitudes</div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle border rounded-4 overflow-hidden">
                  <thead className="bg-light text-muted small text-uppercase">
                    <tr>
                      <th className="ps-3">Código</th>
                      <th>Estudiante</th>
                      <th>Grado</th>
                      <th>Representante</th>
                      <th>Contacto</th>
                      <th>Estado</th>
                      <th className="text-end pe-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSolicitudes.map((sol, i) => (
                      <tr key={i}>
                        <td className="ps-3">
                          <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle"
                            style={{ fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: 1 }}>
                            {sol.codigo_unico || '—'}
                          </span>
                        </td>
                        <td>
                          <div className="fw-bold text-dark">{sol.estudiante_apellidos}, {sol.estudiante_nombres}</div>
                          <span className="text-muted small"><i className="bi bi-person-badge me-1"></i>{sol.estudiante_cedula || 'Sin Cédula'}</span>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border px-2" style={{ fontSize: '0.8rem' }}>{sol.grado_solicitado}</span>
                        </td>
                        <td>
                          <div className="fw-semibold">{sol.representante_nombres} {sol.representante_apellidos}</div>
                          <span className="text-muted small">C.I: {sol.representante_cedula}</span>
                        </td>
                        <td>
                          <div className="small"><i className="bi bi-telephone-fill text-muted me-1"></i>{sol.representante_telefono}</div>
                          <div className="small text-muted"><i className="bi bi-envelope-fill text-muted me-1"></i>{sol.representante_email}</div>
                        </td>
                        <td>{getStatusBadge(sol.estado)}</td>
                        <td className="text-end pe-3">
                          <div className="d-flex justify-content-end gap-1">
                            <button type="button"
                              onClick={() => { setSelectedSol(sol); setEvalEstado(sol.estado); setEvalObs(sol.observaciones || ''); }}
                              className="btn btn-sm btn-outline-success rounded-pill hover-efecto"
                              data-bs-toggle="modal" data-bs-target="#evalSolicitudModal">
                              <i className="bi bi-pencil-square"></i> Evaluar
                            </button>
                            <button type="button" onClick={() => handleEliminarSolicitud(sol)}
                              className="btn btn-sm btn-outline-danger rounded-pill hover-efecto">
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB: MIS SOLICITUDES */}
        {activeTab === 'mis_solicitudes' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-dark mb-0"><i className="bi bi-mailbox2 text-success me-2"></i>Historial de Solicitudes</h5>
              <button onClick={() => { setActiveTab('nueva_solicitud'); setStep(1); setSolicitudGuardada(null); }}
                className="btn btn-success rounded-pill btn-sm fw-semibold">
                <i className="bi bi-plus-circle me-1"></i> Solicitar Cupo
              </button>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status"><span className="visually-hidden">Cargando...</span></div>
              </div>
            ) : solicitudes.length === 0 ? (
              <div className="text-center py-5 text-muted bg-light rounded-4 border">
                <i className="bi bi-journal-plus fs-2 text-secondary mb-2 d-block"></i>
                <div className="fw-bold">No tienes solicitudes registradas</div>
                <div className="small mb-3">Aún no has registrado ninguna solicitud de cupo en esta institución.</div>
                <button onClick={() => { setActiveTab('nueva_solicitud'); setStep(1); }} className="btn btn-sm btn-success rounded-pill px-3">
                  Registrar la Primera
                </button>
              </div>
            ) : (
              <div className="row g-3">
                {solicitudes.map((sol, i) => (
                  <div className="col-md-6" key={i}>
                    <div className="card border rounded-4 p-3 shadow-sm bg-white hover-card">
                      <div className="d-flex justify-content-between align-items-start border-bottom pb-2 mb-2">
                        <div>
                          <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle mb-1 d-inline-block"
                            style={{ fontFamily: 'monospace', letterSpacing: 1, fontSize: '0.72rem' }}>
                            <i className="bi bi-upc me-1"></i>{sol.codigo_unico || 'Sin código'}
                          </span>
                          <h6 className="fw-bold text-dark mb-0">{sol.estudiante_apellidos}, {sol.estudiante_nombres}</h6>
                          <small className="text-muted">{sol.grado_solicitado}</small>
                        </div>
                        <div className="text-end">
                          {getStatusBadge(sol.estado)}
                          <div className="text-muted small mt-1" style={{ fontSize: '0.7rem' }}>
                            {sol.created_at ? new Date(sol.created_at).toLocaleDateString('es-VE') : ''}
                          </div>
                        </div>
                      </div>

                      <div className="row g-2 mb-2 small">
                        <div className="col-6">
                          <span className="text-muted d-block">Representante:</span>
                          <span className="fw-semibold">{sol.representante_nombres} {sol.representante_apellidos}</span>
                        </div>
                        <div className="col-6">
                          <span className="text-muted d-block">Teléfono:</span>
                          <span className="fw-semibold">{sol.representante_telefono}</span>
                        </div>
                      </div>

                      <div className={`p-2 rounded-3 border small ${sol.estado === 'Aprobado' ? 'bg-success bg-opacity-10 text-success border-success-subtle' : sol.estado === 'Rechazado' ? 'bg-danger bg-opacity-10 text-danger border-danger-subtle' : 'bg-light text-secondary'}`}>
                        <div className="fw-bold mb-1"><i className="bi bi-chat-left-text-fill me-1"></i>Comentarios de Dirección:</div>
                        <div>{sol.observaciones || <em>Tu solicitud está en proceso de evaluación.</em>}</div>
                      </div>

                      {sol.estado === 'Pendiente' && (
                        <div className="text-end mt-2">
                          <button onClick={() => handleEliminarSolicitud(sol)} className="btn btn-sm btn-outline-danger border-0 rounded-pill">
                            <i className="bi bi-trash-fill me-1"></i> Cancelar Solicitud
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: NUEVA SOLICITUD (WIZARD) */}
        {activeTab === 'nueva_solicitud' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold text-dark mb-0">
                <i className="bi bi-file-earmark-person-fill text-success me-2"></i>
                Formulario de Solicitud de Cupo
              </h5>
              <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle">
                Paso {step} de 5
              </span>
            </div>

            {renderStepper()}

            <div className="mt-4">
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
              {step === 5 && renderStep5()}
            </div>
          </div>
        )}
      </div>

      {/* MODAL EVALUACIÓN */}
      <div className="modal fade" id="evalSolicitudModal" tabIndex={-1} aria-labelledby="evalSolicitudModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 rounded-4 shadow-lg">
            <div className="modal-header bg-success text-white py-3" style={{ borderRadius: '16px 16px 0 0' }}>
              <h5 className="modal-title fw-bold" id="evalSolicitudModalLabel">
                <i className="bi bi-file-earmark-check-fill me-2"></i>Evaluar Solicitud de Admisión
              </h5>
              <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" id="btn-close-eval-modal"></button>
            </div>

            <div className="modal-body p-4 bg-light">
              {selectedSol && (
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="card rounded-4 p-3 border-0 shadow-sm bg-white h-100">
                      <div className="fw-bold border-bottom pb-2 mb-2 text-success small text-uppercase">
                        <i className="bi bi-person-fill"></i> Datos del Estudiante
                      </div>
                      <div className="small">
                        <div className="mb-1"><span className="text-muted">Código: </span><span className="fw-bold" style={{ fontFamily: 'monospace' }}>{selectedSol.codigo_unico}</span></div>
                        <div className="mb-1"><span className="text-muted">Nombre: </span><strong>{selectedSol.estudiante_nombres} {selectedSol.estudiante_apellidos}</strong></div>
                        <div className="mb-1"><span className="text-muted">Fecha Nac.: </span>{selectedSol.estudiante_fecha_nacimiento}</div>
                        <div className="mb-1"><span className="text-muted">Grado: </span><span className="badge bg-success bg-opacity-10 text-success border">{selectedSol.grado_solicitado}</span></div>
                        <div className="mb-1"><span className="text-muted">Dirección: </span>{selectedSol.direccion_habitacion}</div>
                        <div><span className="text-muted">PDVSA: </span>{selectedSol.representante_trabaja_pdvsa || '—'} {selectedSol.pdvsa_gerencia ? `• ${selectedSol.pdvsa_gerencia}` : ''}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card rounded-4 p-3 border-0 shadow-sm bg-white h-100">
                      <div className="fw-bold border-bottom pb-2 mb-2 text-success small text-uppercase">
                        <i className="bi bi-people-fill"></i> Datos del Representante
                      </div>
                      <div className="small">
                        <div className="mb-1"><span className="text-muted">Nombre: </span><strong>{selectedSol.representante_nombres} {selectedSol.representante_apellidos}</strong></div>
                        <div className="mb-1"><span className="text-muted">Cédula: </span>{selectedSol.representante_cedula}</div>
                        <div className="mb-1"><span className="text-muted">Parentesco: </span>{selectedSol.representante_parentesco}</div>
                        <div className="mb-1"><span className="text-muted">Teléfono: </span>{selectedSol.representante_telefono}</div>
                        <div className="mb-1"><span className="text-muted">Correo: </span><span className="text-truncate d-inline-block" style={{ maxWidth: 200 }}>{selectedSol.representante_email}</span></div>
                        <div><span className="text-muted">Transporte: </span>{selectedSol.requiere_transporte ? `Sí – ${selectedSol.ruta_transporte || 'Por asignar'}` : 'No requiere'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 mt-3 pt-3 border-top">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label fw-bold text-dark">Definir Estado del Cupo</label>
                        <select className="form-select input-moderno" value={evalEstado} onChange={(e) => setEvalEstado(e.target.value)}>
                          <option value="Pendiente">Pendiente (En evaluación)</option>
                          <option value="Aprobado">Aprobado (Asignar Cupo)</option>
                          <option value="Rechazado">Rechazado (No Asignado)</option>
                        </select>
                      </div>
                      <div className="col-md-8">
                        <label className="form-label fw-bold text-dark">Observaciones para el Representante</label>
                        <textarea className="form-control input-moderno" rows={3}
                          placeholder="Instrucciones visibles en tiempo real por el representante..."
                          value={evalObs} onChange={(e) => setEvalObs(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer bg-white py-3 rounded-bottom-4 border-top">
              <button type="button" className="btn btn-outline-secondary rounded-pill px-4 fw-semibold" data-bs-dismiss="modal">Cerrar</button>
              <button type="button" onClick={handleEvaluarSolicitud} className="btn btn-success rounded-pill px-4 fw-semibold shadow hover-efecto">
                <i className="bi bi-save me-1"></i> Guardar Evaluación
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
