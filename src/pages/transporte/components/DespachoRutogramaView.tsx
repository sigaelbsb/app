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
  const [guardandoId, setGuardandoId] = useState<string | null>(null);

  // Destinatario del mensaje (Estudiantes vs Docentes)
  const [tipoDestinatario, setTipoDestinatario] = useState<'estudiantes' | 'docentes'>('estudiantes');

  // Estados de texto para cada destinatario (para no perder ediciones al alternar)
  const [mensajeEstudiantes, setMensajeEstudiantes] = useState<string>('');
  const [mensajeDocentes, setMensajeDocentes] = useState<string>('');
  const [editadoEstudiantes, setEditadoEstudiantes] = useState<boolean>(false);
  const [editadoDocentes, setEditadoDocentes] = useState<boolean>(false);

  // Modal de Contingencia individual
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
    setSelectedIds(enriquecidas.map(r => r.id));
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
    setEditadoEstudiantes(false);
    setEditadoDocentes(false);
  };

  // Guardar cambios de una ruta en Supabase
  const guardarRuta = async (ruta: any) => {
    setGuardandoId(ruta.id);
    try {
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

      await cargarTodo(true);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Ruta ${ruta.nombre} actualizada`,
        showConfirmButton: false,
        timer: 1800
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire('Error', 'No se pudo guardar la ruta: ' + (err.message || ''), 'error');
    } finally {
      setGuardandoId(null);
    }
  };

  // Alternar selección de ruta para el rutograma
  const toggleSelectRuta = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setEditadoEstudiantes(false);
    setEditadoDocentes(false);
  };

  const selectTodas = () => {
    setSelectedIds(localRutas.map(r => r.id));
    setEditadoEstudiantes(false);
    setEditadoDocentes(false);
  };

  const selectSoloActivas = () => {
    setSelectedIds(localRutas.filter(r => r.activo !== false).map(r => r.id));
    setEditadoEstudiantes(false);
    setEditadoDocentes(false);
  };

  const deseleccionarTodas = () => {
    setSelectedIds([]);
    setEditadoEstudiantes(false);
    setEditadoDocentes(false);
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

  // ── GENERADOR 1: PARA ESTUDIANTES Y FAMILIAS ──
  const plantillaEstudiantes = useMemo(() => {
    const rutasAProcesar = localRutas.filter(r => selectedIds.includes(r.id));
    if (rutasAProcesar.length === 0) {
      return '⚠️ Selecciona al menos una ruta de la lista para generar el rutograma.';
    }

    const activas = rutasAProcesar.filter(r => r.activo !== false);
    const inactivas = rutasAProcesar.filter(r => r.activo === false);

    let texto = `🚍 *RUTOGRAMA OFICIAL DE TRANSPORTE ESCOLAR*\n`;
    texto += `🏫 *${nombreEscuela}*\n`;
    texto += `📅 *Fecha:* ${fechaHoyFormateada}\n`;
    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (activas.length > 0) {
      texto += `✅ *UNIDADES OPERATIVAS EN SERVICIO (${activas.length})*\n\n`;

      activas.forEach((r) => {
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
    }

    if (inactivas.length > 0) {
      texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      texto += `⚠️ *UNIDADES INHABILITADAS / NOVEDADES (${inactivas.length})*\n\n`;

      inactivas.forEach(r => {
        const doc = docentes.find(d => d.id_usuario === r.docente_id);
        const nombreDoc = doc ? doc.nombre_completo : 'Sin Asignar';
        const telDoc = r.docente_telefono || (doc ? doc.telefono : '');
        const motivo = r.motivo_inactivo?.trim() || 'Mantenimiento preventivo / Unidad en revisión técnica';

        texto += `🔴 *${r.nombre.toUpperCase()}* - *INHABILITADA*\n`;
        texto += `⚙️ *Condición / Causa:* ${motivo}\n`;
        texto += `👨‍✈️ *Chofer:* ${r.chofer_nombre || 'Sin Asignar'}\n`;
        texto += `👩‍🏫 *Contacto Docente:* ${nombreDoc}${telDoc ? ` 📱 (${telDoc})` : ''}\n`;
        texto += `📢 *Aviso:* Se solicita a los representantes de esta ruta tomar previsiones para el traslado particular de los estudiantes.\n\n`;
      });
    }

    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `📢 *Indicaciones Importantes:*\n`;
    texto += `• Estar en la parada con 10 minutos de anticipación con su uniforme reglamentario.\n`;
    texto += `• Todo estudiante debe portar su carnet escolar visible.\n\n`;
    texto += `*Coordinación General de Transporte Escolar*`;

    return texto;
  }, [localRutas, selectedIds, modoCompacto, nombreEscuela, docentes, fechaHoyFormateada, getIdsWithEscuela, getParadasWithEscuela]);

  // ── GENERADOR 2: PARA DOCENTES Y PERSONAL (ROL DE GUARDIAS) ──
  const plantillaDocentes = useMemo(() => {
    const rutasAProcesar = localRutas.filter(r => selectedIds.includes(r.id));
    if (rutasAProcesar.length === 0) {
      return '⚠️ Selecciona al menos una ruta de la lista para generar el rol de guardias.';
    }

    const activas = rutasAProcesar.filter(r => r.activo !== false);
    const inactivas = rutasAProcesar.filter(r => r.activo === false);

    let texto = `📋 *ROL OFICIAL DE GUARDIAS Y TRANSPORTE ESCOLAR*\n`;
    texto += `🏫 *${nombreEscuela}*\n`;
    texto += `📅 *Fecha:* ${fechaHoyFormateada}\n`;
    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    texto += `Estimados(as) docentes, a continuación se detalla la programación de guardias de acompañamiento en las rutas escolares para la jornada de hoy:\n\n`;

    if (activas.length > 0) {
      texto += `🚍 *DISTRIBUCIÓN DE GUARDIAS ACTIVAS (${activas.length})*\n\n`;

      activas.forEach((r, idx) => {
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
    }

    if (inactivas.length > 0) {
      texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      texto += `⚠️ *RUTAS INHABILITADAS / GUARDIA SUSPENDIDA (${inactivas.length})*\n\n`;

      inactivas.forEach(r => {
        const doc = docentes.find(d => d.id_usuario === r.docente_id);
        const nombreDoc = doc ? doc.nombre_completo : 'Sin Asignar';
        const motivo = r.motivo_inactivo?.trim() || 'Mantenimiento preventivo / Unidad en revisión técnica';

        texto += `🔴 *${r.nombre.toUpperCase()}* [INACTIVA]\n`;
        texto += `• *Docente designado(a):* ${nombreDoc} (Relevado/a de ruta en esta jornada)\n`;
        texto += `• *Causa de la suspensión:* ${motivo}\n\n`;
      });
    }

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
  }, [localRutas, selectedIds, modoCompacto, nombreEscuela, docentes, fechaHoyFormateada, getIdsWithEscuela, getParadasWithEscuela]);

  // Sincronizar borradores iniciales
  useEffect(() => {
    if (!editadoEstudiantes) {
      setMensajeEstudiantes(plantillaEstudiantes);
    }
  }, [plantillaEstudiantes, editadoEstudiantes]);

  useEffect(() => {
    if (!editadoDocentes) {
      setMensajeDocentes(plantillaDocentes);
    }
  }, [plantillaDocentes, editadoDocentes]);

  // Mensaje activo actual según pestaña
  const mensajeActivo = tipoDestinatario === 'estudiantes' ? mensajeEstudiantes : mensajeDocentes;
  const setMensajeActivo = (val: string) => {
    if (tipoDestinatario === 'estudiantes') {
      setMensajeEstudiantes(val);
      setEditadoEstudiantes(true);
    } else {
      setMensajeDocentes(val);
      setEditadoDocentes(true);
    }
  };

  const editadoActivo = tipoDestinatario === 'estudiantes' ? editadoEstudiantes : editadoDocentes;

  // Restaurar plantilla activa
  const restaurarPlantillaActiva = () => {
    if (tipoDestinatario === 'estudiantes') {
      setMensajeEstudiantes(plantillaEstudiantes);
      setEditadoEstudiantes(false);
    } else {
      setMensajeDocentes(plantillaDocentes);
      setEditadoDocentes(false);
    }
  };

  // Copiar al portapapeles
  const copiarTexto = async (texto: string, titulo = '¡Copiado!') => {
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
    msg += `📍 *Paradas que NO tendrán servicio en esta jornada:*\n`;
    listaParadas.forEach((p, idx) => {
      msg += `   ${idx + 1}. ${p.nombre_parada}\n`;
    });
    msg += `\n📢 *Medida requerida:* Se solicita cordialmente a los padres y representantes de estas paradas coordinar el traslado particular de los estudiantes para la entrada y salida.\n\n`;
    msg += `Ofrecemos disculpas por los inconvenientes y nos encontramos trabajando para reestablecer la unidad a la brevedad.\n\n`;
    msg += `Atentamente,\n*Coordinación de Transporte Escolar*`;

    setMensajeContingencia(msg);
    setModalContingencia(ruta);
  };

  // Cálculo del tamaño para 1 solo mensaje de WhatsApp
  const numCaracteres = mensajeActivo.length;
  const esIdealUnMensaje = numCaracteres <= 2800;
  const progresoTamano = Math.min(100, Math.round((numCaracteres / 3500) * 100));

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
              {nombreEscuela} • Difusión diferenciada para Familias y Rol de Guardias para Docentes.
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
              Pasos 1 y 2 • Operación Diaria
            </div>
            <h5 className="fw-bold mb-0 text-dark">Asignación de Personal y Estatus de las Unidades</h5>
            <small className="text-muted">
              Asigna chofer, docente de guardia con teléfono y activa/inhabilita según la condición mecánica.
            </small>
          </div>

          <div className="d-flex align-items-center gap-2">
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
              Solo Activas
            </button>
            <button
              onClick={deseleccionarTodas}
              className="btn btn-xs btn-outline-danger rounded-pill px-2.5 py-1 fw-bold"
              style={{ fontSize: '0.75rem' }}
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ minWidth: '850px' }}>
              <thead className="bg-light text-muted small fw-bold">
                <tr>
                  <th style={{ width: '50px' }} className="text-center">Incluir</th>
                  <th style={{ width: '180px' }}>Ruta Escolar</th>
                  <th style={{ width: '180px' }}>Chofer de Unidad</th>
                  <th style={{ width: '220px' }}>Docente de Guardia</th>
                  <th style={{ width: '150px' }}>Teléfono Docente</th>
                  <th style={{ width: '240px' }}>Estatus / Condición Unidad</th>
                  <th style={{ width: '110px' }} className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {localRutas.map((ruta) => {
                  const isSelected = selectedIds.includes(ruta.id);
                  const isActiva = ruta.activo !== false;
                  const isGuardando = guardandoId === ruta.id;

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
                          title="Marcar para incluir en el rutograma de WhatsApp"
                        />
                      </td>

                      {/* Nombre de la Ruta */}
                      <td>
                        <div className="fw-bold text-dark d-flex align-items-center gap-1.5" style={{ fontSize: '0.9rem' }}>
                          <i className="bi bi-bus-front text-primary"></i>
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
                                  <span>Aviso Contingencia</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={() => guardarRuta(ruta)}
                          disabled={isGuardando}
                          className="btn btn-sm btn-primary rounded-pill px-3 py-1 fw-bold shadow-xs d-flex align-items-center justify-content-center gap-1 mx-auto"
                          style={{ fontSize: '0.75rem' }}
                        >
                          {isGuardando ? (
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                          ) : (
                            <>
                              <i className="bi bi-save2"></i>
                              <span>Guardar</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── PASOS 3 Y 4: SELECTOR DE PÚBLICO, EDITOR EN VIVO Y VISTA PREVIA ── */}
      <div className="row g-4">
        {/* Columna Izquierda: Selector de Mensaje y Editor */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            {/* Header con Pestañas de Destinatario */}
            <div className="card-header bg-white p-3 p-md-4 border-bottom">
              <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                <div>
                  <div className="badge rounded-pill bg-success-subtle text-success fw-bold px-2.5 py-1 mb-1">
                    Pasos 3 y 4 • Redacción y Ajuste
                  </div>
                  <h5 className="fw-bold mb-0 text-dark">Canales Oficiales de Difusión</h5>
                  <small className="text-muted">
                    Selecciona el público para redactar y enviar su mensaje ajustado para WhatsApp.
                  </small>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModoCompacto(!modoCompacto);
                      setEditadoEstudiantes(false);
                      setEditadoDocentes(false);
                    }}
                    className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${modoCompacto ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
                    style={{ fontSize: '0.76rem' }}
                    title="Alternar entre lista detallada y formato compacto"
                  >
                    <i className={`bi ${modoCompacto ? 'bi-card-text' : 'bi-justify'} me-1`}></i>
                    {modoCompacto ? 'Modo Detallado' : 'Modo Compacto'}
                  </button>

                  <button
                    type="button"
                    onClick={restaurarPlantillaActiva}
                    className="btn btn-xs btn-light border rounded-pill px-2.5 py-1 fw-bold text-dark"
                    style={{ fontSize: '0.76rem' }}
                    title="Restaurar plantilla automática de este mensaje"
                  >
                    <i className="bi bi-arrow-counterclockwise me-1"></i>
                    Restaurar
                  </button>
                </div>
              </div>

              {/* Botones de Selector de Destinatario (Estudiantes vs Docentes) */}
              <div className="btn-group p-1 bg-light rounded-pill border w-100 shadow-xs">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill fw-bold transition-all d-flex align-items-center justify-content-center gap-2 ${tipoDestinatario === 'estudiantes' ? 'btn-primary text-white shadow-xs' : 'btn-light text-muted border-0'}`}
                  style={{ fontSize: '0.84rem' }}
                  onClick={() => setTipoDestinatario('estudiantes')}
                >
                  <i className="bi bi-people-fill"></i>
                  <span>1. Para Estudiantes y Familias</span>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill fw-bold transition-all d-flex align-items-center justify-content-center gap-2 ${tipoDestinatario === 'docentes' ? 'btn-primary text-white shadow-xs' : 'btn-light text-muted border-0'}`}
                  style={{ fontSize: '0.84rem' }}
                  onClick={() => setTipoDestinatario('docentes')}
                >
                  <i className="bi bi-person-badge-fill"></i>
                  <span>2. Para Docentes (Rol de Guardias)</span>
                </button>
              </div>
            </div>

            <div className="card-body p-3 p-md-4 d-flex flex-column">
              {/* Medidor de Longitud y Tamaño de WhatsApp */}
              <div className="p-3 bg-light rounded-3 border mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1.5 flex-wrap gap-1">
                  <span className="fw-bold small text-dark d-flex align-items-center gap-1.5">
                    <i className="bi bi-chat-dots-fill text-success"></i>
                    <span>Estimador de Tamaño para WhatsApp ({tipoDestinatario === 'estudiantes' ? 'Familias' : 'Docentes'}):</span>
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
                  <span>
                    {tipoDestinatario === 'estudiantes' 
                      ? 'Texto del Rutograma para Estudiantes y Representantes (Editable):'
                      : 'Texto del Rol de Guardias para Docentes (Editable):'}
                  </span>
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
                  onClick={() => copiarTexto(mensajeActivo, `¡Mensaje para ${tipoDestinatario === 'estudiantes' ? 'estudiantes' : 'docentes'} copiado!`)}
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
            <div className="card-header p-3 border-bottom d-flex align-items-center gap-2" style={{ background: '#075e54', color: '#ffffff' }}>
              <div className="rounded-circle bg-white p-1 text-success d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                <i className={`bi ${tipoDestinatario === 'estudiantes' ? 'bi-bus-front-fill' : 'bi-person-badge-fill'} fs-5`} style={{ color: '#075e54' }}></i>
              </div>
              <div className="min-w-0 flex-grow-1">
                <div className="fw-bold text-truncate" style={{ fontSize: '0.92rem' }}>
                  {tipoDestinatario === 'estudiantes' 
                    ? `Transporte Institucional • Familias ${escCodigo.toUpperCase()}`
                    : `Coordinación Docente • Rol de Guardias ${escCodigo.toUpperCase()}`}
                </div>
                <small className="opacity-75 d-block" style={{ fontSize: '0.72rem' }}>
                  {tipoDestinatario === 'estudiantes' ? 'Canal Oficial de Representantes' : 'Grupo Oficial de Personal y Docentes'} • En línea
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
                  background: '#d9fdd3',
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
                  Visualizando mensaje para <strong>{tipoDestinatario === 'estudiantes' ? 'Estudiantes y Familias' : 'Docentes (Rol de Guardias)'}</strong>.
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL INDIVIDUAL: COMUNICADO DE CONTINGENCIA / INHABILITACIÓN (Nota Paso 3) ── */}
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

            <div className="modal-body p-3 p-md-4">
              <div className="alert alert-warning border-0 rounded-3 p-2.5 small mb-3 d-flex align-items-start gap-2">
                <i className="bi bi-bell-fill fs-5 text-warning flex-shrink-0"></i>
                <div>
                  <strong>Aviso de Novedad Individual:</strong> Envía este comunicado puntual a los representantes y grupos de la ruta afectada para que tomen previsiones de transporte particular.
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label fw-bold small text-muted">Texto del Comunicado (Editable):</label>
                <textarea
                  className="form-control rounded-3 p-3 font-monospace"
                  rows={10}
                  style={{ fontSize: '0.84rem', lineHeight: '1.45' }}
                  value={mensajeContingencia}
                  onChange={(e) => setMensajeContingencia(e.target.value)}
                ></textarea>
                <div className="text-end text-muted small mt-1">
                  {mensajeContingencia.length} caracteres
                </div>
              </div>

              {/* Botones de acción del comunicado */}
              <div className="d-flex gap-2 justify-content-end pt-2 border-top">
                <button
                  type="button"
                  className="btn btn-light rounded-pill px-3 fw-bold"
                  onClick={() => setModalContingencia(null)}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  className="btn btn-outline-dark rounded-pill px-3 fw-bold d-flex align-items-center gap-1"
                  onClick={() => copiarTexto(mensajeContingencia, '¡Comunicado copiado!')}
                >
                  <i className="bi bi-clipboard-check"></i>
                  <span>Copiar Texto</span>
                </button>
                <button
                  type="button"
                  className="btn btn-success rounded-pill px-4 fw-bold d-flex align-items-center gap-1.5 text-white"
                  style={{ background: '#25D366', borderColor: '#25D366' }}
                  onClick={() => {
                    abrirWhatsApp(mensajeContingencia);
                    setModalContingencia(null);
                  }}
                >
                  <i className="bi bi-whatsapp"></i>
                  <span>Enviar por WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
