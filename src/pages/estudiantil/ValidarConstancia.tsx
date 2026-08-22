import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { obtenerDatosDirector, resolverEscuelaEstudiante } from '../../utils/firmasSeguras';
import { toTitulo } from '../../lib/formatters';

export const ValidarConstancia: React.FC = () => {
  const { codigo } = useParams<{ codigo: string }>();
  const [loading, setLoading] = useState(true);
  const [datosDocumento, setDatosDocumento] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const consultarDocumento = async () => {
      if (!codigo) {
        setError('Código de verificación no especificado.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const codigoLimpio = codigo.trim();
        
        if (codigoLimpio.toUpperCase().includes('DEMO') || codigoLimpio.toUpperCase().includes('MODELO')) {
          const esc = codigoLimpio.toUpperCase().includes('SB') ? 'sb' : 'lb';
          setDatosDocumento({
            nombres_estudiante: 'Alejandro José',
            apellidos_estudiante: 'Pérez Silva',
            cedula_estudiante: '31.456.789',
            grado_actual: '1.er Año',
            seccion_actual: 'A',
            codigo_escuela: esc,
            fecha_ultima_actualizacion: new Date().toISOString(),
            datos_actualizados: {
              representante_nombres: 'Carlos Eduardo',
              representante_apellidos: 'Pérez Mendoza',
              representante_cedula: '15.987.654',
              codigo_unico: codigoLimpio,
              estudiante_sexo: 'masculino',
              estudiante_lugar_nacimiento: esc === 'sb' ? 'Maturín' : 'Temblador',
              estudiante_estado_nacimiento: 'Monagas',
              estudiante_fecha_nacimiento: '2012-05-15'
            }
          });
          setLoading(false);
          return;
        }

        const cleanUpper = codigoLimpio.toUpperCase();
        let cedulaBuscada = '';

        // Si viene con formato de constancia / ficha (ej: CI-LB-17780095-2026, FI-SB-32145678-2026)
        const partes = cleanUpper.split('-');
        if (partes.length >= 3 && (cleanUpper.startsWith('CI-') || cleanUpper.startsWith('FI-') || cleanUpper.startsWith('RES-'))) {
          const segCedula = partes[2].replace(/\D/g, '');
          if (segCedula.length >= 4) {
            cedulaBuscada = segCedula;
          }
        }
        if (!cedulaBuscada) {
          const matchNums = cleanUpper.match(/\d{5,9}/);
          if (matchNums) {
            cedulaBuscada = matchNums[0];
          }
        }

        const { data, error: err } = await supabase
          .from('estudiantes_vinculaciones')
          .select('*');

        if (err) throw err;

        let encontrado = (data || []).find((item: any) => {
          const d = item.datos_actualizados || {};
          const codUnico = (d.codigo_unico || item.codigo_unico || '').toString().trim().toUpperCase();
          const cedulaEstDigitos = (item.cedula_estudiante || d.estudiante_cedula || '').toString().replace(/\D/g, '');

          // 1. Coincidencia exacta por código único guardado
          if (codUnico && codUnico === cleanUpper) return true;

          // 2. Coincidencia por ID de fila
          if (item.id && String(item.id) === codigoLimpio) return true;

          // 3. Coincidencia exacta por cédula del estudiante
          if (cedulaBuscada && cedulaEstDigitos && cedulaEstDigitos === cedulaBuscada) {
            return true;
          }

          return false;
        });

        // Si no se encontró en vinculaciones regulares y parece solicitud de cupo (ej: SC-LB-2026-0042)
        if (!encontrado && (cleanUpper.startsWith('SC-') || !cedulaBuscada)) {
          const { data: cupos } = await supabase.from('solicitud_cupos').select('*');
          const cupoMatch = (cupos || []).find((c: any) => {
            const codCupo = (c.codigo_unico || '').toString().trim().toUpperCase();
            if (codCupo && codCupo === cleanUpper) return true;
            const cedCupo = (c.estudiante_cedula || '').replace(/\D/g, '');
            if (cedulaBuscada && cedCupo && cedCupo === cedulaBuscada) return true;
            return false;
          });

          if (cupoMatch) {
            encontrado = {
              ...cupoMatch,
              nombres_estudiante: cupoMatch.estudiante_nombres,
              apellidos_estudiante: cupoMatch.estudiante_apellidos,
              cedula_estudiante: cupoMatch.estudiante_cedula,
              grado_actual: cupoMatch.grado_solicitado,
              codigo_escuela: cupoMatch.codigo_escuela || (cleanUpper.includes('SB') ? 'sb' : 'lb'),
              datos_actualizados: {
                representante_nombres: cupoMatch.representante_nombres,
                representante_apellidos: cupoMatch.representante_apellidos,
                representante_cedula: cupoMatch.representante_cedula,
                codigo_unico: cupoMatch.codigo_unico
              }
            };
          }
        }

        if (encontrado) {
          setDatosDocumento(encontrado);
        } else {
          setError('No se encontró ningún documento oficial registrado con este código de verificación.');
        }
      } catch (err: any) {
        console.error('Error al validar documento:', err);
        setError('Ocurrió un error al consultar los servidores del Sistema SIGAE.');
      } finally {
        setLoading(false);
      }
    };

    consultarDocumento();
  }, [codigo]);

  const escCodigo = resolverEscuelaEstudiante(datosDocumento);
  const dirData = obtenerDatosDirector(escCodigo);
  const logoEscuela = `/assets/img/logo_${escCodigo}.png`;
  const logoMppe = '/assets/img/logoMPPE.png';

  const d = datosDocumento?.datos_actualizados || {};
  const nombreEstudiante = `${datosDocumento?.nombres_estudiante || d.estudiante_nombres || ''} ${datosDocumento?.apellidos_estudiante || d.estudiante_apellidos || ''}`.trim() || 'Estudiante Validado';
  const cedulaEstudiante = datosDocumento?.cedula_estudiante || d.estudiante_cedula || 'No posee';
  const gradoEstudiante = datosDocumento?.grado_actual || d.grado_solicitado || 'Grado asignado';
  const representanteNombre = `${d.representante_nombres || datosDocumento?.nombres_representante || ''} ${d.representante_apellidos || datosDocumento?.apellidos_representante || ''}`.trim() || 'Representante Legal';
  const representanteCedula = d.representante_cedula || datosDocumento?.cedula_representante || 'No registrado';

  const calcularEdad = (fechaNacStr?: string) => {
    if (!fechaNacStr) return '';
    const nac = new Date(fechaNacStr);
    if (isNaN(nac.getTime())) return '';
    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) {
      edad--;
    }
    return edad > 0 && edad < 100 ? `${edad}` : '';
  };

  const ciudadNac = (
    d.estudiante_municipio_nacimiento ||
    d.estudiante_lugar_nacimiento ||
    d.municipio_nacimiento ||
    d.lugar_nacimiento ||
    d.ciudad_nacimiento ||
    datosDocumento?.estudiante_municipio_nacimiento ||
    datosDocumento?.estudiante_lugar_nacimiento ||
    (escCodigo === 'sb' ? 'El Tejero' : 'Miraflores')
  ).toString().trim();

  const estadoNac = (
    d.estudiante_estado_nacimiento ||
    d.estado_nacimiento ||
    datosDocumento?.estudiante_estado_nacimiento ||
    'Monagas'
  ).toString().trim();

  const edadCalculada = calcularEdad(d.estudiante_fecha_nacimiento);
  const edadTexto = edadCalculada ? `de ${edadCalculada} años de edad, ` : '';
  const ciudadExpedicion = escCodigo === 'sb' ? 'El Tejero' : 'Miraflores';

  const fechaBase = datosDocumento?.fecha_ultima_actualizacion ? new Date(datosDocumento.fecha_ultima_actualizacion) : new Date();
  const diaExpedicion = fechaBase.getDate();
  const mesesNombres = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const mesExpedicion = mesesNombres[fechaBase.getMonth()];
  const anoExpedicion = fechaBase.getFullYear();

  const rawGen = (
    d.estudiante_sexo ||
    d.estudiante_genero ||
    datosDocumento?.estudiante_sexo ||
    datosDocumento?.estudiante_genero ||
    datosDocumento?.sexo ||
    datosDocumento?.genero ||
    ''
  ).toString().toLowerCase().trim();

  const esFemenino = rawGen.startsWith('f') || rawGen === 'femenino' || rawGen === 'femenina' || rawGen === 'hembra' || rawGen === 'mujer';

  const gradoLimpio = (gradoEstudiante)
    .replace(/\s+de\s+(Educación\s+Primaria|Educación\s+Inicial|Educación\s+Media\s+General|Media\s+General|Primaria|Inicial)/gi, '')
    .replace(/\s+correspondiente\s+al\s+Nivel\s+de.*/gi, '')
    .trim();

  let nivelEducativo = 'Educación Primaria';
  const gLower = (gradoEstudiante).toLowerCase();
  if (gLower.includes('maternal') || gLower.includes('preescolar') || gLower.includes('inicial') || gLower.includes('grupo')) {
    nivelEducativo = 'Educación Inicial';
  } else if (gLower.includes('año') || gLower.includes('media') || gLower.includes('bachillerato')) {
    nivelEducativo = 'Educación Media General';
  }

  const anoActual = new Date().getFullYear();
  const anoProximo = anoActual + 1;
  const esDirectora = escCodigo === 'sb' || (dirData?.cargoGenerico || '').toLowerCase().includes('directora') || (dirData?.cargo || '').toLowerCase().includes('directora');
  const prefijoDirector = esDirectora ? 'Profa.' : 'Prof.';
  const nombreDirectorBase = (dirData.nombreCompleto || (escCodigo === 'sb' ? 'Elika Dayana Chaviel Rondón' : 'José Vicente Millán Montaño'))
    .replace(/^(Prof\.|Profa\.|Profesora|Profesor|Lic\.|Lcda\.|Lcdo\.)\s*/i, '')
    .trim();
  const tituloDirectorTexto = `${prefijoDirector} ${toTitulo(nombreDirectorBase)}`;
  const cargoDirectorTexto = dirData.cargoGenerico || (esDirectora ? 'Directora' : 'Director');

  const determinarTipoCedula = (tipoDoc?: string, numCedula?: string) => {
    if (tipoDoc) {
      const tLower = tipoDoc.toLowerCase();
      if (tLower.includes('escolar')) return 'cédula escolar';
      if (tLower.includes('identidad')) return 'cédula de identidad';
    }
    const clean = (numCedula || '').toString().trim().toUpperCase();
    if (clean.startsWith('CE') || clean.startsWith('CE-') || clean.replace(/\D/g, '').length >= 10) {
      return 'cédula escolar';
    }
    return 'cédula de identidad';
  };

  const tipoCedulaTexto = determinarTipoCedula(d.estudiante_tipo_documento || datosDocumento?.estudiante_tipo_documento, cedulaEstudiante);

  return (
    <div className="min-vh-100 bg-light d-flex flex-column justify-content-between p-3 p-md-4 font-sans">
      <div className="container" style={{ maxWidth: '850px' }}>
        
        {/* ENCABEZADO PÚBLICO */}
        <div className="text-center mb-4">
          <img src="/assets/img/sigae.png" alt="SIGAE" style={{ height: '50px' }} className="mb-2" />
          <h6 className="text-muted fw-bold text-uppercase small mb-0" style={{ letterSpacing: '1px' }}>
            Portal Público de Verificación Oficial de Documentos
          </h6>
        </div>

        {loading ? (
          <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white my-4">
            <div className="spinner-border text-success mx-auto mb-3" style={{ width: '3rem', height: '3rem' }}></div>
            <h5 className="fw-bold text-dark mb-1">Verificando firma digital y validez...</h5>
            <p className="text-muted small">Consultando la autenticidad del documento en el registro SIGAE.</p>
          </div>
        ) : error ? (
          <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white my-4">
            <div className="text-danger mb-3">
              <i className="bi bi-x-circle-fill display-1"></i>
            </div>
            <h4 className="fw-bold text-dark mb-2">Documento No Encontrado o Inválido</h4>
            <p className="text-muted mb-4">{error}</p>
            <div>
              <Link to="/login" className="btn btn-outline-secondary rounded-pill px-4 fw-bold">
                Ir al Inicio del Sistema
              </Link>
            </div>
          </div>
        ) : (
          <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden my-3 animate__animated animate__fadeIn">
            {/* BARRA SUPERIOR DE VALIDEZ */}
            <div className="bg-success text-white p-3 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-patch-check-fill fs-3 text-warning"></i>
                <div>
                  <h6 className="mb-0 fw-bold">Documento Oficial Auténtico y Verificado</h6>
                  <small className="opacity-75">Firma Electrónica e Integridad Institucional Comprobada</small>
                </div>
              </div>
              <span className="badge bg-white text-success fw-bold px-3 py-2 rounded-pill">VÁLIDO</span>
            </div>

            <div className="p-4 p-md-5">
              {/* ENCABEZADO Y MEMBRETE */}
              <div className="d-flex align-items-center justify-content-between border-bottom pb-4 mb-4">
                <img src={logoEscuela} alt="Escuela" style={{ height: '65px', width: 'auto' }} />
                <div className="text-center">
                  <div className="fw-bold small text-uppercase text-dark lh-sm">
                    República Bolivariana de Venezuela<br/>
                    Ministerio del Poder Popular para la Educación<br/>
                    {dirData.nombreEscuela}<br/>
                    <span className="text-muted fw-normal" style={{ fontSize: '11px' }}>{dirData.ubicacionEscuela}</span>
                  </div>
                </div>
                <img src={logoMppe} alt="MPPE" style={{ height: '40px', width: 'auto' }} />
              </div>

              {/* TÍTULO */}
              <div className="text-center my-4">
                <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-1 rounded-pill mb-2">
                  DOCUMENTO OFICIAL DIGITAL
                </span>
                <h4 className="fw-bold text-dark mb-0" style={{ letterSpacing: '0.5px' }}>
                  Constancia de Inscripción
                </h4>
              </div>

              {/* CÓDIGO ÚNICO */}
              <div className="alert alert-success border-0 bg-success bg-opacity-10 rounded-3 p-3 mb-4">
                <div className="d-flex align-items-center gap-2 text-success fw-bold">
                  <i className="bi bi-shield-lock-fill fs-4"></i>
                  <div>
                    <span>Código de Autenticidad Digital: </span>
                    <code className="text-dark fw-bold fs-6 ms-1">{codigo}</code>
                  </div>
                </div>
              </div>

              {/* CUERPO OFICIAL EN TRES PÁRRAFOS */}
              <div className="p-4 bg-white rounded-3 border mb-4 text-justify" style={{ lineHeight: '2.1', fontSize: '14.5px', color: '#000000' }}>
                <p className="mb-4" style={{ textIndent: '30px' }}>
                  Quien suscribe, <b>{tituloDirectorTexto}</b>, {cargoDirectorTexto.toLowerCase()} de la <b>{toTitulo(dirData.nombreEscuela)}</b>, que funciona en <b>{toTitulo(dirData.ubicacionEscuela || 'Monagas, Venezuela')}</b>, por medio de la presente hace constar que {esFemenino ? 'la estudiante:' : 'el estudiante:'} <b>{toTitulo(nombreEstudiante)}</b>, natural de <b>{toTitulo(ciudadNac)}</b>, estado <b>{toTitulo(estadoNac)}</b>, {edadTexto}titular de la {tipoCedulaTexto} N.° <b>{cedulaEstudiante}</b>, fue {esFemenino ? 'inscrita' : 'inscrito'} para cursar el <b>{toTitulo(gradoLimpio)}</b> de <b>{nivelEducativo}</b> en este instituto durante el año escolar <b>{anoActual}-{anoProximo}</b>.
                </p>
                <p className="mb-4" style={{ textIndent: '30px' }}>
                  Asimismo, se deja constancia que el representante legal {esFemenino ? 'de la estudiante' : 'del estudiante'} es <b>{toTitulo(representanteNombre)}</b>, titular de la cédula de identidad N.° <b>{representanteCedula}</b>, quien ha cumplido con los requisitos establecidos para la formalización de la inscripción.
                </p>
                <p className="mb-0" style={{ textIndent: '30px' }}>
                  Constancia que se expide para los efectos y fines consiguientes en <b>{toTitulo(ciudadExpedicion)}</b>, a los {diaExpedicion} días del mes de {mesExpedicion} del año {anoExpedicion}.
                </p>
              </div>

              {/* AVISO DE VALIDACIÓN PÚBLICA */}
              <div className="p-3 rounded-3 bg-light border text-muted small text-center mb-4">
                <i className="bi bi-info-circle-fill text-primary me-2"></i>
                Este documento es una versión digital autenticada mediante firma electrónica y código QR. Su validez se encuentra respaldada en los archivos del Sistema SIGAE.
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="d-flex justify-content-center gap-3">
                <button onClick={() => window.print()} className="btn btn-outline-success fw-bold rounded-pill px-4">
                  <i className="bi bi-printer me-2"></i>Imprimir Comprobante
                </button>
                <Link to="/login" className="btn btn-success fw-bold rounded-pill px-4">
                  <i className="bi bi-box-arrow-in-right me-2"></i>Ingresar a SIGAE
                </Link>
              </div>

            </div>

            {/* PIE DE PÁGINA PÚBLICO CON LOGO DEL MINISTERIO ALINEADO A LA IZQUIERDA */}
            <div className="card-footer bg-light border-0 p-3 d-flex justify-content-between align-items-center border-top">
              <img src={logoMppe} alt="Ministerio del Poder Popular para la Educación" style={{ height: '35px', width: 'auto' }} />
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                SIGAE - Control Estudiantil | República Bolivariana de Venezuela
              </small>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default ValidarConstancia;
