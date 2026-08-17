import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { usePermisos } from '../../hooks/usePermisos';
import { auditar } from '../../lib/audit';
import * as XLSX from 'xlsx';

export type TipoPregunta = 
  | 'opcion_unica' 
  | 'casillas' 
  | 'texto_corto' 
  | 'parrafo' 
  | 'calificacion_estrellas' 
  | 'escala_lineal' 
  | 'desplegable' 
  | 'booleano';

export interface PreguntaEncuesta {
  id: string;
  enunciado: string;
  descripcion?: string;
  tipo: TipoPregunta;
  obligatoria: boolean;
  opciones: string[];
  valorMin?: number;
  valorMax?: number;
  etiquetaMin?: string;
  etiquetaMax?: string;
}

export interface Encuesta {
  id: string;
  titulo: string;
  descripcion: string;
  codigo_escuela: 'sb' | 'lb' | 'ambas';
  roles_permitidos: string[]; // Ej: ['Docente', 'Representante', 'Coordinador', ...]
  estado: 'Borrador' | 'Publicada' | 'Cerrada';
  es_obligatoria: boolean;
  es_anonima: boolean;
  permitir_multiples_respuestas: boolean;
  fecha_inicio: string;
  fecha_fin?: string;
  preguntas: PreguntaEncuesta[];
  creado_por: string;
  created_at: string;
  updated_at: string;
}

export interface RespuestaUsuario {
  id: string;
  encuesta_id: string;
  usuario_cedula: string;
  usuario_nombre: string;
  usuario_rol: string;
  codigo_escuela: string;
  respuestas: Record<string, any>; // { [pregunta_id]: valor }
  created_at: string;
}

const ROLES_PREDETERMINADOS = [
  'SuperAdmin',
  'Director',
  'Administrador',
  'Coordinador',
  'Docente',
  'Representante',
  'Secretaría',
  'Invitado'
];

