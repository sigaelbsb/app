import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';

const ESTRUCTURA_ACCESOS = {
  "Dirección y Sistema": {
    "Perfil de la Escuela": [],
    "Gestión de Registros": [],
    "División Territorial": [],
    "Configuración del Sistema": ["Tarjeta: Períodos Escolares", "Tarjeta: Lapsos Académicos", "Tarjeta: Niveles Educativos"],
    "Cerebro de Sigma": [],
    "Calendario Escolar": ["Tarjeta: Calendario Oficial MPPE", "Tarjeta: Calendario Administrativo", "Tarjeta: Calendario Pedagógico", "Tarjeta: Planificador"],
    "Panel de Control": ["Ingresar en Mantenimiento"] 
  },
  "Organización Escolar": {
    "Cargos Institucionales": ["Tarjeta: Definir Cargos", "Tarjeta: Asignar Personal"],
    "Cadena Supervisoria": ["Función: Estructurar Cadena", "Función: Imprimir Organigrama"],
    "Gestión de Colectivos": [],
    "Estructura Empresa": ["Diccionario: Nómina", "Diccionario: Parentesco", "Diccionario: Condición", "Diccionario: Negocio/Filial", "Diccionario: Organización/Gerencia", "Diccionario: Localidad", "Diccionario: Condición Neuro", "Diccionario: Condición Médica", "Diccionario: Alergias"]
  },
  "Control de Estudios": {
    "Grados y Salones": [
      "Tarjeta: Ambientes y Espacios Físicos",
      "Tarjeta: Apertura de Salones",
      "Tarjeta: Configurar Grados",
      "Tarjeta: Configurar Secciones",
      "Tarjeta: Docentes Guías y Matrícula",
      "Tarjeta: Capacidad y Reportes"
    ]
  },
  "Gestión Estudiantil": {
    "Gestión de Admisiones": ["Tarjeta: Baremo y Clasificación", "Tarjeta: Auditoría Uno por Uno", "Tarjeta: Formalización de Matrícula", "Función: Enviar WhatsApp", "Función: Exportar Excel"], 
    "Gestión de Matrícula": [], 
    "Vincular Estudiante": ["Tarjeta: Registrar Vinculación", "Tarjeta: Lista de Matriculados", "Función: Descargar Ficha PDF", "Función: Exportar Ficha"],
    "Expediente Estudiantil": [], 
    "Actualización de Datos": [], 
    "Solicitud de Cupos": [], 
    "Mis Solicitudes": [], 
    "Verificaciones": ["Función: Escanear QR", "Función: Re-imprimir Comprobante"]
  },
  "Gestión Docente": {
    "Mi Expediente": ["Tarjeta: Modificar Ficha Docente"], 
    "Gestor de Expedientes": ["Tarjeta: Expedientes Activos", "Tarjeta: Registro de Docente", "Función: Vacaciones", "Función: Descargar Reporte"]
  },
  "Formación y Capacitación": {
    "Gestor de Catálogo": ["Función: Crear Cursos", "Función: Editar Cursos", "Función: Eliminar Cursos"],
    "Oferta Académica": [], 
    "Mis Certificados": [], 
    "Creador de Certificados": []
  },
  "Diseños": {
    "Galería y Plantillas": [],
    "Creador de Certificados": [],
    "Creador de Flyers": [],
    "Creador de Invitaciones": [],
    "Creador de Tapas": [],
    "Creador de Comunicados": [],
    "Creador de Cumpleaños": [],
    "Encuesta": [
      "Función: Crear y Editar Encuestas",
      "Función: Responder Encuestas",
      "Función: Ver Respuestas y Estadísticas",
      "Función: Exportar Resultados",
      "Función: Eliminar Encuestas"
    ]
  },
  "Servicios y Bienestar": {
    "Transporte Escolar": ["Tarjeta: Gestión de Rutas", "Tarjeta: Gestión de Paradas", "Tarjeta: Operación (Tracking)", "Tarjeta: Visor de Recorrido", "Función: Control Coordinación"]
  },
  "Seguridad y Accesos": {
    "Mi Perfil": [], 
    "Métodos de Acceso": [], 
    "Gestión de Usuarios": [], 
    "Roles y Privilegios": [
      "Función: Emulación de Roles"
    ], 
    "Preguntas de Seguridad": [], 
    "Auditoría del Sistema": []
  }
};

const SUPER_PODERES = { ver: true, crear: true, eliminar: true, modificar: true, masivo: true, escanear: true, imprimir: true, registrar: true, exportar: true, resetear: true };

