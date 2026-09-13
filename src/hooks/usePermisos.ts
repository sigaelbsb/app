import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

const getInitialUser = () => {
  try {
    const stored = localStorage.getItem('usuario_sigae');
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

const getInitialCache = (key: string) => {
  try {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    return null;
  }
};

export const usePermisos = () => {
  const [user, setUser] = useState<any>(getInitialUser);
  const [fullPermisos, setFullPermisos] = useState<any>(() => getInitialCache('sigae_cache_full_permisos'));
  const [permisos, setPermisos] = useState<any>(() => getInitialCache('sigae_cache_permisos'));
  const [loading, setLoading] = useState<boolean>(() => {
    const initialUser = getInitialUser();
    if (!initialUser) return false;
    if (['SuperAdmin', 'Director', 'Directora'].includes(initialUser.rol)) return false;
    const cached = getInitialCache('sigae_cache_full_permisos');
    return !cached;
  });

  useEffect(() => {
    const usr = getInitialUser();
    if (!usr) {
      setUser(null);
      setPermisos(null);
      setFullPermisos(null);
      setLoading(false);
      return;
    }
    setUser(usr);

    const userEsc = (usr.id_escuela || '').trim().toLowerCase();
    let currentEsc = localStorage.getItem('sigae_escuela_codigo') || userEsc || 'sb';
    
    const isSuperAdmin = (usr.rol || '').trim() === 'SuperAdmin';
    // Aislamiento estricto: usuarios asignados a una escuela fija ('sb' o 'lb') siempre operan en su escuela
    if (!isSuperAdmin && (userEsc === 'sb' || userEsc === 'lb') && currentEsc !== userEsc) {
      currentEsc = userEsc;
      localStorage.setItem('sigae_escuela_codigo', userEsc);
      localStorage.setItem('sigae_escuela_activa', userEsc === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
      usr.id_escuela = userEsc;
      usr.nombre_escuela = userEsc === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
      localStorage.setItem('usuario_sigae', JSON.stringify(usr));
    }

    const fetchPermisos = async () => {
      try {
        let targetRol = (usr.rol || '').trim();
        let { data, error } = await supabase
          .from('roles')
          .select('permisos')
          .ilike('nombre', targetRol)
          .maybeSingle();

        if (!data && targetRol.toLowerCase() === 'representante') {
          const fallbackRep = await supabase
            .from('roles')
            .select('permisos')
            .eq('nombre', 'Representante')
            .maybeSingle();
          if (fallbackRep.data) data = fallbackRep.data;
        } else if (!data && targetRol.toLowerCase() === 'docente') {
          const fallbackDoc = await supabase
            .from('roles')
            .select('permisos')
            .eq('nombre', 'Docente')
            .maybeSingle();
          if (fallbackDoc.data) data = fallbackDoc.data;
        }

        if (!data && ['superadmin', 'administrador', 'administradora', 'director', 'directora', 'subdirector', 'coordinador'].includes(targetRol.toLowerCase())) {
          const fallback = await supabase
            .from('roles')
            .select('permisos')
            .eq('nombre', 'Administrador')
            .maybeSingle();
          if (fallback.data) {
            data = fallback.data;
          }
        }

        if (error && !data) throw error;

        if (data) {
          let parsed: any = {};
          if (typeof data.permisos === 'string') {
            try { parsed = JSON.parse(data.permisos); } catch (e) {}
          } else {
            parsed = data.permisos || {};
          }

          setFullPermisos(parsed);
          localStorage.setItem('sigae_cache_full_permisos', JSON.stringify(parsed));

          const escPerms = parsed[currentEsc] || parsed || {};
          setPermisos(escPerms);
          localStorage.setItem('sigae_cache_permisos', JSON.stringify(escPerms));

          // Verificación de bloqueo de rol en tiempo real para sesiones activas (no emuladas):
          const esModoEmulacion = !!(
            usr?.es_emulacion ||
            localStorage.getItem('sigae_usuario_original_admin') ||
            sessionStorage.getItem('sigae_emulacion_activa') === 'true'
          );

          if (!esModoEmulacion && !['SuperAdmin', 'Administrador', 'Administradora', 'Director', 'Directora'].includes(usr.rol)) {
            if (escPerms.hasOwnProperty('__acceso_plantel__') && (escPerms['__acceso_plantel__']?.ver === false || escPerms['__acceso_plantel__'] === false)) {
              console.warn("Rol suspendido para este plantel. Cerrando sesión...");
              localStorage.removeItem('sesion_sigae');
              localStorage.removeItem('usuario_sigae');
              localStorage.removeItem('sigae_cache_permisos');
              localStorage.removeItem('sigae_cache_full_permisos');
              window.location.href = '/';
              return;
            }
          }
        }
      } catch (e) {
        console.error("Error fetching permissions:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchPermisos();
  }, []);

  const esDirectivo = useMemo(() => {
    const rol = (user?.rol || '').trim();
    return ['SuperAdmin', 'Administrador', 'Administradora', 'Director', 'Directora', 'Subdirector', 'Subdirectora'].includes(rol);
  }, [user]);

  const tieneAccesoEscuela = useCallback((escuelaCodigo: string) => {
    if (!user) return false;
    
    // SuperAdmin y Administradores tienen acceso irrestricto universal a ambos planteles
    const rolNorm = (user.rol || '').trim().toLowerCase();
    if (rolNorm === 'superadmin' || rolNorm === 'administrador' || rolNorm === 'administradora') {
      return true;
    }

    const codNormalizado = escuelaCodigo.toLowerCase().trim();
    const userEsc = (user.id_escuela || '').trim().toLowerCase();

    // MODO EMULACIÓN: Si el usuario está emulando un rol (como Invitado) o una cuenta de usuario,
    // debe tener acceso irrestricto a la escuela seleccionada para la prueba,
    // aun si el rol se encuentra inhabilitado en dicho plantel (__acceso_plantel__ === false)
    const esModoEmulacion = !!(
      user.es_emulacion ||
      localStorage.getItem('sigae_usuario_original_admin') ||
      sessionStorage.getItem('sigae_emulacion_activa') === 'true'
    );

    if (esModoEmulacion) {
      if (!userEsc || userEsc === 'ambas' || userEsc === 'todas' || userEsc === codNormalizado) {
        return true;
      }
    }

    // 1. AISLAMIENTO ESTRICTO POR PLANTEL ASIGNADO AL USUARIO:
    // Si el usuario está asignado específicamente a una sola escuela, solo puede acceder a ella
    if (userEsc === 'sb' || userEsc === 'lb') {
      if (userEsc !== codNormalizado) {
        return false;
      }
    }

    // 2. VERIFICACIÓN DEL PRIVILEGIO MAESTRO DEL ROL EN ESTE PLANTEL (__acceso_plantel__):
    const privsEscuela = fullPermisos ? fullPermisos[codNormalizado] : null;

    if (privsEscuela && privsEscuela.hasOwnProperty('__acceso_plantel__')) {
      const acc = privsEscuela['__acceso_plantel__'];
      if (typeof acc === 'boolean') return acc;
      if (typeof acc === 'object' && acc !== null) {
        return acc.ver === true;
      }
      return false;
    }

    // Si no está explícito el switch maestro pero hay permisos definidos en esta escuela:
    if (privsEscuela && Object.keys(privsEscuela).length > 0) {
      for (let mod in privsEscuela) {
        if (privsEscuela[mod] && (privsEscuela[mod].ver === true || privsEscuela[mod] === true)) {
          return true;
        }
      }
      return false;
    }

    // Para usuarios directivos sin restricción configurada aún:
    if (esDirectivo) {
      return true;
    }

    return false;
  }, [user, fullPermisos, esDirectivo]);

  const tienePermiso = useCallback((modulo: string, accion: string = 'ver') => {
    if (!user || !user.rol) return false;

    // SuperAdmin siempre tiene acceso a todo
    if (user.rol === 'SuperAdmin') {
      return true;
    }

    // Autogestión básica de cuenta disponible a todo usuario autenticado
    if (modulo === "Mi Perfil" || modulo === "Métodos de Acceso") {
      return true;
    }

    // Aislamiento estricto para el rol Formalizador: solo Formalización Física y su módulo contenedor
    const esRolFormalizador = (user.rol || '').trim().toLowerCase() === 'formalizador';
    if (esRolFormalizador) {
      const modulosPermitidos = [
        'Mi Perfil',
        'Métodos de Acceso',
        'Gestión Estudiantil',
        'Gestión de Admisiones',
        'Tarjeta: Formalización de Matrícula',
        'Formalización Física'
      ];
      return modulosPermitidos.includes(modulo);
    }

    const activeSchool = (localStorage.getItem('sigae_escuela_codigo') || user.id_escuela || 'sb').toLowerCase();

    // Aislamiento de escuela: si el usuario no tiene acceso a este plantel, denegar inmediatamente
    if (!tieneAccesoEscuela(activeSchool)) {
      return false;
    }

    const escPerms = fullPermisos?.[activeSchool] || permisos;

    // 1. Verificación directa del módulo en la matriz de la escuela activa
    const checkVal = (modName: string) => {
      if (!escPerms) return undefined;
      const val = escPerms[modName];
      if (val === undefined) return undefined;
      if (typeof val === 'boolean') return val;
      if (typeof val === 'object' && val !== null) {
        if (accion === 'ver') {
          return val.ver === true || val.crear === true || val.modificar === true || val.eliminar === true;
        }
        return val[accion] === true;
      }
      return false;
    };

    const directResult = checkVal(modulo);
    if (directResult !== undefined) {
      return directResult;
    }

    // 2. Mapeo de alias o variantes de nombres comunes (únicamente sinónimos de nomenclatura)
    const aliasMap: Record<string, string[]> = {
      "Configuración Escolar": ["Configuración del Sistema"],
      "Configuración del Sistema": ["Configuración Escolar"],
      "Encuestas": ["Encuesta", "Constructor de Encuestas"],
      "Encuesta": ["Encuestas", "Constructor de Encuestas"],
      "Constructor de Encuestas": ["Encuesta", "Encuestas"],
      "Función: Crear y Editar Encuestas": ["Función: Crear Encuestas", "Función: Crear o Editar Encuestas"],
      "Función: Crear o Editar Encuestas": ["Función: Crear y Editar Encuestas", "Función: Crear Encuestas"],
      "Función: Crear Encuestas": ["Función: Crear y Editar Encuestas", "Función: Crear o Editar Encuestas"],
      "Función: Responder Encuestas": ["Encuesta", "Encuestas", "Constructor de Encuestas"],
      "Función: Ver Respuestas y Estadísticas": ["Función: Ver Respuestas"],
      "Función: Ver Respuestas": ["Función: Ver Respuestas y Estadísticas"],
      "Cerebro de Sigma": ["Cerebro Sigma"],
      "Cerebro Sigma": ["Cerebro de Sigma"],
      "Instalación y Descargas": ["Instalar SIGAE", "Descargas", "Instalador"],
      "Instalar SIGAE": ["Instalación y Descargas", "Descargas", "Instalador"],
      "Tarjeta: Personal Institucional": ["Tarjeta: Personal Escolar DEP Oriente"],
      "Tarjeta: Personal Escolar DEP Oriente": ["Tarjeta: Personal Institucional"],
      "Tarjeta: Solicitudes de Cupos": ["Tarjeta: Solicitudes de Cupos por Plantel"],
      "Tarjeta: Solicitudes de Cupos por Plantel": ["Tarjeta: Solicitudes de Cupos"]
    };

    if (aliasMap[modulo]) {
      for (const alias of aliasMap[modulo]) {
        const aliasRes = checkVal(alias);
        if (aliasRes !== undefined) return aliasRes;
      }
    }

    // 3. Verificación a nivel raíz si la estructura guardada fue plana
    if (fullPermisos && fullPermisos[modulo] !== undefined) {
      const val = fullPermisos[modulo];
      if (typeof val === 'boolean') return val;
      if (typeof val === 'object' && val !== null) {
        if (accion === 'ver') {
          return val.ver === true || val.crear === true;
        }
        return val[accion] === true;
      }
      return false;
    }

    // 4. Si el permiso no está explícitamente configurado (undefined):
    const rolLower = (user?.rol || '').toLowerCase();
    const esRep = rolLower === 'representante';
    const esEst = rolLower === 'estudiante';

    // Defaults inteligentes para tarjetas del dashboard
    const defaultPermsByCard: Record<string, boolean> = {
      "Panel Principal": true,
      "Identidad Institucional": true,
      "Tarjeta: Misión Institucional": true,
      "Tarjeta: Visión Institucional": true,
      "Tarjeta: Valores Institucionales": true,
      "Tarjeta: Proyecto Comunitario (PEIC)": true,
      "Indicadores de Resumen": true,
      "Tarjeta: Rol y Seguridad de Claves": true,
      "Tarjeta: Estudiantes Vinculados y Avance": esRep,
      "Tarjeta: Rutas Escolares de Representados": esRep,
      "Tarjeta: Censo General de la Escuela": !esRep && !esEst,
      "Tarjeta: Personal Institucional": !esRep && !esEst,
      "Tarjeta: Solicitudes de Cupos": !esRep && !esEst,
      "Tarjeta: Ruta y Parada del Trabajador/Personal": !esRep && !esEst,
      "Tarjeta: Notificaciones y Avisos Activos": true,
    };

    if (defaultPermsByCard[modulo] !== undefined) {
      return defaultPermsByCard[modulo];
    }

    // Para directivos, si una pantalla no tiene switch explícito se permite por omisión
    if (esDirectivo) {
      return true;
    }

    return false;
  }, [user, fullPermisos, permisos, tieneAccesoEscuela, esDirectivo]);

  const tienePermisoEnEscuela = useCallback((escuelaCodigo: string, modulo: string, accion: string = 'ver') => {
    if (!user) return false;
    const rolNorm = (user.rol || '').trim().toLowerCase();
    if (rolNorm === 'superadmin' || rolNorm === 'administrador' || rolNorm === 'administradora') return true;

    const esRolFormalizador = (user.rol || '').trim().toLowerCase() === 'formalizador';
    if (esRolFormalizador) {
      const modulosPermitidos = [
        'Mi Perfil',
        'Métodos de Acceso',
        'Gestión Estudiantil',
        'Gestión de Admisiones',
        'Tarjeta: Formalización de Matrícula',
        'Formalización Física'
      ];
      return modulosPermitidos.includes(modulo);
    }

    const codNormalizado = escuelaCodigo.toLowerCase().trim();
    if (!tieneAccesoEscuela(codNormalizado)) return false;

    if (!fullPermisos || !fullPermisos[codNormalizado]) return false;
    const escPerms = fullPermisos[codNormalizado];
    const val = escPerms[modulo];
    if (val === undefined) return false;
    if (typeof val === 'boolean') return val;
    if (typeof val === 'object' && val !== null) {
      if (accion === 'ver') {
        return val.ver === true || val.crear === true || val.modificar === true || val.eliminar === true;
      }
      return val[accion] === true;
    }
    return false;
  }, [user, fullPermisos, tieneAccesoEscuela]);

  return { tienePermiso, tieneAccesoEscuela, tienePermisoEnEscuela, fullPermisos, permisos, loading, user };
};
