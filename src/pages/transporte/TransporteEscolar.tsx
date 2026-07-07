import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { usePermisos } from '../../hooks/usePermisos';
import { subscribeToWebPush } from '../../lib/webPush';
import html2canvas from 'html2canvas';

import { DashboardView } from './components/DashboardView';
import { ConfiguracionView } from './components/ConfiguracionView';
import { OperacionView } from './components/OperacionView';
import { VisorView } from './components/VisorView';
import { CargaMasivaView } from './components/CargaMasivaView';
import { ModalParada, ModalRuta, ModalAsignacion } from './components/Modals';

// ─── SVG Animated Bus — Transporte Escolar Venezuela ──────────────────────────────
// ‘size’ = altura del bus en px. El ancho se calcula con la relación 80:56.
const AnimatedBusSVG = ({ size = 48, className = '' }: { size?: number; color?: string; className?: string }) => {
  const busW = Math.round(size * (80 / 56));
  const busH = size;
  return (
    <svg width={busW} height={busH} viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* ── Main body — amarillo escolar ── */}
      <rect x="3" y="10" width="70" height="30" rx="5" fill="#f7c900" />
      {/* Front rounded nose */}
      <rect x="63" y="10" width="10" height="30" rx="4" fill="#f7c900" />
      {/* Black trim line top */}
      <rect x="3" y="10" width="70" height="3" rx="2" fill="#1c1c1c" />
      {/* Black trim line bottom */}
      <rect x="3" y="35" width="70" height="3" fill="#1c1c1c" />

      {/* ── Windows — tinted dark blue ── */}
      <rect x="6"  y="14" width="10" height="9" rx="2" fill="#1e3a5f" opacity="0.85" />
      <rect x="18" y="14" width="10" height="9" rx="2" fill="#1e3a5f" opacity="0.85" />
      <rect x="30" y="14" width="10" height="9" rx="2" fill="#1e3a5f" opacity="0.85" />
      <rect x="42" y="14" width="10" height="9" rx="2" fill="#1e3a5f" opacity="0.85" />
      {/* Front windshield */}
      <rect x="55" y="13" width="12" height="13" rx="3" fill="#1e3a5f" opacity="0.75" />

      {/* ── TRANSPORTE ESCOLAR text ── */}
      <text x="35" y="32" textAnchor="middle" fill="#1c1c1c" fontSize="4.2" fontWeight="bold" fontFamily="Arial" letterSpacing="0.3">TRANSPORTE ESCOLAR</text>

      {/* ── PDVSA logo on side ── */}
      <image href="/assets/img/pdvsa.svg" x="6" y="25" width="10" height="10" />

      {/* Front headlights */}
      <rect x="68" y="16" width="4" height="3" rx="1" fill="#fef08a" />
      <rect x="68" y="28" width="4" height="3" rx="1" fill="#fbbf24" opacity="0.7" />
      {/* Front bumper */}
      <rect x="70" y="24" width="6" height="6" rx="1" fill="#374151" />
      {/* Door line */}
      <line x1="52" y1="12" x2="52" y2="38" stroke="#1c1c1c" strokeWidth="0.8"/>

      {/* ── Wheels ── */}
      <circle cx="18" cy="42" r="6.5" fill="#1e293b" />
      <circle cx="18" cy="42" r="4"   fill="#6b7280" />
      <circle cx="18" cy="42" r="1.8" fill="#d1d5db" />
      <circle cx="56" cy="42" r="6.5" fill="#1e293b" />
      <circle cx="56" cy="42" r="4"   fill="#6b7280" />
      <circle cx="56" cy="42" r="1.8" fill="#d1d5db" />

      {/* Chassis bar */}
      <rect x="8" y="37" width="58" height="3" rx="1" fill="#374151" />
      {/* Shine gloss */}
      <rect x="5" y="11" width="65" height="2.5" rx="1" fill="white" opacity="0.3" />
    </svg>
  );
};

// ─── Bus Stop Icon ─────────────────────────────────────────────────────────────
const BusStopIcon = ({ size = 36, active = false }: { size?: number; active?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 48 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Pole */}
    <rect x="21" y="16" width="6" height="48" rx="3" fill={active ? '#10b981' : '#64748b'} />
    {/* Sign */}
    <rect x="4" y="4" width="40" height="18" rx="5" fill={active ? '#10b981' : '#3b82f6'} />
    <text x="24" y="17" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial">BUS</text>
    {/* Base */}
    <rect x="14" y="58" width="20" height="5" rx="2.5" fill={active ? '#10b981' : '#64748b'} />
  </svg>
);

// ─── Animated Route Progress Bar ──────────────────────────────────────────────
const BusProgressBar = ({ total, current, finalizada }: { total: number; current: number; finalizada: boolean }) => {
  const pct = total <= 1 ? 100 : Math.round((current / (total - 1)) * 100);
  // Bus height in the progress bar
  const bH = 30;
  const bW = Math.round(bH * (80 / 56)); // ~43px wide
  return (
    <div style={{ position: 'relative', margin: '12px 0 20px' }}>
      <div style={{ height: 10, background: '#e2e8f0', borderRadius: 10, overflow: 'visible', position: 'relative' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 10,
          background: finalizada
            ? 'linear-gradient(90deg, #10b981, #059669)'
            : 'linear-gradient(90deg, #3b82f6, #6366f1)',
          transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute', right: -(bW / 2 + 2), top: '50%',
            transform: 'translateY(-50%)',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
          }}>
            <AnimatedBusSVG size={bH} color={finalizada ? '#10b981' : '#2563eb'} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>INICIO</span>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>{pct}% completado</span>
        <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>🏫 ESCUELA</span>
      </div>
    </div>
  );
};