export const ConstructorEncuestas: React.FC = () => {
  const navigate = useNavigate();
  const { user, tienePermiso } = usePermisos();
  const Swal = (window as any).Swal;

  const rolUsuario = (user?.rol || 'Docente').trim();
  const esAdminOGestor = ['SuperAdmin', 'Director', 'Directora', 'Subdirector', 'Subdirectora', 'Coordinador', 'Coordinadora', 'Administrador'].includes(rolUsuario);

  const canCrearEncuestas = esAdminOGestor || tienePermiso('Función: Crear Encuestas', 'crear') || tienePermiso('Constructor de Encuestas', 'crear');
  const canVerEstadisticas = esAdminOGestor || tienePermiso('Función: Ver Respuestas', 'ver') || tienePermiso('Constructor de Encuestas', 'ver');
  const canExportarResultados = esAdminOGestor || tienePermiso('Función: Exportar Resultados', 'exportar');
  const canEliminarEncuestas = esAdminOGestor || tienePermiso('Función: Eliminar Encuestas', 'eliminar');
  const isSoloRespondiente = !canCrearEncuestas && !canVerEstadisticas;

  // Estados de Vistas
  const [vistaActual, setVistaActual] = useState<'listado' | 'constructor' | 'estadisticas' | 'responder'>('listado');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Catálogos y datos
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [rolesDisponibles, setRolesDisponibles] = useState<string[]>(ROLES_PREDETERMINADOS);
  const [respuestasEncuesta, setRespuestasEncuesta] = useState<RespuestaUsuario[]>([]);
  const [mapaRespuestasUsuario, setMapaRespuestasUsuario] = useState<Record<string, { fecha: string, respuestas: any }>>({});

  // Filtros de Listado
  const [filtroEscuela, setFiltroEscuela] = useState<string>(localStorage.getItem('sigae_escuela_codigo') || 'ambas');
  const [filtroEstado, setFiltroEstado] = useState<string>('Todos');
  const [filtroRol, setFiltroRol] = useState<string>('Todos');
  const [busqueda, setBusqueda] = useState<string>('');

  // Encuesta Activa / En Edición / En Estadísticas
  const [encuestaActiva, setEncuestaActiva] = useState<Encuesta | null>(null);

  // Respuestas del Formulario Interactivo al Responder
  const [respuestasForm, setRespuestasForm] = useState<Record<string, any>>({});
  const [vistaPreviaModo, setVistaPreviaModo] = useState<boolean>(false);
  const [yaRespondio, setYaRespondio] = useState<boolean>(false);
  const [fechaRespuestaAnterior, setFechaRespuestaAnterior] = useState<string | null>(null);

  // Script SQL modal
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);

  useEffect(() => {
    cargarRolesSistema();
    cargarEncuestas();
  }, []);

  const cargarRolesSistema = async () => {
    try {
      const { data, error } = await supabase.from('roles').select('nombre').order('nombre');
      if (!error && data && data.length > 0) {
        const rolesNombres = data.map(r => r.nombre);
        const combinados = Array.from(new Set([...ROLES_PREDETERMINADOS, ...rolesNombres]));
        setRolesDisponibles(combinados);
      }
    } catch (e) {
      console.warn("Usando roles predeterminados para encuestas.");
    }
  };

  const verificarRespuestasUsuario = async (encuestasLista: Encuesta[]) => {
    const cedulaUsr = user?.cedula;
    if (!cedulaUsr) return;

    const mapa: Record<string, { fecha: string, respuestas: any }> = {};

    try {
      const { data } = await supabase
        .from('encuestas_respuestas')
        .select('*')
        .eq('usuario_cedula', cedulaUsr);

      if (data) {
        data.forEach((r: any) => {
          mapa[r.encuesta_id] = {
            fecha: r.created_at ? new Date(r.created_at).toLocaleString('es-VE') : 'Registrado',
            respuestas: typeof r.respuestas === 'string' ? JSON.parse(r.respuestas) : (r.respuestas || {})
          };
        });
      }
    } catch (e) {
      // Fallback local
      encuestasLista.forEach(enc => {
        const key = `sigae_respuestas_${enc.id}`;
        const local = JSON.parse(localStorage.getItem(key) || '[]');
        const encontrada = local.find((r: any) => r.usuario_cedula === cedulaUsr);
        if (encontrada) {
          mapa[enc.id] = {
            fecha: encontrada.created_at ? new Date(encontrada.created_at).toLocaleString('es-VE') : 'Registrado',
            respuestas: encontrada.respuestas || {}
          };
        }
      });
    }

    setMapaRespuestasUsuario(mapa);
  };

  const cargarEncuestas = async () => {
    setLoading(true);
    try {
      // Intentar cargar de Supabase
      const { data, error } = await supabase
        .from('encuestas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const parsed = data.map((enc: any) => ({
          ...enc,
          roles_permitidos: typeof enc.roles_permitidos === 'string' ? JSON.parse(enc.roles_permitidos) : (enc.roles_permitidos || []),
          preguntas: typeof enc.preguntas === 'string' ? JSON.parse(enc.preguntas) : (enc.preguntas || [])
        }));
        setEncuestas(parsed);
        localStorage.setItem('sigae_encuestas_local', JSON.stringify(parsed));
        verificarRespuestasUsuario(parsed);
      }
    } catch (e: any) {
      console.warn("Leyendo encuestas de almacenamiento local o inicial:", e);
      const guardadas = localStorage.getItem('sigae_encuestas_local');
      if (guardadas) {
        try {
          const parsed = JSON.parse(guardadas);
          setEncuestas(parsed);
          verificarRespuestasUsuario(parsed);
        } catch (err) {}
      } else {
        // Cargar encuestas demo de ejemplo para primera visualización
        const demo: Encuesta[] = [
          {
            id: 'enc-demo-1',
            titulo: 'Evaluación del Clima Escolar y Jornada Pedagógica',
            descripcion: 'Encuesta institucional para conocer la percepción de la comunidad docente y directiva sobre el desarrollo del período escolar.',
            codigo_escuela: 'ambas',
            roles_permitidos: ['Docente', 'Coordinador', 'Director'],
            estado: 'Publicada',
            es_obligatoria: false,
            es_anonima: false,
            permitir_multiples_respuestas: false,
            fecha_inicio: new Date().toISOString().split('T')[0],
            preguntas: [
              {
                id: 'p1',
                enunciado: '¿Cómo califica el ambiente de trabajo y cooperación entre el equipo docente?',
                tipo: 'calificacion_estrellas',
                obligatoria: true,
                opciones: []
              },
              {
                id: 'p2',
                enunciado: '¿Considera que cuenta con los recursos didácticos suficientes para sus clases?',
                tipo: 'booleano',
                obligatoria: true,
                opciones: ['Sí', 'No']
              },
              {
                id: 'p3',
                enunciado: '¿Cuáles áreas pedagógicas requieren mayor formación o talleres?',
                tipo: 'casillas',
                obligatoria: false,
                opciones: ['Tecnología y SIGAE', 'Didáctica de la Lectoescritura', 'Estrategias Lúdicas en Matemáticas', 'Evaluación Continua', 'Atención a la Diversidad / NEE']
              },
              {
                id: 'p4',
                enunciado: 'Sugerencias adicionales o propuestas para mejorar la gestión escolar:',
                tipo: 'parrafo',
                obligatoria: false,
                opciones: []
              }
            ],
            creado_por: user?.nombre || 'Administrador',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'enc-demo-2',
            titulo: 'Satisfacción del Proceso de Actualización de Datos y Matrícula',
            descripcion: 'Consulta dirigida a padres y representantes para medir la agilidad y calidad del portal web SIGAE.',
            codigo_escuela: 'sb',
            roles_permitidos: ['Representante'],
            estado: 'Publicada',
            es_obligatoria: true,
            es_anonima: true,
            permitir_multiples_respuestas: false,
            fecha_inicio: new Date().toISOString().split('T')[0],
            preguntas: [
              {
                id: 'p2-1',
                enunciado: '¿Qué tan fácil le resultó completar la ficha integral de su representado?',
                tipo: 'escala_lineal',
                valorMin: 1,
                valorMax: 10,
                etiquetaMin: 'Muy Difícil',
                etiquetaMax: 'Muy Fácil',
                obligatoria: true,
                opciones: []
              },
              {
                id: 'p2-2',
                enunciado: '¿Pudo descargar correctamente su Constancia de Actualización de Datos?',
                tipo: 'opcion_unica',
                obligatoria: true,
                opciones: ['Sí, sin problemas', 'Sí, pero tuve dificultades', 'No pude descargarla']
              },
              {
                id: 'p2-3',
                enunciado: 'Comentarios o dudas que desee comunicar a la dirección:',
                tipo: 'texto_corto',
                obligatoria: false,
                opciones: []
              }
            ],
            creado_por: user?.nombre || 'Dirección',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        setEncuestas(demo);
        localStorage.setItem('sigae_encuestas_local', JSON.stringify(demo));
      }
    } finally {
      setLoading(false);
    }
  };

  const cargarRespuestas = async (encuestaId: string) => {
    try {
      const { data, error } = await supabase
        .from('encuestas_respuestas')
        .select('*')
        .eq('encuesta_id', encuestaId);

      if (!error && data) {
        const parsed = data.map((r: any) => ({
          ...r,
          respuestas: typeof r.respuestas === 'string' ? JSON.parse(r.respuestas) : (r.respuestas || {})
        }));
        setRespuestasEncuesta(parsed);
        return;
      }
    } catch (e) {}

    // Fallback de respuestas locales
    const local = localStorage.getItem(`sigae_respuestas_${encuestaId}`);
    if (local) {
      try {
        setRespuestasEncuesta(JSON.parse(local));
      } catch (err) {
        setRespuestasEncuesta([]);
      }
    } else {
      setRespuestasEncuesta([]);
    }
  };

  // -------------------------------------------------------------
  // ACCIONES DEL CONSTRUCTOR DE ENCUESTAS
  // -------------------------------------------------------------
  const handleNuevaEncuesta = () => {
    if (!canCrearEncuestas) {
      if (Swal) Swal.fire('Acceso Restringido', 'No posees privilegios para crear o estructurar nuevas encuestas.', 'warning');
      return;
    }

    const nueva: Encuesta = {
      id: 'enc-' + Date.now(),
      titulo: '',
      descripcion: '',
      codigo_escuela: (filtroEscuela === 'sb' || filtroEscuela === 'lb') ? (filtroEscuela as 'sb' | 'lb') : 'ambas',
      roles_permitidos: ['Docente', 'Representante'],
      estado: 'Borrador',
      es_obligatoria: false,
      es_anonima: false,
      permitir_multiples_respuestas: false,
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: '',
      preguntas: [
        {
          id: 'p-' + Date.now(),
          enunciado: '¿Cuál es su grado de satisfacción general con los servicios educativos de la institución?',
          tipo: 'calificacion_estrellas',
          obligatoria: true,
          opciones: []
        }
      ],
      creado_por: user?.nombre || 'Administrador',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setEncuestaActiva(nueva);
    setVistaPreviaModo(false);
    setVistaActual('constructor');
  };

  const handleEditarEncuesta = (enc: Encuesta) => {
    if (!canCrearEncuestas) {
      if (Swal) Swal.fire('Acceso Restringido', 'No posees privilegios para editar encuestas.', 'warning');
      return;
    }
    setEncuestaActiva(JSON.parse(JSON.stringify(enc)));
    setVistaPreviaModo(false);
    setVistaActual('constructor');
  };

  const handleVerEstadisticas = async (enc: Encuesta) => {
    if (!canVerEstadisticas) {
      if (Swal) Swal.fire('Acceso Restringido', 'No posees privilegios para consultar analíticas de encuestas.', 'warning');
      return;
    }
    setEncuestaActiva(enc);
    await cargarRespuestas(enc.id);
    setVistaActual('estadisticas');
  };

  const handleAbrirResponder = async (enc: Encuesta) => {
    setEncuestaActiva(enc);
    setRespuestasForm({});
    setYaRespondio(false);
    setFechaRespuestaAnterior(null);

    // Si no permite múltiples respuestas, verificar si el usuario ya respondió
    if (!enc.permitir_multiples_respuestas) {
      const cedulaUsr = user?.cedula;
      if (cedulaUsr) {
        try {
          const { data } = await supabase
            .from('encuestas_respuestas')
            .select('*')
            .eq('encuesta_id', enc.id)
            .eq('usuario_cedula', cedulaUsr);

          if (data && data.length > 0) {
            setYaRespondio(true);
            setFechaRespuestaAnterior(data[0].created_at ? new Date(data[0].created_at).toLocaleString('es-VE') : null);
            setRespuestasForm(typeof data[0].respuestas === 'string' ? JSON.parse(data[0].respuestas) : (data[0].respuestas || {}));
          } else {
            const key = `sigae_respuestas_${enc.id}`;
            const local = JSON.parse(localStorage.getItem(key) || '[]');
            const encontrada = local.find((r: any) => r.usuario_cedula === cedulaUsr);
            if (encontrada) {
              setYaRespondio(true);
              setFechaRespuestaAnterior(encontrada.created_at ? new Date(encontrada.created_at).toLocaleString('es-VE') : null);
              setRespuestasForm(encontrada.respuestas || {});
            }
          }
        } catch (e) {
          const key = `sigae_respuestas_${enc.id}`;
          const local = JSON.parse(localStorage.getItem(key) || '[]');
          const encontrada = local.find((r: any) => r.usuario_cedula === cedulaUsr);
          if (encontrada) {
            setYaRespondio(true);
            setFechaRespuestaAnterior(encontrada.created_at ? new Date(encontrada.created_at).toLocaleString('es-VE') : null);
            setRespuestasForm(encontrada.respuestas || {});
          }
        }
      }
    }

    setVistaActual('responder');
  };

  const handleGuardarEncuesta = async () => {
    if (!encuestaActiva) return;

    if (!encuestaActiva.titulo.trim()) {
      if (Swal) Swal.fire('Título Requerido', 'Por favor ingresa un título para la encuesta.', 'warning');
      else alert('Por favor ingresa un título para la encuesta.');
      return;
    }

    if (encuestaActiva.roles_permitidos.length === 0) {
      if (Swal) Swal.fire('Roles Destino Requeridos', 'Debes seleccionar al menos un rol de usuario que pueda responder la encuesta.', 'warning');
      else alert('Debes seleccionar al menos un rol destino.');
      return;
    }

    if (encuestaActiva.preguntas.length === 0) {
      if (Swal) Swal.fire('Preguntas Requeridas', 'Agrega al menos una pregunta a la encuesta.', 'warning');
      else alert('Agrega al menos una pregunta a la encuesta.');
      return;
    }

    // Validar enunciados de preguntas y opciones
    for (let i = 0; i < encuestaActiva.preguntas.length; i++) {
      const p = encuestaActiva.preguntas[i];
      if (!p.enunciado.trim()) {
        if (Swal) Swal.fire('Pregunta Incompleta', `La pregunta #${i + 1} no tiene enunciado definido.`, 'warning');
        return;
      }
      if (['opcion_unica', 'casillas', 'desplegable'].includes(p.tipo)) {
        if (!p.opciones || p.opciones.filter(o => o.trim()).length < 2) {
          if (Swal) Swal.fire('Opciones Insuficientes', `La pregunta #${i + 1} (${p.enunciado}) requiere al menos 2 opciones de respuesta.`, 'warning');
          return;
        }
      }
    }

    setSaving(true);
    const ahora = new Date().toISOString();
    const encuestaFinal: Encuesta = {
      ...encuestaActiva,
      updated_at: ahora
    };

    try {
      // Intentar guardar en Supabase
      const payloadBD = {
        id: encuestaFinal.id,
        titulo: encuestaFinal.titulo,
        descripcion: encuestaFinal.descripcion,
        codigo_escuela: encuestaFinal.codigo_escuela,
        roles_permitidos: JSON.stringify(encuestaFinal.roles_permitidos),
        estado: encuestaFinal.estado,
        es_obligatoria: encuestaFinal.es_obligatoria,
        es_anonima: encuestaFinal.es_anonima,
        permitir_multiples_respuestas: encuestaFinal.permitir_multiples_respuestas,
        fecha_inicio: encuestaFinal.fecha_inicio,
        fecha_fin: encuestaFinal.fecha_fin || null,
        preguntas: JSON.stringify(encuestaFinal.preguntas),
        creado_por: encuestaFinal.creado_por,
        updated_at: ahora
      };

      const { error } = await supabase
        .from('encuestas')
        .upsert([payloadBD], { onConflict: 'id' });

      if (error) {
        console.warn("Error guardando en Supabase, persistiendo localmente:", error);
      }
    } catch (err) {
      console.warn("Fallback local para guardado de encuestas.");
    }

    // Persistir en lista local y storage
    setEncuestas(prev => {
      const existe = prev.some(e => e.id === encuestaFinal.id);
      const nuevaLista = existe ? prev.map(e => e.id === encuestaFinal.id ? encuestaFinal : e) : [encuestaFinal, ...prev];
      localStorage.setItem('sigae_encuestas_local', JSON.stringify(nuevaLista));
      return nuevaLista;
    });

    auditar('Módulo de Diseños', 'Guardar Encuesta', `Se guardó la encuesta "${encuestaFinal.titulo}" con estado ${encuestaFinal.estado}`);

    setSaving(false);
    if (Swal) {
      Swal.fire({
        icon: 'success',
        title: '¡Encuesta Guardada!',
        text: `La encuesta "${encuestaFinal.titulo}" se encuentra ${encuestaFinal.estado.toLowerCase()}.`,
        timer: 2000,
        showConfirmButton: false
      });
    }
    setVistaActual('listado');
  };

  const handleEliminarEncuesta = async (encuestaId: string, titulo: string) => {
    if (!canEliminarEncuestas) {
      if (Swal) Swal.fire('Acceso Restringido', 'No cuentas con privilegios para eliminar encuestas institucionales.', 'warning');
      return;
    }

    let confirmado = false;
    if (Swal) {
      const result = await Swal.fire({
        title: '¿Eliminar Encuesta?',
        html: `¿Estás seguro de que deseas eliminar permanentemente la encuesta <strong>"${titulo}"</strong> y todas sus respuestas asociadas?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });
      confirmado = result.isConfirmed;
    } else {
      confirmado = window.confirm(`¿Deseas eliminar la encuesta "${titulo}"?`);
    }

    if (!confirmado) return;

    try {
      await supabase.from('encuestas_respuestas').delete().eq('encuesta_id', encuestaId);
      await supabase.from('encuestas').delete().eq('id', encuestaId);
    } catch (e) {}

    setEncuestas(prev => {
      const filtrada = prev.filter(e => e.id !== encuestaId);
      localStorage.setItem('sigae_encuestas_local', JSON.stringify(filtrada));
      return filtrada;
    });
    localStorage.removeItem(`sigae_respuestas_${encuestaId}`);

    auditar('Módulo de Diseños', 'Eliminar Encuesta', `Se eliminó la encuesta ${titulo} (${encuestaId})`);

    if (Swal) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Encuesta eliminada', timer: 2000, showConfirmButton: false });
    }
  };

  const handleDuplicarEncuesta = (enc: Encuesta) => {
    const copia: Encuesta = {
      ...JSON.parse(JSON.stringify(enc)),
      id: 'enc-' + Date.now(),
      titulo: `${enc.titulo} (Copia)`,
      estado: 'Borrador',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setEncuestas(prev => {
      const nuevaLista = [copia, ...prev];
      localStorage.setItem('sigae_encuestas_local', JSON.stringify(nuevaLista));
      return nuevaLista;
    });

    if (Swal) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Encuesta duplicada en borrador', timer: 2000, showConfirmButton: false });
    }
  };

  const handleCambiarEstadoEncuesta = async (enc: Encuesta, nuevoEstado: 'Borrador' | 'Publicada' | 'Cerrada') => {
    const actualizada = { ...enc, estado: nuevoEstado, updated_at: new Date().toISOString() };
    try {
      await supabase.from('encuestas').update({ estado: nuevoEstado }).eq('id', enc.id);
    } catch (e) {}

    setEncuestas(prev => {
      const lista = prev.map(e => e.id === enc.id ? actualizada : e);
      localStorage.setItem('sigae_encuestas_local', JSON.stringify(lista));
      return lista;
    });

    auditar('Módulo de Diseños', 'Cambio Estado Encuesta', `Se cambió el estado de la encuesta "${enc.titulo}" a ${nuevoEstado}`);

    if (Swal) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Estado cambiado a ${nuevoEstado}`,
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  // -------------------------------------------------------------
  // GESTIÓN DE PREGUNTAS EN EL CONSTRUCTOR
  // -------------------------------------------------------------
  const handleAgregarPregunta = (tipo: TipoPregunta) => {
    if (!encuestaActiva) return;

    let opcionesIniciales: string[] = [];
    if (tipo === 'opcion_unica' || tipo === 'casillas' || tipo === 'desplegable') {
      opcionesIniciales = ['Opción 1', 'Opción 2', 'Opción 3'];
    } else if (tipo === 'booleano') {
      opcionesIniciales = ['Sí', 'No'];
    }

    const nuevaP: PreguntaEncuesta = {
      id: 'p-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      enunciado: '',
      tipo: tipo,
      obligatoria: true,
      opciones: opcionesIniciales,
      valorMin: tipo === 'escala_lineal' ? 1 : undefined,
      valorMax: tipo === 'escala_lineal' ? 10 : undefined,
      etiquetaMin: tipo === 'escala_lineal' ? 'Insatisfecho' : undefined,
      etiquetaMax: tipo === 'escala_lineal' ? 'Totalmente Satisfecho' : undefined
    };

    setEncuestaActiva({
      ...encuestaActiva,
      preguntas: [...encuestaActiva.preguntas, nuevaP]
    });
  };

  const handleEliminarPregunta = (index: number) => {
    if (!encuestaActiva) return;
    const nuevas = [...encuestaActiva.preguntas];
    nuevas.splice(index, 1);
    setEncuestaActiva({ ...encuestaActiva, preguntas: nuevas });
  };

  const handleDuplicarPregunta = (index: number) => {
    if (!encuestaActiva) return;
    const pOriginal = encuestaActiva.preguntas[index];
    const copia: PreguntaEncuesta = {
      ...JSON.parse(JSON.stringify(pOriginal)),
      id: 'p-' + Date.now() + '-' + Math.floor(Math.random() * 1000)
    };
    const nuevas = [...encuestaActiva.preguntas];
    nuevas.splice(index + 1, 0, copia);
    setEncuestaActiva({ ...encuestaActiva, preguntas: nuevas });
  };

  const handleMoverPregunta = (index: number, direccion: 'arriba' | 'abajo') => {
    if (!encuestaActiva) return;
    const nuevas = [...encuestaActiva.preguntas];
    const targetIdx = direccion === 'arriba' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= nuevas.length) return;
    const temp = nuevas[index];
    nuevas[index] = nuevas[targetIdx];
    nuevas[targetIdx] = temp;
    setEncuestaActiva({ ...encuestaActiva, preguntas: nuevas });
  };

  const handleToggleRolDestino = (rol: string) => {
    if (!encuestaActiva) return;
    const actuales = encuestaActiva.roles_permitidos || [];
    if (actuales.includes(rol)) {
      setEncuestaActiva({ ...encuestaActiva, roles_permitidos: actuales.filter(r => r !== rol) });
    } else {
      setEncuestaActiva({ ...encuestaActiva, roles_permitidos: [...actuales, rol] });
    }
  };

  const handleSeleccionarTodosRoles = () => {
    if (!encuestaActiva) return;
    setEncuestaActiva({ ...encuestaActiva, roles_permitidos: [...rolesDisponibles] });
  };

  const handleLimpiarRoles = () => {
    if (!encuestaActiva) return;
    setEncuestaActiva({ ...encuestaActiva, roles_permitidos: [] });
  };

  // -------------------------------------------------------------
  // ENVÍO DE RESPUESTAS (MODO RESPONDER)
  // -------------------------------------------------------------
  const handleEnviarRespuesta = async () => {
    if (!encuestaActiva) return;

    // Validar obligatorias
    for (let i = 0; i < encuestaActiva.preguntas.length; i++) {
      const p = encuestaActiva.preguntas[i];
      if (p.obligatoria) {
        const val = respuestasForm[p.id];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          if (Swal) Swal.fire('Pregunta Obligatoria', `Por favor responde la pregunta #${i + 1}: "${p.enunciado}"`, 'warning');
          else alert(`Por favor responde la pregunta #${i + 1}`);
          return;
        }
      }
    }

    setSaving(true);
    const idResp = 'resp-' + Date.now();
    const nuevaRespuesta: RespuestaUsuario = {
      id: idResp,
      encuesta_id: encuestaActiva.id,
      usuario_cedula: encuestaActiva.es_anonima ? 'ANÓNIMO' : (user?.cedula || '12345678'),
      usuario_nombre: encuestaActiva.es_anonima ? 'Participante Anónimo' : (user?.nombre || 'Usuario Registrado'),
      usuario_rol: user?.rol || 'Docente',
      codigo_escuela: localStorage.getItem('sigae_escuela_codigo') || 'sb',
      respuestas: respuestasForm,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('encuestas_respuestas').insert([{
        id: nuevaRespuesta.id,
        encuesta_id: nuevaRespuesta.encuesta_id,
        usuario_cedula: nuevaRespuesta.usuario_cedula,
        usuario_nombre: nuevaRespuesta.usuario_nombre,
        usuario_rol: nuevaRespuesta.usuario_rol,
        codigo_escuela: nuevaRespuesta.codigo_escuela,
        respuestas: JSON.stringify(nuevaRespuesta.respuestas),
        created_at: nuevaRespuesta.created_at
      }]);
    } catch (e) {
      console.warn("Guardando respuesta localmente.");
    }

    // Persistir localmente
    const key = `sigae_respuestas_${encuestaActiva.id}`;
    const existentes = JSON.parse(localStorage.getItem(key) || '[]');
    const actualizadas = [nuevaRespuesta, ...existentes];
    localStorage.setItem(key, JSON.stringify(actualizadas));

    setSaving(false);
    verificarRespuestasUsuario(encuestas);

    if (Swal) {
      Swal.fire({
        icon: 'success',
        title: '¡Respuesta Enviada!',
        text: 'Muchas gracias por completar la encuesta. Tu opinión contribuye a la mejora continua del SIGAE.',
        confirmButtonColor: '#2563eb'
      });
    }
    setVistaActual('listado');
  };

  // -------------------------------------------------------------
  // EXPORTACIÓN DE RESULTADOS A EXCEL
  // -------------------------------------------------------------
  const handleExportarExcel = () => {
    if (!canExportarResultados) {
      if (Swal) Swal.fire('Acceso Restringido', 'No tienes permisos para exportar los resultados de encuestas.', 'warning');
      return;
    }

    if (!encuestaActiva || respuestasEncuesta.length === 0) {
      if (Swal) Swal.fire('Sin Respuestas', 'No hay respuestas registradas para exportar en esta encuesta.', 'info');
      return;
    }

    const dataFilas = respuestasEncuesta.map((r, idx) => {
      const fila: any = {
        'N°': idx + 1,
        'Fecha / Hora': new Date(r.created_at).toLocaleString('es-VE'),
        'Cédula': r.usuario_cedula,
        'Participante': r.usuario_nombre,
        'Rol': r.usuario_rol,
        'Escuela': r.codigo_escuela.toUpperCase()
      };

      encuestaActiva.preguntas.forEach((p, pIdx) => {
        const val = r.respuestas[p.id];
        let valStr = '';
        if (Array.isArray(val)) {
          valStr = val.join(', ');
        } else if (val !== undefined && val !== null) {
          valStr = String(val);
        }
        fila[`P${pIdx + 1}: ${p.enunciado}`] = valStr;
      });

      return fila;
    });

    const ws = XLSX.utils.json_to_sheet(dataFilas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados Encuesta");
    const nombreArchivo = `Resultados_Encuesta_${encuestaActiva.titulo.replace(/[\s/\\:]+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
    auditar('Módulo de Diseños', 'Exportar Resultados Encuesta', `Se exportaron ${respuestasEncuesta.length} respuestas de la encuesta "${encuestaActiva.titulo}"`);
  };

  // -------------------------------------------------------------
  // FILTRADO DE ENCUESTAS EN EL LISTADO
  // -------------------------------------------------------------
  const encuestasFiltradas = encuestas.filter(e => {
    if (isSoloRespondiente) {
      if (e.estado !== 'Publicada') return false;
      const escuelaActiva = localStorage.getItem('sigae_escuela_codigo') || 'sb';
      const matchEscuela = e.codigo_escuela === 'ambas' || e.codigo_escuela === escuelaActiva;
      const matchRol = Array.isArray(e.roles_permitidos) && (e.roles_permitidos.length === 0 || e.roles_permitidos.includes(rolUsuario) || rolUsuario === 'SuperAdmin');
      const q = busqueda.toLowerCase();
      const matchBusqueda = e.titulo.toLowerCase().includes(q) || e.descripcion.toLowerCase().includes(q);
      return matchEscuela && matchRol && matchBusqueda;
    }

    const q = busqueda.toLowerCase();
    const matchBusqueda = e.titulo.toLowerCase().includes(q) || e.descripcion.toLowerCase().includes(q);
    const matchEscuela = filtroEscuela === 'ambas' || e.codigo_escuela === 'ambas' || e.codigo_escuela === filtroEscuela;
    const matchEstado = filtroEstado === 'Todos' || e.estado === filtroEstado;
    const matchRol = filtroRol === 'Todos' || (e.roles_permitidos && e.roles_permitidos.includes(filtroRol));
    return matchBusqueda && matchEscuela && matchEstado && matchRol;
  });

  const getBadgeIconTipo = (tipo: TipoPregunta) => {
    switch (tipo) {
      case 'opcion_unica': return 'bi-ui-radios';
      case 'casillas': return 'bi-ui-checks';
      case 'texto_corto': return 'bi-fonts';
      case 'parrafo': return 'bi-text-paragraph';
      case 'calificacion_estrellas': return 'bi-star-fill text-warning';
      case 'escala_lineal': return 'bi-sliders';
      case 'desplegable': return 'bi-menu-button-wide';
      case 'booleano': return 'bi-toggle-on';
      default: return 'bi-question-circle';
    }
  };

  const getNombreTipo = (tipo: TipoPregunta) => {
    switch (tipo) {
      case 'opcion_unica': return 'Opción Única (Radio)';
      case 'casillas': return 'Casillas de Verificación (Múltiple)';
      case 'texto_corto': return 'Texto Corto';
      case 'parrafo': return 'Párrafo / Texto Largo';
      case 'calificacion_estrellas': return 'Calificación (1 a 5 Estrellas)';
      case 'escala_lineal': return 'Escala Numérica (1 a 10)';
      case 'desplegable': return 'Menú Desplegable';
      case 'booleano': return 'Sí / No (Booleano)';
      default: return tipo;
    }
  };

  return (
    <div className="container-fluid py-4 animate__animated animate__fadeIn">
      {/* Banner Principal del Módulo */}
      <div 
        className="banner-modulo p-4 p-md-5 mb-4 shadow-sm text-white position-relative overflow-hidden" 
        style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', borderRadius: '24px' }}
      >
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between position-relative z-1">
          <div>
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="badge bg-white text-dark fw-bold px-3 py-1.5 rounded-pill shadow-sm" style={{ fontSize: '0.75rem' }}>
                <i className="bi bi-palette-fill text-pink me-1"></i> MÓDULO DE DISEÑOS
              </span>
              <span className="badge bg-white bg-opacity-25 text-white fw-bold px-3 py-1.5 rounded-pill" style={{ fontSize: '0.75rem' }}>
                <i className="bi bi-ui-checks-grid me-1"></i> {isSoloRespondiente ? 'CONSULTAS Y ENCUESTAS' : 'CONSTRUCTOR DE ENCUESTAS'}
              </span>
            </div>
            <h1 className="fw-bolder mb-2 display-6 text-white">
              <i className="bi bi-ui-checks-grid me-3"></i>{isSoloRespondiente ? 'Consultas y Encuestas Institucionales' : 'Constructor de Encuestas'}
            </h1>
            <p className="mb-0 text-white-50 fs-6" style={{ maxWidth: '750px' }}>
              {isSoloRespondiente
                ? 'Participa en las consultas activas para tu rol. Tu opinión es fundamental para la toma de decisiones y la mejora continua de la institución.'
                : 'Diseña encuestas dinámicas, define a qué roles de usuarios aplicar cada consulta (Docentes, Representantes, etc.), analiza métricas en tiempo real y exporta resultados.'}
            </p>
          </div>
          <div className="mt-4 mt-md-0 d-flex flex-wrap gap-2">
            <button 
              onClick={() => navigate(isSoloRespondiente ? '/' : '/categoria/Diseños')}
              className="btn btn-light rounded-pill px-4 fw-bold shadow-sm hover-efecto"
            >
              <i className="bi bi-arrow-left-short me-1"></i> {isSoloRespondiente ? 'Volver al Inicio' : 'Volver a Diseños'}
            </button>
            {vistaActual !== 'listado' && (
              <button 
                onClick={() => setVistaActual('listado')}
                className="btn btn-outline-light rounded-pill px-4 fw-bold shadow-sm hover-efecto"
              >
                <i className="bi bi-grid-fill me-1"></i> Ver Todas las Encuestas
              </button>
            )}
            {vistaActual === 'listado' && !isSoloRespondiente && canCrearEncuestas && (
              <button 
                onClick={handleNuevaEncuesta}
                className="btn btn-white text-dark rounded-pill px-4 fw-bold shadow-lg hover-efecto d-flex align-items-center gap-2"
                style={{ backgroundColor: '#ffffff' }}
              >
                <i className="bi bi-plus-circle-fill text-pink fs-5"></i>
                <span>Crear Nueva Encuesta</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VISTA 1: LISTADO GENERAL DE ENCUESTAS                     */}
      {/* ========================================================= */}
      {vistaActual === 'listado' && (
        <div className="animate__animated animate__fadeIn">
          {/* Barra de Filtros */}
          <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
            <div className="row g-3 align-items-center">
              {/* Filtro Escuela */}
              <div className={isSoloRespondiente ? "col-lg-4 col-md-6" : "col-lg-3 col-md-6"}>
                <label className="form-label small fw-bold text-muted mb-1">Institución / Plantel</label>
                <div className="btn-group w-100 shadow-none border rounded-3 overflow-hidden" role="group">
                  <button 
                    type="button" 
                    className={`btn btn-sm ${filtroEscuela === 'sb' ? 'btn-primary fw-bold' : 'btn-light text-muted'}`}
                    onClick={() => setFiltroEscuela('sb')}
                  >
                    Santa Bárbara
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-sm ${filtroEscuela === 'lb' ? 'btn-success fw-bold' : 'btn-light text-muted'}`}
                    onClick={() => setFiltroEscuela('lb')}
                  >
                    Libertador B.
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-sm ${filtroEscuela === 'ambas' ? 'btn-dark fw-bold' : 'btn-light text-muted'}`}
                    onClick={() => setFiltroEscuela('ambas')}
                  >
                    Ambas
                  </button>
                </div>
              </div>

              {/* Búsqueda */}
              <div className={isSoloRespondiente ? "col-lg-8 col-md-6" : "col-lg-3 col-md-6"}>
                <label className="form-label small fw-bold text-muted mb-1">Buscar por Título</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
                  <input 
                    type="text" 
                    className="form-control border-start-0" 
                    placeholder="Ej. Evaluación docente..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>
              </div>

              {!isSoloRespondiente && (
                <>
                  {/* Filtro Estado */}
                  <div className="col-lg-2 col-md-4">
                    <label className="form-label small fw-bold text-muted mb-1">Estado</label>
                    <select 
                      className="form-select fw-semibold"
                      value={filtroEstado}
                      onChange={(e) => setFiltroEstado(e.target.value)}
                    >
                      <option value="Todos">Todos los Estados</option>
                      <option value="Publicada">🟢 Publicadas (Activas)</option>
                      <option value="Borrador">🟡 Borradores</option>
                      <option value="Cerrada">🔴 Cerradas / Finalizadas</option>
                    </select>
                  </div>

                  {/* Filtro Rol Destino */}
                  <div className="col-lg-2 col-md-4">
                    <label className="form-label small fw-bold text-muted mb-1">Rol Destino</label>
                    <select 
                      className="form-select fw-semibold"
                      value={filtroRol}
                      onChange={(e) => setFiltroRol(e.target.value)}
                    >
                      <option value="Todos">Todos los Roles</option>
                      {rolesDisponibles.map(r => (
                        <option key={r} value={r}>👤 {r}</option>
                      ))}
                    </select>
                  </div>

                  {/* Botón de recargar y SQL */}
                  <div className="col-lg-2 col-md-4 text-end d-flex gap-2 align-items-end justify-content-end">
                    <button 
                      className="btn btn-outline-secondary rounded-3 fw-bold w-50"
                      onClick={cargarEncuestas}
                      disabled={loading}
                      title="Refrescar lista"
                    >
                      <i className="bi bi-arrow-clockwise"></i>
                    </button>
                    <button 
                      className="btn btn-outline-primary rounded-3 fw-bold w-50"
                      onClick={() => setShowSqlModal(true)}
                      title="Ver script SQL de base de datos"
                    >
                      <i className="bi bi-database"></i> SQL
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Listado de Tarjetas de Encuestas */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="text-muted fw-bold mt-2">Cargando encuestas institucionales...</p>
            </div>
          ) : encuestasFiltradas.length === 0 ? (
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
              <div className="mb-3">
                <i className="bi bi-ui-checks-grid text-muted opacity-50" style={{ fontSize: '4rem' }}></i>
              </div>
              <h4 className="fw-bold text-dark mb-2">No se encontraron encuestas disponibles</h4>
              <p className="text-muted mb-4" style={{ maxWidth: '500px', margin: '0 auto' }}>
                {isSoloRespondiente
                  ? 'No tienes consultas o encuestas pendientes para responder en este momento.'
                  : 'No hay encuestas creadas con los filtros actuales. Crea tu primera encuesta para recopilar la opinión de docentes, representantes u otros roles.'}
              </p>
              {!isSoloRespondiente && canCrearEncuestas && (
                <div>
                  <button onClick={handleNuevaEncuesta} className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">
                    <i className="bi bi-plus-lg me-1"></i> Diseñar Nueva Encuesta
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="row g-4">
              {encuestasFiltradas.map((enc) => {
                const totalP = enc.preguntas?.length || 0;
                const roles = enc.roles_permitidos || [];
                const yaResp = Boolean(mapaRespuestasUsuario[enc.id]);

                return (
                  <div className="col-lg-6 col-12" key={enc.id}>
                    <div className="card border-0 shadow-sm rounded-4 h-100 p-4 bg-white hover-shadow transition-all position-relative overflow-hidden border-top border-4 border-pink">
                      {/* Cabecera Tarjeta */}
                      <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                        <div>
                          <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                            {/* Badge Escuela */}
                            <span className={`badge ${enc.codigo_escuela === 'sb' ? 'bg-primary' : enc.codigo_escuela === 'lb' ? 'bg-success' : 'bg-dark'} text-white fw-bold px-2.5 py-1 rounded-pill`} style={{ fontSize: '0.7rem' }}>
                              <i className="bi bi-building me-1"></i>
                              {enc.codigo_escuela === 'sb' ? 'UE Santa Bárbara' : enc.codigo_escuela === 'lb' ? 'UE Libertador Bolívar' : 'Ambas Escuelas'}
                            </span>

                            {/* Badge Estado (si es admin) o Estado Respuesta (si es solo respondiente) */}
                            {!isSoloRespondiente ? (
                              <span className={`badge ${enc.estado === 'Publicada' ? 'bg-success' : enc.estado === 'Borrador' ? 'bg-warning text-dark' : 'bg-danger'} fw-bold px-2.5 py-1 rounded-pill`} style={{ fontSize: '0.7rem' }}>
                                ● {enc.estado}
                              </span>
                            ) : yaResp ? (
                              <span className="badge bg-success text-white fw-bold px-2.5 py-1 rounded-pill" style={{ fontSize: '0.7rem' }}>
                                <i className="bi bi-check-circle-fill me-1"></i> Respondida
                              </span>
                            ) : (
                              <span className="badge bg-warning text-dark fw-bold px-2.5 py-1 rounded-pill" style={{ fontSize: '0.7rem' }}>
                                ⚡ Pendiente
                              </span>
                            )}

                            {enc.es_obligatoria && (
                              <span className="badge bg-danger bg-opacity-10 text-danger border border-danger px-2 py-0.5 rounded-pill fw-bold" style={{ fontSize: '0.68rem' }}>
                                Obligatoria
                              </span>
                            )}

                            {enc.es_anonima && (
                              <span className="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-0.5 rounded-pill fw-bold" style={{ fontSize: '0.68rem' }}>
                                <i className="bi bi-incognito me-1"></i>Anónima
                              </span>
                            )}
                          </div>

                          <h5 className="fw-bolder text-dark mb-1">{enc.titulo}</h5>
                        </div>

                        {/* Dropdown de Estado (Solo administradores y creadores) */}
                        {!isSoloRespondiente && (
                          <div className="dropdown">
                            <button className="btn btn-sm btn-light rounded-circle shadow-none p-2" data-bs-toggle="dropdown" title="Opciones">
                              <i className="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3">
                              <li><h6 className="dropdown-header">Cambiar Estado</h6></li>
                              <li>
                                <button className="dropdown-item small text-success fw-bold" onClick={() => handleCambiarEstadoEncuesta(enc, 'Publicada')}>
                                  <i className="bi bi-check-circle me-2"></i> Publicar / Activar
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item small text-warning fw-bold" onClick={() => handleCambiarEstadoEncuesta(enc, 'Borrador')}>
                                  <i className="bi bi-pencil me-2"></i> Pasar a Borrador
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item small text-danger fw-bold" onClick={() => handleCambiarEstadoEncuesta(enc, 'Cerrada')}>
                                  <i className="bi bi-lock me-2"></i> Finalizar / Cerrar
                                </button>
                              </li>
                              {canCrearEncuestas && (
                                <>
                                  <li><hr className="dropdown-divider" /></li>
                                  <li>
                                    <button className="dropdown-item small text-secondary" onClick={() => handleDuplicarEncuesta(enc)}>
                                      <i className="bi bi-copy me-2"></i> Duplicar Encuesta
                                    </button>
                                  </li>
                                </>
                              )}
                              {canEliminarEncuestas && (
                                <li>
                                  <button className="dropdown-item small text-danger" onClick={() => handleEliminarEncuesta(enc.id, enc.titulo)}>
                                    <i className="bi bi-trash3-fill me-2"></i> Eliminar Encuesta
                                  </button>
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Descripción */}
                      <p className="text-muted small mb-3 text-truncate-2" style={{ minHeight: '38px' }}>
                        {enc.descripcion || 'Sin descripción adicional proporcionada.'}
                      </p>

                      {/* Roles Objetivo (Visible para administradores) */}
                      {!isSoloRespondiente && (
                        <div className="mb-3 p-2.5 rounded-3 bg-light border">
                          <small className="text-muted fw-bold d-block mb-1.5" style={{ fontSize: '0.72rem' }}>
                            <i className="bi bi-people-fill text-primary me-1"></i>
                            APLICA A LOS ROLES:
                          </small>
                          <div className="d-flex flex-wrap gap-1.5">
                            {roles.length === 0 ? (
                              <span className="badge bg-secondary text-white px-2 py-1">Sin roles asignados</span>
                            ) : (
                              roles.map(r => (
                                <span key={r} className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 rounded-pill" style={{ fontSize: '0.72rem' }}>
                                  👤 {r}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* Métricas y Datos Rápidos */}
                      <div className="row g-2 text-center mb-4">
                        <div className="col-4 border-end">
                          <small className="text-muted d-block fw-bold" style={{ fontSize: '0.7rem' }}>Preguntas</small>
                          <span className="fw-bolder fs-6 text-dark">{totalP} items</span>
                        </div>
                        <div className="col-4 border-end">
                          <small className="text-muted d-block fw-bold" style={{ fontSize: '0.7rem' }}>Vigencia</small>
                          <span className="fw-bold small text-dark">{enc.fecha_inicio || 'Inmediata'}</span>
                        </div>
                        <div className="col-4">
                          <small className="text-muted d-block fw-bold" style={{ fontSize: '0.7rem' }}>Modalidad</small>
                          <span className="fw-bold small text-truncate d-block text-secondary">{enc.es_anonima ? 'Anónima' : 'Identificada'}</span>
                        </div>
                      </div>

                      {/* Botones de Acción */}
                      {isSoloRespondiente ? (
                        <div className="mt-auto pt-3 border-top">
                          {yaResp && !enc.permitir_multiples_respuestas ? (
                            <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                              <span className="badge bg-success bg-opacity-10 text-success border border-success px-3 py-2 rounded-pill fw-bold">
                                <i className="bi bi-check-circle-fill me-1"></i> Respondida ({mapaRespuestasUsuario[enc.id]?.fecha})
                              </span>
                              <button 
                                className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold"
                                onClick={() => handleAbrirResponder(enc)}
                              >
                                <i className="bi bi-eye me-1"></i> Ver mi Respuesta
                              </button>
                            </div>
                          ) : (
                            <button 
                              className="btn btn-sm btn-primary rounded-pill px-4 py-2.5 fw-bold w-100 shadow-sm hover-efecto d-flex align-items-center justify-content-center gap-2"
                              onClick={() => handleAbrirResponder(enc)}
                              style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', border: 'none' }}
                            >
                              <i className="bi bi-pencil-square fs-6"></i>
                              <span>Responder Encuesta</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="d-flex flex-wrap gap-2 mt-auto pt-2 border-top">
                          {canCrearEncuestas && (
                            <button 
                              className="btn btn-sm btn-primary rounded-pill px-3 fw-bold flex-grow-1"
                              onClick={() => handleEditarEncuesta(enc)}
                              title="Modificar preguntas y roles"
                            >
                              <i className="bi bi-pencil-square me-1"></i> Diseñar / Editar
                            </button>
                          )}
                          {canVerEstadisticas && (
                            <button 
                              className="btn btn-sm btn-outline-info rounded-pill px-3 fw-bold text-dark"
                              onClick={() => handleVerEstadisticas(enc)}
                              title="Ver estadísticas y analíticas de respuestas"
                            >
                              <i className="bi bi-bar-chart-fill me-1"></i> Resultados
                            </button>
                          )}
                          {enc.estado === 'Publicada' && (
                            <button 
                              className="btn btn-sm btn-outline-success rounded-pill px-3 fw-bold"
                              onClick={() => handleAbrirResponder(enc)}
                              title="Probar o responder la encuesta"
                            >
                              <i className="bi bi-ui-checks me-1"></i> Responder
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 2: CONSTRUCTOR VISUAL DE ENCUESTAS (FORM BUILDER)   */}
      {/* ========================================================= */}
      {vistaActual === 'constructor' && encuestaActiva && (
        <div className="animate__animated animate__fadeIn">
          {/* Barra Superior de Control del Constructor */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 p-3 bg-white rounded-4 shadow-sm border mb-4">
            <div className="d-flex align-items-center gap-3">
              <button 
                onClick={() => setVistaActual('listado')} 
                className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold"
              >
                <i className="bi bi-arrow-left me-1"></i> Volver al Listado
              </button>
              <h5 className="fw-bolder mb-0 text-dark">
                {encuestaActiva.titulo ? encuestaActiva.titulo : 'Nueva Encuesta (Borrador)'}
              </h5>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button 
                type="button" 
                className={`btn btn-sm ${vistaPreviaModo ? 'btn-dark' : 'btn-outline-dark'} rounded-pill px-3 fw-bold`}
                onClick={() => setVistaPreviaModo(!vistaPreviaModo)}
              >
                <i className={`bi ${vistaPreviaModo ? 'bi-pencil-fill' : 'bi-eye-fill'} me-1`}></i>
                {vistaPreviaModo ? 'Modo Edición' : 'Vista Previa en Vivo'}
              </button>
              <button 
                type="button" 
                className="btn btn-sm btn-success rounded-pill px-4 fw-bold shadow-sm"
                onClick={handleGuardarEncuesta}
                disabled={saving}
              >
                {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check2-circle me-1.5 fs-6"></i>}
                Guardar Encuesta
              </button>
            </div>
          </div>

          {vistaPreviaModo ? (
            /* Vista Previa Interactiva */
            <div className="row justify-content-center">
              <div className="col-lg-8 col-12">
                <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5 bg-white">
                  <div className="text-center mb-4 pb-3 border-bottom">
                    <span className="badge bg-primary text-white px-3 py-1 rounded-pill fw-bold mb-2">VISTA PREVIA DE ENCUESTA</span>
                    <h3 className="fw-bolder text-dark mb-2">{encuestaActiva.titulo || 'Título de la Encuesta'}</h3>
                    <p className="text-muted">{encuestaActiva.descripcion || 'Sin descripción.'}</p>
                    <div className="d-flex justify-content-center flex-wrap gap-2 mt-2">
                      <span className="badge bg-light text-dark border">
                        <i className="bi bi-building me-1"></i>
                        {encuestaActiva.codigo_escuela === 'sb' ? 'Santa Bárbara' : encuestaActiva.codigo_escuela === 'lb' ? 'Libertador Bolívar' : 'Ambas Escuelas'}
                      </span>
                      <span className="badge bg-light text-dark border">
                        <i className="bi bi-people me-1"></i>
                        Aplica a: {encuestaActiva.roles_permitidos.join(', ') || 'Ninguno'}
                      </span>
                    </div>
                  </div>

                  {/* Render de Preguntas en Preview */}
                  <div className="d-flex flex-column gap-4">
                    {encuestaActiva.preguntas.map((p, idx) => (
                      <div className="p-4 rounded-4 bg-light border shadow-sm" key={p.id}>
                        <div className="d-flex align-items-start gap-2 mb-2">
                          <span className="badge bg-primary rounded-circle px-2 py-1">{idx + 1}</span>
                          <div>
                            <h6 className="fw-bold text-dark mb-1">
                              {p.enunciado || 'Enunciado de la pregunta...'}
                              {p.obligatoria && <span className="text-danger ms-1">*</span>}
                            </h6>
                            {p.descripcion && <small className="text-muted d-block">{p.descripcion}</small>}
                          </div>
                        </div>

                        {/* Input Preview según tipo */}
                        <div className="mt-3 ps-4">
                          {p.tipo === 'texto_corto' && (
                            <input type="text" className="form-control" placeholder="Tu respuesta breve..." disabled />
                          )}
                          {p.tipo === 'parrafo' && (
                            <textarea className="form-control" rows={3} placeholder="Escribe tu respuesta detallada..." disabled></textarea>
                          )}
                          {p.tipo === 'opcion_unica' && (
                            <div className="d-flex flex-column gap-2">
                              {p.opciones.map((opc, oIdx) => (
                                <div className="form-check" key={oIdx}>
                                  <input className="form-check-input" type="radio" name={`preview-${p.id}`} id={`prev-${p.id}-${oIdx}`} disabled />
                                  <label className="form-check-label" htmlFor={`prev-${p.id}-${oIdx}`}>{opc}</label>
                                </div>
                              ))}
                            </div>
                          )}
                          {p.tipo === 'casillas' && (
                            <div className="d-flex flex-column gap-2">
                              {p.opciones.map((opc, oIdx) => (
                                <div className="form-check" key={oIdx}>
                                  <input className="form-check-input" type="checkbox" id={`prev-cb-${p.id}-${oIdx}`} disabled />
                                  <label className="form-check-label" htmlFor={`prev-cb-${p.id}-${oIdx}`}>{opc}</label>
                                </div>
                              ))}
                            </div>
                          )}
                          {p.tipo === 'calificacion_estrellas' && (
                            <div className="d-flex gap-2 fs-3 text-warning">
                              {[1, 2, 3, 4, 5].map(st => (
                                <i className="bi bi-star cursor-pointer" key={st}></i>
                              ))}
                            </div>
                          )}
                          {p.tipo === 'escala_lineal' && (
                            <div>
                              <div className="d-flex justify-content-between small text-muted mb-1">
                                <span>{p.etiquetaMin || '1'}</span>
                                <span>{p.etiquetaMax || '10'}</span>
                              </div>
                              <div className="d-flex gap-1 justify-content-between">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                  <button key={num} type="button" className="btn btn-outline-secondary btn-sm flex-fill" disabled>{num}</button>
                                ))}
                              </div>
                            </div>
                          )}
                          {p.tipo === 'desplegable' && (
                            <select className="form-select" disabled>
                              <option value="">Selecciona una opción...</option>
                              {p.opciones.map((opc, oIdx) => <option key={oIdx}>{opc}</option>)}
                            </select>
                          )}
                          {p.tipo === 'booleano' && (
                            <div className="d-flex gap-3">
                              <div className="form-check">
                                <input className="form-check-input" type="radio" name={`prev-bool-${p.id}`} id={`prev-si-${p.id}`} disabled />
                                <label className="form-check-label fw-bold text-success" htmlFor={`prev-si-${p.id}`}>Sí</label>
                              </div>
                              <div className="form-check">
                                <input className="form-check-input" type="radio" name={`prev-bool-${p.id}`} id={`prev-no-${p.id}`} disabled />
                                <label className="form-check-label fw-bold text-danger" htmlFor={`prev-no-${p.id}`}>No</label>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-center mt-5 pt-3 border-top">
                    <button className="btn btn-primary btn-lg rounded-pill px-5 fw-bold" disabled>
                      Enviar Respuestas (Vista Previa)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Modo Edición del Constructor */
            <div className="row g-4">
              {/* Panel Izquierdo: Parámetros Generales y Segmentación de Roles */}
              <div className="col-lg-4 col-12">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white sticky-top" style={{ top: '90px' }}>
                  <h5 className="fw-bolder text-dark mb-3 d-flex align-items-center">
                    <i className="bi bi-gear-fill text-primary me-2"></i>Parámetros de la Encuesta
                  </h5>

                  {/* Título */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Título de la Encuesta <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      className="form-control fw-bold"
                      placeholder="Ej. Evaluación del Clima Escolar"
                      value={encuestaActiva.titulo}
                      onChange={(e) => setEncuestaActiva({ ...encuestaActiva, titulo: e.target.value })}
                    />
                  </div>

                  {/* Descripción */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Descripción o Instrucciones</label>
                    <textarea 
                      className="form-control"
                      rows={2}
                      placeholder="Indica el propósito de esta consulta..."
                      value={encuestaActiva.descripcion}
                      onChange={(e) => setEncuestaActiva({ ...encuestaActiva, descripcion: e.target.value })}
                    ></textarea>
                  </div>

                  {/* Institución */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Plantel Destino</label>
                    <select 
                      className="form-select fw-semibold"
                      value={encuestaActiva.codigo_escuela}
                      onChange={(e) => setEncuestaActiva({ ...encuestaActiva, codigo_escuela: e.target.value as any })}
                    >
                      <option value="ambas">🏫 Ambas Escuelas (SB y LB)</option>
                      <option value="sb">🏫 U.E. Santa Bárbara</option>
                      <option value="lb">🏫 U.E. Libertador Bolívar</option>
                    </select>
                  </div>

                  {/* SEGMENTACIÓN POR ROLES */}
                  <div className="mb-4 p-3 rounded-4 bg-light border">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <label className="form-label small fw-bolder text-dark mb-0 d-flex align-items-center">
                        <i className="bi bi-shield-check text-success me-1.5"></i>
                        Roles a los que Aplica
                      </label>
                      <div className="btn-group btn-group-sm">
                        <button type="button" className="btn btn-link p-0 text-primary small text-decoration-none fw-bold me-2" onClick={handleSeleccionarTodosRoles}>
                          Todos
                        </button>
                        <button type="button" className="btn btn-link p-0 text-muted small text-decoration-none" onClick={handleLimpiarRoles}>
                          Limpiar
                        </button>
                      </div>
                    </div>
                    <small className="text-muted d-block mb-2.5" style={{ fontSize: '0.72rem' }}>
                      Marca los roles de usuario que tendrán acceso para responder esta encuesta.
                    </small>

                    <div className="d-flex flex-column gap-1.5" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                      {rolesDisponibles.map(rol => {
                        const checked = encuestaActiva.roles_permitidos?.includes(rol);
                        return (
                          <div 
                            key={rol} 
                            className={`d-flex align-items-center justify-content-between p-2 rounded-3 cursor-pointer transition-all ${checked ? 'bg-primary bg-opacity-10 border border-primary border-opacity-25' : 'bg-white border'}`}
                            onClick={() => handleToggleRolDestino(rol)}
                          >
                            <span className={`small fw-bold ${checked ? 'text-primary' : 'text-secondary'}`}>
                              👤 {rol}
                            </span>
                            <div className="form-check mb-0">
                              <input 
                                className="form-check-input hover-mano" 
                                type="checkbox" 
                                checked={checked}
                                onChange={() => {}} // controlado por div onClick
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Opciones Adicionales */}
                  <div className="d-flex flex-column gap-2 mb-4">
                    <div className="form-check form-switch">
                      <input 
                        className="form-check-input hover-mano" 
                        type="checkbox" 
                        id="switchObligatoria"
                        checked={encuestaActiva.es_obligatoria}
                        onChange={(e) => setEncuestaActiva({ ...encuestaActiva, es_obligatoria: e.target.checked })}
                      />
                      <label className="form-check-label small fw-bold text-dark" htmlFor="switchObligatoria">
                        Encuesta Obligatoria
                      </label>
                    </div>

                    <div className="form-check form-switch">
                      <input 
                        className="form-check-input hover-mano" 
                        type="checkbox" 
                        id="switchAnonima"
                        checked={encuestaActiva.es_anonima}
                        onChange={(e) => setEncuestaActiva({ ...encuestaActiva, es_anonima: e.target.checked })}
                      />
                      <label className="form-check-label small fw-bold text-dark" htmlFor="switchAnonima">
                        Respuestas Anónimas
                      </label>
                    </div>

                    <div className="form-check form-switch">
                      <input 
                        className="form-check-input hover-mano" 
                        type="checkbox" 
                        id="switchMultiplesResp"
                        checked={encuestaActiva.permitir_multiples_respuestas}
                        onChange={(e) => setEncuestaActiva({ ...encuestaActiva, permitir_multiples_respuestas: e.target.checked })}
                      />
                      <label className="form-check-label small fw-bold text-dark" htmlFor="switchMultiplesResp">
                        Permitir múltiples respuestas
                      </label>
                      <small className="text-muted d-block" style={{ fontSize: '0.68rem' }}>
                        {encuestaActiva.permitir_multiples_respuestas 
                          ? 'Los usuarios pueden responder más de una vez.' 
                          : 'Se limitará a una sola respuesta por usuario / cédula.'}
                      </small>
                    </div>
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="form-label small fw-bold text-muted">Estado de Publicación</label>
                    <select 
                      className="form-select fw-bold"
                      value={encuestaActiva.estado}
                      onChange={(e) => setEncuestaActiva({ ...encuestaActiva, estado: e.target.value as any })}
                    >
                      <option value="Borrador">🟡 Borrador (En diseño)</option>
                      <option value="Publicada">🟢 Publicada (Activa para usuarios)</option>
                      <option value="Cerrada">🔴 Cerrada (No admite más respuestas)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Panel Derecho: Constructor Dinámico de Preguntas */}
              <div className="col-lg-8 col-12">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="fw-bolder text-dark mb-0">
                    <i className="bi bi-card-checklist text-primary me-2"></i>
                    Preguntas de la Encuesta ({encuestaActiva.preguntas.length})
                  </h5>

                  {/* Dropdown Agregar Tipo de Pregunta */}
                  <div className="dropdown">
                    <button className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm dropdown-toggle" data-bs-toggle="dropdown">
                      <i className="bi bi-plus-circle-fill me-1.5"></i> Agregar Pregunta
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-4 p-2" style={{ minWidth: '260px' }}>
                      <li><h6 className="dropdown-header text-uppercase small">Tipos de Pregunta</h6></li>
                      <li>
                        <button className="dropdown-item rounded-3 py-2" onClick={() => handleAgregarPregunta('opcion_unica')}>
                          <i className="bi bi-ui-radios text-primary me-2 fs-5"></i> Opción Única (Radio)
                        </button>
                      </li>
                      <li>
                        <button className="dropdown-item rounded-3 py-2" onClick={() => handleAgregarPregunta('casillas')}>
                          <i className="bi bi-ui-checks text-success me-2 fs-5"></i> Casillas (Múltiple Selección)
                        </button>
                      </li>
                      <li>
                        <button className="dropdown-item rounded-3 py-2" onClick={() => handleAgregarPregunta('calificacion_estrellas')}>
                          <i className="bi bi-star-fill text-warning me-2 fs-5"></i> Calificación (1 a 5 Estrellas)
                        </button>
                      </li>
                      <li>
                        <button className="dropdown-item rounded-3 py-2" onClick={() => handleAgregarPregunta('escala_lineal')}>
                          <i className="bi bi-sliders text-info me-2 fs-5"></i> Escala Numérica (1 a 10)
                        </button>
                      </li>
                      <li>
                        <button className="dropdown-item rounded-3 py-2" onClick={() => handleAgregarPregunta('texto_corto')}>
                          <i className="bi bi-fonts text-secondary me-2 fs-5"></i> Texto Corto (Una línea)
                        </button>
                      </li>
                      <li>
                        <button className="dropdown-item rounded-3 py-2" onClick={() => handleAgregarPregunta('parrafo')}>
                          <i className="bi bi-text-paragraph text-secondary me-2 fs-5"></i> Párrafo / Texto Largo
                        </button>
                      </li>
                      <li>
                        <button className="dropdown-item rounded-3 py-2" onClick={() => handleAgregarPregunta('desplegable')}>
                          <i className="bi bi-menu-button-wide text-indigo me-2 fs-5"></i> Menú Desplegable (Select)
                        </button>
                      </li>
                      <li>
                        <button className="dropdown-item rounded-3 py-2" onClick={() => handleAgregarPregunta('booleano')}>
                          <i className="bi bi-toggle-on text-danger me-2 fs-5"></i> Sí / No (Booleano)
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Lista de Preguntas Editables */}
                <div className="d-flex flex-column gap-3">
                  {encuestaActiva.preguntas.map((p, idx) => (
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white" key={p.id}>
                      {/* Cabecera de la Pregunta */}
                      <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-primary rounded-circle px-2 py-1">{idx + 1}</span>
                          <span className="badge bg-light text-dark border px-2.5 py-1 rounded-pill small fw-semibold">
                            <i className={`bi ${getBadgeIconTipo(p.tipo)} me-1`}></i>
                            {getNombreTipo(p.tipo)}
                          </span>
                        </div>

                        {/* Botones de Reordenar y Acciones */}
                        <div className="d-flex align-items-center gap-1">
                          <button 
                            className="btn btn-sm btn-light rounded-circle shadow-none p-1.5" 
                            disabled={idx === 0}
                            onClick={() => handleMoverPregunta(idx, 'arriba')}
                            title="Mover arriba"
                          >
                            <i className="bi bi-chevron-up"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-light rounded-circle shadow-none p-1.5" 
                            disabled={idx === encuestaActiva.preguntas.length - 1}
                            onClick={() => handleMoverPregunta(idx, 'abajo')}
                            title="Mover abajo"
                          >
                            <i className="bi bi-chevron-down"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-light text-primary rounded-circle shadow-none p-1.5" 
                            onClick={() => handleDuplicarPregunta(idx)}
                            title="Duplicar pregunta"
                          >
                            <i className="bi bi-copy"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-light text-danger rounded-circle shadow-none p-1.5" 
                            onClick={() => handleEliminarPregunta(idx)}
                            title="Eliminar pregunta"
                          >
                            <i className="bi bi-trash3-fill"></i>
                          </button>
                        </div>
                      </div>

                      {/* Enunciado */}
                      <div className="mb-3">
                        <input 
                          type="text" 
                          className="form-control form-control-lg fw-bold border-0 bg-light rounded-3"
                          placeholder="Escribe el enunciado de la pregunta aquí..."
                          value={p.enunciado}
                          onChange={(e) => {
                            const nuevas = [...encuestaActiva.preguntas];
                            nuevas[idx].enunciado = e.target.value;
                            setEncuestaActiva({ ...encuestaActiva, preguntas: nuevas });
                          }}
                        />
                      </div>

                      {/* Opciones para Radio / Checkbox / Select */}
                      {['opcion_unica', 'casillas', 'desplegable'].includes(p.tipo) && (
                        <div className="mb-3 ps-2">
                          <label className="form-label small fw-bold text-muted mb-2">Opciones de Respuesta:</label>
                          <div className="d-flex flex-column gap-2">
                            {p.opciones.map((opc, oIdx) => (
                              <div className="input-group input-group-sm" key={oIdx}>
                                <span className="input-group-text bg-light border-0">
                                  <i className={`bi ${p.tipo === 'casillas' ? 'bi-square' : 'bi-circle'}`}></i>
                                </span>
                                <input 
                                  type="text" 
                                  className="form-control"
                                  placeholder={`Opción ${oIdx + 1}`}
                                  value={opc}
                                  onChange={(e) => {
                                    const nuevas = [...encuestaActiva.preguntas];
                                    nuevas[idx].opciones[oIdx] = e.target.value;
                                    setEncuestaActiva({ ...encuestaActiva, preguntas: nuevas });
                                  }}
                                />
                                <button 
                                  className="btn btn-outline-danger" 
                                  type="button"
                                  disabled={p.opciones.length <= 2}
                                  onClick={() => {
                                    const nuevas = [...encuestaActiva.preguntas];
                                    nuevas[idx].opciones.splice(oIdx, 1);
                                    setEncuestaActiva({ ...encuestaActiva, preguntas: nuevas });
                                  }}
                                >
                                  <i className="bi bi-x"></i>
                                </button>
                              </div>
                            ))}
                          </div>
                          <button 
                            type="button" 
                            className="btn btn-link btn-sm text-primary fw-bold text-decoration-none mt-2 p-0"
                            onClick={() => {
                              const nuevas = [...encuestaActiva.preguntas];
                              nuevas[idx].opciones.push(`Opción ${nuevas[idx].opciones.length + 1}`);
                              setEncuestaActiva({ ...encuestaActiva, preguntas: nuevas });
                            }}
                          >
                            <i className="bi bi-plus-lg me-1"></i> Agregar otra opción
                          </button>
                        </div>
                      )}

                      {/* Configuración Escala Lineal */}
                      {p.tipo === 'escala_lineal' && (
                        <div className="row g-2 mb-3 bg-light p-3 rounded-3">
                          <div className="col-6">
                            <label className="form-label small text-muted">Etiqueta Mínima (1)</label>
                            <input 
                              type="text" 
                              className="form-control form-control-sm"
                              placeholder="Ej. Muy en desacuerdo"
                              value={p.etiquetaMin || ''}
                              onChange={(e) => {
                                const nuevas = [...encuestaActiva.preguntas];
                                nuevas[idx].etiquetaMin = e.target.value;
                                setEncuestaActiva({ ...encuestaActiva, preguntas: nuevas });
                              }}
                            />
                          </div>
                          <div className="col-6">
                            <label className="form-label small text-muted">Etiqueta Máxima (10)</label>
                            <input 
                              type="text" 
                              className="form-control form-control-sm"
                              placeholder="Ej. Totalmente de acuerdo"
                              value={p.etiquetaMax || ''}
                              onChange={(e) => {
                                const nuevas = [...encuestaActiva.preguntas];
                                nuevas[idx].etiquetaMax = e.target.value;
                                setEncuestaActiva({ ...encuestaActiva, preguntas: nuevas });
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Pie de la Pregunta (Obligatoria Switch) */}
                      <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                        <small className="text-muted">
                          ID: <code className="text-muted">{p.id}</code>
                        </small>
                        <div className="form-check form-switch mb-0">
                          <input 
                            className="form-check-input hover-mano" 
                            type="checkbox" 
                            id={`req-${p.id}`}
                            checked={p.obligatoria}
                            onChange={(e) => {
                              const nuevas = [...encuestaActiva.preguntas];
                              nuevas[idx].obligatoria = e.target.checked;
                              setEncuestaActiva({ ...encuestaActiva, preguntas: nuevas });
                            }}
                          />
                          <label className="form-check-label small fw-bold text-dark" htmlFor={`req-${p.id}`}>
                            Obligatoria
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 3: ESTADÍSTICAS Y ANALÍTICAS DE RESULTADOS          */}
      {/* ========================================================= */}
      {vistaActual === 'estadisticas' && encuestaActiva && (
        <div className="animate__animated animate__fadeIn">
          {/* Cabecera de Estadísticas */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <span className="badge bg-primary text-white px-3 py-1 rounded-pill mb-2">ANÁLISIS DE RESULTADOS</span>
                <h3 className="fw-bolder text-dark mb-1">{encuestaActiva.titulo}</h3>
                <p className="text-muted small mb-0">{encuestaActiva.descripcion}</p>
              </div>

              <div className="d-flex flex-wrap gap-2">
                <button 
                  className="btn btn-outline-success rounded-pill px-4 fw-bold shadow-sm"
                  onClick={handleExportarExcel}
                  disabled={respuestasEncuesta.length === 0}
                >
                  <i className="bi bi-file-earmark-excel-fill me-1.5"></i> Exportar a Excel (.xlsx)
                </button>
                <button 
                  className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
                  onClick={() => setVistaActual('listado')}
                >
                  Volver al Listado
                </button>
              </div>
            </div>

            <hr className="my-3 text-muted opacity-25" />

            {/* Tarjetas de Métricas Resumen */}
            <div className="row g-3">
              <div className="col-md-3 col-6">
                <div className="p-3 bg-light rounded-4 border text-center">
                  <small className="text-muted d-block fw-bold" style={{ fontSize: '0.75rem' }}>TOTAL RESPUESTAS</small>
                  <span className="fw-bolder fs-3 text-primary">{respuestasEncuesta.length}</span>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="p-3 bg-light rounded-4 border text-center">
                  <small className="text-muted d-block fw-bold" style={{ fontSize: '0.75rem' }}>TOTAL PREGUNTAS</small>
                  <span className="fw-bolder fs-3 text-dark">{encuestaActiva.preguntas.length}</span>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="p-3 bg-light rounded-4 border text-center">
                  <small className="text-muted d-block fw-bold" style={{ fontSize: '0.75rem' }}>ESTADO</small>
                  <span className={`fw-bolder fs-5 ${encuestaActiva.estado === 'Publicada' ? 'text-success' : 'text-warning'}`}>
                    {encuestaActiva.estado}
                  </span>
                </div>
              </div>
              <div className="col-md-3 col-6">
                <div className="p-3 bg-light rounded-4 border text-center">
                  <small className="text-muted d-block fw-bold" style={{ fontSize: '0.75rem' }}>ROLES OBJETIVO</small>
                  <span className="fw-bolder fs-6 text-secondary d-block text-truncate">
                    {encuestaActiva.roles_permitidos.join(', ') || 'Todos'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Desglose por Pregunta */}
          {respuestasEncuesta.length === 0 ? (
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
              <i className="bi bi-bar-chart-line text-muted opacity-50 fs-1 mb-2"></i>
              <h5 className="fw-bold text-dark">Aún no se han recibido respuestas</h5>
              <p className="text-muted small">Cuando los usuarios con los roles autorizados respondan la encuesta, verás los gráficos y resúmenes aquí.</p>
            </div>
          ) : (
            <div className="row g-4">
              {encuestaActiva.preguntas.map((p, idx) => {
                const todasLasRespuestasPregunta = respuestasEncuesta.map(r => r.respuestas[p.id]).filter(v => v !== undefined && v !== null && v !== '');

                return (
                  <div className="col-lg-6 col-12" key={p.id}>
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <span className="badge bg-primary rounded-circle px-2 py-1">{idx + 1}</span>
                        <span className="badge bg-light text-muted border small">
                          {todasLasRespuestasPregunta.length} respuestas
                        </span>
                      </div>
                      <h6 className="fw-bolder text-dark mb-3">{p.enunciado}</h6>

                      {/* Analítica para Opción Única / Casillas / Desplegable */}
                      {['opcion_unica', 'casillas', 'desplegable', 'booleano'].includes(p.tipo) && (
                        <div className="d-flex flex-column gap-2.5">
                          {p.opciones.map(opc => {
                            let conteo = 0;
                            todasLasRespuestasPregunta.forEach(resp => {
                              if (Array.isArray(resp)) {
                                if (resp.includes(opc)) conteo++;
                              } else if (resp === opc) {
                                conteo++;
                              }
                            });
                            const pct = todasLasRespuestasPregunta.length > 0 ? Math.round((conteo / todasLasRespuestasPregunta.length) * 100) : 0;

                            return (
                              <div key={opc}>
                                <div className="d-flex justify-content-between small fw-bold mb-1">
                                  <span className="text-dark">{opc}</span>
                                  <span className="text-muted">{conteo} ({pct}%)</span>
                                </div>
                                <div className="progress" style={{ height: '8px', backgroundColor: '#f1f5f9' }}>
                                  <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${pct}%` }}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Analítica para Estrellas */}
                      {p.tipo === 'calificacion_estrellas' && (
                        <div>
                          {(() => {
                            const numeros = todasLasRespuestasPregunta.map(v => Number(v)).filter(n => !isNaN(n));
                            const promedio = numeros.length > 0 ? (numeros.reduce((a, b) => a + b, 0) / numeros.length).toFixed(1) : '0.0';

                            return (
                              <div className="text-center py-3 bg-light rounded-4 border">
                                <h2 className="fw-bolder text-dark mb-1">{promedio} <span className="fs-5 text-muted">/ 5.0</span></h2>
                                <div className="fs-4 text-warning mb-2">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <i key={star} className={`bi ${Number(promedio) >= star ? 'bi-star-fill' : Number(promedio) >= star - 0.5 ? 'bi-star-half' : 'bi-star'}`}></i>
                                  ))}
                                </div>
                                <small className="text-muted">Promedio de satisfacción general ({numeros.length} votos)</small>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Analítica para Escala Numérica */}
                      {p.tipo === 'escala_lineal' && (
                        <div>
                          {(() => {
                            const numeros = todasLasRespuestasPregunta.map(v => Number(v)).filter(n => !isNaN(n));
                            const promedio = numeros.length > 0 ? (numeros.reduce((a, b) => a + b, 0) / numeros.length).toFixed(1) : '0.0';

                            return (
                              <div className="text-center py-3 bg-light rounded-4 border">
                                <h2 className="fw-bolder text-primary mb-1">{promedio} <span className="fs-5 text-muted">/ 10</span></h2>
                                <small className="text-muted d-block mb-3">Puntuación promedio otorgada</small>
                                <div className="d-flex justify-content-between text-muted small px-3">
                                  <span>{p.etiquetaMin || '1 (Mínimo)'}</span>
                                  <span>{p.etiquetaMax || '10 (Máximo)'}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Analítica para Texto Corto y Párrafo */}
                      {['texto_corto', 'parrafo'].includes(p.tipo) && (
                        <div className="d-flex flex-column gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {todasLasRespuestasPregunta.slice(0, 10).map((txt, tIdx) => (
                            <div className="p-2.5 bg-light rounded-3 border small text-dark" key={tIdx}>
                              <i className="bi bi-chat-quote me-1.5 text-primary"></i>
                              "{String(txt)}"
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 4: RESPONDER ENCUESTA INTERACTIVA                   */}
      {/* ========================================================= */}
      {vistaActual === 'responder' && encuestaActiva && (
        <div className="animate__animated animate__fadeIn row justify-content-center">
          <div className="col-lg-8 col-12">
            <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5 bg-white">
              <div className="text-center mb-4 pb-3 border-bottom">
                <span className="badge bg-success text-white px-3 py-1 rounded-pill fw-bold mb-2">MODO RESPUESTA</span>
                <h3 className="fw-bolder text-dark mb-2">{encuestaActiva.titulo}</h3>
                <p className="text-muted">{encuestaActiva.descripcion}</p>
                {encuestaActiva.es_anonima && (
                  <div className="alert alert-info border-0 bg-info bg-opacity-10 py-2 small d-inline-block rounded-pill px-4 text-info fw-bold mb-3">
                    <i className="bi bi-incognito me-1.5"></i> Esta encuesta es anónima. Tu nombre y cédula no serán vinculados a tus respuestas.
                  </div>
                )}

                {yaRespondio && (
                  <div className="alert alert-warning border-0 bg-warning bg-opacity-10 d-flex align-items-center justify-content-center gap-3 p-3 rounded-4 mt-2 text-dark">
                    <i className="bi bi-exclamation-triangle-fill text-warning fs-4"></i>
                    <div className="text-start">
                      <strong className="d-block">Ya has completado esta encuesta</strong>
                      <small className="text-muted">
                        Registraste tu respuesta {fechaRespuestaAnterior ? `el ${fechaRespuestaAnterior}` : 'anteriormente'}. Esta consulta está configurada para admitir una sola respuesta por usuario.
                      </small>
                    </div>
                  </div>
                )}
              </div>

              {/* Formulario de Preguntas */}
              <div className="d-flex flex-column gap-4">
                {encuestaActiva.preguntas.map((p, idx) => (
                  <div className="p-4 rounded-4 bg-light border shadow-sm" key={p.id}>
                    <div className="d-flex align-items-start gap-2 mb-2">
                      <span className="badge bg-primary rounded-circle px-2 py-1">{idx + 1}</span>
                      <div>
                        <h6 className="fw-bold text-dark mb-1">
                          {p.enunciado}
                          {p.obligatoria && <span className="text-danger ms-1">*</span>}
                        </h6>
                        {p.descripcion && <small className="text-muted d-block">{p.descripcion}</small>}
                      </div>
                    </div>

                    <div className="mt-3 ps-4">
                      {p.tipo === 'texto_corto' && (
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Tu respuesta..." 
                          value={respuestasForm[p.id] || ''}
                          onChange={(e) => setRespuestasForm({ ...respuestasForm, [p.id]: e.target.value })}
                        />
                      )}

                      {p.tipo === 'parrafo' && (
                        <textarea 
                          className="form-control" 
                          rows={3} 
                          placeholder="Escribe tu respuesta detallada aquí..."
                          value={respuestasForm[p.id] || ''}
                          onChange={(e) => setRespuestasForm({ ...respuestasForm, [p.id]: e.target.value })}
                        ></textarea>
                      )}

                      {p.tipo === 'opcion_unica' && (
                        <div className="d-flex flex-column gap-2">
                          {p.opciones.map((opc, oIdx) => (
                            <div className="form-check" key={oIdx}>
                              <input 
                                className="form-check-input hover-mano" 
                                type="radio" 
                                name={`resp-${p.id}`} 
                                id={`resp-${p.id}-${oIdx}`}
                                checked={respuestasForm[p.id] === opc}
                                onChange={() => setRespuestasForm({ ...respuestasForm, [p.id]: opc })}
                              />
                              <label className="form-check-label hover-mano" htmlFor={`resp-${p.id}-${oIdx}`}>{opc}</label>
                            </div>
                          ))}
                        </div>
                      )}

                      {p.tipo === 'casillas' && (
                        <div className="d-flex flex-column gap-2">
                          {p.opciones.map((opc, oIdx) => {
                            const seleccionadas = Array.isArray(respuestasForm[p.id]) ? respuestasForm[p.id] : [];
                            const estaMarcada = seleccionadas.includes(opc);

                            return (
                              <div className="form-check" key={oIdx}>
                                <input 
                                  className="form-check-input hover-mano" 
                                  type="checkbox" 
                                  id={`resp-cb-${p.id}-${oIdx}`}
                                  checked={estaMarcada}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setRespuestasForm({ ...respuestasForm, [p.id]: [...seleccionadas, opc] });
                                    } else {
                                      setRespuestasForm({ ...respuestasForm, [p.id]: seleccionadas.filter((s: string) => s !== opc) });
                                    }
                                  }}
                                />
                                <label className="form-check-label hover-mano" htmlFor={`resp-cb-${p.id}-${oIdx}`}>{opc}</label>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {p.tipo === 'calificacion_estrellas' && (
                        <div className="d-flex gap-2 fs-3 text-warning">
                          {[1, 2, 3, 4, 5].map(st => (
                            <i 
                              key={st} 
                              className={`bi ${(respuestasForm[p.id] || 0) >= st ? 'bi-star-fill' : 'bi-star'} cursor-pointer hover-scale`}
                              onClick={() => setRespuestasForm({ ...respuestasForm, [p.id]: st })}
                            ></i>
                          ))}
                        </div>
                      )}

                      {p.tipo === 'escala_lineal' && (
                        <div>
                          <div className="d-flex justify-content-between small text-muted mb-1">
                            <span>{p.etiquetaMin || '1 (Mínimo)'}</span>
                            <span>{p.etiquetaMax || '10 (Máximo)'}</span>
                          </div>
                          <div className="d-flex gap-1 justify-content-between">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                              <button 
                                key={num} 
                                type="button" 
                                className={`btn btn-sm flex-fill fw-bold ${respuestasForm[p.id] === num ? 'btn-primary' : 'btn-outline-secondary'}`}
                                onClick={() => setRespuestasForm({ ...respuestasForm, [p.id]: num })}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {p.tipo === 'desplegable' && (
                        <select 
                          className="form-select"
                          value={respuestasForm[p.id] || ''}
                          onChange={(e) => setRespuestasForm({ ...respuestasForm, [p.id]: e.target.value })}
                        >
                          <option value="">Selecciona una opción...</option>
                          {p.opciones.map((opc, oIdx) => <option key={oIdx} value={opc}>{opc}</option>)}
                        </select>
                      )}

                      {p.tipo === 'booleano' && (
                        <div className="d-flex gap-4">
                          <div className="form-check">
                            <input 
                              className="form-check-input hover-mano" 
                              type="radio" 
                              name={`resp-bool-${p.id}`} 
                              id={`resp-si-${p.id}`}
                              checked={respuestasForm[p.id] === 'Sí'}
                              onChange={() => setRespuestasForm({ ...respuestasForm, [p.id]: 'Sí' })}
                            />
                            <label className="form-check-label hover-mano fw-bold text-success" htmlFor={`resp-si-${p.id}`}>Sí</label>
                          </div>
                          <div className="form-check">
                            <input 
                              className="form-check-input hover-mano" 
                              type="radio" 
                              name={`resp-bool-${p.id}`} 
                              id={`resp-no-${p.id}`}
                              checked={respuestasForm[p.id] === 'No'}
                              onChange={() => setRespuestasForm({ ...respuestasForm, [p.id]: 'No' })}
                            />
                            <label className="form-check-label hover-mano fw-bold text-danger" htmlFor={`resp-no-${p.id}`}>No</label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Botón de Enviar */}
              <div className="d-flex justify-content-between align-items-center mt-5 pt-3 border-top">
                <button 
                  type="button" 
                  className="btn btn-light rounded-pill px-4 fw-bold"
                  onClick={() => setVistaActual('listado')}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className={`btn btn-lg rounded-pill px-5 fw-bold shadow ${yaRespondio && !encuestaActiva.permitir_multiples_respuestas ? 'btn-secondary' : 'btn-success'}`}
                  onClick={handleEnviarRespuesta}
                  disabled={saving || (yaRespondio && !encuestaActiva.permitir_multiples_respuestas)}
                >
                  {saving ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : yaRespondio && !encuestaActiva.permitir_multiples_respuestas ? (
                    <>
                      <i className="bi bi-check-circle-fill me-2"></i> Encuesta Ya Respondida
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-fill me-2"></i> Enviar mis Respuestas
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Script SQL para Supabase */}
      {showSqlModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              <div className="modal-header bg-dark text-white p-4">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-database me-2 text-primary"></i> Script SQL para Tablas de Encuestas
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowSqlModal(false)}></button>
              </div>
              <div className="modal-body p-4 bg-light">
                <p className="text-muted small mb-3">
                  Ejecuta este script en el SQL Editor de tu consola de Supabase si deseas sincronizar las encuestas y respuestas en la nube de forma persistente.
                </p>
                <pre className="p-3 bg-dark text-success rounded-3 small overflow-auto font-monospace" style={{ maxHeight: '280px' }}>
{`-- 1. Tabla de Encuestas
CREATE TABLE IF NOT EXISTS public.encuestas (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  codigo_escuela TEXT DEFAULT 'ambas',
  roles_permitidos JSONB DEFAULT '[]'::jsonb,
  estado TEXT DEFAULT 'Borrador',
  es_obligatoria BOOLEAN DEFAULT false,
  es_anonima BOOLEAN DEFAULT false,
  permitir_multiples_respuestas BOOLEAN DEFAULT false,
  fecha_inicio TEXT,
  fecha_fin TEXT,
  preguntas JSONB DEFAULT '[]'::jsonb,
  creado_por TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Respuestas de Encuestas
CREATE TABLE IF NOT EXISTS public.encuestas_respuestas (
  id TEXT PRIMARY KEY,
  encuesta_id TEXT REFERENCES public.encuestas(id) ON DELETE CASCADE,
  usuario_cedula TEXT,
  usuario_nombre TEXT,
  usuario_rol TEXT,
  codigo_escuela TEXT,
  respuestas JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS público para SIGAE
ALTER TABLE public.encuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encuestas_respuestas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total encuestas" ON public.encuestas FOR ALL USING (true);
CREATE POLICY "Acceso total respuestas" ON public.encuestas_respuestas FOR ALL USING (true);`}
                </pre>
              </div>
              <div className="modal-footer bg-white border-top p-3">
                <button 
                  type="button" 
                  className="btn btn-outline-primary fw-bold rounded-pill px-4"
                  onClick={() => {
                    navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS public.encuestas (\n  id TEXT PRIMARY KEY,\n  titulo TEXT NOT NULL,\n  descripcion TEXT,\n  codigo_escuela TEXT DEFAULT 'ambas',\n  roles_permitidos JSONB DEFAULT '[]'::jsonb,\n  estado TEXT DEFAULT 'Borrador',\n  es_obligatoria BOOLEAN DEFAULT false,\n  es_anonima BOOLEAN DEFAULT false,\n  permitir_multiples_respuestas BOOLEAN DEFAULT false,\n  fecha_inicio TEXT,\n  fecha_fin TEXT,\n  preguntas JSONB DEFAULT '[]'::jsonb,\n  creado_por TEXT,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);\n\nCREATE TABLE IF NOT EXISTS public.encuestas_respuestas (\n  id TEXT PRIMARY KEY,\n  encuesta_id TEXT REFERENCES public.encuestas(id) ON DELETE CASCADE,\n  usuario_cedula TEXT,\n  usuario_nombre TEXT,\n  usuario_rol TEXT,\n  codigo_escuela TEXT,\n  respuestas JSONB DEFAULT '{}'::jsonb,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);\n\nALTER TABLE public.encuestas ENABLE ROW LEVEL SECURITY;\nALTER TABLE public.encuestas_respuestas ENABLE ROW LEVEL SECURITY;\n\nCREATE POLICY "Acceso total encuestas" ON public.encuestas FOR ALL USING (true);\nCREATE POLICY "Acceso total respuestas" ON public.encuestas_respuestas FOR ALL USING (true);`);
                    if (Swal) Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'SQL copiado al portapapeles', timer: 2000, showConfirmButton: false });
                  }}
                >
                  <i className="bi bi-clipboard me-1"></i> Copiar SQL
                </button>
                <button type="button" className="btn btn-secondary fw-bold rounded-pill px-4" onClick={() => setShowSqlModal(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConstructorEncuestas;
