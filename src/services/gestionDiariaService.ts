import { supabase } from '../lib/supabase';

export interface ParticipantesReporte {
  estudiantes: number;
  docentes: number;
  directivos: number;
  representantes: number;
  otros?: number;
  total: number;
}

export interface ReporteGestionDiaria {
  id: string;
  escuela_codigo: 'sb' | 'lb' | 'ambas';
  region: string;
  division: string;
  gerencia: string;
  proceso: string;
  ano_escolar: string;
  actividad: string;
  fecha_actividad: string;
  lugar_actividad: string;
  fecha_lugar?: string;
  descripcion: string;
  participantes: ParticipantesReporte;
  fuente: string;
  hora_publicacion?: string;
  imagenes: string[];
  banner_superior?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'archivado';
  observaciones_aprobacion?: string;
  aprobado_por?: string;
  aprobado_en?: string;
  fecha_inicio_vigencia: string; // ISO string
  fecha_fin_vigencia: string; // ISO string (por defecto 7 días después)
  fijado_carrusel?: boolean;
  creado_por_nombre: string;
  creado_por_cedula: string;
  creado_por_rol: string;
  created_at: string;
}

const STORAGE_KEY = 'sigae_reportes_gestion_diaria_v1';

// Semilla inicial basada estrictamente en el formato real del usuario
const SEED_REPORTES: ReporteGestionDiaria[] = [
  {
    id: 'rep-bienvenida-2026-sb',
    escuela_codigo: 'sb',
    region: 'Oriente - Este',
    division: 'Punta de Mata',
    gerencia: 'Recursos Humanos / RRHH',
    proceso: 'Escuela UE Santa Bárbara',
    ano_escolar: '2026-2027',
    actividad: 'Jornada de Integración y Bienvenida Pedagógica 2026-2027 para los estudiantes de Media General',
    fecha_actividad: '2026-10-05',
    lugar_actividad: 'Cancha de la institución UE Santa Bárbara',
    descripcion: 'La institución dió inicio al año escolar con un evento en la cancha del plantel, ambientada con un espacio fotográfico para los estudiantes. La jornada incluyó una presentación folklórica y danzas, seguida de dinámicas de integración y la entrega de refrigerios y cotillones. Más allá de la celebración, la actividad buscó fortalecer el aspecto socioemocional, promoviendo un clima escolar positivo que favorezca la motivación y el sentido de pertenencia desde el primer día.',
    participantes: {
      estudiantes: 306,
      docentes: 48,
      directivos: 3,
      representantes: 42,
      total: 399
    },
    fuente: 'Recursos Humanos / UE Santa Bárbara',
    hora_publicacion: '5:10 p. m.',
    imagenes: [
      '/assets/img/gestion_diaria/reporte_ejemplo_collage.png',
      '/assets/img/gestion_diaria/reporte_ejemplo_banner.png'
    ],
    banner_superior: '/assets/img/gestion_diaria/reporte_ejemplo_collage.png',
    estado: 'aprobado',
    aprobado_por: 'Dirección General de Educación PDVSA',
    aprobado_en: new Date().toISOString(),
    fecha_inicio_vigencia: new Date().toISOString(),
    fecha_fin_vigencia: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    fijado_carrusel: true,
    creado_por_nombre: 'Coordinación de RRHH',
    creado_por_cedula: '12345678',
    creado_por_rol: 'Coordinador',
    created_at: new Date().toISOString()
  },
  {
    id: 'rep-apertura-2026-lb',
    escuela_codigo: 'lb',
    region: 'Oriente - Este',
    division: 'Punta de Mata',
    gerencia: 'Recursos Humanos / RRHH',
    proceso: 'Escuela UE Libertador Bolívar',
    ano_escolar: '2026-2027',
    actividad: 'Recepción y Apertura del Período Académico con Dotación de Aulas y Rutas Escolares',
    fecha_actividad: '2026-10-04',
    lugar_actividad: 'Patio Cívico y Aulas U.E. Libertador Bolívar, Campo Miraflores',
    descripcion: 'Inicio formal de actividades académicas con recibimiento a la comunidad estudiantil de Educación Media. Se realizó el pase de lista de rutas de transporte y la bienvenida a nuevos ingresos con entrega de guías pedagógicas.',
    participantes: {
      estudiantes: 285,
      docentes: 38,
      directivos: 4,
      representantes: 50,
      total: 377
    },
    fuente: 'Dirección U.E. Libertador Bolívar / RRHH',
    hora_publicacion: '11:30 a. m.',
    imagenes: [
      '/assets/img/gestion_diaria/reporte_ejemplo_banner.png'
    ],
    banner_superior: '/assets/img/gestion_diaria/reporte_ejemplo_banner.png',
    estado: 'aprobado',
    aprobado_por: 'Dirección General',
    aprobado_en: new Date().toISOString(),
    fecha_inicio_vigencia: new Date().toISOString(),
    fecha_fin_vigencia: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    fijado_carrusel: true,
    creado_por_nombre: 'Coordinador Pedagógico',
    creado_por_cedula: '87654321',
    creado_por_rol: 'Coordinador',
    created_at: new Date().toISOString()
  },
  {
    id: 'rep-pendiente-muestra-1',
    escuela_codigo: 'sb',
    region: 'Oriente - Este',
    division: 'Punta de Mata',
    gerencia: 'Recursos Humanos / RRHH',
    proceso: 'Escuela UE Santa Bárbara',
    ano_escolar: '2026-2027',
    actividad: 'Diagnóstico Pedagógico y Taller de Habilidades Socioemocionales',
    fecha_actividad: '2026-10-06',
    lugar_actividad: 'Salón de Usos Múltiples UE Santa Bárbara',
    descripcion: 'Desarrollo de mesas de trabajo interdisciplinarias con los docentes de aula para unificar criterios de evaluación diagnóstica en el inicio del primer lapso pedagógico.',
    participantes: {
      estudiantes: 110,
      docentes: 24,
      directivos: 2,
      representantes: 15,
      total: 151
    },
    fuente: 'Coordinación Pedagógica Docente',
    hora_publicacion: '2:15 p. m.',
    imagenes: [
      '/assets/img/gestion_diaria/reporte_ejemplo_collage.png'
    ],
    estado: 'pendiente',
    fecha_inicio_vigencia: new Date().toISOString(),
    fecha_fin_vigencia: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    fijado_carrusel: false,
    creado_por_nombre: 'Prof. Carmen Morales',
    creado_por_cedula: '15487963',
    creado_por_rol: 'Docente',
    created_at: new Date().toISOString()
  }
];

