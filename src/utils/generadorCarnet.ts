import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabase';
import { obtenerFirmaDirectorProtegida, obtenerDatosDirectorAsync, resolverEscuelaEstudiante } from './firmasSeguras';
import { toTitulo } from '../lib/formatters';

declare const Swal: any;

export interface PlantillaCarnetConfig {
  id: string;
  id_escuela: 'sb' | 'lb' | 'ambas';
  activo?: boolean;
  titulo_carnet: string;
  subtitulo_carnet: string;
  periodo_escolar: string;
  color_primario: string;
  color_secundario: string;
  color_acento: string;
  color_fondo: string;
  color_texto: string;
  mostrar_bandera: boolean;
  mostrar_logo_mppe: boolean;
  mostrar_logo_escuela: boolean;
  mostrar_qr: boolean;
  mostrar_firma_director: boolean;
  mostrar_grupo_sanguineo: boolean;
  mostrar_alergias: boolean;
  mostrar_direccion: boolean;
  mostrar_contacto_emergencia: boolean;
  leyenda_reverso: string;
  texto_validez: string;
}

export const PLANTILLAS_CARNET_DEFAULT: Record<string, PlantillaCarnetConfig> = {
  sb: {
    id: 'carnet-sb',
    id_escuela: 'sb',
    activo: true,
    titulo_carnet: 'CARNET ESTUDIANTIL',
    subtitulo_carnet: 'UNIDAD EDUCATIVA SANTA BÁRBARA',
    periodo_escolar: '2025 - 2026',
    color_primario: '#047857', // Verde esmeralda institucional SB
    color_secundario: '#065f46',
    color_acento: '#f59e0b', // Dorado
    color_fondo: '#ffffff',
    color_texto: '#1f2937',
    mostrar_bandera: true,
    mostrar_logo_mppe: true,
    mostrar_logo_escuela: true,
    mostrar_qr: true,
    mostrar_firma_director: true,
    mostrar_grupo_sanguineo: true,
    mostrar_alergias: true,
    mostrar_direccion: true,
    mostrar_contacto_emergencia: true,
    leyenda_reverso: 'Este carnet es personal e intransferible. Acredita al titular como estudiante regular activo del plantel durante el año escolar en curso. En caso de emergencia o extravío, favor notificar a la Dirección del plantel o al teléfono del representante.',
    texto_validez: 'Válido durante el Año Escolar 2025-2026'
  },
  lb: {
    id: 'carnet-lb',
    id_escuela: 'lb',
    activo: true,
    titulo_carnet: 'CARNET ESTUDIANTIL',
    subtitulo_carnet: 'UNIDAD EDUCATIVA LIBERTADOR BOLÍVAR',
    periodo_escolar: '2025 - 2026',
    color_primario: '#1d4ed8', // Azul real institucional LB
    color_secundario: '#1e40af',
    color_acento: '#eab308', // Amarillo oro
    color_fondo: '#ffffff',
    color_texto: '#1f2937',
    mostrar_bandera: true,
    mostrar_logo_mppe: true,
    mostrar_logo_escuela: true,
    mostrar_qr: true,
    mostrar_firma_director: true,
    mostrar_grupo_sanguineo: true,
    mostrar_alergias: true,
    mostrar_direccion: true,
    mostrar_contacto_emergencia: true,
    leyenda_reverso: 'Este carnet es personal e intransferible. Acredita al titular como estudiante regular activo del plantel durante el año escolar en curso. En caso de emergencia o extravío, favor notificar a la Dirección del plantel o al teléfono del representante.',
    texto_validez: 'Válido durante el Año Escolar 2025-2026'
  }
};

/**
 * Consulta si el carnet estudiantil se encuentra activo para emisión y descarga
 */
export const esCarnetActivo = (escCodigo?: string): boolean => {
  const esc = (escCodigo || '').toLowerCase().trim();
  if (esc === 'sb' || esc === 'lb') {
    const rawEsc = localStorage.getItem(`sigae_carnet_activo_${esc}`);
    if (rawEsc !== null) return rawEsc === 'true' || rawEsc === '1';
  }
  const rawGlobal = localStorage.getItem('sigae_carnet_activo');
  if (rawGlobal !== null) return rawGlobal === 'true' || rawGlobal === '1';
  return true; // Activo por defecto
};

/**
 * Carga el estado del carnet directamente desde ajustes_globales en Supabase
 */
export const cargarAjustesCarnetBD = async (): Promise<{ sb: boolean; lb: boolean; global: boolean }> => {
  try {
    const { data } = await supabase
      .from('ajustes_globales')
      .select('*')
      .in('clave', ['carnet_activo_sb', 'carnet_activo_lb', 'carnet_activo']);
    
    if (data && data.length > 0) {
      const cSB = data.find(x => x.clave === 'carnet_activo_sb');
      const cLB = data.find(x => x.clave === 'carnet_activo_lb');
      const cGlobal = data.find(x => x.clave === 'carnet_activo');

      const isSb = cSB ? cSB.valor === 'true' : true;
      const isLb = cLB ? cLB.valor === 'true' : true;
      const isGlob = cGlobal ? cGlobal.valor === 'true' : (isSb || isLb);

      localStorage.setItem('sigae_carnet_activo_sb', isSb ? 'true' : 'false');
      localStorage.setItem('sigae_carnet_activo_lb', isLb ? 'true' : 'false');
      localStorage.setItem('sigae_carnet_activo', isGlob ? 'true' : 'false');

      return { sb: isSb, lb: isLb, global: isGlob };
    }
  } catch (e) {
    console.warn('Error leyendo carnet_activo de BD:', e);
  }
  return {
    sb: esCarnetActivo('sb'),
    lb: esCarnetActivo('lb'),
    global: esCarnetActivo()
  };
};

