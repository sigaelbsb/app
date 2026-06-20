import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';

interface Ruta {
  id_ruta: string;
  nombre_ruta: string;
  placa_vehiculo: string;
  conductor: string;
  telefono_conductor: string;
  capacidad: number;
  estado: string;
  id_escuela: string;
}

interface Parada {
  id_parada: string;
  id_ruta: string;
  nombre_parada: string;
  hora_estimada: string;
  orden: number;
  referencia_ubicacion: string;
}

interface Asignacion {
  id_asignacion: string;
  id_ruta: string;
  id_parada: string | null;
  estudiante_cedula: string;
  nombre_estudiante: string;
}

interface Guardia {
  id_guardia: string;
  id_ruta: string;
  cedula: string;
  nombre_completo: string;
  rol_guardia: string;
}

interface ViajeActivo {
  id_viaje: string;
  id_ruta: string;
  estado: string;
  parada_actual_id: string | null;
  pasajeros_a_bordo: number;
  iniciado_por: string;
  iniciado_en: string | null;
  actualizado_en: string;
}

// Student boarding log state inside trip tracking
interface BoardingStatus {
  [cedula: string]: boolean;
}

export const TransporteEscolar = () => {
  const navigate = useNavigate();
  const { tienePermiso, loading: permLoading, user } = usePermisos();
  const Swal = (window as any).Swal;

  // Active School Code
  const escuelaCodigo = localStorage.getItem('sigae_escuela_codigo') || 'sb';

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'visor' | 'operativo' | 'rutas' | 'paradas' | 'asignar'>('visor');

  // Master Data
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [paradas, setParadas] = useState<Parada[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [guardias, setGuardias] = useState<Guardia[]>([]);
  const [viajes, setViajes] = useState<ViajeActivo[]>([]);
  const [alumnosDisponibles, setAlumnosDisponibles] = useState<any[]>([]);

  // Loading and Database Check
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Forms state
  // 1. Ruta Form
  const [formRutaId, setFormRutaId] = useState('');
  const [formRutaNombre, setFormRutaNombre] = useState('');
  const [formRutaPlaca, setFormRutaPlaca] = useState('');
  const [formRutaConductor, setFormRutaConductor] = useState('');
  const [formRutaTelefono, setFormRutaTelefono] = useState('');
  const [formRutaCapacidad, setFormRutaCapacidad] = useState(30);

  // 2. Parada Form
  const [formParadaId, setFormParadaId] = useState('');
  const [formParadaRuta, setFormParadaRuta] = useState('');
  const [formParadaNombre, setFormParadaNombre] = useState('');
  const [formParadaHora, setFormParadaHora] = useState('');
  const [formParadaOrden, setFormParadaOrden] = useState(1);
  const [formParadaReferencia, setFormParadaReferencia] = useState('');

  // 3. Asignación Form
  const [formAsigEstudiante, setFormAsigEstudiante] = useState('');
  const [formAsigRuta, setFormAsigRuta] = useState('');
  const [formAsigParada, setFormAsigParada] = useState('');

  // 4. Guardia Form
  const [formGuardiaCedula, setFormGuardiaCedula] = useState('');
  const [formGuardiaNombre, setFormGuardiaNombre] = useState('');
  const [formGuardiaRuta, setFormGuardiaRuta] = useState('');
  const [formGuardiaRol, setFormGuardiaRol] = useState('Docente de Guardia');

  // Operative Tracker state
  const [operativoRutaSeleccionada, setOperativoRutaSeleccionada] = useState('');
  const [boardingLog, setBoardingLog] = useState<BoardingStatus>({});

  // Permisos
  const pRutas = tienePermiso('Tarjeta: Gestión de Rutas', 'ver');
  const pParadas = tienePermiso('Tarjeta: Gestión de Paradas', 'ver');
  const pOperacion = tienePermiso('Tarjeta: Operación (Tracking)', 'ver');
  const pVisor = tienePermiso('Tarjeta: Visor de Recorrido', 'ver');

  const hasModuloAcceso = tienePermiso('Transporte Escolar', 'ver');
  const isRestricted = !permLoading && !hasModuloAcceso;

  useEffect(() => {
    if (!permLoading && hasModuloAcceso) {
      cargarTodo();
    }
  }, [permLoading]);

  // Adjust active tab based on first available permission
  useEffect(() => {
    if (!permLoading) {
      if (pVisor) setActiveTab('visor');
      else if (pOperacion) setActiveTab('operativo');
      else if (pRutas) setActiveTab('rutas');
      else if (pParadas) setActiveTab('paradas');
    }
  }, [permLoading, pVisor, pOperacion, pRutas, pParadas]);

  const cargarTodo = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    setDbError(null);
    try {
      // 1. Fetch Rutas (filtered by active school)
      const resRutas = await supabase
        .from('transporte_rutas')
        .select('*')
        .eq('id_escuela', escuelaCodigo)
        .order('nombre_ruta', { ascending: true });

      if (resRutas.error) {
        if (resRutas.error.code === '42P01') {
          throw new Error("Las tablas del módulo de transporte no existen en tu base de datos Supabase. Ejecuta el script SQL DDL provisto en el plan de trabajo.");
        }
        throw resRutas.error;
      }

      setRutas(resRutas.data || []);

      // 2. Fetch Paradas, Asignaciones, Guardias and Viajes
      const [resParadas, resAsignaciones, resGuardias, resViajes, resAlumnos] = await Promise.all([
        supabase.from('transporte_paradas').select('*'),
        supabase.from('transporte_asignaciones').select('*'),
        supabase.from('transporte_guardias').select('*'),
        supabase.from('transporte_viajes_activos').select('*'),
        supabase.from('usuarios').select('cedula, nombre_completo, rol').eq('rol', 'Estudiante').eq('id_escuela', escuelaCodigo)
      ]);

      if (resParadas.error) throw resParadas.error;
      if (resAsignaciones.error) throw resAsignaciones.error;
      if (resGuardias.error) throw resGuardias.error;
      if (resViajes.error) throw resViajes.error;
      if (resAlumnos.error) throw resAlumnos.error;

      setParadas(resParadas.data || []);
      setAsignaciones(resAsignaciones.data || []);
      setGuardias(resGuardias.data || []);
      setViajes(resViajes.data || []);
      setAlumnosDisponibles(resAlumnos.data || []);

      // Initialize boarding log for the selected route if active
      if (operativoRutaSeleccionada) {
        const viaje = (resViajes.data || []).find((v: any) => v.id_ruta === operativoRutaSeleccionada);
        if (viaje && viaje.estado === 'En Curso') {
          // If trip is in progress, load local boarding status from localstorage
          const stored = localStorage.getItem(`boarding_${viaje.id_viaje}`);
          if (stored) {
            setBoardingLog(JSON.parse(stored));
          }
        }
      }

    } catch (e: any) {
      console.error(e);
      setDbError(e.message || "Error al conectar con la base de datos.");
    }
    if (!silencioso) setLoading(false);
  };

  // ------------------ CRUD RUTAS ------------------
  const handleSaveRuta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRutaNombre.trim() || !formRutaPlaca.trim() || !formRutaConductor.trim()) {
      if (Swal) Swal.fire("Aviso", "Nombre, placa y conductor son obligatorios.", "warning");
      return;
    }

    try {
      const payload = {
        nombre_ruta: formRutaNombre.trim(),
        placa_vehiculo: formRutaPlaca.trim().toUpperCase(),
        conductor: formRutaConductor.trim(),
        telefono_conductor: formRutaTelefono.trim(),
        capacidad: formRutaCapacidad,
        id_escuela: escuelaCodigo
      };

      if (formRutaId) {
        // Update
        const { error } = await supabase.from('transporte_rutas').update(payload).eq('id_ruta', formRutaId);
        if (error) throw error;
        auditar('Transporte Escolar', 'Editar Ruta', `Editó ruta: ${payload.nombre_ruta}`);
      } else {
        // Insert
        const generatedId = `RUT-${Date.now()}`;
        const { error } = await supabase.from('transporte_rutas').insert({ id_ruta: generatedId, ...payload });
        if (error) throw error;
        auditar('Transporte Escolar', 'Nueva Ruta', `Creó ruta: ${payload.nombre_ruta}`);
      }

      handleCancelRutaForm();
      cargarTodo(true);

      if (Swal) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Ruta guardada', showConfirmButton: false, timer: 2000 });
      }
    } catch (err) {
      console.error(err);
      if (Swal) Swal.fire("Error", "No se pudo guardar la ruta.", "error");
    }
  };

  const handleEditRuta = (r: Ruta) => {
    setFormRutaId(r.id_ruta);
    setFormRutaNombre(r.nombre_ruta);
    setFormRutaPlaca(r.placa_vehiculo);
    setFormRutaConductor(r.conductor);
    setFormRutaTelefono(r.telefono_conductor || '');
    setFormRutaCapacidad(r.capacidad);
  };

  const handleDeleteRuta = async (id: string, nombre: string) => {
    if (!Swal) return;
    Swal.fire({
      title: '¿Eliminar Ruta?',
      text: `Se borrará "${nombre}" y todas sus paradas/asignaciones asociadas.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (res: any) => {
      if (res.isConfirmed) {
        try {
          const { error } = await supabase.from('transporte_rutas').delete().eq('id_ruta', id);
          if (error) throw error;
          auditar('Transporte Escolar', 'Eliminar Ruta', `Eliminó ruta: ${nombre}`);
          cargarTodo(true);
          Swal.fire("Eliminado", "La ruta ha sido removida.", "success");
        } catch (err) {
          console.error(err);
          Swal.fire("Error", "No se pudo eliminar la ruta.", "error");
        }
      }
    });
  };

  const handleCancelRutaForm = () => {
    setFormRutaId('');
    setFormRutaNombre('');
    setFormRutaPlaca('');
    setFormRutaConductor('');
    setFormRutaTelefono('');
    setFormRutaCapacidad(30);
  };

  // ------------------ CRUD PARADAS ------------------
  const handleSaveParada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formParadaRuta || !formParadaNombre.trim() || !formParadaHora) {
      if (Swal) Swal.fire("Aviso", "Ruta, nombre y hora estimada son obligatorios.", "warning");
      return;
    }

    try {
      const payload = {
        id_ruta: formParadaRuta,
        nombre_parada: formParadaNombre.trim(),
        hora_estimada: formParadaHora,
        orden: formParadaOrden,
        referencia_ubicacion: formParadaReferencia.trim()
      };

      if (formParadaId) {
        // Update
        const { error } = await supabase.from('transporte_paradas').update(payload).eq('id_parada', formParadaId);
        if (error) throw error;
        auditar('Transporte Escolar', 'Editar Parada', `Editó parada: ${payload.nombre_parada}`);
      } else {
        // Insert
        const generatedId = `PAR-${Date.now()}`;
        const { error } = await supabase.from('transporte_paradas').insert({ id_parada: generatedId, ...payload });
        if (error) throw error;
        auditar('Transporte Escolar', 'Nueva Parada', `Creó parada: ${payload.nombre_parada}`);
      }

      handleCancelParadaForm();
      cargarTodo(true);

      if (Swal) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Parada guardada', showConfirmButton: false, timer: 2000 });
      }
    } catch (err) {
      console.error(err);
      if (Swal) Swal.fire("Error", "No se pudo guardar la parada.", "error");
    }
  };

  const handleEditParada = (p: Parada) => {
    setFormParadaId(p.id_parada);
    setFormParadaRuta(p.id_ruta);
    setFormParadaNombre(p.nombre_parada);
    setFormParadaHora(p.hora_estimada.slice(0, 5)); // format HH:MM
    setFormParadaOrden(p.orden);
    setFormParadaReferencia(p.referencia_ubicacion || '');
  };

  const handleDeleteParada = async (id: string, nombre: string) => {
    if (!Swal) return;
    Swal.fire({
      title: '¿Eliminar Parada?',
      text: `Se borrará "${nombre}". Los estudiantes asignados a esta parada quedarán huérfanos de parada.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (res: any) => {
      if (res.isConfirmed) {
        try {
          const { error } = await supabase.from('transporte_paradas').delete().eq('id_parada', id);
          if (error) throw error;
          auditar('Transporte Escolar', 'Eliminar Parada', `Eliminó parada: ${nombre}`);
          cargarTodo(true);
          Swal.fire("Eliminado", "La parada ha sido removida.", "success");
        } catch (err) {
          console.error(err);
          Swal.fire("Error", "No se pudo eliminar la parada.", "error");
        }
      }
    });
  };

  const handleCancelParadaForm = () => {
    setFormParadaId('');
    setFormParadaRuta('');
    setFormParadaNombre('');
    setFormParadaHora('');
    setFormParadaOrden(1);
    setFormParadaReferencia('');
  };

  // ------------------ ASIGNACIONES ESTUDIANTES & GUARDIAS ------------------
  const handleSaveAsignacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAsigEstudiante || !formAsigRuta || !formAsigParada) {
      if (Swal) Swal.fire("Aviso", "Selecciona estudiante, ruta y parada.", "warning");
      return;
    }

    try {
      const alumno = alumnosDisponibles.find(a => a.cedula === formAsigEstudiante);
      const payload = {
        id_ruta: formAsigRuta,
        id_parada: formAsigParada,
        estudiante_cedula: formAsigEstudiante,
        nombre_estudiante: alumno ? alumno.nombre_completo : 'Estudiante'
      };

      // Check if already assigned to this route
      const exists = asignaciones.find(a => a.estudiante_cedula === formAsigEstudiante);
      if (exists) {
        const { error } = await supabase.from('transporte_asignaciones').update(payload).eq('id_asignacion', exists.id_asignacion);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('transporte_asignaciones').insert([payload]);
        if (error) throw error;
      }

      setFormAsigEstudiante('');
      setFormAsigRuta('');
      setFormAsigParada('');
      cargarTodo(true);

      if (Swal) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Estudiante asignado', showConfirmButton: false, timer: 2000 });
      }
    } catch (err) {
      console.error(err);
      if (Swal) Swal.fire("Error", "No se pudo asignar el estudiante.", "error");
    }
  };

  const handleDeleteAsignacion = async (id: string, nombre: string) => {
    try {
      const { error } = await supabase.from('transporte_asignaciones').delete().eq('id_asignacion', id);
      if (error) throw error;
      cargarTodo(true);
      if (Swal) Swal.fire("Removido", `Se retiró la asignación de ${nombre}`, "success");
    } catch (err) {
      console.error(err);
      if (Swal) Swal.fire("Error", "No se pudo remover.", "error");
    }
  };

  const handleSaveGuardia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGuardiaCedula.trim() || !formGuardiaNombre.trim() || !formGuardiaRuta) {
      if (Swal) Swal.fire("Aviso", "Llena todos los campos de guardia.", "warning");
      return;
    }

    try {
      const payload = {
        id_ruta: formGuardiaRuta,
        cedula: formGuardiaCedula.trim(),
        nombre_completo: formGuardiaNombre.trim(),
        rol_guardia: formGuardiaRol
      };

      const { error } = await supabase.from('transporte_guardias').insert([payload]);
      if (error) throw error;

      setFormGuardiaCedula('');
      setFormGuardiaNombre('');
      setFormGuardiaRuta('');
      cargarTodo(true);

      if (Swal) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Personal de guardia añadido', showConfirmButton: false, timer: 2000 });
      }
    } catch (err) {
      console.error(err);
      if (Swal) Swal.fire("Error", "No se pudo registrar.", "error");
    }
  };

  const handleDeleteGuardia = async (id: string) => {
    try {
      const { error } = await supabase.from('transporte_guardias').delete().eq('id_guardia', id);
      if (error) throw error;
      cargarTodo(true);
      if (Swal) Swal.fire("Removido", "Guardia retirado de la ruta.", "success");
    } catch (err) {
      console.error(err);
      if (Swal) Swal.fire("Error", "No se pudo remover.", "error");
    }
  };

  // ------------------ REAL-TIME TRIP OPERATOR (BITÁCORA) ------------------
  const handleIniciarViaje = async () => {
    if (!operativoRutaSeleccionada) return;
    setLoading(true);
    try {
      const generatedId = `VIA-${operativoRutaSeleccionada}-${Date.now()}`;
      const payload = {
        id_viaje: generatedId,
        id_ruta: operativoRutaSeleccionada,
        estado: 'En Curso',
        parada_actual_id: null,
        pasajeros_a_bordo: 0,
        iniciado_por: user?.cedula || 'Operador',
        iniciado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      };

      // Ensure no other active trip exists for this route
      await supabase.from('transporte_viajes_activos').delete().eq('id_ruta', operativoRutaSeleccionada);

      const { error } = await supabase.from('transporte_viajes_activos').insert([payload]);
      if (error) throw error;

      setBoardingLog({});
      localStorage.removeItem(`boarding_${generatedId}`);

      auditar('Transporte Escolar', 'Iniciar Viaje', `Inició el recorrido en tiempo real de la ruta ID: ${operativoRutaSeleccionada}`);
      await cargarTodo(true);
    } catch (err) {
      console.error(err);
      if (Swal) Swal.fire("Error", "No se pudo iniciar el viaje.", "error");
    }
    setLoading(false);
  };

  const handleFinalizarViaje = async (viajeId: string) => {
    if (!Swal) return;
    Swal.fire({
      title: '¿Finalizar Recorrido?',
      text: "Esto marcará el viaje como completado para todos los padres.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar'
    }).then(async (res: any) => {
      if (res.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase
            .from('transporte_viajes_activos')
            .update({ estado: 'Finalizado', actualizado_en: new Date().toISOString() })
            .eq('id_viaje', viajeId);

          if (error) throw error;

          // Clear local storage boarding details
          localStorage.removeItem(`boarding_${viajeId}`);

          auditar('Transporte Escolar', 'Finalizar Viaje', `Finalizó el viaje ID: ${viajeId}`);
          await cargarTodo(true);
        } catch (err) {
          console.error(err);
          Swal.fire("Error", "No se pudo finalizar.", "error");
        }
        setLoading(false);
      }
    });
  };

  const handleMarcarLlegadaParada = async (viajeId: string, paradaId: string) => {
    try {
      // Calculate how many students are boarded so far
      const boardedCount = Object.values(boardingLog).filter(v => v === true).length;

      const { error } = await supabase
        .from('transporte_viajes_activos')
        .update({
          parada_actual_id: paradaId,
          pasajeros_a_bordo: boardedCount,
          actualizado_en: new Date().toISOString()
        })
        .eq('id_viaje', viajeId);

      if (error) throw error;
      
      const pObj = paradas.find(p => p.id_parada === paradaId);
      auditar('Transporte Escolar', 'Marcar Parada', `Autobús llegó a la parada: ${pObj?.nombre_parada || 'Desconocida'}`);
      
      await cargarTodo(true);
    } catch (err) {
      console.error(err);
      if (Swal) Swal.fire("Error", "No se pudo actualizar la parada actual.", "error");
    }
  };

  const handleToggleAbordaje = (viajeId: string, cedula: string) => {
    const nextLog = {
      ...boardingLog,
      [cedula]: !boardingLog[cedula]
    };
    setBoardingLog(nextLog);
    localStorage.setItem(`boarding_${viajeId}`, JSON.stringify(nextLog));

    // Async update passengers count in database
    const boardedCount = Object.values(nextLog).filter(v => v === true).length;
    supabase
      .from('transporte_viajes_activos')
      .update({ pasajeros_a_bordo: boardedCount, actualizado_en: new Date().toISOString() })
      .eq('id_viaje', viajeId)
      .then(({ error }) => {
        if (error) console.error("Error updating boarders:", error);
      });
  };


  // ------------------ RENDERING HELPERS ------------------
  // filter stops of a route ordered
  const getParadasDeRuta = (rutaId: string) => {
    return paradas.filter(p => p.id_ruta === rutaId).sort((a, b) => a.orden - b.orden);
  };

  // filter students assigned to a stop
  const getEstudiantesDeParada = (paradaId: string) => {
    return asignaciones.filter(a => a.id_parada === paradaId);
  };

  // filter guardias of a route
  const getGuardiasDeRuta = (rutaId: string) => {
    return guardias.filter(g => g.id_ruta === rutaId);
  };

  // database template loader fallback check
  if (dbError) {
    return (
      <div className="container-fluid p-4 text-center">
        <div className="card shadow-sm border-danger p-5 mx-auto rounded-4" style={{ maxWidth: '650px', background: '#fff' }}>
          <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: '4.5rem' }}></i>
          <h4 className="fw-bold mt-3 text-dark">Configuración Requerida de Supabase</h4>
          <p className="text-muted mt-2">{dbError}</p>
          <hr />
          <p className="small text-secondary">
            Este módulo requiere cinco tablas de base de datos relacionales en Supabase. Si eres administrador, copia el script SQL provisto en el <strong>Plan de Implementación</strong> y ejecútalo en el SQL Editor de tu consola.
          </p>
          <button className="btn btn-secondary rounded-pill px-4 mt-3" onClick={() => navigate('/')}>
            Regresar al Inicio
          </button>
        </div>
      </div>
    );
  }

  if (permLoading || (loading && rutas.length === 0)) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5 h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando transporte escolar...</span>
        </div>
      </div>
    );
  }

  if (isRestricted) {
    return (
      <div className="col-12 text-center py-5 mt-4">
        <div className="bg-light d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm border" style={{ width: '100px', height: '100px' }}>
          <i className="bi bi-shield-lock-fill text-muted" style={{ fontSize: '3.5rem' }}></i>
        </div>
        <h4 className="text-dark fw-bold mb-2">Área Restringida</h4>
        <p className="text-muted mb-0">No tienes permisos asignados para acceder a la gestión de transporte escolar.</p>
      </div>
    );
  }

  return (
    <div className="modulo-animado container-fluid p-0">
      {/* Banner */}
      <div className="row mb-4 animate__animated animate__fadeInDown">
        <div className="col-12">
          <div 
            className="banner-modulo p-4 p-md-5 text-white shadow-sm" 
            style={{ background: 'linear-gradient(135deg, #FF3D00 0%, #d84315 100%)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
          >
            <div className="burbuja-3d burbuja-1" style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.06)', position: 'absolute', top: '-50px', right: '-20px', borderRadius: '50%' }}></div>
            <div className="burbuja-3d burbuja-2" style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.04)', position: 'absolute', bottom: '-20px', left: '20px', borderRadius: '50%' }}></div>
            <div className="row align-items-center position-relative z-1">
              <div className="col-12 text-center text-md-start">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <span className="badge bg-white mb-0 px-3 py-2 shadow-sm fw-bold" style={{ color: '#FF3D00', letterSpacing: '1px', fontSize: '0.85rem' }}>
                    <i className="bi bi-bus-front-fill me-1"></i> SERVICIOS Y BIENESTAR
                  </span>
                  <button 
                    onClick={() => navigate('/categoria/Servicios%20y%20Bienestar')} 
                    className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                  >
                    <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
                  </button>
                </div>
                <h1 className="fw-bolder mb-2 text-white" style={{ fontSize: '2.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  <i className="bi bi-bus-front me-3"></i>Transporte Escolar
                </h1>
                <p className="mb-0 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Monitoreo de rutas en tiempo real y asignación de personal para {escuelaCodigo === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar'}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs selectors */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="bg-white p-2 rounded-4 shadow-sm border d-inline-flex gap-2 flex-wrap">
            {pVisor && (
              <button 
                onClick={() => setActiveTab('visor')} 
                className={`btn rounded-pill px-4 fw-bold hover-efecto ${activeTab === 'visor' ? 'btn-primary' : 'btn-light text-muted'}`}
                style={activeTab === 'visor' ? { backgroundColor: '#FF3D00', borderColor: '#FF3D00' } : {}}
              >
                <i className="bi bi-eye-fill me-2"></i> Recorrido (Padres)
              </button>
            )}
            {pOperacion && (
              <button 
                onClick={() => setActiveTab('operativo')} 
                className={`btn rounded-pill px-4 fw-bold hover-efecto ${activeTab === 'operativo' ? 'btn-primary' : 'btn-light text-muted'}`}
                style={activeTab === 'operativo' ? { backgroundColor: '#FF3D00', borderColor: '#FF3D00' } : {}}
              >
                <i className="bi bi-play-btn-fill me-2"></i> Bitácora (Operador)
              </button>
            )}
            {pRutas && (
              <button 
                onClick={() => setActiveTab('rutas')} 
                className={`btn rounded-pill px-4 fw-bold hover-efecto ${activeTab === 'rutas' ? 'btn-primary' : 'btn-light text-muted'}`}
                style={activeTab === 'rutas' ? { backgroundColor: '#FF3D00', borderColor: '#FF3D00' } : {}}
              >
                <i className="bi bi-map-fill me-2"></i> Rutas
              </button>
            )}
            {pParadas && (
              <button 
                onClick={() => setActiveTab('paradas')} 
                className={`btn rounded-pill px-4 fw-bold hover-efecto ${activeTab === 'paradas' ? 'btn-primary' : 'btn-light text-muted'}`}
                style={activeTab === 'paradas' ? { backgroundColor: '#FF3D00', borderColor: '#FF3D00' } : {}}
              >
                <i className="bi bi-geo-alt-fill me-2"></i> Paradas
              </button>
            )}
            {pRutas && (
              <button 
                onClick={() => setActiveTab('asignar')} 
                className={`btn rounded-pill px-4 fw-bold hover-efecto ${activeTab === 'asignar' ? 'btn-primary' : 'btn-light text-muted'}`}
                style={activeTab === 'asignar' ? { backgroundColor: '#FF3D00', borderColor: '#FF3D00' } : {}}
              >
                <i className="bi bi-person-fill-gear me-2"></i> Estudiantes y Guardia
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1. VISOR TAB (PARENTS VIEW) */}
      {activeTab === 'visor' && pVisor && (
        <div className="row g-4 animate__animated animate__fadeIn">
          {rutas.length === 0 ? (
            <div className="col-12 text-center py-5 text-muted">
              <i className="bi bi-bus-front fs-1 d-block mb-3"></i>
              No hay rutas de transporte registradas para esta institución.
            </div>
          ) : (
            rutas.map(ruta => {
              const viaje = viajes.find(v => v.id_ruta === ruta.id_ruta);
              const rutaParadas = getParadasDeRuta(ruta.id_ruta);
              const rutaGuardias = getGuardiasDeRuta(ruta.id_ruta);
              const isTripActive = viaje && viaje.estado === 'En Curso';

              return (
                <div key={ruta.id_ruta} className="col-12 mb-4">
                  <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div 
                      className="card-header border-0 text-white p-4 d-flex justify-content-between align-items-center flex-wrap gap-3"
                      style={{ background: isTripActive ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #475569 0%, #334155 100%)' }}
                    >
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <h5 className="mb-0 fw-bold">{ruta.nombre_ruta}</h5>
                          {isTripActive ? (
                            <span className="badge bg-white text-success fw-bold animate__animated animate__flash animate__infinite px-3 py-1">
                              ● EN CURSO
                            </span>
                          ) : (
                            <span className="badge bg-secondary px-3 py-1">No Iniciado</span>
                          )}
                        </div>
                        <p className="mb-0 text-white text-opacity-80 small mt-1">
                          Conductor: <strong>{ruta.conductor}</strong> {ruta.telefono_conductor && `(${ruta.telefono_conductor})`} | Vehículo: <strong>Placa {ruta.placa_vehiculo}</strong>
                        </p>
                      </div>
                      
                      <div className="text-end text-md-right">
                        <span className="small d-block text-white text-opacity-75">Personal de Guardia:</span>
                        <span className="fw-bold small">
                          {rutaGuardias.length > 0 ? rutaGuardias.map(g => `${g.nombre_completo} (${g.rol_guardia.split(' ')[0]})`).join(', ') : 'Ninguno asignado'}
                        </span>
                      </div>
                    </div>

                    <div className="card-body p-4 bg-white">
                      {rutaParadas.length === 0 ? (
                        <div className="text-muted text-center py-3 small">
                          Esta ruta aún no tiene paradas registradas.
                        </div>
                      ) : (
                        <div>
                          <h6 className="fw-bold text-dark mb-4"><i className="bi bi-clock-history me-1 text-primary"></i>Recorrido de la Unidad:</h6>
                          
                          {/* Live Progress Bar (Timeline Metro Style) */}
                          <div className="position-relative py-5 px-3 mb-4 overflow-auto">
                            
                            {/* Line bar background */}
                            <div 
                              className="position-absolute start-0 top-50 translate-middle-y w-100 bg-secondary bg-opacity-20" 
                              style={{ height: '6px', minWidth: '600px', left: '10px', right: '10px', zIndex: 1 }}
                            ></div>

                            {/* Active filled line bar */}
                            {isTripActive && (() => {
                              const activeIndex = rutaParadas.findIndex(p => p.id_parada === viaje.parada_actual_id);
                              const totalStops = rutaParadas.length;
                              const percent = totalStops <= 1 ? 0 : activeIndex === -1 ? 0 : (activeIndex / (totalStops - 1)) * 100;
                              return (
                                <div 
                                  className="position-absolute start-0 top-50 translate-middle-y bg-success transition-all duration-500" 
                                  style={{ height: '6px', width: `${percent}%`, minWidth: '0px', left: '10px', zIndex: 2 }}
                                ></div>
                              );
                            })()}

                            <div className="d-flex justify-content-between position-relative" style={{ minWidth: '600px', zIndex: 3 }}>
                              {rutaParadas.map((parada, idx) => {
                                const activeIndex = viaje ? rutaParadas.findIndex(p => p.id_parada === viaje.parada_actual_id) : -1;
                                const isCompleted = idx <= activeIndex && isTripActive;
                                const isCurrent = idx === activeIndex && isTripActive;
                                const isNext = idx === activeIndex + 1 && isTripActive;
                                const stopStudents = getEstudiantesDeParada(parada.id_parada);

                                return (
                                  <div key={parada.id_parada} className="text-center d-flex flex-column align-items-center" style={{ width: '120px' }}>
                                    
                                    {/* Timeline Circle */}
                                    <div 
                                      className={`rounded-circle d-flex align-items-center justify-content-center border-3 shadow-sm transition-all duration-300`}
                                      style={{
                                        width: '40px',
                                        height: '40px',
                                        backgroundColor: isCompleted ? '#10b981' : isNext ? '#3b82f6' : '#ffffff',
                                        borderColor: isCompleted ? '#ffffff' : isNext ? '#93c5fd' : '#cbd5e1',
                                        color: isCompleted ? '#ffffff' : isNext ? '#1e3a8a' : '#64748b',
                                        position: 'relative'
                                      }}
                                    >
                                      {/* Animated bus icon sliding on current stop */}
                                      {isCurrent && (
                                        <div 
                                          className="position-absolute top-0 start-50 translate-middle bg-success text-white rounded-circle d-flex align-items-center justify-content-center border shadow"
                                          style={{ width: '28px', height: '28px', marginTop: '-15px', animation: 'latido 1.8s infinite' }}
                                        >
                                          <i className="bi bi-bus-front-fill" style={{ fontSize: '0.85rem' }}></i>
                                        </div>
                                      )}
                                      
                                      {isCompleted ? (
                                        <i className="bi bi-check-lg fw-bold"></i>
                                      ) : (
                                        <span className="fw-bold" style={{ fontSize: '0.9rem' }}>{idx + 1}</span>
                                      )}
                                    </div>

                                    {/* Stop Name & Metadata */}
                                    <div className="mt-3">
                                      <span className="fw-bold text-dark d-block small text-wrap px-1" style={{ lineHeight: 1.2 }}>
                                        {parada.nombre_parada}
                                      </span>
                                      <span className="badge bg-light text-muted border mt-1" style={{ fontSize: '0.7rem' }}>
                                        <i className="bi bi-clock me-1"></i>{parada.hora_estimada.slice(0, 5)}
                                      </span>
                                    </div>

                                    {/* Stop students with boarding state */}
                                    {stopStudents.length > 0 && (
                                      <div className="mt-3 w-100 p-2 border rounded-3 bg-light bg-opacity-40">
                                        <span className="d-block text-muted" style={{ fontSize: '0.65rem', fontWeight: 700 }}>ESTUDIANTES:</span>
                                        {stopStudents.map(est => {
                                          // check if student is marked as boarded on local log or server
                                          const isAboard = viaje && boardingLog[est.estudiante_cedula] === true;
                                          return (
                                            <div key={est.estudiante_cedula} className="d-flex align-items-center justify-content-center gap-1 mt-1">
                                              <span className="text-dark fw-bold text-truncate" style={{ fontSize: '0.7rem', maxWidth: '80px' }} title={est.nombre_estudiante}>
                                                {est.nombre_estudiante.split(' ')[0]}
                                              </span>
                                              {isTripActive && (
                                                isAboard ? (
                                                  <span className="badge bg-success bg-opacity-20 text-success rounded-pill px-1.5 py-0.5 border border-success" style={{ fontSize: '0.6rem' }} title="A Bordo">
                                                    <i className="bi bi-bus-front-fill"></i>
                                                  </span>
                                                ) : (
                                                  <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill px-1.5 py-0.5 border border-secondary" style={{ fontSize: '0.6rem' }} title="Esperando">
                                                    <i className="bi bi-clock"></i>
                                                  </span>
                                                )
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                  </div>
                                );
                              })}
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. OPERATIVO TAB (BITÁCORA TRIP TRACKING) */}
      {activeTab === 'operativo' && pOperacion && (
        <div className="row g-4 animate__animated animate__fadeIn">
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-bottom p-4">
                <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-play-circle text-primary me-2"></i>Iniciar Recorrido</h5>
              </div>
              <div className="card-body p-4">
                <label className="form-label small fw-bold text-muted">Seleccionar Ruta de Guardia</label>
                <select 
                  className="form-select input-moderno mb-3" 
                  value={operativoRutaSeleccionada}
                  onChange={(e) => {
                    setOperativoRutaSeleccionada(e.target.value);
                    setBoardingLog({});
                  }}
                >
                  <option value="">-- Elige una Ruta --</option>
                  {rutas.map(r => (
                    <option key={r.id_ruta} value={r.id_ruta}>
                      {r.nombre_ruta} (Conductor: {r.conductor})
                    </option>
                  ))}
                </select>

                {operativoRutaSeleccionada && (() => {
                  const viaje = viajes.find(v => v.id_ruta === operativoRutaSeleccionada);
                  const isCurrentActive = viaje && viaje.estado === 'En Curso';

                  return (
                    <div className="border rounded-3 p-3 bg-light">
                      <h6 className="fw-bold text-dark small uppercase mb-2">Estado del Recorrido:</h6>
                      {isCurrentActive ? (
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-3">
                            <span className="spinner-grow spinner-grow-sm text-success" role="status"></span>
                            <span className="text-success fw-bold small">Ruta Activa e Iniciada</span>
                          </div>
                          <button 
                            onClick={() => handleFinalizarViaje(viaje.id_viaje)}
                            className="btn btn-danger w-100 rounded-pill fw-bold"
                          >
                            <i className="bi bi-stop-circle-fill me-2"></i> Finalizar Recorrido
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-3 text-muted small">
                            <i className="bi bi-dash-circle"></i> No iniciado para hoy
                          </div>
                          <button 
                            onClick={handleIniciarViaje}
                            className="btn btn-success w-100 rounded-pill fw-bold"
                          >
                            <i className="bi bi-play-fill me-2"></i> Iniciar Viaje en Vivo
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-bottom p-4">
                <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-clock-history text-primary me-2"></i>Consola de Control del Recorrido</h5>
              </div>
              <div className="card-body p-4">
                {!operativoRutaSeleccionada ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-info-circle fs-1 mb-2"></i>
                    <p className="mb-0 small fw-bold">Por favor, selecciona una ruta de guardia en el panel lateral.</p>
                  </div>
                ) : (() => {
                  const viaje = viajes.find(v => v.id_ruta === operativoRutaSeleccionada);
                  const activeParadas = getParadasDeRuta(operativoRutaSeleccionada);
                  const isCurrentActive = viaje && viaje.estado === 'En Curso';

                  if (!isCurrentActive) {
                    return (
                      <div className="text-center py-5 text-muted bg-light bg-opacity-50 border border-dashed rounded-4">
                        <i className="bi bi-play-fill fs-1 text-success mb-2 animate__animated animate__pulse animate__infinite"></i>
                        <p className="mb-0 small fw-bold">Inicia el viaje en el panel izquierdo para habilitar los registros en vivo.</p>
                      </div>
                    );
                  }

                  const activeIndex = activeParadas.findIndex(p => p.id_parada === viaje.parada_actual_id);

                  return (
                    <div className="row g-4">
                      {/* Left: Stops sequence list */}
                      <div className="col-md-6 border-end">
                        <h6 className="fw-bold text-dark mb-3">Paradas en Secuencia:</h6>
                        <div className="d-flex flex-column gap-3">
                          {activeParadas.map((parada, idx) => {
                            const isReached = idx <= activeIndex;
                            const isNext = idx === activeIndex + 1;
                            const isCurrent = idx === activeIndex;

                            return (
                              <div 
                                key={parada.id_parada} 
                                className={`d-flex align-items-center justify-content-between p-3 border rounded-3 ${isCurrent ? 'border-success bg-success bg-opacity-5' : isNext ? 'border-primary bg-primary bg-opacity-5' : 'bg-white'}`}
                              >
                                <div>
                                  <span className="fw-bold d-block text-dark small">{idx + 1}. {parada.nombre_parada}</span>
                                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}><i className="bi bi-clock me-1"></i>Estimada: {parada.hora_estimada.slice(0, 5)}</span>
                                </div>
                                
                                {isReached ? (
                                  <span className="badge bg-success"><i className="bi bi-check-lg me-1"></i>Llegó</span>
                                ) : isNext ? (
                                  <button 
                                    onClick={() => handleMarcarLlegadaParada(viaje.id_viaje, parada.id_parada)}
                                    className="btn btn-sm btn-primary rounded-pill px-3 fw-bold"
                                  >
                                    Llegar
                                  </button>
                                ) : (
                                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>Pendiente</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Boarding Logs for students */}
                      <div className="col-md-6">
                        <h6 className="fw-bold text-dark mb-3">Control de Pasajeros (Abordaje):</h6>
                        <div className="p-3 border rounded-3 bg-light">
                          <p className="small text-muted mb-3"><i className="bi bi-info-circle me-1"></i>Marca a los estudiantes que suben al transporte para que sus representantes lo vean.</p>
                          
                          {(() => {
                            const currentStopId = viaje.parada_actual_id;
                            if (!currentStopId) {
                              return (
                                <div className="text-center py-4 text-secondary small italic font-semibold">
                                  Registra la llegada del bus a la primera parada para listar estudiantes.
                                </div>
                              );
                            }

                            const currentStop = paradas.find(p => p.id_parada === currentStopId);
                            const stopStudents = getEstudiantesDeParada(currentStopId);

                            return (
                              <div>
                                <h6 className="fw-bold text-primary small mb-3 uppercase">Parada Actual: {currentStop?.nombre_parada}</h6>
                                {stopStudents.length === 0 ? (
                                  <div className="text-muted py-3 small">No hay estudiantes asignados habitualmente a esta parada.</div>
                                ) : (
                                  <div className="d-flex flex-column gap-2">
                                    {stopStudents.map(est => {
                                      const isBoarded = boardingLog[est.estudiante_cedula] === true;
                                      return (
                                        <div 
                                          key={est.estudiante_cedula} 
                                          className="form-check bg-white p-2.5 rounded-3 border d-flex align-items-center shadow-sm"
                                          style={{ cursor: 'pointer' }}
                                          onClick={() => handleToggleAbordaje(viaje.id_viaje, est.estudiante_cedula)}
                                        >
                                          <input 
                                            className="form-check-input ms-1 me-3 border-secondary"
                                            type="checkbox"
                                            checked={isBoarded}
                                            onChange={() => {}} // handled by parent div click
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <label className="form-check-label fw-bold text-dark small" style={{ cursor: 'pointer' }}>
                                            {est.nombre_estudiante}
                                            <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>C.I: {est.estudiante_cedula}</small>
                                          </label>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. RUTAS TAB (ADMIN CRUD) */}
      {activeTab === 'rutas' && pRutas && (
        <div className="row g-4 animate__animated animate__fadeIn">
          {/* Form */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-bottom p-4">
                <h5 className="mb-0 fw-bold text-dark">
                  <i className={`bi ${formRutaId ? 'bi-pencil-square text-success' : 'bi-plus-circle-fill text-primary'} me-2`}></i>
                  {formRutaId ? 'Actualizar Ruta' : 'Registrar Nueva Ruta'}
                </h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSaveRuta}>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Nombre de la Ruta *</label>
                    <input 
                      type="text" 
                      className="form-control input-moderno" 
                      placeholder="Ej: Ruta 1 - Centro / Parroquia"
                      value={formRutaNombre}
                      onChange={(e) => setFormRutaNombre(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Placa del Vehículo *</label>
                    <input 
                      type="text" 
                      className="form-control input-moderno" 
                      placeholder="Ej: AB123CD"
                      value={formRutaPlaca}
                      onChange={(e) => setFormRutaPlaca(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Nombre del Conductor *</label>
                    <input 
                      type="text" 
                      className="form-control input-moderno" 
                      placeholder="Ej: Carlos Pérez"
                      value={formRutaConductor}
                      onChange={(e) => setFormRutaConductor(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Teléfono del Conductor (Opcional)</label>
                    <input 
                      type="text" 
                      className="form-control input-moderno" 
                      placeholder="Ej: 0412-1234567"
                      value={formRutaTelefono}
                      onChange={(e) => setFormRutaTelefono(e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label small fw-bold text-muted">Capacidad Pasajeros *</label>
                    <input 
                      type="number" 
                      className="form-control input-moderno" 
                      value={formRutaCapacidad}
                      onChange={(e) => setFormRutaCapacidad(parseInt(e.target.value) || 0)}
                      required 
                      min={1}
                    />
                  </div>

                  <div className="d-flex gap-2">
                    <button 
                      type="submit" 
                      className={`btn w-100 rounded-pill fw-bold ${formRutaId ? 'btn-success' : 'btn-primary'}`}
                      style={!formRutaId ? { backgroundColor: '#FF3D00', borderColor: '#FF3D00' } : {}}
                    >
                      <i className={`bi ${formRutaId ? 'bi-save-fill' : 'bi-floppy-fill'} me-2`}></i>
                      {formRutaId ? 'Actualizar' : 'Guardar'}
                    </button>
                    {formRutaId && (
                      <button 
                        type="button" 
                        onClick={handleCancelRutaForm} 
                        className="btn btn-outline-secondary w-100 rounded-pill"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* List Table */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-header bg-white border-bottom p-4">
                <h5 className="mb-0 fw-bold text-dark">Listado de Rutas</h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light text-muted small fw-bold">
                      <tr>
                        <th className="ps-4 py-3">Ruta</th>
                        <th className="py-3">Placa</th>
                        <th className="py-3">Conductor</th>
                        <th className="py-3">Capacidad</th>
                        <th className="pe-4 py-3 text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rutas.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-5 text-muted">
                            <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                            No hay rutas de transporte registradas.
                          </td>
                        </tr>
                      ) : (
                        rutas.map(r => (
                          <tr key={r.id_ruta} className="hover-efecto">
                            <td className="ps-4 fw-bold text-dark">{r.nombre_ruta}</td>
                            <td><span className="badge bg-secondary">{r.placa_vehiculo}</span></td>
                            <td>
                              <div>{r.conductor}</div>
                              <div className="small text-muted">{r.telefono_conductor || 'Sin teléfono'}</div>
                            </td>
                            <td>{r.capacidad} puestos</td>
                            <td className="pe-4 text-end text-nowrap">
                              <button 
                                onClick={() => handleEditRuta(r)} 
                                className="btn btn-sm btn-light text-primary border shadow-sm me-1 hover-efecto"
                              >
                                <i className="bi bi-pencil-fill"></i>
                              </button>
                              <button 
                                onClick={() => handleDeleteRuta(r.id_ruta, r.nombre_ruta)} 
                                className="btn btn-sm btn-light text-danger border shadow-sm hover-efecto"
                              >
                                <i className="bi bi-trash3-fill"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. PARADAS TAB (ADMIN CRUD) */}
      {activeTab === 'paradas' && pParadas && (
        <div className="row g-4 animate__animated animate__fadeIn">
          {/* Form */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-bottom p-4">
                <h5 className="mb-0 fw-bold text-dark">
                  <i className={`bi ${formParadaId ? 'bi-pencil-square text-success' : 'bi-plus-circle-fill text-primary'} me-2`}></i>
                  {formParadaId ? 'Actualizar Parada' : 'Registrar Nueva Parada'}
                </h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSaveParada}>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Ruta Asociada *</label>
                    <select 
                      className="form-select input-moderno"
                      value={formParadaRuta}
                      onChange={(e) => setFormParadaRuta(e.target.value)}
                      required
                    >
                      <option value="">-- Elige una Ruta --</option>
                      {rutas.map(r => (
                        <option key={r.id_ruta} value={r.id_ruta}>{r.nombre_ruta}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Nombre de la Parada *</label>
                    <input 
                      type="text" 
                      className="form-control input-moderno" 
                      placeholder="Ej: Entrada Principal Urb. / Plaza"
                      value={formParadaNombre}
                      onChange={(e) => setFormParadaNombre(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-bold text-muted">Hora Estimada *</label>
                      <input 
                        type="time" 
                        className="form-control input-moderno" 
                        value={formParadaHora}
                        onChange={(e) => setFormParadaHora(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold text-muted">Nro. de Orden *</label>
                      <input 
                        type="number" 
                        className="form-control input-moderno" 
                        value={formParadaOrden}
                        onChange={(e) => setFormParadaOrden(parseInt(e.target.value) || 1)}
                        required 
                        min={1}
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="form-label small fw-bold text-muted">Referencia de Ubicación (Opcional)</label>
                    <textarea 
                      className="form-control input-moderno" 
                      rows={3}
                      placeholder="Puntos de referencia cercanos..."
                      value={formParadaReferencia}
                      onChange={(e) => setFormParadaReferencia(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="d-flex gap-2">
                    <button 
                      type="submit" 
                      className={`btn w-100 rounded-pill fw-bold ${formParadaId ? 'btn-success' : 'btn-primary'}`}
                      style={!formParadaId ? { backgroundColor: '#FF3D00', borderColor: '#FF3D00' } : {}}
                    >
                      <i className={`bi ${formParadaId ? 'bi-save-fill' : 'bi-floppy-fill'} me-2`}></i>
                      {formParadaId ? 'Actualizar' : 'Guardar'}
                    </button>
                    {formParadaId && (
                      <button 
                        type="button" 
                        onClick={handleCancelParadaForm} 
                        className="btn btn-outline-secondary w-100 rounded-pill"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* List Table */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-header bg-white border-bottom p-4">
                <h5 className="mb-0 fw-bold text-dark">Listado de Paradas</h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light text-muted small fw-bold">
                      <tr>
                        <th className="ps-4 py-3">Ruta</th>
                        <th className="py-3">Orden</th>
                        <th className="py-3">Nombre Parada</th>
                        <th className="py-3">Hora Estimada</th>
                        <th className="py-3">Referencia</th>
                        <th className="pe-4 py-3 text-end">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paradas.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-5 text-muted">
                            <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                            No hay paradas de transporte registradas.
                          </td>
                        </tr>
                      ) : (
                        paradas
                          .sort((a, b) => {
                            const rA = rutas.find(r => r.id_ruta === a.id_ruta)?.nombre_ruta || '';
                            const rB = rutas.find(r => r.id_ruta === b.id_ruta)?.nombre_ruta || '';
                            const compRuta = rA.localeCompare(rB);
                            if (compRuta !== 0) return compRuta;
                            return a.orden - b.orden;
                          })
                          .map(p => {
                            const r = rutas.find(x => x.id_ruta === p.id_ruta);
                            return (
                              <tr key={p.id_parada} className="hover-efecto">
                                <td className="ps-4 fw-bold text-dark small">{r ? r.nombre_ruta : 'Desconocida'}</td>
                                <td><span className="badge bg-secondary rounded-pill">{p.orden}</span></td>
                                <td className="fw-bold">{p.nombre_parada}</td>
                                <td><i className="bi bi-clock me-1 text-muted"></i>{p.hora_estimada.slice(0, 5)}</td>
                                <td className="text-muted small text-truncate" style={{ maxWidth: '150px' }}>{p.referencia_ubicacion || 'Sin detalles'}</td>
                                <td className="pe-4 text-end text-nowrap">
                                  <button 
                                    onClick={() => handleEditParada(p)} 
                                    className="btn btn-sm btn-light text-primary border shadow-sm me-1 hover-efecto"
                                  >
                                    <i className="bi bi-pencil-fill"></i>
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteParada(p.id_parada, p.nombre_parada)} 
                                    className="btn btn-sm btn-light text-danger border shadow-sm hover-efecto"
                                  >
                                    <i className="bi bi-trash3-fill"></i>
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. ASIGNAR TAB (ASSIGN STUDENTS & GUARD TO ROUTE) */}
      {activeTab === 'asignar' && pRutas && (
        <div className="row g-4 animate__animated animate__fadeIn">
          
          {/* Section: Assign Students */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-header bg-white border-bottom p-4">
                <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-person-plus-fill text-primary me-2"></i>Asignar Estudiante a Parada</h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSaveAsignacion} className="mb-4">
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Estudiante *</label>
                    <select
                      className="form-select input-moderno"
                      value={formAsigEstudiante}
                      onChange={(e) => setFormAsigEstudiante(e.target.value)}
                      required
                    >
                      <option value="">-- Elige Estudiante --</option>
                      {alumnosDisponibles.map(a => (
                        <option key={a.cedula} value={a.cedula}>{a.nombre_completo} (C.I: {a.cedula})</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Ruta *</label>
                    <select
                      className="form-select input-moderno"
                      value={formAsigRuta}
                      onChange={(e) => {
                        setFormAsigRuta(e.target.value);
                        setFormAsigParada('');
                      }}
                      required
                    >
                      <option value="">-- Elige Ruta --</option>
                      {rutas.map(r => (
                        <option key={r.id_ruta} value={r.id_ruta}>{r.nombre_ruta}</option>
                      ))}
                    </select>
                  </div>
                  {formAsigRuta && (
                    <div className="mb-4">
                      <label className="form-label small fw-bold text-muted">Parada de Embarque/Desembarque *</label>
                      <select
                        className="form-select input-moderno"
                        value={formAsigParada}
                        onChange={(e) => setFormAsigParada(e.target.value)}
                        required
                      >
                        <option value="">-- Selecciona Parada --</option>
                        {getParadasDeRuta(formAsigRuta).map(p => (
                          <option key={p.id_parada} value={p.id_parada}>{p.nombre_parada} (Estimada: {p.hora_estimada.slice(0, 5)})</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <button 
                    type="submit" 
                    className="btn btn-primary rounded-pill w-100 fw-bold"
                    style={{ backgroundColor: '#FF3D00', borderColor: '#FF3D00' }}
                  >
                    Asignar Alumno
                  </button>
                </form>

                <h6 className="fw-bold text-dark border-top pt-3 mb-3">Estudiantes Asignados:</h6>
                <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="table table-sm align-middle table-hover">
                    <thead>
                      <tr className="small text-muted">
                        <th>Nombre</th>
                        <th>Parada</th>
                        <th className="text-end">Retirar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asignaciones.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center py-3 text-muted small">No hay alumnos asignados.</td>
                        </tr>
                      ) : (
                        asignaciones.map(asig => {
                          const r = rutas.find(x => x.id_ruta === asig.id_ruta);
                          const p = paradas.find(x => x.id_parada === asig.id_parada);
                          if (!r) return null; // skip if doesn't belong to this school's routes
                          return (
                            <tr key={asig.id_asignacion} style={{ fontSize: '0.85rem' }}>
                              <td className="fw-bold">{asig.nombre_estudiante}</td>
                              <td>
                                <div>{p ? p.nombre_parada : 'Parada Borrada'}</div>
                                <small className="text-muted">{r.nombre_ruta}</small>
                              </td>
                              <td className="text-end">
                                <button 
                                  onClick={() => handleDeleteAsignacion(asig.id_asignacion, asig.nombre_estudiante)}
                                  className="btn btn-sm btn-light text-danger border rounded-circle hover-efecto px-2"
                                  title="Remover"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Assign Duty Guardians */}
          <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-header bg-white border-bottom p-4">
                <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-shield-fill-check text-primary me-2"></i>Asignar Personal de Guardia / Brigada</h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSaveGuardia} className="mb-4">
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-bold text-muted">Cédula Identidad *</label>
                      <input 
                        type="text" 
                        className="form-control input-moderno" 
                        placeholder="Ej: 12345678"
                        value={formGuardiaCedula}
                        onChange={(e) => setFormGuardiaCedula(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-bold text-muted">Rol en Ruta *</label>
                      <select
                        className="form-select input-moderno"
                        value={formGuardiaRol}
                        onChange={(e) => setFormGuardiaRol(e.target.value)}
                        required
                      >
                        <option value="Docente de Guardia">Docente de Guardia</option>
                        <option value="Brigadista Estudiantil">Brigadista Estudiantil</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Nombre Completo *</label>
                    <input 
                      type="text" 
                      className="form-control input-moderno" 
                      placeholder="Ej: Pedro Infante"
                      value={formGuardiaNombre}
                      onChange={(e) => setFormGuardiaNombre(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label small fw-bold text-muted">Asignar a Ruta *</label>
                    <select
                      className="form-select input-moderno"
                      value={formGuardiaRuta}
                      onChange={(e) => setFormGuardiaRuta(e.target.value)}
                      required
                    >
                      <option value="">-- Elige una Ruta --</option>
                      {rutas.map(r => (
                        <option key={r.id_ruta} value={r.id_ruta}>{r.nombre_ruta}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary rounded-pill w-100 fw-bold"
                    style={{ backgroundColor: '#FF3D00', borderColor: '#FF3D00' }}
                  >
                    Agregar de Guardia
                  </button>
                </form>

                <h6 className="fw-bold text-dark border-top pt-3 mb-3">Guardias y Brigadas de Guardia:</h6>
                <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="table table-sm align-middle table-hover">
                    <thead>
                      <tr className="small text-muted">
                        <th>Nombre</th>
                        <th>Rol</th>
                        <th>Ruta</th>
                        <th className="text-end">Retirar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guardias.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-3 text-muted small">No hay personal de guardia asignado.</td>
                        </tr>
                      ) : (
                        guardias.map(g => {
                          const r = rutas.find(x => x.id_ruta === g.id_ruta);
                          if (!r) return null; // skip if doesn't belong to this school's routes
                          return (
                            <tr key={g.id_guardia} style={{ fontSize: '0.85rem' }}>
                              <td className="fw-bold">{g.nombre_completo}</td>
                              <td>
                                <span className={`badge ${g.rol_guardia.includes('Docente') ? 'bg-info' : 'bg-warning text-dark'} small`}>
                                  {g.rol_guardia}
                                </span>
                              </td>
                              <td>{r.nombre_ruta}</td>
                              <td className="text-end">
                                <button 
                                  onClick={() => handleDeleteGuardia(g.id_guardia)}
                                  className="btn btn-sm btn-light text-danger border rounded-circle hover-efecto px-2"
                                  title="Remover"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
