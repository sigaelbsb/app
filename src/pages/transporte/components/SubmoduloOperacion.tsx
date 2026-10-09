import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';

interface SubmoduloOperacionProps {
  onBack?: () => void;
  opRutaId: string;
  setOpRutaId: (id: string) => void;
  opSentido: string;
  setOpSentido: (sentido: string) => void;
  rutas: any[];
  opActual: any;
  estudiantes: any[];
  customPids: string[] | null;
  setCustomPids: (pids: string[] | null) => void;
  iniciarRecorrido: () => void;
  marcarParada: (paradaId: string, index: number, orderedIds: string[]) => void;
  resetRutaActual: () => void;
  getIdsWithEscuela: (ruta: any, sentido: 'Casa - Escuela' | 'Escuela - Casa') => string[];
  getParadasWithEscuela: (pids: string[]) => any[];
  BusProgressBar: React.ComponentType<{ total: number; current: number; finalizada: boolean }>;
  AnimatedBusSVG: React.ComponentType<{ size?: number; className?: string }>;
  BusStopIcon: React.ComponentType<{ size?: number; active?: boolean }>;
  user: any;
  docentes: any[];
  cargarTrackingSolo: () => Promise<void>;
  offlineMode?: boolean;
  escCodigo?: 'sb' | 'lb';
}

