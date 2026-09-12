import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { supabase } from '../../lib/supabase';
import { usePermisos } from '../../hooks/usePermisos';
import { ChamiloBreadcrumb, ChamiloHelpCallout } from '../../components/chamilo';

declare const Swal: any;

export interface AspiranteWhatsApp {
  id: string | number;
  codigo_unico: string;
  codigo_escuela: 'sb' | 'lb';
  estado: string;
  representante_nombres: string;
  representante_apellidos: string;
  representante_cedula: string;
  representante_telefono?: string;
  representante_email?: string;
  estudiante_nombres: string;
  estudiante_apellidos: string;
  estudiante_cedula?: string;
  grado_solicitado: string;
  observaciones?: string;
  // Marca 1: Mensaje de Aceptación
  aceptacion_notificada?: boolean;
  aceptacion_fecha?: string;
  // Marca 2: Mensaje de Orientaciones Paso a Paso
  whatsapp_notificado?: boolean;
  whatsapp_fecha?: string;
}

// ── BANCO DE SALUDOS Y CIERRES ANTI-SPAM (SPINTAX ROTATIVO) ──────────────────
const BANCO_SALUDOS = [
  'Estimado(a) Representante',
  'Apreciado(a) Padre/Madre/Representante',
  'Reciba un cordial y atento saludo, Estimado(a) Representante',
  'Saludos cordiales en nombre de nuestra institución, Estimado(a) Representante',
  'Estimada Familia y Representante'
];

const BANCO_CIERRES = [
  '*¡Bienvenidos a la {ESCUELA}!* Formando con excelencia pedagógica, disciplina y valores a la juventud del futuro.',
  '*¡La {ESCUELA} les da la más cordial bienvenida a nuestra gran familia educativa!*',
  '*¡Nos llena de orgullo recibirles en la {ESCUELA}!* Juntos construiremos un año escolar de grandes logros.',
  '*¡Bienvenidos a la {ESCUELA}!* Agradecemos su confianza para la educación integral de su representado.'
];

const MENSAJE_PASO_A_PASO_BASE = `{SALUDO}: *{REPRESENTANTE}* (C.I. *{CEDULA_REP}*)

En seguimiento a la confirmación de asignación y aceptación de cupo para su representado(a) *{ESTUDIANTE}* en el nivel *{GRADO}*, le hacemos llegar las *orientaciones oficiales y la guía paso a paso* que debe seguir para completar la actualización de datos y formalización de su inscripción:

*1️⃣ Paso 1: Ingreso al sistema y creación de contraseña*
• Ingrese a nuestra plataforma web oficial:
🌐 *https://sigaelbsb.vercel.app/*
• En el campo *Usuario*, ingrese su número de cédula de identidad: *{CEDULA_REP}* (sin puntos ni letras).
• *Primer ingreso:* Si es su primera vez en el sistema, cree su contraseña segura y configure sus preguntas de seguridad personalizadas. Si ya posee cuenta en SIGAE, ingrese con su clave habitual.

*2️⃣ Paso 2: Gestión estudiantil y actualización de ficha*
• Ingrese al módulo de *Gestión Estudiantil* (o Mis Representados).
• Seleccione al estudiante asignado y proceda a actualizar y completar detalladamente la *Ficha del Estudiante* (datos de identificación, salud, residencia y contactos).

*3️⃣ Paso 3: Descarga de recaudos digitales*
• Al finalizar la actualización de la ficha del estudiante, el sistema le habilitará la descarga de tres (3) documentos obligatorios:
   📄 *Hoja de Resumen de Admisión*
   📜 *Carta de Aceptación Oficial*
   📑 *Normas Internas de Convivencia Escolar*

*4️⃣ Paso 4: Impresión y recaudos físicos en carpeta*
• Imprima los documentos descargados en el Paso 3.
• Arme una carpeta de manila tamaño oficio adjuntando dichos recaudos impresos conjuntamente con todos los recaudos físicos requeridos en el documento de la Carta de Aceptación (partida de nacimiento, fotos tipo carnet, copia de cédulas, notas y constancias según el nivel).

*5️⃣ Paso 5: Asistencia a la escuela en la convocatoria*
• Asista puntualmente a la institución en las fechas y horarios señalados en el cronograma de convocatoria oficial para la revisión y validación física de la documentación en la Coordinación de Control de Estudios.

*6️⃣ Paso 6: Constancia de inscripción (en 12 horas)*
• En un lapso de doce (12) horas posteriores a la verificación y validación presencial de sus documentos físicos en el plantel, ingrese nuevamente al sistema SIGAE y descargue su *Constancia de Inscripción Definitiva*.

{CIERRE}

_Canal de Atención Oficial • Comité de Admisiones SIGAE_
_Ref. de Seguridad Única: #{CODIGO}_`;

