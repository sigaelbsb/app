import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermisos } from '../../hooks/usePermisos';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';

interface EscuelaData {
  id_escuela: string;
  nombre_institucion: string;
  codigo_dea: string;
  rif: string;
  direccion: string;
  mision: string;
  vision: string;
  objetivo: string;
  peic: string;
}

export const PerfilEscuela = () => {
  const navigate = useNavigate();
  const Swal = (window as any).Swal;
  const { tienePermisoEnEscuela, loading: permLoading } = usePermisos();

  const [loadingData, setLoadingData] = useState(true);
  const [perfiles, setPerfiles] = useState<Record<string, EscuelaData>>({
    lb: { id_escuela: 'lb', nombre_institucion: '', codigo_dea: '', rif: '', direccion: '', mision: '', vision: '', objetivo: '', peic: '' },
    sb: { id_escuela: 'sb', nombre_institucion: '', codigo_dea: '', rif: '', direccion: '', mision: '', vision: '', objetivo: '', peic: '' }
  });

  const hasAccessLB = tienePermisoEnEscuela('lb', 'Perfil de la Escuela', 'ver');
  const hasAccessSB = tienePermisoEnEscuela('sb', 'Perfil de la Escuela', 'ver');
  const noAccess = !permLoading && !hasAccessLB && !hasAccessSB;

  useEffect(() => {
    if (permLoading || noAccess) return;

    const cargarPerfiles = async () => {
      setLoadingData(true);
      try {
        const { data, error } = await supabase
          .from('perfil_escuela')
          .select('*');

        if (error) throw error;

        if (data) {
          const newPerfiles: Record<'lb' | 'sb', EscuelaData> = {
            lb: { id_escuela: 'lb', nombre_institucion: '', codigo_dea: '', rif: '', direccion: '', mision: '', vision: '', objetivo: '', peic: '' },
            sb: { id_escuela: 'sb', nombre_institucion: '', codigo_dea: '', rif: '', direccion: '', mision: '', vision: '', objetivo: '', peic: '' }
          };
          data.forEach((esc: any) => {
            if (esc.id_escuela === 'lb' || esc.id_escuela === 'sb') {
              newPerfiles[esc.id_escuela as 'lb' | 'sb'] = {
                id_escuela: esc.id_escuela,
                nombre_institucion: esc.nombre_institucion || '',
                codigo_dea: esc.codigo_dea || '',
                rif: esc.rif || '',
                direccion: esc.direccion || '',
                mision: esc.mision || '',
                vision: esc.vision || '',
                objetivo: esc.objetivo || '',
                peic: esc.peic || ''
              };
            }
          });
          setPerfiles(newPerfiles);
        }
      } catch (e: any) {
        console.error("Error cargando los perfiles:", e);
        if (Swal) {
          Swal.fire('Error al Cargar', e.message || 'No se pudo leer la base de datos', 'error');
        }
      } finally {
        setLoadingData(false);
      }
    };

    cargarPerfiles();
  }, [permLoading, noAccess]);

  const handleChange = (escuela: 'lb' | 'sb', field: keyof EscuelaData, val: string) => {
    setPerfiles(prev => ({
      ...prev,
      [escuela]: {
        ...prev[escuela],
        [field]: val
      }
    }));
  };

  const handleGuardar = async () => {
    if (hasAccessLB && !perfiles.lb.nombre_institucion.trim()) {
      if (Swal) Swal.fire('Atención', 'El nombre oficial de la UE Libertador Bolívar es obligatorio.', 'warning');
      return;
    }
    if (hasAccessSB && !perfiles.sb.nombre_institucion.trim()) {
      if (Swal) Swal.fire('Atención', 'El nombre oficial de la UE Santa Bárbara es obligatorio.', 'warning');
      return;
    }

    if (Swal) {
      Swal.fire({
        title: 'Guardando Cambios',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
    }

    try {
      if (hasAccessLB) {
        const { error: errLB } = await supabase
          .from('perfil_escuela')
          .update({
            nombre_institucion: perfiles.lb.nombre_institucion.trim(),
            codigo_dea: perfiles.lb.codigo_dea.trim(),
            rif: perfiles.lb.rif.trim(),
            direccion: perfiles.lb.direccion.trim(),
            mision: perfiles.lb.mision.trim(),
            vision: perfiles.lb.vision.trim(),
            objetivo: perfiles.lb.objetivo.trim(),
            peic: perfiles.lb.peic.trim()
          })
          .eq('id_escuela', 'lb');

        if (errLB) throw errLB;
      }

      if (hasAccessSB) {
        const { error: errSB } = await supabase
          .from('perfil_escuela')
          .update({
            nombre_institucion: perfiles.sb.nombre_institucion.trim(),
            codigo_dea: perfiles.sb.codigo_dea.trim(),
            rif: perfiles.sb.rif.trim(),
            direccion: perfiles.sb.direccion.trim(),
            mision: perfiles.sb.mision.trim(),
            vision: perfiles.sb.vision.trim(),
            objetivo: perfiles.sb.objetivo.trim(),
            peic: perfiles.sb.peic.trim()
          })
          .eq('id_escuela', 'sb');

        if (errSB) throw errSB;
      }

      if (Swal) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Complejo Educativo Actualizado',
          showConfirmButton: false,
          timer: 2500
        });
      }

      auditar('Perfil de la Escuela', 'Actualizar Complejo', `Se actualizaron los perfiles de las escuelas autorizadas.`);
    } catch (e: any) {
      console.error("Error crítico en guardarPerfil:", e);
      if (Swal) {
        Swal.fire({
          title: 'Error al Guardar',
          text: e.message || 'Error desconocido al guardar.',
          icon: 'error'
        });
      }
    }
  };

  if (permLoading || loadingData) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando datos...</span>
        </div>
      </div>
    );
  }

  if (noAccess) {
    return (
      <div className="col-12 text-center py-5 mt-4">
        <div className="bg-light d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm border" style={{ width: '100px', height: '100px' }}>
          <i className="bi bi-shield-lock-fill text-muted" style={{ fontSize: '3.5rem' }}></i>
        </div>
        <h4 className="text-dark fw-bold mb-2">Área Restringida</h4>
        <p className="text-muted mb-0">No tienes permisos asignados para visualizar el perfil escolar.</p>
      </div>
    );
  }

  return (
    <div className="modulo-animado">
      <div className="row mb-5 animate__animated animate__fadeInDown">
        <div className="col-12">
          <div className="banner-modulo p-4 p-md-5 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
            <div className="burbuja-3d burbuja-1"></div>
            <div className="burbuja-3d burbuja-2"></div>
            <div className="burbuja-3d burbuja-3"></div>
            <div className="row align-items-center position-relative z-1">
              <div className="col-12 text-center text-md-start mb-3 mb-md-0">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <span className="badge bg-white px-3 py-2 shadow-sm fw-bold text-dark" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>
                  <i className="bi bi-building me-1"></i> DIRECCIÓN Y SISTEMA
                </span>
                <button 
                  onClick={() => navigate('/categoria/Direcci%C3%B3n%20y%20Sistema')} 
                  className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                >
                  <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
                </button>
              </div>
                <h1 className="fw-bolder mb-2 text-white" style={{ fontSize: '2.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}><i className="bi bi-bank2 me-3"></i>Perfil del Complejo Educativo</h1>
                <p className="mb-0 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.9)' }}>Configura la identidad y filosofía de ambas instituciones en simultáneo.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-5 animate__animated animate__fadeInUp">
        {/* COLUMNA: UE Libertador Bolívar */}
        {hasAccessLB && (
          <div className="col-xl-6">
            <div className="card border-0 shadow-sm rounded-4 h-100 border-top border-primary border-5">
              <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center rounded-top-4">
                <h4 className="fw-bold text-primary mb-0"><i className="bi bi-building-check me-2"></i>UE Libertador Bolívar</h4>
                <img src="/assets/img/logo_lb.png" alt="Logo LB" style={{ height: '45px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div className="card-body p-4 bg-light">
                {/* Identidad LB */}
                <div className="tarjeta-modulo p-4 bg-white shadow-sm mb-4 border-top border-5 border-primary" style={{ borderRadius: '16px' }}>
                  <h5 className="fw-bold text-dark mb-3"><i className="bi bi-bank2 text-primary me-2"></i>Identidad Institucional</h5>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="fw-bold text-muted small mb-1">Nombre Oficial <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        value={perfiles.lb.nombre_institucion} 
                        onChange={(e) => handleChange('lb', 'nombre_institucion', e.target.value)} 
                        className="form-control fw-bold" 
                        placeholder="Ej: UE Libertador Bolívar" 
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="fw-bold text-muted small mb-1">Código DEA</label>
                      <input 
                        type="text" 
                        value={perfiles.lb.codigo_dea} 
                        onChange={(e) => handleChange('lb', 'codigo_dea', e.target.value)} 
                        className="form-control text-uppercase" 
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="fw-bold text-muted small mb-1">RIF</label>
                      <input 
                        type="text" 
                        value={perfiles.lb.rif} 
                        onChange={(e) => handleChange('lb', 'rif', e.target.value)} 
                        className="form-control text-uppercase" 
                      />
                    </div>
                    <div className="col-12">
                      <label className="fw-bold text-muted small mb-1">Dirección Completa</label>
                      <textarea 
                        value={perfiles.lb.direccion} 
                        onChange={(e) => handleChange('lb', 'direccion', e.target.value)} 
                        className="form-control" 
                        rows={2} 
                      />
                    </div>
                  </div>
                </div>

                {/* Filosofía LB */}
                <div className="tarjeta-modulo p-4 bg-white shadow-sm mb-4 border-top border-5 border-info" style={{ borderRadius: '16px' }}>
                  <h5 className="fw-bold text-dark mb-3"><i className="bi bi-compass text-info me-2"></i>Filosofía de Gestión</h5>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="fw-bold text-primary small mb-1"><i className="bi bi-rocket-takeoff-fill me-1"></i>Misión</label>
                      <textarea 
                        value={perfiles.lb.mision} 
                        onChange={(e) => handleChange('lb', 'mision', e.target.value)} 
                        className="form-control" 
                        rows={3} 
                        style={{ background: '#eff6ff', borderColor: '#bfdbfe' }} 
                      />
                    </div>
                    <div className="col-12">
                      <label className="fw-bold text-info small mb-1"><i className="bi bi-eye-fill me-1"></i>Visión</label>
                      <textarea 
                        value={perfiles.lb.vision} 
                        onChange={(e) => handleChange('lb', 'vision', e.target.value)} 
                        className="form-control" 
                        rows={3} 
                        style={{ background: '#ecfeff', borderColor: '#a5f3fc' }} 
                      />
                    </div>
                    <div className="col-12">
                      <label className="fw-bold text-success small mb-1"><i className="bi bi-gem me-1"></i>Valores / Objetivo</label>
                      <textarea 
                        value={perfiles.lb.objetivo} 
                        onChange={(e) => handleChange('lb', 'objetivo', e.target.value)} 
                        className="form-control" 
                        rows={2} 
                        style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }} 
                      />
                    </div>
                  </div>
                </div>

                {/* PEIC LB */}
                <div className="tarjeta-modulo p-4 bg-white shadow-sm border-top border-5 border-warning" style={{ borderRadius: '16px' }}>
                  <h5 className="fw-bold text-dark mb-3"><i className="bi bi-journal-bookmark-fill text-warning me-2"></i>Proyecto Educativo (PEIC)</h5>
                  <div className="col-12">
                    <textarea 
                      value={perfiles.lb.peic} 
                      onChange={(e) => handleChange('lb', 'peic', e.target.value)} 
                      className="form-control" 
                      rows={2} 
                      style={{ background: '#fffbeb', borderColor: '#fde68a' }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COLUMNA: UE Santa Bárbara */}
        {hasAccessSB && (
          <div className="col-xl-6">
            <div className="card border-0 shadow-sm rounded-4 h-100 border-top border-success border-5">
              <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center rounded-top-4">
                <h4 className="fw-bold text-success mb-0"><i className="bi bi-building-check me-2"></i>UE Santa Bárbara</h4>
                <img src="/assets/img/logo_sb.png" alt="Logo SB" style={{ height: '45px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div className="card-body p-4 bg-light">
                {/* Identidad SB */}
                <div className="tarjeta-modulo p-4 bg-white shadow-sm mb-4 border-top border-5 border-success" style={{ borderRadius: '16px' }}>
                  <h5 className="fw-bold text-dark mb-3"><i className="bi bi-bank2 text-success me-2"></i>Identidad Institucional</h5>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="fw-bold text-muted small mb-1">Nombre Oficial <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        value={perfiles.sb.nombre_institucion} 
                        onChange={(e) => handleChange('sb', 'nombre_institucion', e.target.value)} 
                        className="form-control fw-bold" 
                        placeholder="Ej: UE Santa Bárbara" 
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="fw-bold text-muted small mb-1">Código DEA</label>
                      <input 
                        type="text" 
                        value={perfiles.sb.codigo_dea} 
                        onChange={(e) => handleChange('sb', 'codigo_dea', e.target.value)} 
                        className="form-control text-uppercase" 
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="fw-bold text-muted small mb-1">RIF</label>
                      <input 
                        type="text" 
                        value={perfiles.sb.rif} 
                        onChange={(e) => handleChange('sb', 'rif', e.target.value)} 
                        className="form-control text-uppercase" 
                      />
                    </div>
                    <div className="col-12">
                      <label className="fw-bold text-muted small mb-1">Dirección Completa</label>
                      <textarea 
                        value={perfiles.sb.direccion} 
                        onChange={(e) => handleChange('sb', 'direccion', e.target.value)} 
                        className="form-control" 
                        rows={2} 
                      />
                    </div>
                  </div>
                </div>

                {/* Filosofía SB */}
                <div className="tarjeta-modulo p-4 bg-white shadow-sm mb-4 border-top border-5 border-info" style={{ borderRadius: '16px' }}>
                  <h5 className="fw-bold text-dark mb-3"><i className="bi bi-compass text-info me-2"></i>Filosofía de Gestión</h5>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="fw-bold text-primary small mb-1"><i className="bi bi-rocket-takeoff-fill me-1"></i>Misión</label>
                      <textarea 
                        value={perfiles.sb.mision} 
                        onChange={(e) => handleChange('sb', 'mision', e.target.value)} 
                        className="form-control" 
                        rows={3} 
                        style={{ background: '#eff6ff', borderColor: '#bfdbfe' }} 
                      />
                    </div>
                    <div className="col-12">
                      <label className="fw-bold text-info small mb-1"><i className="bi bi-eye-fill me-1"></i>Visión</label>
                      <textarea 
                        value={perfiles.sb.vision} 
                        onChange={(e) => handleChange('sb', 'vision', e.target.value)} 
                        className="form-control" 
                        rows={3} 
                        style={{ background: '#ecfeff', borderColor: '#a5f3fc' }} 
                      />
                    </div>
                    <div className="col-12">
                      <label className="fw-bold text-success small mb-1"><i className="bi bi-gem me-1"></i>Valores / Objetivo</label>
                      <textarea 
                        value={perfiles.sb.objetivo} 
                        onChange={(e) => handleChange('sb', 'objetivo', e.target.value)} 
                        className="form-control" 
                        rows={2} 
                        style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }} 
                      />
                    </div>
                  </div>
                </div>

                {/* PEIC SB */}
                <div className="tarjeta-modulo p-4 bg-white shadow-sm border-top border-5 border-warning" style={{ borderRadius: '16px' }}>
                  <h5 className="fw-bold text-dark mb-3"><i className="bi bi-journal-bookmark-fill text-warning me-2"></i>Proyecto Educativo (PEIC)</h5>
                  <div className="col-12">
                    <textarea 
                      value={perfiles.sb.peic} 
                      onChange={(e) => handleChange('sb', 'peic', e.target.value)} 
                      className="form-control" 
                      rows={2} 
                      style={{ background: '#fffbeb', borderColor: '#fde68a' }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-end mb-5 pb-5">
        <button 
          className="btn btn-primary rounded-pill px-5 py-3 shadow-lg fs-5 w-100 w-md-auto d-inline-flex align-items-center justify-content-center hover-efecto" 
          onClick={handleGuardar}
        >
          <i className="bi bi-save-fill me-2"></i> Guardar Cambios del Complejo Educativo
        </button>
      </div>
    </div>
  );
};
