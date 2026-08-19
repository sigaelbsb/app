import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '../../lib/supabase';
import { usePermisos } from '../../hooks/usePermisos';
import { auditar } from '../../lib/audit';
import * as XLSX from 'xlsx';

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

export const calcularAvanceActualizacion = (item: any) => {
  const d = item.datos_actualizados || {};
  const fecha = item.fecha_ultima_actualizacion;

  const secciones = [
    {
      id: 'rep',
      nombre: 'Datos del Representante',
      icono: 'bi-person-badge',
      ok: Boolean((d.representante_nombres || item.nombres_representante) && (d.representante_cedula || item.cedula_representante) && (d.representante_telefono || d.representante_email))
    },
    {
      id: 'est',
      nombre: 'Datos del Estudiante',
      icono: 'bi-mortarboard',
      ok: Boolean((d.estudiante_nombres || item.nombres_estudiante) && (d.estudiante_apellidos || item.apellidos_estudiante) && d.estudiante_fecha_nacimiento && d.estudiante_sexo)
    },
    {
      id: 'dir',
      nombre: 'Ubicación y Vivienda',
      icono: 'bi-geo-alt',
      ok: Boolean(d.estado_habitacion && d.direccion_habitacion)
    },
    {
      id: 'salud',
      nombre: 'Salud y Antropometría',
      icono: 'bi-heart-pulse',
      ok: Boolean(d.estudiante_grupo_sanguineo || d.talla_franela || d.peso_kg)
    },
    {
      id: 'madre',
      nombre: 'Datos de la Madre',
      icono: 'bi-gender-female',
      ok: Boolean(d.madre_nombres && d.madre_cedula)
    },
    {
      id: 'padre',
      nombre: 'Datos del Padre',
      icono: 'bi-gender-male',
      ok: d.estudiante_reconocido_por_padre === 'No' || Boolean(d.padre_nombres && d.padre_cedula)
    },
    {
      id: 'socio',
      nombre: 'Socioeconómico y Servicios',
      icono: 'bi-house-check',
      ok: Boolean(d.posee_computadora || d.tipo_vivienda || d.estudiante_con_quien_vive)
    },
    {
      id: 'confirmado',
      nombre: 'Ficha Confirmada / Emitida',
      icono: 'bi-file-earmark-check',
      ok: Boolean(fecha)
    }
  ];

  const completadas = secciones.filter(s => s.ok).length;
  const porcentaje = Math.round((completadas / secciones.length) * 100);

  let estado: 'sin_iniciar' | 'en_proceso' | 'completado' = 'sin_iniciar';
  let badgeColor = 'secondary';
  let badgeText = 'Sin Iniciar';
  let progressColor = 'bg-secondary';

  if (fecha && porcentaje >= 85) {
    estado = 'completado';
    badgeColor = 'success';
    badgeText = 'Completado';
    progressColor = 'bg-success';
  } else if (porcentaje > 0 || fecha) {
    estado = 'en_proceso';
    badgeColor = 'warning';
    badgeText = 'En Proceso';
    progressColor = 'bg-warning';
  }

  return {
    porcentaje,
    completadas,
    total: secciones.length,
    secciones,
    estado,
    badgeColor,
    badgeText,
    progressColor,
    fechaUltima: fecha ? new Date(fecha).toLocaleDateString('es-VE') : null
  };
};

