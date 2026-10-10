/**
 * ==============================================================================
 * ARCHIVO: src/components/escuelas/SelectorEscuelaModal.tsx
 * PROPÓSITO: Modal interactivo para seleccionar la institución escolar (Multi-Escuela).
 * ESTILO: SAP Fiori Horizon + Apple Glassmorphism + Responsive Touch.
 * CARACTERÍSTICAS:
 *  1. Permite al usuario elegir entre los planteles registrados (SB / LB u otros).
 *  2. Fija el contexto multi-tenant (`school_id`) en `SchoolContext` y `localStorage`.
 *  3. Redirige fluidamente a la autenticación privada o al portal de la institución.
 *  4. Código completamente comentado en español línea por línea.
 * ==============================================================================
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchool } from '../../context/SchoolContext';

interface SelectorEscuelaModalProps {
  // Acción adicional opcional tras seleccionar (ej: redirigir al login)
  destino?: 'login' | 'portal';
}

export const SelectorEscuelaModal: React.FC<SelectorEscuelaModalProps> = ({ destino = 'login' }) => {
  const navigate = useNavigate();
  const { escuelas, escuelaActiva, cambiarEscuela, selectorModalAbierto, setSelectorModalAbierto } = useSchool();

  // Si el modal está cerrado, no renderizamos nada
  if (!selectorModalAbierto) return null;

  // Función al hacer clic en una institución
  const handleSeleccionar = (idEscuela: string) => {
    // 1. Establecemos la escuela en el contexto global y en localStorage
    cambiarEscuela(idEscuela);

    // 2. Cerramos el modal
    setSelectorModalAbierto(false);

    // 3. Redirigimos según el destino deseado
    if (destino === 'login') {
      navigate('/login');
    } else {
      navigate(`/portal/${idEscuela}`);
    }
  };

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex={-1} 
      style={{ 
        backgroundColor: 'rgba(3, 11, 28, 0.75)', 
        backdropFilter: 'blur(12px)',
        zIndex: 1080 
      }}
      onClick={() => setSelectorModalAbierto(false)}
    >
      <div 
        className="modal-dialog modal-dialog-centered modal-lg px-3"
        onClick={(e) => e.stopPropagation()} // Evita cerrar el modal al hacer clic dentro
      >
        <div 
          className="modal-content border-0 shadow-2xl rounded-4 overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(20px)',
            border: '1.5px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 25px 60px -15px rgba(3, 27, 78, 0.35)'
          }}
        >
          {/* Cabecera del Modal con Cintillo Oficial */}
          <div 
            className="p-3 text-white d-flex align-items-center justify-content-between"
            style={{ background: 'linear-gradient(135deg, #031b4e 0%, #082466 100%)' }}
          >
            <div className="d-flex align-items-center gap-2">
              <img 
                src="/assets/img/sigae.png" 
                alt="SIGAE" 
                style={{ width: '28px', height: '28px', objectFit: 'contain' }} 
              />
              <span className="fw-bold fs-6">Seleccionar Institución Educativa</span>
            </div>
            
            {/* Botón Cerrar */}
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              aria-label="Cerrar"
              onClick={() => setSelectorModalAbierto(false)}
            />
          </div>

          {/* Cuerpo del Modal con las Tarjetas de Colegios */}
          <div className="modal-body p-4 p-md-5">
            <div className="text-center mb-4">
              <span className="badge bg-light text-primary border px-3 py-1 rounded-pill fw-bold extra-small text-uppercase mb-2">
                <i className="bi bi-buildings-fill me-1"></i>
                Ecosistema Multi-Escuela
              </span>
              <h3 className="fw-bolder fs-4 text-dark m-0">¿A qué institución deseas acceder?</h3>
              <p className="text-muted small mt-1">
                Selecciona tu plantel educativo para gestionar inscripciones, transporte, notas o consultar el portal.
              </p>
            </div>

            {/* Cuadrícula interactiva de colegios */}
            <div className="row g-3 g-md-4">
              {escuelas.map((esc) => {
                const esEstaActiva = esc.id_escuela === escuelaActiva;
                const esSB = esc.id_escuela === 'sb';
                const colorBorde = esSB ? '#10b981' : '#0062ff';

                return (
                  <div key={esc.id_escuela} className="col-md-6">
                    <div 
                      className="p-4 rounded-4 border h-100 d-flex flex-column justify-content-between cursor-pointer transition-all"
                      style={{
                        background: esEstaActiva 
                          ? (esSB ? 'rgba(16, 185, 129, 0.06)' : 'rgba(0, 98, 255, 0.06)')
                          : '#ffffff',
                        borderColor: esEstaActiva ? colorBorde : '#e2e8f0',
                        borderWidth: esEstaActiva ? '2px' : '1.5px',
                        boxShadow: esEstaActiva 
                          ? `0 12px 28px -6px ${colorBorde}33` 
                          : '0 4px 14px rgba(0,0,0,0.04)',
                        transform: esEstaActiva ? 'scale(1.01)' : 'none'
                      }}
                      onClick={() => handleSeleccionar(esc.id_escuela)}
                      role="button"
                    >
                      {/* Logo y Nombre */}
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          {/* Escudo 3D */}
                          <div 
                            className="rounded-3 p-1 border d-flex align-items-center justify-content-center bg-white shadow-xs"
                            style={{ width: '56px', height: '56px' }}
                          >
                            <img 
                              src={esc.logo_url || `/assets/img/logo_${esc.id_escuela}.png`} 
                              alt={esc.nombre_institucion}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                            />
                          </div>

                          {/* Badge de estado */}
                          {esEstaActiva ? (
                            <span className="badge rounded-pill px-2.5 py-1 text-white fw-bold extra-small" style={{ backgroundColor: colorBorde }}>
                              <i className="bi bi-check2-circle me-1"></i> Seleccionada
                            </span>
                          ) : (
                            <span className="badge bg-light text-muted border rounded-pill px-2.5 py-1 extra-small">
                              Disponible
                            </span>
                          )}
                        </div>

                        <h4 className="fw-bolder fs-5 text-dark mb-1">
                          {esc.nombre_institucion}
                        </h4>
                        
                        <div className="text-muted extra-small mb-2" style={{ fontSize: '0.76rem' }}>
                          <span className="fw-semibold text-secondary">DEA: {esc.codigo_dea}</span> &bull; <span>RIF: {esc.rif}</span>
                        </div>

                        <p className="text-secondary small mb-3" style={{ fontSize: '0.82rem', lineHeight: 1.45 }}>
                          <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                          {esc.direccion}
                        </p>
                      </div>

                      {/* Botón de Selección */}
                      <button 
                        type="button" 
                        className="btn w-100 rounded-pill py-2 fw-bold small mt-2 d-flex align-items-center justify-content-center gap-1.5 shadow-xs"
                        style={{
                          backgroundColor: esEstaActiva ? colorBorde : '#031b4e',
                          color: '#ffffff',
                          border: 'none'
                        }}
                      >
                        <span>Ingresar a este Plantel</span>
                        <i className="bi bi-arrow-right"></i>
                      </button>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* Aviso informativo de seguridad multi-escuela */}
            <div className="text-center mt-4 pt-3 border-top">
              <p className="text-muted extra-small m-0" style={{ fontSize: '0.76rem' }}>
                <i className="bi bi-shield-check text-success me-1"></i>
                La información de cada institución está blindada y aislada de forma independiente mediante Row Level Security (RLS).
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
