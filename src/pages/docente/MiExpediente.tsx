import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';
import { formatPhoneNumber } from '../../lib/formatters';

interface Familiar {
  nombres: string;
  parentesco: string;
  cedula: string;
  fecha_nacimiento: string;
  vive_con_trabajador: string;
  condicion_neuro: string;
  conapdis: string;
}

interface Curso {
  titulo: string;
  lugar: string;
  horas: string;
  fecha: string;
}

interface PlanCurso {
  nivel: string;
  titulo: string;
  categoria: string;
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
    copia_ficha?: boolean;
    ficha_tecnica?: boolean;
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
    informe_salud_ocupacional: string;
    informe_actualizado: string;
  };
  datos_electoral: {
    estado: string;
    municipio: string;
    parroquia: string;
    centro_votacion: string;
  };
  datos_vivienda: {
    tipo_prestamo: string;
    num_convivientes: number | '';
    discapacidad_trabajador: string;
    discapacidad_familiar: string;
    conyuge_nombre: string;
    conyuge_cedula: string;
    conyuge_trabaja_pdvsa: string;
    condicion_habitabilidad: string;
    prioridad: string;
    estado_hab: string;
    municipio_hab: string;
    parroquia_hab: string;
    direccion_detalle: string;
  };
  carga_familiar: Familiar[];
  cursos_realizados: Curso[];
  plan_formacion: PlanCurso[];
  necesidades_extra: string;

  // Nuevas columnas Ficha Docente / PAAV Vacaciones
  n_personal?: string;
  grupo?: string;
  gerencia?: string;
  organizacion_proceso?: string;
  experiencia_externa?: any[];
  historico_pdvsa?: any[];
  acciones_personal?: {
    promocion: any[];
    evaluacion: any[];
    salario: any[];
  };
  otros_idiomas?: string;
  destrezas_habilidades?: string;
  desarrollo_carrera?: string;
  observaciones_ficha?: string;
  estudios_superiores?: any[];
  fecha_aniversaria?: string;
  periodo_vacacional?: string;
  vacaciones_desde?: string;
  vacaciones_hasta?: string;
  dias_habiles?: number;
  dias_continuos?: number;
  fecha_retorno?: string;
  cargo_actual?: string;
  indicador?: string;
  supervisor_nombre?: string;
  supervisor_cedula?: string;
  supervisor_telefono?: string;
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
  condicion_neuro: '',
  grupo_sanguineo: '',
  condicion_medica: '',
  emergencia_nombre: '',
  informe_salud_ocupacional: 'No',
  informe_actualizado: 'No'
};

const DEFAULT_ELECTORAL = {
  estado: '',
  municipio: '',
  parroquia: '',
  centro_votacion: ''
};

const DEFAULT_VIVIENDA = {
  tipo_prestamo: '',
  num_convivientes: '' as number | '',
  discapacidad_trabajador: 'NO',
  discapacidad_familiar: 'NO',
  conyuge_nombre: '',
  conyuge_cedula: '',
  conyuge_trabaja_pdvsa: '',
  condicion_habitabilidad: '',
  prioridad: '',
  estado_hab: '',
  municipio_hab: '',
  parroquia_hab: '',
  direccion_detalle: ''
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
    constancia: false,
    copia_ficha: false,
    ficha_tecnica: false
  },
  datos_salud: DEFAULT_SALUD,
  datos_electoral: DEFAULT_ELECTORAL,
  datos_vivienda: DEFAULT_VIVIENDA,
  carga_familiar: [],
  cursos_realizados: [],
  plan_formacion: [],
  necesidades_extra: '',
  
  // Nuevas columnas inicializadores
  n_personal: '',
  grupo: '',
  gerencia: '',
  organizacion_proceso: '',
  experiencia_externa: [],
  historico_pdvsa: [],
  acciones_personal: {
    promocion: [],
    evaluacion: [],
    salario: []
  },
  otros_idiomas: '',
  destrezas_habilidades: '',
  desarrollo_carrera: '',
  observaciones_ficha: '',
  estudios_superiores: [],
  fecha_aniversaria: '',
  periodo_vacacional: '',
  vacaciones_desde: '',
  vacaciones_hasta: '',
  dias_habiles: 0,
  dias_continuos: 0,
  fecha_retorno: '',
  cargo_actual: '',
  indicador: '',
  supervisor_nombre: '',
  supervisor_cedula: '',
  supervisor_telefono: ''
};

const CATALOGO_PLAN_FORMACION: PlanCurso[] = [
  { nivel: "Intermedio", titulo: "Inteligencia Artificial para el Aula", categoria: "Tecnología Educativa (EdTech)" },
  { nivel: "Intermedio", titulo: "Liderazgo Pedagógico: Inspirar sin Autoritarismo", categoria: "Gestión y Liderazgo Educativo" },
  { nivel: "Intermedio", titulo: "Plataformas de Evaluación en Línea", categoria: "Evaluación y Medición del Aprendizaje" },
  { nivel: "Básico", titulo: "Comunicación Asertiva y Resolución de Conflictos", categoria: "Gestión y Liderazgo Educativo" },
  { nivel: "Avanzado", titulo: "Estrategias para la Neurodiversidad en el Aula", categoria: "Educación Inclusiva y Diversidad" },
  { nivel: "Básico", titulo: "Paquetería Ofimática (Word, Excel, PowerPoint/Libres)", categoria: "Tecnología Educativa (EdTech)" },
  { nivel: "Básico", titulo: "Inteligencia Emocional para Liderar el Aula", categoria: "Gestión y Liderazgo Educativo" },
  { nivel: "Básico", titulo: "Prevención del Burnout Docente: Autocuidado Profesional", categoria: "Innovación y Desarrollo Profesional" },
  { nivel: "Básico", titulo: "Microlearning: Diseño de Píldoras Formativas", categoria: "Formación Pedagógica y Didáctica" },
  { nivel: "Intermedio", titulo: "Oratoria y Comunicación Efectiva para Educadores", categoria: "Innovación y Desarrollo Profesional" },
  { nivel: "Básico", titulo: "Rutinas de Pensamiento para Desarrollar la Mente", categoria: "Formación Pedagógica y Didáctica" },
  { nivel: "Intermedio", titulo: "Evaluación Formativa con Retroalimentación Efectiva", categoria: "Evaluación y Medición del Aprendizaje" },
  { nivel: "Básico", titulo: "Enseñanza Basada en Problemas (EBP)", categoria: "Formación Pedagógica y Didáctica" },
  { nivel: "Intermedio", titulo: "Análisis de Datos Educativos con Excel", categoria: "Evaluación y Medición del Aprendizaje" },
  { nivel: "Básico", titulo: "Design Thinking para Innovación Educativa", categoria: "Innovación y Desarrollo Profesional" },
  { nivel: "Básico", titulo: "Edición de Videos Educativos", categoria: "Tecnología Educativa (EdTech)" },
  { nivel: "Intermedio", titulo: "Automatización de Tareas Docentes con IA", categoria: "Tecnología Educativa (EdTech)" },
  { nivel: "Avanzado", titulo: "Aprendizaje Servicio: Conectar Aula y Comunidad", categoria: "Formación Pedagógica y Didáctica" },
  { nivel: "Básico", titulo: "Investigación-Acción en el Aula: Mejora Continua", categoria: "Innovación y Desarrollo Profesional" },
  { nivel: "Básico", titulo: "Pedagogía de la Pregunta: Fomentar la Curiosidad", categoria: "Formación Pedagógica y Didáctica" },
  { nivel: "Intermedio", titulo: "Apoyo a Estudiantes con Altas Capacidades", categoria: "Educación Inclusiva y Diversidad" },
  { nivel: "Básico", titulo: "Creación de Contenidos Digitales Interactivos", categoria: "Tecnología Educativa (EdTech)" },
  { nivel: "Intermedio", titulo: "Gestión de Aulas Virtuales con LMS", categoria: "Tecnología Educativa (EdTech)" },
  { nivel: "Intermedio", titulo: "Programación Neurolingüística (PNL) en el Aula", categoria: "Gestión y Liderazgo Educativo" },
  { nivel: "Avanzado", titulo: "Mentoría entre Pares y Comunidades de Aprendizaje", categoria: "Innovación y Desarrollo Profesional" },
  { nivel: "Avanzado", titulo: "Gamificación Educativa: Motivación con Propósito", categoria: "Formación Pedagógica y Didáctica" },
  { nivel: "Básico", titulo: "Sensibilización sobre Discapacidad Invisible", categoria: "Educación Inclusiva y Diversidad" },
  { nivel: "Intermedio", titulo: "Adaptaciones Curriculares No Significativas", categoria: "Educación Inclusiva y Diversidad" },
  { nivel: "Intermedio", titulo: "Pensamiento Crítico y Creatividad en el Aula", categoria: "Formación Pedagógica y Didáctica" },
  { nivel: "Avanzado", titulo: "Estrategias para la Gestión del Estrés Estudiantil", categoria: "Gestión y Liderazgo Educativo" },
  { nivel: "Básico", titulo: "Enseñanza Diferenciada: Atender la Diversidad", categoria: "Educación Inclusiva y Diversidad" },
  { nivel: "Básico", titulo: "Aula Invertida: Estrategias Prácticas", categoria: "Formación Pedagógica y Didáctica" },
  { nivel: "Básico", titulo: "Ética y Uso Responsable de la IA en Educación", categoria: "Tecnología Educativa (EdTech)" }
];

