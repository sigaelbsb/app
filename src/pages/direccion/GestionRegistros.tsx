import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';
import { formatPhoneNumber } from '../../lib/formatters';
import { ChamiloBreadcrumb, ChamiloHelpCallout } from '../../components/chamilo';

interface Visitante {
  id_invitado: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  correo: string | null;
  telefono: string | null;
  razon_visita: string;
  escuela_id: string;
  created_at: string;
}

interface AuditLog {
  id: number;
  usuario_nombre: string;
  usuario_cedula: string;
  modulo: string;
  accion: string;
  detalles: string;
  fecha: string;
  escuela: string;
}

export const GestionRegistros = () => {
  const navigate = useNavigate();
  const { tienePermiso, tienePermisoEnEscuela, loading: permLoading } = usePermisos();
  const Swal = (window as any).Swal;

  // Active School Code / Dual access check
  const activeSchoolCode = localStorage.getItem('sigae_escuela_codigo') || 'sb';
  const hasSbAccess = tienePermisoEnEscuela('sb', 'Gestión de Registros', 'ver');
  const hasLbAccess = tienePermisoEnEscuela('lb', 'Gestión de Registros', 'ver');
  const isDualAccess = hasSbAccess && hasLbAccess;

  const [escuelaSeleccionada, setEscuelaSeleccionada] = useState<string>(
    isDualAccess ? activeSchoolCode : (hasSbAccess ? 'sb' : 'lb')
  );

  // Tabs
  const [activeTab, setActiveTab] = useState<'visitantes' | 'invitados_historial' | 'historial'>('visitantes');
  const [historialSearch, setHistorialSearch] = useState('');
  const [expandedCedula, setExpandedCedula] = useState<string | null>(null);

  // Visitor state
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [loadingVisitantes, setLoadingVisitantes] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'todas' | 'hoy' | 'semana' | 'mes'>('todas');

  // Check-in form state
  const [formCedula, setFormCedula] = useState('');
  const [formNombres, setFormNombres] = useState('');
  const [formApellidos, setFormApellidos] = useState('');
  const [formCorreo, setFormCorreo] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formRazon, setFormRazon] = useState('');
  const [registrando, setRegistrando] = useState(false);
  const [buscandoCedula, setBuscandoCedula] = useState(false);
  const [autocompletado, setAutocompletado] = useState(false);
  const [visitasAnteriores, setVisitasAnteriores] = useState(0);

  // Print Pass state
  const [selectedVisitante, setSelectedVisitante] = useState<Visitante | null>(null);

  // Edit Visitante state
  const [editVisitante, setEditVisitante] = useState<Visitante | null>(null);
  const [editando, setEditando] = useState(false);
  const [editNombres, setEditNombres] = useState('');
  const [editApellidos, setEditApellidos] = useState('');
  const [editCorreo, setEditCorreo] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editRazon, setEditRazon] = useState('');

  // Logs state
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [searchLogsQuery, setSearchLogsQuery] = useState('');
  const [logPage, setLogPage] = useState(1);
  const logsPerPage = 12;

  // Statistics
  const [stats, setStats] = useState({
    visitasHoy: 0,
    visitasMes: 0,
    motivoFrecuente: 'Ninguno'
  });

  const hasModuloAcceso = tienePermiso('Gestión de Registros', 'ver');
  const hasCrearVisita = tienePermiso('Gestión de Registros', 'crear');
  const hasEliminarVisita = tienePermiso('Gestión de Registros', 'eliminar');
  const hasEditarVisita = tienePermiso('Gestión de Registros', 'editar') || hasEliminarVisita;

  const logoEscuela = localStorage.getItem(`sigae_logo_${escuelaSeleccionada}`) || `/assets/img/logo_${escuelaSeleccionada}.png`;

  useEffect(() => {
    if (!permLoading && isDualAccess) {
      setEscuelaSeleccionada(activeSchoolCode);
    }
  }, [permLoading, activeSchoolCode, isDualAccess]);

  useEffect(() => {
    if (!permLoading && hasModuloAcceso) {
      cargarVisitantes();
      if (activeTab === 'historial') {
        cargarHistorial();
      }
    }
  }, [permLoading, activeTab, escuelaSeleccionada]);

  // Recalculate stats when visitors list changes
  useEffect(() => {
    if (visitantes.length > 0) {
      const hoy = new Date().toISOString().slice(0, 10);
      const mesActual = new Date().toISOString().slice(0, 7);

      const visitasHoy = visitantes.filter(v => v.created_at.slice(0, 10) === hoy).length;
      const visitasMes = visitantes.filter(v => v.created_at.slice(0, 7) === mesActual).length;

      const motivosMap: { [key: string]: number } = {};
      visitantes.forEach(v => {
        const razon = v.razon_visita.trim().toLowerCase();
        motivosMap[razon] = (motivosMap[razon] || 0) + 1;
      });

      let motivoFrecuente = 'Ninguno';
      let maxCount = 0;
      Object.entries(motivosMap).forEach(([motivo, count]) => {
        if (count > maxCount) {
          maxCount = count;
          motivoFrecuente = motivo;
        }
      });

      if (motivoFrecuente !== 'Ninguno') {
        motivoFrecuente = motivoFrecuente.charAt(0).toUpperCase() + motivoFrecuente.slice(1);
      }

      setStats({
        visitasHoy,
        visitasMes,
        motivoFrecuente
      });
    } else {
      setStats({
        visitasHoy: 0,
        visitasMes: 0,
        motivoFrecuente: 'Ninguno'
      });
    }
  }, [visitantes]);

  const cargarVisitantes = async () => {
    setLoadingVisitantes(true);
    try {
      const { data, error } = await supabase
        .from('invitados')
        .select('*')
        .eq('escuela_id', escuelaSeleccionada)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVisitantes(data || []);
    } catch (e) {
      console.error("Error cargando visitantes:", e);
      if (Swal) Swal.fire("Error", "No se pudieron obtener los registros de visitantes.", "error");
    }
    setLoadingVisitantes(false);
  };

  const cargarHistorial = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('historial_auditoria')
        .select('*')
        .eq('escuela', escuelaSeleccionada)
        .order('fecha', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (e) {
      console.error("Error cargando historial de auditoría:", e);
      if (Swal) Swal.fire("Error", "No se pudo cargar el historial de operaciones de la escuela.", "error");
    }
    setLoadingLogs(false);
  };

  // --- AUTOCOMPLETADO POR CÉDULA ---
  useEffect(() => {
    if (formCedula.length < 6) {
      setFormNombres('');
      setFormApellidos('');
      setFormCorreo('');
      setFormTelefono('');
      setAutocompletado(false);
      setVisitasAnteriores(0);
      setBuscandoCedula(false);
      return;
    }

    let cancelled = false;
    setBuscandoCedula(true);

    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('invitados')
          .select('nombres, apellidos, correo, telefono')
          .eq('cedula', formCedula.trim())
          .order('created_at', { ascending: false })
          .limit(10);

        if (cancelled) return;

        if (!error && data && data.length > 0) {
          const ultimo = data[0];
          setFormNombres(ultimo.nombres || '');
          setFormApellidos(ultimo.apellidos || '');
          setFormCorreo(ultimo.correo || '');
          setFormTelefono(ultimo.telefono || '');
          setAutocompletado(true);
          setVisitasAnteriores(data.length);
        } else {
          setAutocompletado(false);
          setVisitasAnteriores(0);
        }
      } catch (e) {
        console.error('Error buscando cédula:', e);
        if (!cancelled) setAutocompletado(false);
      }
      if (!cancelled) setBuscandoCedula(false);
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [formCedula]);

  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setFormCedula(val);
  };

  const limpiarFormulario = () => {
    setFormCedula('');
    setFormNombres('');
    setFormApellidos('');
    setFormCorreo('');
    setFormTelefono('');
    setFormRazon('');
    setAutocompletado(false);
    setVisitasAnteriores(0);
  };

  const handleSaveVisitante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasCrearVisita) {
      if (Swal) Swal.fire("Acceso Denegado", "No tienes permisos para registrar visitantes.", "error");
      return;
    }

    const cedula = formCedula.trim();
    const nombres = formNombres.trim();
    const apellidos = formApellidos.trim();
    const correo = formCorreo.trim() || null;
    const telefono = formTelefono.trim() || null;
    const razon_visita = formRazon.trim();

    if (!cedula) { if (Swal) Swal.fire("Atención", "La cédula es obligatoria.", "warning"); return; }
    if (!nombres) { if (Swal) Swal.fire("Atención", "El nombre es obligatorio.", "warning"); return; }
    if (!apellidos) { if (Swal) Swal.fire("Atención", "El apellido es obligatorio.", "warning"); return; }
    if (!razon_visita) { if (Swal) Swal.fire("Atención", "El motivo de la visita es obligatorio.", "warning"); return; }

    setRegistrando(true);
    try {
      const insertPayload = { cedula, nombres, apellidos, correo, telefono, razon_visita, escuela_id: escuelaSeleccionada };

      const { data, error } = await supabase
        .from('invitados')
        .insert([insertPayload])
        .select()
        .single();

      if (error) throw error;

      auditar(
        'Gestión de Registros', 
        'Registrar Entrada', 
        `Registró entrada de visitante: ${nombres} ${apellidos} (C.I: ${cedula})`
      );

      limpiarFormulario();
      await cargarVisitantes();

      if (Swal) {
        Swal.fire({
          title: "¡Visita Registrada!",
          text: "¿Deseas generar el pase de visitante ahora?",
          icon: "success",
          showCancelButton: true,
          confirmButtonColor: '#6366f1',
          cancelButtonColor: "#6c757d",
          confirmButtonText: "Sí, ver pase",
          cancelButtonText: "No, continuar"
        }).then((result: any) => {
          if (result.isConfirmed && data) {
            setSelectedVisitante(data);
          }
        });
      }
    } catch (err: any) {
      console.error('[GestionRegistros] Error al guardar visitante:', err);
      if (Swal) Swal.fire("Error al guardar", err?.message || "Error desconocido", "error");
    } finally {
      setRegistrando(false);
    }
  };

  const handleOpenEdit = (v: Visitante) => {
    setEditVisitante(v);
    setEditNombres(v.nombres);
    setEditApellidos(v.apellidos);
    setEditCorreo(v.correo || '');
    setEditTelefono(v.telefono || '');
    setEditRazon(v.razon_visita);
  };

  const handleSaveEditVisitante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVisitante) return;
    const nombres = editNombres.trim();
    const apellidos = editApellidos.trim();
    const razon_visita = editRazon.trim();
    if (!nombres || !apellidos || !razon_visita) {
      if (Swal) Swal.fire('Atención', 'Nombres, apellidos y motivo son obligatorios.', 'warning');
      return;
    }
    setEditando(true);
    try {
      const { error } = await supabase
        .from('invitados')
        .update({
          nombres,
          apellidos,
          correo: editCorreo.trim() || null,
          telefono: editTelefono.trim() || null,
          razon_visita
        })
        .eq('id_invitado', editVisitante.id_invitado);
      if (error) throw error;
      auditar('Gestión de Registros', 'Editar Registro', `Editó registro de invitado: ${nombres} ${apellidos} (C.I: ${editVisitante.cedula})`);
      await cargarVisitantes();
      setEditVisitante(null);
      if (Swal) Swal.fire('¡Actualizado!', 'El registro del invitado fue actualizado correctamente.', 'success');
    } catch (err: any) {
      if (Swal) Swal.fire('Error', err?.message || 'No se pudo actualizar el registro.', 'error');
    }
    setEditando(false);
  };

  const handleDeleteVisitante = async (id: string, name: string) => {
    if (!hasEliminarVisita) {
      if (Swal) Swal.fire("Acceso Denegado", "No tienes permisos para eliminar registros de visitas.", "error");
      return;
    }

    if (!Swal) return;

    Swal.fire({
      title: '¿Eliminar registro?',
      text: `Se borrará la entrada de "${name}" de forma permanente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (res: any) => {
      if (res.isConfirmed) {
        try {
          const { error } = await supabase
            .from('invitados')
            .delete()
            .eq('id_invitado', id);

          if (error) throw error;

          auditar(
            'Gestión de Registros', 
            'Eliminar Registro', 
            `Eliminó registro de visita ID: ${id} correspondiente a ${name}`
          );

          await cargarVisitantes();
          Swal.fire("Eliminado", "El registro ha sido removido.", "success");
        } catch (err: any) {
          console.error(err);
          Swal.fire("Error", err?.message || "No se pudo eliminar el registro de visita.", "error");
        }
      }
    });
  };

  const handlePrint = () => {
    const printContent = document.getElementById('visitor-pass-print-area');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');

    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(`
        <html>
          <head>
            <title>Pase de Visitante SIGAE</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; background-color: #fff; }
              .ticket-card { width: 80mm; border: 2px dashed #000; padding: 15px; text-align: center; background: #fff; border-radius: 8px; }
              .ticket-header { border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
              .school-title { font-size: 1.1rem; font-weight: 800; text-transform: uppercase; margin-bottom: 2px; }
              .ticket-title { font-size: 1.2rem; font-weight: 800; letter-spacing: 2px; background: #000; color: #fff; padding: 3px 0; margin-top: 5px; }
              .visitor-name { font-size: 1.3rem; font-weight: 800; margin: 10px 0 2px 0; text-transform: uppercase; }
              .visitor-id { font-size: 0.95rem; font-weight: bold; color: #555; margin-bottom: 12px; }
              .info-row { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px; border-bottom: 1px solid #eee; padding-bottom: 2px; }
              .info-label { font-weight: bold; }
              .reason-box { background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; padding: 6px; font-size: 0.75rem; text-align: left; margin: 10px 0; min-height: 40px; }
              .footer-notice { font-size: 0.65rem; color: #666; margin-top: 15px; border-top: 1px dashed #000; padding-top: 8px; }
              @media print { body { padding: 0; } .no-print { display: none !important; } }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
            <script>
              window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      auditar(
        'Gestión de Registros', 
        'Imprimir Pase', 
        `Imprimió pase de visitante C.I: ${selectedVisitante?.cedula}`
      );
    }
  };

  // Filter Visitors list
  const filteredVisitantes = visitantes.filter(v => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery = 
      v.cedula.toLowerCase().includes(query) ||
      v.nombres.toLowerCase().includes(query) ||
      v.apellidos.toLowerCase().includes(query) ||
      (v.razon_visita && v.razon_visita.toLowerCase().includes(query));

    if (!matchesQuery) return false;

    const dateStr = v.created_at.slice(0, 10);
    const hoyStr = new Date().toISOString().slice(0, 10);

    if (dateFilter === 'hoy') {
      return dateStr === hoyStr;
    } else if (dateFilter === 'semana') {
      const diffTime = Math.abs(new Date().getTime() - new Date(v.created_at).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    } else if (dateFilter === 'mes') {
      const mesStr = new Date().toISOString().slice(0, 7);
      return v.created_at.slice(0, 7) === mesStr;
    }

    return true;
  });

  // Agrupado por cédula para la pestaña de Historial por Visitante
  const visitantesAgrupadosPorCedula = React.useMemo(() => {
    const map = new Map<string, { info: Visitante; total: number; visitas: Visitante[] }>();
    visitantes.forEach(v => {
      const key = v.cedula.trim();
      if (!map.has(key)) {
        map.set(key, { info: v, total: 1, visitas: [v] });
      } else {
        const item = map.get(key)!;
        item.total += 1;
        item.visitas.push(v);
      }
    });
    return Array.from(map.values()).filter(item => {
      const q = historialSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        item.info.cedula.includes(q) ||
        item.info.nombres.toLowerCase().includes(q) ||
        item.info.apellidos.toLowerCase().includes(q)
      );
    });
  }, [visitantes, historialSearch]);

  // Filter logs list
  const filteredLogs = logs.filter(l => {
    const query = searchLogsQuery.trim().toLowerCase();
    return (
      (l.usuario_nombre && l.usuario_nombre.toLowerCase().includes(query)) ||
      (l.usuario_cedula && l.usuario_cedula.toLowerCase().includes(query)) ||
      (l.modulo && l.modulo.toLowerCase().includes(query)) ||
      (l.accion && l.accion.toLowerCase().includes(query)) ||
      (l.detalles && l.detalles.toLowerCase().includes(query))
    );
  });

  const totalLogPages = Math.ceil(filteredLogs.length / logsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice((logPage - 1) * logsPerPage, logPage * logsPerPage);

  if (permLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando control de visitas...</span>
        </div>
      </div>
    );
  }

  if (!hasModuloAcceso) {
    return (
      <div className="col-12 text-center py-5 mt-4">
        <div className="bg-light d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm border" style={{ width: '100px', height: '100px' }}>
          <i className="bi bi-shield-lock-fill text-muted" style={{ fontSize: '3.5rem' }}></i>
        </div>
        <h4 className="text-dark fw-bold mb-2">Área Restringida</h4>
        <p className="text-muted mb-0">No tienes permisos asignados para acceder al módulo de Control de Visitas e Invitados.</p>
      </div>
    );
  }

  return (
    <div className="modulo-animado container-fluid p-0 animate__animated animate__fadeIn">

      {/* 1. Miga de Pan Chamilo */}
      <ChamiloBreadcrumb
        category="Dirección y Sistema"
        currentModule="Control de Visitas y Portería"
      />

      {/* 2. Cuadro de Ayuda Metodológica Chamilo */}
      <ChamiloHelpCallout
        id="ayuda_gestion_registros_chamilo"
        title="Guía de Control de Acceso, Portería e Invitados Presenciales"
        content="Registre de manera rápida la entrada física de visitantes a la institución. El sistema autocompleta los datos si es un visitante recurrente, genera e imprime pases de visita con código QR y registra el motivo institucional de permanencia."
        icon="bi-person-badge"
      />

      {/* ── 3. CABECERA INSTITUCIONAL EJECUTIVA (Estilo Dirección y Sistema) ── */}
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
            
            {/* Logo de la Escuela */}
            <div className="col-12 col-md-auto text-center text-md-start">
              <div 
                className="tech-icon-wrapper bg-white shadow-sm d-inline-flex align-items-center justify-content-center p-2"
                style={{ 
                  width: '100px', 
                  height: '100px', 
                  borderRadius: '24px', 
                  border: '2.5px solid #fed7aa',
                  boxShadow: '0 10px 24px rgba(249, 115, 22, 0.15)'
                }}
              >
                <img 
                  src={logoEscuela} 
                  alt="Escudo Institucional" 
                  className="img-fluid"
                  style={{ maxHeight: '76px', objectFit: 'contain' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                />
              </div>
            </div>

            {/* Título, Sede y Métricas Clave */}
            <div className="col-12 col-md text-center text-md-start">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-2 flex-wrap">
                <span 
                  className="badge text-white fw-bold px-3 py-1.5 rounded-pill shadow-xs d-inline-flex align-items-center gap-1.5"
                  style={{ backgroundColor: '#FF8D00', fontSize: '0.78rem' }}
                >
                  <i className="bi bi-door-open-fill"></i>Recepción & Portería
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
                
                {/* Selector de Escuela Superior (Si tiene acceso a ambas sedes) */}
                {isDualAccess && (
                  <div className="btn-group btn-group-sm rounded-pill p-0.5 bg-white border shadow-xs" role="group" style={{ borderColor: '#fed7aa' }}>
                    <button
                      type="button"
                      className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${escuelaSeleccionada === 'sb' ? 'btn-success text-white' : 'btn-light text-muted'}`}
                      onClick={() => setEscuelaSeleccionada('sb')}
                      style={{ fontSize: '0.78rem' }}
                    >
                      UE Santa Bárbara
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${escuelaSeleccionada === 'lb' ? 'btn-primary text-white' : 'btn-light text-muted'}`}
                      onClick={() => setEscuelaSeleccionada('lb')}
                      style={{ fontSize: '0.78rem' }}
                    >
                      UE Libertador Bolívar
                    </button>
                  </div>
                )}

                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs" style={{ borderColor: '#fed7aa' }}>
                  <i className="bi bi-clock-history text-primary me-1"></i><b>{stats.visitasHoy}</b> Visitas Hoy
                </span>
                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs" style={{ borderColor: '#fed7aa' }}>
                  <i className="bi bi-calendar-check text-success me-1"></i><b>{stats.visitasMes}</b> este Mes
                </span>
              </div>

              <h1 className="fw-bolder mb-1 text-dark fs-3 fs-md-2" style={{ letterSpacing: '-0.5px' }}>
                Control de Visitantes y Acceso Presencial
              </h1>

              <p className="mb-0 text-muted small" style={{ maxWidth: '780px' }}>
                Gestión de entradas en portería, emisión de pases de visitantes e historial de concurrencia en la sede institucional.
              </p>
            </div>

            {/* Acciones Rápidas */}
            <div className="col-12 col-md-auto text-md-end text-center">
              <button
                type="button"
                onClick={() => navigate('/categoria/Direcci%C3%B3n%20y%20Sistema')}
                className="btn btn-white bg-white text-dark rounded-pill px-4 py-2 fw-bold shadow-xs hover-efecto border d-inline-flex align-items-center justify-content-center gap-2 w-100 w-md-auto"
                style={{ borderColor: '#fed7aa', fontSize: '0.85rem' }}
              >
                <i className="bi bi-arrow-left" style={{ color: '#ea580c' }}></i>
                <span>Volver a Dirección</span>
              </button>
            </div>

          </div>
        </div>

        {/* Barra de Pestañas Principal */}
        <div 
          className="px-3 px-md-4 py-2.5 py-md-3 bg-white border-top d-flex justify-content-between align-items-center flex-wrap gap-2"
          style={{ borderColor: '#fed7aa' }}
        >
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('visitantes')}
              className={`btn btn-xs rounded-pill px-3.5 py-1.5 fw-bold transition-all ${
                activeTab === 'visitantes' ? 'text-white shadow-xs' : 'btn-white bg-white text-muted border'
              }`}
              style={{ backgroundColor: activeTab === 'visitantes' ? '#FF8D00' : undefined, borderColor: activeTab === 'visitantes' ? '#FF8D00' : '#fed7aa', fontSize: '0.82rem' }}
            >
              <i className="bi bi-person-check-fill me-1.5"></i>Registro y Visitas ({visitantes.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('invitados_historial')}
              className={`btn btn-xs rounded-pill px-3.5 py-1.5 fw-bold transition-all ${
                activeTab === 'invitados_historial' ? 'text-white shadow-xs' : 'btn-white bg-white text-muted border'
              }`}
              style={{ backgroundColor: activeTab === 'invitados_historial' ? '#FF8D00' : undefined, borderColor: activeTab === 'invitados_historial' ? '#FF8D00' : '#fed7aa', fontSize: '0.82rem' }}
            >
              <i className="bi bi-people-fill me-1.5"></i>Historial por Cédula ({visitantesAgrupadosPorCedula.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('historial')}
              className={`btn btn-xs rounded-pill px-3.5 py-1.5 fw-bold transition-all ${
                activeTab === 'historial' ? 'text-white shadow-xs' : 'btn-white bg-white text-muted border'
              }`}
              style={{ backgroundColor: activeTab === 'historial' ? '#FF8D00' : undefined, borderColor: activeTab === 'historial' ? '#FF8D00' : '#fed7aa', fontSize: '0.82rem' }}
            >
              <i className="bi bi-journal-text me-1.5"></i>Auditoría de Sede
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. CONTENIDO PRINCIPAL: PESTAÑA 1 - REGISTRO Y CONTROL DE VISITAS ── */}
      {activeTab === 'visitantes' && (
        <div className="row g-4 mb-5">
          
          {/* Formulario de Registro Rápido en Portería */}
          {hasCrearVisita && (
            <div className="col-12 col-xl-4">
              <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden h-100">
                <div className="card-header bg-white p-3.5 border-bottom d-flex align-items-center justify-content-between">
                  <h5 className="fw-bolder text-dark mb-0 d-flex align-items-center gap-2">
                    <i className="bi bi-person-plus-fill text-primary"></i>
                    Check-in de Entrada
                  </h5>
                  {autocompletado && (
                    <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5 py-1 extra-small fw-bold">
                      <i className="bi bi-arrow-repeat me-1"></i>Recurrente ({visitasAnteriores} visitas)
                    </span>
                  )}
                </div>

                <div className="card-body p-4">
                  <form onSubmit={handleSaveVisitante}>
                    
                    {/* Cédula con Autocompletado */}
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-dark mb-1">
                        Cédula de Identidad <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-end-0 rounded-start-3">
                          <i className="bi bi-card-text"></i>
                        </span>
                        <input
                          type="text"
                          value={formCedula}
                          onChange={handleCedulaChange}
                          placeholder="Ej: 18456789"
                          maxLength={9}
                          className="form-control rounded-end-3 fw-bold"
                          required
                        />
                      </div>
                      {buscandoCedula && (
                        <div className="extra-small text-primary mt-1">
                          <span className="spinner-border spinner-border-sm me-1" style={{ width: '10px', height: '10px' }}></span>
                          Buscando historial del visitante...
                        </div>
                      )}
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label fw-bold small text-dark mb-1">Nombres <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          value={formNombres}
                          onChange={(e) => setFormNombres(e.target.value)}
                          placeholder="Nombres"
                          className="form-control rounded-3"
                          required
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-bold small text-dark mb-1">Apellidos <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          value={formApellidos}
                          onChange={(e) => setFormApellidos(e.target.value)}
                          placeholder="Apellidos"
                          className="form-control rounded-3"
                          required
                        />
                      </div>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label fw-bold small text-dark mb-1">Teléfono</label>
                        <input
                          type="tel"
                          value={formTelefono}
                          onChange={(e) => setFormTelefono(formatPhoneNumber(e.target.value))}
                          placeholder="0414-1234567"
                          className="form-control rounded-3"
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-bold small text-dark mb-1">Correo</label>
                        <input
                          type="email"
                          value={formCorreo}
                          onChange={(e) => setFormCorreo(e.target.value)}
                          placeholder="Opcional"
                          className="form-control rounded-3"
                        />
                      </div>
                    </div>

                    {/* Motivo de la visita */}
                    <div className="mb-4">
                      <label className="form-label fw-bold small text-dark mb-1">
                        Motivo / Razón de la Visita <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        value={formRazon}
                        onChange={(e) => setFormRazon(e.target.value)}
                        placeholder="Ej: Retirar alumno, Control de Estudios, Proveedor..."
                        className="form-control rounded-3"
                        required
                      />
                      <div className="d-flex gap-1 flex-wrap mt-1.5">
                        {['Control de Estudios', 'Retirar Estudiante', 'Entrevista Docente', 'Trámites Administrativos'].map((motivo, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFormRazon(motivo)}
                            className="badge bg-light text-muted border border-0 hover-efecto rounded-pill px-2 py-0.5 extra-small"
                          >
                            + {motivo}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        onClick={limpiarFormulario}
                        className="btn btn-light rounded-pill fw-bold text-muted px-3"
                        style={{ fontSize: '0.82rem' }}
                      >
                        Limpiar
                      </button>
                      <button
                        type="submit"
                        disabled={registrando}
                        className="btn btn-primary rounded-pill fw-bold w-100 shadow-xs hover-efecto d-flex align-items-center justify-content-center gap-1.5"
                        style={{ backgroundColor: '#6366f1', borderColor: '#6366f1', fontSize: '0.82rem' }}
                      >
                        {registrando ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status"></span>
                            <span>Registrando...</span>
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-lg"></i>
                            <span>Registrar Entrada</span>
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de Visitas Registradas */}
          <div className={`col-12 ${hasCrearVisita ? 'col-xl-8' : 'col-12'}`}>
            <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden h-100">
              <div className="card-header bg-white p-3.5 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                
                {/* Filtros de Fecha */}
                <div className="d-flex align-items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setDateFilter('todas')}
                    className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${dateFilter === 'todas' ? 'btn-dark text-white' : 'btn-light text-muted border'}`}
                    style={{ fontSize: '0.78rem' }}
                  >
                    Todas ({visitantes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateFilter('hoy')}
                    className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${dateFilter === 'hoy' ? 'btn-primary text-white' : 'btn-light text-muted border'}`}
                    style={{ backgroundColor: dateFilter === 'hoy' ? '#6366f1' : undefined, fontSize: '0.78rem' }}
                  >
                    Hoy ({stats.visitasHoy})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateFilter('semana')}
                    className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${dateFilter === 'semana' ? 'btn-primary text-white' : 'btn-light text-muted border'}`}
                    style={{ backgroundColor: dateFilter === 'semana' ? '#6366f1' : undefined, fontSize: '0.78rem' }}
                  >
                    Últimos 7 Días
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateFilter('mes')}
                    className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${dateFilter === 'mes' ? 'btn-primary text-white' : 'btn-light text-muted border'}`}
                    style={{ backgroundColor: dateFilter === 'mes' ? '#6366f1' : undefined, fontSize: '0.78rem' }}
                  >
                    Este Mes ({stats.visitasMes})
                  </button>
                </div>

                {/* Buscador de Visitantes */}
                <div style={{ minWidth: '200px', maxWidth: '280px' }}>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-light border-end-0 rounded-start-pill text-muted">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="form-control bg-light border-start-0 rounded-end-pill"
                      placeholder="Buscar por cédula o nombre..."
                    />
                  </div>
                </div>

              </div>

              <div className="card-body p-0">
                {loadingVisitantes ? (
                  <div className="text-center py-5 text-muted">
                    <div className="spinner-border text-primary mb-3" role="status"></div>
                    <div>Cargando registros de portería...</div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light text-muted extra-small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                        <tr>
                          <th className="ps-4 py-3">Visitante</th>
                          <th className="py-3">Motivo de Visita</th>
                          <th className="py-3">Fecha y Hora</th>
                          <th className="text-center pe-4 py-3" style={{ width: '130px' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVisitantes.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-5 text-muted">
                              <i className="bi bi-person-x fs-2 d-block mb-2 text-muted opacity-50"></i>
                              <span className="fw-bold">No se encontraron visitas con el filtro seleccionado.</span>
                            </td>
                          </tr>
                        ) : (
                          filteredVisitantes.map((v) => (
                            <tr key={v.id_invitado} className="hover-efecto">
                              <td className="ps-4 py-3">
                                <div className="fw-bold text-dark d-flex align-items-center gap-1.5">
                                  <span>{v.nombres} {v.apellidos}</span>
                                </div>
                                <div className="text-muted extra-small d-flex align-items-center gap-2 mt-0.5">
                                  <span><i className="bi bi-card-text me-1"></i>C.I: {v.cedula}</span>
                                  {v.telefono && <span><i className="bi bi-telephone me-1"></i>{v.telefono}</span>}
                                </div>
                              </td>

                              <td className="py-3">
                                <span className="badge bg-light text-dark border rounded-pill px-2.5 py-1 extra-small fw-bold">
                                  <i className="bi bi-tag-fill text-primary me-1"></i>{v.razon_visita}
                                </span>
                              </td>

                              <td className="py-3 text-muted extra-small">
                                <div className="d-flex align-items-center gap-1">
                                  <i className="bi bi-calendar3"></i>
                                  <span>{new Date(v.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="text-muted mt-0.5">
                                  <i className="bi bi-clock me-1"></i>
                                  {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </td>

                              <td className="text-center pe-4 py-3">
                                <div className="d-flex align-items-center justify-content-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedVisitante(v)}
                                    className="btn btn-xs btn-light text-success rounded-circle shadow-xs"
                                    style={{ width: '30px', height: '30px' }}
                                    title="Imprimir Pase de Visitante"
                                  >
                                    <i className="bi bi-printer-fill"></i>
                                  </button>

                                  {hasEditarVisita && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(v)}
                                      className="btn btn-xs btn-light text-primary rounded-circle shadow-xs"
                                      style={{ width: '30px', height: '30px' }}
                                      title="Editar Visita"
                                    >
                                      <i className="bi bi-pencil-square"></i>
                                    </button>
                                  )}

                                  {hasEliminarVisita && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteVisitante(v.id_invitado, `${v.nombres} ${v.apellidos}`)}
                                      className="btn btn-xs btn-light text-danger rounded-circle shadow-xs"
                                      style={{ width: '30px', height: '30px' }}
                                      title="Eliminar Entrada"
                                    >
                                      <i className="bi bi-trash3-fill"></i>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── 5. PESTAÑA 2: HISTORIAL POR CÉDULA / VISITANTES FRECUENTES ── */}
      {activeTab === 'invitados_historial' && (
        <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-5">
          <div className="card-header bg-white p-3.5 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h5 className="fw-bolder text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-people-fill text-primary"></i>
                Frecuencia y Concurrencia de Visitantes
              </h5>
              <span className="extra-small text-muted">{visitantesAgrupadosPorCedula.length} personas registradas</span>
            </div>

            <div style={{ minWidth: '220px', maxWidth: '300px' }}>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0 rounded-start-pill text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  value={historialSearch}
                  onChange={(e) => setHistorialSearch(e.target.value)}
                  className="form-control bg-light border-start-0 rounded-end-pill"
                  placeholder="Buscar por cédula o nombre..."
                />
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted extra-small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                  <tr>
                    <th className="ps-4 py-3">Persona / Visitante</th>
                    <th className="py-3">Cédula</th>
                    <th className="py-3">Contacto</th>
                    <th className="py-3 text-center">Total de Visitas</th>
                    <th className="text-center pe-4 py-3" style={{ width: '140px' }}>Historial</th>
                  </tr>
                </thead>
                <tbody>
                  {visitantesAgrupadosPorCedula.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5 text-muted">
                        <i className="bi bi-inbox fs-2 d-block mb-2 text-muted opacity-50"></i>
                        <span className="fw-bold">No hay registros para mostrar.</span>
                      </td>
                    </tr>
                  ) : (
                    visitantesAgrupadosPorCedula.map((item) => {
                      const isExpanded = expandedCedula === item.info.cedula;
                      return (
                        <React.Fragment key={item.info.cedula}>
                          <tr className="hover-efecto">
                            <td className="ps-4 py-3">
                              <div className="fw-bold text-dark">{item.info.nombres} {item.info.apellidos}</div>
                            </td>
                            <td className="py-3 fw-bold text-muted small">{item.info.cedula}</td>
                            <td className="py-3 text-muted extra-small">
                              <div>{item.info.telefono || 'Sin teléfono'}</div>
                              <div>{item.info.correo || ''}</div>
                            </td>
                            <td className="py-3 text-center">
                              <span className={`badge ${item.total > 1 ? 'bg-primary' : 'bg-light text-dark border'} rounded-pill px-3 py-1 small fw-bold`}>
                                {item.total} {item.total === 1 ? 'visita' : 'visitas'}
                              </span>
                            </td>
                            <td className="text-center pe-4 py-3">
                              <button
                                type="button"
                                onClick={() => setExpandedCedula(isExpanded ? null : item.info.cedula)}
                                className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${isExpanded ? 'btn-dark text-white' : 'btn-outline-primary bg-white'}`}
                                style={{ fontSize: '0.78rem' }}
                              >
                                {isExpanded ? 'Ocultar' : 'Ver Detalles'}
                              </button>
                            </td>
                          </tr>

                          {/* Acordeón con desglose de visitas */}
                          {isExpanded && (
                            <tr className="bg-light">
                              <td colSpan={5} className="p-3 ps-4 pe-4">
                                <div className="p-3 bg-white border rounded-3 shadow-xs">
                                  <h6 className="fw-bold text-dark mb-2 extra-small text-uppercase">
                                    <i className="bi bi-clock-history me-1.5 text-primary"></i>
                                    Detalle de Visitas Registradas:
                                  </h6>
                                  <div className="row g-2">
                                    {item.visitas.map((v, i) => (
                                      <div key={v.id_invitado || i} className="col-md-6 col-lg-4">
                                        <div className="p-2.5 rounded-3 bg-light border extra-small">
                                          <div className="d-flex justify-content-between align-items-center mb-1">
                                            <span className="fw-bold text-dark">
                                              <i className="bi bi-calendar3 me-1 text-muted"></i>
                                              {new Date(v.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="text-muted">
                                              {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                          </div>
                                          <div className="text-muted text-truncate" title={v.razon_visita}>
                                            <b>Motivo:</b> {v.razon_visita}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. PESTAÑA 3: AUDITORÍA DE OPERACIONES EN LA SEDE ── */}
      {activeTab === 'historial' && (
        <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-5">
          <div className="card-header bg-white p-3.5 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h5 className="fw-bolder text-dark mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-journal-text text-primary"></i>
                Registro de Movimientos y Auditoría
              </h5>
              <span className="extra-small text-muted">{filteredLogs.length} eventos registrados en {escuelaSeleccionada === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar'}</span>
            </div>

            <div style={{ minWidth: '220px', maxWidth: '300px' }}>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0 rounded-start-pill text-muted">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  value={searchLogsQuery}
                  onChange={(e) => { setSearchLogsQuery(e.target.value); setLogPage(1); }}
                  className="form-control bg-light border-start-0 rounded-end-pill"
                  placeholder="Buscar en el registro..."
                />
              </div>
            </div>
          </div>

          <div className="card-body p-0">
            {loadingLogs ? (
              <div className="text-center py-5 text-muted">
                <div className="spinner-border text-primary mb-3" role="status"></div>
                <div>Cargando historial de auditoría...</div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-muted extra-small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                    <tr>
                      <th className="ps-4 py-3">Usuario Responsable</th>
                      <th className="py-3">Módulo</th>
                      <th className="py-3">Acción y Detalles</th>
                      <th className="text-center pe-4 py-3">Fecha y Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-5 text-muted">
                          <i className="bi bi-inbox fs-2 d-block mb-2 text-muted opacity-50"></i>
                          <span className="fw-bold">No hay registros de auditoría para mostrar.</span>
                        </td>
                      </tr>
                    ) : (
                      paginatedLogs.map((l) => (
                        <tr key={l.id} className="hover-efecto">
                          <td className="ps-4 py-3">
                            <div className="fw-bold text-dark">{l.usuario_nombre || 'Sistema'}</div>
                            <div className="text-muted extra-small">{l.usuario_cedula || ''}</div>
                          </td>
                          <td className="py-3">
                            <span className="badge bg-light text-dark border rounded-pill px-2.5 py-1 extra-small fw-bold">
                              {l.modulo}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="fw-bold text-primary small">{l.accion}</div>
                            <div className="text-muted extra-small" style={{ maxWidth: '450px' }}>{l.detalles}</div>
                          </td>
                          <td className="text-center pe-4 py-3 text-muted extra-small">
                            {new Date(l.fecha).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {totalLogPages > 1 && (
              <div className="p-3 bg-light border-top d-flex justify-content-between align-items-center">
                <span className="extra-small text-muted">Página {logPage} de {totalLogPages}</span>
                <div className="d-flex gap-1">
                  <button
                    type="button"
                    disabled={logPage === 1}
                    onClick={() => setLogPage(p => Math.max(p - 1, 1))}
                    className="btn btn-xs btn-white bg-white border rounded-pill px-3 py-1 fw-bold"
                    style={{ fontSize: '0.78rem' }}
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={logPage === totalLogPages}
                    onClick={() => setLogPage(p => Math.min(p + 1, totalLogPages))}
                    className="btn btn-xs btn-white bg-white border rounded-pill px-3 py-1 fw-bold"
                    style={{ fontSize: '0.78rem' }}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL DE EDICIÓN DE VISITA ── */}
      {editVisitante && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15,23,42,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              <div className="modal-header bg-light border-bottom p-3.5">
                <h5 className="modal-title fw-bold text-dark mb-0">
                  <i className="bi bi-pencil-square text-primary me-2"></i>Editar Registro de Visita
                </h5>
                <button type="button" className="btn-close" onClick={() => setEditVisitante(null)} aria-label="Close"></button>
              </div>
              <form onSubmit={handleSaveEditVisitante}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-muted">Cédula (No modificable)</label>
                    <input type="text" className="form-control rounded-3 bg-light" value={editVisitante.cedula} disabled />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold small text-dark mb-1">Nombres <span className="text-danger">*</span></label>
                      <input type="text" className="form-control rounded-3" value={editNombres} onChange={(e) => setEditNombres(e.target.value)} required />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold small text-dark mb-1">Apellidos <span className="text-danger">*</span></label>
                      <input type="text" className="form-control rounded-3" value={editApellidos} onChange={(e) => setEditApellidos(e.target.value)} required />
                    </div>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold small text-dark mb-1">Teléfono</label>
                      <input type="tel" className="form-control rounded-3" value={editTelefono} onChange={(e) => setEditTelefono(formatPhoneNumber(e.target.value))} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold small text-dark mb-1">Correo</label>
                      <input type="email" className="form-control rounded-3" value={editCorreo} onChange={(e) => setEditCorreo(e.target.value)} />
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label fw-bold small text-dark mb-1">Motivo de la Visita <span className="text-danger">*</span></label>
                    <input type="text" className="form-control rounded-3" value={editRazon} onChange={(e) => setEditRazon(e.target.value)} required />
                  </div>
                </div>
                <div className="modal-footer bg-light border-top p-3 d-flex justify-content-between">
                  <button type="button" className="btn btn-light rounded-pill fw-bold text-muted px-4" onClick={() => setEditVisitante(null)}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={editando} className="btn btn-primary rounded-pill fw-bold px-4" style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}>
                    {editando ? 'Guardando...' : 'Actualizar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL / ÁREA DE IMPRESIÓN DEL PASE DE VISITANTE ── */}
      {selectedVisitante && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15,23,42,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              <div className="modal-header bg-light border-bottom p-3.5">
                <h5 className="modal-title fw-bold text-dark mb-0">
                  <i className="bi bi-printer-fill text-primary me-2"></i>Pase de Visitante Oficial
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedVisitante(null)} aria-label="Close"></button>
              </div>
              <div className="modal-body p-4 text-center">
                
                {/* TICKET DE VISITANTE LISTO PARA IMPRIMIR */}
                <div id="visitor-pass-print-area" className="d-inline-block text-start p-3 border rounded-3 bg-white shadow-xs" style={{ width: '100%', maxWidth: '320px' }}>
                  <div className="text-center border-bottom pb-2 mb-3">
                    <img src={logoEscuela} alt="Logo" style={{ maxHeight: '45px' }} className="mb-1" />
                    <div className="fw-bolder text-uppercase small" style={{ fontSize: '0.85rem' }}>
                      {escuelaSeleccionada === 'sb' ? 'UE SANTA BÁRBARA' : 'UE LIBERTADOR BOLÍVAR'}
                    </div>
                    <div className="bg-dark text-white fw-bold py-0.5 rounded extra-small text-uppercase tracking-wider">
                      PASE DE VISITANTE
                    </div>
                  </div>

                  <div className="text-center mb-3">
                    <div className="fw-bolder text-uppercase fs-6 text-dark">{selectedVisitante.nombres} {selectedVisitante.apellidos}</div>
                    <div className="text-muted small fw-bold">C.I: {selectedVisitante.cedula}</div>
                  </div>

                  <div className="extra-small border-top border-bottom py-2 mb-2">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="fw-bold">Fecha:</span>
                      <span>{new Date(selectedVisitante.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="fw-bold">Hora Entrada:</span>
                      <span>{new Date(selectedVisitante.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {selectedVisitante.telefono && (
                      <div className="d-flex justify-content-between">
                        <span className="fw-bold">Teléfono:</span>
                        <span>{selectedVisitante.telefono}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-2 rounded bg-light border mb-3 extra-small">
                    <span className="fw-bold d-block text-dark mb-0.5">Motivo / Destino:</span>
                    <span className="text-muted">{selectedVisitante.razon_visita}</span>
                  </div>

                  <div className="text-center border-top pt-2 extra-small text-muted">
                    Porte este pase en un lugar visible durante su permanencia en el plantel.
                  </div>
                </div>

              </div>
              <div className="modal-footer bg-light border-top p-3 d-flex justify-content-between">
                <button type="button" className="btn btn-light rounded-pill fw-bold text-muted px-4" onClick={() => setSelectedVisitante(null)}>
                  Cerrar
                </button>
                <button type="button" onClick={handlePrint} className="btn btn-success rounded-pill fw-bold px-4 d-flex align-items-center gap-1.5 text-white">
                  <i className="bi bi-printer-fill"></i>
                  <span>Imprimir Ticket</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
