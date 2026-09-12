import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';
import { 
  ChamiloBreadcrumb, 
  ChamiloHelpCallout, 
  IconoPanelControl,
  IconoTemporadaInscripcion,
  IconoTemporadaClases,
  IconoDocumentoDigital,
  IconoModoMantenimiento,
  IconoVentanaCupos
} from '../../components/chamilo';
import { 
  CONFIGURACION_DEFAULT,
  cargarConfiguracionDocumentosBD,
  guardarConfiguracionDocumentosBD,
  aplicarPresetTemporada
} from '../../utils/gestorDocumentosActivos';
import type { 
  ConfiguracionDocumentosYDIsenos, 
  ModoTemporadaEscolar 
} from '../../utils/gestorDocumentosActivos';

export const PanelControl = () => {
  const navigate = useNavigate();
  const { tienePermiso, user, loading: permLoading } = usePermisos();
  const Swal = (window as any).Swal;

  // Escuela Activa para alternar controles de documentos
  const [escuelaFiltro, setEscuelaFiltro] = useState<'sb' | 'lb'>(() => (localStorage.getItem('sigae_escuela_codigo') === 'lb' ? 'lb' : 'sb'));
  const [escuelaCodigo, setEscuelaCodigo] = useState<string>(() => localStorage.getItem('sigae_escuela_codigo') || 'sb');

  const cambiarEscuelaActiva = (nuevaEscuela: 'sb' | 'lb') => {
    if (nuevaEscuela === escuelaCodigo) return;
    setEscuelaCodigo(nuevaEscuela);
    localStorage.setItem('sigae_escuela_codigo', nuevaEscuela);
    localStorage.setItem('sigae_escuela_activa', nuevaEscuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
    try {
      const u = JSON.parse(localStorage.getItem('usuario_sigae') || '{}');
      u.id_escuela = nuevaEscuela;
      u.nombre_escuela = nuevaEscuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
      localStorage.setItem('usuario_sigae', JSON.stringify(u));
    } catch {
      // ignorar
    }
    window.location.reload();
  };

  // Estados de Operatividad General
  const [mantenimientoSB, setMantenimientoSB] = useState<boolean>(false);
  const [mantenimientoLB, setMantenimientoLB] = useState<boolean>(false);
  const [fechaInicioCupos, setFechaInicioCupos] = useState<string>('');
  const [fechaFinCupos, setFechaFinCupos] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados de la Botonera de Control Maestro
  const [configDocs, setConfigDocs] = useState<ConfiguracionDocumentosYDIsenos>(CONFIGURACION_DEFAULT);
  const [tabBotonera, setTabBotonera] = useState<'temporadas' | 'documentos' | 'mantenimiento'>('temporadas');

  const isSuperAdminOrAdmin = ['superadmin', 'administrador', 'administradora', 'director', 'directora'].includes((user?.rol || '').trim().toLowerCase());
  const isModuleRestricted = !permLoading && !isSuperAdminOrAdmin && !tienePermiso('Panel de Control', 'ver');
  const canModify = isSuperAdminOrAdmin || tienePermiso('Panel de Control', 'modificar') || tienePermiso('Panel de Control', 'crear');

  useEffect(() => {
    if (!permLoading && tienePermiso('Panel de Control', 'ver')) {
      cargarTodosLosAjustes();
    }
  }, [permLoading]);

  const cargarTodosLosAjustes = async () => {
    setLoading(true);
    try {
      // 1. Cargar configuración de documentos y diseños
      const docsData = await cargarConfiguracionDocumentosBD();
      setConfigDocs(docsData);

      // 2. Cargar otros ajustes globales
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

  // ─────────────────────────────────────────────────────────────
  // MANEJADORES DE PRESETS DE TEMPORADA
  // ─────────────────────────────────────────────────────────────

  const handleAplicarPresetTemporada = async (modo: ModoTemporadaEscolar) => {
    if (!canModify) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permisos para modificar los ajustes del sistema.', 'error');
      return;
    }

    const nombreModo = modo === 'inscripciones' 
      ? 'Temporada de Inscripciones / Actualización' 
      : (modo === 'clases_regulares' ? 'Año Escolar Regular / Clases' : 'Personalizado');

    const descModo = modo === 'inscripciones'
      ? 'Se activará la <b>Constancia de Inscripción</b>, Carnet Estudiantil y Ficha Resumen para ambas escuelas. La Constancia de Estudio quedará en pausa.'
      : 'Se activará la <b>Constancia de Estudio Regular</b>, Constancia de Buena Conducta y Carnet Estudiantil. La Constancia de Inscripción quedará desactivada.';

    const confirm = await Swal.fire({
      title: `¿Activar ${nombreModo}?`,
      html: `<p class="text-muted small">${descModo}</p><p class="fw-bold mb-0">¿Deseas aplicar este cambio global inmediatamente?</p>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, aplicar configuración',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: modo === 'inscripciones' ? '#16a34a' : '#2563eb'
    });

    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      const nuevaConfig = await aplicarPresetTemporada(modo, 'ambas');
      setConfigDocs(nuevaConfig);

      Swal.fire({
        icon: 'success',
        title: '¡Modo Aplicado con Éxito!',
        text: `El sistema ha sido configurado en "${nombreModo}". Los representantes y la administración verán los documentos correspondientes.`,
        confirmButtonColor: '#16a34a'
      });

      auditar('Panel de Control', 'Preset de Temporada', `Se aplicó el preset de temporada: ${nombreModo}`);
    } catch (err) {
      console.error('Error aplicando preset de temporada:', err);
      Swal.fire('Error', 'No se pudo guardar la configuración de temporada.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAjusteDoc = async (campo: keyof ConfiguracionDocumentosYDIsenos, nuevoValor: boolean, etiqueta: string) => {
    if (!canModify) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permisos para modificar los ajustes del sistema.', 'error');
      return;
    }

    const nuevaConfig: ConfiguracionDocumentosYDIsenos = {
      ...configDocs,
      [campo]: nuevoValor,
      modo_temporada: 'personalizado'
    };

    setSaving(true);
    try {
      await guardarConfiguracionDocumentosBD(nuevaConfig);
      setConfigDocs(nuevaConfig);

      if (Swal) {
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
        Toast.fire({
          icon: nuevoValor ? 'success' : 'info',
          title: `${etiqueta}: ${nuevoValor ? 'ACTIVADO' : 'DESACTIVADO'}`
        });
      }

      auditar('Panel de Control', 'Botonera Documentos', `Modificó ${etiqueta} a: ${nuevoValor ? 'ACTIVO' : 'INACTIVO'}`);
    } catch (err) {
      console.error('Error modificando ajuste de documento:', err);
      Swal.fire('Error', 'No se pudo actualizar el estado.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── LOTE DE DOCUMENTOS POR ESCUELA ──
  const handleToggleAllSchoolDocs = async (escuela: 'sb' | 'lb', activar: boolean) => {
    if (!canModify) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permisos para modificar los ajustes del sistema.', 'error');
      return;
    }

    const schoolName = escuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
    const actionName = activar ? 'Activar todos' : 'Pausar todos';

    const confirm = await Swal.fire({
      title: `¿${actionName} los documentos para ${schoolName}?`,
      text: activar 
        ? `Se habilitará la emisión de los 5 documentos oficiales para ${schoolName}.`
        : `Se pondrán en pausa todos los documentos para ${schoolName}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${actionName.toLowerCase()}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: activar ? '#16a34a' : '#ea580c'
    });

    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      const nuevaConfig: ConfiguracionDocumentosYDIsenos = {
        ...configDocs,
        ...(escuela === 'sb' ? {
          constancia_inscripcion_sb: activar,
          constancia_estudio_sb: activar,
          constancia_conducta_sb: activar,
          carnet_sb: activar,
          resumen_ficha_sb: activar
        } : {
          constancia_inscripcion_lb: activar,
          constancia_estudio_lb: activar,
          constancia_conducta_lb: activar,
          carnet_lb: activar,
          resumen_ficha_lb: activar
        }),
        modo_temporada: 'personalizado'
      };

      await guardarConfiguracionDocumentosBD(nuevaConfig);
      setConfigDocs(nuevaConfig);

      Swal.fire({
        icon: 'success',
        title: '¡Operación Exitosa!',
        text: `Se han ${activar ? 'activado' : 'pausado'} todos los documentos para ${schoolName}.`,
        timer: 2000,
        showConfirmButton: false
      });

      auditar('Panel de Control', 'Lote Documentos', `${actionName} los documentos de ${schoolName}`);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo guardar la configuración en lote.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── COPIAR CONFIGURACIÓN ENTRE ESCUELAS ──
  const handleCopySchoolDocs = async (origen: 'sb' | 'lb', destino: 'sb' | 'lb') => {
    if (!canModify) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permisos para modificar los ajustes del sistema.', 'error');
      return;
    }

    const origenName = origen === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
    const destinoName = destino === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';

    const confirm = await Swal.fire({
      title: `¿Clonar configuración de documentos?`,
      text: `Se copiará el estado exacto de los documentos de ${origenName} hacia ${destinoName}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, clonar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb'
    });

    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      const nuevaConfig: ConfiguracionDocumentosYDIsenos = {
        ...configDocs,
        ...(destino === 'lb' ? {
          constancia_inscripcion_lb: configDocs.constancia_inscripcion_sb,
          constancia_estudio_lb: configDocs.constancia_estudio_sb,
          constancia_conducta_lb: configDocs.constancia_conducta_sb,
          carnet_lb: configDocs.carnet_sb,
          resumen_ficha_lb: configDocs.resumen_ficha_sb
        } : {
          constancia_inscripcion_sb: configDocs.constancia_inscripcion_lb,
          constancia_estudio_sb: configDocs.constancia_estudio_lb,
          constancia_conducta_sb: configDocs.constancia_conducta_lb,
          carnet_sb: configDocs.carnet_lb,
          resumen_ficha_sb: configDocs.resumen_ficha_lb
        }),
        modo_temporada: 'personalizado'
      };

      await guardarConfiguracionDocumentosBD(nuevaConfig);
      setConfigDocs(nuevaConfig);

      Swal.fire({
        icon: 'success',
        title: '¡Configuración Clonada!',
        text: `Los documentos de ${destinoName} ahora coinciden con ${origenName}.`,
        timer: 2000,
        showConfirmButton: false
      });

      auditar('Panel de Control', 'Clonar Documentos', `Clonó configuración de ${origenName} a ${destinoName}`);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo clonar la configuración.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── MÉTRICAS DE TELEMETRÍA CALCULADAS ──
  const docsActivosSB = [
    configDocs.constancia_inscripcion_sb, 
    configDocs.constancia_estudio_sb, 
    configDocs.constancia_conducta_sb, 
    configDocs.carnet_sb, 
    configDocs.resumen_ficha_sb
  ].filter(Boolean).length;

  const docsActivosLB = [
    configDocs.constancia_inscripcion_lb, 
    configDocs.constancia_estudio_lb, 
    configDocs.constancia_conducta_lb, 
    configDocs.carnet_lb, 
    configDocs.resumen_ficha_lb
  ].filter(Boolean).length;

  const estadoCupos = useMemo(() => {
    if (!fechaInicioCupos && !fechaFinCupos) return { texto: 'Permanente', color: 'success', icon: 'bi-infinity', desc: 'Sin límite de fecha' };
    const ahora = new Date();
    const inicio = fechaInicioCupos ? new Date(fechaInicioCupos) : null;
    const fin = fechaFinCupos ? new Date(fechaFinCupos) : null;
    if (inicio && ahora < inicio) return { texto: 'Programado', color: 'warning', icon: 'bi-clock', desc: 'Apertura próxima' };
    if (fin && ahora > fin) return { texto: 'Cerrado', color: 'danger', icon: 'bi-x-circle-fill', desc: 'Plazo culminado' };
    return { texto: 'Abierto Ahora', color: 'success', icon: 'bi-check-circle-fill', desc: 'Recepción activa' };
  }, [fechaInicioCupos, fechaFinCupos]);

  // ─────────────────────────────────────────────────────────────
  // MANEJADORES DE MANTENIMIENTO Y CUPOS
  // ─────────────────────────────────────────────────────────────

  const handleToggleSchoolMantenimiento = async (escuela: 'sb' | 'lb', newValue: boolean) => {
    if (!canModify) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permisos para modificar los ajustes del sistema.', 'error');
      return;
    }

    if (!Swal) return;

    const escuelaNombre = escuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
    const actionText = newValue ? 'activar' : 'desactivar';

    const confirmResult = await Swal.fire({
      title: `¿Confirmar acción para ${escuelaNombre}?`,
      text: `¿Estás seguro de que deseas ${actionText} el Modo Mantenimiento para ${escuelaNombre}? ${newValue ? 'Los usuarios no autorizados de esta institución serán desconectados inmediatamente.' : 'Los accesos volverán a la normalidad para esta institución.'}`,
      icon: newValue ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${actionText}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: newValue ? '#dc2626' : '#2563eb',
      cancelButtonColor: '#64748b'
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
      text: newValue 
        ? 'Todos los usuarios no autorizados de AMBAS instituciones serán desconectados inmediatamente.'
        : 'Se restablecerá el acceso normal para todas las instituciones.',
      icon: newValue ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${actionText} en ambas`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: newValue ? '#dc2626' : '#16a34a',
      cancelButtonColor: '#64748b'
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
        title: `Mantenimiento en Ambas Escuelas: ${newValue ? 'ACTIVADO' : 'DESACTIVADO'}`,
        showConfirmButton: false,
        timer: 2500
      });

      auditar(
        'Panel de Control', 
        newValue ? 'Activar Mantenimiento Global' : 'Desactivar Mantenimiento Global', 
        `Se cambió el estado del mantenimiento en AMBAS instituciones a: ${newValue ? 'ACTIVO' : 'INACTIVO'}`
      );
      
      window.dispatchEvent(new Event('sigae-maintenance-changed'));
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

    const fechaInicioLocal = fechaInicioCupos ? new Date(fechaInicioCupos).toISOString().slice(0, 16) : '';
    const fechaFinLocal = fechaFinCupos ? new Date(fechaFinCupos).toISOString().slice(0, 16) : '';

    const { value: formValues } = await Swal.fire({
      title: 'Parametrización de Solicitud de Cupos',
      html: `
        <div class="text-start px-2">
          <p class="text-muted small mb-3">Define el período oficial en el cual los representantes podrán enviar solicitudes de nuevos cupos.</p>
          <div class="mb-3">
            <label class="form-label fw-bold small text-dark mb-1">Fecha y Hora de Apertura</label>
            <input type="datetime-local" id="swal-inicio-cupos" class="form-control rounded-3" value="${fechaInicioLocal}">
          </div>
          <div class="mb-3">
            <label class="form-label fw-bold small text-dark mb-1">Fecha y Hora de Cierre</label>
            <input type="datetime-local" id="swal-fin-cupos" class="form-control rounded-3" value="${fechaFinLocal}">
          </div>
          <small class="text-muted d-block">Nota: Dejar en blanco para mantener el proceso abierto permanentemente.</small>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar Fechas',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#FF8D00',
      preConfirm: () => {
        const inicio = (document.getElementById('swal-inicio-cupos') as HTMLInputElement).value;
        const fin = (document.getElementById('swal-fin-cupos') as HTMLInputElement).value;
        if (inicio && fin && new Date(inicio) > new Date(fin)) {
          Swal.showValidationMessage('La fecha de inicio no puede ser posterior a la de cierre.');
          return false;
        }
        return { inicio, fin };
      }
    });

    if (formValues) {
      setSaving(true);
      try {
        const { error } = await supabase
          .from('ajustes_globales')
          .upsert([
            { clave: 'fecha_inicio_cupos', valor: formValues.inicio, actualizado_en: new Date().toISOString() },
            { clave: 'fecha_fin_cupos', valor: formValues.fin, actualizado_en: new Date().toISOString() }
          ], { onConflict: 'clave' });

        if (error) throw error;

        setFechaInicioCupos(formValues.inicio);
        setFechaFinCupos(formValues.fin);

        await auditar('Panel de Control', 'Parametrizar Cupos', `Estableció período de cupos del ${formValues.inicio || 'N/A'} al ${formValues.fin || 'N/A'}`);

        Swal.fire({
          icon: 'success',
          title: '¡Período Parametrizado!',
          text: 'Las fechas del proceso de cupos se actualizaron correctamente.',
          confirmButtonColor: '#FF8D00'
        });
      } catch (err: any) {
        Swal.fire('Error', err?.message || 'Error de conexión', 'error');
      } finally {
        setSaving(false);
      }
    }
  };


  if (permLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando panel de control...</span>
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
        <p className="text-muted mb-0">No tienes permisos para acceder al Panel de Control.</p>
      </div>
    );
  }

  return (
    <div className="modulo-animado container-fluid p-0 animate__animated animate__fadeIn">

      {/* 1. Miga de Pan Chamilo */}
      <ChamiloBreadcrumb
        category="Dirección y Sistema"
        currentModule="Panel de Control y Botonera"
      />

      {/* 2. Cuadro de Ayuda Metodológica Chamilo */}
      <ChamiloHelpCallout
        id="ayuda_panel_control"
        title="Guía del Panel de Control y Operatividad Institucional"
        content="Configure en un solo clic las temporadas escolares, encienda o pause la emisión de constancias y carnets digitales, controle la ventana de admisión de cupos y gestione el modo mantenimiento de las escuelas."
        icon="bi-sliders2"
      />

      {/* ── 3. CABECERA INSTITUCIONAL CHAMILO TECH (Estilo Dirección y Sistema) ── */}
      <div 
        className="tech-card overflow-hidden mb-4 shadow-sm animate__animated animate__fadeInDown"
        style={{
          border: '2px solid #fed7aa',
          borderTop: '6px solid #FF8D00',
          background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 45%, #ffedd5 100%)',
          borderRadius: '26px'
        }}
      >
        <div className="p-3 p-sm-4 p-md-4">
          <div className="row align-items-center g-3 g-md-4">
            
            {/* Ícono de Panel de Control y Selector Dual Escuelas */}
            <div className="col-12 col-md-auto text-center text-md-start">
              <div className="d-inline-flex align-items-center gap-3 flex-wrap justify-content-center">
                <div 
                  className="tech-icon-wrapper bg-white shadow-sm d-inline-flex align-items-center justify-content-center p-2"
                  style={{ 
                    width: '95px', 
                    height: '95px', 
                    borderRadius: '24px', 
                    border: '2.5px solid #fed7aa',
                    boxShadow: '0 10px 24px rgba(249, 115, 22, 0.15)'
                  }}
                >
                  <IconoPanelControl size={60} color="#FF8D00" />
                </div>

                <div 
                  className="d-inline-flex align-items-center gap-2 p-2 bg-white rounded-4 border shadow-xs"
                  style={{ borderColor: '#fed7aa' }}
                >
                  {/* Botón Switch SB */}
                  <div 
                    onClick={() => cambiarEscuelaActiva('sb')}
                    className={`rounded-3 p-1.5 border d-flex flex-column align-items-center justify-content-center transition-all ${
                      escuelaCodigo === 'sb' 
                        ? 'bg-success bg-opacity-10 border-success shadow-xs' 
                        : 'bg-white border-transparent opacity-60 hover-efecto'
                    }`}
                    style={{ width: '68px', height: '74px', cursor: 'pointer' }}
                    title="Activar U.E. Santa Bárbara"
                  >
                    <img 
                      src="/assets/img/logo_sb.png" 
                      alt="UE Santa Bárbara" 
                      style={{ maxHeight: '38px', maxWidth: '38px', objectFit: 'contain' }}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                    />
                    <span className={`badge ${escuelaCodigo === 'sb' ? 'bg-success text-white' : 'bg-light text-muted'} extra-small mt-1 px-1.5 py-0`} style={{ fontSize: '0.62rem' }}>
                      SB {escuelaCodigo === 'sb' ? '●' : ''}
                    </span>
                  </div>

                  {/* Botón Switch LB */}
                  <div 
                    onClick={() => cambiarEscuelaActiva('lb')}
                    className={`rounded-3 p-1.5 border d-flex flex-column align-items-center justify-content-center transition-all ${
                      escuelaCodigo === 'lb' 
                        ? 'bg-primary bg-opacity-10 border-primary shadow-xs' 
                        : 'bg-white border-transparent opacity-60 hover-efecto'
                    }`}
                    style={{ width: '68px', height: '74px', cursor: 'pointer' }}
                    title="Activar U.E. Libertador Bolívar"
                  >
                    <img 
                      src="/assets/img/logo_lb.png" 
                      alt="UE Libertador Bolívar" 
                      style={{ maxHeight: '38px', maxWidth: '38px', objectFit: 'contain' }}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                    />
                    <span className={`badge ${escuelaCodigo === 'lb' ? 'bg-primary text-white' : 'bg-light text-muted'} extra-small mt-1 px-1.5 py-0`} style={{ fontSize: '0.62rem' }}>
                      LB {escuelaCodigo === 'lb' ? '●' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Título y Métricas Clave */}
            <div className="col-12 col-md text-center text-md-start">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-2 flex-wrap">
                <span 
                  className="badge text-white fw-bold px-3 py-1.5 rounded-pill shadow-xs d-inline-flex align-items-center gap-1.5"
                  style={{ backgroundColor: '#FF8D00', fontSize: '0.78rem' }}
                >
                  <i className="bi bi-toggles2"></i>Dirección & Control Maestro
                </span>

                <div 
                  className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill bg-white border shadow-xs"
                  style={{ borderColor: '#fed7aa' }}
                >
                  <span className="status-beacon-live" style={{ color: '#ea580c' }}></span>
                  <span 
                    className="extra-small fw-bold text-uppercase" 
                    style={{ fontSize: '0.72rem', color: '#c2410c', letterSpacing: '0.5px' }}
                  >
                    Campus Conectado &bull; SIGAE v1.1
                  </span>
                </div>

                <span className={`badge ${configDocs.modo_temporada === 'inscripciones' ? 'bg-success' : (configDocs.modo_temporada === 'clases_regulares' ? 'bg-primary' : 'bg-warning text-dark')} px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs`}>
                  <i className="bi bi-calendar-check-fill me-1"></i>Temporada: <b>{configDocs.modo_temporada === 'inscripciones' ? 'Inscripciones' : (configDocs.modo_temporada === 'clases_regulares' ? 'Clases Regulares' : 'Personalizado')}</b>
                </span>
                <span className={`badge ${mantenimientoSB || mantenimientoLB ? 'bg-danger text-white' : 'bg-white text-success border'} px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs`} style={{ borderColor: '#fed7aa' }}>
                  <i className="bi bi-cone-striped me-1"></i>Mantenimiento: <b>{mantenimientoSB || mantenimientoLB ? 'Activado' : 'Normal (Abierto)'}</b>
                </span>
              </div>

              <h1 className="fw-bolder mb-1 text-dark fs-3 fs-md-2" style={{ letterSpacing: '-0.5px' }}>
                Botonera y Panel de Control
              </h1>

              <p className="mb-0 text-muted small" style={{ maxWidth: '780px' }}>
                Centro de mando para activar documentos oficiales, fijar temporadas escolares, parametrizar cupos y gestionar el mantenimiento de las <strong className="text-dark">Escuelas DEP Oriente</strong> (UE Santa Bárbara y UE Libertador Bolívar).
              </p>
            </div>

            {/* Acciones Rápidas */}
            <div className="col-12 col-md-auto text-md-end text-center">
              <button
                type="button"
                onClick={() => navigate('/categoria/Direcci%C3%B3n%20y%20Sistema')}
                className="btn btn-white bg-white text-dark rounded-pill px-4 py-2 fw-bold shadow-xs hover-efecto border d-inline-flex align-items-center justify-content-center gap-2 w-100 w-md-auto"
                style={{ borderColor: '#fed7aa', fontSize: '0.85rem' }}
              >
                <i className="bi bi-arrow-left" style={{ color: '#ea580c' }}></i>
                <span>Volver a Dirección</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── CUADRANTES DE MANDO Y NAVEGACIÓN INTUITIVA (3 PILARES MAESTROS) ── */}
      <div className="row g-3 mb-4 animate__animated animate__fadeInUp">
        {/* Pilar 1: Temporadas Escolares */}
        <div className="col-12 col-md-4">
          <div 
            onClick={() => setTabBotonera('temporadas')}
            className={`card h-100 rounded-4 p-3.5 border-2 transition-all hover-efecto ${
              tabBotonera === 'temporadas' 
                ? 'bg-white shadow-sm' 
                : 'bg-white bg-opacity-70 border-light'
            }`}
            style={{ 
              cursor: 'pointer',
              borderColor: tabBotonera === 'temporadas' ? '#FF8D00' : '#fed7aa40',
              transform: tabBotonera === 'temporadas' ? 'translateY(-3px)' : 'none',
              boxShadow: tabBotonera === 'temporadas' ? '0 10px 24px rgba(255, 141, 0, 0.18)' : 'none'
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div 
                className="rounded-3 p-2 d-inline-flex align-items-center justify-content-center shadow-xs"
                style={{ 
                  backgroundColor: configDocs.modo_temporada === 'inscripciones' ? '#ecfdf5' : '#eff6ff',
                  border: `1.5px solid ${configDocs.modo_temporada === 'inscripciones' ? '#a7f3d0' : '#bfdbfe'}`
                }}
              >
                {configDocs.modo_temporada === 'inscripciones' ? (
                  <IconoTemporadaInscripcion size={34} />
                ) : (
                  <IconoTemporadaClases size={34} />
                )}
              </div>
              <span className={`badge rounded-pill px-2.5 py-1 extra-small fw-bold ${
                configDocs.modo_temporada === 'inscripciones' ? 'bg-success text-white' : 
                (configDocs.modo_temporada === 'clases_regulares' ? 'bg-primary text-white' : 'bg-warning text-dark')
              }`}>
                {configDocs.modo_temporada === 'inscripciones' ? '● Inscripciones' : 
                 (configDocs.modo_temporada === 'clases_regulares' ? '● Clases Activas' : '● Personalizado')}
              </span>
            </div>
            <h6 className="fw-bold mb-0.5 text-dark">1. Temporadas 1-Clic</h6>
            <p className="text-muted extra-small mb-0">Presets globales de emisión de documentos</p>
          </div>
        </div>

        {/* Pilar 2: Constancias y Carnets */}
        <div className="col-12 col-md-4">
          <div 
            onClick={() => setTabBotonera('documentos')}
            className={`card h-100 rounded-4 p-3.5 border-2 transition-all hover-efecto ${
              tabBotonera === 'documentos' 
                ? 'bg-white shadow-sm' 
                : 'bg-white bg-opacity-70 border-light'
            }`}
            style={{ 
              cursor: 'pointer',
              borderColor: tabBotonera === 'documentos' ? '#FF8D00' : '#fed7aa40',
              transform: tabBotonera === 'documentos' ? 'translateY(-3px)' : 'none',
              boxShadow: tabBotonera === 'documentos' ? '0 10px 24px rgba(255, 141, 0, 0.18)' : 'none'
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div 
                className="rounded-3 p-2 d-inline-flex align-items-center justify-content-center shadow-xs"
                style={{ backgroundColor: '#fff7ed', border: '1.5px solid #fed7aa' }}
              >
                <IconoDocumentoDigital size={34} />
              </div>
              <span className="badge bg-white text-dark border rounded-pill px-2.5 py-1 extra-small fw-bold shadow-xs" style={{ borderColor: '#fed7aa' }}>
                SB: <b>{docsActivosSB}/5</b> &bull; LB: <b>{docsActivosLB}/5</b>
              </span>
            </div>
            <h6 className="fw-bold mb-0.5 text-dark">2. Constancias y Carnets</h6>
            <p className="text-muted extra-small mb-0">Interruptores individuales por plantel</p>
          </div>
        </div>

        {/* Pilar 3: Mantenimiento & Cupos */}
        <div className="col-12 col-md-4">
          <div 
            onClick={() => setTabBotonera('mantenimiento')}
            className={`card h-100 rounded-4 p-3.5 border-2 transition-all hover-efecto ${
              tabBotonera === 'mantenimiento' 
                ? 'bg-white shadow-sm' 
                : 'bg-white bg-opacity-70 border-light'
            }`}
            style={{ 
              cursor: 'pointer',
              borderColor: tabBotonera === 'mantenimiento' ? '#FF8D00' : '#fed7aa40',
              transform: tabBotonera === 'mantenimiento' ? 'translateY(-3px)' : 'none',
              boxShadow: tabBotonera === 'mantenimiento' ? '0 10px 24px rgba(255, 141, 0, 0.18)' : 'none'
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div 
                className="rounded-3 p-2 d-inline-flex align-items-center justify-content-center shadow-xs"
                style={{ 
                  backgroundColor: (mantenimientoSB || mantenimientoLB) ? '#fef2f2' : '#f0fdf4',
                  border: `1.5px solid ${(mantenimientoSB || mantenimientoLB) ? '#fca5a5' : '#bbf7d0'}`
                }}
              >
                <IconoModoMantenimiento size={34} color={(mantenimientoSB || mantenimientoLB) ? '#dc2626' : '#16a34a'} />
              </div>
              <span className={`badge rounded-pill px-2.5 py-1 extra-small fw-bold ${
                (mantenimientoSB || mantenimientoLB) ? 'bg-danger text-white' : 'bg-success bg-opacity-10 text-success border border-success'
              }`}>
                {(mantenimientoSB || mantenimientoLB) ? '⚠ Mantenimiento' : '● Operativo'}
              </span>
            </div>
            <h6 className="fw-bold mb-0.5 text-dark">3. Mantenimiento & Cupos</h6>
            <p className="text-muted extra-small mb-0">Control de acceso y fechas de admisión</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5 text-muted">
          <div className="spinner-border text-primary mb-3" role="status"></div>
          <div>Cargando ajustes globales del sistema...</div>
        </div>
      ) : (
        <div className="row g-4 mb-5">

          {/* ══════════════════════════════════════════════════════════════
              PESTAÑA 1: TEMPORADAS ESCOLARES (1-CLIC)
             ══════════════════════════════════════════════════════════════ */}
          {tabBotonera === 'temporadas' && (
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
                
                {/* Header explicativo con acciones rápidas */}
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 pb-3 border-bottom">
                  <div>
                    <h4 className="fw-bolder text-dark mb-1 d-flex align-items-center gap-2">
                      <i className="bi bi-magic" style={{ color: '#FF8D00' }}></i>
                      Consola de Temporadas Escolares (1-Clic)
                    </h4>
                    <p className="text-muted small mb-0">
                      Cambie el ciclo operativo de ambas escuelas en un solo toque. El sistema actualizará de inmediato los recaudos y constancias para representantes.
                    </p>
                  </div>

                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={saving || !canModify || configDocs.modo_temporada === 'inscripciones'}
                      onClick={() => handleAplicarPresetTemporada('inscripciones')}
                      className={`btn rounded-pill px-3.5 py-2 fw-bold shadow-xs hover-efecto d-inline-flex align-items-center gap-1.5 ${
                        configDocs.modo_temporada === 'inscripciones' ? 'btn-success text-white' : 'btn-outline-success bg-white'
                      }`}
                      style={{ fontSize: '0.84rem' }}
                    >
                      <i className="bi bi-person-plus-fill"></i>
                      <span>Inscripciones</span>
                    </button>
                    <button
                      type="button"
                      disabled={saving || !canModify || configDocs.modo_temporada === 'clases_regulares'}
                      onClick={() => handleAplicarPresetTemporada('clases_regulares')}
                      className={`btn rounded-pill px-3.5 py-2 fw-bold shadow-xs hover-efecto d-inline-flex align-items-center gap-1.5 ${
                        configDocs.modo_temporada === 'clases_regulares' ? 'btn-primary text-white' : 'btn-outline-primary bg-white'
                      }`}
                      style={{ fontSize: '0.84rem' }}
                    >
                      <i className="bi bi-mortarboard-fill"></i>
                      <span>Clases Regulares</span>
                    </button>
                  </div>
                </div>

                {/* Si está en modo personalizado, mensaje informativo */}
                {configDocs.modo_temporada === 'personalizado' && (
                  <div className="alert alert-warning border-0 rounded-4 shadow-xs p-3.5 mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2.5">
                      <i className="bi bi-sliders2 fs-4 text-warning"></i>
                      <div>
                        <span className="fw-bold d-block small text-dark">Modo Personalizado Activo</span>
                        <span className="extra-small text-muted">
                          Ha activado o pausado documentos manualmente. Si desea regresar a una configuración estándar automática para ambas escuelas, elija uno de los presets a continuación.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="row g-4">
                  {/* Tarjeta 1: Temporada de Inscripciones */}
                  <div className="col-12 col-lg-6">
                    <div 
                      className={`card h-100 rounded-4 p-4 border-2 transition-all ${
                        configDocs.modo_temporada === 'inscripciones' 
                          ? 'border-success bg-success bg-opacity-10 shadow-sm' 
                          : 'border-light bg-light hover-efecto'
                      }`}
                      style={{
                        boxShadow: configDocs.modo_temporada === 'inscripciones' ? '0 12px 28px rgba(16, 185, 129, 0.2)' : 'none'
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-4 p-2 bg-white shadow-xs d-flex align-items-center justify-content-center border" style={{ borderColor: '#a7f3d0' }}>
                            <IconoTemporadaInscripcion size={44} />
                          </div>
                          <div>
                            <h5 className="fw-bold mb-0 text-success">Temporada de Inscripciones</h5>
                            <span className="extra-small text-muted">Fase de Actualización y Formalización de Matrícula</span>
                          </div>
                        </div>
                        {configDocs.modo_temporada === 'inscripciones' && (
                          <span className="badge bg-success rounded-pill px-3 py-1.5 fw-bold extra-small d-inline-flex align-items-center gap-1 shadow-xs">
                            <span className="spinner-grow spinner-grow-sm text-white" style={{ width: '6px', height: '6px' }}></span>
                            ACTIVO AHORA
                          </span>
                        )}
                      </div>

                      <p className="text-muted small mb-3">
                        Habilita la emisión inmediata de comprobantes y recaudos de formalización de matrícula escolar:
                      </p>

                      <div className="bg-white rounded-4 p-3.5 border mb-4 shadow-xs">
                        <div className="extra-small text-muted fw-bold text-uppercase mb-2">Matriz de Emisión de Documentos:</div>
                        <ul className="list-unstyled mb-0 extra-small d-flex flex-column gap-2">
                          <li className="d-flex align-items-center justify-content-between">
                            <span className="text-dark fw-semibold"><i className="bi bi-file-earmark-check-fill text-success me-1.5"></i> Constancia de Inscripción Oficial (SB y LB)</span>
                            <span className="badge bg-success bg-opacity-10 text-success fw-bold rounded-pill px-2 py-0.5">Activada</span>
                          </li>
                          <li className="d-flex align-items-center justify-content-between">
                            <span className="text-dark fw-semibold"><i className="bi bi-card-checklist text-success me-1.5"></i> Resumen de Ficha Integral (Carta)</span>
                            <span className="badge bg-success bg-opacity-10 text-success fw-bold rounded-pill px-2 py-0.5">Activada</span>
                          </li>
                          <li className="d-flex align-items-center justify-content-between">
                            <span className="text-dark fw-semibold"><i className="bi bi-person-badge-fill text-success me-1.5"></i> Carnet Estudiantil Digital</span>
                            <span className="badge bg-success bg-opacity-10 text-success fw-bold rounded-pill px-2 py-0.5">Activada</span>
                          </li>
                          <li className="d-flex align-items-center justify-content-between opacity-60">
                            <span className="text-muted"><i className="bi bi-pause-circle me-1.5"></i> Constancia de Estudio Regular</span>
                            <span className="badge bg-light text-muted border rounded-pill px-2 py-0.5">En Pausa</span>
                          </li>
                          <li className="d-flex align-items-center justify-content-between opacity-60">
                            <span className="text-muted"><i className="bi bi-pause-circle me-1.5"></i> Constancia de Buena Conducta</span>
                            <span className="badge bg-light text-muted border rounded-pill px-2 py-0.5">En Pausa</span>
                          </li>
                        </ul>
                      </div>

                      <button
                        type="button"
                        className={`btn rounded-pill fw-bold w-100 py-2.5 shadow-xs transition-all ${
                          configDocs.modo_temporada === 'inscripciones' 
                            ? 'btn-success text-white' 
                            : 'btn-outline-success bg-white hover-efecto'
                        }`}
                        disabled={saving || !canModify || configDocs.modo_temporada === 'inscripciones'}
                        onClick={() => handleAplicarPresetTemporada('inscripciones')}
                      >
                        {configDocs.modo_temporada === 'inscripciones' ? '✓ Modo Inscripciones Activo en el Plantel' : 'Activar Temporada de Inscripciones'}
                      </button>
                    </div>
                  </div>

                  {/* Tarjeta 2: Año Escolar Regular */}
                  <div className="col-12 col-lg-6">
                    <div 
                      className={`card h-100 rounded-4 p-4 border-2 transition-all ${
                        configDocs.modo_temporada === 'clases_regulares' 
                          ? 'border-primary bg-primary bg-opacity-10 shadow-sm' 
                          : 'border-light bg-light hover-efecto'
                      }`}
                      style={{
                        boxShadow: configDocs.modo_temporada === 'clases_regulares' ? '0 12px 28px rgba(37, 99, 235, 0.2)' : 'none'
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="rounded-4 p-2 bg-white shadow-xs d-flex align-items-center justify-content-center border" style={{ borderColor: '#bfdbfe' }}>
                            <IconoTemporadaClases size={44} />
                          </div>
                          <div>
                            <h5 className="fw-bold mb-0 text-primary">Año Escolar Regular / Clases</h5>
                            <span className="extra-small text-muted">Fase de Actividades Académicas y Evaluaciones</span>
                          </div>
                        </div>
                        {configDocs.modo_temporada === 'clases_regulares' && (
                          <span className="badge bg-primary rounded-pill px-3 py-1.5 fw-bold extra-small d-inline-flex align-items-center gap-1 shadow-xs">
                            <span className="spinner-grow spinner-grow-sm text-white" style={{ width: '6px', height: '6px' }}></span>
                            ACTIVO AHORA
                          </span>
                        )}
                      </div>

                      <p className="text-muted small mb-3">
                        Ideal al iniciar las clases regulares del calendario escolar oficial MPPE:
                      </p>

                      <div className="bg-white rounded-4 p-3.5 border mb-4 shadow-xs">
                        <div className="extra-small text-muted fw-bold text-uppercase mb-2">Matriz de Emisión de Documentos:</div>
                        <ul className="list-unstyled mb-0 extra-small d-flex flex-column gap-2">
                          <li className="d-flex align-items-center justify-content-between">
                            <span className="text-dark fw-semibold"><i className="bi bi-file-earmark-text-fill text-primary me-1.5"></i> Constancia de Estudio Regular (SB y LB)</span>
                            <span className="badge bg-primary bg-opacity-10 text-primary fw-bold rounded-pill px-2 py-0.5">Activada</span>
                          </li>
                          <li className="d-flex align-items-center justify-content-between">
                            <span className="text-dark fw-semibold"><i className="bi bi-award-fill text-info me-1.5"></i> Constancia de Buena Conducta</span>
                            <span className="badge bg-info bg-opacity-10 text-info fw-bold rounded-pill px-2 py-0.5">Activada</span>
                          </li>
                          <li className="d-flex align-items-center justify-content-between">
                            <span className="text-dark fw-semibold"><i className="bi bi-person-badge-fill text-primary me-1.5"></i> Carnet Estudiantil Digital</span>
                            <span className="badge bg-primary bg-opacity-10 text-primary fw-bold rounded-pill px-2 py-0.5">Activada</span>
                          </li>
                          <li className="d-flex align-items-center justify-content-between opacity-60">
                            <span className="text-muted"><i className="bi bi-pause-circle me-1.5"></i> Constancia de Inscripción</span>
                            <span className="badge bg-light text-muted border rounded-pill px-2 py-0.5">En Pausa</span>
                          </li>
                          <li className="d-flex align-items-center justify-content-between opacity-60">
                            <span className="text-muted"><i className="bi bi-pause-circle me-1.5"></i> Ficha Resumen de Matrícula</span>
                            <span className="badge bg-light text-muted border rounded-pill px-2 py-0.5">En Pausa</span>
                          </li>
                        </ul>
                      </div>

                      <button
                        type="button"
                        className={`btn rounded-pill fw-bold w-100 py-2.5 shadow-xs transition-all ${
                          configDocs.modo_temporada === 'clases_regulares' 
                            ? 'btn-primary text-white' 
                            : 'btn-outline-primary bg-white hover-efecto'
                        }`}
                        disabled={saving || !canModify || configDocs.modo_temporada === 'clases_regulares'}
                        onClick={() => handleAplicarPresetTemporada('clases_regulares')}
                        style={{ backgroundColor: configDocs.modo_temporada === 'clases_regulares' ? '#2563eb' : undefined, borderColor: '#2563eb' }}
                      >
                        {configDocs.modo_temporada === 'clases_regulares' ? '✓ Modo Clases Regulares Activo en el Plantel' : 'Activar Modo Inicio de Clases'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              PESTAÑA 2: CONSTANCIAS Y CARNETS (CONTROL GRANULAR TÁCTIL)
             ══════════════════════════════════════════════════════════════ */}
          {tabBotonera === 'documentos' && (
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
                
                {/* Barra de Filtro y Operaciones en Lote */}
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 pb-3 border-bottom mb-4">
                  <div>
                    <h4 className="fw-bolder text-dark mb-1 d-flex align-items-center gap-2">
                      <i className="bi bi-file-earmark-check-fill text-primary"></i>
                      Control Granular de Documentos y Carnets
                    </h4>
                    <p className="text-muted small mb-0">
                      Encienda o pause de manera independiente cada tipo de documento oficial por escuela.
                    </p>
                  </div>

                  {/* Selector de Escuela Manual */}
                  <div className="d-flex align-items-center gap-2 overflow-x-auto pb-1 flex-nowrap" style={{ scrollbarWidth: 'none' }}>
                    <button
                      type="button"
                      onClick={() => setEscuelaFiltro('sb')}
                      className={`btn btn-xs rounded-pill px-3.5 py-1.5 fw-bold text-nowrap transition-all d-flex align-items-center gap-2 ${
                        escuelaFiltro === 'sb' ? 'btn-success text-white shadow-xs' : 'btn-white bg-white text-muted border'
                      }`}
                    >
                      <img 
                        src="/assets/img/logo_sb.png" 
                        alt="SB" 
                        style={{ width: '16px', height: '16px', objectFit: 'contain' }} 
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      UE Santa Bárbara ({docsActivosSB}/5)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEscuelaFiltro('lb')}
                      className={`btn btn-xs rounded-pill px-3.5 py-1.5 fw-bold text-nowrap transition-all d-flex align-items-center gap-2 ${
                        escuelaFiltro === 'lb' ? 'btn-primary text-white shadow-xs' : 'btn-white bg-white text-muted border'
                      }`}
                    >
                      <img 
                        src="/assets/img/logo_lb.png" 
                        alt="LB" 
                        style={{ width: '16px', height: '16px', objectFit: 'contain' }} 
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      UE Libertador Bolívar ({docsActivosLB}/5)
                    </button>
                  </div>
                </div>

                <div className="row g-4">
                  
                  {/* Bloque U.E. Santa Bárbara */}
                  {escuelaFiltro === 'sb' && (
                    <div className="col-12">
                      <div className="card border rounded-4 p-4 bg-light shadow-xs h-100">
                        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2">
                          <div className="d-flex align-items-center gap-2">
                            <img 
                              src="/assets/img/logo_sb.png" 
                              alt="SB" 
                              style={{ width: '28px', height: '28px', objectFit: 'contain' }} 
                              onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                            />
                            <h5 className="fw-bold mb-0 text-dark">U.E. Santa Bárbara</h5>
                            <span className="badge bg-success rounded-pill px-2.5 py-0.5 extra-small">
                              {docsActivosSB} de 5 activos
                            </span>
                          </div>

                          {/* Acciones en lote SB */}
                          <div className="d-flex align-items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleAllSchoolDocs('sb', true)}
                              disabled={saving || !canModify || docsActivosSB === 5}
                              className="btn btn-xs btn-white bg-white text-success border rounded-pill px-2.5 py-1 fw-bold hover-efecto"
                              title="Habilitar todos los documentos para Santa Bárbara"
                            >
                              <i className="bi bi-check-all me-1"></i>Activar Todos
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleAllSchoolDocs('sb', false)}
                              disabled={saving || !canModify || docsActivosSB === 0}
                              className="btn btn-xs btn-white bg-white text-muted border rounded-pill px-2.5 py-1 fw-bold hover-efecto"
                              title="Pausar todos los documentos para Santa Bárbara"
                            >
                              <i className="bi bi-pause-fill me-1"></i>Pausar Todos
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopySchoolDocs('sb', 'lb')}
                              disabled={saving || !canModify}
                              className="btn btn-xs btn-white bg-white text-primary border rounded-pill px-2.5 py-1 fw-bold hover-efecto"
                              title="Copiar estos ajustes hacia Libertador Bolívar"
                            >
                              <i className="bi bi-copy me-1"></i>Copiar a LB
                            </button>
                          </div>
                        </div>

                        {/* Mosaico de Documentos SB */}
                        <div className="d-flex flex-column gap-3">
                          {[
                            {
                              key: 'constancia_inscripcion_sb',
                              titulo: 'Constancia de Inscripción Oficial',
                              desc: 'Comprobante formal con sello y firma digital para el nuevo año escolar.',
                              icon: 'bi-file-earmark-check-fill',
                              color: '#10b981',
                              active: configDocs.constancia_inscripcion_sb
                            },
                            {
                              key: 'constancia_estudio_sb',
                              titulo: 'Constancia de Estudio Regular',
                              desc: 'Certifica la condición de estudiante activo en la institución educativa.',
                              icon: 'bi-mortarboard-fill',
                              color: '#2563eb',
                              active: configDocs.constancia_estudio_sb
                            },
                            {
                              key: 'constancia_conducta_sb',
                              titulo: 'Constancia de Buena Conducta',
                              desc: 'Certificación de disciplina y convivencia institucional.',
                              icon: 'bi-award-fill',
                              color: '#0284c7',
                              active: configDocs.constancia_conducta_sb
                            },
                            {
                              key: 'carnet_sb',
                              titulo: 'Carnet Estudiantil Digital',
                              desc: 'Credencial estudiantil oficial con foto y código QR de validación.',
                              icon: 'bi-person-badge-fill',
                              color: '#d97706',
                              active: configDocs.carnet_sb
                            },
                            {
                              key: 'resumen_ficha_sb',
                              titulo: 'Ficha Resumen Integral (Carta)',
                              desc: 'Expediente consolidado de datos médicos, personales y académicos.',
                              icon: 'bi-card-checklist',
                              color: '#64748b',
                              active: configDocs.resumen_ficha_sb
                            }
                          ].map((doc) => (
                            <div 
                              key={doc.key}
                              className={`p-3 rounded-4 border bg-white d-flex align-items-center justify-content-between transition-all shadow-xs ${
                                doc.active ? 'border-success' : 'border-light'
                              }`}
                              style={{
                                borderLeft: doc.active ? `5px solid ${doc.color}` : '5px solid #cbd5e1'
                              }}
                            >
                              <div className="d-flex align-items-center gap-3">
                                <div 
                                  className="rounded-3 p-2.5 d-inline-flex align-items-center justify-content-center"
                                  style={{ 
                                    backgroundColor: doc.active ? `${doc.color}15` : '#f1f5f9',
                                    color: doc.active ? doc.color : '#94a3b8'
                                  }}
                                >
                                  <i className={`bi ${doc.icon} fs-4`}></i>
                                </div>
                                <div>
                                  <span className="fw-bold text-dark d-block small mb-0.5">{doc.titulo}</span>
                                  <p className="text-muted extra-small mb-1 d-none d-sm-block">{doc.desc}</p>
                                  <span className={`badge rounded-pill extra-small fw-bold px-2 py-0.5 ${
                                    doc.active ? 'bg-success bg-opacity-10 text-success border border-success' : 'bg-light text-muted border'
                                  }`}>
                                    {doc.active ? '● EMISIÓN ACTIVA' : '○ EN PAUSA'}
                                  </span>
                                </div>
                              </div>
                              <div className="form-check form-switch fs-3 mb-0 ms-2">
                                <input
                                  className="form-check-input hover-mano"
                                  type="checkbox"
                                  role="switch"
                                  checked={doc.active}
                                  disabled={saving || !canModify}
                                  onChange={(e) => handleToggleAjusteDoc(doc.key as any, e.target.checked, `${doc.titulo} (SB)`)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bloque UE Libertador Bolívar */}
                  {escuelaFiltro === 'lb' && (
                    <div className="col-12">
                      <div className="card border rounded-4 p-4 bg-light shadow-xs h-100">
                        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom flex-wrap gap-2">
                          <div className="d-flex align-items-center gap-2">
                            <img 
                              src="/assets/img/logo_lb.png" 
                              alt="LB" 
                              style={{ width: '28px', height: '28px', objectFit: 'contain' }} 
                              onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                            />
                            <h5 className="fw-bold mb-0 text-dark">U.E. Libertador Bolívar</h5>
                            <span className="badge bg-primary rounded-pill px-2.5 py-0.5 extra-small">
                              {docsActivosLB} de 5 activos
                            </span>
                          </div>

                          {/* Acciones en lote LB */}
                          <div className="d-flex align-items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleAllSchoolDocs('lb', true)}
                              disabled={saving || !canModify || docsActivosLB === 5}
                              className="btn btn-xs btn-white bg-white text-success border rounded-pill px-2.5 py-1 fw-bold hover-efecto"
                              title="Habilitar todos los documentos para Libertador Bolívar"
                            >
                              <i className="bi bi-check-all me-1"></i>Activar Todos
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleAllSchoolDocs('lb', false)}
                              disabled={saving || !canModify || docsActivosLB === 0}
                              className="btn btn-xs btn-white bg-white text-muted border rounded-pill px-2.5 py-1 fw-bold hover-efecto"
                              title="Pausar todos los documentos para Libertador Bolívar"
                            >
                              <i className="bi bi-pause-fill me-1"></i>Pausar Todos
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopySchoolDocs('lb', 'sb')}
                              disabled={saving || !canModify}
                              className="btn btn-xs btn-white bg-white text-success border rounded-pill px-2.5 py-1 fw-bold hover-efecto"
                              title="Copiar estos ajustes hacia Santa Bárbara"
                            >
                              <i className="bi bi-copy me-1"></i>Copiar a SB
                            </button>
                          </div>
                        </div>

                        {/* Mosaico de Documentos LB */}
                        <div className="d-flex flex-column gap-3">
                          {[
                            {
                              key: 'constancia_inscripcion_lb',
                              titulo: 'Constancia de Inscripción Oficial',
                              desc: 'Comprobante formal con sello y firma digital para el nuevo año escolar.',
                              icon: 'bi-file-earmark-check-fill',
                              color: '#10b981',
                              active: configDocs.constancia_inscripcion_lb
                            },
                            {
                              key: 'constancia_estudio_lb',
                              titulo: 'Constancia de Estudio Regular',
                              desc: 'Certifica la condición de estudiante activo en la institución educativa.',
                              icon: 'bi-mortarboard-fill',
                              color: '#2563eb',
                              active: configDocs.constancia_estudio_lb
                            },
                            {
                              key: 'constancia_conducta_lb',
                              titulo: 'Constancia de Buena Conducta',
                              desc: 'Certificación de disciplina y convivencia institucional.',
                              icon: 'bi-award-fill',
                              color: '#0284c7',
                              active: configDocs.constancia_conducta_lb
                            },
                            {
                              key: 'carnet_lb',
                              titulo: 'Carnet Estudiantil Digital',
                              desc: 'Credencial estudiantil oficial con foto y código QR de validación.',
                              icon: 'bi-person-badge-fill',
                              color: '#d97706',
                              active: configDocs.carnet_lb
                            },
                            {
                              key: 'resumen_ficha_lb',
                              titulo: 'Ficha Resumen Integral (Carta)',
                              desc: 'Expediente consolidado de datos médicos, personales y académicos.',
                              icon: 'bi-card-checklist',
                              color: '#64748b',
                              active: configDocs.resumen_ficha_lb
                            }
                          ].map((doc) => (
                            <div 
                              key={doc.key}
                              className={`p-3 rounded-4 border bg-white d-flex align-items-center justify-content-between transition-all shadow-xs ${
                                doc.active ? 'border-primary' : 'border-light'
                              }`}
                              style={{
                                borderLeft: doc.active ? `5px solid ${doc.color}` : '5px solid #cbd5e1'
                              }}
                            >
                              <div className="d-flex align-items-center gap-3">
                                <div 
                                  className="rounded-3 p-2.5 d-inline-flex align-items-center justify-content-center"
                                  style={{ 
                                    backgroundColor: doc.active ? `${doc.color}15` : '#f1f5f9',
                                    color: doc.active ? doc.color : '#94a3b8'
                                  }}
                                >
                                  <i className={`bi ${doc.icon} fs-4`}></i>
                                </div>
                                <div>
                                  <span className="fw-bold text-dark d-block small mb-0.5">{doc.titulo}</span>
                                  <p className="text-muted extra-small mb-1 d-none d-sm-block">{doc.desc}</p>
                                  <span className={`badge rounded-pill extra-small fw-bold px-2 py-0.5 ${
                                    doc.active ? 'bg-primary bg-opacity-10 text-primary border border-primary' : 'bg-light text-muted border'
                                  }`}>
                                    {doc.active ? '● EMISIÓN ACTIVA' : '○ EN PAUSA'}
                                  </span>
                                </div>
                              </div>
                              <div className="form-check form-switch fs-3 mb-0 ms-2">
                                <input
                                  className="form-check-input hover-mano"
                                  type="checkbox"
                                  role="switch"
                                  checked={doc.active}
                                  disabled={saving || !canModify}
                                  onChange={(e) => handleToggleAjusteDoc(doc.key as any, e.target.checked, `${doc.titulo} (LB)`)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}


          {/* ══════════════════════════════════════════════════════════════
              PESTAÑA 4: MANTENIMIENTO Y CUPOS
             ══════════════════════════════════════════════════════════════ */}
          {tabBotonera === 'mantenimiento' && (
            <div className="col-12 d-flex flex-column gap-4">
              
              {/* Card 1: Modo Mantenimiento por Escuela */}
              <div 
                className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white border-start border-5"
                style={{ borderColor: (mantenimientoSB || mantenimientoLB) ? '#dc2626' : '#16a34a' }}
              >
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4 pb-3 border-bottom">
                  <div className="d-flex align-items-center gap-3">
                    <div 
                      className="p-3 rounded-4 shadow-xs d-flex align-items-center justify-content-center"
                      style={{ 
                        backgroundColor: (mantenimientoSB || mantenimientoLB) ? '#fef2f2' : '#f0fdf4',
                        border: `1.5px solid ${(mantenimientoSB || mantenimientoLB) ? '#fca5a5' : '#bbf7d0'}`
                      }}
                    >
                      <IconoModoMantenimiento size={42} color={(mantenimientoSB || mantenimientoLB) ? '#dc2626' : '#16a34a'} />
                    </div>
                    <div>
                      <h4 className="fw-bolder text-dark mb-1">Control de Mantenimiento Institucional</h4>
                      <p className="text-muted small mb-0">
                        Suspenda el acceso temporal a los usuarios de la escuela correspondiente en caso de auditorías o migraciones.
                      </p>
                    </div>
                  </div>

                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleToggleBothMantenimiento(true)}
                      disabled={saving || !canModify || (mantenimientoSB && mantenimientoLB)}
                      className="btn btn-sm btn-outline-danger rounded-pill fw-bold px-3 py-1.5 shadow-xs hover-efecto"
                    >
                      <i className="bi bi-cone-striped me-1"></i>Ambas en Mantenimiento
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleBothMantenimiento(false)}
                      disabled={saving || !canModify || (!mantenimientoSB && !mantenimientoLB)}
                      className="btn btn-sm btn-success text-white rounded-pill fw-bold px-3 py-1.5 shadow-xs hover-efecto"
                    >
                      <i className="bi bi-shield-check me-1"></i>Restablecer Ambas
                    </button>
                  </div>
                </div>

                <div className="row g-3">
                  {/* Santa Bárbara */}
                  <div className="col-12 col-md-6">
                    <div className={`p-4 rounded-4 border-2 d-flex align-items-center justify-content-between transition-all shadow-xs ${
                      mantenimientoSB ? 'bg-danger bg-opacity-10 border-danger' : 'bg-light border-light'
                    }`}>
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1.5">
                          <img 
                            src="/assets/img/logo_sb.png" 
                            alt="SB" 
                            style={{ width: '26px', height: '26px', objectFit: 'contain' }} 
                            onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                          />
                          <span className="fw-bold text-dark fs-6">U.E. Santa Bárbara</span>
                        </div>
                        <span className={`badge rounded-pill extra-small fw-bold px-2.5 py-1 ${
                          mantenimientoSB ? 'bg-danger text-white' : 'bg-success bg-opacity-10 text-success border border-success'
                        }`}>
                          {mantenimientoSB ? '⚠ ACCESO RESTRINGIDO (MANTENIMIENTO)' : '● OPERATIVIDAD NORMAL'}
                        </span>
                      </div>
                      <div className="form-check form-switch fs-2 mb-0">
                        <input
                          className="form-check-input hover-mano"
                          type="checkbox"
                          role="switch"
                          checked={mantenimientoSB}
                          disabled={saving || !canModify}
                          onChange={(e) => handleToggleSchoolMantenimiento('sb', e.target.checked)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Libertador Bolívar */}
                  <div className="col-12 col-md-6">
                    <div className={`p-4 rounded-4 border-2 d-flex align-items-center justify-content-between transition-all shadow-xs ${
                      mantenimientoLB ? 'bg-danger bg-opacity-10 border-danger' : 'bg-light border-light'
                    }`}>
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1.5">
                          <img 
                            src="/assets/img/logo_lb.png" 
                            alt="LB" 
                            style={{ width: '26px', height: '26px', objectFit: 'contain' }} 
                            onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                          />
                          <span className="fw-bold text-dark fs-6">U.E. Libertador Bolívar</span>
                        </div>
                        <span className={`badge rounded-pill extra-small fw-bold px-2.5 py-1 ${
                          mantenimientoLB ? 'bg-danger text-white' : 'bg-success bg-opacity-10 text-success border border-success'
                        }`}>
                          {mantenimientoLB ? '⚠ ACCESO RESTRINGIDO (MANTENIMIENTO)' : '● OPERATIVIDAD NORMAL'}
                        </span>
                      </div>
                      <div className="form-check form-switch fs-2 mb-0">
                        <input
                          className="form-check-input hover-mano"
                          type="checkbox"
                          role="switch"
                          checked={mantenimientoLB}
                          disabled={saving || !canModify}
                          onChange={(e) => handleToggleSchoolMantenimiento('lb', e.target.checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Ventana de Fechas para Cupos */}
              <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white border-start border-5 border-warning">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4 pb-3 border-bottom">
                  <div className="d-flex align-items-center gap-3">
                    <div 
                      className="p-3 rounded-4 shadow-xs d-flex align-items-center justify-content-center"
                      style={{ backgroundColor: '#fffbeb', border: '1.5px solid #fde68a' }}
                    >
                      <IconoVentanaCupos size={42} />
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-0.5 flex-wrap">
                        <h4 className="fw-bolder text-dark mb-0">Ventana de Solicitud de Nuevos Cupos</h4>
                        <span className={`badge bg-${estadoCupos.color} text-white rounded-pill px-2.5 py-1 extra-small fw-bold shadow-xs`}>
                          <i className={`bi ${estadoCupos.icon} me-1`}></i>{estadoCupos.texto}
                        </span>
                      </div>
                      <p className="text-muted small mb-0">
                        Rango de fechas y horas oficiales en que los representantes pueden registrar solicitudes.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleParametrizarCupos}
                    disabled={saving || !canModify}
                    className="btn btn-warning text-dark fw-bold rounded-pill px-4 py-2 shadow-xs hover-efecto d-inline-flex align-items-center gap-1.5"
                  >
                    <i className="bi bi-calendar-event"></i>
                    <span>Configurar Fechas</span>
                  </button>
                </div>

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="p-3.5 rounded-4 bg-light border">
                      <span className="extra-small text-muted fw-bold d-block text-uppercase mb-1">
                        <i className="bi bi-calendar-plus text-primary me-1"></i>Fecha y Hora de Apertura
                      </span>
                      <span className="fw-bold text-dark fs-6">
                        {fechaInicioCupos ? new Date(fechaInicioCupos).toLocaleString('es-VE') : 'Abierto permanentemente'}
                      </span>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="p-3.5 rounded-4 bg-light border">
                      <span className="extra-small text-muted fw-bold d-block text-uppercase mb-1">
                        <i className="bi bi-calendar-x text-danger me-1"></i>Fecha y Hora de Cierre
                      </span>
                      <span className="fw-bold text-dark fs-6">
                        {fechaFinCupos ? new Date(fechaFinCupos).toLocaleString('es-VE') : 'Sin fecha límite de cierre'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>


            </div>
          )}

          {/* Información del Sistema Chamilo Tech */}
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white border-top border-3" style={{ borderColor: '#FF8D00' }}>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <h6 className="fw-bolder mb-0 text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-cpu-fill" style={{ color: '#FF8D00' }}></i>
                  Telemetría y Estado del Servidor Cloud
                </h6>
                <span className="badge bg-success bg-opacity-10 text-success fw-bold px-3 py-1.5 rounded-pill d-inline-flex align-items-center gap-1.5" style={{ fontSize: '0.75rem' }}>
                  <span className="spinner-grow spinner-grow-sm text-success" style={{ width: '7px', height: '7px' }} role="status"></span>
                  Conexión Estable &bull; Latencia Óptima
                </span>
              </div>

              <div className="row g-3">
                <div className="col-6 col-md-3">
                  <span className="extra-small text-muted d-block">Base de Datos:</span>
                  <span className="fw-bold text-success small"><i className="bi bi-cloud-check-fill me-1"></i>Supabase Cloud (Online)</span>
                </div>
                <div className="col-6 col-md-3">
                  <span className="extra-small text-muted d-block">Zona Horaria:</span>
                  <span className="fw-bold text-dark small">America/Caracas (VET)</span>
                </div>
                <div className="col-6 col-md-3">
                  <span className="extra-small text-muted d-block">Versión Plataforma:</span>
                  <span className="badge bg-primary rounded-pill px-2.5 py-1 extra-small fw-bold">SIGAE v1.1 Oficial</span>
                </div>
                <div className="col-6 col-md-3">
                  <span className="extra-small text-muted d-block">Entorno de Ejecución:</span>
                  <span className="fw-bold text-dark small">PWA / Desktop Híbrido</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
