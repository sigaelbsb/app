import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';

export const AuditoriaSistema = () => {
  const navigate = useNavigate();
  const { tienePermiso, loading: permLoading } = usePermisos();

  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Unique users for filter
  const [usuariosUnicos, setUsuariosUnicos] = useState<string[]>([]);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);

  // Filters & Pagination
  const [filtroEscuela, setFiltroEscuela] = useState('TODAS');
  const [filtroUsuario, setFiltroUsuario] = useState('TODOS');
  const [orden, setOrden] = useState('FECHA_DESC');
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 15;

  const Swal = (window as any).Swal;

  useEffect(() => {
    if (!permLoading && tienePermiso('Auditoría del Sistema', 'ver')) {
      cargarHistorial();
    }
  }, [permLoading]);

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('historial_auditoria')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) throw error;
      setRegistros(data || []);

      // Gather unique users
      const usersSet = new Set((data || []).map(r => r.usuario_nombre).filter(Boolean));
      setUsuariosUnicos(Array.from(usersSet).sort());
    } catch (e) {
      console.error(e);
      if (Swal) Swal.fire('Error', 'No se pudo cargar el historial de auditoría.', 'error');
    }
    setLoading(false);
  };

  if (permLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5 h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!tienePermiso('Auditoría del Sistema', 'ver')) {
    return (
      <div className="col-12 text-center py-5 mt-4">
        <div className="bg-light d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm border" style={{ width: '100px', height: '100px' }}>
          <i className="bi bi-shield-lock-fill text-muted" style={{ fontSize: '3.5rem' }}></i>
        </div>
        <h4 className="text-dark fw-bold mb-2">Área Restringida</h4>
        <p className="text-muted mb-0">No tienes permisos asignados para visualizar el historial del sistema.</p>
      </div>
    );
  }

  const pExportar = tienePermiso('Auditoría del Sistema', 'exportar');
  const pEliminar = tienePermiso('Auditoría del Sistema', 'eliminar');

  // Filter and Sort
  const registrosFiltrados = registros.filter(r => {
    if (filtroUsuario !== 'TODOS' && r.usuario_nombre !== filtroUsuario) return false;
    if (filtroEscuela !== 'TODAS' && r.escuela !== filtroEscuela) return false;
    return true;
  });

  registrosFiltrados.sort((a, b) => {
    if (orden === 'FECHA_DESC') return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    if (orden === 'FECHA_ASC') return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
    if (orden === 'ACCION_AZ') return (a.accion || '').localeCompare(b.accion || '');
    return 0;
  });

  // Pagination
  const totalPaginas = Math.ceil(registrosFiltrados.length / itemsPorPagina) || 1;
  const indexInicio = (paginaActual - 1) * itemsPorPagina;
  const registrosPaginados = registrosFiltrados.slice(indexInicio, indexInicio + itemsPorPagina);

  const cambiarPagina = (pag: number) => {
    if (pag >= 1 && pag <= totalPaginas) {
      setPaginaActual(pag);
      // Reset selected checkboxes for new page
      setSeleccionados([]);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageIds = registrosPaginados.map(r => r.id);
      setSeleccionados(pageIds);
    } else {
      setSeleccionados([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSeleccionados(prev => {
      if (checked) {
        return [...prev, id];
      } else {
        return prev.filter(x => x !== id);
      }
    });
  };

  const obtenerRegistrosSeleccionados = () => {
    if (seleccionados.length === 0) {
      return registrosFiltrados;
    }
    return registrosFiltrados.filter(r => seleccionados.includes(r.id));
  };

  // Actions
  const exportarCSV = () => {
    if (!pExportar) {
      if (Swal) Swal.fire('Denegado', 'No posees privilegios de exportación.', 'error');
      return;
    }

    const datos = obtenerRegistrosSeleccionados();
    if (datos.length === 0) {
      if (Swal) Swal.fire('Aviso', 'No hay datos para exportar con el filtro actual.', 'warning');
      return;
    }

    let csvContent = "FECHA,ESCUELA,USUARIO,CEDULA,MODULO,ACCION,DETALLES\n";
    datos.forEach(r => {
      let f = new Date(r.fecha).toLocaleString('es-VE');
      let det = (r.detalles || "").replace(/"/g, '""').replace(/\n/g, " ");
      csvContent += `"${f}","${r.escuela}","${r.usuario_nombre}","${r.usuario_cedula}","${r.modulo}","${r.accion}","${det}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Auditoria_SIGAE_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarExcel = () => {
    if (!pExportar) {
      if (Swal) Swal.fire('Denegado', 'No posees privilegios de exportación.', 'error');
      return;
    }

    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      if (Swal) Swal.fire('Error', 'La librería Excel no está cargada.', 'error');
      return;
    }

    const datos = obtenerRegistrosSeleccionados();
    if (datos.length === 0) {
      if (Swal) Swal.fire('Aviso', 'No hay datos para exportar con el filtro actual.', 'warning');
      return;
    }

    const dataLimpia = datos.map(r => ({
      "Fecha y Hora": new Date(r.fecha).toLocaleString('es-VE'),
      "Escuela": r.escuela === 'lb' ? 'Libertador Bolívar' : (r.escuela === 'sb' ? 'Santa Bárbara' : r.escuela),
      "Usuario": r.usuario_nombre,
      "Cédula": r.usuario_cedula,
      "Módulo": r.modulo,
      "Acción": r.accion,
      "Detalles Adicionales": r.detalles || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataLimpia);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Auditoría");
    XLSX.writeFile(workbook, `Auditoria_SIGAE_${new Date().getTime()}.xlsx`);
  };

  const eliminarSeleccionados = () => {
    if (!pEliminar) {
      if (Swal) Swal.fire('Denegado', 'No posees privilegios para alterar el historial.', 'error');
      return;
    }

    if (seleccionados.length === 0) {
      if (Swal) Swal.fire('Aviso', 'Selecciona al menos un registro de esta página para eliminar.', 'warning');
      return;
    }

    if (!Swal) return;

    Swal.fire({
      title: '¿Eliminar registros?',
      text: `Vas a borrar ${seleccionados.length} evento(s) del historial de auditoría. ¡Esto no se puede deshacer!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, borrar definitivamente',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase
            .from('historial_auditoria')
            .delete()
            .in('id', seleccionados);

          if (error) throw error;

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Registros eliminados', showConfirmButton: false, timer: 1500 });
          setSeleccionados([]);
          cargarHistorial();
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudieron eliminar los registros.', 'error');
        }
        setLoading(false);
      }
    });
  };

  const mantenimientoTotal = () => {
    if (!pExportar || !pEliminar) {
      if (Swal) Swal.fire('Acceso Denegado', 'Se requieren privilegios máximos (Exportar y Eliminar) para el mantenimiento del historial.', 'error');
      return;
    }

    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      if (Swal) Swal.fire('Error', 'La librería Excel no está cargada.', 'error');
      return;
    }

    const datosAfectados = registrosFiltrados;
    if (datosAfectados.length === 0) {
      if (Swal) Swal.fire('Aviso', 'No hay registros para la selección actual.', 'warning');
      return;
    }

    if (!Swal) return;

    const tituloMensaje = filtroEscuela === 'TODAS'
      ? 'Mantenimiento Total (Ambas Escuelas)'
      : `Mantenimiento: ${filtroEscuela === 'lb' ? 'Libertador Bolívar' : 'Santa Bárbara'}`;

    Swal.fire({
      title: tituloMensaje,
      html: `Esta acción generará un <b>Respaldo Excel Completo</b> (${datosAfectados.length} registros filtrados) y luego <b>VACIARÁ</b> los registros correspondientes de la tabla de auditoría para liberar espacio.<br/><br/>¿Deseas continuar?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6c757d',
      confirmButtonText: '<i class="bi bi-database-down me-1"></i> Sí, Ejecutar Servicio',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        // 1. Export Excel
        const dataLimpia = datosAfectados.map(r => ({
          "Fecha y Hora": new Date(r.fecha).toLocaleString('es-VE'),
          "Escuela": r.escuela === 'lb' ? 'Libertador Bolívar' : (r.escuela === 'sb' ? 'Santa Bárbara' : r.escuela),
          "Usuario": r.usuario_nombre,
          "Cédula": r.usuario_cedula,
          "Módulo": r.modulo,
          "Acción": r.accion,
          "Detalles Adicionales": r.detalles || ""
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataLimpia);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Respaldo Auditoria");
        XLSX.writeFile(workbook, `Respaldo_Mantenimiento_Auditoria_${filtroEscuela}_${new Date().getTime()}.xlsx`);

        // 2. Clear Database rows
        setLoading(true);
        try {
          let query = supabase.from('historial_auditoria').delete().not('id', 'is', null);
          if (filtroEscuela !== 'TODAS') {
            query = query.eq('escuela', filtroEscuela);
          }

          const { error } = await query;
          if (error) throw error;

          Swal.fire('Servicio Completado', 'El respaldo se descargó y el historial fue vaciado exitosamente.', 'success');

          // 3. Write new audit record for the purge
          let codEscuelaAuditoria = filtroEscuela !== 'TODAS' ? filtroEscuela : 'Ambas';
          await auditar('Auditoría del Sistema', 'Mantenimiento', `Se descargó respaldo y se vació historial de ${codEscuelaAuditoria} (${datosAfectados.length} eventos).`);

          cargarHistorial();
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Se descargó el respaldo pero falló el vaciado en el servidor.', 'error');
        }
        setLoading(false);
      }
    });
  };

  return (
    <div className="row g-4 container-fluid p-0 animate__animated animate__fadeIn">
      {/* Banner */}
      <div className="col-12 animate__animated animate__fadeInDown">
        <div 
          className="banner-modulo p-4 p-md-5 text-white shadow-sm" 
          style={{ background: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
        >
          <div className="burbuja-3d burbuja-1" style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.15)', position: 'absolute', top: '-50px', right: '-20px', borderRadius: '50%' }}></div>
          <div className="burbuja-3d burbuja-2" style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.08)', position: 'absolute', bottom: '-20px', left: '20px', borderRadius: '50%' }}></div>
          <div className="row align-items-center position-relative z-1">
            <div className="col-12 text-center text-md-start">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <span className="badge bg-white text-secondary px-3 py-2 shadow-sm fw-bold" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>
                  <i className="bi bi-shield-lock me-1"></i> SEGURIDAD Y ACCESOS
                </span>
                <button 
                  onClick={() => navigate('/categoria/Seguridad%20y%20Accesos')} 
                  className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                >
                  <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
                </button>
              </div>
              <h1 className="fw-bolder mb-2 text-white" style={{ fontSize: '2.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                <i className="bi bi-clock-history me-3"></i>Auditoría del Sistema
              </h1>
              <p className="mb-0 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Historial detallado de movimientos y acciones de los usuarios.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="col-12 animate__animated animate__fadeInUp">
        <div className="card border-0 shadow-sm rounded-4 h-100" style={{ borderTop: '5px solid #475569 !important' }}>
          <div className="card-header bg-white border-bottom p-4">
            <div className="row g-3 align-items-end">
              <div className="col-md-2">
                <label className="small fw-bold text-muted mb-1"><i className="bi bi-building me-1"></i>Escuela</label>
                <select 
                  className="form-select input-moderno border-primary fw-bold"
                  value={filtroEscuela}
                  onChange={(e) => { setFiltroEscuela(e.target.value); setPaginaActual(1); }}
                >
                  <option value="TODAS">Ambas Escuelas</option>
                  <option value="lb">UE Libertador Bolívar</option>
                  <option value="sb">UE Santa Bárbara</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="small fw-bold text-muted mb-1"><i className="bi bi-person me-1"></i>Filtrar por Usuario</label>
                <select 
                  className="form-select input-moderno"
                  value={filtroUsuario}
                  onChange={(e) => { setFiltroUsuario(e.target.value); setPaginaActual(1); }}
                >
                  <option value="TODOS">Todos los usuarios</option>
                  {usuariosUnicos.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <label className="small fw-bold text-muted mb-1"><i className="bi bi-sort-down me-1"></i>Ordenar por</label>
                <select 
                  className="form-select input-moderno"
                  value={orden}
                  onChange={(e) => { setOrden(e.target.value); setPaginaActual(1); }}
                >
                  <option value="FECHA_DESC">Más recientes primero</option>
                  <option value="FECHA_ASC">Más antiguos primero</option>
                  <option value="ACCION_AZ">Acción (A-Z)</option>
                </select>
              </div>
              <div className="col-md-5 text-md-end">
                {pExportar && pEliminar && (
                  <button 
                    className="btn text-white fw-bold shadow-sm rounded-pill px-3 me-1 hover-efecto" 
                    style={{ backgroundColor: '#f59e0b' }} 
                    onClick={mantenimientoTotal} 
                    title="Descargar todo en Excel y Vaciar historial"
                  >
                    <i className="bi bi-database-down me-1"></i> Servicio
                  </button>
                )}
                {pExportar && (
                  <React.Fragment>
                    <button 
                      className="btn btn-success fw-bold shadow-sm rounded-pill px-3 me-1 hover-efecto" 
                      onClick={exportarExcel} 
                      title="Exportar seleccionados a Excel"
                    >
                      <i className="bi bi-file-earmark-excel-fill"></i> Excel
                    </button>
                    <button 
                      className="btn btn-dark fw-bold shadow-sm rounded-pill px-3 me-1 hover-efecto" 
                      onClick={exportarCSV} 
                      title="Exportar seleccionados a CSV"
                    >
                      <i className="bi bi-ubuntu"></i> CSV
                    </button>
                  </React.Fragment>
                )}
                {pEliminar && (
                  <button 
                    className="btn btn-danger fw-bold shadow-sm rounded-pill px-3 hover-efecto" 
                    onClick={eliminarSeleccionados} 
                    title="Eliminar registros seleccionados de la página"
                  >
                    <i className="bi bi-trash3-fill"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="card-body p-0">
            {loading ? (
              <div className="d-flex justify-content-center align-items-center py-5">
                <div className="spinner-border text-secondary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light text-muted small">
                    <tr>
                      <th className="ps-4 text-center" style={{ width: '50px' }}>
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          checked={registrosPaginados.length > 0 && seleccionados.length === registrosPaginados.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          disabled={!pEliminar && !pExportar}
                          style={{ cursor: 'pointer' }}
                        />
                      </th>
                      <th>Fecha y Hora</th>
                      <th>Escuela</th>
                      <th>Usuario (Cédula)</th>
                      <th>Módulo</th>
                      <th>Acción Realizada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrosPaginados.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-5 text-muted">
                          <i className="bi bi-clipboard-x fs-1 d-block mb-3"></i>
                          No hay registros para este filtro.
                        </td>
                      </tr>
                    ) : (
                      registrosPaginados.map(r => {
                        const isRowSelected = seleccionados.includes(r.id);
                        return (
                          <tr key={r.id} className="align-middle hover-efecto">
                            <td className="text-center ps-4">
                              <input 
                                className="form-check-input" 
                                type="checkbox"
                                checked={isRowSelected}
                                onChange={(e) => handleSelectRow(r.id, e.target.checked)}
                                disabled={!pEliminar && !pExportar}
                                style={{ cursor: 'pointer' }}
                              />
                            </td>
                            <td className="fw-bold text-dark small">
                              <i className="bi bi-clock me-1 text-muted"></i>
                              {new Date(r.fecha).toLocaleString('es-VE')}
                            </td>
                            <td>
                              {r.escuela === 'lb' ? (
                                <span className="badge bg-primary text-white">L.B.</span>
                              ) : r.escuela === 'sb' ? (
                                <span className="badge bg-success text-white">S.B.</span>
                              ) : (
                                <span className="badge bg-dark">N/A</span>
                              )}
                            </td>
                            <td>
                              <div className="fw-bold text-primary">{r.usuario_nombre}</div>
                              <div className="small text-muted">C.I: {r.usuario_cedula}</div>
                            </td>
                            <td>
                              <span className="badge bg-secondary bg-opacity-10 text-secondary border">
                                {r.modulo}
                              </span>
                            </td>
                            <td>
                              <div className="fw-bold text-dark small">{r.accion}</div>
                              <div 
                                className="small text-muted text-truncate" 
                                style={{ maxWidth: '250px' }} 
                                title={r.detalles || ''}
                              >
                                {r.detalles || '-'}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="card-footer bg-white border-top p-3 d-flex justify-content-center rounded-bottom-4">
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${paginaActual === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => cambiarPagina(paginaActual - 1)}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
                  <li key={p} className={`page-item ${paginaActual === p ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => cambiarPagina(p)}>{p}</button>
                  </li>
                ))}
                <li className={`page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => cambiarPagina(paginaActual + 1)}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};
