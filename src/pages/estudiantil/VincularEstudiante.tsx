import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { usePermisos } from '../../hooks/usePermisos';
import { auditar } from '../../lib/audit';
import * as XLSX from 'xlsx';

// ─── HELPER: MODO TÍTULO (Mayúscula inicial y minúsculas sostenidas) ─────────────────
const ABREVIATURAS = ['CEI', 'TDA', 'TDH', 'TDHA', 'ADN', 'UE', 'CE', 'EB', 'PDVSA', 'PDV'];

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

const handleTituloChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setter: (val: string) => void
) => {
  const raw = e.target.value;
  const endsWithSpace = raw.endsWith(' ');
  const converted = toTitulo(raw.trimEnd());
  setter(endsWithSpace ? converted + ' ' : converted);
};

export const VincularEstudiante: React.FC = () => {
  const { user } = usePermisos();
  const [activeTab, setActiveTab] = useState<'individual' | 'masiva' | 'directorio'>('individual');
  const [escuelaFiltro, setEscuelaFiltro] = useState<string>(localStorage.getItem('sigae_escuela_codigo') || 'sb');
  const [loading, setLoading] = useState<boolean>(false);
  const [vinculaciones, setVinculaciones] = useState<any[]>([]);
  const [busquedaDir, setBusquedaDir] = useState<string>('');

  // Estados para Formulario Individual
  const [cedulaRepBuscar, setCedulaRepBuscar] = useState<string>('');
  const [repEncontrado, setRepEncontrado] = useState<any | null>(null);
  const [buscandoRep, setBuscandoRep] = useState<boolean>(false);
  
  const [formInd, setFormInd] = useState({
    cedula_estudiante: '',
    nombres_estudiante: '',
    apellidos_estudiante: '',
    grado_actual: 'Sin Grado Asignado',
    seccion_actual: 'A',
    codigo_escuela: localStorage.getItem('sigae_escuela_codigo') || 'sb'
  });

  // Estados para Carga Masiva
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [previewValidos, setPreviewValidos] = useState<any[]>([]);
  const [previewRechazados, setPreviewRechazados] = useState<any[]>([]);
  const [procesadoMasivo, setProcesadoMasivo] = useState<boolean>(false);

  useEffect(() => {
    if (activeTab === 'directorio') {
      cargarVinculaciones();
    }
  }, [activeTab, escuelaFiltro]);

  const cargarVinculaciones = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('estudiantes_vinculaciones')
        .select('*')
        .eq('codigo_escuela', escuelaFiltro)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVinculaciones(data || []);
    } catch (err: any) {
      console.error('Error al cargar vinculaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Buscar Representante en tabla usuarios
  const buscarRepresentante = async () => {
    if (!cedulaRepBuscar.trim()) return;
    setBuscandoRep(true);
    setRepEncontrado(null);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('cedula, nombre_completo, rol, id_escuela')
        .eq('cedula', cedulaRepBuscar.trim())
        .single();

      if (error || !data) {
        if ((window as any).Swal) {
          (window as any).Swal.fire('No encontrado', `No existe un usuario con la cédula ${cedulaRepBuscar}. Por favor regístrelo primero en Gestión de Usuarios.`, 'warning');
        } else {
          alert(`No existe un usuario con la cédula ${cedulaRepBuscar}`);
        }
      } else {
        // Separar nombre_completo en nombres y apellidos aproximados o guardarlo
        const partes = (data.nombre_completo || '').trim().split(' ');
        let nom = data.nombre_completo;
        let ape = '';
        if (partes.length >= 2) {
          nom = partes.slice(0, Math.ceil(partes.length / 2)).join(' ');
          ape = partes.slice(Math.ceil(partes.length / 2)).join(' ');
        }
        setRepEncontrado({
          cedula: data.cedula,
          nombres: nom,
          apellidos: ape,
          nombre_completo: data.nombre_completo,
          rol: data.rol
        });
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setBuscandoRep(false);
    }
  };

  const handleGuardarIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repEncontrado) {
      alert('Debe buscar y seleccionar un representante válido.');
      return;
    }
    if (!formInd.cedula_estudiante.trim() || !formInd.nombres_estudiante.trim() || !formInd.apellidos_estudiante.trim()) {
      alert('Por favor complete todos los datos del estudiante.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        codigo_escuela: formInd.codigo_escuela,
        cedula_representante: repEncontrado.cedula,
        nombres_representante: repEncontrado.nombres || repEncontrado.nombre_completo,
        apellidos_representante: repEncontrado.apellidos || '',
        cedula_estudiante: formInd.cedula_estudiante.trim().toUpperCase(),
        nombres_estudiante: toTitulo(formInd.nombres_estudiante.trim()),
        apellidos_estudiante: toTitulo(formInd.apellidos_estudiante.trim()),
        grado_actual: formInd.grado_actual,
        seccion_actual: formInd.seccion_actual,
        estado: 'Activo',
        creado_por: user?.cedula || 'Admin'
      };

      const { error } = await supabase
        .from('estudiantes_vinculaciones')
        .upsert([payload], { onConflict: 'cedula_estudiante' });

      if (error) throw error;

      if ((window as any).Swal) {
        (window as any).Swal.fire('¡Éxito!', `Estudiante ${payload.nombres_estudiante} vinculado al representante C.I. ${payload.cedula_representante}`, 'success');
      } else {
        alert('Vinculación exitosa');
      }

      auditar('Vincular Estudiante', 'Vinculación Individual', `Asignó estudiante ${payload.cedula_estudiante} a C.I. ${payload.cedula_representante}`);
      
      setFormInd({
        cedula_estudiante: '',
        nombres_estudiante: '',
        apellidos_estudiante: '',
        grado_actual: 'Sin Grado Asignado',
        seccion_actual: 'A',
        codigo_escuela: localStorage.getItem('sigae_escuela_codigo') || 'sb'
      });
      setRepEncontrado(null);
      setCedulaRepBuscar('');
    } catch (err: any) {
      console.error(err);
      if ((window as any).Swal) {
        (window as any).Swal.fire('Error', `No se pudo guardar la vinculación: ${err.message || 'Error de BD'}`, 'error');
      } else {
        alert('Error al guardar: ' + (err.message || 'Error de BD'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Descargar plantilla modelo en Excel (Sin Grado ni Sección por orden institucional en esta etapa)
  const descargarPlantillaExcel = () => {
    const wsData = [
      ['Cédula_Representante', 'Cédula_Estudiante', 'Nombres_Estudiante', 'Apellidos_Estudiante', 'Escuela(sb/lb)'],
      ['12345678', 'CE11223344', 'Carlos Andrés', 'Mendoza Silva', 'sb'],
      ['18765432', 'CE55667788', 'María Fernanda', 'Rodríguez López', 'lb']
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Modelo Vinculación");
    XLSX.writeFile(wb, "Plantilla_Modelo_Vinculacion_Estudiantes_SIGAE.xlsx");
  };

  const descargarPlantillaCSV = () => {
    let csvContent = "Cédula_Representante;Cédula_Estudiante;Nombres_Estudiante;Apellidos_Estudiante;Escuela(sb/lb)\n";
    csvContent += "12345678;CE11223344;Carlos Andrés;Mendoza Silva;sb\n";
    csvContent += "18765432;CE55667788;María Fernanda;Rodríguez López;lb\n";
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Plantilla_Modelo_Vinculacion_Estudiantes_SIGAE.csv";
    link.click();
  };

  // 2. Procesar archivo Excel (.xlsx/.xls/.ods) o CSV para previsualización
  const handleProcesarArchivoCSV = async () => {
    if (!csvFile) return;
    setLoading(true);
    setProcesadoMasivo(false);
    
    // Obtener todas las cédulas de los usuarios en BD para verificar en lotes
    const { data: usuariosBD } = await supabase.from('usuarios').select('cedula, nombre_completo');
    const mapaUsuarios = new Map<string, string>();
    (usuariosBD || []).forEach((u: any) => {
      mapaUsuarios.set(String(u.cedula).trim(), u.nombre_completo);
    });

    const procesarFilas = (rows: any[][]) => {
      const validos: any[] = [];
      const rechazados: any[] = [];

      let startIndex = 0;
      if (rows.length > 0) {
        const firstRowStr = rows[0].map(c => String(c || '').toLowerCase()).join(' ');
        if (firstRowStr.includes('cedula') || firstRowStr.includes('estudiante') || firstRowStr.includes('cédula')) {
          startIndex = 1;
        }
      }

      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || row.every(cell => !cell || String(cell).trim() === '')) continue;

        if (row.length < 4) {
          rechazados.push({ linea: i + 1, datos: row.join(' ; '), motivo: 'Faltan columnas (Se requieren mínimo 4: Cédula Rep, Cédula Est, Nombres Est, Apellidos Est).' });
          continue;
        }

        const cedRep = String(row[0] || '').trim();
        const cedEst = String(row[1] || '').trim().toUpperCase();
        const nomEst = toTitulo(String(row[2] || '').trim());
        const apeEst = toTitulo(String(row[3] || '').trim());
        const esc = String(row[4] || 'sb').trim().toLowerCase();

        if (!cedRep || !cedEst || !nomEst || !apeEst) {
          rechazados.push({ linea: i + 1, datos: row.join(' ; '), motivo: 'Cédulas, Nombres o Apellidos están vacíos.' });
          continue;
        }

        const nomCompletoRep = mapaUsuarios.get(cedRep);
        if (!nomCompletoRep) {
          rechazados.push({ linea: i + 1, datos: row.join(' ; '), motivo: `El representante C.I. '${cedRep}' no está registrado en el sistema (Gestión de Usuarios).` });
          continue;
        }

        const partes = nomCompletoRep.split(' ');
        let nomRep = nomCompletoRep;
        let apeRep = '';
        if (partes.length >= 2) {
          nomRep = partes.slice(0, Math.ceil(partes.length / 2)).join(' ');
          apeRep = partes.slice(Math.ceil(partes.length / 2)).join(' ');
        }

        validos.push({
          codigo_escuela: esc === 'lb' ? 'lb' : 'sb',
          cedula_representante: cedRep,
          nombres_representante: nomRep,
          apellidos_representante: apeRep,
          cedula_estudiante: cedEst,
          nombres_estudiante: nomEst,
          apellidos_estudiante: apeEst,
          grado_actual: 'Sin Grado Asignado',
          seccion_actual: 'Sin Asignar',
          estado: 'Activo',
          creado_por: user?.cedula || 'Admin'
        });
      }

      setPreviewValidos(validos);
      setPreviewRechazados(rechazados);
      setProcesadoMasivo(true);
      setLoading(false);
    };

    const isExcelOrOds = csvFile.name.endsWith('.xlsx') || csvFile.name.endsWith('.xls') || csvFile.name.endsWith('.ods');
    if (isExcelOrOds) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
          procesarFilas(rows);
        } catch (err: any) {
          console.error(err);
          alert('Error al leer el archivo Excel / Linux (.xlsx/.ods)');
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(csvFile);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          if (!text) { setLoading(false); return; }
          const lines = text.split(/\r?\n/);
          const rows = lines.map(line => line.split(/[;,]/));
          procesarFilas(rows);
        } catch (err: any) {
          console.error(err);
          alert('Error al leer archivo CSV');
          setLoading(false);
        }
      };
      reader.readAsText(csvFile);
    }
  };

  const handleConfirmarCargaMasiva = async () => {
    if (previewValidos.length === 0) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('estudiantes_vinculaciones')
        .upsert(previewValidos, { onConflict: 'cedula_estudiante' });

      if (error) throw error;

      if ((window as any).Swal) {
        (window as any).Swal.fire('Carga Masiva Completada', `Se vincularon o actualizaron con éxito ${previewValidos.length} estudiantes.`, 'success');
      } else {
        alert(`Se vincularon ${previewValidos.length} estudiantes con éxito.`);
      }

      auditar('Vincular Estudiante', 'Carga Masiva', `Vinculados ${previewValidos.length} registros. Rechazados: ${previewRechazados.length}`);
      
      setPreviewValidos([]);
      setPreviewRechazados([]);
      setCsvFile(null);
      setProcesadoMasivo(false);
    } catch (err: any) {
      console.error(err);
      if ((window as any).Swal) {
        (window as any).Swal.fire('Error en BD', err.message || 'Falla durante inserción por lotes.', 'error');
      } else {
        alert('Error en BD: ' + (err.message || 'Falla en inserción'));
      }
    } finally {
      setLoading(false);
    }
  };

  const descargarRechazados = () => {
    if (previewRechazados.length === 0) return;
    let csvContent = "Linea,Datos Originales,Motivo del Rechazo\n";
    previewRechazados.forEach(r => {
      csvContent += `${r.linea},"${r.datos.replace(/"/g, '""')}","${r.motivo.replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `errores_vinculacion_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDesvincular = async (id: string, nombre: string) => {
    if (!confirm(`¿Está seguro de desvincular o eliminar al estudiante ${nombre}?`)) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('estudiantes_vinculaciones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setVinculaciones(prev => prev.filter(v => v.id !== id));
      auditar('Vincular Estudiante', 'Desvincular Estudiante', `Eliminada vinculación del estudiante ID ${id}`);
    } catch (err: any) {
      console.error(err);
      alert('No se pudo desvincular: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const listaFiltrada = vinculaciones.filter(v => {
    const q = busquedaDir.toLowerCase();
    return (
      v.cedula_estudiante?.toLowerCase().includes(q) ||
      v.nombres_estudiante?.toLowerCase().includes(q) ||
      v.apellidos_estudiante?.toLowerCase().includes(q) ||
      v.cedula_representante?.toLowerCase().includes(q) ||
      v.nombres_representante?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container-fluid py-4 animate__animated animate__fadeIn">
      {/* Encabezado Principal */}
      <div 
        className="banner-modulo p-4 p-md-5 mb-4 shadow-sm text-white position-relative overflow-hidden" 
        style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', borderRadius: '24px' }}
      >
        <div className="burbuja-3d burbuja-1" style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.15)', position: 'absolute', top: '-50px', right: '-20px', borderRadius: '50%' }}></div>
        <div className="burbuja-3d burbuja-2" style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.08)', position: 'absolute', bottom: '-20px', left: '20px', borderRadius: '50%' }}></div>
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between position-relative z-1">
          <div>
            <span className="badge bg-white text-primary fw-bold px-3 py-2 rounded-pill mb-3 shadow-sm text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.75rem' }}>
              <i className="bi bi-person-plus-fill me-2"></i>Módulo Escolar DEP Oriente
            </span>
            <h1 className="fw-bolder mb-2 display-6 text-white">
              <i className="bi bi-person-plus-fill me-3"></i>Vincular Estudiante
            </h1>
            <p className="mb-0 text-white-50 fs-6" style={{ maxWidth: '750px' }}>
              Asigne estudiantes a representantes o docentes previamente registrados. Al iniciar sesión en el portal, cada usuario verá sus representados bloqueados contra modificaciones indebidas.
            </p>
          </div>
            <div className="mt-4 mt-md-0 d-flex gap-2">
              <button 
                className={`btn ${activeTab === 'individual' ? 'btn-light text-primary fw-bold shadow' : 'btn-outline-light'}`}
                onClick={() => setActiveTab('individual')}
              >
                <i className="bi bi-person-plus me-2"></i>Individual
              </button>
              <button 
                className={`btn ${activeTab === 'masiva' ? 'btn-light text-primary fw-bold shadow' : 'btn-outline-light'}`}
                onClick={() => setActiveTab('masiva')}
              >
                <i className="bi bi-file-earmark-spreadsheet me-2"></i>Carga Masiva
              </button>
              <button 
                className={`btn ${activeTab === 'directorio' ? 'btn-light text-primary fw-bold shadow' : 'btn-outline-light'}`}
                onClick={() => setActiveTab('directorio')}
              >
                <i className="bi bi-table me-2"></i>Directorio
              </button>
            </div>
          </div>
      </div>

      {/* Pestaña 1: Vinculación Individual */}
      {activeTab === 'individual' && (
        <div className="row g-4">
          <div className="col-lg-12">
            <div className="card border-0 shadow-sm rounded-4 p-4">
              <h5 className="fw-bold text-dark mb-4 border-bottom pb-3">
                <i className="bi bi-search me-2 text-primary"></i>Paso 1: Buscar Representante en el Sistema
              </h5>
              <div className="row g-3 align-items-end mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold text-secondary">Cédula del Representante / Docente</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0"><i className="bi bi-person-vcard text-primary"></i></span>
                    <input 
                      type="text" 
                      className="form-control border-start-0" 
                      placeholder="Ej: 12345678" 
                      value={cedulaRepBuscar}
                      onChange={(e) => setCedulaRepBuscar(e.target.value)}
                    />
                    <button className="btn btn-primary px-4 fw-bold" type="button" onClick={buscarRepresentante} disabled={buscandoRep}>
                      {buscandoRep ? <span className="spinner-border spinner-border-sm"></span> : <><i className="bi bi-search me-2"></i>Buscar</>}
                    </button>
                  </div>
                  <small className="text-muted">El representante debe estar dado de alta previamente en Gestión de Usuarios.</small>
                </div>
              </div>

              {repEncontrado && (
                <div className="alert alert-success border-0 shadow-sm rounded-4 p-4 mb-4 d-flex align-items-center justify-content-between animate__animated animate__fadeIn">
                  <div className="d-flex align-items-center">
                    <div className="bg-white text-success rounded-circle p-3 me-3 shadow-sm d-flex align-items-center justify-content-center" style={{ width: '54px', height: '54px' }}>
                      <i className="bi bi-person-check-fill fs-3"></i>
                    </div>
                    <div>
                      <h6 className="fw-bolder mb-1 text-dark fs-5">{repEncontrado.nombre_completo}</h6>
                      <span className="badge bg-success me-2">C.I. {repEncontrado.cedula}</span>
                      <span className="badge bg-secondary">Rol: {repEncontrado.rol}</span>
                    </div>
                  </div>
                  <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => setRepEncontrado(null)}>
                    Cambiar
                  </button>
                </div>
              )}

              {repEncontrado && (
                <form onSubmit={handleGuardarIndividual} className="animate__animated animate__fadeInUp">
                  <h5 className="fw-bold text-dark mb-4 border-bottom pb-3 mt-4">
                    <i className="bi bi-mortarboard-fill me-2 text-primary"></i>Paso 2: Datos Completos del Estudiante (Inmutables)
                  </h5>
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <label className="form-label fw-bold text-secondary">Cédula de Identidad o Cédula Escolar <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required 
                        placeholder="Ej: V-30123456 o C.E. 11223344"
                        value={formInd.cedula_estudiante}
                        onChange={(e) => setFormInd({ ...formInd, cedula_estudiante: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold text-secondary">Nombres Completos <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required 
                        placeholder="Ej: Juan Alberto"
                        value={formInd.nombres_estudiante}
                        onChange={(e) => handleTituloChange(e, (val) => setFormInd(prev => ({ ...prev, nombres_estudiante: val })))}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold text-secondary">Apellidos Completos <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required 
                        placeholder="Ej: Pérez Rodríguez"
                        value={formInd.apellidos_estudiante}
                        onChange={(e) => handleTituloChange(e, (val) => setFormInd(prev => ({ ...prev, apellidos_estudiante: val })))}
                      />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label fw-bold text-secondary">Escuela DEP Oriente</label>
                      <select 
                        className="form-select fw-bold"
                        value={formInd.codigo_escuela}
                        onChange={(e) => setFormInd({ ...formInd, codigo_escuela: e.target.value })}
                      >
                        <option value="sb">UE Santa Bárbara</option>
                        <option value="lb">UE Libertador Bolívar</option>
                      </select>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-3 pt-3 border-top">
                    <button type="button" className="btn btn-light px-4 fw-bold" onClick={() => setRepEncontrado(null)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary px-5 fw-bold shadow-sm" disabled={loading}>
                      {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check2-circle me-2"></i>}
                      Vincular Estudiante Ahora
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pestaña 2: Carga e Importación Masiva */}
      {activeTab === 'masiva' && (
        <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5">
          <div className="row align-items-center justify-content-between mb-4">
            <div className="col-md-7">
              <h4 className="fw-bold text-dark mb-1"><i className="bi bi-file-earmark-spreadsheet-fill text-success me-2"></i>Carga e Importación Masiva (Excel / CSV)</h4>
              <p className="text-muted mb-0">
                Sube un archivo de Excel (`.xlsx`, `.xls`) o `.csv` separado por puntos y comas (`;`) con las siguientes columnas:
              </p>
            </div>
            <div className="col-md-5 text-md-end mt-3 mt-md-0 d-flex flex-column gap-2">
              <button 
                type="button" 
                className="btn btn-outline-success fw-bold shadow-sm rounded-pill px-3 py-1 small"
                onClick={descargarPlantillaExcel}
              >
                <i className="bi bi-file-earmark-excel-fill fs-6 me-1"></i>
                Modelo Excel (.xlsx)
              </button>
              <button 
                type="button" 
                className="btn btn-outline-secondary fw-bold shadow-sm rounded-pill px-3 py-1 small"
                onClick={descargarPlantillaCSV}
              >
                <i className="bi bi-filetype-csv fs-6 me-1"></i>
                Modelo Linux (.csv)
              </button>
            </div>
          </div>

          <div className="bg-light border rounded-4 p-3 mb-4 font-monospace fs-6 text-dark overflow-auto">
            <code>Cédula_Representante | Cédula_Estudiante | Nombres_Estudiante | Apellidos_Estudiante | Escuela(sb/lb)</code>
            <br />
            <span className="text-muted small">Ejemplo: 12345678 | CE11223344 | Carlos Andrés | Mendoza Silva | sb</span>
          </div>

          <div className="row g-3 align-items-center mb-4">
            <div className="col-md-8">
              <input 
                type="file" 
                accept=".xlsx,.xls,.ods,.csv,.txt" 
                className="form-control form-control-lg border-2" 
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              />
              <small className="text-muted mt-1 d-block"><i className="bi bi-info-circle me-1"></i>Formatos soportados: Excel (.xlsx, .xls) o Linux (.ods, .csv)</small>
            </div>
            <div className="col-md-4">
              <button 
                className="btn btn-success btn-lg w-100 fw-bold shadow-sm"
                onClick={handleProcesarArchivoCSV}
                disabled={!csvFile || loading}
              >
                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-lightning-charge-fill me-2"></i>}
                Validar Archivo
              </button>
            </div>
          </div>

          {procesadoMasivo && (
            <div className="animate__animated animate__fadeIn">
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="card border-success bg-success bg-opacity-10 rounded-4 p-3 text-success">
                    <h5 className="fw-bolder mb-1"><i className="bi bi-check-circle-fill me-2"></i>Registros Válidos: {previewValidos.length}</h5>
                    <small>Están listos para ser guardados en la base de datos de vinculaciones.</small>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card border-danger bg-danger bg-opacity-10 rounded-4 p-3 text-danger">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5 className="fw-bolder mb-1"><i className="bi bi-x-circle-fill me-2"></i>Filas con Errores: {previewRechazados.length}</h5>
                        <small>No se importarán. Puede descargar el reporte de errores.</small>
                      </div>
                      {previewRechazados.length > 0 && (
                        <button className="btn btn-sm btn-danger fw-bold rounded-pill px-3" onClick={descargarRechazados}>
                          <i className="bi bi-download me-1"></i>Descargar CSV Errores
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {previewValidos.length > 0 && (
                <div className="table-responsive border rounded-4 mb-4" style={{ maxHeight: '350px' }}>
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light sticky-top">
                      <tr>
                        <th>Cédula Rep.</th>
                        <th>Nombre Representante</th>
                        <th>Cédula Alumno</th>
                        <th>Nombres Alumno</th>
                        <th>Apellidos Alumno</th>
                        <th>Escuela</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewValidos.slice(0, 50).map((item, idx) => (
                        <tr key={idx}>
                          <td className="fw-bold text-primary">{item.cedula_representante}</td>
                          <td>{item.nombres_representante} {item.apellidos_representante}</td>
                          <td className="fw-bold text-dark">{item.cedula_estudiante}</td>
                          <td>{item.nombres_estudiante}</td>
                          <td>{item.apellidos_estudiante}</td>
                          <td><span className={`badge ${item.codigo_escuela === 'sb' ? 'bg-primary' : 'bg-success'}`}>{item.codigo_escuela.toUpperCase()}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="d-flex justify-content-end gap-3 border-top pt-3">
                <button className="btn btn-light px-4 fw-bold" onClick={() => { setProcesadoMasivo(false); setPreviewValidos([]); setPreviewRechazados([]); }}>
                  Cancelar
                </button>
                <button 
                  className="btn btn-primary btn-lg px-5 fw-bold shadow" 
                  onClick={handleConfirmarCargaMasiva}
                  disabled={previewValidos.length === 0 || loading}
                >
                  {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-cloud-upload-fill me-2"></i>}
                  Confirmar e Importar {previewValidos.length} Estudiantes
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pestaña 3: Directorio General de Estudiantes Vinculados */}
      {activeTab === 'directorio' && (
        <div className="card border-0 shadow-sm rounded-4 p-4">
          <div className="row g-3 align-items-center justify-content-between mb-4">
            <div className="col-md-4">
              <div className="btn-group w-100 shadow-sm" role="group">
                <button 
                  type="button" 
                  className={`btn ${escuelaFiltro === 'sb' ? 'btn-primary fw-bold' : 'btn-outline-primary'}`}
                  onClick={() => setEscuelaFiltro('sb')}
                >
                  UE Santa Bárbara
                </button>
                <button 
                  type="button" 
                  className={`btn ${escuelaFiltro === 'lb' ? 'btn-success fw-bold' : 'btn-outline-success'}`}
                  onClick={() => setEscuelaFiltro('lb')}
                >
                  UE Libertador Bolívar
                </button>
              </div>
            </div>
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
                <input 
                  type="text" 
                  className="form-control border-start-0" 
                  placeholder="Buscar por cédula o nombre del alumno / representante..." 
                  value={busquedaDir}
                  onChange={(e) => setBusquedaDir(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2 text-end">
              <button className="btn btn-outline-secondary w-100 fw-bold" onClick={cargarVinculaciones} disabled={loading}>
                <i className="bi bi-arrow-clockwise me-2"></i>Actualizar
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Representante</th>
                  <th>Cédula Alumno</th>
                  <th>Estudiante</th>
                  <th>Última Actualización</th>
                  <th>Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="spinner-border text-primary me-2" role="status"></div>
                      <span className="text-muted fw-bold">Cargando directorio de vinculaciones...</span>
                    </td>
                  </tr>
                ) : listaFiltrada.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5 text-muted">
                      <i className="bi bi-folder2-open fs-1 d-block mb-2"></i>
                      No hay estudiantes vinculados en {escuelaFiltro === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar'}.
                    </td>
                  </tr>
                ) : (
                  listaFiltrada.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="fw-bold text-dark">{item.nombres_representante} {item.apellidos_representante}</div>
                        <small className="text-muted">C.I. {item.cedula_representante}</small>
                      </td>
                      <td><span className="badge bg-light text-dark border fw-bold px-2 py-1 fs-6">{item.cedula_estudiante}</span></td>
                      <td>
                        <div className="fw-bold text-primary">{item.nombres_estudiante} {item.apellidos_estudiante}</div>
                      </td>
                      <td>
                        {item.fecha_ultima_actualizacion ? (
                          <span className="text-success fw-bold"><i className="bi bi-check-circle-fill me-1"></i>{new Date(item.fecha_ultima_actualizacion).toLocaleDateString()}</span>
                        ) : (
                          <span className="text-warning fw-bold"><i className="bi bi-clock-history me-1"></i>Pendiente</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${item.estado === 'Activo' ? 'bg-success' : 'bg-secondary'} rounded-pill`}>
                          {item.estado}
                        </span>
                      </td>
                      <td className="text-end">
                        <button 
                          className="btn btn-sm btn-outline-danger rounded-pill" 
                          onClick={() => handleDesvincular(item.id, `${item.nombres_estudiante} ${item.apellidos_estudiante}`)}
                          title="Desvincular Estudiante"
                        >
                          <i className="bi bi-trash3-fill"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
