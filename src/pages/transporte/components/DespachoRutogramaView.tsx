import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabase';

declare const Swal: any;

interface DespachoRutogramaViewProps {
  onBack: () => void;
  rutas: any[];
  paradas: any[];
  docentes: any[];
  escCodigo: 'sb' | 'lb';
  cargarTodo: (silencioso?: boolean) => Promise<void>;
  getIdsWithEscuela: (ruta: any, sentido: 'Casa - Escuela' | 'Escuela - Casa') => string[];
  getParadasWithEscuela: (pids: string[]) => any[];
}

export const DespachoRutogramaView: React.FC<DespachoRutogramaViewProps> = ({
  onBack,
  rutas,
  paradas,
  docentes,
  escCodigo,
  cargarTodo,
  getIdsWithEscuela,
  getParadasWithEscuela
}) => {
  // Lista local editable de rutas
  const [localRutas, setLocalRutas] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modoCompacto, setModoCompacto] = useState<boolean>(false);

  // Tipo de Rutograma: Activas vs Inactivas (Colectivo)
  const [tipoRutograma, setTipoRutograma] = useState<'activas' | 'inactivas'>('activas');

  // Destinatario del mensaje: Estudiantes/Familias vs Docentes/Personal
  const [tipoDestinatario, setTipoDestinatario] = useState<'estudiantes' | 'docentes'>('estudiantes');

  // Estados de texto para cada una de las 4 combinaciones posibles
  const [msgActivasEst, setMsgActivasEst] = useState<string>('');
  const [msgActivasDoc, setMsgActivasDoc] = useState<string>('');
  const [msgInactivasEst, setMsgInactivasEst] = useState<string>('');
  const [msgInactivasDoc, setMsgInactivasDoc] = useState<string>('');

  const [editActivasEst, setEditActivasEst] = useState<boolean>(false);
  const [editActivasDoc, setEditActivasDoc] = useState<boolean>(false);
  const [editInactivasEst, setEditInactivasEst] = useState<boolean>(false);
  const [editInactivasDoc, setEditInactivasDoc] = useState<boolean>(false);

  // Modal de Contingencia individual para una sola ruta
  const [modalContingencia, setModalContingencia] = useState<any | null>(null);
  const [mensajeContingencia, setMensajeContingencia] = useState<string>('');

  const nombreEscuela = escCodigo === 'sb' ? 'Unidad Educativa Santa Bárbara' : 'Unidad Educativa Libertador Bolívar';

  // Inicializar rutas locales
  useEffect(() => {
    const ordenadas = [...rutas].sort((a, b) => {
      const numA = (a.nombre || '').match(/\d+/);
      const numB = (b.nombre || '').match(/\d+/);
      const valA = numA ? parseInt(numA[0], 10) : 9999;
      const valB = numB ? parseInt(numB[0], 10) : 9999;
      return valA - valB;
    });

    const enriquecidas = ordenadas.map(r => {
      const doc = docentes.find(d => d.id_usuario === r.docente_id);
      const telDoc = r.docente_telefono || (doc ? doc.telefono : '') || '';
      const motivo = r.motivo_inactivo || (r.sectores && typeof r.sectores === 'string' && !r.sectores.startsWith('[') ? r.sectores : '') || '';

      return {
        ...r,
        docente_telefono: telDoc,
        motivo_inactivo: motivo
      };
    });

    setLocalRutas(enriquecidas);
    // Inicializar vacío para que el mensaje de las activas esté oculto hasta que se seleccione alguna ruta/parada activa
    setSelectedIds([]);
  }, [rutas, docentes]);

  // Actualizar campo de una ruta local
  const handleRutaFieldChange = (id: string, field: string, value: any) => {
    setLocalRutas(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      
      // Si cambia el docente_id, sugerir su teléfono si no tiene uno
      if (field === 'docente_id') {
        const foundDoc = docentes.find(d => d.id_usuario === value);
        if (foundDoc && foundDoc.telefono) {
          updated.docente_telefono = foundDoc.telefono;
        }
      }
      return updated;
    }));
    setEditActivasEst(false);
    setEditActivasDoc(false);
    setEditInactivasEst(false);
    setEditInactivasDoc(false);
  };

  const [guardandoTodo, setGuardandoTodo] = useState(false);

  // Guardar todos los cambios de todas las rutas en Supabase de una sola vez
  const guardarTodosLosCambios = async () => {
    setGuardandoTodo(true);
    try {
      const updates = localRutas.map(async (ruta) => {
        const payload: any = {
          chofer_nombre: ruta.chofer_nombre || null,
          docente_id: ruta.docente_id || null,
          activo: ruta.activo !== false,
          sectores: ruta.motivo_inactivo || null
        };

        if (ruta.docente_telefono !== undefined) {
          payload.docente_telefono = ruta.docente_telefono || null;
        }
        if (ruta.motivo_inactivo !== undefined) {
          payload.motivo_inactivo = ruta.motivo_inactivo || null;
        }

        const { error } = await supabase
          .from('transporte_rutas')
          .update(payload)
          .eq('id', ruta.id);

        if (error) {
          if (error.message?.includes('column') || error.code === '42703') {
            delete payload.docente_telefono;
            delete payload.motivo_inactivo;
            const { error: retryErr } = await supabase
              .from('transporte_rutas')
              .update(payload)
              .eq('id', ruta.id);
            if (retryErr) throw retryErr;
          } else {
            throw error;
          }
        }
      });

      await Promise.all(updates);
      await cargarTodo(true);

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Todos los cambios fueron guardados exitosamente 🎉',
        showConfirmButton: false,
        timer: 2500
      });
    } catch (err: any) {
      console.error("Error al guardar todos los cambios:", err);
      Swal.fire('Error', 'No se pudieron guardar los cambios: ' + (err.message || ''), 'error');
    } finally {
      setGuardandoTodo(false);
    }
  };

  // Rutas activas e inactivas seleccionadas
  const activasSeleccionadas = useMemo(() => {
    return localRutas.filter(r => selectedIds.includes(r.id) && r.activo !== false);
  }, [localRutas, selectedIds]);

  const inactivasSeleccionadas = useMemo(() => {
    return localRutas.filter(r => selectedIds.includes(r.id) && r.activo === false);
  }, [localRutas, selectedIds]);

  // Alternar selección de ruta para el rutograma
  const toggleSelectRuta = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setEditActivasEst(false);
    setEditActivasDoc(false);
    setEditInactivasEst(false);
    setEditInactivasDoc(false);
  };

  const selectTodas = () => {
    setSelectedIds(localRutas.map(r => r.id));
    setEditActivasEst(false);
    setEditActivasDoc(false);
    setEditInactivasEst(false);
    setEditInactivasDoc(false);
  };

  const selectSoloActivas = () => {
    setSelectedIds(localRutas.filter(r => r.activo !== false).map(r => r.id));
    setTipoRutograma('activas');
    setEditActivasEst(false);
    setEditActivasDoc(false);
  };

  const selectSoloInactivas = () => {
    setSelectedIds(localRutas.filter(r => r.activo === false).map(r => r.id));
    setTipoRutograma('inactivas');
    setEditInactivasEst(false);
    setEditInactivasDoc(false);
  };

  const deseleccionarTodas = () => {
    setSelectedIds([]);
    setEditActivasEst(false);
    setEditActivasDoc(false);
    setEditInactivasEst(false);
    setEditInactivasDoc(false);
  };

  // Fecha con formato amigable en español
  const fechaHoyFormateada = useMemo(() => {
    const f = new Date().toLocaleDateString('es-VE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    return f.charAt(0).toUpperCase() + f.slice(1);
  }, []);

  // ── GENERADOR 1: RUTAS ACTIVAS PARA ESTUDIANTES Y FAMILIAS ──
  const plantillaActivasEstudiantes = useMemo(() => {
    if (activasSeleccionadas.length === 0) return '';

    let texto = `🚍 *RUTOGRAMA OFICIAL DE TRANSPORTE ESCOLAR*\n`;
    texto += `🏫 *${nombreEscuela}*\n`;
    texto += `📅 *Fecha:* ${fechaHoyFormateada}\n`;
    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    texto += `✅ *UNIDADES OPERATIVAS EN SERVICIO (${activasSeleccionadas.length})*\n\n`;

    activasSeleccionadas.forEach((r) => {
      const doc = docentes.find(d => d.id_usuario === r.docente_id);
      const nombreDoc = doc ? doc.nombre_completo : 'Sin Asignar';
      const telDoc = r.docente_telefono || (doc ? doc.telefono : '');
      const pids = getIdsWithEscuela(r, 'Casa - Escuela');
      const listaParadas = getParadasWithEscuela(pids);

      texto += `🚍 *${r.nombre.toUpperCase()}*\n`;
      texto += `👨‍✈️ *Chofer:* ${r.chofer_nombre || 'Sin Asignar'}\n`;
      texto += `👩‍🏫 *Docente de Guardia:* ${nombreDoc}${telDoc ? ` 📱 (${telDoc})` : ''}\n`;

      if (modoCompacto) {
        const paradasTxt = listaParadas.map(p => p.nombre_parada).join(' ➔ ');
        texto += `📍 *Paradas:* ${paradasTxt}\n`;
      } else {
        texto += `📍 *Recorrido de Paradas:*\n`;
        listaParadas.forEach((p, pIdx) => {
          texto += `   ${pIdx + 1}. ${p.nombre_parada}${p.descripcion ? ` _(${p.descripcion})_` : ''}\n`;
        });
      }
      texto += `\n`;
    });

    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `📢 *Indicaciones Importantes:*\n`;
    texto += `• Estar en la parada con 10 minutos de anticipación con su uniforme reglamentario.\n`;
    texto += `• Todo estudiante debe portar su carnet escolar visible.\n\n`;
    texto += `*Coordinación General de Transporte Escolar*`;

    return texto;
  }, [activasSeleccionadas, modoCompacto, nombreEscuela, docentes, fechaHoyFormateada, getIdsWithEscuela, getParadasWithEscuela]);

  // ── GENERADOR 2: RUTAS ACTIVAS PARA DOCENTES (ROL DE GUARDIAS) ──
  const plantillaActivasDocentes = useMemo(() => {
    if (activasSeleccionadas.length === 0) return '';

    let texto = `📋 *ROL OFICIAL DE GUARDIAS Y TRANSPORTE ESCOLAR*\n`;
    texto += `🏫 *${nombreEscuela}*\n`;
    texto += `📅 *Fecha:* ${fechaHoyFormateada}\n`;
    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    texto += `Estimados(as) docentes, a continuación se detalla la programación de guardias de acompañamiento en las rutas escolares operativas para la jornada de hoy:\n\n`;
    texto += `🚍 *DISTRIBUCIÓN DE GUARDIAS ACTIVAS (${activasSeleccionadas.length})*\n\n`;

    activasSeleccionadas.forEach((r, idx) => {
      const doc = docentes.find(d => d.id_usuario === r.docente_id);
      const nombreDoc = doc ? doc.nombre_completo : '⚠️ PENDIENTE POR ASIGNAR';
      const telDoc = r.docente_telefono || (doc ? doc.telefono : '');
      const pids = getIdsWithEscuela(r, 'Casa - Escuela');
      const listaParadas = getParadasWithEscuela(pids);

      texto += `*${idx + 1}. ${r.nombre.toUpperCase()}*\n`;
      texto += `👩‍🏫 *Docente de Guardia:* ${nombreDoc}\n`;
      texto += `📱 *Teléfono Docente:* ${telDoc || 'No registrado'}\n`;
      texto += `👨‍✈️ *Chofer Responsable:* ${r.chofer_nombre || 'Sin asignar'}\n`;

      if (modoCompacto) {
        const paradasTxt = listaParadas.map(p => p.nombre_parada).join(' ➔ ');
        texto += `📍 *Recorrido:* ${paradasTxt}\n`;
      } else {
        texto += `📍 *Paradas:* ${listaParadas.map(p => p.nombre_parada).join(' • ')}\n`;
      }
      texto += `\n`;
    });

    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `📌 *CONSIGNAS PARA EL PERSONAL DOCENTE DE GUARDIA:*\n`;
    texto += `1. Presentarse con el chofer de la unidad 15 minutos antes de la hora de salida de la ruta.\n`;
    texto += `2. Realizar el chequeo de estudiantes en cada parada y verificar el uso obligatorio del carnet escolar.\n`;
    texto += `3. Velar por la disciplina, seguridad y respeto dentro del autobús durante todo el trayecto.\n`;
    texto += `4. Reportar inmediatamente al grupo o a la Coordinación cualquier eventualidad o retraso.\n`;
    texto += `5. Permanecer en la unidad hasta que descienda el último estudiante.\n\n`;
    texto += `¡Agradecemos su vocación y compromiso con la seguridad de nuestros estudiantes!\n\n`;
    texto += `*Coordinación de Transporte y Dirección Institucional*`;

    return texto;
  }, [activasSeleccionadas, modoCompacto, nombreEscuela, docentes, fechaHoyFormateada, getIdsWithEscuela, getParadasWithEscuela]);

  // ── GENERADOR 3: RUTOGRAMA DE RUTAS INACTIVAS PARA ESTUDIANTES Y FAMILIAS ──
  const plantillaInactivasEstudiantes = useMemo(() => {
    if (inactivasSeleccionadas.length === 0) return '';

    let texto = `🚨 *COMUNICADO OFICIAL: NOVEDADES EN RUTAS DE TRANSPORTE* 🚨\n`;
    texto += `🏫 *${nombreEscuela}*\n`;
    texto += `📅 *Fecha:* ${fechaHoyFormateada}\n`;
    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    texto += `Informamos con urgencia a los padres, madres y representantes sobre las unidades de transporte escolar que **NO PRESTARÁN SERVICIO** en la jornada de hoy:\n\n`;
    texto += `⚠️ *RUTOGRAMA DE UNIDADES INHABILITADAS (${inactivasSeleccionadas.length})*\n\n`;

    inactivasSeleccionadas.forEach((r, idx) => {
      const doc = docentes.find(d => d.id_usuario === r.docente_id);
      const nombreDoc = doc ? doc.nombre_completo : 'Sin Asignar';
      const telDoc = r.docente_telefono || (doc ? doc.telefono : '');
      const motivo = r.motivo_inactivo?.trim() || 'Mantenimiento preventivo / Unidad en revisión técnica';
      const pids = getIdsWithEscuela(r, 'Casa - Escuela');
      const listaParadas = getParadasWithEscuela(pids);

      texto += `🔴 *${idx + 1}. ${r.nombre.toUpperCase()}* - *INHABILITADA*\n`;
      texto += `⚙️ *Condición / Causa:* ${motivo}\n`;
      texto += `👨‍✈️ *Chofer:* ${r.chofer_nombre || 'Sin Asignar'}\n`;
      texto += `👩‍🏫 *Contacto Docente:* ${nombreDoc}${telDoc ? ` 📱 (${telDoc})` : ''}\n`;
      if (listaParadas.length > 0) {
        if (modoCompacto) {
          texto += `📍 *Paradas Afectadas:* ${listaParadas.map(p => p.nombre_parada).join(' ➔ ')}\n`;
        } else {
          texto += `📍 *Paradas Afectadas (Sin Servicio):*\n`;
          listaParadas.forEach((p, pIdx) => {
            texto += `   ${pIdx + 1}. ${p.nombre_parada}\n`;
          });
        }
      }
      texto += `📢 *Medida Requerida:* Se solicita a los representantes de estas paradas tomar las debidas previsiones particulares para el traslado escolar de los estudiantes.\n\n`;
    });

    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `Ofrecemos disculpas por los inconvenientes y nos encontramos trabajando para reestablecer las unidades a la brevedad.\n\n`;
    texto += `*Coordinación General de Transporte Escolar*`;

    return texto;
  }, [inactivasSeleccionadas, modoCompacto, nombreEscuela, docentes, fechaHoyFormateada, getIdsWithEscuela, getParadasWithEscuela]);

  // ── GENERADOR 4: RUTAS INACTIVAS PARA DOCENTES (REPORTES Y GUARDIAS RELEVADAS) ──
  const plantillaInactivasDocentes = useMemo(() => {
    if (inactivasSeleccionadas.length === 0) return '';

    let texto = `📋 *REPORTE OFICIAL: RUTAS INHABILITADAS Y GUARDIAS RELEVADAS*\n`;
    texto += `🏫 *${nombreEscuela}*\n`;
    texto += `📅 *Fecha:* ${fechaHoyFormateada}\n`;
    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    texto += `Estimado personal docente y directivo, se notifica el reporte de unidades inhabilitadas y la situación de las guardias asignadas para la jornada de hoy:\n\n`;
    texto += `⚠️ *RUTAS INHABILITADAS / GUARDIA SUSPENDIDA (${inactivasSeleccionadas.length})*\n\n`;

    inactivasSeleccionadas.forEach((r, idx) => {
      const doc = docentes.find(d => d.id_usuario === r.docente_id);
      const nombreDoc = doc ? doc.nombre_completo : 'Sin Asignar';
      const motivo = r.motivo_inactivo?.trim() || 'Mantenimiento preventivo / Unidad en revisión técnica';
      const pids = getIdsWithEscuela(r, 'Casa - Escuela');
      const listaParadas = getParadasWithEscuela(pids);

      texto += `*${idx + 1}. ${r.nombre.toUpperCase()}* [INACTIVA]\n`;
      texto += `• *Docente designado(a):* ${nombreDoc} (Relevado/a de ruta por inactividad de unidad)\n`;
      texto += `• *Chofer:* ${r.chofer_nombre || 'Sin asignar'}\n`;
      texto += `• *Causa de la suspensión:* ${motivo}\n`;
      if (listaParadas.length > 0) {
        texto += `• *Paradas sin cobertura:* ${listaParadas.map(p => p.nombre_parada).join(' • ')}\n`;
      }
      texto += `\n`;
    });

    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `📌 *INSTRUCCIONES PARA DOCENTES RELEVADOS:*\n`;
    texto += `Los docentes asignados a estas rutas apoyarán en las áreas internas del plantel durante las horas de recepción y salida de estudiantes.\n\n`;
    texto += `*Coordinación de Transporte y Dirección Institucional*`;

    return texto;
  }, [inactivasSeleccionadas, modoCompacto, nombreEscuela, docentes, fechaHoyFormateada, getIdsWithEscuela, getParadasWithEscuela]);

  // Sincronizar plantillas generadas con estados editables
  useEffect(() => {
    if (!editActivasEst) setMsgActivasEst(plantillaActivasEstudiantes);
  }, [plantillaActivasEstudiantes, editActivasEst]);

  useEffect(() => {
    if (!editActivasDoc) setMsgActivasDoc(plantillaActivasDocentes);
  }, [plantillaActivasDocentes, editActivasDoc]);

  useEffect(() => {
    if (!editInactivasEst) setMsgInactivasEst(plantillaInactivasEstudiantes);
  }, [plantillaInactivasEstudiantes, editInactivasEst]);

  useEffect(() => {
    if (!editInactivasDoc) setMsgInactivasDoc(plantillaInactivasDocentes);
  }, [plantillaInactivasDocentes, editInactivasDoc]);

  // Mensaje activo actual según combinación seleccionada
  const mensajeActivo = useMemo(() => {
    if (tipoRutograma === 'activas') {
      return tipoDestinatario === 'estudiantes' ? msgActivasEst : msgActivasDoc;
    } else {
      return tipoDestinatario === 'estudiantes' ? msgInactivasEst : msgInactivasDoc;
    }
  }, [tipoRutograma, tipoDestinatario, msgActivasEst, msgActivasDoc, msgInactivasEst, msgInactivasDoc]);

  const editadoActivo = useMemo(() => {
    if (tipoRutograma === 'activas') {
      return tipoDestinatario === 'estudiantes' ? editActivasEst : editActivasDoc;
    } else {
      return tipoDestinatario === 'estudiantes' ? editInactivasEst : editInactivasDoc;
    }
  }, [tipoRutograma, tipoDestinatario, editActivasEst, editActivasDoc, editInactivasEst, editInactivasDoc]);

  const setMensajeActivo = (val: string) => {
    if (tipoRutograma === 'activas') {
      if (tipoDestinatario === 'estudiantes') {
        setMsgActivasEst(val);
        setEditActivasEst(true);
      } else {
        setMsgActivasDoc(val);
        setEditActivasDoc(true);
      }
    } else {
      if (tipoDestinatario === 'estudiantes') {
        setMsgInactivasEst(val);
        setEditInactivasEst(true);
      } else {
        setMsgInactivasDoc(val);
        setEditInactivasDoc(true);
      }
    }
  };

  const restaurarPlantillaActiva = () => {
    if (tipoRutograma === 'activas') {
      if (tipoDestinatario === 'estudiantes') {
        setMsgActivasEst(plantillaActivasEstudiantes);
        setEditActivasEst(false);
      } else {
        setMsgActivasDoc(plantillaActivasDocentes);
        setEditActivasDoc(false);
      }
    } else {
      if (tipoDestinatario === 'estudiantes') {
        setMsgInactivasEst(plantillaInactivasEstudiantes);
        setEditInactivasEst(false);
      } else {
        setMsgInactivasDoc(plantillaInactivasDocentes);
        setEditInactivasDoc(false);
      }
    }
  };

  // Copiar al portapapeles
  const copiarTexto = async (texto: string, titulo = '¡Copiado!') => {
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: titulo,
        showConfirmButton: false,
        timer: 2000
      });
    } catch (e) {
      Swal.fire('Error', 'No se pudo copiar al portapapeles', 'error');
    }
  };

  // Abrir WhatsApp con el texto
  const abrirWhatsApp = (texto: string) => {
    if (!texto) return;
    const encoded = encodeURIComponent(texto);
    const urlApi = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(urlApi, '_blank');
  };

  // Abrir Modal de Contingencia individual para una ruta inhabilitada
  const abrirModalContingencia = (ruta: any) => {
    const doc = docentes.find(d => d.id_usuario === ruta.docente_id);
    const nombreDoc = doc ? doc.nombre_completo : 'Sin Asignar';
    const telDoc = ruta.docente_telefono || (doc ? doc.telefono : '');
    const motivo = ruta.motivo_inactivo?.trim() || 'En revisión mecánica / mantenimiento de emergencia';
    const pids = getIdsWithEscuela(ruta, 'Casa - Escuela');
    const listaParadas = getParadasWithEscuela(pids);

    let msg = `🚨 *COMUNICADO OFICIAL: NOVEDAD EN RUTA DE TRANSPORTE* 🚨\n`;
    msg += `🏫 *${nombreEscuela}*\n`;
    msg += `📅 *Fecha:* ${fechaHoyFormateada}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    msg += `Informamos con urgencia a los representantes de la siguiente ruta escolar:\n\n`;
    msg += `🚍 *Ruta Afectada:* *${ruta.nombre.toUpperCase()}*\n`;
    msg += `🔴 *Estatus Operativo:* *INHABILITADA TEMPORALMENTE*\n`;
    msg += `⚙️ *Condición / Causa:* ${motivo}\n`;
    msg += `👨‍✈️ *Chofer:* ${ruta.chofer_nombre || 'Asignado a la unidad'}\n`;
    msg += `👩‍🏫 *Docente de Guardia:* ${nombreDoc}${telDoc ? ` 📱 (${telDoc})` : ''}\n\n`;
    if (listaParadas.length > 0) {
      msg += `📍 *Paradas que NO tendrán servicio en esta jornada:*\n`;
      listaParadas.forEach((p, idx) => {
        msg += `   ${idx + 1}. ${p.nombre_parada}\n`;
      });
      msg += `\n`;
    }
    msg += `📢 *Medida requerida:* Se solicita cordialmente a los padres y representantes de estas paradas coordinar el traslado particular de los estudiantes para la entrada y salida.\n\n`;
    msg += `Ofrecemos disculpas por los inconvenientes y nos encontramos trabajando para reestablecer la unidad a la brevedad.\n\n`;
    msg += `Atentamente,\n*Coordinación de Transporte Escolar*`;

    setMensajeContingencia(msg);
    setModalContingencia(ruta);
  };

  // Cálculo del tamaño para 1 solo mensaje de WhatsApp
  const numCaracteres = mensajeActivo.length;
  const esIdealUnMensaje = numCaracteres <= 2800;
  const progresoTamano = Math.min(100, Math.round((numCaracteres / 3500) * 100));

  // Determinar si el mensaje de la pestaña actual debe mostrarse o está oculto
  const haySeleccionValida = tipoRutograma === 'activas' 
    ? activasSeleccionadas.length > 0 
    : inactivasSeleccionadas.length > 0;

  return (
    <div className="animate__animated animate__fadeIn pb-5">
      {/* ── BARRA DE CABECERA Y RETORNO ── */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2.5">
          <button
            onClick={onBack}
            className="btn btn-sm btn-white bg-white border rounded-pill px-3 py-1.5 fw-bold text-dark shadow-xs hover-efecto d-flex align-items-center gap-1.5"
            style={{ fontSize: '0.85rem' }}
          >
            <i className="bi bi-arrow-left text-primary"></i>
            <span>Volver al Dashboard</span>
          </button>

          <div>
            <h4 className="fw-bolder mb-0 text-dark d-flex align-items-center gap-2">
              <span className="p-1.5 rounded-3 bg-success text-white d-inline-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                <i className="bi bi-whatsapp"></i>
              </span>
              <span>Despacho Diario & Rutogramas WhatsApp</span>
            </h4>
            <small className="text-muted">
              {nombreEscuela} • Rutograma de Unidades Operativas y Rutograma Colectivo de Unidades Inactivas.
            </small>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-white text-dark border px-3 py-2 rounded-pill fw-bold shadow-xs">
            <i className="bi bi-calendar3 me-1.5 text-primary"></i>
            {new Date().toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>

      {/* ── PASOS 1 Y 2: PANEL DE ASIGNACIÓN Y ESTATUS DE UNIDADES ── */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
        <div className="card-header bg-white p-3 p-md-4 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <div className="badge rounded-pill bg-primary-subtle text-primary fw-bold px-2.5 py-1 mb-1">
              Pasos 1 y 2 • Asignación y Estatus
            </div>
            <h5 className="fw-bold mb-0 text-dark">Asignación de Personal y Estatus de las Unidades</h5>
            <small className="text-muted">
              Asigna chofer, docente de guardia con teléfono y activa/inhabilita según la condición mecánica.
            </small>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              onClick={selectTodas}
              className="btn btn-xs btn-outline-secondary rounded-pill px-2.5 py-1 fw-bold"
              style={{ fontSize: '0.75rem' }}
            >
              Seleccionar Todas ({localRutas.length})
            </button>
            <button
              onClick={selectSoloActivas}
              className="btn btn-xs btn-outline-success rounded-pill px-2.5 py-1 fw-bold"
              style={{ fontSize: '0.75rem' }}
            >
              Solo Activas ({localRutas.filter(r => r.activo !== false).length})
            </button>
            <button
              onClick={selectSoloInactivas}
              className="btn btn-xs btn-outline-danger rounded-pill px-2.5 py-1 fw-bold"
              style={{ fontSize: '0.75rem' }}
            >
              Solo Inactivas ({localRutas.filter(r => r.activo === false).length})
            </button>
            <button
              onClick={deseleccionarTodas}
              className="btn btn-xs btn-outline-secondary rounded-pill px-2.5 py-1 fw-bold"
              style={{ fontSize: '0.75rem' }}
            >
              Limpiar
            </button>

            <button
              type="button"
              onClick={guardarTodosLosCambios}
              disabled={guardandoTodo}
              className="btn btn-sm btn-primary rounded-pill px-3.5 py-1.5 fw-bold shadow-sm d-flex align-items-center gap-1.5 ms-md-2"
              style={{ fontSize: '0.82rem' }}
            >
              {guardandoTodo ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-floppy-fill"></i>
                  <span>Guardar todos los cambios</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ minWidth: '850px' }}>
              <thead className="bg-light text-muted small fw-bold">
                <tr>
                  <th style={{ width: '50px' }} className="text-center">Incluir</th>
                  <th style={{ width: '190px' }}>Ruta Escolar</th>
                  <th style={{ width: '190px' }}>Chofer de Unidad</th>
                  <th style={{ width: '230px' }}>Docente de Guardia</th>
                  <th style={{ width: '160px' }}>Teléfono Docente</th>
                  <th style={{ width: '270px' }}>Estatus / Condición Unidad</th>
                </tr>
              </thead>
              <tbody>
                {localRutas.map((ruta) => {
                  const isSelected = selectedIds.includes(ruta.id);
                  const isActiva = ruta.activo !== false;

                  return (
                    <tr 
                      key={ruta.id} 
                      className={!isActiva ? 'table-danger-subtle' : (isSelected ? 'table-light' : '')}
                    >
                      {/* Checkbox de Inclusión en Rutograma */}
                      <td className="text-center">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }}
                          checked={isSelected}
                          onChange={() => toggleSelectRuta(ruta.id)}
                          title="Marcar para incluir en el rutograma oficial"
                        />
                      </td>

                      {/* Nombre de la Ruta */}
                      <td>
                        <div className="fw-bold text-dark d-flex align-items-center gap-1.5" style={{ fontSize: '0.9rem' }}>
                          <i className={`bi ${isActiva ? 'bi-bus-front text-primary' : 'bi-exclamation-triangle-fill text-danger'}`}></i>
                          <span>{ruta.nombre}</span>
                        </div>
                        <span className="badge rounded-pill bg-light text-secondary border mt-0.5" style={{ fontSize: '0.68rem' }}>
                          {Array.isArray(ruta.paradas_json) ? ruta.paradas_json.length : 0} paradas
                        </span>
                      </td>

                      {/* Chofer */}
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm rounded-3 bg-white"
                          placeholder="Nombre del chofer"
                          value={ruta.chofer_nombre || ''}
                          onChange={(e) => handleRutaFieldChange(ruta.id, 'chofer_nombre', e.target.value)}
                          style={{ fontSize: '0.82rem' }}
                        />
                      </td>

                      {/* Docente de Guardia */}
                      <td>
                        <select
                          className="form-select form-select-sm rounded-3 bg-white"
                          value={ruta.docente_id || ''}
                          onChange={(e) => handleRutaFieldChange(ruta.id, 'docente_id', e.target.value)}
                          style={{ fontSize: '0.82rem' }}
                        >
                          <option value="">-- Sin Docente --</option>
                          {docentes.map(d => (
                            <option key={d.id_usuario} value={d.id_usuario}>
                              {d.nombre_completo}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Teléfono del Docente */}
                      <td>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text bg-light text-muted border-end-0">
                            <i className="bi bi-telephone-fill" style={{ fontSize: '0.75rem' }}></i>
                          </span>
                          <input
                            type="text"
                            className="form-control form-control-sm rounded-end-3 bg-white border-start-0"
                            placeholder="0414-0000000"
                            value={ruta.docente_telefono || ''}
                            onChange={(e) => handleRutaFieldChange(ruta.id, 'docente_telefono', e.target.value)}
                            style={{ fontSize: '0.82rem' }}
                          />
                        </div>
                      </td>

                      {/* Estatus y Condición de Inhabilitación */}
                      <td>
                        <div className="d-flex flex-column gap-1.5">
                          {/* Botones Activa / Inactiva */}
                          <div className="btn-group btn-group-sm w-100 p-0.5 bg-white border rounded-pill shadow-xs">
                            <button
                              type="button"
                              className={`btn btn-xs rounded-pill fw-bold ${isActiva ? 'btn-success text-white shadow-xs' : 'btn-light text-muted border-0'}`}
                              style={{ fontSize: '0.75rem' }}
                              onClick={() => handleRutaFieldChange(ruta.id, 'activo', true)}
                            >
                              <i className="bi bi-check-circle-fill me-1"></i> Activa
                            </button>
                            <button
                              type="button"
                              className={`btn btn-xs rounded-pill fw-bold ${!isActiva ? 'btn-danger text-white shadow-xs' : 'btn-light text-muted border-0'}`}
                              style={{ fontSize: '0.75rem' }}
                              onClick={() => handleRutaFieldChange(ruta.id, 'activo', false)}
                            >
                              <i className="bi bi-exclamation-triangle-fill me-1"></i> Inactiva
                            </button>
                          </div>

                          {/* Campo de Motivo/Condición si está inactiva */}
                          {!isActiva && (
                            <div className="animate__animated animate__fadeIn">
                              <input
                                type="text"
                                className="form-control form-control-sm rounded-3 border-danger bg-white"
                                placeholder="Causa: Falla mecánica, caucho, etc."
                                value={ruta.motivo_inactivo || ''}
                                onChange={(e) => handleRutaFieldChange(ruta.id, 'motivo_inactivo', e.target.value)}
                                style={{ fontSize: '0.78rem' }}
                              />
                              <div className="d-flex justify-content-between align-items-center mt-1">
                                <span className="badge bg-danger-subtle text-danger" style={{ fontSize: '0.65rem' }}>
                                  Inhabilitada
                                </span>
                                <button
                                  type="button"
                                  onClick={() => abrirModalContingencia(ruta)}
                                  className="btn btn-xs btn-outline-danger rounded-pill px-2 py-0 fw-bold d-flex align-items-center gap-1"
                                  style={{ fontSize: '0.68rem' }}
                                  title="Enviar aviso individual a los representantes de esta ruta"
                                >
                                  <i className="bi bi-whatsapp"></i>
                                  <span>Aviso Individual</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pie de tabla con botón único Guardar todos los cambios */}
          <div className="card-footer bg-white p-3 border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="text-muted small d-flex align-items-center gap-1.5">
              <i className="bi bi-info-circle-fill text-primary"></i>
              <span>Modifica choferes, docentes de guardia y estatus de las unidades y guarda todo con un solo clic.</span>
            </div>
            <button
              type="button"
              onClick={guardarTodosLosCambios}
              disabled={guardandoTodo}
              className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2"
              style={{ fontSize: '0.86rem' }}
            >
              {guardandoTodo ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  <span>Guardando todos los cambios...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-floppy-fill"></i>
                  <span>Guardar todos los cambios</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── SELECTOR PRINCIPAL: TIPO DE RUTOGRAMA & DESTINATARIO ── */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3 p-md-4">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            {/* 1. Selector de Tipo de Rutograma (Activas vs Inactivas) */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="fw-bold small text-muted text-uppercase" style={{ letterSpacing: '0.5px' }}>
                Rutograma:
              </span>
              <div className="btn-group p-1 bg-light rounded-pill border shadow-xs">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill fw-bold transition-all d-flex align-items-center gap-2 ${tipoRutograma === 'activas' ? 'btn-success text-white shadow-xs' : 'btn-light text-muted border-0'}`}
                  style={{ fontSize: '0.84rem' }}
                  onClick={() => setTipoRutograma('activas')}
                >
                  <i className="bi bi-check-circle-fill"></i>
                  <span>1. Rutas Activas</span>
                  <span className={`badge rounded-pill ${tipoRutograma === 'activas' ? 'bg-white text-success' : 'bg-success text-white'} px-2 py-0.5`} style={{ fontSize: '0.72rem' }}>
                    {activasSeleccionadas.length}
                  </span>
                </button>

                <button
                  type="button"
                  className={`btn btn-sm rounded-pill fw-bold transition-all d-flex align-items-center gap-2 ${tipoRutograma === 'inactivas' ? 'btn-danger text-white shadow-xs' : 'btn-light text-muted border-0'}`}
                  style={{ fontSize: '0.84rem' }}
                  onClick={() => setTipoRutograma('inactivas')}
                >
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span>2. Rutas Inactivas (Novedades)</span>
                  <span className={`badge rounded-pill ${tipoRutograma === 'inactivas' ? 'bg-white text-danger' : 'bg-danger text-white'} px-2 py-0.5`} style={{ fontSize: '0.72rem' }}>
                    {inactivasSeleccionadas.length}
                  </span>
                </button>
              </div>
            </div>

            {/* 2. Selector de Destinatario (Familias vs Docentes) */}
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="fw-bold small text-muted text-uppercase" style={{ letterSpacing: '0.5px' }}>
                Destinatarios:
              </span>
              <div className="btn-group p-1 bg-light rounded-pill border shadow-xs">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill fw-bold transition-all d-flex align-items-center gap-1.5 ${tipoDestinatario === 'estudiantes' ? 'btn-primary text-white shadow-xs' : 'btn-light text-muted border-0'}`}
                  style={{ fontSize: '0.84rem' }}
                  onClick={() => setTipoDestinatario('estudiantes')}
                >
                  <i className="bi bi-people-fill"></i>
                  <span>Estudiantes y Familias</span>
                </button>

                <button
                  type="button"
                  className={`btn btn-sm rounded-pill fw-bold transition-all d-flex align-items-center gap-1.5 ${tipoDestinatario === 'docentes' ? 'btn-primary text-white shadow-xs' : 'btn-light text-muted border-0'}`}
                  style={{ fontSize: '0.84rem' }}
                  onClick={() => setTipoDestinatario('docentes')}
                >
                  <i className="bi bi-person-badge-fill"></i>
                  <span>Docentes (Rol de Guardias)</span>
                </button>
              </div>
            </div>

            {/* 3. Acciones de Formato */}
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setModoCompacto(!modoCompacto);
                  setEditActivasEst(false);
                  setEditActivasDoc(false);
                  setEditInactivasEst(false);
                  setEditInactivasDoc(false);
                }}
                className={`btn btn-xs rounded-pill px-3 py-1.5 fw-bold ${modoCompacto ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
                style={{ fontSize: '0.78rem' }}
                title="Alternar entre lista detallada y formato compacto de paradas"
              >
                <i className={`bi ${modoCompacto ? 'bi-card-text' : 'bi-justify'} me-1`}></i>
                {modoCompacto ? 'Modo Detallado' : 'Modo Compacto'}
              </button>

              <button
                type="button"
                onClick={restaurarPlantillaActiva}
                className="btn btn-xs btn-light border rounded-pill px-2.5 py-1.5 fw-bold text-dark"
                style={{ fontSize: '0.78rem' }}
                title="Restaurar la plantilla automática del mensaje actual"
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i>
                Restaurar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── PASOS 3 Y 4: CONDICIONAL DE VISUALIZACIÓN DEL MENSAJE ── */}
      {!haySeleccionValida ? (
        /* Tarjeta cuando el mensaje está oculto por no haber seleccionado rutas de esa categoría */
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white animate__animated animate__fadeIn">
          {tipoRutograma === 'activas' ? (
            <>
              <div 
                className="p-3 rounded-circle bg-success bg-opacity-10 text-success d-inline-flex mx-auto mb-3"
                style={{ width: '70px', height: '70px', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="bi bi-bus-front-fill fs-2"></i>
              </div>
              <h5 className="fw-bolder text-dark mb-2">Mensaje de Rutas Activas Oculto</h5>
              <p className="text-muted small mb-4 mx-auto" style={{ maxWidth: '520px' }}>
                El mensaje para rutas activas permanece oculto hasta que selecciones al menos una <strong>ruta o parada activa</strong> en la tabla de asignación superior.
              </p>
              <div className="d-flex justify-content-center gap-2 flex-wrap">
                <button 
                  type="button" 
                  onClick={selectSoloActivas} 
                  className="btn btn-success rounded-pill px-4 py-2 fw-bold shadow-xs d-flex align-items-center gap-2"
                >
                  <i className="bi bi-check2-all"></i>
                  <span>Seleccionar Rutas Activas ({localRutas.filter(r => r.activo !== false).length})</span>
                </button>
                {localRutas.some(r => r.activo === false) && (
                  <button 
                    type="button" 
                    onClick={() => setTipoRutograma('inactivas')} 
                    className="btn btn-outline-danger rounded-pill px-3.5 py-2 fw-bold d-flex align-items-center gap-2"
                  >
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <span>Ver Rutas Inactivas ({localRutas.filter(r => r.activo === false).length})</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div 
                className="p-3 rounded-circle bg-danger bg-opacity-10 text-danger d-inline-flex mx-auto mb-3"
                style={{ width: '70px', height: '70px', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="bi bi-exclamation-octagon-fill fs-2"></i>
              </div>
              <h5 className="fw-bolder text-dark mb-2">No hay rutas inactivas seleccionadas</h5>
              <p className="text-muted small mb-4 mx-auto" style={{ maxWidth: '520px' }}>
                Para generar el <strong>Rutograma Colectivo de Rutas Inactivas</strong> (comunicado oficial de contingencia con todas las unidades inhabilitadas), marca una o más rutas como inactivas y selecciónalas en la tabla.
              </p>
              <div className="d-flex justify-content-center gap-2 flex-wrap">
                {localRutas.some(r => r.activo === false) ? (
                  <button 
                    type="button" 
                    onClick={selectSoloInactivas} 
                    className="btn btn-danger rounded-pill px-4 py-2 fw-bold shadow-xs d-flex align-items-center gap-2"
                  >
                    <i className="bi bi-check-circle-fill"></i>
                    <span>Seleccionar Rutas Inactivas ({localRutas.filter(r => r.activo === false).length})</span>
                  </button>
                ) : (
                  <span className="badge bg-light text-muted border p-2 rounded-pill small">
                    Todas las unidades de transporte se encuentran actualmente operativas
                  </span>
                )}
                <button 
                  type="button" 
                  onClick={() => setTipoRutograma('activas')} 
                  className="btn btn-outline-success rounded-pill px-3.5 py-2 fw-bold d-flex align-items-center gap-2"
                >
                  <i className="bi bi-bus-front-fill"></i>
                  <span>Volver a Rutas Activas</span>
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Cuadrícula de 2 Columnas: Editor en Vivo y Previsualizador de WhatsApp */
        <div className="row g-4 animate__animated animate__fadeIn">
          {/* Columna Izquierda: Editor de Mensaje */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-header bg-white p-3 p-md-4 border-bottom">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div>
                    <div className={`badge rounded-pill fw-bold px-2.5 py-1 mb-1 ${tipoRutograma === 'activas' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                      {tipoRutograma === 'activas' ? '✅ Rutograma Oficial Operativo' : '🚨 Comunicado Oficial de Contingencia'}
                    </div>
                    <h5 className="fw-bold mb-0 text-dark">
                      {tipoRutograma === 'activas'
                        ? (tipoDestinatario === 'estudiantes' ? 'Rutograma para Familias (Activas)' : 'Rol de Guardias para Docentes (Activas)')
                        : (tipoDestinatario === 'estudiantes' ? 'Aviso Colectivo de Unidades Inactivas (Familias)' : 'Reporte de Rutas Inactivas y Relevos (Docentes)')}
                    </h5>
                    <small className="text-muted">
                      Puedes modificar el texto directamente antes de copiar o enviar por WhatsApp.
                    </small>
                  </div>
                </div>
              </div>

              <div className="card-body p-3 p-md-4 d-flex flex-column">
                {/* Medidor de Longitud y Tamaño de WhatsApp */}
                <div className="p-3 bg-light rounded-3 border mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1.5 flex-wrap gap-1">
                    <span className="fw-bold small text-dark d-flex align-items-center gap-1.5">
                      <i className="bi bi-chat-dots-fill text-success"></i>
                      <span>Estimador de Tamaño para WhatsApp:</span>
                    </span>
                    <span className={`badge rounded-pill fw-bold ${esIdealUnMensaje ? 'bg-success text-white' : 'bg-warning text-dark'}`} style={{ fontSize: '0.75rem' }}>
                      {esIdealUnMensaje ? '✅ 1 Solo Mensaje Óptimo' : '⚠️ Mensaje Extenso'} ({numCaracteres} caracteres)
                    </span>
                  </div>
                  <div className="progress rounded-pill" style={{ height: '8px' }}>
                    <div
                      className={`progress-bar rounded-pill ${esIdealUnMensaje ? 'bg-success' : 'bg-warning'}`}
                      style={{ width: `${progresoTamano}%` }}
                    ></div>
                  </div>
                  <div className="d-flex justify-content-between text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                    <span>0 caracteres</span>
                    <span>Límite cómodo: ~2,800 car.</span>
                  </div>
                </div>

                {/* Área de Texto Editable */}
                <div className="form-group flex-grow-1 mb-3">
                  <label className="form-label fw-bold small text-muted d-flex justify-content-between">
                    <span>Texto del Mensaje de WhatsApp (Editable):</span>
                    {editadoActivo && (
                      <span className="text-warning small fw-bold">
                        <i className="bi bi-pencil-fill me-1"></i>Modificado manualmente
                      </span>
                    )}
                  </label>
                  <textarea
                    className="form-control rounded-3 p-3 font-monospace shadow-xs"
                    rows={14}
                    style={{ fontSize: '0.85rem', lineHeight: '1.5', resize: 'vertical' }}
                    value={mensajeActivo}
                    onChange={(e) => setMensajeActivo(e.target.value)}
                    placeholder="Escribe o personaliza el mensaje de WhatsApp..."
                  ></textarea>
                </div>

                {/* Botones de Envío Rápido */}
                <div className="d-flex align-items-center gap-2 pt-2 border-top flex-wrap">
                  <button
                    type="button"
                    onClick={() => copiarTexto(mensajeActivo, `¡Mensaje copiado con éxito!`)}
                    className="btn btn-outline-dark rounded-pill px-3.5 py-2 fw-bold d-flex align-items-center justify-content-center gap-1.5 shadow-xs flex-grow-1"
                    style={{ fontSize: '0.88rem' }}
                  >
                    <i className="bi bi-clipboard-check text-primary"></i>
                    <span>Copiar Portapapeles</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => abrirWhatsApp(mensajeActivo)}
                    className="btn btn-success rounded-pill px-4 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 shadow flex-grow-1 text-white"
                    style={{ fontSize: '0.88rem', background: '#25D366', borderColor: '#25D366' }}
                  >
                    <i className="bi bi-whatsapp fs-5"></i>
                    <span>Enviar por WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Vista Previa en Vivo estilo WhatsApp */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
              <div 
                className="card-header p-3 border-bottom d-flex align-items-center gap-2" 
                style={{ background: tipoRutograma === 'activas' ? '#075e54' : '#881337', color: '#ffffff' }}
              >
                <div className="rounded-circle bg-white p-1 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                  <i 
                    className={`bi ${tipoRutograma === 'activas' ? 'bi-bus-front-fill text-success' : 'bi-exclamation-triangle-fill text-danger'} fs-5`}
                  ></i>
                </div>
                <div className="min-w-0 flex-grow-1">
                  <div className="fw-bold text-truncate" style={{ fontSize: '0.92rem' }}>
                    {tipoRutograma === 'activas'
                      ? (tipoDestinatario === 'estudiantes' ? `Transporte Institucional • Familias ${escCodigo.toUpperCase()}` : `Coordinación Docente • Rol de Guardias ${escCodigo.toUpperCase()}`)
                      : (tipoDestinatario === 'estudiantes' ? `Aviso de Contingencia • Familias ${escCodigo.toUpperCase()}` : `Reporte Novedades • Docentes ${escCodigo.toUpperCase()}`)}
                  </div>
                  <small className="opacity-75 d-block" style={{ fontSize: '0.72rem' }}>
                    {tipoDestinatario === 'estudiantes' ? 'Canal Oficial de Representantes' : 'Grupo Oficial de Docentes y Personal'} • En línea
                  </small>
                </div>
                <i className="bi bi-whatsapp fs-5 opacity-75"></i>
              </div>

              <div 
                className="card-body p-3 p-md-4 overflow-y-auto"
                style={{ 
                  background: '#efeae2', 
                  backgroundImage: 'radial-gradient(#d1d7db 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                  minHeight: '450px',
                  maxHeight: '620px'
                }}
              >
                {/* Burbuja de Mensaje de WhatsApp */}
                <div 
                  className="p-3 rounded-4 shadow-sm position-relative ms-auto"
                  style={{
                    background: tipoRutograma === 'activas' ? '#d9fdd3' : '#fee2e2',
                    maxWidth: '92%',
                    color: '#111b21',
                    borderRadius: '16px 16px 4px 16px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  <div 
                    style={{ 
                      whiteSpace: 'pre-wrap', 
                      fontSize: '0.84rem', 
                      lineHeight: '1.45',
                      wordBreak: 'break-word',
                      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                  >
                    {mensajeActivo}
                  </div>

                  <div className="d-flex justify-content-end align-items-center gap-1 mt-2 text-muted" style={{ fontSize: '0.7rem' }}>
                    <span>{new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span>
                    <i className="bi bi-check2-all text-primary"></i>
                  </div>
                </div>
              </div>

              <div className="card-footer bg-white p-3 border-top d-flex align-items-center justify-content-between text-muted small">
                <span className="d-flex align-items-center gap-1">
                  <i className="bi bi-info-circle text-primary"></i>
                  <span>
                    Visualizando <strong>{tipoRutograma === 'activas' ? 'Rutograma de Rutas Activas' : 'Rutograma de Rutas Inactivas'}</strong> para <strong>{tipoDestinatario === 'estudiantes' ? 'Familias' : 'Docentes'}</strong>.
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL INDIVIDUAL: COMUNICADO DE CONTINGENCIA / INHABILITACIÓN ── */}
      {modalContingencia && (
        <div className="modal-backdrop-custom show">
          <div className="modal-custom shadow-lg" style={{ maxWidth: '640px' }}>
            <div className="modal-header border-bottom bg-danger text-white p-3">
              <div className="d-flex align-items-center gap-2">
                <span className="rounded-circle bg-white text-danger d-inline-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                  <i className="bi bi-exclamation-triangle-fill"></i>
                </span>
                <h5 className="modal-title fw-bold mb-0" style={{ fontSize: '1.1rem' }}>
                  Comunicado de Contingencia: {modalContingencia.nombre}
                </h5>
              </div>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                onClick={() => setModalContingencia(null)}
              ></button>
            </div>

            <div className="modal-body p-4">
              <div className="alert alert-warning py-2 px-3 small border-0 rounded-3 mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-info-circle-fill text-warning fs-5"></i>
                <div>
                  Este comunicado es <strong>específico e individual</strong> para los representantes y docentes asignados a la ruta <strong>{modalContingencia.nombre}</strong>.
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold small text-muted">Texto del Aviso para WhatsApp (Editable):</label>
                <textarea
                  className="form-control rounded-3 p-3 font-monospace"
                  rows={10}
                  style={{ fontSize: '0.82rem', lineHeight: '1.4' }}
                  value={mensajeContingencia}
                  onChange={(e) => setMensajeContingencia(e.target.value)}
                ></textarea>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  onClick={() => copiarTexto(mensajeContingencia, '¡Aviso de contingencia copiado!')}
                  className="btn btn-outline-dark rounded-pill px-3 py-1.5 fw-bold small flex-grow-1"
                >
                  <i className="bi bi-clipboard-check me-1"></i> Copiar Aviso
                </button>
                <button
                  type="button"
                  onClick={() => abrirWhatsApp(mensajeContingencia)}
                  className="btn btn-success rounded-pill px-4 py-1.5 fw-bold small flex-grow-1 text-white"
                  style={{ background: '#25D366', borderColor: '#25D366' }}
                >
                  <i className="bi bi-whatsapp me-1"></i> Enviar por WhatsApp
                </button>
              </div>
            </div>

            <div className="modal-footer border-top bg-light p-2.5">
              <button
                type="button"
                className="btn btn-sm btn-secondary rounded-pill px-3 fw-bold"
                onClick={() => setModalContingencia(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
