import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';

export const PanelControl = () => {
  const navigate = useNavigate();
  const { tienePermiso, loading: permLoading } = usePermisos();
  const Swal = (window as any).Swal;

  const [mantenimientoSB, setMantenimientoSB] = useState<boolean>(false);
  const [mantenimientoLB, setMantenimientoLB] = useState<boolean>(false);
  const [bloquearInvitadosSB, setBloquearInvitadosSB] = useState<boolean>(false);
  const [bloquearInvitadosLB, setBloquearInvitadosLB] = useState<boolean>(false);
  const [fechaInicioCupos, setFechaInicioCupos] = useState<string>('');
  const [fechaFinCupos, setFechaFinCupos] = useState<string>('');
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
        const maintGlobal = data.find(x => x.clave === 'mantenimiento_activo');
        const maintSB = data.find(x => x.clave === 'mantenimiento_sb');
        const maintLB = data.find(x => x.clave === 'mantenimiento_lb');

        const isSbActive = maintSB ? (maintSB.valor === 'true') : (maintGlobal?.valor === 'true');
        const isLbActive = maintLB ? (maintLB.valor === 'true') : (maintGlobal?.valor === 'true');

        setMantenimientoSB(isSbActive);
        setMantenimientoLB(isLbActive);

        const guestsGlobal = data.find(x => x.clave === 'bloquear_invitados');
        const guestsSB = data.find(x => x.clave === 'bloquear_invitados_sb');
        const guestsLB = data.find(x => x.clave === 'bloquear_invitados_lb');

        const isGuestSbBlocked = guestsSB ? (guestsSB.valor === 'true') : (guestsGlobal?.valor === 'true');
        const isGuestLbBlocked = guestsLB ? (guestsLB.valor === 'true') : (guestsGlobal?.valor === 'true');

        setBloquearInvitadosSB(isGuestSbBlocked);
        setBloquearInvitadosLB(isGuestLbBlocked);

        const inicioCupo = data.find(x => x.clave === 'fecha_inicio_cupos');
        if (inicioCupo) setFechaInicioCupos(inicioCupo.valor || '');

        const finCupo = data.find(x => x.clave === 'fecha_fin_cupos');
        if (finCupo) setFechaFinCupos(finCupo.valor || '');
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

  const handleToggleSchoolMantenimiento = async (escuela: 'sb' | 'lb', newValue: boolean) => {
    if (!canModify) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permisos para modificar los ajustes del sistema.', 'error');
      return;
    }

    if (!Swal) return;

    const escuelaNombre = escuela === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar';
    const actionText = newValue ? 'activar' : 'desactivar';

    const confirmResult = await Swal.fire({
      title: `¿Confirmar acción para ${escuelaNombre}?`,
      text: `¿Estás seguro de que deseas ${actionText} el Modo Mantenimiento para ${escuelaNombre}? ${newValue ? 'Los usuarios no autorizados de esta institución serán desconectados inmediatamente.' : 'Los accesos volverán a la normalidad para esta institución.'}`,
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
      const clave = escuela === 'sb' ? 'mantenimiento_sb' : 'mantenimiento_lb';
      const otherVal = escuela === 'sb' ? mantenimientoLB : mantenimientoSB;
      const globalVal = newValue || otherVal;

      const { error } = await supabase
        .from('ajustes_globales')
        .upsert([
          { clave, valor: String(newValue), actualizado_en: new Date().toISOString() },
          { clave: 'mantenimiento_activo', valor: String(globalVal), actualizado_en: new Date().toISOString() }
        ], { onConflict: 'clave' });

      if (error) throw error;

      if (escuela === 'sb') {
        setMantenimientoSB(newValue);
      } else {
        setMantenimientoLB(newValue);
      }

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Mantenimiento en ${escuelaNombre}: ${newValue ? 'ACTIVADO' : 'DESACTIVADO'}`,
        showConfirmButton: false,
        timer: 2500
      });

      auditar(
        'Panel de Control', 
        newValue ? 'Activar Mantenimiento' : 'Desactivar Mantenimiento', 
        `Se cambió el estado del mantenimiento en ${escuelaNombre} a: ${newValue ? 'ACTIVO' : 'INACTIVO'}`
      );
      
      window.dispatchEvent(new Event('sigae-maintenance-changed'));
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudo guardar la configuración.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBothMantenimiento = async (newValue: boolean) => {
    if (!canModify) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permisos para modificar los ajustes del sistema.', 'error');
      return;
    }

    if (!Swal) return;

    const actionText = newValue ? 'activar' : 'desactivar';
    const confirmResult = await Swal.fire({
      title: `¿${newValue ? 'Activar' : 'Desactivar'} Mantenimiento en AMBAS Escuelas?`,
      text: `¿Estás seguro de que deseas ${actionText} el Modo Mantenimiento para la U.E. Santa Bárbara y la U.E. Libertador Bolívar simultáneamente? ${newValue ? 'Los usuarios no autorizados de ambas instituciones serán desconectados inmediatamente.' : 'Los accesos volverán a la normalidad en ambas instituciones.'}`,
      icon: newValue ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${actionText} en ambas`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: newValue ? '#d33' : '#3085d6',
      cancelButtonColor: '#6c757d'
    });

    if (!confirmResult.isConfirmed) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('ajustes_globales')
        .upsert([
          { clave: 'mantenimiento_sb', valor: String(newValue), actualizado_en: new Date().toISOString() },
          { clave: 'mantenimiento_lb', valor: String(newValue), actualizado_en: new Date().toISOString() },
          { clave: 'mantenimiento_activo', valor: String(newValue), actualizado_en: new Date().toISOString() }
        ], { onConflict: 'clave' });

      if (error) throw error;

      setMantenimientoSB(newValue);
      setMantenimientoLB(newValue);

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Mantenimiento en ambas escuelas: ${newValue ? 'ACTIVADO' : 'DESACTIVADO'}`,
        showConfirmButton: false,
        timer: 2500
      });

      auditar(
        'Panel de Control', 
        newValue ? 'Activar Mantenimiento Global' : 'Desactivar Mantenimiento Global', 
        `Se cambió el estado del mantenimiento en AMBAS escuelas a: ${newValue ? 'ACTIVO' : 'INACTIVO'}`
      );
      
      window.dispatchEvent(new Event('sigae-maintenance-changed'));
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudo guardar la configuración.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSchoolInvitados = async (escuela: 'sb' | 'lb', newValue: boolean) => {
    if (!canModify) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permisos para modificar los ajustes del sistema.', 'error');
      return;
    }

    if (!Swal) return;

    const escuelaNombre = escuela === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar';
    const actionText = newValue ? 'bloquear' : 'desbloquear';

    const confirmResult = await Swal.fire({
      title: `¿Confirmar acción para ${escuelaNombre}?`,
      text: `¿Estás seguro de que deseas ${actionText} el registro e ingreso de invitados y visitantes en ${escuelaNombre}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${actionText}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: newValue ? '#e67e22' : '#3085d6',
      cancelButtonColor: '#6c757d'
    });

    if (!confirmResult.isConfirmed) return;

    setSaving(true);
    try {
      const clave = escuela === 'sb' ? 'bloquear_invitados_sb' : 'bloquear_invitados_lb';
      const otherVal = escuela === 'sb' ? bloquearInvitadosLB : bloquearInvitadosSB;
      const globalVal = newValue || otherVal;

      const { error } = await supabase
        .from('ajustes_globales')
        .upsert([
          { clave, valor: String(newValue), actualizado_en: new Date().toISOString() },
          { clave: 'bloquear_invitados', valor: String(globalVal), actualizado_en: new Date().toISOString() }
        ], { onConflict: 'clave' });

      if (error) throw error;

      if (escuela === 'sb') {
        setBloquearInvitadosSB(newValue);
      } else {
        setBloquearInvitadosLB(newValue);
      }

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Visitantes en ${escuelaNombre}: ${newValue ? 'BLOQUEADOS' : 'PERMITIDOS'}`,
        showConfirmButton: false,
        timer: 2500
      });

      auditar(
        'Panel de Control', 
        newValue ? 'Bloquear Invitados' : 'Desbloquear Invitados', 
        `Se cambió el estado del acceso a visitantes en ${escuelaNombre} a: ${newValue ? 'BLOQUEADO' : 'PERMITIDO'}`
      );
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudo guardar la configuración.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBothInvitados = async (newValue: boolean) => {
    if (!canModify) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permisos para modificar los ajustes del sistema.', 'error');
      return;
    }

    if (!Swal) return;

    const actionText = newValue ? 'bloquear' : 'desbloquear';
    const confirmResult = await Swal.fire({
      title: `¿${newValue ? 'Bloquear' : 'Permitir'} Visitantes en AMBAS Escuelas?`,
      text: `¿Estás seguro de que deseas ${actionText} el registro e ingreso de visitantes en la U.E. Santa Bárbara y U.E. Libertador Bolívar simultáneamente?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${actionText} en ambas`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: newValue ? '#e67e22' : '#3085d6',
      cancelButtonColor: '#6c757d'
    });

    if (!confirmResult.isConfirmed) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('ajustes_globales')
        .upsert([
          { clave: 'bloquear_invitados_sb', valor: String(newValue), actualizado_en: new Date().toISOString() },
          { clave: 'bloquear_invitados_lb', valor: String(newValue), actualizado_en: new Date().toISOString() },
          { clave: 'bloquear_invitados', valor: String(newValue), actualizado_en: new Date().toISOString() }
        ], { onConflict: 'clave' });

      if (error) throw error;

      setBloquearInvitadosSB(newValue);
      setBloquearInvitadosLB(newValue);

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Visitantes en ambas escuelas: ${newValue ? 'BLOQUEADOS' : 'PERMITIDOS'}`,
        showConfirmButton: false,
        timer: 2500
      });

      auditar(
        'Panel de Control', 
        newValue ? 'Bloquear Invitados Global' : 'Desbloquear Invitados Global', 
        `Se cambió el estado del acceso a visitantes en AMBAS escuelas a: ${newValue ? 'BLOQUEADO' : 'PERMITIDO'}`
      );
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudo guardar la configuración.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleParametrizarCupos = async () => {
    if (!canModify) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permisos para modificar los ajustes del sistema.', 'error');
      return;
    }

    if (!Swal) return;

    const valInicio = fechaInicioCupos 
      ? (fechaInicioCupos.includes('T') ? fechaInicioCupos.slice(0, 16) : `${fechaInicioCupos}T00:00`)
      : '';
    const valFin = fechaFinCupos 
      ? (fechaFinCupos.includes('T') ? fechaFinCupos.slice(0, 16) : `${fechaFinCupos}T23:59`)
      : '';

    const { value: formValues } = await Swal.fire({
      title: '<i class="bi bi-calendar-range text-primary"></i> Período de Solicitud de Cupos',
      html: `
        <div class="text-start mb-3">
          <label class="form-label small fw-bold text-muted"><i class="bi bi-calendar-check text-primary me-1"></i>Fecha y Hora de Inicio del Proceso:</label>
          <input id="swal-input-inicio" type="datetime-local" class="form-control rounded-3 py-2" value="${valInicio}" />
        </div>
        <div class="text-start mb-2">
          <label class="form-label small fw-bold text-muted"><i class="bi bi-calendar-x text-danger me-1"></i>Fecha y Hora de Fin (Cierre) del Proceso:</label>
          <input id="swal-input-fin" type="datetime-local" class="form-control rounded-3 py-2" value="${valFin}" />
        </div>
        <div class="alert alert-info small mt-3 mb-0 text-start">
          <i class="bi bi-info-circle me-1"></i> Al especificar la hora, el sistema habilitará o cerrará las solicitudes exactamente en el minuto configurado. Si dejas los campos vacíos, el proceso permanecerá abierto indefinidamente.
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-check2-circle me-1"></i> Guardar Fechas y Hora',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0d6efd',
      cancelButtonColor: '#6c757d',
      preConfirm: () => {
        const inicio = (document.getElementById('swal-input-inicio') as HTMLInputElement).value;
        const fin = (document.getElementById('swal-input-fin') as HTMLInputElement).value;
        if (inicio && fin && new Date(inicio).getTime() > new Date(fin).getTime()) {
          Swal.showValidationMessage('La fecha y hora de inicio no puede ser posterior al cierre');
          return false;
        }
        return { inicio, fin };
      }
    });

    if (formValues !== undefined) {
      setSaving(true);
      try {
        const nowIso = new Date().toISOString();
        const payload = [
          { clave: 'fecha_inicio_cupos', valor: formValues.inicio, descripcion: 'Fecha de inicio del proceso de solicitud de cupos', actualizado_en: nowIso },
          { clave: 'fecha_fin_cupos', valor: formValues.fin, descripcion: 'Fecha de fin del proceso de solicitud de cupos', actualizado_en: nowIso }
        ];

        const { error } = await supabase
          .from('ajustes_globales')
          .upsert(payload, { onConflict: 'clave' });

        if (error) throw error;

        setFechaInicioCupos(formValues.inicio);
        setFechaFinCupos(formValues.fin);

        await auditar('Panel de Control', 'Parametrizar Cupos', `Estableció período de cupos del ${formValues.inicio || 'N/A'} al ${formValues.fin || 'N/A'}`);

        Swal.fire({
          icon: 'success',
          title: '¡Período Parametrizado!',
          text: formValues.inicio && formValues.fin 
            ? `El proceso de solicitud de cupos estará abierto desde el ${new Date(formValues.inicio + 'T00:00:00').toLocaleDateString('es-VE')} hasta el ${new Date(formValues.fin + 'T23:59:59').toLocaleDateString('es-VE')}.`
            : 'Se han eliminado/restablecido las fechas del proceso de cupos.',
          confirmButtonColor: '#198754'
        });
      } catch (err: any) {
        console.error('Error al guardar fechas de cupos:', err);
        Swal.fire('Error', 'No se pudieron guardar las fechas de parametrización: ' + (err.message || 'Error de conexión'), 'error');
      } finally {
        setSaving(false);
      }
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
                <div className={`p-3 rounded-circle me-3 ${(mantenimientoSB || mantenimientoLB) ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success'}`}>
                  <i className={`bi ${(mantenimientoSB || mantenimientoLB) ? 'bi-cone-striped' : 'bi-check-circle-fill'} fs-3`}></i>
                </div>
                <div>
                  <h4 className="fw-bold mb-1 text-dark">Modo Mantenimiento</h4>
                  <div className="d-flex flex-wrap gap-2 mt-1">
                    <span className={`badge rounded-pill px-2.5 py-1 fw-bold ${mantenimientoSB ? 'bg-danger text-white' : 'bg-success text-white'}`} style={{ fontSize: '0.75rem' }}>
                      <i className="bi bi-building me-1"></i> Santa Bárbara: {mantenimientoSB ? 'MANTENIMIENTO' : 'OPERATIVO'}
                    </span>
                    <span className={`badge rounded-pill px-2.5 py-1 fw-bold ${mantenimientoLB ? 'bg-danger text-white' : 'bg-success text-white'}`} style={{ fontSize: '0.75rem' }}>
                      <i className="bi bi-building me-1"></i> Libertador Bolívar: {mantenimientoLB ? 'MANTENIMIENTO' : 'OPERATIVO'}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="my-3 text-muted opacity-25" />

              <p className="text-muted small mb-3">
                Permite suspender el acceso de usuarios por escuela de forma individual o simultánea. Los usuarios sin el privilegio especial <strong>"Ingresar en Mantenimiento"</strong> en la institución afectada serán desconectados inmediatamente y no podrán iniciar sesión.
              </p>

              {/* Controles por Escuela */}
              <div className="d-flex flex-column gap-2 mb-3">
                {/* U.E. Santa Bárbara */}
                <div className={`d-flex align-items-center justify-content-between p-3 rounded-3 border transition-all ${mantenimientoSB ? 'bg-danger bg-opacity-10 border-danger' : 'bg-light border'}`}>
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-primary px-2 py-0.5" style={{ fontSize: '0.7rem' }}>SB</span>
                      <h6 className="fw-bold mb-0 text-dark">U.E. Santa Bárbara</h6>
                    </div>
                    <small className={mantenimientoSB ? 'text-danger fw-bold' : 'text-success fw-bold'}>
                      {mantenimientoSB ? '● En Mantenimiento (Acceso Restringido)' : '● Sistema Operativo'}
                    </small>
                  </div>
                  <div className="form-check form-switch fs-4 mb-0">
                    <input
                      className="form-check-input hover-mano"
                      type="checkbox"
                      role="switch"
                      id="switchMantenimientoSB"
                      checked={mantenimientoSB}
                      disabled={saving || !canModify}
                      onChange={(e) => handleToggleSchoolMantenimiento('sb', e.target.checked)}
                    />
                  </div>
                </div>

                {/* U.E. Libertador Bolívar */}
                <div className={`d-flex align-items-center justify-content-between p-3 rounded-3 border transition-all ${mantenimientoLB ? 'bg-danger bg-opacity-10 border-danger' : 'bg-light border'}`}>
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-secondary px-2 py-0.5" style={{ fontSize: '0.7rem' }}>LB</span>
                      <h6 className="fw-bold mb-0 text-dark">U.E. Libertador Bolívar</h6>
                    </div>
                    <small className={mantenimientoLB ? 'text-danger fw-bold' : 'text-success fw-bold'}>
                      {mantenimientoLB ? '● En Mantenimiento (Acceso Restringido)' : '● Sistema Operativo'}
                    </small>
                  </div>
                  <div className="form-check form-switch fs-4 mb-0">
                    <input
                      className="form-check-input hover-mano"
                      type="checkbox"
                      role="switch"
                      id="switchMantenimientoLB"
                      checked={mantenimientoLB}
                      disabled={saving || !canModify}
                      onChange={(e) => handleToggleSchoolMantenimiento('lb', e.target.checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Botones de acción para ambas escuelas */}
              <div className="d-flex gap-2 pt-1">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger w-50 rounded-pill fw-bold py-2"
                  disabled={saving || !canModify || (mantenimientoSB && mantenimientoLB)}
                  onClick={() => handleToggleBothMantenimiento(true)}
                  title="Poner ambas escuelas en mantenimiento a la vez"
                >
                  <i className="bi bi-cone-striped me-1"></i> Poner Ambas en Mantenimiento
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success w-50 rounded-pill fw-bold py-2"
                  disabled={saving || !canModify || (!mantenimientoSB && !mantenimientoLB)}
                  onClick={() => handleToggleBothMantenimiento(false)}
                  title="Restablecer ambas escuelas a sistema operativo"
                >
                  <i className="bi bi-check-circle me-1"></i> Restablecer Ambas
                </button>
              </div>
            </div>
          </div>

          {/* Card Bloquear Invitados */}
          <div className="col-lg-6 col-12">
            <div className="card border-0 shadow-sm rounded-4 h-100 p-4 bg-white">
              <div className="d-flex align-items-center mb-3">
                <div className={`p-3 rounded-circle me-3 ${(bloquearInvitadosSB || bloquearInvitadosLB) ? 'bg-warning bg-opacity-10 text-warning' : 'bg-success bg-opacity-10 text-success'}`}>
                  <i className={`bi ${(bloquearInvitadosSB || bloquearInvitadosLB) ? 'bi-person-x-fill' : 'bi-person-check-fill'} fs-3`}></i>
                </div>
                <div>
                  <h4 className="fw-bold mb-1 text-dark">Control de Visitantes</h4>
                  <div className="d-flex flex-wrap gap-2 mt-1">
                    <span className={`badge rounded-pill px-2.5 py-1 fw-bold ${bloquearInvitadosSB ? 'bg-warning text-dark' : 'bg-success text-white'}`} style={{ fontSize: '0.75rem' }}>
                      <i className="bi bi-building me-1"></i> Santa Bárbara: {bloquearInvitadosSB ? 'BLOQUEADO' : 'PERMITIDO'}
                    </span>
                    <span className={`badge rounded-pill px-2.5 py-1 fw-bold ${bloquearInvitadosLB ? 'bg-warning text-dark' : 'bg-success text-white'}`} style={{ fontSize: '0.75rem' }}>
                      <i className="bi bi-building me-1"></i> Libertador Bolívar: {bloquearInvitadosLB ? 'BLOQUEADO' : 'PERMITIDO'}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="my-3 text-muted opacity-25" />

              <p className="text-muted small mb-3">
                Permite deshabilitar temporalmente el módulo de registro e ingreso de <strong>Invitados/Visitantes</strong> por institución o globalmente en la pantalla de inicio de sesión durante jornadas especiales o auditorías.
              </p>

              {/* Controles por Escuela */}
              <div className="d-flex flex-column gap-2 mb-3">
                {/* U.E. Santa Bárbara */}
                <div className={`d-flex align-items-center justify-content-between p-3 rounded-3 border transition-all ${bloquearInvitadosSB ? 'bg-warning bg-opacity-10 border-warning' : 'bg-light border'}`}>
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-primary px-2 py-0.5" style={{ fontSize: '0.7rem' }}>SB</span>
                      <h6 className="fw-bold mb-0 text-dark">U.E. Santa Bárbara</h6>
                    </div>
                    <small className={bloquearInvitadosSB ? 'text-warning fw-bold' : 'text-success fw-bold'}>
                      {bloquearInvitadosSB ? '● Registro e Ingreso Bloqueado' : '● Ingreso de Visitantes Permitido'}
                    </small>
                  </div>
                  <div className="form-check form-switch fs-4 mb-0">
                    <input
                      className="form-check-input hover-mano"
                      type="checkbox"
                      role="switch"
                      id="switchBloquearInvitadosSB"
                      checked={bloquearInvitadosSB}
                      disabled={saving || !canModify}
                      onChange={(e) => handleToggleSchoolInvitados('sb', e.target.checked)}
                    />
                  </div>
                </div>

                {/* U.E. Libertador Bolívar */}
                <div className={`d-flex align-items-center justify-content-between p-3 rounded-3 border transition-all ${bloquearInvitadosLB ? 'bg-warning bg-opacity-10 border-warning' : 'bg-light border'}`}>
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-secondary px-2 py-0.5" style={{ fontSize: '0.7rem' }}>LB</span>
                      <h6 className="fw-bold mb-0 text-dark">U.E. Libertador Bolívar</h6>
                    </div>
                    <small className={bloquearInvitadosLB ? 'text-warning fw-bold' : 'text-success fw-bold'}>
                      {bloquearInvitadosLB ? '● Registro e Ingreso Bloqueado' : '● Ingreso de Visitantes Permitido'}
                    </small>
                  </div>
                  <div className="form-check form-switch fs-4 mb-0">
                    <input
                      className="form-check-input hover-mano"
                      type="checkbox"
                      role="switch"
                      id="switchBloquearInvitadosLB"
                      checked={bloquearInvitadosLB}
                      disabled={saving || !canModify}
                      onChange={(e) => handleToggleSchoolInvitados('lb', e.target.checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Botones de acción para ambas escuelas */}
              <div className="d-flex gap-2 pt-1">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-warning w-50 rounded-pill fw-bold py-2 text-dark"
                  disabled={saving || !canModify || (bloquearInvitadosSB && bloquearInvitadosLB)}
                  onClick={() => handleToggleBothInvitados(true)}
                  title="Bloquear visitantes en ambas escuelas a la vez"
                >
                  <i className="bi bi-person-x-fill me-1"></i> Bloquear en Ambas
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success w-50 rounded-pill fw-bold py-2"
                  disabled={saving || !canModify || (!bloquearInvitadosSB && !bloquearInvitadosLB)}
                  onClick={() => handleToggleBothInvitados(false)}
                  title="Permitir visitantes en ambas escuelas"
                >
                  <i className="bi bi-person-check-fill me-1"></i> Permitir en Ambas
                </button>
              </div>
            </div>
          </div>

          {/* Card Parametrización Fechas Solicitud de Cupos */}
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-start border-primary border-4">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
                <div className="d-flex align-items-center">
                  <div className="p-3 rounded-circle me-3 bg-primary bg-opacity-10 text-primary">
                    <i className="bi bi-calendar-range-fill fs-3"></i>
                  </div>
                  <div>
                    <h4 className="fw-bold mb-1 text-dark">Parametrización de Solicitud de Cupos</h4>
                    <span className="badge rounded-pill bg-primary px-3 py-1 fw-bold">
                      <i className="bi bi-clock-history me-1"></i> CONTROL DE FECHAS
                    </span>
                  </div>
                </div>
                <div>
                  <button
                    onClick={handleParametrizarCupos}
                    disabled={saving || !canModify}
                    className="btn btn-primary rounded-pill px-4 py-2.5 fw-bold shadow-sm hover-efecto d-flex align-items-center gap-2"
                  >
                    <i className="bi bi-calendar-check fs-5"></i>
                    <span>Parametrizar Fechas del Proceso</span>
                  </button>
                </div>
              </div>

              <hr className="my-3 text-muted opacity-25" />

              <p className="text-muted small mb-4">
                Establece el rango exacto (fecha de inicio y fecha de cierre) durante el cual el proceso y formulario para <strong>Nueva Solicitud de Cupo</strong> estará disponible y habilitado para la comunidad escolar. Fuera de este intervalo de fechas, el sistema restringirá el ingreso de nuevas solicitudes automáticamente.
              </p>

              <div className="row g-3">
                <div className="col-md-6 col-12">
                  <div className="p-3 rounded-3 bg-light border d-flex align-items-center justify-content-between">
                    <div>
                      <span className="small text-muted fw-bold d-block text-uppercase">Fecha y Hora de Inicio</span>
                      <span className="fs-6 fw-bold text-dark">
                        {fechaInicioCupos ? new Date(fechaInicioCupos.includes('T') ? fechaInicioCupos : fechaInicioCupos + 'T00:00:00').toLocaleString('es-VE', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'No definida (Abierto por defecto)'}
                      </span>
                    </div>
                    <i className="bi bi-calendar-plus text-primary fs-3 opacity-75"></i>
                  </div>
                </div>
                <div className="col-md-6 col-12">
                  <div className="p-3 rounded-3 bg-light border d-flex align-items-center justify-content-between">
                    <div>
                      <span className="small text-muted fw-bold d-block text-uppercase">Fecha y Hora de Cierre</span>
                      <span className="fs-6 fw-bold text-dark">
                        {fechaFinCupos ? new Date(fechaFinCupos.includes('T') ? fechaFinCupos : fechaFinCupos + 'T23:59:59').toLocaleString('es-VE', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'No definida (Sin fecha tope)'}
                      </span>
                    </div>
                    <i className="bi bi-calendar-x text-danger fs-3 opacity-75"></i>
                  </div>
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
                        <i className="bi bi-trash3-fill me-2"></i> Vaciar UE Santa Bárbara (SB)
                      </button>
                      <button 
                        onClick={() => vaciarTabla('salones', 'lb')} 
                        disabled={saving || !canDelete} 
                        className="btn btn-outline-danger btn-sm fw-bold w-100 rounded-pill text-start px-3"
                      >
                        <i className="bi bi-trash3-fill me-2"></i> Vaciar UE Libertador Bolívar (LB)
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
                        <i className="bi bi-trash3-fill me-2"></i> Vaciar UE Santa Bárbara (SB)
                      </button>
                      <button 
                        onClick={() => vaciarTabla('colectivos', 'lb')} 
                        disabled={saving || !canDelete} 
                        className="btn btn-outline-danger btn-sm fw-bold w-100 rounded-pill text-start px-3"
                      >
                        <i className="bi bi-trash3-fill me-2"></i> Vaciar UE Libertador Bolívar (LB)
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
