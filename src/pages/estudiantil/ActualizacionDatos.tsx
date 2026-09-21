import React, { useState, useEffect } from 'react';

import { supabase } from '../../lib/supabase';

import { usePermisos } from '../../hooks/usePermisos';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import { auditar } from '../../lib/audit';
import { toTitulo } from '../../lib/formatters';
import { obtenerFirmaDirectorProtegida, obtenerDatosDirectorAsync, resolverEscuelaEstudiante } from '../../utils/firmasSeguras';
import { mostrarModalCarnetEstudiantil, esCarnetActivo, toggleCarnetActivo, cargarAjustesCarnetBD } from '../../utils/generadorCarnet';
import { esDocumentoActivo, obtenerConfiguracionDocumentos, cargarConfiguracionDocumentosBD } from '../../utils/gestorDocumentosActivos';
import { ChamiloBreadcrumb, ChamiloHelpCallout, ChamiloStepWizard, IconoActualizacionDatos } from '../../components/chamilo';
import { 
  descargarCartaAceptacionPDF, 
  obtenerPlantillasCartaAceptacion, 
  PLANTILLAS_ACEPTACION_DEFAULT, 
  type DatosAspiranteCartaAceptacion 
} from '../../utils/generadorCartaAceptacion';
import { 
  descargarNormasInternasPDF, 
  obtenerPlantillaNormasInternas,
  type DatosEstudianteNormasInternas 
} from '../../utils/generadorNormasInternas';



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
  estudiante_tipo_documento?: 'Cédula de Identidad' | 'Cédula Escolar';
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
  codigo_escuela?: string;
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
  foto_informe_medico_url?: string;
  foto_carnet_conapdis_url?: string;
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
  estudiante_tipo_documento: 'Cédula de Identidad',
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
  codigo_escuela: '',
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
  foto_informe_medico_url: '',
  foto_carnet_conapdis_url: '',
  foto_cedula_madre_url: '',
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
  const [solicitudesAdmisionMap, setSolicitudesAdmisionMap] = useState<Record<string, any>>({});

  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<any | null>(null);

  

  const [step, setStep] = useState(1);

  const [form, setForm] = useState<SolicitudForm>(defaultForm());
  const [savingStatus, setSavingStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [carnetActivoGlobal, setCarnetActivoGlobal] = useState<boolean>(esCarnetActivo());
  const [, setConfigDocumentos] = useState(obtenerConfiguracionDocumentos());

  const handleToggleCarnetGlobal = async () => {
    const nuevo = await toggleCarnetActivo();
    setCarnetActivoGlobal(nuevo);
    if ((window as any).Swal) {
      const Toast = (window as any).Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2500 });
      Toast.fire({
        icon: nuevo ? 'success' : 'warning',
        title: `Emisión de Carnets ${nuevo ? 'ACTIVADA' : 'DESACTIVADA'} para el sistema`
      });
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

  const esAdmin = ['SuperAdmin', 'Director', 'Administrador', 'Coordinador'].includes(user?.rol || '');

  const [cedulaBusquedaAdmin, setCedulaBusquedaAdmin] = useState<string>('');

  

  const Swal = (window as any).Swal;



  useEffect(() => {
    cargarCatalogos();
    cargarAjustesCarnetBD().then(() => setCarnetActivoGlobal(esCarnetActivo()));
    cargarConfiguracionDocumentosBD().then(cfg => setConfigDocumentos(cfg));

    const handleConfigChanged = () => {
      setConfigDocumentos(obtenerConfiguracionDocumentos());
      setCarnetActivoGlobal(esCarnetActivo());
    };
    window.addEventListener('sigae-documentos-config-changed', handleConfigChanged);

    if (user?.cedula) {
      cargarMisRepresentados(user.cedula);
    }

    return () => {
      window.removeEventListener('sigae-documentos-config-changed', handleConfigChanged);
    };
  }, [user]);

  // Sincronizar dinámicamente el catálogo de transporte para la escuela del estudiante en edición
  useEffect(() => {
    if (estudianteSeleccionado) {
      const escEst = resolverEscuelaEstudiante(estudianteSeleccionado, form);
      cargarTransporteParaEscuela(escEst);
    }
  }, [estudianteSeleccionado?.id, estudianteSeleccionado?.codigo_escuela]);

  // Sincronizar objetos de Ruta y Parada cuando hay datos cargados en el formulario
  useEffect(() => {
    if (rutasTransporteDB.length > 0 && form.ruta_transporte) {
      const nombreRutaLimpio = form.ruta_transporte.split(' - Parada: ')[0].trim();
      const rObj = rutasTransporteDB.find(r => r.nombre === nombreRutaLimpio || form.ruta_transporte.startsWith(r.nombre));
      if (rObj && rObj.id !== selectedRutaObj?.id) {
        setSelectedRutaObj(rObj);
      }
    }
    if (paradasTransporteDB.length > 0) {
      let paradaName = (form.parada_transporte || '').trim();
      if (!paradaName && form.ruta_transporte && form.ruta_transporte.includes(' - Parada: ')) {
        paradaName = form.ruta_transporte.split(' - Parada: ')[1]?.trim() || '';
      }
      if (paradaName) {
        const pObj = paradasTransporteDB.find(p => p.nombre_parada === paradaName);
        if (pObj) {
          if (pObj.id !== selectedParadaObj?.id) {
            setSelectedParadaObj(pObj);
          }
          if (!form.parada_transporte) {
            setForm(prev => ({ ...prev, parada_transporte: pObj.nombre_parada }));
          }
        }
      }
    }
  }, [form.ruta_transporte, form.parada_transporte, rutasTransporteDB, paradasTransporteDB]);


  const obtenerImagenBase64 = (url: string, timeoutMs: number = 2000): Promise<string> => {
    return new Promise((resolve) => {
      if (!url) { resolve(''); return; }
      let resolved = false;
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(url);
        }
      }, timeoutMs);

      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
            return;
          }
        } catch (e) {
          console.warn('Base64 conversion fallback for:', url);
        }
        resolve(url);
      };
      img.onerror = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        resolve(url);
      };
      img.src = url;
    });
  };

  const manejarOpcionesResumen = (datosEst: any, formDatos: SolicitudForm) => {
    const Swal = (window as any).Swal;
    if (!Swal) return;

    // Proteger: si aún no han terminado de actualizar, no permitir descargar el resumen
    const d = (datosEst?.datos_actualizados || formDatos || {}) as any;
    const infoAdm = obtenerInfoAdmision(datosEst);
    const estaCompletada = d.ficha_completada === true || (formDatos as any)?.ficha_completada === true || (datosEst as any)?.ficha_completada === true;
    if (!esAdmin && infoAdm.esNuevoIngreso && !estaCompletada) {
      Swal.fire({
        icon: 'info',
        title: 'Ficha en Proceso',
        html: `
          <p class="mb-2">El aspirante aún no ha finalizado su <b>Ficha Integral</b>.</p>
          <p class="small text-muted mb-0">Debe completar y guardar los 10 pasos de la actualización para generar el <b>Resumen oficial (Carta)</b> y consignarlo en la escuela.</p>
        `,
        confirmButtonColor: '#16a34a',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    Swal.fire({
      title: 'Opciones de Ficha Integral',
      html: `
        <div class="d-flex flex-column gap-3 mt-3">
          <button id="btn-pdf" class="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center fw-bold rounded-3">
            <i class="bi bi-download fs-5 me-2"></i> Descargar Documento (PDF)
          </button>
          <button id="btn-wa" class="btn btn-success w-100 py-2 d-flex align-items-center justify-content-center fw-bold rounded-3">
            <i class="bi bi-whatsapp fs-5 me-2"></i> Enviar por WhatsApp (PDF)
          </button>
          <button id="btn-email" class="btn btn-info text-white w-100 py-2 d-flex align-items-center justify-content-center fw-bold rounded-3">
            <i class="bi bi-envelope fs-5 me-2"></i> Enviar por Correo Electrónico (PDF)
          </button>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      didOpen: () => {
        document.getElementById('btn-pdf')?.addEventListener('click', () => {
          Swal.close();
          generarImpresionResumen(datosEst, formDatos, 'pdf');
        });
        document.getElementById('btn-wa')?.addEventListener('click', () => {
          Swal.close();
          generarImpresionResumen(datosEst, formDatos, 'whatsapp');
        });
        document.getElementById('btn-email')?.addEventListener('click', () => {
          Swal.close();
          generarImpresionResumen(datosEst, formDatos, 'email');
        });
      }
    });
  };

  // ─── CONTROL DE ADMISIÓN Y ACCESO A CONSTANCIAS PARA NUEVOS INGRESOS ────────
  const obtenerInfoAdmision = (est: any) => {
    if (!est) {
      return { esNuevoIngreso: false, solicitud: null, estadoAdmision: null, estaFormalizado: true, puedeDescargarConstancia: true };
    }
    const d = est.datos_actualizados || {};
    const cedLim = (est.cedula_estudiante || d.estudiante_cedula || '').replace(/\D/g, '');
    const nomNorm = `${(est.nombres_estudiante || d.estudiante_nombres || '').trim()} ${(est.apellidos_estudiante || d.estudiante_apellidos || '').trim()}`.toLowerCase();
    
    const sol = (est.id && solicitudesAdmisionMap[est.id]) ||
                (est.id_solicitud && solicitudesAdmisionMap[`sol_${est.id_solicitud}`]) ||
                (est.codigo_unico && solicitudesAdmisionMap[est.codigo_unico]) ||
                (d.codigo_unico && solicitudesAdmisionMap[d.codigo_unico]) ||
                (cedLim && solicitudesAdmisionMap[cedLim]) ||
                (nomNorm && solicitudesAdmisionMap[nomNorm]) ||
                null;

    const esMarcaNuevoIngreso = est.origen_admision === 'nuevo_ingreso' || 
                               d.origen_admision === 'nuevo_ingreso' ||
                               est.origen_admision === 'directo_extemporaneo' ||
                               d.origen_admision === 'directo_extemporaneo' ||
                               est.es_nuevo_ingreso_virtual === true ||
                               String(est.id || '').startsWith('sol_') ||
                               String(est.creado_por || '').includes('Admisiones') ||
                               String(d.creado_por || '').includes('Admisiones');

    const estaFormalizadoEnFisico = est.formalizado_en_fisico === true || 
                                    d.formalizado_en_fisico === true || 
                                    est.estado === 'Formalizado' || 
                                    d.estado === 'Formalizado' ||
                                    (sol && ['formalizado', 'formalizada', 'inscrito', 'inscrita'].includes((sol.estado || '').toLowerCase()));

    if (sol) {
      const estadoSol = sol.estado || 'Aprobado';
      const estaFormalizado = ['formalizado', 'formalizada', 'inscrito', 'inscrita'].includes(estadoSol.toLowerCase()) || estaFormalizadoEnFisico;
      return {
        esNuevoIngreso: true,
        solicitud: sol,
        estadoAdmision: estadoSol,
        estaFormalizado,
        // Nuevos Ingresos solo pueden descargar constancias oficiales una vez formalizada la inscripción física por la escuela
        puedeDescargarConstancia: estaFormalizado
      };
    }

    if (esMarcaNuevoIngreso) {
      return {
        esNuevoIngreso: true,
        solicitud: null,
        estadoAdmision: estaFormalizadoEnFisico ? 'Formalizado' : 'Aprobado',
        estaFormalizado: estaFormalizadoEnFisico,
        puedeDescargarConstancia: estaFormalizadoEnFisico
      };
    }

    // Estudiante regular ya matriculado
    return {
      esNuevoIngreso: false,
      solicitud: null,
      estadoAdmision: null,
      estaFormalizado: true,
      puedeDescargarConstancia: true
    };
  };

  const handleDescargarCartaAceptacion = async (datosEst: any, formDatos: any) => {
    try {
      const escEst = resolverEscuelaEstudiante(datosEst, formDatos);
      const plantillas = await obtenerPlantillasCartaAceptacion();
      const plantilla = plantillas.find(p => p.id_escuela === escEst) || 
                        (escEst === 'sb' ? PLANTILLAS_ACEPTACION_DEFAULT.sb : PLANTILLAS_ACEPTACION_DEFAULT.lb);

      const cedRep = formDatos.representante_cedula || datosEst.cedula_representante || user?.cedula || '';
      const nomRep = formDatos.representante_nombres || datosEst.nombres_representante || user?.nombre_completo || '';
      const apeRep = formDatos.representante_apellidos || datosEst.apellidos_representante || '';
      const nomEst = formDatos.estudiante_nombres || datosEst.nombres_estudiante || '';
      const apeEst = formDatos.estudiante_apellidos || datosEst.apellidos_estudiante || '';
      const cedEst = formDatos.estudiante_cedula || datosEst.cedula_estudiante || '';
      const grado = formDatos.grado_solicitado || datosEst.grado_actual || '1er Grado';
      const codigoUnico = formDatos.codigo_unico || datosEst.codigo_unico || `ADM-${escEst.toUpperCase()}-${cedRep.replace(/\D/g, '')}`;

      const datosAspirante: DatosAspiranteCartaAceptacion = {
        codigo_unico: codigoUnico,
        codigo_escuela: escEst,
        representante_nombres: nomRep,
        representante_apellidos: apeRep,
        representante_cedula: cedRep,
        representante_telefono: formDatos.representante_telefono || datosEst.telefono || '',
        representante_email: formDatos.representante_email || datosEst.email || user?.email || '',
        representante_email_empresa: formDatos.pdvsa_email_empresa || '',
        estudiante_nombres: nomEst,
        estudiante_apellidos: apeEst,
        estudiante_cedula: cedEst,
        grado_solicitado: grado,
        parentesco: formDatos.representante_parentesco || formDatos.parentesco || 'Representante Legal',
        trabajador_nombre: formDatos.pdvsa_nombre_trabajador || '',
        trabajador_cedula: formDatos.pdvsa_cedula_trabajador || '',
        fecha_emision: new Date().toLocaleDateString('es-VE')
      };

      await descargarCartaAceptacionPDF(plantilla, datosAspirante);
    } catch (err: any) {
      console.error('Error al descargar Carta de Aceptación:', err);
      if ((window as any).Swal) {
        (window as any).Swal.fire('Error', 'No se pudo generar la Carta de Aceptación: ' + (err.message || ''), 'error');
      }
    }
  };

  const handleDescargarNormasInternas = async (datosEst: any, formDatos: any, modo: 'pdf' | 'whatsapp' | 'email' = 'pdf') => {
    try {
      const escEst = resolverEscuelaEstudiante(datosEst, formDatos);
      const plantilla = obtenerPlantillaNormasInternas(escEst);

      const cedRep = formDatos.representante_cedula || datosEst.cedula_representante || user?.cedula || '';
      const nomRep = formDatos.representante_nombres || datosEst.nombres_representante || user?.nombre_completo || '';
      const apeRep = formDatos.representante_apellidos || datosEst.apellidos_representante || '';
      const nomEst = formDatos.estudiante_nombres || datosEst.nombres_estudiante || '';
      const apeEst = formDatos.estudiante_apellidos || datosEst.apellidos_estudiante || '';
      const cedEst = formDatos.estudiante_cedula || datosEst.cedula_estudiante || '';
      const grado = formDatos.grado_solicitado || datosEst.grado_actual || '1er Grado';
      const ano = new Date().getFullYear();
      const cedRef = (cedEst || cedRep).toString().replace(/\D/g, '').slice(-8) || Math.floor(1000 + Math.random() * 9000).toString();
      const codigoUnico = formDatos.codigo_unico || datosEst.codigo_unico || `NI-${escEst.toUpperCase()}-${cedRef}-${ano}`;

      const datosNormas: DatosEstudianteNormasInternas = {
        codigo_unico: codigoUnico,
        codigo_escuela: escEst,
        estudiante_nombres: nomEst,
        estudiante_apellidos: apeEst,
        estudiante_cedula: cedEst,
        grado_solicitado: grado,
        representante_nombres: nomRep,
        representante_apellidos: apeRep,
        representante_cedula: cedRep,
        representante_telefono: formDatos.representante_telefono || datosEst.telefono || '',
        parentesco: formDatos.representante_parentesco || formDatos.parentesco || 'Representante Legal',
        fecha_emision: new Date().toLocaleDateString('es-VE')
      };

      if (modo === 'pdf') {
        await descargarNormasInternasPDF(plantilla, datosNormas);
      } else if (modo === 'email') {
        await descargarNormasInternasPDF(plantilla, datosNormas);
        const emailDestino = formDatos.representante_email || datosEst.email || user?.email || '';
        const asunto = encodeURIComponent(`Normativa Interna - ${nomEst} ${apeEst}`);
        const cuerpo = encodeURIComponent(`Estimad@ Representante,\n\nAdjunto remitimos la Normativa Interna Institucional de ${nomEst} ${apeEst} para el Año Escolar ${plantilla.periodo_escolar}.\n\nEl archivo PDF ha sido descargado en su equipo.\n\nCódigo de Verificación: ${codigoUnico}\n\nAtentamente,\n${escEst === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar'}\nSistema SIGAE.`);
        window.location.href = `mailto:${emailDestino}?subject=${asunto}&body=${cuerpo}`;
      } else {
        await descargarNormasInternasPDF(plantilla, datosNormas);
        if ((window as any).Swal) {
          (window as any).Swal.fire({
            title: '¡Normativa Interna Descargada!',
            html: `<p>El documento ha sido generado y descargado en tu dispositivo.</p><p class="small text-muted">Puedes adjuntarlo y compartirlo a través de WhatsApp.</p>`,
            icon: 'success',
            confirmButtonColor: '#16a34a'
          });
        }
      }
    } catch (err: any) {
      console.error('Error al descargar Normativa Interna:', err);
      if ((window as any).Swal) {
        (window as any).Swal.fire('Error', 'No se pudo generar la Normativa Interna: ' + (err.message || ''), 'error');
      }
    }
  };

  const manejarOpcionesNormasInternas = (datosEst: any, formDatos: any) => {
    const Swal = (window as any).Swal;
    if (!Swal) return;

    Swal.fire({
      title: 'Normativa Interna Institucional',
      html: `
        <p class="text-muted small mb-3">Descargue o comparta el formato oficial de 2 páginas de la Normativa Interna (horarios, uniformes, transporte y deberes de corresponsabilidad).</p>
        <div class="d-flex flex-column gap-3">
          <button id="btn-normas-pdf" class="btn btn-warning text-dark w-100 py-2 d-flex align-items-center justify-content-center fw-bold rounded-3 shadow-sm">
            <i class="bi bi-file-earmark-ruled-fill fs-5 me-2 text-dark"></i> Descargar Normativa Interna (PDF)
          </button>
          <button id="btn-normas-wa" class="btn btn-outline-success w-100 py-2 d-flex align-items-center justify-content-center fw-bold rounded-3">
            <i class="bi bi-whatsapp fs-5 me-2"></i> Enviar por WhatsApp
          </button>
          <button id="btn-normas-email" class="btn btn-outline-info text-dark w-100 py-2 d-flex align-items-center justify-content-center fw-bold rounded-3">
            <i class="bi bi-envelope-fill fs-5 me-2"></i> Enviar por Correo Electrónico
          </button>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Cerrar',
      didOpen: () => {
        document.getElementById('btn-normas-pdf')?.addEventListener('click', () => {
          Swal.close();
          handleDescargarNormasInternas(datosEst, formDatos, 'pdf');
        });
        document.getElementById('btn-normas-wa')?.addEventListener('click', () => {
          Swal.close();
          handleDescargarNormasInternas(datosEst, formDatos, 'whatsapp');
        });
        document.getElementById('btn-normas-email')?.addEventListener('click', () => {
          Swal.close();
          handleDescargarNormasInternas(datosEst, formDatos, 'email');
        });
      }
    });
  };

  const mostrarAvisoBloqueoNuevoIngreso = (datosEst: any, formDatos: any, tipoDoc: string = 'inscripcion') => {
    const Swal = (window as any).Swal;
    if (!Swal) return;

    const escEst = resolverEscuelaEstudiante(datosEst, formDatos);
    const escNombre = escEst === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar';
    const nombreEst = `${formDatos.estudiante_nombres || datosEst.nombres_estudiante || ''} ${formDatos.estudiante_apellidos || datosEst.apellidos_estudiante || ''}`.trim();
    const esEstudio = tipoDoc === 'estudio';

    Swal.fire({
      title: `<span style="font-size: 20px; font-weight: 800; color: #1e293b;"><i class="bi bi-shield-lock-fill text-warning me-2"></i>Formalización Escolar Requerida</span>`,
      html: `
        <div class="text-start p-2" style="font-size: 13.5px; color: #334155; line-height: 1.55;">
          <div class="alert alert-warning border-0 rounded-3 mb-3 d-flex align-items-start py-2.5 px-3">
            <i class="bi bi-exclamation-triangle-fill text-warning fs-4 me-2.5 flex-shrink-0 mt-0.5"></i>
            <div>
              <div class="fw-bold text-dark">Aspirante Nuevo Ingreso: ${nombreEst}</div>
              <div class="small text-muted">Plantel asignado: <b>${escNombre}</b></div>
            </div>
          </div>

          <p class="mb-2">
            ${esEstudio 
              ? `La <b>Constancia de Estudio</b> certifica la escolaridad activa y asistencia regular a clases en el plantel. <b>No está disponible para aspirantes de Nuevo Ingreso</b> hasta que la escuela formalice presencialmente su matrícula e inicie el año escolar.` 
              : `La <b>Constancia de Inscripción</b> se emitirá formalmente una vez que el Departamento de Control de Estudios valide la <b>Fase 3: Formalización y Consignación de Expediente Físico</b> en el plantel.`}
          </p>

          <div class="bg-light p-3 rounded-3 mb-3 border">
            <div class="fw-bold text-dark mb-2"><i class="bi bi-journal-check me-1 text-primary"></i> Pasos para formalizar la matrícula:</div>
            <ol class="mb-0 ps-3 small text-secondary">
              <li class="mb-1">Complete y guarde su <b>Ficha Integral</b> (10 pasos).</li>
              <li class="mb-1">Descargue e imprima su <b>Resumen de Ficha Integral (Carta)</b> (comprobante de la Fase 2).</li>
              <li class="mb-1">Descargue e imprima su <b>Carta de Aceptación Oficial</b> con firmas y código QR.</li>
              <li>Consigne en el plantel la carpeta marrón con los recaudos solicitados en las fechas fijadas.</li>
            </ol>
          </div>

          <div class="p-2.5 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 text-success small d-flex align-items-center">
            <i class="bi bi-unlock-fill me-2 fs-5 flex-shrink-0"></i>
            <span>Una vez que Control de Estudios formalice su inscripción en físico en la escuela, sus constancias oficiales se <b>habilitarán automáticamente</b> en el sistema.</span>
          </div>
        </div>
      `,
      showCancelButton: true,
      showConfirmButton: true,
      confirmButtonText: '<i class="bi bi-file-earmark-pdf-fill me-1"></i> Descargar Carta de Aceptación',
      cancelButtonText: 'Entendido',
      confirmButtonColor: '#1d4ed8',
      cancelButtonColor: '#64748b'
    }).then((result: any) => {
      if (result.isConfirmed) {
        handleDescargarCartaAceptacion(datosEst, formDatos);
      }
    });
  };

  const manejarOpcionesConstancia = (datosEst: any, formDatos: SolicitudForm, tipoDoc: 'inscripcion' | 'estudio' | 'conducta' = 'inscripcion') => {
    const Swal = (window as any).Swal;
    if (!Swal) return;

    // Bloqueo condicional para Nuevo Ingreso pendiente de formalización escolar
    if (!esAdmin && (tipoDoc === 'inscripcion' || tipoDoc === 'estudio')) {
      const infoAdm = obtenerInfoAdmision(datosEst);
      if (infoAdm.esNuevoIngreso && !infoAdm.puedeDescargarConstancia) {
        mostrarAvisoBloqueoNuevoIngreso(datosEst, formDatos, tipoDoc);
        return;
      }
    }

    const nombreTipo = tipoDoc === 'estudio' 
      ? 'Constancia de Estudio Regular' 
      : (tipoDoc === 'conducta' ? 'Constancia de Buena Conducta' : 'Constancia de Inscripción Oficial');

    const btnColorClass = tipoDoc === 'estudio' ? 'btn-primary' : (tipoDoc === 'conducta' ? 'btn-info text-dark' : 'btn-success');
    const iconoDoc = tipoDoc === 'estudio' ? 'bi-mortarboard-fill' : (tipoDoc === 'conducta' ? 'bi-award-fill' : 'bi-file-earmark-check-fill');

    Swal.fire({
      title: nombreTipo,
      html: `
        <p class="text-muted small mb-3">Se generará el documento oficial firmado digitalmente y verificable con código QR.</p>
        <div class="d-flex flex-column gap-3">
          <button id="btn-const-pdf" class="btn ${btnColorClass} w-100 py-2 d-flex align-items-center justify-content-center fw-bold rounded-3 shadow-sm">
            <i class="bi ${iconoDoc} fs-5 me-2"></i> Descargar ${nombreTipo} (PDF)
          </button>
          <button id="btn-const-wa" class="btn btn-outline-success w-100 py-2 d-flex align-items-center justify-content-center fw-bold rounded-3">
            <i class="bi bi-whatsapp fs-5 me-2"></i> Enviar por WhatsApp
          </button>
          <button id="btn-const-email" class="btn btn-outline-info text-dark w-100 py-2 d-flex align-items-center justify-content-center fw-bold rounded-3">
            <i class="bi bi-envelope-fill fs-5 me-2"></i> Enviar por Correo Electrónico
          </button>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      didOpen: () => {
        document.getElementById('btn-const-pdf')?.addEventListener('click', () => {
          Swal.close();
          generarConstanciaDocumento(datosEst, formDatos, 'pdf', tipoDoc);
        });
        document.getElementById('btn-const-wa')?.addEventListener('click', () => {
          Swal.close();
          generarConstanciaDocumento(datosEst, formDatos, 'whatsapp', tipoDoc);
        });
        document.getElementById('btn-const-email')?.addEventListener('click', () => {
          Swal.close();
          generarConstanciaDocumento(datosEst, formDatos, 'email', tipoDoc);
        });
      }
    });
  };

  const generarConstanciaDocumento = async (
    datosEst: any, 
    formDatos: SolicitudForm, 
    modo: 'pdf' | 'whatsapp' | 'email',
    tipoDoc: 'inscripcion' | 'estudio' | 'conducta' = 'inscripcion'
  ) => {
    // Bloqueo condicional para Nuevo Ingreso pendiente de formalización escolar
    if (!esAdmin && (tipoDoc === 'inscripcion' || tipoDoc === 'estudio')) {
      const infoAdm = obtenerInfoAdmision(datosEst);
      if (infoAdm.esNuevoIngreso && !infoAdm.puedeDescargarConstancia) {
        mostrarAvisoBloqueoNuevoIngreso(datosEst, formDatos, tipoDoc);
        return;
      }
    }

    const escCodigo = resolverEscuelaEstudiante(datosEst, formDatos);
    const escNombre = escCodigo === 'sb' ? 'Unidad Educativa Santa Bárbara' : 'Unidad Educativa Libertador Bolívar';
    const anoActual = new Date().getFullYear();
    const anoProximo = anoActual + 1;
    const nombreCompleto = `${formDatos.estudiante_nombres || datosEst.nombres_estudiante} ${formDatos.estudiante_apellidos || datosEst.apellidos_estudiante}`;
    const cedulaEstudiante = formDatos.estudiante_cedula || datosEst.cedula_estudiante || 'No posee';
    const gradoActual = formDatos.grado_solicitado || datosEst.grado_actual || 'Grado asignado';
    const representanteNombre = `${formDatos.representante_nombres || datosEst.nombres_representante || ''} ${formDatos.representante_apellidos || datosEst.apellidos_representante || ''}`.trim() || 'Representante Legal';
    const representanteCedula = formDatos.representante_cedula || datosEst.cedula_representante || 'No registrado';

    // Determinar género del estudiante (el/la estudiante, INSCRITO/INSCRITA)
    const rawGen = (
      formDatos.estudiante_sexo ||
      (datosEst as any)?.estudiante_sexo ||
      (datosEst as any)?.estudiante_genero ||
      (datosEst as any)?.sexo ||
      (datosEst as any)?.genero ||
      (datosEst as any)?.datos_actualizados?.estudiante_sexo ||
      (datosEst as any)?.datos_actualizados?.estudiante_genero ||
      ''
    ).toString().toLowerCase().trim();

    const esFemenino = rawGen.startsWith('f') || rawGen === 'femenino' || rawGen === 'femenina' || rawGen === 'hembra' || rawGen === 'mujer';

    // Limpiar grado para no repetir el nivel educativo
    const gradoLimpio = (gradoActual)
      .replace(/\s+de\s+(Educación\s+Primaria|Educación\s+Inicial|Educación\s+Media\s+General|Media\s+General|Primaria|Inicial)/gi, '')
      .replace(/\s+correspondiente\s+al\s+Nivel\s+de.*/gi, '')
      .trim();

    const Swal = (window as any).Swal;
    if (Swal) {
      Swal.fire({
        title: 'Generando Constancia de Inscripción...',
        html: '<div class="spinner-border text-success" role="status"></div><p class="mt-2 small text-muted">Aplicando firma digital cifrada y código QR de verificación pública...</p>',
        allowOutsideClick: false,
        showConfirmButton: false,
      });
    }

    const cedulaLimpia = (cedulaEstudiante).toString().replace(/\D/g, '');
    const prefijoConst = tipoDoc === 'estudio' ? 'CE' : (tipoDoc === 'conducta' ? 'CC' : 'CI');
    const codigoUnicoFallback = `${prefijoConst}-${escCodigo.toUpperCase()}-${cedulaLimpia || Math.floor(1000 + Math.random() * 9000)}-${anoActual}`;
    const codigoUnico = (formDatos.codigo_unico && formDatos.codigo_unico.startsWith(`${prefijoConst}-`))
      ? formDatos.codigo_unico
      : (datosEst.codigo_unico && datosEst.codigo_unico.startsWith(`${prefijoConst}-`) ? datosEst.codigo_unico : codigoUnicoFallback);
    
    const esLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = esLocal ? 'https://app-delta-ten-80.vercel.app' : window.location.origin;
    const urlVerificacionPublica = `${baseUrl}/validar-constancia/${encodeURIComponent(codigoUnico)}`;
    const qrApiUrlPublica = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(urlVerificacionPublica)}&bgcolor=ffffff&color=166534&margin=2`;

    let base64LogoEscuela = `/assets/img/logo_${escCodigo}.png`;
    let base64Mppe = '/assets/img/logoMPPE.png';
    let base64Qr = '';
    let base64FirmaProtegida = '';

    try {
      [base64LogoEscuela, base64Mppe, base64Qr, base64FirmaProtegida] = await Promise.all([
        obtenerImagenBase64(`/assets/img/logo_${escCodigo}.png`),
        obtenerImagenBase64('/assets/img/logoMPPE.png'),
        obtenerImagenBase64(qrApiUrlPublica),
        obtenerFirmaDirectorProtegida(escCodigo, codigoUnico)
      ]);
    } catch (e) {
      console.warn('Error precargando imágenes para constancia oficial', e);
    }

    const dirData = await obtenerDatosDirectorAsync(escCodigo);
    let nivelEducativo = 'Educación Primaria';
    const gLower = (gradoActual).toLowerCase();
    if (gLower.includes('maternal') || gLower.includes('preescolar') || gLower.includes('inicial') || gLower.includes('grupo')) {
      nivelEducativo = 'Educación Inicial';
    } else if (gLower.includes('año') || gLower.includes('media') || gLower.includes('bachillerato')) {
      nivelEducativo = 'Educación Media General';
    }

    const esDirectora = escCodigo === 'sb' || (dirData?.cargoGenerico || '').toLowerCase().includes('directora') || (dirData?.cargo || '').toLowerCase().includes('directora');
    const prefijoDirector = esDirectora ? 'Profa.' : 'Prof.';
    const nombreDirectorBase = (dirData.nombreCompleto || (escCodigo === 'sb' ? 'Elika Dayana Chaviel Rondón' : 'José Vicente Millán Montaño'))
      .replace(/^(Prof\.|Profa\.|Profesora|Profesor|Lic\.|Lcda\.|Lcdo\.)\s*/i, '')
      .trim();
    const tituloDirectorTexto = `${prefijoDirector} ${toTitulo(nombreDirectorBase)}`;
    const cargoDirectorTexto = dirData.cargoGenerico || (esDirectora ? 'Directora' : 'Director');

    const calcularEdad = (fechaNacStr?: string) => {
      if (!fechaNacStr) return '';
      const nac = new Date(fechaNacStr);
      if (isNaN(nac.getTime())) return '';
      const hoy = new Date();
      let edad = hoy.getFullYear() - nac.getFullYear();
      const m = hoy.getMonth() - nac.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
        edad--;
      }
      return edad > 0 && edad < 100 ? `${edad}` : '';
    };

    const dNac = (formDatos || {}) as any;
    const dEst = (datosEst || {}) as any;
    const dEstActual = (datosEst?.datos_actualizados || {}) as any;

    const ciudadNac = (
      formDatos.estudiante_municipio_nacimiento ||
      formDatos.estudiante_lugar_nacimiento ||
      dNac.estudiante_municipio_nacimiento ||
      dNac.estudiante_lugar_nacimiento ||
      dNac.municipio_nacimiento ||
      dNac.lugar_nacimiento ||
      dEstActual.estudiante_municipio_nacimiento ||
      dEstActual.estudiante_lugar_nacimiento ||
      dEstActual.municipio_nacimiento ||
      dEstActual.lugar_nacimiento ||
      dEst.estudiante_municipio_nacimiento ||
      dEst.estudiante_lugar_nacimiento ||
      dEst.municipio_nacimiento ||
      dEst.lugar_nacimiento ||
      dEst.ciudad_nacimiento ||
      (escCodigo === 'sb' ? 'El Tejero' : 'Miraflores')
    ).toString().trim();

    const estadoNac = (
      formDatos.estudiante_estado_nacimiento ||
      dNac.estudiante_estado_nacimiento ||
      dNac.estado_nacimiento ||
      dEstActual.estudiante_estado_nacimiento ||
      dEstActual.estado_nacimiento ||
      dEst.estudiante_estado_nacimiento ||
      dEst.estado_nacimiento ||
      'Monagas'
    ).toString().trim();

    const edadCalculada = calcularEdad(formDatos.estudiante_fecha_nacimiento || datosEst.estudiante_fecha_nacimiento);
    const edadTexto = edadCalculada ? `de ${edadCalculada} años de edad, ` : '';
    const ciudadExpedicion = escCodigo === 'sb' ? 'El Tejero' : 'Miraflores';

    const fechaHoyObj = new Date();
    const diaExpedicion = fechaHoyObj.getDate();
    const mesesNombres = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const mesExpedicion = mesesNombres[fechaHoyObj.getMonth()];
    const anoExpedicion = fechaHoyObj.getFullYear();

    const determinarTipoCedula = (tipoDoc?: string, numCedula?: string) => {
      if (tipoDoc) {
        const tLower = tipoDoc.toLowerCase();
        if (tLower.includes('escolar')) return 'cédula escolar';
        if (tLower.includes('identidad')) return 'cédula de identidad';
      }
      const clean = (numCedula || '').toString().trim().toUpperCase();
      if (clean.startsWith('CE') || clean.startsWith('CE-') || clean.replace(/\D/g, '').length >= 10) {
        return 'cédula escolar';
      }
      return 'cédula de identidad';
    };

    const tipoCedulaTexto = determinarTipoCedula(formDatos.estudiante_tipo_documento || (datosEst as any)?.estudiante_tipo_documento, cedulaEstudiante);

    const tituloConstancia = tipoDoc === 'estudio'
      ? 'Constancia de Estudio'
      : (tipoDoc === 'conducta' ? 'Constancia de Buena Conducta' : 'Constancia de Inscripción');

    let parrafo1 = '';
    let parrafo2 = '';
    let parrafo3 = '';

    if (tipoDoc === 'estudio') {
      parrafo1 = `Quien suscribe, <b>${tituloDirectorTexto}</b>, ${cargoDirectorTexto.toLowerCase()} de la <b>${toTitulo(dirData.nombreEscuela)}</b>, que funciona en <b>${toTitulo(dirData.ubicacionEscuela || 'Monagas, Venezuela')}</b>, por medio de la presente hace constar que ${esFemenino ? 'la estudiante:' : 'el estudiante:'} <b>${toTitulo(nombreCompleto)}</b>, natural de <b>${toTitulo(ciudadNac)}</b>, estado <b>${toTitulo(estadoNac)}</b>, ${edadTexto}titular de la ${tipoCedulaTexto} N.° <b>${cedulaEstudiante}</b>, es estudiante regular y se encuentra cursando activamente el <b>${toTitulo(gradoLimpio)}</b> de <b>${nivelEducativo}</b> en este instituto durante el año escolar <b>${anoActual}-${anoProximo}</b>, demostrando buen rendimiento pedagógico y constante asistencia a las actividades académicas.`;
      parrafo2 = `Asimismo, se deja constancia que el representante legal ${esFemenino ? 'de la estudiante' : 'del estudiante'} es <b>${toTitulo(representanteNombre)}</b>, titular de la cédula de identidad N.° <b>${representanteCedula}</b>.`;
      parrafo3 = `Constancia que se expide a solicitud de la parte interesada para los efectos y fines consiguientes en <b>${toTitulo(ciudadExpedicion)}</b>, a los ${diaExpedicion} días del mes de ${mesExpedicion} del año ${anoExpedicion}.`;
    } else if (tipoDoc === 'conducta') {
      parrafo1 = `Quien suscribe, <b>${tituloDirectorTexto}</b>, ${cargoDirectorTexto.toLowerCase()} de la <b>${toTitulo(dirData.nombreEscuela)}</b>, que funciona en <b>${toTitulo(dirData.ubicacionEscuela || 'Monagas, Venezuela')}</b>, por medio de la presente hace constar que ${esFemenino ? 'la estudiante:' : 'el estudiante:'} <b>${toTitulo(nombreCompleto)}</b>, natural de <b>${toTitulo(ciudadNac)}</b>, estado <b>${toTitulo(estadoNac)}</b>, ${edadTexto}titular de la ${tipoCedulaTexto} N.° <b>${cedulaEstudiante}</b>, cursante del <b>${toTitulo(gradoLimpio)}</b> de <b>${nivelEducativo}</b> durante el año escolar <b>${anoActual}-${anoProximo}</b>, ha observado durante su permanencia en nuestra institución una <b>EXCELENTE CONDUCTA</b>, demostrando respeto por los valores y normas de convivencia escolar.`;
      parrafo2 = `Asimismo, se deja constancia de su intachable colaboración en las actividades pedagógicas y formativas de la institución.`;
      parrafo3 = `Constancia que se expide para los efectos y fines consiguientes en <b>${toTitulo(ciudadExpedicion)}</b>, a los ${diaExpedicion} días del mes de ${mesExpedicion} del año ${anoExpedicion}.`;
    } else {
      parrafo1 = `Quien suscribe, <b>${tituloDirectorTexto}</b>, ${cargoDirectorTexto.toLowerCase()} de la <b>${toTitulo(dirData.nombreEscuela)}</b>, que funciona en <b>${toTitulo(dirData.ubicacionEscuela || 'Monagas, Venezuela')}</b>, por medio de la presente hace constar que ${esFemenino ? 'la estudiante:' : 'el estudiante:'} <b>${toTitulo(nombreCompleto)}</b>, natural de <b>${toTitulo(ciudadNac)}</b>, estado <b>${toTitulo(estadoNac)}</b>, ${edadTexto}titular de la ${tipoCedulaTexto} N.° <b>${cedulaEstudiante}</b>, fue ${esFemenino ? 'inscrita' : 'inscrito'} para cursar el <b>${toTitulo(gradoLimpio)}</b> de <b>${nivelEducativo}</b> en este instituto durante el año escolar <b>${anoActual}-${anoProximo}</b>.`;
      parrafo2 = `Asimismo, se deja constancia que el representante legal ${esFemenino ? 'de la estudiante' : 'del estudiante'} es <b>${toTitulo(representanteNombre)}</b>, titular de la cédula de identidad N.° <b>${representanteCedula}</b>, quien ha cumplido con los requisitos establecidos para la formalización de la inscripción.`;
      parrafo3 = `Constancia que se expide para los efectos y fines consiguientes en <b>${toTitulo(ciudadExpedicion)}</b>, a los ${diaExpedicion} días del mes de ${mesExpedicion} del año ${anoExpedicion}.`;
    }

    const htmlConstancia = `
      <div style="border: 2px solid #94a3b8; border-radius: 12px; padding: 42px 48px 35px 48px; background: #ffffff; width: 800px; font-family: Arial, Helvetica, sans-serif; color: #000000; box-sizing: border-box; min-height: 1035px; display: flex; flex-direction: column; justify-content: space-between; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: geometricPrecision;">
        <div>
          <!-- CINTA TRICOLOR BANDERA DE VENEZUELA OFICIAL -->
          <div style="margin-bottom: 16px; border-radius: 4px; overflow: hidden; display: flex; flex-direction: column;">
            <div style="height: 6px; background-color: #facc15;"></div>
            <div style="height: 8px; background-color: #2563eb; display: flex; justify-content: center; align-items: center; gap: 4px; color: #ffffff; font-size: 7px; line-height: 1;">
              <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
            </div>
            <div style="height: 6px; background-color: #dc2626;"></div>
          </div>

          <!-- ENCABEZADO INSTITUCIONAL MODELO -->
          <div style="display: flex; align-items: center; justify-content: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 16px; margin-bottom: 20px; position: relative;">
            <img src="${base64LogoEscuela}" style="height: 70px; width: auto; position: absolute; left: 0;" />
            <div style="text-align: center; width: 100%;">
              <div style="font-size: 14px; font-weight: bold; line-height: 1.45; text-transform: uppercase; color: #000000;">
                República Bolivariana de Venezuela<br/>
                Ministerio del Poder Popular para la Educación<br/>
                ${dirData.nombreEscuela}<br/>
                <span style="font-weight: normal; font-size: 12px; text-transform: none; color: #334155;">${dirData.ubicacionEscuela}</span>
              </div>
            </div>
          </div>

          <!-- TÍTULO DE LA CONSTANCIA -->
          <div style="text-align: center; margin: 32px 0 28px;">
            <h2 style="margin: 0; font-size: 21px; font-weight: bold; color: #000000; letter-spacing: 0.5px;">${tituloConstancia}</h2>
          </div>

          <!-- PÁRRAFO 1: CERTIFICACIÓN DEL ESTUDIANTE -->
          <p style="font-size: 14.5px; line-height: 2.15; color: #000000; text-align: justify; margin-bottom: 26px; text-indent: 35px;">
            ${parrafo1}
          </p>

          <!-- PÁRRAFO 2: REPRESENTANTE LEGAL -->
          <p style="font-size: 14.5px; line-height: 2.15; color: #000000; text-align: justify; margin-bottom: 26px; text-indent: 35px;">
            ${parrafo2}
          </p>

          <!-- PÁRRAFO 3: EXPEDICIÓN Y FECHA -->
          <p style="font-size: 14.5px; line-height: 2.15; color: #000000; text-align: justify; margin-bottom: 35px; text-indent: 35px;">
            ${parrafo3}
          </p>
        </div>

        <!-- ATENTAMENTE Y FIRMA DEL DIRECTOR CON QR DE SEGURIDAD -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; padding-top: 15px; border-top: 1.5px solid #cbd5e1;">
            <div style="text-align: center; flex: 1; max-width: 440px; margin: 0 auto;">
              <p style="margin: 0 0 4px; font-size: 13.5px; font-weight: bold; color: #000000;">Atentamente</p>
              <img src="${base64FirmaProtegida || `/assets/img/firma_director_${escCodigo}.png`}" style="height: 105px; width: auto; display: block; margin: 0 auto 5px;" />
              <div style="font-size: 13.5px; font-weight: bold; color: #000000;">${tituloDirectorTexto}</div>
              <div style="font-size: 12px; color: #333333;">C.I.: ${dirData.cedula}</div>
              <div style="font-size: 12.5px; font-weight: bold; color: #000000;">${dirData.cargo}</div>
            </div>

            ${base64Qr ? `
            <div style="text-align: center; border: 1.5px solid #cbd5e1; padding: 6px; border-radius: 10px; background: #ffffff; min-width: 85px;">
              <img src="${base64Qr}" style="height: 70px; width: 70px; display: block; margin: 0 auto;" />
              <span style="font-size: 7.5px; font-weight: bold; color: #166534; font-family: monospace; display: block; margin-top: 4px;">VERIFICACIÓN QR</span>
              <span style="font-size: 6.5px; color: #64748b; font-family: monospace; display: block;">${codigoUnico}</span>
            </div>
            ` : ''}
          </div>

          <!-- PIE DE PÁGINA CON LOGO DEL MINISTERIO ALINEADO A LA IZQUIERDA -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #cbd5e1; padding-top: 10px; margin-top: 15px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${base64Mppe}" style="height: 40px; width: auto;" />
            </div>
            <div style="text-align: right; font-size: 8.5px; color: #64748b;">
              SIGAE - Control Estudiantil | ${tituloConstancia} Oficial Verificable mediante Código QR<br/>
              Cód. Autenticidad: <b style="color: #166534; font-family: monospace;">${codigoUnico}</b>
            </div>
          </div>
        </div>

      </div>
    `;

    try {
      const clon = document.createElement('div');
      clon.style.width = '800px';
      clon.style.minWidth = '800px';
      clon.style.maxWidth = '800px';
      clon.style.position = 'fixed';
      clon.style.left = '-9999px';
      clon.style.top = '0';
      clon.style.zIndex = '-99999';
      clon.style.pointerEvents = 'none';
      clon.style.boxSizing = 'border-box';
      clon.style.background = '#ffffff';
      clon.innerHTML = htmlConstancia;

      document.body.appendChild(clon);
      await new Promise(res => setTimeout(res, 200));

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter', compress: true });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const canvas = await html2canvas(clon, {
        scale: 2.2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 4000,
        windowWidth: 1024,
        width: 800
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      const canvasAspect = canvas.width / canvas.height;
      const marginX = 8;
      const marginY = 8;
      const printableWidth = pdfWidth - (marginX * 2);
      const printableHeight = pdfHeight - (marginY * 2);

      let finalWidth = printableWidth;
      let finalHeight = finalWidth / canvasAspect;

      if (finalHeight > printableHeight) {
        finalHeight = printableHeight;
        finalWidth = finalHeight * canvasAspect;
      }

      const posX = (pdfWidth - finalWidth) / 2;
      const posY = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'JPEG', posX, posY, finalWidth, finalHeight, undefined, 'FAST');

      document.body.removeChild(clon);

      const pdfBlob = pdf.output('blob');
      const nombreArchivo = `Constancia_Inscripcion_${nombreCompleto.replace(/\s+/g, '_')}.pdf`;
      const file = new File([pdfBlob], nombreArchivo, { type: "application/pdf" });

      const textoMensaje = `*SIGAE - Constancia de Inscripción Oficial*\n\n` +
        `Estimad@, adjunto la Constancia de Inscripción oficial del estudiante *${nombreCompleto}* en formato PDF con firma digital y código QR de verificación.\n` +
        `Plantel: ${escNombre}\n` +
        `Código de Verificación: ${codigoUnico}\n\n` +
        `Sistema SIGAE.`;

      if (modo === 'pdf') {
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = nombreArchivo;
        a.click();
        URL.revokeObjectURL(pdfUrl);
        if (Swal) Swal.fire('¡Constancia Descargada!', 'El documento ha sido guardado en tu dispositivo.', 'success');
      } else if (modo === 'email') {
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = nombreArchivo;
        a.click();
        URL.revokeObjectURL(pdfUrl);

        const emailDestino = formDatos.representante_email || formDatos.padre_email || formDatos.madre_email || '';
        const asunto = encodeURIComponent(`Constancia de Inscripción - ${nombreCompleto}`);
        const cuerpo = encodeURIComponent(`Estimad@,\n\nAdjunto la Constancia de Inscripción oficial del estudiante ${nombreCompleto} (Año Escolar ${anoActual}-${anoProximo}).\n\nEl archivo PDF (${nombreArchivo}) ha sido descargado en su dispositivo.\n\nCódigo de Verificación: ${codigoUnico}\n\nAtentamente,\n${escNombre}\nSistema SIGAE.`);
        const mailtoUrl = `mailto:${emailDestino}?subject=${asunto}&body=${cuerpo}`;

        if (Swal) {
          Swal.fire({
            title: '¡Constancia Descargada para Envío!',
            html: `<p>El archivo <b>${nombreArchivo}</b> ha sido descargado en tu dispositivo.</p><p class="small text-muted">Haz clic en <b>Abrir Correo</b> para enviar el mensaje con el archivo adjunto.</p>`,
            icon: 'info',
            confirmButtonText: 'Abrir Correo',
            confirmButtonColor: '#0284c7'
          }).then(() => {
            window.location.href = mailtoUrl;
          });
        }
      } else {
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: `Constancia de Inscripción - ${nombreCompleto}`, text: textoMensaje });
            if (Swal) Swal.close();
          } catch (shareErr) {
            console.log('Web Share failed', shareErr);
          }
        } else {
          const pdfUrl = URL.createObjectURL(pdfBlob);
          const a = document.createElement('a');
          a.href = pdfUrl;
          a.download = nombreArchivo;
          a.click();
          URL.revokeObjectURL(pdfUrl);
          if (Swal) {
            Swal.fire({
              title: '¡Constancia Generada!',
              html: `<p>El archivo <b>${nombreArchivo}</b> ha sido descargado en tu dispositivo.</p><p class="small text-muted">Adjúntalo en tu aplicación de WhatsApp.</p>`,
              icon: 'info',
              confirmButtonColor: '#16a34a'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error generando Constancia:', error);
      if (Swal) Swal.fire('Error', 'No se pudo generar la Constancia de Inscripción.', 'error');
    }
  };

  const generarImpresionResumen = async (datosEst: any, formDatos: SolicitudForm, modo: 'pdf' | 'whatsapp' | 'email') => {
    const escCodigo = resolverEscuelaEstudiante(datosEst, formDatos);
    const escNombre = escCodigo === 'sb' ? 'Unidad Educativa Santa Bárbara' : 'Unidad Educativa Libertador Bolívar';
    const fechaHoy = new Date().toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' });
    const anoActual = new Date().getFullYear();
    const anoProximo = anoActual + 1;
    const conQuienVive = Array.isArray(formDatos.estudiante_con_quien_vive) ? formDatos.estudiante_con_quien_vive.join(', ') : (formDatos.estudiante_con_quien_vive || 'No informado');
    const nombreCompleto = `${formDatos.estudiante_nombres || datosEst.nombres_estudiante} ${formDatos.estudiante_apellidos || datosEst.apellidos_estudiante}`;

    const Swal = (window as any).Swal;
    if (Swal) {
      Swal.fire({
        title: 'Generando Documento PDF...',
        html: '<div class="spinner-border text-primary" role="status"></div><p class="mt-2 small text-muted">Construyendo el archivo PDF de la Ficha Integral...</p>',
        allowOutsideClick: false,
        showConfirmButton: false,
      });
    }

    const cedulaLimpia = (datosEst.cedula_estudiante || formDatos.estudiante_cedula || datosEst.id || '000').toString().replace(/\D/g, '');
    const codigoUnico = formDatos.codigo_unico || datosEst.codigo_unico || `FI-${escCodigo.toUpperCase()}-${cedulaLimpia || Math.floor(1000 + Math.random() * 9000)}-${anoActual}`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`SIGAE:FI:${codigoUnico}:${nombreCompleto}`)}&bgcolor=ffffff&color=166534&margin=2`;

    let base64LogoEscuela = `/assets/img/logo_${escCodigo}.png`;
    let base64Mppe = '/assets/img/logoMPPE.png';
    let base64Qr = '';

    try {
      [base64LogoEscuela, base64Mppe, base64Qr] = await Promise.all([
        obtenerImagenBase64(`/assets/img/logo_${escCodigo}.png`),
        obtenerImagenBase64('/assets/img/logoMPPE.png'),
        obtenerImagenBase64(qrApiUrl)
      ]);
    } catch (e) {
      console.error('Error preload images', e);
    }

    const totalPaginas = 3;

    // ─── HELPERS con inline styles (para que html2canvas funcione correctamente) ───
    const banderaStyle = `margin-bottom: 10px; border-radius: 4px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 1px 3px rgba(0,0,0,0.05);`;
    const banderaAmarillo = `<div style="height: 5px; background-color: #facc15;"></div>`;
    const banderaAzul = `<div style="height: 7px; background-color: #2563eb; display: flex; justify-content: center; align-items: center; gap: 3px; color: #ffffff; font-size: 6px; line-height: 1; font-family: Arial, sans-serif;"><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span></div>`;
    const banderaRojo = `<div style="height: 5px; background-color: #dc2626;"></div>`;

    const cintilloHTML = (subtitulo: string) => `
      <div style="${banderaStyle}">
        ${banderaAmarillo}${banderaAzul}${banderaRojo}
      </div>
      <div style="display: flex; align-items: center; gap: 14px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px;">
        <img src="${base64LogoEscuela}" style="height: 46px; width: auto; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.08));" />
        <div style="flex: 1;">
          <h4 style="margin: 0; color: #16a34a; font-weight: 800; font-size: 11.5px; text-transform: uppercase; letter-spacing: -0.2px;">${subtitulo}</h4>
          <p style="margin: 1px 0 0; font-size: 9.5px; color: #64748b;">Sistema Integral de Gestión y Administración Escolar (SIGAE)</p>
          <p style="margin: 1px 0 0; font-size: 11px; font-weight: 700; color: #1e3a8a;">${escNombre}</p>
        </div>
        ${base64Qr ? `
        <div style="text-align: center; background: #ffffff; border: 1px solid #cbd5e1; padding: 4px 6px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); min-width: 62px;">
          <img src="${base64Qr}" style="height: 42px; width: 42px; display: block; margin: 0 auto;" />
          <span style="font-size: 7px; font-weight: 800; color: #166534; font-family: monospace; display: block; margin-top: 2px; letter-spacing: -0.2px;">${codigoUnico}</span>
        </div>
        ` : ''}
      </div>
    `;

    const pieHTML = (numPag: number) => `
      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1.5px solid #e2e8f0; padding-top: 8px; margin-top: 14px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <img src="${base64Mppe}" style="height: 20px; width: auto;" />
        </div>
        <div style="text-align: right; font-size: 9px; color: #94a3b8; font-weight: 600; line-height: 1.2;">
          Cód. Verificación: <b style="color: #166534; font-family: monospace;">${codigoUnico}</b> | Generado: ${fechaHoy}<br/>
          SIGAE - Control Estudiantil — Página ${numPag} de ${totalPaginas}
        </div>
      </div>
    `;

    // Estilos inline reutilizables
    const sS = `background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; margin-bottom: 10px;`; // seccion
    const sT = `margin: 0 0 6px 0; color: #0f172a; font-size: 11px; font-weight: 700; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px;`; // seccion-titulo
    const gD = `display: grid; grid-template-columns: 1fr 1fr; gap: 5px 14px; font-size: 10px; color: #475569;`; // grid-datos (2 cols)
    const gD3 = `display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px 12px; font-size: 10px; color: #475569;`; // grid-datos (3 cols)
    const dB = `color: #334155; font-weight: 600;`; // dato bold
    const dV = `color: #0f172a; font-weight: 600;`; // dato-valor
    const bV = `color: #166534; font-weight: 700; background: #dcfce7; padding: 1.5px 7px; border-radius: 4px; font-size: 9.5px; display: inline-block;`; // badge-verde
    const bA = `color: #1e3a8a; font-weight: 700; background: #dbeafe; padding: 1.5px 7px; border-radius: 4px; font-size: 9.5px; display: inline-block;`; // badge-azul
    const pgStyle = `border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 18px; background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%); display: flex; flex-direction: column; justify-content: space-between; min-height: 960px; box-sizing: border-box;`; // pagina

    // Campo helper
    const campo = (label: string, valor: string, full = false) =>
      `<div${full ? ' style="grid-column: 1 / -1;"' : ''}><b style="${dB}">${label}:</b><br/><span style="${dV}">${valor}</span></div>`;
    const campoB = (label: string, valor: string, tipo: 'verde' | 'azul' = 'verde') =>
      `<div><b style="${dB}">${label}:</b><br/><span style="${tipo === 'verde' ? bV : bA}">${valor}</span></div>`;

    // ─── PÁGINA 1: Representante + Estudiante + Dirección ───
    const pagina1 = `<div style="${pgStyle}">
      <div>
        ${cintilloHTML(`Ficha Integral de Actualización de Datos — Año Escolar ${anoActual} - ${anoProximo}`)}
        
        <!-- REPRESENTANTE LEGAL -->
        <div style="${sS}">
          <h5 style="${sT}">👤 Datos del Representante Legal</h5>
          <div style="${gD}">
            ${campo('Nombres del Representante', formDatos.representante_nombres || datosEst.nombres_representante || 'No informado')}
            ${campo('Apellidos del Representante', formDatos.representante_apellidos || datosEst.apellidos_representante || 'No informado')}
            ${campo('Cédula de Identidad', formDatos.representante_cedula || datosEst.cedula_representante || 'No informado')}
            ${campo('Fecha de Nacimiento', formDatos.representante_fecha_nacimiento || 'No informado')}
            ${campo('Teléfono Principal', formDatos.representante_telefono || 'No informado')}
            ${campo('Teléfono Alternativo', formDatos.representante_telefono2 || 'No informado')}
            ${campo('Correo Electrónico', formDatos.representante_email || 'No informado')}
            ${campo('¿Trabaja en PDVSA?', formDatos.representante_trabaja_pdvsa || 'No')}
            ${formDatos.representante_trabaja_pdvsa === 'Sí' ? `
            ${campo('Condición Laboral PDVSA', formDatos.pdvsa_condicion_laboral || 'No informado')}
            ${campo('Tipo de Nómina PDVSA', formDatos.pdvsa_tipo_nomina || 'No informado')}
            ${campo('Negocio / Filial PDVSA', formDatos.pdvsa_negocio_filial || 'No informado')}
            ${campo('Gerencia / Departamento PDVSA', formDatos.pdvsa_gerencia || 'No informado')}
            ${campo('Correo Corporativo PDVSA', formDatos.pdvsa_email_empresa || 'No informado')}
            ${campo('Localidad de Trabajo PDVSA', formDatos.pdvsa_localidad_trabajo === 'Otra' ? formDatos.pdvsa_localidad_trabajo_otra || '' : formDatos.pdvsa_localidad_trabajo || 'No informado')}
            ` : ''}
          </div>
        </div>

        <!-- DATOS DEL ESTUDIANTE -->
        <div style="${sS}">
          <h5 style="${sT}">👦 Datos de Identificación del Estudiante</h5>
          <div style="${gD}">
            ${campo('Nombres del Estudiante', formDatos.estudiante_nombres || datosEst.nombres_estudiante || 'No informado')}
            ${campo('Apellidos del Estudiante', formDatos.estudiante_apellidos || datosEst.apellidos_estudiante || 'No informado')}
            ${campo('Cédula de Identidad / Carnet Escolar', formDatos.estudiante_cedula || datosEst.cedula_estudiante || 'No posee')}
            ${campo('Género del Estudiante', formDatos.estudiante_sexo || 'No informado')}
            ${campo('Fecha de Nacimiento del Estudiante', formDatos.estudiante_fecha_nacimiento || 'No informado')}
            ${campo('País de Nacimiento', formDatos.estudiante_pais_nacimiento === 'Otro' ? formDatos.estudiante_pais_nacimiento_otro || '' : formDatos.estudiante_pais_nacimiento || 'Venezuela')}
            ${campo('Estado / Provincia de Nacimiento', formDatos.estudiante_estado_nacimiento || 'No informado')}
            ${campo('Municipio / Ciudad de Nacimiento', formDatos.estudiante_municipio_nacimiento || 'No informado')}
            ${campo('Folio o Tomo de la Partida de Nacimiento', formDatos.estudiante_folio_nacimiento || 'No informado')}
            ${campo('Acta de la Partida de Nacimiento', formDatos.estudiante_acta_nacimiento || 'No informado')}
            ${campoB('Grado / Año que cursa', formDatos.grado_solicitado || datosEst.grado_actual || 'No informado')}
            ${campoB('Sección asignada', datosEst.seccion_actual || 'No informado')}
            ${campo(formDatos.representante_trabaja_pdvsa === 'Sí' ? 'Parentesco con Trabajador PDVSA' : 'Parentesco con Representante Legal', formDatos.parentesco || 'No informado')}
            ${campo('¿Con quién vive el estudiante?', conQuienVive)}
            ${campo('¿Reconocido por el padre?', formDatos.estudiante_reconocido_por_padre || 'Sí')}
          </div>
        </div>

        <!-- DIRECCIÓN DE HABITACIÓN -->
        <div style="${sS}">
          <h5 style="${sT}">📍 Dirección de Habitación del Estudiante</h5>
          <div style="${gD3}">
            ${campo('Estado', formDatos.estado_habitacion || 'No informado')}
            ${campo('Municipio', formDatos.municipio_habitacion || 'No informado')}
            ${campo('Parroquia / Sector', formDatos.parroquia_habitacion || 'No informado')}
            ${campo('Dirección Detallada de Habitación', formDatos.direccion_habitacion || 'No informado', true)}
          </div>
        </div>
      </div>

      ${pieHTML(1)}
    </div>`;

    // ─── PÁGINA 2: Salud + Transporte + Antropometría + Habilidades + Tecnología ───
    const pagina2 = `<div style="${pgStyle}">
      <div>
        ${cintilloHTML(`Ficha Integral de Actualización de Datos — Salud, Servicios y Habilidades`)}

        <!-- SALUD Y BIENESTAR -->
        <div style="${sS}">
          <h5 style="${sT}">🏥 Información de Salud y Bienestar (Confidencial)</h5>
          <div style="${gD}">
            ${campo('¿Posee Condición Neurológica?', formDatos.estudiante_condicion_neuro || 'No')}
            ${formDatos.estudiante_condicion_neuro === 'Sí' ? `
            ${campo('Tipo de Condición / Discapacidad', formDatos.estudiante_tipo_condicion === 'Otra' ? formDatos.estudiante_tipo_condicion_otro || '' : formDatos.estudiante_tipo_condicion || 'No informado')}
            ${campo('¿Tiene Informe Médico?', formDatos.estudiante_informe_neuro ? 'Sí (Digitalizado)' : 'No')}
            ${campo('¿Tiene Certificado CONAPDIS?', formDatos.estudiante_certificado_conapdis ? 'Sí (Digitalizado)' : 'No')}
            ` : ''}
            ${campo('Grupo Sanguíneo del Estudiante', formDatos.estudiante_grupo_sanguineo || 'No informado')}
            ${campo('Condición Médica del Estudiante', formDatos.estudiante_condicion_medica === 'Otra' ? formDatos.estudiante_condicion_medica_otro || '' : formDatos.estudiante_condicion_medica || 'Ninguna')}
            ${campo('¿Es alérgico a algún medicamento?', formDatos.estudiante_tiene_alergia_medicamentos === 'Sí' ? 'Sí — ' + (formDatos.estudiante_alergico_medicamentos === 'Otra' ? formDatos.estudiante_alergico_medicamentos_otro || '' : formDatos.estudiante_alergico_medicamentos || 'No especificado') : 'No')}
            ${campo('¿Es alérgico a algún alimento?', formDatos.estudiante_tiene_alergia_alimentos === 'Sí' ? 'Sí — ' + (formDatos.estudiante_alergia_alimentos === 'Otra' ? formDatos.estudiante_alergia_alimentos_otro || '' : formDatos.estudiante_alergia_alimentos || 'No especificado') : 'No')}
            ${campo('¿Posee otras alergias o intolerancias?', formDatos.estudiante_tiene_otras_alergias === 'Sí' ? 'Sí — ' + (formDatos.estudiante_otras_alergias === 'Otra' ? formDatos.estudiante_otras_alergias_otro || '' : formDatos.estudiante_otras_alergias || 'No especificado') : 'No')}
          </div>
        </div>

        <!-- TRANSPORTE Y ANTROPOMETRÍA -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div style="${sS} margin-bottom: 0;">
            <h5 style="${sT}">行驶 Transporte Escolar</h5>
            <div style="${gD}">
              ${campo('¿Requiere transporte?', formDatos.requiere_transporte ? 'Sí' : 'No')}
              ${formDatos.requiere_transporte ? `
              ${campoB('Ruta asignada', '🚍 ' + (formDatos.ruta_transporte || 'No informado'), 'azul')}
              ${campo('Parada asignada', formDatos.parada_transporte || 'No informado', true)}
              ` : ''}
            </div>
          </div>
          <div style="${sS} margin-bottom: 0;">
            <h5 style="${sT}">📏 Datos Antropométricos</h5>
            <div style="${gD3}">
              ${campo('Estatura', formDatos.estatura_metros ? formDatos.estatura_metros + ' m' : 'No inf.')}
              ${campo('Peso', formDatos.peso_kg ? formDatos.peso_kg + ' kg' : 'No inf.')}
              ${campo('Franela', formDatos.talla_franela || 'No inf.')}
              ${campo('Pantalón', formDatos.talla_pantalon || 'No inf.')}
              ${campo('Calzado', formDatos.talla_calzado || 'No inf.')}
            </div>
          </div>
        </div>

        <!-- HABILIDADES CULTURALES Y DEPORTIVAS -->
        <div style="${sS} margin-top: 10px;">
          <h5 style="${sT}">🎨 Habilidades Artísticas y Deportivas</h5>
          <div style="${gD}">
            ${campo('¿Habilidad musical?', formDatos.tiene_habilidad_cultura === 'Sí' ? 'Sí' : 'No')}
            ${formDatos.tiene_habilidad_cultura === 'Sí' ? `
            ${campo('Instrumento que ejecuta', formDatos.habilidad_cultura_instrumento === 'Otra' ? formDatos.habilidad_cultura_instrumento_otro || '' : formDatos.habilidad_cultura_instrumento || 'No informado')}
            ${campo('¿Pertenece a una Orquesta?', formDatos.habilidad_cultura_orquesta || 'No')}
            ` : ''}
            ${campo('¿Habilidad en danza?', formDatos.tiene_habilidad_danza === 'Sí' ? 'Sí' : 'No')}
            ${formDatos.tiene_habilidad_danza === 'Sí' ? `
            ${campo('Tipo de danza que practica', formDatos.habilidad_danza_tipo || 'No informado')}
            ${campo('¿Academia de danza?', formDatos.habilidad_danza_academia || 'No')}
            ` : ''}
            ${campo('¿Practica algún deporte?', formDatos.tiene_habilidad_deporte === 'Sí' ? 'Sí' : 'No')}
            ${formDatos.tiene_habilidad_deporte === 'Sí' ? `
            ${campo('Disciplina deportiva', formDatos.habilidad_deporte_disciplina === 'Otra' ? formDatos.habilidad_deporte_disciplina_otro || '' : formDatos.habilidad_deporte_disciplina || 'No informado')}
            ${campo('¿Club deportivo?', formDatos.habilidad_deporte_academia || 'No')}
            ` : ''}
          </div>
        </div>

        <!-- TECNOLOGÍA EN EL HOGAR -->
        <div style="${sS}">
          <h5 style="${sT}">💻 Tecnología en el Hogar</h5>
          <div style="${gD3}">
            ${campo('¿Computadora en el hogar?', formDatos.posee_computadora || 'No')}
            ${campo('¿Conexión a internet?', formDatos.posee_internet || 'No')}
            ${campo('¿Teléfono celular?', formDatos.posee_celular || 'No')}
          </div>
        </div>
      </div>

      ${pieHTML(2)}
    </div>`;

    // ─── PÁGINA 3: Padres + Declaración + Firmas ───
    const pagina3 = `<div style="${pgStyle}">
      <div>
        ${cintilloHTML(`Ficha Integral de Actualización de Datos — Grupo Familiar y Declaración`)}

        <!-- MADRE -->
        <div style="${sS}">
          <h5 style="${sT}">👩 Información de la Madre</h5>
          <div style="${gD}">
            ${campo('¿Con vida?', formDatos.madre_vive !== 'No' ? 'Sí' : 'No (Fallecida)')}
            ${campo('Nombres de la Madre', formDatos.madre_nombres || 'No informado')}
            ${campo('Apellidos de la Madre', formDatos.madre_apellidos || 'No informado')}
            ${campo('Cédula de Identidad', formDatos.madre_cedula || 'No informado')}
            ${campo('Fecha de Nacimiento', formDatos.madre_fecha_nacimiento || 'No informado')}
            ${campo('Lugar de Nacimiento', formDatos.madre_lugar_nacimiento || 'No informado')}
            ${formDatos.madre_vive !== 'No' ? `
            ${campo('Teléfono de Contacto', formDatos.madre_telefono || 'No informado')}
            ${campo('Correo Electrónico', formDatos.madre_email || 'No informado')}
            ${campo('Dirección de Habitación', formDatos.madre_direccion || 'No informado', true)}
            ${campo('¿Trabaja en PDVSA?', formDatos.madre_trabaja_pdvsa ? 'Sí' : 'No')}
            ` : ''}
          </div>
        </div>

        <!-- PADRE -->
        <div style="${sS}">
          <h5 style="${sT}">👨 Información del Padre</h5>
          ${formDatos.estudiante_reconocido_por_padre !== 'No' ? `
          <div style="${gD}">
            ${campo('¿Con vida?', formDatos.padre_vive !== 'No' ? 'Sí' : 'No (Fallecido)')}
            ${campo('Nombres del Padre', formDatos.padre_nombres || 'No informado')}
            ${campo('Apellidos del Padre', formDatos.padre_apellidos || 'No informado')}
            ${campo('Cédula de Identidad', formDatos.padre_cedula || 'No informado')}
            ${campo('Fecha de Nacimiento', formDatos.padre_fecha_nacimiento || 'No informado')}
            ${campo('Lugar de Nacimiento', formDatos.padre_lugar_nacimiento || 'No informado')}
            ${formDatos.padre_vive !== 'No' ? `
            ${campo('Teléfono de Contacto', formDatos.padre_telefono || 'No informado')}
            ${campo('Correo Electrónico', formDatos.padre_email || 'No informado')}
            ${campo('Dirección de Habitación', formDatos.padre_direccion || 'No informado', true)}
            ${campo('¿Trabaja en PDVSA?', formDatos.padre_trabaja_pdvsa ? 'Sí' : 'No')}
            ` : ''}
          </div>
          ` : `
          <div style="padding: 10px; background: #f8fafc; border-radius: 8px; font-size: 10px; color: #64748b;">
            <b>El estudiante no fue reconocido por el padre.</b>
          </div>
          `}
        </div>

        <!-- NOTA INSTITUCIONAL & DECLARACIÓN JURADA -->
        <div style="${sS} background: #fffbeb; border-color: #fde68a;">
          <h5 style="${sT} color: #b45309; border-color: #fde68a;">📋 Declaración Jurada del Representante Legal</h5>
          <div style="font-size: 9.5px; color: #78350f; line-height: 1.5;">
            Yo, <b style="color: #0f172a;">${formDatos.representante_nombres || datosEst.nombres_representante || '_______________'} ${formDatos.representante_apellidos || datosEst.apellidos_representante || '_______________'}</b>, 
            titular de la Cédula de Identidad N° <b style="color: #0f172a;">V-${formDatos.representante_cedula || datosEst.cedula_representante || '_______________'}</b>, 
            en mi carácter de representante legal del (de la) estudiante <b style="color: #0f172a;">${nombreCompleto}</b>, 
            declaro bajo fe de juramento que todos los datos suministrados en la presente planilla de actualización de datos son verídicos, precisos y completos. 
            Asumo plena responsabilidad por cualquier información incorrecta, falsa u omitida para el año escolar <b>${anoActual} - ${anoProximo}</b>.
          </div>
        </div>

        <!-- FIRMAS Y SELLO -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px; text-align: center;">
          <div>
            <div style="border-top: 1px dashed #475569; margin-top: 40px; padding-top: 5px; font-size: 10px; font-weight: 600; color: #1e293b;">
              Firma del Representante Legal<br/>
              C.I.: ${formDatos.representante_cedula || datosEst.cedula_representante || ''}
            </div>
          </div>
          <div>
            <div style="border-top: 1px dashed #475569; margin-top: 40px; padding-top: 5px; font-size: 10px; font-weight: 600; color: #1e293b;">
              Firma y Sello de la Dirección del Plantel<br/>
              Validación y Control Estudiantil
            </div>
          </div>
        </div>
      </div>

      ${pieHTML(3)}
    </div>`;

    const paginas = [pagina1, pagina2, pagina3];

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter',
        compress: true
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < paginas.length; i++) {
        if (i > 0) pdf.addPage();

        const clon = document.createElement('div');
        clon.style.width = '800px';
        clon.style.minWidth = '800px';
        clon.style.maxWidth = '800px';
        clon.style.position = 'fixed';
        clon.style.left = '-9999px';
        clon.style.top = '0';
        clon.style.zIndex = '-99999';
        clon.style.pointerEvents = 'none';
        clon.style.boxSizing = 'border-box';
        clon.style.fontFamily = "'Inter', 'Segoe UI', Roboto, sans-serif";
        clon.style.fontSize = '11px';
        clon.style.lineHeight = '1.45';
        clon.style.color = '#0f172a';
        clon.style.padding = '25px';
        clon.style.background = '#ffffff';
        clon.style.setProperty('-webkit-font-smoothing', 'antialiased');
        clon.style.textRendering = 'geometricPrecision';
        clon.innerHTML = paginas[i];

        document.body.appendChild(clon);
        await new Promise(res => setTimeout(res, 200));

        const canvas = await html2canvas(clon, { 
          scale: 2.2, 
          backgroundColor: '#ffffff', 
          logging: false, 
          useCORS: true, 
          allowTaint: true,
          imageTimeout: 4000,
          windowWidth: 1024,
          width: 800
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        const canvasAspect = canvas.width / canvas.height;
        const marginX = 8;
        const marginY = 8;
        const printableWidth = pdfWidth - (marginX * 2);
        const printableHeight = pdfHeight - (marginY * 2);

        let finalWidth = printableWidth;
        let finalHeight = finalWidth / canvasAspect;

        if (finalHeight > printableHeight) {
          finalHeight = printableHeight;
          finalWidth = finalHeight * canvasAspect;
        }

        const posX = (pdfWidth - finalWidth) / 2;
        const posY = (pdfHeight - finalHeight) / 2;

        pdf.addImage(imgData, 'JPEG', posX, posY, finalWidth, finalHeight, undefined, 'FAST');

        document.body.removeChild(clon);
      }

      const pdfBlob = pdf.output('blob');
      const nombreArchivo = `Ficha_Integral_${nombreCompleto.replace(/\s+/g, '_')}.pdf`;
      const file = new File([pdfBlob], nombreArchivo, { type: "application/pdf" });

      const textoMensaje = `*SIGAE - Ficha Integral de Actualización de Datos*\n\n` +
        `Estimad@, adjunto la ficha integral de *${nombreCompleto}* actualizada con éxito en formato PDF.\n` +
        `Plantel: ${escNombre}\n\n` +
        `Sistema SIGAE.`;

      if (modo === 'pdf') {
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = nombreArchivo;
        a.click();
        URL.revokeObjectURL(pdfUrl);
        if (Swal) Swal.fire('¡PDF Descargado!', 'El documento ha sido guardado en tu dispositivo.', 'success');
      } else if (modo === 'email') {
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = nombreArchivo;
        a.click();
        URL.revokeObjectURL(pdfUrl);

        const emailDestino = formDatos.representante_email || formDatos.padre_email || formDatos.madre_email || '';
        const asunto = encodeURIComponent(`Ficha Integral de Actualización de Datos - ${nombreCompleto}`);
        const cuerpo = encodeURIComponent(`Estimad@,\n\nSe ha generado la Ficha Integral de Actualización de Datos oficial del estudiante ${nombreCompleto} (Año Escolar ${anoActual}-${anoProximo}).\n\nEl archivo PDF (${nombreArchivo}) ha sido descargado en su dispositivo para ser adjuntado a este correo.\n\nCódigo: ${codigoUnico}\n\nAtentamente,\n${escNombre}\nSistema SIGAE.`);
        const mailtoUrl = `mailto:${emailDestino}?subject=${asunto}&body=${cuerpo}`;

        if (Swal) {
          Swal.fire({
            title: '¡Ficha Descargada para Envío!',
            html: `
              <p>El archivo <b>${nombreArchivo}</b> se ha descargado en tu dispositivo.</p>
              <div class="alert alert-info py-2 small text-start mt-2">
                <i class="bi bi-envelope-fill me-1"></i> Haz clic en <b>Abrir Correo</b> para redactar el mensaje y adjuntar el archivo PDF descargado.
              </div>
            `,
            icon: 'info',
            confirmButtonText: 'Abrir Correo',
            confirmButtonColor: '#0284c7'
          }).then(() => {
            window.location.href = mailtoUrl;
          });
        }
      } else {
        // WhatsApp
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Ficha Integral - ${nombreCompleto}`,
              text: textoMensaje
            });
            if (Swal) Swal.close();
          } catch (shareErr) {
            console.log('Web Share failed', shareErr);
          }
        } else {
          const pdfUrl = URL.createObjectURL(pdfBlob);
          const a = document.createElement('a');
          a.href = pdfUrl;
          a.download = nombreArchivo;
          a.click();
          URL.revokeObjectURL(pdfUrl);

          if (Swal) {
            Swal.fire({
              title: '¡Documento PDF Generado!',
              html: `
                <p>El archivo <b>${nombreArchivo}</b> ha sido descargado en tu dispositivo.</p>
                <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; color: #166534; padding: 10px; border-radius: 8px; font-size: 13px; text-align: left; margin-top: 15px;">
                  <strong>Para enviarlo por WhatsApp:</strong> Abre la aplicación y adjunta el archivo PDF descargado.
                </div>
              `,
              icon: 'info',
              confirmButtonText: 'Entendido',
              confirmButtonColor: '#16a34a'
            });
          }
        }
      }

    } catch (error) {
      console.error('Error generando PDF:', error);
      if (Swal) Swal.fire('Error', 'No se pudo generar el documento PDF.', 'error');
    }
  };



  const cargarMisRepresentados = async (cedulaConsulta: string) => {
    setLoading(true);
    try {
      const cedLimRep = cedulaConsulta.trim().replace(/\D/g, '');

      // 1. Consultar vinculaciones existentes y solicitudes de cupos en paralelo
      const [vincRes, solsRes] = await Promise.all([
        supabase
          .from('estudiantes_vinculaciones')
          .select('*')
          .or(`cedula_representante.eq.${cedulaConsulta},cedula_representante.eq.${cedLimRep}`)
          .order('created_at', { ascending: false }),
        supabase
          .from('solicitud_cupos')
          .select('*')
          .or(`representante_cedula.eq.${cedulaConsulta},representante_cedula.eq.${cedLimRep}`)
          .order('created_at', { ascending: false })
      ]);

      if (vincRes.error) throw vincRes.error;

      const vincs = vincRes.data || [];
      const sols = solsRes.data || [];

      // Mapeo exhaustivo de solicitudes para rápida indexación
      const solMap: Record<string, any> = {};
      sols.forEach(s => {
        if (s.id) solMap[`sol_${s.id}`] = s;
        if (s.codigo_unico) solMap[s.codigo_unico] = s;
        if (s.estudiante_cedula) {
          const cLim = s.estudiante_cedula.replace(/\D/g, '');
          if (cLim) solMap[cLim] = s;
          solMap[s.estudiante_cedula.trim()] = s;
        }
        const nomNorm = `${(s.estudiante_nombres || '').trim()} ${(s.estudiante_apellidos || '').trim()}`.toLowerCase();
        if (nomNorm) solMap[nomNorm] = s;
      });
      setSolicitudesAdmisionMap(solMap);

      // Combinar: Si hay aspirantes de cupo (Aprobados o Formalizados) que aún no figuran en vinculaciones,
      // sintetizamos un registro virtual para permitirle completar su Ficha Integral
      const listaFinal = [...vincs];
      for (const s of sols) {
        const estSol = (s.estado || '').toLowerCase();
        if (['aprobado', 'aprobada', 'formalizado', 'formalizada', 'inscrito', 'inscrita'].includes(estSol)) {
          const cedLim = (s.estudiante_cedula || '').replace(/\D/g, '');
          const nomNorm = `${(s.estudiante_nombres || '').trim()} ${(s.estudiante_apellidos || '').trim()}`.toLowerCase();
          
          const yaExiste = vincs.some(v => {
            const vCed = (v.cedula_estudiante || '').replace(/\D/g, '');
            if (cedLim && vCed && cedLim === vCed) return true;
            if (s.codigo_unico && v.codigo_unico && s.codigo_unico === v.codigo_unico) return true;
            const vNom = `${(v.nombres_estudiante || '').trim()} ${(v.apellidos_estudiante || '').trim()}`.toLowerCase();
            return Boolean(nomNorm && vNom && nomNorm === vNom);
          });

          if (!yaExiste) {
            // Verificar si el estudiante ya fue vinculado a OTRO representante (reasignado/transferido)
            let asignadoAOtro = false;
            try {
              const codUniSinT = (s.codigo_unico || '').replace(/^T-/, '');
              const sCedEst = (s.estudiante_cedula || '').trim();
              const sCedDigits = sCedEst.replace(/\D/g, '');
              const nomEst = (s.estudiante_nombres || '').trim();
              const apeEst = (s.estudiante_apellidos || '').trim();

              let queryOr = `cedula_estudiante.eq.${sCedEst || 'SIN_CED'},cedula_estudiante.eq.${s.codigo_unico || 'SIN_COD'},cedula_estudiante.eq.${codUniSinT || 'SIN_COD'},cedula_estudiante.eq.T-${codUniSinT || 'SIN_COD'}`;
              if (sCedDigits && sCedDigits !== sCedEst) {
                queryOr += `,cedula_estudiante.eq.${sCedDigits}`;
              }

              const { data: vOtro } = await supabase
                .from('estudiantes_vinculaciones')
                .select('id, cedula_representante, nombres_estudiante, apellidos_estudiante')
                .or(queryOr)
                .limit(5);

              let matchVinc: any = (vOtro || []).find((v: any) => {
                const repDigits = String(v.cedula_representante || '').replace(/\D/g, '');
                return repDigits && repDigits !== cedLimRep;
              });

              // Si no hubo coincidencia por identificadores, verificar por nombre completo
              if (!matchVinc && nomEst && apeEst) {
                const { data: vNom } = await supabase
                  .from('estudiantes_vinculaciones')
                  .select('id, cedula_representante, nombres_estudiante, apellidos_estudiante')
                  .ilike('nombres_estudiante', `%${nomEst}%`)
                  .ilike('apellidos_estudiante', `%${apeEst}%`)
                  .limit(2);

                if (vNom && vNom.length > 0) {
                  const repDigits = String(vNom[0].cedula_representante || '').replace(/\D/g, '');
                  if (repDigits && repDigits !== cedLimRep) {
                    matchVinc = vNom[0];
                  }
                }
              }

              if (matchVinc) {
                asignadoAOtro = true;
                // Auto-sincronizar solicitud_cupos para desvincular definitivamente al representante previo
                supabase.from('solicitud_cupos').update({ representante_cedula: matchVinc.cedula_representante }).eq('id', s.id).then();
              }
            } catch (e) {}

            if (asignadoAOtro) continue;

            listaFinal.push({
              id: `sol_${s.id}`,
              id_solicitud: s.id,
              cedula_representante: s.representante_cedula,
              nombres_representante: s.representante_nombres,
              apellidos_representante: s.representante_apellidos,
              cedula_estudiante: s.estudiante_cedula || `ESC-${s.codigo_unico}`,
              nombres_estudiante: s.estudiante_nombres,
              apellidos_estudiante: s.estudiante_apellidos,
              grado_actual: s.grado_solicitado,
              codigo_escuela: s.codigo_escuela,
              codigo_unico: s.codigo_unico,
              datos_actualizados: s.datos_actualizados || {
                estudiante_nombres: s.estudiante_nombres,
                estudiante_apellidos: s.estudiante_apellidos,
                estudiante_cedula: s.estudiante_cedula,
                estudiante_fecha_nacimiento: s.estudiante_fecha_nacimiento,
                estudiante_sexo: s.estudiante_sexo,
                grado_solicitado: s.grado_solicitado,
                representante_nombres: s.representante_nombres,
                representante_apellidos: s.representante_apellidos,
                representante_cedula: s.representante_cedula,
                representante_telefono: s.representante_telefono,
                representante_email: s.representante_email,
                estado_habitacion: s.estado_habitacion,
                municipio_habitacion: s.municipio_habitacion,
                parroquia_habitacion: s.parroquia_habitacion,
                direccion_habitacion: s.direccion_habitacion,
                madre_nombres: s.madre_nombres,
                madre_cedula: s.madre_cedula,
                padre_nombres: s.padre_nombres,
                padre_cedula: s.padre_cedula,
              },
              fecha_ultima_actualizacion: s.datos_actualizados?.fecha_ultima_actualizacion || null,
              es_nuevo_ingreso_virtual: true,
              origen_admision: 'nuevo_ingreso',
              formalizado_en_fisico: s.datos_actualizados?.formalizado_en_fisico || ['formalizado', 'formalizada', 'inscrito', 'inscrita'].includes((s.estado || '').toLowerCase()),
              estado_admision: s.estado
            });
          }
        }
      }

      setMisRepresentados(listaFinal);
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
      try {
        const cachedGeo = sessionStorage.getItem('sigae_div_pol_vzla');
        if (cachedGeo) {
          allGeoData = JSON.parse(cachedGeo);
        } else {
          let from = 0;
          const limit = 1000;
          while (true) {
            const geoRes = await supabase
              .from('div_pol_vzla')
              .select('estado, municipio, parroquia')
              .order('estado', { ascending: true })
              .range(from, from + limit - 1);
            if (geoRes.error) throw geoRes.error;
            if (!geoRes.data || geoRes.data.length === 0) break;
            allGeoData = [...allGeoData, ...geoRes.data];
            if (geoRes.data.length < limit) break;
            from += limit;
          }
          if (allGeoData.length > 0) {
            try { sessionStorage.setItem('sigae_div_pol_vzla', JSON.stringify(allGeoData)); } catch (e) {}
          }
        }
      } catch (errGeo) {
        console.error('Error cargando división territorial:', errGeo);
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



      if (!estudianteSeleccionado) {
        const escuelaInicial = resolverEscuelaEstudiante(null);
        await cargarTransporteParaEscuela(escuelaInicial);
      }

    } catch (e) {
      console.error('Error cargando catálogos:', e);
    }
  };

  const cargarTransporteParaEscuela = async (escTarget?: string) => {
    const esc = (escTarget || 'sb').toLowerCase();
    try {
      const [rutasTransRes, paradasTransRes] = await Promise.all([
        supabase.from('transporte_rutas').select('*').eq('escuela_codigo', esc).order('nombre', { ascending: true }),
        supabase.from('transporte_paradas').select('*').eq('escuela_codigo', esc).order('nombre_parada', { ascending: true })
      ]);
      setRutasTransporteDB(rutasTransRes.data || []);
      setParadasTransporteDB(paradasTransRes.data || []);
    } catch (e) {
      console.error('Error cargando transporte para escuela:', esc, e);
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



  const abrirFichaEstudiante = (est: any, targetStep?: number) => {
    setEstudianteSeleccionado(est);
    const initialStep = targetStep || 1;
    sessionStorage.setItem('sigae_act_draft_estudiante_id', String(est.id));
    sessionStorage.setItem('sigae_act_draft_step', String(initialStep));

    // Cargar rutas y paradas específicas de la escuela de este estudiante
    const escEst = resolverEscuelaEstudiante(est, est.datos_actualizados);
    cargarTransporteParaEscuela(escEst);
    setSelectedRutaObj(null);
    setSelectedParadaObj(null);

    const tipoDocDefecto = (est.datos_actualizados && est.datos_actualizados.estudiante_tipo_documento)
      ? est.datos_actualizados.estudiante_tipo_documento
      : (est.cedula_estudiante && (est.cedula_estudiante.toString().toUpperCase().startsWith('CE') || est.cedula_estudiante.toString().length > 9))
        ? 'Cédula Escolar'
        : 'Cédula de Identidad';

    const dAct = (est.datos_actualizados && typeof est.datos_actualizados === 'object') ? est.datos_actualizados : {};
    
    // Obtener nombre del representante verídico
    const repNombreUser = user?.nombre_completo || '';
    let repNomFinal = dAct.representante_nombres || est.nombres_representante || '';
    let repApeFinal = dAct.representante_apellidos || est.apellidos_representante || '';
    if (repNombreUser && (!repNomFinal || repNomFinal === est.nombres_estudiante)) {
      const partes = repNombreUser.trim().split(' ');
      if (partes.length >= 2) {
        repNomFinal = partes.slice(0, Math.ceil(partes.length / 2)).join(' ');
        repApeFinal = partes.slice(Math.ceil(partes.length / 2)).join(' ');
      } else {
        repNomFinal = repNombreUser;
      }
    }

    // Proteger nombre del estudiante si la fila raíz fue guardada erróneamente con los datos del representante
    let estNomFinal = est.nombres_estudiante || '';
    let estApeFinal = est.apellidos_estudiante || '';
    if (dAct.estudiante_nombres && (
      !estNomFinal ||
      estNomFinal === est.nombres_representante ||
      (repNombreUser && estNomFinal.toLowerCase() === repNombreUser.toLowerCase())
    )) {
      estNomFinal = dAct.estudiante_nombres;
      estApeFinal = dAct.estudiante_apellidos || estApeFinal;
    }

    let paradaCargada = dAct.parada_transporte || '';
    if (!paradaCargada && dAct.ruta_transporte && dAct.ruta_transporte.includes(' - Parada: ')) {
      paradaCargada = dAct.ruta_transporte.split(' - Parada: ')[1]?.trim() || '';
    }

    if (Object.keys(dAct).length > 0) {
      setForm({ ...defaultForm(), ...dAct,
        codigo_escuela: est.codigo_escuela || dAct.codigo_escuela || escEst,
        parada_transporte: paradaCargada,
        estudiante_tipo_documento: tipoDocDefecto,
        estudiante_nombres: estNomFinal,
        estudiante_apellidos: estApeFinal,
        estudiante_cedula: dAct.estudiante_cedula || est.cedula_estudiante,
        grado_solicitado: est.grado_actual || dAct.grado_solicitado,
        representante_nombres: repNomFinal,
        representante_apellidos: repApeFinal,
        representante_cedula: est.cedula_representante || dAct.representante_cedula,
        tiene_otros_inscritos: misRepresentados.length > 1
       });
    } else {
      setForm({
        ...defaultForm(),
        codigo_escuela: est.codigo_escuela || escEst,
        estudiante_tipo_documento: tipoDocDefecto,
        estudiante_nombres: estNomFinal,
        estudiante_apellidos: estApeFinal,
        estudiante_cedula: est.cedula_estudiante,
        grado_solicitado: est.grado_actual,
        representante_nombres: repNomFinal,
        representante_apellidos: repApeFinal,
        representante_cedula: est.cedula_representante,
        tiene_otros_inscritos: misRepresentados.length > 1
      });
    }

    setStep(initialStep);
  };

  // Mantener el paso actual guardado en la sesión ante cualquier recarga o cambio de app
  useEffect(() => {
    if (estudianteSeleccionado) {
      sessionStorage.setItem('sigae_act_draft_estudiante_id', String(estudianteSeleccionado.id));
      sessionStorage.setItem('sigae_act_draft_step', String(step));
    }
  }, [step, estudianteSeleccionado]);

  // ─── LÓGICA DE COMPRESIÓN Y CARGA DE CONSTANCIAS ────────────────────────────
  const [uploadingCultura, setUploadingCultura] = useState(false);
  const [uploadingDanza, setUploadingDanza] = useState(false);
  const [uploadingDeporte, setUploadingDeporte] = useState(false);
  const [uploadingFotoCarnet, setUploadingFotoCarnet] = useState(false);
  const [uploadingFotoCedulaEst, setUploadingFotoCedulaEst] = useState(false);
  const [uploadingFotoPartida, setUploadingFotoPartida] = useState(false);
  const [uploadingFotoInforme, setUploadingFotoInforme] = useState(false);
  const [uploadingFotoConapdis, setUploadingFotoConapdis] = useState(false);
  const [uploadingFotoCedulaMadre, setUploadingFotoCedulaMadre] = useState(false);
  const [uploadingFotoCedulaPadre, setUploadingFotoCedulaPadre] = useState(false);

  /**
   * Compresión inteligente optimizada:
   * Redimensiona con interpolación de alta calidad (máx 1280px en el lado mayor)
   * y compresión JPEG al 80%, logrando archivos ultra livianos (~100-180KB)
   * con nitidez cristalina en textos, firmas y sellos de documentos oficiales.
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
          let width = img.width;
          let height = img.height;
          const MAX_DIM = 1280; // Garantiza legibilidad perfecta en cédulas, actas y constancias
          if (width > height && width > MAX_DIM) {
            height = Math.round(height * MAX_DIM / width);
            width = MAX_DIM;
          } else if (height > MAX_DIM) {
            width = Math.round(width * MAX_DIM / height);
            height = MAX_DIM;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg', lastModified: Date.now() }));
              } else {
                resolve(file);
              }
            }, 'image/jpeg', 0.80); // Balance óptimo: peso mínimo (~120KB) y nitidez HD
          } else {
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  type TipoDocumento = 
    | 'foto_carnet' 
    | 'foto_cedula_estudiante' 
    | 'foto_partida_nacimiento' 
    | 'foto_informe_medico' 
    | 'foto_carnet_conapdis'
    | 'foto_cedula_madre'
    | 'foto_cedula_padre'
    | 'constancia_cultura'
    | 'constancia_danza'
    | 'constancia_deporte';

  const setUploadingDoc = (tipo: TipoDocumento, val: boolean) => {
    if (tipo === 'foto_carnet') setUploadingFotoCarnet(val);
    if (tipo === 'foto_cedula_estudiante') setUploadingFotoCedulaEst(val);
    if (tipo === 'foto_partida_nacimiento') setUploadingFotoPartida(val);
    if (tipo === 'foto_informe_medico') setUploadingFotoInforme(val);
    if (tipo === 'foto_carnet_conapdis') setUploadingFotoConapdis(val);
    if (tipo === 'foto_cedula_madre') setUploadingFotoCedulaMadre(val);
    if (tipo === 'foto_cedula_padre') setUploadingFotoCedulaPadre(val);
    if (tipo === 'constancia_cultura') setUploadingCultura(val);
    if (tipo === 'constancia_danza') setUploadingDanza(val);
    if (tipo === 'constancia_deporte') setUploadingDeporte(val);
  };

  const handleSubirDocumento = async (e: React.ChangeEvent<HTMLInputElement>, tipo: TipoDocumento) => {
    window.dispatchEvent(new Event('reset-inactivity-timer'));
    const fileOriginal = e.target.files?.[0];
    if (!fileOriginal || !estudianteSeleccionado) return;
    if (fileOriginal.size > 8 * 1024 * 1024) {
      if (Swal) Swal.fire('Archivo muy grande', 'El archivo no debe superar los 8MB.', 'warning');
      return;
    }
    setUploadingDoc(tipo, true);
    try {
      const isPdf = fileOriginal.type === 'application/pdf' || fileOriginal.name.toLowerCase().endsWith('.pdf');
      const file = isPdf ? fileOriginal : await compressImageMax(fileOriginal);
      const ext = isPdf ? 'pdf' : 'jpg';
      const cedulaEst = (estudianteSeleccionado.cedula_estudiante || form.estudiante_cedula || 'sin_cedula').toString().replace(/\D/g, '');
      const escuelaCod = (estudianteSeleccionado.codigo_escuela || 'documentos').toString().toLowerCase();
      const fileName = `${tipo}_${cedulaEst}_${Date.now()}.${ext}`;
      const filePath = `${escuelaCod}/${fileName}`;
      const { error } = await supabase.storage.from('documentos_solicitudes').upload(filePath, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('documentos_solicitudes').getPublicUrl(filePath);
      updateForm(`${tipo}_url` as keyof SolicitudForm, data.publicUrl);
      window.dispatchEvent(new Event('reset-inactivity-timer'));
      if (Swal) Swal.fire({ icon: 'success', title: 'Documento cargado', text: 'Documento optimizado y guardado correctamente.', timer: 2000, showConfirmButton: false });
    } catch (err: any) {
      console.error('Error al subir documento:', err);
      if (Swal) Swal.fire('Error', `No se pudo subir el archivo: ${err.message}`, 'error');
    } finally {
      setUploadingDoc(tipo, false);
      e.target.value = ''; // Reset input
    }
  };



  // Guardado Automático Silencioso (Borrador)
  useEffect(() => {
    if (!estudianteSeleccionado || step === 10) return; // No auto-guardar en la confirmación final o si no hay estudiante

    setSavingStatus('saving');
    const timer = setTimeout(async () => {
      try {
        const escEst = resolverEscuelaEstudiante(estudianteSeleccionado, form);
        const prevDatos = estudianteSeleccionado.datos_actualizados || {};
        const infoAdm = obtenerInfoAdmision(estudianteSeleccionado);
        const payload = {
          datos_actualizados: { 
            ...prevDatos,
            ...form, 
            codigo_escuela: escEst,
            origen_admision: prevDatos.origen_admision || estudianteSeleccionado.origen_admision || (infoAdm.esNuevoIngreso ? 'nuevo_ingreso' : undefined),
            formalizado_en_fisico: prevDatos.formalizado_en_fisico !== undefined ? prevDatos.formalizado_en_fisico : (estudianteSeleccionado.formalizado_en_fisico || false),
            ficha_completada: prevDatos.ficha_completada === true // mantener en borrador si no ha finalizado
          },
          codigo_escuela: escEst
        };

        const isVirtualSol = estudianteSeleccionado.id && estudianteSeleccionado.id.toString().startsWith('sol_');
        if (isVirtualSol) {
          const solId = estudianteSeleccionado.id_solicitud || estudianteSeleccionado.id.replace('sol_', '');
          await supabase
            .from('solicitud_cupos')
            .update({ datos_actualizados: payload.datos_actualizados })
            .eq('id', solId);
        } else {
          const { error } = await supabase
            .from('estudiantes_vinculaciones')
            .update(payload)
            .eq('id', estudianteSeleccionado.id);
          if (error) throw error;
        }
        
        // Actualizamos la lista local silenciosamente
        setMisRepresentados(prev => prev.map(m => m.id === estudianteSeleccionado.id ? { ...m, datos_actualizados: payload.datos_actualizados } : m));
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
      const escKey = resolverEscuelaEstudiante(estudianteSeleccionado, form).toUpperCase();
      const cedLimpia = (estudianteSeleccionado.cedula_estudiante || form.estudiante_cedula || '').replace(/\D/g, '');
      const anoAct = new Date().getFullYear();
      const codigoGenerado = form.codigo_unico || estudianteSeleccionado.codigo_unico || `CI-${escKey}-${cedLimpia || Math.floor(1000 + Math.random() * 9000)}-${anoAct}`;
      const prevDatos = estudianteSeleccionado.datos_actualizados || {};
      const infoAdm = obtenerInfoAdmision(estudianteSeleccionado);

      const payload = {
        datos_actualizados: { 
          ...prevDatos,
          ...form, 
          codigo_unico: codigoGenerado, 
          codigo_escuela: escKey.toLowerCase(),
          origen_admision: prevDatos.origen_admision || estudianteSeleccionado.origen_admision || (infoAdm.esNuevoIngreso ? 'nuevo_ingreso' : undefined),
          formalizado_en_fisico: prevDatos.formalizado_en_fisico !== undefined ? prevDatos.formalizado_en_fisico : (estudianteSeleccionado.formalizado_en_fisico || false),
          ficha_completada: true,
          fecha_ultima_actualizacion: nowIso
        },
        codigo_escuela: escKey.toLowerCase(),
        fecha_ultima_actualizacion: nowIso
      };

      const isVirtualSol = estudianteSeleccionado.id && estudianteSeleccionado.id.toString().startsWith('sol_');
      if (isVirtualSol) {
        const solId = estudianteSeleccionado.id_solicitud || estudianteSeleccionado.id.replace('sol_', '');
        await supabase
          .from('solicitud_cupos')
          .update({
            datos_actualizados: payload.datos_actualizados,
            updated_at: nowIso
          })
          .eq('id', solId);

        const { error: errUpsert } = await supabase
          .from('estudiantes_vinculaciones')
          .upsert([{
            cedula_representante: form.representante_cedula || estudianteSeleccionado.cedula_representante || user?.cedula,
            nombres_representante: form.representante_nombres || estudianteSeleccionado.nombres_representante,
            apellidos_representante: form.representante_apellidos || estudianteSeleccionado.apellidos_representante,
            cedula_estudiante: form.estudiante_cedula || estudianteSeleccionado.cedula_estudiante,
            nombres_estudiante: form.estudiante_nombres || estudianteSeleccionado.nombres_estudiante,
            apellidos_estudiante: form.estudiante_apellidos || estudianteSeleccionado.apellidos_estudiante,
            grado_actual: form.grado_solicitado || estudianteSeleccionado.grado_actual,
            codigo_escuela: escKey.toLowerCase(),
            codigo_unico: codigoGenerado,
            datos_actualizados: payload.datos_actualizados,
            fecha_ultima_actualizacion: nowIso
          }], { onConflict: 'cedula_estudiante' });

        if (errUpsert) console.warn('Nota al sincronizar vinculación:', errUpsert.message);
      } else {
        const { error } = await supabase
          .from('estudiantes_vinculaciones')
          .update(payload)
          .eq('id', estudianteSeleccionado.id);

        if (error) throw error;
      }



      if (Swal) {

        Swal.fire({
          icon: 'success',
          title: '¡Ficha Integral Actualizada y Guardada!',
          html: `
            <p class="mb-2">La información de <b>${estudianteSeleccionado.nombres_estudiante}</b> se ha registrado correctamente.</p>
            <p class="small text-muted mb-0">Ya puede descargar su <b>Resumen de Ficha Integral (Carta)</b> y sus recaudos de matrícula.</p>
          `,
          confirmButtonText: '<i class="bi bi-file-earmark-pdf-fill me-1"></i> Descargar Resumen (Carta)',
          showCancelButton: true,
          cancelButtonText: 'Ver mis Representados',
          confirmButtonColor: '#16a34a',
          cancelButtonColor: '#64748b'
        }).then((result: any) => {
          if (result.isConfirmed) {
            manejarOpcionesResumen(estudianteSeleccionado, payload.datos_actualizados);
          }
        });

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

      () => {

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
        if (!form.estudiante_folio_nacimiento) faltantes.push('Folio o Tomo de la Partida de Nacimiento');
        if (!form.estudiante_acta_nacimiento) faltantes.push('Acta de la Partida de Nacimiento');
        
        if (!form.foto_carnet_url) faltantes.push('Foto Carnet del Estudiante');
        if (form.estudiante_tipo_documento !== 'Cédula Escolar' && !form.foto_cedula_estudiante_url) {
          faltantes.push('Foto Cédula de Identidad del Estudiante');
        }
        if (!form.foto_partida_nacimiento_url) faltantes.push('Foto Partida de Nacimiento');

        if (!form.estudiante_sexo) faltantes.push('Género');
        if (!form.parentesco) faltantes.push(form.representante_trabaja_pdvsa === 'Sí' ? 'Parentesco con el Trabajador/a' : 'Parentesco con el Representante Legal');
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
          if (!form.ruta_transporte && !selectedRutaObj) {
            faltantes.push('Ruta de Transporte');
          }

          let paradaEfectiva = (form.parada_transporte || '').trim();
          if (!paradaEfectiva && selectedParadaObj?.nombre_parada) {
            paradaEfectiva = selectedParadaObj.nombre_parada;
          }
          if (!paradaEfectiva && form.ruta_transporte && form.ruta_transporte.includes(' - Parada: ')) {
            paradaEfectiva = form.ruta_transporte.split(' - Parada: ')[1]?.trim() || '';
          }

          if (rutasTransporteDB.length > 0) {
            if (!paradaEfectiva) {
              faltantes.push('Parada de Transporte');
            } else if (!form.parada_transporte) {
              // Auto-sincronizar en el estado del formulario para que no quede vacía
              setForm(prev => ({
                ...prev,
                parada_transporte: paradaEfectiva,
                ruta_transporte: selectedRutaObj && !prev.ruta_transporte.includes(' - Parada: ')
                  ? `${selectedRutaObj.nombre} - Parada: ${paradaEfectiva}`
                  : prev.ruta_transporte
              }));
            }
          }
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
        
        // Solo exigir foto, dirección y datos de contacto si la madre se encuentra con vida
        if (form.madre_vive !== 'No') {
          if (!form.foto_cedula_madre_url) faltantes.push('Foto Cédula de la Madre');
          if (!form.madre_direccion) faltantes.push('Dirección de Habitación de la Madre');
          if (form.madre_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.madre_email)) faltantes.push('Correo de la Madre (formato inválido)');
          if (form.madre_telefono && !/^\d{11}$/.test(form.madre_telefono.replace(/\D/g, ''))) faltantes.push('Teléfono de la Madre (formato inválido)');
        }

        if (form.estudiante_reconocido_por_padre !== 'No') {
          if (!form.padre_nombres) faltantes.push('Nombres del Padre');
          if (!form.padre_apellidos) faltantes.push('Apellidos del Padre');
          if (!form.padre_cedula) faltantes.push('Cédula del Padre');
          else if (!/^\d{6,10}$/.test(form.padre_cedula)) faltantes.push('Cédula del Padre (inválida, solo 6-10 dígitos)');
          if (!form.padre_lugar_nacimiento) faltantes.push('Lugar de Nacimiento del Padre');
          
          // Solo exigir foto, dirección y datos de contacto si el padre se encuentra con vida
          if (form.padre_vive !== 'No') {
            if (!form.foto_cedula_padre_url) faltantes.push('Foto Cédula del Padre');
            if (!form.padre_direccion) faltantes.push('Dirección de Habitación del Padre');
            if (form.padre_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.padre_email)) faltantes.push('Correo del Padre (formato inválido)');
            if (form.padre_telefono && !/^\d{11}$/.test(form.padre_telefono.replace(/\D/g, ''))) faltantes.push('Teléfono del Padre (formato inválido)');
          }
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
    window.scrollTo({ top: 220, behavior: 'smooth' });
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
    <>
      {/* Barra de Progreso Fija en Móvil */}
      <div className="d-block d-md-none mb-3 p-2 bg-light rounded-3 border shadow-xs">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <span className="fw-bold text-dark small">Paso {step} de 10: <span className="text-primary">{STEPS[step - 1]?.label}</span></span>
          <span className="badge bg-primary text-white rounded-pill">{step * 10}%</span>
        </div>
        <div className="progress" style={{ height: '6px' }}>
          <div 
            className="progress-bar bg-primary progress-bar-striped progress-bar-animated" 
            role="progressbar" 
            style={{ width: `${step * 10}%` }}
          ></div>
        </div>
      </div>

      <ChamiloStepWizard
        steps={STEPS.map(s => ({
          id: s.num,
          title: s.label,
          icon: s.icon,
          description: `Paso ${s.num}`
        }))}
        currentStep={step - 1}
        onStepClick={(num) => {
          const target = (typeof num === 'number' ? num : Number(num)) + 1;
          if (target > step) {
            intentarAvanzar(target, step);
          } else {
            setStep(target);
            window.scrollTo({ top: 220, behavior: 'smooth' });
          }
        }}
      />
    </>
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
          <label className="form-label fw-semibold">¿Es Trabajador Activo, Jubilado o Sobreviviente de PDVSA? <span className="text-danger">*</span></label>
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
        <div className="col-12">
          <label className="form-label fw-bold d-block">
            Tipo de Documento de Identificación del Estudiante <span className="text-danger">*</span>
          </label>
          <div className="d-flex flex-wrap gap-2">
            {[
              { id: 'Cédula de Identidad', label: 'Cédula de Identidad (Posee cédula física)', icon: 'bi-person-vcard' },
              { id: 'Cédula Escolar', label: 'Cédula Escolar (No posee cédula física)', icon: 'bi-mortarboard-fill' }
            ].map(tipoDoc => {
              const isSelected = (form.estudiante_tipo_documento || 'Cédula de Identidad') === tipoDoc.id;
              return (
                <button
                  key={tipoDoc.id}
                  type="button"
                  className={`btn rounded-pill px-4 py-2 fw-semibold d-flex align-items-center gap-2 ${isSelected ? 'btn-success shadow-sm' : 'btn-outline-secondary bg-white text-dark'}`}
                  onClick={() => {
                    updateForm('estudiante_tipo_documento', tipoDoc.id);
                    if (tipoDoc.id === 'Cédula Escolar') {
                      updateForm('foto_cedula_estudiante_url', '');
                    }
                  }}
                >
                  <i className={`bi ${isSelected ? 'bi-check-circle-fill text-white' : 'bi-circle text-muted'}`}></i>
                  <i className={`bi ${tipoDoc.icon}`}></i>
                  {tipoDoc.label}
                </button>
              );
            })}
          </div>
          {form.estudiante_tipo_documento === 'Cédula Escolar' && (
            <div className="form-text text-success mt-1">
              <i className="bi bi-info-circle-fill me-1"></i>
              Al tener Cédula Escolar, solo se solicitará la Foto Carnet y la Partida de Nacimiento.
            </div>
          )}
        </div>

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
          <label className="form-label fw-semibold">N° Folio o Tomo de Partida <span className="text-danger">*</span></label>
          <input type="text" className="form-control input-moderno" placeholder="Ej. 123"
            value={form.estudiante_folio_nacimiento || ''} onChange={(e) => updateForm('estudiante_folio_nacimiento', e.target.value)} />
        </div>

        <div className="col-md-4">
          <label className="form-label fw-semibold">N° Acta de Partida <span className="text-danger">*</span></label>
          <input type="text" className="form-control input-moderno" placeholder="Ej. 456"
            value={form.estudiante_acta_nacimiento || ''} onChange={(e) => updateForm('estudiante_acta_nacimiento', e.target.value)} />
        </div>
        {/* ────────────────────────────────────── */}

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
          <label className="form-label fw-semibold">
            {form.representante_trabaja_pdvsa === 'Sí' ? 'Parentesco con el Trabajador/a' : 'Parentesco con el Representante Legal'} <span className="text-danger">*</span>
          </label>
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
            { tipo: 'foto_carnet' as TipoDocumento, label: 'Foto Tipo Carnet', sub: 'Fondo blanco · cara visible *', icon: 'bi-person-bounding-box', color: 'primary', urlKey: 'foto_carnet_url' as keyof SolicitudForm, uploading: uploadingFotoCarnet },
            ...(form.estudiante_tipo_documento !== 'Cédula Escolar' ? [
              { tipo: 'foto_cedula_estudiante' as TipoDocumento, label: 'Foto Cédula del Estudiante', sub: 'Ambas caras legibles *', icon: 'bi-card-image', color: 'warning', urlKey: 'foto_cedula_estudiante_url' as keyof SolicitudForm, uploading: uploadingFotoCedulaEst }
            ] : []),
            { tipo: 'foto_partida_nacimiento' as TipoDocumento, label: 'Partida de Nacimiento', sub: 'Copia legible del documento *', icon: 'bi-file-earmark-person', color: 'info', urlKey: 'foto_partida_nacimiento_url' as keyof SolicitudForm, uploading: uploadingFotoPartida },
          ]).map(({ tipo, label, sub, icon, color, urlKey, uploading }) => {
            const url = form[urlKey] as string;
            const colClass = form.estudiante_tipo_documento === 'Cédula Escolar' ? 'col-md-6' : 'col-md-4';
            return (
              <div key={tipo} className={colClass}>
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

                {/* ─── DIRECCIÓN Y FOTO CÉDULA MADRE ─── */}
                <div className="col-md-12">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label fw-semibold small m-0">Dirección de Habitación de la Madre <span className="text-danger">*</span></label>
                    <button type="button" className="btn btn-xs btn-outline-success rounded-pill px-3 py-1 small fw-semibold"
                      onClick={() => {
                        const dirEst = form.direccion_habitacion
                          ? `${form.direccion_habitacion}${form.parroquia_habitacion ? ', Parroquia ' + form.parroquia_habitacion : ''}${form.municipio_habitacion ? ', Mun. ' + form.municipio_habitacion : ''}${form.estado_habitacion ? ', Est. ' + form.estado_habitacion : ''}`
                          : '';
                        updateForm('madre_direccion', dirEst);
                        if (Swal) Swal.fire({ icon: 'success', title: 'Dirección Copiada', text: 'Se copió la dirección de habitación del estudiante para la madre.', timer: 1800, showConfirmButton: false });
                      }}>
                      <i className="bi bi-geo-alt-fill me-1"></i>¿Es la misma dirección del estudiante?
                    </button>
                  </div>
                  <input type="text" className="form-control input-moderno" placeholder="Ej. Urb. Las Palmas, Calle 3, Casa #45"
                    value={form.madre_direccion || ''} onChange={(e) => handleTituloChange(e, (v) => updateForm('madre_direccion', v))} />
                </div>

                <div className="col-md-12 mt-3">
                  <div className="card border-0 shadow-sm rounded-4 overflow-hidden" style={{ maxWidth: 380 }}>
                    <div className="card-header bg-danger-subtle d-flex align-items-center gap-2 py-2">
                      <i className="bi bi-card-image text-danger fs-5"></i>
                      <div>
                        <div className="fw-bold small text-dark">Foto Cédula de la Madre</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>Ambas caras legibles *</div>
                      </div>
                    </div>
                    <div className="card-body p-2 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 140 }}>
                      {form.foto_cedula_madre_url ? (
                        <div className="text-center w-100">
                          <img src={form.foto_cedula_madre_url} alt="Cédula Madre" className="img-fluid rounded-3 mb-2 shadow-sm"
                            style={{ maxHeight: 120, objectFit: 'cover', width: '100%' }} />
                          <div className="d-flex gap-1 justify-content-center">
                            <a href={form.foto_cedula_madre_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success rounded-pill px-2">
                              <i className="bi bi-eye me-1"></i>Ver
                            </a>
                            <label className="btn btn-sm btn-outline-secondary rounded-pill px-2 mb-0" style={{ cursor: 'pointer' }}>
                              <i className="bi bi-arrow-repeat me-1"></i>Cambiar
                              <input type="file" accept="image/*" className="d-none" onChange={(e) => handleSubirDocumento(e, 'foto_cedula_madre')} />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className="d-flex flex-column align-items-center justify-content-center gap-2 w-100 h-100 rounded-3 p-3"
                          style={{ cursor: uploadingFotoCedulaMadre ? 'default' : 'pointer', border: '2px dashed #cbd5e1', background: '#f8fafc', minHeight: 130 }}>
                          {uploadingFotoCedulaMadre ? (
                            <><span className="spinner-border spinner-border-sm text-danger"></span><span className="small text-muted">Subiendo cédula...</span></>
                          ) : (
                            <><i className="bi bi-cloud-arrow-up fs-2 text-danger"></i>
                              <span className="small fw-semibold text-dark text-center">Foto Cédula de la Madre</span>
                              <span className="text-muted" style={{ fontSize: '0.7rem' }}>Clic para seleccionar imagen</span></>
                          )}
                          <input type="file" accept="image/*" className="d-none" disabled={uploadingFotoCedulaMadre}
                            onChange={(e) => handleSubirDocumento(e, 'foto_cedula_madre')} />
                        </label>
                      )}
                    </div>
                  </div>
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

                    {/* ─── DIRECCIÓN Y FOTO CÉDULA PADRE ─── */}
                    <div className="col-md-12">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label fw-semibold small m-0">Dirección de Habitación del Padre <span className="text-danger">*</span></label>
                        <button type="button" className="btn btn-xs btn-outline-primary rounded-pill px-3 py-1 small fw-semibold"
                          onClick={() => {
                            const dirEst = form.direccion_habitacion
                              ? `${form.direccion_habitacion}${form.parroquia_habitacion ? ', Parroquia ' + form.parroquia_habitacion : ''}${form.municipio_habitacion ? ', Mun. ' + form.municipio_habitacion : ''}${form.estado_habitacion ? ', Est. ' + form.estado_habitacion : ''}`
                              : '';
                            updateForm('padre_direccion', dirEst);
                            if (Swal) Swal.fire({ icon: 'success', title: 'Dirección Copiada', text: 'Se copió la dirección de habitación del estudiante para el padre.', timer: 1800, showConfirmButton: false });
                          }}>
                          <i className="bi bi-geo-alt-fill me-1"></i>¿Es la misma dirección del estudiante?
                        </button>
                      </div>
                      <input type="text" className="form-control input-moderno" placeholder="Ej. Urb. Las Palmas, Calle 3, Casa #45"
                        value={form.padre_direccion || ''} onChange={(e) => handleTituloChange(e, (v) => updateForm('padre_direccion', v))} />
                    </div>

                    <div className="col-md-12 mt-3">
                      <div className="card border-0 shadow-sm rounded-4 overflow-hidden" style={{ maxWidth: 380 }}>
                        <div className="card-header bg-primary-subtle d-flex align-items-center gap-2 py-2">
                          <i className="bi bi-card-image text-primary fs-5"></i>
                          <div>
                            <div className="fw-bold small text-dark">Foto Cédula del Padre</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>Ambas caras legibles *</div>
                          </div>
                        </div>
                        <div className="card-body p-2 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 140 }}>
                          {form.foto_cedula_padre_url ? (
                            <div className="text-center w-100">
                              <img src={form.foto_cedula_padre_url} alt="Cédula Padre" className="img-fluid rounded-3 mb-2 shadow-sm"
                                style={{ maxHeight: 120, objectFit: 'cover', width: '100%' }} />
                              <div className="d-flex gap-1 justify-content-center">
                                <a href={form.foto_cedula_padre_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success rounded-pill px-2">
                                  <i className="bi bi-eye me-1"></i>Ver
                                </a>
                                <label className="btn btn-sm btn-outline-secondary rounded-pill px-2 mb-0" style={{ cursor: 'pointer' }}>
                                  <i className="bi bi-arrow-repeat me-1"></i>Cambiar
                                  <input type="file" accept="image/*" className="d-none" onChange={(e) => handleSubirDocumento(e, 'foto_cedula_padre')} />
                                </label>
                              </div>
                            </div>
                          ) : (
                            <label className="d-flex flex-column align-items-center justify-content-center gap-2 w-100 h-100 rounded-3 p-3"
                              style={{ cursor: uploadingFotoCedulaPadre ? 'default' : 'pointer', border: '2px dashed #cbd5e1', background: '#f8fafc', minHeight: 130 }}>
                              {uploadingFotoCedulaPadre ? (
                                <><span className="spinner-border spinner-border-sm text-primary"></span><span className="small text-muted">Subiendo cédula...</span></>
                              ) : (
                                <><i className="bi bi-cloud-arrow-up fs-2 text-primary"></i>
                                  <span className="small fw-semibold text-dark text-center">Foto Cédula del Padre</span>
                                  <span className="text-muted" style={{ fontSize: '0.7rem' }}>Clic para seleccionar imagen</span></>
                              )}
                              <input type="file" accept="image/*" className="d-none" disabled={uploadingFotoCedulaPadre}
                                onChange={(e) => handleSubirDocumento(e, 'foto_cedula_padre')} />
                            </label>
                          )}
                        </div>
                      </div>
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
                <div className="d-flex gap-3 mt-2 mb-2">
                  {[{ label: 'Sí', val: true }, { label: 'No', val: false }].map(opt => (
                    <button key={opt.label} type="button"
                      className={`btn rounded-pill px-4 fw-semibold ${form.estudiante_informe_neuro === opt.val ? 'btn-success shadow' : 'btn-outline-secondary bg-white text-dark'}`}
                      onClick={() => {
                        updateForm('estudiante_informe_neuro', opt.val);
                        if (!opt.val) updateForm('foto_informe_medico_url', '');
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {form.estudiante_informe_neuro && (
                  <div className="card border-0 shadow-sm rounded-4 overflow-hidden animate__animated animate__fadeIn">
                    <div className="card-header bg-danger-subtle d-flex align-items-center gap-2 py-2">
                      <i className="bi bi-file-earmark-medical text-danger fs-5"></i>
                      <div>
                        <div className="fw-bold small text-dark">Informe Médico</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>Foto o copia legible *</div>
                      </div>
                    </div>
                    <div className="card-body p-2 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 140 }}>
                      {form.foto_informe_medico_url ? (
                        <div className="text-center w-100">
                          <img src={form.foto_informe_medico_url} alt="Informe Médico" className="img-fluid rounded-3 mb-2 shadow-sm"
                            style={{ maxHeight: 120, objectFit: 'cover', width: '100%' }} />
                          <div className="d-flex gap-1 justify-content-center">
                            <a href={form.foto_informe_medico_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success rounded-pill px-2">
                              <i className="bi bi-eye me-1"></i>Ver
                            </a>
                            <label className="btn btn-sm btn-outline-secondary rounded-pill px-2 mb-0" style={{ cursor: 'pointer' }}>
                              <i className="bi bi-arrow-repeat me-1"></i>Cambiar
                              <input type="file" accept="image/*" className="d-none" onChange={(e) => handleSubirDocumento(e, 'foto_informe_medico')} />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className="d-flex flex-column align-items-center justify-content-center gap-2 w-100 h-100 rounded-3 p-3"
                          style={{ cursor: uploadingFotoInforme ? 'default' : 'pointer', border: '2px dashed #cbd5e1', background: '#f8fafc', minHeight: 130 }}>
                          {uploadingFotoInforme ? (
                            <><span className="spinner-border spinner-border-sm text-danger"></span><span className="small text-muted">Subiendo informe...</span></>
                          ) : (
                            <><i className="bi bi-cloud-arrow-up fs-2 text-danger"></i>
                              <span className="small fw-semibold text-dark text-center">Informe Médico</span>
                              <span className="text-muted" style={{ fontSize: '0.7rem' }}>Clic para seleccionar imagen</span></>
                          )}
                          <input type="file" accept="image/*" className="d-none" disabled={uploadingFotoInforme}
                            onChange={(e) => handleSubirDocumento(e, 'foto_informe_medico')} />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="col-md-4 animate__animated animate__fadeIn">
                <label className="form-label fw-semibold">¿Tiene certificado CONAPDIS? <span className="text-danger">*</span></label>
                <div className="d-flex gap-3 mt-2 mb-2">
                  {[{ label: 'Sí', val: true }, { label: 'No', val: false }].map(opt => (
                    <button key={opt.label} type="button"
                      className={`btn rounded-pill px-4 fw-semibold ${form.estudiante_certificado_conapdis === opt.val ? 'btn-success shadow' : 'btn-outline-secondary bg-white text-dark'}`}
                      onClick={() => {
                        updateForm('estudiante_certificado_conapdis', opt.val);
                        if (!opt.val) updateForm('foto_carnet_conapdis_url', '');
                      }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {form.estudiante_certificado_conapdis && (
                  <div className="card border-0 shadow-sm rounded-4 overflow-hidden animate__animated animate__fadeIn">
                    <div className="card-header bg-warning-subtle d-flex align-items-center gap-2 py-2">
                      <i className="bi bi-shield-check text-warning fs-5"></i>
                      <div>
                        <div className="fw-bold small text-dark">Carnet CONAPDIS</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>Foto o copia legible *</div>
                      </div>
                    </div>
                    <div className="card-body p-2 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 140 }}>
                      {form.foto_carnet_conapdis_url ? (
                        <div className="text-center w-100">
                          <img src={form.foto_carnet_conapdis_url} alt="Carnet CONAPDIS" className="img-fluid rounded-3 mb-2 shadow-sm"
                            style={{ maxHeight: 120, objectFit: 'cover', width: '100%' }} />
                          <div className="d-flex gap-1 justify-content-center">
                            <a href={form.foto_carnet_conapdis_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success rounded-pill px-2">
                              <i className="bi bi-eye me-1"></i>Ver
                            </a>
                            <label className="btn btn-sm btn-outline-secondary rounded-pill px-2 mb-0" style={{ cursor: 'pointer' }}>
                              <i className="bi bi-arrow-repeat me-1"></i>Cambiar
                              <input type="file" accept="image/*" className="d-none" onChange={(e) => handleSubirDocumento(e, 'foto_carnet_conapdis')} />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className="d-flex flex-column align-items-center justify-content-center gap-2 w-100 h-100 rounded-3 p-3"
                          style={{ cursor: uploadingFotoConapdis ? 'default' : 'pointer', border: '2px dashed #cbd5e1', background: '#f8fafc', minHeight: 130 }}>
                          {uploadingFotoConapdis ? (
                            <><span className="spinner-border spinner-border-sm text-warning"></span><span className="small text-muted">Subiendo carnet...</span></>
                          ) : (
                            <><i className="bi bi-cloud-arrow-up fs-2 text-warning"></i>
                              <span className="small fw-semibold text-dark text-center">Carnet CONAPDIS</span>
                              <span className="text-muted" style={{ fontSize: '0.7rem' }}>Clic para seleccionar imagen</span></>
                          )}
                          <input type="file" accept="image/*" className="d-none" disabled={uploadingFotoConapdis}
                            onChange={(e) => handleSubirDocumento(e, 'foto_carnet_conapdis')} />
                        </label>
                      )}
                    </div>
                  </div>
                )}
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
    const escEst = resolverEscuelaEstudiante(estudianteSeleccionado, form);
    const rutasFiltradas = rutasTransporteDB.filter(r => (r.escuela_codigo || '').toLowerCase() === escEst.toLowerCase());
    const paradasFiltradas = paradasTransporteDB.filter(p => (p.escuela_codigo || '').toLowerCase() === escEst.toLowerCase());

    return (
      <div className="animate__animated animate__fadeIn">
        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-bus-front text-success fs-5"></i>
            <h6 className="fw-bold text-dark mb-0">Transporte Escolar</h6>
          </div>
          <span className={`badge rounded-pill ${escEst === 'sb' ? 'bg-success' : 'bg-primary'} text-white extra-small px-3 py-1.5`}>
            {escEst === 'sb' ? '🏫 Sede Santa Bárbara' : '🏫 Sede Libertador Bolívar'}
          </span>
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
                {rutasFiltradas.length > 0 ? (
                  <>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Ruta de Transporte <span className="text-danger">*</span></label>
                      <select className="form-select input-moderno"
                        value={selectedRutaObj?.id || ''}
                        onChange={(e) => {
                          const routeId = e.target.value;
                          const rObj = rutasFiltradas.find(r => r.id === routeId);
                          setSelectedRutaObj(rObj || null);
                          setSelectedParadaObj(null);
                          setForm(prev => ({
                            ...prev,
                            ruta_transporte: rObj ? rObj.nombre : '',
                            parada_transporte: ''
                          }));
                        }}>
                        <option value="">-- Seleccionar Ruta ({escEst === 'sb' ? 'Santa Bárbara' : 'Libertador Bolívar'}) --</option>
                        {rutasFiltradas.map(r => (
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
                          const pObj = paradasFiltradas.find(p => p.id === stopId);
                          setSelectedParadaObj(pObj || null);
                          setForm(prev => ({
                            ...prev,
                            ruta_transporte: selectedRutaObj && pObj ? `${selectedRutaObj.nombre} - Parada: ${pObj.nombre_parada}` : (selectedRutaObj?.nombre || prev.ruta_transporte),
                            parada_transporte: pObj ? pObj.nombre_parada : ''
                          }));
                        }}>
                        <option value="">-- Seleccionar Parada --</option>
                        {selectedRutaObj && paradasFiltradas
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
                <div className="mt-3 animate__animated animate__fadeIn">
                  <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-header bg-primary-subtle d-flex align-items-center justify-content-between py-2">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-music-note-beamed text-primary fs-5"></i>
                        <div>
                          <div className="fw-bold small text-dark">Constancia de Orquesta</div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>Opcional (No obligatoria para continuar)</div>
                        </div>
                      </div>
                      <span className="badge bg-secondary bg-opacity-25 text-dark fw-bold px-2.5 py-1 rounded-pill" style={{ fontSize: '0.68rem' }}>Opcional</span>
                    </div>
                    <div className="card-body p-2 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 140 }}>
                      {form.constancia_cultura_url ? (
                        <div className="text-center w-100">
                          {form.constancia_cultura_url.toLowerCase().includes('.pdf') ? (
                            <div className="p-3 bg-light rounded-3 mb-2 border text-center">
                              <i className="bi bi-file-earmark-pdf text-danger fs-1 d-block mb-1"></i>
                              <span className="small fw-semibold text-dark">Documento PDF Cargado</span>
                            </div>
                          ) : (
                            <img src={form.constancia_cultura_url} alt="Constancia Cultura" className="img-fluid rounded-3 mb-2 shadow-sm"
                              style={{ maxHeight: 120, objectFit: 'cover', width: '100%' }} />
                          )}
                          <div className="d-flex gap-1 justify-content-center">
                            <a href={form.constancia_cultura_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success rounded-pill px-2">
                              <i className="bi bi-eye me-1"></i>Ver
                            </a>
                            <label className="btn btn-sm btn-outline-secondary rounded-pill px-2 mb-0" style={{ cursor: 'pointer' }}>
                              <i className="bi bi-arrow-repeat me-1"></i>Cambiar
                              <input type="file" accept="image/*,application/pdf" className="d-none" onChange={(e) => handleSubirDocumento(e, 'constancia_cultura')} />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className="d-flex flex-column align-items-center justify-content-center gap-2 w-100 h-100 rounded-3 p-3"
                          style={{ cursor: uploadingCultura ? 'default' : 'pointer', border: '2px dashed #cbd5e1', background: '#f8fafc', minHeight: 130 }}>
                          {uploadingCultura ? (
                            <><span className="spinner-border spinner-border-sm text-primary"></span><span className="small text-muted">Subiendo constancia...</span></>
                          ) : (
                            <><i className="bi bi-cloud-arrow-up fs-2 text-primary"></i>
                              <span className="small fw-semibold text-dark text-center">Constancia de Orquesta (Opcional)</span>
                              <span className="text-muted" style={{ fontSize: '0.7rem' }}>Clic para seleccionar imagen o PDF (Opcional)</span></>
                          )}
                          <input type="file" accept="image/*,application/pdf" className="d-none" disabled={uploadingCultura}
                            onChange={(e) => handleSubirDocumento(e, 'constancia_cultura')} />
                        </label>
                      )}
                    </div>
                  </div>
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
                <div className="mt-3 animate__animated animate__fadeIn">
                  <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-header bg-info-subtle d-flex align-items-center justify-content-between py-2">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-activity text-info fs-5"></i>
                        <div>
                          <div className="fw-bold small text-dark">Constancia de Academia de Danza</div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>Opcional (No obligatoria para continuar)</div>
                        </div>
                      </div>
                      <span className="badge bg-secondary bg-opacity-25 text-dark fw-bold px-2.5 py-1 rounded-pill" style={{ fontSize: '0.68rem' }}>Opcional</span>
                    </div>
                    <div className="card-body p-2 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 140 }}>
                      {form.constancia_danza_url ? (
                        <div className="text-center w-100">
                          {form.constancia_danza_url.toLowerCase().includes('.pdf') ? (
                            <div className="p-3 bg-light rounded-3 mb-2 border text-center">
                              <i className="bi bi-file-earmark-pdf text-danger fs-1 d-block mb-1"></i>
                              <span className="small fw-semibold text-dark">Documento PDF Cargado</span>
                            </div>
                          ) : (
                            <img src={form.constancia_danza_url} alt="Constancia Danza" className="img-fluid rounded-3 mb-2 shadow-sm"
                              style={{ maxHeight: 120, objectFit: 'cover', width: '100%' }} />
                          )}
                          <div className="d-flex gap-1 justify-content-center">
                            <a href={form.constancia_danza_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success rounded-pill px-2">
                              <i className="bi bi-eye me-1"></i>Ver
                            </a>
                            <label className="btn btn-sm btn-outline-secondary rounded-pill px-2 mb-0" style={{ cursor: 'pointer' }}>
                              <i className="bi bi-arrow-repeat me-1"></i>Cambiar
                              <input type="file" accept="image/*,application/pdf" className="d-none" onChange={(e) => handleSubirDocumento(e, 'constancia_danza')} />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className="d-flex flex-column align-items-center justify-content-center gap-2 w-100 h-100 rounded-3 p-3"
                          style={{ cursor: uploadingDanza ? 'default' : 'pointer', border: '2px dashed #cbd5e1', background: '#f8fafc', minHeight: 130 }}>
                          {uploadingDanza ? (
                            <><span className="spinner-border spinner-border-sm text-info"></span><span className="small text-muted">Subiendo constancia...</span></>
                          ) : (
                            <><i className="bi bi-cloud-arrow-up fs-2 text-info"></i>
                              <span className="small fw-semibold text-dark text-center">Constancia de Danza (Opcional)</span>
                              <span className="text-muted" style={{ fontSize: '0.7rem' }}>Clic para seleccionar imagen o PDF (Opcional)</span></>
                          )}
                          <input type="file" accept="image/*,application/pdf" className="d-none" disabled={uploadingDanza}
                            onChange={(e) => handleSubirDocumento(e, 'constancia_danza')} />
                        </label>
                      )}
                    </div>
                  </div>
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
                <div className="mt-3 animate__animated animate__fadeIn">
                  <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-header bg-warning-subtle d-flex align-items-center justify-content-between py-2">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-trophy text-warning fs-5"></i>
                        <div>
                          <div className="fw-bold small text-dark">Constancia de Club Deportivo</div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>Opcional (No obligatoria para continuar)</div>
                        </div>
                      </div>
                      <span className="badge bg-secondary bg-opacity-25 text-dark fw-bold px-2.5 py-1 rounded-pill" style={{ fontSize: '0.68rem' }}>Opcional</span>
                    </div>
                    <div className="card-body p-2 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: 140 }}>
                      {form.constancia_deporte_url ? (
                        <div className="text-center w-100">
                          {form.constancia_deporte_url.toLowerCase().includes('.pdf') ? (
                            <div className="p-3 bg-light rounded-3 mb-2 border text-center">
                              <i className="bi bi-file-earmark-pdf text-danger fs-1 d-block mb-1"></i>
                              <span className="small fw-semibold text-dark">Documento PDF Cargado</span>
                            </div>
                          ) : (
                            <img src={form.constancia_deporte_url} alt="Constancia Deporte" className="img-fluid rounded-3 mb-2 shadow-sm"
                              style={{ maxHeight: 120, objectFit: 'cover', width: '100%' }} />
                          )}
                          <div className="d-flex gap-1 justify-content-center">
                            <a href={form.constancia_deporte_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success rounded-pill px-2">
                              <i className="bi bi-eye me-1"></i>Ver
                            </a>
                            <label className="btn btn-sm btn-outline-secondary rounded-pill px-2 mb-0" style={{ cursor: 'pointer' }}>
                              <i className="bi bi-arrow-repeat me-1"></i>Cambiar
                              <input type="file" accept="image/*,application/pdf" className="d-none" onChange={(e) => handleSubirDocumento(e, 'constancia_deporte')} />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className="d-flex flex-column align-items-center justify-content-center gap-2 w-100 h-100 rounded-3 p-3"
                          style={{ cursor: uploadingDeporte ? 'default' : 'pointer', border: '2px dashed #cbd5e1', background: '#f8fafc', minHeight: 130 }}>
                          {uploadingDeporte ? (
                            <><span className="spinner-border spinner-border-sm text-warning"></span><span className="small text-muted">Subiendo constancia...</span></>
                          ) : (
                            <><i className="bi bi-cloud-arrow-up fs-2 text-warning"></i>
                              <span className="small fw-semibold text-dark text-center">Constancia Deportiva (Opcional)</span>
                              <span className="text-muted" style={{ fontSize: '0.7rem' }}>Clic para seleccionar imagen o PDF (Opcional)</span></>
                          )}
                          <input type="file" accept="image/*,application/pdf" className="d-none" disabled={uploadingDeporte}
                            onChange={(e) => handleSubirDocumento(e, 'constancia_deporte')} />
                        </label>
                      )}
                    </div>
                  </div>
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
          <Row label={form.representante_trabaja_pdvsa === 'Sí' ? 'Parentesco con el Trabajador/a' : 'Parentesco con el Representante'} value={form.parentesco} />
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
            <Row label="Dirección de Habitación" value={form.madre_direccion} />
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
              <Row label="Dirección de Habitación" value={form.padre_direccion} />
              <Row label="¿Trabaja en PDVSA?" value={form.padre_trabaja_pdvsa ? 'Sí' : 'No'} />
            </>}
          </Section>
        )}

        {/* ── DOCUMENTOS E IMÁGENES CARGADOS EN EL REGISTRO ── */}
        <Section icon="bi-paperclip" title="Documentos e Imágenes Digitalizados Cargados" color="dark">
          <div className="d-flex flex-wrap gap-2 py-2">
            {form.foto_carnet_url ? (
              <a href={form.foto_carnet_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold">
                <i className="bi bi-person-bounding-box me-1"></i>Foto Carnet Estudiante
              </a>
            ) : <span className="badge bg-secondary bg-opacity-10 text-secondary border">Foto Carnet: No cargada</span>}

            {form.estudiante_tipo_documento !== 'Cédula Escolar' && (
              form.foto_cedula_estudiante_url ? (
                <a href={form.foto_cedula_estudiante_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold">
                  <i className="bi bi-card-image me-1"></i>Cédula de Identidad Estudiante
                </a>
              ) : <span className="badge bg-secondary bg-opacity-10 text-secondary border">Cédula Estudiante: No cargada</span>
            )}

            {form.foto_partida_nacimiento_url ? (
              <a href={form.foto_partida_nacimiento_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-info rounded-pill px-3 fw-semibold">
                <i className="bi bi-file-earmark-person me-1"></i>Partida de Nacimiento
              </a>
            ) : <span className="badge bg-secondary bg-opacity-10 text-secondary border">Partida Nacimiento: No cargada</span>}

            {form.foto_informe_medico_url && (
              <a href={form.foto_informe_medico_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold">
                <i className="bi bi-file-earmark-medical me-1"></i>Informe Médico
              </a>
            )}

            {form.foto_carnet_conapdis_url && (
              <a href={form.foto_carnet_conapdis_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-warning text-dark rounded-pill px-3 fw-semibold">
                <i className="bi bi-shield-check me-1"></i>Carnet CONAPDIS
              </a>
            )}

            {form.foto_cedula_madre_url ? (
              <a href={form.foto_cedula_madre_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold">
                <i className="bi bi-card-heading me-1"></i>Cédula de la Madre
              </a>
            ) : <span className="badge bg-secondary bg-opacity-10 text-secondary border">Cédula Madre: No cargada</span>}

            {form.estudiante_reconocido_por_padre !== 'No' && (
              form.foto_cedula_padre_url ? (
                <a href={form.foto_cedula_padre_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold">
                  <i className="bi bi-card-heading me-1"></i>Cédula del Padre
                </a>
              ) : <span className="badge bg-secondary bg-opacity-10 text-secondary border">Cédula Padre: No cargada</span>
            )}

            {form.constancia_cultura_url && (
              <a href={form.constancia_cultura_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success rounded-pill px-3 fw-semibold">
                <i className="bi bi-music-note me-1"></i>Constancia Música
              </a>
            )}

            {form.constancia_danza_url && (
              <a href={form.constancia_danza_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success rounded-pill px-3 fw-semibold">
                <i className="bi bi-activity me-1"></i>Constancia Danza
              </a>
            )}

            {form.constancia_deporte_url && (
              <a href={form.constancia_deporte_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success rounded-pill px-3 fw-semibold">
                <i className="bi bi-trophy me-1"></i>Constancia Deporte
              </a>
            )}
          </div>
        </Section>

        {/* ── BOTÓN GUARDAR Y DESCARGAR ── */}
        <div className="sticky-bottom pt-3 pb-2" style={{ background: 'linear-gradient(transparent, white 30%)', marginTop: 8 }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(9)}>
              <i className="bi bi-arrow-left me-1"></i> Anterior
            </button>
            <div className="d-flex gap-2">
              <button
                className="btn btn-success rounded-pill px-5 py-3 fw-bold shadow-lg hover-efecto d-flex align-items-center gap-2"
                style={{ fontSize: '1.05rem', background: 'linear-gradient(135deg,#16a34a,#15803d)', border: 'none' }}
                onClick={handleGuardarFicha}
                disabled={loading}
              >
                {loading
                  ? <><span className="spinner-border spinner-border-sm"></span> Guardando Ficha...</>
                  : <><i className="bi bi-check2-circle fs-5"></i> Guardar y Finalizar Ficha Integral</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };



  if (user?.rol === 'Invitado' || user?.rol === 'Visitante') {
    return (
      <div className="container py-5 text-center animate__animated animate__fadeIn">
        <div className="card border-0 shadow-sm rounded-4 p-5 mx-auto bg-white" style={{ maxWidth: '640px' }}>
          <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-inline-flex align-items-center justify-content-center p-3 mb-3 mx-auto" style={{ width: '80px', height: '80px' }}>
            <i className="bi bi-shield-lock-fill fs-1 text-warning"></i>
          </div>
          <h4 className="fw-bolder text-dark mb-2">Acceso Reservado para Representantes</h4>
          <p className="text-muted mb-4">
            El módulo de <strong>Actualización de Ficha Integral</strong> y emisión de constancias está reservado exclusivamente para <strong>Representantes Legales debidamente registrados</strong> y <strong>Personal Directivo</strong>.
          </p>
          <div className="alert alert-info border-0 rounded-3 text-start small mb-4">
            <i className="bi bi-info-circle-fill me-2"></i>
            Si eres representante legal de un estudiante del plantel, por favor cierra la sesión de visitante e ingresa con tu propia <strong>Cédula de Identidad de Representante</strong> y tu contraseña institucional.
          </div>
          <div className="d-flex justify-content-center gap-2">
            <button 
              className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm" 
              onClick={() => {
                localStorage.removeItem('sesion_sigae');
                localStorage.removeItem('usuario_sigae');
                window.location.href = '/login';
              }}
            >
              <i className="bi bi-box-arrow-in-right me-1"></i> Iniciar Sesión como Representante
            </button>
          </div>
        </div>
      </div>
    );
  }

  const abrirModeloConstancia = (esc: 'sb' | 'lb' = 'sb') => {
    const ano = new Date().getFullYear();
    const datosEstDemo = {
      cedula_estudiante: '31.456.789',
      nombres_estudiante: 'Alejandro José',
      apellidos_estudiante: 'Pérez Silva',
      grado_actual: esc === 'sb' ? '4to Grado de Educación Primaria' : '1er Año de Educación Media General',
      codigo_escuela: esc,
      nombre_escuela: esc === 'sb' ? 'Unidad Educativa Santa Bárbara' : 'Unidad Educativa Libertador Bolívar',
      cedula_representante: '15.987.654',
      nombres_representante: 'Carlos Eduardo',
      apellidos_representante: 'Pérez Mendoza',
      codigo_unico: `CI-${esc.toUpperCase()}-31456789-${ano}`
    };

    const formDemo = {
      estudiante_nombres: 'Alejandro José',
      estudiante_apellidos: 'Pérez Silva',
      estudiante_cedula: '31.456.789',
      grado_solicitado: esc === 'sb' ? '4to Grado de Educación Primaria' : '1er Año de Educación Media General',
      representante_nombres: 'Carlos Eduardo',
      representante_apellidos: 'Pérez Mendoza',
      representante_cedula: '15.987.654',
      codigo_unico: `CI-${esc.toUpperCase()}-31456789-${ano}`
    } as unknown as SolicitudForm;

    manejarOpcionesConstancia(datosEstDemo, formDemo);
  };

  const abrirModeloCarnet = (esc: 'sb' | 'lb' = 'sb') => {
    const ano = new Date().getFullYear();
    const datosEstDemo = {
      cedula_estudiante: '31.456.789',
      nombres_estudiante: 'Alejandro José',
      apellidos_estudiante: 'Pérez Silva',
      grado_actual: esc === 'sb' ? '4to Grado de Educación Primaria' : '1er Año de Educación Media General',
      seccion_actual: 'A',
      codigo_escuela: esc,
      nombre_escuela: esc === 'sb' ? 'Unidad Educativa Santa Bárbara' : 'Unidad Educativa Libertador Bolívar',
      cedula_representante: '15.987.654',
      nombres_representante: 'Carlos Eduardo',
      apellidos_representante: 'Pérez Mendoza',
      telefono_representante: '0414-1234567',
      contacto_emergencia_telefono: '0424-7654321',
      estudiante_grupo_sanguineo: 'O+',
      estudiante_alergias: 'Ninguna conocida',
      direccion_habitacion: 'Sector Centro, Calle Bolívar #12',
      codigo_unico: `CR-${esc.toUpperCase()}-31456789-${ano}`
    };

    const formDemo = {
      estudiante_nombres: 'Alejandro José',
      estudiante_apellidos: 'Pérez Silva',
      estudiante_cedula: '31.456.789',
      grado_solicitado: esc === 'sb' ? '4to Grado de Educación Primaria' : '1er Año de Educación Media General',
      seccion_actual: 'A',
      representante_nombres: 'Carlos Eduardo',
      representante_apellidos: 'Pérez Mendoza',
      representante_cedula: '15.987.654',
      representante_telefono: '0414-1234567',
      contacto_emergencia_telefono: '0424-7654321',
      estudiante_grupo_sanguineo: 'O+',
      estudiante_alergias: 'Ninguna conocida',
      direccion_habitacion: 'Sector Centro, Calle Bolívar #12',
      codigo_unico: `CR-${esc.toUpperCase()}-31456789-${ano}`
    } as unknown as SolicitudForm;

    mostrarModalCarnetEstudiantil(datosEstDemo, formDemo);
  };

  const abrirModeloNormas = (esc: 'sb' | 'lb' = 'sb') => {
    const ano = new Date().getFullYear();
    const datosEstDemo = {
      cedula_estudiante: '31.456.789',
      nombres_estudiante: 'Alejandro José',
      apellidos_estudiante: 'Pérez Silva',
      grado_actual: esc === 'sb' ? '4to Grado de Educación Primaria' : '1er Año de Educación Media General',
      codigo_escuela: esc,
      nombre_escuela: esc === 'sb' ? 'Unidad Educativa Santa Bárbara' : 'Unidad Educativa Libertador Bolívar',
      cedula_representante: '15.987.654',
      nombres_representante: 'Carlos Eduardo',
      apellidos_representante: 'Pérez Mendoza',
      telefono_representante: '0414-1234567',
      codigo_unico: `NORM-${esc.toUpperCase()}-31456789-${ano}`
    };

    const formDemo = {
      estudiante_nombres: 'Alejandro José',
      estudiante_apellidos: 'Pérez Silva',
      estudiante_cedula: '31.456.789',
      grado_solicitado: esc === 'sb' ? '4to Grado de Educación Primaria' : '1er Año de Educación Media General',
      representante_nombres: 'Carlos Eduardo',
      representante_apellidos: 'Pérez Mendoza',
      representante_cedula: '15.987.654',
      representante_telefono: '0414-1234567',
      codigo_unico: `NORM-${esc.toUpperCase()}-31456789-${ano}`
    } as unknown as SolicitudForm;

    manejarOpcionesNormasInternas(datosEstDemo, formDemo);
  };

  return (
    <div className="container-fluid py-4 animate__animated animate__fadeIn">

      {/* MIGAS DE PAN CHAMILO */}
      <ChamiloBreadcrumb
        category="Gestión Estudiantil"
        currentModule="Actualización de Datos"
      />

      {/* CUADRO DE AYUDA METODOLÓGICA CHAMILO */}
      <ChamiloHelpCallout
        id="ayuda_actualizacion_datos"
        title="Guía de Actualización de Ficha Integral y Carnetización"
        content="Este asistente interactivo por pasos le permite actualizar la ficha del estudiante en 10 etapas estructuradas con validación automática y guardado progresivo. Los cambios se reflejarán inmediatamente en la emisión de carnets y constancias oficiales."
        icon="bi-lightbulb-fill"
      />

      {/* ── 2. CABECERA INSTITUCIONAL CHAMILO TECH ── */}
      <div 
        className="tech-card overflow-hidden mb-4 animate__animated animate__fadeInDown" 
        style={{ 
          border: '2px solid #ddd6fe',
          borderTop: '6px solid #8b5cf6',
          background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 45%, #ede9fe 100%)',
          borderRadius: '26px'
        }}
      >
        <div className="p-4 p-md-5">
          <div className="row align-items-center g-4">
            
            {/* Contenedor Dual: Icono 3D Isométrico + Escudo Institucional */}
            <div className="col-12 col-md-auto text-center text-md-start">
              <div className="d-inline-flex align-items-center gap-3 p-2 bg-white rounded-4 shadow-sm" style={{ border: '2px solid #ddd6fe' }}>
                <div 
                  className="rounded-4 p-2 d-inline-flex align-items-center justify-content-center shadow-xs" 
                  style={{ 
                    width: '88px', 
                    height: '88px',
                    background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                    border: '1.5px solid #ddd6fe'
                  }}
                  title="Actualización de Datos Chamilo Tech"
                >
                  <IconoActualizacionDatos size={58} color="#8b5cf6" />
                </div>
                <div 
                  className="rounded-4 p-2 bg-light border d-inline-flex align-items-center justify-content-center shadow-xs" 
                  style={{ width: '88px', height: '88px' }}
                >
                  <img 
                    src={`/assets/img/logo_${(estudianteSeleccionado?.codigo_escuela || localStorage.getItem('sigae_escuela_codigo') || 'sb')}.png`} 
                    alt="Escudo Institucional" 
                    className="img-fluid"
                    style={{ maxHeight: '72px', objectFit: 'contain' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                  />
                </div>
              </div>
            </div>

            {/* Título y Métricas Clave */}
            <div className="col-12 col-md">
              <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                <span className="badge text-white fw-bold px-3 py-1.5 rounded-pill small shadow-xs" style={{ backgroundColor: '#8B5CF6' }}>
                  <i className="bi bi-file-earmark-person-fill me-1"></i>Ficha Integral & Carnetización
                </span>
                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs">
                  <i className="bi bi-people-fill text-primary me-1"></i><b>{misRepresentados.length}</b> Representados
                </span>
                {estudianteSeleccionado && (
                  <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs">
                    <i className="bi bi-mortarboard-fill text-success me-1"></i>Editando: <b>{estudianteSeleccionado.nombres_estudiante || ''} {estudianteSeleccionado.apellidos_estudiante || ''}</b>
                  </span>
                )}
                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs">
                  <span className="d-inline-block rounded-circle bg-success me-1.5 animate__animated animate__pulse animate__infinite" style={{ width: '8px', height: '8px' }}></span>
                  <span className="text-success fw-bold">Live</span> / Sincronizado
                </span>
              </div>

              <h1 className="fw-bolder mb-1.5 text-dark" style={{ fontSize: 'calc(1.5rem + 0.7vw)', letterSpacing: '-0.5px' }}>
                Actualización de Datos
              </h1>

              <p className="mb-0 text-muted small">
                Mantenga al día la información médica, biométrica, residencial y de contacto de sus representados para la emisión de carnets y constancias.
              </p>
            </div>

            {/* Acciones Rápidas */}
            {estudianteSeleccionado && (
              <div className="col-12 col-md-auto text-md-end text-center">
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.removeItem('sigae_act_draft_estudiante_id');
                    sessionStorage.removeItem('sigae_act_draft_step');
                    setEstudianteSeleccionado(null);
                  }}
                  className="btn btn-light rounded-pill px-3.5 py-2 fw-bold text-muted d-inline-flex align-items-center gap-1.5 hover-efecto shadow-xs"
                  style={{ fontSize: '0.82rem' }}
                >
                  <i className="bi bi-arrow-left"></i>
                  <span>Volver a Representados</span>
                </button>
              </div>
            )}

          </div>
        </div>


      </div>



      {esAdmin && !estudianteSeleccionado && (

        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-light">

          <form onSubmit={handleBuscarAdmin} className="row g-2 align-items-center">

            <div className="col-md-auto">

              <span className="fw-bold text-dark"><i className="bi bi-shield-lock-fill text-primary me-2"></i>Modo Administración:</span>

            </div>

            <div className="col-md-4 position-relative">
              <input 
                type="text" 
                className="form-control bg-white pe-5" 
                placeholder="Buscar representados por Cédula del Representante..."
                value={cedulaBusquedaAdmin}
                onChange={(e) => setCedulaBusquedaAdmin(e.target.value)}
              />
              {cedulaBusquedaAdmin && (
                <button 
                  type="button" 
                  onClick={() => setCedulaBusquedaAdmin('')} 
                  className="btn btn-sm text-muted position-absolute end-0 top-50 translate-middle-y me-3 border-0 bg-transparent" 
                  style={{ zIndex: 5 }}
                  title="Limpiar búsqueda"
                >
                  <i className="bi bi-x-circle-fill text-secondary"></i>
                </button>
              )}
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

            <div className="col-md-auto ms-md-auto mt-2 mt-md-0 d-flex flex-wrap gap-2">
              <div className="btn-group shadow-sm" role="group">
                <button 
                  type="button" 
                  className="btn btn-outline-success fw-bold d-flex align-items-center gap-1.5"
                  onClick={() => abrirModeloConstancia('sb')}
                  title="Ver y descargar modelo de Constancia de Inscripción (UE Santa Bárbara)"
                >
                  <i className="bi bi-file-earmark-check-fill"></i>
                  <span>Constancia SB</span>
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-primary fw-bold d-flex align-items-center gap-1.5"
                  onClick={() => abrirModeloConstancia('lb')}
                  title="Ver y descargar modelo de Constancia de Inscripción (UE Libertador Bolívar)"
                >
                  <i className="bi bi-file-earmark-check-fill"></i>
                  <span>Constancia LB</span>
                </button>
              </div>

              {(esDocumentoActivo('carnet', 'sb') || esDocumentoActivo('carnet', 'lb')) && (
                <div className="btn-group shadow-sm" role="group">
                  {esDocumentoActivo('carnet', 'sb') && (
                    <button 
                      type="button" 
                      className="btn btn-warning text-dark fw-bold d-flex align-items-center gap-1.5"
                      onClick={() => abrirModeloCarnet('sb')}
                      title="Ver y descargar modelo de Carnet Estudiantil (UE Santa Bárbara)"
                    >
                      <i className="bi bi-person-badge-fill"></i>
                      <span>Carnet SB</span>
                    </button>
                  )}
                  {esDocumentoActivo('carnet', 'lb') && (
                    <button 
                      type="button" 
                      className="btn btn-dark text-warning fw-bold d-flex align-items-center gap-1.5"
                      onClick={() => abrirModeloCarnet('lb')}
                      title="Ver y descargar modelo de Carnet Estudiantil (UE Libertador Bolívar)"
                    >
                      <i className="bi bi-person-badge-fill"></i>
                      <span>Carnet LB</span>
                    </button>
                  )}
                </div>
              )}

              <div className="btn-group shadow-sm" role="group">
                <button 
                  type="button" 
                  className="btn btn-outline-danger fw-bold d-flex align-items-center gap-1.5"
                  onClick={() => abrirModeloNormas('sb')}
                  title="Ver y descargar modelo de Normativa Interna (UE Santa Bárbara)"
                >
                  <i className="bi bi-file-earmark-ruled-fill"></i>
                  <span>Normativa SB</span>
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger text-white fw-bold d-flex align-items-center gap-1.5"
                  onClick={() => abrirModeloNormas('lb')}
                  title="Ver y descargar modelo de Normativa Interna (UE Libertador Bolívar)"
                >
                  <i className="bi bi-file-earmark-ruled-fill"></i>
                  <span>Normativa LB</span>
                </button>
              </div>
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
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
            <h4 className="fw-bolder text-dark m-0 d-flex align-items-center">
              <i className="bi bi-people-fill text-primary me-3 fs-3"></i>
              Mis Representados
              <span className="badge bg-primary rounded-pill ms-3 fs-6 px-3">{misRepresentados.length}</span>
            </h4>
            {esAdmin && (
              <button
                type="button"
                className={`btn btn-sm ${carnetActivoGlobal ? 'btn-outline-success' : 'btn-outline-danger'} rounded-pill px-3 fw-bold shadow-sm d-flex align-items-center gap-1.5`}
                onClick={handleToggleCarnetGlobal}
                title="Configuración de Administrador: Activar o desactivar la emisión de carnets estudiantiles en el sistema"
              >
                <i className={`bi ${carnetActivoGlobal ? 'bi-toggle-on fs-5 text-success' : 'bi-toggle-off fs-5 text-danger'}`}></i>
                <span>{carnetActivoGlobal ? 'Carnets: Habilitados' : 'Carnets: Desactivados'}</span>
              </button>
            )}
          </div>



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
                const d = est.datos_actualizados || {};
                const infoAdm = obtenerInfoAdmision(est);
                const fechaUltima = est.fecha_ultima_actualizacion ? new Date(est.fecha_ultima_actualizacion) : null;
                let diasTranscurridos = 0;

                // Validación de completitud de campos requeridos
                const repOk = Boolean((d.representante_nombres || est.nombres_representante) && (d.representante_cedula || est.cedula_representante) && d.representante_telefono && d.representante_email);
                const estOk = Boolean((d.estudiante_nombres || est.nombres_estudiante) && (d.estudiante_apellidos || est.apellidos_estudiante) && d.estudiante_fecha_nacimiento && d.estudiante_sexo);
                const dirOk = Boolean(d.estado_habitacion && d.direccion_habitacion);
                const saludOk = Boolean(d.estudiante_grupo_sanguineo);
                const madreOk = Boolean(d.madre_nombres && d.madre_cedula);
                const requierePadre = d.estudiante_reconocido_por_padre !== 'No';
                const padreOk = !requierePadre || Boolean(d.padre_nombres && d.padre_cedula);

                const estaTotalmenteCompletado = repOk && estOk && dirOk && saludOk && madreOk && padreOk;

                // Para nuevos ingresos es obligatorio haber finalizado y guardado la Ficha Integral (ficha_completada === true)
                // Para estudiantes regulares antiguos se respeta si ya poseían fecha_ultima_actualizacion válida y datos completos
                const tieneFichaCompletada = Boolean(
                  d.ficha_completada === true || 
                  (!infoAdm.esNuevoIngreso && fechaUltima && estaTotalmenteCompletado)
                );

                let estadoFicha: 'en_proceso' | 'actualizado' | 'desactualizado' = 'en_proceso';

                if (tieneFichaCompletada && fechaUltima && estaTotalmenteCompletado) {
                  const diffTime = Math.abs(new Date().getTime() - fechaUltima.getTime());
                  diasTranscurridos = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                  if (diasTranscurridos > 90) {
                    estadoFicha = 'desactualizado';
                  } else {
                    estadoFicha = 'actualizado';
                  }
                } else {
                  estadoFicha = 'en_proceso';
                }

                const escEst = resolverEscuelaEstudiante(est, d);
                const datosFormEst = d && Object.keys(d).length > 0 ? d : est;

                return (
                  <div className="col-12 col-md-6 col-lg-4" key={est.id}>
                    <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative hover-shadow transition-all bg-white d-flex flex-column justify-content-between">
                      {/* Header de la tarjeta con Badge de Estado */}
                      <div>
                        <div className="p-4 pb-0 d-flex justify-content-between align-items-start">
                          <div>
                            <div className="d-flex align-items-center flex-wrap gap-1.5 mb-2">
                              <span className="badge bg-light text-dark border px-3 py-1.5 rounded-pill fw-bold">
                                {est.grado_actual || d.grado_solicitado || 'Sin Grado'}
                              </span>
                              {infoAdm.esNuevoIngreso && (
                                <span 
                                  className={`badge ${infoAdm.estaFormalizado ? 'bg-success bg-opacity-10 text-success border border-success' : 'bg-warning bg-opacity-15 text-dark border border-warning'} px-2.5 py-1.5 rounded-pill fw-bold small`}
                                  title={infoAdm.estaFormalizado ? 'Inscripción formalizada físicamente por Control de Estudios' : 'Aspirante con cupo asignado pendiente por formalización física en el plantel'}
                                >
                                  <i className={`bi ${infoAdm.estaFormalizado ? 'bi-patch-check-fill text-success' : 'bi-hourglass-split text-warning'} me-1`}></i>
                                  {infoAdm.estaFormalizado ? 'Nuevo Ingreso • Formalizado' : 'Nuevo Ingreso • Pendiente'}
                                </span>
                              )}
                            </div>
                            <h5 className="fw-bolder text-dark mb-1">
                              {est.nombres_estudiante} {est.apellidos_estudiante}
                            </h5>
                            <p className="text-muted small mb-0 font-monospace">
                              C.I / C.E: {est.cedula_estudiante || 'Sin Cédula'}
                            </p>
                          </div>
                          <div>
                            {estadoFicha === 'actualizado' && (
                              <span className="badge bg-success bg-opacity-10 text-success border border-success px-3 py-2 rounded-pill fw-bold">
                                <i className="bi bi-check-circle-fill me-1"></i>Actualizado
                              </span>
                            )}
                            {estadoFicha === 'en_proceso' && (
                              <span className="badge bg-warning bg-opacity-10 text-warning border border-warning px-3 py-2 rounded-pill fw-bold text-dark">
                                <i className="bi bi-clock-history me-1"></i>En Proceso
                              </span>
                            )}
                            {estadoFicha === 'desactualizado' && (
                              <span className="badge bg-danger bg-opacity-10 text-danger border border-danger px-3 py-2 rounded-pill fw-bold">
                                <i className="bi bi-exclamation-triangle-fill me-1"></i>Desactualizado
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Contenido / Detalles */}
                        <div className="p-4 pt-3">
                          <div className="p-3 bg-light rounded-3 small">
                            <div className="d-flex justify-content-between mb-2">
                              <span className="text-muted">Representante:</span>
                              <span className="fw-bold text-dark">{est.nombres_representante}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <span className="text-muted">Plantel Asignado:</span>
                              <span className="fw-bold text-dark">
                                {escEst === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar'}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Última Actualización:</span>
                              <span className="fw-bold text-dark">
                                {fechaUltima ? fechaUltima.toLocaleDateString('es-VE') : 'Nunca'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer de Acciones */}
                      <div className="p-4 pt-0">
                        <div className="d-flex flex-column gap-2">
                          <button
                            className="btn btn-primary w-100 py-2.5 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                            onClick={() => abrirFichaEstudiante(est, 1)}
                          >
                            <i className="bi bi-pencil-square me-2 fs-5"></i>
                            {estadoFicha === 'actualizado' ? 'Editar Ficha Integral' : 'Completar Ficha Integral'}
                          </button>

                          {estadoFicha === 'actualizado' && (
                            <>
                              {/* Carta de Aceptación Oficial para Nuevos Ingresos */}
                              {infoAdm.esNuevoIngreso && (
                                <button
                                  className="btn btn-outline-primary w-100 py-2 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center hover-efecto"
                                  onClick={() => handleDescargarCartaAceptacion(est, datosFormEst)}
                                  title="Descargar Carta de Aceptación Oficial de 3 páginas con firmas y código QR"
                                >
                                  <i className="bi bi-file-earmark-text-fill me-2 fs-5"></i>
                                  Descargar Carta de Aceptación (PDF)
                                </button>
                              )}

                              {esDocumentoActivo('carnet', escEst) && (
                                <button
                                  className="btn btn-warning w-100 py-2 fw-bold text-dark rounded-3 shadow-sm d-flex align-items-center justify-content-center hover-efecto"
                                  onClick={() => mostrarModalCarnetEstudiantil(est, datosFormEst)}
                                  title="Descargar Carnet Estudiantil en PDF o Imagen"
                                >
                                  <i className="bi bi-person-badge-fill me-2 fs-5 text-dark"></i>
                                  Descargar Carnet Estudiantil
                                </button>
                              )}

                              {(esDocumentoActivo('resumen', escEst) || esAdmin) && (
                                <button
                                  className="btn btn-outline-success w-100 py-2 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                                  onClick={() => manejarOpcionesResumen(est, datosFormEst)}
                                >
                                  <i className="bi bi-file-earmark-pdf-fill me-2 fs-5"></i>
                                  Descargar Resumen (Carta)
                                </button>
                              )}

                              {/* Constancia de Inscripción (Validación requerida para nuevos ingresos) */}
                              {(esDocumentoActivo('inscripcion', escEst) || esAdmin) && (
                                infoAdm.puedeDescargarConstancia || esAdmin ? (
                                  <button
                                    className="btn btn-success w-100 py-2 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                                    onClick={() => manejarOpcionesConstancia(est, datosFormEst, 'inscripcion')}
                                  >
                                    <i className="bi bi-file-earmark-check-fill me-2 fs-5"></i>
                                    Descargar Constancia de Inscripción
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-secondary bg-opacity-75 w-100 py-2 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center text-white"
                                    onClick={() => mostrarAvisoBloqueoNuevoIngreso(est, datosFormEst, 'inscripcion')}
                                    title="Pendiente: Requiere consignar recaudos físicos en la escuela para formalizar la matrícula"
                                  >
                                    <i className="bi bi-lock-fill me-2 fs-5 text-warning"></i>
                                    Constancia de Inscripción (Pendiente Validación)
                                  </button>
                                )
                              )}

                              {/* Normativa Interna Institucional */}
                              {(esDocumentoActivo('normas', escEst) || esAdmin) && (
                                <button
                                  className="btn btn-outline-danger w-100 py-2 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center hover-efecto"
                                  onClick={() => manejarOpcionesNormasInternas(est, datosFormEst)}
                                  title="Descargar Normativa Interna Oficial (2 Páginas con firmas y QR)"
                                >
                                  <i className="bi bi-file-earmark-ruled-fill me-2 fs-5 text-danger"></i>
                                  Descargar Normativa Interna
                                </button>
                              )}

                              {/* Constancia de Estudio Regular */}
                              {(esDocumentoActivo('estudio', escEst) || esAdmin) && (
                                infoAdm.puedeDescargarConstancia || esAdmin ? (
                                  <button
                                    className="btn btn-primary w-100 py-2 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                                    onClick={() => manejarOpcionesConstancia(est, datosFormEst, 'estudio')}
                                  >
                                    <i className="bi bi-mortarboard-fill me-2 fs-5"></i>
                                    Descargar Constancia de Estudio
                                  </button>
                                ) : (
                                  <button
                                    className="btn btn-secondary bg-opacity-75 w-100 py-2 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center text-white"
                                    onClick={() => mostrarAvisoBloqueoNuevoIngreso(est, datosFormEst, 'estudio')}
                                    title="Bloqueado: La constancia de estudio depende de la formalización presencial por parte de la escuela"
                                  >
                                    <i className="bi bi-lock-fill me-2 fs-5 text-warning"></i>
                                    Constancia de Estudio (No Disponible • Requiere Formalización)
                                  </button>
                                )
                              )}

                              {/* Constancia de Buena Conducta (Si está activa) */}
                              {esDocumentoActivo('conducta', escEst) && (
                                <button
                                  className="btn btn-info text-dark w-100 py-2 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                                  onClick={() => manejarOpcionesConstancia(est, datosFormEst, 'conducta')}
                                >
                                  <i className="bi bi-award-fill me-2 fs-5"></i>
                                  Descargar Constancia de Buena Conducta
                                </button>
                              )}
                            </>
                          )}

                          {/* Aviso cuando aún no ha terminado de actualizar la Ficha Integral */}
                          {estadoFicha !== 'actualizado' && (
                            <div className="alert alert-warning border-0 rounded-3 p-3 mb-0 text-start bg-warning bg-opacity-10 border-start border-warning border-4">
                              <div className="d-flex align-items-center gap-2 mb-1 fw-bold text-dark small">
                                <i className="bi bi-exclamation-triangle-fill text-warning fs-5"></i>
                                <span>Ficha Integral Pendiente de Finalizar</span>
                              </div>
                              <p className="text-muted small mb-0" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                                Aún no ha completado el registro integral de los 10 pasos. Haga clic en <b>"Completar Ficha Integral"</b> y presione <b>"Guardar y Finalizar"</b> en el paso 10 para generar y desbloquear el <b>Resumen de una sola hoja</b> y sus documentos escolares.
                              </p>
                            </div>
                          )}
                        </div>
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