/**
 * Activa o desactiva la emisión del Carnet Estudiantil en el sistema
 */
export const setCarnetActivo = async (activo: boolean, escCodigo?: string): Promise<void> => {
  const esc = (escCodigo || 'global').toLowerCase().trim();
  const nowIso = new Date().toISOString();
  
  if (esc === 'sb' || esc === 'lb') {
    localStorage.setItem(`sigae_carnet_activo_${esc}`, activo ? 'true' : 'false');
    try {
      await supabase.from('ajustes_globales').upsert({
        clave: `carnet_activo_${esc}`,
        valor: activo ? 'true' : 'false',
        descripcion: `Estado de emisión del Carnet Estudiantil (${esc.toUpperCase()})`,
        actualizado_en: nowIso
      }, { onConflict: 'clave' });
    } catch (err) {
      console.warn('Aviso sincronización carnet en BD:', err);
    }
  } else {
    localStorage.setItem('sigae_carnet_activo_sb', activo ? 'true' : 'false');
    localStorage.setItem('sigae_carnet_activo_lb', activo ? 'true' : 'false');
    localStorage.setItem('sigae_carnet_activo', activo ? 'true' : 'false');
    try {
      await supabase.from('ajustes_globales').upsert([
        { clave: 'carnet_activo_sb', valor: activo ? 'true' : 'false', descripcion: 'Estado carnet SB', actualizado_en: nowIso },
        { clave: 'carnet_activo_lb', valor: activo ? 'true' : 'false', descripcion: 'Estado carnet LB', actualizado_en: nowIso },
        { clave: 'carnet_activo', valor: activo ? 'true' : 'false', descripcion: 'Estado global carnet', actualizado_en: nowIso }
      ], { onConflict: 'clave' });
    } catch (err) {
      console.warn('Aviso sincronización carnet en BD:', err);
    }
  }
};

/**
 * Alterna el estado activo/inactivo del carnet y retorna el nuevo estado
 */
export const toggleCarnetActivo = async (escCodigo?: string): Promise<boolean> => {
  const nuevoEstado = !esCarnetActivo(escCodigo);
  await setCarnetActivo(nuevoEstado, escCodigo);
  return nuevoEstado;
};

export const obtenerPlantillaCarnet = (escCodigo: string): PlantillaCarnetConfig => {
  const key = (escCodigo || 'sb').toLowerCase().trim();
  try {
    const custom = localStorage.getItem(`sigae_plantilla_carnet_${key}`) || localStorage.getItem('sigae_plantilla_carnet');
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed && typeof parsed === 'object') {
        return { ...(PLANTILLAS_CARNET_DEFAULT[key] || PLANTILLAS_CARNET_DEFAULT['sb']), ...parsed };
      }
    }
  } catch (e) {
    console.warn('Error leyendo plantilla de carnet personalizada:', e);
  }
  return PLANTILLAS_CARNET_DEFAULT[key] || PLANTILLAS_CARNET_DEFAULT['sb'];
};

export const guardarPlantillaCarnet = (plantilla: PlantillaCarnetConfig) => {
  const key = (plantilla.id_escuela || 'sb').toLowerCase();
  localStorage.setItem(`sigae_plantilla_carnet_${key}`, JSON.stringify(plantilla));
  localStorage.setItem('sigae_plantilla_carnet', JSON.stringify(plantilla));
};

const obtenerImagenBase64 = async (url: string): Promise<string> => {
  if (!url) return '';
  if (url.startsWith('data:image')) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) return '';
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return '';
  }
};

export interface DatosCarnetProcesados {
  escCodigo: 'sb' | 'lb';
  nombreEscuela: string;
  nombreCompleto: string;
  cedulaEstudiante: string;
  gradoSeccion: string;
  rutaTransporte: string;
  fechaNacimiento: string;
  edad: string;
  fotoEstudiante: string;
  nombreRepresentante: string;
  cedulaRepresentante: string;
  telefonoRepresentante: string;
  telefonoEmergencia: string;
  grupoSanguineo: string;
  alergias: string;
  direccion: string;
  codigoUnico: string;
  urlVerificacion: string;
  base64Qr: string;
  base64FirmaDirector: string;
  base64LogoEscuela: string;
  base64LogoMppe: string;
  nombreDirector: string;
  cargoDirector: string;
  config: PlantillaCarnetConfig;
}

