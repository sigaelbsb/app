import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ModulosSistema } from '../pages/CategoryDashboard';

interface MobileBottomNavProps {
  activeCategory: string;
  tienePermiso: (vista: string, accion?: string) => boolean;
  tienePermisoEnEscuela: (escuela: string, vista: string, accion?: string) => boolean;
  permLoading: boolean;
  escuelaCodigo: string;
  escuelaNombre: string;
  logoPath: string;
  usuario: any;
  onLogout: () => void;
  abrirSheetExterno?: boolean;
  onCerrarSheetExterno?: () => void;
}

export const MobileBottomNav = ({
  activeCategory,
  tienePermiso,
  tienePermisoEnEscuela,
  permLoading,
  escuelaCodigo,
  escuelaNombre,
  logoPath,
  usuario,
  onLogout,
  abrirSheetExterno = false,
  onCerrarSheetExterno
}: MobileBottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sheetAbierto, setSheetAbierto] = useState(false);

  // Sincronizar con trigger externo (ej. botón de cabecera superior en móvil)
  useEffect(() => {
    if (abrirSheetExterno) {
      setSheetAbierto(true);
    }
  }, [abrirSheetExterno]);

  const cerrarSheet = () => {
    setSheetAbierto(false);
    if (onCerrarSheetExterno) {
      onCerrarSheetExterno();
    }
  };

  const toggleSheet = () => {
    if (sheetAbierto) {
      cerrarSheet();
    } else {
      setSheetAbierto(true);
    }
  };

  // Determinar total de herramientas autorizadas
  const totalHerramientas = Object.values(ModulosSistema).flatMap(cat => cat.items).filter((item: any) => {
    if (item.vista === 'Mi Expediente' && tienePermiso('Gestor de Expedientes', 'ver')) return false;
    if (item.vista === 'Gestión de Colectivos') {
      return tienePermisoEnEscuela('sb', item.vista, 'ver') || tienePermisoEnEscuela('lb', item.vista, 'ver');
    }
    return tienePermiso(item.vista, 'ver');
  }).length;

  const esRutaInicio = location.pathname === '/';
  const esRutaEstudiantil = location.pathname.startsWith('/categoria/Gestión%20Estudiantil') || location.pathname.startsWith('/categoria/Gestión Estudiantil');
  const esRutaAcademica = location.pathname.startsWith('/categoria/Control%20de%20Estudios') || location.pathname.startsWith('/categoria/Control de Estudios');
  const esRutaTransporte = location.pathname.startsWith('/categoria/Transporte%20y%20Logística') || location.pathname.startsWith('/categoria/Transporte y Logística');

  return (
    <>
      {/* 1. BARRA DE NAVEGACIÓN INFERIOR NATIVA PARA MÓVIL */}
      <nav 
        className="sigae-mobile-bottom-nav" 
        id="barra-navegacion-inferior"
        aria-label="Navegación principal móvil"
      >
        {/* PESTAÑA 1: INICIO */}
        <button
          type="button"
          onClick={() => {
            cerrarSheet();
            navigate('/');
          }}
          className={`sigae-nav-tab ${esRutaInicio ? 'active' : ''}`}
          id="btn-tab-inicio"
          title="Ir al Inicio"
        >
          <div className="sigae-nav-tab-icon-wrap">
            <i className={`bi ${esRutaInicio ? 'bi-house-door-fill' : 'bi-house-door'}`}></i>
          </div>
          <span className="sigae-nav-tab-label">Inicio</span>
          {esRutaInicio && <span className="sigae-nav-tab-dot"></span>}
        </button>

        {/* PESTAÑA 2: ESTUDIANTIL */}
        <button
          type="button"
          onClick={() => {
            cerrarSheet();
            navigate('/categoria/Gestión%20Estudiantil');
          }}
          className={`sigae-nav-tab ${esRutaEstudiantil ? 'active' : ''}`}
          id="btn-tab-estudiantil"
          title="Gestión Estudiantil"
        >
          <div className="sigae-nav-tab-icon-wrap">
            <i className={`bi ${esRutaEstudiantil ? 'bi-mortarboard-fill' : 'bi-mortarboard'}`}></i>
          </div>
          <span className="sigae-nav-tab-label">Estudiantes</span>
          {esRutaEstudiantil && <span className="sigae-nav-tab-dot"></span>}
        </button>

        {/* PESTAÑA 3: ACADÉMICO */}
        <button
          type="button"
          onClick={() => {
            cerrarSheet();
            navigate('/categoria/Control%20de%20Estudios');
          }}
          className={`sigae-nav-tab ${esRutaAcademica ? 'active' : ''}`}
          id="btn-tab-academico"
          title="Control de Estudios"
        >
          <div className="sigae-nav-tab-icon-wrap">
            <i className={`bi ${esRutaAcademica ? 'bi-journal-bookmark-fill' : 'bi-journal-bookmark'}`}></i>
          </div>
          <span className="sigae-nav-tab-label">Académico</span>
          {esRutaAcademica && <span className="sigae-nav-tab-dot"></span>}
        </button>

        {/* PESTAÑA 4: TRANSPORTE */}
        <button
          type="button"
          onClick={() => {
            cerrarSheet();
            navigate('/categoria/Transporte%20y%20Logística');
          }}
          className={`sigae-nav-tab ${esRutaTransporte ? 'active' : ''}`}
          id="btn-tab-transporte"
          title="Transporte Escolar"
        >
          <div className="sigae-nav-tab-icon-wrap">
            <i className={`bi ${esRutaTransporte ? 'bi-bus-front-fill' : 'bi-bus-front'}`}></i>
          </div>
          <span className="sigae-nav-tab-label">Transporte</span>
          {esRutaTransporte && <span className="sigae-nav-tab-dot"></span>}
        </button>

        {/* PESTAÑA 5: MÓDULOS / MENÚ COMPLETO */}
        <button
          type="button"
          onClick={toggleSheet}
          className={`sigae-nav-tab sigae-nav-tab-menu ${sheetAbierto ? 'active' : ''}`}
          id="btn-tab-modulos"
          title="Abrir Todas las Cajas de Herramientas"
          aria-expanded={sheetAbierto}
        >
          <div className="sigae-nav-tab-icon-wrap position-relative">
            <i className={`bi ${sheetAbierto ? 'bi-grid-3x3-gap-fill' : 'bi-grid-fill'}`}></i>
            {totalHerramientas > 0 && !sheetAbierto && (
              <span className="sigae-nav-tab-badge">
                {totalHerramientas}
              </span>
            )}
          </div>
          <span className="sigae-nav-tab-label">Módulos</span>
          {sheetAbierto && <span className="sigae-nav-tab-dot"></span>}
        </button>
      </nav>

      {/* 2. BOTTOM SHEET MODAL (DRAWER EMERGENTE DE MÓDULOS EN CELULAR) */}
      {sheetAbierto && (
        <>
          {/* Telón difuminado de fondo */}
          <div 
            className="sigae-sheet-backdrop" 
            onClick={cerrarSheet}
            role="button"
            tabIndex={0}
            aria-label="Cerrar panel de módulos"
          />

          {/* Contenedor del Drawer Bottom Sheet */}
          <div className="sigae-sheet-modal" id="panel-modulos-movil">
            {/* Tirador táctil superior */}
            <div className="sigae-sheet-handle-bar" onClick={cerrarSheet}></div>

            {/* Cabecera del Drawer */}
            <div className="sigae-sheet-header">
              <div className="d-flex align-items-center gap-2.5">
                <div 
                  className="rounded-3 p-1 bg-light border d-flex align-items-center justify-content-center"
                  style={{ width: '38px', height: '38px' }}
                >
                  <img 
                    src={logoPath} 
                    alt="Logo Escuela" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                  />
                </div>
                <div>
                  <h6 className="mb-0 fw-bold text-dark small" style={{ lineHeight: 1.2 }}>
                    {escuelaNombre}
                  </h6>
                  <span className="extra-small text-muted">
                    {usuario?.rol || 'Comunidad'} &bull; {totalHerramientas} módulos activos
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={cerrarSheet}
                className="btn btn-sm btn-light rounded-circle border p-1 d-flex align-items-center justify-content-center text-muted"
                style={{ width: '32px', height: '32px' }}
                title="Cerrar"
              >
                <i className="bi bi-x-lg small"></i>
              </button>
            </div>

            {/* Cuerpo con todas las Cajas de Herramientas */}
            <div className="sigae-sheet-body">
              <div className="extra-small fw-bold text-muted text-uppercase mb-2" style={{ letterSpacing: '0.5px' }}>
                Cajas de Herramientas del Sistema
              </div>

              {Object.entries(ModulosSistema).map(([nombreCategoria, datosModulo]) => {
                if (permLoading) return null;

                const itemsPermitidos = datosModulo.items.filter((item: any) => {
                  if (item.vista === 'Mi Expediente' && tienePermiso('Gestor de Expedientes', 'ver')) return false;
                  if (item.vista === 'Gestión de Colectivos') {
                    return tienePermisoEnEscuela('sb', item.vista, 'ver') || tienePermisoEnEscuela('lb', item.vista, 'ver');
                  }
                  return tienePermiso(item.vista, 'ver');
                });

                if (itemsPermitidos.length === 0) return null;

                const isActive = activeCategory === nombreCategoria;

                return (
                  <div
                    key={nombreCategoria}
                    onClick={() => {
                      cerrarSheet();
                      navigate(`/categoria/${encodeURIComponent(nombreCategoria)}`);
                    }}
                    className={`sigae-sheet-category-card ${isActive ? 'active' : ''}`}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="d-flex align-items-center">
                      <div 
                        className="sigae-sheet-cat-icon"
                        style={{
                          backgroundColor: `${datosModulo.color}15`,
                          color: datosModulo.color,
                          border: `1.5px solid ${datosModulo.color}35`,
                          padding: '3px'
                        }}
                      >
                        {datosModulo.icono3d ? (
                          <img 
                            src={datosModulo.icono3d} 
                            alt={nombreCategoria}
                            style={{ 
                              width: '36px', 
                              height: '36px', 
                              objectFit: 'contain',
                              filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.18))'
                            }}
                          />
                        ) : (
                          <i className={`bi ${datosModulo.icono}`}></i>
                        )}
                      </div>
                      <div>
                        <div className="fw-bold text-dark small">
                          {nombreCategoria}
                        </div>
                        <div className="text-muted extra-small text-truncate" style={{ maxWidth: '210px' }}>
                          {datosModulo.desc}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-1.5 ms-2">
                      <span 
                        className="badge rounded-pill extra-small px-2 py-1 fw-bold"
                        style={{
                          backgroundColor: isActive ? datosModulo.color : '#f1f5f9',
                          color: isActive ? '#ffffff' : '#475569',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        {itemsPermitidos.length}
                      </span>
                      <i className="bi bi-chevron-right text-muted small"></i>
                    </div>
                  </div>
                );
              })}

              {/* Botones de acción rápida en el fondo del Sheet */}
              <div className="sigae-sheet-footer-actions">
                <button
                  type="button"
                  onClick={() => {
                    cerrarSheet();
                    navigate('/categoria/Seguridad%20y%20Accesos/Mi%20Perfil');
                  }}
                  className="btn btn-sm btn-light border rounded-3 fw-semibold text-dark d-flex align-items-center justify-content-center gap-2 py-2"
                >
                  <i className="bi bi-person-gear text-primary"></i>
                  <span className="small">Mi Perfil</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    cerrarSheet();
                    window.dispatchEvent(new CustomEvent('sigae-iniciar-tour'));
                  }}
                  className="btn btn-sm btn-light border rounded-3 fw-semibold text-dark d-flex align-items-center justify-content-center gap-2 py-2"
                >
                  <i className="bi bi-question-circle text-info"></i>
                  <span className="small">Orientación</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    cerrarSheet();
                    onLogout();
                  }}
                  className="btn btn-sm btn-outline-danger rounded-3 fw-semibold d-flex align-items-center justify-content-center gap-2 py-2 w-100"
                  style={{ gridColumn: 'span 2' }}
                >
                  <i className="bi bi-power"></i>
                  <span className="small">Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
