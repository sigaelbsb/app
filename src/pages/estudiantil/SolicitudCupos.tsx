import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';
import { compressImage } from '../../utils/imageCompression';
import html2canvas from 'html2canvas';

// ─── HELPER: MODO TÍTULO ────────────────────────────────────────────────────────
// Convierte cada palabra a Title Case sin forzar mayúscula/minúscula sostenida,
// respetando abreviaturas conocidas en mayúscula.
const ABREVIATURAS = ['CEI', 'TDA', 'TDH', 'TDHA', 'ADN', 'UE', 'CE', 'EB', 'PDVSA', 'PDV'];

const toTitulo = (value: string): string =>
  value
    .split(' ')
    .map(word => {
      const wUpper = word.toUpperCase();
      if (ABREVIATURAS.includes(wUpper)) {
        return wUpper;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
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
  estudiante_tipo_condicion_otro: string;
  estudiante_informe_neuro: boolean;
  estudiante_certificado_conapdis: boolean;
  estudiante_condicion_medica: string;
  estudiante_condicion_medica_otro: string;
  estudiante_alergico_medicamentos: string;
  estudiante_alergico_medicamentos_otro: string;
  grado_solicitado: string;
  parentesco: string;
  estudiante_con_quien_vive: string[] | string;
  estudiante_con_quien_vive_otro?: string;
  estudiante_reconocido_por_padre?: string;
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
  // Datos de la Madre
  madre_vive?: string;
  madre_es_representante?: boolean;
  madre_nombres?: string;
  madre_apellidos?: string;
  madre_cedula: string;
  madre_fecha_nacimiento?: string;
  madre_email: string;
  madre_telefono?: string;
  madre_trabaja_pdvsa: boolean | string;
  // Datos del Padre
  padre_vive?: string;
  padre_es_representante?: boolean;
  padre_nombres?: string;
  padre_apellidos?: string;
  padre_cedula?: string;
  padre_fecha_nacimiento?: string;
  padre_email?: string;
  padre_telefono?: string;
  padre_trabaja_pdvsa?: boolean | string;
  requiere_transporte: boolean;
  ruta_transporte: string;
  // Documentos
  doc_ficha: string;
  doc_foto_estudiante: string;
  doc_partida_nacimiento: string;
  doc_cedula_estudiante: string;
}

interface SolicitudDB extends SolicitudForm {
  id?: string | number;
  codigo_escuela: string;
  estado: string;
  observaciones: string;
  creado_por: string;
  created_at?: string;
  updated_at?: string;
  doc_partida_trabajador?: string;
  doc_partida_nexo?: string;
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
  estudiante_tipo_condicion_otro: '',
  estudiante_informe_neuro: false,
  estudiante_certificado_conapdis: false,
  estudiante_condicion_medica: 'Ninguna',
  estudiante_condicion_medica_otro: '',
  estudiante_alergico_medicamentos: 'Ninguna',
  estudiante_alergico_medicamentos_otro: '',
  grado_solicitado: '',
  parentesco: '',
  estudiante_con_quien_vive: [],
  estudiante_con_quien_vive_otro: '',
  estudiante_reconocido_por_padre: 'Sí',
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
  madre_vive: 'Sí',
  madre_es_representante: false,
  madre_nombres: '',
  madre_apellidos: '',
  madre_cedula: '',
  madre_fecha_nacimiento: '',
  madre_email: '',
  madre_telefono: '',
  madre_trabaja_pdvsa: false,
  padre_vive: 'Sí',
  padre_es_representante: false,
  padre_nombres: '',
  padre_apellidos: '',
  padre_cedula: '',
  padre_fecha_nacimiento: '',
  padre_email: '',
  padre_telefono: '',
  padre_trabaja_pdvsa: false,
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
  const [condicionNeuroDB, setCondicionNeuroDB] = useState<string[]>([]);
  const [condicionMedicaDB, setCondicionMedicaDB] = useState<string[]>([]);
  const [alergiasDB, setAlergiasDB] = useState<string[]>([]);
  
  // Geodatos DB state
  const [geoData, setGeoData] = useState<any[]>([]);
  const [estadosDB, setEstadosDB] = useState<string[]>([]);

  // Wizard state
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SolicitudForm>(defaultForm());
  const [solicitudGuardada, setSolicitudGuardada] = useState<SolicitudDB | null>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  
  // Estados para rutas y paradas en la solicitud
  const [rutasTransporteDB, setRutasTransporteDB] = useState<any[]>([]);
  const [paradasTransporteDB, setParadasTransporteDB] = useState<any[]>([]);
  const [selectedRutaObj, setSelectedRutaObj] = useState<any | null>(null);
  const [selectedParadaObj, setSelectedParadaObj] = useState<any | null>(null);
  const [savingStatus, setSavingStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  const [subiendoDocs, setSubiendoDocs] = useState(false);

  // Documentos adjuntos a subir
  const [documentos, setDocumentos] = useState<{
    ficha: File | string | null;
    foto: File | string | null;
    partida: File | string | null;
    partida_trabajador: File | string | null;
    partida_nexo: File | string | null;
    cedula: File | string | null;
  }>({ ficha: null, foto: null, partida: null, partida_trabajador: null, partida_nexo: null, cedula: null });

  // GPS state
  const [loadingGPS, setLoadingGPS] = useState(false);


  const escCodigo = localStorage.getItem('sigae_escuela_codigo') || 'sb';
  const escNombre = escCodigo === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
  const isUserAdmin = ['SuperAdmin', 'Director', 'Administrador', 'Coordinador'].includes(user?.rol);
  const [filtroEscuela, setFiltroEscuela] = useState<string>(() => isUserAdmin ? 'todos' : escCodigo);
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [fechaInicioProceso, setFechaInicioProceso] = useState<string>('');
  const [fechaFinProceso, setFechaFinProceso] = useState<string>('');

  const checkProcesoAbierto = () => {
    if (!fechaInicioProceso && !fechaFinProceso) return { abierto: true, motivo: '' };
    
    const ahoraMs = new Date().getTime();
    
    if (fechaInicioProceso) {
      const inicioStr = fechaInicioProceso.includes('T') ? fechaInicioProceso : `${fechaInicioProceso}T00:00:00`;
      const inicioMs = new Date(inicioStr).getTime();
      if (ahoraMs < inicioMs) {
        const fechaFmt = new Date(inicioStr).toLocaleString('es-VE', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true 
        });
        return { 
          abierto: false, 
          motivo: `El período de solicitudes de cupo aún no ha iniciado. Estará habilitado a partir del ${fechaFmt}.` 
        };
      }
    }
    
    if (fechaFinProceso) {
      const finStr = fechaFinProceso.includes('T') ? fechaFinProceso : `${fechaFinProceso}T23:59:59`;
      const finMs = new Date(finStr).getTime();
      if (ahoraMs > finMs) {
        const fechaFmt = new Date(finStr).toLocaleString('es-VE', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true 
        });
        return { 
          abierto: false, 
          motivo: `El período para la solicitud de cupos ha finalizado. La fecha y hora límite de recepción fue el ${fechaFmt}.` 
        };
      }
    }
    
    return { abierto: true, motivo: '' };
  };

  const estadoProceso = checkProcesoAbierto();

  useEffect(() => {
    if (isUserAdmin && filtroEscuela !== 'todos' && filtroEscuela !== 'sb' && filtroEscuela !== 'lb') {
      setFiltroEscuela('todos');
    }
  }, [isUserAdmin]);

  // Geodatos calculados
  const municipiosDisponibles = form.estado_habitacion 
    ? Array.from(new Set(geoData.filter(d => d.estado === form.estado_habitacion).map(d => d.municipio))).sort()
    : [];
  const parroquiasDisponibles = (form.estado_habitacion && form.municipio_habitacion)
    ? Array.from(new Set(geoData.filter(d => d.estado === form.estado_habitacion && d.municipio === form.municipio_habitacion).map(d => d.parroquia))).sort()
    : [];

  // El autoguardado ahora se realiza directamente en Supabase

  useEffect(() => {
    if (!permLoading && user) {
      setActiveTab(isUserAdmin ? 'gestion' : 'mis_solicitudes');
      cargarDatos();
      cargarCatalogos();
    }
  }, [permLoading, user, escCodigo, filtroEscuela]);

  // Autofill representative info
  useEffect(() => {
    if (user && activeTab === 'nueva_solicitud' && !editingId) {
      const nombresSplit = user.nombre ? user.nombre.split(' ') : [];
      setForm(prev => ({
        ...prev,
        representante_nombres: prev.representante_nombres || user.nombres || nombresSplit.slice(0, 2).join(' ') || '',
        representante_apellidos: prev.representante_apellidos || user.apellidos || nombresSplit.slice(2).join(' ') || '',
        representante_cedula: prev.representante_cedula || user.cedula || '',
        representante_email: prev.representante_email || user.email || '',
        representante_telefono: prev.representante_telefono || user.telefono || '',
      }));
    }
  }, [user, activeTab, editingId]);

  // Auto-guardado silencioso en base de datos al estar editando o creando (Debounce 1.5s)
  useEffect(() => {
    if (activeTab !== 'nueva_solicitud' || !estadoProceso.abierto) return;
    // Solo insertar borrador nuevo si el usuario ya aceptó los términos y avanzó al paso 2+
    if (!editingId && (!form.acepta_terminos || step < 2)) return;

    const timer = setTimeout(async () => {
      try {
        setSavingStatus('saving');
        const { 
          pdvsa_localidad_trabajo_otra, 
          estudiante_tipo_condicion_otro, 
          estudiante_condicion_medica_otro, 
          estudiante_alergico_medicamentos_otro, 
          estudiante_con_quien_vive_otro,
          ...formToSubmit 
        } = form;

        const payload = {
          ...formToSubmit,
          estudiante_con_quien_vive: Array.isArray(form.estudiante_con_quien_vive)
            ? form.estudiante_con_quien_vive.map(item => item === 'Otros' && estudiante_con_quien_vive_otro ? `Otros (${estudiante_con_quien_vive_otro})` : item).join(', ')
            : form.estudiante_con_quien_vive,
          pdvsa_localidad_trabajo: form.pdvsa_localidad_trabajo?.trim().toLowerCase() === 'otra' || form.pdvsa_localidad_trabajo?.trim().toLowerCase() === 'otro' ? pdvsa_localidad_trabajo_otra || '' : form.pdvsa_localidad_trabajo,
          estudiante_tipo_condicion: form.estudiante_tipo_condicion?.trim().toLowerCase() === 'otro' || form.estudiante_tipo_condicion?.trim().toLowerCase() === 'otra' ? estudiante_tipo_condicion_otro || '' : form.estudiante_tipo_condicion,
          estudiante_condicion_medica: form.estudiante_condicion_medica?.trim().toLowerCase() === 'otro' || form.estudiante_condicion_medica?.trim().toLowerCase() === 'otra' ? estudiante_condicion_medica_otro || '' : form.estudiante_condicion_medica,
          estudiante_alergico_medicamentos: form.estudiante_alergico_medicamentos?.trim().toLowerCase() === 'otro' || form.estudiante_alergico_medicamentos?.trim().toLowerCase() === 'otra' ? estudiante_alergico_medicamentos_otro || '' : form.estudiante_alergico_medicamentos,
          doc_ficha: documentos.ficha && typeof documentos.ficha === 'string' ? documentos.ficha : form.doc_ficha,
          doc_foto_estudiante: documentos.foto && typeof documentos.foto === 'string' ? documentos.foto : form.doc_foto_estudiante,
          doc_partida_nacimiento: documentos.partida && typeof documentos.partida === 'string' ? documentos.partida : form.doc_partida_nacimiento,
          doc_cedula_estudiante: documentos.cedula && typeof documentos.cedula === 'string' ? documentos.cedula : form.doc_cedula_estudiante,
          doc_partida_trabajador: documentos.partida_trabajador && typeof documentos.partida_trabajador === 'string' ? documentos.partida_trabajador : undefined,
          doc_partida_nexo: documentos.partida_nexo && typeof documentos.partida_nexo === 'string' ? documentos.partida_nexo : undefined,
          // Campos con valores especiales para la BD
          estudiante_fecha_nacimiento: formToSubmit.estudiante_fecha_nacimiento || '1900-01-01',
          estudiante_orden_nacimiento: formToSubmit.estudiante_orden_nacimiento === '' ? null : formToSubmit.estudiante_orden_nacimiento,
        } as any;

        if (editingId) {
          const { error: updateError } = await supabase.from('solicitud_cupos').update(payload).eq('id', editingId);
          if (updateError) throw updateError;
          setSavingStatus('saved');
        } else {
          // INSERTAR O ACTUALIZAR BORRADOR (previene error duplicate key por race conditions del timer)
          const insertPayload = {
            ...payload,
            codigo_escuela: escCodigo,
            estado: 'Borrador',
            creado_por: user.cedula,
            codigo_unico: payload.codigo_unico || generarCodigoUnico(escCodigo)
          };
          const { data, error } = await supabase.from('solicitud_cupos').upsert(insertPayload, { onConflict: 'codigo_unico' }).select().single();
          if (error) throw error;
          if (data && data.id) {
            setEditingId(data.id);
            setForm(prev => ({ ...prev, codigo_unico: insertPayload.codigo_unico }));
            setSavingStatus('saved');
          }
        }
        
        // Actualizar listado en segundo plano silenciosamente
        let query = supabase.from('solicitud_cupos').select('*');
        if (filtroEscuela !== 'todos') query = query.eq('codigo_escuela', filtroEscuela);
        if (!isUserAdmin && user) query = query.eq('creado_por', user.cedula);
        const { data: listData } = await query.order('created_at', { ascending: false });
        if (listData) setSolicitudes(listData as SolicitudDB[]);
      } catch (err) {
        console.error('Error auto-guardando DB:', err);
        setSavingStatus('error');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [form, documentos, editingId, escCodigo, isUserAdmin, user, activeTab, step, filtroEscuela]);

  const cargarRutasYParadas = async () => {
    try {
      const [rutasTransRes, paradasTransRes] = await Promise.all([
        supabase.from('transporte_rutas').select('*').eq('escuela_codigo', escCodigo).order('nombre', { ascending: true }),
        supabase.from('transporte_paradas').select('*').eq('escuela_codigo', escCodigo).order('nombre_parada', { ascending: true })
      ]);
      if (rutasTransRes.data) {
        const sortedRutas = [...rutasTransRes.data].sort((a, b) =>
          String(a.nombre || '').localeCompare(String(b.nombre || ''), undefined, { numeric: true, sensitivity: 'base' })
        );
        setRutasTransporteDB(sortedRutas);
      }
      if (paradasTransRes.data) {
        const sortedParadas = [...paradasTransRes.data].sort((a, b) =>
          String(a.nombre_parada || '').localeCompare(String(b.nombre_parada || ''), undefined, { numeric: true, sensitivity: 'base' })
        );
        setParadasTransporteDB(sortedParadas);
      }
    } catch (e) {
      console.error('Error cargando rutas y paradas:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'nueva_solicitud') {
      cargarRutasYParadas();
    }
  }, [activeTab, escCodigo]);

  const cargarCatalogos = async () => {
    try {
      const [gradosRes, parentescosRes, nominasRes, condRes, negociosRes, gerenciasRes, localidadesRes, neuroRes, medicaRes, alergiaRes] = await Promise.all([
        supabase.from('conf_grados').select('valor').order('orden', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Parentesco').order('valor', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Nómina').order('valor', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Condición').order('valor', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Negocio/Filial').order('valor', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Organización/Gerencia').order('valor', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Localidad').order('valor', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Condición / Discapacidad').order('valor', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Condición Médica').order('valor', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Medicamento (Alergia)').order('valor', { ascending: true }),
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

      if (neuroRes.data && neuroRes.data.length > 0) {
        setCondicionNeuroDB(neuroRes.data.map((p: any) => p.valor));
      } else {
        setCondicionNeuroDB([
          'Discapacidad Intelectual', 'Discapacidad Auditiva', 'Discapacidad Visual', 
          'Discapacidad Física Motora', 'Trastorno Del Espectro Autista Tea', 
          'Altas Potencialidades Intelectuales y Creativas', 'Dificultades para el Aprendizaje'
        ]);
      }

      if (medicaRes.data && medicaRes.data.length > 0) {
        setCondicionMedicaDB(medicaRes.data.map((p: any) => p.valor));
      } else {
        setCondicionMedicaDB(['Asmático', 'Epiléptico', 'Diabético', 'Cardiópata', 'Ninguna']);
      }

      if (alergiaRes.data && alergiaRes.data.length > 0) {
        setAlergiasDB(alergiaRes.data.map((p: any) => p.valor));
      } else {
        setAlergiasDB(['Acetaminofén', 'Dipirona', 'Diclofenac', 'Ibuprofeno', 'Penicilina', 'Ninguna']);
      }

      if (allGeoData.length > 0) {
        setGeoData(allGeoData);
        const uniqueEstados = Array.from(new Set(allGeoData.map((d: any) => d.estado)));
        setEstadosDB(uniqueEstados as string[]);
      }

      // Cargar Rutas y Paradas de Transporte Escolar
      await cargarRutasYParadas();
    } catch (e) {
      console.error('Error cargando catálogos:', e);
      setGradosDB(['II Grupo (Inicial)', 'III Grupo (Inicial)', '1° Grado', '2° Grado', '3° Grado', '4° Grado', '5° Grado', '6° Grado', '1° Año', '2° Año', '3° Año', '4° Año', '5° Año']);
      setParentescosDB(['Hijo o Hija', 'Sobrino o Sobrina', 'Nieto o Nieta', 'Hermano o Hermana', 'Otro']);
    }
  };

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Cargar fechas parametrizadas
      const { data: ajustesData } = await supabase.from('ajustes_globales').select('*').in('clave', ['fecha_inicio_cupos', 'fecha_fin_cupos']);
      if (ajustesData) {
        const inicio = ajustesData.find(a => a.clave === 'fecha_inicio_cupos')?.valor || '';
        const fin = ajustesData.find(a => a.clave === 'fecha_fin_cupos')?.valor || '';
        setFechaInicioProceso(inicio);
        setFechaFinProceso(fin);
      }

      // 2. Cargar listado de solicitudes
      let query = supabase.from('solicitud_cupos').select('*');
      if (filtroEscuela !== 'todos') query = query.eq('codigo_escuela', filtroEscuela);
      if (!isUserAdmin && user) query = query.eq('creado_por', user.cedula);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setSolicitudes((data as SolicitudDB[]) || []);
    } catch (e) {
      console.error('Error cargando solicitudes de cupo:', e);
    } finally {
      setLoading(false);
    }
  }, [escCodigo, isUserAdmin, user, filtroEscuela]);

  const updateForm = (field: keyof SolicitudForm, value: any) => {
    let finalValue = value;
    if (field === 'representante_telefono' || field === 'representante_telefono2') {
      const numbers = String(value).replace(/\D/g, '');
      if (numbers.length > 4) {
        finalValue = `${numbers.slice(0, 4)}-${numbers.slice(4, 11)}`;
      } else {
        finalValue = numbers;
      }
    }
    setForm(prev => ({ ...prev, [field]: finalValue }));
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

  const validarPaso = (pasoNum: number): boolean => {
    if (pasoNum === 1) {
      if (!form.acepta_terminos) {
        if (Swal) Swal.fire('Atención', 'Debes aceptar los términos y condiciones para continuar.', 'warning');
        return false;
      }
      return true;
    }

    if (pasoNum === 2) {
      if (
        !form.representante_nombres?.trim() ||
        !form.representante_apellidos?.trim() ||
        !form.representante_cedula?.trim() ||
        !form.representante_telefono?.trim() ||
        !form.representante_email?.trim() ||
        !form.representante_trabaja_pdvsa
      ) {
        if (Swal) Swal.fire('Atención', 'Por favor completa todos los campos obligatorios del Representante (*)', 'warning');
        return false;
      }
      if (!form.representante_parentesco) {
        updateForm('representante_parentesco', form.parentesco || 'Representante');
      }
      if (form.representante_trabaja_pdvsa === 'Sí') {
        if (
          !form.pdvsa_condicion_laboral?.trim() ||
          !form.pdvsa_tipo_nomina?.trim() ||
          !form.pdvsa_negocio_filial?.trim() ||
          !form.pdvsa_gerencia?.trim() ||
          !form.pdvsa_localidad_trabajo?.trim() ||
          (form.pdvsa_localidad_trabajo === 'Otra' && !form.pdvsa_localidad_trabajo_otra?.trim())
        ) {
          if (Swal) Swal.fire('Atención', 'Por favor completa todos los campos obligatorios de la Información Laboral (*)', 'warning');
          return false;
        }
      }
      return true;
    }

    if (pasoNum === 3) {
      // Verificar que la cédula escolar (estudiante_cedula) NO sea obligatoria
      if (
        !form.estudiante_nombres?.trim() ||
        !form.estudiante_apellidos?.trim() ||
        !form.estudiante_fecha_nacimiento?.trim() ||
        !form.estudiante_sexo?.trim() ||
        !form.grado_solicitado?.trim() ||
        !form.parentesco?.trim() ||
        !form.estado_habitacion?.trim() ||
        !form.municipio_habitacion?.trim() ||
        !form.direccion_habitacion?.trim()
      ) {
        if (Swal) Swal.fire('Atención', 'Por favor completa todos los campos obligatorios del Estudiante y Dirección (*)', 'warning');
        return false;
      }
      const arrConQuienVive = Array.isArray(form.estudiante_con_quien_vive)
        ? form.estudiante_con_quien_vive
        : typeof form.estudiante_con_quien_vive === 'string' && form.estudiante_con_quien_vive
        ? form.estudiante_con_quien_vive.split(',').map(s => s.trim())
        : [];
      if (arrConQuienVive.length === 0) {
        if (Swal) Swal.fire('Atención', 'Debes seleccionar al menos una opción en "¿Con quién vive el estudiante?" (*)', 'warning');
        return false;
      }
      if (arrConQuienVive.includes('Otros') && !form.estudiante_con_quien_vive_otro?.trim()) {
        if (Swal) Swal.fire('Atención', 'Has seleccionado "Otros" en con quién vive el estudiante. Por favor especifique (*)', 'warning');
        return false;
      }
      return true;
    }

    if (pasoNum === 4) {
      if (!form.madre_nombres?.trim() || !form.madre_apellidos?.trim() || !form.madre_cedula?.trim()) {
        if (Swal) Swal.fire('Atención', 'Por favor completa los campos obligatorios (Nombres, Apellidos y Cédula) de la Madre tal como aparecen en la partida de nacimiento (*)', 'warning');
        return false;
      }
      if (form.estudiante_reconocido_por_padre !== 'No') {
        if (!form.padre_nombres?.trim() || !form.padre_apellidos?.trim() || !form.padre_cedula?.trim()) {
          if (Swal) Swal.fire('Atención', 'Por favor completa los campos obligatorios (Nombres, Apellidos y Cédula) del Padre tal como aparecen en la partida de nacimiento (*)', 'warning');
          return false;
        }
      }
      return true;
    }

    if (pasoNum === 5) {
      if (!form.estudiante_condicion_neuro?.trim() || !form.estudiante_condicion_medica?.trim() || !form.estudiante_alergico_medicamentos?.trim()) {
        if (Swal) Swal.fire('Atención', 'Por favor completa todos los campos obligatorios de Salud (*)', 'warning');
        return false;
      }
      if (form.estudiante_condicion_neuro === 'Neurodivergente o Discapacidad') {
        if (!form.estudiante_tipo_condicion?.trim()) {
          if (Swal) Swal.fire('Atención', 'Por favor selecciona el Tipo de Condición / Discapacidad (*)', 'warning');
          return false;
        }
        const esOtraCond = form.estudiante_tipo_condicion.trim().toLowerCase() === 'otro' || form.estudiante_tipo_condicion.trim().toLowerCase() === 'otra';
        if (esOtraCond && !form.estudiante_tipo_condicion_otro?.trim()) {
          if (Swal) Swal.fire('Atención', 'Por favor especifique la Condición / Discapacidad (*)', 'warning');
          return false;
        }
      }
      const esOtraMed = form.estudiante_condicion_medica.trim().toLowerCase() === 'otro' || form.estudiante_condicion_medica.trim().toLowerCase() === 'otra';
      if (esOtraMed && !form.estudiante_condicion_medica_otro?.trim()) {
        if (Swal) Swal.fire('Atención', 'Por favor especifique la Condición Médica (*)', 'warning');
        return false;
      }
      const esOtraAlerg = form.estudiante_alergico_medicamentos.trim().toLowerCase() === 'otro' || form.estudiante_alergico_medicamentos.trim().toLowerCase() === 'otra';
      if (esOtraAlerg && !form.estudiante_alergico_medicamentos_otro?.trim()) {
        if (Swal) Swal.fire('Atención', 'Por favor especifique la Alergia a Medicamentos (*)', 'warning');
        return false;
      }
      return true;
    }

    if (pasoNum === 6) {
      if (form.requiere_transporte === undefined || form.requiere_transporte === null) {
        if (Swal) Swal.fire('Atención', 'Por favor indica si el estudiante requiere transporte escolar (*)', 'warning');
        return false;
      }
      if (form.requiere_transporte === true) {
        if (rutasTransporteDB.length > 0) {
          if (!selectedRutaObj || !selectedParadaObj || !form.ruta_transporte?.trim()) {
            if (Swal) Swal.fire('Atención', 'Por favor selecciona la Ruta y la Parada de Transporte Escolar (*)', 'warning');
            return false;
          }
        } else {
          if (!form.ruta_transporte?.trim()) {
            if (Swal) Swal.fire('Atención', 'Por favor indica la ruta o sector preferido (*)', 'warning');
            return false;
          }
        }
      }
      return true;
    }

    if (pasoNum === 7) {
      if (!documentos.partida) {
        if (Swal) Swal.fire('Atención', 'Falta subir la Copia de la Partida de Nacimiento del Estudiante (*)', 'warning');
        return false;
      }
      const p1 = form.parentesco?.toLowerCase() || '';
      const p2 = form.representante_parentesco?.toLowerCase() || '';
      const isSobrino = p1.includes('sobrino') || p1.includes('sobrina') || p2.includes('sobrino') || p2.includes('sobrina');
      const isNieto = p1.includes('nieto') || p1.includes('nieta') || p2.includes('nieto') || p2.includes('nieta');
      const isHermano = p1.includes('hermano') || p1.includes('hermana') || p2.includes('hermano') || p2.includes('hermana');

      if ((isSobrino || isHermano) && !documentos.partida_trabajador) {
        if (Swal) Swal.fire('Atención', 'Falta la Partida de Nacimiento del Trabajador (*)', 'warning');
        return false;
      }
      if ((isSobrino || isNieto) && !documentos.partida_nexo) {
        if (Swal) Swal.fire('Atención', 'Falta la Partida de Nacimiento de la Madre o Padre (Nexo) (*)', 'warning');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleStepChange = (targetStep: number) => {
    if (targetStep <= step) {
      setStep(targetStep);
      return;
    }
    for (let i = step; i < targetStep; i++) {
      if (!validarPaso(i)) {
        if (i !== step) setStep(i);
        return;
      }
    }
    setStep(targetStep);
  };

  const handleIniciarSolicitud = () => {
    if (!estadoProceso.abierto) {
      if (Swal) Swal.fire('Período Restringido', estadoProceso.motivo, 'warning');
      return;
    }
    if (!validarPaso(1)) return;
    if (!editingId) {
      const codigo = generarCodigoUnico(escCodigo);
      setForm(prev => ({ ...prev, codigo_unico: codigo }));
    }
    setStep(2);
  };

  const handleSubmitFinal = async () => {
    if (!estadoProceso.abierto) {
      if (Swal) Swal.fire('Período Restringido', estadoProceso.motivo, 'warning');
      return;
    }
    for (let i = 1; i <= 7; i++) {
      if (!validarPaso(i)) {
        if (i !== step) setStep(i);
        return;
      }
    }

    try {
      setSubiendoDocs(true);
      
      const subirArchivo = async (file: File | string | null, prefix: string): Promise<string> => {
        if (!file) return '';
        if (typeof file === 'string') return file;
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
      const urlPartidaTrabajador = await subirArchivo(documentos.partida_trabajador, 'partida_trabajador');
      const urlPartidaNexo = await subirArchivo(documentos.partida_nexo, 'partida_nexo');
      const urlCedula = await subirArchivo(documentos.cedula, 'cedula');

      const { 
        pdvsa_localidad_trabajo_otra, 
        estudiante_tipo_condicion_otro, 
        estudiante_condicion_medica_otro, 
        estudiante_alergico_medicamentos_otro, 
        estudiante_con_quien_vive_otro,
        ...formToSubmit 
      } = form;

      const payload: Omit<SolicitudDB, 'id' | 'created_at' | 'updated_at' | 'estudiante_tipo_condicion_otro' | 'estudiante_condicion_medica_otro' | 'estudiante_alergico_medicamentos_otro' | 'estudiante_con_quien_vive_otro'> = {
        ...formToSubmit,
        estudiante_con_quien_vive: Array.isArray(form.estudiante_con_quien_vive)
          ? form.estudiante_con_quien_vive.map(item => item === 'Otros' && estudiante_con_quien_vive_otro ? `Otros (${estudiante_con_quien_vive_otro})` : item).join(', ')
          : form.estudiante_con_quien_vive,
        representante_parentesco: form.representante_parentesco || form.parentesco || 'Representante Legal',
        pdvsa_localidad_trabajo: form.pdvsa_localidad_trabajo?.trim().toLowerCase() === 'otra' || form.pdvsa_localidad_trabajo?.trim().toLowerCase() === 'otro' ? pdvsa_localidad_trabajo_otra || '' : form.pdvsa_localidad_trabajo,
        estudiante_tipo_condicion: form.estudiante_tipo_condicion?.trim().toLowerCase() === 'otro' || form.estudiante_tipo_condicion?.trim().toLowerCase() === 'otra' ? estudiante_tipo_condicion_otro || '' : form.estudiante_tipo_condicion,
        estudiante_condicion_medica: form.estudiante_condicion_medica?.trim().toLowerCase() === 'otro' || form.estudiante_condicion_medica?.trim().toLowerCase() === 'otra' ? estudiante_condicion_medica_otro || '' : form.estudiante_condicion_medica,
        estudiante_alergico_medicamentos: form.estudiante_alergico_medicamentos?.trim().toLowerCase() === 'otro' || form.estudiante_alergico_medicamentos?.trim().toLowerCase() === 'otra' ? estudiante_alergico_medicamentos_otro || '' : form.estudiante_alergico_medicamentos,
        doc_ficha: urlFicha,
        doc_foto_estudiante: urlFoto,
        doc_partida_nacimiento: urlPartida,
        doc_partida_trabajador: urlPartidaTrabajador,
        doc_partida_nexo: urlPartidaNexo,
        doc_cedula_estudiante: urlCedula,
        codigo_escuela: escCodigo,
        estado: 'Pendiente',
        observaciones: '',
        creado_por: user?.cedula || form.representante_cedula,
      };

      let finalData;
      if (editingId) {
        const { data, error } = await supabase.from('solicitud_cupos').update(payload).eq('id', editingId).select().single();
        if (error) throw error;
        finalData = data;
        await auditar('Solicitud de Cupos', 'Editar Solicitud', `Editada solicitud ${form.codigo_unico} con documentos`);
        setEditingId(null);
      } else {
        const { data, error } = await supabase.from('solicitud_cupos').upsert([payload], { onConflict: 'codigo_unico' }).select().single();
        if (error) throw error;
        finalData = data;
        await auditar('Solicitud de Cupos', 'Crear Solicitud', `Nueva solicitud ${form.codigo_unico} con documentos`);
      }
      
      // Refrescar el listado local de solicitudes con la información actualizada
      await cargarDatos();

      // Limpiar el autoguardado tras el envío exitoso
      if (user) {
        localStorage.removeItem(`sigae_borrador_cupo_${escCodigo}_${user.cedula}`);
        localStorage.removeItem(`sigae_borrador_step_${escCodigo}_${user.cedula}`);
      }
      setSolicitudGuardada(finalData as SolicitudDB);
      setStep(8);
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
    setEditingId(null);
    setSelectedRutaObj(null);
    setSelectedParadaObj(null);
    setDocumentos({ ficha: null, foto: null, partida: null, cedula: null, partida_trabajador: null, partida_nexo: null });
    setStep(1);
  };


  const handleEditarSolicitud = (sol: SolicitudDB) => {
    setEditingId(sol.id || null);
    
    // Mapear de base de datos a formulario
    const newData: Partial<SolicitudForm> = {
      acepta_terminos: sol.acepta_terminos,
      estudiante_nombres: sol.estudiante_nombres,
      estudiante_apellidos: sol.estudiante_apellidos,
      estudiante_cedula: sol.estudiante_cedula || '',
      estudiante_fecha_nacimiento: sol.estudiante_fecha_nacimiento === '1900-01-01' ? '' : sol.estudiante_fecha_nacimiento,
      estudiante_sexo: sol.estudiante_sexo,
      estudiante_orden_nacimiento: sol.estudiante_orden_nacimiento || '',
      estudiante_condicion_neuro: sol.estudiante_condicion_neuro || 'Neurotípico',
      estudiante_tipo_condicion: sol.estudiante_tipo_condicion || '',
      estudiante_informe_neuro: sol.estudiante_informe_neuro || false,
      estudiante_certificado_conapdis: sol.estudiante_certificado_conapdis || false,
      estudiante_condicion_medica: sol.estudiante_condicion_medica || 'Ninguna',
      estudiante_alergico_medicamentos: sol.estudiante_alergico_medicamentos || 'Ninguna',
      grado_solicitado: sol.grado_solicitado,
      parentesco: sol.parentesco,
      estudiante_con_quien_vive: Array.isArray((sol as any).estudiante_con_quien_vive)
        ? (sol as any).estudiante_con_quien_vive
        : typeof (sol as any).estudiante_con_quien_vive === 'string'
        ? (sol as any).estudiante_con_quien_vive.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
      estudiante_con_quien_vive_otro: (sol as any).estudiante_con_quien_vive_otro || '',
      plantel_procedencia: sol.plantel_procedencia || '',
      direccion_habitacion: sol.direccion_habitacion || '',
      estado_habitacion: sol.estado_habitacion || '',
      municipio_habitacion: sol.municipio_habitacion || '',
      parroquia_habitacion: sol.parroquia_habitacion || '',
      tiene_otros_inscritos: sol.tiene_otros_inscritos || false,
      representante_nombres: sol.representante_nombres,
      representante_apellidos: sol.representante_apellidos,
      representante_cedula: sol.representante_cedula,
      representante_telefono: sol.representante_telefono,
      representante_telefono2: sol.representante_telefono2 || '',
      representante_email: sol.representante_email,
      representante_parentesco: sol.representante_parentesco,
      representante_trabaja_pdvsa: sol.representante_trabaja_pdvsa,
      pdvsa_condicion_laboral: sol.pdvsa_condicion_laboral || '',
      pdvsa_tipo_nomina: sol.pdvsa_tipo_nomina || '',
      pdvsa_negocio_filial: sol.pdvsa_negocio_filial || '',
      pdvsa_gerencia: sol.pdvsa_gerencia || '',
      pdvsa_email_empresa: sol.pdvsa_email_empresa || '',
      pdvsa_localidad_trabajo: sol.pdvsa_localidad_trabajo || '',
      madre_vive: sol.madre_vive || 'Sí',
      madre_es_representante: sol.madre_es_representante || false,
      madre_nombres: sol.madre_nombres || '',
      madre_apellidos: sol.madre_apellidos || '',
      madre_cedula: sol.madre_cedula || '',
      madre_fecha_nacimiento: sol.madre_fecha_nacimiento || '',
      madre_email: sol.madre_email || '',
      madre_telefono: sol.madre_telefono || '',
      madre_trabaja_pdvsa: sol.madre_trabaja_pdvsa || false,
      padre_vive: sol.padre_vive || 'Sí',
      padre_es_representante: sol.padre_es_representante || false,
      padre_nombres: sol.padre_nombres || '',
      padre_apellidos: sol.padre_apellidos || '',
      padre_cedula: sol.padre_cedula || '',
      padre_fecha_nacimiento: sol.padre_fecha_nacimiento || '',
      padre_email: sol.padre_email || '',
      padre_telefono: sol.padre_telefono || '',
      padre_trabaja_pdvsa: sol.padre_trabaja_pdvsa || false,
      requiere_transporte: sol.requiere_transporte || false,
      ruta_transporte: sol.ruta_transporte || '',
      doc_ficha: sol.doc_ficha || '',
      doc_foto_estudiante: sol.doc_foto_estudiante || '',
      doc_partida_nacimiento: sol.doc_partida_nacimiento || '',
      doc_cedula_estudiante: sol.doc_cedula_estudiante || '',
      codigo_unico: sol.codigo_unico || '',
    };
    
    setForm(prev => ({ ...prev, ...newData }));
    setDocumentos({
      ficha: sol.doc_ficha || null,
      foto: sol.doc_foto_estudiante || null,
      partida: sol.doc_partida_nacimiento || null,
      cedula: sol.doc_cedula_estudiante || null,
      partida_trabajador: sol.doc_partida_trabajador || null,
      partida_nexo: sol.doc_partida_nexo || null,
    });

    if (sol.requiere_transporte && sol.ruta_transporte) {
      const matchingRuta = rutasTransporteDB.find(r => sol.ruta_transporte.startsWith(r.nombre));
      if (matchingRuta) {
        setSelectedRutaObj(matchingRuta);
        const parts = sol.ruta_transporte.split(' - Parada: ');
        const paradaName = parts[1];
        if (paradaName) {
          const matchingParada = paradasTransporteDB.find(p => p.nombre_parada === paradaName);
          if (matchingParada) {
            setSelectedParadaObj(matchingParada);
          }
        }
      }
    } else {
      setSelectedRutaObj(null);
      setSelectedParadaObj(null);
    }
    
    setActiveTab('nueva_solicitud');
    setStep(1);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const obtenerImagenBase64 = (url: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          try {
            resolve(canvas.toDataURL('image/png'));
            return;
          } catch (e) {
            console.error('Base64 conversion failed:', e);
          }
        }
        resolve(url);
      };
      img.onerror = () => {
        resolve(url);
      };
      img.src = url;
    });
  };

  const handleDescargarSoporte = async (modo: 'descargar' | 'whatsapp') => {
    if (!solicitudGuardada) return;
    const sol = solicitudGuardada;
    
    if (Swal) {
      Swal.fire({
        title: modo === 'descargar' ? 'Generando Soporte...' : 'Preparando Mensaje...',
        html: '<div class="spinner-border text-success" role="status"></div><p class="mt-2 small text-muted">Construyendo documento e imagen de verificación...</p>',
        allowOutsideClick: false,
        showConfirmButton: false,
      });
    }

    try {
      // Pre-cargar y convertir imágenes críticas a base64 para evitar problemas de CORS y carga a destiempo
      const qrRawUrl = getQrUrl(sol.codigo_unico || '');
      const [base64Qr, base64LogoEscuela, base64Mppe] = await Promise.all([
        obtenerImagenBase64(qrRawUrl),
        obtenerImagenBase64(`/assets/img/logo_${escCodigo}.png`),
        obtenerImagenBase64('/assets/img/logoMPPE.png')
      ]);

      const clon = document.createElement('div');
      clon.style.width = '600px';
      clon.style.position = 'fixed';
      clon.style.left = '-9999px';
      clon.style.top = '0';
      clon.style.fontFamily = "'Inter', 'Segoe UI', Roboto, sans-serif";
      clon.style.padding = '25px';
      clon.style.background = '#ffffff';

      const fechaHoy = new Date().toLocaleDateString('es-VE', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      const htmlImagen = `
        <div style="border: 2px solid #e2e8f0; border-radius: 20px; padding: 25px; background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);">
          <div style="margin-bottom: 20px; border-radius: 4px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="height: 6px; background-color: #facc15;"></div>
            <div style="height: 8px; background-color: #2563eb; display: flex; justify-content: center; align-items: center; gap: 3px; color: #ffffff; font-size: 7px; line-height: 1; font-family: Arial, sans-serif;">
              <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
            </div>
            <div style="height: 6px; background-color: #dc2626;"></div>
          </div>
          
          <div style="display: flex; align-items: center; gap: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px;">
            <img src="${base64LogoEscuela}" style="height: 60px; width: auto; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.08));" />
            <div style="flex: 1;">
              <h4 style="margin: 0; color: #16a34a; font-weight: 800; font-size: 14.5px; text-transform: uppercase; white-space: nowrap; letter-spacing: -0.2px;">Solicitud de Cupos — Año Escolar ${new Date().getFullYear()} - ${new Date().getFullYear() + 1}</h4>
              <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">Sistema Integral de Gestión y Administración Escolar</p>
              <p style="margin: 2px 0 0 0; font-size: 13px; font-weight: 700; color: #1e3a8a;">${escNombre}</p>
            </div>
          </div>

          <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            <div style="flex: 0 0 170px; text-align: center; border: 1.5px dashed #86efac; border-radius: 16px; padding: 10px; background: #ffffff;">
              <img src="${base64Qr}" alt="QR" style="width: 150px; height: 150px; border-radius: 8px;" />
              <div style="margin-top: 8px; font-family: monospace; font-size: 12px; font-weight: bold; color: #1e293b; letter-spacing: 1px;">
                ${sol.codigo_unico}
              </div>
            </div>

            <div style="flex: 1; font-size: 13px; color: #475569;">
              <h5 style="margin: 0 0 8px 0; color: #0f172a; font-size: 14px; font-weight: 700; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px;">
                👦 Datos del Estudiante
              </h5>
              <div style="margin-bottom: 10px;">
                <b>Nombre Completo:</b><br/>
                <span style="color: #0f172a; font-weight: 600; font-size: 14px;">${sol.estudiante_nombres} ${sol.estudiante_apellidos}</span>
              </div>
              <div style="margin-bottom: 10px;">
                <b>Cédula / Identificación:</b><br/>
                <span style="color: #0f172a; font-weight: 600;">${sol.estudiante_cedula || 'No posee'}</span>
              </div>
              <div style="display: flex; gap: 15px;">
                <div>
                  <b>Grado Solicitado:</b><br/>
                  <span style="color: #166534; font-weight: 700; background: #dcfce7; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${sol.grado_solicitado}</span>
                </div>
                <div>
                  <b>F. Nacimiento:</b><br/>
                  <span style="color: #0f172a; font-weight: 600;">${sol.estudiante_fecha_nacimiento}</span>
                </div>
              </div>
            </div>
          </div>

          <div style="background: #ffffff; border: 1.5px solid #f1f5f9; border-radius: 14px; padding: 15px; margin-bottom: 20px; font-size: 13px; color: #475569;">
            <h5 style="margin: 0 0 10px 0; color: #0f172a; font-size: 13px; font-weight: 700; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px;">
              👤 Datos del Representante y Centro
            </h5>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div>
                <b>Representante:</b><br/>
                <span style="color: #0f172a; font-weight: 600;">${sol.representante_nombres} ${sol.representante_apellidos}</span>
              </div>
              <div>
                <b>Cédula Representante:</b><br/>
                <span style="color: #0f172a; font-weight: 600;">${sol.representante_cedula}</span>
              </div>
              <div>
                <b>Teléfono / Correo Rep.:</b><br/>
                <span style="color: #0f172a; font-weight: 600;">${sol.representante_telefono} ${sol.representante_email ? `(${sol.representante_email})` : ''}</span>
              </div>
              <div>
                <b>Plantel Solicitado:</b><br/>
                <span style="color: #0f172a; font-weight: 600;">${escNombre}</span>
              </div>
              ${sol.madre_vive !== 'No' && (sol.madre_telefono || sol.madre_email) ? `
                <div style="grid-column: span 2; margin-top: 3px; border-top: 1px dashed #e2e8f0; pt-1;">
                  <b>Madre (${sol.madre_nombres || ''} ${sol.madre_apellidos || ''}):</b><br/>
                  <span style="color: #334155; font-weight: 600; font-size: 11px;">📞 ${sol.madre_telefono || 'Sin tel.'} | ✉️ ${sol.madre_email || 'Sin correo'}</span>
                </div>
              ` : ''}
              ${sol.estudiante_reconocido_por_padre !== 'No' && sol.padre_vive !== 'No' && (sol.padre_telefono || sol.padre_email) ? `
                <div style="grid-column: span 2; margin-top: 3px; border-top: 1px dashed #e2e8f0; pt-1;">
                  <b>Padre (${sol.padre_nombres || ''} ${sol.padre_apellidos || ''}):</b><br/>
                  <span style="color: #334155; font-weight: 600; font-size: 11px;">📞 ${sol.padre_telefono || 'Sin tel.'} | ✉️ ${sol.padre_email || 'Sin correo'}</span>
                </div>
              ` : ''}
              ${sol.requiere_transporte ? `
                <div style="grid-column: span 2; margin-top: 5px;">
                  <b>Transporte Escolar:</b><br/>
                  <span style="color: #1e3a8a; font-weight: 700; background: #dbeafe; padding: 2px 8px; border-radius: 6px; font-size: 11px;">🚍 ${sol.ruta_transporte}</span>
                </div>
              ` : ''}
            </div>
          </div>

          <div style="background: #fef9c3; border: 1.5px solid #fde047; border-radius: 12px; padding: 12px; margin-bottom: 15px; font-size: 11px; color: #713f12; line-height: 1.4;">
            <b>Nota Institucional:</b> La recepción de esta solicitud de cupo está sujeta a revisión y no garantiza la asignación inmediata. <b>Los cupos se otorgarán o asignarán según la disponibilidad del grado y los niveles de prioridad establecidos en la convención colectiva</b>.
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1.5px solid #e2e8f0; padding-top: 12px; margin-top: 15px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="${base64Mppe}" style="height: 22px; width: auto;" />
            </div>
            <div style="text-align: right; font-size: 9px; color: #94a3b8; font-weight: 600; line-height: 1.2;">
              Generado: ${fechaHoy}<br/>
              SIGAE - Control de Solicitudes
            </div>
          </div>
        </div>
      `;

      clon.innerHTML = htmlImagen;
      document.body.appendChild(clon);
      
      await new Promise(res => setTimeout(res, 500));

      const canvas = await html2canvas(clon, { scale: 2, backgroundColor: '#ffffff', logging: false, useCORS: true });
      document.body.removeChild(clon);

      const anoActual = new Date().getFullYear();
      const anoProximo = anoActual + 1;
      const nombreArchivo = `Solicitud_de_Cupos_Año_Escolar_${anoActual}-${anoProximo}_${sol.codigo_unico}.png`;

      const textoMensaje = `*SIGAE - Solicitud de Cupos Año Escolar ${anoActual} - ${anoProximo}*\n\n` +
        `Estimad@ *${sol.representante_nombres} ${sol.representante_apellidos}*,\n` +
        `Su solicitud de cupo para el estudiante *${sol.estudiante_nombres} ${sol.estudiante_apellidos}* ha sido registrada con éxito.\n\n` +
        `• *Código Único:* ${sol.codigo_unico}\n` +
        `• *Grado/Año Solicitado:* ${sol.grado_solicitado}\n` +
        `• *Plantel:* ${escNombre}\n` +
        `• *Estado:* Pendiente\n` +
        `${sol.requiere_transporte ? `• *Transporte Escolar:* ${sol.ruta_transporte}\n` : ''}\n` +
        `_Nota: Los cupos se otorgarán o asignarán según la disponibilidad del grado y los niveles de prioridad establecidos en la convención colectiva._\n\n` +
        `Puede realizar el seguimiento de su trámite ingresando a la sección "Mis Solicitudes" en el sistema SIGAE.`;

      if (modo === 'descargar') {
        const urlImagen = canvas.toDataURL("image/png");
        const a = document.createElement('a');
        a.href = urlImagen;
        a.download = nombreArchivo;
        a.click();
        if (Swal) {
          Swal.fire({
            title: '¡Comprobante Descargado!',
            text: `El soporte "${nombreArchivo}" ha sido guardado en tu dispositivo.`,
            icon: 'success',
            confirmButtonColor: '#16a34a'
          });
        }
      } else {
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], nombreArchivo, { type: "image/png" });

          // Si es en móvil, intentamos usar el Share API nativo para enviar la imagen y texto directo a WhatsApp
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: `Solicitud de Cupos Año Escolar ${anoActual} - ${anoProximo}`,
                text: textoMensaje
              });
              if (Swal) Swal.close();
              return;
            } catch (shareErr) {
              console.log('Web Share failed, fall-backing to clipboard...', shareErr);
            }
          }
          
          if (navigator.clipboard && navigator.clipboard.write) {
            try {
              const item = new ClipboardItem({ "image/png": blob });
              await navigator.clipboard.write([item]);
            } catch (e) {
              console.error("Clipboard write error:", e);
            }
          }

          if (Swal) {
            Swal.close();
            Swal.fire({
              title: '¡Soporte Preparado!',
              html: `
                <p class="small text-muted mb-2">La imagen del comprobante se copiará automáticamente al portapapeles al presionar "Abrir WhatsApp".</p>
                <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; color: #166534; padding: 10px; border-radius: 8px; font-size: 13px; text-align: left;">
                  <strong>Para enviar en WhatsApp:</strong> Selecciona el chat, presiona <strong>Ctrl + V</strong> para pegar la imagen (el texto se cargará automáticamente).
                </div>
              `,
              icon: 'success',
              showCancelButton: true,
              confirmButtonText: '<i class="bi bi-whatsapp me-1"></i> Abrir WhatsApp',
              cancelButtonText: 'Cancelar',
              confirmButtonColor: '#25D366',
            }).then((res2: any) => {
              if (res2.isConfirmed) {
                window.open(`whatsapp://send?text=${encodeURIComponent(textoMensaje)}`, '_self');
              }
            });
          }
        }, 'image/png');
      }
    } catch (error) {
      console.error('Error generating image support:', error);
      if (Swal) Swal.fire('Error', 'No se pudo generar la imagen del soporte.', 'error');
    }
  };

  const handleAccionSoporteCard = async (sol: SolicitudDB, modo: 'descargar' | 'whatsapp') => {
    if (sol.estado === 'Borrador') {
      if (Swal) {
        Swal.fire({
          title: 'Solicitud Incompleta',
          html: `<p>Esta solicitud aún está en estado <strong>Borrador</strong> y no ha sido enviada al plantel.</p><p class="text-muted small">Completa todos los pasos del formulario y presiona <strong>"Finalizar y Enviar"</strong> para poder descargar el soporte físico con código QR.</p>`,
          icon: 'warning',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#f59e0b',
        });
      }
      return;
    }
    setSolicitudGuardada(sol);
    setTimeout(() => {
      handleDescargarSoporte(modo);
    }, 100);
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

  const handleEliminarMasivo = async () => {
    if (selectedIds.length === 0 || !Swal) return;
    Swal.fire({
      title: '¿Eliminar solicitudes seleccionadas?',
      text: `Estás a punto de eliminar de forma definitiva ${selectedIds.length} solicitud(es) de cupo. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: `<i class="bi bi-trash3-fill me-1"></i> Sí, eliminar (${selectedIds.length})`,
      cancelButtonText: 'Cancelar',
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase.from('solicitud_cupos').delete().in('id', selectedIds);
          if (error) throw error;
          await auditar('Solicitud de Cupos', 'Eliminar Masivo', `Se eliminaron ${selectedIds.length} solicitudes de cupo en bloque.`);
          Swal.fire('¡Eliminadas!', `Se han eliminado ${selectedIds.length} solicitud(es) correctamente.`, 'success');
          setSelectedIds([]);
          cargarDatos();
        } catch (e: any) {
          Swal.fire('Error', 'No se pudieron eliminar las solicitudes: ' + e.message, 'error');
          setLoading(false);
        }
      }
    });
  };

  const filteredSolicitudes = solicitudes.filter(sol => {
    const matchesEstado = filterEstado === 'TODOS' || sol.estado === filterEstado;
    const s = `${sol.estudiante_nombres} ${sol.estudiante_apellidos} ${sol.representante_nombres} ${sol.representante_apellidos} ${sol.representante_cedula} ${sol.codigo_unico || ''}`.toLowerCase();
    return matchesEstado && s.includes(searchQuery.toLowerCase());
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = filteredSolicitudes.map(s => s.id).filter((id): id is string | number => id !== undefined);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id?: string | number) => {
    if (id === undefined) return;
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

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
    { num: 4, label: 'Madre y Padre', icon: 'bi-people-fill' },
    { num: 5, label: 'Salud', icon: 'bi-heart-pulse-fill' },
    { num: 6, label: 'Transporte Escolar', icon: 'bi-bus-front' },
    { num: 7, label: 'Documentos', icon: 'bi-file-earmark-arrow-up' },
    { num: 8, label: 'Confirmación', icon: 'bi-patch-check' },
  ];

  const renderStepper = () => (
    <div className="d-flex align-items-center justify-content-between mb-4 px-2" style={{ overflowX: 'auto' }}>
      {STEPS.map((s, idx) => (
        <React.Fragment key={s.num}>
          <div className="d-flex flex-column align-items-center" style={{ minWidth: 70 }}>
            <div
              className={`rounded-circle d-flex align-items-center justify-content-center fw-bold mb-1 ${step === s.num ? 'bg-success text-white shadow' : step > s.num ? 'bg-success bg-opacity-25 text-success' : 'bg-light text-muted border'}`}
              style={{ width: 44, height: 44, fontSize: 18, transition: 'all 0.3s', cursor: 'pointer' }}
              onClick={() => handleStepChange(s.num)}
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
        <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm"
          style={{ width: 72, height: 72, border: '2px solid rgba(22,163,74,0.2)' }}>
          <i className="bi bi-bank2 text-success" style={{ fontSize: 32 }}></i>
        </div>
        <h4 className="fw-bold text-dark mb-1">Proceso de Admisión y Solicitud de Cupos</h4>
        <p className="text-muted small mb-0"><strong>{escNombre}</strong> — Año Escolar {new Date().getFullYear()} – {new Date().getFullYear() + 1}</p>
      </div>

      <div className="bg-light rounded-4 p-4 border mb-4 shadow-sm" style={{ maxHeight: 380, overflowY: 'auto', fontSize: '0.9rem', lineHeight: 1.7 }}>
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3 flex-wrap gap-2">
          <div>
            <h6 className="fw-bold text-success mb-0"><i className="bi bi-mortarboard-fill me-2"></i>{escNombre}</h6>
            <small className="text-muted">Solicitud en Línea de Cupo Escolar</small>
          </div>
          <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle px-3 py-2">
            Período Escolar {new Date().getFullYear()} - {new Date().getFullYear() + 1}
          </span>
        </div>

        <p className="mb-2"><strong>Estimad@ Padre, Madre o Representante Legal:</strong></p>
        <p className="mb-3">¡Le damos una cordial <strong>Bienvenid@</strong> al portal digital de admisiones de <strong>{escNombre}</strong>! A través de este módulo podrá solicitar el cupo escolar para su hij@ o representad@ de forma sencilla, rápida y segura.</p>
        
        <div className="alert alert-info border border-info-subtle rounded-3 p-3 mb-4 d-flex gap-2 align-items-start bg-white shadow-sm">
          <i className="bi bi-info-circle-fill text-info fs-5 flex-shrink-0 mt-1"></i>
          <div className="small">
            <strong>¿Qué necesita antes de empezar?</strong> Asegúrese de tener a mano los datos personales del estudiante y los padres, información laboral y médica, así como los documentos en digital listos para subir (Cédula, Partida de Nacimiento, Foto Escolar y Constancia o Ficha Laboral si aplica).
          </div>
        </div>

        <p className="fw-bold mb-2 text-dark"><i className="bi bi-shield-lock-fill me-2 text-success"></i> Indicaciones y Normas de la Escuela:</p>
        <ul className="mb-3 ps-3">
          <li className="mb-2"><strong>Información Verdadera:</strong> Por favor, asegúrese de que todos los datos que ingrese sean reales y estén actualizados. Si la escuela detecta información falsa o errónea, la solicitud podrá ser anulada.</li>
          <li className="mb-2"><strong>Protección de sus Datos:</strong> Toda la información personal, familiar y médica que comparta será cuidada con total confidencialidad y utilizada únicamente para el proceso escolar y administrativo del plantel.</li>
          <li className="mb-2"><strong>Comprobante de Solicitud:</strong> Al terminar los 7 pasos y adjuntar los documentos en el último paso, el sistema le generará un <strong>Comprobante en PDF con un Código Único y QR</strong> para que pueda revisar en cualquier momento cómo va el trámite.</li>
          <li className="mb-2"><strong>Asignación de Cupos:</strong> Llenar y enviar esta solicitud es el primer paso del proceso y <strong>no significa que el estudiante ya esté inscrito automáticamente</strong>. Los cupos se otorgarán o asignarán según la disponibilidad del grado y los niveles de prioridad establecidos en la convención colectiva.</li>
        </ul>
        <p className="mb-0 text-muted small border-top pt-3"><i className="bi bi-check2-circle me-1 text-success fw-bold"></i> Al marcar la casilla inferior, usted confirma que ha leído y está de acuerdo con estas indicaciones de la institución.</p>
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
            <div className={`fw-bold ${form.acepta_terminos ? 'text-success' : 'text-dark'}`}>Acepto los términos e indicaciones</div>
            <div className="text-muted small">Confirmo que los datos que voy a registrar son reales y están actualizados.</div>
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

    const getExpectedAgeForGrade = (grado: string) => {
      const ageMap: Record<string, number> = {
        'II Grupo': 4,
        'III Grupo': 5,
        '1er Grado': 6,
        '2do Grado': 7,
        '3er Grado': 8,
        '4to Grado': 9,
        '5to Grado': 10,
        '6to Grado': 11,
        '1er Año': 12,
        '2do Año': 13,
        '3er Año': 14,
        '4to Año': 15,
        '5to Año': 16
      };
      return ageMap[grado] || null;
    };

    let ageWarning = '';
    if (form.estudiante_fecha_nacimiento && form.grado_solicitado) {
      const expectedAge = getExpectedAgeForGrade(form.grado_solicitado);
      if (expectedAge !== null) {
        const currentYear = new Date().getFullYear();
        const birthYear = new Date(form.estudiante_fecha_nacimiento).getFullYear();
        const ageInCurrentYear = currentYear - birthYear;
        if (ageInCurrentYear !== expectedAge) {
          ageWarning = `Atención: Para ${form.grado_solicitado}, se sugiere cumplir ${expectedAge} años en el ${currentYear} (la fecha indica ${ageInCurrentYear} años en este año).`;
        }
      }
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
          {ageWarning && (
            <div className="mt-1 small text-warning fw-bold border border-warning rounded p-1 bg-warning bg-opacity-10" style={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
              <i className="bi bi-exclamation-triangle-fill me-1"></i>
              {ageWarning}
            </div>
          )}
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

        {/* ¿Con quién vive el estudiante? (Selector múltiple) */}
        <div className="col-12 mt-3">
          <label className="form-label fw-semibold d-block">
            ¿Con quién vive el estudiante? <span className="text-danger">*</span>
            <span className="text-muted fw-normal small ms-2">(Seleccione todas las opciones que apliquen)</span>
          </label>
          <div className="d-flex flex-wrap gap-2 mt-1">
            {['Papá', 'Mamá', 'Hermanos', 'Abuelos', 'Tíos', 'Otros'].map(opcion => {
              const currentArr = Array.isArray(form.estudiante_con_quien_vive)
                ? form.estudiante_con_quien_vive
                : typeof form.estudiante_con_quien_vive === 'string' && form.estudiante_con_quien_vive
                ? form.estudiante_con_quien_vive.split(',').map(s => s.trim())
                : [];
              const isSelected = currentArr.includes(opcion);
              return (
                <button
                  key={opcion}
                  type="button"
                  className={`btn rounded-pill px-4 fw-semibold transition-all ${
                    isSelected
                      ? 'btn-success shadow-sm'
                      : 'btn-outline-secondary bg-white text-dark'
                  }`}
                  onClick={() => {
                    const newArr = isSelected
                      ? currentArr.filter(item => item !== opcion)
                      : [...currentArr, opcion];
                    updateForm('estudiante_con_quien_vive', newArr);
                  }}
                >
                  <i className={`bi ${isSelected ? 'bi-check-circle-fill' : 'bi-circle'} me-2`}></i>
                  {opcion}
                </button>
              );
            })}
          </div>
          {(Array.isArray(form.estudiante_con_quien_vive) ? form.estudiante_con_quien_vive.includes('Otros') : typeof form.estudiante_con_quien_vive === 'string' && form.estudiante_con_quien_vive.includes('Otros')) && (
            <div className="mt-2 animate__animated animate__fadeIn col-md-6">
              <input
                type="text"
                className="form-control input-moderno"
                placeholder="Especifique con quién más vive el estudiante..."
                value={form.estudiante_con_quien_vive_otro || ''}
                onChange={(e) => updateForm('estudiante_con_quien_vive_otro', e.target.value)}
                required
              />
            </div>
          )}
        </div>

        {/* ¿El estudiante fue reconocido por el padre? */}
        <div className="col-12 mt-3">
          <label className="form-label fw-semibold d-block">
            ¿El estudiante fue reconocido por el padre? <span className="text-danger">*</span>
          </label>
          <div className="d-flex flex-wrap gap-2 mt-1">
            {['Sí', 'No'].map(opcion => (
              <button
                key={opcion}
                type="button"
                className={`btn rounded-pill px-4 fw-semibold transition-all ${
                  form.estudiante_reconocido_por_padre === opcion
                    ? 'btn-success shadow-sm'
                    : 'btn-outline-secondary bg-white text-dark'
                }`}
                onClick={() => updateForm('estudiante_reconocido_por_padre', opcion)}
              >
                <i className={`bi ${form.estudiante_reconocido_por_padre === opcion ? 'bi-check-circle-fill' : 'bi-circle'} me-2`}></i>
                {opcion === 'Sí' ? 'Sí (Está registrado en la Partida de Nacimiento)' : 'No (Reconocido únicamente por la Madre)'}
              </button>
            ))}
          </div>
          <div className="form-text">Si selecciona "No", en el Paso 4 solo se solicitarán los datos biológicos de la Madre.</div>
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
          onClick={() => handleStepChange(4)}>
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

        <div className="col-md-6">
          <label className="form-label fw-semibold">Teléfono Principal <span className="text-danger">*</span></label>
          <input type="text" className="form-control input-moderno" placeholder="Ej. 0291-6518384 ó 0416-6263890"
            value={form.representante_telefono} onChange={(e) => updateForm('representante_telefono', e.target.value)} required />
        </div>

        <div className="col-md-6">
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

      </div>

      <div className="d-flex justify-content-between mt-4 pt-3 border-top">
        <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(1)}>
          <i className="bi bi-arrow-left me-1"></i> Anterior
        </button>
        <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto"
          onClick={() => handleStepChange(3)}>
          Continuar <i className="bi bi-arrow-right ms-1"></i>
        </button>
      </div>
    </div>
  );

  // ─── PASO 4: DATOS DE LA MADRE Y DEL PADRE ───────────────────────────────────
  const renderStep4 = () => {
    const copiarDeRepresentanteMadre = (checked: boolean) => {
      updateForm('madre_es_representante', checked);
      if (checked) {
        setForm(prev => ({
          ...prev,
          madre_es_representante: true,
          madre_nombres: prev.representante_nombres || '',
          madre_apellidos: prev.representante_apellidos || '',
          madre_cedula: prev.representante_cedula || '',
          madre_email: prev.representante_email || '',
          madre_telefono: prev.representante_telefono || '',
          madre_trabaja_pdvsa: prev.representante_trabaja_pdvsa === 'Sí',
        }));
        if (Swal) Swal.fire({
          icon: 'success',
          title: 'Datos Copiados',
          text: 'Se autocompletaron los datos de la madre con la información de la Representante Legal.',
          timer: 2000,
          showConfirmButton: false
        });
      }
    };

    const copiarDeRepresentantePadre = (checked: boolean) => {
      updateForm('padre_es_representante', checked);
      if (checked) {
        setForm(prev => ({
          ...prev,
          padre_es_representante: true,
          padre_nombres: prev.representante_nombres || '',
          padre_apellidos: prev.representante_apellidos || '',
          padre_cedula: prev.representante_cedula || '',
          padre_email: prev.representante_email || '',
          padre_telefono: prev.representante_telefono || '',
          padre_trabaja_pdvsa: prev.representante_trabaja_pdvsa === 'Sí',
        }));
        if (Swal) Swal.fire({
          icon: 'success',
          title: 'Datos Copiados',
          text: 'Se autocompletaron los datos del padre con la información del Representante Legal.',
          timer: 2000,
          showConfirmButton: false
        });
      }
    };

    return (
      <div className="animate__animated animate__fadeIn">
        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
          <i className="bi bi-people-fill text-success fs-4"></i>
          <div>
            <h6 className="fw-bold text-dark mb-0">Datos Biológicos de la Madre y el Padre</h6>
            <span className="text-muted small">Información de los progenitores o padres del estudiante</span>
          </div>
        </div>

        {/* ── SECCIÓN MADRE ── */}
        <div className="card shadow-sm border-0 bg-light rounded-4 mb-4 p-3 p-md-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary-subtle gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-danger-subtle text-danger rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                <i className="bi bi-gender-female fs-5"></i>
              </span>
              <h6 className="fw-bold text-dark mb-0 fs-6">1. Información de la Madre</h6>
            </div>
            
            <div className="d-flex align-items-center gap-2 bg-white px-3 py-1 rounded-pill border shadow-sm">
              <span className="small fw-semibold text-muted">¿Se encuentra con vida?</span>
              <div className="btn-group btn-group-sm" role="group">
                <button type="button"
                  className={`btn rounded-pill px-3 fw-bold ${form.madre_vive !== 'No' ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={() => updateForm('madre_vive', 'Sí')}>
                  Sí
                </button>
                <button type="button"
                  className={`btn rounded-pill px-3 fw-bold ${form.madre_vive === 'No' ? 'btn-danger' : 'btn-outline-secondary'}`}
                  onClick={() => updateForm('madre_vive', 'No')}>
                  No
                </button>
              </div>
            </div>
          </div>

          {form.madre_vive === 'No' && (
            <div className="alert alert-warning border-0 d-flex align-items-center gap-2 mb-3 py-2 rounded-3 small">
              <i className="bi bi-info-circle-fill fs-5 text-warning"></i>
              <span>Has indicado que la madre ha fallecido. Recuerda que debes ingresar sus Nombres, Apellidos y Cédula tal como aparecen en la partida de nacimiento del estudiante.</span>
            </div>
          )}

          {form.madre_vive !== 'No' && (
            <div className="bg-white p-3 rounded-3 border mb-3 shadow-sm d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-lightning-charge-fill text-warning fs-5"></i>
                <span className="small fw-semibold text-dark">¿La madre es la misma Representante Legal registrada en el Paso 2?</span>
              </div>
              <div className="form-check form-switch m-0 fs-5">
                <input className="form-check-input hover-efecto" type="checkbox" role="switch"
                  id="madreEsRepSwitch"
                  checked={!!form.madre_es_representante}
                  onChange={(e) => copiarDeRepresentanteMadre(e.target.checked)} />
                <label className="form-check-label fs-6 small fw-bold text-success ms-1" htmlFor="madreEsRepSwitch">
                  {form.madre_es_representante ? 'Sí, autocompletar' : 'No'}
                </label>
              </div>
            </div>
          )}

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold small">Nombres de la Madre <span className="text-danger">*</span></label>
              <input type="text" className="form-control input-moderno" placeholder="Ej. María Teresa"
                value={form.madre_nombres || ''} onChange={(e) => updateForm('madre_nombres', e.target.value)}
                disabled={!!form.madre_es_representante && form.madre_vive !== 'No'} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small">Apellidos de la Madre <span className="text-danger">*</span></label>
              <input type="text" className="form-control input-moderno" placeholder="Ej. González Pérez"
                value={form.madre_apellidos || ''} onChange={(e) => updateForm('madre_apellidos', e.target.value)}
                disabled={!!form.madre_es_representante && form.madre_vive !== 'No'} />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold small">Cédula de Identidad <span className="text-danger">*</span></label>
              <input type="text" className="form-control input-moderno" placeholder="Ej. 13567896"
                value={form.madre_cedula || ''} onChange={(e) => updateForm('madre_cedula', e.target.value)}
                disabled={!!form.madre_es_representante && form.madre_vive !== 'No'} />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold small">Fecha de Nacimiento</label>
              <input type="date" className="form-control input-moderno"
                value={form.madre_fecha_nacimiento || ''} onChange={(e) => updateForm('madre_fecha_nacimiento', e.target.value)} />
            </div>

            {form.madre_vive !== 'No' && (
              <>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">Teléfono de Contacto</label>
                  <input type="text" className="form-control input-moderno" placeholder="Ej. 0414-1234567"
                    value={form.madre_telefono || ''} onChange={(e) => updateForm('madre_telefono', e.target.value)}
                    disabled={!!form.madre_es_representante} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">Correo Electrónico</label>
                  <input type="email" className="form-control input-moderno" placeholder="correo@ejemplo.com"
                    value={form.madre_email || ''} onChange={(e) => updateForm('madre_email', e.target.value)}
                    disabled={!!form.madre_es_representante} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small d-block">¿La Madre trabaja en PDVSA?</label>
                  <div className="d-flex gap-3 mt-1">
                    {[{ label: 'Sí trabaja en PDVSA', val: true }, { label: 'No trabaja en PDVSA', val: false }].map(opt => (
                      <button key={opt.label} type="button"
                        className={`btn btn-sm rounded-pill px-4 fw-semibold ${form.madre_trabaja_pdvsa === opt.val ? 'btn-success shadow-sm' : 'btn-outline-secondary bg-white'}`}
                        onClick={() => updateForm('madre_trabaja_pdvsa', opt.val)}
                        disabled={!!form.madre_es_representante}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── SECCIÓN PADRE ── */}
        <div className="card shadow-sm border-0 bg-light rounded-4 p-3 p-md-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary-subtle gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary-subtle text-primary rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: 36, height: 36 }}>
                <i className="bi bi-gender-male fs-5"></i>
              </span>
              <h6 className="fw-bold text-dark mb-0 fs-6">2. Información del Padre</h6>
            </div>
            
            {form.estudiante_reconocido_por_padre !== 'No' && (
              <div className="d-flex align-items-center gap-2 bg-white px-3 py-1 rounded-pill border shadow-sm">
                <span className="small fw-semibold text-muted">¿Se encuentra con vida?</span>
                <div className="btn-group btn-group-sm" role="group">
                  <button type="button"
                    className={`btn rounded-pill px-3 fw-bold ${form.padre_vive !== 'No' ? 'btn-success' : 'btn-outline-secondary'}`}
                    onClick={() => updateForm('padre_vive', 'Sí')}>
                    Sí
                  </button>
                  <button type="button"
                    className={`btn rounded-pill px-3 fw-bold ${form.padre_vive === 'No' ? 'btn-danger' : 'btn-outline-secondary'}`}
                    onClick={() => updateForm('padre_vive', 'No')}>
                    No
                  </button>
                </div>
              </div>
            )}
          </div>

          {form.estudiante_reconocido_por_padre === 'No' ? (
            <div className="alert alert-secondary border-0 d-flex align-items-center gap-3 mb-0 py-3 rounded-3 shadow-sm">
              <i className="bi bi-info-circle-fill fs-3 text-secondary"></i>
              <div>
                <strong className="d-block text-dark">Estudiante no reconocido por el padre</strong>
                <span className="small text-muted">Has indicado en el Paso 3 que el estudiante solo fue reconocido legalmente por la madre en la partida de nacimiento. Por consiguiente, los datos del padre no son solicitados ni requeridos.</span>
              </div>
            </div>
          ) : (
            <>
              {form.padre_vive === 'No' && (
                <div className="alert alert-warning border-0 d-flex align-items-center gap-2 mb-3 py-2 rounded-3 small">
                  <i className="bi bi-info-circle-fill fs-5 text-warning"></i>
                  <span>Has indicado que el padre ha fallecido. Recuerda que debes ingresar sus Nombres, Apellidos y Cédula tal como aparecen en la partida de nacimiento del estudiante.</span>
                </div>
              )}

              {form.padre_vive !== 'No' && (
                <div className="bg-white p-3 rounded-3 border mb-3 shadow-sm d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-lightning-charge-fill text-warning fs-5"></i>
                    <span className="small fw-semibold text-dark">¿El padre es el mismo Representante Legal registrado en el Paso 2?</span>
                  </div>
                  <div className="form-check form-switch m-0 fs-5">
                    <input className="form-check-input hover-efecto" type="checkbox" role="switch"
                      id="padreEsRepSwitch"
                      checked={!!form.padre_es_representante}
                      onChange={(e) => copiarDeRepresentantePadre(e.target.checked)} />
                    <label className="form-check-label fs-6 small fw-bold text-success ms-1" htmlFor="padreEsRepSwitch">
                      {form.padre_es_representante ? 'Sí, autocompletar' : 'No'}
                    </label>
                  </div>
                </div>
              )}

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">Nombres del Padre <span className="text-danger">*</span></label>
                  <input type="text" className="form-control input-moderno" placeholder="Ej. Carlos Eduardo"
                    value={form.padre_nombres || ''} onChange={(e) => updateForm('padre_nombres', e.target.value)}
                    disabled={!!form.padre_es_representante && form.padre_vive !== 'No'} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">Apellidos del Padre <span className="text-danger">*</span></label>
                  <input type="text" className="form-control input-moderno" placeholder="Ej. Mendoza Rodríguez"
                    value={form.padre_apellidos || ''} onChange={(e) => updateForm('padre_apellidos', e.target.value)}
                    disabled={!!form.padre_es_representante && form.padre_vive !== 'No'} />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">Cédula de Identidad <span className="text-danger">*</span></label>
                  <input type="text" className="form-control input-moderno" placeholder="Ej. 12345678"
                    value={form.padre_cedula || ''} onChange={(e) => updateForm('padre_cedula', e.target.value)}
                    disabled={!!form.padre_es_representante && form.padre_vive !== 'No'} />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">Fecha de Nacimiento</label>
                  <input type="date" className="form-control input-moderno"
                    value={form.padre_fecha_nacimiento || ''} onChange={(e) => updateForm('padre_fecha_nacimiento', e.target.value)} />
                </div>

                {form.padre_vive !== 'No' && (
                  <>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold small">Teléfono de Contacto</label>
                      <input type="text" className="form-control input-moderno" placeholder="Ej. 0412-1234567"
                        value={form.padre_telefono || ''} onChange={(e) => updateForm('padre_telefono', e.target.value)}
                        disabled={!!form.padre_es_representante} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Correo Electrónico</label>
                      <input type="email" className="form-control input-moderno" placeholder="correo@ejemplo.com"
                        value={form.padre_email || ''} onChange={(e) => updateForm('padre_email', e.target.value)}
                        disabled={!!form.padre_es_representante} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small d-block">¿El Padre trabaja en PDVSA?</label>
                      <div className="d-flex gap-3 mt-1">
                        {[{ label: 'Sí trabaja en PDVSA', val: true }, { label: 'No trabaja en PDVSA', val: false }].map(opt => (
                          <button key={opt.label} type="button"
                            className={`btn btn-sm rounded-pill px-4 fw-semibold ${form.padre_trabaja_pdvsa === opt.val ? 'btn-success shadow-sm' : 'btn-outline-secondary bg-white'}`}
                            onClick={() => updateForm('padre_trabaja_pdvsa', opt.val)}
                            disabled={!!form.padre_es_representante}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className="d-flex justify-content-between mt-4 pt-3 border-top">
          <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(3)}>
            <i className="bi bi-arrow-left me-1"></i> Anterior
          </button>
          <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto" onClick={() => handleStepChange(5)}>
            Continuar <i className="bi bi-arrow-right ms-1"></i>
          </button>
        </div>
      </div>
    );
  };

  // ─── PASO 5: SALUD Y BIENESTAR ─────────────────────────────────────────────
  const renderStep5 = () => {
    return (
      <div className="animate__animated animate__fadeIn">
        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
          <i className="bi bi-heart-pulse-fill text-danger fs-5"></i>
          <h6 className="fw-bold text-dark mb-0">Información de Salud y Bienestar (Confidencial)</h6>
        </div>
        <div className="row g-3">
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
                {condicionNeuroDB.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="Otra">Otra (Especifique)</option>
              </select>
              {form.estudiante_tipo_condicion?.trim().toLowerCase() === 'otro' || form.estudiante_tipo_condicion?.trim().toLowerCase() === 'otra' ? (
                <input type="text" className="form-control input-moderno mt-2 animate__animated animate__fadeIn"
                  placeholder="Especifique la condición..." value={form.estudiante_tipo_condicion_otro}
                  onChange={(e) => updateForm('estudiante_tipo_condicion_otro', e.target.value)} required />
              ) : null}
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

        <div className="col-md-6 animate__animated animate__fadeIn">
          <label className="form-label fw-semibold">Condición Médica <span className="text-danger">*</span></label>
          <select className="form-select input-moderno" value={form.estudiante_condicion_medica}
            onChange={(e) => updateForm('estudiante_condicion_medica', e.target.value)} required>
            <option value="">Seleccione...</option>
            {condicionMedicaDB.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="Otra">Otra (Especifique)</option>
          </select>
          {form.estudiante_condicion_medica?.trim().toLowerCase() === 'otro' || form.estudiante_condicion_medica?.trim().toLowerCase() === 'otra' ? (
            <input type="text" className="form-control input-moderno mt-2 animate__animated animate__fadeIn"
              placeholder="Especifique la condición médica..." value={form.estudiante_condicion_medica_otro}
              onChange={(e) => updateForm('estudiante_condicion_medica_otro', e.target.value)} required />
          ) : null}
        </div>

        <div className="col-md-6 animate__animated animate__fadeIn">
          <label className="form-label fw-semibold">Alergias a Medicamentos <span className="text-danger">*</span></label>
          <select className="form-select input-moderno" value={form.estudiante_alergico_medicamentos}
            onChange={(e) => updateForm('estudiante_alergico_medicamentos', e.target.value)} required>
            <option value="">Seleccione...</option>
            {alergiasDB.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="Otra">Otra (Especifique)</option>
          </select>
          {form.estudiante_alergico_medicamentos?.trim().toLowerCase() === 'otro' || form.estudiante_alergico_medicamentos?.trim().toLowerCase() === 'otra' ? (
            <input type="text" className="form-control input-moderno mt-2 animate__animated animate__fadeIn"
              placeholder="Especifique el medicamento..." value={form.estudiante_alergico_medicamentos_otro}
              onChange={(e) => updateForm('estudiante_alergico_medicamentos_otro', e.target.value)} required />
          ) : null}
        </div>

        </div>

        <div className="d-flex justify-content-between mt-4 pt-3 border-top">
          <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(4)}>
            <i className="bi bi-arrow-left me-1"></i> Anterior
          </button>
          <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto" onClick={() => handleStepChange(6)}>
            Siguiente <i className="bi bi-arrow-right ms-1"></i>
          </button>
        </div>
      </div>
    );
  };

  // ─── PASO 6: TRANSPORTE ESCOLAR ───────────────────────────────────────────────
  const renderStep6 = () => {
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
            <div className="col-12 mt-2 animate__animated animate__fadeIn">
              <div className="row g-3">
                {rutasTransporteDB.length > 0 ? (
                  <>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Ruta de Transporte <span className="text-danger">*</span></label>
                      <select
                        className="form-select input-moderno"
                        value={selectedRutaObj?.id || ''}
                        onChange={(e) => {
                          const routeId = e.target.value;
                          const rObj = rutasTransporteDB.find(r => r.id === routeId);
                          setSelectedRutaObj(rObj || null);
                          setSelectedParadaObj(null);
                          updateForm('ruta_transporte', rObj ? rObj.nombre : '');
                        }}
                      >
                        <option value="">-- Seleccionar Ruta --</option>
                        {rutasTransporteDB.map(r => (
                          <option key={r.id} value={r.id}>{r.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Parada de Transporte <span className="text-danger">*</span></label>
                      <select
                        className="form-select input-moderno"
                        value={selectedParadaObj?.id || ''}
                        disabled={!selectedRutaObj}
                        onChange={(e) => {
                          const stopId = e.target.value;
                          const pObj = paradasTransporteDB.find(p => p.id === stopId);
                          setSelectedParadaObj(pObj || null);
                          if (selectedRutaObj && pObj) {
                            updateForm('ruta_transporte', `${selectedRutaObj.nombre} - Parada: ${pObj.nombre_parada}`);
                          }
                        }}
                      >
                        <option value="">-- Seleccionar Parada --</option>
                        {selectedRutaObj && paradasTransporteDB
                          .filter(p => {
                            let pids: string[] = [];
                            if (Array.isArray(selectedRutaObj.paradas_json)) pids = selectedRutaObj.paradas_json;
                            else if (typeof selectedRutaObj.paradas_json === 'string') {
                              try { pids = JSON.parse(selectedRutaObj.paradas_json); } catch (err) {}
                            }
                            return pids.includes(p.id);
                          })
                          .map(p => (
                            <option key={p.id} value={p.id}>{p.nombre_parada} ({p.descripcion || 'Sin descripción'})</option>
                          ))
                        }
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="col-md-8">
                    <label className="form-label fw-semibold">Ruta o Sector Preferido <span className="text-danger">*</span></label>
                    <input type="text" className="form-control input-moderno"
                      placeholder="Indica tu sector o ruta (Ej. Ruta 3 - Guaritos, Ruta 7 - El Tigre Centro)"
                      value={form.ruta_transporte} onChange={(e) => updateForm('ruta_transporte', e.target.value)} />
                    <div className="form-text text-warning">
                      <i className="bi bi-exclamation-triangle-fill me-1"></i> No se encontraron rutas registradas en esta escuela. Por favor, escribe la ruta de preferencia.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="d-flex justify-content-between mt-4 pt-3 border-top">
          <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(5)}>
            <i className="bi bi-arrow-left me-1"></i> Anterior
          </button>
          <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto" onClick={() => handleStepChange(7)}>
            Siguiente <i className="bi bi-arrow-right ms-1"></i>
          </button>
        </div>
      </div>
    );
  };

  // ─── PASO 7: DOCUMENTOS ADJUNTOS ─────────────────────────────────────────────
  const renderStep7 = () => {
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof documentos) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const compressed = await compressImage(file, 1600, 1600, 0.82);
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
        {documentos[key] && <div className="form-text text-success">
          Archivo listo: {typeof documentos[key] === 'string' ? 'Ya cargado previamente' : `${(documentos[key] as File).name} (${((documentos[key] as File).size / 1024).toFixed(1)} KB)`}
        </div>}
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
          {/* Partida de Nacimiento del Estudiante siempre es requerida */}
          {renderInput('partida', 'Copia de la Partida de Nacimiento del Estudiante', true)}
          
          {/* Lógica condicional según parentesco */}
          {((form.parentesco?.toLowerCase().includes('sobrino') || form.parentesco?.toLowerCase().includes('sobrina') || form.parentesco?.toLowerCase().includes('hermano') || form.parentesco?.toLowerCase().includes('hermana')) || 
            (form.representante_parentesco?.toLowerCase().includes('sobrino') || form.representante_parentesco?.toLowerCase().includes('sobrina') || form.representante_parentesco?.toLowerCase().includes('hermano') || form.representante_parentesco?.toLowerCase().includes('hermana'))) && (
            renderInput('partida_trabajador', 'Partida de Nacimiento del Trabajador', true)
          )}

          {((form.parentesco?.toLowerCase().includes('sobrino') || form.parentesco?.toLowerCase().includes('sobrina') || form.parentesco?.toLowerCase().includes('nieto') || form.parentesco?.toLowerCase().includes('nieta')) || 
            (form.representante_parentesco?.toLowerCase().includes('sobrino') || form.representante_parentesco?.toLowerCase().includes('sobrina') || form.representante_parentesco?.toLowerCase().includes('nieto') || form.representante_parentesco?.toLowerCase().includes('nieta'))) && (
            renderInput('partida_nexo', 'Partida de Nacimiento de la Madre o Padre (Nexo con el Trabajador)', true)
          )}

        </div>

        <div className="d-flex justify-content-between mt-4 pt-3 border-top">
          <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(6)} disabled={subiendoDocs}>
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

  // ─── PASO 8: CONFIRMACIÓN + QR ────────────────────────────────────────────────
  const renderStep8 = () => {
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
                <div className="col-5 text-muted">Tel. / Correo Rep.:</div>
                <div className="col-7 fw-semibold text-truncate">{sol.representante_telefono} | {sol.representante_email}</div>
                {sol.madre_vive !== 'No' && (
                  <>
                    <div className="col-5 text-muted">Madre:</div>
                    <div className="col-7 fw-semibold">{sol.madre_nombres} {sol.madre_apellidos} {sol.madre_cedula ? `(C.I: ${sol.madre_cedula})` : ''}</div>
                    <div className="col-5 text-muted">Tel. / Correo Madre:</div>
                    <div className="col-7 fw-semibold text-truncate">{[sol.madre_telefono, sol.madre_email].filter(Boolean).join(' | ') || '—'}</div>
                  </>
                )}
                {sol.estudiante_reconocido_por_padre !== 'No' && sol.padre_vive !== 'No' && (
                  <>
                    <div className="col-5 text-muted">Padre:</div>
                    <div className="col-7 fw-semibold">{sol.padre_nombres} {sol.padre_apellidos} {sol.padre_cedula ? `(C.I: ${sol.padre_cedula})` : ''}</div>
                    <div className="col-5 text-muted">Tel. / Correo Padre:</div>
                    <div className="col-7 fw-semibold text-truncate">{[sol.padre_telefono, sol.padre_email].filter(Boolean).join(' | ') || '—'}</div>
                  </>
                )}
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
              <strong className="text-dark">Próximos pasos:</strong> La Dirección evaluará tu solicitud. Puedes hacer seguimiento en la sección <strong>"Mis Solicitudes"</strong> usando el código de verificación.<br />
              <span className="text-dark d-block mt-1">
                <em>* Recuerda que los cupos se otorgarán o asignarán según la disponibilidad del grado y los niveles de prioridad establecidos en la convención colectiva.</em>
              </span>
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-3 justify-content-center mb-4">
          <button className="btn btn-outline-primary rounded-pill px-4 fw-semibold shadow-sm"
            onClick={() => handleDescargarSoporte('descargar')}>
            <i className="bi bi-download me-1"></i> Descargar Comprobante
          </button>
          <button className="btn btn-success rounded-pill px-4 fw-semibold shadow-sm"
            style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
            onClick={() => handleDescargarSoporte('whatsapp')}>
            <i className="bi bi-whatsapp me-1"></i> Compartir por WhatsApp
          </button>
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
    const camposRequeridos: (string | boolean | undefined)[] = [
      form.estudiante_nombres,
      form.estudiante_apellidos,
      form.estudiante_sexo,
      form.estudiante_fecha_nacimiento,
      Array.isArray(form.estudiante_con_quien_vive) && form.estudiante_con_quien_vive.length > 0 ? 'ok' : typeof form.estudiante_con_quien_vive === 'string' && form.estudiante_con_quien_vive ? 'ok' : '',
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
      form.parentesco,
      form.estudiante_condicion_neuro,
      form.requiere_transporte,
      form.estudiante_condicion_medica,
      form.estudiante_alergico_medicamentos
    ];
    if (form.requiere_transporte) {
      camposRequeridos.push(form.ruta_transporte);
    }
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
    camposRequeridos.push(form.madre_nombres, form.madre_cedula);
    if (form.estudiante_reconocido_por_padre !== 'No') {
      camposRequeridos.push(form.padre_nombres, form.padre_cedula);
    }
    const completados = camposRequeridos.filter(c => (c !== undefined && c !== null && c !== '' && c !== false) || typeof c === 'boolean').length;
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
        <button onClick={() => { 
            if (!estadoProceso.abierto) {
              Swal.fire({
                title: 'Período Restringido',
                text: estadoProceso.motivo,
                icon: 'warning',
                confirmButtonColor: '#FF8D00'
              });
              return;
            }
            setActiveTab('nueva_solicitud'); setStep(1); setSolicitudGuardada(null); setEditingId(null); setForm(defaultForm()); setDocumentos({ficha: null, foto: null, partida: null, cedula: null, partida_trabajador: null, partida_nexo: null}); 
          }}
          className={`btn rounded-pill fw-bold hover-efecto flex-shrink-0 ${activeTab === 'nueva_solicitud' ? 'btn-success shadow' : 'btn-outline-secondary'}`}
          style={{ whiteSpace: 'nowrap', fontSize: 'clamp(0.72rem, 2.2vw, 0.95rem)', padding: 'clamp(6px, 1.5vw, 10px) clamp(12px, 3vw, 20px)' }}>
          <i className="bi bi-plus-lg me-1"></i> Nueva Solicitud {!estadoProceso.abierto && <span className="badge bg-danger ms-1" style={{fontSize:'0.65rem'}}>CERRADO</span>}
        </button>
      </div>

      {/* CONTENIDO */}
      <div className="bg-white border rounded-4 p-4 shadow-sm">

        {/* GESTIÓN (admin) */}
        {activeTab === 'gestion' && isUserAdmin && (
          <div>
            <h5 className="fw-bold text-dark mb-3"><i className="bi bi-card-checklist text-success me-2"></i>Control de Solicitudes de Admisión</h5>
            
            {/* SELECTOR DE PLANTEL / ESCUELA PARA ADMINISTRADORES */}
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 p-3 bg-light rounded-4 border shadow-sm">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-buildings fs-5 text-primary"></i>
                <span className="fw-bold text-dark small">Escuela / Planteles a visualizar:</span>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFiltroEscuela('todos')}
                  className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${filtroEscuela === 'todos' ? 'btn-dark text-white shadow-sm' : 'btn-outline-secondary'}`}
                >
                  <i className="bi bi-globe me-1"></i> Ambas Escuelas ({solicitudes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroEscuela('sb')}
                  className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${filtroEscuela === 'sb' ? 'btn-success text-white shadow-sm' : 'btn-outline-secondary'}`}
                >
                  UE Santa Bárbara ({solicitudes.filter(s => s.codigo_escuela === 'sb').length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroEscuela('lb')}
                  className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${filtroEscuela === 'lb' ? 'btn-primary text-white shadow-sm' : 'btn-outline-secondary'}`}
                >
                  UE Libertador Bolívar ({solicitudes.filter(s => s.codigo_escuela === 'lb').length})
                </button>
              </div>
            </div>

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
              <div>
                {selectedIds.length > 0 && (
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 p-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-4 mb-3 animate__animated animate__fadeIn">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-check2-square text-danger fs-5"></i>
                      <span className="fw-bold text-dark small">
                        <span className="text-danger">{selectedIds.length}</span> solicitud(es) seleccionada(s)
                      </span>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedIds([])}
                        className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold"
                      >
                        Desmarcar todo
                      </button>
                      <button
                        type="button"
                        onClick={handleEliminarMasivo}
                        className="btn btn-sm btn-danger rounded-pill px-3 fw-bold shadow-sm d-flex align-items-center gap-1"
                      >
                        <i className="bi bi-trash3-fill me-1"></i> Eliminar seleccionadas ({selectedIds.length})
                      </button>
                    </div>
                  </div>
                )}

                <div className="table-responsive">
                  <table className="table table-hover align-middle border rounded-4 overflow-hidden">
                    <thead className="bg-light text-muted small text-uppercase">
                      <tr>
                        <th className="ps-3" style={{ width: '40px' }}>
                          <input
                            type="checkbox"
                            className="form-check-input hover-mano"
                            checked={filteredSolicitudes.length > 0 && filteredSolicitudes.every(s => s.id !== undefined && selectedIds.includes(s.id))}
                            onChange={handleSelectAll}
                            title="Seleccionar todo el listado actual"
                          />
                        </th>
                        <th>Código</th>
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
                        <tr key={i} className={sol.id !== undefined && selectedIds.includes(sol.id) ? 'table-danger bg-opacity-10' : ''}>
                          <td className="ps-3" style={{ width: '40px' }}>
                            <input
                              type="checkbox"
                              className="form-check-input hover-mano"
                              checked={sol.id !== undefined && selectedIds.includes(sol.id)}
                              onChange={() => handleSelectOne(sol.id)}
                            />
                          </td>
                          <td>
                            <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle d-block mb-1 text-center"
                              style={{ fontFamily: 'monospace', fontSize: '0.75rem', letterSpacing: 1 }}>
                              {sol.codigo_unico || '—'}
                            </span>
                            {sol.codigo_escuela === 'sb' ? (
                              <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle px-2 py-0.5 d-block text-center rounded-pill" style={{ fontSize: '0.65rem' }}>
                                <i className="bi bi-building me-1"></i>Santa Bárbara
                              </span>
                            ) : (
                              <span className="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle px-2 py-0.5 d-block text-center rounded-pill" style={{ fontSize: '0.65rem' }}>
                                <i className="bi bi-building me-1"></i>Libertador
                              </span>
                            )}
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
                          <div className="small fw-semibold text-dark mb-1" title="Contacto Representante">
                            <i className="bi bi-person-badge text-primary me-1"></i>{sol.representante_telefono}
                            <div className="text-muted fw-normal" style={{ fontSize: '0.75rem' }}><i className="bi bi-envelope-fill me-1"></i>{sol.representante_email}</div>
                          </div>
                          {sol.madre_vive !== 'No' && (sol.madre_telefono || sol.madre_email) && (
                            <div className="small text-muted border-top pt-1 mt-1" style={{ fontSize: '0.75rem' }} title="Contacto Madre">
                              <span className="fw-semibold text-dark"><i className="bi bi-gender-female text-danger me-1"></i>Mamá:</span> {sol.madre_telefono || 'Sin tel.'}
                              {sol.madre_email && <div className="text-truncate" style={{ maxWidth: '170px' }}><i className="bi bi-envelope me-1"></i>{sol.madre_email}</div>}
                            </div>
                          )}
                          {sol.estudiante_reconocido_por_padre !== 'No' && sol.padre_vive !== 'No' && (sol.padre_telefono || sol.padre_email) && (
                            <div className="small text-muted border-top pt-1 mt-1" style={{ fontSize: '0.75rem' }} title="Contacto Padre">
                              <span className="fw-semibold text-dark"><i className="bi bi-gender-male text-primary me-1"></i>Papá:</span> {sol.padre_telefono || 'Sin tel.'}
                              {sol.padre_email && <div className="text-truncate" style={{ maxWidth: '170px' }}><i className="bi bi-envelope me-1"></i>{sol.padre_email}</div>}
                            </div>
                          )}
                        </td>
                        <td>{getStatusBadge(sol.estado)}</td>
                        <td className="text-end pe-3">
                          <div className="d-flex justify-content-end gap-1">
                            <button type="button"
                              onClick={() => handleEditarSolicitud(sol)}
                              className="btn btn-sm btn-outline-primary rounded-pill hover-efecto">
                              <i className="bi bi-pencil-square"></i> Editar
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
              </div>
            )}
          </div>
        )}

        {/* MIS SOLICITUDES */}
        {activeTab === 'mis_solicitudes' && (
          <div>
            {!estadoProceso.abierto && (
              <div className="alert alert-warning border border-warning shadow-sm rounded-4 p-3 mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-3">
                  <i className="bi bi-clock-history fs-2 text-warning"></i>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Período de Solicitudes Restringido</h6>
                    <p className="small mb-0 text-muted">{estadoProceso.motivo}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-dark mb-0"><i className="bi bi-mailbox2 text-success me-2"></i>Historial de Solicitudes</h5>
              <button onClick={() => { 
                  if (!estadoProceso.abierto) {
                    Swal.fire({
                      title: 'Período Restringido',
                      text: estadoProceso.motivo,
                      icon: 'warning',
                      confirmButtonColor: '#FF8D00'
                    });
                    return;
                  }
                  setActiveTab('nueva_solicitud'); setStep(1); setSolicitudGuardada(null); 
                }}
                className="btn btn-success rounded-pill btn-sm fw-semibold d-flex align-items-center gap-1">
                <i className="bi bi-plus-circle me-1"></i> Solicitar Cupo {!estadoProceso.abierto && <span className="badge bg-danger ms-1" style={{fontSize:'0.65rem'}}>CERRADO</span>}
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
                <button onClick={() => { 
                  if (!estadoProceso.abierto) {
                    Swal.fire({
                      title: 'Período Restringido',
                      text: estadoProceso.motivo,
                      icon: 'warning',
                      confirmButtonColor: '#FF8D00'
                    });
                    return;
                  }
                  setActiveTab('nueva_solicitud'); setStep(1); 
                }} className="btn btn-sm btn-success rounded-pill px-3">
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
                      <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div className="d-flex gap-2">
                          {sol.estado === 'Borrador' ? (
                            <span
                              className="btn btn-sm btn-outline-secondary rounded-pill fw-semibold disabled"
                              title="Completa y envía la solicitud para poder descargar el soporte"
                              style={{ opacity: 0.5, cursor: 'not-allowed', pointerEvents: 'none' }}
                            >
                              <i className="bi bi-lock-fill me-1"></i> Soporte (Incompleto)
                            </span>
                          ) : (
                            <>
                              <button onClick={() => handleAccionSoporteCard(sol, 'descargar')} className="btn btn-sm btn-outline-secondary rounded-pill fw-semibold">
                                <i className="bi bi-download me-1"></i> Soporte
                              </button>
                              <button onClick={() => handleAccionSoporteCard(sol, 'whatsapp')} className="btn btn-sm btn-outline-success rounded-pill fw-semibold" style={{ color: '#25D366', borderColor: '#25D366' }}>
                                <i className="bi bi-whatsapp me-1"></i> WhatsApp
                              </button>
                            </>
                          )}
                        </div>
                        {(sol.estado === 'Pendiente' || sol.estado === 'Borrador') && (
                          <div>
                            <button onClick={() => handleEditarSolicitud(sol)} className="btn btn-sm btn-outline-primary border-0 rounded-pill me-2">
                              <i className="bi bi-pencil-square me-1"></i> Editar
                            </button>
                            <button onClick={() => handleEliminarSolicitud(sol)} className="btn btn-sm btn-outline-danger border-0 rounded-pill">
                              <i className="bi bi-trash-fill me-1"></i> Cancelar
                            </button>
                          </div>
                        )}
                      </div>
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
            {!estadoProceso.abierto ? (
              <div className="text-center py-5 bg-light rounded-4 border p-4 my-3">
                <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-circle d-inline-block mb-3">
                  <i className="bi bi-clock-history fs-1"></i>
                </div>
                <h4 className="fw-bold text-dark mb-2">Período de Solicitudes No Disponible</h4>
                <p className="text-muted max-w-md mx-auto mb-4" style={{ maxWidth: '600px' }}>
                  {estadoProceso.motivo}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('mis_solicitudes')}
                  className="btn btn-dark rounded-pill px-4 py-2 fw-bold shadow-sm hover-efecto"
                >
                  <i className="bi bi-arrow-left me-2"></i> Volver a Mis Solicitudes
                </button>
              </div>
            ) : (
              <>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="d-flex align-items-center gap-3">
                    <h5 className="fw-bold text-dark mb-0">
                      <i className="bi bi-file-earmark-person-fill text-success me-2"></i>
                      {editingId ? 'Editando Solicitud de Cupo' : 'Formulario de Solicitud de Cupo'}
                    </h5>
                {savingStatus === 'saving' && (
                  <span className="badge bg-warning bg-opacity-10 text-warning border border-warning rounded-pill px-3 py-2 animate__animated animate__pulse animate__infinite">
                    <span className="spinner-border spinner-border-sm me-2" role="status" style={{ width: '0.85rem', height: '0.85rem' }}></span>
                    Guardando borrador...
                  </span>
                )}
                {savingStatus === 'saved' && (
                  <span className="badge bg-success bg-opacity-10 text-success border border-success rounded-pill px-3 py-2 animate__animated animate__fadeIn">
                    <i className="bi bi-cloud-check-fill me-2"></i>
                    Cambios guardados
                  </span>
                )}
                {savingStatus === 'error' && (
                  <span className="badge bg-danger bg-opacity-10 text-danger border border-danger rounded-pill px-3 py-2 animate__animated animate__shakeX">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    Error al guardar borrador
                  </span>
                )}

              </div>
              <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle">
                Paso {step} de 7
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
              {step === 7 && renderStep7()}
              {step === 8 && renderStep8()}
            </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
