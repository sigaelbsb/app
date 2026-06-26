import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';

export const PanelControl = () => {
  const navigate = useNavigate();
  const { tienePermiso, loading: permLoading } = usePermisos();
  const Swal = (window as any).Swal;

  const [mantenimiento, setMantenimiento] = useState<boolean>(false);
  const [bloquearInvitados, setBloquearInvitados] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isModuleRestricted = !permLoading && !tienePermiso('Panel de Control', 'ver');
  const canModify = tienePermiso('Panel de Control', 'modificar') || tienePermiso('Panel de Control', 'crear');
  const canDelete = tienePermiso('Panel de Control', 'eliminar');

  useEffect(() => {
    if (!permLoading && tienePermiso('Panel de Control', 'ver')) {
      cargarAjustes();
    }
  }, [permLoading]);

  const cargarAjustes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ajustes_globales')
        .select('*');

      if (error) throw error;

      if (data) {
        const maint = data.find(x => x.clave === 'mantenimiento_activo');
        if (maint) setMantenimiento(maint.valor === 'true');

        const guests = data.find(x => x.clave === 'bloquear_invitados');
        if (guests) setBloquearInvitados(guests.valor === 'true');
      }
    } catch (e: any) {
      console.error("Error al cargar ajustes globales:", e);
      if (Swal && e.code === 'PGRST205') {
        Swal.fire({
          title: 'Tabla No Migrada',
          html: 'La tabla <code>ajustes_globales</code> no ha sido creada en la base de datos Supabase.<br/><br/>Por favor, ejecuta el script SQL provisto.',
          icon: 'warning',
          confirmButtonColor: '#FF8D00'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMantenimiento = async (newValue: boolean) => {
    if (!canModify) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permisos para modificar los ajustes del sistema.', 'error');
      return;
    }

    if (!Swal) return;

    const actionText = newValue ? 'activar' : 'desactivar';
    const confirmResult = await Swal.fire({
      title: `¿Confirmar acción?`,
      text: `¿Estás seguro de que deseas ${actionText} el Modo Mantenimiento Global? ${newValue ? 'Los usuarios no autorizados serán desconectados inmediatamente.' : 'Los accesos volverán a la normalidad.'}`,
      icon: newValue ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${actionText}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: newValue ? '#d33' : '#3085d6',
      cancelButtonColor: '#6c757d'
    });

    if (!confirmResult.isConfirmed) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('ajustes_globales')
        .update({ valor: String(newValue), actualizado_en: new Date().toISOString() })
        .eq('clave', 'mantenimiento_activo');

      if (error) throw error;

      setMantenimiento(newValue);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Modo mantenimiento ${newValue ? 'activado' : 'desactivado'}`,
        showConfirmButton: false,
        timer: 2000
      });

      auditar(
        'Panel de Control', 
        newValue ? 'Activar Mantenimiento' : 'Desactivar Mantenimiento', 
        `Se cambió el estado del mantenimiento global a: ${newValue ? 'ACTIVO' : 'INACTIVO'}`
      );
      
      window.dispatchEvent(new Event('sigae-maintenance-changed'));
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudo guardar la configuración.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleInvitados = async (newValue: boolean) => {
    if (!canModify) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permisos para modificar los ajustes del sistema.', 'error');
      return;
    }

    if (!Swal) return;

    const actionText = newValue ? 'bloquear' : 'desbloquear';
    const confirmResult = await Swal.fire({
      title: `¿Confirmar acción?`,
      text: `¿Estás seguro de que deseas ${actionText} el ingreso de nuevos invitados y visitantes?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${actionText}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: newValue ? '#d33' : '#3085d6',
      cancelButtonColor: '#6c757d'
    });

    if (!confirmResult.isConfirmed) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('ajustes_globales')
        .update({ valor: String(newValue), actualizado_en: new Date().toISOString() })
        .eq('clave', 'bloquear_invitados');

      if (error) throw error;

      setBloquearInvitados(newValue);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Ingreso de visitantes ${newValue ? 'bloqueado' : 'permitido'}`,
        showConfirmButton: false,
        timer: 2000
      });

      auditar(
        'Panel de Control', 
        newValue ? 'Bloquear Invitados' : 'Desbloquear Invitados', 
        `Se cambió el estado del acceso a visitantes a: ${newValue ? 'BLOQUEADO' : 'PERMITIDO'}`
      );
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudo guardar la configuración.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const vaciarTabla = async (tabla: 'salones' | 'colectivos', schoolCode: 'sb' | 'lb') => {
    if (!canDelete) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permisos para eliminar registros globales.', 'error');
      return;
    }

    if (!Swal) return;

    const nombreTabla = tabla === 'salones' ? 'Salones/Aulas' : 'Colectivos';
    const schoolName = schoolCode === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
    
    const confirmResult = await Swal.fire({
      title: `¿Eliminar todos los ${nombreTabla} de ${schoolName}?`,
      html: `Esta acción es <strong class="text-danger">irreversible</strong> y eliminará todos los registros de <strong>${nombreTabla}</strong> creados para la institución <strong>${schoolName}</strong>.<br/><br/>Para proceder, escribe la palabra <strong class="text-dark">ELIMINAR</strong> en el campo de abajo:`,
      icon: 'warning',
      input: 'text',
      inputPlaceholder: 'ELIMINAR',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar todo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      preConfirm: (value: string) => {
        if (value !== 'ELIMINAR') {
          Swal.showValidationMessage('Debes escribir exactamente "ELIMINAR"');
          return false;
        }
        return true;
      }
    });

    if (!confirmResult.isConfirmed) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from(tabla)
        .delete()
        .eq('id_escuela', schoolCode);

      if (error) throw error;

      Swal.fire('Eliminado', `Se han vaciado con éxito todos los registros de ${nombreTabla} para ${schoolName}.`, 'success');
      auditar(
        'Panel de Control', 
        tabla === 'salones' ? `Vaciar Salones ${schoolCode.toUpperCase()}` : `Vaciar Colectivos ${schoolCode.toUpperCase()}`, 
        `Se eliminaron en lote todos los registros de la tabla "${tabla}" para el plantel ${schoolCode.toUpperCase()}`
      );
    } catch (e) {
      console.error(e);
      Swal.fire('Error', `No se pudieron eliminar los registros de ${nombreTabla} para ${schoolName}.`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (isModuleRestricted) {
    return (
      <div className="container py-5 text-center">
        <div className="card shadow-sm border-0 p-5 rounded-4 bg-white">
          <div className="text-danger mb-4">
            <i className="bi bi-shield-slash fs-1"></i>
          </div>
          <h2 className="fw-bold mb-3 text-dark">Acceso Restringido</h2>
          <p className="text-muted">No posees los privilegios necesarios para ver este submódulo.</p>
          <button onClick={() => navigate('/')} className="btn btn-primary rounded-pill px-4 mt-3">
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modulo-animado">
      <div className="row mb-5 animate__animated animate__fadeInDown">
        <div className="col-12">
          <div 
            className="banner-modulo p-4 p-md-5 text-white position-relative overflow-hidden rounded-4" 
            style={{ background: 'linear-gradient(135deg, #FF8D00 0%, rgba(0,0,0,0.6) 150%)' }}
          >
            <div className="burbuja-3d burbuja-1"></div>
            <div className="burbuja-3d burbuja-2"></div>
            <div className="burbuja-3d burbuja-3"></div>
            <div className="row align-items-center position-relative z-1">
              <div className="col-12 text-center text-md-start mb-3 mb-md-0">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <span className="badge bg-white text-primary px-3 py-2 shadow-sm fw-bold">
                    <i className="bi bi-terminal-fill me-1"></i> DIRECCIÓN Y SISTEMA
                  </span>
                  <button 
                    onClick={() => navigate('/categoria/Direcci%C3%B3n%20y%20Sistema')} 
                    className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                  >
                    <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
                  </button>
                </div>
                <h1 className="fw-bolder mb-2 text-white">
                  <i className="bi bi-terminal-fill me-3"></i>Panel de Control
                </h1>
                <p className="mb-0 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Administración técnica global y configuraciones de mantenimiento.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando parámetros...</span>
          </div>
        </div>
      ) : (
        <div className="row g-4 animate__animated animate__fadeIn">
          {/* Card Mantenimiento */}
          <div className="col-lg-6 col-12">
            <div className="card border-0 shadow-sm rounded-4 h-100 p-4 bg-white">
              <div className="d-flex align-items-center mb-3">
                <div className={`p-3 rounded-circle me-3 ${mantenimiento ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success'}`}>
                  <i className={`bi ${mantenimiento ? 'bi-cone-striped' : 'bi-check-circle-fill'} fs-3`}></i>
                </div>
                <div>
                  <h4 className="fw-bold mb-1 text-dark">Modo Mantenimiento</h4>
                  <span className={`badge rounded-pill px-3 py-1.5 fw-bold ${mantenimiento ? 'bg-danger text-white' : 'bg-success text-white'}`}>
                    {mantenimiento ? 'ACTIVADO' : 'SISTEMA OPERATIVO'}
                  </span>
                </div>
              </div>

              <hr className="my-3 text-muted opacity-25" />

              <p className="text-muted small mb-4">
                Al activar el modo mantenimiento, solo los usuarios autorizados (administradores o roles que posean el privilegio específico <strong>"Ingresar en Mantenimiento"</strong>) podrán acceder al sistema SIGAE. El resto de los usuarios activos serán desconectados automáticamente y no se permitirá nuevos inicios de sesión.
              </p>

              <div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-light border">
                <div>
                  <h6 className="fw-bold mb-0 text-dark">Estado del Mantenimiento</h6>
                  <small className="text-muted">Desliza para cambiar el estado</small>
                </div>
                <div className="form-check form-switch fs-4">
                  <input
                    className="form-check-input hover-mano"
                    type="checkbox"
                    role="switch"
                    id="switchMantenimiento"
                    checked={mantenimiento}
                    disabled={saving || !canModify}
                    onChange={(e) => handleToggleMantenimiento(e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card Bloquear Invitados */}
          <div className="col-lg-6 col-12">
            <div className="card border-0 shadow-sm rounded-4 h-100 p-4 bg-white">
              <div className="d-flex align-items-center mb-3">
                <div className={`p-3 rounded-circle me-3 ${bloquearInvitados ? 'bg-warning bg-opacity-10 text-warning' : 'bg-success bg-opacity-10 text-success'}`}>
                  <i className={`bi ${bloquearInvitados ? 'bi-person-x-fill' : 'bi-person-check-fill'} fs-3`}></i>
                </div>
                <div>
                  <h4 className="fw-bold mb-1 text-dark">Control de Visitantes</h4>
                  <span className={`badge rounded-pill px-3 py-1.5 fw-bold ${bloquearInvitados ? 'bg-warning text-dark' : 'bg-success text-white'}`}>
                    {bloquearInvitados ? 'REGISTRO BLOQUEADO' : 'INGRESO PERMITIDO'}
                  </span>
                </div>
              </div>

              <hr className="my-3 text-muted opacity-25" />

              <p className="text-muted small mb-4">
                Permite deshabilitar temporalmente el módulo de registro e ingreso de <strong>Invitados/Visitantes</strong> en la pantalla de inicio de sesión de la aplicación. Es útil para restringir el acceso a personas ajenas a la institución durante jornadas especiales o auditorías.
              </p>

              <div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-light border">
                <div>
                  <h6 className="fw-bold mb-0 text-dark">Bloquear Visitantes</h6>
                  <small className="text-muted">Desliza para activar el bloqueo</small>
                </div>
                <div className="form-check form-switch fs-4">
                  <input
                    className="form-check-input hover-mano"
                    type="checkbox"
                    role="switch"
                    id="switchBloquearInvitados"
                    checked={bloquearInvitados}
                    disabled={saving || !canModify}
                    onChange={(e) => handleToggleInvitados(e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card Acciones Destructivas (Vaciar Tablas) */}
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-danger border-4">
              <h5 className="fw-bold text-danger mb-1"><i className="bi bi-exclamation-triangle-fill me-2"></i>Mantenimiento de Registros (Acciones Críticas)</h5>
              <p className="text-muted small mb-4">Estas acciones eliminarán de forma definitiva los datos indicados pertenecientes a la institución seleccionada.</p>
              
              <div className="row g-3">
                <div className="col-md-6 col-12">
                  <div className="p-3 rounded bg-light border d-flex flex-column h-100 justify-content-between">
                    <div>
                      <h6 className="fw-bold mb-1 text-dark"><i className="bi bi-grid-3x3-gap-fill text-danger me-2"></i>Vaciar Salones / Aulas</h6>
                      <p className="text-muted small mb-3">Elimina todas las aulas y salones abiertos configurados en el plantel correspondiente.</p>
                    </div>
                    <div className="d-flex flex-column gap-2">
                      <button 
                        onClick={() => vaciarTabla('salones', 'sb')} 
                        disabled={saving || !canDelete} 
                        className="btn btn-outline-danger btn-sm fw-bold w-100 rounded-pill text-start px-3"
                      >
                        <i className="bi bi-trash3-fill me-2"></i> Vaciar U.E. Santa Bárbara (SB)
                      </button>
                      <button 
                        onClick={() => vaciarTabla('salones', 'lb')} 
                        disabled={saving || !canDelete} 
                        className="btn btn-outline-danger btn-sm fw-bold w-100 rounded-pill text-start px-3"
                      >
                        <i className="bi bi-trash3-fill me-2"></i> Vaciar U.E. Libertador Bolívar (LB)
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6 col-12">
                  <div className="p-3 rounded bg-light border d-flex flex-column h-100 justify-content-between">
                    <div>
                      <h6 className="fw-bold mb-1 text-dark"><i className="bi bi-people-fill text-danger me-2"></i>Vaciar Colectivos</h6>
                      <p className="text-muted small mb-3">Elimina todos los colectivos registrados (incluyendo integrantes y planificaciones) en el plantel correspondiente.</p>
                    </div>
                    <div className="d-flex flex-column gap-2">
                      <button 
                        onClick={() => vaciarTabla('colectivos', 'sb')} 
                        disabled={saving || !canDelete} 
                        className="btn btn-outline-danger btn-sm fw-bold w-100 rounded-pill text-start px-3"
                      >
                        <i className="bi bi-trash3-fill me-2"></i> Vaciar U.E. Santa Bárbara (SB)
                      </button>
                      <button 
                        onClick={() => vaciarTabla('colectivos', 'lb')} 
                        disabled={saving || !canDelete} 
                        className="btn btn-outline-danger btn-sm fw-bold w-100 rounded-pill text-start px-3"
                      >
                        <i className="bi bi-trash3-fill me-2"></i> Vaciar U.E. Libertador Bolívar (LB)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información Adicional del Servidor / Base de datos */}
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <h5 className="fw-bold mb-3 text-dark"><i className="bi bi-info-circle-fill text-primary me-2"></i>Información del Sistema</h5>
              <div className="row">
                <div className="col-md-3 col-6 mb-3 mb-md-0">
                  <span className="text-muted fw-semibold d-block">Estado de Base de Datos:</span>
                  <span className="text-success fw-bold"><i className="bi bi-cloud-check-fill me-1"></i> Conectado (Supabase)</span>
                </div>
                <div className="col-md-3 col-6 mb-3 mb-md-0">
                  <span className="text-muted fw-semibold d-block">Zona Horaria:</span>
                  <span className="text-dark fw-bold">America/Caracas (VET)</span>
                </div>
                <div className="col-md-3 col-6">
                  <span className="text-muted fw-semibold d-block">Versión de SIGAE:</span>
                  <span className="badge bg-secondary rounded-pill px-2">v1.0.0-desarrollo</span>
                </div>
                <div className="col-md-3 col-6">
                  <span className="text-muted fw-semibold d-block">Servidor Local:</span>
                  <span className="text-muted small">Vite / Node.js</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
