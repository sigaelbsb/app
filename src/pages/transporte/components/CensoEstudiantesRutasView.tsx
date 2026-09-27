import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../../lib/supabase';

interface CensoEstudiantesRutasViewProps {
  onBack: () => void;
  initialEscuela: 'sb' | 'lb';
  escuelaAsignada?: 'sb' | 'lb' | null;
  user: any;
  canManageRutas: boolean;
  isSuperAdmin: boolean;
}

export type CategoriaMatricula = 
  | 'regular_actualizado'            // Regular que completó actualización de datos (ficha_completada)
  | 'regular_en_proceso'              // Regular que inició actualización pero no ha finalizado
  | 'regular_sin_iniciar'             // Regular que aún no ha iniciado la actualización
  | 'nuevo_ingreso_cupo_otorgado'     // Aspirante con cupo otorgado en admisión (pendiente formalización presencial en escuela)
  | 'nuevo_ingreso_formalizado';      // Nuevo ingreso formalizado presencialmente en escuela


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
  avanceEstado?: 'completado' | 'en_proceso' | 'sin_iniciar';
  avancePorcentaje?: number;
}

// ── Helper para Extraer el Número de la Ruta y Ordenar Naturalmente ─────────
export const extraerNumeroRuta = (nombre: string): number => {
  if (!nombre) return 999;
  const n = String(nombre).toLowerCase().trim();
  if (n.includes('ruta 0') || n.includes('caminante') || n.includes('a pie') || n.includes('peatonal')) {
    return 0;
  }
  const match = n.match(/ruta\s*(\d+)/i) || n.match(/(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 999;
};

export const CensoEstudiantesRutasView: React.FC<CensoEstudiantesRutasViewProps> = ({
  onBack,
  initialEscuela,
  escuelaAsignada,
  user,
  canManageRutas,
  isSuperAdmin
}) => {
  const Swal = (window as any).Swal;

  const isSuper = isSuperAdmin || ['SuperAdmin', 'Administrador', 'Administradora'].includes(user?.rol || '');

  // Identificar la escuela fija asignada del coordinador/usuario ('sb' | 'lb' | null)
  // AISLAMIENTO ESTRICTO: El coordinador de LB no puede ver SB y viceversa
  const sedeRestringida = useMemo((): 'sb' | 'lb' | null => {
    const rolLower = (user?.rol || '').toLowerCase();
    const cargoLower = (user?.cargo || '').toLowerCase();
    const esCoordTrans = rolLower.includes('transporte') || cargoLower.includes('transporte');

    if (!esCoordTrans && isSuper) return null;

    if (escuelaAsignada === 'sb' || escuelaAsignada === 'lb') {
      return escuelaAsignada;
    }

    // 1. Por instituciones en perfil_acceso
    if (user?.perfil_acceso?.instituciones && Array.isArray(user.perfil_acceso.instituciones)) {
      const insts = user.perfil_acceso.instituciones.map((i: string) => (i || '').toLowerCase());
      const hasSB = insts.some((i: string) => i.includes('santa b') || i === 'sb');
      const hasLB = insts.some((i: string) => i.includes('bolívar') || i.includes('bolivar') || i === 'lb');
      if (hasSB && !hasLB) return 'sb';
      if (hasLB && !hasSB) return 'lb';
      if (hasSB && hasLB && !esCoordTrans) return null;
    }

    // 2. Por id_escuela directo en objeto user
    const uEsc = (user?.id_escuela || '').trim().toLowerCase();
    if (uEsc === 'sb' || uEsc === 'lb') return uEsc as 'sb' | 'lb';

    // 3. Por cargo o rol institucional específico de sede
    if (cargoLower.includes('(sb)') || cargoLower.includes('santa b') || rolLower.includes('(sb)') || rolLower.includes('santa b')) return 'sb';
    if (cargoLower.includes('(lb)') || cargoLower.includes('libertador') || cargoLower.includes('bolívar') || cargoLower.includes('bolivar') || rolLower.includes('(lb)')) return 'lb';

    // 4. Si initialEscuela está definida y no es superadmin general
    if (initialEscuela === 'sb' || initialEscuela === 'lb') return initialEscuela;

    return null;
  }, [user, isSuper, escuelaAsignada, initialEscuela]);

  // La sede institucional se sincroniza directamente con la escuela activa seleccionada en la parte superior
  const filtroEscuela: 'sb' | 'lb' = useMemo(() => {
    if (sedeRestringida === 'sb' || sedeRestringida === 'lb') return sedeRestringida;
    if (initialEscuela === 'sb' || initialEscuela === 'lb') return initialEscuela;
    return 'lb';
  }, [sedeRestringida, initialEscuela]);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtroEscuela]);
  
  // Pestaña activa del submódulo
  const [tabActiva, setTabActiva] = useState<'jerarquia' | 'ranking' | 'padron' | 'regulares_pendientes' | 'por_asignar'>('jerarquia');
  
  // Sub-tipo de ranking: 'rutas' | 'paradas'
  const [tipoRanking, setTipoRanking] = useState<'rutas' | 'paradas'>('rutas');

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

  // Bloquear scroll de la página de fondo mientras el modal está abierto y permitir cierre con ESC
  useEffect(() => {
    if (modalData) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setModalData(null);
          setFiltroModal('');
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = prevOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [modalData]);

  // ── Helper para normalizar cadenas ──────────────────────────────────────────
  const normalizar = (s: string) => {
    return (s || '')
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  };

  // ── Algoritmo Institucional Oficial de Avance de Ficha (Sincronizado con VincularEstudiante y Dashboard) ──
  const evaluarAvanceOficial = (item: any) => {
    const d = (item.datos_actualizados && typeof item.datos_actualizados === 'object') ? item.datos_actualizados : {};
    const fecha = item.fecha_ultima_actualizacion || d.fecha_ultima_actualizacion;

    const secciones = [
      { id: 'rep', ok: Boolean((d.representante_nombres || item.nombres_representante) && (d.representante_cedula || item.cedula_representante) && (d.representante_telefono || d.representante_email)) },
      { id: 'est', ok: Boolean((d.estudiante_nombres || item.nombres_estudiante) && (d.estudiante_apellidos || item.apellidos_estudiante) && d.estudiante_fecha_nacimiento && d.estudiante_sexo) },
      { id: 'dir', ok: Boolean(d.estado_habitacion && d.direccion_habitacion) },
      { id: 'salud', ok: Boolean(d.estudiante_grupo_sanguineo || d.talla_franela || d.peso_kg) },
      { id: 'madre', ok: Boolean(d.madre_nombres && d.madre_cedula) },
      { id: 'padre', ok: d.estudiante_reconocido_por_padre === 'No' || Boolean(d.padre_nombres && d.padre_cedula) },
      { id: 'socio', ok: Boolean(d.posee_computadora || d.tipo_vivienda || d.estudiante_con_quien_vive) },
      { id: 'confirmado', ok: Boolean(fecha) }
    ];

    const completadas = secciones.filter(s => s.ok).length;
    const porcentaje = Math.round((completadas / secciones.length) * 100);

    let estado: 'sin_iniciar' | 'en_proceso' | 'completado' = 'sin_iniciar';
    if ((fecha && porcentaje >= 85) || d.ficha_completada === true) {
      estado = 'completado';
    } else if (porcentaje > 0 || fecha) {
      estado = 'en_proceso';
    }

    return { porcentaje, estado };
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

      const todasRutas = (rutasRes.data || []).slice().sort((a: any, b: any) => {
        const numA = extraerNumeroRuta(a.nombre);
        const numB = extraerNumeroRuta(b.nombre);
        if (numA !== numB) return numA - numB;
        return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es', { numeric: true });
      });
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
      const codigosEnVinculacion = new Set<string>();
      const nombresEnVinculacion = new Set<string>();
      const solIdsEnVinculacion = new Set<string>();
      const vincCodigosVistos = new Set<string>();

      // Priorizar registros con cédula definitiva sobre cédulas provisionales T- para mantener los datos oficiales
      const vincDataOrdenada = [...(vincData || [])].sort((a, b) => {
        const cedA = (a.cedula_estudiante || a.datos_actualizados?.estudiante_cedula || '').trim();
        const cedB = (b.cedula_estudiante || b.datos_actualizados?.estudiante_cedula || '').trim();
        const esProvisA = cedA.toUpperCase().startsWith('T-') ? 1 : 0;
        const esProvisB = cedB.toUpperCase().startsWith('T-') ? 1 : 0;
        return esProvisA - esProvisB;
      });

      // ── A) Procesar todas las vinculaciones (Matrícula Regular + Nuevos Ingresos vinculados)
      vincDataOrdenada.forEach(v => {
        const d = v.datos_actualizados || {};
        const codUni = (d.codigo_unico || (v as any).codigo_unico || '').trim();
        const codUniNorm = codUni.toLowerCase().replace(/^t-/, '');

        // Evitar duplicados de nuevos ingresos vinculados con el mismo código único de solicitud de admisión (sc-...)
        if (codUniNorm && codUniNorm.startsWith('sc-')) {
          if (vincCodigosVistos.has(codUniNorm)) {
            return;
          }
          vincCodigosVistos.add(codUniNorm);
        }

        const cedRaw = (v.cedula_estudiante || d.estudiante_cedula || '').trim();
        const cedNorm = cedRaw.replace(/\D/g, '');
        if (cedNorm) cedulasEnVinculacion.add(cedNorm);

        if (codUni) {
          codigosEnVinculacion.add(codUni.toLowerCase());
          codigosEnVinculacion.add(codUniNorm);
        }
        if (cedRaw) {
          codigosEnVinculacion.add(cedRaw.toLowerCase());
          codigosEnVinculacion.add(cedRaw.replace(/^T-/, '').toLowerCase());
        }

        const nomCompletoNorm = `${v.nombres_estudiante || d.estudiante_nombres || ''} ${v.apellidos_estudiante || d.estudiante_apellidos || ''}`.toLowerCase().replace(/\s+/g, ' ').trim();
        if (nomCompletoNorm) nombresEnVinculacion.add(nomCompletoNorm);

        if (d.id_solicitud) solIdsEnVinculacion.add(String(d.id_solicitud));
        if (d.id) solIdsEnVinculacion.add(String(d.id));

        const esc = ((v.codigo_escuela || d.codigo_escuela || 'sb') as string).toLowerCase() as 'sb' | 'lb';
        const esNuevoIngreso = d.origen_admision === 'nuevo_ingreso';
        const avance = evaluarAvanceOficial(v);

        // Clasificar según el estándar institucional oficial (Control de Avance Chamilo y Dashboard)
        let categoria: CategoriaMatricula;
        let estadoLabel = '';

        if (esNuevoIngreso) {
          categoria = 'nuevo_ingreso_cupo_otorgado';
          estadoLabel = avance.estado === 'completado' ? 'Nuevo Ingreso (Cupo Otorgado • Ficha al 100%)' : 'Nuevo Ingreso (Cupo Otorgado • Pendiente Presencial)';
        } else if (avance.estado === 'completado') {
          categoria = 'regular_actualizado';
          estadoLabel = 'Regular Actualizado (Ficha Completada 100%)';
        } else if (avance.estado === 'en_proceso') {
          categoria = 'regular_en_proceso';
          estadoLabel = 'Regular En Proceso de Actualización';
        } else {
          categoria = 'regular_sin_iniciar';
          estadoLabel = 'Regular Sin Iniciar Actualización';
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

        let rutaDefinida = 'Sin Ruta Asignada';
        let paradaDefinida = 'Sin Parada Asignada';
        if (reqTrans === false) {
          rutaDefinida = '🚶‍♂️ Ruta 0 - A Pie / Caminantes (No Requiere Bus)';
          paradaDefinida = 'Ruta 0 (Caminante)';
        } else if (reqTrans === null) {
          rutaDefinida = '❓ Pendiente por Definir';
          paradaDefinida = 'Por Confirmar';
        }

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
          rutaNombreLimpio: rutaMatch ? rutaMatch.nombre : (rutaLimpia || rutaDefinida),
          paradaNombreRaw: rawParada,
          paradaNombreLimpio: paradaMatch ? paradaMatch.nombre_parada : (paradaLimpia || paradaDefinida),
          rutaIdOficial: rutaMatch?.id,
          paradaIdOficial: paradaMatch?.id,
          coincideRutaOficial: !!rutaMatch,
          coincideParadaOficial: !!paradaMatch,
          representanteNombre: `${v.nombres_representante || d.representante_nombres || ''} ${v.apellidos_representante || d.representante_apellidos || ''}`.trim() || 'Representante',
          representanteCedula: (v.cedula_representante || d.representante_cedula || '').trim(),
          representanteTelefono: (d.representante_telefono || d.representante_telefono_movil || v.telefono_representante || '').trim(),
          estadoRegistro: estadoLabel,
          direccion: (d.direccion_habitacion || '').trim(),
          avanceEstado: avance.estado,
          avancePorcentaje: avance.porcentaje
        });
      });

      // ── B) Procesar Nuevos Ingresos con Cupo Otorgado desde solicitud_cupos (No Duplicados)
      const estadosValidosFormalizado = ['formalizado', 'formalizada', 'inscrito', 'inscrita', 'aprobado', 'admitido'];
      (solData || []).forEach(s => {
        const estadoNorm = (s.estado || '').toLowerCase().trim();
        if (!estadosValidosFormalizado.includes(estadoNorm)) return;

        const cedRaw = (s.estudiante_cedula || '').trim();
        const cedNorm = cedRaw.replace(/\D/g, '');
        const codUni = (s.codigo_unico || '').trim().toLowerCase();
        const codUniSinT = codUni.replace(/^T-/, '');
        const nomCompletoNorm = `${s.estudiante_nombres || ''} ${s.estudiante_apellidos || ''}`.toLowerCase().replace(/\s+/g, ' ').trim();
        const sId = String(s.id);

        // Evitar duplicados si ya está presente en vinculaciones por cualquiera de sus identificadores
        if (sId && solIdsEnVinculacion.has(sId)) return;
        if (cedNorm && cedulasEnVinculacion.has(cedNorm)) return;
        if (codUni && (codigosEnVinculacion.has(codUni) || codigosEnVinculacion.has(codUniSinT))) return;
        if (cedRaw && codigosEnVinculacion.has(cedRaw.toLowerCase())) return;
        if (nomCompletoNorm && nombresEnVinculacion.has(nomCompletoNorm)) return;

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
          categoriaMatricula: 'nuevo_ingreso_cupo_otorgado',
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
          rutaNombreLimpio: rutaMatch ? rutaMatch.nombre : (rutaLimpia || (reqTrans ? 'Sin Ruta Asignada' : '🚶‍♂️ Ruta 0 - A Pie / Caminantes (No Requiere Bus)')),
          paradaNombreRaw: paradaLimpia,
          paradaNombreLimpio: paradaMatch ? paradaMatch.nombre_parada : (paradaLimpia || (reqTrans ? 'Sin Parada Asignada' : 'Ruta 0 (Caminante)')),
          rutaIdOficial: rutaMatch?.id,
          paradaIdOficial: paradaMatch?.id,
          coincideRutaOficial: !!rutaMatch,
          coincideParadaOficial: !!paradaMatch,
          representanteNombre: `${s.representante_nombres || ''} ${s.representante_apellidos || ''}`.trim() || 'Representante',
          representanteCedula: (s.representante_cedula || '').trim(),
          representanteTelefono: (s.representante_telefono || s.representante_telefono2 || '').trim(),
          estadoRegistro: 'Nuevo Ingreso (Cupo Otorgado - Pendiente Presencial)',
          direccion: (s.direccion_habitacion || '').trim(),
          avanceEstado: 'en_proceso',
          avancePorcentaje: 50
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
    const escEfectiva = sedeRestringida || filtroEscuela;
    return estudiantes.filter(e => e.codigo_escuela === escEfectiva);
  }, [estudiantes, filtroEscuela, sedeRestringida]);

  // ── Métricas y Telemetría del Censo Escolar Completo ────────────────────────
  const metrics = useMemo(() => {
    const matriculaTotal = estudiantesFiltradosEscuela.length;

    // Métricas Institucionales Oficiales (Sincronizadas con Control de Avance Chamilo y Dashboard: 643, 35, 15 en LB)
    const totalActualizados = estudiantesFiltradosEscuela.filter(e => e.avanceEstado === 'completado').length;
    const totalEnProceso = estudiantesFiltradosEscuela.filter(e => e.avanceEstado === 'en_proceso').length;
    const totalSinIniciar = estudiantesFiltradosEscuela.filter(e => e.avanceEstado === 'sin_iniciar').length;
    const totalPorActualizar = totalEnProceso + totalSinIniciar;

    // Desglose de Matrícula Real por Origen
    const regularesActualizados = estudiantesFiltradosEscuela.filter(e => e.categoriaMatricula === 'regular_actualizado').length;
    const nuevosFormalizados = estudiantesFiltradosEscuela.filter(e => e.categoriaMatricula === 'nuevo_ingreso_cupo_otorgado' || e.categoriaMatricula === 'nuevo_ingreso_formalizado').length;
    const nuevosActualizados = estudiantesFiltradosEscuela.filter(e => (e.categoriaMatricula === 'nuevo_ingreso_cupo_otorgado' || e.categoriaMatricula === 'nuevo_ingreso_formalizado') && e.avanceEstado === 'completado').length;
    const regularesEnProceso = estudiantesFiltradosEscuela.filter(e => e.categoriaMatricula === 'regular_en_proceso').length;
    const regularesSinIniciar = estudiantesFiltradosEscuela.filter(e => e.categoriaMatricula === 'regular_sin_iniciar').length;
    const totalRegulares = regularesActualizados + regularesEnProceso + regularesSinIniciar;

    // Desglose de Demanda de Transporte
    const transporteConfirmado = estudiantesFiltradosEscuela.filter(e => e.requiereTransporte === true).length;
    const transporteNoRequiere = estudiantesFiltradosEscuela.filter(e => e.requiereTransporte === false).length;
    const transportePendienteDefinir = estudiantesFiltradosEscuela.filter(e => e.requiereTransporte === null).length;

    // Conciliación Cruzada: Modalidad de Transporte vs Avance de Ficha Chamilo
    // Pasajeros en autobús según avance de ficha
    const transporteConfirmado100 = estudiantesFiltradosEscuela.filter(e => e.requiereTransporte === true && e.avanceEstado === 'completado').length;
    const transporteConfirmadoEnProceso = estudiantesFiltradosEscuela.filter(e => e.requiereTransporte === true && e.avanceEstado === 'en_proceso').length;

    // Caminantes de Ruta 0 según avance de ficha
    const caminantes100 = estudiantesFiltradosEscuela.filter(e => e.requiereTransporte === false && e.avanceEstado === 'completado').length;
    const caminantesEnProceso = estudiantesFiltradosEscuela.filter(e => e.requiereTransporte === false && e.avanceEstado === 'en_proceso').length;

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
      totalActualizados,
      totalActualizadosPct: matriculaTotal > 0 ? Math.round((totalActualizados / matriculaTotal) * 100) : 0,
      totalPorActualizar,
      totalPorActualizarPct: matriculaTotal > 0 ? Math.round((totalPorActualizar / matriculaTotal) * 100) : 0,
      totalEnProceso,
      totalSinIniciar,
      regularesActualizados,
      regularesActualizadosPct: matriculaTotal > 0 ? Math.round((regularesActualizados / matriculaTotal) * 100) : 0,
      nuevosFormalizados,
      nuevosFormalizadosPct: matriculaTotal > 0 ? Math.round((nuevosFormalizados / matriculaTotal) * 100) : 0,
      nuevosActualizados,
      regularesEnProceso,
      regularesEnProcesoPct: matriculaTotal > 0 ? Math.round((regularesEnProceso / matriculaTotal) * 100) : 0,
      regularesSinIniciar,
      regularesSinIniciarPct: matriculaTotal > 0 ? Math.round((regularesSinIniciar / matriculaTotal) * 100) : 0,
      totalRegulares,
      transporteConfirmado,
      transporteConfirmado100,
      transporteConfirmadoEnProceso,
      transportePct: matriculaTotal > 0 ? Math.round((transporteConfirmado / matriculaTotal) * 100) : 0,
      transporteNoRequiere,
      caminantes100,
      caminantesEnProceso,
      caminantesPct: matriculaTotal > 0 ? Math.round((transporteNoRequiere / matriculaTotal) * 100) : 0,
      transportePendienteDefinir,
      pendientesTransportePct: matriculaTotal > 0 ? Math.round((transportePendienteDefinir / matriculaTotal) * 100) : 0,
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
    const escEfectiva = sedeRestringida || filtroEscuela;
    // Solo estudiantes que solicitaron transporte en bus de esta sede
    const estsConTransporte = estudiantesFiltradosEscuela.filter(e => e.requiereTransporte === true);
    const rutasBase = rutasDB.filter(r => r.escuela_codigo === escEfectiva);

    const rutasMapeadas = rutasBase.map(ruta => {
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
        const nuevos = estsEnParada.filter(e => e.categoriaMatricula === 'nuevo_ingreso_cupo_otorgado' || e.categoriaMatricula === 'nuevo_ingreso_formalizado').length;

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
      const totalNuevos = estsDeRuta.filter(e => e.categoriaMatricula === 'nuevo_ingreso_cupo_otorgado' || e.categoriaMatricula === 'nuevo_ingreso_formalizado').length;

      return {
        id: ruta.id,
        nombre: ruta.nombre,
        escuela_codigo: ruta.escuela_codigo,
        escuelaNombre: ruta.escuela_codigo === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar',
        chofer_nombre: ruta.chofer_nombre || 'Sin chofer asignado',
        docente_nombre: ruta.docente_nombre || 'Sin docente asignado',
        docente_telefono: ruta.docente_telefono || '',
        activo: ruta.activo !== false,
        esRutaCaminantes: false,
        esRutaPendientes: false,
        totalEstudiantes: estsDeRuta.length,
        totalActualizados,
        totalEnProceso,
        totalNuevos,
        paradas: paradasConConteo,
        sinParadaExacta: estsSinParadaExacta,
        estudiantes: estsDeRuta
      };
    });

    // ── Categoría Oficial: Ruta 0 • Caminantes / A Pie (No Requieren Bus) ──
    const estsCaminantes = estudiantesFiltradosEscuela.filter(e => e.requiereTransporte === false);
    let rutaCaminantesItem: any = null;
    if (estsCaminantes.length > 0) {
      const niveles = [
        { id: 'cam_ini', nombre: 'Educación Inicial (Ruta 0 - Caminantes)', desc: 'Preescolar / Inicial que asisten a pie por residir cerca del plantel' },
        { id: 'cam_pri', nombre: 'Educación Primaria (Ruta 0 - Caminantes)', desc: 'Primaria (1er a 6to Grado) que asisten a pie por residir cerca del plantel' },
        { id: 'cam_med', nombre: 'Media General (Ruta 0 - Caminantes)', desc: 'Secundaria (1er a 5to Año) que asisten a pie por residir cerca del plantel' }
      ];

      const paradasCaminantes = niveles.map((niv, idx) => {
        const estsNiv = estsCaminantes.filter(e => {
          const g = (e.grado || '').toLowerCase();
          if (idx === 0) return g.includes('grupo') || g.includes('maternal') || g.includes('inicial') || g.includes('preescolar');
          if (idx === 1) return g.includes('grado');
          if (idx === 2) return g.includes('año') || g.includes('ano') || g.includes('secundaria');
          return false;
        });

        return {
          id: niv.id,
          orden: idx + 1,
          nombre_parada: niv.nombre,
          descripcion: niv.desc,
          total: estsNiv.length,
          actualizados: estsNiv.filter(e => e.categoriaMatricula === 'regular_actualizado').length,
          enProceso: estsNiv.filter(e => e.categoriaMatricula === 'regular_en_proceso').length,
          nuevos: estsNiv.filter(e => e.categoriaMatricula === 'nuevo_ingreso_cupo_otorgado' || e.categoriaMatricula === 'nuevo_ingreso_formalizado').length,
          estudiantes: estsNiv
        };
      }).filter(p => p.total > 0);

      // Otros caminantes no contemplados en los 3 grupos
      const idsClasificados = new Set(paradasCaminantes.flatMap(p => p.estudiantes.map(e => e.id)));
      const otrosCaminantes = estsCaminantes.filter(e => !idsClasificados.has(e.id));
      if (otrosCaminantes.length > 0) {
        paradasCaminantes.push({
          id: 'cam_otros',
          orden: paradasCaminantes.length + 1,
          nombre_parada: 'Otros Niveles (Ruta 0 - Caminantes)',
          descripcion: 'Estudiantes caminantes de otros niveles',
          total: otrosCaminantes.length,
          actualizados: otrosCaminantes.filter(e => e.categoriaMatricula === 'regular_actualizado').length,
          enProceso: otrosCaminantes.filter(e => e.categoriaMatricula === 'regular_en_proceso').length,
          nuevos: otrosCaminantes.filter(e => e.categoriaMatricula === 'nuevo_ingreso_cupo_otorgado' || e.categoriaMatricula === 'nuevo_ingreso_formalizado').length,
          estudiantes: otrosCaminantes
        });
      }

      rutaCaminantesItem = {
        id: 'ruta_0',
        nombre: '🚶‍♂️ Ruta 0 - A Pie / Caminantes (No Requiere Bus)',
        escuela_codigo: escEfectiva,
        escuelaNombre: escEfectiva === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar',
        chofer_nombre: 'No Aplica (Traslado Peatonal por Cuenta Propia)',
        docente_nombre: 'Acompañamiento Familiar / Representante',
        docente_telefono: '',
        activo: true,
        esRuta0: true,
        esRutaCaminantes: true,
        esRutaPendientes: false,
        totalEstudiantes: estsCaminantes.length,
        totalActualizados: estsCaminantes.filter(e => e.categoriaMatricula === 'regular_actualizado').length,
        totalEnProceso: estsCaminantes.filter(e => e.categoriaMatricula === 'regular_en_proceso').length,
        totalNuevos: estsCaminantes.filter(e => e.categoriaMatricula === 'nuevo_ingreso_cupo_otorgado' || e.categoriaMatricula === 'nuevo_ingreso_formalizado').length,
        paradas: paradasCaminantes,
        sinParadaExacta: [],
        estudiantes: estsCaminantes
      };
    }

    // ── Combinar y Ordenar las Rutas Numéricamente por su Número (Ruta 0, 1, 2, ..., 19) ──
    const listaConRutas = [...rutasMapeadas];
    if (rutaCaminantesItem) {
      listaConRutas.push(rutaCaminantesItem);
    }

    listaConRutas.sort((a, b) => {
      const numA = extraerNumeroRuta(a.nombre);
      const numB = extraerNumeroRuta(b.nombre);
      if (numA !== numB) return numA - numB;
      return a.nombre.localeCompare(b.nombre, 'es', { numeric: true });
    });

    const listaFinal = [...listaConRutas];

    // ── Categoría: Pendientes por Confirmar Modalidad de Transporte ──
    const estsPendientes = estudiantesFiltradosEscuela.filter(e => e.requiereTransporte === null);
    if (estsPendientes.length > 0) {
      listaFinal.push({
        id: 'ruta_pendientes',
        nombre: '❓ Modalidad de Transporte Pendiente por Definir',
        escuela_codigo: escEfectiva,
        escuelaNombre: escEfectiva === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar',
        chofer_nombre: 'Por Definir',
        docente_nombre: 'Coordinación y Encuesta Pendiente',
        docente_telefono: '',
        activo: true,
        esRutaCaminantes: false,
        esRutaPendientes: true,
        totalEstudiantes: estsPendientes.length,
        totalActualizados: estsPendientes.filter(e => e.categoriaMatricula === 'regular_actualizado').length,
        totalEnProceso: estsPendientes.filter(e => e.avanceEstado === 'en_proceso').length,
        totalNuevos: estsPendientes.filter(e => e.categoriaMatricula === 'nuevo_ingreso_cupo_otorgado' || e.categoriaMatricula === 'nuevo_ingreso_formalizado').length,
        paradas: [],
        sinParadaExacta: estsPendientes,
        estudiantes: estsPendientes
      });
    }

    return listaFinal;
  }, [rutasDB, paradasDB, estudiantesFiltradosEscuela, filtroEscuela]);

  // ── Ranking de Rutas con Mayor Demanda ──────────────────────────────────────
  const rankingRutas = useMemo(() => {
    return [...rutasJerarquia]
      .filter(r => !r.esRutaPendientes)
      .sort((a, b) => b.totalEstudiantes - a.totalEstudiantes);
  }, [rutasJerarquia]);

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
      else if (e.categoriaMatricula === 'nuevo_ingreso_cupo_otorgado' || e.categoriaMatricula === 'nuevo_ingreso_formalizado') mapaConteo[key].nuevos++;
      mapaConteo[key].estudiantes.push(e);
    });

    return Object.values(mapaConteo).sort((a, b) => b.total - a.total);
  }, [estudiantesFiltradosEscuela]);

  // ── Padrón General Filtrado y Paginado ───────────────────────────────────────
  const padronFiltrado = useMemo(() => {
    let result = estudiantesFiltradosEscuela;

    if (filtroCategoria !== 'todos') {
      if (filtroCategoria === 'nuevo_ingreso_cupo_otorgado' || filtroCategoria === 'nuevo_ingreso_formalizado') {
        result = result.filter(e => e.categoriaMatricula === 'nuevo_ingreso_cupo_otorgado' || e.categoriaMatricula === 'nuevo_ingreso_formalizado');
      } else {
        result = result.filter(e => e.categoriaMatricula === filtroCategoria);
      }
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

  // ── Estudiantes Pendientes por Actualizar Datos (En Proceso / Sin Iniciar) ────
  const listaRegularesPendientes = useMemo(() => {
    let list = estudiantesFiltradosEscuela.filter(e => 
      e.avanceEstado === 'en_proceso' || e.avanceEstado === 'sin_iniciar'
    );

    if (subfiltroPendientes === 'en_proceso') {
      list = list.filter(e => e.avanceEstado === 'en_proceso');
    } else if (subfiltroPendientes === 'sin_iniciar') {
      list = list.filter(e => e.avanceEstado === 'sin_iniciar');
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

  // ── Opciones únicas de Rutas (Ordenadas con Ruta 0 al inicio y numéricamente) ──
  const opcionesRutas = useMemo(() => {
    const list: string[] = [];
    const setR = new Set<string>();

    const tieneCaminantes = estudiantesFiltradosEscuela.some(e => e.requiereTransporte === false);
    if (tieneCaminantes) {
      list.push('🚶‍♂️ Ruta 0 - A Pie / Caminantes (No Requiere Bus)');
    }

    estudiantesFiltradosEscuela
      .filter(e => e.requiereTransporte === true && e.rutaNombreLimpio && e.rutaNombreLimpio !== 'Sin Ruta Asignada')
      .forEach(e => setR.add(e.rutaNombreLimpio));

    const rutasBus = Array.from(setR).sort((a, b) => {
      const numA = extraerNumeroRuta(a);
      const numB = extraerNumeroRuta(b);
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b, 'es', { numeric: true });
    });

    list.push(...rutasBus);

    const tienePendientes = estudiantesFiltradosEscuela.some(e => e.requiereTransporte === null);
    if (tienePendientes) {
      list.push('❓ Pendiente por Definir');
    }

    return list;
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
      else if (e.categoriaMatricula === 'nuevo_ingreso_cupo_otorgado' || e.categoriaMatricula === 'nuevo_ingreso_formalizado') catText = 'Nuevo Ingreso (Cupo Otorgado - Pendiente Presencial)';
      else if (e.categoriaMatricula === 'regular_en_proceso') catText = 'Regular En Proceso';
      else if (e.categoriaMatricula === 'regular_sin_iniciar') catText = 'Regular Sin Iniciar';

      const transText = e.requiereTransporte === true ? 'Sí (En Autobús)' : (e.requiereTransporte === false ? 'No (A Pie / Caminante)' : 'Pendiente por Definir');

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

    const escEfectiva = sedeRestringida || filtroEscuela;
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const escuelaNombreTag = escEfectiva === 'sb' ? 'UE_Santa_Barbara' : 'UE_Libertador_Bolivar';
    link.setAttribute('href', url);
    link.setAttribute('download', `SIGAE_Estadisticas_Transporte_${escuelaNombreTag}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (Swal) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Estadísticas de Transporte descargadas con éxito',
        showConfirmButton: false,
        timer: 2500
      });
    }
  };

  // ── Generar Resumen WhatsApp para Dirección y Coordinación ──────────────────
  const copiarResumenWhatsApp = () => {
    const escEfectiva = sedeRestringida || filtroEscuela;
    let msg = `🚍 *SIGAE - ESTADÍSTICAS OFICIALES DE TRANSPORTE Y MATRÍCULA ESCOLAR*\n`;
    msg += `🏢 *Sede:* ${escEfectiva === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar'}\n`;
    msg += `📅 *Fecha:* ${new Date().toLocaleDateString('es-VE')}\n\n`;

    msg += `📊 *MATRÍCULA ESCOLAR:* ${metrics.matriculaTotal} Estudiantes\n`;
    msg += `• 🎒 *Matrícula Regular del Plantel:* ${metrics.totalRegulares} estudiantes (${metrics.regularesActualizados} actualizados al 100%, ${metrics.totalRegularesPorActualizar} por actualizar)\n`;
    msg += `• 🌟 *Cupos Otorgados (Admisión):* ${metrics.nuevosFormalizados} (Aspirantes con cupo otorgado, pendientes de formalización presencial en escuela)\n`;

    msg += `\n🚌 *MODALIDAD DE TRASLADO Y TRANSPORTE ESCOLAR:*\n`;
    msg += `• 🚍 *En Autobús (Requieren Bus):* ${metrics.transporteConfirmado} (${metrics.transporteConfirmado100} con ficha 100% + ${metrics.transporteConfirmadoEnProceso} en proceso)\n`;
    msg += `• 🚶‍♂️ *Ruta 0 (A Pie / Caminantes):* ${metrics.transporteNoRequiere} (${metrics.caminantes100} con ficha 100% + ${metrics.caminantesEnProceso} en proceso)\n`;
    msg += `• ❓ *Sin Definir (Sin Iniciar Actualización):* ${metrics.transportePendienteDefinir}\n`;
    msg += `• 📋 *Conciliación Avance Fichas:* ${metrics.totalActualizados} al 100% | ${metrics.totalEnProceso} En Proceso | ${metrics.totalSinIniciar} Sin Iniciar (${metrics.totalPorActualizar} por culminar)\n`;
    msg += `• 🚏 *Rutas Activas de Autobús:* ${metrics.rutasConDemanda}\n`;
    msg += `• 📍 *Paradas Activas de Autobús:* ${metrics.paradasConDemanda}\n\n`;

    msg += `📋 *DESGLOSE DE RUTAS Y MODALIDADES (Ordenadas Numéricamente):*\n`;
    rutasJerarquia.forEach((r, i) => {
      msg += `${i + 1}. *${r.nombre}*: *${r.totalEstudiantes} estudiantes* (Act: ${r.totalActualizados} | En Proc: ${r.totalEnProceso} | Nuevos: ${r.totalNuevos})\n`;
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
              <i className="bi bi-bar-chart-fill text-primary"></i>
              <span>Estadísticas de Transporte</span>
            </h4>
            <span className="text-muted small">
              Balance integral de demanda de rutas, paradas y matrícula escolar real (Regulares y Nuevos Ingresos)
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



      {/* ── BARRA DE TELEMETRÍA: MATRÍCULA ESCOLAR REAL (KPIS) ── */}
      <div className="row g-2 g-md-3 mb-3">
        {/* KPI 1: Matrícula Regular Activa */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3 h-100" style={{ borderLeft: '5px solid #2563eb' }}>
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-primary flex-shrink-0" 
              style={{ width: '48px', height: '48px', background: '#eff6ff', fontSize: '1.4rem' }}
            >
              <i className="bi bi-mortarboard-fill"></i>
            </div>
            <div className="min-w-0">
              <div className="fw-black text-dark fs-4 line-height-1">{metrics.totalRegulares}</div>
              <div className="text-muted small fw-semibold" style={{ fontSize: '0.75rem' }}>Matrícula Regular del Plantel</div>
              <div className="text-primary small fw-bold" style={{ fontSize: '0.7rem' }}>
                {metrics.regularesActualizados} Actualizados | {metrics.totalRegularesPorActualizar} Por Actualizar
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Cupos Otorgados (Admisión) */}
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
                <span className="badge bg-warning-subtle text-warning-emphasis rounded-pill fw-bold" style={{ fontSize: '0.65rem' }}>
                  Cupos Otorgados
                </span>
              </div>
              <div className="text-muted small fw-semibold" style={{ fontSize: '0.75rem' }}>Nuevos Ingresos (Admisión)</div>
              <div className="text-warning-emphasis small fw-bold" style={{ fontSize: '0.7rem' }}>
                Pendientes de formalización presencial en escuela
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Demanda de Transporte en Autobús */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3 h-100" style={{ borderLeft: '5px solid #0284c7' }}>
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-info flex-shrink-0" 
              style={{ width: '48px', height: '48px', background: '#f0f9ff', color: '#0284c7', fontSize: '1.4rem' }}
            >
              <i className="bi bi-bus-front-fill text-primary"></i>
            </div>
            <div className="min-w-0">
              <div className="fw-black text-dark fs-4 line-height-1 d-flex align-items-center gap-2">
                <span>{metrics.transporteConfirmado}</span>
                <span className="badge bg-primary-subtle text-primary rounded-pill fw-bold" style={{ fontSize: '0.68rem' }}>
                  {metrics.transportePct}%
                </span>
              </div>
              <div className="text-muted small fw-semibold" style={{ fontSize: '0.75rem' }}>Pasajeros en Autobús</div>
              <div className="text-primary small fw-semibold" style={{ fontSize: '0.7rem' }}>
                <b>{metrics.transporteConfirmado100}</b> al 100% | <b>{metrics.transporteConfirmadoEnProceso}</b> en proc. ({metrics.rutasConDemanda} Rutas)
              </div>
            </div>
          </div>
        </div>

        {/* KPI 4: Ruta 0 • Caminantes / A Pie (No Requieren Bus) */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="p-3 bg-white rounded-4 border shadow-xs d-flex align-items-center gap-3 h-100" style={{ borderLeft: '5px solid #16a34a' }}>
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-success flex-shrink-0" 
              style={{ width: '48px', height: '48px', background: '#f0fdf4', fontSize: '1.4rem' }}
            >
              <i className="bi bi-person-walking"></i>
            </div>
            <div className="min-w-0">
              <div className="fw-black text-dark fs-4 line-height-1 d-flex align-items-center gap-2">
                <span>{metrics.transporteNoRequiere}</span>
                <span className="badge bg-success-subtle text-success rounded-pill fw-bold" style={{ fontSize: '0.68rem' }}>
                  {metrics.caminantesPct}%
                </span>
              </div>
              <div className="text-muted small fw-semibold" style={{ fontSize: '0.75rem' }}>
                Ruta 0 • A Pie / Caminantes
              </div>
              <div className="text-success small fw-semibold" style={{ fontSize: '0.7rem' }}>
                <b>{metrics.caminantes100}</b> al 100% | <b>{metrics.caminantesEnProceso}</b> en proc. (Sin Bus)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BARRA SECUNDARIA: MODALIDAD DE ASISTENCIA & CONCILIACIÓN INSTITUCIONAL ── */}
      <div className="p-3 bg-light rounded-4 border mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <span className="fw-bold text-dark small d-flex align-items-center gap-1.5">
            <i className="bi bi-compass-fill text-primary"></i>Modalidad de Asistencia:
          </span>
          <span className="badge rounded-pill bg-white text-primary border shadow-xs px-2.5 py-1 fw-bold" style={{ fontSize: '0.75rem' }}>
            🚌 En Autobús: <b>{metrics.transporteConfirmado}</b> <span className="fw-normal text-muted">({metrics.transporteConfirmado100} conf. + {metrics.transporteConfirmadoEnProceso} proc.)</span>
          </span>
          <span className="badge rounded-pill bg-white text-success border shadow-xs px-2.5 py-1 fw-bold" style={{ fontSize: '0.75rem' }}>
            🚶‍♂️ Ruta 0 (A Pie): <b>{metrics.transporteNoRequiere}</b> <span className="fw-normal text-muted">({metrics.caminantes100} conf. + {metrics.caminantesEnProceso} proc.)</span>
          </span>
          <span className="badge rounded-pill bg-white text-danger border shadow-xs px-2.5 py-1 fw-semibold" style={{ fontSize: '0.75rem' }} title="Estudiantes Sin Iniciar (0% de avance): no han completado ninguna sección">
            ❓ Sin Definir: <b>{metrics.transportePendienteDefinir}</b> <span className="fw-normal text-danger opacity-75">({metrics.totalSinIniciar} Sin Iniciar)</span>
          </span>
        </div>

        <div className="d-flex align-items-center gap-2 text-muted small flex-wrap">
          <span className="badge bg-white text-dark border px-2 py-1">
            <b>{metrics.rutasConDemanda}</b> Rutas Bus + Ruta 0
          </span>
          <span className="badge bg-white text-dark border px-2 py-1">
            <b>{metrics.paradasConDemanda}</b> Paradas
          </span>
          <span className="badge bg-purple-subtle border px-2.5 py-1" style={{ background: '#f5f3ff', color: '#6d28d9', borderColor: '#ddd6fe' }} title="Conciliación Oficial Chamilo: Actualizados 100% + En Proceso + Sin Iniciar">
            Fichas Chamilo: <b>{metrics.totalActualizados} al 100%</b> | <b>{metrics.totalEnProceso} En Proc.</b> | <b>{metrics.totalSinIniciar} Sin Iniciar</b> ({metrics.totalPorActualizar} por culminar)
          </span>
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
              <i className="bi bi-trophy-fill"></i>
              <span>Ranking de Rutas y Paradas ({rankingRutas.length} / {rankingParadas.length})</span>
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
              <span>Por Actualizar ({metrics.totalPorActualizar})</span>
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
                          background: ruta.esRutaCaminantes ? '#f0fdf4' : (ruta.esRutaPendientes ? '#fff1f2' : (ruta.activo ? '#eff6ff' : '#f1f5f9')), 
                          color: ruta.esRutaCaminantes ? '#16a34a' : (ruta.esRutaPendientes ? '#e11d48' : (ruta.activo ? '#2563eb' : '#94a3b8')),
                          fontSize: '1.25rem',
                          border: `1px solid ${ruta.esRutaCaminantes ? '#bbf7d0' : (ruta.esRutaPendientes ? '#fecdd3' : '#e2e8f0')}`
                        }}
                      >
                        <i className={`bi ${ruta.esRutaCaminantes ? 'bi-person-walking' : (ruta.esRutaPendientes ? 'bi-question-circle-fill' : 'bi-bus-front-fill')}`}></i>
                      </div>

                      <div className="min-w-0">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <h5 className="fw-bold text-dark mb-0" style={{ fontSize: '1.05rem' }}>
                            {ruta.nombre}
                          </h5>
                          {ruta.esRutaCaminantes ? (
                            <span className="badge rounded-pill fw-bold px-2 py-0.5" style={{ fontSize: '0.68rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                              🚶‍♂️ TRASLADO A PIE • No Requiere Bus
                            </span>
                          ) : ruta.esRutaPendientes ? (
                            <span className="badge rounded-pill fw-bold px-2 py-0.5" style={{ fontSize: '0.68rem', background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' }}>
                              ❓ POR ENCUESTAR • Sin Modalidad Asignada
                            </span>
                          ) : (
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
                          )}
                          {!ruta.activo && (
                            <span className="badge bg-secondary rounded-pill" style={{ fontSize: '0.65rem' }}>Inactiva</span>
                          )}
                        </div>

                        <div className="d-flex align-items-center gap-3 text-muted small mt-1 flex-wrap" style={{ fontSize: '0.75rem' }}>
                          {ruta.esRutaCaminantes ? (
                            <span>
                              <i className="bi bi-geo-alt-fill me-1 text-success"></i>
                              Modalidad: <b>Caminantes por cuenta propia / residencia adyacente</b>
                            </span>
                          ) : ruta.esRutaPendientes ? (
                            <span>
                              <i className="bi bi-telephone-fill me-1 text-danger"></i>
                              Estado: <b>Pendiente de encuesta para definir si va en autobús o a pie</b>
                            </span>
                          ) : (
                            <>
                              <span>
                                <i className="bi bi-person-badge me-1 text-primary"></i>
                                Chofer: <b>{ruta.chofer_nombre}</b>
                              </span>
                              <span>
                                <i className="bi bi-person-check me-1 text-success"></i>
                                Docente: <b>{ruta.docente_nombre}</b> {ruta.docente_telefono && `(${ruta.docente_telefono})`}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Badges de Totales y Controles */}
                    <div className="d-flex align-items-center gap-2 flex-wrap ms-auto">
                      <div className="d-flex align-items-center gap-1.5 flex-wrap">
                        <span 
                          className="badge rounded-pill px-3 py-1.5 fw-bold"
                          style={{ 
                            background: ruta.esRutaCaminantes ? '#f0fdf4' : (ruta.esRutaPendientes ? '#fff1f2' : '#eff6ff'), 
                            color: ruta.esRutaCaminantes ? '#15803d' : (ruta.esRutaPendientes ? '#be123c' : '#1d4ed8'), 
                            border: `1px solid ${ruta.esRutaCaminantes ? '#bbf7d0' : (ruta.esRutaPendientes ? '#fecdd3' : '#bfdbfe')}`, 
                            fontSize: '0.8rem' 
                          }}
                          title={ruta.esRutaCaminantes ? 'Total de estudiantes que van caminando' : (ruta.esRutaPendientes ? 'Estudiantes sin modalidad de transporte definida' : 'Total de estudiantes que abordan esta ruta')}
                        >
                          <i className={`bi ${ruta.esRutaCaminantes ? 'bi-person-walking' : (ruta.esRutaPendientes ? 'bi-question-circle-fill' : 'bi-people-fill')} me-1.5`}></i>
                          <b>{ruta.totalEstudiantes}</b> {ruta.esRutaCaminantes ? 'Caminantes' : (ruta.esRutaPendientes ? 'Por Definir' : 'Pasajeros')}
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
                          title="Nuevos Ingresos con Cupo Otorgado"
                        >
                          <i className="bi bi-star me-1"></i>{ruta.totalNuevos} Nuevos
                        </span>
                      </div>

                      <button
                        className={`btn btn-sm rounded-pill px-2.5 py-1 fw-bold d-flex align-items-center gap-1 ${ruta.esRutaCaminantes ? 'btn-outline-success' : (ruta.esRutaPendientes ? 'btn-outline-danger' : 'btn-outline-primary')}`}
                        style={{ fontSize: '0.72rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalData({
                            titulo: `${ruta.esRutaCaminantes ? 'Estudiantes Caminantes (A Pie)' : (ruta.esRutaPendientes ? 'Estudiantes con Modalidad de Transporte por Definir' : `Estudiantes de: ${ruta.nombre}`)}`,
                            subtitulo: `Sede: ${ruta.escuelaNombre} | ${ruta.esRutaCaminantes ? 'Se trasladan a pie por cuenta propia' : (ruta.esRutaPendientes ? 'Requieren contacto para encuestar transporte' : `Chofer: ${ruta.chofer_nombre} | Docente: ${ruta.docente_nombre}`)}`,
                            escuela: ruta.escuela_codigo,
                            estudiantes: ruta.estudiantes
                          });
                        }}
                        title="Ver listado nominal"
                      >
                        <i className="bi bi-eye-fill"></i>
                        <span>Ver {ruta.esRutaCaminantes ? 'Caminantes' : (ruta.esRutaPendientes ? 'Casos' : 'Lista')} ({ruta.totalEstudiantes})</span>
                      </button>

                      <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} text-muted ms-1`}></i>
                    </div>
                  </div>

                  {/* Cuerpo Expandible: Lista de Paradas */}
                  {isExpanded && (
                    <div className="p-3 bg-white">
                      {ruta.paradas.length === 0 ? (
                        ruta.esRutaPendientes ? (
                          <div className="table-responsive">
                            <div className="alert alert-danger py-2 px-3 small d-flex align-items-center justify-content-between mb-2">
                              <span className="d-flex align-items-center gap-2">
                                <i className="bi bi-exclamation-octagon-fill text-danger fs-5"></i>
                                <span>Estos <b>{ruta.estudiantes.length} estudiantes</b> aún no han indicado si requieren bus o asisten a pie. Comuníquese para cerrar su asignación:</span>
                              </span>
                            </div>
                            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                              <thead className="table-light text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>
                                <tr>
                                  <th style={{ width: '40px' }} className="text-center">#</th>
                                  <th>Estudiante</th>
                                  <th>Cédula</th>
                                  <th>Grado</th>
                                  <th>Representante</th>
                                  <th>Teléfono</th>
                                  <th className="text-end">Contactar</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ruta.estudiantes.map((e, idx) => {
                                  const cleanPhone = (e.representanteTelefono || '').replace(/\D/g, '');
                                  const waLink = cleanPhone ? (cleanPhone.startsWith('58') ? `https://wa.me/${cleanPhone}` : `https://wa.me/58${cleanPhone.replace(/^0+/, '')}`) : null;
                                  return (
                                    <tr key={e.id}>
                                      <td className="text-center fw-bold text-muted">{idx + 1}</td>
                                      <td className="fw-bold text-dark">{e.nombreCompleto}</td>
                                      <td className="text-muted">{e.cedula}</td>
                                      <td><span className="badge bg-light text-dark border">{e.grado}</span></td>
                                      <td>{e.representanteNombre}</td>
                                      <td>{e.representanteTelefono || 'Sin teléfono'}</td>
                                      <td className="text-end">
                                        {waLink && (
                                          <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-success rounded-pill px-2.5 py-0.5" style={{ fontSize: '0.72rem' }}>
                                            <i className="bi bi-whatsapp me-1"></i>WhatsApp
                                          </a>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-3 text-center text-muted small bg-light rounded-3">
                            <i className="bi bi-info-circle me-1"></i> Esta ruta aún no tiene paradas registradas en su recorrido.
                          </div>
                        )
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                            <thead className="table-light text-muted text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                              <tr>
                                <th style={{ width: '50px' }} className="text-center">#</th>
                                <th>{ruta.esRutaCaminantes ? 'Nivel / Agrupación Peatonal' : 'Parada de Abordaje'}</th>
                                <th>{ruta.esRutaCaminantes ? 'Observaciones de Traslado' : 'Sector / Ubicación'}</th>
                                <th className="text-center">{ruta.esRutaCaminantes ? 'Total Caminantes' : 'Total Pasajeros'}</th>
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
                                      <i className={`bi ${ruta.esRutaCaminantes ? 'bi-person-walking text-success' : 'bi-geo-alt-fill text-danger'}`} style={{ fontSize: '0.85rem' }}></i>
                                      <span>{p.nombre_parada}</span>
                                    </div>
                                  </td>
                                  <td className="text-muted small">{p.descripcion || '—'}</td>
                                  <td className="text-center">
                                    <span 
                                      className={`badge rounded-pill px-2.5 py-1 fw-bold ${p.total > 0 ? (ruta.esRutaCaminantes ? 'bg-success text-white' : 'bg-primary text-white shadow-xs') : 'bg-light text-muted border'}`}
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
                                        className={`btn btn-sm rounded-pill px-2 py-0.5 fw-bold d-flex align-items-center gap-1 ${ruta.esRutaCaminantes ? 'btn-outline-success' : 'btn-outline-primary'}`}
                                        style={{ fontSize: '0.7rem' }}
                                        onClick={() => {
                                          setModalData({
                                            titulo: `${ruta.esRutaCaminantes ? 'Caminantes en: ' : 'Estudiantes en Parada: '} ${p.nombre_parada}`,
                                            subtitulo: `${ruta.nombre} (${ruta.escuelaNombre})`,
                                            escuela: ruta.escuela_codigo,
                                            estudiantes: p.estudiantes
                                          });
                                        }}
                                        title={ruta.esRutaCaminantes ? 'Ver lista de caminantes' : 'Ver lista de estudiantes de esta parada'}
                                      >
                                        <i className="bi bi-people-fill"></i>
                                        <span>Estudiantes</span>
                                      </button>

                                      <button
                                        disabled={p.total === 0}
                                        className="btn btn-sm btn-outline-success rounded-pill px-2 py-0.5 fw-bold d-flex align-items-center gap-1"
                                        style={{ fontSize: '0.7rem' }}
                                        onClick={() => copiarListaParada(p, ruta.nombre)}
                                        title="Copiar lista para WhatsApp"
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

                      {/* Aclaratoria Conciliatoria si es la categoría de pendientes */}
                      {ruta.esRutaPendientes && (
                        <div className="mb-3 p-3 bg-danger-subtle border border-danger border-opacity-25 rounded-3 d-flex align-items-start gap-2.5">
                          <i className="bi bi-info-circle-fill text-danger fs-5 mt-0.5"></i>
                          <div className="small text-danger-emphasis">
                            <div className="fw-bold mb-1">
                              Conciliación de {ruta.totalEstudiantes} Estudiantes con Modalidad de Transporte Sin Definir:
                            </div>
                            <div>
                              Estos <b>{ruta.totalEstudiantes} estudiantes</b> corresponden a los alumnos clasificados como <b>"Sin Iniciar"</b> (0% de avance en ficha), quienes aún no han seleccionado si van en autobús o a pie por no haber ingresado a actualizar sus datos.
                              <br className="mb-1" />
                              <b>¿Por qué no son 50?</b> Porque los <b>35 estudiantes "En Proceso"</b> ya indicaron preliminarmente su modalidad en el formulario digital (27 en autobús y 8 en Ruta 0 a pie), aunque aún no han culminado el 100% de las demás secciones de su ficha. En total, hay <b>50 estudiantes con actualización pendiente</b> ({ruta.totalEstudiantes} sin iniciar + 35 en proceso).
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Aviso si hay estudiantes de esta ruta con paradas pendientes de homologación */}
                      {ruta.sinParadaExacta.length > 0 && !ruta.esRutaPendientes && (
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
          PESTAÑA 2: RANKINGS DE DEMANDA (POR RUTAS Y POR PARADAS)
      ══════════════════════════════════════════════════════════════════════════ */}
      {!loading && tabActiva === 'ranking' && (
        <div className="bg-white rounded-4 border shadow-xs p-3 p-md-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 pb-3 border-bottom">
            <div>
              <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-trophy-fill text-warning"></i>
                <span>Ranking de Demanda {tipoRanking === 'rutas' ? 'por Rutas Institucionales' : 'por Paradas Oficiales'}</span>
              </h5>
              <p className="text-muted small mb-0">
                {tipoRanking === 'rutas'
                  ? 'Análisis comparativo de volumen de pasajeros por ruta de transporte escolar para dimensionar unidades, choferes y docentes.'
                  : 'Puntos de mayor afluencia estudiantil para dimensionar la capacidad de las unidades y optimizar el tiempo de recorrido.'}
              </p>
            </div>

            {/* Selector de Tipo de Ranking: Rutas vs Paradas */}
            <div className="d-flex align-items-center gap-2">
              <div className="btn-group p-1 bg-light rounded-pill border shadow-xs" role="group">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-bold transition-all ${tipoRanking === 'rutas' ? 'btn-primary text-white shadow-xs' : 'btn-white text-muted border-0'}`}
                  style={{ fontSize: '0.8rem' }}
                  onClick={() => setTipoRanking('rutas')}
                >
                  <i className="bi bi-signpost-2-fill me-1.5"></i>
                  Ranking por Rutas ({rankingRutas.length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-bold transition-all ${tipoRanking === 'paradas' ? 'btn-primary text-white shadow-xs' : 'btn-white text-muted border-0'}`}
                  style={{ fontSize: '0.8rem' }}
                  onClick={() => setTipoRanking('paradas')}
                >
                  <i className="bi bi-geo-alt-fill me-1.5"></i>
                  Ranking por Paradas ({rankingParadas.length})
                </button>
              </div>
            </div>
          </div>

          {/* ── SUB-VISTA 1: RANKING POR RUTAS ── */}
          {tipoRanking === 'rutas' && (
            rankingRutas.length === 0 ? (
              <div className="p-4 text-center text-muted">No hay rutas configuradas o con demanda en esta sede.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.82rem' }}>
                  <thead className="table-light text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>
                    <tr>
                      <th style={{ width: '45px' }} className="text-center">Pos.</th>
                      <th>Ruta de Transporte</th>
                      <th>Personal Asignado</th>
                      <th className="text-center">Paradas con Demanda</th>
                      <th style={{ width: '250px' }}>Volumen y Distribución</th>
                      <th className="text-center">Total Pasajeros</th>
                      <th className="text-center">% Cuota Demanda</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingRutas.map((item, idx) => {
                      const maxRutaVal = rankingRutas[0]?.totalEstudiantes || 1;
                      const pctBar = maxRutaVal > 0 ? Math.round((item.totalEstudiantes / maxRutaVal) * 100) : 0;
                      const pctTotalDemanda = metrics.transporteConfirmado > 0 
                        ? ((item.totalEstudiantes / metrics.transporteConfirmado) * 100).toFixed(1)
                        : '0';
                      const paradasConDemanda = item.paradas.filter((p: any) => p.total > 0).length;

                      return (
                        <tr key={item.id} className={item.esRutaCaminantes ? 'table-light' : ''}>
                          <td className="text-center fw-black">
                            {idx === 0 && <span className="badge bg-warning text-dark rounded-circle p-1.5 fs-6 shadow-xs">🥇</span>}
                            {idx === 1 && <span className="badge bg-secondary text-white rounded-circle p-1.5 fs-6 shadow-xs">🥈</span>}
                            {idx === 2 && <span className="badge text-dark rounded-circle p-1.5 fs-6 shadow-xs" style={{ background: '#fed7aa' }}>🥉</span>}
                            {idx > 2 && <span className="text-muted fw-bold">#{idx + 1}</span>}
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div 
                                className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{ 
                                  width: '36px', 
                                  height: '36px', 
                                  background: item.esRutaCaminantes ? '#f0fdf4' : '#eff6ff',
                                  color: item.esRutaCaminantes ? '#16a34a' : '#2563eb',
                                  fontSize: '1.1rem'
                                }}
                              >
                                <i className={item.esRutaCaminantes ? 'bi bi-person-walking' : 'bi bi-bus-front-fill'}></i>
                              </div>
                              <div>
                                <div className="fw-bold text-dark d-flex align-items-center gap-1.5">
                                  <span>{item.nombre}</span>
                                  {item.esRutaCaminantes && (
                                    <span className="badge bg-success-subtle text-success rounded-pill px-2 py-0.5" style={{ fontSize: '0.65rem' }}>
                                      A Pie / Sin Bus
                                    </span>
                                  )}
                                </div>
                                <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                                  Sede: {item.escuelaNombre}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            {item.esRutaCaminantes ? (
                              <span className="badge bg-light text-muted border px-2 py-1">No aplica (traslado peatonal)</span>
                            ) : (
                              <div className="small">
                                <div className="d-flex align-items-center gap-1 text-dark fw-semibold">
                                  <i className="bi bi-person-badge text-primary" style={{ fontSize: '0.75rem' }}></i>
                                  <span>Chofer: <b>{item.chofer_nombre}</b></span>
                                </div>
                                <div className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.72rem' }}>
                                  <i className="bi bi-person-heart text-secondary" style={{ fontSize: '0.75rem' }}></i>
                                  <span>Docente: {item.docente_nombre}</span>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="text-center">
                            {item.esRutaCaminantes ? (
                              <span className="badge bg-light text-dark border px-2 py-1">3 Niveles Académicos</span>
                            ) : (
                              <div className="d-flex flex-column align-items-center">
                                <span className="badge bg-light text-dark border px-2 py-1 fw-bold">
                                  {paradasConDemanda} {paradasConDemanda === 1 ? 'parada activa' : 'paradas activas'}
                                </span>
                                {item.paradas.length > 0 && (
                                  <span className="text-muted extra-small" style={{ fontSize: '0.68rem' }}>
                                    de {item.paradas.length} configuradas
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-1">
                              <div className="progress" style={{ height: '9px', borderRadius: '4px' }}>
                                <div 
                                  className={`progress-bar ${item.esRutaCaminantes ? 'bg-success' : 'bg-primary'}`} 
                                  role="progressbar" 
                                  style={{ width: `${pctBar}%` }} 
                                  aria-valuenow={pctBar} 
                                  aria-valuemin={0} 
                                  aria-valuemax={100}
                                ></div>
                              </div>
                              <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.68rem' }}>
                                <span>Act: <b>{item.totalActualizados}</b></span>
                                <span>En Proc: <b>{item.totalEnProceso}</b></span>
                                <span>Nuevos: <b>{item.totalNuevos}</b></span>
                              </div>
                            </div>
                          </td>
                          <td className="text-center">
                            <span 
                              className={`badge rounded-pill px-3 py-1.5 fw-black fs-6 shadow-xs ${item.esRutaCaminantes ? 'bg-success text-white' : 'bg-primary text-white'}`}
                            >
                              {item.totalEstudiantes}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-light text-dark border px-2 py-1 fw-bold" style={{ fontSize: '0.75rem' }}>
                              {item.esRutaCaminantes ? `${metrics.caminantesPct}% Matrícula` : `${pctTotalDemanda}% Bus`}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-1 fw-bold d-flex align-items-center gap-1 ms-auto shadow-xs"
                              style={{ fontSize: '0.72rem' }}
                              onClick={() => {
                                setModalData({
                                  titulo: `Estudiantes en: ${item.nombre}`,
                                  subtitulo: `Sede: ${item.escuelaNombre} | ${item.esRutaCaminantes ? 'Ruta 0 - Caminantes (A pie)' : `Chofer: ${item.chofer_nombre} | Docente: ${item.docente_nombre}`}`,
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
            )
          )}

          {/* ── SUB-VISTA 2: RANKING POR PARADAS ── */}
          {tipoRanking === 'paradas' && (
            rankingParadas.length === 0 ? (
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
            )
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
            <div className="col-6 col-md-2">
              <select
                className="form-select form-select-sm"
                value={filtroCategoria}
                onChange={(e) => { setFiltroCategoria(e.target.value); setPaginaActual(1); }}
              >
                <option value="todos">Matrícula ({estudiantesFiltradosEscuela.length})</option>
                <option value="regular_actualizado">Regulares Actualizados ({metrics.regularesActualizados})</option>
                <option value="nuevo_ingreso_cupo_otorgado">Cupos Otorgados ({metrics.nuevosFormalizados})</option>
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
                <option value="todos">Todos (Modalidad)</option>
                <option value="si">🚌 En Autobús ({metrics.transporteConfirmado})</option>
                <option value="no">🚶‍♂️ Ruta 0 • A Pie ({metrics.transporteNoRequiere})</option>
                <option value="pendiente">❓ Sin Definir ({metrics.transportePendienteDefinir})</option>
              </select>
            </div>

            {/* Filtro por Ruta */}
            <div className="col-6 col-md-2">
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
                          {(e.categoriaMatricula === 'nuevo_ingreso_cupo_otorgado' || e.categoriaMatricula === 'nuevo_ingreso_formalizado') && (
                            <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis border border-warning fw-bold px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                              <i className="bi bi-star-fill me-1"></i>Cupo Otorgado
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
                              <i className="bi bi-bus-front me-1"></i>En Autobús
                            </span>
                          )}
                          {e.requiereTransporte === false && (
                            <span className="badge rounded-pill bg-success-subtle text-success border border-success fw-bold px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                              <i className="bi bi-person-walking me-1"></i>A Pie / Caminante
                            </span>
                          )}
                          {e.requiereTransporte === null && (
                            <span className="badge rounded-pill bg-danger-subtle text-danger border border-danger fw-semibold px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                              ❓ Por Confirmar
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
                          ) : e.requiereTransporte === false ? (
                            <div>
                              <span className="text-success fw-semibold small d-flex align-items-center gap-1">
                                <i className="bi bi-person-walking"></i>Caminante (A Pie)
                              </span>
                              {e.direccion && (
                                <div className="text-muted text-truncate" style={{ fontSize: '0.7rem', maxWidth: '200px' }} title={e.direccion}>
                                  📍 {e.direccion}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-danger small">Pendiente encuesta</span>
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
                <span>Estudiantes Pendientes por Actualizar Datos</span>
              </h5>
              <p className="text-muted small mb-0">
                Padrón de estudiantes activos en la institución que aún no han cerrado o iniciado su ficha en el portal.
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
                Todos ({metrics.totalPorActualizar})
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 fw-bold ${subfiltroPendientes === 'en_proceso' ? 'btn-danger text-white' : 'btn-light text-muted'}`}
                style={{ fontSize: '0.78rem' }}
                onClick={() => setSubfiltroPendientes('en_proceso')}
              >
                ⏳ En Proceso ({metrics.totalEnProceso})
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 fw-bold ${subfiltroPendientes === 'sin_iniciar' ? 'btn-danger text-white' : 'btn-light text-muted'}`}
                style={{ fontSize: '0.78rem' }}
                onClick={() => setSubfiltroPendientes('sin_iniciar')}
              >
                ⚠️ Sin Iniciar ({metrics.totalSinIniciar})
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
                        {e.avanceEstado === 'en_proceso' ? (
                          <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis border border-warning fw-bold px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
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
          MODAL DETALLADO DE ESTUDIANTES DE UNA PARADA O RUTA (MONTADO EN PORTAL)
      ══════════════════════════════════════════════════════════════════════════ */}
      {modalData && createPortal(
        <div 
          className="modal fade show d-block" 
          tabIndex={-1} 
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.75)', 
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            overflow: 'hidden'
          }}
          onClick={() => { setModalData(null); setFiltroModal(''); }}
        >
          <div 
            className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg m-0 w-100"
            style={{ 
              maxWidth: '900px',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 rounded-4 shadow-2xl overflow-hidden d-flex flex-column" style={{ maxHeight: '92vh' }}>
              {/* Header del Modal */}
              <div className="modal-header bg-primary text-white p-3 flex-shrink-0">
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
              <div className="p-3 bg-light border-bottom d-flex flex-wrap align-items-center justify-content-between gap-2 flex-shrink-0">
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
              <div className="modal-body p-0 flex-grow-1" style={{ maxHeight: 'calc(92vh - 145px)', overflowY: 'auto' }}>
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
                        <thead className="table-light text-muted text-uppercase" style={{ fontSize: '0.68rem', position: 'sticky', top: 0, zIndex: 2 }}>
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
              <div className="modal-footer bg-light p-2.5 d-flex justify-content-between align-items-center flex-shrink-0">
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
        </div>,
        document.body
      )}
    </div>
  );
};
