import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { usePermisos } from '../../hooks/usePermisos';
import { auditar } from '../../lib/audit';

declare const Swal: any;
declare const html2pdf: any;

export interface FirmanteConfig {
  id: string;
  nombre: string;
  titulo: string; // Ej: Prof., Lcda., Dr., Ing.
  cargo: string;  // Ej: Director(a) General, Coordinador(a) de Control de Estudios
  cedula: string; // Ej: V-12.345.678
  firma_digital_url?: string;
  mostrar_firma_digital: boolean;
}

export interface PlantillaConstancia {
  id: string;
  codigo_tipo: string; // 'inscripcion', 'estudio', 'conducta', 'retiro', 'personalizada'
  nombre: string;
  id_escuela: string; // 'sb', 'lb', 'todas'
  titulo_documento: string;
  
  // Estructura Gráfica
  fuente_familia: string;
  tamano_fuente: number;
  interlineado: number;
  estilo_marco: 'clasico_doble' | 'diplomatico' | 'simple' | 'sin_marco';
  color_acento: string;
  mostrar_marca_agua: boolean;
  opacidad_marca_agua: number;
  logo_izquierdo_url: string;
  logo_derecho_url: string;
  
  // Textos del Membrete
  membrete_linea1: string;
  membrete_linea2: string;
  membrete_linea3: string;
  membrete_codigo_dea: string;
  membrete_rif: string;
  
  // Redacción del Documento
  cuerpo_texto: string;
  clausula_cierre: string;
  pie_pagina: string;
  
  // Gestión de Firmantes y Sellos
  disposicion_firmas: 'una_centrada' | 'dos_columnas' | 'tres_columnas';
  firmantes: FirmanteConfig[];
  sello_humedo_url?: string;
  mostrar_sello_humedo: boolean;
  
  // Verificación y Seguridad
  mostrar_codigo_qr: boolean;
  mostrar_codigo_seguridad: boolean;
  
  created_at?: string;
  updated_at?: string;
}

