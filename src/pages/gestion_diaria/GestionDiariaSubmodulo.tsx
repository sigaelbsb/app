import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { gestionDiariaService, type ReporteGestionDiaria } from '../../services/gestionDiariaService';
import { ChamiloBreadcrumb } from '../../components/chamilo';
import { ModalDetalleReporteGestion } from '../../components/ModalDetalleReporteGestion';

export const GestionDiariaSubmodulo: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabInicial = (searchParams.get('tab') as 'cargar' | 'aprobar' | 'activas') || 'cargar';

  const [tabActiva, setTabActiva] = useState<'cargar' | 'aprobar' | 'activas'>(tabInicial);

  // Usuario en sesión
  const userStr = localStorage.getItem('usuario_sigae');
  const usuario = userStr ? JSON.parse(userStr) : { nombre: 'Docente / Directivo', rol: 'Docente', cedula: '00000000' };
  const activeSchoolCode = (localStorage.getItem('sigae_escuela_codigo') || 'sb') as 'sb' | 'lb';

  // ── ESTADO DEL FORMULARIO DE CARGA ──
  const [escuelaCodigo, setEscuelaCodigo] = useState<'sb' | 'lb' | 'ambas'>(activeSchoolCode);
  const [region, setRegion] = useState<string>('Oriente - Este');
  const [division, setDivision] = useState<string>('Punta de Mata');
  const [gerencia, setGerencia] = useState<string>('Recursos Humanos / RRHH');
  const [proceso, setProceso] = useState<string>(
    activeSchoolCode === 'sb' ? 'Escuela UE Santa Bárbara' : 'Escuela UE Libertador Bolívar'
  );
  const [anoEscolar, setAnoEscolar] = useState<string>('2026-2027');
  const [actividad, setActividad] = useState<string>('');
  const [fechaActividad, setFechaActividad] = useState<string>(new Date().toISOString().split('T')[0]);
  const [lugarActividad, setLugarActividad] = useState<string>(
    activeSchoolCode === 'sb' ? 'Cancha de la institución UE Santa Bárbara' : 'Patio Cívico UE Libertador Bolívar'
  );
  const [descripcion, setDescripcion] = useState<string>('');
  const [estudiantes, setEstudiantes] = useState<number>(0);
  const [docentes, setDocentes] = useState<number>(0);
  const [directivos, setDirectivos] = useState<number>(0);
  const [representantes, setRepresentantes] = useState<number>(0);
  const totalParticipantes = (Number(estudiantes) || 0) + (Number(docentes) || 0) + (Number(directivos) || 0) + (Number(representantes) || 0);

  const [fuente, setFuente] = useState<string>(
    `Recursos Humanos / ${activeSchoolCode === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar'}`
  );
  const [diasVigencia, setDiasVigencia] = useState<number>(7);
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [guardando, setGuardando] = useState<boolean>(false);

  // ── ESTADO DE APROBACIÓN & LISTADO ──
  const [reportes, setReportes] = useState<ReporteGestionDiaria[]>([]);
  const [filtroEstadoAprobacion, setFiltroEstadoAprobacion] = useState<'pendientes' | 'aprobados' | 'rechazados' | 'todos'>('pendientes');
  const [filtroEscuela, setFiltroEscuela] = useState<'todas' | 'sb' | 'lb'>('todas');
  const [reporteModal, setReporteModal] = useState<ReporteGestionDiaria | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const cargarReportes = async () => {
    setLoading(true);
    try {
      const todos = await gestionDiariaService.obtenerTodos();
      setReportes(todos);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReportes();
    const handleUpdate = () => cargarReportes();
    window.addEventListener('sigae-reportes-actualizados', handleUpdate);
    return () => window.removeEventListener('sigae-reportes-actualizados', handleUpdate);
  }, []);

  const cambiarTab = (tab: 'cargar' | 'aprobar' | 'activas') => {
    setTabActiva(tab);
    setSearchParams({ tab });
  };

  // Carga de fotos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const nuevasFotos: string[] = [];
    const maxFotos = 8;
    const restantes = maxFotos - imagenes.length;

    if (restantes <= 0) {
      alert('Se permite un máximo de 8 fotografías por reporte.');
      return;
    }

    const cantidadProcesar = Math.min(files.length, restantes);
    Array.from(files).slice(0, cantidadProcesar).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        if (loadEvent.target?.result) {
          nuevasFotos.push(loadEvent.target.result as string);
          if (nuevasFotos.length === cantidadProcesar) {
            setImagenes(prev => [...prev, ...nuevasFotos]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleEliminarImagen = (idx: number) => {
    setImagenes(prev => prev.filter((_, i) => i !== idx));
  };

  // Envío del formulario
  const handleSubmitCarga = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!actividad.trim()) {
      alert('Por favor indica el nombre o titular de la actividad.');
      return;
    }
    if (!descripcion.trim()) {
      alert('Por favor redacta la descripción de la actividad.');
      return;
    }

    setGuardando(true);
    try {
      const ahora = new Date();
      const horaStr = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const fechaFinVigencia = new Date(Date.now() + diasVigencia * 24 * 60 * 60 * 1000).toISOString();

      await gestionDiariaService.crearReporte({
        escuela_codigo: escuelaCodigo,
        region,
        division,
        gerencia,
        proceso,
        ano_escolar: anoEscolar,
        actividad: actividad.trim(),
        fecha_actividad: fechaActividad,
        lugar_actividad: lugarActividad.trim(),
        descripcion: descripcion.trim(),
        participantes: {
          estudiantes: Number(estudiantes) || 0,
          docentes: Number(docentes) || 0,
          directivos: Number(directivos) || 0,
          representantes: Number(representantes) || 0,
          total: totalParticipantes
        },
        fuente: fuente.trim(),
        hora_publicacion: horaStr,
        imagenes: imagenes.length > 0 ? imagenes : ['/assets/img/gestion_diaria/reporte_ejemplo_collage.png'],
        banner_superior: imagenes.length > 0 ? imagenes[0] : '/assets/img/gestion_diaria/reporte_ejemplo_collage.png',
        estado: 'pendiente', // Siempre inicia como pendiente de aprobación
        fecha_inicio_vigencia: ahora.toISOString(),
        fecha_fin_vigencia: fechaFinVigencia,
        fijado_carrusel: false,
        creado_por_nombre: usuario.nombre || 'Docente / Coordinador',
        creado_por_cedula: usuario.cedula || '00000000',
        creado_por_rol: usuario.rol || 'Docente'
      });

      // Limpiar formulario
      setActividad('');
      setDescripcion('');
      setEstudiantes(0);
      setDocentes(0);
      setDirectivos(0);
      setRepresentantes(0);
      setImagenes([]);

      const Swal = (window as any).Swal;
      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Gestión Diaria Registrada!',
          html: `
            <p>La actividad ha sido enviada para <strong>revisión y aprobación</strong>.</p>
            <p class="extra-small text-muted mb-0">Una vez aprobada, se publicará automáticamente en el carrusel del panel principal durante 1 semana.</p>
          `,
          confirmButtonText: 'Ver en Pendientes',
          confirmButtonColor: '#0066FF'
        }).then(() => {
          cambiarTab('aprobar');
        });
      } else {
        alert('Reporte enviado correctamente.');
        cambiarTab('aprobar');
      }
      cargarReportes();
    } catch (err) {
      console.error(err);
      alert('Error al guardar reporte.');
    } finally {
      setGuardando(false);
    }
  };

  // Acciones de Aprobación
  const handleAprobar = async (rep: ReporteGestionDiaria) => {
    const Swal = (window as any).Swal;
    const confirm = Swal ? await Swal.fire({
      icon: 'question',
      title: '¿Aprobar y Publicar en el Carrusel?',
      html: `
        <p>La actividad <strong>"${rep.actividad}"</strong> se publicará de inmediato en el carrusel del panel principal.</p>
        <span class="badge bg-primary-subtle text-primary border border-primary-subtle p-2">
          <i class="bi bi-clock-history me-1"></i> Duración activa: 1 semana (7 días)
        </span>
      `,
      showCancelButton: true,
      confirmButtonText: 'Aprobar y Publicar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#059669'
    }) : { isConfirmed: window.confirm('¿Aprobar y publicar?') };

    if (confirm.isConfirmed) {
      await gestionDiariaService.aprobarReporte(rep.id, { nombre: usuario.nombre || 'Dirección General', rol: usuario.rol });
      if (Swal) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Reporte Aprobado',
          text: 'Se visualiza ahora en el carrusel principal.',
          showConfirmButton: false,
          timer: 3000
        });
      }
      cargarReportes();
    }
  };

  const handleRechazar = async (rep: ReporteGestionDiaria) => {
    const Swal = (window as any).Swal;
    let motivo = '';

    if (Swal) {
      const { value, isConfirmed } = await Swal.fire({
        title: 'Rechazar Reporte de Gestión',
        input: 'textarea',
        inputLabel: 'Observaciones para el redactor:',
        inputPlaceholder: 'Indica qué correcciones se requieren...',
        showCancelButton: true,
        confirmButtonText: 'Confirmar Rechazo',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc2626'
      });
      if (!isConfirmed) return;
      motivo = value || 'Rechazado por supervisión.';
    } else {
      const resp = window.prompt('Indica el motivo del rechazo:');
      if (!resp) return;
      motivo = resp;
    }

    await gestionDiariaService.rechazarReporte(rep.id, motivo, { nombre: usuario.nombre || 'Dirección General' });
    cargarReportes();
  };

  const handleToggleFijado = async (rep: ReporteGestionDiaria) => {
    await gestionDiariaService.toggleFijadoCarrusel(rep.id);
    cargarReportes();
  };

  const pendientesCount = reportes.filter(r => r.estado === 'pendiente').length;
  const aprobadosCount = reportes.filter(r => r.estado === 'aprobado').length;

  const reportesFiltrados = reportes.filter((r) => {
    if (filtroEscuela !== 'todas' && r.escuela_codigo !== 'ambas' && r.escuela_codigo !== filtroEscuela) {
      return false;
    }
    if (tabActiva === 'activas') return r.estado === 'aprobado';
    if (filtroEstadoAprobacion === 'pendientes') return r.estado === 'pendiente';
    if (filtroEstadoAprobacion === 'aprobados') return r.estado === 'aprobado';
    if (filtroEstadoAprobacion === 'rechazados') return r.estado === 'rechazado';
    return true;
  });

  return (
    <div className="container-fluid p-3 p-md-4 animate__animated animate__fadeIn">
      
      {/* Breadcrumb */}
      <ChamiloBreadcrumb
        items={[
          { label: 'Gestión Institucional', url: '/categoria/Gestión Docente' },
          { label: 'Gestión Diaria & Aprobaciones' }
        ]}
      />

      {/* Cabecera Principal del Submódulo */}
      <div className="card border-0 shadow-xs rounded-4 mb-4 p-3 p-md-4 bg-white">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div 
              className="rounded-4 p-3 d-flex align-items-center justify-content-center shadow-xs"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)', color: '#fff', width: '56px', height: '56px' }}
            >
              <i className="bi bi-calendar2-week-fill fs-3"></i>
            </div>
            <div>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill extra-small px-2 py-0.5 mb-1">
                Submódulo Operativo & Editorial
              </span>
              <h4 className="fw-black mb-0 text-dark" style={{ letterSpacing: '-0.3px' }}>
                Gestión Diaria Institucional & Aprobación de Publicaciones
              </h4>
              <p className="text-muted small mb-0">
                Espacio exclusivo para cargar reportes pedagógicos diarios y aprobar su publicación en el carrusel principal.
              </p>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-outline-secondary btn-sm rounded-pill px-3"
            >
              <i className="bi bi-arrow-left me-1"></i> Ir al Panel Principal
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Pestañas Principales del Submódulo */}
      <div className="card border-0 shadow-xs rounded-4 p-2 bg-white mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => cambiarTab('cargar')}
              className={`btn btn-sm rounded-pill px-3.5 py-2 fw-bold d-inline-flex align-items-center gap-2 transition-all ${
                tabActiva === 'cargar' 
                  ? 'btn-primary text-white shadow-xs' 
                  : 'btn-light text-secondary'
              }`}
              style={{ fontSize: '0.80rem' }}
            >
              <i className="bi bi-plus-circle-fill"></i>
              <span>1. Cargar Nueva Gestión Diaria</span>
            </button>

            <button
              type="button"
              onClick={() => cambiarTab('aprobar')}
              className={`btn btn-sm rounded-pill px-3.5 py-2 fw-bold d-inline-flex align-items-center gap-2 transition-all ${
                tabActiva === 'aprobar' 
                  ? 'btn-warning text-dark shadow-xs' 
                  : 'btn-light text-secondary'
              }`}
              style={{ fontSize: '0.80rem' }}
            >
              <i className="bi bi-shield-check"></i>
              <span>2. Moderación & Aprobaciones</span>
              {pendientesCount > 0 && (
                <span className="badge rounded-pill bg-danger text-white ms-1" style={{ fontSize: '0.62rem' }}>
                  {pendientesCount} pendientes
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => cambiarTab('activas')}
              className={`btn btn-sm rounded-pill px-3.5 py-2 fw-bold d-inline-flex align-items-center gap-2 transition-all ${
                tabActiva === 'activas' 
                  ? 'btn-success text-white shadow-xs' 
                  : 'btn-light text-secondary'
              }`}
              style={{ fontSize: '0.80rem' }}
            >
              <i className="bi bi-broadcast"></i>
              <span>3. Activas en el Carrusel ({aprobadosCount})</span>
            </button>
          </div>

          <span className="text-muted extra-small d-none d-lg-inline px-2">
            <i className="bi bi-info-circle me-1 text-primary"></i>
            Las publicaciones aprobadas rotan semanalmente en el menú principal.
          </span>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PESTAÑA 1: FORMULARIO DE CARGA DE GESTIÓN DIARIA
      ───────────────────────────────────────────────────────────── */}
      {tabActiva === 'cargar' && (
        <form onSubmit={handleSubmitCarga}>
          <div className="row g-4">
            
            <div className="col-12 col-lg-8">
              <div className="card border-0 shadow-sm rounded-4 p-3.5 p-md-4 bg-white mb-4">
                
                <h6 className="fw-bold text-dark border-bottom pb-2.5 mb-3 d-flex align-items-center gap-2">
                  <span className="fs-5">🏫</span>
                  <span>Metadatos Institucionales (Formato Oficial)</span>
                </h6>

                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label extra-small fw-bold text-secondary">Plantel Educativo</label>
                    <select 
                      className="form-select form-select-sm rounded-3"
                      value={escuelaCodigo}
                      onChange={(e) => {
                        const val = e.target.value as 'sb' | 'lb' | 'ambas';
                        setEscuelaCodigo(val);
                        if (val === 'sb') setProceso('Escuela UE Santa Bárbara');
                        if (val === 'lb') setProceso('Escuela UE Libertador Bolívar');
                      }}
                    >
                      <option value="sb">U.E. Santa Bárbara</option>
                      <option value="lb">U.E. Libertador Bolívar</option>
                      <option value="ambas">Ambas Sedes</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label extra-small fw-bold text-secondary">🗺️ Región</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm rounded-3" 
                      value={region} 
                      onChange={(e) => setRegion(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label extra-small fw-bold text-secondary">🛢️ División</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm rounded-3" 
                      value={division} 
                      onChange={(e) => setDivision(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label extra-small fw-bold text-secondary">📑 Gerencia</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm rounded-3" 
                      value={gerencia} 
                      onChange={(e) => setGerencia(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label extra-small fw-bold text-secondary">🎒 Proceso / Escuela</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm rounded-3" 
                      value={proceso} 
                      onChange={(e) => setProceso(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label extra-small fw-bold text-secondary">📅 Año Escolar</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm rounded-3" 
                      value={anoEscolar} 
                      onChange={(e) => setAnoEscolar(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <h6 className="fw-bold text-dark border-bottom pb-2.5 mb-3 mt-4 d-flex align-items-center gap-2">
                  <span className="fs-5">📚</span>
                  <span>Datos de la Actividad Desarrollada</span>
                </h6>

                <div className="row g-3 mb-3">
                  <div className="col-12">
                    <label className="form-label extra-small fw-bold text-secondary">
                      Nombre o Titular de la Actividad <span className="text-danger">*</span>
                    </label>
                    <input 
                      type="text" 
                      className="form-control rounded-3" 
                      placeholder="Ej. Jornada de Integración y Bienvenida Pedagógica 2026-2027" 
                      value={actividad}
                      onChange={(e) => setActividad(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label extra-small fw-bold text-secondary">🗓️ Fecha de Realización</label>
                    <input 
                      type="date" 
                      className="form-control form-control-sm rounded-3" 
                      value={fechaActividad} 
                      onChange={(e) => setFechaActividad(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="col-12 col-md-8">
                    <label className="form-label extra-small fw-bold text-secondary">📍 Lugar del Evento</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm rounded-3" 
                      placeholder="Ej. Cancha de la institución UE Santa Bárbara" 
                      value={lugarActividad} 
                      onChange={(e) => setLugarActividad(e.target.value)} 
                      required 
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label extra-small fw-bold text-secondary">
                      📖 Descripción Detallada de la Jornada <span className="text-danger">*</span>
                    </label>
                    <textarea 
                      className="form-control rounded-3" 
                      rows={4} 
                      placeholder="Describe la jornada, presentación, dinámicas pedagógicas y propósito socioemocional..."
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      required
                    ></textarea>
                  </div>
                </div>

                <h6 className="fw-bold text-dark border-bottom pb-2.5 mb-3 mt-4 d-flex align-items-center gap-2">
                  <span className="fs-5">👥</span>
                  <span>Participantes Registrados</span>
                </h6>

                <div className="row g-3 mb-3">
                  <div className="col-6 col-sm-3">
                    <label className="form-label extra-small fw-bold text-secondary">Estudiantes</label>
                    <input 
                      type="number" 
                      min={0}
                      className="form-control form-control-sm rounded-3 text-center fw-bold" 
                      value={estudiantes || ''} 
                      onChange={(e) => setEstudiantes(parseInt(e.target.value) || 0)} 
                    />
                  </div>

                  <div className="col-6 col-sm-3">
                    <label className="form-label extra-small fw-bold text-secondary">Docentes</label>
                    <input 
                      type="number" 
                      min={0}
                      className="form-control form-control-sm rounded-3 text-center fw-bold" 
                      value={docentes || ''} 
                      onChange={(e) => setDocentes(parseInt(e.target.value) || 0)} 
                    />
                  </div>

                  <div className="col-6 col-sm-3">
                    <label className="form-label extra-small fw-bold text-secondary">Directivos</label>
                    <input 
                      type="number" 
                      min={0}
                      className="form-control form-control-sm rounded-3 text-center fw-bold" 
                      value={directivos || ''} 
                      onChange={(e) => setDirectivos(parseInt(e.target.value) || 0)} 
                    />
                  </div>

                  <div className="col-6 col-sm-3">
                    <label className="form-label extra-small fw-bold text-secondary">Representantes</label>
                    <input 
                      type="number" 
                      min={0}
                      className="form-control form-control-sm rounded-3 text-center fw-bold" 
                      value={representantes || ''} 
                      onChange={(e) => setRepresentantes(parseInt(e.target.value) || 0)} 
                    />
                  </div>

                  <div className="col-12">
                    <div className="p-2.5 rounded-3 bg-light border d-flex align-items-center justify-content-between">
                      <span className="extra-small text-muted fw-bold">TOTAL DE PARTICIPANTES:</span>
                      <span className="badge bg-primary fs-6 px-3 py-1 rounded-pill">{totalParticipantes} personas</span>
                    </div>
                  </div>
                </div>

                <h6 className="fw-bold text-dark border-bottom pb-2.5 mb-3 mt-4 d-flex align-items-center gap-2">
                  <span className="fs-5">📸</span>
                  <span>Evidencias Fotográficas (Máx. 8 fotos)</span>
                </h6>

                <div className="mb-3">
                  <div className="p-3 border-2 border-dashed rounded-4 text-center bg-light">
                    <input 
                      type="file" 
                      id="input-submodulo-fotos"
                      multiple 
                      accept="image/*" 
                      className="d-none"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="input-submodulo-fotos" className="cursor-pointer mb-0">
                      <i className="bi bi-cloud-arrow-up-fill fs-2 text-primary d-block mb-1"></i>
                      <span className="fw-bold text-dark small d-block">Seleccionar o Arrastrar Fotografías</span>
                      <span className="text-muted extra-small">Carga hasta 8 fotos para la galería y collage del carrusel.</span>
                    </label>
                  </div>

                  {imagenes.length > 0 && (
                    <div className="row g-2 mt-2">
                      {imagenes.map((img, i) => (
                        <div key={i} className="col-4 col-sm-3 position-relative">
                          <div className="rounded-3 overflow-hidden border shadow-xs position-relative" style={{ height: '90px' }}>
                            <img src={img} alt={`Preview ${i + 1}`} className="w-100 h-100 object-fit-cover" />
                            <button
                              type="button"
                              onClick={() => handleEliminarImagen(i)}
                              className="btn btn-danger btn-xs position-absolute top-0 end-0 m-1 rounded-circle p-1 d-flex align-items-center justify-content-center"
                              style={{ width: '22px', height: '22px' }}
                              title="Eliminar"
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <h6 className="fw-bold text-dark border-bottom pb-2.5 mb-3 mt-4 d-flex align-items-center gap-2">
                  <span className="fs-5">⏱️</span>
                  <span>Programación de Vigencia & Fuente</span>
                </h6>

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label extra-small fw-bold text-secondary">
                      Duración Programada en el Carrusel
                    </label>
                    <select 
                      className="form-select form-select-sm rounded-3"
                      value={diasVigencia}
                      onChange={(e) => setDiasVigencia(Number(e.target.value))}
                    >
                      <option value={7}>1 Semana (7 días) - Recomendado</option>
                      <option value={14}>2 Semanas (14 días)</option>
                      <option value={30}>1 Mes (30 días)</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label extra-small fw-bold text-secondary">📄 Fuente / Firma</label>
                    <input 
                      type="text" 
                      className="form-control form-control-sm rounded-3" 
                      value={fuente} 
                      onChange={(e) => setFuente(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-top d-flex align-items-center justify-content-end gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary rounded-pill px-4 fw-bold shadow-xs d-inline-flex align-items-center gap-2"
                    disabled={guardando}
                  >
                    {guardando ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send-fill"></i>
                        <span>Cargar y Enviar a Aprobación</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>

            {/* Previsualización en Vivo */}
            <div className="col-12 col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white position-sticky" style={{ top: '80px' }}>
                <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
                  <h6 className="fw-bold mb-0 text-dark extra-small text-uppercase">
                    <i className="bi bi-eye-fill me-1 text-primary"></i>
                    Previsualización en Vivo
                  </h6>
                  <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill extra-small">
                    Pendiente
                  </span>
                </div>

                <div className="p-3 rounded-4 border bg-light" style={{ fontSize: '0.80rem' }}>
                  <div className="text-center fw-bolder text-success mb-2" style={{ fontSize: '0.82rem' }}>
                    🏫 Reporte de Actividades 🏫
                  </div>
                  
                  <div className="mb-2 extra-small">
                    <div>🗺️ <strong>Región:</strong> {region}</div>
                    <div>🛢️ <strong>División:</strong> {division}</div>
                    <div>📑 <strong>Gerencia:</strong> {gerencia}</div>
                    <div>🎒 <strong>Proceso:</strong> {proceso}</div>
                    <div>📅 <strong>Año Escolar:</strong> {anoEscolar}</div>
                  </div>

                  <div className="p-2 rounded-3 bg-white border mb-2">
                    <div className="fw-bold text-dark" style={{ fontSize: '0.84rem' }}>
                      📚 {actividad || 'Título de la actividad...'}
                    </div>
                    <div className="text-muted extra-small mt-0.5">
                      🗓️ {fechaActividad} • {lugarActividad}
                    </div>
                  </div>

                  <div className="p-2 rounded-3 bg-white border mb-2 text-secondary extra-small" style={{ lineHeight: '1.4' }}>
                    📖 {descripcion || 'Descripción del evento pedagógico...'}
                  </div>

                  <div className="p-2 rounded-3 bg-white border mb-2">
                    <strong>👥 Participantes:</strong> {totalParticipantes}
                  </div>

                  <div className="extra-small text-muted border-top pt-1.5">
                    📄 <strong>Fuente:</strong> {fuente}
                  </div>
                </div>

                <div className="alert alert-info extra-small mb-0 mt-3 p-2.5 rounded-3">
                  <i className="bi bi-shield-lock me-1"></i>
                  Al guardar, se remitirá a la pestaña de <strong>Aprobaciones</strong>. El carrusel principal solo mostrará la lámina una vez que sea autorizada.
                </div>

              </div>
            </div>

          </div>
        </form>
      )}

      {/* ─────────────────────────────────────────────────────────────
          PESTAÑA 2 Y 3: MODERACIÓN, APROBACIONES & PUBLICACIONES ACTIVAS
      ───────────────────────────────────────────────────────────── */}
      {(tabActiva === 'aprobar' || tabActiva === 'activas') && (
        <div className="animate__animated animate__fadeIn">
          
          {/* Filtros secundarios para Moderación */}
          {tabActiva === 'aprobar' && (
            <div className="card border-0 shadow-xs rounded-4 p-2.5 bg-white mb-3">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setFiltroEstadoAprobacion('pendientes')}
                    className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${
                      filtroEstadoAprobacion === 'pendientes' ? 'btn-warning text-dark' : 'btn-light text-muted'
                    }`}
                    style={{ fontSize: '0.76rem' }}
                  >
                    <i className="bi bi-hourglass-split me-1"></i>
                    Pendientes de Aprobación ({pendientesCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroEstadoAprobacion('aprobados')}
                    className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${
                      filtroEstadoAprobacion === 'aprobados' ? 'btn-success text-white' : 'btn-light text-muted'
                    }`}
                    style={{ fontSize: '0.76rem' }}
                  >
                    <i className="bi bi-check-circle-fill me-1"></i>
                    Aprobados ({aprobadosCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroEstadoAprobacion('rechazados')}
                    className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${
                      filtroEstadoAprobacion === 'rechazados' ? 'btn-danger text-white' : 'btn-light text-muted'
                    }`}
                    style={{ fontSize: '0.76rem' }}
                  >
                    <i className="bi bi-x-circle-fill me-1"></i>
                    Rechazados
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroEstadoAprobacion('todos')}
                    className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${
                      filtroEstadoAprobacion === 'todos' ? 'btn-dark text-white' : 'btn-light text-muted'
                    }`}
                    style={{ fontSize: '0.76rem' }}
                  >
                    Todos ({reportes.length})
                  </button>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <label className="extra-small text-muted fw-bold">Filtrar Sede:</label>
                  <select
                    className="form-select form-select-sm rounded-pill"
                    style={{ width: '180px', fontSize: '0.75rem' }}
                    value={filtroEscuela}
                    onChange={(e) => setFiltroEscuela(e.target.value as any)}
                  >
                    <option value="todas">Todas las Sedes</option>
                    <option value="sb">U.E. Santa Bárbara</option>
                    <option value="lb">U.E. Libertador Bolívar</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Listado de Reportes */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : reportesFiltrados.length === 0 ? (
            <div className="card border-0 shadow-xs rounded-4 p-5 text-center bg-white">
              <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
              <h6 className="fw-bold text-dark">No hay registros en esta sección</h6>
              <p className="text-muted extra-small mb-3">
                {tabActiva === 'activas' 
                  ? 'No hay actividades con vigencia activa en el carrusel en este momento.' 
                  : 'No hay reportes con el filtro de moderación seleccionado.'}
              </p>
              <button
                type="button"
                onClick={() => cambiarTab('cargar')}
                className="btn btn-primary btn-sm rounded-pill px-3.5 mx-auto"
              >
                Cargar nueva gestión diaria
              </button>
            </div>
          ) : (
            <div className="row g-3">
              {reportesFiltrados.map((rep) => {
                const isSb = rep.escuela_codigo === 'sb';
                const colorTema = isSb ? '#059669' : '#0284c7';

                return (
                  <div key={rep.id} className="col-12">
                    <div 
                      className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white"
                      style={{ borderLeft: `6px solid ${colorTema}` }}
                    >
                      <div className="p-3.5 p-md-4">
                        <div className="row g-3 align-items-center">
                          
                          {/* Miniatura */}
                          <div className="col-12 col-md-3 col-lg-2">
                            <div 
                              className="rounded-3 overflow-hidden border shadow-xs position-relative bg-dark cursor-pointer"
                              style={{ height: '110px' }}
                              onClick={() => setReporteModal(rep)}
                              title="Clic para ampliar"
                            >
                              <img 
                                src={rep.banner_superior || rep.imagenes?.[0] || '/assets/img/gestion_diaria/reporte_ejemplo_collage.png'} 
                                alt={rep.actividad}
                                className="w-100 h-100 object-fit-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/assets/img/gestion_diaria/reporte_ejemplo_collage.png';
                                }}
                              />
                              <span className="badge bg-black bg-opacity-75 text-white extra-small position-absolute bottom-0 end-0 m-1 rounded-pill">
                                {rep.imagenes?.length || 1} fotos
                              </span>
                            </div>
                          </div>

                          {/* Datos del Reporte */}
                          <div className="col-12 col-md-6 col-lg-7">
                            <div className="d-flex align-items-center gap-1.5 flex-wrap mb-1">
                              <span 
                                className="badge text-white fw-bold extra-small rounded-pill px-2 py-0.5"
                                style={{ backgroundColor: colorTema }}
                              >
                                {rep.proceso}
                              </span>
                              <span className="badge bg-light text-dark border extra-small rounded-pill px-2 py-0.5">
                                📅 {rep.ano_escolar}
                              </span>
                              <span className="text-muted extra-small">
                                🗓️ {rep.fecha_actividad}
                              </span>

                              {/* Estado */}
                              {rep.estado === 'pendiente' && (
                                <span className="badge bg-warning text-dark extra-small rounded-pill px-2 py-0.5 fw-bold">
                                  <i className="bi bi-hourglass-split me-1"></i>Pendiente de Aprobación
                                </span>
                              )}
                              {rep.estado === 'aprobado' && (
                                <span className="badge bg-success text-white extra-small rounded-pill px-2 py-0.5 fw-bold">
                                  <i className="bi bi-check-circle-fill me-1"></i>Activo en Carrusel
                                </span>
                              )}
                              {rep.estado === 'rechazado' && (
                                <span className="badge bg-danger text-white extra-small rounded-pill px-2 py-0.5 fw-bold">
                                  <i className="bi bi-x-circle-fill me-1"></i>Rechazado
                                </span>
                              )}
                            </div>

                            <h6 className="fw-black mb-1 text-dark" style={{ fontSize: '0.96rem' }}>
                              📚 {rep.actividad}
                            </h6>

                            <p className="text-secondary extra-small mb-1.5 text-truncate-2" style={{ lineHeight: '1.4' }}>
                              📖 {rep.descripcion}
                            </p>

                            <div className="d-flex align-items-center gap-2 flex-wrap text-muted extra-small" style={{ fontSize: '0.72rem' }}>
                              <span>👥 <strong>Participantes:</strong> {rep.participantes?.total || 0}</span>
                              <span>•</span>
                              <span>📄 <strong>Fuente:</strong> {rep.fuente}</span>
                              <span>•</span>
                              <span>Cargado por: <strong>{rep.creado_por_nombre}</strong></span>
                            </div>

                            {rep.observaciones_aprobacion && (
                              <div className="alert alert-danger extra-small p-2 mt-2 mb-0 rounded-3">
                                <strong>Observación:</strong> {rep.observaciones_aprobacion}
                              </div>
                            )}
                          </div>

                          {/* Acciones de Moderación */}
                          <div className="col-12 col-md-3 col-lg-3 text-md-end border-top border-md-0 pt-2 pt-md-0">
                            <div className="d-flex flex-column gap-1.5 justify-content-end">
                              
                              <button
                                type="button"
                                onClick={() => setReporteModal(rep)}
                                className="btn btn-outline-primary btn-sm rounded-pill fw-bold"
                                style={{ fontSize: '0.74rem' }}
                              >
                                <i className="bi bi-eye-fill me-1"></i> Ver Ficha
                              </button>

                              {rep.estado === 'pendiente' && (
                                <div className="d-flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleAprobar(rep)}
                                    className="btn btn-success btn-sm rounded-pill fw-bold flex-grow-1"
                                    style={{ fontSize: '0.74rem' }}
                                  >
                                    <i className="bi bi-check-lg me-1"></i> Aprobar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRechazar(rep)}
                                    className="btn btn-outline-danger btn-sm rounded-pill fw-bold flex-grow-1"
                                    style={{ fontSize: '0.74rem' }}
                                  >
                                    <i className="bi bi-x-lg me-1"></i> Rechazar
                                  </button>
                                </div>
                              )}

                              {rep.estado === 'aprobado' && (
                                <div className="d-flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleFijado(rep)}
                                    className={`btn btn-xs rounded-pill flex-grow-1 ${rep.fijado_carrusel ? 'btn-info text-white' : 'btn-outline-secondary'}`}
                                    style={{ fontSize: '0.70rem' }}
                                    title="Fijar permanentemente en carrusel"
                                  >
                                    <i className={`bi ${rep.fijado_carrusel ? 'bi-pin-angle-fill' : 'bi-pin-angle'} me-1`}></i>
                                    {rep.fijado_carrusel ? 'Fijado' : 'Fijar'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRechazar(rep)}
                                    className="btn btn-outline-warning btn-xs rounded-pill"
                                    style={{ fontSize: '0.70rem' }}
                                    title="Retirar del carrusel"
                                  >
                                    Retirar
                                  </button>
                                </div>
                              )}

                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Modal de Detalle */}
      {reporteModal && (
        <ModalDetalleReporteGestion 
          reporte={reporteModal} 
          onClose={() => setReporteModal(null)} 
        />
      )}

    </div>
  );
};
