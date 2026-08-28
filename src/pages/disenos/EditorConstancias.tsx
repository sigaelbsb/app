import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { usePermisos } from '../../hooks/usePermisos';
import { auditar } from '../../lib/audit';
import { resolverEscuelaEstudiante } from '../../utils/firmasSeguras';
import { 
  obtenerPlantillaCarnet, 
  guardarPlantillaCarnet, 
  prepararDatosCarnet, 
  renderCarnetContainerHTML,
  descargarCarnetPDF,
  esCarnetActivo,
  toggleCarnetActivo
} from '../../utils/generadorCarnet';
import type { DatosCarnetProcesados } from '../../utils/generadorCarnet';

declare const Swal: any;
declare const html2pdf: any;

export interface PlantillaConstancia {
  id: string;
  codigo_tipo: string; // 'inscripcion', 'estudio', 'conducta', 'retiro', 'personalizada'
  nombre: string;
  id_escuela: string; // 'sb', 'lb', 'todas'
  titulo_documento: string;
  
  // Encabezado y Membrete
  mostrar_bandera_venezuela: boolean;
  logo_escuela_url: string;
  membrete_linea1: string;
  membrete_linea2: string;
  membrete_nombre_escuela: string;
  membrete_ubicacion: string;
  
  // Redacción de Párrafos
  parrafo_certificacion: string;
  parrafo_representante: string;
  parrafo_expedicion: string;
  ciudad_expedicion: string;
  
  // Firmante / Dirección
  titulo_director: string; // Profa. / Prof.
  nombre_director: string; // Elika Dayana Chaviel Rondón / José Vicente Millán Montaño
  cedula_director: string; // 16.808.608 / 17.780.095
  cargo_director: string;  // Directora de la Unidad Educativa Santa Bárbara
  cargo_generico: string;  // Directora / Director
  firma_digital_url: string; // /assets/img/firma_director_sb.png
  mostrar_firma_digital: boolean;
  
  // Sello y QR
  sello_humedo_url?: string;
  mostrar_sello_humedo: boolean;
  mostrar_codigo_qr: boolean;
  logo_mppe_url: string;
  
  // Estilos
  fuente_familia: string;
  tamano_fuente: number;
  interlineado: number;
  
  created_at?: string;
  updated_at?: string;
}

