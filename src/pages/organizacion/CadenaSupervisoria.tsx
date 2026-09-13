import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';
import { 
  ChamiloBreadcrumb, 
  ChamiloHelpCallout, 
  IconoCadenaSupervisoria,
  IconoConstructorJerarquia,
  IconoArbolOrganigrama
} from '../../components/chamilo';

interface Cargo {
  id_cargo: string;
  nombre_cargo: string;
  tipo_cargo: string;
  descripcion: string;
  depende_de: string | null;
  id_escuela: string | null; // null = ambas escuelas / corporativo
}

interface UsuarioSimple {
  id_usuario: string;
  cedula: string;
  nombre_completo: string;
  cargo: string | null;
  id_escuela: string | null;
}

/**
 * Determina si un cargo es interinstitucional (Líder de Escuela y Apoyo a la Gestión),
 * lo que significa que son exactamente las mismas personas asignadas para ambas instituciones.
 */
export const esCargoInterinstitucional = (nombreCargo: string): boolean => {
  const norm = (nombreCargo || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return (
    (norm.includes('lider') && norm.includes('escuela')) ||
    (norm.includes('apoyo') && norm.includes('gestion'))
  );
};

// Componente recursivo para renderizar nodos del organigrama
const OrganigramaNodo = ({
  cargo,
  cargos,
  usuarios,
  mostrarNombres,
  escuelaContext = null,
  visitados = new Set<string>()
}: {
  cargo: Cargo;
  cargos: Cargo[];
  usuarios: UsuarioSimple[];
  mostrarNombres: boolean;
  escuelaContext?: 'sb' | 'lb' | null;
  visitados?: Set<string>;
}) => {
  if (visitados.has(cargo.id_cargo)) {
    return (
      <li>
        <div className="nodo-cargo-custom" style={{ borderColor: '#ef4444', backgroundColor: '#fee2e2' }}>
          ⚠️ Ciclo: {cargo.nombre_cargo}
        </div>
      </li>
    );
  }

  const newVisitados = new Set(visitados);
  newVisitados.add(cargo.id_cargo);

  const isCompartido = esCargoInterinstitucional(cargo.nombre_cargo);

  const tipo = (cargo.tipo_cargo || '').toLowerCase();
  let cBg = '#ffffff';
  let cBorde = '#e11d48';
  let cTexto = '#e11d48';

  if (isCompartido) {
    cBg = '#faf5ff';
    cBorde = '#7c3aed';
    cTexto = '#581c87';
  } else if (tipo.includes('directiv') || tipo.includes('gerenc')) {
    cBg = '#fff1f2';
    cBorde = '#e11d48';
    cTexto = '#9f1239';
  } else if (tipo.includes('coord') || tipo.includes('superv')) {
    cBg = '#eff6ff';
    cBorde = '#2563eb';
    cTexto = '#1d4ed8';
  } else if (tipo.includes('docen') || tipo.includes('pedag')) {
    cBg = '#f0fdf4';
    cBorde = '#16a34a';
    cTexto = '#14532d';
  } else if (tipo.includes('admin')) {
    cBg = '#fffbeb';
    cBorde = '#d97706';
    cTexto = '#78350f';
  } else {
    cBg = '#f8fafc';
    cBorde = '#475569';
    cTexto = '#0f172a';
  }

  // Personal asignado (Líder de Escuela y Apoyo a la Gestión aplican a ambas instituciones)
  const dueños = usuarios.filter(u => {
    if (u.cargo !== cargo.nombre_cargo) return false;
    if (isCompartido) return true;
    if (escuelaContext) {
      return u.id_escuela === escuelaContext || !u.id_escuela;
    }
    if (cargo.id_escuela) {
      return u.id_escuela === cargo.id_escuela;
    }
    return true;
  });

  const hijos = cargos.filter(c => c.depende_de === cargo.id_cargo);
  hijos.sort((a, b) => a.nombre_cargo.localeCompare(b.nombre_cargo));

  const hijosParaRender = hijos.flatMap(h => {
    if (escuelaContext === null && h.nombre_cargo.toLowerCase().includes('director') && !h.id_escuela) {
      return [
        { cargoHijo: h, escCtx: 'sb' as const },
        { cargoHijo: h, escCtx: 'lb' as const }
      ];
    }
    return [{ cargoHijo: h, escCtx: escuelaContext }];
  });

  let nombreMostrado = cargo.nombre_cargo;
  if (!isCompartido && escuelaContext && !cargo.id_escuela) {
    nombreMostrado += escuelaContext === 'sb' ? ' (Santa Bárbara)' : ' (Libertador Bolívar)';
  }

  return (
    <li>
      <div className="nodo-cargo-custom shadow-xs" style={{ borderColor: cBorde, backgroundColor: cBg, borderRadius: '12px', padding: '10px 14px' }}>
        <div style={{ color: cTexto, fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', marginBottom: '2px', lineHeight: 1.2 }}>
          {nombreMostrado}
        </div>
        <div className="d-flex align-items-center justify-content-center gap-1">
          <span style={{ color: '#64748b', fontSize: '9px', fontWeight: 600 }}>
            {cargo.tipo_cargo}
          </span>
          {isCompartido ? (
            <span className="badge rounded-pill text-white shadow-xs" style={{ backgroundColor: '#7c3aed', fontSize: '7px', padding: '2px 5px' }}>
              <i className="bi bi-buildings-fill me-1"></i>Ambas Instituciones
            </span>
          ) : !cargo.id_escuela ? (
            <span className="badge bg-secondary rounded-pill" style={{ fontSize: '7px', padding: '2px 5px' }}>
              Ambas Sedes
            </span>
          ) : null}
        </div>
        {mostrarNombres && (
          <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: `1px dashed ${cBorde}`, fontSize: '9px' }}>
            {dueños.length > 0 ? (
              dueños.map(d => (
                <div key={d.id_usuario} style={{ fontWeight: 'bold', color: '#1e293b', marginTop: '2px' }}>
                  <i className="bi bi-person-fill me-1 text-muted"></i>{d.nombre_completo}
                  {isCompartido && (
                    <span className="badge bg-light text-primary border ms-1 extra-small fw-normal" style={{ fontSize: '7px' }}>
                      Biescolar
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div style={{ color: '#ef4444', fontWeight: 'bold', fontStyle: 'italic' }}>Puesto Vacante</div>
            )}
          </div>
        )}
      </div>

      {hijosParaRender.length > 0 && (
        <ul>
          {hijosParaRender.map(({ cargoHijo, escCtx }, idx) => (
            <OrganigramaNodo
              key={`${cargoHijo.id_cargo}-${escCtx || 'global'}-${idx}`}
              cargo={cargoHijo}
              cargos={cargos}
              usuarios={usuarios}
              mostrarNombres={mostrarNombres}
              escuelaContext={escCtx}
              visitados={newVisitados}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export const CadenaSupervisoria = () => {
  const navigate = useNavigate();
  const { tienePermiso, tienePermisoEnEscuela, tieneAccesoEscuela, user, loading: permLoading } = usePermisos();
  const Swal = (window as any).Swal;

  const canSeeSB = tieneAccesoEscuela('sb');
  const canSeeLB = tieneAccesoEscuela('lb');
  const tieneDobleAcceso = user?.rol === 'SuperAdmin' || (canSeeSB && canSeeLB);

  // Selector Superior de Escuela: 'todas' | 'sb' | 'lb'
  const [filtroEscuelaActiva, setFiltroEscuelaActiva] = useState<'todas' | 'sb' | 'lb'>('todas');

  // Pestañas Principales: 'constructor' (Estructurar Jerarquía) vs 'mapa' (Ver Organigrama)
  const [tabActivo, setTabActivo] = useState<'constructor' | 'mapa'>('constructor');

  // Datos Maestros
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioSimple[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados del Constructor
  const [cambiosPendientes, setCambiosPendientes] = useState<{ [cargoId: string]: string | null }>({});
  const [busquedaCargo, setBusquedaCargo] = useState('');
  const [filtroTipoCargo, setFiltroTipoCargo] = useState<string>('todos');

  // Estados del Visor de Organigrama
  const [filtroRama, setFiltroRama] = useState('');
  const [mostrarNombres, setMostrarNombres] = useState(true);

  // Permisos
  const canEstructurarCrearSB = tienePermisoEnEscuela('sb', 'Función: Estructurar Cadena', 'crear');
  const canEstructurarCrearLB = tienePermisoEnEscuela('lb', 'Función: Estructurar Cadena', 'crear');
  const pCrear = canEstructurarCrearSB || canEstructurarCrearLB;
  const pImprimir = tienePermisoEnEscuela('sb', 'Función: Imprimir Organigrama', 'imprimir') || tienePermisoEnEscuela('lb', 'Función: Imprimir Organigrama', 'imprimir');
  const hasModuloAcceso = tienePermiso('Cadena Supervisoria', 'ver');
  const isRestricted = !permLoading && !hasModuloAcceso;

  const cambiarEscuelaActiva = (nuevaEscuela: 'sb' | 'lb') => {
    setFiltroEscuelaActiva(nuevaEscuela);
    localStorage.setItem('sigae_escuela_codigo', nuevaEscuela);
    localStorage.setItem('sigae_escuela_activa', nuevaEscuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
    try {
      const u = JSON.parse(localStorage.getItem('usuario_sigae') || '{}');
      u.id_escuela = nuevaEscuela;
      u.nombre_escuela = nuevaEscuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
      localStorage.setItem('usuario_sigae', JSON.stringify(u));
    } catch {
      // ignorar
    }
    window.location.reload();
  };

  // Sincronizar escuela por defecto según rol
  useEffect(() => {
    if (!permLoading && user) {
      if (canSeeSB && !canSeeLB) {
        setFiltroEscuelaActiva('sb');
      } else if (canSeeLB && !canSeeSB) {
        setFiltroEscuelaActiva('lb');
      } else {
        const stored = localStorage.getItem('sigae_escuela_codigo');
        if (stored === 'sb' || stored === 'lb') {
          setFiltroEscuelaActiva(stored);
        } else {
          setFiltroEscuelaActiva('todas');
        }
      }
    }
  }, [permLoading, user, canSeeSB, canSeeLB]);

  useEffect(() => {
    if (!permLoading && hasModuloAcceso) {
      cargarDatosMaestros();
    }
  }, [permLoading]);

  const cargarDatosMaestros = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const [resCargos, resUsers] = await Promise.all([
        supabase.from('cargos').select('*').order('nombre_cargo', { ascending: true }),
        supabase.from('usuarios').select('id_usuario, cedula, nombre_completo, cargo, id_escuela, rol')
      ]);

      if (resCargos.error) throw resCargos.error;
      if (resUsers.error) throw resUsers.error;

      const rolesNoPersonal = ['representante', 'estudiante', 'alumno', 'alumna', 'invitado', 'visitante'];
      const personalValido = (resUsers.data || []).filter((u: any) => {
        const r = String(u.rol || '').trim().toLowerCase();
        if (!r) return false;
        if (rolesNoPersonal.includes(r)) return false;
        if (r.includes('representante') || r.includes('estudiante') || r.includes('invitado') || r.includes('visitante')) return false;
        return true;
      });

      setCargos(resCargos.data || []);
      setUsuarios(personalValido);
    } catch (e: any) {
      console.error('Error cargando datos de cadena supervisoria:', e);
      if (Swal) Swal.fire('Error', 'No se pudieron cargar los datos de la cadena supervisoria.', 'error');
    } finally {
      if (!silencioso) setLoading(false);
    }
  };

  // Detección de ciclos jerárquicos
  const detectarCiclo = (cargoId: string, supervisorPropuestoId: string, listaCargos: Cargo[]): boolean => {
    if (!supervisorPropuestoId) return false;
    if (cargoId === supervisorPropuestoId) return true;

    let actualId: string | null = supervisorPropuestoId;
    const visitados = new Set<string>();

    while (actualId) {
      if (actualId === cargoId) return true;
      if (visitados.has(actualId)) break;
      visitados.add(actualId);

      const supCargo = listaCargos.find(c => c.id_cargo === actualId);
      actualId = supCargo?.depende_de || null;
    }
    return false;
  };

  // Manejar cambio de supervisor en el constructor
  const handleChangeSupervisor = (cargoId: string, nuevoSupervisorId: string) => {
    const valorFinal = nuevoSupervisorId === '' ? null : nuevoSupervisorId;
    const cargoOriginal = cargos.find(c => c.id_cargo === cargoId);

    if (cargoOriginal && cargoOriginal.depende_de === valorFinal) {
      const actualizados = { ...cambiosPendientes };
      delete actualizados[cargoId];
      setCambiosPendientes(actualizados);
    } else {
      setCambiosPendientes(prev => ({
        ...prev,
        [cargoId]: valorFinal
      }));
    }
  };

  // Guardar cambios jerárquicos en la base de datos
  const handleSaveJerarquia = async () => {
    const totalCambios = Object.keys(cambiosPendientes).length;
    if (totalCambios === 0) return;

    if (!pCrear) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permisos para modificar la jerarquía.', 'error');
      return;
    }

    const confirm = await Swal.fire({
      title: `¿Guardar ${totalCambios} cambio(s) de jerarquía?`,
      text: 'La cadena de mando y el organigrama oficial se actualizarán inmediatamente.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, guardar estructura',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b'
    });

    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      for (const [cargoId, supervisorId] of Object.entries(cambiosPendientes)) {
        const { error } = await supabase
          .from('cargos')
          .update({ depende_de: supervisorId })
          .eq('id_cargo', cargoId);

        if (error) throw error;
      }

      await auditar('Organización Escolar', 'Actualizar Cadena Supervisoria', `Se guardaron ${totalCambios} asignaciones jerárquicas.`);

      Swal.fire({
        icon: 'success',
        title: '¡Jerarquía Actualizada!',
        text: 'La cadena supervisoria se guardó con éxito en el sistema.',
        confirmButtonColor: '#e11d48'
      });

      setCambiosPendientes({});
      await cargarDatosMaestros(true);
    } catch (e: any) {
      console.error(e);
      Swal.fire('Error', 'No se pudieron guardar las dependencias jerárquicas.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Exportar Organigrama a PDF
  const handleExportPDF = () => {
    const el = document.getElementById('chart_div');
    if (!el) {
      if (Swal) Swal.fire('Aviso', 'No hay organigrama visual para exportar.', 'info');
      return;
    }
    window.print();
  };

  // Filtrado de cargos según la escuela activa seleccionada
  const cargosFiltrados = cargos.filter(c => {
    // 1. Filtro de Escuela (cargos específicos de la escuela seleccionada + cargos que aplican a ambas escuelas / id_escuela === null)
    let pasaEscuela = true;
    if (filtroEscuelaActiva === 'sb') {
      pasaEscuela = c.id_escuela === 'sb' || c.id_escuela === null;
    } else if (filtroEscuelaActiva === 'lb') {
      pasaEscuela = c.id_escuela === 'lb' || c.id_escuela === null;
    }

    // 2. Filtro de Búsqueda por Nombre
    let pasaBusqueda = true;
    if (busquedaCargo.trim()) {
      const q = busquedaCargo.toLowerCase();
      pasaBusqueda = c.nombre_cargo.toLowerCase().includes(q) || (c.descripcion || '').toLowerCase().includes(q);
    }

    // 3. Filtro de Tipo de Cargo
    let pasaTipo = true;
    if (filtroTipoCargo !== 'todos') {
      pasaTipo = (c.tipo_cargo || '').toLowerCase() === filtroTipoCargo.toLowerCase();
    }

    return pasaEscuela && pasaBusqueda && pasaTipo;
  });

  // Cargos visibles para el mapa del organigrama
  const cargosVisiblesMapa = cargos.filter(c => {
    if (filtroEscuelaActiva === 'sb') return c.id_escuela === 'sb' || c.id_escuela === null;
    if (filtroEscuelaActiva === 'lb') return c.id_escuela === 'lb' || c.id_escuela === null;
    return true;
  });

  // Usuarios visibles en el organigrama (Líder y Apoyo son las mismas personas para ambas instituciones)
  const usuariosVisiblesMapa = usuarios.filter(u => {
    if (u.cargo && esCargoInterinstitucional(u.cargo)) return true;
    if (filtroEscuelaActiva === 'sb') return u.id_escuela === 'sb' || !u.id_escuela;
    if (filtroEscuelaActiva === 'lb') return u.id_escuela === 'lb' || !u.id_escuela;
    return true;
  });

  // Raíces del organigrama (cargos sin supervisor o seleccionados por rama)
  let raices = cargosVisiblesMapa.filter(c => !c.depende_de);
  if (filtroRama) {
    raices = cargosVisiblesMapa.filter(c => c.id_cargo === filtroRama);
  }

  const totalCargosEscuela = cargosVisiblesMapa.length;
  const cargosEnlazados = cargosVisiblesMapa.filter(c => c.depende_de).length;
  const cargosRaices = cargosVisiblesMapa.filter(c => !c.depende_de).length;
  const porcentajeEnlazados = totalCargosEscuela > 0 ? Math.round((cargosEnlazados / totalCargosEscuela) * 100) : 0;

  const tiposDisponibles = [...new Set(cargos.map(c => c.tipo_cargo).filter(Boolean))];

  if (isRestricted) {
    return (
      <div className="col-12 text-center py-5 mt-4">
        <div className="bg-light d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm border" style={{ width: '100px', height: '100px' }}>
          <i className="bi bi-shield-lock-fill text-muted" style={{ fontSize: '3.5rem' }}></i>
        </div>
        <h4 className="text-dark fw-bold mb-2">Área Restringida</h4>
        <p className="text-muted mb-0">No tienes permisos asignados para acceder a la jerarquía de cargos.</p>
      </div>
    );
  }

  return (
    <div className="modulo-animado container-fluid p-0 animate__animated animate__fadeIn">

      {/* 1. MIGAS DE PAN CHAMILO */}
      <ChamiloBreadcrumb
        category="Organización Escolar"
        currentModule="Cadena Supervisoria"
      />

      {/* 2. CUADRO DE AYUDA METODOLÓGICA CHAMILO */}
      <ChamiloHelpCallout
        id="ayuda_cadena_supervisoria"
        title="Guía Práctica para Construir y Visualizar la Cadena Supervisoria"
        content="Para construir la jerarquía escolar: 1) Seleccione la institución en la barra superior (los cargos compartidos aplican a ambas sedes). 2) Deje la máxima autoridad (Director o Gerente) como '👑 Máxima Autoridad (Puesto Raíz)'. 3) En cada subordinado, seleccione a quién le rinde cuentas. 4) Presione 'Guardar Cambios' para actualizar el organigrama institucional en tiempo real."
        icon="bi-diagram-3-fill"
      />

      {/* ── 3. CABECERA INSTITUCIONAL CHAMILO (TECH-CARD) ── */}
      <div 
        className="tech-card mb-4 rounded-4 overflow-hidden shadow-sm"
        style={{
          borderTop: '6px solid #7c3aed',
          border: '2px solid #ddd6fe',
          background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 45%, #ede9fe 100%)',
          boxShadow: '0 10px 24px rgba(124, 58, 237, 0.12)'
        }}
      >
        <div className="p-4 p-md-5">
          <div className="row align-items-center g-4">
            
            {/* Contenedor Dual: Icono Personalizado + Switcher Dual de Escuelas */}
            <div className="col-12 col-md-auto text-center text-md-start">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-3 flex-wrap">
                {/* Icono Tech Personalizado */}
                <div 
                  className="rounded-4 p-2 bg-white d-inline-flex align-items-center justify-content-center shadow-sm"
                  style={{
                    width: '95px',
                    height: '95px',
                    border: '2.5px solid #ddd6fe',
                    boxShadow: '0 10px 24px rgba(124, 58, 237, 0.15)'
                  }}
                  title="Módulo de Cadena Supervisoria"
                >
                  <IconoCadenaSupervisoria size={60} color="#7c3aed" />
                </div>

                {/* Selector Dual Interactivo de Escuelas */}
                <div 
                  className="d-inline-flex align-items-center gap-2 p-2 bg-white rounded-4 border shadow-xs"
                  style={{ borderColor: '#ddd6fe' }}
                >
                  {/* Switch SB */}
                  <div 
                    onClick={() => cambiarEscuelaActiva('sb')}
                    className={`rounded-3 p-1.5 border d-flex flex-column align-items-center justify-content-center transition-all ${
                      filtroEscuelaActiva === 'sb' 
                        ? 'bg-success bg-opacity-10 border-success shadow-xs' 
                        : 'bg-white border-transparent opacity-60 hover-efecto'
                    }`}
                    style={{ width: '68px', height: '74px', cursor: 'pointer' }}
                    title="Activar U.E. Santa Bárbara"
                  >
                    <img 
                      src="/assets/img/logo_sb.png" 
                      alt="UE Santa Bárbara" 
                      style={{ maxHeight: '38px', maxWidth: '38px', objectFit: 'contain' }}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                    />
                    <span className={`badge ${filtroEscuelaActiva === 'sb' ? 'bg-success text-white' : 'bg-light text-muted'} extra-small mt-1 px-1.5 py-0`} style={{ fontSize: '0.62rem' }}>
                      SB {filtroEscuelaActiva === 'sb' ? '●' : ''}
                    </span>
                  </div>

                  {/* Switch LB */}
                  <div 
                    onClick={() => cambiarEscuelaActiva('lb')}
                    className={`rounded-3 p-1.5 border d-flex flex-column align-items-center justify-content-center transition-all ${
                      filtroEscuelaActiva === 'lb' 
                        ? 'bg-primary bg-opacity-10 border-primary shadow-xs' 
                        : 'bg-white border-transparent opacity-60 hover-efecto'
                    }`}
                    style={{ width: '68px', height: '74px', cursor: 'pointer' }}
                    title="Activar U.E. Libertador Bolívar"
                  >
                    <img 
                      src="/assets/img/logo_lb.png" 
                      alt="UE Libertador Bolívar" 
                      style={{ maxHeight: '38px', maxWidth: '38px', objectFit: 'contain' }}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                    />
                    <span className={`badge ${filtroEscuelaActiva === 'lb' ? 'bg-primary text-white' : 'bg-light text-muted'} extra-small mt-1 px-1.5 py-0`} style={{ fontSize: '0.62rem' }}>
                      LB {filtroEscuelaActiva === 'lb' ? '●' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Título y Métricas Clave */}
            <div className="col-12 col-md text-center text-md-start">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-2 flex-wrap">
                <span 
                  className="badge text-white fw-bold px-3 py-1.5 rounded-pill shadow-xs d-inline-flex align-items-center gap-1.5"
                  style={{ backgroundColor: '#7c3aed', fontSize: '0.78rem' }}
                >
                  <i className="bi bi-diagram-2-fill"></i>Organización Jerárquica
                </span>

                <div 
                  className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill bg-white border shadow-xs"
                  style={{ borderColor: '#ddd6fe' }}
                >
                  <span className="status-beacon-live" style={{ color: '#7c3aed' }}></span>
                  <span 
                    className="extra-small fw-bold text-uppercase" 
                    style={{ fontSize: '0.72rem', color: '#6d28d9', letterSpacing: '0.5px' }}
                  >
                    Campus Conectado &bull; Jerarquía Activa
                  </span>
                </div>

                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs" style={{ borderColor: '#ddd6fe' }}>
                  <i className="bi bi-briefcase-fill text-primary me-1"></i><b>{totalCargosEscuela}</b> Cargos Plantel
                </span>
                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs" style={{ borderColor: '#ddd6fe' }}>
                  <i className="bi bi-diagram-2-fill text-success me-1"></i><b>{cargosEnlazados}</b> Enlazados ({porcentajeEnlazados}%)
                </span>
                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs" style={{ borderColor: '#ddd6fe' }}>
                  <i className="bi bi-crown-fill text-warning me-1"></i><b>{cargosRaices}</b> Puestos Raíz
                </span>
              </div>

              <h1 className="fw-bolder mb-1.5 text-dark" style={{ fontSize: 'calc(1.5rem + 0.7vw)', letterSpacing: '-0.5px' }}>
                Cadena Supervisoria y Organigrama
              </h1>

              <p className="mb-0 text-muted small" style={{ maxWidth: '780px' }}>
                Gestión estructurada de líneas de reporte, subordinados inmediatos y visualización del organigrama jerárquico institucional.
              </p>

              {/* Barra de Consolidación Jerárquica */}
              <div className="mt-3" style={{ maxWidth: '440px' }}>
                <div className="d-flex justify-content-between align-items-center small fw-bold text-muted mb-1">
                  <span><i className="bi bi-diagram-2-fill text-primary me-1"></i>Consolidación del Organigrama</span>
                  <span style={{ color: '#7c3aed' }}>{porcentajeEnlazados}%</span>
                </div>
                <div className="progress rounded-pill shadow-xs" style={{ height: '7px', backgroundColor: '#e2e8f0' }}>
                  <div 
                    className="progress-bar rounded-pill" 
                    role="progressbar" 
                    style={{ 
                      width: `${porcentajeEnlazados}%`, 
                      background: 'linear-gradient(90deg, #c084fc 0%, #7c3aed 100%)',
                      transition: 'width 0.6s ease'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="col-12 col-md-auto text-md-end text-center">
              <button
                type="button"
                onClick={() => navigate('/categoria/Organizaci%C3%B3n%20Escolar')}
                className="btn btn-white bg-white text-dark rounded-pill px-4 py-2 fw-bold shadow-xs hover-efecto border d-inline-flex align-items-center justify-content-center gap-2 w-100 w-md-auto"
                style={{ borderColor: '#ddd6fe', fontSize: '0.85rem' }}
              >
                <i className="bi bi-arrow-left" style={{ color: '#6d28d9' }}></i>
                <span>Volver a Organización</span>
              </button>
            </div>

          </div>
        </div>

        {/* ── BARRA CHAMILO: SELECTOR DE ESCUELA Y PESTAÑAS ── */}
        <div 
          className="px-4 py-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-3"
          style={{ backgroundColor: 'rgba(245, 243, 255, 0.7)', borderColor: '#ddd6fe' }}
        >
          {/* Pestañas de Vista */}
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setTabActivo('constructor')}
              className={`btn btn-xs rounded-pill px-3.5 py-1.5 fw-bold transition-all d-inline-flex align-items-center gap-2 ${
                tabActivo === 'constructor' 
                  ? 'text-white shadow-xs' 
                  : 'btn-white bg-white text-muted border hover-efecto'
              }`}
              style={{
                backgroundColor: tabActivo === 'constructor' ? '#7c3aed' : '#ffffff',
                borderColor: tabActivo === 'constructor' ? '#7c3aed' : '#ddd6fe',
                color: tabActivo === 'constructor' ? '#ffffff' : '#475569',
                fontSize: '0.82rem'
              }}
            >
              <IconoConstructorJerarquia size={18} color={tabActivo === 'constructor' ? '#ffffff' : '#7c3aed'} />
              <span>1. Constructor de Jerarquías</span>
            </button>

            <button
              type="button"
              onClick={() => setTabActivo('mapa')}
              className={`btn btn-xs rounded-pill px-3.5 py-1.5 fw-bold transition-all d-inline-flex align-items-center gap-2 ${
                tabActivo === 'mapa' 
                  ? 'text-white shadow-xs' 
                  : 'btn-white bg-white text-muted border hover-efecto'
              }`}
              style={{
                backgroundColor: tabActivo === 'mapa' ? '#7c3aed' : '#ffffff',
                borderColor: tabActivo === 'mapa' ? '#7c3aed' : '#ddd6fe',
                color: tabActivo === 'mapa' ? '#ffffff' : '#475569',
                fontSize: '0.82rem'
              }}
            >
              <IconoArbolOrganigrama size={18} color={tabActivo === 'mapa' ? '#ffffff' : '#7c3aed'} />
              <span>2. Organigrama Visual en Árbol</span>
            </button>
          </div>

          {/* Selector Superior de Escuela (Incluye Ambas Escuelas / Corporativos) */}
          <div className="d-flex align-items-center gap-1.5">
            <span className="extra-small fw-bold text-muted text-uppercase me-1">Ámbito:</span>
            
            <div className="btn-group btn-group-sm shadow-xs border rounded-pill overflow-hidden bg-white" role="group">
              {tieneDobleAcceso && (
                <button
                  type="button"
                  onClick={() => setFiltroEscuelaActiva('todas')}
                  className={`btn btn-xs px-3 py-1 fw-bold transition-all ${
                    filtroEscuelaActiva === 'todas' ? 'text-white' : 'text-muted'
                  }`}
                  style={{ backgroundColor: filtroEscuelaActiva === 'todas' ? '#7c3aed' : 'transparent', border: 'none', fontSize: '0.78rem' }}
                >
                  🏢 Ambas Sedes / Corporativo
                </button>
              )}

              {(canSeeSB || tieneDobleAcceso) && (
                <button
                  type="button"
                  onClick={() => setFiltroEscuelaActiva('sb')}
                  className={`btn btn-xs px-3 py-1 fw-bold transition-all ${
                    filtroEscuelaActiva === 'sb' ? 'text-white' : 'text-muted'
                  }`}
                  style={{ backgroundColor: filtroEscuelaActiva === 'sb' ? '#10b981' : 'transparent', border: 'none', fontSize: '0.78rem' }}
                >
                  🟢 UE Santa Bárbara
                </button>
              )}

              {(canSeeLB || tieneDobleAcceso) && (
                <button
                  type="button"
                  onClick={() => setFiltroEscuelaActiva('lb')}
                  className={`btn btn-xs px-3 py-1 fw-bold transition-all ${
                    filtroEscuelaActiva === 'lb' ? 'text-white' : 'text-muted'
                  }`}
                  style={{ backgroundColor: filtroEscuelaActiva === 'lb' ? '#0284c7' : 'transparent', border: 'none', fontSize: '0.78rem' }}
                >
                  🔵 UE Libertador Bolívar
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {loading ? (
        <div className="text-center py-5 text-muted">
          <div className="spinner-border text-primary mb-3" role="status"></div>
          <div>Cargando datos de la cadena supervisoria...</div>
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════════════
              PESTAÑA 1: CONSTRUCTOR DE JERARQUÍAS (INTUITIVO Y DIRECTO)
             ══════════════════════════════════════════════════════════════ */}
          {tabActivo === 'constructor' && (
            <div className="row g-4 animate__animated animate__fadeIn">
              <div className="col-12">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                  
                  {/* Cabecera del Constructor con botón Guardar */}
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 pb-3 border-bottom mb-4">
                    <div className="d-flex align-items-center gap-3">
                      <div 
                        className="p-2 rounded-3 d-flex align-items-center justify-content-center shadow-xs" 
                        style={{ backgroundColor: '#f5f3ff', border: '1.5px solid #ddd6fe', width: '44px', height: '44px' }}
                      >
                        <IconoConstructorJerarquia size={26} color="#7c3aed" />
                      </div>
                      <div>
                        <h5 className="fw-bolder text-dark mb-0.5">Asignación Directa de Supervisores</h5>
                        <p className="text-muted extra-small mb-0">
                          Mostrando cargos para <b>{filtroEscuelaActiva === 'sb' ? 'UE Santa Bárbara (+ Cargos Compartidos)' : (filtroEscuelaActiva === 'lb' ? 'UE Libertador Bolívar (+ Cargos Compartidos)' : 'Todas las Sedes y Cargos Corporativos')}</b>.
                        </p>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      {Object.keys(cambiosPendientes).length > 0 && (
                        <span className="badge bg-warning bg-opacity-20 text-dark border border-warning px-3 py-2 rounded-pill small fw-bold">
                          <i className="bi bi-pencil-fill me-1 text-warning"></i>{Object.keys(cambiosPendientes).length} cambio(s) pendientes
                        </span>
                      )}

                      {pCrear ? (
                        <button
                          type="button"
                          onClick={handleSaveJerarquia}
                          disabled={Object.keys(cambiosPendientes).length === 0}
                          className="btn btn-success rounded-pill px-4 py-2 fw-bold shadow-xs hover-efecto d-flex align-items-center gap-2"
                        >
                          <i className="bi bi-check2-circle fs-5"></i>
                          <span>Guardar Estructura Jerárquica</span>
                        </button>
                      ) : (
                        <span className="badge bg-light text-danger border px-3 py-2 rounded-pill small fw-bold">
                          <i className="bi bi-lock-fill me-1"></i>Solo Lectura
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Barra de Búsqueda y Filtros Rápidos */}
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-6 col-lg-8">
                      <div className="position-relative">
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0 rounded-start-pill ps-3">
                            <i className="bi bi-search text-muted"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control bg-light border-start-0 rounded-end-pill pe-5"
                            placeholder="Buscar cargo por nombre o descripción..."
                            value={busquedaCargo}
                            onChange={(e) => setBusquedaCargo(e.target.value)}
                          />
                        </div>
                        {busquedaCargo && (
                          <button
                            type="button"
                            onClick={() => setBusquedaCargo('')}
                            className="btn btn-link position-absolute end-0 top-50 translate-middle-y me-3 text-muted border-0 p-0"
                            title="Limpiar búsqueda"
                          >
                            <i className="bi bi-x-circle-fill small"></i>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="col-12 col-md-6 col-lg-4">
                      <select
                        className="form-select bg-light rounded-pill"
                        value={filtroTipoCargo}
                        onChange={(e) => setFiltroTipoCargo(e.target.value)}
                      >
                        <option value="todos">Todos los Tipos de Cargo</option>
                        {tiposDisponibles.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Cuadrícula de Tarjetas de Cargo */}
                  {cargosFiltrados.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-1 d-block mb-2 text-muted opacity-50"></i>
                      <p className="fw-bold mb-0">No se encontraron cargos para los filtros seleccionados.</p>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {cargosFiltrados.map((c) => {
                        const isPending = cambiosPendientes.hasOwnProperty(c.id_cargo);
                        const currentSupId = isPending ? (cambiosPendientes[c.id_cargo] || '') : (c.depende_de || '');
                        
                        const isInterinst = esCargoInterinstitucional(c.nombre_cargo);

                        // Personal asignado a este cargo (Líder y Apoyo aplican a ambas instituciones)
                        const dueños = usuarios.filter(u => {
                          if (u.cargo !== c.nombre_cargo) return false;
                          if (isInterinst) return true;
                          if (filtroEscuelaActiva === 'sb') return u.id_escuela === 'sb' || !u.id_escuela;
                          if (filtroEscuelaActiva === 'lb') return u.id_escuela === 'lb' || !u.id_escuela;
                          return true;
                        });

                        const supervisorActual = cargos.find(sup => sup.id_cargo === currentSupId);

                        return (
                          <div key={c.id_cargo} className="col-12 col-md-6 col-xl-4">
                            <div 
                              className={`card rounded-4 p-3.5 h-100 shadow-xs transition-all border ${
                                isPending 
                                  ? 'border-warning bg-warning bg-opacity-10' 
                                  : (isInterinst ? 'bg-light' : 'bg-light border-light')
                              }`}
                              style={isInterinst ? { borderLeft: '4px solid #7c3aed' } : {}}
                            >
                              <div className="d-flex flex-column h-100 justify-content-between">
                                <div>
                                  {/* Badges de Tipo y Ámbito */}
                                  <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
                                    <span className="badge bg-white text-dark border px-2 py-0.5 rounded-pill extra-small fw-bold">
                                      {c.tipo_cargo || 'General'}
                                    </span>

                                    {isInterinst ? (
                                      <span className="badge rounded-pill extra-small text-white shadow-xs" style={{ backgroundColor: '#7c3aed' }}>
                                        <i className="bi bi-buildings-fill me-1"></i>Ambas Instituciones
                                      </span>
                                    ) : !c.id_escuela ? (
                                      <span className="badge bg-secondary text-white rounded-pill extra-small">
                                        <i className="bi bi-building me-1"></i>Ambas Escuelas
                                      </span>
                                    ) : c.id_escuela === 'sb' ? (
                                      <span className="badge bg-success text-white rounded-pill extra-small">
                                        <i className="bi bi-check-circle me-1"></i>Solo Santa Bárbara
                                      </span>
                                    ) : (
                                      <span className="badge bg-primary text-white rounded-pill extra-small">
                                        <i className="bi bi-check-circle me-1"></i>Solo Libertador
                                      </span>
                                    )}
                                  </div>

                                  {/* Nombre del Cargo */}
                                  <h6 className="fw-bolder text-dark mb-1.5" style={{ fontSize: '0.98rem' }}>
                                    {c.nombre_cargo}
                                  </h6>

                                  {/* Empleados Asignados */}
                                  <div className="mb-3 extra-small">
                                    <span className="text-muted fw-semibold">Personal Ocupante: </span>
                                    {dueños.length > 0 ? (
                                      <span className="fw-bold text-dark">
                                        {dueños.map(d => d.nombre_completo).join(', ')}
                                        {isInterinst && (
                                          <span className="badge bg-light text-primary border ms-1 extra-small fw-normal" style={{ fontSize: '7.5px' }}>
                                            Común para SB y LB
                                          </span>
                                        )}
                                      </span>
                                    ) : (
                                      <span className="text-danger fw-bold italic">Vacante</span>
                                    )}
                                  </div>
                                </div>

                                {/* Selector de Supervisor Directo */}
                                <div className="pt-2.5 border-top">
                                  <label className="form-label extra-small fw-bold text-muted mb-1 d-flex align-items-center justify-content-between">
                                    <span><i className="bi bi-chevron-bar-up me-1"></i>Supervisor Inmediato:</span>
                                    {supervisorActual ? (
                                      <span className="text-primary fw-bold">Reporta a superior</span>
                                    ) : (
                                      <span className="text-warning text-dark fw-bold">👑 Máxima Autoridad (Raíz)</span>
                                    )}
                                  </label>

                                  <select
                                    className="form-select form-select-sm rounded-3 bg-white fw-semibold"
                                    style={{ fontSize: '0.82rem' }}
                                    value={currentSupId}
                                    disabled={!pCrear}
                                    onChange={(e) => handleChangeSupervisor(c.id_cargo, e.target.value)}
                                  >
                                    <option value="">👑 Máxima Autoridad (Puesto Raíz / Sin Jefe)</option>
                                    <optgroup label="Cargos Disponibles para Supervisión">
                                      {cargos
                                        .filter(posSup => {
                                          if (posSup.id_cargo === c.id_cargo) return false;
                                          if (c.id_escuela && posSup.id_escuela && c.id_escuela !== posSup.id_escuela) return false;
                                          return !detectarCiclo(c.id_cargo, posSup.id_cargo, cargos);
                                        })
                                        .map(posSup => (
                                          <option key={posSup.id_cargo} value={posSup.id_cargo}>
                                            {posSup.nombre_cargo} {!posSup.id_escuela ? '(Ambas Sedes)' : `(${posSup.id_escuela.toUpperCase()})`}
                                          </option>
                                        ))}
                                    </optgroup>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              PESTAÑA 2: ORGANIGRAMA VISUAL EN ÁRBOL
             ══════════════════════════════════════════════════════════════ */}
          {tabActivo === 'mapa' && (
            <div className="row g-4 animate__animated animate__fadeIn">
              <div className="col-12">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
                  <div className="d-flex align-items-center gap-3 pb-3 border-bottom mb-3">
                    <div 
                      className="p-2 rounded-3 d-flex align-items-center justify-content-center shadow-xs" 
                      style={{ backgroundColor: '#f5f3ff', border: '1.5px solid #ddd6fe', width: '44px', height: '44px' }}
                    >
                      <IconoArbolOrganigrama size={26} color="#7c3aed" />
                    </div>
                    <div>
                      <h5 className="fw-bolder text-dark mb-0.5">Organigrama Institucional</h5>
                      <p className="text-muted extra-small mb-0">Visualización interactiva del árbol de supervisión y líneas de mando.</p>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-3 flex-wrap">
                      {/* Filtro por Rama */}
                      <div style={{ minWidth: '240px' }}>
                        <label className="form-label extra-small fw-bold text-muted mb-1">Explorar por Rama / Dependencia:</label>
                        <select
                          className="form-select form-select-sm rounded-pill bg-light"
                          value={filtroRama}
                          onChange={(e) => setFiltroRama(e.target.value)}
                        >
                          <option value="">🌳 Toda la Estructura Completa</option>
                          {cargosVisiblesMapa.map(c => (
                            <option key={c.id_cargo} value={c.id_cargo}>
                              {c.nombre_cargo} {!c.id_escuela ? '(Ambas Sedes)' : `(${c.id_escuela.toUpperCase()})`}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Switch de Mostrar Nombres */}
                      <div className="form-check form-switch pt-3">
                        <input
                          className="form-check-input hover-mano"
                          type="checkbox"
                          role="switch"
                          id="chk-nombres-chamilo"
                          checked={mostrarNombres}
                          onChange={(e) => setMostrarNombres(e.target.checked)}
                        />
                        <label className="form-check-label extra-small fw-bold text-dark" htmlFor="chk-nombres-chamilo">
                          Mostrar Nombres de Empleados
                        </label>
                      </div>
                    </div>

                    {/* Botón Exportar PDF */}
                    {pImprimir && (
                      <button
                        type="button"
                        onClick={handleExportPDF}
                        className="btn btn-outline-danger rounded-pill px-3.5 py-2 fw-bold d-flex align-items-center gap-2 hover-efecto shadow-xs"
                        style={{ fontSize: '0.82rem' }}
                      >
                        <i className="bi bi-file-earmark-pdf-fill"></i>
                        <span>Imprimir / Exportar Organigrama</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Leyenda Cromática de Niveles Jerárquicos */}
                <div className="d-flex align-items-center justify-content-center gap-2 p-3 bg-light rounded-4 mb-3 flex-wrap border">
                  <span className="extra-small fw-bold text-muted text-uppercase me-2"><i className="bi bi-palette me-1"></i>Jerarquías:</span>
                  <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{ backgroundColor: '#faf5ff', color: '#581c87', border: '1.5px solid #7c3aed' }}>
                    🏢 Biescolar (Líder y Apoyo)
                  </span>
                  <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{ backgroundColor: '#fff1f2', color: '#9f1239', border: '1.5px solid #e11d48' }}>
                    👑 Directivo / Rectoral
                  </span>
                  <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1.5px solid #2563eb' }}>
                    ⚡ Coordinación / Supervisorio
                  </span>
                  <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{ backgroundColor: '#f0fdf4', color: '#14532d', border: '1.5px solid #16a34a' }}>
                    📚 Docencia / Pedagógico
                  </span>
                  <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{ backgroundColor: '#fffbeb', color: '#78350f', border: '1.5px solid #d97706' }}>
                    💼 Administrativo
                  </span>
                  <span className="badge rounded-pill px-3 py-1.5 fw-bold" style={{ backgroundColor: '#f8fafc', color: '#0f172a', border: '1.5px solid #475569' }}>
                    🛠️ Obrero / Apoyo
                  </span>
                </div>

                {/* Lienzo del Organigrama */}
                <div className="card border-0 shadow-sm rounded-4 bg-white" style={{ overflow: 'auto' }}>
                  <div className="card-body p-5 text-center" style={{ minHeight: '400px' }}>
                    {cargosVisiblesMapa.length === 0 ? (
                      <div className="text-muted py-5">
                        No hay cargos registrados para esta institución.
                      </div>
                    ) : raices.length === 0 ? (
                      <div className="alert alert-warning border-warning rounded-4 shadow-sm mx-auto p-4" style={{ maxWidth: '600px' }}>
                        <i className="bi bi-exclamation-triangle-fill fs-3 text-warning d-block mb-2"></i>
                        <h6 className="fw-bold text-dark">No se detectó un Puesto Raíz (Máxima Autoridad)</h6>
                        <p className="extra-small text-muted mb-0">
                          Para que el organigrama pueda ramificarse, el cargo principal de la institución (ej. Director o Gerente) debe tener su supervisor configurado como <strong>"👑 Máxima Autoridad (Puesto Raíz)"</strong> en la pestaña Constructor.
                        </p>
                      </div>
                    ) : (
                      <div id="chart_div" className="mi-organigrama">
                        <ul>
                          {raices.map(raiz => (
                            <OrganigramaNodo
                              key={raiz.id_cargo}
                              cargo={raiz}
                              cargos={cargosVisiblesMapa}
                              usuarios={usuariosVisiblesMapa}
                              mostrarNombres={mostrarNombres}
                              escuelaContext={filtroEscuelaActiva === 'todas' ? null : filtroEscuelaActiva}
                            />
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};
