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
    
    // Aislamiento estricto: si el usuario pertenece a una única escuela, forzarla
    if ((userEsc === 'sb' || userEsc === 'lb') && currentEsc !== userEsc) {
      currentEsc = userEsc;
      localStorage.setItem('sigae_escuela_codigo', userEsc);
      localStorage.setItem('sigae_escuela_activa', userEsc === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
      usr.id_escuela = userEsc;
      usr.nombre_escuela = userEsc === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
      localStorage.setItem('usuario_sigae', JSON.stringify(usr));
    }

    const fetchPermisos = async () => {
      try {
        let targetRol = usr.rol;
        let { data, error } = await supabase
          .from('roles')
          .select('permisos')
          .eq('nombre', targetRol)
          .maybeSingle();

        if (!data && ['SuperAdmin', 'Director', 'Directora', 'Subdirector', 'Coordinador'].includes(usr.rol)) {
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
    return ['SuperAdmin', 'Director', 'Directora', 'Subdirector', 'Subdirectora'].includes(rol);
  }, [user]);

  const tieneAccesoEscuela = useCallback((escuelaCodigo: string) => {
    if (!user) return false;
    
    // SuperAdmin siempre tiene acceso global
    if (user.rol === 'SuperAdmin') return true;

    // AISLAMIENTO ESTRICTO POR PLANTEL ASIGNADO:
    // Si el usuario pertenece a 'sb', NO PUEDE ver 'lb'. Si pertenece a 'lb', NO PUEDE ver 'sb'.
    const userEsc = (user.id_escuela || '').trim().toLowerCase();
    if (userEsc === 'sb' || userEsc === 'lb') {
      return userEsc === escuelaCodigo.toLowerCase();
    }

    // Directivos con rol general y acceso dual ('ambas' / 'todas')
    if (esDirectivo && (!userEsc || userEsc === 'ambas' || userEsc === 'todas')) {
      return true;
    }

    // Representantes o usuarios especiales con asignación dual 'ambas'
    if (userEsc === 'ambas' || userEsc === 'todas') {
      if (!fullPermisos) return true;
      const privsEscuela = fullPermisos[escuelaCodigo];
      if (!privsEscuela) return false;
      if (privsEscuela.hasOwnProperty('__acceso_plantel__')) {
        return privsEscuela['__acceso_plantel__']?.ver === true;
      }
      return true;
    }

    // Para cualquier otro caso, verificar permisos por plantel
    if (!fullPermisos) return false;
    const privsEscuela = fullPermisos[escuelaCodigo];
    if (!privsEscuela) return false;
    
    if (privsEscuela.hasOwnProperty('__acceso_plantel__')) {
      return privsEscuela['__acceso_plantel__']?.ver === true;
    }
    
    for (let mod in privsEscuela) {
      if (privsEscuela[mod] && (privsEscuela[mod].ver === true || privsEscuela[mod] === true)) {
        return true;
      }
    }
    return false;
  }, [user, fullPermisos, esDirectivo]);

  const tienePermiso = useCallback((modulo: string, accion: string = 'ver') => {
    if (!user || !user.rol) return false;
    if (user.rol === 'SuperAdmin' || esDirectivo) return true;

    // Autogestión básica de cuenta disponible a todo usuario autenticado
    if (modulo === "Mi Perfil" || modulo === "Métodos de Acceso") {
      return true;
    }

    const activeSchool = localStorage.getItem('sigae_escuela_codigo') || user.id_escuela || 'sb';

    // Aislamiento de escuela: si el usuario no tiene acceso a este plantel, denegar inmediatamente
    if (!tieneAccesoEscuela(activeSchool)) {
      return false;
    }

    const escPerms = fullPermisos?.[activeSchool] || permisos;
    if (!escPerms) return false;

    // 1. Verificación directa del módulo en la matriz de la escuela activa
    const checkVal = (modName: string) => {
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

    // 2. Mapeo de alias o variantes de nombres comunes
    const aliasMap: Record<string, string[]> = {
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
      "Galería y Plantillas": ["Diseños"],
      "Creador de Certificados": ["Diseños"],
      "Creador de Flyers": ["Diseños"],
      "Creador de Invitaciones": ["Diseños"],
      "Creador de Tapas": ["Diseños"],
      "Creador de Comunicados": ["Diseños"],
      "Creador de Cumpleaños": ["Diseños"]
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
    }

    return false;
  }, [user, fullPermisos, permisos, tieneAccesoEscuela, esDirectivo]);

  const tienePermisoEnEscuela = useCallback((escuelaCodigo: string, modulo: string, accion: string = 'ver') => {
    if (!user) return false;
    if (user.rol === 'SuperAdmin' || esDirectivo) return true;
    if (!tieneAccesoEscuela(escuelaCodigo)) return false;

    if (!fullPermisos || !fullPermisos[escuelaCodigo]) return false;
    const escPerms = fullPermisos[escuelaCodigo];
    const val = escPerms[modulo];
    if (val === undefined) return false;
    if (typeof val === 'boolean') return val;
    if (typeof val === 'object' && val !== null) {
      if (accion === 'ver') {
        return val.ver === true || val.crear === true;
      }
      return val[accion] === true;
    }
    return false;
  }, [user, fullPermisos, tieneAccesoEscuela, esDirectivo]);

  return { tienePermiso, tieneAccesoEscuela, tienePermisoEnEscuela, fullPermisos, permisos, loading, user };
};
