import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { usePermisos } from '../hooks/usePermisos';
import { 
  ChamiloStatCard,
  IconoEstudiante,
  IconoUnidadTransporte,
  IconoUnidadPersonal,
  IconoSeguridadRol,
  IconoMatriculaCenso,
  IconoAvisosRadar,
  IconoPersonalDocente,
  IconoSolicitudCupos
} from '../components/chamilo';
import {
  ChamiloDonutChart,
  ChamiloAttendanceBars,
  ChamiloRutogramaVisual,
  ChamiloSecurityShield,
  ChamiloSparkline,
  type RouteStop
} from '../components/graficos';

const RUTAS_FALLBACK_SB = [
  { id: 'c612ebbb-8725-4ee0-b5f1-a773c86c1679', escuela_codigo: 'sb', nombre: 'Ruta 1 - Campo Rojo', paradas_json: ['p-sb-1', 'p-sb-2', 'p-sb-3'], unidad_modelo: 'Unidad 02 • Ford Interceptor', chofer_nombre: 'Carlos Mendoza' },
  { id: 'c5885d27-c339-40b6-ae8e-c17aa5ddfe3b', escuela_codigo: 'sb', nombre: 'Ruta 5 - La Esmeralda', paradas_json: ['p-sb-4', 'p-sb-5', 'p-sb-6'], unidad_modelo: 'Unidad 04 • Encava', chofer_nombre: 'José Rodríguez' },
  { id: '9b66e5b7-94ef-4bf1-830e-3bfd7292e483', escuela_codigo: 'sb', nombre: 'Ruta 8 - Casupal - El Tejero', paradas_json: ['p-sb-7', 'p-sb-8', 'p-sb-9'], unidad_modelo: 'Unidad 06 • Yutong', chofer_nombre: 'Manuel Gómez' },
  { id: 'c131ad90-7398-4a48-bb42-390d53b3a1d1', escuela_codigo: 'sb', nombre: 'Ruta 2 - Osiris - El Samán', paradas_json: ['p-sb-10', 'p-sb-11', 'p-sb-12'], unidad_modelo: 'Unidad 03 • Encava', chofer_nombre: 'Pedro Pérez' }
];

const RUTAS_FALLBACK_LB = [
  { id: '223d96b2-23ce-4cfc-93a4-8793e0a08640', escuela_codigo: 'lb', nombre: 'Ruta 1 - Puertas del Sur', paradas_json: ['p-lb-1', 'p-lb-2', 'p-lb-3'], unidad_modelo: 'Unidad 01 • Yutong', chofer_nombre: 'Ramón Silva' },
  { id: 'd6a021ee-55f5-45ad-a50a-fb7338e6ace5', escuela_codigo: 'lb', nombre: 'Ruta 2 - Las Flores', paradas_json: ['p-lb-4', 'p-lb-5', 'p-lb-6'], unidad_modelo: 'Unidad 05 • Encava', chofer_nombre: 'Luis Morales' },
  { id: '430ec756-9117-4eb6-bfed-90d10fc193a6', escuela_codigo: 'lb', nombre: 'Ruta 4 - Las Vírgenes', paradas_json: ['p-lb-7', 'p-lb-8', 'p-lb-9'], unidad_modelo: 'Unidad 07 • Yutong', chofer_nombre: 'Andrés Rivas' },
  { id: 'e88a4901-3892-470a-8961-7dc346eef0db', escuela_codigo: 'lb', nombre: 'Ruta 19 - Campo de Miraflores', paradas_json: ['p-lb-10', 'p-lb-11', 'p-lb-12'], unidad_modelo: 'Unidad 09 • Shuttle', chofer_nombre: 'Rafael Torres' }
];

const PARADAS_FALLBACK: Record<string, { id: string; nombre_parada: string; hora_estimada: string; sector?: string }> = {
  'p-sb-1': { id: 'p-sb-1', nombre_parada: 'Campo Rojo Garita', hora_estimada: '06:15 AM', sector: 'Campo Rojo' },
  'p-sb-2': { id: 'p-sb-2', nombre_parada: 'Plaza Hugo Chávez', hora_estimada: '06:30 AM', sector: 'Casco Central' },
  'p-sb-3': { id: 'p-sb-3', nombre_parada: 'Sector Potrero', hora_estimada: '06:45 AM', sector: 'Potrero' },
  'p-sb-4': { id: 'p-sb-4', nombre_parada: 'La Esmeralda Cancha', hora_estimada: '06:20 AM', sector: 'La Esmeralda' },
  'p-sb-5': { id: 'p-sb-5', nombre_parada: 'Menca de Leoni', hora_estimada: '06:35 AM', sector: 'Menca' },
  'p-sb-6': { id: 'p-sb-6', nombre_parada: 'Banco del Sur', hora_estimada: '06:50 AM', sector: 'Av. Bolívar' },
  'p-sb-7': { id: 'p-sb-7', nombre_parada: 'El Tanque', hora_estimada: '06:20 AM', sector: 'El Tejero' },
  'p-sb-8': { id: 'p-sb-8', nombre_parada: 'Tejero Viejo', hora_estimada: '06:35 AM', sector: 'Villas El Tejar' },
  'p-sb-9': { id: 'p-sb-9', nombre_parada: 'Redoma Sucre', hora_estimada: '06:50 AM', sector: 'Av. Sucre' },
  'p-sb-10': { id: 'p-sb-10', nombre_parada: 'El Samán Principal', hora_estimada: '06:25 AM', sector: 'Urb. El Samán' },
  'p-sb-11': { id: 'p-sb-11', nombre_parada: 'Osiris Garita', hora_estimada: '06:40 AM', sector: 'Urb. Osiris' },
  'p-sb-12': { id: 'p-sb-12', nombre_parada: 'Sector Don Luis', hora_estimada: '06:55 AM', sector: 'Don Luis' },
  'p-lb-1': { id: 'p-lb-1', nombre_parada: 'Puertas del Sur Entrada', hora_estimada: '06:20 AM', sector: 'Puertas del Sur' },
  'p-lb-2': { id: 'p-lb-2', nombre_parada: 'Valle de Luna', hora_estimada: '06:35 AM', sector: 'Valle de Luna' },
  'p-lb-3': { id: 'p-lb-3', nombre_parada: 'Bello Campo', hora_estimada: '06:50 AM', sector: 'Bello Campo' },
  'p-lb-4': { id: 'p-lb-4', nombre_parada: 'Las Flores', hora_estimada: '06:15 AM', sector: 'Las Flores' },
  'p-lb-5': { id: 'p-lb-5', nombre_parada: 'Edificio CVP', hora_estimada: '06:35 AM', sector: 'Centro Petrolero' },
  'p-lb-6': { id: 'p-lb-6', nombre_parada: 'Terranostra', hora_estimada: '06:55 AM', sector: 'Terranostra' },
  'p-lb-7': { id: 'p-lb-7', nombre_parada: 'Las Vírgenes Plaza', hora_estimada: '06:20 AM', sector: 'Las Vírgenes' },
  'p-lb-8': { id: 'p-lb-8', nombre_parada: 'La Arboleda', hora_estimada: '06:40 AM', sector: 'La Arboleda' },
  'p-lb-9': { id: 'p-lb-9', nombre_parada: 'Las Casitas', hora_estimada: '06:55 AM', sector: 'Las Casitas' },
  'p-lb-10': { id: 'p-lb-10', nombre_parada: 'Miraflores Garita', hora_estimada: '06:25 AM', sector: 'Miraflores' },
  'p-lb-11': { id: 'p-lb-11', nombre_parada: 'Parada Tecnológico', hora_estimada: '06:40 AM', sector: 'Tecnológico' },
  'p-lb-12': { id: 'p-lb-12', nombre_parada: 'CC Mañoca', hora_estimada: '06:55 AM', sector: 'Mañoca' }
};

interface EscuelaPerfil {
  id_escuela: string;
  nombre_institucion: string;
  codigo_dea: string;
  rif: string;
  direccion: string;
  mision: string;
  vision: string;
  objetivo: string;
  peic: string;
  logo_url?: string;
  nivel_educativo?: string;
}

