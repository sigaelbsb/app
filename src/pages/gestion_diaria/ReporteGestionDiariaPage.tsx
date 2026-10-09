import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gestionDiariaService } from '../../services/gestionDiariaService';
import { ChamiloBreadcrumb } from '../../components/chamilo';

export const ReporteGestionDiariaPage: React.FC = () => {
  const navigate = useNavigate();

  // Obtener usuario en sesión
  const userStr = localStorage.getItem('usuario_sigae');
  const usuario = userStr ? JSON.parse(userStr) : { nombre: 'Docente / Coordinador', rol: 'Docente', cedula: '00000000' };
  const activeSchoolCode = (localStorage.getItem('sigae_escuela_codigo') || 'sb') as 'sb' | 'lb';

  // Form State
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
  
  // Participantes
  const [estudiantes, setEstudiantes] = useState<number>(0);
  const [docentes, setDocentes] = useState<number>(0);
  const [directivos, setDirectivos] = useState<number>(0);
  const [representantes, setRepresentantes] = useState<number>(0);

  const totalParticipantes = (Number(estudiantes) || 0) + (Number(docentes) || 0) + (Number(directivos) || 0) + (Number(representantes) || 0);

  const [fuente, setFuente] = useState<string>(
    `Recursos Humanos / ${activeSchoolCode === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar'}`
  );
  const [diasVigencia, setDiasVigencia] = useState<number>(7); // 1 semana por defecto
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [guardando, setGuardando] = useState<boolean>(false);

  // Manejador para carga de imágenes (hasta 8 fotos)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const nuevasFotos: string[] = [];
    const maxFotos = 8;
    const restantes = maxFotos - imagenes.length;

    if (restantes <= 0) {
      alert('Ya has alcanzado el límite máximo de 8 fotografías por reporte.');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!actividad.trim()) {
      alert('Por favor indica el nombre o titular de la actividad.');
      return;
    }

    if (!descripcion.trim()) {
      alert('Por favor redacta la descripción de la actividad realizada.');
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
        estado: 'pendiente', // Enviado para aprobación de personal autorizado
        fecha_inicio_vigencia: ahora.toISOString(),
        fecha_fin_vigencia: fechaFinVigencia,
        fijado_carrusel: false,
        creado_por_nombre: usuario.nombre || 'Docente / Coordinador',
        creado_por_cedula: usuario.cedula || '00000000',
        creado_por_rol: usuario.rol || 'Docente'
      });

      const Swal = (window as any).Swal;
      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Reporte de Gestión Enviado!',
          html: `
            <p>La actividad <strong>"${actividad}"</strong> fue cargada exitosamente en el sistema.</p>
            <div class="alert alert-info text-start extra-small mb-0">
              <i class="bi bi-clock-history me-1"></i>
              Ha sido programada con una duración de <strong>${diasVigencia} días (1 semana)</strong>. 
              El equipo de supervisión y dirección revisará el reporte para aprobar su publicación en el carrusel principal.
            </div>
          `,
          confirmButtonText: 'Ir al Panel Principal',
          confirmButtonColor: '#0066FF'
        }).then(() => {
          navigate('/');
        });
      } else {
        alert('Reporte enviado correctamente para aprobación.');
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al guardar el reporte.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="container-fluid p-3 p-md-4 animate__animated animate__fadeIn">
      
      {/* Breadcrumb */}
      <ChamiloBreadcrumb
        items={[
          { label: 'Gestión Docente y Pedagógica', url: '/categoria/Gestión Docente' },
          { label: 'Carga de Gestión Diaria' }
        ]}
      />

      {/* Cabecera Principal */}
      <div className="card border-0 shadow-xs rounded-4 mb-4 p-3 p-md-4 bg-white">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <div 
              className="rounded-4 p-3 d-flex align-items-center justify-content-center shadow-xs"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: '#fff', width: '56px', height: '56px' }}
            >
              <i className="bi bi-calendar2-check-fill fs-3"></i>
            </div>
            <div>
              <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill extra-small px-2 py-0.5 mb-1">
                Formato Oficial de Actividades
              </span>
              <h4 className="fw-black mb-0 text-dark" style={{ letterSpacing: '-0.3px' }}>
                Reporte de Actividades & Gestión Diaria
              </h4>
              <p className="text-muted small mb-0">
                Carga de evidencias fotográficas, estadísticas de participantes y cronograma para el carrusel de novedades.
              </p>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn btn-outline-secondary btn-sm rounded-pill px-3"
            >
              <i className="bi bi-arrow-left me-1"></i> Volver al Menú
            </button>
          </div>
        </div>
      </div>

      {/* Formulario Estructurado */}
      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          
          {/* Columna Izquierda: Formulario de Carga */}
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 p-3.5 p-md-4 bg-white mb-4">
              
              <h6 className="fw-bold text-dark border-bottom pb-2.5 mb-3 d-flex align-items-center gap-2">
                <span className="fs-5">🏫</span>
                <span>1. Metadatos Institucionales y Proceso</span>
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
                    <option value="ambas">Ambas Sedes Conectadas</option>
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
                <span>2. Detalles de la Actividad Desarrollada</span>
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
                    placeholder="Describe los propósitos pedagógicos, dinámicas desarrolladas, bienvenida, refrigerios y aspectos socioemocionales..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    required
                  ></textarea>
                </div>
              </div>

              <h6 className="fw-bold text-dark border-bottom pb-2.5 mb-3 mt-4 d-flex align-items-center gap-2">
                <span className="fs-5">👥</span>
                <span>3. Número de Participantes</span>
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
                    <span className="extra-small text-muted fw-bold">TOTAL DE PARTICIPANTES REGISTRADOS:</span>
                    <span className="badge bg-primary fs-6 px-3 py-1 rounded-pill">{totalParticipantes} personas</span>
                  </div>
                </div>
              </div>

              <h6 className="fw-bold text-dark border-bottom pb-2.5 mb-3 mt-4 d-flex align-items-center gap-2">
                <span className="fs-5">📸</span>
                <span>4. Evidencias Fotográficas (Máx. 8 fotos)</span>
              </h6>

              <div className="mb-3">
                <div className="p-3 border-2 border-dashed rounded-4 text-center bg-light">
                  <input 
                    type="file" 
                    id="input-fotos"
                    multiple 
                    accept="image/*" 
                    className="d-none"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="input-fotos" className="cursor-pointer mb-0">
                    <i className="bi bi-cloud-arrow-up-fill fs-2 text-primary d-block mb-1"></i>
                    <span className="fw-bold text-dark small d-block">Seleccionar o Arrastrar Fotografías</span>
                    <span className="text-muted extra-small">Formatos PNG, JPG, WEBP. Se creará automáticamente la galería y collage para el carrusel.</span>
                  </label>
                </div>

                {/* Previsualización de Fotos Cargadas */}
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
                            title="Eliminar foto"
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
                <span>5. Programación de Publicación & Fuente</span>
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
                  <span className="text-muted extra-small d-block mt-1">
                    El reporte permanecerá activo en el carrusel principal durante este período una vez aprobado.
                  </span>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label extra-small fw-bold text-secondary">📄 Fuente / Firma Responsable</label>
                  <input 
                    type="text" 
                    className="form-control form-control-sm rounded-3" 
                    value={fuente} 
                    onChange={(e) => setFuente(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              {/* Botón de Envío */}
              <div className="mt-4 pt-3 border-top d-flex align-items-center justify-content-end gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="btn btn-light rounded-pill px-4"
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary rounded-pill px-4 fw-bold shadow-xs d-inline-flex align-items-center gap-2"
                  disabled={guardando}
                >
                  {guardando ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-fill"></i>
                      <span>Enviar Reporte para Aprobación</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* Columna Derecha: Previsualización en Vivo de la Ficha */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white position-sticky" style={{ top: '80px' }}>
              <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
                <h6 className="fw-bold mb-0 text-dark extra-small text-uppercase">
                  <i className="bi bi-eye-fill me-1 text-primary"></i>
                  Vista Previa en Vivo
                </h6>
                <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill extra-small">
                  Pendiente de Aprobación
                </span>
              </div>

              {/* Miniatura visual de la ficha */}
              <div className="p-3 rounded-4 border bg-light shadow-2xs" style={{ fontSize: '0.80rem' }}>
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
                  📖 {descripcion || 'Descripción del evento...'}
                </div>

                <div className="p-2 rounded-3 bg-white border mb-2">
                  <strong>👥 Participantes:</strong> {totalParticipantes}
                  <div className="extra-small text-muted">
                    {estudiantes} Est. • {docentes} Doc. • {directivos} Dir. • {representantes} Rep.
                  </div>
                </div>

                <div className="extra-small text-muted border-top pt-1.5">
                  📄 <strong>Fuente:</strong> {fuente}
                </div>
              </div>

              <div className="alert alert-secondary extra-small mb-0 mt-3 p-2.5 rounded-3">
                <i className="bi bi-info-circle-fill me-1 text-primary"></i>
                Este reporte será revisado por personal de dirección antes de activarse en el carrusel de novedades.
              </div>

            </div>
          </div>

        </div>
      </form>

    </div>
  );
};
