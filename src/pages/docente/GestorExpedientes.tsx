import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { usePermisos } from '../../hooks/usePermisos';
import { formatPhoneNumber } from '../../lib/formatters';

interface DocenteFila {
  cedula: string;
  nombre: string;
  rol: string;
  escuela: string;
  email: string;
  telefono: string;
  estado: string;
  tipo_nomina?: string;
  estatus_laboral?: string;
  documentos?: any;
  datos_vivienda?: any;
  vacaciones_desde?: string;
  vacaciones_hasta?: string;
  dias_habiles?: number;
  dias_continuos?: number;
  fecha_retorno?: string;
  fecha_aniversaria?: string;
  periodo_vacacional?: string;
  cargo_actual?: string;
  indicador?: string;
  supervisor_nombre?: string;
  supervisor_cedula?: string;
  supervisor_telefono?: string;
  n_personal?: string;
}

const DOCENTES_DEMO: DocenteFila[] = [
  {
    cedula: '99887766',
    nombre: 'Pedro Alejandro Pérez Gómez',
    rol: 'Docente',
    escuela: 'lb',
    email: 'pedro.perez@example.com',
    telefono: '04129998877',
    estado: 'Activo',
    tipo_nomina: 'Fijo',
    estatus_laboral: 'Activo',
    documentos: { cedula: true, titulo: true, cv: true, constancia: true },
    datos_vivienda: { prioridad: '3.) REQUIERE ATENCIÓN NORMAL' }
  },
  {
    cedula: '18992834',
    nombre: 'Ana María Cordero',
    rol: 'Docente',
    escuela: 'sb',
    email: 'ana.cordero@gmail.com',
    telefono: '04148773757',
    estado: 'Activo',
    tipo_nomina: 'Fijo',
    estatus_laboral: 'Activo',
    documentos: { cedula: true, titulo: true, cv: false, constancia: true },
    datos_vivienda: { prioridad: '1.) REQUIERE ATENCIÓN INMEDIATA' }
  },
  {
    cedula: '15432890',
    nombre: 'Pedro José Rivas',
    rol: 'Docente',
    escuela: 'lb',
    email: 'pedro.rivas@hotmail.com',
    telefono: '04123048596',
    estado: 'Activo',
    tipo_nomina: 'Contratado',
    estatus_laboral: 'Activo',
    documentos: { cedula: true, titulo: true, cv: true, constancia: true },
    datos_vivienda: { prioridad: '3.) REQUIERE ATENCIÓN NORMAL' }
  },
  {
    cedula: '19283472',
    nombre: 'María Alejandra Rojas',
    rol: 'Docente',
    escuela: 'sb',
    email: 'maria.rojas@outlook.com',
    telefono: '04269876543',
    estado: 'Activo',
    tipo_nomina: 'Fijo',
    estatus_laboral: 'De Permiso',
    documentos: { cedula: false, titulo: false, cv: false, constancia: false },
    datos_vivienda: { prioridad: '3.) REQUIERE ATENCIÓN NORMAL' }
  }
];