export const prepararDatosCarnet = async (
  datosEst: any,
  formDatos?: any
): Promise<DatosCarnetProcesados> => {
  const dForm = (formDatos || {}) as any;
  const dEst = (datosEst || {}) as any;
  const dAct = (datosEst?.datos_actualizados || {}) as any;

  const escCodigo = resolverEscuelaEstudiante(datosEst, formDatos);
  const config = obtenerPlantillaCarnet(escCodigo);
  const anoActual = new Date().getFullYear();

  const nombres = dForm.estudiante_nombres || dAct.estudiante_nombres || dEst.nombres_estudiante || 'ESTUDIANTE';
  const apellidos = dForm.estudiante_apellidos || dAct.estudiante_apellidos || dEst.apellidos_estudiante || '';
  const nombreCompleto = toTitulo(`${nombres} ${apellidos}`.trim());

  const cedulaEstudiante = dForm.estudiante_cedula || dAct.estudiante_cedula || dEst.cedula_estudiante || 'No posee';
  const grado = dForm.grado_solicitado || dAct.grado_solicitado || dEst.grado_actual || 'Grado asignado';
  const seccion = dForm.seccion_actual || dAct.seccion_actual || dEst.seccion_actual || 'A';
  const gradoSeccion = `${grado} - Sección "${seccion}"`;

  // Ruta de transporte escolar seleccionada
  const rutaTransporte = dForm.ruta_transporte || 
    dAct.ruta_transporte || 
    dEst.ruta_transporte || 
    dForm.transporte_ruta || 
    dAct.transporte_ruta || 
    dEst.transporte_ruta || 
    dForm.ruta_escolar || 
    dAct.ruta_escolar || 
    dEst.ruta_escolar || 
    (escCodigo === 'sb' ? 'Ruta 1 (El Tejero - Santa Bárbara)' : 'Ruta 1 (Miraflores - Casco Central)');

  const fechaNac = dForm.estudiante_fecha_nacimiento || dAct.estudiante_fecha_nacimiento || dEst.fecha_nacimiento || '';
  let edadCalculada = '';
  if (fechaNac) {
    const nac = new Date(fechaNac);
    if (!isNaN(nac.getTime())) {
      const hoy = new Date();
      let ed = hoy.getFullYear() - nac.getFullYear();
      const m = hoy.getMonth() - nac.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) ed--;
      if (ed >= 0 && ed < 100) edadCalculada = `${ed} años`;
    }
  }

  // Foto de carnet cargada por el representante
  const fotoEstudiante = dForm.foto_carnet_url || dAct.foto_carnet_url || dEst.foto_carnet_url || dForm.doc_foto_estudiante || dEst.doc_foto_estudiante || '';

  // Representante y contacto
  const repNombres = dForm.representante_nombres || dAct.representante_nombres || dEst.nombres_representante || '';
  const repApellidos = dForm.representante_apellidos || dAct.representante_apellidos || dEst.apellidos_representante || '';
  const nombreRepresentante = toTitulo(`${repNombres} ${repApellidos}`.trim()) || 'Representante Legal';
  const cedulaRepresentante = dForm.representante_cedula || dAct.representante_cedula || dEst.cedula_representante || 'Sin cédula';
  const telefonoRepresentante = dForm.representante_telefono || dAct.representante_telefono || dEst.telefono_representante || 'No registrado';
  const telefonoEmergencia = dForm.contacto_emergencia_telefono || dAct.contacto_emergencia_telefono || dForm.representante_telefono_habitacion || telefonoRepresentante;

  // Salud y dirección
  const grupoSanguineo = dForm.estudiante_grupo_sanguineo || dAct.estudiante_grupo_sanguineo || 'No especificado';
  const alergias = dForm.estudiante_alergias || dAct.estudiante_alergias || dForm.estudiante_condicion_medica || dAct.estudiante_condicion_medica || 'Ninguna registrada';
  const direccion = dForm.direccion_habitacion || dAct.direccion_habitacion || dForm.estudiante_direccion || dAct.estudiante_direccion || 'Monagas, Venezuela';

  // Código único y QR
  const cedulaLimpia = cedulaEstudiante.replace(/\D/g, '');
  const codigoUnico = dForm.codigo_unico || dAct.codigo_unico || dEst.codigo_unico || `CR-${escCodigo.toUpperCase()}-${cedulaLimpia || Math.floor(1000 + Math.random() * 9000)}-${anoActual}`;

  const esLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const baseUrl = esLocal ? 'https://sigae-hh6u.onrender.com' : window.location.origin;
  const urlVerificacion = `${baseUrl}/validar-constancia/${encodeURIComponent(codigoUnico)}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(urlVerificacion)}&bgcolor=ffffff&color=0f172a&margin=1`;

  let base64LogoEscuela = `/assets/img/logo_${escCodigo}.png`;
  let base64LogoMppe = '/assets/img/logoMPPE.png';
  let base64Qr = '';
  let base64FirmaDirector = '';

  try {
    [base64LogoEscuela, base64LogoMppe, base64Qr, base64FirmaDirector] = await Promise.all([
      obtenerImagenBase64(`/assets/img/logo_${escCodigo}.png`),
      obtenerImagenBase64('/assets/img/logoMPPE.png'),
      obtenerImagenBase64(qrApiUrl),
      obtenerFirmaDirectorProtegida(escCodigo, codigoUnico)
    ]);
  } catch (err) {
    console.warn('Error precargando imágenes de carnet:', err);
  }

  const dirData = await obtenerDatosDirectorAsync(escCodigo);
  const esDirectora = escCodigo === 'sb' || (dirData?.cargoGenerico || '').toLowerCase().includes('directora');
  const prefijoDir = esDirectora ? 'Profa.' : 'Prof.';
  const nombreDirector = `${prefijoDir} ${toTitulo(dirData.nombreCompleto || (escCodigo === 'sb' ? 'Elika Dayana Chaviel Rondón' : 'José Vicente Millán Montaño'))}`;
  const cargoDirector = dirData.cargoGenerico || (esDirectora ? 'Directora' : 'Director');
  const nombreEscuela = escCodigo === 'sb' ? 'Unidad Educativa Santa Bárbara' : 'Unidad Educativa Libertador Bolívar';

  return {
    escCodigo,
    nombreEscuela,
    nombreCompleto,
    cedulaEstudiante,
    gradoSeccion,
    rutaTransporte,
    fechaNacimiento: fechaNac ? new Date(fechaNac).toLocaleDateString('es-VE') : 'No especificada',
    edad: edadCalculada,
    fotoEstudiante,
    nombreRepresentante,
    cedulaRepresentante,
    telefonoRepresentante,
    telefonoEmergencia,
    grupoSanguineo,
    alergias,
    direccion,
    codigoUnico,
    urlVerificacion,
    base64Qr: base64Qr || qrApiUrl,
    base64FirmaDirector,
    base64LogoEscuela,
    base64LogoMppe,
    nombreDirector,
    cargoDirector,
    config
  };
};