const PLANTILLAS_PREDETERMINADAS: PlantillaConstancia[] = [
  {
    id: 'CONST-INSC-SB',
    codigo_tipo: 'inscripcion',
    nombre: 'Constancia de Inscripción Oficial (U.E. Santa Bárbara)',
    id_escuela: 'sb',
    titulo_documento: 'CONSTANCIA DE INSCRIPCIÓN',
    fuente_familia: "'Times New Roman', serif",
    tamano_fuente: 12,
    interlineado: 1.5,
    estilo_marco: 'clasico_doble',
    color_acento: '#0284c7',
    mostrar_marca_agua: true,
    opacidad_marca_agua: 0.08,
    logo_izquierdo_url: '/assets/img/logo_mppe.png',
    logo_derecho_url: '/assets/img/logo_sb.png',
    membrete_linea1: 'REPÚBLICA BOLIVARIANA DE VENEZUELA',
    membrete_linea2: 'MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN',
    membrete_linea3: 'UNIDAD EDUCATIVA "SANTA BÁRBARA"',
    membrete_codigo_dea: 'COD. DEA: OD05280702',
    membrete_rif: 'RIF: J-00000000-0',
    cuerpo_texto: `Quien suscribe, la Dirección de la Unidad Educativa "Santa Bárbara", por medio de la presente hace constar que el/la estudiante {nombre_estudiante}, titular de la Cédula de Identidad / C.E. N.° {cedula_estudiante}, se encuentra formalmente INSCRITO(A) en esta institución educativa para cursar el {grado_actual}, Sección "{seccion_actual}", correspondiente al Año Escolar {periodo_escolar}.\n\nAsimismo, se deja constancia que el/la representante legal es {nombre_representante}, titular de la Cédula de Identidad N.° {cedula_representante}, quien ha consignado los recaudos exigidos y formalizado la matrícula en el sistema de gestión académica.`,
    clausula_cierre: `Constancia que se expide a petición de la parte interesada en Ciudad Guayana, a los {fecha_hoy_letras}.`,
    pie_pagina: `U.E. "Santa Bárbara" | Dirección: Av. Principal, Ciudad Guayana, Edo. Bolívar | Correo: uesantabarbara@sigae.edu.ve`,
    disposicion_firmas: 'dos_columnas',
    firmantes: [
      {
        id: 'f1',
        titulo: 'Prof.',
        nombre: 'Luis Velásquez',
        cargo: 'Director General',
        cedula: 'V-17.242.954',
        firma_digital_url: '',
        mostrar_firma_digital: true
      },
      {
        id: 'f2',
        titulo: 'Lcda.',
        nombre: 'Coordinación Académica',
        cargo: 'Control de Estudios y Evaluación',
        cedula: 'V-15.000.000',
        firma_digital_url: '',
        mostrar_firma_digital: true
      }
    ],
    sello_humedo_url: '',
    mostrar_sello_humedo: true,
    mostrar_codigo_qr: true,
    mostrar_codigo_seguridad: true
  },
  {
    id: 'CONST-INSC-LB',
    codigo_tipo: 'inscripcion',
    nombre: 'Constancia de Inscripción Oficial (U.E. Libertador Bolívar)',
    id_escuela: 'lb',
    titulo_documento: 'CONSTANCIA DE INSCRIPCIÓN',
    fuente_familia: "'Times New Roman', serif",
    tamano_fuente: 12,
    interlineado: 1.5,
    estilo_marco: 'clasico_doble',
    color_acento: '#4f46e5',
    mostrar_marca_agua: true,
    opacidad_marca_agua: 0.08,
    logo_izquierdo_url: '/assets/img/logo_mppe.png',
    logo_derecho_url: '/assets/img/logo_lb.png',
    membrete_linea1: 'REPÚBLICA BOLIVARIANA DE VENEZUELA',
    membrete_linea2: 'MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN',
    membrete_linea3: 'UNIDAD EDUCATIVA "LIBERTADOR BOLÍVAR"',
    membrete_codigo_dea: 'COD. DEA: OD05280703',
    membrete_rif: 'RIF: J-00000000-0',
    cuerpo_texto: `Quien suscribe, la Dirección de la Unidad Educativa "Libertador Bolívar", por medio de la presente hace constar que el/la estudiante {nombre_estudiante}, titular de la Cédula de Identidad / C.E. N.° {cedula_estudiante}, se encuentra formalmente INSCRITO(A) en esta institución educativa para cursar el {grado_actual}, Sección "{seccion_actual}", correspondiente al Año Escolar {periodo_escolar}.\n\nAsimismo, se deja constancia que el/la representante legal es {nombre_representante}, titular de la Cédula de Identidad N.° {cedula_representante}, quien ha consignado los recaudos exigidos y formalizado la matrícula en el sistema de gestión académica.`,
    clausula_cierre: `Constancia que se expide a petición de la parte interesada en Ciudad Guayana, a los {fecha_hoy_letras}.`,
    pie_pagina: `U.E. "Libertador Bolívar" | Dirección: Av. Guayana, Puerto Ordaz, Edo. Bolívar | Correo: uelibertadorbolivar@sigae.edu.ve`,
    disposicion_firmas: 'dos_columnas',
    firmantes: [
      {
        id: 'f1',
        titulo: 'Prof.',
        nombre: 'Luis Velásquez',
        cargo: 'Director General',
        cedula: 'V-17.242.954',
        firma_digital_url: '',
        mostrar_firma_digital: true
      },
      {
        id: 'f2',
        titulo: 'Lcda.',
        nombre: 'Coordinación Académica',
        cargo: 'Control de Estudios y Evaluación',
        cedula: 'V-15.000.000',
        firma_digital_url: '',
        mostrar_firma_digital: true
      }
    ],
    sello_humedo_url: '',
    mostrar_sello_humedo: true,
    mostrar_codigo_qr: true,
    mostrar_codigo_seguridad: true
  },
  {
    id: 'CONST-ESTUDIO-GEN',
    codigo_tipo: 'estudio',
    nombre: 'Constancia de Estudio Regular',
    id_escuela: 'todas',
    titulo_documento: 'CONSTANCIA DE ESTUDIO',
    fuente_familia: "'Times New Roman', serif",
    tamano_fuente: 12,
    interlineado: 1.5,
    estilo_marco: 'diplomatico',
    color_acento: '#059669',
    mostrar_marca_agua: true,
    opacidad_marca_agua: 0.07,
    logo_izquierdo_url: '/assets/img/logo_mppe.png',
    logo_derecho_url: '/assets/img/logo_sb.png',
    membrete_linea1: 'REPÚBLICA BOLIVARIANA DE VENEZUELA',
    membrete_linea2: 'MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN',
    membrete_linea3: '{nombre_escuela}',
    membrete_codigo_dea: '{codigo_dea}',
    membrete_rif: 'RIF: J-00000000-0',
    cuerpo_texto: `Por medio de la presente se hace constar que el/la estudiante {nombre_estudiante}, titular de la Cédula de Identidad / C.E. N.° {cedula_estudiante}, es estudiante regular de este plantel y se encuentra cursando activamente el {grado_actual}, Sección "{seccion_actual}", en el nivel de {nivel_educativo}, durante el Año Escolar {periodo_escolar}.\n\nSe deja constancia de su intachable asistencia y rendimiento académico en las actividades regulares correspondientes a su programa formativo.`,
    clausula_cierre: `Constancia que se expide a solicitud de la parte interesada a los fines consiguientes, a los {fecha_hoy_letras}.`,
    pie_pagina: `Documento Académico Oficial emitido por el Sistema Integral de Gestión y Administración Escolar (SIGAE).`,
    disposicion_firmas: 'dos_columnas',
    firmantes: [
      {
        id: 'f1',
        titulo: 'Prof.',
        nombre: 'Luis Velásquez',
        cargo: 'Director General',
        cedula: 'V-17.242.954',
        firma_digital_url: '',
        mostrar_firma_digital: true
      },
      {
        id: 'f2',
        titulo: 'Prof.',
        nombre: 'Control de Estudios',
        cargo: 'Coordinación de Evaluación',
        cedula: 'V-18.000.000',
        firma_digital_url: '',
        mostrar_firma_digital: true
      }
    ],
    sello_humedo_url: '',
    mostrar_sello_humedo: true,
    mostrar_codigo_qr: true,
    mostrar_codigo_seguridad: true
  },
  {
    id: 'CONST-CONDUCTA-GEN',
    codigo_tipo: 'conducta',
    nombre: 'Constancia de Buena Conducta y Convivencia',
    id_escuela: 'todas',
    titulo_documento: 'CONSTANCIA DE BUENA CONDUCTA',
    fuente_familia: "'Times New Roman', serif",
    tamano_fuente: 12,
    interlineado: 1.5,
    estilo_marco: 'clasico_doble',
    color_acento: '#d97706',
    mostrar_marca_agua: true,
    opacidad_marca_agua: 0.08,
    logo_izquierdo_url: '/assets/img/logo_mppe.png',
    logo_derecho_url: '/assets/img/logo_sb.png',
    membrete_linea1: 'REPÚBLICA BOLIVARIANA DE VENEZUELA',
    membrete_linea2: 'MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN',
    membrete_linea3: '{nombre_escuela}',
    membrete_codigo_dea: '{codigo_dea}',
    membrete_rif: 'RIF: J-00000000-0',
    cuerpo_texto: `Quien suscribe, la Dirección de {nombre_escuela}, hace constar que el/la estudiante {nombre_estudiante}, titular de la Cédula de Identidad / C.E. N.° {cedula_estudiante}, quien cursa el {grado_actual}, Sección "{seccion_actual}", durante su permanencia en nuestra institución ha demostrado una EXCELENTE CONDUCTA, alto sentido de responsabilidad, respeto por las normas de convivencia escolar y valores éticos intachables.`,
    clausula_cierre: `Constancia que se expide a solicitud de la parte interesada en Ciudad Guayana, a los {fecha_hoy_letras}.`,
    pie_pagina: `Documento expedido de conformidad con las normativas vigentes del Ministerio del Poder Popular para la Educación.`,
    disposicion_firmas: 'dos_columnas',
    firmantes: [
      {
        id: 'f1',
        titulo: 'Prof.',
        nombre: 'Luis Velásquez',
        cargo: 'Director General',
        cedula: 'V-17.242.954',
        firma_digital_url: '',
        mostrar_firma_digital: true
      },
      {
        id: 'f2',
        titulo: 'Lcda.',
        nombre: 'Orientación y Convivencia',
        cargo: 'Departamento de Bienestar Estudiantil',
        cedula: 'V-16.000.000',
        firma_digital_url: '',
        mostrar_firma_digital: true
      }
    ],
    sello_humedo_url: '',
    mostrar_sello_humedo: true,
    mostrar_codigo_qr: true,
    mostrar_codigo_seguridad: true
  }
];

