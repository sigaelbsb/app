import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

let cachePermisos: any = null;
let cacheFullPermisos: any = null;

export const usePermisos = () => {
  const [permisos, setPermisos] = useState<any>(cachePermisos);
  const [fullPermisos, setFullPermisos] = useState<any>(cacheFullPermisos);
  const [loading, setLoading] = useState(!cachePermisos);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('usuario_sigae');
    if (!stored) {
      setLoading(false);
      return;
    }
    const usr = JSON.parse(stored);
    setUser(usr);

    if (cachePermisos && cacheFullPermisos) {
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
          setFullPermisos(parsed);

          const esc = usr.id_escuela || localStorage.getItem('sigae_escuela_codigo') || 'sb';
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

  const tienePermiso = (modulo: string, accion: string = 'ver') => {
    if (user?.rol === 'SuperAdmin') return true;
    if (!permisos || !permisos[modulo]) return false;
    return permisos[modulo][accion] === true;
  };

  const tieneAccesoEscuela = (escuelaCodigo: string) => {
    if (user?.rol === 'SuperAdmin') return true;
    if (!fullPermisos) return false;
    const privsEscuela = fullPermisos[escuelaCodigo];
    if (!privsEscuela) return false;
    if (privsEscuela.hasOwnProperty('__acceso_plantel__')) {
      return privsEscuela['__acceso_plantel__']?.ver === true;
    }
    // retrocompatibilidad
    for (let mod in privsEscuela) {
      if (privsEscuela[mod] && privsEscuela[mod].ver === true) return true;
      if (privsEscuela[mod] === true) return true;
    }
    return false;
  };

  const tienePermisoEnEscuela = (escuelaCodigo: string, modulo: string, accion: string = 'ver') => {
    if (user?.rol === 'SuperAdmin') return true;
    if (!fullPermisos || !fullPermisos[escuelaCodigo]) return false;
    const escPerms = fullPermisos[escuelaCodigo];
    if (!escPerms[modulo]) return false;
    return escPerms[modulo][accion] === true;
  };

  return { tienePermiso, tieneAccesoEscuela, tienePermisoEnEscuela, fullPermisos, permisos, loading, user };
};
