import React, { useState, useEffect } from 'react';
import imageCompression from 'browser-image-compression';

import { supabase } from '../../lib/supabase';

import { usePermisos } from '../../hooks/usePermisos';

import { auditar } from '../../lib/audit';
import { toTitulo } from '../../lib/formatters';



const handleTituloChange = (

  e: React.ChangeEvent<HTMLInputElement>,

  setter: (val: string) => void

) => {

  const raw = e.target.value;

  const endsWithSpace = raw.endsWith(' ');

  const converted = toTitulo(raw.trimEnd());

  setter(endsWithSpace ? converted + ' ' : converted);

};

const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
  const filtered = e.target.value.replace(/\D/g, '');
  setter(filtered);
};

const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
  const filtered = e.target.value.replace(/[^\d-]/g, '');
  setter(filtered);
};

const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
  const filtered = e.target.value.replace(/\s/g, '').toLowerCase();
  setter(filtered);
};



interface SolicitudForm {
  acepta_terminos: boolean;
  codigo_unico: string;

  // Estudiante
  estudiante_nombres: string;
  estudiante_apellidos: string;
  estudiante_cedula: string;
  estudiante_fecha_nacimiento: string;
  estudiante_pais_nacimiento: string;
  estudiante_pais_nacimiento_otro?: string;
  estudiante_lugar_nacimiento: string;
  estudiante_municipio_nacimiento: string;
  estudiante_estado_nacimiento: string;
  estudiante_folio_nacimiento: string;
  estudiante_acta_nacimiento: string;
  estudiante_fecha_acta_nacimiento: string;
  estudiante_sexo: string;
  estudiante_condicion_neuro: string;
  estudiante_tipo_condicion: string;
  estudiante_tipo_condicion_otro: string;
  estudiante_informe_neuro: boolean;
  estudiante_certificado_conapdis: boolean;
  estudiante_grupo_sanguineo: string;
  estudiante_condicion_medica: string;
  estudiante_condicion_medica_otro: string;
  estudiante_alergico_medicamentos: string;
  estudiante_alergico_medicamentos_otro: string;
  estudiante_tiene_alergia_medicamentos: string;
  estudiante_tiene_alergia_alimentos: string;
  estudiante_alergia_alimentos: string;
  estudiante_alergia_alimentos_otro: string;
  estudiante_tiene_otras_alergias: string;
  estudiante_otras_alergias: string;
  estudiante_otras_alergias_otro: string;
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

  // Ruta Escolar
  requiere_transporte: boolean;
  ruta_transporte: string;
  parada_transporte: string;

  // Antropometricos
  talla_franela: string;
  talla_pantalon: string;
  talla_calzado: string;
  estatura_metros: string;
  peso_kg: string;

  // Documentos fotográficos
  foto_carnet_url?: string;
  foto_cedula_estudiante_url?: string;
  foto_partida_nacimiento_url?: string;
  foto_cedula_madre_url?: string;
  foto_cedula_padre_url?: string;

  // Habilidades
  tiene_habilidad_cultura: string;
  habilidad_cultura_instrumento: string;
  habilidad_cultura_instrumento_otro?: string;
  habilidad_cultura_orquesta: string;
  constancia_cultura_url?: string;
  tiene_habilidad_danza: string;
  habilidad_danza_tipo: string;
  habilidad_danza_academia: string;
  constancia_danza_url?: string;
  tiene_habilidad_deporte: string;
  habilidad_deporte_disciplina: string;
  habilidad_deporte_disciplina_otro?: string;
  habilidad_deporte_academia: string;
  constancia_deporte_url?: string;

  // Tecnologicos
  posee_computadora: string;
  posee_internet: string;
  posee_celular: string;

  // Representante
  representante_nombres: string;
  representante_apellidos: string;
  representante_cedula: string;
  representante_fecha_nacimiento: string;
  representante_telefono: string;
  representante_telefono2: string;
  representante_email: string;
  representante_parentesco: string;
  representante_direccion: string;
  representante_trabaja_pdvsa: string;

  // Madre
  madre_vive?: string;
  madre_es_representante?: boolean;
  madre_nombres?: string;
  madre_apellidos?: string;
  madre_cedula: string;
  madre_fecha_nacimiento?: string;
  madre_lugar_nacimiento: string;
  madre_localidad_trabajo: string;
  madre_email: string;
  madre_telefono?: string;
  madre_direccion: string;
  madre_trabaja_pdvsa: boolean | string;
  madre_formacion_hidrocarburos: string;
  madre_componente_docente: string;

  // Padre
  padre_vive?: string;
  padre_es_representante?: boolean;
  padre_reconoce: string;
  padre_nombres?: string;
  padre_apellidos?: string;
  padre_cedula?: string;
  padre_fecha_nacimiento?: string;
  padre_lugar_nacimiento: string;
  padre_email?: string;
  padre_telefono?: string;
  padre_direccion: string;
  padre_trabaja_pdvsa?: boolean | string;
  padre_formacion_hidrocarburos: string;
  padre_componente_docente: string;

  pdvsa_condicion_laboral: string;
  pdvsa_tipo_nomina: string;
  pdvsa_negocio_filial: string;
  pdvsa_gerencia: string;
  pdvsa_email_empresa: string;
  pdvsa_localidad_trabajo: string;
  pdvsa_localidad_trabajo_otra?: string;
}


const defaultForm = (): SolicitudForm => ({
  acepta_terminos: false,
  codigo_unico: '',
  estudiante_nombres: '',
  estudiante_apellidos: '',
  estudiante_cedula: '',
  estudiante_fecha_nacimiento: '',
  estudiante_pais_nacimiento: 'Venezuela',
  estudiante_pais_nacimiento_otro: '',
  estudiante_lugar_nacimiento: '',
  estudiante_municipio_nacimiento: '',
  estudiante_estado_nacimiento: '',
  estudiante_folio_nacimiento: '',
  estudiante_acta_nacimiento: '',
  estudiante_fecha_acta_nacimiento: '',
  estudiante_sexo: 'Masculino',
  estudiante_condicion_neuro: 'No',
  estudiante_tipo_condicion: '',
  estudiante_tipo_condicion_otro: '',
  estudiante_informe_neuro: false,
  estudiante_certificado_conapdis: false,
  estudiante_grupo_sanguineo: '',
  estudiante_condicion_medica: 'Ninguna',
  estudiante_condicion_medica_otro: '',
  estudiante_alergico_medicamentos: '',
  estudiante_alergico_medicamentos_otro: '',
  estudiante_tiene_alergia_medicamentos: 'No',
  estudiante_tiene_alergia_alimentos: 'No',
  estudiante_alergia_alimentos: '',
  estudiante_alergia_alimentos_otro: '',
  estudiante_tiene_otras_alergias: 'No',
  estudiante_otras_alergias: '',
  estudiante_otras_alergias_otro: '',
  grado_solicitado: '',
  parentesco: '',
  estudiante_con_quien_vive: [],
  estudiante_con_quien_vive_otro: '',
  estudiante_reconocido_por_padre: 'Si',
  estado_habitacion: '',
  municipio_habitacion: '',
  parroquia_habitacion: '',
  direccion_habitacion: '',
  tiene_otros_inscritos: false,
  plantel_procedencia: '',
  requiere_transporte: false,
  ruta_transporte: '',
  parada_transporte: '',
  talla_franela: '',
  talla_pantalon: '',
  talla_calzado: '',
  estatura_metros: '',
  peso_kg: '',
  foto_carnet_url: '',
  foto_cedula_estudiante_url: '',
  foto_partida_nacimiento_url: '',
  foto_cedula_padre_url: '',
  tiene_habilidad_cultura: 'No',
  habilidad_cultura_instrumento: '',
  habilidad_cultura_instrumento_otro: '',
  habilidad_cultura_orquesta: 'No',
  constancia_cultura_url: '',
  tiene_habilidad_danza: 'No',
  habilidad_danza_tipo: '',
  habilidad_danza_academia: 'No',
  constancia_danza_url: '',
  tiene_habilidad_deporte: 'No',
  habilidad_deporte_disciplina: '',
  habilidad_deporte_disciplina_otro: '',
  habilidad_deporte_academia: 'No',
  constancia_deporte_url: '',
  posee_computadora: 'No',
  posee_internet: 'No',
  posee_celular: 'No',
  representante_nombres: '',
  representante_apellidos: '',
  representante_cedula: '',
  representante_fecha_nacimiento: '',
  representante_telefono: '',
  representante_telefono2: '',
  representante_email: '',
  representante_parentesco: 'Padre',
  representante_direccion: '',
  representante_trabaja_pdvsa: 'No',
  madre_vive: 'Si',
  madre_es_representante: false,
  madre_nombres: '',
  madre_apellidos: '',
  madre_cedula: '',
  madre_fecha_nacimiento: '',
  madre_lugar_nacimiento: '',
  madre_localidad_trabajo: '',
  madre_email: '',
  madre_telefono: '',
  madre_direccion: '',
  madre_trabaja_pdvsa: 'No',
  madre_formacion_hidrocarburos: 'No',
  madre_componente_docente: 'No',
  padre_vive: 'Si',
  padre_es_representante: false,
  padre_reconoce: 'Si',
  padre_nombres: '',
  padre_apellidos: '',
  padre_cedula: '',
  padre_fecha_nacimiento: '',
  padre_lugar_nacimiento: '',
  padre_email: '',
  padre_telefono: '',
  padre_direccion: '',
  padre_trabaja_pdvsa: 'No',
  padre_formacion_hidrocarburos: 'No',
  padre_componente_docente: 'No',
  pdvsa_condicion_laboral: '',
  pdvsa_tipo_nomina: '',
  pdvsa_negocio_filial: '',
  pdvsa_gerencia: '',
  pdvsa_email_empresa: '',
  pdvsa_localidad_trabajo: '',
  pdvsa_localidad_trabajo_otra: ''
});

