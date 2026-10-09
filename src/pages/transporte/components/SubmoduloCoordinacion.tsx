import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';

interface SubmoduloCoordinacionProps {
  onBack?: () => void;
  canManageParadas: boolean;
  canManageRutas: boolean;
  paradas: any[];
  rutas: any[];
  docentes: any[];
  estudiantes: any[];
  escCodigo: 'sb' | 'lb';
  cargarTodo: (silencioso?: boolean) => Promise<void>;
  setParadaForm: (form: any) => void;
  setShowModalParada: (show: boolean) => void;
  setRutaForm: (form: any) => void;
  setParadasTemporales: (pTemp: any[]) => void;
  setShowModalRuta: (show: boolean) => void;
  setShowModalAsignacion: (show: boolean) => void;
  deleteParada: (id: string) => void;
  deleteParadasMasivo: (ids: string[]) => void;
  deleteRuta: (id: string) => void;
  deleteRutasMasivo: (ids: string[]) => void;
  compartirRuta: (r: any) => void;
  editRuta: (r: any) => void;
  salidaMasiva: () => void;
  resetMasivo: () => void;
  BusStopIcon: React.ComponentType<{ size?: number; active?: boolean }>;
  AnimatedBusSVG: React.ComponentType<{ size?: number; color?: string; className?: string }>;
}

