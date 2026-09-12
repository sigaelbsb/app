import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';
import * as XLSX from 'xlsx';
import { ChamiloBreadcrumb, ChamiloHelpCallout } from '../../components/chamilo';
import { SigmaFiguraVisual } from '../../components/ChatbotSigma';

interface ConocimientoItem {
  id: string;
  tema: string;
  palabras_clave: string[];
  respuesta: string;
  accion_tipo: string | null;
  accion_valor: string | null;
  roles_permitidos: string[];
  creado_en?: string;
}

interface PreguntaRegistro {
  id: string;
  pregunta: string;
  fecha: string;
  estado: string;
  respuesta_dada?: string | null;
  respondido_por?: string | null;
}

export const CerebroSigma = () => {
  const navigate = useNavigate();
  const { tienePermiso, loading: permLoading } = usePermisos();
  const Swal = (window as any).Swal;

  const [conocimientos, setConocimientos] = useState<ConocimientoItem[]>([]);
  const [preguntas, setPreguntas] = useState<PreguntaRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'conocimiento' | 'preguntas'>('preguntas');
  const [filtroEstadoPreguntas, setFiltroEstadoPreguntas] = useState<'todas' | 'pendientes' | 'resueltas'>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchPreguntas, setSearchPreguntas] = useState('');

  // Paginación de preguntas
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(15);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formId, setFormId] = useState('');
  const [formTema, setFormTema] = useState('');
  const [formClaves, setFormClaves] = useState('');
  const [formRespuesta, setFormRespuesta] = useState('');
  const [formAccionTipo, setFormAccionTipo] = useState('');
  const [formAccionValor, setFormAccionValor] = useState('');
  const [formRoles, setFormRoles] = useState('');
  const [formTitle, setFormTitle] = useState('Enseñar a Sigma');
  const [preguntaActivaId, setPreguntaActivaId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const isRestricted = !permLoading && !tienePermiso('Cerebro de Sigma', 'ver');
  const canEdit = tienePermiso('Cerebro de Sigma', 'editar') || tienePermiso('Cerebro de Sigma', 'crear') || tienePermiso('Cerebro de Sigma', 'modificar');

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // 1. Cargar Base de Conocimiento
      const { data: dataConocimiento, error: errorConocimiento } = await supabase
        .from('sigma_conocimiento')
        .select('*')
        .order('creado_en', { ascending: false });

      if (errorConocimiento) throw errorConocimiento;
      setConocimientos(dataConocimiento || []);

      // 2. Cargar TODAS las Preguntas Registradas (Sin borrar ni excluir)
      const { data: dataPreguntas, error: errorPreguntas } = await supabase
        .from('sigma_preguntas_pendientes')
        .select('*')
        .order('fecha', { ascending: false });

      if (errorPreguntas) {
        console.warn("No se pudo cargar la tabla sigma_preguntas_pendientes.");
      } else {
        const enrichedPreguntas = (dataPreguntas || []).map((p: any) => {
          const matchConocimiento = (dataConocimiento || []).find((c: any) => {
            if (!c || !p || !p.pregunta) return false;
            const pLower = (p.pregunta || '').toLowerCase();
            const cTema = (c.tema || '').toLowerCase();
            const matchTema = cTema && pLower && cTema === pLower;
            const matchKeywords = Array.isArray(c.palabras_clave) && c.palabras_clave.some((k: any) => typeof k === 'string' && pLower.includes(k.toLowerCase()));
            return matchTema || matchKeywords;
          });
          const sug = generarSugerenciaRespuesta(p?.pregunta || '');
          return {
            ...p,
            respuesta_dada: p.respuesta_dada || (matchConocimiento ? matchConocimiento.respuesta : sug.respuesta)
          };
        });
        setPreguntas(enrichedPreguntas);
      }
    } catch (e: any) {
      console.error(e);
      if (Swal) Swal.fire("Error", "No se pudo cargar el conocimiento de Sigma.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permLoading && tienePermiso('Cerebro de Sigma', 'ver')) {
      cargarDatos();
    }
  }, [permLoading]);

  useEffect(() => {
    const handlePendingRefresh = () => {
      if (!permLoading && tienePermiso('Cerebro de Sigma', 'ver')) {
        cargarDatos();
      }
    };
    window.addEventListener('sigae-sigma-pending-refresh', handlePendingRefresh);
    return () => {
      window.removeEventListener('sigae-sigma-pending-refresh', handlePendingRefresh);
    };
  }, [permLoading]);

  // Generador de sugerencia de respuesta inteligente
  const generarSugerenciaRespuesta = (textoPregunta: string) => {
    const p = (textoPregunta || '').toLowerCase();
    
    if (p.includes('cupo') || p.includes('inscribir') || p.includes('inscripcion') || p.includes('año') || p.includes('grado')) {
      if (p.includes('regular') || p.includes('ya esta') || p.includes('ya está') || p.includes('pasar de')) {
        return {
          respuesta: "¡Hola {nombre}! Si tu representado ya es alumno regular de la institución, NO necesitas solicitar cupo de nuevo ingreso. Solo debes ingresar al módulo de Actualización de Datos para ratificar su inscripción del nuevo año escolar.",
          accionTipo: "navegar",
          accionValor: "/categoria/Gestión%20Estudiantil"
        };
      }
      return {
        respuesta: "¡Hola {nombre}! Para solicitar un cupo de nuevo ingreso, ingresa al módulo Solicitud de Cupos y completa los 4 pasos guiados: 1) Datos del Representante, 2) Datos del Alumno, 3) Recaudos y 4) Confirmación.",
        accionTipo: "navegar",
        accionValor: "/categoria/Gestión%20Estudiantil"
      };
    }

    if (p.includes('tiempo') || p.includes('status') || p.includes('estatus') || p.includes('esperar') || p.includes('aprobacion') || p.includes('aprobación') || p.includes('dura')) {
      return {
        respuesta: "¡Hola {nombre}! El tiempo estimado de evaluación de las solicitudes de cupo es de 3 a 5 días hábiles. Puedes verificar el estado en tiempo real de tu trámite en el módulo Mis Solicitudes.",
        accionTipo: "navegar",
        accionValor: "/categoria/Gestión%20Estudiantil"
      };
    }

    if (p.includes('vincular') || p.includes('sincroniz') || p.includes('hija') || p.includes('hijo') || p.includes('no me sale')) {
      return {
        respuesta: "¡Hola {nombre}! Para que tus hijos aparezcan vinculados en tu panel principal, la institución debe formalizar la vinculación en el módulo Vincular Estudiante. Verifica que tu cédula coincida exactamente con la registrada en la ficha del alumno.",
        accionTipo: "navegar",
        accionValor: "/categoria/Gestión%20Estudiantil"
      };
    }

    if (p.includes('app') || p.includes('descargar') || p.includes('instalar') || p.includes('apk')) {
      return {
        respuesta: "¡Hola {nombre}! Puedes descargar la aplicación oficial de SIGAE para Android (APK/PWA) o computadoras Windows en el módulo Instalación y Descargas.",
        accionTipo: "navegar",
        accionValor: "/categoria/Dirección%20y%20Sistema"
      };
    }

    if (p.includes('partida') || p.includes('nacimiento') || p.includes('recaudo') || p.includes('documento') || p.includes('foto') || p.includes('soporte')) {
      return {
        respuesta: "¡Hola {nombre}! En el paso de Recaudos y Documentos puedes tomar una foto nítida o adjuntar un archivo JPG o PDF de la Partida de Nacimiento o Cédula. Luego pulsa el botón 'Siguiente' al pie del formulario para guardar y avanzar.",
        accionTipo: "navegar",
        accionValor: "/categoria/Gestión%20Estudiantil"
      };
    }

    return {
      respuesta: "¡Hola {nombre}! Con gusto te oriento sobre esta consulta. Puedes acceder al módulo correspondiente en el menú del sistema o contactar a la coordinación escolar.",
      accionTipo: "",
      accionValor: ""
    };
  };

  // ── DESCARGA DE PREGUNTAS A EXCEL / CSV CON SUGERENCIAS ASISTIDAS ──
  const descargarPreguntasExcel = (formato: 'xlsx' | 'csv' = 'xlsx') => {
    const wsData: any[][] = [
      [
        'ID_Pregunta',
        'Pregunta_Usuario',
        'Fecha_Registro',
        'Estado',
        'Palabras_Clave_Sugeridas',
        'Respuesta_Oficial',
        'Accion_Tipo',
        'Modulo_Destino'
      ]
    ];

    preguntas.forEach(p => {
      const sugeridas = (p.pregunta || '')
        .toLowerCase()
        .replace(/[¿?¡!.,:;]/g, '')
        .split(' ')
        .filter(w => w.length > 3)
        .join(', ');

      const { respuesta, accionTipo, accionValor } = generarSugerenciaRespuesta(p?.pregunta || '');

      wsData.push([
        p.id,
        p.pregunta || '',
        p.fecha ? new Date(p.fecha).toISOString().replace('T', ' ').substring(0, 19) : '',
        p.estado || 'pendiente',
        sugeridas || p.pregunta || '',
        p.respuesta_dada || respuesta,
        accionTipo || 'navegar',
        accionValor || '/categoria/Gestión%20Estudiantil'
      ]);
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const nombreArchivo = `Preguntas_Sigma_SIGAE_${timestamp}`;

    if (formato === 'xlsx') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, "Preguntas");
      XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
    } else {
      const csvContent = wsData.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(';')).join('\n') + '\n';
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${nombreArchivo}.csv`;
      link.click();
    }

    if (Swal) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `Exportadas ${preguntas.length} preguntas en formato ${formato.toUpperCase()}`,
        showConfirmButton: false,
        timer: 2500
      });
    }
  };

  // ── IMPORTADOR MASIVO DE RESPUESTAS EXCEL / CSV ──
  const abrirImportadorRespuestas = () => {
    if (!canEdit) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para importar respuestas.', 'error');
      return;
    }

    if (!Swal) return;

    Swal.fire({
      title: '<div class="d-flex align-items-center justify-content-center gap-2 text-primary"><i class="bi bi-file-earmark-arrow-up-fill fs-3"></i><span>Cargar Respuestas Masivas</span></div>',
      html: `
        <div class="text-start">
          <p class="small text-muted mb-2">Sube tu archivo de <b>Excel (.xlsx, .xls) o CSV (.csv)</b> con las preguntas y respuestas revisadas.</p>
          <p class="extra-small text-muted mb-3">El sistema actualizará el estado de cada pregunta a <b>Respondida</b> e integrará las respuestas a la memoria inteligente de Sigma.</p>
          <div class="d-flex gap-2 mb-3 justify-content-center">
            <button type="button" id="btn-dl-preguntas-xlsx" class="btn btn-sm btn-outline-success rounded-pill fw-bold px-3"><i class="bi bi-file-earmark-excel-fill me-1"></i> Descargar Excel Actual (.xlsx)</button>
            <button type="button" id="btn-dl-preguntas-csv" class="btn btn-sm btn-outline-secondary rounded-pill fw-bold px-3"><i class="bi bi-filetype-csv me-1"></i> Descargar CSV (.csv)</button>
          </div>
          <input type="file" id="file-respuestas-sigma" class="form-control border-primary rounded-3" accept=".xlsx,.xls,.ods,.csv,.txt">
        </div>`,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-cloud-upload-fill me-1"></i> Procesar Respuestas',
      confirmButtonColor: '#6366f1',
      cancelButtonColor: '#64748b',
      didOpen: () => {
        document.getElementById('btn-dl-preguntas-xlsx')?.addEventListener('click', () => descargarPreguntasExcel('xlsx'));
        document.getElementById('btn-dl-preguntas-csv')?.addEventListener('click', () => descargarPreguntasExcel('csv'));
      },
      preConfirm: () => {
        const fileInput = document.getElementById('file-respuestas-sigma') as HTMLInputElement;
        const file = fileInput?.files ? fileInput.files[0] : null;
        if (!file) {
          Swal.showValidationMessage('Debes seleccionar un archivo Excel o CSV');
          return false;
        }
        return file;
      }
    }).then((res: any) => {
      if (res.isConfirmed && res.value) {
        procesarArchivoRespuestas(res.value);
      }
    });
  };

  const procesarArchivoRespuestas = (file: File) => {
    const isExcelOrOds = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.ods');
    
    const procesarFilas = (rows: any[][]) => {
      if (!rows || rows.length <= 1) {
        if (Swal) Swal.fire('Archivo Vacío', 'El archivo no contiene filas de datos.', 'warning');
        return;
      }

      // Detectar índices de columnas en la cabecera
      const header = rows[0].map((h: any) => String(h || '').toLowerCase().trim());
      const idxId = header.findIndex((h: string) => h.includes('id'));
      const idxPregunta = header.findIndex((h: string) => h.includes('pregunta'));
      const idxClaves = header.findIndex((h: string) => h.includes('clave') || h.includes('palabra'));
      const idxRespuesta = header.findIndex((h: string) => h.includes('respuesta'));
      const idxAccionTipo = header.findIndex((h: string) => h.includes('accion') && !h.includes('destino'));
      const idxAccionDestino = header.findIndex((h: string) => h.includes('destino') || h.includes('modulo') || h.includes('valor'));

      const preguntasActualizar: any[] = [];
      const conocimientosInsertar: any[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const idPregunta = idxId >= 0 && row[idxId] ? String(row[idxId]).trim() : null;
        const preguntaTexto = idxPregunta >= 0 && row[idxPregunta] ? String(row[idxPregunta]).trim() : (row[1] ? String(row[1]).trim() : '');
        const clavesStr = idxClaves >= 0 && row[idxClaves] ? String(row[idxClaves]).trim() : preguntaTexto;
        const respuestaTexto = idxRespuesta >= 0 && row[idxRespuesta] ? String(row[idxRespuesta]).trim() : (row[5] ? String(row[5]).trim() : '');
        const accionTipo = idxAccionTipo >= 0 && row[idxAccionTipo] ? String(row[idxAccionTipo]).trim() : 'navegar';
        const accionDestino = idxAccionDestino >= 0 && row[idxAccionDestino] ? String(row[idxAccionDestino]).trim() : '/categoria/Gestión%20Estudiantil';

        if (preguntaTexto && respuestaTexto) {
          const palabras_clave = clavesStr.split(',').map((k: string) => k.trim().toLowerCase()).filter(Boolean);

          if (idPregunta) {
            preguntasActualizar.push({
              id: idPregunta,
              estado: 'resuelta',
              respuesta_dada: respuestaTexto,
              respondido_por: 'Administrador (Carga Masiva)'
            });
          }

          conocimientosInsertar.push({
            tema: preguntaTexto,
            palabras_clave: palabras_clave.length > 0 ? palabras_clave : [preguntaTexto.toLowerCase()],
            respuesta: respuestaTexto,
            accion_tipo: accionTipo || null,
            accion_valor: accionDestino || null,
            roles_permitidos: []
          });
        }
      }

      guardarRespuestasMasivas(preguntasActualizar, conocimientosInsertar);
    };

    if (isExcelOrOds) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
          procesarFilas(rows);
        } catch (err: any) {
          console.error(err);
          if (Swal) Swal.fire('Error', 'No se pudo leer el archivo Excel.', 'error');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const text = e.target.result;
        const lines = text.split(/\r?\n/);
        const rows = lines.map((l: string) => l.split(/[;,]/));
        procesarFilas(rows);
      };
      reader.readAsText(file, 'utf-8');
    }
  };

  const guardarRespuestasMasivas = async (preguntasUpdate: any[], conocimientosInsert: any[]) => {
    if (conocimientosInsert.length === 0) {
      if (Swal) Swal.fire('Sin Datos', 'No se encontraron filas con respuestas para procesar.', 'warning');
      return;
    }

    setLoading(true);
    try {
      // 1. Insertar en sigma_conocimiento
      if (conocimientosInsert.length > 0) {
        const { error: errC } = await supabase
          .from('sigma_conocimiento')
          .insert(conocimientosInsert);
        if (errC) console.warn("Aviso insertando conocimiento masivo:", errC);
      }

      // 2. Actualizar estado en sigma_preguntas_pendientes
      if (preguntasUpdate.length > 0) {
        const { error: errP } = await supabase
          .from('sigma_preguntas_pendientes')
          .upsert(preguntasUpdate, { onConflict: 'id' });
        if (errP) console.warn("Aviso actualizando preguntas:", errP);
      }

      auditar('Cerebro de Sigma', 'Carga Masiva de Respuestas', `Se procesaron ${conocimientosInsert.length} respuestas y conocimientos.`);
      window.dispatchEvent(new CustomEvent('sigae-sigma-refresh'));
      await cargarDatos();

      if (Swal) {
        Swal.fire({
          icon: 'success',
          title: '¡Respuestas Cargadas y Entrenadas!',
          html: `<p class="mb-2">Se procesaron exitosamente <b>${conocimientosInsert.length}</b> preguntas y respuestas.</p><p class="text-muted extra-small mb-0">Sigma ahora responderá automáticamente a todas estas intenciones en el sistema.</p>`,
          confirmButtonColor: '#6366f1'
        });
      }
    } catch (e: any) {
      console.error(e);
      if (Swal) Swal.fire('Error', e.message || 'Error al guardar en la base de datos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalNuevo = () => {
    if (!canEdit) {
      if (Swal) Swal.fire("Acceso Denegado", "No tienes permisos para modificar el cerebro de Sigma.", "error");
      return;
    }
    setPreguntaActivaId(null);
    setFormId('');
    setFormTema('');
    setFormClaves('');
    setFormRespuesta('');
    setFormAccionTipo('');
    setFormAccionValor('');
    setFormRoles('');
    setFormTitle('Enseñar Nueva Intención a Sigma');
    setModalOpen(true);
  };

  const abrirModalEditar = (item: ConocimientoItem) => {
    if (!canEdit) {
      if (Swal) Swal.fire("Acceso Denegado", "No tienes permisos para modificar el cerebro de Sigma.", "error");
      return;
    }
    setPreguntaActivaId(null);
    setFormId(item.id);
    setFormTema(item.tema);
    setFormClaves((item.palabras_clave || []).join(', '));
    setFormRespuesta(item.respuesta);
    setFormAccionTipo(item.accion_tipo || '');
    setFormAccionValor(item.accion_valor || '');
    setFormRoles((item.roles_permitidos || []).join(', '));
    setFormTitle('Editar Conocimiento de Sigma');
    setModalOpen(true);
  };

  const responderPregunta = (item: PreguntaRegistro) => {
    if (!canEdit) {
      if (Swal) Swal.fire("Acceso Denegado", "No tienes permisos para responder preguntas.", "error");
      return;
    }
    setPreguntaActivaId(item.id);
    setFormId('');
    setFormTema(item.pregunta);
    
    // Sugerencias automáticas
    const sugeridas = item.pregunta
      .toLowerCase()
      .replace(/[¿?¡!.,:;]/g, '')
      .split(' ')
      .filter(w => w.length > 3)
      .join(', ');
    
    const { respuesta, accionTipo, accionValor } = generarSugerenciaRespuesta(item.pregunta);

    setFormClaves(sugeridas || item.pregunta);
    setFormRespuesta(item.respuesta_dada || respuesta);
    setFormAccionTipo(accionTipo);
    setFormAccionValor(accionValor);
    setFormRoles('');
    setFormTitle('Responder a Pregunta del Usuario');
    setModalOpen(true);
  };

  const guardar = async () => {
    const tema = formTema.trim();
    const clavesStr = formClaves.trim();
    const respuesta = formRespuesta.trim();

    if (!tema || !clavesStr || !respuesta) {
      if (Swal) Swal.fire('Atención', 'Tema, Palabras Clave y Respuesta son obligatorios.', 'warning');
      return;
    }

    const palabras_clave = clavesStr.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
    const roles_permitidos = formRoles.trim() ? formRoles.split(',').map(s => s.trim().toLowerCase()).filter(s => s) : [];

    const payload = {
      tema,
      palabras_clave,
      respuesta,
      accion_tipo: formAccionTipo || null,
      accion_valor: formAccionValor.trim() || null,
      roles_permitidos
    };

    setGuardando(true);
    try {
      if (formId) {
        const { error } = await supabase.from('sigma_conocimiento').update(payload).eq('id', formId);
        if (error) throw error;
        await auditar('Cerebro de Sigma', 'Actualizar Conocimiento', `Tema: ${tema}`);
      } else {
        const { error } = await supabase.from('sigma_conocimiento').insert([payload]);
        if (error) throw error;
        await auditar('Cerebro de Sigma', 'Nuevo Conocimiento', `Tema: ${tema}`);
      }

      // Si viene de resolver una pregunta, marcarla resuelta pero mantenerla en el historial
      if (preguntaActivaId) {
        let userNombre = 'Administrador';
        try {
          const userStr = localStorage.getItem('usuario_sigae');
          if (userStr) {
            const u = JSON.parse(userStr);
            userNombre = u.nombre_completo || u.nombre || u.nombres || 'Administrador';
          }
        } catch (e) {}
        
        await supabase
          .from('sigma_preguntas_pendientes')
          .update({ 
            estado: 'resuelta',
            respuesta_dada: respuesta,
            respondido_por: userNombre
          })
          .eq('id', preguntaActivaId);
      }

      setModalOpen(false);
      if (Swal) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Respuesta guardada y entrenada en Sigma',
          showConfirmButton: false,
          timer: 2000
        });
      }

      window.dispatchEvent(new CustomEvent('sigae-sigma-refresh'));
      cargarDatos();
    } catch (e: any) {
      console.error(e);
      if (Swal) Swal.fire('Error', e.message || 'No se pudo guardar el conocimiento.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarConocimiento = (id: string) => {
    if (!tienePermiso('Cerebro de Sigma', 'eliminar')) {
      if (Swal) Swal.fire("Acceso Denegado", "No tienes permisos para eliminar conocimientos.", "error");
      return;
    }

    if (!Swal) return;

    Swal.fire({
      title: '<div class="text-danger d-flex align-items-center justify-content-center gap-2"><i class="bi bi-trash3-fill fs-3"></i><span>¿Olvidar Conocimiento?</span></div>',
      html: '<p class="text-muted small mb-0">Sigma dejará de responder a estas intenciones y palabras clave.</p>',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, olvidar',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        try {
          const { error } = await supabase.from('sigma_conocimiento').delete().eq('id', id);
          if (error) throw error;
          
          await auditar('Cerebro de Sigma', 'Olvidar Conocimiento', `ID: ${id}`);
          
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Conocimiento olvidado',
            showConfirmButton: false,
            timer: 2000
          });

          window.dispatchEvent(new CustomEvent('sigae-sigma-refresh'));
          cargarDatos();
        } catch (e: any) {
          console.error(e);
          Swal.fire('Error', e.message || 'No se pudo eliminar.', 'error');
        }
      }
    });
  };

  const reabrirPregunta = async (id: string) => {
    try {
      await supabase
        .from('sigma_preguntas_pendientes')
        .update({ estado: 'pendiente' })
        .eq('id', id);

      cargarDatos();
      if (Swal) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Pregunta marcada como pendiente', showConfirmButton: false, timer: 1500 });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filtrado de conocimientos
  const filteredConocimientos = useMemo(() => {
    const term = (searchTerm || '').toLowerCase().trim();
    return conocimientos.filter(item => {
      if (!item) return false;
      const tema = (item.tema || '').toLowerCase();
      const resp = (item.respuesta || '').toLowerCase();
      const claves = Array.isArray(item.palabras_clave) ? item.palabras_clave.join(', ').toLowerCase() : '';
      return !term || tema.includes(term) || resp.includes(term) || claves.includes(term);
    });
  }, [conocimientos, searchTerm]);

  // Filtrado de preguntas por estado y buscador
  const filteredPreguntas = useMemo(() => {
    const term = searchPreguntas.toLowerCase().trim();
    return preguntas.filter(p => {
      if (!p) return false;
      const matchEstado =
        filtroEstadoPreguntas === 'todas' ? true :
        filtroEstadoPreguntas === 'pendientes' ? p.estado === 'pendiente' :
        p.estado === 'resuelta';

      const matchText = !term || (p.pregunta || '').toLowerCase().includes(term) || (p.respuesta_dada || '').toLowerCase().includes(term);

      return matchEstado && matchText;
    });
  }, [preguntas, filtroEstadoPreguntas, searchPreguntas]);

  // Paginación de preguntas
  const totalPaginas = Math.ceil(filteredPreguntas.length / itemsPorPagina) || 1;
  const preguntasPaginadas = useMemo(() => {
    const start = (paginaActual - 1) * itemsPorPagina;
    return filteredPreguntas.slice(start, start + itemsPorPagina);
  }, [filteredPreguntas, paginaActual, itemsPorPagina]);

  const totalPendientes = preguntas.filter(p => p.estado === 'pendiente').length;
  const totalResueltas = preguntas.filter(p => p.estado === 'resuelta').length;

  if (permLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando asistente Sigma...</span>
        </div>
      </div>
    );
  }

  if (isRestricted) {
    return (
      <div className="col-12 text-center py-5 mt-4">
        <div className="bg-light d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm border" style={{ width: '100px', height: '100px' }}>
          <i className="bi bi-shield-lock-fill text-muted" style={{ fontSize: '3.5rem' }}></i>
        </div>
        <h4 className="text-dark fw-bold mb-2">Área Restringida</h4>
        <p className="text-muted mb-0">No tienes permisos asignados para acceder a la configuración del Cerebro de Sigma.</p>
      </div>
    );
  }

  return (
    <div className="modulo-animado container-fluid p-0 animate__animated animate__fadeIn">

      {/* 1. Miga de Pan Chamilo */}
      <ChamiloBreadcrumb
        category="Dirección y Sistema"
        currentModule="Cerebro de Sigma"
      />

      {/* 2. Cuadro de Ayuda Metodológica Chamilo */}
      <ChamiloHelpCallout
        id="ayuda_cerebro_sigma_chamilo"
        title="Historial de Consultas de Usuarios y Memoria de Sigma"
        content="Supervise el registro histórico completo de todas las preguntas formuladas por la comunidad escolar. Puede descargar el archivo Excel completo, responderlas con asistencia de IA y volver a cargar el lote para entrenar la memoria de Sigma en un solo clic."
        icon="bi-robot"
      />

      {/* ── 3. CABECERA INSTITUCIONAL CON MÉTRICAS EN VIVO (Estilo Dirección y Sistema) ── */}
      <div 
        className="tech-card overflow-hidden mb-4 shadow-sm animate__animated animate__fadeInDown"
        style={{
          border: '2px solid #fed7aa',
          borderTop: '6px solid #FF8D00',
          background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 45%, #ffedd5 100%)',
          borderRadius: '26px'
        }}
      >
        <div className="p-3 p-sm-4 p-md-4">
          <div className="row align-items-center g-3 g-md-4">
            
            {/* Ícono de Cerebro Sigma */}
            <div className="col-12 col-md-auto text-center text-md-start">
              <div 
                className="tech-icon-wrapper bg-white shadow-sm d-inline-flex align-items-center justify-content-center p-1 overflow-hidden"
                style={{ 
                  width: '100px', 
                  height: '100px', 
                  borderRadius: '24px', 
                  border: '2.5px solid #fed7aa',
                  boxShadow: '0 10px 24px rgba(249, 115, 22, 0.15)'
                }}
              >
                <SigmaFiguraVisual style={{ width: '82px', height: '96px' }} />
              </div>
            </div>

            {/* Título y Métricas Clave */}
            <div className="col-12 col-md text-center text-md-start">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-2 flex-wrap">
                <span 
                  className="badge text-white fw-bold px-3 py-1.5 rounded-pill shadow-xs d-inline-flex align-items-center gap-1.5"
                  style={{ backgroundColor: '#FF8D00', fontSize: '0.78rem' }}
                >
                  <i className="bi bi-stars"></i>Asistente Virtual SIGMA
                </span>

                <div 
                  className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill bg-white border shadow-xs"
                  style={{ borderColor: '#fed7aa' }}
                >
                  <span className="status-beacon-live" style={{ color: '#ea580c' }}></span>
                  <span 
                    className="extra-small fw-bold text-uppercase" 
                    style={{ fontSize: '0.72rem', color: '#c2410c', letterSpacing: '0.5px' }}
                  >
                    Campus Conectado &bull; SIGAE v1.1
                  </span>
                </div>

                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs" style={{ borderColor: '#fed7aa' }}>
                  <i className="bi bi-chat-left-dots text-primary me-1"></i><b>{preguntas.length}</b> Preguntas
                </span>
                <span className={`badge px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs ${totalPendientes > 0 ? 'bg-warning text-dark' : 'bg-white text-success border'}`} style={{ borderColor: '#fed7aa' }}>
                  <i className={`bi ${totalPendientes > 0 ? 'bi-hourglass-split' : 'bi-check-circle-fill'} me-1`}></i>
                  <b>{totalPendientes}</b> Por Responder
                </span>
                <span className="badge bg-white text-success border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs" style={{ borderColor: '#fed7aa' }}>
                  <i className="bi bi-check2-all text-success me-1"></i><b>{totalResueltas}</b> Respondidas
                </span>
                <span className="badge bg-white text-muted border px-2.5 py-1.5 rounded-pill small shadow-xs" style={{ borderColor: '#fed7aa' }}>
                  <i className="bi bi-brain me-1" style={{ color: '#ea580c' }}></i>{conocimientos.length} Intenciones
                </span>
              </div>

              <h1 className="fw-bolder mb-1 text-dark fs-3 fs-md-2" style={{ letterSpacing: '-0.5px' }}>
                Historial de Consultas y Aprendizaje de SIGMA
              </h1>

              <p className="mb-0 text-muted small" style={{ maxWidth: '800px' }}>
                Bandeja integral de preguntas realizadas por la comunidad para responderlas y entrenar a la asistente virtual e inteligencia artificial del plantel.
              </p>
            </div>

            {/* Acciones Rápidas */}
            <div className="col-12 col-md-auto text-md-end text-center">
              <div className="d-flex flex-column align-items-md-end align-items-center gap-2">
                <div className="d-flex align-items-center gap-1.5 flex-wrap justify-content-center">
                  <button
                    type="button"
                    onClick={() => navigate('/categoria/Direcci%C3%B3n%20y%20Sistema')}
                    className="btn btn-white bg-white text-dark rounded-pill px-3.5 py-2 fw-bold shadow-xs hover-efecto border d-inline-flex align-items-center gap-1.5"
                    style={{ borderColor: '#fed7aa', fontSize: '0.82rem' }}
                  >
                    <i className="bi bi-arrow-left" style={{ color: '#ea580c' }}></i>
                    <span>Volver a Dirección</span>
                  </button>

                  {/* Botón Descargar Excel */}
                  <button
                    type="button"
                    onClick={() => descargarPreguntasExcel('xlsx')}
                    className="btn btn-success rounded-pill px-3.5 py-2 fw-bold shadow-xs hover-efecto d-flex align-items-center gap-1.5 text-white"
                    style={{ fontSize: '0.82rem' }}
                    title="Descargar todas las preguntas con respuestas sugeridas en Excel"
                  >
                    <i className="bi bi-file-earmark-excel-fill"></i>
                    <span>Descargar Excel</span>
                  </button>

                  {/* Botón Cargar Respuestas */}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={abrirImportadorRespuestas}
                      className="btn btn-white bg-white text-dark border rounded-pill px-3.5 py-2 fw-bold shadow-xs hover-efecto d-flex align-items-center gap-1.5"
                      style={{ borderColor: '#fed7aa', fontSize: '0.82rem' }}
                      title="Subir archivo Excel con respuestas revisadas"
                    >
                      <i className="bi bi-cloud-arrow-up-fill" style={{ color: '#ea580c' }}></i>
                      <span>Cargar Respuestas</span>
                    </button>
                  )}

                  {canEdit && (
                    <button
                      type="button"
                      onClick={abrirModalNuevo}
                      className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-xs hover-efecto d-flex align-items-center gap-1.5 text-white"
                      style={{ backgroundColor: '#FF8D00', borderColor: '#FF8D00', fontSize: '0.82rem' }}
                    >
                      <i className="bi bi-plus-lg"></i>
                      <span>Nueva Intención</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Barra de Pestañas Principal con Desplazamiento Táctil */}
        <div 
          className="px-3 px-md-4 py-2.5 py-md-3 bg-white border-top d-flex justify-content-between align-items-center flex-wrap gap-2"
          style={{ borderColor: '#fed7aa' }}
        >
          <div 
            className="d-flex align-items-center gap-1.5 overflow-x-auto pb-1 pb-md-0 w-100 w-md-auto flex-nowrap"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('preguntas')}
              className={`btn btn-xs rounded-pill px-3.5 py-1.5 fw-bold transition-all text-nowrap ${
                activeTab === 'preguntas' ? 'text-white shadow-xs' : 'btn-white bg-white text-muted border'
              }`}
              style={{ 
                backgroundColor: activeTab === 'preguntas' ? '#FF8D00' : undefined, 
                borderColor: activeTab === 'preguntas' ? '#FF8D00' : '#fed7aa', 
                fontSize: '0.82rem' 
              }}
            >
              <i className="bi bi-chat-dots-fill me-1.5"></i>Bandeja de Preguntas ({preguntas.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('conocimiento')}
              className={`btn btn-xs rounded-pill px-3.5 py-1.5 fw-bold transition-all text-nowrap ${
                activeTab === 'conocimiento' ? 'text-white shadow-xs' : 'btn-white bg-white text-muted border'
              }`}
              style={{ 
                backgroundColor: activeTab === 'conocimiento' ? '#FF8D00' : undefined, 
                borderColor: activeTab === 'conocimiento' ? '#FF8D00' : '#fed7aa', 
                fontSize: '0.82rem' 
              }}
            >
              <i className="bi bi-brain me-1.5"></i>Memoria Entrenada ({conocimientos.length})
            </button>
          </div>

          {/* Buscador Dinámico según Pestaña */}
          <div className="w-100 w-md-auto mt-2 mt-md-0" style={{ minWidth: '220px', maxWidth: '340px' }}>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white border-end-0 rounded-start-pill text-muted">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                value={activeTab === 'preguntas' ? searchPreguntas : searchTerm}
                onChange={(e) => {
                  if (activeTab === 'preguntas') {
                    setSearchPreguntas(e.target.value);
                    setPaginaActual(1);
                  } else {
                    setSearchTerm(e.target.value);
                  }
                }}
                className="form-control bg-white border-start-0 rounded-end-pill"
                placeholder={activeTab === 'preguntas' ? "Buscar entre las 331 preguntas..." : "Buscar intención o respuesta..."}
              />
              {(activeTab === 'preguntas' ? searchPreguntas : searchTerm) && (
                <button
                  type="button"
                  onClick={() => activeTab === 'preguntas' ? setSearchPreguntas('') : setSearchTerm('')}
                  className="btn btn-sm btn-white border-start-0 text-muted"
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. CONTENIDO PRINCIPAL: BANDEJA DE PREGUNTAS O BASE DE CONOCIMIENTO ── */}
      {loading ? (
        <div className="text-center py-5 text-muted">
          <div className="spinner-border text-primary mb-3" role="status"></div>
          <div>Cargando consultas de usuarios...</div>
        </div>
      ) : (
        <div className="mb-5">
          
          {/* TAB 1: BANDEJA DE PREGUNTAS DE USUARIOS CON FILTROS Y RESPUESTA ASISTIDA */}
          {activeTab === 'preguntas' && (
            <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
              <div className="card-header bg-white p-3.5 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                
                {/* Subfiltros de estado */}
                <div className="d-flex align-items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => { setFiltroEstadoPreguntas('todas'); setPaginaActual(1); }}
                    className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${
                      filtroEstadoPreguntas === 'todas' ? 'btn-dark text-white' : 'btn-light text-muted border'
                    }`}
                    style={{ fontSize: '0.78rem' }}
                  >
                    Todas ({preguntas.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFiltroEstadoPreguntas('pendientes'); setPaginaActual(1); }}
                    className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${
                      filtroEstadoPreguntas === 'pendientes' ? 'btn-warning text-dark' : 'btn-light text-muted border'
                    }`}
                    style={{ fontSize: '0.78rem' }}
                  >
                    Pendientes ({totalPendientes})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFiltroEstadoPreguntas('resueltas'); setPaginaActual(1); }}
                    className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${
                      filtroEstadoPreguntas === 'resueltas' ? 'btn-success text-white' : 'btn-light text-muted border'
                    }`}
                    style={{ fontSize: '0.78rem' }}
                  >
                    Respondidas ({totalResueltas})
                  </button>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {/* Botón Descarga Rápida */}
                  <button
                    type="button"
                    onClick={() => descargarPreguntasExcel('xlsx')}
                    className="btn btn-xs btn-outline-success rounded-pill px-2.5 py-1 fw-bold d-flex align-items-center gap-1"
                    style={{ fontSize: '0.76rem' }}
                  >
                    <i className="bi bi-download"></i>
                    <span>Exportar Excel</span>
                  </button>

                  <span className="extra-small text-muted">
                    Mostrando {preguntasPaginadas.length} de {filteredPreguntas.length} preguntas
                  </span>
                  <select
                    value={itemsPorPagina}
                    onChange={(e) => { setItemsPorPagina(Number(e.target.value)); setPaginaActual(1); }}
                    className="form-select form-select-sm rounded-pill px-2 py-0.5 extra-small fw-bold"
                    style={{ width: '85px' }}
                  >
                    <option value={15}>15 / pág</option>
                    <option value={30}>30 / pág</option>
                    <option value={50}>50 / pág</option>
                    <option value={100}>100 / pág</option>
                  </select>
                </div>
              </div>

              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light text-muted extra-small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                      <tr>
                        <th className="ps-4 py-3" style={{ width: '40%' }}>Pregunta del Usuario</th>
                        <th className="py-3" style={{ width: '35%' }}>Respuesta Asignada / Estado</th>
                        <th className="py-3" style={{ width: '12%' }}>Fecha</th>
                        <th className="text-center pe-4 py-3" style={{ width: '13%' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preguntasPaginadas.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-5 text-muted">
                            <i className="bi bi-inbox fs-2 d-block mb-2 text-muted opacity-50"></i>
                            <span className="fw-bold">No se encontraron preguntas con el filtro seleccionado.</span>
                          </td>
                        </tr>
                      ) : (
                        preguntasPaginadas.map((item, idx) => {
                          const isPendiente = item.estado === 'pendiente';
                          const numItem = (paginaActual - 1) * itemsPorPagina + idx + 1;

                          return (
                            <tr key={item.id} className="hover-efecto">
                              <td className="ps-4 py-3 align-top">
                                <div className="d-flex align-items-start gap-2">
                                  <span className="badge bg-light text-muted border rounded-pill px-2 py-0.5 extra-small flex-shrink-0 mt-0.5">
                                    #{numItem}
                                  </span>
                                  <div>
                                    <div className="fw-bold text-dark mb-1" style={{ fontSize: '0.92rem' }}>
                                      {item.pregunta}
                                    </div>
                                    <span className={`badge ${isPendiente ? 'bg-warning text-dark' : 'bg-success text-white'} rounded-pill extra-small px-2 py-0.5`}>
                                      {isPendiente ? 'Pendiente' : 'Respondida'}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 align-top">
                                {item.respuesta_dada ? (
                                  <div className="small text-dark p-2 rounded-3 bg-light border" style={{ fontSize: '0.84rem', lineHeight: '1.4' }}>
                                    <div className="text-success fw-bold extra-small mb-1 d-flex align-items-center gap-1">
                                      <i className="bi bi-check-circle-fill"></i>
                                      <span>Respuesta Entrenada:</span>
                                    </div>
                                    {item.respuesta_dada}
                                  </div>
                                ) : (
                                  <div className="text-muted extra-small fst-italic p-2 rounded-3 bg-light bg-opacity-50">
                                    <i className="bi bi-info-circle me-1"></i>Sin respuesta personalizada aún. Pulsa el botón "Responder" para asignarle una solución.
                                  </div>
                                )}
                              </td>

                              <td className="py-3 align-top text-muted extra-small">
                                <div className="d-flex align-items-center gap-1">
                                  <i className="bi bi-calendar3"></i>
                                  <span>{new Date(item.fecha).toLocaleDateString()}</span>
                                </div>
                                <div className="text-muted mt-0.5">
                                  {new Date(item.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </td>

                              <td className="text-center pe-4 py-3 align-top">
                                {canEdit && (
                                  <div className="d-flex flex-column align-items-center gap-1">
                                    <button 
                                      className="btn btn-xs btn-primary rounded-pill shadow-xs px-3 py-1 fw-bold d-inline-flex align-items-center gap-1 w-100 justify-content-center hover-efecto" 
                                      onClick={() => responderPregunta(item)} 
                                      title="Responder y Enseñar a Sigma"
                                      style={{ fontSize: '0.78rem' }}
                                    >
                                      <i className="bi bi-reply-fill"></i>
                                      <span>{item.respuesta_dada ? 'Editar' : 'Responder'}</span>
                                    </button>

                                    {!isPendiente && (
                                      <button 
                                        className="btn btn-link btn-xs text-muted p-0 text-decoration-none extra-small"
                                        onClick={() => reabrirPregunta(item.id)}
                                        title="Marcar como pendiente"
                                      >
                                        Reabrir
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Paginador Chamilo */}
                {totalPaginas > 1 && (
                  <div className="p-3 bg-light border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <span className="extra-small text-muted">
                      Página <b>{paginaActual}</b> de <b>{totalPaginas}</b>
                    </span>

                    <div className="d-flex align-items-center gap-1">
                      <button
                        type="button"
                        disabled={paginaActual === 1}
                        onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                        className="btn btn-xs btn-white bg-white border rounded-pill px-3 py-1 fw-bold"
                        style={{ fontSize: '0.78rem' }}
                      >
                        <i className="bi bi-chevron-left me-1"></i>Anterior
                      </button>
                      <button
                        type="button"
                        disabled={paginaActual === totalPaginas}
                        onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                        className="btn btn-xs btn-white bg-white border rounded-pill px-3 py-1 fw-bold"
                        style={{ fontSize: '0.78rem' }}
                      >
                        Siguiente<i className="bi bi-chevron-right ms-1"></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BASE DE CONOCIMIENTO ENTRENADA */}
          {activeTab === 'conocimiento' && (
            <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
              <div className="card-header bg-white p-3.5 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h5 className="fw-bolder text-dark mb-0 d-flex align-items-center gap-2">
                    <i className="bi bi-journal-text text-primary"></i>
                    Intenciones y Reglas Semánticas
                  </h5>
                  <span className="extra-small text-muted">{filteredConocimientos.length} intenciones activas en la memoria de Sigma</span>
                </div>
              </div>

              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light text-muted extra-small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                      <tr>
                        <th className="ps-4 py-3">Tema y Destinatarios</th>
                        <th className="py-3">Palabras Clave Semánticas</th>
                        <th className="py-3">Respuesta y Acción Rápida</th>
                        <th className="text-center pe-4 py-3" style={{ width: '120px' }}>Opciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredConocimientos.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-5 text-muted">
                            <i className="bi bi-inbox fs-2 d-block mb-2 text-muted opacity-50"></i>
                            <span className="fw-bold">No se encontraron conocimientos registrados.</span>
                          </td>
                        </tr>
                      ) : (
                        filteredConocimientos.map((item) => {
                          const rolesBadges = (!item.roles_permitidos || item.roles_permitidos.length === 0) ? (
                            <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5 py-1 extra-small fw-bold">
                              <i className="bi bi-globe2 me-1"></i>Público General
                            </span>
                          ) : (
                            item.roles_permitidos.map((r, i) => (
                              <span key={i} className="badge bg-light text-dark border rounded-pill px-2 py-0.5 me-1 extra-small">{r}</span>
                            ))
                          );

                          return (
                            <tr key={item.id} className="hover-efecto">
                              <td className="ps-4 py-3">
                                <div className="fw-bold text-dark mb-1">{item.tema}</div>
                                <div className="d-flex align-items-center flex-wrap gap-1">{rolesBadges}</div>
                              </td>
                              <td className="py-3">
                                <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '320px' }}>
                                  {(item.palabras_clave || []).map((k, i) => (
                                    <span key={i} className="badge bg-light text-muted border rounded-pill px-2 py-0.5 extra-small">
                                      {k}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3">
                                <div className="small text-dark fw-normal mb-1" style={{ maxWidth: '420px', lineHeight: '1.4' }}>
                                  {item.respuesta}
                                </div>
                                {item.accion_tipo && (
                                  <div className="mt-1">
                                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2.5 py-1 extra-small fw-bold">
                                      <i className={`bi ${item.accion_tipo === 'navegar' ? 'bi-link-45deg' : 'bi-window'} me-1`}></i>
                                      Acción: {item.accion_valor}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="text-center pe-4 py-3">
                                <div className="d-flex align-items-center justify-content-center gap-1">
                                  {canEdit && (
                                    <button 
                                      className="btn btn-xs btn-light text-primary rounded-circle shadow-xs" 
                                      style={{ width: '32px', height: '32px' }}
                                      onClick={() => abrirModalEditar(item)} 
                                      title="Editar Conocimiento"
                                    >
                                      <i className="bi bi-pencil-square"></i>
                                    </button>
                                  )}
                                  {tienePermiso('Cerebro de Sigma', 'eliminar') && (
                                    <button 
                                      className="btn btn-xs btn-light text-danger rounded-circle shadow-xs" 
                                      style={{ width: '32px', height: '32px' }}
                                      onClick={() => eliminarConocimiento(item.id)} 
                                      title="Olvidar Conocimiento"
                                    >
                                      <i className="bi bi-trash3-fill"></i>
                                    </button>
                                  )}
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
          )}
        </div>
      )}

      {/* ── MODAL DE RESPUESTA Y ENTRENAMIENTO CHAMILO ── */}
      {modalOpen && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15,23,42,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              <div className="modal-header bg-light border-bottom p-3.5">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded-3 bg-primary bg-opacity-10 text-primary">
                    <i className="bi bi-robot fs-5"></i>
                  </div>
                  <h5 className="modal-title fw-bold text-dark mb-0">{formTitle}</h5>
                </div>
                <button type="button" className="btn-close" onClick={() => setModalOpen(false)} aria-label="Close"></button>
              </div>

              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label fw-bold small text-dark mb-1">
                    Pregunta o Tema de la Consulta <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="form-control rounded-3 fw-bold" 
                    placeholder="Ej: ¿Cómo solicitar un cupo para mi hijo?"
                    value={formTema}
                    onChange={(e) => setFormTema(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold small text-dark mb-1">
                    Palabras Clave Semánticas (separadas por coma) <span className="text-danger">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="form-control rounded-3" 
                    placeholder="Ej: cupo, solicitar, inscribir, requisitos, nuevo ingreso"
                    value={formClaves}
                    onChange={(e) => setFormClaves(e.target.value)}
                  />
                  <div className="extra-small text-muted mt-1">
                    <i className="bi bi-info-circle me-1"></i>Sigma reconocerá la intención cuando el usuario escriba estas palabras.
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold small text-dark mb-1">
                    Respuesta Oficial de Sigma <span className="text-danger">*</span>
                  </label>
                  <textarea 
                    className="form-control rounded-3" 
                    rows={4} 
                    placeholder="Escriba la respuesta pedagógica e institucional..."
                    value={formRespuesta}
                    onChange={(e) => setFormRespuesta(e.target.value)}
                  />
                  <div className="extra-small text-muted mt-1">
                    <i className="bi bi-code-slash me-1"></i>Puedes incluir <code>{"{nombre}"}</code> para personalizar la respuesta con el nombre del usuario.
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-dark mb-1">Acción Rápida Asignada</label>
                    <select 
                      className="form-select rounded-3"
                      value={formAccionTipo}
                      onChange={(e) => setFormAccionTipo(e.target.value)}
                    >
                      <option value="">Solo mensaje de texto (Sin acción)</option>
                      <option value="navegar">Navegar a un módulo del sistema</option>
                      <option value="abrir_modal">Abrir ventana modal</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small text-dark mb-1">Ruta o Destino de la Acción</label>
                    <input 
                      type="text" 
                      className="form-control rounded-3" 
                      placeholder="Ej: /categoria/Gestión%20Estudiantil"
                      value={formAccionValor}
                      onChange={(e) => setFormAccionValor(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-label fw-bold small text-dark mb-1">Roles con Permiso (Opcional)</label>
                  <input 
                    type="text" 
                    className="form-control rounded-3" 
                    placeholder="Ej: Administrador, Docente, Representante"
                    value={formRoles}
                    onChange={(e) => setFormRoles(e.target.value)}
                  />
                  <div className="extra-small text-muted mt-1">
                    Si lo dejas en blanco, cualquier usuario (incluyendo visitantes de la comunidad) recibirá esta respuesta.
                  </div>
                </div>
              </div>

              <div className="modal-footer bg-light border-top p-3 d-flex justify-content-between align-items-center">
                <button type="button" className="btn btn-light rounded-pill fw-bold text-muted px-4" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary rounded-pill fw-bold px-5 shadow-xs hover-efecto d-flex align-items-center gap-2" 
                  style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
                  disabled={guardando}
                  onClick={guardar}
                >
                  {guardando ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-floppy-fill"></i>
                      <span>Guardar y Entrenar a Sigma</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