export const ActualizacionDatos: React.FC = () => {

  const { user } = usePermisos();

  const [loading, setLoading] = useState<boolean>(false);

  const [misRepresentados, setMisRepresentados] = useState<any[]>([]);

  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<any | null>(null);

  

  const [step, setStep] = useState(2);

  const [form, setForm] = useState<SolicitudForm>(defaultForm());
  const [savingStatus, setSavingStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  const subirImagen = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof SolicitudForm) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(fieldName);

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${fieldName}_${Date.now()}.${fileExt}`;
      const folderName = form.estudiante_cedula || `sin_cedula_${Date.now()}`;
      const filePath = `${folderName}/${fileName}`;

      const { error } = await supabase.storage
        .from('documentos')
        .upload(filePath, compressedFile, { upsert: true });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('documentos')
        .getPublicUrl(filePath);

      updateForm(fieldName, publicUrlData.publicUrl);
      if (Swal) Swal.fire('¡Éxito!', 'Imagen cargada correctamente.', 'success');
    } catch (error: any) {
      console.error('Error subiendo imagen:', error);
      if (Swal) Swal.fire('Error', 'No se pudo subir la imagen. Verifica tu conexión o intenta con otra imagen.', 'error');
    } finally {
      setUploadingImage(null);
      e.target.value = '';
    }
  };



  // Catálogos

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
  const [alimentosDB, setAlimentosDB] = useState<string[]>([]);
  const [otrasAlergiasDB, setOtrasAlergiasDB] = useState<string[]>([]);

  const [geoData, setGeoData] = useState<any[]>([]);

  const [estadosDB, setEstadosDB] = useState<string[]>([]);

  const [rutasTransporteDB, setRutasTransporteDB] = useState<any[]>([]);

  const [paradasTransporteDB, setParadasTransporteDB] = useState<any[]>([]);

  const [selectedRutaObj, setSelectedRutaObj] = useState<any | null>(null);

  const [selectedParadaObj, setSelectedParadaObj] = useState<any | null>(null);



  const [loadingGPS, setLoadingGPS] = useState(false);

  const escCodigo = localStorage.getItem('sigae_escuela_codigo') || 'sb';

  const esAdmin = ['SuperAdmin', 'Director', 'Administrador', 'Coordinador'].includes(user?.rol || '');

  const [cedulaBusquedaAdmin, setCedulaBusquedaAdmin] = useState<string>('');

  

  const Swal = (window as any).Swal;



  useEffect(() => {
    if (user?.cedula) {
      cargarMisRepresentados(user.cedula);
      cargarCatalogos();
    }
  }, [user]);

  // Sincronizar objetos de Ruta y Parada cuando hay datos cargados en el formulario
  useEffect(() => {
    if (rutasTransporteDB.length > 0 && form.ruta_transporte) {
      const rObj = rutasTransporteDB.find(r => form.ruta_transporte.includes(r.nombre));
      if (rObj && rObj.id !== selectedRutaObj?.id) {
        setSelectedRutaObj(rObj);
      }
    }
    if (paradasTransporteDB.length > 0 && (form.parada_transporte || form.ruta_transporte)) {
      const pObj = paradasTransporteDB.find(p => (form.parada_transporte && p.nombre_parada === form.parada_transporte) || form.ruta_transporte.includes(p.nombre_parada));
      if (pObj && pObj.id !== selectedParadaObj?.id) {
        setSelectedParadaObj(pObj);
      }
    }
  }, [form.ruta_transporte, form.parada_transporte, rutasTransporteDB, paradasTransporteDB]);

  // Auto-guardado silencioso en base de datos al estar editando (Debounce 1.5s)
  useEffect(() => {
    if (!estudianteSeleccionado) return;
    if (!form.acepta_terminos || step < 2) return;

    const timer = setTimeout(async () => {
      try {
        setSavingStatus('saving');
        const nowIso = new Date().toISOString();
        const payload = {
          datos_actualizados: form,
          fecha_ultima_actualizacion: nowIso
        };
        const { error } = await supabase.from('estudiantes_inscritos').update(payload).eq('id', estudianteSeleccionado.id);
        if (error) throw error;
        setSavingStatus('saved');
      } catch (err) {
        console.error('Error auto-guardando DB:', err);
        setSavingStatus('error');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [form, step, estudianteSeleccionado]);



  const cargarMisRepresentados = async (cedulaConsulta: string) => {

    setLoading(true);

    try {

      const { data, error } = await supabase

        .from('estudiantes_vinculaciones')

        .select('*')

        .eq('cedula_representante', cedulaConsulta)

        .order('created_at', { ascending: false });



      if (error) throw error;

      setMisRepresentados(data || []);

    } catch (err: any) {

      console.error('Error al cargar representados:', err);

    } finally {

      setLoading(false);

    }

  };



  const cargarCatalogos = async () => {

    try {

      const [gradosRes, parentescosRes, nominasRes, condRes, negociosRes, gerenciasRes, localidadesRes, neuroRes, medicaRes, alergiaRes, alimentoRes, otrasAlergiasRes] = await Promise.all([

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
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Alimento (Alergia)').order('valor', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Otra (Alergia)').order('valor', { ascending: true }),
      ]);

      

      let allGeoData: any[] = [];

      let from = 0;

      const limit = 1000;

      while (true) {

        const geoRes = await supabase.from('div_pol_vzla').select('*').order('estado', { ascending: true }).range(from, from + limit - 1);

        if (geoRes.error) throw geoRes.error;

        if (!geoRes.data || geoRes.data.length === 0) break;

        allGeoData = [...allGeoData, ...geoRes.data];

        if (geoRes.data.length < limit) break;

        from += limit;

      }



      setGradosDB(gradosRes.data?.map((g: any) => g.valor) || []);

      setParentescosDB(parentescosRes.data?.map((p: any) => p.valor) || []);

      setTiposNominaDB(nominasRes.data?.map((p: any) => p.valor) || []);

      setCondicionLaboralDB(condRes.data?.map((p: any) => p.valor) || []);

      setNegociosDB(negociosRes.data?.map((p: any) => p.valor) || []);

      setGerenciasDB(gerenciasRes.data?.map((p: any) => p.valor) || []);

      setLocalidadesDB(localidadesRes.data?.map((p: any) => p.valor) || []);

      setCondicionNeuroDB(neuroRes.data?.map((p: any) => p.valor) || []);

      setCondicionMedicaDB(medicaRes.data?.map((p: any) => p.valor) || []);

      setAlergiasDB(alergiaRes.data?.map((p: any) => p.valor) || []);
      setAlimentosDB(alimentoRes.data?.map((p: any) => p.valor) || []);
      setOtrasAlergiasDB(otrasAlergiasRes.data?.map((p: any) => p.valor) || []);



      if (allGeoData.length > 0) {

        setGeoData(allGeoData);

        setEstadosDB(Array.from(new Set(allGeoData.map((d: any) => d.estado))));

      }



      const [rutasTransRes, paradasTransRes] = await Promise.all([

        supabase.from('transporte_rutas').select('*').eq('escuela_codigo', escCodigo).order('nombre', { ascending: true }),

        supabase.from('transporte_paradas').select('*').eq('escuela_codigo', escCodigo).order('nombre_parada', { ascending: true })

      ]);

      setRutasTransporteDB(rutasTransRes.data || []);

      setParadasTransporteDB(paradasTransRes.data || []);



    } catch (e) {

      console.error('Error cargando catálogos:', e);

    }

  };



  const municipiosDisponibles = form.estado_habitacion 

    ? Array.from(new Set(geoData.filter(d => d.estado === form.estado_habitacion).map(d => d.municipio))).sort()

    : [];

  const municipiosNacimientoDisponibles = form.estudiante_estado_nacimiento 
    ? Array.from(new Set(geoData.filter(d => d.estado === form.estudiante_estado_nacimiento).map(d => d.municipio))).sort()
    : [];

  const parroquiasDisponibles = (form.estado_habitacion && form.municipio_habitacion)

    ? Array.from(new Set(geoData.filter(d => d.estado === form.estado_habitacion && d.municipio === form.municipio_habitacion).map(d => d.parroquia))).sort()

    : [];



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



  const handleBuscarAdmin = (e: React.FormEvent) => {

    e.preventDefault();

    if (cedulaBusquedaAdmin.trim()) {

      cargarMisRepresentados(cedulaBusquedaAdmin.trim());

    }

  };



  const abrirFichaEstudiante = (est: any) => {

    setEstudianteSeleccionado(est);

    if (est.datos_actualizados && Object.keys(est.datos_actualizados).length > 0) {

      setForm({ ...defaultForm(), ...est.datos_actualizados,

        estudiante_nombres: est.nombres_estudiante,

        estudiante_apellidos: est.apellidos_estudiante,

        estudiante_cedula: est.cedula_estudiante,

        grado_solicitado: est.grado_actual,

        representante_nombres: est.nombres_representante,

        representante_apellidos: est.apellidos_representante,

        representante_cedula: est.cedula_representante,

        tiene_otros_inscritos: misRepresentados.length > 1

       });

    } else {

      setForm({

        ...defaultForm(),

        estudiante_nombres: est.nombres_estudiante,

        estudiante_apellidos: est.apellidos_estudiante,

        estudiante_cedula: est.cedula_estudiante,

        grado_solicitado: est.grado_actual,

        representante_nombres: est.nombres_representante,

        representante_apellidos: est.apellidos_representante,

        representante_cedula: est.cedula_representante,

        tiene_otros_inscritos: misRepresentados.length > 1

      });

    }

    setStep(1);
  };

  // ─── LÓGICA DE COMPRESIÓN Y CARGA DE CONSTANCIAS ────────────────────────────
  const [uploadingCultura, setUploadingCultura] = useState(false);
  const [uploadingDanza, setUploadingDanza] = useState(false);
  const [uploadingDeporte, setUploadingDeporte] = useState(false);
  // Estados para documentos fotográficos
  const [uploadingFotoCarnet, setUploadingFotoCarnet] = useState(false);
  const [uploadingFotoCedulaEst, setUploadingFotoCedulaEst] = useState(false);
  const [uploadingFotoPartida, setUploadingFotoPartida] = useState(false);
  const [uploadingFotoCedulaPadre, setUploadingFotoCedulaPadre] = useState(false);

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) { resolve(file); return; }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width; let height = img.height;
          const MAX_DIMENSION = 1200;
          if (width > height && width > MAX_DIMENSION) { height *= MAX_DIMENSION / width; width = MAX_DIMENSION; }
          else if (height > MAX_DIMENSION) { width *= MAX_DIMENSION / height; height = MAX_DIMENSION; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
              else resolve(file);
            }, 'image/jpeg', 0.8);
          } else resolve(file);
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  /**
   * Compresión agresiva: máx 900px en el lado mayor, JPEG al 72%.
   * Ideal para documentos fotográficos donde el peso importa más.
   */
  const compressImageMax = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) { resolve(file); return; }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width; let height = img.height;
          const MAX_DIM = 900; // Máx 900px manteniendo nitidez
          if (width > height && width > MAX_DIM) { height = Math.round(height * MAX_DIM / width); width = MAX_DIM; }
          else if (height > MAX_DIM) { width = Math.round(width * MAX_DIM / height); height = MAX_DIM; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg', lastModified: Date.now() }));
              else resolve(file);
            }, 'image/jpeg', 0.72); // 72% calidad: excelente nitidez, peso mínimo
          } else resolve(file);
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  type TipoDocumento = 'foto_carnet' | 'foto_cedula_estudiante' | 'foto_partida_nacimiento' | 'foto_cedula_padre';
  const setUploadingDoc = (tipo: TipoDocumento, val: boolean) => {
    if (tipo === 'foto_carnet') setUploadingFotoCarnet(val);
    if (tipo === 'foto_cedula_estudiante') setUploadingFotoCedulaEst(val);
    if (tipo === 'foto_partida_nacimiento') setUploadingFotoPartida(val);
    if (tipo === 'foto_cedula_padre') setUploadingFotoCedulaPadre(val);
  };

  const handleSubirDocumento = async (e: React.ChangeEvent<HTMLInputElement>, tipo: TipoDocumento) => {
    const fileOriginal = e.target.files?.[0];
    if (!fileOriginal || !estudianteSeleccionado) return;
    if (fileOriginal.size > 8 * 1024 * 1024) {
      if (Swal) Swal.fire('Archivo muy grande', 'El archivo no debe superar los 8MB.', 'warning');
      return;
    }
    setUploadingDoc(tipo, true);
    try {
      const file = await compressImageMax(fileOriginal);
      const fileName = `${tipo}_${estudianteSeleccionado.cedula_estudiante}_${Date.now()}.jpg`;
      const filePath = `${estudianteSeleccionado.codigo_escuela}/${fileName}`;
      const { error } = await supabase.storage.from('documentos_solicitudes').upload(filePath, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('documentos_solicitudes').getPublicUrl(filePath);
      updateForm(`${tipo}_url` as keyof SolicitudForm, data.publicUrl);
      if (Swal) Swal.fire({ icon: 'success', title: 'Documento cargado', text: 'Imagen optimizada y guardada correctamente.', timer: 2000, showConfirmButton: false });
    } catch (err: any) {
      console.error('Error al subir documento:', err);
      if (Swal) Swal.fire('Error', `No se pudo subir el archivo: ${err.message}`, 'error');
    } finally {
      setUploadingDoc(tipo, false);
      e.target.value = ''; // Reset input
    }
  };

  const handleSubirConstancia = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'cultura' | 'danza' | 'deporte') => {
    const fileOriginal = e.target.files?.[0];
    if (!fileOriginal || !estudianteSeleccionado) return;

    if (fileOriginal.size > 5 * 1024 * 1024) { // 5MB MAX
      if (Swal) Swal.fire('Archivo muy grande', 'El archivo no debe superar los 5MB.', 'warning');
      return;
    }

    // Set Loading State
    if (tipo === 'cultura') setUploadingCultura(true);
    if (tipo === 'danza') setUploadingDanza(true);
    if (tipo === 'deporte') setUploadingDeporte(true);

    try {
      // Comprimir si es imagen
      const file = await compressImage(fileOriginal);
      
      const ext = file.name.split('.').pop();
      const fileName = `constancia_${tipo}_${estudianteSeleccionado.cedula_estudiante}_${Date.now()}.${ext}`;
      const filePath = `${estudianteSeleccionado.codigo_escuela}/${fileName}`;

      const { error } = await supabase.storage
        .from('documentos_solicitudes') // Usaremos el bucket de solicitudes existente
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage
        .from('documentos_solicitudes')
        .getPublicUrl(filePath);

      const url = data.publicUrl;
      
      // Actualizar el formulario y forzar el autoguardado (useEffect se encargará)
      updateForm(`constancia_${tipo}_url`, url);

      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: 'Constancia Subida',
          text: 'El documento ha sido cargado con éxito. Su peso ha sido optimizado.',
          timer: 2000,
          showConfirmButton: false
        });
      }

    } catch (err: any) {
      console.error("Error al subir constancia:", err);
      if (Swal) Swal.fire('Error', `Ocurrió un problema al subir el archivo: ${err.message}`, 'error');
    } finally {
      if (tipo === 'cultura') setUploadingCultura(false);
      if (tipo === 'danza') setUploadingDanza(false);
      if (tipo === 'deporte') setUploadingDeporte(false);
    }
  };



  // Guardado Automático Silencioso
  useEffect(() => {
    if (!estudianteSeleccionado || step === 10) return; // No auto-guardar en la confirmación final o si no hay estudiante

    setSavingStatus('saving');
    const timer = setTimeout(async () => {
      try {
        const payload = {
          datos_actualizados: form,
          fecha_ultima_actualizacion: new Date().toISOString()
        };
        const { error } = await supabase
          .from('estudiantes_vinculaciones')
          .update(payload)
          .eq('id', estudianteSeleccionado.id);
        
        if (error) throw error;
        
        // Actualizamos la lista local silenciosamente
        setMisRepresentados(prev => prev.map(m => m.id === estudianteSeleccionado.id ? { ...m, ...payload } : m));
        setSavingStatus('saved');
      } catch (err) {
        console.error('Error auto-guardando ficha:', err);
        setSavingStatus('error');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [form, step, estudianteSeleccionado]);

  const handleGuardarFicha = async () => {

    if (!estudianteSeleccionado) return;

    setLoading(true);

    try {

      const nowIso = new Date().toISOString();

      const payload = {

        datos_actualizados: form,

        fecha_ultima_actualizacion: nowIso

      };



      const { error } = await supabase

        .from('estudiantes_vinculaciones')

        .update(payload)

        .eq('id', estudianteSeleccionado.id);



      if (error) throw error;



      if (Swal) {

        Swal.fire('¡Datos Actualizados!', `Se ha actualizado la información del estudiante ${estudianteSeleccionado.nombres_estudiante}.`, 'success');

      } else {

        alert('Ficha Integral guardada exitosamente');

      }



      auditar('Actualización de Datos', 'Actualizar Ficha', `Actualizada ficha integral de ${estudianteSeleccionado.cedula_estudiante}`);

      

      setMisRepresentados(prev => prev.map(m => {

        if (m.id === estudianteSeleccionado.id) {

          return { ...m, ...payload };

        }

        return m;

      }));

      setEstudianteSeleccionado(null);

    } catch (err: any) {

      console.error(err);

      if (Swal) {

        Swal.fire('Error', `No se pudo actualizar la ficha: ${err.message}`, 'error');

      }

    } finally {

      setLoading(false);

    }

  };



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

          const calleNum = [addr.road, addr.house_number].filter(Boolean).join(' #');

          const barrio = addr.suburb || addr.neighbourhood || addr.city_district || '';

          const dirAprox = [calleNum, barrio].filter(Boolean).join(', ');

          updateForm('direccion_habitacion', dirAprox || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);

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

        if (Swal) Swal.fire('Ubicación no disponible', 'No se pudo obtener la posición.', 'warning');

      },

      { enableHighAccuracy: true, timeout: 10000 }

    );

  };





// ─── VALIDACIÓN POR PASO ─────────────────────────────────────────────────────
  const validarPaso = (numPaso: number): string[] => {
    const faltantes: string[] = [];
    const conQuienViveArr = Array.isArray(form.estudiante_con_quien_vive)
      ? form.estudiante_con_quien_vive
      : (form.estudiante_con_quien_vive ? [form.estudiante_con_quien_vive] : []);

    switch (numPaso) {
      case 2: // Representante
        if (!form.representante_telefono) faltantes.push('Teléfono Principal');
        else if (!/^\d{11}$/.test(form.representante_telefono.replace(/\D/g, ''))) faltantes.push('Teléfono Principal (formato inválido, ej. 0414-1234567)');
        
        if (form.representante_telefono2 && !/^\d{11}$/.test(form.representante_telefono2.replace(/\D/g, ''))) faltantes.push('Teléfono Alternativo (formato inválido)');

        if (!form.representante_fecha_nacimiento) faltantes.push('Fecha de Nacimiento');
        
        if (!form.representante_email) faltantes.push('Correo Electrónico');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.representante_email)) faltantes.push('Correo Electrónico (formato inválido)');

        if (!form.representante_trabaja_pdvsa || form.representante_trabaja_pdvsa === '') faltantes.push('¿Trabaja en PDVSA?');
        if (form.representante_trabaja_pdvsa === 'Sí') {
          const isJubilado = form.pdvsa_condicion_laboral?.toLowerCase().includes('jubilado') || form.pdvsa_condicion_laboral?.toLowerCase().includes('sobreviviente');
          if (!form.pdvsa_condicion_laboral) faltantes.push('Condición Laboral PDVSA');
          if (!isJubilado && !form.pdvsa_tipo_nomina) faltantes.push('Tipo de Nómina');
          if (!isJubilado && !form.pdvsa_negocio_filial) faltantes.push('Negocio / Filial');
          if (!isJubilado && !form.pdvsa_gerencia) faltantes.push('Gerencia / Dpto.');
          if (!isJubilado && !form.pdvsa_localidad_trabajo) faltantes.push('Localidad de Trabajo');
          if (!isJubilado && form.pdvsa_localidad_trabajo === 'Otra' && !form.pdvsa_localidad_trabajo_otra) faltantes.push('Localidad de Trabajo (especificar)');
          if (form.pdvsa_email_empresa && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.pdvsa_email_empresa)) faltantes.push('Correo Corporativo PDVSA (formato inválido)');
        }
        break;

      case 3: // Estudiante
        if (!form.estudiante_fecha_nacimiento) faltantes.push('Fecha de Nacimiento del Estudiante');
        if (!form.estudiante_pais_nacimiento) faltantes.push('País de Nacimiento del Estudiante');
        if (form.estudiante_pais_nacimiento === 'Otro' && !form.estudiante_pais_nacimiento_otro) faltantes.push('Especifique el País de Nacimiento');
        if (!form.estudiante_estado_nacimiento) faltantes.push('Estado/Provincia de Nacimiento del Estudiante');
        if (!form.estudiante_municipio_nacimiento) faltantes.push('Municipio/Ciudad de Nacimiento del Estudiante');
        if (!form.estudiante_folio_nacimiento) faltantes.push('Folio de la Partida de Nacimiento');
        if (!form.estudiante_acta_nacimiento) faltantes.push('Acta de la Partida de Nacimiento');
        
        if (!form.foto_carnet_url) faltantes.push('Foto Carnet del Estudiante');
        if (!form.foto_cedula_estudiante_url) faltantes.push('Foto Cédula del Estudiante');
        if (!form.foto_partida_nacimiento_url) faltantes.push('Foto Partida de Nacimiento');

        if (!form.estudiante_sexo) faltantes.push('Género');
        if (!form.parentesco) faltantes.push('Parentesco con el Trabajador/a');
        if (conQuienViveArr.length === 0) faltantes.push('¿Con quién vive el estudiante?');
        if (!form.estudiante_reconocido_por_padre) faltantes.push('¿Reconocido por el padre?');
        if (!form.estado_habitacion) faltantes.push('Estado de Habitación');
        if (!form.municipio_habitacion) faltantes.push('Municipio de Habitación');
        if (!form.direccion_habitacion) faltantes.push('Dirección Detallada');
        break;

      case 4: // Salud (renderStep5)
        if (!form.estudiante_condicion_neuro) faltantes.push('Condición Neurológica');
        if (form.estudiante_condicion_neuro === 'Sí') {
          if (!form.estudiante_tipo_condicion) faltantes.push('Tipo de Condición / Discapacidad');
          if (form.estudiante_tipo_condicion?.toLowerCase().includes('otra') && !form.estudiante_tipo_condicion_otro) faltantes.push('Tipo de Condición (especificar)');
        }
        if (!form.estudiante_grupo_sanguineo) faltantes.push('Grupo Sanguíneo');
        if (!form.estudiante_condicion_medica) faltantes.push('Condición Médica');
        if (!form.estudiante_tiene_alergia_medicamentos) faltantes.push('Alergia a Medicamentos (Sí/No)');
        if (!form.estudiante_tiene_alergia_alimentos) faltantes.push('Alergia a Alimentos (Sí/No)');
        if (!form.estudiante_tiene_otras_alergias) faltantes.push('Otras Alergias (Sí/No)');
        break;

      case 5: // Ruta Escolar (renderStep6)
        if (form.requiere_transporte) {
          if (!form.ruta_transporte) faltantes.push('Ruta de Transporte');
          if (rutasTransporteDB.length > 0 && !form.parada_transporte) faltantes.push('Parada de Transporte');
        }
        break;

      case 6: // Antropometría (renderStep7)
        if (!form.talla_franela) faltantes.push('Talla Franela');
        if (!form.talla_pantalon) faltantes.push('Talla Pantalón');
        if (!form.talla_calzado) faltantes.push('Talla Calzado');
        if (!form.estatura_metros) faltantes.push('Estatura');
        if (!form.peso_kg) faltantes.push('Peso');
        break;

      case 7: // Cultural/Dep. (renderStep8) — solo validar si seleccionó Sí
        if (!form.tiene_habilidad_cultura) faltantes.push('¿Tiene habilidad musical?');
        if (!form.tiene_habilidad_danza) faltantes.push('¿Tiene habilidad en danza?');
        if (!form.tiene_habilidad_deporte) faltantes.push('¿Practica algún deporte?');
        if (form.tiene_habilidad_cultura === 'Sí' && !form.habilidad_cultura_instrumento) faltantes.push('Instrumento Musical');
        if (form.tiene_habilidad_danza === 'Sí' && !form.habilidad_danza_tipo) faltantes.push('Tipo de Danza');
        if (form.tiene_habilidad_deporte === 'Sí' && !form.habilidad_deporte_disciplina) faltantes.push('Disciplina Deportiva');
        break;

      case 8: // Tecnología (renderStep9) — siempre tienen valores por defecto
        break;

      case 9: // Madre y Padre (renderStep4)
        if (!form.madre_nombres) faltantes.push('Nombres de la Madre');
        if (!form.madre_apellidos) faltantes.push('Apellidos de la Madre');
        if (!form.madre_cedula) faltantes.push('Cédula de la Madre');
        else if (!/^\d{6,10}$/.test(form.madre_cedula)) faltantes.push('Cédula de la Madre (inválida, solo 6-10 dígitos)');
        if (!form.madre_lugar_nacimiento) faltantes.push('Lugar de Nacimiento de la Madre');
        
        if (!form.foto_cedula_madre_url) faltantes.push('Foto Cédula de la Madre');

        if (form.madre_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.madre_email)) faltantes.push('Correo de la Madre (formato inválido)');
        if (form.madre_telefono && !/^\d{11}$/.test(form.madre_telefono.replace(/\D/g, ''))) faltantes.push('Teléfono de la Madre (formato inválido)');

        if (form.estudiante_reconocido_por_padre !== 'No') {
          if (!form.padre_nombres) faltantes.push('Nombres del Padre');
          if (!form.padre_apellidos) faltantes.push('Apellidos del Padre');
          if (!form.padre_cedula) faltantes.push('Cédula del Padre');
          else if (!/^\d{6,10}$/.test(form.padre_cedula)) faltantes.push('Cédula del Padre (inválida, solo 6-10 dígitos)');
          if (!form.padre_lugar_nacimiento) faltantes.push('Lugar de Nacimiento del Padre');
          
          if (!form.foto_cedula_padre_url) faltantes.push('Foto Cédula del Padre');

          if (form.padre_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.padre_email)) faltantes.push('Correo del Padre (formato inválido)');
          if (form.padre_telefono && !/^\d{11}$/.test(form.padre_telefono.replace(/\D/g, ''))) faltantes.push('Teléfono del Padre (formato inválido)');
        }
        break;

      default:
        break;
    }
    return faltantes;
  };

  const intentarAvanzar = (siguientePaso: number, pasoActual: number) => {
    const faltantes = validarPaso(pasoActual);
    if (faltantes.length > 0) {
      if (Swal) {
        Swal.fire({
          icon: 'warning',
          title: 'Campos requeridos',
          html: `<div class="text-start"><p class="mb-2 text-muted small">Por favor complete los siguientes campos antes de continuar:</p><ul class="mb-0">${faltantes.map(f => `<li><strong>${f}</strong></li>`).join('')}</ul></div>`,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#16a34a',
        });
      }
      return;
    }
    setStep(siguientePaso);
  };

const STEPS = [
  { num: 1, label: 'Declaración', icon: 'bi-file-text' },
  { num: 2, label: 'Representante', icon: 'bi-person-lines-fill' },
  { num: 3, label: 'Estudiante', icon: 'bi-mortarboard' },
  { num: 4, label: 'Salud', icon: 'bi-heart-pulse-fill' },
  { num: 5, label: 'Ruta Escolar', icon: 'bi-bus-front' },
  { num: 6, label: 'Antropometría', icon: 'bi-rulers' },
  { num: 7, label: 'Cultural/Dep.', icon: 'bi-palette' },
  { num: 8, label: 'Tecnología', icon: 'bi-laptop' },
  { num: 9, label: 'Madre y Padre', icon: 'bi-people-fill' },
  { num: 10, label: 'Confirmación', icon: 'bi-patch-check' },
];

  const renderStepper = () => (
    <div className="d-flex align-items-center justify-content-between mb-4 px-2" style={{ overflowX: 'auto' }}>
      {STEPS.map((s, idx) => (
        <React.Fragment key={s.num}>
          <div className="d-flex flex-column align-items-center" style={{ minWidth: 60 }}>
            <div
              className={`rounded-circle d-flex align-items-center justify-content-center fw-bold mb-1 ${step === s.num ? 'bg-success text-white shadow' : step > s.num ? 'bg-success bg-opacity-25 text-success' : 'bg-light text-muted border'}`}
              style={{ width: 40, height: 40, fontSize: 16, transition: 'all 0.3s', cursor: 'pointer' }}
              onClick={() => {
                if (s.num > step) {
                  intentarAvanzar(s.num, step);
                } else {
                  setStep(s.num);
                }
              }}
            >
              {step > s.num ? <i className="bi bi-check-lg"></i> : <i className={`bi ${s.icon}`}></i>}
            </div>
            <span style={{ fontSize: '0.65rem', color: step >= s.num ? '#166534' : '#9ca3af', fontWeight: 600, textAlign: 'center' }}>
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

  // ─── PASO 1: DECLARACIÓN ──────────────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="animate__animated animate__fadeIn">
      <div className="text-center mb-4">
        <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm"
          style={{ width: 72, height: 72, border: '2px solid rgba(22,163,74,0.2)' }}>
          <i className="bi bi-shield-fill-check text-success" style={{ fontSize: 32 }}></i>
        </div>
        <h4 className="fw-bold text-dark mb-1">Actualización de Datos del Estudiante</h4>
        <p className="text-muted small mb-0">Año Escolar {new Date().getFullYear()} – {new Date().getFullYear() + 1}</p>
      </div>

      <div className="bg-light rounded-4 p-4 border mb-4 shadow-sm" style={{ maxHeight: 420, overflowY: 'auto', fontSize: '0.88rem', lineHeight: 1.8 }}>

        <p className="mb-3"><strong>Estimado padre, madre o representante legal:</strong></p>
        <p className="mb-4">
          A través de este módulo podrá actualizar la ficha integral del estudiante de manera sencilla, rápida y segura. Antes de continuar, le pedimos leer con atención los siguientes términos y confirmar su aceptación.
        </p>

        <p className="fw-bold text-dark mb-2"><i className="bi bi-patch-check-fill text-success me-2"></i>Términos de la declaración</p>

        <ol className="mb-3 ps-4" style={{ lineHeight: 2 }}>
          <li className="mb-2">
            <strong>Veracidad de la información:</strong> declaro que todos los datos que estoy proporcionando en este formulario son verdaderos, correctos y están actualizados. Entiendo que esta información es importante para la gestión administrativa, académica y de bienestar de la institución educativa. Asumo la responsabilidad que pueda generar cualquier dato falso, incorrecto u omitido intencionalmente.
          </li>
          <li className="mb-2">
            <strong>Normativas internas y Manual de Convivencia:</strong> declaro que conozco y acepto las Normativas Internas de PDVSA, así como las normas de la institución educativa, incluyendo el Manual de Convivencia Escolar vigente, en todo lo que aplique a la relación entre la familia y el plantel.
          </li>
          <li className="mb-2">
            <strong>Responsabilidad parental:</strong> me comprometo a velar para que mi representado o representada cumpla las normas señaladas, tanto dentro como fuera de la institución, durante actividades escolares, extracurriculares y eventos institucionales.
          </li>
          <li className="mb-2">
            <strong>Responsabilidad ante incumplimientos:</strong> reconozco que tendré responsabilidad directa si mi representado o representada incumple las normas institucionales. Asimismo, acepto acudir a las instancias establecidas por la institución para atender y resolver estas situaciones.
          </li>
          <li className="mb-2">
            <strong>Aceptación de medidas correctivas:</strong> entiendo y acepto que, en caso de incumplimiento de las normas, el o la estudiante podrá estar sujeto a las medidas correctivas de acción comunitaria o pedagógicas que determine la institución, respetando siempre los derechos de los niños, niñas y adolescentes.
          </li>
        </ol>

        <p className="mb-0 text-muted small border-top pt-3">
          <i className="bi bi-check2-circle me-1 text-success fw-bold"></i>
          Al marcar la casilla inferior y hacer clic en <strong>"Continuar"</strong>, usted confirma que ha leído, comprendido y aceptado en su totalidad los términos de esta declaración.
        </p>
      </div>

      <div
        className={`p-4 rounded-4 mb-4 ${form.acepta_terminos ? 'bg-success bg-opacity-10' : 'bg-white border'}`}
        style={{ cursor: 'pointer', borderStyle: 'solid', borderWidth: 2, borderColor: form.acepta_terminos ? '#16a34a' : '#d1d5db', transition: 'all 0.3s' }}
        onClick={() => updateForm('acepta_terminos', !form.acepta_terminos)}
      >
        <div className="d-flex align-items-start gap-3">
          <div
            className={`rounded d-flex align-items-center justify-content-center flex-shrink-0 mt-1 ${form.acepta_terminos ? 'bg-success text-white' : 'bg-white border'}`}
            style={{ width: 28, height: 28, border: form.acepta_terminos ? 'none' : '2px solid #d1d5db', transition: 'all 0.2s' }}
          >
            {form.acepta_terminos && <i className="bi bi-check-lg fw-bold"></i>}
          </div>
          <div>
            <div className={`fw-bold ${form.acepta_terminos ? 'text-success' : 'text-dark'}`}>
              Acepto los Términos de la Declaración, las Normativas Institucionales y el Manual de Convivencia
            </div>
            <div className="text-muted small mt-1">
              Confirmo que los datos registrados son verídicos, que conozco y acato las normas del plantel, y que asumo responsabilidad por el cumplimiento de las mismas por parte de mi representado o representada.
            </div>
          </div>
        </div>
      </div>

      <div className="text-end">
        <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto" onClick={() => setStep(2)} disabled={!form.acepta_terminos}>
          Continuar <i className="bi bi-arrow-right ms-1"></i>
        </button>
      </div>
    </div>
  );


  // ─── PASO 2: REPRESENTANTE ──────────────────────────────────────────────────
  const renderStep2 = () => (
    <div className="animate__animated animate__fadeIn">
      <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
        <i className="bi bi-person-lines-fill text-success fs-5"></i>
        <h6 className="fw-bold text-dark mb-0">Datos del Representante Legal</h6>
      </div>

      <div className="row g-3">
        <div className="col-md-4">
          <label className="form-label fw-semibold text-muted small">Nombres (Representante) <span className="text-danger">*</span></label>
          <input type="text" className="form-control bg-light fw-bold text-dark" placeholder="Ej. Carlos Alberto"
            value={form.representante_nombres} readOnly disabled />
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold text-muted small">Apellidos (Representante) <span className="text-danger">*</span></label>
          <input type="text" className="form-control bg-light fw-bold text-dark" placeholder="Ej. Ramírez Pérez"
            value={form.representante_apellidos} readOnly disabled />
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold text-muted small">N° Cédula <span className="text-danger">*</span></label>
          <input type="text" className="form-control bg-light fw-bold text-dark" placeholder="Ej. 13567896"
            value={form.representante_cedula} readOnly disabled />
          <div className="form-text">Campo bloqueado por seguridad</div>
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">Fecha de Nacimiento <span className="text-danger">*</span></label>
          <input type="date" className="form-control input-moderno"
            value={form.representante_fecha_nacimiento || ''}
            onChange={(e) => updateForm('representante_fecha_nacimiento', e.target.value)} />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Teléfono Principal <span className="text-danger">*</span></label>
          <input type="text" className="form-control input-moderno" placeholder="Ej. 0416-6263890"
            value={form.representante_telefono} onChange={(e) => handleTelefonoChange(e, (v) => updateForm('representante_telefono', v))} />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Teléfono Alternativo</label>
          <input type="text" className="form-control input-moderno" placeholder="Ej. 0291-6518384"
            value={form.representante_telefono2} onChange={(e) => handleTelefonoChange(e, (v) => updateForm('representante_telefono2', v))} />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Correo Electrónico <span className="text-danger">*</span></label>
          <input type="email" className="form-control input-moderno" placeholder="correo@ejemplo.com"
            value={form.representante_email} onChange={(e) => handleEmailChange(e, (v) => updateForm('representante_email', v))} />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">¿Trabajador o Jubilado PDVSA? <span className="text-danger">*</span></label>
          <div className="d-flex gap-3 mt-2">
            {['Sí', 'No'].map(op => {
              const esComunidad = form.representante_parentesco === 'Comunidad' || form.parentesco === 'Comunidad';
              const disabled = esComunidad && op === 'Sí';
              const isSelected = esComunidad ? op === 'No' : form.representante_trabaja_pdvsa === op;
              return (
                <button key={op} type="button"
                  className={`btn rounded-pill px-4 fw-semibold ${isSelected ? 'btn-success shadow' : 'btn-outline-secondary'}`}
                  onClick={() => { if (!disabled) updateForm('representante_trabaja_pdvsa', op); }}
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
                  {(() => {
                    const isJubiladoOSobreviviente = form.pdvsa_condicion_laboral?.toLowerCase().includes('jubilado') || form.pdvsa_condicion_laboral?.toLowerCase().includes('sobreviviente');
                    return (
                      <>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Condición Laboral <span className="text-danger">*</span></label>
                          <select className="form-select input-moderno" value={form.pdvsa_condicion_laboral}
                            onChange={(e) => updateForm('pdvsa_condicion_laboral', e.target.value)}>
                            <option value="">Seleccione...</option>
                            {condicionLaboralDB.map((c, i) => <option key={i} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Tipo de Nómina <span className="text-danger">*</span></label>
                          <select className="form-select input-moderno" value={form.pdvsa_tipo_nomina}
                            onChange={(e) => updateForm('pdvsa_tipo_nomina', e.target.value)}
                            disabled={isJubiladoOSobreviviente}>
                            <option value="">Seleccione...</option>
                            {tiposNominaDB.map((t, i) => <option key={i} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Negocio / Filial <span className="text-danger">*</span></label>
                          <select className="form-select input-moderno" value={form.pdvsa_negocio_filial}
                            onChange={(e) => updateForm('pdvsa_negocio_filial', e.target.value)}
                            disabled={isJubiladoOSobreviviente}>
                            <option value="">Seleccione...</option>
                            {negociosDB.map((n, i) => <option key={i} value={n}>{n}</option>)}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Gerencia / Dpto. <span className="text-danger">*</span></label>
                          <select className="form-select input-moderno" value={form.pdvsa_gerencia}
                            onChange={(e) => updateForm('pdvsa_gerencia', e.target.value)}
                            disabled={isJubiladoOSobreviviente}>
                            <option value="">Seleccione...</option>
                            {gerenciasDB.map((g, i) => <option key={i} value={g}>{g}</option>)}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Correo Corporativo</label>
                          <input type="email" className="form-control input-moderno" placeholder="usuario@pdvsa.com"
                            value={form.pdvsa_email_empresa} onChange={(e) => handleEmailChange(e, (v) => updateForm('pdvsa_email_empresa', v))}
                            disabled={isJubiladoOSobreviviente} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Localidad de Trabajo <span className="text-danger">*</span></label>
                          <select className="form-select input-moderno mb-2" value={form.pdvsa_localidad_trabajo}
                            onChange={(e) => updateForm('pdvsa_localidad_trabajo', e.target.value)}
                            disabled={isJubiladoOSobreviviente}>
                            <option value="">Seleccione...</option>
                            {localidadesDB.map((l, i) => <option key={i} value={l}>{l}</option>)}
                            <option value="Otra">Otra (Especificar)</option>
                          </select>
                          {form.pdvsa_localidad_trabajo === 'Otra' && (
                            <input type="text" className="form-control input-moderno animate__animated animate__fadeIn"
                              placeholder="Especifique la localidad..."
                              value={form.pdvsa_localidad_trabajo_otra || ''}
                              onChange={(e) => updateForm('pdvsa_localidad_trabajo_otra', e.target.value)}
                              disabled={isJubiladoOSobreviviente} />
                          )}
                        </div>
                      </>
                    );
                  })()}
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
        <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto" onClick={() => intentarAvanzar(3, 2)}>
          Continuar <i className="bi bi-arrow-right ms-1"></i>
        </button>
      </div>
    </div>
  );

  // ─── PASO 3: ESTUDIANTE ──────────────────────────────────────────────────────
  const renderStep3 = () => {
    let edadEstudiante = '';
    if (form.estudiante_fecha_nacimiento) {
      const hoy = new Date();
      const fechaNac = new Date(form.estudiante_fecha_nacimiento);
      let edad = hoy.getFullYear() - fechaNac.getFullYear();
      const mes = hoy.getMonth() - fechaNac.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) edad--;
      edadEstudiante = edad >= 0 ? `${edad} años` : '';
    }

    let nivelEducativo = '';
    if (form.grado_solicitado?.includes('Grupo')) nivelEducativo = 'Educación Inicial';
    else if (form.grado_solicitado?.includes('Grado')) nivelEducativo = 'Educación Primaria';
    else if (form.grado_solicitado?.includes('Año')) nivelEducativo = 'Educación Media General';

    let advertenciaEdad = '';
    let edadEsValida = false;
    if (form.estudiante_fecha_nacimiento && form.grado_solicitado) {
      const fechaNac = new Date(form.estudiante_fecha_nacimiento);
      const añoActual = new Date().getFullYear();
      const edadAl31Dec = añoActual - fechaNac.getFullYear(); 

      const parseExpectedAge = (grade: string) => {
        const g = grade.toLowerCase();
        if (g.includes('i grupo') && !g.includes('ii') && !g.includes('iii')) return 3;
        if (g.includes('ii grupo')) return 4;
        if (g.includes('iii grupo')) return 5;
        if (g.includes('1er grado') || g.includes('1ro grado') || g.includes('primer grado')) return 6;
        if (g.includes('2do grado') || g.includes('segundo grado')) return 7;
        if (g.includes('3er grado') || g.includes('3ro grado') || g.includes('tercer grado')) return 8;
        if (g.includes('4to grado') || g.includes('cuarto grado')) return 9;
        if (g.includes('5to grado') || g.includes('quinto grado')) return 10;
        if (g.includes('6to grado') || g.includes('sexto grado')) return 11;
        if (g.includes('1er año') || g.includes('1ro año') || g.includes('primer año')) return 12;
        if (g.includes('2do año') || g.includes('segundo año')) return 13;
        if (g.includes('3er año') || g.includes('3ro año') || g.includes('tercer año')) return 14;
        if (g.includes('4to año') || g.includes('cuarto año')) return 15;
        if (g.includes('5to año') || g.includes('quinto año')) return 16;
        return -1;
      };

      const edadEsperada = parseExpectedAge(form.grado_solicitado);

      if (edadEsperada !== -1) {
        if (edadAl31Dec !== edadEsperada) {
          advertenciaEdad = 'La edad no corresponde con el grupo, grado o año académico.';
        } else {
          edadEsValida = true;
        }
      }
    }

    // Clases dinámicas de color para los inputs
    let inputColorClass = '';
    let disabledColorClass = 'bg-light fw-bold text-dark';
    
    if (advertenciaEdad) {
      inputColorClass = 'bg-warning bg-opacity-10 border-warning fw-bold text-dark';
      disabledColorClass = 'bg-warning bg-opacity-25 border-warning fw-bold text-dark';
    } else if (edadEsValida) {
      inputColorClass = 'bg-success bg-opacity-10 border-success fw-bold text-success';
      disabledColorClass = 'bg-success bg-opacity-25 border-success fw-bold text-success';
    }

    return (
    <div className="animate__animated animate__fadeIn">
      <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
        <i className="bi bi-mortarboard-fill text-success fs-5"></i>
        <h6 className="fw-bold text-dark mb-0">Datos del Estudiante</h6>
      </div>

      <div className="alert alert-warning border-0 rounded-4 p-3 d-flex align-items-center mb-4">
        <i className="bi bi-lock-fill fs-3 me-3 text-warning"></i>
        <div className="small text-dark">
          <b>Identidad Protegida (Solo Lectura):</b> Nombres, apellidos y cédula no pueden modificarse por seguridad. Para correcciones, acuda a Control de Estudios con copia de la Partida de Nacimiento.
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-4">
          <label className="form-label fw-semibold text-muted small">Nombres del Estudiante</label>
          <input type="text" className="form-control bg-light fw-bold text-dark" readOnly disabled value={form.estudiante_nombres} />
        </div>
        <div className="col-md-4">
          <label className="form-label fw-semibold text-muted small">Apellidos del Estudiante</label>
          <input type="text" className="form-control bg-light fw-bold text-dark" readOnly disabled value={form.estudiante_apellidos} />
        </div>
        <div className="col-md-4">
          <label className="form-label fw-semibold text-muted small">N° Cédula / Escolar</label>
          <input type="text" className="form-control bg-light fw-bold text-dark" readOnly disabled value={form.estudiante_cedula} />
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
          <input type="date" className={`form-control input-moderno ${inputColorClass}`} value={form.estudiante_fecha_nacimiento}
            onChange={(e) => updateForm('estudiante_fecha_nacimiento', e.target.value)} />
        </div>

        <div className="col-md-2">
          <label className="form-label fw-semibold">Edad</label>
          <input type="text" className={`form-control text-center ${disabledColorClass}`} value={edadEstudiante} disabled />
        </div>

        {advertenciaEdad ? (
          <div className="col-md-4 d-flex align-items-end pb-1 animate__animated animate__fadeIn">
            <div className="text-warning small fw-semibold lh-sm">
              <i className="bi bi-exclamation-triangle-fill me-1"></i>
              {advertenciaEdad}
            </div>
          </div>
        ) : (
          <div className="col-md-4 d-none d-md-block"></div>
        )}

        {/* ─── LUGAR DE NACIMIENTO Y PARTIDA ─── */}
        <div className="col-12 mt-4">
          <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
            <i className="bi bi-geo-fill text-success fs-5"></i>
            <h6 className="fw-bold text-dark mb-0">Lugar y Partida de Nacimiento</h6>
          </div>
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">País de Nacimiento <span className="text-danger">*</span></label>
          <select className="form-select input-moderno" value={form.estudiante_pais_nacimiento}
            onChange={(e) => {
              const val = e.target.value;
              updateForm('estudiante_pais_nacimiento', val);
              updateForm('estudiante_estado_nacimiento', '');
              updateForm('estudiante_municipio_nacimiento', '');
              updateForm('estudiante_pais_nacimiento_otro', '');
            }}>
            <option value="Venezuela">Venezuela</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        {form.estudiante_pais_nacimiento === 'Otro' && (
          <div className="col-md-4 animate__animated animate__fadeIn">
            <label className="form-label fw-semibold">Especifique el País <span className="text-danger">*</span></label>
            <input type="text" className="form-control input-moderno" placeholder="Ej. Colombia"
              value={form.estudiante_pais_nacimiento_otro || ''} onChange={(e) => handleTituloChange(e, (v) => updateForm('estudiante_pais_nacimiento_otro', v))} />
          </div>
        )}

        <div className="col-md-4">
          <label className="form-label fw-semibold">{form.estudiante_pais_nacimiento === 'Venezuela' ? 'Estado de Nac.' : 'Estado / Provincia'} <span className="text-danger">*</span></label>
          {form.estudiante_pais_nacimiento === 'Venezuela' ? (
            <select className="form-select input-moderno" value={form.estudiante_estado_nacimiento}
              onChange={(e) => {
                updateForm('estudiante_estado_nacimiento', e.target.value);
                updateForm('estudiante_municipio_nacimiento', '');
              }}>
              <option value="">Seleccione...</option>
              {estadosDB.sort().map(est => (
                <option key={est} value={est}>{est}</option>
              ))}
            </select>
          ) : (
            <input type="text" className="form-control input-moderno" placeholder="Ej. Antioquia"
              value={form.estudiante_estado_nacimiento || ''} onChange={(e) => handleTituloChange(e, (v) => updateForm('estudiante_estado_nacimiento', v))} />
          )}
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">{form.estudiante_pais_nacimiento === 'Venezuela' ? 'Municipio de Nac.' : 'Municipio / Ciudad'} <span className="text-danger">*</span></label>
          {form.estudiante_pais_nacimiento === 'Venezuela' ? (
            <select className="form-select input-moderno" value={form.estudiante_municipio_nacimiento}
              onChange={(e) => updateForm('estudiante_municipio_nacimiento', e.target.value)}
              disabled={!form.estudiante_estado_nacimiento}>
              <option value="">Seleccione...</option>
              {municipiosNacimientoDisponibles.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          ) : (
            <input type="text" className="form-control input-moderno" placeholder="Ej. Medellín"
              value={form.estudiante_municipio_nacimiento || ''} onChange={(e) => handleTituloChange(e, (v) => updateForm('estudiante_municipio_nacimiento', v))} />
          )}
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">N° Folio de Partida <span className="text-danger">*</span></label>
          <input type="text" className="form-control input-moderno" placeholder="Ej. 123"
            value={form.estudiante_folio_nacimiento || ''} onChange={(e) => updateForm('estudiante_folio_nacimiento', e.target.value)} />
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">N° Acta de Partida <span className="text-danger">*</span></label>
          <input type="text" className="form-control input-moderno" placeholder="Ej. 456"
            value={form.estudiante_acta_nacimiento || ''} onChange={(e) => updateForm('estudiante_acta_nacimiento', e.target.value)} />
        </div>
        {/* ────────────────────────────────────── */}

        {/* ─── FOTOS Y DOCUMENTOS DEL ESTUDIANTE ─── */}
        <div className="col-12 mt-4">
          <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
            <i className="bi bi-camera-fill text-success fs-5"></i>
            <h6 className="fw-bold text-dark mb-0">Documentos del Estudiante</h6>
          </div>
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold small">Foto Carnet (Fondo Blanco) <span className="text-danger">*</span></label>
          <input type="file" accept="image/*" className="form-control input-moderno form-control-sm"
            onChange={(e) => subirImagen(e, 'foto_carnet_url')} disabled={uploadingImage === 'foto_carnet_url'} />
          {uploadingImage === 'foto_carnet_url' && <div className="form-text text-primary mt-1"><span className="spinner-border spinner-border-sm me-1"></span>Subiendo...</div>}
          {form.foto_carnet_url && <div className="form-text text-success mt-1"><i className="bi bi-check-circle-fill me-1"></i>Cargada</div>}
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold small">Foto Cédula Estudiante <span className="text-danger">*</span></label>
          <input type="file" accept="image/*" className="form-control input-moderno form-control-sm"
            onChange={(e) => subirImagen(e, 'foto_cedula_estudiante_url')} disabled={uploadingImage === 'foto_cedula_estudiante_url'} />
          {uploadingImage === 'foto_cedula_estudiante_url' && <div className="form-text text-primary mt-1"><span className="spinner-border spinner-border-sm me-1"></span>Subiendo...</div>}
          {form.foto_cedula_estudiante_url && <div className="form-text text-success mt-1"><i className="bi bi-check-circle-fill me-1"></i>Cargada</div>}
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold small">Foto Partida Nacimiento <span className="text-danger">*</span></label>
          <input type="file" accept="image/*" className="form-control input-moderno form-control-sm"
            onChange={(e) => subirImagen(e, 'foto_partida_nacimiento_url')} disabled={uploadingImage === 'foto_partida_nacimiento_url'} />
          {uploadingImage === 'foto_partida_nacimiento_url' && <div className="form-text text-primary mt-1"><span className="spinner-border spinner-border-sm me-1"></span>Subiendo...</div>}
          {form.foto_partida_nacimiento_url && <div className="form-text text-success mt-1"><i className="bi bi-check-circle-fill me-1"></i>Cargada</div>}
        </div>

        <div className="col-md-6 mt-4">
          <label className="form-label fw-semibold text-muted small">Nivel Educativo</label>
          <input type="text" className="form-control bg-light fw-bold text-dark" value={nivelEducativo} disabled readOnly />
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold text-muted small">Grado o Año a Cursar</label>
          <select className={`form-select ${disabledColorClass}`} value={form.grado_solicitado} disabled>
            <option value="">Seleccione...</option>
            {gradosDB.map((g, i) => <option key={i} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label fw-semibold">Parentesco con el Trabajador/a <span className="text-danger">*</span></label>
          <select className="form-select input-moderno" value={form.parentesco}
            onChange={(e) => {
              const val = e.target.value;
              updateForm('parentesco', val);
              if (val === 'Comunidad') {
                updateForm('representante_trabaja_pdvsa', 'No');
                updateForm('madre_trabaja_pdvsa', false);
              }
            }}>
            <option value="">Seleccione...</option>
            {parentescosDB.map((p, i) => <option key={i} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold text-muted small">¿Tiene otros representados?</label>
          <input type="text" className="form-control bg-light fw-bold text-dark" 
            value={misRepresentados.length > 1 ? 'Sí' : 'No'} disabled readOnly />
        </div>

        <div className="col-md-3">
          <label className="form-label fw-semibold text-muted small">Total de representados</label>
          <input type="text" className="form-control bg-light fw-bold text-dark text-center" 
            value={misRepresentados.length} disabled readOnly />
        </div>

        <div className="col-12 mt-3">
          <label className="form-label fw-semibold d-block">
            ¿Con quién vive el estudiante? <span className="text-danger">*</span>
            <span className="text-muted fw-normal small ms-2">(Seleccione todas las que apliquen)</span>
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
                <button key={opcion} type="button"
                  className={`btn rounded-pill px-4 fw-semibold ${isSelected ? 'btn-success shadow-sm' : 'btn-outline-secondary bg-white text-dark'}`}
                  onClick={() => {
                    const newArr = isSelected ? currentArr.filter(item => item !== opcion) : [...currentArr, opcion];
                    updateForm('estudiante_con_quien_vive', newArr);
                  }}>
                  <i className={`bi ${isSelected ? 'bi-check-circle-fill' : 'bi-circle'} me-2`}></i>{opcion}
                </button>
              );
            })}
          </div>
          {(Array.isArray(form.estudiante_con_quien_vive) ? form.estudiante_con_quien_vive.includes('Otros') : false) && (
            <div className="mt-2 animate__animated animate__fadeIn col-md-6">
              <input type="text" className="form-control input-moderno"
                placeholder="Especifique con quién más vive..."
                value={form.estudiante_con_quien_vive_otro || ''}
                onChange={(e) => updateForm('estudiante_con_quien_vive_otro', e.target.value)} />
            </div>
          )}
        </div>

        <div className="col-12 mt-3">
          <label className="form-label fw-semibold d-block">
            ¿El estudiante fue reconocido por el padre? <span className="text-danger">*</span>
          </label>
          <div className="d-flex flex-wrap gap-2 mt-1">
            {['Sí', 'No'].map(opcion => (
              <button key={opcion} type="button"
                className={`btn rounded-pill px-4 fw-semibold ${form.estudiante_reconocido_por_padre === opcion ? 'btn-success shadow-sm' : 'btn-outline-secondary bg-white text-dark'}`}
                onClick={() => updateForm('estudiante_reconocido_por_padre', opcion)}>
                <i className={`bi ${form.estudiante_reconocido_por_padre === opcion ? 'bi-check-circle-fill' : 'bi-circle'} me-2`}></i>
                {opcion === 'Sí' ? 'Sí (Está en la Partida de Nacimiento)' : 'No (Reconocido solo por la Madre)'}
              </button>
            ))}
          </div>
          <div className="form-text">Si selecciona "No", en el Paso 4 solo se solicitarán los datos de la Madre.</div>
        </div>

        <div className="col-12 mt-3">
          <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
            <i className="bi bi-geo-alt-fill text-success fs-5"></i>
            <h6 className="fw-bold text-dark mb-0">Dirección de Habitación</h6>
          </div>
        </div>

        <div className="col-12">
          <button type="button" className="btn btn-outline-success rounded-pill fw-semibold hover-efecto"
            onClick={handleObtenerUbicacion} disabled={loadingGPS}>
            {loadingGPS
              ? <><span className="spinner-border spinner-border-sm me-2"></span>Obteniendo ubicación...</>
              : <><i className="bi bi-geo-alt-fill me-2"></i>Usar mi ubicación actual (GPS)</>}
          </button>
          <span className="text-muted small ms-3">O completa los campos manualmente</span>
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">Estado <span className="text-danger">*</span></label>
          <select className="form-select input-moderno" value={form.estado_habitacion}
            onChange={(e) => {
              updateForm('estado_habitacion', e.target.value);
              updateForm('municipio_habitacion', '');
              updateForm('parroquia_habitacion', '');
            }}>
            <option value="">Seleccione el Estado...</option>
            {estadosDB.sort().map(est => (
              <option key={est} value={est}>{est}</option>
            ))}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">Municipio <span className="text-danger">*</span></label>
          <select className="form-select input-moderno" value={form.municipio_habitacion}
            onChange={(e) => { updateForm('municipio_habitacion', e.target.value); updateForm('parroquia_habitacion', ''); }}
            disabled={!form.estado_habitacion}>
            <option value="">Seleccione el Municipio...</option>
            {municipiosDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">Parroquia / Sector</label>
          <select className="form-select input-moderno" value={form.parroquia_habitacion}
            onChange={(e) => updateForm('parroquia_habitacion', e.target.value)}
            disabled={!form.municipio_habitacion}>
            <option value="">Seleccione la Parroquia...</option>
            {parroquiasDisponibles.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="col-12">
          <label className="form-label fw-semibold">Dirección Detallada <span className="text-danger">*</span></label>
          <input type="text" className="form-control input-moderno"
            placeholder="Ej. Guaritos I, Vereda 52, Casa #24"
            value={form.direccion_habitacion}
            onChange={(e) => updateForm('direccion_habitacion', e.target.value)} />
          <div className="form-text">Indica la urbanización, vereda, casa o apartamento</div>
        </div>
      </div>

      {/* ─── DOCUMENTOS FOTOGRÁFICOS DEL ESTUDIANTE ─── */}
      <div className="mt-4">
        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
          <i className="bi bi-camera-fill text-success fs-5"></i>
          <div>
            <h6 className="fw-bold text-dark mb-0">Documentos Fotográficos del Estudiante</h6>
            <span className="text-muted small">Imágenes optimizadas automáticamente al mínimo peso con máxima nitidez</span>
          </div>
        </div>
        <div className="row g-3">
          {([
            { tipo: 'foto_carnet' as TipoDocumento, label: 'Foto Tipo Carnet', sub: 'Fondo blanco · cara visible', icon: 'bi-person-bounding-box', color: 'primary', urlKey: 'foto_carnet_url' as keyof SolicitudForm, uploading: uploadingFotoCarnet },
            { tipo: 'foto_cedula_estudiante' as TipoDocumento, label: 'Foto Cédula del Estudiante', sub: 'Ambas caras si aplica', icon: 'bi-card-image', color: 'warning', urlKey: 'foto_cedula_estudiante_url' as keyof SolicitudForm, uploading: uploadingFotoCedulaEst },
            { tipo: 'foto_partida_nacimiento' as TipoDocumento, label: 'Partida de Nacimiento', sub: 'Copia legible del documento', icon: 'bi-file-earmark-person', color: 'info', urlKey: 'foto_partida_nacimiento_url' as keyof SolicitudForm, uploading: uploadingFotoPartida },
          ]).map(({ tipo, label, sub, icon, color, urlKey, uploading }) => {
            const url = form[urlKey] as string;
            return (
              <div key={tipo} className="col-md-4">
                <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                  <div className={`card-header bg-${color}-subtle d-flex align-items-center gap-2 py-2`}>
                    <i className={`bi ${icon} text-${color} fs-5`}></i>
                    <div>
                      <div className="fw-bold small text-dark">{label}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>{sub}</div>
                    </div>
                  </div>
                  <div className="card-body p-2 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 140 }}>
                    {url ? (
                      <div className="text-center w-100">
                        <img src={url} alt={label} className="img-fluid rounded-3 mb-2 shadow-sm"
                          style={{ maxHeight: 120, objectFit: 'cover', width: '100%' }} />
                        <div className="d-flex gap-1 justify-content-center">
                          <a href={url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success rounded-pill px-2">
                            <i className="bi bi-eye me-1"></i>Ver
                          </a>
                          <label className="btn btn-sm btn-outline-secondary rounded-pill px-2 mb-0" style={{ cursor: 'pointer' }}>
                            <i className="bi bi-arrow-repeat me-1"></i>Cambiar
                            <input type="file" accept="image/*" className="d-none" onChange={(e) => handleSubirDocumento(e, tipo)} />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="d-flex flex-column align-items-center justify-content-center gap-2 w-100 h-100 rounded-3 p-3"
                        style={{ cursor: uploading ? 'default' : 'pointer', border: '2px dashed #cbd5e1', background: '#f8fafc', minHeight: 130 }}>
                        {uploading ? (
                          <><span className="spinner-border spinner-border-sm text-success"></span><span className="small text-muted">Subiendo...</span></>
                        ) : (
                          <><i className={`bi bi-cloud-arrow-up fs-2 text-${color}`}></i>
                            <span className="small fw-semibold text-dark text-center">{label}</span>
                            <span className="text-muted" style={{ fontSize: '0.7rem' }}>Clic para seleccionar imagen</span></>
                        )}
                        <input type="file" accept="image/*" className="d-none" disabled={uploading}
                          onChange={(e) => handleSubirDocumento(e, tipo)} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="d-flex justify-content-between mt-4 pt-3 border-top">
        <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(2)}>
          <i className="bi bi-arrow-left me-1"></i> Anterior
        </button>
        <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto" onClick={() => intentarAvanzar(4, 3)}>
          Continuar <i className="bi bi-arrow-right ms-1"></i>
        </button>
      </div>
    </div>
    );
  };

  // ─── PASO 4: MADRE Y PADRE ───────────────────────────────────────────────────
  const renderStep4 = () => {
    const copiarDeRepresentanteMadre = (checked: boolean) => {
      if (checked) {
        setForm(prev => {
          const newState = {
            ...prev,
            madre_es_representante: true,
            madre_nombres: toTitulo(prev.representante_nombres || ''),
            madre_apellidos: toTitulo(prev.representante_apellidos || ''),
            madre_cedula: prev.representante_cedula || '',
            madre_email: prev.representante_email || '',
            madre_telefono: prev.representante_telefono || '',
            madre_fecha_nacimiento: prev.representante_fecha_nacimiento || '',
            madre_direccion: prev.representante_direccion || '',
            madre_trabaja_pdvsa: prev.representante_trabaja_pdvsa === 'Sí',
          };
          if (prev.padre_es_representante) {
            newState.padre_es_representante = false;
            newState.padre_nombres = '';
            newState.padre_apellidos = '';
            newState.padre_cedula = '';
            newState.padre_email = '';
            newState.padre_telefono = '';
            newState.padre_fecha_nacimiento = '';
            newState.padre_direccion = '';
            newState.padre_trabaja_pdvsa = false;
          }
          return newState;
        });
        if (Swal) Swal.fire({ icon: 'success', title: 'Datos Copiados', text: 'Se autocompletaron los datos de la madre.', timer: 2000, showConfirmButton: false });
      } else {
        setForm(prev => ({
          ...prev,
          madre_es_representante: false,
          madre_nombres: '',
          madre_apellidos: '',
          madre_cedula: '',
          madre_email: '',
          madre_telefono: '',
          madre_fecha_nacimiento: '',
          madre_direccion: '',
          madre_trabaja_pdvsa: false,
        }));
      }
    };

    const copiarDeRepresentantePadre = (checked: boolean) => {
      if (checked) {
        setForm(prev => {
          const newState = {
            ...prev,
            padre_es_representante: true,
            padre_nombres: toTitulo(prev.representante_nombres || ''),
            padre_apellidos: toTitulo(prev.representante_apellidos || ''),
            padre_cedula: prev.representante_cedula || '',
            padre_email: prev.representante_email || '',
            padre_telefono: prev.representante_telefono || '',
            padre_fecha_nacimiento: prev.representante_fecha_nacimiento || '',
            padre_direccion: prev.representante_direccion || '',
            padre_trabaja_pdvsa: prev.representante_trabaja_pdvsa === 'Sí',
          };
          if (prev.madre_es_representante) {
            newState.madre_es_representante = false;
            newState.madre_nombres = '';
            newState.madre_apellidos = '';
            newState.madre_cedula = '';
            newState.madre_email = '';
            newState.madre_telefono = '';
            newState.madre_fecha_nacimiento = '';
            newState.madre_direccion = '';
            newState.madre_trabaja_pdvsa = false;
          }
          return newState;
        });
        if (Swal) Swal.fire({ icon: 'success', title: 'Datos Copiados', text: 'Se autocompletaron los datos del padre.', timer: 2000, showConfirmButton: false });
      } else {
        setForm(prev => ({
          ...prev,
          padre_es_representante: false,
          padre_nombres: '',
          padre_apellidos: '',
          padre_cedula: '',
          padre_email: '',
          padre_telefono: '',
          padre_fecha_nacimiento: '',
          padre_direccion: '',
          padre_trabaja_pdvsa: false,
        }));
      }
    };

    return (
      <div className="animate__animated animate__fadeIn">
        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
          <i className="bi bi-people-fill text-success fs-4"></i>
          <div>
            <h6 className="fw-bold text-dark mb-0">Datos Biológicos de la Madre y el Padre</h6>
            <span className="text-muted small">Información de los progenitores del estudiante</span>
          </div>
        </div>

        {/* MADRE */}
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
                  onClick={() => updateForm('madre_vive', 'Sí')}>Sí</button>
                <button type="button"
                  className={`btn rounded-pill px-3 fw-bold ${form.madre_vive === 'No' ? 'btn-danger' : 'btn-outline-secondary'}`}
                  onClick={() => updateForm('madre_vive', 'No')}>No</button>
              </div>
            </div>
          </div>

          {form.madre_vive === 'No' && (
            <div className="alert alert-warning border-0 d-flex align-items-center gap-2 mb-3 py-2 rounded-3 small">
              <i className="bi bi-info-circle-fill fs-5 text-warning"></i>
              <span>Has indicado que la madre ha fallecido. Ingresa sus datos tal como aparecen en la partida de nacimiento.</span>
            </div>
          )}

          {form.madre_vive !== 'No' && (
            <div className="bg-white p-3 rounded-3 border mb-3 shadow-sm d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-lightning-charge-fill text-warning fs-5"></i>
                <span className="small fw-semibold text-dark">¿La madre es la misma Representante Legal?</span>
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
                value={form.madre_nombres || ''} onChange={(e) => handleTituloChange(e, (v) => updateForm('madre_nombres', v))}
                disabled={!!form.madre_es_representante && form.madre_vive !== 'No'} />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold small">Apellidos de la Madre <span className="text-danger">*</span></label>
              <input type="text" className="form-control input-moderno" placeholder="Ej. González Pérez"
                value={form.madre_apellidos || ''} onChange={(e) => handleTituloChange(e, (v) => updateForm('madre_apellidos', v))}
                disabled={!!form.madre_es_representante && form.madre_vive !== 'No'} />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold small">Cédula de Identidad <span className="text-danger">*</span></label>
              <input type="text" className="form-control input-moderno"
                value={form.madre_cedula || ''} onChange={(e) => handleCedulaChange(e, (v) => updateForm('madre_cedula', v))}
                disabled={!!form.madre_es_representante && form.madre_vive !== 'No'} />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold small">Fecha de Nacimiento</label>
              <input type="date" className="form-control input-moderno"
                value={form.madre_fecha_nacimiento || ''} onChange={(e) => updateForm('madre_fecha_nacimiento', e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold small">Lugar de Nacimiento <span className="text-danger">*</span></label>
              <input type="text" className="form-control input-moderno" placeholder="Ej. Caracas, Miranda"
                value={form.madre_lugar_nacimiento || ''} onChange={(e) => handleTituloChange(e, (v) => updateForm('madre_lugar_nacimiento', v))} />
            </div>

            {form.madre_vive !== 'No' && (
              <>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">Teléfono de Contacto</label>
                  <input type="text" className="form-control input-moderno" placeholder="Ej. 0414-1234567"
                    value={form.madre_telefono || ''} onChange={(e) => handleTelefonoChange(e, (v) => updateForm('madre_telefono', v))}
                    disabled={!!form.madre_es_representante} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">Correo Electrónico</label>
                  <input type="email" className="form-control input-moderno"
                    value={form.madre_email || ''} onChange={(e) => handleEmailChange(e, (v) => updateForm('madre_email', v))}
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

                {/* ─── FOTO CÉDULA MADRE ─── */}
                <div className="col-md-12 mt-3">
                  <label className="form-label fw-semibold small">Foto Cédula de la Madre <span className="text-danger">*</span></label>
                  <input type="file" accept="image/*" className="form-control input-moderno form-control-sm"
                    onChange={(e) => subirImagen(e, 'foto_cedula_madre_url')} disabled={uploadingImage === 'foto_cedula_madre_url'} />
                  {uploadingImage === 'foto_cedula_madre_url' && <div className="form-text text-primary mt-1"><span className="spinner-border spinner-border-sm me-1"></span>Subiendo...</div>}
                  {form.foto_cedula_madre_url && <div className="form-text text-success mt-1"><i className="bi bi-check-circle-fill me-1"></i>Cargada</div>}
                </div>
              </>
            )}
          </div>
        </div>

        {/* PADRE */}
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
                    onClick={() => updateForm('padre_vive', 'Sí')}>Sí</button>
                  <button type="button"
                    className={`btn rounded-pill px-3 fw-bold ${form.padre_vive === 'No' ? 'btn-danger' : 'btn-outline-secondary'}`}
                    onClick={() => updateForm('padre_vive', 'No')}>No</button>
                </div>
              </div>
            )}
          </div>

          {form.estudiante_reconocido_por_padre === 'No' ? (
            <div className="alert alert-secondary border-0 d-flex align-items-center gap-3 mb-0 py-3 rounded-3 shadow-sm">
              <i className="bi bi-info-circle-fill fs-3 text-secondary"></i>
              <div>
                <strong className="d-block text-dark">Estudiante no reconocido por el padre</strong>
                <span className="small text-muted">Has indicado en el Paso 3 que el estudiante solo fue reconocido por la madre. Los datos del padre no son requeridos.</span>
              </div>
            </div>
          ) : (
            <>
              {form.padre_vive === 'No' && (
                <div className="alert alert-warning border-0 d-flex align-items-center gap-2 mb-3 py-2 rounded-3 small">
                  <i className="bi bi-info-circle-fill fs-5 text-warning"></i>
                  <span>Has indicado que el padre ha fallecido. Ingresa sus datos tal como aparecen en la partida de nacimiento.</span>
                </div>
              )}

              {form.padre_vive !== 'No' && (
                <div className="bg-white p-3 rounded-3 border mb-3 shadow-sm d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-lightning-charge-fill text-warning fs-5"></i>
                    <span className="small fw-semibold text-dark">¿El padre es el mismo Representante Legal?</span>
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
                  <input type="text" className="form-control input-moderno"
                    value={form.padre_nombres || ''} onChange={(e) => handleTituloChange(e, (v) => updateForm('padre_nombres', v))}
                    disabled={!!form.padre_es_representante && form.padre_vive !== 'No'} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">Apellidos del Padre <span className="text-danger">*</span></label>
                  <input type="text" className="form-control input-moderno"
                    value={form.padre_apellidos || ''} onChange={(e) => handleTituloChange(e, (v) => updateForm('padre_apellidos', v))}
                    disabled={!!form.padre_es_representante && form.padre_vive !== 'No'} />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">Cédula de Identidad <span className="text-danger">*</span></label>
                  <input type="text" className="form-control input-moderno"
                    value={form.padre_cedula || ''} onChange={(e) => handleCedulaChange(e, (v) => updateForm('padre_cedula', v))}
                    disabled={!!form.padre_es_representante && form.padre_vive !== 'No'} />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">Fecha de Nacimiento</label>
                  <input type="date" className="form-control input-moderno"
                    value={form.padre_fecha_nacimiento || ''} onChange={(e) => updateForm('padre_fecha_nacimiento', e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">Lugar de Nacimiento <span className="text-danger">*</span></label>
                  <input type="text" className="form-control input-moderno" placeholder="Ej. Maracaibo, Zulia"
                    value={form.padre_lugar_nacimiento || ''} onChange={(e) => handleTituloChange(e, (v) => updateForm('padre_lugar_nacimiento', v))} />
                </div>

                {form.padre_vive !== 'No' && (
                  <>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold small">Teléfono de Contacto</label>
                      <input type="text" className="form-control input-moderno"
                        value={form.padre_telefono || ''} onChange={(e) => handleTelefonoChange(e, (v) => updateForm('padre_telefono', v))}
                        disabled={!!form.padre_es_representante} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Correo Electrónico</label>
                      <input type="email" className="form-control input-moderno"
                        value={form.padre_email || ''} onChange={(e) => handleEmailChange(e, (v) => updateForm('padre_email', v))}
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

                    {/* ─── FOTO CÉDULA PADRE ─── */}
                    <div className="col-md-12 mt-3">
                      <label className="form-label fw-semibold small">Foto Cédula del Padre <span className="text-danger">*</span></label>
                      <input type="file" accept="image/*" className="form-control input-moderno form-control-sm"
                        onChange={(e) => subirImagen(e, 'foto_cedula_padre_url')} disabled={uploadingImage === 'foto_cedula_padre_url'} />
                      {uploadingImage === 'foto_cedula_padre_url' && <div className="form-text text-primary mt-1"><span className="spinner-border spinner-border-sm me-1"></span>Subiendo...</div>}
                      {form.foto_cedula_padre_url && <div className="form-text text-success mt-1"><i className="bi bi-check-circle-fill me-1"></i>Cargada</div>}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className="d-flex justify-content-between mt-4 pt-3 border-top">
          <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(8)}>
            <i className="bi bi-arrow-left me-1"></i> Anterior
          </button>
          <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto" onClick={() => intentarAvanzar(10, 9)}>
            Continuar <i className="bi bi-arrow-right ms-1"></i>
          </button>
        </div>
      </div>
    );
  };

  // ─── PASO 5: SALUD ───────────────────────────────────────────────────────────
  const renderStep5 = () => {
    return (
      <div className="animate__animated animate__fadeIn">
        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
          <i className="bi bi-heart-pulse-fill text-danger fs-5"></i>
          <h6 className="fw-bold text-dark mb-0">Información de Salud y Bienestar (Confidencial)</h6>
        </div>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label fw-semibold">Condición Neurológica <span className="text-danger">*</span></label>
            <select className="form-select input-moderno" value={form.estudiante_condicion_neuro}
              onChange={(e) => updateForm('estudiante_condicion_neuro', e.target.value)}>
              <option value="No">No</option>
              <option value="Sí">Sí</option>
            </select>
          </div>

          {form.estudiante_condicion_neuro === 'Sí' && (
            <>
              <div className="col-md-4 animate__animated animate__fadeIn">
                <label className="form-label fw-semibold">Tipo de Condición / Discapacidad <span className="text-danger">*</span></label>
                <select className="form-select input-moderno" value={form.estudiante_tipo_condicion}
                  onChange={(e) => updateForm('estudiante_tipo_condicion', e.target.value)}>
                  <option value="">Seleccione...</option>
                  {condicionNeuroDB.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="Otra">Otra (Especifique)</option>
                </select>
                {(form.estudiante_tipo_condicion?.trim().toLowerCase() === 'otro' || form.estudiante_tipo_condicion?.trim().toLowerCase() === 'otra') && (
                  <input type="text" className="form-control input-moderno mt-2 animate__animated animate__fadeIn"
                    placeholder="Especifique la condición..." value={form.estudiante_tipo_condicion_otro}
                    onChange={(e) => updateForm('estudiante_tipo_condicion_otro', e.target.value)} />
                )}
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
            <label className="form-label fw-semibold">Grupo Sanguíneo <span className="text-danger">*</span></label>
            <select className="form-select input-moderno" value={form.estudiante_grupo_sanguineo}
              onChange={(e) => updateForm('estudiante_grupo_sanguineo', e.target.value)}>
              <option value="">Seleccione...</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>

          <div className="col-md-6 animate__animated animate__fadeIn">
            <label className="form-label fw-semibold">Condición Médica <span className="text-danger">*</span></label>
            <select className="form-select input-moderno" value={form.estudiante_condicion_medica}
              onChange={(e) => updateForm('estudiante_condicion_medica', e.target.value)}>
              <option value="">Seleccione...</option>
              {condicionMedicaDB.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="Otra">Otra (Especifique)</option>
            </select>
            {(form.estudiante_condicion_medica?.trim().toLowerCase() === 'otro' || form.estudiante_condicion_medica?.trim().toLowerCase() === 'otra') && (
              <input type="text" className="form-control input-moderno mt-2 animate__animated animate__fadeIn"
                placeholder="Especifique la condición médica..." value={form.estudiante_condicion_medica_otro}
                onChange={(e) => updateForm('estudiante_condicion_medica_otro', e.target.value)} />
            )}
          </div>

          <div className="col-12 mt-2">
            <h6 className="fw-bold text-success border-bottom pb-2 mt-3"><i className="bi bi-shield-plus me-2"></i>Alergias e Intolerancias</h6>
          </div>

          <div className="col-md-4 animate__animated animate__fadeIn">
            <label className="form-label fw-semibold">¿Alérgico a medicamentos? <span className="text-danger">*</span></label>
            <div className="d-flex gap-3 mt-2">
              {['Sí', 'No'].map(opt => (
                <button key={opt} type="button"
                  className={`btn rounded-pill px-4 fw-semibold ${form.estudiante_tiene_alergia_medicamentos === opt ? 'btn-success shadow' : 'btn-outline-secondary'}`}
                  onClick={() => updateForm('estudiante_tiene_alergia_medicamentos', opt)}>
                  {opt}
                </button>
              ))}
            </div>
            {form.estudiante_tiene_alergia_medicamentos === 'Sí' && (
              <div className="mt-3 animate__animated animate__fadeIn">
                <select className="form-select input-moderno" value={form.estudiante_alergico_medicamentos}
                  onChange={(e) => updateForm('estudiante_alergico_medicamentos', e.target.value)}>
                  <option value="">Seleccione...</option>
                  {alergiasDB.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="Otra">Otra (Especifique)</option>
                </select>
                {(form.estudiante_alergico_medicamentos?.trim().toLowerCase() === 'otro' || form.estudiante_alergico_medicamentos?.trim().toLowerCase() === 'otra') && (
                  <input type="text" className="form-control input-moderno mt-2 animate__animated animate__fadeIn"
                    placeholder="Especifique el medicamento..." value={form.estudiante_alergico_medicamentos_otro}
                    onChange={(e) => updateForm('estudiante_alergico_medicamentos_otro', e.target.value)} />
                )}
              </div>
            )}
          </div>

          <div className="col-md-4 animate__animated animate__fadeIn">
            <label className="form-label fw-semibold">¿Alérgico a algún alimento? <span className="text-danger">*</span></label>
            <div className="d-flex gap-3 mt-2">
              {['Sí', 'No'].map(opt => (
                <button key={opt} type="button"
                  className={`btn rounded-pill px-4 fw-semibold ${form.estudiante_tiene_alergia_alimentos === opt ? 'btn-success shadow' : 'btn-outline-secondary'}`}
                  onClick={() => updateForm('estudiante_tiene_alergia_alimentos', opt)}>
                  {opt}
                </button>
              ))}
            </div>
            {form.estudiante_tiene_alergia_alimentos === 'Sí' && (
              <div className="mt-3 animate__animated animate__fadeIn">
                <select className="form-select input-moderno" value={form.estudiante_alergia_alimentos}
                  onChange={(e) => updateForm('estudiante_alergia_alimentos', e.target.value)}>
                  <option value="">Seleccione...</option>
                  {alimentosDB.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="Otra">Otra (Especifique)</option>
                </select>
                {(form.estudiante_alergia_alimentos?.trim().toLowerCase() === 'otro' || form.estudiante_alergia_alimentos?.trim().toLowerCase() === 'otra') && (
                  <input type="text" className="form-control input-moderno mt-2 animate__animated animate__fadeIn"
                    placeholder="Especifique el alimento..." value={form.estudiante_alergia_alimentos_otro}
                    onChange={(e) => updateForm('estudiante_alergia_alimentos_otro', e.target.value)} />
                )}
              </div>
            )}
          </div>

          <div className="col-md-4 animate__animated animate__fadeIn">
            <label className="form-label fw-semibold">¿Otras alergias/intolerancias? <span className="text-danger">*</span></label>
            <div className="d-flex gap-3 mt-2">
              {['Sí', 'No'].map(opt => (
                <button key={opt} type="button"
                  className={`btn rounded-pill px-4 fw-semibold ${form.estudiante_tiene_otras_alergias === opt ? 'btn-success shadow' : 'btn-outline-secondary'}`}
                  onClick={() => updateForm('estudiante_tiene_otras_alergias', opt)}>
                  {opt}
                </button>
              ))}
            </div>
            {form.estudiante_tiene_otras_alergias === 'Sí' && (
              <div className="mt-3 animate__animated animate__fadeIn">
                <select className="form-select input-moderno" value={form.estudiante_otras_alergias}
                  onChange={(e) => updateForm('estudiante_otras_alergias', e.target.value)}>
                  <option value="">Seleccione...</option>
                  {otrasAlergiasDB.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="Otra">Otra (Especifique)</option>
                </select>
                {(form.estudiante_otras_alergias?.trim().toLowerCase() === 'otro' || form.estudiante_otras_alergias?.trim().toLowerCase() === 'otra') && (
                  <input type="text" className="form-control input-moderno mt-2 animate__animated animate__fadeIn"
                    placeholder="Especifique..." value={form.estudiante_otras_alergias_otro}
                    onChange={(e) => updateForm('estudiante_otras_alergias_otro', e.target.value)} />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="d-flex justify-content-between mt-4 pt-3 border-top">
          <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(3)}>
            <i className="bi bi-arrow-left me-1"></i> Anterior
          </button>
          <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto" onClick={() => intentarAvanzar(5, 4)}>
            Siguiente <i className="bi bi-arrow-right ms-1"></i>
          </button>
        </div>
      </div>
    );
  };

  // ─── PASO 6: RUTA ESCOLAR ────────────────────────────────────────────────────
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
                      <select className="form-select input-moderno"
                        value={selectedRutaObj?.id || ''}
                        onChange={(e) => {
                          const routeId = e.target.value;
                          const rObj = rutasTransporteDB.find(r => r.id === routeId);
                          setSelectedRutaObj(rObj || null);
                          setSelectedParadaObj(null);
                          updateForm('ruta_transporte', rObj ? rObj.nombre : '');
                          updateForm('parada_transporte', '');
                        }}>
                        <option value="">-- Seleccionar Ruta --</option>
                        {rutasTransporteDB.map(r => (
                          <option key={r.id} value={r.id}>{r.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Parada de Transporte <span className="text-danger">*</span></label>
                      <select className="form-select input-moderno"
                        value={selectedParadaObj?.id || ''}
                        disabled={!selectedRutaObj}
                        onChange={(e) => {
                          const stopId = e.target.value;
                          const pObj = paradasTransporteDB.find(p => p.id === stopId);
                          setSelectedParadaObj(pObj || null);
                          if (selectedRutaObj && pObj) {
                            updateForm('ruta_transporte', `${selectedRutaObj.nombre} - Parada: ${pObj.nombre_parada}`);
                            updateForm('parada_transporte', pObj.nombre_parada);
                          } else {
                            updateForm('parada_transporte', '');
                          }
                        }}>
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
                      placeholder="Indica tu sector o ruta (Ej. Ruta 3 - Guaritos)"
                      value={form.ruta_transporte} onChange={(e) => updateForm('ruta_transporte', e.target.value)} />
                    <div className="form-text text-warning">
                      <i className="bi bi-exclamation-triangle-fill me-1"></i> No se encontraron rutas registradas. Escribe la ruta de preferencia.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="d-flex justify-content-between mt-4 pt-3 border-top">
          <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(4)}>
            <i className="bi bi-arrow-left me-1"></i> Anterior
          </button>
          <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto" onClick={() => intentarAvanzar(6, 5)}>
            Siguiente <i className="bi bi-arrow-right ms-1"></i>
          </button>
        </div>
      </div>
    );
  };

  // ─── PASO 7: ANTROPOMETRÍA ───────────────────────────────────────────────────
  const renderStep7 = () => (
    <div className="animate__animated animate__fadeIn">
      <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
        <i className="bi bi-rulers text-success fs-5"></i>
        <h6 className="fw-bold text-dark mb-0">Datos Antropométricos</h6>
      </div>
      <div className="row g-4">
        <div className="col-md-4">
          <label className="form-label fw-semibold">Talla de Franela o Chemise <span className="text-danger">*</span></label>
          <select className="form-select input-moderno" value={form.talla_franela} onChange={(e) => updateForm('talla_franela', e.target.value)}>
            <option value="">Seleccione...</option>
            {['2','3','4','6','8','10','12','14','16','S','M','L','XL'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label fw-semibold">Talla de Pantalón <span className="text-danger">*</span></label>
          <select className="form-select input-moderno" value={form.talla_pantalon} onChange={(e) => updateForm('talla_pantalon', e.target.value)}>
            <option value="">Seleccione...</option>
            {['2','3','4','6','8','10','12','14','16','S','M','L','XL'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label fw-semibold">Talla de Calzado <span className="text-danger">*</span></label>
          <select className="form-select input-moderno" value={form.talla_calzado} onChange={(e) => updateForm('talla_calzado', e.target.value)}>
            <option value="">Seleccione...</option>
            {Array.from({ length: 29 }, (_, i) => i + 18).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold">Estatura en Metros <span className="text-danger">*</span></label>
          <input type="number" step="0.01" className="form-control input-moderno" placeholder="Ej. 1.20"
            value={form.estatura_metros} onChange={(e) => updateForm('estatura_metros', e.target.value)} />
        </div>
        <div className="col-md-6">
          <label className="form-label fw-semibold">Peso en Kilogramos <span className="text-danger">*</span></label>
          <input type="number" step="0.1" className="form-control input-moderno" placeholder="Ej. 20.7"
            value={form.peso_kg} onChange={(e) => updateForm('peso_kg', e.target.value)} />
        </div>
      </div>
      <div className="d-flex justify-content-between mt-4 pt-3 border-top">
        <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(5)}><i className="bi bi-arrow-left me-1"></i> Anterior</button>
        <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto" onClick={() => intentarAvanzar(7, 6)}>Siguiente <i className="bi bi-arrow-right ms-1"></i></button>
      </div>
    </div>
  );

  // ─── PASO 8: CULTURAL / DEPORTIVO ───────────────────────────────────────────
  const renderStep8 = () => (
    <div className="animate__animated animate__fadeIn">
      <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
        <i className="bi bi-palette text-success fs-5"></i>
        <h6 className="fw-bold text-dark mb-0">Habilidades Culturales y Deportivas</h6>
      </div>
      <div className="row g-4">
        {/* Cultura */}
        <div className="col-md-4">
          <label className="form-label fw-semibold">Cultura (Música/Arte) <span className="text-danger">*</span></label>
          <div className="d-flex gap-3 mt-2">
            {['Sí', 'No'].map(opt => (
              <button key={opt} type="button"
                className={`btn rounded-pill px-4 fw-semibold ${form.tiene_habilidad_cultura === opt ? 'btn-success shadow' : 'btn-outline-secondary'}`}
                onClick={() => updateForm('tiene_habilidad_cultura', opt)}>
                {opt}
              </button>
            ))}
          </div>
          {form.tiene_habilidad_cultura === 'Sí' && (
            <div className="mt-3 animate__animated animate__fadeIn">
              <label className="form-label small fw-semibold text-muted">Instrumento o Habilidad</label>
              <select className="form-select input-moderno mb-2" value={form.habilidad_cultura_instrumento}
                onChange={(e) => updateForm('habilidad_cultura_instrumento', e.target.value)}>
                <option value="">Seleccione...</option>
                {['Canto / Coral', 'Cuatro', 'Arpa', 'Maracas', 'Bandola', 'Mandolina', 'Guitarra', 'Violín', 'Violonchelo / Contrabajo', 'Flauta', 'Clarinete / Oboe', 'Trompeta / Trombón', 'Percusión', 'Piano / Teclado', 'Pintura / Artes Plásticas', 'Teatro / Actuación', 'Declamación / Poesía', 'Otra'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {(form.habilidad_cultura_instrumento === 'Otra') && (
                <input type="text" className="form-control input-moderno mb-2 animate__animated animate__fadeIn"
                  placeholder="Especifique..." value={form.habilidad_cultura_instrumento_otro}
                  onChange={(e) => updateForm('habilidad_cultura_instrumento_otro', e.target.value)} />
              )}
              
              <label className="form-label small fw-semibold text-muted">¿Inscrito en el Sistema Nacional de Orquestas?</label>
              <select className="form-select input-moderno" value={form.habilidad_cultura_orquesta}
                onChange={(e) => updateForm('habilidad_cultura_orquesta', e.target.value)}>
                <option value="No">No</option>
                <option value="Sí">Sí</option>
              </select>
              
              {form.habilidad_cultura_orquesta === 'Sí' && (
                <div className="mt-3 animate__animated animate__fadeIn p-3 bg-light rounded-3 border border-secondary border-opacity-25">
                  <label className="form-label small fw-bold text-dark mb-2">
                    <i className="bi bi-file-earmark-arrow-up text-primary me-2"></i>
                    Constancia de Inscripción (Opcional)
                  </label>
                  {form.constancia_cultura_url ? (
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <a href={form.constancia_cultura_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success rounded-pill fw-bold">
                        <i className="bi bi-eye-fill me-1"></i> Ver Constancia
                      </a>
                      <label className="btn btn-sm btn-outline-secondary rounded-pill fw-bold mb-0" style={{cursor: 'pointer'}}>
                        {uploadingCultura ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-arrow-repeat me-1"></i> Reemplazar</>}
                        <input type="file" accept=".pdf,image/*" className="d-none" onChange={(e) => handleSubirConstancia(e, 'cultura')} disabled={uploadingCultura}/>
                      </label>
                    </div>
                  ) : (
                    <div>
                      <label className="btn btn-sm btn-primary rounded-pill fw-bold w-100" style={{cursor: 'pointer'}}>
                        {uploadingCultura ? (
                          <><span className="spinner-border spinner-border-sm me-2"></span> Subiendo y optimizando...</>
                        ) : (
                          <><i className="bi bi-upload me-2"></i> Seleccionar Archivo</>
                        )}
                        <input type="file" accept=".pdf,image/*" className="d-none" onChange={(e) => handleSubirConstancia(e, 'cultura')} disabled={uploadingCultura}/>
                      </label>
                      <div className="form-text small mt-1 text-center" style={{fontSize: '0.7rem'}}>Sube una foto o PDF de la constancia. Se comprimirá automáticamente.</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Danza */}
        <div className="col-md-4">
          <label className="form-label fw-semibold">Danza <span className="text-danger">*</span></label>
          <div className="d-flex gap-3 mt-2">
            {['Sí', 'No'].map(opt => (
              <button key={opt} type="button"
                className={`btn rounded-pill px-4 fw-semibold ${form.tiene_habilidad_danza === opt ? 'btn-success shadow' : 'btn-outline-secondary'}`}
                onClick={() => updateForm('tiene_habilidad_danza', opt)}>
                {opt}
              </button>
            ))}
          </div>
          {form.tiene_habilidad_danza === 'Sí' && (
            <div className="mt-3 animate__animated animate__fadeIn">
              <label className="form-label small fw-semibold text-muted">Tipo de Danza</label>
              <select className="form-select input-moderno mb-2" value={form.habilidad_danza_tipo}
                onChange={(e) => updateForm('habilidad_danza_tipo', e.target.value)}>
                <option value="">Seleccione...</option>
                {['Ballet Clásico', 'Danza Contemporánea', 'Danza Nacionalista/Folklore', 'Danza Urbana', 'Flamenco', 'Otra'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              
              <label className="form-label small fw-semibold text-muted">¿Inscrito en academia de danza?</label>
              <select className="form-select input-moderno" value={form.habilidad_danza_academia}
                onChange={(e) => updateForm('habilidad_danza_academia', e.target.value)}>
                <option value="No">No</option>
                <option value="Sí">Sí</option>
              </select>

              {form.habilidad_danza_academia === 'Sí' && (
                <div className="mt-3 animate__animated animate__fadeIn p-3 bg-light rounded-3 border border-secondary border-opacity-25">
                  <label className="form-label small fw-bold text-dark mb-2">
                    <i className="bi bi-file-earmark-arrow-up text-primary me-2"></i>
                    Constancia de Academia (Opcional)
                  </label>
                  {form.constancia_danza_url ? (
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <a href={form.constancia_danza_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success rounded-pill fw-bold">
                        <i className="bi bi-eye-fill me-1"></i> Ver Constancia
                      </a>
                      <label className="btn btn-sm btn-outline-secondary rounded-pill fw-bold mb-0" style={{cursor: 'pointer'}}>
                        {uploadingDanza ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-arrow-repeat me-1"></i> Reemplazar</>}
                        <input type="file" accept=".pdf,image/*" className="d-none" onChange={(e) => handleSubirConstancia(e, 'danza')} disabled={uploadingDanza}/>
                      </label>
                    </div>
                  ) : (
                    <div>
                      <label className="btn btn-sm btn-primary rounded-pill fw-bold w-100" style={{cursor: 'pointer'}}>
                        {uploadingDanza ? (
                          <><span className="spinner-border spinner-border-sm me-2"></span> Subiendo y optimizando...</>
                        ) : (
                          <><i className="bi bi-upload me-2"></i> Seleccionar Archivo</>
                        )}
                        <input type="file" accept=".pdf,image/*" className="d-none" onChange={(e) => handleSubirConstancia(e, 'danza')} disabled={uploadingDanza}/>
                      </label>
                      <div className="form-text small mt-1 text-center" style={{fontSize: '0.7rem'}}>Sube una foto o PDF de la constancia. Se comprimirá automáticamente.</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Deporte */}
        <div className="col-md-4">
          <label className="form-label fw-semibold">Deporte <span className="text-danger">*</span></label>
          <div className="d-flex gap-3 mt-2">
            {['Sí', 'No'].map(opt => (
              <button key={opt} type="button"
                className={`btn rounded-pill px-4 fw-semibold ${form.tiene_habilidad_deporte === opt ? 'btn-success shadow' : 'btn-outline-secondary'}`}
                onClick={() => updateForm('tiene_habilidad_deporte', opt)}>
                {opt}
              </button>
            ))}
          </div>
          {form.tiene_habilidad_deporte === 'Sí' && (
            <div className="mt-3 animate__animated animate__fadeIn">
              <label className="form-label small fw-semibold text-muted">Disciplina Deportiva</label>
              <select className="form-select input-moderno mb-2" value={form.habilidad_deporte_disciplina}
                onChange={(e) => updateForm('habilidad_deporte_disciplina', e.target.value)}>
                <option value="">Seleccione...</option>
                {['Béisbol', 'Fútbol Campo', 'Fútbol Sala (Futsal)', 'Baloncesto', 'Voleibol', 'Atletismo', 'Natación', 'Gimnasia Rítmica', 'Gimnasia Artística', 'Artes Marciales (Karate, Taekwondo, etc.)', 'Boxeo', 'Ajedrez', 'Tenis / Tenis de Mesa', 'Ciclismo', 'Patinaje', 'Kickingball', 'Otra'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {(form.habilidad_deporte_disciplina === 'Otra') && (
                <input type="text" className="form-control input-moderno mb-2 animate__animated animate__fadeIn"
                  placeholder="Especifique..." value={form.habilidad_deporte_disciplina_otro}
                  onChange={(e) => updateForm('habilidad_deporte_disciplina_otro', e.target.value)} />
              )}
              
              <label className="form-label small fw-semibold text-muted">¿Inscrito en club deportivo?</label>
              <select className="form-select input-moderno" value={form.habilidad_deporte_academia}
                onChange={(e) => updateForm('habilidad_deporte_academia', e.target.value)}>
                <option value="No">No</option>
                <option value="Sí">Sí</option>
              </select>

              {form.habilidad_deporte_academia === 'Sí' && (
                <div className="mt-3 animate__animated animate__fadeIn p-3 bg-light rounded-3 border border-secondary border-opacity-25">
                  <label className="form-label small fw-bold text-dark mb-2">
                    <i className="bi bi-file-earmark-arrow-up text-primary me-2"></i>
                    Constancia Deportiva (Opcional)
                  </label>
                  {form.constancia_deporte_url ? (
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                      <a href={form.constancia_deporte_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success rounded-pill fw-bold">
                        <i className="bi bi-eye-fill me-1"></i> Ver Constancia
                      </a>
                      <label className="btn btn-sm btn-outline-secondary rounded-pill fw-bold mb-0" style={{cursor: 'pointer'}}>
                        {uploadingDeporte ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-arrow-repeat me-1"></i> Reemplazar</>}
                        <input type="file" accept=".pdf,image/*" className="d-none" onChange={(e) => handleSubirConstancia(e, 'deporte')} disabled={uploadingDeporte}/>
                      </label>
                    </div>
                  ) : (
                    <div>
                      <label className="btn btn-sm btn-primary rounded-pill fw-bold w-100" style={{cursor: 'pointer'}}>
                        {uploadingDeporte ? (
                          <><span className="spinner-border spinner-border-sm me-2"></span> Subiendo y optimizando...</>
                        ) : (
                          <><i className="bi bi-upload me-2"></i> Seleccionar Archivo</>
                        )}
                        <input type="file" accept=".pdf,image/*" className="d-none" onChange={(e) => handleSubirConstancia(e, 'deporte')} disabled={uploadingDeporte}/>
                      </label>
                      <div className="form-text small mt-1 text-center" style={{fontSize: '0.7rem'}}>Sube una foto o PDF de la constancia. Se comprimirá automáticamente.</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
      <div className="d-flex justify-content-between mt-4 pt-3 border-top">
        <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(6)}><i className="bi bi-arrow-left me-1"></i> Anterior</button>
        <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto" onClick={() => intentarAvanzar(8, 7)}>Siguiente <i className="bi bi-arrow-right ms-1"></i></button>
      </div>
    </div>
  );

  // ─── PASO 9: TECNOLOGÍA ──────────────────────────────────────────────────────
  const renderStep9 = () => (
    <div className="animate__animated animate__fadeIn">
      <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
        <i className="bi bi-laptop text-success fs-5"></i>
        <h6 className="fw-bold text-dark mb-0">Equipos Tecnológicos en el Hogar</h6>
      </div>
      <div className="row g-4">
        <div className="col-md-4">
          <label className="form-label fw-semibold">¿Posee Computadora? <span className="text-danger">*</span></label>
          <select className="form-select input-moderno" value={form.posee_computadora} onChange={(e) => updateForm('posee_computadora', e.target.value)}>
            <option value="No">No posee</option>
            <option value="PC de Escritorio">PC de Escritorio</option>
            <option value="Laptop">Laptop / Portátil</option>
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label fw-semibold">¿Posee Conexión a Internet? <span className="text-danger">*</span></label>
          <div className="d-flex gap-3 mt-2">
            {['Si', 'No'].map(op => (
              <button key={op} type="button"
                className={`btn rounded-pill px-4 fw-semibold ${form.posee_internet === op ? 'btn-success shadow' : 'btn-outline-secondary'}`}
                onClick={() => updateForm('posee_internet', op)}>{op === 'Si' ? 'Sí' : 'No'}</button>
            ))}
          </div>
        </div>
        <div className="col-md-4">
          <label className="form-label fw-semibold">Posee Teléfono Celular de: <span className="text-danger">*</span></label>
          <select className="form-select input-moderno" value={form.posee_celular} onChange={(e) => updateForm('posee_celular', e.target.value)}>
            <option value="No">No posee</option>
            <option value="Tercera Generación (Inteligente)">Tercera Generación (Inteligente)</option>
            <option value="Básico">Básico</option>
          </select>
        </div>
      </div>
      <div className="d-flex justify-content-between mt-4 pt-3 border-top">
        <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(7)}><i className="bi bi-arrow-left me-1"></i> Anterior</button>
        <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto" onClick={() => intentarAvanzar(9, 8)}>Siguiente <i className="bi bi-arrow-right ms-1"></i></button>
      </div>
    </div>
  );

  // ─── PASO 10: CONFIRMACIÓN Y RESUMEN COMPLETO ────────────────────────────────
  const renderStep10 = () => {
    const Row = ({ label, value }: { label: string; value?: string | boolean | null }) => (
      <div className="d-flex gap-2 py-1 border-bottom border-light">
        <span className="text-muted small flex-shrink-0" style={{ minWidth: 160 }}>{label}</span>
        <span className="fw-semibold small text-dark">{value !== undefined && value !== null && value !== '' ? String(value) : <span className="text-muted fst-italic">No informado</span>}</span>
      </div>
    );
    const Section = ({ icon, title, color, children }: { icon: string; title: string; color: string; children: React.ReactNode }) => (
      <div className="card border-0 shadow-sm rounded-4 mb-3 overflow-hidden">
        <div className={`card-header bg-${color}-subtle d-flex align-items-center gap-2 py-2 px-3`}>
          <i className={`bi ${icon} text-${color} fs-5`}></i>
          <span className="fw-bold text-dark small">{title}</span>
        </div>
        <div className="card-body px-3 py-2">{children}</div>
      </div>
    );

    const conQuienVive = Array.isArray(form.estudiante_con_quien_vive)
      ? form.estudiante_con_quien_vive.join(', ')
      : form.estudiante_con_quien_vive || '';

    return (
      <div className="animate__animated animate__fadeIn">
        {/* Encabezado */}
        <div className="text-center mb-4">
          <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm"
            style={{ width: 72, height: 72, border: '2px solid rgba(22,163,74,0.25)' }}>
            <i className="bi bi-patch-check-fill text-success" style={{ fontSize: 32 }}></i>
          </div>
          <h5 className="fw-bold text-dark mb-1">Resumen Completo de la Ficha</h5>
          <p className="text-muted small mb-0">Revise toda la información antes de guardar. Puede regresar a cualquier paso para corregir datos.</p>
        </div>

        {/* ── REPRESENTANTE LEGAL ── */}
        <Section icon="bi-person-lines-fill" title="Representante Legal" color="success">
          <Row label="Nombres y Apellidos" value={`${form.representante_nombres} ${form.representante_apellidos}`} />
          <Row label="Cédula de Identidad" value={form.representante_cedula} />
          <Row label="Fecha de Nacimiento" value={form.representante_fecha_nacimiento} />
          <Row label="Teléfono Principal" value={form.representante_telefono} />
          <Row label="Teléfono Alternativo" value={form.representante_telefono2} />
          <Row label="Correo Electrónico" value={form.representante_email} />
          <Row label="¿Trabaja en PDVSA?" value={form.representante_trabaja_pdvsa} />
          {form.representante_trabaja_pdvsa === 'Sí' && <>
            <Row label="Condición Laboral" value={form.pdvsa_condicion_laboral} />
            <Row label="Tipo de Nómina" value={form.pdvsa_tipo_nomina} />
            <Row label="Negocio / Filial" value={form.pdvsa_negocio_filial} />
            <Row label="Gerencia / Dpto." value={form.pdvsa_gerencia} />
            <Row label="Correo Corporativo" value={form.pdvsa_email_empresa} />
            <Row label="Localidad de Trabajo" value={form.pdvsa_localidad_trabajo === 'Otra' ? form.pdvsa_localidad_trabajo_otra : form.pdvsa_localidad_trabajo} />
          </>}
        </Section>

        {/* ── ESTUDIANTE ── */}
        <Section icon="bi-mortarboard-fill" title="Datos del Estudiante" color="primary">
          <Row label="Nombres y Apellidos" value={`${form.estudiante_nombres} ${form.estudiante_apellidos}`} />
          <Row label="Cédula / N° Escolar" value={form.estudiante_cedula} />
          <Row label="Género" value={form.estudiante_sexo} />
          <Row label="Fecha de Nacimiento" value={form.estudiante_fecha_nacimiento} />
          <Row label="Grado / Año" value={form.grado_solicitado} />
          <Row label="Parentesco con Trabajador" value={form.parentesco} />
          <Row label="Vive con" value={conQuienVive} />
          <Row label="Reconocido por el Padre" value={form.estudiante_reconocido_por_padre} />
          {/* Documentos fotográficos */}
          {(form.foto_carnet_url || form.foto_cedula_estudiante_url || form.foto_partida_nacimiento_url) && (
            <div className="d-flex flex-wrap gap-2 mt-2">
              {form.foto_carnet_url && <a href={form.foto_carnet_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary rounded-pill"><i className="bi bi-person-bounding-box me-1"></i>Foto Carnet</a>}
              {form.foto_cedula_estudiante_url && <a href={form.foto_cedula_estudiante_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-warning rounded-pill"><i className="bi bi-card-image me-1"></i>Cédula</a>}
              {form.foto_partida_nacimiento_url && <a href={form.foto_partida_nacimiento_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-info rounded-pill"><i className="bi bi-file-earmark-person me-1"></i>Partida</a>}
            </div>
          )}
        </Section>

        {/* ── DIRECCIÓN ── */}
        <Section icon="bi-geo-alt-fill" title="Dirección de Habitación" color="info">
          <Row label="Estado" value={form.estado_habitacion} />
          <Row label="Municipio" value={form.municipio_habitacion} />
          <Row label="Parroquia / Sector" value={form.parroquia_habitacion} />
          <Row label="Dirección Detallada" value={form.direccion_habitacion} />
        </Section>

        {/* ── SALUD ── */}
        <Section icon="bi-heart-pulse-fill" title="Salud y Bienestar" color="danger">
          <Row label="Condición Neurológica" value={form.estudiante_condicion_neuro} />
          {form.estudiante_condicion_neuro === 'Sí' && <>
            <Row label="Tipo de Condición" value={form.estudiante_tipo_condicion === 'Otra' ? form.estudiante_tipo_condicion_otro : form.estudiante_tipo_condicion} />
            <Row label="Informe Médico" value={form.estudiante_informe_neuro ? 'Sí' : 'No'} />
            <Row label="Certificado CONAPDIS" value={form.estudiante_certificado_conapdis ? 'Sí' : 'No'} />
          </>}
          <Row label="Grupo Sanguíneo" value={form.estudiante_grupo_sanguineo} />
          <Row label="Condición Médica" value={form.estudiante_condicion_medica === 'Otra' ? form.estudiante_condicion_medica_otro : form.estudiante_condicion_medica} />
          <Row label="Alergia a Medicamentos" value={form.estudiante_tiene_alergia_medicamentos === 'Sí' ? (form.estudiante_alergico_medicamentos || form.estudiante_alergico_medicamentos_otro) : 'No'} />
          <Row label="Alergia a Alimentos" value={form.estudiante_tiene_alergia_alimentos === 'Sí' ? (form.estudiante_alergia_alimentos || form.estudiante_alergia_alimentos_otro) : 'No'} />
          <Row label="Otras Alergias" value={form.estudiante_tiene_otras_alergias === 'Sí' ? (form.estudiante_otras_alergias || form.estudiante_otras_alergias_otro) : 'No'} />
        </Section>

        {/* ── RUTA ESCOLAR ── */}
        <Section icon="bi-bus-front" title="Ruta Escolar" color="warning">
          <Row label="Requiere Transporte" value={form.requiere_transporte ? 'Sí' : 'No'} />
          {form.requiere_transporte && <>
            <Row label="Ruta" value={form.ruta_transporte} />
            <Row label="Parada" value={form.parada_transporte} />
          </>}
          <Row label="Plantel de Procedencia" value={form.plantel_procedencia} />
        </Section>

        {/* ── ANTROPOMETRÍA ── */}
        <Section icon="bi-rulers" title="Antropometría" color="secondary">
          <Row label="Estatura" value={form.estatura_metros ? `${form.estatura_metros} m` : ''} />
          <Row label="Peso" value={form.peso_kg ? `${form.peso_kg} kg` : ''} />
          <Row label="Talla Franela" value={form.talla_franela} />
          <Row label="Talla Pantalón" value={form.talla_pantalon} />
          <Row label="Talla Calzado" value={form.talla_calzado} />
        </Section>

        {/* ── HABILIDADES ── */}
        <Section icon="bi-palette" title="Habilidades Artísticas y Deportivas" color="success">
          <Row label="Habilidad Musical" value={form.tiene_habilidad_cultura} />
          {form.tiene_habilidad_cultura === 'Sí' && <>
            <Row label="Instrumento" value={form.habilidad_cultura_instrumento === 'Otra' ? form.habilidad_cultura_instrumento_otro : form.habilidad_cultura_instrumento} />
            <Row label="En Orquesta" value={form.habilidad_cultura_orquesta} />
          </>}
          <Row label="Habilidad en Danza" value={form.tiene_habilidad_danza} />
          {form.tiene_habilidad_danza === 'Sí' && <>
            <Row label="Tipo de Danza" value={form.habilidad_danza_tipo} />
            <Row label="Inscrito en Academia" value={form.habilidad_danza_academia} />
          </>}
          <Row label="Práctica Deportiva" value={form.tiene_habilidad_deporte} />
          {form.tiene_habilidad_deporte === 'Sí' && <>
            <Row label="Disciplina" value={form.habilidad_deporte_disciplina === 'Otra' ? form.habilidad_deporte_disciplina_otro : form.habilidad_deporte_disciplina} />
            <Row label="Club Deportivo" value={form.habilidad_deporte_academia} />
          </>}
        </Section>

        {/* ── TECNOLOGÍA ── */}
        <Section icon="bi-laptop" title="Tecnología en el Hogar" color="info">
          <Row label="Computadora" value={form.posee_computadora} />
          <Row label="Conexión a Internet" value={form.posee_internet} />
          <Row label="Teléfono Celular" value={form.posee_celular} />
        </Section>

        {/* ── MADRE ── */}
        <Section icon="bi-gender-female" title="Información de la Madre" color="danger">
          <Row label="Se encuentra con vida" value={form.madre_vive !== 'No' ? 'Sí' : 'No'} />
          <Row label="Nombres y Apellidos" value={`${form.madre_nombres || ''} ${form.madre_apellidos || ''}`} />
          <Row label="Cédula de Identidad" value={form.madre_cedula} />
          <Row label="Fecha de Nacimiento" value={form.madre_fecha_nacimiento} />
          <Row label="Lugar de Nacimiento" value={form.madre_lugar_nacimiento} />
          {form.madre_vive !== 'No' && <>
            <Row label="Teléfono" value={form.madre_telefono} />
            <Row label="Correo Electrónico" value={form.madre_email} />
            <Row label="¿Trabaja en PDVSA?" value={form.madre_trabaja_pdvsa ? 'Sí' : 'No'} />
          </>}
        </Section>

        {/* ── PADRE ── */}
        {form.estudiante_reconocido_por_padre !== 'No' && (
          <Section icon="bi-gender-male" title="Información del Padre" color="primary">
            <Row label="Se encuentra con vida" value={form.padre_vive !== 'No' ? 'Sí' : 'No'} />
            <Row label="Nombres y Apellidos" value={`${form.padre_nombres || ''} ${form.padre_apellidos || ''}`} />
            <Row label="Cédula de Identidad" value={form.padre_cedula} />
            <Row label="Fecha de Nacimiento" value={form.padre_fecha_nacimiento} />
            {form.padre_vive !== 'No' && <>
              <Row label="Teléfono" value={form.padre_telefono} />
              <Row label="Correo Electrónico" value={form.padre_email} />
              <Row label="¿Trabaja en PDVSA?" value={form.padre_trabaja_pdvsa ? 'Sí' : 'No'} />
            </>}
            {form.foto_cedula_padre_url && (
              <div className="mt-2">
                <a href={form.foto_cedula_padre_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary rounded-pill">
                  <i className="bi bi-card-image me-1"></i>Ver Cédula del Padre
                </a>
              </div>
            )}
          </Section>
        )}

        {/* ── BOTÓN GUARDAR ── */}
        <div className="sticky-bottom pt-3 pb-2" style={{ background: 'linear-gradient(transparent, white 30%)', marginTop: 8 }}>
          <div className="d-flex justify-content-between align-items-center">
            <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(9)}>
              <i className="bi bi-arrow-left me-1"></i> Anterior
            </button>
            <button
              className="btn btn-success rounded-pill px-5 py-3 fw-bold shadow-lg hover-efecto d-flex align-items-center gap-2"
              style={{ fontSize: '1.05rem', background: 'linear-gradient(135deg,#16a34a,#15803d)', border: 'none' }}
              onClick={handleGuardarFicha}
              disabled={loading}
            >
              {loading
                ? <><span className="spinner-border spinner-border-sm"></span> Guardando...</>
                : <><i className="bi bi-save2-fill fs-5"></i> Guardar Ficha Integral</>
              }
            </button>
          </div>
        </div>
      </div>
    );
  };



  return (

    <div className="container-fluid py-4 animate__animated animate__fadeIn">

      {/* Encabezado Principal */}

      <div 

        className="banner-modulo p-4 p-md-5 mb-4 shadow-sm text-white position-relative overflow-hidden" 

        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '24px' }}

      >

        <div className="burbuja-3d burbuja-1" style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.15)', position: 'absolute', top: '-50px', right: '-20px', borderRadius: '50%' }}></div>

        <div className="burbuja-3d burbuja-2" style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.08)', position: 'absolute', bottom: '-20px', left: '20px', borderRadius: '50%' }}></div>

        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between position-relative z-1">

          <div>

            <span className="badge bg-white text-dark fw-bold px-3 py-2 rounded-pill mb-3 shadow-sm text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.75rem' }}>

              <i className="bi bi-person-lines-fill me-2 text-primary"></i>Ficha Integral Estudiantil

            </span>

            <h1 className="fw-bolder mb-2 display-6 text-white">

              <i className="bi bi-file-earmark-person-fill me-3"></i>Actualización de Datos

            </h1>

            <p className="mb-0 text-white-50 fs-6" style={{ maxWidth: '750px' }}>

              Mantenga al día la información médica, biométrica y de contacto de sus representados.

            </p>

          </div>

          {estudianteSeleccionado && (

            <div className="mt-4 mt-md-0">

              <button className="btn btn-outline-light rounded-pill px-4 fw-bold shadow-sm hover-efecto" onClick={() => setEstudianteSeleccionado(null)}>

                <i className="bi bi-arrow-left me-2"></i>Volver a Mis Representados

              </button>

            </div>

          )}

        </div>

      </div>



      {esAdmin && !estudianteSeleccionado && (

        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-light">

          <form onSubmit={handleBuscarAdmin} className="row g-2 align-items-center">

            <div className="col-md-auto">

              <span className="fw-bold text-dark"><i className="bi bi-shield-lock-fill text-primary me-2"></i>Modo Administración:</span>

            </div>

            <div className="col-md-5">

              <input 

                type="text" 

                className="form-control bg-white" 

                placeholder="Buscar representados por Cédula del Representante..."

                value={cedulaBusquedaAdmin}

                onChange={(e) => setCedulaBusquedaAdmin(e.target.value)}

              />

            </div>

            <div className="col-md-auto">

              <button type="submit" className="btn btn-primary fw-bold px-4">

                <i className="bi bi-search me-2"></i>Consultar Cédula

              </button>

              <button 

                type="button" 

                className="btn btn-outline-secondary fw-bold ms-2"

                onClick={() => { setCedulaBusquedaAdmin(''); if (user?.cedula) cargarMisRepresentados(user.cedula); }}

              >

                Mis Hijos

              </button>

            </div>

          </form>

        </div>

      )}



      {/* VISTA 2: FORMULARIO CON STEPPER */}
      {estudianteSeleccionado && (
        <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white animate__animated animate__fadeInUp position-relative">
          
          {/* Indicador de Autoguardado */}
          <div className="position-absolute top-0 end-0 mt-3 me-4 d-none d-md-block">
            {savingStatus === 'saving' && <span className="badge bg-warning bg-opacity-25 text-dark border border-warning"><i className="bi bi-arrow-repeat"></i> Guardando...</span>}
            {savingStatus === 'saved' && <span className="badge bg-success bg-opacity-10 text-success border border-success"><i className="bi bi-cloud-check me-1"></i> Guardado automático</span>}
            {savingStatus === 'error' && <span className="badge bg-danger bg-opacity-10 text-danger border border-danger"><i className="bi bi-cloud-slash me-1"></i> Error al guardar</span>}
          </div>

          {renderStepper()}
          <div>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep5()}
            {step === 5 && renderStep6()}
            {step === 6 && renderStep7()}
            {step === 7 && renderStep8()}
            {step === 8 && renderStep9()}
            {step === 9 && renderStep4()}
            {step === 10 && renderStep10()}
          </div>
        </div>
      )}

      {!estudianteSeleccionado ? (

        <div>

          <h4 className="fw-bolder text-dark mb-4 d-flex align-items-center">

            <i className="bi bi-people-fill text-primary me-3 fs-3"></i>

            Mis Representados

            <span className="badge bg-primary rounded-pill ms-3 fs-6 px-3">{misRepresentados.length}</span>

          </h4>



          {loading ? (

            <div className="text-center py-5 my-5">

              <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}></div>

            </div>

          ) : misRepresentados.length === 0 ? (

            <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white my-4">

              <h3 className="fw-bold text-dark">No se encontraron estudiantes vinculados</h3>

            </div>

          ) : (

            <div className="row g-4">

              {misRepresentados.map((est) => {
                const fechaUltima = est.fecha_ultima_actualizacion ? new Date(est.fecha_ultima_actualizacion) : null;
                let estadoFicha: 'pendiente' | 'actualizado' | 'desactualizado' = 'pendiente';
                let diasTranscurridos = 0;

                if (fechaUltima) {
                  const diffTime = Math.abs(new Date().getTime() - fechaUltima.getTime());
                  diasTranscurridos = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                  if (diasTranscurridos > 90) {
                    estadoFicha = 'desactualizado';
                  } else {
                    estadoFicha = 'actualizado';
                  }
                }

                return (
                  <div className="col-md-6 col-xl-4" key={est.id}>
                    <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden hover-shadow transition-all">
                      <div className="card-header border-0 p-4 pb-0 bg-transparent d-flex justify-content-between align-items-start">
                        <span className={`badge ${est.codigo_escuela === 'sb' ? 'bg-primary' : 'bg-success'} text-white fw-bold px-3 py-2 rounded-pill`}>
                          {est.codigo_escuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar'}
                        </span>

                        {estadoFicha === 'actualizado' && (
                          <span className="badge bg-success bg-opacity-10 text-success border border-success px-3 py-2 rounded-pill">
                            <i className="bi bi-check-circle-fill me-1"></i>Actualizado
                          </span>
                        )}
                        {estadoFicha === 'desactualizado' && (
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger px-3 py-2 rounded-pill" title={`Hace ${diasTranscurridos} días (supera 3 meses)`}>
                            <i className="bi bi-exclamation-octagon-fill text-danger me-1"></i>Desactualizado
                          </span>
                        )}
                        {estadoFicha === 'pendiente' && (
                          <span className="badge bg-warning bg-opacity-10 text-dark border border-warning px-3 py-2 rounded-pill">
                            <i className="bi bi-exclamation-triangle-fill text-warning me-1"></i>Pendiente
                          </span>
                        )}
                      </div>

                      <div className="card-body p-4">
                        <div className="d-flex align-items-center mb-3">
                          <div className="bg-light text-primary rounded-circle p-3 me-3 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '60px', height: '60px' }}>
                            <i className="bi bi-mortarboard-fill fs-3"></i>
                          </div>
                          <div>
                            <h5 className="fw-bolder text-dark mb-1">{est.nombres_estudiante}</h5>
                            <h6 className="fw-bold text-secondary mb-0">{est.apellidos_estudiante}</h6>
                          </div>
                        </div>

                        <div className="bg-light rounded-3 p-3 mb-4">
                          <div className="row g-2 text-center">
                            <div className="col-6 border-end">
                              <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Cédula / C. Escolar</small>
                              <span className="fw-bolder text-dark fs-6">{est.cedula_estudiante}</span>
                            </div>
                            <div className="col-6">
                              <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Grado & Sección</small>
                              <span className="fw-bolder text-primary fs-6">{est.grado_actual} "{est.seccion_actual}"</span>
                            </div>
                          </div>
                        </div>

                        {fechaUltima && (
                          <small className={`d-block text-center mb-3 ${estadoFicha === 'desactualizado' ? 'text-danger fw-bold' : 'text-muted'}`}>
                            <i className="bi bi-clock-history me-1"></i>Última actualización: {fechaUltima.toLocaleDateString()}
                            {estadoFicha === 'desactualizado' && ` (hace ${Math.floor(diasTranscurridos / 30)} meses)`}
                          </small>
                        )}

                        <button 
                          className="btn btn-primary w-100 py-3 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                          onClick={() => abrirFichaEstudiante(est)}
                        >
                          <i className="bi bi-pencil-square me-2 fs-5"></i>
                          Actualizar Ficha Integral
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default ActualizacionDatos;
