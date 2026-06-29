import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';
import { compressImage } from '../../utils/imageCompression';

// ─── HELPER: MODO TÍTULO ────────────────────────────────────────────────────────
// Convierte cada palabra a Title Case sin forzar mayúscula/minúscula sostenida
const toTitulo = (value: string): string =>
  value
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

// Handler para inputs de texto que aplica modo título al escribir
const handleTituloChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setter: (val: string) => void
) => {
  const raw = e.target.value;
  // Sólo aplica título si el usuario NO está borrando (evitar conflicto al borrar)
  // Se preserva el espacio al final para permitir escribir la siguiente palabra
  const endsWithSpace = raw.endsWith(' ');
  const converted = toTitulo(raw.trimEnd());
  setter(endsWithSpace ? converted + ' ' : converted);
};

// ─── CONSTANTES ────────────────────────────────────────────────────────────────

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

// ─── GEODATOS VENEZUELA ────────────────────────────────────────────────────────
// (Se cargarán dinámicamente desde la base de datos: tabla div_pol_vzla)

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
  acepta_terminos: boolean;
  codigo_unico: string;
  // Estudiante
  estudiante_nombres: string;
  estudiante_apellidos: string;
  estudiante_cedula: string;
  estudiante_fecha_nacimiento: string;
  estudiante_sexo: string;
  estudiante_orden_nacimiento: string;
  estudiante_condicion_neuro: string;
  estudiante_tipo_condicion: string;
  estudiante_informe_neuro: boolean;
  estudiante_certificado_conapdis: boolean;
  grado_solicitado: string;
  parentesco: string;
  // Dirección
  estado_habitacion: string;
  municipio_habitacion: string;
  parroquia_habitacion: string;
  direccion_habitacion: string;
  // Otros
  tiene_otros_inscritos: boolean;
  plantel_procedencia: string;
  // Representante
  representante_nombres: string;
  representante_apellidos: string;
  representante_cedula: string;
  representante_telefono: string;
  representante_telefono2: string;
  representante_email: string;
  representante_parentesco: string;
  representante_trabaja_pdvsa: string;
  // PDVSA / Madre
  pdvsa_condicion_laboral: string;
  pdvsa_tipo_nomina: string;
  pdvsa_negocio_filial: string;
  pdvsa_gerencia: string;
  pdvsa_email_empresa: string;
  pdvsa_localidad_trabajo: string;
  pdvsa_localidad_trabajo_otra?: string;
  madre_cedula: string;
  madre_email: string;
  madre_trabaja_pdvsa: boolean;
  requiere_transporte: boolean;
  ruta_transporte: string;
  // Documentos
  doc_ficha: string;
  doc_foto_estudiante: string;
  doc_partida_nacimiento: string;
  doc_cedula_estudiante: string;
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
  estudiante_condicion_neuro: 'Neurotípico',
  estudiante_tipo_condicion: '',
  estudiante_informe_neuro: false,
  estudiante_certificado_conapdis: false,
  grado_solicitado: '',
  parentesco: '',
  estado_habitacion: '',
  municipio_habitacion: '',
  parroquia_habitacion: '',
  direccion_habitacion: '',
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
  pdvsa_condicion_laboral: '',
  pdvsa_tipo_nomina: '',
  pdvsa_negocio_filial: '',
  pdvsa_gerencia: '',
  pdvsa_email_empresa: '',
  pdvsa_localidad_trabajo: '',
  pdvsa_localidad_trabajo_otra: '',
  madre_cedula: '',
  madre_email: '',
  madre_trabaja_pdvsa: false,
  requiere_transporte: false,
  ruta_transporte: '',
  doc_ficha: '',
  doc_foto_estudiante: '',
  doc_partida_nacimiento: '',
  doc_cedula_estudiante: '',
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

  // Catálogos desde BD
  const [gradosDB, setGradosDB] = useState<string[]>([]);
  const [parentescosDB, setParentescosDB] = useState<string[]>([]);
  const [tiposNominaDB, setTiposNominaDB] = useState<string[]>([]);
  const [condicionLaboralDB, setCondicionLaboralDB] = useState<string[]>([]);
  const [negociosDB, setNegociosDB] = useState<string[]>([]);
  const [gerenciasDB, setGerenciasDB] = useState<string[]>([]);
  const [localidadesDB, setLocalidadesDB] = useState<string[]>([]);
  
  // Geodatos DB state
  const [geoData, setGeoData] = useState<any[]>([]);
  const [estadosDB, setEstadosDB] = useState<string[]>([]);

  // Wizard state
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SolicitudForm>(defaultForm());
  const [solicitudGuardada, setSolicitudGuardada] = useState<SolicitudDB | null>(null);

  const [subiendoDocs, setSubiendoDocs] = useState(false);

  // Documentos adjuntos a subir
  const [documentos, setDocumentos] = useState<{
    ficha: File | null;
    foto: File | null;
    partida: File | null;
    cedula: File | null;
  }>({ ficha: null, foto: null, partida: null, cedula: null });

  // GPS state
  const [loadingGPS, setLoadingGPS] = useState(false);

  // Evaluation state
  const [selectedSol, setSelectedSol] = useState<SolicitudDB | null>(null);
  const [evalEstado, setEvalEstado] = useState('Aprobado');
  const [evalObs, setEvalObs] = useState('');

  const escCodigo = localStorage.getItem('sigae_escuela_codigo') || 'sb';
  const escNombre = escCodigo === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
  const isUserAdmin = ['SuperAdmin', 'Director', 'Administrador', 'Coordinador'].includes(user?.rol);

  // Geodatos calculados
  const municipiosDisponibles = form.estado_habitacion 
    ? Array.from(new Set(geoData.filter(d => d.estado === form.estado_habitacion).map(d => d.municipio))).sort()
    : [];
  const parroquiasDisponibles = (form.estado_habitacion && form.municipio_habitacion)
    ? Array.from(new Set(geoData.filter(d => d.estado === form.estado_habitacion && d.municipio === form.municipio_habitacion).map(d => d.parroquia))).sort()
    : [];

  // Autosave: Cargar borrador al iniciar
  useEffect(() => {
    if (activeTab === 'nueva_solicitud') {
      const borrador = localStorage.getItem(`sigae_borrador_cupo_${escCodigo}`);
      if (borrador) {
        try {
          const parsed = JSON.parse(borrador);
          if (parsed && Object.keys(parsed).length > 0) {
            // Merge with default form to ensure all fields exist
            setForm(prev => ({ ...prev, ...parsed }));
          }
        } catch (e) {}
      }
    }
  }, [activeTab, escCodigo]);

  // Autosave: Guardar borrador al cambiar form
  useEffect(() => {
    if (activeTab === 'nueva_solicitud') {
      // Don't save if it's completely empty (just opened)
      if (form.estudiante_nombres !== '' || form.estudiante_cedula !== '') {
        localStorage.setItem(`sigae_borrador_cupo_${escCodigo}`, JSON.stringify(form));
      }
    }
  }, [form, activeTab, escCodigo]);

  useEffect(() => {
    if (!permLoading && user) {
      setActiveTab(isUserAdmin ? 'gestion' : 'mis_solicitudes');
      cargarDatos();
      cargarCatalogos();
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

  const cargarCatalogos = async () => {
    try {
      const [gradosRes, parentescosRes, nominasRes, condRes, negociosRes, gerenciasRes, localidadesRes] = await Promise.all([
        supabase.from('conf_grados').select('valor').order('orden', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Parentesco').order('valor', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Nómina').order('valor', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Condición').order('valor', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Negocio/Filial').order('valor', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Organización/Gerencia').order('valor', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Localidad').order('valor', { ascending: true }),
      ]);
      
      let allGeoData: any[] = [];
      let from = 0;
      const limit = 1000;
      while (true) {
        const geoRes = await supabase.from('div_pol_vzla')
          .select('*')
          .order('estado', { ascending: true })
          .range(from, from + limit - 1);
        if (geoRes.error) throw geoRes.error;
        if (!geoRes.data || geoRes.data.length === 0) break;
        allGeoData = [...allGeoData, ...geoRes.data];
        if (geoRes.data.length < limit) break;
        from += limit;
      }

      if (gradosRes.data && gradosRes.data.length > 0) {
        setGradosDB(gradosRes.data.map((g: any) => g.valor));
      } else {
        // Fallback si no hay filtro por escuela
        const gr2 = await supabase.from('conf_grados').select('valor').order('orden', { ascending: true });
        setGradosDB((gr2.data || []).map((g: any) => g.valor));
      }

      if (parentescosRes.data && parentescosRes.data.length > 0) {
        setParentescosDB(parentescosRes.data.map((p: any) => p.valor));
      } else {
        setParentescosDB(['Hijo o Hija', 'Sobrino o Sobrina', 'Nieto o Nieta', 'Hermano o Hermana', 'Otro']);
      }

      if (nominasRes.data && nominasRes.data.length > 0) {
        setTiposNominaDB(nominasRes.data.map((p: any) => p.valor));
      } else {
        setTiposNominaDB(['Comunidad', 'Jubilado', 'Nómina Contractual (Menor)', 'Nómina No Contractual (Mayor)']);
      }

      if (condRes.data && condRes.data.length > 0) {
        setCondicionLaboralDB(condRes.data.map((p: any) => p.valor));
      } else {
        setCondicionLaboralDB(['Activo', 'Comunidad', 'Jubilado', 'Sobreviviente']);
      }

      if (negociosRes.data && negociosRes.data.length > 0) {
        setNegociosDB(negociosRes.data.map((p: any) => p.valor));
      } else {
        setNegociosDB([]);
      }

      if (gerenciasRes.data && gerenciasRes.data.length > 0) {
        setGerenciasDB(gerenciasRes.data.map((p: any) => p.valor));
      } else {
        setGerenciasDB(GERENCIAS_PDVSA);
      }

      if (localidadesRes.data && localidadesRes.data.length > 0) {
        setLocalidadesDB(localidadesRes.data.map((p: any) => p.valor));
      } else {
        setLocalidadesDB([]);
      }

      if (allGeoData.length > 0) {
        setGeoData(allGeoData);
        const uniqueEstados = Array.from(new Set(allGeoData.map((d: any) => d.estado)));
        setEstadosDB(uniqueEstados as string[]);
      }
    } catch (e) {
      console.error('Error cargando catálogos:', e);
      setGradosDB(['II Grupo (Inicial)', 'III Grupo (Inicial)', '1° Grado', '2° Grado', '3° Grado', '4° Grado', '5° Grado', '6° Grado', '1° Año', '2° Año', '3° Año', '4° Año', '5° Año']);
      setParentescosDB(['Hijo o Hija', 'Sobrino o Sobrina', 'Nieto o Nieta', 'Hermano o Hermana', 'Otro']);
    }
  };

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

  // GPS: Obtener ubicación actual y reverse-geocodear con Nominatim
  const handleObtenerUbicacion = () => {
    if (!navigator.geolocation) {
      if (Swal) Swal.fire('No disponible', 'Tu navegador no soporta geolocalización.', 'warning');
      return;
    }
    setLoadingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=es`,
            { headers: { 'Accept-Language': 'es' } }
          );
          const data = await resp.json();
          const addr = data.address || {};
          // Armar dirección aproximada
          const calleNum = [addr.road, addr.house_number].filter(Boolean).join(' #');
          const barrio = addr.suburb || addr.neighbourhood || addr.city_district || '';
          const dirAprox = [calleNum, barrio].filter(Boolean).join(', ');
          updateForm('direccion_habitacion', dirAprox || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          // Intentar mapear estado venezolano
          const stateRaw = addr.state || '';
          const estadoMatch = estadosDB.find(e =>
            stateRaw.toLowerCase().includes(e.split(' ')[0].toLowerCase())
          );
          if (estadoMatch) {
            updateForm('estado_habitacion', estadoMatch);
            updateForm('municipio_habitacion', '');
            updateForm('parroquia_habitacion', '');
          }
        } catch {
          if (Swal) Swal.fire('Error', 'No se pudo obtener la dirección desde la ubicación.', 'error');
        } finally {
          setLoadingGPS(false);
        }
      },
      (err) => {
        setLoadingGPS(false);
        const msgs: Record<number, string> = {
          1: 'Permiso de ubicación denegado. Por favor actívalo en la configuración de tu navegador.',
          2: 'No se pudo obtener la posición. Verifica tu conexión GPS.',
          3: 'Tiempo de espera agotado al obtener la ubicación.',
        };
        if (Swal) Swal.fire('Ubicación no disponible', msgs[err.code] || 'Error desconocido.', 'warning');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
      if (Swal) Swal.fire('Atención', 'Por favor completa todos los campos obligatorios del formulario', 'warning');
      return;
    }
    if (!documentos.ficha || !documentos.foto || !documentos.partida) {
      if (Swal) Swal.fire('Atención', 'Faltan documentos obligatorios (Ficha, Foto o Partida de Nacimiento)', 'warning');
      return;
    }

    try {
      setSubiendoDocs(true);
      
      const subirArchivo = async (file: File | null, prefix: string): Promise<string> => {
        if (!file) return '';
        const ext = file.name.split('.').pop();
        const fileName = `${prefix}_${form.codigo_unico}_${Date.now()}.${ext}`;
        const filePath = `${escCodigo}/${fileName}`;
        
        const { error } = await supabase.storage
          .from('documentos_solicitudes')
          .upload(filePath, file);
          
        if (error) throw error;
        
        const { data } = supabase.storage
          .from('documentos_solicitudes')
          .getPublicUrl(filePath);
          
        return data.publicUrl;
      };

      // Subir cada documento
      const urlFicha = await subirArchivo(documentos.ficha, 'ficha');
      const urlFoto = await subirArchivo(documentos.foto, 'foto');
      const urlPartida = await subirArchivo(documentos.partida, 'partida');
      const urlCedula = await subirArchivo(documentos.cedula, 'cedula');

      const { pdvsa_localidad_trabajo_otra, ...formToSubmit } = form;

      const payload: Omit<SolicitudDB, 'id' | 'created_at' | 'updated_at'> = {
        ...formToSubmit,
        pdvsa_localidad_trabajo: form.pdvsa_localidad_trabajo === 'Otra' ? pdvsa_localidad_trabajo_otra || '' : form.pdvsa_localidad_trabajo,
        doc_ficha: urlFicha,
        doc_foto_estudiante: urlFoto,
        doc_partida_nacimiento: urlPartida,
        doc_cedula_estudiante: urlCedula,
        codigo_escuela: escCodigo,
        estado: 'Pendiente',
        observaciones: '',
        creado_por: user?.cedula || form.representante_cedula,
      };

      const { data, error } = await supabase.from('solicitud_cupos').insert([payload]).select().single();
      if (error) throw error;
      await auditar('Solicitud de Cupos', 'Crear Solicitud', `Nueva solicitud ${form.codigo_unico} con documentos`);
      
      // Limpiar el autoguardado tras el envío exitoso
      localStorage.removeItem(`sigae_borrador_cupo_${escCodigo}`);

      setSolicitudGuardada(data as SolicitudDB);
      setStep(6);
    } catch (error: any) {
      console.error(error);
      if (Swal) Swal.fire('Error', 'Hubo un problema procesando tu solicitud o subiendo los documentos: ' + error.message, 'error');
    } finally {
      setSubiendoDocs(false);
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

  const getQrUrl = (codigo: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=SC:${encodeURIComponent(codigo)}&bgcolor=ffffff&color=166534&margin=10`;

  // ─── WIZARD STEPPER ──────────────────────────────────────────────────────────
  const STEPS = [
    { num: 1, label: 'Términos', icon: 'bi-file-text' },
    { num: 2, label: 'Representante', icon: 'bi-person-lines-fill' },
    { num: 3, label: 'Estudiante', icon: 'bi-mortarboard' },
    { num: 4, label: 'Transporte Escolar', icon: 'bi-bus-front' },
    { num: 5, label: 'Documentos', icon: 'bi-file-earmark-arrow-up' },
    { num: 6, label: 'Confirmación', icon: 'bi-patch-check' },
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
            <span style={{ fontSize: '0.7rem', color: step >= s.num ? '#166534' : '#9ca3af', fontWeight: 600 }}>
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

  // ─── PASO 1: TÉRMINOS ────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="animate__animated animate__fadeIn">
      <div className="text-center mb-4">
        <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
          style={{ width: 72, height: 72, border: '2px solid rgba(22,163,74,0.2)' }}>
          <i className="bi bi-shield-check text-success" style={{ fontSize: 32 }}></i>
        </div>
        <h5 className="fw-bold text-dark mb-1">Términos y Condiciones</h5>
        <p className="text-muted small">Bienvenido/a al módulo de Solicitud de Cupos para el año escolar {new Date().getFullYear()} – {new Date().getFullYear() + 1}.</p>
      </div>

      <div className="bg-light rounded-4 p-4 border mb-4" style={{ maxHeight: 260, overflowY: 'auto', fontSize: '0.88rem', lineHeight: 1.7 }}>
        <p><strong>Estimado/a representante:</strong></p>
        <p>A continuación se presenta el formulario oficial de solicitud de cupos para el <strong>{escNombre}</strong>. Lea detenidamente cada sección y proceda a dar respuesta a cada pregunta de forma veraz y actualizada.</p>
        <ul>
          <li>La información suministrada será utilizada exclusivamente con fines académicos e institucionales.</li>
          <li>Toda información falsa o inexacta puede resultar en la anulación de la solicitud.</li>
          <li>Una vez enviada, recibirá un <strong>código único de seguimiento</strong> con código QR para verificar el estado de su solicitud.</li>
          <li>La institución se reserva el derecho de aprobar o rechazar las solicitudes según disponibilidad de cupos y criterios internos.</li>
          <li>La solicitud de cupo <strong>no garantiza</strong> la inscripción definitiva del estudiante.</li>
        </ul>
        <p>Al aceptar, declara que la información aportada es <strong>veraz y actualizada</strong>, y autoriza al plantel a procesarla conforme a sus políticas institucionales.</p>
      </div>

      <div
        className={`p-4 rounded-4 mb-4 ${form.acepta_terminos ? 'bg-success bg-opacity-10' : 'bg-white border'}`}
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
        <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto" onClick={handleIniciarSolicitud} disabled={!form.acepta_terminos}>
          Continuar <i className="bi bi-arrow-right ms-1"></i>
        </button>
      </div>
    </div>
  );

  // ─── PASO 3: DATOS DEL ESTUDIANTE ─────────────────────────────────────────────
  const renderStep3 = () => {
    let edadEstudiante = '';
    if (form.estudiante_fecha_nacimiento) {
      const hoy = new Date();
      const fechaNac = new Date(form.estudiante_fecha_nacimiento);
      let edad = hoy.getFullYear() - fechaNac.getFullYear();
      const mes = hoy.getMonth() - fechaNac.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
        edad--;
      }
      edadEstudiante = edad >= 0 ? `${edad} años` : '';
    }

    return (
    <div className="animate__animated animate__fadeIn">
      <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
        <i className="bi bi-mortarboard-fill text-success fs-5"></i>
        <h6 className="fw-bold text-dark mb-0">Datos del Estudiante</h6>
      </div>

      <div className="row g-3">
        {/* NOMBRES — campo separado con modo título */}
        <div className="col-md-4">
          <label className="form-label fw-semibold">Nombres del Estudiante <span className="text-danger">*</span></label>
          <input
            type="text"
            className="form-control input-moderno"
            placeholder="Ej. María Alejandra"
            value={form.estudiante_nombres}
            onChange={(e) => handleTituloChange(e, (v) => updateForm('estudiante_nombres', v))}
            required
          />
          <div className="form-text">Solo los nombres (sin apellidos)</div>
        </div>

        {/* APELLIDOS — campo separado con modo título */}
        <div className="col-md-4">
          <label className="form-label fw-semibold">Apellidos del Estudiante <span className="text-danger">*</span></label>
          <input
            type="text"
            className="form-control input-moderno"
            placeholder="Ej. García López"
            value={form.estudiante_apellidos}
            onChange={(e) => handleTituloChange(e, (v) => updateForm('estudiante_apellidos', v))}
            required
          />
          <div className="form-text">Solo los apellidos</div>
        </div>

        <div className="col-md-4">
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

        <div className="col-md-2">
          <label className="form-label fw-semibold">Fecha de Nacimiento <span className="text-danger">*</span></label>
          <input type="date" className="form-control input-moderno" value={form.estudiante_fecha_nacimiento}
            onChange={(e) => updateForm('estudiante_fecha_nacimiento', e.target.value)} required />
        </div>

        <div className="col-md-1">
          <label className="form-label fw-semibold">Edad</label>
          <input type="text" className="form-control input-moderno text-center fw-bold" value={edadEstudiante} disabled />
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">Condición / Discapacidad <span className="text-danger">*</span></label>
          <select className="form-select input-moderno" value={form.estudiante_condicion_neuro}
            onChange={(e) => updateForm('estudiante_condicion_neuro', e.target.value)} required>
            <option value="Neurotípico">Neurotípico</option>
            <option value="Neurodivergente o Discapacidad">Neurodivergente o Discapacidad</option>
          </select>
        </div>

        {form.estudiante_condicion_neuro === 'Neurodivergente o Discapacidad' && (
          <>
            <div className="col-md-4 animate__animated animate__fadeIn">
              <label className="form-label fw-semibold">Tipo de Condición / Discapacidad <span className="text-danger">*</span></label>
              <select className="form-select input-moderno" value={form.estudiante_tipo_condicion}
                onChange={(e) => updateForm('estudiante_tipo_condicion', e.target.value)} required>
                <option value="">Seleccione...</option>
                <option value="Discapacidad Intelectual">Discapacidad Intelectual</option>
                <option value="Discapacidad Auditiva">Discapacidad Auditiva</option>
                <option value="Discapacidad Visual">Discapacidad Visual</option>
                <option value="Discapacidad Física Motora">Discapacidad Física Motora</option>
                <option value="Trastorno Del Espectro Autista Tea">Trastorno Del Espectro Autista Tea</option>
                <option value="Altas Potencialidades Intelectuales y Creativas">Altas Potencialidades Intelectuales y Creativas</option>
                <option value="Dificultades para el Aprendizaje">Dificultades para el Aprendizaje</option>
              </select>
            </div>
            
            <div className="col-md-4 animate__animated animate__fadeIn">
              <label className="form-label fw-semibold">¿Tiene informe médico? <span className="text-danger">*</span></label>
              <div className="d-flex gap-3 mt-2">
                {[{ label: 'Sí', val: true }, { label: 'No', val: false }].map(opt => (
                  <button key={opt.label} type="button"
                    className={`btn rounded-pill px-4 fw-semibold ${form.estudiante_informe_neuro === opt.val ? 'btn-success shadow' : 'btn-outline-secondary'}`}
                    onClick={() => updateForm('estudiante_informe_neuro', opt.val)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-md-4 animate__animated animate__fadeIn">
              <label className="form-label fw-semibold">¿Tiene certificado CONAPDIS? <span className="text-danger">*</span></label>
              <div className="d-flex gap-3 mt-2">
                {[{ label: 'Sí', val: true }, { label: 'No', val: false }].map(opt => (
                  <button key={opt.label} type="button"
                    className={`btn rounded-pill px-4 fw-semibold ${form.estudiante_certificado_conapdis === opt.val ? 'btn-success shadow' : 'btn-outline-secondary'}`}
                    onClick={() => updateForm('estudiante_certificado_conapdis', opt.val)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="col-md-3">
          <label className="form-label fw-semibold">N° de Hijo/a en la Familia</label>
          <input type="number" min="1" max="20" className="form-control input-moderno" placeholder="Ej. 2"
            value={form.estudiante_orden_nacimiento} onChange={(e) => updateForm('estudiante_orden_nacimiento', e.target.value)} />
          <div className="form-text">Orden de nacimiento entre sus hermanos</div>
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold">Plantel de Procedencia</label>
          <input type="text" className="form-control input-moderno" placeholder="Escuela anterior (si aplica)"
            value={form.plantel_procedencia}
            onChange={(e) => handleTituloChange(e, (v) => updateForm('plantel_procedencia', v))} />
        </div>

        {/* Grado desde BD */}
        <div className="col-md-4">
          <label className="form-label fw-semibold">Grado o Año a Cursar <span className="text-danger">*</span></label>
          <select className="form-select input-moderno" value={form.grado_solicitado}
            onChange={(e) => updateForm('grado_solicitado', e.target.value)} required>
            <option value="">Seleccione...</option>
            {gradosDB.map((g, i) => <option key={i} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Parentesco desde BD */}
        <div className="col-md-4">
          <label className="form-label fw-semibold">Parentesco con el Trabajador o Trabajadora <span className="text-danger">*</span></label>
          <select className="form-select input-moderno" value={form.parentesco}
            onChange={(e) => {
              const val = e.target.value;
              updateForm('parentesco', val);
              if (val === 'Comunidad' || form.representante_parentesco === 'Comunidad') {
                updateForm('representante_trabaja_pdvsa', 'No');
                updateForm('madre_trabaja_pdvsa', false);
                updateForm('pdvsa_tipo_nomina', '');
                updateForm('pdvsa_condicion_laboral', '');
              }
            }} required>
            <option value="">Seleccione...</option>
            {parentescosDB.map((p, i) => <option key={i} value={p} disabled={p === 'Comunidad'}>{p}</option>)}
          </select>
          <div className="form-text">Parentesco del solicitante con el estudiante</div>
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">¿Tiene otros representados inscritos? <span className="text-danger">*</span></label>
          <div className="d-flex gap-3 mt-2">
            {[{ label: 'Sí', val: true }, { label: 'No', val: false }].map(opt => (
              <button key={opt.label} type="button"
                className={`btn rounded-pill px-4 fw-semibold ${form.tiene_otros_inscritos === opt.val ? 'btn-success shadow' : 'btn-outline-secondary'}`}
                onClick={() => updateForm('tiene_otros_inscritos', opt.val)}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* SECCIÓN DIRECCIÓN CON GPS */}
        <div className="col-12 mt-3">
          <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
            <i className="bi bi-geo-alt-fill text-success fs-5"></i>
            <h6 className="fw-bold text-dark mb-0">Dirección de Habitación</h6>
          </div>
        </div>

        {/* Botón GPS */}
        <div className="col-12">
          <button
            type="button"
            className="btn btn-outline-success rounded-pill fw-semibold hover-efecto"
            onClick={handleObtenerUbicacion}
            disabled={loadingGPS}
          >
            {loadingGPS
              ? <><span className="spinner-border spinner-border-sm me-2"></span>Obteniendo ubicación...</>
              : <><i className="bi bi-geo-alt-fill me-2"></i>Usar mi ubicación actual (GPS)</>
            }
          </button>
          <span className="text-muted small ms-3">O completa los campos manualmente</span>
        </div>

        {/* Estado */}
        <div className="col-md-4">
          <label className="form-label fw-semibold">Estado <span className="text-danger">*</span></label>
          <select className="form-select input-moderno" value={form.estado_habitacion}
            onChange={(e) => {
              updateForm('estado_habitacion', e.target.value);
              updateForm('municipio_habitacion', '');
              updateForm('parroquia_habitacion', '');
            }} required>
            <option value="">Seleccione el Estado...</option>
            {estadosDB.sort().map(est => (
              <option key={est} value={est}>{est}</option>
            ))}
          </select>
        </div>

        {/* Municipio (cascada) */}
        <div className="col-md-4">
          <label className="form-label fw-semibold">Municipio <span className="text-danger">*</span></label>
          <select className="form-select input-moderno" value={form.municipio_habitacion}
            onChange={(e) => { updateForm('municipio_habitacion', e.target.value); updateForm('parroquia_habitacion', ''); }}
            required disabled={!form.estado_habitacion}>
            <option value="">Seleccione el Municipio...</option>
            {municipiosDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Parroquia (cascada) */}
        <div className="col-md-4">
          <label className="form-label fw-semibold">Parroquia / Sector</label>
          <select className="form-select input-moderno" value={form.parroquia_habitacion}
            onChange={(e) => updateForm('parroquia_habitacion', e.target.value)}
            disabled={!form.municipio_habitacion}>
            <option value="">Seleccione la Parroquia...</option>
            {parroquiasDisponibles.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Dirección detallada */}
        <div className="col-12">
          <label className="form-label fw-semibold">Dirección Detallada <span className="text-danger">*</span></label>
          <input type="text" className="form-control input-moderno"
            placeholder="Ej. Guaritos I, Vereda 52, Casa #24"
            value={form.direccion_habitacion}
            onChange={(e) => updateForm('direccion_habitacion', e.target.value)} required />
          <div className="form-text">Indica la urbanización, vereda, casa o apartamento</div>
        </div>
      </div>

      <div className="d-flex justify-content-between mt-4 pt-3 border-top">
        <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(2)}>
          <i className="bi bi-arrow-left me-1"></i> Anterior
        </button>
        <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto"
          onClick={() => {
            if (!form.estudiante_nombres || !form.estudiante_apellidos || !form.estudiante_fecha_nacimiento || !form.grado_solicitado || !form.estado_habitacion || !form.direccion_habitacion) {
              if (Swal) Swal.fire('Atención', 'Por favor completa todos los campos obligatorios (*)', 'warning');
              return;
            }
            setStep(4);
          }}>
          Continuar <i className="bi bi-arrow-right ms-1"></i>
        </button>
      </div>
    </div>
    );
  };

  // ─── PASO 2: DATOS DEL REPRESENTANTE ─────────────────────────────────────────
  const renderStep2 = () => (
    <div className="animate__animated animate__fadeIn">
      <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
        <i className="bi bi-person-lines-fill text-success fs-5"></i>
        <h6 className="fw-bold text-dark mb-0">Datos del Representante Legal (Trabajador de la Empresa)</h6>
      </div>

      <div className="row g-3">
        <div className="col-md-4">
          <label className="form-label fw-semibold">Nombres (Representante) <span className="text-danger">*</span></label>
          <input type="text" className="form-control input-moderno" placeholder="Ej. Carlos Alberto"
            value={form.representante_nombres}
            onChange={(e) => handleTituloChange(e, (v) => updateForm('representante_nombres', v))} required />
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">Apellidos (Representante) <span className="text-danger">*</span></label>
          <input type="text" className="form-control input-moderno" placeholder="Ej. Ramírez Pérez"
            value={form.representante_apellidos}
            onChange={(e) => handleTituloChange(e, (v) => updateForm('representante_apellidos', v))} required />
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">N° Cédula (Padre/Rep.) <span className="text-danger">*</span></label>
          <input type="text" className="form-control input-moderno" placeholder="Ej. 13567896"
            value={form.representante_cedula} onChange={(e) => updateForm('representante_cedula', e.target.value)} required />
          <div className="form-text">Solo el número, sin puntos ni letras</div>
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">Parentesco <span className="text-danger">*</span></label>
          <select className="form-select input-moderno" value={form.representante_parentesco}
            onChange={(e) => {
              const val = e.target.value;
              updateForm('representante_parentesco', val);
              if (val === 'Comunidad' || form.parentesco === 'Comunidad') {
                updateForm('representante_trabaja_pdvsa', 'No');
                updateForm('madre_trabaja_pdvsa', false);
                updateForm('pdvsa_tipo_nomina', '');
                updateForm('pdvsa_condicion_laboral', '');
              }
            }}>
            <option value="">Seleccione...</option>
            {parentescosDB.map((p, i) => <option key={i} value={p} disabled={p === 'Comunidad'}>{p}</option>)}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">Teléfono Principal <span className="text-danger">*</span></label>
          <input type="text" className="form-control input-moderno" placeholder="Ej. 0291-6518384 ó 0416-6263890"
            value={form.representante_telefono} onChange={(e) => updateForm('representante_telefono', e.target.value)} required />
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">Teléfono Alternativo</label>
          <input type="text" className="form-control input-moderno" placeholder="Ej. 0291-6518384 ó 0416-6263890"
            value={form.representante_telefono2} onChange={(e) => updateForm('representante_telefono2', e.target.value)} />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Correo Electrónico <span className="text-danger">*</span></label>
          <input type="email" className="form-control input-moderno" placeholder="correo@ejemplo.com"
            value={form.representante_email} onChange={(e) => updateForm('representante_email', e.target.value)} required />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">¿Trabaja en PDVSA? <span className="text-danger">*</span></label>
          <div className="d-flex gap-3 mt-2">
            {['Sí', 'No'].map(op => {
              const esComunidad = form.representante_parentesco === 'Comunidad' || form.parentesco === 'Comunidad';
              const disabled = esComunidad && op === 'Sí';
              const isSelected = esComunidad ? op === 'No' : form.representante_trabaja_pdvsa === op;
              return (
                <button key={op} type="button"
                  className={`btn rounded-pill px-4 fw-semibold ${isSelected ? 'btn-success shadow' : 'btn-outline-secondary'}`}
                  onClick={() => {
                    if (!disabled) updateForm('representante_trabaja_pdvsa', op);
                  }}
                  disabled={disabled}
                >
                  {op}
                </button>
              );
            })}
          </div>
          {(form.representante_parentesco === 'Comunidad' || form.parentesco === 'Comunidad') && (
            <div className="form-text text-danger mt-2">No aplica por parentesco Comunidad</div>
          )}
        </div>

        {form.representante_trabaja_pdvsa === 'Sí' && (
          <div className="col-12 mt-3 animate__animated animate__fadeIn">
            <div className="card shadow-sm border-success">
              <div className="card-body bg-light rounded">
                <h6 className="fw-bold text-success mb-3"><i className="bi bi-buildings me-2"></i>Información Laboral (Representante)</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Condición Laboral <span className="text-danger">*</span></label>
                    <select className="form-select input-moderno" value={form.pdvsa_condicion_laboral}
                      onChange={(e) => updateForm('pdvsa_condicion_laboral', e.target.value)} required>
                      <option value="">Seleccione...</option>
                      {condicionLaboralDB.map((c, i) => <option key={i} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Tipo de Nómina <span className="text-danger">*</span></label>
                    <select className="form-select input-moderno" value={form.pdvsa_tipo_nomina}
                      onChange={(e) => updateForm('pdvsa_tipo_nomina', e.target.value)} required>
                      <option value="">Seleccione...</option>
                      {tiposNominaDB.map((t, i) => <option key={i} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Negocio / Filial <span className="text-danger">*</span></label>
                    <select className="form-select input-moderno" value={form.pdvsa_negocio_filial}
                      onChange={(e) => updateForm('pdvsa_negocio_filial', e.target.value)} required>
                      <option value="">Seleccione...</option>
                      {negociosDB.map((n, i) => <option key={i} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Gerencia / Dpto. <span className="text-danger">*</span></label>
                    <select className="form-select input-moderno" value={form.pdvsa_gerencia}
                      onChange={(e) => updateForm('pdvsa_gerencia', e.target.value)} required>
                      <option value="">Seleccione...</option>
                      {gerenciasDB.map((g, i) => <option key={i} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Correo Corporativo</label>
                    <input type="email" className="form-control input-moderno" placeholder="usuario@pdvsa.com"
                      value={form.pdvsa_email_empresa} onChange={(e) => updateForm('pdvsa_email_empresa', e.target.value)} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Localidad de Trabajo <span className="text-danger">*</span></label>
                    <select className="form-select input-moderno mb-2" value={form.pdvsa_localidad_trabajo}
                      onChange={(e) => updateForm('pdvsa_localidad_trabajo', e.target.value)} required>
                      <option value="">Seleccione...</option>
                      {localidadesDB.map((l, i) => <option key={i} value={l}>{l}</option>)}
                      <option value="Otra">Otra (Especificar)</option>
                    </select>
                    {form.pdvsa_localidad_trabajo === 'Otra' && (
                      <input type="text" className="form-control input-moderno animate__animated animate__fadeIn" 
                        placeholder="Especifique la localidad..."
                        value={form.pdvsa_localidad_trabajo_otra || ''}
                        onChange={(e) => updateForm('pdvsa_localidad_trabajo_otra', e.target.value)} required />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DATOS DE LA MADRE */}
        <div className="col-12 mt-2 pt-3 border-top">
          <div className="d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-person-heart text-success fs-5"></i>
            <h6 className="fw-bold text-dark mb-0">Datos de la Madre</h6>
            <span className="badge bg-light text-muted border ms-1" style={{ fontSize: '0.7rem' }}>Opcional</span>
          </div>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold">N° Cédula (Madre)</label>
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
                {[{ label: 'Sí', val: true }, { label: 'No', val: false }].map(opt => {
                  const esComunidad = form.representante_parentesco === 'Comunidad' || form.parentesco === 'Comunidad';
                  const disabled = esComunidad && opt.val === true;
                  const isSelected = esComunidad ? opt.val === false : form.madre_trabaja_pdvsa === opt.val;
                  return (
                    <button key={opt.label} type="button"
                      className={`btn rounded-pill px-4 fw-semibold ${isSelected ? 'btn-success shadow' : 'btn-outline-secondary'}`}
                      onClick={() => {
                        if (!disabled) updateForm('madre_trabaja_pdvsa', opt.val);
                      }}
                      disabled={disabled}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-between mt-4 pt-3 border-top">
        <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(1)}>
          <i className="bi bi-arrow-left me-1"></i> Anterior
        </button>
        <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto"
          onClick={() => {
            if (!form.representante_cedula || !form.representante_telefono || !form.representante_email) {
              if (Swal) Swal.fire('Atención', 'Por favor completa los campos obligatorios del representante (*)', 'warning');
              return;
            }
            setStep(3);
          }}>
          Continuar <i className="bi bi-arrow-right ms-1"></i>
        </button>
      </div>
    </div>
  );

  // ─── PASO 4: TRANSPORTE ESCOLAR ───────────────────────────────────────────────
  const renderStep4 = () => {
    return (
      <div className="animate__animated animate__fadeIn">
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
              <label className="form-label fw-semibold">Ruta o Sector Preferido</label>
              <input type="text" className="form-control input-moderno"
                placeholder="Indica tu sector o ruta (Ej. Ruta 3 - Guaritos, Ruta 7 - El Tigre Centro)"
                value={form.ruta_transporte} onChange={(e) => updateForm('ruta_transporte', e.target.value)} />
              <div className="form-text">La asignación final de ruta queda sujeta a la disponibilidad del plantel.</div>
            </div>
          )}
        </div>

        <div className="d-flex justify-content-between mt-4 pt-3 border-top">
          <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(3)}>
            <i className="bi bi-arrow-left me-1"></i> Anterior
          </button>
          <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto" onClick={() => setStep(5)}>
            Siguiente <i className="bi bi-arrow-right ms-1"></i>
          </button>
        </div>
      </div>
    );
  };

  // ─── PASO 5: DOCUMENTOS ADJUNTOS ─────────────────────────────────────────────
  const renderStep5 = () => {
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof documentos) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const compressed = await compressImage(file, 1280, 1280, 0.7);
        setDocumentos(prev => ({ ...prev, [key]: compressed }));
      } catch (error) {
        console.error(error);
        if (Swal) Swal.fire('Error', 'No se pudo procesar la imagen seleccionada.', 'error');
      }
    };

    const renderInput = (key: keyof typeof documentos, label: string, required: boolean) => (
      <div className="col-md-6 mb-3">
        <label className="form-label fw-bold text-dark">{label} {required && <span className="text-danger">*</span>}</label>
        <div className="d-flex align-items-center gap-2">
          <input 
            type="file" 
            className="form-control input-moderno" 
            accept="image/*" 
            onChange={(e) => handleFileChange(e, key)}
          />
          {documentos[key] && <i className="bi bi-check-circle-fill text-success fs-4"></i>}
        </div>
        {documentos[key] && <div className="form-text text-success">Archivo listo: {documentos[key]?.name} ({(documentos[key]?.size! / 1024).toFixed(1)} KB)</div>}
      </div>
    );

    return (
      <div className="animate__animated animate__fadeIn">
        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
          <i className="bi bi-file-earmark-arrow-up fs-4 text-success"></i>
          <h5 className="mb-0 fw-bold text-dark">Documentos Adjuntos</h5>
        </div>
        <p className="text-muted small mb-4">
          Por favor sube imágenes legibles de los siguientes documentos.
        </p>

        <div className="row g-3">
          {renderInput('ficha', 'Copia de la Ficha del Estudiante', true)}
          {renderInput('foto', 'Foto del Estudiante', true)}
          {renderInput('partida', 'Copia de la Partida de Nacimiento', true)}
          {renderInput('cedula', 'Foto de la Cédula del Estudiante (Si aplica)', false)}
        </div>

        <div className="d-flex justify-content-between mt-4 pt-3 border-top">
          <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(4)} disabled={subiendoDocs}>
            <i className="bi bi-arrow-left me-1"></i> Anterior
          </button>
          <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto" onClick={handleSubmitFinal} disabled={subiendoDocs}>
            {subiendoDocs ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Procesando...</>
            ) : (
              <><i className="bi bi-send-check me-1"></i> Finalizar y Enviar</>
            )}
          </button>
        </div>
      </div>
    );
  };

  // ─── PASO 6: CONFIRMACIÓN + QR ────────────────────────────────────────────────
  const renderStep6 = () => {
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
          <div className="col-md-5">
            <div className="card rounded-4 border-0 shadow p-4 h-100"
              style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '2px solid #86efac' }}>
              <div className="fw-bold text-success text-uppercase small mb-2">
                <i className="bi bi-qr-code-scan me-1"></i> Código de Verificación
              </div>
              <div className="bg-white rounded-3 p-2 d-inline-block mb-3 shadow-sm mx-auto">
                <img src={qrUrl} alt="QR Code Solicitud" width={180} height={180} style={{ display: 'block', borderRadius: 8 }} />
              </div>
              <div className="bg-success text-white rounded-3 py-2 px-3 d-inline-block mx-auto mb-2 fw-bold"
                style={{ fontSize: '1rem', letterSpacing: 2, fontFamily: 'monospace' }}>
                {sol.codigo_unico}
              </div>
              <p className="text-muted small mb-0">Guarda este código. Podrás usarlo para verificar el estado de tu solicitud.</p>
            </div>
          </div>

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
                <div className="col-5 text-muted">Dirección:</div>
                <div className="col-7 fw-semibold">{[sol.parroquia_habitacion, sol.municipio_habitacion, sol.estado_habitacion].filter(Boolean).join(', ')}</div>
                <div className="col-5 text-muted">Plantel:</div>
                <div className="col-7 fw-semibold">{escNombre}</div>
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
              <strong className="text-dark">Próximos pasos:</strong> La Dirección evaluará tu solicitud. Puedes hacer seguimiento en la sección <strong>"Mis Solicitudes"</strong> usando el código de verificación.
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

  // Cálculo de progreso del formulario
  const calcularProgreso = () => {
    // Definimos los campos clave requeridos para completar el formulario
    const camposRequeridos = [
      form.estudiante_nombres,
      form.estudiante_apellidos,
      form.estudiante_cedula,
      form.estudiante_fecha_nacimiento,
      form.grado_solicitado,
      form.estado_habitacion,
      form.municipio_habitacion,
      form.parroquia_habitacion,
      form.direccion_habitacion,
      form.representante_nombres,
      form.representante_apellidos,
      form.representante_cedula,
      form.representante_telefono,
      form.representante_email,
      form.estudiante_condicion_neuro,
    ];
    if (form.estudiante_condicion_neuro === 'Neurodivergente o Discapacidad') {
      camposRequeridos.push(form.estudiante_tipo_condicion);
    }
      // Require PDVSA info only if representative works at PDVSA
      if (form.representante_trabaja_pdvsa === 'Sí') {
        camposRequeridos.push(form.pdvsa_condicion_laboral);
        camposRequeridos.push(form.pdvsa_tipo_nomina);
        camposRequeridos.push(form.pdvsa_negocio_filial);
        camposRequeridos.push(form.pdvsa_gerencia);
        camposRequeridos.push(form.pdvsa_localidad_trabajo);
        if (form.pdvsa_localidad_trabajo === 'Otra') {
          camposRequeridos.push(form.pdvsa_localidad_trabajo_otra || '');
        }
      }
    const completados = camposRequeridos.filter(c => c && c.toString().trim() !== '').length;
    return Math.round((completados / camposRequeridos.length) * 100);
  };
  const progreso = calcularProgreso();

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

      {/* STATS (admin) */}
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
      <div className="d-flex gap-2 border-bottom pb-3 mb-4" style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
        {isUserAdmin && (
          <button onClick={() => setActiveTab('gestion')}
            className={`btn rounded-pill fw-bold hover-efecto flex-shrink-0 ${activeTab === 'gestion' ? 'btn-success shadow' : 'btn-outline-secondary'}`}
            style={{ whiteSpace: 'nowrap', fontSize: 'clamp(0.72rem, 2.2vw, 0.95rem)', padding: 'clamp(6px, 1.5vw, 10px) clamp(12px, 3vw, 20px)' }}>
            <i className="bi bi-list-task me-1"></i> Listado General
          </button>
        )}
        <button onClick={() => setActiveTab('mis_solicitudes')}
          className={`btn rounded-pill fw-bold hover-efecto flex-shrink-0 ${activeTab === 'mis_solicitudes' ? 'btn-success shadow' : 'btn-outline-secondary'}`}
          style={{ whiteSpace: 'nowrap', fontSize: 'clamp(0.72rem, 2.2vw, 0.95rem)', padding: 'clamp(6px, 1.5vw, 10px) clamp(12px, 3vw, 20px)' }}>
          <i className="bi bi-inbox-fill me-1"></i> Mis Solicitudes
        </button>
        <button onClick={() => { setActiveTab('nueva_solicitud'); setStep(1); setSolicitudGuardada(null); }}
          className={`btn rounded-pill fw-bold hover-efecto flex-shrink-0 ${activeTab === 'nueva_solicitud' ? 'btn-success shadow' : 'btn-outline-secondary'}`}
          style={{ whiteSpace: 'nowrap', fontSize: 'clamp(0.72rem, 2.2vw, 0.95rem)', padding: 'clamp(6px, 1.5vw, 10px) clamp(12px, 3vw, 20px)' }}>
          <i className="bi bi-plus-lg me-1"></i> Nueva Solicitud
        </button>
      </div>

      {/* CONTENIDO */}
      <div className="bg-white border rounded-4 p-4 shadow-sm">

        {/* GESTIÓN (admin) */}
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
                          <span className="text-muted small"><i className="bi bi-geo-alt me-1"></i>{[sol.municipio_habitacion, sol.estado_habitacion].filter(Boolean).join(', ') || '—'}</span>
                        </td>
                        <td><span className="badge bg-light text-dark border px-2">{sol.grado_solicitado}</span></td>
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

        {/* MIS SOLICITUDES */}
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
                          <span className="text-muted d-block">Ubicación:</span>
                          <span className="fw-semibold">{[sol.municipio_habitacion, sol.estado_habitacion].filter(Boolean).join(', ') || sol.direccion_habitacion || '—'}</span>
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

        {/* NUEVA SOLICITUD (WIZARD) */}
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
            
            <div className="mb-4 bg-white p-3 rounded-4 shadow-sm border sticky-top" style={{ top: '80px', zIndex: 100 }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0 fw-bold text-muted small"><i className="bi bi-thermometer-half me-1"></i> Progreso de la Solicitud</h6>
                <span className="fw-bold text-primary small">{progreso}%</span>
              </div>
              <div className="progress" style={{ height: '8px' }}>
                <div 
                  className={`progress-bar progress-bar-striped progress-bar-animated ${progreso === 100 ? 'bg-success' : 'bg-primary'}`} 
                  role="progressbar" 
                  style={{ width: `${progreso}%` }}
                ></div>
              </div>
            </div>

            {renderStepper()}
            <div className="mt-4">
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
              {step === 5 && renderStep5()}
              {step === 6 && renderStep6()}
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
                        <div className="mb-1"><span className="text-muted">Municipio: </span>{selectedSol.municipio_habitacion} — {selectedSol.estado_habitacion}</div>
                        <div><span className="text-muted">Dirección: </span>{selectedSol.direccion_habitacion}</div>
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
