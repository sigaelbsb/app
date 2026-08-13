import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { obtenerDatosDirectorAsync, obtenerFirmaDirectorProtegida } from '../../utils/firmasSeguras';

interface VinculacionData {
  id?: string;
  cedula_estudiante: string;
  nombres_estudiante: string;
  apellidos_estudiante: string;
  grado_actual: string;
  seccion_actual?: string;
  codigo_escuela?: string;
  nombre_escuela?: string;
  cedula_representante?: string;
  nombres_representante?: string;
  apellidos_representante?: string;
  datos_actualizados?: any;
  fecha_ultima_actualizacion?: string;
  codigo_unico?: string;
  estado_actualizacion?: 'actualizado' | 'en_proceso' | 'desactualizado' | 'sin_actualizar';
}

interface SolicitudCupoData {
  id?: string;
  codigo_unico: string;
  estudiante_nombres: string;
  estudiante_apellidos: string;
  estudiante_cedula: string;
  estudiante_fecha_nac?: string;
  grado_solicitado: string;
  codigo_escuela: string;
  estado: string;
  prioridad?: string;
  fecha_solicitud?: string;
  representante_nombres: string;
  representante_apellidos: string;
  representante_cedula: string;
  representante_telefono?: string;
  representante_email?: string;
  representante_tipo?: string;
  requiere_transporte?: boolean;
  ruta_transporte?: string;
  observaciones?: string;
}

