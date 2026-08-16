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
  const [tabReporte, setTabReporte] = useState<'ejecutivo' | 'barras' | 'secciones' | 'tabla'>('ejecutivo');
  const [generandoPDF, setGenerandoPDF] = useState<boolean>(false);

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

  const generarReporteHTML = (stats: any, nombreInstitucion: string) => {
    const R = 50;
    const C = 2 * Math.PI * R;
    const lenComp = stats.totalGeneral > 0 ? (stats.completadosGeneral / stats.totalGeneral) * C : 0;
    const lenProc = stats.totalGeneral > 0 ? (stats.enProcesoGeneral / stats.totalGeneral) * C : 0;
    const lenSin = stats.totalGeneral > 0 ? (stats.sinIniciarGeneral / stats.totalGeneral) * C : 0;
    const offComp = 0;
    const offProc = -lenComp;
    const offSin = -(lenComp + lenProc);

    // Tacómetro Radial (Gauge de Meta 180°)
    const pct = stats.pctGeneral;
    const needleAngle = -90 + (pct / 100) * 180; // de -90 a +90
    const gaugeColor = pct >= 75 ? '#10b981' : (pct >= 40 ? '#f59e0b' : '#ef4444');

    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0f172a; background: #ffffff; padding: 22px; width: 790px; box-sizing: border-box;">
        <!-- ENCABEZADO INSTITUCIONAL -->
        <div style="border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px; text-align: center;">
          <div style="letter-spacing: 1px; font-weight: bold; text-transform: uppercase; font-size: 10.5px; color: #64748b;">REPÚBLICA BOLIVARIANA DE VENEZUELA</div>
          <h4 style="font-weight: 800; text-transform: uppercase; margin: 2px 0; color: #0f172a; letter-spacing: 0.5px; font-size: 14.5px;">DIRECCIÓN EJECUTIVA DE PRODUCCIÓN ORIENTE</h4>
          <h5 style="font-weight: bold; color: #64748b; margin: 2px 0; font-size: 11.5px;">GERENCIA DE RECURSOS HUMANOS • GESTIÓN EDUCATIVA</h5>
          <h3 style="font-weight: 800; color: #1e40af; margin: 3px 0; font-size: 15.5px;">${nombreInstitucion}</h3>
          <p style="margin: 2px 0; font-weight: bold; font-size: 12.5px; color: #0f172a;">DOSSIER ESTADÍSTICO Y EJECUTIVO DE ACTUALIZACIÓN ESTUDIANTIL</p>
          <div style="display: flex; justify-content: space-between; color: #64748b; font-size: 10px; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 5px;">
            <span><strong>Fecha y Hora de Emisión:</strong> ${stats.fechaHoraReporte}</span>
            <span><strong>Generado por:</strong> ${user?.nombre_completo || user?.cedula || 'Administrador'}</span>
          </div>
        </div>

        <!-- FILA SUPERIOR: TACÓMETRO RADIAL + DONUT + KPIS -->
        <div style="display: flex; align-items: stretch; gap: 12px; margin-bottom: 14px;">
          <!-- TACÓMETRO DE META -->
          <div style="width: 175px; text-align: center; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px; background: #f8fafc; flex-shrink: 0;">
            <div style="font-size: 10px; font-weight: bold; color: #475569; margin-bottom: 2px;">TACÓMETRO DE META</div>
            <div style="position: relative; width: 140px; height: 85px; margin: 0 auto; overflow: hidden;">
              <svg width="140" height="140" viewBox="0 0 140 140">
                <!-- Arco fondo 180° -->
                <path d="M 15 80 A 55 55 0 0 1 125 80" fill="none" stroke="#e2e8f0" stroke-width="14" stroke-linecap="round" />
                <!-- Arco progreso coloreado -->
                <path d="M 15 80 A 55 55 0 0 1 125 80" fill="none" stroke="${gaugeColor}" stroke-width="14" stroke-linecap="round" stroke-dasharray="172.78" stroke-dashoffset="${172.78 * (1 - pct / 100)}" />
                <!-- Aguja indicadora -->
                <g transform="translate(70, 80) rotate(${needleAngle})">
                  <line x1="0" y1="0" x2="0" y2="-45" stroke="#0f172a" stroke-width="3" stroke-linecap="round" />
                  <circle cx="0" cy="0" r="5" fill="#0f172a" />
                </g>
              </svg>
            </div>
            <div style="font-size: 18px; font-weight: 900; color: ${gaugeColor}; margin-top: -6px;">${stats.pctGeneral}%</div>
            <div style="font-size: 9px; font-weight: bold; color: #64748b;">${pct >= 75 ? '🟢 Nivel Óptimo' : (pct >= 40 ? '🟡 En Progreso' : '🔴 Atención Prioritaria')}</div>
          </div>

          <!-- GRÁFICO DONUT 3D -->
          <div style="width: 165px; text-align: center; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px; background: #f8fafc; flex-shrink: 0;">
            <div style="font-size: 10px; font-weight: bold; color: #475569; margin-bottom: 2px;">DISTRIBUCIÓN GLOBAL</div>
            <div style="position: relative; width: 100px; height: 100px; margin: 0 auto;">
              <svg width="100" height="100" viewBox="0 0 140 140" style="transform: rotate(-90deg);">
                <circle cx="70" cy="70" r="${R}" fill="none" stroke="#f1f5f9" stroke-width="18" />
                ${lenComp > 0 ? `<circle cx="70" cy="70" r="${R}" fill="none" stroke="#10b981" stroke-width="18" stroke-dasharray="${lenComp} ${C - lenComp}" stroke-dashoffset="${offComp}" />` : ''}
                ${lenProc > 0 ? `<circle cx="70" cy="70" r="${R}" fill="none" stroke="#f59e0b" stroke-width="18" stroke-dasharray="${lenProc} ${C - lenProc}" stroke-dashoffset="${offProc}" />` : ''}
                ${lenSin > 0 ? `<circle cx="70" cy="70" r="${R}" fill="none" stroke="#94a3b8" stroke-width="18" stroke-dasharray="${lenSin} ${C - lenSin}" stroke-dashoffset="${offSin}" />` : ''}
              </svg>
              <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                <div style="font-size: 14px; font-weight: 900; color: #0f172a;">${stats.totalGeneral}</div>
                <div style="font-size: 7px; font-weight: bold; color: #64748b;">ALUMNOS</div>
              </div>
            </div>
            <div style="font-size: 9px; font-weight: bold; color: #166534;">${stats.completadosGeneral} completados</div>
          </div>

          <!-- TARJETAS KPIS -->
          <div style="flex-grow: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 7px 10px; background: #f8fafc; text-align: center;">
              <div style="color: #64748b; font-size: 9px; font-weight: bold;">MATRÍCULA TOTAL</div>
              <div style="font-size: 16px; font-weight: bold; color: #0f172a;">${stats.totalGeneral}</div>
              <div style="font-size: 8.5px; color: #64748b;">100% de estudiantes</div>
            </div>
            <div style="border: 1px solid #86efac; border-radius: 8px; padding: 7px 10px; background: #f0fdf4; text-align: center;">
              <div style="color: #166534; font-size: 9px; font-weight: bold;">ACTUALIZADOS (100%)</div>
              <div style="font-size: 16px; font-weight: bold; color: #16a34a;">${stats.completadosGeneral}</div>
              <div style="font-size: 8.5px; font-weight: bold; color: #166534;">${stats.pctGeneral}% del plantel</div>
            </div>
            <div style="border: 1px solid #fde047; border-radius: 8px; padding: 7px 10px; background: #fefce8; text-align: center;">
              <div style="color: #854d0e; font-size: 9px; font-weight: bold;">EN PROCESO</div>
              <div style="font-size: 16px; font-weight: bold; color: #d97706;">${stats.enProcesoGeneral}</div>
              <div style="font-size: 8.5px; font-weight: bold; color: #854d0e;">${stats.totalGeneral > 0 ? Math.round((stats.enProcesoGeneral / stats.totalGeneral) * 100) : 0}% en llenado</div>
            </div>
            <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 7px 10px; background: #f8fafc; text-align: center;">
              <div style="color: #475569; font-size: 9px; font-weight: bold;">SIN INICIAR (0%)</div>
              <div style="font-size: 16px; font-weight: bold; color: #475569;">${stats.sinIniciarGeneral}</div>
              <div style="font-size: 8.5px; font-weight: bold; color: #475569;">${stats.totalGeneral > 0 ? Math.round((stats.sinIniciarGeneral / stats.totalGeneral) * 100) : 0}% pendientes</div>
            </div>
          </div>
        </div>

        <!-- FILA INTERMEDIA: COMPARATIVA POR ETAPAS EDUCATIVAS + SEMÁFORO -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
          <!-- COMPARATIVA ETAPAS -->
          <div style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px; background: #ffffff;">
            <div style="font-size: 10.5px; font-weight: bold; color: #0f172a; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              📊 Avance por Etapa Educativa
            </div>
            ${stats.desgloseEtapas?.map((et: any) => `
              <div style="margin-bottom: 6px;">
                <div style="display: flex; justify-content: space-between; font-size: 9.5px; margin-bottom: 2px;">
                  <span style="font-weight: bold; color: #1e293b;">${et.etapa}</span>
                  <span style="color: #166534; font-weight: bold;">${et.completados}/${et.total} (${et.pct}%)</span>
                </div>
                <div style="background-color: #f1f5f9; border-radius: 4px; height: 8px; overflow: hidden; display: flex;">
                  <div style="background-color: #10b981; height: 100%; width: ${et.pct}%;"></div>
                  <div style="background-color: #f59e0b; height: 100%; width: ${et.total > 0 ? (et.enProceso / et.total) * 100 : 0}%;"></div>
                  <div style="background-color: #cbd5e1; height: 100%; width: ${et.total > 0 ? (et.sinIniciar / et.total) * 100 : 0}%;"></div>
                </div>
              </div>
            `).join('') || ''}
          </div>

          <!-- SEMÁFORO DE GESTIÓN -->
          <div style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px; background: #ffffff;">
            <div style="font-size: 10.5px; font-weight: bold; color: #0f172a; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              🚦 Semáforo de Cumplimiento
            </div>
            <div style="display: flex; gap: 6px; font-size: 9.5px; text-align: center;">
              <div style="flex: 1; border: 1px solid #86efac; border-radius: 6px; padding: 6px; background: #f0fdf4;">
                <div style="color: #166534; font-weight: bold;">🟢 Óptimo (≥75%)</div>
                <div style="font-size: 14px; font-weight: bold; color: #166534; margin: 2px 0;">${stats.semaforoOptimo?.length || 0}</div>
                <div style="font-size: 8px; color: #166534;">grados listos</div>
              </div>
              <div style="flex: 1; border: 1px solid #fde047; border-radius: 6px; padding: 6px; background: #fefce8;">
                <div style="color: #854d0e; font-weight: bold;">🟡 En Progreso</div>
                <div style="font-size: 14px; font-weight: bold; color: #d97706; margin: 2px 0;">${stats.semaforoEnProgreso?.length || 0}</div>
                <div style="font-size: 8px; color: #854d0e;">en llenado</div>
              </div>
              <div style="flex: 1; border: 1px solid #fca5a5; border-radius: 6px; padding: 6px; background: #fef2f2;">
                <div style="color: #991b1b; font-weight: bold;">🔴 Atención (&lt;40%)</div>
                <div style="font-size: 14px; font-weight: bold; color: #dc2626; margin: 2px 0;">${stats.semaforoAtencion?.length || 0}</div>
                <div style="font-size: 8px; color: #991b1b;">convocatoria</div>
              </div>
            </div>
          </div>
        </div>

        <!-- TABLA DESGLOSADA POR GRADO / NIVEL -->
        <div style="font-weight: bold; margin-bottom: 6px; color: #0f172a; font-size: 11px;">📋 Desglose y Distribución por Grupo, Grado o Año Escolar</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 14px;">
          <thead>
            <tr style="background-color: #f1f5f9; text-align: center; border: 1px solid #cbd5e1;">
              <th style="padding: 5px; text-align: left; width: 28%; border: 1px solid #cbd5e1;">Grupo / Grado / Año Escolar</th>
              <th style="padding: 5px; width: 10%; border: 1px solid #cbd5e1;">Total</th>
              <th style="padding: 5px; width: 12%; border: 1px solid #cbd5e1;">Completados</th>
              <th style="padding: 5px; width: 12%; border: 1px solid #cbd5e1;">En Proceso</th>
              <th style="padding: 5px; width: 12%; border: 1px solid #cbd5e1;">Sin Iniciar</th>
              <th style="padding: 5px; width: 26%; border: 1px solid #cbd5e1;">Gráfico de Avance</th>
            </tr>
          </thead>
          <tbody>
            ${stats.desglosePorGrado.map((g: any) => {
              const pComp = g.total > 0 ? (g.completados / g.total) * 100 : 0;
              const pProc = g.total > 0 ? (g.enProceso / g.total) * 100 : 0;
              const pSin = g.total > 0 ? (g.sinIniciar / g.total) * 100 : 0;
              return `
              <tr style="text-align: center; border: 1px solid #cbd5e1;">
                <td style="padding: 4px; text-align: left; font-weight: bold; border: 1px solid #cbd5e1;">${g.grado}</td>
                <td style="padding: 4px; font-weight: bold; border: 1px solid #cbd5e1;">${g.total}</td>
                <td style="padding: 4px; border: 1px solid #cbd5e1;"><span style="background: #dcfce7; color: #166534; font-weight: bold; padding: 2px 5px; border-radius: 4px; font-size: 9.5px;">${g.completados}</span></td>
                <td style="padding: 4px; border: 1px solid #cbd5e1;"><span style="background: #fef9c3; color: #854d0e; font-weight: bold; padding: 2px 5px; border-radius: 4px; font-size: 9.5px;">${g.enProceso}</span></td>
                <td style="padding: 4px; border: 1px solid #cbd5e1;"><span style="background: #f1f5f9; color: #475569; font-weight: bold; padding: 2px 5px; border-radius: 4px; font-size: 9.5px;">${g.sinIniciar}</span></td>
                <td style="padding: 4px; border: 1px solid #cbd5e1;">
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <div style="background-color: #f1f5f9; border-radius: 4px; height: 8px; overflow: hidden; display: flex; width: 100%;">
                      <div style="background-color: #10b981; height: 100%; width: ${pComp}%;"></div>
                      <div style="background-color: #f59e0b; height: 100%; width: ${pProc}%;"></div>
                      <div style="background-color: #cbd5e1; height: 100%; width: ${pSin}%;"></div>
                    </div>
                    <span style="min-width: 28px; font-weight: bold; color: #166534; font-size: 9.5px;">${g.pctCompletado}%</span>
                  </div>
                </td>
              </tr>
            `;
            }).join('')}
            <tr style="background-color: #e2e8f0; text-align: center; font-weight: bold; border: 1px solid #cbd5e1;">
              <td style="padding: 5px; text-align: left; border: 1px solid #cbd5e1;">TOTAL CONSOLIDADO</td>
              <td style="padding: 5px; border: 1px solid #cbd5e1;">${stats.totalGeneral}</td>
              <td style="padding: 5px; color: #16a34a; border: 1px solid #cbd5e1;">${stats.completadosGeneral}</td>
              <td style="padding: 5px; color: #d97706; border: 1px solid #cbd5e1;">${stats.enProcesoGeneral}</td>
              <td style="padding: 5px; color: #475569; border: 1px solid #cbd5e1;">${stats.sinIniciarGeneral}</td>
              <td style="padding: 5px; border: 1px solid #cbd5e1;">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <div style="background-color: #f1f5f9; border-radius: 4px; height: 10px; overflow: hidden; display: flex; width: 100%;">
                    <div style="background-color: #10b981; height: 100%; width: ${stats.pctGeneral}%;"></div>
                    <div style="background-color: #f59e0b; height: 100%; width: ${stats.totalGeneral > 0 ? (stats.enProcesoGeneral / stats.totalGeneral) * 100 : 0}%;"></div>
                    <div style="background-color: #cbd5e1; height: 100%; width: ${stats.totalGeneral > 0 ? (stats.sinIniciarGeneral / stats.totalGeneral) * 100 : 0}%;"></div>
                  </div>
                  <span style="min-width: 28px; font-weight: bold; color: #1e40af; font-size: 10px;">${stats.pctGeneral}%</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- FIRMAS Y SELLOS -->
        <div style="display: flex; justify-content: space-around; margin-top: 20px; text-align: center;">
          <div style="width: 40%;">
            <div style="border-top: 1px solid #94a3b8; padding-top: 3px;">
              <strong style="font-size: 10px;">Control de Estudios</strong><br>
              <span style="color: #64748b; font-size: 8.5px;">Firma y Sello</span>
            </div>
          </div>
          <div style="width: 40%;">
            <div style="border-top: 1px solid #94a3b8; padding-top: 3px;">
              <strong style="font-size: 10px;">Dirección del Plantel / DEP Oriente</strong><br>
              <span style="color: #64748b; font-size: 8.5px;">Firma y Sello</span>
            </div>
          </div>
        </div>

        <div style="text-align: center; color: #94a3b8; font-size: 7.5px; margin-top: 14px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
          Dossier oficial de auditoría y avance de matrícula generado por el Sistema Integral de Gestión y Administración Escolar (SIGAE) - DEP Oriente.
        </div>
      </div>
    `;
  };

  const descargarReportePDF = async () => {
    try {
      setGenerandoPDF(true);
      const stats = calcularEstadisticasReporte(escuelaReporte);
      const nombreInstitucion = escuelaReporte === 'ambas' 
        ? 'GENERAL ESCUELAS DEP ORIENTE' 
        : (escuelaReporte === 'sb' ? 'U.E. SANTA BÁRBARA' : 'U.E. LIBERTADOR BOLÍVAR');

      const contenedor = document.createElement('div');
      contenedor.style.position = 'fixed';
      contenedor.style.left = '-9999px';
      contenedor.style.top = '0';
      contenedor.style.width = '790px';
      contenedor.style.backgroundColor = '#ffffff';
      contenedor.innerHTML = generarReporteHTML(stats, nombreInstitucion);

      document.body.appendChild(contenedor);
      await new Promise(r => setTimeout(r, 300));

      const canvas = await html2canvas(contenedor, {
        scale: 2.0,
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

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(imgHeight, pdfHeight), undefined, 'FAST');

      const nombreArchivo = `Reporte_Estadistico_Avance_${escuelaReporte.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(nombreArchivo);
    } catch (err: any) {
      console.error('Error al generar PDF:', err);
      alert('Ocurrió un error al generar el archivo PDF. Intente con la opción de Imprimir.');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const generarTextoResumen = (stats: any, nombreInstitucion: string) => {
    let msg = `📊 *SIGAE - REPORTE DE ACTUALIZACIÓN ESTUDIANTIL*\n`;
    msg += `🏛️ *Ámbito:* ${nombreInstitucion}\n`;
    msg += `📅 *Fecha de Emisión:* ${stats.fechaHoraReporte}\n`;
    msg += `👤 *Emitido por:* ${user?.nombre_completo || user?.cedula || 'Administrador'}\n\n`;
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

  const enviarWhatsAppImagen = async (stats: any, nombreInstitucion: string, formato: 'png' | 'jpeg', incluirTexto: boolean = true) => {
    const Swal = (window as any).Swal;
    try {
      if (Swal) {
        Swal.fire({
          title: 'Generando Imagen Oficial...',
          text: 'Preparando el informe gráfico.',
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
      contenedor.style.width = '790px';
      contenedor.style.backgroundColor = '#ffffff';
      contenedor.innerHTML = generarReporteHTML(stats, nombreInstitucion);

      document.body.appendChild(contenedor);
      await new Promise(r => setTimeout(r, 100));

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
      const nombreArchivo = `Reporte_${escuelaReporte.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.${extension}`;
      const textoMensaje = incluirTexto ? generarTextoResumen(stats, nombreInstitucion) : '';

      canvas.toBlob(async (blob) => {
        if (!blob) {
          if (Swal) Swal.fire('Error', 'No se pudo generar la imagen del reporte.', 'error');
          return;
        }

        const file = new File([blob], nombreArchivo, { type: mimeType });

        // Si el navegador soporta compartir archivos directamente (Móviles / Tablets)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Reporte Estadístico - ${nombreInstitucion}`,
              text: textoMensaje
            });
            if (Swal) Swal.close();
            return;
          } catch (e) {
            console.log('Share nativo no completado, usando fallback');
          }
        }

        // Descarga de archivo en dispositivo
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        a.click();
        URL.revokeObjectURL(url);

        // Copiar al portapapeles si está disponible
        let copiadoPortapapeles = false;
        if (navigator.clipboard && navigator.clipboard.write && formato === 'png') {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            copiadoPortapapeles = true;
          } catch (e) {
            console.log('Portapapeles no soportado para imágenes', e);
          }
        }

        if (Swal) {
          const result = await Swal.fire({
            icon: 'success',
            title: '¡Imagen Lista!',
            html: `
              <p class="mb-2">El archivo <b>${nombreArchivo}</b> ha sido descargado.</p>
              ${copiadoPortapapeles ? '<div class="alert alert-success p-2 small mb-2"><i class="bi bi-clipboard-check me-1"></i> ¡Imagen copiada a tu portapapeles!</div>' : ''}
              <p class="small text-muted mb-0">Al abrir WhatsApp, selecciona tu chat y presiona <b>Ctrl + V</b> (o adjunta la imagen descargada).</p>
            `,
            showCancelButton: true,
            confirmButtonText: '<i class="bi bi-whatsapp me-1"></i> Abrir WhatsApp',
            cancelButtonText: 'Listo',
            confirmButtonColor: '#25D366'
          });

          if (result.isConfirmed) {
            window.open('https://web.whatsapp.com', '_blank');
          }
        } else {
          window.open('https://web.whatsapp.com', '_blank');
        }
      }, mimeType, 0.95);

    } catch (err: any) {
      console.error('Error al generar imagen para WhatsApp:', err);
      if (Swal) Swal.fire('Error', 'No se pudo generar la imagen para compartir.', 'error');
    }
  };

  const handleEnviarWhatsApp = () => {
    const stats = calcularEstadisticasReporte(escuelaReporte);
    const nombreInstitucion = escuelaReporte === 'ambas' 
      ? 'GENERAL ESCUELAS DEP ORIENTE' 
      : (escuelaReporte === 'sb' ? 'U.E. SANTA BÁRBARA' : 'U.E. LIBERTADOR BOLÍVAR');
    
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
            ${generarReporteHTML(stats, nombreInstitucion)}
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
                <button className="btn btn-danger fw-bold shadow-sm fade-in" onClick={handleEliminarMasivo} disabled={loading} title="Eliminar seleccionados">
                  <i className="bi bi-trash-fill"></i> ({seleccionados.length})
                </button>
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
                            className="btn btn-sm btn-outline-primary" 
                            onClick={() => handleAbrirEdicion(item)}
                            title="Editar Estudiante"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-warning" 
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
                  
                  <div className="alert alert-info border-0 bg-info bg-opacity-10 d-flex align-items-center rounded-3 p-3 mb-4">
                    <i className="bi bi-info-circle-fill fs-4 text-info me-3"></i>
                    <div>
                      <small className="d-block fw-bold text-dark">Representante Actual:</small>
                      <span className="text-secondary">{estudianteEditando.nombres_representante} {estudianteEditando.apellidos_representante} (C.I. {estudianteEditando.cedula_representante})</span>
                    </div>
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

      {/* ─── MODAL ESTADÍSTICAS Y REPORTE OFICIAL ─── */}
      {showEstadisticasModal && createPortal(
        <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              {(() => {
                const stats = calcularEstadisticasReporte(escuelaReporte);
                const nombreInstitucion = escuelaReporte === 'ambas' 
                  ? 'General Escuelas DEP Oriente' 
                  : (escuelaReporte === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar');

                return (
                  <>
                    <div className="modal-header text-white p-4" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}>
                      <div className="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2">
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                            <span className="badge bg-white text-primary fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>
                              <i className="bi bi-shield-check me-1"></i> SIGAE • Control de Avance
                            </span>
                            <span className="badge bg-white bg-opacity-25 text-white">
                              <i className="bi bi-clock-history me-1"></i> {stats.fechaHoraReporte}
                            </span>
                          </div>
                          <h4 className="modal-title fw-bolder text-white mb-0">
                            <i className="bi bi-bar-chart-line-fill me-2"></i> Estadísticas y Reporte de Actualización Estudiantil
                          </h4>
                        </div>
                        <button 
                          type="button" 
                          className="btn-close btn-close-white" 
                          onClick={() => setShowEstadisticasModal(false)}
                        ></button>
                      </div>
                    </div>

                    <div className="modal-body p-4 bg-light">
                      {/* Selector de Ámbito / Escuela y Selector de Vista */}
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 bg-white p-3 rounded-4 shadow-sm border">
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-primary bg-opacity-10 text-primary p-2.5 rounded-circle">
                            <i className="bi bi-buildings-fill fs-4"></i>
                          </div>
                          <div>
                            <span className="small text-muted fw-bold d-block">Ámbito Institucional Seleccionado:</span>
                            <span className="fw-bolder text-dark fs-5">{nombreInstitucion}</span>
                          </div>
                        </div>
                        
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <div className="btn-group shadow-sm" role="group">
                            <button 
                              type="button" 
                              className={`btn btn-sm px-3 fw-bold ${escuelaReporte === 'ambas' ? 'btn-primary shadow-sm' : 'btn-outline-primary'}`}
                              onClick={() => setEscuelaReporte('ambas')}
                            >
                              <i className="bi bi-globe me-1"></i> General Escuelas DEP Oriente
                            </button>
                            <button 
                              type="button" 
                              className={`btn btn-sm px-3 fw-bold ${escuelaReporte === 'sb' ? 'btn-primary shadow-sm' : 'btn-outline-primary'}`}
                              onClick={() => setEscuelaReporte('sb')}
                            >
                              <i className="bi bi-building me-1"></i> UE Santa Bárbara
                            </button>
                            <button 
                              type="button" 
                              className={`btn btn-sm px-3 fw-bold ${escuelaReporte === 'lb' ? 'btn-primary shadow-sm' : 'btn-outline-primary'}`}
                              onClick={() => setEscuelaReporte('lb')}
                            >
                              <i className="bi bi-building me-1"></i> UE Libertador Bolívar
                            </button>
                          </div>

                          <div className="btn-group shadow-sm" role="group">
                            <button 
                              type="button" 
                              className={`btn btn-sm px-3 fw-bold ${tabReporte === 'ejecutivo' ? 'btn-dark' : 'btn-outline-dark'}`}
                              onClick={() => setTabReporte('ejecutivo')}
                            >
                              <i className="bi bi-speedometer2 me-1"></i> Tablero 360°
                            </button>
                            <button 
                              type="button" 
                              className={`btn btn-sm px-3 fw-bold ${tabReporte === 'barras' ? 'btn-dark' : 'btn-outline-dark'}`}
                              onClick={() => setTabReporte('barras')}
                            >
                              <i className="bi bi-bar-chart-steps me-1"></i> Por Grados
                            </button>
                            <button 
                              type="button" 
                              className={`btn btn-sm px-3 fw-bold ${tabReporte === 'secciones' ? 'btn-dark' : 'btn-outline-dark'}`}
                              onClick={() => setTabReporte('secciones')}
                            >
                              <i className="bi bi-ui-checks me-1"></i> Por Secciones
                            </button>
                            <button 
                              type="button" 
                              className={`btn btn-sm px-3 fw-bold ${tabReporte === 'tabla' ? 'btn-dark' : 'btn-outline-dark'}`}
                              onClick={() => setTabReporte('tabla')}
                            >
                              <i className="bi bi-table me-1"></i> Tabla
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Tarjetas de Resumen KPI */}
                      <div className="row g-3 mb-4">
                        <div className="col-md-3 col-6">
                          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-primary border-4 hover-efecto">
                            <span className="small fw-bold text-muted text-uppercase">Total Matrícula</span>
                            <div className="d-flex align-items-center justify-content-between mt-2">
                              <span className="fs-2 fw-bolder text-dark">{stats.totalGeneral}</span>
                              <div className="bg-primary bg-opacity-10 text-primary p-2.5 rounded-circle">
                                <i className="bi bi-people-fill fs-4"></i>
                              </div>
                            </div>
                            <span className="small text-muted mt-1">Estudiantes vinculados</span>
                          </div>
                        </div>

                        <div className="col-md-3 col-6">
                          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-success border-4 hover-efecto">
                            <span className="small fw-bold text-success text-uppercase">Actualizados (100%)</span>
                            <div className="d-flex align-items-center justify-content-between mt-2">
                              <span className="fs-2 fw-bolder text-success">{stats.completadosGeneral}</span>
                              <div className="bg-success bg-opacity-10 text-success p-2.5 rounded-circle">
                                <i className="bi bi-check-circle-fill fs-4"></i>
                              </div>
                            </div>
                            <span className="small fw-bold text-success mt-1">{stats.pctGeneral}% de la matrícula</span>
                          </div>
                        </div>

                        <div className="col-md-3 col-6">
                          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-warning border-4 hover-efecto">
                            <span className="small fw-bold text-warning text-uppercase" style={{ color: '#ca8a04 !important' }}>En Proceso</span>
                            <div className="d-flex align-items-center justify-content-between mt-2">
                              <span className="fs-2 fw-bolder text-warning" style={{ color: '#ca8a04 !important' }}>{stats.enProcesoGeneral}</span>
                              <div className="bg-warning bg-opacity-10 text-warning p-2.5 rounded-circle">
                                <i className="bi bi-hourglass-split fs-4"></i>
                              </div>
                            </div>
                            <span className="small fw-bold text-warning mt-1" style={{ color: '#ca8a04 !important' }}>
                              {stats.totalGeneral > 0 ? Math.round((stats.enProcesoGeneral / stats.totalGeneral) * 100) : 0}% en llenado
                            </span>
                          </div>
                        </div>

                        <div className="col-md-3 col-6">
                          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 border-start border-secondary border-4 hover-efecto">
                            <span className="small fw-bold text-secondary text-uppercase">Sin Iniciar (0%)</span>
                            <div className="d-flex align-items-center justify-content-between mt-2">
                              <span className="fs-2 fw-bolder text-secondary">{stats.sinIniciarGeneral}</span>
                              <div className="bg-secondary bg-opacity-10 text-secondary p-2.5 rounded-circle">
                                <i className="bi bi-dash-circle-fill fs-4"></i>
                              </div>
                            </div>
                            <span className="small text-muted mt-1">
                              {stats.totalGeneral > 0 ? Math.round((stats.sinIniciarGeneral / stats.totalGeneral) * 100) : 0}% pendientes
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* VISTA 1: TABLERO EJECUTIVO 360° */}
                      {tabReporte === 'ejecutivo' && (
                        <div className="animate__animated animate__fadeIn">
                          <div className="row g-4 mb-4">
                            {/* Gráfico 1: Tacómetro Radial de Meta */}
                            <div className="col-lg-4 col-md-6">
                              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 text-center d-flex flex-column justify-content-between">
                                <div>
                                  <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                                    <h6 className="fw-bold text-dark mb-0">
                                      <i className="bi bi-speedometer2 text-primary me-2"></i>
                                      Tacómetro de Meta
                                    </h6>
                                    <span className="badge bg-light text-muted border">Meta: 100%</span>
                                  </div>

                                  {(() => {
                                    const pct = stats.pctGeneral;
                                    const needleAngle = -90 + (pct / 100) * 180;
                                    const gaugeColor = pct >= 75 ? '#10b981' : (pct >= 40 ? '#f59e0b' : '#ef4444');
                                    return (
                                      <div className="py-2">
                                        <div className="position-relative d-flex justify-content-center align-items-center" style={{ height: '120px' }}>
                                          <svg width="200" height="120" viewBox="0 0 140 90">
                                            <path d="M 15 80 A 55 55 0 0 1 125 80" fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round" />
                                            <path 
                                              d="M 15 80 A 55 55 0 0 1 125 80" 
                                              fill="none" 
                                              stroke={gaugeColor} 
                                              strokeWidth="14" 
                                              strokeLinecap="round" 
                                              strokeDasharray="172.78" 
                                              strokeDashoffset={172.78 * (1 - pct / 100)}
                                              style={{ transition: 'all 0.6s ease' }}
                                            />
                                            <g transform={`translate(70, 80) rotate(${needleAngle})`} style={{ transition: 'transform 0.6s ease' }}>
                                              <line x1="0" y1="0" x2="0" y2="-45" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
                                              <circle cx="0" cy="0" r="5.5" fill="#0f172a" />
                                            </g>
                                          </svg>
                                        </div>
                                        <div className="fs-2 fw-bolder lh-1 mb-1" style={{ color: gaugeColor }}>
                                          {stats.pctGeneral}%
                                        </div>
                                        <span className={`badge px-3 py-1 rounded-pill fw-bold ${pct >= 75 ? 'bg-success bg-opacity-10 text-success' : (pct >= 40 ? 'bg-warning bg-opacity-10 text-warning' : 'bg-danger bg-opacity-10 text-danger')}`}>
                                          {pct >= 75 ? '🟢 Nivel Óptimo' : (pct >= 40 ? '🟡 En Progreso' : '🔴 Atención Prioritaria')}
                                        </span>
                                      </div>
                                    );
                                  })()}
                                </div>
                                <div className="p-2.5 rounded-3 bg-light border small text-muted">
                                  {stats.completadosGeneral} de {stats.totalGeneral} estudiantes con ficha integral completada.
                                </div>
                              </div>
                            </div>

                            {/* Gráfico 2: Torta / Donut 3D */}
                            <div className="col-lg-4 col-md-6">
                              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 text-center d-flex flex-column justify-content-between">
                                <div>
                                  <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                                    <h6 className="fw-bold text-dark mb-0">
                                      <i className="bi bi-pie-chart-fill text-primary me-2"></i>
                                      Distribución Global
                                    </h6>
                                    <span className="badge bg-light text-muted border">Torta Vectorial</span>
                                  </div>

                                  {(() => {
                                    const R = 55;
                                    const C = 2 * Math.PI * R;
                                    const lenComp = stats.totalGeneral > 0 ? (stats.completadosGeneral / stats.totalGeneral) * C : 0;
                                    const lenProc = stats.totalGeneral > 0 ? (stats.enProcesoGeneral / stats.totalGeneral) * C : 0;
                                    const lenSin = stats.totalGeneral > 0 ? (stats.sinIniciarGeneral / stats.totalGeneral) * C : 0;
                                    const offComp = 0;
                                    const offProc = -lenComp;
                                    const offSin = -(lenComp + lenProc);

                                    return (
                                      <div className="py-2 position-relative d-flex justify-content-center align-items-center">
                                        <svg width="150" height="150" viewBox="0 0 150 150" style={{ transform: 'rotate(-90deg)' }}>
                                          <circle cx="75" cy="75" r={R} fill="none" stroke="#f1f5f9" strokeWidth="20" />
                                          {lenComp > 0 && <circle cx="75" cy="75" r={R} fill="none" stroke="#10b981" strokeWidth="20" strokeDasharray={`${lenComp} ${C - lenComp}`} strokeDashoffset={offComp} style={{ transition: 'all 0.5s ease' }} />}
                                          {lenProc > 0 && <circle cx="75" cy="75" r={R} fill="none" stroke="#f59e0b" strokeWidth="20" strokeDasharray={`${lenProc} ${C - lenProc}`} strokeDashoffset={offProc} style={{ transition: 'all 0.5s ease' }} />}
                                          {lenSin > 0 && <circle cx="75" cy="75" r={R} fill="none" stroke="#94a3b8" strokeWidth="20" strokeDasharray={`${lenSin} ${C - lenSin}`} strokeDashoffset={offSin} style={{ transition: 'all 0.5s ease' }} />}
                                        </svg>
                                        <div className="position-absolute text-center" style={{ pointerEvents: 'none' }}>
                                          <span className="fs-4 fw-bolder text-dark d-block lh-1">{stats.totalGeneral}</span>
                                          <span className="small text-muted fw-bold" style={{ fontSize: '0.65rem' }}>MATRÍCULA</span>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>

                                <div className="d-flex justify-content-around text-center border-top pt-2">
                                  <div><span className="d-block fw-bold text-success small">{stats.completadosGeneral}</span><span className="text-muted" style={{ fontSize: '0.7rem' }}>Listos</span></div>
                                  <div><span className="d-block fw-bold text-warning small">{stats.enProcesoGeneral}</span><span className="text-muted" style={{ fontSize: '0.7rem' }}>En Proceso</span></div>
                                  <div><span className="d-block fw-bold text-secondary small">{stats.sinIniciarGeneral}</span><span className="text-muted" style={{ fontSize: '0.7rem' }}>Sin Iniciar</span></div>
                                </div>
                              </div>
                            </div>

                            {/* Gráfico 3: Comparativa por Etapas Educativas */}
                            <div className="col-lg-4 col-md-12">
                              <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 d-flex flex-column justify-content-between">
                                <div>
                                  <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                                    <h6 className="fw-bold text-dark mb-0">
                                      <i className="bi bi-diagram-3-fill text-primary me-2"></i>
                                      Avance por Etapa Educativa
                                    </h6>
                                    <span className="badge bg-primary bg-opacity-10 text-primary border">Nivel</span>
                                  </div>

                                  <div className="d-flex flex-column gap-3">
                                    {stats.desgloseEtapas?.map((et, idx) => (
                                      <div key={idx} className="p-2.5 rounded-3 bg-light border">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                          <span className="fw-bold text-dark small">{et.etapa}</span>
                                          <span className="badge bg-success bg-opacity-10 text-success fw-bold">
                                            {et.completados} de {et.total} ({et.pct}%)
                                          </span>
                                        </div>
                                        <div className="progress rounded-pill shadow-inner" style={{ height: '9px' }}>
                                          <div className="progress-bar bg-success" style={{ width: `${et.pct}%` }}></div>
                                          <div className="progress-bar bg-warning" style={{ width: `${et.total > 0 ? (et.enProceso / et.total) * 100 : 0}%` }}></div>
                                          <div className="progress-bar bg-secondary bg-opacity-50" style={{ width: `${et.total > 0 ? (et.sinIniciar / et.total) * 100 : 0}%` }}></div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="mt-3 text-center">
                                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                                    <i className="bi bi-info-circle me-1"></i> Inicial, Primaria y Media General consolidadas.
                                  </small>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Fila Inferior del Tablero 360: Semáforo de Cumplimiento Institucional */}
                          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom flex-wrap gap-2">
                              <h6 className="fw-bold text-dark mb-0">
                                <i className="bi bi-traffic-light-fill text-warning me-2"></i>
                                Semáforo de Gestión y Priorización por Grado
                              </h6>
                              <span className="small text-muted">Clasificación automática para llamadas y convocatorias</span>
                            </div>

                            <div className="row g-3">
                              <div className="col-md-4">
                                <div className="p-3 rounded-4 border border-success bg-success bg-opacity-10 h-100">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="fw-bold text-success small text-uppercase">🟢 Nivel Óptimo (≥75%)</span>
                                    <span className="badge bg-success text-white fw-bold">{stats.semaforoOptimo?.length || 0}</span>
                                  </div>
                                  <div className="d-flex flex-wrap gap-1 mt-2">
                                    {stats.semaforoOptimo?.length === 0 ? (
                                      <span className="text-muted small">Ningún grado en este nivel aún.</span>
                                    ) : (
                                      stats.semaforoOptimo?.map((g, i) => (
                                        <span key={i} className="badge bg-white text-success border border-success py-1.5 px-2">
                                          {g.grado} ({g.pctCompletado}%)
                                        </span>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="col-md-4">
                                <div className="p-3 rounded-4 border border-warning bg-warning bg-opacity-10 h-100">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="fw-bold text-warning small text-uppercase" style={{ color: '#ca8a04 !important' }}>🟡 En Progreso (40% - 74%)</span>
                                    <span className="badge bg-warning text-dark fw-bold">{stats.semaforoEnProgreso?.length || 0}</span>
                                  </div>
                                  <div className="d-flex flex-wrap gap-1 mt-2">
                                    {stats.semaforoEnProgreso?.length === 0 ? (
                                      <span className="text-muted small">Ningún grado en este rango.</span>
                                    ) : (
                                      stats.semaforoEnProgreso?.map((g, i) => (
                                        <span key={i} className="badge bg-white text-dark border border-warning py-1.5 px-2">
                                          {g.grado} ({g.pctCompletado}%)
                                        </span>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="col-md-4">
                                <div className="p-3 rounded-4 border border-danger bg-danger bg-opacity-10 h-100">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="fw-bold text-danger small text-uppercase">🔴 Atención Prioritaria (&lt;40%)</span>
                                    <span className="badge bg-danger text-white fw-bold">{stats.semaforoAtencion?.length || 0}</span>
                                  </div>
                                  <div className="d-flex flex-wrap gap-1 mt-2">
                                    {stats.semaforoAtencion?.length === 0 ? (
                                      <span className="text-success small fw-bold"><i className="bi bi-check-all me-1"></i> ¡Excelente! Ningún grado en alerta roja.</span>
                                    ) : (
                                      stats.semaforoAtencion?.map((g, i) => (
                                        <span key={i} className="badge bg-white text-danger border border-danger py-1.5 px-2">
                                          {g.grado} ({g.pctCompletado}%)
                                        </span>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* VISTA 2: BARRAS DETALLADAS POR GRADO */}
                      {tabReporte === 'barras' && (
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-3 animate__animated animate__fadeIn">
                          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                            <h6 className="fw-bold text-dark mb-0">
                              <i className="bi bi-bar-chart-steps me-2 text-primary"></i>
                              Desglose Detallado por Cada Grado / Año Escolar ({stats.desglosePorGrado.length} Niveles)
                            </h6>
                            <span className="badge bg-primary bg-opacity-10 text-primary border">{nombreInstitucion}</span>
                          </div>

                          <div className="row g-3">
                            {stats.desglosePorGrado.length === 0 ? (
                              <div className="col-12 text-center py-5 text-muted">
                                No hay estudiantes registrados para el ámbito seleccionado.
                              </div>
                            ) : (
                              stats.desglosePorGrado.map((g, idx) => {
                                const pComp = g.total > 0 ? (g.completados / g.total) * 100 : 0;
                                const pProc = g.total > 0 ? (g.enProceso / g.total) * 100 : 0;
                                const pSin = g.total > 0 ? (g.sinIniciar / g.total) * 100 : 0;

                                return (
                                  <div key={idx} className="col-md-6">
                                    <div className="p-3 rounded-4 bg-light border hover-efecto h-100">
                                      <div className="d-flex justify-content-between align-items-center mb-2">
                                        <div>
                                          <span className="fw-bold text-dark d-block">{g.grado}</span>
                                          <small className="text-muted">Matrícula: {g.total} alumnos</small>
                                        </div>
                                        <div className="text-end">
                                          <span className="fs-5 fw-bolder text-primary d-block">{g.pctCompletado}%</span>
                                          <span className="badge bg-success bg-opacity-10 text-success" style={{ fontSize: '0.7rem' }}>
                                            {g.completados} listos
                                          </span>
                                        </div>
                                      </div>

                                      <div className="progress rounded-pill shadow-inner mb-2" style={{ height: '11px' }}>
                                        <div className="progress-bar bg-success" style={{ width: `${pComp}%` }} title={`Completados: ${g.completados}`}></div>
                                        <div className="progress-bar bg-warning" style={{ width: `${pProc}%` }} title={`En Proceso: ${g.enProceso}`}></div>
                                        <div className="progress-bar bg-secondary bg-opacity-50" style={{ width: `${pSin}%` }} title={`Sin Iniciar: ${g.sinIniciar}`}></div>
                                      </div>

                                      <div className="d-flex justify-content-between small text-muted" style={{ fontSize: '0.75rem' }}>
                                        <span>🟢 {g.completados} completados</span>
                                        <span>🟡 {g.enProceso} en proceso</span>
                                        <span>⚪ {g.sinIniciar} sin iniciar</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                      {/* VISTA 3: COBERTURA POR DIMENSIÓN / SECCIÓN */}
                      {tabReporte === 'secciones' && (
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-3 animate__animated animate__fadeIn">
                          <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                            <div>
                              <h6 className="fw-bold text-dark mb-0">
                                <i className="bi bi-ui-checks-grid me-2 text-primary"></i>
                                Cobertura de Llenado por Dimensión del Formulario
                              </h6>
                              <small className="text-muted">Porcentaje de avance en cada una de las 8 secciones evaluadas en el censo integral.</small>
                            </div>
                            <span className="badge bg-dark bg-opacity-10 text-dark border">{stats.totalGeneral} Estudiantes</span>
                          </div>

                          <div className="row g-3">
                            {stats.desgloseSecciones?.map((sec, idx) => (
                              <div key={idx} className="col-md-6">
                                <div className="p-3 rounded-4 bg-light border hover-efecto h-100">
                                  <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className="d-flex align-items-center gap-2.5">
                                      <div className="p-2 rounded-circle bg-primary bg-opacity-10 text-primary">
                                        <i className={`bi ${sec.icono} fs-5`}></i>
                                      </div>
                                      <div>
                                        <span className="fw-bold text-dark d-block small">{sec.nombre}</span>
                                        <small className="text-muted">{sec.completados} de {stats.totalGeneral} registros</small>
                                      </div>
                                    </div>
                                    <span className="fs-5 fw-bolder text-primary">{sec.pct}%</span>
                                  </div>

                                  <div className="progress rounded-pill shadow-inner" style={{ height: '9px' }}>
                                    <div 
                                      className={`progress-bar ${sec.pct >= 75 ? 'bg-success' : (sec.pct >= 40 ? 'bg-warning' : 'bg-danger')}`} 
                                      style={{ width: `${sec.pct}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* VISTA 4: TABLA DETALLADA POR GRADO */}
                      {tabReporte === 'tabla' && (
                        <div className="bg-white rounded-4 shadow-sm border overflow-hidden animate__animated animate__fadeIn mb-3">
                          <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <h6 className="fw-bold text-dark mb-0">
                              <i className="bi bi-list-task me-2 text-primary"></i>
                              Detalle Tabular de Avance por Grupo, Grado o Año Escolar ({stats.desglosePorGrado.length} Niveles)
                            </h6>
                            <span className="badge bg-dark bg-opacity-10 text-dark border px-3 py-1.5 fw-bold">
                              {nombreInstitucion}
                            </span>
                          </div>
                          <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                              <thead className="bg-light text-muted small">
                                <tr>
                                  <th className="ps-4">Grupo / Grado / Año</th>
                                  <th className="text-center">Total Estudiantes</th>
                                  <th className="text-center">Actualizados (100%)</th>
                                  <th className="text-center">En Proceso</th>
                                  <th className="text-center">Sin Iniciar (0%)</th>
                                  <th style={{ width: '220px' }}>Progreso de Nivel</th>
                                </tr>
                              </thead>
                              <tbody>
                                {stats.desglosePorGrado.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="text-center py-4 text-muted">
                                      No hay estudiantes registrados en el ámbito seleccionado.
                                    </td>
                                  </tr>
                                ) : (
                                  stats.desglosePorGrado.map((g, idx) => (
                                    <tr key={idx}>
                                      <td className="ps-4 fw-bold text-dark">{g.grado}</td>
                                      <td className="text-center fw-bold">{g.total}</td>
                                      <td className="text-center">
                                        <span className="badge bg-success bg-opacity-10 text-success border border-success px-2.5 py-1 fw-bold">
                                          {g.completados}
                                        </span>
                                      </td>
                                      <td className="text-center">
                                        <span className="badge bg-warning bg-opacity-10 text-warning border border-warning px-2.5 py-1 fw-bold" style={{ color: '#ca8a04 !important' }}>
                                          {g.enProceso}
                                        </span>
                                      </td>
                                      <td className="text-center">
                                        <span className="badge bg-light text-secondary border px-2.5 py-1">
                                          {g.sinIniciar}
                                        </span>
                                      </td>
                                      <td>
                                        <div className="d-flex align-items-center gap-2">
                                          <div className="progress flex-grow-1 rounded-pill" style={{ height: '8px' }}>
                                            <div 
                                              className="progress-bar bg-success" 
                                              role="progressbar" 
                                              style={{ width: `${g.pctCompletado}%` }}
                                            ></div>
                                          </div>
                                          <span className="small fw-bold text-success" style={{ minWidth: '40px' }}>
                                            {g.pctCompletado}%
                                          </span>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                )}
                                <tr className="table-light fw-bold border-top border-2" style={{ fontSize: '0.95rem' }}>
                                  <td className="ps-4 text-primary">TOTAL GENERAL CONSOLIDADO</td>
                                  <td className="text-center text-dark">{stats.totalGeneral}</td>
                                  <td className="text-center text-success">{stats.completadosGeneral}</td>
                                  <td className="text-center text-warning" style={{ color: '#ca8a04 !important' }}>{stats.enProcesoGeneral}</td>
                                  <td className="text-center text-secondary">{stats.sinIniciarGeneral}</td>
                                  <td>
                                    <div className="d-flex align-items-center gap-2">
                                      <div className="progress flex-grow-1 rounded-pill" style={{ height: '10px' }}>
                                        <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${stats.pctGeneral}%` }}></div>
                                      </div>
                                      <span className="small fw-bold text-primary" style={{ minWidth: '40px' }}>
                                        {stats.pctGeneral}%
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="modal-footer bg-white border-top p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <div className="small text-muted">
                        <i className="bi bi-shield-lock-fill me-1 text-primary"></i>
                        Reporte emitido con marca de tiempo: <b>{stats.fechaHoraReporte}</b>
                      </div>

                      <div className="d-flex gap-2 flex-wrap align-items-center">
                        {/* GRUPO EXPORTAR / DESCARGAR */}
                        <div className="btn-group shadow-sm" role="group">
                          <button 
                            type="button" 
                            className="btn btn-danger fw-bold px-3 d-flex align-items-center gap-1.5"
                            onClick={descargarReportePDF}
                            disabled={generandoPDF}
                            title="Descargar documento oficial en PDF"
                          >
                            {generandoPDF ? (
                              <>
                                <span className="spinner-border spinner-border-sm"></span>
                                <span>PDF...</span>
                              </>
                            ) : (
                              <>
                                <i className="bi bi-file-earmark-pdf-fill"></i>
                                <span>Descargar PDF</span>
                              </>
                            )}
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-outline-success fw-bold px-3"
                            onClick={exportarEstadisticasExcel}
                            title="Descargar datos en Excel"
                          >
                            <i className="bi bi-file-earmark-excel-fill me-1"></i> Excel
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-outline-primary fw-bold px-3"
                            onClick={imprimirReporteEstadistico}
                            title="Imprimir reporte"
                          >
                            <i className="bi bi-printer-fill me-1"></i> Imprimir
                          </button>
                        </div>

                        {/* GRUPO ENVIAR DIRECTO */}
                        <div className="btn-group shadow-sm" role="group">
                          <button 
                            type="button" 
                            className="btn btn-success fw-bold px-3 d-flex align-items-center gap-1.5"
                            style={{ backgroundColor: '#25D366', borderColor: '#25D366', color: '#fff' }}
                            onClick={handleEnviarWhatsApp}
                            title="Enviar reporte por WhatsApp (Texto o Imagen)"
                          >
                            <i className="bi bi-whatsapp"></i>
                            <span>Enviar WhatsApp</span>
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-dark fw-bold px-3 d-flex align-items-center gap-1.5"
                            onClick={handleEnviarCorreo}
                            title="Enviar reporte por correo electrónico"
                          >
                            <i className="bi bi-envelope-fill"></i>
                            <span>Enviar Correo</span>
                          </button>
                        </div>

                        <button 
                          type="button" 
                          className="btn btn-secondary rounded-pill px-4"
                          onClick={() => setShowEstadisticasModal(false)}
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
    </>
  );
};