export const GestorExpedientes = () => {
  const navigate = useNavigate();
  const { tienePermiso, loading: permLoading } = usePermisos();

  const [docentes, setDocentes] = useState<DocenteFila[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroEscuela, setFiltroEscuela] = useState('todas');
  const [filtroEstatus, setFiltroEstatus] = useState('todos');
  const [isDemoMode, setIsDemoMode] = useState(false);

  const hasAccess = tienePermiso('Gestor de Expedientes', 'ver');

  const isExpedienteCompleto = (doc: any) => {
    if (!doc) return false;
    return !!(doc.cedula && doc.titulo && doc.cv && doc.constancia);
  };

  useEffect(() => {
    if (permLoading) return;
    if (!hasAccess) {
      setLoading(false);
      return;
    }

    const cargarDocentes = async () => {
      setLoading(true);
      try {
        const { data: dbUsuarios, error: userError } = await supabase
          .from('usuarios')
          .select('cedula, nombre_completo, rol, id_escuela, email, telefono, estado')
          .order('nombre_completo', { ascending: true });

        if (userError) throw userError;

        const { data: dbExpedientes, error: expError } = await supabase
          .from('expedientes_docentes')
          .select('*');

        if (expError) {
          console.error("Error al cargar expedientes_docentes:", expError);
        }

        // Cruzar datos
        const mapeados = (dbUsuarios || [])
          .filter(u => u.rol === 'Docente' || u.rol === 'Docente Invitado' || u.rol === 'Administrador')
          .map(u => {
            const exp = (dbExpedientes || []).find(e => e.usuario_cedula === u.cedula);
            return {
              cedula: u.cedula,
              nombre: u.nombre_completo || 'Sin nombre',
              rol: u.rol,
              escuela: u.id_escuela || 'sb',
              email: u.email || '',
              telefono: u.telefono || '',
              estado: u.estado || 'Activo',
              tipo_nomina: exp?.tipo_nomina || 'No registrado',
              estatus_laboral: exp?.estatus_laboral || 'No registrado',
              documentos: exp?.documentos || null,
              datos_vivienda: exp?.datos_vivienda || null,
              vacaciones_desde: exp?.vacaciones_desde || '',
              vacaciones_hasta: exp?.vacaciones_hasta || '',
              dias_habiles: exp?.dias_habiles || 0,
              dias_continuos: exp?.dias_continuos || 0,
              fecha_retorno: exp?.fecha_retorno || '',
              fecha_aniversaria: exp?.fecha_aniversaria || '',
              periodo_vacacional: exp?.periodo_vacacional || '',
              cargo_actual: exp?.cargo_actual || '',
              indicador: exp?.indicador || '',
              supervisor_nombre: exp?.supervisor_nombre || '',
              supervisor_cedula: exp?.supervisor_cedula || '',
              supervisor_telefono: exp?.supervisor_telefono || '',
              n_personal: exp?.n_personal || ''
            };
          });

        setDocentes(mapeados);
        setIsDemoMode(false);
      } catch (err: any) {
        console.warn("Falla al conectar a Supabase, cargando simulador local:", err.message);
        setIsDemoMode(true);
        // Intentar leer de localStorage si hay algún borrador general guardado
        const localData = localStorage.getItem('sigae_gestor_expedientes_demo');
        if (localData) {
          try {
            setDocentes(JSON.parse(localData));
          } catch (e) {
            setDocentes(DOCENTES_DEMO);
          }
        } else {
          setDocentes(DOCENTES_DEMO);
        }
      } finally {
        setLoading(false);
      }
    };

    cargarDocentes();
  }, [permLoading, hasAccess]);

  const handleVerExpediente = (cedula: string) => {
    navigate(`/categoria/Gesti%C3%B3n%20Docente/Mi%20Expediente?cedula=${cedula}`);
  };

  const filteredDocentes = docentes.filter(d => {
    const cumpleTexto = d.nombre.toLowerCase().includes(filtroTexto.toLowerCase()) || 
                         d.cedula.includes(filtroTexto);
    const cumpleEscuela = filtroEscuela === 'todas' || d.escuela === filtroEscuela;
    const cumpleEstatus = filtroEstatus === 'todos' || 
                          (filtroEstatus === 'activo' && d.estado === 'Activo') ||
                          (filtroEstatus === 'inactivo' && d.estado !== 'Activo');
    return cumpleTexto && cumpleEscuela && cumpleEstatus;
  });

  const exportarPlanPAAV = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      alert("La librería de Excel (SheetJS) no está cargada. Por favor, recarga la página.");
      return;
    }

    const splitFullNombre = (fullName: string) => {
      const parts = (fullName || '').trim().split(/\s+/);
      let nombres = '';
      let segundoNombre = '';
      let apellidos = '';

      if (parts.length >= 4) {
        nombres = parts[0];
        segundoNombre = parts[1];
        apellidos = parts.slice(2).join(' ');
      } else if (parts.length === 3) {
        nombres = parts[0];
        segundoNombre = parts[1];
        apellidos = parts[2];
      } else if (parts.length === 2) {
        nombres = parts[0];
        apellidos = parts[1];
      } else {
        nombres = parts[0] || '';
      }

      return { nombres, segundoNombre, apellidos };
    };

    const calculateYearsOfService = (fechaIngresoStr: string): number => {
      if (!fechaIngresoStr) return 0;
      const ingresoDate = new Date(fechaIngresoStr);
      if (isNaN(ingresoDate.getTime())) return 0;
      const today = new Date();
      let years = today.getFullYear() - ingresoDate.getFullYear();
      const m = today.getMonth() - ingresoDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < ingresoDate.getDate())) {
        years--;
      }
      return years >= 0 ? years : 0;
    };

    const formatExcelDate = (dateStr: string): string => {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const headers = [
      "ESCUELA",
      "N.º",
      "Cédula",
      "Apellido(s)",
      "Nombre (s)",
      "Escuela(s)",
      "Nº de Personal",
      "Fecha Aniversaria",
      "Años Servicio",
      "Correspondiente al Periodo vacacional:",
      "Desde",
      "Hasta",
      "Total Días",
      "Correspondiente al Periodo (s)  vacacional:",
      "Indicador",
      "Teléfono",
      "N.º",
      "Supervisor Inmed. / Indicador /Tlf"
    ];

    const dataRows = filteredDocentes.map((d, index) => {
      const { nombres, segundoNombre, apellidos } = splitFullNombre(d.nombre);
      const fAniv = d.fecha_aniversaria || '';
      const years = calculateYearsOfService(fAniv);

      return [
        index + 1,
        d.cedula,
        d.cargo_actual || d.tipo_nomina || 'Docente',
        apellidos,
        nombres,
        d.n_personal || '',
        fAniv ? formatExcelDate(fAniv) : '',
        years,
        d.periodo_vacacional || '2025-2026',
        d.vacaciones_desde ? formatExcelDate(d.vacaciones_desde) : '',
        d.vacaciones_hasta ? formatExcelDate(d.vacaciones_hasta) : '',
        d.dias_continuos || 0,
        d.periodo_vacacional || '2025-2026',
        segundoNombre || (d.escuela === 'sb' ? 'U.E. SANTA BÁRBARA' : 'U.E. LIBERTADOR BOLÍVAR'),
        d.indicador || '',
        d.supervisor_nombre || '',
        d.supervisor_cedula || '',
        d.supervisor_telefono || ''
      ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Planificación PAAV");

    // Auto-adjust column widths
    const colWidths = new Array(headers.length).fill(10);
    [headers, ...dataRows].forEach((row) => {
      row.forEach((val, col_idx) => {
        const strVal = String(val || '');
        const col_width = strVal.length + 2;
        if (col_idx < colWidths.length && col_width > colWidths[col_idx]) {
          colWidths[col_idx] = col_width;
        }
      });
    });
    worksheet['!cols'] = colWidths.map(w => ({ wch: w }));

    XLSX.writeFile(workbook, `PAAV_Plan_Vacacional_${filtroEscuela === 'todas' ? 'General' : filtroEscuela.toUpperCase()}_${new Date().getFullYear()}.xlsx`);
  };

  // Métricas
  const totalDocentes = filteredDocentes.length;
  
  const countValidados = filteredDocentes.filter(d => isExpedienteCompleto(d.documentos)).length;
  
  const countCriticos = filteredDocentes.filter(d => 
    d.datos_vivienda?.prioridad?.includes('INMEDIATA') || 
    d.datos_vivienda?.prioridad?.startsWith('1')
  ).length;

  const countEnVacaciones = filteredDocentes.filter(d => {
    if (!d.vacaciones_desde || !d.vacaciones_hasta) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const desde = new Date(d.vacaciones_desde);
    const hasta = new Date(d.vacaciones_hasta);
    return today >= desde && today <= hasta;
  }).length;

  if (permLoading || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Cargando Gestor de Expedientes...</span>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container py-5 text-center">
        <div className="card shadow-sm border-0 p-5 rounded-4 bg-white">
          <div className="text-danger mb-4">
            <i className="bi bi-shield-slash fs-1"></i>
          </div>
          <h2 className="fw-bold mb-3 text-dark">Acceso Restringido</h2>
          <p className="text-muted">No posees los privilegios necesarios para ver el Gestor de Expedientes.</p>
          <button onClick={() => navigate('/')} className="btn btn-success rounded-pill px-4 mt-3">
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modulo-animado container py-4 animate__animated animate__fadeIn">
      {/* Header Banner */}
      <div className="row mb-4">
        <div className="col-12">
          <div 
            className="banner-modulo p-4 p-md-5 text-white position-relative overflow-hidden rounded-4 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
          >
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
              <div>
                <span className="badge bg-white text-success px-3 py-2 shadow-sm fw-bold mb-3">
                  <i className="bi bi-folder-symlink me-1"></i> CONTROL ADMINISTRATIVO
                </span>
                <h1 className="fw-bolder mb-1 text-white" style={{ fontSize: '2.4rem' }}>Gestor de Expedientes Docentes</h1>
                <p className="mb-0 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Administración de expedientes únicos, historial de carrera y planes vacacionales del personal.
                </p>
              </div>
              <div>
                {isDemoMode && (
                  <span className="badge bg-warning text-dark border shadow-sm px-3 py-2 fw-bold animate__animated animate__pulse animate__infinite">
                    <i className="bi bi-sim-fill me-1"></i> Modo Simulación Activa
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas Estadísticas */}
      <div className="row g-3 mb-4">
        {/* Card 1: Total Docentes */}
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white d-flex flex-row align-items-center justify-content-between border-start border-4 border-primary" style={{ minHeight: '100px' }}>
            <div>
              <span className="small fw-bold text-muted d-block text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>Total Docentes</span>
              <span className="fs-2 fw-extrabold text-primary">{totalDocentes}</span>
            </div>
            <div className="bg-primary bg-opacity-10 text-primary p-2.5 rounded-3 fs-3">
              <i className="bi bi-people-fill"></i>
            </div>
          </div>
        </div>

        {/* Card 2: Validados RRHH */}
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white d-flex flex-row align-items-center justify-content-between border-start border-4 border-success" style={{ minHeight: '100px' }}>
            <div>
              <span className="small fw-bold text-muted d-block text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>Validados RRHH</span>
              <span className="fs-2 fw-extrabold text-success">{countValidados}</span>
            </div>
            <div className="bg-success bg-opacity-10 text-success p-2.5 rounded-3 fs-3">
              <i className="bi bi-shield-check"></i>
            </div>
          </div>
        </div>

        {/* Card 3: Casos PAAV Críticos */}
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white d-flex flex-row align-items-center justify-content-between border-start border-4 border-danger" style={{ minHeight: '100px' }}>
            <div>
              <span className="small fw-bold text-muted d-block text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>PAAV Críticos</span>
              <span className="fs-2 fw-extrabold text-danger">{countCriticos}</span>
            </div>
            <div className="bg-danger bg-opacity-10 text-danger p-2.5 rounded-3 fs-3">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
          </div>
        </div>

        {/* Card 4: En Vacaciones */}
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white d-flex flex-row align-items-center justify-content-between border-start border-4 border-purple" style={{ minHeight: '100px', borderLeftColor: '#8b5cf6 !important' }}>
            <div>
              <span className="small fw-bold text-muted d-block text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>En Vacaciones</span>
              <span className="fs-2 fw-extrabold" style={{ color: '#8b5cf6' }}>{countEnVacaciones}</span>
            </div>
            <div className="bg-purple bg-opacity-10 p-2.5 rounded-3 fs-3" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <i className="bi bi-calendar-range-fill"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <label className="small fw-bold text-muted mb-1">Buscar Docente</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-0"><i className="bi bi-search text-muted"></i></span>
              <input 
                type="text" 
                className="form-control bg-light border-0 input-moderno" 
                placeholder="Nombre o número de cédula..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
              />
            </div>
          </div>

          <div className="col-12 col-md-3">
            <label className="small fw-bold text-muted mb-1">Filtrar por Escuela</label>
            <select 
              className="form-select bg-light border-0 input-moderno" 
              value={filtroEscuela}
              onChange={(e) => setFiltroEscuela(e.target.value)}
            >
              <option value="todas">Todas las Escuelas</option>
              <option value="sb">U.E. Santa Bárbara</option>
              <option value="lb">U.E. Libertador Bolívar</option>
            </select>
          </div>

          <div className="col-12 col-md-3">
            <label className="small fw-bold text-muted mb-1">Filtrar por Estatus Usuario</label>
            <select 
              className="form-select bg-light border-0 input-moderno" 
              value={filtroEstatus}
              onChange={(e) => setFiltroEstatus(e.target.value)}
            >
              <option value="todos">Todos los Estatus</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos / Suspendidos</option>
            </select>
          </div>

          <div className="col-12 col-md-2 d-flex align-items-end">
            <button 
              onClick={exportarPlanPAAV}
              className="btn btn-success w-100 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 hover-efecto"
              style={{ height: '38px', backgroundColor: '#059669', borderColor: '#059669', transition: 'all 0.2s' }}
            >
              <i className="bi bi-file-earmark-excel-fill"></i>
              Exportar PAAV
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Docentes */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-uppercase fs-7 text-muted fw-bold">
              <tr>
                <th className="px-4 py-3">Docente / Cédula</th>
                <th className="py-3">Escuela</th>
                <th className="py-3">Contacto</th>
                <th className="py-3">Tipo Nómina</th>
                <th className="py-3">Expediente</th>
                <th className="py-3">Estatus Laboral</th>
                <th className="py-3 text-end px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocentes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    <i className="bi bi-person-x fs-1 mb-2 d-block"></i>
                    No se encontraron docentes con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredDocentes.map((d) => (
                  <tr key={d.cedula}>
                    <td className="px-4 py-3">
                      <div className="d-flex align-items-center">
                        <div className="avatar-inicial me-3 d-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 text-success fw-bold" style={{ width: '40px', height: '40px' }}>
                          {d.nombre.charAt(0)}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{d.nombre}</div>
                          <div className="small text-muted">C.I. {d.cedula}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${d.escuela === 'sb' ? 'bg-primary' : 'bg-success'} bg-opacity-10 text-${d.escuela === 'sb' ? 'primary' : 'success'} px-2 py-1.5 fw-bold`}>
                        {d.escuela === 'sb' ? 'Santa Bárbara' : 'Libertador Bolívar'}
                      </span>
                    </td>
                    <td>
                      <div className="small text-dark">{d.email}</div>
                      <div className="small text-muted">{formatPhoneNumber(d.telefono)}</div>
                    </td>
                    <td>
                      <span className="fw-bold small text-secondary">{d.tipo_nomina}</span>
                    </td>
                    <td>
                      {isExpedienteCompleto(d.documentos) ? (
                        <span className="badge bg-success bg-opacity-15 text-success rounded-pill px-2.5 py-1 fw-bold">
                          <i className="bi bi-check-circle-fill me-1"></i>Completo
                        </span>
                      ) : (
                        <span className="badge bg-warning bg-opacity-15 text-warning rounded-pill px-2.5 py-1 fw-bold">
                          <i className="bi bi-exclamation-triangle-fill me-1"></i>Incompleto
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge rounded-pill px-2.5 py-1 ${
                        d.estatus_laboral === 'Activo' ? 'bg-success bg-opacity-15 text-success' : 'bg-warning bg-opacity-15 text-warning'
                      } fw-bold`}>
                        {d.estatus_laboral || 'No registrado'}
                      </span>
                    </td>
                    <td className="text-end px-4">
                      <button 
                        onClick={() => handleVerExpediente(d.cedula)}
                        className="btn btn-sm btn-success text-white rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                      >
                        <i className="bi bi-folder2-open me-1"></i> Ver Ficha
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
  );
};