const PLANTILLAS_PREDETERMINADAS: PlantillaConstancia[] = [
  {
    id: 'CONST-INSC-SB',
    codigo_tipo: 'inscripcion',
    nombre: 'Constancia de Inscripción Oficial (U.E. Santa Bárbara)',
    id_escuela: 'sb',
    titulo_documento: 'Constancia de Inscripción',
    mostrar_bandera_venezuela: true,
    logo_escuela_url: '/assets/img/logo_sb.png',
    membrete_linea1: 'República Bolivariana de Venezuela',
    membrete_linea2: 'Ministerio del Poder Popular para la Educación',
    membrete_nombre_escuela: 'Unidad Educativa Santa Bárbara',
    membrete_ubicacion: 'El Tejero, estado Monagas',
    parrafo_certificacion: `Quien suscribe, <b>{titulo_director} {nombre_director}</b>, {cargo_generico} de la <b>{nombre_escuela}</b>, que funciona en <b>{ubicacion_escuela}</b>, por medio de la presente hace constar que el/la estudiante: <b>{nombre_estudiante}</b>, natural de <b>{lugar_nacimiento}</b>, estado <b>{estado_nacimiento}</b>, titular de la {tipo_cedula} N.° <b>{cedula_estudiante}</b>, fue inscrito/a para cursar el <b>{grado_actual}</b> de <b>{nivel_educativo}</b> en este instituto durante el año escolar <b>{periodo_escolar}</b>.`,
    parrafo_representante: `Asimismo, se deja constancia que el representante legal del/de la estudiante es <b>{nombre_representante}</b>, titular de la cédula de identidad N.° <b>{cedula_representante}</b>, quien ha cumplido con los requisitos establecidos para la formalización de la inscripción.`,
    parrafo_expedicion: `Constancia que se expide para los efectos y fines consiguientes en <b>{ciudad_expedicion}</b>, a los {dia_expedicion} días del mes de {mes_expedicion} del año {ano_expedicion}.`,
    ciudad_expedicion: 'El Tejero',
    titulo_director: 'Profa.',
    nombre_director: 'Elika Dayana Chaviel Rondón',
    cedula_director: '16.808.608',
    cargo_director: 'Directora de la Unidad Educativa Santa Bárbara',
    cargo_generico: 'Directora',
    firma_digital_url: '/assets/img/firma_director_sb.png',
    mostrar_firma_digital: true,
    sello_humedo_url: '',
    mostrar_sello_humedo: false,
    mostrar_codigo_qr: true,
    logo_mppe_url: '/assets/img/logoMPPE.png',
    fuente_familia: 'Arial, Helvetica, sans-serif',
    tamano_fuente: 14.5,
    interlineado: 2.15
  },
  {
    id: 'CONST-INSC-LB',
    codigo_tipo: 'inscripcion',
    nombre: 'Constancia de Inscripción Oficial (U.E. Libertador Bolívar)',
    id_escuela: 'lb',
    titulo_documento: 'Constancia de Inscripción',
    mostrar_bandera_venezuela: true,
    logo_escuela_url: '/assets/img/logo_lb.png',
    membrete_linea1: 'República Bolivariana de Venezuela',
    membrete_linea2: 'Ministerio del Poder Popular para la Educación',
    membrete_nombre_escuela: 'Unidad Educativa Libertador Bolívar',
    membrete_ubicacion: 'Miraflores, estado Monagas',
    parrafo_certificacion: `Quien suscribe, <b>{titulo_director} {nombre_director}</b>, {cargo_generico} de la <b>{nombre_escuela}</b>, que funciona en <b>{ubicacion_escuela}</b>, por medio de la presente hace constar que el/la estudiante: <b>{nombre_estudiante}</b>, natural de <b>{lugar_nacimiento}</b>, estado <b>{estado_nacimiento}</b>, titular de la {tipo_cedula} N.° <b>{cedula_estudiante}</b>, fue inscrito/a para cursar el <b>{grado_actual}</b> de <b>{nivel_educativo}</b> en este instituto durante el año escolar <b>{periodo_escolar}</b>.`,
    parrafo_representante: `Asimismo, se deja constancia que el representante legal del/de la estudiante es <b>{nombre_representante}</b>, titular de la cédula de identidad N.° <b>{cedula_representante}</b>, quien ha cumplido con los requisitos establecidos para la formalización de la inscripción.`,
    parrafo_expedicion: `Constancia que se expide para los efectos y fines consiguientes en <b>{ciudad_expedicion}</b>, a los {dia_expedicion} días del mes de {mes_expedicion} del año {ano_expedicion}.`,
    ciudad_expedicion: 'Miraflores',
    titulo_director: 'Prof.',
    nombre_director: 'José Vicente Millán Montaño',
    cedula_director: '17.780.095',
    cargo_director: 'Director de la Unidad Educativa Libertador Bolívar',
    cargo_generico: 'Director',
    firma_digital_url: '/assets/img/firma_director_lb.png',
    mostrar_firma_digital: true,
    sello_humedo_url: '',
    mostrar_sello_humedo: false,
    mostrar_codigo_qr: true,
    logo_mppe_url: '/assets/img/logoMPPE.png',
    fuente_familia: 'Arial, Helvetica, sans-serif',
    tamano_fuente: 14.5,
    interlineado: 2.15
  },
  {
    id: 'CONST-ESTUDIO-GEN',
    codigo_tipo: 'estudio',
    nombre: 'Constancia de Estudio Regular',
    id_escuela: 'todas',
    titulo_documento: 'Constancia de Estudio',
    mostrar_bandera_venezuela: true,
    logo_escuela_url: '/assets/img/logo_sb.png',
    membrete_linea1: 'República Bolivariana de Venezuela',
    membrete_linea2: 'Ministerio del Poder Popular para la Educación',
    membrete_nombre_escuela: '{nombre_escuela}',
    membrete_ubicacion: '{ubicacion_escuela}',
    parrafo_certificacion: `Quien suscribe, la Dirección de la <b>{nombre_escuela}</b>, hace constar por medio de la presente que el/la estudiante: <b>{nombre_estudiante}</b>, titular de la {tipo_cedula} N.° <b>{cedula_estudiante}</b>, es estudiante regular y se encuentra cursando activamente el <b>{grado_actual}</b> de <b>{nivel_educativo}</b> durante el año escolar <b>{periodo_escolar}</b>.`,
    parrafo_representante: `Se deja constancia de su intachable rendimiento escolar y asistencia en las actividades académicas programadas por la institución.`,
    parrafo_expedicion: `Constancia que se expide a solicitud de la parte interesada a los fines consiguientes en <b>{ciudad_expedicion}</b>, a los {dia_expedicion} días del mes de {mes_expedicion} del año {ano_expedicion}.`,
    ciudad_expedicion: 'El Tejero',
    titulo_director: 'Profa.',
    nombre_director: 'Elika Dayana Chaviel Rondón',
    cedula_director: '16.808.608',
    cargo_director: 'Directora General',
    cargo_generico: 'Directora',
    firma_digital_url: '/assets/img/firma_director_sb.png',
    mostrar_firma_digital: true,
    sello_humedo_url: '',
    mostrar_sello_humedo: false,
    mostrar_codigo_qr: true,
    logo_mppe_url: '/assets/img/logoMPPE.png',
    fuente_familia: 'Arial, Helvetica, sans-serif',
    tamano_fuente: 14.5,
    interlineado: 2.15
  },
  {
    id: 'CONST-CONDUCTA-GEN',
    codigo_tipo: 'conducta',
    nombre: 'Constancia de Buena Conducta',
    id_escuela: 'todas',
    titulo_documento: 'Constancia de Buena Conducta',
    mostrar_bandera_venezuela: true,
    logo_escuela_url: '/assets/img/logo_lb.png',
    membrete_linea1: 'República Bolivariana de Venezuela',
    membrete_linea2: 'Ministerio del Poder Popular para la Educación',
    membrete_nombre_escuela: '{nombre_escuela}',
    membrete_ubicacion: '{ubicacion_escuela}',
    parrafo_certificacion: `Quien suscribe, la Dirección de la <b>{nombre_escuela}</b>, hace constar por medio de la presente que el/la estudiante: <b>{nombre_estudiante}</b>, titular de la {tipo_cedula} N.° <b>{cedula_estudiante}</b>, quien cursa el <b>{grado_actual}</b> de <b>{nivel_educativo}</b>, ha observado durante su permanencia en nuestra institución una <b>EXCELENTE CONDUCTA</b>, demostrando respeto por las normas de convivencia y valores ciudadanos.`,
    parrafo_representante: `Asimismo, se deja constancia de su intachable colaboración en las actividades comunitarias y formativas de la institución.`,
    parrafo_expedicion: `Constancia que se expide a solicitud de la parte interesada en <b>{ciudad_expedicion}</b>, a los {dia_expedicion} días del mes de {mes_expedicion} del año {ano_expedicion}.`,
    ciudad_expedicion: 'Miraflores',
    titulo_director: 'Prof.',
    nombre_director: 'José Vicente Millán Montaño',
    cedula_director: '17.780.095',
    cargo_director: 'Director General',
    cargo_generico: 'Director',
    firma_digital_url: '/assets/img/firma_director_lb.png',
    mostrar_firma_digital: true,
    sello_humedo_url: '',
    mostrar_sello_humedo: false,
    mostrar_codigo_qr: true,
    logo_mppe_url: '/assets/img/logoMPPE.png',
    fuente_familia: 'Arial, Helvetica, sans-serif',
    tamano_fuente: 14.5,
    interlineado: 2.15
  },
  {
    id: 'CARNET-ESTUDIANTIL-SB',
    codigo_tipo: 'carnet',
    nombre: 'Carnet Estudiantil Oficial (U.E. Santa Bárbara)',
    id_escuela: 'sb',
    titulo_documento: 'Carnet Estudiantil',
    mostrar_bandera_venezuela: true,
    logo_escuela_url: '/assets/img/logo_sb.png',
    membrete_linea1: 'República Bolivariana de Venezuela',
    membrete_linea2: 'Ministerio del Poder Popular para la Educación',
    membrete_nombre_escuela: 'Unidad Educativa Santa Bárbara',
    membrete_ubicacion: 'El Tejero, estado Monagas',
    parrafo_certificacion: 'Este carnet es personal e intransferible. Acredita a <b>{nombre_estudiante}</b> (C.I. {cedula_estudiante}) como estudiante regular de la <b>{nombre_escuela}</b> para el Año Escolar <b>{periodo_escolar}</b>.',
    parrafo_representante: 'En caso de emergencia o extravío, favor contactar al representante legal <b>{nombre_representante}</b> al teléfono <b>{telefono_representante}</b>.',
    parrafo_expedicion: 'Válido durante el Año Escolar {periodo_escolar}.',
    ciudad_expedicion: 'El Tejero',
    titulo_director: 'Profa.',
    nombre_director: 'Elika Dayana Chaviel Rondón',
    cedula_director: '16.808.608',
    cargo_director: 'Directora de la Unidad Educativa Santa Bárbara',
    cargo_generico: 'Directora',
    firma_digital_url: '/assets/img/firma_director_sb.png',
    mostrar_firma_digital: true,
    sello_humedo_url: '',
    mostrar_sello_humedo: false,
    mostrar_codigo_qr: true,
    logo_mppe_url: '/assets/img/logoMPPE.png',
    fuente_familia: 'Arial, Helvetica, sans-serif',
    tamano_fuente: 12,
    interlineado: 1.5
  },
  {
    id: 'CARNET-ESTUDIANTIL-LB',
    codigo_tipo: 'carnet',
    nombre: 'Carnet Estudiantil Oficial (U.E. Libertador Bolívar)',
    id_escuela: 'lb',
    titulo_documento: 'Carnet Estudiantil',
    mostrar_bandera_venezuela: true,
    logo_escuela_url: '/assets/img/logo_lb.png',
    membrete_linea1: 'República Bolivariana de Venezuela',
    membrete_linea2: 'Ministerio del Poder Popular para la Educación',
    membrete_nombre_escuela: 'Unidad Educativa Libertador Bolívar',
    membrete_ubicacion: 'Miraflores, estado Monagas',
    parrafo_certificacion: 'Este carnet es personal e intransferible. Acredita a <b>{nombre_estudiante}</b> (C.I. {cedula_estudiante}) como estudiante regular de la <b>{nombre_escuela}</b> para el Año Escolar <b>{periodo_escolar}</b>.',
    parrafo_representante: 'En caso de emergencia o extravío, favor contactar al representante legal <b>{nombre_representante}</b> al teléfono <b>{telefono_representante}</b>.',
    parrafo_expedicion: 'Válido durante el Año Escolar {periodo_escolar}.',
    ciudad_expedicion: 'Miraflores',
    titulo_director: 'Prof.',
    nombre_director: 'José Vicente Millán Montaño',
    cedula_director: '17.780.095',
    cargo_director: 'Director de la Unidad Educativa Libertador Bolívar',
    cargo_generico: 'Director',
    firma_digital_url: '/assets/img/firma_director_lb.png',
    mostrar_firma_digital: true,
    sello_humedo_url: '',
    mostrar_sello_humedo: false,
    mostrar_codigo_qr: true,
    logo_mppe_url: '/assets/img/logoMPPE.png',
    fuente_familia: 'Arial, Helvetica, sans-serif',
    tamano_fuente: 12,
    interlineado: 1.5
  }
];

