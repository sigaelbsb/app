import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { usePermisos } from '../../hooks/usePermisos';
import { auditar } from '../../lib/audit';

const ABREVIATURAS = ['DE', 'DEL', 'LA', 'LAS', 'LOS', 'Y', 'E', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const toTitulo = (value: string): string =>
  value
    .split(' ')
    .map(word => {
      const wUpper = word.toUpperCase();
      if (ABREVIATURAS.includes(wUpper)) {
        return wUpper;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

const handleTituloChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setter: (val: string) => void
) => {
  const raw = e.target.value;
  const endsWithSpace = raw.endsWith(' ');
  const converted = toTitulo(raw.trimEnd());
  setter(endsWithSpace ? converted + ' ' : converted);
};

interface PersonaAutorizada {
  nombres: string;
  apellidos: string;
  cedula: string;
  parentesco: string;
  telefono: string;
}

interface FichaIntegralDatos {
  // Residencia y Contacto
  direccion: string;
  municipio: string;
  parroquia: string;
  telefono_habitacion: string;
  telefono_movil: string;
  telefono_emergencia: string;
  email_familiar: string;

  // Biometría y Salud
  peso_kg: string;
  estatura_cm: string;
  talla_camisa: string;
  talla_pantalon: string;
  talla_calzado: string;
  tipo_sangre: string;
  alergias: string;
  tiene_condicion_medica: boolean;
  detalle_condicion_medica: string;
  medico_tratante: string;
  vacunas_completas: boolean;

  // Transporte y Retiro
  requiere_transporte: boolean;
  comentarios_transporte: string;
  personas_autorizadas: PersonaAutorizada[];
}

const DATOS_INITIAL_STATE: FichaIntegralDatos = {
  direccion: '',
  municipio: 'Simón Bolívar',
  parroquia: 'San Cristóbal',
  telefono_habitacion: '',
  telefono_movil: '',
  telefono_emergencia: '',
  email_familiar: '',
  peso_kg: '',
  estatura_cm: '',
  talla_camisa: '12',
  talla_pantalon: '12',
  talla_calzado: '34',
  tipo_sangre: 'O+',
  alergias: 'Ninguna conocida',
  tiene_condicion_medica: false,
  detalle_condicion_medica: '',
  medico_tratante: '',
  vacunas_completas: true,
  requiere_transporte: false,
  comentarios_transporte: '',
  personas_autorizadas: []
};

export const ActualizacionDatos: React.FC = () => {
  const { user } = usePermisos();
  const [loading, setLoading] = useState<boolean>(false);
  const [misRepresentados, setMisRepresentados] = useState<any[]>([]);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<any | null>(null);
  const [ficha, setFicha] = useState<FichaIntegralDatos>(DATOS_INITIAL_STATE);
  const [pestañaFicha, setPestañaFicha] = useState<'residencia' | 'salud' | 'autorizados'>('residencia');
  
  // Para administradores que deseen consultar la ficha de cualquier cédula
  const [cedulaBusquedaAdmin, setCedulaBusquedaAdmin] = useState<string>('');
  const esAdmin = ['SuperAdmin', 'Director', 'Administrador', 'Coordinador'].includes(user?.rol || '');

  useEffect(() => {
    if (user?.cedula) {
      cargarMisRepresentados(user.cedula);
    }
  }, [user]);

  const cargarMisRepresentados = async (cedulaConsulta: string) => {
    setLoading(true);
    try {
      // Si el usuario no tiene cédula o es admin buscando, filtra por esa cédula
      const { data, error } = await supabase
        .from('estudiantes_vinculaciones')
        .select('*')
        .eq('cedula_representante', cedulaConsulta)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMisRepresentados(data || []);
    } catch (err: any) {
      console.error('Error al cargar representados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscarAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (cedulaBusquedaAdmin.trim()) {
      cargarMisRepresentados(cedulaBusquedaAdmin.trim());
    }
  };

  const abrirFichaEstudiante = (est: any) => {
    setEstudianteSeleccionado(est);
    if (est.datos_actualizados && Object.keys(est.datos_actualizados).length > 0) {
      setFicha({ ...DATOS_INITIAL_STATE, ...est.datos_actualizados });
    } else {
      setFicha({
        ...DATOS_INITIAL_STATE,
        telefono_movil: user?.telefono || '',
        email_familiar: user?.email || ''
      });
    }
    setPestañaFicha('residencia');
  };

  const handleGuardarFicha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estudianteSeleccionado) return;

    setLoading(true);
    try {
      const fichaLimpia = {
        ...ficha,
        personas_autorizadas: ficha.personas_autorizadas.map(pa => ({
          ...pa,
          nombres: toTitulo(pa.nombres.trim()),
          apellidos: toTitulo(pa.apellidos.trim()),
          cedula: pa.cedula.trim().toUpperCase()
        }))
      };
      const nowIso = new Date().toISOString();
      const payload = {
        datos_actualizados: fichaLimpia,
        fecha_ultima_actualizacion: nowIso
      };

      const { error } = await supabase
        .from('estudiantes_vinculaciones')
        .update(payload)
        .eq('id', estudianteSeleccionado.id);

      if (error) throw error;

      if ((window as any).Swal) {
        (window as any).Swal.fire('¡Datos Actualizados!', `Se ha registrado y guardado la ficha integral del estudiante ${estudianteSeleccionado.nombres_estudiante}.`, 'success');
      } else {
        alert('Ficha Integral guardada exitosamente');
      }

      auditar('Actualización de Datos', 'Actualizar Ficha', `Actualizada ficha integral de ${estudianteSeleccionado.cedula_estudiante}`);
      
      // Actualiza lista local
      setMisRepresentados(prev => prev.map(m => {
        if (m.id === estudianteSeleccionado.id) {
          return { ...m, ...payload };
        }
        return m;
      }));
      setEstudianteSeleccionado(null);
    } catch (err: any) {
      console.error(err);
      if ((window as any).Swal) {
        (window as any).Swal.fire('Error', `No se pudo actualizar la ficha: ${err.message}`, 'error');
      } else {
        alert('Error al guardar: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const agregarPersonaAutorizada = () => {
    if (ficha.personas_autorizadas.length >= 3) {
      alert('Solo se permite registrar hasta 3 personas autorizadas por estudiante.');
      return;
    }
    setFicha({
      ...ficha,
      personas_autorizadas: [
        ...ficha.personas_autorizadas,
        { nombres: '', apellidos: '', cedula: '', parentesco: 'Abuelo(a)', telefono: '' }
      ]
    });
  };

  const eliminarPersonaAutorizada = (index: number) => {
    const actual = [...ficha.personas_autorizadas];
    actual.splice(index, 1);
    setFicha({ ...ficha, personas_autorizadas: actual });
  };

  const actualizarPersonaAutorizada = (index: number, campo: keyof PersonaAutorizada, valor: string) => {
    const actual = [...ficha.personas_autorizadas];
    actual[index] = { ...actual[index], [campo]: valor };
    setFicha({ ...ficha, personas_autorizadas: actual });
  };

  return (
    <div className="container-fluid py-4 animate__animated animate__fadeIn">
      {/* Encabezado Principal */}
      <div 
        className="banner-modulo p-4 p-md-5 mb-4 shadow-sm text-white position-relative overflow-hidden" 
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '24px' }}
      >
        <div className="burbuja-3d burbuja-1" style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.15)', position: 'absolute', top: '-50px', right: '-20px', borderRadius: '50%' }}></div>
        <div className="burbuja-3d burbuja-2" style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.08)', position: 'absolute', bottom: '-20px', left: '20px', borderRadius: '50%' }}></div>
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between position-relative z-1">
          <div>
            <span className="badge bg-white text-dark fw-bold px-3 py-2 rounded-pill mb-3 shadow-sm text-uppercase" style={{ letterSpacing: '1px', fontSize: '0.75rem' }}>
              <i className="bi bi-person-lines-fill me-2 text-primary"></i>Ficha Integral Estudiantil
            </span>
            <h1 className="fw-bolder mb-2 display-6 text-white">
              <i className="bi bi-file-earmark-person-fill me-3"></i>Actualización de Datos
            </h1>
            <p className="mb-0 text-white-50 fs-6" style={{ maxWidth: '750px' }}>
              Mantenga al día la información médica, biométrica y de contacto de sus representados. Los datos primarios de identidad se encuentran blindados por seguridad institucional.
            </p>
          </div>
          {estudianteSeleccionado && (
            <div className="mt-4 mt-md-0">
              <button className="btn btn-outline-light rounded-pill px-4 fw-bold shadow-sm hover-efecto" onClick={() => setEstudianteSeleccionado(null)}>
                <i className="bi bi-arrow-left me-2"></i>Volver a Mis Representados
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Si es Admin, permitir buscar por otra cédula */}
      {esAdmin && !estudianteSeleccionado && (
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-light">
          <form onSubmit={handleBuscarAdmin} className="row g-2 align-items-center">
            <div className="col-md-auto">
              <span className="fw-bold text-dark"><i className="bi bi-shield-lock-fill text-primary me-2"></i>Modo Administración:</span>
            </div>
            <div className="col-md-5">
              <input 
                type="text" 
                className="form-control bg-white" 
                placeholder="Buscar representados por Cédula del Representante..."
                value={cedulaBusquedaAdmin}
                onChange={(e) => setCedulaBusquedaAdmin(e.target.value)}
              />
            </div>
            <div className="col-md-auto">
              <button type="submit" className="btn btn-primary fw-bold px-4">
                <i className="bi bi-search me-2"></i>Consultar Cédula
              </button>
              <button 
                type="button" 
                className="btn btn-outline-secondary fw-bold ms-2"
                onClick={() => { setCedulaBusquedaAdmin(''); if (user?.cedula) cargarMisRepresentados(user.cedula); }}
              >
                Mis Hijos
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VISTA 1: TARJETAS "MIS REPRESENTADOS" */}
      {!estudianteSeleccionado && (
        <div>
          <h4 className="fw-bolder text-dark mb-4 d-flex align-items-center">
            <i className="bi bi-people-fill text-primary me-3 fs-3"></i>
            Mis Representados
            <span className="badge bg-primary rounded-pill ms-3 fs-6 px-3">{misRepresentados.length}</span>
          </h4>

          {loading ? (
            <div className="text-center py-5 my-5">
              <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}></div>
              <p className="mt-3 text-muted fw-bold fs-5">Consultando estudiantes vinculados...</p>
            </div>
          ) : misRepresentados.length === 0 ? (
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white my-4">
              <div className="mb-4">
                <div className="bg-light text-muted rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '90px', height: '90px' }}>
                  <i className="bi bi-person-exclamation fs-1"></i>
                </div>
              </div>
              <h3 className="fw-bold text-dark">No se encontraron estudiantes vinculados</h3>
              <p className="text-muted fs-6 mx-auto mb-4" style={{ maxWidth: '600px' }}>
                Actualmente no hay alumnos asociados a su número de cédula (<b>{cedulaBusquedaAdmin || user?.cedula}</b>). 
                Por favor, solicite a la Dirección Escolar o Control de Estudios que realice la vinculación en el módulo <b>Vincular Estudiante</b>.
              </p>
            </div>
          ) : (
            <div className="row g-4">
              {misRepresentados.map((est) => {
                const actualizado = !!est.fecha_ultima_actualizacion;
                return (
                  <div className="col-md-6 col-xl-4" key={est.id}>
                    <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden hover-shadow transition-all">
                      <div className="card-header border-0 p-4 pb-0 bg-transparent d-flex justify-content-between align-items-start">
                        <span className={`badge ${est.codigo_escuela === 'sb' ? 'bg-primary' : 'bg-success'} text-white fw-bold px-3 py-2 rounded-pill`}>
                          {est.codigo_escuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar'}
                        </span>
                        {actualizado ? (
                          <span className="badge bg-success bg-opacity-10 text-success border border-success px-3 py-2 rounded-pill">
                            <i className="bi bi-check-circle-fill me-1"></i>Actualizado
                          </span>
                        ) : (
                          <span className="badge bg-warning bg-opacity-10 text-dark border border-warning px-3 py-2 rounded-pill">
                            <i className="bi bi-exclamation-triangle-fill text-warning me-1"></i>Pendiente
                          </span>
                        )}
                      </div>

                      <div className="card-body p-4">
                        <div className="d-flex align-items-center mb-3">
                          <div className="bg-light text-primary rounded-circle p-3 me-3 d-flex align-items-center justify-content-center shadow-sm" style={{ width: '60px', height: '60px' }}>
                            <i className="bi bi-mortarboard-fill fs-3"></i>
                          </div>
                          <div>
                            <h5 className="fw-bolder text-dark mb-1">{est.nombres_estudiante}</h5>
                            <h6 className="fw-bold text-secondary mb-0">{est.apellidos_estudiante}</h6>
                          </div>
                        </div>

                        <div className="bg-light rounded-3 p-3 mb-4">
                          <div className="row g-2 text-center">
                            <div className="col-6 border-end">
                              <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Cédula / C. Escolar</small>
                              <span className="fw-bolder text-dark fs-6">{est.cedula_estudiante}</span>
                            </div>
                            <div className="col-6">
                              <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Grado & Sección</small>
                              <span className="fw-bolder text-primary fs-6">{est.grado_actual} "{est.seccion_actual}"</span>
                            </div>
                          </div>
                        </div>

                        {actualizado && (
                          <small className="text-muted d-block text-center mb-3">
                            <i className="bi bi-clock-history me-1"></i>Última modificación: {new Date(est.fecha_ultima_actualizacion).toLocaleDateString()}
                          </small>
                        )}

                        <button 
                          className="btn btn-primary w-100 py-3 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center"
                          onClick={() => abrirFichaEstudiante(est)}
                        >
                          <i className="bi bi-pencil-square me-2 fs-5"></i>
                          Actualizar Ficha Integral
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: FORMULARIO INTEGRAL DE ACTUALIZACIÓN CON IDENTIDAD BLOQUEADA */}
      {estudianteSeleccionado && (
        <form onSubmit={handleGuardarFicha} className="animate__animated animate__fadeInUp">
          <div className="row g-4">
            
            {/* SECCIÓN 1: IDENTIDAD PROTEGIDA E INMUTABLE (🔒 BLOQUEADA) */}
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white border-top border-warning border-4">
                <div className="d-flex align-items-center mb-4">
                  <div className="bg-warning bg-opacity-10 text-dark rounded-3 p-3 me-3 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                    <i className="bi bi-lock-fill fs-4 text-warning"></i>
                  </div>
                  <div>
                    <h4 className="fw-bolder text-dark mb-1">Identidad Primaria Protegida (Solo Lectura)</h4>
                    <p className="text-muted mb-0 small">
                      Por razones de seguridad e integridad legal del expediente, los datos de identidad no pueden ser modificados por el usuario.
                    </p>
                  </div>
                </div>

                <div className="alert alert-warning border-0 rounded-4 p-3 d-flex align-items-center mb-4">
                  <i className="bi bi-exclamation-triangle-fill fs-3 me-3 text-warning"></i>
                  <div className="small text-dark">
                    <b>Nota importante:</b> Si existe algún error ortográfico en los nombres, apellidos o en el número de cédula/cédula escolar del estudiante o representante, por favor acuda a la Dirección Escolar o Control de Estudios con la copia de la Partida de Nacimiento para solicitar su corrección oficial.
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fw-bold text-secondary small text-uppercase">Cédula o Cédula Escolar del Estudiante</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted fw-bold"><i className="bi bi-lock-fill"></i></span>
                      <input 
                        type="text" 
                        className="form-control bg-light fw-bold text-dark border-2" 
                        readOnly 
                        disabled 
                        value={estudianteSeleccionado.cedula_estudiante} 
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold text-secondary small text-uppercase">Nombres del Estudiante</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted fw-bold"><i className="bi bi-lock-fill"></i></span>
                      <input 
                        type="text" 
                        className="form-control bg-light fw-bold text-dark border-2" 
                        readOnly 
                        disabled 
                        value={estudianteSeleccionado.nombres_estudiante} 
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold text-secondary small text-uppercase">Apellidos del Estudiante</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted fw-bold"><i className="bi bi-lock-fill"></i></span>
                      <input 
                        type="text" 
                        className="form-control bg-light fw-bold text-dark border-2" 
                        readOnly 
                        disabled 
                        value={estudianteSeleccionado.apellidos_estudiante} 
                      />
                    </div>
                  </div>

                  <div className="col-md-4 mt-3">
                    <label className="form-label fw-bold text-secondary small text-uppercase">Cédula del Representante Legal</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted fw-bold"><i className="bi bi-lock-fill"></i></span>
                      <input 
                        type="text" 
                        className="form-control bg-light fw-bold text-dark border-2" 
                        readOnly 
                        disabled 
                        value={estudianteSeleccionado.cedula_representante} 
                      />
                    </div>
                  </div>
                  <div className="col-md-4 mt-3">
                    <label className="form-label fw-bold text-secondary small text-uppercase">Nombres y Apellidos del Representante</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted fw-bold"><i className="bi bi-lock-fill"></i></span>
                      <input 
                        type="text" 
                        className="form-control bg-light fw-bold text-dark border-2" 
                        readOnly 
                        disabled 
                        value={`${estudianteSeleccionado.nombres_representante} ${estudianteSeleccionado.apellidos_representante}`} 
                      />
                    </div>
                  </div>
                  <div className="col-md-4 mt-3">
                    <label className="form-label fw-bold text-secondary small text-uppercase">Grado y Sección Actual</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted fw-bold"><i className="bi bi-lock-fill"></i></span>
                      <input 
                        type="text" 
                        className="form-control bg-light fw-bold text-primary border-2" 
                        readOnly 
                        disabled 
                        value={`${estudianteSeleccionado.grado_actual} "${estudianteSeleccionado.seccion_actual}"`} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pestañas de Navegación del Formulario Editable */}
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5">
                <ul className="nav nav-pills nav-fill mb-4 border-bottom pb-3 gap-2">
                  <li className="nav-item">
                    <button 
                      type="button" 
                      className={`nav-link py-3 fw-bold rounded-3 ${pestañaFicha === 'residencia' ? 'active shadow-sm' : 'text-dark bg-light'}`}
                      onClick={() => setPestañaFicha('residencia')}
                    >
                      <i className="bi bi-house-door-fill me-2"></i>1. Residencia y Contactos
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      type="button" 
                      className={`nav-link py-3 fw-bold rounded-3 ${pestañaFicha === 'salud' ? 'active shadow-sm' : 'text-dark bg-light'}`}
                      onClick={() => setPestañaFicha('salud')}
                    >
                      <i className="bi bi-heart-pulse-fill me-2"></i>2. Biometría, Uniformes y Salud
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      type="button" 
                      className={`nav-link py-3 fw-bold rounded-3 ${pestañaFicha === 'autorizados' ? 'active shadow-sm' : 'text-dark bg-light'}`}
                      onClick={() => setPestañaFicha('autorizados')}
                    >
                      <i className="bi bi-shield-check me-2"></i>3. Logística y Personas Autorizadas
                    </button>
                  </li>
                </ul>

                {/* SUBSECCIÓN 1: RESIDENCIA Y CONTACTOS */}
                {pestañaFicha === 'residencia' && (
                  <div className="row g-3 animate__animated animate__fadeIn">
                    <h5 className="fw-bold text-dark mb-3"><i className="bi bi-geo-alt-fill text-primary me-2"></i>Ubicación de Residencia</h5>
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-secondary">Dirección de Habitación Exacta <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required 
                        placeholder="Ej: Av. Principal, Res. Las Margaritas, Piso 2, Apto 2B"
                        value={ficha.direccion}
                        onChange={(e) => setFicha({ ...ficha, direccion: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold text-secondary">Municipio</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={ficha.municipio}
                        onChange={(e) => setFicha({ ...ficha, municipio: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold text-secondary">Parroquia</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={ficha.parroquia}
                        onChange={(e) => setFicha({ ...ficha, parroquia: e.target.value })}
                      />
                    </div>

                    <h5 className="fw-bold text-dark mb-3 mt-4 pt-3 border-top"><i className="bi bi-telephone-fill text-primary me-2"></i>Teléfonos de Contacto Inmediato</h5>
                    <div className="col-md-4">
                      <label className="form-label fw-bold text-secondary">Teléfono Móvil (Representante) <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required 
                        placeholder="Ej: 0414-1234567"
                        value={ficha.telefono_movil}
                        onChange={(e) => setFicha({ ...ficha, telefono_movil: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold text-secondary">Teléfono de Emergencia Adicional <span className="text-danger">*</span></label>
                      <input 
                        type="text" 
                        className="form-control" 
                        required 
                        placeholder="Ej: 0424-7654321 (Abuelo o Madre)"
                        value={ficha.telefono_emergencia}
                        onChange={(e) => setFicha({ ...ficha, telefono_emergencia: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold text-secondary">Teléfono Habitación / Fijo</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Ej: 0281-2812345"
                        value={ficha.telefono_habitacion}
                        onChange={(e) => setFicha({ ...ficha, telefono_habitacion: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mt-3">
                      <label className="form-label fw-bold text-secondary">Correo Electrónico Familiar <span className="text-danger">*</span></label>
                      <input 
                        type="email" 
                        className="form-control" 
                        required 
                        placeholder="Ej: familia.perez@gmail.com"
                        value={ficha.email_familiar}
                        onChange={(e) => setFicha({ ...ficha, email_familiar: e.target.value })}
                      />
                    </div>
                    
                    <div className="col-12 mt-4 text-end">
                      <button type="button" className="btn btn-primary px-4 fw-bold" onClick={() => setPestañaFicha('salud')}>
                        Siguiente: Biometría y Salud <i className="bi bi-arrow-right ms-2"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* SUBSECCIÓN 2: BIOMETRÍA, UNIFORMES Y SALUD */}
                {pestañaFicha === 'salud' && (
                  <div className="row g-3 animate__animated animate__fadeIn">
                    <h5 className="fw-bold text-dark mb-3"><i className="bi bi-rulers text-primary me-2"></i>Biometría y Tallas para Uniformes</h5>
                    <div className="col-md-2">
                      <label className="form-label fw-bold text-secondary">Peso (Kg)</label>
                      <input 
                        type="text" 
                        className="form-control text-center fw-bold" 
                        placeholder="Ej: 32 kg"
                        value={ficha.peso_kg}
                        onChange={(e) => setFicha({ ...ficha, peso_kg: e.target.value })}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fw-bold text-secondary">Estatura (cm)</label>
                      <input 
                        type="text" 
                        className="form-control text-center fw-bold" 
                        placeholder="Ej: 135 cm"
                        value={ficha.estatura_cm}
                        onChange={(e) => setFicha({ ...ficha, estatura_cm: e.target.value })}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label fw-bold text-secondary">Talla Camisa</label>
                      <select className="form-select text-center fw-bold" value={ficha.talla_camisa} onChange={(e) => setFicha({ ...ficha, talla_camisa: e.target.value })}>
                        {['4', '6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold text-secondary">Talla Pantalón / Mono</label>
                      <select className="form-select text-center fw-bold" value={ficha.talla_pantalon} onChange={(e) => setFicha({ ...ficha, talla_pantalon: e.target.value })}>
                        {['4', '6', '8', '10', '12', '14', '16', '28', '30', '32', '34'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label fw-bold text-secondary">Talla Calzado</label>
                      <select className="form-select text-center fw-bold" value={ficha.talla_calzado} onChange={(e) => setFicha({ ...ficha, talla_calzado: e.target.value })}>
                        {['28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <h5 className="fw-bold text-dark mb-3 mt-4 pt-3 border-top"><i className="bi bi-activity text-danger me-2"></i>Ficha Médica y Salud Estudiantil</h5>
                    <div className="col-md-3">
                      <label className="form-label fw-bold text-secondary">Tipo de Sangre</label>
                      <select className="form-select fw-bold" value={ficha.tipo_sangre} onChange={(e) => setFicha({ ...ficha, tipo_sangre: e.target.value })}>
                        {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-bold text-secondary">Alergias Conocidas (Medicamentos, Alimentos, Picaduras)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Ej: Penicilina, Ibuprofeno, Maní o Ninguna"
                        value={ficha.alergias}
                        onChange={(e) => setFicha({ ...ficha, alergias: e.target.value })}
                      />
                    </div>
                    <div className="col-md-3 d-flex align-items-center mt-4 pt-2">
                      <div className="form-check form-switch fs-6">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="chkVacunas"
                          checked={ficha.vacunas_completas}
                          onChange={(e) => setFicha({ ...ficha, vacunas_completas: e.target.checked })}
                        />
                        <label className="form-check-label fw-bold" htmlFor="chkVacunas">¿Esquema de Vacunas al día?</label>
                      </div>
                    </div>

                    <div className="col-md-4 mt-3">
                      <div className="form-check form-switch fs-6">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="chkCondicion"
                          checked={ficha.tiene_condicion_medica}
                          onChange={(e) => setFicha({ ...ficha, tiene_condicion_medica: e.target.checked })}
                        />
                        <label className="form-check-label fw-bold text-dark" htmlFor="chkCondicion">¿Posee alguna Condición Médica o Neurodivergencia?</label>
                      </div>
                    </div>
                    {ficha.tiene_condicion_medica && (
                      <div className="col-md-8 mt-3 animate__animated animate__fadeIn">
                        <label className="form-label fw-bold text-secondary">Especifique Condición y Tratamiento / Recomendaciones</label>
                        <input 
                          type="text" 
                          className="form-control border-primary" 
                          placeholder="Ej: Asma leve, TEA, TDAH, Uso de lentes permanentes..."
                          value={ficha.detalle_condicion_medica}
                          onChange={(e) => setFicha({ ...ficha, detalle_condicion_medica: e.target.value })}
                        />
                      </div>
                    )}

                    <div className="col-12 mt-4 d-flex justify-content-between">
                      <button type="button" className="btn btn-light px-4 fw-bold" onClick={() => setPestañaFicha('residencia')}>
                        <i className="bi bi-arrow-left me-2"></i>Anterior
                      </button>
                      <button type="button" className="btn btn-primary px-4 fw-bold" onClick={() => setPestañaFicha('autorizados')}>
                        Siguiente: Logística y Retiro <i className="bi bi-arrow-right ms-2"></i>
                      </button>
                    </div>
                  </div>
                )}

                {/* SUBSECCIÓN 3: LOGÍSTICA Y PERSONAS AUTORIZADAS */}
                {pestañaFicha === 'autorizados' && (
                  <div className="row g-3 animate__animated animate__fadeIn">
                    <h5 className="fw-bold text-dark mb-3"><i className="bi bi-bus-front-fill text-primary me-2"></i>Logística y Transporte Escolar</h5>
                    <div className="col-md-4">
                      <div className="form-check form-switch fs-6 mt-2">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="chkTransporte"
                          checked={ficha.requiere_transporte}
                          onChange={(e) => setFicha({ ...ficha, requiere_transporte: e.target.checked })}
                        />
                        <label className="form-check-label fw-bold text-dark" htmlFor="chkTransporte">¿Requiere servicio de Transporte Escolar?</label>
                      </div>
                    </div>
                    {ficha.requiere_transporte && (
                      <div className="col-md-8 animate__animated animate__fadeIn">
                        <label className="form-label fw-bold text-secondary">Especifique Sector o Parada de Preferencia</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Ej: Parada Guaraguao o Lechería..."
                          value={ficha.comentarios_transporte}
                          onChange={(e) => setFicha({ ...ficha, comentarios_transporte: e.target.value })}
                        />
                      </div>
                    )}

                    <h5 className="fw-bold text-dark mb-3 mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
                      <span><i className="bi bi-people-fill text-success me-2"></i>Personas Autorizadas para Retirar al Estudiante (Máx 3)</span>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-success rounded-pill px-3 fw-bold"
                        onClick={agregarPersonaAutorizada}
                        disabled={ficha.personas_autorizadas.length >= 3}
                      >
                        <i className="bi bi-plus-lg me-1"></i>Agregar Persona Autorizada
                      </button>
                    </h5>
                    <p className="text-muted small mb-3">
                      Estas personas estarán facultadas para retirar al estudiante de la institución en caso de que el representante legal no pueda acudir personalmente.
                    </p>

                    {ficha.personas_autorizadas.length === 0 ? (
                      <div className="text-center py-4 bg-light rounded-4 text-muted">
                        <i className="bi bi-person-plus fs-2 d-block mb-2"></i>
                        No ha agregado personas autorizadas adicionales. Presione el botón verde arriba para agregar.
                      </div>
                    ) : (
                      <div className="row g-3">
                        {ficha.personas_autorizadas.map((pa, idx) => (
                          <div className="col-12" key={idx}>
                            <div className="card border rounded-3 p-3 bg-light position-relative">
                              <button 
                                type="button" 
                                className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle"
                                onClick={() => eliminarPersonaAutorizada(idx)}
                                title="Eliminar persona"
                              >
                                <i className="bi bi-x-lg"></i>
                              </button>
                              <div className="row g-2 align-items-end pe-4">
                                <div className="col-md-3">
                                  <label className="form-label small fw-bold text-secondary mb-1">Cédula de Identidad</label>
                                  <input 
                                    type="text" 
                                    className="form-control form-control-sm fw-bold" 
                                    placeholder="Ej: 11222333"
                                    value={pa.cedula}
                                    onChange={(e) => actualizarPersonaAutorizada(idx, 'cedula', e.target.value)}
                                  />
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label small fw-bold text-secondary mb-1">Nombres Completos</label>
                                  <input 
                                    type="text" 
                                    className="form-control form-control-sm" 
                                    placeholder="Nombres"
                                    value={pa.nombres}
                                    onChange={(e) => handleTituloChange(e, (val: string) => actualizarPersonaAutorizada(idx, 'nombres', val))}
                                  />
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label small fw-bold text-secondary mb-1">Apellidos Completos</label>
                                  <input 
                                    type="text" 
                                    className="form-control form-control-sm" 
                                    placeholder="Apellidos"
                                    value={pa.apellidos}
                                    onChange={(e) => handleTituloChange(e, (val: string) => actualizarPersonaAutorizada(idx, 'apellidos', val))}
                                  />
                                </div>
                                <div className="col-md-2">
                                  <label className="form-label small fw-bold text-secondary mb-1">Parentesco</label>
                                  <select 
                                    className="form-select form-select-sm fw-bold"
                                    value={pa.parentesco}
                                    onChange={(e) => actualizarPersonaAutorizada(idx, 'parentesco', e.target.value)}
                                  >
                                    <option value="Abuelo(a)">Abuelo(a)</option>
                                    <option value="Tío(a)">Tío(a)</option>
                                    <option value="Hermano(a) Mayor">Hermano(a) Mayor</option>
                                    <option value="Transportista / Escolar">Transportista / Escolar</option>
                                    <option value="Familiar Cercano">Familiar Cercano</option>
                                  </select>
                                </div>
                                <div className="col-md-1">
                                  <label className="form-label small fw-bold text-secondary mb-1">Teléfono</label>
                                  <input 
                                    type="text" 
                                    className="form-control form-control-sm" 
                                    placeholder="0414..."
                                    value={pa.telefono}
                                    onChange={(e) => actualizarPersonaAutorizada(idx, 'telefono', e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="col-12 mt-5 d-flex justify-content-between border-top pt-4">
                      <button type="button" className="btn btn-light px-4 fw-bold" onClick={() => setPestañaFicha('salud')}>
                        <i className="bi bi-arrow-left me-2"></i>Anterior
                      </button>
                      <button type="submit" className="btn btn-success btn-lg px-5 fw-bold shadow" disabled={loading}>
                        {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save2-fill me-2"></i>}
                        Guardar y Actualizar Ficha Integral
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </form>
      )}
    </div>
  );
};
