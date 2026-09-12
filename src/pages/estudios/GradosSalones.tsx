import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';
import { formatPhoneNumber } from '../../lib/formatters';
import { ChamiloBreadcrumb, ChamiloHelpCallout, IconoGradosSalones } from '../../components/chamilo';
import { ModalAsignacionSorpresa, abrirModalParametrizarSorpresa, abrirModalProbarSonidos } from '../../components/ModalAsignacionSorpresa';

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
  nombres_representante?: string;
  apellidos_representante?: string;
  estado?: string;
  created_at?: string;
}

export interface ResponsabilidadDocente {
  id_responsabilidad: string;
  id_escuela: string;
  nombre_responsabilidad: string;
  categoria: string;
  nivel_educativo: string;
  grados_atendidos: string[];
  docentes_asignados: string[];
  periodo_escolar: string;
  horas_semanales?: number;
  observaciones?: string;
  created_at?: string;
}

const ESPECIALIDADES_SUGERIDAS = [
  'Especialista de Castellano',
  'Especialista de Inglés e Idiomas',
  'Docente de Educación Física y Deporte',
  'Especialista de Matemáticas',
  'Especialista de Ciencias Naturales / Biología',
  'Especialista de Física y Química',
  'Especialista de Geografía, Historia y Ciudadanía (GHC)',
  'Especialista de Computación y Recursos (CRA)',
  'Docente de Orientación y Convivencia',
  'Docente de Proyecto Socioproductivo / PTMS',
  'Especialista de Educación Artística / Música',
  'Especialista en Dificultades de Aprendizaje / Aula Integrada',
  'Coordinador(a) Pedagógico(a)'
];

interface GradosSalonesProps {
  defaultTab?: 'espacios' | 'salones' | 'matricula' | 'especialistas' | 'reportes';
}

