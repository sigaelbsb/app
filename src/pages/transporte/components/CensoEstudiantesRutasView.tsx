import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';

interface CensoEstudiantesRutasViewProps {
  onBack: () => void;
  initialEscuela: 'sb' | 'lb';
  user: any;
  canManageRutas: boolean;
  isSuperAdmin: boolean;
}

export type CategoriaMatricula = 
  | 'regular_actualizado'      // Regular que completó actualización de datos (ficha_completada)
  | 'regular_en_proceso'        // Regular que inició actualización pero no ha finalizado
  | 'regular_sin_iniciar'       // Regular que aún no ha iniciado la actualización
  | 'nuevo_ingreso_formalizado';// Nuevo ingreso formalizado / admitido

export interface EstudianteCenso {
  id: string;
  origenTabla: 'vinculacion' | 'solicitud';
  categoriaMatricula: CategoriaMatricula;
  codigo_escuela: 'sb' | 'lb';
  escuelaNombre: string;
  cedula: string;
  cedulaNormalizada: string;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  grado: string;
  requiereTransporte: boolean | null; // true: Sí, false: No, null: Pendiente por definir
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
  estadoRegistro: string;
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
  const [tabActiva, setTabActiva] = useState<'jerarquia' | 'ranking' | 'padron' | 'regulares_pendientes' | 'por_asignar'>('jerarquia');

  // Estados de datos
  const [loading, setLoading] = useState(true);
  const [estudiantes, setEstudiantes] = useState<EstudianteCenso[]>([]);
  const [rutasDB, setRutasDB] = useState<any[]>([]);
  const [paradasDB, setParadasDB] = useState<any[]>([]);
  
  // Acordeones abiertos de rutas en vista jerárquica
  const [rutasExpandidas, setRutasExpandidas] = useState<Record<string, boolean>>({});

  // Buscador y filtros de la vista Padrón General
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [filtroTransporte, setFiltroTransporte] = useState<'todos' | 'si' | 'no' | 'pendiente'>('todos');
  const [filtroRuta, setFiltroRuta] = useState<string>('todas');
  const [filtroGrado, setFiltroGrado] = useState<string>('todos');
  const [paginaActual, setPaginaActual] = useState(1);
  const [filasPorPagina, setFilasPorPagina] = useState(25);

  // Filtro de la pestaña Regulares Pendientes por Actualizar
  const [subfiltroPendientes, setSubfiltroPendientes] = useState<'todos' | 'en_proceso' | 'sin_iniciar'>('todos');

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

  // ── Carga Paginada Dinámica para no limitar a 1,000 registros ───────────────
  const fetchAllFromTable = async (tableName: string, selectFields = '*') => {
    let allRows: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from(tableName)
        .select(selectFields)
        .range(from, from + step - 1);

      if (error) {
        console.error(`Error cargando ${tableName} rango ${from}-${from + step - 1}:`, error);
        break;
      }

      if (data && data.length > 0) {
        allRows = allRows.concat(data);
        if (data.length < step) {
          hasMore = false;
        } else {
          from += step;
        }
      } else {
        hasMore = false;
      }
    }

