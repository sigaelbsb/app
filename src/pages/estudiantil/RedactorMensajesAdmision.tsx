import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { usePermisos } from '../../hooks/usePermisos';
import { auditar } from '../../lib/audit';
import type {
  PlantillaMensajeAdmision,
  EstadoAdmisionTipo,
  CanalMensaje
} from '../../utils/plantillasAdmision';
import {
  VARIABLES_DISPONIBLES,
  PLANTILLAS_PREDETERMINADAS_ADMISION,
  obtenerPlantillasAdmision,
  guardarPlantillasAdmision,
  renderizarMensajeAdmision,
  generarEnlaceWhatsAppAdmision
} from '../../utils/plantillasAdmision';

declare const Swal: any;

export const RedactorMensajesAdmision: React.FC = () => {
  usePermisos();
  const navigate = useNavigate();

  const [plantillas, setPlantillas] = useState<PlantillaMensajeAdmision[]>([]);
  const [plantillaActivaId, setPlantillaActivaId] = useState<string>('');
  const [plantillaEdicion, setPlantillaEdicion] = useState<PlantillaMensajeAdmision | null>(null);

  // Filtros de navegación
  const [filtroEscuela, setFiltroEscuela] = useState<'todas' | 'sb' | 'lb'>('todas');
  const [filtroEstado, setFiltroEstado] = useState<EstadoAdmisionTipo>('Aprobado');
  const [filtroCanal, setFiltroCanal] = useState<CanalMensaje>('whatsapp');

  // Datos de prueba para el simulador
  const [solicitudesMuestra, setSolicitudesMuestra] = useState<any[]>([]);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any | null>(null);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [telefonoPrueba, setTelefonoPrueba] = useState<string>('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const listado = obtenerPlantillasAdmision();
    setPlantillas(listado);

    if (listado.length > 0) {
      setPlantillaActivaId(listado[0].id);
      setPlantillaEdicion(JSON.parse(JSON.stringify(listado[0])));
    }

    // Cargar aspirantes muestra para el simulador
    try {
      const { data } = await supabase
        .from('admisiones_solicitudes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (data && data.length > 0) {
        setSolicitudesMuestra(data);
        setSolicitudSeleccionada(data[0]);
        setTelefonoPrueba(data[0].representante_telefono || '');
      } else {
        // Aspirante de muestra por defecto
        const defaultAspirante = {
          codigo_unico: 'CR-SB-2025-0142',
          codigo_escuela: 'sb',
          estado: 'Aprobado',
          representante_nombres: 'María Elena',
          representante_apellidos: 'Gómez Salazar',
          representante_cedula: '18.452.963',
          representante_telefono: '04141234567',
          estudiante_nombres: 'Santiago Alejandro',
          estudiante_apellidos: 'Gómez Salazar',
          estudiante_cedula: '32.854.120',
          grado_solicitado: '1er Año de Educación Media General',
          observaciones: 'Presentar cédula original y notas certificadas en Control de Estudios.'
        };
        setSolicitudesMuestra([defaultAspirante]);
        setSolicitudSeleccionada(defaultAspirante);
        setTelefonoPrueba('04141234567');
      }
    } catch (e) {
      console.error('Error cargando aspirantes de muestra:', e);
    }
  };

  // Filtrado de plantillas según selección
  const plantillasFiltradas = useMemo(() => {
    return plantillas.filter(p => {
      const coincideEscuela = filtroEscuela === 'todas' || p.id_escuela === filtroEscuela || p.id_escuela === 'ambas';
      const coincideEstado = p.estado_solicitud === filtroEstado;
      const coincideCanal = p.canal === filtroCanal;
      return coincideEscuela && coincideEstado && coincideCanal;
    });
  }, [plantillas, filtroEscuela, filtroEstado, filtroCanal]);

  // Sincronizar plantilla en edición cuando cambia el filtro o la lista filtrada
  useEffect(() => {
    if (plantillasFiltradas.length > 0) {
      const existe = plantillasFiltradas.find(p => p.id === plantillaActivaId);
      if (existe) {
        setPlantillaEdicion(JSON.parse(JSON.stringify(existe)));
      } else {
        setPlantillaActivaId(plantillasFiltradas[0].id);
        setPlantillaEdicion(JSON.parse(JSON.stringify(plantillasFiltradas[0])));
      }
    }
  }, [plantillasFiltradas]);

  const seleccionarPlantilla = (id: string) => {
    const pl = plantillas.find(p => p.id === id);
    if (pl) {
      setPlantillaActivaId(id);
      setPlantillaEdicion(JSON.parse(JSON.stringify(pl)));
    }
  };

  // Insertar variable dinámica en la posición del cursor
  const insertarVariable = (tag: string) => {
    if (!textareaRef.current || !plantillaEdicion) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const textoActual = plantillaEdicion.cuerpo_mensaje || '';

    const nuevoTexto = textoActual.substring(0, start) + tag + textoActual.substring(end);
    setPlantillaEdicion({ ...plantillaEdicion, cuerpo_mensaje: nuevoTexto });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  // Insertar formato enriquecido (Negrita, Cursiva, etc.)
  const insertarFormato = (tipo: 'bold' | 'italic' | 'saludo' | 'recaudos') => {
    if (!textareaRef.current || !plantillaEdicion) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const textoActual = plantillaEdicion.cuerpo_mensaje || '';
    const seleccion = textoActual.substring(start, end) || 'texto';

    let reemplazo = '';
    if (tipo === 'bold') reemplazo = `*${seleccion}*`;
    else if (tipo === 'italic') reemplazo = `_${seleccion}_`;
    else if (tipo === 'saludo') reemplazo = `\nEstimado(a) Representante *{{nombre_representante}}*:\n`;
    else if (tipo === 'recaudos') reemplazo = `\n📋 *RECAUDOS REQUERIDOS:*\n1. Copia de Cédula del Representante y Estudiante.\n2. Notas Certificadas del plantel de procedencia.\n3. Ficha Médica y Foto Tipo Carnet.\n`;

    const nuevoTexto = textoActual.substring(0, start) + reemplazo + textoActual.substring(end);
    setPlantillaEdicion({ ...plantillaEdicion, cuerpo_mensaje: nuevoTexto });
  };

  // Guardar cambios en las plantillas
  const handleGuardarPlantilla = async () => {
    if (!plantillaEdicion) return;
    setGuardando(true);

    try {
      const actualizadas = plantillas.map(p => 
        p.id === plantillaEdicion.id ? { ...plantillaEdicion, actualizado_el: new Date().toISOString() } : p
      );
      setPlantillas(actualizadas);
      await guardarPlantillasAdmision(actualizadas);
      auditar('Admisiones', 'Editar Plantilla Mensaje', `Modificada plantilla: ${plantillaEdicion.titulo_plantilla} (${plantillaEdicion.estado_solicitud})`);

      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Plantilla Guardada!',
          text: 'Los cambios se aplicaron exitosamente y ya están activos para todas las notificaciones de admisiones.',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (e: any) {
      console.error('Error guardando plantilla:', e);
      if (Swal) Swal.fire('Error', 'No se pudo guardar la plantilla: ' + (e.message || 'Error inesperado'), 'error');
    } finally {
      setGuardando(false);
    }
  };

  // Restaurar plantillas predeterminadas
  const handleRestaurarPredeterminados = () => {
    if (!Swal) return;
    Swal.fire({
      title: '¿Restaurar Plantillas de Fábrica?',
      text: 'Se restablecerán todos los formatos oficiales predeterminados para WhatsApp y Correo Electrónico.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar'
    }).then(async (res: any) => {
      if (res.isConfirmed) {
        setPlantillas(PLANTILLAS_PREDETERMINADAS_ADMISION);
        setPlantillaActivaId(PLANTILLAS_PREDETERMINADAS_ADMISION[0].id);
        setPlantillaEdicion(JSON.parse(JSON.stringify(PLANTILLAS_PREDETERMINADAS_ADMISION[0])));
        await guardarPlantillasAdmision(PLANTILLAS_PREDETERMINADAS_ADMISION);
        Swal.fire('Restaurado', 'Se han restablecido los mensajes oficiales originales.', 'success');
      }
    });
  };

  // Crear una nueva plantilla personalizada
  const handleCrearNuevaPlantilla = () => {
    if (!Swal) return;
    Swal.fire({
      title: 'Crear Nueva Plantilla de Mensaje',
      html: `
        <div class="text-start">
          <label class="small fw-bold text-muted mb-1">Nombre de la Plantilla:</label>
          <input id="swal-new-titulo" class="swal2-input m-0 mb-3 w-100" placeholder="Ej. Notificación Especial de Cupos" />
          
          <div class="row g-2 mb-2">
            <div class="col-6">
              <label class="small fw-bold text-muted mb-1">Escuela:</label>
              <select id="swal-new-escuela" class="form-select">
                <option value="sb">U.E. Santa Bárbara</option>
                <option value="lb">U.E. Libertador Bolívar</option>
                <option value="ambas">Ambas Escuelas</option>
              </select>
            </div>
            <div class="col-6">
              <label class="small fw-bold text-muted mb-1">Estatus:</label>
              <select id="swal-new-estado" class="form-select">
                <option value="Aprobado">Aprobado / Admitido</option>
                <option value="Rechazado">Rechazado / No Admitido</option>
                <option value="Formalizado">Formalizado</option>
                <option value="En Evaluación">En Evaluación</option>
              </select>
            </div>
          </div>

          <label class="small fw-bold text-muted mb-1">Canal de Envío:</label>
          <select id="swal-new-canal" class="form-select mb-2">
            <option value="whatsapp">💬 WhatsApp</option>
            <option value="email">✉️ Correo Electrónico</option>
          </select>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Crear Plantilla',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const titulo = (document.getElementById('swal-new-titulo') as HTMLInputElement)?.value;
        const escuela = (document.getElementById('swal-new-escuela') as HTMLSelectElement)?.value as any;
        const estado = (document.getElementById('swal-new-estado') as HTMLSelectElement)?.value as any;
        const canal = (document.getElementById('swal-new-canal') as HTMLSelectElement)?.value as any;
        if (!titulo) {
          Swal.showValidationMessage('El nombre de la plantilla es obligatorio');
          return false;
        }
        return { titulo, escuela, estado, canal };
      }
    }).then(async (result: any) => {
      if (result.isConfirmed && result.value) {
        const { titulo, escuela, estado, canal } = result.value;
        const nuevaPlantilla: PlantillaMensajeAdmision = {
          id: `adm-custom-${Date.now()}`,
          id_escuela: escuela,
          estado_solicitud: estado,
          canal: canal,
          titulo_plantilla: titulo,
          asunto_email: canal === 'email' ? `Notificación de Admisión - {{nombre_estudiante}}` : undefined,
          cuerpo_mensaje: `🏛️ *SIGAE - NOTIFICACIÓN OFICIAL*\n🏫 *{{nombre_escuela}}*\n\nEstimado(a) Representante *{{nombre_representante}}*:\n\nLe notificamos que la solicitud de cupo para {{nombre_estudiante}} se encuentra en estatus: *{{estado_solicitud}}*.\n\n{{observaciones}}\n\n_Comité de Admisiones_`,
          activo: true
        };

        const actualizadas = [...plantillas, nuevaPlantilla];
        setPlantillas(actualizadas);
        setPlantillaActivaId(nuevaPlantilla.id);
        setPlantillaEdicion(nuevaPlantilla);
        setFiltroEscuela(escuela === 'ambas' ? 'todas' : escuela);
        setFiltroEstado(estado);
        setFiltroCanal(canal);
        await guardarPlantillasAdmision(actualizadas);
        Swal.fire('Creada', 'Nueva plantilla agregada exitosamente.', 'success');
      }
    });
  };

  // Texto renderizado en vivo para el simulador
  const mensajeSimulado = useMemo(() => {
    if (!plantillaEdicion) return '';
    return renderizarMensajeAdmision(
      plantillaEdicion.cuerpo_mensaje,
      solicitudSeleccionada || {},
      solicitudSeleccionada?.codigo_escuela === 'lb' ? 'Unidad Educativa Libertador Bolívar' : 'Unidad Educativa Santa Bárbara'
    );
  }, [plantillaEdicion, solicitudSeleccionada]);

  // Enviar mensaje de prueba real
  const handleProbarEnvio = () => {
    if (!mensajeSimulado) return;
    if (plantillaEdicion?.canal === 'email') {
      const email = solicitudSeleccionada?.representante_email || 'representante@gmail.com';
      const asunto = renderizarMensajeAdmision(plantillaEdicion.asunto_email || 'Notificación Oficial de Admisión', solicitudSeleccionada || {});
      const mailto = `mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensajeSimulado)}`;
      window.open(mailto, '_blank');
    } else {
      const enlace = generarEnlaceWhatsAppAdmision(telefonoPrueba, mensajeSimulado);
      window.open(enlace, '_blank');
    }
  };

  return (
    <div className="container-fluid py-4 px-xl-5">
      {/* ── ENCABEZADO PRINCIPAL ── */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-outline-secondary btn-sm rounded-circle"
              onClick={() => navigate('/categoria/Gestión%20Estudiantil/Gestión%20de%20Admisiones')}
              title="Volver a Gestión de Admisiones"
            >
              <i className="bi bi-arrow-left"></i>
            </button>
            <h2 className="h4 fw-bold text-dark mb-0">
              <i className="bi bi-chat-heart-fill text-primary me-2"></i>
              Redactor de Mensajes de Admisión
            </h2>
          </div>
          <p className="text-muted small mb-0 mt-1">
            Diseña, personaliza y simula los mensajes oficiales de <strong>Aprobación</strong>, <strong>Rechazo</strong> y <strong>Formalización</strong> para WhatsApp y Correo.
          </p>
        </div>

        <div className="d-flex align-items-center flex-wrap gap-2">
          <button
            className="btn btn-outline-secondary rounded-pill px-3 fw-bold btn-sm"
            onClick={handleRestaurarPredeterminados}
            title="Restaurar textos predeterminados de fábrica"
          >
            <i className="bi bi-arrow-counterclockwise me-1"></i>Restaurar Originales
          </button>
          <button
            className="btn btn-outline-primary rounded-pill px-3 fw-bold btn-sm"
            onClick={handleCrearNuevaPlantilla}
          >
            <i className="bi bi-plus-lg me-1"></i>Nueva Plantilla
          </button>
          <button
            className="btn btn-success rounded-pill px-4 fw-bold shadow-sm btn-sm d-flex align-items-center gap-2"
            onClick={handleGuardarPlantilla}
            disabled={guardando || !plantillaEdicion}
          >
            {guardando ? (
              <span className="spinner-border spinner-border-sm"></span>
            ) : (
              <i className="bi bi-floppy-fill"></i>
            )}
            <span>Guardar y Aplicar al Sistema</span>
          </button>
        </div>
      </div>

      {/* ── BARRA DE FILTROS RÁPIDOS Y SELECTOR DE PLANTILLA ── */}
      <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-4">
        <div className="row g-3 align-items-center">
          
          {/* Filtro por Escuela */}
          <div className="col-12 col-md-4">
            <label className="extra-small fw-bold text-muted text-uppercase mb-1 d-block">
              <i className="bi bi-building me-1 text-primary"></i>Plantel Educativo
            </label>
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={`btn btn-sm fw-bold ${filtroEscuela === 'todas' ? 'btn-dark' : 'btn-outline-secondary'}`}
                onClick={() => setFiltroEscuela('todas')}
              >
                Todas
              </button>
              <button
                type="button"
                className={`btn btn-sm fw-bold ${filtroEscuela === 'sb' ? 'btn-success text-white' : 'btn-outline-success'}`}
                onClick={() => setFiltroEscuela('sb')}
              >
                Santa Bárbara
              </button>
              <button
                type="button"
                className={`btn btn-sm fw-bold ${filtroEscuela === 'lb' ? 'btn-primary text-white' : 'btn-outline-primary'}`}
                onClick={() => setFiltroEscuela('lb')}
              >
                Libertador Bolívar
              </button>
            </div>
          </div>

          {/* Filtro por Estatus */}
          <div className="col-12 col-md-5">
            <label className="extra-small fw-bold text-muted text-uppercase mb-1 d-block">
              <i className="bi bi-funnel-fill me-1 text-warning"></i>Dictamen / Estatus de Admisión
            </label>
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={`btn btn-sm fw-bold ${filtroEstado === 'Aprobado' ? 'btn-success shadow-sm' : 'btn-outline-success'}`}
                onClick={() => setFiltroEstado('Aprobado')}
              >
                <i className="bi bi-check-circle-fill me-1"></i>Aprobado
              </button>
              <button
                type="button"
                className={`btn btn-sm fw-bold ${filtroEstado === 'Rechazado' ? 'btn-danger shadow-sm' : 'btn-outline-danger'}`}
                onClick={() => setFiltroEstado('Rechazado')}
              >
                <i className="bi bi-x-circle-fill me-1"></i>Rechazado
              </button>
              <button
                type="button"
                className={`btn btn-sm fw-bold ${filtroEstado === 'Formalizado' ? 'btn-primary shadow-sm' : 'btn-outline-primary'}`}
                onClick={() => setFiltroEstado('Formalizado')}
              >
                <i className="bi bi-patch-check-fill me-1"></i>Formalizado
              </button>
              <button
                type="button"
                className={`btn btn-sm fw-bold ${filtroEstado === 'En Evaluación' ? 'btn-warning text-dark shadow-sm' : 'btn-outline-warning text-dark'}`}
                onClick={() => setFiltroEstado('En Evaluación')}
              >
                <i className="bi bi-hourglass-split me-1"></i>Evaluación
              </button>
            </div>
          </div>

          {/* Filtro por Canal */}
          <div className="col-12 col-md-3">
            <label className="extra-small fw-bold text-muted text-uppercase mb-1 d-block">
              <i className="bi bi-broadcast me-1 text-info"></i>Canal de Mensaje
            </label>
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                className={`btn btn-sm fw-bold ${filtroCanal === 'whatsapp' ? 'btn-success text-white shadow-sm' : 'btn-outline-success'}`}
                onClick={() => setFiltroCanal('whatsapp')}
              >
                <i className="bi bi-whatsapp me-1"></i>WhatsApp
              </button>
              <button
                type="button"
                className={`btn btn-sm fw-bold ${filtroCanal === 'email' ? 'btn-info text-white shadow-sm' : 'btn-outline-info'}`}
                onClick={() => setFiltroCanal('email')}
              >
                <i className="bi bi-envelope-at-fill me-1"></i>Correo
              </button>
            </div>
          </div>

        </div>

        {/* Selector de plantilla específica si hay varias */}
        {plantillasFiltradas.length > 1 && (
          <div className="d-flex align-items-center gap-2 mt-3 pt-3 border-top">
            <span className="small fw-bold text-muted">Plantilla Activa:</span>
            <select
              className="form-select form-select-sm fw-bold border-primary rounded-pill w-auto"
              value={plantillaActivaId}
              onChange={(e) => seleccionarPlantilla(e.target.value)}
            >
              {plantillasFiltradas.map(p => (
                <option key={p.id} value={p.id}>
                  {p.titulo_plantilla} ({p.id_escuela.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── ÁREA DE TRABAJO: EDITOR (IZQUIERDA) + SIMULADOR EN VIVO (DERECHA) ── */}
      <div className="row g-4">
        
        {/* PANEL IZQUIERDO: CONTROLES DEL EDITOR */}
        <div className="col-12 col-xl-7">
          <div className="card border-0 shadow-sm rounded-4 bg-white h-100 overflow-hidden">
            
            <div className="card-header bg-light border-bottom p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <span className={`badge ${filtroEstado === 'Aprobado' ? 'bg-success' : filtroEstado === 'Rechazado' ? 'bg-danger' : filtroEstado === 'Formalizado' ? 'bg-primary' : 'bg-warning text-dark'} px-3 py-2 rounded-pill fs-7`}>
                  {plantillaEdicion?.estado_solicitud}
                </span>
                <span className="badge bg-dark text-white px-2.5 py-2 rounded-pill fs-7">
                  {plantillaEdicion?.canal === 'whatsapp' ? '💬 WhatsApp' : '✉️ Correo'}
                </span>
              </div>
              <div className="form-check form-switch m-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="switchPlantillaActiva"
                  checked={plantillaEdicion?.activo ?? true}
                  onChange={(e) => plantillaEdicion && setPlantillaEdicion({ ...plantillaEdicion, activo: e.target.checked })}
                />
                <label className="form-check-label small fw-bold text-muted" htmlFor="switchPlantillaActiva">
                  Plantilla Habilitada
                </label>
              </div>
            </div>

            <div className="card-body p-4 d-flex flex-column gap-3">
              
              {/* Título de la Plantilla */}
              <div>
                <label className="small fw-bold text-dark mb-1">Nombre de la Plantilla:</label>
                <input
                  type="text"
                  className="form-control fw-bold border-2 rounded-3"
                  value={plantillaEdicion?.titulo_plantilla || ''}
                  onChange={(e) => plantillaEdicion && setPlantillaEdicion({ ...plantillaEdicion, titulo_plantilla: e.target.value })}
                  placeholder="Título descriptivo..."
                />
              </div>

              {/* Asunto si es Correo Electrónico */}
              {plantillaEdicion?.canal === 'email' && (
                <div>
                  <label className="small fw-bold text-dark mb-1">Asunto del Correo Electrónico:</label>
                  <input
                    type="text"
                    className="form-control fw-bold border-info rounded-3"
                    value={plantillaEdicion?.asunto_email || ''}
                    onChange={(e) => plantillaEdicion && setPlantillaEdicion({ ...plantillaEdicion, asunto_email: e.target.value })}
                    placeholder="Ej. ¡Solicitud Admitida! Proceso de Admisión {{ano_escolar}}..."
                  />
                </div>
              )}

              {/* BARRA DE VARIABLES DINÁMICAS (1 CLIC) */}
              <div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="small fw-bold text-primary mb-0">
                    <i className="bi bi-code-slash me-1"></i>Variables Dinámicas Disponibles (Haz clic para insertar):
                  </label>
                  <small className="text-muted">Se sustituyen automáticamente con los datos del aspirante</small>
                </div>
                <div className="d-flex flex-wrap gap-1.5 p-2.5 bg-light rounded-3 border" style={{ maxHeight: '110px', overflowY: 'auto' }}>
                  {VARIABLES_DISPONIBLES.map(v => (
                    <button
                      key={v.tag}
                      type="button"
                      className="btn btn-sm btn-outline-primary bg-white fw-bold py-0.5 px-2 rounded-pill extra-small shadow-xs hover-efecto"
                      onClick={() => insertarVariable(v.tag)}
                      title={v.desc}
                    >
                      <code>{v.tag}</code>
                    </button>
                  ))}
                </div>
              </div>

              {/* ATAJOS DE FORMATEO RÁPIDO */}
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-2 border-top">
                <div className="d-flex align-items-center gap-1">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary fw-bold px-2.5 py-1"
                    onClick={() => insertarFormato('bold')}
                    title="Negrita (*texto*)"
                  >
                    <i className="bi bi-type-bold"></i> Negrita
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary fw-bold px-2.5 py-1"
                    onClick={() => insertarFormato('italic')}
                    title="Cursiva (_texto_)"
                  >
                    <i className="bi bi-type-italic"></i> Cursiva
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary fw-bold px-2.5 py-1"
                    onClick={() => insertarFormato('saludo')}
                    title="Insertar Saludo Institucional"
                  >
                    👋 Saludo
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary fw-bold px-2.5 py-1"
                    onClick={() => insertarFormato('recaudos')}
                    title="Insertar Lista de Recaudos"
                  >
                    📋 Recaudos
                  </button>
                </div>
                <small className="text-muted font-monospace">
                  {plantillaEdicion?.cuerpo_mensaje.length || 0} caracteres
                </small>
              </div>

              {/* TEXTAREA PRINCIPAL DE REDACCIÓN */}
              <div className="flex-grow-1">
                <textarea
                  ref={textareaRef}
                  rows={14}
                  className="form-control font-monospace border-2 rounded-3 p-3 text-dark bg-white"
                  style={{ fontSize: '13px', lineHeight: '1.5', minHeight: '320px' }}
                  value={plantillaEdicion?.cuerpo_mensaje || ''}
                  onChange={(e) => plantillaEdicion && setPlantillaEdicion({ ...plantillaEdicion, cuerpo_mensaje: e.target.value })}
                  placeholder="Redacta el mensaje aquí..."
                />
              </div>

            </div>
          </div>
        </div>


        {/* PANEL DERECHO: SIMULADOR Y PROBADOR EN TIEMPO REAL */}
        <div className="col-12 col-xl-5">
          <div className="card border-0 shadow-sm rounded-4 bg-white h-100 overflow-hidden d-flex flex-column">
            
            <div className="card-header bg-light border-bottom p-3">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                <span className="fw-bold text-dark small d-flex align-items-center gap-1.5">
                  <i className="bi bi-phone-fill text-success fs-5"></i>
                  Simulador de Notificación en Vivo
                </span>
                <span className="badge bg-success bg-opacity-10 text-success border border-success px-2.5 py-1 rounded-pill extra-small">
                  Vista Previa Real
                </span>
              </div>

              {/* Selector de Aspirante Muestra */}
              <div className="d-flex align-items-center gap-2">
                <label className="extra-small fw-bold text-muted text-nowrap m-0">Aspirante de Prueba:</label>
                <select
                  className="form-select form-select-sm fw-bold border-secondary rounded-3"
                  value={solicitudSeleccionada?.id || solicitudSeleccionada?.codigo_unico || ''}
                  onChange={(e) => {
                    const sel = solicitudesMuestra.find(s => String(s.id) === e.target.value || s.codigo_unico === e.target.value);
                    if (sel) {
                      setSolicitudSeleccionada(sel);
                      setTelefonoPrueba(sel.representante_telefono || '');
                    }
                  }}
                >
                  {solicitudesMuestra.map((s, idx) => (
                    <option key={s.id || idx} value={s.id || s.codigo_unico}>
                      {s.estudiante_nombres || s.nombres_estudiante} {s.estudiante_apellidos || s.apellidos_estudiante} ({s.codigo_escuela?.toUpperCase() || 'SB'} - {s.grado_solicitado || '1er Año'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="card-body p-3 p-md-4 bg-light d-flex flex-column justify-content-center align-items-center flex-grow-1">
              
              {/* MOCKUP ESTILO SMARTPHONE WHATSAPP */}
              {plantillaEdicion?.canal === 'whatsapp' ? (
                <div style={{
                  width: '100%',
                  maxWidth: '360px',
                  background: '#e5ddd5',
                  backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                  borderRadius: '24px',
                  border: '8px solid #1e293b',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Cabecera WhatsApp */}
                  <div style={{ background: '#075e54', padding: '10px 14px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#128c7e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>
                      🏫
                    </div>
                    <div style={{ flex: 1, lineHeight: '1.2' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold' }}>SIGAE Admisiones</div>
                      <div style={{ fontSize: '9.5px', opacity: 0.85 }}>En línea (Oficial)</div>
                    </div>
                  </div>

                  {/* Burbuja de Mensaje WhatsApp */}
                  <div style={{ padding: '12px', maxHeight: '420px', overflowY: 'auto' }}>
                    <div style={{
                      background: '#ffffff',
                      borderRadius: '8px 8px 8px 0px',
                      padding: '10px 12px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                      fontSize: '12px',
                      color: '#111827',
                      whiteSpace: 'pre-wrap',
                      lineHeight: '1.4',
                      wordBreak: 'break-word'
                    }}>
                      {mensajeSimulado}
                      <div style={{ textAlign: 'right', fontSize: '9px', color: '#9ca3af', marginTop: '4px' }}>
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                      </div>
                    </div>
                  </div>

                  {/* Barra inferior WhatsApp */}
                  <div style={{ background: '#f0f2f5', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, background: '#ffffff', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', color: '#9ca3af' }}>
                      Escribe un mensaje...
                    </div>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#00a884', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '12px' }}>
                      ➤
                    </div>
                  </div>
                </div>
              ) : (
                /* MOCKUP ESTILO CORREO ELECTRÓNICO */
                <div style={{
                  width: '100%',
                  maxWidth: '420px',
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                  overflow: 'hidden'
                }}>
                  <div style={{ background: '#0284c7', padding: '12px 16px', color: '#ffffff' }}>
                    <div style={{ fontSize: '10px', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Correo Electrónico Oficial</div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginTop: '2px' }}>
                      {renderizarMensajeAdmision(plantillaEdicion?.asunto_email || 'Notificación de Admisión', solicitudSeleccionada || {})}
                    </div>
                  </div>

                  <div style={{ padding: '14px 16px', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', color: '#475569' }}>
                    <div><strong>De:</strong> admisiones@sigae.edu.ve</div>
                    <div><strong>Para:</strong> {solicitudSeleccionada?.representante_email || 'representante@correo.com'}</div>
                  </div>

                  <div style={{ padding: '16px', fontSize: '12px', color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: '1.5', maxHeight: '360px', overflowY: 'auto' }}>
                    {mensajeSimulado}
                  </div>
                </div>
              )}

            </div>

            {/* BARRA DE ACCIÓN INFERIOR: PROBADOR REAL */}
            <div className="card-footer bg-white border-top p-3">
              <div className="row g-2 align-items-center">
                <div className="col-12 col-md-6">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light fw-bold">
                      <i className="bi bi-telephone-fill text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control fw-bold"
                      placeholder="Teléfono para prueba..."
                      value={telefonoPrueba}
                      onChange={(e) => setTelefonoPrueba(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <button
                    type="button"
                    className={`btn btn-sm ${plantillaEdicion?.canal === 'whatsapp' ? 'btn-success' : 'btn-info text-white'} w-100 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-1.5`}
                    onClick={handleProbarEnvio}
                  >
                    <i className={`bi ${plantillaEdicion?.canal === 'whatsapp' ? 'bi-whatsapp' : 'bi-envelope-paper-fill'}`}></i>
                    <span>{plantillaEdicion?.canal === 'whatsapp' ? 'Enviar Prueba por WhatsApp' : 'Probar Envío por Email'}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default RedactorMensajesAdmision;
