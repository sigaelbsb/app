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
      cachePermisos = null;
      cacheFullPermisos = null;
      setPermisos(null);
      setFullPermisos(null);
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

          let esc = usr.id_escuela || localStorage.getItem('sigae_escuela_codigo') || 'sb';

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
