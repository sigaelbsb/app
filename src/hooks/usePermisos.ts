import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

let cachePermisos: any = null;
let cacheFullPermisos: any = null;
let cacheUserRol: string | null = null;
let cacheEscuela: string | null = null;

export const usePermisos = () => {
  const [permisos, setPermisos] = useState<any>(cachePermisos);
  const [fullPermisos, setFullPermisos] = useState<any>(cacheFullPermisos);
  const [loading, setLoading] = useState(!cachePermisos);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('usuario_sigae');
    if (!stored) {
      cachePermisos = null;
      cacheFullPermisos = null;
      cacheUserRol = null;
      cacheEscuela = null;
      setPermisos(null);
      setFullPermisos(null);
      setLoading(false);
      return;
    }
    const usr = JSON.parse(stored);
    setUser(usr);

    const currentEsc = localStorage.getItem('sigae_escuela_codigo') || usr.id_escuela || 'sb';

    if (cachePermisos && cacheFullPermisos && cacheUserRol === usr.rol && cacheEscuela === currentEsc) {
      setPermisos(cachePermisos);
      setFullPermisos(cacheFullPermisos);
      setLoading(false);
      return;
    }

    const fetchPermisos = async () => {
      try {
        const { data, error } = await supabase
          .from('roles')
          .select('permisos')
          .eq('nombre', usr.rol)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          let parsed: any = {};
          if (typeof data.permisos === 'string') {
            try { parsed = JSON.parse(data.permisos); } catch (e) {}
          } else {
            parsed = data.permisos || {};
          }
          cacheFullPermisos = parsed;
          cacheUserRol = usr.rol;
          cacheEscuela = currentEsc;
          setFullPermisos(parsed);

          let esc = currentEsc;

          // Verificar si el usuario tiene acceso a la escuela seleccionada
          const tieneAcceso = (cod: string) => {
            if (usr.rol === 'SuperAdmin') return true;
            const privs = parsed[cod];
            if (!privs) return false;
            if (privs.hasOwnProperty('__acceso_plantel__')) {
              return privs['__acceso_plantel__']?.ver === true;
            }
            for (let mod in privs) {
              if (privs[mod] && (privs[mod].ver === true || privs[mod] === true)) return true;
            }
            return false;
          };

          if (usr.rol !== 'SuperAdmin' && !tieneAcceso(esc)) {
            const otherEsc = esc === 'sb' ? 'lb' : 'sb';
            if (tieneAcceso(otherEsc)) {
              esc = otherEsc;
              localStorage.setItem('sigae_escuela_codigo', otherEsc);
              localStorage.setItem('sigae_escuela_activa', otherEsc === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
              usr.id_escuela = otherEsc;
              usr.nombre_escuela = otherEsc === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
              localStorage.setItem('usuario_sigae', JSON.stringify(usr));
              window.location.reload();
              return;
            }
          }

          const escPerms = parsed[esc] || parsed || {};
          cachePermisos = escPerms;
          setPermisos(escPerms);
        }
      } catch (e) {
        console.error("Error fetching permissions:", e);
      }
      setLoading(false);
    };

    fetchPermisos();
  }, []);

  const tieneAccesoEscuela = useCallback((escuelaCodigo: string) => {
    if (!user) return false;
    if (user.rol === 'SuperAdmin') return true;
    
    if (!fullPermisos) return false;
    const privsEscuela = fullPermisos[escuelaCodigo];
    if (!privsEscuela) return false;
    
    if (privsEscuela.hasOwnProperty('__acceso_plantel__')) {
      return privsEscuela['__acceso_plantel__']?.ver === true;
    }
    
    // Retrocompatibilidad: buscar si tiene al menos un módulo activo
    for (let mod in privsEscuela) {
      if (privsEscuela[mod] && (privsEscuela[mod].ver === true || privsEscuela[mod] === true)) {
        return true;
      }
    }
    return false;
  }, [user, fullPermisos]);

  const tienePermiso = useCallback((modulo: string, accion: string = 'ver') => {
    if (!user || !user.rol) return false;
    if (user.rol === 'SuperAdmin') return true;

    // Módulos básicos de autogestión de cuenta permitidos a cualquier usuario autenticado
    if (modulo === "Mi Perfil" || modulo === "Métodos de Acceso") {
      return true;
    }

    const activeSchool = localStorage.getItem('sigae_escuela_codigo') || user.id_escuela || 'sb';

    // Si el rol no tiene acceso al plantel activo, no puede ver ningún módulo de ese plantel
    if (!tieneAccesoEscuela(activeSchool)) {
      return false;
    }

    const escPerms = fullPermisos?.[activeSchool] || permisos;
    if (!escPerms) return false;

    // 1. Verificación directa del módulo en la matriz de la escuela activa
    const checkModulo = (modName: string) => {
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

    const directResult = checkModulo(modulo);
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
      "Creador de Flyers": ["Diseños"],
      "Creador de Invitaciones": ["Diseños"],
      "Creador de Tapas": ["Diseños"],
      "Creador de Comunicados": ["Diseños"],
      "Creador de Cumpleaños": ["Diseños"]
    };

    if (aliasMap[modulo]) {
      for (const alias of aliasMap[modulo]) {
        const aliasRes = checkModulo(alias);
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

    // Por defecto, si no está en la matriz de permisos otorgados, el acceso es DENEGADO
    return false;
  }, [user, fullPermisos, permisos, tieneAccesoEscuela]);

  const tienePermisoEnEscuela = useCallback((escuelaCodigo: string, modulo: string, accion: string = 'ver') => {
    if (!user) return false;
    if (user.rol === 'SuperAdmin') return true;
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
  }, [user, fullPermisos, tieneAccesoEscuela]);

  return { tienePermiso, tieneAccesoEscuela, tienePermisoEnEscuela, fullPermisos, permisos, loading, user };
};