export const RolesPrivilegios = () => {
  const navigate = useNavigate();
  const { tienePermisoEnEscuela, tienePermiso, user, loading: permLoading } = usePermisos();

  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolSeleccionado, setRolSeleccionado] = useState<any>(null);

  // Privileges matrix representation
  // We represent it as a nested state object: { lb: { [nombre]: boolean }, sb: { [nombre]: boolean } }
  const [permisosState, setPermisosState] = useState<any>({ lb: {}, sb: {} });

  // Permisos por escuela para el módulo
  const canRolesSB = tienePermisoEnEscuela('sb', 'Roles y Privilegios', 'ver');
  const canRolesLB = tienePermisoEnEscuela('lb', 'Roles y Privilegios', 'ver');
  const pRoles = canRolesSB || canRolesLB;

  const canEditRolesSB = tienePermisoEnEscuela('sb', 'Roles y Privilegios', 'crear');
  const canEditRolesLB = tienePermisoEnEscuela('lb', 'Roles y Privilegios', 'crear');
  const canEditAny = canEditRolesSB || canEditRolesLB;

  const canDeleteRolesSB = tienePermisoEnEscuela('sb', 'Roles y Privilegios', 'eliminar');
  const canDeleteRolesLB = tienePermisoEnEscuela('lb', 'Roles y Privilegios', 'eliminar');

  // Capacidad de emulación de roles
  const canEmulate = user?.rol === 'SuperAdmin' || user?.rol === 'Administrador' || tienePermiso('Función: Emulación de Roles', 'ver') || tienePermiso('Roles y Privilegios', 'ver');

  const Swal = (window as any).Swal;

  useEffect(() => {
    if (!permLoading && pRoles) {
      cargarRoles();
    }
  }, [permLoading, pRoles]);

  const cargarRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;

      const mapped = (data || []).map(r => ({
        id: r.id_usuario || r.idx || r.nombre,
        nombre: r.nombre,
        privilegios: typeof r.permisos === 'string' ? JSON.parse(r.permisos || '{}') : (r.permisos || {})
      }));

      setRoles(mapped);

      // Sincronizar rol seleccionado actual
      if (rolSeleccionado) {
        const matching = mapped.find(r => r.nombre === rolSeleccionado.nombre);
        if (matching) {
          seleccionarRol(matching);
        }
      }
    } catch (e) {
      console.error(e);
      if (Swal) Swal.fire('Error', 'Falla al cargar roles de Supabase.', 'error');
    }
    setLoading(false);
  };

  const seleccionarRol = async (r: any) => {
    setRolSeleccionado(r);

    let lbPriv: any = {};
    let sbPriv: any = {};

    const rawLb = r.privilegios?.lb || {};
    const rawSb = r.privilegios?.sb || {};

    // Map boolean values
    const mapBooleans = (raw: any, dest: any) => {
      // Check Acceso Plantel (default true if raw has any permissions or is explicitly true)
      dest['__acceso_plantel__'] = raw.hasOwnProperty('__acceso_plantel__') 
        ? !!(raw['__acceso_plantel__']?.ver || raw['__acceso_plantel__'] === true)
        : (Object.keys(raw).length > 0);

      for (const [_cat, submods] of Object.entries(ESTRUCTURA_ACCESOS)) {
        for (const [subName, subcards] of Object.entries(submods)) {
          dest[subName] = !!(raw[subName]?.ver || raw[subName] === true);
          subcards.forEach(card => {
            let val = !!(raw[card]?.ver || raw[card] === true);
            // Compatibilidad hacia atrás para nombres antiguos de encuestas:
            if (!val && card === "Función: Crear y Editar Encuestas") {
              val = !!(raw["Función: Crear Encuestas"]?.ver || raw["Función: Crear Encuestas"] === true);
            }
            if (!val && card === "Función: Ver Respuestas y Estadísticas") {
              val = !!(raw["Función: Ver Respuestas"]?.ver || raw["Función: Ver Respuestas"] === true);
            }
            dest[card] = val;
          });
        }
      }
    };

    mapBooleans(rawLb, lbPriv);
    mapBooleans(rawSb, sbPriv);

    // Sincronización especial para el rol 'Invitado' con ajustes_globales
    if (r.nombre === 'Invitado') {
      try {
        const { data: ajustes } = await supabase
          .from('ajustes_globales')
          .select('clave, valor')
          .in('clave', ['bloquear_invitados_sb', 'bloquear_invitados_lb', 'bloquear_invitados']);
        
        if (ajustes) {
          const guestSB = ajustes.find(x => x.clave === 'bloquear_invitados_sb');
          const guestLB = ajustes.find(x => x.clave === 'bloquear_invitados_lb');
          const guestGlobal = ajustes.find(x => x.clave === 'bloquear_invitados');

          if (guestSB) {
            sbPriv['__acceso_plantel__'] = guestSB.valor !== 'true';
          } else if (guestGlobal) {
            sbPriv['__acceso_plantel__'] = guestGlobal.valor !== 'true';
          }

          if (guestLB) {
            lbPriv['__acceso_plantel__'] = guestLB.valor !== 'true';
          } else if (guestGlobal) {
            lbPriv['__acceso_plantel__'] = guestGlobal.valor !== 'true';
          }
        }
      } catch (err) {}
    }

    setPermisosState({ lb: lbPriv, sb: sbPriv });
  };

  const handleCheckboxChange = (escuela: 'lb' | 'sb', item: string, isParent: boolean, parentName?: string, subcards?: string[]) => {
    setPermisosState((prev: any) => {
      const copyEsc = { ...prev[escuela] };
      const newValue = !copyEsc[item];
      copyEsc[item] = newValue;

      if (isParent) {
        // Cascada hacia abajo: marcar/desmarcar todos los hijos
        if (subcards) {
          subcards.forEach(child => {
            copyEsc[child] = newValue;
          });
        }
      } else if (parentName) {
        // Cascada hacia arriba: si se marca un hijo, forzar a marcar el padre
        if (newValue) {
          copyEsc[parentName] = true;
        }
      }

      return {
        ...prev,
        [escuela]: copyEsc
      };
    });
  };

  const handleToggleTodos = (escuela: 'lb' | 'sb', checked: boolean) => {
    setPermisosState((prev: any) => {
      const copyEsc = { ...prev[escuela] };
      
      copyEsc['__acceso_plantel__'] = checked;

      for (const [_cat, submods] of Object.entries(ESTRUCTURA_ACCESOS)) {
        for (const [subName, subcards] of Object.entries(submods)) {
          copyEsc[subName] = checked;
          subcards.forEach(card => {
            copyEsc[card] = checked;
          });
        }
      }

      return {
        ...prev,
        [escuela]: copyEsc
      };
    });
  };

  const isTodosMarcados = (escuela: 'lb' | 'sb') => {
    const list = permisosState[escuela];
    if (Object.keys(list).length === 0) return false;

    // Check Acceso Plantel
    if (!list['__acceso_plantel__']) return false;

    for (const [_cat, submods] of Object.entries(ESTRUCTURA_ACCESOS)) {
      for (const [subName, subcards] of Object.entries(submods)) {
        if (!list[subName]) return false;
        for (let card of subcards) {
          if (!list[card]) return false;
        }
      }
    }
    return true;
  };

  const guardarPrivilegios = async () => {
    if (!rolSeleccionado) return;

    if (!canEditAny) {
      if (Swal) Swal.fire('Error', 'No tiene permisos para guardar o editar privilegios.', 'error');
      return;
    }

    setLoading(true);
    try {
      // Build permission payload matching the standard structure
      const buildEscPayload = (esc: 'lb' | 'sb') => {
        const raw = permisosState[esc];
        const dest: any = {};

        // Acceso Plantel
        dest['__acceso_plantel__'] = { ver: !!raw['__acceso_plantel__'] };

        for (const [_cat, submods] of Object.entries(ESTRUCTURA_ACCESOS)) {
          for (const [subName, subcards] of Object.entries(submods)) {
            if (raw[subName]) {
              dest[subName] = { ...SUPER_PODERES };
            }
            subcards.forEach(card => {
              if (raw[card]) {
                dest[card] = { ...SUPER_PODERES };
                if (card === "Función: Crear y Editar Encuestas") {
                  dest["Función: Crear Encuestas"] = { ...SUPER_PODERES };
                }
                if (card === "Función: Ver Respuestas y Estadísticas") {
                  dest["Función: Ver Respuestas"] = { ...SUPER_PODERES };
                }
              }
            });
          }
        }
        return dest;
      };

      const finalPermisos = {
        lb: canEditRolesLB ? buildEscPayload('lb') : (rolSeleccionado.privilegios?.lb || {}),
        sb: canEditRolesSB ? buildEscPayload('sb') : (rolSeleccionado.privilegios?.sb || {})
      };

      const { error } = await supabase
        .from('roles')
        .update({ permisos: finalPermisos })
        .eq('nombre', rolSeleccionado.nombre);

      if (error) throw error;

      // Si el rol es 'Invitado', sincronizar directamente con ajustes_globales para compatibilidad inmediata con Auth
      if (rolSeleccionado.nombre === 'Invitado') {
        const isSbBlocked = !permisosState.sb['__acceso_plantel__'];
        const isLbBlocked = !permisosState.lb['__acceso_plantel__'];
        const isGlobalBlocked = isSbBlocked && isLbBlocked;

        await supabase
          .from('ajustes_globales')
          .upsert([
            { clave: 'bloquear_invitados_sb', valor: String(isSbBlocked), actualizado_en: new Date().toISOString() },
            { clave: 'bloquear_invitados_lb', valor: String(isLbBlocked), actualizado_en: new Date().toISOString() },
            { clave: 'bloquear_invitados', valor: String(isGlobalBlocked), actualizado_en: new Date().toISOString() }
          ], { onConflict: 'clave' });
      }

      auditar('Roles y Privilegios', 'Actualizar Privilegios', `Accesos y estado por plantel actualizados para rol: ${rolSeleccionado.nombre}`);

      if (Swal) {
        Swal.fire('¡Éxito!', 'Los accesos y privilegios se han guardado correctamente.', 'success').then(() => {
          // Refresh current user's locally stored session permissions if modified
          const stored = localStorage.getItem('usuario_sigae');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.rol === rolSeleccionado.nombre) {
              window.location.reload();
            }
          }
        });
      } else {
        const stored = localStorage.getItem('usuario_sigae');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.rol === rolSeleccionado.nombre) {
            window.location.reload();
          }
        }
      }

      cargarRoles();
    } catch (e) {
      console.error(e);
      if (Swal) Swal.fire('Error', 'No se pudieron guardar los privilegios.', 'error');
    }
    setLoading(false);
  };

  const handleToggleEstadoRolEscuelaDirecto = async (e: React.MouseEvent, rolObj: any, escuela: 'sb' | 'lb', forzarEstado?: boolean) => {
    e.stopPropagation();

    if (!canEditAny) {
      if (Swal) Swal.fire('Acceso Denegado', 'No posee permisos para editar el estado de roles.', 'error');
      return;
    }

    const escuelaNombre = escuela === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar';
    const rawEsc = rolObj.privilegios?.[escuela] || {};
    const estadoActual = rawEsc.hasOwnProperty('__acceso_plantel__')
      ? !!(rawEsc['__acceso_plantel__']?.ver || rawEsc['__acceso_plantel__'] === true)
      : (Object.keys(rawEsc).length > 0);

    const nuevoEstado = forzarEstado !== undefined ? forzarEstado : !estadoActual;

    setLoading(true);
    try {
      const currentPrivs = JSON.parse(JSON.stringify(rolObj.privilegios || {}));
      if (!currentPrivs[escuela]) currentPrivs[escuela] = {};
      currentPrivs[escuela]['__acceso_plantel__'] = { ver: nuevoEstado };

      const { error } = await supabase
        .from('roles')
        .update({ permisos: currentPrivs })
        .eq('nombre', rolObj.nombre);

      if (error) throw error;

      // Si es el rol Invitado, sincronizar también en ajustes_globales para Auth
      if (rolObj.nombre === 'Invitado') {
        const clave = escuela === 'sb' ? 'bloquear_invitados_sb' : 'bloquear_invitados_lb';
        const otherEsc = escuela === 'sb' ? 'lb' : 'sb';
        const otherVal = !currentPrivs[otherEsc]?.['__acceso_plantel__']?.ver;
        const isThisBlocked = !nuevoEstado;
        const isGlobalBlocked = isThisBlocked && otherVal;

        await supabase
          .from('ajustes_globales')
          .upsert([
            { clave, valor: String(isThisBlocked), actualizado_en: new Date().toISOString() },
            { clave: 'bloquear_invitados', valor: String(isGlobalBlocked), actualizado_en: new Date().toISOString() }
          ], { onConflict: 'clave' });
      }

      auditar(
        'Roles y Privilegios', 
        nuevoEstado ? 'Habilitar Rol en Plantel' : 'Bloquear Rol en Plantel',
        `Se cambió el acceso del rol "${rolObj.nombre}" en ${escuelaNombre} a: ${nuevoEstado ? 'PERMITIDO' : 'BLOQUEADO'}`
      );

      if (Swal) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: nuevoEstado ? 'success' : 'warning',
          title: `${rolObj.nombre} en ${escuela === 'sb' ? 'Santa Bárbara' : 'Libertador B.'}: ${nuevoEstado ? 'HABILITADO' : 'BLOQUEADO'}`,
          showConfirmButton: false,
          timer: 2000
        });
      }

      await cargarRoles();
    } catch (err) {
      console.error(err);
      if (Swal) Swal.fire('Error', 'No se pudo actualizar el estado del rol.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAmbasEscuelasDirecto = async (e: React.MouseEvent, rolObj: any) => {
    e.stopPropagation();

    if (!canEditAny) {
      if (Swal) Swal.fire('Acceso Denegado', 'No posee permisos para editar roles.', 'error');
      return;
    }

    const rawSb = rolObj.privilegios?.sb || {};
    const rawLb = rolObj.privilegios?.lb || {};

    const sbActivo = rawSb.hasOwnProperty('__acceso_plantel__')
      ? !!(rawSb['__acceso_plantel__']?.ver || rawSb['__acceso_plantel__'] === true)
      : (Object.keys(rawSb).length > 0);

    const lbActivo = rawLb.hasOwnProperty('__acceso_plantel__')
      ? !!(rawLb['__acceso_plantel__']?.ver || rawLb['__acceso_plantel__'] === true)
      : (Object.keys(rawLb).length > 0);

    // Si ambas están activas -> desactivar ambas. En caso contrario -> activar ambas
    const nuevoEstado = !(sbActivo && lbActivo);

    setLoading(true);
    try {
      const currentPrivs = JSON.parse(JSON.stringify(rolObj.privilegios || {}));
      if (!currentPrivs.sb) currentPrivs.sb = {};
      if (!currentPrivs.lb) currentPrivs.lb = {};

      currentPrivs.sb['__acceso_plantel__'] = { ver: nuevoEstado };
      currentPrivs.lb['__acceso_plantel__'] = { ver: nuevoEstado };

      const { error } = await supabase
        .from('roles')
        .update({ permisos: currentPrivs })
        .eq('nombre', rolObj.nombre);

      if (error) throw error;

      // Si es el rol Invitado, sincronizar también en ajustes_globales para Auth
      if (rolObj.nombre === 'Invitado') {
        const isBlocked = !nuevoEstado;
        await supabase
          .from('ajustes_globales')
          .upsert([
            { clave: 'bloquear_invitados_sb', valor: String(isBlocked), actualizado_en: new Date().toISOString() },
            { clave: 'bloquear_invitados_lb', valor: String(isBlocked), actualizado_en: new Date().toISOString() },
            { clave: 'bloquear_invitados', valor: String(isBlocked), actualizado_en: new Date().toISOString() }
          ], { onConflict: 'clave' });
      }

      auditar(
        'Roles y Privilegios', 
        nuevoEstado ? 'Habilitar Rol en Ambas Escuelas' : 'Bloquear Rol en Ambas Escuelas',
        `Se cambió el acceso del rol "${rolObj.nombre}" en AMBAS escuelas a: ${nuevoEstado ? 'HABILITADO' : 'BLOQUEADO'}`
      );

      if (Swal) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: nuevoEstado ? 'success' : 'warning',
          title: `${rolObj.nombre} en AMBAS escuelas: ${nuevoEstado ? 'HABILITADO' : 'BLOQUEADO'}`,
          showConfirmButton: false,
          timer: 2000
        });
      }

      await cargarRoles();
    } catch (err) {
      console.error(err);
      if (Swal) Swal.fire('Error', 'No se pudo actualizar el estado del rol.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarEmulacion = async (e: React.MouseEvent, rolObjetivo: string) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) return;

    const currentSchool = (localStorage.getItem('sigae_escuela_codigo') as 'sb' | 'lb') || 'sb';

    if (Swal) {
      const { value: formValues } = await Swal.fire({
        title: `<div class="d-flex align-items-center justify-content-center gap-2 text-dark"><i class="bi bi-person-bounding-box text-warning"></i> <span>Emular Rol: ${rolObjetivo}</span></div>`,
        html: `
          <div class="text-start mb-3">
            <p class="text-muted small">
              Vas a ingresar en <strong>Modo Emulación</strong> para visualizar y navegar el sistema exactamente como lo experimenta un usuario con rol <strong>${rolObjetivo}</strong>.
            </p>
            <label class="form-label fw-bold small text-dark"><i class="bi bi-building me-1"></i>Selecciona la Institución para la prueba:</label>
            <select id="swal-escuela-emulacion" class="form-select rounded-3 py-2">
              <option value="sb" ${currentSchool === 'sb' ? 'selected' : ''}>U.E. Santa Bárbara</option>
              <option value="lb" ${currentSchool === 'lb' ? 'selected' : ''}>U.E. Libertador Bolívar</option>
            </select>
          </div>
          <div class="alert alert-warning text-start small mb-0 py-2 border-0 rounded-3">
            <i class="bi bi-shield-check me-1"></i> Tu sesión real de administrador se mantendrá a salvo y podrás regresar en cualquier momento pulsando el botón flotante en la barra superior.
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="bi bi-play-circle-fill me-1"></i> Iniciar Emulación',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d97706',
        cancelButtonColor: '#64748b',
        preConfirm: () => {
          const selectEl = document.getElementById('swal-escuela-emulacion') as HTMLSelectElement;
          return {
            escuela: selectEl ? (selectEl.value as 'sb' | 'lb') : currentSchool
          };
        }
      });

      if (!formValues) return;

      const targetEscuela = formValues.escuela;
      const targetEscuelaNombre = targetEscuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';

      const yaEmulando = localStorage.getItem('sigae_usuario_original_admin');
      if (!yaEmulando) {
        localStorage.setItem('sigae_usuario_original_admin', JSON.stringify(user));
      }

      const usuarioEmulado = {
        ...user,
        rol: rolObjetivo,
        id_escuela: targetEscuela,
        nombre_escuela: targetEscuelaNombre,
        es_emulacion: true,
        rol_real: user.rol,
        nombre_real: user.nombre
      };

      localStorage.setItem('usuario_sigae', JSON.stringify(usuarioEmulado));
      localStorage.setItem('sigae_escuela_codigo', targetEscuela);
      localStorage.setItem('sigae_escuela_activa', targetEscuelaNombre);
      sessionStorage.setItem('sigae_emulacion_activa', 'true');

      localStorage.removeItem('sigae_cache_permisos');
      localStorage.removeItem('sigae_cache_full_permisos');

      auditar('Roles y Privilegios', 'Iniciar Emulación de Rol', `El usuario ${user.nombre} (${user.rol}) inició emulación del rol: "${rolObjetivo}" en ${targetEscuelaNombre}`);

      window.location.href = '/';
    }
  };

  const crearRol = () => {
    if (!Swal) return;

    if (!canEditAny) {
      Swal.fire('Error', 'No tiene suficientes privilegios para crear roles.', 'error');
      return;
    }

    Swal.fire({
      title: 'Nuevo Rol Global',
      input: 'text',
      inputPlaceholder: 'Nombre del Rol (Ej. Coordinador)',
      showCancelButton: true,
      confirmButtonText: 'Crear Rol',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0066FF',
      preConfirm: (valor: string) => {
        if (!valor || !valor.trim()) {
          Swal.showValidationMessage('El nombre es obligatorio');
          return false;
        }
        return valor.trim();
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase
            .from('roles')
            .insert([{ 
              nombre: result.value, 
              permisos: { lb: {}, sb: {} },
              id_escuela: 'global' 
            }]);

          if (error) throw error;

          Swal.fire('¡Rol Creado!', `El rol '${result.value}' ha sido creado exitosamente.`, 'success');
          auditar('Roles y Privilegios', 'Nuevo Rol', `Se creó el rol de acceso global: ${result.value}`);
          cargarRoles();
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo crear el rol.', 'error');
        }
        setLoading(false);
      }
    });
  };

  const eliminarRolActual = () => {
    if (!rolSeleccionado || !Swal) return;

    // Se requiere permiso de eliminación en al menos un plantel para borrar roles
    const hasDeletePermission = canDeleteRolesSB || canDeleteRolesLB;
    if (!hasDeletePermission) {
      Swal.fire('Error', 'No tiene suficientes privilegios para eliminar roles.', 'error');
      return;
    }

    Swal.fire({
      title: `¿Eliminar Rol ${rolSeleccionado.nombre}?`,
      text: "Los usuarios con este rol perderán todos sus accesos de forma inmediata.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (res: any) => {
      if (res.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase
            .from('roles')
            .delete()
            .eq('nombre', rolSeleccionado.nombre);

          if (error) throw error;

          Swal.fire('¡Eliminado!', 'El rol ha sido eliminado permanentemente.', 'success');
          auditar('Roles y Privilegios', 'Eliminar Rol', `Se eliminó el rol: ${rolSeleccionado.nombre}`);
          setRolSeleccionado(null);
          cargarRoles();
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo eliminar el rol.', 'error');
        }
        setLoading(false);
      }
    });
  };

  if (permLoading || (loading && roles.length === 0)) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5 h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!pRoles) {
    return (
      <div className="col-12 text-center py-5 mt-4">
        <div className="bg-light d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm border" style={{ width: '100px', height: '100px' }}>
          <i className="bi bi-shield-lock-fill text-muted" style={{ fontSize: '3.5rem' }}></i>
        </div>
        <h4 className="text-dark fw-bold mb-2">Área Restringida</h4>
        <p className="text-muted mb-0">No tienes permisos asignados para visualizar este módulo.</p>
      </div>
    );
  }

  return (
    <div className="row g-4 container-fluid p-0 animate__animated animate__fadeIn">
      {/* Banner */}
      <div className="col-12 animate__animated animate__fadeInDown">
        <div 
          className="banner-modulo p-4 p-md-5 text-white shadow-sm" 
          style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #1e1b4b 100%)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
        >
          <div className="burbuja-3d burbuja-1" style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.15)', position: 'absolute', top: '-50px', right: '-20px', borderRadius: '50%' }}></div>
          <div className="burbuja-3d burbuja-2" style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.08)', position: 'absolute', bottom: '-20px', left: '20px', borderRadius: '50%' }}></div>
          <div className="row align-items-center position-relative z-1">
            <div className="col-12 text-center text-md-start">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <span className="badge bg-white text-info px-3 py-2 shadow-sm fw-bold" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>
                  <i className="bi bi-shield-lock-fill me-1"></i> SEGURIDAD Y ACCESOS
                </span>
                <button 
                  onClick={() => navigate('/categoria/Seguridad%20y%20Accesos')} 
                  className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                >
                  <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
                </button>
              </div>
              <h1 className="fw-bolder mb-2 text-white" style={{ fontSize: '2.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                <i className="bi bi-person-lines-fill me-3"></i>Roles y Privilegios
              </h1>
              <p className="mb-0 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Controla a qué pantallas del sistema tiene acceso cada rol.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 animate__animated animate__fadeInUp align-items-start mt-2">
        {/* Left Side List */}
        <div className="col-md-5 col-xl-4">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center rounded-top-4">
              <div>
                <h5 className="mb-0 fw-bold text-dark fs-6">Niveles de Acceso y Estado</h5>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Activa o desactiva el ingreso por escuela</small>
              </div>
              <button 
                className="btn btn-sm text-white fw-bold shadow-sm hover-efecto" 
                style={{ backgroundColor: '#0ea5e9' }}
                onClick={crearRol} 
                title="Nuevo Rol"
              >
                <i className="bi bi-plus-lg"></i>
              </button>
            </div>
            <div className="card-body p-0" style={{ maxHeight: '560px', overflowY: 'auto' }}>
              <div className="list-group list-group-flush p-2">
                {roles.length === 0 ? (
                  <div className="p-4 text-center text-muted">
                    No hay roles creados.
                  </div>
                ) : (
                  roles.map(r => {
                    const esActivo = rolSeleccionado && rolSeleccionado.nombre === r.nombre;
                    const rawSb = r.privilegios?.sb || {};
                    const rawLb = r.privilegios?.lb || {};

                    const sbActivo = rawSb.hasOwnProperty('__acceso_plantel__')
                      ? !!(rawSb['__acceso_plantel__']?.ver || rawSb['__acceso_plantel__'] === true)
                      : (Object.keys(rawSb).length > 0);

                    const lbActivo = rawLb.hasOwnProperty('__acceso_plantel__')
                      ? !!(rawLb['__acceso_plantel__']?.ver || rawLb['__acceso_plantel__'] === true)
                      : (Object.keys(rawLb).length > 0);

                    const ambasActivas = sbActivo && lbActivo;
                    const ambasBloqueadas = !sbActivo && !lbActivo;

                    return (
                      <div 
                        key={r.nombre}
                        onClick={() => seleccionarRol(r)}
                        className={`p-3 border d-flex flex-column gap-2 mb-2 rounded-3 hover-efecto cursor-pointer transition-all ${esActivo ? 'bg-light border-primary shadow-sm' : 'bg-white border-light'}`}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Cabecera del Rol */}
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center">
                            <div className={`p-2 rounded-circle me-2.5 border shadow-sm ${esActivo ? 'bg-primary text-white' : 'bg-white text-primary'}`}>
                              <i className="bi bi-person-badge fs-5"></i>
                            </div>
                            <div>
                              <div className="fw-bold text-dark fs-6 mb-0">{r.nombre}</div>
                              <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                                {ambasActivas ? '● Activo en ambas escuelas' : ambasBloqueadas ? '● Bloqueado globalmente' : '● Acceso parcial'}
                              </small>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-1">
                            {canEmulate && (
                              <button
                                type="button"
                                onClick={(e) => handleIniciarEmulacion(e, r.nombre)}
                                className="btn btn-xs rounded-pill px-2 py-0.5 fw-bold d-flex align-items-center gap-1 shadow-xs hover-efecto"
                                style={{ backgroundColor: '#fef3c7', borderColor: '#fde68a', color: '#92400e', fontSize: '0.68rem' }}
                                title={`Emular y probar vista del rol ${r.nombre}`}
                              >
                                <i className="bi bi-person-bounding-box text-warning"></i>
                                <span>Emular</span>
                              </button>
                            )}
                            {esActivo && (
                              <span className="badge bg-primary bg-opacity-10 text-primary fw-bold" style={{ fontSize: '0.7rem' }}>
                                Seleccionado
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Fila de Controles de Activación / Desactivación en Escuelas */}
                        <div className="d-flex align-items-center justify-content-between pt-2 border-top border-light gap-1">
                          {/* Toggle SB */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleEstadoRolEscuelaDirecto(e, r, 'sb')}
                            className={`btn btn-xs rounded-pill px-2 py-1 fw-bold d-flex align-items-center gap-1 border transition-all ${
                              sbActivo 
                                ? 'btn-success text-white shadow-xs' 
                                : 'btn-light border-danger text-danger bg-danger bg-opacity-10'
                            }`}
                            style={{ fontSize: '0.68rem' }}
                            title={sbActivo ? 'Acceso PERMITIDO a Santa Bárbara (Click para Bloquear)' : 'Acceso BLOQUEADO a Santa Bárbara (Click para Activar)'}
                            disabled={!canEditRolesSB}
                          >
                            <i className={`bi ${sbActivo ? 'bi-check-circle-fill' : 'bi-slash-circle-fill'}`}></i>
                            <span>SB: {sbActivo ? 'Activo' : 'Bloqueado'}</span>
                          </button>

                          {/* Toggle LB */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleEstadoRolEscuelaDirecto(e, r, 'lb')}
                            className={`btn btn-xs rounded-pill px-2 py-1 fw-bold d-flex align-items-center gap-1 border transition-all ${
                              lbActivo 
                                ? 'btn-primary text-white shadow-xs' 
                                : 'btn-light border-danger text-danger bg-danger bg-opacity-10'
                            }`}
                            style={{ fontSize: '0.68rem' }}
                            title={lbActivo ? 'Acceso PERMITIDO a Libertador Bolívar (Click para Bloquear)' : 'Acceso BLOQUEADO a Libertador Bolívar (Click para Activar)'}
                            disabled={!canEditRolesLB}
                          >
                            <i className={`bi ${lbActivo ? 'bi-check-circle-fill' : 'bi-slash-circle-fill'}`}></i>
                            <span>LB: {lbActivo ? 'Activo' : 'Bloqueado'}</span>
                          </button>

                          {/* Toggle Ambas Escuelas */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleAmbasEscuelasDirecto(e, r)}
                            className={`btn btn-xs rounded-pill px-2 py-1 fw-bold d-flex align-items-center gap-1 border transition-all ${
                              ambasActivas
                                ? 'btn-dark text-white'
                                : ambasBloqueadas
                                  ? 'btn-outline-secondary text-muted'
                                  : 'btn-outline-warning text-dark'
                            }`}
                            style={{ fontSize: '0.67rem' }}
                            title={ambasActivas ? 'Activo en Ambas (Click para Bloquear en Ambas)' : 'Click para Activar en Ambas Escuelas'}
                            disabled={!canEditAny}
                          >
                            <i className="bi bi-buildings"></i>
                            <span>{ambasActivas ? 'Ambas ON' : ambasBloqueadas ? 'Ambas OFF' : 'Ambas'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Matrix */}
        <div className="col-md-7 col-xl-8">
          {rolSeleccionado ? (
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-bottom p-4 rounded-top-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <h4 className="mb-0 fw-bold text-dark">{rolSeleccionado.nombre}</h4>
                    <small className="text-muted">Activa o desactiva los submódulos a los que este rol puede acceder.</small>
                  </div>
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    {canEmulate && (
                      <button 
                        type="button"
                        className="btn btn-warning btn-sm fw-bold px-3 rounded-pill shadow-sm hover-efecto text-dark" 
                        style={{ backgroundColor: '#f59e0b', borderColor: '#d97706' }}
                        onClick={(e) => handleIniciarEmulacion(e, rolSeleccionado.nombre)}
                        title="Probar cómo ve la aplicación este rol"
                      >
                        <i className="bi bi-person-bounding-box me-1.5"></i>Probar / Emular este Rol
                      </button>
                    )}
                    <button 
                      className="btn btn-outline-danger btn-sm rounded-pill fw-bold px-3 shadow-sm" 
                      onClick={eliminarRolActual}
                    >
                      <i className="bi bi-trash3-fill me-1"></i>Borrar Rol
                    </button>
                    <button 
                      className="btn btn-primary btn-sm fw-bold px-4 rounded-pill shadow-sm hover-efecto" 
                      style={{ backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' }}
                      onClick={guardarPrivilegios}
                    >
                      <i className="bi bi-floppy-fill me-2"></i>Guardar Privilegios
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="card-body p-4 bg-light rounded-bottom-4">
                <div className="row g-4">
                  {/* UE Libertador Bolívar Panel */}
                  {canRolesLB && (
                    <div className={canRolesSB ? "col-lg-6 col-12" : "col-12"}>
                      <div className="card border-0 shadow-sm rounded-4 h-100 border-top border-primary border-5">
                        <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center rounded-top-4">
                          <h6 className="mb-0 fw-bold text-primary"><i className="bi bi-building me-2"></i>UE Libertador Bolívar</h6>
                          <div className="form-check form-switch m-0">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              id="chk-marcar-todos-lb"
                              checked={isTodosMarcados('lb')}
                              onChange={(e) => handleToggleTodos('lb', e.target.checked)}
                              style={{ cursor: 'pointer' }}
                              disabled={!canEditRolesLB}
                            />
                            <label className="form-check-label small fw-bold text-dark ms-1 mt-1" htmlFor="chk-marcar-todos-lb" style={{ cursor: 'pointer' }}>Otorgar Todo</label>
                          </div>
                        </div>
                        
                        <div className="card-body p-3 bg-light">
                          {/* Tarjeta Maestra de Activación / Bloqueo del Rol en este Plantel */}
                          <div className={`card border shadow-sm rounded-4 mb-3 p-3 transition-all ${permisosState.lb['__acceso_plantel__'] ? 'border-success bg-white' : 'border-danger bg-danger bg-opacity-10'}`}>
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                              <div className="d-flex align-items-center gap-3">
                                <div className={`p-2.5 rounded-circle ${permisosState.lb['__acceso_plantel__'] ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-20 text-danger'}`}>
                                  <i className={`bi ${permisosState.lb['__acceso_plantel__'] ? 'bi-shield-check' : 'bi-shield-slash-fill'} fs-4`}></i>
                                </div>
                                <div>
                                  <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <h6 className="mb-0 fw-bold text-dark">
                                      Estado en U.E. Libertador Bolívar
                                    </h6>
                                    <span className={`badge rounded-pill px-2.5 py-1 fw-bold ${permisosState.lb['__acceso_plantel__'] ? 'bg-success text-white' : 'bg-danger text-white'}`} style={{ fontSize: '0.72rem' }}>
                                      {permisosState.lb['__acceso_plantel__'] ? '● ROL HABILITADO' : '● ROL BLOQUEADO'}
                                    </span>
                                  </div>
                                  <small className="text-muted d-block mt-0.5" style={{ fontSize: '0.78rem' }}>
                                    {permisosState.lb['__acceso_plantel__']
                                      ? `El rol "${rolSeleccionado?.nombre}" tiene permitido el acceso a este plantel.`
                                      : `Acceso restringido: Los usuarios con rol "${rolSeleccionado?.nombre}" no podrán operar en este plantel.`}
                                  </small>
                                </div>
                              </div>
                              <div className="form-check form-switch fs-4 m-0">
                                <input 
                                  className="form-check-input hover-mano" 
                                  type="checkbox"
                                  role="switch"
                                  checked={!!permisosState.lb['__acceso_plantel__']}
                                  onChange={() => handleCheckboxChange('lb', '__acceso_plantel__', false)}
                                  disabled={!canEditRolesLB}
                                  title={permisosState.lb['__acceso_plantel__'] ? 'Click para bloquear este rol en este plantel' : 'Click para activar este rol en este plantel'}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Contenedor de Módulos (Atenuado si el rol está bloqueado) */}
                          <div style={{ opacity: permisosState.lb['__acceso_plantel__'] ? 1 : 0.55, transition: 'opacity 0.2s ease-in-out' }}>
                            {Object.entries(ESTRUCTURA_ACCESOS).map(([categoria, submods]) => (
                              <div key={categoria} className="card border-0 shadow-sm rounded-4 mb-3">
                                <div className="card-header text-white py-2 rounded-top-4 bg-primary">
                                  <h6 className="mb-0 fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>
                                    <i className="bi bi-folder-fill text-warning me-2"></i>{categoria}
                                  </h6>
                                </div>
                                <div className="card-body p-2 bg-white rounded-bottom-4">
                                  <div className="row g-2">
                                    {Object.entries(submods).map(([subName, subcards]) => (
                                      <div key={subName} className="col-12">
                                        <div className="p-2 border rounded-2 border-light">
                                          <div className="d-flex justify-content-between align-items-center">
                                            <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                                              <i className="bi bi-box me-2 text-primary"></i>{subName}
                                            </div>
                                            <div className="form-check form-switch m-0">
                                              <input 
                                                className="form-check-input" 
                                                type="checkbox"
                                                checked={!!permisosState.lb[subName]}
                                                onChange={() => handleCheckboxChange('lb', subName, true, undefined, subcards)}
                                                disabled={!canEditRolesLB || !permisosState.lb['__acceso_plantel__']}
                                              />
                                            </div>
                                          </div>

                                          {subcards.length > 0 && (
                                            <div className="row g-1 mt-2 ps-3 border-start ms-1 border-primary border-opacity-25 animate__animated animate__fadeIn">
                                              {subcards.map(card => (
                                                <div key={card} className="col-12">
                                                  <div className="d-flex justify-content-between align-items-center bg-light p-1 rounded">
                                                    <span className="small fw-bold text-muted text-truncate" style={{ fontSize: '0.75rem' }} title={card}>
                                                      <i className="bi bi-window-stack me-1 text-secondary"></i>
                                                      {card.replace('Tarjeta: ', '').replace('Función: ', '').replace('Diccionario: ', '')}
                                                    </span>
                                                    <div className="form-check form-switch m-0">
                                                      <input 
                                                        className="form-check-input" 
                                                        type="checkbox"
                                                        checked={!!permisosState.lb[card]}
                                                        onChange={() => handleCheckboxChange('lb', card, false, subName)}
                                                        disabled={!canEditRolesLB || !permisosState.lb['__acceso_plantel__']}
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* UE Santa Bárbara Panel */}
                  {canRolesSB && (
                    <div className={canRolesLB ? "col-lg-6 col-12" : "col-12"}>
                      <div className="card border-0 shadow-sm rounded-4 h-100 border-top border-success border-5">
                        <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center rounded-top-4">
                          <h6 className="mb-0 fw-bold text-success"><i className="bi bi-building me-2"></i>UE Santa Bárbara</h6>
                          <div className="form-check form-switch m-0">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              id="chk-marcar-todos-sb"
                              checked={isTodosMarcados('sb')}
                              onChange={(e) => handleToggleTodos('sb', e.target.checked)}
                              style={{ cursor: 'pointer' }}
                              disabled={!canEditRolesSB || !permisosState.sb['__acceso_plantel__']}
                            />
                            <label className="form-check-label small fw-bold text-dark ms-1 mt-1" htmlFor="chk-marcar-todos-sb" style={{ cursor: 'pointer' }}>Otorgar Todo</label>
                          </div>
                        </div>
                        
                        <div className="card-body p-3 bg-light">
                          {/* Tarjeta Maestra de Activación / Bloqueo del Rol en este Plantel */}
                          <div className={`card border shadow-sm rounded-4 mb-3 p-3 transition-all ${permisosState.sb['__acceso_plantel__'] ? 'border-success bg-white' : 'border-danger bg-danger bg-opacity-10'}`}>
                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                              <div className="d-flex align-items-center gap-3">
                                <div className={`p-2.5 rounded-circle ${permisosState.sb['__acceso_plantel__'] ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-20 text-danger'}`}>
                                  <i className={`bi ${permisosState.sb['__acceso_plantel__'] ? 'bi-shield-check' : 'bi-shield-slash-fill'} fs-4`}></i>
                                </div>
                                <div>
                                  <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <h6 className="mb-0 fw-bold text-dark">
                                      Estado en U.E. Santa Bárbara
                                    </h6>
                                    <span className={`badge rounded-pill px-2.5 py-1 fw-bold ${permisosState.sb['__acceso_plantel__'] ? 'bg-success text-white' : 'bg-danger text-white'}`} style={{ fontSize: '0.72rem' }}>
                                      {permisosState.sb['__acceso_plantel__'] ? '● ROL HABILITADO' : '● ROL BLOQUEADO'}
                                    </span>
                                  </div>
                                  <small className="text-muted d-block mt-0.5" style={{ fontSize: '0.78rem' }}>
                                    {permisosState.sb['__acceso_plantel__']
                                      ? `El rol "${rolSeleccionado?.nombre}" tiene permitido el acceso a este plantel.`
                                      : `Acceso restringido: Los usuarios con rol "${rolSeleccionado?.nombre}" no podrán operar en este plantel.`}
                                  </small>
                                </div>
                              </div>
                              <div className="form-check form-switch fs-4 m-0">
                                <input 
                                  className="form-check-input hover-mano" 
                                  type="checkbox"
                                  role="switch"
                                  checked={!!permisosState.sb['__acceso_plantel__']}
                                  onChange={() => handleCheckboxChange('sb', '__acceso_plantel__', false)}
                                  disabled={!canEditRolesSB}
                                  title={permisosState.sb['__acceso_plantel__'] ? 'Click para bloquear este rol en este plantel' : 'Click para activar este rol en este plantel'}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Contenedor de Módulos (Atenuado si el rol está bloqueado) */}
                          <div style={{ opacity: permisosState.sb['__acceso_plantel__'] ? 1 : 0.55, transition: 'opacity 0.2s ease-in-out' }}>
                            {Object.entries(ESTRUCTURA_ACCESOS).map(([categoria, submods]) => (
                              <div key={categoria} className="card border-0 shadow-sm rounded-4 mb-3">
                                <div className="card-header text-white py-2 rounded-top-4 bg-success">
                                  <h6 className="mb-0 fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>
                                    <i className="bi bi-folder-fill text-warning me-2"></i>{categoria}
                                  </h6>
                                </div>
                                <div className="card-body p-2 bg-white rounded-bottom-4">
                                  <div className="row g-2">
                                    {Object.entries(submods).map(([subName, subcards]) => (
                                      <div key={subName} className="col-12">
                                        <div className="p-2 border rounded-2 border-light">
                                          <div className="d-flex justify-content-between align-items-center">
                                            <div className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>
                                              <i className="bi bi-box me-2 text-success"></i>{subName}
                                            </div>
                                            <div className="form-check form-switch m-0">
                                              <input 
                                                className="form-check-input" 
                                                type="checkbox"
                                                checked={!!permisosState.sb[subName]}
                                                onChange={() => handleCheckboxChange('sb', subName, true, undefined, subcards)}
                                                disabled={!canEditRolesSB || !permisosState.sb['__acceso_plantel__']}
                                              />
                                            </div>
                                          </div>

                                          {subcards.length > 0 && (
                                            <div className="row g-1 mt-2 ps-3 border-start ms-1 border-success border-opacity-25 animate__animated animate__fadeIn">
                                              {subcards.map(card => (
                                                <div key={card} className="col-12">
                                                  <div className="d-flex justify-content-between align-items-center bg-light p-1 rounded">
                                                    <span className="small fw-bold text-muted text-truncate" style={{ fontSize: '0.75rem' }} title={card}>
                                                      <i className="bi bi-window-stack me-1 text-secondary"></i>
                                                      {card.replace('Tarjeta: ', '').replace('Función: ', '').replace('Diccionario: ', '')}
                                                    </span>
                                                    <div className="form-check form-switch m-0">
                                                      <input 
                                                        className="form-check-input" 
                                                        type="checkbox"
                                                        checked={!!permisosState.sb[card]}
                                                        onChange={() => handleCheckboxChange('sb', card, false, subName)}
                                                        disabled={!canEditRolesSB || !permisosState.sb['__acceso_plantel__']}
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div id="panel-vacio-roles" className="panel-vacio-moderno d-flex flex-column align-items-center justify-content-center text-center animate__animated animate__fadeIn bg-white p-5 rounded-4 shadow-sm" style={{ minHeight: '350px' }}>
              <div className="bg-light p-4 rounded-circle shadow-sm mb-4 d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                <i className="bi bi-shield-lock-fill text-primary" style={{ fontSize: '2.5rem' }}></i>
              </div>
              <h4 className="fw-bold text-dark mb-2">Área de Privilegios</h4>
              <p className="text-muted mx-auto" style={{ maxWidth: '400px' }}>
                Seleccione un rol del panel lateral para configurar detalladamente sus accesos al sistema.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
