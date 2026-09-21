import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';

const ESTRUCTURA_ACCESOS = {
  "Panel Principal": {
    "Identidad Institucional": [
      "Tarjeta: Misión Institucional",
      "Tarjeta: Visión Institucional",
      "Tarjeta: Valores Institucionales",
      "Tarjeta: Proyecto Comunitario (PEIC)"
    ],
    "Indicadores de Resumen": [
      "Tarjeta: Rol y Seguridad de Claves",
      "Tarjeta: Estudiantes Vinculados y Avance",
      "Tarjeta: Rutas Escolares de Representados",
      "Tarjeta: Censo General de la Escuela",
      "Tarjeta: Personal Institucional",
      "Tarjeta: Solicitudes de Cupos",
      "Tarjeta: Ruta y Parada del Trabajador/Personal",
      "Tarjeta: Notificaciones y Avisos Activos"
    ]
  },
  "Dirección y Sistema": {
    "Perfil de la Escuela": [],
    "Configuración Escolar": ["Tarjeta: Períodos Escolares", "Tarjeta: Lapsos Académicos", "Tarjeta: Niveles Educativos"],
    "Cerebro de Sigma": [],
    "Calendario Escolar": ["Tarjeta: Calendario Oficial MPPE", "Tarjeta: Calendario Administrativo", "Tarjeta: Calendario Pedagógico", "Tarjeta: Planificador"],
    "División Territorial": [],
    "Panel de Control": ["Ingresar en Mantenimiento"],
    "Instalación y Descargas": []
  },
  "Organización Escolar": {
    "Cargos Institucionales": ["Tarjeta: Definir Cargos", "Tarjeta: Asignar Personal"],
    "Cadena Supervisoria": ["Función: Estructurar Cadena", "Función: Imprimir Organigrama"],
    "Gestión de Colectivos": [],
    "Estructura Empresa": [
      "Diccionario: Nómina", 
      "Diccionario: Parentesco", 
      "Diccionario: Condición", 
      "Diccionario: Negocio/Filial", 
      "Diccionario: Organización/Gerencia", 
      "Diccionario: Localidad", 
      "Diccionario: Condición Neuro", 
      "Diccionario: Condición Médica", 
      "Diccionario: Alergias"
    ]
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
    "Gestión de Admisiones": [
      "Tarjeta: Baremo y Clasificación", 
      "Tarjeta: Auditoría Uno por Uno", 
      "Tarjeta: Formalización de Matrícula", 
      "Función: Enviar WhatsApp", 
      "Función: Exportar Excel"
    ], 
    "Mensajes de Admisión": [
      "Función: Editar Plantillas", 
      "Función: Probar Envíos", 
      "Función: Restaurar Predeterminados"
    ],
    "Orientaciones Nuevos Ingresos": [
      "Función: Difusión Masiva WhatsApp",
      "Función: Descargar Guía de Orientación"
    ],
    "Vincular Estudiante": [
      "Tarjeta: Registrar Vinculación", 
      "Tarjeta: Lista de Matriculados", 
      "Función: Descargar Ficha PDF", 
      "Función: Exportar Ficha"
    ],
    "Actualización de Datos": [], 
    "Solicitud de Cupos": [], 
    "Mis Solicitudes": [], 
    "Verificaciones": [
      "Función: Escanear QR", 
      "Función: Re-imprimir Comprobante"
    ]
  },
  "Gestión Docente": {
    "Mi Expediente": ["Tarjeta: Modificar Ficha Docente"], 
    "Gestor de Expedientes": [
      "Tarjeta: Expedientes Activos", 
      "Tarjeta: Registro de Docente", 
      "Función: Vacaciones", 
      "Función: Descargar Reporte"
    ]
  },
  "Diseños": {
    "Galería y Plantillas": [],
    "Editor de Constancias": [
      "Función: Diseñar Plantillas",
      "Función: Cargar Firmas y Sellos",
      "Función: Descargar PDF"
    ],
    "Carta de Aceptación": [
      "Función: Diseñar Carta",
      "Función: Cargar Firmas y Sellos",
      "Función: Descargar PDF"
    ],
    "Carnet Estudiantil": [
      "Función: Diseñar Carnet",
      "Función: Cargar Firmas y Sellos",
      "Función: Descargar PDF y PNG"
    ],
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
    "Transporte Escolar": [
      "Tarjeta: Gestión de Rutas", 
      "Tarjeta: Gestión de Paradas", 
      "Tarjeta: Operación (Tracking)", 
      "Tarjeta: Visor de Recorrido", 
      "Función: Control Coordinación"
    ]
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

  // Privileges matrix representation: { lb: { [nombre]: boolean }, sb: { [nombre]: boolean } }
  const [permisosState, setPermisosState] = useState<any>({ lb: {}, sb: {} });

  // Pestaña activa para redimensionar y enfocar la vista: 'ambas' | 'lb' | 'sb'
  const [pestanaEscuela, setPestanaEscuela] = useState<'ambas' | 'lb' | 'sb'>('ambas');

  // Filtro de búsqueda rápida en tiempo real para módulos/tarjetas
  const [busqueda, setBusqueda] = useState('');

  // Control de categorías colapsadas
  const [colapsadas, setColapsadas] = useState<Record<string, boolean>>({});

  const isSuperAdminOrAdmin = ['superadmin', 'administrador', 'administradora', 'director', 'directora'].includes((user?.rol || '').trim().toLowerCase());

  // Permisos por escuela para el módulo (con cobertura institucional total para administradores y directivos)
  const canRolesSB = isSuperAdminOrAdmin || tienePermisoEnEscuela('sb', 'Roles y Privilegios', 'ver') || tienePermiso('Roles y Privilegios', 'ver');
  const canRolesLB = isSuperAdminOrAdmin || tienePermisoEnEscuela('lb', 'Roles y Privilegios', 'ver') || tienePermiso('Roles y Privilegios', 'ver');
  const pRoles = canRolesSB || canRolesLB;

  const canEditRolesSB = isSuperAdminOrAdmin || tienePermisoEnEscuela('sb', 'Roles y Privilegios', 'crear') || tienePermiso('Roles y Privilegios', 'crear') || tienePermiso('Roles y Privilegios', 'modificar');
  const canEditRolesLB = isSuperAdminOrAdmin || tienePermisoEnEscuela('lb', 'Roles y Privilegios', 'crear') || tienePermiso('Roles y Privilegios', 'crear') || tienePermiso('Roles y Privilegios', 'modificar');
  const canEditAny = canEditRolesSB || canEditRolesLB;

  const canDeleteRolesSB = isSuperAdminOrAdmin || tienePermisoEnEscuela('sb', 'Roles y Privilegios', 'eliminar') || tienePermiso('Roles y Privilegios', 'eliminar');
  const canDeleteRolesLB = isSuperAdminOrAdmin || tienePermisoEnEscuela('lb', 'Roles y Privilegios', 'eliminar') || tienePermiso('Roles y Privilegios', 'eliminar');

  // Capacidad de emulación de roles
  const canEmulate = isSuperAdminOrAdmin || tienePermiso('Función: Emulación de Roles', 'ver') || tienePermiso('Roles y Privilegios', 'ver');

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

    const mapBooleans = (raw: any, dest: any) => {
      // Check Acceso Plantel
      dest['__acceso_plantel__'] = raw.hasOwnProperty('__acceso_plantel__') 
        ? !!(raw['__acceso_plantel__']?.ver || raw['__acceso_plantel__'] === true)
        : (Object.keys(raw).length > 0);

      for (const [_cat, submods] of Object.entries(ESTRUCTURA_ACCESOS)) {
        for (const [subName, subcards] of Object.entries(submods)) {
          dest[subName] = !!(raw[subName]?.ver || raw[subName] === true);
          subcards.forEach(card => {
            let val = !!(raw[card]?.ver || raw[card] === true);
            // Compatibilidad hacia atrás:
            if (!val && card === "Función: Crear y Editar Encuestas") {
              val = !!(raw["Función: Crear Encuestas"]?.ver || raw["Función: Crear Encuestas"] === true);
            }
            if (!val && card === "Función: Ver Respuestas y Estadísticas") {
              val = !!(raw["Función: Ver Respuestas"]?.ver || raw["Función: Ver Respuestas"] === true);
            }
            if (!val && card === "Tarjeta: Personal Institucional") {
              val = !!(raw["Tarjeta: Personal Escolar DEP Oriente"]?.ver || raw["Tarjeta: Personal Escolar DEP Oriente"] === true);
            }
            if (!val && card === "Tarjeta: Solicitudes de Cupos") {
              val = !!(raw["Tarjeta: Solicitudes de Cupos por Plantel"]?.ver || raw["Tarjeta: Solicitudes de Cupos por Plantel"] === true);
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

  // REPLICACIÓN RÁPIDA ENTRE PLANTELES
  const copiarPermisos = (origen: 'lb' | 'sb', destino: 'lb' | 'sb') => {
    const nombreOrigen = origen === 'lb' ? 'U.E. Libertador Bolívar' : 'U.E. Santa Bárbara';
    const nombreDestino = destino === 'lb' ? 'U.E. Libertador Bolívar' : 'U.E. Santa Bárbara';

    if (Swal) {
      Swal.fire({
        title: `¿Copiar configuración a ${nombreDestino}?`,
        html: `Se replicarán exactamente todos los permisos de <b>${nombreOrigen}</b> hacia <b>${nombreDestino}</b> para el rol <b>${rolSeleccionado?.nombre}</b>.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '<i class="bi bi-copy me-1"></i> Sí, copiar permisos',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0ea5e9'
      }).then((res: any) => {
        if (res.isConfirmed) {
          setPermisosState((prev: any) => ({
            ...prev,
            [destino]: { ...prev[origen] }
          }));
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `Permisos copiados exitosamente a ${nombreDestino}. Recuerde pulsar Guardar.`,
            showConfirmButton: false,
            timer: 3000
          });
        }
      });
    }
  };

  // PRESETS RÁPIDOS DE ACCESO INSTITUCIONAL
  const establecerAlcanceEscuelas = (modo: 'ambas' | 'solo_lb' | 'solo_sb' | 'bloquear_ambas') => {
    setPermisosState((prev: any) => {
      const copyLb = { ...prev.lb };
      const copySb = { ...prev.sb };

      if (modo === 'ambas') {
        copyLb['__acceso_plantel__'] = true;
        copySb['__acceso_plantel__'] = true;
      } else if (modo === 'solo_lb') {
        copyLb['__acceso_plantel__'] = true;
        copySb['__acceso_plantel__'] = false;
      } else if (modo === 'solo_sb') {
        copySb['__acceso_plantel__'] = true;
        copyLb['__acceso_plantel__'] = false;
      } else if (modo === 'bloquear_ambas') {
        copyLb['__acceso_plantel__'] = false;
        copySb['__acceso_plantel__'] = false;
      }

      return {
        lb: copyLb,
        sb: copySb
      };
    });

    if (Swal) {
      const texto = modo === 'ambas' 
        ? 'Rol habilitado para operar en Ambas Escuelas.' 
        : modo === 'solo_lb' 
          ? 'Rol habilitado EXCLUSIVAMENTE para U.E. Libertador Bolívar.' 
          : modo === 'solo_sb' 
            ? 'Rol habilitado EXCLUSIVAMENTE para U.E. Santa Bárbara.' 
            : 'Acceso a ambas escuelas deshabilitado.';
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: texto,
        showConfirmButton: false,
        timer: 2500
      });
    }
  };

  const toggleCategoria = (cat: string) => {
    setColapsadas(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const colapsarTodas = (estado: boolean) => {
    const nuevo: Record<string, boolean> = {};
    Object.keys(ESTRUCTURA_ACCESOS).forEach(cat => {
      nuevo[cat] = estado;
    });
    setColapsadas(nuevo);
  };

  const guardarPrivilegios = async () => {
    if (!rolSeleccionado) return;

    if (!canEditAny) {
      if (Swal) Swal.fire('Error', 'No tiene permisos para guardar o editar privilegios.', 'error');
      return;
    }

    setLoading(true);
    try {
      const buildEscPayload = (esc: 'lb' | 'sb') => {
        const raw = permisosState[esc];
        const dest: any = {};

        // Acceso Plantel
        dest['__acceso_plantel__'] = { ver: !!raw['__acceso_plantel__'] };

        for (const [_cat, submods] of Object.entries(ESTRUCTURA_ACCESOS)) {
          for (const [subName, subcards] of Object.entries(submods)) {
            const isSubActive = !!raw[subName];
            dest[subName] = isSubActive 
              ? { ...SUPER_PODERES }
              : { ver: false, crear: false, modificar: false, eliminar: false };

            subcards.forEach(card => {
              const isCardActive = isSubActive && !!raw[card];
              dest[card] = isCardActive 
                ? { ...SUPER_PODERES }
                : { ver: false, crear: false, modificar: false, eliminar: false };

              // Alias automáticos para retrocompatibilidad
              if (card === "Función: Crear y Editar Encuestas") {
                dest["Función: Crear Encuestas"] = dest[card];
              }
              if (card === "Función: Ver Respuestas y Estadísticas") {
                dest["Función: Ver Respuestas"] = dest[card];
              }
              if (card === "Tarjeta: Personal Institucional") {
                dest["Tarjeta: Personal Escolar DEP Oriente"] = dest[card];
              }
              if (card === "Tarjeta: Solicitudes de Cupos") {
                dest["Tarjeta: Solicitudes de Cupos por Plantel"] = dest[card];
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

      // Limpiar caché de permisos inmediatamente para refrescar en caliente
      localStorage.removeItem('sigae_cache_permisos');
      localStorage.removeItem('sigae_cache_full_permisos');

      auditar('Roles y Privilegios', 'Actualizar Privilegios', `Accesos y estado por plantel actualizados para rol: ${rolSeleccionado.nombre}`);

      if (Swal) {
        Swal.fire({
          title: '¡Guardado Exitoso!',
          text: `Los accesos y privilegios del rol "${rolSeleccionado.nombre}" se aplicaron correctamente.`,
          icon: 'success',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          window.location.reload();
        });
      } else {
        window.location.reload();
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

    const escuelaNombre = escuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
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

      // Actualización optimista inmediata en la lista de roles
      setRoles(prevRoles => prevRoles.map(item => {
        if (item.nombre === rolObj.nombre) {
          const updatedPrivs = JSON.parse(JSON.stringify(item.privilegios || {}));
          if (!updatedPrivs[escuela]) updatedPrivs[escuela] = {};
          updatedPrivs[escuela]['__acceso_plantel__'] = { ver: nuevoEstado };
          return { ...item, privilegios: updatedPrivs };
        }
        return item;
      }));

      // Si es el rol actualmente seleccionado en el panel derecho, sincronizar permisosState
      if (rolSeleccionado && rolSeleccionado.nombre === rolObj.nombre) {
        setPermisosState((prev: any) => ({
          ...prev,
          [escuela]: {
            ...prev[escuela],
            '__acceso_plantel__': nuevoEstado
          }
        }));
      }

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
          title: `${rolObj.nombre} en ${escuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar'}: ${nuevoEstado ? 'HABILITADO' : 'BLOQUEADO'}`,
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

      // Actualización optimista inmediata en la lista de roles
      setRoles(prevRoles => prevRoles.map(item => {
        if (item.nombre === rolObj.nombre) {
          const updatedPrivs = JSON.parse(JSON.stringify(item.privilegios || {}));
          if (!updatedPrivs.sb) updatedPrivs.sb = {};
          if (!updatedPrivs.lb) updatedPrivs.lb = {};
          updatedPrivs.sb['__acceso_plantel__'] = { ver: nuevoEstado };
          updatedPrivs.lb['__acceso_plantel__'] = { ver: nuevoEstado };
          return { ...item, privilegios: updatedPrivs };
        }
        return item;
      }));

      // Si es el rol actualmente seleccionado en el panel derecho, sincronizar permisosState
      if (rolSeleccionado && rolSeleccionado.nombre === rolObj.nombre) {
        setPermisosState((prev: any) => ({
          ...prev,
          sb: { ...prev.sb, '__acceso_plantel__': nuevoEstado },
          lb: { ...prev.lb, '__acceso_plantel__': nuevoEstado }
        }));
      }

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
              <option value="sb" ${currentSchool === 'sb' ? 'selected' : ''}>UE Santa Bárbara</option>
              <option value="lb" ${currentSchool === 'lb' ? 'selected' : ''}>UE Libertador Bolívar</option>
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
      localStorage.setItem('sesion_sigae', 'activa');
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
      inputPlaceholder: 'Nombre del Rol (Ej. Coordinador Pedagógico)',
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

  // Renderizador de un panel de plantel (LB o SB)
  const renderPlantelPanel = (escuela: 'lb' | 'sb') => {
    const isLB = escuela === 'lb';
    const canEdit = isLB ? canEditRolesLB : canEditRolesSB;
    const escuelaNombre = isLB ? 'U.E. Libertador Bolívar' : 'U.E. Santa Bárbara';
    const bgHeader = isLB ? 'bg-primary' : 'bg-success';
    const borderTheme = isLB ? 'border-primary' : 'border-success';

    const rawEsc = permisosState[escuela] || {};
    const plantelHabilitado = !!rawEsc['__acceso_plantel__'];

    // Filtrar por término de búsqueda si existe
    const q = busqueda.toLowerCase().trim();

    return (
      <div className={`card border-0 shadow-sm rounded-4 h-100 border-top ${borderTheme} border-5`}>
        {/* Cabecera del Plantel */}
        <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center rounded-top-4 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className={`badge p-2 rounded-circle ${isLB ? 'bg-primary text-white' : 'bg-success text-white'}`}>
              <i className={`bi ${isLB ? 'bi-mortarboard-fill' : 'bi-tree-fill'}`}></i>
            </span>
            <div>
              <h6 className={`mb-0 fw-bold ${isLB ? 'text-primary' : 'text-success'}`}>
                {escuelaNombre}
              </h6>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                Código: <strong className="text-dark">{escuela.toUpperCase()}</strong> &bull; Matriz de Permisos
              </small>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* Botón de Copiar a la otra escuela */}
            <button
              type="button"
              onClick={() => copiarPermisos(escuela, isLB ? 'sb' : 'lb')}
              className="btn btn-xs rounded-pill px-2.5 py-1 fw-bold border bg-white shadow-xs hover-efecto"
              style={{ fontSize: '0.72rem', color: isLB ? '#0284c7' : '#059669', borderColor: isLB ? '#bae6fd' : '#a7f3d0' }}
              title={`Copiar esta configuración hacia ${isLB ? 'Santa Bárbara' : 'Libertador Bolívar'}`}
              disabled={!canEditAny}
            >
              <i className="bi bi-copy me-1"></i>
              Copiar a {isLB ? 'SB' : 'LB'}
            </button>

            <div className="form-check form-switch m-0 d-flex align-items-center gap-1">
              <input 
                className="form-check-input hover-mano" 
                type="checkbox" 
                id={`chk-marcar-todos-${escuela}`}
                checked={isTodosMarcados(escuela)}
                onChange={(e) => handleToggleTodos(escuela, e.target.checked)}
                disabled={!canEdit || !plantelHabilitado}
              />
              <label 
                className="form-check-label small fw-bold text-dark hover-mano" 
                htmlFor={`chk-marcar-todos-${escuela}`}
                style={{ fontSize: '0.75rem' }}
              >
                Otorgar Todo
              </label>
            </div>
          </div>
        </div>

        <div className="card-body p-3 bg-light">
          {/* INTERRUPTOR MAESTRO DEL PLANTEL */}
          <div className={`card border shadow-sm rounded-4 mb-3 p-3 transition-all ${plantelHabilitado ? 'border-success bg-white' : 'border-danger bg-danger bg-opacity-10'}`}>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="d-flex align-items-center gap-3">
                <div className={`p-2.5 rounded-circle ${plantelHabilitado ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-20 text-danger'}`}>
                  <i className={`bi ${plantelHabilitado ? 'bi-shield-check' : 'bi-shield-slash-fill'} fs-4`}></i>
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <h6 className="mb-0 fw-bold text-dark">
                      Acceso Institucional: {escuelaNombre}
                    </h6>
                    <span className={`badge rounded-pill px-2.5 py-1 fw-bold ${plantelHabilitado ? 'bg-success text-white' : 'bg-danger text-white'}`} style={{ fontSize: '0.72rem' }}>
                      {plantelHabilitado ? '● ROL HABILITADO' : '● ROL BLOQUEADO'}
                    </span>
                  </div>
                  <small className="text-muted d-block mt-0.5" style={{ fontSize: '0.76rem' }}>
                    {plantelHabilitado
                      ? `Los usuarios con rol "${rolSeleccionado?.nombre}" pueden iniciar sesión y operar en este plantel.`
                      : `Bloqueo estricto: Ningún usuario con rol "${rolSeleccionado?.nombre}" podrá acceder a este plantel.`}
                  </small>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => handleToggleEstadoRolEscuelaDirecto(e, rolSeleccionado, escuela, !plantelHabilitado)}
                  disabled={!canEdit}
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-bold shadow-xs d-flex align-items-center gap-1.5 transition-all ${
                    plantelHabilitado 
                      ? 'btn-outline-danger hover-efecto' 
                      : 'btn-success text-white shadow-sm'
                  }`}
                  style={{ fontSize: '0.78rem' }}
                  title={plantelHabilitado ? `Inhabilitar acceso a ${escuelaNombre} inmediatamente` : `Habilitar acceso a ${escuelaNombre} inmediatamente`}
                >
                  <i className={`bi ${plantelHabilitado ? 'bi-slash-circle' : 'bi-check-circle-fill'}`}></i>
                  <span>{plantelHabilitado ? 'Inhabilitar' : 'Habilitar'}</span>
                </button>
                <div className="form-check form-switch fs-4 m-0">
                  <input 
                    className="form-check-input hover-mano" 
                    type="checkbox" 
                    role="switch"
                    checked={plantelHabilitado}
                    onChange={() => handleCheckboxChange(escuela, '__acceso_plantel__', false)}
                    disabled={!canEdit}
                    title={plantelHabilitado ? 'Click para bloquear el acceso de este rol en este plantel' : 'Click para habilitar el acceso de este rol en este plantel'}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CONTENEDOR DE CATEGORÍAS Y MÓDULOS */}
          <div style={{ opacity: plantelHabilitado ? 1 : 0.45, transition: 'opacity 0.2s ease-in-out' }}>
            {Object.entries(ESTRUCTURA_ACCESOS).map(([categoria, submods]) => {
              // Filtrar si hay búsqueda
              const matchesCategory = categoria.toLowerCase().includes(q);
              const matchingSubmods = Object.entries(submods).filter(([subName, subcards]) => {
                if (matchesCategory || !q) return true;
                if (subName.toLowerCase().includes(q)) return true;
                return subcards.some(c => c.toLowerCase().includes(q));
              });

              if (matchingSubmods.length === 0) return null;

              // Conteo de items activos
              const totalItems = Object.keys(submods).length;
              const activosCount = Object.keys(submods).filter(sub => !!rawEsc[sub]).length;
              const isColapsada = !!colapsadas[categoria];

              return (
                <div key={categoria} className="card border-0 shadow-sm rounded-4 mb-3 overflow-hidden">
                  {/* Encabezado de la Categoría */}
                  <div 
                    onClick={() => toggleCategoria(categoria)}
                    className={`card-header text-white py-2 px-3 d-flex justify-content-between align-items-center cursor-pointer ${bgHeader}`}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <i className={`bi ${isColapsada ? 'bi-chevron-right' : 'bi-chevron-down'} text-white`}></i>
                      <h6 className="mb-0 fw-bold text-uppercase" style={{ fontSize: '0.78rem', letterSpacing: '0.4px' }}>
                        {categoria}
                      </h6>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-white text-dark rounded-pill fw-bold" style={{ fontSize: '0.67rem' }}>
                        {activosCount}/{totalItems} Activos
                      </span>
                    </div>
                  </div>

                  {/* Cuerpo de Módulos (si no está colapsada) */}
                  {!isColapsada && (
                    <div className="card-body p-2.5 bg-white rounded-bottom-4">
                      <div className="row g-2">
                        {matchingSubmods.map(([subName, subcards]) => {
                          const isSubActivo = !!rawEsc[subName];

                          return (
                            <div key={subName} className="col-12">
                              <div className={`p-2.5 border rounded-3 transition-all ${isSubActivo ? 'border-primary border-opacity-25 bg-white shadow-xs' : 'border-light bg-light'}`}>
                                <div 
                                  className={`d-flex justify-content-between align-items-center ${canEdit && plantelHabilitado ? 'cursor-pointer hover-mano' : ''}`}
                                  onClick={() => {
                                    if (canEdit && plantelHabilitado) {
                                      handleCheckboxChange(escuela, subName, true, undefined, subcards);
                                    }
                                  }}
                                >
                                  <div className="d-flex align-items-center gap-2 select-none">
                                    <i className={`bi ${isSubActivo ? 'bi-check-square-fill text-primary' : 'bi-square text-muted'}`} style={{ fontSize: '0.95rem' }}></i>
                                    <span className="fw-bold text-dark" style={{ fontSize: '0.84rem' }}>
                                      {subName}
                                    </span>
                                  </div>
                                  <div className="form-check form-switch m-0" onClick={(e) => e.stopPropagation()}>
                                    <input 
                                      className="form-check-input hover-mano" 
                                      type="checkbox" 
                                      checked={isSubActivo}
                                      onChange={() => handleCheckboxChange(escuela, subName, true, undefined, subcards)}
                                      disabled={!canEdit || !plantelHabilitado}
                                    />
                                  </div>
                                </div>

                                {/* Sub-tarjetas / Funciones internas */}
                                {subcards.length > 0 && isSubActivo && (
                                  <div className="row g-1.5 mt-2 ps-3 border-start ms-1 border-2 border-primary border-opacity-25 animate__animated animate__fadeIn">
                                    {subcards.map(card => {
                                      // Si hay búsqueda, verificar si coincide
                                      if (q && !matchesCategory && !subName.toLowerCase().includes(q) && !card.toLowerCase().includes(q)) {
                                        return null;
                                      }

                                      const isCardActivo = !!rawEsc[card];

                                      return (
                                        <div key={card} className="col-12">
                                          <div 
                                            className={`d-flex justify-content-between align-items-center px-2 py-1.5 rounded-2 ${isCardActivo ? 'bg-primary bg-opacity-10 text-primary' : 'bg-light text-muted'} ${canEdit && plantelHabilitado ? 'cursor-pointer hover-mano' : ''}`}
                                            onClick={() => {
                                              if (canEdit && plantelHabilitado) {
                                                handleCheckboxChange(escuela, card, false, subName);
                                              }
                                            }}
                                          >
                                            <span className="small fw-semibold text-truncate d-flex align-items-center gap-1.5 select-none" style={{ fontSize: '0.74rem' }} title={card}>
                                              <i className="bi bi-arrow-return-right text-muted" style={{ fontSize: '0.65rem' }}></i>
                                              <span>{card}</span>
                                            </span>
                                            <div className="form-check form-switch m-0" onClick={(e) => e.stopPropagation()}>
                                              <input 
                                                className="form-check-input hover-mano" 
                                                type="checkbox"
                                                checked={isCardActivo}
                                                onChange={() => handleCheckboxChange(escuela, card, false, subName)}
                                                disabled={!canEdit || !plantelHabilitado}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (permLoading || (loading && roles.length === 0)) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5 h-100" style={{ minHeight: '450px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando roles y privilegios...</span>
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
      {/* ── 1. BANNER INSTITUCIONAL ── */}
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
              </div>
              <h1 className="fw-bolder mb-2 text-white" style={{ fontSize: '2.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                <i className="bi bi-person-lines-fill me-3"></i>Roles y Privilegios Multiescuela
              </h1>
              <p className="mb-0 fw-semibold fs-6" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Control granular de acceso por plantel para usuarios de ambas escuelas, solo Libertador Bolívar o solo Santa Bárbara.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. CUERPO PRINCIPAL (LISTA DE ROLES + MATRIZ DE CONFIGURACIÓN) ── */}
      <div className="row g-4 animate__animated animate__fadeInUp align-items-start mt-1">
        
        {/* PANEL IZQUIERDO: ROLES REGISTRADOS */}
        <div className="col-12 col-lg-4 col-xl-4">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center rounded-top-4">
              <div>
                <h5 className="mb-0 fw-bold text-dark fs-6">Roles Institucionales</h5>
                <small className="text-muted" style={{ fontSize: '0.74rem' }}>{roles.length} roles configurados</small>
              </div>
              <button 
                className="btn btn-sm text-white fw-bold shadow-sm hover-efecto" 
                style={{ backgroundColor: '#0ea5e9' }}
                onClick={crearRol} 
                title="Nuevo Rol"
              >
                <i className="bi bi-plus-lg me-1"></i>Nuevo Rol
              </button>
            </div>

            <div className="card-body p-0" style={{ maxHeight: '680px', overflowY: 'auto' }}>
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
                    const soloLB = lbActivo && !sbActivo;
                    const soloSB = sbActivo && !lbActivo;
                    const bloqueadoTotal = !sbActivo && !lbActivo;

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
                              {/* Badge de Estado por Escuela */}
                              <div className="mt-0.5">
                                {ambasActivas && (
                                  <span className="badge rounded-pill px-2 py-0.5 text-white" style={{ background: 'linear-gradient(135deg, #10b981 0%, #0284c7 100%)', fontSize: '0.67rem' }}>
                                    <i className="bi bi-buildings me-1"></i>Ambas Escuelas
                                  </span>
                                )}
                                {soloLB && (
                                  <span className="badge rounded-pill px-2 py-0.5 bg-primary text-white" style={{ fontSize: '0.67rem' }}>
                                    <i className="bi bi-mortarboard-fill me-1"></i>Solo Libertador
                                  </span>
                                )}
                                {soloSB && (
                                  <span className="badge rounded-pill px-2 py-0.5 bg-success text-white" style={{ fontSize: '0.67rem' }}>
                                    <i className="bi bi-tree-fill me-1"></i>Solo Santa Bárbara
                                  </span>
                                )}
                                {bloqueadoTotal && (
                                  <span className="badge rounded-pill px-2 py-0.5 bg-danger text-white" style={{ fontSize: '0.67rem' }}>
                                    <i className="bi bi-slash-circle me-1"></i>Sin Acceso
                                  </span>
                                )}
                              </div>
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
                                Activo
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botones de conmutación rápida de escuela */}
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
                            style={{ fontSize: '0.67rem' }}
                            title={sbActivo ? 'Acceso PERMITIDO a UE Santa Bárbara (Click para Bloquear)' : 'Acceso BLOQUEADO a UE Santa Bárbara (Click para Activar)'}
                            disabled={!canEditRolesSB}
                          >
                            <i className={`bi ${sbActivo ? 'bi-check-circle-fill' : 'bi-slash-circle-fill'}`}></i>
                            <span>SB: {sbActivo ? 'ON' : 'OFF'}</span>
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
                            style={{ fontSize: '0.67rem' }}
                            title={lbActivo ? 'Acceso PERMITIDO a Libertador Bolívar (Click para Bloquear)' : 'Acceso BLOQUEADO a Libertador Bolívar (Click para Activar)'}
                            disabled={!canEditRolesLB}
                          >
                            <i className={`bi ${lbActivo ? 'bi-check-circle-fill' : 'bi-slash-circle-fill'}`}></i>
                            <span>LB: {lbActivo ? 'ON' : 'OFF'}</span>
                          </button>

                          {/* Toggle Ambas */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleAmbasEscuelasDirecto(e, r)}
                            className={`btn btn-xs rounded-pill px-2 py-1 fw-bold d-flex align-items-center gap-1 border transition-all ${
                              ambasActivas
                                ? 'btn-dark text-white'
                                : bloqueadoTotal
                                  ? 'btn-outline-secondary text-muted'
                                  : 'btn-outline-warning text-dark'
                            }`}
                            style={{ fontSize: '0.67rem' }}
                            title={ambasActivas ? 'Activo en Ambas (Click para Bloquear en Ambas)' : 'Click para Activar en Ambas Escuelas'}
                            disabled={!canEditAny}
                          >
                            <i className="bi bi-buildings"></i>
                            <span>{ambasActivas ? 'Ambas ON' : bloqueadoTotal ? 'Ambas OFF' : 'Ambas'}</span>
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

        {/* PANEL DERECHO: MATRIZ REDIMENSIONADA Y OPTIMIZADA */}
        <div className="col-12 col-lg-8 col-xl-8">
          {rolSeleccionado ? (
            <div className="card border-0 shadow-sm rounded-4">
              
              {/* CABECERA DE CONFIGURACIÓN DEL ROL */}
              <div className="card-header bg-white border-bottom p-4 rounded-top-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <h4 className="mb-0 fw-bold text-dark">{rolSeleccionado.nombre}</h4>
                      <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-2.5 py-1">
                        Matriz de Privilegios
                      </span>
                    </div>
                    <small className="text-muted d-block mt-1">
                      Configura con precisión qué pantallas y funciones puede ver u operar este rol en cada escuela.
                    </small>
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
                        <i className="bi bi-person-bounding-box me-1.5"></i>Emular Rol
                      </button>
                    )}
                    <button 
                      className="btn btn-outline-danger btn-sm rounded-pill fw-bold px-3 shadow-sm" 
                      onClick={eliminarRolActual}
                    >
                      <i className="bi bi-trash3-fill me-1"></i>Eliminar
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

                {/* ── BARRA DE HERRAMIENTAS RÁPIDAS (ALCANCE INSTITUCIONAL & COPIA) ── */}
                <div className="p-3 bg-light rounded-3 border mt-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <div className="d-flex align-items-center gap-1.5 flex-wrap">
                    <span className="fw-bold text-muted small me-1">Alcance Rápido:</span>
                    <button
                      type="button"
                      onClick={() => establecerAlcanceEscuelas('ambas')}
                      className="btn btn-xs btn-outline-dark rounded-pill px-2.5 py-1 fw-bold hover-efecto"
                      style={{ fontSize: '0.73rem' }}
                    >
                      <i className="bi bi-buildings me-1"></i>Ambas Escuelas ON
                    </button>
                    <button
                      type="button"
                      onClick={() => establecerAlcanceEscuelas('solo_lb')}
                      className="btn btn-xs btn-outline-primary rounded-pill px-2.5 py-1 fw-bold hover-efecto"
                      style={{ fontSize: '0.73rem' }}
                    >
                      <i className="bi bi-mortarboard-fill me-1"></i>Solo Libertador
                    </button>
                    <button
                      type="button"
                      onClick={() => establecerAlcanceEscuelas('solo_sb')}
                      className="btn btn-xs btn-outline-success rounded-pill px-2.5 py-1 fw-bold hover-efecto"
                      style={{ fontSize: '0.73rem' }}
                    >
                      <i className="bi bi-tree-fill me-1"></i>Solo Santa Bárbara
                    </button>
                    <button
                      type="button"
                      onClick={() => establecerAlcanceEscuelas('bloquear_ambas')}
                      className="btn btn-xs btn-outline-danger rounded-pill px-2.5 py-1 fw-bold hover-efecto"
                      style={{ fontSize: '0.73rem' }}
                      title="Deshabilitar acceso a ambas escuelas"
                    >
                      <i className="bi bi-slash-circle me-1"></i>Bloquear Ambas
                    </button>
                  </div>

                  <div className="d-flex align-items-center gap-1.5 flex-wrap">
                    <span className="fw-bold text-muted small me-1">Replicar:</span>
                    <button
                      type="button"
                      onClick={() => copiarPermisos('lb', 'sb')}
                      className="btn btn-xs btn-light border text-primary rounded-pill px-2.5 py-1 fw-bold shadow-xs hover-efecto"
                      style={{ fontSize: '0.73rem' }}
                      title="Copiar configuración de Libertador a Santa Bárbara"
                    >
                      <i className="bi bi-arrow-right-circle me-1"></i>LB ➔ SB
                    </button>
                    <button
                      type="button"
                      onClick={() => copiarPermisos('sb', 'lb')}
                      className="btn btn-xs btn-light border text-success rounded-pill px-2.5 py-1 fw-bold shadow-xs hover-efecto"
                      style={{ fontSize: '0.73rem' }}
                      title="Copiar configuración de Santa Bárbara a Libertador"
                    >
                      <i className="bi bi-arrow-left-circle me-1"></i>SB ➔ LB
                    </button>
                  </div>
                </div>

                {/* ── SELECTOR DE PESTAÑAS Y BUSCADOR EN VIVO ── */}
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3 pt-2 border-top">
                  {/* Pestañas de Vista */}
                  <div className="btn-group p-1 bg-light rounded-pill border shadow-xs" role="group">
                    <button
                      type="button"
                      onClick={() => setPestanaEscuela('ambas')}
                      className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${pestanaEscuela === 'ambas' ? 'btn-dark text-white shadow-sm' : 'btn-light text-muted border-0'}`}
                      style={{ fontSize: '0.78rem' }}
                    >
                      <i className="bi bi-columns-gap me-1.5"></i>Ambas Escuelas
                    </button>
                    <button
                      type="button"
                      onClick={() => setPestanaEscuela('lb')}
                      className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${pestanaEscuela === 'lb' ? 'btn-primary text-white shadow-sm' : 'btn-light text-muted border-0'}`}
                      style={{ fontSize: '0.78rem' }}
                    >
                      <i className="bi bi-mortarboard-fill me-1.5"></i>Libertador Bolívar
                    </button>
                    <button
                      type="button"
                      onClick={() => setPestanaEscuela('sb')}
                      className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${pestanaEscuela === 'sb' ? 'btn-success text-white shadow-sm' : 'btn-light text-muted border-0'}`}
                      style={{ fontSize: '0.78rem' }}
                    >
                      <i className="bi bi-tree-fill me-1.5"></i>Santa Bárbara
                    </button>
                  </div>

                  {/* Buscador Rápido y Control de Colapso */}
                  <div className="d-flex align-items-center gap-2 flex-grow-1 flex-md-grow-0" style={{ minWidth: '260px' }}>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-white border-end-0 rounded-start-pill">
                        <i className="bi bi-search text-muted"></i>
                      </span>
                      <input 
                        type="text" 
                        className="form-control border-start-0 rounded-end-pill"
                        placeholder="Buscar módulo o función..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        style={{ fontSize: '0.8rem' }}
                      />
                      {busqueda && (
                        <button 
                          className="btn btn-sm btn-link text-muted position-absolute end-0 top-0 h-100 pe-3 text-decoration-none"
                          onClick={() => setBusqueda('')}
                          style={{ zIndex: 5 }}
                        >
                          <i className="bi bi-x-circle-fill"></i>
                        </button>
                      )}
                    </div>

                    <button 
                      type="button"
                      onClick={() => colapsarTodas(Object.values(colapsadas).some(v => !v))}
                      className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 fw-semibold d-none d-xl-inline"
                      style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                      title="Expandir o contraer todas las categorías"
                    >
                      <i className="bi bi-arrows-expand me-1"></i>
                      {Object.values(colapsadas).some(v => !v) ? 'Contraer' : 'Expandir'}
                    </button>
                  </div>
                </div>
              </div>

              {/* CUERPO DE LA MATRIZ DE PERMISOS */}
              <div className="card-body p-4 bg-light rounded-bottom-4">
                <div className="row g-4">
                  {/* Si la pestaña es 'ambas', se muestran ambas en 2 columnas; si es 'lb' o 'sb', se muestra una sola en pantalla ancha completa */}
                  {pestanaEscuela === 'ambas' ? (
                    <>
                      {canRolesLB && (
                        <div className={canRolesSB ? "col-12 col-xl-6" : "col-12"}>
                          {renderPlantelPanel('lb')}
                        </div>
                      )}
                      {canRolesSB && (
                        <div className={canRolesLB ? "col-12 col-xl-6" : "col-12"}>
                          {renderPlantelPanel('sb')}
                        </div>
                      )}
                    </>
                  ) : pestanaEscuela === 'lb' ? (
                    <div className="col-12">
                      {renderPlantelPanel('lb')}
                    </div>
                  ) : (
                    <div className="col-12">
                      {renderPlantelPanel('sb')}
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div id="panel-vacio-roles" className="panel-vacio-moderno d-flex flex-column align-items-center justify-content-center text-center animate__animated animate__fadeIn bg-white p-5 rounded-4 shadow-sm" style={{ minHeight: '400px' }}>
              <div className="bg-light p-4 rounded-circle shadow-sm mb-4 d-flex align-items-center justify-content-center" style={{ width: '85px', height: '85px' }}>
                <i className="bi bi-shield-lock-fill text-primary" style={{ fontSize: '2.8rem' }}></i>
              </div>
              <h4 className="fw-bold text-dark mb-2">Panel de Roles y Privilegios</h4>
              <p className="text-muted mx-auto" style={{ maxWidth: '420px', fontSize: '0.9rem' }}>
                Selecciona uno de los roles institucionales del listado izquierdo para configurar detalladamente los accesos de ambas escuelas o de forma individual.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
