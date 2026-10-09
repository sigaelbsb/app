/**
 * ==============================================================================
 * ARCHIVO: src/components/layout/NavbarPublica.tsx
 * PROPÓSITO: Barra de navegación superior para la Web Informativa Pública de SIGAE.
 * CARACTERÍSTICAS:
 *  1. Multi-escuela: Selector dinámico para alternar entre planteles (SB y LB).
 *  2. Móvil-Primero: Menú colapsable suave adaptado a pantallas táctiles.
 *  3. Seguridad: No expone rutas privadas hasta que el usuario se autentica.
 * ==============================================================================
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// Propiedades que recibe la barra de navegación pública
interface NavbarPublicaProps {
  // Código de la escuela actual ('sb' para Santa Bárbara, 'lb' para Libertador Bolívar)
  escuelaActiva: 'sb' | 'lb';
  // Función para cambiar de escuela desde el selector
  onCambiarEscuela: (nuevaEscuela: 'sb' | 'lb') => void;
}

export const NavbarPublica: React.FC<NavbarPublicaProps> = ({
  escuelaActiva,
  onCambiarEscuela
}) => {
  // Hook de navegación de React Router para movernos entre páginas
  const navigate = useNavigate();

  // Estado para controlar la apertura del menú en teléfonos móviles (hamburguesa)
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  // Datos dinámicos según el colegio seleccionado
  const nombreColegio = escuelaActiva === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar';
  const logoColegio = `/assets/img/logo_${escuelaActiva}.png`;
  const colorAcento = escuelaActiva === 'sb' ? '#10b981' : '#2563eb'; // Verde para SB, Azul para LB

  return (
    <header className="sticky-top bg-white border-bottom shadow-xs" style={{ zIndex: 1040 }}>
      {/* ── BARRA SUPERIOR DE AVISO INSTITUCIONAL (Cintillo Superior) ── */}
      <div 
        className="py-1 px-3 text-white text-center d-flex justify-content-between align-items-center"
        style={{ 
          backgroundColor: colorAcento,
          fontSize: '0.75rem',
          letterSpacing: '0.3px',
          fontWeight: 600
        }}
      >
        <div className="d-flex align-items-center gap-1.5 mx-auto">
          <span>🏛️ República Bolivariana de Venezuela &bull; MPPE &bull; {nombreColegio}</span>
        </div>
      </div>

      {/* ── BARRA PRINCIPAL DE NAVEGACIÓN ── */}
      <nav className="navbar navbar-expand-lg navbar-light py-2 px-3 px-md-4">
        <div className="container-fluid p-0 d-flex justify-content-between align-items-center">
          
          {/* 1. LOGO Y NOMBRE INSTITUCIONAL */}
          <Link 
            to={`/portal/${escuelaActiva}`}
            className="d-flex align-items-center gap-2 text-decoration-none"
          >
            {/* Escudo del Plantel */}
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center bg-light border p-1"
              style={{ width: '42px', height: '42px', flexShrink: 0 }}
            >
              <img 
                src={logoColegio} 
                alt={`Escudo ${nombreColegio}`}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
              />
            </div>
            
            {/* Texto del Plantel */}
            <div className="text-start" style={{ lineHeight: 1.15 }}>
              <span className="fw-bolder text-dark d-block fs-6 m-0">
                {nombreColegio}
              </span>
              <span className="badge bg-light text-muted border extra-small px-1.5 py-0 fw-semibold" style={{ fontSize: '0.65rem' }}>
                Portal Informativo Oficial
              </span>
            </div>
          </Link>

          {/* 2. BOTONES CENTRALES EN PANTALLAS GRANDES */}
          <div className="d-none d-lg-flex align-items-center gap-3">
            <Link to={`/portal/${escuelaActiva}#inicio`} className="nav-link fw-semibold text-dark hover-primary px-2">
              Inicio
            </Link>
            <Link to={`/portal/${escuelaActiva}#identidad`} className="nav-link fw-semibold text-dark hover-primary px-2">
              Misión & Visión
            </Link>
            <Link to={`/portal/${escuelaActiva}#admisiones`} className="nav-link fw-semibold text-dark hover-primary px-2">
              Admisiones 2026-2027
            </Link>
            <Link to={`/portal/${escuelaActiva}#contacto`} className="nav-link fw-semibold text-dark hover-primary px-2">
              Ubicación & Contacto
            </Link>
          </div>

          {/* 3. SELECTOR DE SEDE Y ACCESO AL CAMPUS */}
          <div className="d-flex align-items-center gap-2">
            
            {/* SELECTOR INTERACTIVO ENTRE COLEGIOS */}
            <div className="dropdown">
              <button 
                className="btn btn-sm btn-outline-secondary dropdown-toggle d-flex align-items-center gap-1.5 rounded-pill px-2.5 py-1.5 shadow-xs"
                type="button" 
                id="dropdownSelectorSedePublica" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
                style={{ fontSize: '0.78rem', fontWeight: 600 }}
              >
                <i className="bi bi-arrow-left-right text-primary"></i>
                <span className="d-none d-sm-inline">Cambiar Sede:</span>
                <span className="text-dark fw-bold">{escuelaActiva === 'sb' ? 'Santa Bárbara' : 'Libertador'}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end shadow-sm rounded-3 border py-1" aria-labelledby="dropdownSelectorSedePublica">
                <li>
                  <button 
                    onClick={() => onCambiarEscuela('sb')}
                    className={`dropdown-item d-flex align-items-center gap-2 py-2 px-3 small ${escuelaActiva === 'sb' ? 'active fw-bold' : ''}`}
                  >
                    <img src="/assets/img/logo_sb.png" alt="SB" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                    <span>U.E. Santa Bárbara</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => onCambiarEscuela('lb')}
                    className={`dropdown-item d-flex align-items-center gap-2 py-2 px-3 small ${escuelaActiva === 'lb' ? 'active fw-bold' : ''}`}
                  >
                    <img src="/assets/img/logo_lb.png" alt="LB" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                    <span>U.E. Libertador Bolívar</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* BOTÓN DESTACADO: ENTRAR AL SISTEMA / CAMPUS */}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="btn btn-sm btn-primary d-flex align-items-center gap-1.5 rounded-pill px-3 py-1.5 shadow-xs fw-bold"
              style={{ fontSize: '0.8rem', background: '#0062ff', borderColor: '#0062ff' }}
            >
              <i className="bi bi-shield-lock-fill"></i>
              <span>Ingresar</span>
            </button>

            {/* BOTÓN MENÚ MÓVIL (Hamburguesa táctil) */}
            <button
              type="button"
              onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
              className="btn btn-sm btn-light border d-lg-none p-1.5 rounded-3 ms-1"
              aria-label="Abrir menú"
            >
              <i className={`bi ${menuMovilAbierto ? 'bi-x-lg' : 'bi-list'} fs-5`}></i>
            </button>
          </div>

        </div>

        {/* ── MENÚ DESPLEGABLE MÓVIL (Se muestra solo en celulares al tocar hamburguesa) ── */}
        {menuMovilAbierto && (
          <div className="w-100 mt-2 pt-2 border-top d-lg-none bg-white animate-fade-in">
            <div className="d-flex flex-column gap-1 pb-2">
              <Link 
                to={`/portal/${escuelaActiva}#inicio`} 
                onClick={() => setMenuMovilAbierto(false)}
                className="py-2 px-3 rounded-2 text-dark text-decoration-none fw-semibold hover-bg-light d-flex align-items-center gap-2"
              >
                <i className="bi bi-house-door text-primary"></i> Inicio
              </Link>
              <Link 
                to={`/portal/${escuelaActiva}#identidad`} 
                onClick={() => setMenuMovilAbierto(false)}
                className="py-2 px-3 rounded-2 text-dark text-decoration-none fw-semibold hover-bg-light d-flex align-items-center gap-2"
              >
                <i className="bi bi-bookmark-star text-primary"></i> Misión, Visión & PEIC
              </Link>
              <Link 
                to={`/portal/${escuelaActiva}#admisiones`} 
                onClick={() => setMenuMovilAbierto(false)}
                className="py-2 px-3 rounded-2 text-dark text-decoration-none fw-semibold hover-bg-light d-flex align-items-center gap-2"
              >
                <i className="bi bi-clipboard2-check text-success"></i> Solicitud de Cupos
              </Link>
              <Link 
                to={`/portal/${escuelaActiva}#contacto`} 
                onClick={() => setMenuMovilAbierto(false)}
                className="py-2 px-3 rounded-2 text-dark text-decoration-none fw-semibold hover-bg-light d-flex align-items-center gap-2"
              >
                <i className="bi bi-geo-alt text-danger"></i> Ubicación y Contacto
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
