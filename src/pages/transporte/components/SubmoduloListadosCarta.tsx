import React, { useState, useMemo, useRef } from 'react';
import { supabase } from '../../../lib/supabase';

interface SubmoduloListadosCartaProps {
  onBack?: () => void;
  escCodigo: 'sb' | 'lb';
  estudiantes: any[];
  rutas: any[];
  paradas: any[];
  docentes: any[];
  cargarTodo: (silencioso?: boolean) => Promise<void>;
  user: any;
}

export const SubmoduloListadosCarta: React.FC<SubmoduloListadosCartaProps> = ({
  onBack,
  escCodigo,
  estudiantes,
  rutas,
  paradas,
  docentes,
  cargarTodo,
  user
}) => {
  const Swal = (window as any).Swal;
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Modo de vista: 'editor' (Visualizar y Editar Transporte) vs 'imprimir_carta' (Listado Oficial Tipo Carta)
  const [modoVista, setModoVista] = useState<'editor' | 'imprimir_carta'>('imprimir_carta');

  // Filtros del Editor
  const [busqueda, setBusqueda] = useState('');
  const [filtroRutaEditor, setFiltroRutaEditor] = useState<string>('todas');
  const [filtroEstadoActualizacion, setFiltroEstadoActualizacion] = useState<string>('todos');
  const [paginaEditor, setPaginaEditor] = useState(1);
  const itemsPorPagina = 12;

  // Ruta seleccionada para la impresión tipo carta
  const [rutaSeleccionadaCarta, setRutaSeleccionadaCarta] = useState<string>(rutas[0]?.nombre || '');
  const [paradaFiltroCarta, setParadaFiltroCarta] = useState<string>('todas');

  // Modal para edición in-situ de Transporte de un Estudiante
  const [estudianteEditando, setEstudianteEditando] = useState<any | null>(null);
  const [rutaFormEdit, setRutaFormEdit] = useState('');
  const [paradaFormEdit, setParadaFormEdit] = useState('');
  const [requiereTransFormEdit, setRequiereTransFormEdit] = useState(true);
  const [telefonoRepEdit, setTelefonoRepEdit] = useState('');
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // Helper para determinar el Nivel Educativo a partir del grado/año
  const obtenerNivelEducativo = (gradoStr?: string): string => {
    if (!gradoStr) return 'No especificado';
    const g = gradoStr.toLowerCase().trim();
    if (g.includes('maternal') || g.includes('preescolar') || g.includes('inicial') || g.includes('sala')) {
      return 'Educación Inicial';
    }
    if (g.includes('grado') || g.includes('1er') || g.includes('2do') || g.includes('3er') || g.includes('4to') || g.includes('5to') || g.includes('6to')) {
      // Diferenciar si es primaria o bachillerato
      if (g.includes('año') || g.includes('ano')) return 'Educación Media';
      return 'Educación Primaria';
    }
    if (g.includes('año') || g.includes('ano') || g.includes('media') || g.includes('tecnica') || g.includes('técnica') || g.includes('bachiller')) {
      return 'Educación Media General';
    }
    return 'Educación Primaria';
  };

  // Filtrado de estudiantes para el editor
  const estudiantesFiltradosEditor = useMemo(() => {
    return (estudiantes || []).filter(est => {
      const d = est.datos_actualizados || {};
      const tieneActualizacion = !!(d.actualizacion_completada || d.fecha_actualizacion || est.fecha_ultima_actualizacion);
      
      if (filtroEstadoActualizacion === 'actualizados' && !tieneActualizacion) return false;
      if (filtroEstadoActualizacion === 'pendientes' && tieneActualizacion) return false;

      const rAsignada = d.ruta_transporte || 'Sin ruta';
      if (filtroRutaEditor !== 'todas') {
        if (filtroRutaEditor === 'sin_ruta' && d.ruta_transporte) return false;
        if (filtroRutaEditor !== 'sin_ruta' && rAsignada !== filtroRutaEditor) return false;
      }

      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const nom = `${est.nombres_estudiante || ''} ${est.apellidos_estudiante || ''}`.toLowerCase();
        const ced = (est.cedula_estudiante || '').toLowerCase();
        const rep = `${est.nombres_representante || ''} ${est.apellidos_representante || ''}`.toLowerCase();
        const tel = (d.representante_telefono || '').toLowerCase();
        return nom.includes(q) || ced.includes(q) || rep.includes(q) || tel.includes(q);
      }

      return true;
    });
  }, [estudiantes, busqueda, filtroRutaEditor, filtroEstadoActualizacion]);

  const totalPaginasEditor = Math.ceil(estudiantesFiltradosEditor.length / itemsPorPagina);
  const paginatedEstudiantesEditor = estudiantesFiltradosEditor.slice((paginaEditor - 1) * itemsPorPagina, paginaEditor * itemsPorPagina);

  // Estudiantes que pertenecen a la ruta seleccionada para la carta
  const estudiantesRutaCarta = useMemo(() => {
    if (!rutaSeleccionadaCarta) return [];
    const rTarget = rutaSeleccionadaCarta.toLowerCase().trim();

    return (estudiantes || []).filter(est => {
      const d = est.datos_actualizados || {};
      const estRuta = String(d.ruta_transporte || '').toLowerCase().trim();
      const coincideRuta = estRuta === rTarget;
      if (!coincideRuta) return false;

      if (paradaFiltroCarta !== 'todas') {
        const estParada = String(d.parada_transporte || '').toLowerCase().trim();
        return estParada === paradaFiltroCarta.toLowerCase().trim();
      }

      return true;
    }).sort((a, b) => {
      const nomA = `${a.apellidos_estudiante || ''} ${a.nombres_estudiante || ''}`.toLowerCase();
      const nomB = `${b.apellidos_estudiante || ''} ${b.nombres_estudiante || ''}`.toLowerCase();
      return nomA.localeCompare(nomB);
    });
  }, [estudiantes, rutaSeleccionadaCarta, paradaFiltroCarta]);

  // Ficha de la ruta seleccionada
  const rutaObjetoCarta = rutas.find(r => r.nombre === rutaSeleccionadaCarta);
  const docenteRutaCarta = docentes.find(d => d.id_usuario === rutaObjetoCarta?.docente_id);

  // Paradas de la ruta seleccionada para filtro de carta
  const paradasDeRutaCarta = useMemo(() => {
    if (!rutaObjetoCarta) return [];
    let pids: string[] = [];
    if (Array.isArray(rutaObjetoCarta.paradas_json)) pids = rutaObjetoCarta.paradas_json;
    else if (typeof rutaObjetoCarta.paradas_json === 'string') {
      try { pids = JSON.parse(rutaObjetoCarta.paradas_json); } catch (e) {}
    }
    return paradas.filter(p => pids.includes(p.id));
  }, [rutaObjetoCarta, paradas]);

  // Abrir modal de edición rápida para un estudiante
  const abrirEditorTransporte = (est: any) => {
    const d = est.datos_actualizados || {};
    setEstudianteEditando(est);
    setRutaFormEdit(d.ruta_transporte || '');
    setParadaFormEdit(d.parada_transporte || '');
    setRequiereTransFormEdit(d.requiere_transporte !== false);
    setTelefonoRepEdit(d.representante_telefono || est.representante_telefono || '');
  };

  // Guardar edición rápida de transporte
  const guardarEdicionTransporte = async () => {
    if (!estudianteEditando) return;
    setGuardandoEdicion(true);

    try {
      const datosPrevios = estudianteEditando.datos_actualizados || {};
      const updatedDatos = {
        ...datosPrevios,
        ruta_transporte: rutaFormEdit,
        parada_transporte: paradaFormEdit,
        requiere_transporte: requiereTransFormEdit,
        representante_telefono: telefonoRepEdit || datosPrevios.representante_telefono,
        asignado_por_coordinacion_transporte: true,
        fecha_asignacion_transporte: new Date().toISOString()
      };

      const { error } = await supabase
        .from('estudiantes_vinculaciones')
        .update({
          datos_actualizados: updatedDatos,
          fecha_ultima_actualizacion: new Date().toISOString()
        })
        .eq('id', estudianteEditando.id);

      if (error) throw error;
      Swal.fire('Guardado', 'Los datos de transporte del estudiante han sido actualizados con éxito.', 'success');
      setEstudianteEditando(null);
      await cargarTodo(true);
    } catch (err: any) {
      console.error('Error guardando asignación de transporte:', err);
      Swal.fire('Error', err.message || 'No se pudo guardar la asignación.', 'error');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  // Ejecutar impresión limpia en hoja Carta
  const imprimirListadoCarta = () => {
    window.print();
  };

  return (
    <div className="transporte-submod-card card-list animate__animated animate__fadeInRight mb-4">
      {/* ── BARRA SUPERIOR DEL SUBMÓDULO ── */}
      <div className="transporte-submod-card-header d-print-none">
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
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)'
              }}
            >
              <i className="bi bi-file-earmark-text-fill fs-5"></i>
            </div>
            <div>
              <h5 className="fw-black text-dark mb-0 d-flex align-items-center gap-2" style={{ fontSize: '1.2rem', letterSpacing: '-0.3px' }}>
                <span>Censo y Listados Oficiales (Hoja Tipo Carta)</span>
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
                Visualización y edición in-situ de rutas estudiantiles y descarga/impresión en formato institucional Carta.
              </small>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-bold d-flex align-items-center gap-1.5 shadow-xs transition-all ${
                modoVista === 'imprimir_carta' ? 'text-white' : 'btn-light border text-muted'
              }`}
              style={{
                background: modoVista === 'imprimir_carta' 
                  ? (escCodigo === 'sb' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #0062ff 0%, #0047d9 100%)')
                  : undefined,
                border: modoVista === 'imprimir_carta' ? 'none' : undefined
              }}
              onClick={() => setModoVista('imprimir_carta')}
            >
              <i className="bi bi-printer-fill"></i>
              <span>Listado Oficial Tipo Carta</span>
            </button>

            <button
              className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-bold d-flex align-items-center gap-1.5 shadow-xs transition-all ${
                modoVista === 'editor' ? 'text-white' : 'btn-light border text-muted'
              }`}
              style={{
                background: modoVista === 'editor' 
                  ? (escCodigo === 'sb' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #0062ff 0%, #0047d9 100%)')
                  : undefined,
                border: modoVista === 'editor' ? 'none' : undefined
              }}
              onClick={() => setModoVista('editor')}
            >
              <i className="bi bi-pencil-square"></i>
              <span>Editar Asignaciones de Alumnos</span>
            </button>
          </div>
        </div>
      </div>

      <div className="card-body p-3 p-md-4">
        {/* ══════════════════════════════════════════════════════════════════════
            VISTA 1: LISTADO OFICIAL TIPO CARTA (FORMATO CONSTANCIAS DE ESTUDIO)
            ══════════════════════════════════════════════════════════════════════ */}
        {modoVista === 'imprimir_carta' && (
          <div>
            {/* Controles de Selección de Ruta y Filtros (Ocultos al Imprimir) */}
            <div className="bg-light p-3 rounded-4 border mb-4 d-print-none shadow-xs">
              <div className="row g-2 g-md-3 align-items-end">
                <div className="col-12 col-md-5">
                  <label className="form-label small fw-bold text-dark mb-1 d-flex align-items-center gap-1">
                    <i className="bi bi-signpost-2-fill text-primary"></i>
                    <span>Seleccionar Ruta para el Listado</span>
                  </label>
                  <select
                    className="form-select form-select-sm rounded-3 fw-bold"
                    value={rutaSeleccionadaCarta}
                    onChange={e => { setRutaSeleccionadaCarta(e.target.value); setParadaFiltroCarta('todas'); }}
                  >
                    {rutas.map(r => (
                      <option key={r.id} value={r.nombre}>{r.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small fw-bold text-dark mb-1 d-flex align-items-center gap-1">
                    <i className="bi bi-geo-alt-fill text-warning"></i>
                    <span>Filtrar por Parada (Opcional)</span>
                  </label>
                  <select
                    className="form-select form-select-sm rounded-3"
                    value={paradaFiltroCarta}
                    onChange={e => setParadaFiltroCarta(e.target.value)}
                  >
                    <option value="todas">-- Todas las paradas de la ruta --</option>
                    {paradasDeRutaCarta.map(p => (
                      <option key={p.id} value={p.nombre_parada}>{p.nombre_parada}</option>
                    ))}
                  </select>
                </div>

                <div className="col-12 col-md-3 text-md-end">
                  <button
                    className="btn btn-sm btn-success rounded-pill px-4 py-2 fw-bold text-white shadow-sm d-inline-flex align-items-center gap-2 w-100 justify-content-center"
                    onClick={imprimirListadoCarta}
                  >
                    <i className="bi bi-printer-fill fs-6"></i>
                    <span>Imprimir en Hoja Carta</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── CONTENEDOR DEL DOCUMENTO OFICIAL AJUSTADO A HOJA TIPO CARTA ── */}
            <div ref={printAreaRef} className="seccion-imprimible-carta mx-auto">
              <style>{`
                @media print {
                  @page {
                    size: letter portrait;
                    margin: 10mm;
                  }
                  body * {
                    visibility: hidden !important;
                  }
                  .seccion-imprimible-carta, .seccion-imprimible-carta * {
                    visibility: visible !important;
                  }
                  .seccion-imprimible-carta {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    box-shadow: none !important;
                    border: none !important;
                  }
                  .d-print-none {
                    display: none !important;
                  }
                }

                .seccion-imprimible-carta {
                  width: 100%;
                  max-width: 816px; /* 8.5 inches standard Letter @ 96 DPI */
                  min-height: 1056px; /* 11 inches standard Letter @ 96 DPI */
                  background: #ffffff;
                  border: 1px solid #cbd5e1;
                  border-radius: 8px;
                  padding: 24px 30px;
                  box-sizing: border-box;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
                  font-family: Arial, Helvetica, sans-serif;
                  color: #000000;
                }

                .tabla-oficial-carta {
                  width: 100%;
                  border-collapse: collapse;
                  font-size: 11px;
                }
                .tabla-oficial-carta th {
                  background-color: #f1f5f9;
                  color: #0f172a;
                  font-weight: bold;
                  text-align: left;
                  padding: 6px 8px;
                  border: 1px solid #94a3b8;
                  font-size: 10px;
                  text-transform: uppercase;
                }
                .tabla-oficial-carta td {
                  padding: 5px 8px;
                  border: 1px solid #cbd5e1;
                  font-size: 10.5px;
                  line-height: 1.25;
                }
                .tabla-oficial-carta tr:nth-child(even) {
                  background-color: #f8fafc;
                }
              `}</style>

              {/* 1. MEMBRETE INSTITUCIONAL OFICIAL VENEZOLANO MPPE */}
              <div className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom border-dark">
                <div style={{ width: 68, flexShrink: 0 }}>
                  <img
                    src={`/assets/img/logo_${escCodigo}.png`}
                    alt="Escudo Institucional"
                    style={{ width: 64, height: 64, objectFit: 'contain' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                  />
                </div>

                <div className="text-center flex-grow-1 px-2" style={{ lineHeight: '1.25' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#1e293b' }}>
                    REPÚBLICA BOLIVARIANA DE VENEZUELA
                  </div>
                  <div style={{ fontSize: '9.5px', fontWeight: 'bold', textTransform: 'uppercase', color: '#334155' }}>
                    MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#0f172a', marginTop: 2 }}>
                    {escCodigo === 'sb' ? 'U.E. SANTA BÁRBARA' : 'U.E. LIBERTADOR BOLÍVAR'}
                  </div>
                  <div style={{ fontSize: '9px', color: '#475569' }}>
                    COORDINACIÓN GENERAL DE TRANSPORTE ESCOLAR Y MOVILIDAD
                  </div>
                </div>

                <div style={{ width: 68, flexShrink: 0, textAlign: 'right' }}>
                  <img
                    src="/assets/img/sigae.png"
                    alt="SIGAE"
                    style={{ width: 56, height: 56, objectFit: 'contain' }}
                  />
                </div>
              </div>

              {/* 2. CINTILLO Y TÍTULO DEL DOCUMENTO */}
              <div className="text-center my-2">
                <h6 style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px', color: '#0f172a' }}>
                  LISTADO OFICIAL DE ESTUDIANTES POR RUTA DE TRANSPORTE
                </h6>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0284c7', textTransform: 'uppercase', marginTop: 2 }}>
                  {rutaSeleccionadaCarta.toUpperCase()}
                  {paradaFiltroCarta !== 'todas' && ` — PARADA: ${paradaFiltroCarta.toUpperCase()}`}
                </div>
              </div>

              {/* 3. FICHA TÉCNICA DE LA RUTA */}
              <div className="p-2 bg-light rounded border mb-3" style={{ fontSize: '10px', lineHeight: '1.4' }}>
                <div className="row g-1">
                  <div className="col-4">
                    <b>Conductor:</b> {rutaObjetoCarta?.chofer_nombre || 'Asignado institucional'}
                  </div>
                  <div className="col-4">
                    <b>Docente de Guardia:</b> {docenteRutaCarta?.nombre_completo || 'Docente asignado'}
                  </div>
                  <div className="col-4">
                    <b>Teléfono Docente:</b> {docenteRutaCarta?.telefono || 'No registrado'}
                  </div>
                  <div className="col-4">
                    <b>Unidad / Placa:</b> {rutaObjetoCarta?.unidad_placa || 'Oficial SIGAE'}
                  </div>
                  <div className="col-4">
                    <b>Total Estudiantes:</b> <b>{estudiantesRutaCarta.length}</b> pasajeros
                  </div>
                  <div className="col-4">
                    <b>Fecha de Emisión:</b> {new Date().toLocaleDateString('es-VE')}
                  </div>
                </div>
              </div>

              {/* 4. TABLA OFICIAL (N°, Nombres y Apellidos, Nivel Educativo, Grado/Año/Sección, Teléfono) */}
              {estudiantesRutaCarta.length === 0 ? (
                <div className="text-center py-5 text-muted fst-italic">
                  No hay estudiantes registrados o asignados a esta ruta de transporte escolar.
                </div>
              ) : (
                <table className="tabla-oficial-carta mb-4">
                  <thead>
                    <tr>
                      <th style={{ width: 32, textAlign: 'center' }}>N°</th>
                      <th>NOMBRES Y APELLIDOS DEL ESTUDIANTE</th>
                      <th style={{ width: 140 }}>NIVEL EDUCATIVO</th>
                      <th style={{ width: 130 }}>GRADO / AÑO Y SECCIÓN</th>
                      <th style={{ width: 150 }}>TELÉFONO DEL REPRESENTANTE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudiantesRutaCarta.map((est, idx) => {
                      const d = est.datos_actualizados || {};
                      const tlf = d.representante_telefono || est.representante_telefono || d.madre_telefono || d.padre_telefono;
                      const gradoSec = `${est.grado_actual || d.grado || ''} ${est.seccion_actual || d.seccion || ''}`.trim() || 'No asignado';
                      const nivel = obtenerNivelEducativo(gradoSec);
                      const faltaTelefono = !tlf || tlf.trim().length < 7;

                      return (
                        <tr key={est.id}>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                          <td>
                            <div style={{ fontWeight: 'bold', color: '#0f172a' }}>
                              {est.apellidos_estudiante}, {est.nombres_estudiante}
                            </div>
                            <div style={{ fontSize: '9px', color: '#64748b' }}>
                              C.I. {est.cedula_estudiante || 'Sin cédula'} &bull; Parada: <b>{d.parada_transporte || 'General'}</b>
                            </div>
                          </td>
                          <td>{nivel}</td>
                          <td>{gradoSec}</td>
                          <td>
                            {faltaTelefono ? (
                              <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '9.5px', background: '#fee2e2', padding: '1px 5px', borderRadius: '3px' }}>
                                ⚠️ Teléfono no registrado
                              </span>
                            ) : (
                              <span style={{ fontWeight: 'bold', color: '#166534' }}>
                                📞 {tlf}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* 5. BLOQUE DE FIRMAS OFICIALES AL PIE */}
              <div className="pt-4 mt-auto" style={{ borderTop: '1px dashed #cbd5e1' }}>
                <div className="row text-center" style={{ fontSize: '10px' }}>
                  <div className="col-4">
                    <div style={{ height: 38 }}></div>
                    <div style={{ borderTop: '1px solid #000000', margin: '0 15px 3px' }}></div>
                    <b>COORDINADOR DE TRANSPORTE</b>
                    <div style={{ fontSize: '9px', color: '#475569' }}>Firma y C.I.</div>
                  </div>

                  <div className="col-4">
                    <div style={{ height: 38 }}></div>
                    <div style={{ borderTop: '1px solid #000000', margin: '0 15px 3px' }}></div>
                    <b>DOCENTE DE GUARDIA</b>
                    <div style={{ fontSize: '9px', color: '#475569' }}>Firma de Validación</div>
                  </div>

                  <div className="col-4">
                    <div style={{ height: 38 }}></div>
                    <div style={{ borderTop: '1px solid #000000', margin: '0 15px 3px' }}></div>
                    <b>DIRECCIÓN DEL PLANTEL</b>
                    <div style={{ fontSize: '9px', color: '#475569' }}>Sello Húmedo Institucional</div>
                  </div>
                </div>

                <div className="text-center mt-3" style={{ fontSize: '8px', color: '#94a3b8' }}>
                  SIGAE Escolar v1.1 &bull; Documento Institucional Tipo Carta &bull; Control y Monitoreo de Transporte
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            VISTA 2: VISUALIZACIÓN Y EDICIÓN IN-SITU DE TRANSPORTE
            ══════════════════════════════════════════════════════════════════════ */}
        {modoVista === 'editor' && (
          <div>
            {/* Filtros de Búsqueda */}
            <div className="row g-2 mb-3">
              <div className="col-12 col-md-5">
                <input
                  type="text"
                  className="form-control form-control-sm rounded-pill ps-3 bg-light border"
                  placeholder="Buscar alumno por nombre, cédula o representante..."
                  value={busqueda}
                  onChange={e => { setBusqueda(e.target.value); setPaginaEditor(1); }}
                />
              </div>

              <div className="col-6 col-md-3">
                <select
                  className="form-select form-select-sm rounded-pill bg-light border"
                  value={filtroRutaEditor}
                  onChange={e => { setFiltroRutaEditor(e.target.value); setPaginaEditor(1); }}
                >
                  <option value="todas">-- Todas las rutas --</option>
                  <option value="sin_ruta">⚠️ Sin ruta asignada</option>
                  {rutas.map(r => (
                    <option key={r.id} value={r.nombre}>{r.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="col-6 col-md-4">
                <select
                  className="form-select form-select-sm rounded-pill bg-light border"
                  value={filtroEstadoActualizacion}
                  onChange={e => { setFiltroEstadoActualizacion(e.target.value); setPaginaEditor(1); }}
                >
                  <option value="todos">-- Todos los estados de ficha --</option>
                  <option value="actualizados">✅ Con actualización completada</option>
                  <option value="pendientes">⏳ Pendientes por actualizar</option>
                </select>
              </div>
            </div>

            {/* Tabla del Editor */}
            <div className="table-responsive">
              <table className="table table-hover align-middle border rounded-4 overflow-hidden mb-0" style={{ fontSize: '0.86rem' }}>
                <thead className="bg-light text-muted">
                  <tr>
                    <th>Estudiante</th>
                    <th>Grado y Sección</th>
                    <th>Ruta Asignada</th>
                    <th>Parada Asignada</th>
                    <th>Representante y Teléfono</th>
                    <th>Ficha General</th>
                    <th className="text-end" style={{ width: 130 }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEstudiantesEditor.map(est => {
                    const d = est.datos_actualizados || {};
                    const tieneRuta = !!d.ruta_transporte;
                    const tieneAct = !!(d.actualizacion_completada || d.fecha_actualizacion || est.fecha_ultima_actualizacion);
                    const tlf = d.representante_telefono || est.representante_telefono || d.madre_telefono;

                    return (
                      <tr key={est.id}>
                        <td>
                          <div className="fw-bold text-dark">{est.nombres_estudiante} {est.apellidos_estudiante}</div>
                          <small className="text-muted">C.I. {est.cedula_estudiante || 'Sin cédula'}</small>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {est.grado_actual || d.grado || 'S/A'} {est.seccion_actual || d.seccion || ''}
                          </span>
                        </td>
                        <td>
                          {tieneRuta ? (
                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-1">
                              🚍 {d.ruta_transporte}
                            </span>
                          ) : (
                            <span className="badge bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-25 px-2 py-1">
                              ⚠️ Sin ruta asignada
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="small text-dark fw-semibold">
                            {d.parada_transporte || <span className="text-muted fst-italic">Sin parada</span>}
                          </span>
                        </td>
                        <td>
                          <div className="small fw-semibold text-dark">{est.nombres_representante || 'Rep. Legal'}</div>
                          {tlf ? (
                            <small className="text-success fw-bold d-block">📞 {tlf}</small>
                          ) : (
                            <small className="text-danger fw-bold d-block">⚠️ Teléfono faltante</small>
                          )}
                        </td>
                        <td>
                          <span className={`badge rounded-pill ${tieneAct ? 'bg-success text-white' : 'bg-secondary text-white'}`} style={{ fontSize: '0.7rem' }}>
                            {tieneAct ? 'Actualizado' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-xs btn-primary rounded-pill px-3 py-1 fw-bold shadow-xs"
                            onClick={() => abrirEditorTransporte(est)}
                            title="Editar o fijar datos de transporte escolar"
                          >
                            <i className="bi bi-pencil-square me-1"></i>Editar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPaginasEditor > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                <small className="text-muted">Página {paginaEditor} de {totalPaginasEditor} &bull; Total {estudiantesFiltradosEditor.length} alumnos</small>
                <div className="btn-group btn-group-sm">
                  <button className="btn btn-outline-secondary" disabled={paginaEditor === 1} onClick={() => setPaginaEditor(p => p - 1)}>
                    Anterior
                  </button>
                  <button className="btn btn-outline-secondary" disabled={paginaEditor === totalPaginasEditor} onClick={() => setPaginaEditor(p => p + 1)}>
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Asignación / Edición Rápida de Transporte */}
      {estudianteEditando && (
        <div className="modal-backdrop-custom show" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', zIndex: 2050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card shadow-lg border-0 rounded-4 animate__animated animate__zoomIn" style={{ width: '92%', maxWidth: '540px' }}>
            <div className="card-header bg-white pt-3 pb-2 px-4 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-bus-front text-primary"></i>
                <span>Fijar Transporte Escolar</span>
              </h5>
              <button type="button" className="btn-close" onClick={() => setEstudianteEditando(null)}></button>
            </div>

            <div className="card-body p-4">
              <div className="p-3 bg-light rounded-3 mb-3 border">
                <div className="fw-bold text-dark">{estudianteEditando.nombres_estudiante} {estudianteEditando.apellidos_estudiante}</div>
                <small className="text-muted">
                  C.I. {estudianteEditando.cedula_estudiante || 'Sin cédula'} &bull; {estudianteEditando.grado_actual || ''} {estudianteEditando.seccion_actual || ''}
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold">Ruta Escolar Asignada</label>
                <select
                  className="form-select form-select-sm rounded-3 fw-bold"
                  value={rutaFormEdit}
                  onChange={e => { setRutaFormEdit(e.target.value); setParadaFormEdit(''); }}
                >
                  <option value="">-- Sin ruta asignada --</option>
                  {rutas.map(r => (
                    <option key={r.id} value={r.nombre}>{r.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold">Parada Asignada</label>
                <select
                  className="form-select form-select-sm rounded-3"
                  value={paradaFormEdit}
                  onChange={e => setParadaFormEdit(e.target.value)}
                >
                  <option value="">-- Seleccionar parada --</option>
                  {(() => {
                    const rObj = rutas.find(r => r.nombre === rutaFormEdit);
                    let pids: string[] = [];
                    if (rObj) {
                      if (Array.isArray(rObj.paradas_json)) pids = rObj.paradas_json;
                      else if (typeof rObj.paradas_json === 'string') {
                        try { pids = JSON.parse(rObj.paradas_json); } catch (e) {}
                      }
                    }
                    const paradasDeRuta = paradas.filter(p => pids.includes(p.id));
                    return (paradasDeRuta.length > 0 ? paradasDeRuta : paradas).map(p => (
                      <option key={p.id} value={p.nombre_parada}>{p.nombre_parada}</option>
                    ));
                  })()}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-bold">Teléfono del Representante Legal</label>
                <input
                  type="text"
                  className="form-control form-control-sm rounded-3"
                  placeholder="Ej: 0414-1234567"
                  value={telefonoRepEdit}
                  onChange={e => setTelefonoRepEdit(e.target.value)}
                />
              </div>

              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="requiereTransCheck"
                  checked={requiereTransFormEdit}
                  onChange={e => setRequiereTransFormEdit(e.target.checked)}
                />
                <label className="form-check-label small fw-semibold text-dark" htmlFor="requiereTransCheck">
                  Requiere servicio de transporte escolar
                </label>
              </div>

              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                <button className="btn btn-sm btn-light rounded-pill px-3" onClick={() => setEstudianteEditando(null)}>
                  Cancelar
                </button>
                <button
                  className="btn btn-sm btn-primary rounded-pill px-4 fw-bold shadow-xs"
                  onClick={guardarEdicionTransporte}
                  disabled={guardandoEdicion}
                >
                  {guardandoEdicion ? 'Guardando...' : 'Guardar Asignación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
