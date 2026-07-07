import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// CSS para convertir los modales en Paneles Deslizantes Laterales (Drawers) de alta gama
const DrawerStyles = () => (
  <style>{`
    .modal-backdrop-custom {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: rgba(15, 23, 42, 0.3) !important;
      backdrop-filter: blur(8px) !important;
      -webkit-backdrop-filter: blur(8px) !important;
      z-index: 2000 !important;
      display: flex !important;
      justify-content: flex-end !important;
      align-items: stretch !important;
      animation: fadeInBg 0.25s ease-out !important;
    }
    .modal-custom {
      background: #ffffff !important;
      width: 100% !important;
      max-width: 650px !important;
      height: 100vh !important;
      margin: 0 !important;
      border-radius: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      box-shadow: -8px 0 35px rgba(15, 23, 42, 0.15) !important;
      animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
      overflow: hidden !important;
      border-left: 1px solid rgba(0,0,0,0.05) !important;
    }
    .modal-custom .modal-header {
      padding: 24px 30px !important;
      border-bottom: 1px solid rgba(0,0,0,0.05) !important;
      background: #ffffff !important;
      flex-shrink: 0 !important;
    }
    .modal-custom .modal-body {
      flex: 1 !important;
      overflow-y: auto !important;
      padding: 30px !important;
      background: #f8fafc !important;
    }
    .modal-custom .d-flex.justify-content-end.gap-2 {
      padding: 20px 30px !important;
      border-top: 1px solid rgba(0,0,0,0.05) !important;
      background: #ffffff !important;
      flex-shrink: 0 !important;
      width: 100% !important;
    }
    @keyframes fadeInBg {
      from { background: rgba(15, 23, 42, 0); }
      to { background: rgba(15, 23, 42, 0.3); }
    }
    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    @media (max-width: 768px) {
      .modal-custom {
        max-width: 100% !important;
      }
    }
  `}</style>
);

// ==========================================
// MODAL: PARADA
// ==========================================
interface ModalParadaProps {
  paradaForm: { id: string; nombre: string; descripcion: string };
  onClose: () => void;
  onSave: (form: { id: string; nombre: string; descripcion: string }) => void;
}

