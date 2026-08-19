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

    const currentEsc = localStorage.getItem('sigae_escuela_codigo') || usr.id_escuela || 'sb';

    const fetchPermisos = async () => {
      try {
        // Si el rol no existe en la tabla de roles pero es directivo, fallback a Administrador
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
    if (user.rol === 'SuperAdmin' || esDirectivo) return true;
    
    // Si el usuario tiene una escuela fija asignada y es invitado/docente en un solo plantel
    if (user.id_escuela && user.id_escuela !== 'ambas' && user.id_escuela !== 'todas') {
      if (user.id_escuela === escuelaCodigo) return true;
    }

    if (!fullPermisos) return true; // Si no hay permisos cargados, no bloquear por defecto
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
