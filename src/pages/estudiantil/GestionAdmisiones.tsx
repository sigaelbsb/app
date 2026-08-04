import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';
import * as XLSX from 'xlsx';

const Swal = (window as any).Swal;

interface SolicitudAdmision {
  id: string | number;
  codigo_unico: string;
  codigo_escuela: string;
  estudiante_nombres: string;
  estudiante_apellidos: string;
  estudiante_cedula?: string;
  estudiante_fecha_nacimiento?: string;
  estudiante_sexo?: string;
  estudiante_condicion_neuro?: string;
  estudiante_condicion_medica?: string;
  grado_solicitado: string;
  representante_nombres: string;
  representante_apellidos: string;
  representante_cedula: string;
  representante_telefono?: string;
  representante_email?: string;
  representante_parentesco?: string;
  parentesco?: string;
  representante_trabaja_pdvsa?: string | boolean;
  pdvsa_condicion_laboral?: string;
  pdvsa_tipo_nomina?: string;
  pdvsa_negocio_filial?: string;
  pdvsa_gerencia?: string;
  pdvsa_localidad_trabajo?: string;
  madre_nombres?: string;
  madre_apellidos?: string;
  madre_cedula?: string;
  madre_trabaja_pdvsa?: string | boolean;
  padre_nombres?: string;
  padre_apellidos?: string;
  padre_cedula?: string;
  padre_trabaja_pdvsa?: string | boolean;
  estado_habitacion?: string;
  municipio_habitacion?: string;
  parroquia_habitacion?: string;
  direccion_habitacion?: string;
  requiere_transporte?: boolean;
  ruta_transporte?: string;
  doc_ficha?: string;
  doc_foto_estudiante?: string;
  doc_partida_nacimiento?: string;
  doc_cedula_estudiante?: string;
  estado: string; // 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Borrador'
  observaciones?: string;
  creado_por?: string;
  created_at?: string;
}

const NOMBRE_ESCUELA_MAP: Record<string, string> = {
  sb: 'U.E. Santa Bárbara',
  lb: 'U.E. Libertador Bolívar',
  todas: 'Todas las Escuelas',
};

