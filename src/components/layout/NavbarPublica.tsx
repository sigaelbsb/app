/**
 * ==============================================================================
 * ARCHIVO: src/components/layout/NavbarPublica.tsx
 * PROPÓSITO: Barra de navegación superior de alta gama para la Web Informativa Pública.
 * ESTILO: SAP Fiori Horizon Shellbar + Dark Glassmorphism + MPPE Oficial.
 * CARACTERÍSTICAS:
 *  1. Cintillo Superior Institucional con el logo del MPPE.
 *  2. Shellbar cristalino oscuro con bordes cyan/neón sutiles.
 *  3. Escudo 3D del plantel activo con aura luminosa (Glow).
 *  4. Selector rápido e interactivo de sede escolar (SB / LB).
 *  5. Botón de acceso directo al Campus Digital con gradiente y candado.
 *  6. Menú colapsable suave para pantallas táctiles y teléfonos móviles.
 * ==============================================================================
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// Propiedades recibidas por el componente de la barra de navegación
interface NavbarPublicaProps {
  // Código identificador de la escuela activa ('sb' = Santa Bárbara, 'lb' = Libertador Bolívar)
  escuelaActiva: 'sb' | 'lb';
  // Función para cambiar de institución educativa
  onCambiarEscuela: (nuevaEscuela: 'sb' | 'lb') => void;
}

export const NavbarPublica: React.FC<NavbarPublicaProps> = ({
  escuelaActiva,
  onCambiarEscuela
}) => {
  // Hook de enrutamiento para navegar entre vistas
  const navigate = useNavigate();

  // Control del menú desplegable en dispositivos móviles
  const [menuMovilAbierto, setMenuMovilAbierto] = useState<boolean>(false);
  // Control del selector desplegable de cambio de sede
  const [dropdownSedeAbierto, setDropdownSedeAbierto] = useState<boolean>(false);

  // Datos dinámicos según la escuela seleccionada
  const esSantaBarbara = escuelaActiva === 'sb';
  const nombreColegio = esSantaBarbara ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar';
  const logoColegio = `/assets/img/logo_${escuelaActiva}.png`;

  return (
    <>
      {/* ── SECCIÓN 1: CINTILLO OFICIAL DEL MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN ── */}
      <div className="portal-mppe-ribbon d-flex align-items-center justify-content-between px-3 px-md-4">
        <div className="d-flex align-items-center gap-2">
          {/* Logo oficial MPPE */}
          <img 
            src="/assets/img/logoMPPE.png" 
            alt="Ministerio del Poder Popular para la Educación" 
            className="portal-mppe-banner-img"
          />
        </div>
        <div className="portal-mppe-text d-none d-sm-block text-end">
          <span>República Bolivariana de Venezuela &bull; Monagas</span>
        </div>
      </div>

      {/* ── SECCIÓN 2: SHELLBAR PRINCIPAL ESTILO SAP FIORI HORIZON (DARK GLASS) ── */}
      <header className="portal-shellbar py-2 px-3 px-md-4">
        <div className="container-fluid p-0 d-flex align-items-center justify-content-between">
          
          {/* LOGO INSTITUCIONAL Y NOMBRE DEL COLEGIO */}
          <Link 
            to={`/portal/${escuelaActiva}`} 
            className="portal-brand-badge"
            title={`Página principal de ${nombreColegio}`}
          >
            {/* Escudo 3D del Plantel con Aura */}
            <div className="portal-escudo-wrapper">
              <img 
                src={logoColegio} 
                alt={`Escudo oficial ${nombreColegio}`} 
                className="portal-escudo-img"
                onError={(e) => { 
                  // Si no carga la imagen específica, usamos el escudo central de SIGAE
                  (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; 
                }}
              />
            </div>

            {/* Titular del Colegio */}
            <div>
              <h2 className="portal-brand-title">{nombreColegio}</h2>
              <p className="portal-brand-subtitle">Portal Web Institucional</p>
            </div>
          </Link>

          {/* NAVEGACIÓN EN COMPUTADORAS Y TABLETS GRANDES */}
          <nav className="d-none d-lg-flex align-items-center gap-2">
            <a href="#inicio" className="portal-nav-link">
              <i className="bi bi-house-door"></i>
              <span>Inicio</span>
            </a>
            <a href="#identidad" className="portal-nav-link">
              <i className="bi bi-award"></i>
              <span>Identidad</span>
            </a>
            <a href="#niveles" className="portal-nav-link">
              <i className="bi bi-mortarboard"></i>
              <span>Niveles</span>
            </a>
            <a href="#transporte" className="portal-nav-link">
              <i className="bi bi-bus-front"></i>
              <span>Transporte</span>
            </a>
            <a href="#admisiones" className="portal-nav-link">
              <i className="bi bi-person-plus"></i>
              <span>Admisiones</span>
            </a>
            <a href="#contacto" className="portal-nav-link">
              <i className="bi bi-geo-alt"></i>
              <span>Contacto</span>
            </a>
          </nav>

          {/* ACCIONES DE LA DERECHA: CAMBIO DE SEDE Y BOTÓN DE INGRESO */}
          <div className="d-flex align-items-center gap-2">
            
            {/* SELECTOR INTERACTIVO DE SEDE (SB / LB) */}
            <div className="position-relative">
              <button 
                type="button"
                className="portal-btn-sede"
                onClick={() => setDropdownSedeAbierto(!dropdownSedeAbierto)}
                title="Cambiar entre sedes educativas"
              >
                <i className="bi bi-arrow-repeat text-info"></i>
                <span className="d-none d-sm-inline">{esSantaBarbara ? 'Sede SB' : 'Sede LB'}</span>
                <span className="d-inline d-sm-none">{escuelaActiva.toUpperCase()}</span>
                <i className="bi bi-chevron-down small opacity-75"></i>
              </button>

              {/* Menú Flotante para cambiar de Sede */}
              {dropdownSedeAbierto && (
                <div 
                  className="dropdown-menu show dropdown-menu-end shadow-lg p-2 animate__animated animate__fadeIn"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    minWidth: '240px',
                    backgroundColor: 'rgba(5, 17, 43, 0.96)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '16px',
                    zIndex: 1100,
                    marginTop: '8px'
                  }}
                >
                  <div className="px-2 py-1 small fw-bold text-muted text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                    Seleccionar Institución
                  </div>

                  {/* Opción 1: Santa Bárbara */}
                  <button 
                    type="button"
                    className={`dropdown-item d-flex align-items-center gap-2.5 rounded-3 py-2 px-2.5 text-white ${esSantaBarbara ? 'bg-success bg-opacity-25 border border-success border-opacity-50' : ''}`}
                    onClick={() => {
                      onCambiarEscuela('sb');
                      setDropdownSedeAbierto(false);
                    }}
                  >
                    <img 
                      src="/assets/img/logo_sb.png" 
                      alt="SB" 
                      style={{ width: '28px', height: '28px', objectFit: 'contain' }} 
                      onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                    />
                    <div>
                      <div className="fw-bold small">U.E. Santa Bárbara</div>
                      <div className="text-muted extra-small" style={{ fontSize: '0.7rem' }}>Sector Santa Bárbara</div>
                    </div>
                    {esSantaBarbara && <i className="bi bi-check-circle-fill ms-auto text-success"></i>}
                  </button>

                  {/* Opción 2: Libertador Bolívar */}
                  <button 
                    type="button"
                    className={`dropdown-item d-flex align-items-center gap-2.5 rounded-3 py-2 px-2.5 text-white mt-1 ${!esSantaBarbara ? 'bg-primary bg-opacity-25 border border-primary border-opacity-50' : ''}`}
                    onClick={() => {
                      onCambiarEscuela('lb');
                      setDropdownSedeAbierto(false);
                    }}
                  >
                    <img 
                      src="/assets/img/logo_lb.png" 
                      alt="LB" 
                      style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                    />
                    <div>
                      <div className="fw-bold small">U.E. Libertador Bolívar</div>
                      <div className="text-muted extra-small" style={{ fontSize: '0.7rem' }}>Punta de Mata</div>
                    </div>
                    {!esSantaBarbara && <i className="bi bi-check-circle-fill ms-auto text-primary"></i>}
                  </button>
                </div>
              )}
            </div>

            {/* BOTÓN OFICIAL: INGRESAR AL CAMPUS PRIVADO (LOGIN) */}
            <Link 
              to="/login" 
              className="portal-btn-ingresar"
              title="Acceder al Panel de Gestión Escolar"
            >
              <i className="bi bi-shield-lock-fill"></i>
              <span className="d-none d-sm-inline">Ingresar</span>
            </Link>

            {/* BOTÓN HAMBURGUESA PARA TELÉFONOS MÓVILES */}
            <button 
              type="button"
              className="btn btn-sm text-white d-lg-none p-1.5 ms-1"
              onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
              aria-label="Abrir menú"
            >
              <i className={`bi ${menuMovilAbierto ? 'bi-x-lg' : 'bi-list'} fs-4`}></i>
            </button>

          </div>
        </div>

        {/* ── MENÚ COLAPSABLE DESPLEGABLE EN MÓVILES ── */}
        {menuMovilAbierto && (
          <div className="d-lg-none mt-3 pt-3 border-top border-secondary border-opacity-25 animate__animated animate__fadeInDown">
            <div className="d-flex flex-column gap-1.5 pb-2">
              <a 
                href="#inicio" 
                className="portal-nav-link"
                onClick={() => setMenuMovilAbierto(false)}
              >
                <i className="bi bi-house-door"></i>
                <span>Inicio & Presentación</span>
              </a>
              <a 
                href="#identidad" 
                className="portal-nav-link"
                onClick={() => setMenuMovilAbierto(false)}
              >
                <i className="bi bi-award"></i>
                <span>Identidad (Misión, Visión y PEIC)</span>
              </a>
              <a 
                href="#niveles" 
                className="portal-nav-link"
                onClick={() => setMenuMovilAbierto(false)}
              >
                <i className="bi bi-mortarboard"></i>
                <span>Niveles Educativos</span>
              </a>
              <a 
                href="#transporte" 
                className="portal-nav-link"
                onClick={() => setMenuMovilAbierto(false)}
              >
                <i className="bi bi-bus-front"></i>
                <span>Transporte & Rutas</span>
              </a>
              <a 
                href="#admisiones" 
                className="portal-nav-link"
                onClick={() => setMenuMovilAbierto(false)}
              >
                <i className="bi bi-person-plus"></i>
                <span>Admisiones y Cupos 2026-2027</span>
              </a>
              <a 
                href="#contacto" 
                className="portal-nav-link"
                onClick={() => setMenuMovilAbierto(false)}
              >
                <i className="bi bi-geo-alt"></i>
                <span>Ubicación y Contacto</span>
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
