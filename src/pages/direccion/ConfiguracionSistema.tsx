import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';
import * as XLSX from 'xlsx';
import { 
  ChamiloBreadcrumb, 
  ChamiloHelpCallout, 
  IconoConfiguracionSistema,
  IconoAnioEscolar,
  IconoLapsoAcademico,
  IconoNivelEducativo
} from '../../components/chamilo';

const ABREVIATURAS = ['DE', 'DEL', 'LA', 'LAS', 'LOS', 'Y', 'E', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const toTitulo = (value: string): string =>
  value
    .split(' ')
    .map(word => {
      const wUpper = word.toUpperCase();
      if (ABREVIATURAS.includes(wUpper)) {
        return wUpper;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

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
  const [tabActivo, setTabActivo] = useState<'periodos' | 'lapsos' | 'niveles' | 'todos'>('todos');
  const [filtroTexto, setFiltroTexto] = useState('');

  const escuelaCodigo = localStorage.getItem('sigae_escuela_codigo') || 'sb';
  const logoEscuela = localStorage.getItem(`sigae_logo_${escuelaCodigo}`) || `/assets/img/logo_${escuelaCodigo}.png`;

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

  const isModuleRestricted = !permLoading && !tienePermiso('Configuración Escolar', 'ver') && !tienePermiso('Configuración del Sistema', 'ver');

  useEffect(() => {
    if (!permLoading && (tienePermiso('Configuración Escolar', 'ver') || tienePermiso('Configuración del Sistema', 'ver'))) {
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
            confirmButtonColor: '#0066FF'
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

    const titulo = categoria === 'conf_periodos' ? 'Nuevo Año Escolar / Período' : (categoria === 'conf_lapsos' ? 'Nuevo Lapso / Momento' : 'Nuevo Nivel Educativo');
    const placeholder = categoria === 'conf_periodos' ? 'Ej: 2025 - 2026' : (categoria === 'conf_lapsos' ? 'Ej: 1er Lapso' : 'Ej: Educación Media General');

    let htmlForm = `
      <div class="text-start px-1">
        <label class="small fw-bold text-dark mb-1">Nombre o Denominación Oficial <span class="text-danger">*</span></label>
        <input type="text" id="swal-valor" class="form-control rounded-3 mb-3 fw-bold" placeholder="${placeholder}">
    `;

    if (requiereFechas) {
      htmlForm += `
        <div class="row g-2 mb-2">
          <div class="col-6">
            <label class="small fw-bold text-muted mb-1"><i class="bi bi-calendar-check me-1 text-primary"></i>Fecha de Inicio <span class="text-danger">*</span></label>
            <input type="date" id="swal-inicio" class="form-control form-control-sm rounded-3">
          </div>
          <div class="col-6">
            <label class="small fw-bold text-muted mb-1"><i class="bi bi-calendar-x me-1 text-danger"></i>Fecha de Cierre <span class="text-danger">*</span></label>
            <input type="date" id="swal-fin" class="form-control form-control-sm rounded-3">
          </div>
        </div>
      `;
    }
    htmlForm += `</div>`;

    const colorTema = categoria === 'conf_lapsos' ? '#00C3FF' : (categoria === 'conf_niveles' ? '#10b981' : '#FF8D00');

    Swal.fire({
      title: `<div class="d-flex align-items-center justify-content-center gap-2" style="color: ${colorTema}"><i class="bi bi-plus-circle-fill fs-3"></i><span>${titulo}</span></div>`,
      html: htmlForm,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-floppy-fill me-1"></i> Guardar Registro',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: colorTema,
      cancelButtonColor: '#64748b',
      preConfirm: () => {
        const valor = (document.getElementById('swal-valor') as HTMLInputElement).value;
        if (!valor || !valor.trim()) {
          Swal.showValidationMessage('El nombre es obligatorio');
          return false;
        }
        let inicio = null, fin = null;
        if (requiereFechas) {
          inicio = (document.getElementById('swal-inicio') as HTMLInputElement).value;
          fin = (document.getElementById('swal-fin') as HTMLInputElement).value;
          if (!inicio || !fin) {
            Swal.showValidationMessage('Ambas fechas (inicio y fin) son obligatorias');
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

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Registro guardado exitosamente', showConfirmButton: false, timer: 2000 });
          
          const catStr = categoria === 'conf_periodos' ? 'Periodo Escolar' : (categoria === 'conf_lapsos' ? 'Fase Escolar' : 'Nivel Educativo');
          auditar('Configuración Escolar', 'Nuevo Parámetro', `Se agregó "${result.value.valor}" a la configuración de ${catStr}`);
          cargarConfiguraciones();
          window.dispatchEvent(new Event('sigae-config-changed'));
        } catch (e: any) {
          console.error(e);
          Swal.fire('Error', e.message || 'No se pudo guardar el registro.', 'error');
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

    let htmlForm = `
      <div class="text-start px-1">
        <label class="small fw-bold text-dark mb-1">Nombre o Denominación <span class="text-danger">*</span></label>
        <input type="text" id="swal-valor-ed" class="form-control rounded-3 mb-3 fw-bold" value="${item.valor}">
    `;

    if (requiereFechas) {
      htmlForm += `
        <div class="row g-2 mb-2">
          <div class="col-6">
            <label class="small fw-bold text-muted mb-1"><i class="bi bi-calendar-check me-1 text-primary"></i>Fecha de Inicio</label>
            <input type="date" id="swal-inicio-ed" class="form-control form-control-sm rounded-3" value="${valIn}">
          </div>
          <div class="col-6">
            <label class="small fw-bold text-muted mb-1"><i class="bi bi-calendar-x me-1 text-danger"></i>Fecha de Cierre</label>
            <input type="date" id="swal-fin-ed" class="form-control form-control-sm rounded-3" value="${valOut}">
          </div>
        </div>
      `;
    }
    htmlForm += `</div>`;

    const colorTema = tabla === 'conf_lapsos' ? '#00C3FF' : (tabla === 'conf_niveles' ? '#10b981' : '#FF8D00');

    Swal.fire({
      title: `<div class="d-flex align-items-center justify-content-center gap-2" style="color: ${colorTema}"><i class="bi bi-pencil-square fs-3"></i><span>Editar Registro</span></div>`,
      html: htmlForm,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-check2-circle me-1"></i> Actualizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: colorTema,
      cancelButtonColor: '#64748b',
      preConfirm: () => {
        const valor = (document.getElementById('swal-valor-ed') as HTMLInputElement).value;
        if (!valor || !valor.trim()) {
          Swal.showValidationMessage('El nombre es obligatorio');
          return false;
        }
        let inicio = null, fin = null;
        if (requiereFechas) {
          inicio = (document.getElementById('swal-inicio-ed') as HTMLInputElement).value;
          fin = (document.getElementById('swal-fin-ed') as HTMLInputElement).value;
          if (!inicio || !fin) {
            Swal.showValidationMessage('Ambas fechas son obligatorias');
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

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Registro actualizado', showConfirmButton: false, timer: 2000 });
          auditar('Configuración Escolar', 'Editar Parámetro', `Se actualizó un registro en la tabla ${tabla} al valor: ${result.value.valor}`);
          cargarConfiguraciones();
          window.dispatchEvent(new Event('sigae-config-changed'));
        } catch (e: any) {
          console.error(e);
          Swal.fire('Error', e.message || 'No se pudo actualizar en la base de datos.', 'error');
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
      title: '<div class="text-danger d-flex align-items-center justify-content-center gap-2"><i class="bi bi-trash3-fill fs-3"></i><span>¿Eliminar Registro?</span></div>',
      html: '<p class="text-muted small mb-0">Esta acción no se puede deshacer y podría afectar reportes o estadísticas asociadas.</p>',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase.from(tabla).delete().eq('id_parametro', id);
          if (error) throw error;

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Registro eliminado', showConfirmButton: false, timer: 2000 });
          auditar('Configuración Escolar', 'Eliminar Parámetro', `Se eliminó un parámetro de la tabla ${tabla}`);
          cargarConfiguraciones();
          window.dispatchEvent(new Event('sigae-config-changed'));
        } catch (e: any) {
          console.error(e);
          Swal.fire('Error', e.message || 'No se pudo eliminar el registro.', 'error');
          setLoading(false);
        }
      }
    });
  };

  const descargarPlantillaConfig = (tabla: 'conf_periodos' | 'conf_lapsos' | 'conf_niveles', formato: 'xlsx' | 'csv') => {
    let wsData: any[][] = [];
    let nombreArchivo = "";
    if (tabla === 'conf_periodos') {
      wsData = [
        ['id_parametro', 'valor', 'fecha_inicio', 'fecha_fin'],
        ['PERIODO_ACTUAL', 'Año Escolar 2025-2026', '2025-09-15', '2026-07-15']
      ];
      nombreArchivo = "Plantilla_Periodos_Escolares";
    } else if (tabla === 'conf_lapsos') {
      wsData = [
        ['id_parametro', 'valor', 'fecha_inicio', 'fecha_fin'],
        ['LAPSO_1', 'Primer Lapso Académico', '2025-09-15', '2025-12-15'],
        ['LAPSO_2', 'Segundo Lapso Académico', '2026-01-07', '2026-03-30']
      ];
      nombreArchivo = "Plantilla_Lapsos_Academicos";
    } else {
      wsData = [
        ['id_parametro', 'valor'],
        ['NIVEL_INICIAL', 'Educación Inicial y Maternal'],
        ['NIVEL_PRIMARIA', 'Educación Primaria']
      ];
      nombreArchivo = "Plantilla_Niveles_Educativos";
    }

    if (formato === 'xlsx') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, "Configuracion");
      XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
    } else {
      const csvContent = wsData.map(row => row.join(';')).join('\n') + '\n';
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${nombreArchivo}.csv`;
      link.click();
    }
  };

  const abrirImportadorCSV = (tabla: 'conf_periodos' | 'conf_lapsos' | 'conf_niveles') => {
    const cardName = tabla === 'conf_periodos' ? 'Tarjeta: Períodos Escolares' : (tabla === 'conf_lapsos' ? 'Tarjeta: Lapsos Académicos' : 'Tarjeta: Niveles Educativos');
    if (!tienePermiso(cardName, 'crear')) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para importar registros.', 'error');
      return;
    }

    const colorTema = tabla === 'conf_lapsos' ? '#00C3FF' : (tabla === 'conf_niveles' ? '#10b981' : '#FF8D00');

    Swal.fire({
      title: `<div class="d-flex align-items-center justify-content-center gap-2" style="color: ${colorTema}"><i class="bi bi-file-earmark-arrow-up-fill fs-3"></i><span>Carga Masiva Excel / CSV</span></div>`,
      html: `
        <div class="text-start">
          <p class="small text-muted mb-2">Sube un archivo de <b>Excel (.xlsx, .xls) o CSV (.csv)</b> con los datos estructurados.</p>
          <p class="small text-muted mb-3">Columnas requeridas: <code>id_parametro</code>, <code>valor</code> (y opcionalmente <code>fecha_inicio</code>, <code>fecha_fin</code>).</p>
          <div class="d-flex gap-2 mb-3 justify-content-center flex-wrap">
            <button type="button" id="btn-dl-xlsx" class="btn btn-sm btn-outline-success rounded-pill fw-bold px-3"><i class="bi bi-file-earmark-excel-fill me-1"></i> Modelo Excel (.xlsx)</button>
            <button type="button" id="btn-dl-csv" class="btn btn-sm btn-outline-secondary rounded-pill fw-bold px-3"><i class="bi bi-filetype-csv me-1"></i> Modelo CSV (.csv)</button>
          </div>
          <input type="file" id="file-csv-config" class="form-control rounded-3" accept=".xlsx,.xls,.ods,.csv,.txt">
        </div>`,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-cloud-upload-fill me-1"></i> Procesar Archivo',
      confirmButtonColor: colorTema,
      cancelButtonColor: '#64748b',
      didOpen: () => {
        document.getElementById('btn-dl-xlsx')?.addEventListener('click', () => descargarPlantillaConfig(tabla, 'xlsx'));
        document.getElementById('btn-dl-csv')?.addEventListener('click', () => descargarPlantillaConfig(tabla, 'csv'));
      },
      preConfirm: () => {
        const fileInput = document.getElementById('file-csv-config') as HTMLInputElement;
        const file = fileInput?.files ? fileInput.files[0] : null;
        if (!file) {
          Swal.showValidationMessage('Debes seleccionar un archivo');
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
    const isExcelOrOds = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.ods');
    const validos: any[] = [];
    const rechazados: any[] = [];

    const procesarFilasArray = (rows: any[][]) => {
      let startIndex = 0;
      if (rows.length > 0 && rows[0] && (rows[0][0]?.toString().toLowerCase().includes('id_parametro') || rows[0][1]?.toString().toLowerCase().includes('valor'))) {
        startIndex = 1;
      }

      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) {
          rechazados.push({ linea: i + 1, datos: row?.join(' ') || '', motivo: "Columnas insuficientes." });
          continue;
        }

        const id = row[0]?.toString().trim();
        const valorRaw = row[1]?.toString().trim();
        const inicio = row.length > 2 && row[2] ? row[2].toString().trim() : null;
        const fin = row.length > 3 && row[3] ? row[3].toString().trim() : null;

        if (!id || !valorRaw) {
          rechazados.push({ linea: i + 1, datos: row.join(' '), motivo: "id_parametro o valor están en blanco." });
          continue;
        }

        const registro: any = { id_parametro: id, valor: toTitulo(valorRaw) };
        if (tabla !== 'conf_niveles') {
          if (inicio) registro.fecha_inicio = inicio;
          if (fin) registro.fecha_fin = fin;
        }
        validos.push(registro);
      }
      finalizarProcesamiento(validos, rechazados, tabla);
    };

    if (isExcelOrOds) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
          procesarFilasArray(rows);
        } catch (err: any) {
          console.error(err);
          if (Swal) Swal.fire('Error', 'No se pudo leer el archivo.', 'error');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const text = e.target.result;
        const lines = text.split(/\r?\n/);
        const rows = lines.map((line: string) => line.split(/[;,]/));
        procesarFilasArray(rows);
      };
      reader.readAsText(file, 'utf-8');
    }
  };

  const finalizarProcesamiento = async (validos: any[], rechazados: any[], tabla: 'conf_periodos' | 'conf_lapsos' | 'conf_niveles') => {
    if (validos.length === 0) {
      if (Swal) Swal.fire('Sin registros válidos', 'No se encontraron registros aptos para importar.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from(tabla).upsert(validos, { onConflict: 'id_parametro' });
      if (error) throw error;

      auditar('Configuración Escolar', 'Importación Masiva', `Se importaron ${validos.length} registros en ${tabla}`);
      await cargarConfiguraciones();
      window.dispatchEvent(new Event('sigae-config-changed'));

      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: 'Importación Exitosa',
          html: `<p class="mb-2">Se procesaron <b>${validos.length}</b> registros correctamente.</p>${rechazados.length > 0 ? `<p class="text-warning small mb-0">${rechazados.length} filas rechazadas.</p>` : ''}`,
          confirmButtonColor: '#0066FF'
        });
      }
    } catch (e: any) {
      console.error(e);
      if (Swal) Swal.fire('Error', e.message || 'Error al insertar en la base de datos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (permLoading || (loading && periodos.length === 0)) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5 h-100" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando parámetros...</span>
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
        <p className="text-muted mb-0">No tienes permisos asignados para acceder a la configuración escolar.</p>
      </div>
    );
  }

  // Filtrado de registros en base al buscador
  const q = filtroTexto.toLowerCase().trim();
  const periodosFiltrados = periodos.filter(p => !q || p.valor.toLowerCase().includes(q) || (p.estado || '').toLowerCase().includes(q));
  const lapsosFiltrados = lapsos.filter(l => !q || l.valor.toLowerCase().includes(q) || (l.estado || '').toLowerCase().includes(q));
  const nivelesFiltrados = niveles.filter(n => !q || n.valor.toLowerCase().includes(q));

  // Período y lapso activos
  const periodoActivo = periodos.find(p => p.estado === 'Activo')?.valor || periodos[0]?.valor || 'No configurado';
  const lapsoActivo = lapsos.find(l => l.estado === 'Activo')?.valor || lapsos[0]?.valor || 'No configurado';

  return (
    <div className="modulo-animado container-fluid p-0 animate__animated animate__fadeIn">
      
      {/* 1. Miga de pan Chamilo */}
      <ChamiloBreadcrumb
        category="Dirección y Sistema"
        currentModule="Configuración Escolar"
      />

      {/* 2. Cuadro de Orientación Chamilo */}
      <ChamiloHelpCallout
        id="ayuda_config_sistema_chamilo"
        title="Guía de Parámetros y Configuración Escolar"
        content="Administre los Años Escolares oficiales, las fechas de inicio y cierre de cada Lapso Académico y los Niveles Educativos impartidos en la institución. Los datos configurados aquí rigen los procesos de admisiones, inscripción y constancias con QR."
        icon="bi-sliders"
      />

      {/* ── 3. CABECERA INSTITUCIONAL TECNOLÓGICA CON RESUMEN Y CONMUTADOR CHAMILO ── */}
      <div 
        className="tech-card overflow-hidden mb-4 shadow-sm animate__animated animate__fadeInDown" 
        style={{ 
          border: '2px solid #fed7aa',
          borderTop: '6px solid #FF8D00',
          background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 45%, #ffedd5 100%)',
          borderRadius: '26px'
        }}
      >
        <div className="p-4 p-md-5">
          <div className="row align-items-center g-4">
            
            {/* Logo de la Escuela con Contenedor Interactivo */}
            <div className="col-12 col-md-auto text-center text-md-start">
              <div 
                className="tech-icon-wrapper bg-white shadow-sm d-inline-flex align-items-center justify-content-center p-2"
                style={{ 
                  width: '110px', 
                  height: '110px',
                  borderRadius: '24px',
                  border: '2.5px solid #fed7aa',
                  boxShadow: '0 10px 24px rgba(249, 115, 22, 0.15)'
                }}
              >
                <img 
                  src={logoEscuela} 
                  alt="Logo Escuela" 
                  className="img-fluid"
                  style={{ maxHeight: '92px', maxWidth: '92px', objectFit: 'contain' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                />
              </div>
            </div>

            {/* Título y Métricas Clave */}
            <div className="col-12 col-md text-center text-md-start">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-2 flex-wrap">
                {/* Live Campus Beacon */}
                <div 
                  className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill bg-white border shadow-xs"
                  style={{ borderColor: '#fed7aa' }}
                >
                  <span 
                    className="status-beacon-live" 
                    style={{ color: '#ea580c' }}
                  ></span>
                  <span 
                    className="extra-small fw-bold text-uppercase" 
                    style={{ fontSize: '0.72rem', color: '#c2410c', letterSpacing: '0.5px' }}
                  >
                    Campus Conectado &bull; SIGAE v1.1
                  </span>
                </div>

                <span 
                  className="badge text-white fw-bold px-3 py-1.5 rounded-pill small shadow-xs d-inline-flex align-items-center gap-1.5"
                  style={{ backgroundColor: '#FF8D00' }}
                >
                  <IconoConfiguracionSistema size={18} color="#ffffff" />
                  <span>Dirección & Configuración Escolar</span>
                </span>

                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold text-truncate shadow-xs d-inline-flex align-items-center gap-1.5" style={{ maxWidth: '240px' }} title={`Año Lectivo: ${periodoActivo}`}>
                  <IconoAnioEscolar size={16} color="#FF8D00" />
                  <span>Año Lectivo: <b>{periodoActivo}</b></span>
                </span>
                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold text-truncate shadow-xs d-inline-flex align-items-center gap-1.5" style={{ maxWidth: '240px' }} title={`Fase Activa: ${lapsoActivo}`}>
                  <IconoLapsoAcademico size={16} color="#00C3FF" />
                  <span>Fase Activa: <b>{lapsoActivo}</b></span>
                </span>
                <span className="badge bg-white text-muted border px-2.5 py-1.5 rounded-pill small shadow-xs d-inline-flex align-items-center gap-1.5">
                  <IconoNivelEducativo size={16} color="#10B981" />
                  <span>{niveles.length} Niveles</span>
                </span>
              </div>

              <h1 className="fw-bolder mb-1 text-dark" style={{ fontSize: 'calc(1.5rem + 0.75vw)', letterSpacing: '-0.6px' }}>
                Configuración Escolar
              </h1>

              <p className="mb-0 text-muted small">
                Gestión de períodos escolares, lapsos académicos, niveles formativos y calendarios oficiales.
              </p>

              {/* Cinta de Telemetría Escolar Interactiva */}
              <div className="d-flex align-items-center gap-2 mt-3 flex-wrap">
                <div className="tech-pill-badge shadow-xs cursor-pointer d-inline-flex align-items-center gap-1.5" title="Período Activo">
                  <IconoAnioEscolar size={17} color="#FF8D00" />
                  <span className="text-secondary">{periodoActivo}</span>
                </div>
                <div className="tech-pill-badge shadow-xs cursor-pointer d-inline-flex align-items-center gap-1.5" title="Lapsos Configurados">
                  <IconoLapsoAcademico size={17} color="#00C3FF" />
                  <span className="font-monospace fw-bold text-dark">{lapsos.length} Lapsos</span>
                </div>
                <div className="tech-pill-badge shadow-xs cursor-pointer" title="Estado de Configuración Escolar">
                  <i className="bi bi-shield-fill-check text-warning"></i>
                  <span className="text-secondary">100% Operativo</span>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas de Cabecera */}
            <div className="col-12 col-md-auto text-center text-md-end">
              <button
                type="button"
                onClick={() => navigate('/categoria/Direcci%C3%B3n%20y%20Sistema')}
                className="btn btn-white bg-white text-dark rounded-pill px-4 py-2 fw-bold shadow-xs hover-efecto border d-inline-flex align-items-center justify-content-center gap-2 w-100 w-md-auto"
                style={{ fontSize: '0.85rem', borderColor: '#fed7aa' }}
              >
                <i className="bi bi-arrow-left" style={{ color: '#ea580c' }}></i>
                <span>Volver a Dirección</span>
              </button>
            </div>

          </div>
        </div>

        {/* Barra de Pestañas y Filtro Rápido (Estilo Chamilo) */}
        <div className="px-3 px-md-4 py-2.5 py-md-3 bg-light border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
          {/* Scroll horizontal suave en celulares */}
          <div 
            className="d-flex align-items-center gap-1.5 overflow-x-auto pb-1 pb-md-0 w-100 w-md-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <button
              type="button"
              onClick={() => setTabActivo('todos')}
              className={`btn btn-xs rounded-pill px-3 py-1.5 fw-bold transition-all text-nowrap ${
                tabActivo === 'todos' ? 'text-white shadow-xs' : 'btn-white bg-white text-muted border'
              }`}
              style={{ 
                backgroundColor: tabActivo === 'todos' ? '#FF8D00' : undefined, 
                borderColor: tabActivo === 'todos' ? '#FF8D00' : undefined,
                fontSize: '0.82rem' 
              }}
            >
              <i className="bi bi-grid-fill me-1"></i>Todas las Secciones
            </button>
            {hasVerPeriodos && (
              <button
                type="button"
                onClick={() => setTabActivo('periodos')}
                className={`btn btn-xs rounded-pill px-3 py-1.5 fw-bold transition-all text-nowrap d-inline-flex align-items-center gap-1.5 ${
                  tabActivo === 'periodos' ? 'text-white shadow-xs' : 'btn-white bg-white text-muted border'
                }`}
                style={{ 
                  backgroundColor: tabActivo === 'periodos' ? '#FF8D00' : undefined, 
                  borderColor: tabActivo === 'periodos' ? '#FF8D00' : undefined,
                  fontSize: '0.82rem' 
                }}
              >
                <IconoAnioEscolar size={16} color={tabActivo === 'periodos' ? '#ffffff' : '#FF8D00'} />
                <span>Años Escolares ({periodos.length})</span>
              </button>
            )}
            {hasVerLapsos && (
              <button
                type="button"
                onClick={() => setTabActivo('lapsos')}
                className={`btn btn-xs rounded-pill px-3 py-1.5 fw-bold transition-all text-nowrap d-inline-flex align-items-center gap-1.5 ${
                  tabActivo === 'lapsos' ? 'text-white shadow-xs' : 'btn-white bg-white text-muted border'
                }`}
                style={{ 
                  backgroundColor: tabActivo === 'lapsos' ? '#00C3FF' : undefined, 
                  borderColor: tabActivo === 'lapsos' ? '#00C3FF' : undefined,
                  fontSize: '0.82rem' 
                }}
              >
                <IconoLapsoAcademico size={16} color={tabActivo === 'lapsos' ? '#ffffff' : '#00C3FF'} />
                <span>Lapsos ({lapsos.length})</span>
              </button>
            )}
            {hasVerNiveles && (
              <button
                type="button"
                onClick={() => setTabActivo('niveles')}
                className={`btn btn-xs rounded-pill px-3 py-1.5 fw-bold transition-all text-nowrap d-inline-flex align-items-center gap-1.5 ${
                  tabActivo === 'niveles' ? 'text-white shadow-xs' : 'btn-white bg-white text-muted border'
                }`}
                style={{ 
                  backgroundColor: tabActivo === 'niveles' ? '#10B981' : undefined, 
                  borderColor: tabActivo === 'niveles' ? '#10B981' : undefined,
                  fontSize: '0.82rem' 
                }}
              >
                <IconoNivelEducativo size={16} color={tabActivo === 'niveles' ? '#ffffff' : '#10B981'} />
                <span>Niveles ({niveles.length})</span>
              </button>
            )}
          </div>

          {/* Buscador Contextual Chamilo adaptado a celular */}
          <div className="w-100 w-md-auto mt-2 mt-md-0" style={{ minWidth: '220px', maxWidth: '320px' }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0 rounded-start-pill text-muted">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="form-control bg-white border-start-0 rounded-end-pill"
                placeholder="Buscar parámetro..."
              />
              {filtroTexto && (
                <button
                  type="button"
                  onClick={() => setFiltroTexto('')}
                  className="btn btn-sm btn-white border-start-0 text-muted"
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. SECCIONES Y TARJETAS MODULARES CHAMILO ── */}
      <div className="row g-3 g-md-4 mb-5">
        
        {/* TARJETA 1: AÑOS ESCOLARES / PERÍODOS */}
        {hasVerPeriodos && (tabActivo === 'todos' || tabActivo === 'periodos') && (
          <div className={tabActivo === 'todos' ? 'col-12 col-md-6 col-xl-4' : 'col-12'}>
            <div className="card border-0 shadow-sm rounded-4 h-100 bg-white overflow-hidden" style={{ borderTop: '4px solid #FF8D00' }}>
              <div className="card-header bg-white p-3 p-md-3.5 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h5 className="fw-bolder text-dark mb-0 d-flex align-items-center gap-2">
                    <IconoAnioEscolar size={24} color="#FF8D00" />
                    <span>Años Escolares</span>
                  </h5>
                  <span className="extra-small text-muted">{periodosFiltrados.length} períodos registrados</span>
                </div>
                
                <div className="d-flex align-items-center gap-1.5">
                  {hasCrearPeriodos && (
                    <>
                      <button 
                        className="btn btn-xs btn-light border rounded-pill px-2.5 py-1 fw-bold shadow-xs hover-efecto" 
                        onClick={() => abrirImportadorCSV('conf_periodos')} 
                        title="Importar desde Excel/CSV"
                      >
                        <i className="bi bi-file-earmark-excel text-success"></i>
                      </button>
                      <button 
                        className="btn btn-xs text-white rounded-pill px-2.5 py-1 fw-bold shadow-xs hover-efecto d-flex align-items-center gap-1" 
                        style={{ backgroundColor: '#FF8D00', borderColor: '#FF8D00' }}
                        onClick={() => nuevoParametro('conf_periodos', true)}
                      >
                        <i className="bi bi-plus-lg"></i>
                        <span>Nuevo</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="card-body p-0">
                {periodosFiltrados.length === 0 ? (
                  <div className="p-4 text-center text-muted">
                    <div className="d-flex justify-content-center mb-2">
                      <IconoAnioEscolar size={44} color="#FF8D00" />
                    </div>
                    <p className="mb-0 small fw-bold mt-2">No se encontraron períodos</p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {periodosFiltrados.map(item => (
                      <div key={item.id_parametro} className="list-group-item p-3 border-0 border-bottom d-flex justify-content-between align-items-center gap-2 hover-efecto">
                        <div className="d-flex align-items-center gap-2.5 pe-1 flex-grow-1" style={{ minWidth: 0 }}>
                          <div 
                            className="rounded-3 p-1.5 d-flex align-items-center justify-content-center flex-shrink-0 shadow-2xs"
                            style={{ background: '#fff7ed', border: '1px solid #fed7aa', width: '38px', height: '38px' }}
                          >
                            <IconoAnioEscolar size={22} color="#ea580c" />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-bold text-dark d-flex align-items-center gap-2 flex-wrap">
                              <span className="text-break">{item.valor}</span>
                              {item.estado === 'Activo' && <span className="badge bg-success rounded-pill px-2 py-0.5 shadow-xs extra-small">Activo</span>}
                              {item.estado === 'Próximo' && <span className="badge bg-warning text-dark rounded-pill px-2 py-0.5 shadow-xs extra-small">Próximo</span>}
                              {item.estado === 'Finalizado' && <span className="badge bg-secondary rounded-pill px-2 py-0.5 shadow-xs extra-small">Finalizado</span>}
                            </div>
                            <div className="extra-small text-muted mt-1 d-flex align-items-center gap-1 flex-wrap">
                              <i className="bi bi-calendar2-range" style={{ color: '#FF8D00' }}></i>
                              <span>{item.fecha_inicio || 'Sin inicio'} al {item.fecha_fin || 'Sin fin'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-1 flex-shrink-0">
                          {hasCrearPeriodos && (
                            <button 
                              className="btn btn-xs btn-light text-primary rounded-circle shadow-xs d-flex align-items-center justify-content-center" 
                              style={{ width: '34px', height: '34px', minWidth: '34px' }}
                              onClick={() => editarParametro(item, 'conf_periodos', true)}
                              title="Editar Período"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                          )}
                          {hasEliminarPeriodos && (
                            <button 
                              className="btn btn-xs btn-light text-danger rounded-circle shadow-xs d-flex align-items-center justify-content-center" 
                              style={{ width: '34px', height: '34px', minWidth: '34px' }}
                              onClick={() => eliminarParametro(item.id_parametro, 'conf_periodos')}
                              title="Eliminar Período"
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

        {/* TARJETA 2: FASES / LAPSOS ACADÉMICOS */}
        {hasVerLapsos && (tabActivo === 'todos' || tabActivo === 'lapsos') && (
          <div className={tabActivo === 'todos' ? 'col-12 col-md-6 col-xl-4' : 'col-12'}>
            <div className="card border-0 shadow-sm rounded-4 h-100 bg-white overflow-hidden" style={{ borderTop: '4px solid #00C3FF' }}>
              <div className="card-header bg-white p-3 p-md-3.5 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h5 className="fw-bolder text-dark mb-0 d-flex align-items-center gap-2">
                    <IconoLapsoAcademico size={24} color="#00C3FF" />
                    <span>Lapsos y Momentos</span>
                  </h5>
                  <span className="extra-small text-muted">{lapsosFiltrados.length} fases configuradas</span>
                </div>
                
                <div className="d-flex align-items-center gap-1.5">
                  {hasCrearLapsos && (
                    <>
                      <button 
                        className="btn btn-xs btn-light border rounded-pill px-2.5 py-1 fw-bold shadow-xs hover-efecto" 
                        onClick={() => abrirImportadorCSV('conf_lapsos')} 
                        title="Importar desde Excel/CSV"
                      >
                        <i className="bi bi-file-earmark-excel text-info"></i>
                      </button>
                      <button 
                        className="btn btn-xs btn-info text-white rounded-pill px-2.5 py-1 fw-bold shadow-xs hover-efecto d-flex align-items-center gap-1" 
                        onClick={() => nuevoParametro('conf_lapsos', true)}
                      >
                        <i className="bi bi-plus-lg"></i>
                        <span>Nuevo</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="card-body p-0">
                {lapsosFiltrados.length === 0 ? (
                  <div className="p-4 text-center text-muted">
                    <div className="d-flex justify-content-center mb-2">
                      <IconoLapsoAcademico size={44} color="#00C3FF" />
                    </div>
                    <p className="mb-0 small fw-bold mt-2">No se encontraron lapsos</p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {lapsosFiltrados.map(item => (
                      <div key={item.id_parametro} className="list-group-item p-3 border-0 border-bottom d-flex justify-content-between align-items-center gap-2 hover-efecto">
                        <div className="d-flex align-items-center gap-2.5 pe-1 flex-grow-1" style={{ minWidth: 0 }}>
                          <div 
                            className="rounded-3 p-1.5 d-flex align-items-center justify-content-center flex-shrink-0 shadow-2xs"
                            style={{ background: '#f0f9ff', border: '1px solid #bae6fd', width: '38px', height: '38px' }}
                          >
                            <IconoLapsoAcademico size={22} color="#0284c7" />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-bold text-dark d-flex align-items-center gap-2 flex-wrap">
                              <span className="text-break">{item.valor}</span>
                              {item.estado === 'Activo' && <span className="badge bg-success rounded-pill px-2 py-0.5 shadow-xs extra-small">Activo</span>}
                              {item.estado === 'Próximo' && <span className="badge bg-warning text-dark rounded-pill px-2 py-0.5 shadow-xs extra-small">Próximo</span>}
                              {item.estado === 'Finalizado' && <span className="badge bg-secondary rounded-pill px-2 py-0.5 shadow-xs extra-small">Finalizado</span>}
                            </div>
                            <div className="extra-small text-muted mt-1 d-flex align-items-center gap-1 flex-wrap">
                              <i className="bi bi-calendar2-range text-info"></i>
                              <span>{item.fecha_inicio || 'Sin inicio'} al {item.fecha_fin || 'Sin fin'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-1 flex-shrink-0">
                          {hasCrearLapsos && (
                            <button 
                              className="btn btn-xs btn-light text-primary rounded-circle shadow-xs d-flex align-items-center justify-content-center" 
                              style={{ width: '34px', height: '34px', minWidth: '34px' }}
                              onClick={() => editarParametro(item, 'conf_lapsos', true)}
                              title="Editar Lapso"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                          )}
                          {hasEliminarLapsos && (
                            <button 
                              className="btn btn-xs btn-light text-danger rounded-circle shadow-xs d-flex align-items-center justify-content-center" 
                              style={{ width: '34px', height: '34px', minWidth: '34px' }}
                              onClick={() => eliminarParametro(item.id_parametro, 'conf_lapsos')}
                              title="Eliminar Lapso"
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

        {/* TARJETA 3: NIVELES EDUCATIVOS */}
        {hasVerNiveles && (tabActivo === 'todos' || tabActivo === 'niveles') && (
          <div className={tabActivo === 'todos' ? 'col-12 col-md-6 col-xl-4' : 'col-12'}>
            <div className="card border-0 shadow-sm rounded-4 h-100 bg-white overflow-hidden" style={{ borderTop: '4px solid #10b981' }}>
              <div className="card-header bg-white p-3 p-md-3.5 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h5 className="fw-bolder text-dark mb-0 d-flex align-items-center gap-2">
                    <IconoNivelEducativo size={24} color="#10b981" />
                    <span>Niveles Educativos</span>
                  </h5>
                  <span className="extra-small text-muted">{nivelesFiltrados.length} modalidades activas</span>
                </div>
                
                <div className="d-flex align-items-center gap-1.5">
                  {hasCrearNiveles && (
                    <>
                      <button 
                        className="btn btn-xs btn-light border rounded-pill px-2.5 py-1 fw-bold shadow-xs hover-efecto" 
                        onClick={() => abrirImportadorCSV('conf_niveles')} 
                        title="Importar desde Excel/CSV"
                      >
                        <i className="bi bi-file-earmark-excel text-success"></i>
                      </button>
                      <button 
                        className="btn btn-xs btn-success text-white rounded-pill px-2.5 py-1 fw-bold shadow-xs hover-efecto d-flex align-items-center gap-1" 
                        onClick={() => nuevoParametro('conf_niveles', false)}
                      >
                        <i className="bi bi-plus-lg"></i>
                        <span>Nuevo</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="card-body p-0">
                {nivelesFiltrados.length === 0 ? (
                  <div className="p-4 text-center text-muted">
                    <div className="d-flex justify-content-center mb-2">
                      <IconoNivelEducativo size={44} color="#10b981" />
                    </div>
                    <p className="mb-0 small fw-bold mt-2">No se encontraron niveles</p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {nivelesFiltrados.map(item => (
                      <div key={item.id_parametro} className="list-group-item p-3 border-0 border-bottom d-flex justify-content-between align-items-center gap-2 hover-efecto">
                        <div className="d-flex align-items-center gap-2.5 pe-1 flex-grow-1" style={{ minWidth: 0 }}>
                          <div 
                            className="rounded-3 p-1.5 d-flex align-items-center justify-content-center flex-shrink-0 shadow-2xs"
                            style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', width: '38px', height: '38px' }}
                          >
                            <IconoNivelEducativo size={22} color="#10b981" />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div className="fw-bold text-dark d-flex align-items-center gap-2 flex-wrap">
                              <span className="text-break">{item.valor}</span>
                            </div>
                            <div className="extra-small text-muted mt-0.5">Modalidad curricular oficial</div>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-1 flex-shrink-0">
                          {hasCrearNiveles && (
                            <button 
                              className="btn btn-xs btn-light text-primary rounded-circle shadow-xs d-flex align-items-center justify-content-center" 
                              style={{ width: '34px', height: '34px', minWidth: '34px' }}
                              onClick={() => editarParametro(item, 'conf_niveles', false)}
                              title="Editar Nivel"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                          )}
                          {hasEliminarNiveles && (
                            <button 
                              className="btn btn-xs btn-light text-danger rounded-circle shadow-xs d-flex align-items-center justify-content-center" 
                              style={{ width: '34px', height: '34px', minWidth: '34px' }}
                              onClick={() => eliminarParametro(item.id_parametro, 'conf_niveles')}
                              title="Eliminar Nivel"
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