export const GradosSalones: React.FC<GradosSalonesProps> = ({ defaultTab = 'salones' }) => {
  const navigate = useNavigate();
  const { tienePermiso, tienePermisoEnEscuela, loading: permLoading } = usePermisos();
  const Swal = (window as any).Swal;
  const html2pdf = (window as any).html2pdf;

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'espacios' | 'salones' | 'matricula' | 'especialistas' | 'reportes'>(defaultTab);

  // General State
  const [niveles, setNiveles] = useState<NivelItem[]>([]);
  const [grados, setGrados] = useState<GradoItem[]>([]);
  const [secciones, setSecciones] = useState<SeccionItem[]>([]);
  const [espacios, setEspacios] = useState<EspacioItem[]>([]);
  const [salones, setSalones] = useState<SalonItem[]>([]);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [estudiantes, setEstudiantes] = useState<EstudianteVinculado[]>([]);
  const [responsabilidades, setResponsabilidades] = useState<ResponsabilidadDocente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters and Selection
  const [escuelaFiltro, setEscuelaFiltro] = useState<string>('todas');
  const [criterioOrden, setCriterioOrden] = useState<string>('jerarquia_grupos');
  const [searchEspacios, setSearchEspacios] = useState<string>('');
  const [searchSalones, setSearchSalones] = useState<string>('');
  const [searchEstudiantes, setSearchEstudiantes] = useState<string>('');
  const [searchEspecialistas, setSearchEspecialistas] = useState<string>('');
  const [filtroNivelEspecialistas, setFiltroNivelEspecialistas] = useState<string>('todos');
  const [searchReportes, setSearchReportes] = useState<string>('');
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
  const [seleccionadosMatricula, setSeleccionadosMatricula] = useState<string[]>([]);
  const [mostrarPreviewSorpresa, setMostrarPreviewSorpresa] = useState(false);
  const [previewDocenteCedula, setPreviewDocenteCedula] = useState('');

  // Especialistas modal & form state
  const [mostrarModalEspecialidad, setMostrarModalEspecialidad] = useState<boolean>(false);
  const [editandoEspecialidadId, setEditandoEspecialidadId] = useState<string | null>(null);
  const [formEspecialidad, setFormEspecialidad] = useState<{
    id_escuela: string;
    nombre_responsabilidad: string;
    categoria: string;
    nivel_educativo: string;
    grados_atendidos: string[];
    docentes_asignados: string[];
    periodo_escolar: string;
    horas_semanales: number;
    observaciones: string;
  }>({
    id_escuela: 'sb',
    nombre_responsabilidad: '',
    categoria: 'Área de Formación / Especialista',
    nivel_educativo: 'Educación Media General',
    grados_atendidos: [],
    docentes_asignados: [],
    periodo_escolar: '2026 - 2027',
    horas_semanales: 12,
    observaciones: ''
  });

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
      // 1. Cargar datos básicos y primer bloque de estudiantes en paralelo inmediato
      const [nivRes, graRes, secRes, espRes, salRes, docRes, estPage1, estPage2, estPage3, estPage4] = await Promise.all([
        supabase.from('conf_niveles').select('id_parametro, valor').order('valor', { ascending: true }),
        supabase.from('conf_grados').select('id_parametro, valor, orden').order('orden', { ascending: true }),
        supabase.from('conf_secciones').select('id_parametro, valor').order('valor', { ascending: true }),
        supabase.from('espacios').select('*'),
        supabase.from('salones').select('*'),
        supabase.from('usuarios').select('cedula, nombre_completo, id_escuela, telefono, email').eq('rol', 'Docente').eq('estado', 'Activo').order('nombre_completo', { ascending: true }),
        // Carga paralela de bloques de estudiantes con solo las columnas requeridas (súper veloz)
        supabase.from('estudiantes_vinculaciones')
          .select('id, cedula_estudiante, nombres_estudiante, apellidos_estudiante, grado_actual, seccion_actual, codigo_escuela, cedula_representante, nombres_representante, apellidos_representante, estado, created_at')
          .eq('estado', 'Activo')
          .range(0, 999),
        supabase.from('estudiantes_vinculaciones')
          .select('id, cedula_estudiante, nombres_estudiante, apellidos_estudiante, grado_actual, seccion_actual, codigo_escuela, cedula_representante, nombres_representante, apellidos_representante, estado, created_at')
          .eq('estado', 'Activo')
          .range(1000, 1999),
        supabase.from('estudiantes_vinculaciones')
          .select('id, cedula_estudiante, nombres_estudiante, apellidos_estudiante, grado_actual, seccion_actual, codigo_escuela, cedula_representante, nombres_representante, apellidos_representante, estado, created_at')
          .eq('estado', 'Activo')
          .range(2000, 2999),
        supabase.from('estudiantes_vinculaciones')
          .select('id, cedula_estudiante, nombres_estudiante, apellidos_estudiante, grado_actual, seccion_actual, codigo_escuela, cedula_representante, nombres_representante, apellidos_representante, estado, created_at')
          .eq('estado', 'Activo')
          .range(3000, 3999)
      ]);

      const todosEstudiantes: EstudianteVinculado[] = [
        ...(estPage1.data || []),
        ...(estPage2.data || []),
        ...(estPage3.data || []),
        ...(estPage4.data || [])
      ];

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
      setEstudiantes(todosEstudiantes);

      // Cargar Responsabilidades y Especialistas Asignadas
      try {
        const { data: respData, error: respErr } = await supabase
          .from('responsabilidades_docentes')
          .select('*')
          .order('created_at', { ascending: false });

        if (!respErr && respData && respData.length > 0) {
          setResponsabilidades(respData);
          localStorage.setItem('sigae_responsabilidades_docentes', JSON.stringify(respData));
        } else {
          const localR = localStorage.getItem('sigae_responsabilidades_docentes');
          if (localR) setResponsabilidades(JSON.parse(localR));
        }
      } catch (errR) {
        const localR = localStorage.getItem('sigae_responsabilidades_docentes');
        if (localR) setResponsabilidades(JSON.parse(localR));
      }
    } catch (e: any) {
      console.error("Error al cargar datos del módulo unificado:", e);
      if (Swal) Swal.fire('Error', 'Falla de conexión al cargar datos escolares.', 'error');
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────
  // GESTIÓN DE ESPECIALISTAS Y OTRAS RESPONSABILIDADES
  // ──────────────────────────────────────────────────────────
  const abrirModalNuevaEspecialidad = (item?: ResponsabilidadDocente) => {
    if (item) {
      setEditandoEspecialidadId(item.id_responsabilidad);
      setFormEspecialidad({
        id_escuela: item.id_escuela || 'sb',
        nombre_responsabilidad: item.nombre_responsabilidad,
        categoria: item.categoria || 'Área de Formación / Especialista',
        nivel_educativo: item.nivel_educativo || 'Educación Media General',
        grados_atendidos: item.grados_atendidos || [],
        docentes_asignados: item.docentes_asignados || [],
        periodo_escolar: item.periodo_escolar || '2026 - 2027',
        horas_semanales: item.horas_semanales || 12,
        observaciones: item.observaciones || ''
      });
    } else {
      setEditandoEspecialidadId(null);
      setFormEspecialidad({
        id_escuela: escuelaFiltro !== 'todas' ? escuelaFiltro : (escuelasAutorizadas[0] || 'sb'),
        nombre_responsabilidad: '',
        categoria: 'Área de Formación / Especialista',
        nivel_educativo: 'Educación Media General',
        grados_atendidos: [],
        docentes_asignados: [],
        periodo_escolar: '2026 - 2027',
        horas_semanales: 12,
        observaciones: ''
      });
    }
    setMostrarModalEspecialidad(true);
  };

  const handleGuardarEspecialidad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEspecialidad.nombre_responsabilidad.trim()) {
      if (Swal) Swal.fire('Atención', 'Ingrese el nombre de la especialidad o responsabilidad.', 'warning');
      return;
    }
    if (formEspecialidad.grados_atendidos.length === 0) {
      if (Swal) Swal.fire('Atención', 'Seleccione al menos un grado o año atendido.', 'warning');
      return;
    }
    if (formEspecialidad.docentes_asignados.length === 0) {
      if (Swal) Swal.fire('Atención', 'Debe asignar al menos un docente o especialista.', 'warning');
      return;
    }

    try {
      const nuevaResp: ResponsabilidadDocente = {
        id_responsabilidad: editandoEspecialidadId || `resp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        id_escuela: formEspecialidad.id_escuela,
        nombre_responsabilidad: formEspecialidad.nombre_responsabilidad.trim(),
        categoria: formEspecialidad.categoria,
        nivel_educativo: formEspecialidad.nivel_educativo,
        grados_atendidos: formEspecialidad.grados_atendidos,
        docentes_asignados: formEspecialidad.docentes_asignados,
        periodo_escolar: '2026 - 2027',
        horas_semanales: Number(formEspecialidad.horas_semanales) || 0,
        observaciones: formEspecialidad.observaciones?.trim() || '',
        created_at: new Date().toISOString()
      };

      // Persistir en Supabase
      try {
        if (editandoEspecialidadId) {
          await supabase.from('responsabilidades_docentes').update(nuevaResp).eq('id_responsabilidad', editandoEspecialidadId);
        } else {
          await supabase.from('responsabilidades_docentes').insert([nuevaResp]);
        }
      } catch (errDb) {
        console.log('Sincronizando responsabilidad en base de datos:', errDb);
      }

      // Sincronizar en LocalStorage y Estado
      let listaActualizada: ResponsabilidadDocente[];
      if (editandoEspecialidadId) {
        listaActualizada = responsabilidades.map(r => r.id_responsabilidad === editandoEspecialidadId ? nuevaResp : r);
      } else {
        listaActualizada = [nuevaResp, ...responsabilidades];
      }
      setResponsabilidades(listaActualizada);
      localStorage.setItem('sigae_responsabilidades_docentes', JSON.stringify(listaActualizada));

      auditar('Control de Estudios', editandoEspecialidadId ? 'Editar Especialidad' : 'Crear Especialidad', `Responsabilidad: ${nuevaResp.nombre_responsabilidad} (${nuevaResp.nivel_educativo}) - Grados: ${nuevaResp.grados_atendidos.join(', ')}`);

      setMostrarModalEspecialidad(false);
      setEditandoEspecialidadId(null);

      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: editandoEspecialidadId ? '¡Especialidad Actualizada!' : '¡Especialidad Asignada!',
          text: `La responsabilidad "${nuevaResp.nombre_responsabilidad}" ha sido guardada con éxito para el año escolar 2026 - 2027.`,
          confirmButtonColor: '#2b4c7e'
        });
      }
    } catch (err) {
      console.error('Error al guardar responsabilidad:', err);
    }
  };

  const handleEliminarEspecialidad = async (resp: ResponsabilidadDocente) => {
    if (!Swal) return;
    const confirm = await Swal.fire({
      title: '¿Eliminar Responsabilidad?',
      html: `¿Está seguro de eliminar la especialidad <b>"${resp.nombre_responsabilidad}"</b> asignada para <b>${resp.nivel_educativo}</b>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b'
    });

    if (confirm.isConfirmed) {
      try {
        await supabase.from('responsabilidades_docentes').delete().eq('id_responsabilidad', resp.id_responsabilidad);
      } catch (e) {}

      const listaActualizada = responsabilidades.filter(r => r.id_responsabilidad !== resp.id_responsabilidad);
      setResponsabilidades(listaActualizada);
      localStorage.setItem('sigae_responsabilidades_docentes', JSON.stringify(listaActualizada));

      auditar('Control de Estudios', 'Eliminar Especialidad', `Eliminó responsabilidad ${resp.nombre_responsabilidad}`);
      Swal.fire('Eliminado', 'La especialidad ha sido removida del registro.', 'success');
    }
  };

  const generarReporteEspecialistasPDF = (escuelaCode: string = 'todas') => {
    if (!html2pdf) {
      if (Swal) Swal.fire('Aviso', 'Motor de PDF no disponible en este momento.', 'warning');
      return;
    }

    const filtrados = responsabilidades.filter(r => escuelaCode === 'todas' || r.id_escuela === escuelaCode);
    const nombrePlantel = escuelaCode === 'todas' ? 'Consolidado Institucional (Ambos Planteles)' : escuelaCode === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
    const logoPlantel = escuelaCode === 'lb' ? '/assets/img/logo_lb.png' : '/assets/img/logo_sb.png';
    const fecha = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });

    let filasHtml = '';
    if (filtrados.length === 0) {
      filasHtml = `<tr><td colspan="6" style="padding: 12px; text-align: center; color: #64748b;">No hay especialistas ni responsabilidades registradas.</td></tr>`;
    } else {
      filasHtml = filtrados.map((r, idx) => {
        const nombresDocs = r.docentes_asignados.map(ci => {
          const doc = docentes.find(d => d.cedula === ci);
          return doc ? `${doc.nombre_completo} (C.I. ${ci})` : `C.I. ${ci}`;
        }).join('<br/>');

        return `
          <tr style="border-bottom: 1px solid #cbd5e1; font-size: 10px;">
            <td style="padding: 6px; text-align: center; font-weight: bold;">${idx + 1}</td>
            <td style="padding: 6px; text-align: center;"><span style="font-weight: 700; color: ${r.id_escuela === 'sb' ? '#0284c7' : '#4f46e5'}">${r.id_escuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar'}</span></td>
            <td style="padding: 6px; font-weight: 700; color: #0f172a;">${r.nombre_responsabilidad}<br/><span style="color: #64748b; font-size: 9px;">${r.categoria}</span></td>
            <td style="padding: 6px; text-align: center;"><b>${r.nivel_educativo}</b></td>
            <td style="padding: 6px;">${r.grados_atendidos.join(', ')}</td>
            <td style="padding: 6px;">${nombresDocs || 'Sin docente asignado'}</td>
          </tr>
        `;
      }).join('');
    }

    const template = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; padding: 25px 30px; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 10px; margin-bottom: 14px;">
          <img src="${logoPlantel}" alt="Logo Escuela" style="height: 50px; object-fit: contain;" />
          <div style="text-align: center; flex-grow: 1; padding: 0 12px;">
            <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b;">República Bolivariana de Venezuela</div>
            <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b;">Ministerio del Poder Popular para la Educación</div>
            <div style="font-size: 13px; font-weight: 900; color: #0f172a; margin-top: 2px;">${nombrePlantel}</div>
            <div style="font-size: 11px; font-weight: 800; color: #0284c7; margin-top: 3px;">DIRECTORIO OFICIAL DE DOCENTES ESPECIALISTAS Y ÁREAS DE FORMACIÓN</div>
            <div style="font-size: 9px; color: #64748b;">Año Escolar 2026 - 2027 • Fecha de Emisión: ${fecha}</div>
          </div>
          <img src="/assets/img/logoMPPE.png" alt="MPPE Logo" style="height: 36px; object-fit: contain;" />
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #0284c7; color: #ffffff; font-size: 9.5px; text-transform: uppercase;">
              <th style="padding: 6px; text-align: center;">N°</th>
              <th style="padding: 6px; text-align: center;">Plantel</th>
              <th style="padding: 6px; text-align: left;">Especialidad / Área</th>
              <th style="padding: 6px; text-align: center;">Nivel Educativo</th>
              <th style="padding: 6px; text-align: left;">Grados / Años Atendidos</th>
              <th style="padding: 6px; text-align: left;">Docente(s) Especialista(s)</th>
            </tr>
          </thead>
          <tbody>
            ${filasHtml}
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-around; margin-top: 40px; text-align: center; font-size: 10px;">
          <div style="width: 220px; border-top: 1px solid #475569; padding-top: 5px;">
            <b>Control de Estudios y Evaluación</b>
            <div style="font-size: 8.5px; color: #64748b;">Firma y Sello</div>
          </div>
          <div style="width: 220px; border-top: 1px solid #475569; padding-top: 5px;">
            <b>Dirección del Plantel</b>
            <div style="font-size: 8.5px; color: #64748b;">Firma y Sello Oficial</div>
          </div>
        </div>
      </div>
    `;

    const opt = {
      margin: [8, 8, 8, 8],
      filename: `Nomina_Especialistas_2026_2027_${escuelaCode}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(template).save();
    auditar('Control de Estudios', 'Exportar Directorio Especialistas', `Descargó reporte PDF de especialistas para ${nombrePlantel}`);
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
      const payload = {
        nombre: formEspacio.nombre.trim(),
        tipo: formEspacio.tipo,
        capacidad: Number(formEspacio.capacidad) || 0,
        id_escuela: formEspacio.id_escuela
      };

      if (editandoEspacioId) {
        const { error } = await supabase
          .from('espacios')
          .update(payload)
          .eq('id', editandoEspacioId);
        if (error) throw error;
        auditar('Espacios Escolares', 'Modificar', `Actualizó espacio físico ${payload.nombre}`);
        if (Swal) Swal.fire('¡Actualizado!', 'El espacio físico fue modificado exitosamente.', 'success');
      } else {
        const payloadInsert = {
          ...payload,
          id: 'ESP-' + new Date().getTime()
        };
        const { error } = await supabase.from('espacios').insert([payloadInsert]);
        if (error) throw error;
        auditar('Espacios Escolares', 'Crear', `Registró nuevo espacio ${payload.nombre}`);
        if (Swal) Swal.fire('¡Registrado!', 'Espacio escolar creado correctamente.', 'success');
      }

      setFormEspacio({ nombre: '', tipo: 'Aula de Clases', capacidad: 35, id_escuela: 'sb', ubicacion: '', descripcion: '' });
      setEditandoEspacioId(null);
      cargarDatosCompletos(true);
    } catch (err: any) {
      console.error("Error al guardar espacio:", err);
      if (Swal) Swal.fire('Error', err?.message || 'No se pudo guardar el espacio físico.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditarEspacio = (espacio: EspacioItem) => {
    if (!Swal) {
      setEditandoEspacioId(espacio.id);
      setFormEspacio({
        nombre: espacio.nombre || '',
        tipo: espacio.tipo || 'Aula de Clases',
        capacidad: espacio.capacidad || 35,
        id_escuela: espacio.id_escuela || 'sb',
        ubicacion: '',
        descripcion: ''
      });
      return;
    }

    const tipos = [
      'Aula de Clases', 'Aula Clásica', 'Laboratorio', 'Cancha Deportiva',
      'Biblioteca', 'Comedor / Cantina', 'Auditorio', 'Área Administrativa',
      'Baños / Sanitarios', 'Otro'
    ];

    let optTipos = '';
    tipos.forEach(t => {
      optTipos += `<option value="${t}" ${espacio.tipo === t ? 'selected' : ''}>${t}</option>`;
    });

    let optEsc = `
      <option value="sb" ${espacio.id_escuela === 'sb' ? 'selected' : ''}>UE Santa Bárbara</option>
      <option value="lb" ${espacio.id_escuela === 'lb' ? 'selected' : ''}>UE Libertador Bolívar</option>
    `;

    Swal.fire({
      title: 'Editar Espacio / Ambiente Físico',
      html: `
        <div class="text-start">
          <label class="small fw-bold text-muted mb-1"><i class="bi bi-building me-1"></i>Plantel / Escuela</label>
          <select id="edit-esp-escuela" class="swal2-input m-0 mb-3 w-100">${optEsc}</select>

          <label class="small fw-bold text-muted mb-1"><i class="bi bi-tag me-1"></i>Nombre del Espacio</label>
          <input id="edit-esp-nombre" class="swal2-input m-0 mb-3 w-100" value="${espacio.nombre || ''}" placeholder="Ej: 1er Grado A, Lab. Ciencias..." />

          <div class="row g-2 mb-3">
            <div class="col-7">
              <label class="small fw-bold text-muted mb-1"><i class="bi bi-door-open me-1"></i>Tipo de Ambiente</label>
              <select id="edit-esp-tipo" class="swal2-input m-0 w-100">${optTipos}</select>
            </div>
            <div class="col-5">
              <label class="small fw-bold text-muted mb-1"><i class="bi bi-people me-1"></i>Capacidad</label>
              <input id="edit-esp-capacidad" type="number" min="1" max="1000" class="swal2-input m-0 w-100" value="${espacio.capacidad || 35}" />
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Guardar Cambios',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#00BCD4',
      preConfirm: () => {
        const esc = (document.getElementById('edit-esp-escuela') as HTMLSelectElement)?.value;
        const nom = (document.getElementById('edit-esp-nombre') as HTMLInputElement)?.value;
        const tip = (document.getElementById('edit-esp-tipo') as HTMLSelectElement)?.value;
        const cap = Number((document.getElementById('edit-esp-capacidad') as HTMLInputElement)?.value) || 0;

        if (!nom || !nom.trim()) {
          Swal.showValidationMessage('El nombre del espacio es obligatorio');
          return false;
        }

        if (cap <= 0) {
          Swal.showValidationMessage('La capacidad debe ser mayor a 0');
          return false;
        }

        return {
          nombre: nom.trim(),
          tipo: tip,
          capacidad: cap,
          id_escuela: esc
        };
      }
    }).then(async (result: any) => {
      if (result.isConfirmed && result.value) {
        setLoading(true);
        try {
          const { error } = await supabase.from('espacios').update(result.value).eq('id', espacio.id);
          if (error) throw error;
          auditar('Espacios Escolares', 'Modificar', `Actualizó espacio físico ${result.value.nombre}`);
          Swal.fire('¡Actualizado!', 'El espacio físico fue modificado exitosamente.', 'success');
          cargarDatosCompletos(true);
        } catch (err: any) {
          console.error("Error al actualizar espacio:", err);
          Swal.fire('Error', err?.message || 'No se pudo guardar el espacio físico.', 'error');
          setLoading(false);
        }
      }
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
          const payload = {
            id: 'ESP-' + new Date().getTime(),
            nombre: result.value.nombre,
            tipo: espacio.tipo,
            capacidad: result.value.capacidad,
            id_escuela: result.value.id_escuela
          };
          const { error } = await supabase.from('espacios').insert([payload]);
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
          const timestampBase = new Date().getTime();
          const nuevosRegistros = espaciosADuplicar.map((e, idx) => ({
            id: `ESP-${timestampBase}-${idx}`,
            nombre: `${e.nombre}${result.value.sufijo}`,
            tipo: e.tipo,
            capacidad: e.capacidad,
            id_escuela: result.value.escuelaOpt === 'conservar' ? e.id_escuela : result.value.escuelaOpt
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

    const escuelaInicial = salonExistente 
      ? salonExistente.id_escuela 
      : (escuelasAutorizadas.length === 1 ? escuelasAutorizadas[0] : (escuelaFiltro !== 'todas' ? escuelaFiltro : 'sb'));

    let optEscuelas = '';
    if (escuelasAutorizadas.includes('sb')) {
      optEscuelas += `<option value="sb" ${escuelaInicial === 'sb' ? 'selected' : ''}>UE Santa Bárbara</option>`;
    }
    if (escuelasAutorizadas.includes('lb')) {
      optEscuelas += `<option value="lb" ${escuelaInicial === 'lb' ? 'selected' : ''}>UE Libertador Bolívar</option>`;
    }
    if (!optEscuelas) {
      optEscuelas = `
        <option value="sb" ${escuelaInicial === 'sb' ? 'selected' : ''}>UE Santa Bárbara</option>
        <option value="lb" ${escuelaInicial === 'lb' ? 'selected' : ''}>UE Libertador Bolívar</option>
      `;
    }

    let optNiveles = '<option value="">Seleccione Nivel...</option>';
    niveles.forEach(n => {
      optNiveles += `<option value="${n.valor}" ${salonExistente?.nivel_educativo === n.valor ? 'selected' : ''}>${n.valor}</option>`;
    });

    const gradoCorrespondeANivel = (gradoNombre: string, nivelNombre: string): boolean => {
      if (!nivelNombre) return true;
      const g = (gradoNombre || '').toLowerCase().trim();
      const n = (nivelNombre || '').toLowerCase().trim();

      // INICIAL / PREESCOLAR / MATERNAL (Grupos, Salas, Maternal)
      if (n.includes('inicial') || n.includes('preescolar') || n.includes('maternal') || n.includes('infantil')) {
        return g.includes('grupo') || g.includes('maternal') || g.includes('lactante') || g.includes('sala') || g.includes('preescolar') || g.includes('inicial');
      }

      // PRIMARIA / BASICA (Grados 1ro al 6to)
      if (n.includes('primaria') || n.includes('básica') || n.includes('basica')) {
        return (g.includes('grado') || g.includes('1er') || g.includes('2do') || g.includes('3er') || g.includes('4to') || g.includes('5to') || g.includes('6to')) && !g.includes('año') && !g.includes('ano') && !g.includes('grupo');
      }

      // MEDIA GENERAL / TECNICA / BACHILLERATO (Años 1ro al 6to)
      if (n.includes('media') || n.includes('bachillerato') || n.includes('técnica') || n.includes('tecnica') || n.includes('secundaria')) {
        return g.includes('año') || g.includes('ano') || g.includes('mención') || g.includes('mencion') || g.includes('semestre') || g.includes('técnico') || g.includes('tecnico');
      }

      return true;
    };

    const obtenerOpcionesGrados = (nivelSel: string, gradoSeleccionadoValor?: string) => {
      let filtrados = grados.filter(g => gradoCorrespondeANivel(g.valor, nivelSel));
      if (filtrados.length === 0) {
        filtrados = grados;
      }
      filtrados.sort((a, b) => obtenerPesoJerarquico(a.valor) - obtenerPesoJerarquico(b.valor));

      let html = '<option value="">Seleccione Grado / Grupo / Año...</option>';
      filtrados.forEach(g => {
        const isSelected = (gradoSeleccionadoValor ? gradoSeleccionadoValor === g.valor : salonExistente?.grado_anio === g.valor);
        html += `<option value="${g.valor}" ${isSelected ? 'selected' : ''}>${g.valor}</option>`;
      });
      return html;
    };

    let optGrados = obtenerOpcionesGrados(salonExistente?.nivel_educativo || '', salonExistente?.grado_anio);

    let optSecc = '<option value="">Seleccione Sección...</option>';
    secciones.forEach(s => {
      optSecc += `<option value="${s.valor}" ${salonExistente?.seccion === s.valor ? 'selected' : ''}>${s.valor}</option>`;
    });

    const obtenerOpcionesEspacios = (idEsc: string, espacioSeleccionadoId?: string) => {
      const todosEscuela = espacios.filter(e => e.id_escuela === idEsc);
      
      // Espacios ocupados por otros salones
      const ocupadosPorOtros = new Set(
        salones
          .filter(s => s.id_salon !== salonExistente?.id_salon && s.id_espacio)
          .map(s => s.id_espacio)
      );

      // Espacios libres (descontando los ocupados)
      const disponibles = todosEscuela.filter(e => !ocupadosPorOtros.has(e.id));
      disponibles.sort((a, b) => obtenerPesoJerarquico(a.nombre, a.tipo) - obtenerPesoJerarquico(b.nombre, b.tipo));

      if (disponibles.length === 0) {
        return {
          html: `<option value="" disabled selected>⚠️ Sin espacios disponibles (${todosEscuela.length} espacios registrados en este plantel, todos ocupados)</option>`,
          totalDisponibles: 0,
          totalEscuela: todosEscuela.length
        };
      }

      let html = `<option value="">-- Seleccione Espacio Disponible (${disponibles.length} libres) --</option>`;
      disponibles.forEach(esp => {
        const isCurrent = salonExistente?.id_espacio === esp.id;
        const selected = (espacioSeleccionadoId ? espacioSeleccionadoId === esp.id : isCurrent) ? 'selected' : '';
        html += `<option value="${esp.id}" ${selected}>🏛️ ${esp.nombre} [${esp.tipo} - Capacidad: ${esp.capacidad} cupos] ${isCurrent ? '(Asignado Actual)' : ''}</option>`;
      });

      return {
        html,
        totalDisponibles: disponibles.length,
        totalEscuela: todosEscuela.length
      };
    };

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

        <div class="d-flex justify-content-between align-items-center mb-1">
          <label class="small fw-bold text-muted m-0"><i class="bi bi-door-open me-1"></i>Espacio Físico Disponible</label>
          <div id="modal-espacios-info"></div>
        </div>
        <select id="modal-espacio" class="swal2-input m-0 mb-3 w-100"></select>

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
        const escSel = document.getElementById('modal-escuela') as HTMLSelectElement;
        const nivelSel = document.getElementById('modal-nivel') as HTMLSelectElement;
        const gradoSel = document.getElementById('modal-grado') as HTMLSelectElement;
        const seccSel = document.getElementById('modal-seccion') as HTMLSelectElement;
        const espSel = document.getElementById('modal-espacio') as HTMLSelectElement;
        const espInfo = document.getElementById('modal-espacios-info') as HTMLElement;
        const nomInput = document.getElementById('modal-nombre') as HTMLInputElement;

        const autoActualizarNombre = () => {
          if (!salonExistente && gradoSel && gradoSel.value && seccSel && seccSel.value) {
            nomInput.value = `${gradoSel.value} "${seccSel.value}"`;
          }
        };

        const refrescarGrados = (nivelVal: string, gradoValPre?: string) => {
          if (gradoSel) {
            gradoSel.innerHTML = obtenerOpcionesGrados(nivelVal, gradoValPre);
          }
          autoActualizarNombre();
        };

        if (nivelSel) {
          nivelSel.addEventListener('change', () => {
            refrescarGrados(nivelSel.value);
          });
          refrescarGrados(nivelSel.value, salonExistente?.grado_anio);
        }

        const refrescarEspacios = (escId: string, preselectId?: string) => {
          const res = obtenerOpcionesEspacios(escId, preselectId);
          if (espSel) espSel.innerHTML = res.html;
          if (espInfo) {
            if (res.totalDisponibles > 0) {
              espInfo.innerHTML = `<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-0.5 rounded-pill" style="font-size: 11px;"><i class="bi bi-check-circle-fill me-1"></i>${res.totalDisponibles} de ${res.totalEscuela} libres</span>`;
            } else {
              espInfo.innerHTML = `<span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-0.5 rounded-pill" style="font-size: 11px;"><i class="bi bi-exclamation-triangle-fill me-1"></i>0 de ${res.totalEscuela} libres</span>`;
            }
          }
        };

        if (escSel) {
          escSel.addEventListener('change', () => {
            refrescarEspacios(escSel.value);
          });
          refrescarEspacios(escSel.value, salonExistente?.id_espacio);
        }

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

        if (!nivel || !grado || !seccion || !nombre.trim()) {
          Swal.showValidationMessage('Todos los campos son obligatorios');
          return false;
        }

        if (!espacio || espacio === '') {
          Swal.showValidationMessage('Debe seleccionar un espacio físico disponible para este plantel');
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
  // ASIGNACIÓN DE DOCENTE GUÍA (HASTA 2 DOCENTES POR AULA)
  // ──────────────────────────────────────────────────────────
  const abrirModalAsignarDocente = (salon: SalonItem) => {
    if (!Swal) return;

    // Docentes asignados a OTROS salones del plantel
    const docentesEnOtrosSalones: Record<string, string> = {};
    salones.forEach(s => {
      if (s.id_salon !== salon.id_salon && s.id_escuela === salon.id_escuela) {
        (s.docentes_guias || []).forEach(ci => {
          docentesEnOtrosSalones[ci] = s.nombre_salon;
        });
      }
    });

    // Docentes pertenecientes al plantel
    const docentesPlantel = docentes.filter(d => {
      const dEsc = String(d.id_escuela || '').trim().toLowerCase();
      const sEsc = String(salon.id_escuela || '').trim().toLowerCase();
      return !d.id_escuela || dEsc === sEsc || dEsc === 'ambas' || dEsc === 'todas';
    });

    // Docentes actualmente asignados a este salón
    let asignados: string[] = [...(salon.docentes_guias || [])];

    Swal.fire({
      title: `<div class="d-flex align-items-center justify-content-center gap-2 text-dark"><i class="bi bi-person-badge-fill text-info"></i> <span>Asignar Docentes: ${salon.nombre_salon}</span></div>`,
      html: `
        <div class="text-start">
          <div class="alert alert-info py-2 px-3 small border-0 mb-3 rounded-3 d-flex align-items-center justify-content-between">
            <div>
              <i class="bi bi-people-fill me-1"></i>
              <b>Permite hasta 2 docentes por aula</b> (Titular y Auxiliar / Co-Docente)
            </div>
            <span id="badge-contador-docentes" class="badge rounded-pill bg-primary px-2.5 py-1">
              ${asignados.length} / 2 asignados
            </span>
          </div>

          <!-- SECCIÓN 1: DOCENTES ASIGNADOS A ESTA AULA -->
          <div class="mb-3">
            <div class="d-flex align-items-center justify-content-between mb-1.5">
              <label class="small fw-bold text-dark mb-0">
                <i class="bi bi-check-circle-fill text-success me-1"></i>Docentes Asignados a esta Aula:
              </label>
              <span class="extra-small text-muted font-monospace">(Haga clic en Quitar para liberar)</span>
            </div>
            <div id="contenedor-asignados" class="p-2 border rounded-3 bg-white shadow-xs" style="min-height: 54px;">
              <!-- Renderizado dinámico -->
            </div>
          </div>

          <!-- SECCIÓN 2: BUSCADOR Y LISTA DE DOCENTES DISPONIBLES -->
          <div class="mb-2">
            <div class="d-flex align-items-center justify-content-between mb-1.5">
              <label class="small fw-bold text-muted mb-0">
                <i class="bi bi-person-plus-fill text-primary me-1"></i>Docentes Disponibles del Plantel:
              </label>
              <span class="extra-small text-muted font-monospace">(Al seleccionar, se borran de esta lista)</span>
            </div>
            <div class="input-group input-group-sm mb-2">
              <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
              <input 
                type="text" 
                id="input-buscar-docente" 
                class="form-control" 
                placeholder="Buscar por nombre o cédula..." 
              />
            </div>
            <div id="contenedor-disponibles" style="max-height: 220px; overflow-y: auto;" class="border rounded-3 p-1.5 bg-light shadow-xs">
              <!-- Renderizado dinámico -->
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-check-lg me-1"></i> Guardar Asignación',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#00BCD4',
      cancelButtonColor: '#64748b',
      didOpen: () => {
        const contAsignados = document.getElementById('contenedor-asignados');
        const contDisponibles = document.getElementById('contenedor-disponibles');
        const badgeContador = document.getElementById('badge-contador-docentes');
        const inputBuscar = document.getElementById('input-buscar-docente') as HTMLInputElement;

        const renderizar = () => {
          // 1. Contador
          if (badgeContador) {
            badgeContador.textContent = `${asignados.length} / 2 asignados`;
            badgeContador.className = `badge rounded-pill px-2.5 py-1 ${asignados.length === 2 ? 'bg-success' : asignados.length === 1 ? 'bg-primary' : 'bg-secondary'}`;
          }

          // 2. Docentes Asignados
          if (contAsignados) {
            if (asignados.length === 0) {
              contAsignados.innerHTML = `
                <div class="text-center py-2.5 text-muted small">
                  <i class="bi bi-exclamation-circle me-1 text-warning"></i>No hay docentes asignados. Seleccione hasta 2 docentes de la lista de disponibles abajo.
                </div>
              `;
            } else {
              let htmlAsig = '<div class="d-flex flex-column gap-1.5">';
              asignados.forEach((ci, idx) => {
                const doc = docentesPlantel.find(d => d.cedula === ci) || docentes.find(d => d.cedula === ci);
                const nombre = doc ? doc.nombre_completo : ci;
                const rolDocente = idx === 0 ? 'Docente Titular' : 'Docente Auxiliar / Co-Docente';
                const badgeColor = idx === 0 ? 'bg-success' : 'bg-info text-dark';

                htmlAsig += `
                  <div class="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light border animate__animated animate__fadeIn">
                    <div class="d-flex align-items-center gap-2">
                      <span class="badge ${badgeColor} rounded-pill" style="font-size: 10px;">${rolDocente}</span>
                      <span class="fw-bold text-dark small">${nombre}</span>
                      <span class="badge bg-white text-muted border small">C.I. ${ci}</span>
                    </div>
                    <button type="button" class="btn btn-xs btn-outline-danger rounded-pill px-2.5 py-0.5 btn-quitar-docente" data-ci="${ci}" title="Quitar de este salón">
                      <i class="bi bi-x-lg me-1"></i>Quitar
                    </button>
                  </div>
                `;
              });
              htmlAsig += '</div>';
              contAsignados.innerHTML = htmlAsig;
            }
          }

          // 3. Docentes Disponibles (Se borran de la lista los que ya están seleccionados)
          if (contDisponibles) {
            const query = (inputBuscar?.value || '').toLowerCase().trim();
            const disponibles = docentesPlantel.filter(d => {
              // Si ya está asignado a este salón, se borra de la lista
              if (asignados.includes(d.cedula)) return false;
              // Si está ocupado en otro salón del mismo plantel, no está disponible
              if (docentesEnOtrosSalones[d.cedula]) return false;
              if (!query) return true;
              const nom = String(d.nombre_completo || '').toLowerCase();
              const ci = String(d.cedula || '').toLowerCase();
              return nom.includes(query) || ci.includes(query);
            });

            if (disponibles.length === 0) {
              contDisponibles.innerHTML = `
                <div class="text-center py-3 text-muted small">
                  ${asignados.length >= 2 ? '<i class="bi bi-check-circle-fill text-success me-1"></i>Cupo completo para esta aula (2 docentes asignados).' : query ? 'No se encontraron docentes con ese nombre o cédula.' : 'No hay más docentes disponibles en este plantel.'}
                </div>
              `;
            } else {
              let htmlDisp = '<div class="d-flex flex-column gap-1">';
              disponibles.forEach(d => {
                const puedeAsignar = asignados.length < 2;
                htmlDisp += `
                  <div class="d-flex align-items-center justify-content-between p-2 rounded-3 bg-white border hover-efecto ${puedeAsignar ? '' : 'opacity-50'}">
                    <div>
                      <div class="fw-bold text-dark small">${d.nombre_completo} <span class="badge bg-light text-muted border">C.I. ${d.cedula}</span></div>
                      <div class="extra-small text-muted">${d.telefono ? formatPhoneNumber(d.telefono) : 'Sin tlf'} ${d.email ? `• ${d.email}` : ''}</div>
                    </div>
                    <button 
                      type="button" 
                      class="btn btn-xs ${puedeAsignar ? 'btn-primary' : 'btn-light text-muted'} rounded-pill px-3 py-1 fw-bold btn-asignar-docente" 
                      data-ci="${d.cedula}"
                      ${puedeAsignar ? '' : 'disabled'}
                      title="${puedeAsignar ? 'Seleccionar docente' : 'Cupo lleno (Máximo 2 docentes)'}"
                    >
                      <i class="bi bi-plus-lg me-1"></i>Asignar
                    </button>
                  </div>
                `;
              });
              htmlDisp += '</div>';
              contDisponibles.innerHTML = htmlDisp;
            }
          }

          // Listeners para quitar docentes asignados
          document.querySelectorAll('.btn-quitar-docente').forEach((btn: any) => {
            btn.onclick = () => {
              const ci = btn.getAttribute('data-ci');
              asignados = asignados.filter(c => c !== ci);
              renderizar();
            };
          });

          // Listeners para asignar docentes disponibles
          document.querySelectorAll('.btn-asignar-docente').forEach((btn: any) => {
            btn.onclick = () => {
              if (asignados.length >= 2) return;
              const ci = btn.getAttribute('data-ci');
              if (ci && !asignados.includes(ci)) {
                asignados.push(ci);
                renderizar();
              }
            };
          });
        };

        if (inputBuscar) {
          inputBuscar.oninput = () => renderizar();
        }

        renderizar();
      },
      preConfirm: () => {
        if (asignados.length > 2) {
          Swal.showValidationMessage('Solo se permite asignar un máximo de 2 docentes por aula.');
          return false;
        }
        return asignados;
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase.from('salones').update({
            docentes_guias: result.value
          }).eq('id_salon', salon.id_salon);
          if (error) throw error;
          auditar('Control de Estudios', 'Asignar Docente Guía', `Actualizó docentes guías de ${salon.nombre_salon}: asignó ${result.value.length} docente(s)`);
          Swal.fire({
            icon: 'success',
            title: '¡Asignación Guardada!',
            text: `Se han asignado ${result.value.length} docente(s) a ${salon.nombre_salon}.`,
            confirmButtonColor: '#00BCD4'
          });
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

    const nombreEscuela = salon.id_escuela === 'sb' ? 'UE SANTA BÁRBARA' : 'UE LIBERTADOR BOLÍVAR';
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

  // Previsualizar Sorpresa de Asignación Docente
  const abrirSelectorPreviewSorpresa = () => {
    if (!Swal) return;
    if (docentes.length === 0) {
      Swal.fire('Sin Docentes', 'No hay docentes registrados para previsualizar.', 'info');
      return;
    }

    let optionsHtml = '';
    docentes.forEach(d => {
      optionsHtml += `<option value="${d.cedula}">${d.nombre_completo} (C.I. ${d.cedula}) - ${d.id_escuela === 'sb' ? 'Santa Bárbara' : 'Libertador Bolívar'}</option>`;
    });

    Swal.fire({
      title: '🎉 Previsualizar Ficha Sorpresa Docente',
      html: `
        <div class="text-start">
          <p class="small text-muted mb-2">Seleccione el docente o miembro del personal para ver exactamente cómo se le presentará su sorpresa de asignación:</p>
          <select id="swal-select-docente-preview" class="form-select form-select-sm rounded-3 mb-2">
            ${optionsHtml}
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Ver Ficha Sorpresa',
      confirmButtonColor: '#4f46e5',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const el = document.getElementById('swal-select-docente-preview') as HTMLSelectElement;
        return el ? el.value : '';
      }
    }).then((res: any) => {
      if (res.isConfirmed && res.value) {
        setPreviewDocenteCedula(res.value);
        setMostrarPreviewSorpresa(true);
      }
    });
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

  // ──────────────────────────────────────────────────────────
  // VINCULACIÓN MASIVA DE ESTUDIANTES AL SALÓN
  // ──────────────────────────────────────────────────────────
  const abrirModalVincularEstudiantesMasivo = (salon: SalonItem) => {
    if (!Swal) return;

    // Todos los estudiantes registrados para este grado/año
    const estudiantesDelGrado = estudiantes.filter(e => 
      (e.grado_actual || '').toLowerCase().trim() === (salon.grado_anio || '').toLowerCase().trim()
    );

    const inscritosEnEsteSalon = estudiantesDelGrado.filter(e => 
      e.codigo_escuela === salon.id_escuela &&
      (e.seccion_actual || '').toUpperCase() === (salon.seccion || '').toUpperCase()
    );

    const todosCandidatos = estudiantesDelGrado.filter(e => 
      !(e.codigo_escuela === salon.id_escuela && (e.seccion_actual || '').toUpperCase() === (salon.seccion || '').toUpperCase())
    ).sort((a, b) => (a.apellidos_estudiante || '').localeCompare(b.apellidos_estudiante || ''));

    const espacioSalon = espacios.find(e => e.id === salon.id_espacio);
    const capTotal = espacioSalon ? espacioSalon.capacidad : 35;
    const vacantes = Math.max(0, capTotal - inscritosEnEsteSalon.length);
    const nombrePlantelSalon = salon.id_escuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';

    if (todosCandidatos.length === 0) {
      Swal.fire({
        title: 'Sin Estudiantes Pendientes',
        html: `
          <div class="text-start">
            <p class="mb-2">Todos los estudiantes registrados para <b>${salon.grado_anio}</b> ya se encuentran asignados a este salón (${inscritosEnEsteSalon.length} estudiantes).</p>
            <p class="small text-muted mb-0">No hay más estudiantes registrados en el sistema para este nivel educativo.</p>
          </div>
        `,
        icon: 'info',
        confirmButtonColor: '#00BCD4'
      });
      return;
    }

    const htmlModal = `
      <div class="text-start" style="font-size: 13px;">
        <!-- Cabecera Informativa -->
        <div class="p-3 mb-3 rounded-4 border bg-light d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <span class="badge ${salon.id_escuela === 'sb' ? 'bg-info text-dark' : 'bg-primary text-white'} rounded-pill mb-1">${nombrePlantelSalon}</span>
            <div class="fw-bold fs-6 text-dark">${salon.nombre_salon} (Sección "${salon.seccion}")</div>
            <div class="small text-muted">Grado/Año: ${salon.grado_anio} | Ambiente: ${espacioSalon?.nombre || 'General'}</div>
          </div>
          <div class="text-end">
            <div class="small text-muted">Capacidad: <b>${capTotal} cupos</b></div>
            <div class="small text-muted">Inscritos: <b class="text-primary">${inscritosEnEsteSalon.length}</b></div>
            <div class="fw-bold ${vacantes > 0 ? 'text-success' : 'text-danger'}">Vacantes: ${vacantes} libres</div>
          </div>
        </div>

        <!-- Filtros de Plantel y Estado -->
        <div class="row g-2 mb-2 align-items-center">
          <div class="col-12 col-md-6">
            <label class="small fw-bold text-muted mb-1 d-block"><i class="bi bi-building me-1"></i>Filtrar por Plantel / Escuela:</label>
            <select id="swal-filtro-plantel" class="form-select form-select-sm border-info rounded-pill">
              <option value="${salon.id_escuela}" selected>Mismo Plantel: ${nombrePlantelSalon}</option>
              <option value="todas">Todos los Planteles (${todosCandidatos.length})</option>
              <option value="${salon.id_escuela === 'sb' ? 'lb' : 'sb'}">Solo ${salon.id_escuela === 'sb' ? 'UE Libertador Bolívar' : 'UE Santa Bárbara'}</option>
            </select>
          </div>
          <div class="col-12 col-md-6">
            <label class="small fw-bold text-muted mb-1 d-block"><i class="bi bi-funnel me-1"></i>Estado de Asignación:</label>
            <div class="btn-group btn-group-sm w-100" role="group">
              <button type="button" id="btn-filtro-sin-sec" class="btn btn-outline-primary active rounded-start-pill py-1">Sin Sección</button>
              <button type="button" id="btn-filtro-todos" class="btn btn-outline-primary rounded-end-pill py-1">Todos</button>
            </div>
          </div>
        </div>

        <!-- Barra de Búsqueda -->
        <div class="mb-2">
          <input type="text" id="swal-search-cand" class="form-control form-control-sm border-info rounded-pill" placeholder="🔍 Buscar por cédula o nombre del estudiante..." />
        </div>

        <!-- Indicador de Selección -->
        <div class="d-flex justify-content-between align-items-center mb-2 px-1">
          <div class="form-check m-0">
            <input class="form-check-input" type="checkbox" id="swal-check-all-cand">
            <label class="form-check-label fw-bold text-dark cursor-pointer" for="swal-check-all-cand">
              Seleccionar Visibles
            </label>
          </div>
          <div id="swal-counter-badge" class="badge bg-primary text-white rounded-pill px-3 py-1">
            0 seleccionados
          </div>
        </div>

        <!-- Tabla de Estudiantes Candidatos -->
        <div class="table-responsive border rounded-3 bg-white" style="max-height: 280px; overflow-y: auto;">
          <table class="table table-sm table-hover align-middle mb-0" id="tabla-candidatos">
            <thead class="table-light sticky-top">
              <tr>
                <th style="width: 35px;" class="text-center">#</th>
                <th>Estudiante</th>
                <th class="text-center">Plantel</th>
                <th class="text-center">Cédula / C.E.</th>
                <th class="text-center">Estado Actual</th>
              </tr>
            </thead>
            <tbody id="tbody-candidatos">
              <!-- Renderizado dinámicamente -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    Swal.fire({
      title: `Vincular Estudiantes Masivamente`,
      html: htmlModal,
      width: '800px',
      showCancelButton: true,
      confirmButtonText: `<i class="bi bi-person-check-fill me-1"></i> Asignar a Sección "${salon.seccion}"`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#00BCD4',
      cancelButtonColor: '#64748b',
      didOpen: () => {
        const searchInput = document.getElementById('swal-search-cand') as HTMLInputElement;
        const checkAll = document.getElementById('swal-check-all-cand') as HTMLInputElement;
        const counterBadge = document.getElementById('swal-counter-badge') as HTMLElement;
        const tbody = document.getElementById('tbody-candidatos') as HTMLElement;
        const selectPlantel = document.getElementById('swal-filtro-plantel') as HTMLSelectElement;
        const btnSinSec = document.getElementById('btn-filtro-sin-sec') as HTMLButtonElement;
        const btnTodos = document.getElementById('btn-filtro-todos') as HTMLButtonElement;

        let filtroEscuela = salon.id_escuela;
        let filtroTipo: 'sin_seccion' | 'todos' = 'sin_seccion';
        let textoBusqueda = '';
        const seleccionadosSet = new Set<string>();

        // Preseleccionar por defecto los "Sin Sección" del mismo plantel hasta el límite de vacantes
        const sinSecIniciales = todosCandidatos.filter(c => 
          c.codigo_escuela === salon.id_escuela &&
          (!c.seccion_actual || c.seccion_actual.toLowerCase().includes('sin') || c.seccion_actual.trim() === '')
        );
        sinSecIniciales.slice(0, vacantes > 0 ? vacantes : sinSecIniciales.length).forEach(c => seleccionadosSet.add(c.id || c.cedula_estudiante));

        const renderizarTabla = () => {
          const lista = todosCandidatos.filter(c => {
            const matchEscuela = filtroEscuela === 'todas' || (c.codigo_escuela || '').toLowerCase().trim() === filtroEscuela.toLowerCase().trim();
            if (!matchEscuela) return false;

            const isSinSec = !c.seccion_actual || c.seccion_actual.toLowerCase().includes('sin') || c.seccion_actual.trim() === '';
            if (filtroTipo === 'sin_seccion' && !isSinSec) return false;

            if (textoBusqueda) {
              const q = textoBusqueda.toLowerCase();
              const nom = `${c.nombres_estudiante || ''} ${c.apellidos_estudiante || ''}`.toLowerCase();
              const ci = (c.cedula_estudiante || '').toLowerCase();
              return nom.includes(q) || ci.includes(q);
            }
            return true;
          });

          if (lista.length === 0) {
            tbody.innerHTML = `
              <tr>
                <td colspan="5" class="text-center py-4 text-muted">
                  <i class="bi bi-inbox fs-3 d-block mb-1"></i>
                  No se encontraron estudiantes con los filtros aplicados.
                </td>
              </tr>
            `;
          } else {
            tbody.innerHTML = lista.map((c) => {
              const rowId = c.id || c.cedula_estudiante;
              const isChecked = seleccionadosSet.has(rowId);
              const isSinSec = !c.seccion_actual || c.seccion_actual.toLowerCase().includes('sin') || c.seccion_actual.trim() === '';
              
              return `
                <tr class="${isChecked ? 'table-info' : ''}">
                  <td class="text-center">
                    <input type="checkbox" class="form-check-input chk-cand" id="chk-${rowId}" value="${rowId}" ${isChecked ? 'checked' : ''} />
                  </td>
                  <td>
                    <div class="fw-bold text-dark">${c.apellidos_estudiante}, ${c.nombres_estudiante}</div>
                    <div class="small text-muted">Rep: ${c.nombres_representante || c.cedula_representante || 'N/A'}</div>
                  </td>
                  <td class="text-center">
                    <span class="badge ${c.codigo_escuela === 'sb' ? 'bg-info text-dark' : 'bg-primary text-white'} rounded-pill" style="font-size: 11px;">
                      ${c.codigo_escuela === 'sb' ? 'Santa Bárbara' : 'Libertador Bolívar'}
                    </span>
                  </td>
                  <td class="text-center font-monospace">${c.cedula_estudiante}</td>
                  <td class="text-center">
                    <span class="badge ${isSinSec ? 'bg-warning text-dark' : 'bg-secondary text-white'} rounded-pill">
                      ${isSinSec ? 'Sin Asignar' : `Sección "${c.seccion_actual}"`}
                    </span>
                  </td>
                </tr>
              `;
            }).join('');
          }

          // Asignar listeners a cada checkbox
          document.querySelectorAll('.chk-cand').forEach((chk: any) => {
            chk.addEventListener('change', (e: any) => {
              const val = e.target.value;
              if (e.target.checked) {
                seleccionadosSet.add(val);
              } else {
                seleccionadosSet.delete(val);
              }
              actualizarContador();
            });
          });

          actualizarContador();
        };

        const actualizarContador = () => {
          const count = seleccionadosSet.size;
          if (counterBadge) {
            if (count > vacantes && vacantes > 0) {
              counterBadge.className = 'badge bg-danger text-white rounded-pill px-3 py-1';
              counterBadge.innerHTML = `⚠️ ${count} seleccionados (Sobrecupo +${count - vacantes})`;
            } else {
              counterBadge.className = 'badge bg-primary text-white rounded-pill px-3 py-1';
              counterBadge.innerHTML = `✓ ${count} seleccionados (de ${vacantes} vacantes)`;
            }
          }

          const visibleChecks = document.querySelectorAll('.chk-cand');
          if (checkAll && visibleChecks.length > 0) {
            const allChecked = Array.from(visibleChecks).every((el: any) => el.checked);
            checkAll.checked = allChecked;
          }
        };

        if (selectPlantel) {
          selectPlantel.addEventListener('change', (e: any) => {
            filtroEscuela = e.target.value;
            renderizarTabla();
          });
        }

        if (searchInput) {
          searchInput.addEventListener('input', (e: any) => {
            textoBusqueda = e.target.value;
            renderizarTabla();
          });
        }

        if (btnSinSec && btnTodos) {
          btnSinSec.addEventListener('click', () => {
            filtroTipo = 'sin_seccion';
            btnSinSec.classList.add('active');
            btnTodos.classList.remove('active');
            renderizarTabla();
          });
          btnTodos.addEventListener('click', () => {
            filtroTipo = 'todos';
            btnTodos.classList.add('active');
            btnSinSec.classList.remove('active');
            renderizarTabla();
          });
        }

        if (checkAll) {
          checkAll.addEventListener('change', (e: any) => {
            const isChecked = e.target.checked;
            document.querySelectorAll('.chk-cand').forEach((chk: any) => {
              chk.checked = isChecked;
              if (isChecked) {
                seleccionadosSet.add(chk.value);
              } else {
                seleccionadosSet.delete(chk.value);
              }
            });
            renderizarTabla();
          });
        }

        renderizarTabla();
        (window as any).__swal_seleccionados_cand__ = seleccionadosSet;
      },
      preConfirm: () => {
        const seleccionadosSet = (window as any).__swal_seleccionados_cand__ as Set<string>;
        const ids = seleccionadosSet ? Array.from(seleccionadosSet) : [];
        if (ids.length === 0) {
          Swal.showValidationMessage('Debe seleccionar al menos un estudiante para vincular');
          return false;
        }
        return ids;
      }
    }).then(async (result: any) => {
      if (result.isConfirmed && result.value) {
        const ids: string[] = result.value;
        setLoading(true);
        try {
          // Actualizar estudiantes asignando el plantel del salón y la sección
          const { error } = await supabase
            .from('estudiantes_vinculaciones')
            .update({
              codigo_escuela: salon.id_escuela,
              seccion_actual: salon.seccion
            })
            .or(`id.in.(${ids.join(',')}),cedula_estudiante.in.(${ids.join(',')})`);

          if (error) throw error;

          auditar('Control de Estudios', 'Vincular Estudiantes Masivo', `Asignó ${ids.length} estudiantes a la sección "${salon.seccion}" de ${salon.nombre_salon}`);
          Swal.fire({
            icon: 'success',
            title: '¡Estudiantes Vinculados!',
            text: `Se han asignado exitosamente ${ids.length} estudiantes al salón ${salon.nombre_salon}.`,
            confirmButtonColor: '#00BCD4'
          });
          cargarDatosCompletos(true);
        } catch (e: any) {
          console.error("Error al vincular estudiantes masivamente:", e);
          Swal.fire('Error', e?.message || 'Falla al vincular estudiantes al salón.', 'error');
          setLoading(false);
        }
      }
    });
  };

  // Desvincular estudiante individual
  const handleDesvincularEstudiante = (est: EstudianteVinculado, salon: SalonItem) => {
    if (!Swal) return;
    Swal.fire({
      title: '¿Desvincular del Salón?',
      text: `El estudiante ${est.nombres_estudiante} ${est.apellidos_estudiante} quedará en estado "Sin Asignar".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, desvincular',
      cancelButtonText: 'Cancelar'
    }).then(async (res: any) => {
      if (res.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase
            .from('estudiantes_vinculaciones')
            .update({ seccion_actual: 'Sin Asignar' })
            .eq('cedula_estudiante', est.cedula_estudiante);

          if (error) throw error;
          auditar('Control de Estudios', 'Desvincular Estudiante', `Desvinculó a ${est.nombres_estudiante} ${est.apellidos_estudiante} del salón ${salon.nombre_salon}`);
          Swal.fire('Desvinculado', 'El estudiante ha sido desvinculado del salón.', 'success');
          cargarDatosCompletos(true);
        } catch (err: any) {
          console.error(err);
          Swal.fire('Error', 'No se pudo desvincular al estudiante.', 'error');
          setLoading(false);
        }
      }
    });
  };

  // Desvinculación masiva de estudiantes del salón
  const handleDesvincularMasivo = (salon: SalonItem) => {
    if (seleccionadosMatricula.length === 0 || !Swal) return;
    Swal.fire({
      title: `¿Desvincular ${seleccionadosMatricula.length} estudiantes?`,
      text: `Los estudiantes seleccionados serán removidos del salón ${salon.nombre_salon} y volverán al estado "Sin Asignar".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: `Sí, desvincular (${seleccionadosMatricula.length})`,
      cancelButtonText: 'Cancelar'
    }).then(async (res: any) => {
      if (res.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase
            .from('estudiantes_vinculaciones')
            .update({ seccion_actual: 'Sin Asignar' })
            .or(`id.in.(${seleccionadosMatricula.join(',')}),cedula_estudiante.in.(${seleccionadosMatricula.join(',')})`);

          if (error) throw error;
          auditar('Control de Estudios', 'Desvinculación Masiva', `Desvinculó ${seleccionadosMatricula.length} estudiantes del salón ${salon.nombre_salon}`);
          setSeleccionadosMatricula([]);
          Swal.fire('¡Desvinculados!', `${seleccionadosMatricula.length} estudiantes han sido desvinculados exitosamente.`, 'success');
          cargarDatosCompletos(true);
        } catch (e: any) {
          console.error(e);
          Swal.fire('Error', 'No se pudieron desvincular los estudiantes seleccionados.', 'error');
          setLoading(false);
        }
      }
    });
  };

  // Reporte de Capacidad Instalada (Global o por Escuela)
  const generarReporteCapacidadGlobalPDF = (targetEscuela: string = escuelaFiltro) => {
    if (!html2pdf) return;

    const fechaHoy = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const anoActual = new Date().getFullYear();

    const espaciosFiltradosReporte = targetEscuela === 'todas'
      ? espacios
      : espacios.filter(e => e.id_escuela === targetEscuela);

    const rowsEspaciosHtml = espaciosFiltradosReporte.map((esp, idx) => {
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

    const tituloInforme = targetEscuela === 'sb'
      ? 'INFORME OFICIAL DE CAPACIDAD INSTALADA - U.E. "SANTA BÁRBARA"'
      : targetEscuela === 'lb'
      ? 'INFORME OFICIAL DE CAPACIDAD INSTALADA - U.E. "LIBERTADOR BOLÍVAR"'
      : 'INFORME OFICIAL DE CAPACIDAD INSTALADA E INFRAESTRUCTURA';

    const subtituloInforme = targetEscuela === 'sb'
      ? `Plantel: U.E. "Santa Bárbara" | Año Escolar ${anoActual}-${anoActual + 1} | Fecha: ${fechaHoy}`
      : targetEscuela === 'lb'
      ? `Plantel: U.E. "Libertador Bolívar" | Año Escolar ${anoActual}-${anoActual + 1} | Fecha: ${fechaHoy}`
      : `Consolidado Institucional: U.E. Santa Bárbara & U.E. Libertador Bolívar | Año Escolar ${anoActual}-${anoActual + 1} | Fecha: ${fechaHoy}`;

    const nombreArchivo = targetEscuela === 'sb'
      ? `Reporte_Capacidad_Santa_Barbara_${new Date().toISOString().slice(0, 10)}.pdf`
      : targetEscuela === 'lb'
      ? `Reporte_Capacidad_Libertador_Bolivar_${new Date().toISOString().slice(0, 10)}.pdf`
      : `Reporte_Capacidad_Consolidado_${new Date().toISOString().slice(0, 10)}.pdf`;

    const capTarget = targetEscuela === 'sb' ? capTotalSB : targetEscuela === 'lb' ? capTotalLB : capTotalGlobal;
    const matTarget = targetEscuela === 'sb' ? matTotalSB : targetEscuela === 'lb' ? matTotalLB : matTotalGlobal;
    const vacTarget = Math.max(0, capTarget - matTarget);
    const pctTarget = capTarget > 0 ? Math.round((matTarget / capTarget) * 100) : 0;

    const templateHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 25px 30px; background: #fff;">
        <div style="text-align: center; border-bottom: 2px solid #059669; padding-bottom: 10px; margin-bottom: 15px;">
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b;">República Bolivariana de Venezuela</div>
          <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b;">Ministerio del Poder Popular para la Educación</div>
          <div style="font-size: 15px; font-weight: 800; color: #065f46; margin-top: 3px;">${tituloInforme}</div>
          <div style="font-size: 11px; color: #64748b;">${subtituloInforme}</div>
        </div>

        <!-- Indicadores Resumen -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; text-align: center;">
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 8px;">
            <div style="font-size: 9px; color: #166534; font-weight: bold; text-transform: uppercase;">Capacidad Instalada</div>
            <div style="font-size: 18px; font-weight: 800; color: #15803d;">${capTarget} Cupos</div>
          </div>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 8px;">
            <div style="font-size: 9px; color: #1e40af; font-weight: bold; text-transform: uppercase;">Matrícula Activa</div>
            <div style="font-size: 18px; font-weight: 800; color: #1d4ed8;">${matTarget} Estudiantes</div>
          </div>
          <div style="background: #ecfeff; border: 1px solid #a5f3fc; border-radius: 8px; padding: 8px;">
            <div style="font-size: 9px; color: #155e75; font-weight: bold; text-transform: uppercase;">Vacantes Libres</div>
            <div style="font-size: 18px; font-weight: 800; color: #0891b2;">${vacTarget} Cupos</div>
          </div>
          <div style="background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 8px; padding: 8px;">
            <div style="font-size: 9px; color: #9d174d; font-weight: bold; text-transform: uppercase;">% Ocupación General</div>
            <div style="font-size: 18px; font-weight: 800; color: #be185d;">${pctTarget}%</div>
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
      filename: nombreArchivo,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'landscape' }
    };

    if (Swal) {
      Swal.fire({
        title: 'Generando Informe...',
        html: 'Preparando el informe oficial de infraestructura...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
    }

    html2pdf().set(opt).from(element).save().then(() => {
      if (Swal) Swal.close();
      auditar('Control de Estudios', 'Reporte Capacidad', `Generó informe de capacidad (${targetEscuela})`);
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
    <div className="modulo-animado container-fluid p-0 animate__animated animate__fadeIn">
      {/* 1. Miga de Pan Chamilo */}
      <ChamiloBreadcrumb
        items={[
          { label: 'Control de Estudios', url: '/categoria/Control%20de%20Estudios', icon: 'bi-folder-check' },
          { label: 'Grados y Salones', icon: 'bi-grid-3x3-gap-fill' }
        ]}
      />

      {/* 2. Guía de ayuda contextual Chamilo */}
      <ChamiloHelpCallout
        title="Orientación para la Gestión de Ambientes, Salones y Matrícula"
        storageKey="grados_salones"
      >
        <p className="mb-1">
          Este módulo le permite administrar la infraestructura académica: 1) Registre los <strong>Ambientes y Espacios Físicos</strong> con sus capacidades. 2) Aperture los <strong>Grados y Secciones</strong> vinculándolos a las aulas. 3) Asigne <strong>Docentes Guías</strong> y gestione la <strong>Matrícula Estudiantil</strong>. 4) Genere los <strong>Reportes Oficiales</strong> de ocupación y capacidad.
        </p>
      </ChamiloHelpCallout>

      {/* ── 3. CABECERA INSTITUCIONAL CHAMILO TECH ── */}
      <div 
        className="tech-card overflow-hidden mb-4 animate__animated animate__fadeInDown" 
        style={{ 
          border: '2px solid #bae6fd',
          borderTop: '6px solid #0284c7',
          background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 45%, #e0f2fe 100%)',
          borderRadius: '26px'
        }}
      >
        <div className="p-4 p-md-5">
          <div className="row align-items-center g-4">
            
            {/* Contenedor Dual: Icono Personalizado + Switcher Dual de Escuelas */}
            <div className="col-12 col-md-auto text-center text-md-start">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-3 flex-wrap">
                {/* Icono Tech Personalizado */}
                <div 
                  className="rounded-4 p-2 bg-white d-inline-flex align-items-center justify-content-center shadow-sm"
                  style={{
                    width: '95px',
                    height: '95px',
                    border: '2.5px solid #bae6fd',
                    boxShadow: '0 10px 24px rgba(2, 132, 199, 0.15)'
                  }}
                  title="Módulo de Grados y Salones"
                >
                  <IconoGradosSalones size={60} color="#0284c7" />
                </div>

                {/* Selector Dual Interactivo de Escuelas */}
                <div 
                  className="d-inline-flex align-items-center gap-2 p-2 bg-white rounded-4 border shadow-xs"
                  style={{ borderColor: '#bae6fd' }}
                >
                  {/* Switch Ambas / Todas si tiene acceso a ambas */}
                  {escuelasAutorizadas.length > 1 && (
                    <div 
                      onClick={() => { setEscuelaFiltro('todas'); setPaginaActualEspacios(1); }}
                      className={`rounded-3 p-1.5 border d-flex flex-column align-items-center justify-content-center transition-all ${
                        escuelaFiltro === 'todas' 
                          ? 'bg-info bg-opacity-15 border-info shadow-xs' 
                          : 'bg-white border-transparent opacity-60 hover-efecto'
                      }`}
                      style={{ width: '64px', height: '74px', cursor: 'pointer' }}
                      title="Ver ambas sedes consolidadas"
                    >
                      <i className="bi bi-building fs-3 text-info"></i>
                      <span className={`badge ${escuelaFiltro === 'todas' ? 'bg-info text-white' : 'bg-light text-muted'} extra-small mt-1 px-1.5 py-0`} style={{ fontSize: '0.60rem' }}>
                        Ambas {escuelaFiltro === 'todas' ? '●' : ''}
                      </span>
                    </div>
                  )}

                  {/* Switch SB */}
                  {(canSalonesSB || hasAccessSB_Esp || escuelasAutorizadas.includes('sb')) && (
                    <div 
                      onClick={() => { setEscuelaFiltro('sb'); setPaginaActualEspacios(1); }}
                      className={`rounded-3 p-1.5 border d-flex flex-column align-items-center justify-content-center transition-all ${
                        escuelaFiltro === 'sb' 
                          ? 'bg-success bg-opacity-10 border-success shadow-xs' 
                          : 'bg-white border-transparent opacity-60 hover-efecto'
                      }`}
                      style={{ width: '64px', height: '74px', cursor: 'pointer' }}
                      title="Filtrar por U.E. Santa Bárbara"
                    >
                      <img 
                        src="/assets/img/logo_sb.png" 
                        alt="UE Santa Bárbara" 
                        style={{ maxHeight: '38px', maxWidth: '38px', objectFit: 'contain' }}
                        onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                      />
                      <span className={`badge ${escuelaFiltro === 'sb' ? 'bg-success text-white' : 'bg-light text-muted'} extra-small mt-1 px-1.5 py-0`} style={{ fontSize: '0.62rem' }}>
                        SB {escuelaFiltro === 'sb' ? '●' : ''}
                      </span>
                    </div>
                  )}

                  {/* Switch LB */}
                  {(canSalonesLB || hasAccessLB_Esp || escuelasAutorizadas.includes('lb')) && (
                    <div 
                      onClick={() => { setEscuelaFiltro('lb'); setPaginaActualEspacios(1); }}
                      className={`rounded-3 p-1.5 border d-flex flex-column align-items-center justify-content-center transition-all ${
                        escuelaFiltro === 'lb' 
                          ? 'bg-primary bg-opacity-10 border-primary shadow-xs' 
                          : 'bg-white border-transparent opacity-60 hover-efecto'
                      }`}
                      style={{ width: '64px', height: '74px', cursor: 'pointer' }}
                      title="Filtrar por U.E. Libertador Bolívar"
                    >
                      <img 
                        src="/assets/img/logo_lb.png" 
                        alt="UE Libertador Bolívar" 
                        style={{ maxHeight: '38px', maxWidth: '38px', objectFit: 'contain' }}
                        onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                      />
                      <span className={`badge ${escuelaFiltro === 'lb' ? 'bg-primary text-white' : 'bg-light text-muted'} extra-small mt-1 px-1.5 py-0`} style={{ fontSize: '0.62rem' }}>
                        LB {escuelaFiltro === 'lb' ? '●' : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Título y Métricas Clave */}
            <div className="col-12 col-md text-center text-md-start">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-2 flex-wrap">
                <span 
                  className="badge text-white fw-bold px-3 py-1.5 rounded-pill shadow-xs d-inline-flex align-items-center gap-1.5"
                  style={{ backgroundColor: '#0284c7', fontSize: '0.78rem' }}
                >
                  <i className="bi bi-folder-check"></i>Control de Estudios & Aulas
                </span>

                <div 
                  className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill bg-white border shadow-xs"
                  style={{ borderColor: '#bae6fd' }}
                >
                  <span className="status-beacon-live" style={{ color: '#0284c7' }}></span>
                  <span 
                    className="extra-small fw-bold text-uppercase" 
                    style={{ fontSize: '0.72rem', color: '#0369a1', letterSpacing: '0.5px' }}
                  >
                    Campus Conectado &bull; {escuelaFiltro === 'todas' ? 'Ambas Sedes' : (escuelaFiltro === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar')}
                  </span>
                </div>

                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs" style={{ borderColor: '#bae6fd' }}>
                  <i className="bi bi-door-open-fill text-primary me-1"></i><b>{espacios.length}</b> Ambientes
                </span>
                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs" style={{ borderColor: '#bae6fd' }}>
                  <i className="bi bi-mortarboard-fill text-info me-1"></i><b>{salones.length}</b> Salones Aperturados
                </span>
                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs" style={{ borderColor: '#bae6fd' }}>
                  <i className="bi bi-people-fill text-success me-1"></i><b>{estudiantes.length}</b> Matrícula Activa
                </span>
              </div>

              <h1 className="fw-bolder mb-1.5 text-dark" style={{ fontSize: 'calc(1.5rem + 0.7vw)', letterSpacing: '-0.5px' }}>
                Gestión de Espacios, Salones y Matrícula
              </h1>

              <p className="mb-0 text-muted small" style={{ maxWidth: '820px' }}>
                Administración integral de ambientes físicos, capacidades de aulas, grados académicos, apertura de salones, docentes guías y control de matrícula estudiantil.
              </p>

              {/* Cinta de Telemetría Escolar Interactiva */}
              <div className="d-flex align-items-center gap-2 mt-3 flex-wrap">
                <div 
                  className="tech-pill-badge shadow-xs cursor-pointer" 
                  title="Capacidad Global Disponible"
                >
                  <i className="bi bi-building-check text-primary"></i>
                  <span className="font-monospace fw-bold text-dark">{capTotalGlobal} Cupos Instalados</span>
                </div>
                <div 
                  className="tech-pill-badge shadow-xs cursor-pointer" 
                  title="Salones activos"
                >
                  <i className="bi bi-grid-3x3-gap-fill text-info"></i>
                  <span className="text-secondary">{salones.length} Secciones Registradas</span>
                </div>
                <div 
                  className="tech-pill-badge shadow-xs cursor-pointer" 
                  title="Estado Operativo"
                >
                  <i className="bi bi-shield-fill-check text-success"></i>
                  <span className="text-secondary">100% Operativo</span>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="col-12 col-md-auto text-md-end text-center">
              <button
                type="button"
                onClick={() => navigate('/categoria/Control%20de%20Estudios')}
                className="btn btn-white bg-white border rounded-pill px-4 py-2 fw-bold text-dark d-inline-flex align-items-center gap-2 shadow-xs hover-efecto"
                style={{ fontSize: '0.84rem', borderColor: '#bae6fd' }}
              >
                <i className="bi bi-arrow-left text-primary"></i>
                <span>Volver al Menú</span>
              </button>
            </div>

          </div>
        </div>

        {/* ── BARRA CHAMILO: PESTAÑAS PRINCIPALES Y SELECTOR DE SEDE ── */}
        <div className="px-4 py-3 bg-light border-top d-flex justify-content-between align-items-center flex-wrap gap-3">
          
          {/* Pestañas Principales Chamilo */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('espacios')}
              className={`btn btn-xs rounded-pill px-3.5 py-1.5 fw-bold transition-all ${
                activeTab === 'espacios' 
                  ? 'btn-info text-white shadow-xs' 
                  : 'btn-white bg-white text-muted border hover-efecto'
              }`}
              style={{
                backgroundColor: activeTab === 'espacios' ? '#0284c7' : undefined,
                borderColor: activeTab === 'espacios' ? '#0284c7' : undefined,
                fontSize: '0.82rem'
              }}
            >
              <i className="bi bi-door-open-fill me-1.5"></i>1. Ambientes Físicos ({espacios.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('salones')}
              className={`btn btn-xs rounded-pill px-3.5 py-1.5 fw-bold transition-all ${
                activeTab === 'salones' 
                  ? 'btn-info text-white shadow-xs' 
                  : 'btn-white bg-white text-muted border hover-efecto'
              }`}
              style={{
                backgroundColor: activeTab === 'salones' ? '#0284c7' : undefined,
                borderColor: activeTab === 'salones' ? '#0284c7' : undefined,
                fontSize: '0.82rem'
              }}
            >
              <i className="bi bi-mortarboard-fill me-1.5"></i>2. Grados y Salones ({salones.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('matricula')}
              className={`btn btn-xs rounded-pill px-3.5 py-1.5 fw-bold transition-all ${
                activeTab === 'matricula' 
                  ? 'btn-info text-white shadow-xs' 
                  : 'btn-white bg-white text-muted border hover-efecto'
              }`}
              style={{
                backgroundColor: activeTab === 'matricula' ? '#0284c7' : undefined,
                borderColor: activeTab === 'matricula' ? '#0284c7' : undefined,
                fontSize: '0.82rem'
              }}
            >
              <i className="bi bi-people-fill me-1.5"></i>3. Docentes Guías y Matrícula ({estudiantes.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('especialistas')}
              className={`btn btn-xs rounded-pill px-3.5 py-1.5 fw-bold transition-all ${
                activeTab === 'especialistas' 
                  ? 'btn-info text-white shadow-xs' 
                  : 'btn-white bg-white text-muted border hover-efecto'
              }`}
              style={{
                backgroundColor: activeTab === 'especialistas' ? '#0284c7' : undefined,
                borderColor: activeTab === 'especialistas' ? '#0284c7' : undefined,
                fontSize: '0.82rem'
              }}
            >
              <i className="bi bi-journal-bookmark-fill me-1.5"></i>4. Especialistas y Responsabilidades ({responsabilidades.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reportes')}
              className={`btn btn-xs rounded-pill px-3.5 py-1.5 fw-bold transition-all ${
                activeTab === 'reportes' 
                  ? 'btn-info text-white shadow-xs' 
                  : 'btn-white bg-white text-muted border hover-efecto'
              }`}
              style={{
                backgroundColor: activeTab === 'reportes' ? '#0284c7' : undefined,
                borderColor: activeTab === 'reportes' ? '#0284c7' : undefined,
                fontSize: '0.82rem'
              }}
            >
              <i className="bi bi-bar-chart-line-fill me-1.5"></i>5. Capacidad y Reportes
            </button>
          </div>

          {/* Selector Superior de Sede */}
          <div className="d-flex align-items-center gap-1.5">
            <span className="extra-small fw-bold text-muted text-uppercase me-1">Sede Activa:</span>
            
            {escuelasAutorizadas.length > 1 && (
              <button
                type="button"
                onClick={() => setEscuelaFiltro('todas')}
                className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${
                  escuelaFiltro === 'todas' ? 'btn-dark text-white shadow-xs' : 'btn-white bg-white text-muted border'
                }`}
                style={{ fontSize: '0.78rem' }}
              >
                🏢 Todas las Sedes
              </button>
            )}

            {(canSalonesSB || hasAccessSB_Esp || escuelasAutorizadas.includes('sb')) && (
              <button
                type="button"
                onClick={() => setEscuelaFiltro('sb')}
                className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${
                  escuelaFiltro === 'sb' ? 'btn-success text-white shadow-xs' : 'btn-white bg-white text-muted border'
                }`}
                style={{ fontSize: '0.78rem' }}
              >
                🟢 UE Santa Bárbara
              </button>
            )}

            {(canSalonesLB || hasAccessLB_Esp || escuelasAutorizadas.includes('lb')) && (
              <button
                type="button"
                onClick={() => setEscuelaFiltro('lb')}
                className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${
                  escuelaFiltro === 'lb' ? 'btn-primary text-white shadow-xs' : 'btn-white bg-white text-muted border'
                }`}
                style={{ fontSize: '0.78rem' }}
              >
                🔵 UE Libertador Bolívar
              </button>
            )}
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

                      <div className="position-relative" style={{ minWidth: '180px', maxWidth: '240px' }}>
                        <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-2.5 text-muted small"></i>
                        <input 
                          type="text" 
                          className="form-control form-control-sm border-info rounded-pill ps-4 pe-4" 
                          placeholder="Buscar espacio..."
                          value={searchEspacios}
                          onChange={(e) => { setSearchEspacios(e.target.value); setPaginaActualEspacios(1); }}
                        />
                        {searchEspacios && (
                          <button 
                            type="button" 
                            className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-1 p-0 text-muted border-0"
                            onClick={() => { setSearchEspacios(''); setPaginaActualEspacios(1); }}
                            title="Limpiar búsqueda"
                          >
                            <i className="bi bi-x-circle-fill text-secondary small"></i>
                          </button>
                        )}
                      </div>
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

            {subTabSalones === 'apertura' && (
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <button 
                  className="btn btn-outline-secondary text-dark bg-white rounded-pill px-3.5 fw-bold shadow-xs hover-efecto"
                  onClick={() => abrirModalParametrizarSorpresa(Swal)}
                  title="Configurar tiempo, fechas y frecuencia de la notificación sorpresa"
                >
                  <i className="bi bi-sliders text-primary me-1.5"></i>Parametrizar Notificación
                </button>
                <button 
                  className="btn btn-outline-info text-dark bg-white rounded-pill px-3.5 fw-bold shadow-xs hover-efecto"
                  onClick={() => abrirModalProbarSonidos(Swal)}
                  title="Probar y escuchar los estilos de audio de bienvenida para el personal"
                >
                  <i className="bi bi-soundwave text-info me-1.5"></i>Probar Audios
                </button>
                <button 
                  className="btn btn-outline-warning text-dark bg-white rounded-pill px-3.5 fw-bold shadow-xs hover-efecto"
                  onClick={abrirSelectorPreviewSorpresa}
                  title="Ver cómo verá el docente su sorpresa de asignación"
                >
                  <i className="bi bi-stars text-warning me-1.5"></i>Previsualizar Sorpresa
                </button>
                {canCrearSalones && (
                  <button 
                    className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm hover-efecto"
                    onClick={() => abrirModalSalon()}
                  >
                    <i className="bi bi-plus-lg me-2"></i>Aperturar Nuevo Salón
                  </button>
                )}
              </div>
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
                  <div className="position-relative" style={{ minWidth: '200px', maxWidth: '260px' }}>
                    <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-2.5 text-muted small"></i>
                    <input 
                      type="text" 
                      className="form-control form-control-sm border-info rounded-pill ps-4 pe-4"
                      placeholder="Buscar salón..."
                      value={searchSalones}
                      onChange={(e) => setSearchSalones(e.target.value)}
                    />
                    {searchSalones && (
                      <button 
                        type="button" 
                        className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-1 p-0 text-muted border-0"
                        onClick={() => setSearchSalones('')}
                        title="Limpiar búsqueda"
                      >
                        <i className="bi bi-x-circle-fill text-secondary small"></i>
                      </button>
                    )}
                  </div>
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
                              <td className="text-center" style={{ minWidth: '160px' }}>
                                <div className="d-flex justify-content-between align-items-center mb-1 small">
                                  <span className="fw-bold text-dark">{estsCount} / {cap}</span>
                                  <span className={`badge rounded-pill ${cap > 0 && estsCount >= cap ? 'bg-danger text-white' : estsCount > (cap * 0.8) ? 'bg-warning text-dark' : 'bg-success text-white'}`} style={{ fontSize: '0.7rem' }}>
                                    {cap > 0 ? `${Math.round((estsCount / cap) * 100)}%` : '0%'}
                                  </span>
                                </div>
                                <div className="progress" style={{ height: '6px' }}>
                                  <div 
                                    className={`progress-bar ${cap > 0 && estsCount >= cap ? 'bg-danger' : estsCount > (cap * 0.8) ? 'bg-warning' : 'bg-success'}`}
                                    role="progressbar" 
                                    style={{ width: `${cap > 0 ? Math.min(100, (estsCount / cap) * 100) : 0}%` }}
                                  ></div>
                                </div>
                              </td>
                              <td className="text-center">
                                <span className={`badge rounded-pill px-3 py-1.5 fw-bold ${cap > 0 && estsCount >= cap ? 'bg-danger text-white' : estsCount > (cap * 0.8) ? 'bg-warning text-dark' : 'bg-primary text-white'}`}>
                                  {estsCount} Estudiantes
                                </span>
                              </td>
                              <td className="text-end pe-4">
                                <div className="btn-group btn-group-sm">
                                  <button 
                                    className="btn btn-outline-info rounded-start-pill"
                                    onClick={() => {
                                      setSalonSeleccionadoId(sal.id_salon);
                                      setActiveTab('matricula');
                                    }}
                                    title="Ver nómina de estudiantes del salón"
                                  >
                                    <i className="bi bi-people-fill me-1"></i> Nómina
                                  </button>
                                  <button 
                                    className="btn btn-outline-primary"
                                    onClick={() => abrirModalSalon(sal)}
                                    title="Editar salón"
                                  >
                                    <i className="bi bi-pencil-fill"></i>
                                  </button>
                                  <button 
                                    className="btn btn-outline-danger rounded-end-pill"
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
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="fw-bold text-dark m-0">
                    <i className="bi bi-door-open-fill text-primary me-2"></i>Seleccionar Salón
                  </h5>
                  <span className="badge bg-light text-muted border rounded-pill">{salonesFiltrados.length} salones</span>
                </div>
                <p className="small text-muted mb-3">Haga clic en un salón para ver su lista de estudiantes y su docente guía.</p>

                {/* Filtro por Escuela en Matrícula */}
                <div className="btn-group w-100 mb-3 shadow-sm rounded-pill p-1 bg-light border" role="group">
                  <button 
                    type="button" 
                    className={`btn btn-sm rounded-pill fw-bold ${escuelaFiltro === 'todas' ? 'btn-primary text-white shadow-sm' : 'btn-light text-dark'}`}
                    onClick={() => setEscuelaFiltro('todas')}
                  >
                    Todas ({salones.length})
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-sm rounded-pill fw-bold ${escuelaFiltro === 'sb' ? 'btn-info text-dark shadow-sm' : 'btn-light text-dark'}`}
                    onClick={() => setEscuelaFiltro('sb')}
                  >
                    Santa Bárbara ({salones.filter(s => s.id_escuela === 'sb').length})
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-sm rounded-pill fw-bold ${escuelaFiltro === 'lb' ? 'btn-primary text-white shadow-sm' : 'btn-light text-dark'}`}
                    onClick={() => setEscuelaFiltro('lb')}
                  >
                    Libertador Bolívar ({salones.filter(s => s.id_escuela === 'lb').length})
                  </button>
                </div>

                {/* Buscador de Salones */}
                <div className="mb-3 position-relative">
                  <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted small"></i>
                  <input 
                    type="text" 
                    className="form-control form-control-sm border-info rounded-pill ps-4 pe-4"
                    placeholder="Buscar por grado, sección o nombre..."
                    value={searchSalones}
                    onChange={(e) => setSearchSalones(e.target.value)}
                  />
                  {searchSalones && (
                    <button 
                      type="button" 
                      className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-2 p-0 text-muted border-0"
                      onClick={() => setSearchSalones('')}
                      title="Limpiar búsqueda"
                    >
                      <i className="bi bi-x-circle-fill text-secondary small"></i>
                    </button>
                  )}
                </div>

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

                      {/* Botones de Acción y Descarga */}
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <button 
                          className="btn btn-sm btn-info text-white rounded-pill fw-bold shadow-sm hover-efecto"
                          onClick={() => abrirModalVincularEstudiantesMasivo(salonActivo)}
                          title="Asignar y vincular estudiantes masivamente a este salón"
                        >
                          <i className="bi bi-person-plus-fill me-1"></i>Vincular Estudiantes
                        </button>
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
                          <i className="bi bi-file-earmark-pdf-fill me-1"></i>Descargar PDF
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
                    <div className="p-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <h6 className="fw-bold text-dark m-0">Nómina de Estudiantes ({estudiantesSalonActivo.length})</h6>
                      <div className="position-relative" style={{ minWidth: '220px', maxWidth: '280px' }}>
                        <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-2.5 text-muted small"></i>
                        <input 
                          type="text" 
                          className="form-control form-control-sm border-info rounded-pill ps-4 pe-4"
                          placeholder="Buscar por cédula o nombre..."
                          value={searchEstudiantes}
                          onChange={(e) => setSearchEstudiantes(e.target.value)}
                        />
                        {searchEstudiantes && (
                          <button 
                            type="button" 
                            className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-1 p-0 text-muted border-0"
                            onClick={() => setSearchEstudiantes('')}
                            title="Limpiar búsqueda"
                          >
                            <i className="bi bi-x-circle-fill text-secondary small"></i>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Barra de Acciones Masivas en Nómina */}
                    {seleccionadosMatricula.length > 0 && (
                      <div className="alert alert-warning border-0 shadow-sm d-flex justify-content-between align-items-center flex-wrap gap-2 m-3 py-2 px-3 rounded-4 animate__animated animate__fadeIn">
                        <span className="badge bg-warning text-dark rounded-pill px-3 py-2 fw-bold fs-6">
                          <i className="bi bi-check2-square me-1"></i> {seleccionadosMatricula.length} estudiantes seleccionados
                        </span>
                        <div className="d-flex align-items-center gap-2">
                          <button 
                            className="btn btn-sm btn-danger rounded-pill px-3 fw-bold shadow-sm"
                            onClick={() => handleDesvincularMasivo(salonActivo)}
                          >
                            <i className="bi bi-person-dash-fill me-1"></i> Desvincular del Salón ({seleccionadosMatricula.length})
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th style={{ width: '40px' }} className="text-center">
                              <input 
                                type="checkbox" 
                                className="form-check-input"
                                checked={estudiantesSalonActivo.length > 0 && estudiantesSalonActivo.every(e => seleccionadosMatricula.includes(e.id || e.cedula_estudiante))}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const ids = estudiantesSalonActivo.map(x => x.id || x.cedula_estudiante);
                                    setSeleccionadosMatricula(Array.from(new Set([...seleccionadosMatricula, ...ids])));
                                  } else {
                                    const idsActuales = estudiantesSalonActivo.map(x => x.id || x.cedula_estudiante);
                                    setSeleccionadosMatricula(seleccionadosMatricula.filter(id => !idsActuales.includes(id)));
                                  }
                                }}
                              />
                            </th>
                            <th style={{ width: '35px' }} className="text-center">#</th>
                            <th>Nombres y Apellidos</th>
                            <th>Cédula / C.E.</th>
                            <th>C.I. Representante</th>
                            <th className="text-center">Estatus</th>
                            <th className="text-end pe-4">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {estudiantesSalonActivo.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-5 text-muted">
                                <i className="bi bi-person-x fs-2 d-block mb-2"></i>
                                No hay estudiantes inscritos o vinculados en este salón.
                                <div className="mt-2">
                                  <button 
                                    className="btn btn-sm btn-info text-white rounded-pill px-3 fw-bold"
                                    onClick={() => abrirModalVincularEstudiantesMasivo(salonActivo)}
                                  >
                                    <i className="bi bi-person-plus-fill me-1"></i>Vincular Estudiantes Ahora
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            estudiantesSalonActivo.map((est, idx) => {
                              const rowId = est.id || est.cedula_estudiante;
                              const isChecked = seleccionadosMatricula.includes(rowId);

                              return (
                                <tr key={est.cedula_estudiante} className={isChecked ? 'table-info' : ''}>
                                  <td className="text-center">
                                    <input 
                                      type="checkbox" 
                                      className="form-check-input"
                                      checked={isChecked}
                                      onChange={() => {
                                        setSeleccionadosMatricula(prev => 
                                          prev.includes(rowId) ? prev.filter(x => x !== rowId) : [...prev, rowId]
                                        );
                                      }}
                                    />
                                  </td>
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
                                    <div className="btn-group btn-group-sm">
                                      <button 
                                        className="btn btn-outline-primary"
                                        onClick={() => handleReasignarEstudiante(est)}
                                        title="Mover a otra sección"
                                      >
                                        <i className="bi bi-arrow-left-right me-1"></i>Mover
                                      </button>
                                      <button 
                                        className="btn btn-outline-danger"
                                        onClick={() => handleDesvincularEstudiante(est, salonActivo)}
                                        title="Desvincular de este salón"
                                      >
                                        <i className="bi bi-person-dash"></i>
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
      {/* PESTAÑA 4: ESPECIALISTAS Y OTRAS RESPONSABILIDADES        */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'especialistas' && (
        <div className="animate__animated animate__fadeIn">
          {/* Header de Especialistas */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
            <div>
              <h4 className="fw-bold text-dark m-0">
                <i className="bi bi-journal-bookmark-fill text-primary me-2"></i>Directorio de Especialistas y Áreas de Formación
              </h4>
              <p className="text-muted small m-0">
                Asignación de docentes especialistas por área (Castellano, Inglés, Educación Física, etc.), niveles educativos y grados atendidos para el año escolar <b>2026 - 2027</b>.
              </p>
            </div>

            {/* Acciones Rápidas */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button 
                className="btn btn-outline-primary bg-white rounded-pill px-3.5 fw-bold shadow-xs hover-efecto"
                onClick={() => generarReporteEspecialistasPDF(escuelaFiltro)}
                title="Descargar nómina de especialistas en PDF"
              >
                <i className="bi bi-file-earmark-pdf-fill text-danger me-1.5"></i>Descargar Nómina (PDF)
              </button>
              <button 
                className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm hover-efecto"
                onClick={() => abrirModalNuevaEspecialidad()}
              >
                <i className="bi bi-plus-lg me-2"></i>Asignar Nueva Especialidad
              </button>
            </div>
          </div>

          {/* Tarjetas de Resumen */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card p-3 border-0 shadow-sm rounded-4 text-white h-100" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}>
                <span className="small fw-bold opacity-75">Especialidades Registradas</span>
                <h3 className="fw-bold m-0 mt-1">{responsabilidades.length} Áreas</h3>
                <div className="small opacity-90 mt-1">Carga académica especializada</div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card p-3 border-0 shadow-sm rounded-4 text-white h-100" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}>
                <span className="small fw-bold opacity-75">Docentes Especialistas</span>
                <h3 className="fw-bold m-0 mt-1">
                  {new Set(responsabilidades.flatMap(r => r.docentes_asignados)).size} Docentes
                </h3>
                <div className="small opacity-90 mt-1">Personal con asignaciones activas</div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card p-3 border-0 shadow-sm rounded-4 text-white h-100" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}>
                <span className="small fw-bold opacity-75">Total Horas Semanales</span>
                <h3 className="fw-bold m-0 mt-1">
                  {responsabilidades.reduce((acc, r) => acc + (Number(r.horas_semanales) || 0), 0)} Horas
                </h3>
                <div className="small opacity-90 mt-1">Planificación horaria consolidada</div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="card p-3 border-0 shadow-sm rounded-4 text-white h-100" style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' }}>
                <span className="small fw-bold opacity-75">Año Escolar Activo</span>
                <h3 className="fw-bold m-0 mt-1">2026 - 2027</h3>
                <div className="small opacity-90 mt-1">Período Institucional</div>
              </div>
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="card bg-white shadow-sm border-0 rounded-4 p-3 mb-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {/* Filtro por Escuela */}
                <div className="btn-group shadow-xs rounded-pill p-1 bg-light border" role="group">
                  <button 
                    type="button" 
                    className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${escuelaFiltro === 'todas' ? 'btn-success text-white shadow-xs' : 'btn-light text-dark'}`}
                    onClick={() => setEscuelaFiltro('todas')}
                  >
                    Todas las Sedes
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${escuelaFiltro === 'sb' ? 'btn-info text-dark shadow-xs' : 'btn-light text-dark'}`}
                    onClick={() => setEscuelaFiltro('sb')}
                  >
                    U.E. Santa Bárbara
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${escuelaFiltro === 'lb' ? 'btn-primary text-white shadow-xs' : 'btn-light text-dark'}`}
                    onClick={() => setEscuelaFiltro('lb')}
                  >
                    U.E. Libertador Bolívar
                  </button>
                </div>

                {/* Filtro por Nivel Educativo */}
                <select 
                  className="form-select form-select-sm border-info rounded-pill fw-bold text-dark w-auto"
                  value={filtroNivelEspecialistas}
                  onChange={(e) => setFiltroNivelEspecialistas(e.target.value)}
                >
                  <option value="todos">🎓 Todos los Niveles</option>
                  <option value="Educación Primaria">Educación Primaria</option>
                  <option value="Educación Media General">Educación Media General</option>
                  <option value="Educación Inicial">Educación Inicial</option>
                  <option value="Educación Media Técnica">Educación Media Técnica</option>
                </select>
              </div>

              {/* Buscador */}
              <div className="d-flex align-items-center gap-2">
                <div className="position-relative" style={{ minWidth: '240px', maxWidth: '320px' }}>
                  <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-2.5 text-muted small"></i>
                  <input 
                    type="text" 
                    className="form-control form-control-sm border-info rounded-pill ps-4 pe-4"
                    placeholder="Buscar especialidad, grado o docente..."
                    value={searchEspecialistas}
                    onChange={(e) => setSearchEspecialistas(e.target.value)}
                  />
                  {searchEspecialistas && (
                    <button 
                      type="button" 
                      className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-1 p-0 text-muted border-0"
                      onClick={() => setSearchEspecialistas('')}
                      title="Limpiar búsqueda"
                    >
                      <i className="bi bi-x-circle-fill text-secondary small"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabla y Listado de Especialistas */}
          <div className="card bg-white shadow-sm border-0 rounded-4 overflow-hidden">
            <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="fw-bold text-dark m-0">
                <i className="bi bi-list-check text-primary me-2"></i>Nómina de Responsabilidades y Docentes Asignados
              </h5>
              <span className="badge bg-light text-muted border rounded-pill px-3 py-1.5 extra-small fw-bold">
                Mostrando {responsabilidades.filter(r => {
                  const matchEscuela = escuelaFiltro === 'todas' || r.id_escuela === escuelaFiltro;
                  const matchNivel = filtroNivelEspecialistas === 'todos' || r.nivel_educativo === filtroNivelEspecialistas;
                  if (!matchEscuela || !matchNivel) return false;
                  if (searchEspecialistas) {
                    const q = searchEspecialistas.toLowerCase();
                    const nom = (r.nombre_responsabilidad || '').toLowerCase();
                    const niv = (r.nivel_educativo || '').toLowerCase();
                    const gra = (r.grados_atendidos || []).join(' ').toLowerCase();
                    const docs = (r.docentes_asignados || []).join(' ');
                    return nom.includes(q) || niv.includes(q) || gra.includes(q) || docs.includes(q);
                  }
                  return true;
                }).length} registros
              </span>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">Plantel</th>
                      <th>Especialidad / Responsabilidad</th>
                      <th>Nivel Educativo</th>
                      <th>Grados / Años Atendidos</th>
                      <th>Docente(s) Encargado(s)</th>
                      <th className="text-center">Carga Horaria</th>
                      <th className="text-end pe-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const listaFiltrada = responsabilidades.filter(r => {
                        const matchEscuela = escuelaFiltro === 'todas' || r.id_escuela === escuelaFiltro;
                        const matchNivel = filtroNivelEspecialistas === 'todos' || r.nivel_educativo === filtroNivelEspecialistas;
                        if (!matchEscuela || !matchNivel) return false;

                        if (searchEspecialistas) {
                          const q = searchEspecialistas.toLowerCase();
                          const nom = (r.nombre_responsabilidad || '').toLowerCase();
                          const niv = (r.nivel_educativo || '').toLowerCase();
                          const gra = (r.grados_atendidos || []).join(' ').toLowerCase();
                          const docs = (r.docentes_asignados || []).join(' ');
                          return nom.includes(q) || niv.includes(q) || gra.includes(q) || docs.includes(q);
                        }
                        return true;
                      });

                      if (listaFiltrada.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} className="text-center py-5 text-muted">
                              <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                              No se encontraron especialidades registradas con los filtros seleccionados.
                              <div className="mt-2">
                                <button 
                                  className="btn btn-sm btn-primary rounded-pill px-3 fw-bold"
                                  onClick={() => abrirModalNuevaEspecialidad()}
                                >
                                  <i className="bi bi-plus-lg me-1"></i>Registrar Primera Especialidad
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return listaFiltrada.map(resp => {
                        return (
                          <tr key={resp.id_responsabilidad}>
                            <td className="ps-4">
                              <span className={`badge rounded-pill ${resp.id_escuela === 'sb' ? 'bg-info text-dark' : 'bg-primary text-white'}`}>
                                {resp.id_escuela === 'sb' ? 'Santa Bárbara' : 'Libertador Bolívar'}
                              </span>
                            </td>
                            <td>
                              <div className="fw-bold text-dark fs-6 d-flex align-items-center gap-1.5">
                                <i className="bi bi-award-fill text-primary"></i>
                                {resp.nombre_responsabilidad}
                              </div>
                              <div className="extra-small text-muted">{resp.categoria}</div>
                            </td>
                            <td>
                              <span className="badge bg-light text-dark border fw-bold">
                                {resp.nivel_educativo}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-1 flex-wrap">
                                {resp.grados_atendidos && resp.grados_atendidos.length > 0 ? (
                                  resp.grados_atendidos.map((g, gIdx) => (
                                    <span key={gIdx} className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2 py-0.5 extra-small">
                                      {g}
                                    </span>
                                  ))
                                ) : (
                                  <span className="badge bg-light text-muted border extra-small">Todos los Grados</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="d-flex flex-column gap-1">
                                {resp.docentes_asignados && resp.docentes_asignados.length > 0 ? (
                                  resp.docentes_asignados.map(ci => {
                                    const doc = docentes.find(d => d.cedula === ci);
                                    return (
                                      <div key={ci} className="d-flex align-items-center gap-1.5">
                                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2.5 py-1 extra-small fw-bold">
                                          <i className="bi bi-person-check-fill me-1"></i>
                                          {doc ? doc.nombre_completo : `C.I. ${ci}`}
                                        </span>
                                        <button
                                          type="button"
                                          className="btn btn-xs btn-outline-warning border-0 p-0 text-warning"
                                          onClick={() => {
                                            setPreviewDocenteCedula(ci);
                                            setMostrarPreviewSorpresa(true);
                                          }}
                                          title={`Ver sorpresa de asignación para ${doc?.nombre_completo || ci}`}
                                        >
                                          <i className="bi bi-stars"></i>
                                        </button>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <span className="text-muted extra-small fst-italic">Sin docente asignado</span>
                                )}
                              </div>
                            </td>
                            <td className="text-center">
                              <span className="badge bg-light text-dark border rounded-pill px-2.5 py-1 fw-bold">
                                <i className="bi bi-clock-history me-1 text-primary"></i>
                                {resp.horas_semanales || 0} hrs/sem
                              </span>
                            </td>
                            <td className="text-end pe-4">
                              <div className="btn-group btn-group-sm">
                                <button 
                                  className="btn btn-outline-primary rounded-start-pill"
                                  onClick={() => abrirModalNuevaEspecialidad(resp)}
                                  title="Editar esta especialidad"
                                >
                                  <i className="bi bi-pencil-square"></i>
                                </button>
                                <button 
                                  className="btn btn-outline-danger rounded-end-pill"
                                  onClick={() => handleEliminarEspecialidad(resp)}
                                  title="Eliminar especialidad"
                                >
                                  <i className="bi bi-trash-fill"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* PESTAÑA 5: CAPACIDAD INSTALADA Y REPORTES                 */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'reportes' && (
        <div className="animate__animated animate__fadeIn">
          {/* Header de Reportes y Filtro por Plantel */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
            <div>
              <h4 className="fw-bold text-dark m-0">
                <i className="bi bi-bar-chart-line-fill text-success me-2"></i>Informe de Infraestructura y Capacidad Instalada
              </h4>
              <p className="text-muted small m-0">Supervisión de cupos instalados vs. matrícula ocupada por plantel escolar.</p>
            </div>

            {/* Botones de Descarga PDF */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button 
                className="btn btn-success rounded-pill px-4 fw-bold shadow-sm hover-efecto"
                onClick={() => generarReporteCapacidadGlobalPDF(escuelaFiltro)}
                title="Descargar informe oficial en PDF según el filtro activo"
              >
                <i className="bi bi-file-earmark-pdf-fill me-2"></i>
                Descargar Informe {escuelaFiltro === 'todas' ? 'Consolidado' : escuelaFiltro === 'sb' ? 'Santa Bárbara' : 'Libertador Bolívar'} (PDF)
              </button>
            </div>
          </div>

          {/* Selector / Pills de Filtro por Escuela */}
          <div className="card bg-white shadow-sm border-0 rounded-4 p-3 mb-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-flex align-items-center gap-2">
                <span className="small fw-bold text-muted text-uppercase">
                  <i className="bi bi-building me-1"></i>Filtrar Plantel:
                </span>
                <div className="btn-group shadow-sm rounded-pill p-1 bg-light border" role="group">
                  <button 
                    type="button" 
                    className={`btn btn-sm rounded-pill px-3 fw-bold ${escuelaFiltro === 'todas' ? 'btn-success text-white shadow-sm' : 'btn-light text-dark'}`}
                    onClick={() => setEscuelaFiltro('todas')}
                  >
                    Todas las Escuelas ({espacios.length} Ambientes)
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-sm rounded-pill px-3 fw-bold ${escuelaFiltro === 'sb' ? 'btn-info text-dark shadow-sm' : 'btn-light text-dark'}`}
                    onClick={() => setEscuelaFiltro('sb')}
                  >
                    U.E. Santa Bárbara ({espacios.filter(e => e.id_escuela === 'sb').length} Ambientes)
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-sm rounded-pill px-3 fw-bold ${escuelaFiltro === 'lb' ? 'btn-primary text-white shadow-sm' : 'btn-light text-dark'}`}
                    onClick={() => setEscuelaFiltro('lb')}
                  >
                    U.E. Libertador Bolívar ({espacios.filter(e => e.id_escuela === 'lb').length} Ambientes)
                  </button>
                </div>
              </div>

              {/* Botones de Descarga Directa por Plantel */}
              <div className="btn-group btn-group-sm">
                <button 
                  className="btn btn-outline-info rounded-start-pill fw-bold"
                  onClick={() => generarReporteCapacidadGlobalPDF('sb')}
                  title="Descargar solo informe de Santa Bárbara"
                >
                  <i className="bi bi-download me-1"></i>PDF Santa Bárbara
                </button>
                <button 
                  className="btn btn-outline-primary rounded-end-pill fw-bold"
                  onClick={() => generarReporteCapacidadGlobalPDF('lb')}
                  title="Descargar solo informe de Libertador Bolívar"
                >
                  <i className="bi bi-download me-1"></i>PDF Libertador Bolívar
                </button>
              </div>
            </div>
          </div>

          {/* Tarjetas Comparativas de Métricas Dinámicas */}
          {escuelaFiltro === 'todas' ? (
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
          ) : escuelaFiltro === 'sb' ? (
            <div className="row g-3 mb-4">
              <div className="col-12 col-md-3">
                <div className="card p-3 border-0 shadow-sm rounded-4 text-white" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}>
                  <span className="small fw-bold opacity-75">Capacidad Santa Bárbara</span>
                  <h3 className="fw-bold m-0 mt-1">{capTotalSB} Cupos</h3>
                  <div className="small opacity-90 mt-1">{espacios.filter(e => e.id_escuela === 'sb').length} Ambientes Físicos</div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="card p-3 border-0 shadow-sm rounded-4 text-white" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}>
                  <span className="small fw-bold opacity-75">Matrícula Activa SB</span>
                  <h3 className="fw-bold m-0 mt-1">{matTotalSB} Estudiantes</h3>
                  <div className="small opacity-90 mt-1">{salones.filter(s => s.id_escuela === 'sb').length} Salones Aperturados</div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="card p-3 border-0 shadow-sm rounded-4 text-white" style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' }}>
                  <span className="small fw-bold opacity-75">Vacantes Disponibles</span>
                  <h3 className="fw-bold m-0 mt-1">{Math.max(0, capTotalSB - matTotalSB)} Cupos</h3>
                  <div className="small opacity-90 mt-1">Disponibilidad en Santa Bárbara</div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="card p-3 border-0 shadow-sm rounded-4 text-white" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' }}>
                  <span className="small fw-bold opacity-75">% Ocupación General</span>
                  <h3 className="fw-bold m-0 mt-1">{capTotalSB > 0 ? Math.round((matTotalSB / capTotalSB) * 100) : 0}%</h3>
                  <div className="small opacity-90 mt-1">Uso de infraestructura instalada</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="row g-3 mb-4">
              <div className="col-12 col-md-3">
                <div className="card p-3 border-0 shadow-sm rounded-4 text-white" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}>
                  <span className="small fw-bold opacity-75">Capacidad Libertador Bolívar</span>
                  <h3 className="fw-bold m-0 mt-1">{capTotalLB} Cupos</h3>
                  <div className="small opacity-90 mt-1">{espacios.filter(e => e.id_escuela === 'lb').length} Ambientes Físicos</div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="card p-3 border-0 shadow-sm rounded-4 text-white" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}>
                  <span className="small fw-bold opacity-75">Matrícula Activa LB</span>
                  <h3 className="fw-bold m-0 mt-1">{matTotalLB} Estudiantes</h3>
                  <div className="small opacity-90 mt-1">{salones.filter(s => s.id_escuela === 'lb').length} Salones Aperturados</div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="card p-3 border-0 shadow-sm rounded-4 text-white" style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' }}>
                  <span className="small fw-bold opacity-75">Vacantes Disponibles</span>
                  <h3 className="fw-bold m-0 mt-1">{Math.max(0, capTotalLB - matTotalLB)} Cupos</h3>
                  <div className="small opacity-90 mt-1">Disponibilidad en Libertador Bolívar</div>
                </div>
              </div>
              <div className="col-12 col-md-3">
                <div className="card p-3 border-0 shadow-sm rounded-4 text-white" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)' }}>
                  <span className="small fw-bold opacity-75">% Ocupación General</span>
                  <h3 className="fw-bold m-0 mt-1">{capTotalLB > 0 ? Math.round((matTotalLB / capTotalLB) * 100) : 0}%</h3>
                  <div className="small opacity-90 mt-1">Uso de infraestructura instalada</div>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de Capacidad por Ambiente y Salón */}
          <div className="card bg-white shadow-sm border-0 rounded-4 overflow-hidden">
            <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
              <h5 className="fw-bold text-dark m-0">
                <i className="bi bi-table text-primary me-2"></i>Desglose de Ocupación por Ambiente y Salón
              </h5>
              <div className="d-flex align-items-center gap-2">
                <input 
                  type="text" 
                  className="form-control form-control-sm border-info rounded-pill"
                  placeholder="🔍 Buscar ambiente, tipo o salón..."
                  value={searchReportes}
                  onChange={(e) => setSearchReportes(e.target.value)}
                  style={{ maxWidth: '260px' }}
                />
              </div>
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
                    {(() => {
                      const espaciosFiltradosTabla = espacios.filter(esp => {
                        const matchEscuela = escuelaFiltro === 'todas' || esp.id_escuela === escuelaFiltro;
                        if (!matchEscuela) return false;

                        if (searchReportes) {
                          const q = searchReportes.toLowerCase();
                          const nom = (esp.nombre || '').toLowerCase();
                          const tip = (esp.tipo || '').toLowerCase();
                          const sal = salones.find(s => s.id_espacio === esp.id);
                          const salNom = (sal?.nombre_salon || '').toLowerCase();
                          return nom.includes(q) || tip.includes(q) || salNom.includes(q);
                        }
                        return true;
                      });

                      if (espaciosFiltradosTabla.length === 0) {
                        return (
                          <tr>
                            <td colSpan={8} className="text-center py-5 text-muted">
                              <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                              No se encontraron ambientes escolares con los filtros aplicados.
                            </td>
                          </tr>
                        );
                      }

                      return espaciosFiltradosTabla.map(esp => {
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
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL: REGISTRAR / EDITAR ESPECIALIDAD                     */}
      {/* ────────────────────────────────────────────────────────── */}
      {mostrarModalEspecialidad && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', zIndex: 1055, backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
              <div className="modal-header bg-primary text-white p-4 border-0">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-award-fill me-2"></i>
                  {editandoEspecialidadId ? 'Editar Especialidad / Responsabilidad' : 'Asignar Nueva Especialidad / Responsabilidad'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => { setMostrarModalEspecialidad(false); setEditandoEspecialidadId(null); }}
                ></button>
              </div>

              <form onSubmit={handleGuardarEspecialidad}>
                <div className="modal-body p-4" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                  <div className="row g-3">
                    
                    {/* Plantel */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-muted">Plantel / Escuela</label>
                      <select 
                        className="form-select border-info rounded-pill"
                        value={formEspecialidad.id_escuela}
                        onChange={(e) => setFormEspecialidad({ ...formEspecialidad, id_escuela: e.target.value })}
                        required
                      >
                        {escuelasAutorizadas.includes('sb') && <option value="sb">U.E. Santa Bárbara</option>}
                        {escuelasAutorizadas.includes('lb') && <option value="lb">U.E. Libertador Bolívar</option>}
                      </select>
                    </div>

                    {/* Categoría */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-muted">Categoría de la Asignación</label>
                      <select 
                        className="form-select border-info rounded-pill"
                        value={formEspecialidad.categoria}
                        onChange={(e) => setFormEspecialidad({ ...formEspecialidad, categoria: e.target.value })}
                      >
                        <option value="Área de Formación / Especialista">Área de Formación / Especialista</option>
                        <option value="Acompañamiento Pedagógico">Acompañamiento Pedagógico</option>
                        <option value="Coordinación Pedagógica">Coordinación Pedagógica</option>
                        <option value="Comité / Colectivo Pedagógico">Comité / Colectivo Pedagógico</option>
                      </select>
                    </div>

                    {/* Nombre de la Especialidad con Sugerencias Rápidas */}
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted d-flex justify-content-between align-items-center">
                        <span>Nombre de la Especialidad / Asignatura:</span>
                        <span className="extra-small text-primary">Haz clic en una sugerencia rápida:</span>
                      </label>
                      <input 
                        type="text"
                        className="form-control border-info rounded-pill mb-2"
                        placeholder="Ej: Especialista de Castellano, Especialista de Inglés, Educación Física..."
                        value={formEspecialidad.nombre_responsabilidad}
                        onChange={(e) => setFormEspecialidad({ ...formEspecialidad, nombre_responsabilidad: e.target.value })}
                        required
                      />

                      {/* Pastillas de Sugerencias */}
                      <div className="d-flex flex-wrap gap-1.5 p-2.5 bg-light rounded-3 border">
                        {ESPECIALIDADES_SUGERIDAS.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            className="btn btn-xs btn-white bg-white text-dark border rounded-pill px-2.5 py-1 shadow-xs hover-efecto"
                            style={{ fontSize: '0.74rem' }}
                            onClick={() => setFormEspecialidad({ ...formEspecialidad, nombre_responsabilidad: sug })}
                          >
                            + {sug}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Nivel Educativo */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-muted">Nivel Educativo al que Aplica</label>
                      <select 
                        className="form-select border-info rounded-pill"
                        value={formEspecialidad.nivel_educativo}
                        onChange={(e) => {
                          const nuevoNivel = e.target.value;
                          setFormEspecialidad({ 
                            ...formEspecialidad, 
                            nivel_educativo: nuevoNivel,
                            grados_atendidos: [] // Reiniciar para que seleccione acordes al nivel
                          });
                        }}
                        required
                      >
                        <option value="Educación Media General">Educación Media General (1er a 5to Año)</option>
                        <option value="Educación Primaria">Educación Primaria (1er a 6to Grado)</option>
                        <option value="Educación Inicial">Educación Inicial / Preescolar</option>
                        <option value="Educación Media Técnica">Educación Media Técnica (1er a 6to Año)</option>
                        <option value="Todos los Niveles">Todos los Niveles de la Institución</option>
                      </select>
                    </div>

                    {/* Carga Horaria Semanal */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-bold text-muted">Carga Horaria Semanal (Horas)</label>
                      <input 
                        type="number"
                        min="1"
                        max="60"
                        className="form-control border-info rounded-pill"
                        value={formEspecialidad.horas_semanales}
                        onChange={(e) => setFormEspecialidad({ ...formEspecialidad, horas_semanales: Number(e.target.value) || 0 })}
                        required
                      />
                    </div>

                    {/* Grados / Años Atendidos (Selección Múltiple con Checkboxes) */}
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label small fw-bold text-muted mb-0">
                          <i className="bi bi-mortarboard-fill me-1 text-primary"></i>Grados / Años que Atiende:
                        </label>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-xs btn-link p-0 text-primary text-decoration-none fw-bold"
                            onClick={() => {
                              // Determinar lista de grados según nivel
                              let todos: string[] = [];
                              if (formEspecialidad.nivel_educativo === 'Educación Media General') {
                                todos = ['1er Año', '2do Año', '3er Año', '4to Año', '5to Año'];
                              } else if (formEspecialidad.nivel_educativo === 'Educación Primaria') {
                                todos = ['1er Grado', '2do Grado', '3er Grado', '4to Grado', '5to Grado', '6to Grado'];
                              } else if (formEspecialidad.nivel_educativo === 'Educación Inicial') {
                                todos = ['Maternal', '1er Grupo', '2do Grupo', '3er Grupo'];
                              } else {
                                todos = grados.map(g => g.valor);
                              }
                              setFormEspecialidad({ ...formEspecialidad, grados_atendidos: todos });
                            }}
                          >
                            Seleccionar Todos
                          </button>
                          <span className="text-muted">|</span>
                          <button
                            type="button"
                            className="btn btn-xs btn-link p-0 text-muted text-decoration-none"
                            onClick={() => setFormEspecialidad({ ...formEspecialidad, grados_atendidos: [] })}
                          >
                            Limpiar
                          </button>
                        </div>
                      </div>

                      {/* Checkboxes de Grados */}
                      <div className="p-3 bg-light rounded-4 border">
                        <div className="row g-2">
                          {(() => {
                            let listaOpcionesGrados: string[] = [];
                            if (formEspecialidad.nivel_educativo === 'Educación Media General') {
                              listaOpcionesGrados = ['1er Año', '2do Año', '3er Año', '4to Año', '5to Año'];
                            } else if (formEspecialidad.nivel_educativo === 'Educación Primaria') {
                              listaOpcionesGrados = ['1er Grado', '2do Grado', '3er Grado', '4to Grado', '5to Grado', '6to Grado'];
                            } else if (formEspecialidad.nivel_educativo === 'Educación Inicial') {
                              listaOpcionesGrados = ['Maternal', '1er Grupo', '2do Grupo', '3er Grupo'];
                            } else {
                              listaOpcionesGrados = grados.length > 0 ? grados.map(g => g.valor) : [
                                '1er Grado', '2do Grado', '3er Grado', '4to Grado', '5to Grado', '6to Grado',
                                '1er Año', '2do Año', '3er Año', '4to Año', '5to Año'
                              ];
                            }

                            return listaOpcionesGrados.map((gradoItem, gIdx) => {
                              const checked = formEspecialidad.grados_atendidos.includes(gradoItem);
                              return (
                                <div key={gIdx} className="col-6 col-sm-4 col-md-3">
                                  <label className={`form-check p-2 rounded-3 border d-flex align-items-center gap-2 cursor-pointer transition-all ${checked ? 'bg-primary bg-opacity-10 border-primary' : 'bg-white'}`}>
                                    <input 
                                      type="checkbox"
                                      className="form-check-input mt-0"
                                      checked={checked}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setFormEspecialidad({
                                            ...formEspecialidad,
                                            grados_atendidos: [...formEspecialidad.grados_atendidos, gradoItem]
                                          });
                                        } else {
                                          setFormEspecialidad({
                                            ...formEspecialidad,
                                            grados_atendidos: formEspecialidad.grados_atendidos.filter(g => g !== gradoItem)
                                          });
                                        }
                                      }}
                                    />
                                    <span className="small fw-bold text-dark">{gradoItem}</span>
                                  </label>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Docentes Asignados (Selector con exclusión y Badges con X) */}
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">
                        <i className="bi bi-people-fill me-1 text-success"></i>Docente(s) Especialista(s) Asignado(s):
                      </label>

                      {/* Dropdown de Docentes Disponibles */}
                      <select
                        className="form-select border-info rounded-pill mb-2"
                        value=""
                        onChange={(e) => {
                          const ced = e.target.value;
                          if (ced && !formEspecialidad.docentes_asignados.includes(ced)) {
                            setFormEspecialidad({
                              ...formEspecialidad,
                              docentes_asignados: [...formEspecialidad.docentes_asignados, ced]
                            });
                          }
                        }}
                      >
                        <option value="">➕ Seleccione un docente para agregar...</option>
                        {docentes
                          .filter(d => {
                            const matchEscuela = formEspecialidad.id_escuela ? (d.id_escuela === formEspecialidad.id_escuela || !d.id_escuela) : true;
                            const yaSeleccionado = formEspecialidad.docentes_asignados.includes(d.cedula);
                            return matchEscuela && !yaSeleccionado;
                          })
                          .map(doc => (
                            <option key={doc.cedula} value={doc.cedula}>
                              {doc.nombre_completo} (C.I. {doc.cedula}) {doc.id_escuela === 'sb' ? '— UE Santa Bárbara' : '— UE Libertador Bolívar'}
                            </option>
                          ))}
                      </select>

                      {/* Badges de Docentes Asignados */}
                      <div className="p-3 bg-light rounded-4 border">
                        {formEspecialidad.docentes_asignados.length === 0 ? (
                          <div className="extra-small text-muted text-center py-2">
                            <i className="bi bi-info-circle me-1"></i>No ha asignado ningún docente aún. Seleccione uno en el menú superior.
                          </div>
                        ) : (
                          <div className="d-flex flex-wrap gap-2">
                            {formEspecialidad.docentes_asignados.map(cedula => {
                              const doc = docentes.find(d => d.cedula === cedula);
                              return (
                                <span 
                                  key={cedula} 
                                  className="badge bg-white text-dark border border-success p-2 rounded-pill d-inline-flex align-items-center gap-2 shadow-xs"
                                >
                                  <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '22px', height: '22px', fontSize: '10px' }}>
                                    {doc?.nombre_completo?.charAt(0) || 'D'}
                                  </div>
                                  <span className="small fw-bold">{doc ? doc.nombre_completo : `C.I. ${cedula}`}</span>
                                  <button
                                    type="button"
                                    className="btn btn-xs btn-outline-danger rounded-circle border-0 p-0 d-flex align-items-center justify-content-center"
                                    style={{ width: '18px', height: '18px' }}
                                    onClick={() => {
                                      setFormEspecialidad({
                                        ...formEspecialidad,
                                        docentes_asignados: formEspecialidad.docentes_asignados.filter(c => c !== cedula)
                                      });
                                    }}
                                    title="Quitar docente"
                                  >
                                    <i className="bi bi-x"></i>
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Observaciones */}
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">Observaciones / Planificación Adicional</label>
                      <textarea 
                        className="form-control border-info rounded-4"
                        rows={2}
                        placeholder="Detalles sobre el plan de estudio, proyectos interdisciplinarios, etc..."
                        value={formEspecialidad.observaciones}
                        onChange={(e) => setFormEspecialidad({ ...formEspecialidad, observaciones: e.target.value })}
                      ></textarea>
                    </div>

                  </div>
                </div>

                <div className="modal-footer bg-light p-3 border-top d-flex justify-content-between">
                  <button 
                    type="button" 
                    className="btn btn-light rounded-pill px-4 fw-bold"
                    onClick={() => { setMostrarModalEspecialidad(false); setEditandoEspecialidadId(null); }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
                  >
                    <i className="bi bi-check-lg me-1"></i>
                    {editandoEspecialidadId ? 'Guardar Cambios' : 'Registrar Especialidad'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {mostrarPreviewSorpresa && (
        <ModalAsignacionSorpresa 
          forzarApertura={true}
          cedulaSimulada={previewDocenteCedula}
          onClose={() => {
            setMostrarPreviewSorpresa(false);
            setPreviewDocenteCedula('');
          }}
        />
      )}
    </div>
  );
};