export const SubmoduloOperacion: React.FC<SubmoduloOperacionProps> = ({
  onBack,
  opRutaId,
  setOpRutaId,
  opSentido,
  setOpSentido,
  rutas,
  opActual,
  estudiantes,
  customPids,
  setCustomPids,
  iniciarRecorrido,
  marcarParada,
  resetRutaActual,
  getIdsWithEscuela,
  getParadasWithEscuela,
  BusProgressBar,
  AnimatedBusSVG,
  BusStopIcon,
  user,
  docentes,
  cargarTrackingSolo,
  offlineMode,
  escCodigo = 'sb'
}) => {
  const Swal = (window as any).Swal;
  const hoyStr = new Date().toISOString().split('T')[0];

  // Pestañas operativas
  const [tabOperativa, setTabOperativa] = useState<'recorrido' | 'pasajeros' | 'novedades'>('recorrido');

  // Estado para el modal de desvío / cambio en caliente de paradas
  const [showModalEnCaliente, setShowModalEnCaliente] = useState(false);
  const [desvioTexto, setDesvioTexto] = useState('');

  // Formulario de Reporte de Novedad
  const [textoNovedad, setTextoNovedad] = useState('');
  const [tipoNovedad, setTipoNovedad] = useState<'tranca' | 'mecanica' | 'estudiante' | 'clima' | 'otra'>('tranca');
  const [guardandoNovedad, setGuardandoNovedad] = useState(false);

  // Filtro de búsqueda en la lista de pasajeros
  const [busquedaPasajero, setBusquedaPasajero] = useState('');

  const rutaObj = rutas.find(r => r.id === opRutaId);
  const originalPids = rutaObj ? getIdsWithEscuela(rutaObj, opSentido as any) : [];
  const pids = customPids ?? (opActual?.historial_paradas?._custom_order ?? originalPids);
  const orderedParadas = getParadasWithEscuela(pids);

  // Identificar docente de guardia asignado a la ruta
  const docenteAsignado = docentes.find(d => d.id_usuario === rutaObj?.docente_id);

  // Registro de Asistencia guardado en la operación de hoy
  const asistenciaActual: Record<string, 'presente' | 'ausente'> = opActual?.historial_paradas?._asistencia || {};

  // Novedades reportadas guardadas en la operación de hoy
  const novedadesHoy: any[] = opActual?.historial_paradas?._novedades || [];

  // =========================================================================
  // CLASIFICACIÓN DE PASAJEROS: REGULARES, 🟢 INCLUIDOS Y 🔴 EXCLUIDOS
  // =========================================================================
  const { pasajerosRegulares, pasajerosIncluidos, pasajerosExcluidos } = (() => {
    if (!rutaObj) return { pasajerosRegulares: [], pasajerosIncluidos: [], pasajerosExcluidos: [] };

    const rutaNombre = String(rutaObj.nombre || '').trim().toLowerCase();
    const esIda = opSentido === 'Casa - Escuela';

    const regulares: any[] = [];
    const incluidos: any[] = [];
    const excluidos: any[] = [];

    (estudiantes || []).forEach(est => {
      const d = est.datos_actualizados || {};
      const estRuta = String(d.ruta_transporte || '').trim().toLowerCase();
      const cambios: any[] = Array.isArray(d.cambios_transporte_temporales) ? d.cambios_transporte_temporales : [];

      // Buscar cambio temporal activo hoy
      const cambioActivo = cambios.find((c: any) => {
        if (!c.activo) return false;
        if (hoyStr < c.fecha_inicio || hoyStr > c.fecha_fin) return false;
        // Evaluar si aplica al sentido de hoy
        if (c.tipo === 'ida_temporal' && !esIda) return false;
        if (c.tipo === 'retorno_temporal' && esIda) return false;
        return true;
      });

      const esDeEstaRuta = estRuta === rutaNombre || estRuta === String(rutaObj.id).toLowerCase();

      if (cambioActivo) {
        const destRuta = String(cambioActivo.ruta_destino || '').trim().toLowerCase();
        const origRuta = String(cambioActivo.ruta_origen || '').trim().toLowerCase();

        // CASO 1: Está incluido temporalmente en esta ruta hoy (procedente de otra ruta)
        if (destRuta === rutaNombre || destRuta === String(rutaObj.id).toLowerCase()) {
          incluidos.push({
            ...est,
            _tipoPasajero: 'incluido_temporal',
            _cambioInfo: cambioActivo
          });
          return;
        }

        // CASO 2: Normalmente es de esta ruta pero hoy va para otra ruta -> EXCLUIDO EN ROJO
        if (esDeEstaRuta && destRuta !== rutaNombre) {
          excluidos.push({
            ...est,
            _tipoPasajero: 'excluido_temporal',
            _cambioInfo: cambioActivo
          });
          return;
        }
      }

      // CASO 3: Pasajero regular que viaja en su ruta normal hoy
      if (esDeEstaRuta) {
        regulares.push({
          ...est,
          _tipoPasajero: 'regular'
        });
      }
    });

    return { pasajerosRegulares: regulares, pasajerosIncluidos: incluidos, pasajerosExcluidos: excluidos };
  })();

  // Lista consolidada de pasajeros a bordo (regulares + incluidos)
  const todosPasajerosABordo = [...pasajerosIncluidos, ...pasajerosRegulares];
  const todosParaListado = [...pasajerosIncluidos, ...pasajerosRegulares, ...pasajerosExcluidos];

  const pasajerosFiltrados = todosParaListado.filter(p => {
    if (!busquedaPasajero.trim()) return true;
    const q = busquedaPasajero.toLowerCase();
    const nom = `${p.nombres_estudiante || ''} ${p.apellidos_estudiante || ''}`.toLowerCase();
    const ced = (p.cedula_estudiante || '').toLowerCase();
    const par = (p.datos_actualizados?.parada_transporte || '').toLowerCase();
    return nom.includes(q) || ced.includes(q) || par.includes(q);
  });

  // Métricas de asistencia
  const totalPasajerosEsperados = todosPasajerosABordo.length;
  const totalPresentes = todosPasajerosABordo.filter(p => asistenciaActual[p.id] === 'presente').length;
  const totalInasistentes = todosPasajerosABordo.filter(p => asistenciaActual[p.id] === 'ausente').length;

  // Marcar Asistencia o Inasistencia de un estudiante
  const toggleAsistencia = async (estudianteId: string, estado: 'presente' | 'ausente') => {
    if (!opActual) {
      return Swal.fire('Ruta no iniciada', 'Debes iniciar el recorrido antes de registrar asistencia.', 'info');
    }

    const nuevaAsistencia = {
      ...asistenciaActual,
      [estudianteId]: asistenciaActual[estudianteId] === estado ? null : estado
    };

    // Si se deseleccionó, quitamos la clave
    if (nuevaAsistencia[estudianteId] === null) {
      delete nuevaAsistencia[estudianteId];
    }

    try {
      const historial = opActual.historial_paradas || {};
      const { error } = await supabase
        .from('transporte_operaciones')
        .update({
          historial_paradas: {
            ...historial,
            _asistencia: nuevaAsistencia
          },
          ultima_actualizacion: new Date().toISOString()
        })
        .eq('id', opActual.id);

      if (error) throw error;
      await cargarTrackingSolo();
    } catch (err: any) {
      console.error('Error registrando asistencia:', err);
    }
  };

  // Marcar todos presentes con 1 clic
  const marcarTodosPresentes = async () => {
    if (!opActual) return Swal.fire('Atención', 'Inicia el recorrido antes de marcar asistencia.', 'info');

    const nuevaAsistencia = { ...asistenciaActual };
    todosPasajerosABordo.forEach(p => {
      nuevaAsistencia[p.id] = 'presente';
    });

    try {
      const historial = opActual.historial_paradas || {};
      const { error } = await supabase
        .from('transporte_operaciones')
        .update({
          historial_paradas: { ...historial, _asistencia: nuevaAsistencia },
          ultima_actualizacion: new Date().toISOString()
        })
        .eq('id', opActual.id);

      if (error) throw error;
      await cargarTrackingSolo();
      Swal.fire('Registrado', 'Todos los pasajeros a bordo han sido marcados como presentes.', 'success');
    } catch (e: any) {
      Swal.fire('Error', 'No se pudo actualizar la asistencia.', 'error');
    }
  };

  // Guardar Reporte de Novedad / Situación en Ruta
  const guardarReporteNovedad = async () => {
    if (!textoNovedad.trim()) {
      return Swal.fire('Atención', 'Por favor escribe el detalle de la situación ocurrida.', 'warning');
    }
    if (!opActual) {
      return Swal.fire('Atención', 'La ruta debe estar en curso para registrar novedades operativas.', 'warning');
    }

    setGuardandoNovedad(true);
    try {
      const nuevaNov = {
        id: `nov_${Date.now()}`,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fecha: hoyStr,
        tipo: tipoNovedad,
        docente: user?.nombre_completo || user?.nombre || 'Docente de Guardia',
        telefono_docente: user?.telefono || docenteAsignado?.telefono || '',
        texto: textoNovedad.trim(),
        ubicacion_parada: opActual.ubicacion_actual || 'En trayecto'
      };

      const historial = opActual.historial_paradas || {};
      const novsPrevias = Array.isArray(historial._novedades) ? historial._novedades : [];
      const actualizadas = [nuevaNov, ...novsPrevias];

      const { error } = await supabase
        .from('transporte_operaciones')
        .update({
          historial_paradas: { ...historial, _novedades: actualizadas },
          ultima_actualizacion: new Date().toISOString()
        })
        .eq('id', opActual.id);

      if (error) throw error;
      setTextoNovedad('');
      await cargarTrackingSolo();
      Swal.fire('Reporte Registrado', 'La novedad ha sido archivada en el registro de hoy.', 'success');
    } catch (err: any) {
      Swal.fire('Error', 'Falla guardando el reporte.', 'error');
    } finally {
      setGuardandoNovedad(false);
    }
  };

  // Reordenar o alterar paradas en caliente (por trancas / contingencia)
  const moverParadaEnCaliente = (idx: number, dir: number) => {
    const base = [...pids];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= base.length) return;
    if (base[idx] === 'escuela_virtual' || base[targetIdx] === 'escuela_virtual') return;

    const tmp = base[idx];
    base[idx] = base[targetIdx];
    base[targetIdx] = tmp;
    setCustomPids(base);

    // Si la ruta ya está activa en BD, guardamos el custom order en el historial
    if (opActual) {
      const historial = opActual.historial_paradas || {};
      supabase.from('transporte_operaciones').update({
        historial_paradas: { ...historial, _custom_order: base },
        ultima_actualizacion: new Date().toISOString()
      }).eq('id', opActual.id).then(() => cargarTrackingSolo());
    }
  };

  return (
    <div className="transporte-submod-card card-oper animate__animated animate__fadeInRight mb-4">
      <div className="transporte-submod-card-header">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <div className="d-flex align-items-center gap-2.5">
            {onBack && (
              <button 
                type="button"
                className="btn btn-sm btn-white border rounded-pill px-3 py-1.5 fw-bold text-dark d-flex align-items-center gap-1.5 shadow-xs hover-efecto"
                style={{ fontSize: '0.82rem' }}
                onClick={onBack}
                title="Volver al Dashboard"
              >
                <i className="bi bi-arrow-left text-primary"></i>
                <span>Volver</span>
              </button>
            )}
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center text-white flex-shrink-0"
              style={{
                width: '42px',
                height: '42px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
              }}
            >
              <i className="bi bi-broadcast fs-5"></i>
            </div>
            <div>
              <h5 className="fw-black text-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: '1.2rem', letterSpacing: '-0.3px' }}>
                <span>Operación y Guardia Escolar</span>
                <span 
                  className="badge rounded-pill fw-bold px-2.5 py-0.5 text-white shadow-xs" 
                  style={{ 
                    background: escCodigo === 'sb' ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'linear-gradient(135deg, #0284c7 0%, #0066ff 100%)',
                    fontSize: '0.72rem' 
                  }}
                >
                  {escCodigo === 'sb' ? 'Sede SB' : 'Sede LB'}
                </span>
                {offlineMode && (
                  <span className="badge bg-warning text-dark rounded-pill fw-bold" style={{ fontSize: '0.72rem' }}>
                    <i className="bi bi-wifi-off me-1"></i> Offline
                  </span>
                )}
              </h5>
              <small className="text-secondary fw-semibold" style={{ fontSize: '0.78rem' }}>
                Panel de control para el docente de guardia y conductor: avance parada por parada, pasajeros, asistencia y novedades.
              </small>
            </div>
          </div>

          <div className="d-flex align-items-center gap-1.5 flex-wrap">
            {opActual && (
              <button 
                className="btn btn-sm btn-outline-warning rounded-pill px-3 shadow-xs fw-bold" 
                onClick={resetRutaActual}
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i>Reiniciar Esta Ruta
              </button>
            )}
            <button
              className="btn btn-sm btn-outline-primary rounded-pill px-3 shadow-xs fw-bold d-flex align-items-center gap-1"
              onClick={() => setShowModalEnCaliente(true)}
              title="Ajustar secuencia o desvío por tranca vial"
            >
              <i className="bi bi-shuffle"></i>
              <span>Desvío / Cambio en Caliente</span>
            </button>
          </div>
        </div>

        {/* Selectores de Ruta y Sentido */}
        <div className="row g-2 g-md-3 mb-2">
          <div className="col-12 col-md-6">
            <label className="small text-muted fw-bold mb-1 d-flex align-items-center gap-1">
              <i className="bi bi-signpost-split-fill text-primary"></i>
              <span>Ruta Escolar Asignada</span>
            </label>
            <select 
              className="form-select form-select-sm bg-light border fw-bold rounded-3 shadow-xs" 
              value={opRutaId} 
              onChange={e => setOpRutaId(e.target.value)}
              style={{ fontSize: '0.88rem', padding: '9px 12px' }}
            >
              <option value="">-- Seleccione una ruta escolar --</option>
              {rutas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-6">
            <label className="small text-muted fw-bold mb-1 d-flex align-items-center gap-1">
              <i className="bi bi-clock-history text-warning"></i>
              <span>Sentido de la Jornada</span>
            </label>
            <select 
              className="form-select form-select-sm bg-light border fw-bold rounded-3 shadow-xs" 
              value={opSentido} 
              onChange={e => setOpSentido(e.target.value)}
              style={{ fontSize: '0.88rem', padding: '9px 12px' }}
            >
              <option value="Casa - Escuela">🌅 Ida hacia la Escuela (Mañana)</option>
              <option value="Escuela - Casa">🌇 Retorno a Casa (Tarde)</option>
            </select>
          </div>
        </div>

        {/* Sub-navegador de Pestañas: Recorrido / Pasajeros / Novedades */}
        {opRutaId && (
          <div className="d-flex align-items-center gap-2 overflow-x-auto text-nowrap pt-2 border-top">
            <button
              type="button"
              className={`btn btn-xs rounded-pill px-3 py-1.5 fw-bold transition-all d-flex align-items-center gap-1.5 ${
                tabOperativa === 'recorrido' ? 'text-white shadow-xs' : 'btn-light text-muted border'
              }`}
              style={{
                background: tabOperativa === 'recorrido' ? (escCodigo === 'sb' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #0062ff 0%, #0047d9 100%)') : undefined,
                borderColor: tabOperativa === 'recorrido' ? (escCodigo === 'sb' ? '#047857' : '#0047d9') : undefined,
                fontSize: '0.82rem'
              }}
              onClick={() => setTabOperativa('recorrido')}
            >
              <i className="bi bi-geo-alt-fill"></i>
              <span>Recorrido y Paradas</span>
            </button>

            <button
              type="button"
              className={`btn btn-xs rounded-pill px-3 py-1.5 fw-bold transition-all d-flex align-items-center gap-1.5 ${
                tabOperativa === 'pasajeros' ? 'btn-primary text-white shadow-xs' : 'btn-light text-muted border'
              }`}
              style={{
                backgroundColor: tabOperativa === 'pasajeros' ? '#10b981' : undefined,
                borderColor: tabOperativa === 'pasajeros' ? '#059669' : undefined,
                fontSize: '0.82rem'
              }}
              onClick={() => setTabOperativa('pasajeros')}
            >
              <i className="bi bi-people-fill"></i>
              <span>Pasajeros y Asistencia ({totalPasajerosEsperados})</span>
              {pasajerosIncluidos.length > 0 && (
                <span className="badge rounded-pill bg-success text-white ms-1" style={{ fontSize: '0.68rem' }}>
                  +{pasajerosIncluidos.length} 🟢
                </span>
              )}
              {pasajerosExcluidos.length > 0 && (
                <span className="badge rounded-pill bg-danger text-white ms-1" style={{ fontSize: '0.68rem' }}>
                  -{pasajerosExcluidos.length} 🔴
                </span>
              )}
            </button>

            <button
              type="button"
              className={`btn btn-xs rounded-pill px-3 py-1.5 fw-bold transition-all d-flex align-items-center gap-1.5 ${
                tabOperativa === 'novedades' ? 'btn-primary text-white shadow-xs' : 'btn-light text-muted border'
              }`}
              style={{
                backgroundColor: tabOperativa === 'novedades' ? '#6366f1' : undefined,
                borderColor: tabOperativa === 'novedades' ? '#4f46e5' : undefined,
                fontSize: '0.82rem'
              }}
              onClick={() => setTabOperativa('novedades')}
            >
              <i className="bi bi-journal-text"></i>
              <span>Reportar Novedades ({novedadesHoy.length})</span>
            </button>
          </div>
        )}
      </div>

      <div className="card-body p-3 p-md-4">
        {!opRutaId ? (
          <div className="text-center py-5 text-muted bg-light rounded-4 border p-4">
            <div className="d-inline-flex p-3 bg-white rounded-circle shadow-xs border mb-2 text-primary">
              <i className="bi bi-bus-front fs-2"></i>
            </div>
            <h6 className="fw-bold text-dark mt-2 mb-1">Selecciona una ruta para operar</h6>
            <p className="small text-muted mb-0">Elige la unidad en el menú desplegable superior para iniciar el recorrido o marcar asistencia.</p>
          </div>
        ) : (
          <div>
            {/* ══════════════════════════════════════════════════════════════════
                PESTAÑA: RECORRIDO Y PARADAS
                ══════════════════════════════════════════════════════════════════ */}
            {tabOperativa === 'recorrido' && (
              <div className="map-bg p-2 p-md-3 rounded-4">
                {/* Botón de Iniciar Recorrido */}
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  {!opActual ? (
                    <button 
                      className="btn rounded-pill px-4 py-2.5 fw-bold text-white shadow-sm d-flex align-items-center gap-2" 
                      style={{ background: escCodigo === 'sb' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #0062ff 0%, #0047d9 100%)', border: 'none' }}
                      onClick={iniciarRecorrido}
                    >
                      <i className="bi bi-play-circle-fill fs-5"></i>
                      <span>INICIAR RECORRIDO AHORA</span>
                    </button>
                  ) : (
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-success rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5">
                        <span className="live-dot"></span>
                        <span>{opActual.estado === 'Finalizada' ? '🏁 RECORRIDO FINALIZADO' : '🚍 UNIDAD EN MOVIMIENTO'}</span>
                      </span>
                    </div>
                  )}

                  <div className="d-flex align-items-center gap-2">
                    {docenteAsignado && (
                      <span className="badge bg-white border text-dark rounded-pill px-3 py-1.5 shadow-xs small">
                        <i className="bi bi-person-badge text-primary me-1"></i>
                        Docente: <b>{docenteAsignado.nombre_completo}</b>
                        {docenteAsignado.telefono && ` (${docenteAsignado.telefono})`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Banner de Estado en Vivo */}
                {opActual && (() => {
                  const currentIdx2 = pids.findIndex((id: string) => id === opActual.ubicacion_actual);
                  const progressIdx = opActual.estado === 'Finalizada' ? pids.length - 1 : currentIdx2;
                  return (
                    <div 
                      className="status-bus-banner shadow-sm mb-3"
                      style={{ 
                        background: opActual.estado === 'Finalizada'
                          ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)'
                          : 'linear-gradient(135deg, #dbeafe, #eff6ff)',
                        border: opActual.estado === 'Finalizada' ? '1.5px solid #6ee7b7' : '1.5px solid #93c5fd',
                        padding: '14px 16px'
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between gap-2 mb-2 flex-wrap">
                        <div>
                          <h6 className="fw-bold mb-0 d-flex align-items-center gap-1.5" style={{ color: opActual.estado === 'Finalizada' ? '#065f46' : '#1e40af' }}>
                            <span>{opActual.estado === 'Finalizada' ? '🏁 Ruta Finalizada con Éxito' : '🚍 En Ruta — Recorrido Activo'}</span>
                          </h6>
                          <div className="small text-muted" style={{ fontSize: '0.72rem' }}>
                            Última parada marcada: {new Date(opActual.ultima_actualizacion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                        {opActual.estado !== 'Finalizada' && (
                          <span className="bus-here-badge shadow-xs">
                            <span className="live-dot"></span>
                            TRANSMITIENDO EN VIVO
                          </span>
                        )}
                      </div>
                      {pids.length > 0 && (
                        <BusProgressBar
                          total={pids.length}
                          current={progressIdx >= 0 ? progressIdx : 0}
                          finalizada={opActual.estado === 'Finalizada'}
                        />
                      )}
                      <div className="road-marquee"></div>
                    </div>
                  );
                })()}

                {/* Stepper Vertical de Paradas con botón de marcado */}
                <div className="route-stepper">
                  {orderedParadas.map((parada: any, index: number) => {
                    const isStart = index === 0;
                    const isSchool = parada.id === 'escuela_virtual';

                    let passed = false;
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
                    const horaRegistrada = opActual?.historial_paradas?.[parada.id];

                    return (
                      <div
                        key={`stop-${parada.id}-${index}`}
                        className="stepper-stop"
                        style={{ animationDelay: `${index * 0.04}s`, marginBottom: '8px' }}
                      >
                        <div className={`stepper-pin ${pinClass}`} style={{ overflow: 'hidden', flexShrink: 0 }}>
                          {isActive ? (
                            <AnimatedBusSVG size={24} />
                          ) : passed ? (
                            <i className="bi bi-check-lg fw-bold text-white"></i>
                          ) : isSchool ? (
                            <i className="bi bi-building-fill text-purple"></i>
                          ) : isStart ? (
                            <BusStopIcon size={20} active={false} />
                          ) : (
                            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{index}</span>
                          )}
                        </div>

                        <div className={`stepper-card ${cardClass}`}>
                          <div className="stepper-card-info" style={{ minWidth: 0, flex: 1 }}>
                            <div className="stepper-step-num" style={{ color: isActive ? '#10b981' : passed ? '#3b82f6' : isSchool ? '#a855f7' : '#94a3b8' }}>
                              {isStart ? 'Punto de Partida' : isSchool ? 'Destino Final' : `Parada ${index}`}
                            </div>
                            <div className="stepper-name text-truncate fw-bold">{parada.nombre_parada}</div>
                            {parada.descripcion && (
                              <div className="stepper-desc text-muted extra-small">{parada.descripcion}</div>
                            )}
                            {horaRegistrada && (
                              <div className="stepper-hora">
                                <i className="bi bi-clock-fill"></i>
                                <span>{horaRegistrada}</span>
                              </div>
                            )}
                          </div>

                          {/* Botón de Marcado para el Docente / Conductor */}
                          {opActual && opActual.estado !== 'Finalizada' && !passed && (
                            <div className="flex-shrink-0">
                              <button
                                className="btn btn-sm btn-success rounded-pill px-3 py-1.5 fw-bold shadow-xs d-flex align-items-center gap-1"
                                onClick={() => marcarParada(parada.id, index, pids)}
                              >
                                <i className="bi bi-check2-circle"></i>
                                <span>{isSchool ? 'Llegamos a Destino' : 'Marcar Paso'}</span>
                              </button>
                            </div>
                          )}

                          {isActive && opActual?.estado !== 'Finalizada' && (
                            <div className="flex-shrink-0">
                              <span className="bus-here-badge shadow-xs">
                                <span className="live-dot"></span>
                                🚍 Aquí
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                PESTAÑA: PASAJEROS Y ASISTENCIA (🟢 VERDE / 🔴 ROJO)
                ══════════════════════════════════════════════════════════════════ */}
            {tabOperativa === 'pasajeros' && (
              <div>
                {/* Barra de Resumen de Pasajeros y Asistencia */}
                <div className="row g-2 mb-3">
                  <div className="col-6 col-md-3">
                    <div className="p-3 bg-white border rounded-3 shadow-xs text-center">
                      <div className="text-muted extra-small fw-bold">TOTAL ESPERADOS</div>
                      <div className="fs-4 fw-bold text-dark">{totalPasajerosEsperados}</div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 bg-white border border-success rounded-3 shadow-xs text-center">
                      <div className="text-success extra-small fw-bold">PRESENTES</div>
                      <div className="fs-4 fw-bold text-success">{totalPresentes}</div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 bg-white border border-danger rounded-3 shadow-xs text-center">
                      <div className="text-danger extra-small fw-bold">INASISTENTES</div>
                      <div className="fs-4 fw-bold text-danger">{totalInasistentes}</div>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 bg-white border border-info rounded-3 shadow-xs text-center d-flex flex-column justify-content-center">
                      <button
                        className="btn btn-sm btn-outline-success rounded-pill fw-bold"
                        onClick={marcarTodosPresentes}
                        disabled={!opActual}
                      >
                        <i className="bi bi-check-all me-1"></i>Marcar Todos Presentes
                      </button>
                    </div>
                  </div>
                </div>

                {/* Leyenda de Identificadores */}
                <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 fw-bold">
                    🟢 Verde: Incluido temporalmente hoy (Viene de otra ruta)
                  </span>
                  <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1 fw-bold">
                    🔴 Rojo: Excluido temporalmente hoy (NO esperar en parada)
                  </span>
                </div>

                {/* Buscador de Pasajeros */}
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-pill ps-3 bg-light border"
                    placeholder="Buscar estudiante por nombre, cédula o parada..."
                    value={busquedaPasajero}
                    onChange={e => setBusquedaPasajero(e.target.value)}
                  />
                </div>

                {/* Tabla de Pasajeros */}
                <div className="table-responsive">
                  <table className="table table-hover align-middle border rounded-4 overflow-hidden mb-0" style={{ fontSize: '0.86rem' }}>
                    <thead className="bg-light text-muted">
                      <tr>
                        <th>Estudiante</th>
                        <th>Grado / Sección</th>
                        <th>Parada Asignada</th>
                        <th>Condición de Viaje</th>
                        <th className="text-center" style={{ width: 180 }}>Asistencia en Ruta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pasajerosFiltrados.map(p => {
                        const esIncluido = p._tipoPasajero === 'incluido_temporal';
                        const esExcluido = p._tipoPasajero === 'excluido_temporal';
                        const estadoAsist = asistenciaActual[p.id];

                        return (
                          <tr
                            key={p.id}
                            style={{
                              backgroundColor: esIncluido ? 'rgba(240, 253, 244, 0.7)' : esExcluido ? 'rgba(254, 242, 242, 0.7)' : undefined
                            }}
                          >
                            <td>
                              <div className="fw-bold text-dark d-flex align-items-center gap-1.5">
                                {esIncluido && <span className="fs-6">🟢</span>}
                                {esExcluido && <span className="fs-6">🔴</span>}
                                <span>{p.nombres_estudiante} {p.apellidos_estudiante}</span>
                              </div>
                              <small className="text-muted">
                                C.I. {p.cedula_estudiante || 'Sin cédula'} &bull; Rep: {p.nombres_representante || 'Rep. Legal'}
                                {p.datos_actualizados?.representante_telefono && ` (${p.datos_actualizados.representante_telefono})`}
                              </small>
                            </td>
                            <td>
                              <span className="badge bg-light text-dark border">
                                {p.grado_actual || ''} {p.seccion_actual || ''}
                              </span>
                            </td>
                            <td>
                              <span className="fw-semibold text-dark">
                                <i className="bi bi-geo-alt text-warning me-1"></i>
                                {esIncluido ? p._cambioInfo?.parada_destino : (p.datos_actualizados?.parada_transporte || 'Parada asignada')}
                              </span>
                            </td>
                            <td>
                              {esIncluido && (
                                <div>
                                  <span className="badge bg-success text-white fw-bold px-2 py-0.5">
                                    🟢 Incluido Temporalmente
                                  </span>
                                  <small className="text-muted d-block mt-0.5" style={{ fontSize: '0.7rem' }}>
                                    Proviene de: <b>{p._cambioInfo?.ruta_origen}</b> &bull; Hasta: {p._cambioInfo?.fecha_fin}
                                  </small>
                                </div>
                              )}
                              {esExcluido && (
                                <div>
                                  <span className="badge bg-danger text-white fw-bold px-2 py-0.5">
                                    🔴 NO ESPERAR HOY
                                  </span>
                                  <small className="text-danger d-block mt-0.5 fw-semibold" style={{ fontSize: '0.7rem' }}>
                                    Hoy viaja en: <b>{p._cambioInfo?.ruta_destino}</b>
                                  </small>
                                </div>
                              )}
                              {!esIncluido && !esExcluido && (
                                <span className="badge bg-light text-muted border">
                                  Pasajero Regular
                                </span>
                              )}
                            </td>
                            <td className="text-center">
                              {esExcluido ? (
                                <span className="text-muted extra-small fst-italic">Excluido en esta ruta hoy</span>
                              ) : (
                                <div className="btn-group btn-group-sm">
                                  <button
                                    type="button"
                                    className={`btn ${estadoAsist === 'presente' ? 'btn-success text-white fw-bold shadow-xs' : 'btn-outline-success'}`}
                                    onClick={() => toggleAsistencia(p.id, 'presente')}
                                    title="Marcar Presente"
                                  >
                                    <i className="bi bi-check-lg me-1"></i>Presente
                                  </button>
                                  <button
                                    type="button"
                                    className={`btn ${estadoAsist === 'ausente' ? 'btn-danger text-white fw-bold shadow-xs' : 'btn-outline-danger'}`}
                                    onClick={() => toggleAsistencia(p.id, 'ausente')}
                                    title="Marcar Inasistente"
                                  >
                                    <i className="bi bi-x-lg me-1"></i>Inasistente
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                PESTAÑA: REPORTE DE NOVEDADES E INCIDENTES
                ══════════════════════════════════════════════════════════════════ */}
            {tabOperativa === 'novedades' && (
              <div>
                <div className="card border rounded-4 bg-light p-3 p-md-4 mb-4">
                  <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-1.5">
                    <i className="bi bi-pencil-square text-primary"></i>
                    <span>Registrar Situación o Novedad en Ruta</span>
                  </h6>
                  <p className="text-muted small mb-3">
                    Informa trancas, retrasos, fallas mecánicas, accidentes o situaciones con estudiantes para la bitácora oficial.
                  </p>

                  <div className="row g-2 mb-3">
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-bold">Tipo de Situación</label>
                      <select
                        className="form-select form-select-sm rounded-3"
                        value={tipoNovedad}
                        onChange={e => setTipoNovedad(e.target.value as any)}
                      >
                        <option value="tranca">🚗 Tranca / Desvío Vial</option>
                        <option value="mecanica">⚙️ Falla Mecánica / Caucho</option>
                        <option value="estudiante">🧒 Novedad con Estudiante</option>
                        <option value="clima">🌧️ Lluvias / Contingencia Climática</option>
                        <option value="otra">📝 Otra Novedad</option>
                      </select>
                    </div>
                    <div className="col-12 col-md-8">
                      <label className="form-label small fw-bold">Detalle de lo Ocurrido</label>
                      <input
                        type="text"
                        className="form-control form-control-sm rounded-3"
                        placeholder="Describe brevemente la novedad (ej: Desvío por obras en avenida principal)..."
                        value={textoNovedad}
                        onChange={e => setTextoNovedad(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-end">
                    <button
                      className="btn btn-sm btn-primary rounded-pill px-4 fw-bold shadow-xs"
                      onClick={guardarReporteNovedad}
                      disabled={guardandoNovedad}
                    >
                      {guardandoNovedad ? 'Archivando...' : 'Guardar Reporte de Novedad'}
                    </button>
                  </div>
                </div>

                {/* Bitácora de Novedades de Hoy */}
                <h6 className="fw-bold text-dark small mb-2">Bitácora de Novedades del Día ({novedadesHoy.length})</h6>
                {novedadesHoy.length === 0 ? (
                  <div className="text-center py-4 text-muted bg-white border rounded-3 small">
                    Sin situaciones reportadas en el recorrido de hoy.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {novedadesHoy.map((nov: any) => (
                      <div key={nov.id} className="p-3 bg-white border rounded-3 shadow-xs d-flex justify-content-between align-items-start gap-2">
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="badge rounded-pill bg-warning text-dark fw-bold" style={{ fontSize: '0.72rem' }}>
                              {nov.tipo?.toUpperCase()}
                            </span>
                            <span className="small text-muted fw-bold">🕒 {nov.hora}</span>
                            <span className="small text-muted">&bull; Por: {nov.docente}</span>
                          </div>
                          <div className="text-dark small fw-semibold">{nov.texto}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Desvío / Cambio en Caliente */}
      {showModalEnCaliente && (
        <div className="modal-backdrop-custom show" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', zIndex: 2050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow-lg border-0 rounded-4 animate__animated animate__zoomIn" style={{ width: '92%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header bg-white pt-3 pb-2 px-4 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-shuffle text-warning"></i>
                <span>Ajuste en Caliente del Recorrido</span>
              </h5>
              <button type="button" className="btn-close" onClick={() => setShowModalEnCaliente(false)}></button>
            </div>

            <div className="card-body p-4">
              <p className="small text-muted mb-3">
                Si te encuentras con trancas, calles cerradas o contingencias viales, puedes reordenar la secuencia de paradas de hoy sin alterar el diseño permanente de la ruta en la base de datos.
              </p>

              <div className="d-flex flex-column gap-2 mb-3">
                {orderedParadas.map((parada: any, idx: number) => (
                  <div key={parada.id} className="p-2.5 bg-light border rounded-3 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-primary rounded-circle" style={{ width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        {idx + 1}
                      </span>
                      <span className="fw-bold text-dark small">{parada.nombre_parada}</span>
                    </div>

                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-secondary"
                        disabled={idx === 0}
                        onClick={() => moverParadaEnCaliente(idx, -1)}
                      >
                        <i className="bi bi-arrow-up"></i>
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        disabled={idx === orderedParadas.length - 1}
                        onClick={() => moverParadaEnCaliente(idx, 1)}
                      >
                        <i className="bi bi-arrow-down"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                {customPids && (
                  <button
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                    onClick={() => { setCustomPids(null); setShowModalEnCaliente(false); }}
                  >
                    Restaurar Orden Original
                  </button>
                )}
                <button
                  className="btn btn-sm btn-primary rounded-pill px-4 fw-bold shadow-xs"
                  onClick={() => setShowModalEnCaliente(false)}
                >
                  Confirmar Secuencia
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
