import { supabase } from './supabase';

export const auditar = async (modulo: string, accion: string, detalles: string = '') => {
  const stored = localStorage.getItem('usuario_sigae');
  if (!stored) return;
  try {
    const usuario = JSON.parse(stored);
    const codEscuela = usuario.id_escuela || localStorage.getItem('sigae_escuela_codigo') || 'sb';
    
    await supabase.from('historial_auditoria').insert([{
      usuario_cedula: usuario.cedula,
      usuario_nombre: usuario.nombre,
      escuela: codEscuela,
      modulo: modulo,
      accion: accion,
      detalles: detalles
    }]);
  } catch (e) {
    console.warn("Error escribiendo en auditoría:", e);
  }
};
