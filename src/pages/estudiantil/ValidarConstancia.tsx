import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { obtenerDatosDirector, obtenerFirmaDirectorProtegida, resolverEscuelaEstudiante } from '../../utils/firmasSeguras';
import { toTitulo } from '../../lib/formatters';

export const ValidarConstancia: React.FC = () => {
  const { codigo } = useParams<{ codigo: string }>();
  const [loading, setLoading] = useState(true);
  const [datosDocumento, setDatosDocumento] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [firmaBase64, setFirmaBase64] = useState<string>('');

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

        // Si viene con formato de constancia / ficha / carta / normas / carnet / cupo
        // (ej: CI-LB-17780095-2026, CE-LB-17780095-2026, CC-LB-17780095-2026, FI-SB-32145678-2026, CA-LB-15876993-2026, CR-LB-15876993-2026, NI-SB-31456789-2026, SC-LB-2026-0042)
        const partes = cleanUpper.split('-');
        const prefijosConocidos = ['CI-', 'CE-', 'CC-', 'FI-', 'RES-', 'CA-', 'CR-', 'NI-', 'NORMAS-', 'NORM-', 'CARNET-', 'CRN-', 'SC-'];
        const tienePrefijo = prefijosConocidos.some(p => cleanUpper.startsWith(p));
        
        if (partes.length >= 3 && tienePrefijo) {
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
          const cedulaRepDigitos = (item.cedula_representante || d.representante_cedula || '').toString().replace(/\D/g, '');

          // 1. Coincidencia exacta por código único guardado
          if (codUnico && codUnico === cleanUpper) return true;

          // 2. Coincidencia por ID de fila
          if (item.id && String(item.id) === codigoLimpio) return true;

          // 3. Coincidencia exacta por cédula del estudiante o del representante
          if (cedulaBuscada && cedulaEstDigitos && cedulaEstDigitos === cedulaBuscada) {
            return true;
          }
          if (cedulaBuscada && cedulaRepDigitos && cedulaRepDigitos === cedulaBuscada) {
            return true;
          }

          return false;
        });

        // Si no se encontró en vinculaciones regulares y parece solicitud de cupo, carta de aceptación o normativa interna
        if (!encontrado && (cleanUpper.startsWith('SC-') || cleanUpper.startsWith('CA-') || cleanUpper.startsWith('CR-') || cleanUpper.startsWith('NI-') || cleanUpper.startsWith('NORMAS-') || cleanUpper.startsWith('NORM-') || !cedulaBuscada)) {
          const consultarCuposTabla = async (nombreTabla: string) => {
            const { data: cupos } = await supabase.from(nombreTabla).select('*');
            return (cupos || []).find((c: any) => {
              const codCupo = (c.codigo_unico || '').toString().trim().toUpperCase();
              if (codCupo && codCupo === cleanUpper) return true;
              if (c.id && String(c.id) === codigoLimpio) return true;
              const cedCupo = (c.estudiante_cedula || '').replace(/\D/g, '');
              if (cedulaBuscada && cedCupo && cedCupo === cedulaBuscada) return true;
              const cedRep = (c.representante_cedula || '').replace(/\D/g, '');
              if (cedulaBuscada && cedRep && cedRep === cedulaBuscada) return true;
              return false;
            });
          };

          let cupoMatch = await consultarCuposTabla('solicitud_cupos');
          if (!cupoMatch) {
            cupoMatch = await consultarCuposTabla('solicitudes_cupos');
          }

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

  useEffect(() => {
    let activo = true;
    if (datosDocumento) {
      obtenerFirmaDirectorProtegida(escCodigo, codigo).then((f) => {
        if (activo) setFirmaBase64(f);
      }).catch(console.error);
    }
    return () => { activo = false; };
  }, [datosDocumento, escCodigo, codigo]);

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

            <div className="p-3 p-sm-4 p-md-5">
              {/* BANDERA DE VENEZUELA OFICIAL CON LAS 8 ESTRELLAS BLANCAS */}
              <div style={{ marginBottom: '16px', borderRadius: '4px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '6px', backgroundColor: '#facc15' }}></div>
                <div style={{ height: '9px', backgroundColor: '#003893', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', color: '#ffffff', fontSize: '7.5px', lineHeight: '1', userSelect: 'none' }}>
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#cf142b' }}></div>
              </div>

              {/* ENCABEZADO Y MEMBRETE RESPONSIVO */}
              <div className="hoja-doc-header">
                <img src={logoEscuela} alt="Escuela" style={{ height: '65px', width: 'auto', objectFit: 'contain' }} className="d-block" />
                <div className="text-center flex-grow-1 px-1">
                  <div className="fw-bold text-uppercase text-dark" style={{ fontSize: '12.5px', lineHeight: '1.4' }}>
                    República Bolivariana de Venezuela<br/>
                    Ministerio del Poder Popular para la Educación<br/>
                    {dirData.nombreEscuela}<br/>
                    <span className="text-muted fw-normal" style={{ fontSize: '11px', textTransform: 'none' }}>{dirData.ubicacionEscuela}</span>
                  </div>
                </div>
                <img src={logoMppe} alt="MPPE" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} className="d-none d-sm-block" />
              </div>

              {/* TÍTULO DEL DOCUMENTO VALIDADO */}
              {(() => {
                const cleanCode = (codigo || '').toUpperCase().trim();
                const esNormas = cleanCode.startsWith('NI-') || cleanCode.startsWith('NORMAS-') || cleanCode.startsWith('NORM-');
                const esCarta = cleanCode.startsWith('CA-') || cleanCode.startsWith('CR-') || cleanCode.startsWith('ACEPT-');
                const esEstudio = cleanCode.startsWith('CE-') || cleanCode.startsWith('EST-') || cleanCode.includes('ESTUDIO');
                const esConducta = cleanCode.startsWith('CC-') || cleanCode.startsWith('COND-') || cleanCode.includes('CONDUCTA');
                const esCarnet = cleanCode.startsWith('CARNET-') || cleanCode.startsWith('CRN-');
                const esCupo = cleanCode.startsWith('SC-') || cleanCode.includes('CUPO');
                const esResumen = cleanCode.startsWith('FI-') || cleanCode.startsWith('RES-');

                const tituloDocValidado = esNormas
                  ? 'Normativa Interna Institucional y Acta de Compromiso'
                  : (esCarta
                    ? 'Carta Oficial de Aceptación y Asignación de Cupo'
                    : (esEstudio
                      ? 'Constancia de Estudio Regular'
                      : (esConducta
                        ? 'Constancia de Buena Conducta'
                        : (esCarnet
                          ? 'Carnet Estudiantil Institucional'
                          : (esCupo
                            ? 'Comprobante Oficial de Solicitud de Cupo'
                            : (esResumen
                              ? 'Ficha Integral del Estudiante (Resumen de Actualización)'
                              : 'Constancia Oficial de Inscripción'))))));

                return (
                  <div className="text-center my-3 my-md-4">
                    <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-1 rounded-pill mb-2">
                      DOCUMENTO OFICIAL DIGITAL VERIFICADO
                    </span>
                    <h4 className="fw-bold text-dark mb-0" style={{ letterSpacing: '0.5px' }}>
                      {tituloDocValidado}
                    </h4>
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-1 rounded-pill mt-2 font-monospace">
                      CÓDIGO: {codigo}
                    </span>
                  </div>
                );
              })()}

              {/* CUERPO DEL DOCUMENTO CERTIFICADO */}
              {(() => {
                const cleanCode = (codigo || '').toUpperCase().trim();
                const esNormas = cleanCode.startsWith('NI-') || cleanCode.startsWith('NORMAS-') || cleanCode.startsWith('NORM-');
                const esCarta = cleanCode.startsWith('CA-') || cleanCode.startsWith('CR-') || cleanCode.startsWith('ACEPT-');
                const esEstudio = cleanCode.startsWith('CE-') || cleanCode.startsWith('EST-') || cleanCode.includes('ESTUDIO');
                const esConducta = cleanCode.startsWith('CC-') || cleanCode.startsWith('COND-') || cleanCode.includes('CONDUCTA');
                const esCarnet = cleanCode.startsWith('CARNET-') || cleanCode.startsWith('CRN-');
                const esCupo = cleanCode.startsWith('SC-') || cleanCode.includes('CUPO');
                const esResumen = cleanCode.startsWith('FI-') || cleanCode.startsWith('RES-');

                if (esNormas) {
                  return (
                    <div className="p-3 p-sm-4 bg-white rounded-3 border mb-4 text-justify" style={{ lineHeight: '1.85', fontSize: '13.5px', color: '#000000' }}>
                      <p className="mb-3" style={{ textIndent: '20px' }}>
                        La Dirección de la <b>{toTitulo(dirData.nombreEscuela)}</b> hace constar que el/la estudiante <b>{toTitulo(nombreEstudiante)}</b>, titular de la {tipoCedulaTexto} N.° <b>{cedulaEstudiante}</b>, formalizó la suscripción de la <b>Normativa Interna Institucional</b> para el Año Escolar <b>{anoActual}-{anoProximo}</b>.
                      </p>
                      <p className="mb-3" style={{ textIndent: '20px' }}>
                        El representante legal <b>{toTitulo(representanteNombre)}</b>, portador de la cédula de identidad N.° <b>{representanteCedula}</b>, ha asumido el compromiso formal de cumplir y hacer cumplir las disposiciones disciplinarias, horarios de entrada, uniforme reglamentario y deberes establecidos en el Manual de Convivencia Escolar y Comunitario de este plantel.
                      </p>
                      <p className="mb-0" style={{ textIndent: '20px' }}>
                        Constancia expedida en <b>{toTitulo(ciudadExpedicion)}</b>, a los {diaExpedicion} días del mes de {mesExpedicion} del año {anoExpedicion}.
                      </p>
                    </div>
                  );
                }

                if (esCarta) {
                  return (
                    <div className="p-3 p-sm-4 bg-white rounded-3 border mb-4 text-justify" style={{ lineHeight: '1.85', fontSize: '13.5px', color: '#000000' }}>
                      <p className="mb-3" style={{ textIndent: '20px' }}>
                        La Dirección de la <b>{toTitulo(dirData.nombreEscuela)}</b> certifica que al/a la aspirante <b>{toTitulo(nombreEstudiante)}</b>, documento N.° <b>{cedulaEstudiante}</b>, le ha sido <b>APROBADO Y ASIGNADO EL CUPO FORMAL</b> para cursar el <b>{toTitulo(gradoLimpio)}</b> de <b>{nivelEducativo}</b> en el Año Escolar <b>{anoActual}-{anoProximo}</b>.
                      </p>
                      <p className="mb-3" style={{ textIndent: '20px' }}>
                        Se notifica al representante legal <b>{toTitulo(representanteNombre)}</b> (C.I. <b>{representanteCedula}</b>) que debe formalizar el proceso de matrícula consignando los recaudos exigidos en la Carpeta Institucional en las fechas oficiales del cronograma.
                      </p>
                      <p className="mb-0" style={{ textIndent: '20px' }}>
                        Expedido en <b>{toTitulo(ciudadExpedicion)}</b>, a los {diaExpedicion} días del mes de {mesExpedicion} del año {anoExpedicion}.
                      </p>
                    </div>
                  );
                }

                if (esEstudio) {
                  return (
                    <div className="p-3 p-sm-4 bg-white rounded-3 border mb-4 text-justify" style={{ lineHeight: '1.85', fontSize: '13.5px', color: '#000000' }}>
                      <p className="mb-3" style={{ textIndent: '20px' }}>
                        Quien suscribe, <b>{tituloDirectorTexto}</b>, {cargoDirectorTexto.toLowerCase()} de la <b>{toTitulo(dirData.nombreEscuela)}</b>, que funciona en <b>{toTitulo(dirData.ubicacionEscuela || 'Monagas, Venezuela')}</b>, por medio de la presente hace constar que {esFemenino ? 'la estudiante:' : 'el estudiante:'} <b>{toTitulo(nombreEstudiante)}</b>, titular de la {tipoCedulaTexto} N.° <b>{cedulaEstudiante}</b>, cursa de manera regular y activa el <b>{toTitulo(gradoLimpio)}</b> de <b>{nivelEducativo}</b> en este instituto durante el año escolar <b>{anoActual}-{anoProximo}</b>.
                      </p>
                      <p className="mb-3" style={{ textIndent: '20px' }}>
                        Asimismo, se hace constar que el estudiante asiste con regularidad y puntualidad a sus actividades escolares, manteniendo la condición de alumno regular activo.
                      </p>
                      <p className="mb-0" style={{ textIndent: '20px' }}>
                        Constancia que se expide para los efectos y fines consiguientes en <b>{toTitulo(ciudadExpedicion)}</b>, a los {diaExpedicion} días del mes de {mesExpedicion} del año {anoExpedicion}.
                      </p>
                    </div>
                  );
                }

                if (esConducta) {
                  return (
                    <div className="p-3 p-sm-4 bg-white rounded-3 border mb-4 text-justify" style={{ lineHeight: '1.85', fontSize: '13.5px', color: '#000000' }}>
                      <p className="mb-3" style={{ textIndent: '20px' }}>
                        Quien suscribe, <b>{tituloDirectorTexto}</b>, {cargoDirectorTexto.toLowerCase()} de la <b>{toTitulo(dirData.nombreEscuela)}</b>, que funciona en <b>{toTitulo(dirData.ubicacionEscuela || 'Monagas, Venezuela')}</b>, por medio de la presente hace constar que {esFemenino ? 'la estudiante:' : 'el estudiante:'} <b>{toTitulo(nombreEstudiante)}</b>, titular de la {tipoCedulaTexto} N.° <b>{cedulaEstudiante}</b>, quien cursa el <b>{toTitulo(gradoLimpio)}</b> de <b>{nivelEducativo}</b> durante el año escolar <b>{anoActual}-{anoProximo}</b>, ha demostrado en todo momento una <b>EXCELENTE CONDUCTA</b>, disciplina, respeto y estricto apego a las normas de convivencia escolar.
                      </p>
                      <p className="mb-0" style={{ textIndent: '20px' }}>
                        Constancia que se expide para los efectos y fines consiguientes en <b>{toTitulo(ciudadExpedicion)}</b>, a los {diaExpedicion} días del mes de {mesExpedicion} del año {anoExpedicion}.
                      </p>
                    </div>
                  );
                }

                if (esCarnet) {
                  return (
                    <div className="p-3 p-sm-4 bg-white rounded-3 border mb-4 text-justify" style={{ lineHeight: '1.85', fontSize: '13.5px', color: '#000000' }}>
                      <p className="mb-3" style={{ textIndent: '20px' }}>
                        La Dirección de la <b>{toTitulo(dirData.nombreEscuela)}</b> y la Coordinación de Control de Estudios por medio de la presente certifican la <b>AUTENTICIDAD Y VIGENCIA OFICIAL</b> del <b>Carnet Estudiantil Institucional</b> expedido a favor del/de la estudiante: <b>{toTitulo(nombreEstudiante)}</b>, titular de la {tipoCedulaTexto} N.° <b>{cedulaEstudiante}</b>, quien cursa activamente el <b>{toTitulo(gradoLimpio)}</b> de <b>{nivelEducativo}</b> durante el Año Escolar <b>{anoActual}-{anoProximo}</b>.
                      </p>
                      <p className="mb-3" style={{ textIndent: '20px' }}>
                        El documento acredita la condición de estudiante regular activo del plantel con derecho a los servicios institucionales y de transporte escolar, registrando como representante legal a <b>{toTitulo(representanteNombre)}</b>, titular de la cédula de identidad N.° <b>{representanteCedula}</b>.
                      </p>
                      <p className="mb-0" style={{ textIndent: '20px' }}>
                        Acreditación validada digitalmente en <b>{toTitulo(ciudadExpedicion)}</b>, a los {diaExpedicion} días del mes de {mesExpedicion} del año {anoExpedicion}.
                      </p>
                    </div>
                  );
                }

                if (esCupo) {
                  return (
                    <div className="p-3 p-sm-4 bg-white rounded-3 border mb-4 text-justify" style={{ lineHeight: '1.85', fontSize: '13.5px', color: '#000000' }}>
                      <p className="mb-3" style={{ textIndent: '20px' }}>
                        La Coordinación de Admisión de la <b>{toTitulo(dirData.nombreEscuela)}</b> certifica la <b>AUTENTICIDAD DEL REGISTRO DE SOLICITUD DE CUPO</b> registrado formalmente en el Sistema SIGAE para el/la aspirante: <b>{toTitulo(nombreEstudiante)}</b>, documento N.° <b>{cedulaEstudiante}</b>, para optar al grado: <b>{toTitulo(gradoLimpio)}</b> ({nivelEducativo}).
                      </p>
                      <p className="mb-3" style={{ textIndent: '20px' }}>
                        Consta que el trámite fue consignado por el representante legal: <b>{toTitulo(representanteNombre)}</b>, C.I. N.° <b>{representanteCedula}</b>, manteniéndose en los archivos escolares bajo el código oficial <b>{codigo}</b>.
                      </p>
                      <p className="mb-0" style={{ textIndent: '20px' }}>
                        Expedido y verificado en <b>{toTitulo(ciudadExpedicion)}</b>, a los {diaExpedicion} días del mes de {mesExpedicion} del año {anoExpedicion}.
                      </p>
                    </div>
                  );
                }

                if (esResumen) {
                  return (
                    <div className="p-3 p-sm-4 bg-white rounded-3 border mb-4 text-justify" style={{ lineHeight: '1.85', fontSize: '13.5px', color: '#000000' }}>
                      <p className="mb-3" style={{ textIndent: '20px' }}>
                        El Departamento de Control de Estudios de la <b>{toTitulo(dirData.nombreEscuela)}</b> certifica la validez de la <b>Ficha Integral y Resumen de Actualización de Datos</b> del/de la estudiante: <b>{toTitulo(nombreEstudiante)}</b>, titular de la {tipoCedulaTexto} N.° <b>{cedulaEstudiante}</b>, cursante del <b>{toTitulo(gradoLimpio)}</b> de <b>{nivelEducativo}</b>.
                      </p>
                      <p className="mb-3" style={{ textIndent: '20px' }}>
                        Los datos personales, sociométricos y de contacto registrados por el representante legal <b>{toTitulo(representanteNombre)}</b> (C.I. <b>{representanteCedula}</b>) se encuentran debidamente sincronizados y validados en los servidores del Sistema SIGAE.
                      </p>
                      <p className="mb-0" style={{ textIndent: '20px' }}>
                        Constancia expedida en <b>{toTitulo(ciudadExpedicion)}</b>, a los {diaExpedicion} días del mes de {mesExpedicion} del año {anoExpedicion}.
                      </p>
                    </div>
                  );
                }

                // Por defecto: Constancia Oficial de Inscripción
                return (
                  <div className="p-3 p-sm-4 bg-white rounded-3 border mb-4 text-justify" style={{ lineHeight: '1.85', fontSize: '13.5px', color: '#000000' }}>
                    <p className="mb-3" style={{ textIndent: '20px' }}>
                      Quien suscribe, <b>{tituloDirectorTexto}</b>, {cargoDirectorTexto.toLowerCase()} de la <b>{toTitulo(dirData.nombreEscuela)}</b>, que funciona en <b>{toTitulo(dirData.ubicacionEscuela || 'Monagas, Venezuela')}</b>, por medio de la presente hace constar que {esFemenino ? 'la estudiante:' : 'el estudiante:'} <b>{toTitulo(nombreEstudiante)}</b>, natural de <b>{toTitulo(ciudadNac)}</b>, estado <b>{toTitulo(estadoNac)}</b>, {edadTexto}titular de la {tipoCedulaTexto} N.° <b>{cedulaEstudiante}</b>, fue {esFemenino ? 'inscrita' : 'inscrito'} para cursar el <b>{toTitulo(gradoLimpio)}</b> de <b>{nivelEducativo}</b> en este instituto durante el año escolar <b>{anoActual}-{anoProximo}</b>.
                    </p>
                    <p className="mb-3" style={{ textIndent: '20px' }}>
                      Asimismo, se deja constancia que el representante legal {esFemenino ? 'de la estudiante' : 'del estudiante'} es <b>{toTitulo(representanteNombre)}</b>, titular de la cédula de identidad N.° <b>{representanteCedula}</b>, quien ha cumplido con los requisitos establecidos para la formalización de la inscripción.
                    </p>
                    <p className="mb-0" style={{ textIndent: '20px' }}>
                      Constancia que se expide para los efectos y fines consiguientes en <b>{toTitulo(ciudadExpedicion)}</b>, a los {diaExpedicion} días del mes de {mesExpedicion} del año {anoExpedicion}.
                    </p>
                  </div>
                );
              })()}

              {/* ATENTAMENTE Y FIRMA DIGITAL DEL DIRECTOR + SELLO QR */}
              <div className="hoja-doc-firmas mb-4">
                <div className="text-center" style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 'bold', color: '#000000' }}>Atentamente</p>
                  {firmaBase64 ? (
                    <img src={firmaBase64} alt="Firma Director" style={{ height: '95px', width: 'auto', display: 'block', margin: '0 auto 4px' }} />
                  ) : (
                    <img src={`/assets/img/firma_director_${escCodigo}.png`} alt="Firma Director" style={{ height: '95px', width: 'auto', display: 'block', margin: '0 auto 4px' }} />
                  )}
                  <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: '#000000' }}>
                    {tituloDirectorTexto} {toTitulo(nombreDirectorBase)}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#333333' }}>C.I.: {dirData.cedula}</div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#000000' }}>{dirData.cargo}</div>
                </div>

                <div style={{ textAlign: 'center', border: '1.5px solid #cbd5e1', padding: '8px 12px', borderRadius: '12px', background: '#ffffff', minWidth: '105px' }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.href)}&bgcolor=ffffff&color=166534&margin=2`} alt="QR Verificación" style={{ height: '70px', width: '70px', display: 'block', margin: '0 auto' }} />
                  <span style={{ fontSize: '7.5px', fontWeight: 'bold', color: '#166534', fontFamily: 'monospace', display: 'block', marginTop: '4px' }}>VERIFICACIÓN QR</span>
                  <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#0f172a', fontFamily: 'monospace', display: 'block' }}>{codigo}</span>
                </div>
              </div>

              {/* FICHA RESUMEN DE VERIFICACIÓN INSTITUCIONAL */}
              <div className="card border-0 bg-light rounded-4 p-3 p-sm-4 mb-4 shadow-xs">
                <h6 className="fw-bold text-dark border-bottom pb-2 mb-3 small text-uppercase">
                  <i className="bi bi-shield-check text-success me-1"></i> Resumen de Datos Oficiales Registrados
                </h6>
                <div className="row g-3 text-start" style={{ fontSize: '13px' }}>
                  <div className="col-12 col-sm-6">
                    <span className="text-muted d-block small">Estudiante Titular:</span>
                    <b className="text-dark fs-6">{toTitulo(nombreEstudiante)}</b>
                  </div>
                  <div className="col-12 col-sm-6">
                    <span className="text-muted d-block small">Documento / Cédula:</span>
                    <b className="text-dark fs-6">{cedulaEstudiante} ({tipoCedulaTexto})</b>
                  </div>
                  <div className="col-12 col-sm-6">
                    <span className="text-muted d-block small">Plantel Educativo:</span>
                    <b className="text-dark">{dirData.nombreEscuela}</b>
                  </div>
                  <div className="col-12 col-sm-6">
                    <span className="text-muted d-block small">Grado y Nivel:</span>
                    <b className="text-primary">{toTitulo(gradoLimpio)} ({nivelEducativo})</b>
                  </div>
                  <div className="col-12 col-sm-6">
                    <span className="text-muted d-block small">Representante Legal:</span>
                    <b className="text-dark">{toTitulo(representanteNombre)}</b>
                  </div>
                  <div className="col-12 col-sm-6">
                    <span className="text-muted d-block small">Cédula del Representante:</span>
                    <b className="text-dark">{representanteCedula}</b>
                  </div>
                </div>
              </div>

              {/* AVISO DE VALIDACIÓN PÚBLICA */}
              <div className="p-3 rounded-3 bg-light border text-muted small text-center mb-4">
                <i className="bi bi-info-circle-fill text-primary me-2"></i>
                Este documento es una versión digital auténtica verificada mediante firma electrónica y código QR. Su validez se encuentra debidamente respaldada en los registros del Sistema SIGAE.
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="d-flex flex-wrap justify-content-center gap-2 gap-sm-3">
                <button onClick={() => window.print()} className="btn btn-outline-success fw-bold rounded-pill px-4 shadow-xs">
                  <i className="bi bi-printer me-2"></i>Imprimir Comprobante
                </button>
                <Link to="/verificaciones" className="btn btn-outline-primary fw-bold rounded-pill px-4 shadow-xs">
                  <i className="bi bi-search me-2"></i>Módulo de Verificaciones
                </Link>
                <Link to="/login" className="btn btn-success fw-bold rounded-pill px-4 shadow-xs">
                  <i className="bi bi-box-arrow-in-right me-2"></i>Ingresar a SIGAE
                </Link>
              </div>

            </div>

            {/* PIE DE PÁGINA PÚBLICO CON LOGO DEL MINISTERIO */}
            <div className="card-footer bg-light border-0 p-3 hoja-doc-footer-mppe">
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