export const Dashboard = () => {
  const navigate = useNavigate();
  const [escuelas, setEscuelas] = useState<EscuelaPerfil[]>([]);
  const { tieneAccesoEscuela, tienePermiso, loading: permLoading } = usePermisos();

  const activeSchoolCode = localStorage.getItem('sigae_escuela_codigo') || 'sb';

  const cambiarEscuelaActiva = (nuevaEscuela: string) => {
    localStorage.setItem('sigae_escuela_codigo', nuevaEscuela);
    const escObj = escuelas.find(e => e.id_escuela === nuevaEscuela);
    localStorage.setItem('sigae_escuela_activa', escObj?.nombre_institucion || (nuevaEscuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar'));
    
    const stored = localStorage.getItem('usuario_sigae');
    if (stored) {
      try {
        const usr = JSON.parse(stored);
        usr.id_escuela = nuevaEscuela;
        usr.nombre_escuela = escObj?.nombre_institucion || (nuevaEscuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
        localStorage.setItem('usuario_sigae', JSON.stringify(usr));
      } catch (e) {}
    }
    
    window.location.reload();
  };

  const userStr = localStorage.getItem('usuario_sigae');
  const usuario = userStr ? JSON.parse(userStr) : { nombre: 'Usuario', rol: 'Comunidad' };
  const primerNombre = usuario.nombre ? usuario.nombre.split(' ')[0] : 'Usuario';

  const [relojDigital, setRelojDigital] = useState<string>('');
  const [mostrarIdentidad, setMostrarIdentidad] = useState(false);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setRelojDigital(d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const cacheKey = 'sigae_cached_perfiles';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setEscuelas(JSON.parse(cached));
      } catch (e) {}
    }

    const fetchEscuelas = async () => {
      try {
        const { data, error } = await supabase.from('perfil_escuela').select('*');
        if (!error && data && data.length > 0) {
          setEscuelas(data);
          localStorage.setItem(cacheKey, JSON.stringify(data));
        }
      } catch (err) {
        console.error('Error fetching profiles:', err);
      }
    };
    fetchEscuelas();

    const handleEscuelasUpdate = () => {
      fetchEscuelas();
    };
    window.addEventListener('escuelas-actualizadas', handleEscuelasUpdate);
    return () => {
      window.removeEventListener('escuelas-actualizadas', handleEscuelasUpdate);
    };
  }, []);

  useEffect(() => {

    // Fetch encuestas pendientes para el rol del usuario
    const fetchEncuestasPendientes = async () => {
      try {
        let todas: any[] = [];
        const { data, error } = await supabase.from('encuestas').select('*').eq('estado', 'Publicada');
        if (!error && data && data.length > 0) {
          todas = data.map((enc: any) => ({
            ...enc,
            roles_permitidos: typeof enc.roles_permitidos === 'string' ? JSON.parse(enc.roles_permitidos) : (enc.roles_permitidos || []),
            preguntas: typeof enc.preguntas === 'string' ? JSON.parse(enc.preguntas) : (enc.preguntas || [])
          }));
        } else {
          const local = localStorage.getItem('sigae_encuestas_local');
          if (local) todas = JSON.parse(local).filter((e: any) => e.estado === 'Publicada');
        }

        const rolUsuario = usuario.rol || 'Docente';
        const cedulaUsuario = usuario.cedula;

        const aplicables = todas.filter(e => {
          const matchEscuela = e.codigo_escuela === 'ambas' || e.codigo_escuela === activeSchoolCode;
          const matchRol = Array.isArray(e.roles_permitidos) && (e.roles_permitidos.includes(rolUsuario) || rolUsuario === 'SuperAdmin');
          
          if (!matchEscuela || !matchRol) return false;

          if (!e.permitir_multiples_respuestas && cedulaUsuario) {
            const key = `sigae_respuestas_${e.id}`;
            const respuestasLocales = JSON.parse(localStorage.getItem(key) || '[]');
            const yaRespondio = respuestasLocales.some((r: any) => r.usuario_cedula === cedulaUsuario);
            if (yaRespondio) return false;
          }

          return true;
        });

        setEncuestasPendientes(aplicables);
      } catch (e) {
        console.warn("Error al cargar encuestas en dashboard:", e);
      }
    };
    fetchEncuestasPendientes();
  }, [activeSchoolCode]);

  const [encuestasPendientes, setEncuestasPendientes] = useState<any[]>([]);
  const [estudiantesVinculados, setEstudiantesVinculados] = useState<any[]>([]);
  const [avanceActualizacionPromedio, setAvanceActualizacionPromedio] = useState<number>(100);
  const [rutasEstudiantes, setRutasEstudiantes] = useState<string[]>([]);
  interface MetricasPlantelEstudiantes {
    total: number;
    actualizados: number;
    pctActualizados: number;
    iniciados: number;
    pctIniciados: number;
    noIniciados: number;
    pctNoIniciados: number;
  }

  const [censoPlanteles, setCensoPlanteles] = useState<{
    sb: MetricasPlantelEstudiantes;
    lb: MetricasPlantelEstudiantes;
    consolidado: MetricasPlantelEstudiantes;
  }>({
    sb: { total: 240, actualizados: 187, pctActualizados: 78, iniciados: 36, pctIniciados: 15, noIniciados: 17, pctNoIniciados: 7 },
    lb: { total: 185, actualizados: 135, pctActualizados: 73, iniciados: 33, pctIniciados: 18, noIniciados: 17, pctNoIniciados: 9 },
    consolidado: { total: 425, actualizados: 322, pctActualizados: 76, iniciados: 69, pctIniciados: 16, noIniciados: 34, pctNoIniciados: 8 }
  });
  const [vistaFiltroCenso, setVistaFiltroCenso] = useState<'consolidado' | 'sb' | 'lb'>('consolidado');

  interface MetricasCupos {
    total: number;
    aprobados: number;
    pctAprobados: number;
    evaluacion: number;
    pctEvaluacion: number;
    rechazados: number;
    pctRechazados: number;
    baseProgreso: number;
    pctProgreso: number;
  }

  const [solicitudesCupos, setSolicitudesCupos] = useState<{
    sb: MetricasCupos;
    lb: MetricasCupos;
    consolidado: MetricasCupos;
  }>({
    sb: { total: 123, aprobados: 82, pctAprobados: 67, evaluacion: 2, pctEvaluacion: 2, rechazados: 39, pctRechazados: 31, baseProgreso: 84, pctProgreso: 98 },
    lb: { total: 176, aprobados: 69, pctAprobados: 39, evaluacion: 10, pctEvaluacion: 6, rechazados: 97, pctRechazados: 55, baseProgreso: 79, pctProgreso: 87 },
    consolidado: { total: 299, aprobados: 151, pctAprobados: 51, evaluacion: 12, pctEvaluacion: 4, rechazados: 136, pctRechazados: 45, baseProgreso: 163, pctProgreso: 93 }
  });
  const [vistaFiltroCupos, setVistaFiltroCupos] = useState<'consolidado' | 'sb' | 'lb'>('consolidado');

  const [nivelSeguridadScore, setNivelSeguridadScore] = useState<number>(() => {
    const cached = localStorage.getItem('sigae_security_score');
    if (cached) {
      const parsed = parseInt(cached, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 100;
  });

  useEffect(() => {
    const syncSecurityScore = () => {
      const cached = localStorage.getItem('sigae_security_score');
      if (cached) {
        const parsed = parseInt(cached, 10);
        if (!isNaN(parsed) && parsed > 0) {
          setNivelSeguridadScore(parsed);
          return;
        }
      }
      setNivelSeguridadScore(100);
    };
    syncSecurityScore();
    window.addEventListener('storage', syncSecurityScore);
    return () => window.removeEventListener('storage', syncSecurityScore);
  }, []);


  // Estados para el bloque interactivo de transporte (Escuela -> Ruta -> Recorrido -> Estatus)
  const [escuelaTransporte, setEscuelaTransporte] = useState<'sb' | 'lb'>(() => {
    return activeSchoolCode === 'lb' ? 'lb' : 'sb';
  });
  const [rutasTransporteData, setRutasTransporteData] = useState<any[]>(() => {
    return [...RUTAS_FALLBACK_SB, ...RUTAS_FALLBACK_LB];
  });
  const [paradasTransporteData, setParadasTransporteData] = useState<any[]>(() => {
    return Object.values(PARADAS_FALLBACK);
  });
  const [operacionesTransporteData, setOperacionesTransporteData] = useState<any[]>([]);
  const [rutaSeleccionadaId, setRutaSeleccionadaId] = useState<string>('');
  const [sentidoTransporte, setSentidoTransporte] = useState<'Casa - Escuela' | 'Escuela - Casa'>('Casa - Escuela');

  const [personalEscuelas, setPersonalEscuelas] = useState<{
    sb: number;
    lb: number;
    total: number;
  }>({
    sb: 49,
    lb: 60,
    total: 109
  });

  useEffect(() => {
    const fetchEstudiantesYTransporte = async () => {
      try {
        const userCedula = String(usuario.usuario_emulado_cedula || usuario.cedula || '').trim().toUpperCase();
        const userDigits = userCedula.replace(/\D/g, '');
        const userNombre = String(usuario.usuario_emulado_nombre || usuario.nombre_completo || usuario.nombre || '').trim().toLowerCase();
        const userNombrePartes = userNombre.split(' ').filter((p: string) => p.length >= 3);

        let todosLosRegistros: any[] = [];

        // 1. Cargar desde Supabase: estudiantes_vinculaciones
        if (supabase) {
          try {
            let page = 0;
            const pageSize = 1000;
            let hasMore = true;

            while (hasMore) {
              const { data: chunk, error: errChunk } = await supabase
                .from('estudiantes_vinculaciones')
                .select('*')
                .order('created_at', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1);

              if (errChunk) {
                hasMore = false;
              } else if (chunk && chunk.length > 0) {
                todosLosRegistros = [...todosLosRegistros, ...chunk];
                if (chunk.length < pageSize) hasMore = false;
                else page++;
              } else {
                hasMore = false;
              }
            }
          } catch (e) {}

          // Cargar también solicitudes_cupos si hace falta
          try {
            const { data: dataCupos } = await supabase
              .from('solicitudes_cupos')
              .select('*')
              .limit(2000);

            if (dataCupos && dataCupos.length > 0) {
              todosLosRegistros = [...todosLosRegistros, ...dataCupos];
            }
          } catch (e) {}
        }

        // 2. Cargar también desde almacenamiento local
        const localKeys = ['sigae_estudiantes_vinculaciones', 'sigae_solicitudes_cupos', 'sigae_censo_alumnos', 'sigae_estudiantes_locales'];
        for (const key of localKeys) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                todosLosRegistros = [...todosLosRegistros, ...parsed];
              }
            } catch (e) {}
          }
        }

        // 3. Filtrar estudiantes vinculados al representante en sesión
        const seenIds = new Set<string>();
        const vinculados: any[] = [];

        todosLosRegistros.forEach((item: any) => {
          const dAct = item.datos_actualizados || {};
          const repCed = String(item.cedula_representante || item.representante_cedula || dAct.representante_cedula || dAct.cedula_representante || '').trim().toUpperCase();
          const repDigits = repCed.replace(/\D/g, '');

          const matchCedula = Boolean(userDigits && repDigits && (repDigits === userDigits || repCed === userCedula));

          const repNombre = String(
            (item.nombres_representante || dAct.representante_nombres || item.nombre_representante || '') + ' ' +
            (item.apellidos_representante || dAct.representante_apellidos || '')
          ).trim().toLowerCase();

          const matchNombre = userNombrePartes.length >= 2 && userNombrePartes.every((p: string) => repNombre.includes(p));

          if (matchCedula || matchNombre) {
            const idKey = String(item.cedula_estudiante || dAct.estudiante_cedula || item.id || (item.nombres_estudiante || dAct.estudiante_nombres)).trim();
            if (idKey && !seenIds.has(idKey)) {
              seenIds.add(idKey);

              const nombres = String(item.nombres_estudiante || dAct.estudiante_nombres || '').trim();
              const apellidos = String(item.apellidos_estudiante || dAct.estudiante_apellidos || '').trim();
              const ruta = String(dAct.transporte_ruta || dAct.ruta_transporte || item.transporte_ruta || item.ruta_transporte || (activeSchoolCode === 'sb' ? 'Ruta Campo El Tejero' : 'Ruta Residencial Miraflores')).trim();
              const completo = Boolean(dAct.estudiante_nombres || item.nombres_estudiante);

              vinculados.push({
                id: item.id || idKey,
                cedula_estudiante: item.cedula_estudiante || dAct.estudiante_cedula || '',
                nombres_estudiante: nombres || 'Estudiante',
                apellidos_estudiante: apellidos,
                nombre_completo: `${nombres} ${apellidos}`.trim() || 'Estudiante Representado',
                ruta: ruta,
                actualizado: completo
              });
            }
          }
        });

        if (vinculados.length === 0) {
          const defaultRuta = activeSchoolCode === 'sb' ? 'Ruta Campo El Tejero' : 'Ruta Residencial Miraflores';
          const defaultEsts = [
            { id: 'demo-1', nombres_estudiante: 'Estudiante Representado', apellidos_estudiante: '', nombre_completo: 'Estudiante Representado', ruta: defaultRuta, actualizado: true }
          ];
          setEstudiantesVinculados(defaultEsts);
          setAvanceActualizacionPromedio(100);
          setRutasEstudiantes([defaultRuta]);
        } else {
          setEstudiantesVinculados(vinculados);
          const uniqueRoutes = Array.from(new Set(vinculados.map((p: any) => p.ruta).filter(Boolean)));
          setRutasEstudiantes(uniqueRoutes.length > 0 ? uniqueRoutes : [activeSchoolCode === 'sb' ? 'Ruta Campo El Tejero' : 'Ruta Miraflores']);
          const totalAvance = vinculados.reduce((acc: number, p: any) => acc + (p.actualizado ? 100 : 75), 0);
          setAvanceActualizacionPromedio(Math.round(totalAvance / vinculados.length));
        }

        // 4. Calcular métricas del censo para cada plantel (SB y LB) y consolidado
        // Sincronizado con el algoritmo institucional oficial de Avance General de Fichas (VincularEstudiante)
        const calcularAvanceActualizacionOficial = (item: any) => {
          const d = (item.datos_actualizados && typeof item.datos_actualizados === 'object') ? item.datos_actualizados : {};
          const fecha = item.fecha_ultima_actualizacion;

          const secciones = [
            {
              id: 'rep',
              ok: Boolean((d.representante_nombres || item.nombres_representante) && (d.representante_cedula || item.cedula_representante) && (d.representante_telefono || d.representante_email))
            },
            {
              id: 'est',
              ok: Boolean((d.estudiante_nombres || item.nombres_estudiante) && (d.estudiante_apellidos || item.apellidos_estudiante) && d.estudiante_fecha_nacimiento && d.estudiante_sexo)
            },
            {
              id: 'dir',
              ok: Boolean(d.estado_habitacion && d.direccion_habitacion)
            },
            {
              id: 'salud',
              ok: Boolean(d.estudiante_grupo_sanguineo || d.talla_franela || d.peso_kg)
            },
            {
              id: 'madre',
              ok: Boolean(d.madre_nombres && d.madre_cedula)
            },
            {
              id: 'padre',
              ok: d.estudiante_reconocido_por_padre === 'No' || Boolean(d.padre_nombres && d.padre_cedula)
            },
            {
              id: 'socio',
              ok: Boolean(d.posee_computadora || d.tipo_vivienda || d.estudiante_con_quien_vive)
            },
            {
              id: 'confirmado',
              ok: Boolean(fecha)
            }
          ];

          const completadas = secciones.filter(s => s.ok).length;
          const porcentaje = Math.round((completadas / secciones.length) * 100);

          let estado: 'sin_iniciar' | 'en_proceso' | 'completado' = 'sin_iniciar';

          if (fecha && porcentaje >= 85) {
            estado = 'completado';
          } else if (porcentaje > 0 || fecha) {
            estado = 'en_proceso';
          }

          return { porcentaje, estado };
        };

        const distinctAlumnosSB = new Map<string, any>();
        const distinctAlumnosLB = new Map<string, any>();

        todosLosRegistros.forEach((r: any) => {
          const esc = String(r.codigo_escuela || r.escuela || r.id_escuela || r.datos_actualizados?.escuela || r.datos_actualizados?.id_escuela || '').trim().toLowerCase();
          const dAct = (r.datos_actualizados && typeof r.datos_actualizados === 'object') ? r.datos_actualizados : {};
          const idKey = String(r.cedula_estudiante || dAct.estudiante_cedula || r.id || `${r.nombres_estudiante}_${r.apellidos_estudiante}`).trim();
          if (!idKey) return;

          if (esc === 'lb' || esc.includes('libertador') || esc.includes('bolivar') || esc.includes('bolívar')) {
            if (!distinctAlumnosLB.has(idKey)) distinctAlumnosLB.set(idKey, r);
          } else {
            if (!distinctAlumnosSB.has(idKey)) distinctAlumnosSB.set(idKey, r);
          }
        });

        const calcularMetricasDeMapa = (
          map: Map<string, any>, 
          defaultTot: number, 
          defaultAct: number, 
          defaultIni: number, 
          defaultNoIni: number
        ) => {
          let act = 0;
          let ini = 0;
          let noIni = 0;

          if (map.size > 0) {
            map.forEach((al: any) => {
              const res = calcularAvanceActualizacionOficial(al);
              if (res.estado === 'completado') {
                act++;
              } else if (res.estado === 'en_proceso') {
                ini++;
              } else {
                noIni++;
              }
            });

            const tot = map.size;
            const pctAct = Math.round((act / (tot || 1)) * 100);
            const pctIni = Math.round((ini / (tot || 1)) * 100);
            const pctNo = Math.max(0, 100 - pctAct - pctIni);
            return { total: tot, actualizados: act, pctActualizados: pctAct, iniciados: ini, pctIniciados: pctIni, noIniciados: noIni, pctNoIniciados: pctNo };
          } else {
            const tot = defaultTot;
            const pctAct = Math.round((defaultAct / tot) * 100);
            const pctIni = Math.round((defaultIni / tot) * 100);
            const pctNo = Math.max(0, 100 - pctAct - pctIni);
            return { total: tot, actualizados: defaultAct, pctActualizados: pctAct, iniciados: defaultIni, pctIniciados: pctIni, noIniciados: defaultNoIni, pctNoIniciados: pctNo };
          }
        };

        const sbMetrics = calcularMetricasDeMapa(distinctAlumnosSB, 522, 448, 16, 58);
        const lbMetrics = calcularMetricasDeMapa(distinctAlumnosLB, 610, 543, 29, 38);
        const totalConsolidado = sbMetrics.total + lbMetrics.total;
        const actConsolidado = sbMetrics.actualizados + lbMetrics.actualizados;
        const iniConsolidado = sbMetrics.iniciados + lbMetrics.iniciados;
        const noConsolidado = sbMetrics.noIniciados + lbMetrics.noIniciados;
        const pctConsAct = Math.round((actConsolidado / (totalConsolidado || 1)) * 100);
        const pctConsIni = Math.round((iniConsolidado / (totalConsolidado || 1)) * 100);
        const pctConsNo = Math.max(0, 100 - pctConsAct - pctConsIni);

        const consolidadoMetrics = {
          total: totalConsolidado,
          actualizados: actConsolidado,
          pctActualizados: pctConsAct,
          iniciados: iniConsolidado,
          pctIniciados: pctConsIni,
          noIniciados: noConsolidado,
          pctNoIniciados: pctConsNo
        };

        setCensoPlanteles({
          sb: sbMetrics,
          lb: lbMetrics,
          consolidado: consolidadoMetrics
        });


        // 6. Cargar cantidad de personal de la UE Santa Bárbara y UE Libertador Bolívar
        try {
          if (supabase) {
            const { data: usersData, error: errUsers } = await supabase
              .from('usuarios')
              .select('id_usuario, id_escuela, rol');
            if (!errUsers && usersData && usersData.length > 0) {
              const personal = usersData.filter((u: { rol?: string; id_escuela?: string }) => u.rol !== 'Representante' && u.rol !== 'Estudiante');
              const sbCount = personal.filter((u: { id_escuela?: string }) => u.id_escuela === 'sb' || u.id_escuela === 'ambas').length;
              const lbCount = personal.filter((u: { id_escuela?: string }) => u.id_escuela === 'lb' || u.id_escuela === 'ambas').length;
              setPersonalEscuelas({
                sb: sbCount || 49,
                lb: lbCount || 60,
                total: personal.length || 109
              });
            }
          }
        } catch (errP) {
          console.warn("Error al cargar conteo de personal:", errP);
        }

        // 7. Cargar métricas de solicitudes de cupos por escuela y consolidado
        try {
          if (supabase) {
            const { data: cuposData, error: errCupos } = await supabase
              .from('solicitud_cupos')
              .select('id, codigo_escuela, estado');

            if (!errCupos && cuposData && cuposData.length > 0) {
              const procesarGrupoCupos = (lista: any[]) => {
                const tot = lista.length;
                let apr = 0;
                let evalCount = 0;
                let rec = 0;

                lista.forEach(r => {
                  const est = String(r.estado || '').trim().toLowerCase();
                  if (est === 'aprobado') {
                    apr++;
                  } else if (est.includes('evalua') || est === 'pendiente' || est === 'en proceso' || est.includes('revis')) {
                    evalCount++;
                  } else if (est === 'rechazado') {
                    rec++;
                  } else {
                    evalCount++;
                  }
                });

                const pctApr = tot > 0 ? Math.round((apr / tot) * 100) : 0;
                const pctEval = tot > 0 ? Math.round((evalCount / tot) * 100) : 0;
                const pctRec = Math.max(0, 100 - pctApr - pctEval);

                // Progreso operacional de cupos: Total = (Aprobados + En Evaluación), Avance = Aprobados
                const baseProg = apr + evalCount;
                const pctProg = baseProg > 0 ? Math.round((apr / baseProg) * 100) : 0;

                return {
                  total: tot,
                  aprobados: apr,
                  pctAprobados: pctApr,
                  evaluacion: evalCount,
                  pctEvaluacion: pctEval,
                  rechazados: rec,
                  pctRechazados: pctRec,
                  baseProgreso: baseProg,
                  pctProgreso: pctProg
                };
              };

              const sbCupos = cuposData.filter((r: any) => String(r.codigo_escuela || '').trim().toLowerCase() === 'sb');
              const lbCupos = cuposData.filter((r: any) => {
                const esc = String(r.codigo_escuela || '').trim().toLowerCase();
                return esc === 'lb' || esc.includes('libertador') || esc.includes('bolivar') || esc.includes('bolívar');
              });

              setSolicitudesCupos({
                sb: procesarGrupoCupos(sbCupos),
                lb: procesarGrupoCupos(lbCupos),
                consolidado: procesarGrupoCupos(cuposData)
              });
            }
          }
        } catch (errC) {
          console.warn("Error al cargar solicitudes de cupos:", errC);
        }

        // 8. Cargar datos para el bloque interactivo de transporte
        try {
          if (supabase) {
            const hoyStr = new Date().toISOString().split('T')[0];
            const [resRutas, resParadas, resOps] = await Promise.all([
              supabase.from('transporte_rutas').select('*').order('nombre', { ascending: true }),
              supabase.from('transporte_paradas').select('*').order('nombre_parada', { ascending: true }),
              supabase.from('transporte_operaciones').select('*').eq('fecha', hoyStr)
            ]);

            if (!resRutas.error && resRutas.data && resRutas.data.length > 0) {
              setRutasTransporteData(resRutas.data);
            }
            if (!resParadas.error && resParadas.data && resParadas.data.length > 0) {
              setParadasTransporteData(resParadas.data);
            }
            if (!resOps.error && resOps.data) {
              setOperacionesTransporteData(resOps.data);
            }
          }
        } catch (errT) {
          console.warn("Error al cargar rutas y paradas de transporte:", errT);
        }

      } catch (e) {
        console.warn("Error al procesar métricas en dashboard:", e);
      }
    };

    fetchEstudiantesYTransporte();
  }, [activeSchoolCode, usuario.cedula, usuario.rol]);

  // Sincronización en tiempo real para operaciones de transporte
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase.channel('dashboard_transporte_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transporte_operaciones' }, async () => {
        const hoyStr = new Date().toISOString().split('T')[0];
        const { data } = await supabase.from('transporte_operaciones').select('*').eq('fecha', hoyStr);
        if (data) setOperacionesTransporteData(data);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const getEscuelaData = (code: string): EscuelaPerfil => {
    const esc = escuelas.find(e => e.id_escuela?.toLowerCase() === code.toLowerCase());
    return esc || {
      id_escuela: code,
      nombre_institucion: code === 'lb' ? 'U.E. Libertador Bolívar' : 'U.E. Santa Bárbara',
      codigo_dea: code === 'lb' ? 'OD05561614' : 'OD05561615',
      rif: 'G-20000041-4',
      direccion: code === 'lb' ? 'Campo Residencial Miraflores, Temblador, Edo. Monagas' : 'Campo Residencial El Tejero, Municipio Ezequiel Zamora, Edo. Monagas',
      mision: 'Formar integralmente a los estudiantes mediante una educación humanista, científica y tecnológica con alto compromiso ético y ciudadano.',
      vision: 'Consolidarse como una institución educativa modelo en excelencia pedagógica, innovación y liderazgo comunitario.',
      objetivo: 'Fomentar la excelencia académica, el pensamiento crítico, la disciplina y los valores de solidaridad y pertenencia.',
      peic: 'Fortalecimiento de la calidad educativa a través de la integración escuela, familia y comunidad.'
    };
  };

  const escuelaActivaData = getEscuelaData(activeSchoolCode);
  const escuelasPermitidas = escuelas.filter(e => tieneAccesoEscuela(e.id_escuela));

  if (permLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando campus...</span>
        </div>
      </div>
    );
  }

  // Permisos dinámicos para el Panel Principal (configurables en Roles y Privilegios)
  const canVerIdentidad = tienePermiso('Identidad Institucional', 'ver');
  const canMision = tienePermiso('Tarjeta: Misión Institucional', 'ver');
  const canVision = tienePermiso('Tarjeta: Visión Institucional', 'ver');
  const canValores = tienePermiso('Tarjeta: Valores Institucionales', 'ver');
  const canPeic = tienePermiso('Tarjeta: Proyecto Comunitario (PEIC)', 'ver');

  const canRolSeguridad = tienePermiso('Tarjeta: Rol y Seguridad de Claves', 'ver');
  const canEstudiantesVinculados = tienePermiso('Tarjeta: Estudiantes Vinculados y Avance', 'ver');
  const canRutasEstudiantes = tienePermiso('Tarjeta: Rutas Escolares de Representados', 'ver');
  const canCensoGeneral = tienePermiso('Tarjeta: Censo General de la Escuela', 'ver');
  const canSolicitudesCupos = tienePermiso('Tarjeta: Solicitudes de Cupos', 'ver');
  const canPersonalInstitucional = tienePermiso('Tarjeta: Personal Institucional', 'ver');
  const canRutaTrabajador = tienePermiso('Tarjeta: Ruta y Parada del Trabajador/Personal', 'ver');
  const canNotificaciones = tienePermiso('Tarjeta: Notificaciones y Avisos Activos', 'ver');
  const esRolFormalizador = (usuario?.rol || '').trim().toLowerCase() === 'formalizador';

  return (
    <div className="container-fluid p-0 animate__animated animate__fadeIn">

      {/* ── 1. CENTRO DE CONTROL INSTITUCIONAL Y CAMPUS EDUCATIVO (TECNOLÓGICO & INTERACTIVO) ── */}
      <div 
        className="tech-card overflow-hidden mb-4" 
        style={{ 
          border: activeSchoolCode === 'sb' ? '2px solid #a7f3d0' : '2px solid #bae6fd',
          borderTop: `6px solid ${activeSchoolCode === 'sb' ? '#10b981' : '#0284c7'}`,
          background: activeSchoolCode === 'sb'
            ? 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 45%, #d1fae5 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 45%, #dbeafe 100%)',
          borderRadius: '26px'
        }}
      >
        <div className="p-4 p-md-5">
          <div className="row align-items-center g-4">
            
            {/* Escudo Oficial con Contenedor Interactivo */}
            <div className="col-12 col-md-auto text-center text-md-start">
              <div 
                className="tech-icon-wrapper bg-white shadow-sm d-inline-flex align-items-center justify-content-center p-2"
                style={{ 
                  width: '110px', 
                  height: '110px',
                  borderRadius: '24px',
                  border: activeSchoolCode === 'sb' ? '2.5px solid #a7f3d0' : '2.5px solid #bae6fd',
                  boxShadow: activeSchoolCode === 'sb' ? '0 10px 24px rgba(16, 185, 129, 0.15)' : '0 10px 24px rgba(2, 132, 199, 0.15)'
                }}
              >
                <img 
                  src={escuelaActivaData.logo_url || localStorage.getItem(`sigae_logo_${activeSchoolCode}`) || `/assets/img/logo_${activeSchoolCode}.png`} 
                  alt="Escudo Oficial de la Escuela" 
                  className="img-fluid"
                  style={{ maxHeight: '92px', maxWidth: '92px', objectFit: 'contain' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                />
              </div>
            </div>

            {/* Datos Jurídicos, Identidad y Beacon Tecnológico */}
            <div className="col-12 col-md">
              <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                {/* Live Campus Beacon */}
                <div 
                  className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill bg-white border shadow-xs"
                  style={{ borderColor: activeSchoolCode === 'sb' ? '#a7f3d0' : '#bae6fd' }}
                >
                  <span 
                    className="status-beacon-live" 
                    style={{ color: activeSchoolCode === 'sb' ? '#10b981' : '#0284c7' }}
                  ></span>
                  <span 
                    className="extra-small fw-bold text-uppercase" 
                    style={{ fontSize: '0.72rem', color: activeSchoolCode === 'sb' ? '#047857' : '#0369a1', letterSpacing: '0.5px' }}
                  >
                    Campus Conectado &bull; SIGAE v1.1
                  </span>
                </div>

                <span 
                  className="badge text-white fw-bold px-3 py-1.5 rounded-pill small shadow-xs"
                  style={{ backgroundColor: activeSchoolCode === 'sb' ? '#10b981' : '#0284c7' }}
                >
                  <i className="bi bi-patch-check-fill me-1"></i>
                  {escuelaActivaData.nivel_educativo || (activeSchoolCode === 'sb' ? 'Educación Inicial y Primaria' : 'Educación Media General')}
                </span>
                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs">
                  DEA: {escuelaActivaData.codigo_dea}
                </span>
                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs">
                  RIF: {escuelaActivaData.rif}
                </span>
              </div>

              <h1 className="fw-bolder mb-1.5 text-dark" style={{ fontSize: 'calc(1.5rem + 0.75vw)', letterSpacing: '-0.6px' }}>
                {escuelaActivaData.nombre_institucion}
              </h1>

              <p className="mb-0 text-muted small d-flex align-items-center gap-1.5 flex-wrap">
                <i className="bi bi-geo-alt-fill text-danger flex-shrink-0"></i>
                <span className="fw-semibold">{escuelaActivaData.direccion}</span>
                <span className="badge bg-white text-secondary border px-2 py-0.5 rounded-pill extra-small ms-1 d-none d-lg-inline">
                  <i className="bi bi-building me-1 text-primary"></i>DEP PDVSA Oriente
                </span>
              </p>

              {/* Cinta de Telemetría Escolar Interactiva */}
              <div className="d-flex align-items-center gap-2 mt-3 flex-wrap">
                <div 
                  className="tech-pill-badge shadow-xs cursor-pointer" 
                  title="Hora Oficial del Sistema"
                >
                  <i className="bi bi-clock-history text-primary"></i>
                  <span className="font-monospace fw-bold text-dark">{relojDigital || '12:00:00'} VET</span>
                </div>
                <div 
                  className="tech-pill-badge shadow-xs cursor-pointer" 
                  title="Ciclo Académico Actual"
                >
                  <i className="bi bi-calendar-check-fill text-success"></i>
                  <span className="text-secondary">Periodo 2025-2026</span>
                </div>
                <div 
                  className="tech-pill-badge shadow-xs cursor-pointer" 
                  title="Red de Sedes Activas"
                >
                  <i className="bi bi-diagram-3-fill text-info"></i>
                  <span className="text-secondary">2 Sedes Interconectadas</span>
                </div>
                <div 
                  className="tech-pill-badge shadow-xs cursor-pointer" 
                  title="Estado Operativo de la Plataforma"
                >
                  <i className="bi bi-shield-fill-check text-warning"></i>
                  <span className="text-secondary">100% Operativo</span>
                </div>
              </div>
            </div>

            {/* Selector Tecnológico de Sede (SB / LB) y Toggle de Identidad */}
            <div className="col-12 col-md-auto text-md-end text-center">
              <div className="d-flex flex-column align-items-md-end align-items-center gap-2.5">
                <div className="text-muted extra-small">
                  Sesión activa: <strong className="text-dark">{primerNombre}</strong> &bull; Perfil: <strong style={{ color: activeSchoolCode === 'sb' ? '#059669' : '#0284c7' }}>{usuario.rol || 'Comunidad'}</strong>
                </div>

                {/* Segmented Switcher Tecnológico para Sedes */}
                {escuelasPermitidas.length > 1 && (
                  <div className="tech-segmented-container shadow-xs">
                    {escuelasPermitidas.map((esc: any) => {
                      const isSelected = esc.id_escuela === activeSchoolCode;
                      const nombreCorto = esc.id_escuela === 'sb' ? 'UE Santa Bárbara' : esc.id_escuela === 'lb' ? 'UE Libertador Bolívar' : esc.nombre_institucion;
                      return (
                        <button
                          key={esc.id_escuela}
                          type="button"
                          onClick={() => cambiarEscuelaActiva(esc.id_escuela)}
                          className={`tech-segmented-btn d-flex align-items-center gap-1.5 ${isSelected ? 'active' : ''}`}
                          style={{
                            color: isSelected ? (esc.id_escuela === 'sb' ? '#047857' : '#0284c7') : '#64748b',
                            fontWeight: isSelected ? '800' : '600'
                          }}
                        >
                          <i 
                            className={`bi ${esc.id_escuela === 'sb' ? 'bi-tree-fill text-success' : 'bi-mortarboard-fill text-primary'}`}
                          ></i>
                          <span>{nombreCorto}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Botón Tecnológico Interactivo para Desplegar Misión y Visión */}
                {canVerIdentidad && (canMision || canVision || canValores || canPeic) && (
                  <button
                    type="button"
                    onClick={() => setMostrarIdentidad(!mostrarIdentidad)}
                    className="btn btn-sm rounded-pill px-3.5 py-1.5 fw-bold d-inline-flex align-items-center gap-2 shadow-xs bg-white border hover-efecto"
                    style={{ 
                      fontSize: '0.8rem', 
                      color: activeSchoolCode === 'sb' ? '#059669' : '#0284c7', 
                      borderColor: activeSchoolCode === 'sb' ? '#a7f3d0' : '#bae6fd' 
                    }}
                  >
                    <i 
                      className={`bi ${mostrarIdentidad ? 'bi-chevron-up' : 'bi-compass-fill'}`} 
                      style={{ 
                        transition: 'transform 0.3s ease',
                        transform: mostrarIdentidad ? 'rotate(180deg)' : 'none'
                      }}
                    ></i>
                    <span>{mostrarIdentidad ? 'Ocultar Identidad 3D' : 'Misión y Visión 3D'}</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ── 2. IDENTIDAD INSTITUCIONAL INTERACTIVA 3D (MISIÓN, VISIÓN, VALORES, PEIC) ── */}
        {canVerIdentidad && mostrarIdentidad && (canMision || canVision || canValores || canPeic) && (
          <div className="p-4 bg-white bg-opacity-80 border-top animate__animated animate__fadeIn">
            <div className="row g-3">
              {/* Misión */}
              {canMision && (
                <div className="col-12 col-sm-6 col-lg-3">
                  <div 
                    className="tech-card h-100 p-3.5 d-flex flex-column"
                    style={{
                      borderRadius: '22px',
                      border: '1.5px solid #fed7aa',
                      borderTop: '5px solid #f97316',
                      background: 'linear-gradient(180deg, #fff7ed 0%, #ffffff 75%)'
                    }}
                  >
                    <div className="d-flex align-items-center gap-3 mb-2.5 pb-2 border-bottom">
                      <div className="tech-icon-wrapper rounded-3 p-1 bg-white shadow-xs">
                        <img 
                          src="/assets/img/mision_3d.jpg" 
                          alt="Misión" 
                          className="img-fluid rounded-3"
                          style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <span 
                          className="badge text-uppercase fw-bolder px-2.5 py-1 rounded-pill extra-small"
                          style={{ backgroundColor: '#ffedd5', color: '#ea580c' }}
                        >
                          Misión
                        </span>
                        <div className="fw-bold text-dark extra-small mt-0.5">Propósito Escolar</div>
                      </div>
                    </div>
                    <div className="flex-grow-1" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                      <p className="text-dark mb-0 small" style={{ lineHeight: '1.5', color: '#334155', fontSize: '0.84rem' }}>
                        {escuelaActivaData.mision || 'Brindar educación integral y de excelencia...'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Visión */}
              {canVision && (
                <div className="col-12 col-sm-6 col-lg-3">
                  <div 
                    className="tech-card h-100 p-3.5 d-flex flex-column"
                    style={{
                      borderRadius: '22px',
                      border: '1.5px solid #bae6fd',
                      borderTop: '5px solid #0284c7',
                      background: 'linear-gradient(180deg, #f0f9ff 0%, #ffffff 75%)'
                    }}
                  >
                    <div className="d-flex align-items-center gap-3 mb-2.5 pb-2 border-bottom">
                      <div className="tech-icon-wrapper rounded-3 p-1 bg-white shadow-xs">
                        <img 
                          src="/assets/img/vision_3d.jpg" 
                          alt="Visión" 
                          className="img-fluid rounded-3"
                          style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <span 
                          className="badge text-uppercase fw-bolder px-2.5 py-1 rounded-pill extra-small"
                          style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}
                        >
                          Visión
                        </span>
                        <div className="fw-bold text-dark extra-small mt-0.5">Proyección Futura</div>
                      </div>
                    </div>
                    <div className="flex-grow-1" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                      <p className="text-dark mb-0 small" style={{ lineHeight: '1.5', color: '#334155', fontSize: '0.84rem' }}>
                        {escuelaActivaData.vision || 'Ser una institución líder de referencia nacional...'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Valores */}
              {canValores && (
                <div className="col-12 col-sm-6 col-lg-3">
                  <div 
                    className="tech-card h-100 p-3.5 d-flex flex-column"
                    style={{
                      borderRadius: '22px',
                      border: '1.5px solid #bbf7d0',
                      borderTop: '5px solid #10b981',
                      background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 75%)'
                    }}
                  >
                    <div className="d-flex align-items-center gap-3 mb-2.5 pb-2 border-bottom">
                      <div className="tech-icon-wrapper rounded-3 p-1 bg-white shadow-xs">
                        <img 
                          src="/assets/img/valores_3d.jpg" 
                          alt="Valores" 
                          className="img-fluid rounded-3"
                          style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <span 
                          className="badge text-uppercase fw-bolder px-2.5 py-1 rounded-pill extra-small"
                          style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}
                        >
                          Valores
                        </span>
                        <div className="fw-bold text-dark extra-small mt-0.5">Principios Éticos</div>
                      </div>
                    </div>
                    <div className="flex-grow-1" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                      <p className="text-dark mb-0 small" style={{ lineHeight: '1.5', color: '#334155', fontSize: '0.84rem' }}>
                        {escuelaActivaData.objetivo || 'Responsabilidad, Respeto, Solidaridad, Excelencia Académica y Compromiso Social.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* PEIC */}
              {canPeic && (
                <div className="col-12 col-sm-6 col-lg-3">
                  <div 
                    className="tech-card h-100 p-3.5 d-flex flex-column"
                    style={{
                      borderRadius: '22px',
                      border: '1.5px solid #fef08a',
                      borderTop: '5px solid #eab308',
                      background: 'linear-gradient(180deg, #fefce8 0%, #ffffff 75%)'
                    }}
                  >
                    <div className="d-flex align-items-center gap-3 mb-2.5 pb-2 border-bottom">
                      <div className="tech-icon-wrapper rounded-3 p-1 bg-white shadow-xs">
                        <img 
                          src="/assets/img/peic_3d.png" 
                          alt="PEIC" 
                          className="img-fluid rounded-3"
                          style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                        />
                      </div>
                      <div>
                        <span 
                          className="badge text-uppercase fw-bolder px-2.5 py-1 rounded-pill extra-small"
                          style={{ backgroundColor: '#fef9c3', color: '#ca8a04' }}
                        >
                          P.E.I.C.
                        </span>
                        <div className="fw-bold text-dark extra-small mt-0.5">Proyecto Comunitario</div>
                      </div>
                    </div>
                    <div className="flex-grow-1" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                      <p className="text-dark mb-0 small" style={{ lineHeight: '1.5', color: '#334155', fontSize: '0.84rem' }}>
                        {escuelaActivaData.peic || 'Desarrollo pedagógico y comunitario integrado...'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── 3. INDICADORES RESUMEN CONFIGURABLES (ESTILO ÁRBOL ABC) ── */}
      <div className="row g-3 mb-4">
        {/* Tarjeta 1: Rol en Sesión y Nivel de Seguridad de Claves */}
        {canRolSeguridad && (
          <div className="col-12 col-md-6 col-lg-4 d-flex align-items-stretch">
            <ChamiloStatCard
              id="card-stat-rol-seguridad"
              title="Rol y Seguridad de Claves"
              value={usuario.rol || 'Comunidad'}
              subtitle="Nivel de seguridad: Alto • Métodos de acceso al día"
              icon="bi-shield-check"
              customIcon={<IconoSeguridadRol size={30} color="#0284c7" />}
              color="#0284c7"
              percentage={nivelSeguridadScore}
              statusBadge={{ text: nivelSeguridadScore === 100 ? '100% Seguro' : `${nivelSeguridadScore}% Seguro`, type: 'success' }}
              actionButton={{
                label: 'Mejorar',
                icon: 'bi-shield-check',
                onClick: () => navigate('/categoria/Seguridad y Accesos/Mi Perfil')
              }}
              onClick={() => navigate('/categoria/Seguridad y Accesos/Mi Perfil')}
            >
              <div className="mt-2 pt-2 border-top border-light">
                <ChamiloSecurityShield
                  protectionScore={nivelSeguridadScore}
                  roleName={usuario.rol || 'Comunidad'}
                  activeSessions={1}
                  twoFactorEnabled={true}
                  lastAudit="Hoy Activa"
                  darkTheme={false}
                />
              </div>
            </ChamiloStatCard>
          </div>
        )}

        {/* Tarjeta Exclusiva de Formalizador: Acceso Directo a Taquilla de Formalización */}
        {esRolFormalizador && (
          <div className="col-12 col-md-8 col-lg-8 d-flex align-items-stretch">
            <ChamiloStatCard
              id="card-formalizador-taquilla"
              title="Taquilla de Formalización Física de Matrícula"
              value="Formalización Presencial"
              subtitle="Acceso directo asignado para verificar datos y asentar inscripciones"
              icon="bi-journal-check"
              color="#0D9488"
              percentage={100}
              statusBadge={{ text: 'Módulo Activo', type: 'success' }}
              actionButton={{
                label: 'Ingresar a Taquilla',
                icon: 'bi-box-arrow-in-right',
                onClick: () => navigate('/categoria/Gestión Estudiantil/Gestión de Admisiones')
              }}
              onClick={() => navigate('/categoria/Gestión Estudiantil/Gestión de Admisiones')}
            >
              <div className="mt-2 pt-2 border-top border-light d-flex align-items-center gap-3">
                <div className="rounded-circle p-2.5 text-white d-flex align-items-center justify-content-center shadow-xs" style={{ backgroundColor: '#0D9488', width: '52px', height: '52px' }}>
                  <i className="bi bi-journal-check fs-3"></i>
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-0.5">Atención y Recepción de Aspirantes en Plantel</h6>
                  <p className="text-muted extra-small mb-0">Verificación inmediata de documentos físicos, ratificación de datos del aspirante/representante y emisión de constancias de inscripción.</p>
                </div>
              </div>
            </ChamiloStatCard>
          </div>
        )}

        {/* Tarjeta 2: Personal Institucional UE Santa Bárbara & UE Libertador Bolívar (DEP Oriente) */}
        {canPersonalInstitucional && (
          <div className="col-12 col-md-6 col-lg-4 d-flex align-items-stretch">
            <ChamiloStatCard
              id="card-stat-personal-dep-oriente"
              title="Personal Escolar DEP Oriente"
              value={
                <div className="d-flex flex-column gap-1">
                  <div className="d-flex align-items-baseline">
                    <span className="fw-bolder text-dark" style={{ fontSize: '1.15rem', letterSpacing: '-0.3px', lineHeight: 1 }}>
                      {personalEscuelas.total}
                    </span>
                    <span className="text-muted fw-semibold" style={{ fontSize: '0.78rem', marginLeft: '6px' }}>
                      trabajadores en nómina
                    </span>
                  </div>
                  <div className="d-flex flex-wrap gap-1 mt-0.5">
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-1.5 py-0.5 fw-bold" style={{ fontSize: '0.67rem' }}>
                      <i className="bi bi-building me-1"></i>UE Santa Bárbara: {personalEscuelas.sb}
                    </span>
                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-1.5 py-0.5 fw-bold" style={{ fontSize: '0.67rem' }}>
                      <i className="bi bi-building me-1"></i>UE Libertador Bolívar: {personalEscuelas.lb}
                    </span>
                  </div>
                </div>
              }
              subtitle={`Total general activo: ${personalEscuelas.total} trabajadores en Escuelas DEP Oriente`}
              icon="bi-people-fill"
              customIcon={<IconoPersonalDocente size={30} color="#6366f1" />}
              color="#6366f1"
              percentage={100}
              statusBadge={{ text: '100% Activo', type: 'success' }}
              actionButton={{
                label: 'Organigrama',
                icon: 'bi-diagram-3-fill',
                onClick: () => navigate('/categoria/Organización Escolar/Cadena Supervisoria')
              }}
              onClick={() => navigate('/categoria/Organización Escolar/Cadena Supervisoria')}
            >
              <div className="mt-2 pt-2 border-top border-light d-flex flex-column align-items-center w-100">
                <div className="d-flex justify-content-between w-100 align-items-center mb-1">
                  <span className="extra-small fw-bold text-muted text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                    Distribución de Plantilla
                  </span>
                  <span className="badge fw-bold extra-small" style={{ backgroundColor: '#e0e7ff', color: '#4338ca', fontSize: '0.67rem' }}>
                    Total DEP Oriente: {personalEscuelas.total}
                  </span>
                </div>

                <ChamiloDonutChart
                  segments={[
                    { label: 'U.E. Santa Bárbara', value: personalEscuelas.sb, color: '#10b981' },
                    { label: 'U.E. Libertador Bolívar', value: personalEscuelas.lb, color: '#0066FF' }
                  ]}
                  total={personalEscuelas.total || 1}
                  size={95}
                  thickness={11}
                  centerTitle={String(personalEscuelas.total)}
                  centerSubtitle="Docentes"
                  darkTheme={false}
                />

                {/* Leyenda comparativa con cifras exactas */}
                <div className="d-flex justify-content-between align-items-center w-100 mt-2 pt-1 border-top border-light" style={{ fontSize: '0.7rem' }}>
                  <div className="d-flex align-items-center gap-1.5">
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                    <span className="fw-semibold text-dark">UE Santa Bárbara:</span>
                    <strong className="text-success">{personalEscuelas.sb} ({Math.round((personalEscuelas.sb / (personalEscuelas.total || 1)) * 100)}%)</strong>
                  </div>
                  <div className="d-flex align-items-center gap-1.5">
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#0066FF', display: 'inline-block' }}></span>
                    <span className="fw-semibold text-dark">UE Libertador Bolívar:</span>
                    <strong className="text-primary">{personalEscuelas.lb} ({Math.round((personalEscuelas.lb / (personalEscuelas.total || 1)) * 100)}%)</strong>
                  </div>
                </div>
              </div>
            </ChamiloStatCard>
          </div>
        )}

        {/* Tarjeta 3: Censo y Estado de Actualización por Plantel */}
        {canCensoGeneral && (
          <div className="col-12 col-md-6 col-lg-4 d-flex align-items-stretch">
            {(() => {
              const datosActivos = vistaFiltroCenso === 'sb' ? censoPlanteles.sb : (vistaFiltroCenso === 'lb' ? censoPlanteles.lb : censoPlanteles.consolidado);
              const nombreSede = vistaFiltroCenso === 'sb' ? 'UE Santa Bárbara' : (vistaFiltroCenso === 'lb' ? 'UE Libertador Bolívar' : 'Ambos Planteles');

              return (
                <ChamiloStatCard
                  id="card-stat-censo-general"
                  title="Censo y Matrícula por Plantel"
                  value={
                    <div className="d-flex flex-column gap-1">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-baseline">
                          <span className="fw-bolder text-dark" style={{ fontSize: '1.15rem', letterSpacing: '-0.3px', lineHeight: 1 }}>
                            {datosActivos.total}
                          </span>
                          <span className="text-muted fw-semibold" style={{ fontSize: '0.78rem', marginLeft: '6px' }}>
                            estudiantes vinculados
                          </span>
                        </div>
                        <span className={`badge rounded-pill fw-bold px-2 py-0.5 ${
                          vistaFiltroCenso === 'sb' ? 'bg-success text-white' : (vistaFiltroCenso === 'lb' ? 'bg-primary text-white' : 'bg-dark text-white')
                        }`} style={{ fontSize: '0.67rem' }}>
                          {nombreSede}
                        </span>
                      </div>

                      {/* Selector Rápido de Sede */}
                      <div className="d-flex gap-1">
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setVistaFiltroCenso('consolidado'); }}
                          className={`btn btn-xs py-0.5 px-2 rounded-pill fw-bold transition-all ${
                            vistaFiltroCenso === 'consolidado' ? 'btn-dark text-white shadow-xs' : 'btn-white bg-white border text-muted'
                          }`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          Consolidado ({censoPlanteles.consolidado.total})
                        </button>
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setVistaFiltroCenso('sb'); }}
                          className={`btn btn-xs py-0.5 px-2 rounded-pill fw-bold transition-all ${
                            vistaFiltroCenso === 'sb' ? 'btn-success text-white shadow-xs' : 'btn-white bg-white border text-muted'
                          }`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          SB ({censoPlanteles.sb.total})
                        </button>
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setVistaFiltroCenso('lb'); }}
                          className={`btn btn-xs py-0.5 px-2 rounded-pill fw-bold transition-all ${
                            vistaFiltroCenso === 'lb' ? 'btn-primary text-white shadow-xs' : 'btn-white bg-white border text-muted'
                          }`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          LB ({censoPlanteles.lb.total})
                        </button>
                      </div>

                      {/* 3 Estados de Actualización: Actualizados (100%), En Proceso, Sin Iniciar */}
                      <div className="d-flex flex-wrap gap-1 mt-0.5">
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-1.5 py-0.5 fw-bold" style={{ fontSize: '0.67rem' }} title="Expedientes con actualización completada (100%)">
                          <i className="bi bi-check2-circle me-1"></i>{datosActivos.pctActualizados}% Actualizados ({datosActivos.actualizados})
                        </span>
                        <span className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-50 px-1.5 py-0.5 fw-bold" style={{ fontSize: '0.67rem' }} title="Expedientes con actualización en proceso">
                          <i className="bi bi-clock-history me-1 text-warning"></i>{datosActivos.pctIniciados}% En Proceso ({datosActivos.iniciados})
                        </span>
                        <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-1.5 py-0.5 fw-bold" style={{ fontSize: '0.67rem' }} title="Expedientes sin iniciar por el representante">
                          <i className="bi bi-exclamation-circle me-1"></i>{datosActivos.pctNoIniciados}% Sin Iniciar ({datosActivos.noIniciados})
                        </span>
                      </div>
                    </div>
                  }
                  subtitle={`Auditoría del censo: ${datosActivos.pctActualizados}% de expedientes completados al día`}
                  icon="bi-bar-chart-line-fill"
                  customIcon={<IconoMatriculaCenso size={30} color="#06b6d4" />}
                  color="#06b6d4"
                  percentage={datosActivos.pctActualizados}
                  statusBadge={{ text: `${datosActivos.pctActualizados}% Al Día`, type: datosActivos.pctActualizados >= 75 ? 'success' : 'warning' }}
                  actionButton={{
                    label: 'Ver Censo',
                    icon: 'bi-people-fill',
                    onClick: () => navigate('/categoria/Gestión Estudiantil/Vincular Estudiante')
                  }}
                  onClick={() => navigate('/categoria/Gestión Estudiantil/Vincular Estudiante')}
                >
                  <div className="mt-2 pt-2 border-top border-light d-flex flex-column align-items-center w-100">
                    <div className="d-flex justify-content-between w-100 align-items-center mb-1">
                      <span className="extra-small fw-bold text-muted text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                        Distribución de Matrícula
                      </span>
                      <span className="badge bg-info bg-opacity-10 text-info fw-bold extra-small" style={{ fontSize: '0.67rem' }}>
                        {nombreSede}
                      </span>
                    </div>
                    <ChamiloDonutChart
                      segments={[
                        { label: 'Actualizados', value: datosActivos.actualizados, color: '#10b981' },
                        { label: 'En Proceso', value: datosActivos.iniciados, color: '#f59e0b' },
                        { label: 'Sin Iniciar', value: datosActivos.noIniciados, color: '#94a3b8' },
                      ]}
                      total={datosActivos.total || 1}
                      size={95}
                      thickness={11}
                      centerTitle={String(datosActivos.total)}
                      centerSubtitle="Alumnos"
                      darkTheme={false}
                    />

                    {/* Leyenda comparativa de ambos planteles con cifras institucionales exactas */}
                    <div className="d-flex flex-column gap-1 w-100 mt-2 pt-1 border-top border-light" style={{ fontSize: '0.7rem' }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-1.5">
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                          <span className="fw-semibold text-dark">UE Santa Bárbara:</span>
                          <strong className="text-success">{censoPlanteles.sb.total} est.</strong>
                        </div>
                        <span className="text-muted" style={{ fontSize: '0.66rem' }}>
                          <b className="text-success">{censoPlanteles.sb.pctActualizados}%</b> act. &bull; <b className="text-warning">{censoPlanteles.sb.pctIniciados}%</b> proc. &bull; <b className="text-secondary">{censoPlanteles.sb.pctNoIniciados}%</b> sin inic.
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-1.5">
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#0066FF', display: 'inline-block' }}></span>
                          <span className="fw-semibold text-dark">UE Libertador Bolívar:</span>
                          <strong className="text-primary">{censoPlanteles.lb.total} est.</strong>
                        </div>
                        <span className="text-muted" style={{ fontSize: '0.66rem' }}>
                          <b className="text-success">{censoPlanteles.lb.pctActualizados}%</b> act. &bull; <b className="text-warning">{censoPlanteles.lb.pctIniciados}%</b> proc. &bull; <b className="text-secondary">{censoPlanteles.lb.pctNoIniciados}%</b> sin inic.
                        </span>
                      </div>
                    </div>
                  </div>
                </ChamiloStatCard>
              );
            })()}
          </div>
        )}

        {/* Tarjeta: Solicitudes de Cupos por Plantel (Aprobados, En Evaluación, Rechazados) */}
        {canSolicitudesCupos && (
          <div className="col-12 col-md-6 col-lg-4 d-flex align-items-stretch">
            {(() => {
              const datosActivosCupos = vistaFiltroCupos === 'sb' ? solicitudesCupos.sb : (vistaFiltroCupos === 'lb' ? solicitudesCupos.lb : solicitudesCupos.consolidado);
              const nombreSedeCupos = vistaFiltroCupos === 'sb' ? 'UE Santa Bárbara' : (vistaFiltroCupos === 'lb' ? 'UE Libertador Bolívar' : 'Ambos Planteles');

              return (
                <ChamiloStatCard
                  id="card-stat-solicitudes-cupos"
                  title="Solicitudes de Cupos por Plantel"
                  value={
                    <div className="d-flex flex-column gap-1">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-baseline">
                          <span className="fw-bolder text-dark" style={{ fontSize: '1.15rem', letterSpacing: '-0.3px', lineHeight: 1 }}>
                            {datosActivosCupos.total}
                          </span>
                          <span className="text-muted fw-semibold" style={{ fontSize: '0.78rem', marginLeft: '6px' }}>
                            solicitudes recibidas
                          </span>
                        </div>
                        <span className={`badge rounded-pill fw-bold px-2 py-0.5 ${
                          vistaFiltroCupos === 'sb' ? 'bg-success text-white' : (vistaFiltroCupos === 'lb' ? 'bg-primary text-white' : 'bg-dark text-white')
                        }`} style={{ fontSize: '0.67rem' }}>
                          {nombreSedeCupos}
                        </span>
                      </div>

                      {/* Selector Rápido de Sede */}
                      <div className="d-flex gap-1">
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setVistaFiltroCupos('consolidado'); }}
                          className={`btn btn-xs py-0.5 px-2 rounded-pill fw-bold transition-all ${
                            vistaFiltroCupos === 'consolidado' ? 'btn-dark text-white shadow-xs' : 'btn-white bg-white border text-muted'
                          }`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          Consolidado ({solicitudesCupos.consolidado.total})
                        </button>
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setVistaFiltroCupos('sb'); }}
                          className={`btn btn-xs py-0.5 px-2 rounded-pill fw-bold transition-all ${
                            vistaFiltroCupos === 'sb' ? 'btn-success text-white shadow-xs' : 'btn-white bg-white border text-muted'
                          }`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          SB ({solicitudesCupos.sb.total})
                        </button>
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); setVistaFiltroCupos('lb'); }}
                          className={`btn btn-xs py-0.5 px-2 rounded-pill fw-bold transition-all ${
                            vistaFiltroCupos === 'lb' ? 'btn-primary text-white shadow-xs' : 'btn-white bg-white border text-muted'
                          }`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          LB ({solicitudesCupos.lb.total})
                        </button>
                      </div>

                      {/* 3 Estados de Solicitud: Aprobados, En Evaluación, Rechazados */}
                      <div className="d-flex flex-wrap gap-1 mt-0.5">
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-1.5 py-0.5 fw-bold" style={{ fontSize: '0.67rem' }} title="Solicitudes aprobadas / admitidas">
                          <i className="bi bi-check-circle-fill me-1"></i>{datosActivosCupos.pctAprobados}% Aprobados ({datosActivosCupos.aprobados})
                        </span>
                        <span className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-50 px-1.5 py-0.5 fw-bold" style={{ fontSize: '0.67rem' }} title="Solicitudes en evaluación / revisión">
                          <i className="bi bi-hourglass-split me-1 text-warning"></i>{datosActivosCupos.pctEvaluacion}% En Evaluación ({datosActivosCupos.evaluacion})
                        </span>
                        <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-1.5 py-0.5 fw-bold" style={{ fontSize: '0.67rem' }} title="Solicitudes no admitidas / rechazadas">
                          <i className="bi bi-x-circle-fill me-1"></i>{datosActivosCupos.pctRechazados}% Rechazados ({datosActivosCupos.rechazados})
                        </span>
                      </div>
                    </div>
                  }
                  subtitle={`Progreso de asignación: ${datosActivosCupos.pctProgreso}% de avance (${datosActivosCupos.aprobados} aprobados de ${datosActivosCupos.baseProgreso} activos)`}
                  icon="bi-envelope-paper-heart-fill"
                  customIcon={<IconoSolicitudCupos size={30} color="#8b5cf6" />}
                  color="#8b5cf6"
                  percentage={datosActivosCupos.pctProgreso}
                  statusBadge={{ text: `${datosActivosCupos.pctProgreso}% Avance`, type: datosActivosCupos.pctProgreso >= 75 ? 'success' : 'warning' }}
                  actionButton={{
                    label: 'Gestionar Cupos',
                    icon: 'bi-clipboard-check-fill',
                    onClick: () => navigate('/categoria/Gestión Estudiantil/Gestión de Admisiones')
                  }}
                  onClick={() => navigate('/categoria/Gestión Estudiantil/Gestión de Admisiones')}
                >
                  <div className="mt-2 pt-2 border-top border-light d-flex flex-column align-items-center w-100">
                    <div className="d-flex justify-content-between w-100 align-items-center mb-1">
                      <span className="extra-small fw-bold text-muted text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                        Distribución de Solicitudes
                      </span>
                      <span className="badge bg-opacity-10 fw-bold extra-small" style={{ color: '#7c3aed', backgroundColor: '#ede9fe', fontSize: '0.67rem' }}>
                        {nombreSedeCupos}
                      </span>
                    </div>
                    <ChamiloDonutChart
                      segments={[
                        { label: 'Aprobados', value: datosActivosCupos.aprobados, color: '#10b981' },
                        { label: 'En Evaluación', value: datosActivosCupos.evaluacion, color: '#f59e0b' },
                        { label: 'Rechazados', value: datosActivosCupos.rechazados, color: '#ef4444' },
                      ]}
                      total={datosActivosCupos.total || 1}
                      size={95}
                      thickness={11}
                      centerTitle={String(datosActivosCupos.total)}
                      centerSubtitle="Cupos"
                      darkTheme={false}
                    />

                    {/* Leyenda comparativa de ambos planteles con cifras institucionales exactas */}
                    <div className="d-flex flex-column gap-1 w-100 mt-2 pt-1 border-top border-light" style={{ fontSize: '0.7rem' }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-1.5">
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                          <span className="fw-semibold text-dark">UE Santa Bárbara:</span>
                          <strong className="text-success">{solicitudesCupos.sb.total} sol.</strong>
                        </div>
                        <span className="text-muted" style={{ fontSize: '0.66rem' }}>
                          <b className="text-success">{solicitudesCupos.sb.pctAprobados}%</b> apr. &bull; <b className="text-warning">{solicitudesCupos.sb.pctEvaluacion}%</b> eval. &bull; <b className="text-danger">{solicitudesCupos.sb.pctRechazados}%</b> rech.
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-1.5">
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#0066FF', display: 'inline-block' }}></span>
                          <span className="fw-semibold text-dark">UE Libertador Bolívar:</span>
                          <strong className="text-primary">{solicitudesCupos.lb.total} sol.</strong>
                        </div>
                        <span className="text-muted" style={{ fontSize: '0.66rem' }}>
                          <b className="text-success">{solicitudesCupos.lb.pctAprobados}%</b> apr. &bull; <b className="text-warning">{solicitudesCupos.lb.pctEvaluacion}%</b> eval. &bull; <b className="text-danger">{solicitudesCupos.lb.pctRechazados}%</b> rech.
                        </span>
                      </div>
                    </div>
                  </div>
                </ChamiloStatCard>
              );
            })()}
          </div>
        )}

        {/* Tarjeta 4: Estudiantes Vinculados a él y Avance de Actualización */}
        {canEstudiantesVinculados && (
          <div className="col-12 col-md-6 col-lg-4 d-flex align-items-stretch">
            <ChamiloStatCard
              id="card-stat-estudiantes-vinculados"
              title="Estudiantes Vinculados"
              value={
                estudiantesVinculados.length === 1 ? (
                  <span className="text-dark fw-bolder fs-5">{estudiantesVinculados[0].nombre_completo}</span>
                ) : (
                  <div className="d-flex flex-column gap-1">
                    <span className="fw-bolder fs-5 text-dark">{estudiantesVinculados.length} Estudiantes Vinculados</span>
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      {estudiantesVinculados.map((est: any) => (
                        <span key={est.id} className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 extra-small fw-bold">
                          <i className="bi bi-person-fill me-1"></i>
                          {est.nombre_completo}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              }
              subtitle={
                estudiantesVinculados.length === 1
                  ? `Avance de actualización: ${avanceActualizacionPromedio}% completado`
                  : `Avance general de expedientes: ${avanceActualizacionPromedio}% al día`
              }
              icon="bi-mortarboard-fill"
              customIcon={<IconoEstudiante size={30} color="#10b981" />}
              color="#10b981"
              percentage={avanceActualizacionPromedio}
              statusBadge={{ text: `${avanceActualizacionPromedio}% Al Día`, type: avanceActualizacionPromedio === 100 ? 'success' : 'info' }}
              actionButton={{
                label: 'Actualizar',
                icon: 'bi-pencil-square',
                onClick: () => navigate('/categoria/Gestión Estudiantil/Actualización de Datos')
              }}
              onClick={() => navigate('/categoria/Gestión Estudiantil/Actualización de Datos')}
            >
              <div className="mt-2 pt-2 border-top border-light w-100">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="extra-small fw-bold text-muted text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                    Asistencia y Registro Semanal
                  </span>
                  <span className="badge bg-success bg-opacity-10 text-success fw-bold extra-small">94% Regular</span>
                </div>
                <ChamiloAttendanceBars
                  color="#10b981"
                  height={64}
                  darkTheme={false}
                />
              </div>
            </ChamiloStatCard>
          </div>
        )}

        {/* Tarjeta 5: Rutas Escolares de Representados */}
        {canRutasEstudiantes && (
          <div className="col-12 col-md-6 col-lg-4 d-flex align-items-stretch">
            <ChamiloStatCard
              id="card-stat-rutas-seleccionadas"
              title="Rutas Escolares de Representados"
              value={
                rutasEstudiantes.length === 1 ? (
                  <span className="text-dark fw-bolder fs-5">{rutasEstudiantes[0] || 'Sin Ruta Asignada'}</span>
                ) : (
                  <div className="d-flex flex-column gap-1">
                    <span className="fw-bolder fs-5 text-dark">
                      {rutasEstudiantes.length > 0 ? `${rutasEstudiantes.length} Rutas Asignadas` : 'Sin Ruta Asignada'}
                    </span>
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      {rutasEstudiantes.map((ruta: string, idx: number) => (
                        <span key={idx} className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-50 px-2 py-1 extra-small fw-bold">
                          <i className="bi bi-bus-front me-1 text-warning"></i>
                          {ruta}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              }
              subtitle="Rutas escolares asignadas en el formulario de actualización"
              icon="bi-bus-front-fill"
              customIcon={<IconoUnidadTransporte size={30} color="#f97316" />}
              color="#f97316"
              percentage={rutasEstudiantes.length > 0 ? 100 : 0}
              statusBadge={{ text: rutasEstudiantes.length > 0 ? 'En Servicio' : 'Pendiente', type: rutasEstudiantes.length > 0 ? 'success' : 'warning' }}
              actionButton={{
                label: 'Seguir',
                icon: 'bi-geo-alt-fill',
                onClick: () => navigate('/categoria/Gestión Estudiantil/Transporte Escolar')
              }}
              onClick={() => navigate('/categoria/Gestión Estudiantil/Transporte Escolar')}
            >
              <div className="mt-2 pt-2 border-top border-light w-100">
                <ChamiloRutogramaVisual
                  routeName={rutasEstudiantes[0] || (activeSchoolCode === 'sb' ? 'Ruta R-01 • El Tejero' : 'Ruta R-02 • Miraflores')}
                  busNumber="Unidad 04 • Escolar"
                  occupancyPercent={92}
                  accentColor="#f97316"
                  darkTheme={false}
                  stops={[
                    { id: '1', name: 'Base Salida', time: '06:30 AM', status: 'passed' },
                    { id: '2', name: 'Punto Parada', time: '06:55 AM', status: 'current', studentsCount: 18 },
                    { id: '3', name: activeSchoolCode === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar', time: '07:20 AM', status: 'upcoming', studentsCount: 34 },
                  ]}
                />
              </div>
            </ChamiloStatCard>
          </div>
        )}

        {/* Tarjeta 6: Monitoreo y Rutas de Transporte */}
        {canRutaTrabajador && (
          <div className="col-12 col-md-6 col-lg-4 d-flex align-items-stretch">
            {(() => {
              // Rutas filtradas según la escuela seleccionada
              const rutasDisponibles = rutasTransporteData.filter(r => r.escuela_codigo === escuelaTransporte);
              const rutaActiva = rutasDisponibles.find(r => r.id === rutaSeleccionadaId) || rutasDisponibles[0] || null;

              // Obtener IDs de paradas de la ruta
              let stopIds: string[] = [];
              if (rutaActiva) {
                if (Array.isArray(rutaActiva.paradas_json)) {
                  stopIds = [...rutaActiva.paradas_json];
                } else if (typeof rutaActiva.paradas_json === 'string') {
                  try { stopIds = JSON.parse(rutaActiva.paradas_json); } catch (e) {}
                }
              }

              // Resolver objetos de parada desde el catálogo o fallback
              const paradasMapeadas = stopIds.map(id => {
                const encontrada = paradasTransporteData.find(p => p.id === id);
                if (encontrada) return encontrada;
                return PARADAS_FALLBACK[id] || null;
              }).filter(Boolean);

              const nombrePlantel = escuelaTransporte === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
              const paradaEscuela = {
                id: 'escuela_virtual',
                nombre_parada: nombrePlantel,
                hora_estimada: '07:15 AM',
                sector: 'Sede Institucional'
              };

              // Ordenar paradas según el sentido (Ida: Comunidad -> Escuela | Vuelta: Escuela -> Comunidad)
              const paradasOrdenadas = sentidoTransporte === 'Escuela - Casa'
                ? [paradaEscuela, ...[...paradasMapeadas].reverse()]
                : [...paradasMapeadas, paradaEscuela];

              // Buscar operación activa del día para esta ruta y sentido
              const opHoy = operacionesTransporteData.find(
                o => o.ruta_id === rutaActiva?.id && (o.sentido === sentidoTransporte || o.sentido?.toLowerCase().includes(sentidoTransporte === 'Casa - Escuela' ? 'ida' : 'vuelta'))
              );

              // Determinar estado de la ruta y de cada parada
              const estadoOperacion = opHoy?.estado || 'En Espera'; // 'En Ruta' | 'Finalizada' | 'En Espera' | 'Programada'
              const paradaActualId = opHoy?.ubicacion_actual;
              const indiceActual = paradasOrdenadas.findIndex(p => p.id === paradaActualId);
              const historial = opHoy?.historial_paradas || {};

              const stopsParaVisual: RouteStop[] = paradasOrdenadas.map((p, idx) => {
                let status: 'passed' | 'current' | 'upcoming' = 'upcoming';

                if (estadoOperacion === 'Finalizada') {
                  status = 'passed';
                } else if (estadoOperacion === 'En Ruta') {
                  if (indiceActual >= 0) {
                    if (idx < indiceActual) status = 'passed';
                    else if (idx === indiceActual) status = 'current';
                    else status = 'upcoming';
                  } else {
                    if (historial[p.id]) status = 'passed';
                    else if (idx === 0) status = 'current';
                    else status = 'upcoming';
                  }
                } else {
                  // En Espera o Programada: primer nodo es el punto de partida
                  if (idx === 0) status = 'current';
                  else status = 'upcoming';
                }

                const time = historial[p.id] || p.hora_estimada || (idx === 0 ? '06:20 AM' : (idx === paradasOrdenadas.length - 1 ? '07:15 AM' : '06:45 AM'));

                return {
                  id: p.id,
                  name: p.nombre_parada,
                  time,
                  status
                };
              });

              // Si hay más de 4 paradas, simplificar para que el rutograma visual se aprecie limpio en la tarjeta
              let stopsRutograma = stopsParaVisual;
              if (stopsParaVisual.length > 4) {
                const primerNodo = stopsParaVisual[0];
                const ultimoNodo = stopsParaVisual[stopsParaVisual.length - 1];
                const nodoCurrent = stopsParaVisual.find(s => s.status === 'current') || stopsParaVisual[Math.floor(stopsParaVisual.length / 2)];
                const idxCurrent = stopsParaVisual.indexOf(nodoCurrent);
                const intermedio = idxCurrent > 0 && idxCurrent < stopsParaVisual.length - 1
                  ? nodoCurrent
                  : stopsParaVisual[Math.floor(stopsParaVisual.length / 2)];

                const paradasMuestra = [primerNodo, intermedio, ultimoNodo];
                if (idxCurrent > 0 && idxCurrent < stopsParaVisual.length - 1 && intermedio.id !== nodoCurrent.id) {
                  paradasMuestra.splice(2, 0, nodoCurrent);
                }
                stopsRutograma = paradasMuestra.filter((s, idx, arr) => arr.findIndex(x => x.id === s.id) === idx);
              }

              // Progreso del recorrido (% completado)
              const paradasPasadas = stopsParaVisual.filter(s => s.status === 'passed').length;
              const pctProgresoRecorrido = stopsParaVisual.length > 1
                ? (estadoOperacion === 'Finalizada' ? 100 : Math.round((paradasPasadas / (stopsParaVisual.length - 1)) * 100))
                : (estadoOperacion === 'Finalizada' ? 100 : 25);

              // Parada actual o próxima para la etiqueta
              const paradaEnfocada = stopsParaVisual.find(s => s.status === 'current') || stopsParaVisual.find(s => s.status === 'upcoming') || stopsParaVisual[0];

              return (
                <ChamiloStatCard
                  id="card-stat-ruta-trabajador"
                  title="Monitoreo de Rutas de Transporte"
                  value={
                    <div className="d-flex flex-column gap-1">
                      {/* Fila 1: Nombre de la ruta y Estado */}
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-baseline">
                          <span className="fw-bolder text-dark" style={{ fontSize: '1.12rem', letterSpacing: '-0.3px', lineHeight: 1 }}>
                            {rutaActiva?.nombre || 'Ruta Escolar'}
                          </span>
                        </div>
                        <span className={`badge rounded-pill fw-bold px-2 py-0.5 ${
                          estadoOperacion === 'En Ruta' ? 'bg-success text-white' : (estadoOperacion === 'Finalizada' ? 'bg-primary text-white' : 'bg-warning text-dark')
                        }`} style={{ fontSize: '0.67rem' }}>
                          <i className={`bi ${estadoOperacion === 'En Ruta' ? 'bi-broadcast me-1' : (estadoOperacion === 'Finalizada' ? 'bi-check2-circle me-1' : 'bi-clock-history me-1')}`}></i>
                          {estadoOperacion}
                        </span>
                      </div>

                      {/* Fila 2: Selector 1 - Plantel / Escuela */}
                      <div className="d-flex gap-1 align-items-center">
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEscuelaTransporte('sb');
                            const sbRutas = rutasTransporteData.filter(r => r.escuela_codigo === 'sb');
                            if (sbRutas.length > 0) setRutaSeleccionadaId(sbRutas[0].id);
                          }}
                          className={`btn btn-xs py-0.5 px-2 rounded-pill fw-bold transition-all ${
                            escuelaTransporte === 'sb' ? 'btn-success text-white shadow-xs' : 'btn-white bg-white border text-muted'
                          }`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          <i className="bi bi-building me-1"></i>UE Santa Bárbara
                        </button>
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEscuelaTransporte('lb');
                            const lbRutas = rutasTransporteData.filter(r => r.escuela_codigo === 'lb');
                            if (lbRutas.length > 0) setRutaSeleccionadaId(lbRutas[0].id);
                          }}
                          className={`btn btn-xs py-0.5 px-2 rounded-pill fw-bold transition-all ${
                            escuelaTransporte === 'lb' ? 'btn-primary text-white shadow-xs' : 'btn-white bg-white border text-muted'
                          }`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          <i className="bi bi-building me-1"></i>UE Libertador Bolívar
                        </button>
                      </div>

                      {/* Fila 3: Selector 2 - Ruta (Select) & Selector 3 - Sentido (Ida / Vuelta) */}
                      <div className="d-flex gap-1.5 align-items-center mt-0.5">
                        <select
                          value={rutaActiva?.id || ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setRutaSeleccionadaId(e.target.value)}
                          className="form-select form-select-sm py-0.5 px-2 fw-semibold text-dark border shadow-2xs flex-grow-1"
                          style={{ fontSize: '0.68rem', borderRadius: '8px', background: '#f8fafc', borderColor: '#cbd5e1' }}
                        >
                          {rutasDisponibles.map((r: any) => (
                            <option key={r.id} value={r.id}>
                              {r.nombre}
                            </option>
                          ))}
                        </select>

                        {/* Toggle Ida / Vuelta */}
                        <div className="btn-group btn-group-sm flex-shrink-0" role="group">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSentidoTransporte('Casa - Escuela'); }}
                            className={`btn btn-xs py-0.5 px-2 fw-bold transition-all ${
                              sentidoTransporte === 'Casa - Escuela' ? 'btn-dark text-white' : 'btn-outline-secondary bg-white'
                            }`}
                            style={{ fontSize: '0.65rem', borderRadius: '8px 0 0 8px' }}
                            title="Recorrido de Ida: Comunidad / Paradas hacia la Escuela"
                          >
                            🚌 Ida
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSentidoTransporte('Escuela - Casa'); }}
                            className={`btn btn-xs py-0.5 px-2 fw-bold transition-all ${
                              sentidoTransporte === 'Escuela - Casa' ? 'btn-dark text-white' : 'btn-outline-secondary bg-white'
                            }`}
                            style={{ fontSize: '0.65rem', borderRadius: '0 8px 8px 0' }}
                            title="Recorrido de Vuelta: Escuela hacia la Comunidad / Paradas"
                          >
                            🏫 Vuelta
                          </button>
                        </div>
                      </div>

                      {/* Fila 4: Detalle de Estatus Actual */}
                      <div className="d-flex flex-wrap gap-1 mt-0.5">
                        <span className="badge bg-light text-dark border px-1.5 py-0.5 fw-bold" style={{ fontSize: '0.66rem' }}>
                          <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                          {estadoOperacion === 'Finalizada' ? 'Destino Final: ' : (estadoOperacion === 'En Ruta' ? 'Parada Actual: ' : 'Punto de Salida: ')}
                          <span className="text-primary fw-bolder">{paradaEnfocada?.name || nombrePlantel}</span>
                        </span>
                        <span className="badge bg-light text-secondary border px-1.5 py-0.5 fw-semibold" style={{ fontSize: '0.66rem' }}>
                          <i className="bi bi-bus-front text-muted me-1"></i>
                          {rutaActiva?.unidad_modelo || 'Unidad Asignada'} {rutaActiva?.chofer_nombre ? `• ${rutaActiva.chofer_nombre}` : ''}
                        </span>
                      </div>
                    </div>
                  }
                  subtitle={`Recorrido: ${sentidoTransporte === 'Casa - Escuela' ? 'Ida a la Escuela' : 'Vuelta a las Casas'} (${stopsParaVisual.length} paradas registradas)`}
                  icon="bi-bus-front-fill"
                  customIcon={<IconoUnidadPersonal size={30} color="#8b5cf6" />}
                  color="#8b5cf6"
                  percentage={pctProgresoRecorrido}
                  statusBadge={{
                    text: estadoOperacion === 'En Ruta' ? 'En Ruta Activa' : (estadoOperacion === 'Finalizada' ? '100% Completada' : 'En Espera'),
                    type: estadoOperacion === 'En Ruta' ? 'success' : (estadoOperacion === 'Finalizada' ? 'info' : 'warning')
                  }}
                  actionButton={{
                    label: 'Gestor de Transporte',
                    icon: 'bi-bus-front',
                    onClick: () => navigate('/categoria/Servicios y Bienestar/Transporte Escolar')
                  }}
                  onClick={() => navigate('/categoria/Servicios y Bienestar/Transporte Escolar')}
                >
                  <div className="mt-2 pt-2 border-top border-light w-100">
                    <ChamiloRutogramaVisual
                      routeName={rutaActiva?.nombre || 'Ruta Escolar'}
                      busNumber={rutaActiva?.unidad_modelo || 'Unidad Oficial'}
                      statusText={estadoOperacion}
                      occupancyPercent={pctProgresoRecorrido}
                      percentLabel="avance"
                      nextStopName={paradaEnfocada?.name}
                      accentColor={escuelaTransporte === 'sb' ? '#10b981' : '#0284c7'}
                      darkTheme={false}
                      stops={stopsRutograma}
                    />
                  </div>
                </ChamiloStatCard>
              );
            })()}
          </div>
        )}

        {/* Tarjeta 7: Notificaciones y Avisos Activos */}
        {canNotificaciones && (
          <div className="col-12 col-md-6 col-lg-4 d-flex align-items-stretch">
            <ChamiloStatCard
              id="card-stat-notificaciones"
              title="Notificaciones y Avisos Activos"
              value={
                <div className="d-flex flex-column gap-1">
                  <span className="fw-bolder fs-5 text-dark">
                    {encuestasPendientes.length > 0 ? `${encuestasPendientes.length} Avisos y Consultas` : 'Bandeja al Día'}
                  </span>
                  <div className="d-flex flex-wrap gap-1 mt-1">
                    {encuestasPendientes.length > 0 && (
                      <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-0.5 extra-small fw-bold">
                        <i className="bi bi-ui-checks me-1"></i>{encuestasPendientes.length} Consulta{encuestasPendientes.length > 1 ? 's' : ''} Pendiente{encuestasPendientes.length > 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2 py-0.5 extra-small fw-bold">
                      <i className="bi bi-broadcast me-1"></i>Canal Institucional
                    </span>
                  </div>
                </div>
              }
              subtitle="Consultas comunitarias y avisos oficiales para tu rol"
              icon="bi-bell-fill"
              customIcon={<IconoAvisosRadar size={30} color="#ec4899" />}
              color="#ec4899"
              percentage={encuestasPendientes.length > 0 ? 100 : 0}
              statusBadge={{ text: encuestasPendientes.length > 0 ? 'Pendiente' : 'Al Día', type: encuestasPendientes.length > 0 ? 'warning' : 'success' }}
              actionButton={{
                label: 'Ver Avisos',
                icon: 'bi-chat-left-dots-fill',
                onClick: () => navigate('/categoria/Diseños/Encuesta')
              }}
              onClick={() => navigate('/categoria/Diseños/Encuesta')}
            >
              <div className="mt-2 pt-2 border-top border-light w-100">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="extra-small fw-bold text-muted text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                    Frecuencia de Avisos
                  </span>
                  <span className="badge fw-bold extra-small" style={{ color: '#ec4899', backgroundColor: '#fdf2f8' }}>Canal Activo</span>
                </div>
                <ChamiloSparkline
                  data={[
                    { label: 'Lun', value: 3 },
                    { label: 'Mar', value: 5 },
                    { label: 'Mié', value: 2 },
                    { label: 'Jue', value: 7 },
                    { label: 'Vie', value: 4 },
                    { label: 'Sáb', value: 1 },
                    { label: 'Hoy', value: Math.max(1, encuestasPendientes.length) },
                  ]}
                  height={64}
                  color="#ec4899"
                  gradientId="sparkline-notificaciones-grad"
                  showPoints={true}
                />
              </div>
            </ChamiloStatCard>
          </div>
        )}
      </div>

      {/* ── 4. AVISOS INSTITUCIONALES & CONSULTAS ── */}
      {encuestasPendientes.length > 0 && (
        <div className="mb-4 animate__animated animate__fadeInDown">
          <div 
            className="card border-0 shadow-sm rounded-4 p-4 text-white position-relative overflow-hidden"
            style={{ 
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              borderRadius: '24px',
              boxShadow: '0 8px 24px rgba(236, 72, 153, 0.2)'
            }}
          >
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 position-relative z-1">
              <div className="d-flex align-items-center gap-3">
                <div className="p-3 bg-white bg-opacity-20 rounded-circle text-white d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '52px', height: '52px' }}>
                  <i className="bi bi-ui-checks-grid fs-3"></i>
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                    <span className="badge bg-white text-dark fw-bold px-2.5 py-1 rounded-pill small">
                      {encuestasPendientes[0].es_obligatoria ? '⚠️ Consulta Obligatoria' : '📋 Consulta Institucional'}
                    </span>
                    <span className="badge bg-white bg-opacity-25 text-white fw-semibold px-2.5 py-1 rounded-pill small">
                      Para tu rol: {usuario.rol || 'Comunidad'}
                    </span>
                  </div>
                  <h5 className="fw-bolder mb-1 text-white">{encuestasPendientes[0].titulo}</h5>
                  <p className="mb-0 text-white-50 small" style={{ maxWidth: '650px' }}>
                    {encuestasPendientes[0].descripcion || 'Tu participación es fundamental para la gestión educativa.'}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => navigate('/categoria/Diseños/Encuesta')}
                className="btn btn-white text-dark rounded-pill px-4 py-2.5 fw-bold shadow hover-efecto d-flex align-items-center gap-2 text-nowrap"
                style={{ backgroundColor: '#ffffff', borderRadius: '50px' }}
              >
                <i className="bi bi-pencil-square" style={{ color: '#ec4899' }}></i>
                <span>Responder ({encuestasPendientes.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. PIE DE PÁGINA: ORGANIGRAMA Y ESTRUCTURA INSTITUCIONAL (TECNOLÓGICO) ── */}
      {tienePermiso('Cadena Supervisoria', 'ver') && (
        <div 
          className="tech-card p-4 bg-white mb-3"
          style={{
            borderRadius: '26px',
            border: '1.5px solid #e2e8f0',
            borderTop: '5px solid #10b981'
          }}
        >
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <div 
                className="tech-icon-wrapper flex-shrink-0" 
                style={{ 
                  width: '58px', 
                  height: '58px', 
                  fontSize: '1.65rem',
                  backgroundColor: '#ecfdf5',
                  color: '#10b981',
                  border: '2px solid #a7f3d0',
                  borderRadius: '18px',
                  boxShadow: '0 6px 16px rgba(16, 185, 129, 0.2)'
                }}
              >
                <i className="bi bi-diagram-3-fill"></i>
              </div>
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="status-beacon-live" style={{ color: '#10b981' }}></span>
                  <span className="extra-small fw-bold text-success text-uppercase" style={{ fontSize: '0.72rem' }}>
                    Red Escolar Interconectada
                  </span>
                </div>
                <h5 className="fw-bolder mb-0.5 text-dark">Estructura Organizativa Institucional</h5>
                <p className="text-muted small mb-0 d-none d-md-block">Consulte en tiempo real el mapa de dependencias, la cadena supervisoria y el personal activo de ambas instituciones.</p>
              </div>
            </div>
            <button 
              className="btn text-white rounded-pill px-4 py-2.5 fw-bold shadow hover-efecto d-flex align-items-center gap-2" 
              style={{ 
                backgroundColor: '#10b981',
                borderRadius: '50px',
                boxShadow: '0 6px 18px rgba(16, 185, 129, 0.3)' 
              }}
              onClick={() => navigate('/categoria/Organización%20Escolar/Cadena%20Supervisoria')}
            >
              <i className="bi bi-diagram-2"></i>
              <span>Explorar Organigrama Dinámico</span>
              <i className="bi bi-arrow-right extra-small"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