export const TransporteEscolar = () => {
  const { loading: permLoading, tienePermiso, tienePermisoEnEscuela, user } = usePermisos();
  const Swal = (window as any).Swal;

  const tieneAccesoEscuelaTransporte = (esc: string) => {
    if (user?.rol === 'SuperAdmin') return true;
    return tienePermisoEnEscuela(esc, 'Transporte Escolar', 'ver');
  };

  const formatTo12Hour = (time24: string) => {
    if (!time24) return '';
    const [hourStr, minStr] = time24.split(':');
    let hour = parseInt(hourStr, 10);
    const min = minStr;
    const ampm = hour >= 12 ? 'pm' : 'am';
    hour = hour % 12;
    hour = hour ? hour : 12;
    const hourFormatted = String(hour).padStart(2, '0');
    return `${hourFormatted}:${min} ${ampm}`;
  };

  const getCurrentTime12Hour = () => {
    const now = new Date();
    const time24 = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    return formatTo12Hour(time24);
  };

  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [, setSyncingOffline] = useState(false);

  const isNetworkError = (error: any): boolean => {
    if (!error) return false;
    const msg = (error.message || '').toLowerCase();
    return (
      !navigator.onLine ||
      msg.includes('fetch') ||
      msg.includes('network') ||
      msg.includes('typeerror') ||
      msg.includes('failed to fetch') ||
      msg.includes('load failed') ||
      msg.includes('cors')
    );
  };

  const getOfflineOperations = () => {
    try {
      return JSON.parse(localStorage.getItem('sigae_offline_operaciones') || '{}');
    } catch (e) {
      return {};
    }
  };

  const saveOfflineOp = (op: any) => {
    const ops = getOfflineOperations();
    const key = `${op.ruta_id}_${op.sentido}_${op.fecha}`;
    ops[key] = op;
    localStorage.setItem('sigae_offline_operaciones', JSON.stringify(ops));
  };

  const mergeOfflineTracking = (onlineData: any[]) => {
    const ops = getOfflineOperations();
    const merged = [...onlineData];
    Object.values(ops).forEach((offOp: any) => {
      const idx = merged.findIndex(o => o.ruta_id === offOp.ruta_id && o.sentido === offOp.sentido && o.fecha === offOp.fecha);
      if (idx >= 0) {
        if (new Date(offOp.ultima_actualizacion) > new Date(merged[idx].ultima_actualizacion)) {
          merged[idx] = offOp;
        }
      } else {
        merged.push(offOp);
      }
    });
    return merged;
  };

  const getOfflineQueue = (): any[] => {
    try {
      return JSON.parse(localStorage.getItem('sigae_offline_queue') || '[]');
    } catch (e) {
      return [];
    }
  };

  const queueOfflineAction = (action: any) => {
    const queue = getOfflineQueue();
    if (action.type === 'update') {
      const idx = queue.findIndex(q => q.type === 'update' && q.table === action.table && q.eq?.value === action.eq?.value);
      if (idx >= 0) {
        queue[idx].payload = { ...queue[idx].payload, ...action.payload };
        localStorage.setItem('sigae_offline_queue', JSON.stringify(queue));
        return;
      }
    }
    queue.push(action);
    localStorage.setItem('sigae_offline_queue', JSON.stringify(queue));
  };

  const syncOfflineQueue = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;
    
    setSyncingOffline(true);
    let successCount = 0;
    
    try {
      for (const action of queue) {
        if (action.type === 'insert') {
          if (action.table === 'transporte_operaciones') {
            const { data } = await (supabase.from('transporte_operaciones') as any).select('id').eq('id', action.payload.id);
            if (data && data.length > 0) {
              successCount++;
              continue;
            }
          }
          const { error } = await (supabase.from(action.table) as any).insert([action.payload]);
          if (error) throw error;
        } else if (action.type === 'update') {
          const { error } = await (supabase.from(action.table) as any).update(action.payload).eq(action.eq.key, action.eq.value);
          if (error) throw error;
        }
        successCount++;
      }
      
      localStorage.removeItem('sigae_offline_queue');
      localStorage.removeItem('sigae_offline_operaciones');
      
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Sincronizados ${successCount} registros guardados offline 🎉`,
        showConfirmButton: false,
        timer: 4000
      });
      cargarTodo(true);
    } catch (err: any) {
      console.error("Error syncing offline queue:", err);
      const remaining = getOfflineQueue().slice(successCount);
      localStorage.setItem('sigae_offline_queue', JSON.stringify(remaining));
      
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Error al sincronizar datos offline',
        showConfirmButton: false,
        timer: 3000
      });
    } finally {
      setSyncingOffline(false);
    }
  };

  const [vistaActual, setVistaActual] = useState<'dashboard' | 'Configuracion' | 'Operacion' | 'Visor' | 'CargaMasiva'>('dashboard');
  const [configTab, setConfigTab] = useState<'Paradas' | 'Rutas' | 'Asignacion'>('Paradas');
  const [escCodigo, setEscCodigo] = useState(localStorage.getItem('sigae_escuela_codigo') || 'sb');

  const canManageRutas    = tienePermiso('Tarjeta: Gestión de Rutas')    || tienePermiso('Gestión de Rutas');
  const canManageParadas  = tienePermiso('Tarjeta: Gestión de Paradas')  || tienePermiso('Gestión de Paradas');
  const canOperateTracking= tienePermiso('Tarjeta: Operación (Tracking)')|| tienePermiso('Operación (Tracking)');
  const canViewRecorrido  = tienePermiso('Tarjeta: Visor de Recorrido')  || tienePermiso('Visor de Recorrido');
  const canViewTransporte = canManageRutas || canManageParadas || canOperateTracking || canViewRecorrido || tienePermiso('Transporte Escolar');
  const canControlCoordinacion = tienePermisoEnEscuela(escCodigo, 'Función: Control Coordinación', 'ver');

  // DB States
  const [paradas, setParadas] = useState<any[]>([]);
  const [rutas, setRutas] = useState<any[]>([]);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [trackingHoy, setTrackingHoy] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Paradas State
  const [showModalParada, setShowModalParada] = useState(false);
  const [paradaForm, setParadaForm] = useState({ id: '', nombre: '', descripcion: '' });

  // Rutas State
  const [showModalRuta, setShowModalRuta] = useState(false);
  const [rutaForm, setRutaForm] = useState<any>({
    id: '', nombre: '', chofer: '', docente_id: '', validez_desde: '', validez_hasta: ''
  });
  const [paradasTemporales, setParadasTemporales] = useState<any[]>([]);

  
  // Asignacion State
  const [showModalAsignacion, setShowModalAsignacion] = useState(false);

  // Operacion / Visor State
  const [opRutaId, setOpRutaId] = useState(localStorage.getItem('sigae_transporte_ruta') || '');
  const [opSentido, setOpSentido] = useState(localStorage.getItem('sigae_transporte_sentido') || 'Casa - Escuela');
  const [opActual, setOpActual] = useState<any>(null);
  // Orden personalizado de paradas (null = orden original de la ruta)
  const [customPids, setCustomPids] = useState<string[] | null>(null);
  // Drag & drop: índice que se está arrastrando
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('sigae_transporte_ruta', opRutaId);
    setCustomPids(null);
  }, [opRutaId]);

  useEffect(() => {
    localStorage.setItem('sigae_transporte_sentido', opSentido);
    setCustomPids(null);
  }, [opSentido]);
  useEffect(() => {
    const goOnline = () => {
      setOfflineMode(false);
      syncOfflineQueue();
    };
    const goOffline = () => {
      setOfflineMode(true);
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    
    // Initial check and sync on mount
    if (navigator.onLine) {
      syncOfflineQueue();
    }

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);
  useEffect(() => {
    if (permLoading) return;
    const hasSB = tieneAccesoEscuelaTransporte('sb');
    const hasLB = tieneAccesoEscuelaTransporte('lb');

    if (hasSB && !hasLB && escCodigo !== 'sb') {
      setEscCodigo('sb');
      localStorage.setItem('sigae_escuela_codigo', 'sb');
    } else if (hasLB && !hasSB && escCodigo !== 'lb') {
      setEscCodigo('lb');
      localStorage.setItem('sigae_escuela_codigo', 'lb');
    }
  }, [permLoading, escCodigo, tienePermisoEnEscuela, user]);

  useEffect(() => {
    localStorage.setItem('sigae_escuela_codigo', escCodigo);
  }, [escCodigo]);

  // Referencias mutables para evitar stale closures en el listener en tiempo real de Supabase
  const rutasRef = React.useRef(rutas);
  const paradasRef = React.useRef(paradas);
  const opRutaIdRef = React.useRef(opRutaId);
  const opSentidoRef = React.useRef(opSentido);
  const opActualRef = React.useRef(opActual);
  const trackingHoyRef = React.useRef(trackingHoy);

  useEffect(() => { rutasRef.current = rutas; }, [rutas]);
  useEffect(() => { paradasRef.current = paradas; }, [paradas]);
  useEffect(() => { opRutaIdRef.current = opRutaId; }, [opRutaId]);
  useEffect(() => { opSentidoRef.current = opSentido; }, [opSentido]);
  useEffect(() => { opActualRef.current = opActual; }, [opActual]);
  useEffect(() => { trackingHoyRef.current = trackingHoy; }, [trackingHoy]);

  useEffect(() => {
    if (canViewTransporte) {
      cargarTodo();
    }
  }, [escCodigo, canViewTransporte]);

  useEffect(() => {
    if ((vistaActual === 'Operacion' || vistaActual === 'Visor') && opRutaId) {
      const hoyStr = new Date().toISOString().split('T')[0];
      const found = trackingHoy.find((t: any) => t.ruta_id === opRutaId && t.sentido === opSentido && t.fecha === hoyStr);
      setOpActual(found || null);
    }
    if (vistaActual === 'Operacion') {
      requestNotifPermission();
    }
  }, [vistaActual, opRutaId, opSentido, trackingHoy]);

  // ─── AUTO-RESET DIARIO ──────────────────────────────────────────
  // Al cargar la app, verifica si ya se hizo el reset del día.
  // Guarda en localStorage la fecha del último reset para no repetirlo.
  useEffect(() => {
    if (!canViewTransporte) return;
    const hoyStr = new Date().toISOString().split('T')[0];
    const lastReset = localStorage.getItem('sigae_transporte_last_reset');
    if (lastReset !== hoyStr) {
      // Es un día nuevo: ejecutar reset silencioso de ayer y guardar fecha
      ejecutarResetDiario(true);
      localStorage.setItem('sigae_transporte_last_reset', hoyStr);
    }
  }, [canViewTransporte]);

  // Realtime updates para tracking en tiempo real (Sincronización Multi-Dispositivo)
  useEffect(() => {
    const channel = supabase.channel('tracking_realtime_ui')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transporte_operaciones' }, () => {
        // Recargar información en la UI
        cargarTrackingSolo();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Sincronizaci�n cuando la app vuelve del segundo plano (tel�fonos)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        if ('clearAppBadge' in navigator) {
          navigator.clearAppBadge().catch(() => {});
        }
        if (canViewTransporte) {
          cargarTrackingSolo();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [canViewTransporte]);
  // Cache to localstorage
  useEffect(() => {
    if (paradas.length > 0) localStorage.setItem(`sigae_cache_paradas_${escCodigo}`, JSON.stringify(paradas));
  }, [paradas, escCodigo]);
  
  useEffect(() => {
    if (rutas.length > 0) localStorage.setItem(`sigae_cache_rutas_${escCodigo}`, JSON.stringify(rutas));
  }, [rutas, escCodigo]);

  useEffect(() => {
    if (docentes.length > 0) localStorage.setItem(`sigae_cache_docentes_${escCodigo}`, JSON.stringify(docentes));
  }, [docentes, escCodigo]);

  const cargarTodo = async (silencioso = false) => {
    if (!silencioso) setLoadingData(true);
    try {
      const hoyStr = new Date().toISOString().split('T')[0];
      
      const p1 = Promise.resolve(supabase.from('transporte_paradas').select('*').eq('escuela_codigo', escCodigo).order('nombre_parada', { ascending: true }))
        .then(res => { if (res.error) throw res.error; setParadas(res.data || []); })
        .catch((err: any) => { console.error("Error al cargar paradas:", err); throw err; });

      const p2 = Promise.resolve(supabase.from('transporte_rutas').select('*').eq('escuela_codigo', escCodigo).order('nombre', { ascending: true }))
        .then(res => { if (res.error) throw res.error; setRutas(res.data || []); })
        .catch((err: any) => { console.error("Error al cargar rutas:", err); throw err; });

      const p3 = Promise.resolve(supabase.from('transporte_operaciones').select('*').eq('escuela_codigo', escCodigo).eq('fecha', hoyStr))
        .then(res => { if (res.error) throw res.error; setTrackingHoy(mergeOfflineTracking(res.data || [])); })
        .catch((err: any) => { console.error("Error al cargar tracking:", err); throw err; });

      const p4 = Promise.resolve(supabase.from('usuarios').select('id_usuario, cedula, nombre_completo, rol, cargo, telefono').eq('id_escuela', escCodigo))
        .then(res => {
          if (res.error) throw res.error;
          const rolesExcluidos = ['Estudiante', 'Representante', 'Invitado'];
          const docs = (res.data || []).filter((u: any) => !rolesExcluidos.includes(u.rol));
          setDocentes(docs);
        })
        .catch((err: any) => { console.error("Error al cargar docentes:", err); throw err; });

      await Promise.all([p1, p2, p3, p4]);

    } catch (e: any) {
      console.error(e);
      // Fallback a caché
      try {
        const cachedParadas = JSON.parse(localStorage.getItem(`sigae_cache_paradas_${escCodigo}`) || '[]');
        const cachedRutas = JSON.parse(localStorage.getItem(`sigae_cache_rutas_${escCodigo}`) || '[]');
        const cachedDocentes = JSON.parse(localStorage.getItem(`sigae_cache_docentes_${escCodigo}`) || '[]');
        if (cachedParadas.length > 0) setParadas(cachedParadas);
        if (cachedRutas.length > 0) setRutas(cachedRutas);
        if (cachedDocentes.length > 0) setDocentes(cachedDocentes);
        setTrackingHoy(mergeOfflineTracking([]));
      } catch (errCache) {
        console.error("Error al cargar desde cache local:", errCache);
      }
      if (!silencioso && !isNetworkError(e)) {
        Swal.fire('Error', 'Falla al conectar con base de datos.', 'error');
      }
    } finally {
      setLoadingData(false);
    }
  };

  const cargarTrackingSolo = async () => {
    try {
      const hoyStr = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.from('transporte_operaciones').select('*').eq('escuela_codigo', escCodigo).eq('fecha', hoyStr);
      if (error) throw error;
      if (data) setTrackingHoy(mergeOfflineTracking(data));
    } catch (err: any) {
      console.error("Error al cargar tracking:", err);
      setTrackingHoy(mergeOfflineTracking([]));
    }
  };
  // ---- PARADAS ----

  const deleteParada = async (id: string) => {
    Swal.fire({ title: '¿Borrar parada?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Sí, borrar' }).then(async (r: any) => {
      if (r.isConfirmed) {
        try {
          const { error } = await supabase.from('transporte_paradas').delete().eq('id', id);
          if (error) throw error;
          cargarTodo(true);
        } catch (err: any) {
          Swal.fire('Error', 'No se pudo eliminar.', 'error');
        }
      }
    });
  };

  // ---- RUTAS ----
  // Helper para inyectar la escuela en las rutas
  const getIdsWithEscuela = (ruta: any, sentido: 'Casa - Escuela' | 'Escuela - Casa') => {
    let baseIds = [];
    if (Array.isArray(ruta.paradas_json)) baseIds = ruta.paradas_json;
    else if (typeof ruta.paradas_json === 'string') { try { baseIds = JSON.parse(ruta.paradas_json); } catch (e) {} }
    
    // Clonamos para no mutar el original
    let pids = [...baseIds];
    
    if (sentido === 'Escuela - Casa') {
      pids.reverse();
      pids.unshift('escuela_virtual');
    } else {
      pids.push('escuela_virtual');
    }
    return pids;
  };

  const getParadasWithEscuela = (pids: string[]) => {
    const nombreEscuela = escCodigo === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar';
    const paradaEscuela = { id: 'escuela_virtual', nombre_parada: `🏫 ${nombreEscuela}`, descripcion: 'Sede Educativa Institucional' };
    
    return pids.map(pid => {
      if (pid === 'escuela_virtual') return paradaEscuela;
      return paradas.find(p => p.id === pid);
    }).filter(Boolean);
  };

  const editRuta = (r: any) => {
    setRutaForm({
      id: r.id, nombre: r.nombre, chofer: r.chofer_nombre, docente_id: r.docente_id || '',
      validez_desde: r.validez_desde || '', validez_hasta: r.validez_hasta || ''
    });
    
    let ids = [];
    if (Array.isArray(r.paradas_json)) ids = r.paradas_json;
    else if (typeof r.paradas_json === 'string') {
      try { ids = JSON.parse(r.paradas_json); } catch (e) {}
    }
    
    const temps = ids.map((pid: string) => paradas.find(p => p.id === pid)).filter(Boolean);
    setParadasTemporales(temps);
    setShowModalRuta(true);
  };

  const deleteRuta = async (id: string) => {
    Swal.fire({ title: '¿Borrar ruta?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Sí, borrar' }).then(async (r: any) => {
      if (r.isConfirmed) {
        try {
          const { error } = await supabase.from('transporte_rutas').delete().eq('id', id);
          if (error) throw error;
          cargarTodo(true);
        } catch (err: any) {
          Swal.fire('Error', 'No se pudo eliminar la ruta.', 'error');
        }
      }
    });
  };

  const deleteParadasMasivo = async (ids: string[]) => {
    if (ids.length === 0) return;
    Swal.fire({
      title: `¿Borrar ${ids.length} paradas?`,
      text: 'Se eliminarán de forma definitiva todas las paradas seleccionadas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Sí, borrar seleccionadas'
    }).then(async (r: any) => {
      if (r.isConfirmed) {
        try {
          const { error } = await supabase.from('transporte_paradas').delete().in('id', ids);
          if (error) throw error;
          cargarTodo(true);
          Swal.fire('Eliminadas', 'Las paradas seleccionadas han sido eliminadas.', 'success');
        } catch (err: any) {
          Swal.fire('Error', 'No se pudieron eliminar las paradas.', 'error');
        }
      }
    });
  };

  const deleteRutasMasivo = async (ids: string[]) => {
    if (ids.length === 0) return;
    Swal.fire({
      title: `¿Borrar ${ids.length} rutas?`,
      text: 'Se eliminarán de forma definitiva todas las rutas seleccionadas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Sí, borrar seleccionadas'
    }).then(async (r: any) => {
      if (r.isConfirmed) {
        try {
          const { error } = await supabase.from('transporte_rutas').delete().in('id', ids);
          if (error) throw error;
          cargarTodo(true);
          Swal.fire('Eliminadas', 'Las rutas seleccionadas han sido eliminadas.', 'success');
        } catch (err: any) {
          Swal.fire('Error', 'No se pudieron eliminar las rutas.', 'error');
        }
      }
    });
  };

  const limpiarAsignacionesMasivo = async (ids: string[]) => {
    if (ids.length === 0) return;
    Swal.fire({
      title: `¿Limpiar ${ids.length} asignaciones?`,
      text: 'Se removerá todo el personal (chofer, guardia y periodo) de las rutas seleccionadas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Sí, limpiar seleccionadas'
    }).then(async (r: any) => {
      if (r.isConfirmed) {
        try {
          const { error } = await supabase
            .from('transporte_rutas')
            .update({
              chofer_nombre: null,
              chofer_telefono: null,
              docente_id: null,
              validez_desde: null,
              validez_hasta: null
            })
            .in('id', ids);
          if (error) throw error;
          cargarTodo(true);
          Swal.fire('Limpiadas', 'El personal de las rutas seleccionadas ha sido limpiado.', 'success');
        } catch (err: any) {
          Swal.fire('Error', 'No se pudieron limpiar las asignaciones.', 'error');
        }
      }
    });
  };

  // ---- COMPARTIR / EXPORTAR ----
  const compartirRuta = async (ruta: any) => {
    let chosenModo: 'both' | 'text' | 'image' | null = null;
    const modo = await new Promise<'both' | 'text' | 'image' | null>((resolve) => {
      Swal.fire({
        title: 'Opciones de Compartir',
        html: `
          <p class="small text-muted mb-3">Selecciona el formato que deseas generar para esta ruta:</p>
          <div class="d-flex flex-column gap-2 text-start">
            <button id="opt-both" class="btn btn-outline-success text-start p-3 w-100 mb-2 rounded-3 border-2">
              <div class="fw-bold"><i class="bi bi-file-earmark-zip-fill me-2 fs-5"></i> Imagen y Texto (Recomendado)</div>
              <div class="small text-muted mt-1">Descarga el rutograma oficial en PNG y copia el detalle de paradas al portapapeles.</div>
            </button>
            <button id="opt-text" class="btn btn-outline-primary text-start p-3 w-100 mb-2 rounded-3 border-2">
              <div class="fw-bold"><i class="bi bi-card-text me-2 fs-5"></i> Solo Texto</div>
              <div class="small text-muted mt-1">Copia la lista de paradas y docentes al portapapeles sin descargar imágenes.</div>
            </button>
            <button id="opt-image" class="btn btn-outline-secondary text-start p-3 w-100 rounded-3 border-2">
              <div class="fw-bold"><i class="bi bi-image me-2 fs-5"></i> Solo Imagen</div>
              <div class="small text-muted mt-1">Descarga únicamente el rutograma oficial PNG.</div>
            </button>
          </div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        didOpen: () => {
          const container = Swal.getHtmlContainer();
          if (container) {
            const ob = container.querySelector('#opt-both');
            const ot = container.querySelector('#opt-text');
            const oi = container.querySelector('#opt-image');
            if (ob) (ob as HTMLElement).onclick = () => { chosenModo = 'both'; Swal.close(); };
            if (ot) (ot as HTMLElement).onclick = () => { chosenModo = 'text'; Swal.close(); };
            if (oi) (oi as HTMLElement).onclick = () => { chosenModo = 'image'; Swal.close(); };
          }
        },
        willClose: () => {
          resolve(chosenModo);
        }
      });
    });

    if (!modo) return;

    const pids = getIdsWithEscuela(ruta, 'Casa - Escuela');
    const orderedParadas = getParadasWithEscuela(pids);
    const estatusRuta = ruta.activo !== false ? 'Activa 🟢' : 'Inactiva 🔴';
    const doc = docentes.find(d => d.id_usuario === ruta.docente_id);
    const nombreDoc = doc ? doc.nombre_completo : 'Sin asignar';
    const telDoc = doc ? (doc.telefono || '') : '';
    const fechaHoy = new Date().toLocaleString('es-VE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const nombreEscuela = escCodigo === 'sb' ? 'Unidad Educativa Santa Bárbara' : 'Unidad Educativa Libertador Bolívar';

    const textoMensaje = `🚍 *RUTA DE TRANSPORTE ESCOLAR*\n🏫 *${nombreEscuela}*\n\n📍 *${ruta.nombre}*\n🟢 Estatus: *${estatusRuta}*\n👨‍✈️ Chofer: ${ruta.chofer_nombre || 'Sin Asignar'}\n👩‍🏫 Docentes de Guardia: ${nombreDoc} ${telDoc ? '('+telDoc+')' : ''}\n📅 Vigencia: Desde ${ruta.validez_desde || 'No establecida'} Hasta ${ruta.validez_hasta || 'No establecida'}\n\n*Recorrido de Paradas:*\n` +
      orderedParadas.map((p: any, idx: number) => `  ${idx+1}. ${p.nombre_parada} ${p.descripcion ? `(${p.descripcion})` : ''}`).join('\n');

    if (modo === 'text') {
      try {
        await navigator.clipboard.writeText(textoMensaje);
        Swal.fire({
          title: '¡Texto Copiado!',
          html: `
            <p class="small text-muted mb-2">El detalle de la ruta se copió al portapapeles.</p>
            <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; color: #166534; padding: 10px; border-radius: 8px; font-size: 13px; text-align: left;">
              Selecciona tu chat, presiona <strong>Ctrl + V</strong> y envía la información.
            </div>
          `,
          icon: 'success',
          showCancelButton: true,
          confirmButtonText: '<i class="bi bi-whatsapp me-1"></i> Abrir WhatsApp',
          cancelButtonText: '<i class="bi bi-telegram me-1"></i> Telegram',
          confirmButtonColor: '#25D366',
          cancelButtonColor: '#0088cc'
        }).then((res2: any) => {
          if (res2.isConfirmed) { window.open('whatsapp://', '_self'); }
          else if (res2.dismiss === Swal.DismissReason.cancel) { window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(textoMensaje)}`, '_blank'); }
        });
      } catch (err: any) {
        Swal.fire('Error', 'No se pudo copiar el texto al portapapeles.', 'error');
      }
      return;
    }

    Swal.fire({ title: 'Preparando Imagen...', text: 'Generando imagen membretada de la ruta...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
    try {
      const clon = document.createElement('div');
      clon.style.width = "800px"; clon.style.padding = "40px"; clon.style.background = "#ffffff"; 
      clon.style.position = "absolute"; clon.style.top = "-9999px"; clon.style.left = "-9999px"; 
      clon.style.fontFamily = "Arial, Helvetica, sans-serif";

      let stopsHtml = '';
      orderedParadas.forEach((p, idx) => {
        const isStart = idx === 0;
        const isEnd = idx === orderedParadas.length - 1;
        const nodeColor = isEnd ? '#a855f7' : isStart ? '#f59e0b' : '#3b82f6';
        stopsHtml += `
          <div style="position: relative; display: flex; align-items: flex-start; gap: 15px; margin-bottom: 25px; padding-left: 55px;">
            <div style="position: absolute; left: 10px; top: 0; width: 32px; height: 32px; border-radius: 50%; background: ${nodeColor}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; border: 3px solid #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.15); z-index: 2;">
              ${idx + 1}
            </div>
            <div style="flex: 1; padding: 8px 14px; background: #ffffff; border: 1.5px solid #f1f5f9; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); text-align: left;">
              <div style="font-size: 15px; font-weight: bold; color: #1e293b;">${p.nombre_parada}</div>
              ${p.descripcion ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">${p.descripcion}</div>` : ''}
            </div>
          </div>
        `;
      });

      let htmlImagen = `
        <div style="display: flex; align-items: center; gap: 20px; border-bottom: 2.5px solid #FF3D00; padding-bottom: 20px; margin-bottom: 25px;">
            <img src="/assets/img/logo_${escCodigo}.png" style="height: 75px; width: auto; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.08));" onError="this.style.display='none'" />
            <div style="text-align: left;">
                <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">República Bolivariana de Venezuela</div>
                <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-top: 1px;">M.P.P. para la Educación</div>
                <div style="font-size: 16px; font-weight: 800; color: #1e293b; margin-top: 4px;">${nombreEscuela}</div>
            </div>
        </div>

        <div style="text-align:center; margin-bottom:30px;">
            <h2 style="color:#FF3D00; margin:0; text-transform: uppercase; letter-spacing: 1px; font-size: 22px; font-weight: 800;">Rutograma Oficial de Transporte</h2>
            <div style="height: 3px; width: 60px; background: #FF3D00; margin: 8px auto 0; border-radius: 2px;"></div>
        </div>

        <div style="margin-bottom:30px; border:1px solid #e2e8f0; border-radius:16px; padding:20px; background: linear-gradient(135deg, #ffffff 0%, #fffaf7 100%); box-shadow: 0 4px 15px rgba(0,0,0,0.02); text-align: left;">
            <h3 style="color:#1e293b; font-size: 18px; margin-top:0; border-bottom:1.5px solid #e2e8f0; padding-bottom:12px; font-weight: 800; display: flex; justify-content: space-between; align-items: center;">
              <span>🚍 ${ruta.nombre}</span>
              <span style="font-size: 12px; padding: 4px 10px; border-radius: 20px; background: ${ruta.activo !== false ? '#dcfce7' : '#fee2e2'}; color: ${ruta.activo !== false ? '#166534' : '#991b1b'}; border: 1px solid ${ruta.activo !== false ? '#bbf7d0' : '#fecaca'}; font-weight: 700;">
                ${ruta.activo !== false ? 'Activa' : 'Inactiva'}
              </span>
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; font-size:14px; color: #475569;">
              <div><b>Conductor Asignado:</b><br><span style="color:#0f172a; font-size: 15px; font-weight: bold;">${ruta.chofer_nombre || 'Sin Asignar'}</span></div>
              <div><b>Docentes de Guardia:</b><br><span style="color:#0f172a; font-size: 15px; font-weight: bold;">${nombreDoc} ${telDoc ? `(${telDoc})` : ''}</span></div>
              <div style="grid-column: span 2; margin-top: 5px; border-top: 1px dashed #e2e8f0; padding-top: 10px;">
                <b>Vigencia del Recorrido:</b> Desde <span style="color:#0f172a; font-weight: bold;">${ruta.validez_desde || 'No establecida'}</span> Hasta <span style="color:#0f172a; font-weight: bold;">${ruta.validez_hasta || 'No establecida'}</span>
              </div>
            </div>
        </div>

        <div style="position: relative; margin-bottom: 35px;">
            <div style="position: absolute; left: 25px; top: 15px; bottom: 15px; width: 3px; background: repeating-linear-gradient(180deg, #cbd5e1, #cbd5e1 6px, transparent 6px, transparent 12px); z-index: 1;"></div>
            ${stopsHtml}
        </div>

        <div style="margin-top: 40px; border-top: 1.5px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <img src="/assets/img/logoMPPE.png" style="height: 32px; width: auto;" />
                <img src="/assets/img/logo_carga.png" style="height: 40px; width: auto;" />
            </div>
            <div style="text-align: right; font-size: 11px; color: #94a3b8; font-weight: 600;">
                Generado: ${fechaHoy}<br>
                Sistema Integral de Gestión y Administración Escolar (SIGAE)
            </div>
        </div>
        
        <div style="height: 6px; background: linear-gradient(90deg, #facc15 0%, #facc15 33.3%, #2563eb 33.3%, #2563eb 66.6%, #dc2626 66.6%, #dc2626 100%); margin-top: 15px; border-radius: 3px;"></div>
      `;

      clon.innerHTML = htmlImagen;
      document.body.appendChild(clon);
      await new Promise(res => setTimeout(res, 500));
      const canvas = await html2canvas(clon, { scale: 2, backgroundColor: '#ffffff', logging: false });
      document.body.removeChild(clon);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `Ruta_${ruta.nombre.replace(/\s/g, '_')}.png`, { type: "image/png" });
        
        if (modo === 'both') {
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try { await navigator.clipboard.writeText(textoMensaje); } catch (e) {}
            Swal.close();
            Swal.fire({
              title: '¡Rutograma Listo!',
              html: `
                <p class="small text-muted mb-3">La información detallada ha sido copiada a tu portapapeles.</p>
                <div style="background-color: #e0f2fe; border-left: 4px solid #0284c7; color: #0369a1; padding: 12px; border-radius: 8px; font-size: 13px; text-align: left; line-height: 1.4;">
                  <strong>Instrucción:</strong> Al abrirse la pantalla para compartir, pega el texto como comentario y envía.
                </div>
              `,
              icon: 'info',
              confirmButtonText: 'Compartir Imagen y Texto',
              confirmButtonColor: '#25D366'
            }).then(async () => {
              try { await navigator.share({ files: [file], text: textoMensaje }); } catch (err) {}
            });
          } else {
            Swal.close();
            Swal.fire({
              title: '¡Ruta Preparada!',
              html: `
                <p class="small text-muted mb-2">La imagen de la ruta se copiará automáticamente al portapapeles al presionar "Abrir WhatsApp".</p>
                <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; color: #166534; padding: 10px; border-radius: 8px; font-size: 13px; text-align: left;">
                  <strong>Para enviar en la app:</strong> Selecciona el chat, presiona <strong>Ctrl + V</strong> para pegar la imagen (el texto se cargará automáticamente).
                </div>
              `,
              icon: 'success',
              showCancelButton: true,
              confirmButtonText: '<i class="bi bi-whatsapp me-1"></i> Abrir WhatsApp',
              cancelButtonText: '<i class="bi bi-telegram me-1"></i> Telegram',
              confirmButtonColor: '#25D366',
              cancelButtonColor: '#0088cc'
            }).then(async (res2: any) => {
              if (res2.isConfirmed) {
                let copiedImage = false;
                if (navigator.clipboard && navigator.clipboard.write) {
                  try {
                    const item = new ClipboardItem({ "image/png": blob });
                    await navigator.clipboard.write([item]);
                    copiedImage = true;
                  } catch (e) {
                    console.error("ClipboardItem failed inside confirm callback:", e);
                  }
                }

                if (!copiedImage) {
                  const urlImagen = canvas.toDataURL("image/png");
                  const a = document.createElement('a'); a.href = urlImagen; a.download = `Ruta_${ruta.nombre.replace(/\s/g, '_')}.png`; a.click();
                  try { await navigator.clipboard.writeText(textoMensaje); } catch (e) {}
                }

                window.open(`whatsapp://send?text=${encodeURIComponent(textoMensaje)}`, '_self');
              } else if (res2.dismiss === Swal.DismissReason.cancel) {
                try { await navigator.clipboard.writeText(textoMensaje); } catch (e) {}
                window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(textoMensaje)}`, '_blank');
              }
            });
          }
        } else {
          // Solo Imagen
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            Swal.close();
            Swal.fire({
              title: '¡Rutograma Listo!',
              text: 'La imagen de la ruta ha sido generada correctamente.',
              icon: 'info',
              confirmButtonText: 'Compartir Imagen',
              confirmButtonColor: '#25D366'
            }).then(async () => {
              try { await navigator.share({ files: [file] }); } catch (err) {}
            });
          } else {
            Swal.close();
            Swal.fire({
              title: '¡Imagen Lista!',
              text: 'Al presionar "Abrir WhatsApp", la imagen se copiará a tu portapapeles.',
              icon: 'success',
              confirmButtonText: 'Abrir WhatsApp',
              confirmButtonColor: '#25D366',
              showCancelButton: true,
              cancelButtonText: 'Cerrar'
            }).then(async (res2: any) => {
              if (res2.isConfirmed) {
                let copiedImage = false;
                if (navigator.clipboard && navigator.clipboard.write) {
                  try {
                    const item = new ClipboardItem({ "image/png": blob });
                    await navigator.clipboard.write([item]);
                    copiedImage = true;
                  } catch (e) {
                    console.error("ClipboardItem failed:", e);
                  }
                }

                if (!copiedImage) {
                  const urlImagen = canvas.toDataURL("image/png");
                  const a = document.createElement('a'); a.href = urlImagen; a.download = `Ruta_${ruta.nombre.replace(/\s/g, '_')}.png`; a.click();
                }

                window.open('whatsapp://', '_self');
              }
            });
          }
        }
      }, "image/png");
    } catch(e:any) {
      console.error(e);
      Swal.fire('Error', 'No se pudo generar la imagen.', 'error');
    }
  };

  const compartirRutasMasivo = async (ids: string[]) => {
    if (ids.length === 0) return;

    let chosenModo: 'both' | 'text' | 'image' | null = null;
    const modo = await new Promise<'both' | 'text' | 'image' | null>((resolve) => {
      Swal.fire({
        title: 'Opciones de Compartir Masivo',
        html: `
          <p class="small text-muted mb-3">Selecciona cómo deseas procesar las ${ids.length} rutas seleccionadas:</p>
          <div class="d-flex flex-column gap-2 text-start">
            <button id="opt-both" class="btn btn-outline-success text-start p-3 w-100 mb-2 rounded-3 border-2">
              <div class="fw-bold"><i class="bi bi-whatsapp me-2 fs-5"></i> Enviar una a una (Asistente Paso a Paso)</div>
              <div class="small text-muted mt-1">Recomendado. Abre WhatsApp una a una copiando su imagen al portapapeles y pre-cargando su texto.</div>
            </button>
            <button id="opt-text" class="btn btn-outline-primary text-start p-3 w-100 mb-2 rounded-3 border-2">
              <div class="fw-bold"><i class="bi bi-card-text me-2 fs-5"></i> Solo Texto Consolidado</div>
              <div class="small text-muted mt-1">Copia la información de todas las rutas en un solo bloque de texto.</div>
            </button>
            <button id="opt-image" class="btn btn-outline-secondary text-start p-3 w-100 rounded-3 border-2">
              <div class="fw-bold"><i class="bi bi-download me-2 fs-5"></i> Solo Descargar Imágenes</div>
              <div class="small text-muted mt-1">Descarga todas las imágenes de rutogramas PNG juntas en tu equipo.</div>
            </button>
          </div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        didOpen: () => {
          const container = Swal.getHtmlContainer();
          if (container) {
            const ob = container.querySelector('#opt-both');
            const ot = container.querySelector('#opt-text');
            const oi = container.querySelector('#opt-image');
            if (ob) (ob as HTMLElement).onclick = () => { chosenModo = 'both'; Swal.close(); };
            if (ot) (ot as HTMLElement).onclick = () => { chosenModo = 'text'; Swal.close(); };
            if (oi) (oi as HTMLElement).onclick = () => { chosenModo = 'image'; Swal.close(); };
          }
        },
        willClose: () => {
          resolve(chosenModo);
        }
      });
    });

    if (!modo) return;

    const obtenerNumeroRuta = (nombre: string): number => {
      const match = nombre.match(/\d+/);
      return match ? parseInt(match[0], 10) : 9999;
    };
    const rutasSeleccionadas = rutas
      .filter(r => ids.includes(r.id))
      .sort((a, b) => obtenerNumeroRuta(a.nombre) - obtenerNumeroRuta(b.nombre));

    if (modo === 'text') {
      try {
        const MAX_CHAR = 3000;
        const mensajes: string[] = [];
        
        let cabecera = `🚍 *RECORRIDOS DE TRANSPORTE ESCOLAR CONSOLIDADOS*\n`;
        cabecera += `🏫 *${escCodigo === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar'}*\n`;
        cabecera += `📅 Fecha: ${new Date().toLocaleDateString('es-VE')}\n\n`;
        
        let mensajeActual = cabecera;
        
        for (const ruta of rutasSeleccionadas) {
          const pids = getIdsWithEscuela(ruta, 'Casa - Escuela');
          const orderedParadas = getParadasWithEscuela(pids);
          const doc = docentes.find(d => d.id_usuario === ruta.docente_id);
          const nombreDoc = doc ? doc.nombre_completo : 'Sin asignar';
          const telDoc = doc ? (doc.telefono || '') : '';
          const estatusRuta = ruta.activo !== false ? 'Activa 🟢' : 'Inactiva 🔴';
          
          let bloqueRuta = `-----------------------------------------\n`;
          bloqueRuta += `🚍 *${ruta.nombre}*\n`;
          bloqueRuta += `🟢 Estatus: *${estatusRuta}*\n`;
          bloqueRuta += `👨‍✈️ Chofer: ${ruta.chofer_nombre || 'Sin Asignar'}\n`;
          bloqueRuta += `👩‍🏫 Guardia: ${nombreDoc} ${telDoc ? `(${telDoc})` : ''}\n`;
          bloqueRuta += `📅 Vigencia: Desde ${ruta.validez_desde || 'No establecida'} Hasta ${ruta.validez_hasta || 'No establecida'}\n`;
          bloqueRuta += `📍 Paradas:\n`;
          
          orderedParadas.forEach((p, idx) => {
            bloqueRuta += `   ${idx + 1}. ${p.nombre_parada}\n`;
          });
          bloqueRuta += `\n`;
          
          if (mensajeActual.length + bloqueRuta.length > MAX_CHAR && mensajeActual !== cabecera) {
            mensajes.push(mensajeActual);
            mensajeActual = `🚍 *RECORRIDOS CONSOLIDADOS (Continuación)*\n🏫 *${escCodigo === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar'}*\n\n` + bloqueRuta;
          } else {
            mensajeActual += bloqueRuta;
          }
        }
        
        if (mensajeActual !== cabecera) {
          mensajes.push(mensajeActual);
        }

        const enviarMensaje = async (index: number) => {
          if (index >= mensajes.length) {
            Swal.fire({
              title: '¡Envío Finalizado!',
              text: 'Se han copiado y enviado todos los mensajes consolidados.',
              icon: 'success',
              confirmButtonColor: '#198754'
            });
            return;
          }
          
          await navigator.clipboard.writeText(mensajes[index]);
          
          Swal.fire({
            title: `Mensaje Consolidado (${index + 1} de ${mensajes.length})`,
            html: `
              <p class="small text-muted mb-2">El texto del bloque de rutas se copió al portapapeles.</p>
              <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; color: #166534; padding: 10px; border-radius: 8px; font-size: 13px; text-align: left; margin-bottom: 12px;">
                <strong>Instrucciones:</strong> Presiona "Enviar", pega el texto en el chat con <strong>Ctrl + V</strong> y envíalo. Luego regresa aquí para el siguiente bloque.
              </div>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: '<i class="bi bi-whatsapp me-1"></i> Copiar y Enviar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#25D366'
          }).then((res2: any) => {
            if (res2.isConfirmed) {
              window.open(`whatsapp://send?text=${encodeURIComponent(mensajes[index])}`, '_self');
              setTimeout(() => {
                Swal.fire({
                  title: '¿Pasar al siguiente bloque?',
                  text: `¿Has enviado el bloque ${index + 1} en WhatsApp?`,
                  icon: 'question',
                  showCancelButton: true,
                  confirmButtonText: 'Sí, Siguiente Bloque',
                  cancelButtonText: 'No, Detener',
                  confirmButtonColor: '#198754'
                }).then((res3: any) => {
                  if (res3.isConfirmed) {
                    enviarMensaje(index + 1);
                  }
                });
              }, 1500);
            }
          });
        };

        if (mensajes.length === 1) {
          await navigator.clipboard.writeText(mensajes[0]);
          Swal.fire({
            title: '¡Texto Consolidado Copiado!',
            html: `
              <p class="small text-muted mb-2">El texto descriptivo de las rutas se copió al portapapeles.</p>
              <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; color: #166534; padding: 10px; border-radius: 8px; font-size: 13px; text-align: left;">
                Selecciona tu chat, presiona <strong>Ctrl + V</strong> y envía la información.
              </div>
            `,
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: '<i class="bi bi-whatsapp me-1"></i> Abrir WhatsApp',
            cancelButtonText: 'Cerrar',
            confirmButtonColor: '#25D366'
          }).then((res2: any) => {
            if (res2.isConfirmed) { window.open(`whatsapp://send?text=${encodeURIComponent(mensajes[0])}`, '_self'); }
          });
        } else {
          enviarMensaje(0);
        }
      } catch (err: any) {
        Swal.fire('Error', 'No se pudo copiar el texto consolidado.', 'error');
      }
      return;
    }

    if (modo === 'image') {
      Swal.fire({ 
        title: 'Generando Imágenes...', 
        text: `Descargando imágenes para ${ids.length} rutas...`, 
        allowOutsideClick: false, 
        didOpen: () => { Swal.showLoading(); }
      });
      try {
        for (const ruta of rutasSeleccionadas) {
          const pids = getIdsWithEscuela(ruta, 'Casa - Escuela');
          const orderedParadas = getParadasWithEscuela(pids);
          const doc = docentes.find(d => d.id_usuario === ruta.docente_id);
          const nombreDoc = doc ? doc.nombre_completo : 'Sin asignar';
          const telDoc = doc ? (doc.telefono || '') : '';

          const nombreEscuela = escCodigo === 'sb' ? 'Unidad Educativa Santa Bárbara' : 'Unidad Educativa Libertador Bolívar';
          const fechaHoy = new Date().toLocaleString('es-VE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          const clon = document.createElement('div');
          clon.style.width = "800px"; clon.style.padding = "40px"; clon.style.background = "#ffffff"; 
          clon.style.position = "absolute"; clon.style.top = "-9999px"; clon.style.left = "-9999px"; 
          clon.style.fontFamily = "Arial, Helvetica, sans-serif";

          let stopsHtml = '';
          orderedParadas.forEach((p, idx) => {
            const isStart = idx === 0;
            const isEnd = idx === orderedParadas.length - 1;
            const nodeColor = isEnd ? '#a855f7' : isStart ? '#f59e0b' : '#3b82f6';
            stopsHtml += `
              <div style="position: relative; display: flex; align-items: flex-start; gap: 15px; margin-bottom: 25px; padding-left: 55px;">
                <div style="position: absolute; left: 10px; top: 0; width: 32px; height: 32px; border-radius: 50%; background: ${nodeColor}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; border: 3px solid #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.15); z-index: 2;">
                  ${idx + 1}
                </div>
                <div style="flex: 1; padding: 8px 14px; background: #ffffff; border: 1.5px solid #f1f5f9; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); text-align: left;">
                  <div style="font-size: 15px; font-weight: bold; color: #1e293b;">${p.nombre_parada}</div>
                  ${p.descripcion ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">${p.descripcion}</div>` : ''}
                </div>
              </div>
            `;
          });

          let htmlImagen = `
            <div style="display: flex; align-items: center; gap: 20px; border-bottom: 2.5px solid #FF3D00; padding-bottom: 20px; margin-bottom: 25px;">
                <img src="/assets/img/logo_${escCodigo}.png" style="height: 75px; width: auto; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.08));" onError="this.style.display='none'" />
                <div style="text-align: left;">
                    <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">República Bolivariana de Venezuela</div>
                    <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-top: 1px;">M.P.P. para la Educación</div>
                    <div style="font-size: 16px; font-weight: 800; color: #1e293b; margin-top: 4px;">${nombreEscuela}</div>
                </div>
            </div>
            <div style="text-align:center; margin-bottom:30px;">
                <h2 style="color:#FF3D00; margin:0; text-transform: uppercase; letter-spacing: 1px; font-size: 22px; font-weight: 800;">Rutograma Oficial de Transporte</h2>
                <div style="height: 3px; width: 60px; background: #FF3D00; margin: 8px auto 0; border-radius: 2px;"></div>
            </div>
            <div style="margin-bottom:30px; border:1px solid #e2e8f0; border-radius:16px; padding:20px; background: linear-gradient(135deg, #ffffff 0%, #fffaf7 100%); box-shadow: 0 4px 15px rgba(0,0,0,0.02); text-align: left;">
                <h3 style="color:#1e293b; font-size: 18px; margin-top:0; border-bottom:1.5px solid #e2e8f0; padding-bottom:12px; font-weight: 800; display: flex; justify-content: space-between; align-items: center;">
                  <span>🚍 ${ruta.nombre}</span>
                  <span style="font-size: 12px; padding: 4px 10px; border-radius: 20px; background: ${ruta.activo !== false ? '#dcfce7' : '#fee2e2'}; color: ${ruta.activo !== false ? '#166534' : '#991b1b'}; border: 1px solid ${ruta.activo !== false ? '#bbf7d0' : '#fecaca'}; font-weight: 700;">
                    ${ruta.activo !== false ? 'Activa' : 'Inactiva'}
                  </span>
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; font-size:14px; color: #475569;">
                  <div><b>Conductor Asignado:</b><br><span style="color:#0f172a; font-size: 15px; font-weight: bold;">${ruta.chofer_nombre || 'Sin Asignar'}</span></div>
                  <div><b>Docentes de Guardia:</b><br><span style="color:#0f172a; font-size: 15px; font-weight: bold;">${nombreDoc} ${telDoc ? `(${telDoc})` : ''}</span></div>
                  <div style="grid-column: span 2; margin-top: 5px; border-top: 1px dashed #e2e8f0; padding-top: 10px;">
                    <b>Vigencia del Recorrido:</b> Desde <span style="color:#0f172a; font-weight: bold;">${ruta.validez_desde || 'No establecida'}</span> Hasta <span style="color:#0f172a; font-weight: bold;">${ruta.validez_hasta || 'No establecida'}</span>
                  </div>
                </div>
            </div>
            <div style="position: relative; margin-bottom: 35px;">
                <div style="position: absolute; left: 25px; top: 15px; bottom: 15px; width: 3px; background: repeating-linear-gradient(180deg, #cbd5e1, #cbd5e1 6px, transparent 6px, transparent 12px); z-index: 1;"></div>
                ${stopsHtml}
            </div>
            <div style="margin-top: 40px; border-top: 1.5px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <img src="/assets/img/logoMPPE.png" style="height: 32px; width: auto;" />
                    <img src="/assets/img/logo_carga.png" style="height: 40px; width: auto;" />
                </div>
                <div style="text-align: right; font-size: 11px; color: #94a3b8; font-weight: 600;">
                    Generado: ${fechaHoy}<br>
                    Sistema Integral de Gestión y Administración Escolar (SIGAE)
                </div>
            </div>
            <div style="height: 6px; background: linear-gradient(90deg, #facc15 0%, #facc15 33.3%, #2563eb 33.3%, #2563eb 66.6%, #dc2626 66.6%, #dc2626 100%); margin-top: 15px; border-radius: 3px;"></div>
          `;

          clon.innerHTML = htmlImagen;
          document.body.appendChild(clon);
          await new Promise(res => setTimeout(res, 300));
          const canvas = await html2canvas(clon, { scale: 1.5, backgroundColor: '#ffffff', logging: false });
          document.body.removeChild(clon);

          const urlImagen = canvas.toDataURL("image/png");
          const a = document.createElement('a');
          a.href = urlImagen;
          a.download = `Rutograma_${ruta.nombre.replace(/\s/g, '_')}.png`;
          a.click();
        }
        Swal.close();
        Swal.fire({
          title: 'Completado',
          text: 'Las imágenes se descargaron en tu equipo.',
          icon: 'success',
          confirmButtonText: 'Abrir WhatsApp',
          confirmButtonColor: '#25D366',
          showCancelButton: true,
          cancelButtonText: 'Cerrar'
        }).then((res2: any) => {
          if (res2.isConfirmed) {
            window.open('whatsapp://', '_self');
          }
        });
      } catch (err: any) {
        Swal.close();
        Swal.fire('Error', err.message, 'error');
      }
      return;
    }

    // Paso a paso wizard for 'both' (imagen y texto)
    for (let i = 0; i < rutasSeleccionadas.length; i++) {
      const ruta = rutasSeleccionadas[i];
      const isLast = i === rutasSeleccionadas.length - 1;

      const action = await new Promise<'share' | 'skip' | 'cancel'>((resolve) => {
        Swal.fire({
          title: `Asistente de Envío (${i + 1} de ${rutasSeleccionadas.length})`,
          html: `
            <div class="text-center p-1">
              <p class="small text-muted mb-3">Estás por enviar la ruta:</p>
              <div class="fs-4 fw-bold text-success mb-3">🚍 ${ruta.nombre}</div>
              <div class="progress mb-3 shadow-sm rounded" style="height: 12px;">
                <div class="progress-bar bg-success progress-bar-striped progress-bar-animated" role="progressbar" style="width: ${((i + 1) / rutasSeleccionadas.length) * 100}%"></div>
              </div>
              <p class="small text-muted">Haz clic en <b>Preparar y Enviar</b>. Copiaremos su imagen al portapapeles y abriremos WhatsApp con el texto pre-cargado. Al terminar de enviar, regresa a esta pestaña para la siguiente ruta.</p>
            </div>
          `,
          confirmButtonText: '<i class="bi bi-whatsapp me-1"></i> Preparar y Enviar',
          confirmButtonColor: '#25D366',
          showDenyButton: true,
          denyButtonText: 'Omitir Ruta',
          denyButtonColor: '#6c757d',
          showCancelButton: true,
          cancelButtonText: 'Finalizar',
          allowOutsideClick: false
        }).then((res: any) => {
          if (res.isConfirmed) resolve('share');
          else if (res.isDenied) resolve('skip');
          else resolve('cancel');
        });
      });

      if (action === 'cancel') break;
      if (action === 'skip') continue;

      if (action === 'share') {
        await compartirRuta(ruta);
        await new Promise<void>(resolve => setTimeout(resolve, 1500));

        if (!isLast) {
          const next = await Swal.fire({
            title: '¿Continuar con la siguiente?',
            text: `Ruta "${ruta.nombre}" enviada. ¿Deseas pasar a la siguiente ruta?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, Siguiente',
            cancelButtonText: 'No, Detener',
            confirmButtonColor: '#25D366',
            allowOutsideClick: false
          });
          if (!next.isConfirmed) break;
        }
      }
    }

    Swal.fire({
      title: '¡Asistente Finalizado!',
      text: 'Has procesado la lista de rutas seleccionadas.',
      icon: 'success',
      confirmButtonColor: '#198754'
    });
  };

  // ────────────────────────────────────────────────────────────────────────────
  // SONIDO Y NOTIFICACIONES DE PARADAS
  // ────────────────────────────────────────────────────────────────────────────

  /** Solicita permiso de notificaciones al navegador (con guía si está bloqueado) */
  const requestNotifPermission = async () => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        subscribeToWebPush();
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: '¡Notificaciones habilitadas! 🔔',
          showConfirmButton: false,
          timer: 2000
        });
      }
    } else if (Notification.permission === 'granted') {
      subscribeToWebPush();
      Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Notificaciones ya están activas', showConfirmButton: false, timer: 2000 });
    } else if (Notification.permission === 'denied') {
      Swal.fire({
        title: 'Notificaciones Bloqueadas 🔔',
        html: `
          <p class="text-muted small mb-2">El navegador o el teléfono tienen las notificaciones desactivadas para esta aplicación.</p>
          <div class="text-start bg-light p-3 rounded-3 border">
            <span class="d-block fw-bold text-danger mb-1" style={{fontSize: '0.8rem'}}>Para habilitar y recibir las alertas del bus:</span>
            <ol class="small text-muted mb-0 ps-3">
              <li>Pulsa el icono de <strong>ajustes / candado / info</strong> a la izquierda de la dirección de la web.</li>
              <li>Activa o permite las <strong>Notificaciones</strong>.</li>
              <li>Si estás en PWA instalada, ve a Ajustes de tu móvil → Aplicaciones → SIGAE → Notificaciones → Permitir.</li>
            </ol>
          </div>
        `,
        icon: 'warning',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3085d6'
      });
    }
  };


  // ---- OPERACIONES EN VIVO ----
  const iniciarRecorrido = async () => {
    const ruta = rutas.find(r => r.id === opRutaId);
    if (!ruta) return;

    const originalPids = getIdsWithEscuela(ruta, opSentido as any);
    const pids = customPids ?? originalPids;
    if (pids.length === 0) return Swal.fire('Atención', 'La ruta no tiene paradas configuradas.', 'warning');
    
    const hoyStr = new Date().toISOString().split('T')[0];
    // Verificar que no exista ya un recorrido activo para esta ruta+sentido+día
    const existing = trackingHoy.find((t: any) => t.ruta_id === opRutaId && t.sentido === opSentido && t.fecha === hoyStr);
    if (existing && existing.estado !== 'Finalizada') {
      return Swal.fire('Atención', 'Ya existe un recorrido activo para esta ruta y sentido hoy.', 'info');
    }

    const defaultTime = getCurrentTime12Hour();
    const historial: any = { [pids[0]]: defaultTime };
    if (customPids) {
      historial._custom_order = customPids;
    }

    const tempId = crypto.randomUUID();
    const payload = {
      id: tempId,
      ruta_id: opRutaId,
      escuela_codigo: escCodigo,
      sentido: opSentido,
      estado: 'En Ruta',
      ubicacion_actual: pids[0],
      historial_paradas: historial,
      ultima_actualizacion: new Date().toISOString(),
      fecha: hoyStr
    };

    const rutaDisplay = ruta ? ruta.nombre : 'Ruta';
    const notifPayload = {
      escuela_codigo: escCodigo,
      ruta_id: opRutaId,
      titulo: 'Ruta Iniciada 🚌',
      cuerpo: `Se ha iniciado el recorrido para la ruta "${rutaDisplay}" (${opSentido}).`,
      tipo: 'transporte'
    };

    if (!navigator.onLine || offlineMode) {
      saveOfflineOp(payload);
      queueOfflineAction({ type: 'insert', table: 'transporte_operaciones', payload });
      queueOfflineAction({ type: 'insert', table: 'notificaciones_globales', payload: notifPayload });
      
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'warning',
        title: 'Recorrido iniciado offline 📶',
        showConfirmButton: false,
        timer: 3000
      });
      cargarTrackingSolo();
      requestNotifPermission();
      return;
    }

    try {
      const { error } = await supabase.from('transporte_operaciones').insert([payload]);
      if (error) throw error;

      await supabase.from('notificaciones_globales').insert([notifPayload]);
      await cargarTrackingSolo();
      requestNotifPermission();

      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Recorrido iniciado', showConfirmButton: false, timer: 2000 });

    } catch (err: any) {
      if (isNetworkError(err)) {
        setOfflineMode(true);
        saveOfflineOp(payload);
        queueOfflineAction({ type: 'insert', table: 'transporte_operaciones', payload });
        queueOfflineAction({ type: 'insert', table: 'notificaciones_globales', payload: notifPayload });
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'warning',
          title: 'Registrado offline (sin conexión) 📶',
          showConfirmButton: false,
          timer: 3000
        });
        cargarTrackingSolo();
        requestNotifPermission();
      } else {
        Swal.fire('Error', err.message, 'error');
      }
    }
  };

  const salidaMasiva = async () => {
    if (opSentido !== 'Escuela - Casa') {
      return Swal.fire('Acción no permitida', 'La salida masiva solo está disponible para el retorno (Escuela - Casa).', 'warning');
    }

    const { isConfirmed } = await Swal.fire({
      title: '¿Iniciar Salida Masiva?',
      html: `<p class="text-muted small">Se iniciará el recorrido de retorno simultáneamente para todas las rutas diseñadas de la institución.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, iniciar todo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981'
    });

    if (!isConfirmed) return;

    try {
      const hoyStr = new Date().toISOString().split('T')[0];
      const rutasEscuela = rutas;
      if (rutasEscuela.length === 0) {
        return Swal.fire('Sin rutas', 'No hay rutas configuradas para esta institución.', 'warning');
      }

      let countIniciadas = 0;

      for (const r of rutasEscuela) {
        const pids = getIdsWithEscuela(r, 'Escuela - Casa');
        if (pids.length === 0) continue;

        const existing = trackingHoy.find((t: any) => t.ruta_id === r.id && t.sentido === 'Escuela - Casa' && t.fecha === hoyStr);
        if (existing) continue;

        const defaultTime = getCurrentTime12Hour();

        const payload = {
          ruta_id: r.id,
          escuela_codigo: escCodigo,
          sentido: 'Escuela - Casa',
          estado: 'En Ruta',
          ubicacion_actual: pids[0],
          historial_paradas: { [pids[0]]: defaultTime },
          ultima_actualizacion: new Date().toISOString()
        };

        const { error } = await supabase.from('transporte_operaciones').insert([payload]);
        if (error) throw error;

        await supabase.from('notificaciones_globales').insert([{
          escuela_codigo: escCodigo,
          ruta_id: r.id,
          titulo: 'Ruta Iniciada (Retorno) 🚌',
          cuerpo: `Salida masiva: Se inició el recorrido de retorno para la ruta "${r.nombre}".`,
          tipo: 'transporte'
        }]);

        countIniciadas++;
      }

      await cargarTrackingSolo();

      Swal.fire({
        icon: 'success',
        title: 'Salida Masiva Iniciada',
        text: `Se iniciaron con éxito ${countIniciadas} rutas de retorno.`,
        timer: 3000,
        showConfirmButton: false
      });

    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const procesarCargaMasiva = async (rows: any[]): Promise<{ exitosos: number; rechazados: number; detalles: any[] }> => {
    const report: any[] = [];
    let exitosos = 0;
    let rechazados = 0;

    try {
      const { data: existingParadas, error: epErr } = await supabase.from('transporte_paradas').select('*');
      if (epErr) throw epErr;

      const { data: existingRutas, error: erErr } = await supabase.from('transporte_rutas').select('*');
      if (erErr) throw erErr;

      const currentParadas = [...(existingParadas || [])];
      const currentRutas = [...(existingRutas || [])];
      const paradaMap: { [key: string]: string } = {};

      const validRows: any[] = [];
      let index = 0;

      for (const row of rows) {
        index++;
        const rowString = `${row.escuela_codigo || ''}, ${row.ruta_nombre || ''}, ${row.parada_nombre || ''}`;
        
        if (!row.escuela_codigo || (row.escuela_codigo.toLowerCase() !== 'sb' && row.escuela_codigo.toLowerCase() !== 'lb')) {
          report.push({
            fila: index + 1,
            datos: rowString,
            estado: 'Rechazado',
            motivo: 'Código de escuela inválido (debe ser sb o lb)'
          });
          rechazados++;
          continue;
        }

        if (!row.ruta_nombre || !row.ruta_nombre.trim()) {
          report.push({
            fila: index + 1,
            datos: rowString,
            estado: 'Rechazado',
            motivo: 'El nombre de la ruta es obligatorio'
          });
          rechazados++;
          continue;
        }

        if (!row.parada_nombre || !row.parada_nombre.trim()) {
          report.push({
            fila: index + 1,
            datos: rowString,
            estado: 'Rechazado',
            motivo: 'El nombre de la parada es obligatorio'
          });
          rechazados++;
          continue;
        }

        validRows.push(row);
      }

      for (const row of validRows) {
        const key = `${row.escuela_codigo}:${row.parada_nombre.toLowerCase()}`;
        if (paradaMap[key]) continue;

        const found = currentParadas.find(p => p.escuela_codigo === row.escuela_codigo && p.nombre_parada.toLowerCase() === row.parada_nombre.toLowerCase());
        if (found) {
          paradaMap[key] = found.id;
        } else {
          try {
            const { data: inserted, error: insErr } = await supabase.from('transporte_paradas').insert([{
              escuela_codigo: row.escuela_codigo,
              nombre_parada: row.parada_nombre,
              descripcion: row.parada_descripcion
            }]).select();

            if (insErr) throw insErr;
            if (inserted && inserted.length > 0) {
              paradaMap[key] = inserted[0].id;
              currentParadas.push(inserted[0]);
            }
          } catch (err: any) {
            report.push({
              fila: rows.indexOf(row) + 2,
              datos: `${row.escuela_codigo}, ${row.ruta_nombre}, ${row.parada_nombre}`,
              estado: 'Rechazado',
              motivo: `Error DB al insertar parada: ${err.message}`
            });
            rechazados++;
            const vIdx = validRows.indexOf(row);
            if (vIdx > -1) validRows.splice(vIdx, 1);
          }
        }
      }

      const routesGroup: { [key: string]: { escuela_codigo: string; nombre: string; paradas: { id: string; orden: number }[]; rows: any[] } } = {};

      for (const row of validRows) {
        const routeKey = `${row.escuela_codigo}:${row.ruta_nombre.toLowerCase()}`;
        const paradaId = paradaMap[`${row.escuela_codigo}:${row.parada_nombre.toLowerCase()}`];
        if (!paradaId) continue;

        if (!routesGroup[routeKey]) {
          routesGroup[routeKey] = {
            escuela_codigo: row.escuela_codigo,
            nombre: row.ruta_nombre,
            paradas: [],
            rows: []
          };
        }

        routesGroup[routeKey].rows.push(row);
        if (!routesGroup[routeKey].paradas.some(p => p.id === paradaId)) {
          routesGroup[routeKey].paradas.push({ id: paradaId, orden: row.orden });
        }
      }

      for (const rKey of Object.keys(routesGroup)) {
        const group = routesGroup[rKey];
        group.paradas.sort((a, b) => a.orden - b.orden);
        const orderedIds = group.paradas.map(p => p.id);

        try {
          const foundRuta = currentRutas.find(r => r.escuela_codigo === group.escuela_codigo && r.nombre.toLowerCase() === group.nombre.toLowerCase());

          if (foundRuta) {
            const { error: updErr } = await supabase.from('transporte_rutas').update({
              paradas_json: orderedIds
            }).eq('id', foundRuta.id);

            if (updErr) throw updErr;
          } else {
            const { error: insErr } = await supabase.from('transporte_rutas').insert([{
              escuela_codigo: group.escuela_codigo,
              nombre: group.nombre,
              paradas_json: orderedIds
            }]);

            if (insErr) throw insErr;
          }

          for (const row of group.rows) {
            report.push({
              fila: rows.indexOf(row) + 2,
              datos: `${row.escuela_codigo}, ${row.ruta_nombre}, ${row.parada_nombre}`,
              estado: 'Exitoso',
              motivo: foundRuta ? 'Ruta y parada actualizadas con éxito' : 'Ruta y parada creadas con éxito'
            });
            exitosos++;
          }

        } catch (err: any) {
          for (const row of group.rows) {
            report.push({
              fila: rows.indexOf(row) + 2,
              datos: `${row.escuela_codigo}, ${row.ruta_nombre}, ${row.parada_nombre}`,
              estado: 'Rechazado',
              motivo: `Error DB al guardar ruta: ${err.message}`
            });
            rechazados++;
          }
        }
      }

      report.sort((a, b) => a.fila - b.fila);
      cargarTodo(true);

    } catch (err: any) {
      report.push({
        fila: 1,
        datos: 'Error general',
        estado: 'Rechazado',
        motivo: err.message
      });
      rechazados = rows.length;
    }

    return { exitosos, rechazados, detalles: report };
  };

  const marcarParada = async (paradaId: string, index: number, orderedIds: string[]) => {
    if (!opActual) {
      return Swal.fire('Sin recorrido activo', 'Primero inicia el recorrido con el botón "Iniciar Recorrido".', 'warning');
    }
    if (opActual.estado === 'Finalizada') {
      return Swal.fire('Recorrido finalizado', 'Este recorrido ya fue completado. Inicia uno nuevo si necesitas continuar.', 'info');
    }

    const isEnd = index === orderedIds.length - 1;
    const now = new Date();
    const defaultTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    const result = await Swal.fire({
      title: isEnd ? '🏁 Finalizar Recorrido' : '📍 Registrar Paso',
      html: `
        <p class="text-muted small mb-3">${isEnd ? 'Confirma la llegada a la escuela.' : `Parada: <strong>${orderedIds[index]}</strong>`}</p>
        <label class="fw-semibold small d-block mb-1">Hora de paso:</label>
        <input type="time" id="swal-input-time" class="form-control form-control-lg text-center fw-bold" value="${defaultTime}">
      `,
      showCancelButton: true,
      confirmButtonText: isEnd ? '✅ Finalizar' : '✅ Registrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: isEnd ? '#6d28d9' : '#10b981',
      preConfirm: () => {
        const timeInput = (document.getElementById('swal-input-time') as HTMLInputElement)?.value;
        if (!timeInput) { Swal.showValidationMessage('Debe ingresar una hora'); }
        return timeInput;
      }
    });

    if (!result.isConfirmed) return;

    try {
      const selectedTime = result.value;
      const formattedTime = formatTo12Hour(selectedTime);
      const historialAnterior = opActual.historial_paradas || {};
      const nuevoHistorial = { ...historialAnterior, [paradaId]: formattedTime };

      const payload = {
        ubicacion_actual: paradaId,
        estado: isEnd ? 'Finalizada' : 'En Ruta',
        ultima_actualizacion: new Date().toISOString(),
        historial_paradas: nuevoHistorial
      };

      let paradaDisplay = paradaId;
      if (paradaId === 'escuela_virtual') {
        paradaDisplay = 'Escuela';
      } else {
        const pData = paradas.find(p => p.id === paradaId);
        if (pData) paradaDisplay = pData.nombre_parada;
      }
      const ruta = rutas.find(r => r.id === opRutaId);
      const rutaDisplay = ruta ? ruta.nombre : 'Ruta';

      const titulo = isEnd ? '🏁 Destino Alcanzado' : '📍 Paso por Parada';
      const cuerpo = isEnd 
        ? `El recorrido de "${rutaDisplay}" finalizó con éxito en la escuela.`
        : `El bus de "${rutaDisplay}" pasó por la parada: ${paradaDisplay}.`;

      const notifPayload = {
        escuela_codigo: escCodigo,
        ruta_id: opRutaId,
        titulo,
        cuerpo,
        tipo: 'transporte'
      };

      if (!navigator.onLine || offlineMode) {
        const updatedOp = { ...opActual, ...payload };
        saveOfflineOp(updatedOp);
        setOpActual(updatedOp);
        queueOfflineAction({
          type: 'update',
          table: 'transporte_operaciones',
          payload,
          eq: { key: 'id', value: opActual.id }
        });
        queueOfflineAction({ type: 'insert', table: 'notificaciones_globales', payload: notifPayload });
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'warning',
          title: 'Registrado offline 📶',
          showConfirmButton: false,
          timer: 3000
        });
        cargarTrackingSolo();
        return;
      }

      const { error } = await supabase.from('transporte_operaciones').update(payload).eq('id', opActual.id);

      if (error) {
        if (error.message?.includes('historial_paradas')) {
          const { error: err2 } = await supabase.from('transporte_operaciones').update({
            ubicacion_actual: paradaId,
            estado: isEnd ? 'Finalizada' : 'En Ruta',
            ultima_actualizacion: new Date().toISOString()
          }).eq('id', opActual.id);
          if (err2) throw err2;
        } else {
          throw error;
        }
      }

      await supabase.from('notificaciones_globales').insert([notifPayload]);
      await cargarTrackingSolo();

      Swal.fire({ toast: true, position: 'top-end', icon: 'success',
        title: isEnd ? '🏁 Ruta finalizada' : '✅ Paso registrado',
        showConfirmButton: false, timer: 1800 });
    } catch (err: any) {
      if (isNetworkError(err)) {
        const selectedTime = result.value;
        const formattedTime = formatTo12Hour(selectedTime);
        const historialAnterior = opActual.historial_paradas || {};
        const nuevoHistorial = { ...historialAnterior, [paradaId]: formattedTime };

        const payload = {
          ubicacion_actual: paradaId,
          estado: isEnd ? 'Finalizada' : 'En Ruta',
          ultima_actualizacion: new Date().toISOString(),
          historial_paradas: nuevoHistorial
        };

        let paradaDisplay = paradaId;
        if (paradaId === 'escuela_virtual') {
          paradaDisplay = 'Escuela';
        } else {
          const pData = paradas.find(p => p.id === paradaId);
          if (pData) paradaDisplay = pData.nombre_parada;
        }
        const ruta = rutas.find(r => r.id === opRutaId);
        const rutaDisplay = ruta ? ruta.nombre : 'Ruta';

        const titulo = isEnd ? '🏁 Destino Alcanzado' : '📍 Paso por Parada';
        const cuerpo = isEnd 
          ? `El recorrido de "${rutaDisplay}" finalizó con éxito en la escuela.`
          : `El bus de "${rutaDisplay}" pasó por la parada: ${paradaDisplay}.`;

        const notifPayload = {
          escuela_codigo: escCodigo,
          ruta_id: opRutaId,
          titulo,
          cuerpo,
          tipo: 'transporte'
        };

        setOfflineMode(true);
        const updatedOp = { ...opActual, ...payload };
        saveOfflineOp(updatedOp);
        setOpActual(updatedOp);
        queueOfflineAction({
          type: 'update',
          table: 'transporte_operaciones',
          payload,
          eq: { key: 'id', value: opActual.id }
        });
        queueOfflineAction({ type: 'insert', table: 'notificaciones_globales', payload: notifPayload });
        
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'warning',
          title: 'Registrado offline (sin conexión) 📶',
          showConfirmButton: false,
          timer: 3000
        });
        cargarTrackingSolo();
      } else {
        Swal.fire({ icon: 'error', title: 'No se pudo registrar', text: err.message });
      }
    }
  };

  // Reset manual (llamado desde botón y desde auto-reset diario)
  const ejecutarResetDiario = async (silencioso = false) => {
    try {
      const ayerStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      // Marcar como 'No Completado' los recorridos que quedaron incompletos ayer
      await supabase.from('transporte_operaciones')
        .update({ estado: 'No Completado' })
        .eq('escuela_codigo', escCodigo)
        .eq('fecha', ayerStr)
        .neq('estado', 'Finalizada');

      // Podar notificaciones antiguas para optimizar rendimiento de base de datos
      const hoyStart = new Date();
      hoyStart.setHours(0, 0, 0, 0);
      await supabase.from('notificaciones_globales')
        .delete()
        .eq('escuela_codigo', escCodigo)
        .lt('creado_en', hoyStart.toISOString());

      if (!silencioso) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Sistema reiniciado para el día de hoy', showConfirmButton: false, timer: 2500 });
      }
    } catch (e: any) {
      console.error('Auto-reset error:', e);
    }
  };

  const resetMasivo = () => {
    Swal.fire({
      title: '¿Resetear recorridos de hoy?',
      html: `<p class="text-muted small">Se eliminarán <strong>todos los registros de hoy</strong> para esta escuela.<br>Los recorridos de días anteriores no se verán afectados.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Sí, resetear hoy'
    }).then(async (res: any) => {
      if (res.isConfirmed) {
        try {
          const hoyStr = new Date().toISOString().split('T')[0];
          const { error } = await supabase.from('transporte_operaciones')
            .delete()
            .eq('fecha', hoyStr)
            .eq('escuela_codigo', escCodigo);
          if (error) throw error;

          // Borrar notificaciones globales de hoy para la escuela
          const hoyStart = new Date();
          hoyStart.setHours(0, 0, 0, 0);
          await supabase.from('notificaciones_globales')
            .delete()
            .eq('escuela_codigo', escCodigo)
            .gte('creado_en', hoyStart.toISOString());

          setOpActual(null);
          setCustomPids(null);
          localStorage.removeItem('sigae_transporte_opActual');
          await cargarTrackingSolo();
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Reset completado. No hay recorridos activos para hoy.', showConfirmButton: false, timer: 3000 });
        } catch(e: any) {
          Swal.fire('Error', 'No se pudo borrar. Verifica los permisos en Supabase (política RLS DELETE).', 'error');
        }
      }
    });
  };

  const resetRutaActual = () => {
    if (!opRutaId) return;
    Swal.fire({
      title: '¿Resetear esta ruta?',
      html: `<p class="text-muted small">Se eliminará el recorrido actual de hoy para esta ruta y sentido.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ffc107',
      confirmButtonText: 'Sí, resetear'
    }).then(async (res: any) => {
      if (res.isConfirmed) {
        try {
          const hoyStr = new Date().toISOString().split('T')[0];
          const { error } = await supabase.from('transporte_operaciones')
            .delete()
            .eq('fecha', hoyStr)
            .eq('escuela_codigo', escCodigo)
            .eq('ruta_id', opRutaId)
            .eq('sentido', opSentido);
          if (error) throw error;

          // Borrar notificaciones globales de hoy para la ruta y escuela
          const hoyStart = new Date();
          hoyStart.setHours(0, 0, 0, 0);
          await supabase.from('notificaciones_globales')
            .delete()
            .eq('escuela_codigo', escCodigo)
            .eq('ruta_id', opRutaId)
            .gte('creado_en', hoyStart.toISOString());

          setOpActual(null);
          setCustomPids(null);
          localStorage.removeItem('sigae_transporte_opActual');
          await cargarTrackingSolo();
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Ruta reseteada', showConfirmButton: false, timer: 2000 });
        } catch(e: any) {
          Swal.fire('Error', 'No se pudo resetear la ruta. Verifica los permisos en Supabase (política RLS DELETE).', 'error');
        }
      }
    });
  };

  if (permLoading || loadingData) {
    return <div className="text-center py-5"><div className="spinner-border text-success" role="status"></div></div>;
  }

  if (!canViewTransporte) {
    return (
      <div className="col-12 text-center py-5 mt-4">
        <div className="bg-light d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm border" style={{ width: '100px', height: '100px' }}>
            <i className="bi bi-shield-lock-fill text-muted" style={{ fontSize: '3.5rem' }}></i>
        </div>
        <h4 className="text-dark fw-bold mb-2">Área Restringida</h4>
        <p className="text-muted mb-0">No tienes permisos asignados para visualizar el Transporte Escolar.</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 animate__animated animate__fadeIn">
      {/* Banner de Categoría Unificado */}
      <div className="row mb-5 animate__animated animate__fadeInDown">
        <div className="col-12">
          <div className="banner-modulo p-4 p-md-5 text-white" style={{ background: 'linear-gradient(135deg, #FF3D00 0%, rgba(0,0,0,0.4) 150%)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
            <div className="burbuja-3d burbuja-1" style={{ position: 'absolute', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', top: '-20px', left: '-20px' }}></div>
            <div className="burbuja-3d burbuja-2" style={{ position: 'absolute', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: '-50px', right: '10%' }}></div>
            <div className="burbuja-3d burbuja-3" style={{ position: 'absolute', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: '30%', left: '40%' }}></div>
            <div className="row align-items-center position-relative z-1">
              <div className="col-md-9 text-center text-md-start mb-3 mb-md-0">
                <span className="badge bg-white shadow-sm mb-3 px-3 py-2 fw-bold" style={{ color: '#FF3D00', letterSpacing: '1px', fontSize: '0.85rem' }}>
                  <i className="bi bi-bus-front me-1"></i> SERVICIOS Y BIENESTAR
                </span>
                <h1 className="fw-bolder mb-2 text-white d-flex align-items-center justify-content-center justify-content-md-start gap-3" style={{ fontSize: '2.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  <span className="bus-header-icon"><AnimatedBusSVG size={48} className="bus-bounce" /></span>
                  Transporte Escolar
                </h1>
                <p className="mb-0 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.9)' }}>Monitoreo de rutas, paradas y recorridos de las unidades en tiempo real.</p>
              </div>
              <div className="col-md-3 text-center text-md-end d-none d-md-block">
                <img 
                  src={`/assets/img/logo_${escCodigo}.png`} 
                  alt="Logo Escuela" 
                  style={{ maxHeight: '130px', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }} 
                  onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de control para escuelas y volver */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        {tieneAccesoEscuelaTransporte('sb') && tieneAccesoEscuelaTransporte('lb') && (
          <div className="btn-group bg-light rounded-pill p-1 shadow-sm border">
            <button 
              onClick={() => setEscCodigo('sb')} 
              className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${escCodigo === 'sb' ? 'btn-primary text-white shadow-sm' : 'btn-light text-muted border-0'}`}
            >
              Santa Bárbara
            </button>
            <button 
              onClick={() => setEscCodigo('lb')} 
              className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${escCodigo === 'lb' ? 'btn-primary text-white shadow-sm' : 'btn-light text-muted border-0'}`}
            >
              Libertador Bolívar
            </button>
          </div>
        )}
        {vistaActual !== 'dashboard' && (
          <button className="btn btn-outline-secondary rounded-pill px-3 shadow-sm fw-bold ms-auto" onClick={() => setVistaActual('dashboard')}>
            <i className="bi bi-arrow-left me-1"></i> Volver al Dashboard
          </button>
        )}
      </div>

      <style>{`
        .bus-header-icon { display: inline-flex; align-items: center; }
        @keyframes busBounce {
          0%,100% { transform: translateY(0) rotate(0deg); }
          25%      { transform: translateY(-3px) rotate(-2deg); }
          75%      { transform: translateY(2px) rotate(2deg); }
        }
        .bus-bounce { animation: busBounce 2.4s ease-in-out infinite; }
        .road-track {
          position: absolute; left: 15px; top: 0; bottom: 0; width: 10px;
          background: repeating-linear-gradient(180deg, #94a3b8 0px, #94a3b8 10px, transparent 10px, transparent 20px);
          border-radius: 5px; z-index: 0; opacity: 0.25;
        }
        .road-track-fill {
          position: absolute; left: 15px; top: 0; width: 10px;
          background: linear-gradient(180deg, #f59e0b, #3b82f6, #10b981);
          border-radius: 5px; z-index: 1; opacity: 0.9;
          transition: height 0.8s cubic-bezier(0.34,1.56,0.64,1);
        }
        .parada-row-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          border: 1px solid #bfdbfe; border-radius: 20px;
          padding: 4px 12px; font-weight: 700; color: #1d4ed8; font-size: 0.82rem;
        }
        .route-stepper {
          position: relative; padding: 4px 0 4px 0;
        }
        .stepper-stop {
          position: relative; display: flex; align-items: stretch;
          gap: 12px; padding: 5px 0; margin-bottom: 2px;
          animation: fadeInLeft 0.35s ease both;
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .stepper-pin {
          flex-shrink: 0; width: 40px; height: 40px;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 1.05rem; z-index: 2; position: relative;
          border: 3px solid white;
          box-shadow: 0 3px 10px rgba(0,0,0,0.15);
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .stepper-stop:hover .stepper-pin { transform: scale(1.12); }
        .stepper-pin.pending  { background: #f1f5f9; border-color: #e2e8f0; color: #94a3b8; font-size: 0.5rem; }
        .stepper-pin.active   { background: #ecfdf5; border-color: #10b981; color: #10b981; animation: pulse-stepper 2s infinite; }
        .stepper-pin.passed   { background: #3b82f6; border-color: #2563eb; color: white; }
        .stepper-pin.origin   { background: #fff7ed; border-color: #f59e0b; color: #f59e0b; }
        .stepper-pin.school   { background: #fdf4ff; border-color: #a855f7; color: #a855f7; }
        @keyframes pulse-stepper {
          0%,100% { box-shadow: 0 3px 10px rgba(0,0,0,0.15), 0 0 0 0 rgba(16,185,129,0.45); }
          50%      { box-shadow: 0 3px 10px rgba(0,0,0,0.15), 0 0 0 10px rgba(16,185,129,0); }
        }
        /* Active bus pin wiggle */
        @keyframes busWiggle {
          0%,100% { transform: rotate(0deg) scale(1.05); }
          30% { transform: rotate(-8deg) scale(1.1); }
          60% { transform: rotate(8deg) scale(1.1); }
        }
        .stepper-pin.active { animation: pulse-stepper 2s infinite, busWiggle 1.5s ease-in-out infinite; }
        .stepper-card {
          flex: 1; background: white; border-radius: 12px; padding: 10px 14px;
          border: 1.5px solid #f1f5f9;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
          transition: all 0.2s ease;
          display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px;
        }
        .stepper-card-info { flex: 1 1 150px; min-width: 150px; }
        .stepper-stop:hover .stepper-card { box-shadow: 0 4px 14px rgba(0,0,0,0.09); border-color: #e2e8f0; }
        .stepper-card.active  { border-color: #10b981; background: linear-gradient(135deg,#f0fdf4,#ecfdf5); }
        .stepper-card.passed  { border-color: #dbeafe; background: #f8fafc; opacity: 0.88; }
        .stepper-card.origin  { border-color: #fed7aa; background: #fffbf7; }
        .stepper-card.school  { border-color: #e9d5ff; background: #fdf4ff; }
        .stepper-step-num {
          font-size: 0.62rem; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; margin-bottom: 1px;
        }
        .stepper-name {
          font-size: 0.88rem; font-weight: 700; color: #1e293b; line-height: 1.2;
          word-break: normal; overflow-wrap: anywhere;
        }
        .stepper-desc {
          font-size: 0.72rem; color: #94a3b8; margin-top: 2px; line-height: 1.2;
        }
        .stepper-hora {
          display: inline-flex; align-items: center; gap: 3px;
          font-size: 0.7rem; font-weight: 600; color: #3b82f6;
          background: #eff6ff; padding: 1px 7px; border-radius: 20px; margin-top: 3px;
        }
        .btn-pasamos {
          flex-shrink: 0; border: none;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white; font-weight: 700; font-size: 0.75rem;
          padding: 6px 14px; border-radius: 20px; white-space: nowrap;
          box-shadow: 0 3px 8px rgba(16,185,129,0.3);
          transition: all 0.2s ease; cursor: pointer;
        }
        .btn-pasamos:hover { transform: scale(1.05); box-shadow: 0 5px 14px rgba(16,185,129,0.42); background: linear-gradient(135deg,#059669,#047857); }
        .btn-pasamos:active { transform: scale(0.96); }
        .bus-here-badge {
          flex-shrink: 0; display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 20px;
          background: #10b981; color: white; font-size: 0.7rem; font-weight: 700;
        }
        .live-dot {
          width: 6px; height: 6px; border-radius: 50%; background: white;
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%,100% { opacity:1; } 50% { opacity:0.2; }
        }

        /* ─── Animated road marquee banner ──────────────── */
        .road-marquee {
          background: repeating-linear-gradient(90deg, #1e293b 0px, #1e293b 40px, #f59e0b 40px, #f59e0b 50px);
          height: 8px; border-radius: 4px; animation: marqueeRoad 1.5s linear infinite;
        }
        @keyframes marqueeRoad {
          0%   { background-position: 0 0; }
          100% { background-position: 50px 0; }
        }
        .status-bus-banner {
          position: relative; overflow: hidden;
          border-radius: 16px; padding: 16px 20px;
        }
        @keyframes busSlideIn {
          from { transform: translateX(-80px) scaleX(-1); opacity: 0; }
          to   { transform: translateX(0) scaleX(-1); opacity: 1; }
        }
        .bus-slide-in { animation: busSlideIn 0.7s cubic-bezier(0.34,1.56,0.64,1) both; }

        /* Map Grid Background */
        .map-bg {
          background-color: #f8fafc;
          background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
          background-size: 20px 20px;
          border-radius: 24px;
          padding: 20px;
          border: 1px solid #e2e8f0;
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
        }

        /* Modern Tables */
        .table-moderna { border-collapse: separate; border-spacing: 0 8px; }
        .table-moderna tbody tr { background: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.02); transition: all 0.2s; border-radius: 12px; }
        .table-moderna tbody tr:hover { transform: scale(1.01); box-shadow: 0 5px 15px rgba(0,0,0,0.08); z-index: 10; position: relative; }
        .table-moderna td { border: none; padding: 16px; }
        .table-moderna td:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; }
        .table-moderna td:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; }
      `}</style>

      {/* DASHBOARD PRINCIPAL */}
      {vistaActual === 'dashboard' && (
        <DashboardView
          canManageParadas={canManageParadas}
          canManageRutas={canManageRutas}
          canOperateTracking={canOperateTracking}
          canViewRecorrido={canViewRecorrido}
          setVistaActual={setVistaActual}
          setConfigTab={setConfigTab}
          AnimatedBusSVG={AnimatedBusSVG}
          rutas={rutas}
          user={user}
          compartirRuta={compartirRuta}
        />
      )}

      {/* VISTA: CONFIGURACION */}
      {vistaActual === 'Configuracion' && (
        <ConfiguracionView
          configTab={configTab}
          setConfigTab={setConfigTab}
          canManageParadas={canManageParadas}
          canManageRutas={canManageRutas}
          paradas={paradas}
          rutas={rutas}
          docentes={docentes}
          setParadaForm={setParadaForm}
          setShowModalParada={setShowModalParada}
          setRutaForm={setRutaForm}
          setParadasTemporales={setParadasTemporales}
          setShowModalRuta={setShowModalRuta}
          setShowModalAsignacion={setShowModalAsignacion}
          setShowModalCargaMasiva={(val) => { if (val) setVistaActual('CargaMasiva'); }}
          deleteParada={deleteParada}
          deleteParadasMasivo={deleteParadasMasivo}
          deleteRuta={deleteRuta}
          deleteRutasMasivo={deleteRutasMasivo}
          compartirRuta={compartirRuta}
          compartirRutasMasivo={compartirRutasMasivo}
          limpiarAsignacionesMasivo={limpiarAsignacionesMasivo}
          editRuta={editRuta}
          BusStopIcon={BusStopIcon}
          AnimatedBusSVG={AnimatedBusSVG}
        />
      )}

      {/* VISTA: CARGA MASIVA */}
      {vistaActual === 'CargaMasiva' && (
        <CargaMasivaView
          onBack={() => setVistaActual('Configuracion')}
          onSave={procesarCargaMasiva}
        />
      )}

      {/* VISTA: OPERACION */}
      {vistaActual === 'Operacion' && (
        <OperacionView
          opRutaId={opRutaId}
          setOpRutaId={setOpRutaId}
          opSentido={opSentido}
          setOpSentido={setOpSentido}
          rutas={rutas}
          opActual={opActual}
          customPids={customPids}
          setCustomPids={setCustomPids}
          dragIdx={dragIdx}
          setDragIdx={setDragIdx}
          iniciarRecorrido={iniciarRecorrido}
          marcarParada={marcarParada}
          resetRutaActual={resetRutaActual}
          resetMasivo={resetMasivo}
          getIdsWithEscuela={getIdsWithEscuela}
          getParadasWithEscuela={getParadasWithEscuela}
          BusProgressBar={BusProgressBar}
          AnimatedBusSVG={AnimatedBusSVG}
          BusStopIcon={BusStopIcon}
          canControlCoordinacion={canControlCoordinacion}
          salidaMasiva={salidaMasiva}
          offlineMode={offlineMode}
        />
      )}

      {/* VISTA: VISOR */}
      {vistaActual === 'Visor' && (
        <VisorView
          opRutaId={opRutaId}
          setOpRutaId={setOpRutaId}
          opSentido={opSentido}
          setOpSentido={setOpSentido}
          rutas={rutas}
          opActual={opActual}
          getIdsWithEscuela={getIdsWithEscuela}
          getParadasWithEscuela={getParadasWithEscuela}
          BusProgressBar={BusProgressBar}
          AnimatedBusSVG={AnimatedBusSVG}
          BusStopIcon={BusStopIcon}
        />
      )}

      {/* MODALES EXTERNALIZADOS */}
      {showModalParada && (
        <ModalParada
          paradaForm={paradaForm}
          onClose={() => setShowModalParada(false)}
          onSave={async (formData) => {
            try {
              const payload = {
                escuela_codigo: escCodigo,
                nombre_parada: formData.nombre,
                descripcion: formData.descripcion
              };
              if (formData.id) {
                const { error } = await supabase.from('transporte_paradas').update(payload).eq('id', formData.id);
                if (error) throw error;
              } else {
                const { error } = await supabase.from('transporte_paradas').insert([payload]);
                if (error) throw error;
              }
              setShowModalParada(false);
              Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Guardado', showConfirmButton: false, timer: 2000 });
              cargarTodo(true);
            } catch (err: any) {
              Swal.fire('Error', err.message, 'error');
            }
          }}
        />
      )}

      {showModalRuta && (
        <ModalRuta
          rutaForm={rutaForm}
          paradas={paradas}
          rutas={rutas}
          initialParadasTemporales={paradasTemporales}
          onClose={() => setShowModalRuta(false)}
          onSave={async (formData, tempParadas) => {
            if (!formData.nombre) {
              return Swal.fire('Atención', 'Escriba un nombre para la ruta', 'warning');
            }
            if (tempParadas.length === 0) {
              return Swal.fire('Atención', 'Añada al menos una parada al recorrido.', 'warning');
            }
            try {
              const payload = {
                escuela_codigo: escCodigo,
                nombre: formData.nombre,
                paradas_json: tempParadas.map(p => p.id)
              };
              if (formData.id) {
                const { error } = await supabase.from('transporte_rutas').update(payload).eq('id', formData.id);
                if (error) throw error;
              } else {
                const { error } = await supabase.from('transporte_rutas').insert([payload]);
                if (error) throw error;
              }
              setShowModalRuta(false);
              Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Ruta Guardada', showConfirmButton: false, timer: 2000 });
              cargarTodo(true);
            } catch (err: any) {
              Swal.fire('Error', err.message, 'error');
            }
          }}
        />
      )}

      {showModalAsignacion && (
        <ModalAsignacion
          rutaForm={rutaForm}
          docentes={docentes}
          onClose={() => setShowModalAsignacion(false)}
          onSave={async (formData) => {
            if (!formData.validez_desde || !formData.validez_hasta) {
              return Swal.fire('Atención', 'Especifique la fecha de validez', 'warning');
            }
            try {
              const payload = {
                chofer_nombre: formData.chofer_nombre,
                docente_id: formData.docente_id || null,
                validez_desde: formData.validez_desde,
                validez_hasta: formData.validez_hasta,
                activo: formData.activo !== false
              };
              const { error } = await supabase.from('transporte_rutas').update(payload).eq('id', formData.id);
              if (error) throw error;
              setShowModalAsignacion(false);
              Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Personal Asignado', showConfirmButton: false, timer: 2000 });
              cargarTodo(true);
            } catch (err: any) {
              Swal.fire('Error', err.message, 'error');
            }
          }}
        />
      )}


    </div>
  );
};