    return allRows;
  };

  // ── Cargar Datos Completos desde Supabase ────────────────────────────────────
  const cargarCenso = async () => {
    setLoading(true);
    try {
      // 1. Cargar Catálogo Oficial de Rutas y Paradas
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

      // 2. Cargar la Matrícula Completa de Vinculaciones (Regulares y Nuevos Ingresos vinculados)
      const vincData = await fetchAllFromTable('estudiantes_vinculaciones', '*');

      // 3. Cargar Solicitudes de Admisión
      const solData = await fetchAllFromTable(
        'solicitud_cupos',
        'id, codigo_escuela, codigo_unico, estudiante_cedula, estudiante_nombres, estudiante_apellidos, grado_solicitado, estado, requiere_transporte, ruta_transporte, representante_nombres, representante_apellidos, representante_cedula, representante_telefono, representante_telefono2, direccion_habitacion'
      );

      const listaConsolidada: EstudianteCenso[] = [];
      const cedulasEnVinculacion = new Set<string>();

      // ── A) Procesar todas las vinculaciones (Matrícula Regular + Nuevos Ingresos vinculados)
      (vincData || []).forEach(v => {
        const d = v.datos_actualizados || {};
        const cedRaw = (v.cedula_estudiante || d.estudiante_cedula || '').trim();
        const cedNorm = cedRaw.replace(/\D/g, '');
        if (cedNorm) cedulasEnVinculacion.add(cedNorm);

        const esc = ((v.codigo_escuela || d.codigo_escuela || 'sb') as string).toLowerCase() as 'sb' | 'lb';
        const hasDatos = Object.keys(d).length > 0;
        const esNuevoIngreso = d.origen_admision === 'nuevo_ingreso';

        // Clasificar con precisión en la matrícula escolar real
        let categoria: CategoriaMatricula;
        let estadoLabel = '';

        if (esNuevoIngreso) {
          categoria = 'nuevo_ingreso_formalizado';
          estadoLabel = 'Nuevo Ingreso Formalizado';
        } else if (!hasDatos) {
          categoria = 'regular_sin_iniciar';
          estadoLabel = 'Sin Iniciar Actualización';
        } else if (d.ficha_completada === true) {
          categoria = 'regular_actualizado';
          estadoLabel = 'Actualizado (Ficha Completada)';
        } else {
          categoria = 'regular_en_proceso';
          estadoLabel = 'En Proceso de Actualización';
        }

        // Transporte
        let reqTrans: boolean | null = null;
        if (d.requiere_transporte === true || d.requiere_transporte === 'true' || d.requiere_transporte === 'si') {
          reqTrans = true;
        } else if (d.requiere_transporte === false || d.requiere_transporte === 'false' || d.requiere_transporte === 'no') {
          reqTrans = false;
        } else {
          reqTrans = null; // Pendiente por definir
        }

        const rawRuta = (d.ruta_transporte || '').trim();
        const rawParada = (d.parada_transporte || '').trim();

        let rutaLimpia = rawRuta;
        let paradaLimpia = rawParada;

        if (rawRuta.includes(' - Parada: ')) {
          const parts = rawRuta.split(' - Parada: ');
          rutaLimpia = parts[0]?.trim() || '';
          if (!paradaLimpia) paradaLimpia = parts[1]?.trim() || '';
        }

        // Coincidencia con catálogo oficial
        const keyRuta = `${esc}_${normalizar(rutaLimpia)}`;
        const rutaMatch = mapaRutasPorNorm[keyRuta] || todasRutas.find(r => r.escuela_codigo === esc && normalizar(r.nombre).includes(normalizar(rutaLimpia)));

        const keyParada = `${esc}_${normalizar(paradaLimpia)}`;
        const paradaMatch = mapaParadasPorNorm[keyParada] || todasParadas.find(p => p.escuela_codigo === esc && normalizar(p.nombre_parada).includes(normalizar(paradaLimpia)));

        listaConsolidada.push({
          id: `vinc_${v.id}`,
          origenTabla: 'vinculacion',
          categoriaMatricula: categoria,
          codigo_escuela: esc,
          escuelaNombre: esc === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar',
          cedula: cedRaw || 'Sin Cédula',
          cedulaNormalizada: cedNorm,
          nombres: (v.nombres_estudiante || d.estudiante_nombres || '').trim(),
          apellidos: (v.apellidos_estudiante || d.estudiante_apellidos || '').trim(),
          nombreCompleto: `${v.nombres_estudiante || d.estudiante_nombres || ''} ${v.apellidos_estudiante || d.estudiante_apellidos || ''}`.trim() || 'Estudiante',
          grado: (v.grado_actual || d.grado_actual || d.grado_solicitado || 'Por Asignar').trim(),
          requiereTransporte: reqTrans,
          rutaNombreRaw: rawRuta,
          rutaNombreLimpio: rutaMatch ? rutaMatch.nombre : (rutaLimpia || (reqTrans ? 'Sin Ruta Asignada' : 'No Requiere')),
          paradaNombreRaw: rawParada,
          paradaNombreLimpio: paradaMatch ? paradaMatch.nombre_parada : (paradaLimpia || (reqTrans ? 'Sin Parada Asignada' : 'No Requiere')),
          rutaIdOficial: rutaMatch?.id,
          paradaIdOficial: paradaMatch?.id,
          coincideRutaOficial: !!rutaMatch,
          coincideParadaOficial: !!paradaMatch,
          representanteNombre: `${v.nombres_representante || d.representante_nombres || ''} ${v.apellidos_representante || d.representante_apellidos || ''}`.trim() || 'Representante',
          representanteCedula: (v.cedula_representante || d.representante_cedula || '').trim(),
          representanteTelefono: (d.representante_telefono || d.representante_telefono_movil || v.telefono_representante || '').trim(),
          estadoRegistro: estadoLabel,
          direccion: (d.direccion_habitacion || '').trim()
        });
      });

      // ── B) Procesar Nuevos Ingresos Formalizados desde solicitud_cupos (No Duplicados)
      const estadosValidosFormalizado = ['formalizado', 'formalizada', 'inscrito', 'inscrita', 'aprobado', 'admitido'];
      (solData || []).forEach(s => {
        const estadoNorm = (s.estado || '').toLowerCase().trim();
        if (!estadosValidosFormalizado.includes(estadoNorm)) return;

        const cedRaw = (s.estudiante_cedula || '').trim();
        const cedNorm = cedRaw.replace(/\D/g, '');

        // Evitar duplicados si ya está presente en vinculaciones
        if (cedNorm && cedulasEnVinculacion.has(cedNorm)) {
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

        const reqTrans = s.requiere_transporte === true || s.requiere_transporte === 'true';

        listaConsolidada.push({
          id: `sol_${s.id}`,
          origenTabla: 'solicitud',
          categoriaMatricula: 'nuevo_ingreso_formalizado',
          codigo_escuela: esc,
          escuelaNombre: esc === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar',
          cedula: cedRaw || 'Sin Cédula',
          cedulaNormalizada: cedNorm,
          nombres: (s.estudiante_nombres || '').trim(),
          apellidos: (s.estudiante_apellidos || '').trim(),
          nombreCompleto: `${s.estudiante_nombres || ''} ${s.estudiante_apellidos || ''}`.trim() || 'Aspirante',
          grado: (s.grado_solicitado || 'Nuevo Ingreso').trim(),
          requiereTransporte: reqTrans,
          rutaNombreRaw: rawRuta,
          rutaNombreLimpio: rutaMatch ? rutaMatch.nombre : (rutaLimpia || (reqTrans ? 'Sin Ruta Asignada' : 'No Requiere')),
          paradaNombreRaw: paradaLimpia,
          paradaNombreLimpio: paradaMatch ? paradaMatch.nombre_parada : (paradaLimpia || (reqTrans ? 'Sin Parada Asignada' : 'No Requiere')),
          rutaIdOficial: rutaMatch?.id,
          paradaIdOficial: paradaMatch?.id,
          coincideRutaOficial: !!rutaMatch,
          coincideParadaOficial: !!paradaMatch,
          representanteNombre: `${s.representante_nombres || ''} ${s.representante_apellidos || ''}`.trim() || 'Representante',
          representanteCedula: (s.representante_cedula || '').trim(),
          representanteTelefono: (s.representante_telefono || s.representante_telefono2 || '').trim(),
          estadoRegistro: 'Nuevo Ingreso Formalizado (Admisión)',
          direccion: (s.direccion_habitacion || '').trim()
        });
      });

      setEstudiantes(listaConsolidada);

      // Expandir inicialmente todas las rutas
      const expInit: Record<string, boolean> = {};
      todasRutas.forEach(r => { expInit[r.id] = true; });
      setRutasExpandidas(expInit);

    } catch (err: any) {
      console.error('Error cargando censo y matrícula escolar:', err);
      if (Swal) Swal.fire('Error', 'No se pudo cargar el censo y matrícula escolar.', 'error');
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

  // ── Métricas y Telemetría del Censo Escolar Completo ────────────────────────
  const metrics = useMemo(() => {
    const matriculaTotal = estudiantesFiltradosEscuela.length;

    // Desglose de Matrícula Real
    const regularesActualizados = estudiantesFiltradosEscuela.filter(e => e.categoriaMatricula === 'regular_actualizado').length;
    const nuevosFormalizados = estudiantesFiltradosEscuela.filter(e => e.categoriaMatricula === 'nuevo_ingreso_formalizado').length;
    const regularesEnProceso = estudiantesFiltradosEscuela.filter(e => e.categoriaMatricula === 'regular_en_proceso').length;
    const regularesSinIniciar = estudiantesFiltradosEscuela.filter(e => e.categoriaMatricula === 'regular_sin_iniciar').length;
    const totalRegulares = regularesActualizados + regularesEnProceso + regularesSinIniciar;

    // Desglose de Demanda de Transporte
    const transporteConfirmado = estudiantesFiltradosEscuela.filter(e => e.requiereTransporte === true).length;
    const transporteNoRequiere = estudiantesFiltradosEscuela.filter(e => e.requiereTransporte === false).length;
    const transportePendienteDefinir = estudiantesFiltradosEscuela.filter(e => e.requiereTransporte === null).length;

    // Cobertura por Escuelas
    const countSB = estudiantes.filter(e => e.codigo_escuela === 'sb').length;
    const countLB = estudiantes.filter(e => e.codigo_escuela === 'lb').length;

    const sbTrans = estudiantes.filter(e => e.codigo_escuela === 'sb' && e.requiereTransporte === true).length;
    const lbTrans = estudiantes.filter(e => e.codigo_escuela === 'lb' && e.requiereTransporte === true).length;

    // Rutas y Paradas con Demanda
    const estConTransporte = estudiantesFiltradosEscuela.filter(e => e.requiereTransporte === true);
    const rutasConDemandaSet = new Set(
      estConTransporte.filter(e => e.rutaNombreLimpio && e.rutaNombreLimpio !== 'Sin Ruta Asignada').map(e => e.rutaNombreLimpio)
    );
    const paradasConDemandaSet = new Set(
      estConTransporte.filter(e => e.paradaNombreLimpio && e.paradaNombreLimpio !== 'Sin Parada Asignada').map(e => `${e.rutaNombreLimpio}__${e.paradaNombreLimpio}`)
    );

    const pendientesAsignar = estConTransporte.filter(e => !e.coincideRutaOficial || !e.coincideParadaOficial).length;

    return {
      matriculaTotal,
      regularesActualizados,
      regularesActualizadosPct: matriculaTotal > 0 ? Math.round((regularesActualizados / matriculaTotal) * 100) : 0,
      nuevosFormalizados,
      nuevosFormalizadosPct: matriculaTotal > 0 ? Math.round((nuevosFormalizados / matriculaTotal) * 100) : 0,
      regularesEnProceso,
      regularesEnProcesoPct: matriculaTotal > 0 ? Math.round((regularesEnProceso / matriculaTotal) * 100) : 0,
      regularesSinIniciar,
      regularesSinIniciarPct: matriculaTotal > 0 ? Math.round((regularesSinIniciar / matriculaTotal) * 100) : 0,
      totalRegulares,
      transporteConfirmado,
      transportePct: matriculaTotal > 0 ? Math.round((transporteConfirmado / matriculaTotal) * 100) : 0,
      transporteNoRequiere,
      transportePendienteDefinir,
      countSB,
      countLB,
      sbTrans,
      lbTrans,
      rutasConDemanda: rutasConDemandaSet.size,
      paradasConDemanda: paradasConDemandaSet.size,
      pendientesAsignar,
      totalRegularesPorActualizar: regularesEnProceso + regularesSinIniciar
    };
  }, [estudiantesFiltradosEscuela, estudiantes]);

  // ── Agrupación Jerárquica: Rutas -> Paradas -> Estudiantes ─────────────────
  const rutasJerarquia = useMemo(() => {
    // Solo estudiantes que solicitaron transporte
    const estsConTransporte = estudiantesFiltradosEscuela.filter(e => e.requiereTransporte === true);
    const rutasBase = rutasDB.filter(r => filtroEscuela === 'todas' || r.escuela_codigo === filtroEscuela);

    return rutasBase.map(ruta => {
      const paradasIds = Array.isArray(ruta.paradas_json)
        ? ruta.paradas_json
        : (typeof ruta.paradas_json === 'string' ? JSON.parse(ruta.paradas_json || '[]') : []);

      const paradasDeRuta = paradasDB.filter(p => paradasIds.includes(p.id));

      const estsDeRuta = estsConTransporte.filter(e => {
        if (e.rutaIdOficial && e.rutaIdOficial === ruta.id) return true;
        return normalizar(e.rutaNombreLimpio) === normalizar(ruta.nombre) && e.codigo_escuela === ruta.escuela_codigo;
      });

      const paradasConConteo = paradasDeRuta.map((parada, idx) => {
        const estsEnParada = estsDeRuta.filter(e => {
          if (e.paradaIdOficial && e.paradaIdOficial === parada.id) return true;
          return normalizar(e.paradaNombreLimpio) === normalizar(parada.nombre_parada);
        });

        const actualizados = estsEnParada.filter(e => e.categoriaMatricula === 'regular_actualizado').length;
        const enProceso = estsEnParada.filter(e => e.categoriaMatricula === 'regular_en_proceso').length;
        const nuevos = estsEnParada.filter(e => e.categoriaMatricula === 'nuevo_ingreso_formalizado').length;

        return {
          id: parada.id,
          orden: idx + 1,
          nombre_parada: parada.nombre_parada,
          descripcion: parada.descripcion,
          total: estsEnParada.length,
          actualizados,
          enProceso,
          nuevos,
          estudiantes: estsEnParada
        };
      });

      const paradasNombresNorm = new Set(paradasDeRuta.map(p => normalizar(p.nombre_parada)));
      const estsSinParadaExacta = estsDeRuta.filter(e => !paradasNombresNorm.has(normalizar(e.paradaNombreLimpio)));

      const totalActualizados = estsDeRuta.filter(e => e.categoriaMatricula === 'regular_actualizado').length;
      const totalEnProceso = estsDeRuta.filter(e => e.categoriaMatricula === 'regular_en_proceso').length;
      const totalNuevos = estsDeRuta.filter(e => e.categoriaMatricula === 'nuevo_ingreso_formalizado').length;

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
        totalActualizados,
        totalEnProceso,
        totalNuevos,
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
      actualizados: number;
      enProceso: number;
      nuevos: number;
      estudiantes: EstudianteCenso[];
    }> = {};

    estudiantesFiltradosEscuela.filter(e => e.requiereTransporte === true).forEach(e => {
      if (!e.paradaNombreLimpio || e.paradaNombreLimpio === 'Sin Parada Asignada') return;
      const key = `${e.codigo_escuela}__${e.rutaNombreLimpio}__${e.paradaNombreLimpio}`;
      if (!mapaConteo[key]) {
        mapaConteo[key] = {
          nombre_parada: e.paradaNombreLimpio,
          ruta_nombre: e.rutaNombreLimpio,
          escuela_codigo: e.codigo_escuela,
          escuelaNombre: e.escuelaNombre,
          total: 0,
          actualizados: 0,
          enProceso: 0,
          nuevos: 0,
          estudiantes: []
        };
      }
      mapaConteo[key].total++;
      if (e.categoriaMatricula === 'regular_actualizado') mapaConteo[key].actualizados++;
      else if (e.categoriaMatricula === 'regular_en_proceso') mapaConteo[key].enProceso++;
      else if (e.categoriaMatricula === 'nuevo_ingreso_formalizado') mapaConteo[key].nuevos++;
      mapaConteo[key].estudiantes.push(e);
    });

    return Object.values(mapaConteo).sort((a, b) => b.total - a.total);
  }, [estudiantesFiltradosEscuela]);

  // ── Padrón General Filtrado y Paginado ───────────────────────────────────────
  const padronFiltrado = useMemo(() => {
    let result = estudiantesFiltradosEscuela;

    if (filtroCategoria !== 'todos') {
      result = result.filter(e => e.categoriaMatricula === filtroCategoria);
    }

    if (filtroTransporte === 'si') {
      result = result.filter(e => e.requiereTransporte === true);
    } else if (filtroTransporte === 'no') {
      result = result.filter(e => e.requiereTransporte === false);
    } else if (filtroTransporte === 'pendiente') {
      result = result.filter(e => e.requiereTransporte === null);
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
  }, [estudiantesFiltradosEscuela, filtroCategoria, filtroTransporte, filtroRuta, filtroGrado, busqueda]);

  const totalPaginas = Math.ceil(padronFiltrado.length / filasPorPagina) || 1;
  const padronPaginado = useMemo(() => {
    const inicio = (paginaActual - 1) * filasPorPagina;
    return padronFiltrado.slice(inicio, inicio + filasPorPagina);
  }, [padronFiltrado, paginaActual, filasPorPagina]);

  // ── Regulares Pendientes por Actualizar Datos (En Proceso / Sin Iniciar) ────
  const listaRegularesPendientes = useMemo(() => {
    let list = estudiantesFiltradosEscuela.filter(e => 
      e.categoriaMatricula === 'regular_en_proceso' || e.categoriaMatricula === 'regular_sin_iniciar'
    );

    if (subfiltroPendientes === 'en_proceso') {
      list = list.filter(e => e.categoriaMatricula === 'regular_en_proceso');
    } else if (subfiltroPendientes === 'sin_iniciar') {
      list = list.filter(e => e.categoriaMatricula === 'regular_sin_iniciar');
    }

    return list;
  }, [estudiantesFiltradosEscuela, subfiltroPendientes]);

  // ── Estudiantes Pendientes de Asignación / Sin Parada Específica ────────────
  const estudiantesPorAsignar = useMemo(() => {
    return estudiantesFiltradosEscuela.filter(e => 
      e.requiereTransporte === true && (
        !e.coincideRutaOficial || 
        !e.coincideParadaOficial || 
        e.rutaNombreLimpio === 'Sin Ruta Asignada' ||
        e.paradaNombreLimpio === 'Sin Parada Asignada'
      )
    );
  }, [estudiantesFiltradosEscuela]);

  // ── Opciones únicas de Rutas y Grados ───────────────────────────────────────
  const opcionesRutas = useMemo(() => {
    const setR = new Set(
      estudiantesFiltradosEscuela
        .filter(e => e.requiereTransporte === true && e.rutaNombreLimpio && e.rutaNombreLimpio !== 'Sin Ruta Asignada')
        .map(e => e.rutaNombreLimpio)
    );
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

  // ── Exportar Censo y Matrícula a Excel (CSV con UTF-8 BOM) ──────────────────
  const exportarCSV = () => {
    if (estudiantesFiltradosEscuela.length === 0) {
      if (Swal) Swal.fire('Atención', 'No hay estudiantes para exportar.', 'info');
      return;
    }

    const headers = [
      '#',
      'Escuela',
      'Categoría de Matrícula',
      'Cédula Estudiante',
      'Nombres Estudiante',
      'Apellidos Estudiante',
      'Grado / Nivel',
      '¿Requiere Transporte?',
      'Ruta Asignada',
      'Ruta Oficial Coincide',
      'Parada Asignada',
      'Parada Oficial Coincide',
      'Representante',
      'Cédula Representante',
      'Teléfono Representante',
      'Estatus de Ficha / Registro',
      'Dirección'
    ];

    const rows = estudiantesFiltradosEscuela.map((e, idx) => {
      let catText = 'Regular';
      if (e.categoriaMatricula === 'regular_actualizado') catText = 'Regular Actualizado';
      else if (e.categoriaMatricula === 'nuevo_ingreso_formalizado') catText = 'Nuevo Ingreso Formalizado';
      else if (e.categoriaMatricula === 'regular_en_proceso') catText = 'Regular En Proceso';
      else if (e.categoriaMatricula === 'regular_sin_iniciar') catText = 'Regular Sin Iniciar';

      const transText = e.requiereTransporte === true ? 'Sí' : (e.requiereTransporte === false ? 'No' : 'Pendiente');

      return [
        idx + 1,
        `"${e.escuelaNombre}"`,
        `"${catText}"`,
        `"${e.cedula}"`,
        `"${e.nombres.replace(/"/g, '""')}"`,
        `"${e.apellidos.replace(/"/g, '""')}"`,
        `"${e.grado.replace(/"/g, '""')}"`,
        `"${transText}"`,
        `"${e.rutaNombreLimpio.replace(/"/g, '""')}"`,
        `"${e.coincideRutaOficial ? 'Sí' : 'No'}"`,
        `"${e.paradaNombreLimpio.replace(/"/g, '""')}"`,
        `"${e.coincideParadaOficial ? 'Sí' : 'No'}"`,
        `"${e.representanteNombre.replace(/"/g, '""')}"`,
        `"${e.representanteCedula}"`,
        `"${e.representanteTelefono}"`,
        `"${e.estadoRegistro}"`,
        `"${(e.direccion || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const escuelaNombreTag = filtroEscuela === 'todas' ? 'Ambas_Escuelas_Consolidado' : (filtroEscuela === 'sb' ? 'UE_Santa_Barbara' : 'UE_Libertador_Bolivar');
    link.setAttribute('href', url);
    link.setAttribute('download', `SIGAE_Censo_Matricula_Transporte_${escuelaNombreTag}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (Swal) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Censo y Matrícula descargados con éxito',
        showConfirmButton: false,
        timer: 2500
      });
    }
  };

  // ── Generar Resumen WhatsApp para Dirección y Coordinación ──────────────────
  const copiarResumenWhatsApp = () => {
    let msg = `🚍 *SIGAE - BALANCE OFICIAL DE MATRÍCULA Y TRANSPORTE ESCOLAR*\n`;
    msg += `🏢 *Sede:* ${filtroEscuela === 'todas' ? 'Consolidado DEP Oriente (Ambas Escuelas)' : (filtroEscuela === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar')}\n`;
    msg += `📅 *Fecha:* ${new Date().toLocaleDateString('es-VE')}\n\n`;

    msg += `📊 *MATRÍCULA ESCOLAR REAL:* ${metrics.matriculaTotal} Estudiantes\n`;
    msg += `• 🎒 *Regulares Actualizados:* ${metrics.regularesActualizados} (${metrics.regularesActualizadosPct}%)\n`;
    msg += `• 🌟 *Nuevos Ingresos Formalizados:* ${metrics.nuevosFormalizados} (${metrics.nuevosFormalizadosPct}%)\n`;
    msg += `• ⏳ *Regulares En Proceso de Actualizar:* ${metrics.regularesEnProceso} (${metrics.regularesEnProcesoPct}%)\n`;
    msg += `• ⚠️ *Regulares Sin Iniciar Actualización:* ${metrics.regularesSinIniciar} (${metrics.regularesSinIniciarPct}%)\n`;
    if (filtroEscuela === 'todas') {
      msg += `\n🏫 *DISTRIBUCIÓN POR SEDE:*\n`;
      msg += `  - U.E. Santa Bárbara: ${metrics.countSB} estudiantes (Transporte: ${metrics.sbTrans})\n`;
      msg += `  - U.E. Libertador Bolívar: ${metrics.countLB} estudiantes (Transporte: ${metrics.lbTrans})\n`;
    }

    msg += `\n🚌 *DEMANDA DE TRANSPORTE ESCOLAR:*\n`;
    msg += `• *Total con Transporte Solicitado:* ${metrics.transporteConfirmado} (${metrics.transportePct}% de la matrícula)\n`;
    msg += `• *No Requieren Transporte:* ${metrics.transporteNoRequiere}\n`;
    msg += `• *Pendientes por Definir:* ${metrics.transportePendienteDefinir}\n`;
    msg += `• *Rutas Activas con Demanda:* ${metrics.rutasConDemanda}\n`;
    msg += `• *Paradas Activas con Demanda:* ${metrics.paradasConDemanda}\n\n`;

    msg += `📋 *DESGLOSE DE RUTAS (PASAJEROS ASIGNADOS):*\n`;
    rutasJerarquia.forEach((r, i) => {
      msg += `${i + 1}. *${r.nombre}* (${r.escuela_codigo.toUpperCase()}): *${r.totalEstudiantes} estudiantes* (Act: ${r.totalActualizados} | En Proc: ${r.totalEnProceso} | Nuevos: ${r.totalNuevos})\n`;
    });

    msg += `\n_Generado automáticamente desde SIGAE Unificado._`;

    navigator.clipboard.writeText(msg).then(() => {
      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Resumen Copiado!',
          text: 'El reporte ejecutivo de matrícula y transporte para WhatsApp ha sido copiado al portapapeles.',
          timer: 2500,
          showConfirmButton: false
        });
      }
    });
  };

  // ── Copiar Lista de una Parada Específica para WhatsApp ─────────────────────
  const copiarListaParada = (parada: any, rutaNombre: string) => {
    let msg = `🚍 *LISTADO DE PARADA - TRANSPORTE ESCOLAR*\n`;
    msg += `📍 *Parada:* ${parada.nombre_parada}\n`;
    msg += `🗺️ *Ruta:* ${rutaNombre}\n`;
    msg += `👥 *Total Estudiantes:* ${parada.total}\n`;
    msg += `• Actualizados: ${parada.actualizados} | En Proceso: ${parada.enProceso} | Nuevos: ${parada.nuevos}\n`;
    msg += `─────────────────────────\n`;

    parada.estudiantes.forEach((e: EstudianteCenso, i: number) => {
      let tag = 'Regular';
      if (e.categoriaMatricula === 'nuevo_ingreso_formalizado') tag = 'Nuevo';
      else if (e.categoriaMatricula === 'regular_actualizado') tag = 'Act';
      else tag = 'En Proc';

      msg += `${i + 1}. ${e.nombreCompleto} (${e.cedula}) - ${e.grado} [${tag}] - Rep: ${e.representanteNombre} (${e.representanteTelefono || 'Sin tlf'})\n`;
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
              Matrícula escolar real (Regulares actualizados, en proceso, sin iniciar y nuevos ingresos) para ambas escuelas
            </span>
          </div>
        </div>

        {/* Botones de Acción Global */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            onClick={exportarCSV}
            className="btn btn-success btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 shadow-xs"
            title="Descargar censo y matrícula completa en formato Excel / CSV"
          >
            <i className="bi bi-file-earmark-excel-fill"></i>
            <span>Exportar Excel (CSV)</span>
          </button>

          <button
            onClick={copiarResumenWhatsApp}
            className="btn btn-primary btn-sm rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 shadow-xs"
            title="Copiar balance de rutas y matrícula para WhatsApp"
          >
            <i className="bi bi-whatsapp"></i>
            <span>Resumen WhatsApp</span>
          </button>

          <button
            onClick={() => window.print()}
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
              🏢 Ambas Escuelas ({estudiantes.length})
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
          <span className="badge bg-success-subtle text-success border border-success rounded-pill px-2.5 py-1 fw-bold">
            <i className="bi bi-check2-all me-1"></i>Paginación total sin límite de 1.000 filas
          </span>
        </div>
      </div>

      {/* ── BARRA DE TELEMETRÍA: MATRÍCULA ESCOLAR REAL (KPIS) ── */}
      <div className="row g-2 g-md-3 mb-3">
        {/* KPI 1: Matrícula Escolar Total Real */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3 h-100" style={{ borderLeft: '5px solid #2563eb' }}>
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-primary flex-shrink-0" 
              style={{ width: '48px', height: '48px', background: '#eff6ff', fontSize: '1.4rem' }}
            >
              <i className="bi bi-mortarboard-fill"></i>
            </div>
            <div className="min-w-0">
              <div className="fw-black text-dark fs-4 line-height-1">{metrics.matriculaTotal}</div>
              <div className="text-muted small fw-semibold" style={{ fontSize: '0.75rem' }}>Matrícula Escolar Real</div>
              <div className="text-primary small fw-bold" style={{ fontSize: '0.7rem' }}>
                Regulares: {metrics.totalRegulares} | Nuevos: {metrics.nuevosFormalizados}
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Regulares Actualizados */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3 h-100" style={{ borderLeft: '5px solid #16a34a' }}>
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-success flex-shrink-0" 
              style={{ width: '48px', height: '48px', background: '#f0fdf4', fontSize: '1.4rem' }}
            >
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <div className="min-w-0">
              <div className="fw-black text-dark fs-4 line-height-1 d-flex align-items-center gap-2">
                <span>{metrics.regularesActualizados}</span>
                <span className="badge bg-success-subtle text-success rounded-pill fw-bold" style={{ fontSize: '0.68rem' }}>
                  {metrics.regularesActualizadosPct}%
                </span>
              </div>
              <div className="text-muted small fw-semibold" style={{ fontSize: '0.75rem' }}>Regulares Actualizados</div>
              <div className="text-success small fw-bold" style={{ fontSize: '0.7rem' }}>
                Ficha Finalizada en el Portal
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Nuevos Ingresos Formalizados */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3 h-100" style={{ borderLeft: '5px solid #f59e0b' }}>
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-warning flex-shrink-0" 
              style={{ width: '48px', height: '48px', background: '#fffbeb', fontSize: '1.4rem' }}
            >
              <i className="bi bi-star-fill"></i>
            </div>
            <div className="min-w-0">
              <div className="fw-black text-dark fs-4 line-height-1 d-flex align-items-center gap-2">
                <span>{metrics.nuevosFormalizados}</span>
                <span className="badge bg-warning-subtle text-warning-emphasis rounded-pill fw-bold" style={{ fontSize: '0.68rem' }}>
                  {metrics.nuevosFormalizadosPct}%
                </span>
              </div>
              <div className="text-muted small fw-semibold" style={{ fontSize: '0.75rem' }}>Nuevos Ingresos Formalizados</div>
              <div className="text-warning-emphasis small fw-bold" style={{ fontSize: '0.7rem' }}>
                Admisión e Inscripción Aprobada
              </div>
            </div>
          </div>
        </div>

        {/* KPI 4: Regulares por Actualizar (En Proceso + Sin Iniciar) */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3 h-100" style={{ borderLeft: '5px solid #dc2626' }}>
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-danger flex-shrink-0" 
              style={{ width: '48px', height: '48px', background: '#fef2f2', fontSize: '1.4rem' }}
            >
              <i className="bi bi-clock-history"></i>
            </div>
            <div className="min-w-0">
              <div className="fw-black text-dark fs-4 line-height-1">
                {metrics.totalRegularesPorActualizar}
              </div>
              <div className="text-muted small fw-semibold" style={{ fontSize: '0.75rem' }}>Regulares por Actualizar</div>
              <div className="text-danger small fw-bold" style={{ fontSize: '0.7rem' }}>
                En Proceso: <b>{metrics.regularesEnProceso}</b> | Sin Iniciar: <b>{metrics.regularesSinIniciar}</b>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BARRA SECUNDARIA: BALANCE DE DEMANDA DE TRANSPORTE ── */}
      <div className="p-3 bg-light rounded-4 border mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <span className="fw-bold text-dark small d-flex align-items-center gap-1.5">
            <i className="bi bi-bus-front-fill text-primary"></i>Balance de Transporte:
          </span>
          <span className="badge rounded-pill bg-white text-primary border shadow-xs px-2.5 py-1 fw-bold" style={{ fontSize: '0.75rem' }}>
            🚌 Requieren Transporte: <b>{metrics.transporteConfirmado}</b> ({metrics.transportePct}% de la matrícula)
          </span>
          <span className="badge rounded-pill bg-white text-secondary border shadow-xs px-2.5 py-1 fw-semibold" style={{ fontSize: '0.75rem' }}>
            🚶‍♂️ No Requieren: <b>{metrics.transporteNoRequiere}</b>
          </span>
          <span className="badge rounded-pill bg-white text-danger border shadow-xs px-2.5 py-1 fw-semibold" style={{ fontSize: '0.75rem' }}>
            ❓ Pendiente por Definir: <b>{metrics.transportePendienteDefinir}</b>
          </span>
        </div>

        <div className="d-flex align-items-center gap-2 text-muted small">
          <span><b>{metrics.rutasConDemanda}</b> Rutas activas</span>
          <span>•</span>
          <span><b>{metrics.paradasConDemanda}</b> Paradas con demanda</span>
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
              <span>Por Rutas y Paradas ({metrics.transporteConfirmado})</span>
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
              <span>Padrón de Matrícula ({metrics.matriculaTotal})</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 ${tabActiva === 'regulares_pendientes' ? 'active shadow-sm text-white' : 'text-danger'}`}
              style={{ fontSize: '0.82rem', background: tabActiva === 'regulares_pendientes' ? '#dc2626' : 'transparent' }}
              onClick={() => setTabActiva('regulares_pendientes')}
            >
              <i className="bi bi-clock-history"></i>
              <span>Regulares por Actualizar ({metrics.totalRegularesPorActualizar})</span>
            </button>
          </li>
          {metrics.pendientesAsignar > 0 && (
            <li className="nav-item">
              <button
                className={`nav-link rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 ${tabActiva === 'por_asignar' ? 'active shadow-sm' : 'text-warning-emphasis'}`}
                style={{ fontSize: '0.82rem' }}
                onClick={() => setTabActiva('por_asignar')}
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
            <span className="visually-hidden">Cargando censo y matrícula...</span>
          </div>
          <h5 className="fw-bold text-dark">Cargando matrícula escolar completa y censo de transporte...</h5>
          <p className="text-muted small mb-0">Consolidando registros de regulares (actualizados, en proceso y sin iniciar) y nuevos ingresos formalizados de ambas escuelas.</p>
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
                      <div className="d-flex align-items-center gap-1.5 flex-wrap">
                        <span 
                          className="badge rounded-pill px-3 py-1.5 fw-bold"
                          style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '0.8rem' }}
                          title="Total de estudiantes que abordan esta ruta"
                        >
                          <i className="bi bi-people-fill me-1.5"></i>
                          <b>{ruta.totalEstudiantes}</b> Pasajeros
                        </span>
                        <span 
                          className="badge rounded-pill px-2.5 py-1 fw-semibold bg-light text-success border"
                          style={{ fontSize: '0.72rem' }}
                          title="Regulares Actualizados"
                        >
                          <i className="bi bi-check-circle me-1"></i>{ruta.totalActualizados} Actualizados
                        </span>
                        <span 
                          className="badge rounded-pill px-2.5 py-1 fw-semibold bg-light text-primary border"
                          style={{ fontSize: '0.72rem' }}
                          title="Regulares En Proceso de Actualización"
                        >
                          <i className="bi bi-clock me-1"></i>{ruta.totalEnProceso} En Proc.
                        </span>
                        <span 
                          className="badge rounded-pill px-2.5 py-1 fw-semibold bg-light text-warning-emphasis border"
                          style={{ fontSize: '0.72rem' }}
                          title="Nuevos Ingresos Formalizados"
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
                        title="Ver listado nominal de la ruta"
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
                                <th className="text-center">Total Pasajeros</th>
                                <th className="text-center">Actualizados</th>
                                <th className="text-center">En Proceso</th>
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
                                      {p.actualizados}
                                    </span>
                                  </td>
                                  <td className="text-center">
                                    <span className="badge rounded-pill bg-info-subtle text-primary fw-bold px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                                      {p.enProceso}
                                    </span>
                                  </td>
                                  <td className="text-center">
                                    <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis fw-bold px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                                      {p.nuevos}
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
                                        title="Ver lista de estudiantes de esta parada"
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

                      {/* Aviso si hay estudiantes de esta ruta con paradas pendientes de homologación */}
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
            <div className="p-4 text-center text-muted">No hay datos de paradas con demanda confirmada.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                <thead className="table-light text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>
                  <tr>
                    <th style={{ width: '40px' }} className="text-center">Pos.</th>
                    <th>Parada Oficial</th>
                    <th>Ruta Perteneciente</th>
                    <th>Escuela</th>
                    <th style={{ width: '240px' }}>Volumen y Distribución</th>
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
                          {idx === 2 && <span className="badge text-dark rounded-circle p-1.5" style={{ background: '#fed7aa' }}>🥉</span>}
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
                              <span>Act: <b>{item.actualizados}</b></span>
                              <span>En Proc: <b>{item.enProceso}</b></span>
                              <span>Nuevos: <b>{item.nuevos}</b></span>
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
          PESTAÑA 3: PADRÓN GENERAL DE MATRÍCULA ESCOLAR (TODOS LOS ESTUDIANTES)
      ══════════════════════════════════════════════════════════════════════════ */}
      {!loading && tabActiva === 'padron' && (
        <div className="bg-white rounded-4 border shadow-xs p-3 p-md-4">
          {/* Barra de Filtros del Padrón */}
          <div className="row g-2 align-items-center mb-3">
            {/* Buscador de texto */}
            <div className="col-12 col-md-3">
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

            {/* Filtro por Categoría de Matrícula */}
            <div className="col-6 col-md-3">
              <select
                className="form-select form-select-sm"
                value={filtroCategoria}
                onChange={(e) => { setFiltroCategoria(e.target.value); setPaginaActual(1); }}
              >
                <option value="todos">Toda la Matrícula Real ({estudiantesFiltradosEscuela.length})</option>
                <option value="regular_actualizado">Regulares Actualizados ({metrics.regularesActualizados})</option>
                <option value="nuevo_ingreso_formalizado">Nuevos Ingresos Formalizados ({metrics.nuevosFormalizados})</option>
                <option value="regular_en_proceso">Regulares En Proceso ({metrics.regularesEnProceso})</option>
                <option value="regular_sin_iniciar">Regulares Sin Iniciar ({metrics.regularesSinIniciar})</option>
              </select>
            </div>

            {/* Filtro por Estado de Transporte */}
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={filtroTransporte}
                onChange={(e: any) => { setFiltroTransporte(e.target.value); setPaginaActual(1); }}
              >
                <option value="todos">Todos (Transporte)</option>
                <option value="si">🚌 Requieren Transporte ({metrics.transporteConfirmado})</option>
                <option value="no">🚶‍♂️ No Requieren ({metrics.transporteNoRequiere})</option>
                <option value="pendiente">❓ Pendiente ({metrics.transportePendienteDefinir})</option>
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
            <div className="col-6 col-md-2 text-end">
              <select
                className="form-select form-select-sm"
                value={filasPorPagina}
                onChange={(e) => { setFilasPorPagina(Number(e.target.value)); setPaginaActual(1); }}
              >
                <option value={15}>15 por pág.</option>
                <option value={25}>25 por pág.</option>
                <option value={50}>50 por pág.</option>
                <option value={100}>100 por pág.</option>
              </select>
            </div>
          </div>

          {/* Contador de Resultados */}
          <div className="d-flex align-items-center justify-content-between text-muted small mb-2">
            <span>
              Mostrando <b>{padronFiltrado.length}</b> de <b>{metrics.matriculaTotal}</b> estudiantes de la matrícula escolar
            </span>
            <span>
              Página <b>{paginaActual}</b> de <b>{totalPaginas}</b>
            </span>
          </div>

          {/* Tabla de Estudiantes */}
          {padronPaginado.length === 0 ? (
            <div className="p-5 text-center text-muted">
              <i className="bi bi-search fs-2"></i>
              <p className="mt-2 mb-0">No se encontraron estudiantes con los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                <thead className="table-light text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>
                  <tr>
                    <th style={{ width: '40px' }} className="text-center">#</th>
                    <th>Estudiante</th>
                    <th>Categoría Matrícula</th>
                    <th>Sede</th>
                    <th>Grado / Año</th>
                    <th>Transporte</th>
                    <th>Ruta & Parada</th>
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
                          {e.categoriaMatricula === 'regular_actualizado' && (
                            <span className="badge rounded-pill bg-success-subtle text-success border border-success fw-bold px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                              <i className="bi bi-check-circle me-1"></i>Regular Actualizado
                            </span>
                          )}
                          {e.categoriaMatricula === 'nuevo_ingreso_formalizado' && (
                            <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis border border-warning fw-bold px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                              <i className="bi bi-star-fill me-1"></i>Nuevo Formalizado
                            </span>
                          )}
                          {e.categoriaMatricula === 'regular_en_proceso' && (
                            <span className="badge rounded-pill bg-info-subtle text-primary border border-primary fw-bold px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                              <i className="bi bi-clock me-1"></i>En Proceso
                            </span>
                          )}
                          {e.categoriaMatricula === 'regular_sin_iniciar' && (
                            <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger fw-bold px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                              <i className="bi bi-exclamation-circle me-1"></i>Sin Iniciar
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
                          {e.requiereTransporte === true && (
                            <span className="badge rounded-pill bg-primary text-white fw-bold px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                              <i className="bi bi-bus-front me-1"></i>Requiere
                            </span>
                          )}
                          {e.requiereTransporte === false && (
                            <span className="badge rounded-pill bg-light text-muted border fw-semibold px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                              No Requiere
                            </span>
                          )}
                          {e.requiereTransporte === null && (
                            <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger fw-semibold px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td>
                          {e.requiereTransporte === true ? (
                            <div>
                              <div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '200px' }}>
                                {e.rutaNombreLimpio}
                              </div>
                              <div className="text-muted small text-truncate" style={{ fontSize: '0.7rem', maxWidth: '200px' }}>
                                📍 {e.paradaNombreLimpio}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
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
          PESTAÑA 4: REGULARES PENDIENTES POR ACTUALIZAR (EN PROCESO / SIN INICIAR)
      ══════════════════════════════════════════════════════════════════════════ */}
      {!loading && tabActiva === 'regulares_pendientes' && (
        <div className="bg-white rounded-4 border shadow-xs p-3 p-md-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 pb-2 border-bottom">
            <div>
              <h5 className="fw-bold text-danger mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-clock-history"></i>
                <span>Estudiantes Regulares Pendientes por Actualizar Datos</span>
              </h5>
              <p className="text-muted small mb-0">
                Padrón de estudiantes regulares activos en la institución que aún no han cerrado o iniciado su ficha en el portal.
              </p>
            </div>

            {/* Subfiltros: Todos / En Proceso / Sin Iniciar */}
            <div className="btn-group p-1 bg-light rounded-pill border" role="group">
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 fw-bold ${subfiltroPendientes === 'todos' ? 'btn-danger text-white' : 'btn-light text-muted'}`}
                style={{ fontSize: '0.78rem' }}
                onClick={() => setSubfiltroPendientes('todos')}
              >
                Todos ({metrics.totalRegularesPorActualizar})
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 fw-bold ${subfiltroPendientes === 'en_proceso' ? 'btn-danger text-white' : 'btn-light text-muted'}`}
                style={{ fontSize: '0.78rem' }}
                onClick={() => setSubfiltroPendientes('en_proceso')}
              >
                ⏳ En Proceso ({metrics.regularesEnProceso})
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 fw-bold ${subfiltroPendientes === 'sin_iniciar' ? 'btn-danger text-white' : 'btn-light text-muted'}`}
                style={{ fontSize: '0.78rem' }}
                onClick={() => setSubfiltroPendientes('sin_iniciar')}
              >
                ⚠️ Sin Iniciar ({metrics.regularesSinIniciar})
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
              <thead className="table-light text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>
                <tr>
                  <th style={{ width: '40px' }} className="text-center">#</th>
                  <th>Estudiante</th>
                  <th>Cédula</th>
                  <th>Sede</th>
                  <th>Grado</th>
                  <th>Estatus de Ficha</th>
                  <th>Transporte Preliminar</th>
                  <th>Representante & Contacto</th>
                </tr>
              </thead>
              <tbody>
                {listaRegularesPendientes.map((e, idx) => {
                  const cleanPhone = (e.representanteTelefono || '').replace(/\D/g, '');
                  const waLink = cleanPhone ? (cleanPhone.startsWith('58') ? `https://wa.me/${cleanPhone}` : `https://wa.me/58${cleanPhone.replace(/^0+/, '')}`) : null;

                  return (
                    <tr key={e.id}>
                      <td className="text-center text-muted fw-bold">{idx + 1}</td>
                      <td>
                        <div className="fw-bold text-dark">{e.nombreCompleto}</div>
                      </td>
                      <td className="fw-semibold text-secondary">{e.cedula}</td>
                      <td>
                        <span className="badge bg-light text-dark border rounded-pill">
                          {e.codigo_escuela.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border rounded-pill">
                          {e.grado}
                        </span>
                      </td>
                      <td>
                        {e.categoriaMatricula === 'regular_en_proceso' ? (
                          <span className="badge rounded-pill bg-info-subtle text-primary border border-primary fw-bold px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                            <i className="bi bi-clock me-1"></i>En Proceso (Borrador)
                          </span>
                        ) : (
                          <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger fw-bold px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                            <i className="bi bi-exclamation-triangle-fill me-1"></i>Sin Iniciar
                          </span>
                        )}
                      </td>
                      <td>
                        {e.requiereTransporte === true ? (
                          <span className="badge rounded-pill bg-primary-subtle text-primary border" style={{ fontSize: '0.68rem' }}>
                            🚌 {e.rutaNombreLimpio}
                          </span>
                        ) : (
                          <span className="text-muted small">Por confirmar</span>
                        )}
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
                                  title="Contactar al representante por WhatsApp"
                                >
                                  <i className="bi bi-whatsapp" style={{ fontSize: '0.65rem' }}></i>
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted small" style={{ fontSize: '0.68rem' }}>Sin teléfono registrado</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          PESTAÑA 5: POR ASIGNAR / CASOS ESPECIALES DE TRANSPORTE
      ══════════════════════════════════════════════════════════════════════════ */}
      {!loading && tabActiva === 'por_asignar' && (
        <div className="bg-white rounded-4 border shadow-xs p-3 p-md-4">
          <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
            <div>
              <h5 className="fw-bold text-warning-emphasis mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill text-warning"></i>
                <span>Estudiantes con Ruta o Parada Pendiente de Homologación</span>
              </h5>
              <p className="text-muted small mb-0">
                Estudiantes que solicitaron transporte pero su parada o ruta seleccionada requiere confirmación con el catálogo oficial.
              </p>
            </div>
            <span className="badge bg-warning text-dark rounded-pill px-3 py-1.5 fw-bold">
              {estudiantesPorAsignar.length} Casos
            </span>
          </div>

          {estudiantesPorAsignar.length === 0 ? (
            <div className="p-4 text-center text-success">
              <i className="bi bi-check-circle-fill fs-2"></i>
              <p className="mt-2 mb-0 fw-bold">¡Excelente! Todos los estudiantes que requieren transporte tienen parada y ruta oficial asignada.</p>
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
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {estudiantesPorAsignar.map(e => (
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
                          Por Homologar
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

                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="badge bg-primary rounded-pill px-2.5 py-1 fw-bold">
                    Total: {modalData.estudiantes.length}
                  </span>
                  <span className="badge bg-success-subtle text-success rounded-pill px-2 py-1 fw-bold">
                    Act: {modalData.estudiantes.filter(e => e.categoriaMatricula === 'regular_actualizado').length}
                  </span>
                  <span className="badge bg-info-subtle text-primary rounded-pill px-2 py-1 fw-bold">
                    En Proc: {modalData.estudiantes.filter(e => e.categoriaMatricula === 'regular_en_proceso').length}
                  </span>
                  <span className="badge bg-warning-subtle text-warning-emphasis rounded-pill px-2 py-1 fw-bold">
                    Nuevos: {modalData.estudiantes.filter(e => e.categoriaMatricula === 'nuevo_ingreso_formalizado').length}
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
                            <th>Estatus</th>
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
                                  {e.categoriaMatricula === 'regular_actualizado' && (
                                    <span className="badge rounded-pill bg-success-subtle text-success border border-success fw-bold px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                                      Actualizado
                                    </span>
                                  )}
                                  {e.categoriaMatricula === 'nuevo_ingreso_formalizado' && (
                                    <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis border border-warning fw-bold px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                                      Nuevo Formalizado
                                    </span>
                                  )}
                                  {e.categoriaMatricula === 'regular_en_proceso' && (
                                    <span className="badge rounded-pill bg-info-subtle text-primary border border-primary fw-bold px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                                      En Proceso
                                    </span>
                                  )}
                                  {e.categoriaMatricula === 'regular_sin_iniciar' && (
                                    <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger fw-bold px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                                      Sin Iniciar
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
                    msg += `👥 *Total:* ${modalData.estudiantes.length} Pasajeros\n`;
                    msg += `─────────────────────────\n`;
                    modalData.estudiantes.forEach((e, i) => {
                      msg += `${i + 1}. ${e.nombreCompleto} (${e.cedula}) - Grado: ${e.grado} [${e.categoriaMatricula}] - Rep: ${e.representanteNombre} (${e.representanteTelefono || 'Sin tlf'})\n`;
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
