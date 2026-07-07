import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';
import { formatPhoneNumber } from '../../lib/formatters';


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
  const [activeTab, setActiveTab] = useState<'visitantes' | 'historial'>('visitantes');

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

      // Calculate most common reason
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

      // Capitalize first letter
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

  // --- AUTOCOMPLETADO POR CÉDULA (useEffect con debounce 600ms) ---
  useEffect(() => {
    // Limpiar cuando cédula es corta
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

    console.log('[GestionRegistros] hasCrearVisita:', hasCrearVisita, '| datos:', { cedula, nombres, apellidos, razon_visita });

    if (!cedula) { if (Swal) Swal.fire("Atención", "La cédula es obligatoria.", "warning"); return; }
    if (!nombres) { if (Swal) Swal.fire("Atención", "El nombre es obligatorio. Si el visitante es conocido, espera a que el sistema autocomplete o ingresa manualmente.", "warning"); return; }
    if (!apellidos) { if (Swal) Swal.fire("Atención", "El apellido es obligatorio.", "warning"); return; }
    if (!razon_visita) { if (Swal) Swal.fire("Atención", "El motivo de la visita es obligatorio.", "warning"); return; }

    setRegistrando(true);
    try {
      // DEBUG: mostrar datos que se intentan guardar
      const insertPayload = { cedula, nombres, apellidos, correo, telefono, razon_visita, escuela_id: escuelaSeleccionada };
      console.log('[GestionRegistros] Intentando insertar visitante:', insertPayload);

      const { data, error } = await supabase
        .from('invitados')
        .insert([insertPayload])
        .select()
        .single();

      console.log('[GestionRegistros] Resultado insert - data:', data, ' | error:', error);

      if (error) throw error;

      // Log audit
      auditar(
        'Gestión de Registros', 
        'Registrar Entrada', 
        `Registró entrada de visitante: ${nombres} ${apellidos} (C.I: ${cedula})`
      );

      // Clean inputs
      limpiarFormulario();

      // Refresh data
      await cargarVisitantes();

      if (Swal) {
        Swal.fire({
          title: "¡Visita Registrada!",
          text: "¿Deseas generar el pase de visitante ahora?",
          icon: "success",
          showCancelButton: true,
          confirmButtonColor: "var(--color-primario, #0066FF)",
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
      const msg = err?.message || err?.details || JSON.stringify(err) || 'Error desconocido';
      if (Swal) Swal.fire("Error al guardar", `Detalle: ${msg}`, "error");
    }
    setRegistrando(false);
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
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (res: any) => {
      if (res.isConfirmed) {
        try {
          const { data, error } = await supabase
            .from('invitados')
            .delete()
            .eq('id_invitado', id)
            .select();

          if (error) throw error;

          if (!data || data.length === 0) {
            throw new Error("No se eliminó ningún registro en la base de datos. Verifique que la política RLS de tipo DELETE esté configurada para la tabla 'invitados'.");
          }

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
              body { 
                font-family: 'Segoe UI', Arial, sans-serif;
                margin: 0;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                background-color: #fff;
              }
              .ticket-card {
                width: 80mm;
                border: 2px dashed #000;
                padding: 15px;
                text-align: center;
                background: #fff;
                border-radius: 8px;
              }
              .ticket-header {
                border-bottom: 2px dashed #000;
                padding-bottom: 10px;
                margin-bottom: 15px;
              }
              .school-title {
                font-size: 1.1rem;
                font-weight: 800;
                text-transform: uppercase;
                margin-bottom: 2px;
              }
              .ticket-title {
                font-size: 1.2rem;
                font-weight: 800;
                letter-spacing: 2px;
                background: #000;
                color: #fff;
                padding: 3px 0;
                margin-top: 5px;
              }
              .visitor-name {
                font-size: 1.3rem;
                font-weight: 800;
                margin: 10px 0 2px 0;
                text-transform: uppercase;
              }
              .visitor-id {
                font-size: 0.95rem;
                font-weight: bold;
                color: #555;
                margin-bottom: 12px;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                font-size: 0.8rem;
                margin-bottom: 4px;
                border-bottom: 1px solid #eee;
                padding-bottom: 2px;
              }
              .info-label {
                font-weight: bold;
              }
              .reason-box {
                background-color: #f5f5f5;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 6px;
                font-size: 0.75rem;
                text-align: left;
                margin: 10px 0;
                min-height: 40px;
              }
              .barcode-container {
                margin-top: 15px;
              }
              .barcode-bar {
                display: inline-block;
                height: 40px;
                background-color: #000;
              }
              .barcode-text {
                font-size: 0.7rem;
                font-family: monospace;
                letter-spacing: 3px;
                margin-top: 2px;
              }
              .footer-notice {
                font-size: 0.65rem;
                color: #666;
                margin-top: 15px;
                border-top: 1px dashed #000;
                padding-top: 8px;
              }
              @media print {
                body { padding: 0; }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }
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

    // Apply date range filters
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

  // Logs pagination
  const totalLogPages = Math.ceil(filteredLogs.length / logsPerPage) || 1;
  const currentLogs = filteredLogs.slice((logPage - 1) * logsPerPage, logPage * logsPerPage);

  if (permLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5 h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando permisos...</span>
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
        <p className="text-muted mb-0">No tienes permisos asignados para acceder a la gestión de registros.</p>
      </div>
    );
  }

  return (
    <div className="modulo-animado container-fluid p-0">
      {/* Banner */}
      <div className="row mb-4 animate__animated animate__fadeInDown">
        <div className="col-12">
          <div 
            className="banner-modulo p-4 p-md-5 text-white shadow-sm" 
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
          >
            <div className="burbuja-3d burbuja-1" style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.06)', position: 'absolute', top: '-50px', right: '-20px', borderRadius: '50%' }}></div>
            <div className="burbuja-3d burbuja-2" style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.04)', position: 'absolute', bottom: '-20px', left: '20px', borderRadius: '50%' }}></div>
            <div className="row align-items-center position-relative z-1">
              <div className="col-12 text-center text-md-start">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <span className="badge bg-white mb-0 px-3 py-2 shadow-sm fw-bold" style={{ color: '#0f172a', letterSpacing: '1px', fontSize: '0.85rem' }}>
                    <i className="bi bi-database-fill-gear me-1"></i> DIRECCIÓN Y SISTEMA
                  </span>
                  <div className="d-flex gap-2">
                    {isDualAccess && (
                      <div className="btn-group bg-white p-1 rounded-pill shadow-sm">
                        <button 
                          onClick={() => setEscuelaSeleccionada('sb')} 
                          className={`btn btn-sm rounded-pill px-3 fw-bold ${escuelaSeleccionada === 'sb' ? 'btn-success text-white' : 'btn-light text-muted border-0'}`}
                        >
                          Santa Bárbara
                        </button>
                        <button 
                          onClick={() => setEscuelaSeleccionada('lb')} 
                          className={`btn btn-sm rounded-pill px-3 fw-bold ${escuelaSeleccionada === 'lb' ? 'btn-primary text-white' : 'btn-light text-muted border-0'}`}
                        >
                          Libertador
                        </button>
                      </div>
                    )}
                    <button 
                      onClick={() => navigate('/categoria/Direcci%C3%B3n%20y%20Sistema')} 
                      className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                    >
                      <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
                    </button>
                  </div>
                </div>
                <h1 className="fw-bolder mb-2 text-white" style={{ fontSize: '2.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  <i className="bi bi-database-fill-gear me-3"></i>Gestión de Registros
                </h1>
                <p className="mb-0 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Control de visitantes, generación de credenciales y bitácora de operaciones para {escuelaSeleccionada === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar'}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs selectors */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="bg-white p-2 rounded-4 shadow-sm border d-inline-flex gap-2 flex-wrap">
            <button 
              onClick={() => setActiveTab('visitantes')} 
              className={`btn rounded-pill px-4 fw-bold hover-efecto ${activeTab === 'visitantes' ? 'btn-dark text-white' : 'btn-light text-muted'}`}
            >
              <i className="bi bi-people-fill me-2"></i> Control de Visitantes
            </button>
            <button 
              onClick={() => setActiveTab('historial')} 
              className={`btn rounded-pill px-4 fw-bold hover-efecto ${activeTab === 'historial' ? 'btn-dark text-white' : 'btn-light text-muted'}`}
            >
              <i className="bi bi-clock-history me-2"></i> Bitácora de Escuela
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: VISITANTES */}
      {activeTab === 'visitantes' && (
        <div className="row g-4 animate__animated animate__fadeIn">
          {/* Dashboard Stats */}
          <div className="col-12">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white d-flex flex-row align-items-center gap-3">
                  <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle">
                    <i className="bi bi-person-check-fill fs-3"></i>
                  </div>
                  <div>
                    <h6 className="text-muted small uppercase mb-1 fw-bold">Entradas Hoy</h6>
                    <h3 className="fw-bolder mb-0 text-dark">{stats.visitasHoy}</h3>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white d-flex flex-row align-items-center gap-3">
                  <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-circle">
                    <i className="bi bi-calendar-check-fill fs-3"></i>
                  </div>
                  <div>
                    <h6 className="text-muted small uppercase mb-1 fw-bold">Total del Mes</h6>
                    <h3 className="fw-bolder mb-0 text-dark">{stats.visitasMes}</h3>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white d-flex flex-row align-items-center gap-3">
                  <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-circle">
                    <i className="bi bi-question-circle-fill fs-3"></i>
                  </div>
                  <div>
                    <h6 className="text-muted small uppercase mb-1 fw-bold">Motivo Frecuente</h6>
                    <h5 className="fw-bolder mb-0 text-dark text-truncate" style={{ maxWidth: '220px' }}>{stats.motivoFrecuente}</h5>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Left panel: Add Visitor Form */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-header bg-white border-bottom p-4">
                <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-person-plus-fill text-success me-2"></i>Registrar Entrada</h5>
              </div>
              <div className="card-body p-4">
                {hasCrearVisita ? (
                  <form onSubmit={handleSaveVisitante} className="row g-3">
                    {/* CÉDULA + búsqueda automática */}
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">Cédula de Identidad <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control input-moderno"
                          placeholder="Ej: 25888999"
                          value={formCedula}
                          onChange={handleCedulaChange}
                          required
                        />
                        {buscandoCedula && (
                          <span className="input-group-text bg-white border">
                            <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* BANNER: visitante reconocido */}
                    {autocompletado && (
                      <div className="col-12">
                        <div className="alert alert-success border-0 rounded-3 py-2 px-3 d-flex align-items-center gap-2 mb-0" style={{ background: 'linear-gradient(135deg,#d1fae5,#a7f3d0)' }}>
                          <i className="bi bi-person-check-fill fs-4 text-success"></i>
                          <div className="flex-grow-1">
                            <div className="fw-bold text-success small">✅ Visitante reconocido</div>
                            <div className="fw-bolder text-dark">{formNombres} {formApellidos}</div>
                            <div className="small text-muted">{visitasAnteriores} visita(s) anterior(es) registrada(s)</div>
                          </div>
                          <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill" onClick={() => { setAutocompletado(false); setFormNombres(''); setFormApellidos(''); setFormCorreo(''); setFormTelefono(''); }}>
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Datos personales: colapsados si hay autocompletado */}
                    {!autocompletado && (
                      <>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-muted">Nombres <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            className="form-control input-moderno"
                            placeholder="Ej: Pedro"
                            value={formNombres}
                            onChange={(e) => setFormNombres(e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-bold text-muted">Apellidos <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            className="form-control input-moderno"
                            placeholder="Ej: Pérez"
                            value={formApellidos}
                            onChange={(e) => setFormApellidos(e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label small fw-bold text-muted">Correo Electrónico</label>
                          <input
                            type="email"
                            className="form-control input-moderno"
                            placeholder="Ej: pedro.perez@email.com"
                            value={formCorreo}
                            onChange={(e) => setFormCorreo(e.target.value)}
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label small fw-bold text-muted">Teléfono de Contacto</label>
                          <input
                            type="text"
                            className="form-control input-moderno"
                            placeholder="Ej: 0414-1234567"
                            value={formTelefono}
                            onChange={(e) => setFormTelefono(formatPhoneNumber(e.target.value))}
                          />
                        </div>
                      </>
                    )}

                    {/* Motivo: siempre visible */}
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">Motivo de la Visita <span className="text-danger">*</span></label>
                      <textarea
                        className="form-control input-moderno"
                        placeholder="Escribe el motivo detallado de la visita..."
                        rows={3}
                        value={formRazon}
                        onChange={(e) => setFormRazon(e.target.value)}
                        required
                        autoFocus={autocompletado}
                      />
                    </div>

                    <div className="col-12 pt-2">
                      <button
                        type="submit"
                        className={`btn w-100 rounded-pill fw-bold hover-efecto shadow-sm ${autocompletado ? 'btn-success' : 'btn-primary'}`}
                        disabled={registrando}
                      >
                        {registrando ? (
                          <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Guardando...</>
                        ) : autocompletado ? (
                          <><i className="bi bi-lightning-charge-fill me-2"></i>Registrar Acceso Rápido</>
                        ) : (
                          <><i className="bi bi-floppy-fill me-2"></i>Registrar Entrada</>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="alert alert-secondary text-center py-4 rounded-4 mb-0">
                    <i className="bi bi-lock-fill fs-3 text-muted d-block mb-2"></i>
                    <span className="small text-muted fw-bold">Tu rol no cuenta con privilegios para registrar nuevas visitas.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right panel: Visitors list */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-header bg-white border-bottom p-4">
                <div className="row g-3 align-items-center">
                  <div className="col-md-5">
                    <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-people-fill text-primary me-2"></i>Historial de Visitas</h5>
                  </div>
                  <div className="col-md-7 d-flex gap-2 flex-wrap justify-content-md-end">
                    <select 
                      className="form-select form-select-sm rounded-pill border-secondary border-opacity-50"
                      value={dateFilter}
                      onChange={(e: any) => setDateFilter(e.target.value)}
                      style={{ width: '130px', cursor: 'pointer' }}
                    >
                      <option value="todas">Ver todas</option>
                      <option value="hoy">Hoy</option>
                      <option value="semana">Últimos 7 días</option>
                      <option value="mes">Este mes</option>
                    </select>
                    <div className="input-group input-group-sm" style={{ width: '220px' }}>
                      <span className="input-group-text bg-white border-end-0 border-secondary border-opacity-50"><i className="bi bi-search text-muted"></i></span>
                      <input 
                        type="text" 
                        className="form-control border-start-0 border-secondary border-opacity-50" 
                        placeholder="Buscar por cédula o nombre..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-body p-0">
                {loadingVisitantes ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                  </div>
                ) : filteredVisitantes.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-clipboard-x fs-1 d-block mb-2"></i>
                    No se encontraron registros de visitas para el filtro seleccionado.
                  </div>
                ) : (
                  <div className="table-responsive" style={{ maxHeight: '550px', overflowY: 'auto' }}>
                    <table className="table table-hover align-middle mb-0">
                      <thead className="bg-light text-muted small text-uppercase">
                        <tr>
                          <th className="ps-4">Fecha y Hora</th>
                          <th>Visitante</th>
                          <th>Contacto</th>
                          <th>Motivo</th>
                          <th className="text-center pe-4" style={{ width: '130px' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVisitantes.map(v => (
                          <tr key={v.id_invitado} className="hover-efecto">
                            <td className="ps-4 fw-bold text-dark small">
                              <i className="bi bi-clock me-1 text-muted"></i>
                              {new Date(v.created_at).toLocaleString('es-VE')}
                            </td>
                            <td>
                              <div className="fw-bold text-primary">{v.nombres} {v.apellidos}</div>
                              <div className="small text-muted fw-semibold">C.I: {v.cedula}</div>
                            </td>
                            <td>
                              <div className="small text-dark">{v.telefono ? formatPhoneNumber(v.telefono) : 'Sin teléfono'}</div>
                              <div className="small text-muted">{v.correo || 'Sin correo'}</div>
                            </td>
                            <td>
                              <div className="small text-dark text-truncate" style={{ maxWidth: '180px' }} title={v.razon_visita}>
                                {v.razon_visita}
                              </div>
                            </td>
                            <td className="text-center pe-4">
                              <button 
                                className="btn btn-sm btn-light text-success border rounded-circle shadow-sm hover-efecto me-1"
                                onClick={() => setSelectedVisitante(v)}
                                title="Generar Pase de Visitante"
                              >
                                <i className="bi bi-card-heading"></i>
                              </button>
                              {hasEliminarVisita && (
                                <button 
                                  className="btn btn-sm btn-light text-danger border rounded-circle shadow-sm hover-efecto"
                                  onClick={() => handleDeleteVisitante(v.id_invitado, `${v.nombres} ${v.apellidos}`)}
                                  title="Eliminar Registro"
                                >
                                  <i className="bi bi-trash3-fill"></i>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDITORÍA */}
      {activeTab === 'historial' && (
        <div className="row animate__animated animate__fadeIn">
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-bottom p-4">
                <div className="row g-3 align-items-center">
                  <div className="col-md-5">
                    <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-clock-history text-primary me-2"></i>Bitácora de Operaciones del Plantel</h5>
                  </div>
                  <div className="col-md-7 d-flex justify-content-md-end">
                    <div className="input-group input-group-sm" style={{ width: '280px' }}>
                      <span className="input-group-text bg-white border-end-0 border-secondary border-opacity-50"><i className="bi bi-search text-muted"></i></span>
                      <input 
                        type="text" 
                        className="form-control border-start-0 border-secondary border-opacity-50" 
                        placeholder="Buscar por usuario, acción o módulo..." 
                        value={searchLogsQuery}
                        onChange={(e) => { setSearchLogsQuery(e.target.value); setLogPage(1); }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-body p-0">
                {loadingLogs ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                  </div>
                ) : currentLogs.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-clipboard-x fs-1 d-block mb-2"></i>
                    No se encontraron registros de operaciones.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="bg-light text-muted small text-uppercase">
                        <tr>
                          <th className="ps-4">Fecha y Hora</th>
                          <th>Usuario</th>
                          <th>Módulo</th>
                          <th>Acción</th>
                          <th>Detalles</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentLogs.map(l => (
                          <tr key={l.id} className="hover-efecto">
                            <td className="ps-4 fw-bold text-dark small">
                              <i className="bi bi-clock me-1 text-muted"></i>
                              {new Date(l.fecha).toLocaleString('es-VE')}
                            </td>
                            <td>
                              <div className="fw-bold text-primary">{l.usuario_nombre}</div>
                              <div className="small text-muted font-monospace">C.I: {l.usuario_cedula}</div>
                            </td>
                            <td>
                              <span className="badge bg-secondary bg-opacity-10 text-secondary border">
                                {l.modulo}
                              </span>
                            </td>
                            <td>
                              <span className="fw-bold text-dark small">{l.accion}</span>
                            </td>
                            <td>
                              <div className="small text-muted text-truncate" style={{ maxWidth: '280px' }} title={l.detalles}>
                                {l.detalles || '-'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {totalLogPages > 1 && (
                <div className="card-footer bg-white border-top p-3 d-flex justify-content-center">
                  <nav>
                    <ul className="pagination mb-0 pagination-sm">
                      <li className={`page-item ${logPage === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setLogPage(prev => Math.max(1, prev - 1))}>
                          <i className="bi bi-chevron-left"></i>
                        </button>
                      </li>
                      {Array.from({ length: totalLogPages }, (_, i) => i + 1).map(p => (
                        <li key={p} className={`page-item ${logPage === p ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => setLogPage(p)}>{p}</button>
                        </li>
                      ))}
                      <li className={`page-item ${logPage === totalLogPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setLogPage(prev => Math.min(totalLogPages, prev + 1))}>
                          <i className="bi bi-chevron-right"></i>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRINT TICKET / PASS DIALOG (MODAL) */}
      {selectedVisitante && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15,23,42,0.45)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '420px' }}>
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold text-dark"><i className="bi bi-card-heading text-primary me-2"></i>Pase de Visitante</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedVisitante(null)} aria-label="Close"></button>
              </div>
              <div className="modal-body p-4 text-center">
                {/* Print area */}
                <div id="visitor-pass-print-area" className="d-flex justify-content-center">
                  <div className="ticket-card" style={{ width: '100%', border: '2px dashed #475569', padding: '20px', background: '#fff', borderRadius: '12px', textAlign: 'center' }}>
                    <div className="ticket-header" style={{ borderBottom: '2px dashed #94a3b8', paddingBottom: '12px', marginBottom: '15px' }}>
                      <div className="school-title" style={{ fontSize: '1rem', fontWeight: '800', textTransform: 'uppercase', color: '#1e293b' }}>
                        {escuelaSeleccionada === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar'}
                      </div>
                      <div className="small text-muted" style={{ fontSize: '0.75rem' }}>Sistema de Registro Escolar</div>
                      <div className="ticket-title" style={{ fontSize: '1.1rem', fontWeight: '800', letterSpacing: '2px', background: '#1e293b', color: '#fff', padding: '4px 0', marginTop: '8px', borderRadius: '4px' }}>
                        VISITANTE
                      </div>
                    </div>
                    
                    <div className="visitor-name" style={{ fontSize: '1.25rem', fontWeight: '800', margin: '15px 0 2px 0', textTransform: 'uppercase', color: '#0f172a' }}>
                      {selectedVisitante.nombres} {selectedVisitante.apellidos}
                    </div>
                    <div className="visitor-id" style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#475569', marginBottom: '15px' }}>
                      C.I: {selectedVisitante.cedula}
                    </div>

                    <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', color: '#334155' }}>
                      <span className="info-label" style={{ fontWeight: 'bold' }}>Fecha Entrada:</span>
                      <span>{new Date(selectedVisitante.created_at).toLocaleDateString('es-VE')}</span>
                    </div>
                    <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', color: '#334155' }}>
                      <span className="info-label" style={{ fontWeight: 'bold' }}>Hora Entrada:</span>
                      <span>{new Date(selectedVisitante.created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {selectedVisitante.telefono && (
                      <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px', color: '#334155' }}>
                        <span className="info-label" style={{ fontWeight: 'bold' }}>Contacto:</span>
                        <span>{formatPhoneNumber(selectedVisitante.telefono)}</span>
                      </div>
                    )}

                    <div style={{ textAlign: 'left', marginTop: '15px' }}>
                      <span className="small fw-bold text-muted d-block mb-1" style={{ fontSize: '0.75rem' }}>Motivo de Visita:</span>
                      <div className="reason-box" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', fontSize: '0.8rem', color: '#334155', minHeight: '50px', wordBreak: 'break-word' }}>
                        {selectedVisitante.razon_visita}
                      </div>
                    </div>

                    <div className="barcode-container" style={{ marginTop: '20px' }}>
                      <div style={{ letterSpacing: '4px', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 'bold', color: '#1e293b' }}>
                        {`*VIS-${selectedVisitante.cedula}*`}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.65rem', marginTop: '4px' }}>
                        Presente este pase para retirarse del plantel
                      </div>
                    </div>

                    <div className="footer-notice" style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '20px', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                      SIGAE - Módulo de Registro y Control
                    </div>
                  </div>
                </div>

                {/* Print controls */}
                <div className="d-flex gap-2 mt-4">
                  <button 
                    type="button" 
                    className="btn btn-light rounded-pill fw-bold flex-fill" 
                    onClick={() => setSelectedVisitante(null)}
                  >
                    Cerrar
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary rounded-pill fw-bold flex-fill hover-efecto" 
                    onClick={handlePrint}
                    style={{ backgroundColor: 'var(--color-primario, #0066FF)', borderColor: 'var(--color-primario, #0066FF)' }}
                  >
                    <i className="bi bi-printer-fill me-2"></i>Imprimir Pase
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
