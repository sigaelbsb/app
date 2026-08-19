import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import jsQR from 'jsqr';
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
  created_at?: string;
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

/**
 * Función que extrae el código limpio de cualquier formato o URL de QR
 */
const extraerCodigoDeQR = (textoQr: string): string => {
  let raw = textoQr.trim();

  // Si es una URL (ej: https://dominio/validar-constancia/CI-LB-17780095-2026)
  if (raw.includes('/validar-constancia/')) {
    raw = raw.split('/validar-constancia/').pop()?.split('?')[0] || raw;
  }

  // Si viene con formato interno SIGAE:FI:CODIGO:...
  if (raw.startsWith('SIGAE:')) {
    const partes = raw.split(':');
    if (partes.length >= 3) {
      raw = partes[2];
    }
  }

  return raw.replace(/['"%;]/g, '').trim().toUpperCase();
};

/**
 * Función inteligente que auto-completa los guiones (-) y mayúsculas
 * mientras el usuario escribe en el campo de búsqueda.
 */
const autoCompletarGuiones = (val: string, valAnterior: string): string => {
  // Si el usuario está borrando (Backspace), permitirle borrar normalmente
  if (val.length < valAnterior.length) {
    return val.toUpperCase();
  }

  // Quitar espacios extra y pasar a mayúsculas
  let raw = val.replace(/\s+/g, '').toUpperCase();

  // Si pega una URL, extraer el código final
  if (raw.includes('/VALIDAR-CONSTANCIA/')) {
    raw = raw.split('/VALIDAR-CONSTANCIA/').pop()?.split('?')[0] || raw;
  }

  // Si es un prefijo reconocido (CI, FI, SC, RES)
  const prefijos = ['CI', 'FI', 'SC', 'RES'];
  const prefijoEncontrado = prefijos.find(p => raw.startsWith(p));

  if (prefijoEncontrado) {
    // Si escribió exactamente las 2 letras (ej: "CI" o "SC"), agregar guión automáticamente -> "CI-"
    if (raw.length === prefijoEncontrado.length) {
      return `${prefijoEncontrado}-`;
    }

    // Si escribió las letras y no puso guión (ej: "CILB"), insertar guión -> "CI-LB"
    if (raw.length > prefijoEncontrado.length && raw[prefijoEncontrado.length] !== '-') {
      raw = `${prefijoEncontrado}-${raw.slice(prefijoEncontrado.length)}`;
    }

    const partes = raw.split('-');
    // Después de la escuela (LB o SB), auto-agregar guión
    if (partes.length === 2 && partes[1].length === 2 && ['LB', 'SB'].includes(partes[1])) {
      return `${partes[0]}-${partes[1]}-`;
    }

    // Si ya tiene 3 partes y termina de escribir la cédula o año
    if (partes.length === 3) {
      const parte3 = partes[2];
      // Si en SC escribe 4 dígitos del año (ej: SC-LB-2026) -> "SC-LB-2026-"
      if (prefijoEncontrado === 'SC' && parte3.length === 4 && !raw.endsWith('-')) {
        return `${partes[0]}-${partes[1]}-${parte3}-`;
      }
      // Si en CI o FI escribe cédula completa (7-9 dígitos) y sigue con el año
      if ((prefijoEncontrado === 'CI' || prefijoEncontrado === 'FI') && parte3.length > 8) {
        const ced = parte3.slice(0, -4);
        const ano = parte3.slice(-4);
        return `${partes[0]}-${partes[1]}-${ced}-${ano}`;
      }
    }
  }

  return raw;
};

export const Verificaciones: React.FC = () => {
  const [codigoBusqueda, setCodigoBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  // Resultados de búsqueda
  const [vinculacion, setVinculacion] = useState<VinculacionData | null>(null);
  const [solicitudCupo, setSolicitudCupo] = useState<SolicitudCupoData | null>(null);

  // Vista activa de documento
  const [vistaDoc, setVistaDoc] = useState<'constancia' | 'resumen' | 'cupo'>('constancia');
  const [generandoPdf, setGenerandoPdf] = useState(false);

  // Firma y datos de director
  const [dirInfo, setDirInfo] = useState<any>(null);
  const [firmaBase64, setFirmaBase64] = useState<string>('');

  // ─── ESTADOS DEL ESCÁNER DE CÁMARA QR ─────────────────────────────────────
  const [mostrarEscaner, setMostrarEscaner] = useState(false);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [errorCamara, setErrorCamara] = useState<string | null>(null);

  const docRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const Swal = (window as any).Swal;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevoValor = autoCompletarGuiones(e.target.value, codigoBusqueda);
    setCodigoBusqueda(nuevoValor);
  };

  const setAtajoPrefijo = (prefijo: string) => {
    setCodigoBusqueda(prefijo);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const calcularEstatusActualizacion = (datos: VinculacionData): { estado: string; color: string; badge: string; desc: string } => {
    const d = datos.datos_actualizados || {};
    const tieneCamposClave = d.estudiante_nombres && d.estudiante_apellidos && (d.representante_cedula || datos.cedula_representante);
    const fecha = datos.fecha_ultima_actualizacion ? new Date(datos.fecha_ultima_actualizacion) : null;
    
    if (!fecha || !tieneCamposClave) {
      return {
        estado: 'Sin Actualizar / Incompleto',
        color: 'secondary',
        badge: 'bg-secondary',
        desc: 'El estudiante no ha completado la Ficha Integral de actualización.'
      };
    }

    const diasTranscurridos = (Date.now() - fecha.getTime()) / (1000 * 60 * 60 * 24);
    if (diasTranscurridos > 180) {
      return {
        estado: 'Desactualizado',
        color: 'danger',
        badge: 'bg-danger',
        desc: `Requiere actualización obligatoria (última actualización hace ${Math.floor(diasTranscurridos)} días).`
      };
    }

    const tieneFotos = d.foto_carnet_url || d.foto_cedula_estudiante_url;
    if (!tieneFotos) {
      return {
        estado: 'En Proceso',
        color: 'warning',
        badge: 'bg-warning text-dark',
        desc: 'Ficha guardada parcialmente (faltan recaudos fotográficos).'
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
        desc: 'No registra solicitud de cupo nueva (es estudiante regular del plantel).'
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
        desc: 'En evaluación de recaudos por el comité de admisiones.'
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
    if (est.includes('borrador')) {
      return {
        estado: 'Borrador / Incompleta',
        color: 'secondary',
        badge: 'bg-secondary text-white',
        desc: 'Solicitud guardada en borrador, no ha sido formalmente enviada.'
      };
    }
    return {
      estado: 'Solicitud Pendiente',
      color: 'warning',
      badge: 'bg-warning text-dark',
      desc: 'Solicitud registrada y en lista de espera de asignación.'
    };
  };

  const ejecutarBusqueda = useCallback(async (terminoParam?: string) => {
    let raw = (terminoParam !== undefined ? terminoParam : codigoBusqueda).trim();
    raw = extraerCodigoDeQR(raw);

    if (!raw) {
      if (Swal) Swal.fire('Ingresa un código', 'Por favor escribe el código de la constancia, resumen, cupo o cédula.', 'info');
      return;
    }

    setCargando(true);
    setBusquedaRealizada(true);
    setVinculacion(null);
    setSolicitudCupo(null);

    // Extraer dígitos de cédula
    const partesGuion = raw.split('-');
    let posibleCedula = '';
    for (const p of partesGuion) {
      const nums = p.replace(/\D/g, '');
      if (nums.length >= 5 && nums.length <= 9) {
        posibleCedula = nums;
        break;
      }
    }
    const soloNumeros = raw.replace(/\D/g, '');
    const cleanTerm = raw.replace(/['"%;]/g, '').trim();

    try {
      // ─── 1. CONSULTAR ESTUDIANTES_VINCULACIONES ──────────────────────────────
      let vincEncontrada: VinculacionData | null = null;

      // a) Búsqueda por codigo_unico exacto o parcial
      const { data: vByCode } = await supabase
        .from('estudiantes_vinculaciones')
        .select('*')
        .ilike('codigo_unico', `%${cleanTerm}%`)
        .limit(1);

      if (vByCode && vByCode.length > 0) {
        vincEncontrada = vByCode[0];
      }

      // b) Búsqueda por cédula del estudiante si se extrajo del código
      const cedulaABuscar = posibleCedula || (soloNumeros.length >= 4 && soloNumeros.length <= 10 ? soloNumeros : '');
      if (!vincEncontrada && cedulaABuscar) {
        const { data: vByCedula } = await supabase
          .from('estudiantes_vinculaciones')
          .select('*')
          .or(`cedula_estudiante.ilike.%${cedulaABuscar}%,cedula_representante.ilike.%${cedulaABuscar}%`)
          .limit(1);

        if (vByCedula && vByCedula.length > 0) {
          vincEncontrada = vByCedula[0];
        }
      }

      // c) Búsqueda por nombres si no es código numérico
      if (!vincEncontrada && cleanTerm.length >= 3 && !soloNumeros) {
        const { data: vByName } = await supabase
          .from('estudiantes_vinculaciones')
          .select('*')
          .or(`nombres_estudiante.ilike.%${cleanTerm}%,apellidos_estudiante.ilike.%${cleanTerm}%`)
          .limit(1);

        if (vByName && vByName.length > 0) {
          vincEncontrada = vByName[0];
        }
      }

      if (vincEncontrada) {
        setVinculacion(vincEncontrada);
      }

      // ─── 2. CONSULTAR SOLICITUD_CUPOS (Y FALLBACK) ───────────────────────────
      let cupoEncontrado: SolicitudCupoData | null = null;

      const consultarCupos = async (tabla: string) => {
        // a) Por código único
        const { data: cByCode } = await supabase
          .from(tabla)
          .select('*')
          .ilike('codigo_unico', `%${cleanTerm}%`)
          .limit(1);

        if (cByCode && cByCode.length > 0) return cByCode[0];

        // b) Por cédula extraída
        if (cedulaABuscar) {
          const { data: cByCedula } = await supabase
            .from(tabla)
            .select('*')
            .or(`estudiante_cedula.ilike.%${cedulaABuscar}%,representante_cedula.ilike.%${cedulaABuscar}%`)
            .limit(1);

          if (cByCedula && cByCedula.length > 0) return cByCedula[0];
        }

        // c) Por nombres
        if (cleanTerm.length >= 3 && !soloNumeros) {
          const { data: cByName } = await supabase
            .from(tabla)
            .select('*')
            .or(`estudiante_nombres.ilike.%${cleanTerm}%,estudiante_apellidos.ilike.%${cleanTerm}%`)
            .limit(1);

          if (cByName && cByName.length > 0) return cByName[0];
        }

        return null;
      };

      try {
        cupoEncontrado = await consultarCupos('solicitud_cupos');
      } catch (e) {}

      if (!cupoEncontrado) {
        try {
          cupoEncontrado = await consultarCupos('solicitudes_cupos');
        } catch (e) {}
      }

      if (cupoEncontrado) {
        setSolicitudCupo(cupoEncontrado);
      }

      // ─── 3. BÚSQUEDA CRUZADA POR CÉDULA PARA ASOCIAR AMBOS REGISTROS ────────
      if (cupoEncontrado && !vincEncontrada && cupoEncontrado.estudiante_cedula) {
        const cLim = cupoEncontrado.estudiante_cedula.replace(/\D/g, '');
        if (cLim.length >= 4) {
          const { data: cruzado } = await supabase
            .from('estudiantes_vinculaciones')
            .select('*')
            .ilike('cedula_estudiante', `%${cLim}%`)
            .limit(1);
          if (cruzado && cruzado.length > 0) {
            vincEncontrada = cruzado[0];
            setVinculacion(vincEncontrada);
          }
        }
      }

      if (vincEncontrada && !cupoEncontrado && vincEncontrada.cedula_estudiante) {
        const cLim = vincEncontrada.cedula_estudiante.replace(/\D/g, '');
        if (cLim.length >= 4) {
          try {
            const { data: cruzadoCupo } = await supabase
              .from('solicitud_cupos')
              .select('*')
              .ilike('estudiante_cedula', `%${cLim}%`)
              .limit(1);
            if (cruzadoCupo && cruzadoCupo.length > 0) {
              cupoEncontrado = cruzadoCupo[0];
              setSolicitudCupo(cupoEncontrado);
            }
          } catch (e) {}
        }
      }

      // ─── 4. CARGAR FIRMA DIGITAL Y DATOS DE DIRECCIÓN ───────────────────────
      const escuelaFinal = vincEncontrada?.codigo_escuela || cupoEncontrado?.codigo_escuela || (cleanTerm.toUpperCase().includes('SB') ? 'sb' : 'lb');
      const dir = await obtenerDatosDirectorAsync(escuelaFinal);
      const firma = await obtenerFirmaDirectorProtegida(escuelaFinal);
      setDirInfo(dir);
      setFirmaBase64(firma);

      // Determinar pestaña según el prefijo o datos
      if (cleanTerm.toUpperCase().startsWith('SC-') || (!vincEncontrada && cupoEncontrado)) {
        setVistaDoc('cupo');
      } else if (cleanTerm.toUpperCase().startsWith('FI-') || cleanTerm.toUpperCase().startsWith('RES-')) {
        setVistaDoc('resumen');
      } else {
        setVistaDoc('constancia');
      }

    } catch (e) {
      console.error('Error en búsqueda de verificación:', e);
      if (Swal) Swal.fire('Error', 'Ocurrió un inconveniente al consultar los registros.', 'error');
    } finally {
      setCargando(false);
    }
  }, [codigoBusqueda, Swal]);

  // ─── REPRODUCIR SONIDO DE ÉXITO AL DETECTAR QR ────────────────────────────
  const reproducirBeepExito = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz (A5)
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      // Audio no disponible
    }
  };

  // ─── CONTROL DEL ESCÁNER DE CÁMARA ────────────────────────────────────────
  const detenerCamara = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCamaraActiva(false);
  }, []);

  const iniciarCamara = useCallback(async (facing: 'environment' | 'user' = facingMode) => {
    setErrorCamara(null);
    detenerCamara();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador o dispositivo no soporta acceso a la cámara.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCamaraActiva(true);
        escanearFrame();
      }
    } catch (err: any) {
      console.error('Error al acceder a la cámara:', err);
      let msg = 'No se pudo acceder a la cámara.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Permiso denegado. Permite el acceso a la cámara en los ajustes de tu navegador.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No se encontró ninguna cámara conectada en tu equipo.';
      }
      setErrorCamara(msg);
      setCamaraActiva(false);
    }
  }, [facingMode, detenerCamara]);

  const escanearFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        reproducirBeepExito();
        const codigoExtraido = extraerCodigoDeQR(code.data);
        
        detenerCamara();
        setMostrarEscaner(false);
        setCodigoBusqueda(codigoExtraido);
        ejecutarBusqueda(codigoExtraido);

        if (Swal) {
          Swal.fire({
            icon: 'success',
            title: '¡Código QR Detectado!',
            text: `Código: ${codigoExtraido}`,
            timer: 1800,
            showConfirmButton: false
          });
        }
        return;
      }
    }

    animationFrameId.current = requestAnimationFrame(escanearFrame);
  };

  const abrirEscaner = () => {
    setMostrarEscaner(true);
    setTimeout(() => {
      iniciarCamara('environment');
    }, 150);
  };

  const cerrarEscaner = () => {
    detenerCamara();
    setMostrarEscaner(false);
  };

  const alternarCamara = () => {
    const nuevoModo = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nuevoModo);
    iniciarCamara(nuevoModo);
  };

  const handleSubirImagenQr = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          reproducirBeepExito();
          const codigoExtraido = extraerCodigoDeQR(code.data);
          cerrarEscaner();
          setCodigoBusqueda(codigoExtraido);
          ejecutarBusqueda(codigoExtraido);
          if (Swal) Swal.fire({ icon: 'success', title: '¡Código Detectado!', text: codigoExtraido, timer: 1800, showConfirmButton: false });
        } else {
          if (Swal) Swal.fire('No se detectó QR', 'No se encontró ningún código QR legible en la imagen seleccionada.', 'warning');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    return () => {
      detenerCamara();
    };
  }, [detenerCamara]);

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

      const nombreEst = vinculacion?.nombres_estudiante || solicitudCupo?.estudiante_nombres || 'Estudiante';
      const tipoTexto = vistaDoc === 'constancia' ? 'Constancia_Inscripcion' : vistaDoc === 'resumen' ? 'Ficha_Integral' : 'Solicitud_Cupo';
      const fileName = `SIGAE_${tipoTexto}_${nombreEst.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      if (Swal) Swal.fire('¡PDF Generado!', 'El documento oficial ha sido descargado en alta calidad.', 'success');
    } catch (e) {
      console.error('Error al generar PDF', e);
      if (Swal) Swal.fire('Error', 'No se pudo generar el documento PDF.', 'error');
    } finally {
      setGenerandoPdf(false);
    }
  };

  const handleCompartirWhatsApp = () => {
    const nombre = vinculacion?.nombres_estudiante || solicitudCupo?.estudiante_nombres || 'Estudiante';
    const codigo = vinculacion?.codigo_unico || solicitudCupo?.codigo_unico || codigoConstancia;
    const esLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = esLocal ? 'https://sigae-hh6u.onrender.com' : window.location.origin;
    const link = `${baseUrl}/validar-constancia/${encodeURIComponent(codigo)}`;
    const texto = `*SIGAE - Verificación Oficial de Documento*\n\n` +
      `Estudiante: *${nombre}*\n` +
      `Código de Autenticidad: *${codigo}*\n\n` +
      `Puede consultar la validez de este documento escaneando su código QR o accediendo al enlace público:\n` +
      `${link}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
  };

  // ─── VARIABLES DE FORMATO Y DATOS ──────────────────────────────────────────
  const d = vinculacion?.datos_actualizados || {};
  const nombreEstudianteCompleto = `${vinculacion?.nombres_estudiante || d.estudiante_nombres || solicitudCupo?.estudiante_nombres || ''} ${vinculacion?.apellidos_estudiante || d.estudiante_apellidos || solicitudCupo?.estudiante_apellidos || ''}`.trim() || 'Estudiante Registrado';
  const cedulaEstudiante = vinculacion?.cedula_estudiante || d.estudiante_cedula || solicitudCupo?.estudiante_cedula || 'No posee';
  const gradoEstudiante = vinculacion?.grado_actual || d.grado_solicitado || solicitudCupo?.grado_solicitado || 'Grado asignado';
  const representanteNombre = `${d.representante_nombres || vinculacion?.nombres_representante || solicitudCupo?.representante_nombres || ''} ${d.representante_apellidos || vinculacion?.apellidos_representante || solicitudCupo?.representante_apellidos || ''}`.trim() || 'Representante Legal';
  const representanteCedula = d.representante_cedula || vinculacion?.cedula_representante || solicitudCupo?.representante_cedula || 'No registrada';

  const anoActual = new Date().getFullYear();
  const anoProximo = anoActual + 1;
  const cedulaLimpia = cedulaEstudiante.replace(/\D/g, '') || '0000';
  const escuelaCodigo = (vinculacion?.codigo_escuela || solicitudCupo?.codigo_escuela || (codigoBusqueda.toUpperCase().includes('SB') ? 'sb' : 'lb')).toLowerCase();

  // Códigos correspondientes
  const codigoConstancia = vinculacion?.codigo_unico || `CI-${escuelaCodigo.toUpperCase()}-${cedulaLimpia}-${anoActual}`;
  const codigoResumen = d.codigo_unico || `FI-${escuelaCodigo.toUpperCase()}-${cedulaLimpia}-${anoActual}`;
  const codigoSolicitud = solicitudCupo?.codigo_unico || `SC-${escuelaCodigo.toUpperCase()}-${anoActual}-${cedulaLimpia.slice(-4) || '0001'}`;

  // URL del QR oficial con el código embebido
  const esLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const baseUrlVerificacion = esLocal ? 'https://sigae-hh6u.onrender.com' : window.location.origin;
  const urlQrConstancia = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`${baseUrlVerificacion}/validar-constancia/${encodeURIComponent(codigoConstancia)}`)}&bgcolor=ffffff&color=166534&margin=2`;
  const urlQrResumen = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`SIGAE:FI:${codigoResumen}:${nombreEstudianteCompleto}`)}&bgcolor=ffffff&color=166534&margin=2`;

  const logoEscuela = `/assets/img/logo_${escuelaCodigo}.png`;
  const logoMppe = '/assets/img/logoMPPE.png';

  const rawGen = (
    d.estudiante_sexo ||
    d.estudiante_genero ||
    vinculacion?.datos_actualizados?.estudiante_sexo ||
    vinculacion?.datos_actualizados?.estudiante_genero ||
    (vinculacion as any)?.sexo ||
    (solicitudCupo as any)?.datos_actualizados?.estudiante_sexo ||
    (solicitudCupo as any)?.estudiante_sexo ||
    ''
  ).toString().toLowerCase().trim();

  const esFemenino = rawGen.startsWith('f') || rawGen === 'femenino' || rawGen === 'femenina' || rawGen === 'hembra' || rawGen === 'mujer';
  const esMasculino = rawGen.startsWith('m') || rawGen === 'masculino' || rawGen === 'varon' || rawGen === 'varón' || rawGen === 'hombre';

  const gradoLimpio = (gradoEstudiante)
    .replace(/\s+de\s+(Educación\s+Primaria|Educación\s+Inicial|Educación\s+Media\s+General|Media\s+General|Primaria|Inicial)/gi, '')
    .replace(/\s+correspondiente\s+al\s+Nivel\s+de.*/gi, '')
    .trim();

  let nivelEducativo = 'Educación Primaria';
  const gLower = gradoEstudiante.toLowerCase();
  if (gLower.includes('maternal') || gLower.includes('preescolar') || gLower.includes('inicial') || gLower.includes('grupo')) {
    nivelEducativo = 'Educación Inicial';
  } else if (gLower.includes('año') || gLower.includes('media') || gLower.includes('bachillerato')) {
    nivelEducativo = 'Educación Media General';
  }

  const estatusActualizacion = vinculacion ? calcularEstatusActualizacion(vinculacion) : null;
  const estatusCupo = calcularEstatusCupo(solicitudCupo);

  const cargarModeloEjemplo = async (esc: 'sb' | 'lb' = 'sb') => {
    setCargando(true);
    try {
      const dir = await obtenerDatosDirectorAsync(esc);
      const ano = new Date().getFullYear();
      const codDemo = `CI-${esc.toUpperCase()}-31456789-${ano}`;
      const firma = await obtenerFirmaDirectorProtegida(esc, codDemo);
      
      setDirInfo(dir);
      setFirmaBase64(firma);

      setVinculacion({
        id: 'demo-sample-01',
        cedula_estudiante: '31.456.789',
        nombres_estudiante: 'Alejandro José',
        apellidos_estudiante: 'Pérez Silva',
        grado_actual: esc === 'sb' ? '4to Grado de Educación Primaria' : '1er Año de Educación Media General',
        seccion_actual: 'A',
        codigo_escuela: esc,
        nombre_escuela: esc === 'sb' ? 'Unidad Educativa Santa Bárbara' : 'Unidad Educativa Libertador Bolívar',
        cedula_representante: '15.987.654',
        nombres_representante: 'Carlos Eduardo',
        apellidos_representante: 'Pérez Mendoza',
        fecha_ultima_actualizacion: new Date().toISOString(),
        codigo_unico: codDemo,
        datos_actualizados: {
          estudiante_nombres: 'Alejandro José',
          estudiante_apellidos: 'Pérez Silva',
          estudiante_cedula: '31.456.789',
          grado_solicitado: esc === 'sb' ? '4to Grado de Educación Primaria' : '1er Año de Educación Media General',
          representante_nombres: 'Carlos Eduardo',
          representante_apellidos: 'Pérez Mendoza',
          representante_cedula: '15.987.654',
          codigo_unico: codDemo
        }
      });
      setSolicitudCupo(null);
      setVistaDoc('constancia');
      setBusquedaRealizada(true);
      setCodigoBusqueda(codDemo);
    } catch (e) {
      console.error("Error al cargar modelo demo:", e);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modulo-animado p-3 p-md-4 font-sans">
      
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
                Consulta y validación segura de Constancias de Inscripción, Fichas Integrales y Solicitudes de Cupos.
              </p>
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap gap-2 align-items-center">
          <div className="btn-group shadow-sm" role="group">
            <button 
              type="button"
              onClick={() => cargarModeloEjemplo('sb')} 
              className="btn btn-outline-success fw-bold d-flex align-items-center gap-1.5"
              title="Ver Modelo de Constancia Oficial de la UE Santa Bárbara"
            >
              <i className="bi bi-eye-fill"></i>
              <span>Modelo SB</span>
            </button>
            <button 
              type="button"
              onClick={() => cargarModeloEjemplo('lb')} 
              className="btn btn-outline-primary fw-bold d-flex align-items-center gap-1.5"
              title="Ver Modelo de Constancia Oficial de la UE Libertador Bolívar"
            >
              <i className="bi bi-eye-fill"></i>
              <span>Modelo LB</span>
            </button>
          </div>

          <button 
            type="button"
            onClick={abrirEscaner} 
            className="btn btn-success fw-bold rounded-pill px-3 shadow-sm d-flex align-items-center gap-2"
            style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', border: 'none' }}
          >
            <i className="bi bi-camera-fill fs-5"></i>
            <span>Escanear QR</span>
          </button>

          <button 
            onClick={() => {
              setCodigoBusqueda('');
              setBusquedaRealizada(false);
              setVinculacion(null);
              setSolicitudCupo(null);
              if (inputRef.current) inputRef.current.focus();
            }} 
            className="btn btn-outline-secondary rounded-pill px-3 fw-bold shadow-sm"
          >
            <i className="bi bi-arrow-counterclockwise me-1"></i> Nueva Consulta
          </button>
        </div>
      </div>

      {/* ─── BUSCADOR UNIVERSAL CON AUTOCOMPLETADO INTELIGENTE Y BOTÓN CÁMARA ─ */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white border-top border-4 border-success">
        <form onSubmit={(e) => { e.preventDefault(); ejecutarBusqueda(); }}>
          <div className="d-flex justify-content-between align-items-center mb-1">
            <label className="form-label fw-bold text-dark small mb-0">
              <i className="bi bi-search me-1 text-success"></i> Ingresa el Código Oficial, Cédula de Identidad o Escanea con tu Cámara:
            </label>
            <button
              type="button"
              onClick={abrirEscaner}
              className="btn btn-link btn-sm text-success fw-bold text-decoration-none p-0"
            >
              <i className="bi bi-qr-code-scan me-1"></i> Abrir Lector QR
            </button>
          </div>

          <div className="input-group input-group-lg shadow-sm rounded-3 overflow-hidden mb-2">
            <button
              type="button"
              onClick={abrirEscaner}
              className="btn btn-success px-3 d-flex align-items-center gap-1"
              title="Escanear Código QR con Cámara"
              style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', border: 'none' }}
            >
              <i className="bi bi-qr-code-scan fs-4"></i>
              <span className="d-none d-md-inline small fw-bold">Escanear</span>
            </button>
            <input
              ref={inputRef}
              type="text"
              className="form-control border-0 bg-light fs-5 fw-bold font-monospace text-uppercase"
              placeholder="Ej: CI-LB-17780095-2026, FI-SB-16808608-2026, SC-LB-2026-0001, o 17780095"
              value={codigoBusqueda}
              onChange={handleInputChange}
              autoFocus
            />
            {codigoBusqueda && (
              <button
                type="button"
                className="btn btn-light border-0 text-muted px-3"
                onClick={() => {
                  setCodigoBusqueda('');
                  if (inputRef.current) inputRef.current.focus();
                }}
              >
                <i className="bi bi-x-circle-fill fs-5"></i>
              </button>
            )}
            <button
              type="submit"
              className="btn btn-dark px-4 fw-bold shadow-sm d-flex align-items-center gap-2"
              disabled={cargando}
            >
              {cargando ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  Consultando...
                </>
              ) : (
                <>
                  <i className="bi bi-shield-check fs-5 text-success"></i>
                  Verificar
                </>
              )}
            </button>
          </div>

          {/* ATAJOS RÁPIDOS DE PREFIJOS CON AUTO-INSERCIÓN */}
          <div className="d-flex flex-wrap align-items-center gap-1 mt-2">
            <span className="text-muted small me-1" style={{ fontSize: '0.78rem' }}>
              <i className="bi bi-lightning-charge-fill text-warning me-1"></i>Atajos de formato:
            </span>
            <button
              type="button"
              onClick={() => setAtajoPrefijo('CI-LB-')}
              className="btn btn-sm btn-light border rounded-pill px-2.5 py-0.5 text-success fw-bold font-monospace shadow-none"
              style={{ fontSize: '0.78rem' }}
            >
              CI-LB-
            </button>
            <button
              type="button"
              onClick={() => setAtajoPrefijo('CI-SB-')}
              className="btn btn-sm btn-light border rounded-pill px-2.5 py-0.5 text-success fw-bold font-monospace shadow-none"
              style={{ fontSize: '0.78rem' }}
            >
              CI-SB-
            </button>
            <button
              type="button"
              onClick={() => setAtajoPrefijo('FI-LB-')}
              className="btn btn-sm btn-light border rounded-pill px-2.5 py-0.5 text-dark fw-bold font-monospace shadow-none"
              style={{ fontSize: '0.78rem' }}
            >
              FI-LB-
            </button>
            <button
              type="button"
              onClick={() => setAtajoPrefijo('FI-SB-')}
              className="btn btn-sm btn-light border rounded-pill px-2.5 py-0.5 text-dark fw-bold font-monospace shadow-none"
              style={{ fontSize: '0.78rem' }}
            >
              FI-SB-
            </button>
            <button
              type="button"
              onClick={() => setAtajoPrefijo('SC-LB-2026-')}
              className="btn btn-sm btn-light border rounded-pill px-2.5 py-0.5 text-primary fw-bold font-monospace shadow-none"
              style={{ fontSize: '0.78rem' }}
            >
              SC-LB-2026-
            </button>
            <button
              type="button"
              onClick={() => setAtajoPrefijo('SC-SB-2026-')}
              className="btn btn-sm btn-light border rounded-pill px-2.5 py-0.5 text-primary fw-bold font-monospace shadow-none"
              style={{ fontSize: '0.78rem' }}
            >
              SC-SB-2026-
            </button>
          </div>
        </form>
      </div>

      {/* ─── MODAL / VISOR DE ESCÁNER DE CÁMARA QR ─────────────────────────── */}
      {mostrarEscaner && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1060, backdropFilter: 'blur(4px)' }}
        >
          <div className="card border-0 rounded-4 shadow-lg overflow-hidden bg-dark text-white" style={{ width: '500px', maxWidth: '94%' }}>
            {/* Header del Escáner */}
            <div className="d-flex justify-content-between align-items-center p-3 bg-black border-bottom border-secondary">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-camera-fill text-success fs-5"></i>
                <h6 className="fw-bold mb-0 text-white">Escáner de Código QR</h6>
              </div>
              <button 
                type="button" 
                onClick={cerrarEscaner} 
                className="btn btn-sm btn-outline-light rounded-circle"
                style={{ width: '32px', height: '32px', padding: 0 }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* Visor de Cámara con Marco Holográfico */}
            <div className="position-relative bg-black d-flex align-items-center justify-content-center" style={{ minHeight: '340px', overflow: 'hidden' }}>
              <video 
                ref={videoRef} 
                className="w-100 h-100" 
                style={{ objectFit: 'cover', minHeight: '340px', maxHeight: '420px' }} 
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Guía Visual / Marco de Escaneo con Láser */}
              {camaraActiva && (
                <div 
                  className="position-absolute" 
                  style={{
                    width: '240px',
                    height: '240px',
                    border: '3px solid #22c55e',
                    borderRadius: '16px',
                    boxShadow: '0 0 20px rgba(34,197,94,0.6), inset 0 0 15px rgba(34,197,94,0.3)',
                    pointerEvents: 'none'
                  }}
                >
                  {/* Línea Láser Animada */}
                  <div 
                    style={{
                      width: '100%',
                      height: '3px',
                      backgroundColor: '#22c55e',
                      boxShadow: '0 0 10px #22c55e',
                      position: 'absolute',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      animation: 'pulse 1.5s infinite'
                    }}
                  ></div>
                </div>
              )}

              {/* Mensaje de Error si la cámara no abre */}
              {errorCamara && (
                <div className="position-absolute p-4 text-center">
                  <i className="bi bi-exclamation-triangle-fill text-warning fs-1 mb-2"></i>
                  <p className="text-white small mb-3">{errorCamara}</p>
                  <button 
                    type="button" 
                    onClick={() => iniciarCamara()} 
                    className="btn btn-sm btn-success rounded-pill px-3 fw-bold"
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i> Reintentar
                  </button>
                </div>
              )}
            </div>

            {/* Controles del Escáner */}
            <div className="p-3 bg-dark border-top border-secondary d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div className="d-flex gap-2">
                <button
                  type="button"
                  onClick={alternarCamara}
                  className="btn btn-sm btn-outline-light rounded-pill px-3"
                  title="Cambiar Cámara (Frontal / Trasera)"
                >
                  <i className="bi bi-arrow-repeat me-1"></i> Cambiar Cámara
                </button>

                <label className="btn btn-sm btn-outline-success rounded-pill px-3 mb-0 cursor-pointer">
                  <i className="bi bi-image me-1"></i> Subir Imagen QR
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSubirImagenQr}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={cerrarEscaner}
                className="btn btn-sm btn-secondary rounded-pill px-3"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── RESULTADOS DE LA CONSULTA ───────────────────────────────────── */}
      {cargando && (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white my-4">
          <div className="spinner-border text-success mx-auto mb-3" style={{ width: '3rem', height: '3rem' }}></div>
          <h5 className="fw-bold text-dark mb-1">Consultando registros oficiales en la base de datos...</h5>
          <p className="text-muted small">Validando Ficha Integral, firmas autorizadas y asignaciones de cupos.</p>
        </div>
      )}

      {!cargando && busquedaRealizada && !vinculacion && !solicitudCupo && (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white border-start border-4 border-danger animate__animated animate__fadeIn">
          <div className="bg-danger bg-opacity-10 text-danger rounded-circle p-3 mx-auto mb-3 d-inline-flex">
            <i className="bi bi-file-earmark-x-fill fs-1"></i>
          </div>
          <h4 className="fw-bold text-danger mb-1">Documento No Encontrado</h4>
          <p className="text-muted mb-2">
            No se localizó ninguna Constancia de Inscripción, Ficha ni Solicitud de Cupo para: <code>"{codigoBusqueda}"</code>.
          </p>
          <p className="text-muted small mb-4">
            Puedes probar escribiendo directamente el número de cédula o escaneando el código QR con la cámara.
          </p>
          <div className="d-flex justify-content-center gap-2">
            <button 
              onClick={abrirEscaner} 
              className="btn btn-success rounded-pill px-4 fw-bold shadow-sm"
              style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', border: 'none' }}
            >
              <i className="bi bi-camera-fill me-1"></i> Escanear Código QR
            </button>
            <button 
              onClick={() => {
                setCodigoBusqueda('');
                if (inputRef.current) inputRef.current.focus();
              }} 
              className="btn btn-outline-secondary rounded-pill px-4"
            >
              Intentar con otra cédula
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
                
                <div className="bg-light rounded-3 p-3 small font-monospace">
                  <div className="d-flex justify-content-between border-bottom pb-1 mb-1">
                    <span className="text-muted">Cód. Solicitud:</span>
                    <b className="text-primary">{solicitudCupo ? solicitudCupo.codigo_unico : 'Sin Solicitud'}</b>
                  </div>
                  {solicitudCupo && (
                    <>
                      <div className="d-flex justify-content-between border-bottom pb-1 mb-1">
                        <span className="text-muted">Prioridad / Sector:</span>
                        <b className="text-dark">{solicitudCupo.prioridad || solicitudCupo.representante_tipo || 'Comunidad'}</b>
                      </div>
                      {solicitudCupo.requiere_transporte && (
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Transporte Escolar:</span>
                          <b className="text-success">🚍 {solicitudCupo.ruta_transporte || 'Solicitado'}</b>
                        </div>
                      )}
                    </>
                  )}
                </div>
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

                <div className="bg-light rounded-3 p-3 small font-monospace">
                  <div className="d-flex justify-content-between border-bottom pb-1 mb-1">
                    <span className="text-muted">Cód. Constancia:</span>
                    <b className="text-success">{codigoConstancia}</b>
                  </div>
                  <div className="d-flex justify-content-between border-bottom pb-1 mb-1">
                    <span className="text-muted">Cód. Resumen Ficha:</span>
                    <b className="text-dark">{codigoResumen}</b>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Última Actualización:</span>
                    <b className="text-dark">
                      {vinculacion?.fecha_ultima_actualizacion ? new Date(vinculacion.fecha_ultima_actualizacion).toLocaleDateString('es-VE') : 'No registrada'}
                    </b>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ─── SELECTOR DE PESTAÑAS Y ACCIONES ───────────────────────────── */}
          <div className="d-flex flex-wrap justify-content-between align-items-center bg-white p-3 rounded-4 shadow-sm mb-4 gap-3">
            <div className="btn-group p-1 bg-light rounded-pill flex-wrap">
              <button
                type="button"
                onClick={() => setVistaDoc('constancia')}
                className={`btn rounded-pill fw-bold px-3 py-2 ${vistaDoc === 'constancia' ? 'btn-success text-white shadow-sm' : 'btn-light text-muted'}`}
              >
                <i className="bi bi-award-fill me-1"></i> Constancia de Inscripción
              </button>
              
              <button
                type="button"
                onClick={() => setVistaDoc('resumen')}
                className={`btn rounded-pill fw-bold px-3 py-2 ${vistaDoc === 'resumen' ? 'btn-success text-white shadow-sm' : 'btn-light text-muted'}`}
              >
                <i className="bi bi-file-earmark-text-fill me-1"></i> Resumen de Actualización
              </button>

              {solicitudCupo && (
                <button
                  type="button"
                  onClick={() => setVistaDoc('cupo')}
                  className={`btn rounded-pill fw-bold px-3 py-2 ${vistaDoc === 'cupo' ? 'btn-primary text-white shadow-sm' : 'btn-light text-muted'}`}
                >
                  <i className="bi bi-envelope-check-fill me-1"></i> Solicitud de Cupo
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
                Descargar PDF
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
            
            {/* 1. CONSTANCIA DE INSCRIPCIÓN OFICIAL */}
            {vistaDoc === 'constancia' && (
              <div 
                ref={docRef}
                className="bg-white shadow-lg rounded-4 mb-5 animate__animated animate__fadeIn mx-auto"
                style={{ width: '800px', maxWidth: '100%', border: '2px solid #94a3b8', color: '#000000', boxSizing: 'border-box', minHeight: '1035px', padding: '42px 48px 35px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontFamily: 'Arial, Helvetica, sans-serif' }}
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
                  <h2 style={{ margin: 0, fontSize: 21, fontWeight: 'bold', color: '#000000', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Constancia de Inscripción
                  </h2>
                </div>

                {/* PÁRRAFO DE CERTIFICACIÓN OFICIAL DE INSCRIPCIÓN */}
                <div style={{ fontSize: '13.5px', lineHeight: '1.95', color: '#000000', textAlign: 'justify', marginBottom: '25px' }}>
                  Quien suscribe, profesor <b>{(dirInfo?.tituloDirector || dirInfo?.nombreCompleto || 'José Vicente Millán Montaño').replace(/^(Prof\.|Profesor|Lic\.|Lcdo\.)\s*/i, '')}</b>, titular de la cédula de identidad número <b>{dirInfo?.cedula || '17780095'}</b>, en calidad de <b>{dirInfo?.cargoGenerico || 'Director de la Unidad Educativa'}</b>, certifico que los datos reflejados en esta constancia corresponden a {esFemenino ? 'una estudiante que ha actualizado su información de forma exitosa. Esta estudiante' : esMasculino ? 'un estudiante que ha actualizado su información de forma exitosa. Este estudiante' : 'un(a) estudiante que ha actualizado su información de forma exitosa. Dicho(a) estudiante'} está {esFemenino ? 'autorizada' : esMasculino ? 'autorizado' : 'autorizado(a)'} para cursar el <b>Año Escolar {anoActual} – {anoProximo}</b> en nuestra institución. A continuación se detallan los datos relevantes:
                </div>

                {/* DATOS RELEVANTES DETALLADOS */}
                <div style={{ fontSize: '13.5px', lineHeight: '2.2', color: '#000000', marginLeft: '12px', marginBottom: '30px' }}>
                  <div><b>Estudiante:</b> {nombreEstudianteCompleto}</div>
                  <div><b>Cédula de Identidad o Escolar:</b> {cedulaEstudiante}</div>
                  <div><b>Nivel Educativo:</b> {nivelEducativo}</div>
                  <div><b>Grupo, grado o año a cursar:</b> {gradoLimpio}</div>
                  <div><b>Representante Legal:</b> {representanteNombre}</div>
                  <div><b>Cédula de Identidad:</b> {representanteCedula}</div>
                  <div><b>Año Escolar:</b> {anoActual} – {anoProximo}</div>
                  <div><b>Fecha de Emisión:</b> {new Date().toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>

                {/* ATENTAMENTE Y FIRMA DEL DIRECTOR CON QR DE SEGURIDAD QUE TIENE EL CÓDIGO */}
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

                  <div style={{ textAlign: 'center', border: '1.5px solid #cbd5e1', padding: '6px', borderRadius: '10px', background: '#ffffff', minWidth: '95px' }}>
                    <img src={urlQrConstancia} alt="QR Verificación" style={{ height: '72px', width: '72px', display: 'block', margin: '0 auto' }} />
                    <span style={{ fontSize: '7.5px', fontWeight: 'bold', color: '#166534', fontFamily: 'monospace', display: 'block', marginTop: '4px' }}>VERIFICACIÓN QR</span>
                    <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#0f172a', fontFamily: 'monospace', display: 'block' }}>{codigoConstancia}</span>
                  </div>
                </div>

                {/* PIE DE PÁGINA CON LOGO DEL MINISTERIO ALINEADO A LA IZQUIERDA */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '10px', marginTop: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={logoMppe} alt="MPPE" style={{ height: '40px', width: 'auto' }} />
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '8.5px', color: '#64748b' }}>
                    SIGAE - Control Estudiantil | Constancia Oficial de Inscripción Verificable mediante Código QR<br/>
                    Cód. Autenticidad: <b style={{ color: '#166534', fontFamily: 'monospace' }}>{codigoConstancia}</b>
                  </div>
                </div>

              </div>
            )}

            {/* 2. RESUMEN DE ACTUALIZACIÓN (FICHA INTEGRAL) */}
            {vistaDoc === 'resumen' && (
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '2px solid #cbd5e1', paddingBottom: '16px', marginBottom: '20px', position: 'relative' }}>
                  <img src={logoEscuela} alt="Escuela" style={{ height: '65px', width: 'auto', position: 'absolute', left: 0 }} />
                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 'bold', lineHeight: '1.4', textTransform: 'uppercase', color: '#000000' }}>
                      República Bolivariana de Venezuela<br/>
                      Ministerio del Poder Popular para la Educación<br/>
                      {dirInfo?.nombreEscuela || (escuelaCodigo === 'sb' ? 'Unidad Educativa Santa Bárbara' : 'Unidad Educativa Libertador Bolívar')}
                    </div>
                  </div>
                </div>

                {/* TÍTULO DEL RESUMEN */}
                <div style={{ textAlign: 'center', margin: '15px 0 20px' }}>
                  <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 'bold', color: '#166534', textTransform: 'uppercase' }}>
                    Resumen de Actualización de Datos (Ficha Integral)
                  </h2>
                  <span className="badge bg-success px-3 py-1 rounded-pill mt-1 fw-bold">
                    Año Escolar {anoActual} – {anoProximo}
                  </span>
                </div>

                {/* BLOQUES DE DATOS DE LA FICHA INTEGRAL */}
                <div className="d-flex flex-column gap-3 mb-4">
                  
                  {/* BLOQUE 1: REPRESENTANTE LEGAL */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px' }}>
                    <h6 className="fw-bold text-dark border-bottom pb-1 mb-2 small text-uppercase">
                      <i className="bi bi-person-badge me-1 text-success"></i> 1. Representante Legal
                    </h6>
                    <div className="row g-2 small font-monospace">
                      <div className="col-md-6"><b>Nombre:</b> {representanteNombre}</div>
                      <div className="col-md-6"><b>Cédula:</b> {representanteCedula}</div>
                      <div className="col-md-6"><b>Teléfono:</b> {d.representante_telefono || 'No registrado'}</div>
                      <div className="col-md-6"><b>Correo:</b> {d.representante_email || 'No registrado'}</div>
                      <div className="col-md-6"><b>Vínculo / Parentesco:</b> {d.representante_parentesco || 'Representante Legal'}</div>
                      <div className="col-md-6"><b>¿Trabaja en PDVSA?:</b> {d.representante_trabaja_pdvsa || 'No'}</div>
                    </div>
                  </div>

                  {/* BLOQUE 2: DATOS DEL ESTUDIANTE */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px' }}>
                    <h6 className="fw-bold text-dark border-bottom pb-1 mb-2 small text-uppercase">
                      <i className="bi bi-mortarboard me-1 text-success"></i> 2. Identificación del Estudiante
                    </h6>
                    <div className="row g-2 small font-monospace">
                      <div className="col-md-6"><b>Estudiante:</b> {nombreEstudianteCompleto}</div>
                      <div className="col-md-6"><b>Cédula:</b> {cedulaEstudiante}</div>
                      <div className="col-md-6"><b>Fecha Nacimiento:</b> {d.estudiante_fecha_nacimiento || 'No registrada'}</div>
                      <div className="col-md-6"><b>Género:</b> {d.estudiante_genero || 'No informado'}</div>
                      <div className="col-md-6"><b>Grado Actual:</b> <b className="text-primary">{gradoEstudiante}</b></div>
                      <div className="col-md-6"><b>Sección:</b> {vinculacion?.seccion_actual || d.seccion_actual || 'A'}</div>
                    </div>
                  </div>

                  {/* BLOQUE 3: SALUD Y ANTROPOMETRÍA */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px' }}>
                    <h6 className="fw-bold text-dark border-bottom pb-1 mb-2 small text-uppercase">
                      <i className="bi bi-heart-pulse me-1 text-danger"></i> 3. Salud y Antropometría
                    </h6>
                    <div className="row g-2 small font-monospace">
                      <div className="col-md-4"><b>Tipo de Sangre:</b> {d.salud_tipo_sangre || 'No informado'}</div>
                      <div className="col-md-4"><b>Estatura (cm):</b> {d.salud_estatura || '—'}</div>
                      <div className="col-md-4"><b>Peso (kg):</b> {d.salud_peso || '—'}</div>
                      <div className="col-md-6"><b>Talla Camisa / Pantalón:</b> {d.salud_talla_camisa || '—'} / {d.salud_talla_pantalon || '—'}</div>
                      <div className="col-md-6"><b>Calzado:</b> {d.salud_talla_calzado || '—'}</div>
                      <div className="col-12"><b>Alergias / Padecimientos:</b> {d.salud_alergias || 'Ninguna manifestada'}</div>
                    </div>
                  </div>

                  {/* BLOQUE 4: UBICACIÓN Y SERVICIOS */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px' }}>
                    <h6 className="fw-bold text-dark border-bottom pb-1 mb-2 small text-uppercase">
                      <i className="bi bi-geo-alt me-1 text-primary"></i> 4. Ubicación Domiciliaria
                    </h6>
                    <div className="row g-2 small font-monospace">
                      <div className="col-12"><b>Dirección de Habitación:</b> {d.direccion_vivienda || d.direccion_habitacion || 'Santa Bárbara / Miraflores, Monagas'}</div>
                      <div className="col-md-6"><b>Punto de Referencia:</b> {d.direccion_punto_referencia || 'No indicado'}</div>
                      <div className="col-md-6"><b>Sector:</b> {d.direccion_sector || 'Comunidad'}</div>
                    </div>
                  </div>

                </div>

                {/* PIE DE PÁGINA CON CÓDIGO QR Y LOGO MPPE */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px solid #cbd5e1', paddingTop: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={logoMppe} alt="MPPE" style={{ height: '38px', width: 'auto' }} />
                  </div>
                  <div style={{ textAlign: 'center', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '8px', background: '#ffffff' }}>
                    <img src={urlQrResumen} alt="QR Resumen" style={{ height: '55px', width: '55px', display: 'block', margin: '0 auto' }} />
                    <span style={{ fontSize: '7px', fontWeight: 'bold', color: '#166534', fontFamily: 'monospace' }}>RESUMEN VALIDADO</span>
                    <span style={{ fontSize: '6.5px', color: '#334155', fontFamily: 'monospace', display: 'block' }}>{codigoResumen}</span>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '8.5px', color: '#64748b' }}>
                    SIGAE - Ficha Integral de Actualización<br/>
                    Cód. Resumen: <b style={{ color: '#166534', fontFamily: 'monospace' }}>{codigoResumen}</b>
                  </div>
                </div>

              </div>
            )}

            {/* 3. COMPROBANTE DE SOLICITUD DE CUPO */}
            {vistaDoc === 'cupo' && (
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
                      <b className="fs-5 text-primary">{codigoSolicitud}</b>
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
                  <div><b>Grado / Año Solicitado:</b> <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{solicitudCupo?.grado_solicitado || gradoEstudiante}</span></div>
                  <div><b>Representante Legal:</b> {representanteNombre}</div>
                  <div><b>Cédula del Representante:</b> {representanteCedula}</div>
                  <div><b>Teléfono de Contacto:</b> {solicitudCupo?.representante_telefono || d.representante_telefono || 'No registrado'}</div>
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
                    Cód. Verificación: <b style={{ color: '#2563eb', fontFamily: 'monospace' }}>{codigoSolicitud}</b>
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