export const OrientacionesNuevosIngresos: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  usePermisos();

  // Escuela activa por defecto del sistema
  const [escuelaFiltro, setEscuelaFiltro] = useState<'todas' | 'sb' | 'lb'>(() => {
    const fromUrl = searchParams.get('escuela');
    if (fromUrl === 'sb' || fromUrl === 'lb') return fromUrl;
    const local = localStorage.getItem('sigae_escuela_codigo');
    return local === 'lb' ? 'lb' : 'sb';
  });

  const [pestañaActiva, setPestañaActiva] = useState<'despachador' | 'editor' | 'flyer'>('despachador');

  // Datos de aspirantes admitidos
  const [aspirantes, setAspirantes] = useState<AspiranteWhatsApp[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Filtros de tabla
  const [filtroGrado, setFiltroGrado] = useState<string>('todos');
  const [filtroEstadoEnvio, setFiltroEstadoEnvio] = useState<'todos' | 'pendientes' | 'enviados'>('pendientes');
  const [filtroAceptacion, setFiltroAceptacion] = useState<'todos' | 'enviados' | 'pendientes'>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  // Configuración Anti-Spam
  const [activarAntiSpam, setActivarAntiSpam] = useState<boolean>(true);
  const [segundosRetardo, setSegundosRetardo] = useState<number>(8);
  const [tamanoLoteSeguridad, setTamanoLoteSeguridad] = useState<number>(15);
  const [plantillaPersonalizada, setPlantillaPersonalizada] = useState<string>(MENSAJE_PASO_A_PASO_BASE);

  // Estados de Despacho Asistido
  const [despachandoAutomatico, setDespachandoAutomatico] = useState<boolean>(false);
  const [indiceActualDespacho, setIndiceActualDespacho] = useState<number>(0);
  const [segundosRestantes, setSegundosRestantes] = useState<number>(0);
  const [mensajesEnviadosEnLoteActual, setMensajesEnviadosEnLoteActual] = useState<number>(0);

  // Previsualización y flyer
  const flyerRef = useRef<HTMLDivElement>(null);
  const [descargandoFlyer, setDescargandoFlyer] = useState<boolean>(false);

  // Temporizador ref
  const timerRef = useRef<any>(null);

  useEffect(() => {
    cargarAspirantesAdmitidos();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const cargarAspirantesAdmitidos = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('solicitud_cupos')
        .select('*')
        .in('estado', ['Aprobado', 'Formalizado', 'Aceptado'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formateados: AspiranteWhatsApp[] = (data || []).map((s: any) => {
        let orientacionesNotificado = false;
        let fechaOrientaciones = '';
        let aceptacionNotificada = false;
        let fechaAceptacion = '';

        if (s.observaciones && typeof s.observaciones === 'string') {
          // 1. Marca de Aceptación de Cupo
          if (s.observaciones.includes('[WhatsApp Aceptación:') || s.observaciones.includes('[WhatsApp: Enviado') || s.observaciones.includes('whatsapp_notificado')) {
            aceptacionNotificada = true;
            const matchAcep = s.observaciones.match(/\[(?:WhatsApp Aceptación|WhatsApp):\s*Enviado(?:\|\s*Fecha:\s*([^|\]]+))?/i);
            if (matchAcep && matchAcep[1]) fechaAceptacion = matchAcep[1].trim();
          }

          // 2. Marca de Orientaciones Paso a Paso
          if (s.observaciones.includes('[WhatsApp Orientaciones:') || s.observaciones.includes('[Orientaciones: Enviado')) {
            orientacionesNotificado = true;
            const match = s.observaciones.match(/\[(?:WhatsApp )?Orientaciones:\s*Enviado(?:\|\s*Fecha:\s*([^|\]]+))?/i);
            if (match && match[1]) fechaOrientaciones = match[1].trim();
          }
        }

        return {
          id: s.id,
          codigo_unico: s.codigo_unico || `CR-${s.id}`,
          codigo_escuela: (s.codigo_escuela || 'sb').toLowerCase(),
          estado: s.estado || 'Aprobado',
          representante_nombres: s.representante_nombres || '',
          representante_apellidos: s.representante_apellidos || '',
          representante_cedula: s.representante_cedula || '',
          representante_telefono: s.representante_telefono || s.representante_telefono2 || '',
          representante_email: s.representante_email || '',
          estudiante_nombres: s.estudiante_nombres || '',
          estudiante_apellidos: s.estudiante_apellidos || '',
          estudiante_cedula: s.estudiante_cedula || '',
          grado_solicitado: s.grado_solicitado || 'Grado no especificado',
          observaciones: s.observaciones || '',
          aceptacion_notificada: aceptacionNotificada,
          aceptacion_fecha: fechaAceptacion,
          whatsapp_notificado: orientacionesNotificado,
          whatsapp_fecha: fechaOrientaciones
        };
      });

      setAspirantes(formateados);
    } catch (err) {
      console.error('Error cargando aspirantes admitidos:', err);
    } finally {
      setCargando(false);
    }
  };

  const limpiarCedula = (val: string = '') => val.replace(/\D/g, '');

  const formatearTelefonoWA = (tel: string = '') => {
    let limpio = limpiarCedula(tel);
    if (!limpio || limpio.length < 7) return '';
    if (limpio.startsWith('0')) limpio = '58' + limpio.substring(1);
    if (!limpio.startsWith('58')) limpio = '58' + limpio;
    return limpio;
  };

  // Lista filtrada
  const aspirantesFiltrados = useMemo(() => {
    return aspirantes.filter(a => {
      if (escuelaFiltro !== 'todas' && a.codigo_escuela !== escuelaFiltro) return false;
      if (filtroGrado !== 'todos' && a.grado_solicitado !== filtroGrado) return false;

      // Filtro Marca 2: Orientaciones
      if (filtroEstadoEnvio === 'pendientes' && a.whatsapp_notificado) return false;
      if (filtroEstadoEnvio === 'enviados' && !a.whatsapp_notificado) return false;

      // Filtro Marca 1: Aceptación
      if (filtroAceptacion === 'pendientes' && a.aceptacion_notificada) return false;
      if (filtroAceptacion === 'enviados' && !a.aceptacion_notificada) return false;

      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const rep = `${a.representante_nombres} ${a.representante_apellidos} ${a.representante_cedula}`.toLowerCase();
        const est = `${a.estudiante_nombres} ${a.estudiante_apellidos} ${a.estudiante_cedula}`.toLowerCase();
        const cod = a.codigo_unico.toLowerCase();
        if (!rep.includes(q) && !est.includes(q) && !cod.includes(q)) return false;
      }

      return true;
    });
  }, [aspirantes, escuelaFiltro, filtroGrado, filtroEstadoEnvio, filtroAceptacion, busqueda]);

  const opcionesGrado = useMemo(() => {
    const sets = new Set<string>();
    aspirantes.forEach(a => {
      if (a.grado_solicitado) sets.add(a.grado_solicitado);
    });
    return Array.from(sets).sort();
  }, [aspirantes]);

  // Generador de Mensaje con Spintax y Blindaje Anti-Spam
  const generarMensajeAntiSpam = (asp: AspiranteWhatsApp, indice: number = 0): string => {
    const escNombre = asp.codigo_escuela === 'sb' ? 'Unidad Educativa Santa Bárbara' : 'Unidad Educativa Libertador Bolívar';
    const nomRep = `${asp.representante_nombres} ${asp.representante_apellidos}`.trim() || 'Estimado Representante';
    const nomEst = `${asp.estudiante_nombres} ${asp.estudiante_apellidos}`.trim() || 'Aspirante Asignado';
    const cedRep = limpiarCedula(asp.representante_cedula);
    const grd = asp.grado_solicitado || 'Grado Solicitado';

    // Rotación de saludos y cierres para evitar detección de spam
    let saludo = BANCO_SALUDOS[0];
    let cierre = BANCO_CIERRES[0];

    if (activarAntiSpam) {
      saludo = BANCO_SALUDOS[indice % BANCO_SALUDOS.length];
      cierre = BANCO_CIERRES[(indice + 1) % BANCO_CIERRES.length];
    }

    const texto = plantillaPersonalizada
      .replace(/{SALUDO}/g, saludo)
      .replace(/{CIERRE}/g, cierre)
      .replace(/{ESCUELA}/g, escNombre)
      .replace(/{REPRESENTANTE}/g, nomRep)
      .replace(/{ESTUDIANTE}/g, nomEst)
      .replace(/{CEDULA_REP}/g, cedRep)
      .replace(/{GRADO}/g, grd)
      .replace(/{CODIGO}/g, asp.codigo_unico);

    return texto;
  };

  // Alternar Marca 1: Mensaje de Aceptación
  const toggleMarcaAceptacion = async (aspId: string | number) => {
    const asp = aspirantes.find(a => a.id === aspId);
    if (!asp) return;

    const fechaHora = new Date().toLocaleDateString('es-VE') + ' ' + new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    const obsActual = asp.observaciones || '';
    const yaEnviado = !!asp.aceptacion_notificada;

    let nuevaObs = obsActual;
    if (yaEnviado) {
      nuevaObs = obsActual
        .replace(/\[WhatsApp Aceptación:\s*Enviado[^\]]*\]/gi, '')
        .replace(/\[WhatsApp:\s*Enviado[^\]]*\]/gi, '')
        .trim();
    } else {
      nuevaObs = `${obsActual} [WhatsApp Aceptación: Enviado | Fecha: ${fechaHora}]`.trim();
    }

    try {
      await supabase
        .from('solicitud_cupos')
        .update({ observaciones: nuevaObs })
        .eq('id', aspId);

      setAspirantes(prev => prev.map(a => a.id === aspId ? {
        ...a,
        aceptacion_notificada: !yaEnviado,
        aceptacion_fecha: yaEnviado ? '' : fechaHora,
        observaciones: nuevaObs
      } : a));

      if (Swal) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: yaEnviado ? 'info' : 'success',
          title: yaEnviado ? 'Aceptación: marcada PENDIENTE' : 'Aceptación: marcada ENVIADA',
          showConfirmButton: false,
          timer: 1600
        });
      }
    } catch (e) {
      console.warn('Error actualizando marca de aceptación:', e);
    }
  };

  // Alternar Marca 2: Mensaje de Orientaciones Paso a Paso
  const toggleMarcaOrientaciones = async (aspId: string | number) => {
    const asp = aspirantes.find(a => a.id === aspId);
    if (!asp) return;

    const fechaHora = new Date().toLocaleDateString('es-VE') + ' ' + new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    const obsActual = asp.observaciones || '';
    const yaEnviado = !!asp.whatsapp_notificado;

    let nuevaObs = obsActual;
    if (yaEnviado) {
      nuevaObs = obsActual
        .replace(/\[WhatsApp Orientaciones:\s*Enviado[^\]]*\]/gi, '')
        .replace(/\[Orientaciones:\s*Enviado[^\]]*\]/gi, '')
        .trim();
    } else {
      nuevaObs = `${obsActual} [WhatsApp Orientaciones: Enviado | Fecha: ${fechaHora}]`.trim();
    }

    try {
      await supabase
        .from('solicitud_cupos')
        .update({ observaciones: nuevaObs })
        .eq('id', aspId);

      setAspirantes(prev => prev.map(a => a.id === aspId ? {
        ...a,
        whatsapp_notificado: !yaEnviado,
        whatsapp_fecha: yaEnviado ? '' : fechaHora,
        observaciones: nuevaObs
      } : a));

      if (Swal) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: yaEnviado ? 'info' : 'success',
          title: yaEnviado ? 'Orientaciones: marcadas PENDIENTES' : 'Orientaciones: marcadas ENVIADAS',
          showConfirmButton: false,
          timer: 1600
        });
      }
    } catch (e) {
      console.warn('Error actualizando marca de orientaciones:', e);
    }
  };

  // Registrar envío de orientaciones al despachar por wa.me
  const registrarEnvioOrientacionesEnBD = async (aspId: string | number) => {
    const asp = aspirantes.find(a => a.id === aspId);
    if (!asp) return;

    const fechaHora = new Date().toLocaleDateString('es-VE') + ' ' + new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    const obsActual = asp.observaciones || '';
    if (obsActual.includes('[WhatsApp Orientaciones: Enviado')) return;

    const nuevaObs = `${obsActual} [WhatsApp Orientaciones: Enviado | Fecha: ${fechaHora}]`.trim();

    try {
      await supabase
        .from('solicitud_cupos')
        .update({ observaciones: nuevaObs })
        .eq('id', aspId);

      setAspirantes(prev => prev.map(a => a.id === aspId ? {
        ...a,
        whatsapp_notificado: true,
        whatsapp_fecha: fechaHora,
        observaciones: nuevaObs
      } : a));
    } catch (e) {
      console.warn('Error registrando envío de orientaciones:', e);
    }
  };

  // Envío individual a través de enlace oficial wa.me
  const enviarWhatsAppIndividual = (asp: AspiranteWhatsApp, idxRelativo: number = 0) => {
    const telWA = formatearTelefonoWA(asp.representante_telefono);
    if (!telWA) {
      if (Swal) Swal.fire('Sin Teléfono Válido', `El aspirante ${asp.estudiante_nombres} no tiene un teléfono celular válido registrado.`, 'warning');
      return;
    }

    const mensaje = generarMensajeAntiSpam(asp, idxRelativo);
    const url = `https://wa.me/${telWA}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
    registrarEnvioOrientacionesEnBD(asp.id);
  };

  // Copiar mensaje individual
  const copiarMensajeAlPortapapeles = async (asp: AspiranteWhatsApp, idxRelativo: number = 0) => {
    const mensaje = generarMensajeAntiSpam(asp, idxRelativo);
    try {
      await navigator.clipboard.writeText(mensaje);
      if (Swal) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `¡Mensaje copiado para ${asp.estudiante_nombres}!`,
          showConfirmButton: false,
          timer: 2000
        });
      }
    } catch {
      // Fallback
    }
  };

  // ── INICIAR / DETENER DESPACHADOR SECUENCIAL ANTI-SPAM ──────────────────────
  const iniciarDespachoSecuencial = () => {
    if (aspirantesFiltrados.length === 0) {
      if (Swal) Swal.fire('Lista Vacía', 'No hay aspirantes pendientes en el filtro actual.', 'info');
      return;
    }

    setDespachandoAutomatico(true);
    setIndiceActualDespacho(0);
    setMensajesEnviadosEnLoteActual(0);

    // Enviar primer mensaje inmediatamente
    ejecutarPasoDespacho(0, 0);
  };

  const detenerDespachoSecuencial = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setDespachandoAutomatico(false);
    setSegundosRestantes(0);
  };

  const ejecutarPasoDespacho = (index: number, countEnLote: number) => {
    if (index >= aspirantesFiltrados.length) {
      detenerDespachoSecuencial();
      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Difusión Completada!',
          text: 'Se ha completado el despacho a todos los aspirantes de la lista con la protección anti-spam activa.',
          confirmButtonColor: '#10B981'
        });
      }
      return;
    }

    // Verificar si alcanzó el límite del lote de seguridad
    if (countEnLote >= tamanoLoteSeguridad) {
      if (Swal) {
        Swal.fire({
          icon: 'info',
          title: `Lote de ${tamanoLoteSeguridad} Envíos Alcanzado`,
          html: `<p>Para proteger su cuenta de WhatsApp contra bloqueos algorítmicos de Meta, le recomendamos descansar <b>2 a 3 minutos</b> antes de continuar.</p><p class="fw-bold mb-0">¿Desea reanudar el siguiente lote ahora?</p>`,
          showCancelButton: true,
          confirmButtonText: 'Sí, reanudar siguiente lote',
          cancelButtonText: 'Pausar despacho',
          confirmButtonColor: '#10B981'
        }).then((res: any) => {
          if (res.isConfirmed) {
            setMensajesEnviadosEnLoteActual(0);
            ejecutarPasoDespacho(index, 0);
          } else {
            detenerDespachoSecuencial();
          }
        });
      }
      return;
    }

    const aspActual = aspirantesFiltrados[index];
    enviarWhatsAppIndividual(aspActual, index);

    // Incrementar contadores
    const siguienteIndice = index + 1;
    const nuevoLoteCount = countEnLote + 1;
    setIndiceActualDespacho(siguienteIndice);
    setMensajesEnviadosEnLoteActual(nuevoLoteCount);

    if (siguienteIndice < aspirantesFiltrados.length) {
      // Configurar cuenta regresiva de retardo humano aleatorio
      const delay = activarAntiSpam 
        ? Math.floor(Math.random() * 4) + segundosRetardo
        : 4;

      setSegundosRestantes(delay);

      timerRef.current = setInterval(() => {
        setSegundosRestantes(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            ejecutarPasoDespacho(siguienteIndice, nuevoLoteCount);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      detenerDespachoSecuencial();
      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Difusión Finalizada con Éxito!',
          text: 'Se han procesado todos los aspirantes de la lista seleccionada.',
          confirmButtonColor: '#10B981'
        });
      }
    }
  };

  // Descarga del flyer como imagen PNG
  const descargarFlyerPNG = async () => {
    if (!flyerRef.current) return;
    setDescargandoFlyer(true);
    try {
      const canvas = await html2canvas(flyerRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const enlace = document.createElement('a');
      enlace.download = `Orientaciones_PasoAPaso_NuevosIngresos_${escuelaFiltro.toUpperCase()}.png`;
      enlace.href = canvas.toDataURL('image/png');
      enlace.click();

      if (Swal) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: '¡Flyer PNG descargado en Alta Calidad!',
          showConfirmButton: false,
          timer: 2500
        });
      }
    } catch (e) {
      console.error('Error generando imagen:', e);
    } finally {
      setDescargandoFlyer(false);
    }
  };

  // Métricas del panel
  const totalAprobados = aspirantes.length;
  // Marca 1: Aceptación
  const totalAceptacionEnviados = aspirantes.filter(a => a.aceptacion_notificada).length;
  const totalAceptacionPendientes = totalAprobados - totalAceptacionEnviados;
  // Marca 2: Orientaciones
  const totalNotificados = aspirantes.filter(a => a.whatsapp_notificado).length;
  const totalPendientes = totalAprobados - totalNotificados;
  const porcentajeAvance = totalAprobados > 0 ? Math.round((totalNotificados / totalAprobados) * 100) : 0;

  const escuelaNombreActiva = escuelaFiltro === 'sb'
    ? 'Unidad Educativa Santa Bárbara'
    : (escuelaFiltro === 'lb' ? 'Unidad Educativa Libertador Bolívar' : 'Ambas Sedes Institucionales');

  const logoEscuela = escuelaFiltro === 'lb' ? '/assets/img/logo_lb.png' : '/assets/img/logo_sb.png';

  return (
    <div className="modulo-animado container-fluid px-2 px-sm-3 px-md-4 py-3 animate__animated animate__fadeIn p-0" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* 1. Miga de Pan Chamilo */}
      <ChamiloBreadcrumb
        items={[
          { label: 'Diseños', url: '/categoria/Dise%C3%B1os', icon: 'bi-palette-fill' },
          { label: 'Orientaciones Nuevos Ingresos (WhatsApp Masivo)', icon: 'bi-whatsapp' }
        ]}
      />

      {/* ── 2. CABECERA INSTITUCIONAL CHAMILO TECH ── */}
      <div 
        className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 border-top border-4" 
        style={{ 
          borderColor: '#10B981',
          background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 50%, #ecfdf5 100%)'
        }}
      >
        <div className="p-4 p-md-5">
          <div className="row align-items-center g-4">
            {/* Contenedor Dual: Icono 3D WhatsApp + Escudo Institucional */}
            <div className="col-12 col-md-auto text-center text-md-start">
              <div className="d-inline-flex align-items-center gap-3 p-2 bg-white rounded-4 shadow-sm border border-success-subtle">
                <div 
                  className="rounded-4 p-2 d-inline-flex align-items-center justify-content-center shadow-xs" 
                  style={{ 
                    width: '84px', 
                    height: '84px',
                    background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                    border: '1px solid #a7f3d0'
                  }}
                >
                  <i className="bi bi-whatsapp text-success" style={{ fontSize: '46px' }}></i>
                </div>
                <div 
                  className="rounded-4 p-2 bg-light border d-inline-flex align-items-center justify-content-center shadow-xs" 
                  style={{ width: '84px', height: '84px' }}
                >
                  <img 
                    src={logoEscuela} 
                    alt="Escudo" 
                    className="img-fluid"
                    style={{ maxHeight: '68px', objectFit: 'contain' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                  />
                </div>
              </div>
            </div>

            {/* Título y Métricas Clave */}
            <div className="col-12 col-md">
              <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                <span className="badge bg-success text-white fw-bold px-3 py-1.5 rounded-pill small shadow-xs">
                  <i className="bi bi-shield-check me-1"></i>Protección Anti-Spam Activa
                </span>
                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs">
                  <i className="bi bi-people-fill text-primary me-1"></i><b>{totalAprobados}</b> Admitidos
                </span>
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs" title="Representantes que ya recibieron la Carta/Notificación de Aceptación">
                  <i className="bi bi-check2-circle me-1"></i>1. Aceptación: <b>{totalAceptacionEnviados}</b>/{totalAprobados}
                </span>
                <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs" title="Representantes que ya recibieron las Orientaciones Paso a Paso">
                  <i className="bi bi-signpost-split-fill me-1"></i>2. Orientaciones: <b>{totalNotificados}</b>/{totalAprobados} ({porcentajeAvance}%)
                </span>
                <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs" title="Representantes con Orientaciones pendientes por enviar">
                  <i className="bi bi-clock-history me-1"></i><b>{totalPendientes}</b> Pendientes
                </span>
              </div>

              <h1 className="fw-bolder mb-1.5 text-dark" style={{ fontSize: 'calc(1.4rem + 0.6vw)', letterSpacing: '-0.5px' }}>
                Orientaciones Nuevos Ingresos &bull; Difusión Masiva WhatsApp
              </h1>

              <p className="mb-0 text-muted small" style={{ maxWidth: '820px' }}>
                Despachador inteligente con retardo humano programable, rotación de textos anti-bloqueo y plantilla oficial del paso a paso: ingreso, creación de contraseña, actualización de ficha estudiantil, descarga de recaudos, convocatoria física y constancia en 12h.
              </p>
            </div>

            {/* Selector de Sede y Acciones */}
            <div className="col-12 col-md-auto text-md-end text-center d-flex flex-column align-items-md-end align-items-center gap-2">
              <div className="d-inline-flex p-1 bg-white rounded-pill border shadow-xs" style={{ borderColor: '#a7f3d0' }}>
                <button
                  type="button"
                  onClick={() => setEscuelaFiltro('todas')}
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${escuelaFiltro === 'todas' ? 'bg-success text-white shadow-xs' : 'text-muted'}`}
                  style={{ fontSize: '0.78rem' }}
                >
                  Ambas Sedes
                </button>
                <button
                  type="button"
                  onClick={() => setEscuelaFiltro('sb')}
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${escuelaFiltro === 'sb' ? 'bg-success text-white shadow-xs' : 'text-muted'}`}
                  style={{ fontSize: '0.78rem' }}
                >
                  Santa Bárbara
                </button>
                <button
                  type="button"
                  onClick={() => setEscuelaFiltro('lb')}
                  className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${escuelaFiltro === 'lb' ? 'bg-success text-white shadow-xs' : 'text-muted'}`}
                  style={{ fontSize: '0.78rem' }}
                >
                  Libertador Bolívar
                </button>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/categoria/Diseños')}
                  className="btn btn-white bg-white rounded-pill px-3 py-1.5 fw-bold text-muted d-inline-flex align-items-center gap-1.5 hover-efecto border shadow-xs"
                  style={{ fontSize: '0.8rem' }}
                >
                  <i className="bi bi-arrow-left"></i>
                  <span>Volver a Diseños</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/categoria/Gestión%20Estudiantil/Gestión%20de%20Admisiones')}
                  className="btn btn-outline-success rounded-pill px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-1.5 hover-efecto shadow-xs"
                  style={{ fontSize: '0.8rem' }}
                >
                  <i className="bi bi-ui-checks"></i>
                  <span>Ver en Admisiones</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Pestañas de Navegación */}
        <div className="px-4 py-2 bg-light border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
          <ul className="nav nav-pills gap-2">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link rounded-pill fw-bold px-3.5 py-1.5 d-flex align-items-center gap-2 ${pestañaActiva === 'despachador' ? 'active bg-success text-white' : 'text-dark'}`}
                style={{ fontSize: '0.83rem' }}
                onClick={() => setPestañaActiva('despachador')}
              >
                <i className="bi bi-send-check-fill"></i>
                <span>Despachador Masivo WhatsApp</span>
                <span className="badge bg-white text-success rounded-pill">{aspirantesFiltrados.length}</span>
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link rounded-pill fw-bold px-3.5 py-1.5 d-flex align-items-center gap-2 ${pestañaActiva === 'editor' ? 'active bg-success text-white' : 'text-dark'}`}
                style={{ fontSize: '0.83rem' }}
                onClick={() => setPestañaActiva('editor')}
              >
                <i className="bi bi-pencil-square"></i>
                <span>Editor del Mensaje y Variables</span>
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link rounded-pill fw-bold px-3.5 py-1.5 d-flex align-items-center gap-2 ${pestañaActiva === 'flyer' ? 'active bg-success text-white' : 'text-dark'}`}
                style={{ fontSize: '0.83rem' }}
                onClick={() => setPestañaActiva('flyer')}
              >
                <i className="bi bi-file-earmark-image-fill"></i>
                <span>Flyer Gráfico HD &bull; Descargar PNG</span>
              </button>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              onClick={cargarAspirantesAdmitidos}
              className="btn btn-sm btn-white bg-white text-muted border rounded-pill px-3 py-1 fw-bold shadow-xs hover-efecto"
              title="Recargar datos de admisiones desde la nube"
            >
              <i className="bi bi-arrow-clockwise me-1"></i>Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* ── ALERTA INFORMATIVA CONSEJO ANTI-SPAM ── */}
      <ChamiloHelpCallout
        title="¿Cómo protege este sistema su línea de WhatsApp contra bloqueos y reportes de Spam?"
        storageKey="guia_antispam_whatsapp"
      >
        <div className="row g-2 text-dark extra-small">
          <div className="col-12 col-md-4">
            <span className="fw-bold text-success d-block mb-1">
              <i className="bi bi-shuffle me-1"></i>1. Rotación de Textos (Spintax)
            </span>
            Los saludos, conectores y pies de firma varían de forma inteligente para cada representante. Ningún mensaje saldrá con la misma secuencia de bytes, evitando los filtros automáticos de Meta.
          </div>
          <div className="col-12 col-md-4">
            <span className="fw-bold text-success d-block mb-1">
              <i className="bi bi-hourglass-split me-1"></i>2. Retardo Humano Programable
            </span>
            El sistema espera entre {segundosRetardo} a {segundosRetardo + 3} segundos aleatorios entre cada envío, imitando el comportamiento de un operador humano real y no de un robot.
          </div>
          <div className="col-12 col-md-4">
            <span className="fw-bold text-success d-block mb-1">
              <i className="bi bi-boxes me-1"></i>3. Lotes Seguros con Pausa
            </span>
            Se recomienda realizar envíos en tandas de {tamanoLoteSeguridad} contactos con un breve descanso de 2 minutos para mantener la reputación de la línea en estado óptimo.
          </div>
        </div>
      </ChamiloHelpCallout>

      {/* ══════════════════════════════════════════════════════════════════
          PESTAÑA 1: DESPACHADOR MASIVO WHATSAPP (ANTI-SPAM SHIELD)
         ══════════════════════════════════════════════════════════════════ */}
      {pestañaActiva === 'despachador' && (
        <div className="row g-3">
          {/* Panel Superior: Controles Anti-Spam y Estado de Despacho */}
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white">
              <div className="row align-items-center g-3">
                {/* Interruptores y Ajustes de Retardo */}
                <div className="col-12 col-lg-7">
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <div className="form-check form-switch m-0 d-flex align-items-center gap-2">
                      <input
                        className="form-check-input hover-mano fs-5"
                        type="checkbox"
                        id="switch-antispam"
                        checked={activarAntiSpam}
                        onChange={(e) => setActivarAntiSpam(e.target.checked)}
                      />
                      <label className="form-check-label fw-bold text-dark small hover-mano" htmlFor="switch-antispam">
                        Escudo Anti-Spam Meta (Spintax Rotativo)
                      </label>
                    </div>

                    <div className="d-flex align-items-center gap-1.5">
                      <span className="extra-small fw-bold text-muted">Retardo:</span>
                      <select
                        className="form-select form-select-sm fw-bold border-success text-success"
                        style={{ width: '130px' }}
                        value={segundosRetardo}
                        onChange={(e) => setSegundosRetardo(Number(e.target.value))}
                        disabled={despachandoAutomatico}
                      >
                        <option value={5}>5 seg (Rápido)</option>
                        <option value={8}>8 seg (Recomendado)</option>
                        <option value={12}>12 seg (Máxima Seg.)</option>
                        <option value={15}>15 seg (Ultra Seguro)</option>
                      </select>
                    </div>

                    <div className="d-flex align-items-center gap-1.5">
                      <span className="extra-small fw-bold text-muted">Lote:</span>
                      <select
                        className="form-select form-select-sm fw-semibold"
                        style={{ width: '110px' }}
                        value={tamanoLoteSeguridad}
                        onChange={(e) => setTamanoLoteSeguridad(Number(e.target.value))}
                        disabled={despachandoAutomatico}
                      >
                        <option value={10}>10 envíos</option>
                        <option value={15}>15 envíos</option>
                        <option value={20}>20 envíos</option>
                        <option value={30}>30 envíos</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Botones de Acción Masiva */}
                <div className="col-12 col-lg-5 text-lg-end d-flex align-items-center justify-content-lg-end gap-2 flex-wrap">
                  {!despachandoAutomatico ? (
                    <button
                      type="button"
                      onClick={iniciarDespachoSecuencial}
                      disabled={aspirantesFiltrados.length === 0}
                      className="btn btn-success rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2 hover-efecto"
                    >
                      <i className="bi bi-play-circle-fill fs-5"></i>
                      <span>Iniciar Difusión Masiva ({aspirantesFiltrados.length})</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={detenerDespachoSecuencial}
                      className="btn btn-danger rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2 hover-efecto"
                    >
                      <i className="bi bi-stop-circle-fill fs-5"></i>
                      <span>Detener Difusión</span>
                    </button>
                  )}
                </div>
              </div>

              {/* BARRA DE PROGRESO DE ENVÍO ACTIVO */}
              {despachandoAutomatico && (
                <div className="mt-3 pt-3 border-top animate__animated animate__fadeIn">
                  <div className="d-flex justify-content-between align-items-center mb-1.5 flex-wrap gap-2">
                    <span className="fw-bold small text-dark d-flex align-items-center gap-2">
                      <span className="spinner-grow spinner-grow-sm text-success" role="status"></span>
                      Despachando aspirante {indiceActualDespacho} de {aspirantesFiltrados.length}
                    </span>
                    {segundosRestantes > 0 && (
                      <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-1 fw-bold">
                        <i className="bi bi-hourglass-split me-1"></i>Pausa Anti-Spam: enviando el siguiente en {segundosRestantes}s... (Lote: {mensajesEnviadosEnLoteActual}/{tamanoLoteSeguridad})
                      </span>
                    )}
                  </div>
                  <div className="progress rounded-pill shadow-inner" style={{ height: '14px', backgroundColor: '#e2e8f0' }}>
                    <div 
                      className="progress-bar progress-bar-striped progress-bar-animated bg-success rounded-pill"
                      style={{ width: `${Math.round((indiceActualDespacho / aspirantesFiltrados.length) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Filtros de la Tabla */}
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
              <div className="row g-2 align-items-center">
                <div className="col-12 col-md-3">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light border-end-0">
                      <i className="bi bi-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control bg-light border-start-0"
                      placeholder="Buscar por cédula, nombre o código..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                    />
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <select
                    className="form-select form-select-sm"
                    value={filtroGrado}
                    onChange={(e) => setFiltroGrado(e.target.value)}
                  >
                    <option value="todos">Todos los Grados ({aspirantes.length})</option>
                    {opcionesGrado.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="col-6 col-md-3">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light extra-small fw-bold">🧭 Orientaciones:</span>
                    <select
                      className="form-select form-select-sm"
                      value={filtroEstadoEnvio}
                      onChange={(e) => setFiltroEstadoEnvio(e.target.value as any)}
                    >
                      <option value="pendientes">Pendientes ({totalPendientes})</option>
                      <option value="enviados">Enviadas ({totalNotificados})</option>
                      <option value="todos">Todas ({totalAprobados})</option>
                    </select>
                  </div>
                </div>

                <div className="col-12 col-md-3">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light extra-small fw-bold">📜 Aceptación:</span>
                    <select
                      className="form-select form-select-sm"
                      value={filtroAceptacion}
                      onChange={(e) => setFiltroAceptacion(e.target.value as any)}
                    >
                      <option value="todos">Todas ({totalAprobados})</option>
                      <option value="enviados">Enviadas ({totalAceptacionEnviados})</option>
                      <option value="pendientes">Pendientes ({totalAceptacionPendientes})</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TABLA DE DESTINATARIOS */}
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
              <div className="table-responsive" style={{ maxHeight: '560px' }}>
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                  <thead className="table-light extra-small text-uppercase fw-bold sticky-top">
                    <tr>
                      <th className="ps-3 py-3" style={{ width: '45px' }}>#</th>
                      <th>Estudiante / Grado</th>
                      <th>Plantel</th>
                      <th>Representante / Cédula</th>
                      <th>Teléfono Celular</th>
                      <th className="text-center" style={{ minWidth: '150px' }}>
                        <i className="bi bi-check2-circle text-primary me-1"></i>1. Aceptación
                      </th>
                      <th className="text-center" style={{ minWidth: '170px' }}>
                        <i className="bi bi-signpost-split text-success me-1"></i>2. Orientaciones
                      </th>
                      <th className="text-end pe-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cargando ? (
                      <tr>
                        <td colSpan={8} className="text-center py-5 text-muted">
                          <div className="spinner-border text-success spinner-border-sm me-2" role="status"></div>
                          Cargando aspirantes admitidos para difusión...
                        </td>
                      </tr>
                    ) : aspirantesFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-5 text-muted">
                          <i className="bi bi-inbox fs-2 text-muted d-block mb-2"></i>
                          No se encontraron representantes bajo los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      aspirantesFiltrados.map((asp, idx) => {
                        const telValido = formatearTelefonoWA(asp.representante_telefono);
                        const esFilaActual = despachandoAutomatico && indiceActualDespacho === idx;

                        return (
                          <tr key={asp.id || asp.codigo_unico} className={esFilaActual ? 'table-success bg-opacity-25' : ''}>
                            <td className="ps-3 fw-bold text-muted extra-small">{idx + 1}</td>
                            <td>
                              <div className="fw-bold text-dark">{asp.estudiante_nombres} {asp.estudiante_apellidos}</div>
                              <small className="text-muted extra-small">
                                {asp.grado_solicitado} &bull; <span className="font-monospace">{asp.codigo_unico}</span>
                              </small>
                            </td>
                            <td>
                              <span className={`badge rounded-pill ${asp.codigo_escuela === 'sb' ? 'bg-primary' : 'bg-success'} text-white extra-small px-2 py-1`}>
                                {asp.codigo_escuela?.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <div className="text-dark fw-semibold">{asp.representante_nombres} {asp.representante_apellidos}</div>
                              <small className="text-muted extra-small">C.I. V-{limpiarCedula(asp.representante_cedula)}</small>
                            </td>
                            <td>
                              {telValido ? (
                                <span className="font-monospace fw-bold text-dark">
                                  <i className="bi bi-telephone me-1 text-muted"></i>
                                  {asp.representante_telefono}
                                </span>
                              ) : (
                                <span className="badge bg-danger-subtle text-danger extra-small">
                                  Sin celular válido
                                </span>
                              )}
                            </td>

                            {/* MARCA 1: MENSAJE DE ACEPTACIÓN */}
                            <td className="text-center">
                              <div className="d-inline-flex align-items-center gap-1.5 p-1 rounded-pill bg-light border">
                                {asp.aceptacion_notificada ? (
                                  <span className="badge rounded-pill px-2 py-1 fw-bold" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', border: '1px solid #93C5FD' }} title={asp.aceptacion_fecha ? `Aceptación enviada el ${asp.aceptacion_fecha}` : 'Aceptación enviada'}>
                                    <i className="bi bi-check-circle-fill me-1"></i>Enviada
                                  </span>
                                ) : (
                                  <span className="badge rounded-pill px-2 py-1 fw-semibold text-muted bg-white border">
                                    <i className="bi bi-clock me-1"></i>Pendiente
                                  </span>
                                )}
                                <button
                                  type="button"
                                  className={`btn btn-xs rounded-circle p-1 shadow-xs ${asp.aceptacion_notificada ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
                                  onClick={() => toggleMarcaAceptacion(asp.id)}
                                  title={asp.aceptacion_notificada ? 'Hacer clic para marcar aceptación como PENDIENTE' : 'Hacer clic para marcar aceptación como ENVIADA'}
                                  style={{ width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  <i className={`bi bi-${asp.aceptacion_notificada ? 'check-lg' : 'dash-lg'}`} style={{ fontSize: '11px' }}></i>
                                </button>
                              </div>
                              {asp.aceptacion_fecha && (
                                <small className="text-muted d-block text-truncate mx-auto mt-0.5" style={{ fontSize: '9.5px', maxWidth: '140px' }}>
                                  {asp.aceptacion_fecha}
                                </small>
                              )}
                            </td>

                            {/* MARCA 2: MENSAJE DE ORIENTACIONES PASO A PASO */}
                            <td className="text-center">
                              <div className="d-inline-flex align-items-center gap-1.5 p-1 rounded-pill bg-light border">
                                {asp.whatsapp_notificado ? (
                                  <span className="badge rounded-pill px-2 py-1 fw-bold" style={{ backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC' }} title={asp.whatsapp_fecha ? `Orientaciones enviadas el ${asp.whatsapp_fecha}` : 'Orientaciones enviadas'}>
                                    <i className="bi bi-check2-all me-1"></i>Enviadas
                                  </span>
                                ) : (
                                  <span className="badge rounded-pill px-2 py-1 fw-bold" style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' }}>
                                    <i className="bi bi-hourglass-split me-1"></i>Pendiente
                                  </span>
                                )}
                                <button
                                  type="button"
                                  className={`btn btn-xs rounded-circle p-1 shadow-xs ${asp.whatsapp_notificado ? 'btn-success' : 'btn-outline-warning bg-white'}`}
                                  onClick={() => toggleMarcaOrientaciones(asp.id)}
                                  title={asp.whatsapp_notificado ? 'Hacer clic para marcar orientaciones como PENDIENTES' : 'Hacer clic para marcar orientaciones como ENVIADAS'}
                                  style={{ width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  <i className={`bi bi-${asp.whatsapp_notificado ? 'check-lg' : 'dash-lg'}`} style={{ fontSize: '11px' }}></i>
                                </button>
                              </div>
                              {asp.whatsapp_fecha && (
                                <small className="text-muted d-block text-truncate mx-auto mt-0.5" style={{ fontSize: '9.5px', maxWidth: '140px' }}>
                                  {asp.whatsapp_fecha}
                                </small>
                              )}
                            </td>

                            {/* ACCIONES */}
                            <td className="text-end pe-3">
                              <div className="d-flex align-items-center justify-content-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => enviarWhatsAppIndividual(asp, idx)}
                                  disabled={!telValido}
                                  className="btn btn-sm btn-success text-white rounded-pill px-3 py-1 fw-bold d-inline-flex align-items-center gap-1 shadow-xs hover-efecto"
                                  title="Enviar orientaciones paso a paso por WhatsApp a este representante"
                                >
                                  <i className="bi bi-whatsapp"></i>
                                  <span>Enviar</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => copiarMensajeAlPortapapeles(asp, idx)}
                                  className="btn btn-sm btn-outline-secondary rounded-circle p-1.5"
                                  title="Copiar texto de orientaciones al portapapeles"
                                >
                                  <i className="bi bi-clipboard"></i>
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
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          PESTAÑA 2: EDITOR DEL MENSAJE Y SIMULADOR DE CHAT
         ══════════════════════════════════════════════════════════════════ */}
      {pestañaActiva === 'editor' && (
        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bolder mb-1 text-dark">Redactor de la Plantilla Paso a Paso</h5>
                  <p className="text-muted extra-small mb-0">
                    Las etiquetas entre llaves como <code>{'{REPRESENTANTE}'}</code> o <code>{'{ESCUELA}'}</code> se sustituyen de forma dinámica para cada aspirante.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPlantillaPersonalizada(MENSAJE_PASO_A_PASO_BASE)}
                  className="btn btn-outline-secondary btn-sm rounded-pill"
                >
                  <i className="bi bi-arrow-counterclockwise me-1"></i>Restablecer
                </button>
              </div>

              <textarea
                rows={18}
                className="form-control font-monospace text-dark"
                style={{ fontSize: '13px', lineHeight: '1.6' }}
                value={plantillaPersonalizada}
                onChange={(e) => setPlantillaPersonalizada(e.target.value)}
              ></textarea>

              <div className="mt-3 pt-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div className="d-flex gap-1.5 flex-wrap">
                  <span className="badge bg-light text-dark border px-2 py-1 extra-small hover-mano" onClick={() => setPlantillaPersonalizada(p => p + ' {REPRESENTANTE}')}>{'{REPRESENTANTE}'}</span>
                  <span className="badge bg-light text-dark border px-2 py-1 extra-small hover-mano" onClick={() => setPlantillaPersonalizada(p => p + ' {ESTUDIANTE}')}>{'{ESTUDIANTE}'}</span>
                  <span className="badge bg-light text-dark border px-2 py-1 extra-small hover-mano" onClick={() => setPlantillaPersonalizada(p => p + ' {CEDULA_REP}')}>{'{CEDULA_REP}'}</span>
                  <span className="badge bg-light text-dark border px-2 py-1 extra-small hover-mano" onClick={() => setPlantillaPersonalizada(p => p + ' {GRADO}')}>{'{GRADO}'}</span>
                  <span className="badge bg-light text-dark border px-2 py-1 extra-small hover-mano" onClick={() => setPlantillaPersonalizada(p => p + ' {ESCUELA}')}>{'{ESCUELA}'}</span>
                  <span className="badge bg-light text-dark border px-2 py-1 extra-small hover-mano" onClick={() => setPlantillaPersonalizada(p => p + ' {CODIGO}')}>{'{CODIGO}'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPestañaActiva('despachador');
                    if (Swal) Swal.fire('Guardado', 'Plantilla actualizada para la difusión en vivo.', 'success');
                  }}
                  className="btn btn-success rounded-pill px-4 py-1.5 fw-bold shadow-sm"
                >
                  <i className="bi bi-check-lg me-1"></i>Aplicar al Despachador
                </button>
              </div>
            </div>
          </div>

          {/* SIMULADOR DE BURBUJA DE WHATSAPP EN TIEMPO REAL */}
          <div className="col-12 col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 p-4 text-white" style={{ backgroundColor: '#0B141A' }}>
              <div className="d-flex align-items-center gap-3 pb-3 mb-3 border-bottom border-secondary">
                <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                  <i className="bi bi-shield-check fs-5"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-0 text-white">Comité de Admisiones</h6>
                  <small className="text-success extra-small">En línea &bull; Verificación SIGAE</small>
                </div>
              </div>

              {/* Burbuja Verde de WhatsApp */}
              <div 
                className="p-3 rounded-4 shadow-sm text-dark position-relative"
                style={{ 
                  backgroundColor: '#E7FFDB',
                  borderRadius: '16px 16px 4px 16px',
                  fontSize: '12.5px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-line'
                }}
              >
                {generarMensajeAntiSpam(
                  aspirantes[0] || {
                    id: 1,
                    codigo_unico: 'CR-LB-2026-0812',
                    codigo_escuela: escuelaFiltro === 'lb' ? 'lb' : 'sb',
                    estado: 'Aprobado',
                    representante_nombres: 'María Elena',
                    representante_apellidos: 'Rojas Silva',
                    representante_cedula: '17854210',
                    estudiante_nombres: 'Gabriel Andrés',
                    estudiante_apellidos: 'Mendoza Rojas',
                    grado_solicitado: '1er Año de Educación Media General'
                  },
                  0
                )}
                <div className="text-end text-muted mt-1" style={{ fontSize: '10px' }}>
                  10:30 AM <i className="bi bi-check2-all text-primary ms-1"></i>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary text-center">
                <small className="text-muted extra-small d-block">
                  <i className="bi bi-info-circle me-1 text-info"></i>
                  La simulación muestra cómo verá el representante el mensaje en su teléfono, con los enlaces web directos y el formato en negrita.
                </small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          PESTAÑA 3: FLYER GRÁFICO INSTITUCIONAL & DESCARGA PNG
         ══════════════════════════════════════════════════════════════════ */}
      {pestañaActiva === 'flyer' && (
        <div className="row g-4 justify-content-center">
          <div className="col-12 text-center mb-2">
            <button
              type="button"
              onClick={descargarFlyerPNG}
              disabled={descargandoFlyer}
              className="btn btn-success btn-lg rounded-pill px-5 py-2.5 fw-bold shadow-sm d-inline-flex align-items-center gap-2 hover-efecto"
            >
              {descargandoFlyer ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  <span>Generando Imagen HD...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-image-fill fs-5"></i>
                  <span>Descargar Flyer en Imagen PNG Alta Calidad</span>
                </>
              )}
            </button>
            <p className="text-muted small mt-2 mb-0">
              Ideal para compartir en grupos de WhatsApp, estados institucionales o imprimir en cartelera escolar.
            </p>
          </div>

          {/* LIENZO MEMBRETADO DEL COMUNICADO */}
          <div className="col-12 col-xl-9">
            <div 
              ref={flyerRef}
              className="card border-0 shadow-lg rounded-4 p-4 p-md-5 bg-white mx-auto position-relative overflow-hidden"
              style={{ 
                maxWidth: '850px',
                borderTop: `8px solid ${escuelaFiltro === 'lb' ? '#2563eb' : '#16a34a'}`
              }}
            >
              {/* Encabezado Oficial */}
              <div className="d-flex align-items-center justify-content-between border-bottom pb-4 mb-4 gap-3">
                <div className="d-flex align-items-center gap-3">
                  <img src={logoEscuela} alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                  <div>
                    <span className="small fw-bold text-muted text-uppercase d-block" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                      República Bolivariana de Venezuela &bull; MPPE
                    </span>
                    <h5 className="fw-bolder text-dark mb-0" style={{ color: escuelaFiltro === 'lb' ? '#1d4ed8' : '#15803d' }}>
                      {escuelaNombreActiva.toUpperCase()}
                    </h5>
                    <small className="text-muted" style={{ fontSize: '0.78rem' }}>
                      {escuelaFiltro === 'lb' ? 'Miraflores, estado Monagas' : 'El Tejero, estado Monagas'} &bull; SIGAE Oficial
                    </small>
                  </div>
                </div>
                <div className="text-end">
                  <span className="badge rounded-pill bg-dark text-white px-3 py-1.5 fw-bold" style={{ fontSize: '0.8rem' }}>
                    Año Escolar 2026 - 2027
                  </span>
                </div>
              </div>

              {/* Título Central */}
              <div className="text-center my-3">
                <h3 className="fw-bolder text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>
                  Orientaciones Generales & Guía Paso a Paso
                </h3>
                <span className="badge rounded-pill bg-success-subtle text-success-emphasis border border-success-subtle px-3 py-1 fw-bold">
                  Proceso Oficial de Admisión, Actualización y Formalización
                </span>
              </div>

              {/* Cuerpo del Comunicado */}
              <div className="p-4 rounded-4 bg-light my-3 border" style={{ fontSize: '13.5px', lineHeight: '1.75', whiteSpace: 'pre-line' }}>
                {generarMensajeAntiSpam(
                  aspirantes[0] || {
                    id: 1,
                    codigo_unico: 'CR-OFICIAL-2026',
                    codigo_escuela: escuelaFiltro === 'lb' ? 'lb' : 'sb',
                    estado: 'Aprobado',
                    representante_nombres: 'Estimado(a) Padre, Madre o',
                    representante_apellidos: 'Representante',
                    representante_cedula: '________',
                    estudiante_nombres: 'Aspirante',
                    estudiante_apellidos: 'Admitido',
                    grado_solicitado: 'Nivel Asignado'
                  },
                  0
                )}
              </div>

              {/* Pie de Firma */}
              <div className="pt-4 border-top text-center mt-3">
                <div className="border-bottom border-dark mb-2 mx-auto" style={{ width: '220px' }}></div>
                <h6 className="fw-bold mb-0 text-dark">
                  {escuelaFiltro === 'lb' ? 'Prof. José Vicente Millán Montaño' : 'Profa. Elika Dayana Chaviel Rondón'}
                </h6>
                <small className="text-muted d-block" style={{ fontSize: '0.8rem' }}>
                  {escuelaFiltro === 'lb' ? 'Director de la Unidad Educativa Libertador Bolívar' : 'Directora de la Unidad Educativa Santa Bárbara'}
                </small>
                <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                  Sistema Integral de Gestión y Administración Escolar &bull; Documento Institucional Certificado
                </small>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrientacionesNuevosIngresos;
