import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';

interface CensoEstudiantesRutasViewProps {
  onBack: () => void;
  initialEscuela: 'sb' | 'lb';
  user: any;
  canManageRutas: boolean;
  isSuperAdmin: boolean;
}

export interface EstudianteCenso {
  id: string;
  origenTabla: 'vinculacion' | 'solicitud';
  tipoEstudiante: 'regular' | 'nuevo_ingreso';
  codigo_escuela: 'sb' | 'lb';
  escuelaNombre: string;
  cedula: string;
  cedulaNormalizada: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  grado: string;
  rutaNombreRaw: string;
  rutaNombreLimpio: string;
  paradaNombreRaw: string;
  paradaNombreLimpio: string;
  rutaIdOficial?: string;
  paradaIdOficial?: string;
  coincideRutaOficial: boolean;
  coincideParadaOficial: boolean;
  representanteNombre: string;
  representanteCedula: string;
  representanteTelefono: string;
  estadoRegistro?: string;
  direccion?: string;
}

export const CensoEstudiantesRutasView: React.FC<CensoEstudiantesRutasViewProps> = ({
  onBack,
  initialEscuela,
  user,
  canManageRutas,
  isSuperAdmin
}) => {
  const Swal = (window as any).Swal;

  // Filtro de Escuela: 'todas' (Ambas escuelas) | 'sb' (UE Santa Bárbara) | 'lb' (UE Libertador Bolívar)
  const [filtroEscuela, setFiltroEscuela] = useState<'todas' | 'sb' | 'lb'>('todas');
  
  // Pestaña activa del submódulo
  const [tabActiva, setTabActiva] = useState<'jerarquia' | 'ranking' | 'padron' | 'pendientes'>('jerarquia');

  // Estados de datos
  const [loading, setLoading] = useState(true);
  const [estudiantes, setEstudiantes] = useState<EstudianteCenso[]>([]);
  const [rutasDB, setRutasDB] = useState<any[]>([]);
  const [paradasDB, setParadasDB] = useState<any[]>([]);
  
  // Acordeones abiertos de rutas en vista jerárquica
  const [rutasExpandidas, setRutasExpandidas] = useState<Record<string, boolean>>({});

  // Buscador y filtros de la vista Padrón General
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'regular' | 'nuevo_ingreso'>('todos');
  const [filtroRuta, setFiltroRuta] = useState<string>('todas');
  const [filtroGrado, setFiltroGrado] = useState<string>('todos');
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina, setFilasPorPagina] = useState(20);

  // Modal para ver estudiantes de una parada o ruta
  const [modalData, setModalData] = useState<{
    titulo: string;
    subtitulo: string;
    escuela: string;
    estudiantes: EstudianteCenso[];
  } | null>(null);
  const [filtroModal, setFiltroModal] = useState('');

  // ── Helper para normalizar cadenas ──────────────────────────────────────────
  const normalizar = (s: string) => {
    return (s || '')
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  };

  // ── Cargar Datos desde Supabase ─────────────────────────────────────────────
  const cargarCenso = async () => {
    setLoading(true);
    try {
      // 1. Cargar Rutas y Paradas Oficiales
      const [rutasRes, paradasRes] = await Promise.all([
        supabase.from('transporte_rutas').select('*').order('nombre', { ascending: true }),
        supabase.from('transporte_paradas').select('*').order('nombre_parada', { ascending: true })
      ]);

      const todasRutas = rutasRes.data || [];
      const todasParadas = paradasRes.data || [];
      setRutasDB(todasRutas);
      setParadasDB(todasParadas);

      // Diccionarios de rutas y paradas por escuela y normalizadas
      const mapaRutasPorNorm: Record<string, any> = {};
      todasRutas.forEach(r => {
        const key = `${r.escuela_codigo}_${normalizar(r.nombre)}`;
        mapaRutasPorNorm[key] = r;
      });

      const mapaParadasPorNorm: Record<string, any> = {};
      todasParadas.forEach(p => {
        const key = `${p.escuela_codigo}_${normalizar(p.nombre_parada)}`;
        mapaParadasPorNorm[key] = p;
      });

      // 2. Cargar Estudiantes de Vinculaciones (Regulares y algunos Nuevos formalizados)
      const { data: vincData, error: vincErr } = await supabase
        .from('estudiantes_vinculaciones')
        .select('*');

      if (vincErr) console.warn('Error cargando vinculaciones:', vincErr);

      // 3. Cargar Nuevos Ingresos de Solicitud de Cupos
      const { data: solData, error: solErr } = await supabase
        .from('solicitud_cupos')
        .select('*');

      if (solErr) console.warn('Error cargando solicitudes:', solErr);

      const listaConsolidada: EstudianteCenso[] = [];
      const cedulasProcesadas = new Set<string>();

      // A) Procesar vinculaciones primero (datos más actualizados por ficha)
      (vincData || []).forEach(v => {
        const d = v.datos_actualizados || {};
        const reqTrans = d.requiere_transporte === true || d.requiere_transporte === 'true' || d.requiere_transporte === 'si';
        if (!reqTrans) return;

        const cedRaw = (v.cedula_estudiante || d.estudiante_cedula || '').trim();
        const cedNorm = cedRaw.replace(/\D/g, '');
        if (cedNorm) cedulasProcesadas.add(cedNorm);

        const esc = ((v.codigo_escuela || d.codigo_escuela || 'sb') as string).toLowerCase() as 'sb' | 'lb';
        const rawRuta = (d.ruta_transporte || '').trim();
        const rawParada = (d.parada_transporte || '').trim();

        let rutaLimpia = rawRuta;
        let paradaLimpia = rawParada;

        if (rawRuta.includes(' - Parada: ')) {
          const parts = rawRuta.split(' - Parada: ');
          rutaLimpia = parts[0]?.trim() || '';
          if (!paradaLimpia) paradaLimpia = parts[1]?.trim() || '';
        }

        // Buscar coincidencia en catálogo oficial
        const keyRuta = `${esc}_${normalizar(rutaLimpia)}`;
        const rutaMatch = mapaRutasPorNorm[keyRuta] || todasRutas.find(r => r.escuela_codigo === esc && normalizar(r.nombre).includes(normalizar(rutaLimpia)));

        const keyParada = `${esc}_${normalizar(paradaLimpia)}`;
        const paradaMatch = mapaParadasPorNorm[keyParada] || todasParadas.find(p => p.escuela_codigo === esc && normalizar(p.nombre_parada).includes(normalizar(paradaLimpia)));

        const esNuevo = d.origen_admision === 'nuevo_ingreso';

        listaConsolidada.push({
          id: `vinc_${v.id}`,
          origenTabla: 'vinculacion',
          tipoEstudiante: esNuevo ? 'nuevo_ingreso' : 'regular',
          codigo_escuela: esc,
          escuelaNombre: esc === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar',
          cedula: cedRaw || 'Sin Cédula',
          cedulaNormalizada: cedNorm,
          nombres: (v.nombres_estudiante || d.estudiante_nombres || '').trim(),
          apellidos: (v.apellidos_estudiante || d.estudiante_apellidos || '').trim(),
          nombreCompleto: `${v.nombres_estudiante || d.estudiante_nombres || ''} ${v.apellidos_estudiante || d.estudiante_apellidos || ''}`.trim() || 'Estudiante',
          grado: (v.grado_actual || d.grado_actual || d.grado_solicitado || 'No especificado').trim(),
          rutaNombreRaw: rawRuta,
          rutaNombreLimpio: rutaMatch ? rutaMatch.nombre : (rutaLimpia || 'Sin Ruta Asignada'),
          paradaNombreRaw: rawParada,
          paradaNombreLimpio: paradaMatch ? paradaMatch.nombre_parada : (paradaLimpia || 'Sin Parada Asignada'),
          rutaIdOficial: rutaMatch?.id,
          paradaIdOficial: paradaMatch?.id,
          coincideRutaOficial: !!rutaMatch,
          coincideParadaOficial: !!paradaMatch,
          representanteNombre: `${v.nombres_representante || d.representante_nombres || ''} ${v.apellidos_representante || d.representante_apellidos || ''}`.trim() || 'Representante',
          representanteCedula: (v.cedula_representante || d.representante_cedula || '').trim(),
          representanteTelefono: (d.representante_telefono || d.representante_telefono_movil || v.telefono_representante || '').trim(),
          estadoRegistro: d.ficha_completada ? 'Ficha Completada' : 'En Proceso',
          direccion: (d.direccion_habitacion || '').trim()
        });
      });

      // B) Procesar solicitudes de cupos (Nuevos Ingresos no duplicados)
      (solData || []).forEach(s => {
        const reqTrans = s.requiere_transporte === true || s.requiere_transporte === 'true';
        if (!reqTrans) return;

        const cedRaw = (s.estudiante_cedula || '').trim();
        const cedNorm = cedRaw.replace(/\D/g, '');

        // Deduplicación estricta con vinculaciones
        if (cedNorm && cedulasProcesadas.has(cedNorm)) {
          return;
        }

        const esc = ((s.codigo_escuela || 'sb') as string).toLowerCase() as 'sb' | 'lb';
        const rawRuta = (s.ruta_transporte || '').trim();

        let rutaLimpia = rawRuta;
        let paradaLimpia = '';

        if (rawRuta.includes(' - Parada: ')) {
          const parts = rawRuta.split(' - Parada: ');
          rutaLimpia = parts[0]?.trim() || '';
          paradaLimpia = parts[1]?.trim() || '';
        }

        const keyRuta = `${esc}_${normalizar(rutaLimpia)}`;
        const rutaMatch = mapaRutasPorNorm[keyRuta] || todasRutas.find(r => r.escuela_codigo === esc && normalizar(r.nombre).includes(normalizar(rutaLimpia)));

        const keyParada = `${esc}_${normalizar(paradaLimpia)}`;
        const paradaMatch = mapaParadasPorNorm[keyParada] || todasParadas.find(p => p.escuela_codigo === esc && normalizar(p.nombre_parada).includes(normalizar(paradaLimpia)));

        listaConsolidada.push({
          id: `sol_${s.id}`,
          origenTabla: 'solicitud',
          tipoEstudiante: 'nuevo_ingreso',
          codigo_escuela: esc,
          escuelaNombre: esc === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar',
          cedula: cedRaw || 'Sin Cédula',
          cedulaNormalizada: cedNorm,
          nombres: (s.estudiante_nombres || '').trim(),
          apellidos: (s.estudiante_apellidos || '').trim(),
          nombreCompleto: `${s.estudiante_nombres || ''} ${s.estudiante_apellidos || ''}`.trim() || 'Aspirante',
          grado: (s.grado_solicitado || 'Nuevo Ingreso').trim(),
          rutaNombreRaw: rawRuta,
          rutaNombreLimpio: rutaMatch ? rutaMatch.nombre : (rutaLimpia || 'Sin Ruta Asignada'),
          paradaNombreRaw: paradaLimpia,
          paradaNombreLimpio: paradaMatch ? paradaMatch.nombre_parada : (paradaLimpia || 'Sin Parada Asignada'),
          rutaIdOficial: rutaMatch?.id,
          paradaIdOficial: paradaMatch?.id,
          coincideRutaOficial: !!rutaMatch,
          coincideParadaOficial: !!paradaMatch,
          representanteNombre: `${s.representante_nombres || ''} ${s.representante_apellidos || ''}`.trim() || 'Representante',
          representanteCedula: (s.representante_cedula || '').trim(),
          representanteTelefono: (s.representante_telefono || s.representante_telefono2 || '').trim(),
          estadoRegistro: s.estado || 'Solicitud Registrada',
          direccion: (s.direccion_habitacion || '').trim()
        });
      });

      setEstudiantes(listaConsolidada);

      // Expandir inicialmente todas las rutas para mejor visibilidad
      const expInit: Record<string, boolean> = {};
      todasRutas.forEach(r => { expInit[r.id] = true; });
      setRutasExpandidas(expInit);

    } catch (err: any) {
      console.error('Error cargando censo de transporte:', err);
      if (Swal) Swal.fire('Error', 'No se pudo cargar el censo estudiantil de transporte.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCenso();
  }, []);

  // ── Estudiantes filtrados por Escuela activa ──────────────────────────────
  const estudiantesFiltradosEscuela = useMemo(() => {
    if (filtroEscuela === 'todas') return estudiantes;
    return estudiantes.filter(e => e.codigo_escuela === filtroEscuela);
  }, [estudiantes, filtroEscuela]);

  // ── Métricas y Telemetría del Censo ─────────────────────────────────────────
  const metrics = useMemo(() => {
    const total = estudiantesFiltradosEscuela.length;
    const regulares = estudiantesFiltradosEscuela.filter(e => e.tipoEstudiante === 'regular').length;
    const nuevos = estudiantesFiltradosEscuela.filter(e => e.tipoEstudiante === 'nuevo_ingreso').length;
    
    const countSB = estudiantes.filter(e => e.codigo_escuela === 'sb').length;
    const countLB = estudiantes.filter(e => e.codigo_escuela === 'lb').length;

    const rutasConDemandaSet = new Set(
      estudiantesFiltradosEscuela.filter(e => e.rutaNombreLimpio && e.rutaNombreLimpio !== 'Sin Ruta Asignada').map(e => e.rutaNombreLimpio)
    );
    const paradasConDemandaSet = new Set(
      estudiantesFiltradosEscuela.filter(e => e.paradaNombreLimpio && e.paradaNombreLimpio !== 'Sin Parada Asignada').map(e => `${e.rutaNombreLimpio}__${e.paradaNombreLimpio}`)
    );

    const pendientesAsignar = estudiantesFiltradosEscuela.filter(e => !e.coincideRutaOficial || !e.coincideParadaOficial).length;

    return {
      total,
      regulares,
      regularesPct: total > 0 ? Math.round((regulares / total) * 100) : 0,
      nuevos,
      nuevosPct: total > 0 ? Math.round((nuevos / total) * 100) : 0,
      countSB,
      countLB,
      rutasConDemanda: rutasConDemandaSet.size,
      paradasConDemanda: paradasConDemandaSet.size,
      pendientesAsignar
    };
  }, [estudiantesFiltradosEscuela, estudiantes]);

  // ── Agrupación Jerárquica: Rutas -> Paradas -> Estudiantes ─────────────────
  const rutasJerarquia = useMemo(() => {
    // Rutas pertenecientes a la escuela seleccionada
    const rutasBase = rutasDB.filter(r => filtroEscuela === 'todas' || r.escuela_codigo === filtroEscuela);

    return rutasBase.map(ruta => {
      // Paradas oficiales de esta ruta
      const paradasIds = Array.isArray(ruta.paradas_json)
        ? ruta.paradas_json
        : (typeof ruta.paradas_json === 'string' ? JSON.parse(ruta.paradas_json || '[]') : []);

      const paradasDeRuta = paradasDB.filter(p => paradasIds.includes(p.id));

      // Estudiantes asignados a esta ruta
      const estsDeRuta = estudiantesFiltradosEscuela.filter(e => {
        if (e.rutaIdOficial && e.rutaIdOficial === ruta.id) return true;
        return normalizar(e.rutaNombreLimpio) === normalizar(ruta.nombre) && e.codigo_escuela === ruta.escuela_codigo;
      });

      // Estudiantes por cada parada de la ruta
      const paradasConConteo = paradasDeRuta.map((parada, idx) => {
        const estsEnParada = estsDeRuta.filter(e => {
          if (e.paradaIdOficial && e.paradaIdOficial === parada.id) return true;
          return normalizar(e.paradaNombreLimpio) === normalizar(parada.nombre_parada);
        });

        const regs = estsEnParada.filter(e => e.tipoEstudiante === 'regular').length;
        const nuevos = estsEnParada.filter(e => e.tipoEstudiante === 'nuevo_ingreso').length;

        return {
          id: parada.id,
          orden: idx + 1,
          nombre_parada: parada.nombre_parada,
          descripcion: parada.descripcion,
          total: estsEnParada.length,
          regulares: regs,
          nuevosIngresos: nuevos,
          estudiantes: estsEnParada
        };
      });

      // Estudiantes de la ruta que no coincidieron con ninguna de sus paradas oficiales
      const paradasNombresNorm = new Set(paradasDeRuta.map(p => normalizar(p.nombre_parada)));
      const estsSinParadaExacta = estsDeRuta.filter(e => !paradasNombresNorm.has(normalizar(e.paradaNombreLimpio)));

      const totalRegsRuta = estsDeRuta.filter(e => e.tipoEstudiante === 'regular').length;
      const totalNuevosRuta = estsDeRuta.filter(e => e.tipoEstudiante === 'nuevo_ingreso').length;

      return {
        id: ruta.id,
        nombre: ruta.nombre,
        escuela_codigo: ruta.escuela_codigo,
        escuelaNombre: ruta.escuela_codigo === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar',
        chofer_nombre: ruta.chofer_nombre || 'Sin chofer asignado',
        docente_nombre: ruta.docente_nombre || 'Sin docente asignado',
        docente_telefono: ruta.docente_telefono || '',
        activo: ruta.activo !== false,
        totalEstudiantes: estsDeRuta.length,
        totalRegulares: totalRegsRuta,
        totalNuevos: totalNuevosRuta,
        paradas: paradasConConteo,
        sinParadaExacta: estsSinParadaExacta,
        estudiantes: estsDeRuta
      };
    });
  }, [rutasDB, paradasDB, estudiantesFiltradosEscuela, filtroEscuela]);

  // ── Ranking de Paradas con Mayor Demanda ────────────────────────────────────
  const rankingParadas = useMemo(() => {
    const mapaConteo: Record<string, {
      nombre_parada: string;
      ruta_nombre: string;
      escuela_codigo: 'sb' | 'lb';
      escuelaNombre: string;
      total: number;
      regulares: number;
      nuevos: number;
      estudiantes: EstudianteCenso[];
    }> = {};

    estudiantesFiltradosEscuela.forEach(e => {
      if (!e.paradaNombreLimpio || e.paradaNombreLimpio === 'Sin Parada Asignada') return;
      const key = `${e.codigo_escuela}__${e.rutaNombreLimpio}__${e.paradaNombreLimpio}`;
      if (!mapaConteo[key]) {
        mapaConteo[key] = {
          nombre_parada: e.paradaNombreLimpio,
          ruta_nombre: e.rutaNombreLimpio,
          escuela_codigo: e.codigo_escuela,
          escuelaNombre: e.escuelaNombre,
          total: 0,
          regulares: 0,
          nuevos: 0,
          estudiantes: []
        };
      }
      mapaConteo[key].total++;
      if (e.tipoEstudiante === 'regular') mapaConteo[key].regulares++;
      else mapaConteo[key].nuevos++;
      mapaConteo[key].estudiantes.push(e);
    });

    return Object.values(mapaConteo).sort((a, b) => b.total - a.total);
  }, [estudiantesFiltradosEscuela]);

  // ── Padrón General Filtrado y Paginado ───────────────────────────────────────
  const padronFiltrado = useMemo(() => {
    let result = estudiantesFiltradosEscuela;

    if (filtroTipo !== 'todos') {
      result = result.filter(e => e.tipoEstudiante === filtroTipo);
    }

    if (filtroRuta !== 'todas') {
      result = result.filter(e => e.rutaNombreLimpio === filtroRuta);
    }

    if (filtroGrado !== 'todos') {
      result = result.filter(e => e.grado.toLowerCase().includes(filtroGrado.toLowerCase()));
    }

    if (busqueda.trim()) {
      const q = normalizar(busqueda);
      result = result.filter(e => 
        normalizar(e.nombreCompleto).includes(q) ||
        e.cedula.includes(q) ||
        normalizar(e.representanteNombre).includes(q) ||
        e.representanteTelefono.includes(q) ||
        normalizar(e.paradaNombreLimpio).includes(q) ||
        normalizar(e.rutaNombreLimpio).includes(q)
      );
    }

    return result;
  }, [estudiantesFiltradosEscuela, filtroTipo, filtroRuta, filtroGrado, busqueda]);

  const totalPaginas = Math.ceil(padronFiltrado.length / filasPorPagina) || 1;
  const padronPaginado = useMemo(() => {
    const inicio = (paginaActual - 1) * filasPorPagina;
    return padronFiltrado.slice(inicio, inicio + filasPorPagina);
  }, [padronFiltrado, paginaActual, filasPorPagina]);

  // ── Estudiantes Pendientes / Casos Especiales ───────────────────────────────
  const estudiantesPendientes = useMemo(() => {
    return estudiantesFiltradosEscuela.filter(e => 
      !e.coincideRutaOficial || 
      !e.coincideParadaOficial || 
      e.rutaNombreLimpio === 'Sin Ruta Asignada' ||
      e.paradaNombreLimpio === 'Sin Parada Asignada'
    );
  }, [estudiantesFiltradosEscuela]);

  // ── Opciones únicas de Rutas y Grados para Filtros ──────────────────────────
  const opcionesRutas = useMemo(() => {
    const setR = new Set(estudiantesFiltradosEscuela.map(e => e.rutaNombreLimpio).filter(Boolean));
    return Array.from(setR).sort();
  }, [estudiantesFiltradosEscuela]);

  const opcionesGrados = useMemo(() => {
    const setG = new Set(estudiantesFiltradosEscuela.map(e => e.grado).filter(Boolean));
    return Array.from(setG).sort();
  }, [estudiantesFiltradosEscuela]);

  // ── Toggle de Acordeones de Rutas ───────────────────────────────────────────
  const toggleRutaExpand = (rutaId: string) => {
    setRutasExpandidas(prev => ({ ...prev, [rutaId]: !prev[rutaId] }));
  };

  const expandirTodas = (expand: boolean) => {
    const nState: Record<string, boolean> = {};
    rutasDB.forEach(r => { nState[r.id] = expand; });
    setRutasExpandidas(nState);
  };

  // ── Exportar Censo Completo a Excel (CSV con UTF-8 BOM) ─────────────────────
  const exportarCSV = () => {
    if (estudiantesFiltradosEscuela.length === 0) {
      if (Swal) Swal.fire('Atención', 'No hay estudiantes para exportar.', 'info');
      return;
    }

    const headers = [
      '#',
      'Escuela',
      'Tipo de Estudiante',
      'Cédula Estudiante',
      'Nombres Estudiante',
      'Apellidos Estudiante',
      'Grado / Nivel',
      'Ruta Asignada',
      'Ruta Oficial Coincide',
      'Parada Asignada',
      'Parada Oficial Coincide',
      'Representante',
      'Cédula Representante',
      'Teléfono Representante',
      'Estado Ficha / Admisión',
      'Dirección'
    ];

    const rows = estudiantesFiltradosEscuela.map((e, idx) => [
      idx + 1,
      `"${e.escuelaNombre}"`,
      `"${e.tipoEstudiante === 'regular' ? 'Estudiante Regular' : 'Nuevo Ingreso'}"`,
      `"${e.cedula}"`,
      `"${e.nombres.replace(/"/g, '""')}"`,
      `"${e.apellidos.replace(/"/g, '""')}"`,
      `"${e.grado.replace(/"/g, '""')}"`,
      `"${e.rutaNombreLimpio.replace(/"/g, '""')}"`,
      `"${e.coincideRutaOficial ? 'Sí' : 'No'}"`,
      `"${e.paradaNombreLimpio.replace(/"/g, '""')}"`,
      `"${e.coincideParadaOficial ? 'Sí' : 'No'}"`,
      `"${e.representanteNombre.replace(/"/g, '""')}"`,
      `"${e.representanteCedula}"`,
      `"${e.representanteTelefono}"`,
      `"${e.estadoRegistro || ''}"`,
      `"${(e.direccion || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const escuelaNombreTag = filtroEscuela === 'todas' ? 'Ambas_Escuelas_Consolidado' : (filtroEscuela === 'sb' ? 'UE_Santa_Barbara' : 'UE_Libertador_Bolivar');
    link.setAttribute('href', url);
    link.setAttribute('download', `SIGAE_Censo_Transporte_${escuelaNombreTag}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (Swal) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Censo descargado con éxito',
        showConfirmButton: false,
        timer: 2500
      });
    }
  };

  // ── Generar Resumen WhatsApp para Dirección y Coordinación ──────────────────
  const copiarResumenWhatsApp = () => {
    let msg = `🚍 *SIGAE - REPORTE EJECUTIVO DE DEMANDA DE TRANSPORTE ESCOLAR*\n`;
    msg += `🏢 *Sede:* ${filtroEscuela === 'todas' ? 'Consolidado DEP Oriente (Ambas Escuelas)' : (filtroEscuela === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar')}\n`;
    msg += `📅 *Fecha:* ${new Date().toLocaleDateString('es-VE')}\n\n`;

    msg += `📊 *BALANCE GENERAL DE DEMANDA:*\n`;
    msg += `• *Total Estudiantes Solicitantes:* ${metrics.total}\n`;
    msg += `  - 🎒 Regulares: ${metrics.regulares} (${metrics.regularesPct}%)\n`;
    msg += `  - 🌟 Nuevos Ingresos: ${metrics.nuevos} (${metrics.nuevosPct}%)\n`;
    if (filtroEscuela === 'todas') {
      msg += `  - 🏫 U.E. Santa Bárbara: ${metrics.countSB} estudiantes\n`;
      msg += `  - 🏫 U.E. Libertador Bolívar: ${metrics.countLB} estudiantes\n`;
    }
    msg += `• *Rutas Activas con Demanda:* ${metrics.rutasConDemanda}\n`;
    msg += `• *Paradas Activas con Demanda:* ${metrics.paradasConDemanda}\n\n`;

    msg += `📋 *DESGLOSE POR RUTA:*\n`;
    rutasJerarquia.forEach((r, i) => {
      msg += `${i + 1}. *${r.nombre}* (${r.escuela_codigo.toUpperCase()}): *${r.totalEstudiantes} estudiantes* (Reg: ${r.totalRegulares} | Nuevos: ${r.totalNuevos})\n`;
    });

    msg += `\n📍 *TOP 5 PARADAS CON MAYOR CONCENTRACIÓN:*\n`;
    rankingParadas.slice(0, 5).forEach((p, i) => {
      msg += `  ${i + 1}. *${p.nombre_parada}*: ${p.total} estudiantes (${p.ruta_nombre})\n`;
    });

    msg += `\n_Generado automáticamente desde SIGAE Unificado._`;

    navigator.clipboard.writeText(msg).then(() => {
      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Resumen Copiado!',
          text: 'El reporte ejecutivo para WhatsApp ha sido copiado al portapapeles.',
          timer: 2500,
          showConfirmButton: false
        });
      }
    }).catch(() => {
      if (Swal) Swal.fire('Error', 'No se pudo copiar el texto.', 'error');
    });
  };

  // ── Copiar Lista de una Parada Específica para WhatsApp ─────────────────────
  const copiarListaParada = (parada: any, rutaNombre: string) => {
    let msg = `🚍 *LISTADO DE PARADA - TRANSPORTE ESCOLAR*\n`;
    msg += `📍 *Parada:* ${parada.nombre_parada}\n`;
    msg += `🗺️ *Ruta:* ${rutaNombre}\n`;
    msg += `👥 *Total Estudiantes:* ${parada.total} (Regulares: ${parada.regulares} | Nuevos: ${parada.nuevosIngresos})\n`;
    msg += `─────────────────────────\n`;

    parada.estudiantes.forEach((e: EstudianteCenso, i: number) => {
      msg += `${i + 1}. ${e.nombreCompleto} (${e.cedula}) - Grado: ${e.grado} [${e.tipoEstudiante === 'regular' ? 'Regular' : 'Nuevo'}] - Rep: ${e.representanteNombre} (${e.representanteTelefono || 'Sin tlf'})\n`;
    });

    navigator.clipboard.writeText(msg).then(() => {
      if (Swal) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Lista de "${parada.nombre_parada}" copiada`,
          showConfirmButton: false,
          timer: 2000
        });
      }
    });
  };

  // ── Imprimir Reporte ────────────────────────────────────────────────────────
  const imprimirReporte = () => {
    window.print();
  };

  return (
    <div className="animate__animated animate__fadeIn p-2 p-md-3">
      {/* ── BREADCRUMB Y BOTÓN REGRESAR ── */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <button 
            onClick={onBack}
            className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 shadow-xs"
            title="Volver al menú de Transporte Escolar"
          >
            <i className="bi bi-arrow-left"></i>
            <span>Volver a Transporte</span>
          </button>
          <div>
            <h4 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: '1.25rem' }}>
              <i className="bi bi-people-fill text-primary"></i>
              <span>Censo de Estudiantes por Rutas y Paradas</span>
            </h4>
            <span className="text-muted small">
              Balance de demanda estudiantil (Regulares y Nuevos Ingresos) para ambas escuelas
            </span>
          </div>
        </div>

        {/* Botones de Acción Global */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            onClick={exportarCSV}
            className="btn btn-success btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 shadow-xs"
            title="Descargar censo en formato Excel / CSV"
          >
            <i className="bi bi-file-earmark-excel-fill"></i>
            <span>Exportar Excel (CSV)</span>
          </button>

          <button
            onClick={copiarResumenWhatsApp}
            className="btn btn-primary btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 shadow-xs"
            title="Copiar balance de rutas para WhatsApp"
          >
            <i className="bi bi-whatsapp"></i>
            <span>Resumen WhatsApp</span>
          </button>

          <button
            onClick={imprimirReporte}
            className="btn btn-light border btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 shadow-xs"
            title="Imprimir balance del censo"
          >
            <i className="bi bi-printer-fill text-secondary"></i>
            <span>Imprimir</span>
          </button>

          <button
            onClick={cargarCenso}
            disabled={loading}
            className="btn btn-light border btn-sm rounded-circle shadow-xs"
            style={{ width: '34px', height: '34px' }}
            title="Recargar datos desde la base de datos"
          >
            <i className={`bi bi-arrow-clockwise text-primary ${loading ? 'animate__animated animate__rotateIn animate__infinite' : ''}`}></i>
          </button>
        </div>
      </div>

      {/* ── SELECTOR DE ESCUELAS TIPO PILL ── */}
      <div className="p-3 bg-white rounded-4 border shadow-xs mb-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-light text-dark border px-2.5 py-1.5 rounded-pill fw-bold" style={{ fontSize: '0.78rem' }}>
            <i className="bi bi-building me-1.5 text-primary"></i>Sede / Escuela:
          </span>
          <div className="btn-group p-1 bg-light rounded-pill border" role="group">
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${filtroEscuela === 'todas' ? 'btn-primary shadow-sm text-white' : 'btn-light text-muted'}`}
              style={{ fontSize: '0.8rem' }}
              onClick={() => { setFiltroEscuela('todas'); setPaginaActual(1); }}
            >
              🏢 Ambas Escuelas (Consolidado)
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${filtroEscuela === 'sb' ? 'btn-primary shadow-sm text-white' : 'btn-light text-muted'}`}
              style={{ fontSize: '0.8rem' }}
              onClick={() => { setFiltroEscuela('sb'); setPaginaActual(1); }}
            >
              🏫 U.E. Santa Bárbara ({metrics.countSB})
            </button>
            <button
              type="button"
              className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${filtroEscuela === 'lb' ? 'btn-primary shadow-sm text-white' : 'btn-light text-muted'}`}
              style={{ fontSize: '0.8rem' }}
              onClick={() => { setFiltroEscuela('lb'); setPaginaActual(1); }}
            >
              🏫 U.E. Libertador Bolívar ({metrics.countLB})
            </button>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 text-muted small">
          <span className="d-inline-block rounded-circle bg-success" style={{ width: '8px', height: '8px' }}></span>
          <span>Deduplicación activa por Cédula: Datos 100% precisos</span>
        </div>
      </div>

      {/* ── BARRA DE TELEMETRÍA Y MÉTRICAS (KPIs) ── */}
      <div className="row g-2 g-md-3 mb-4">
        {/* Total Estudiantes Demanda */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3 h-100">
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-primary flex-shrink-0" 
              style={{ width: '48px', height: '48px', background: '#eff6ff', fontSize: '1.4rem' }}
            >
              <i className="bi bi-bus-front-fill"></i>
            </div>
            <div className="min-w-0">
              <div className="fw-black text-dark fs-4 line-height-1">{metrics.total}</div>
              <div className="text-muted small fw-semibold" style={{ fontSize: '0.75rem' }}>Demanda Total de Transporte</div>
              <div className="text-primary small fw-bold" style={{ fontSize: '0.7rem' }}>
                {filtroEscuela === 'todas' ? `SB: ${metrics.countSB} | LB: ${metrics.countLB}` : (filtroEscuela === 'sb' ? 'Sede Santa Bárbara' : 'Sede Libertador Bolívar')}
              </div>
            </div>
          </div>
        </div>

        {/* Estudiantes Regulares */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3 h-100">
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-success flex-shrink-0" 
              style={{ width: '48px', height: '48px', background: '#f0fdf4', fontSize: '1.4rem' }}
            >
              <i className="bi bi-backpack-fill"></i>
            </div>
            <div className="min-w-0">
              <div className="fw-black text-dark fs-4 line-height-1 d-flex align-items-center gap-2">
                <span>{metrics.regulares}</span>
                <span className="badge bg-success-subtle text-success rounded-pill fw-bold" style={{ fontSize: '0.68rem' }}>
                  {metrics.regularesPct}%
                </span>
              </div>
              <div className="text-muted small fw-semibold" style={{ fontSize: '0.75rem' }}>Estudiantes Regulares</div>
              <div className="text-success small fw-bold" style={{ fontSize: '0.7rem' }}>
                Actualización de Datos
              </div>
            </div>
          </div>
        </div>

        {/* Nuevos Ingresos */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3 h-100">
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-warning flex-shrink-0" 
              style={{ width: '48px', height: '48px', background: '#fffbeb', fontSize: '1.4rem' }}
            >
              <i className="bi bi-star-fill"></i>
            </div>
            <div className="min-w-0">
              <div className="fw-black text-dark fs-4 line-height-1 d-flex align-items-center gap-2">
                <span>{metrics.nuevos}</span>
                <span className="badge bg-warning-subtle text-warning-emphasis rounded-pill fw-bold" style={{ fontSize: '0.68rem' }}>
                  {metrics.nuevosPct}%
                </span>
              </div>
              <div className="text-muted small fw-semibold" style={{ fontSize: '0.75rem' }}>Nuevos Ingresos</div>
              <div className="text-warning-emphasis small fw-bold" style={{ fontSize: '0.7rem' }}>
                Admisiones y Solicitudes
              </div>
            </div>
          </div>
        </div>

        {/* Rutas y Paradas con Demanda */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3 h-100">
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-info flex-shrink-0" 
              style={{ width: '48px', height: '48px', background: '#f0f9ff', fontSize: '1.4rem' }}
            >
              <i className="bi bi-geo-alt-fill"></i>
            </div>
            <div className="min-w-0">
              <div className="fw-black text-dark fs-4 line-height-1">
                {metrics.rutasConDemanda} <span className="fs-6 text-muted fw-normal">Rutas</span> / {metrics.paradasConDemanda} <span className="fs-6 text-muted fw-normal">Paradas</span>
              </div>
              <div className="text-muted small fw-semibold" style={{ fontSize: '0.75rem' }}>Cobertura Operativa</div>
              <div className="text-info small fw-bold" style={{ fontSize: '0.7rem' }}>
                Puntos de Abordaje Activos
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS DE NAVEGACIÓN INTERNA ── */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <ul className="nav nav-pills bg-white p-1.5 rounded-pill border shadow-xs">
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 ${tabActiva === 'jerarquia' ? 'active shadow-sm' : 'text-muted'}`}
              style={{ fontSize: '0.82rem' }}
              onClick={() => setTabActiva('jerarquia')}
            >
              <i className="bi bi-diagram-3-fill"></i>
              <span>Por Rutas y Paradas ({rutasJerarquia.length})</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 ${tabActiva === 'ranking' ? 'active shadow-sm' : 'text-muted'}`}
              style={{ fontSize: '0.82rem' }}
              onClick={() => setTabActiva('ranking')}
            >
              <i className="bi bi-bar-chart-fill"></i>
              <span>Ranking de Paradas ({rankingParadas.length})</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 ${tabActiva === 'padron' ? 'active shadow-sm' : 'text-muted'}`}
              style={{ fontSize: '0.82rem' }}
              onClick={() => setTabActiva('padron')}
            >
              <i className="bi bi-table"></i>
              <span>Padrón General ({estudiantesFiltradosEscuela.length})</span>
            </button>
          </li>
          {metrics.pendientesAsignar > 0 && (
            <li className="nav-item">
              <button
                className={`nav-link rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 ${tabActiva === 'pendientes' ? 'active shadow-sm' : 'text-danger'}`}
                style={{ fontSize: '0.82rem' }}
                onClick={() => setTabActiva('pendientes')}
              >
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>Por Asignar ({metrics.pendientesAsignar})</span>
              </button>
            </li>
          )}
        </ul>

        {tabActiva === 'jerarquia' && (
          <div className="d-flex align-items-center gap-2">
            <button 
              className="btn btn-sm btn-light border rounded-pill px-2.5 py-1 text-muted fw-bold"
              style={{ fontSize: '0.75rem' }}
              onClick={() => expandirTodas(true)}
            >
              <i className="bi bi-arrows-expand me-1"></i>Expandir todas
            </button>
            <button 
              className="btn btn-sm btn-light border rounded-pill px-2.5 py-1 text-muted fw-bold"
              style={{ fontSize: '0.75rem' }}
              onClick={() => expandirTodas(false)}
            >
              <i className="bi bi-arrows-collapse me-1"></i>Colapsar todas
            </button>
          </div>
        )}
      </div>

      {/* ── LOADING SPINNER ── */}
      {loading && (
        <div className="p-5 text-center bg-white rounded-4 border shadow-xs">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Cargando censo...</span>
          </div>
          <h5 className="fw-bold text-dark">Cargando censo de estudiantes por rutas y paradas...</h5>
          <p className="text-muted small mb-0">Consolidando registros de actualización de datos y admisiones de ambas escuelas.</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          PESTAÑA 1: VISTA JERÁRQUICA (RUTAS -> PARADAS -> ESTUDIANTES)
      ══════════════════════════════════════════════════════════════════════════ */}
      {!loading && tabActiva === 'jerarquia' && (
        <div className="d-flex flex-column gap-3">
          {rutasJerarquia.length === 0 ? (
            <div className="p-5 text-center bg-white rounded-4 border shadow-xs">
              <i className="bi bi-bus-front text-muted" style={{ fontSize: '3rem' }}></i>
              <h5 className="fw-bold text-dark mt-2">No se encontraron rutas para la escuela seleccionada</h5>
              <p className="text-muted small">Cambie el filtro de escuela o agregue nuevas rutas en Configuración.</p>
            </div>
          ) : (
            rutasJerarquia.map(ruta => {
              const isExpanded = !!rutasExpandidas[ruta.id];
              return (
                <div key={ruta.id} className="bg-white rounded-4 border shadow-xs overflow-hidden transition-all">
                  {/* Cabecera de la Ruta */}
                  <div 
                    className="p-3 d-flex flex-wrap align-items-center justify-content-between gap-3 cursor-pointer"
                    style={{ 
                      background: isExpanded ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' : '#ffffff',
                      borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none'
                    }}
                    onClick={() => toggleRutaExpand(ruta.id)}
                  >
                    <div className="d-flex align-items-center gap-3 min-w-0">
                      <div 
                        className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ 
                          width: '42px', 
                          height: '42px', 
                          background: ruta.activo ? '#eff6ff' : '#f1f5f9', 
                          color: ruta.activo ? '#2563eb' : '#94a3b8',
                          fontSize: '1.25rem',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        <i className="bi bi-bus-front-fill"></i>
                      </div>

                      <div className="min-w-0">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '1.05rem' }}>
                            {ruta.nombre}
                          </h5>
                          <span 
                            className="badge rounded-pill fw-bold px-2 py-0.5"
                            style={{ 
                              fontSize: '0.68rem',
                              background: ruta.escuela_codigo === 'sb' ? '#ecfdf5' : '#f0f9ff',
                              color: ruta.escuela_codigo === 'sb' ? '#047857' : '#0369a1',
                              border: `1px solid ${ruta.escuela_codigo === 'sb' ? '#a7f3d0' : '#bae6fd'}`
                            }}
                          >
                            {ruta.escuela_codigo.toUpperCase()} • {ruta.escuelaNombre}
                          </span>
                          {!ruta.activo && (
                            <span className="badge bg-secondary rounded-pill" style={{ fontSize: '0.65rem' }}>Inactiva</span>
                          )}
                        </div>

                        <div className="d-flex align-items-center gap-3 text-muted small mt-1 flex-wrap" style={{ fontSize: '0.75rem' }}>
                          <span>
                            <i className="bi bi-person-badge me-1 text-primary"></i>
                            Chofer: <b>{ruta.chofer_nombre}</b>
                          </span>
                          <span>
                            <i className="bi bi-person-check me-1 text-success"></i>
                            Docente: <b>{ruta.docente_nombre}</b> {ruta.docente_telefono && `(${ruta.docente_telefono})`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Badges de Totales y Controles */}
                    <div className="d-flex align-items-center gap-2 flex-wrap ms-auto">
                      <div className="d-flex align-items-center gap-1.5">
                        <span 
                          className="badge rounded-pill px-3 py-1.5 fw-bold"
                          style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '0.8rem' }}
                          title="Total estudiantes que abordan esta ruta"
                        >
                          <i className="bi bi-people-fill me-1.5"></i>
                          <b>{ruta.totalEstudiantes}</b> Estudiantes
                        </span>
                        <span 
                          className="badge rounded-pill px-2.5 py-1 fw-semibold bg-light text-success border"
                          style={{ fontSize: '0.72rem' }}
                          title="Estudiantes Regulares"
                        >
                          <i className="bi bi-backpack me-1"></i>{ruta.totalRegulares} Reg.
                        </span>
                        <span 
                          className="badge rounded-pill px-2.5 py-1 fw-semibold bg-light text-warning-emphasis border"
                          style={{ fontSize: '0.72rem' }}
                          title="Nuevos Ingresos"
                        >
                          <i className="bi bi-star me-1"></i>{ruta.totalNuevos} Nuevos
                        </span>
                      </div>

                      <button
                        className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-1 fw-bold d-flex align-items-center gap-1"
                        style={{ fontSize: '0.72rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalData({
                            titulo: `Estudiantes de: ${ruta.nombre}`,
                            subtitulo: `Sede: ${ruta.escuelaNombre} | Chofer: ${ruta.chofer_nombre} | Docente: ${ruta.docente_nombre}`,
                            escuela: ruta.escuela_codigo,
                            estudiantes: ruta.estudiantes
                          });
                        }}
                        title="Ver todos los estudiantes de esta ruta"
                      >
                        <i className="bi bi-eye-fill"></i>
                        <span>Ver Lista ({ruta.totalEstudiantes})</span>
                      </button>

                      <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} text-muted ms-1`}></i>
                    </div>
                  </div>

                  {/* Cuerpo Expandible: Lista de Paradas */}
                  {isExpanded && (
                    <div className="p-3 bg-white">
                      {ruta.paradas.length === 0 ? (
                        <div className="p-3 text-center text-muted small bg-light rounded-3">
                          <i className="bi bi-info-circle me-1"></i> Esta ruta aún no tiene paradas registradas en su recorrido.
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                            <thead className="table-light text-muted text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                              <tr>
                                <th style={{ width: '50px' }} className="text-center">#</th>
                                <th>Parada de Abordaje</th>
                                <th>Sector / Ubicación</th>
                                <th className="text-center">Total Estudiantes</th>
                                <th className="text-center">Regulares</th>
                                <th className="text-center">Nuevos Ingresos</th>
                                <th className="text-end">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ruta.paradas.map(p => (
                                <tr key={p.id} className={p.total > 0 ? '' : 'text-muted'}>
                                  <td className="text-center fw-bold text-muted">{p.orden}</td>
                                  <td>
                                    <div className="fw-bold text-dark d-flex align-items-center gap-1.5">
                                      <i className="bi bi-geo-alt-fill text-danger" style={{ fontSize: '0.85rem' }}></i>
                                      <span>{p.nombre_parada}</span>
                                    </div>
                                  </td>
                                  <td className="text-muted small">{p.descripcion || '—'}</td>
                                  <td className="text-center">
                                    <span 
                                      className={`badge rounded-pill px-2.5 py-1 fw-bold ${p.total > 0 ? 'bg-primary text-white shadow-xs' : 'bg-light text-muted border'}`}
                                      style={{ fontSize: '0.75rem' }}
                                    >
                                      {p.total}
                                    </span>
                                  </td>
                                  <td className="text-center">
                                    <span className="badge rounded-pill bg-success-subtle text-success fw-bold px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                                      {p.regulares}
                                    </span>
                                  </td>
                                  <td className="text-center">
                                    <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis fw-bold px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                                      {p.nuevosIngresos}
                                    </span>
                                  </td>
                                  <td className="text-end">
                                    <div className="d-inline-flex align-items-center gap-1">
                                      <button
                                        disabled={p.total === 0}
                                        className="btn btn-sm btn-outline-primary rounded-pill px-2 py-0.5 fw-bold d-flex align-items-center gap-1"
                                        style={{ fontSize: '0.7rem' }}
                                        onClick={() => {
                                          setModalData({
                                            titulo: `Estudiantes en Parada: ${p.nombre_parada}`,
                                            subtitulo: `Ruta: ${ruta.nombre} (${ruta.escuelaNombre})`,
                                            escuela: ruta.escuela_codigo,
                                            estudiantes: p.estudiantes
                                          });
                                        }}
                                        title="Ver lista detallada de estudiantes"
                                      >
                                        <i className="bi bi-people-fill"></i>
                                        <span>Estudiantes</span>
                                      </button>

                                      <button
                                        disabled={p.total === 0}
                                        className="btn btn-sm btn-outline-success rounded-pill px-2 py-0.5 fw-bold d-flex align-items-center gap-1"
                                        style={{ fontSize: '0.7rem' }}
                                        onClick={() => copiarListaParada(p, ruta.nombre)}
                                        title="Copiar lista de esta parada para WhatsApp"
                                      >
                                        <i className="bi bi-whatsapp"></i>
                                        <span>Copiar</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Aviso si hay estudiantes de esta ruta con paradas que no coinciden con la lista oficial */}
                      {ruta.sinParadaExacta.length > 0 && (
                        <div className="mt-3 p-2.5 bg-warning-subtle border border-warning rounded-3 d-flex align-items-center justify-content-between gap-2">
                          <div className="d-flex align-items-center gap-2 small text-warning-emphasis">
                            <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                            <div>
                              <b>{ruta.sinParadaExacta.length} estudiantes</b> tienen seleccionada esta ruta pero con parada no normalizada o pendiente de homologación.
                            </div>
                          </div>
                          <button
                            className="btn btn-sm btn-warning rounded-pill px-2.5 py-1 fw-bold text-dark"
                            style={{ fontSize: '0.72rem' }}
                            onClick={() => {
                              setModalData({
                                titulo: `Estudiantes con Parada Pendiente en: ${ruta.nombre}`,
                                subtitulo: `Ruta: ${ruta.nombre} (${ruta.escuelaNombre})`,
                                escuela: ruta.escuela_codigo,
                                estudiantes: ruta.sinParadaExacta
                              });
                            }}
                          >
                            Ver casos pendientes
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          PESTAÑA 2: RANKING DE PARADAS CON MAYOR DEMANDA
      ══════════════════════════════════════════════════════════════════════════ */}
      {!loading && tabActiva === 'ranking' && (
        <div className="bg-white rounded-4 border shadow-xs p-3 p-md-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 pb-2 border-bottom">
            <div>
              <h5 className="fw-bold text-dark mb-0">Ranking de Paradas por Demanda de Pasajeros</h5>
              <p className="text-muted small mb-0">
                Puntos de mayor afluencia estudiantil para dimensionar la capacidad de las unidades y optimizar el tiempo de recorrido.
              </p>
            </div>
            <span className="badge bg-primary rounded-pill px-3 py-1.5 fw-bold" style={{ fontSize: '0.78rem' }}>
              Total: {rankingParadas.length} Paradas Activas
            </span>
          </div>

          {rankingParadas.length === 0 ? (
            <div className="p-4 text-center text-muted">No hay datos de paradas para mostrar.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                <thead className="table-light text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>
                  <tr>
                    <th style={{ width: '40px' }} className="text-center">Pos.</th>
                    <th>Parada Oficial</th>
                    <th>Ruta Perteneciente</th>
                    <th>Escuela</th>
                    <th style={{ width: '220px' }}>Volumen y Distribución</th>
                    <th className="text-center">Total Estudiantes</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingParadas.map((item, idx) => {
                    const maxVal = rankingParadas[0]?.total || 1;
                    const pctBar = Math.round((item.total / maxVal) * 100);
                    return (
                      <tr key={idx}>
                        <td className="text-center fw-black">
                          {idx === 0 && <span className="badge bg-warning text-dark rounded-circle p-1.5">🥇</span>}
                          {idx === 1 && <span className="badge bg-secondary text-white rounded-circle p-1.5">🥈</span>}
                          {idx === 2 && <span className="badge bg-bronze text-dark rounded-circle p-1.5" style={{ background: '#fed7aa' }}>🥉</span>}
                          {idx > 2 && <span className="text-muted">#{idx + 1}</span>}
                        </td>
                        <td>
                          <div className="fw-bold text-dark d-flex align-items-center gap-1.5">
                            <i className="bi bi-geo-alt-fill text-danger"></i>
                            <span>{item.nombre_parada}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border rounded-pill px-2 py-0.5">
                            {item.ruta_nombre}
                          </span>
                        </td>
                        <td>
                          <span 
                            className="badge rounded-pill fw-bold px-2 py-0.5"
                            style={{ 
                              fontSize: '0.68rem',
                              background: item.escuela_codigo === 'sb' ? '#ecfdf5' : '#f0f9ff',
                              color: item.escuela_codigo === 'sb' ? '#047857' : '#0369a1',
                              border: `1px solid ${item.escuela_codigo === 'sb' ? '#a7f3d0' : '#bae6fd'}`
                            }}
                          >
                            {item.escuela_codigo.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                              <div 
                                className="progress-bar bg-primary" 
                                role="progressbar" 
                                style={{ width: `${pctBar}%` }} 
                                aria-valuenow={pctBar} 
                                aria-valuemin={0} 
                                aria-valuemax={100}
                              ></div>
                            </div>
                            <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.68rem' }}>
                              <span>🎒 Regulares: <b>{item.regulares}</b></span>
                              <span>🌟 Nuevos: <b>{item.nuevos}</b></span>
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-primary rounded-pill px-2.5 py-1 fw-bold fs-6">
                            {item.total}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-1 fw-bold d-flex align-items-center gap-1 ms-auto"
                            style={{ fontSize: '0.72rem' }}
                            onClick={() => {
                              setModalData({
                                titulo: `Estudiantes en: ${item.nombre_parada}`,
                                subtitulo: `Ruta: ${item.ruta_nombre} (${item.escuelaNombre})`,
                                escuela: item.escuela_codigo,
                                estudiantes: item.estudiantes
                              });
                            }}
                          >
                            <i className="bi bi-people-fill"></i>
                            <span>Ver Estudiantes</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          PESTAÑA 3: PADRÓN GENERAL (TABLA COMPLETA CON BUSCADOR Y FILTROS)
      ══════════════════════════════════════════════════════════════════════════ */}
      {!loading && tabActiva === 'padron' && (
        <div className="bg-white rounded-4 border shadow-xs p-3 p-md-4">
          {/* Barra de Filtros del Padrón */}
          <div className="row g-2 align-items-center mb-3">
            {/* Buscador de texto */}
            <div className="col-12 col-md-4">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0"
                  placeholder="Buscar estudiante, cédula, rep..."
                  value={busqueda}
                  onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
                />
                {busqueda && (
                  <button className="btn btn-outline-secondary" onClick={() => setBusqueda('')}>
                    <i className="bi bi-x"></i>
                  </button>
                )}
              </div>
            </div>

            {/* Filtro por Tipo */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={filtroTipo}
                onChange={(e: any) => { setFiltroTipo(e.target.value); setPaginaActual(1); }}
              >
                <option value="todos">Todos los Tipos</option>
                <option value="regular">Regulares</option>
                <option value="nuevo_ingreso">Nuevos Ingresos</option>
              </select>
            </div>

            {/* Filtro por Ruta */}
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={filtroRuta}
                onChange={(e) => { setFiltroRuta(e.target.value); setPaginaActual(1); }}
              >
                <option value="todas">Todas las Rutas</option>
                {opcionesRutas.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Grado */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={filtroGrado}
                onChange={(e) => { setFiltroGrado(e.target.value); setPaginaActual(1); }}
              >
                <option value="todos">Todos los Grados</option>
                {opcionesGrados.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Filas por página */}
            <div className="col-6 col-md-1 text-end">
              <select
                className="form-select form-select-sm"
                value={filasPorPagina}
                onChange={(e) => { setFilasPorPagina(Number(e.target.value)); setPaginaActual(1); }}
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Contador de Resultados */}
          <div className="d-flex align-items-center justify-content-between text-muted small mb-2">
            <span>
              Mostrando <b>{padronFiltrado.length}</b> estudiantes encontrados
            </span>
            <span>
              Página <b>{paginaActual}</b> de <b>{totalPaginas}</b>
            </span>
          </div>

          {/* Tabla de Estudiantes */}
          {padronPaginado.length === 0 ? (
            <div className="p-5 text-center text-muted">
              <i className="bi bi-search fs-2"></i>
              <p className="mt-2 mb-0">No se encontraron estudiantes con los filtros especificados.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                <thead className="table-light text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>
                  <tr>
                    <th style={{ width: '40px' }} className="text-center">#</th>
                    <th>Estudiante</th>
                    <th>Tipo</th>
                    <th>Sede</th>
                    <th>Grado / Año</th>
                    <th>Ruta Asignada</th>
                    <th>Parada de Abordaje</th>
                    <th>Representante & Contacto</th>
                  </tr>
                </thead>
                <tbody>
                  {padronPaginado.map((e, idx) => {
                    const rowNum = (paginaActual - 1) * filasPorPagina + idx + 1;
                    const cleanPhone = (e.representanteTelefono || '').replace(/\D/g, '');
                    const waLink = cleanPhone ? (cleanPhone.startsWith('58') ? `https://wa.me/${cleanPhone}` : `https://wa.me/58${cleanPhone.replace(/^0+/, '')}`) : null;

                    return (
                      <tr key={e.id}>
                        <td className="text-center text-muted fw-bold">{rowNum}</td>
                        <td>
                          <div>
                            <div className="fw-bold text-dark">{e.nombreCompleto}</div>
                            <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                              C.I: <b>{e.cedula}</b>
                            </div>
                          </div>
                        </td>
                        <td>
                          {e.tipoEstudiante === 'regular' ? (
                            <span className="badge rounded-pill bg-success-subtle text-success border border-success fw-bold px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                              <i className="bi bi-backpack me-1"></i>Regular
                            </span>
                          ) : (
                            <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis border border-warning fw-bold px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                              <i className="bi bi-star-fill me-1"></i>Nuevo Ingreso
                            </span>
                          )}
                        </td>
                        <td>
                          <span 
                            className="badge rounded-pill fw-bold px-2 py-0.5"
                            style={{ 
                              fontSize: '0.68rem',
                              background: e.codigo_escuela === 'sb' ? '#ecfdf5' : '#f0f9ff',
                              color: e.codigo_escuela === 'sb' ? '#047857' : '#0369a1',
                              border: `1px solid ${e.codigo_escuela === 'sb' ? '#a7f3d0' : '#bae6fd'}`
                            }}
                          >
                            {e.codigo_escuela.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border rounded-pill px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                            {e.grado}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <span className="fw-semibold text-dark">{e.rutaNombreLimpio}</span>
                            {!e.coincideRutaOficial && (
                              <i className="bi bi-exclamation-circle text-warning" title="Ruta no coincide exactamente con el catálogo oficial"></i>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <span className="fw-semibold text-dark">{e.paradaNombreLimpio}</span>
                            {!e.coincideParadaOficial && (
                              <i className="bi bi-exclamation-circle text-warning" title="Parada no coincide exactamente con el catálogo oficial"></i>
                            )}
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="text-dark small fw-semibold">{e.representanteNombre}</div>
                            {e.representanteTelefono ? (
                              <div className="d-flex align-items-center gap-1.5 mt-0.5">
                                <span className="text-muted" style={{ fontSize: '0.7rem' }}>{e.representanteTelefono}</span>
                                {waLink && (
                                  <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-xs btn-outline-success rounded-circle p-0 d-inline-flex align-items-center justify-content-center"
                                    style={{ width: '20px', height: '20px' }}
                                    title="Escribir por WhatsApp"
                                  >
                                    <i className="bi bi-whatsapp" style={{ fontSize: '0.65rem' }}></i>
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted small" style={{ fontSize: '0.68rem' }}>Sin teléfono</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginador */}
          {totalPaginas > 1 && (
            <div className="d-flex align-items-center justify-content-between mt-3 pt-2 border-top">
              <button
                className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 fw-bold"
                disabled={paginaActual === 1}
                onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
              >
                <i className="bi bi-chevron-left me-1"></i>Anterior
              </button>
              <div className="d-flex align-items-center gap-1">
                {Array.from({ length: Math.min(totalPaginas, 7) }, (_, i) => {
                  let pNum = i + 1;
                  if (totalPaginas > 7 && paginaActual > 4) {
                    pNum = paginaActual - 3 + i;
                    if (pNum > totalPaginas) return null;
                  }
                  return (
                    <button
                      key={pNum}
                      className={`btn btn-sm rounded-circle fw-bold ${paginaActual === pNum ? 'btn-primary text-white' : 'btn-light text-muted'}`}
                      style={{ width: '32px', height: '32px', padding: 0 }}
                      onClick={() => setPaginaActual(pNum)}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>
              <button
                className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 fw-bold"
                disabled={paginaActual === totalPaginas}
                onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
              >
                Siguiente<i className="bi bi-chevron-right ms-1"></i>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          PESTAÑA 4: ESTUDIANTES PENDIENTES / POR ASIGNAR
      ══════════════════════════════════════════════════════════════════════════ */}
      {!loading && tabActiva === 'pendientes' && (
        <div className="bg-white rounded-4 border shadow-xs p-3 p-md-4">
          <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
            <div>
              <h5 className="fw-bold text-danger mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>Estudiantes Pendientes de Asignación / Casos Especiales</span>
              </h5>
              <p className="text-muted small mb-0">
                Estudiantes que solicitaron transporte pero su ruta o parada no coincide con el catálogo oficial o requiere homologación.
              </p>
            </div>
            <span className="badge bg-danger rounded-pill px-3 py-1.5 fw-bold">
              {estudiantesPendientes.length} Casos
            </span>
          </div>

          {estudiantesPendientes.length === 0 ? (
            <div className="p-4 text-center text-success">
              <i className="bi bi-check-circle-fill fs-2"></i>
              <p className="mt-2 mb-0 fw-bold">¡Excelente! Todos los estudiantes tienen ruta y parada oficial asignada.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                <thead className="table-light text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>
                  <tr>
                    <th>Estudiante</th>
                    <th>Escuela</th>
                    <th>Grado</th>
                    <th>Ruta Registrada</th>
                    <th>Parada Registrada</th>
                    <th>Representante & Teléfono</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {estudiantesPendientes.map(e => (
                    <tr key={e.id}>
                      <td>
                        <div className="fw-bold text-dark">{e.nombreCompleto}</div>
                        <div className="text-muted small">C.I: {e.cedula}</div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border rounded-pill">
                          {e.codigo_escuela.toUpperCase()}
                        </span>
                      </td>
                      <td>{e.grado}</td>
                      <td>
                        <span className={`badge rounded-pill ${e.coincideRutaOficial ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning-emphasis'}`}>
                          {e.rutaNombreLimpio}
                        </span>
                      </td>
                      <td>
                        <span className={`badge rounded-pill ${e.coincideParadaOficial ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning-emphasis'}`}>
                          {e.paradaNombreLimpio}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{e.representanteNombre}</div>
                        <div className="text-muted small">{e.representanteTelefono || 'Sin teléfono'}</div>
                      </td>
                      <td>
                        <span className="badge bg-danger-subtle text-danger rounded-pill">
                          Pendiente Revisión
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL DETALLADO DE ESTUDIANTES DE UNA PARADA O RUTA
      ══════════════════════════════════════════════════════════════════════════ */}
      {modalData && (
        <div 
          className="modal fade show d-block" 
          tabIndex={-1} 
          style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1055 }}
          onClick={() => { setModalData(null); setFiltroModal(''); }}
        >
          <div 
            className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              {/* Header del Modal */}
              <div className="modal-header bg-primary text-white p-3">
                <div>
                  <h5 className="modal-title fw-bold mb-0 d-flex align-items-center gap-2" style={{ fontSize: '1.1rem' }}>
                    <i className="bi bi-people-fill"></i>
                    <span>{modalData.titulo}</span>
                  </h5>
                  <div className="text-white-50 small mt-0.5" style={{ fontSize: '0.78rem' }}>
                    {modalData.subtitulo}
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => { setModalData(null); setFiltroModal(''); }}
                ></button>
              </div>

              {/* Barra de Filtro en Modal */}
              <div className="p-3 bg-light border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div className="input-group input-group-sm" style={{ maxWidth: '320px' }}>
                  <span className="input-group-text bg-white border-end-0">
                    <i className="bi bi-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control bg-white border-start-0"
                    placeholder="Filtrar por nombre, cédula..."
                    value={filtroModal}
                    onChange={(e) => setFiltroModal(e.target.value)}
                  />
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary rounded-pill px-2.5 py-1 fw-bold">
                    Total: {modalData.estudiantes.length}
                  </span>
                  <span className="badge bg-success-subtle text-success rounded-pill px-2 py-1 fw-bold">
                    Regulares: {modalData.estudiantes.filter(e => e.tipoEstudiante === 'regular').length}
                  </span>
                  <span className="badge bg-warning-subtle text-warning-emphasis rounded-pill px-2 py-1 fw-bold">
                    Nuevos: {modalData.estudiantes.filter(e => e.tipoEstudiante === 'nuevo_ingreso').length}
                  </span>
                </div>
              </div>

              {/* Lista de Estudiantes en Modal */}
              <div className="modal-body p-0">
                {(() => {
                  const q = normalizar(filtroModal);
                  const filtered = modalData.estudiantes.filter(e => 
                    normalizar(e.nombreCompleto).includes(q) ||
                    e.cedula.includes(q) ||
                    normalizar(e.representanteNombre).includes(q) ||
                    e.representanteTelefono.includes(q)
                  );

                  if (filtered.length === 0) {
                    return (
                      <div className="p-4 text-center text-muted">
                        No se encontraron estudiantes que coincidan con la búsqueda.
                      </div>
                    );
                  }

                  return (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                        <thead className="table-light text-muted text-uppercase" style={{ fontSize: '0.68rem' }}>
                          <tr>
                            <th style={{ width: '40px' }} className="text-center">#</th>
                            <th>Estudiante</th>
                            <th>Cédula</th>
                            <th>Grado</th>
                            <th>Tipo</th>
                            <th>Representante & Contacto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((e, i) => {
                            const cleanPhone = (e.representanteTelefono || '').replace(/\D/g, '');
                            const waLink = cleanPhone ? (cleanPhone.startsWith('58') ? `https://wa.me/${cleanPhone}` : `https://wa.me/58${cleanPhone.replace(/^0+/, '')}`) : null;

                            return (
                              <tr key={e.id}>
                                <td className="text-center text-muted fw-bold">{i + 1}</td>
                                <td>
                                  <div className="fw-bold text-dark">{e.nombreCompleto}</div>
                                  <div className="text-muted small" style={{ fontSize: '0.7rem' }}>
                                    Parada: {e.paradaNombreLimpio}
                                  </div>
                                </td>
                                <td className="fw-semibold text-secondary">{e.cedula}</td>
                                <td>
                                  <span className="badge bg-light text-dark border rounded-pill">
                                    {e.grado}
                                  </span>
                                </td>
                                <td>
                                  {e.tipoEstudiante === 'regular' ? (
                                    <span className="badge rounded-pill bg-success-subtle text-success border border-success fw-bold px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                                      Regular
                                    </span>
                                  ) : (
                                    <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis border border-warning fw-bold px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                                      Nuevo Ingreso
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <div>
                                    <div className="text-dark small fw-semibold">{e.representanteNombre}</div>
                                    {e.representanteTelefono ? (
                                      <div className="d-flex align-items-center gap-1.5 mt-0.5">
                                        <span className="text-muted small">{e.representanteTelefono}</span>
                                        {waLink && (
                                          <a
                                            href={waLink}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="btn btn-xs btn-outline-success rounded-circle p-0 d-inline-flex align-items-center justify-content-center"
                                            style={{ width: '20px', height: '20px' }}
                                            title="Escribir por WhatsApp"
                                          >
                                            <i className="bi bi-whatsapp" style={{ fontSize: '0.65rem' }}></i>
                                          </a>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-muted small" style={{ fontSize: '0.68rem' }}>Sin teléfono</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Footer del Modal */}
              <div className="modal-footer bg-light p-2.5 d-flex justify-content-between align-items-center">
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm rounded-pill px-3 py-1 fw-bold d-flex align-items-center gap-1.5"
                  onClick={() => {
                    let msg = `🚍 *${modalData.titulo}*\n`;
                    msg += `ℹ️ ${modalData.subtitulo}\n`;
                    msg += `👥 *Total:* ${modalData.estudiantes.length} Estudiantes\n`;
                    msg += `─────────────────────────\n`;
                    modalData.estudiantes.forEach((e, i) => {
                      msg += `${i + 1}. ${e.nombreCompleto} (${e.cedula}) - Grado: ${e.grado} [${e.tipoEstudiante === 'regular' ? 'Regular' : 'Nuevo'}] - Rep: ${e.representanteNombre} (${e.representanteTelefono || 'Sin tlf'})\n`;
                    });
                    navigator.clipboard.writeText(msg).then(() => {
                      if (Swal) Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Lista copiada para WhatsApp', showConfirmButton: false, timer: 2000 });
                    });
                  }}
                >
                  <i className="bi bi-whatsapp"></i>
                  <span>Copiar Listado para WhatsApp</span>
                </button>

                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm rounded-pill px-3 py-1 fw-bold"
                  onClick={() => { setModalData(null); setFiltroModal(''); }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