/**
 * Genera el contenedor HTML de Anverso y Reverso del Carnet listo para previsualización e impresión
 */
export const renderCarnetContainerHTML = (d: DatosCarnetProcesados, config = d.config): string => {
  const cPrim = config.color_primario || (d.escCodigo === 'sb' ? '#047857' : '#1d4ed8');
  const cAcento = config.color_acento || '#f59e0b';

  return `
    <div id="carnet-export-wrapper" style="display: flex; flex-direction: row; gap: 28px; justify-content: center; align-items: center; padding: 18px; background: #f1f5f9; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; box-sizing: border-box; flex-wrap: wrap;">
      
      <!-- ================= ANVERSO (FRENTE) ================= -->
      <div id="carnet-anverso" style="width: 336px; height: 532px; background: #ffffff; border-radius: 18px; box-shadow: 0 12px 28px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06); position: relative; overflow: hidden; border: 1.5px solid #cbd5e1; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
        
        <div>
          <!-- Bandera Tricolor Nacional con 8 Estrellas (República Bolivariana de Venezuela) -->
          ${config.mostrar_bandera ? `
            <div style="width: 100%; display: flex; flex-direction: column; overflow: hidden; border-top-left-radius: 16px; border-top-right-radius: 16px;">
              <div style="height: 4px; background: #facc15;"></div>
              <div style="height: 8px; background: #003893; display: flex; justify-content: center; align-items: center; gap: 3px; color: #ffffff; font-size: 6.5px; line-height: 1; font-weight: bold; user-select: none;">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <div style="height: 4px; background: #cf142b;"></div>
            </div>
          ` : ''}

          <!-- Cabecera Institucional TOTALMENTE SOBRE FONDO BLANCO -->
          <div style="background: #ffffff; padding: 10px 14px 8px; display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #f1f5f9;">
            ${config.mostrar_logo_escuela && d.base64LogoEscuela ? `
              <img src="${d.base64LogoEscuela}" alt="Logo Escuela" style="width: 46px; height: 46px; object-fit: contain; flex-shrink: 0;" />
            ` : ''}
            <div style="flex: 1; text-align: left; line-height: 1.15;">
              <div style="font-size: 7.5px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.6px;">
                REPÚBLICA BOLIVARIANA DE VENEZUELA
              </div>
              <div style="font-size: 6.5px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 1px;">
                MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN
              </div>
              <div style="font-size: 11px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-top: 2px;">
                ${d.nombreEscuela}
              </div>
            </div>
          </div>

          <!-- Cinta Distintiva del Carnet & Periodo Escolar -->
          <div style="background: #f8fafc; padding: 5px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0;">
            <span style="background: #0f172a; color: #ffffff; font-size: 8.5px; font-weight: 900; letter-spacing: 0.8px; text-transform: uppercase; padding: 2px 10px; border-radius: 12px; display: inline-flex; align-items: center; gap: 4px;">
              <i class="bi bi-person-badge-fill" style="color: ${cAcento}; font-size: 9px;"></i> ${config.titulo_carnet}
            </span>
            <span style="font-size: 8px; font-weight: 800; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 2px 8px; border-radius: 10px;">
              ${config.periodo_escolar}
            </span>
          </div>

          <!-- Cuerpo: Foto + Datos del Estudiante + QR Frontal -->
          <div style="padding: 10px 12px 8px; display: flex; flex-direction: column; align-items: center;">
            
            <div style="display: flex; gap: 12px; width: 100%; align-items: center; margin-bottom: 7px;">
              <!-- Marco de Foto PVC -->
              <div style="width: 96px; height: 118px; border-radius: 10px; border: 2.5px solid ${cPrim}; box-shadow: 0 3px 8px rgba(0,0,0,0.12); overflow: hidden; background: #f8fafc; display: flex; align-items: center; justify-content: center; position: relative; flex-shrink: 0;">
                ${d.fotoEstudiante ? `
                  <img src="${d.fotoEstudiante}" alt="Foto Estudiante" style="width: 100%; height: 100%; object-fit: cover;" />
                ` : `
                  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8;">
                    <svg width="42" height="42" fill="currentColor" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/></svg>
                    <span style="font-size: 7px; font-weight: 800; margin-top: 2px; text-transform: uppercase; color: #64748b;">Sin Foto</span>
                  </div>
                `}
                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(15,23,42,0.9); color: #ffffff; font-size: 7px; font-weight: 800; text-align: center; padding: 1.5px 0; text-transform: uppercase; letter-spacing: 0.5px;">ESTUDIANTE</div>
              </div>

              <!-- Bloque Datos Principales -->
              <div style="flex: 1; text-align: left; display: flex; flex-direction: column; gap: 4px;">
                <div style="font-size: 12.5px; font-weight: 900; color: #0f172a; line-height: 1.15; text-transform: uppercase; word-break: break-word;">
                  ${d.nombreCompleto}
                </div>
                <div style="font-size: 10.5px; font-weight: 800; color: #0f172a; display: inline-flex; align-items: center; gap: 4px;">
                  <span style="background: ${cPrim}15; color: ${cPrim}; font-size: 8px; font-weight: 900; padding: 1px 6px; border-radius: 4px; border: 1px solid ${cPrim}30;">C.I.</span>
                  <span>${d.cedulaEstudiante}</span>
                </div>
                <div style="background: #f8fafc; border-radius: 6px; padding: 3px 6px; border: 1px solid #e2e8f0; margin-top: 1px;">
                  <div style="font-size: 7px; font-weight: 800; color: #64748b; text-transform: uppercase;">Grado y Sección</div>
                  <div style="font-size: 9.5px; font-weight: 800; color: #1e293b;">${d.gradoSeccion}</div>
                </div>
              </div>
            </div>

            <!-- RUTA ESCOLAR DESTACADA -->
            <div style="width: 100%; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 4px 8px; margin-bottom: 7px; display: flex; align-items: center; gap: 7px; box-sizing: border-box;">
              <div style="font-size: 14px; line-height: 1;">🚍</div>
              <div style="flex: 1; text-align: left; line-height: 1.15;">
                <div style="font-size: 7px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.3px;">Ruta Escolar Asignada</div>
                <div style="font-size: 9.5px; font-weight: 800; color: #15803d;">${d.rutaTransporte}</div>
              </div>
            </div>

            <!-- QR Frontal de Validación -->
            ${config.mostrar_qr && d.base64Qr ? `
              <div style="width: 100%; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 4px 8px; display: flex; align-items: center; gap: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); box-sizing: border-box;">
                <img src="${d.base64Qr}" alt="QR Verificación" style="width: 44px; height: 44px; border-radius: 4px; flex-shrink: 0;" />
                <div style="flex: 1; text-align: left; line-height: 1.2;">
                  <div style="font-size: 7.5px; font-weight: 900; color: #0f172a; text-transform: uppercase; display: flex; align-items: center; gap: 3px;">
                    <i class="bi bi-patch-check-fill" style="color: ${cPrim}; font-size: 8px;"></i> Validación Digital QR
                  </div>
                  <div style="font-size: 6.8px; color: #64748b; margin-top: 1px;">Escanea para verificar la autenticidad escolar.</div>
                  <div style="font-size: 7.5px; font-family: monospace; font-weight: 800; color: ${cPrim}; margin-top: 1px;">${d.codigoUnico}</div>
                </div>
              </div>
            ` : ''}

          </div>
        </div>

        <!-- PIE DE PÁGINA ANVERSO SOBRE FONDO BLANCO CON LOGO MPPE -->
        <div style="background: #ffffff; border-top: 1.5px solid #e2e8f0; padding: 6px 14px; display: flex; justify-content: space-between; align-items: center;">
          ${config.mostrar_logo_mppe && d.base64LogoMppe ? `
            <img src="${d.base64LogoMppe}" alt="Logo MPPE" style="height: 25px; width: auto; object-fit: contain;" />
          ` : '<div style="font-size: 7.5px; font-weight: 800; color: #64748b;">MPPE</div>'}
          <div style="text-align: right; font-size: 7.5px; font-weight: 700; color: #475569;">
            ${config.texto_validez}
          </div>
        </div>

      </div>


      <!-- ================= REVERSO (DORSO) ================= -->
      <div id="carnet-reverso" style="width: 336px; height: 532px; background: #ffffff; border-radius: 18px; box-shadow: 0 12px 28px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06); position: relative; overflow: hidden; border: 1.5px solid #cbd5e1; display: flex; flex-direction: column; justify-content: space-between; box-sizing: border-box;">
        
        <div>
          <!-- Bandera Tricolor Nacional con 8 Estrellas en el Reverso -->
          ${config.mostrar_bandera ? `
            <div style="width: 100%; display: flex; flex-direction: column; overflow: hidden; border-top-left-radius: 16px; border-top-right-radius: 16px;">
              <div style="height: 4px; background: #facc15;"></div>
              <div style="height: 8px; background: #003893; display: flex; justify-content: center; align-items: center; gap: 3px; color: #ffffff; font-size: 6.5px; line-height: 1; font-weight: bold; user-select: none;">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <div style="height: 4px; background: #cf142b;"></div>
            </div>
          ` : ''}

          <!-- Cabecera Reverso SOBRE BLANCO -->
          <div style="background: #ffffff; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9;">
            <span style="font-size: 8.5px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
              INFORMACIÓN MÉDICA Y DE EMERGENCIA
            </span>
            <span style="font-size: 7.5px; font-weight: 800; background: #e2e8f0; color: #334155; padding: 1px 7px; border-radius: 6px;">
              DORSO
            </span>
          </div>

          <!-- Contenido Reverso -->
          <div style="padding: 8px 12px; display: flex; flex-direction: column; gap: 5px;">
            
            <!-- Fila Representante & Contactos -->
            ${config.mostrar_contacto_emergencia ? `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 8px;">
                <div style="font-size: 7.5px; font-weight: 800; color: ${cPrim}; text-transform: uppercase; display: flex; align-items: center; gap: 3px;">
                  <i class="bi bi-person-heart"></i> Representante Legal:
                </div>
                <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; margin-top: 1px;">${d.nombreRepresentante}</div>
                <div style="display: flex; justify-content: space-between; margin-top: 2px; color: #334155; font-size: 8px;">
                  <span><b>C.I:</b> ${d.cedulaRepresentante}</span>
                  <span><b>Teléfono:</b> ${d.telefonoRepresentante}</span>
                </div>
                ${d.telefonoEmergencia && d.telefonoEmergencia !== d.telefonoRepresentante ? `
                  <div style="margin-top: 2px; color: #dc2626; font-size: 8px; font-weight: 700;">
                    <b>Emergencia:</b> ${d.telefonoEmergencia}
                  </div>
                ` : ''}
              </div>
            ` : ''}

            <!-- Fila Médica: Grupo Sanguíneo y Alergias -->
            <div style="display: flex; gap: 6px;">
              ${config.mostrar_grupo_sanguineo ? `
                <div style="flex: 1; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 4px 6px; text-align: center;">
                  <div style="font-size: 7px; font-weight: 800; color: #991b1b; text-transform: uppercase;">Grupo Sanguíneo</div>
                  <div style="font-size: 11px; font-weight: 900; color: #dc2626; margin-top: 1px;">${d.grupoSanguineo}</div>
                </div>
              ` : ''}
              ${config.mostrar_alergias ? `
                <div style="flex: 2; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 4px 6px;">
                  <div style="font-size: 7px; font-weight: 800; color: #92400e; text-transform: uppercase;">Alergias / Condición</div>
                  <div style="font-size: 8.5px; font-weight: 700; color: #78350f; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px;">${d.alergias}</div>
                </div>
              ` : ''}
            </div>

            <!-- Dirección -->
            ${config.mostrar_direccion ? `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 6px; color: #475569; font-size: 8px;">
                <span style="font-weight: 800; color: #1e293b; text-transform: uppercase;">Dirección:</span>
                <span> ${d.direccion}</span>
              </div>
            ` : ''}

            <!-- Leyenda Institucional -->
            <div style="background: #f8fafc; border-left: 3px solid ${cPrim}; border-radius: 4px; padding: 4px 6px; font-size: 6.8px; color: #334155; line-height: 1.25; text-align: justify;">
              ${config.leyenda_reverso}
            </div>

            <!-- FIRMA DEL DIRECTOR Y QR EN EL REVERSO TAMBIÉN -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 3px; padding-top: 3px; border-top: 1px dashed #cbd5e1;">
              
              <!-- QR en el Reverso -->
              ${config.mostrar_qr && d.base64Qr ? `
                <div style="text-align: center; background: #ffffff; padding: 2px; border: 1px solid #cbd5e1; border-radius: 6px; flex-shrink: 0;">
                  <img src="${d.base64Qr}" alt="QR Reverso" style="width: 48px; height: 48px; display: block;" />
                  <span style="font-size: 6.5px; font-family: monospace; font-weight: 800; color: #0f172a; display: block; margin-top: 1px;">${d.codigoUnico}</span>
                </div>
              ` : ''}

              <!-- Firma del Director -->
              ${config.mostrar_firma_director ? `
                <div style="flex: 1; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                  ${d.base64FirmaDirector ? `
                    <img src="${d.base64FirmaDirector}" alt="Firma Director" style="height: 42px; object-fit: contain; margin-bottom: -6px;" />
                  ` : `
                    <div style="height: 24px;"></div>
                  `}
                  <div style="width: 140px; border-top: 1px solid #475569; margin-top: 2px;"></div>
                  <div style="font-size: 8.5px; font-weight: 800; color: #0f172a; margin-top: 1px;">${d.nombreDirector}</div>
                  <div style="font-size: 7.5px; font-weight: 700; color: ${cPrim}; text-transform: uppercase;">${d.cargoDirector} del Plantel</div>
                </div>
              ` : ''}

            </div>

          </div>
        </div>

        <!-- PIE DE PÁGINA REVERSO SOBRE BLANCO CON LOGO MPPE -->
        <div style="background: #ffffff; border-top: 1.5px solid #e2e8f0; padding: 6px 14px; display: flex; justify-content: space-between; align-items: center;">
          ${config.mostrar_logo_mppe && d.base64LogoMppe ? `
            <img src="${d.base64LogoMppe}" alt="Logo MPPE" style="height: 25px; width: auto; object-fit: contain;" />
          ` : '<div style="font-size: 7.5px; font-weight: 800; color: #64748b;">MPPE</div>'}
          <div style="text-align: right; font-size: 7.5px; font-weight: 700; color: #64748b;">
            SIGAE Control Estudiantil • ID: <span style="font-family: monospace; font-weight: 800; color: #0f172a;">${d.codigoUnico}</span>
          </div>
        </div>

      </div>

    </div>
  `;
};

/**
 * Descarga el Carnet en formato PDF (hoja estándar con Anverso y Reverso alineados para recorte y plastificado)
 */
export const descargarCarnetPDF = async (datosCarnet: DatosCarnetProcesados) => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.innerHTML = renderCarnetContainerHTML(datosCarnet);
  document.body.appendChild(container);

  try {
    const elAnverso = container.querySelector('#carnet-anverso') as HTMLElement;
    const elReverso = container.querySelector('#carnet-reverso') as HTMLElement;

    if (!elAnverso || !elReverso) throw new Error('No se pudo encontrar los elementos del carnet');

    const [canvasAnverso, canvasReverso] = await Promise.all([
      html2canvas(elAnverso, { scale: 3, useCORS: true, backgroundColor: '#ffffff' }),
      html2canvas(elReverso, { scale: 3, useCORS: true, backgroundColor: '#ffffff' })
    ]);

    const imgAnverso = canvasAnverso.toDataURL('image/png');
    const imgReverso = canvasReverso.toDataURL('image/png');

    // PDF en orientación horizontal o vertical (formato Carta)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'letter'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();

    // Encabezado de la hoja de impresión
    pdf.setFontSize(14);
    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${datosCarnet.nombreEscuela.toUpperCase()}`, pageWidth / 2, 18, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setTextColor(71, 85, 105);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Carnet Estudiantil Oficial - Año Escolar ${datosCarnet.config.periodo_escolar}`, pageWidth / 2, 24, { align: 'center' });
    pdf.text(`Estudiante: ${datosCarnet.nombreCompleto} | C.I: ${datosCarnet.cedulaEstudiante} | Código: ${datosCarnet.codigoUnico}`, pageWidth / 2, 29, { align: 'center' });

    // Dimensiones de impresión del carnet (CR80: 85.6mm x 54mm)
    const cardWidthMm = 54;
    const cardHeightMm = 85.6;
    const posY = 38;
    const spacing = 14;

    const startX = (pageWidth - (cardWidthMm * 2 + spacing)) / 2;

    // Guías de corte punteadas
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineDashPattern([2, 2], 0);
    
    // Frente
    pdf.rect(startX - 0.5, posY - 0.5, cardWidthMm + 1, cardHeightMm + 1);
    pdf.addImage(imgAnverso, 'PNG', startX, posY, cardWidthMm, cardHeightMm);

    // Dorso
    const posX2 = startX + cardWidthMm + spacing;
    pdf.rect(posX2 - 0.5, posY - 0.5, cardWidthMm + 1, cardHeightMm + 1);
    pdf.addImage(imgReverso, 'PNG', posX2, posY, cardWidthMm, cardHeightMm);

    // Instrucciones de recorte
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text('1. Imprima en papel fotográfico, glasé o cartulina resistente.', pageWidth / 2, posY + cardHeightMm + 10, { align: 'center' });
    pdf.text('2. Recorte por el borde exterior y plastifique / lamine ambas caras.', pageWidth / 2, posY + cardHeightMm + 14, { align: 'center' });
    pdf.text('3. El código QR permite la verificación oficial del estatus escolar en el portal público SIGAE.', pageWidth / 2, posY + cardHeightMm + 18, { align: 'center' });

    const nombreLimpio = datosCarnet.nombreCompleto.replace(/\s+/g, '_');
    pdf.save(`Carnet_${datosCarnet.escCodigo.toUpperCase()}_${nombreLimpio}_${datosCarnet.cedulaEstudiante}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
};