function cargarDesdeLocalStorage(): ReporteGestionDiaria[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REPORTES));
      return SEED_REPORTES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REPORTES));
      return SEED_REPORTES;
    }
    return parsed;
  } catch (e) {
    return SEED_REPORTES;
  }
}

function guardarEnLocalStorage(reportes: ReporteGestionDiaria[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reportes));
    window.dispatchEvent(new CustomEvent('sigae-reportes-actualizados', { detail: reportes }));
  } catch (e) {
    console.error('Error guardando reportes de gestión diaria en localStorage:', e);
  }
}

export const gestionDiariaService = {
  // Obtiene los reportes que deben mostrarse en el carrusel (Aprobados y vigentes dentro de los 7 días o fijados)
  async obtenerReportesCarrusel(escuelaCodigo?: string): Promise<ReporteGestionDiaria[]> {
    try {
      const { data, error } = await supabase
        .from('reportes_gestion_diaria')
        .select('*')
        .eq('estado', 'aprobado')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return this.filtrarVigentes(data, escuelaCodigo);
      }
    } catch (e) {
      // Fallback a localStorage
    }

    const locales = cargarDesdeLocalStorage();
    return this.filtrarVigentes(locales, escuelaCodigo);
  },

  // Filtra por escuela y vigencia de 7 días
  filtrarVigentes(reportes: ReporteGestionDiaria[], escuelaCodigo?: string): ReporteGestionDiaria[] {
    const ahora = new Date().getTime();
    return reportes.filter(r => {
      if (r.estado !== 'aprobado') return false;

      // Filtrado por escuela activa
      if (escuelaCodigo && r.escuela_codigo !== 'ambas' && r.escuela_codigo !== escuelaCodigo) {
        return false;
      }

      // Si está fijado manualmente, se muestra siempre
      if (r.fijado_carrusel) return true;

      // Si tiene fecha de fin de vigencia, comprobar si aún no expira
      if (r.fecha_fin_vigencia) {
        const fin = new Date(r.fecha_fin_vigencia).getTime();
        return ahora <= fin;
      }

      // Por defecto vigencia de 7 días desde created_at
      const inicio = new Date(r.fecha_inicio_vigencia || r.created_at).getTime();
      const sieteDiasMs = 7 * 24 * 60 * 60 * 1000;
      return (ahora - inicio) <= sieteDiasMs;
    });
  },

  // Obtiene todos los reportes (para administración, filtros por estado)
  async obtenerTodos(escuelaCodigo?: string): Promise<ReporteGestionDiaria[]> {
    try {
      const { data, error } = await supabase
        .from('reportes_gestion_diaria')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        if (!escuelaCodigo) return data;
        return data.filter((r: any) => r.escuela_codigo === 'ambas' || r.escuela_codigo === escuelaCodigo);
      }
    } catch (e) {}

    const locales = cargarDesdeLocalStorage();
    if (!escuelaCodigo) return locales;
    return locales.filter(r => r.escuela_codigo === 'ambas' || r.escuela_codigo === escuelaCodigo);
  },

  // Crear un nuevo reporte de gestión diaria (queda en estado 'pendiente' para aprobación)
  async crearReporte(nuevo: Omit<ReporteGestionDiaria, 'id' | 'created_at'>): Promise<ReporteGestionDiaria> {
    const id = 'rep-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const ahora = new Date().toISOString();
    
    // Programar duración por defecto de 7 días (1 semana)
    const fechaFin = nuevo.fecha_fin_vigencia || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const reporteCompleto: ReporteGestionDiaria = {
      ...nuevo,
      id,
      estado: nuevo.estado || 'pendiente',
      fecha_inicio_vigencia: nuevo.fecha_inicio_vigencia || ahora,
      fecha_fin_vigencia: fechaFin,
      fijado_carrusel: nuevo.fijado_carrusel ?? false,
      created_at: ahora
    };

    // Intentar en Supabase
    try {
      await supabase.from('reportes_gestion_diaria').insert([reporteCompleto]);
    } catch (e) {}

    // Guardar en LocalStorage
    const actuales = cargarDesdeLocalStorage();
    const actualizados = [reporteCompleto, ...actuales];
    guardarEnLocalStorage(actualizados);

    return reporteCompleto;
  },

  // Aprobar un reporte para publicación en el carrusel
  async aprobarReporte(id: string, usuarioAprobador: { nombre: string; rol?: string }, diasVigencia = 7): Promise<boolean> {
    const ahora = new Date().toISOString();
    const fechaFin = new Date(Date.now() + diasVigencia * 24 * 60 * 60 * 1000).toISOString();

    try {
      await supabase
        .from('reportes_gestion_diaria')
        .update({
          estado: 'aprobado',
          aprobado_por: usuarioAprobador.nombre,
          aprobado_en: ahora,
          fecha_inicio_vigencia: ahora,
          fecha_fin_vigencia: fechaFin
        })
        .eq('id', id);
    } catch (e) {}

    const actuales = cargarDesdeLocalStorage();
    const index = actuales.findIndex(r => r.id === id);
    if (index !== -1) {
      actuales[index].estado = 'aprobado';
      actuales[index].aprobado_por = usuarioAprobador.nombre;
      actuales[index].aprobado_en = ahora;
      actuales[index].fecha_inicio_vigencia = ahora;
      actuales[index].fecha_fin_vigencia = fechaFin;
      guardarEnLocalStorage(actuales);
      return true;
    }
    return false;
  },

  // Rechazar un reporte con nota u observación
  async rechazarReporte(id: string, motivo: string, usuarioRevisor: { nombre: string }): Promise<boolean> {
    try {
      await supabase
        .from('reportes_gestion_diaria')
        .update({
          estado: 'rechazado',
          observaciones_aprobacion: motivo,
          aprobado_por: usuarioRevisor.nombre,
          aprobado_en: new Date().toISOString()
        })
        .eq('id', id);
    } catch (e) {}

    const actuales = cargarDesdeLocalStorage();
    const index = actuales.findIndex(r => r.id === id);
    if (index !== -1) {
      actuales[index].estado = 'rechazado';
      actuales[index].observaciones_aprobacion = motivo;
      actuales[index].aprobado_por = usuarioRevisor.nombre;
      actuales[index].aprobado_en = new Date().toISOString();
      guardarEnLocalStorage(actuales);
      return true;
    }
    return false;
  },

  // Fijar o desfijar en carrusel
  async toggleFijadoCarrusel(id: string): Promise<boolean> {
    const actuales = cargarDesdeLocalStorage();
    const item = actuales.find(r => r.id === id);
    if (!item) return false;

    const nuevoValor = !item.fijado_carrusel;
    try {
      await supabase
        .from('reportes_gestion_diaria')
        .update({ fijado_carrusel: nuevoValor })
        .eq('id', id);
    } catch (e) {}

    item.fijado_carrusel = nuevoValor;
    guardarEnLocalStorage(actuales);
    return true;
  },

  // Eliminar reporte
  async eliminarReporte(id: string): Promise<boolean> {
    try {
      await supabase.from('reportes_gestion_diaria').delete().eq('id', id);
    } catch (e) {}

    const actuales = cargarDesdeLocalStorage();
    const filtrados = actuales.filter(r => r.id !== id);
    guardarEnLocalStorage(filtrados);
    return true;
  },

  // Obtiene la cuenta de reportes pendientes de moderación
  async contarPendientes(escuelaCodigo?: string): Promise<number> {
    const todos = await this.obtenerTodos(escuelaCodigo);
    return todos.filter(r => r.estado === 'pendiente').length;
  }
};