export const VincularEstudiante: React.FC = () => {
  const { user } = usePermisos();
  const [activeTab, setActiveTab] = useState<'individual' | 'masiva' | 'directorio'>('individual');
  const [escuelaFiltro, setEscuelaFiltro] = useState<string>(localStorage.getItem('sigae_escuela_codigo') || 'sb');
  const [loading, setLoading] = useState<boolean>(false);
  const [vinculaciones, setVinculaciones] = useState<any[]>([]);
  const [busquedaDir, setBusquedaDir] = useState<string>('');
  const [gradoFiltroDir, setGradoFiltroDir] = useState<string>('Todos');
  const [avanceFiltroDir, setAvanceFiltroDir] = useState<string>('Todos');
  const [paginaActualDir, setPaginaActualDir] = useState(1);
  const elementosPorPaginaDir = 50;
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [gradosDB, setGradosDB] = useState<string[]>([]);

  // Estados para Edición
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [estudianteEditando, setEstudianteEditando] = useState<any | null>(null);

  // Estados para Modal de Avance de Actualización
  const [showAvanceModal, setShowAvanceModal] = useState<boolean>(false);
  const [estudianteAvanceModal, setEstudianteAvanceModal] = useState<any | null>(null);

  // Estados para Modal de Estadísticas y Reportes
  const [showEstadisticasModal, setShowEstadisticasModal] = useState<boolean>(false);
  const [escuelaReporte, setEscuelaReporte] = useState<'ambas' | 'sb' | 'lb'>('ambas');
  const [criterioAgrupacion, setCriterioAgrupacion] = useState<'general' | 'niveles' | 'grados' | 'secciones' | 'semaforo'>('grados');
  const [tipoGrafico, setTipoGrafico] = useState<'dossier' | 'anillos' | 'torta' | 'picos' | 'barras' | 'radar' | 'tacometro' | 'tabla'>('dossier');
  const [generandoPDF, setGenerandoPDF] = useState<boolean>(false);

  // Estados para Reasignar / Transferir Representante
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [estudiantesATransferir, setEstudiantesATransferir] = useState<any[]>([]);
  const [cedulaNuevoRep, setCedulaNuevoRep] = useState<string>('');
  const [nuevoRepEncontrado, setNuevoRepEncontrado] = useState<any | null>(null);
  const [buscandoNuevoRep, setBuscandoNuevoRep] = useState<boolean>(false);
  const [transferirHermanos, setTransferirHermanos] = useState<boolean>(true);
  const [hermanosDetectados, setHermanosDetectados] = useState<any[]>([]);

  // Estados para Formulario Individual
  const [cedulaRepBuscar, setCedulaRepBuscar] = useState<string>('');
  const [repEncontrado, setRepEncontrado] = useState<any | null>(null);
  const [buscandoRep, setBuscandoRep] = useState<boolean>(false);
  
  const [formInd, setFormInd] = useState({
    cedula_estudiante: '',
    nombres_estudiante: '',
    apellidos_estudiante: '',
    grado_actual: 'Sin Grado Asignado',
    seccion_actual: 'A',
    codigo_escuela: localStorage.getItem('sigae_escuela_codigo') || 'sb'
  });

  // Estados para Carga Masiva
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [previewValidos, setPreviewValidos] = useState<any[]>([]);
  const [previewRechazados, setPreviewRechazados] = useState<any[]>([]);
  const [procesadoMasivo, setProcesadoMasivo] = useState<boolean>(false);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    if (activeTab === 'directorio') {
      cargarVinculaciones();
    }
  }, [activeTab]);

  useEffect(() => {
    setPaginaActualDir(1);
  }, [escuelaFiltro, busquedaDir, gradoFiltroDir, avanceFiltroDir]);

  const cargarCatalogos = async () => {
    try {
      const { data } = await supabase.from('conf_grados').select('valor').order('orden', { ascending: true });
      if (data) {
        setGradosDB(data.map(g => g.valor));
      }
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
    }
  };

  const cargarVinculaciones = async () => {
    setLoading(true);
    setSeleccionados([]);
    try {
      let todosLosDatos: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('estudiantes_vinculaciones')
          .select('*')
          .order('created_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          todosLosDatos = [...todosLosDatos, ...data];
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      setVinculaciones(todosLosDatos);
    } catch (err: any) {
      console.error('Error al cargar vinculaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Buscar Representante en tabla usuarios
  const buscarRepresentante = async () => {
    if (!cedulaRepBuscar.trim()) return;
    setBuscandoRep(true);
    setRepEncontrado(null);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('cedula, nombre_completo, rol, id_escuela')
        .eq('cedula', cedulaRepBuscar.trim())
        .single();

      if (error || !data) {
        if ((window as any).Swal) {
          (window as any).Swal.fire('No encontrado', `No existe un usuario con la cédula ${cedulaRepBuscar}. Por favor regístrelo primero en Gestión de Usuarios.`, 'warning');
        } else {
          alert(`No existe un usuario con la cédula ${cedulaRepBuscar}`);
        }
      } else {
        // Separar nombre_completo en nombres y apellidos aproximados o guardarlo
        const partes = (data.nombre_completo || '').trim().split(' ');
        let nom = data.nombre_completo;
        let ape = '';
        if (partes.length >= 2) {
          nom = partes.slice(0, Math.ceil(partes.length / 2)).join(' ');
          ape = partes.slice(Math.ceil(partes.length / 2)).join(' ');
        }
        setRepEncontrado({
          cedula: data.cedula,
          nombres: nom,
          apellidos: ape,
          nombre_completo: data.nombre_completo,
          rol: data.rol
        });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setBuscandoRep(false);
    }
  };

  const handleGuardarIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repEncontrado) {
      alert('Debe buscar y seleccionar un representante válido.');
      return;
    }
    if (!formInd.cedula_estudiante.trim() || !formInd.nombres_estudiante.trim() || !formInd.apellidos_estudiante.trim()) {
      alert('Por favor complete todos los datos del estudiante.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        codigo_escuela: formInd.codigo_escuela,
        cedula_representante: repEncontrado.cedula,
        nombres_representante: repEncontrado.nombres || repEncontrado.nombre_completo,
        apellidos_representante: repEncontrado.apellidos || '',
        cedula_estudiante: formInd.cedula_estudiante.trim().toUpperCase(),
        nombres_estudiante: toTitulo(formInd.nombres_estudiante.trim()),
        apellidos_estudiante: toTitulo(formInd.apellidos_estudiante.trim()),
        grado_actual: formInd.grado_actual,
        seccion_actual: formInd.seccion_actual,
        estado: 'Activo',
        creado_por: user?.cedula || 'Admin'
      };

      const { error } = await supabase
        .from('estudiantes_vinculaciones')
        .upsert([payload], { onConflict: 'cedula_estudiante' });

      if (error) throw error;

      if ((window as any).Swal) {
        (window as any).Swal.fire('¡Éxito!', `Estudiante ${payload.nombres_estudiante} vinculado al representante C.I. ${payload.cedula_representante}`, 'success');
      } else {
        alert('Vinculación exitosa');
      }

      auditar('Vincular Estudiante', 'Vinculación Individual', `Asignó estudiante ${payload.cedula_estudiante} a C.I. ${payload.cedula_representante}`);
      
      setFormInd({
        cedula_estudiante: '',
        nombres_estudiante: '',
        apellidos_estudiante: '',
        grado_actual: 'Sin Grado Asignado',
        seccion_actual: 'A',
        codigo_escuela: localStorage.getItem('sigae_escuela_codigo') || 'sb'
      });
      setRepEncontrado(null);
      setCedulaRepBuscar('');
    } catch (err: any) {
      console.error(err);
      if ((window as any).Swal) {
        (window as any).Swal.fire('Error', `No se pudo guardar la vinculación: ${err.message || 'Error de BD'}`, 'error');
      } else {
        alert('Error al guardar: ' + (err.message || 'Error de BD'));
      }
    } finally {
      setLoading(false);
    }
  };

  const descargarPlantillaExcel = () => {
    const wsData = [
      ['Cédula_Representante', 'Cédula_Estudiante', 'Nombres_Estudiante', 'Apellidos_Estudiante', 'Escuela(sb/lb)', 'Grado_a_Cursar', 'Seccion'],
      ['12345678', 'CE11223344', 'Carlos Andrés', 'Mendoza Silva', 'sb', '1er Grado', 'A'],
      ['18765432', 'CE55667788', 'María Fernanda', 'Rodríguez López', 'lb', '2do Grado', 'B']
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Modelo Vinculación");
    XLSX.writeFile(wb, "Plantilla_Modelo_Vinculacion_Estudiantes_SIGAE.xlsx");
  };

  const descargarPlantillaCSV = () => {
    let csvContent = "Cédula_Representante;Cédula_Estudiante;Nombres_Estudiante;Apellidos_Estudiante;Escuela(sb/lb);Grado_a_Cursar;Seccion\n";
    csvContent += "12345678;CE11223344;Carlos Andrés;Mendoza Silva;sb;1er Grado;A\n";
    csvContent += "18765432;CE55667788;María Fernanda;Rodríguez López;lb;2do Grado;B\n";
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Plantilla_Modelo_Vinculacion_Estudiantes_SIGAE.csv";
    link.click();
  };

  // 2. Procesar archivo Excel (.xlsx/.xls/.ods) o CSV para previsualización
  const handleProcesarArchivoCSV = async () => {
    if (!csvFile) return;
    setLoading(true);
    setProcesadoMasivo(false);
    
    // Obtener todas las cédulas de los usuarios en BD para verificar en lotes
    const { data: usuariosBD } = await supabase.from('usuarios').select('cedula, nombre_completo');
    const mapaUsuarios = new Map<string, string>();
    (usuariosBD || []).forEach((u: any) => {
      mapaUsuarios.set(String(u.cedula).trim(), u.nombre_completo);
    });

    const procesarFilas = (rows: any[][]) => {
      const validos: any[] = [];
      const rechazados: any[] = [];
      const cedulasEnArchivo = new Set<string>();

      let startIndex = 0;
      if (rows.length > 0) {
        const firstRowStr = rows[0].map(c => String(c || '').toLowerCase()).join(' ');
        if (firstRowStr.includes('cedula') || firstRowStr.includes('estudiante') || firstRowStr.includes('cédula')) {
          startIndex = 1;
        }
      }

      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || row.every(cell => !cell || String(cell).trim() === '')) continue;

        if (row.length < 4) {
          rechazados.push({ linea: i + 1, datos: row.join(' ; '), motivo: 'Faltan columnas (Se requieren mínimo 4: Cédula Rep, Cédula Est, Nombres Est, Apellidos Est).' });
          continue;
        }

        const cedRep = String(row[0] || '').trim();
        const cedEst = String(row[1] || '').trim().toUpperCase();
        const nomEst = toTitulo(String(row[2] || '').trim());
        const apeEst = toTitulo(String(row[3] || '').trim());
        const esc = String(row[4] || 'sb').trim().toLowerCase();
        const grado = String(row[5] || '').trim() || 'Sin Grado Asignado';
        const seccion = String(row[6] || '').trim() || 'Sin Asignar';

        if (!cedRep || !cedEst || !nomEst || !apeEst) {
          rechazados.push({ linea: i + 1, datos: row.join(' ; '), motivo: 'Cédulas, Nombres o Apellidos están vacíos.' });
          continue;
        }

        if (cedulasEnArchivo.has(cedEst)) {
          rechazados.push({ linea: i + 1, datos: row.join(' ; '), motivo: `El estudiante con cédula '${cedEst}' está repetido en este mismo archivo. Se omitió para evitar conflicto.` });
          continue;
        }
        cedulasEnArchivo.add(cedEst);

        const nomCompletoRep = mapaUsuarios.get(cedRep);
        if (!nomCompletoRep) {
          rechazados.push({ linea: i + 1, datos: row.join(' ; '), motivo: `El representante C.I. '${cedRep}' no está registrado en el sistema (Gestión de Usuarios).` });
          continue;
        }

        const partes = nomCompletoRep.split(' ');
        let nomRep = nomCompletoRep;
        let apeRep = '';
        if (partes.length >= 2) {
          nomRep = partes.slice(0, Math.ceil(partes.length / 2)).join(' ');
          apeRep = partes.slice(Math.ceil(partes.length / 2)).join(' ');
        }

        validos.push({
          codigo_escuela: esc === 'lb' ? 'lb' : 'sb',
          cedula_representante: cedRep,
          nombres_representante: nomRep,
          apellidos_representante: apeRep,
          cedula_estudiante: cedEst,
          nombres_estudiante: nomEst,
          apellidos_estudiante: apeEst,
          grado_actual: grado,
          seccion_actual: seccion,
          estado: 'Activo',
          creado_por: user?.cedula || 'Admin'
        });
      }

      setPreviewValidos(validos);
      setPreviewRechazados(rechazados);
      setProcesadoMasivo(true);
      setLoading(false);
    };

    const isExcelOrOds = csvFile.name.endsWith('.xlsx') || csvFile.name.endsWith('.xls') || csvFile.name.endsWith('.ods');
    if (isExcelOrOds) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
          procesarFilas(rows);
        } catch (err: any) {
          console.error(err);
          alert('Error al leer el archivo Excel / Linux (.xlsx/.ods)');
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(csvFile);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          if (!text) { setLoading(false); return; }
          const lines = text.split(/\r?\n/);
          const rows = lines.map(line => line.split(/[;,]/));
          procesarFilas(rows);
        } catch (err: any) {
          console.error(err);
          alert('Error al leer archivo CSV');
          setLoading(false);
        }
      };
      reader.readAsText(csvFile);
    }
  };

  const handleConfirmarCargaMasiva = async () => {
    if (previewValidos.length === 0) return;
    setLoading(true);
    let insertados = 0;
    try {
      // Upsert en lotes (chunks) para evitar timeouts y problemas con payloads muy grandes
      const CHUNK_SIZE = 500;
      for (let i = 0; i < previewValidos.length; i += CHUNK_SIZE) {
        const chunk = previewValidos.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase
          .from('estudiantes_vinculaciones')
          .upsert(chunk, { onConflict: 'cedula_estudiante' });

        if (error) throw error;
        insertados += chunk.length;
      }

      if ((window as any).Swal) {
        (window as any).Swal.fire('Carga Masiva Completada', `Se vincularon o actualizaron con éxito ${insertados} estudiantes.`, 'success');
      } else {
        alert(`Se vincularon ${insertados} estudiantes con éxito.`);
      }

      auditar('Vincular Estudiante', 'Carga Masiva', `Vinculados ${previewValidos.length} registros. Rechazados: ${previewRechazados.length}`);
      
      setPreviewValidos([]);
      setPreviewRechazados([]);
      setCsvFile(null);
      setProcesadoMasivo(false);
    } catch (err: any) {
      console.error(err);
      if ((window as any).Swal) {
        (window as any).Swal.fire('Error en BD', err.message || 'Falla durante inserción por lotes.', 'error');
      } else {
        alert('Error en BD: ' + (err.message || 'Falla en inserción'));
      }
    } finally {
      setLoading(false);
    }
  };

  const descargarRechazados = () => {
    if (previewRechazados.length === 0) return;
    let csvContent = "Linea,Datos Originales,Motivo del Rechazo\n";
    previewRechazados.forEach(r => {
      csvContent += `${r.linea},"${r.datos.replace(/"/g, '""')}","${r.motivo.replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `errores_vinculacion_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDesvincular = async (id: string, nombre: string) => {
    let confirmado = false;
    if ((window as any).Swal) {
      const result = await (window as any).Swal.fire({
        title: '¿Está seguro?',
        text: `¿Desea desvincular o eliminar al estudiante ${nombre}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });
      confirmado = result.isConfirmed;
    } else {
      confirmado = window.confirm(`¿Está seguro de desvincular o eliminar al estudiante ${nombre}?`);
    }

    if (!confirmado) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('estudiantes_vinculaciones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setVinculaciones(prev => prev.filter(v => v.id !== id));
      setSeleccionados(prev => prev.filter(sel => sel !== id));
      auditar('Vincular Estudiante', 'Desvincular Estudiante', `Eliminada vinculación del estudiante ID ${id}`);
    } catch (err: any) {
      console.error(err);
      alert('No se pudo desvincular: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSeleccion = (id: string) => {
    setSeleccionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleAbrirTransferencia = (estudiantes: any[]) => {
    if (!estudiantes || estudiantes.length === 0) return;
    setEstudiantesATransferir(estudiantes);
    setCedulaNuevoRep('');
    setNuevoRepEncontrado(null);
    setTransferirHermanos(true);

    // Detectar si hay hermanitos vinculados al mismo representante anterior que no estén en la lista
    const idsEst = estudiantes.map(e => e.id);
    const cedulasRepAnterior = Array.from(new Set(estudiantes.map(e => e.cedula_representante).filter(Boolean)));
    
    if (cedulasRepAnterior.length === 1) {
      const cedRep = cedulasRepAnterior[0];
      const hermanitos = vinculaciones.filter(v => v.cedula_representante === cedRep && !idsEst.includes(v.id));
      setHermanosDetectados(hermanitos);
    } else {
      setHermanosDetectados([]);
    }

    setShowTransferModal(true);
  };

  const buscarNuevoRepresentante = async () => {
    if (!cedulaNuevoRep.trim()) return;
    setBuscandoNuevoRep(true);
    setNuevoRepEncontrado(null);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('cedula, nombre_completo, rol, id_escuela, telefono, email')
        .eq('cedula', cedulaNuevoRep.trim())
        .maybeSingle();

      if (error || !data) {
        if ((window as any).Swal) {
          (window as any).Swal.fire({
            icon: 'warning',
            title: 'Representante no encontrado',
            html: `No existe ningún usuario registrado con la cédula <strong>${cedulaNuevoRep}</strong>.<br/><br/>Por favor regístrelo previamente en <strong>Gestión de Usuarios</strong> o verifique el número ingresado.`,
            confirmButtonColor: '#3b82f6'
          });
        } else {
          alert(`No existe ningún usuario con la cédula ${cedulaNuevoRep}`);
        }
      } else {
        setNuevoRepEncontrado(data);
      }
    } catch (err: any) {
      console.error('Error buscando nuevo representante:', err);
    } finally {
      setBuscandoNuevoRep(false);
    }
  };

  const handleEjecutarTransferencia = async () => {
    const Swal = (window as any).Swal;
    if (!nuevoRepEncontrado) {
      if (Swal) Swal.fire('Atención', 'Debe buscar y seleccionar al nuevo representante legal.', 'warning');
      return;
    }

    let idsTarget = estudiantesATransferir.map(e => e.id);
    if (transferirHermanos && hermanosDetectados.length > 0) {
      const hermanosIds = hermanosDetectados.map(h => h.id);
      idsTarget = Array.from(new Set([...idsTarget, ...hermanosIds]));
    }

    setLoading(true);
    try {
      const nuevoNombreRep = nuevoRepEncontrado.nombre_completo || `${nuevoRepEncontrado.nombres || ''} ${nuevoRepEncontrado.apellidos || ''}`.trim();
      const partes = nuevoNombreRep.split(' ');
      const repNombres = partes.slice(0, Math.ceil(partes.length / 2)).join(' ');
      const repApellidos = partes.slice(Math.ceil(partes.length / 2)).join(' ');

      for (const estId of idsTarget) {
        const estActual = vinculaciones.find(v => v.id === estId) || estudiantesATransferir.find(e => e.id === estId);
        let datosAct = estActual?.datos_actualizados;
        if (datosAct && typeof datosAct === 'object') {
          datosAct = {
            ...datosAct,
            representante_cedula: nuevoRepEncontrado.cedula,
            representante_nombres: repNombres,
            representante_apellidos: repApellidos,
            representante_email: nuevoRepEncontrado.email || datosAct.representante_email || '',
            representante_telefono: nuevoRepEncontrado.telefono || datosAct.representante_telefono || ''
          };
        }

        const { error } = await supabase
          .from('estudiantes_vinculaciones')
          .update({
            cedula_representante: nuevoRepEncontrado.cedula,
            nombres_representante: repNombres,
            apellidos_representante: repApellidos,
            ...(datosAct ? { datos_actualizados: datosAct } : {})
          })
          .eq('id', estId);

        if (error) throw error;
      }

      auditar('Vincular Estudiante', 'Transferir Representante', `Transferidos ${idsTarget.length} estudiante(s) a nuevo representante C.I. ${nuevoRepEncontrado.cedula} (${nuevoNombreRep})`);

      setVinculaciones(prev => prev.map(v => {
        if (idsTarget.includes(v.id)) {
          let datosAct = v.datos_actualizados;
          if (datosAct && typeof datosAct === 'object') {
            datosAct = {
              ...datosAct,
              representante_cedula: nuevoRepEncontrado.cedula,
              representante_nombres: repNombres,
              representante_apellidos: repApellidos
            };
          }
          return {
            ...v,
            cedula_representante: nuevoRepEncontrado.cedula,
            nombres_representante: repNombres,
            apellidos_representante: repApellidos,
            datos_actualizados: datosAct
          };
        }
        return v;
      }));

      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Transferencia Exitosa!',
          text: `Se reasignaron con éxito ${idsTarget.length} estudiante(s) al representante ${nuevoNombreRep} (C.I. ${nuevoRepEncontrado.cedula}).`,
          confirmButtonColor: '#16a34a'
        });
      }

      setShowTransferModal(false);
      setEstudiantesATransferir([]);
      setNuevoRepEncontrado(null);
      setCedulaNuevoRep('');
      setHermanosDetectados([]);
      setTransferirHermanos(true);
      setSeleccionados([]);
    } catch (err: any) {
      console.error(err);
      if (Swal) Swal.fire('Error', 'No se pudo completar la transferencia: ' + (err.message || 'Error de BD'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirEdicion = (estudiante: any) => {
    setEstudianteEditando({ ...estudiante });
    setShowEditModal(true);
  };

  const handleAbrirAvance = (estudiante: any) => {
    setEstudianteAvanceModal(estudiante);
    setShowAvanceModal(true);
  };

  const handleResetearActualizacion = async (estudiante: any) => {
    const Swal = (window as any).Swal;
    const nombre = toTitulo(`${estudiante.nombres_estudiante} ${estudiante.apellidos_estudiante}`);
    const cedula = estudiante.cedula_estudiante;

    let confirmado = false;
    if (Swal) {
      const result = await Swal.fire({
        title: '¿Resetear Actualización de Datos?',
        html: `¿Estás seguro de que deseas reiniciar la ficha de actualización de <strong>${nombre}</strong> (C.I. ${cedula})?<br/><br/><div class="alert alert-warning text-start py-2 px-3 small border-0"><i class="bi bi-exclamation-triangle-fill me-1"></i> Se borrarán los datos cargados en su ficha integral y el estado volverá a <strong>Sin Iniciar / Pendiente</strong> para que el representante pueda volver a llenarla desde cero.</div>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, resetear ficha',
        cancelButtonText: 'Cancelar'
      });
      confirmado = result.isConfirmed;
    } else {
      confirmado = window.confirm(`¿Está seguro de reiniciar la ficha de actualización de ${nombre}?`);
    }

    if (!confirmado) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('estudiantes_vinculaciones')
        .update({
          datos_actualizados: null,
          fecha_ultima_actualizacion: null
        })
        .eq('id', estudiante.id);

      if (error) throw error;

      const payloadReset = { datos_actualizados: null, fecha_ultima_actualizacion: null };
      setVinculaciones(prev => prev.map(v => v.id === estudiante.id ? { ...v, ...payloadReset } : v));
      
      if (estudianteAvanceModal && estudianteAvanceModal.id === estudiante.id) {
        setEstudianteAvanceModal((prev: any) => prev ? { ...prev, ...payloadReset } : null);
      }

      auditar('Vincular Estudiante', 'Resetear Actualización', `Se restableció la ficha de actualización del estudiante ${nombre} (C.I. ${cedula})`);

      if (Swal) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Ficha de ${nombre} reseteada exitosamente.`,
          showConfirmButton: false,
          timer: 2500
        });
      } else {
        alert(`Ficha de ${nombre} reseteada exitosamente.`);
      }
    } catch (err: any) {
      console.error('Error al resetear actualización:', err);
      if (Swal) {
        Swal.fire('Error', `No se pudo resetear la actualización: ${err.message || 'Error en servidor'}`, 'error');
      } else {
        alert('Error al resetear: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estudianteEditando) return;

    setLoading(true);
    try {
      const escuelaFinal = (estudianteEditando.codigo_escuela || 'sb').toLowerCase();
      const payload = {
        nombres_estudiante: toTitulo(estudianteEditando.nombres_estudiante.trim()),
        apellidos_estudiante: toTitulo(estudianteEditando.apellidos_estudiante.trim()),
        grado_actual: estudianteEditando.grado_actual,
        seccion_actual: estudianteEditando.seccion_actual,
        codigo_escuela: escuelaFinal
      };

      const { error } = await supabase
        .from('estudiantes_vinculaciones')
        .update(payload)
        .eq('id', estudianteEditando.id);

      if (error) throw error;

      if ((window as any).Swal) {
        (window as any).Swal.fire('¡Actualizado!', 'Los datos del estudiante han sido modificados exitosamente.', 'success');
      } else {
        alert('Estudiante actualizado exitosamente');
      }

      auditar('Vincular Estudiante', 'Editar Estudiante', `Modificó vinculación del estudiante ID ${estudianteEditando.id}`);
      
      setVinculaciones(prev => prev.map(v => v.id === estudianteEditando.id ? { ...v, ...payload } : v));
      setShowEditModal(false);
      setEstudianteEditando(null);
    } catch (err: any) {
      console.error(err);
      if ((window as any).Swal) {
        (window as any).Swal.fire('Error', `No se pudo actualizar: ${err.message}`, 'error');
      } else {
        alert('Error al actualizar: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarTodo = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSeleccionados(vinculacionesPaginadas.map(v => v.id));
    } else {
      setSeleccionados([]);
    }
  };

  const handleEliminarMasivo = async () => {
    if (seleccionados.length === 0) return;
    
    let confirmado = false;
    if ((window as any).Swal) {
      const result = await (window as any).Swal.fire({
        title: '¿Eliminación masiva?',
        text: `¿Está seguro de eliminar ${seleccionados.length} estudiantes vinculados seleccionados? Esta acción es irreversible.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar todos',
        cancelButtonText: 'Cancelar'
      });
      confirmado = result.isConfirmed;
    } else {
      confirmado = window.confirm(`¿Está seguro de eliminar ${seleccionados.length} estudiantes vinculados seleccionados? Esta acción es irreversible.`);
    }

    if (!confirmado) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('estudiantes_vinculaciones')
        .delete()
        .in('id', seleccionados);

      if (error) throw error;

      setVinculaciones(prev => prev.filter(v => !seleccionados.includes(v.id)));
      auditar('Vincular Estudiante', 'Eliminación Masiva', `Eliminadas ${seleccionados.length} vinculaciones de forma masiva`);
      
      if ((window as any).Swal) {
        (window as any).Swal.fire('Éxito', `Se eliminaron ${seleccionados.length} vinculaciones seleccionadas.`, 'success');
      } else {
        alert(`Se eliminaron ${seleccionados.length} vinculaciones.`);
      }
      setSeleccionados([]);
    } catch (err: any) {
      console.error(err);
      alert('No se pudieron eliminar los registros: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const countSB = vinculaciones.filter(v => v.codigo_escuela === 'sb').length;
  const countLB = vinculaciones.filter(v => v.codigo_escuela === 'lb').length;
  const countAmbas = vinculaciones.length;

  // ─── CÁLCULO DE ESTADÍSTICAS Y REPORTES ─────────────────────────────────────────
  const clasificarEtapa = (grado: string) => {
    const g = grado.toLowerCase();
    if (g.includes('maternal') || g.includes('grupo') || g.includes('inicial') || g.includes('preescolar') || g.includes('kinder')) {
      return 'Educación Inicial';
    }
    if (g.includes('año') || g.includes('media') || g.includes('bachillerato') || g.includes('secundaria')) {
      return 'Media General';
    }
    return 'Educación Primaria';
  };

  const calcularEstadisticasReporte = (esc: 'ambas' | 'sb' | 'lb') => {
    const filtrados = vinculaciones.filter(v => esc === 'ambas' || v.codigo_escuela === esc);
    
    const totalGeneral = filtrados.length;
    let completadosGeneral = 0;
    let enProcesoGeneral = 0;
    let sinIniciarGeneral = 0;

    const porGradoMap: Record<string, { total: number; completados: number; enProceso: number; sinIniciar: number }> = {};
    
    const etapasMap: Record<string, { total: number; completados: number; enProceso: number; sinIniciar: number }> = {
      'Educación Inicial': { total: 0, completados: 0, enProceso: 0, sinIniciar: 0 },
      'Educación Primaria': { total: 0, completados: 0, enProceso: 0, sinIniciar: 0 },
      'Media General': { total: 0, completados: 0, enProceso: 0, sinIniciar: 0 }
    };

    const seccionesTotalesMap: Record<string, { id: string; nombre: string; icono: string; completados: number }> = {
      rep: { id: 'rep', nombre: 'Datos del Representante', icono: 'bi-person-badge', completados: 0 },
      est: { id: 'est', nombre: 'Datos del Estudiante', icono: 'bi-mortarboard', completados: 0 },
      dir: { id: 'dir', nombre: 'Ubicación y Vivienda', icono: 'bi-geo-alt', completados: 0 },
      salud: { id: 'salud', nombre: 'Salud y Antropometría', icono: 'bi-heart-pulse', completados: 0 },
      madre: { id: 'madre', nombre: 'Datos de la Madre', icono: 'bi-gender-female', completados: 0 },
      padre: { id: 'padre', nombre: 'Datos del Padre', icono: 'bi-gender-male', completados: 0 },
      socio: { id: 'socio', nombre: 'Socioeconómico y Servicios', icono: 'bi-house-check', completados: 0 },
      confirmado: { id: 'confirmado', nombre: 'Ficha Confirmada / Emitida', icono: 'bi-file-earmark-check', completados: 0 }
    };

    filtrados.forEach(v => {
      const avance = calcularAvanceActualizacion(v);
      const grado = v.grado_actual || 'Sin Grado Asignado';
      const etapa = clasificarEtapa(grado);

      if (!porGradoMap[grado]) {
        porGradoMap[grado] = { total: 0, completados: 0, enProceso: 0, sinIniciar: 0 };
      }

      porGradoMap[grado].total++;
      if (etapasMap[etapa]) etapasMap[etapa].total++;

      if (avance.estado === 'completado') {
        completadosGeneral++;
        porGradoMap[grado].completados++;
        if (etapasMap[etapa]) etapasMap[etapa].completados++;
      } else if (avance.estado === 'en_proceso') {
        enProcesoGeneral++;
        porGradoMap[grado].enProceso++;
        if (etapasMap[etapa]) etapasMap[etapa].enProceso++;
      } else {
        sinIniciarGeneral++;
        porGradoMap[grado].sinIniciar++;
        if (etapasMap[etapa]) etapasMap[etapa].sinIniciar++;
      }

      // Evaluar secciones completadas
      const d = v.datos_actualizados || {};
      const fecha = v.fecha_ultima_actualizacion;
      if (Boolean((d.representante_nombres || v.nombres_representante) && (d.representante_cedula || v.cedula_representante))) seccionesTotalesMap.rep.completados++;
      if (Boolean((d.estudiante_nombres || v.nombres_estudiante) && (d.estudiante_apellidos || v.apellidos_estudiante) && d.estudiante_fecha_nacimiento)) seccionesTotalesMap.est.completados++;
      if (Boolean(d.estado_habitacion && d.direccion_habitacion)) seccionesTotalesMap.dir.completados++;
      if (Boolean(d.estudiante_grupo_sanguineo || d.talla_franela || d.peso_kg)) seccionesTotalesMap.salud.completados++;
      if (Boolean(d.madre_nombres && d.madre_cedula)) seccionesTotalesMap.madre.completados++;
      if (d.estudiante_reconocido_por_padre === 'No' || Boolean(d.padre_nombres && d.padre_cedula)) seccionesTotalesMap.padre.completados++;
      if (Boolean(d.posee_computadora || d.tipo_vivienda || d.estudiante_con_quien_vive)) seccionesTotalesMap.socio.completados++;
      if (Boolean(fecha)) seccionesTotalesMap.confirmado.completados++;
    });

    // Ordenar grados según catálogo conf_grados
    const gradosOrdenados = Object.keys(porGradoMap).sort((a, b) => {
      const idxA = gradosDB.indexOf(a);
      const idxB = gradosDB.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    const desglosePorGrado = gradosOrdenados.map(grado => {
      const data = porGradoMap[grado];
      const pctCompletado = data.total > 0 ? Math.round((data.completados / data.total) * 100) : 0;
      return {
        grado,
        ...data,
        pctCompletado
      };
    });

    const desgloseEtapas = Object.keys(etapasMap).map(nombreEtapa => {
      const e = etapasMap[nombreEtapa];
      const pct = e.total > 0 ? Math.round((e.completados / e.total) * 100) : 0;
      return {
        etapa: nombreEtapa,
        ...e,
        pct
      };
    });

    const desgloseSecciones = Object.values(seccionesTotalesMap).map(sec => {
      const pct = totalGeneral > 0 ? Math.round((sec.completados / totalGeneral) * 100) : 0;
      return {
        ...sec,
        pct
      };
    });

    const semaforoOptimo = desglosePorGrado.filter(g => g.pctCompletado >= 75);
    const semaforoEnProgreso = desglosePorGrado.filter(g => g.pctCompletado >= 40 && g.pctCompletado < 75);
    const semaforoAtencion = desglosePorGrado.filter(g => g.pctCompletado < 40);

    const pctGeneral = totalGeneral > 0 ? Math.round((completadosGeneral / totalGeneral) * 100) : 0;

    const ahora = new Date();
    const fechaHoraReporte = ahora.toLocaleString('es-VE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: true 
    });

    return {
      totalGeneral,
      completadosGeneral,
      enProcesoGeneral,
      sinIniciarGeneral,
      pctGeneral,
      desglosePorGrado,
      desgloseEtapas,
      desgloseSecciones,
      semaforoOptimo,
      semaforoEnProgreso,
      semaforoAtencion,
      fechaHoraReporte
    };
  };

  const exportarEstadisticasExcel = () => {
    const stats = calcularEstadisticasReporte(escuelaReporte);
    const nombreInstitucion = escuelaReporte === 'ambas' 
      ? 'GENERAL ESCUELAS DEP ORIENTE' 
      : (escuelaReporte === 'sb' ? 'U.E. SANTA BÁRBARA' : 'U.E. LIBERTADOR BOLÍVAR');

    const wb = XLSX.utils.book_new();

    const wsData: any[][] = [
      ['SISTEMA INTEGRAL DE ADMINISTRACIÓN ESCOLAR (SIGAE) - DEP ORIENTE'],
      ['REPORTE ESTADÍSTICO DE ACTUALIZACIÓN DE DATOS ESTUDIANTILES'],
      [],
      ['ÁMBITO INSTITUCIONAL:', nombreInstitucion],
      ['FECHA Y HORA DEL REPORTE:', stats.fechaHoraReporte.toUpperCase()],
      ['EMITIDO POR:', (user?.nombre_completo || user?.cedula || 'Administrador').toUpperCase()],
      [],
      ['=== RESUMEN GENERAL DE MATRÍCULA ==='],
      ['Métrica', 'Cantidad', 'Porcentaje'],
      ['Total Matrícula de Estudiantes', stats.totalGeneral, '100%'],
      ['Actualizados / Completados (100%)', stats.completadosGeneral, `${stats.pctGeneral}%`],
      ['En Proceso de Actualización', stats.enProcesoGeneral, `${stats.totalGeneral > 0 ? Math.round((stats.enProcesoGeneral / stats.totalGeneral) * 100) : 0}%`],
      ['Sin Iniciar Actualización (0%)', stats.sinIniciarGeneral, `${stats.totalGeneral > 0 ? Math.round((stats.sinIniciarGeneral / stats.totalGeneral) * 100) : 0}%`],
      [],
      ['=== DESGLOSE DETALLADO POR GRUPO, GRADO O AÑO ESCOLAR ==='],
      ['Grupo / Grado / Año Escolar', 'Total Estudiantes', 'Completados (100%)', 'En Proceso', 'Sin Iniciar (0%)', '% Avance']
    ];

    stats.desglosePorGrado.forEach(g => {
      wsData.push([
        g.grado,
        g.total,
        g.completados,
        g.enProceso,
        g.sinIniciar,
        `${g.pctCompletado}%`
      ]);
    });

    wsData.push([
      'TOTAL GENERAL CONSOLIDADO',
      stats.totalGeneral,
      stats.completadosGeneral,
      stats.enProcesoGeneral,
      stats.sinIniciarGeneral,
      `${stats.pctGeneral}%`
    ]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Estadísticas Avance');

    const filename = `Reporte_Estadistico_Avance_${escuelaReporte.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const generarReporteHTML = (stats: any, nombreInstitucion: string, tipo: string = 'dossier', agrupacion: string = 'grados') => {
    const R = 48;
    const C = 2 * Math.PI * R;
    const lenComp = stats.totalGeneral > 0 ? (stats.completadosGeneral / stats.totalGeneral) * C : 0;
    const lenProc = stats.totalGeneral > 0 ? (stats.enProcesoGeneral / stats.totalGeneral) * C : 0;
    const lenSin = stats.totalGeneral > 0 ? (stats.sinIniciarGeneral / stats.totalGeneral) * C : 0;
    const offComp = 0;
    const offProc = -lenComp;
    const offSin = -(lenComp + lenProc);

    // Tacómetro Radial (Gauge de Meta 180°)
    const pct = stats.pctGeneral;
    const needleAngle = -90 + (pct / 100) * 180;
    const gaugeColor = pct >= 75 ? '#10b981' : (pct >= 40 ? '#f59e0b' : '#ef4444');

    // Determinar dataset según criterio de agrupación
    let itemsDesglose: any[] = [];
    let tituloDesglose = 'Por Grados / Años Escolares';
    if (agrupacion === 'niveles') {
      itemsDesglose = stats.desgloseEtapas || [];
      tituloDesglose = 'Por Niveles y Etapas Educativas';
    } else if (agrupacion === 'secciones') {
      itemsDesglose = stats.desgloseSecciones || [];
      tituloDesglose = 'Por Dimensiones del Formulario Censal';
    } else if (agrupacion === 'semaforo') {
      itemsDesglose = [
        { nombre: '🟢 Nivel Óptimo (≥75%)', total: stats.semaforoOptimo?.length || 0, pct: stats.totalGeneral > 0 ? Math.round(((stats.semaforoOptimo?.reduce((a: number, c: any) => a + c.completados, 0) || 0) / stats.totalGeneral) * 100) : 0, completados: stats.semaforoOptimo?.reduce((a: number, c: any) => a + c.completados, 0) || 0 },
        { nombre: '🟡 En Progreso (40%-74%)', total: stats.semaforoEnProgreso?.length || 0, pct: stats.totalGeneral > 0 ? Math.round(((stats.semaforoEnProgreso?.reduce((a: number, c: any) => a + c.completados, 0) || 0) / stats.totalGeneral) * 100) : 0, completados: stats.semaforoEnProgreso?.reduce((a: number, c: any) => a + c.completados, 0) || 0 },
        { nombre: '🔴 Atención Prioritaria (<40%)', total: stats.semaforoAtencion?.length || 0, pct: stats.totalGeneral > 0 ? Math.round(((stats.semaforoAtencion?.reduce((a: number, c: any) => a + c.completados, 0) || 0) / stats.totalGeneral) * 100) : 0, completados: stats.semaforoAtencion?.reduce((a: number, c: any) => a + c.completados, 0) || 0 }
      ];
      tituloDesglose = 'Por Estatus del Semáforo de Gestión';
    } else {
      itemsDesglose = stats.desglosePorGrado || [];
      tituloDesglose = 'Por Grado / Año Escolar';
    }

    // Obtener Nombre y Apellido del usuario emisor desde la sesión
    let nombreEmisor = 'Administrador SIGAE';
    try {
      const rawUser = localStorage.getItem('usuario_sigae');
      if (rawUser) {
        const uObj = JSON.parse(rawUser);
        if (uObj.nombre_completo && uObj.nombre_completo.trim()) {
          nombreEmisor = uObj.nombre_completo.trim();
        } else {
          const n = (uObj.nombres || uObj.nombre || '').trim();
          const a = (uObj.apellidos || uObj.apellido || '').trim();
          if (n || a) {
            nombreEmisor = `${n} ${a}`.trim();
          }
        }
      }
    } catch (e) {}

    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; background: #ffffff; padding: 22px; width: 800px; box-sizing: border-box;">
        <!-- ENCABEZADO INSTITUCIONAL CON LOGOS OFICIALES -->
        <div style="border-bottom: 2.5px solid #1e40af; padding-bottom: 8px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          <!-- LOGO IZQUIERDA: ESCUELA -->
          <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
            ${escuelaReporte === 'ambas' ? `
              <img src="/assets/img/logo_sb.png" style="height: 42px; width: auto;" alt="SB" />
              <img src="/assets/img/logo_lb.png" style="height: 42px; width: auto;" alt="LB" />
            ` : (escuelaReporte === 'sb' ? `
              <img src="/assets/img/logo_sb.png" style="height: 44px; width: auto;" alt="SB" />
            ` : `
              <img src="/assets/img/logo_lb.png" style="height: 44px; width: auto;" alt="LB" />
            `)}
          </div>

          <!-- TEXTO CENTRADO INSTITUCIONAL -->
          <div style="text-align: center; flex-grow: 1;">
            <div style="letter-spacing: 0.8px; font-weight: bold; text-transform: uppercase; font-size: 8.5px; color: #64748b;">REPÚBLICA BOLIVARIANA DE VENEZUELA</div>
            <div style="font-weight: 800; text-transform: uppercase; margin: 1px 0; color: #1e293b; font-size: 10.5px;">MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN</div>
            <div style="font-weight: bold; color: #1e40af; margin: 1px 0; font-size: 9.5px;">DIRECCIÓN EJECUTIVA DE PRODUCCIÓN ORIENTE • GESTIÓN EDUCATIVA</div>
            <h3 style="font-weight: 800; color: #1e40af; margin: 2px 0; font-size: 13.5px;">${nombreInstitucion}</h3>
            <div style="font-weight: bold; font-size: 10px; color: #1e40af; background: #eff6ff; padding: 2px 8px; border-radius: 4px; display: inline-block; border: 1px solid #bfdbfe; margin-top: 1px;">
              ${tipo === 'dossier' ? 'DOSSIER ESTADÍSTICO INTEGRAL 360°' : `INFORME ESTADÍSTICO: ${tipo.toUpperCase()} (${tituloDesglose.toUpperCase()})`}
            </div>
          </div>

          <!-- LOGO DERECHA: SIGAE -->
          <div style="display: flex; align-items: center; justify-content: flex-end; flex-shrink: 0;">
            <img src="/assets/img/sigae.png" style="height: 45px; width: auto;" alt="SIGAE" />
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; color: #64748b; font-size: 9px; margin-top: -4px; margin-bottom: 10px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px;">
          <span><strong>Fecha y Hora de Emisión:</strong> ${stats.fechaHoraReporte}</span>
          <span><strong>Emitido por:</strong> ${nombreEmisor}</span>
        </div>

        <!-- TARJETAS KPIS SUPERIORES -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 12px;">
          <div style="border: 1px solid #bfdbfe; border-radius: 8px; padding: 6px 8px; background: #eff6ff; text-align: center;">
            <div style="color: #1e40af; font-size: 8px; font-weight: bold;">MATRÍCULA TOTAL</div>
            <div style="font-size: 15px; font-weight: bold; color: #1e40af;">${stats.totalGeneral}</div>
            <div style="font-size: 7.5px; color: #3b82f6;">100% de estudiantes</div>
          </div>
          <div style="border: 1px solid #bbf7d0; border-radius: 8px; padding: 6px 8px; background: #f0fdf4; text-align: center;">
            <div style="color: #166534; font-size: 8px; font-weight: bold;">ACTUALIZADOS (100%)</div>
            <div style="font-size: 15px; font-weight: bold; color: #16a34a;">${stats.completadosGeneral}</div>
            <div style="font-size: 7.5px; font-weight: bold; color: #166534;">${stats.pctGeneral}% completado</div>
          </div>
          <div style="border: 1px solid #fde68a; border-radius: 8px; padding: 6px 8px; background: #fefce8; text-align: center;">
            <div style="color: #854d0e; font-size: 8px; font-weight: bold;">EN PROCESO</div>
            <div style="font-size: 15px; font-weight: bold; color: #d97706;">${stats.enProcesoGeneral}</div>
            <div style="font-size: 7.5px; font-weight: bold; color: #854d0e;">${stats.totalGeneral > 0 ? Math.round((stats.enProcesoGeneral / stats.totalGeneral) * 100) : 0}% en llenado</div>
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px; background: #f8fafc; text-align: center;">
            <div style="color: #64748b; font-size: 8px; font-weight: bold;">SIN INICIAR (0%)</div>
            <div style="font-size: 15px; font-weight: bold; color: #64748b;">${stats.sinIniciarGeneral}</div>
            <div style="font-size: 7.5px; color: #64748b;">${stats.totalGeneral > 0 ? Math.round((stats.sinIniciarGeneral / stats.totalGeneral) * 100) : 0}% pendientes</div>
          </div>
        </div>

        ${tipo === 'dossier' ? `
          <!-- VISTA DOSSIER 360° COMBINADO -->
          <div style="display: flex; align-items: stretch; gap: 10px; margin-bottom: 12px;">
            <!-- ANILLO CONCÉNTRICO -->
            <div style="width: 165px; text-align: center; border: 1px solid #cbd5e1; border-radius: 10px; padding: 8px; background: #f8fafc; flex-shrink: 0;">
              <div style="font-size: 9.5px; font-weight: bold; color: #475569; margin-bottom: 2px;">DISTRIBUCIÓN EN ANILLO</div>
              <div style="position: relative; width: 95px; height: 95px; margin: 0 auto;">
                <svg width="95" height="95" viewBox="0 0 140 140" style="transform: rotate(-90deg);">
                  <circle cx="70" cy="70" r="${R}" fill="none" stroke="#f1f5f9" stroke-width="18" />
                  ${lenComp > 0 ? `<circle cx="70" cy="70" r="${R}" fill="none" stroke="#10b981" stroke-width="18" stroke-dasharray="${lenComp} ${C - lenComp}" stroke-dashoffset="${offComp}" />` : ''}
                  ${lenProc > 0 ? `<circle cx="70" cy="70" r="${R}" fill="none" stroke="#f59e0b" stroke-width="18" stroke-dasharray="${lenProc} ${C - lenProc}" stroke-dashoffset="${offProc}" />` : ''}
                  ${lenSin > 0 ? `<circle cx="70" cy="70" r="${R}" fill="none" stroke="#94a3b8" stroke-width="18" stroke-dasharray="${lenSin} ${C - lenSin}" stroke-dashoffset="${offSin}" />` : ''}
                </svg>
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                  <div style="font-size: 13px; font-weight: 900; color: #0f172a;">${stats.totalGeneral}</div>
                  <div style="font-size: 7px; font-weight: bold; color: #64748b;">ALUMNOS</div>
                </div>
              </div>
              <div style="font-size: 9px; font-weight: bold; color: #166534; margin-top: 2px;">🟢 ${stats.pctGeneral}% al día</div>
            </div>

            <!-- TACÓMETRO DE META -->
            <div style="width: 175px; text-align: center; border: 1px solid #cbd5e1; border-radius: 10px; padding: 8px; background: #f8fafc; flex-shrink: 0;">
              <div style="font-size: 9.5px; font-weight: bold; color: #475569; margin-bottom: 2px;">TACÓMETRO DE META (180°)</div>
              <div style="position: relative; width: 135px; height: 75px; margin: 0 auto; overflow: hidden;">
                <svg width="135" height="135" viewBox="0 0 140 140">
                  <path d="M 15 80 A 55 55 0 0 1 125 80" fill="none" stroke="#e2e8f0" stroke-width="14" stroke-linecap="round" />
                  <path d="M 15 80 A 55 55 0 0 1 125 80" fill="none" stroke="${gaugeColor}" stroke-width="14" stroke-linecap="round" stroke-dasharray="172.78" stroke-dashoffset="${172.78 * (1 - pct / 100)}" />
                  <g transform="translate(70, 80) rotate(${needleAngle})">
                    <line x1="0" y1="0" x2="0" y2="-45" stroke="#0f172a" stroke-width="3" stroke-linecap="round" />
                    <circle cx="0" cy="0" r="5" fill="#0f172a" />
                  </g>
                </svg>
              </div>
              <div style="font-size: 16px; font-weight: 900; color: ${gaugeColor}; margin-top: -4px;">${stats.pctGeneral}%</div>
              <div style="font-size: 8.5px; font-weight: bold; color: #64748b;">${pct >= 75 ? '🟢 Nivel Óptimo' : (pct >= 40 ? '🟡 En Progreso' : '🔴 Atención Prioritaria')}</div>
            </div>

            <!-- COMPARATIVA ETAPAS -->
            <div style="flex-grow: 1; border: 1px solid #cbd5e1; border-radius: 10px; padding: 8px; background: #ffffff;">
              <div style="font-size: 10px; font-weight: bold; color: #0f172a; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;">
                📊 Avance por Etapa Educativa
              </div>
              ${stats.desgloseEtapas?.map((et: any) => `
                <div style="margin-bottom: 5px;">
                  <div style="display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 2px;">
                    <span style="font-weight: bold; color: #1e293b;">${et.etapa}</span>
                    <span style="color: #166534; font-weight: bold;">${et.completados}/${et.total} (${et.pct}%)</span>
                  </div>
                  <div style="background-color: #f1f5f9; border-radius: 4px; height: 7px; overflow: hidden; display: flex;">
                    <div style="background-color: #10b981; height: 100%; width: ${et.pct}%;"></div>
                    <div style="background-color: #f59e0b; height: 100%; width: ${et.total > 0 ? (et.enProceso / et.total) * 100 : 0}%;"></div>
                    <div style="background-color: #cbd5e1; height: 100%; width: ${et.total > 0 ? (et.sinIniciar / et.total) * 100 : 0}%;"></div>
                  </div>
                </div>
              `).join('') || ''}
            </div>
          </div>

          <!-- FILA DE PICOS DE RENDIMIENTO POR GRADO -->
          <div style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 8px; background: #ffffff; margin-bottom: 12px;">
            <div style="font-size: 10px; font-weight: bold; color: #0f172a; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;">
              ⛰️ Picos de Avance y Cumplimiento por Grado / Año Escolar
            </div>
            <div style="height: 85px; display: flex; align-items: flex-end; gap: 4px; padding: 0 4px; border-bottom: 1px solid #cbd5e1;">
              ${stats.desglosePorGrado.slice(0, 15).map((g: any) => {
                const heightPct = Math.max(g.pctCompletado, 8);
                const barColor = g.pctCompletado >= 75 ? '#10b981' : (g.pctCompletado >= 40 ? '#f59e0b' : '#ef4444');
                return `
                  <div style="flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end;">
                    <span style="font-size: 7px; font-weight: bold; color: ${barColor}; margin-bottom: 1px;">${g.pctCompletado}%</span>
                    <div style="width: 100%; max-width: 16px; background: ${barColor}; height: ${heightPct}%; border-radius: 3px 3px 0 0;"></div>
                    <span style="font-size: 6.5px; color: #64748b; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 32px;">${g.grado.replace('Educación ', '').replace('Grado', 'G').replace('Año', 'A')}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : `
          <!-- VISTA PERSONALIZADA DE GRÁFICO SELECCIONADO -->
          <div style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; background: #f8fafc; margin-bottom: 12px;">
            <div style="font-size: 11px; font-weight: bold; color: #0f172a; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; display: flex; justify-content: space-between;">
              <span>📊 Gráfica Seleccionada: ${tipo.toUpperCase()} (${tituloDesglose})</span>
              <span style="color: #1e40af;">Total: ${stats.totalGeneral} Alumnos</span>
            </div>

            ${tipo === 'picos' ? `
              <div style="height: 120px; display: flex; align-items: flex-end; gap: 6px; padding: 0 8px; border-bottom: 1px solid #cbd5e1;">
                ${itemsDesglose.map((it: any) => {
                  const label = it.grado || it.etapa || it.nombre || '';
                  const itemPct = it.pctCompletado ?? it.pct ?? 0;
                  const itemColor = itemPct >= 75 ? '#10b981' : (itemPct >= 40 ? '#f59e0b' : '#ef4444');
                  return `
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end;">
                      <span style="font-size: 7.5px; font-weight: bold; color: ${itemColor}; margin-bottom: 1px;">${itemPct}%</span>
                      <div style="width: 100%; max-width: 22px; background: ${itemColor}; height: ${Math.max(itemPct, 8)}%; border-radius: 4px 4px 0 0;"></div>
                      <span style="font-size: 7px; color: #475569; margin-top: 2px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 40px;">${label.replace('Educación ', '').replace('Grado', 'G').replace('Año', 'A')}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}

            ${tipo === 'anillos' ? `
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; text-align: center;">
                ${itemsDesglose.slice(0, 8).map((it: any) => {
                  const label = it.grado || it.etapa || it.nombre || '';
                  const itemPct = it.pctCompletado ?? it.pct ?? 0;
                  const itemColor = itemPct >= 75 ? '#10b981' : (itemPct >= 40 ? '#f59e0b' : '#ef4444');
                  const itTot = it.total || stats.totalGeneral || 0;
                  const itComp = it.completados || 0;
                  const itemLen = itTot > 0 ? (itComp / itTot) * C : 0;
                  return `
                    <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; background: #ffffff;">
                      <div style="font-size: 8px; font-weight: bold; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${label}</div>
                      <div style="position: relative; width: 65px; height: 65px; margin: 4px auto;">
                        <svg width="65" height="65" viewBox="0 0 140 140" style="transform: rotate(-90deg);">
                          <circle cx="70" cy="70" r="${R}" fill="none" stroke="#f1f5f9" stroke-width="20" />
                          <circle cx="70" cy="70" r="${R}" fill="none" stroke="${itemColor}" stroke-width="20" stroke-dasharray="${itemLen} ${C - itemLen}" stroke-dashoffset="0" />
                        </svg>
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 10px; font-weight: 900; color: ${itemColor};">
                          ${itemPct}%
                        </div>
                      </div>
                      <div style="font-size: 7.5px; color: #64748b;">${itComp}/${itTot} listos</div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}

            ${tipo === 'torta' ? (() => {
              const pal = ['#00C3FF', '#8B5CF6', '#00E676', '#FF8D00', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#06B6D4', '#6366F1', '#14B8A6', '#84CC16'];
              const darkPal = ['#0095C2', '#6D28D9', '#00B359', '#CC7000', '#BE185D', '#1D4ED8', '#059669', '#D97706', '#0891B2', '#4338CA', '#0D9488', '#65A30D'];
              const tVal = itemsDesglose.reduce((acc: number, it: any) => acc + (it.completados || it.total || it.pct || 1), 0);
              let curAngle = -Math.PI / 2;
              const cx3 = 140;
              const cy3 = 75;
              const rx3 = 105;
              const ry3 = 50;
              const d3 = 18;
              const sls = itemsDesglose.slice(0, 10).map((it: any, i: number) => {
                const val = it.completados !== undefined ? (it.completados || (it.total ? 0.01 : 1)) : (it.pct || 1);
                const frac = tVal > 0 ? (val / tVal) : (1 / itemsDesglose.length);
                const aSpan = frac * 2 * Math.PI;
                const sAng = curAngle;
                const eAng = curAngle + aSpan;
                curAngle = eAng;
                const sx1 = cx3 + rx3 * Math.cos(sAng);
                const sy1 = cy3 + ry3 * Math.sin(sAng);
                const sx2 = cx3 + rx3 * Math.cos(eAng);
                const sy2 = cy3 + ry3 * Math.sin(eAng);
                const lArc = aSpan > Math.PI ? 1 : 0;
                const col = pal[i % pal.length];
                const dCol = darkPal[i % darkPal.length];
                const lab = it.grado || it.etapa || it.nombre || `Seg ${i + 1}`;
                const pctDisp = it.pctCompletado ?? it.pct ?? Math.round(frac * 100);
                return { sx1, sy1, sx2, sy2, lArc, col, dCol, lab, pctDisp, frac, it, sAng, eAng };
              });

              return `
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="flex-shrink: 0; width: 290px; text-align: center;">
                    <svg width="280" height="170" viewBox="0 0 280 170">
                      <ellipse cx="${cx3}" cy="${cy3 + d3 + 6}" rx="${rx3 + 3}" ry="${ry3 + 2}" fill="#cbd5e1" opacity="0.6" />
                      <g>
                        ${sls.map((s: any) => `
                          <path d="M ${s.sx1} ${s.sy1} A ${rx3} ${ry3} 0 ${s.lArc} 1 ${s.sx2} ${s.sy2} L ${s.sx2} ${s.sy2 + d3} A ${rx3} ${ry3} 0 ${s.lArc} 0 ${s.sx1} ${s.sy1 + d3} Z" fill="${s.dCol}" stroke="${s.dCol}" stroke-width="0.5" />
                        `).join('')}
                      </g>
                      <g>
                        ${sls.map((s: any) => `
                          <path d="M ${cx3} ${cy3} L ${s.sx1} ${s.sy1} A ${rx3} ${ry3} 0 ${s.lArc} 1 ${s.sx2} ${s.sy2} Z" fill="${s.col}" stroke="#ffffff" stroke-width="1" />
                        `).join('')}
                      </g>
                      <!-- VALORES VISIBLES SOBRE CADA COLOR DE LA TORTA -->
                      <g>
                        ${sls.map((s: any) => {
                          const midA = s.sAng + (s.eAng - s.sAng) / 2;
                          const tagX = cx3 + (rx3 * 0.65) * Math.cos(midA);
                          const tagY = cy3 + (ry3 * 0.65) * Math.sin(midA);
                          return `
                            <g>
                              <rect x="${tagX - 15}" y="${tagY - 8}" width="30" height="16" rx="8" fill="#ffffff" stroke="${s.col}" stroke-width="1.5" />
                              <text x="${tagX}" y="${tagY + 3.5}" text-anchor="middle" fill="#0f172a" font-size="8" font-weight="bold">${s.pctDisp}%</text>
                            </g>
                          `;
                        }).join('')}
                      </g>
                    </svg>
                  </div>
                  <div style="flex-grow: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                    ${sls.map((s: any) => `
                      <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 6px; background: #ffffff; display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 4px; overflow: hidden;">
                          <div style="width: 8px; height: 8px; border-radius: 50%; background: ${s.col}; flex-shrink: 0;"></div>
                          <span style="font-size: 7.5px; font-weight: bold; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90px;">${s.lab}</span>
                        </div>
                        <span style="font-size: 8px; font-weight: bold; color: ${s.col};">${s.pctDisp}%</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            })() : ''}

            ${tipo === 'barras' ? `
              <div style="display: flex; flex-direction: column; gap: 5px;">
                ${itemsDesglose.map((it: any) => {
                  const label = it.grado || it.etapa || it.nombre || '';
                  const itemPct = it.pctCompletado ?? it.pct ?? 0;
                  const itemColor = itemPct >= 75 ? '#10b981' : (itemPct >= 40 ? '#f59e0b' : '#ef4444');
                  const itTot = it.total || stats.totalGeneral || 0;
                  const itComp = it.completados || 0;
                  return `
                    <div>
                      <div style="display: flex; justify-content: space-between; font-size: 8.5px; margin-bottom: 1px;">
                        <span style="font-weight: bold; color: #1e293b;">${label}</span>
                        <span style="color: ${itemColor}; font-weight: bold;">${itComp}/${itTot} (${itemPct}%)</span>
                      </div>
                      <div style="background-color: #f1f5f9; border-radius: 4px; height: 7px; overflow: hidden; display: flex;">
                        <div style="background-color: ${itemColor}; height: 100%; width: ${itemPct}%;"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}

            ${tipo === 'tacometro' ? `
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; text-align: center;">
                ${itemsDesglose.slice(0, 6).map((it: any) => {
                  const label = it.grado || it.etapa || it.nombre || '';
                  const itemPct = it.pctCompletado ?? it.pct ?? 0;
                  const itemColor = itemPct >= 75 ? '#10b981' : (itemPct >= 40 ? '#f59e0b' : '#ef4444');
                  const itAngle = -90 + (itemPct / 100) * 180;
                  return `
                    <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px; background: #ffffff;">
                      <div style="font-size: 8px; font-weight: bold; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${label}</div>
                      <div style="position: relative; width: 100px; height: 55px; margin: 2px auto; overflow: hidden;">
                        <svg width="100" height="100" viewBox="0 0 140 140">
                          <path d="M 15 80 A 55 55 0 0 1 125 80" fill="none" stroke="#e2e8f0" stroke-width="14" stroke-linecap="round" />
                          <path d="M 15 80 A 55 55 0 0 1 125 80" fill="none" stroke="${itemColor}" stroke-width="14" stroke-linecap="round" stroke-dasharray="172.78" stroke-dashoffset="${172.78 * (1 - itemPct / 100)}" />
                          <g transform="translate(70, 80) rotate(${itAngle})">
                            <line x1="0" y1="0" x2="0" y2="-45" stroke="#0f172a" stroke-width="3" stroke-linecap="round" />
                            <circle cx="0" cy="0" r="5" fill="#0f172a" />
                          </g>
                        </svg>
                      </div>
                      <div style="font-size: 11px; font-weight: 900; color: ${itemColor};">${itemPct}%</div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}

            ${tipo === 'radar' ? `
              <div style="text-align: center; padding: 6px;">
                <div style="font-size: 9px; color: #64748b; margin-bottom: 6px;">Polígono de Cobertura y Cumplimiento</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; text-align: left;">
                  ${itemsDesglose.map((it: any) => {
                    const label = it.grado || it.etapa || it.nombre || '';
                    const itemPct = it.pctCompletado ?? it.pct ?? 0;
                    const itemColor = itemPct >= 75 ? '#10b981' : (itemPct >= 40 ? '#f59e0b' : '#ef4444');
                    return `
                      <div style="font-size: 8px; border: 1px solid #e2e8f0; border-radius: 4px; padding: 3px 5px; display: flex; justify-content: space-between;">
                        <span style="font-weight: bold; color: #1e293b;">${label}</span>
                        <span style="color: ${itemColor}; font-weight: bold;">${itemPct}%</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        `}

        <!-- TABLA DESGLOSADA POR GRADO / NIVEL -->
        <div style="font-weight: bold; margin-bottom: 4px; color: #0f172a; font-size: 10px;">📋 Detalle Consolidado de Matrícula</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 12px;">
          <thead>
            <tr style="background-color: #f1f5f9; text-align: center; border: 1px solid #cbd5e1;">
              <th style="padding: 4px; text-align: left; width: 30%; border: 1px solid #cbd5e1;">Grupo / Grado / Nivel</th>
              <th style="padding: 4px; width: 10%; border: 1px solid #cbd5e1;">Total</th>
              <th style="padding: 4px; width: 12%; border: 1px solid #cbd5e1;">Completados</th>
              <th style="padding: 4px; width: 12%; border: 1px solid #cbd5e1;">En Proceso</th>
              <th style="padding: 4px; width: 12%; border: 1px solid #cbd5e1;">Sin Iniciar</th>
              <th style="padding: 4px; width: 24%; border: 1px solid #cbd5e1;">Avance</th>
            </tr>
          </thead>
          <tbody>
            ${stats.desglosePorGrado.map((g: any) => {
              const pComp = g.total > 0 ? (g.completados / g.total) * 100 : 0;
              const pProc = g.total > 0 ? (g.enProceso / g.total) * 100 : 0;
              const pSin = g.total > 0 ? (g.sinIniciar / g.total) * 100 : 0;
              return `
              <tr style="text-align: center; border: 1px solid #cbd5e1;">
                <td style="padding: 3px; text-align: left; font-weight: bold; border: 1px solid #cbd5e1;">${g.grado}</td>
                <td style="padding: 3px; font-weight: bold; border: 1px solid #cbd5e1;">${g.total}</td>
                <td style="padding: 3px; border: 1px solid #cbd5e1;"><span style="background: #dcfce7; color: #166534; font-weight: bold; padding: 1px 3px; border-radius: 3px; font-size: 8.5px;">${g.completados}</span></td>
                <td style="padding: 3px; border: 1px solid #cbd5e1;"><span style="background: #fef9c3; color: #854d0e; font-weight: bold; padding: 1px 3px; border-radius: 3px; font-size: 8.5px;">${g.enProceso}</span></td>
                <td style="padding: 3px; border: 1px solid #cbd5e1;"><span style="background: #f1f5f9; color: #475569; font-weight: bold; padding: 1px 3px; border-radius: 3px; font-size: 8.5px;">${g.sinIniciar}</span></td>
                <td style="padding: 3px; border: 1px solid #cbd5e1;">
                  <div style="display: flex; align-items: center; gap: 3px;">
                    <div style="background-color: #f1f5f9; border-radius: 3px; height: 6px; overflow: hidden; display: flex; width: 100%;">
                      <div style="background-color: #10b981; height: 100%; width: ${pComp}%;"></div>
                      <div style="background-color: #f59e0b; height: 100%; width: ${pProc}%;"></div>
                      <div style="background-color: #cbd5e1; height: 100%; width: ${pSin}%;"></div>
                    </div>
                    <span style="min-width: 24px; font-weight: bold; color: #166534; font-size: 8.5px;">${g.pctCompletado}%</span>
                  </div>
                </td>
              </tr>
            `;
            }).join('')}
            <tr style="background-color: #e2e8f0; text-align: center; font-weight: bold; border: 1px solid #cbd5e1;">
              <td style="padding: 4px; text-align: left; border: 1px solid #cbd5e1;">TOTAL CONSOLIDADO</td>
              <td style="padding: 4px; border: 1px solid #cbd5e1;">${stats.totalGeneral}</td>
              <td style="padding: 4px; color: #16a34a; border: 1px solid #cbd5e1;">${stats.completadosGeneral}</td>
              <td style="padding: 4px; color: #d97706; border: 1px solid #cbd5e1;">${stats.enProcesoGeneral}</td>
              <td style="padding: 4px; color: #475569; border: 1px solid #cbd5e1;">${stats.sinIniciarGeneral}</td>
              <td style="padding: 4px; border: 1px solid #cbd5e1;">
                <div style="display: flex; align-items: center; gap: 3px;">
                  <div style="background-color: #f1f5f9; border-radius: 3px; height: 7px; overflow: hidden; display: flex; width: 100%;">
                    <div style="background-color: #10b981; height: 100%; width: ${stats.pctGeneral}%;"></div>
                    <div style="background-color: #f59e0b; height: 100%; width: ${stats.totalGeneral > 0 ? (stats.enProcesoGeneral / stats.totalGeneral) * 100 : 0}%;"></div>
                    <div style="background-color: #cbd5e1; height: 100%; width: ${stats.totalGeneral > 0 ? (stats.sinIniciarGeneral / stats.totalGeneral) * 100 : 0}%;"></div>
                  </div>
                  <span style="min-width: 24px; font-weight: bold; color: #1e40af; font-size: 9px;">${stats.pctGeneral}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- PIE DE PÁGINA INSTITUCIONAL CON SOLO EL LOGO DEL MINISTERIO -->
        <div style="border-top: 1.5px solid #e2e8f0; padding-top: 8px; margin-top: 12px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center;">
            <img src="/assets/img/logoMPPE.png" style="height: 32px; width: auto;" alt="MPPE" />
          </div>
          <div style="text-align: right; color: #94a3b8; font-size: 7.5px; line-height: 1.2;">
            Dossier oficial de auditoría y avance de matrícula SIGAE.<br>
            Documento de control académico generado automáticamente.
          </div>
        </div>
      </div>
    `;
  };

  const generarReportePDFBlob = async (stats: any, nombreInstitucion: string, tipo: string = 'dossier', agrupacion: string = 'grados'): Promise<{ blob: Blob; nombreArchivo: string }> => {
    const contenedor = document.createElement('div');
    contenedor.style.position = 'fixed';
    contenedor.style.left = '-9999px';
    contenedor.style.top = '0';
    contenedor.style.width = '800px';
    contenedor.style.backgroundColor = '#ffffff';
    contenedor.innerHTML = generarReporteHTML(stats, nombreInstitucion, tipo, agrupacion);

    document.body.appendChild(contenedor);
    await new Promise(r => setTimeout(r, 80));

    const canvas = await html2canvas(contenedor, {
      scale: 1.5,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true
    });

    document.body.removeChild(contenedor);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(imgHeight, pdfHeight), undefined, 'FAST');

    const nombreArchivo = `Reporte_${escuelaReporte.toUpperCase()}_${tipo}_${new Date().toISOString().slice(0, 10)}.pdf`;
    const blob = pdf.output('blob');
    return { blob, nombreArchivo };
  };

  const descargarReportePDF = async () => {
    try {
      setGenerandoPDF(true);
      const stats = calcularEstadisticasReporte(escuelaReporte);
      const nombreInstitucion = escuelaReporte === 'ambas' 
        ? 'GENERAL ESCUELAS DEP ORIENTE' 
        : (escuelaReporte === 'sb' ? 'U.E. SANTA BÁRBARA' : 'U.E. LIBERTADOR BOLÍVAR');

      const { blob, nombreArchivo } = await generarReportePDFBlob(stats, nombreInstitucion, tipoGrafico, criterioAgrupacion);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error al generar PDF:', err);
      alert('Ocurrió un error al generar el archivo PDF.');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const enviarWhatsAppImagen = async (
    stats: any, 
    nombreInstitucion: string, 
    formato: 'png' | 'jpg' | 'jpeg' = 'png', 
    tipo: string = tipoGrafico, 
    agrupacion: string = criterioAgrupacion,
    modoEnvio: 'solo_imagen' | 'imagen_y_texto' = 'imagen_y_texto'
  ) => {
    const Swal = (window as any).Swal;
    try {
      if (Swal) {
        Swal.fire({
          title: 'Generando Imagen...',
          text: `Preparando infografía en formato ${formato.toUpperCase()} (${tipo.toUpperCase()}).`,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
      }

      const contenedor = document.createElement('div');
      contenedor.style.position = 'fixed';
      contenedor.style.left = '-9999px';
      contenedor.style.top = '0';
      contenedor.style.width = '800px';
      contenedor.style.backgroundColor = '#ffffff';
      contenedor.innerHTML = generarReporteHTML(stats, nombreInstitucion, tipo, agrupacion);

      document.body.appendChild(contenedor);
      await new Promise(r => setTimeout(r, 80));

      const canvas = await html2canvas(contenedor, {
        scale: 1.5,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      document.body.removeChild(contenedor);

      const mimeType = formato === 'png' ? 'image/png' : 'image/jpeg';
      const extension = formato === 'png' ? 'png' : 'jpg';
      const nombreArchivo = `Reporte_${escuelaReporte.toUpperCase()}_${tipo}_${new Date().toISOString().slice(0, 10)}.${extension}`;

      canvas.toBlob(async (blob) => {
        if (!blob) {
          if (Swal) Swal.fire('Error', 'No se pudo generar la imagen del reporte.', 'error');
          return;
        }

        const file = new File([blob], nombreArchivo, { type: mimeType });

        // Intentar subir a Supabase Storage para obtener enlace público si incluye texto
        let urlPublicaImagen = '';
        if (modoEnvio === 'imagen_y_texto') {
          try {
            const filePath = `reportes_estadisticos/${nombreArchivo}`;
            const { error: uploadError } = await supabase.storage.from('documentos_solicitudes').upload(filePath, file, { upsert: true });
            if (!uploadError) {
              const { data: urlData } = supabase.storage.from('documentos_solicitudes').getPublicUrl(filePath);
              if (urlData?.publicUrl) {
                urlPublicaImagen = urlData.publicUrl;
              }
            }
          } catch (storageErr) {
            console.warn('Almacenamiento remoto no disponible para preview:', storageErr);
          }
        }

        const textoMensaje = modoEnvio === 'solo_imagen' 
          ? '' 
          : generarTextoResumen(stats, nombreInstitucion, urlPublicaImagen);

        // En Móviles / Tablets: Compartir archivo nativo directamente a WhatsApp
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            if (Swal) Swal.close();
            await navigator.share({
              files: [file],
              title: `Reporte Estadístico - ${nombreInstitucion}`,
              text: textoMensaje
            });
            return;
          } catch (e) {
            console.log('Share nativo omitido');
          }
        }

        // Copiar automáticamente al portapapeles
        let copiadoAlPortapapeles = false;
        if (navigator.clipboard && navigator.clipboard.write) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            copiadoAlPortapapeles = true;
          } catch (e) {
            console.log('Portapapeles de imagen no soportado en este navegador', e);
          }
        }

        // Descarga de respaldo
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        a.click();
        URL.revokeObjectURL(url);

        const waTextParam = textoMensaje ? `?text=${encodeURIComponent(textoMensaje)}` : '';
        const waAppUrl = `whatsapp://send${waTextParam}`;
        const waWebUrl = textoMensaje 
          ? `https://web.whatsapp.com/send${waTextParam}`
          : `https://web.whatsapp.com/`;

        if (Swal) {
          Swal.fire({
            icon: 'success',
            title: '<span style="color: #25D366;"><i class="bi bi-whatsapp me-2"></i>¡Imagen Lista para WhatsApp!</span>',
            html: `
              <div class="p-2 mb-2 text-start">
                ${copiadoAlPortapapeles ? `
                  <div class="alert alert-success d-flex align-items-center gap-2 p-2 mb-2 small">
                    <i class="bi bi-clipboard-check-fill fs-4 text-success flex-shrink-0"></i>
                    <div>
                      <strong>¡Imagen copiada al portapapeles!</strong><br>
                      ${modoEnvio === 'solo_imagen' 
                        ? 'Al abrirse WhatsApp, solo presiona <kbd class="bg-dark text-white px-1.5 py-0.5 rounded">Ctrl + V</kbd> en el chat para enviar <b>únicamente la imagen</b>.'
                        : 'Al abrirse WhatsApp, presiona <kbd class="bg-dark text-white px-1.5 py-0.5 rounded">Ctrl + V</kbd> si deseas adjuntar también la foto.'
                      }
                    </div>
                  </div>
                ` : ''}
                ${urlPublicaImagen ? `
                  <div class="alert alert-info p-2 mb-2 small" style="font-size: 0.72rem;">
                    <i class="bi bi-link-45deg me-1 text-primary"></i> <b>Enlace de visualización web incluido en el mensaje.</b>
                  </div>
                ` : ''}
                <small class="text-muted d-block mb-1">• Archivo generado: <b>${nombreArchivo}</b></small>
                <small class="text-muted d-block">• Abriendo WhatsApp Desktop / Web...</small>
              </div>
            `,
            timer: 3800,
            showConfirmButton: false
          });
        }

        // Intentar abrir la app de WhatsApp Desktop y fallback a Web WhatsApp
        setTimeout(() => {
          const appFrame = document.createElement('iframe');
          appFrame.style.display = 'none';
          appFrame.src = waAppUrl;
          document.body.appendChild(appFrame);

          setTimeout(() => {
            document.body.removeChild(appFrame);
            window.open(waWebUrl, '_blank');
          }, 800);
        }, 600);

      }, mimeType, formato === 'png' ? 1.0 : 0.9);

    } catch (err: any) {
      console.error('Error al generar imagen para WhatsApp:', err);
      if (Swal) Swal.fire('Error', 'No se pudo generar la imagen para compartir.', 'error');
    }
  };

  const generarTextoResumen = (stats: any, nombreInstitucion: string, urlImagen: string = '') => {
    let nombreEmisor = 'Administrador SIGAE';
    try {
      const rawUser = localStorage.getItem('usuario_sigae');
      if (rawUser) {
        const uObj = JSON.parse(rawUser);
        if (uObj.nombre_completo && uObj.nombre_completo.trim()) {
          nombreEmisor = uObj.nombre_completo.trim();
        } else {
          const n = (uObj.nombres || uObj.nombre || '').trim();
          const a = (uObj.apellidos || uObj.apellido || '').trim();
          if (n || a) nombreEmisor = `${n} ${a}`.trim();
        }
      }
    } catch (e) {}

    let msg = `📊 *SIGAE - REPORTE DE ACTUALIZACIÓN ESTUDIANTIL*\n`;
    msg += `🏛️ *Ámbito:* ${nombreInstitucion}\n`;
    msg += `📅 *Fecha de Emisión:* ${stats.fechaHoraReporte}\n`;
    msg += `👤 *Emitido por:* ${nombreEmisor}\n\n`;

    if (urlImagen) {
      msg += `🖼️ *Ver Imagen del Reporte (HD):*\n${urlImagen}\n\n`;
    }

    msg += `📈 *RESUMEN GENERAL:*\n`;
    msg += `• 👥 Total Matrícula: *${stats.totalGeneral}*\n`;
    msg += `• 🟢 Actualizados (100%): *${stats.completadosGeneral}* (${stats.pctGeneral}%)\n`;
    msg += `• 🟡 En Proceso: *${stats.enProcesoGeneral}* (${stats.totalGeneral > 0 ? Math.round((stats.enProcesoGeneral / stats.totalGeneral) * 100) : 0}%)\n`;
    msg += `• ⚪ Sin Iniciar: *${stats.sinIniciarGeneral}* (${stats.totalGeneral > 0 ? Math.round((stats.sinIniciarGeneral / stats.totalGeneral) * 100) : 0}%)\n\n`;
    
    if (stats.desglosePorGrado.length > 0) {
      msg += `📋 *AVANCE POR GRADO / NIVEL:*\n`;
      stats.desglosePorGrado.forEach((g: any) => {
        msg += `• ${g.grado}: ${g.completados}/${g.total} (${g.pctCompletado}%)\n`;
      });
      msg += `\n`;
    }

    msg += `🌐 _Sistema Integral de Gestión y Administración Escolar (SIGAE) - DEP Oriente_`;
    return msg;
  };

  const enviarWhatsAppTexto = (stats: any, nombreInstitucion: string) => {
    const texto = generarTextoResumen(stats, nombreInstitucion);
    if (navigator.share) {
      navigator.share({
        title: `Reporte Estadístico - ${nombreInstitucion}`,
        text: texto,
      }).catch(() => {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
      });
      return;
    }
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
  };

  const handleEnviarWhatsApp = async () => {
    const Swal = (window as any).Swal;
    const stats = calcularEstadisticasReporte(escuelaReporte);
    const nombreInstitucion = escuelaReporte === 'ambas' 
      ? 'GENERAL ESCUELAS DEP ORIENTE' 
      : (escuelaReporte === 'sb' ? 'U.E. SANTA BÁRBARA' : 'U.E. LIBERTADOR BOLÍVAR');
    
    if (!Swal) {
      enviarWhatsAppTexto(stats, nombreInstitucion);
      return;
    }

    await Swal.fire({
      title: '<span style="color: #25D366;"><i class="bi bi-whatsapp me-2"></i>Enviar por WhatsApp</span>',
      html: `
        <p class="text-muted small mb-3">¿Cómo deseas enviar el reporte para <b>${nombreInstitucion}</b>?</p>
        <div class="d-grid gap-2.5 text-start">
          <!-- OPCIÓN 1: SOLO IMAGEN VISTA ACTUAL -->
          <button id="btn-wa-opt-solo-imagen" class="btn btn-outline-success p-3 rounded-4 border text-start d-flex align-items-center gap-3 hover-efecto shadow-sm">
            <div class="bg-success bg-opacity-10 text-success p-2.5 rounded-circle flex-shrink-0">
              <i class="bi bi-image-fill fs-3"></i>
            </div>
            <div>
              <div class="fw-bold text-dark fs-6">1. Solo Imagen (Gráfica Actual: ${tipoGrafico.toUpperCase()})</div>
              <small class="text-muted">Copia la imagen al portapapeles y abre WhatsApp listo para pegar (<kbd>Ctrl+V</kbd>) sin texto.</small>
            </div>
          </button>

          <!-- OPCIÓN 2: SOLO IMAGEN DOSSIER COMPLETO -->
          <button id="btn-wa-opt-solo-dossier" class="btn btn-outline-primary p-3 rounded-4 border text-start d-flex align-items-center gap-3 hover-efecto shadow-sm">
            <div class="bg-primary bg-opacity-10 text-primary p-2.5 rounded-circle flex-shrink-0">
              <i class="bi bi-file-earmark-easel-fill fs-3"></i>
            </div>
            <div>
              <div class="fw-bold text-dark fs-6">2. Solo Imagen (Dossier Completo 360°)</div>
              <small class="text-muted">Infografía oficial completa en PNG lista para pegar (<kbd>Ctrl+V</kbd>) sin texto.</small>
            </div>
          </button>

          <!-- OPCIÓN 3: SOLO TEXTO -->
          <button id="btn-wa-opt-solo-texto" class="btn btn-outline-secondary p-3 rounded-4 border text-start d-flex align-items-center gap-3 hover-efecto shadow-sm">
            <div class="bg-secondary bg-opacity-10 text-secondary p-2.5 rounded-circle flex-shrink-0">
              <i class="bi bi-chat-left-text-fill fs-3"></i>
            </div>
            <div>
              <div class="fw-bold text-dark fs-6">3. Solo Mensaje de Texto</div>
              <small class="text-muted">Abre WhatsApp al instante con el resumen de matrícula y avances por grado en texto.</small>
            </div>
          </button>

          <!-- OPCIÓN 4: IMAGEN + TEXTO COMPLETO -->
          <button id="btn-wa-opt-imagen-texto" class="btn btn-outline-dark p-3 rounded-4 border text-start d-flex align-items-center gap-3 hover-efecto shadow-sm">
            <div class="bg-dark bg-opacity-10 text-dark p-2.5 rounded-circle flex-shrink-0">
              <i class="bi bi-layers-fill fs-3"></i>
            </div>
            <div>
              <div class="fw-bold text-dark fs-6">4. Imagen + Texto Completo</div>
              <small class="text-muted">Incluye texto detallado, enlace de previsualización web y la imagen en el portapapeles.</small>
            </div>
          </button>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Cancelar',
      cancelButtonColor: '#6c757d',
      didOpen: () => {
        document.getElementById('btn-wa-opt-solo-imagen')?.addEventListener('click', () => {
          Swal.close();
          enviarWhatsAppImagen(stats, nombreInstitucion, 'png', tipoGrafico, criterioAgrupacion, 'solo_imagen');
        });
        document.getElementById('btn-wa-opt-solo-dossier')?.addEventListener('click', () => {
          Swal.close();
          enviarWhatsAppImagen(stats, nombreInstitucion, 'png', 'dossier', 'grados', 'solo_imagen');
        });
        document.getElementById('btn-wa-opt-solo-texto')?.addEventListener('click', () => {
          Swal.close();
          enviarWhatsAppTexto(stats, nombreInstitucion);
        });
        document.getElementById('btn-wa-opt-imagen-texto')?.addEventListener('click', () => {
          Swal.close();
          enviarWhatsAppImagen(stats, nombreInstitucion, 'png', 'dossier', 'grados', 'imagen_y_texto');
        });
      }
    });
  };

  const handleEnviarCorreo = () => {
    const stats = calcularEstadisticasReporte(escuelaReporte);
    const nombreInstitucion = escuelaReporte === 'ambas' 
      ? 'GENERAL ESCUELAS DEP ORIENTE' 
      : (escuelaReporte === 'sb' ? 'U.E. SANTA BÁRBARA' : 'U.E. LIBERTADOR BOLÍVAR');
    
    const asunto = `SIGAE: Reporte Estadístico de Actualización - ${nombreInstitucion}`;
    const cuerpo = generarTextoResumen(stats, nombreInstitucion).replace(/\*/g, '');
    
    window.location.href = `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  };

  const imprimirReporteEstadistico = () => {
    const stats = calcularEstadisticasReporte(escuelaReporte);
    const nombreInstitucion = escuelaReporte === 'ambas' 
      ? 'GENERAL ESCUELAS DEP ORIENTE' 
      : (escuelaReporte === 'sb' ? 'U.E. SANTA BÁRBARA' : 'U.E. LIBERTADOR BOLÍVAR');

    const printWin = window.open('', '_blank', 'width=950,height=800');
    if (!printWin) {
      alert('Por favor permita las ventanas emergentes para generar la vista de impresión.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Reporte Estadístico de Actualización - ${nombreInstitucion}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
        <style>
          @page { size: portrait; margin: 10mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0f172a; background: #f8fafc; font-size: 11px; padding: 20px; }
          @media print {
            .no-print { display: none !important; }
            body { background: #fff !important; padding: 0 !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print mb-3 d-flex justify-content-between align-items-center bg-white p-3 rounded-4 shadow-sm border" style="max-width: 790px; margin: 0 auto 15px auto;">
          <span class="fw-bold text-muted"><i class="bi bi-printer me-2 text-primary"></i> Dossier Oficial para Impresión / Guardar en PDF</span>
          <div>
            <button class="btn btn-primary fw-bold px-4 me-2 shadow-sm rounded-pill" onclick="window.print()"><i class="bi bi-printer-fill me-2"></i>Imprimir / Guardar PDF</button>
            <button class="btn btn-secondary px-3 rounded-pill" onclick="window.close()">Cerrar</button>
          </div>
        </div>

        <div style="display: flex; justify-content: center;">
          <div style="background: #fff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-radius: 12px; border: 1px solid #cbd5e1;">
            ${generarReporteHTML(stats, nombreInstitucion, tipoGrafico, criterioAgrupacion)}
          </div>
        </div>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(htmlContent);
    printWin.document.close();
  };

  const listaFiltrada = vinculaciones.filter(v => {
    const q = busquedaDir.toLowerCase();
    const matchBusqueda = (
      v.cedula_estudiante?.toLowerCase().includes(q) ||
      v.nombres_estudiante?.toLowerCase().includes(q) ||
      v.apellidos_estudiante?.toLowerCase().includes(q) ||
      v.cedula_representante?.toLowerCase().includes(q) ||
      v.nombres_representante?.toLowerCase().includes(q)
    );
    const matchGrado = gradoFiltroDir === 'Todos' || v.grado_actual === gradoFiltroDir;
    const matchEscuela = escuelaFiltro === 'ambas' || v.codigo_escuela === escuelaFiltro;
    
    let matchAvance = true;
    if (avanceFiltroDir !== 'Todos') {
      const avance = calcularAvanceActualizacion(v);
      if (avanceFiltroDir === 'completado') matchAvance = avance.estado === 'completado';
      else if (avanceFiltroDir === 'en_proceso') matchAvance = avance.estado === 'en_proceso';
      else if (avanceFiltroDir === 'sin_iniciar') matchAvance = avance.estado === 'sin_iniciar';
    }

    return matchBusqueda && matchGrado && matchEscuela && matchAvance;
  });

  const indexUltimoDir = paginaActualDir * elementosPorPaginaDir;
  const indexPrimeroDir = indexUltimoDir - elementosPorPaginaDir;
  const vinculacionesPaginadas = listaFiltrada.slice(indexPrimeroDir, indexUltimoDir);
  const totalPaginasDir = Math.ceil(listaFiltrada.length / elementosPorPaginaDir);

  return (
    <>
      <div className="container-fluid py-4 animate__animated animate__fadeIn">
        {/* Encabezado Principal */}
      <div 
        className="banner-modulo p-4 p-md-5 mb-4 shadow-sm text-white position-relative overflow-hidden" 
        style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', borderRadius: '24px' }}
      >
        <div className="burbuja-3d burbuja-1" style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.15)', position: 'absolute', top: '-50px', right: '-20px', borderRadius: '50%' }}></div>
        <div className="burbuja-3d burbuja-2" style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.08)', position: 'absolute', bottom: '-20px', left: '20px', borderRadius: '50%' }}></div>
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between position-relative z-1">
          <div>
            <span className="badge bg-white text-primary fw-bold px-3 py-2 rounded-pill mb-3 shadow-sm text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.75rem' }}>
              <i className="bi bi-person-plus-fill me-2"></i>Módulo Escolar DEP Oriente
            </span>
            <h1 className="fw-bolder mb-2 display-6 text-white">
              <i className="bi bi-person-plus-fill me-3"></i>Vincular Estudiante
            </h1>
            <p className="mb-0 text-white-50 fs-6" style={{ maxWidth: '750px' }}>
              Asigne estudiantes a representantes o docentes previamente registrados. Al iniciar sesión en el portal, cada usuario verá sus representados bloqueados contra modificaciones indebidas.
            </p>
          </div>
            <div className="mt-4 mt-md-0 d-flex gap-2">
              <button 
                className={`btn ${activeTab === 'individual' ? 'btn-light text-primary fw-bold shadow' : 'btn-outline-light'}`}
                onClick={() => setActiveTab('individual')}
              >
                <i className="bi bi-person-plus me-2"></i>Individual
              </button>
              <button 
                className={`btn ${activeTab === 'masiva' ? 'btn-light text-primary fw-bold shadow' : 'btn-outline-light'}`}
                onClick={() => setActiveTab('masiva')}
              >
                <i className="bi bi-file-earmark-spreadsheet me-2"></i>Carga Masiva
              </button>
              <button 
                className={`btn ${activeTab === 'directorio' ? 'btn-light text-primary fw-bold shadow' : 'btn-outline-light'}`}
                onClick={() => setActiveTab('directorio')}
              >
                <i className="bi bi-table me-2"></i>Directorio
              </button>
            </div>
          </div>
      </div>

      {/* Pestaña 1: Vinculación Individual */}
      {activeTab === 'individual' && (
        <div className="row g-4">
          <div className="col-lg-12">
            <div className="card border-0 shadow-sm rounded-4 p-4">
              <h5 className="fw-bold text-dark mb-4 border-bottom pb-3">
                <i className="bi bi-search me-2 text-primary"></i>Paso 1: Buscar Representante en el Sistema
              </h5>
              <div className="row g-3 align-items-end mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold text-secondary">Cédula del Representante / Docente</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0"><i className="bi bi-person-vcard text-primary"></i></span>
                    <input 
                      type="text" 
                      className="form-control border-start-0" 
                      placeholder="Ej: 12345678" 
                      value={cedulaRepBuscar}
                      onChange={(e) => setCedulaRepBuscar(e.target.value)}
                    />
                    <button className="btn btn-primary px-4 fw-bold" type="button" onClick={buscarRepresentante} disabled={buscandoRep}>
                      {buscandoRep ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-search me-2"></i>Buscar</>}
                    </button>
                  </div>
                  <small className="text-muted">El representante debe estar dado de alta previamente en Gestión de Usuarios.</small>
                </div>
              </div>

              {repEncontrado && (
                <div className="alert alert-success border-0 shadow-sm rounded-4 p-4 mb-4 d-flex align-items-center justify-content-between animate__animated animate__fadeIn">
                  <div className="d-flex align-items-center">
                    <div className="bg-white text-success rounded-circle p-3 me-3 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '54px', height: '54px' }}>
                      <i className="bi bi-person-check-fill fs-3"></i>
                    </div>
                    <div>
                      <h6 className="fw-bolder mb-1 text-dark fs-5">{repEncontrado.nombre_completo}</h6>
                      <span className="badge bg-success me-2">C.I. {repEncontrado.cedula}</span>
                      <span className="badge bg-secondary">Rol: {repEncontrado.rol}</span>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => setRepEncontrado(null)}>
                    Cambiar
                  </button>
                </div>
              )}

              {repEncontrado && (
                <form onSubmit={handleGuardarIndividual} className="animate__animated animate__fadeInUp">
                  <h5 className="fw-bold text-dark mb-4 border-bottom pb-3 mt-4">
                    <i className="bi bi-mortarboard-fill me-2 text-primary"></i>Paso 2: Datos Completos del Estudiante (Inmutables)
                  </h5>
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <label className="form-label fw-bold text-secondary">Cédula de Identidad o Cédula Escolar <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required 
                        placeholder="Ej: V-30123456 o C.E. 11223344"
                        value={formInd.cedula_estudiante}
                        onChange={(e) => setFormInd({ ...formInd, cedula_estudiante: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold text-secondary">Nombres Completos <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required 
                        placeholder="Ej: Juan Alberto"
                        value={formInd.nombres_estudiante}
                        onChange={(e) => handleTituloChange(e, (val) => setFormInd(prev => ({ ...prev, nombres_estudiante: val })))}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold text-secondary">Apellidos Completos <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required 
                        placeholder="Ej: Pérez Rodríguez"
                        value={formInd.apellidos_estudiante}
                        onChange={(e) => handleTituloChange(e, (val) => setFormInd(prev => ({ ...prev, apellidos_estudiante: val })))}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold text-secondary">Grado a Cursar <span className="text-danger">*</span></label>
                      <select 
                        className="form-select"
                        value={formInd.grado_actual}
                        onChange={(e) => setFormInd({ ...formInd, grado_actual: e.target.value })}
                      >
                        <option value="Sin Grado Asignado">Sin Grado Asignado</option>
                        {gradosDB.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold text-secondary">Sección / Grupo <span className="text-danger">*</span></label>
                      <select 
                        className="form-select"
                        value={formInd.seccion_actual}
                        onChange={(e) => setFormInd({ ...formInd, seccion_actual: e.target.value })}
                      >
                        <option value="Sin Asignar">Sin Asignar</option>
                        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'Única'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold text-secondary">Escuela DEP Oriente</label>
                      <select 
                        className="form-select fw-bold"
                        value={formInd.codigo_escuela}
                        onChange={(e) => setFormInd({ ...formInd, codigo_escuela: e.target.value })}
                      >
                        <option value="sb">UE Santa Bárbara</option>
                        <option value="lb">UE Libertador Bolívar</option>
                      </select>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-3 pt-3 border-top">
                    <button type="button" className="btn btn-light px-4 fw-bold" onClick={() => setRepEncontrado(null)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary px-5 fw-bold shadow-sm" disabled={loading}>
                      {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check2-circle me-2"></i>}
                      Vincular Estudiante Ahora
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pestaña 2: Carga e Importación Masiva */}
      {activeTab === 'masiva' && (
        <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5">
          <div className="row align-items-center justify-content-between mb-4">
            <div className="col-md-7">
              <h4 className="fw-bold text-dark mb-1"><i className="bi bi-file-earmark-spreadsheet-fill text-success me-2"></i>Carga e Importación Masiva (Excel / CSV)</h4>
              <p className="text-muted mb-0">
                Sube un archivo de Excel (`.xlsx`, `.xls`) o `.csv` separado por puntos y comas (`;`) con las siguientes columnas:
              </p>
            </div>
            <div className="col-md-5 text-md-end mt-3 mt-md-0 d-flex flex-column gap-2">
              <button 
                type="button" 
                className="btn btn-outline-success fw-bold shadow-sm rounded-pill px-3 py-1 small"
                onClick={descargarPlantillaExcel}
              >
                <i className="bi bi-file-earmark-excel-fill fs-6 me-1"></i>
                Modelo Excel (.xlsx)
              </button>
              <button 
                type="button" 
                className="btn btn-outline-secondary fw-bold shadow-sm rounded-pill px-3 py-1 small"
                onClick={descargarPlantillaCSV}
              >
                <i className="bi bi-filetype-csv fs-6 me-1"></i>
                Modelo Linux (.csv)
              </button>
            </div>
          </div>

          <div className="bg-light border rounded-4 p-3 mb-4 font-monospace fs-6 text-dark overflow-auto">
            <code>Cédula_Representante | Cédula_Estudiante | Nombres_Estudiante | Apellidos_Estudiante | Escuela(sb/lb) | Grado_a_Cursar | Seccion</code>
            <br />
            <span className="text-muted small">Ejemplo: 12345678 | CE11223344 | Carlos Andrés | Mendoza Silva | sb | 1er Grado | A</span>
          </div>

          <div className="row g-3 align-items-center mb-4">
            <div className="col-md-8">
              <input 
                type="file" 
                accept=".xlsx,.xls,.ods,.csv,.txt" 
                className="form-control form-control-lg border-2" 
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              />
              <small className="text-muted mt-1 d-block"><i className="bi bi-info-circle me-1"></i>Formatos soportados: Excel (.xlsx, .xls) o Linux (.ods, .csv)</small>
            </div>
            <div className="col-md-4">
              <button 
                className="btn btn-success btn-lg w-100 fw-bold shadow-sm"
                onClick={handleProcesarArchivoCSV}
                disabled={!csvFile || loading}
              >
                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-lightning-charge-fill me-2"></i>}
                Validar Archivo
              </button>
            </div>
          </div>

          {procesadoMasivo && (
            <div className="animate__animated animate__fadeIn">
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="card border-success bg-success bg-opacity-10 rounded-4 p-3 text-success">
                    <h5 className="fw-bolder mb-1"><i className="bi bi-check-circle-fill me-2"></i>Registros Válidos: {previewValidos.length}</h5>
                    <small>Están listos para ser guardados en la base de datos de vinculaciones.</small>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card border-danger bg-danger bg-opacity-10 rounded-4 p-3 text-danger">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="fw-bolder mb-1"><i className="bi bi-x-circle-fill me-2"></i>Filas con Errores: {previewRechazados.length}</h5>
                        <small>No se importarán. Puede descargar el reporte de errores.</small>
                      </div>
                      {previewRechazados.length > 0 && (
                        <button className="btn btn-sm btn-danger fw-bold rounded-pill px-3" onClick={descargarRechazados}>
                          <i className="bi bi-download me-1"></i>Descargar CSV Errores
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {previewValidos.length > 0 && (
                <div className="table-responsive border rounded-4 mb-4" style={{ maxHeight: '350px' }}>
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>Cédula Rep.</th>
                        <th>Nombre Representante</th>
                        <th>Cédula Alumno</th>
                        <th>Nombres Alumno</th>
                        <th>Apellidos Alumno</th>
                        <th>Escuela</th>
                        <th>Grado</th>
                        <th>Sección</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewValidos.slice(0, 50).map((item, idx) => (
                        <tr key={idx}>
                          <td className="fw-bold text-primary">{item.cedula_representante}</td>
                          <td>{item.nombres_representante} {item.apellidos_representante}</td>
                          <td className="fw-bold text-dark">{item.cedula_estudiante}</td>
                          <td>{item.nombres_estudiante}</td>
                          <td>{item.apellidos_estudiante}</td>
                          <td><span className={`badge ${item.codigo_escuela === 'sb' ? 'bg-primary' : 'bg-success'}`}>{item.codigo_escuela.toUpperCase()}</span></td>
                          <td>{item.grado_actual}</td>
                          <td>{item.seccion_actual}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="d-flex justify-content-end gap-3 border-top pt-3">
                <button className="btn btn-light px-4 fw-bold" onClick={() => { setProcesadoMasivo(false); setPreviewValidos([]); setPreviewRechazados([]); }}>
                  Cancelar
                </button>
                <button 
                  className="btn btn-primary btn-lg px-5 fw-bold shadow" 
                  onClick={handleConfirmarCargaMasiva}
                  disabled={previewValidos.length === 0 || loading}
                >
                  {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-cloud-upload-fill me-2"></i>}
                  Confirmar e Importar {previewValidos.length} Estudiantes
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pestaña 3: Directorio General de Estudiantes Vinculados */}
      {activeTab === 'directorio' && (
        <div className="card border-0 shadow-sm rounded-4 p-4">
          <div className="row g-3 align-items-center mb-4">
            <div className="col-lg-3 col-md-4">
              <div className="btn-group w-100 shadow-sm" role="group">
                <button 
                  type="button" 
                  className={`btn ${escuelaFiltro === 'sb' ? 'btn-primary fw-bold' : 'btn-outline-primary'}`}
                  onClick={() => setEscuelaFiltro('sb')}
                >
                  SB ({countSB})
                </button>
                <button 
                  type="button" 
                  className={`btn ${escuelaFiltro === 'lb' ? 'btn-success fw-bold' : 'btn-outline-success'}`}
                  onClick={() => setEscuelaFiltro('lb')}
                >
                  LB ({countLB})
                </button>
                <button 
                  type="button" 
                  className={`btn ${escuelaFiltro === 'ambas' ? 'btn-dark fw-bold' : 'btn-outline-dark'}`}
                  onClick={() => setEscuelaFiltro('ambas')}
                >
                  Ambas ({countAmbas})
                </button>
              </div>
            </div>
            <div className="col-lg-3 col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
                <input 
                  type="text" 
                  className="form-control border-start-0" 
                  placeholder="Buscar cédula o nombre..." 
                  value={busquedaDir}
                  onChange={(e) => setBusquedaDir(e.target.value)}
                />
              </div>
            </div>
            <div className="col-lg-2 col-md-4">
              <select
                className="form-select fw-bold text-secondary"
                value={gradoFiltroDir}
                onChange={(e) => setGradoFiltroDir(e.target.value)}
              >
                <option value="Todos">Todos los Grados</option>
                {gradosDB.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="col-lg-2 col-md-6">
              <select
                className="form-select fw-bold text-secondary"
                value={avanceFiltroDir}
                onChange={(e) => setAvanceFiltroDir(e.target.value)}
              >
                <option value="Todos">📊 Todos los Avances</option>
                <option value="completado">✅ Completados (100%)</option>
                <option value="en_proceso">⏳ En Proceso</option>
                <option value="sin_iniciar">⭕ Sin Iniciar (0%)</option>
              </select>
            </div>
            <div className="col-lg-3 col-md-6 text-end d-flex gap-2 justify-content-end align-items-center">
              <button 
                className="btn btn-primary fw-bold shadow-sm rounded-pill px-3 d-flex align-items-center gap-1.5"
                onClick={() => {
                  setEscuelaReporte(escuelaFiltro === 'ambas' ? 'ambas' : (escuelaFiltro === 'sb' ? 'sb' : 'lb'));
                  setShowEstadisticasModal(true);
                }}
                title="Ver y descargar reporte estadístico de actualización"
              >
                <i className="bi bi-bar-chart-fill"></i>
                <span>Estadísticas</span>
              </button>
              {seleccionados.length > 0 && (
                <>
                  <button 
                    className="btn btn-warning fw-bold shadow-sm rounded-pill px-3 d-flex align-items-center gap-1.5 fade-in text-dark" 
                    onClick={() => {
                      const ests = vinculaciones.filter(v => seleccionados.includes(v.id));
                      handleAbrirTransferencia(ests);
                    }} 
                    disabled={loading} 
                    title="Reasignar representante a los estudiantes seleccionados"
                  >
                    <i className="bi bi-arrow-left-right"></i>
                    <span>Reasignar ({seleccionados.length})</span>
                  </button>
                  <button className="btn btn-danger fw-bold shadow-sm rounded-pill px-3 fade-in" onClick={handleEliminarMasivo} disabled={loading} title="Eliminar seleccionados">
                    <i className="bi bi-trash-fill me-1"></i> ({seleccionados.length})
                  </button>
                </>
              )}
              <button className="btn btn-outline-secondary fw-bold rounded-circle" style={{ width: '38px', height: '38px' }} onClick={cargarVinculaciones} disabled={loading} title="Actualizar lista">
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '40px' }}>
                    <div className="form-check">
                      <input 
                        className="form-check-input shadow-sm border-secondary" 
                        type="checkbox"
                        checked={vinculacionesPaginadas.length > 0 && seleccionados.length === vinculacionesPaginadas.length}
                        onChange={handleSeleccionarTodo}
                        disabled={vinculacionesPaginadas.length === 0}
                      />
                    </div>
                  </th>
                  <th>Representante</th>
                  <th>Cédula Alumno</th>
                  <th>Estudiante</th>
                  <th>Plantel</th>
                  <th>Grado</th>
                  <th>Avance de Actualización</th>
                  <th>Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-5">
                      <div className="spinner-border text-primary me-2" role="status"></div>
                      <span className="text-muted fw-bold">Cargando directorio de vinculaciones...</span>
                    </td>
                  </tr>
                ) : listaFiltrada.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-5 text-muted">
                      <i className="bi bi-folder2-open fs-1 d-block mb-2"></i>
                      No hay estudiantes vinculados con los filtros aplicados en {escuelaFiltro === 'sb' ? 'UE Santa Bárbara' : escuelaFiltro === 'lb' ? 'UE Libertador Bolívar' : 'el sistema'}.
                    </td>
                  </tr>
                ) : (
                  vinculacionesPaginadas.map((item) => (
                    <tr key={item.id} className={seleccionados.includes(item.id) ? 'table-danger' : ''}>
                      <td>
                        <div className="form-check">
                          <input 
                            className="form-check-input border-secondary cursor-pointer" 
                            type="checkbox"
                            checked={seleccionados.includes(item.id)}
                            onChange={() => handleToggleSeleccion(item.id)}
                          />
                        </div>
                      </td>
                      <td>
                        <div className="fw-bold text-dark">{toTitulo(`${item.nombres_representante} ${item.apellidos_representante}`)}</div>
                        <small className="text-muted">C.I. {item.cedula_representante}</small>
                      </td>
                      <td><span className="badge bg-light text-dark border fw-bold px-2 py-1 fs-6">{item.cedula_estudiante}</span></td>
                      <td>
                        <div className="fw-bold text-primary">{toTitulo(`${item.nombres_estudiante} ${item.apellidos_estudiante}`)}</div>
                      </td>
                      <td>
                        <span className={`badge ${item.codigo_escuela === 'sb' ? 'bg-primary' : 'bg-success'} text-white fw-bold px-2 py-1 shadow-sm`}>
                          {item.codigo_escuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar'}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border shadow-sm fw-semibold">{item.grado_actual || 'Sin Grado'}</span>
                      </td>
                      <td>
                        {(() => {
                          const av = calcularAvanceActualizacion(item);
                          return (
                            <div 
                              className="cursor-pointer p-1 rounded-3 hover-efecto"
                              onClick={() => handleAbrirAvance(item)}
                              title="Haz clic para ver el desglose detallado de avance"
                              style={{ minWidth: '140px' }}
                            >
                              <div className="d-flex align-items-center justify-content-between mb-1">
                                <span className={`badge bg-${av.badgeColor} bg-opacity-10 text-${av.badgeColor} border border-${av.badgeColor} px-2 py-0.5 rounded-pill fw-bold`} style={{ fontSize: '0.7rem' }}>
                                  {av.estado === 'completado' && <i className="bi bi-check-circle-fill me-1"></i>}
                                  {av.estado === 'en_proceso' && <i className="bi bi-hourglass-split me-1"></i>}
                                  {av.estado === 'sin_iniciar' && <i className="bi bi-circle me-1"></i>}
                                  {av.badgeText} ({av.porcentaje}%)
                                </span>
                              </div>
                              <div className="progress shadow-none" style={{ height: '5px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
                                <div 
                                  className={`progress-bar ${av.progressColor}`} 
                                  role="progressbar" 
                                  style={{ width: `${av.porcentaje}%` }}
                                ></div>
                              </div>
                              {av.fechaUltima ? (
                                <small className="text-muted d-block mt-1" style={{ fontSize: '0.68rem' }}>
                                  <i className="bi bi-calendar3 me-1"></i>{av.fechaUltima}
                                </small>
                              ) : (
                                <small className="text-muted d-block mt-1" style={{ fontSize: '0.68rem' }}>
                                  <i className="bi bi-clock-history me-1"></i>No iniciada
                                </small>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td>
                        <span className={`badge ${item.estado === 'Activo' ? 'bg-success' : 'bg-secondary'} rounded-pill`}>
                          {item.estado}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="btn-group shadow-sm">
                          <button 
                            className="btn btn-sm btn-outline-info rounded-start-pill" 
                            onClick={() => handleAbrirAvance(item)}
                            title="Ver Avance de Actualización"
                          >
                            <i className="bi bi-pie-chart-fill"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-warning text-dark" 
                            onClick={() => handleAbrirTransferencia([item])}
                            title="Reasignar / Cambiar Representante Legal"
                          >
                            <i className="bi bi-arrow-left-right text-dark"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-primary" 
                            onClick={() => handleAbrirEdicion(item)}
                            title="Editar Estudiante"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-secondary" 
                            onClick={() => handleResetearActualizacion(item)}
                            title="Resetear Datos de Actualización"
                          >
                            <i className="bi bi-arrow-counterclockwise"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger rounded-end-pill" 
                            onClick={() => handleDesvincular(item.id, toTitulo(`${item.nombres_estudiante} ${item.apellidos_estudiante}`))}
                            title="Desvincular Estudiante"
                          >
                            <i className="bi bi-trash3-fill"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginasDir > 1 && (
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-4 p-3 bg-light rounded-4 shadow-sm border">
              <span className="text-muted fw-bold mb-3 mb-md-0">
                <i className="bi bi-list-ol me-2"></i>
                Mostrando {indexPrimeroDir + 1} a {Math.min(indexUltimoDir, listaFiltrada.length)} de {listaFiltrada.length} estudiantes
              </span>
              
              <ul className="pagination pagination-sm mb-0 shadow-sm">
                <li className={`page-item ${paginaActualDir === 1 ? 'disabled' : ''}`}>
                  <button className="page-link text-primary fw-bold px-3" onClick={() => setPaginaActualDir(prev => Math.max(prev - 1, 1))}>
                    <i className="bi bi-chevron-left me-1"></i> Anterior
                  </button>
                </li>
                
                {/* Lógica de páginas visibles para no saturar si hay muchas (máximo 5 botones) */}
                {Array.from({ length: totalPaginasDir }, (_, i) => i + 1)
                  .filter(pag => pag === 1 || pag === totalPaginasDir || Math.abs(pag - paginaActualDir) <= 1)
                  .map((pag, idx, array) => {
                    const isGap = idx > 0 && pag - array[idx - 1] > 1;
                    return (
                      <React.Fragment key={pag}>
                        {isGap && <li className="page-item disabled"><span className="page-link">...</span></li>}
                        <li className={`page-item ${paginaActualDir === pag ? 'active' : ''}`}>
                          <button className="page-link fw-bold" onClick={() => setPaginaActualDir(pag)}>
                            {pag}
                          </button>
                        </li>
                      </React.Fragment>
                    );
                  })
                }

                <li className={`page-item ${paginaActualDir === totalPaginasDir ? 'disabled' : ''}`}>
                  <button className="page-link text-primary fw-bold px-3" onClick={() => setPaginaActualDir(prev => Math.min(prev + 1, totalPaginasDir))}>
                    Siguiente <i className="bi bi-chevron-right ms-1"></i>
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Modal de Edición (Renderizado en el Body usando Portals) */}
      {showEditModal && estudianteEditando && createPortal(
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow-lg animate__animated animate__zoomIn animate__faster">
              <div className="modal-header bg-light rounded-top-4 border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold text-dark">
                  <i className="bi bi-pencil-square text-primary me-2"></i>Editar Estudiante Vinculado
                </h5>
                <button type="button" className="btn-close shadow-sm" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleGuardarEdicion}>
                <div className="modal-body p-4">
                  
                  <div className="alert alert-info border-0 bg-info bg-opacity-10 d-flex align-items-center justify-content-between rounded-4 p-3 mb-4 flex-wrap gap-2">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-info-circle-fill fs-4 text-info me-3"></i>
                      <div>
                        <small className="d-block fw-bold text-dark">Representante Actual:</small>
                        <span className="text-secondary">{estudianteEditando.nombres_representante} {estudianteEditando.apellidos_representante} (C.I. {estudianteEditando.cedula_representante})</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold shadow-sm"
                      onClick={() => {
                        const est = estudianteEditando;
                        setShowEditModal(false);
                        handleAbrirTransferencia([est]);
                      }}
                    >
                      <i className="bi bi-arrow-left-right me-1"></i> Cambiar Representante
                    </button>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-secondary small">Cédula del Estudiante (Inmutable)</label>
                      <input type="text" className="form-control bg-light" value={estudianteEditando.cedula_estudiante} readOnly disabled />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-secondary small">Plantel / Institución Educativa</label>
                      <select 
                        className="form-select fw-bold"
                        value={estudianteEditando.codigo_escuela || 'sb'}
                        onChange={(e) => setEstudianteEditando({ ...estudianteEditando, codigo_escuela: e.target.value })}
                      >
                        <option value="sb">🏫 U.E. Santa Bárbara (SB)</option>
                        <option value="lb">🏫 U.E. Libertador Bolívar (LB)</option>
                      </select>
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-secondary small">Nombres</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required
                        value={estudianteEditando.nombres_estudiante}
                        onChange={(e) => handleTituloChange(e, (val) => setEstudianteEditando({ ...estudianteEditando, nombres_estudiante: val }))}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-secondary small">Apellidos</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required
                        value={estudianteEditando.apellidos_estudiante}
                        onChange={(e) => handleTituloChange(e, (val) => setEstudianteEditando({ ...estudianteEditando, apellidos_estudiante: val }))}
                      />
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-secondary small">Grado a Cursar</label>
                      <select 
                        className="form-select"
                        value={estudianteEditando.grado_actual}
                        onChange={(e) => setEstudianteEditando({ ...estudianteEditando, grado_actual: e.target.value })}
                      >
                        <option value="Sin Grado Asignado">Sin Grado Asignado</option>
                        {gradosDB.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-secondary small">Sección / Grupo</label>
                      <select 
                        className="form-select"
                        value={estudianteEditando.seccion_actual}
                        onChange={(e) => setEstudianteEditando({ ...estudianteEditando, seccion_actual: e.target.value })}
                      >
                        <option value="Sin Asignar">Sin Asignar</option>
                        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'Única'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                </div>
                <div className="modal-footer bg-light border-top-0 rounded-bottom-4">
                  <button type="button" className="btn btn-light fw-bold px-4" onClick={() => setShowEditModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary fw-bold shadow-sm px-4" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save-fill me-2"></i>}
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Detalle de Avance de Actualización */}
      {showAvanceModal && estudianteAvanceModal && createPortal(
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1060 }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow-lg animate__animated animate__zoomIn animate__faster overflow-hidden">
              {(() => {
                const av = calcularAvanceActualizacion(estudianteAvanceModal);
                const nombreEst = toTitulo(`${estudianteAvanceModal.nombres_estudiante} ${estudianteAvanceModal.apellidos_estudiante}`);
                const nombreRep = toTitulo(`${estudianteAvanceModal.nombres_representante} ${estudianteAvanceModal.apellidos_representante}`);
                const escuelaNom = estudianteAvanceModal.codigo_escuela === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar';

                return (
                  <>
                    <div className="modal-header bg-gradient text-white p-4" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}>
                      <div className="d-flex align-items-center gap-3">
                        <div className="p-3 bg-white bg-opacity-20 rounded-circle text-white d-flex align-items-center justify-content-center" style={{ width: '54px', height: '54px' }}>
                          <i className="bi bi-person-lines-fill fs-3"></i>
                        </div>
                        <div>
                          <span className={`badge ${estudianteAvanceModal.codigo_escuela === 'sb' ? 'bg-primary' : 'bg-success'} text-white fw-bold px-2.5 py-1 rounded-pill mb-1`} style={{ fontSize: '0.75rem' }}>
                            {escuelaNom}
                          </span>
                          <h5 className="modal-title fw-bold mb-0 text-white">{nombreEst}</h5>
                          <small className="text-white-50">C.I. / Escolar: {estudianteAvanceModal.cedula_estudiante} | {estudianteAvanceModal.grado_actual || 'Sin Grado'}</small>
                        </div>
                      </div>
                      <button type="button" className="btn-close btn-close-white shadow-sm" onClick={() => setShowAvanceModal(false)}></button>
                    </div>

                    <div className="modal-body p-4 bg-light">
                      {/* Tarjeta Resumen de Progreso */}
                      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                          <div>
                            <span className="text-muted small fw-bold text-uppercase">Nivel de Avance de Actualización</span>
                            <h3 className="fw-bolder mb-0 text-dark d-flex align-items-center gap-2">
                              <span>{av.porcentaje}%</span>
                              <span className={`badge bg-${av.badgeColor} bg-opacity-10 text-${av.badgeColor} border border-${av.badgeColor} fs-6 px-3 py-1 rounded-pill`}>
                                {av.badgeText}
                              </span>
                            </h3>
                          </div>
                          <div className="text-end">
                            <span className="badge bg-light text-dark border px-3 py-2 fw-semibold rounded-pill">
                              <i className="bi bi-check2-all text-success me-1"></i>{av.completadas} de {av.total} Secciones
                            </span>
                            {av.fechaUltima && (
                              <small className="d-block text-muted mt-1">
                                Última emisión: <strong>{av.fechaUltima}</strong>
                              </small>
                            )}
                          </div>
                        </div>

                        <div className="progress" style={{ height: '10px', backgroundColor: '#e9ecef', borderRadius: '10px' }}>
                          <div 
                            className={`progress-bar progress-bar-striped progress-bar-animated ${av.progressColor}`} 
                            role="progressbar" 
                            style={{ width: `${av.porcentaje}%` }}
                          ></div>
                        </div>

                        <div className="d-flex align-items-center justify-content-between mt-3 pt-3 border-top text-muted small">
                          <span><i className="bi bi-person-fill me-1"></i>Representante: <strong>{nombreRep}</strong> (C.I. {estudianteAvanceModal.cedula_representante})</span>
                          <span><i className="bi bi-door-open-fill me-1"></i>Sección: <strong>{estudianteAvanceModal.seccion_actual || 'A'}</strong></span>
                        </div>
                      </div>

                      {/* Desglose de Secciones */}
                      <h6 className="fw-bold text-dark mb-3 d-flex align-items-center">
                        <i className="bi bi-list-check text-primary me-2 fs-5"></i>
                        Desglose de Secciones de la Ficha Integral
                      </h6>

                      <div className="row g-3">
                        {av.secciones.map((sec, i) => (
                          <div className="col-md-6" key={sec.id}>
                            <div className={`card border-0 shadow-sm rounded-3 p-3 h-100 ${sec.ok ? 'bg-white' : 'bg-white bg-opacity-75 border-start border-warning border-3'}`}>
                              <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-2.5">
                                  <div className={`p-2 rounded-circle ${sec.ok ? 'bg-success bg-opacity-10 text-success' : 'bg-warning bg-opacity-10 text-warning'}`}>
                                    <i className={`bi ${sec.icono} fs-5`}></i>
                                  </div>
                                  <div>
                                    <span className="fw-bold text-dark d-block small" style={{ fontSize: '0.85rem' }}>
                                      {i + 1}. {sec.nombre}
                                    </span>
                                    <small className={sec.ok ? 'text-success fw-bold' : 'text-warning fw-bold'} style={{ fontSize: '0.72rem' }}>
                                      {sec.ok ? '● Completado' : '○ Incompleto / Pendiente'}
                                    </small>
                                  </div>
                                </div>
                                <div>
                                  {sec.ok ? (
                                    <span className="badge bg-success bg-opacity-10 text-success p-1.5 rounded-circle">
                                      <i className="bi bi-check-lg fs-6"></i>
                                    </span>
                                  ) : (
                                    <span className="badge bg-warning bg-opacity-10 text-warning p-1.5 rounded-circle">
                                      <i className="bi bi-exclamation fs-6"></i>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="modal-footer bg-white border-top d-flex justify-content-between p-3">
                      <button 
                        type="button" 
                        className="btn btn-outline-danger fw-bold rounded-pill px-4"
                        onClick={() => handleResetearActualizacion(estudianteAvanceModal)}
                        disabled={loading}
                        title="Restablece la ficha integral a blanco para que el representante la vuelva a llenar"
                      >
                        <i className="bi bi-arrow-counterclockwise me-1"></i> Resetear Datos de Actualización
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-primary fw-bold rounded-pill px-4 shadow-sm"
                        onClick={() => setShowAvanceModal(false)}
                      >
                        Cerrar
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL ESTADÍSTICAS Y REPORTE OFICIAL REDISEÑADO ─── */}
      {showEstadisticasModal && createPortal(
        <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(15, 23, 42, 0.75)', zIndex: 1060, backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable" style={{ maxWidth: '1140px' }}>
            <div className="modal-content rounded-4 border-0 shadow-2xl overflow-hidden" style={{ background: '#f8fafc' }}>
              {(() => {
                const stats = calcularEstadisticasReporte(escuelaReporte);
                const nombreInstitucion = escuelaReporte === 'ambas' 
                  ? 'General Escuelas DEP Oriente' 
                  : (escuelaReporte === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar');

                // Obtener conjunto de datos según criterio de agrupación seleccionado
                let dataset: any[] = [];
                let tituloVista = '';
                if (criterioAgrupacion === 'niveles') {
                  dataset = stats.desgloseEtapas || [];
                  tituloVista = 'Desglose por Niveles / Etapas Educativas';
                } else if (criterioAgrupacion === 'secciones') {
                  dataset = stats.desgloseSecciones || [];
                  tituloVista = 'Desglose por Dimensiones Censales (8 Secciones)';
                } else if (criterioAgrupacion === 'semaforo') {
                  dataset = [
                    { nombre: '🟢 Nivel Óptimo (≥75%)', total: stats.semaforoOptimo?.length || 0, pct: stats.totalGeneral > 0 ? Math.round(((stats.semaforoOptimo?.reduce((a: number, c: any) => a + c.completados, 0) || 0) / stats.totalGeneral) * 100) : 0, completados: stats.semaforoOptimo?.reduce((a: number, c: any) => a + c.completados, 0) || 0, items: stats.semaforoOptimo, color: '#10b981' },
                    { nombre: '🟡 En Progreso (40%-74%)', total: stats.semaforoEnProgreso?.length || 0, pct: stats.totalGeneral > 0 ? Math.round(((stats.semaforoEnProgreso?.reduce((a: number, c: any) => a + c.completados, 0) || 0) / stats.totalGeneral) * 100) : 0, completados: stats.semaforoEnProgreso?.reduce((a: number, c: any) => a + c.completados, 0) || 0, items: stats.semaforoEnProgreso, color: '#f59e0b' },
                    { nombre: '🔴 Atención Prioritaria (<40%)', total: stats.semaforoAtencion?.length || 0, pct: stats.totalGeneral > 0 ? Math.round(((stats.semaforoAtencion?.reduce((a: number, c: any) => a + c.completados, 0) || 0) / stats.totalGeneral) * 100) : 0, completados: stats.semaforoAtencion?.reduce((a: number, c: any) => a + c.completados, 0) || 0, items: stats.semaforoAtencion, color: '#ef4444' }
                  ];
                  tituloVista = 'Desglose por Semáforo de Gestión y Priorización';
                } else if (criterioAgrupacion === 'general') {
                  dataset = [
                    { nombre: 'Actualizados (100%)', total: stats.totalGeneral, completados: stats.completadosGeneral, pct: stats.pctGeneral, color: '#10b981' },
                    { nombre: 'En Proceso', total: stats.totalGeneral, completados: stats.enProcesoGeneral, pct: stats.totalGeneral > 0 ? Math.round((stats.enProcesoGeneral / stats.totalGeneral) * 100) : 0, color: '#f59e0b' },
                    { nombre: 'Sin Iniciar (0%)', total: stats.totalGeneral, completados: stats.sinIniciarGeneral, pct: stats.totalGeneral > 0 ? Math.round((stats.sinIniciarGeneral / stats.totalGeneral) * 100) : 0, color: '#94a3b8' }
                  ];
                  tituloVista = 'Consolidado General Institucional';
                } else {
                  dataset = stats.desglosePorGrado || [];
                  tituloVista = `Desglose por Grado / Año Escolar (${stats.desglosePorGrado?.length || 0} Aulas)`;
                }

                return (
                  <>
                    {/* ENCABEZADO INSTITUCIONAL OFICIAL CON LOGOS */}
                    <div className="modal-header bg-white px-4 py-3 border-bottom shadow-sm d-block" style={{ borderBottom: '3px solid #1e40af' }}>
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                        {/* LOGOS IZQUIERDA: ESCUELA */}
                        <div className="d-flex align-items-center gap-2">
                          {escuelaReporte === 'ambas' ? (
                            <>
                              <img src="/assets/img/logo_sb.png" alt="U.E. Santa Bárbara" style={{ height: '44px', width: 'auto' }} />
                              <img src="/assets/img/logo_lb.png" alt="U.E. Libertador Bolívar" style={{ height: '44px', width: 'auto' }} />
                            </>
                          ) : escuelaReporte === 'sb' ? (
                            <img src="/assets/img/logo_sb.png" alt="U.E. Santa Bárbara" style={{ height: '46px', width: 'auto' }} />
                          ) : (
                            <img src="/assets/img/logo_lb.png" alt="U.E. Libertador Bolívar" style={{ height: '46px', width: 'auto' }} />
                          )}
                        </div>

                        {/* MEMBRETE INSTITUCIONAL CENTRAL */}
                        <div className="text-center flex-grow-1 px-2">
                          <span className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
                            República Bolivariana de Venezuela • Ministerio del Poder Popular para la Educación
                          </span>
                          <span className="fw-bold text-primary text-uppercase d-block" style={{ fontSize: '0.72rem' }}>
                            Dirección Ejecutiva de Producción Oriente • Gestión Educativa
                          </span>
                          <h5 className="fw-bolder text-dark mb-0 mt-0.5" style={{ letterSpacing: '-0.3px', color: '#1e40af' }}>
                            {nombreInstitucion}
                          </h5>
                          <div className="d-flex align-items-center justify-content-center gap-2 mt-1">
                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-0.5" style={{ fontSize: '0.7rem' }}>
                              <i className="bi bi-bar-chart-line-fill me-1"></i> Control de Avance y Reporte Estadístico Oficial
                            </span>
                            <span className="text-muted small" style={{ fontSize: '0.7rem' }}>
                              <i className="bi bi-clock-history me-1"></i> {stats.fechaHoraReporte}
                            </span>
                          </div>
                        </div>

                        {/* LOGO DERECHA: SIGAE Y BOTÓN CERRAR */}
                        <div className="d-flex align-items-center gap-2.5">
                          <img 
                            src="/assets/img/sigae.png" 
                            alt="Sistema SIGAE" 
                            style={{ height: '48px', width: 'auto' }} 
                            className="img-fluid"
                          />
                          <button 
                            type="button" 
                            className="btn-close ms-1" 
                            onClick={() => setShowEstadisticasModal(false)}
                            aria-label="Cerrar"
                          ></button>
                        </div>
                      </div>
                    </div>

                    <div className="modal-body p-3 p-md-4">
                      {/* BARRA DE CONTROL EJECUTIVA SIGAE: INSTITUCIÓN, VISUALIZACIÓN Y DESGLOSE */}
                      <div className="bg-white p-2.5 rounded-4 shadow-sm border mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2.5" style={{ borderColor: '#e2e8f0' }}>
                        
                        {/* Selector de Escuela en Cápsula Azul SIGAE */}
                        <div className="d-flex align-items-center gap-1.5">
                          <span className="small fw-bold text-primary me-1 d-none d-md-inline" style={{ fontSize: '0.75rem' }}>
                            <i className="bi bi-building-fill me-1"></i>Ámbito:
                          </span>
                          <div className="btn-group btn-group-sm p-0.5 rounded-pill bg-light border" role="group">
                            <button 
                              type="button" 
                              className={`btn btn-sm rounded-pill px-3 fw-bold border-0 ${escuelaReporte === 'ambas' ? 'btn-primary text-white shadow-sm' : 'text-secondary hover-primary'}`}
                              onClick={() => setEscuelaReporte('ambas')}
                              style={{ fontSize: '0.74rem' }}
                            >
                              🌐 Todas
                            </button>
                            <button 
                              type="button" 
                              className={`btn btn-sm rounded-pill px-3 fw-bold border-0 ${escuelaReporte === 'sb' ? 'btn-primary text-white shadow-sm' : 'text-secondary hover-primary'}`}
                              onClick={() => setEscuelaReporte('sb')}
                              style={{ fontSize: '0.74rem' }}
                            >
                              🏫 Sta. Bárbara
                            </button>
                            <button 
                              type="button" 
                              className={`btn btn-sm rounded-pill px-3 fw-bold border-0 ${escuelaReporte === 'lb' ? 'btn-primary text-white shadow-sm' : 'text-secondary hover-primary'}`}
                              onClick={() => setEscuelaReporte('lb')}
                              style={{ fontSize: '0.74rem' }}
                            >
                              🏫 Lib. Bolívar
                            </button>
                          </div>
                        </div>

                        {/* Selector de Tipo de Gráfico */}
                        <div className="d-flex align-items-center gap-1 flex-wrap">
                          {[
                            { id: 'dossier', label: 'Dossier 360°', icon: 'bi-grid-1x2-fill' },
                            { id: 'torta', label: 'Torta 3D', icon: 'bi-pie-chart-fill' },
                            { id: 'anillos', label: 'Anillos', icon: 'bi-record-circle' },
                            { id: 'picos', label: 'Picos', icon: 'bi-graph-up' },
                            { id: 'barras', label: 'Barras', icon: 'bi-bar-chart-steps' },
                            { id: 'radar', label: 'Radar', icon: 'bi-bullseye' },
                            { id: 'tacometro', label: 'Tacómetro', icon: 'bi-speedometer2' },
                            { id: 'tabla', label: 'Tabla', icon: 'bi-table' },
                          ].map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              className={`btn btn-sm px-2.5 py-1 rounded-3 fw-bold transition-all ${
                                tipoGrafico === t.id 
                                  ? 'btn-primary text-white shadow-sm' 
                                  : 'btn-outline-primary bg-white text-primary border-0 hover-primary'
                              }`}
                              onClick={() => setTipoGrafico(t.id as any)}
                              style={{ fontSize: '0.76rem', backgroundColor: tipoGrafico === t.id ? '#1e40af' : '#f8fafc', borderColor: '#dbeafe' }}
                            >
                              <i className={`bi ${t.icon} me-1`}></i>
                              {t.label}
                            </button>
                          ))}
                        </div>

                        {/* Selector de Desglose / Agrupación */}
                        <div className="d-flex align-items-center gap-1.5 ms-auto">
                          <span className="small fw-bold text-muted me-1 d-none d-lg-inline" style={{ fontSize: '0.75rem' }}>
                            <i className="bi bi-funnel-fill text-primary me-1"></i>Desglose:
                          </span>
                          <div className="btn-group btn-group-sm bg-light p-0.5 rounded-3 border" role="group">
                            {[
                              { id: 'grados', label: 'Grados' },
                              { id: 'niveles', label: 'Niveles' },
                              { id: 'secciones', label: 'Dimensiones' },
                              { id: 'semaforo', label: 'Semáforo' },
                              { id: 'general', label: 'General' },
                            ].map((g) => (
                              <button
                                key={g.id}
                                type="button"
                                className={`btn btn-sm py-1 px-2.5 fw-bold rounded-2 border-0 ${
                                  criterioAgrupacion === g.id 
                                    ? 'btn-primary text-white shadow-sm' 
                                    : 'text-secondary hover-primary'
                                }`}
                                onClick={() => setCriterioAgrupacion(g.id as any)}
                                style={{ fontSize: '0.74rem', backgroundColor: criterioAgrupacion === g.id ? '#1e40af' : 'transparent' }}
                              >
                                {g.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* FRANJA DE METRICAS KPIS COMPACTA Y MODERNA */}
                      <div className="row g-2 mb-3">
                        <div className="col-lg-3 col-6">
                          <div className="bg-white p-2.5 rounded-3 shadow-sm border border-light d-flex align-items-center justify-content-between">
                            <div>
                              <span className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>Total Matrícula</span>
                              <span className="fs-4 fw-bolder text-dark lh-1">{stats.totalGeneral}</span>
                            </div>
                            <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle">
                              <i className="bi bi-people-fill fs-5"></i>
                            </div>
                          </div>
                        </div>

                        <div className="col-lg-3 col-6">
                          <div className="bg-white p-2.5 rounded-3 shadow-sm border border-light d-flex align-items-center justify-content-between">
                            <div>
                              <span className="text-success text-uppercase fw-bold d-block" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>Actualizados (100%)</span>
                              <div className="d-flex align-items-baseline gap-1.5">
                                <span className="fs-4 fw-bolder text-success lh-1">{stats.completadosGeneral}</span>
                                <span className="badge bg-success bg-opacity-15 text-success fw-bold" style={{ fontSize: '0.7rem' }}>{stats.pctGeneral}%</span>
                              </div>
                            </div>
                            <div className="bg-success bg-opacity-10 text-success p-2 rounded-circle">
                              <i className="bi bi-check-circle-fill fs-5"></i>
                            </div>
                          </div>
                        </div>

                        <div className="col-lg-3 col-6">
                          <div className="bg-white p-2.5 rounded-3 shadow-sm border border-light d-flex align-items-center justify-content-between">
                            <div>
                              <span className="text-warning text-uppercase fw-bold d-block" style={{ fontSize: '0.68rem', letterSpacing: '0.5px', color: '#b45309 !important' }}>En Proceso</span>
                              <div className="d-flex align-items-baseline gap-1.5">
                                <span className="fs-4 fw-bolder text-warning lh-1" style={{ color: '#b45309 !important' }}>{stats.enProcesoGeneral}</span>
                                <span className="badge bg-warning bg-opacity-15 text-warning fw-bold" style={{ fontSize: '0.7rem', color: '#b45309 !important' }}>
                                  {stats.totalGeneral > 0 ? Math.round((stats.enProcesoGeneral / stats.totalGeneral) * 100) : 0}%
                                </span>
                              </div>
                            </div>
                            <div className="bg-warning bg-opacity-10 text-warning p-2 rounded-circle">
                              <i className="bi bi-hourglass-split fs-5"></i>
                            </div>
                          </div>
                        </div>

                        <div className="col-lg-3 col-6">
                          <div className="bg-white p-2.5 rounded-3 shadow-sm border border-light d-flex align-items-center justify-content-between">
                            <div>
                              <span className="text-secondary text-uppercase fw-bold d-block" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>Sin Iniciar</span>
                              <div className="d-flex align-items-baseline gap-1.5">
                                <span className="fs-4 fw-bolder text-secondary lh-1">{stats.sinIniciarGeneral}</span>
                                <span className="badge bg-secondary bg-opacity-15 text-secondary fw-bold" style={{ fontSize: '0.7rem' }}>
                                  {stats.totalGeneral > 0 ? Math.round((stats.sinIniciarGeneral / stats.totalGeneral) * 100) : 0}%
                                </span>
                              </div>
                            </div>
                            <div className="bg-secondary bg-opacity-10 text-secondary p-2 rounded-circle">
                              <i className="bi bi-dash-circle fs-5"></i>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ─── LIENZO CENTRAL DINÁMICO SEGÚN TIPO DE GRÁFICO ─── */}

                      {/* 1. DOSSIER 360° EJECUTIVO */}
                      {tipoGrafico === 'dossier' && (() => {
                        const R = 48;
                        const C = 2 * Math.PI * R;
                        const lenComp = stats.totalGeneral > 0 ? (stats.completadosGeneral / stats.totalGeneral) * C : 0;
                        const lenProc = stats.totalGeneral > 0 ? (stats.enProcesoGeneral / stats.totalGeneral) * C : 0;
                        const lenSin = stats.totalGeneral > 0 ? (stats.sinIniciarGeneral / stats.totalGeneral) * C : 0;
                        const pct = stats.pctGeneral;
                        const needleAngle = -90 + (pct / 100) * 180;
                        const gaugeColor = pct >= 75 ? '#10b981' : (pct >= 40 ? '#f59e0b' : '#ef4444');

                        return (
                          <div className="animate__animated animate__fadeIn">
                            <div className="row g-3 mb-3">
                              {/* Tacómetro Radial */}
                              <div className="col-lg-4 col-md-6">
                                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 text-center d-flex flex-column justify-content-between">
                                  <div className="d-flex justify-content-between align-items-center mb-1 pb-1 border-bottom">
                                    <span className="fw-bold text-dark small"><i className="bi bi-speedometer2 text-primary me-1"></i>Meta Global</span>
                                    <span className="badge bg-light text-muted border">100%</span>
                                  </div>
                                  <div className="py-1 position-relative d-flex justify-content-center align-items-center" style={{ height: '95px' }}>
                                    <svg width="170" height="95" viewBox="0 0 140 85">
                                      <path d="M 15 75 A 55 55 0 0 1 125 75" fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round" />
                                      <path d="M 15 75 A 55 55 0 0 1 125 75" fill="none" stroke={gaugeColor} strokeWidth="12" strokeLinecap="round" strokeDasharray="172.78" strokeDashoffset={172.78 * (1 - pct / 100)} />
                                      <g transform={`translate(70, 75) rotate(${needleAngle})`}>
                                        <line x1="0" y1="0" x2="0" y2="-40" stroke="#1e40af" strokeWidth="3.5" strokeLinecap="round" />
                                        <circle cx="0" cy="0" r="4.5" fill="#1e40af" />
                                      </g>
                                    </svg>
                                  </div>
                                  <div className="mt-1">
                                    <div className="fs-3 fw-bolder lh-1" style={{ color: gaugeColor }}>{stats.pctGeneral}%</div>
                                    <span className={`badge px-2.5 py-0.5 rounded-pill fw-bold mt-1 ${pct >= 75 ? 'bg-success bg-opacity-10 text-success' : (pct >= 40 ? 'bg-warning bg-opacity-10 text-warning' : 'bg-danger bg-opacity-10 text-danger')}`} style={{ fontSize: '0.72rem' }}>
                                      {pct >= 75 ? '🟢 Nivel Óptimo' : (pct >= 40 ? '🟡 En Progreso' : '🔴 Atención Prioritaria')}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Donut Concéntrico */}
                              <div className="col-lg-4 col-md-6">
                                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 text-center d-flex flex-column justify-content-between">
                                  <div className="d-flex justify-content-between align-items-center mb-1 pb-1 border-bottom">
                                    <span className="fw-bold text-dark small"><i className="bi bi-pie-chart-fill text-primary me-1"></i>Distribución</span>
                                    <span className="badge bg-light text-muted border">Proporción</span>
                                  </div>
                                  <div className="py-1 position-relative d-flex justify-content-center align-items-center">
                                    <svg width="115" height="115" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
                                      <circle cx="65" cy="65" r={R} fill="none" stroke="#f1f5f9" strokeWidth="16" />
                                      {lenComp > 0 && <circle cx="65" cy="65" r={R} fill="none" stroke="#10b981" strokeWidth="16" strokeDasharray={`${lenComp} ${C - lenComp}`} strokeDashoffset={0} />}
                                      {lenProc > 0 && <circle cx="65" cy="65" r={R} fill="none" stroke="#f59e0b" strokeWidth="16" strokeDasharray={`${lenProc} ${C - lenProc}`} strokeDashoffset={-lenComp} />}
                                      {lenSin > 0 && <circle cx="65" cy="65" r={R} fill="none" stroke="#94a3b8" strokeWidth="16" strokeDasharray={`${lenSin} ${C - lenSin}`} strokeDashoffset={-(lenComp + lenProc)} />}
                                    </svg>
                                    <div className="position-absolute text-center">
                                      <span className="fs-5 fw-bolder text-dark d-block lh-1">{stats.totalGeneral}</span>
                                      <span className="text-muted fw-bold" style={{ fontSize: '0.62rem' }}>ALUMNOS</span>
                                    </div>
                                  </div>
                                  <div className="d-flex justify-content-around text-center pt-1 border-top" style={{ fontSize: '0.72rem' }}>
                                    <div><span className="fw-bold text-success d-block">{stats.completadosGeneral}</span><span className="text-muted">Listos</span></div>
                                    <div><span className="fw-bold text-warning d-block" style={{ color: '#b45309 !important' }}>{stats.enProcesoGeneral}</span><span className="text-muted">Proceso</span></div>
                                    <div><span className="fw-bold text-secondary d-block">{stats.sinIniciarGeneral}</span><span className="text-muted">Pend.</span></div>
                                  </div>
                                </div>
                              </div>

                              {/* Niveles Educativos */}
                              <div className="col-lg-4 col-md-12">
                                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 d-flex flex-column justify-content-between">
                                  <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom">
                                    <span className="fw-bold text-dark small"><i className="bi bi-diagram-3-fill text-primary me-1"></i>Avance por Nivel</span>
                                    <span className="badge bg-primary bg-opacity-10 text-primary border">Etapas</span>
                                  </div>
                                  <div className="d-flex flex-column gap-2">
                                    {stats.desgloseEtapas?.map((et, idx) => (
                                      <div key={idx} className="p-2 rounded-3 bg-light border">
                                        <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '0.75rem' }}>
                                          <span className="fw-bold text-dark">{et.etapa}</span>
                                          <span className="badge bg-success bg-opacity-10 text-success fw-bold">{et.completados}/{et.total} ({et.pct}%)</span>
                                        </div>
                                        <div className="progress rounded-pill shadow-inner" style={{ height: '7px' }}>
                                          <div className="progress-bar bg-success" style={{ width: `${et.pct}%` }}></div>
                                          <div className="progress-bar bg-warning" style={{ width: `${et.total > 0 ? (et.enProceso / et.total) * 100 : 0}%` }}></div>
                                          <div className="progress-bar bg-secondary bg-opacity-50" style={{ width: `${et.total > 0 ? (et.sinIniciar / et.total) * 100 : 0}%` }}></div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Picos Skyline por Grado */}
                            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                              <div className="d-flex justify-content-between align-items-center mb-2 pb-1 border-bottom">
                                <span className="fw-bold text-dark small"><i className="bi bi-graph-up text-primary me-1"></i>Picos de Rendimiento por Aula ({stats.desglosePorGrado.length} Grados)</span>
                                <span className="badge bg-light text-muted border">Maternal a 5to Año</span>
                              </div>
                              <div style={{ height: '110px' }} className="d-flex align-items-flex-end gap-1.5 pt-3 px-1 border-bottom bg-light rounded-3">
                                {stats.desglosePorGrado.map((g, idx) => {
                                  const h = Math.max(g.pctCompletado, 6);
                                  const color = g.pctCompletado >= 75 ? '#10b981' : (g.pctCompletado >= 40 ? '#f59e0b' : '#ef4444');
                                  return (
                                    <div key={idx} className="flex-grow-1 d-flex flex-column align-items-center justify-content-end h-100 position-relative">
                                      <span className="fw-bold" style={{ fontSize: '0.64rem', color: color, marginBottom: '1px' }}>{g.pctCompletado}%</span>
                                      <div className="w-100 rounded-top shadow-sm" style={{ height: `${h}%`, backgroundColor: color, maxWidth: '24px' }}></div>
                                      <span className="text-muted text-truncate mt-1" style={{ fontSize: '0.58rem', maxWidth: '32px' }} title={g.grado}>
                                        {g.grado.replace('Educación ', '').replace('Grado', 'G').replace('Año', 'A')}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* 2. TORTA 3D ISOMÉTRICA CON VALORES VISIBLES */}
                      {tipoGrafico === 'torta' && (() => {
                        const palette = [
                          '#00C3FF', '#8B5CF6', '#00E676', '#FF8D00', '#EC4899', '#3B82F6', 
                          '#10B981', '#F59E0B', '#06B6D4', '#6366F1', '#14B8A6', '#84CC16'
                        ];
                        const darkPalette = [
                          '#0095C2', '#6D28D9', '#00B359', '#CC7000', '#BE185D', '#1D4ED8', 
                          '#059669', '#D97706', '#0891B2', '#4338CA', '#0D9488', '#65A30D'
                        ];

                        const totalVal = dataset.reduce((acc, it) => acc + (it.completados || it.total || it.pct || 1), 0);
                        let accumAngle = -Math.PI / 2;
                        const cx = 155;
                        const cy = 95;
                        const rx = 120;
                        const ry = 58;
                        const depth = 22;

                        const slices = dataset.map((it, idx) => {
                          const val = it.completados !== undefined ? (it.completados || (it.total ? 0.01 : 1)) : (it.pct || 1);
                          const fraction = totalVal > 0 ? (val / totalVal) : (1 / dataset.length);
                          const angleSpan = fraction * 2 * Math.PI;
                          const startAngle = accumAngle;
                          const endAngle = accumAngle + angleSpan;
                          accumAngle = endAngle;

                          const x1 = cx + rx * Math.cos(startAngle);
                          const y1 = cy + ry * Math.sin(startAngle);
                          const x2 = cx + rx * Math.cos(endAngle);
                          const y2 = cy + ry * Math.sin(endAngle);
                          const largeArc = angleSpan > Math.PI ? 1 : 0;
                          const midAngle = startAngle + angleSpan / 2;
                          const color = it.color || palette[idx % palette.length];
                          const darkColor = darkPalette[idx % darkPalette.length];
                          const label = it.grado || it.etapa || it.nombre || `Segmento ${idx + 1}`;
                          const pctDisplay = it.pctCompletado ?? it.pct ?? Math.round(fraction * 100);

                          return {
                            it, idx, val, fraction, startAngle, endAngle, angleSpan,
                            x1, y1, x2, y2, largeArc, midAngle, color, darkColor, label, pctDisplay
                          };
                        });

                        return (
                          <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white animate__animated animate__fadeIn">
                            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-wrap gap-2">
                              <div>
                                <h6 className="fw-bold text-dark mb-0">
                                  <i className="bi bi-pie-chart-fill text-primary me-2"></i>
                                  Torta 3D Volumétrica: {tituloVista}
                                </h6>
                                <small className="text-muted">Proporciones volumétricas con valores proyectados por color.</small>
                              </div>
                              <span className="badge bg-primary bg-opacity-10 text-primary border px-3 py-1 fw-bold">{nombreInstitucion}</span>
                            </div>

                            <div className="row align-items-center g-4">
                              {/* SVG 3D */}
                              <div className="col-lg-6 text-center">
                                <div className="p-3 bg-light rounded-4 border d-flex justify-content-center align-items-center shadow-inner" style={{ minHeight: '240px' }}>
                                  <svg width="310" height="210" viewBox="0 0 310 200">
                                    <ellipse cx={cx} cy={cy + depth + 6} rx={rx + 3} ry={ry + 2} fill="#cbd5e1" opacity="0.6" />
                                    <g>
                                      {slices.map((s) => (
                                        <path
                                          key={`side-${s.idx}`}
                                          d={`M ${s.x1} ${s.y1} A ${rx} ${ry} 0 ${s.largeArc} 1 ${s.x2} ${s.y2} L ${s.x2} ${s.y2 + depth} A ${rx} ${ry} 0 ${s.largeArc} 0 ${s.x1} ${s.y1 + depth} Z`}
                                          fill={s.darkColor}
                                          stroke={s.darkColor}
                                          strokeWidth="0.5"
                                        />
                                      ))}
                                    </g>
                                    <g>
                                      {slices.map((s) => (
                                        <path
                                          key={`top-${s.idx}`}
                                          d={`M ${cx} ${cy} L ${s.x1} ${s.y1} A ${rx} ${ry} 0 ${s.largeArc} 1 ${s.x2} ${s.y2} Z`}
                                          fill={s.color}
                                          stroke="#ffffff"
                                          strokeWidth="1.5"
                                          style={{ cursor: 'pointer' }}
                                        >
                                          <title>{`${s.label}: ${s.pctDisplay}%`}</title>
                                        </path>
                                      ))}
                                    </g>
                                    {/* VALORES VISIBLES EN CADA COLOR DE LA TORTA */}
                                    <g>
                                      {slices.map((s) => {
                                        const rFactor = slices.length > 8 ? 0.72 : 0.65;
                                        const tagX = cx + (rx * rFactor) * Math.cos(s.midAngle);
                                        const tagY = cy + (ry * rFactor) * Math.sin(s.midAngle);
                                        return (
                                          <g key={`tag-${s.idx}`} style={{ pointerEvents: 'none' }}>
                                            <rect
                                              x={tagX - 16}
                                              y={tagY - 9}
                                              width="32"
                                              height="18"
                                              rx="9"
                                              fill="#ffffff"
                                              stroke={s.color}
                                              strokeWidth="1.5"
                                              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.18))' }}
                                            />
                                            <text
                                              x={tagX}
                                              y={tagY + 4}
                                              textAnchor="middle"
                                              fill="#0f172a"
                                              fontSize="9"
                                              fontWeight="900"
                                            >
                                              {s.pctDisplay}%
                                            </text>
                                          </g>
                                        );
                                      })}
                                    </g>
                                  </svg>
                                </div>
                              </div>

                              {/* LEYENDA */}
                              <div className="col-lg-6">
                                <div className="d-flex flex-column gap-1.5" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                  {slices.map((s) => (
                                    <div key={s.idx} className="p-2 rounded-3 bg-light border d-flex align-items-center justify-content-between">
                                      <div className="d-flex align-items-center gap-2 overflow-hidden">
                                        <div className="rounded-circle flex-shrink-0" style={{ width: '12px', height: '12px', backgroundColor: s.color }}></div>
                                        <span className="fw-bold text-dark small text-truncate" title={s.label} style={{ fontSize: '0.78rem' }}>{s.label}</span>
                                      </div>
                                      <div className="d-flex align-items-center gap-2 flex-shrink-0">
                                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                          {s.it.completados !== undefined ? `${s.it.completados}/${s.it.total || stats.totalGeneral}` : ''}
                                        </small>
                                        <span className="badge fw-bold" style={{ backgroundColor: s.color, color: '#ffffff', fontSize: '0.72rem' }}>
                                          {s.pctDisplay}%
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* 3. ANILLOS DONUT */}
                      {tipoGrafico === 'anillos' && (() => {
                        const R = 38;
                        const C = 2 * Math.PI * R;
                        return (
                          <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white animate__animated animate__fadeIn">
                            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                              <h6 className="fw-bold text-dark mb-0"><i className="bi bi-record-circle text-primary me-2"></i>Gráfica en Anillos: {tituloVista}</h6>
                              <span className="badge bg-primary bg-opacity-10 text-primary border">{dataset.length} Categorías</span>
                            </div>
                            <div className="row g-2.5">
                              {dataset.map((it, idx) => {
                                const label = it.grado || it.etapa || it.nombre || '';
                                const itemPct = it.pctCompletado ?? it.pct ?? 0;
                                const itemColor = itemPct >= 75 ? '#10b981' : (itemPct >= 40 ? '#f59e0b' : '#ef4444');
                                const itTot = it.total || stats.totalGeneral || 0;
                                const itComp = it.completados || 0;
                                const itemLen = itTot > 0 ? (itComp / itTot) * C : 0;
                                return (
                                  <div key={idx} className="col-lg-3 col-md-4 col-sm-6">
                                    <div className="p-2.5 rounded-3 bg-light border text-center h-100">
                                      <div className="fw-bold text-dark small text-truncate mb-1" title={label} style={{ fontSize: '0.76rem' }}>{label}</div>
                                      <div className="position-relative d-flex justify-content-center align-items-center my-1">
                                        <svg width="85" height="85" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                                          <circle cx="50" cy="50" r={R} fill="none" stroke="#e2e8f0" strokeWidth="12" />
                                          <circle cx="50" cy="50" r={R} fill="none" stroke={itemColor} strokeWidth="12" strokeDasharray={`${itemLen} ${C - itemLen}`} strokeDashoffset={0} />
                                        </svg>
                                        <div className="position-absolute text-center">
                                          <span className="fw-bolder" style={{ color: itemColor, fontSize: '0.85rem' }}>{itemPct}%</span>
                                        </div>
                                      </div>
                                      <span className="badge bg-white text-muted border" style={{ fontSize: '0.68rem' }}>{itComp} / {itTot} listos</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* 4. PICOS DE RENDIMIENTO */}
                      {tipoGrafico === 'picos' && (
                        <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white animate__animated animate__fadeIn">
                          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <div>
                              <h6 className="fw-bold text-dark mb-0"><i className="bi bi-graph-up text-primary me-2"></i>Picos de Rendimiento: {tituloVista}</h6>
                              <small className="text-muted">Cimas porcentuales alcanzadas en la actualización de datos.</small>
                            </div>
                            <span className="badge bg-primary bg-opacity-10 text-primary border">0% - 100%</span>
                          </div>

                          <div style={{ height: '140px' }} className="d-flex align-items-flex-end gap-1.5 pt-4 px-2 border-bottom bg-light rounded-3 mb-3">
                            {dataset.map((it, idx) => {
                              const label = it.grado || it.etapa || it.nombre || '';
                              const itemPct = it.pctCompletado ?? it.pct ?? 0;
                              const h = Math.max(itemPct, 6);
                              const color = itemPct >= 75 ? '#10b981' : (itemPct >= 40 ? '#f59e0b' : '#ef4444');
                              return (
                                <div key={idx} className="flex-grow-1 d-flex flex-column align-items-center justify-content-end h-100 position-relative">
                                  <span className="fw-bold" style={{ fontSize: '0.65rem', color: color, marginBottom: '2px' }}>{itemPct}%</span>
                                  <div className="w-100 rounded-top shadow-sm" style={{ height: `${h}%`, backgroundColor: color, maxWidth: '28px' }}></div>
                                  <span className="text-muted text-truncate mt-1" style={{ fontSize: '0.6rem', maxWidth: '36px' }} title={label}>
                                    {label.replace('Educación ', '').replace('Grado', 'G').replace('Año', 'A')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 5. BARRAS COMPARATIVAS */}
                      {tipoGrafico === 'barras' && (
                        <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white animate__animated animate__fadeIn">
                          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <h6 className="fw-bold text-dark mb-0"><i className="bi bi-bar-chart-steps text-primary me-2"></i>Barras de Avance: {tituloVista}</h6>
                            <span className="badge bg-primary bg-opacity-10 text-primary border">{dataset.length} Registros</span>
                          </div>
                          <div className="row g-2.5">
                            {dataset.map((it, idx) => {
                              const label = it.grado || it.etapa || it.nombre || '';
                              const itemPct = it.pctCompletado ?? it.pct ?? 0;
                              const itTot = it.total || stats.totalGeneral || 0;
                              const itComp = it.completados || 0;
                              const itemColor = itemPct >= 75 ? 'bg-success' : (itemPct >= 40 ? 'bg-warning' : 'bg-danger');
                              return (
                                <div key={idx} className="col-md-6">
                                  <div className="p-2.5 rounded-3 bg-light border h-100">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                      <span className="fw-bold text-dark small text-truncate" title={label} style={{ fontSize: '0.78rem' }}>{label}</span>
                                      <span className="badge fw-bold" style={{ fontSize: '0.72rem', backgroundColor: itemPct >= 75 ? '#10b981' : (itemPct >= 40 ? '#f59e0b' : '#ef4444'), color: '#fff' }}>{itemPct}%</span>
                                    </div>
                                    <div className="progress rounded-pill shadow-inner mb-1" style={{ height: '8px' }}>
                                      <div className={`progress-bar ${itemColor}`} style={{ width: `${itemPct}%` }}></div>
                                    </div>
                                    <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.68rem' }}>
                                      <span>🟢 {itComp} listos</span>
                                      <span>Total: {itTot}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 6. RADAR */}
                      {tipoGrafico === 'radar' && (
                        <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white animate__animated animate__fadeIn">
                          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <div>
                              <h6 className="fw-bold text-dark mb-0"><i className="bi bi-bullseye text-primary me-2"></i>Radar Multidimensional: {tituloVista}</h6>
                              <small className="text-muted">Balance y polígono de cumplimiento en todas las áreas evaluadas.</small>
                            </div>
                            <span className="badge bg-primary bg-opacity-10 text-primary border">{stats.totalGeneral} Alumnos</span>
                          </div>

                          <div className="row g-2.5">
                            {dataset.map((it, idx) => {
                              const label = it.grado || it.etapa || it.nombre || '';
                              const itemPct = it.pctCompletado ?? it.pct ?? 0;
                              const itTot = it.total || stats.totalGeneral || 0;
                              const itComp = it.completados || 0;
                              return (
                                <div key={idx} className="col-md-6">
                                  <div className="p-2.5 rounded-3 bg-light border h-100">
                                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                                      <div className="d-flex align-items-center gap-2">
                                        <div className="p-1.5 rounded-circle bg-primary bg-opacity-10 text-primary">
                                          <i className="bi bi-compass-fill" style={{ fontSize: '0.85rem' }}></i>
                                        </div>
                                        <div>
                                          <span className="fw-bold text-dark d-block small" style={{ fontSize: '0.78rem' }}>{label}</span>
                                          <small className="text-muted" style={{ fontSize: '0.68rem' }}>{itComp} de {itTot} registros</small>
                                        </div>
                                      </div>
                                      <span className="fw-bolder text-primary" style={{ fontSize: '0.9rem' }}>{itemPct}%</span>
                                    </div>
                                    <div className="progress rounded-pill shadow-inner" style={{ height: '7px' }}>
                                      <div className={`progress-bar ${itemPct >= 75 ? 'bg-success' : (itemPct >= 40 ? 'bg-warning' : 'bg-danger')}`} style={{ width: `${itemPct}%` }}></div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 7. TACÓMETROS */}
                      {tipoGrafico === 'tacometro' && (
                        <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4 bg-white animate__animated animate__fadeIn">
                          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                            <h6 className="fw-bold text-dark mb-0"><i className="bi bi-speedometer2 text-primary me-2"></i>Tacómetros de Meta: {tituloVista}</h6>
                            <span className="badge bg-primary bg-opacity-10 text-primary border">180° Gauges</span>
                          </div>
                          <div className="row g-2.5">
                            {dataset.map((it, idx) => {
                              const label = it.grado || it.etapa || it.nombre || '';
                              const itemPct = it.pctCompletado ?? it.pct ?? 0;
                              const itemColor = itemPct >= 75 ? '#10b981' : (itemPct >= 40 ? '#f59e0b' : '#ef4444');
                              const needleAngle = -90 + (itemPct / 100) * 180;
                              const itTot = it.total || stats.totalGeneral || 0;
                              const itComp = it.completados || 0;
                              return (
                                <div key={idx} className="col-lg-3 col-md-4 col-sm-6">
                                  <div className="p-2.5 rounded-3 bg-light border text-center h-100">
                                    <div className="fw-bold text-dark small text-truncate mb-1" title={label} style={{ fontSize: '0.76rem' }}>{label}</div>
                                    <div className="position-relative d-flex justify-content-center align-items-center my-1" style={{ height: '70px' }}>
                                      <svg width="120" height="70" viewBox="0 0 140 85">
                                        <path d="M 15 75 A 55 55 0 0 1 125 75" fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round" />
                                        <path d="M 15 75 A 55 55 0 0 1 125 75" fill="none" stroke={itemColor} strokeWidth="12" strokeLinecap="round" strokeDasharray="172.78" strokeDashoffset={172.78 * (1 - itemPct / 100)} />
                                        <g transform={`translate(70, 75) rotate(${needleAngle})`}>
                                          <line x1="0" y1="0" x2="0" y2="-40" stroke="#1e40af" strokeWidth="3" strokeLinecap="round" />
                                          <circle cx="0" cy="0" r="4.5" fill="#1e40af" />
                                        </g>
                                      </svg>
                                    </div>
                                    <div className="fw-bolder" style={{ color: itemColor, fontSize: '0.9rem' }}>{itemPct}%</div>
                                    <span className="badge bg-white text-muted border" style={{ fontSize: '0.68rem' }}>{itComp}/{itTot}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 8. TABLA */}
                      {tipoGrafico === 'tabla' && (
                        <div className="bg-white rounded-4 shadow-sm border overflow-hidden animate__animated animate__fadeIn mb-2">
                          <div className="p-2.5 bg-light border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <span className="fw-bold text-dark small">
                              <i className="bi bi-table me-2 text-primary"></i>
                              Matriz Tabular Consolidada: {tituloVista}
                            </span>
                            <span className="badge bg-dark bg-opacity-10 text-dark border px-2.5 py-1 fw-bold" style={{ fontSize: '0.72rem' }}>{nombreInstitucion}</span>
                          </div>
                          <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                              <thead className="bg-light text-muted small">
                                <tr>
                                  <th className="ps-3">Categoría / Grado</th>
                                  <th className="text-center">Total</th>
                                  <th className="text-center">Actualizados (100%)</th>
                                  <th className="text-center">En Proceso</th>
                                  <th className="text-center">Sin Iniciar</th>
                                  <th style={{ width: '180px' }}>Progreso</th>
                                </tr>
                              </thead>
                              <tbody>
                                {stats.desglosePorGrado.map((g, idx) => (
                                  <tr key={idx}>
                                    <td className="ps-3 fw-bold text-dark">{g.grado}</td>
                                    <td className="text-center fw-bold">{g.total}</td>
                                    <td className="text-center"><span className="badge bg-success bg-opacity-10 text-success border border-success px-2 py-0.5 fw-bold">{g.completados}</span></td>
                                    <td className="text-center"><span className="badge bg-warning bg-opacity-10 text-warning border border-warning px-2 py-0.5 fw-bold" style={{ color: '#b45309 !important' }}>{g.enProceso}</span></td>
                                    <td className="text-center"><span className="badge bg-light text-secondary border px-2 py-0.5">{g.sinIniciar}</span></td>
                                    <td>
                                      <div className="d-flex align-items-center gap-1.5">
                                        <div className="progress flex-grow-1 rounded-pill" style={{ height: '7px' }}>
                                          <div className="progress-bar bg-success" role="progressbar" style={{ width: `${g.pctCompletado}%` }}></div>
                                        </div>
                                        <span className="small fw-bold text-success" style={{ minWidth: '35px', fontSize: '0.75rem' }}>{g.pctCompletado}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                                <tr className="table-light fw-bold border-top border-2" style={{ fontSize: '0.88rem' }}>
                                  <td className="ps-3 text-primary">TOTAL GENERAL CONSOLIDADO</td>
                                  <td className="text-center text-dark">{stats.totalGeneral}</td>
                                  <td className="text-center text-success">{stats.completadosGeneral}</td>
                                  <td className="text-center text-warning" style={{ color: '#b45309 !important' }}>{stats.enProcesoGeneral}</td>
                                  <td className="text-center text-secondary">{stats.sinIniciarGeneral}</td>
                                  <td>
                                    <div className="d-flex align-items-center gap-1.5">
                                      <div className="progress flex-grow-1 rounded-pill" style={{ height: '9px' }}>
                                        <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${stats.pctGeneral}%` }}></div>
                                      </div>
                                      <span className="small fw-bold text-primary" style={{ minWidth: '35px', fontSize: '0.78rem' }}>{stats.pctGeneral}%</span>
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* PIE DEL MODAL EJECUTIVO CON SOLO EL LOGO DEL MINISTERIO */}
                    <div className="modal-footer bg-white border-top px-4 py-2.5 d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div className="d-flex align-items-center">
                        <img 
                          src="/assets/img/logoMPPE.png" 
                          alt="Ministerio del Poder Popular para la Educación" 
                          style={{ height: '36px', width: 'auto' }} 
                          className="img-fluid" 
                        />
                      </div>

                      <div className="d-flex gap-2 flex-wrap align-items-center">
                        {/* Exportar */}
                        <div className="btn-group btn-group-sm shadow-sm" role="group">
                          <button 
                            type="button" 
                            className="btn btn-danger fw-bold px-3 d-flex align-items-center gap-1.5"
                            onClick={descargarReportePDF}
                            disabled={generandoPDF}
                            style={{ fontSize: '0.8rem' }}
                          >
                            {generandoPDF ? (
                              <>
                                <span className="spinner-border spinner-border-sm"></span>
                                <span>Generando PDF...</span>
                              </>
                            ) : (
                              <>
                                <i className="bi bi-file-earmark-pdf-fill"></i>
                                <span>PDF</span>
                              </>
                            )}
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-outline-success fw-bold px-2.5"
                            onClick={exportarEstadisticasExcel}
                            style={{ fontSize: '0.8rem' }}
                          >
                            <i className="bi bi-file-earmark-excel-fill me-1"></i> Excel
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-outline-primary fw-bold px-2.5"
                            onClick={imprimirReporteEstadistico}
                            style={{ fontSize: '0.8rem' }}
                          >
                            <i className="bi bi-printer-fill me-1"></i> Imprimir
                          </button>
                        </div>

                        {/* Enviar WhatsApp y Correo */}
                        <div className="btn-group btn-group-sm shadow-sm" role="group">
                          <button 
                            type="button" 
                            className="btn btn-success fw-bold px-3 d-flex align-items-center gap-1.5"
                            style={{ backgroundColor: '#25D366', borderColor: '#25D366', color: '#fff', fontSize: '0.8rem' }}
                            onClick={handleEnviarWhatsApp}
                          >
                            <i className="bi bi-whatsapp"></i>
                            <span>Enviar WhatsApp</span>
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-dark fw-bold px-2.5 d-flex align-items-center gap-1.5"
                            onClick={handleEnviarCorreo}
                            style={{ fontSize: '0.8rem' }}
                          >
                            <i className="bi bi-envelope-fill"></i>
                            <span>Correo</span>
                          </button>
                        </div>

                        <button 
                          type="button" 
                          className="btn btn-sm btn-secondary rounded-pill px-3 fw-bold"
                          onClick={() => setShowEstadisticasModal(false)}
                          style={{ fontSize: '0.8rem' }}
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Reasignar / Cambiar Representante Legal */}
      {showTransferModal && createPortal(
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1070 }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden animate__animated animate__zoomIn animate__faster">
              <div className="modal-header bg-gradient text-white p-4" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="p-3 bg-white bg-opacity-20 rounded-circle text-white d-flex align-items-center justify-content-center" style={{ width: '54px', height: '54px' }}>
                    <i className="bi bi-arrow-left-right fs-3"></i>
                  </div>
                  <div>
                    <span className="badge bg-white text-dark fw-bold px-2.5 py-1 rounded-pill mb-1" style={{ fontSize: '0.75rem' }}>
                      Gestión de Filiaciones
                    </span>
                    <h5 className="modal-title fw-bold mb-0 text-white">Reasignar / Cambiar Representante Legal</h5>
                    <small className="text-white-50">Transfiere la representación oficial de uno o varios estudiantes de forma segura.</small>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white shadow-sm" onClick={() => setShowTransferModal(false)}></button>
              </div>

              <div className="modal-body p-4 bg-light">
                {/* Estudiantes a transferir */}
                <div className="card border-0 shadow-sm rounded-4 p-3 mb-3 bg-white">
                  <h6 className="fw-bold text-dark mb-2 d-flex align-items-center">
                    <i className="bi bi-mortarboard-fill text-primary me-2"></i>
                    Estudiante(s) a Reasignar ({estudiantesATransferir.length})
                  </h6>
                  <div className="d-flex flex-wrap gap-2">
                    {estudiantesATransferir.map(e => (
                      <div key={e.id} className="badge bg-light text-dark border p-2 rounded-3 d-flex align-items-center gap-2">
                        <span className="fw-bold text-primary">{toTitulo(`${e.nombres_estudiante} ${e.apellidos_estudiante}`)}</span>
                        <span className="text-muted small">(C.I. {e.cedula_estudiante})</span>
                        <span className="badge bg-secondary rounded-pill">{e.grado_actual || 'Sin Grado'}</span>
                      </div>
                    ))}
                  </div>
                  {estudiantesATransferir.length > 0 && (
                    <div className="mt-2 text-muted small">
                      <i className="bi bi-person-fill text-secondary me-1"></i>
                      Representante actual: <strong>{toTitulo(`${estudiantesATransferir[0]?.nombres_representante || ''} ${estudiantesATransferir[0]?.apellidos_representante || ''}`)}</strong> (C.I. {estudiantesATransferir[0]?.cedula_representante})
                    </div>
                  )}
                </div>

                {/* Detección de Hermanos */}
                {hermanosDetectados.length > 0 && (
                  <div className="card border-0 shadow-sm rounded-4 p-3 mb-3 bg-warning bg-opacity-10 border-warning border-start border-4">
                    <div className="form-check form-switch m-0">
                      <input 
                        className="form-check-input fs-5 cursor-pointer" 
                        type="checkbox" 
                        id="switchHermanos"
                        checked={transferirHermanos}
                        onChange={(e) => setTransferirHermanos(e.target.checked)}
                      />
                      <label className="form-check-label fw-bold text-dark ms-2 cursor-pointer" htmlFor="switchHermanos">
                        ¿Transferir también a los demás representados de este mismo representante? ({hermanosDetectados.length} adicional{hermanosDetectados.length > 1 ? 'es' : ''})
                      </label>
                    </div>
                    <small className="text-muted d-block mt-1 ms-4 ps-2">
                      Se detectaron otros estudiantes vinculados al mismo representante anterior:
                    </small>
                    <div className="d-flex flex-wrap gap-2 mt-2 ms-4 ps-2">
                      {hermanosDetectados.map(h => (
                        <span key={h.id} className={`badge ${transferirHermanos ? 'bg-warning text-dark border border-warning' : 'bg-light text-muted border'} p-2 rounded-3`}>
                          <i className="bi bi-people-fill me-1"></i>
                          {toTitulo(`${h.nombres_estudiante} ${h.apellidos_estudiante}`)} (C.I. {h.cedula_estudiante})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Búsqueda del Nuevo Representante */}
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                  <h6 className="fw-bold text-dark mb-3 d-flex align-items-center">
                    <i className="bi bi-search text-success me-2"></i>
                    Buscar Nuevo Representante Legal (Usuario SIGAE)
                  </h6>

                  <div className="input-group mb-3">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-person-vcard text-muted"></i>
                    </span>
                    <input 
                      type="text" 
                      className="form-control border-start-0" 
                      placeholder="Ingrese la Cédula del nuevo representante (ej. 12345678)..."
                      value={cedulaNuevoRep}
                      onChange={(e) => setCedulaNuevoRep(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscarNuevoRepresentante(); } }}
                    />
                    <button 
                      className="btn btn-primary fw-bold px-4" 
                      type="button"
                      onClick={buscarNuevoRepresentante}
                      disabled={buscandoNuevoRep || !cedulaNuevoRep.trim()}
                    >
                      {buscandoNuevoRep ? <span className="spinner-border spinner-border-sm me-1"></span> : <i className="bi bi-search me-1"></i>}
                      Buscar
                    </button>
                  </div>

                  {nuevoRepEncontrado && (
                    <div className="alert alert-success border-0 rounded-4 p-3 mb-0 animate__animated animate__fadeIn">
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-3">
                          <div className="bg-success text-white rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: 44, height: 44 }}>
                            <i className="bi bi-check-lg fs-4"></i>
                          </div>
                          <div>
                            <small className="d-block fw-bold text-success text-uppercase">Representante Seleccionado</small>
                            <h6 className="fw-bold mb-0 text-dark">{toTitulo(nuevoRepEncontrado.nombre_completo || `${nuevoRepEncontrado.nombres || ''} ${nuevoRepEncontrado.apellidos || ''}`)}</h6>
                            <small className="text-muted">C.I. {nuevoRepEncontrado.cedula} | Rol: {nuevoRepEncontrado.rol || 'Representante'}</small>
                          </div>
                        </div>
                        <span className="badge bg-success px-3 py-2 rounded-pill fw-bold">
                          <i className="bi bi-patch-check-fill me-1"></i> Usuario Válido
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer bg-light border-top-0 rounded-bottom-4 p-3 d-flex justify-content-between">
                <button type="button" className="btn btn-light rounded-pill px-4 fw-bold" onClick={() => setShowTransferModal(false)}>
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary rounded-pill px-5 fw-bold shadow-sm"
                  onClick={handleEjecutarTransferencia}
                  disabled={loading || !nuevoRepEncontrado}
                >
                  {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-arrow-left-right me-2"></i>}
                  Confirmar Reasignación
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