export const EditorConstancias: React.FC = () => {
  usePermisos();
  const [plantillas, setPlantillas] = useState<PlantillaConstancia[]>(PLANTILLAS_PREDETERMINADAS);
  const [plantillaActivaId, setPlantillaActivaId] = useState<string>(PLANTILLAS_PREDETERMINADAS[0].id);
  const [plantillaEdicion, setPlantillaEdicion] = useState<PlantillaConstancia>(PLANTILLAS_PREDETERMINADAS[0]);
  
  // Categoría de filtro de plantillas
  const [filtroTipoPlantilla, setFiltroTipoPlantilla] = useState<'TODAS' | 'CONSTANCIAS' | 'CARNETS'>('TODAS');

  // Pestañas del Editor
  const [tabEditor, setTabEditor] = useState<'grafica' | 'redaccion' | 'firmas' | 'seguridad'>('firmas');
  
  // Datos para el Probador en Vivo
  const [estudiantesMuestra, setEstudiantesMuestra] = useState<any[]>([]);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<any | null>(null);
  const [searchEstudianteMuestra, setSearchEstudianteMuestra] = useState<string>('');
  
  // Estado para el Carnet en vivo
  const [datosCarnetPrueba, setDatosCarnetPrueba] = useState<DatosCarnetProcesados | null>(null);
  const [carnetActivo, setCarnetActivoState] = useState<boolean>(esCarnetActivo());

  useEffect(() => {
    setCarnetActivoState(esCarnetActivo(plantillaEdicion?.id_escuela));
  }, [plantillaEdicion?.id_escuela]);

  const handleToggleCarnetEstado = async () => {
    const escTarget = plantillaEdicion?.codigo_tipo === 'carnet' ? (plantillaEdicion.id_escuela || 'global') : 'global';
    const nuevo = await toggleCarnetActivo(escTarget);
    setCarnetActivoState(nuevo);
    if (Swal) {
      const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2500 });
      Toast.fire({
        icon: nuevo ? 'success' : 'warning',
        title: `Emisión de Carnets ${nuevo ? 'ACTIVADA' : 'DESACTIVADA'} para el sistema`
      });
    }
  };

  // Estados de carga y guardado
  const [guardando, setGuardando] = useState<boolean>(false);
  const [zoomPreview, setZoomPreview] = useState<number>(100);

  const previewRef = useRef<HTMLDivElement>(null);

  // ──────────────────────────────────────────────────────────
  // CARGA DE PLANTILLAS Y ESTUDIANTES REALES
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    cargarDatos();
  }, []);

  // Efecto para actualizar el Carnet en tiempo real cuando se edita
  useEffect(() => {
    if (plantillaEdicion.codigo_tipo === 'carnet') {
      const cargarCarnet = async () => {
        try {
          const escKey = (plantillaEdicion.id_escuela === 'todas' ? 'sb' : plantillaEdicion.id_escuela) as 'sb' | 'lb';
          const cfg = obtenerPlantillaCarnet(escKey);
          // Sobrescribir con lo que se está editando en vivo
          cfg.titulo_carnet = plantillaEdicion.titulo_documento || cfg.titulo_carnet;
          cfg.subtitulo_carnet = plantillaEdicion.membrete_nombre_escuela || cfg.subtitulo_carnet;
          cfg.mostrar_bandera = plantillaEdicion.mostrar_bandera_venezuela;
          cfg.mostrar_firma_director = plantillaEdicion.mostrar_firma_digital;
          cfg.mostrar_qr = plantillaEdicion.mostrar_codigo_qr;
          if (plantillaEdicion.parrafo_certificacion) cfg.leyenda_reverso = plantillaEdicion.parrafo_certificacion;
          if (plantillaEdicion.parrafo_expedicion) cfg.texto_validez = plantillaEdicion.parrafo_expedicion;

          const d = await prepararDatosCarnet(estudianteSeleccionado, {
            id_escuela: escKey,
            codigo_escuela: escKey,
            nombre_escuela: plantillaEdicion.membrete_nombre_escuela
          });
          d.config = cfg;
          d.nombreDirector = `${plantillaEdicion.titulo_director} ${plantillaEdicion.nombre_director}`;
          d.cargoDirector = plantillaEdicion.cargo_director;
          if (plantillaEdicion.firma_digital_url) d.base64FirmaDirector = plantillaEdicion.firma_digital_url;
          setDatosCarnetPrueba(d);
        } catch (e) {
          console.warn('Error preparando carnet en vivo:', e);
        }
      };
      cargarCarnet();
    }
  }, [plantillaEdicion, estudianteSeleccionado]);

  const cargarDatos = async () => {
    try {
      const guardadas = localStorage.getItem('sigae_plantillas_constancias');
      let plantillasFinales = PLANTILLAS_PREDETERMINADAS;
      if (guardadas) {
        try {
          const parsed = JSON.parse(guardadas);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // MERGE automático de plantillas nuevas (Carnets y Constancias)
            const idsExistentes = new Set(parsed.map((p: any) => p.id));
            const faltantes = PLANTILLAS_PREDETERMINADAS.filter(p => !idsExistentes.has(p.id));
            plantillasFinales = [...parsed, ...faltantes];
          }
        } catch (err) {
          console.error("Error parseando plantillas locales:", err);
        }
      }

      setPlantillas(plantillasFinales);
      setPlantillaActivaId(plantillasFinales[0].id);
      setPlantillaEdicion(plantillasFinales[0]);
      localStorage.setItem('sigae_plantillas_constancias', JSON.stringify(plantillasFinales));

      let allEsts: any[] = [];
      let page = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('estudiantes_vinculaciones')
          .select('*')
          .eq('estado', 'Activo')
          .range(page * limit, (page + 1) * limit - 1);

        if (error) break;
        if (data && data.length > 0) {
          allEsts = [...allEsts, ...data];
          if (data.length < limit) hasMore = false;
          else page++;
        } else {
          hasMore = false;
        }
      }

      setEstudiantesMuestra(allEsts);
      if (allEsts.length > 0) {
        setEstudianteSeleccionado(allEsts[0]);
      }
    } catch (e: any) {
      console.error("Error al cargar datos del editor:", e);
    }
  };

  const seleccionarPlantilla = (id: string) => {
    const pl = plantillas.find(p => p.id === id);
    if (pl) {
      setPlantillaActivaId(id);
      setPlantillaEdicion(JSON.parse(JSON.stringify(pl)));
    }
  };

  const handleCrearNuevaPlantilla = () => {
    if (!Swal) return;
    Swal.fire({
      title: 'Crear Nueva Plantilla',
      html: `
        <div class="text-start">
          <label class="small fw-bold text-muted mb-1">Tipo de Formato:</label>
          <select id="swal-new-tipo" class="swal2-input m-0 mb-3 w-100">
            <option value="inscripcion">Constancia de Inscripción</option>
            <option value="estudio">Constancia de Estudio</option>
            <option value="carnet">Carnet Estudiantil</option>
            <option value="conducta">Constancia de Buena Conducta</option>
            <option value="personalizada">Formato Personalizado</option>
          </select>

          <label class="small fw-bold text-muted mb-1">Nombre de la Plantilla:</label>
          <input id="swal-new-nom" class="swal2-input m-0 mb-3 w-100" placeholder="Ej: Carnet Escolar 2026..." />
          
          <label class="small fw-bold text-muted mb-1">Título Oficial del Documento:</label>
          <input id="swal-new-tit" class="swal2-input m-0 mb-3 w-100" placeholder="Ej: CARNET ESTUDIANTIL" />
          
          <label class="small fw-bold text-muted mb-1">Plantel / Escuela:</label>
          <select id="swal-new-esc" class="swal2-input m-0 w-100">
            <option value="todas">Ambas Escuelas (Global)</option>
            <option value="sb">U.E. Santa Bárbara</option>
            <option value="lb">U.E. Libertador Bolívar</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Crear Plantilla',
      confirmButtonColor: '#00BCD4',
      preConfirm: () => {
        const tipo = (document.getElementById('swal-new-tipo') as HTMLSelectElement).value;
        const nom = (document.getElementById('swal-new-nom') as HTMLInputElement).value;
        const tit = (document.getElementById('swal-new-tit') as HTMLInputElement).value;
        const esc = (document.getElementById('swal-new-esc') as HTMLSelectElement).value;
        if (!nom.trim() || !tit.trim()) {
          Swal.showValidationMessage('El nombre y título son obligatorios');
          return false;
        }
        return { tipo, nom: nom.trim(), tit: tit.trim(), esc };
      }
    }).then((res: any) => {
      if (res.isConfirmed && res.value) {
        const base = PLANTILLAS_PREDETERMINADAS.find(p => p.codigo_tipo === res.value.tipo) || PLANTILLAS_PREDETERMINADAS[0];
        const nueva: PlantillaConstancia = {
          ...JSON.parse(JSON.stringify(base)),
          id: (res.value.tipo === 'carnet' ? 'CARNET-CUSTOM-' : 'CONST-CUSTOM-') + new Date().getTime(),
          codigo_tipo: res.value.tipo,
          nombre: res.value.nom,
          titulo_documento: res.value.tit,
          id_escuela: res.value.esc
        };

        const nuevasPlantillas = [...plantillas, nueva];
        setPlantillas(nuevasPlantillas);
        setPlantillaActivaId(nueva.id);
        setPlantillaEdicion(nueva);
        localStorage.setItem('sigae_plantillas_constancias', JSON.stringify(nuevasPlantillas));
        Swal.fire('¡Plantilla Creada!', 'Ya puedes personalizar sus firmantes, redacción y estructura.', 'success');
      }
    });
  };

  const handleGuardarPlantilla = async () => {
    setGuardando(true);
    try {
      const actualizadas = plantillas.map(p => p.id === plantillaEdicion.id ? plantillaEdicion : p);
      setPlantillas(actualizadas);
      localStorage.setItem('sigae_plantillas_constancias', JSON.stringify(actualizadas));

      // Si es plantilla de carnet, guardar en la configuración del generador de carnet
      if (plantillaEdicion.codigo_tipo === 'carnet') {
        const escKey = (plantillaEdicion.id_escuela === 'todas' ? 'sb' : plantillaEdicion.id_escuela) as 'sb' | 'lb';
        const cfg = obtenerPlantillaCarnet(escKey);
        cfg.titulo_carnet = plantillaEdicion.titulo_documento || cfg.titulo_carnet;
        cfg.subtitulo_carnet = plantillaEdicion.membrete_nombre_escuela || cfg.subtitulo_carnet;
        cfg.mostrar_bandera = plantillaEdicion.mostrar_bandera_venezuela;
        cfg.mostrar_firma_director = plantillaEdicion.mostrar_firma_digital;
        cfg.mostrar_qr = plantillaEdicion.mostrar_codigo_qr;
        if (plantillaEdicion.parrafo_certificacion) cfg.leyenda_reverso = plantillaEdicion.parrafo_certificacion;
        if (plantillaEdicion.parrafo_expedicion) cfg.texto_validez = plantillaEdicion.parrafo_expedicion;
        guardarPlantillaCarnet(cfg);

        if (plantillaEdicion.id_escuela === 'todas') {
          const cfgLb = obtenerPlantillaCarnet('lb');
          cfgLb.titulo_carnet = cfg.titulo_carnet;
          cfgLb.mostrar_bandera = cfg.mostrar_bandera;
          cfgLb.mostrar_firma_director = cfg.mostrar_firma_director;
          cfgLb.mostrar_qr = cfg.mostrar_qr;
          guardarPlantillaCarnet(cfgLb);
        }
      }

      try {
        await supabase.from('ajustes_globales').upsert({
          clave: 'plantilla_' + plantillaEdicion.id,
          valor: JSON.stringify(plantillaEdicion),
          descripcion: 'Configuración de plantilla ' + plantillaEdicion.nombre
        }, { onConflict: 'clave' });
      } catch (errDb) {
        console.warn("Aviso guardado BD:", errDb);
      }

      auditar('Diseños', 'Modificar Plantilla', `Actualizó la plantilla: ${plantillaEdicion.nombre}`);
      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Plantilla Guardada!',
          text: 'Los cambios se aplicaron exitosamente en todo el sistema.',
          confirmButtonColor: '#00BCD4'
        });
      }
    } catch (e: any) {
      console.error(e);
      if (Swal) Swal.fire('Error', 'No se pudieron guardar los cambios de la plantilla.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleRestaurarPredeterminados = () => {
    if (!Swal) return;
    Swal.fire({
      title: '¿Restaurar Formatos Originales?',
      text: 'Se restablecerán las constancias oficiales idénticas a las emitidas por Control de Estudios.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar'
    }).then((res: any) => {
      if (res.isConfirmed) {
        setPlantillas(PLANTILLAS_PREDETERMINADAS);
        setPlantillaActivaId(PLANTILLAS_PREDETERMINADAS[0].id);
        setPlantillaEdicion(PLANTILLAS_PREDETERMINADAS[0]);
        localStorage.setItem('sigae_plantillas_constancias', JSON.stringify(PLANTILLAS_PREDETERMINADAS));
        Swal.fire('Restaurado', 'Se han restablecido los formatos oficiales originales de Santa Bárbara y Libertador Bolívar.', 'success');
      }
    });
  };

  const insertarTagEnCertificacion = (tag: string) => {
    setPlantillaEdicion(prev => ({
      ...prev,
      parrafo_certificacion: (prev.parrafo_certificacion || '') + ' ' + tag + ' '
    }));
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'logo_escuela' | 'firma' | 'sello' | 'logo_mppe') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      if (Swal) Swal.fire('Archivo muy grande', 'La imagen no debe superar los 2 MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (tipo === 'logo_escuela') {
        setPlantillaEdicion(prev => ({ ...prev, logo_escuela_url: base64 }));
      } else if (tipo === 'firma') {
        setPlantillaEdicion(prev => ({ ...prev, firma_digital_url: base64 }));
      } else if (tipo === 'sello') {
        setPlantillaEdicion(prev => ({ ...prev, sello_humedo_url: base64, mostrar_sello_humedo: true }));
      } else if (tipo === 'logo_mppe') {
        setPlantillaEdicion(prev => ({ ...prev, logo_mppe_url: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  // ──────────────────────────────────────────────────────────
  // GENERACIÓN DE TEXTO CON VARIABLES REEMPLAZADAS EN VIVO
  // (Réplica Exacta del Motor de VincularEstudiante / Verificaciones)
  // ──────────────────────────────────────────────────────────
  const textoProcesado = useMemo(() => {
    const est = estudianteSeleccionado || {
      nombres_estudiante: 'Juan Carlos',
      apellidos_estudiante: 'Pérez Rodríguez',
      cedula_estudiante: '32145678',
      grado_actual: '1er Grado',
      seccion_actual: 'A',
      codigo_escuela: plantillaEdicion.id_escuela === 'lb' ? 'lb' : 'sb',
      nombres_representante: 'María Elena',
      apellidos_representante: 'Rodríguez de Pérez',
      cedula_representante: '14567890'
    };

    const escuelaCodigo = resolverEscuelaEstudiante(est, { id_escuela: plantillaEdicion.id_escuela });
    const esSantaBarbara = escuelaCodigo === 'sb';

    const nombreEscuelaTexto = esSantaBarbara ? 'Unidad Educativa Santa Bárbara' : 'Unidad Educativa Libertador Bolívar';
    const ubicacionEscuelaTexto = esSantaBarbara ? 'El Tejero, estado Monagas' : 'Miraflores, estado Monagas';
    const ciudadExpedicionTexto = esSantaBarbara ? 'El Tejero' : 'Miraflores';

    const anoActual = new Date().getFullYear();
    const anoProximo = anoActual + 1;
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const diaExpedicion = new Date().getDate();
    const mesExpedicion = meses[new Date().getMonth()];
    const anoExpedicion = anoActual;

    const cedulaLimpia = (est.cedula_estudiante || '0000').toString().replace(/\D/g, '');
    const codigoConstancia = `CI-${escuelaCodigo.toUpperCase()}-${cedulaLimpia}-${anoActual}`;

    const esLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const baseUrlVerificacion = esLocal ? 'https://app-delta-ten-80.vercel.app' : (typeof window !== 'undefined' ? window.location.origin : '');
    const urlQrConstancia = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`${baseUrlVerificacion}/validar-constancia/${encodeURIComponent(codigoConstancia)}`)}&bgcolor=ffffff&color=166534&margin=2`;

    // Tipo de documento (cédula escolar vs cédula de identidad)
    const cedStr = (est.cedula_estudiante || '').toString().trim().toUpperCase();
    const tipoCedulaTexto = cedStr.startsWith('CE') || cedStr.startsWith('CE-') || cedStr.replace(/\D/g, '').length >= 10
      ? 'cédula escolar'
      : 'cédula de identidad';

    const gradoLimpio = (est.grado_actual || '1er Grado')
      .replace(/\s+de\s+(Educación\s+Primaria|Educación\s+Inicial|Educación\s+Media\s+General|Media\s+General|Primaria|Inicial)/gi, '')
      .replace(/\s+correspondiente\s+al\s+Nivel\s+de.*/gi, '')
      .trim();

    let nivelEducativo = 'Educación Primaria';
    const gLower = (est.grado_actual || '').toLowerCase();
    if (gLower.includes('maternal') || gLower.includes('preescolar') || gLower.includes('inicial') || gLower.includes('grupo')) {
      nivelEducativo = 'Educación Inicial';
    } else if (gLower.includes('año') || gLower.includes('media') || gLower.includes('bachillerato')) {
      nivelEducativo = 'Educación Media General';
    }

    const lugarNac = est.estudiante_municipio_nacimiento || est.estudiante_lugar_nacimiento || (esSantaBarbara ? 'El Tejero' : 'Miraflores');
    const estadoNac = est.estudiante_estado_nacimiento || 'Monagas';
    const nombreCompletoEstudiante = `${est.nombres_estudiante || ''} ${est.apellidos_estudiante || ''}`.trim();
    const nombreCompletoRepresentante = `${est.nombres_representante || ''} ${est.apellidos_representante || ''}`.trim() || 'No registrado';

    // Reemplazo en Párrafo 1
    let p1 = plantillaEdicion.parrafo_certificacion || '';
    p1 = p1.replace(/\{titulo_director\}/g, plantillaEdicion.titulo_director);
    p1 = p1.replace(/\{nombre_director\}/g, plantillaEdicion.nombre_director);
    p1 = p1.replace(/\{cargo_generico\}/g, plantillaEdicion.cargo_generico.toLowerCase());
    p1 = p1.replace(/\{nombre_escuela\}/g, nombreEscuelaTexto);
    p1 = p1.replace(/\{ubicacion_escuela\}/g, ubicacionEscuelaTexto);
    p1 = p1.replace(/\{nombre_estudiante\}/g, nombreCompletoEstudiante);
    p1 = p1.replace(/\{lugar_nacimiento\}/g, lugarNac);
    p1 = p1.replace(/\{estado_nacimiento\}/g, estadoNac);
    p1 = p1.replace(/\{tipo_cedula\}/g, tipoCedulaTexto);
    p1 = p1.replace(/\{cedula_estudiante\}/g, est.cedula_estudiante || 'No registrada');
    p1 = p1.replace(/\{grado_actual\}/g, gradoLimpio);
    p1 = p1.replace(/\{nivel_educativo\}/g, nivelEducativo);
    p1 = p1.replace(/\{periodo_escolar\}/g, `${anoActual}-${anoProximo}`);

    // Reemplazo en Párrafo 2
    let p2 = plantillaEdicion.parrafo_representante || '';
    p2 = p2.replace(/\{nombre_representante\}/g, nombreCompletoRepresentante);
    p2 = p2.replace(/\{cedula_representante\}/g, est.cedula_representante || 'No registrada');

    // Reemplazo en Párrafo 3
    let p3 = plantillaEdicion.parrafo_expedicion || '';
    p3 = p3.replace(/\{ciudad_expedicion\}/g, plantillaEdicion.ciudad_expedicion || ciudadExpedicionTexto);
    p3 = p3.replace(/\{dia_expedicion\}/g, diaExpedicion.toString());
    p3 = p3.replace(/\{mes_expedicion\}/g, mesExpedicion);
    p3 = p3.replace(/\{ano_expedicion\}/g, anoExpedicion.toString());

    // Membrete
    const membreteEscuela = plantillaEdicion.membrete_nombre_escuela.replace(/\{nombre_escuela\}/g, nombreEscuelaTexto);
    const membreteUbicacion = plantillaEdicion.membrete_ubicacion.replace(/\{ubicacion_escuela\}/g, ubicacionEscuelaTexto);

    return {
      p1,
      p2,
      p3,
      membreteEscuela,
      membreteUbicacion,
      codigoConstancia,
      urlQrConstancia
    };
  }, [plantillaEdicion, estudianteSeleccionado]);

  // Descarga de PDF de Prueba
  const handleDescargarPdfPrueba = () => {
    if (plantillaEdicion.codigo_tipo === 'carnet') {
      if (datosCarnetPrueba) {
        descargarCarnetPDF(datosCarnetPrueba);
      } else {
        if (Swal) Swal.fire('Aviso', 'Cargando datos del carnet...', 'info');
      }
      return;
    }

    if (!html2pdf) {
      if (Swal) Swal.fire('Aviso', 'El motor PDF está cargando.', 'info');
      return;
    }

    const element = previewRef.current;
    if (!element) return;

    const opt = {
      margin: 8,
      filename: `Constancia_Inscripcion_Oficial_${plantillaEdicion.id_escuela.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };

    if (Swal) {
      Swal.fire({
        title: 'Generando PDF Oficial...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
    }

    html2pdf().set(opt).from(element).save().then(() => {
      if (Swal) Swal.close();
      auditar('Diseños', 'Descarga Prueba PDF', `Descargó prueba de ${plantillaEdicion.nombre}`);
    }).catch((err: any) => {
      console.error(err);
      if (Swal) {
        Swal.close();
        Swal.fire('Error', 'Falla al procesar el archivo PDF.', 'error');
      }
    });
  };

  const plantillasFiltradas = useMemo(() => {
    if (filtroTipoPlantilla === 'CONSTANCIAS') {
      return plantillas.filter(p => p.codigo_tipo !== 'carnet');
    }
    if (filtroTipoPlantilla === 'CARNETS') {
      return plantillas.filter(p => p.codigo_tipo === 'carnet');
    }
    return plantillas;
  }, [plantillas, filtroTipoPlantilla]);

  const estudiantesFiltradosMuestra = useMemo(() => {
    if (!searchEstudianteMuestra.trim()) return estudiantesMuestra.slice(0, 10);
    const q = searchEstudianteMuestra.toLowerCase();
    return estudiantesMuestra.filter(e => 
      (e.nombres_estudiante || '').toLowerCase().includes(q) ||
      (e.apellidos_estudiante || '').toLowerCase().includes(q) ||
      (e.cedula_estudiante || '').toLowerCase().includes(q)
    ).slice(0, 10);
  }, [estudiantesMuestra, searchEstudianteMuestra]);

  return (
    <div className="container-fluid py-4 px-3 px-md-4">
      {/* Banner Principal */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden position-relative" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0284c7 100%)' }}>
            <div className="card-body p-4 p-md-5 text-white position-relative z-1">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-white text-dark px-3 py-2 fw-bold shadow-sm rounded-pill">
                    <i className="bi bi-palette-fill text-primary me-1"></i> MÓDULO DE DISEÑOS
                  </span>
                  <span className="badge bg-info text-white px-3 py-2 fw-bold shadow-sm rounded-pill">
                    FORMATOS OFICIALES Y CARNETS
                  </span>
                </div>
                
                <div className="d-flex align-items-center gap-2">
                  <button 
                    className="btn btn-sm btn-outline-light rounded-pill px-3 fw-bold"
                    onClick={handleRestaurarPredeterminados}
                    title="Restaurar a las constancias y carnets oficiales consolidados"
                  >
                    <i className="bi bi-arrow-counterclockwise me-1"></i>Restaurar Formatos Originales
                  </button>
                  <button 
                    className="btn btn-sm btn-info text-white rounded-pill px-4 fw-bold shadow hover-efecto"
                    onClick={handleGuardarPlantilla}
                    disabled={guardando}
                  >
                    <i className="bi bi-check2-circle me-1"></i>
                    {guardando ? 'Guardando...' : 'Guardar y Aplicar al Sistema'}
                  </button>
                </div>
              </div>

              <h2 className="display-6 fw-bold m-0 mb-2">
                Editor y Diseñador de Constancias & Carnets Oficiales
              </h2>
              <p className="text-white-50 m-0 fs-6" style={{ maxWidth: '850px' }}>
                Ajusta las firmas digitales, nombres de directores, membretes, colores y textos de las constancias y carnets estudiantiles oficiales con bandera de Venezuela de 8 estrellas y códigos QR.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Plantilla y Herramientas Superiores */}
      <div className="card bg-white shadow-sm border-0 rounded-4 p-3 mb-4">
        {/* Filtros Rápidos de Tipo */}
        <div className="d-flex align-items-center gap-2 mb-3 border-bottom pb-3 flex-wrap">
          <span className="small fw-bold text-muted me-2">
            <i className="bi bi-funnel-fill text-primary me-1"></i>Filtrar Formatos:
          </span>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 fw-bold ${filtroTipoPlantilla === 'TODAS' ? 'btn-dark shadow-sm' : 'btn-outline-secondary'}`}
            onClick={() => setFiltroTipoPlantilla('TODAS')}
          >
            Todos ({plantillas.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 fw-bold ${filtroTipoPlantilla === 'CONSTANCIAS' ? 'btn-primary shadow-sm' : 'btn-outline-primary'}`}
            onClick={() => {
              setFiltroTipoPlantilla('CONSTANCIAS');
              const firstConst = plantillas.find(p => p.codigo_tipo !== 'carnet');
              if (firstConst && plantillaEdicion.codigo_tipo === 'carnet') seleccionarPlantilla(firstConst.id);
            }}
          >
            <i className="bi bi-file-earmark-text-fill me-1"></i>
            Constancias Oficiales ({plantillas.filter(p => p.codigo_tipo !== 'carnet').length})
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill px-3 fw-bold ${filtroTipoPlantilla === 'CARNETS' ? 'btn-warning text-dark shadow-sm' : 'btn-outline-warning text-dark'}`}
            onClick={() => {
              setFiltroTipoPlantilla('CARNETS');
              const firstCarnet = plantillas.find(p => p.codigo_tipo === 'carnet');
              if (firstCarnet) seleccionarPlantilla(firstCarnet.id);
            }}
          >
            <i className="bi bi-person-badge-fill me-1"></i>
            Carnets Estudiantiles ({plantillas.filter(p => p.codigo_tipo === 'carnet').length})
          </button>
        </div>

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '650px' }}>
            <label className="small fw-bold text-muted text-nowrap m-0">
              <i className="bi bi-file-earmark-text-fill text-primary me-1"></i>Plantilla Activa:
            </label>
            <select 
              className="form-select form-select-sm border-info rounded-pill fw-bold"
              value={plantillaActivaId}
              onChange={(e) => seleccionarPlantilla(e.target.value)}
            >
              {plantillasFiltradas.map(p => (
                <option key={p.id} value={p.id}>
                  {p.codigo_tipo === 'carnet' ? '🪪 ' : '📄 '}
                  {p.nombre} ({p.id_escuela === 'todas' ? 'Ambas Escuelas' : p.id_escuela.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="d-flex align-items-center flex-wrap gap-2">
            <button 
              type="button"
              className={`btn btn-sm ${carnetActivo ? 'btn-success' : 'btn-outline-danger'} rounded-pill px-3 fw-bold shadow-sm d-flex align-items-center gap-1.5`}
              onClick={handleToggleCarnetEstado}
              title="Haz clic para activar o desactivar la emisión y descarga del Carnet Estudiantil en el sistema"
            >
              <i className={`bi ${carnetActivo ? 'bi-toggle-on fs-5' : 'bi-toggle-off fs-5'}`}></i>
              <span>{carnetActivo ? 'Carnet: Activo' : 'Carnet: Inactivo'}</span>
            </button>
            <button 
              className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold"
              onClick={handleCrearNuevaPlantilla}
            >
              <i className="bi bi-plus-lg me-1"></i>Crear Nueva Plantilla
            </button>
            <button 
              className={`btn btn-sm ${plantillaEdicion.codigo_tipo === 'carnet' ? 'btn-warning text-dark' : 'btn-success'} rounded-pill px-3 fw-bold shadow-sm`}
              onClick={handleDescargarPdfPrueba}
              title={plantillaEdicion.codigo_tipo === 'carnet' ? 'Descargar Carnet Estudiantil en PDF' : 'Descargar prueba de la constancia oficial en PDF'}
            >
              <i className={`bi ${plantillaEdicion.codigo_tipo === 'carnet' ? 'bi-person-badge-fill' : 'bi-file-earmark-pdf-fill'} me-1`}></i>
              {plantillaEdicion.codigo_tipo === 'carnet' ? 'Descargar PDF Carnet' : 'Descargar PDF Oficial'}
            </button>
          </div>
        </div>
      </div>

      {/* Área de Trabajo: Editor (Izquierda) + Vista Previa Oficial (Derecha) */}
      <div className="row g-4">
        {/* PANEL IZQUIERDO: CONTROLES DEL EDITOR */}
        <div className="col-12 col-xl-5">
          <div className="card bg-white shadow-sm border-0 rounded-4 overflow-hidden h-100">
            {/* Pestañas del Editor */}
            <div className="card-header bg-white border-bottom p-3">
              <div className="btn-group w-100 shadow-sm rounded-pill p-1 bg-light border" role="group">
                <button 
                  type="button" 
                  className={`btn btn-sm rounded-pill fw-bold ${tabEditor === 'firmas' ? 'btn-primary text-white shadow-sm' : 'btn-light text-dark'}`}
                  onClick={() => setTabEditor('firmas')}
                >
                  <i className="bi bi-pen-fill me-1"></i> 1. Firmas & Dirección
                </button>
                <button 
                  type="button" 
                  className={`btn btn-sm rounded-pill fw-bold ${tabEditor === 'redaccion' ? 'btn-primary text-white shadow-sm' : 'btn-light text-dark'}`}
                  onClick={() => setTabEditor('redaccion')}
                >
                  <i className="bi bi-textarea-t me-1"></i> 2. Textos & Párrafos
                </button>
                <button 
                  type="button" 
                  className={`btn btn-sm rounded-pill fw-bold ${tabEditor === 'grafica' ? 'btn-primary text-white shadow-sm' : 'btn-light text-dark'}`}
                  onClick={() => setTabEditor('grafica')}
                >
                  <i className="bi bi-building me-1"></i> 3. Membrete & Logos
                </button>
              </div>
            </div>

            <div className="card-body p-4" style={{ maxHeight: '720px', overflowY: 'auto' }}>
              {/* PESTAÑA 1: FIRMAS Y DIRECCIÓN */}
              {tabEditor === 'firmas' && (
                <div className="animate__animated animate__fadeIn">
                  <h6 className="fw-bold text-dark mb-2">
                    <i className="bi bi-person-badge-fill text-primary me-2"></i>Datos del Director(a) Firmante
                  </h6>
                  <p className="small text-muted mb-3">
                    Configura el nombre del directivo, cédula y sube su firma digitalizada oficial en formato PNG transparente.
                  </p>

                  <div className="row g-2 mb-3">
                    <div className="col-4">
                      <label className="small fw-bold text-muted">Prefijo/Título:</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm"
                        placeholder="Prof. / Profa."
                        value={plantillaEdicion.titulo_director}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, titulo_director: e.target.value })}
                      />
                    </div>
                    <div className="col-8">
                      <label className="small fw-bold text-muted">Nombre Completo del Director:</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm fw-bold"
                        value={plantillaEdicion.nombre_director}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, nombre_director: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="small fw-bold text-muted">Cédula de Identidad:</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm font-monospace"
                        placeholder="17.780.095"
                        value={plantillaEdicion.cedula_director}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, cedula_director: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="small fw-bold text-muted">Cargo Genérico:</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm"
                        placeholder="Director / Directora"
                        value={plantillaEdicion.cargo_generico}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, cargo_generico: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="small fw-bold text-muted">Cargo Institucional Completo:</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm"
                        placeholder="Director de la Unidad Educativa..."
                        value={plantillaEdicion.cargo_director}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, cargo_director: e.target.value })}
                      />
                    </div>
                  </div>

                  <hr className="text-muted" />

                  {/* Imagen de la Firma Digital */}
                  <h6 className="fw-bold text-dark mb-2">Firma Digitalizada del Director</h6>
                  <div className="p-3 border rounded-3 bg-light d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <img 
                        src={plantillaEdicion.firma_digital_url || `/assets/img/firma_director_${plantillaEdicion.id_escuela === 'sb' ? 'sb' : 'lb'}.png`} 
                        alt="Firma Director" 
                        style={{ height: '55px', maxWidth: '160px', objectFit: 'contain' }}
                        className="border rounded p-1 bg-white"
                      />
                      <div>
                        <span className="small fw-bold text-dark d-block">Firma Actual</span>
                        <span className="text-muted" style={{ fontSize: '11px' }}>PNG con fondo transparente</span>
                      </div>
                    </div>
                    <label className="btn btn-sm btn-outline-primary rounded-pill px-3 cursor-pointer m-0">
                      <i className="bi bi-upload me-1"></i>Cambiar Firma
                      <input 
                        type="file" 
                        accept="image/png,image/jpeg" 
                        className="d-none" 
                        onChange={(e) => handleUploadImage(e, 'firma')} 
                      />
                    </label>
                  </div>

                  <div className="form-check form-switch mb-3">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="sw-mostrar-firma"
                      checked={plantillaEdicion.mostrar_firma_digital}
                      onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, mostrar_firma_digital: e.target.checked })}
                    />
                    <label className="form-check-label small fw-bold text-dark cursor-pointer" htmlFor="sw-mostrar-firma">
                      Estampar Firma Digitalizada en la Constancia
                    </label>
                  </div>
                </div>
              )}

              {/* PESTAÑA 2: TEXTOS Y PÁRRAFOS */}
              {tabEditor === 'redaccion' && (
                <div className="animate__animated animate__fadeIn">
                  <h6 className="fw-bold text-dark mb-2">
                    <i className="bi bi-textarea-t text-primary me-2"></i>Redacción Oficial de los Párrafos
                  </h6>
                  <p className="small text-muted mb-3">
                    Personaliza la redacción manteniendo las etiquetas dinámicas para la sustitución automática de datos:
                  </p>

                  <div className="d-flex flex-wrap gap-1 mb-3 p-2 bg-light border rounded-3">
                    <button type="button" className="btn btn-xs btn-white border shadow-sm rounded-pill fw-bold text-primary" onClick={() => insertarTagEnCertificacion('{nombre_estudiante}')}>
                      + {`{nombre_estudiante}`}
                    </button>
                    <button type="button" className="btn btn-xs btn-white border shadow-sm rounded-pill fw-bold text-primary" onClick={() => insertarTagEnCertificacion('{cedula_estudiante}')}>
                      + {`{cedula_estudiante}`}
                    </button>
                    <button type="button" className="btn btn-xs btn-white border shadow-sm rounded-pill fw-bold text-primary" onClick={() => insertarTagEnCertificacion('{grado_actual}')}>
                      + {`{grado_actual}`}
                    </button>
                    <button type="button" className="btn btn-xs btn-white border shadow-sm rounded-pill fw-bold text-primary" onClick={() => insertarTagEnCertificacion('{periodo_escolar}')}>
                      + {`{periodo_escolar}`}
                    </button>
                    <button type="button" className="btn btn-xs btn-white border shadow-sm rounded-pill fw-bold text-primary" onClick={() => insertarTagEnCertificacion('{nombre_representante}')}>
                      + {`{nombre_representante}`}
                    </button>
                  </div>

                  <div className="mb-3">
                    <label className="small fw-bold text-muted mb-1">Título del Documento:</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm fw-bold"
                      value={plantillaEdicion.titulo_documento}
                      onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, titulo_documento: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="small fw-bold text-muted mb-1">Párrafo 1: Certificación del Estudiante:</label>
                    <textarea 
                      className="form-control form-control-sm font-monospace"
                      rows={6}
                      value={plantillaEdicion.parrafo_certificacion}
                      onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, parrafo_certificacion: e.target.value })}
                      style={{ fontSize: '12.5px', lineHeight: '1.5' }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="small fw-bold text-muted mb-1">Párrafo 2: Representante Legal:</label>
                    <textarea 
                      className="form-control form-control-sm font-monospace"
                      rows={3}
                      value={plantillaEdicion.parrafo_representante}
                      onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, parrafo_representante: e.target.value })}
                      style={{ fontSize: '12.5px' }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="small fw-bold text-muted mb-1">Párrafo 3: Expedición y Fecha:</label>
                    <textarea 
                      className="form-control form-control-sm font-monospace"
                      rows={2}
                      value={plantillaEdicion.parrafo_expedicion}
                      onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, parrafo_expedicion: e.target.value })}
                      style={{ fontSize: '12.5px' }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="small fw-bold text-muted mb-1">Ciudad de Expedición:</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm"
                      placeholder="El Tejero / Miraflores"
                      value={plantillaEdicion.ciudad_expedicion}
                      onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, ciudad_expedicion: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* PESTAÑA 3: MEMBRETE Y LOGOS */}
              {tabEditor === 'grafica' && (
                <div className="animate__animated animate__fadeIn">
                  <h6 className="fw-bold text-dark mb-2">
                    <i className="bi bi-building text-primary me-2"></i>Membrete y Logotipos Oficiales
                  </h6>
                  <p className="small text-muted mb-3">
                    Configuración del encabezado oficial y logotipo institucional del plantel:
                  </p>

                  <div className="form-check form-switch mb-3">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="sw-bandera"
                      checked={plantillaEdicion.mostrar_bandera_venezuela}
                      onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, mostrar_bandera_venezuela: e.target.checked })}
                    />
                    <label className="form-check-label small fw-bold text-dark cursor-pointer" htmlFor="sw-bandera">
                      Mostrar Bandera Tricolor de Venezuela con 8 Estrellas
                    </label>
                  </div>

                  {/* Logo Escuela */}
                  <div className="p-3 border rounded-3 bg-light d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <img 
                        src={plantillaEdicion.logo_escuela_url || `/assets/img/logo_${plantillaEdicion.id_escuela === 'sb' ? 'sb' : 'lb'}.png`} 
                        alt="Logo Escuela" 
                        style={{ height: '55px', maxWidth: '80px', objectFit: 'contain' }}
                        className="border rounded p-1 bg-white"
                      />
                      <div>
                        <span className="small fw-bold text-dark d-block">Escudo del Plantel</span>
                        <span className="text-muted" style={{ fontSize: '11px' }}>Logo izquierdo oficial</span>
                      </div>
                    </div>
                    <label className="btn btn-sm btn-outline-primary rounded-pill px-3 cursor-pointer m-0">
                      <i className="bi bi-upload me-1"></i>Cambiar Escudo
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="d-none" 
                        onChange={(e) => handleUploadImage(e, 'logo_escuela')} 
                      />
                    </label>
                  </div>

                  {/* Líneas de Membrete */}
                  <div className="row g-2 mb-3">
                    <div className="col-12">
                      <label className="small text-muted">Línea 1:</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm"
                        value={plantillaEdicion.membrete_linea1}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, membrete_linea1: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="small text-muted">Línea 2:</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm"
                        value={plantillaEdicion.membrete_linea2}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, membrete_linea2: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="small text-muted">Nombre de la Escuela:</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm fw-bold"
                        value={plantillaEdicion.membrete_nombre_escuela}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, membrete_nombre_escuela: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="small text-muted">Ubicación Institucional:</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm"
                        value={plantillaEdicion.membrete_ubicacion}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, membrete_ubicacion: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: VISTA PREVIA EXACTA (RÉPLICA OFICIAL) */}
        <div className="col-12 col-xl-7">
          <div className="card bg-white shadow-sm border-0 rounded-4 overflow-hidden h-100">
            <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1.5 rounded-pill fw-bold">
                  <i className="bi bi-check-circle-fill me-1"></i> Formato Réplica Oficial Idéntico
                </span>
              </div>

              {/* Selector de Estudiante de Prueba */}
              <div className="d-flex align-items-center gap-2">
                <div className="dropdown">
                  <button 
                    className="btn btn-sm btn-outline-secondary rounded-pill dropdown-toggle fw-bold"
                    type="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <i className="bi bi-person-bounding-box me-1"></i>
                    {estudianteSeleccionado ? `${estudianteSeleccionado.apellidos_estudiante}, ${estudianteSeleccionado.nombres_estudiante}` : 'Estudiante de Prueba'}
                  </button>
                  <div className="dropdown-menu dropdown-menu-end shadow-lg p-2 rounded-4" style={{ minWidth: '320px', maxHeight: '350px', overflowY: 'auto' }}>
                    <div className="p-2">
                      <input 
                        type="text" 
                        className="form-control form-control-sm border-info rounded-pill"
                        placeholder="Buscar por cédula o nombre..."
                        value={searchEstudianteMuestra}
                        onChange={(e) => setSearchEstudianteMuestra(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="dropdown-divider"></div>
                    {estudiantesFiltradosMuestra.map((e) => (
                      <button 
                        key={e.cedula_estudiante}
                        className="dropdown-item p-2 rounded-3 text-truncate"
                        onClick={() => setEstudianteSeleccionado(e)}
                      >
                        <div className="fw-bold text-dark">{e.apellidos_estudiante}, {e.nombres_estudiante}</div>
                        <div className="small text-muted">C.I. {e.cedula_estudiante} | {e.grado_actual} "{e.seccion_actual}"</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="btn-group btn-group-sm">
                  <button className="btn btn-light border" onClick={() => setZoomPreview(prev => Math.max(70, prev - 10))} title="Alejar zoom">-</button>
                  <span className="btn btn-light border disabled fw-bold" style={{ width: '55px' }}>{zoomPreview}%</span>
                  <button className="btn btn-light border" onClick={() => setZoomPreview(prev => Math.min(130, prev + 10))} title="Acercar zoom">+</button>
                </div>
              </div>
            </div>

            {/* Hoja de la Constancia o Carnet Estudiantil */}
            <div className="card-body p-4 bg-light d-flex justify-content-center align-items-start overflow-auto" style={{ maxHeight: '720px' }}>
              {plantillaEdicion.codigo_tipo === 'carnet' ? (
                <div className="d-flex flex-column align-items-center w-100 animate__animated animate__fadeIn">
                  <div className="alert alert-warning py-2 px-4 rounded-pill small fw-bold mb-3 d-flex align-items-center gap-2 shadow-sm">
                    <i className="bi bi-person-badge-fill text-dark"></i>
                    <span>Vista Previa Oficial del Carnet Estudiantil (Anverso y Reverso CR-80)</span>
                  </div>
                  {datosCarnetPrueba ? (
                    <div 
                      style={{
                        transform: `scale(${zoomPreview / 100})`,
                        transformOrigin: 'top center'
                      }}
                      dangerouslySetInnerHTML={{ __html: renderCarnetContainerHTML(datosCarnetPrueba) }}
                    />
                  ) : (
                    <div className="text-center py-5">
                      <div className="spinner-border text-warning" role="status"></div>
                      <p className="mt-2 small text-muted">Cargando vista previa del carnet...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  ref={previewRef}
                  className="bg-white shadow rounded-4 animate__animated animate__fadeIn mx-auto"
                  style={{
                    width: '800px',
                    maxWidth: '100%',
                    border: '2px solid #94a3b8',
                    color: '#000000',
                    boxSizing: 'border-box',
                    minHeight: '1035px',
                    padding: '42px 48px 35px 48px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    fontFamily: plantillaEdicion.fuente_familia || 'Arial, Helvetica, sans-serif',
                    transform: `scale(${zoomPreview / 100})`,
                    transformOrigin: 'top center'
                  }}
                >
                  <div>
                    {/* BANDERA DE VENEZUELA CON 8 ESTRELLAS */}
                    {plantillaEdicion.mostrar_bandera_venezuela && (
                      <div style={{ marginBottom: '16px', borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: '6px', backgroundColor: '#facc15' }}></div>
                        <div style={{ height: '9px', backgroundColor: '#003893', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', color: '#ffffff', fontSize: '7.5px', lineHeight: '1', fontWeight: 'bold', userSelect: 'none' }}>
                          <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: '#cf142b' }}></div>
                      </div>
                    )}

                    {/* ENCABEZADO INSTITUCIONAL */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '2px solid #cbd5e1', paddingBottom: '16px', marginBottom: '25px', position: 'relative' }}>
                      <img 
                        src={plantillaEdicion.logo_escuela_url || `/assets/img/logo_${plantillaEdicion.id_escuela === 'sb' ? 'sb' : 'lb'}.png`} 
                        alt="Escuela" 
                        style={{ height: '70px', width: 'auto', position: 'absolute', left: 0 }} 
                      />
                      <div style={{ textAlign: 'center', width: '100%' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1.45', textTransform: 'uppercase', color: '#000000' }}>
                          {plantillaEdicion.membrete_linea1}<br/>
                          {plantillaEdicion.membrete_linea2}<br/>
                          {textoProcesado.membreteEscuela}<br/>
                          <span style={{ fontWeight: 'normal', fontSize: '12px', textTransform: 'none', color: '#334155' }}>
                            {textoProcesado.membreteUbicacion}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* TÍTULO DE LA CONSTANCIA */}
                    <div style={{ textAlign: 'center', margin: '28px 0 24px' }}>
                      <h2 style={{ margin: 0, fontSize: 21, fontWeight: 'bold', color: '#000000', letterSpacing: '0.5px' }}>
                        {plantillaEdicion.titulo_documento}
                      </h2>
                    </div>

                    {/* PÁRRAFO 1: CERTIFICACIÓN */}
                    <p 
                      style={{ fontSize: `${plantillaEdicion.tamano_fuente || 14.5}px`, lineHeight: plantillaEdicion.interlineado || 2.15, color: '#000000', textAlign: 'justify', marginBottom: '24px', textIndent: '35px' }}
                      dangerouslySetInnerHTML={{ __html: textoProcesado.p1 }}
                    />

                    {/* PÁRRAFO 2: REPRESENTANTE */}
                    <p 
                      style={{ fontSize: `${plantillaEdicion.tamano_fuente || 14.5}px`, lineHeight: plantillaEdicion.interlineado || 2.15, color: '#000000', textAlign: 'justify', marginBottom: '24px', textIndent: '35px' }}
                      dangerouslySetInnerHTML={{ __html: textoProcesado.p2 }}
                    />

                    {/* PÁRRAFO 3: FECHA Y EXPEDICIÓN */}
                    <p 
                      style={{ fontSize: `${plantillaEdicion.tamano_fuente || 14.5}px`, lineHeight: plantillaEdicion.interlineado || 2.15, color: '#000000', textAlign: 'justify', marginBottom: '28px', textIndent: '35px' }}
                      dangerouslySetInnerHTML={{ __html: textoProcesado.p3 }}
                    />
                  </div>

                  <div>
                    {/* ATENTAMENTE Y FIRMA DEL DIRECTOR CON QR */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px', paddingTop: '15px', borderTop: '1.5px solid #cbd5e1' }}>
                      <div style={{ textAlign: 'center', flex: 1, maxWidth: '440px', margin: '0 auto' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '13.5px', fontWeight: 'bold', color: '#000000' }}>Atentamente</p>
                        
                        {plantillaEdicion.mostrar_firma_digital && (
                          <img 
                            src={plantillaEdicion.firma_digital_url || `/assets/img/firma_director_${plantillaEdicion.id_escuela === 'sb' ? 'sb' : 'lb'}.png`} 
                            alt="Firma Director" 
                            style={{ height: '105px', width: 'auto', display: 'block', margin: '0 auto 5px' }} 
                          />
                        )}
                        
                        <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#000000' }}>
                          {plantillaEdicion.titulo_director} {plantillaEdicion.nombre_director}
                        </div>
                        <div style={{ fontSize: '12px', color: '#333333' }}>
                          C.I.: {plantillaEdicion.cedula_director}
                        </div>
                        <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#000000' }}>
                          {plantillaEdicion.cargo_director}
                        </div>
                      </div>

                      {plantillaEdicion.mostrar_codigo_qr && (
                        <div style={{ textAlign: 'center', border: '1.5px solid #cbd5e1', padding: '6px', borderRadius: '10px', background: '#ffffff', minWidth: '95px' }}>
                          <img 
                            src={textoProcesado.urlQrConstancia} 
                            alt="QR Verificación" 
                            style={{ height: '72px', width: '72px', display: 'block', margin: '0 auto' }} 
                          />
                          <span style={{ fontSize: '7.5px', fontWeight: 'bold', color: '#166534', fontFamily: 'monospace', display: 'block', marginTop: '4px' }}>
                            VERIFICACIÓN QR
                          </span>
                          <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#0f172a', fontFamily: 'monospace', display: 'block' }}>
                            {textoProcesado.codigoConstancia}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* PIE DE PÁGINA */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '10px', marginTop: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img 
                          src={plantillaEdicion.logo_mppe_url || '/assets/img/logoMPPE.png'} 
                          alt="MPPE" 
                          style={{ height: '40px', width: 'auto' }} 
                        />
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '8.5px', color: '#64748b' }}>
                        SIGAE - Control Estudiantil | Constancia Oficial de Inscripción Verificable mediante Código QR<br/>
                        Cód. Autenticidad: <b style={{ color: '#166534', fontFamily: 'monospace' }}>{textoProcesado.codigoConstancia}</b>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorConstancias;
