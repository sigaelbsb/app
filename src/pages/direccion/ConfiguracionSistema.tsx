import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';

interface ConfigItem {
  id_parametro: string;
  valor: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  estado?: 'Activo' | 'Próximo' | 'Finalizado' | 'Sin Fechas';
}

export const ConfiguracionSistema = () => {
  const navigate = useNavigate();
  const { tienePermiso, loading: permLoading } = usePermisos();
  const Swal = (window as any).Swal;

  const [periodos, setPeriodos] = useState<ConfigItem[]>([]);
  const [lapsos, setLapsos] = useState<ConfigItem[]>([]);
  const [niveles, setNiveles] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Checks for each card
  const hasVerPeriodos = tienePermiso('Tarjeta: Períodos Escolares', 'ver');
  const hasVerLapsos = tienePermiso('Tarjeta: Lapsos Académicos', 'ver');
  const hasVerNiveles = tienePermiso('Tarjeta: Niveles Educativos', 'ver');

  const hasCrearPeriodos = tienePermiso('Tarjeta: Períodos Escolares', 'crear');
  const hasCrearLapsos = tienePermiso('Tarjeta: Lapsos Académicos', 'crear');
  const hasCrearNiveles = tienePermiso('Tarjeta: Niveles Educativos', 'crear');

  const hasEliminarPeriodos = tienePermiso('Tarjeta: Períodos Escolares', 'eliminar');
  const hasEliminarLapsos = tienePermiso('Tarjeta: Lapsos Académicos', 'eliminar');
  const hasEliminarNiveles = tienePermiso('Tarjeta: Niveles Educativos', 'eliminar');

  const isModuleRestricted = !permLoading && !tienePermiso('Configuración del Sistema', 'ver');

  useEffect(() => {
    if (!permLoading && tienePermiso('Configuración del Sistema', 'ver')) {
      cargarConfiguraciones();
    }
  }, [permLoading]);

  const procesarConFechas = (data: any[]): ConfigItem[] => {
    const hoy = new Date().getTime();
    return data.map(item => {
      let estadoDinamico: 'Activo' | 'Próximo' | 'Finalizado' | 'Sin Fechas' = 'Sin Fechas';
      if (item.fecha_inicio && item.fecha_fin) {
        const pIn = new Date(item.fecha_inicio + "T00:00:00").getTime();
        const pOut = new Date(item.fecha_fin + "T23:59:59").getTime();
        if (hoy < pIn) estadoDinamico = 'Próximo';
        else if (hoy > pOut) estadoDinamico = 'Finalizado';
        else estadoDinamico = 'Activo';
      }
      return {
        id_parametro: item.id_parametro,
        valor: item.valor,
        fecha_inicio: item.fecha_inicio,
        fecha_fin: item.fecha_fin,
        estado: estadoDinamico
      };
    });
  };

  const cargarConfiguraciones = async () => {
    setLoading(true);
    try {
      const [perRes, lapRes, nivRes] = await Promise.all([
        supabase.from('conf_periodos').select('*').order('valor', { ascending: false }),
        supabase.from('conf_lapsos').select('*').order('valor', { ascending: true }),
        supabase.from('conf_niveles').select('*').order('valor', { ascending: true })
      ]);

      if (perRes.error) throw perRes.error;
      if (lapRes.error) throw lapRes.error;
      if (nivRes.error) throw nivRes.error;

      setPeriodos(procesarConFechas(perRes.data || []));
      setLapsos(procesarConFechas(lapRes.data || []));
      setNiveles((nivRes.data || []).map(n => ({ id_parametro: n.id_parametro, valor: n.valor })));
    } catch (e: any) {
      console.error(e);
      if (e.code === 'PGRST205' || (e.message && e.message.includes('Could not find the table'))) {
        if (Swal) {
          Swal.fire({
            title: 'Tablas de Configuración No Encontradas',
            html: `Las tablas de configuración (<code>conf_periodos</code>, <code>conf_lapsos</code> o <code>conf_niveles</code>) no existen en el esquema de su base de datos Supabase.<br><br>Por favor, ejecute la consulta SQL de creación provista en el panel de Supabase.`,
            icon: 'warning',
            confirmButtonColor: '#4F46E5'
          });
        }
      } else {
        if (Swal) Swal.fire("Error", "No se pudieron cargar las configuraciones.", "error");
      }
    }
    setLoading(false);
  };

  const nuevoParametro = (categoria: 'conf_periodos' | 'conf_lapsos' | 'conf_niveles', requiereFechas: boolean = true) => {
    const cardName = categoria === 'conf_periodos' ? 'Tarjeta: Períodos Escolares' : (categoria === 'conf_lapsos' ? 'Tarjeta: Lapsos Académicos' : 'Tarjeta: Niveles Educativos');
    if (!tienePermiso(cardName, 'crear')) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para crear registros en esta categoría.', 'error');
      return;
    }

    if (!Swal) return;

    let htmlForm = `<input type="text" id="swal-valor" class="swal2-input input-moderno mb-3" placeholder="Ej: ${categoria === 'conf_periodos' ? '2025 - 2026' : (categoria === 'conf_lapsos' ? '1er Momento' : 'Educación Media')}">`;
    if (requiereFechas) {
      htmlForm += `
        <div class="row text-start mt-3">
          <div class="col-6">
            <label class="small fw-bold text-muted mb-1">Inicio</label>
            <input type="date" id="swal-inicio" class="swal2-input m-0 w-100 input-moderno text-muted">
          </div>
          <div class="col-6">
            <label class="small fw-bold text-muted mb-1">Fin</label>
            <input type="date" id="swal-fin" class="swal2-input m-0 w-100 input-moderno text-muted">
          </div>
        </div>`;
    }

    Swal.fire({
      title: 'Nuevo Registro',
      html: htmlForm,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      confirmButtonColor: '#4F46E5',
      preConfirm: () => {
        const valor = (document.getElementById('swal-valor') as HTMLInputElement).value;
        if (!valor || !valor.trim()) {
          Swal.showValidationMessage('El valor es obligatorio');
          return false;
        }
        let inicio = null, fin = null;
        if (requiereFechas) {
          inicio = (document.getElementById('swal-inicio') as HTMLInputElement).value;
          fin = (document.getElementById('swal-fin') as HTMLInputElement).value;
          if (!inicio || !fin) {
            Swal.showValidationMessage('Fechas obligatorias');
            return false;
          }
        }
        return { valor: valor.trim(), inicio, fin };
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const payload: any = {
            id_parametro: "CONF-" + new Date().getTime(),
            valor: result.value.valor
          };
          if (requiereFechas) {
            payload.fecha_inicio = result.value.inicio;
            payload.fecha_fin = result.value.fin;
          }

          const { error } = await supabase.from(categoria).insert([payload]);
          if (error) throw error;

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Guardado exitosamente', showConfirmButton: false, timer: 1500 });
          
          const catStr = categoria === 'conf_periodos' ? 'Periodo Escolar' : (categoria === 'conf_lapsos' ? 'Fase Escolar' : 'Nivel Educativo');
          auditar('Configuración del Sistema', 'Nuevo Parámetro', `Se agregó "${result.value.valor}" a la configuración de ${catStr}`);
          cargarConfiguraciones();
          window.dispatchEvent(new Event('sigae-config-changed'));
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo guardar el registro.', 'error');
          setLoading(false);
        }
      }
    });
  };

  const editarParametro = (item: ConfigItem, tabla: 'conf_periodos' | 'conf_lapsos' | 'conf_niveles', requiereFechas: boolean) => {
    const cardName = tabla === 'conf_periodos' ? 'Tarjeta: Períodos Escolares' : (tabla === 'conf_lapsos' ? 'Tarjeta: Lapsos Académicos' : 'Tarjeta: Niveles Educativos');
    if (!tienePermiso(cardName, 'crear')) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para editar registros en esta categoría.', 'error');
      return;
    }

    if (!Swal) return;

    const valIn = item.fecha_inicio || '';
    const valOut = item.fecha_fin || '';

    let htmlForm = `<input type="text" id="swal-valor-ed" class="swal2-input input-moderno mb-3" value="${item.valor}">`;
    if (requiereFechas) {
      htmlForm += `
        <div class="row text-start mt-3">
          <div class="col-6">
            <label class="small fw-bold text-muted mb-1">Inicio</label>
            <input type="date" id="swal-inicio-ed" class="swal2-input m-0 w-100 input-moderno text-muted" value="${valIn}">
          </div>
          <div class="col-6">
            <label class="small fw-bold text-muted mb-1">Fin</label>
            <input type="date" id="swal-fin-ed" class="swal2-input m-0 w-100 input-moderno text-muted" value="${valOut}">
          </div>
        </div>`;
    }

    Swal.fire({
      title: 'Editar Registro',
      html: htmlForm,
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      confirmButtonColor: '#0066FF',
      preConfirm: () => {
        const valor = (document.getElementById('swal-valor-ed') as HTMLInputElement).value;
        if (!valor || !valor.trim()) {
          Swal.showValidationMessage('El valor es obligatorio');
          return false;
        }
        let inicio = null, fin = null;
        if (requiereFechas) {
          inicio = (document.getElementById('swal-inicio-ed') as HTMLInputElement).value;
          fin = (document.getElementById('swal-fin-ed') as HTMLInputElement).value;
          if (!inicio || !fin) {
            Swal.showValidationMessage('Fechas obligatorias');
            return false;
          }
        }
        return { valor: valor.trim(), inicio, fin };
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const payload: any = { valor: result.value.valor };
          if (requiereFechas) {
            payload.fecha_inicio = result.value.inicio;
            payload.fecha_fin = result.value.fin;
          }

          const { error } = await supabase.from(tabla).update(payload).eq('id_parametro', item.id_parametro);
          if (error) throw error;

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Registro actualizado', showConfirmButton: false, timer: 1500 });
          auditar('Configuración del Sistema', 'Editar Parámetro', `Se actualizó un registro en la tabla ${tabla} al valor: ${result.value.valor}`);
          cargarConfiguraciones();
          window.dispatchEvent(new Event('sigae-config-changed'));
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo actualizar en la base de datos.', 'error');
          setLoading(false);
        }
      }
    });
  };

  const eliminarParametro = (id: string, tabla: 'conf_periodos' | 'conf_lapsos' | 'conf_niveles') => {
    const cardName = tabla === 'conf_periodos' ? 'Tarjeta: Períodos Escolares' : (tabla === 'conf_lapsos' ? 'Tarjeta: Lapsos Académicos' : 'Tarjeta: Niveles Educativos');
    if (!tienePermiso(cardName, 'eliminar')) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para eliminar registros.', 'error');
      return;
    }

    if (!Swal) return;

    Swal.fire({
      title: '¿Eliminar Registro?',
      text: "Esta acción no se puede deshacer y podría afectar la estructura escolar.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase.from(tabla).delete().eq('id_parametro', id);
          if (error) throw error;

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Registro eliminado', showConfirmButton: false, timer: 1500 });
          auditar('Configuración del Sistema', 'Eliminar Parámetro', `Se eliminó un parámetro de la tabla ${tabla}`);
          cargarConfiguraciones();
          window.dispatchEvent(new Event('sigae-config-changed'));
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo eliminar el registro.', 'error');
          setLoading(false);
        }
      }
    });
  };

  const abrirImportadorCSV = (tabla: 'conf_periodos' | 'conf_lapsos' | 'conf_niveles') => {
    const cardName = tabla === 'conf_periodos' ? 'Tarjeta: Períodos Escolares' : (tabla === 'conf_lapsos' ? 'Tarjeta: Lapsos Académicos' : 'Tarjeta: Niveles Educativos');
    if (!tienePermiso(cardName, 'crear')) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para importar registros.', 'error');
      return;
    }

    if (!Swal) return;

    Swal.fire({
      title: 'Carga Masiva CSV',
      html: `
        <div class="text-start">
          <p class="small text-muted mb-2">Sube un archivo <b>CSV (separado por punto y coma o comas)</b> con el formato correcto.</p>
          <p class="small text-muted mb-2">Columnas esperadas: <code>id_parametro</code>, <code>valor</code>, y opcionalmente <code>fecha_inicio</code>, <code>fecha_fin</code>.</p>
          <input type="file" id="file-csv-config" class="form-control border-primary" accept=".csv">
        </div>`,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-cloud-upload-fill me-1"></i> Procesar',
      confirmButtonColor: '#4F46E5',
      preConfirm: () => {
        const fileInput = document.getElementById('file-csv-config') as HTMLInputElement;
        const file = fileInput?.files ? fileInput.files[0] : null;
        if (!file) {
          Swal.showValidationMessage('Debes seleccionar un archivo CSV');
          return false;
        }
        return file;
      }
    }).then((res: any) => {
      if (res.isConfirmed) {
        procesarCSV(res.value, tabla);
      }
    });
  };

  const procesarCSV = (file: File, tabla: 'conf_periodos' | 'conf_lapsos' | 'conf_niveles') => {
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/);
      const validos: any[] = [];
      const rechazados: any[] = [];
      let startIndex = 0;
      
      if (lines.length > 0 && (lines[0].toLowerCase().includes('id_parametro') || lines[0].toLowerCase().includes('valor'))) {
        startIndex = 1;
      }

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const row = line.split(/[;,]/);
        
        if (row.length < 2) {
          rechazados.push({ linea: i + 1, datos: line, motivo: "Columnas insuficientes (se requiere id_parametro y valor)." });
          continue;
        }

        const id = row[0].trim();
        const valor = row[1].trim();
        const inicio = row.length > 2 ? row[2].trim() : null;
        const fin = row.length > 3 ? row[3].trim() : null;

        if (!id || !valor) {
          rechazados.push({ linea: i + 1, datos: line, motivo: "id_parametro o valor están en blanco." });
          continue;
        }

        const registro: any = { id_parametro: id, valor: valor };
        if (tabla !== 'conf_niveles') {
          if (inicio) registro.fecha_inicio = inicio;
          if (fin) registro.fecha_fin = fin;
        }
        validos.push(registro);
      }

      if (validos.length === 0 && rechazados.length === 0) {
        if (Swal) Swal.fire('Error', 'El archivo está vacío o el formato es incorrecto.', 'error');
        return;
      }

      setLoading(true);
      let insertados = 0;
      let actualizados = 0;

      try {
        if (validos.length > 0) {
          const idsNuevos = validos.map(v => v.id_parametro);
          const { data: existentes, error: queryErr } = await supabase.from(tabla).select('id_parametro').in('id_parametro', idsNuevos);
          if (queryErr) throw queryErr;
          
          const idsBD = (existentes || []).map(ex => ex.id_parametro);
          const registrosIns: any[] = [];
          const registrosUpd: any[] = [];

          validos.forEach(v => {
            if (idsBD.includes(v.id_parametro)) {
              registrosUpd.push(v);
            } else {
              registrosIns.push(v);
            }
          });

          if (registrosIns.length > 0) {
            const { error } = await supabase.from(tabla).insert(registrosIns);
            if (error) throw error;
            insertados = registrosIns.length;
          }

          if (registrosUpd.length > 0) {
            const { error } = await supabase.from(tabla).upsert(registrosUpd, { onConflict: 'id_parametro' });
            if (error) throw error;
            actualizados = registrosUpd.length;
          }
        }

        const htmlResumen = `
          <div class="text-start">
            <p class="mb-3 text-muted">Se leyeron <b>${validos.length + rechazados.length}</b> filas del archivo.</p>
            <div class="bg-light p-3 border rounded-3 mb-2">
              <p class="text-success m-0 fw-bold"><i class="bi bi-check-circle-fill me-2"></i>Nuevos agregados: ${insertados}</p>
              <p class="text-info m-0 mt-2 fw-bold"><i class="bi bi-arrow-repeat me-2"></i>Actualizados: ${actualizados}</p>
              <p class="text-danger m-0 mt-2 fw-bold"><i class="bi bi-x-circle-fill me-2"></i>Rechazados: ${rechazados.length}</p>
            </div>
          </div>`;

        let confText = '<i class="bi bi-check-lg"></i> Entendido';
        let cancelText = '';
        let showCancel = false;
        
        if (rechazados.length > 0) {
          showCancel = true;
          cancelText = '<i class="bi bi-download me-1"></i> Bajar Errores';
        }

        if (Swal) {
          Swal.fire({
            title: 'Resumen de Carga',
            html: htmlResumen,
            icon: rechazados.length > 0 ? 'warning' : 'success',
            showCancelButton: showCancel,
            confirmButtonText: confText,
            cancelButtonText: cancelText,
            cancelButtonColor: '#dc3545',
            confirmButtonColor: '#4F46E5',
            reverseButtons: true
          }).then((result: any) => {
            if (result.dismiss === Swal.DismissReason.cancel && rechazados.length > 0) {
              descargarRechazados(rechazados, tabla);
            }
          });
        }

        auditar('Configuración del Sistema', 'Carga Masiva', `Tabla: ${tabla}, Insertados: ${insertados}, Actualizados: ${actualizados}, Rechazados: ${rechazados.length}`);
        cargarConfiguraciones();
        window.dispatchEvent(new Event('sigae-config-changed'));
      } catch (errorDb: any) {
        if (Swal) Swal.fire('Error en Base de Datos', 'No se pudo procesar la carga masiva. ' + errorDb.message, 'error');
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const descargarRechazados = (rechazados: any[], tabla: string) => {
    let csv = "Linea_Excel;Datos_Originales;Motivo_del_Rechazo\n";
    rechazados.forEach(r => {
      const datosSafe = r.datos.replace(/"/g, '""');
      const motivoSafe = r.motivo.replace(/"/g, '""');
      csv += `${r.linea};"${datosSafe}";"${motivoSafe}"\n`;
    });
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Rechazados_${tabla}_${new Date().getTime()}.csv`;
    link.click();
  };

  if (permLoading || (loading && periodos.length === 0)) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5 h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (isModuleRestricted) {
    return (
      <div className="col-12 text-center py-5 mt-4">
        <div className="bg-light d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm border" style={{ width: '100px', height: '100px' }}>
          <i className="bi bi-shield-lock-fill text-muted" style={{ fontSize: '3.5rem' }}></i>
        </div>
        <h4 className="text-dark fw-bold mb-2">Área Restringida</h4>
        <p className="text-muted mb-0">No tienes permisos asignados para acceder a la configuración del sistema.</p>
      </div>
    );
  }

  return (
    <div className="modulo-animado">
      <div className="row mb-4 animate__animated animate__fadeInDown">
        <div className="col-12">
          <div 
            className="banner-modulo p-4 p-md-5 text-white shadow-sm" 
            style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
          >
            <div className="burbuja-3d burbuja-1"></div>
            <div className="burbuja-3d burbuja-2"></div>
            <div className="burbuja-3d burbuja-3"></div>
            <div className="row align-items-center position-relative z-1">
              <div className="col-12 text-center text-md-start mb-3 mb-md-0">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <span className="badge bg-white text-primary px-3 py-2 shadow-sm fw-bold">
                    <i className="bi bi-sliders me-1"></i> DIRECCIÓN Y SISTEMA
                  </span>
                  <button 
                    onClick={() => navigate('/categoria/Direcci%C3%B3n%20y%20Sistema')} 
                    className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                  >
                    <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
                  </button>
                </div>
                <h1 className="fw-bolder mb-2 text-white"><i className="bi bi-sliders me-3"></i>Configuración Global</h1>
                <p className="mb-0 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.8)' }}>Parámetros, años escolares y fases académicas del sistema.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 animate__animated animate__fadeIn">
        {/* Años Escolares */}
        {hasVerPeriodos && (
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center rounded-top-4">
                <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-calendar-event-fill me-2 text-primary"></i>Años Escolares</h5>
                <div className="d-flex gap-1">
                  {hasCrearPeriodos && (
                    <>
                      <button className="btn btn-sm btn-light border fw-bold shadow-sm" onClick={() => abrirImportadorCSV('conf_periodos')} title="Importar desde CSV">
                        <i className="bi bi-filetype-csv text-primary"></i>
                      </button>
                      <button className="btn btn-sm text-white fw-bold shadow-sm btn-primary" onClick={() => nuevoParametro('conf_periodos', true)}>
                        <i className="bi bi-plus-lg"></i>
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="card-body p-0">
                {periodos.length === 0 ? (
                  <div className="p-4 text-center text-muted">
                    <i className="bi bi-inbox fs-2"></i>
                    <p className="mb-0 small fw-bold mt-2">No hay registros</p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {periodos.map(item => (
                      <div key={item.id_parametro} className="list-group-item p-3 border-0 border-bottom d-flex justify-content-between align-items-center hover-efecto">
                        <div>
                          <div className="fw-bold text-dark d-flex align-items-center gap-2">
                            {item.valor}
                            {item.estado === 'Activo' && <span className="badge bg-success rounded-pill px-2 shadow-sm" style={{ fontSize: '0.7rem' }}>Activo</span>}
                            {item.estado === 'Próximo' && <span className="badge bg-warning text-dark rounded-pill px-2 shadow-sm" style={{ fontSize: '0.7rem' }}>Próximo</span>}
                            {item.estado === 'Finalizado' && <span className="badge bg-secondary rounded-pill px-2 shadow-sm" style={{ fontSize: '0.7rem' }}>Finalizado</span>}
                          </div>
                          <div className="small text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                            <i className="bi bi-calendar2-range me-1"></i>{item.fecha_inicio || '?'} al {item.fecha_fin || '?'}
                          </div>
                        </div>
                        <div className="d-flex">
                          {hasCrearPeriodos && (
                            <button 
                              className="btn btn-sm btn-light text-primary rounded-circle shadow-sm me-1" 
                              onClick={() => editarParametro(item, 'conf_periodos', true)}
                              title="Editar"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                          )}
                          {hasEliminarPeriodos && (
                            <button 
                              className="btn btn-sm btn-light text-danger rounded-circle shadow-sm" 
                              onClick={() => eliminarParametro(item.id_parametro, 'conf_periodos')}
                              title="Eliminar"
                            >
                              <i className="bi bi-trash3-fill"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fases Académicas (Lapsos) */}
        {hasVerLapsos && (
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center rounded-top-4">
                <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-clock-history me-2 text-info"></i>Fases Académicas</h5>
                <div className="d-flex gap-1">
                  {hasCrearLapsos && (
                    <>
                      <button className="btn btn-sm btn-light border fw-bold shadow-sm" onClick={() => abrirImportadorCSV('conf_lapsos')} title="Importar desde CSV">
                        <i className="bi bi-filetype-csv text-info"></i>
                      </button>
                      <button className="btn btn-sm text-white fw-bold shadow-sm btn-info" onClick={() => nuevoParametro('conf_lapsos', true)}>
                        <i className="bi bi-plus-lg"></i>
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="card-body p-0">
                {lapsos.length === 0 ? (
                  <div className="p-4 text-center text-muted">
                    <i className="bi bi-inbox fs-2"></i>
                    <p className="mb-0 small fw-bold mt-2">No hay registros</p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {lapsos.map(item => (
                      <div key={item.id_parametro} className="list-group-item p-3 border-0 border-bottom d-flex justify-content-between align-items-center hover-efecto">
                        <div>
                          <div className="fw-bold text-dark d-flex align-items-center gap-2">
                            {item.valor}
                            {item.estado === 'Activo' && <span className="badge bg-success rounded-pill px-2 shadow-sm" style={{ fontSize: '0.7rem' }}>Activo</span>}
                            {item.estado === 'Próximo' && <span className="badge bg-warning text-dark rounded-pill px-2 shadow-sm" style={{ fontSize: '0.7rem' }}>Próximo</span>}
                            {item.estado === 'Finalizado' && <span className="badge bg-secondary rounded-pill px-2 shadow-sm" style={{ fontSize: '0.7rem' }}>Finalizado</span>}
                          </div>
                          <div className="small text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                            <i className="bi bi-calendar2-range me-1"></i>{item.fecha_inicio || '?'} al {item.fecha_fin || '?'}
                          </div>
                        </div>
                        <div className="d-flex">
                          {hasCrearLapsos && (
                            <button 
                              className="btn btn-sm btn-light text-primary rounded-circle shadow-sm me-1" 
                              onClick={() => editarParametro(item, 'conf_lapsos', true)}
                              title="Editar"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                          )}
                          {hasEliminarLapsos && (
                            <button 
                              className="btn btn-sm btn-light text-danger rounded-circle shadow-sm" 
                              onClick={() => eliminarParametro(item.id_parametro, 'conf_lapsos')}
                              title="Eliminar"
                            >
                              <i className="bi bi-trash3-fill"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Niveles Educativos */}
        {hasVerNiveles && (
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center rounded-top-4">
                <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-mortarboard-fill me-2 text-success"></i>Niveles Educativos</h5>
                <div className="d-flex gap-1">
                  {hasCrearNiveles && (
                    <>
                      <button className="btn btn-sm btn-light border fw-bold shadow-sm" onClick={() => abrirImportadorCSV('conf_niveles')} title="Importar desde CSV">
                        <i className="bi bi-filetype-csv text-success"></i>
                      </button>
                      <button className="btn btn-sm text-white fw-bold shadow-sm btn-success" onClick={() => nuevoParametro('conf_niveles', false)}>
                        <i className="bi bi-plus-lg"></i>
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="card-body p-0">
                {niveles.length === 0 ? (
                  <div className="p-4 text-center text-muted">
                    <i className="bi bi-inbox fs-2"></i>
                    <p className="mb-0 small fw-bold mt-2">No hay registros</p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {niveles.map(item => (
                      <div key={item.id_parametro} className="list-group-item p-3 border-0 border-bottom d-flex justify-content-between align-items-center hover-efecto">
                        <div>
                          <div className="fw-bold text-dark d-flex align-items-center gap-2">
                            {item.valor}
                          </div>
                        </div>
                        <div className="d-flex">
                          {hasCrearNiveles && (
                            <button 
                              className="btn btn-sm btn-light text-primary rounded-circle shadow-sm me-1" 
                              onClick={() => editarParametro(item, 'conf_niveles', false)}
                              title="Editar"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                          )}
                          {hasEliminarNiveles && (
                            <button 
                              className="btn btn-sm btn-light text-danger rounded-circle shadow-sm" 
                              onClick={() => eliminarParametro(item.id_parametro, 'conf_niveles')}
                              title="Eliminar"
                            >
                              <i className="bi bi-trash3-fill"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