export const ModalParada: React.FC<ModalParadaProps> = ({ paradaForm, onClose, onSave }) => {
  const [localForm, setLocalForm] = useState(paradaForm);

  useEffect(() => {
    setLocalForm(paradaForm);
  }, [paradaForm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localForm);
  };

  return createPortal(
    <>
      <DrawerStyles />
      <div className="modal-backdrop-custom show">
        <div className="modal-custom shadow-lg">
          <div className="modal-header border-bottom-0 pb-0">
            <h5 className="modal-title fw-bold text-dark">{localForm.id ? 'Editar Parada' : 'Nueva Parada'}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold small">Nombre de Parada</label>
                <input
                  type="text"
                  className="form-control input-moderno"
                  required
                  value={localForm.nombre}
                  onChange={e => setLocalForm({ ...localForm, nombre: e.target.value })}
                  placeholder="Ej: Plaza Bolívar"
                />
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold small">Referencia / Descripción</label>
                <input
                  type="text"
                  className="form-control input-moderno"
                  value={localForm.descripcion}
                  onChange={e => setLocalForm({ ...localForm, descripcion: e.target.value })}
                  placeholder="Ej: Frente a la panadería"
                />
              </div>
              <div className="d-grid">
                <button type="submit" className="btn btn-primary rounded-pill fw-bold shadow-sm py-2">Guardar Parada</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

// ==========================================
// MODAL: RUTA
// ==========================================
interface ModalRutaProps {
  rutaForm: any;
  paradas: any[];
  rutas: any[];
  initialParadasTemporales: any[];
  onClose: () => void;
  onSave: (rutaForm: any, paradasTemporales: any[]) => void;
}

export const ModalRuta: React.FC<ModalRutaProps> = ({
  rutaForm,
  paradas,
  rutas,
  initialParadasTemporales,
  onClose,
  onSave
}) => {
  const [localForm, setLocalForm] = useState(rutaForm);
  const [paradasTemporales, setParadasTemporales] = useState<any[]>(initialParadasTemporales);

  const allOtherRoutesAssignedPids = (rutas || [])
    .filter(r => r.id !== localForm.id)
    .reduce((acc: string[], r: any) => {
      let pids: string[] = [];
      if (Array.isArray(r.paradas_json)) pids = r.paradas_json;
      else if (typeof r.paradas_json === 'string') {
        try { pids = JSON.parse(r.paradas_json); } catch (e) {}
      }
      return [...acc, ...pids];
    }, []);

  const paradasDisponibles = paradas.filter(p => 
    !paradasTemporales.find(pt => pt.id === p.id) && 
    !allOtherRoutesAssignedPids.includes(p.id)
  );

  useEffect(() => {
    setLocalForm(rutaForm);
  }, [rutaForm]);

  useEffect(() => {
    setParadasTemporales(initialParadasTemporales);
  }, [initialParadasTemporales]);

  const removeParadaTemp = (idx: number) => {
    const arr = [...paradasTemporales];
    arr.splice(idx, 1);
    setParadasTemporales(arr);
  };

  const moveParadaTemp = (idx: number, dir: number) => {
    const arr = [...paradasTemporales];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= arr.length) return;
    const temp = arr[idx];
    arr[idx] = arr[targetIdx];
    arr[targetIdx] = temp;
    setParadasTemporales(arr);
  };

  const handleSave = () => {
    onSave(localForm, paradasTemporales);
  };

  return createPortal(
    <>
      <DrawerStyles />
      <div className="modal-backdrop-custom show">
        <div className="modal-custom shadow-lg">
          <div className="modal-header border-bottom-0 pb-0">
          <h5 className="modal-title fw-bold text-dark">{localForm.id ? 'Editar Ruta' : 'Diseño de Ruta'}</h5>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>
        <div className="modal-body">
          <div className="row g-3 mb-4">
            <div className="col-12">
              <label className="form-label fw-semibold small">Nombre de Ruta</label>
              <input
                type="text"
                className="form-control input-moderno fw-bold"
                value={localForm.nombre}
                onChange={e => setLocalForm({ ...localForm, nombre: e.target.value })}
                placeholder="Ej: Ruta 1 - Centro"
              />
            </div>
          </div>

          <div className="card border rounded-4 bg-light mb-4 shadow-sm border-0">
            <div className="card-body p-4">
              <label className="form-label fw-bold text-primary mb-3">
                <i className="bi bi-grid-3x3-gap-fill me-2"></i>Paradas Disponibles (Clic para añadir)
              </label>
              <div className="d-flex flex-wrap gap-2 mb-4">
                {paradasDisponibles.map(p => (
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
                {paradasDisponibles.length === 0 && (
                  <span className="text-muted small w-100 text-center d-block py-2">No hay más paradas disponibles (ya asignadas a otra ruta o agregadas).</span>
                )}
              </div>

              <hr className="text-secondary opacity-25 my-4" />
              
              <label className="form-label fw-bold text-dark mb-3">
                <i className="bi bi-geo-alt-fill text-primary me-2"></i>Recorrido Ensamblado
              </label>
              <div>
                {paradasTemporales.length === 0 ? (
                  <div className="text-center text-muted small p-4 bg-white rounded-4 shadow-sm border border-dashed">
                    Haz clic en las paradas arriba para ensamblar tu ruta.
                  </div>
                ) : (
                  <div className="winding-road-container bg-white rounded-4 shadow-sm border p-3">
                    {(() => {
                      const itemsPerRow = 3;
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
                          <div key={`modal-row-${rowIdx}`} className={rowClasses} style={{ padding: '20px 0' }}>
                            {hasNextRow && (
                              <div className={`road-curve ${!isReverse ? 'right' : 'left'}`}></div>
                            )}
                            {chunk.map((p, colIdx) => {
                              const idx = rowIdx * itemsPerRow + colIdx;
                              return (
                                <div key={p.id} className="timeline-node" style={{ width: '90px' }}>
                                  <div className="timeline-icon stop" style={{ width: '40px', height: '40px', fontSize: '1.2rem' }} title={p.nombre_parada}>
                                    <i className="bi bi-geo-fill"></i>
                                  </div>
                                  <div className="timeline-content py-2 px-2" style={{ width: '120px', marginTop: '10px' }}>
                                    <div className="d-flex align-items-center mb-2">
                                      <div className="d-flex flex-column me-2">
                                        <button className="btn btn-sm text-secondary p-0 shadow-none" style={{ lineHeight: 0.5 }} disabled={idx === 0} onClick={() => moveParadaTemp(idx, -1)}><i className="bi bi-chevron-up fs-6 hover-text-primary"></i></button>
                                        <button className="btn btn-sm text-secondary p-0 mt-2 shadow-none" style={{ lineHeight: 0.5 }} disabled={idx === paradasTemporales.length - 1} onClick={() => moveParadaTemp(idx, 1)}><i className="bi bi-chevron-down fs-6 hover-text-primary"></i></button>
                                      </div>
                                      <div className="text-start">
                                        <span className="badge bg-primary rounded-pill shadow-sm mb-1">{idx + 1}</span>
                                        <div className="fw-bold text-dark" style={{ fontSize: '0.75rem', lineHeight: '1' }}>{p.nombre_parada}</div>
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
            <button className="btn btn-light rounded-pill px-4 fw-bold" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm" onClick={handleSave}>Guardar Ruta</button>
          </div>
        </div>
      </div>
    </div>
    </>,
    document.body
  );
};

// ==========================================
// MODAL: ASIGNACION
// ==========================================
interface ModalAsignacionProps {
  rutaForm: any;
  docentes: any[];
  onClose: () => void;
  onSave: (form: any) => void;
}

export const ModalAsignacion: React.FC<ModalAsignacionProps> = ({
  rutaForm,
  docentes,
  onClose,
  onSave
}) => {
  const [localForm, setLocalForm] = useState(rutaForm);

  useEffect(() => {
    setLocalForm(rutaForm);
  }, [rutaForm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localForm);
  };

  return createPortal(
    <>
      <DrawerStyles />
      <div className="modal-backdrop-custom show">
        <div className="modal-custom shadow-lg">
          <div className="modal-header border-bottom-0 pb-0">
          <h5 className="modal-title fw-bold text-dark">Asignar Personal a {localForm.nombre}</h5>
          <button type="button" className="btn-close" onClick={onClose}></button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Chofer de Unidad</label>
              <input
                type="text"
                className="form-control input-moderno"
                value={localForm.chofer_nombre || ''}
                onChange={e => setLocalForm({ ...localForm, chofer_nombre: e.target.value })}
                placeholder="Nombre completo del chofer"
              />
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold small">Docentes de Guardia (Opcional)</label>
              <select
                className="form-select input-moderno"
                value={localForm.docente_id || ''}
                onChange={e => setLocalForm({ ...localForm, docente_id: e.target.value })}
              >
                <option value="">-- Seleccione Docente --</option>
                {docentes.map(d => (
                  <option key={d.id_usuario} value={d.id_usuario}>
                    {d.nombre_completo}
                  </option>
                ))}
              </select>
            </div>
            <div className="row mb-4">
              <div className="col-6">
                <label className="form-label fw-semibold small text-muted">Válida Desde</label>
                <input
                  type="date"
                  className="form-control input-moderno"
                  value={localForm.validez_desde || ''}
                  onChange={e => setLocalForm({ ...localForm, validez_desde: e.target.value })}
                />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold small text-muted">Válida Hasta</label>
                <input
                  type="date"
                  className="form-control input-moderno"
                  value={localForm.validez_hasta || ''}
                  onChange={e => setLocalForm({ ...localForm, validez_hasta: e.target.value })}
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold small">Estatus de la Ruta</label>
              <div className="d-flex gap-2">
                {[
                  { label: 'Activa', val: true },
                  { label: 'Inactiva', val: false }
                ].map(opt => {
                  const isSel = (localForm.activo !== false && opt.val) || (localForm.activo === false && !opt.val);
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      className={`btn rounded-pill flex-grow-1 fw-bold ${isSel ? (opt.val ? 'btn-success shadow' : 'btn-danger shadow') : 'btn-outline-secondary'}`}
                      onClick={() => setLocalForm({ ...localForm, activo: opt.val })}
                    >
                      {opt.val ? <i className="bi bi-check-circle-fill me-1"></i> : <i className="bi bi-x-circle-fill me-1"></i>}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-danger rounded-pill fw-bold px-3"
                onClick={() => setLocalForm({
                  ...localForm,
                  chofer_nombre: '',
                  docente_id: '',
                  validez_desde: '',
                  validez_hasta: '',
                  activo: true
                })}
              >
                <i className="bi bi-eraser-fill me-1"></i> Limpiar Todo
              </button>
              <button type="submit" className="btn btn-primary rounded-pill fw-bold shadow-sm py-2 flex-grow-1">Guardar Asignación</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>,
    document.body
  );
};
// (ModalCargaMasiva has been moved to CargaMasivaView)
