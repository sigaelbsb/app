import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { usePermisos } from '../../hooks/usePermisos';
import html2canvas from 'html2canvas';

export const TransporteEscolar = () => {
  const { loading: permLoading, tienePermiso, tieneAccesoEscuela } = usePermisos();
  const Swal = (window as any).Swal;

  const [vistaActual, setVistaActual] = useState<'dashboard' | 'Configuracion' | 'Operacion' | 'Visor'>('dashboard');
  const [configTab, setConfigTab] = useState<'Paradas' | 'Rutas' | 'Asignacion'>('Paradas');
  const [escCodigo, setEscCodigo] = useState(localStorage.getItem('sigae_escuela_codigo') || 'sb');

  const canManageRutas = tienePermiso('Tarjeta: Gestión de Rutas');
  const canManageParadas = tienePermiso('Tarjeta: Gestión de Paradas');
  const canOperateTracking = tienePermiso('Tarjeta: Operación (Tracking)');
  const canViewRecorrido = tienePermiso('Tarjeta: Visor de Recorrido');
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
  const [opRutaId, setOpRutaId] = useState('');
  const [opSentido, setOpSentido] = useState('Casa - Escuela');
  const [opActual, setOpActual] = useState<any>(null);

  useEffect(() => {
    if (canViewTransporte) {
      cargarTodo();
    }
  }, [escCodigo, canViewTransporte]);

  useEffect(() => {
    if ((vistaActual === 'Operacion' || vistaActual === 'Visor') && opRutaId) {
      const hoyStr = new Date().toISOString().split('T')[0];
      const found = trackingHoy.find(t => t.ruta_id === opRutaId && t.sentido === opSentido && t.fecha === hoyStr);
      setOpActual(found || null);
    }
  }, [vistaActual, opRutaId, opSentido, trackingHoy]);

  // Realtime updates para tracking
  useEffect(() => {
    const channel = supabase.channel('tracking_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transporte_operaciones' }, () => {
        if (vistaActual === 'Operacion' || vistaActual === 'Visor') {
          cargarTrackingSolo();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [vistaActual]);

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

  // ---- OPERACIONES EN VIVO ----
  const iniciarRecorrido = async () => {
    const ruta = rutas.find(r => r.id === opRutaId);
    if (!ruta) return;
    
    const pids = getIdsWithEscuela(ruta, opSentido as any);
    
    try {
      const payload = {
        ruta_id: opRutaId, escuela_codigo: escCodigo, sentido: opSentido,
        estado: 'En Ruta', ubicacion_actual: pids.length > 0 ? pids[0] : null
      };
      const { error } = await supabase.from('transporte_operaciones').insert([payload]);
      if (error) throw error;
      cargarTrackingSolo();
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const marcarParada = async (paradaId: string, index: number, orderedIds: string[]) => {
    const isEnd = index === orderedIds.length - 1;
    
    // Obtener la hora actual en formato HH:MM
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const defaultTime = `${currentHours}:${currentMinutes}`;

    Swal.fire({
      title: 'Registrar Paso',
      html: `
        <p class="text-muted small">Confirma la hora exacta en la que la unidad pasó por esta parada.</p>
        <input type="time" id="swal-input-time" class="form-control form-control-lg text-center fw-bold" value="${defaultTime}">
      `,
      showCancelButton: true,
      confirmButtonText: 'Registrar Hora',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
      preConfirm: () => {
        const timeInput = (document.getElementById('swal-input-time') as HTMLInputElement).value;
        if (!timeInput) {
          Swal.showValidationMessage('Debe ingresar una hora');
        }
        return timeInput;
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        try {
          const selectedTime = result.value;
          
          // Clonamos el historial actual o creamos uno nuevo
          const historialAnterior = opActual.historial_paradas || {};
          const nuevoHistorial = { ...historialAnterior, [paradaId]: selectedTime };

          const { error } = await supabase.from('transporte_operaciones').update({
            ubicacion_actual: paradaId, 
            estado: isEnd ? 'Finalizada' : 'En Ruta', 
            ultima_actualizacion: new Date().toISOString(),
            historial_paradas: nuevoHistorial
          }).eq('id', opActual.id);
          
          if (error) {
            // Handle missing column gracefully to guide the user
            if (error.message && error.message.includes('column "historial_paradas"')) {
              throw new Error('La base de datos requiere una actualización. Debes ejecutar el comando SQL provisto para agregar la columna "historial_paradas".');
            }
            throw error;
          }
          cargarTrackingSolo();
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Paso registrado', showConfirmButton: false, timer: 1500 });
        } catch (err: any) {
          Swal.fire({
            icon: 'error',
            title: 'No se pudo registrar',
            text: err.message,
            footer: 'Asegúrate de haber ejecutado el ALTER TABLE en Supabase.'
          });
        }
      }
    });
  };

  const resetMasivo = () => {
    Swal.fire({ title: '¿Resetear TODAS las rutas?', text: `Se borrarán todas las horas marcadas para el día de hoy.`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', confirmButtonText: 'Sí, resetear todo'
    }).then(async (res: any) => {
      if (res.isConfirmed) {
        try {
          const hoyStr = new Date().toISOString().split('T')[0];
          await supabase.from('transporte_operaciones').delete().eq('fecha', hoyStr).eq('escuela_codigo', escCodigo);
          Swal.fire('Listo', 'Reset masivo completado.', 'success');
          cargarTrackingSolo();
        } catch(e:any) { Swal.fire('Error', e.message, 'error'); }
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center gap-3 mb-0">
          <h4 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-bus-front text-primary"></i> Transporte Escolar
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
          <button className="btn btn-outline-secondary rounded-pill px-3 shadow-sm fw-bold" onClick={() => setVistaActual('dashboard')}>
            <i className="bi bi-arrow-left me-1"></i> Volver al Dashboard
          </button>
        )}
      </div>

      <style>{`
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

        /* Winding Road Style */
        .winding-road-container {
          display: flex; flex-direction: column; align-items: center; 
          padding: 30px 10px; position: relative; width: 100%; overflow: hidden;
        }
        .road-row {
          display: flex; width: 100%; max-width: 900px; justify-content: space-around; 
          position: relative; padding: 20px 0 130px 0; align-items: flex-start;
        }
        .road-row.reverse { flex-direction: row-reverse; }
        
        /* The Asphalt */
        .road-row::before {
          content: ''; position: absolute; top: 45px; left: 10%; right: 10%; height: 26px; 
          background: #334155; transform: translateY(-50%); z-index: 1;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        /* The Dashed Line */
        .road-row::after {
          content: ''; position: absolute; top: 45px; left: 10%; right: 10%; height: 2px; 
          background: repeating-linear-gradient(90deg, transparent, transparent 15px, #f8fafc 15px, #f8fafc 30px); 
          transform: translateY(-50%); z-index: 2;
        }

        /* Connectors between rows */
        .road-row:not(:last-child)::before {
          border-radius: 0 30px 30px 0;
        }
        .road-row:nth-child(odd):not(:last-child)::before {
          right: 0; left: 10%; width: 90%;
        }
        .road-row:nth-child(even):not(:last-child)::before {
          left: 0; right: 10%; width: 90%; border-radius: 30px 0 0 30px;
        }

        /* Connecting vertical asphalt curves */
        .road-curve {
          position: absolute; width: 70px; top: 45px; height: 100%; 
          border: 26px solid #334155; z-index: 0;
        }
        .road-curve.right { right: 0; border-left: none; border-radius: 0 60px 60px 0; }
        .road-curve.left { left: 0; border-right: none; border-radius: 60px 0 0 60px; }

        .timeline-node { position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; width: 140px; height: 50px; }
        .timeline-icon { 
          width: 50px; height: 50px; border-radius: 50%; background: white; 
          border: 4px solid #cbd5e1; display: flex; align-items: center; justify-content: center; 
          box-shadow: 0 8px 15px rgba(0,0,0,0.2); font-size: 1.5rem;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: absolute; top: 20px; z-index: 20;
        }
        
        /* Map Pin effect */
        .timeline-icon::after {
          content: ''; position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%);
          border-width: 12px 10px 0; border-style: solid; border-color: inherit;
          border-bottom-color: transparent !important; border-left-color: transparent !important; border-right-color: transparent !important;
        }
        
        .timeline-icon:hover { transform: translateY(-5px) scale(1.1); cursor: pointer; }
        
        .timeline-icon.start { border-color: #f59e0b; color: #f59e0b; }
        .timeline-icon.active { border-color: #10b981; color: #10b981; background: #ecfdf5; transform: scale(1.2); z-index: 25; }
        .timeline-icon.active::after { border-top-color: #10b981 !important; }
        
        .timeline-icon.passed { border-color: #3b82f6; color: white; background: #3b82f6; }
        .timeline-icon.passed::after { border-top-color: #3b82f6 !important; }
        
        .timeline-icon.end { border-color: #ef4444; color: #ef4444; }

        .timeline-content { 
          position: absolute; top: 85px; z-index: 15;
          background: rgba(255,255,255,0.95); padding: 12px; border-radius: 12px; 
          border: 1px solid #e2e8f0; text-align: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.08); font-size: 0.85rem; line-height: 1.3; width: 150px;
          display: flex; flex-direction: column; align-items: center;
        }
        .timeline-content.active { border-color: #10b981; border-width: 2px; font-weight: bold; transform: scale(1.05); }
        .timeline-content.passed { opacity: 0.85; background: #f8fafc; }
        
        .pulse-animation { animation: pulse-pin 1.5s infinite; }
        @keyframes pulse-pin {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6), 0 8px 15px rgba(0,0,0,0.2); }
          70% { box-shadow: 0 0 0 20px rgba(16, 185, 129, 0), 0 8px 15px rgba(0,0,0,0.2); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0), 0 8px 15px rgba(0,0,0,0.2); }
        }

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
          {(canManageParadas || canManageRutas) && (
            <div className="col-md-6 animate__animated animate__fadeInUp">
              <div className={`tarjeta-sub p-4 h-100 shadow-sm`} style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fff5f2 100%)', border: '1px solid #ffdac2' }} 
                onClick={() => {
                  setConfigTab(canManageParadas ? 'Paradas' : 'Rutas');
                  setVistaActual('Configuracion');
                }}
              >
                <i className="bi bi-gear-fill text-dark bg-icono-gigante"></i>
                <div className="icono-sub shadow-sm" style={{ color: '#f97316', background: 'white', border: '1px solid #ffdac2' }}><i className="bi bi-gear-fill"></i></div>
                <h5 className="fw-bold text-dark mb-2" style={{ zIndex: 2 }}>Configuración de Transporte</h5>
                <p className="small text-muted mb-0" style={{ zIndex: 2 }}>Gestionar paradas, rutas y asignar personal (Chofer / Guía).</p>
              </div>
            </div>
          )}
          
          <div className="col-md-6 col-xl-3 animate__animated animate__fadeInUp" style={{ animationDelay: '0.2s' }}>
            <div className={`tarjeta-sub p-4 h-100 shadow-sm ${!canOperateTracking ? 'bloqueado' : ''}`} style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)', border: '1px solid #ddd6fe' }} onClick={() => canOperateTracking && setVistaActual('Operacion')}>
              <i className="bi bi-broadcast text-dark bg-icono-gigante"></i>
              <div className="icono-sub shadow-sm" style={{ color: '#6d28d9', background: 'white', border: '1px solid #ddd6fe' }}><i className="bi bi-broadcast"></i></div>
              <h5 className="fw-bold text-dark mb-2" style={{ zIndex: 2 }}>Operación de Ruta</h5>
              <p className="small text-muted mb-0" style={{ zIndex: 2 }}>Marcar avance en tiempo real.</p>
            </div>
          </div>
          
          <div className="col-md-6 col-xl-3 animate__animated animate__fadeInUp" style={{ animationDelay: '0.3s' }}>
            <div className={`tarjeta-sub p-4 h-100 shadow-sm ${!canViewRecorrido ? 'bloqueado' : ''}`} style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', border: '1px solid #bbf7d0' }} onClick={() => canViewRecorrido && setVistaActual('Visor')}>
              <i className="bi bi-eye-fill text-dark bg-icono-gigante"></i>
              <div className="icono-sub shadow-sm" style={{ color: '#198754', background: 'white', border: '1px solid #bbf7d0' }}><i className="bi bi-eye-fill"></i></div>
              <h5 className="fw-bold text-dark mb-2" style={{ zIndex: 2 }}>Visor de Recorrido</h5>
              <p className="small text-muted mb-0" style={{ zIndex: 2 }}>Seguimiento para representantes.</p>
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
                        <tr><td colSpan={3} className="text-center py-4 text-muted">No hay paradas registradas en el catálogo.</td></tr>
                      ) : paradas.map((p) => (
                        <tr key={p.id}>
                          <td className="fw-bold text-dark px-3"><i className="bi bi-geo-alt-fill text-info me-2"></i>{p.nombre_parada}</td>
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
                        <tr><td colSpan={3} className="text-center py-4 text-muted">No hay rutas diseñadas.</td></tr>
                      ) : rutas.map((r) => {
                        let len = 0;
                        if (Array.isArray(r.paradas_json)) len = r.paradas_json.length;
                        else if (typeof r.paradas_json === 'string') { try { len = JSON.parse(r.paradas_json).length; } catch(e){} }
                        
                        return (
                          <tr key={r.id}>
                            <td className="fw-bold text-primary px-3">{r.nombre}</td>
                            <td className="text-center"><span className="badge bg-success rounded-pill px-2 py-1">{len} paradas</span></td>
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
                <div className="d-flex gap-2">
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
                  
                  const pids = getIdsWithEscuela(rutaObj, opSentido as any);
                  const orderedParadas = getParadasWithEscuela(pids);

                  if (orderedParadas.length === 0) return <div className="text-center py-4">Esta ruta no tiene paradas.</div>;

                  return (
                    <div>
                      <div className="d-flex justify-content-between mb-3">
                        {vistaActual === 'Operacion' && !opActual && (
                          <button className="btn btn-warning rounded-pill px-4 fw-bold shadow-sm" onClick={iniciarRecorrido}>
                            <i className="bi bi-play-circle me-2"></i>Iniciar Recorrido
                          </button>
                        )}
                      </div>

                      {opActual && (
                        <div className={`alert ${opActual.estado === 'Finalizada' ? 'alert-success' : 'alert-primary'} rounded-4 border-0 shadow-sm mb-4 d-flex align-items-center`}>
                          <div className="fs-1 me-3">
                            {opActual.estado === 'Finalizada' ? <i className="bi bi-check-circle-fill"></i> : <i className="bi bi-bus-front-fill"></i>}
                          </div>
                          <div>
                            <h6 className="fw-bold mb-1">Estado: {opActual.estado}</h6>
                            <div className="small opacity-75">Última actualización: {new Date(opActual.ultima_actualizacion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                          </div>
                        </div>
                      )}

                      <div className={`winding-road-container ${opActual?.estado === 'Finalizada' ? 'finalizada' : ''}`}>
                        {(() => {
                          const itemsPerRow = 4;
                          const chunks = [];
                          for (let i = 0; i < orderedParadas.length; i += itemsPerRow) {
                            chunks.push(orderedParadas.slice(i, i + itemsPerRow));
                          }
                          
                          return chunks.map((chunk, rowIdx) => {
                            const isReverse = rowIdx % 2 !== 0;
                            const hasNextRow = rowIdx < chunks.length - 1;
                            const hasPrevRow = rowIdx > 0;
                            
                            let rowClasses = `road-row ${isReverse ? 'reverse' : ''}`;
                            if (hasNextRow) rowClasses += (!isReverse) ? ' curve-down-right' : ' curve-down-left';
                            if (hasPrevRow) rowClasses += (!isReverse) ? ' curve-up-left' : ' curve-up-right';

                            return (
                              <div key={`row-${rowIdx}`} className={rowClasses}>
                                {hasNextRow && (
                                  <div className={`road-curve ${!isReverse ? 'right' : 'left'}`}></div>
                                )}
                                {chunk.map((parada: any, colIdx: number) => {
                                  const index = rowIdx * itemsPerRow + colIdx;
                                  const isStart = index === 0;
                                  const isEnd = index === orderedParadas.length - 1;
                                  let iconClass = isStart ? 'start' : isEnd ? 'end' : 'stop';
                                  let passed = false;
                                  let isActive = false;

                                  if (opActual) {
                                    const currentIdx = pids.findIndex((id: string) => id === opActual.ubicacion_actual);
                                    if (index < currentIdx) {
                                      passed = true;
                                      iconClass = 'passed';
                                    } else if (index === currentIdx && opActual.estado !== 'Finalizada') {
                                      isActive = true;
                                      iconClass = 'active pulse-animation';
                                    } else if (opActual.estado === 'Finalizada') {
                                      passed = true;
                                      iconClass = 'passed';
                                    }
                                  }

                                  return (
                                    <div key={`${parada.id}-${index}`} className="timeline-node">
                                      <div className={`timeline-icon ${iconClass}`} title={parada.nombre_parada}>
                                        {isActive ? <i className="bi bi-bus-front"></i> : isEnd ? <i className="bi bi-flag"></i> : passed ? <i className="bi bi-check"></i> : <i className="bi bi-geo"></i>}
                                      </div>
                                      <div className={`timeline-content ${isActive ? 'active' : passed ? 'passed' : ''}`}>
                                        <div className="fw-bold text-dark">{parada.nombre_parada}</div>
                                        
                                        {vistaActual === 'Operacion' && opActual?.estado === 'En Ruta' && !passed && !isActive && (
                                          <button 
                                            className="btn btn-sm btn-success rounded-pill fw-bold mt-2 py-1 px-3 shadow-sm w-100" 
                                            onClick={() => marcarParada(parada.id, index, pids)}
                                            style={{fontSize: '0.75rem'}}
                                          >
                                            ¡Pasamos!
                                          </button>
                                        )}
                                        
                                        {isActive && (
                                          <div className="badge bg-success shadow-sm rounded-pill mt-2 w-100">
                                            <span className="spinner-grow spinner-grow-sm me-1" style={{width: '8px', height: '8px'}}></span>
                                            El bus está aquí
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          });
                        })()}
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