export const SubmoduloCoordinacion: React.FC<SubmoduloCoordinacionProps> = ({
  onBack,
  canManageParadas,
  canManageRutas,
  paradas,
  rutas,
  docentes,
  estudiantes,
  escCodigo,
  cargarTodo,
  setParadaForm,
  setShowModalParada,
  setRutaForm,
  setParadasTemporales,
  setShowModalRuta,
  setShowModalAsignacion,
  deleteParada,
  deleteParadasMasivo,
  deleteRuta,
  deleteRutasMasivo,
  compartirRuta,
  editRuta,
  salidaMasiva,
  resetMasivo,
  BusStopIcon,
  AnimatedBusSVG
}) => {
  const Swal = (window as any).Swal;
  const [tabActiva, setTabActiva] = useState<'paradas' | 'rutas' | 'cambios_estudiantes' | 'control_global'>('rutas');
  
  // Búsqueda y paginación
  const [busqueda, setBusqueda] = useState('');
  const [paginaParadas, setPaginaParadas] = useState(1);
  const [paginaRutas, setPaginaRutas] = useState(1);
  const itemsPorPagina = 10;

  // Selección múltiple
  const [selectedParadas, setSelectedParadas] = useState<string[]>([]);
  const [selectedRutas, setSelectedRutas] = useState<string[]>([]);

  // Estados para Modal de Cambio de Ruta de Estudiante (4 Tipos)
  const [showModalCambio, setShowModalCambio] = useState(false);
  const [guardandoCambio, setGuardandoCambio] = useState(false);
  const [busquedaEstudiante, setBusquedaEstudiante] = useState('');
  const [formCambio, setFormCambio] = useState({
    estudianteId: '',
    estudianteNombre: '',
    cedulaEstudiante: '',
    rutaOrigen: '',
    paradaOrigen: '',
    tipoCambio: 'ida_temporal' as 'ida_temporal' | 'retorno_temporal' | 'ambos_temporal' | 'definitivo',
    rutaDestino: '',
    paradaDestino: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    motivo: '',
    representanteSolicita: ''
  });

  // Filtros de Paradas y Rutas
  const paradasFiltradas = paradas.filter(p => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (p.nombre_parada || '').toLowerCase().includes(q) || (p.descripcion || '').toLowerCase().includes(q);
  });

  const rutasFiltradas = rutas.filter(r => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (r.nombre || '').toLowerCase().includes(q) || (r.chofer_nombre || '').toLowerCase().includes(q);
  });

  // Paginados
  const totalPaginasParadas = Math.ceil(paradasFiltradas.length / itemsPorPagina);
  const paginatedParadas = paradasFiltradas.slice((paginaParadas - 1) * itemsPorPagina, paginaParadas * itemsPorPagina);

  const totalPaginasRutas = Math.ceil(rutasFiltradas.length / itemsPorPagina);
  const paginatedRutas = rutasFiltradas.slice((paginaRutas - 1) * itemsPorPagina, paginaRutas * itemsPorPagina);

  // Lista de estudiantes con cambios temporales activos hoy
  const hoyStr = new Date().toISOString().split('T')[0];
  const estudiantesConCambios = (estudiantes || []).filter(est => {
    const cambios = est.datos_actualizados?.cambios_transporte_temporales;
    if (!Array.isArray(cambios)) return false;
    return cambios.some((c: any) => c.activo && hoyStr >= c.fecha_inicio && hoyStr <= c.fecha_fin);
  });

  // Abrir modal de cambio para un estudiante específico o desde cero
  const abrirModalCambio = (est?: any) => {
    if (est) {
      const d = est.datos_actualizados || {};
      setFormCambio({
        estudianteId: est.id,
        estudianteNombre: `${est.nombres_estudiante || ''} ${est.apellidos_estudiante || ''}`.trim(),
        cedulaEstudiante: est.cedula_estudiante || '',
        rutaOrigen: d.ruta_transporte || '',
        paradaOrigen: d.parada_transporte || '',
        tipoCambio: 'ida_temporal',
        rutaDestino: '',
        paradaDestino: '',
        fechaInicio: hoyStr,
        fechaFin: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        motivo: '',
        representanteSolicita: `${est.nombres_representante || ''} ${est.apellidos_representante || ''}`.trim()
      });
    } else {
      setFormCambio({
        estudianteId: '',
        estudianteNombre: '',
        cedulaEstudiante: '',
        rutaOrigen: '',
        paradaOrigen: '',
        tipoCambio: 'ida_temporal',
        rutaDestino: '',
        paradaDestino: '',
        fechaInicio: hoyStr,
        fechaFin: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        motivo: '',
        representanteSolicita: ''
      });
    }
    setBusquedaEstudiante('');
    setShowModalCambio(true);
  };

  // Guardar cambio de ruta (temporal o definitivo)
  const guardarCambioRuta = async () => {
    if (!formCambio.estudianteId) {
      return Swal.fire('Atención', 'Debe seleccionar un estudiante.', 'warning');
    }
    if (!formCambio.rutaDestino) {
      return Swal.fire('Atención', 'Debe seleccionar la ruta de destino.', 'warning');
    }
    if (formCambio.tipoCambio !== 'definitivo' && (!formCambio.fechaInicio || !formCambio.fechaFin)) {
      return Swal.fire('Atención', 'Debe indicar el rango de fechas para el cambio temporal.', 'warning');
    }

    setGuardandoCambio(true);
    try {
      const estTarget = estudiantes.find(e => e.id === formCambio.estudianteId);
      const datosActuales = estTarget?.datos_actualizados || {};

      if (formCambio.tipoCambio === 'definitivo') {
        // CASO 4: Cambio Definitivo -> Modifica directamente la ficha de vinculación
        const updatedDatos = {
          ...datosActuales,
          ruta_transporte: formCambio.rutaDestino,
          parada_transporte: formCambio.paradaDestino || '',
          requiere_transporte: true,
          ultima_modificacion_transporte: new Date().toISOString()
        };

        const { error } = await supabase
          .from('estudiantes_vinculaciones')
          .update({
            datos_actualizados: updatedDatos,
            fecha_ultima_actualizacion: new Date().toISOString()
          })
          .eq('id', formCambio.estudianteId);

        if (error) throw error;
        Swal.fire('Éxito', 'Cambio definitivo registrado y actualizado en la ficha escolar del estudiante.', 'success');
      } else {
        // CASOS 1, 2 y 3: Cambios Temporales (Ida, Retorno, o Ambos)
        const nuevoCambio = {
          id: `cambio_${Date.now()}`,
          tipo: formCambio.tipoCambio,
          ruta_origen: formCambio.rutaOrigen || datosActuales.ruta_transporte || 'Sin ruta previa',
          parada_origen: formCambio.paradaOrigen || datosActuales.parada_transporte || '',
          ruta_destino: formCambio.rutaDestino,
          parada_destino: formCambio.paradaDestino,
          fecha_inicio: formCambio.fechaInicio,
          fecha_fin: formCambio.fechaFin,
          motivo: formCambio.motivo || 'Solicitud de representante',
          representante_solicita: formCambio.representanteSolicita,
          creado_el: new Date().toISOString(),
          activo: true
        };

        const cambiosPrevios = Array.isArray(datosActuales.cambios_transporte_temporales)
          ? datosActuales.cambios_transporte_temporales
          : [];

        const updatedDatos = {
          ...datosActuales,
          cambios_transporte_temporales: [nuevoCambio, ...cambiosPrevios]
        };

        const { error } = await supabase
          .from('estudiantes_vinculaciones')
          .update({ datos_actualizados: updatedDatos })
          .eq('id', formCambio.estudianteId);

        if (error) throw error;
        Swal.fire('Registrado', 'El cambio temporal de ruta se ha activado. Se mostrará en verde en la ruta receptora y en rojo en la ruta emisora.', 'success');
      }

      setShowModalCambio(false);
      await cargarTodo(true);
    } catch (err: any) {
      console.error('Error guardando cambio de ruta:', err);
      Swal.fire('Error', err.message || 'No se pudo guardar el cambio de ruta.', 'error');
    } finally {
      setGuardandoCambio(false);
    }
  };

  // Revocar cambio temporal
  const revocarCambioTemporal = async (estudianteId: string, cambioId: string) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Revocar cambio temporal?',
      text: 'El estudiante volverá a su ruta original inmediatamente.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, revocar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ea580c'
    });

    if (!isConfirmed) return;

    try {
      const estTarget = estudiantes.find(e => e.id === estudianteId);
      const datosActuales = estTarget?.datos_actualizados || {};
      const cambiosPrevios = Array.isArray(datosActuales.cambios_transporte_temporales)
        ? datosActuales.cambios_transporte_temporales
        : [];

      const cambiosActualizados = cambiosPrevios.map((c: any) => 
        c.id === cambioId ? { ...c, activo: false, cancelado_el: new Date().toISOString() } : c
      );

      const { error } = await supabase
        .from('estudiantes_vinculaciones')
        .update({ datos_actualizados: { ...datosActuales, cambios_transporte_temporales: cambiosActualizados } })
        .eq('id', estudianteId);

      if (error) throw error;
      Swal.fire('Revocado', 'El cambio temporal ha sido finalizado.', 'success');
      await cargarTodo(true);
    } catch (e: any) {
      Swal.fire('Error', 'No se pudo revocar el cambio.', 'error');
    }
  };

  return (
    <div className="transporte-submod-card card-coord animate__animated animate__fadeInRight mb-4">
      {/* ── BARRA SUPERIOR DE SUBMÓDULO: COORDINACIÓN DE TRANSPORTE ── */}
      <div className="transporte-submod-card-header">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
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
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
              }}
            >
              <i className="bi bi-sliders fs-5"></i>
            </div>
            <div>
              <h5 className="fw-black text-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: '1.2rem', letterSpacing: '-0.3px' }}>
                <span>Coordinación de Transporte Escolar</span>
                <span 
                  className="badge rounded-pill fw-bold px-2.5 py-0.5 text-white shadow-xs" 
                  style={{ 
                    background: escCodigo === 'sb' ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' : 'linear-gradient(135deg, #0284c7 0%, #0066ff 100%)',
                    fontSize: '0.72rem' 
                  }}
                >
                  {escCodigo === 'sb' ? 'Sede SB' : 'Sede LB'}
                </span>
              </h5>
              <small className="text-secondary fw-semibold" style={{ fontSize: '0.78rem' }}>
                Gestión integral de paradas, diseño y orden de rutas, personal asignado y cambios de rutas estudiantiles.
              </small>
            </div>
          </div>

          {/* Acciones Rápidas Globales */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 shadow-xs"
              style={{ fontSize: '0.82rem' }}
              onClick={() => abrirModalCambio()}
            >
              <i className="bi bi-arrow-left-right text-primary"></i>
              <span>Nuevo Cambio de Ruta</span>
            </button>

            <button
              className="btn btn-sm btn-success rounded-pill px-3 py-1.5 fw-bold text-white d-flex align-items-center gap-1.5 shadow-xs"
              style={{ 
                fontSize: '0.82rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
              }}
              onClick={salidaMasiva}
              title="Declarar salida masiva de todas las unidades activas"
            >
              <i className="bi bi-broadcast"></i>
              <span>Salida Masiva</span>
            </button>

            <button
              className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 shadow-xs"
              style={{ fontSize: '0.82rem' }}
              onClick={resetMasivo}
              title="Reiniciar recorridos y operaciones del día"
            >
              <i className="bi bi-arrow-counterclockwise"></i>
              <span>Reiniciar Sistemas</span>
            </button>
          </div>
        </div>

        {/* Selector de Pestañas Internas */}
        <div className="d-flex align-items-center gap-2 overflow-x-auto text-nowrap pb-1 no-scrollbar" style={{ scrollbarWidth: 'none' }}>
          <button
            type="button"
            className={`btn btn-xs rounded-pill px-3 py-1.5 fw-bold transition-all d-flex align-items-center gap-1.5 flex-shrink-0 ${
              tabActiva === 'rutas' ? 'text-white shadow-xs' : 'btn-light text-muted border'
            }`}
            style={{
              background: tabActiva === 'rutas' ? (escCodigo === 'sb' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #0062ff 0%, #0047d9 100%)') : undefined,
              borderColor: tabActiva === 'rutas' ? (escCodigo === 'sb' ? '#047857' : '#0047d9') : undefined,
              fontSize: '0.82rem'
            }}
            onClick={() => setTabActiva('rutas')}
          >
            <i className="bi bi-signpost-2-fill"></i>
            <span>Rutas ({rutas.length})</span>
          </button>

          <button
            type="button"
            className={`btn btn-xs rounded-pill px-3 py-1.5 fw-bold transition-all d-flex align-items-center gap-1.5 flex-shrink-0 ${
              tabActiva === 'paradas' ? 'text-white shadow-xs' : 'btn-light text-muted border'
            }`}
            style={{
              background: tabActiva === 'paradas' ? (escCodigo === 'sb' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #0062ff 0%, #0047d9 100%)') : undefined,
              borderColor: tabActiva === 'paradas' ? (escCodigo === 'sb' ? '#047857' : '#0047d9') : undefined,
              fontSize: '0.82rem'
            }}
            onClick={() => setTabActiva('paradas')}
          >
            <i className="bi bi-geo-alt-fill"></i>
            <span>Paradas ({paradas.length})</span>
          </button>

          <button
            type="button"
            className={`btn btn-xs rounded-pill px-3 py-1.5 fw-bold transition-all d-flex align-items-center gap-1.5 flex-shrink-0 ${
              tabActiva === 'cambios_estudiantes' ? 'btn-primary text-white shadow-xs' : 'btn-light text-muted border'
            }`}
            style={{
              backgroundColor: tabActiva === 'cambios_estudiantes' ? '#10b981' : undefined,
              borderColor: tabActiva === 'cambios_estudiantes' ? '#059669' : undefined,
              fontSize: '0.82rem'
            }}
            onClick={() => setTabActiva('cambios_estudiantes')}
          >
            <i className="bi bi-person-lines-fill"></i>
            <span>Cambios de Ruta ({estudiantesConCambios.length} activos)</span>
          </button>

          <button
            type="button"
            className={`btn btn-xs rounded-pill px-3 py-1.5 fw-bold transition-all d-flex align-items-center gap-1.5 flex-shrink-0 ${
              tabActiva === 'control_global' ? 'btn-primary text-white shadow-xs' : 'btn-light text-muted border'
            }`}
            style={{
              backgroundColor: tabActiva === 'control_global' ? '#6366f1' : undefined,
              borderColor: tabActiva === 'control_global' ? '#4f46e5' : undefined,
              fontSize: '0.82rem'
            }}
            onClick={() => setTabActiva('control_global')}
          >
            <i className="bi bi-cpu-fill"></i>
            <span>Control y Despacho Global</span>
          </button>
        </div>
      </div>

      <div className="card-body p-3 p-md-4">
        {/* ══════════════════════════════════════════════════════════════════════
            PESTAÑA 1: RUTAS ESCOLARES (DISEÑO, ORDEN, CHOFER Y DOCENTE CON TLF)
            ══════════════════════════════════════════════════════════════════════ */}
        {tabActiva === 'rutas' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div className="position-relative" style={{ minWidth: '260px' }}>
                <i className="bi bi-search position-absolute text-muted" style={{ left: 12, top: 10 }}></i>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-pill ps-5 bg-light border"
                  placeholder="Buscar ruta o chofer..."
                  value={busqueda}
                  onChange={e => { setBusqueda(e.target.value); setPaginaRutas(1); }}
                />
              </div>

              <div className="d-flex align-items-center gap-2">
                {selectedRutas.length > 0 && (
                  <button
                    className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold"
                    onClick={() => {
                      deleteRutasMasivo(selectedRutas);
                      setSelectedRutas([]);
                    }}
                  >
                    <i className="bi bi-trash3-fill me-1"></i>Eliminar ({selectedRutas.length})
                  </button>
                )}

                {canManageRutas && (
                  <button
                    className="btn btn-sm rounded-pill px-3 fw-bold text-white shadow-xs d-flex align-items-center gap-1.5"
                    style={{ background: escCodigo === 'sb' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #0062ff 0%, #0047d9 100%)', border: 'none' }}
                    onClick={() => {
                      setRutaForm({ id: '', nombre: '', sectores: '', paradas_json: [], docente_id: '', chofer_nombre: '', chofer_telefono: '', unidad_placa: '', unidad_modelo: '', activo: true });
                      setParadasTemporales([]);
                      setShowModalRuta(true);
                    }}
                  >
                    <i className="bi bi-plus-circle-fill"></i>
                    <span>Diseñar Nueva Ruta</span>
                  </button>
                )}
              </div>
            </div>

            {rutasFiltradas.length === 0 ? (
              <div className="text-center py-5 bg-light rounded-4 border text-muted">
                <i className="bi bi-signpost-split fs-1 text-warning mb-2 d-block"></i>
                <h6 className="fw-bold text-dark">No hay rutas registradas</h6>
                <p className="small mb-0">Crea una nueva ruta seleccionando paradas existentes y estableciendo el orden.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle border rounded-4 overflow-hidden mb-0" style={{ fontSize: '0.86rem' }}>
                  <thead className="bg-light text-muted">
                    <tr>
                      <th style={{ width: 40 }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedRutas.length === paginatedRutas.length && paginatedRutas.length > 0}
                          onChange={e => setSelectedRutas(e.target.checked ? paginatedRutas.map(r => r.id) : [])}
                        />
                      </th>
                      <th>Ruta y Secuencia</th>
                      <th>Chofer</th>
                      <th>Docente de Guardia</th>
                      <th>Teléfono Docente</th>
                      <th>Estatus</th>
                      <th className="text-end" style={{ width: 140 }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRutas.map(r => {
                      const docenteObj = docentes.find(d => d.id_usuario === r.docente_id);
                      let pids: string[] = [];
                      if (Array.isArray(r.paradas_json)) pids = r.paradas_json;
                      else if (typeof r.paradas_json === 'string') {
                        try { pids = JSON.parse(r.paradas_json); } catch (e) {}
                      }

                      return (
                        <tr key={r.id}>
                          <td>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedRutas.includes(r.id)}
                              onChange={e => {
                                setSelectedRutas(e.target.checked ? [...selectedRutas, r.id] : selectedRutas.filter(id => id !== r.id));
                              }}
                            />
                          </td>
                          <td>
                            <div className="fw-bold text-dark d-flex align-items-center gap-1.5">
                              <AnimatedBusSVG size={20} />
                              <span>{r.nombre}</span>
                            </div>
                            <small className="text-muted d-block mt-0.5">
                              <i className="bi bi-geo-alt me-1 text-warning"></i>
                              {pids.length} paradas en secuencia
                            </small>
                          </td>
                          <td>
                            {r.chofer_nombre ? (
                              <div>
                                <span className="fw-semibold text-dark">{r.chofer_nombre}</span>
                                {r.chofer_telefono && (
                                  <small className="text-muted d-block">
                                    <i className="bi bi-telephone me-1"></i>{r.chofer_telefono}
                                  </small>
                                )}
                              </div>
                            ) : (
                              <span className="badge bg-light text-muted border">Sin asignar</span>
                            )}
                          </td>
                          <td>
                            {docenteObj ? (
                              <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-1">
                                <i className="bi bi-person-badge-fill me-1"></i>
                                {docenteObj.nombre_completo}
                              </span>
                            ) : (
                              <span className="badge bg-light text-muted border">Sin asignar</span>
                            )}
                          </td>
                          <td>
                            {docenteObj?.telefono ? (
                              <a
                                href={`tel:${docenteObj.telefono}`}
                                className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 text-decoration-none fw-bold"
                                title="Llamar al docente de guardia"
                              >
                                <i className="bi bi-telephone-fill me-1"></i>
                                {docenteObj.telefono}
                              </a>
                            ) : (
                              <span className="badge bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-25 px-2 py-1">
                                ⚠️ No registrado
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`badge rounded-pill px-2.5 py-1 ${r.activo !== false ? 'bg-success text-white' : 'bg-secondary text-white'}`}>
                              {r.activo !== false ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-1">
                              <button
                                className="btn btn-xs btn-outline-primary rounded-circle"
                                title="Asignar Chofer y Docente"
                                onClick={() => {
                                  setRutaForm(r);
                                  setShowModalAsignacion(true);
                                }}
                                style={{ width: 28, height: 28, padding: 0 }}
                              >
                                <i className="bi bi-person-plus-fill"></i>
                              </button>
                              <button
                                className="btn btn-xs btn-outline-warning rounded-circle"
                                title="Editar Ruta y Paradas"
                                onClick={() => editRuta(r)}
                                style={{ width: 28, height: 28, padding: 0 }}
                              >
                                <i className="bi bi-pencil-fill"></i>
                              </button>
                              <button
                                className="btn btn-xs btn-outline-success rounded-circle"
                                title="Compartir Rutograma"
                                onClick={() => compartirRuta(r)}
                                style={{ width: 28, height: 28, padding: 0 }}
                              >
                                <i className="bi bi-whatsapp"></i>
                              </button>
                              <button
                                className="btn btn-xs btn-outline-danger rounded-circle"
                                title="Eliminar Ruta"
                                onClick={() => deleteRuta(r.id)}
                                style={{ width: 28, height: 28, padding: 0 }}
                              >
                                <i className="bi bi-trash-fill"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginación de Rutas */}
            {totalPaginasRutas > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                <small className="text-muted">Página {paginaRutas} de {totalPaginasRutas}</small>
                <div className="btn-group btn-group-sm">
                  <button className="btn btn-outline-secondary" disabled={paginaRutas === 1} onClick={() => setPaginaRutas(p => p - 1)}>
                    Anterior
                  </button>
                  <button className="btn btn-outline-secondary" disabled={paginaRutas === totalPaginasRutas} onClick={() => setPaginaRutas(p => p + 1)}>
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            PESTAÑA 2: CATÁLOGO DE PARADAS (CRUD)
            ══════════════════════════════════════════════════════════════════════ */}
        {tabActiva === 'paradas' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div className="position-relative" style={{ minWidth: '260px' }}>
                <i className="bi bi-search position-absolute text-muted" style={{ left: 12, top: 10 }}></i>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-pill ps-5 bg-light border"
                  placeholder="Buscar parada o sector..."
                  value={busqueda}
                  onChange={e => { setBusqueda(e.target.value); setPaginaParadas(1); }}
                />
              </div>

              <div className="d-flex align-items-center gap-2">
                {selectedParadas.length > 0 && (
                  <button
                    className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold"
                    onClick={() => {
                      deleteParadasMasivo(selectedParadas);
                      setSelectedParadas([]);
                    }}
                  >
                    <i className="bi bi-trash3-fill me-1"></i>Eliminar ({selectedParadas.length})
                  </button>
                )}

                {canManageParadas && (
                  <button
                    className="btn btn-sm rounded-pill px-3 fw-bold text-white shadow-xs d-flex align-items-center gap-1.5"
                    style={{ background: escCodigo === 'sb' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #0062ff 0%, #0047d9 100%)', border: 'none' }}
                    onClick={() => {
                      setParadaForm({ id: '', nombre: '', descripcion: '' });
                      setShowModalParada(true);
                    }}
                  >
                    <i className="bi bi-plus-circle-fill"></i>
                    <span>Crear Parada</span>
                  </button>
                )}
              </div>
            </div>

            {paradasFiltradas.length === 0 ? (
              <div className="text-center py-5 bg-light rounded-4 border text-muted">
                <i className="bi bi-geo-alt fs-1 text-warning mb-2 d-block"></i>
                <h6 className="fw-bold text-dark">No hay paradas registradas</h6>
                <p className="small mb-0">Crea los puntos de parada estratégicos que conformarán los recorridos de los autobuses.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle border rounded-4 overflow-hidden mb-0" style={{ fontSize: '0.86rem' }}>
                  <thead className="bg-light text-muted">
                    <tr>
                      <th style={{ width: 40 }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedParadas.length === paginatedParadas.length && paginatedParadas.length > 0}
                          onChange={e => setSelectedParadas(e.target.checked ? paginatedParadas.map(p => p.id) : [])}
                        />
                      </th>
                      <th>Nombre de Parada</th>
                      <th>Sector / Referencia</th>
                      <th>Rutas que la incluyen</th>
                      <th className="text-end" style={{ width: 100 }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedParadas.map(p => {
                      // Determinar en qué rutas está incluida esta parada
                      const rutasConEstaParada = rutas.filter(r => {
                        let pids: string[] = [];
                        if (Array.isArray(r.paradas_json)) pids = r.paradas_json;
                        else if (typeof r.paradas_json === 'string') {
                          try { pids = JSON.parse(r.paradas_json); } catch (e) {}
                        }
                        return pids.includes(p.id);
                      });

                      return (
                        <tr key={p.id}>
                          <td>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedParadas.includes(p.id)}
                              onChange={e => {
                                setSelectedParadas(e.target.checked ? [...selectedParadas, p.id] : selectedParadas.filter(id => id !== p.id));
                              }}
                            />
                          </td>
                          <td>
                            <div className="fw-bold text-dark d-flex align-items-center gap-1.5">
                              <BusStopIcon size={18} active={rutasConEstaParada.length > 0} />
                              <span>{p.nombre_parada}</span>
                            </div>
                          </td>
                          <td className="text-muted">
                            {p.descripcion || <span className="fst-italic text-muted small">Sin descripción</span>}
                          </td>
                          <td>
                            {rutasConEstaParada.length > 0 ? (
                              <div className="d-flex gap-1 flex-wrap">
                                {rutasConEstaParada.map(r => (
                                  <span key={r.id} className="badge bg-light text-primary border" style={{ fontSize: '0.72rem' }}>
                                    {r.nombre}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="badge bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-25" style={{ fontSize: '0.72rem' }}>
                                Sin asignar a ruta
                              </span>
                            )}
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-1">
                              <button
                                className="btn btn-xs btn-outline-warning rounded-circle"
                                title="Editar Parada"
                                onClick={() => {
                                  setParadaForm({ id: p.id, nombre: p.nombre_parada, descripcion: p.descripcion || '' });
                                  setShowModalParada(true);
                                }}
                                style={{ width: 28, height: 28, padding: 0 }}
                              >
                                <i className="bi bi-pencil-fill"></i>
                              </button>
                              <button
                                className="btn btn-xs btn-outline-danger rounded-circle"
                                title="Eliminar Parada"
                                onClick={() => deleteParada(p.id)}
                                style={{ width: 28, height: 28, padding: 0 }}
                              >
                                <i className="bi bi-trash-fill"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginación de Paradas */}
            {totalPaginasParadas > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                <small className="text-muted">Página {paginaParadas} de {totalPaginasParadas}</small>
                <div className="btn-group btn-group-sm">
                  <button className="btn btn-outline-secondary" disabled={paginaParadas === 1} onClick={() => setPaginaParadas(p => p - 1)}>
                    Anterior
                  </button>
                  <button className="btn btn-outline-secondary" disabled={paginaParadas === totalPaginasParadas} onClick={() => setPaginaParadas(p => p + 1)}>
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            PESTAÑA 3: GESTIÓN DE CAMBIOS DE RUTA (TEMPORALES Y DEFINITIVOS)
            ══════════════════════════════════════════════════════════════════════ */}
        {tabActiva === 'cambios_estudiantes' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-1.5">
                  <i className="bi bi-arrow-left-right text-success"></i>
                  <span>Cambios de Ruta Temporales y Definitivos</span>
                </h6>
                <small className="text-muted">
                  Gestión de las solicitudes de representantes: Ida temporal, Retorno temporal, Ambos temporal y Definitivo.
                </small>
              </div>

              <button
                className="btn btn-sm btn-success rounded-pill px-3.5 py-1.5 fw-bold text-white shadow-xs d-flex align-items-center gap-1.5"
                onClick={() => abrirModalCambio()}
              >
                <i className="bi bi-plus-circle-fill"></i>
                <span>Crear Solicitud de Cambio</span>
              </button>
            </div>

            {/* Cuadro Explicativo de los 4 Tipos de Cambios */}
            <div className="row g-2 mb-4">
              <div className="col-12 col-md-3">
                <div className="p-2.5 bg-white border border-info rounded-3 shadow-xs">
                  <div className="fw-bold text-info small mb-1">🌅 1. Ida a la Escuela (Temporal)</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Aplica solo al trayecto matutino hacia el colegio. Vence al terminar los días seleccionados.</div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="p-2.5 bg-white border border-primary rounded-3 shadow-xs">
                  <div className="fw-bold text-primary small mb-1">🌇 2. Retorno a Casa (Temporal)</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Aplica solo al trayecto vespertino de salida. Vence automáticamente al terminar.</div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="p-2.5 bg-white border border-warning rounded-3 shadow-xs">
                  <div className="fw-bold text-warning-emphasis small mb-1">🔄 3. Ida y Retorno (Temporal)</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Aplica a ambos sentidos durante el rango de días fijado por la coordinación.</div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="p-2.5 bg-white border border-success rounded-3 shadow-xs">
                  <div className="fw-bold text-success small mb-1">⭐ 4. Cambio Definitivo</div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>Modifica permanentemente la ficha de vinculación escolar del estudiante.</div>
                </div>
              </div>
            </div>

            {/* Listado de Casos Temporales Activos */}
            <h6 className="fw-bold text-dark small mb-2 d-flex align-items-center gap-1">
              <span className="d-inline-block rounded-circle bg-success" style={{ width: 8, height: 8 }}></span>
              <span>Casos Temporales Activos Actualmente ({estudiantesConCambios.length})</span>
            </h6>

            {estudiantesConCambios.length === 0 ? (
              <div className="text-center py-5 bg-light rounded-4 border text-muted">
                <i className="bi bi-check2-circle fs-1 text-success mb-2 d-block"></i>
                <h6 className="fw-bold text-dark">No hay cambios temporales activos hoy</h6>
                <p className="small mb-0">Todos los estudiantes están asignados a sus rutas regulares normales.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle border rounded-4 overflow-hidden mb-0" style={{ fontSize: '0.86rem' }}>
                  <thead className="bg-light text-muted">
                    <tr>
                      <th>Estudiante</th>
                      <th>Tipo de Cambio</th>
                      <th>Ruta Origen (🔴 Sale)</th>
                      <th>Ruta Destino (🟢 Entra)</th>
                      <th>Vigencia</th>
                      <th>Motivo / Solicitante</th>
                      <th className="text-end" style={{ width: 100 }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudiantesConCambios.map(est => {
                      const cambios = (est.datos_actualizados?.cambios_transporte_temporales || []).filter((c: any) =>
                        c.activo && hoyStr >= c.fecha_inicio && hoyStr <= c.fecha_fin
                      );

                      return cambios.map((cambio: any) => (
                        <tr key={`${est.id}-${cambio.id}`}>
                          <td>
                            <div className="fw-bold text-dark">{est.nombres_estudiante} {est.apellidos_estudiante}</div>
                            <small className="text-muted">C.I. {est.cedula_estudiante || 'Sin cédula'} &bull; {est.grado_actual || ''} {est.seccion_actual || ''}</small>
                          </td>
                          <td>
                            <span className="badge rounded-pill bg-warning text-dark fw-bold px-2.5 py-1">
                              {cambio.tipo === 'ida_temporal' && '🌅 Ida Temporal'}
                              {cambio.tipo === 'retorno_temporal' && '🌇 Retorno Temporal'}
                              {cambio.tipo === 'ambos_temporal' && '🔄 Ida y Retorno'}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1">
                              🔴 {cambio.ruta_origen}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                              🟢 {cambio.ruta_destino}
                            </span>
                          </td>
                          <td>
                            <div className="small fw-semibold text-dark">{cambio.fecha_inicio} al {cambio.fecha_fin}</div>
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>Expira al día siguiente</small>
                          </td>
                          <td>
                            <div className="small text-truncate" style={{ maxWidth: 180 }}>{cambio.motivo}</div>
                            <small className="text-muted d-block">{cambio.representante_solicita || 'Rep. Legal'}</small>
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-xs btn-outline-danger rounded-pill px-2.5 py-1 fw-bold"
                              onClick={() => revocarCambioTemporal(est.id, cambio.id)}
                              title="Revocar cambio temporal y regresar a ruta original"
                            >
                              <i className="bi bi-x-circle me-1"></i>Revocar
                            </button>
                          </td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            PESTAÑA 4: CONTROL Y DESPACHO GLOBAL
            ══════════════════════════════════════════════════════════════════════ */}
        {tabActiva === 'control_global' && (
          <div className="p-2 p-md-3">
            <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-1.5">
              <i className="bi bi-cpu text-primary"></i>
              <span>Panel de Control Máster y Supervisión de Rutas</span>
            </h6>

            <div className="row g-3 g-md-4">
              {/* Tarjeta: Salida Masiva */}
              <div className="col-12 col-md-6">
                <div className="p-4 bg-white border rounded-4 shadow-sm h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="p-2 bg-success bg-opacity-10 text-success rounded-3">
                        <i className="bi bi-play-circle-fill fs-4"></i>
                      </div>
                      <div>
                        <h6 className="fw-bold text-dark mb-0">Declarar Salida Masiva</h6>
                        <small className="text-muted">Despacho simultáneo de la flota escolar</small>
                      </div>
                    </div>
                    <p className="small text-muted mb-4">
                      Activa automáticamente el recorrido de todas las rutas escolares activas en el sentido de salida, despachando notificaciones globales a los representantes y poniendo las unidades en estado <b>En Ruta</b>.
                    </p>
                  </div>
                  <button
                    className="btn btn-success text-white rounded-pill py-2.5 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 w-100"
                    onClick={salidaMasiva}
                  >
                    <i className="bi bi-broadcast"></i>
                    <span>DECLARAR SALIDA MASIVA AHORA</span>
                  </button>
                </div>
              </div>

              {/* Tarjeta: Reinicio de Sistemas */}
              <div className="col-12 col-md-6">
                <div className="p-4 bg-white border rounded-4 shadow-sm h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="p-2 bg-danger bg-opacity-10 text-danger rounded-3">
                        <i className="bi bi-arrow-counterclockwise fs-4"></i>
                      </div>
                      <div>
                        <h6 className="fw-bold text-dark mb-0">Reiniciar Sistemas de Recorrido</h6>
                        <small className="text-muted">Limpieza de operaciones del día</small>
                      </div>
                    </div>
                    <p className="small text-muted mb-4">
                      Restaura el estado de las rutas de hoy a su condición inicial previa al despacho. Útil si hubo un simulacro, error de marcado o necesidad de reiniciar el seguimiento para la siguiente jornada.
                    </p>
                  </div>
                  <button
                    className="btn btn-outline-danger rounded-pill py-2.5 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 w-100"
                    onClick={resetMasivo}
                  >
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <span>REINICIAR SISTEMAS Y RECORRIDOS</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: APLICAR CAMBIO DE RUTA (TEMPORAL O DEFINITIVO)
          ══════════════════════════════════════════════════════════════════════ */}
      {showModalCambio && (
        <div className="modal-backdrop-custom show" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', zIndex: 2050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow-lg border-0 rounded-4 animate__animated animate__zoomIn" style={{ width: '92%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header bg-white pt-3 pb-2 px-4 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-arrow-left-right text-warning"></i>
                <span>Gestionar Cambio de Ruta</span>
              </h5>
              <button type="button" className="btn-close" onClick={() => setShowModalCambio(false)}></button>
            </div>

            <div className="card-body p-4">
              {/* Selector / Buscador de Estudiante */}
              <div className="mb-3">
                <label className="form-label fw-bold small text-dark">1. Estudiante</label>
                {formCambio.estudianteId ? (
                  <div className="p-2.5 bg-light border rounded-3 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold text-dark">{formCambio.estudianteNombre}</div>
                      <small className="text-muted">C.I. {formCambio.cedulaEstudiante || 'Sin cédula'} &bull; Ruta actual: <b>{formCambio.rutaOrigen || 'Sin ruta'}</b></small>
                    </div>
                    <button className="btn btn-xs btn-outline-secondary rounded-pill" onClick={() => setFormCambio({ ...formCambio, estudianteId: '', estudianteNombre: '', rutaOrigen: '', paradaOrigen: '' })}>
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      className="form-control form-control-sm rounded-3 mb-2"
                      placeholder="Escriba nombre o cédula para buscar estudiante..."
                      value={busquedaEstudiante}
                      onChange={e => setBusquedaEstudiante(e.target.value)}
                    />
                    {busquedaEstudiante.trim().length > 1 && (
                      <div className="border rounded-3 p-1 bg-white shadow-xs" style={{ maxHeight: 160, overflowY: 'auto' }}>
                        {(estudiantes || [])
                          .filter(e => {
                            const q = busquedaEstudiante.toLowerCase();
                            const nom = `${e.nombres_estudiante || ''} ${e.apellidos_estudiante || ''}`.toLowerCase();
                            const ced = (e.cedula_estudiante || '').toLowerCase();
                            return nom.includes(q) || ced.includes(q);
                          })
                          .slice(0, 8)
                          .map(e => (
                            <div
                              key={e.id}
                              className="p-2 hover-bg rounded-2 cursor-pointer border-bottom small d-flex justify-content-between align-items-center"
                              onClick={() => {
                                const d = e.datos_actualizados || {};
                                setFormCambio({
                                  ...formCambio,
                                  estudianteId: e.id,
                                  estudianteNombre: `${e.nombres_estudiante || ''} ${e.apellidos_estudiante || ''}`.trim(),
                                  cedulaEstudiante: e.cedula_estudiante || '',
                                  rutaOrigen: d.ruta_transporte || '',
                                  paradaOrigen: d.parada_transporte || '',
                                  representanteSolicita: `${e.nombres_representante || ''} ${e.apellidos_representante || ''}`.trim()
                                });
                                setBusquedaEstudiante('');
                              }}
                            >
                              <div>
                                <span className="fw-bold text-dark">{e.nombres_estudiante} {e.apellidos_estudiante}</span>
                                <span className="text-muted ms-2">({e.grado_actual || ''} {e.seccion_actual || ''})</span>
                              </div>
                              <span className="badge bg-light text-primary border">Seleccionar</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selector de Tipo de Cambio (4 Casos) */}
              <div className="mb-3">
                <label className="form-label fw-bold small text-dark">2. Tipo de Solicitud de Cambio</label>
                <div className="row g-2">
                  {[
                    { id: 'ida_temporal', label: '🌅 Ida a la Escuela (Temporal)', desc: 'Solo trayecto de la mañana' },
                    { id: 'retorno_temporal', label: '🌇 Retorno a Casa (Temporal)', desc: 'Solo trayecto de la tarde' },
                    { id: 'ambos_temporal', label: '🔄 Ida y Retorno (Temporal)', desc: 'Ambos trayectos del día' },
                    { id: 'definitivo', label: '⭐ Cambio Definitivo', desc: 'Actualiza su ficha permanente' }
                  ].map(tc => (
                    <div key={tc.id} className="col-6">
                      <div
                        className={`p-2.5 rounded-3 border text-start cursor-pointer transition-all ${
                          formCambio.tipoCambio === tc.id ? 'border-primary bg-primary bg-opacity-10 shadow-xs' : 'bg-light border'
                        }`}
                        onClick={() => setFormCambio({ ...formCambio, tipoCambio: tc.id as any })}
                      >
                        <div className="fw-bold text-dark small">{tc.label}</div>
                        <div className="text-muted extra-small">{tc.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ruta y Parada de Destino */}
              <div className="row g-2 mb-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold small text-dark">3. Nueva Ruta a la que va</label>
                  <select
                    className="form-select form-select-sm rounded-3"
                    value={formCambio.rutaDestino}
                    onChange={e => setFormCambio({ ...formCambio, rutaDestino: e.target.value, paradaDestino: '' })}
                  >
                    <option value="">-- Seleccionar ruta destino --</option>
                    {rutas.map(r => (
                      <option key={r.id} value={r.nombre}>{r.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label fw-bold small text-dark">Parada Asignada</label>
                  <select
                    className="form-select form-select-sm rounded-3"
                    value={formCambio.paradaDestino}
                    onChange={e => setFormCambio({ ...formCambio, paradaDestino: e.target.value })}
                  >
                    <option value="">-- Seleccionar parada --</option>
                    {(() => {
                      const rObj = rutas.find(r => r.nombre === formCambio.rutaDestino);
                      let pids: string[] = [];
                      if (rObj) {
                        if (Array.isArray(rObj.paradas_json)) pids = rObj.paradas_json;
                        else if (typeof rObj.paradas_json === 'string') {
                          try { pids = JSON.parse(rObj.paradas_json); } catch (e) {}
                        }
                      }
                      const paradasDeRuta = paradas.filter(p => pids.includes(p.id));
                      return paradasDeRuta.map(p => (
                        <option key={p.id} value={p.nombre_parada}>{p.nombre_parada}</option>
                      ));
                    })()}
                  </select>
                </div>
              </div>

              {/* Rango de Fechas (Solo si es temporal) */}
              {formCambio.tipoCambio !== 'definitivo' && (
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label fw-bold small text-dark">Fecha Inicio</label>
                    <input
                      type="date"
                      className="form-control form-control-sm rounded-3"
                      value={formCambio.fechaInicio}
                      onChange={e => setFormCambio({ ...formCambio, fechaInicio: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-bold small text-dark">Fecha Fin (Vence al día siguiente)</label>
                    <input
                      type="date"
                      className="form-control form-control-sm rounded-3"
                      value={formCambio.fechaFin}
                      onChange={e => setFormCambio({ ...formCambio, fechaFin: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Motivo y Representante */}
              <div className="mb-3">
                <label className="form-label fw-bold small text-dark">Motivo de la Solicitud</label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3"
                  placeholder="Ej: Permiso especial para quedarse con familiar, mudanza temporal, etc."
                  value={formCambio.motivo}
                  onChange={e => setFormCambio({ ...formCambio, motivo: e.target.value })}
                />
              </div>

              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                <button className="btn btn-sm btn-light rounded-pill px-3" onClick={() => setShowModalCambio(false)}>
                  Cancelar
                </button>
                <button
                  className="btn btn-sm btn-primary rounded-pill px-4 fw-bold shadow-xs"
                  onClick={guardarCambioRuta}
                  disabled={guardandoCambio}
                >
                  {guardandoCambio ? 'Guardando...' : 'Aplicar Cambio de Ruta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
