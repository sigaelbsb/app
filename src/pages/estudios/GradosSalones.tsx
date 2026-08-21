import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';
import { formatPhoneNumber } from '../../lib/formatters';

interface GradoItem {
  id_parametro: string;
  valor: string;
  orden: number;
}

interface SeccionItem {
  id_parametro: string;
  valor: string;
}

interface NivelItem {
  id_parametro: string;
  valor: string;
}

interface EspacioItem {
  id: string;
  nombre: string;
  tipo: string;
  capacidad: number;
  id_escuela: string;
  ubicacion?: string;
  descripcion?: string;
  created_at?: string;
}

interface SalonItem {
  id_salon: string;
  id_escuela: string;
  nivel_educativo: string;
  grado_anio: string;
  seccion: string;
  nombre_salon: string;
  id_espacio: string;
  estatus: string;
  docentes_guias?: string[];
}

interface EstudianteVinculado {
  id?: string;
  cedula_estudiante: string;
  nombres_estudiante: string;
  apellidos_estudiante: string;
  grado_actual: string;
  seccion_actual: string;
  codigo_escuela: string;
  cedula_representante?: string;
  estado?: string;
  created_at?: string;
}

interface GradosSalonesProps {
  defaultTab?: 'espacios' | 'salones' | 'matricula' | 'reportes';
}