/**
 * Descarga el Carnet como imágenes PNG individuales de alta resolución
 */
export const descargarCarnetPNG = async (datosCarnet: DatosCarnetProcesados, cara: 'anverso' | 'reverso' | 'ambas' = 'ambas') => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.innerHTML = renderCarnetContainerHTML(datosCarnet);
  document.body.appendChild(container);

  try {
    const elAnverso = container.querySelector('#carnet-anverso') as HTMLElement;
    const elReverso = container.querySelector('#carnet-reverso') as HTMLElement;

    const nombreLimpio = datosCarnet.nombreCompleto.replace(/\s+/g, '_');

    if (cara === 'anverso' || cara === 'ambas') {
      const cAnv = await html2canvas(elAnverso, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `Carnet_${datosCarnet.escCodigo.toUpperCase()}_${nombreLimpio}_Anverso.png`;
      link.href = cAnv.toDataURL('image/png');
      link.click();
    }

    if (cara === 'reverso' || cara === 'ambas') {
      const cRev = await html2canvas(elReverso, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const link2 = document.createElement('a');
      link2.download = `Carnet_${datosCarnet.escCodigo.toUpperCase()}_${nombreLimpio}_Reverso.png`;
      link2.href = cRev.toDataURL('image/png');
      link2.click();
    }
  } finally {
    document.body.removeChild(container);
  }
};

/**
 * Modal Completo de Vista Previa, Emisión y Descarga del Carnet Estudiantil
 * Incluye botón de activación/desactivación rápida y opciones de descarga
 */
export const mostrarModalCarnetEstudiantil = async (datosEst: any, formDatos?: any) => {
  if (!Swal) return;

  Swal.fire({
    title: 'Generando Carnet Estudiantil...',
    html: '<div class="spinner-border text-warning" role="status"></div><p class="mt-2 small text-muted">Procesando fotografía, código QR y firma digital de la Dirección...</p>',
    allowOutsideClick: false,
    showConfirmButton: false,
  });

  try {
    const datosCarnet = await prepararDatosCarnet(datosEst, formDatos);
    const carnetHtml = renderCarnetContainerHTML(datosCarnet);
    const estadoActivo = esCarnetActivo(datosCarnet.escCodigo);

    Swal.fire({
      title: `<div class="d-flex align-items-center justify-content-between w-100 flex-wrap gap-2 px-2">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-person-badge-fill text-warning fs-4"></i>
          <span class="fw-bold">Carnet Estudiantil Oficial</span>
        </div>
        <div>
          <button id="btn-toggle-activo-modal" class="btn btn-sm ${estadoActivo ? 'btn-success' : 'btn-outline-danger'} fw-bold px-3 py-1 rounded-pill shadow-sm" title="Haz clic para activar o desactivar la emisión del carnet">
            <i class="bi ${estadoActivo ? 'bi-toggle-on' : 'bi-toggle-off'} me-1"></i> ${estadoActivo ? 'CARNET ACTIVO' : 'CARNET INACTIVO'}
          </button>
        </div>
      </div>`,
      html: `
        <p class="text-muted small mb-2 text-start px-2">
          Documento de acreditación oficial para <strong>${datosCarnet.nombreCompleto}</strong> (${datosCarnet.gradoSeccion}) con verificación QR y firma protegida de la Dirección.
        </p>
        
        <!-- Contenedor del Carnet -->
        <div class="p-3 bg-light rounded-3 border mb-3 text-center overflow-auto shadow-inner" style="max-height: 490px;">
          ${carnetHtml}
        </div>

        <!-- Botones de Acción -->
        <div class="d-flex flex-column gap-2">
          <div class="row g-2">
            <div class="col-md-6">
              <button id="btn-carnet-pdf" class="btn btn-warning w-100 py-2 fw-bold text-dark rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2">
                <i class="bi bi-file-earmark-pdf-fill fs-5"></i> Descargar PDF Imprimible
              </button>
            </div>
            <div class="col-md-6">
              <button id="btn-carnet-png" class="btn btn-dark w-100 py-2 fw-bold text-white rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2">
                <i class="bi bi-image fs-5"></i> Descargar Imágenes (PNG)
              </button>
            </div>
          </div>

          <div class="row g-2">
            <div class="col-md-6">
              <button id="btn-carnet-wa" class="btn btn-outline-success w-100 py-2 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2">
                <i class="bi bi-whatsapp fs-5"></i> Enviar por WhatsApp
              </button>
            </div>
            <div class="col-md-6">
              <button id="btn-carnet-validar" class="btn btn-outline-primary w-100 py-2 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2">
                <i class="bi bi-patch-check-fill fs-5"></i> Probar Validación QR
              </button>
            </div>
          </div>
        </div>
      `,
      width: '820px',
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Cerrar',
      didOpen: () => {
        // Toggle de activación del carnet
        document.getElementById('btn-toggle-activo-modal')?.addEventListener('click', async () => {
          const nuevo = await toggleCarnetActivo(datosCarnet.escCodigo);
          const btn = document.getElementById('btn-toggle-activo-modal');
          if (btn) {
            btn.className = `btn btn-sm ${nuevo ? 'btn-success' : 'btn-outline-danger'} fw-bold px-3 py-1 rounded-pill shadow-sm`;
            btn.innerHTML = `<i class="bi ${nuevo ? 'bi-toggle-on' : 'bi-toggle-off'} me-1"></i> ${nuevo ? 'CARNET ACTIVO' : 'CARNET INACTIVO'}`;
          }
          if (Swal.mixin) {
            const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2500 });
            Toast.fire({ icon: nuevo ? 'success' : 'warning', title: `Carnet Estudiantil ${nuevo ? 'ACTIVADO' : 'DESACTIVADO'} para el sistema` });
          }
        });

        document.getElementById('btn-carnet-pdf')?.addEventListener('click', async () => {
          Swal.showLoading();
          await descargarCarnetPDF(datosCarnet);
          Swal.hideLoading();
        });

        document.getElementById('btn-carnet-png')?.addEventListener('click', async () => {
          Swal.showLoading();
          await descargarCarnetPNG(datosCarnet, 'ambas');
          Swal.hideLoading();
        });

        document.getElementById('btn-carnet-wa')?.addEventListener('click', () => {
          const mensaje = encodeURIComponent(
            `¡Hola! Te compartimos el Carnet Estudiantil Oficial SIGAE de ${datosCarnet.nombreCompleto} (C.I: ${datosCarnet.cedulaEstudiante}) para el Año Escolar ${datosCarnet.config.periodo_escolar}.\n\nPuedes verificar su autenticidad directamente en el siguiente enlace oficial:\n${datosCarnet.urlVerificacion}`
          );
          const tlfLimpio = datosCarnet.telefonoRepresentante.replace(/\D/g, '');
          const urlWa = tlfLimpio ? `https://wa.me/58${tlfLimpio}?text=${mensaje}` : `https://wa.me/?text=${mensaje}`;
          window.open(urlWa, '_blank');
        });

        document.getElementById('btn-carnet-validar')?.addEventListener('click', () => {
          window.open(datosCarnet.urlVerificacion, '_blank');
        });
      }
    });
  } catch (err: any) {
    console.error('Error generando carnet:', err);
    Swal.fire('Error', 'No se pudo generar el carnet: ' + (err.message || 'Error inesperado'), 'error');
  }
};
