/**
 * ==============================================================================
 * ARCHIVO: src/context/SchoolContext.tsx
 * PROPÓSITO: Contexto global de React para la administración multi-escuela (Multi-Tenant).
 * CARACTERÍSTICAS:
 *  1. Sincronización en tiempo real con localStorage ('sigae_escuela_codigo').
 *  2. Consulta dinámica de todas las instituciones registradas en Supabase (`perfil_escuela`).
 *  3. Preserva 100% la compatibilidad con todos los módulos existentes del sistema.
 *  4. Código completamente comentado en español línea por línea.
 * ==============================================================================
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Interfaz que describe una escuela registrada en el sistema
export interface EscuelaItem {
  id_escuela: string;         // 'sb', 'lb', etc.
  nombre_institucion: string; // Nombre oficial (Ej: 'U.E. Santa Bárbara')
  codigo_dea: string;         // Código ministerial DEA
  rif: string;                // RIF fiscal
  direccion: string;          // Dirección física
  logo_url?: string;          // Ruta al escudo
  peic?: string;              // Proyecto Educativo Integral Comunitario
}

// Escuelas de respaldo por defecto si no hay conexión temporal con Supabase
const ESCUELAS_DEFAULT: EscuelaItem[] = [
  {
    id_escuela: 'sb',
    nombre_institucion: 'U.E. Santa Bárbara',
    codigo_dea: 'OD05241620',
    rif: 'J-30589123-0',
    direccion: 'Sector Santa Bárbara, Monagas, Venezuela',
    logo_url: '/assets/img/logo_sb.png',
    peic: 'Innovación pedagógica, ciencia y valores comunitarios.'
  },
  {
    id_escuela: 'lb',
    nombre_institucion: 'U.E. Libertador Bolívar',
    codigo_dea: 'OD05241621',
    rif: 'J-30589124-0',
    direccion: 'Av. Bolívar, Punta de Mata, Monagas, Venezuela',
    logo_url: '/assets/img/logo_lb.png',
    peic: 'Educación bolivariana, amor patrio y liderazgo productivo.'
  }
];

// Estructura del Contexto accesible desde cualquier componente
interface SchoolContextType {
  // Código de la escuela actualmente activa ('sb', 'lb', etc.)
  escuelaActiva: string;
  // Objeto completo con los datos institucionales de la escuela activa
  datosEscuelaActiva: EscuelaItem | null;
  // Listado de todas las escuelas disponibles en el sistema
  escuelas: EscuelaItem[];
  // Estado de carga inicial
  cargandoEscuelas: boolean;
  // Función para cambiar de institución activa
  cambiarEscuela: (idEscuela: string) => void;
  // Estado para controlar el modal selector global de escuela
  selectorModalAbierto: boolean;
  setSelectorModalAbierto: (abierto: boolean) => void;
}

// Creamos el contexto con valores iniciales
const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Leemos la escuela guardada en localStorage o usamos 'sb' como inicial
  const [escuelaActiva, setEscuelaActivaState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sigae_escuela_codigo') || 'sb';
    }
    return 'sb';
  });

  // 2. Lista de escuelas cargadas desde Supabase
  const [escuelas, setEscuelas] = useState<EscuelaItem[]>(ESCUELAS_DEFAULT);
  const [cargandoEscuelas, setCargandoEscuelas] = useState<boolean>(true);

  // 3. Control del modal selector de escuela
  const [selectorModalAbierto, setSelectorModalAbierto] = useState<boolean>(false);

  // 4. Efecto para consultar las escuelas reales en Supabase al arrancar
  useEffect(() => {
    let montado = true;

    async function cargarEscuelasDesdeBD() {
      try {
        const { data, error } = await supabase
          .from('perfil_escuela')
          .select('id_escuela, nombre_institucion, codigo_dea, rif, direccion, peic, logo_url');

        if (error) {
          console.warn('[SchoolContext] Aviso al cargar perfil_escuela:', error.message);
        } else if (data && data.length > 0 && montado) {
          // Asignamos el logo oficial si no viene en el campo
          const normalizadas: EscuelaItem[] = data.map((esc: any) => ({
            ...esc,
            logo_url: esc.logo_url || `/assets/img/logo_${esc.id_escuela}.png`
          }));
          setEscuelas(normalizadas);
        }
      } catch (err) {
        console.error('[SchoolContext] Error de red:', err);
      } finally {
        if (montado) setCargandoEscuelas(false);
      }
    }

    cargarEscuelasDesdeBD();

    return () => {
      montado = false;
    };
  }, []);

  // 5. Función oficial para cambiar de escuela activa
  const cambiarEscuela = (idEscuela: string) => {
    setEscuelaActivaState(idEscuela);
    if (typeof window !== 'undefined') {
      // Sincronizamos con las claves exactas que usan todos los módulos existentes
      localStorage.setItem('sigae_escuela_codigo', idEscuela);

      const escObj = escuelas.find(e => e.id_escuela === idEscuela);
      const nombreEsc = escObj?.nombre_institucion || (idEscuela === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar');
      localStorage.setItem('sigae_escuela_activa', nombreEsc);

      // Si hay un usuario con sesión abierta, actualizamos también su id_escuela en memoria
      const storedUsr = localStorage.getItem('usuario_sigae');
      if (storedUsr) {
        try {
          const usr = JSON.parse(storedUsr);
          usr.id_escuela = idEscuela;
          usr.nombre_escuela = nombreEsc;
          localStorage.setItem('usuario_sigae', JSON.stringify(usr));
        } catch (_) {}
      }
    }
  };

  // Buscamos los datos completos de la escuela que está activa
  const datosEscuelaActiva = escuelas.find(e => e.id_escuela === escuelaActiva) || escuelas[0] || null;

  return (
    <SchoolContext.Provider
      value={{
        escuelaActiva,
        datosEscuelaActiva,
        escuelas,
        cargandoEscuelas,
        cambiarEscuela,
        selectorModalAbierto,
        setSelectorModalAbierto
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

// Hook personalizado para consumir el contexto fácilmente
export const useSchool = (): SchoolContextType => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool debe ser utilizado dentro de un <SchoolProvider>');
  }
  return context;
};