export const GradosSalones: React.FC<GradosSalonesProps> = ({ defaultTab = 'salones' }) => {
  const navigate = useNavigate();
  const { tienePermiso, tienePermisoEnEscuela, loading: permLoading } = usePermisos();
  const Swal = (window as any).Swal;
  const html2pdf = (window as any).html2pdf;

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'espacios' | 'salones' | 'matricula' | 'reportes'>(defaultTab);

  // General State
  const [niveles, setNiveles] = useState<NivelItem[]>([]);
  const [grados, setGrados] = useState<GradoItem[]>([]);
  const [secciones, setSecciones] = useState<SeccionItem[]>([]);
  const [espacios, setEspacios] = useState<EspacioItem[]>([]);
  const [salones, setSalones] = useState<SalonItem[]>([]);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [estudiantes, setEstudiantes] = useState<EstudianteVinculado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters and Selection
  const [escuelaFiltro, setEscuelaFiltro] = useState<string>('todas');
  const [criterioOrden, setCriterioOrden] = useState<string>('jerarquia_grupos');
  const [searchEspacios, setSearchEspacios] = useState<string>('');
  const [searchSalones, setSearchSalones] = useState<string>('');
  const [searchEstudiantes, setSearchEstudiantes] = useState<string>('');
  const [paginaActualEspacios, setPaginaActualEspacios] = useState<number>(1);
  const itemsPorPaginaEspacios = 8;

  // Espacios form & selection state
  const [formEspacio, setFormEspacio] = useState<{ nombre: string; tipo: string; capacidad: number; id_escuela: string; ubicacion: string; descripcion: string }>({
    nombre: '',
    tipo: 'Aula de Clases',
    capacidad: 35,
    id_escuela: 'sb',
    ubicacion: '',
    descripcion: ''
  });
  const [editandoEspacioId, setEditandoEspacioId] = useState<string | null>(null);
  const [seleccionadosEspacios, setSeleccionadosEspacios] = useState<string[]>([]);

  // Sub-tab for Salones config
  const [subTabSalones, setSubTabSalones] = useState<'apertura' | 'grados' | 'secciones'>('apertura');

  // Selected Salon for Matrícula & Docente Guía view
  const [salonSeleccionadoId, setSalonSeleccionadoId] = useState<string>('');

  // Permissions Checks
  const hasAccessSB_Esp = tienePermisoEnEscuela('sb', 'Grados y Salones', 'ver') || tienePermisoEnEscuela('sb', 'Tarjeta: Ambientes y Espacios Físicos', 'ver') || tienePermisoEnEscuela('sb', 'Tarjeta: Apertura de Salones', 'ver');
  const hasAccessLB_Esp = tienePermisoEnEscuela('lb', 'Grados y Salones', 'ver') || tienePermisoEnEscuela('lb', 'Tarjeta: Ambientes y Espacios Físicos', 'ver') || tienePermisoEnEscuela('lb', 'Tarjeta: Apertura de Salones', 'ver');
  const canCreateSB_Esp = tienePermisoEnEscuela('sb', 'Tarjeta: Ambientes y Espacios Físicos', 'crear') || tienePermisoEnEscuela('sb', 'Grados y Salones', 'crear');
  const canCreateLB_Esp = tienePermisoEnEscuela('lb', 'Tarjeta: Ambientes y Espacios Físicos', 'crear') || tienePermisoEnEscuela('lb', 'Grados y Salones', 'crear');

  const canSalonesSB = tienePermisoEnEscuela('sb', 'Tarjeta: Apertura de Salones', 'ver') || hasAccessSB_Esp;
  const canSalonesLB = tienePermisoEnEscuela('lb', 'Tarjeta: Apertura de Salones', 'ver') || hasAccessLB_Esp;

  const canCrearSalonesSB = tienePermisoEnEscuela('sb', 'Tarjeta: Apertura de Salones', 'crear') || canCreateSB_Esp;
  const canCrearSalonesLB = tienePermisoEnEscuela('lb', 'Tarjeta: Apertura de Salones', 'crear') || canCreateLB_Esp;
  const canCrearSalones = canCrearSalonesSB || canCrearSalonesLB;

  const canCrearGrados = tienePermiso('Tarjeta: Configurar Grados', 'crear') || tienePermiso('Grados y Salones', 'crear');
  const canEliminarGrados = tienePermiso('Tarjeta: Configurar Grados', 'eliminar') || tienePermiso('Grados y Salones', 'eliminar');
  const canCrearSecciones = tienePermiso('Tarjeta: Configurar Secciones', 'crear') || tienePermiso('Grados y Salones', 'crear');
  const canEliminarSecciones = tienePermiso('Tarjeta: Configurar Secciones', 'eliminar') || tienePermiso('Grados y Salones', 'eliminar');

  const escuelasAutorizadas = useMemo(() => {
    const list = [];
    if (canSalonesSB || hasAccessSB_Esp) list.push('sb');
    if (canSalonesLB || hasAccessLB_Esp) list.push('lb');
    return list;
  }, [canSalonesSB, canSalonesLB, hasAccessSB_Esp, hasAccessLB_Esp]);

  // Load all initial data
  useEffect(() => {
    if (!permLoading) {
      if (escuelasAutorizadas.length === 1) {
        setEscuelaFiltro(escuelasAutorizadas[0]);
        setFormEspacio(prev => ({ ...prev, id_escuela: escuelasAutorizadas[0] }));
      }
      cargarDatosCompletos();
    }
  }, [permLoading, escuelasAutorizadas]);

  const cargarDatosCompletos = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const [nivRes, graRes, secRes, espRes, salRes, docRes, estRes] = await Promise.all([
        supabase.from('conf_niveles').select('*').order('valor', { ascending: true }),
        supabase.from('conf_grados').select('*').order('orden', { ascending: true }),
        supabase.from('conf_secciones').select('*').order('valor', { ascending: true }),
        supabase.from('espacios').select('*'),
        supabase.from('salones').select('*'),
        supabase.from('usuarios').select('cedula, nombre_completo, id_escuela, telefono, email').eq('rol', 'Docente').eq('estado', 'Activo').order('nombre_completo', { ascending: true }),
        supabase.from('estudiantes_vinculaciones').select('*').eq('estado', 'Activo')
      ]);

      if (nivRes.data) setNiveles(nivRes.data);
      if (graRes.data) setGrados(graRes.data);
      if (secRes.data) setSecciones(secRes.data);
      if (espRes.data) setEspacios(espRes.data);
      if (salRes.data) {
        setSalones(salRes.data);
        if (!salonSeleccionadoId && salRes.data.length > 0) {
          setSalonSeleccionadoId(salRes.data[0].id_salon);
        }
      }
      if (docRes.data) setDocentes(docRes.data);
      if (estRes.data) setEstudiantes(estRes.data);
    } catch (e: any) {
      console.error("Error al cargar datos del módulo unificado:", e);
      if (Swal) Swal.fire('Error', 'Falla de conexión al cargar datos escolares.', 'error');
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────
  // PONDERACIÓN PEDAGÓGICA JERÁRQUICA: 1° Grupos, 2° Grados, 3° Años
  // ──────────────────────────────────────────────────────────
  const obtenerPesoJerarquico = (texto: string, tipo?: string): number => {
    const t = (texto || '').toLowerCase().trim();
    const tip = (tipo || '').toLowerCase().trim();

    // 1. NIVEL INICIAL / PREESCOLAR / GRUPOS (PRIMERO)
    if (t.includes('maternal') || t.includes('lactante') || t.includes('guarder') || t.includes('sala cuna')) return 10;
    if (
      t.includes('1er grupo') || t.includes('1° grupo') || t.includes('1ro grupo') ||
      t.includes('primer grupo') || t.includes('grupo 1') || t.includes('grupo i') ||
      t.includes('sala 3') || t.includes('preescolar 1') || t.includes('inicial 1') ||
      (t.includes('grupo') && (t.includes('1') || t.includes('primer') || t.includes('primero')))
    ) return 20;

    if (
      t.includes('2do grupo') || t.includes('2° grupo') || t.includes('2do grupo') ||
      t.includes('segundo grupo') || t.includes('grupo 2') || t.includes('grupo ii') ||
      t.includes('sala 4') || t.includes('preescolar 2') || t.includes('inicial 2') ||
      (t.includes('grupo') && (t.includes('2') || t.includes('segund')))
    ) return 30;

    if (
      t.includes('3er grupo') || t.includes('3° grupo') || t.includes('3ro grupo') ||
      t.includes('tercer grupo') || t.includes('grupo 3') || t.includes('grupo iii') ||
      t.includes('sala 5') || t.includes('preescolar 3') || t.includes('inicial 3') ||
      (t.includes('grupo') && (t.includes('3') || t.includes('tercer')))
    ) return 40;

    if (t.includes('grupo') || t.includes('preescolar') || t.includes('inicial') || t.includes('parvular') || t.includes('infantil')) return 50;

    // 2. NIVEL PRIMARIA / GRADOS (SEGUNDO)
    if (t.includes('1er grado') || t.includes('1° grado') || t.includes('1ro grado') || t.includes('primer grado') || t.includes('grado 1') || (t.includes('grado') && (t.includes('1') || t.includes('primer')))) return 110;
    if (t.includes('2do grado') || t.includes('2° grado') || t.includes('segundo grado') || t.includes('grado 2') || (t.includes('grado') && (t.includes('2') || t.includes('segund')))) return 120;
    if (t.includes('3er grado') || t.includes('3° grado') || t.includes('3ro grado') || t.includes('tercer grado') || t.includes('grado 3') || (t.includes('grado') && (t.includes('3') || t.includes('tercer')))) return 130;
    if (t.includes('4to grado') || t.includes('4° grado') || t.includes('cuarto grado') || t.includes('grado 4') || (t.includes('grado') && (t.includes('4') || t.includes('cuart')))) return 140;
    if (t.includes('5to grado') || t.includes('5° grado') || t.includes('quinto grado') || t.includes('grado 5') || (t.includes('grado') && (t.includes('5') || t.includes('quint')))) return 150;
    if (t.includes('6to grado') || t.includes('6° grado') || t.includes('sexto grado') || t.includes('grado 6') || (t.includes('grado') && (t.includes('6') || t.includes('sext')))) return 160;
    if (t.includes('grado') || t.includes('primaria')) return 170;

    // 3. NIVEL MEDIA GENERAL / AÑOS (TERCERO)
    if (t.includes('1er año') || t.includes('1° año') || t.includes('1ro año') || t.includes('primer año') || t.includes('año 1') || t.includes('1er ano') || ((t.includes('año') || t.includes('ano')) && (t.includes('1') || t.includes('primer')))) return 210;
    if (t.includes('2do año') || t.includes('2° año') || t.includes('segundo año') || t.includes('año 2') || t.includes('2do ano') || ((t.includes('año') || t.includes('ano')) && (t.includes('2') || t.includes('segund')))) return 220;
    if (t.includes('3er año') || t.includes('3° año') || t.includes('3ro año') || t.includes('tercer año') || t.includes('año 3') || t.includes('3er ano') || ((t.includes('año') || t.includes('ano')) && (t.includes('3') || t.includes('tercer')))) return 230;
    if (t.includes('4to año') || t.includes('4° año') || t.includes('cuarto año') || t.includes('año 4') || t.includes('4to ano') || ((t.includes('año') || t.includes('ano')) && (t.includes('4') || t.includes('cuart')))) return 240;
    if (t.includes('5to año') || t.includes('5° año') || t.includes('quinto año') || t.includes('año 5') || t.includes('5to ano') || ((t.includes('año') || t.includes('ano')) && (t.includes('5') || t.includes('quint')))) return 250;
    if (t.includes('6to año') || t.includes('6° año') || t.includes('sexto año') || t.includes('año 6') || t.includes('6to ano') || ((t.includes('año') || t.includes('ano')) && (t.includes('6') || t.includes('sext')))) return 260;
    if (t.includes('año') || t.includes('ano') || t.includes('bachillerato') || t.includes('media general') || t.includes('media')) return 270;

    // 4. AULAS NUMERADAS GENÉRICAS
    const matchAulaNum = t.match(/aula\s*(\d+)/i);
    if (matchAulaNum) {
      return 300 + parseInt(matchAulaNum[1]);
    }

    // 5. LABORATORIOS Y AMBIENTES ESPECIALES (AL FINAL)
    if (t.includes('laboratorio') || tip.includes('laboratorio') || t.includes('computaci') || t.includes('ciencias') || t.includes('quimica') || t.includes('fisica') || t.includes('biologia')) return 500;
    if (t.includes('cancha') || tip.includes('cancha') || t.includes('deport') || t.includes('gimnasio') || t.includes('patio')) return 600;
    if (t.includes('biblioteca') || tip.includes('biblioteca') || t.includes('lectura') || t.includes('cbit')) return 700;
    if (t.includes('comedor') || tip.includes('comedor') || t.includes('cantina') || t.includes('cocina') || t.includes('pae')) return 800;
    if (t.includes('auditorio') || tip.includes('auditorio') || t.includes('multiple') || t.includes('múltiple') || t.includes('teatro')) return 900;
    if (t.includes('direcci') || t.includes('oficina') || tip.includes('administrativ') || t.includes('coordinaci') || t.includes('secretar') || t.includes('profesor')) return 1000;
    if (t.includes('baño') || t.includes('sanitario') || tip.includes('baño')) return 1100;

    return 1200;
  };

  // ──────────────────────────────────────────────────────────
  // FILTRADO Y ORDENAMIENTO DE ESPACIOS
  // ──────────────────────────────────────────────────────────
  const espaciosFiltrados = useMemo(() => {
    return espacios
      .filter(e => {
        const matchEscuela = escuelaFiltro === 'todas' || e.id_escuela === escuelaFiltro;
        const matchSearch = (e.nombre || '').toLowerCase().includes(searchEspacios.toLowerCase()) ||
                            (e.tipo || '').toLowerCase().includes(searchEspacios.toLowerCase());
        return matchEscuela && matchSearch;
      })
      .sort((a, b) => {
        if (criterioOrden === 'jerarquia_grupos') {
          const pesoA = obtenerPesoJerarquico(a.nombre, a.tipo);
          const pesoB = obtenerPesoJerarquico(b.nombre, b.tipo);
          if (pesoA !== pesoB) return pesoA - pesoB;
          if (a.id_escuela !== b.id_escuela) return a.id_escuela.localeCompare(b.id_escuela);
          return (a.nombre || '').localeCompare(b.nombre || '', undefined, { numeric: true });
        }
        if (criterioOrden === 'nombre_asc') return (a.nombre || '').localeCompare(b.nombre || '', undefined, { numeric: true });
        if (criterioOrden === 'nombre_desc') return (b.nombre || '').localeCompare(a.nombre || '', undefined, { numeric: true });
        if (criterioOrden === 'capacidad_desc') return (Number(b.capacidad) || 0) - (Number(a.capacidad) || 0);
        if (criterioOrden === 'capacidad_asc') return (Number(a.capacidad) || 0) - (Number(b.capacidad) || 0);
        if (criterioOrden === 'tipo') return (a.tipo || '').localeCompare(b.tipo || '');
        if (criterioOrden === 'escuela') return (a.id_escuela || '').localeCompare(b.id_escuela || '');
        return 0;
      });
  }, [espacios, escuelaFiltro, searchEspacios, criterioOrden]);

  const totalPaginasEspacios = Math.ceil(espaciosFiltrados.length / itemsPorPaginaEspacios) || 1;
  const espaciosPaginados = useMemo(() => {
    const inicio = (paginaActualEspacios - 1) * itemsPorPaginaEspacios;
    return espaciosFiltrados.slice(inicio, inicio + itemsPorPaginaEspacios);
  }, [espaciosFiltrados, paginaActualEspacios]);

  // ──────────────────────────────────────────────────────────
  // FILTRADO Y ORDENAMIENTO DE SALONES
  // ──────────────────────────────────────────────────────────
  const salonesFiltrados = useMemo(() => {
    return salones
      .filter(s => {
        const matchEscuela = escuelaFiltro === 'todas' || s.id_escuela === escuelaFiltro;
        const matchSearch = (s.nombre_salon || '').toLowerCase().includes(searchSalones.toLowerCase()) ||
                            (s.grado_anio || '').toLowerCase().includes(searchSalones.toLowerCase()) ||
                            (s.seccion || '').toLowerCase().includes(searchSalones.toLowerCase());
        return matchEscuela && matchSearch;
      })
      .sort((a, b) => {
        const pesoA = obtenerPesoJerarquico(a.grado_anio);
        const pesoB = obtenerPesoJerarquico(b.grado_anio);
        if (pesoA !== pesoB) return pesoA - pesoB;
        if (a.seccion !== b.seccion) return (a.seccion || '').localeCompare(b.seccion || '');
        return (a.nombre_salon || '').localeCompare(b.nombre_salon || '');
      });
  }, [salones, escuelaFiltro, searchSalones]);

  // Salón Activo Seleccionado para Matrícula
  const salonActivo = useMemo(() => {
    return salones.find(s => s.id_salon === salonSeleccionadoId) || salonesFiltrados[0] || null;
  }, [salones, salonSeleccionadoId, salonesFiltrados]);

  // Estudiantes del Salón Activo
  const estudiantesSalonActivo = useMemo(() => {
    if (!salonActivo) return [];
    return estudiantes
      .filter(e => 
        e.codigo_escuela === salonActivo.id_escuela &&
        (e.grado_actual || '').toLowerCase() === (salonActivo.grado_anio || '').toLowerCase() &&
        (e.seccion_actual || '').toUpperCase() === (salonActivo.seccion || '').toUpperCase() &&
        ((e.nombres_estudiante || '').toLowerCase().includes(searchEstudiantes.toLowerCase()) ||
         (e.apellidos_estudiante || '').toLowerCase().includes(searchEstudiantes.toLowerCase()) ||
         (e.cedula_estudiante || '').toLowerCase().includes(searchEstudiantes.toLowerCase()))
      )
      .sort((a, b) => (a.apellidos_estudiante || '').localeCompare(b.apellidos_estudiante || ''));
  }, [estudiantes, salonActivo, searchEstudiantes]);

  // Métricas de Capacidad
  const capTotalGlobal = useMemo(() => espacios.reduce((acc, e) => acc + (Number(e.capacidad) || 0), 0), [espacios]);
  const capTotalSB = useMemo(() => espacios.filter(e => e.id_escuela === 'sb').reduce((acc, e) => acc + (Number(e.capacidad) || 0), 0), [espacios]);
  const capTotalLB = useMemo(() => espacios.filter(e => e.id_escuela === 'lb').reduce((acc, e) => acc + (Number(e.capacidad) || 0), 0), [espacios]);

  const matTotalGlobal = useMemo(() => estudiantes.length, [estudiantes]);
  const matTotalSB = useMemo(() => estudiantes.filter(e => e.codigo_escuela === 'sb').length, [estudiantes]);
  const matTotalLB = useMemo(() => estudiantes.filter(e => e.codigo_escuela === 'lb').length, [estudiantes]);

  // ──────────────────────────────────────────────────────────
  // ACCIONES CRUD DE ESPACIOS FÍSICOS
  // ──────────────────────────────────────────────────────────
  const handleGuardarEspacio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEspacio.nombre.trim()) {
      if (Swal) Swal.fire('Atención', 'El nombre del espacio es obligatorio.', 'warning');
      return;
    }

    setLoading(true);
    try {
      if (editandoEspacioId) {
        const { error } = await supabase.from('espacios').update({
          nombre: formEspacio.nombre.trim(),
          tipo: formEspacio.tipo,
          capacidad: Number(formEspacio.capacidad) || 0,
          id_escuela: formEspacio.id_escuela,
          ubicacion: formEspacio.ubicacion.trim(),
          descripcion: formEspacio.descripcion.trim()
        }).eq('id', editandoEspacioId);
        if (error) throw error;
        auditar('Espacios Escolares', 'Modificar', `Actualizó espacio físico ${formEspacio.nombre}`);
        if (Swal) Swal.fire('¡Actualizado!', 'El espacio físico fue modificado exitosamente.', 'success');
      } else {
        const { error } = await supabase.from('espacios').insert([{
          nombre: formEspacio.nombre.trim(),
          tipo: formEspacio.tipo,
          capacidad: Number(formEspacio.capacidad) || 0,
          id_escuela: formEspacio.id_escuela,
          ubicacion: formEspacio.ubicacion.trim(),
          descripcion: formEspacio.descripcion.trim()
        }]);
        if (error) throw error;
        auditar('Espacios Escolares', 'Crear', `Registró nuevo espacio ${formEspacio.nombre}`);
        if (Swal) Swal.fire('¡Registrado!', 'Espacio escolar creado correctamente.', 'success');
      }

      setFormEspacio({ nombre: '', tipo: 'Aula de Clases', capacidad: 35, id_escuela: 'sb', ubicacion: '', descripcion: '' });
      setEditandoEspacioId(null);
      cargarDatosCompletos(true);
    } catch (err: any) {
      console.error(err);
      if (Swal) Swal.fire('Error', 'No se pudo guardar el espacio físico.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditarEspacio = (espacio: EspacioItem) => {
    setEditandoEspacioId(espacio.id);
    setFormEspacio({
      nombre: espacio.nombre || '',
      tipo: espacio.tipo || 'Aula de Clases',
      capacidad: espacio.capacidad || 35,
      id_escuela: espacio.id_escuela || 'sb',
      ubicacion: espacio.ubicacion || '',
      descripcion: espacio.descripcion || ''
    });
  };

  const handleEliminarEspacio = (id: string, nombre: string) => {
    if (!Swal) return;
    Swal.fire({
      title: '¿Eliminar Espacio?',
      text: `Se eliminará permanentemente el ambiente "${nombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (res: any) => {
      if (res.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase.from('espacios').delete().eq('id', id);
          if (error) throw error;
          auditar('Espacios Escolares', 'Eliminar', `Eliminó espacio ${nombre}`);
          setSeleccionadosEspacios(prev => prev.filter(x => x !== id));
          cargarDatosCompletos(true);
          Swal.fire('Eliminado', 'El espacio ha sido eliminado.', 'success');
        } catch (e: any) {
          console.error(e);
          Swal.fire('Error', 'No se pudo eliminar el espacio escolar.', 'error');
          setLoading(false);
        }
      }
    });
  };

  const handleDuplicarEspacio = (espacio: EspacioItem) => {
    if (!Swal) return;
    Swal.fire({
      title: `Duplicar "${espacio.nombre}"`,
      html: `
        <div class="text-start">
          <label class="small fw-bold text-muted mb-1">Nombre del nuevo ambiente:</label>
          <input id="dup-nombre" class="swal2-input m-0 mb-3 w-100" value="${espacio.nombre} (Copia)" />
          <label class="small fw-bold text-muted mb-1">Plantel / Escuela destino:</label>
          <select id="dup-escuela" class="swal2-input m-0 mb-3 w-100">
            <option value="sb" ${espacio.id_escuela === 'sb' ? 'selected' : ''}>UE Santa Bárbara</option>
            <option value="lb" ${espacio.id_escuela === 'lb' ? 'selected' : ''}>UE Libertador Bolívar</option>
          </select>
          <label class="small fw-bold text-muted mb-1">Capacidad Instalada:</label>
          <input id="dup-cap" type="number" class="swal2-input m-0 w-100" value="${espacio.capacidad}" min="1" max="500" />
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Duplicar Espacio',
      confirmButtonColor: '#00BCD4',
      preConfirm: () => {
        const nom = (document.getElementById('dup-nombre') as HTMLInputElement).value;
        const esc = (document.getElementById('dup-escuela') as HTMLSelectElement).value;
        const cap = (document.getElementById('dup-cap') as HTMLInputElement).value;
        if (!nom.trim()) {
          Swal.showValidationMessage('El nombre no puede estar vacío');
          return false;
        }
        return { nombre: nom.trim(), id_escuela: esc, capacidad: Number(cap) || espacio.capacidad };
      }
    }).then(async (result: any) => {
      if (result.isConfirmed && result.value) {
        setLoading(true);
        try {
          const { error } = await supabase.from('espacios').insert([{
            nombre: result.value.nombre,
            tipo: espacio.tipo,
            capacidad: result.value.capacidad,
            id_escuela: result.value.id_escuela,
            ubicacion: espacio.ubicacion || '',
            descripcion: espacio.descripcion || ''
          }]);
          if (error) throw error;
          auditar('Espacios Escolares', 'Duplicar', `Duplicó ${espacio.nombre} como ${result.value.nombre}`);
          Swal.fire('¡Duplicado!', 'El ambiente escolar fue duplicado exitosamente.', 'success');
          cargarDatosCompletos(true);
        } catch (err: any) {
          console.error(err);
          Swal.fire('Error', 'Falla al duplicar el espacio escolar.', 'error');
          setLoading(false);
        }
      }
    });
  };

  const handleEliminarMasivoEspacios = () => {
    if (seleccionadosEspacios.length === 0 || !Swal) return;
    Swal.fire({
      title: `¿Eliminar ${seleccionadosEspacios.length} espacios?`,
      text: 'Esta acción borrará permanentemente todos los ambientes seleccionados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: `Sí, eliminar (${seleccionadosEspacios.length})`,
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase.from('espacios').delete().in('id', seleccionadosEspacios);
          if (error) throw error;
          auditar('Espacios Escolares', 'Eliminación Masiva', `Eliminó ${seleccionadosEspacios.length} espacios en lote.`);
          setSeleccionadosEspacios([]);
          Swal.fire('¡Eliminados!', 'Los espacios seleccionados han sido removidos.', 'success');
          cargarDatosCompletos(true);
        } catch (e: any) {
          console.error(e);
          Swal.fire('Error', 'No se pudieron eliminar los registros.', 'error');
          setLoading(false);
        }
      }
    });
  };

  const handleDuplicarMasivoEspacios = () => {
    if (seleccionadosEspacios.length === 0 || !Swal) return;
    Swal.fire({
      title: `Duplicar ${seleccionadosEspacios.length} Ambientes`,
      html: `
        <div class="text-start">
          <p class="small text-muted mb-2">Se crearán réplicas de los ${seleccionadosEspacios.length} espacios seleccionados.</p>
          <label class="small fw-bold text-muted mb-1">Plantel / Escuela de destino:</label>
          <select id="dup-masivo-escuela" class="swal2-input m-0 mb-3 w-100">
            <option value="conservar">Conservar escuela original de cada uno</option>
            <option value="sb">Asignar todos a UE Santa Bárbara</option>
            <option value="lb">Asignar todos a UE Libertador Bolívar</option>
          </select>
          <label class="small fw-bold text-muted mb-1">Sufijo para los nuevos nombres:</label>
          <input id="dup-masivo-sufijo" class="swal2-input m-0 w-100" value=" (Copia)" />
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: `Duplicar Registros`,
      confirmButtonColor: '#00BCD4',
      preConfirm: () => {
        const escuelaOpt = (document.getElementById('dup-masivo-escuela') as HTMLSelectElement).value;
        const sufijo = (document.getElementById('dup-masivo-sufijo') as HTMLInputElement).value;
        return { escuelaOpt, sufijo };
      }
    }).then(async (result: any) => {
      if (result.isConfirmed && result.value) {
        setLoading(true);
        try {
          const espaciosADuplicar = espacios.filter(e => seleccionadosEspacios.includes(e.id));
          const nuevosRegistros = espaciosADuplicar.map(e => ({
            nombre: `${e.nombre}${result.value.sufijo}`,
            tipo: e.tipo,
            capacidad: e.capacidad,
            id_escuela: result.value.escuelaOpt === 'conservar' ? e.id_escuela : result.value.escuelaOpt,
            ubicacion: e.ubicacion || '',
            descripcion: e.descripcion || ''
          }));

          const { error } = await supabase.from('espacios').insert(nuevosRegistros);
          if (error) throw error;

          auditar('Espacios Escolares', 'Duplicación Masiva', `Duplicó ${nuevosRegistros.length} espacios en lote.`);
          setSeleccionadosEspacios([]);
          Swal.fire('¡Completado!', `Se han duplicado exitosamente ${nuevosRegistros.length} espacios escolares.`, 'success');
          cargarDatosCompletos(true);
        } catch (e: any) {
          console.error(e);
          Swal.fire('Error', 'Falla al procesar la duplicación masiva.', 'error');
          setLoading(false);
        }
      }
    });
  };

  // ──────────────────────────────────────────────────────────
  // ACCIONES DE SALONES Y CONFIGURACIÓN ACADÉMICA
  // ──────────────────────────────────────────────────────────
  const abrirModalSalon = (salonExistente?: SalonItem) => {
    if (!canCrearSalones && !salonExistente) return;
    if (niveles.length === 0 || grados.length === 0 || secciones.length === 0) {
      Swal.fire('Faltan Datos', 'Debe configurar Niveles Educativos, Grados y Secciones antes de aperturar un salón.', 'warning');
      return;
    }

    const espaciosDisponibles = espacios.filter(e => {
      return e.id_escuela === 'sb' ? canSalonesSB : canSalonesLB;
    });

    let optEscuelas = `
      <option value="sb" ${salonExistente?.id_escuela === 'sb' ? 'selected' : ''}>UE Santa Bárbara</option>
      <option value="lb" ${salonExistente?.id_escuela === 'lb' ? 'selected' : ''}>UE Libertador Bolívar</option>
    `;

    let optNiveles = '<option value="">Seleccione Nivel...</option>';
    niveles.forEach(n => {
      optNiveles += `<option value="${n.valor}" ${salonExistente?.nivel_educativo === n.valor ? 'selected' : ''}>${n.valor}</option>`;
    });

    let optGrados = '<option value="">Seleccione Grado / Año...</option>';
    grados.forEach(g => {
      optGrados += `<option value="${g.valor}" ${salonExistente?.grado_anio === g.valor ? 'selected' : ''}>${g.valor}</option>`;
    });

    let optSecc = '<option value="">Seleccione Sección...</option>';
    secciones.forEach(s => {
      optSecc += `<option value="${s.valor}" ${salonExistente?.seccion === s.valor ? 'selected' : ''}>${s.valor}</option>`;
    });

    let optEspacios = '<option value="">Seleccione Espacio Físico...</option>';
    espaciosDisponibles.forEach(esp => {
      const escTag = esp.id_escuela === 'sb' ? '[SB]' : '[LB]';
      optEspacios += `<option value="${esp.id}" ${salonExistente?.id_espacio === esp.id ? 'selected' : ''}>${escTag} ${esp.nombre} (${esp.tipo} - Cap: ${esp.capacidad})</option>`;
    });

    const htmlModal = `
      <div class="text-start">
        <label class="small fw-bold text-muted mb-1"><i class="bi bi-building me-1"></i>Plantel / Escuela</label>
        <select id="modal-escuela" class="swal2-input m-0 mb-3 w-100">${optEscuelas}</select>

        <div class="row g-2 mb-3">
          <div class="col-12">
            <label class="small fw-bold text-muted mb-1"><i class="bi bi-diagram-3 me-1"></i>Nivel Educativo</label>
            <select id="modal-nivel" class="swal2-input m-0 w-100">${optNiveles}</select>
          </div>
          <div class="col-6">
            <label class="small fw-bold text-muted mb-1"><i class="bi bi-mortarboard me-1"></i>Grado / Grupo / Año</label>
            <select id="modal-grado" class="swal2-input m-0 w-100">${optGrados}</select>
          </div>
          <div class="col-6">
            <label class="small fw-bold text-muted mb-1"><i class="bi bi-tag me-1"></i>Sección</label>
            <select id="modal-seccion" class="swal2-input m-0 w-100">${optSecc}</select>
          </div>
        </div>

        <label class="small fw-bold text-muted mb-1"><i class="bi bi-door-open me-1"></i>Ambiente / Espacio Físico</label>
        <select id="modal-espacio" class="swal2-input m-0 mb-3 w-100">${optEspacios}</select>

        <label class="small fw-bold text-muted mb-1"><i class="bi bi-input-cursor-text me-1"></i>Nombre del Salón (Auto-generado o Personalizado)</label>
        <input id="modal-nombre" class="swal2-input m-0 w-100" placeholder="Ej: 1er Grado 'A'" value="${salonExistente ? salonExistente.nombre_salon : ''}" />
      </div>
    `;

    Swal.fire({
      title: salonExistente ? 'Modificar Salón Aperturado' : 'Aperturar Nuevo Salón',
      html: htmlModal,
      showCancelButton: true,
      confirmButtonText: salonExistente ? 'Actualizar Salón' : 'Aperturar Salón',
      confirmButtonColor: '#00BCD4',
      didOpen: () => {
        const gradoSel = document.getElementById('modal-grado') as HTMLSelectElement;
        const seccSel = document.getElementById('modal-seccion') as HTMLSelectElement;
        const nomInput = document.getElementById('modal-nombre') as HTMLInputElement;

        const autoActualizarNombre = () => {
          if (!salonExistente && gradoSel.value && seccSel.value) {
            nomInput.value = `${gradoSel.value} "${seccSel.value}"`;
          }
        };
        gradoSel.addEventListener('change', autoActualizarNombre);
        seccSel.addEventListener('change', autoActualizarNombre);
      },
      preConfirm: () => {
        const escuela = (document.getElementById('modal-escuela') as HTMLSelectElement).value;
        const nivel = (document.getElementById('modal-nivel') as HTMLSelectElement).value;
        const grado = (document.getElementById('modal-grado') as HTMLSelectElement).value;
        const seccion = (document.getElementById('modal-seccion') as HTMLSelectElement).value;
        const espacio = (document.getElementById('modal-espacio') as HTMLSelectElement).value;
        const nombre = (document.getElementById('modal-nombre') as HTMLInputElement).value;

        if (!nivel || !grado || !seccion || !espacio || !nombre.trim()) {
          Swal.showValidationMessage('Todos los campos son obligatorios');
          return false;
        }

        return {
          id_escuela: escuela,
          nivel_educativo: nivel,
          grado_anio: grado,
          seccion: seccion,
          id_espacio: espacio,
          nombre_salon: nombre.trim()
        };
      }
    }).then(async (result: any) => {
      if (result.isConfirmed && result.value) {
        setLoading(true);
        try {
          const payload = {
            id_escuela: result.value.id_escuela,
            nivel_educativo: result.value.nivel_educativo,
            grado_anio: result.value.grado_anio,
            seccion: result.value.seccion,
            id_espacio: result.value.id_espacio,
            nombre_salon: result.value.nombre_salon,
            estatus: 'Activo'
          };

          if (salonExistente) {
            const { error } = await supabase.from('salones').update(payload).eq('id_salon', salonExistente.id_salon);
            if (error) throw error;
            auditar('Control de Estudios', 'Modificar Salón', `Modificó salón ${payload.nombre_salon}`);
            Swal.fire('¡Actualizado!', 'Salón escolar modificado correctamente.', 'success');
          } else {
            const nuevoId = 'SALON-' + new Date().getTime();
            const { error } = await supabase.from('salones').insert([{ ...payload, id_salon: nuevoId, docentes_guias: [] }]);
            if (error) throw error;
            auditar('Control de Estudios', 'Aperturar Salón', `Aperturó nuevo salón ${payload.nombre_salon}`);
            Swal.fire('¡Aperturado!', 'El nuevo salón ha sido aperturado con éxito.', 'success');
          }
          cargarDatosCompletos(true);
        } catch (e: any) {
          console.error(e);
          Swal.fire('Error', 'Falla al procesar la apertura del salón.', 'error');
          setLoading(false);
        }
      }
    });
  };

  const eliminarSalon = (id: string, nombre: string) => {
    if (!Swal) return;
    Swal.fire({
      title: '¿Eliminar Salón?',
      text: `Se cerrará y eliminará el salón "${nombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar salón',
      cancelButtonText: 'Cancelar'
    }).then(async (res: any) => {
      if (res.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase.from('salones').delete().eq('id_salon', id);
          if (error) throw error;
          auditar('Control de Estudios', 'Eliminar Salón', `Cerró y eliminó salón ${nombre}`);
          Swal.fire('Eliminado', 'Salón escolar eliminado con éxito.', 'success');
          cargarDatosCompletos(true);
        } catch (e: any) {
          console.error(e);
          Swal.fire('Error', 'No se pudo eliminar el salón.', 'error');
          setLoading(false);
        }
      }
    });
  };

  // ──────────────────────────────────────────────────────────
  // ASIGNACIÓN DE DOCENTE GUÍA
  // ──────────────────────────────────────────────────────────
  const abrirModalAsignarDocente = (salon: SalonItem) => {
    if (!Swal) return;

    const docentesPlantel = docentes.filter(d => d.id_escuela === salon.id_escuela || !d.id_escuela);
    const docentesActuales = salon.docentes_guias || [];

    let checkboxesHtml = '';
    docentesPlantel.forEach(d => {
      const isChecked = docentesActuales.includes(d.cedula) ? 'checked' : '';
      checkboxesHtml += `
        <div class="form-check p-2 border-bottom d-flex align-items-center justify-content-between">
          <div>
            <input class="form-check-input check-docente me-2" type="checkbox" value="${d.cedula}" id="doc-${d.cedula}" ${isChecked}>
            <label class="form-check-label fw-bold text-dark cursor-pointer" for="doc-${d.cedula}">
              ${d.nombre_completo} <span class="badge bg-light text-muted border">C.I. ${d.cedula}</span>
            </label>
            <div class="small text-muted ps-4">${d.telefono ? formatPhoneNumber(d.telefono) : 'Sin tlf'} | ${d.email || 'Sin correo'}</div>
          </div>
        </div>
      `;
    });

    Swal.fire({
      title: `Docente Guía: ${salon.nombre_salon}`,
      html: `
        <div class="text-start">
          <p class="small text-muted mb-2">Seleccione el o los docentes guías asignados a esta sección:</p>
          <div style="max-height: 280px; overflow-y: auto;" class="border rounded p-2 bg-light">
            ${checkboxesHtml || '<p class="text-muted small text-center p-3">No hay docentes registrados en este plantel.</p>'}
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar Asignación',
      confirmButtonColor: '#00BCD4',
      preConfirm: () => {
        const seleccionados: string[] = [];
        document.querySelectorAll('.check-docente:checked').forEach((el: any) => {
          seleccionados.push(el.value);
        });
        return seleccionados;
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase.from('salones').update({
            docentes_guias: result.value
          }).eq('id_salon', salon.id_salon);
          if (error) throw error;
          auditar('Control de Estudios', 'Asignar Docente Guía', `Actualizó docentes guías de ${salon.nombre_salon}`);
          Swal.fire('¡Asignado!', 'Docente(s) guía(s) actualizado(s) correctamente.', 'success');
          cargarDatosCompletos(true);
        } catch (err: any) {
          console.error(err);
          Swal.fire('Error', 'Falla al guardar la asignación docente.', 'error');
          setLoading(false);
        }
      }
    });
  };

  // ──────────────────────────────────────────────────────────
  // DESCARGA DE LISTADOS OFICIALES DE MATRÍCULA (PDF & EXCEL)
  // ──────────────────────────────────────────────────────────
  const exportarListadoMatriculaPDF = (salon: SalonItem) => {
    if (!html2pdf) {
      if (Swal) Swal.fire('Aviso', 'El motor PDF no está disponible en este momento.', 'warning');
      return;
    }

    const ests = estudiantes.filter(e => 
      e.codigo_escuela === salon.id_escuela &&
      (e.grado_actual || '').toLowerCase() === (salon.grado_anio || '').toLowerCase() &&
      (e.seccion_actual || '').toUpperCase() === (salon.seccion || '').toUpperCase()
    ).sort((a, b) => (a.apellidos_estudiante || '').localeCompare(b.apellidos_estudiante || ''));

    if (ests.length === 0) {
      if (Swal) Swal.fire('Sin Estudiantes', `No hay estudiantes vinculados en ${salon.nombre_salon}.`, 'info');
      return;
    }

    const nombreEscuela = salon.id_escuela === 'sb' ? 'U.E. "SANTA BÁRBARA"' : 'U.E. "LIBERTADOR BOLÍVAR"';
    const logoEscuela = salon.id_escuela === 'sb' ? '/assets/img/logo_sb.png' : '/assets/img/logo_lb.png';
    const docentesNombres = (salon.docentes_guias || [])
      .map(ci => {
        const doc = docentes.find(d => d.cedula === ci);
        return doc ? doc.nombre_completo : ci;
      })
      .join(', ') || 'No Asignado';

    const fechaHoy = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const anoActual = new Date().getFullYear();
    const periodoEscolar = `${anoActual}-${anoActual + 1}`;

    const rowsHtml = ests.map((est, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 6px 8px; text-align: center; font-weight: bold; width: 35px;">${idx + 1}</td>
        <td style="padding: 6px 8px; font-weight: 600; text-transform: uppercase;">${est.apellidos_estudiante}, ${est.nombres_estudiante}</td>
        <td style="padding: 6px 8px; text-align: center; width: 100px;">${est.cedula_estudiante}</td>
        <td style="padding: 6px 8px; text-align: center; width: 90px;">${est.cedula_representante || '-'}</td>
        <td style="padding: 6px 8px; text-align: center; width: 70px;"><span style="color: #059669; font-weight: bold;">Activo</span></td>
        <td style="padding: 6px 8px; width: 130px; border-bottom: 1px dashed #cbd5e1;"></td>
      </tr>
    `).join('');

    const templateHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 25px 30px; background: #fff;">
        <!-- Membrete Oficial MPPE -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 15px;">
          <img src="${logoEscuela}" alt="Logo" style="height: 60px; object-fit: contain;" />
          <div style="text-align: center; flex-grow: 1; padding: 0 15px;">
            <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">República Bolivariana de Venezuela</div>
            <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b;">Ministerio del Poder Popular para la Educación</div>
            <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin-top: 2px;">${nombreEscuela}</div>
            <div style="font-size: 11px; font-weight: 600; color: #0284c7;">LISTADO OFICIAL DE MATRÍCULA ESTUDIANTIL</div>
          </div>
          <div style="text-align: right; font-size: 10px; color: #64748b;">
            <div><b>Año Escolar:</b> ${periodoEscolar}</div>
            <div><b>Fecha:</b> ${fechaHoy}</div>
            <div><b>Total:</b> ${ests.length} Estudiantes</div>
          </div>
        </div>

        <!-- Ficha Resumen del Salón -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 15px; margin-bottom: 15px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 11px;">
          <div><span style="color: #64748b; display: block; font-size: 9px; text-transform: uppercase;">Nivel Educativo:</span><b>${salon.nivel_educativo}</b></div>
          <div><span style="color: #64748b; display: block; font-size: 9px; text-transform: uppercase;">Grado / Sección:</span><b>${salon.grado_anio} - Sec. "${salon.seccion}"</b></div>
          <div><span style="color: #64748b; display: block; font-size: 9px; text-transform: uppercase;">Docente Guía:</span><b>${docentesNombres}</b></div>
          <div><span style="color: #64748b; display: block; font-size: 9px; text-transform: uppercase;">Ambiente Físico:</span><b>${salon.nombre_salon}</b></div>
        </div>

        <!-- Tabla de Estudiantes -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <thead>
            <tr style="background: #0284c7; color: #ffffff; font-size: 10px; text-transform: uppercase;">
              <th style="padding: 6px 8px; text-align: center;">N°</th>
              <th style="padding: 6px 8px; text-align: left;">Nombres y Apellidos del Estudiante</th>
              <th style="padding: 6px 8px; text-align: center;">Cédula / C.E.</th>
              <th style="padding: 6px 8px; text-align: center;">C.I. Representante</th>
              <th style="padding: 6px 8px; text-align: center;">Estatus</th>
              <th style="padding: 6px 8px; text-align: center;">Firma / Observación</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <!-- Firmas y Sellos -->
        <div style="display: flex; justify-content: space-around; margin-top: 35px; text-align: center; font-size: 11px;">
          <div style="width: 200px; border-top: 1px solid #475569; padding-top: 6px;">
            <b>${docentesNombres}</b>
            <div style="font-size: 9px; color: #64748b;">Docente Guía / Titular</div>
          </div>
          <div style="width: 200px; border-top: 1px solid #475569; padding-top: 6px;">
            <b>Control de Estudios</b>
            <div style="font-size: 9px; color: #64748b;">Firma y Sello</div>
          </div>
          <div style="width: 200px; border-top: 1px solid #475569; padding-top: 6px;">
            <b>Dirección del Plantel</b>
            <div style="font-size: 9px; color: #64748b;">Firma y Sello Oficial</div>
          </div>
        </div>

        <!-- Pie de página -->
        <div style="margin-top: 25px; padding-top: 8px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 8px; color: #94a3b8;">
          <span>Documento emitido por el Sistema Integral de Gestión y Administración Escolar (SIGAE)</span>
          <span>Página 1 de 1</span>
        </div>
      </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = templateHtml;

    const opt = {
      margin: 8,
      filename: `Matricula_${salon.grado_anio}_Sec_${salon.seccion}_${salon.id_escuela.toUpperCase()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };

    if (Swal) {
      Swal.fire({
        title: 'Generando Listado...',
        html: 'Preparando el documento oficial de matrícula...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
    }

    html2pdf().set(opt).from(element).save().then(() => {
      if (Swal) Swal.close();
      auditar('Control de Estudios', 'Descargar Matrícula', `Descargó listado PDF de ${salon.nombre_salon}`);
    }).catch((err: any) => {
      console.error(err);
      if (Swal) {
        Swal.close();
        Swal.fire('Error', 'No se pudo generar el documento PDF.', 'error');
      }
    });
  };

  const exportarListadoMatriculaExcel = (salon: SalonItem) => {
    const ests = estudiantes.filter(e => 
      e.codigo_escuela === salon.id_escuela &&
      (e.grado_actual || '').toLowerCase() === (salon.grado_anio || '').toLowerCase() &&
      (e.seccion_actual || '').toUpperCase() === (salon.seccion || '').toUpperCase()
    ).sort((a, b) => (a.apellidos_estudiante || '').localeCompare(b.apellidos_estudiante || ''));

    if (ests.length === 0) {
      if (Swal) Swal.fire('Sin Registros', 'No hay estudiantes inscritos en este salón.', 'info');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `N,Apellidos,Nombres,Cedula_Estudiante,Cedula_Representante,Grado_Anio,Seccion,Escuela\n`;

    ests.forEach((est, idx) => {
      const row = [
        idx + 1,
        `"${est.apellidos_estudiante}"`,
        `"${est.nombres_estudiante}"`,
        `"${est.cedula_estudiante}"`,
        `"${est.cedula_representante || ''}"`,
        `"${est.grado_actual}"`,
        `"${est.seccion_actual}"`,
        `"${est.codigo_escuela.toUpperCase()}"`
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Listado_Matricula_${salon.grado_anio}_${salon.seccion}_${salon.id_escuela}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    auditar('Control de Estudios', 'Exportar Excel', `Exportó listado CSV de ${salon.nombre_salon}`);
  };

  // Reasignar estudiante de salón/sección
  const handleReasignarEstudiante = (est: EstudianteVinculado) => {
    if (!Swal) return;

    let optGrados = '';
    grados.forEach(g => {
      optGrados += `<option value="${g.valor}" ${g.valor === est.grado_actual ? 'selected' : ''}>${g.valor}</option>`;
    });

    let optSecciones = '';
    secciones.forEach(s => {
      optSecciones += `<option value="${s.valor}" ${s.valor === est.seccion_actual ? 'selected' : ''}>${s.valor}</option>`;
    });

    Swal.fire({
      title: `Reasignar Estudiante`,
      html: `
        <div class="text-start">
          <p class="small text-muted mb-2"><b>Estudiante:</b> ${est.nombres_estudiante} ${est.apellidos_estudiante} (C.I. ${est.cedula_estudiante})</p>
          <label class="small fw-bold text-muted mb-1">Nuevo Grado / Año:</label>
          <select id="reasig-grado" class="swal2-input m-0 mb-3 w-100">${optGrados}</select>
          <label class="small fw-bold text-muted mb-1">Nueva Sección:</label>
          <select id="reasig-seccion" class="swal2-input m-0 w-100">${optSecciones}</select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirmar Reasignación',
      confirmButtonColor: '#00BCD4',
      preConfirm: () => {
        const g = (document.getElementById('reasig-grado') as HTMLSelectElement).value;
        const s = (document.getElementById('reasig-seccion') as HTMLSelectElement).value;
        return { grado_actual: g, seccion_actual: s };
      }
    }).then(async (result: any) => {
      if (result.isConfirmed && result.value) {
        setLoading(true);
        try {
          const { error } = await supabase.from('estudiantes_vinculaciones').update({
            grado_actual: result.value.grado_actual,
            seccion_actual: result.value.seccion_actual
          }).eq('cedula_estudiante', est.cedula_estudiante);

          if (error) throw error;
          auditar('Control de Estudios', 'Reasignar Sección', `Movió a ${est.nombres_estudiante} a ${result.value.grado_actual} "${result.value.seccion_actual}"`);
          Swal.fire('¡Reasignado!', 'El estudiante fue transferido exitosamente de sección.', 'success');
          cargarDatosCompletos(true);
        } catch (e: any) {
          console.error(e);
          Swal.fire('Error', 'No se pudo reasignar al estudiante.', 'error');
          setLoading(false);
        }
      }
    });
  };

  // Reporte Global de Capacidad Instalada
  const generarReporteCapacidadGlobalPDF = () => {
    if (!html2pdf) return;

    const fechaHoy = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const anoActual = new Date().getFullYear();

    const rowsEspaciosHtml = espacios.map((esp, idx) => {
      const salAsoc = salones.find(s => s.id_espacio === esp.id);
      const estCount = salAsoc ? estudiantes.filter(e => e.codigo_escuela === esp.id_escuela && (e.grado_actual || '').toLowerCase() === (salAsoc.grado_anio || '').toLowerCase() && (e.seccion_actual || '').toUpperCase() === (salAsoc.seccion || '').toUpperCase()).length : 0;
      const vacantes = Math.max(0, esp.capacidad - estCount);
      const pct = esp.capacidad > 0 ? Math.round((estCount / esp.capacidad) * 100) : 0;

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 10px;">
          <td style="padding: 5px; text-align: center;">${idx + 1}</td>
          <td style="padding: 5px; font-weight: bold;">${esp.nombre}</td>
          <td style="padding: 5px; text-align: center;">${esp.id_escuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar'}</td>
          <td style="padding: 5px;">${esp.tipo}</td>
          <td style="padding: 5px; text-align: center;">${salAsoc ? `${salAsoc.grado_anio} "${salAsoc.seccion}"` : '<span style="color:#94a3b8;">Disponible</span>'}</td>
          <td style="padding: 5px; text-align: center; font-weight: bold;">${esp.capacidad}</td>
          <td style="padding: 5px; text-align: center; color: #0284c7; font-weight: bold;">${estCount}</td>
          <td style="padding: 5px; text-align: center; color: #059669; font-weight: bold;">${vacantes}</td>
          <td style="padding: 5px; text-align: center;">${pct}%</td>
        </tr>
      `;
    }).join('');

    const templateHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 25px 30px; background: #fff;">
        <div style="text-align: center; border-bottom: 2px solid #059669; padding-bottom: 10px; margin-bottom: 15px;">
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b;">República Bolivariana de Venezuela</div>
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b;">Ministerio del Poder Popular para la Educación</div>
          <div style="font-size: 15px; font-weight: 800; color: #065f46; margin-top: 3px;">INFORME OFICIAL DE CAPACIDAD INSTALADA E INFRAESTRUCTURA</div>
          <div style="font-size: 11px; color: #64748b;">Consolidado Institucional: U.E. Santa Bárbara & U.E. Libertador Bolívar | Año Escolar ${anoActual}-${anoActual + 1} | Fecha: ${fechaHoy}</div>
        </div>

        <!-- Indicadores Resumen -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; text-align: center;">
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px;">
            <div style="font-size: 9px; color: #166534; font-weight: bold; text-transform: uppercase;">Capacidad Total</div>
            <div style="font-size: 18px; font-weight: 800; color: #15803d;">${capTotalGlobal} Cupos</div>
          </div>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 8px;">
            <div style="font-size: 9px; color: #1e40af; font-weight: bold; text-transform: uppercase;">Matrícula Activa</div>
            <div style="font-size: 18px; font-weight: 800; color: #1d4ed8;">${matTotalGlobal} Estudiantes</div>
          </div>
          <div style="background: #ecfeff; border: 1px solid #a5f3fc; border-radius: 8px; padding: 8px;">
            <div style="font-size: 9px; color: #155e75; font-weight: bold; text-transform: uppercase;">Santa Bárbara</div>
            <div style="font-size: 14px; font-weight: 800; color: #0891b2;">Cap: ${capTotalSB} | Mat: ${matTotalSB}</div>
          </div>
          <div style="background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 8px; padding: 8px;">
            <div style="font-size: 9px; color: #9d174d; font-weight: bold; text-transform: uppercase;">Libertador Bolívar</div>
            <div style="font-size: 14px; font-weight: 800; color: #be185d;">Cap: ${capTotalLB} | Mat: ${matTotalLB}</div>
          </div>
        </div>

        <!-- Tabla de Inventario de Espacios -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #059669; color: #ffffff; font-size: 9px; text-transform: uppercase;">
              <th style="padding: 5px;">N°</th>
              <th style="padding: 5px; text-align: left;">Ambiente / Espacio</th>
              <th style="padding: 5px;">Plantel</th>
              <th style="padding: 5px; text-align: left;">Tipo</th>
              <th style="padding: 5px;">Salón Asignado</th>
              <th style="padding: 5px;">Capacidad</th>
              <th style="padding: 5px;">Inscritos</th>
              <th style="padding: 5px;">Vacantes</th>
              <th style="padding: 5px;">% Ocupación</th>
            </tr>
          </thead>
          <tbody>
            ${rowsEspaciosHtml}
          </tbody>
        </table>

        <!-- Firmas -->
        <div style="display: flex; justify-content: space-around; margin-top: 35px; text-align: center; font-size: 10px;">
          <div style="width: 220px; border-top: 1px solid #475569; padding-top: 5px;">
            <b>Dirección General del Plantel</b>
            <div style="font-size: 8px; color: #64748b;">Firma y Sello Institucional</div>
          </div>
          <div style="width: 220px; border-top: 1px solid #475569; padding-top: 5px;">
            <b>Coordinación de Control de Estudios</b>
            <div style="font-size: 8px; color: #64748b;">Firma y Sello Oficial</div>
          </div>
        </div>
      </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = templateHtml;

    const opt = {
      margin: 8,
      filename: `Reporte_Capacidad_Instalada_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'landscape' }
    };

    if (Swal) {
      Swal.fire({
        title: 'Generando Informe...',
        html: 'Preparando el informe consolidado de infraestructura...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
    }

    html2pdf().set(opt).from(element).save().then(() => {
      if (Swal) Swal.close();
      auditar('Control de Estudios', 'Reporte Capacidad', `Generó informe consolidado de capacidad`);
    }).catch((err: any) => {
      console.error(err);
      if (Swal) {
        Swal.close();
        Swal.fire('Error', 'Falla al generar el documento.', 'error');
      }
    });
  };

  if (permLoading || (loading && espacios.length === 0 && salones.length === 0)) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5 h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando Centro de Gestión Escolar...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-3 px-md-4">
      {/* Banner Principal */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden position-relative" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0f172a 100%)' }}>
            <div className="card-body p-4 p-md-5 text-white position-relative z-1">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-white text-dark px-3 py-2 fw-bold shadow-sm rounded-pill" style={{ letterSpacing: '0.5px' }}>
                    <i className="bi bi-diagram-3-fill text-primary me-1"></i> CONTROL DE ESTUDIOS & DIRECCIÓN
                  </span>
                  <span className="badge bg-info text-white px-3 py-2 fw-bold shadow-sm rounded-pill">
                    MÓDULO UNIFICADO
                  </span>
                </div>
                <button 
                  onClick={() => navigate('/categoria/Control%20de%20Estudios')}
                  className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                >
                  <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
                </button>
              </div>

              <h1 className="fw-bolder mb-2 text-white" style={{ fontSize: '2.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                <i className="bi bi-grid-3x3-gap-fill me-3"></i>Gestión de Espacios, Salones y Matrícula
              </h1>
              <p className="mb-0 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Administración integral de ambientes físicos, grados, apertura de salones, docentes guías y matrícula estudiantil.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación por Pestañas Principales */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card bg-white border-0 shadow-sm rounded-4 p-2">
            <ul className="nav nav-pills nav-fill gap-2" role="tablist">
              <li className="nav-item">
                <button
                  className={`nav-link rounded-4 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 transition-all ${activeTab === 'espacios' ? 'active bg-primary text-white shadow' : 'text-secondary hover-efecto'}`}
                  onClick={() => setActiveTab('espacios')}
                >
                  <i className="bi bi-door-open-fill fs-5"></i>
                  <span>1. Ambientes y Espacios Físicos</span>
                  <span className="badge bg-white text-dark rounded-pill ms-1">{espacios.length}</span>
                </button>
              </li>

              <li className="nav-item">
                <button
                  className={`nav-link rounded-4 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 transition-all ${activeTab === 'salones' ? 'active bg-primary text-white shadow' : 'text-secondary hover-efecto'}`}
                  onClick={() => setActiveTab('salones')}
                >
                  <i className="bi bi-mortarboard-fill fs-5"></i>
                  <span>2. Grados, Secciones y Salones</span>
                  <span className="badge bg-white text-dark rounded-pill ms-1">{salones.length}</span>
                </button>
              </li>

              <li className="nav-item">
                <button
                  className={`nav-link rounded-4 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 transition-all ${activeTab === 'matricula' ? 'active bg-primary text-white shadow' : 'text-secondary hover-efecto'}`}
                  onClick={() => setActiveTab('matricula')}
                >
                  <i className="bi bi-people-fill fs-5"></i>
                  <span>3. Docentes Guías y Matrícula</span>
                  <span className="badge bg-success text-white rounded-pill ms-1">{estudiantes.length}</span>
                </button>
              </li>

              <li className="nav-item">
                <button
                  className={`nav-link rounded-4 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 transition-all ${activeTab === 'reportes' ? 'active bg-primary text-white shadow' : 'text-secondary hover-efecto'}`}
                  onClick={() => setActiveTab('reportes')}
                >
                  <i className="bi bi-bar-chart-line-fill fs-5"></i>
                  <span>4. Capacidad y Reportes</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* PESTAÑA 1: AMBIENTES Y ESPACIOS FÍSICOS                    */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'espacios' && (
        <div className="animate__animated animate__fadeIn">
          {/* Tarjetas de Resumen Interactivas */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <div 
                onClick={() => { setEscuelaFiltro('todas'); setPaginaActualEspacios(1); }}
                className={`card p-3 border-0 shadow-sm rounded-4 text-white h-100 cursor-pointer hover-efecto`}
                style={{ 
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  outline: escuelaFiltro === 'todas' ? '3px solid #10b981' : 'none',
                  outlineOffset: '2px'
                }}
                role="button"
                title="Clic para ver todos los ambientes"
              >
                <div className="d-flex justify-content-between align-items-center h-100">
                  <div>
                    <span className="small fw-bold opacity-75">Capacidad Total Global</span>
                    <h3 className="fw-bold m-0 mt-1">{capTotalGlobal} Cupos</h3>
                    {escuelaFiltro === 'todas' && <span className="badge bg-white text-success rounded-pill px-2 py-0 fw-bold mt-1" style={{ fontSize: '10px' }}>Filtro Activo</span>}
                  </div>
                  <i className="bi bi-building fs-1 opacity-50"></i>
                </div>
              </div>
            </div>

            {(canSalonesSB || hasAccessSB_Esp) && (
              <div className="col-12 col-md-4">
                <div 
                  onClick={() => { setEscuelaFiltro(escuelaFiltro === 'sb' ? 'todas' : 'sb'); setPaginaActualEspacios(1); }}
                  className="card p-3 border-0 shadow-sm rounded-4 text-dark bg-white border-start border-4 border-info h-100 cursor-pointer hover-efecto"
                  style={{ 
                    outline: escuelaFiltro === 'sb' ? '3px solid #0dcaf0' : 'none',
                    outlineOffset: '2px'
                  }}
                  role="button"
                  title="Clic para filtrar UE Santa Bárbara"
                >
                  <div className="d-flex justify-content-between align-items-center h-100">
                    <div>
                      <span className="small fw-bold text-muted">UE Santa Bárbara</span>
                      <h3 className="fw-bold m-0 mt-1 text-info">{capTotalSB} Cupos</h3>
                      {escuelaFiltro === 'sb' && <span className="badge bg-info text-white rounded-pill px-2 py-0 fw-bold mt-1" style={{ fontSize: '10px' }}>Filtro Activo</span>}
                    </div>
                    <i className="bi bi-mortarboard-fill fs-1 text-info opacity-25"></i>
                  </div>
                </div>
              </div>
            )}

            {(canSalonesLB || hasAccessLB_Esp) && (
              <div className="col-12 col-md-4">
                <div 
                  onClick={() => { setEscuelaFiltro(escuelaFiltro === 'lb' ? 'todas' : 'lb'); setPaginaActualEspacios(1); }}
                  className="card p-3 border-0 shadow-sm rounded-4 text-dark bg-white border-start border-4 border-primary h-100 cursor-pointer hover-efecto"
                  style={{ 
                    outline: escuelaFiltro === 'lb' ? '3px solid #0d6efd' : 'none',
                    outlineOffset: '2px'
                  }}
                  role="button"
                  title="Clic para filtrar UE Libertador Bolívar"
                >
                  <div className="d-flex justify-content-between align-items-center h-100">
                    <div>
                      <span className="small fw-bold text-muted">UE Libertador Bolívar</span>
                      <h3 className="fw-bold m-0 mt-1 text-primary">{capTotalLB} Cupos</h3>
                      {escuelaFiltro === 'lb' && <span className="badge bg-primary text-white rounded-pill px-2 py-0 fw-bold mt-1" style={{ fontSize: '10px' }}>Filtro Activo</span>}
                    </div>
                    <i className="bi bi-book-fill fs-1 text-primary opacity-25"></i>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="row g-4">
            {/* Formulario Registro/Edición de Espacio */}
            {(canCreateSB_Esp || canCreateLB_Esp) && (
              <div className="col-12 col-xl-4">
                <div className="card p-4 bg-white shadow-sm border-0 rounded-4 h-100">
                  <h5 className="fw-bold text-dark mb-4 border-bottom pb-3">
                    <i className="bi bi-plus-square-fill text-primary me-2"></i>
                    {editandoEspacioId ? 'Editar Espacio Físico' : 'Nuevo Espacio / Ambiente'}
                  </h5>

                  <form onSubmit={handleGuardarEspacio} className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">Plantel / Escuela</label>
                      <select 
                        className="form-select border-info rounded-pill"
                        value={formEspacio.id_escuela}
                        onChange={(e) => setFormEspacio({ ...formEspacio, id_escuela: e.target.value })}
                      >
                        {escuelasAutorizadas.includes('sb') && <option value="sb">UE Santa Bárbara</option>}
                        {escuelasAutorizadas.includes('lb') && <option value="lb">UE Libertador Bolívar</option>}
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">Nombre del Espacio</label>
                      <input 
                        type="text"
                        className="form-control border-info rounded-pill"
                        placeholder="Ej: 1er Grado A, Lab. Ciencias, Cancha..."
                        value={formEspacio.nombre}
                        onChange={(e) => setFormEspacio({ ...formEspacio, nombre: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-muted">Tipo de Ambiente</label>
                      <select 
                        className="form-select border-info rounded-pill"
                        value={formEspacio.tipo}
                        onChange={(e) => setFormEspacio({ ...formEspacio, tipo: e.target.value })}
                      >
                        <option value="Aula de Clases">Aula de Clases</option>
                        <option value="Laboratorio">Laboratorio</option>
                        <option value="Cancha Deportiva">Cancha Deportiva</option>
                        <option value="Biblioteca">Biblioteca</option>
                        <option value="Comedor / Cantina">Comedor / Cantina</option>
                        <option value="Auditorio">Auditorio</option>
                        <option value="Área Administrativa">Área Administrativa</option>
                        <option value="Baños / Sanitarios">Baños / Sanitarios</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-muted">Capacidad Máxima</label>
                      <input 
                        type="number"
                        className="form-control border-info rounded-pill"
                        min="1"
                        max="1000"
                        value={formEspacio.capacidad}
                        onChange={(e) => setFormEspacio({ ...formEspacio, capacidad: Number(e.target.value) || 0 })}
                        required
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">Ubicación / Piso (Opcional)</label>
                      <input 
                        type="text"
                        className="form-control border-info rounded-pill"
                        placeholder="Ej: Planta Alta, Ala Norte..."
                        value={formEspacio.ubicacion}
                        onChange={(e) => setFormEspacio({ ...formEspacio, ubicacion: e.target.value })}
                      />
                    </div>

                    <div className="col-12 pt-3">
                      <button type="submit" className="btn btn-primary text-white px-4 shadow-sm fw-bold w-100 mb-2 rounded-pill hover-efecto">
                        <i className="bi bi-save-fill me-2"></i>{editandoEspacioId ? 'Actualizar Espacio' : 'Guardar Espacio'}
                      </button>
                      {editandoEspacioId && (
                        <button 
                          type="button" 
                          className="btn btn-light border text-danger fw-bold w-100 rounded-pill hover-efecto"
                          onClick={() => { setEditandoEspacioId(null); setFormEspacio({ nombre: '', tipo: 'Aula de Clases', capacidad: 35, id_escuela: 'sb', ubicacion: '', descripcion: '' }); }}
                        >
                          Cancelar Edición
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Listado de Espacios */}
            <div className={canCreateSB_Esp || canCreateLB_Esp ? 'col-12 col-xl-8' : 'col-12'}>
              <div className="card bg-white shadow-sm border-0 rounded-4 h-100">
                <div className="card-header bg-white border-bottom p-4">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-2">
                    <h5 className="fw-bold text-dark m-0">
                      <i className="bi bi-list-columns-reverse text-primary me-2"></i>Directorio de Ambientes Físicos
                    </h5>
                    
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {escuelasAutorizadas.length > 1 && (
                        <select 
                          className="form-select form-select-sm border-info rounded-pill fw-bold text-dark w-auto"
                          value={escuelaFiltro}
                          onChange={(e) => { setEscuelaFiltro(e.target.value); setPaginaActualEspacios(1); }}
                        >
                          <option value="todas">🏛️ Todos los Planteles</option>
                          <option value="sb">🎓 UE Santa Bárbara</option>
                          <option value="lb">📖 UE Libertador Bolívar</option>
                        </select>
                      )}

                      <select 
                        className="form-select form-select-sm border-info rounded-pill fw-bold text-dark w-auto"
                        value={criterioOrden}
                        onChange={(e) => { setCriterioOrden(e.target.value); setPaginaActualEspacios(1); }}
                      >
                        <option value="jerarquia_grupos">📚 Grupo / Grado (Menor a Mayor)</option>
                        <option value="nombre_asc">🔤 Nombre (A-Z)</option>
                        <option value="capacidad_desc">👥 Capacidad (Mayor a Menor)</option>
                        <option value="tipo">🏫 Tipo de Ambiente</option>
                      </select>

                      <input 
                        type="text" 
                        className="form-control form-control-sm border-info rounded-pill w-auto" 
                        placeholder="Buscar espacio..."
                        value={searchEspacios}
                        onChange={(e) => { setSearchEspacios(e.target.value); setPaginaActualEspacios(1); }}
                        style={{ maxWidth: '180px' }}
                      />
                    </div>
                  </div>

                  {/* Barra de Acciones Masivas */}
                  {seleccionadosEspacios.length > 0 && (
                    <div className="alert alert-info border-0 shadow-sm d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3 mb-0 py-2 px-3 rounded-4 animate__animated animate__fadeIn">
                      <span className="badge bg-primary text-white rounded-pill px-3 py-2 fw-bold fs-6">
                        <i className="bi bi-check2-square me-1"></i> {seleccionadosEspacios.length} seleccionados
                      </span>
                      <div className="d-flex align-items-center gap-2">
                        <button 
                          className="btn btn-sm btn-success rounded-pill px-3 fw-bold shadow-sm"
                          onClick={handleDuplicarMasivoEspacios}
                        >
                          <i className="bi bi-files me-1"></i> Duplicar ({seleccionadosEspacios.length})
                        </button>
                        <button 
                          className="btn btn-sm btn-danger rounded-pill px-3 fw-bold shadow-sm"
                          onClick={handleEliminarMasivoEspacios}
                        >
                          <i className="bi bi-trash-fill me-1"></i> Eliminar ({seleccionadosEspacios.length})
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '40px' }} className="text-center">
                            <input 
                              type="checkbox" 
                              className="form-check-input"
                              checked={espaciosPaginados.length > 0 && espaciosPaginados.every(e => seleccionadosEspacios.includes(e.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const ids = espaciosPaginados.map(x => x.id);
                                  setSeleccionadosEspacios(Array.from(new Set([...seleccionadosEspacios, ...ids])));
                                } else {
                                  const idsPaginados = espaciosPaginados.map(x => x.id);
                                  setSeleccionadosEspacios(seleccionadosEspacios.filter(id => !idsPaginados.includes(id)));
                                }
                              }}
                            />
                          </th>
                          <th>Ambiente / Espacio</th>
                          <th>Plantel</th>
                          <th>Tipo</th>
                          <th className="text-center">Capacidad</th>
                          <th className="text-center">Salón Vinculado</th>
                          <th className="text-end pe-4">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {espaciosPaginados.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-5 text-muted">
                              <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                              No se encontraron ambientes escolares con los filtros seleccionados.
                            </td>
                          </tr>
                        ) : (
                          espaciosPaginados.map(esp => {
                            const salonAsoc = salones.find(s => s.id_espacio === esp.id);
                            const isSelected = seleccionadosEspacios.includes(esp.id);

                            return (
                              <tr key={esp.id} className={isSelected ? 'table-info' : ''}>
                                <td className="text-center">
                                  <input 
                                    type="checkbox" 
                                    className="form-check-input"
                                    checked={isSelected}
                                    onChange={() => {
                                      setSeleccionadosEspacios(prev => 
                                        prev.includes(esp.id) ? prev.filter(x => x !== esp.id) : [...prev, esp.id]
                                      );
                                    }}
                                  />
                                </td>
                                <td>
                                  <div className="fw-bold text-dark">{esp.nombre}</div>
                                  {esp.ubicacion && <div className="small text-muted"><i className="bi bi-geo-alt me-1"></i>{esp.ubicacion}</div>}
                                </td>
                                <td>
                                  <span className={`badge rounded-pill ${esp.id_escuela === 'sb' ? 'bg-info text-dark' : 'bg-primary text-white'}`}>
                                    {esp.id_escuela === 'sb' ? 'Santa Bárbara' : 'Libertador Bolívar'}
                                  </span>
                                </td>
                                <td>
                                  <span className="badge bg-light text-dark border">{esp.tipo}</span>
                                </td>
                                <td className="text-center">
                                  <span className="badge bg-success text-white rounded-pill px-3 py-1 fw-bold fs-6">
                                    {esp.capacidad} Cupos
                                  </span>
                                </td>
                                <td className="text-center">
                                  {salonAsoc ? (
                                    <span className="badge bg-primary text-white rounded-pill px-2 py-1">
                                      <i className="bi bi-check-circle me-1"></i>{salonAsoc.nombre_salon}
                                    </span>
                                  ) : (
                                    <span className="badge bg-secondary text-white rounded-pill px-2 py-1">
                                      Disponible
                                    </span>
                                  )}
                                </td>
                                <td className="text-end pe-4">
                                  <div className="btn-group btn-group-sm">
                                    <button 
                                      className="btn btn-outline-info"
                                      onClick={() => handleDuplicarEspacio(esp)}
                                      title="Duplicar espacio"
                                    >
                                      <i className="bi bi-files"></i>
                                    </button>
                                    <button 
                                      className="btn btn-outline-primary"
                                      onClick={() => handleEditarEspacio(esp)}
                                      title="Editar espacio"
                                    >
                                      <i className="bi bi-pencil-fill"></i>
                                    </button>
                                    <button 
                                      className="btn btn-outline-danger"
                                      onClick={() => handleEliminarEspacio(esp.id, esp.nombre)}
                                      title="Eliminar espacio"
                                    >
                                      <i className="bi bi-trash-fill"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginador */}
                  {totalPaginasEspacios > 1 && (
                    <div className="p-3 border-top d-flex justify-content-between align-items-center">
                      <span className="small text-muted">
                        Página {paginaActualEspacios} de {totalPaginasEspacios} ({espaciosFiltrados.length} registros)
                      </span>
                      <div className="btn-group btn-group-sm">
                        <button 
                          className="btn btn-outline-primary"
                          disabled={paginaActualEspacios === 1}
                          onClick={() => setPaginaActualEspacios(prev => Math.max(1, prev - 1))}
                        >
                          Anterior
                        </button>
                        <button 
                          className="btn btn-outline-primary"
                          disabled={paginaActualEspacios === totalPaginasEspacios}
                          onClick={() => setPaginaActualEspacios(prev => Math.min(totalPaginasEspacios, prev + 1))}
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* PESTAÑA 2: GRADOS, SECCIONES Y APERTURA DE SALONES        */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'salones' && (
        <div className="animate__animated animate__fadeIn">
          {/* Sub-pestañas de Configuración */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
            <div className="btn-group shadow-sm rounded-pill p-1 bg-white border">
              <button 
                className={`btn btn-sm rounded-pill px-4 fw-bold ${subTabSalones === 'apertura' ? 'btn-primary text-white' : 'btn-light text-dark'}`}
                onClick={() => setSubTabSalones('apertura')}
              >
                <i className="bi bi-door-open-fill me-1"></i> Salones Aperturados ({salones.length})
              </button>
              <button 
                className={`btn btn-sm rounded-pill px-4 fw-bold ${subTabSalones === 'grados' ? 'btn-primary text-white' : 'btn-light text-dark'}`}
                onClick={() => setSubTabSalones('grados')}
              >
                <i className="bi bi-mortarboard-fill me-1"></i> Configurar Grados ({grados.length})
              </button>
              <button 
                className={`btn btn-sm rounded-pill px-4 fw-bold ${subTabSalones === 'secciones' ? 'btn-primary text-white' : 'btn-light text-dark'}`}
                onClick={() => setSubTabSalones('secciones')}
              >
                <i className="bi bi-tag-fill me-1"></i> Configurar Secciones ({secciones.length})
              </button>
            </div>

            {subTabSalones === 'apertura' && canCrearSalones && (
              <button 
                className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm hover-efecto"
                onClick={() => abrirModalSalon()}
              >
                <i className="bi bi-plus-lg me-2"></i>Aperturar Nuevo Salón
              </button>
            )}
          </div>

          {/* Sub-vista 1: Apertura de Salones */}
          {subTabSalones === 'apertura' && (
            <div className="card bg-white shadow-sm border-0 rounded-4 overflow-hidden">
              <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                <h5 className="fw-bold text-dark m-0">
                  <i className="bi bi-grid-3x3-gap-fill text-primary me-2"></i>Salones Escolares Activos
                </h5>
                <div className="d-flex align-items-center gap-2">
                  <input 
                    type="text" 
                    className="form-control form-control-sm border-info rounded-pill"
                    placeholder="Buscar salón..."
                    value={searchSalones}
                    onChange={(e) => setSearchSalones(e.target.value)}
                    style={{ maxWidth: '200px' }}
                  />
                </div>
              </div>

              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Plantel</th>
                        <th>Nivel Educativo</th>
                        <th>Grado / Año y Sección</th>
                        <th>Ambiente Físico</th>
                        <th>Docente(s) Guía(s)</th>
                        <th className="text-center">Capacidad</th>
                        <th className="text-center">Inscritos</th>
                        <th className="text-end pe-4">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salonesFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-5 text-muted">
                            <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                            No hay salones aperturados registrados.
                          </td>
                        </tr>
                      ) : (
                        salonesFiltrados.map(sal => {
                          const esp = espacios.find(e => e.id === sal.id_espacio);
                          const estsCount = estudiantes.filter(e => e.codigo_escuela === sal.id_escuela && (e.grado_actual || '').toLowerCase() === (sal.grado_anio || '').toLowerCase() && (e.seccion_actual || '').toUpperCase() === (sal.seccion || '').toUpperCase()).length;
                          const cap = esp ? esp.capacidad : 0;
                          const docentesNombres = (sal.docentes_guias || [])
                            .map(ci => {
                              const d = docentes.find(doc => doc.cedula === ci);
                              return d ? d.nombre_completo : ci;
                            })
                            .join(', ') || 'Sin Asignar';

                          return (
                            <tr key={sal.id_salon}>
                              <td>
                                <span className={`badge rounded-pill ${sal.id_escuela === 'sb' ? 'bg-info text-dark' : 'bg-primary text-white'}`}>
                                  {sal.id_escuela === 'sb' ? 'Santa Bárbara' : 'Libertador Bolívar'}
                                </span>
                              </td>
                              <td><span className="badge bg-light text-dark border">{sal.nivel_educativo}</span></td>
                              <td>
                                <div className="fw-bold text-dark">{sal.nombre_salon}</div>
                                <div className="small text-muted">{sal.grado_anio} - Sección "{sal.seccion}"</div>
                              </td>
                              <td>
                                {esp ? (
                                  <div>
                                    <span className="fw-bold text-primary">{esp.nombre}</span>
                                    <div className="small text-muted">{esp.tipo}</div>
                                  </div>
                                ) : (
                                  <span className="text-muted small">Sin espacio físico</span>
                                )}
                              </td>
                              <td>
                                <button 
                                  className="btn btn-sm btn-light border rounded-pill text-dark fw-bold"
                                  onClick={() => abrirModalAsignarDocente(sal)}
                                  title="Clic para gestionar docentes guías"
                                >
                                  <i className="bi bi-person-badge text-primary me-1"></i>
                                  {docentesNombres}
                                </button>
                              </td>
                              <td className="text-center">
                                <span className="badge bg-success text-white rounded-pill px-3 py-1 fw-bold">
                                  {cap} Cupos
                                </span>
                              </td>
                              <td className="text-center">
                                <span className="badge bg-primary text-white rounded-pill px-3 py-1 fw-bold">
                                  {estsCount} Estudiantes
                                </span>
                              </td>
                              <td className="text-end pe-4">
                                <div className="btn-group btn-group-sm">
                                  <button 
                                    className="btn btn-outline-info"
                                    onClick={() => {
                                      setSalonSeleccionadoId(sal.id_salon);
                                      setActiveTab('matricula');
                                    }}
                                    title="Ver matrícula y estudiantes"
                                  >
                                    <i className="bi bi-people-fill"></i>
                                  </button>
                                  <button 
                                    className="btn btn-outline-primary"
                                    onClick={() => abrirModalSalon(sal)}
                                    title="Editar salón"
                                  >
                                    <i className="bi bi-pencil-fill"></i>
                                  </button>
                                  <button 
                                    className="btn btn-outline-danger"
                                    onClick={() => eliminarSalon(sal.id_salon, sal.nombre_salon)}
                                    title="Eliminar salón"
                                  >
                                    <i className="bi bi-trash-fill"></i>
                                  </button>
                                </div>
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
          )}

          {/* Sub-vista 2: Configurar Grados */}
          {subTabSalones === 'grados' && (
            <div className="card bg-white shadow-sm border-0 rounded-4 p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h5 className="fw-bold text-dark m-0">Escalafón Jerárquico de Grados y Años</h5>
                  <p className="text-muted small m-0">Ordene los grados y grupos desde el menor hasta el mayor nivel pedagógico.</p>
                </div>
                {canCrearGrados && (
                  <button 
                    className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
                    onClick={() => {
                      if (!Swal) return;
                      Swal.fire({
                        title: 'Nuevo Grado / Año',
                        input: 'text',
                        inputPlaceholder: 'Ej: 1er Grupo, 1er Grado, 1er Año...',
                        showCancelButton: true,
                        confirmButtonText: 'Guardar',
                        confirmButtonColor: '#00BCD4'
                      }).then(async (res: any) => {
                        if (res.isConfirmed && res.value?.trim()) {
                          const maxOrden = grados.reduce((max, g) => Math.max(max, g.orden || 0), 0);
                          await supabase.from('conf_grados').insert([{
                            id_parametro: 'GRA-' + new Date().getTime(),
                            valor: res.value.trim(),
                            orden: maxOrden + 1
                          }]);
                          cargarDatosCompletos(true);
                        }
                      });
                    }}
                  >
                    <i className="bi bi-plus-lg me-1"></i>Agregar Grado
                  </button>
                )}
              </div>

              <div className="list-group">
                {grados.sort((a, b) => a.orden - b.orden).map((g, idx) => (
                  <div key={g.id_parametro} className="list-group-item d-flex justify-content-between align-items-center py-3 border rounded-3 mb-2">
                    <div className="d-flex align-items-center gap-3">
                      <span className="badge bg-primary rounded-circle p-2 fs-6" style={{ width: '32px', height: '32px' }}>{idx + 1}</span>
                      <span className="fw-bold fs-6 text-dark">{g.valor}</span>
                    </div>
                    <div className="btn-group btn-group-sm">
                      <button 
                        className="btn btn-light border"
                        disabled={idx === 0}
                        onClick={async () => {
                          const temp = grados[idx - 1].orden;
                          await supabase.from('conf_grados').update({ orden: temp }).eq('id_parametro', g.id_parametro);
                          await supabase.from('conf_grados').update({ orden: g.orden }).eq('id_parametro', grados[idx - 1].id_parametro);
                          cargarDatosCompletos(true);
                        }}
                      >
                        <i className="bi bi-arrow-up"></i>
                      </button>
                      <button 
                        className="btn btn-light border"
                        disabled={idx === grados.length - 1}
                        onClick={async () => {
                          const temp = grados[idx + 1].orden;
                          await supabase.from('conf_grados').update({ orden: temp }).eq('id_parametro', g.id_parametro);
                          await supabase.from('conf_grados').update({ orden: g.orden }).eq('id_parametro', grados[idx + 1].id_parametro);
                          cargarDatosCompletos(true);
                        }}
                      >
                        <i className="bi bi-arrow-down"></i>
                      </button>
                      {canEliminarGrados && (
                        <button 
                          className="btn btn-outline-danger"
                          onClick={async () => {
                            if (confirm(`¿Eliminar ${g.valor}?`)) {
                              await supabase.from('conf_grados').delete().eq('id_parametro', g.id_parametro);
                              cargarDatosCompletos(true);
                            }
                          }}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-vista 3: Configurar Secciones */}
          {subTabSalones === 'secciones' && (
            <div className="card bg-white shadow-sm border-0 rounded-4 p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h5 className="fw-bold text-dark m-0">Catálogo de Secciones Escolares</h5>
                  <p className="text-muted small m-0">Identificadores de sección (A, B, C, D, Única, etc.)</p>
                </div>
                {canCrearSecciones && (
                  <button 
                    className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
                    onClick={() => {
                      if (!Swal) return;
                      Swal.fire({
                        title: 'Nueva Sección',
                        input: 'text',
                        inputPlaceholder: 'Ej: A, B, C, D, U...',
                        showCancelButton: true,
                        confirmButtonText: 'Guardar',
                        confirmButtonColor: '#00BCD4'
                      }).then(async (res: any) => {
                        if (res.isConfirmed && res.value?.trim()) {
                          await supabase.from('conf_secciones').insert([{
                            id_parametro: 'SEC-' + new Date().getTime(),
                            valor: res.value.trim().toUpperCase()
                          }]);
                          cargarDatosCompletos(true);
                        }
                      });
                    }}
                  >
                    <i className="bi bi-plus-lg me-1"></i>Agregar Sección
                  </button>
                )}
              </div>

              <div className="row g-3">
                {secciones.map(sec => (
                  <div key={sec.id_parametro} className="col-12 col-md-3">
                    <div className="card p-3 border text-center rounded-4 shadow-sm position-relative">
                      <h3 className="fw-bold text-primary m-0">"{sec.valor}"</h3>
                      <span className="small text-muted">Sección</span>
                      {canEliminarSecciones && (
                        <button 
                          className="btn btn-sm btn-outline-danger rounded-circle position-absolute top-0 end-0 m-2"
                          onClick={async () => {
                            if (confirm(`¿Eliminar sección ${sec.valor}?`)) {
                              await supabase.from('conf_secciones').delete().eq('id_parametro', sec.id_parametro);
                              cargarDatosCompletos(true);
                            }
                          }}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* PESTAÑA 3: DOCENTES GUÍAS Y MATRÍCULA ESTUDIANTIL         */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'matricula' && (
        <div className="animate__animated animate__fadeIn">
          <div className="row g-4">
            {/* Selector de Salones */}
            <div className="col-12 col-xl-4">
              <div className="card bg-white shadow-sm border-0 rounded-4 p-4 h-100">
                <h5 className="fw-bold text-dark mb-3">
                  <i className="bi bi-door-open-fill text-primary me-2"></i>Seleccionar Salón
                </h5>
                <p className="small text-muted mb-3">Haga clic en un salón para ver su lista de estudiantes inscritos y su docente guía.</p>

                <div className="list-group" style={{ maxHeight: '550px', overflowY: 'auto' }}>
                  {salonesFiltrados.map(sal => {
                    const estsCount = estudiantes.filter(e => e.codigo_escuela === sal.id_escuela && (e.grado_actual || '').toLowerCase() === (sal.grado_anio || '').toLowerCase() && (e.seccion_actual || '').toUpperCase() === (sal.seccion || '').toUpperCase()).length;
                    const esp = espacios.find(e => e.id === sal.id_espacio);
                    const cap = esp ? esp.capacidad : 35;
                    const isSelected = salonActivo?.id_salon === sal.id_salon;

                    return (
                      <button
                        key={sal.id_salon}
                        type="button"
                        className={`list-group-item list-group-item-action p-3 rounded-3 mb-2 border transition-all ${isSelected ? 'active bg-primary text-white shadow' : 'bg-light'}`}
                        onClick={() => setSalonSeleccionadoId(sal.id_salon)}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-bold fs-6">{sal.nombre_salon}</span>
                          <span className={`badge rounded-pill ${isSelected ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
                            {sal.id_escuela === 'sb' ? 'Santa Bárbara' : 'Libertador Bolívar'}
                          </span>
                        </div>
                        <div className={`small ${isSelected ? 'text-white-50' : 'text-muted'} d-flex justify-content-between align-items-center`}>
                          <span>{sal.nivel_educativo}</span>
                          <span className="fw-bold">{estsCount} / {cap} Estudiantes</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Listado de Estudiantes del Salón Seleccionado */}
            <div className="col-12 col-xl-8">
              {salonActivo ? (
                <div className="card bg-white shadow-sm border-0 rounded-4 overflow-hidden h-100">
                  <div className="card-header bg-white border-bottom p-4">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                      <div>
                        <span className={`badge rounded-pill me-2 ${salonActivo.id_escuela === 'sb' ? 'bg-info text-dark' : 'bg-primary text-white'}`}>
                          {salonActivo.id_escuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar'}
                        </span>
                        <h4 className="fw-bold text-dark m-0 d-inline align-middle">{salonActivo.nombre_salon}</h4>
                      </div>

                      {/* Botones de Descarga */}
                      <div className="d-flex align-items-center gap-2">
                        <button 
                          className="btn btn-sm btn-outline-success rounded-pill fw-bold shadow-sm hover-efecto"
                          onClick={() => exportarListadoMatriculaExcel(salonActivo)}
                          title="Descargar listado en Excel"
                        >
                          <i className="bi bi-file-earmark-excel-fill me-1"></i>Excel
                        </button>
                        <button 
                          className="btn btn-sm btn-primary rounded-pill fw-bold shadow-sm hover-efecto"
                          onClick={() => exportarListadoMatriculaPDF(salonActivo)}
                          title="Descargar listado oficial en PDF"
                        >
                          <i className="bi bi-file-earmark-pdf-fill me-1"></i>Descargar Listado Oficial PDF
                        </button>
                      </div>
                    </div>

                    {/* Ficha Resumen del Salón */}
                    <div className="row g-2 p-3 bg-light rounded-4 border">
                      <div className="col-12 col-md-4">
                        <span className="small text-muted d-block">Docente(s) Guía(s):</span>
                        <span className="fw-bold text-dark">
                          {(salonActivo.docentes_guias || [])
                            .map(ci => {
                              const doc = docentes.find(d => d.cedula === ci);
                              return doc ? doc.nombre_completo : ci;
                            })
                            .join(', ') || 'No asignado'}
                        </span>
                        <button 
                          className="btn btn-link btn-sm p-0 ms-2 text-primary"
                          onClick={() => abrirModalAsignarDocente(salonActivo)}
                        >
                          (Cambiar)
                        </button>
                      </div>
                      <div className="col-12 col-md-4">
                        <span className="small text-muted d-block">Espacio Asignado:</span>
                        <span className="fw-bold text-dark">
                          {espacios.find(e => e.id === salonActivo.id_espacio)?.nombre || 'Sin espacio'}
                        </span>
                      </div>
                      <div className="col-12 col-md-4">
                        <span className="small text-muted d-block">Ocupación / Matrícula:</span>
                        <span className="fw-bold text-success">
                          {estudiantesSalonActivo.length} Estudiantes Registrados
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="card-body p-0">
                    <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                      <h6 className="fw-bold text-dark m-0">Nómina de Estudiantes ({estudiantesSalonActivo.length})</h6>
                      <input 
                        type="text" 
                        className="form-control form-control-sm border-info rounded-pill"
                        placeholder="Buscar por cédula o nombre..."
                        value={searchEstudiantes}
                        onChange={(e) => setSearchEstudiantes(e.target.value)}
                        style={{ maxWidth: '250px' }}
                      />
                    </div>

                    <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: '40px' }} className="text-center">#</th>
                            <th>Nombres y Apellidos</th>
                            <th>Cédula / C.E.</th>
                            <th>C.I. Representante</th>
                            <th className="text-center">Estatus</th>
                            <th className="text-end pe-4">Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {estudiantesSalonActivo.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-5 text-muted">
                                <i className="bi bi-person-x fs-2 d-block mb-2"></i>
                                No hay estudiantes inscritos o vinculados en este salón.
                              </td>
                            </tr>
                          ) : (
                            estudiantesSalonActivo.map((est, idx) => (
                              <tr key={est.cedula_estudiante}>
                                <td className="text-center fw-bold text-muted">{idx + 1}</td>
                                <td>
                                  <div className="fw-bold text-dark">{est.apellidos_estudiante}, {est.nombres_estudiante}</div>
                                </td>
                                <td><span className="badge bg-light text-dark border">C.I. {est.cedula_estudiante}</span></td>
                                <td><span className="small text-muted">{est.cedula_representante || 'Sin asignar'}</span></td>
                                <td className="text-center">
                                  <span className="badge bg-success text-white rounded-pill px-2 py-1">Activo</span>
                                </td>
                                <td className="text-end pe-4">
                                  <button 
                                    className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold"
                                    onClick={() => handleReasignarEstudiante(est)}
                                    title="Mover a otra sección"
                                  >
                                    <i className="bi bi-arrow-left-right me-1"></i>Mover
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
              ) : (
                <div className="card bg-white shadow-sm border-0 rounded-4 p-5 text-center text-muted">
                  <i className="bi bi-door-closed fs-1 d-block mb-2 text-primary"></i>
                  Seleccione un salón a la izquierda para visualizar su nómina de matrícula estudiantil.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* PESTAÑA 4: CAPACIDAD INSTALADA Y REPORTES                 */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'reportes' && (
        <div className="animate__animated animate__fadeIn">
          {/* Header de Reportes */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
            <div>
              <h4 className="fw-bold text-dark m-0">Informe Consolidado de Infraestructura y Capacidad</h4>
              <p className="text-muted small m-0">Supervisión de cupos instalados vs. matrícula ocupada por plantel.</p>
            </div>
            <button 
              className="btn btn-success rounded-pill px-4 fw-bold shadow-sm hover-efecto"
              onClick={generarReporteCapacidadGlobalPDF}
            >
              <i className="bi bi-file-earmark-pdf-fill me-2"></i>Descargar Informe Consolidado (PDF)
            </button>
          </div>

          {/* Tarjetas Comparativas de Métricas */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-md-4">
              <div className="card p-4 border-0 shadow-sm rounded-4 text-white" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}>
                <span className="small fw-bold opacity-75">Capacidad Total Global</span>
                <h2 className="fw-bold m-0 mt-1">{capTotalGlobal} Cupos</h2>
                <div className="small opacity-90 mt-2">
                  <i className="bi bi-check-circle me-1"></i>{matTotalGlobal} Estudiantes Inscritos ({capTotalGlobal > 0 ? Math.round((matTotalGlobal / capTotalGlobal) * 100) : 0}% ocupación)
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card p-4 border-0 shadow-sm rounded-4 text-white" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}>
                <span className="small fw-bold opacity-75">U.E. Santa Bárbara</span>
                <h2 className="fw-bold m-0 mt-1">{capTotalSB} Cupos</h2>
                <div className="small opacity-90 mt-2">
                  <i className="bi bi-people-fill me-1"></i>{matTotalSB} Estudiantes Inscritos ({capTotalSB > 0 ? Math.round((matTotalSB / capTotalSB) * 100) : 0}% ocupación)
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="card p-4 border-0 shadow-sm rounded-4 text-white" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}>
                <span className="small fw-bold opacity-75">U.E. Libertador Bolívar</span>
                <h2 className="fw-bold m-0 mt-1">{capTotalLB} Cupos</h2>
                <div className="small opacity-90 mt-2">
                  <i className="bi bi-people-fill me-1"></i>{matTotalLB} Estudiantes Inscritos ({capTotalLB > 0 ? Math.round((matTotalLB / capTotalLB) * 100) : 0}% ocupación)
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Capacidad por Salón */}
          <div className="card bg-white shadow-sm border-0 rounded-4 overflow-hidden">
            <div className="card-header bg-white border-bottom p-4">
              <h5 className="fw-bold text-dark m-0">
                <i className="bi bi-table text-primary me-2"></i>Desglose de Ocupación por Ambiente y Salón
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Plantel</th>
                      <th>Ambiente Físico</th>
                      <th>Tipo</th>
                      <th>Salón Asignado</th>
                      <th className="text-center">Capacidad Máxima</th>
                      <th className="text-center">Matrícula Inscrita</th>
                      <th className="text-center">Cupos Vacantes</th>
                      <th className="text-center">Ocupación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {espacios.map(esp => {
                      const sal = salones.find(s => s.id_espacio === esp.id);
                      const estCount = sal ? estudiantes.filter(e => e.codigo_escuela === esp.id_escuela && (e.grado_actual || '').toLowerCase() === (sal.grado_anio || '').toLowerCase() && (e.seccion_actual || '').toUpperCase() === (sal.seccion || '').toUpperCase()).length : 0;
                      const vacantes = Math.max(0, esp.capacidad - estCount);
                      const pct = esp.capacidad > 0 ? Math.round((estCount / esp.capacidad) * 100) : 0;

                      return (
                        <tr key={esp.id}>
                          <td>
                            <span className={`badge rounded-pill ${esp.id_escuela === 'sb' ? 'bg-info text-dark' : 'bg-primary text-white'}`}>
                              {esp.id_escuela === 'sb' ? 'Santa Bárbara' : 'Libertador Bolívar'}
                            </span>
                          </td>
                          <td><span className="fw-bold text-dark">{esp.nombre}</span></td>
                          <td><span className="badge bg-light text-dark border">{esp.tipo}</span></td>
                          <td>
                            {sal ? (
                              <span className="badge bg-primary text-white rounded-pill px-3 py-1">
                                {sal.nombre_salon}
                              </span>
                            ) : (
                              <span className="badge bg-secondary text-white rounded-pill px-2 py-1">
                                Disponible
                              </span>
                            )}
                          </td>
                          <td className="text-center fw-bold">{esp.capacidad}</td>
                          <td className="text-center fw-bold text-primary">{estCount}</td>
                          <td className="text-center fw-bold text-success">{vacantes}</td>
                          <td className="text-center">
                            <div className="d-flex align-items-center justify-content-center gap-2">
                              <div className="progress flex-grow-1" style={{ height: '8px', maxWidth: '80px' }}>
                                <div 
                                  className={`progress-bar ${pct > 90 ? 'bg-danger' : pct > 75 ? 'bg-warning' : 'bg-success'}`} 
                                  role="progressbar" 
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                ></div>
                              </div>
                              <span className="small fw-bold">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
