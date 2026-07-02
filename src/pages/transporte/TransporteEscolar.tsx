import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabase';
import { usePermisos } from '../../hooks/usePermisos';
import html2canvas from 'html2canvas';

export const TransporteEscolar = () => {
  const { loading: permLoading, tienePermiso } = usePermisos();
  const escCodigo = localStorage.getItem('sigae_escuela_codigo') || 'sb';
  const Swal = (window as any).Swal;

  const [vistaActual, setVistaActual] = useState<'dashboard' | 'Paradas' | 'Rutas' | 'Operacion' | 'Visor'>('dashboard');

  const canManageRutas = tienePermiso('Gestión de Rutas');
  const canManageParadas = tienePermiso('Gestión de Paradas');
  const canOperateTracking = tienePermiso('Operación (Tracking)');
  const canViewRecorrido = tienePermiso('Visor de Recorrido');
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
  const [paradaSelectId, setParadaSelectId] = useState('');

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
        supabase.from('profiles').select('id, cedula, nombre, apellidos, rol, cargo, telefono').eq('escuela_codigo', escCodigo),
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
    if (!rutaForm.nombre || !rutaForm.chofer || !rutaForm.validez_desde || !rutaForm.validez_hasta) {
      return Swal.fire('Atención', 'Complete todos los campos de la ruta', 'warning');
    }
    if (paradasTemporales.length === 0) {
      return Swal.fire('Atención', 'Añada al menos una parada al recorrido.', 'warning');
    }

    try {
      const payload = {
        escuela_codigo: escCodigo,
        nombre: rutaForm.nombre,
        chofer_nombre: rutaForm.chofer,
        docente_id: rutaForm.docente_id || null,
        validez_desde: rutaForm.validez_desde,
        validez_hasta: rutaForm.validez_hasta,
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
  const addParadaTemporal = () => {
    if (!paradaSelectId) return;
    const p = paradas.find(x => x.id === paradaSelectId);
    if (p) {
      setParadasTemporales([...paradasTemporales, p]);
      setParadaSelectId('');
    }
  };
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
      let ids = [];
      if (Array.isArray(ruta.paradas_json)) ids = ruta.paradas_json;
      else if (typeof ruta.paradas_json === 'string') { try { ids = JSON.parse(ruta.paradas_json); } catch (e) {} }

      const doc = docentes.find(d => d.id === ruta.docente_id);
      const nombreDoc = doc ? `${doc.nombre} ${doc.apellidos || ''}` : 'Sin asignar';
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

      ids.forEach((pid: string, idx: number) => {
        const p = paradas.find(x => x.id === pid);
        if(p) {
          htmlImagen += `<li style="margin-bottom:8px;"><b>${idx+1}.</b> ${p.nombre_parada} <span style="color:#64748b; font-size:13px;">(${p.descripcion||'Sin referencia'})</span></li>`;
          textoMensaje += `  ${idx+1}. ${p.nombre_parada}\n`;
        }
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
    let ids = [];
    if (Array.isArray(ruta.paradas_json)) ids = ruta.paradas_json;
    else if (typeof ruta.paradas_json === 'string') { try { ids = JSON.parse(ruta.paradas_json); } catch (e) {} }
    
    if (opSentido === 'Escuela - Casa') ids.reverse();
    
    try {
      const payload = {
        ruta_id: opRutaId, escuela_codigo: escCodigo, sentido: opSentido,
        estado: 'En Ruta', ubicacion_actual: ids.length > 0 ? ids[0] : null
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
    try {
      const { error } = await supabase.from('transporte_operaciones').update({
        ubicacion_actual: paradaId, estado: isEnd ? 'Finalizada' : 'En Ruta', ultima_actualizacion: new Date().toISOString()
      }).eq('id', opActual.id);
      if (error) throw error;
      cargarTrackingSolo();
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
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
        <h4 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
          <i className="bi bi-bus-front text-primary"></i> Transporte Escolar
        </h4>
        {vistaActual !== 'dashboard' && (
          <button className="btn btn-outline-secondary rounded-pill px-3 shadow-sm fw-bold" onClick={() => setVistaActual('dashboard')}>
            <i className="bi bi-arrow-left me-1"></i> Volver al Dashboard
          </button>
        )}
      </div>

      <style>{`
        .tarjeta-sub { background: #ffffff; border-radius: 20px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; overflow: hidden; position: relative; display: flex; flex-direction: column; text-align: left; }
        .tarjeta-sub:hover { transform: translateY(-8px); box-shadow: 0 15px 35px rgba(0,0,0,0.1) !important; }
        .tarjeta-sub .bg-icono-gigante { position: absolute; right: -20px; bottom: -20px; font-size: 8rem; opacity: 0.03; transition: transform 0.5s ease; pointer-events: none; }
        .tarjeta-sub:hover .bg-icono-gigante { transform: scale(1.2) rotate(-10deg); }
        .tarjeta-sub .icono-sub { width: 60px; height: 60px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin-bottom: 1.2rem; transition: transform 0.3s ease; }
        .tarjeta-sub:hover .icono-sub { transform: scale(1.1); }
        .tarjeta-sub.bloqueado { filter: grayscale(100%); opacity: 0.7; cursor: not-allowed; }
        .timeline-rutograma { border-left: 4px solid #0dcaf0; margin-left: 20px; padding-left: 25px; position: relative; margin-top: 10px; padding-bottom: 5px; }
        .timeline-rutograma.finalizada { border-left-color: #198754; }
        .timeline-node { position: relative; margin-bottom: 15px; }
        .timeline-icon { position: absolute; left: -45px; top: 50%; transform: translateY(-50%); width: 36px; height: 36px; border-radius: 50%; background: white; border: 4px solid #0dcaf0; display: flex; align-items: center; justify-content: center; z-index: 2; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 1.1rem; }
        .timeline-icon.start { border-color: #f97316; color: #f97316; }
        .timeline-icon.active { border-color: #198754; color: #198754; animation: pulse-border 1.5s infinite; background: #d1e7dd; }
        .timeline-icon.passed { border-color: #198754; color: #198754; }
        .timeline-icon.end { border-color: #dc3545; color: #dc3545; }
        .timeline-content { background: #f8fafc; padding: 12px 18px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; }
        .timeline-content:hover { background: white; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .timeline-content.active { border-color: #198754; background: #f8fff9; }
        @keyframes pulse-border { 0% { box-shadow: 0 0 0 0 rgba(25, 135, 84, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(25, 135, 84, 0); } 100% { box-shadow: 0 0 0 0 rgba(25, 135, 84, 0); } }
      `}</style>

      {/* DASHBOARD PRINCIPAL */}
      {vistaActual === 'dashboard' && (
        <div className="row g-4">
          <div className="col-md-6 col-xl-3 animate__animated animate__fadeInUp">
            <div className={`tarjeta-sub p-4 h-100 shadow-sm ${!canManageParadas ? 'bloqueado' : ''}`} style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fff5f2 100%)', border: '1px solid #ffdac2' }} onClick={() => canManageParadas && setVistaActual('Paradas')}>
              <i className="bi bi-geo-alt-fill text-dark bg-icono-gigante"></i>
              <div className="icono-sub shadow-sm" style={{ color: '#f97316', background: 'white', border: '1px solid #ffdac2' }}><i className="bi bi-geo-alt-fill"></i></div>
              <h5 className="fw-bold text-dark mb-2" style={{ zIndex: 2 }}>Paradas de Control</h5>
              <p className="small text-muted mb-0" style={{ zIndex: 2 }}>Crear puntos de recogida (Catálogo).</p>
            </div>
          </div>
          
          <div className="col-md-6 col-xl-3 animate__animated animate__fadeInUp" style={{ animationDelay: '0.1s' }}>
            <div className={`tarjeta-sub p-4 h-100 shadow-sm ${!canManageRutas ? 'bloqueado' : ''}`} style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)', border: '1px solid #fde68a' }} onClick={() => canManageRutas && setVistaActual('Rutas')}>
              <i className="bi bi-sign-turn-right-fill text-dark bg-icono-gigante"></i>
              <div className="icono-sub shadow-sm" style={{ color: '#d97706', background: 'white', border: '1px solid #fde68a' }}><i className="bi bi-sign-turn-right-fill"></i></div>
              <h5 className="fw-bold text-dark mb-2" style={{ zIndex: 2 }}>Diseño de Rutas</h5>
              <p className="small text-muted mb-0" style={{ zIndex: 2 }}>Armar secuencias y choferes.</p>
            </div>
          </div>
          
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

      {/* VISTA: PARADAS */}
      {vistaActual === 'Paradas' && (
        <div className="card shadow-sm border-0 rounded-4 animate__animated animate__fadeInRight">
          <div className="card-body p-4 p-md-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold text-dark mb-0">Catálogo Global de Paradas</h5>
              <button className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm" onClick={() => { setParadaForm({ id: '', nombre: '', descripcion: '' }); setShowModalParada(true); }}>
                <i className="bi bi-plus-lg me-1"></i> Nueva Parada
              </button>
            </div>
            
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Nombre de Parada</th>
                    <th>Referencia</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paradas.length === 0 ? (
                    <tr><td colSpan={3} className="text-center py-4 text-muted">No hay paradas registradas en el catálogo.</td></tr>
                  ) : paradas.map((p) => (
                    <tr key={p.id}>
                      <td className="fw-bold text-dark"><i className="bi bi-geo-alt-fill text-info me-2"></i>{p.nombre_parada}</td>
                      <td className="text-muted small">{p.descripcion || 'Sin referencia'}</td>
                      <td className="text-end text-nowrap">
                        <button className="btn btn-sm btn-light border text-primary me-1 shadow-sm" onClick={() => { setParadaForm({ id: p.id, nombre: p.nombre_parada, descripcion: p.descripcion || '' }); setShowModalParada(true); }}><i className="bi bi-pencil-fill"></i></button>
                        <button className="btn btn-sm btn-light border text-danger shadow-sm" onClick={() => deleteParada(p.id)}><i className="bi bi-trash-fill"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VISTA: RUTAS */}
      {vistaActual === 'Rutas' && (
        <div className="card shadow-sm border-0 rounded-4 animate__animated animate__fadeInRight">
          <div className="card-body p-4 p-md-5">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <h5 className="fw-bold text-dark mb-0"><i className="bi bi-signpost-split-fill text-success me-2"></i>Rutas Activas</h5>
              <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" onClick={() => { setRutaForm({ id: '', nombre: '', chofer: '', docente_id: '', validez_desde: '', validez_hasta: '' }); setParadasTemporales([]); setShowModalRuta(true); }}>
                  <i className="bi bi-plus-circle me-1"></i> Nueva Ruta
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Ruta</th>
                    <th>Personal Asignado</th>
                    <th className="text-center">Paradas</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rutas.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-4 text-muted">No hay rutas.</td></tr>
                  ) : rutas.map((r) => {
                    const doc = docentes.find(d => d.id === r.docente_id);
                    let len = 0;
                    if (Array.isArray(r.paradas_json)) len = r.paradas_json.length;
                    else if (typeof r.paradas_json === 'string') { try { len = JSON.parse(r.paradas_json).length; } catch(e){} }
                    
                    return (
                      <tr key={r.id}>
                        <td className="fw-bold text-primary">{r.nombre}</td>
                        <td className="small">
                          <div className="text-muted"><i className="bi bi-person-vcard me-1"></i>Chofer: <span className="fw-bold text-dark">{r.chofer_nombre}</span></div>
                          <div><i className="bi bi-person-video3 me-1"></i>Guía: <span className="fw-bold text-dark">{doc ? `${doc.nombre} ${doc.apellidos || ''}` : 'N/A'}</span></div>
                        </td>
                        <td className="text-center"><span className="badge bg-success rounded-pill px-2 py-1">{len}</span></td>
                        <td className="text-end text-nowrap">
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
              <div>
                {/* Renderizar Rutograma */}
                {(() => {
                  const rutaObj = rutas.find(r => r.id === opRutaId);
                  if (!rutaObj) return null;
                  let pids = [];
                  if (Array.isArray(rutaObj.paradas_json)) pids = rutaObj.paradas_json;
                  else if (typeof rutaObj.paradas_json === 'string') { try { pids = JSON.parse(rutaObj.paradas_json); } catch(e){} }
                  
                  if (opSentido === 'Escuela - Casa') pids.reverse();
                  
                  const orderedParadas = pids.map((pid: string) => paradas.find(p => p.id === pid)).filter(Boolean);

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

                      <div className={`timeline-rutograma ${opActual?.estado === 'Finalizada' ? 'finalizada' : ''}`}>
                        {orderedParadas.map((parada: any, index: number) => {
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
                              iconClass = 'active';
                            } else if (opActual.estado === 'Finalizada') {
                              passed = true;
                              iconClass = 'passed';
                            }
                          }

                          return (
                            <div key={`${parada.id}-${index}`} className="timeline-node">
                              <div className={`timeline-icon ${iconClass}`}>
                                {isActive ? <i className="bi bi-bus-front"></i> : isEnd ? <i className="bi bi-flag"></i> : passed ? <i className="bi bi-check"></i> : <i className="bi bi-geo"></i>}
                              </div>
                              <div className={`timeline-content ${isActive ? 'active shadow-sm' : ''}`}>
                                <div>
                                  <h6 className="fw-bold mb-1 text-dark">{parada.nombre_parada}</h6>
                                  {parada.descripcion && <p className="small text-muted mb-0">{parada.descripcion}</p>}
                                </div>
                                
                                {vistaActual === 'Operacion' && opActual?.estado === 'En Ruta' && !passed && !isActive && (
                                  <button 
                                    className="btn btn-sm btn-outline-success rounded-pill fw-bold" 
                                    onClick={() => marcarParada(parada.id, index, pids)}
                                  >
                                    Pasar por aquí
                                  </button>
                                )}
                                
                                {isActive && (
                                  <span className="badge bg-success shadow-sm rounded-pill px-3 py-2">
                                    <span className="spinner-grow spinner-grow-sm me-2" role="status" style={{width: '10px', height: '10px'}}></span>
                                    Unidad aquí
                                  </span>
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
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">Nombre de Ruta</label>
                  <input type="text" className="form-control input-moderno fw-bold" value={rutaForm.nombre} onChange={e => setRutaForm({...rutaForm, nombre: e.target.value})} placeholder="Ej: Ruta 1 - Centro" />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold small">Chofer de Unidad</label>
                  <input type="text" className="form-control input-moderno" value={rutaForm.chofer} onChange={e => setRutaForm({...rutaForm, chofer: e.target.value})} placeholder="Nombre del chofer" />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">Docente Guía (Opcional)</label>
                  <select className="form-select input-moderno" value={rutaForm.docente_id} onChange={e => setRutaForm({...rutaForm, docente_id: e.target.value})}>
                    <option value="">-- Sin Asignar --</option>
                    {docentes.map(d => <option key={d.id} value={d.id}>{d.nombre} {d.apellidos || ''}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">Válida Desde</label>
                  <input type="date" className="form-control input-moderno" value={rutaForm.validez_desde} onChange={e => setRutaForm({...rutaForm, validez_desde: e.target.value})} />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold small">Válida Hasta</label>
                  <input type="date" className="form-control input-moderno" value={rutaForm.validez_hasta} onChange={e => setRutaForm({...rutaForm, validez_hasta: e.target.value})} />
                </div>
              </div>

              <div className="card border rounded-4 bg-light mb-4">
                <div className="card-body">
                  <label className="form-label fw-semibold text-primary"><i className="bi bi-geo-alt-fill me-1"></i>Añadir Paradas al Recorrido</label>
                  <div className="input-group">
                    <select className="form-select border-primary" value={paradaSelectId} onChange={e => setParadaSelectId(e.target.value)}>
                      <option value="">-- Seleccione parada del catálogo --</option>
                      {paradas.filter(p => !paradasTemporales.find(pt => pt.id === p.id)).map(p => <option key={p.id} value={p.id}>{p.nombre_parada}</option>)}
                    </select>
                    <button className="btn btn-primary fw-bold" onClick={addParadaTemporal}>Agregar</button>
                  </div>

                  <div className="mt-4">
                    {paradasTemporales.length === 0 ? (
                      <div className="text-center text-muted small p-3 bg-white rounded shadow-sm">Añada paradas en la parte superior.</div>
                    ) : (
                      <div className="timeline-rutograma bg-white p-3 rounded shadow-sm mt-3 border">
                        <div className="timeline-node">
                          <div className="timeline-icon start"><i className="bi bi-bus-front-fill"></i></div>
                          <div className="timeline-content border-warning border-2"><span className="fw-bold text-dark mb-0">Inicio</span></div>
                        </div>
                        {paradasTemporales.map((p, idx) => (
                          <div key={p.id} className="timeline-node">
                            <div className="timeline-icon stop"><i className="bi bi-signpost-fill"></i></div>
                            <div className="timeline-content">
                              <div className="d-flex align-items-center">
                                <div className="d-flex flex-column me-2">
                                  <button className="btn btn-sm text-secondary p-0" style={{lineHeight: 0.5}} disabled={idx === 0} onClick={() => moveParadaTemp(idx, -1)}><i className="bi bi-caret-up-fill fs-5"></i></button>
                                  <button className="btn btn-sm text-secondary p-0 mt-1" style={{lineHeight: 0.5}} disabled={idx === paradasTemporales.length - 1} onClick={() => moveParadaTemp(idx, 1)}><i className="bi bi-caret-down-fill fs-5"></i></button>
                                </div>
                                <div><span className="badge bg-primary text-white me-2">{idx + 1}</span><span className="fw-bold">{p.nombre_parada}</span></div>
                              </div>
                              <button className="btn btn-sm text-danger p-0 ms-2" onClick={() => removeParadaTemp(idx)}><i className="bi bi-x-circle-fill fs-5"></i></button>
                            </div>
                          </div>
                        ))}
                        <div className="timeline-node">
                          <div className="timeline-icon end"><i className="bi bi-building-fill"></i></div>
                          <div className="timeline-content border-success border-2"><span className="fw-bold text-success mb-0">Escuela</span></div>
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

    </div>
  );
};