export const GestionAdmisiones: React.FC = () => {
  const { user } = usePermisos();
  const [solicitudes, setSolicitudes] = useState<SolicitudAdmision[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudAdmision | null>(null);
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [guardandoEstado, setGuardandoEstado] = useState<boolean>(false);

  // ── ESTADOS DE FILTROS ──────────────────────────────────────────────────────────
  const [filtroEscuela, setFiltroEscuela] = useState<string>('todas');
  const [filtroNomina, setFiltroNomina] = useState<string>('todas');
  const [filtroLocalidad, setFiltroLocalidad] = useState<string>('todas');
  const [filtroCondicionLaboral, setFiltroCondicionLaboral] = useState<string>('todas');
  const [filtroGrado, setFiltroGrado] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  // ── CATÁLOGOS CARGADOS DESDE LA BD ─────────────────────────────────────────────
  const [opcionesNomina, setOpcionesNomina] = useState<string[]>([]);
  const [opcionesLocalidad, setOpcionesLocalidad] = useState<string[]>([]);
  const [opcionesCondicionLaboral, setOpcionesCondicionLaboral] = useState<string[]>([]);
  const [opcionesGrado, setOpcionesGrado] = useState<string[]>([]);

  // Formulario para actualización de estado en el modal
  const [nuevoEstado, setNuevoEstado] = useState<string>('Pendiente');
  const [nuevasObservaciones, setNuevasObservaciones] = useState<string>('');

  // ── DUPLICADOS ──────────────────────────────────────────────────────────────────
  const [modalDuplicadosAbierto, setModalDuplicadosAbierto] = useState<boolean>(false);
  const [gruposDuplicados, setGruposDuplicados] = useState<SolicitudAdmision[][]>([]);
  const [seleccionadosParaEliminar, setSeleccionadosParaEliminar] = useState<Set<string | number>>(new Set());
  const [eliminandoDuplicados, setEliminandoDuplicados] = useState<boolean>(false);

  // ── DEPURACIÓN DE VACÍOS ────────────────────────────────────────────────────────
  const [modalVaciosAbierto, setModalVaciosAbierto] = useState<boolean>(false);
  const [tipoVacios, setTipoVacios] = useState<'representante' | 'estudiante'>('representante');
  const [registrosVacios, setRegistrosVacios] = useState<SolicitudAdmision[]>([]);
  const [seleccionadosVacios, setSeleccionadosVacios] = useState<Set<string | number>>(new Set());
  const [eliminandoVacios, setEliminandoVacios] = useState<boolean>(false);

  // ── DEPURACIÓN DE REGULARES ──────────────────────────────────────────────────────
  const [modalRegularesAbierto, setModalRegularesAbierto] = useState<boolean>(false);
  const [registrosRegulares, setRegistrosRegulares] = useState<SolicitudAdmision[]>([]);
  const [seleccionadosRegulares, setSeleccionadosRegulares] = useState<Set<string | number>>(new Set());
  const [eliminandoRegulares, setEliminandoRegulares] = useState<boolean>(false);
  const [detectandoRegulares, setDetectandoRegulares] = useState<boolean>(false);

  // ── CARGA DE CATÁLOGOS DESDE SUPABASE ──────────────────────────────────────────
  const cargarCatalogos = async () => {
    try {
      const [gradosRes, nominasRes, condRes, localidadesRes] = await Promise.all([
        supabase.from('conf_grados').select('valor').order('orden', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Nómina').order('valor', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Condición').order('valor', { ascending: true }),
        supabase.from('diccionarios_empresa').select('valor').eq('categoria', 'Localidad').order('valor', { ascending: true }),
      ]);

      setOpcionesGrado(
        gradosRes.data && gradosRes.data.length > 0
          ? gradosRes.data.map((g: any) => g.valor)
          : ['II Grupo (Inicial)', 'III Grupo (Inicial)', '1° Grado', '2° Grado', '3° Grado', '4° Grado', '5° Grado', '6° Grado', '1° Año', '2° Año', '3° Año', '4° Año', '5° Año']
      );

      setOpcionesNomina(
        nominasRes.data && nominasRes.data.length > 0
          ? nominasRes.data.map((p: any) => p.valor)
          : ['Comunidad', 'Jubilado', 'Nómina Contractual (Menor)', 'Nómina No Contractual (Mayor)']
      );

      setOpcionesCondicionLaboral(
        condRes.data && condRes.data.length > 0
          ? condRes.data.map((p: any) => p.valor)
          : ['Activo', 'Comunidad', 'Jubilado', 'Sobreviviente']
      );

      setOpcionesLocalidad(
        localidadesRes.data && localidadesRes.data.length > 0
          ? localidadesRes.data.map((p: any) => p.valor)
          : []
      );
    } catch (e) {
      console.error('Error cargando catálogos de admisiones:', e);
    }
  };

  // ── CARGA DE DATOS DESDE SUPABASE ──────────────────────────────────────────────
  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('solicitud_cupos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al consultar solicitudes de cupo:', error);
        if (Swal) {
          Swal.fire({
            icon: 'error',
            title: 'Error de Carga',
            text: 'No se pudieron cargar las solicitudes de admisión desde la base de datos: ' + error.message,
          });
        }
      } else {
        setSolicitudes(data || []);
      }
    } catch (err: any) {
      console.error('Excepción al cargar solicitudes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
    cargarCatalogos();
  }, []);

  // ── OPCIONES DE FILTROS ENRIQUECIDAS (BD + valores únicos de registros) ─────────
  // Extrae valores únicos de los registros para garantizar que siempre aparezcan
  // los valores realmente utilizados, incluso si aún no están en el catálogo.
  const opcionesNominaEnriquecidas = useMemo(() => {
    const set = new Set<string>(opcionesNomina);
    solicitudes.forEach(s => {
      if (s.pdvsa_tipo_nomina?.trim()) set.add(s.pdvsa_tipo_nomina.trim());
    });
    return Array.from(set).sort();
  }, [opcionesNomina, solicitudes]);

  const opcionesLocalidadEnriquecidas = useMemo(() => {
    const set = new Set<string>(opcionesLocalidad);
    solicitudes.forEach(s => {
      if (s.pdvsa_localidad_trabajo?.trim()) set.add(s.pdvsa_localidad_trabajo.trim());
    });
    return Array.from(set).sort();
  }, [opcionesLocalidad, solicitudes]);

  const opcionesCondicionEnriquecidas = useMemo(() => {
    const set = new Set<string>(opcionesCondicionLaboral);
    solicitudes.forEach(s => {
      if (s.pdvsa_condicion_laboral?.trim()) set.add(s.pdvsa_condicion_laboral.trim());
    });
    return Array.from(set).sort();
  }, [opcionesCondicionLaboral, solicitudes]);

  const opcionesGradoEnriquecidos = useMemo(() => {
    const set = new Set<string>(opcionesGrado);
    solicitudes.forEach(s => {
      if (s.grado_solicitado?.trim()) set.add(s.grado_solicitado.trim());
    });
    return Array.from(set);
  }, [opcionesGrado, solicitudes]);

  // ── FILTRADO MULTICRITERIO ─────────────────────────────────────────────────────
  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter(s => {
      // 1. Filtro por Escuela
      if (filtroEscuela !== 'todas') {
        if (s.codigo_escuela?.toLowerCase() !== filtroEscuela.toLowerCase()) {
          return false;
        }
      }

      // 2. Filtro por Nómina
      if (filtroNomina !== 'todas') {
        if (s.pdvsa_tipo_nomina?.toLowerCase() !== filtroNomina.toLowerCase()) {
          return false;
        }
      }

      // 3. Filtro por Localidad
      if (filtroLocalidad !== 'todas') {
        if (s.pdvsa_localidad_trabajo?.toLowerCase() !== filtroLocalidad.toLowerCase()) {
          return false;
        }
      }

      // 4. Filtro por Condición Laboral
      if (filtroCondicionLaboral !== 'todas') {
        if (s.pdvsa_condicion_laboral?.toLowerCase() !== filtroCondicionLaboral.toLowerCase()) {
          return false;
        }
      }

      // 5. Filtro por Grado o Nivel Educativo
      if (filtroGrado !== 'todos') {
        if (s.grado_solicitado?.toLowerCase() !== filtroGrado.toLowerCase()) {
          return false;
        }
      }

      // 6. Filtro por Estado
      if (filtroEstado !== 'todos') {
        if (s.estado?.toLowerCase() !== filtroEstado.toLowerCase()) {
          return false;
        }
      }

      // 7. Filtro Búsqueda Texto
      if (busqueda.trim() !== '') {
        const query = busqueda.toLowerCase().trim();
        const nomEst = `${s.estudiante_nombres || ''} ${s.estudiante_apellidos || ''}`.toLowerCase();
        const cedEst = (s.estudiante_cedula || '').toLowerCase();
        const nomRep = `${s.representante_nombres || ''} ${s.representante_apellidos || ''}`.toLowerCase();
        const cedRep = (s.representante_cedula || '').toLowerCase();
        const codUni = (s.codigo_unico || '').toLowerCase();

        if (
          !nomEst.includes(query) &&
          !cedEst.includes(query) &&
          !nomRep.includes(query) &&
          !cedRep.includes(query) &&
          !codUni.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    solicitudes,
    filtroEscuela,
    filtroNomina,
    filtroLocalidad,
    filtroCondicionLaboral,
    filtroGrado,
    filtroEstado,
    busqueda,
  ]);

  // ── ESTADÍSTICAS E INDICADORES KPI ──────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = solicitudesFiltradas.length;
    const aprobados = solicitudesFiltradas.filter(s => s.estado === 'Aprobado').length;
    const pendientes = solicitudesFiltradas.filter(s => s.estado === 'Pendiente' || !s.estado).length;
    const rechazados = solicitudesFiltradas.filter(s => s.estado === 'Rechazado').length;
    const sbCount = solicitudesFiltradas.filter(s => s.codigo_escuela === 'sb').length;
    const lbCount = solicitudesFiltradas.filter(s => s.codigo_escuela === 'lb').length;

    return { total, aprobados, pendientes, rechazados, sbCount, lbCount };
  }, [solicitudesFiltradas]);

  const limpiarFiltros = () => {
    setFiltroEscuela('todas');
    setFiltroNomina('todas');
    setFiltroLocalidad('todas');
    setFiltroCondicionLaboral('todas');
    setFiltroGrado('todos');
    setFiltroEstado('todos');
    setBusqueda('');
  };

  // ── EXPORTAR A EXCEL ─────────────────────────────────────────────────────────────
  const exportarExcel = () => {
    if (solicitudesFiltradas.length === 0) {
      if (Swal) {
        Swal.fire({
          icon: 'warning',
          title: 'Sin Registros',
          text: 'No hay solicitudes para exportar con los filtros seleccionados.',
        });
      } else {
        alert('No hay solicitudes para exportar con los filtros seleccionados.');
      }
      return;
    }

    const dataExcel = solicitudesFiltradas.map((s, idx) => ({
      Nro: idx + 1,
      'Código Único': s.codigo_unico || 'N/A',
      Escuela: NOMBRE_ESCUELA_MAP[s.codigo_escuela] || s.codigo_escuela,
      Estudiante: `${s.estudiante_nombres} ${s.estudiante_apellidos}`,
      'Cédula Estudiante': s.estudiante_cedula || 'N/A',
      'Grado Solicitado': s.grado_solicitado || 'N/A',
      Representante: `${s.representante_nombres} ${s.representante_apellidos}`,
      'Cédula Representante': s.representante_cedula || 'N/A',
      Parentesco: s.parentesco || s.representante_parentesco || 'Representante',
      'Teléfono Contacto': s.representante_telefono || 'N/A',
      'Correo Contacto': s.representante_email || 'N/A',
      'Trabaja PDVSA': s.representante_trabaja_pdvsa ? 'Sí' : 'No',
      'Nómina PDVSA': s.pdvsa_tipo_nomina || 'N/A',
      'Localidad Trabajo': s.pdvsa_localidad_trabajo || 'N/A',
      'Condición Laboral': s.pdvsa_condicion_laboral || 'N/A',
      Gerencia: s.pdvsa_gerencia || 'N/A',
      Estado: s.estado || 'Pendiente',
      'Fecha Registro': s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A',
      Observaciones: s.observaciones || '',
    }));

    const ws = XLSX.utils.json_to_sheet(dataExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gestion_Admisiones');
    const fechaStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `SIGAE_Gestion_Admisiones_${fechaStr}.xlsx`);

    auditar('Gestión de Admisiones', 'Exportar Excel', `Exportadas ${solicitudesFiltradas.length} solicitudes`);
  };

  // ── ABRIR MODAL DE DETALLE Y CAMBIO DE ESTADO ───────────────────────────────────
  const abrirDetalle = (sol: SolicitudAdmision) => {
    setSolicitudSeleccionada(sol);
    setNuevoEstado(sol.estado || 'Pendiente');
    setNuevasObservaciones(sol.observaciones || '');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setSolicitudSeleccionada(null);
  };

  // ── ACTUALIZAR ESTADO DE LA ADMISIÓN ────────────────────────────────────────────
  const actualizarEstadoSolicitud = async () => {
    if (!solicitudSeleccionada) return;

    setGuardandoEstado(true);
    try {
      const { error } = await supabase
        .from('solicitud_cupos')
        .update({
          estado: nuevoEstado,
          observaciones: nuevasObservaciones,
        })
        .eq('id', solicitudSeleccionada.id);

      if (error) {
        throw error;
      }

      // Auditar la acción
      await auditar(
        'Gestión de Admisiones',
        'Actualizar Estado Solicitud',
        `Solicitud ${solicitudSeleccionada.codigo_unico} marcada como ${nuevoEstado}`
      );

      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: 'Estado Actualizado',
          text: `La solicitud ${solicitudSeleccionada.codigo_unico} ha sido actualizada a estado "${nuevoEstado}".`,
          timer: 2000,
          showConfirmButton: false,
        });
      }

      // Refrescar lista local
      setSolicitudes(prev =>
        prev.map(s =>
          s.id === solicitudSeleccionada.id
            ? { ...s, estado: nuevoEstado, observaciones: nuevasObservaciones }
            : s
        )
      );

      cerrarModal();
    } catch (err: any) {
      console.error('Error al actualizar estado:', err);
      if (Swal) {
        Swal.fire({
          icon: 'error',
          title: 'Error al Guardar',
          text: 'No se pudo actualizar el estado de la solicitud: ' + (err.message || 'Error desconocido'),
        });
      } else {
        alert('No se pudo actualizar el estado de la solicitud: ' + (err.message || 'Error desconocido'));
      }
    } finally {
      setGuardandoEstado(false);
    }
  };

  // Auxiliar para badges de estado
  const renderBadgeEstado = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'aprobado':
        return <span className="badge bg-success text-white px-2 py-1"><i className="bi bi-check-circle-fill me-1"></i>Aprobado</span>;
      case 'rechazado':
        return <span className="badge bg-danger text-white px-2 py-1"><i className="bi bi-x-circle-fill me-1"></i>Rechazado</span>;
      case 'borrador':
        return <span className="badge bg-secondary text-white px-2 py-1"><i className="bi bi-pencil-square me-1"></i>Borrador</span>;
      default:
        return <span className="badge bg-warning text-dark px-2 py-1"><i className="bi bi-clock-history me-1"></i>Pendiente</span>;
    }
  };

  // ── DETECCIÓN DE DUPLICADOS ─────────────────────────────────────────────────────
  // LÓGICA EN DOS NIVELES (Basado en la petición del usuario):
  //   Nivel 1 → Agrupar por representante (cedula_representante con dato real)
  //   Nivel 2 → Dentro del grupo del representante, detectar si el MISMO ESTUDIANTE
  //              aparece más de una vez.
  //
  // REGLAS DE OMISIÓN (registros sin datos suficientes se ignoran):
  //   - Sin cédula del representante → se omite
  //   - Sin datos del estudiante → se omite
  const detectarDuplicados = () => {
    // ── PASO 1: Agrupar por representante ────────────────────────────────────────
    const porRepresentante: Record<string, SolicitudAdmision[]> = {};

    solicitudes.forEach(s => {
      const cedRep = (s.representante_cedula || '').trim();

      // Omitir si no tiene cédula del representante
      if (!cedRep) return;

      const cedEst = (s.estudiante_cedula || '').trim();
      const nomEst = `${s.estudiante_nombres || ''} ${s.estudiante_apellidos || ''}`.trim();

      // Omitir si no hay ningún identificador del estudiante
      if (!cedEst && !nomEst) return;

      if (!porRepresentante[cedRep]) porRepresentante[cedRep] = [];
      porRepresentante[cedRep].push(s);
    });

    // ── PASO 2: Dentro de cada representante, buscar duplicados del estudiante ──
    const gruposDetectados: SolicitudAdmision[][] = [];

    Object.values(porRepresentante).forEach(registrosRep => {
      // Sub-agrupar por identidad del estudiante
      const porEstudiante: Record<string, SolicitudAdmision[]> = {};

      registrosRep.forEach(s => {
        const cedEst = (s.estudiante_cedula || '').trim();
        const nomEst = `${s.estudiante_nombres || ''} ${s.estudiante_apellidos || ''}`.trim().toLowerCase();
        const escuela = (s.codigo_escuela || '').trim().toLowerCase();

        // Clave del estudiante:
        // Si tiene CI → usarlo. Si no, usar el nombre completo. Siempre acotado por la escuela.
        const claveEst = cedEst
          ? `ci:${cedEst}|esc:${escuela}`
          : `nom:${nomEst}|esc:${escuela}`;

        if (!porEstudiante[claveEst]) porEstudiante[claveEst] = [];
        porEstudiante[claveEst].push(s);
      });

      // Solo grupos con más de 1 registro = duplicado real
      Object.values(porEstudiante).forEach(grupo => {
        if (grupo.length > 1) {
          // Ordenar de más reciente a más antiguo
          grupo.sort((a, b) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
          gruposDetectados.push(grupo);
        }
      });
    });

    // Ordenar grupos por tamaño descendente (más duplicados primero)
    gruposDetectados.sort((a, b) => b.length - a.length);

    setGruposDuplicados(gruposDetectados);

    // Pre-seleccionar los más antiguos de cada grupo para eliminar (conservar el más reciente)
    const preseleccion = new Set<string | number>();
    gruposDetectados.forEach(grupo => {
      grupo.slice(1).forEach(s => {
        if (s.id !== undefined) preseleccion.add(s.id);
      });
    });
    setSeleccionadosParaEliminar(preseleccion);
    setModalDuplicadosAbierto(true);
  };

  const toggleSeleccion = (id: string | number) => {
    setSeleccionadosParaEliminar(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const eliminarSeleccionados = async () => {
    if (seleccionadosParaEliminar.size === 0) return;

    // Verificar que no se vaya a eliminar TODOS los registros de algún grupo
    for (const grupo of gruposDuplicados) {
      const idsGrupo = grupo.map(s => s.id).filter(id => id !== undefined) as (string | number)[];
      const aEliminar = idsGrupo.filter(id => seleccionadosParaEliminar.has(id));
      if (aEliminar.length === idsGrupo.length) {
        if (Swal) {
          Swal.fire({
            icon: 'warning',
            title: 'Acción no permitida',
            text: `Debes conservar al menos un registro por grupo. El grupo de "${grupo[0].estudiante_nombres} ${grupo[0].estudiante_apellidos}" tiene todos sus registros seleccionados.`,
          });
        }
        return;
      }
    }

    const confirmar = await (Swal ? Swal.fire({
      icon: 'warning',
      title: `¿Eliminar ${seleccionadosParaEliminar.size} registro(s) duplicado(s)?`,
      html: `<p>Esta acción es <strong>irreversible</strong>. Los registros seleccionados serán eliminados permanentemente de la base de datos.</p><p class="text-muted small">Los registros NO seleccionados dentro de cada grupo se conservarán.</p>`,
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Sí, eliminar duplicados',
      cancelButtonText: 'Cancelar',
    }) : { isConfirmed: confirm(`¿Eliminar ${seleccionadosParaEliminar.size} registros duplicados?`) });

    if (!confirmar?.isConfirmed && confirmar !== true) return;

    setEliminandoDuplicados(true);
    try {
      const idsArray = Array.from(seleccionadosParaEliminar);
      const { error } = await supabase
        .from('solicitud_cupos')
        .delete()
        .in('id', idsArray);

      if (error) throw error;

      await auditar(
        'Gestión de Admisiones',
        'Eliminar Duplicados',
        `Se eliminaron ${idsArray.length} registros duplicados de solicitud_cupos`
      );

      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Registros eliminados!',
          text: `Se eliminaron ${idsArray.length} registros duplicados correctamente.`,
          timer: 2500,
          showConfirmButton: false,
        });
      }

      // Refrescar datos y cerrar modal
      setSolicitudes(prev => prev.filter(s => !seleccionadosParaEliminar.has(s.id as any)));
      setModalDuplicadosAbierto(false);
      setGruposDuplicados([]);
      setSeleccionadosParaEliminar(new Set());
    } catch (err: any) {
      console.error('Error al eliminar duplicados:', err);
      if (Swal) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron eliminar los duplicados: ' + (err.message || 'Error desconocido') });
      }
    } finally {
      setEliminandoDuplicados(false);
    }
  };

  // ── DETECCIÓN DE REGISTROS VACÍOS ──────────────────────────────────────────────
  const detectarVacios = (tipo: 'representante' | 'estudiante') => {
    setTipoVacios(tipo);
    const vacios = solicitudes.filter(s => {
      if (tipo === 'representante') {
        const ced = (s.representante_cedula || '').trim();
        const nom = `${s.representante_nombres || ''} ${s.representante_apellidos || ''}`.trim();
        return !ced && !nom;
      } else {
        const ced = (s.estudiante_cedula || '').trim();
        const nom = `${s.estudiante_nombres || ''} ${s.estudiante_apellidos || ''}`.trim();
        return !ced && !nom;
      }
    });

    setRegistrosVacios(vacios);

    // Pre-seleccionar todos
    const preseleccion = new Set<string | number>();
    vacios.forEach(s => {
      if (s.id !== undefined) preseleccion.add(s.id);
    });
    setSeleccionadosVacios(preseleccion);
    setModalVaciosAbierto(true);
  };

  const toggleSeleccionVacio = (id: string | number) => {
    setSeleccionadosVacios(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const eliminarVaciosSeleccionados = async () => {
    if (seleccionadosVacios.size === 0) return;

    const confirmar = await (Swal ? Swal.fire({
      icon: 'warning',
      title: `¿Eliminar ${seleccionadosVacios.size} registro(s) vacío(s)?`,
      html: `<p>Esta acción es <strong>irreversible</strong>. Se eliminarán los registros que no tienen información del ${tipoVacios}.</p>`,
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }) : { isConfirmed: confirm(`¿Eliminar ${seleccionadosVacios.size} registros vacíos?`) });

    if (!confirmar?.isConfirmed && confirmar !== true) return;

    setEliminandoVacios(true);
    try {
      const idsArray = Array.from(seleccionadosVacios);
      const { error } = await supabase
        .from('solicitud_cupos')
        .delete()
        .in('id', idsArray);

      if (error) throw error;

      await auditar(
        'Gestión de Admisiones',
        'Eliminar Vacíos',
        `Se eliminaron ${idsArray.length} registros sin datos de ${tipoVacios}`
      );

      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Registros eliminados!',
          text: `Se eliminaron ${idsArray.length} registros vacíos correctamente.`,
          timer: 2500,
          showConfirmButton: false,
        });
      }

      setSolicitudes(prev => prev.filter(s => !seleccionadosVacios.has(s.id as any)));
      setModalVaciosAbierto(false);
      setRegistrosVacios([]);
      setSeleccionadosVacios(new Set());
    } catch (err: any) {
      console.error('Error al eliminar vacíos:', err);
      if (Swal) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron eliminar: ' + (err.message || 'Error desconocido') });
      }
    } finally {
      setEliminandoVacios(false);
    }
  };

  // ── DETECCIÓN DE ESTUDIANTES REGULARES ─────────────────────────────────────────
  const detectarRegulares = async () => {
    setDetectandoRegulares(true);
    try {
      // 1. Obtener todos los estudiantes de estudiantes_vinculaciones
      const { data: regulares, error } = await supabase
        .from('estudiantes_vinculaciones')
        .select('cedula_estudiante, nombres_estudiante, apellidos_estudiante');

      if (error) throw error;
      
      const regularesList = regulares || [];

      // 2. Cruzar con las solicitudes
      const encontrados = solicitudes.filter(sol => {
        const solCedula = (sol.estudiante_cedula || '').trim();
        const solNombres = (sol.estudiante_nombres || '').trim().toLowerCase();
        const solApellidos = (sol.estudiante_apellidos || '').trim().toLowerCase();

        return regularesList.some(reg => {
          const regCedula = (reg.cedula_estudiante || '').trim();
          
          // Match por Cédula (si ambos tienen)
          if (solCedula && regCedula && solCedula === regCedula) return true;

          // Si alguno no tiene cédula, match por Nombres y Apellidos
          const regNombres = (reg.nombres_estudiante || '').trim().toLowerCase();
          const regApellidos = (reg.apellidos_estudiante || '').trim().toLowerCase();
          
          if (solNombres && regNombres && solApellidos && regApellidos) {
            if (solNombres === regNombres && solApellidos === regApellidos) return true;
          }

          return false;
        });
      });

      setRegistrosRegulares(encontrados);

      // Pre-seleccionar todos
      const preseleccion = new Set<string | number>();
      encontrados.forEach(s => {
        if (s.id !== undefined) preseleccion.add(s.id);
      });
      setSeleccionadosRegulares(preseleccion);
      setModalRegularesAbierto(true);
      
    } catch (err: any) {
      console.error('Error al detectar regulares:', err);
      if (Swal) Swal.fire('Error', 'No se pudo consultar la base de datos de estudiantes regulares', 'error');
    } finally {
      setDetectandoRegulares(false);
    }
  };

  const toggleSeleccionRegular = (id: string | number) => {
    setSeleccionadosRegulares(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const eliminarRegularesSeleccionados = async () => {
    if (seleccionadosRegulares.size === 0) return;

    const confirmar = await (Swal ? Swal.fire({
      icon: 'warning',
      title: `¿Eliminar ${seleccionadosRegulares.size} solicitud(es)?`,
      html: `<p>Esta acción eliminará las solicitudes de cupo de estudiantes que <strong>ya son regulares</strong> en la escuela.</p><p class="text-muted small">No afectará sus registros en el sistema escolar, solo limpiará el módulo de admisiones.</p>`,
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Sí, eliminar solicitudes',
      cancelButtonText: 'Cancelar',
    }) : { isConfirmed: confirm(`¿Eliminar ${seleccionadosRegulares.size} solicitudes de estudiantes regulares?`) });

    if (!confirmar?.isConfirmed && confirmar !== true) return;

    setEliminandoRegulares(true);
    try {
      const idsArray = Array.from(seleccionadosRegulares);
      const { error } = await supabase
        .from('solicitud_cupos')
        .delete()
        .in('id', idsArray);

      if (error) throw error;

      await auditar(
        'Gestión de Admisiones',
        'Eliminar Solicitudes de Regulares',
        `Se eliminaron ${idsArray.length} solicitudes pertenecientes a estudiantes regulares`
      );

      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Depuración completada!',
          text: `Se eliminaron ${idsArray.length} solicitudes de estudiantes regulares.`,
          timer: 2500,
          showConfirmButton: false,
        });
      }

      setSolicitudes(prev => prev.filter(s => !seleccionadosRegulares.has(s.id as any)));
      setModalRegularesAbierto(false);
      setRegistrosRegulares([]);
      setSeleccionadosRegulares(new Set());
    } catch (err: any) {
      console.error('Error al eliminar regulares:', err);
      if (Swal) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron eliminar: ' + (err.message || 'Error desconocido') });
      }
    } finally {
      setEliminandoRegulares(false);
    }
  };

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* ── ENCABEZADO DE LA VISTA ────────────────────────────────────────────── */}
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 pb-3 border-bottom">
        <div>
          <div className="d-flex align-items-center gap-2">
            <span
              className="p-2 rounded-3 text-white"
              style={{ backgroundColor: '#8B5CF6', display: 'inline-flex' }}
            >
              <i className="bi bi-ui-checks fs-4"></i>
            </span>
            <div>
              <h3 className="fw-bold mb-0 text-dark">Gestión de Admisiones</h3>
              <p className="text-muted small mb-0">
                Filtro avanzado multitermino y control centralizado de solicitudes de cupo estudiantil
              </p>
            </div>
          </div>
        </div>

        <div className="d-flex gap-2 mt-2 mt-sm-0 flex-wrap">
          <button className="btn btn-outline-secondary btn-sm" onClick={cargarSolicitudes} title="Recargar registros">
            <i className="bi bi-arrow-clockwise me-1"></i> Actualizar
          </button>
          <button
            className="btn btn-outline-warning btn-sm fw-bold"
            onClick={detectarDuplicados}
            title="Detectar y depurar registros duplicados"
          >
            <i className="bi bi-copy me-1"></i> Ver Duplicados
            {gruposDuplicados.length > 0 && (
              <span className="badge bg-danger ms-1" style={{ fontSize: '10px' }}>{gruposDuplicados.length}</span>
            )}
          </button>
          <button
            className="btn btn-outline-danger btn-sm fw-bold"
            onClick={() => detectarVacios('representante')}
            title="Detectar y depurar registros sin datos del representante"
          >
            <i className="bi bi-person-x-fill me-1"></i> Vacíos (Representante)
          </button>
          <button
            className="btn btn-outline-danger btn-sm fw-bold"
            onClick={() => detectarVacios('estudiante')}
            title="Detectar y depurar registros sin datos del estudiante"
          >
            <i className="bi bi-person-dash-fill me-1"></i> Vacíos (Estudiante)
          </button>
          <button
            className="btn btn-outline-info btn-sm fw-bold text-dark"
            onClick={detectarRegulares}
            disabled={detectandoRegulares}
            title="Depurar solicitudes de estudiantes que ya están inscritos en la escuela"
          >
            {detectandoRegulares ? (
              <><span className="spinner-border spinner-border-sm me-1" role="status"></span> Buscando...</>
            ) : (
              <><i className="bi bi-shield-check me-1"></i> Depurar Regulares</>
            )}
          </button>
          <button className="btn btn-success btn-sm fw-bold text-white shadow-sm" onClick={exportarExcel}>
            <i className="bi bi-file-earmark-excel-fill me-1"></i> Exportar a Excel
          </button>
        </div>
      </div>

      {/* ── TARJETAS KPI / MÉTRICAS ───────────────────────────────────────────── */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm rounded-3 h-100" style={{ borderLeft: '4px solid #8B5CF6' }}>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted small fw-semibold">Total Solicitudes</div>
                  <div className="fs-4 fw-bold text-dark">{kpis.total}</div>
                </div>
                <div className="bg-light p-2 rounded-circle text-primary">
                  <i className="bi bi-files fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm rounded-3 h-100" style={{ borderLeft: '4px solid #16a34a' }}>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted small fw-semibold">Aprobados</div>
                  <div className="fs-4 fw-bold text-success">{kpis.aprobados}</div>
                </div>
                <div className="bg-light p-2 rounded-circle text-success">
                  <i className="bi bi-check-circle-fill fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm rounded-3 h-100" style={{ borderLeft: '4px solid #eab308' }}>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted small fw-semibold">Pendientes</div>
                  <div className="fs-4 fw-bold text-warning">{kpis.pendientes}</div>
                </div>
                <div className="bg-light p-2 rounded-circle text-warning">
                  <i className="bi bi-clock-history fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm rounded-3 h-100" style={{ borderLeft: '4px solid #dc2626' }}>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted small fw-semibold">Rechazados</div>
                  <div className="fs-4 fw-bold text-danger">{kpis.rechazados}</div>
                </div>
                <div className="bg-light p-2 rounded-circle text-danger">
                  <i className="bi bi-x-circle-fill fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm rounded-3 h-100" style={{ borderLeft: '4px solid #0284c7' }}>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted small fw-semibold">Santa Bárbara</div>
                  <div className="fs-4 fw-bold text-info">{kpis.sbCount}</div>
                </div>
                <div className="bg-light p-2 rounded-circle text-info">
                  <i className="bi bi-building fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-md-4 col-xl-2">
          <div className="card border-0 shadow-sm rounded-3 h-100" style={{ borderLeft: '4px solid #06b6d4' }}>
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted small fw-semibold">Libertador Bolívar</div>
                  <div className="fs-4 fw-bold text-cyan" style={{ color: '#06b6d4' }}>{kpis.lbCount}</div>
                </div>
                <div className="bg-light p-2 rounded-circle text-cyan" style={{ color: '#06b6d4' }}>
                  <i className="bi bi-bank fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN DE FILTROS REQUERIDOS ─────────────────────────────────────── */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
          <div className="fw-bold text-dark d-flex align-items-center gap-2">
            <i className="bi bi-funnel-fill text-primary"></i> Panel de Filtros Requeridos
          </div>
          <button className="btn btn-link text-decoration-none btn-sm p-0 text-muted" onClick={limpiarFiltros}>
            <i className="bi bi-x-circle me-1"></i> Limpiar Filtros
          </button>
        </div>

        <div className="card-body p-3">
          <div className="row g-3">
            {/* 1. Filtro Escuela */}
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <label className="form-label small fw-bold text-secondary mb-1">
                <i className="bi bi-building me-1"></i> Escuela
              </label>
              <select
                className="form-select form-select-sm"
                value={filtroEscuela}
                onChange={e => setFiltroEscuela(e.target.value)}
              >
                <option value="todas">Todas las Escuelas</option>
                <option value="sb">U.E. Santa Bárbara (SB)</option>
                <option value="lb">U.E. Libertador Bolívar (LB)</option>
              </select>
            </div>

            {/* 2. Filtro Nómina */}
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <label className="form-label small fw-bold text-secondary mb-1">
                <i className="bi bi-person-badge me-1"></i> Nómina
              </label>
              <select
                className="form-select form-select-sm"
                value={filtroNomina}
                onChange={e => setFiltroNomina(e.target.value)}
              >
                <option value="todas">Todas las Nóminas</option>
                {opcionesNominaEnriquecidas.map(nom => (
                  <option key={nom} value={nom}>
                    {nom}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Filtro Localidad */}
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <label className="form-label small fw-bold text-secondary mb-1">
                <i className="bi bi-geo-alt me-1"></i> Localidad
              </label>
              <select
                className="form-select form-select-sm"
                value={filtroLocalidad}
                onChange={e => setFiltroLocalidad(e.target.value)}
              >
                <option value="todas">Todas las Localidades</option>
                {opcionesLocalidadEnriquecidas.map(loc => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Filtro Condición Laboral */}
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <label className="form-label small fw-bold text-secondary mb-1">
                <i className="bi bi-briefcase me-1"></i> Condición Laboral
              </label>
              <select
                className="form-select form-select-sm"
                value={filtroCondicionLaboral}
                onChange={e => setFiltroCondicionLaboral(e.target.value)}
              >
                <option value="todas">Todas las Condiciones</option>
                {opcionesCondicionEnriquecidas.map(cond => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Filtro Grado o Nivel Educativo */}
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <label className="form-label small fw-bold text-secondary mb-1">
                <i className="bi bi-mortarboard me-1"></i> Grado / Nivel
              </label>
              <select
                className="form-select form-select-sm"
                value={filtroGrado}
                onChange={e => setFiltroGrado(e.target.value)}
              >
                <option value="todos">Todos los Grados</option>
                {opcionesGradoEnriquecidos.map(grd => (
                  <option key={grd} value={grd}>
                    {grd}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. Filtro Estado de Trámite */}
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <label className="form-label small fw-bold text-secondary mb-1">
                <i className="bi bi-flag me-1"></i> Estado
              </label>
              <select
                className="form-select form-select-sm"
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
              >
                <option value="todos">Todos los Estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Aprobado">Aprobado</option>
                <option value="Rechazado">Rechazado</option>
                <option value="Borrador">Borrador</option>
              </select>
            </div>

            {/* Búsqueda Global por texto */}
            <div className="col-12">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light text-muted border-end-0">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Buscar por nombre de estudiante, cédula, representante o código único..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                />
                {busqueda && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setBusqueda('')}
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABLA DE RESULTADOS ──────────────────────────────────────────────── */}
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
          <div className="fw-bold text-dark">
            Listado de Registros ({solicitudesFiltradas.length}{' '}
            {solicitudesFiltradas.length === 1 ? 'resultado' : 'resultados'})
          </div>
          {solicitudesFiltradas.length !== solicitudes.length && (
            <span className="badge bg-info text-dark">
              Filtrado de {solicitudes.length} registros totales
            </span>
          )}
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-2" role="status"></div>
              <p className="text-muted small">Cargando registros de admisiones...</p>
            </div>
          ) : solicitudesFiltradas.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
              <h6 className="fw-bold text-dark mb-1">No se encontraron solicitudes</h6>
              <p className="text-muted small mb-3">
                No hay registros que coincidan con los criterios de filtro aplicados.
              </p>
              <button className="btn btn-sm btn-outline-primary" onClick={limpiarFiltros}>
                Restablecer Filtros
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '13.5px' }}>
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '120px' }}>Código Único</th>
                    <th>Escuela</th>
                    <th>Estudiante</th>
                    <th>Grado Solicitado</th>
                    <th>Representante</th>
                    <th>Nómina / Condición</th>
                    <th>Localidad</th>
                    <th className="text-center">Estado</th>
                    <th className="text-end" style={{ width: '100px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudesFiltradas.map(sol => (
                    <tr key={sol.id || sol.codigo_unico}>
                      <td>
                        <span className="fw-bold text-primary">{sol.codigo_unico || 'N/A'}</span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {NOMBRE_ESCUELA_MAP[sol.codigo_escuela] || sol.codigo_escuela?.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="fw-bold text-dark">
                          {sol.estudiante_nombres} {sol.estudiante_apellidos}
                        </div>
                        {sol.estudiante_cedula && (
                          <div className="text-muted extra-small">C.I: {sol.estudiante_cedula}</div>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-secondary-subtle text-secondary border">
                          {sol.grado_solicitado || 'Sin grado'}
                        </span>
                      </td>
                      <td>
                        <div>
                          {sol.representante_nombres} {sol.representante_apellidos}
                        </div>
                        <div className="text-muted extra-small">
                          {sol.representante_cedula} ({sol.parentesco || sol.representante_parentesco || 'Representante'})
                        </div>
                      </td>
                      <td>
                        <div className="small fw-semibold">{sol.pdvsa_tipo_nomina || 'N/A'}</div>
                        <div className="text-muted extra-small">{sol.pdvsa_condicion_laboral || 'Sin Condición'}</div>
                      </td>
                      <td>
                        <span className="text-dark small">
                          <i className="bi bi-geo-alt me-1 text-secondary"></i>
                          {sol.pdvsa_localidad_trabajo || 'N/A'}
                        </span>
                      </td>
                      <td className="text-center">{renderBadgeEstado(sol.estado)}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => abrirDetalle(sol)}
                          title="Ver detalle y gestionar estado"
                        >
                          <i className="bi bi-eye-fill me-1"></i> Detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL DE DETALLE Y GESTIÓN DE ESTADO DE ADMISIÓN ──────────────────── */}
      {modalAbierto && solicitudSeleccionada && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white py-3">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <i className="bi bi-clipboard-check"></i> Exp. Admisión: {solicitudSeleccionada.codigo_unico}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={cerrarModal}
                ></button>
              </div>

              <div className="modal-body p-4" style={{ fontSize: '14px' }}>
                {/* 1. Datos del Estudiante */}
                <div className="card mb-3 border-light bg-light">
                  <div className="card-body">
                    <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">
                      <i className="bi bi-person-fill me-2"></i>Datos del Estudiante
                    </h6>
                    <div className="row g-2">
                      <div className="col-12 col-md-6">
                        <strong>Nombres y Apellidos:</strong> {solicitudSeleccionada.estudiante_nombres} {solicitudSeleccionada.estudiante_apellidos}
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Cédula / Escolar:</strong> {solicitudSeleccionada.estudiante_cedula || 'N/A'}
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Grado Solicitado:</strong> {solicitudSeleccionada.grado_solicitado}
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Escuela Asignada:</strong> {NOMBRE_ESCUELA_MAP[solicitudSeleccionada.codigo_escuela] || solicitudSeleccionada.codigo_escuela}
                      </div>
                      {solicitudSeleccionada.estudiante_condicion_neuro && (
                        <div className="col-12 col-md-6 text-warning">
                          <strong>Condición Neurodivergente:</strong> {solicitudSeleccionada.estudiante_condicion_neuro}
                        </div>
                      )}
                      {solicitudSeleccionada.estudiante_condicion_medica && (
                        <div className="col-12 col-md-6 text-danger">
                          <strong>Condición Médica:</strong> {solicitudSeleccionada.estudiante_condicion_medica}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Datos del Representante y PDVSA */}
                <div className="card mb-3 border-light bg-light">
                  <div className="card-body">
                    <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">
                      <i className="bi bi-building-gear me-2"></i>Datos de Representante y Empresa (PDVSA)
                    </h6>
                    <div className="row g-2">
                      <div className="col-12 col-md-6">
                        <strong>Representante Legal:</strong> {solicitudSeleccionada.representante_nombres} {solicitudSeleccionada.representante_apellidos}
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Cédula:</strong> {solicitudSeleccionada.representante_cedula} ({solicitudSeleccionada.parentesco || solicitudSeleccionada.representante_parentesco || 'Representante'})
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Teléfono:</strong> {solicitudSeleccionada.representante_telefono || 'N/A'}
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Email:</strong> {solicitudSeleccionada.representante_email || 'N/A'}
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Tipo de Nómina:</strong> {solicitudSeleccionada.pdvsa_tipo_nomina || 'N/A'}
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Condición Laboral:</strong> {solicitudSeleccionada.pdvsa_condicion_laboral || 'N/A'}
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Localidad de Trabajo:</strong> {solicitudSeleccionada.pdvsa_localidad_trabajo || 'N/A'}
                      </div>
                      <div className="col-12 col-md-6">
                        <strong>Gerencia / Negocio:</strong> {solicitudSeleccionada.pdvsa_gerencia || 'N/A'} {solicitudSeleccionada.pdvsa_negocio_filial ? `(${solicitudSeleccionada.pdvsa_negocio_filial})` : ''}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Documentos y Soportes */}
                <div className="card mb-3 border-light bg-light">
                  <div className="card-body">
                    <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">
                      <i className="bi bi-file-earmark-pdf me-2"></i>Documentación Adjunta
                    </h6>
                    <div className="d-flex flex-wrap gap-2">
                      {solicitudSeleccionada.doc_ficha && (
                        <a href={solicitudSeleccionada.doc_ficha} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline-secondary">
                          <i className="bi bi-file-earmark-person me-1"></i> Ficha Trabajador
                        </a>
                      )}
                      {solicitudSeleccionada.doc_foto_estudiante && (
                        <a href={solicitudSeleccionada.doc_foto_estudiante} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline-secondary">
                          <i className="bi bi-image me-1"></i> Foto Estudiante
                        </a>
                      )}
                      {solicitudSeleccionada.doc_partida_nacimiento && (
                        <a href={solicitudSeleccionada.doc_partida_nacimiento} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline-secondary">
                          <i className="bi bi-file-earmark-text me-1"></i> Partida Nacimiento
                        </a>
                      )}
                      {solicitudSeleccionada.doc_cedula_estudiante && (
                        <a href={solicitudSeleccionada.doc_cedula_estudiante} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline-secondary">
                          <i className="bi bi-card-heading me-1"></i> Cédula Identidad
                        </a>
                      )}
                      {!solicitudSeleccionada.doc_ficha &&
                        !solicitudSeleccionada.doc_foto_estudiante &&
                        !solicitudSeleccionada.doc_partida_nacimiento &&
                        !solicitudSeleccionada.doc_cedula_estudiante && (
                          <span className="text-muted small italic">No hay documentos adjuntos disponibles.</span>
                        )}
                    </div>
                  </div>
                </div>

                {/* 4. Actualización del Estado de Admisión */}
                <div className="card border-primary">
                  <div className="card-header bg-primary-subtle fw-bold text-primary">
                    <i className="bi bi-sliders me-2"></i>Gestionar Estatus de Admisión
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-12 col-md-5">
                        <label className="form-label fw-bold small">Nuevo Estatus:</label>
                        <select
                          className="form-select"
                          value={nuevoEstado}
                          onChange={e => setNuevoEstado(e.target.value)}
                        >
                          <option value="Pendiente">Pendiente (En Revisión)</option>
                          <option value="Aprobado">Aprobado (Asignar Cupo)</option>
                          <option value="Rechazado">Rechazado</option>
                          <option value="Borrador">Borrador</option>
                        </select>
                      </div>

                      <div className="col-12 col-md-7">
                        <label className="form-label fw-bold small">Observaciones Institucionales:</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          placeholder="Ingrese motivo de aprobación, desaprobación o notas internas..."
                          value={nuevasObservaciones}
                          onChange={e => setNuevasObservaciones(e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light py-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm fw-bold px-3"
                  onClick={actualizarEstadoSolicitud}
                  disabled={guardandoEstado}
                >
                  {guardandoEstado ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status"></span> Guardando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-1"></i> Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE DUPLICADOS Y DEPURACIÓN ─────────────────────────────────────── */}
      {modalDuplicadosAbierto && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg">

              {/* Header */}
              <div className="modal-header py-3" style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' }}>
                <h5 className="modal-title fw-bold text-white d-flex align-items-center gap-2">
                  <i className="bi bi-copy fs-5"></i>
                  Detector de Duplicados
                  <span className="badge bg-white text-danger ms-1" style={{ fontSize: '13px' }}>
                    {gruposDuplicados.length} {gruposDuplicados.length === 1 ? 'grupo' : 'grupos'} detectados
                  </span>
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setModalDuplicadosAbierto(false);
                    setGruposDuplicados([]);
                    setSeleccionadosParaEliminar(new Set());
                  }}
                ></button>
              </div>

              {/* Body */}
              <div className="modal-body p-0">
                {gruposDuplicados.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-patch-check-fill fs-1 text-success d-block mb-3"></i>
                    <h5 className="fw-bold text-dark">¡No se encontraron duplicados!</h5>
                    <p className="text-muted">Todos los registros de solicitud de cupos son únicos.</p>
                  </div>
                ) : (
                  <>
                    {/* Barra de ayuda */}
                    <div className="d-flex align-items-center gap-3 px-4 py-3 border-bottom" style={{ backgroundColor: '#fef9c3' }}>
                      <i className="bi bi-info-circle-fill text-warning fs-5"></i>
                      <div className="small">
                        <strong>Instrucciones:</strong> Se detectaron <strong>{gruposDuplicados.reduce((acc, g) => acc + g.length, 0)}</strong> registros agrupados en <strong>{gruposDuplicados.length}</strong> grupos.
                        Los registros marcados en <span className="badge bg-danger">rojo</span> están seleccionados para eliminar.
                        El registro con borde <span className="badge bg-success">verde</span> es el más reciente (se conserva por defecto). Puedes ajustar la selección antes de eliminar.
                      </div>
                    </div>

                    <div className="p-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                      {gruposDuplicados.map((grupo, gIdx) => (
                        <div
                          key={gIdx}
                          className="card mb-3 border-danger"
                          style={{ borderLeft: '4px solid #dc2626' }}
                        >
                          <div className="card-header bg-danger-subtle d-flex justify-content-between align-items-center py-2">
                            <div className="fw-bold text-danger small">
                              <i className="bi bi-exclamation-triangle-fill me-2"></i>
                              Grupo #{gIdx + 1} — {grupo.length} registros duplicados para:{' '}
                              <strong>{grupo[0].estudiante_nombres} {grupo[0].estudiante_apellidos}</strong>
                              {grupo[0].estudiante_cedula && (
                                <span className="ms-2 text-muted fw-normal">C.I.: {grupo[0].estudiante_cedula}</span>
                              )}
                            </div>
                            <div className="small text-muted">
                              Escuela: <strong>{NOMBRE_ESCUELA_MAP[grupo[0].codigo_escuela] || grupo[0].codigo_escuela?.toUpperCase()}</strong>
                            </div>
                          </div>
                          <div className="card-body p-0">
                            <div className="table-responsive">
                              <table className="table table-sm mb-0 align-middle" style={{ fontSize: '12.5px' }}>
                                <thead className="table-light">
                                  <tr>
                                    <th style={{ width: '40px' }}>
                                      <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={grupo.every(s => s.id !== undefined && seleccionadosParaEliminar.has(s.id))}
                                        onChange={e => {
                                          const next = new Set(seleccionadosParaEliminar);
                                          if (e.target.checked) {
                                            grupo.forEach(s => { if (s.id !== undefined) next.add(s.id); });
                                          } else {
                                            grupo.forEach(s => { if (s.id !== undefined) next.delete(s.id); });
                                          }
                                          setSeleccionadosParaEliminar(next);
                                        }}
                                        title="Seleccionar todos del grupo"
                                      />
                                    </th>
                                    <th>Código Único</th>
                                    <th>Grado</th>
                                    <th>Representante</th>
                                    <th>Nómina / Condición</th>
                                    <th>Estado</th>
                                    <th>Fecha Registro</th>
                                    <th className="text-center">Acción</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {grupo.map((sol, sIdx) => {
                                    const esEliminar = sol.id !== undefined && seleccionadosParaEliminar.has(sol.id);
                                    const esMasReciente = sIdx === 0;
                                    return (
                                      <tr
                                        key={sol.id || sol.codigo_unico}
                                        style={{
                                          backgroundColor: esEliminar ? '#fee2e2' : esMasReciente ? '#f0fdf4' : undefined,
                                          borderLeft: esMasReciente ? '3px solid #16a34a' : esEliminar ? '3px solid #dc2626' : undefined,
                                          opacity: esEliminar ? 0.85 : 1,
                                        }}
                                      >
                                        <td>
                                          <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={esEliminar}
                                            onChange={() => { if (sol.id !== undefined) toggleSeleccion(sol.id); }}
                                          />
                                        </td>
                                        <td>
                                          <span className={`fw-bold ${esEliminar ? 'text-danger text-decoration-line-through' : esMasReciente ? 'text-success' : 'text-primary'}`}>
                                            {sol.codigo_unico || 'N/A'}
                                          </span>
                                          {esMasReciente && (
                                            <span className="badge bg-success ms-1" style={{ fontSize: '9px' }}>MÁS RECIENTE</span>
                                          )}
                                        </td>
                                        <td>
                                          <span className="badge bg-secondary-subtle text-secondary border">
                                            {sol.grado_solicitado || 'Sin grado'}
                                          </span>
                                        </td>
                                        <td>
                                          <div>{sol.representante_nombres} {sol.representante_apellidos}</div>
                                          <div className="text-muted" style={{ fontSize: '11px' }}>{sol.representante_cedula}</div>
                                        </td>
                                        <td>
                                          <div className="small">{sol.pdvsa_tipo_nomina || 'N/A'}</div>
                                          <div className="text-muted" style={{ fontSize: '11px' }}>{sol.pdvsa_condicion_laboral || '—'}</div>
                                        </td>
                                        <td>{renderBadgeEstado(sol.estado)}</td>
                                        <td className="text-muted" style={{ fontSize: '11px' }}>
                                          {sol.created_at
                                            ? new Date(sol.created_at).toLocaleString('es-VE', {
                                                day: '2-digit', month: '2-digit', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                              })
                                            : 'N/A'}
                                        </td>
                                        <td className="text-center">
                                          {esEliminar ? (
                                            <span className="badge bg-danger"><i className="bi bi-trash3 me-1"></i>Eliminar</span>
                                          ) : (
                                            <span className="badge bg-success"><i className="bi bi-shield-check me-1"></i>Conservar</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="modal-footer bg-light py-2 d-flex justify-content-between align-items-center">
                <div className="small text-muted">
                  {seleccionadosParaEliminar.size > 0 ? (
                    <span className="text-danger fw-bold">
                      <i className="bi bi-trash3 me-1"></i>
                      {seleccionadosParaEliminar.size} registro(s) marcados para eliminar
                    </span>
                  ) : (
                    <span className="text-muted">Ningún registro seleccionado para eliminar</span>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setModalDuplicadosAbierto(false);
                      setGruposDuplicados([]);
                      setSeleccionadosParaEliminar(new Set());
                    }}
                  >
                    Cerrar
                  </button>
                  {gruposDuplicados.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm fw-bold px-3"
                      onClick={eliminarSeleccionados}
                      disabled={eliminandoDuplicados || seleccionadosParaEliminar.size === 0}
                    >
                      {eliminandoDuplicados ? (
                        <><span className="spinner-border spinner-border-sm me-1" role="status"></span> Eliminando...</>
                      ) : (
                        <><i className="bi bi-trash3-fill me-1"></i> Eliminar Seleccionados ({seleccionadosParaEliminar.size})</>
                      )}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE REGISTROS VACÍOS ────────────────────────────────────────────── */}
      {modalVaciosAbierto && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg">

              {/* Header */}
              <div className="modal-header py-3" style={{ background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)' }}>
                <h5 className="modal-title fw-bold text-white d-flex align-items-center gap-2">
                  <i className={tipoVacios === 'representante' ? "bi bi-person-x-fill fs-5" : "bi bi-person-dash-fill fs-5"}></i>
                  Registros sin {tipoVacios === 'representante' ? 'Representante' : 'Estudiante'}
                  <span className="badge bg-white text-danger ms-1" style={{ fontSize: '13px' }}>
                    {registrosVacios.length} {registrosVacios.length === 1 ? 'registro' : 'registros'} detectados
                  </span>
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setModalVaciosAbierto(false);
                    setRegistrosVacios([]);
                    setSeleccionadosVacios(new Set());
                  }}
                ></button>
              </div>

              {/* Body */}
              <div className="modal-body p-0">
                {registrosVacios.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-patch-check-fill fs-1 text-success d-block mb-3"></i>
                    <h5 className="fw-bold text-dark">¡No se encontraron registros vacíos!</h5>
                    <p className="text-muted">Todas las solicitudes tienen información de {tipoVacios}.</p>
                  </div>
                ) : (
                  <>
                    <div className="d-flex align-items-center gap-3 px-4 py-3 border-bottom" style={{ backgroundColor: '#fef2f2' }}>
                      <i className="bi bi-info-circle-fill text-danger fs-5"></i>
                      <div className="small">
                        <strong>Atención:</strong> Se han detectado <strong>{registrosVacios.length}</strong> registros que no poseen ni Cédula ni Nombre del {tipoVacios === 'representante' ? 'Representante Legal' : 'Estudiante'}.
                        Selecciona los registros que deseas eliminar definitivamente del sistema.
                      </div>
                    </div>

                    <div className="p-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                      <div className="table-responsive">
                        <table className="table table-sm table-hover mb-0 align-middle" style={{ fontSize: '12.5px' }}>
                          <thead className="table-light">
                            <tr>
                              <th style={{ width: '40px' }}>
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={registrosVacios.length > 0 && registrosVacios.every(s => s.id !== undefined && seleccionadosVacios.has(s.id))}
                                  onChange={e => {
                                    const next = new Set(seleccionadosVacios);
                                    if (e.target.checked) {
                                      registrosVacios.forEach(s => { if (s.id !== undefined) next.add(s.id); });
                                    } else {
                                      registrosVacios.forEach(s => { if (s.id !== undefined) next.delete(s.id); });
                                    }
                                    setSeleccionadosVacios(next);
                                  }}
                                  title="Seleccionar todos"
                                />
                              </th>
                              <th>Código Único</th>
                              <th>Escuela</th>
                              <th>Grado Solicitado</th>
                              <th>Estudiante</th>
                              <th>Fecha Registro</th>
                            </tr>
                          </thead>
                          <tbody>
                            {registrosVacios.map(sol => {
                              const esEliminar = sol.id !== undefined && seleccionadosVacios.has(sol.id);
                              return (
                                <tr
                                  key={sol.id || sol.codigo_unico}
                                  style={{
                                    backgroundColor: esEliminar ? '#fee2e2' : undefined,
                                    borderLeft: esEliminar ? '3px solid #dc2626' : undefined,
                                  }}
                                >
                                  <td>
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      checked={esEliminar}
                                      onChange={() => { if (sol.id !== undefined) toggleSeleccionVacio(sol.id); }}
                                    />
                                  </td>
                                  <td>
                                    <span className="fw-bold text-primary">{sol.codigo_unico || 'N/A'}</span>
                                  </td>
                                  <td>
                                    <div className="small fw-bold">{NOMBRE_ESCUELA_MAP[sol.codigo_escuela] || sol.codigo_escuela?.toUpperCase()}</div>
                                  </td>
                                  <td>
                                    <span className="badge bg-secondary-subtle text-secondary border">
                                      {sol.grado_solicitado || 'Sin grado'}
                                    </span>
                                  </td>
                                  <td>
                                    <div>{sol.estudiante_nombres || 'Sin nombres'} {sol.estudiante_apellidos}</div>
                                    <div className="text-muted" style={{ fontSize: '11px' }}>{sol.estudiante_cedula || 'Sin C.I.'}</div>
                                  </td>
                                  <td className="text-muted" style={{ fontSize: '11px' }}>
                                    {sol.created_at
                                      ? new Date(sol.created_at).toLocaleString('es-VE', {
                                          day: '2-digit', month: '2-digit', year: 'numeric',
                                          hour: '2-digit', minute: '2-digit'
                                        })
                                      : 'N/A'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="modal-footer bg-light py-2 d-flex justify-content-between align-items-center">
                <div className="small text-muted">
                  {seleccionadosVacios.size > 0 ? (
                    <span className="text-danger fw-bold">
                      <i className="bi bi-trash3 me-1"></i>
                      {seleccionadosVacios.size} registro(s) seleccionados
                    </span>
                  ) : (
                    <span className="text-muted">Ningún registro seleccionado</span>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setModalVaciosAbierto(false);
                      setRegistrosVacios([]);
                      setSeleccionadosVacios(new Set());
                    }}
                  >
                    Cerrar
                  </button>
                  {registrosVacios.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm fw-bold px-3"
                      onClick={eliminarVaciosSeleccionados}
                      disabled={eliminandoVacios || seleccionadosVacios.size === 0}
                    >
                      {eliminandoVacios ? (
                        <><span className="spinner-border spinner-border-sm me-1" role="status"></span> Eliminando...</>
                      ) : (
                        <><i className="bi bi-trash3-fill me-1"></i> Eliminar Seleccionados ({seleccionadosVacios.size})</>
                      )}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE DEPURACIÓN DE REGULARES ───────────────────────────────────────── */}
      {modalRegularesAbierto && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg">

              {/* Header */}
              <div className="modal-header py-3" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}>
                <h5 className="modal-title fw-bold text-white d-flex align-items-center gap-2">
                  <i className="bi bi-shield-check fs-5"></i>
                  Solicitudes de Estudiantes Regulares
                  <span className="badge bg-white text-info ms-1" style={{ fontSize: '13px' }}>
                    {registrosRegulares.length} coincidencias
                  </span>
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setModalRegularesAbierto(false);
                    setRegistrosRegulares([]);
                    setSeleccionadosRegulares(new Set());
                  }}
                ></button>
              </div>

              {/* Body */}
              <div className="modal-body p-0">
                {registrosRegulares.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-patch-check-fill fs-1 text-success d-block mb-3"></i>
                    <h5 className="fw-bold text-dark">¡No se encontraron coincidencias!</h5>
                    <p className="text-muted">No hay solicitudes de cupo pertenecientes a estudiantes regulares.</p>
                  </div>
                ) : (
                  <>
                    <div className="d-flex align-items-center gap-3 px-4 py-3 border-bottom" style={{ backgroundColor: '#f0f9ff' }}>
                      <i className="bi bi-info-circle-fill text-info fs-5"></i>
                      <div className="small">
                        <strong>Atención:</strong> Se han detectado <strong>{registrosRegulares.length}</strong> solicitudes pertenecientes a estudiantes que <strong>ya existen</strong> en la base de datos como estudiantes vinculados a la escuela. Selecciona los registros que deseas eliminar del módulo de admisiones.
                      </div>
                    </div>

                    <div className="p-3" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                      <div className="table-responsive">
                        <table className="table table-sm table-hover mb-0 align-middle" style={{ fontSize: '12.5px' }}>
                          <thead className="table-light">
                            <tr>
                              <th style={{ width: '40px' }}>
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  checked={registrosRegulares.length > 0 && registrosRegulares.every(s => s.id !== undefined && seleccionadosRegulares.has(s.id))}
                                  onChange={e => {
                                    const next = new Set(seleccionadosRegulares);
                                    if (e.target.checked) {
                                      registrosRegulares.forEach(s => { if (s.id !== undefined) next.add(s.id); });
                                    } else {
                                      registrosRegulares.forEach(s => { if (s.id !== undefined) next.delete(s.id); });
                                    }
                                    setSeleccionadosRegulares(next);
                                  }}
                                  title="Seleccionar todos"
                                />
                              </th>
                              <th>Código Único</th>
                              <th>Escuela</th>
                              <th>Grado Solicitado</th>
                              <th>Estudiante</th>
                              <th>Representante</th>
                              <th>Fecha Registro</th>
                            </tr>
                          </thead>
                          <tbody>
                            {registrosRegulares.map(sol => {
                              const esEliminar = sol.id !== undefined && seleccionadosRegulares.has(sol.id);
                              return (
                                <tr
                                  key={sol.id || sol.codigo_unico}
                                  style={{
                                    backgroundColor: esEliminar ? '#e0f2fe' : undefined,
                                    borderLeft: esEliminar ? '3px solid #0284c7' : undefined,
                                  }}
                                >
                                  <td>
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      checked={esEliminar}
                                      onChange={() => { if (sol.id !== undefined) toggleSeleccionRegular(sol.id); }}
                                    />
                                  </td>
                                  <td>
                                    <span className="fw-bold text-primary">{sol.codigo_unico || 'N/A'}</span>
                                  </td>
                                  <td>
                                    <div className="small fw-bold">{NOMBRE_ESCUELA_MAP[sol.codigo_escuela] || sol.codigo_escuela?.toUpperCase()}</div>
                                  </td>
                                  <td>
                                    <span className="badge bg-secondary-subtle text-secondary border">
                                      {sol.grado_solicitado || 'Sin grado'}
                                    </span>
                                  </td>
                                  <td>
                                    <div>{sol.estudiante_nombres || 'Sin nombres'} {sol.estudiante_apellidos}</div>
                                    <div className="text-muted" style={{ fontSize: '11px' }}>{sol.estudiante_cedula || 'Sin C.I.'}</div>
                                  </td>
                                  <td>
                                    <div>{sol.representante_nombres || 'Sin nombres'} {sol.representante_apellidos}</div>
                                    <div className="text-muted" style={{ fontSize: '11px' }}>{sol.representante_cedula || 'Sin C.I.'}</div>
                                  </td>
                                  <td className="text-muted" style={{ fontSize: '11px' }}>
                                    {sol.created_at
                                      ? new Date(sol.created_at).toLocaleString('es-VE', {
                                          day: '2-digit', month: '2-digit', year: 'numeric',
                                          hour: '2-digit', minute: '2-digit'
                                        })
                                      : 'N/A'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="modal-footer bg-light py-2 d-flex justify-content-between align-items-center">
                <div className="small text-muted">
                  {seleccionadosRegulares.size > 0 ? (
                    <span className="text-info-emphasis fw-bold">
                      <i className="bi bi-shield-check me-1"></i>
                      {seleccionadosRegulares.size} solicitud(es) seleccionada(s)
                    </span>
                  ) : (
                    <span className="text-muted">Ninguna solicitud seleccionada</span>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setModalRegularesAbierto(false);
                      setRegistrosRegulares([]);
                      setSeleccionadosRegulares(new Set());
                    }}
                  >
                    Cerrar
                  </button>
                  {registrosRegulares.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-info text-dark btn-sm fw-bold px-3 shadow-sm"
                      onClick={eliminarRegularesSeleccionados}
                      disabled={eliminandoRegulares || seleccionadosRegulares.size === 0}
                    >
                      {eliminandoRegulares ? (
                        <><span className="spinner-border spinner-border-sm me-1" role="status"></span> Eliminando...</>
                      ) : (
                        <><i className="bi bi-trash3-fill me-1"></i> Eliminar Seleccionados ({seleccionadosRegulares.size})</>
                      )}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionAdmisiones;
