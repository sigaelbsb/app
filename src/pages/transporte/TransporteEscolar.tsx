import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { usePermisos } from '../../hooks/usePermisos';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { subscribeToWebPush } from '../../lib/webPush';
import html2canvas from 'html2canvas';

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
  const { loading: permLoading, tienePermiso, tieneAccesoEscuela } = usePermisos();
  const Swal = (window as any).Swal;

  const [vistaActual, setVistaActual] = useState<'dashboard' | 'Configuracion' | 'Operacion' | 'Visor'>('dashboard');
  const [configTab, setConfigTab] = useState<'Paradas' | 'Rutas' | 'Asignacion'>('Paradas');
  const [escCodigo, setEscCodigo] = useState(localStorage.getItem('sigae_escuela_codigo') || 'sb');

  const canManageRutas    = tienePermiso('Tarjeta: Gestión de Rutas')    || tienePermiso('Gestión de Rutas');
  const canManageParadas  = tienePermiso('Tarjeta: Gestión de Paradas')  || tienePermiso('Gestión de Paradas');
  const canOperateTracking= tienePermiso('Tarjeta: Operación (Tracking)')|| tienePermiso('Operación (Tracking)');
  const canViewRecorrido  = tienePermiso('Tarjeta: Visor de Recorrido')  || tienePermiso('Visor de Recorrido');
  const canViewTransporte = canManageRutas || canManageParadas || canOperateTracking || canViewRecorrido || tienePermiso('Transporte Escolar');

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

  useEffect(() => { localStorage.setItem('sigae_transporte_ruta', opRutaId); }, [opRutaId]);
  useEffect(() => { localStorage.setItem('sigae_transporte_sentido', opSentido); }, [opSentido]);

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

  const cargarTodo = async (silencioso = false) => {
    if (!silencioso) setLoadingData(true);
    try {
      const hoyStr = new Date().toISOString().split('T')[0];
      
      const [paradasRes, rutasRes, usuariosRes, trackingRes] = await Promise.all([
        supabase.from('transporte_paradas').select('*').eq('escuela_codigo', escCodigo).order('nombre_parada', { ascending: true }),
        supabase.from('transporte_rutas').select('*').eq('escuela_codigo', escCodigo).order('nombre', { ascending: true }),
        supabase.from('usuarios').select('id_usuario, cedula, nombre_completo, rol, cargo, telefono').eq('id_escuela', escCodigo),
        supabase.from('transporte_operaciones').select('*').eq('escuela_codigo', escCodigo).eq('fecha', hoyStr)
      ]);

      if (paradasRes.error) throw paradasRes.error;
      if (rutasRes.error) throw rutasRes.error;
      if (usuariosRes.error) throw usuariosRes.error;
      if (trackingRes.error) throw trackingRes.error;

      setParadas(paradasRes.data || []);
      setRutas(rutasRes.data || []);
      setTrackingHoy(trackingRes.data || []);

      const rolesExcluidos = ['Estudiante', 'Representante', 'Invitado'];
      const docs = (usuariosRes.data || []).filter((u: any) => !rolesExcluidos.includes(u.rol));
      setDocentes(docs);

    } catch (e: any) {
      console.error(e);
      if (!silencioso) Swal.fire('Error', 'Falla al conectar con base de datos.', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  const cargarTrackingSolo = async () => {
    const hoyStr = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('transporte_operaciones').select('*').eq('escuela_codigo', escCodigo).eq('fecha', hoyStr);
    if (data) setTrackingHoy(data);
  };

  // ---- PARADAS ----
  const saveParada = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        escuela_codigo: escCodigo,
        nombre_parada: paradaForm.nombre,
        descripcion: paradaForm.descripcion
      };
      
      if (paradaForm.id) {
        const { error } = await supabase.from('transporte_paradas').update(payload).eq('id', paradaForm.id);
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
  };

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

  const saveRuta = async () => {
    if (!rutaForm.nombre) {
      return Swal.fire('Atención', 'Escriba un nombre para la ruta', 'warning');
    }
    if (paradasTemporales.length === 0) {
      return Swal.fire('Atención', 'Añada al menos una parada al recorrido.', 'warning');
    }

    try {
      const payload = {
        escuela_codigo: escCodigo,
        nombre: rutaForm.nombre,
        paradas_json: paradasTemporales.map(p => p.id)
      };

      if (rutaForm.id) {
        const { error } = await supabase.from('transporte_rutas').update(payload).eq('id', rutaForm.id);
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
  };

  const saveAsignacion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!rutaForm.validez_desde || !rutaForm.validez_hasta) {
        return Swal.fire('Atención', 'Especifique la fecha de validez', 'warning');
      }

      const payload = {
        chofer_nombre: rutaForm.chofer,
        docente_id: rutaForm.docente_id || null,
        validez_desde: rutaForm.validez_desde,
        validez_hasta: rutaForm.validez_hasta
      };

      const { error } = await supabase.from('transporte_rutas').update(payload).eq('id', rutaForm.id);
      if (error) throw error;
      
      setShowModalAsignacion(false);
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Personal Asignado', showConfirmButton: false, timer: 2000 });
      cargarTodo(true);
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
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

  // Rutograma Constructor
  const moveParadaTemp = (idx: number, dir: number) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= paradasTemporales.length) return;
    const items = [...paradasTemporales];
    const temp = items[idx];
    items[idx] = items[newIdx];
    items[newIdx] = temp;
    setParadasTemporales(items);
  };
  const removeParadaTemp = (idx: number) => {
    const items = [...paradasTemporales];
    items.splice(idx, 1);
    setParadasTemporales(items);
  };

  // ---- COMPARTIR / EXPORTAR ----
  const compartirRuta = async (ruta: any) => {
    Swal.fire({ title: 'Preparando Mensaje...', text: 'Generando imagen membretada de la ruta...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
    try {
      const pids = getIdsWithEscuela(ruta, 'Casa - Escuela'); // Para compartir asumimos Ida como base visual
      const orderedParadas = getParadasWithEscuela(pids);

      const doc = docentes.find(d => d.id_usuario === ruta.docente_id);
      const nombreDoc = doc ? doc.nombre_completo : 'Sin asignar';
      const telDoc = doc ? (doc.telefono || '') : '';
      const fechaHoy = new Date().toLocaleString('es-VE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      const clon = document.createElement('div');
      clon.style.width = "800px"; clon.style.padding = "40px"; clon.style.background = "#ffffff"; 
      clon.style.position = "absolute"; clon.style.top = "-9999px"; clon.style.left = "-9999px"; 
      clon.style.fontFamily = "Arial, Helvetica, sans-serif";

      let htmlImagen = `
        <div style="display: flex; align-items: center; border-bottom: 2px solid #0066FF; padding-bottom: 15px; margin-bottom: 25px;">
            <div>
                <div style="font-size: 12px; color: #334155;">República Bolivariana de Venezuela</div>
                <div style="font-size: 12px; color: #334155;">Ministerio del Poder Popular para la Educación</div>
                <div style="font-size: 14px; font-weight: bold; color: #0f172a;">Unidad Educativa Libertador Bolívar</div>
            </div>
        </div>
        <div style="text-align:center; margin-bottom:25px;">
            <h2 style="color:#0066FF; margin:0; text-transform: uppercase;">Rutograma de Transporte Escolar</h2>
        </div>
        <div style="margin-bottom:20px; border:2px solid #e2e8f0; border-radius:10px; padding:20px; background: #f8fafc;">
            <h3 style="color:#f97316; margin-top:0; border-bottom:1px solid #cbd5e1; padding-bottom:10px;">${ruta.nombre}</h3>
            <div style="font-size:16px; margin-bottom:15px; color: #1e293b;"><b>Chofer:</b> ${ruta.chofer_nombre} &nbsp;|&nbsp; <b>Guía:</b> ${nombreDoc} ${telDoc}</div>
            <div style="font-size:15px; font-weight:bold; margin-bottom:10px; color: #0f172a;">Secuencia de Recorrido:</div>
            <ul style="list-style-type:none; padding-left:0; font-size:15px; margin:0; color: #334155;">
      `;
      let textoMensaje = `🚍 *RUTA DE TRANSPORTE ESCOLAR*\n🏫 *U.E. Libertador Bolívar*\n\n📍 *${ruta.nombre}*\n👨✈️ Chofer: ${ruta.chofer_nombre}\n👩🏫 Guía: ${nombreDoc} ${telDoc ? '('+telDoc+')' : ''}\n\n*Paradas:*\n`;

      orderedParadas.forEach((p, idx) => {
        htmlImagen += `<li style="margin-bottom:8px;"><b>${idx+1}.</b> ${p.nombre_parada} <span style="color:#64748b; font-size:13px;">(${p.descripcion||'Sin referencia'})</span></li>`;
        textoMensaje += `  ${idx+1}. ${p.nombre_parada}\n`;
      });
      htmlImagen += `</ul></div>`;
      htmlImagen += `
          <div style="margin-top: 40px; border-top: 2px solid #dc3545; padding-top: 15px; display: flex; justify-content: space-between; align-items: center;">
              <div style="text-align: right; font-size: 12px; color: #64748b;">Generado: ${fechaHoy}<br>Sistema SIGAE v1.0</div>
          </div>`;

      clon.innerHTML = htmlImagen;
      document.body.appendChild(clon);
      await new Promise(res => setTimeout(res, 500));
      const canvas = await html2canvas(clon, { scale: 2, backgroundColor: '#ffffff', logging: false });
      document.body.removeChild(clon);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `Ruta_${ruta.nombre.replace(/\s/g, '_')}.png`, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          Swal.close();
          try { await navigator.share({ title: ruta.nombre, text: textoMensaje, files: [file] }); } catch (err) {}
        } else {
          Swal.close();
          const urlImagen = canvas.toDataURL("image/png");
          const a = document.createElement('a'); a.href = urlImagen; a.download = `Ruta_${ruta.nombre.replace(/\s/g, '_')}.png`; a.click();
          navigator.clipboard.writeText(textoMensaje).then(() => {
            Swal.fire({
              title: '¡Ruta Preparada!', html: '<b>1.</b> La imagen PNG se descargó.<br><b>2.</b> El texto fue copiado al portapapeles.<br><br>¿Dónde deseas enviarlo?', icon: 'info', showCancelButton: true,
              confirmButtonText: '<i class="bi bi-whatsapp me-1"></i> WhatsApp', cancelButtonText: '<i class="bi bi-telegram me-1"></i> Telegram', confirmButtonColor: '#25D366', cancelButtonColor: '#0088cc'
            }).then((res2: any) => {
              if (res2.isConfirmed) { window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Información de la ruta escolar. ¡Adjunta la imagen descargada!\n\n' + textoMensaje)}`, '_blank'); } 
              else if (res2.dismiss === Swal.DismissReason.cancel) { window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(textoMensaje)}`, '_blank'); }
            });
          });
        }
      }, "image/png");
    } catch(e:any) {
      console.error(e);
      Swal.fire('Error', 'No se pudo generar la imagen.', 'error');
    }
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
    
    const pids = getIdsWithEscuela(ruta, opSentido as any);
    if (pids.length === 0) return Swal.fire('Atención', 'La ruta no tiene paradas configuradas.', 'warning');
    
    const hoyStr = new Date().toISOString().split('T')[0];
    // Verificar que no exista ya un recorrido activo para esta ruta+sentido+día
    const existing = trackingHoy.find((t: any) => t.ruta_id === opRutaId && t.sentido === opSentido && t.fecha === hoyStr);
    if (existing && existing.estado !== 'Finalizada') {
      return Swal.fire('Atención', 'Ya existe un recorrido activo para esta ruta y sentido hoy.', 'info');
    }

    try {
      const payload = {
        ruta_id: opRutaId,
        escuela_codigo: escCodigo,
        sentido: opSentido,
        estado: 'En Ruta',
        ubicacion_actual: pids[0],
        historial_paradas: {},
        ultima_actualizacion: new Date().toISOString()
      };
      const { error } = await supabase.from('transporte_operaciones').insert([payload]);
      if (error) throw error;
      await cargarTrackingSolo();
      // Pedir permisos de notificación al iniciar (sin bloquear)
      requestNotifPermission();

      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Recorrido iniciado', showConfirmButton: false, timer: 2000 });

    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
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
      const historialAnterior = opActual.historial_paradas || {};
      const nuevoHistorial = { ...historialAnterior, [paradaId]: selectedTime };

      const { data: updData, error } = await supabase.from('transporte_operaciones').update({
        ubicacion_actual: paradaId,
        estado: isEnd ? 'Finalizada' : 'En Ruta',
        ultima_actualizacion: new Date().toISOString(),
        historial_paradas: nuevoHistorial
      }).eq('id', opActual.id).select();

      if (error) {
        if (error.message?.includes('historial_paradas')) {
          // Column missing – update without historial
          const { data: updData2, error: err2 } = await supabase.from('transporte_operaciones').update({
            ubicacion_actual: paradaId,
            estado: isEnd ? 'Finalizada' : 'En Ruta',
            ultima_actualizacion: new Date().toISOString()
          }).eq('id', opActual.id).select();
          if (err2) throw err2;
          if (!updData2 || updData2.length === 0) throw new Error("Acción bloqueada por permisos RLS en Supabase (Update devolvió 0 filas).");
        } else {
          throw error;
        }
      } else if (!updData || updData.length === 0) {
        throw new Error("Acción bloqueada por permisos RLS en Supabase (Actualización silenciosa fallida).");
      }

      await cargarTrackingSolo();

      Swal.fire({ toast: true, position: 'top-end', icon: 'success',
        title: isEnd ? '🏁 Ruta finalizada' : '✅ Paso registrado',
        showConfirmButton: false, timer: 1800 });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'No se pudo registrar', text: err.message });
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
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center gap-3 mb-0">
          <h4 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <span className="bus-header-icon"><AnimatedBusSVG size={38} color="#2563eb" className="bus-bounce" /></span>
            Transporte Escolar
          </h4>
          {tieneAccesoEscuela('sb') && tieneAccesoEscuela('lb') && (
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
        </div>
        {vistaActual !== 'dashboard' && (
          <button className="btn btn-outline-secondary rounded-pill px-3 shadow-sm fw-bold mt-2 mt-sm-0" onClick={() => setVistaActual('dashboard')}>
            <i className="bi bi-arrow-left me-1"></i> Volver al Dashboard
          </button>
        )}
      </div>

      <style>{`
        /* ─── Animated Bus Header ──────────────────────── */
        .bus-header-icon { display: inline-flex; align-items: center; }
        @keyframes busBounce {
          0%,100% { transform: translateY(0) rotate(0deg); }
          25%      { transform: translateY(-3px) rotate(-2deg); }
          75%      { transform: translateY(2px) rotate(2deg); }
        }
        .bus-bounce { animation: busBounce 2.4s ease-in-out infinite; }

        /* ─── Road-style track behind stepper ───────────── */
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

        /* Dashboard Cards Premium */
        .tarjeta-sub { 
          background: #ffffff; 
          border-radius: 24px; 
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
          cursor: pointer; 
          overflow: hidden; 
          position: relative; 
          display: flex; 
          flex-direction: column; 
          text-align: left;
          border: 1px solid rgba(255,255,255,0.4);
        }
        .tarjeta-sub::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%);
          z-index: 1; pointer-events: none; border-radius: 24px;
        }
        .tarjeta-sub:hover { 
          transform: translateY(-10px) scale(1.02); 
          box-shadow: 0 20px 40px rgba(0,0,0,0.12) !important; 
        }
        .tarjeta-sub .bg-icono-gigante { 
          position: absolute; right: -20px; bottom: -20px; font-size: 9rem; 
          opacity: 0.04; transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
          pointer-events: none; z-index: 0;
        }
        .tarjeta-sub:hover .bg-icono-gigante { transform: scale(1.3) rotate(-15deg); opacity: 0.08; }
        .tarjeta-sub .icono-sub { 
          width: 65px; height: 65px; border-radius: 20px; display: flex; align-items: center; 
          justify-content: center; font-size: 2.2rem; margin-bottom: 1.5rem; 
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: 2;
        }
        .tarjeta-sub:hover .icono-sub { transform: scale(1.15) rotate(5deg); }
        .tarjeta-sub.bloqueado { filter: grayscale(100%); opacity: 0.6; cursor: not-allowed; }
        .tarjeta-sub.bloqueado:hover { transform: none; box-shadow: none !important; }

        /* ─── Bus driving across dashboard card ─────────── */
        @keyframes driveBus {
          0%   { transform: translateX(-60px); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateX(360px); opacity: 0; }
        }
        .bus-drive {
          position: absolute; bottom: 12px; left: 0; z-index: 3; pointer-events: none;
          animation: driveBus 4s linear infinite;
        }
        .tarjeta-sub:hover .bus-drive { animation-play-state: running; }

        /* ─── Parada card for config table ──────────────── */
        .parada-row-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          border: 1px solid #bfdbfe; border-radius: 20px;
          padding: 4px 12px; font-weight: 700; color: #1d4ed8; font-size: 0.82rem;
        }

        /* ─── VERTICAL STEPPER TIMELINE ─────────────────────────────── */
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
        <div className="row g-4">

          {/* ── Tarjeta: Configuración (Paradas + Rutas unificadas) ── */}
          {(canManageParadas || canManageRutas) && (
            <div className="col-12 col-md-6 col-xl-4 animate__animated animate__fadeInUp" style={{ animationDelay: '0s' }}>
              <div
                className="tarjeta-sub p-4 h-100 shadow-sm"
                style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)', border: '1px solid #fed7aa' }}
                onClick={() => { setConfigTab(canManageParadas ? 'Paradas' : 'Rutas'); setVistaActual('Configuracion'); }}
              >
                <i className="bi bi-signpost-split-fill bg-icono-gigante" style={{ color: '#ea580c' }}></i>
                <div className="icono-sub shadow-sm" style={{ color: '#ea580c', background: 'white', border: '1px solid #fed7aa', display: 'flex', gap: 6 }}>
                  <BusStopIcon size={30} />
                  <AnimatedBusSVG size={30} color="#ea580c" className="bus-bounce" />
                </div>
                <h5 className="fw-bold text-dark mb-1" style={{ zIndex: 2 }}>Paradas y Rutas</h5>
                <p className="small text-muted mb-0" style={{ zIndex: 2 }}>Gestionar catálogo de paradas, diseño de rutas y asignación de personal.</p>
                {/* Mini pill badges */}
                <div className="d-flex gap-2 mt-2" style={{ zIndex: 2, flexWrap: 'wrap' }}>
                  {canManageParadas && <span className="badge rounded-pill" style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '0.65rem' }}><i className="bi bi-geo-alt-fill me-1"></i>Paradas</span>}
                  {canManageRutas   && <span className="badge rounded-pill" style={{ background: '#fed7aa', color: '#9a3412', fontSize: '0.65rem' }}><i className="bi bi-signpost-2-fill me-1"></i>Rutas</span>}
                  {canManageRutas   && <span className="badge rounded-pill" style={{ background: '#e9d5ff', color: '#6b21a8', fontSize: '0.65rem' }}><i className="bi bi-person-badge-fill me-1"></i>Personal</span>}
                </div>
                <div className="bus-drive" style={{ zIndex: 3 }}>
                  <AnimatedBusSVG size={24} color="#ea580c" />
                </div>
              </div>
            </div>
          )}


          {/* ── Tarjeta: Gestor de Recorrido (Operación) ── */}
          <div className="col-12 col-md-6 col-xl-3 animate__animated animate__fadeInUp" style={{ animationDelay: '0.2s' }}>
            <div
              className={`tarjeta-sub p-4 h-100 shadow-sm ${!canOperateTracking ? 'bloqueado' : ''}`}
              style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)', border: '1px solid #ddd6fe' }}
              onClick={() => canOperateTracking && setVistaActual('Operacion')}
            >
              <i className="bi bi-broadcast bg-icono-gigante" style={{ color: '#6d28d9' }}></i>
              <div className="icono-sub shadow-sm" style={{ color: '#6d28d9', background: 'white', border: '1px solid #ddd6fe' }}>
                <AnimatedBusSVG size={38} color="#6d28d9" className="bus-bounce" />
              </div>
              <h5 className="fw-bold text-dark mb-1" style={{ zIndex: 2 }}>Gestor de Recorrido</h5>
              <p className="small text-muted mb-0" style={{ zIndex: 2 }}>Iniciar ruta y marcar avance en tiempo real.</p>
              {!canOperateTracking && (
                <div className="mt-2" style={{ zIndex: 2 }}>
                  <span className="badge bg-secondary rounded-pill" style={{ fontSize: '0.65rem' }}>
                    <i className="bi bi-lock-fill me-1"></i>Sin permiso
                  </span>
                </div>
              )}
              <div className="bus-drive" style={{ zIndex: 3 }}>
                <AnimatedBusSVG size={26} color="#6d28d9" />
              </div>
            </div>
          </div>

          {/* ── Tarjeta: Visor de Recorrido ── */}
          <div className="col-12 col-md-6 col-xl-3 animate__animated animate__fadeInUp" style={{ animationDelay: '0.3s' }}>
            <div
              className={`tarjeta-sub p-4 h-100 shadow-sm ${!canViewRecorrido ? 'bloqueado' : ''}`}
              style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', border: '1px solid #bbf7d0' }}
              onClick={() => canViewRecorrido && setVistaActual('Visor')}
            >
              <i className="bi bi-eye-fill bg-icono-gigante" style={{ color: '#198754' }}></i>
              <div className="icono-sub shadow-sm" style={{ color: '#198754', background: 'white', border: '1px solid #bbf7d0' }}>
                <AnimatedBusSVG size={38} color="#198754" className="bus-bounce" />
              </div>
              <h5 className="fw-bold text-dark mb-1" style={{ zIndex: 2 }}>Visor de Recorrido</h5>
              <p className="small text-muted mb-0" style={{ zIndex: 2 }}>Seguimiento en vivo para representantes y docentes.</p>
              {!canViewRecorrido && (
                <div className="mt-2" style={{ zIndex: 2 }}>
                  <span className="badge bg-secondary rounded-pill" style={{ fontSize: '0.65rem' }}>
                    <i className="bi bi-lock-fill me-1"></i>Sin permiso
                  </span>
                </div>
              )}
              <div className="bus-drive" style={{ zIndex: 3 }}>
                <AnimatedBusSVG size={26} color="#198754" />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* VISTA: CONFIGURACION */}
      {vistaActual === 'Configuracion' && (
        <div className="card shadow-sm border-0 rounded-4 animate__animated animate__fadeInRight">
          <div className="card-header bg-white pt-4 pb-0 border-bottom-0">
            <ul className="nav nav-tabs border-bottom-0">
              {canManageParadas && (
                <li className="nav-item">
                  <button className={`nav-link fw-bold ${configTab === 'Paradas' ? 'active border-bottom-0 bg-light text-primary' : 'text-muted'}`} onClick={() => setConfigTab('Paradas')}>
                    <i className="bi bi-geo-alt-fill me-2"></i>Catálogo de Paradas
                  </button>
                </li>
              )}
              {canManageRutas && (
                <li className="nav-item">
                  <button className={`nav-link fw-bold ${configTab === 'Rutas' ? 'active border-bottom-0 bg-light text-primary' : 'text-muted'}`} onClick={() => setConfigTab('Rutas')}>
                    <i className="bi bi-signpost-split-fill me-2"></i>Secuencia de Rutas
                  </button>
                </li>
              )}
              {canManageRutas && (
                <li className="nav-item">
                  <button className={`nav-link fw-bold ${configTab === 'Asignacion' ? 'active border-bottom-0 bg-light text-primary' : 'text-muted'}`} onClick={() => setConfigTab('Asignacion')}>
                    <i className="bi bi-person-badge-fill me-2"></i>Asignación de Personal
                  </button>
                </li>
              )}
            </ul>
          </div>
          
          <div className="card-body p-4 p-md-5 bg-light rounded-bottom-4">
            
            {/* TAB: PARADAS */}
            {configTab === 'Paradas' && canManageParadas && (
              <div className="animate__animated animate__fadeIn">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold text-dark mb-0">Listado de Paradas</h5>
                  <button className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm" onClick={() => { setParadaForm({ id: '', nombre: '', descripcion: '' }); setShowModalParada(true); }}>
                    <i className="bi bi-plus-lg me-1"></i> Nueva Parada
                  </button>
                </div>
                
                <div className="table-responsive px-2">
                  <table className="table table-moderna w-100">
                    <thead className="text-muted small text-uppercase">
                      <tr>
                        <th className="border-0 pb-3">Nombre de Parada</th>
                        <th className="border-0 pb-3">Referencia</th>
                        <th className="text-end border-0 pb-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paradas.length === 0 ? (
                        <tr><td colSpan={3}>
                          <div className="text-center py-5">
                            <BusStopIcon size={56} />
                            <div className="text-muted mt-2">No hay paradas registradas en el catálogo.</div>
                          </div>
                        </td></tr>
                      ) : paradas.map((p) => (
                        <tr key={p.id}>
                          <td className="px-3">
                            <div className="d-flex align-items-center gap-2">
                              <BusStopIcon size={28} />
                              <span className="fw-bold text-dark">{p.nombre_parada}</span>
                            </div>
                          </td>
                          <td className="text-muted small">{p.descripcion || 'Sin referencia'}</td>
                          <td className="text-end text-nowrap px-3">
                            <button className="btn btn-sm btn-light border text-primary me-1 shadow-sm" onClick={() => { setParadaForm({ id: p.id, nombre: p.nombre_parada, descripcion: p.descripcion || '' }); setShowModalParada(true); }}><i className="bi bi-pencil-fill"></i></button>
                            <button className="btn btn-sm btn-light border text-danger shadow-sm" onClick={() => deleteParada(p.id)}><i className="bi bi-trash-fill"></i></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: RUTAS */}
            {configTab === 'Rutas' && canManageRutas && (
              <div className="animate__animated animate__fadeIn">
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                  <h5 className="fw-bold text-dark mb-0">Diseño y Secuencia</h5>
                  <button className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" onClick={() => { setRutaForm({ id: '', nombre: '', chofer: '', docente_id: '', validez_desde: '', validez_hasta: '' }); setParadasTemporales([]); setShowModalRuta(true); }}>
                    <i className="bi bi-plus-circle me-1"></i> Nueva Ruta
                  </button>
                </div>

                <div className="table-responsive px-2">
                  <table className="table table-moderna w-100">
                    <thead className="text-muted small text-uppercase">
                      <tr>
                        <th className="border-0 pb-3">Ruta</th>
                        <th className="text-center border-0 pb-3">Paradas</th>
                        <th className="text-end border-0 pb-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rutas.length === 0 ? (
                        <tr><td colSpan={3}>
                          <div className="text-center py-5">
                            <AnimatedBusSVG size={64} color="#cbd5e1" />
                            <div className="text-muted mt-2">No hay rutas diseñadas. ¡Crea tu primera ruta!</div>
                          </div>
                        </td></tr>
                      ) : rutas.map((r) => {
                        let len = 0;
                        if (Array.isArray(r.paradas_json)) len = r.paradas_json.length;
                        else if (typeof r.paradas_json === 'string') { try { len = JSON.parse(r.paradas_json).length; } catch(e){} }
                        
                        return (
                          <tr key={r.id}>
                            <td className="px-3">
                              <div className="d-flex align-items-center gap-2">
                                <AnimatedBusSVG size={32} color="#2563eb" />
                                <span className="fw-bold text-primary">{r.nombre}</span>
                              </div>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-success rounded-pill px-2 py-1">
                                <i className="bi bi-signpost-2-fill me-1"></i>{len} paradas
                              </span>
                            </td>
                            <td className="text-end text-nowrap px-3">
                              <button className="btn btn-sm btn-light border text-success shadow-sm me-1" title="Compartir WhatsApp" onClick={() => compartirRuta(r)}><i className="bi bi-whatsapp"></i></button>
                              <button className="btn btn-sm btn-light border text-primary shadow-sm me-1" onClick={() => editRuta(r)}><i className="bi bi-pencil-fill"></i></button>
                              <button className="btn btn-sm btn-light border text-danger shadow-sm" onClick={() => deleteRuta(r.id)}><i className="bi bi-trash-fill"></i></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: ASIGNACION */}
            {configTab === 'Asignacion' && canManageRutas && (
              <div className="animate__animated animate__fadeIn">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold text-dark mb-0">Personal Asignado a Rutas</h5>
                </div>

                <div className="table-responsive px-2">
                  <table className="table table-moderna w-100">
                    <thead className="text-muted small text-uppercase">
                      <tr>
                        <th className="border-0 pb-3">Ruta</th>
                        <th className="border-0 pb-3">Chofer Asignado</th>
                        <th className="border-0 pb-3">Docente Guía</th>
                        <th className="text-end border-0 pb-3">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rutas.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-4 text-muted">Debe diseñar una ruta primero.</td></tr>
                      ) : rutas.map((r) => {
                        const doc = docentes.find(d => d.id_usuario === r.docente_id);
                        return (
                          <tr key={r.id}>
                            <td className="fw-bold text-dark px-3">{r.nombre}</td>
                            <td>
                              <div className="text-muted small"><i className="bi bi-person-vcard me-1"></i>Nombre</div>
                              <div className="fw-bold">{r.chofer_nombre || <span className="text-danger">Sin asignar</span>}</div>
                            </td>
                            <td>
                              <div className="text-muted small"><i className="bi bi-person-video3 me-1"></i>Guía</div>
                              <div className="fw-bold">{doc ? doc.nombre_completo : <span className="text-danger">Sin asignar</span>}</div>
                            </td>
                            <td className="text-end px-3">
                              <button className="btn btn-sm btn-outline-primary rounded-pill fw-bold" onClick={() => {
                                setRutaForm(r);
                                setShowModalAsignacion(true);
                              }}>
                                <i className="bi bi-person-lines-fill me-1"></i>Asignar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* VISTA: OPERACION Y VISOR EN VIVO */}
      {(vistaActual === 'Operacion' || vistaActual === 'Visor') && (
        <div className="card shadow-sm border-0 rounded-4 animate__animated animate__fadeInRight">
          <div className="card-body p-4 p-md-5">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3 border-bottom pb-3">
              <h5 className="fw-bold text-dark mb-0">
                <i className="bi bi-geo-alt-fill text-success me-2"></i>
                {vistaActual === 'Operacion' ? 'Operación de Ruta' : 'Visor de Recorrido'}
              </h5>
              {vistaActual === 'Operacion' && canOperateTracking && (
                <div className="d-flex flex-wrap gap-2">
                  {opActual && (
                    <button className="btn btn-outline-warning rounded-pill px-3 shadow-sm" onClick={resetRutaActual}>
                      <i className="bi bi-arrow-counterclockwise me-1"></i>Reset Ruta
                    </button>
                  )}
                  <button className="btn btn-outline-danger rounded-pill px-3 shadow-sm" onClick={resetMasivo}>
                    <i className="bi bi-exclamation-triangle-fill me-1"></i>Reset Masivo
                  </button>
                </div>
              )}
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="small text-muted fw-bold mb-1">Seleccione la Ruta</label>
                <select className="form-select input-moderno fw-bold" value={opRutaId} onChange={e => setOpRutaId(e.target.value)}>
                  <option value="">Seleccione una ruta...</option>
                  {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="small text-muted fw-bold mb-1">Momento</label>
                <select className="form-select input-moderno" value={opSentido} onChange={e => setOpSentido(e.target.value)}>
                  <option value="Casa - Escuela">Ida (Casa - Escuela)</option>
                  <option value="Escuela - Casa">Retorno (Escuela - Casa)</option>
                </select>
              </div>
            </div>

            {!opRutaId ? (
              <div className="text-center py-5 text-muted bg-light rounded-4 border">
                <i className="bi bi-map fs-1 text-secondary mb-3 d-block"></i>
                <h6 className="fw-bold">Seleccione una ruta</h6>
                <p className="small mb-0">Para visualizar o iniciar el recorrido.</p>
              </div>
            ) : (
              <div className="map-bg">
                {/* Renderizar Rutograma */}
                {(() => {
                  const rutaObj = rutas.find(r => r.id === opRutaId);
                  if (!rutaObj) return null;
                  
                  const originalPids = getIdsWithEscuela(rutaObj, opSentido as any);
                  // Usar orden personalizado si existe, si no el original
                  const pids = customPids ?? originalPids;
                  const orderedParadas = getParadasWithEscuela(pids);

                  // Helpers para reordenar paradas (excluye escuela_virtual que va fija)
                  const moverParada = (idx: number, dir: number) => {
                    const base = customPids ?? originalPids;
                    // No mover escuela_virtual
                    if (base[idx] === 'escuela_virtual' || base[idx + dir] === 'escuela_virtual') return;
                    const arr = [...base];
                    const tmp = arr[idx]; arr[idx] = arr[idx + dir]; arr[idx + dir] = tmp;
                    setCustomPids(arr);
                  };

                  // Drag & drop swap
                  const handleDragStart = (idx: number) => setDragIdx(idx);
                  const handleDragEnd   = () => setDragIdx(null);
                  const handleDragOver  = (e: React.DragEvent, idx: number) => {
                    e.preventDefault();
                    if (dragIdx === null || dragIdx === idx) return;
                    const base = customPids ?? originalPids;
                    // No soltar sobre escuela_virtual
                    if (base[idx] === 'escuela_virtual' || base[dragIdx] === 'escuela_virtual') return;
                    const arr = [...base];
                    const moved = arr.splice(dragIdx, 1)[0];
                    arr.splice(idx, 0, moved);
                    setCustomPids(arr);
                    setDragIdx(idx);
                  };

                  if (orderedParadas.length === 0) return <div className="text-center py-4">Esta ruta no tiene paradas.</div>;

                  return (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                        {vistaActual === 'Operacion' && !opActual && (
                          <button className="btn btn-warning rounded-pill px-4 fw-bold shadow-sm" onClick={iniciarRecorrido}>
                            <i className="bi bi-play-circle me-2"></i>Iniciar Recorrido
                          </button>
                        )}
                        {vistaActual === 'Operacion' && !opActual && customPids && (
                          <button
                            className="btn btn-outline-secondary rounded-pill px-3 shadow-sm"
                            onClick={() => setCustomPids(null)}
                            title="Restaurar orden original de la ruta"
                          >
                            <i className="bi bi-arrow-counterclockwise me-1"></i>Restablecer orden
                          </button>
                        )}
                        {vistaActual === 'Operacion' && !opActual && (
                          <span className="badge bg-light text-muted border rounded-pill px-3 py-2 small">
                            <i className="bi bi-arrows-expand-vertical me-1"></i>
                            Arrastra o usa ↑↓ para reordenar antes de iniciar
                          </span>
                        )}
                      </div>

                      {opActual && (() => {
                        const rutaObj2 = rutas.find(r => r.id === opRutaId);
                        const pids2 = rutaObj2 ? getIdsWithEscuela(rutaObj2, opSentido as any) : [];
                        const currentIdx2 = pids2.findIndex((id: string) => id === opActual.ubicacion_actual);
                        const progressIdx = opActual.estado === 'Finalizada' ? pids2.length - 1 : currentIdx2;
                        return (
                          <div className={`status-bus-banner shadow-sm mb-4 ${opActual.estado === 'Finalizada' ? '' : ''}`}
                            style={{ background: opActual.estado === 'Finalizada'
                              ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)'
                              : 'linear-gradient(135deg, #dbeafe, #eff6ff)',
                              border: opActual.estado === 'Finalizada' ? '1.5px solid #6ee7b7' : '1.5px solid #93c5fd' }}
                          >
                            <div className="d-flex align-items-center gap-3 mb-2">
                              <div>
                                <h6 className="fw-bold mb-0" style={{ color: opActual.estado === 'Finalizada' ? '#065f46' : '#1e40af' }}>
                                  {opActual.estado === 'Finalizada' ? '🏁 Ruta Finalizada con Éxito' : '🚍 En Ruta — Recorrido Activo'}
                                </h6>
                                <div className="small" style={{ color: opActual.estado === 'Finalizada' ? '#047857' : '#1d4ed8' }}>
                                  Última actualización: {new Date(opActual.ultima_actualizacion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                              </div>
                              {opActual.estado !== 'Finalizada' && (
                                <div className="ms-auto">
                                  <span className="bus-here-badge">
                                    <span className="live-dot"></span>
                                    EN VIVO
                                  </span>
                                </div>
                              )}
                            </div>
                            {/* Progress bar with moving bus */}
                            {pids2.length > 0 && (
                              <BusProgressBar
                                total={pids2.length}
                                current={progressIdx >= 0 ? progressIdx : 0}
                                finalizada={opActual.estado === 'Finalizada'}
                              />
                            )}
                            {/* Animated road strip */}
                            <div className="road-marquee"></div>
                          </div>
                        );
                      })()}

                      <div className="route-stepper" style={{ paddingLeft: 4 }}>
                        {orderedParadas.map((parada: any, index: number) => {
                          const isStart = index === 0;
                          const isSchool = parada.id === 'escuela_virtual';
                          const isDestino = index === orderedParadas.length - 1;

                          let passed   = false;
                          let isActive = false;

                          if (opActual) {
                            const currentIdx = pids.findIndex((id: string) => id === opActual.ubicacion_actual);
                            if (opActual.estado === 'Finalizada') {
                              passed = true;
                            } else if (index < currentIdx) {
                              passed = true;
                            } else if (index === currentIdx) {
                              isActive = true;
                            }
                          }

                          const pinClass = isActive ? 'active' : passed ? 'passed' : isSchool ? 'school' : isStart ? 'origin' : 'pending';
                          const cardClass = isActive ? 'active' : passed ? 'passed' : isSchool ? 'school' : isStart ? 'origin' : '';

                          // Get registered time from historial
                          const horaRegistrada = opActual?.historial_paradas?.[parada.id];

                          return (
                            <div
                              key={`stop-${parada.id}`}
                              className="stepper-stop"
                              style={{
                                animationDelay: `${index * 0.05}s`,
                                // Visual feedback durante drag
                                opacity: (vistaActual === 'Operacion' && !isSchool && dragIdx === index) ? 0.45 : 1,
                                outline: (vistaActual === 'Operacion' && dragIdx !== null && dragIdx !== index && !isSchool)
                                  ? '2px dashed #6366f1' : 'none',
                                outlineOffset: 3,
                                borderRadius: 12,
                                transition: 'opacity 0.15s, outline 0.15s',
                                cursor: (vistaActual === 'Operacion' && !isSchool) ? 'grab' : 'default',
                              }}
                              // ── Drag & drop handlers ──
                              draggable={vistaActual === 'Operacion' && !isSchool}
                              onDragStart={() => handleDragStart(index)}
                              onDragOver={(e) => handleDragOver(e, index)}
                              onDragEnd={handleDragEnd}
                            >
                              <div className={`stepper-pin ${pinClass}`} style={{ overflow: 'hidden' }}>
                                {isActive
                                  ? <AnimatedBusSVG size={26} color="#10b981" />
                                  : passed
                                    ? <i className="bi bi-check-lg"></i>
                                    : isSchool
                                      ? (
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#a855f7' }}>
                                          {/* Main pediment / triangle roof */}
                                          <path d="m2 10 10-6 10 6" />
                                          {/* Building outline */}
                                          <path d="M4 10v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10" />
                                          {/* Central portal / door */}
                                          <path d="M9 22V12h6v10" />
                                          {/* Clock tower / dome on top */}
                                          <path d="M12 4v2" />
                                          <circle cx="12" cy="7.5" r="1.5" fill="currentColor" />
                                        </svg>
                                      )
                                      : isStart
                                        ? <BusStopIcon size={22} active={false} />
                                        : <i className="bi bi-circle-fill" style={{fontSize:'0.45rem'}}></i>
                                }
                              </div>
                              <div className={`stepper-card ${cardClass}`}>
                                <div className="stepper-card-info">
                                  <div className="stepper-step-num" style={{color: isActive?'#10b981':passed?'#3b82f6':isSchool?'#a855f7':'#94a3b8'}}>
                                    {isStart ? 'Origen' : isSchool ? 'Destino Final' : `Parada ${index}`}
                                  </div>
                                  <div className="stepper-name">{parada.nombre_parada}</div>
                                  {parada.descripcion && <div className="stepper-desc">{parada.descripcion}</div>}
                                  {horaRegistrada && (
                                    <div className="stepper-hora">
                                      <i className="bi bi-clock-fill"></i>
                                      {horaRegistrada}
                                    </div>
                                  )}
                                </div>

                                {/* ── Botones de reordenamiento (Operacion, no sobre escuela_virtual) ── */}
                                {vistaActual === 'Operacion' && !isSchool && (
                                  <div className="d-flex flex-column gap-1" style={{ flexShrink: 0 }}>
                                    <button
                                      className="btn btn-sm btn-light border rounded-circle p-0 shadow-sm"
                                      style={{ width: 28, height: 28, lineHeight: 1 }}
                                      disabled={index === 0}
                                      onClick={() => moverParada(index, -1)}
                                      title="Subir parada"
                                    >
                                      <i className="bi bi-chevron-up" style={{ fontSize: '0.7rem' }}></i>
                                    </button>
                                    <button
                                      className="btn btn-sm btn-light border rounded-circle p-0 shadow-sm"
                                      style={{ width: 28, height: 28, lineHeight: 1 }}
                                      disabled={index >= orderedParadas.length - 1 || orderedParadas[index + 1]?.id === 'escuela_virtual'}
                                      onClick={() => moverParada(index, 1)}
                                      title="Bajar parada"
                                    >
                                      <i className="bi bi-chevron-down" style={{ fontSize: '0.7rem' }}></i>
                                    </button>
                                  </div>
                                )}
                                {isActive && (
                                  <div className="d-flex flex-column align-items-center gap-1">
                                    <div className="bus-here-badge">
                                      <span className="live-dot"></span>
                                      🚍 Aquí
                                    </div>
                                    <div style={{ opacity: 0.7 }}>
                                      <BusStopIcon size={22} active={true} />
                                    </div>
                                  </div>
                                )}

                                {vistaActual === 'Operacion' && opActual?.estado === 'En Ruta' && !passed && !isActive && (
                                  <button 
                                    className={`btn-pasamos ${isDestino ? 'btn-llegamos' : ''}`} 
                                    onClick={() => marcarParada(parada.id, index, pids)}
                                    style={isDestino ? { background: 'linear-gradient(135deg, #3b82f6, #2563eb)' } : {}}
                                  >
                                    <i className={`bi ${isDestino ? 'bi-flag-fill' : 'bi-check2-circle'} me-1`}></i>
                                    {isDestino ? 'Llegamos' : 'Pasamos'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL PARADA */}
      {showModalParada && (
        <div className="modal-backdrop-custom show">
          <div className="modal-custom shadow-lg">
            <div className="modal-header border-bottom-0 pb-0">
              <h5 className="modal-title fw-bold text-dark">{paradaForm.id ? 'Editar Parada' : 'Nueva Parada'}</h5>
              <button type="button" className="btn-close" onClick={() => setShowModalParada(false)}></button>
            </div>
            <div className="modal-body">
              <form onSubmit={saveParada}>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Nombre de Parada</label>
                  <input type="text" className="form-control input-moderno" required value={paradaForm.nombre} onChange={e => setParadaForm({...paradaForm, nombre: e.target.value})} placeholder="Ej: Plaza Bolívar" />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold small">Referencia / Descripción</label>
                  <input type="text" className="form-control input-moderno" value={paradaForm.descripcion} onChange={e => setParadaForm({...paradaForm, descripcion: e.target.value})} placeholder="Ej: Frente a la panadería" />
                </div>
                <div className="d-grid">
                  <button type="submit" className="btn btn-primary rounded-pill fw-bold shadow-sm py-2">Guardar Parada</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RUTA */}
      {showModalRuta && (
        <div className="modal-backdrop-custom show">
          <div className="modal-custom shadow-lg" style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header border-bottom-0 pb-0">
              <h5 className="modal-title fw-bold text-dark">{rutaForm.id ? 'Editar Ruta' : 'Diseño de Ruta'}</h5>
              <button type="button" className="btn-close" onClick={() => setShowModalRuta(false)}></button>
            </div>
            <div className="modal-body">
              <div className="row g-3 mb-4">
                <div className="col-12">
                  <label className="form-label fw-semibold small">Nombre de Ruta</label>
                  <input type="text" className="form-control input-moderno fw-bold" value={rutaForm.nombre} onChange={e => setRutaForm({...rutaForm, nombre: e.target.value})} placeholder="Ej: Ruta 1 - Centro" />
                </div>
              </div>

              <div className="card border rounded-4 bg-light mb-4 shadow-sm border-0">
                <div className="card-body p-4">
                  <label className="form-label fw-bold text-primary mb-3"><i className="bi bi-grid-3x3-gap-fill me-2"></i>Paradas Disponibles (Clic para añadir)</label>
                  <div className="d-flex flex-wrap gap-2 mb-4">
                    {paradas.filter(p => !paradasTemporales.find(pt => pt.id === p.id)).map(p => (
                      <button 
                        key={p.id} 
                        className="btn btn-sm btn-outline-secondary rounded-pill border shadow-sm px-3 fw-semibold bg-white"
                        style={{ transition: 'all 0.2s', transform: 'scale(1)' }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        onClick={() => {
                          setParadasTemporales([...paradasTemporales, p]);
                        }}
                      >
                        <i className="bi bi-plus-circle-fill text-success me-1"></i> {p.nombre_parada}
                      </button>
                    ))}
                    {paradas.filter(p => !paradasTemporales.find(pt => pt.id === p.id)).length === 0 && (
                      <span className="text-muted small w-100 text-center d-block py-2">No hay más paradas disponibles.</span>
                    )}
                  </div>

                  <hr className="text-secondary opacity-25 my-4" />
                  
                  <label className="form-label fw-bold text-dark mb-3"><i className="bi bi-geo-alt-fill text-primary me-2"></i>Recorrido Ensamblado</label>
                  <div>
                    {paradasTemporales.length === 0 ? (
                      <div className="text-center text-muted small p-4 bg-white rounded-4 shadow-sm border border-dashed">
                        Haz clic en las paradas arriba para ensamblar tu ruta.
                      </div>
                    ) : (
                      <div className="winding-road-container bg-white rounded-4 shadow-sm border p-3">
                        {(() => {
                          const itemsPerRow = 3; // Modal is narrower, 3 items per row
                          const chunks = [];
                          for (let i = 0; i < paradasTemporales.length; i += itemsPerRow) {
                            chunks.push(paradasTemporales.slice(i, i + itemsPerRow));
                          }
                          
                          return chunks.map((chunk, rowIdx) => {
                            const isReverse = rowIdx % 2 !== 0;
                            const hasNextRow = rowIdx < chunks.length - 1;
                            const hasPrevRow = rowIdx > 0;
                            
                            let rowClasses = `road-row ${isReverse ? 'reverse' : ''}`;
                            if (hasNextRow) rowClasses += (!isReverse) ? ' curve-down-right' : ' curve-down-left';
                            if (hasPrevRow) rowClasses += (!isReverse) ? ' curve-up-left' : ' curve-up-right';

                            return (
                              <div key={`modal-row-${rowIdx}`} className={rowClasses} style={{padding: '20px 0'}}>
                                {hasNextRow && (
                                  <div className={`road-curve ${!isReverse ? 'right' : 'left'}`}></div>
                                )}
                                {chunk.map((p, colIdx) => {
                                  const idx = rowIdx * itemsPerRow + colIdx;
                                  return (
                                    <div key={p.id} className="timeline-node" style={{width: '90px'}}>
                                      <div className="timeline-icon stop" style={{width: '40px', height: '40px', fontSize: '1.2rem'}} title={p.nombre_parada}>
                                        <i className="bi bi-geo-fill"></i>
                                      </div>
                                      <div className="timeline-content py-2 px-2" style={{width: '120px', marginTop: '10px'}}>
                                        <div className="d-flex align-items-center mb-2">
                                          <div className="d-flex flex-column me-2">
                                            <button className="btn btn-sm text-secondary p-0 shadow-none" style={{lineHeight: 0.5}} disabled={idx === 0} onClick={() => moveParadaTemp(idx, -1)}><i className="bi bi-chevron-up fs-6 hover-text-primary"></i></button>
                                            <button className="btn btn-sm text-secondary p-0 mt-2 shadow-none" style={{lineHeight: 0.5}} disabled={idx === paradasTemporales.length - 1} onClick={() => moveParadaTemp(idx, 1)}><i className="bi bi-chevron-down fs-6 hover-text-primary"></i></button>
                                          </div>
                                          <div className="text-start">
                                            <span className="badge bg-primary rounded-pill shadow-sm mb-1">{idx + 1}</span>
                                            <div className="fw-bold text-dark" style={{fontSize: '0.75rem', lineHeight: '1'}}>{p.nombre_parada}</div>
                                          </div>
                                        </div>
                                        <button className="btn btn-sm btn-light border text-danger rounded-circle p-1 shadow-sm" onClick={() => removeParadaTemp(idx)} title="Quitar parada">
                                          <i className="bi bi-trash-fill"></i>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          });
                        })()}
                        <div className="mt-3 text-center w-100 border-top pt-3">
                          <span className="badge bg-success shadow-sm rounded-pill px-3 py-2">
                            <i className="bi bi-building-fill me-1"></i> Escuela (Destino Final)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-light rounded-pill px-4 fw-bold" onClick={() => setShowModalRuta(false)}>Cancelar</button>
                <button className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" onClick={saveRuta}>Guardar Ruta</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal CSS */}
      <style>{`
        .modal-backdrop-custom { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1050; opacity: 0; animation: fadeIn 0.3s forwards; }
        .modal-custom { background: #ffffff; border-radius: 24px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; padding: 10px; transform: scale(0.95); animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .modal-custom::-webkit-scrollbar { width: 6px; }
        .modal-custom::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .input-moderno { border-radius: 12px; border: 1px solid #cbd5e1; padding: 10px 15px; font-size: 0.95rem; transition: all 0.2s; }
        .input-moderno:focus { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        @keyframes fadeIn { to { opacity: 1; } }
        @keyframes zoomIn { to { transform: scale(1); } }
      `}</style>

      {/* MODAL ASIGNACION PERSONAL */}
      {showModalAsignacion && (
        <div className="modal-backdrop-custom show">
          <div className="modal-custom shadow-lg">
            <div className="modal-header border-bottom-0 pb-0">
              <h5 className="modal-title fw-bold text-dark">Asignar Personal a {rutaForm.nombre}</h5>
              <button type="button" className="btn-close" onClick={() => setShowModalAsignacion(false)}></button>
            </div>
            <div className="modal-body">
              <form onSubmit={saveAsignacion}>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Chofer de Unidad</label>
                  <input type="text" className="form-control input-moderno" value={rutaForm.chofer || ''} onChange={e => setRutaForm({...rutaForm, chofer: e.target.value})} placeholder="Nombre completo del chofer" />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold small">Docente Guía (Opcional)</label>
                  <select className="form-select input-moderno" value={rutaForm.docente_id || ''} onChange={e => setRutaForm({...rutaForm, docente_id: e.target.value})}>
                    <option value="">-- Seleccione Docente --</option>
                    {docentes.map(d => <option key={d.id_usuario} value={d.id_usuario}>{d.nombre_completo}</option>)}
                  </select>
                </div>
                <div className="row mb-4">
                  <div className="col-6">
                    <label className="form-label fw-semibold small text-muted">Válida Desde</label>
                    <input type="date" className="form-control input-moderno" value={rutaForm.validez_desde || ''} onChange={e => setRutaForm({...rutaForm, validez_desde: e.target.value})} />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-semibold small text-muted">Válida Hasta</label>
                    <input type="date" className="form-control input-moderno" value={rutaForm.validez_hasta || ''} onChange={e => setRutaForm({...rutaForm, validez_hasta: e.target.value})} />
                  </div>
                </div>
                <div className="d-grid">
                  <button type="submit" className="btn btn-primary rounded-pill fw-bold shadow-sm py-2">Guardar Asignación</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
