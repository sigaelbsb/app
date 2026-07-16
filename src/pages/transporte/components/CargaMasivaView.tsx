import React, { useState } from 'react';
import * as XLSX from 'xlsx';

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

interface CargaMasivaViewProps {
  onBack: () => void;
  onSave: (rows: any[]) => Promise<{ exitosos: number; rechazados: number; detalles: any[] }>;
}

export const CargaMasivaView: React.FC<CargaMasivaViewProps> = ({ onBack, onSave }) => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [resultado, setResultado] = useState<{ exitosos: number; rechazados: number; detalles: any[] } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const sizeKB = (file.size / 1024).toFixed(1);
    setFileSize(`${sizeKB} KB`);

    const reader = new FileReader();
    const isExcelOrOds = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.ods');

    if (isExcelOrOds) {
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Get rows
          const rows = sheetToRows(worksheet);
          setParsedRows(rows);

          // Convert sheet to CSV style text for preview
          const csvText = XLSX.utils.sheet_to_csv(worksheet);
          setInputText(csvText);
        } catch (err: any) {
          alert("Error al leer el archivo Excel/Linux: " + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setInputText(text);
        
        // Parse rows
        const rows = parseRowsFromText(text);
        setParsedRows(rows);
      };
      reader.readAsText(file, "UTF-8");
    }
  };

  const sheetToRows = (worksheet: XLSX.WorkSheet): any[] => {
    const data = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
    const rowsParsed: any[] = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 3) continue;
      const esc = row[0]?.toString().trim().toLowerCase() || '';
      const orden = row[4] ? parseInt(row[4].toString().trim(), 10) : 999;
      if (esc === 'sb' || esc === 'lb') {
        rowsParsed.push({
          escuela_codigo: esc,
          ruta_nombre: toTitulo(row[1]?.toString().trim() || ''),
          parada_nombre: toTitulo(row[2]?.toString().trim() || ''),
          parada_descripcion: toTitulo(row[3]?.toString().trim() || ''),
          orden
        });
      }
    }
    return rowsParsed;
  };

  const parseRowsFromText = (text: string): any[] => {
    const lines = text.split('\n');
    const rowsParsed: any[] = [];
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      if (line.toLowerCase().includes('escuela') && line.toLowerCase().includes('ruta')) {
        continue;
      }
      const delimiter = line.includes('\t') ? '\t' : (line.includes(';') ? ';' : ',');
      const parts = line.split(delimiter).map(p => p.trim());
      if (parts.length >= 3) {
        const esc = parts[0].toLowerCase();
        const orden = parts[4] ? parseInt(parts[4], 10) : 999;
        if (esc === 'sb' || esc === 'lb') {
          rowsParsed.push({
            escuela_codigo: esc,
            ruta_nombre: toTitulo(parts[1] || ''),
            parada_nombre: toTitulo(parts[2] || ''),
            parada_descripcion: toTitulo(parts[3] || ''),
            orden
          });
        }
      }
    }
    return rowsParsed;
  };

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();

    // If manual pasting happened and parsedRows wasn't updated
    let rowsToSave = parsedRows;
    if (rowsToSave.length === 0 && inputText.trim()) {
      rowsToSave = parseRowsFromText(inputText);
    }

    if (rowsToSave.length === 0) {
      alert("Por favor, ingrese o cargue filas válidas para procesar.");
      return;
    }

    setLoading(true);
    try {
      const res = await onSave(rowsToSave);
      setResultado(res);
    } catch (err: any) {
      alert("Error al procesar la carga: " + err.message);
    }
    setLoading(false);
  };

  const descargarPlantillaExcel = () => {
    const headers = [["Escuela (sb/lb)", "Nombre Ruta", "Nombre Parada", "Descripcion", "Orden"]];
    const data = [
      ["sb", "Ruta Ejemplo Santa Bárbara", "Parada Ejemplo 1", "Frente A La Plaza", 1],
      ["sb", "Ruta Ejemplo Santa Bárbara", "Parada Ejemplo 2", "Frente Al Parque", 2],
      ["lb", "Ruta Ejemplo Libertador", "Parada Ejemplo 1", "Cerca Del Abasto", 1]
    ];
    
    const wsData = [...headers, ...data];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    XLSX.utils.book_append_sheet(wb, ws, "Transporte");
    XLSX.writeFile(wb, "Plantilla_Modelo_Transporte_SIGAE.xlsx");
  };

  const descargarPlantillaCSV = () => {
    let csvContent = "Escuela (sb/lb);Nombre Ruta;Nombre Parada;Descripcion;Orden\n";
    csvContent += "sb;Ruta Ejemplo Santa Bárbara;Parada Ejemplo 1;Frente A La Plaza;1\n";
    csvContent += "sb;Ruta Ejemplo Santa Bárbara;Parada Ejemplo 2;Frente Al Parque;2\n";
    csvContent += "lb;Ruta Ejemplo Libertador;Parada Ejemplo 1;Cerca Del Abasto;1\n";
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Plantilla_Modelo_Transporte_SIGAE.csv";
    link.click();
  };

  const resetAll = () => {
    setInputText('');
    setFileName('');
    setFileSize('');
    setParsedRows([]);
    setResultado(null);
  };

  return (
    <div className="card shadow-sm border-0 rounded-4 animate__animated animate__fadeInRight text-start">
      <div className="card-body p-4 p-md-5">
        
        {/* Header con botón Volver */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3 border-bottom pb-3">
          <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-file-earmark-spreadsheet-fill text-success fs-4"></i>
            Carga Masiva de Transporte Escolar
          </h5>
          <button className="btn btn-outline-secondary rounded-pill px-3 shadow-sm fw-bold animate__animated animate__fadeIn" onClick={onBack}>
            <i className="bi bi-arrow-left me-1"></i> Volver a Configuración
          </button>
        </div>

        {resultado ? (
          /* ====================================================
             PANTALLA DE RESULTADO / REPORTE DE CARGA
             ==================================================== */
          <div className="animate__animated animate__fadeIn">
            <div className="row g-4 mb-4">
              <div className="col-md-4">
                <div className="card border-0 bg-success-subtle p-4 rounded-4 shadow-sm text-center">
                  <i className="bi bi-check-circle-fill text-success mb-2" style={{ fontSize: '2.5rem' }}></i>
                  <h4 className="fw-bold text-success-emphasis mb-0">{resultado.exitosos}</h4>
                  <p className="text-muted small mb-0 mt-1 fw-semibold">Filas Cargadas con Éxito</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 bg-danger-subtle p-4 rounded-4 shadow-sm text-center">
                  <i className="bi bi-exclamation-triangle-fill text-danger mb-2" style={{ fontSize: '2.5rem' }}></i>
                  <h4 className="fw-bold text-danger-emphasis mb-0">{resultado.rechazados}</h4>
                  <p className="text-muted small mb-0 mt-1 fw-semibold">Filas Rechazadas / Con Error</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 bg-light p-4 rounded-4 shadow-sm text-center">
                  <i className="bi bi-list-ol text-dark mb-2" style={{ fontSize: '2.5rem' }}></i>
                  <h4 className="fw-bold text-dark mb-0">{resultado.detalles.length}</h4>
                  <p className="text-muted small mb-0 mt-1 fw-semibold">Total de Filas Procesadas</p>
                </div>
              </div>
            </div>

            <div className="card border shadow-sm rounded-4 mb-4" style={{ overflow: 'hidden' }}>
              <div className="card-header bg-white border-bottom-0 py-3 px-4">
                <h6 className="fw-bold text-dark mb-0">Detalle de la Transacción</h6>
              </div>
              <div className="table-responsive" style={{ maxHeight: '350px' }}>
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
                  <thead className="table-light">
                    <tr>
                      <th className="px-4 py-3" style={{ width: '80px' }}>Fila</th>
                      <th className="py-3" style={{ width: '220px' }}>Datos de Entrada</th>
                      <th className="py-3" style={{ width: '120px' }}>Estado</th>
                      <th className="px-4 py-3">Motivo / Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.detalles.map((det, idx) => (
                      <tr key={idx} className={det.estado === 'Rechazado' ? 'table-danger-subtle' : ''}>
                        <td className="px-4 py-2 font-monospace fw-bold text-muted">#{det.fila}</td>
                        <td className="py-2 text-truncate font-monospace text-dark" style={{ maxWidth: '220px' }} title={det.datos}>
                          {det.datos}
                        </td>
                        <td className="py-2">
                          <span className={`badge rounded-pill px-3 py-1 font-semibold ${det.estado === 'Exitoso' ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                            {det.estado}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-muted fw-semibold">
                          {det.motivo}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary rounded-pill px-4 fw-bold shadow-sm" onClick={onBack}>
                Terminar
              </button>
              <button className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm text-white" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }} onClick={resetAll}>
                <i className="bi bi-arrow-repeat me-1"></i> Cargar Otro Archivo
              </button>
            </div>
          </div>
        ) : (
          /* ====================================================
             PANTALLA DE CARGA / DROPZONE & PREVIEW
             ==================================================== */
          <div className="row g-4">
            
            {/* Panel Izquierdo: Configuración e Instrucciones */}
            <div className="col-lg-5">
              <div className="card border-0 bg-light p-4 rounded-4 h-100 d-flex flex-column">
                <h6 className="fw-bold text-dark mb-3"><i className="bi bi-info-circle-fill text-primary me-2"></i>Instrucciones de Carga</h6>
                <p className="text-muted small">
                  Carga rutas y paradas simultáneamente para ambas escuelas (*Santa Bárbara* y *Libertador Bolívar*) usando una plantilla Excel o un archivo CSV.
                </p>
                
                <div className="mb-4">
                  <span className="fw-bold text-dark small d-block mb-2">Columnas Requeridas:</span>
                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex align-items-center gap-2 small">
                      <span className="badge bg-secondary">1</span>
                      <span>Código Escuela (<code>sb</code> o <code>lb</code>)</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 small">
                      <span className="badge bg-secondary">2</span>
                      <span>Nombre de la Ruta</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 small">
                      <span className="badge bg-secondary">3</span>
                      <span>Nombre de la Parada</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 small">
                      <span className="badge bg-secondary">4</span>
                      <span>Descripción o Referencia de Parada</span>
                    </div>
                    <div className="d-flex align-items-center gap-2 small">
                      <span className="badge bg-secondary">5</span>
                      <span>Orden de Parada (1, 2, 3...)</span>
                    </div>
                  </div>
                </div>

                <div className="d-flex flex-column gap-2 mt-auto">
                  <button 
                    type="button" 
                    className="btn btn-success rounded-pill fw-bold shadow-sm py-2 d-flex align-items-center justify-content-center gap-2"
                    onClick={descargarPlantillaExcel}
                  >
                    <i className="bi bi-file-earmark-excel-fill fs-5"></i> Plantilla Excel (.xlsx)
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary rounded-pill fw-bold shadow-sm py-2 d-flex align-items-center justify-content-center gap-2"
                    onClick={descargarPlantillaCSV}
                  >
                    <i className="bi bi-filetype-csv fs-5"></i> Plantilla Linux (.csv)
                  </button>
                </div>
              </div>
            </div>

            {/* Panel Derecho: Subida e Inspección de Archivo */}
            <div className="col-lg-7">
              <form onSubmit={handleProcess}>
                
                {/* Zona Drop / File Upload */}
                <div className="mb-4">
                  <label className="form-label fw-bold text-dark small mb-2">Paso 1: Selecciona tu archivo Excel o Linux (CSV/ODS)</label>
                  
                  {!fileName ? (
                    <div 
                      className="p-5 rounded-4 border-2 border-dashed text-center position-relative transition-all"
                      style={{ 
                        borderColor: '#10b981', 
                        backgroundColor: '#f0fdf4',
                        cursor: 'pointer'
                      }}
                      onClick={() => document.getElementById('bulk-file-input-view')?.click()}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#ecfdf5')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f0fdf4')}
                    >
                      <input 
                        type="file" 
                        id="bulk-file-input-view"
                        accept=".xlsx, .xls, .ods, .csv, .txt" 
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                        disabled={loading}
                      />
                      <i className="bi bi-cloud-upload-fill text-success" style={{ fontSize: '3rem' }}></i>
                      <h6 className="fw-bold mt-3 text-dark mb-1">Arrastra tu plantilla aquí o haz clic para buscar</h6>
                      <p className="text-muted small mb-0">Formatos compatibles: Excel (.xlsx, .xls) o Linux (.ods, .csv)</p>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center justify-content-between p-3 bg-white border border-success rounded-3 shadow-sm animate__animated animate__fadeIn">
                      <div className="d-flex align-items-center gap-3">
                        <i className="bi bi-file-earmark-excel-fill text-success" style={{ fontSize: '2.5rem' }}></i>
                        <div className="text-start">
                          <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '280px', fontSize: '0.9rem' }}>{fileName}</div>
                          <div className="text-muted small">{fileSize}</div>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-danger rounded-circle p-0 d-flex align-items-center justify-content-center"
                        style={{ width: '32px', height: '32px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setInputText('');
                          setFileName('');
                          setFileSize('');
                          setParsedRows([]);
                          const el = document.getElementById('bulk-file-input-view') as HTMLInputElement;
                          if (el) el.value = '';
                        }}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </div>
                  )}
                </div>

                {/* Vista Previa */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label fw-bold text-dark small mb-0">Paso 2: Vista previa del contenido</label>
                    {inputText && (
                      <button type="button" className="btn btn-link text-danger p-0 text-decoration-none small fw-bold" onClick={resetAll}>
                        <i className="bi bi-trash3 me-1"></i>Limpiar
                      </button>
                    )}
                  </div>
                  <textarea
                    className="form-control font-monospace border shadow-sm rounded-3 p-3"
                    style={{ height: '180px', fontSize: '0.82rem', backgroundColor: '#ffffff', color: '#334155', resize: 'none' }}
                    placeholder="El contenido de tu archivo cargado aparecerá aquí. También puedes pegar filas directamente desde Excel..."
                    value={inputText}
                    onChange={e => {
                      setInputText(e.target.value);
                      setParsedRows(parseRowsFromText(e.target.value));
                    }}
                    disabled={loading}
                  />
                </div>

                {/* Botón de Procesamiento */}
                <div className="d-grid mt-4">
                  <button 
                    type="submit" 
                    className="btn btn-primary rounded-pill fw-bold py-3 text-white shadow" 
                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Procesando e Insertando Recorrido...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle-fill me-1"></i> Iniciar Carga Masiva
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