export const EditorConstancias: React.FC = () => {
  usePermisos();
  const [plantillas, setPlantillas] = useState<PlantillaConstancia[]>(PLANTILLAS_PREDETERMINADAS);
  const [plantillaActivaId, setPlantillaActivaId] = useState<string>(PLANTILLAS_PREDETERMINADAS[0].id);
  const [plantillaEdicion, setPlantillaEdicion] = useState<PlantillaConstancia>(PLANTILLAS_PREDETERMINADAS[0]);
  
  // Pestañas del Editor
  const [tabEditor, setTabEditor] = useState<'grafica' | 'redaccion' | 'firmas' | 'seguridad'>('grafica');
  
  // Datos para el Probador en Vivo
  const [estudiantesMuestra, setEstudiantesMuestra] = useState<any[]>([]);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<any | null>(null);
  const [searchEstudianteMuestra, setSearchEstudianteMuestra] = useState<string>('');
  
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

  const cargarDatos = async () => {
    try {
      // 1. Cargar plantillas desde localStorage o Supabase
      const guardadas = localStorage.getItem('sigae_plantillas_constancias');
      if (guardadas) {
        try {
          const parsed = JSON.parse(guardadas);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPlantillas(parsed);
            setPlantillaActivaId(parsed[0].id);
            setPlantillaEdicion(parsed[0]);
          }
        } catch (err) {
          console.error("Error parseando plantillas locales:", err);
        }
      }

      // 2. Cargar estudiantes reales de la base de datos para el simulador
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

  // Cambiar plantilla activa
  const seleccionarPlantilla = (id: string) => {
    const pl = plantillas.find(p => p.id === id);
    if (pl) {
      setPlantillaActivaId(id);
      setPlantillaEdicion(JSON.parse(JSON.stringify(pl)));
    }
  };

  // Crear nueva plantilla
  const handleCrearNuevaPlantilla = () => {
    if (!Swal) return;
    Swal.fire({
      title: 'Crear Nueva Plantilla de Constancia',
      html: `
        <div class="text-start">
          <label class="small fw-bold text-muted mb-1">Nombre de la Plantilla:</label>
          <input id="swal-new-nom" class="swal2-input m-0 mb-3 w-100" placeholder="Ej: Constancia de Prosecución, Carta de Traslado..." />
          
          <label class="small fw-bold text-muted mb-1">Título Oficial del Documento:</label>
          <input id="swal-new-tit" class="swal2-input m-0 mb-3 w-100" placeholder="Ej: CONSTANCIA DE PROSECUCIÓN ACADÉMICA" />
          
          <label class="small fw-bold text-muted mb-1">Plantel / Escuela:</label>
          <select id="swal-new-esc" class="swal2-input m-0 w-100">
            <option value="todas">Ambas Escuelas (Plantilla Global)</option>
            <option value="sb">U.E. Santa Bárbara</option>
            <option value="lb">U.E. Libertador Bolívar</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Crear Plantilla',
      confirmButtonColor: '#00BCD4',
      preConfirm: () => {
        const nom = (document.getElementById('swal-new-nom') as HTMLInputElement).value;
        const tit = (document.getElementById('swal-new-tit') as HTMLInputElement).value;
        const esc = (document.getElementById('swal-new-esc') as HTMLSelectElement).value;
        if (!nom.trim() || !tit.trim()) {
          Swal.showValidationMessage('El nombre y título son obligatorios');
          return false;
        }
        return { nom: nom.trim(), tit: tit.trim(), esc };
      }
    }).then((res: any) => {
      if (res.isConfirmed && res.value) {
        const base = PLANTILLAS_PREDETERMINADAS[0];
        const nueva: PlantillaConstancia = {
          ...JSON.parse(JSON.stringify(base)),
          id: 'CONST-CUSTOM-' + new Date().getTime(),
          codigo_tipo: 'personalizada',
          nombre: res.value.nom,
          titulo_documento: res.value.tit,
          id_escuela: res.value.esc
        };

        const nuevasPlantillas = [...plantillas, nueva];
        setPlantillas(nuevasPlantillas);
        setPlantillaActivaId(nueva.id);
        setPlantillaEdicion(nueva);
        localStorage.setItem('sigae_plantillas_constancias', JSON.stringify(nuevasPlantillas));
        Swal.fire('¡Plantilla Creada!', 'Ya puedes personalizar sus gráficos, textos y firmas.', 'success');
      }
    });
  };

  // Guardar Cambios de la Plantilla
  const handleGuardarPlantilla = async () => {
    setGuardando(true);
    try {
      const actualizadas = plantillas.map(p => p.id === plantillaEdicion.id ? plantillaEdicion : p);
      setPlantillas(actualizadas);
      localStorage.setItem('sigae_plantillas_constancias', JSON.stringify(actualizadas));

      // Guardar también en tabla o configuración global de Supabase si existe
      try {
        await supabase.from('ajustes_globales').upsert({
          clave: 'plantilla_' + plantillaEdicion.id,
          valor: JSON.stringify(plantillaEdicion),
          descripcion: 'Configuración visual de plantilla ' + plantillaEdicion.nombre
        }, { onConflict: 'clave' });
      } catch (errDb) {
        console.warn("Aviso al guardar en BD:", errDb);
      }

      auditar('Diseños', 'Modificar Plantilla', `Actualizó la plantilla de constancia: ${plantillaEdicion.nombre}`);
      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Plantilla Guardada!',
          text: 'Los cambios visuales, firmantes y redacción se aplicaron exitosamente a todo el sistema.',
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

  // Restaurar Valores Predeterminados
  const handleRestaurarPredeterminados = () => {
    if (!Swal) return;
    Swal.fire({
      title: '¿Restaurar Plantillas de Fábrica?',
      text: 'Se restablecerán los diseños, membretes y textos predeterminados oficiales del MPPE.',
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
        Swal.fire('Restaurado', 'Las plantillas han vuelto a sus valores predeterminados oficiales.', 'success');
      }
    });
  };

  // Inserción de Tags / Variables Inteligentes en el Editor
  const insertarTagEnCuerpo = (tag: string) => {
    setPlantillaEdicion(prev => ({
      ...prev,
      cuerpo_texto: (prev.cuerpo_texto || '') + ' ' + tag + ' '
    }));
  };

  // Manejo de carga de archivos (Firmas, Logos, Sellos)
  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'logo_izq' | 'logo_der' | 'sello' | 'firma', firmanteIdx?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      if (Swal) Swal.fire('Archivo muy grande', 'La imagen no debe superar los 2 MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      if (tipo === 'logo_izq') {
        setPlantillaEdicion(prev => ({ ...prev, logo_izquierdo_url: base64 }));
      } else if (tipo === 'logo_der') {
        setPlantillaEdicion(prev => ({ ...prev, logo_derecho_url: base64 }));
      } else if (tipo === 'sello') {
        setPlantillaEdicion(prev => ({ ...prev, sello_humedo_url: base64 }));
      } else if (tipo === 'firma' && firmanteIdx !== undefined) {
        setPlantillaEdicion(prev => {
          const nuevosFirmantes = [...prev.firmantes];
          nuevosFirmantes[firmanteIdx].firma_digital_url = base64;
          return { ...prev, firmantes: nuevosFirmantes };
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // ──────────────────────────────────────────────────────────
  // GENERACIÓN DE TEXTO CON VARIABLES REEMPLAZADAS EN VIVO
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

    const nombreEscuelaTexto = est.codigo_escuela === 'lb' || plantillaEdicion.id_escuela === 'lb'
      ? 'Unidad Educativa "Libertador Bolívar"'
      : 'Unidad Educativa "Santa Bárbara"';

    const codigoDeaTexto = est.codigo_escuela === 'lb' || plantillaEdicion.id_escuela === 'lb'
      ? 'OD05280703'
      : 'OD05280702';

    const ano = new Date().getFullYear();
    const periodo = `${ano}-${ano + 1}`;
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const diaNum = new Date().getDate();
    const mesNom = meses[new Date().getMonth()];
    const fechaLetras = `${diaNum} días del mes de ${mesNom} de ${ano}`;

    let cuerpo = plantillaEdicion.cuerpo_texto || '';
    cuerpo = cuerpo.replace(/\{nombre_estudiante\}/g, `<b>${est.nombres_estudiante || ''} ${est.apellidos_estudiante || ''}</b>`);
    cuerpo = cuerpo.replace(/\{cedula_estudiante\}/g, `<b>${est.cedula_estudiante || 'N/A'}</b>`);
    cuerpo = cuerpo.replace(/\{grado_actual\}/g, `<b>${est.grado_actual || '1er Grado'}</b>`);
    cuerpo = cuerpo.replace(/\{seccion_actual\}/g, `<b>${est.seccion_actual || 'A'}</b>`);
    cuerpo = cuerpo.replace(/\{nivel_educativo\}/g, `<b>${est.nivel_educativo || 'Educación Primaria'}</b>`);
    cuerpo = cuerpo.replace(/\{nombre_escuela\}/g, `<b>${nombreEscuelaTexto}</b>`);
    cuerpo = cuerpo.replace(/\{codigo_dea\}/g, `<b>${codigoDeaTexto}</b>`);
    cuerpo = cuerpo.replace(/\{periodo_escolar\}/g, `<b>${periodo}</b>`);
    cuerpo = cuerpo.replace(/\{nombre_representante\}/g, `<b>${est.nombres_representante || ''} ${est.apellidos_representante || ''}</b>`);
    cuerpo = cuerpo.replace(/\{cedula_representante\}/g, `<b>${est.cedula_representante || 'N/A'}</b>`);
    cuerpo = cuerpo.replace(/\{fecha_hoy_letras\}/g, `<b>${fechaLetras}</b>`);

    let clausula = plantillaEdicion.clausula_cierre || '';
    clausula = clausula.replace(/\{fecha_hoy_letras\}/g, `<b>${fechaLetras}</b>`);
    clausula = clausula.replace(/\{nombre_escuela\}/g, `<b>${nombreEscuelaTexto}</b>`);

    let membrete3 = plantillaEdicion.membrete_linea3 || '';
    membrete3 = membrete3.replace(/\{nombre_escuela\}/g, nombreEscuelaTexto.toUpperCase());

    return {
      cuerpo,
      clausula,
      membrete3,
      codigoConstancia: `CI-${est.codigo_escuela ? est.codigo_escuela.toUpperCase() : 'SB'}-${est.cedula_estudiante}-${ano}`
    };
  }, [plantillaEdicion, estudianteSeleccionado]);

  // Descarga de PDF de Prueba
  const handleDescargarPdfPrueba = () => {
    if (!html2pdf) {
      if (Swal) Swal.fire('Aviso', 'El motor PDF está cargando.', 'info');
      return;
    }

    const element = previewRef.current;
    if (!element) return;

    const opt = {
      margin: 6,
      filename: `Constancia_Prueba_${plantillaEdicion.codigo_tipo}_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };

    if (Swal) {
      Swal.fire({
        title: 'Generando PDF de Prueba...',
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

  // Filtrado de estudiantes muestra en el buscador
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
                    ESTUDIO EDITORIAL Y DOCUMENTAL
                  </span>
                </div>
                
                <div className="d-flex align-items-center gap-2">
                  <button 
                    className="btn btn-sm btn-outline-light rounded-pill px-3 fw-bold"
                    onClick={handleRestaurarPredeterminados}
                    title="Restaurar a las plantillas predeterminadas del MPPE"
                  >
                    <i className="bi bi-arrow-counterclockwise me-1"></i>Restaurar Fábrica
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
                Editor y Diseñador de Constancias Oficiales
              </h2>
              <p className="text-white-50 m-0 fs-6" style={{ maxWidth: '850px' }}>
                Personaliza la estructura gráfica, textos, variables inteligentes, sellos y firmas digitales de todas las constancias emitidas por la institución con previsualización en vivo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Plantilla y Herramientas Superiores */}
      <div className="card bg-white shadow-sm border-0 rounded-4 p-3 mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ maxWidth: '600px' }}>
            <label className="small fw-bold text-muted text-nowrap m-0">
              <i className="bi bi-file-earmark-text-fill text-primary me-1"></i>Plantilla Activa:
            </label>
            <select 
              className="form-select form-select-sm border-info rounded-pill fw-bold"
              value={plantillaActivaId}
              onChange={(e) => seleccionarPlantilla(e.target.value)}
            >
              {plantillas.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.id_escuela === 'todas' ? 'Ambas Escuelas' : p.id_escuela.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button 
              className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold"
              onClick={handleCrearNuevaPlantilla}
            >
              <i className="bi bi-plus-lg me-1"></i>Crear Nueva Plantilla
            </button>
            <button 
              className="btn btn-sm btn-success rounded-pill px-3 fw-bold shadow-sm"
              onClick={handleDescargarPdfPrueba}
              title="Descargar prueba de la hoja en PDF"
            >
              <i className="bi bi-file-earmark-pdf-fill me-1"></i>Descargar PDF de Muestra
            </button>
          </div>
        </div>
      </div>

      {/* Área de Trabajo Dividida: Editor (Izquierda) + Vista Previa A4 (Derecha) */}
      <div className="row g-4">
        {/* PANEL IZQUIERDO: CONTROLES DEL EDITOR */}
        <div className="col-12 col-xl-6">
          <div className="card bg-white shadow-sm border-0 rounded-4 overflow-hidden h-100">
            {/* Navegación de Pestañas del Editor */}
            <div className="card-header bg-white border-bottom p-3">
              <div className="btn-group w-100 shadow-sm rounded-pill p-1 bg-light border" role="group">
                <button 
                  type="button" 
                  className={`btn btn-sm rounded-pill fw-bold ${tabEditor === 'grafica' ? 'btn-primary text-white shadow-sm' : 'btn-light text-dark'}`}
                  onClick={() => setTabEditor('grafica')}
                >
                  <i className="bi bi-brush me-1"></i> 1. Estructura Gráfica
                </button>
                <button 
                  type="button" 
                  className={`btn btn-sm rounded-pill fw-bold ${tabEditor === 'redaccion' ? 'btn-primary text-white shadow-sm' : 'btn-light text-dark'}`}
                  onClick={() => setTabEditor('redaccion')}
                >
                  <i className="bi bi-textarea-t me-1"></i> 2. Redacción & Tags
                </button>
                <button 
                  type="button" 
                  className={`btn btn-sm rounded-pill fw-bold ${tabEditor === 'firmas' ? 'btn-primary text-white shadow-sm' : 'btn-light text-dark'}`}
                  onClick={() => setTabEditor('firmas')}
                >
                  <i className="bi bi-pen-fill me-1"></i> 3. Firmas & Sello
                </button>
                <button 
                  type="button" 
                  className={`btn btn-sm rounded-pill fw-bold ${tabEditor === 'seguridad' ? 'btn-primary text-white shadow-sm' : 'btn-light text-dark'}`}
                  onClick={() => setTabEditor('seguridad')}
                >
                  <i className="bi bi-qr-code-scan me-1"></i> 4. Seguridad QR
                </button>
              </div>
            </div>

            <div className="card-body p-4" style={{ maxHeight: '720px', overflowY: 'auto' }}>
              {/* PESTAÑA 1: ESTRUCTURA GRÁFICA */}
              {tabEditor === 'grafica' && (
                <div className="animate__animated animate__fadeIn">
                  <h6 className="fw-bold text-dark mb-3">
                    <i className="bi bi-aspect-ratio text-primary me-2"></i>Identidad Visual y Membrete Oficial
                  </h6>

                  <div className="mb-3">
                    <label className="small fw-bold text-muted mb-1">Nombre de la Plantilla:</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm border-info rounded-pill"
                      value={plantillaEdicion.nombre}
                      onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, nombre: e.target.value })}
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="small fw-bold text-muted mb-1">Plantel / Escuela Asignada:</label>
                      <select 
                        className="form-select form-select-sm border-info rounded-pill"
                        value={plantillaEdicion.id_escuela}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, id_escuela: e.target.value })}
                      >
                        <option value="todas">Ambas Escuelas (Global)</option>
                        <option value="sb">U.E. Santa Bárbara</option>
                        <option value="lb">U.E. Libertador Bolívar</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="small fw-bold text-muted mb-1">Título del Documento:</label>
                      <input 
                        type="text" 
                        className="form-control form-control-sm border-info rounded-pill fw-bold"
                        value={plantillaEdicion.titulo_documento}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, titulo_documento: e.target.value })}
                      />
                    </div>
                  </div>

                  <hr className="text-muted" />

                  {/* Logos Oficiales */}
                  <h6 className="fw-bold text-dark mb-2">Logotipos del Encabezado</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-6">
                      <div className="p-3 border rounded-3 bg-light text-center">
                        <span className="small fw-bold text-muted d-block mb-2">Logo Izquierdo (Ministerio/Nacional)</span>
                        <img 
                          src={plantillaEdicion.logo_izquierdo_url || '/assets/img/logo_mppe.png'} 
                          alt="Logo Izquierdo" 
                          style={{ maxHeight: '55px', maxWidth: '100%' }}
                          className="mb-2"
                        />
                        <div>
                          <label className="btn btn-xs btn-outline-primary rounded-pill px-3 cursor-pointer">
                            <i className="bi bi-upload me-1"></i>Cambiar Logo Izq.
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="d-none" 
                              onChange={(e) => handleUploadImage(e, 'logo_izq')} 
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="p-3 border rounded-3 bg-light text-center">
                        <span className="small fw-bold text-muted d-block mb-2">Logo Derecho (Escuela)</span>
                        <img 
                          src={plantillaEdicion.logo_derecho_url || '/assets/img/logo_sb.png'} 
                          alt="Logo Derecho" 
                          style={{ maxHeight: '55px', maxWidth: '100%' }}
                          className="mb-2"
                        />
                        <div>
                          <label className="btn btn-xs btn-outline-primary rounded-pill px-3 cursor-pointer">
                            <i className="bi bi-upload me-1"></i>Cambiar Logo Der.
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="d-none" 
                              onChange={(e) => handleUploadImage(e, 'logo_der')} 
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Textos del Membrete */}
                  <h6 className="fw-bold text-dark mb-2">Líneas del Membrete Oficial</h6>
                  <div className="row g-2 mb-3">
                    <div className="col-12">
                      <input 
                        type="text" 
                        className="form-control form-control-sm"
                        placeholder="Línea 1 (República...)"
                        value={plantillaEdicion.membrete_linea1}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, membrete_linea1: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <input 
                        type="text" 
                        className="form-control form-control-sm"
                        placeholder="Línea 2 (Ministerio...)"
                        value={plantillaEdicion.membrete_linea2}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, membrete_linea2: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <input 
                        type="text" 
                        className="form-control form-control-sm font-monospace fw-bold"
                        placeholder="Línea 3 (Nombre de la Escuela o {nombre_escuela})"
                        value={plantillaEdicion.membrete_linea3}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, membrete_linea3: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <input 
                        type="text" 
                        className="form-control form-control-sm"
                        placeholder="Código DEA"
                        value={plantillaEdicion.membrete_codigo_dea}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, membrete_codigo_dea: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <input 
                        type="text" 
                        className="form-control form-control-sm"
                        placeholder="RIF Institucional"
                        value={plantillaEdicion.membrete_rif}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, membrete_rif: e.target.value })}
                      />
                    </div>
                  </div>

                  <hr className="text-muted" />

                  {/* Estilo de Marco y Marca de Agua */}
                  <h6 className="fw-bold text-dark mb-2">Bordes, Tipografía y Marca de Agua</h6>
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6">
                      <label className="small fw-bold text-muted mb-1">Estilo de Borde / Marco:</label>
                      <select 
                        className="form-select form-select-sm border-info rounded-pill"
                        value={plantillaEdicion.estilo_marco}
                        onChange={(e: any) => setPlantillaEdicion({ ...plantillaEdicion, estilo_marco: e.target.value })}
                      >
                        <option value="clasico_doble">Marco Clásico Doble Línea</option>
                        <option value="diplomatico">Marco Diplomático Formal</option>
                        <option value="simple">Borde Simple Sutil</option>
                        <option value="sin_marco">Sin Borde (Limpio)</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="small fw-bold text-muted mb-1">Color de Acento / Marco:</label>
                      <input 
                        type="color" 
                        className="form-control form-control-color w-100 rounded-pill"
                        value={plantillaEdicion.color_acento}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, color_acento: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="small fw-bold text-muted mb-1">Tipografía Principal:</label>
                      <select 
                        className="form-select form-select-sm border-info rounded-pill"
                        value={plantillaEdicion.fuente_familia}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, fuente_familia: e.target.value })}
                      >
                        <option value="'Times New Roman', serif">Times New Roman (Clásico Oficial)</option>
                        <option value="Georgia, serif">Georgia (Elegante Formal)</option>
                        <option value="'Segoe UI', Arial, sans-serif">Segoe UI / Arial (Moderno Limpio)</option>
                        <option value="'Garamond', serif">Garamond (Editorial Diplomático)</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="small fw-bold text-muted mb-1">Interlineado:</label>
                      <select 
                        className="form-select form-select-sm border-info rounded-pill"
                        value={plantillaEdicion.interlineado}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, interlineado: Number(e.target.value) })}
                      >
                        <option value="1.2">1.2 (Compacto)</option>
                        <option value="1.5">1.5 (Estándar Formal)</option>
                        <option value="1.8">1.8 (Espacioso)</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <div className="p-3 border rounded-3 bg-light">
                        <div className="form-check form-switch mb-2">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="switch-marca-agua"
                            checked={plantillaEdicion.mostrar_marca_agua}
                            onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, mostrar_marca_agua: e.target.checked })}
                          />
                          <label className="form-check-label fw-bold text-dark cursor-pointer" htmlFor="switch-marca-agua">
                            Mostrar Marca de Agua del Escudo al Centro
                          </label>
                        </div>
                        {plantillaEdicion.mostrar_marca_agua && (
                          <div>
                            <label className="small text-muted mb-1">
                              Opacidad de Marca de Agua: {Math.round(plantillaEdicion.opacidad_marca_agua * 100)}%
                            </label>
                            <input 
                              type="range" 
                              className="form-range" 
                              min="0.03" 
                              max="0.25" 
                              step="0.01"
                              value={plantillaEdicion.opacidad_marca_agua}
                              onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, opacidad_marca_agua: Number(e.target.value) })}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PESTAÑA 2: REDACCIÓN & VARIABLES INTELIGENTES */}
              {tabEditor === 'redaccion' && (
                <div className="animate__animated animate__fadeIn">
                  <h6 className="fw-bold text-dark mb-2">
                    <i className="bi bi-code-square text-primary me-2"></i>Variables Dinámicas Insertables
                  </h6>
                  <p className="small text-muted mb-3">
                    Haga clic en cualquiera de estos botones para insertar la etiqueta inteligente en la posición deseada del texto:
                  </p>

                  <div className="d-flex flex-wrap gap-1 mb-4 p-2 bg-light border rounded-3">
                    <button type="button" className="btn btn-xs btn-white border shadow-sm rounded-pill fw-bold text-primary" onClick={() => insertarTagEnCuerpo('{nombre_estudiante}')}>
                      + {`{nombre_estudiante}`}
                    </button>
                    <button type="button" className="btn btn-xs btn-white border shadow-sm rounded-pill fw-bold text-primary" onClick={() => insertarTagEnCuerpo('{cedula_estudiante}')}>
                      + {`{cedula_estudiante}`}
                    </button>
                    <button type="button" className="btn btn-xs btn-white border shadow-sm rounded-pill fw-bold text-primary" onClick={() => insertarTagEnCuerpo('{grado_actual}')}>
                      + {`{grado_actual}`}
                    </button>
                    <button type="button" className="btn btn-xs btn-white border shadow-sm rounded-pill fw-bold text-primary" onClick={() => insertarTagEnCuerpo('{seccion_actual}')}>
                      + {`{seccion_actual}`}
                    </button>
                    <button type="button" className="btn btn-xs btn-white border shadow-sm rounded-pill fw-bold text-primary" onClick={() => insertarTagEnCuerpo('{nivel_educativo}')}>
                      + {`{nivel_educativo}`}
                    </button>
                    <button type="button" className="btn btn-xs btn-white border shadow-sm rounded-pill fw-bold text-primary" onClick={() => insertarTagEnCuerpo('{nombre_escuela}')}>
                      + {`{nombre_escuela}`}
                    </button>
                    <button type="button" className="btn btn-xs btn-white border shadow-sm rounded-pill fw-bold text-primary" onClick={() => insertarTagEnCuerpo('{periodo_escolar}')}>
                      + {`{periodo_escolar}`}
                    </button>
                    <button type="button" className="btn btn-xs btn-white border shadow-sm rounded-pill fw-bold text-primary" onClick={() => insertarTagEnCuerpo('{nombre_representante}')}>
                      + {`{nombre_representante}`}
                    </button>
                    <button type="button" className="btn btn-xs btn-white border shadow-sm rounded-pill fw-bold text-primary" onClick={() => insertarTagEnCuerpo('{cedula_representante}')}>
                      + {`{cedula_representante}`}
                    </button>
                    <button type="button" className="btn btn-xs btn-white border shadow-sm rounded-pill fw-bold text-primary" onClick={() => insertarTagEnCuerpo('{fecha_hoy_letras}')}>
                      + {`{fecha_hoy_letras}`}
                    </button>
                  </div>

                  {/* Redacción del Cuerpo Principal */}
                  <div className="mb-3">
                    <label className="small fw-bold text-muted mb-1">Cuerpo Principal de la Constancia:</label>
                    <textarea 
                      className="form-control form-control-sm font-monospace"
                      rows={9}
                      value={plantillaEdicion.cuerpo_texto}
                      onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, cuerpo_texto: e.target.value })}
                      style={{ fontSize: '13px', lineHeight: '1.6' }}
                    />
                  </div>

                  {/* Cláusula de Cierre y Fecha */}
                  <div className="mb-3">
                    <label className="small fw-bold text-muted mb-1">Cláusula de Cierre y Lugar/Fecha:</label>
                    <textarea 
                      className="form-control form-control-sm font-monospace"
                      rows={3}
                      value={plantillaEdicion.clausula_cierre}
                      onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, clausula_cierre: e.target.value })}
                      style={{ fontSize: '13px' }}
                    />
                  </div>

                  {/* Pie de Página Institucional */}
                  <div className="mb-3">
                    <label className="small fw-bold text-muted mb-1">Pie de Página (Dirección, Teléfono, Correo):</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm"
                      value={plantillaEdicion.pie_pagina}
                      onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, pie_pagina: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* PESTAÑA 3: FIRMANTES, FIRMAS DIGITALES Y SELLO HÚMEDO */}
              {tabEditor === 'firmas' && (
                <div className="animate__animated animate__fadeIn">
                  <h6 className="fw-bold text-dark mb-2">
                    <i className="bi bi-pen-fill text-primary me-2"></i>Gestión de Firmantes y Sellos
                  </h6>
                  <p className="small text-muted mb-3">
                    Configura los directivos firmantes, carga sus firmas digitalizadas transparentes y el sello húmedo oficial.
                  </p>

                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-6">
                      <label className="small fw-bold text-muted mb-1">Disposición de las Firmas:</label>
                      <select 
                        className="form-select form-select-sm border-info rounded-pill"
                        value={plantillaEdicion.disposicion_firmas}
                        onChange={(e: any) => setPlantillaEdicion({ ...plantillaEdicion, disposicion_firmas: e.target.value })}
                      >
                        <option value="una_centrada">1 Firma Centrada (Director)</option>
                        <option value="dos_columnas">2 Firmas en Columnas (Director y Control de Estudios)</option>
                        <option value="tres_columnas">3 Firmas (Director, Control Estudios, Docente Guía)</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="p-2 border rounded-3 bg-light d-flex justify-content-between align-items-center">
                        <div>
                          <span className="small fw-bold text-dark d-block">Sello Húmedo Oficial</span>
                          <span className="text-muted" style={{ fontSize: '11px' }}>Sello redondo institucional</span>
                        </div>
                        <label className="btn btn-xs btn-outline-primary rounded-pill px-3 cursor-pointer m-0">
                          <i className="bi bi-upload me-1"></i>Subir Sello
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="d-none" 
                            onChange={(e) => handleUploadImage(e, 'sello')} 
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Listado de Firmantes */}
                  <h6 className="fw-bold text-dark mb-2">Firmantes Configurados ({plantillaEdicion.firmantes.length})</h6>
                  {plantillaEdicion.firmantes.map((firm, idx) => (
                    <div key={firm.id} className="card p-3 border rounded-4 bg-light mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge bg-primary rounded-pill px-3 py-1 fw-bold">
                          Firmante #{idx + 1}
                        </span>
                        <div className="form-check form-switch m-0">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id={`sw-firma-${idx}`}
                            checked={firm.mostrar_firma_digital}
                            onChange={(e) => {
                              const nuevos = [...plantillaEdicion.firmantes];
                              nuevos[idx].mostrar_firma_digital = e.target.checked;
                              setPlantillaEdicion({ ...plantillaEdicion, firmantes: nuevos });
                            }}
                          />
                          <label className="form-check-label small fw-bold text-muted cursor-pointer" htmlFor={`sw-firma-${idx}`}>
                            Mostrar Firma Digitalizada
                          </label>
                        </div>
                      </div>

                      <div className="row g-2 mb-2">
                        <div className="col-3">
                          <label className="small text-muted">Título:</label>
                          <input 
                            type="text" 
                            className="form-control form-control-sm"
                            placeholder="Prof. / Lcda."
                            value={firm.titulo}
                            onChange={(e) => {
                              const nuevos = [...plantillaEdicion.firmantes];
                              nuevos[idx].titulo = e.target.value;
                              setPlantillaEdicion({ ...plantillaEdicion, firmantes: nuevos });
                            }}
                          />
                        </div>
                        <div className="col-9">
                          <label className="small text-muted">Nombre y Apellido:</label>
                          <input 
                            type="text" 
                            className="form-control form-control-sm fw-bold"
                            value={firm.nombre}
                            onChange={(e) => {
                              const nuevos = [...plantillaEdicion.firmantes];
                              nuevos[idx].nombre = e.target.value;
                              setPlantillaEdicion({ ...plantillaEdicion, firmantes: nuevos });
                            }}
                          />
                        </div>
                        <div className="col-6">
                          <label className="small text-muted">Cargo Oficial:</label>
                          <input 
                            type="text" 
                            className="form-control form-control-sm"
                            value={firm.cargo}
                            onChange={(e) => {
                              const nuevos = [...plantillaEdicion.firmantes];
                              nuevos[idx].cargo = e.target.value;
                              setPlantillaEdicion({ ...plantillaEdicion, firmantes: nuevos });
                            }}
                          />
                        </div>
                        <div className="col-6">
                          <label className="small text-muted">Cédula de Identidad:</label>
                          <input 
                            type="text" 
                            className="form-control form-control-sm font-monospace"
                            value={firm.cedula}
                            onChange={(e) => {
                              const nuevos = [...plantillaEdicion.firmantes];
                              nuevos[idx].cedula = e.target.value;
                              setPlantillaEdicion({ ...plantillaEdicion, firmantes: nuevos });
                            }}
                          />
                        </div>
                      </div>

                      {/* Vista / Carga de la Firma Digitalizada */}
                      <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top">
                        <div className="d-flex align-items-center gap-2">
                          {firm.firma_digital_url ? (
                            <img src={firm.firma_digital_url} alt="Firma" style={{ height: '40px' }} className="border rounded p-1 bg-white" />
                          ) : (
                            <span className="small text-muted fst-italic">Sin imagen de firma cargada</span>
                          )}
                        </div>
                        <label className="btn btn-xs btn-outline-info rounded-pill px-3 cursor-pointer m-0">
                          <i className="bi bi-image me-1"></i>Subir Firma PNG
                          <input 
                            type="file" 
                            accept="image/png,image/jpeg" 
                            className="d-none" 
                            onChange={(e) => handleUploadImage(e, 'firma', idx)} 
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* PESTAÑA 4: SEGURIDAD Y CÓDIGO QR */}
              {tabEditor === 'seguridad' && (
                <div className="animate__animated animate__fadeIn">
                  <h6 className="fw-bold text-dark mb-2">
                    <i className="bi bi-shield-check text-primary me-2"></i>Seguridad y Validación Electrónica
                  </h6>
                  <p className="small text-muted mb-3">
                    Configuración de códigos QR de verificación pública para constancias emitidas.
                  </p>

                  <div className="p-3 border rounded-4 bg-light mb-3">
                    <div className="form-check form-switch mb-2">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="switch-qr"
                        checked={plantillaEdicion.mostrar_codigo_qr}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, mostrar_codigo_qr: e.target.checked })}
                      />
                      <label className="form-check-label fw-bold text-dark cursor-pointer" htmlFor="switch-qr">
                        Incluir Código QR de Validación Pública Oficial
                      </label>
                    </div>
                    <p className="small text-muted m-0">
                      Al ser escaneado por instituciones externas (bancos, consulados, ministerios), redirige automáticamente a la página pública de verificación de autenticidad del SIGAE.
                    </p>
                  </div>

                  <div className="p-3 border rounded-4 bg-light">
                    <div className="form-check form-switch mb-2">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="switch-hash"
                        checked={plantillaEdicion.mostrar_codigo_seguridad}
                        onChange={(e) => setPlantillaEdicion({ ...plantillaEdicion, mostrar_codigo_seguridad: e.target.checked })}
                      />
                      <label className="form-check-label fw-bold text-dark cursor-pointer" htmlFor="switch-hash">
                        Mostrar Hash / Serial Único de Control
                      </label>
                    </div>
                    <p className="small text-muted m-0">
                      Estampa un código alfanumérico único para auditoría e identificación rápida en secretaría.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: PROBADOR EN VIVO (LIVE A4 PREVIEW) */}
        <div className="col-12 col-xl-6">
          <div className="card bg-white shadow-sm border-0 rounded-4 overflow-hidden h-100">
            <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1.5 rounded-pill fw-bold">
                  <i className="bi bi-eye-fill me-1"></i> Vista Previa en Vivo (A4)
                </span>
              </div>

              {/* Selector de Estudiante Real para Probar */}
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

            {/* Hoja A4 Renderizada */}
            <div className="card-body p-4 bg-secondary-subtle d-flex justify-content-center align-items-start" style={{ maxHeight: '720px', overflowY: 'auto' }}>
              <div 
                ref={previewRef}
                className="bg-white shadow-lg position-relative transition-all"
                style={{
                  width: '100%',
                  maxWidth: '595px', // Formato A4
                  minHeight: '842px',
                  padding: '35px 40px',
                  fontFamily: plantillaEdicion.fuente_familia,
                  fontSize: `${plantillaEdicion.tamano_fuente}px`,
                  lineHeight: plantillaEdicion.interlineado,
                  color: '#1e293b',
                  transform: `scale(${zoomPreview / 100})`,
                  transformOrigin: 'top center',
                  border: plantillaEdicion.estilo_marco === 'clasico_doble' 
                    ? `4px double ${plantillaEdicion.color_acento}`
                    : plantillaEdicion.estilo_marco === 'diplomatico'
                    ? `2px solid ${plantillaEdicion.color_acento}`
                    : plantillaEdicion.estilo_marco === 'simple'
                    ? '1px solid #cbd5e1'
                    : 'none'
                }}
              >
                {/* Marca de Agua de Fondo */}
                {plantillaEdicion.mostrar_marca_agua && (
                  <div 
                    className="position-absolute top-50 start-50 translate-middle pointer-events-none text-center"
                    style={{
                      opacity: plantillaEdicion.opacidad_marca_agua,
                      zIndex: 0,
                      width: '320px'
                    }}
                  >
                    <img 
                      src={plantillaEdicion.logo_derecho_url || '/assets/img/logo_sb.png'} 
                      alt="Marca de agua" 
                      style={{ width: '100%', filter: 'grayscale(100%)' }}
                    />
                  </div>
                )}

                <div className="position-relative" style={{ zIndex: 1 }}>
                  {/* Encabezado con Membrete y Logos */}
                  <div className="d-flex justify-content-between align-items-center pb-2 mb-3 border-bottom" style={{ borderColor: plantillaEdicion.color_acento }}>
                    <img 
                      src={plantillaEdicion.logo_izquierdo_url || '/assets/img/logo_mppe.png'} 
                      alt="Logo MPPE" 
                      style={{ height: '48px', maxWidth: '85px', objectFit: 'contain' }}
                    />
                    
                    <div className="text-center px-2 flex-grow-1">
                      <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#475569', lineHeight: '1.2' }}>
                        {plantillaEdicion.membrete_linea1}
                      </div>
                      <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: '#475569', lineHeight: '1.2' }}>
                        {plantillaEdicion.membrete_linea2}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: plantillaEdicion.color_acento, marginTop: '2px', lineHeight: '1.2' }}>
                        {textoProcesado.membrete3}
                      </div>
                      <div style={{ fontSize: '8.5px', color: '#64748b', marginTop: '1px' }}>
                        {plantillaEdicion.membrete_codigo_dea} | {plantillaEdicion.membrete_rif}
                      </div>
                    </div>

                    <img 
                      src={plantillaEdicion.logo_derecho_url || '/assets/img/logo_sb.png'} 
                      alt="Logo Escuela" 
                      style={{ height: '48px', maxWidth: '85px', objectFit: 'contain' }}
                    />
                  </div>

                  {/* Título Principal del Documento */}
                  <div className="text-center my-4">
                    <h4 
                      className="m-0 fw-bold text-uppercase d-inline-block px-3 py-1"
                      style={{
                        letterSpacing: '1.5px',
                        borderBottom: `2px solid ${plantillaEdicion.color_acento}`,
                        color: '#0f172a'
                      }}
                    >
                      {plantillaEdicion.titulo_documento}
                    </h4>
                  </div>

                  {/* Cuerpo del Documento con Justificación */}
                  <div 
                    className="mb-4 text-justify"
                    style={{ textAlign: 'justify', textJustify: 'inter-word' }}
                    dangerouslySetInnerHTML={{ __html: textoProcesado.cuerpo.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>') }}
                  />

                  {/* Cláusula de Cierre */}
                  <div 
                    className="mb-5 text-justify"
                    style={{ textAlign: 'justify' }}
                    dangerouslySetInnerHTML={{ __html: textoProcesado.clausula }}
                  />

                  {/* Bloque de Firmas y Sello */}
                  <div className="mt-5 pt-3">
                    <div className={`row align-items-end ${plantillaEdicion.disposicion_firmas === 'una_centrada' ? 'justify-content-center' : 'justify-content-between'}`}>
                      {plantillaEdicion.firmantes.map((firm, idx) => (
                        <div 
                          key={firm.id} 
                          className={`text-center ${plantillaEdicion.disposicion_firmas === 'una_centrada' ? 'col-8' : plantillaEdicion.disposicion_firmas === 'tres_columnas' ? 'col-4' : 'col-5'}`}
                        >
                          <div className="position-relative d-inline-block w-100" style={{ minHeight: '60px' }}>
                            {/* Firma Digitalizada si está activa */}
                            {firm.mostrar_firma_digital && firm.firma_digital_url && (
                              <img 
                                src={firm.firma_digital_url} 
                                alt="Firma" 
                                className="position-absolute start-50 translate-middle-x"
                                style={{ bottom: '5px', maxHeight: '55px', zIndex: 2 }}
                              />
                            )}
                            
                            {/* Sello Húmedo si está en la primera firma */}
                            {idx === 0 && plantillaEdicion.mostrar_sello_humedo && plantillaEdicion.sello_humedo_url && (
                              <img 
                                src={plantillaEdicion.sello_humedo_url} 
                                alt="Sello" 
                                className="position-absolute end-0"
                                style={{ bottom: '-10px', maxHeight: '65px', opacity: 0.85, zIndex: 1 }}
                              />
                            )}
                          </div>

                          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '4px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{firm.titulo} {firm.nombre}</div>
                            <div style={{ fontSize: '9.5px', color: '#475569' }}>{firm.cargo}</div>
                            <div style={{ fontSize: '9px', color: '#64748b' }}>{firm.cedula}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sección de Validación QR y Hash al Pie */}
                  {(plantillaEdicion.mostrar_codigo_qr || plantillaEdicion.mostrar_codigo_seguridad) && (
                    <div className="d-flex justify-content-between align-items-center mt-5 pt-3 border-top" style={{ fontSize: '8.5px', color: '#64748b' }}>
                      <div className="d-flex align-items-center gap-2">
                        {plantillaEdicion.mostrar_codigo_qr && (
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://sigae.app/validar-constancia/${textoProcesado.codigoConstancia}`)}&bgcolor=ffffff&color=0f172a&margin=1`}
                            alt="Código QR Oficial" 
                            style={{ width: '42px', height: '42px' }}
                            className="border p-0.5 rounded"
                          />
                        )}
                        <div>
                          <div className="fw-bold text-dark">DOCUMENTO OFICIAL VERIFICABLE EN LÍNEA</div>
                          <div>Escanee el código QR para validar la autenticidad en el portal oficial SIGAE.</div>
                          {plantillaEdicion.mostrar_codigo_seguridad && (
                            <div className="font-monospace text-primary fw-bold mt-0.5">SERIAL: {textoProcesado.codigoConstancia}</div>
                          )}
                        </div>
                      </div>

                      <div className="text-end">
                        <div>Válido para el Año Escolar en Curso</div>
                        <div className="fw-bold text-dark">SIGAE v1.0.2</div>
                      </div>
                    </div>
                  )}

                  {/* Pie de Página Institucional */}
                  {plantillaEdicion.pie_pagina && (
                    <div className="text-center mt-3 pt-2 text-muted" style={{ fontSize: '8px', borderTop: '1px dashed #e2e8f0' }}>
                      {plantillaEdicion.pie_pagina}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorConstancias;
