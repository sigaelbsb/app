import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { ChamiloBreadcrumb, ChamiloHelpCallout } from '../../components/chamilo';
import { 
  obtenerSesionesUsuario, 
  cambiarEstadoSesion, 
  cerrarTodasLasDemasSesiones, 
  getOrInitSessionId, 
  registrarSesionActiva,
  type SesionDispositivo 
} from '../../utils/activeSessionsHelper';

export const DispositivosSesiones = () => {
  const navigate = useNavigate();
  const [appUser, setAppUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sesiones, setSesiones] = useState<SesionDispositivo[]>([]);
  const [loadingSesiones, setLoadingSesiones] = useState(false);
  const currentSessionId = getOrInitSessionId();

  const esModoEmulacion = !!(
    appUser?.es_emulacion ||
    localStorage.getItem('sigae_usuario_original_admin') ||
    sessionStorage.getItem('sigae_emulacion_activa') === 'true'
  );

  const Swal = (window as any).Swal;

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    let sessionUser: any = null;
    const stored = localStorage.getItem('usuario_sigae');
    if (stored) {
      try {
        sessionUser = JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    if (!sessionUser) {
      setLoading(false);
      return;
    }

    const cedula = String(sessionUser.cedula).trim();

    try {
      const { data: dbUser, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('cedula', cedula)
        .maybeSingle();

      if (error) throw error;
      if (dbUser) {
        setAppUser(dbUser);
        await cargarSesiones(cedula);
      }
    } catch (e) {
      console.error("Error al cargar usuario en Dispositivos y Sesiones:", e);
    }
    setLoading(false);
  };

  const cargarSesiones = async (ced: string) => {
    if (!ced) return;
    setLoadingSesiones(true);
    try {
      const isEmul = !!(
        localStorage.getItem('sigae_usuario_original_admin') ||
        sessionStorage.getItem('sigae_emulacion_activa') === 'true' ||
        appUser?.es_emulacion
      );

      // Si no es emulación, registramos la sesión normalmente
      if (!isEmul) {
        await registrarSesionActiva(ced);
      }
      const list = await obtenerSesionesUsuario(ced);
      
      // REGLA CRÍTICA: En modo emulación / virtualización, NUNCA mostrar la sesión actual
      // del navegador del emulador en los dispositivos vinculados de la cuenta
      const sesionesFiltradas = isEmul 
        ? list.filter(s => s.id !== currentSessionId && !(s as any).es_emulacion)
        : list;

      setSesiones(sesionesFiltradas);
    } catch (e) {
      console.error("Error al cargar sesiones:", e);
    } finally {
      setLoadingSesiones(false);
    }
  };

  const handleToggleSesion = async (targetId: string, nuevoEstado: boolean) => {
    if (!appUser?.cedula) return;

    if (esModoEmulacion) {
      if (Swal) {
        Swal.fire({
          icon: 'info',
          title: 'Modo Virtualización / Emulación',
          text: 'Te encuentras en una sesión de auditoría técnica. No está permitido modificar ni revocar los dispositivos reales de este usuario.',
          confirmButtonColor: '#0284c7'
        });
      }
      return;
    }
    
    if (!nuevoEstado) {
      if (Swal) {
        const confirm = await Swal.fire({
          title: '¿Cerrar sesión en este equipo?',
          text: 'Ese dispositivo o navegador será desconectado inmediatamente del sistema.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, desconectar equipo',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#dc3545'
        });
        if (!confirm.isConfirmed) return;
      }
    }

    const exito = await cambiarEstadoSesion(appUser.cedula, targetId, nuevoEstado);
    if (exito) {
      if (Swal) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: nuevoEstado ? 'Sesión reactivada' : 'Sesión cerrada remotamente',
          showConfirmButton: false,
          timer: 2500
        });
      }
      auditar('Seguridad', nuevoEstado ? 'Reactivar Sesión Remota' : 'Cerrar Sesión Remota', `Sesión: ${targetId}`);
      await cargarSesiones(appUser.cedula);
    } else {
      if (Swal) Swal.fire('Error', 'No se pudo actualizar el estado de la sesión.', 'error');
    }
  };

  const handleCerrarTodasLasDemas = async () => {
    if (!appUser?.cedula) return;

    if (esModoEmulacion) {
      if (Swal) {
        Swal.fire({
          icon: 'info',
          title: 'Modo Virtualización / Emulación',
          text: 'Te encuentras en una sesión de auditoría técnica. No está permitido revocar los dispositivos reales de este usuario.',
          confirmButtonColor: '#0284c7'
        });
      }
      return;
    }

    if (Swal) {
      const confirm = await Swal.fire({
        title: '¿Cerrar sesión en todos los demás dispositivos?',
        text: 'Se desconectarán todas las computadoras y teléfonos excepto este equipo actual en uso.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, cerrar todas las demás',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545'
      });
      if (!confirm.isConfirmed) return;
    }

    const exito = await cerrarTodasLasDemasSesiones(appUser.cedula);
    if (exito) {
      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Sesiones Cerradas!',
          text: 'Todas las demás sesiones han sido revocadas exitosamente.',
          confirmButtonColor: '#0066FF'
        });
      }
      auditar('Seguridad', 'Cerrar Todas las Sesiones', 'El usuario cerró todas las sesiones remotas.');
      await cargarSesiones(appUser.cedula);
    } else {
      if (Swal) Swal.fire('Error', 'No se pudieron cerrar las demás sesiones.', 'error');
    }
  };

  const formatearFecha = (iso: string) => {
    if (!iso) return 'Reciente';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('es-VE', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return iso;
    }
  };

  const totalPCs = sesiones.filter(s => s.tipo_dispositivo === 'computadora' || s.sistema_operativo.includes('Windows') || s.sistema_operativo.includes('macOS') || s.sistema_operativo.includes('Linux')).length;
  const totalMoviles = sesiones.filter(s => s.tipo_dispositivo === 'telefono' || s.tipo_dispositivo === 'tablet' || s.sistema_operativo.includes('Android') || s.sistema_operativo.includes('iOS')).length;
  const totalActivas = sesiones.filter(s => s.activa).length;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5 h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 animate__animated animate__fadeIn">

      {/* MIGAS DE PAN CHAMILO */}
      <ChamiloBreadcrumb
        category="Seguridad y Accesos"
        currentModule="Dispositivos y Sesiones"
      />

      {/* CUADRO DE AYUDA METODOLÓGICA CHAMILO */}
      <ChamiloHelpCallout
        id="ayuda_dispositivos_sesiones"
        title="Gestión de Dispositivos y Sesiones Activas (Estilo WhatsApp Web)"
        content="Supervise en tiempo real todas las computadoras, teléfonos móviles y tablets conectadas a su cuenta institucional. Puede revocar o cerrar sesiones remotamente si dejó su cuenta abierta en un equipo ajeno."
        icon="bi-display"
      />

      {/* Header Banner */}
      <div 
        className="banner-modulo p-4 p-md-5 mb-4 shadow-sm text-white position-relative overflow-hidden rounded-4" 
        style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
      >
        <div className="burbuja-3d burbuja-1"></div>
        <div className="burbuja-3d burbuja-2"></div>
        <div className="burbuja-3d burbuja-3"></div>
        <div className="row align-items-center position-relative z-1">
          <div className="col-lg-9 text-center text-md-start mb-3 mb-lg-0">
            <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
              <span className="badge bg-white text-primary px-3 py-2 shadow-sm fw-bold rounded-pill badge-3d" style={{ letterSpacing: '0.5px' }}>
                <i className="bi bi-whatsapp me-1"></i> CONTROL ESTILO WHATSAPP WEB
              </span>
              <span className="badge bg-emerald-500 text-white px-3 py-2 shadow-sm fw-bold rounded-pill" style={{ background: '#10b981' }}>
                <i className="bi bi-shield-check me-1"></i> {totalActivas} {totalActivas === 1 ? 'Sesión Activa' : 'Sesiones Activas'}
              </span>
            </div>
            <h1 className="fw-bolder mb-2 text-white" style={{ fontSize: 'calc(1.6rem + 1vw)', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              <i className="bi bi-display me-2"></i>Dispositivos y Sesiones Activas
            </h1>
            <p className="mb-0 fw-semibold fs-5 text-white text-opacity-90" style={{ maxWidth: '820px' }}>
              Control centralizado de computadoras y teléfonos vinculados a tu cuenta con desconexión remota inmediata.
            </p>
          </div>
          <div className="col-lg-3 text-end d-none d-lg-block">
            <img 
              src={`/assets/img/logo_${localStorage.getItem('sigae_escuela_codigo') || 'sb'}.png`} 
              alt="Logo Escuela" 
              className="logo-escuela-banner"
              onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
            />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white d-flex flex-row align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 p-3 rounded-4 text-primary fs-3">
              <i className="bi bi-laptop"></i>
            </div>
            <div>
              <span className="text-muted small fw-semibold d-block">Computadoras (PC / Mac)</span>
              <h4 className="fw-bold text-dark mb-0">{totalPCs}</h4>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white d-flex flex-row align-items-center gap-3">
            <div className="bg-success bg-opacity-10 p-3 rounded-4 text-success fs-3">
              <i className="bi bi-phone"></i>
            </div>
            <div>
              <span className="text-muted small fw-semibold d-block">Teléfonos / Tablets</span>
              <h4 className="fw-bold text-dark mb-0">{totalMoviles}</h4>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white d-flex flex-row align-items-center gap-3">
            <div className="bg-info bg-opacity-10 p-3 rounded-4 text-info fs-3">
              <i className="bi bi-shield-lock-fill"></i>
            </div>
            <div>
              <span className="text-muted small fw-semibold d-block">Inactividad Automática</span>
              <h4 className="fw-bold text-dark mb-0" style={{ fontSize: '1.25rem' }}>20 Minutos</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Alerta Informativa en Modo Emulación */}
      {esModoEmulacion && (
        <div className="alert alert-warning border-0 shadow-sm rounded-4 d-flex align-items-center gap-3 p-3.5 mb-4 animate__animated animate__fadeIn" style={{ background: '#fffbeb', borderLeft: '4px solid #f59e0b' }}>
          <div className="bg-warning text-dark rounded-circle p-2 d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '42px', height: '42px' }}>
            <i className="bi bi-shield-lock-fill fs-5"></i>
          </div>
          <div className="flex-grow-1">
            <h6 className="fw-bold mb-1 text-dark">Modo Virtualización Activo — Dispositivo Temporal No Vinculado</h6>
            <p className="mb-0 small text-dark text-opacity-75">
              Por directrices de privacidad y control de auditoría, las sesiones de virtualización de usuarios y roles <strong>no se graban ni se muestran como dispositivos vinculados</strong> en esta cuenta. Solo se listan los equipos físicos autorizados por el titular.
            </p>
          </div>
        </div>
      )}

      {/* Main Sessions Card */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-4 p-md-5">

          {/* Action Header */}
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 border-bottom pb-3">
            <div>
              <h4 className="fw-bold text-dark mb-1">
                <i className="bi bi-hdd-network me-2 text-primary"></i>Equipos Vinculados Actualmente
              </h4>
              <p className="text-muted small mb-0">
                Puedes dar de baja cualquier sesión si sospechas que alguien ingresó o si olvidaste cerrar tu sesión en una computadora pública.
              </p>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary rounded-pill px-3 shadow-sm hover-efecto d-flex align-items-center gap-1.5"
                onClick={() => appUser?.cedula && cargarSesiones(appUser.cedula)}
                disabled={loadingSesiones}
              >
                <i className={`bi bi-arrow-clockwise ${loadingSesiones ? 'spin-icon' : ''}`}></i>
                <span>Actualizar</span>
              </button>

              {sesiones.filter(s => s.id !== currentSessionId && s.activa).length > 0 && (
                <button
                  type="button"
                  className="btn btn-danger fw-bold rounded-pill px-4 shadow-sm hover-efecto d-flex align-items-center gap-1.5"
                  onClick={handleCerrarTodasLasDemas}
                >
                  <i className="bi bi-power"></i>
                  <span>Cerrar todas las demás sesiones</span>
                </button>
              )}
            </div>
          </div>

          {/* Session List */}
          {loadingSesiones ? (
            <div className="text-center py-5 text-muted">
              <div className="spinner-border text-primary me-2" role="status"></div>
              <p className="mt-2 mb-0 small">Sincronizando estado de dispositivos...</p>
            </div>
          ) : sesiones.length === 0 ? (
            <div className="text-center py-5 bg-light rounded-4 border border-dashed">
              <i className="bi bi-shield-check fs-1 text-primary opacity-50 d-block mb-2"></i>
              <h6 className="fw-bold text-dark mb-1">
                {esModoEmulacion ? 'Sin dispositivos físicos vinculados' : 'No hay otras sesiones registradas'}
              </h6>
              <p className="text-muted small mb-0">
                {esModoEmulacion 
                  ? 'Este usuario no tiene sesiones activas registradas en equipos físicos. (La sesión de emulación actual no se vincula por seguridad).'
                  : 'Tu cuenta solo está abierta en este dispositivo.'
                }
              </p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {sesiones.map((s) => {
                const esActual = s.id === currentSessionId;
                const esPC = s.tipo_dispositivo === 'computadora' || s.sistema_operativo.includes('Windows') || s.sistema_operativo.includes('macOS') || s.sistema_operativo.includes('Linux');
                
                return (
                  <div 
                    key={s.id} 
                    className={`p-3.5 p-md-4 rounded-4 border shadow-sm transition-all d-flex flex-wrap justify-content-between align-items-center gap-3 ${
                      esActual 
                        ? 'bg-primary bg-opacity-10 border-primary border-opacity-35' 
                        : s.activa 
                          ? 'bg-white border-light-subtle' 
                          : 'bg-light border-light-subtle opacity-75'
                    }`}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div 
                        className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm ${
                          esActual ? 'bg-primary text-white' : s.activa ? 'bg-light text-dark border' : 'bg-secondary bg-opacity-25 text-muted'
                        }`} 
                        style={{ width: '56px', height: '56px' }}
                      >
                        <i className={`bi ${esPC ? 'bi-laptop fs-3' : 'bi-phone fs-3'}`}></i>
                      </div>

                      <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                          <span className="fw-bold text-dark fs-6">{s.dispositivo_nombre || (esPC ? 'Computadora' : 'Teléfono Móvil')}</span>
                          {esActual && (
                            <span className="badge bg-success text-white rounded-pill px-2.5 py-1" style={{ fontSize: '0.78rem' }}>
                              <i className="bi bi-check-circle-fill me-1"></i> Este dispositivo (Sesión actual)
                            </span>
                          )}
                          {!esActual && s.activa && (
                            <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill px-2.5 py-1" style={{ fontSize: '0.78rem' }}>
                              <span className="spinner-grow spinner-grow-sm me-1" style={{ width: '6px', height: '6px' }}></span> En línea / Activa
                            </span>
                          )}
                          {!s.activa && (
                            <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2.5 py-1" style={{ fontSize: '0.78rem' }}>
                              Desactivada / Cerrada
                            </span>
                          )}
                        </div>
                        <div className="text-muted small d-flex flex-wrap gap-x-3 gap-y-1 align-items-center" style={{ fontSize: '0.85rem' }}>
                          <span><i className="bi bi-browser-chrome me-1 text-primary"></i>{s.navegador || 'Navegador Web'}</span>
                          <span className="text-secondary opacity-50">•</span>
                          <span><i className="bi bi-clock-history me-1 text-secondary"></i>Inicio: {formatearFecha(s.fecha_inicio)}</span>
                          <span className="text-secondary opacity-50">•</span>
                          <span><i className="bi bi-activity me-1 text-success"></i>Última actividad: {formatearFecha(s.fecha_actividad)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="ms-auto d-flex align-items-center gap-2">
                      {esActual ? (
                        <div className="text-end">
                          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-1.5 fw-bold">
                            <i className="bi bi-circle-fill text-success me-1" style={{ fontSize: '0.5rem' }}></i> En uso ahora
                          </span>
                        </div>
                      ) : s.activa ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger fw-bold rounded-pill px-3 py-1.5 shadow-sm hover-efecto"
                          onClick={() => handleToggleSesion(s.id, false)}
                          title="Desconectar este dispositivo remotamente"
                        >
                          <i className="bi bi-power me-1"></i> Cerrar Sesión
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success fw-bold rounded-pill px-3 py-1.5 shadow-sm hover-efecto"
                          onClick={() => handleToggleSesion(s.id, true)}
                          title="Permitir reconexión a este dispositivo"
                        >
                          <i className="bi bi-arrow-repeat me-1"></i> Reactivar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Security Notice Box */}
          <div className="alert alert-info border-0 shadow-sm rounded-4 mt-5 d-flex align-items-start p-4">
            <i className="bi bi-shield-lock-fill fs-3 text-primary me-3 mt-1"></i>
            <div>
              <h6 className="fw-bold text-dark mb-1">Protección y Privacidad de la Cuenta</h6>
              <p className="small text-muted mb-2">
                Si detectas un dispositivo sospechoso o desconocido en esta lista, haz clic de inmediato en <strong>"Cerrar Sesión"</strong> y dirígete a <a href="/categoria/Seguridad%20y%20Accesos/Mi%20Perfil" className="fw-bold text-primary">Mi Perfil</a> para cambiar tu contraseña.
              </p>
              <p className="small text-muted mb-0">
                La aplicación además cuenta con cierre automático tras <strong>20 minutos de inactividad</strong> y un aviso previo de 30 segundos para salvaguardar tu información.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