const FALLBACK_DIV_POL = [
  { estado: "Monagas", municipio: "Maturín", parroquia: "Boquerón" },
  { estado: "Monagas", municipio: "Maturín", parroquia: "Las Cocuizas" },
  { estado: "Monagas", municipio: "Maturín", parroquia: "Santa Cruz" },
  { estado: "Monagas", municipio: "Punceres", parroquia: "Cachipo" },
  { estado: "Monagas", municipio: "Piar", parroquia: "Aragua de Maturín" }
];
const formatTitleCase = (str: string): string => {
  if (!str) return '';

  const conectores = new Set([
    'de', 'del', 'la', 'las', 'lo', 'los', 'el', 'y', 'en', 'con', 'por', 'para', 'o', 'a', 'al', 'e', 'u', 'le', 'ha'
  ]);

  const abreviaturas = new Set([
    'ue', 'cel', 'pdvsa', 'ivss', 'rif', 'ci', 'conapdis', 'saime', 'paav', 'sap', 'tea', 'tdah', 'ce'
  ]);

  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (!word) return '';
      const cleaned = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").toLowerCase();

      if (abreviaturas.has(cleaned)) {
        return word.toUpperCase();
      }

      if (conectores.has(cleaned) && index > 0) {
        return word.toLowerCase();
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

export const MiExpediente = () => {
  const navigate = useNavigate();
  const { tienePermiso, loading: permLoading } = usePermisos();
  const Swal = (window as any).Swal;

  const [activeStep, setActiveStep] = useState<number>(1);
  const [loadingData, setLoadingData] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Todas');
  const [busquedaCurso, setBusquedaCurso] = useState<string>('');
  const [divPolRecords, setDivPolRecords] = useState<any[]>([]);
  const [targetUserName, setTargetUserName] = useState<string>('');

  const [searchParams] = useSearchParams();
  const queryCedula = searchParams.get('cedula');

  // Session User Info
  const storedUser = localStorage.getItem('usuario_sigae');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const targetCedula = queryCedula || user?.cedula || '';
  const userCedula = targetCedula;

  const mostrarPaso7 = !!queryCedula;
  const totalPasos = mostrarPaso7 ? 10 : 6;

  useEffect(() => {
    if (activeStep > totalPasos) {
      setActiveStep(totalPasos);
    }
  }, [totalPasos, activeStep]);

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
  const [famCondicionNeuro, setFamCondicionNeuro] = useState('');
  const [famConapdis, setFamConapdis] = useState('No');

  // Dynamic Add inputs: Curso
  const [curTitulo, setCurTitulo] = useState('');
  const [curLugar, setCurLugar] = useState('');
  const [curHoras, setCurHoras] = useState('');
  const [curFecha, setCurFecha] = useState('');

  // Editing indices
  const [editingFamiliarIndex, setEditingFamiliarIndex] = useState<number | null>(null);
  const [editingCursoIndex, setEditingCursoIndex] = useState<number | null>(null);

  // Dynamic Add inputs: Estudios Superiores (Ficha Docente)
  const [estNivel, setEstNivel] = useState('Licenciatura / Profesorado');
  const [estTitulo, setEstTitulo] = useState('');
  const [estUniversidad, setEstUniversidad] = useState('');
  const [estAnio, setEstAnio] = useState<number>(new Date().getFullYear());
  const [editingEstudioIndex, setEditingEstudioIndex] = useState<number | null>(null);

  // Dynamic Add inputs: Historico PDVSA
  const [histEmpresa, setHistEmpresa] = useState('');
  const [histCargo, setHistCargo] = useState('');
  const [histInicio, setHistInicio] = useState('');
  const [histFin, setHistFin] = useState('');
  const [editingHistIndex, setEditingHistIndex] = useState<number | null>(null);

  // Dynamic Add inputs: Acciones de Personal - Promociones
  const [promFecha, setPromFecha] = useState('');
  const [promCargoAnt, setPromCargoAnt] = useState('');
  const [promCargoNuevo, setPromCargoNuevo] = useState('');
  const [promObs, setPromObs] = useState('');
  const [editingPromIndex, setEditingPromIndex] = useState<number | null>(null);

  // Dynamic Add inputs: Acciones de Personal - Evaluaciones
  const [evalPeriodo, setEvalPeriodo] = useState('');
  const [evalCalificacion, setEvalCalificacion] = useState('Excelente');
  const [evalPuntaje, setEvalPuntaje] = useState('');
  const [evalEvaluador, setEvalEvaluador] = useState('');
  const [editingEvalIndex, setEditingEvalIndex] = useState<number | null>(null);

  // Dynamic Add inputs: Acciones de Personal - Salarios
  const [salFecha, setSalFecha] = useState('');
  const [salMontoAnt, setSalMontoAnt] = useState('');
  const [salMontoNuevo, setSalMontoNuevo] = useState('');
  const [salMotivo, setSalMotivo] = useState('');
  const [editingSalIndex, setEditingSalIndex] = useState<number | null>(null);

  const hasAccess = tienePermiso('Mi Expediente', 'ver') || tienePermiso('Gestor de Expedientes', 'ver');
  const canUpdate = tienePermiso('Mi Expediente', 'modificar') || tienePermiso('Mi Expediente', 'crear') || tienePermiso('Gestor de Expedientes', 'ver');

  const [savingStatus, setSavingStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [cargandoGPS, setCargandoGPS] = useState(false);

  useEffect(() => {
    const fetchDivPol = async () => {
      try {
        let allRecords: any[] = [];
        let from = 0;
        const limit = 1000;
        while (true) {
          const { data, error } = await supabase
            .from('div_pol_vzla')
            .select('*')
            .range(from, from + limit - 1);

          if (error) throw error;
          if (!data || data.length === 0) break;
          allRecords = [...allRecords, ...data];
          if (data.length < limit) break;
          from += limit;
        }
        if (allRecords.length > 0) {
          setDivPolRecords(allRecords);
        } else {
          setDivPolRecords(FALLBACK_DIV_POL);
        }
      } catch (e) {
        console.error("Error loading division records:", e);
        setDivPolRecords(FALLBACK_DIV_POL);
      }
    };
    fetchDivPol();
  }, []);

  useEffect(() => {
    if (permLoading || !hasAccess || !user) return;

    const cargarExpediente = async () => {
      setLoadingData(true);
      try {
        // Cargar división político-territorial primero si aún no está cargada para poder parsear
        let currentDivPol = divPolRecords;
        if (currentDivPol.length === 0) {
          try {
            let allRecords: any[] = [];
            let from = 0;
            const limit = 1000;
            while (true) {
              const { data: divData, error: divError } = await supabase
                .from('div_pol_vzla')
                .select('*')
                .range(from, from + limit - 1);

              if (divError) throw divError;
              if (!divData || divData.length === 0) break;
              allRecords = [...allRecords, ...divData];
              if (divData.length < limit) break;
              from += limit;
            }
            currentDivPol = allRecords.length > 0 ? allRecords : FALLBACK_DIV_POL;
            setDivPolRecords(currentDivPol);
          } catch (e) {
            console.error("Error loading division records inside cargarExpediente:", e);
            currentDivPol = FALLBACK_DIV_POL;
            setDivPolRecords(currentDivPol);
          }
        }

        // Cargar borrador local si existe para no perder avances
        const localDraftStr = localStorage.getItem(`sigae_expediente_borrador_${targetCedula}`);
        let draftData = null;
        if (localDraftStr) {
          try {
            draftData = JSON.parse(localDraftStr);
          } catch (e) {}
        }

        // Cargar email y teléfono en tiempo real de la tabla usuarios para mantener paridad
        const { data: dbUser, error: userError } = await supabase
          .from('usuarios')
          .select('nombre_completo, email, telefono')
          .eq('cedula', targetCedula)
          .maybeSingle();

        if (dbUser) {
          setTargetUserName(dbUser.nombre_completo || '');
        }

        if (draftData) {
          setFormData(draftData.formData);
          setUserEmail(draftData.userEmail || '');
          setUserTelefono(formatPhoneNumber(draftData.userTelefono || ''));
        } else {
          if (!userError && dbUser) {
            setUserEmail(dbUser.email || '');
            setUserTelefono(formatPhoneNumber(dbUser.telefono || ''));
          } else {
            setUserEmail(user?.email || '');
            setUserTelefono(formatPhoneNumber(user?.telefono || ''));
          }
        }

        const { data, error } = await supabase
          .from('expedientes_docentes')
          .select('*')
          .eq('usuario_cedula', targetCedula)
          .maybeSingle();

        if (!draftData) {
          if (error) {
            // If table does not exist, trigger demo/simulation mode
            if (error.code === 'PGRST205' || error.message.includes('relation "public.expedientes_docentes" does not exist')) {
              console.warn("Table 'expedientes_docentes' not found. Activating simulation mode.");
              setIsDemoMode(true);
              const localDemo = localStorage.getItem(`sigae_expediente_demo_${targetCedula}`);
              if (localDemo) {
                setFormData(JSON.parse(localDemo));
              }
              // En simulación local, cargamos del localStorage del usuario
              if (targetCedula === user?.cedula) {
                const stored = localStorage.getItem('usuario_sigae');
                if (stored) {
                  const parsed = JSON.parse(stored);
                  setUserEmail(parsed.email || '');
                  setUserTelefono(parsed.telefono || '');
                }
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
              datos_salud: (() => {
                const s = { ...DEFAULT_SALUD, ...(data.datos_salud || {}) };
                if (s.emergencia_tel) s.emergencia_tel = formatPhoneNumber(s.emergencia_tel);
                return s;
              })(),
              datos_electoral: data.datos_electoral || DEFAULT_ELECTORAL,
              datos_vivienda: (() => {
                const loadedV = { ...DEFAULT_VIVIENDA, ...(data.datos_vivienda || {}) };
                
                // Si faltan datos estructurados de habitación, intentamos deducirlos a partir de data.direccion
                if ((!loadedV.estado_hab || !loadedV.municipio_hab || !loadedV.parroquia_hab) && data.direccion) {
                  const parts = data.direccion.split('.');
                  const locationPart = parts[0] || '';
                  const detailPart = parts.slice(1).join('.') || '';
                  
                  // Limpiar prefijos comunes como "municipio", "parroquia", "estado"
                  const locs = locationPart.split(',').map((s: string) => s.trim().replace(/^(municipio|parroquia|estado)\s+/i, ''));
                  
                  const cleanMuni = locs[1] ? locs[1].toLowerCase() : '';
                  const cleanParro = locs[2] ? locs[2].toLowerCase() : '';
                  
                  let matchedRecord = null;
                  if (cleanMuni || cleanParro) {
                    matchedRecord = currentDivPol.find(r => {
                      const mMuni = r.municipio.toLowerCase();
                      const mParro = r.parroquia.toLowerCase();
                      
                      if (cleanMuni && cleanParro) {
                        return mMuni.includes(cleanMuni) && mParro.includes(cleanParro);
                      } else if (cleanMuni) {
                        return mMuni.includes(cleanMuni);
                      } else if (cleanParro) {
                        return mParro.includes(cleanParro);
                      }
                      return false;
                    });
                  }
                  
                  if (matchedRecord) {
                    if (!loadedV.estado_hab) loadedV.estado_hab = matchedRecord.estado;
                    if (!loadedV.municipio_hab) loadedV.municipio_hab = matchedRecord.municipio;
                    if (!loadedV.parroquia_hab) loadedV.parroquia_hab = matchedRecord.parroquia;
                    loadedV.direccion_detalle = detailPart.trim() || data.direccion;
                  } else {
                    if (locs[0] && !loadedV.estado_hab) loadedV.estado_hab = locs[0];
                    if (locs[1] && !loadedV.municipio_hab) loadedV.municipio_hab = locs[1];
                    if (locs[2] && !loadedV.parroquia_hab) loadedV.parroquia_hab = locs[2];
                    loadedV.direccion_detalle = detailPart.trim() || data.direccion;
                  }
                }

                if (!loadedV.direccion_detalle && data.direccion) {
                  loadedV.direccion_detalle = data.direccion;
                }

                // Limpiar cualquier coma o punto inicial sobrante en el detalle de dirección
                if (loadedV.direccion_detalle) {
                  loadedV.direccion_detalle = loadedV.direccion_detalle.trim().replace(/^[,.\s]+/, '');
                }
                
                // Normalizar valores cargados de la base de datos para paridad con la planilla PAAV
                if (loadedV.tipo_prestamo) {
                  let val = loadedV.tipo_prestamo.trim().toUpperCase();
                  if (val.includes('INICIAL/ADQUISICIÓN') || val.includes('INICIAL/ADQUISICION')) val = 'INICIAL/ADQUISICIÓN';
                  else if (val.includes('INICIAL/MEJORAS')) val = 'INICIAL/MEJORAS';
                  else if (val.includes('ADICIONAL/ADQUISICIÓN') || val.includes('ADICIONAL/ADQUISICION')) val = 'ADICIONAL/ADQUISICIÓN';
                  else if (val.includes('ADICIONAL/MEJORAS')) val = 'ADICIONAL/MEJORAS';
                  loadedV.tipo_prestamo = val;
                }
                if (loadedV.conyuge_trabaja_pdvsa) {
                  const upperVal = loadedV.conyuge_trabaja_pdvsa.toUpperCase();
                  if (upperVal.includes('ACTIVO')) {
                    loadedV.conyuge_trabaja_pdvsa = 'ES TRABAJADOR(A) ACTIVO(A)';
                  } else if (upperVal.includes('RETIRADO') || upperVal.includes('JUBILADO')) {
                    loadedV.conyuge_trabaja_pdvsa = 'TRABAJÓ, ESTÁ RETIRADO';
                  } else if (upperVal.includes('NUNCA') || upperVal.includes('TRABAJO')) {
                    loadedV.conyuge_trabaja_pdvsa = 'NUNCA HA TRABAJO PDVSA';
                  }
                }
                if (loadedV.condicion_habitabilidad) {
                  let val = loadedV.condicion_habitabilidad.trim().replace(/^([0-9]\)\s*)Habita\s+/i, '$1Habite ').toUpperCase();
                  if (val.startsWith('1)')) val = '1) HABITE EN CONDICIÓN DE HACINAMIENTO, SOLO O CON SU GRUPO FAMILIAR.';
                  else if (val.startsWith('2)')) val = '2) HABITE EN CONDICIÓN DE ARRIMADO, SOLO O CON SU GRUPO FAMILIAR.';
                  else if (val.startsWith('3)')) val = '3) HABITE EN CONDICIÓN DE ALQUILER, SOLO O CON SU GRUPO FAMILIAR.';
                  else if (val.startsWith('4)')) val = '4) HABITE EN CONDICIÓN DE ALQUILER, CON SOLICITUD U ORDEN DE DESALOJO.';
                  else if (val.startsWith('5)')) val = '5) HABITE EN VIVIENDA CATALOGADA DE ALTO RIESGO, ASÍ DECLARADO POR LA AUTORIDAD COMPETENTE (PROTECCIÓN CIVIL O BOMBEROS)';
                  else if (val.startsWith('6)')) val = '6) HABITE EN VIVIENDA PRESTADA, BAJO SU CUIDADO.';
                  else if (val.startsWith('7)')) val = '7) HABITE EN UN INMUEBLE ASIGNADO, PROPIEDAD DE LA EMPRESA.';
                  else if (val.startsWith('8)')) val = '8) HABITE UN INMUEBLE BAJO OTRA CONDICIÓN DIFERENTE A LAS ANTERIORES';
                  loadedV.condicion_habitabilidad = val;
                }
                if (loadedV.discapacidad_trabajador) {
                  const d = loadedV.discapacidad_trabajador.toUpperCase().trim();
                  loadedV.discapacidad_trabajador = (d === 'SÍ' || d === 'SI' || d === 'YES') ? 'SI' : 'NO';
                }
                if (loadedV.discapacidad_familiar) {
                  const d = loadedV.discapacidad_familiar.toUpperCase().trim();
                  loadedV.discapacidad_familiar = (d === 'SÍ' || d === 'SI' || d === 'YES') ? 'SI' : 'NO';
                }
                
                return loadedV;
              })(),
              carga_familiar: data.carga_familiar || [],
              cursos_realizados: data.cursos_realizados || [],
              plan_formacion: data.plan_formacion || [],
              necesidades_extra: data.necesidades_extra || '',
              // Nuevos campos
              n_personal: data.n_personal || '',
              grupo: data.grupo || '',
              gerencia: data.gerencia || '',
              organizacion_proceso: data.organizacion_proceso || '',
              experiencia_externa: data.experiencia_externa || [],
              historico_pdvsa: data.historico_pdvsa || [],
              acciones_personal: data.acciones_personal || DEFAULT_EXPEDIENTE.acciones_personal,
              otros_idiomas: data.otros_idiomas || '',
              destrezas_habilidades: data.destrezas_habilidades || '',
              desarrollo_carrera: data.desarrollo_carrera || '',
              observaciones_ficha: data.observaciones_ficha || '',
              estudios_superiores: data.estudios_superiores || [],
              fecha_aniversaria: data.fecha_aniversaria || '',
              periodo_vacacional: data.periodo_vacacional || '',
              vacaciones_desde: data.vacaciones_desde || '',
              vacaciones_hasta: data.vacaciones_hasta || '',
              dias_habiles: data.dias_habiles || 0,
              dias_continuos: data.dias_continuos || 0,
               fecha_retorno: data.fecha_retorno || '',
              cargo_actual: data.cargo_actual || '',
              indicador: data.indicador || '',
              supervisor_nombre: data.supervisor_nombre || '',
              supervisor_cedula: data.supervisor_cedula || '',
              supervisor_telefono: data.supervisor_telefono || ''
            });
          }
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

  // Efecto de Auto-guardado Silencioso (con Debounce de 1.5s)
  useEffect(() => {
    if (loadingData || !targetCedula) return;

    // Guardar borrador local de inmediato como respaldo principal
    localStorage.setItem(`sigae_expediente_borrador_${targetCedula}`, JSON.stringify({
      formData,
      userEmail,
      userTelefono
    }));

    setSavingStatus('saving');

    const timer = setTimeout(async () => {
      try {
        if (isDemoMode) {
          // Guardado local simulado
          localStorage.setItem(`sigae_expediente_demo_${targetCedula}`, JSON.stringify(formData));
          
          if (targetCedula === user?.cedula) {
            const stored = localStorage.getItem('usuario_sigae');
            if (stored) {
              const parsed = JSON.parse(stored);
              parsed.email = userEmail;
              parsed.telefono = userTelefono;
              localStorage.setItem('usuario_sigae', JSON.stringify(parsed));
            }
          }
          setSavingStatus('saved');
        } else {
          // 1. Siempre sincronizar email y teléfono en tabla usuarios si están presentes (limitando de forma defensiva)
          const { error: userError } = await supabase
            .from('usuarios')
            .update({
              email: (userEmail || '').trim().substring(0, 100) || null,
              telefono: (userTelefono || '').trim().substring(0, 20) || null
            })
            .eq('cedula', targetCedula);

          if (userError) throw userError;

          // Actualizar localStorage de sesión si corresponde al usuario logueado
          if (targetCedula === user?.cedula) {
            const stored = localStorage.getItem('usuario_sigae');
            if (stored) {
              const parsed = JSON.parse(stored);
              parsed.email = (userEmail || '').trim().substring(0, 100);
              parsed.telefono = (userTelefono || '').trim().substring(0, 20);
              localStorage.setItem('usuario_sigae', JSON.stringify(parsed));
            }
          }

          // 2. Sólo guardamos el expediente en Supabase si se han ingresado los campos mínimos
          // de identificación (sexo y fecha de nacimiento) para evitar registros vacíos
          if (formData.sexo && formData.fecha_nacimiento) {
            const payload = {
              usuario_cedula: targetCedula,
              sexo: (formData.sexo || '').substring(0, 10),
              fecha_nacimiento: formData.fecha_nacimiento,
              estado_civil: (formData.estado_civil || '').substring(0, 20),
              direccion: `${formData.datos_vivienda.estado_hab || ''}, ${formData.datos_vivienda.municipio_hab || ''}, ${formData.datos_vivienda.parroquia_hab || ''}. ${formData.datos_vivienda.direccion_detalle || ''}`,
              titulo_obtenido: (formData.titulo_obtenido || '').substring(0, 150),
              nivel_instruccion: (formData.nivel_instruccion || '').substring(0, 100),
              universidad: (formData.universidad || '').substring(0, 150),
              anio_egreso: formData.anio_egreso,
              fecha_ingreso: formData.fecha_ingreso || null,
              tipo_nomina: (formData.tipo_nomina || '').substring(0, 50),
              carga_horaria: formData.carga_horaria,
              estatus_laboral: (formData.estatus_laboral || '').substring(0, 50),
              documentos: formData.documentos,
              datos_salud: formData.datos_salud,
              datos_electoral: formData.datos_electoral,
              datos_vivienda: formData.datos_vivienda,
              carga_familiar: formData.carga_familiar,
              cursos_realizados: formData.cursos_realizados,
              plan_formacion: formData.plan_formacion,
              necesidades_extra: formData.necesidades_extra,
              // Nuevos campos
              n_personal: formData.n_personal || '',
              grupo: formData.grupo || '',
              gerencia: formData.gerencia || '',
              organizacion_proceso: formData.organizacion_proceso || '',
              experiencia_externa: formData.experiencia_externa || [],
              historico_pdvsa: formData.historico_pdvsa || [],
              acciones_personal: formData.acciones_personal || DEFAULT_EXPEDIENTE.acciones_personal,
              otros_idiomas: formData.otros_idiomas || '',
              destrezas_habilidades: formData.destrezas_habilidades || '',
              desarrollo_carrera: formData.desarrollo_carrera || '',
              observaciones_ficha: formData.observaciones_ficha || '',
              estudios_superiores: formData.estudios_superiores || [],
              fecha_aniversaria: formData.fecha_aniversaria || null,
              periodo_vacacional: formData.periodo_vacacional || '',
              vacaciones_desde: formData.vacaciones_desde || null,
              vacaciones_hasta: formData.vacaciones_hasta || null,
              dias_habiles: formData.dias_habiles || 0,
              dias_continuos: formData.dias_continuos || 0,
              fecha_retorno: formData.fecha_retorno || null,
              cargo_actual: formData.cargo_actual || '',
              indicador: formData.indicador || '',
              supervisor_nombre: formData.supervisor_nombre || '',
              supervisor_cedula: formData.supervisor_cedula || '',
              supervisor_telefono: formData.supervisor_telefono || '',
              actualizado_en: new Date().toISOString()
            };

            const { error } = await supabase
              .from('expedientes_docentes')
              .upsert(payload, { onConflict: 'usuario_cedula' });

            if (error) throw error;
          }

          setSavingStatus('saved');
        }
      } catch (err: any) {
        console.error("Error en autosave silencioso - MSG:", err?.message || err);
        console.error("Error en autosave silencioso - CODE:", err?.code);
        console.error("Error en autosave silencioso - DETAILS:", err?.details);
        console.error("Error en autosave silencioso - HINT:", err?.hint);
        setSavingStatus('error');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [formData, userEmail, userTelefono, loadingData, isDemoMode, user?.cedula]);

  // Efecto para sincronizar automáticamente cónyuge, CONAPDIS y cantidad de convivientes en datos_vivienda (Paso 4 / Socio-Familiar)
  useEffect(() => {
    if (loadingData) return;

    // Buscar si hay esposo(a) o concubino(a) registrado en la carga familiar
    const conyugeFamiliar = formData.carga_familiar.find(
      f => f.parentesco === 'Esposo(a)' || f.parentesco === 'Concubino(a)'
    );

    const nuevoConyugeNombre = conyugeFamiliar ? conyugeFamiliar.nombres : '';
    const nuevoConyugeCedula = conyugeFamiliar ? conyugeFamiliar.cedula : '';

    // Sincronizar discapacidad del trabajador desde Paso 2 (datos_salud.conapdis)
    const tieneDiscapacidadTrabajador = (formData.datos_salud.conapdis === 'Sí') ? 'SI' : 'NO';

    // Sincronizar discapacidad familiar si ALGUN familiar de Carga Familiar tiene discapacidad CONAPDIS "Sí"
    const tieneDiscapacidadFamiliar = formData.carga_familiar.some(f => {
      const c = (f.conapdis || '').toUpperCase().trim();
      return c === 'SÍ' || c === 'SI';
    }) ? 'SI' : 'NO';

    // Calcular num_convivientes: familiares que viven con el trabajador + 1
    const nuevoNumConvivientes = formData.carga_familiar.filter(f => f.vive_con_trabajador === 'Sí').length + 1;

    // Calcular prioridad según planilla PAAV
    let nuevaPrioridad = '3.) REQUIERE ATENCIÓN NORMAL';
    const condHab = formData.datos_vivienda.condicion_habitabilidad || '';
    if (
      tieneDiscapacidadTrabajador === 'SI' ||
      tieneDiscapacidadFamiliar === 'SI' ||
      condHab.startsWith('5)') ||
      condHab.startsWith('4)')
    ) {
      nuevaPrioridad = '1.) REQUIERE ATENCIÓN INMEDIATA/CASO CRÍTICO POR ALTO RIESGO Y/O ELEVADO NIVEL DE VULNERABILIDAD';
    } else if (
      condHab.startsWith('1)') ||
      condHab.startsWith('2)') ||
      condHab.startsWith('3)')
    ) {
      nuevaPrioridad = '2.) REQUIERE ATENCIÓN MEDIA (DEBE ATENDERSE DESPUÉS DE CASOS CRÍTICOS)';
    }

    if (
      formData.datos_vivienda.conyuge_nombre !== nuevoConyugeNombre ||
      formData.datos_vivienda.conyuge_cedula !== nuevoConyugeCedula ||
      formData.datos_vivienda.discapacidad_trabajador !== tieneDiscapacidadTrabajador ||
      formData.datos_vivienda.discapacidad_familiar !== tieneDiscapacidadFamiliar ||
      formData.datos_vivienda.num_convivientes !== nuevoNumConvivientes ||
      formData.datos_vivienda.prioridad !== nuevaPrioridad
    ) {
      setFormData(prev => ({
        ...prev,
        datos_vivienda: {
          ...prev.datos_vivienda,
          conyuge_nombre: nuevoConyugeNombre,
          conyuge_cedula: nuevoConyugeCedula,
          discapacidad_trabajador: tieneDiscapacidadTrabajador,
          discapacidad_familiar: tieneDiscapacidadFamiliar,
          num_convivientes: nuevoNumConvivientes,
          prioridad: nuevaPrioridad
        }
      }));
    }
  }, [
    formData.carga_familiar,
    formData.datos_salud.conapdis,
    formData.datos_vivienda.condicion_habitabilidad,
    loadingData
  ]);

  const handleChange = (field: keyof ExpedienteData, val: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const calcularEdadRaw = (fechaNacStr: string): string => {
    if (!fechaNacStr) return 'N/A';
    const birthDate = new Date(fechaNacStr);
    if (isNaN(birthDate.getTime())) return 'N/A';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} años` : 'N/A';
  };

  const calcularAniosServicio = (fechaIngresoStr: string): string => {
    if (!fechaIngresoStr) return 'N/A';
    const ingresoDate = new Date(fechaIngresoStr);
    if (isNaN(ingresoDate.getTime())) return 'N/A';
    const today = new Date();
    let years = today.getFullYear() - ingresoDate.getFullYear();
    const m = today.getMonth() - ingresoDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < ingresoDate.getDate())) {
      years--;
    }
    return years >= 0 ? `${years} años` : 'N/A';
  };

  const estadosList = [...new Set(divPolRecords.map(r => r.estado))].sort();

  const municipiosList = formData.datos_vivienda.estado_hab
    ? [...new Set(divPolRecords
        .filter(r => r.estado === formData.datos_vivienda.estado_hab)
        .map(r => r.municipio))].sort()
    : [];

  const parroquiasList = (formData.datos_vivienda.estado_hab && formData.datos_vivienda.municipio_hab)
    ? [...new Set(divPolRecords
        .filter(r => r.estado === formData.datos_vivienda.estado_hab && r.municipio === formData.datos_vivienda.municipio_hab)
        .map(r => r.parroquia))].sort()
    : [];

  const handleEstadoHabChange = (val: string) => {
    setFormData(prev => ({
      ...prev,
      datos_vivienda: {
        ...prev.datos_vivienda,
        estado_hab: val,
        municipio_hab: '',
        parroquia_hab: ''
      }
    }));
  };

  const handleMunicipioHabChange = (val: string) => {
    setFormData(prev => ({
      ...prev,
      datos_vivienda: {
        ...prev.datos_vivienda,
        municipio_hab: val,
        parroquia_hab: ''
      }
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

  const obtenerUbicacionGPS = () => {
    if (!navigator.geolocation) {
      if (Swal) Swal.fire("Error", "Tu navegador no soporta geolocalización o acceso a ubicación.", "error");
      else alert("Tu navegador no soporta geolocalización.");
      return;
    }

    setCargandoGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
            headers: {
              'Accept-Language': 'es'
            }
          });
          const data = await res.json();
          
          if (data && data.address) {
            const addr = data.address;
            const state = addr.state || '';
            const county = addr.county || addr.city || addr.town || addr.municipality || '';
            const parish = addr.suburb || addr.village || addr.neighbourhood || addr.hamlet || '';
            
            const cleanState = state.trim().replace(/^(estado)\s+/i, '');
            const cleanCounty = county.trim().replace(/^(municipio)\s+/i, '');
            const cleanParish = parish.trim().replace(/^(parroquia)\s+/i, '');
            
            let matched = divPolRecords.find(r => {
              const rMuni = r.municipio.toLowerCase();
              const rParro = r.parroquia.toLowerCase();
              
              if (cleanCounty && cleanParish) {
                return rMuni.includes(cleanCounty.toLowerCase()) && rParro.includes(cleanParish.toLowerCase());
              } else if (cleanCounty) {
                return rMuni.includes(cleanCounty.toLowerCase());
              }
              return false;
            });
            
            const detailAddressArr = [];
            if (addr.amenity) detailAddressArr.push(addr.amenity);
            if (addr.road) detailAddressArr.push(addr.road);
            if (addr.neighbourhood) detailAddressArr.push(addr.neighbourhood);
            if (addr.suburb && addr.suburb !== addr.neighbourhood) detailAddressArr.push(addr.suburb);
            
            const detailStr = detailAddressArr.join(', ') || 'Ubicación por GPS';
            
            setFormData(prev => {
              const updatedVivienda = { ...prev.datos_vivienda };
              if (matched) {
                updatedVivienda.estado_hab = matched.estado;
                updatedVivienda.municipio_hab = matched.municipio;
                updatedVivienda.parroquia_hab = matched.parroquia;
              } else {
                if (cleanState) updatedVivienda.estado_hab = formatTitleCase(cleanState);
                if (cleanCounty) updatedVivienda.municipio_hab = formatTitleCase(cleanCounty);
                if (cleanParish) updatedVivienda.parroquia_hab = formatTitleCase(cleanParish);
              }
              updatedVivienda.direccion_detalle = detailStr;
              
              return {
                ...prev,
                direccion: `${updatedVivienda.estado_hab || ''}, ${updatedVivienda.municipio_hab || ''}, ${updatedVivienda.parroquia_hab || ''}. ${detailStr}`,
                datos_vivienda: updatedVivienda
              };
            });
            
            if (Swal) {
              Swal.fire({
                title: "Ubicación Obtenida",
                text: `Se ha cargado la dirección: ${matched ? matched.estado + ', ' + matched.municipio + ', ' + matched.parroquia : cleanState + ', ' + cleanCounty}. Detalle: ${detailStr}`,
                icon: "success",
                confirmButtonColor: "#10b981"
              });
            } else {
              alert("Ubicación cargada.");
            }
          } else {
            if (Swal) Swal.fire("Aviso", "No se pudo obtener información de dirección para las coordenadas GPS.", "warning");
            else alert("No se pudo obtener la dirección.");
          }
        } catch (e) {
          console.error("Error reverse geocoding:", e);
          if (Swal) Swal.fire("Error", "Ocurrió un error al consultar el servicio de mapas para obtener la dirección.", "error");
          else alert("Error al consultar el servicio de mapas.");
        } finally {
          setCargandoGPS(false);
        }
      },
      (error) => {
        console.error("GPS coordinates access error:", error);
        setCargandoGPS(false);
        let msg = "No se pudo obtener la ubicación.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Acceso a la geolocalización denegado. Activa los permisos de ubicación en tu navegador.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "La ubicación no está disponible actualmente.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Tiempo de espera agotado al obtener la ubicación.";
        }
        if (Swal) Swal.fire("Ubicación por GPS", msg, "warning");
        else alert(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
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

  const editarFamiliar = (index: number) => {
    const f = formData.carga_familiar[index];
    setFamNombre(f.nombres);
    setFamParentesco(f.parentesco);
    setFamCedula(f.cedula);
    setFamFechaNac(f.fecha_nacimiento);
    setFamVive(f.vive_con_trabajador);
    setFamCondicionNeuro(f.condicion_neuro || '');
    setFamConapdis(f.conapdis || 'No');
    setEditingFamiliarIndex(index);
  };

  const cancelarEdicionFamiliar = () => {
    setFamNombre('');
    setFamParentesco('Hijo(a)');
    setFamCedula('');
    setFamFechaNac('');
    setFamVive('Sí');
    setFamCondicionNeuro('');
    setFamConapdis('No');
    setEditingFamiliarIndex(null);
  };

  const agregarFamiliar = () => {
    if (!famNombre.trim()) {
      if (Swal) Swal.fire("Atención", "El nombre del familiar es requerido.", "warning");
      return;
    }
    const nuevo: Familiar = {
      nombres: formatTitleCase(famNombre.trim()),
      parentesco: famParentesco,
      cedula: famCedula.trim(),
      fecha_nacimiento: famFechaNac,
      vive_con_trabajador: famVive,
      condicion_neuro: formatTitleCase(famCondicionNeuro.trim()) || 'Neurotípico',
      conapdis: famConapdis
    };

    if (editingFamiliarIndex !== null) {
      setFormData(prev => {
        const nuevaCarga = [...prev.carga_familiar];
        nuevaCarga[editingFamiliarIndex] = nuevo;
        return {
          ...prev,
          carga_familiar: nuevaCarga
        };
      });
      setEditingFamiliarIndex(null);
    } else {
      setFormData(prev => ({
        ...prev,
        carga_familiar: [...prev.carga_familiar, nuevo]
      }));
    }
    // Clear inputs
    setFamNombre('');
    setFamParentesco('Hijo(a)');
    setFamCedula('');
    setFamFechaNac('');
    setFamVive('Sí');
    setFamCondicionNeuro('');
    setFamConapdis('No');
  };

  const eliminarFamiliar = (index: number) => {
    if (editingFamiliarIndex === index) {
      cancelarEdicionFamiliar();
    } else if (editingFamiliarIndex !== null && index < editingFamiliarIndex) {
      setEditingFamiliarIndex(editingFamiliarIndex - 1);
    }
    setFormData(prev => ({
      ...prev,
      carga_familiar: prev.carga_familiar.filter((_, idx) => idx !== index)
    }));
  };

  const editarCurso = (index: number) => {
    const c = formData.cursos_realizados[index];
    setCurTitulo(c.titulo);
    setCurLugar(c.lugar);
    setCurHoras(c.horas);
    setCurFecha(c.fecha);
    setEditingCursoIndex(index);
  };

  const cancelarEdicionCurso = () => {
    setCurTitulo('');
    setCurLugar('');
    setCurHoras('');
    setCurFecha('');
    setEditingCursoIndex(null);
  };

  const agregarCurso = () => {
    if (!curTitulo.trim()) {
      if (Swal) Swal.fire("Atención", "El título del curso es requerido.", "warning");
      return;
    }
    const nuevo: Curso = {
      titulo: formatTitleCase(curTitulo.trim()),
      lugar: formatTitleCase(curLugar.trim()),
      horas: curHoras.trim(),
      fecha: curFecha
    };

    if (editingCursoIndex !== null) {
      setFormData(prev => {
        const nuevosCursos = [...prev.cursos_realizados];
        nuevosCursos[editingCursoIndex] = nuevo;
        return {
          ...prev,
          cursos_realizados: nuevosCursos
        };
      });
      setEditingCursoIndex(null);
    } else {
      setFormData(prev => ({
        ...prev,
        cursos_realizados: [...prev.cursos_realizados, nuevo]
      }));
    }
    // Clear inputs
    setCurTitulo('');
    setCurLugar('');
    setCurHoras('');
    setCurFecha('');
  };

  const eliminarCurso = (index: number) => {
    if (editingCursoIndex === index) {
      cancelarEdicionCurso();
    } else if (editingCursoIndex !== null && index < editingCursoIndex) {
      setEditingCursoIndex(editingCursoIndex - 1);
    }
    setFormData(prev => ({
      ...prev,
      cursos_realizados: prev.cursos_realizados.filter((_, idx) => idx !== index)
    }));
  };

  const agregarEstudio = () => {
    if (!estTitulo.trim()) {
      if (Swal) Swal.fire("Atención", "El nombre del título obtenido es requerido.", "warning");
      return;
    }
    if (!estUniversidad.trim()) {
      if (Swal) Swal.fire("Atención", "La institución o universidad es requerida.", "warning");
      return;
    }
    const nuevo = {
      nivel: estNivel,
      titulo: formatTitleCase(estTitulo.trim()),
      universidad: formatTitleCase(estUniversidad.trim()),
      anio_egreso: estAnio
    };

    setFormData(prev => {
      const lista = prev.estudios_superiores ? [...prev.estudios_superiores] : [];
      const nuevaLista = [...lista];
      if (editingEstudioIndex !== null) {
        nuevaLista[editingEstudioIndex] = nuevo;
      } else {
        nuevaLista.push(nuevo);
      }
      return {
        ...prev,
        estudios_superiores: nuevaLista
      };
    });

    // Reset inputs
    setEstTitulo('');
    setEstUniversidad('');
    setEstAnio(new Date().getFullYear());
    setEditingEstudioIndex(null);
  };

  const editarEstudio = (index: number) => {
    const lista = formData.estudios_superiores || [];
    const est = lista[index];
    if (est) {
      setEstNivel(est.nivel || 'Licenciatura / Profesorado');
      setEstTitulo(est.titulo || '');
      setEstUniversidad(est.universidad || '');
      setEstAnio(est.anio_egreso || new Date().getFullYear());
      setEditingEstudioIndex(index);
    }
  };

  const eliminarEstudio = (index: number) => {
    setFormData(prev => {
      const lista = prev.estudios_superiores ? [...prev.estudios_superiores] : [];
      return {
        ...prev,
        estudios_superiores: lista.filter((_, idx) => idx !== index)
      };
    });
    if (editingEstudioIndex === index) {
      setEditingEstudioIndex(null);
      setEstTitulo('');
      setEstUniversidad('');
      setEstAnio(new Date().getFullYear());
    }
  };

  const cancelarEdicionEstudio = () => {
    setEstTitulo('');
    setEstUniversidad('');
    setEstAnio(new Date().getFullYear());
    setEditingEstudioIndex(null);
  };

  const handleToggleCursoPlan = (curso: PlanCurso) => {
    const isSelected = formData.plan_formacion?.some(c => c.titulo === curso.titulo) || false;
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        plan_formacion: prev.plan_formacion.filter(c => c.titulo !== curso.titulo)
      }));
    } else {
      if ((formData.plan_formacion?.length || 0) >= 5) {
        if (Swal) {
          Swal.fire({
            title: "Plan de Formación",
            text: "Solo puedes seleccionar un máximo de 5 formaciones del catálogo.",
            icon: "warning",
            confirmButtonColor: "#10b981"
          });
        } else {
          alert("Solo puedes seleccionar un máximo de 5 formaciones.");
        }
        return;
      }
      setFormData(prev => ({
        ...prev,
        plan_formacion: [...(prev.plan_formacion || []), curso]
      }));
    }
  };

  // ==========================================================================
  // HANDLERS PARA FICHA LABORAL (HISTÓRICO PDVSA / INSTITUCIÓN DE ORIGEN)
  // ==========================================================================
  const agregarHistorico = () => {
    if (!histEmpresa.trim()) {
      if (Swal) Swal.fire("Atención", "El nombre de la empresa/institución es requerido.", "warning");
      return;
    }
    if (!histCargo.trim()) {
      if (Swal) Swal.fire("Atención", "El cargo desempeñado es requerido.", "warning");
      return;
    }
    const nuevo = {
      empresa: formatTitleCase(histEmpresa.trim()),
      cargo: formatTitleCase(histCargo.trim()),
      fecha_inicio: histInicio,
      fecha_fin: histFin || 'Actualidad'
    };

    setFormData(prev => {
      const lista = prev.historico_pdvsa ? [...prev.historico_pdvsa] : [];
      const nuevaLista = [...lista];
      if (editingHistIndex !== null) {
        nuevaLista[editingHistIndex] = nuevo;
      } else {
        nuevaLista.push(nuevo);
      }
      return {
        ...prev,
        historico_pdvsa: nuevaLista
      };
    });

    // Reset inputs
    setHistEmpresa('');
    setHistCargo('');
    setHistInicio('');
    setHistFin('');
    setEditingHistIndex(null);
  };

  const editarHistorico = (index: number) => {
    const lista = formData.historico_pdvsa || [];
    const hist = lista[index];
    if (hist) {
      setHistEmpresa(hist.empresa || '');
      setHistCargo(hist.cargo || '');
      setHistInicio(hist.fecha_inicio || '');
      setHistFin(hist.fecha_fin === 'Actualidad' ? '' : hist.fecha_fin || '');
      setEditingHistIndex(index);
    }
  };

  const eliminarHistorico = (index: number) => {
    setFormData(prev => {
      const lista = prev.historico_pdvsa ? [...prev.historico_pdvsa] : [];
      return {
        ...prev,
        historico_pdvsa: lista.filter((_, idx) => idx !== index)
      };
    });
    if (editingHistIndex === index) {
      setEditingHistIndex(null);
      setHistEmpresa('');
      setHistCargo('');
      setHistInicio('');
      setHistFin('');
    }
  };

  const cancelarEdicionHistorico = () => {
    setHistEmpresa('');
    setHistCargo('');
    setHistInicio('');
    setHistFin('');
    setEditingHistIndex(null);
  };

  // ==========================================================================
  // HANDLERS PARA ACCIONES DE PERSONAL (PROMOCIONES, EVALUACIONES, SALARIOS)
  // ==========================================================================
  
  // 1. Promociones
  const agregarPromocion = () => {
    if (!promCargoNuevo.trim()) {
      if (Swal) Swal.fire("Atención", "El nuevo cargo es requerido.", "warning");
      return;
    }
    const nuevo = {
      fecha: promFecha || new Date().toISOString().split('T')[0],
      cargo_anterior: formatTitleCase(promCargoAnt.trim()) || 'N/A',
      cargo_nuevo: formatTitleCase(promCargoNuevo.trim()),
      observacion: promObs.trim() || 'S/N'
    };
    setFormData(prev => {
      const acciones = prev.acciones_personal || { promocion: [], evaluacion: [], salario: [] };
      const list = acciones.promocion || [];
      const newList = [...list];
      if (editingPromIndex !== null) {
        newList[editingPromIndex] = nuevo;
      } else {
        newList.push(nuevo);
      }
      return {
        ...prev,
        acciones_personal: {
          promocion: newList,
          evaluacion: acciones.evaluacion || [],
          salario: acciones.salario || []
        }
      };
    });
    setPromFecha('');
    setPromCargoAnt('');
    setPromCargoNuevo('');
    setPromObs('');
    setEditingPromIndex(null);
  };

  const editarPromocion = (index: number) => {
    const list = formData.acciones_personal?.promocion || [];
    const item = list[index];
    if (item) {
      setPromFecha(item.fecha || '');
      setPromCargoAnt(item.cargo_anterior || '');
      setPromCargoNuevo(item.cargo_nuevo || '');
      setPromObs(item.observacion || '');
      setEditingPromIndex(index);
    }
  };

  const eliminarPromocion = (index: number) => {
    setFormData(prev => {
      const acciones = prev.acciones_personal || { promocion: [], evaluacion: [], salario: [] };
      const list = (acciones.promocion || []).filter((_, idx) => idx !== index);
      return {
        ...prev,
        acciones_personal: {
          promocion: list,
          evaluacion: acciones.evaluacion || [],
          salario: acciones.salario || []
        }
      };
    });
    if (editingPromIndex === index) {
      setEditingPromIndex(null);
      setPromFecha('');
      setPromCargoAnt('');
      setPromCargoNuevo('');
      setPromObs('');
    }
  };

  const cancelarEdicionPromocion = () => {
    setPromFecha('');
    setPromCargoAnt('');
    setPromCargoNuevo('');
    setPromObs('');
    setEditingPromIndex(null);
  };

  // 2. Evaluaciones
  const agregarEvaluacion = () => {
    if (!evalPeriodo.trim()) {
      if (Swal) Swal.fire("Atención", "El periodo evaluado es requerido.", "warning");
      return;
    }
    const nuevo = {
      periodo: evalPeriodo.trim(),
      calificacion: evalCalificacion,
      puntaje: evalPuntaje.trim() || 'N/A',
      evaluador: formatTitleCase(evalEvaluador.trim()) || 'Supervisor'
    };
    setFormData(prev => {
      const acciones = prev.acciones_personal || { promocion: [], evaluacion: [], salario: [] };
      const list = acciones.evaluacion || [];
      const newList = [...list];
      if (editingEvalIndex !== null) {
        newList[editingEvalIndex] = nuevo;
      } else {
        newList.push(nuevo);
      }
      return {
        ...prev,
        acciones_personal: {
          promocion: acciones.promocion || [],
          evaluacion: newList,
          salario: acciones.salario || []
        }
      };
    });
    setEvalPeriodo('');
    setEvalCalificacion('Excelente');
    setEvalPuntaje('');
    setEvalEvaluador('');
    setEditingEvalIndex(null);
  };

  const editarEvaluacion = (index: number) => {
    const list = formData.acciones_personal?.evaluacion || [];
    const item = list[index];
    if (item) {
      setEvalPeriodo(item.periodo || '');
      setEvalCalificacion(item.calificacion || 'Excelente');
      setEvalPuntaje(item.puntaje || '');
      setEvalEvaluador(item.evaluador || '');
      setEditingEvalIndex(index);
    }
  };

  const eliminarEvaluacion = (index: number) => {
    setFormData(prev => {
      const acciones = prev.acciones_personal || { promocion: [], evaluacion: [], salario: [] };
      const list = (acciones.evaluacion || []).filter((_, idx) => idx !== index);
      return {
        ...prev,
        acciones_personal: {
          promocion: acciones.promocion || [],
          evaluacion: list,
          salario: acciones.salario || []
        }
      };
    });
    if (editingEvalIndex === index) {
      setEditingEvalIndex(null);
      setEvalPeriodo('');
      setEvalCalificacion('Excelente');
      setEvalPuntaje('');
      setEvalEvaluador('');
    }
  };

  const cancelarEdicionEvaluacion = () => {
    setEvalPeriodo('');
    setEvalCalificacion('Excelente');
    setEvalPuntaje('');
    setEvalEvaluador('');
    setEditingEvalIndex(null);
  };

  // 3. Ajustes Salariales
  const agregarSalario = () => {
    if (!salMontoNuevo.trim()) {
      if (Swal) Swal.fire("Atención", "El nuevo salario es requerido.", "warning");
      return;
    }
    const nuevo = {
      fecha: salFecha || new Date().toISOString().split('T')[0],
      salario_anterior: salMontoAnt.trim() || '0.00',
      salario_nuevo: salMontoNuevo.trim(),
      motivo: salMotivo.trim() || 'Ajuste Salarial'
    };
    setFormData(prev => {
      const acciones = prev.acciones_personal || { promocion: [], evaluacion: [], salario: [] };
      const list = acciones.salario || [];
      const newList = [...list];
      if (editingSalIndex !== null) {
        newList[editingSalIndex] = nuevo;
      } else {
        newList.push(nuevo);
      }
      return {
        ...prev,
        acciones_personal: {
          promocion: acciones.promocion || [],
          evaluacion: acciones.evaluacion || [],
          salario: newList
        }
      };
    });
    setSalFecha('');
    setSalMontoAnt('');
    setSalMontoNuevo('');
    setSalMotivo('');
    setEditingSalIndex(null);
  };

  const editarSalario = (index: number) => {
    const list = formData.acciones_personal?.salario || [];
    const item = list[index];
    if (item) {
      setSalFecha(item.fecha || '');
      setSalMontoAnt(item.salario_anterior || '');
      setSalMontoNuevo(item.salario_nuevo || '');
      setSalMotivo(item.motivo || '');
      setEditingSalIndex(index);
    }
  };

  const eliminarSalario = (index: number) => {
    setFormData(prev => {
      const acciones = prev.acciones_personal || { promocion: [], evaluacion: [], salario: [] };
      const list = (acciones.salario || []).filter((_, idx) => idx !== index);
      return {
        ...prev,
        acciones_personal: {
          promocion: acciones.promocion || [],
          evaluacion: acciones.evaluacion || [],
          salario: list
        }
      };
    });
    if (editingSalIndex === index) {
      setEditingSalIndex(null);
      setSalFecha('');
      setSalMontoAnt('');
      setSalMontoNuevo('');
      setSalMotivo('');
    }
  };

  const cancelarEdicionSalario = () => {
    setSalFecha('');
    setSalMontoAnt('');
    setSalMontoNuevo('');
    setSalMotivo('');
    setEditingSalIndex(null);
  };

  // ==========================================================================
  // HELPERS Y EFECTOS PARA PLANIFICACIÓN DE VACACIONES (PAAV)
  // ==========================================================================
  const calcularFechasVacaciones = (desde: string, hasta: string) => {
    if (!desde || !hasta) return { habiles: 0, continuos: 0 };
    const dateDesde = new Date(desde);
    const dateHasta = new Date(hasta);
    if (isNaN(dateDesde.getTime()) || isNaN(dateHasta.getTime())) return { habiles: 0, continuos: 0 };
    if (dateHasta < dateDesde) return { habiles: 0, continuos: 0 };

    // Días continuos
    const diffTime = Math.abs(dateHasta.getTime() - dateDesde.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Días hábiles
    let habiles = 0;
    const curDate = new Date(dateDesde);
    while (curDate <= dateHasta) {
      const day = curDate.getDay();
      if (day !== 0 && day !== 6) {
        habiles++;
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    return { habiles, continuos: diffDays };
  };

  const calcularFechaRetorno = (hastaStr: string): string => {
    if (!hastaStr) return '';
    const dateHasta = new Date(hastaStr);
    if (isNaN(dateHasta.getTime())) return '';
    
    const retorno = new Date(dateHasta);
    retorno.setDate(retorno.getDate() + 1);
    
    while (retorno.getDay() === 0 || retorno.getDay() === 6) {
      retorno.setDate(retorno.getDate() + 1);
    }
    
    const yyyy = retorno.getFullYear();
    const mm = String(retorno.getMonth() + 1).padStart(2, '0');
    const dd = String(retorno.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Sincronizar cálculos de vacaciones automáticamente
  useEffect(() => {
    if (!formData.vacaciones_desde || !formData.vacaciones_hasta) return;
    const { habiles, continuos } = calcularFechasVacaciones(formData.vacaciones_desde, formData.vacaciones_hasta);
    const retorno = calcularFechaRetorno(formData.vacaciones_hasta);
    if (
      formData.dias_habiles !== habiles ||
      formData.dias_continuos !== continuos ||
      formData.fecha_retorno !== retorno
    ) {
      setFormData(prev => ({
        ...prev,
        dias_habiles: habiles,
        dias_continuos: continuos,
        fecha_retorno: retorno
      }));
    }
  }, [formData.vacaciones_desde, formData.vacaciones_hasta]);

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
      
      const cleanPhone = userTelefono.replace(/\D/g, '');
      if (cleanPhone.length > 0 && cleanPhone.length < 11) {
        if (Swal) Swal.fire("Atención", "El número de teléfono celular debe tener 11 dígitos (Ej: 0412-1234567).", "warning");
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
      if (!formData.datos_vivienda.estado_hab) {
        if (Swal) Swal.fire("Atención", "Debe seleccionar el estado de habitación.", "warning");
        return false;
      }
      if (!formData.datos_vivienda.municipio_hab) {
        if (Swal) Swal.fire("Atención", "Debe seleccionar el municipio de habitación.", "warning");
        return false;
      }
      if (!formData.datos_vivienda.parroquia_hab) {
        if (Swal) Swal.fire("Atención", "Debe seleccionar la parroquia de habitación.", "warning");
        return false;
      }
      if (!formData.datos_vivienda.direccion_detalle.trim()) {
        if (Swal) Swal.fire("Atención", "La dirección detallada de habitación es requerida.", "warning");
        return false;
      }
    } else if (step === 2) {
      const cleanEmerg = (formData.datos_salud.emergencia_tel || '').replace(/\D/g, '');
      if (cleanEmerg.length > 0 && cleanEmerg.length < 11) {
        if (Swal) Swal.fire("Atención", "El teléfono del contacto de emergencia debe tener 11 dígitos (Ej: 0414-1234567).", "warning");
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
      return true; // Plan de formacion opcional
    } else if (step === 7) {
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
        localStorage.setItem(`sigae_expediente_demo_${targetCedula}`, JSON.stringify(formData));
        
        // Simular guardado de correo y teléfono del usuario en local storage si corresponde
        if (targetCedula === user?.cedula) {
          const stored = localStorage.getItem('usuario_sigae');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.email = userEmail;
            parsed.telefono = userTelefono;
            localStorage.setItem('usuario_sigae', JSON.stringify(parsed));
          }
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
          usuario_cedula: targetCedula,
          sexo: (formData.sexo || '').substring(0, 10),
          fecha_nacimiento: formData.fecha_nacimiento,
          estado_civil: (formData.estado_civil || '').substring(0, 20),
          direccion: `${formData.datos_vivienda.estado_hab || ''}, ${formData.datos_vivienda.municipio_hab || ''}, ${formData.datos_vivienda.parroquia_hab || ''}. ${formData.datos_vivienda.direccion_detalle || ''}`,
          titulo_obtenido: (formData.titulo_obtenido || '').substring(0, 150),
          nivel_instruccion: (formData.nivel_instruccion || '').substring(0, 100),
          universidad: (formData.universidad || '').substring(0, 150),
          anio_egreso: formData.anio_egreso,
          fecha_ingreso: formData.fecha_ingreso || null,
          tipo_nomina: (formData.tipo_nomina || '').substring(0, 50),
          carga_horaria: formData.carga_horaria,
          estatus_laboral: (formData.estatus_laboral || '').substring(0, 50),
          documentos: formData.documentos,
          datos_salud: formData.datos_salud,
          datos_electoral: formData.datos_electoral,
          datos_vivienda: formData.datos_vivienda,
          carga_familiar: formData.carga_familiar,
          cursos_realizados: formData.cursos_realizados,
          plan_formacion: formData.plan_formacion,
          necesidades_extra: formData.necesidades_extra,
          // Nuevos campos
          n_personal: formData.n_personal || '',
          grupo: formData.grupo || '',
          gerencia: formData.gerencia || '',
          organizacion_proceso: formData.organizacion_proceso || '',
          experiencia_externa: formData.experiencia_externa || [],
          historico_pdvsa: formData.historico_pdvsa || [],
          acciones_personal: formData.acciones_personal || DEFAULT_EXPEDIENTE.acciones_personal,
          otros_idiomas: formData.otros_idiomas || '',
          destrezas_habilidades: formData.destrezas_habilidades || '',
          desarrollo_carrera: formData.desarrollo_carrera || '',
          observaciones_ficha: formData.observaciones_ficha || '',
          estudios_superiores: formData.estudios_superiores || [],
          fecha_aniversaria: formData.fecha_aniversaria || null,
          periodo_vacacional: formData.periodo_vacacional || '',
          vacaciones_desde: formData.vacaciones_desde || null,
          vacaciones_hasta: formData.vacaciones_hasta || null,
          dias_habiles: formData.dias_habiles || 0,
          dias_continuos: formData.dias_continuos || 0,
          fecha_retorno: formData.fecha_retorno || null,
          cargo_actual: formData.cargo_actual || '',
          indicador: formData.indicador || '',
          supervisor_nombre: formData.supervisor_nombre || '',
          supervisor_cedula: formData.supervisor_cedula || '',
          supervisor_telefono: formData.supervisor_telefono || '',
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
            email: (userEmail || '').trim().substring(0, 100) || null,
            telefono: (userTelefono || '').trim().substring(0, 20) || null
          })
          .eq('cedula', targetCedula);

        if (userError) throw userError;

        // Sincronizar local storage para reflejar el cambio inmediato si corresponde
        if (targetCedula === user?.cedula) {
          const stored = localStorage.getItem('usuario_sigae');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.email = (userEmail || '').trim().substring(0, 100);
            parsed.telefono = (userTelefono || '').trim().substring(0, 20);
            localStorage.setItem('usuario_sigae', JSON.stringify(parsed));
          }
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

  const getCategoryCount = (cat: string) => {
    if (cat === 'Todas') return CATALOGO_PLAN_FORMACION.length;
    return CATALOGO_PLAN_FORMACION.filter(c => c.categoria === cat).length;
  };

  const filteredCursos = CATALOGO_PLAN_FORMACION.filter(c => {
    const coincideCategoria = categoriaSeleccionada === 'Todas' || c.categoria === categoriaSeleccionada;
    const coincideBusqueda = !busquedaCurso || 
      c.titulo.toLowerCase().includes(busquedaCurso.toLowerCase()) || 
      c.categoria.toLowerCase().includes(busquedaCurso.toLowerCase()) || 
      c.nivel.toLowerCase().includes(busquedaCurso.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

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
    <div className="modulo-animado container-fluid p-0 expediente-wizard">
      <style>{`
        .expediente-wizard .step-nav-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 9999px; /* pill for mobile */
          font-weight: 600;
          font-size: 0.8rem;
          white-space: nowrap;
          border: 1px solid #c6e6d4;
          background: linear-gradient(135deg, #f0fdf4, #e6f4ea);
          color: #1a7a4a;
          transition: all 0.2s ease-in-out;
          cursor: pointer;
        }
        .expediente-wizard .step-nav-btn-desktop {
          border-radius: 0.5rem; /* rounded-3 for desktop */
          font-size: 0.82rem;
          width: 100%;
          text-align: left;
        }
        .expediente-wizard .step-nav-btn:hover,
        .expediente-wizard .step-nav-btn.active {
          background: linear-gradient(135deg, #059669, #10b981) !important;
          color: #ffffff !important;
          border-color: #047857 !important;
        }
        .expediente-wizard .step-num-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-weight: bold;
          width: 24px;
          height: 24px;
          min-width: 24px;
          background-color: #059669;
          color: #ffffff;
          font-size: 0.75rem;
          transition: all 0.2s ease-in-out;
        }
        .expediente-wizard .step-nav-btn-desktop .step-num-badge {
          width: 26px;
          height: 26px;
          min-width: 26px;
          font-size: 0.78rem;
        }
        .expediente-wizard .step-nav-btn:hover .step-num-badge,
        .expediente-wizard .step-nav-btn.active .step-num-badge {
          background-color: #ffffff !important;
          color: #059669 !important;
        }
        .expediente-wizard .input-moderno:focus {
          border-color: #10b981 !important;
          box-shadow: 0 0 0 0.25rem rgba(16, 185, 129, 0.15) !important;
        }
        .expediente-wizard .check-verde:checked {
          background-color: #10b981 !important;
          border-color: #10b981 !important;
        }
        .expediente-wizard .sidebar-pasos-expediente {
          width: 100%;
          margin-bottom: 1.5rem;
        }
        @media (min-width: 992px) {
          .expediente-wizard .sidebar-pasos-expediente {
            width: 210px !important;
            margin-bottom: 0;
          }
        }
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .banner-modulo, 
          .navbar, 
          .sidebar-pasos-expediente, 
          .nav-pills, 
          .btn, 
          .alert,
          hr,
          .hr,
          #chatbot-bubble,
          .chatbot-container,
          .chatbot-window,
          .d-flex.justify-content-between hr,
          .d-flex.justify-content-between div,
          header {
            display: none !important;
          }
          .wizard-panel {
            display: block !important;
            opacity: 1 !important;
            page-break-after: always;
          }
          .card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          input, select, textarea {
            border: none !important;
            border-bottom: 1px solid #000000 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: transparent !important;
            color: #000000 !important;
            padding: 2px 0 !important;
          }
          input[disabled], select[disabled], textarea[disabled] {
            background: transparent !important;
            color: #000000 !important;
          }
        }
      `}</style>
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
                  <div className="d-flex gap-2">
                    <button 
                      onClick={() => window.print()} 
                      className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto d-flex align-items-center gap-1.5 text-success"
                    >
                      <i className="bi bi-printer-fill"></i> Imprimir Ficha de RRHH
                    </button>
                    <button 
                      onClick={() => navigate('/categoria/Gestión%20Docente')} 
                      className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                    >
                      <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
                    </button>
                  </div>
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
            
            {/* Cabecera del formulario con indicador de guardado silencioso */}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <h5 className="fw-bold text-dark mb-0"><i className="bi bi-card-checklist me-2 text-success"></i>Formulario de Registro</h5>
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

            {/* Desktop & Mobile: navegación responsiva según rol */}
            <div className={mostrarPaso7 ? "d-flex flex-column gap-3" : "d-flex flex-column flex-lg-row gap-4"}>
              
              {mostrarPaso7 ? (
                // Vista del Administrador: Menú de Pestañas (Tabs)
                <ul className="nav nav-pills border-0 bg-light p-2 rounded-4 mb-3 flex-wrap gap-2 d-flex list-unstyled">
                  {[
                    { num: 1, icon: 'bi-person-fill', label: '1. Identificación' },
                    { num: 2, icon: 'bi-heart-pulse-fill', label: '2. Salud y Tallas' },
                    { num: 3, icon: 'bi-people-fill', label: '3. Núcleo Familiar' },
                    { num: 4, icon: 'bi-geo-alt-fill', label: '4. Electoral y Vivienda' },
                    { num: 5, icon: 'bi-mortarboard-fill', label: '5. Formación' },
                    { num: 6, icon: 'bi-journal-bookmark-fill', label: '6. Plan de Formación' },
                    { num: 7, icon: 'bi-briefcase-fill', label: '7. Ficha Laboral' },
                    { num: 8, icon: 'bi-patch-check-fill', label: '8. Acciones y Eval.' },
                    { num: 9, icon: 'bi-file-earmark-check-fill', label: '9. Soportes RRHH' },
                    { num: 10, icon: 'bi-calendar-date-fill', label: '10. PAAV Vacaciones' },
                  ].map(tab => (
                    <li key={tab.num} className="nav-item flex-grow-1 flex-md-grow-0">
                      <button
                        type="button"
                        onClick={() => setActiveStep(tab.num)}
                        className={`btn border-0 rounded-3 px-3 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 w-100 ${activeStep === tab.num ? 'bg-success text-white shadow' : 'text-muted bg-white'}`}
                        style={{ fontSize: '0.85rem', transition: 'all 0.2s' }}
                      >
                        <i className={`bi ${tab.icon}`}></i>
                        <span>{tab.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                // Vista del Docente: Sidebar lateral de navegación de pasos
                <div className="sidebar-pasos-expediente flex-shrink-0">
                  <div className="d-flex flex-column gap-2 sticky-top" style={{ top: '80px' }}>
                    {[
                      { num: 1, icon: 'bi-person-fill', label: 'Identificación y Contacto' },
                      { num: 2, icon: 'bi-heart-pulse-fill', label: 'Salud y Tallas' },
                      { num: 3, icon: 'bi-people-fill', label: 'Carga y Núcleo Familiar' },
                      { num: 4, icon: 'bi-geo-alt-fill', label: 'Electoral y Socio-Familiar' },
                      { num: 5, icon: 'bi-mortarboard-fill', label: 'Formación Académica' },
                      { num: 6, icon: 'bi-journal-bookmark-fill', label: 'Plan de Formación' },
                    ].map(step => (
                      <button
                        key={step.num}
                        type="button"
                        onClick={() => setActiveStep(step.num)}
                        className={`step-nav-btn step-nav-btn-desktop ${activeStep === step.num ? 'active' : ''}`}
                      >
                        <span className="step-num-badge">{step.num}</span>
                        <i className={`bi ${step.icon} me-1`}></i>
                        <span className="text-truncate">{step.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Panels */}
              <div className="flex-grow-1" style={{ minWidth: 0 }}>

            {/* STEP 1: PERSONAL INFORMATION */}
            <div className={`wizard-panel ${activeStep === 1 ? 'activo' : ''}`}>
              <div className="seccion-titulo"><i className="bi bi-person-fill me-2 text-success"></i>Paso 1: Información Personal y de Contacto</div>
              
              {/* Account Data Box (Read-Only) */}
              <div className="bg-light p-3 rounded-4 mb-4 border">
                <div className="row g-3">
                  <div className="col-md-6">
                    <span className="small fw-bold text-muted d-block">Nombre Completo</span>
                    <span className="fw-bold text-dark">{targetUserName || user?.nombre_completo || user?.nombre}</span>
                  </div>
                  <div className="col-md-6">
                    <span className="small fw-bold text-muted d-block">Cédula de Identidad</span>
                    <span className="fw-bold text-dark">{targetCedula}</span>
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
                    placeholder="Ej. 0412-1234567"
                    value={userTelefono}
                    onChange={(e) => setUserTelefono(formatPhoneNumber(e.target.value))}
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
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Fecha de Nacimiento <span className="text-danger">*</span></label>
                  <input 
                    type="date"
                    className="form-control input-moderno"
                    value={formData.fecha_nacimiento}
                    onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Edad (Calculada)</label>
                  <input 
                    type="text"
                    className="form-control input-moderno"
                    value={calcularEdadRaw(formData.fecha_nacimiento)}
                    disabled
                    readOnly
                    style={{ backgroundColor: '#f8fafc', color: '#1e293b', fontWeight: 'bold' }}
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
                
                <div className="col-md-4">
                  <label className="form-label">Estado de Habitación <span className="text-danger">*</span></label>
                  <select 
                    className="form-select input-moderno"
                    value={formData.datos_vivienda.estado_hab}
                    onChange={(e) => handleEstadoHabChange(e.target.value)}
                  >
                    <option value="">Seleccione...</option>
                    {estadosList.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Municipio de Habitación <span className="text-danger">*</span></label>
                  <select 
                    className="form-select input-moderno"
                    value={formData.datos_vivienda.municipio_hab}
                    onChange={(e) => handleMunicipioHabChange(e.target.value)}
                    disabled={!formData.datos_vivienda.estado_hab}
                  >
                    <option value="">Seleccione...</option>
                    {municipiosList.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Parroquia de Habitación <span className="text-danger">*</span></label>
                  <select 
                    className="form-select input-moderno"
                    value={formData.datos_vivienda.parroquia_hab}
                    onChange={(e) => handleNestedChange('datos_vivienda', 'parroquia_hab', e.target.value)}
                    disabled={!formData.datos_vivienda.municipio_hab}
                  >
                    <option value="">Seleccione...</option>
                    {parroquiasList.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label mb-0">Dirección Detallada (Calle, Casa, Punto de Referencia) <span className="text-danger">*</span></label>
                    <button
                      type="button"
                      onClick={obtenerUbicacionGPS}
                      disabled={cargandoGPS}
                      className="btn btn-sm btn-outline-success rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1.5 transition-all shadow-sm hover-efecto"
                      style={{ fontSize: '0.78rem' }}
                    >
                      {cargandoGPS ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" style={{ width: '0.85rem', height: '0.85rem' }}></span>
                          <span>Obteniendo dirección...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-geo-alt-fill"></i>
                          <span>Cargar por GPS</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea 
                    className="form-control input-moderno"
                    rows={2}
                    placeholder="Ingresa la dirección detallada de domicilio..."
                    value={formData.datos_vivienda.direccion_detalle}
                    onChange={(e) => {
                      const det = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        direccion: det,
                        datos_vivienda: {
                          ...prev.datos_vivienda,
                          direccion_detalle: det
                        }
                      }));
                    }}
                    onBlur={(e) => {
                      const detVal = formatTitleCase(e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        direccion: detVal,
                        datos_vivienda: {
                          ...prev.datos_vivienda,
                          direccion_detalle: detVal
                        }
                      }));
                    }}
                  />
                </div>
              </div>
            </div>

            {/* STEP 2: HEALTH & UNIFORM SIZES */}
            <div className={`wizard-panel ${activeStep === 2 ? 'activo' : ''}`}>
              <div className="seccion-titulo"><i className="bi bi-heart-pulse-fill me-2 text-success"></i>Paso 2: Datos de Salud y Tallas de Uniforme</div>
              <div className="row g-3">
                <div className="col-md-3">
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
                <div className="col-md-3">
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
                <div className="col-md-3">
                  <label className="form-label">Con Informe de Salud Ocupacional</label>
                  <select 
                    className="form-select input-moderno"
                    value={formData.datos_salud.informe_salud_ocupacional}
                    onChange={(e) => handleNestedChange('datos_salud', 'informe_salud_ocupacional', e.target.value)}
                  >
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Actualizado</label>
                  <select 
                    className="form-select input-moderno"
                    value={formData.datos_salud.informe_actualizado}
                    onChange={(e) => handleNestedChange('datos_salud', 'informe_actualizado', e.target.value)}
                    disabled={formData.datos_salud.informe_salud_ocupacional !== 'Sí'}
                  >
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>
                
                <div className="col-md-6">
                  <label className="form-label">Condición Neurológica</label>
                  <input 
                    type="text"
                    className="form-control input-moderno"
                    placeholder="Ej. TDAH, Asperger, Autismo, Ninguna..."
                    value={formData.datos_salud.condicion_neuro}
                    onChange={(e) => handleNestedChange('datos_salud', 'condicion_neuro', e.target.value)}
                    onBlur={(e) => handleNestedChange('datos_salud', 'condicion_neuro', formatTitleCase(e.target.value))}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Condición Médica</label>
                  <input 
                    type="text"
                    className="form-control input-moderno"
                    placeholder="Ej. Hipertensión, Asma, Diabetes, Ninguna..."
                    value={formData.datos_salud.condicion_medica}
                    onChange={(e) => handleNestedChange('datos_salud', 'condicion_medica', e.target.value)}
                    onBlur={(e) => handleNestedChange('datos_salud', 'condicion_medica', formatTitleCase(e.target.value))}
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
                    onBlur={(e) => handleNestedChange('datos_salud', 'emergencia_nombre', formatTitleCase(e.target.value))}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Teléfono del Contacto de Emergencia</label>
                  <input 
                    type="text"
                    className="form-control input-moderno"
                    placeholder="Ej. 0414-1234567"
                    value={formData.datos_salud.emergencia_tel}
                    onChange={(e) => handleNestedChange('datos_salud', 'emergencia_tel', formatPhoneNumber(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* STEP 4: ELECTORAL DATA & SOCIO-FAMILY PROFILE */}
            <div className={`wizard-panel ${activeStep === 4 ? 'activo' : ''}`}>
              <div className="seccion-titulo"><i className="bi bi-geo-alt-fill me-2 text-success"></i>Paso 4: Información Electoral y Ficha Socio-Familiar</div>
              
              <div className="text-success fw-bold border-bottom pb-2 mb-3 mt-4">
                <i className="bi bi-person-check-fill me-2"></i>Información de Registro Electoral
              </div>
              
              <div className="row g-3 mb-4">
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
              </div>

              <div className="text-success fw-bold border-bottom pb-2 mb-3">
                <i className="bi bi-people-fill me-2"></i>Entorno Familiar y de Habitabilidad
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Tipo de préstamo solicitado (PAAV)</label>
                  <select 
                    className="form-select input-moderno"
                    value={formData.datos_vivienda.tipo_prestamo}
                    onChange={(e) => handleNestedChange('datos_vivienda', 'tipo_prestamo', e.target.value)}
                  >
                    <option value="">Seleccione...</option>
                    <option value="INICIAL/ADQUISICIÓN">INICIAL/ADQUISICIÓN</option>
                    <option value="INICIAL/MEJORAS">INICIAL/MEJORAS</option>
                    <option value="ADICIONAL/ADQUISICIÓN">ADICIONAL/ADQUISICIÓN</option>
                    <option value="ADICIONAL/MEJORAS">ADICIONAL/MEJORAS</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">¿Cuántas personas conviven en su núcleo familiar principal? (Auto-calculado)</label>
                  <input 
                    type="number" 
                    className="form-control input-moderno" 
                    value={formData.datos_vivienda.num_convivientes} 
                    disabled={true}
                    style={{ backgroundColor: '#f8fafc', color: '#1e293b', fontWeight: 'bold' }}
                    readOnly
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Nombre y apellido del cónyuge o pareja (Auto-cargado)</label>
                  <input 
                    type="text" 
                    className="form-control input-moderno" 
                    placeholder="Sincronizado desde Carga Familiar"
                    value={formData.datos_vivienda.conyuge_nombre} 
                    disabled={true}
                    style={{ backgroundColor: '#f8fafc', color: '#1e293b', fontWeight: 'bold' }}
                    readOnly
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Cédula del cónyuge o pareja (Auto-cargado)</label>
                  <input 
                    type="text" 
                    className="form-control input-moderno" 
                    placeholder="Sincronizado desde Carga Familiar"
                    value={formData.datos_vivienda.conyuge_cedula} 
                    disabled={true}
                    style={{ backgroundColor: '#f8fafc', color: '#1e293b', fontWeight: 'bold' }}
                    readOnly
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Relación laboral de su cónyuge o pareja con la institución / empresa de origen</label>
                  <select 
                    className="form-select input-moderno"
                    value={formData.datos_vivienda.conyuge_trabaja_pdvsa}
                    onChange={(e) => handleNestedChange('datos_vivienda', 'conyuge_trabaja_pdvsa', e.target.value)}
                  >
                    <option value="">Seleccione...</option>
                    <option value="ES TRABAJADOR(A) ACTIVO(A)">ES TRABAJADOR(A) ACTIVO(A)</option>
                    <option value="TRABAJÓ, ESTÁ RETIRADO">TRABAJÓ, ESTÁ RETIRADO</option>
                    <option value="NUNCA HA TRABAJO PDVSA">NUNCA HA TRABAJO PDVSA</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">¿Posee usted alguna condición de discapacidad certificada (CONAPDIS)? (Sincronizado)</label>
                  <select 
                    className="form-select input-moderno"
                    value={formData.datos_vivienda.discapacidad_trabajador}
                    disabled={true}
                    style={{ backgroundColor: '#f8fafc', color: '#1e293b', fontWeight: 'bold' }}
                  >
                    <option value="NO">NO</option>
                    <option value="SI">SI</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">¿Algún familiar directo de su grupo de convivencia posee discapacidad certificada (CONAPDIS)? (Sincronizado)</label>
                  <select 
                    className="form-select input-moderno"
                    value={formData.datos_vivienda.discapacidad_familiar}
                    disabled={true}
                    style={{ backgroundColor: '#f8fafc', color: '#1e293b', fontWeight: 'bold' }}
                  >
                    <option value="NO">NO</option>
                    <option value="SI">SI</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Situación actual de habitabilidad o residencia</label>
                  <select 
                    className="form-select input-moderno"
                    value={formData.datos_vivienda.condicion_habitabilidad}
                    onChange={(e) => handleNestedChange('datos_vivienda', 'condicion_habitabilidad', e.target.value)}
                  >
                    <option value="">Seleccione...</option>
                    <option value="1) HABITE EN CONDICIÓN DE HACINAMIENTO, SOLO O CON SU GRUPO FAMILIAR.">1) HABITE EN CONDICIÓN DE HACINAMIENTO, SOLO O CON SU GRUPO FAMILIAR.</option>
                    <option value="2) HABITE EN CONDICIÓN DE ARRIMADO, SOLO O CON SU GRUPO FAMILIAR.">2) HABITE EN CONDICIÓN DE ARRIMADO, SOLO O CON SU GRUPO FAMILIAR.</option>
                    <option value="3) HABITE EN CONDICIÓN DE ALQUILER, SOLO O CON SU GRUPO FAMILIAR.">3) HABITE EN CONDICIÓN DE ALQUILER, SOLO O CON SU GRUPO FAMILIAR.</option>
                    <option value="4) HABITE EN CONDICIÓN DE ALQUILER, CON SOLICITUD U ORDEN DE DESALOJO.">4) HABITE EN CONDICIÓN DE ALQUILER, CON SOLICITUD U ORDEN DE DESALOJO.</option>
                    <option value="5) HABITE EN VIVIENDA CATALOGADA DE ALTO RIESGO, ASÍ DECLARADO POR LA AUTORIDAD COMPETENTE (PROTECCIÓN CIVIL O BOMBEROS)">5) HABITE EN VIVIENDA CATALOGADA DE ALTO RIESGO, ASÍ DECLARADO POR LA AUTORIDAD COMPETENTE (PROTECCIÓN CIVIL O BOMBEROS)</option>
                    <option value="6) HABITE EN VIVIENDA PRESTADA, BAJO SU CUIDADO.">6) HABITE EN VIVIENDA PRESTADA, BAJO SU CUIDADO.</option>
                    <option value="7) HABITE EN UN INMUEBLE ASIGNADO, PROPIEDAD DE LA EMPRESA.">7) HABITE EN UN INMUEBLE ASIGNADO, PROPIEDAD DE LA EMPRESA.</option>
                    <option value="8) HABITE UN INMUEBLE BAJO OTRA CONDICIÓN DIFERENTE A LAS ANTERIORES">8) HABITE UN INMUEBLE BAJO OTRA CONDICIÓN DIFERENTE A LAS ANTERIORES</option>
                  </select>
                </div>
              </div>
            </div>

            {/* STEP 3: DEPENDENTS FAMILY */}
            <div className={`wizard-panel ${activeStep === 3 ? 'activo' : ''}`}>
              <div className="seccion-titulo"><i className="bi bi-people-fill me-2 text-success"></i>Paso 3: Carga Familiar y Dependientes</div>
              <p className="small text-muted mb-3">Registra los miembros de tu núcleo familiar directo (hijos, cónyuge, padres dependientes).</p>
              
              {/* Form to add familiar */}
              <div className="bg-light p-4 border rounded-4 mb-4">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="small fw-bold text-muted mb-1">Nombre Completo</label>
                    <input type="text" className="form-control input-moderno animate__animated animate__fadeIn" placeholder="Ej. María Pérez" value={famNombre} onChange={(e) => setFamNombre(e.target.value)} onBlur={(e) => setFamNombre(formatTitleCase(e.target.value))} />
                  </div>
                  <div className="col-md-3">
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
                  <div className="col-md-3">
                    <label className="small fw-bold text-muted mb-1">Cédula</label>
                    <input type="text" className="form-control input-moderno" placeholder="Ej. 30123456" value={famCedula} onChange={(e) => setFamCedula(e.target.value)} />
                  </div>
                  <div className="col-md-2">
                    <label className="small fw-bold text-muted mb-1">¿Vive contigo?</label>
                    <select className="form-select input-moderno" value={famVive} onChange={(e) => setFamVive(e.target.value)}>
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
                <div className="row g-3 mt-1 align-items-end">
                  <div className="col-md-3">
                    <label className="small fw-bold text-muted mb-1">Fecha Nac.</label>
                    <input type="date" className="form-control input-moderno" value={famFechaNac} onChange={(e) => setFamFechaNac(e.target.value)} />
                  </div>
                  <div className="col-md-3">
                    <label className="small fw-bold text-muted mb-1">¿Posee carnet CONAPDIS?</label>
                    <select className="form-select input-moderno" value={famConapdis} onChange={(e) => setFamConapdis(e.target.value)}>
                      <option value="No">No</option>
                      <option value="Sí">Sí</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="small fw-bold text-muted mb-1">Condición Neuro.</label>
                    <input type="text" className="form-control input-moderno" placeholder="Ej. TDAH, Autismo, Ninguna..." value={famCondicionNeuro} onChange={(e) => setFamCondicionNeuro(e.target.value)} onBlur={(e) => setFamCondicionNeuro(formatTitleCase(e.target.value))} />
                  </div>
                  <div className="col-md-3 d-flex gap-2">
                    {editingFamiliarIndex !== null ? (
                      <>
                        <button type="button" onClick={agregarFamiliar} className="btn btn-success flex-grow-1 rounded-pill fw-bold hover-efecto">
                          <i className="bi bi-check-circle me-1"></i> Guardar
                        </button>
                        <button type="button" onClick={cancelarEdicionFamiliar} className="btn btn-secondary rounded-pill fw-bold hover-efecto" title="Cancelar edición">
                          <i className="bi bi-x-circle"></i>
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={agregarFamiliar} className="btn btn-success w-100 rounded-pill fw-bold hover-efecto">
                        <i className="bi bi-plus-circle me-1"></i> Agregar
                      </button>
                    )}
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
                      <th>CONAPDIS</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.carga_familiar.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted">
                          No tienes cargas familiares registradas.
                        </td>
                      </tr>
                    ) : (
                      formData.carga_familiar.map((f, idx) => (
                        <tr key={idx} className={editingFamiliarIndex === idx ? 'table-warning' : ''}>
                          <td className="fw-bold">{f.nombres}</td>
                          <td><span className="badge bg-light text-dark border">{f.parentesco}</span></td>
                          <td>{f.cedula || 'Sin Cédula'}</td>
                          <td>{f.fecha_nacimiento || 'No registrada'}</td>
                          <td>{f.vive_con_trabajador}</td>
                          <td>
                            <span className={`badge ${f.conapdis === 'Sí' ? 'bg-danger bg-opacity-10 text-danger border border-danger-subtle' : 'bg-secondary bg-opacity-10 text-secondary border'}`}>
                              {f.conapdis || 'No'}
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-2">
                              <button type="button" onClick={() => editarFamiliar(idx)} className="btn btn-sm btn-outline-primary rounded-pill"><i className="bi bi-pencil-fill me-1"></i> Editar</button>
                              <button type="button" onClick={() => eliminarFamiliar(idx)} className="btn btn-sm btn-outline-danger rounded-pill"><i className="bi bi-trash-fill"></i> Eliminar</button>
                            </div>
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
                    onBlur={(e) => handleChange('titulo_obtenido', formatTitleCase(e.target.value))}
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
                    onBlur={(e) => handleChange('universidad', formatTitleCase(e.target.value))}
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
                    <input type="text" className="form-control input-moderno" placeholder="Ej. Inteligencia Artificial en el Aula" value={curTitulo} onChange={(e) => setCurTitulo(e.target.value)} onBlur={(e) => setCurTitulo(formatTitleCase(e.target.value))} />
                  </div>
                  <div className="col-md-2">
                    <label className="small fw-bold text-muted mb-1">Institución / Lugar</label>
                    <input type="text" className="form-control input-moderno" placeholder="Ej. CIED Maturín" value={curLugar} onChange={(e) => setCurLugar(e.target.value)} onBlur={(e) => setCurLugar(formatTitleCase(e.target.value))} />
                  </div>
                  <div className="col-md-2">
                    <label className="small fw-bold text-muted mb-1">Horas Duración</label>
                    <input type="text" className="form-control input-moderno" placeholder="Ej. 16 Horas" value={curHoras} onChange={(e) => setCurHoras(e.target.value)} />
                  </div>
                  <div className="col-md-2">
                    <label className="small fw-bold text-muted mb-1">Fecha / Año</label>
                    <input type="text" className="form-control input-moderno" placeholder="Ej. 2014" value={curFecha} onChange={(e) => setCurFecha(e.target.value)} />
                  </div>
                  <div className="col-md-2 d-flex gap-2">
                    {editingCursoIndex !== null ? (
                      <>
                        <button type="button" onClick={agregarCurso} className="btn btn-success flex-grow-1 rounded-pill fw-bold hover-efecto" title="Guardar cambios">
                          <i className="bi bi-check-circle me-1"></i> Guardar
                        </button>
                        <button type="button" onClick={cancelarEdicionCurso} className="btn btn-secondary rounded-pill fw-bold hover-efecto" title="Cancelar edición">
                          <i className="bi bi-x-circle"></i>
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={agregarCurso} className="btn btn-success w-100 rounded-pill fw-bold hover-efecto">
                        <i className="bi bi-plus-circle me-1"></i> Agregar
                      </button>
                    )}
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
                        <tr key={idx} className={editingCursoIndex === idx ? 'table-warning' : ''}>
                          <td className="fw-bold">{c.titulo}</td>
                          <td>{c.lugar}</td>
                          <td>{c.horas || 'N/A'}</td>
                          <td>{c.fecha}</td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-2">
                              <button type="button" onClick={() => editarCurso(idx)} className="btn btn-sm btn-outline-primary rounded-pill"><i className="bi bi-pencil-fill me-1"></i> Editar</button>
                              <button type="button" onClick={() => eliminarCurso(idx)} className="btn btn-sm btn-outline-danger rounded-pill"><i className="bi bi-trash-fill"></i> Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Sección de Estudios Superiores Adicionales (sólo Visible para Administradores) */}
              {mostrarPaso7 && (
                <>
                  <div className="seccion-titulo mt-5"><i className="bi bi-mortarboard-fill me-2 text-success"></i>Ficha Docente: Estudios Superiores (Títulos Adicionales)</div>
                  <p className="small text-muted mb-3">Registra y "suma" todos los títulos universitarios o de postgrado que posea el docente.</p>

                  <div className="bg-light p-3 border rounded-4 mb-4">
                    <div className="row g-2 align-items-end">
                      <div className="col-md-3">
                        <label className="small fw-bold text-muted mb-1">Nivel de Instrucción</label>
                        <select className="form-select input-moderno" value={estNivel} onChange={(e) => setEstNivel(e.target.value)}>
                          <option value="T.S.U.">T.S.U. (Técnico Superior)</option>
                          <option value="Licenciatura / Profesorado">Licenciatura / Profesorado</option>
                          <option value="Especialización">Especialización</option>
                          <option value="Maestría">Maestría</option>
                          <option value="Doctorado">Doctorado</option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <label className="small fw-bold text-muted mb-1">Título Obtenido</label>
                        <input type="text" className="form-control input-moderno" placeholder="Ej. Magister en Gerencia" value={estTitulo} onChange={(e) => setEstTitulo(e.target.value)} onBlur={(e) => setEstTitulo(formatTitleCase(e.target.value))} />
                      </div>
                      <div className="col-md-3">
                        <label className="small fw-bold text-muted mb-1">Universidad / Instituto</label>
                        <input type="text" className="form-control input-moderno" placeholder="Ej. UPEL Maturín" value={estUniversidad} onChange={(e) => setEstUniversidad(e.target.value)} onBlur={(e) => setEstUniversidad(formatTitleCase(e.target.value))} />
                      </div>
                      <div className="col-md-1">
                        <label className="small fw-bold text-muted mb-1">Año Egreso</label>
                        <input type="number" className="form-control input-moderno" min="1970" max={new Date().getFullYear()} value={estAnio} onChange={(e) => setEstAnio(parseInt(e.target.value) || new Date().getFullYear())} />
                      </div>
                      <div className="col-md-2 d-flex gap-2">
                        {editingEstudioIndex !== null ? (
                          <>
                            <button type="button" onClick={agregarEstudio} className="btn btn-success flex-grow-1 rounded-pill fw-bold hover-efecto" title="Guardar cambios">
                              <i className="bi bi-check-circle"></i>
                            </button>
                            <button type="button" onClick={cancelarEdicionEstudio} className="btn btn-secondary rounded-pill fw-bold hover-efecto" title="Cancelar">
                              <i className="bi bi-x-circle"></i>
                            </button>
                          </>
                        ) : (
                          <button type="button" onClick={agregarEstudio} className="btn btn-success w-100 rounded-pill fw-bold hover-efecto">
                            <i className="bi bi-plus-circle me-1"></i> Sumar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-hover align-middle border">
                      <thead className="bg-light text-muted small">
                        <tr>
                          <th>Nivel</th>
                          <th>Título Obtenido</th>
                          <th>Universidad / Instituto</th>
                          <th>Año Egreso</th>
                          <th className="text-end">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!formData.estudios_superiores || formData.estudios_superiores.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="text-center py-4 text-muted">
                              No hay títulos adicionales registrados en la Ficha Docente.
                            </td>
                          </tr>
                        ) : (
                          formData.estudios_superiores.map((est, idx) => (
                            <tr key={idx} className={editingEstudioIndex === idx ? 'table-warning' : ''}>
                              <td><span className="badge bg-info bg-opacity-10 text-info border">{est.nivel}</span></td>
                              <td className="fw-bold">{est.titulo}</td>
                              <td>{est.universidad}</td>
                              <td>{est.anio_egreso}</td>
                              <td className="text-end">
                                <div className="d-flex justify-content-end gap-2">
                                  <button type="button" onClick={() => editarEstudio(idx)} className="btn btn-sm btn-outline-primary rounded-pill"><i className="bi bi-pencil-fill me-1"></i> Editar</button>
                                  <button type="button" onClick={() => eliminarEstudio(idx)} className="btn btn-sm btn-outline-danger rounded-pill"><i className="bi bi-trash-fill"></i> Eliminar</button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* STEP 6: PLAN DE FORMACION (CHOOSE UP TO 5 COURSES) */}
            <div className={`wizard-panel ${activeStep === 6 ? 'activo' : ''}`}>
              <div className="seccion-titulo"><i className="bi bi-award-fill me-2 text-success"></i>Paso 6: Plan de Formación y Capacitación</div>
              <p className="small text-muted mb-3">
                Selecciona <strong>hasta 5 formaciones</strong> del catálogo oficial de SIGAE en las que deseas participar para tu desarrollo profesional continuo.
              </p>

              {/* Selection Summary and Progress Bar */}
              <div className="bg-light p-3 border rounded-4 mb-4 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-bold text-dark small text-uppercase mb-0">
                    <i className="bi bi-card-checklist text-success me-2"></i>
                    Tus Formaciones Seleccionadas
                  </span>
                  <span className={`badge rounded-pill px-2.5 py-1 ${(formData.plan_formacion?.length || 0) === 5 ? 'bg-success text-white' : (formData.plan_formacion?.length || 0) > 0 ? 'bg-primary text-white' : 'bg-secondary text-white'} fw-bold`}>
                    {formData.plan_formacion?.length || 0} de 5
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="progress mb-3" style={{ height: '8px', borderRadius: '4px', backgroundColor: '#e2e8f0' }}>
                  <div 
                    className={`progress-bar rounded-pill transition-all ${(formData.plan_formacion?.length || 0) === 5 ? 'bg-success' : 'bg-primary'}`} 
                    role="progressbar" 
                    style={{ width: `${((formData.plan_formacion?.length || 0) / 5) * 100}%`, transition: 'width 0.3s ease' }}
                    aria-valuenow={formData.plan_formacion?.length || 0} 
                    aria-valuemin={0} 
                    aria-valuemax={5}
                  ></div>
                </div>

                {/* Selected Tags list */}
                {(formData.plan_formacion?.length || 0) > 0 ? (
                  <div className="d-flex flex-wrap gap-2">
                    {formData.plan_formacion.map((curso, idx) => (
                      <span 
                        key={idx} 
                        className="badge bg-white text-dark border d-flex align-items-center gap-2 p-2 shadow-sm rounded-pill animate__animated animate__fadeIn"
                        style={{ fontSize: '0.8rem', fontWeight: '500', transition: 'all 0.2s ease' }}
                      >
                        <i className="bi bi-journal-check text-success"></i>
                        {curso.titulo}
                        <button 
                          type="button" 
                          onClick={() => handleToggleCursoPlan(curso)} 
                          className="btn-close ms-1" 
                          style={{ width: '0.5em', height: '0.5em', fontSize: '0.65rem', padding: '0.15rem' }}
                          title="Quitar"
                        ></button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted small fst-italic py-1">
                    <i className="bi bi-info-circle me-1"></i> No has seleccionado ninguna formación todavía. Haz clic sobre los cursos de abajo para seleccionarlos.
                  </div>
                )}
              </div>

              {/* Search and Category Filter Row */}
              <div className="row g-2 mb-3 align-items-center">
                <div className="col-md-5">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0 border-secondary border-opacity-25" style={{ borderRadius: '12px 0 0 12px' }}>
                      <i className="bi bi-search text-muted"></i>
                    </span>
                    <input 
                      type="text" 
                      className="form-control border-start-0 border-secondary border-opacity-25 py-2" 
                      placeholder="Buscar cursos en el catálogo..." 
                      value={busquedaCurso}
                      onChange={(e) => setBusquedaCurso(e.target.value)}
                      style={{ borderRadius: '0 12px 12px 0', fontSize: '0.9rem', boxShadow: 'none' }}
                    />
                    {busquedaCurso && (
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary border-secondary border-opacity-25"
                        onClick={() => setBusquedaCurso('')}
                        style={{ borderLeft: 'none', borderRight: 'none', padding: '0 10px', color: '#64748b' }}
                      >
                        <i className="bi bi-x-circle-fill"></i>
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="col-md-7">
                  <div className="d-flex gap-2 overflow-x-auto pb-1 scrollbar-delgada" style={{ whiteSpace: 'nowrap' }}>
                    {['Todas', ...Array.from(new Set(CATALOGO_PLAN_FORMACION.map(c => c.categoria)))].map((cat, idx) => {
                      const count = getCategoryCount(cat);
                      const isCatSelected = categoriaSeleccionada === cat;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCategoriaSeleccionada(cat)}
                          className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold transition-all ${isCatSelected ? 'btn-success text-white shadow-sm border-0' : 'btn-light text-muted border border-secondary border-opacity-25'}`}
                          style={{ flexShrink: 0, fontSize: '0.82rem' }}
                        >
                          {cat} <span className={`badge ms-1 ${isCatSelected ? 'bg-white text-success' : 'bg-secondary bg-opacity-20 text-muted'}`}>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* List of Courses */}
              <div className="list-group mb-4 scrollbar-delgada border shadow-sm" style={{ maxHeight: '420px', overflowY: 'auto', borderRadius: '16px', border: '1px solid rgba(226, 232, 240, 0.8) !important' }}>
                {filteredCursos.length === 0 ? (
                  <div className="list-group-item text-center py-5 text-muted bg-white border-0 rounded-4">
                    <i className="bi bi-journal-x fs-2 d-block mb-2 text-warning"></i>
                    No se encontraron formaciones que coincidan con la búsqueda.
                  </div>
                ) : (
                  filteredCursos.map((curso, idx) => {
                    const isSelected = formData.plan_formacion?.some(c => c.titulo === curso.titulo) || false;
                    
                    let levelBadgeClass = 'bg-info bg-opacity-10 text-info border border-info border-opacity-25';
                    let levelIcon = 'bi-egg-fill';
                    if (curso.nivel === 'Intermedio') {
                      levelBadgeClass = 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25';
                      levelIcon = 'bi-book-half';
                    } else if (curso.nivel === 'Avanzado') {
                      levelBadgeClass = 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25';
                      levelIcon = 'bi-mortarboard-fill';
                    }

                    return (
                      <div 
                        key={idx}
                        onClick={() => handleToggleCursoPlan(curso)}
                        className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-start-0 border-end-0 ${isSelected ? 'bg-success bg-opacity-5 text-success' : 'text-dark'}`}
                        style={{ 
                          cursor: 'pointer', 
                          transition: 'all 0.15s ease', 
                          borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
                          borderRadius: filteredCursos.length === 1 ? '16px' : idx === 0 ? '16px 16px 0 0' : idx === filteredCursos.length - 1 ? '0 0 16px 16px' : '0'
                        }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div 
                            className={`d-flex justify-content-center align-items-center rounded-circle border ${isSelected ? 'bg-success border-success text-white shadow-sm' : 'border-secondary border-opacity-25'}`}
                            style={{ width: '22px', height: '22px', transition: 'all 0.15s ease', flexShrink: 0 }}
                          >
                            {isSelected && <i className="bi bi-check-lg" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}></i>}
                          </div>
                          <div>
                            <div className={`fw-bold mb-1 ${isSelected ? 'text-success' : 'text-dark'}`} style={{ fontSize: '0.95rem' }}>{curso.titulo}</div>
                            <div className="d-flex gap-2 align-items-center flex-wrap">
                              <span className="badge bg-light text-muted border border-secondary border-opacity-10 px-2 py-1" style={{ fontSize: '0.7rem', fontWeight: '500' }}>
                                <i className="bi bi-tag-fill me-1 opacity-75"></i>
                                {curso.categoria}
                              </span>
                              <span className={`badge px-2 py-1 d-inline-flex align-items-center gap-1 ${levelBadgeClass}`} style={{ fontSize: '0.7rem', fontWeight: '600' }}>
                                <i className={`bi ${levelIcon}`}></i>
                                {curso.nivel}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-end ps-2 flex-shrink-0">
                          {isSelected ? (
                            <span className="badge bg-success bg-opacity-15 text-success rounded-pill px-2.5 py-1.5 fw-bold" style={{ fontSize: '0.72rem' }}>
                              <i className="bi bi-check-circle-fill me-1"></i>
                              Seleccionado
                            </span>
                          ) : (
                            <span className="badge bg-light text-muted rounded-pill px-2.5 py-1.5 border d-none d-md-inline" style={{ fontSize: '0.72rem' }}>
                              Añadir al plan
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Extra Needs Section */}
              <div className="card border-0 bg-light rounded-4 p-4 mt-2">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="bg-success bg-opacity-10 text-success p-2 rounded-3">
                    <i className="bi bi-chat-left-quote-fill fs-5"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-0 text-dark">Otras necesidades de formación (Opcional)</h6>
                    <span className="text-muted small">¿Hay algún otro tema o curso que consideres fundamental?</span>
                  </div>
                </div>
                <textarea 
                  className="form-control input-moderno bg-white border-secondary border-opacity-10"
                  rows={3}
                  placeholder="Escribe aquí cualquier otro curso, taller o tema específico que consideres necesario para tu desarrollo pedagógico..."
                  value={formData.necesidades_extra || ''}
                  onChange={(e) => handleChange('necesidades_extra', e.target.value)}
                  style={{ resize: 'none', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            {/* STEP 7: LABOR DATA & HISTORICAL ROLES (ADMIN ONLY) */}
            {mostrarPaso7 && (
              <div className={`wizard-panel ${activeStep === 7 ? 'activo' : ''}`}>
                <div className="seccion-titulo"><i className="bi bi-briefcase-fill me-2 text-success"></i>Paso 7: Ficha Laboral e Historial en la Empresa</div>
                
                <div className="row g-3 mb-4">
                  <div className="col-md-3">
                    <label className="form-label">Número de Personal</label>
                    <input 
                      type="text"
                      className="form-control input-moderno"
                      placeholder="Ej. 100456"
                      value={formData.n_personal || ''}
                      onChange={(e) => handleChange('n_personal', e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Grupo / Nivel</label>
                    <input 
                      type="text"
                      className="form-control input-moderno"
                      placeholder="Ej. Grupo 4 - Docente V"
                      value={formData.grupo || ''}
                      onChange={(e) => handleChange('grupo', e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Gerencia</label>
                    <input 
                      type="text"
                      className="form-control input-moderno"
                      placeholder="Ej. Gerencia de Educación"
                      value={formData.gerencia || ''}
                      onChange={(e) => handleChange('gerencia', e.target.value)}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Organización y Proceso</label>
                    <input 
                      type="text"
                      className="form-control input-moderno"
                      placeholder="Ej. Dtto. Oriente - Aulas"
                      value={formData.organizacion_proceso || ''}
                      onChange={(e) => handleChange('organizacion_proceso', e.target.value)}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Fecha de Ingreso al Plantel <span className="text-danger">*</span></label>
                    <input 
                      type="date"
                      className="form-control input-moderno"
                      value={formData.fecha_ingreso || ''}
                      onChange={(e) => handleChange('fecha_ingreso', e.target.value)}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Años de Servicio</label>
                    <input 
                      type="text"
                      className="form-control input-moderno text-dark fw-bold"
                      value={calcularAniosServicio(formData.fecha_ingreso)}
                      disabled={true}
                      style={{ backgroundColor: '#f8fafc', color: '#1e293b', fontWeight: 'bold' }}
                      readOnly
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
                        value={formData.carga_horaria || 0}
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

                {/* HISTORICO cargos pdvsa */}
                <div className="seccion-titulo mt-5"><i className="bi bi-clock-history me-2 text-success"></i>Historial de Cargos / Experiencia en PDVSA o Institución de Origen</div>
                <p className="small text-muted mb-3">Registra el histórico de cargos ocupados anteriormente por el docente dentro de la institución.</p>

                <div className="bg-light p-3 border rounded-4 mb-4">
                  <div className="row g-2 align-items-end">
                    <div className="col-md-3">
                      <label className="small fw-bold text-muted mb-1">Empresa / Filial / Plantel</label>
                      <input type="text" className="form-control input-moderno" placeholder="Ej. PDVSA E&P" value={histEmpresa} onChange={(e) => setHistEmpresa(e.target.value)} onBlur={(e) => setHistEmpresa(formatTitleCase(e.target.value))} />
                    </div>
                    <div className="col-md-3">
                      <label className="small fw-bold text-muted mb-1">Cargo Desempeñado</label>
                      <input type="text" className="form-control input-moderno" placeholder="Ej. Docente Coordinador" value={histCargo} onChange={(e) => setHistCargo(e.target.value)} onBlur={(e) => setHistCargo(formatTitleCase(e.target.value))} />
                    </div>
                    <div className="col-md-2">
                      <label className="small fw-bold text-muted mb-1">Fecha Inicio</label>
                      <input type="date" className="form-control input-moderno" value={histInicio} onChange={(e) => setHistInicio(e.target.value)} />
                    </div>
                    <div className="col-md-2">
                      <label className="small fw-bold text-muted mb-1">Fecha Fin (Vacio para Actualidad)</label>
                      <input type="date" className="form-control input-moderno" value={histFin} onChange={(e) => setHistFin(e.target.value)} />
                    </div>
                    <div className="col-md-2 d-flex gap-2">
                      {editingHistIndex !== null ? (
                        <>
                          <button type="button" onClick={agregarHistorico} className="btn btn-success flex-grow-1 rounded-pill fw-bold hover-efecto" title="Guardar cambios">
                            <i className="bi bi-check-circle"></i>
                          </button>
                          <button type="button" onClick={cancelarEdicionHistorico} className="btn btn-secondary rounded-pill fw-bold hover-efecto" title="Cancelar">
                            <i className="bi bi-x-circle"></i>
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={agregarHistorico} className="btn btn-success w-100 rounded-pill fw-bold hover-efecto">
                          <i className="bi bi-plus-circle me-1"></i> Sumar Cargo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle border">
                    <thead className="bg-light text-muted small">
                      <tr>
                        <th>Empresa / Filial</th>
                        <th>Cargo</th>
                        <th>Fecha Inicio</th>
                        <th>Fecha Fin</th>
                        <th className="text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!formData.historico_pdvsa || formData.historico_pdvsa.length === 0) ? (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-muted">
                            No hay cargos históricos registrados.
                          </td>
                        </tr>
                      ) : (
                        formData.historico_pdvsa.map((hist, idx) => (
                          <tr key={idx} className={editingHistIndex === idx ? 'table-warning' : ''}>
                            <td className="fw-bold">{hist.empresa}</td>
                            <td><span className="badge bg-secondary bg-opacity-10 text-dark border">{hist.cargo}</span></td>
                            <td>{hist.fecha_inicio}</td>
                            <td>{hist.fecha_fin || 'Actualidad'}</td>
                            <td className="text-end">
                              <div className="d-flex justify-content-end gap-2">
                                <button type="button" onClick={() => editarHistorico(idx)} className="btn btn-sm btn-outline-primary rounded-pill"><i className="bi bi-pencil-fill me-1"></i> Editar</button>
                                <button type="button" onClick={() => eliminarHistorico(idx)} className="btn btn-sm btn-outline-danger rounded-pill"><i className="bi bi-trash-fill"></i> Eliminar</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* STEP 8: ACTIONS & EVALUATIONS (ADMIN ONLY) */}
            {mostrarPaso7 && (
              <div className={`wizard-panel ${activeStep === 8 ? 'activo' : ''}`}>
                <div className="seccion-titulo"><i className="bi bi-patch-check-fill me-2 text-success"></i>Paso 8: Evaluaciones de Desempeño y Acciones de Personal</div>
                
                {/* 1. Evaluaciones de Desempeño */}
                <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 border bg-light">
                  <h6 className="fw-bold text-dark mb-3"><i className="bi bi-award-fill me-2 text-success"></i>Evaluaciones de Desempeño Anuales</h6>
                  
                  <div className="row g-2 align-items-end mb-3">
                    <div className="col-md-3">
                      <label className="small fw-bold text-muted mb-1">Periodo Evaluado (Año)</label>
                      <input type="text" className="form-control input-moderno bg-white" placeholder="Ej. 2024" value={evalPeriodo} onChange={(e) => setEvalPeriodo(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <label className="small fw-bold text-muted mb-1">Calificación</label>
                      <select className="form-select input-moderno bg-white" value={evalCalificacion} onChange={(e) => setEvalCalificacion(e.target.value)}>
                        <option value="Excelente">Excelente (Sobresaliente)</option>
                        <option value="Bueno">Bueno</option>
                        <option value="Regular">Regular</option>
                        <option value="Deficiente">Deficiente</option>
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="small fw-bold text-muted mb-1">Puntaje / Observación</label>
                      <input type="text" className="form-control input-moderno bg-white" placeholder="Ej. 98/100" value={evalPuntaje} onChange={(e) => setEvalPuntaje(e.target.value)} />
                    </div>
                    <div className="col-md-2">
                      <label className="small fw-bold text-muted mb-1">Evaluador / Supervisor</label>
                      <input type="text" className="form-control input-moderno bg-white" placeholder="Ej. Ana Cordero" value={evalEvaluador} onChange={(e) => setEvalEvaluador(e.target.value)} />
                    </div>
                    <div className="col-md-2 d-flex gap-2">
                      {editingEvalIndex !== null ? (
                        <>
                          <button type="button" onClick={agregarEvaluacion} className="btn btn-success flex-grow-1 rounded-pill fw-bold hover-efecto">
                            <i className="bi bi-check-lg"></i> Guardar
                          </button>
                          <button type="button" onClick={cancelarEdicionEvaluacion} className="btn btn-secondary rounded-pill fw-bold hover-efecto">
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={agregarEvaluacion} className="btn btn-success w-100 rounded-pill fw-bold hover-efecto">
                          <i className="bi bi-plus-circle me-1"></i> Registrar
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-hover align-middle border bg-white">
                      <thead className="bg-light text-muted small">
                        <tr>
                          <th>Periodo</th>
                          <th>Calificación</th>
                          <th>Puntaje</th>
                          <th>Evaluador</th>
                          <th className="text-end">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!formData.acciones_personal?.evaluacion || formData.acciones_personal.evaluacion.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="text-center py-3 text-muted">No hay evaluaciones registradas.</td>
                          </tr>
                        ) : (
                          formData.acciones_personal.evaluacion.map((item, idx) => (
                            <tr key={idx} className={editingEvalIndex === idx ? 'table-warning' : ''}>
                              <td className="fw-bold">{item.periodo}</td>
                              <td>
                                <span className={`badge ${item.calificacion === 'Excelente' ? 'bg-success bg-opacity-10 text-success border border-success' : 'bg-primary bg-opacity-10 text-primary border'}`}>
                                  {item.calificacion}
                                </span>
                              </td>
                              <td>{item.puntaje}</td>
                              <td>{item.evaluador}</td>
                              <td className="text-end">
                                <div className="d-flex justify-content-end gap-2">
                                  <button type="button" onClick={() => editarEvaluacion(idx)} className="btn btn-sm btn-outline-primary rounded-pill"><i className="bi bi-pencil-fill"></i></button>
                                  <button type="button" onClick={() => eliminarEvaluacion(idx)} className="btn btn-sm btn-outline-danger rounded-pill"><i className="bi bi-trash-fill"></i></button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Promociones y Ascensos */}
                <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 border bg-light">
                  <h6 className="fw-bold text-dark mb-3"><i className="bi bi-arrow-up-circle-fill me-2 text-success"></i>Historial de Promociones y Ascensos de Cargo</h6>
                  
                  <div className="row g-2 align-items-end mb-3">
                    <div className="col-md-2">
                      <label className="small fw-bold text-muted mb-1">Fecha Acción</label>
                      <input type="date" className="form-control input-moderno bg-white" value={promFecha} onChange={(e) => setPromFecha(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <label className="small fw-bold text-muted mb-1">Cargo Anterior</label>
                      <input type="text" className="form-control input-moderno bg-white" placeholder="Ej. Docente I" value={promCargoAnt} onChange={(e) => setPromCargoAnt(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <label className="small fw-bold text-muted mb-1">Cargo Nuevo</label>
                      <input type="text" className="form-control input-moderno bg-white" placeholder="Ej. Docente II" value={promCargoNuevo} onChange={(e) => setPromCargoNuevo(e.target.value)} />
                    </div>
                    <div className="col-md-2">
                      <label className="small fw-bold text-muted mb-1">Nro. Resolución / Nota</label>
                      <input type="text" className="form-control input-moderno bg-white" placeholder="Ej. Res-123" value={promObs} onChange={(e) => setPromObs(e.target.value)} />
                    </div>
                    <div className="col-md-2 d-flex gap-2">
                      {editingPromIndex !== null ? (
                        <>
                          <button type="button" onClick={agregarPromocion} className="btn btn-success flex-grow-1 rounded-pill fw-bold hover-efecto">
                            <i className="bi bi-check-lg"></i> Guardar
                          </button>
                          <button type="button" onClick={cancelarEdicionPromocion} className="btn btn-secondary rounded-pill fw-bold hover-efecto">
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={agregarPromocion} className="btn btn-success w-100 rounded-pill fw-bold hover-efecto">
                          <i className="bi bi-plus-circle me-1"></i> Registrar
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-hover align-middle border bg-white">
                      <thead className="bg-light text-muted small">
                        <tr>
                          <th>Fecha</th>
                          <th>Cargo Anterior</th>
                          <th>Cargo Nuevo</th>
                          <th>Nro. Resolución</th>
                          <th className="text-end">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!formData.acciones_personal?.promocion || formData.acciones_personal.promocion.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="text-center py-3 text-muted">No hay promociones registradas.</td>
                          </tr>
                        ) : (
                          formData.acciones_personal.promocion.map((item, idx) => (
                            <tr key={idx} className={editingPromIndex === idx ? 'table-warning' : ''}>
                              <td>{item.fecha}</td>
                              <td className="text-muted">{item.cargo_anterior}</td>
                              <td className="fw-bold text-success">{item.cargo_nuevo}</td>
                              <td>{item.observacion}</td>
                              <td className="text-end">
                                <div className="d-flex justify-content-end gap-2">
                                  <button type="button" onClick={() => editarPromocion(idx)} className="btn btn-sm btn-outline-primary rounded-pill"><i className="bi bi-pencil-fill"></i></button>
                                  <button type="button" onClick={() => eliminarPromocion(idx)} className="btn btn-sm btn-outline-danger rounded-pill"><i className="bi bi-trash-fill"></i></button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Ajustes Salariales */}
                <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 border bg-light">
                  <h6 className="fw-bold text-dark mb-3"><i className="bi bi-currency-dollar me-2 text-success"></i>Historial de Ajustes Salariales</h6>
                  
                  <div className="row g-2 align-items-end mb-3">
                    <div className="col-md-2">
                      <label className="small fw-bold text-muted mb-1">Fecha Ajuste</label>
                      <input type="date" className="form-control input-moderno bg-white" value={salFecha} onChange={(e) => setSalFecha(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <label className="small fw-bold text-muted mb-1">Salario Anterior</label>
                      <input type="text" className="form-control input-moderno bg-white" placeholder="Ej. Bs. 15,000" value={salMontoAnt} onChange={(e) => setSalMontoAnt(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                      <label className="small fw-bold text-muted mb-1">Salario Nuevo</label>
                      <input type="text" className="form-control input-moderno bg-white" placeholder="Ej. Bs. 20,000" value={salMontoNuevo} onChange={(e) => setSalMontoNuevo(e.target.value)} />
                    </div>
                    <div className="col-md-2">
                      <label className="small fw-bold text-muted mb-1">Motivo / Nro. Ajuste</label>
                      <input type="text" className="form-control input-moderno bg-white" placeholder="Ej. Aumento Presidencial" value={salMotivo} onChange={(e) => setSalMotivo(e.target.value)} />
                    </div>
                    <div className="col-md-2 d-flex gap-2">
                      {editingSalIndex !== null ? (
                        <>
                          <button type="button" onClick={agregarSalario} className="btn btn-success flex-grow-1 rounded-pill fw-bold hover-efecto">
                            <i className="bi bi-check-lg"></i> Guardar
                          </button>
                          <button type="button" onClick={cancelarEdicionSalario} className="btn btn-secondary rounded-pill fw-bold hover-efecto">
                            <i className="bi bi-x-lg"></i>
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={agregarSalario} className="btn btn-success w-100 rounded-pill fw-bold hover-efecto">
                          <i className="bi bi-plus-circle me-1"></i> Registrar
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-hover align-middle border bg-white">
                      <thead className="bg-light text-muted small">
                        <tr>
                          <th>Fecha</th>
                          <th>Salario Anterior</th>
                          <th>Salario Nuevo</th>
                          <th>Motivo</th>
                          <th className="text-end">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(!formData.acciones_personal?.salario || formData.acciones_personal.salario.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="text-center py-3 text-muted">No hay incrementos salariales registrados.</td>
                          </tr>
                        ) : (
                          formData.acciones_personal.salario.map((item, idx) => (
                            <tr key={idx} className={editingSalIndex === idx ? 'table-warning' : ''}>
                              <td>{item.fecha}</td>
                              <td className="text-muted">{item.salario_anterior}</td>
                              <td className="fw-bold text-success">{item.salario_nuevo}</td>
                              <td>{item.motivo}</td>
                              <td className="text-end">
                                <div className="d-flex justify-content-end gap-2">
                                  <button type="button" onClick={() => editarSalario(idx)} className="btn btn-sm btn-outline-primary rounded-pill"><i className="bi bi-pencil-fill"></i></button>
                                  <button type="button" onClick={() => eliminarSalario(idx)} className="btn btn-sm btn-outline-danger rounded-pill"><i className="bi bi-trash-fill"></i></button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 9: SUPPORTING DOCUMENTS (ADMIN ONLY) */}
            {mostrarPaso7 && (
              <div className={`wizard-panel ${activeStep === 9 ? 'activo' : ''}`}>
                <div className="seccion-titulo"><i className="bi bi-file-earmark-arrow-up-fill me-2 text-success"></i>Paso 9: Consignación de Documentos Soporte (Checklist RRHH)</div>
                <p className="small text-muted mb-4">
                  Marque los documentos físicos que han sido efectivamente archivados en la carpeta del docente.
                </p>

                <div className="row g-3">
                  {[
                    { key: 'cedula', label: 'Copia de Cédula de Identidad', desc: 'Copia fotostática ampliada y legible.' },
                    { key: 'titulo', label: 'Copia del Título o Títulos', desc: 'Copia de títulos universitarios y de postgrado.' },
                    { key: 'cv', label: 'Síntesis Curricular (Currículo)', desc: 'Hoja de vida física actualizada y firmada.' },
                    { key: 'constancia', label: 'Constancia de Trabajo', desc: 'Credencial o constancia del centro educativo.' },
                    { key: 'copia_ficha', label: 'Copia de la Ficha Docente', desc: 'Copia firmada de la ficha de datos oficial.' },
                    { key: 'ficha_tecnica', label: 'Ficha Técnica de RRHH', desc: 'Resumen técnico emitido por el departamento.' },
                  ].map((doc) => {
                    const isChecked = formData.documentos[doc.key as keyof ExpedienteData['documentos']] || false;
                    return (
                      <div key={doc.key} className="col-md-6">
                        <div 
                          className="caja-dinamica d-flex align-items-center justify-content-between p-3 border rounded-4 shadow-sm transition-all"
                          style={{ backgroundColor: isChecked ? '#f0fdf4' : '#fafafa', borderColor: isChecked ? '#a7f3d0' : '#e2e8f0', transition: 'all 0.2s' }}
                        >
                          <div>
                            <h6 className="mb-1 fw-bold text-dark">
                              <i className={`bi ${isChecked ? 'bi-check-circle-fill text-success' : 'bi-file-earmark-text text-muted'} me-2`}></i>
                              {doc.label}
                            </h6>
                            <small className="text-muted">{doc.desc}</small>
                          </div>
                          <div className="form-check form-switch fs-4">
                            <input 
                              className="form-check-input check-verde"
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleDocumentToggle(doc.key as keyof ExpedienteData['documentos'])}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 10: VACATION PLANNING PAAV (ADMIN ONLY) */}
            {mostrarPaso7 && (
              <div className={`wizard-panel ${activeStep === 10 ? 'activo' : ''}`}>
                <div className="seccion-titulo"><i className="bi bi-calendar-date-fill me-2 text-success"></i>Paso 10: Planificación PAAV - Programación de Vacaciones</div>
                <p className="small text-muted mb-4">
                  Configure las vacaciones del docente. El sistema calcula automáticamente los días hábiles (excluyendo fines de semana) y determina la fecha exacta de retorno al trabajo.
                </p>

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Fecha Aniversaria del Docente</label>
                    <input 
                      type="date"
                      className="form-control input-moderno"
                      value={formData.fecha_aniversaria || ''}
                      onChange={(e) => handleChange('fecha_aniversaria', e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Periodo Vacacional</label>
                    <input 
                      type="text"
                      className="form-control input-moderno"
                      placeholder="Ej. 2025-2026"
                      value={formData.periodo_vacacional || ''}
                      onChange={(e) => handleChange('periodo_vacacional', e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Cargo Actual del Docente</label>
                    <input 
                      type="text"
                      className="form-control input-moderno"
                      placeholder="Ej. Especialista en Dificultades"
                      value={formData.cargo_actual || ''}
                      onChange={(e) => handleChange('cargo_actual', e.target.value)}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Inicio Vacaciones (Desde)</label>
                    <input 
                      type="date"
                      className="form-control input-moderno"
                      value={formData.vacaciones_desde || ''}
                      onChange={(e) => handleChange('vacaciones_desde', e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Fin Vacaciones (Hasta)</label>
                    <input 
                      type="date"
                      className="form-control input-moderno"
                      value={formData.vacaciones_hasta || ''}
                      onChange={(e) => handleChange('vacaciones_hasta', e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Indicador SAP (Usuario)</label>
                    <input 
                      type="text"
                      className="form-control input-moderno"
                      placeholder="Ej. ACOSTAPH"
                      value={formData.indicador || ''}
                      onChange={(e) => handleChange('indicador', e.target.value)}
                    />
                  </div>

                  <div className="col-md-4 col-6">
                    <label className="form-label">Días Continuos (Auto-calculado)</label>
                    <input 
                      type="number"
                      className="form-control input-moderno text-dark fw-bold"
                      value={formData.dias_continuos || 0}
                      disabled
                      readOnly
                      style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}
                    />
                  </div>
                  <div className="col-md-4 col-6">
                    <label className="form-label">Días Hábiles (Auto-calculado)</label>
                    <input 
                      type="number"
                      className="form-control input-moderno text-success fw-bold"
                      value={formData.dias_habiles || 0}
                      disabled
                      readOnly
                      style={{ backgroundColor: '#f0fdf4', color: '#15803d', fontWeight: 'bold' }}
                    />
                  </div>
                  <div className="col-md-4 col-12">
                    <label className="form-label">Fecha de Retorno (Auto-calculado)</label>
                    <input 
                      type="date"
                      className="form-control input-moderno text-primary fw-bold"
                      value={formData.fecha_retorno || ''}
                      disabled
                      readOnly
                      style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 'bold' }}
                    />
                  </div>

                  {/* Supervisor Details Section */}
                  <div className="col-12 mt-4">
                    <h6 className="fw-bold text-dark border-bottom pb-2">
                      <i className="bi bi-person-badge-fill me-2 text-success"></i>
                      Información del Supervisor Inmediato
                    </h6>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Supervisor Inmediato</label>
                    <input 
                      type="text"
                      className="form-control input-moderno"
                      placeholder="Ej. Luis Ricardo Salmeron"
                      value={formData.supervisor_nombre || ''}
                      onChange={(e) => handleChange('supervisor_nombre', e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Cédula del Supervisor</label>
                    <input 
                      type="text"
                      className="form-control input-moderno"
                      placeholder="Ej. 17242954"
                      value={formData.supervisor_cedula || ''}
                      onChange={(e) => handleChange('supervisor_cedula', e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Teléfono del Supervisor</label>
                    <input 
                      type="text"
                      className="form-control input-moderno"
                      placeholder="Ej. 0412-1234567"
                      value={formData.supervisor_telefono || ''}
                      onChange={(e) => handleChange('supervisor_telefono', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

              </div>{/* end Form Panels */}
            </div>{/* end Sidebar Layout */}

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

              {activeStep < totalPasos ? (
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