export const Verificaciones: React.FC = () => {
  const [codigoBusqueda, setCodigoBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  // Resultados
  const [vinculacion, setVinculacion] = useState<VinculacionData | null>(null);
  const [solicitudCupo, setSolicitudCupo] = useState<SolicitudCupoData | null>(null);
  const [historialReciente, setHistorialReciente] = useState<any[]>([]);

  // Vista activa de documento
  const [vistaDoc, setVistaDoc] = useState<'constancia' | 'cupo'>('constancia');
  const [generandoPdf, setGenerandoPdf] = useState(false);

  // Firma y datos de director
  const [dirInfo, setDirInfo] = useState<any>(null);
  const [firmaBase64, setFirmaBase64] = useState<string>('');

  const docRef = useRef<HTMLDivElement>(null);
  const Swal = (window as any).Swal;

  useEffect(() => {
    cargarRecientes();
  }, []);

  const cargarRecientes = async () => {
    try {
      const { data: vincs } = await supabase
        .from('estudiantes_vinculaciones')
        .select('cedula_estudiante, nombres_estudiante, apellidos_estudiante, grado_actual, codigo_escuela, fecha_ultima_actualizacion, codigo_unico, datos_actualizados')
        .order('fecha_ultima_actualizacion', { ascending: false })
        .limit(5);

      if (vincs) {
        setHistorialReciente(vincs);
      }
    } catch (e) {
      console.error('Error cargando recientes', e);
    }
  };

  const calcularEstatusActualizacion = (datos: VinculacionData): { estado: string; color: string; badge: string; desc: string } => {
    const d = datos.datos_actualizados || {};
    const tieneCamposClave = d.estudiante_nombres && d.estudiante_apellidos && d.representante_cedula && d.direccion_vivienda;
    const fecha = datos.fecha_ultima_actualizacion ? new Date(datos.fecha_ultima_actualizacion) : null;
    
    if (!fecha || !tieneCamposClave) {
      return {
        estado: 'Sin Actualizar / Incompleto',
        color: 'secondary',
        badge: 'bg-secondary',
        desc: 'El estudiante no ha completado el formulario de Ficha Integral.'
      };
    }

    const diasTranscurridos = (Date.now() - fecha.getTime()) / (1000 * 60 * 60 * 24);
    if (diasTranscurridos > 180) {
      return {
        estado: 'Desactualizado',
        color: 'danger',
        badge: 'bg-danger',
        desc: `Requiere actualización obligatoria (última vez hace ${Math.floor(diasTranscurridos)} días).`
      };
    }

    // Verificar si faltan fotos o pasos específicos
    const tieneFotos = d.foto_carnet_url || d.foto_cedula_estudiante_url;
    if (!tieneFotos) {
      return {
        estado: 'En Proceso',
        color: 'warning',
        badge: 'bg-warning text-dark',
        desc: 'Faltan recaudos o documentos fotográficos por adjuntar.'
      };
    }

    return {
      estado: 'Actualizado',
      color: 'success',
      badge: 'bg-success',
      desc: `Ficha Integral verificada y vigente al ${fecha.toLocaleDateString('es-VE')}.`
    };
  };

  const calcularEstatusCupo = (sol: SolicitudCupoData | null): { estado: string; color: string; badge: string; desc: string } => {
    if (!sol) {
      return {
        estado: 'Sin Solicitud de Cupo',
        color: 'secondary',
        badge: 'bg-secondary text-white',
        desc: 'No existe solicitud de cupo nueva registrada para el próximo período.'
      };
    }

    const est = (sol.estado || 'Pendiente').toLowerCase();
    if (est.includes('aprob') || est.includes('asign')) {
      return {
        estado: 'Cupo Asignado / Aprobado',
        color: 'success',
        badge: 'bg-success text-white',
        desc: `Cupo confirmado para ${sol.grado_solicitado}.`
      };
    }
    if (est.includes('pre')) {
      return {
        estado: 'Pre-Aprobado',
        color: 'info',
        badge: 'bg-info text-dark',
        desc: 'En revisión de recaudos por parte del comité de admisiones.'
      };
    }
    if (est.includes('rechaz')) {
      return {
        estado: 'No Asignado / Rechazado',
        color: 'danger',
        badge: 'bg-danger text-white',
        desc: 'La solicitud no pudo ser asignada por disponibilidad de cupos.'
      };
    }
    return {
      estado: 'Solicitud Pendiente',
      color: 'warning',
      badge: 'bg-warning text-dark',
      desc: 'Solicitud en lista de espera y evaluación de baremo.'
    };
  };

  const ejecutarBusqueda = async (terminoParam?: string) => {
    const raw = (terminoParam !== undefined ? terminoParam : codigoBusqueda).trim();
    if (!raw) {
      if (Swal) Swal.fire('Ingresa un código', 'Por favor escribe el código de la constancia, cédula o código de cupo.', 'info');
      return;
    }

    setCargando(true);
    setBusquedaRealizada(true);
    setVinculacion(null);
    setSolicitudCupo(null);

    const soloNumeros = raw.replace(/\D/g, '');
    const codigoUpper = raw.toUpperCase();

    try {
      // 1. Buscar en estudiantes_vinculaciones
      let queryVinc = supabase.from('estudiantes_vinculaciones').select('*');
      if (codigoUpper.startsWith('CI-') || codigoUpper.startsWith('FI-') || codigoUpper.includes('-')) {
        queryVinc = queryVinc.ilike('codigo_unico', `%${raw}%`);
      } else if (soloNumeros.length >= 5) {
        queryVinc = queryVinc.or(`cedula_estudiante.ilike.%${soloNumeros}%,cedula_representante.ilike.%${soloNumeros}%`);
      } else {
        queryVinc = queryVinc.or(`nombres_estudiante.ilike.%${raw}%,apellidos_estudiante.ilike.%${raw}%`);
      }

      const { data: dataVinc } = await queryVinc.limit(1);
      let vincEncontrada: VinculacionData | null = null;
      if (dataVinc && dataVinc.length > 0) {
        vincEncontrada = dataVinc[0];
        setVinculacion(vincEncontrada);
      }

      // 2. Buscar en solicitudes_cupos
      let queryCupo = supabase.from('solicitudes_cupos').select('*');
      if (codigoUpper.startsWith('SC-') || codigoUpper.includes('-')) {
        queryCupo = queryCupo.ilike('codigo_unico', `%${raw}%`);
      } else if (soloNumeros.length >= 5) {
        queryCupo = queryCupo.or(`estudiante_cedula.ilike.%${soloNumeros}%,representante_cedula.ilike.%${soloNumeros}%`);
      } else {
        queryCupo = queryCupo.or(`estudiante_nombres.ilike.%${raw}%,estudiante_apellidos.ilike.%${raw}%`);
      }

      const { data: dataCupo } = await queryCupo.limit(1);
      let cupoEncontrado: SolicitudCupoData | null = null;
      if (dataCupo && dataCupo.length > 0) {
        cupoEncontrado = dataCupo[0];
        setSolicitudCupo(cupoEncontrado);
      }

      // Si encontramos cupo y no vinculación con esa cédula, intentar cruzar por cédula
      if (cupoEncontrado && !vincEncontrada && cupoEncontrado.estudiante_cedula) {
        const { data: cruzado } = await supabase
          .from('estudiantes_vinculaciones')
          .select('*')
          .ilike('cedula_estudiante', `%${cupoEncontrado.estudiante_cedula.replace(/\D/g, '')}%`)
          .limit(1);
        if (cruzado && cruzado.length > 0) {
          vincEncontrada = cruzado[0];
          setVinculacion(vincEncontrada);
        }
      }

      // Si encontramos vinculación y no cupo, intentar cruzar cupo por cédula
      if (vincEncontrada && !cupoEncontrado && vincEncontrada.cedula_estudiante) {
        const { data: cruzadoCupo } = await supabase
          .from('solicitudes_cupos')
          .select('*')
          .ilike('estudiante_cedula', `%${vincEncontrada.cedula_estudiante.replace(/\D/g, '')}%`)
          .limit(1);
        if (cruzadoCupo && cruzadoCupo.length > 0) {
          cupoEncontrado = cruzadoCupo[0];
          setSolicitudCupo(cupoEncontrado);
        }
      }

      // Cargar datos de director y firma si encontramos registro
      const escuelaFinal = vincEncontrada?.codigo_escuela || cupoEncontrado?.codigo_escuela || 'lb';
      const dir = await obtenerDatosDirectorAsync(escuelaFinal);
      const firma = await obtenerFirmaDirectorProtegida(escuelaFinal);
      setDirInfo(dir);
      setFirmaBase64(firma);

      // Determinar vista por defecto
      if (vincEncontrada) {
        setVistaDoc('constancia');
      } else if (cupoEncontrado) {
        setVistaDoc('cupo');
      }

    } catch (e) {
      console.error('Error en búsqueda de verificación:', e);
      if (Swal) Swal.fire('Error', 'Ocurrió un inconveniente al consultar los registros.', 'error');
    } finally {
      setCargando(false);
    }
  };

  const handleDescargarPdf = async () => {
    if (!docRef.current) return;
    setGenerandoPdf(true);
    try {
      const canvas = await html2canvas(docRef.current, {
        scale: 2.8,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter', compress: true });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgData = canvas.toDataURL('image/png');
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(imgHeight, 279), undefined, 'FAST');

      const nombreEst = vinculacion?.nombres_estudiante || solicitudCupo?.estudiante_nombres || 'Documento';
      const fileName = `SIGAE_Verificacion_${vistaDoc === 'constancia' ? 'Constancia' : 'SolicitudCupo'}_${nombreEst.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      if (Swal) Swal.fire('¡PDF Generado!', 'El comprobante oficial ha sido descargado en ultra definición.', 'success');
    } catch (e) {
      console.error('Error al generar PDF', e);
      if (Swal) Swal.fire('Error', 'No se pudo generar el documento PDF.', 'error');
    } finally {
      setGenerandoPdf(false);
    }
  };

  const handleCompartirWhatsApp = () => {
    const nombre = vinculacion?.nombres_estudiante || solicitudCupo?.estudiante_nombres || 'Estudiante';
    const codigo = vinculacion?.codigo_unico || solicitudCupo?.codigo_unico || 'SIN-CODIGO';
    const link = `${window.location.origin}/validar-constancia/${encodeURIComponent(codigo)}`;
    const texto = `*SIGAE - Verificación Oficial de Documento*\n\n` +
      `Estudiante: *${nombre}*\n` +
      `Código de Autenticidad: *${codigo}*\n\n` +
      `Puede consultar la validez de este documento escaneando su código QR o accediendo al enlace público:\n` +
      `${link}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
  };

  // Render variables
  const d = vinculacion?.datos_actualizados || {};
  const nombreEstudianteCompleto = `${vinculacion?.nombres_estudiante || d.estudiante_nombres || solicitudCupo?.estudiante_nombres || ''} ${vinculacion?.apellidos_estudiante || d.estudiante_apellidos || solicitudCupo?.estudiante_apellidos || ''}`.trim() || 'Estudiante Registrado';
  const cedulaEstudiante = vinculacion?.cedula_estudiante || d.estudiante_cedula || solicitudCupo?.estudiante_cedula || 'No posee';
  const gradoEstudiante = vinculacion?.grado_actual || d.grado_solicitado || solicitudCupo?.grado_solicitado || 'Grado no especificado';
  const representanteNombre = `${d.representante_nombres || vinculacion?.nombres_representante || solicitudCupo?.representante_nombres || ''} ${d.representante_apellidos || vinculacion?.apellidos_representante || solicitudCupo?.representante_apellidos || ''}`.trim() || 'Representante Legal';
  const representanteCedula = d.representante_cedula || vinculacion?.cedula_representante || solicitudCupo?.representante_cedula || 'No registrada';
  const codigoDocumento = vinculacion?.codigo_unico || solicitudCupo?.codigo_unico || `CI-${(vinculacion?.codigo_escuela || 'LB').toUpperCase()}-${cedulaEstudiante.replace(/\D/g, '') || '0000'}`;

  const anoActual = new Date().getFullYear();
  const anoProximo = anoActual + 1;

  const urlQr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/validar-constancia/${encodeURIComponent(codigoDocumento)}`)}&bgcolor=ffffff&color=166534&margin=2`;

  const escuelaCodigo = vinculacion?.codigo_escuela || solicitudCupo?.codigo_escuela || 'lb';
  const logoEscuela = `/assets/img/logo_${escuelaCodigo}.png`;
  const logoMppe = '/assets/img/logoMPPE.png';

  let nivelEducativo = 'Educación Primaria';
  const gLower = gradoEstudiante.toLowerCase();
  if (gLower.includes('maternal') || gLower.includes('preescolar') || gLower.includes('inicial') || gLower.includes('grupo')) {
    nivelEducativo = 'Educación Inicial';
  } else if (gLower.includes('año') || gLower.includes('media') || gLower.includes('bachillerato')) {
    nivelEducativo = 'Educación Media General';
  }

  const estatusActualizacion = vinculacion ? calcularEstatusActualizacion(vinculacion) : null;
  const estatusCupo = calcularEstatusCupo(solicitudCupo);

  return (
    <div className="modulo-animado p-3 p-md-4">
      
      {/* ─── ENCABEZADO PRINCIPAL ─────────────────────────────────────────── */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <div className="p-2 rounded-3 bg-success bg-opacity-10 text-success">
              <i className="bi bi-patch-check-fill fs-3"></i>
            </div>
            <div>
              <h3 className="fw-bold mb-0 text-dark">Módulo de Verificaciones Oficiales</h3>
              <p className="text-muted small mb-0">
                Consulta y validación integral de Constancias de Inscripción, Solicitudes de Cupos y Fichas Estudiantiles.
              </p>
            </div>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button 
            onClick={() => {
              setCodigoBusqueda('');
              setBusquedaRealizada(false);
              setVinculacion(null);
              setSolicitudCupo(null);
            }} 
            className="btn btn-outline-secondary rounded-pill px-3 fw-bold"
          >
            <i className="bi bi-arrow-counterclockwise me-1"></i> Limpiar
          </button>
        </div>
      </div>

      {/* ─── BUSCADOR UNIVERSAL ───────────────────────────────────────────── */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <form onSubmit={(e) => { e.preventDefault(); ejecutarBusqueda(); }}>
          <div className="row g-3 align-items-center">
            <div className="col-12 col-lg-8">
              <label className="form-label fw-bold text-dark small mb-1">
                <i className="bi bi-search me-1 text-success"></i> Código de Constancia / Código Único / Cédula del Estudiante o Representante:
              </label>
              <div className="input-group input-group-lg shadow-sm rounded-3 overflow-hidden">
                <span className="input-group-text bg-light border-0 text-muted px-3">
                  <i className="bi bi-qr-code-scan fs-5 text-success"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-0 bg-light fs-6 fw-bold"
                  placeholder="Ej: CI-LB-16808608-2026, SC-SB-0012, o 32.456.789"
                  value={codigoBusqueda}
                  onChange={(e) => setCodigoBusqueda(e.target.value)}
                  autoFocus
                />
                {codigoBusqueda && (
                  <button
                    type="button"
                    className="btn btn-light border-0 text-muted"
                    onClick={() => setCodigoBusqueda('')}
                  >
                    <i className="bi bi-x-circle-fill"></i>
                  </button>
                )}
              </div>
            </div>

            <div className="col-12 col-lg-4 d-flex gap-2 align-items-end mt-lg-4">
              <button
                type="submit"
                className="btn btn-success btn-lg rounded-3 fw-bold flex-grow-1 shadow-sm d-flex align-items-center justify-content-center gap-2"
                disabled={cargando}
                style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', border: 'none' }}
              >
                {cargando ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                    Consultando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-shield-check fs-5"></i>
                    Verificar Documento
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* ACCESOS RÁPIDOS RECIENTES */}
        {historialReciente.length > 0 && !busquedaRealizada && (
          <div className="mt-4 pt-3 border-top">
            <small className="text-muted fw-bold text-uppercase d-block mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
              <i className="bi bi-clock-history me-1"></i> Consultas o Actualizaciones Recientes en el Plantel:
            </small>
            <div className="d-flex flex-wrap gap-2">
              {historialReciente.map((rec, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setCodigoBusqueda(rec.codigo_unico || rec.cedula_estudiante);
                    ejecutarBusqueda(rec.codigo_unico || rec.cedula_estudiante);
                  }}
                  className="btn btn-light btn-sm border rounded-pill px-3 py-1 text-dark fw-semibold d-flex align-items-center gap-1 shadow-none"
                  style={{ fontSize: '0.82rem' }}
                >
                  <span className="badge bg-success bg-opacity-25 text-success rounded-circle p-1">
                    <i className="bi bi-person-fill" style={{ fontSize: '10px' }}></i>
                  </span>
                  <span>{rec.nombres_estudiante} {rec.apellidos_estudiante}</span>
                  <span className="text-muted font-monospace">({rec.cedula_estudiante})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── RESULTADOS DE LA CONSULTA ───────────────────────────────────── */}
      {cargando && (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white my-4">
          <div className="spinner-border text-success mx-auto mb-3" style={{ width: '3rem', height: '3rem' }}></div>
          <h5 className="fw-bold text-dark mb-1">Verificando autenticidad en la base de datos...</h5>
          <p className="text-muted small">Consultando Ficha Integral, registros de firmas y asignaciones de cupos.</p>
        </div>
      )}

      {!cargando && busquedaRealizada && !vinculacion && !solicitudCupo && (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white border-start border-4 border-danger animate__animated animate__fadeIn">
          <div className="bg-danger bg-opacity-10 text-danger rounded-circle p-3 mx-auto mb-3 d-inline-flex">
            <i className="bi bi-file-earmark-x-fill fs-1"></i>
          </div>
          <h4 className="fw-bold text-danger mb-1">Sin Registros Encontrados</h4>
          <p className="text-muted mb-3">
            No se encontró ninguna Constancia de Inscripción ni Solicitud de Cupo asociada al término <code>"{codigoBusqueda}"</code>.
          </p>
          <div className="d-flex justify-content-center gap-2">
            <button onClick={() => setCodigoBusqueda('')} className="btn btn-outline-secondary rounded-pill px-4">
              Intentar con otra cédula o código
            </button>
          </div>
        </div>
      )}

      {!cargando && (vinculacion || solicitudCupo) && (
        <div className="animate__animated animate__fadeIn">
          
          {/* ─── TARJETAS DE DOBLE ESTADO (CUPOS & ACTUALIZACIÓN) ─────────── */}
          <div className="row g-3 mb-4">
            
            {/* TARJETA 1: ESTATUS DE SOLICITUD DE CUPO */}
            <div className="col-12 col-md-6">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white position-relative overflow-hidden">
                <div className={`position-absolute top-0 start-0 h-100 bg-${estatusCupo.color}`} style={{ width: '6px' }}></div>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <div className="p-2 rounded-3 bg-light text-primary">
                      <i className="bi bi-envelope-paper-fill fs-4"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold text-muted text-uppercase small mb-0">Estatus de Solicitud de Cupo</h6>
                      <h5 className="fw-bolder text-dark mb-0">{solicitudCupo?.grado_solicitado || 'Admisión'}</h5>
                    </div>
                  </div>
                  <span className={`badge ${estatusCupo.badge} px-3 py-2 rounded-pill fw-bold`}>
                    {estatusCupo.estado}
                  </span>
                </div>
                <p className="text-muted small mb-3">{estatusCupo.desc}</p>
                
                {solicitudCupo ? (
                  <div className="bg-light rounded-3 p-3 small font-monospace">
                    <div className="d-flex justify-content-between border-bottom pb-1 mb-1">
                      <span className="text-muted">Cód. Solicitud:</span>
                      <b className="text-dark">{solicitudCupo.codigo_unico}</b>
                    </div>
                    <div className="d-flex justify-content-between border-bottom pb-1 mb-1">
                      <span className="text-muted">Prioridad / Sector:</span>
                      <b className="text-primary">{solicitudCupo.prioridad || solicitudCupo.representante_tipo || 'Comunidad'}</b>
                    </div>
                    {solicitudCupo.requiere_transporte && (
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Ruta Transporte:</span>
                        <b className="text-success">{solicitudCupo.ruta_transporte || 'Solicitado'}</b>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="alert alert-light border small text-muted mb-0">
                    <i className="bi bi-info-circle me-1"></i> Este estudiante no registra solicitud de cupo nueva (es estudiante regular del plantel).
                  </div>
                )}
              </div>
            </div>

            {/* TARJETA 2: ESTATUS DE ACTUALIZACIÓN DE DATOS (FICHA INTEGRAL) */}
            <div className="col-12 col-md-6">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white position-relative overflow-hidden">
                <div className={`position-absolute top-0 start-0 h-100 bg-${estatusActualizacion ? estatusActualizacion.color : 'secondary'}`} style={{ width: '6px' }}></div>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div className="d-flex align-items-center gap-2">
                    <div className="p-2 rounded-3 bg-light text-success">
                      <i className="bi bi-person-check-fill fs-4"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold text-muted text-uppercase small mb-0">Estado de Actualización</h6>
                      <h5 className="fw-bolder text-dark mb-0">Ficha Integral SIGAE</h5>
                    </div>
                  </div>
                  {estatusActualizacion ? (
                    <span className={`badge ${estatusActualizacion.badge} px-3 py-2 rounded-pill fw-bold`}>
                      {estatusActualizacion.estado}
                    </span>
                  ) : (
                    <span className="badge bg-secondary px-3 py-2 rounded-pill fw-bold">Sin Iniciar</span>
                  )}
                </div>
                <p className="text-muted small mb-3">
                  {estatusActualizacion ? estatusActualizacion.desc : 'No se han cargado los datos de actualización para este período escolar.'}
                </p>

                {vinculacion ? (
                  <div className="bg-light rounded-3 p-3 small font-monospace">
                    <div className="d-flex justify-content-between border-bottom pb-1 mb-1">
                      <span className="text-muted">Cód. Autenticidad:</span>
                      <b className="text-success">{codigoDocumento}</b>
                    </div>
                    <div className="d-flex justify-content-between border-bottom pb-1 mb-1">
                      <span className="text-muted">Grado Actual:</span>
                      <b className="text-dark">{vinculacion.grado_actual || 'Asignado'}</b>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Última Actualización:</span>
                      <b className="text-dark">
                        {vinculacion.fecha_ultima_actualizacion ? new Date(vinculacion.fecha_ultima_actualizacion).toLocaleDateString('es-VE') : 'No registrada'}
                      </b>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-light border small text-muted mb-0">
                    <i className="bi bi-info-circle me-1"></i> El estudiante debe ingresar al módulo de Actualización de Datos para validar su expediente.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ─── SELECTOR DE PESTAÑAS Y ACCIONES ───────────────────────────── */}
          <div className="d-flex flex-wrap justify-content-between align-items-center bg-white p-3 rounded-4 shadow-sm mb-4 gap-3">
            <div className="btn-group p-1 bg-light rounded-pill">
              {vinculacion && (
                <button
                  type="button"
                  onClick={() => setVistaDoc('constancia')}
                  className={`btn rounded-pill fw-bold px-4 py-2 ${vistaDoc === 'constancia' ? 'btn-success text-white shadow-sm' : 'btn-light text-muted'}`}
                >
                  <i className="bi bi-award-fill me-1"></i> Constancia de Inscripción Oficial
                </button>
              )}
              {solicitudCupo && (
                <button
                  type="button"
                  onClick={() => setVistaDoc('cupo')}
                  className={`btn rounded-pill fw-bold px-4 py-2 ${vistaDoc === 'cupo' ? 'btn-primary text-white shadow-sm' : 'btn-light text-muted'}`}
                >
                  <i className="bi bi-envelope-check-fill me-1"></i> Comprobante de Solicitud de Cupo
                </button>
              )}
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={handleDescargarPdf}
                disabled={generandoPdf}
                className="btn btn-outline-success fw-bold rounded-pill px-3 shadow-sm d-flex align-items-center gap-2"
              >
                {generandoPdf ? (
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                ) : (
                  <i className="bi bi-file-earmark-pdf-fill fs-5"></i>
                )}
                Descargar PDF Oficial
              </button>
              <button
                type="button"
                onClick={handleCompartirWhatsApp}
                className="btn btn-success fw-bold rounded-pill px-3 shadow-sm d-flex align-items-center gap-2"
                style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
              >
                <i className="bi bi-whatsapp fs-5"></i> Compartir
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-outline-secondary fw-bold rounded-pill px-3 shadow-sm"
              >
                <i className="bi bi-printer-fill me-1"></i> Imprimir
              </button>
            </div>
          </div>

          {/* ─── VISOR DE DOCUMENTO OFICIAL (RÉPLICA EXACTA) ───────────────── */}
          <div className="d-flex justify-content-center">
            
            {vistaDoc === 'constancia' ? (
              /* CONSTANCIA DE INSCRIPCIÓN OFICIAL */
              <div 
                ref={docRef}
                className="bg-white shadow-lg rounded-4 p-4 p-md-5 mb-5 animate__animated animate__fadeIn"
                style={{ width: '800px', maxWidth: '100%', border: '2px solid #94a3b8', color: '#000000', boxSizing: 'border-box' }}
              >
                {/* BANDERA DE VENEZUELA */}
                <div style={{ marginBottom: '16px', borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: '6px', backgroundColor: '#facc15' }}></div>
                  <div style={{ height: '8px', backgroundColor: '#2563eb', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', color: '#ffffff', fontSize: '7px', lineHeight: '1' }}>
                    <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#dc2626' }}></div>
                </div>

                {/* ENCABEZADO INSTITUCIONAL MODELO */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '2px solid #cbd5e1', paddingBottom: '16px', marginBottom: '25px', position: 'relative' }}>
                  <img src={logoEscuela} alt="Escuela" style={{ height: '70px', width: 'auto', position: 'absolute', left: 0 }} />
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1.45', textTransform: 'uppercase', color: '#000000' }}>
                      República Bolivariana de Venezuela<br/>
                      Ministerio del Poder Popular para la Educación<br/>
                      {dirInfo?.nombreEscuela || (escuelaCodigo === 'sb' ? 'Unidad Educativa Santa Bárbara' : 'Unidad Educativa Libertador Bolívar')}<br/>
                      <span style={{ fontWeight: 'normal', fontSize: '12px', textTransform: 'none', color: '#334155' }}>{dirInfo?.ubicacionEscuela || 'Monagas, Venezuela'}</span>
                    </div>
                  </div>
                </div>

                {/* TÍTULO DE LA CONSTANCIA */}
                <div style={{ textAlign: 'center', margin: '28px 0 24px' }}>
                  <h2 style={{ margin: 0, fontSize: '21px', fontWeight: 'bold', color: '#000000', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Constancia de Inscripción
                  </h2>
                </div>

                {/* PÁRRAFO DE CERTIFICACIÓN */}
                <div style={{ fontSize: '13.5px', lineHeight: '1.95', color: '#000000', textAlign: 'justify', marginBottom: '25px' }}>
                  Quien suscribe, <b>{dirInfo?.tituloDirector || 'Director(a) de la Institución'}</b>, titular de la cédula de identidad número <b>{dirInfo?.cedula || '17.780.095'}</b>, en calidad de {dirInfo?.cargoGenerico || 'Director'} de la Unidad Educativa, certifico que los datos reflejados en esta constancia corresponden a un estudiante que ha actualizado su información de forma exitosa. Este estudiante está autorizado para cursar el Año Escolar <b>{anoActual} – {anoProximo}</b> en nuestra institución. A continuación se detallan los datos relevantes:
                </div>

                {/* DATOS RELEVANTES DETALLADOS */}
                <div style={{ fontSize: '13.5px', lineHeight: '2.2', color: '#000000', marginLeft: '12px', marginBottom: '30px' }}>
                  <div><b>Estudiante:</b> {nombreEstudianteCompleto}</div>
                  <div><b>Cédula de Identidad o Escolar:</b> {cedulaEstudiante}</div>
                  <div><b>Nivel Educativo:</b> {nivelEducativo}</div>
                  <div><b>Grupo, grado o año a cursar:</b> {gradoEstudiante}</div>
                  <div><b>Representante Legal:</b> {representanteNombre}</div>
                  <div><b>Cédula de Identidad:</b> {representanteCedula}</div>
                  <div><b>Fecha de Emisión:</b> {new Date().toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>

                {/* ATENTAMENTE Y FIRMA DEL DIRECTOR CON QR DE SEGURIDAD */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px', paddingTop: '15px', borderTop: '1.5px solid #cbd5e1' }}>
                  <div style={{ textAlign: 'center', flex: 1, maxWidth: '440px', margin: '0 auto' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '13.5px', fontWeight: 'bold', color: '#000000' }}>Atentamente</p>
                    {firmaBase64 ? (
                      <img src={firmaBase64} alt="Firma Director" style={{ height: '105px', width: 'auto', display: 'block', margin: '0 auto 5px' }} />
                    ) : (
                      <div style={{ height: '70px', borderBottom: '1.5px solid #000', width: '200px', margin: '0 auto 5px' }}></div>
                    )}
                    <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#000000' }}>{dirInfo?.nombreCompleto || 'Dirección del Plantel'}</div>
                    <div style={{ fontSize: '12px', color: '#333333' }}>C.I.: {dirInfo?.cedula}</div>
                    <div style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#000000' }}>{dirInfo?.cargo || 'Director(a)'}</div>
                  </div>

                  <div style={{ textAlign: 'center', border: '1.5px solid #cbd5e1', padding: '6px', borderRadius: '10px', background: '#ffffff', minWidth: '85px' }}>
                    <img src={urlQr} alt="QR Verificación" style={{ height: '70px', width: '70px', display: 'block', margin: '0 auto' }} />
                    <span style={{ fontSize: '7.5px', fontWeight: 'bold', color: '#166534', fontFamily: 'monospace', display: 'block', marginTop: '4px' }}>VERIFICACIÓN QR</span>
                    <span style={{ fontSize: '6.5px', color: '#64748b', fontFamily: 'monospace', display: 'block' }}>{codigoDocumento}</span>
                  </div>
                </div>

                {/* PIE DE PÁGINA CON LOGO DEL MINISTERIO ALINEADO A LA IZQUIERDA */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '10px', marginTop: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={logoMppe} alt="MPPE" style={{ height: '40px', width: 'auto' }} />
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '8.5px', color: '#64748b' }}>
                    SIGAE - Control Estudiantil | Documento Oficial Verificable mediante Código QR<br/>
                    Cód. Autenticidad: <b style={{ color: '#166534', fontFamily: 'monospace' }}>{codigoDocumento}</b>
                  </div>
                </div>

              </div>
            ) : (
              /* COMPROBANTE DE SOLICITUD DE CUPO */
              <div 
                ref={docRef}
                className="bg-white shadow-lg rounded-4 p-4 p-md-5 mb-5 animate__animated animate__fadeIn"
                style={{ width: '800px', maxWidth: '100%', border: '2px solid #94a3b8', color: '#000000', boxSizing: 'border-box' }}
              >
                {/* BANDERA DE VENEZUELA */}
                <div style={{ marginBottom: '16px', borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: '6px', backgroundColor: '#facc15' }}></div>
                  <div style={{ height: '8px', backgroundColor: '#2563eb', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', color: '#ffffff', fontSize: '7px', lineHeight: '1' }}>
                    <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#dc2626' }}></div>
                </div>

                {/* ENCABEZADO INSTITUCIONAL */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '2px solid #cbd5e1', paddingBottom: '16px', marginBottom: '25px', position: 'relative' }}>
                  <img src={logoEscuela} alt="Escuela" style={{ height: '70px', width: 'auto', position: 'absolute', left: 0 }} />
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: '1.45', textTransform: 'uppercase', color: '#000000' }}>
                      República Bolivariana de Venezuela<br/>
                      Ministerio del Poder Popular para la Educación<br/>
                      {dirInfo?.nombreEscuela || (escuelaCodigo === 'sb' ? 'Unidad Educativa Santa Bárbara' : 'Unidad Educativa Libertador Bolívar')}<br/>
                      <span style={{ fontWeight: 'normal', fontSize: '12px', textTransform: 'none', color: '#334155' }}>Sistema Integral de Admisiones y Asignación de Cupos</span>
                    </div>
                  </div>
                </div>

                {/* TÍTULO DEL COMPROBANTE */}
                <div style={{ textAlign: 'center', margin: '20px 0 25px' }}>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#000000', textTransform: 'uppercase' }}>
                    Comprobante Oficial de Solicitud de Cupo
                  </h2>
                  <span className="badge bg-primary px-3 py-1 rounded-pill mt-2 fw-bold">
                    Año Escolar {anoActual} – {anoProximo}
                  </span>
                </div>

                {/* CÓDIGO ÚNICO Y ESTADO */}
                <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '15px', marginBottom: '25px' }}>
                  <div className="row g-2 font-monospace">
                    <div className="col-md-6">
                      <span className="text-muted d-block small">Código Único de Solicitud:</span>
                      <b className="fs-5 text-primary">{solicitudCupo?.codigo_unico}</b>
                    </div>
                    <div className="col-md-6 text-md-end">
                      <span className="text-muted d-block small">Estatus del Trámite:</span>
                      <span className={`badge ${estatusCupo.badge} fs-6 px-3 py-1 rounded-pill`}>
                        {estatusCupo.estado}
                      </span>
                    </div>
                  </div>
                </div>

                {/* DATOS DE LA SOLICITUD */}
                <div style={{ fontSize: '13.5px', lineHeight: '2.1', color: '#000000', marginLeft: '8px', marginBottom: '25px' }}>
                  <div><b>Estudiante Postulado:</b> {nombreEstudianteCompleto}</div>
                  <div><b>Cédula del Estudiante:</b> {cedulaEstudiante}</div>
                  <div><b>Grado / Año Solicitado:</b> <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{solicitudCupo?.grado_solicitado}</span></div>
                  <div><b>Representante Legal:</b> {representanteNombre}</div>
                  <div><b>Cédula del Representante:</b> {representanteCedula}</div>
                  <div><b>Teléfono de Contacto:</b> {solicitudCupo?.representante_telefono || 'No registrado'}</div>
                  <div><b>Sector de Procedencia / Prioridad:</b> {solicitudCupo?.prioridad || solicitudCupo?.representante_tipo || 'Comunidad General'}</div>
                  {solicitudCupo?.requiere_transporte && (
                    <div><b>Transporte Escolar Solicitado:</b> 🚍 {solicitudCupo?.ruta_transporte}</div>
                  )}
                  {solicitudCupo?.fecha_solicitud && (
                    <div><b>Fecha de Registro:</b> {new Date(solicitudCupo.fecha_solicitud).toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  )}
                </div>

                {solicitudCupo?.observaciones && (
                  <div style={{ background: '#f1f5f9', borderLeft: '4px solid #3b82f6', padding: '10px 15px', borderRadius: '4px', marginBottom: '25px', fontSize: '12.5px' }}>
                    <b>Observaciones del Solicitante:</b> {solicitudCupo.observaciones}
                  </div>
                )}

                {/* NOTA INSTITUCIONAL */}
                <div style={{ background: '#fef9c3', border: '1px solid #fde047', padding: '10px 15px', borderRadius: '8px', marginBottom: '25px', fontSize: '11.5px', color: '#713f12' }}>
                  <b>Nota Importante:</b> La recepción de esta solicitud está sujeta a revisión. Los cupos se asignarán de acuerdo a la disponibilidad del grado y baremo institucional.
                </div>

                {/* PIE DE PÁGINA */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px solid #cbd5e1', paddingTop: '15px' }}>
                  <img src={logoMppe} alt="MPPE" style={{ height: '38px', width: 'auto' }} />
                  <div style={{ textAlign: 'right', fontSize: '8.5px', color: '#64748b' }}>
                    SIGAE - Sistema de Gestión Escolar | Comprobante de Admisión<br/>
                    Cód. Verificación: <b style={{ color: '#2563eb', fontFamily: 'monospace' }}>{solicitudCupo?.codigo_unico}</b>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default Verificaciones;
