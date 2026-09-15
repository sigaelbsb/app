import React from 'react';

/**
 * Icono personalizado: Estudiante en la Matrícula / Expediente
 */
export const IconoEstudiante: React.FC<{ size?: number; color?: string }> = ({ 
  size = 28, 
  color = '#10b981' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 2px 6px ${color}50)` }}
  >
    {/* Gradiente dinámico */}
    <defs>
      <linearGradient id="studentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="capGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>

    {/* Birrete / Gorra Estudiantil */}
    <path 
      d="M16 2L2 8L16 14L30 8L16 2Z" 
      fill="url(#capGrad)" 
      stroke="#ffffff" 
      strokeWidth="1.2"
    />
    <path 
      d="M26 10.5V17C26 17 27 18 27.5 19.5" 
      stroke="#fbbf24" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
    <circle cx="27.5" cy="20.5" r="1.2" fill="#fbbf24" />

    {/* Cabeza / Rostro del Estudiante */}
    <circle cx="16" cy="15" r="5" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
    
    {/* Cabello / Peinado */}
    <path d="M12 13.5C12 11.5 13.5 10.5 16 10.5C18.5 10.5 20 11.5 20 13.5C19 12.5 18 12.2 16 12.2C14 12.2 13 12.5 12 13.5Z" fill="#78350f" />
    
    {/* Ojos y Sonrisa */}
    <circle cx="14.2" cy="15" r="0.6" fill="#1e293b" />
    <circle cx="17.8" cy="15" r="0.6" fill="#1e293b" />
    <path d="M14.5 17C15 18 17 18 17.5 17" stroke="#b45309" strokeWidth="0.8" strokeLinecap="round" />

    {/* Cuerpo / Uniforme Escolar */}
    <path 
      d="M8.5 29C8.5 24 11.5 21.5 16 21.5C20.5 21.5 23.5 24 23.5 29" 
      fill="url(#studentGrad)" 
      stroke="#ffffff" 
      strokeWidth="1.2"
    />
    {/* Cuello de la camisa escolar */}
    <path d="M13.5 21.5L16 24.5L18.5 21.5" stroke="#ffffff" strokeWidth="1.2" fill="#f8fafc" />
    {/* Mochila / Correa */}
    <path d="M10 24L11 29" stroke="#047857" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M22 24L21 29" stroke="#047857" strokeWidth="1.2" strokeLinecap="round" />

    {/* Insignia / Estrella de rendimiento escolar */}
    <circle cx="20.5" cy="25" r="1.8" fill="#fbbf24" stroke="#ffffff" strokeWidth="0.6" />
  </svg>
);

/**
 * Icono personalizado: Unidad de Transporte Escolar (Autobús amarillo/naranja con ruta)
 */
export const IconoUnidadTransporte: React.FC<{ size?: number; color?: string }> = ({ 
  size = 28, 
  color = '#f97316' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 2px 6px ${color}50)` }}
  >
    <defs>
      <linearGradient id="busGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="60%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
      <linearGradient id="windowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#e0f2fe" />
        <stop offset="100%" stopColor="#7dd3fc" />
      </linearGradient>
    </defs>

    {/* Techo y carrocería principal del autobús */}
    <rect x="3.5" y="4.5" width="25" height="20" rx="4" fill="url(#busGrad)" stroke="#c2410c" strokeWidth="1.2" />

    {/* Visera superior con cartel de ruta */}
    <rect x="9" y="5.5" width="14" height="3" rx="1" fill="#0f172a" />
    <text x="16" y="8" fill="#fde047" fontSize="2.2" fontWeight="900" textAnchor="middle" fontFamily="monospace">ESCOLAR</text>

    {/* Parabrisas frontal panorámico */}
    <rect x="5.5" y="9.5" width="21" height="7.5" rx="2" fill="url(#windowGrad)" stroke="#0369a1" strokeWidth="0.8" />
    {/* Reflejo del parabrisas */}
    <line x1="8" y1="10.5" x2="12" y2="16" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
    <line x1="13" y1="10.5" x2="16" y2="16" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />

    {/* Parrilla delantera */}
    <rect x="10" y="18.5" width="12" height="4.5" rx="1.5" fill="#1e293b" />
    <line x1="12" y1="20" x2="20" y2="20" stroke="#64748b" strokeWidth="0.7" />
    <line x1="12" y1="21.5" x2="20" y2="21.5" stroke="#64748b" strokeWidth="0.7" />

    {/* Faros delanteros con resplandor */}
    <circle cx="6.8" cy="19.8" r="2" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
    <circle cx="25.2" cy="19.8" r="2" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />

    {/* Ruedas y rines */}
    <circle cx="7" cy="25" r="3.2" fill="#0f172a" />
    <circle cx="7" cy="25" r="1.3" fill="#cbd5e1" />

    <circle cx="25" cy="25" r="3.2" fill="#0f172a" />
    <circle cx="25" cy="25" r="1.3" fill="#cbd5e1" />

    {/* Retrovisores */}
    <rect x="1.8" y="11" width="1.5" height="3" rx="0.7" fill="#c2410c" />
    <rect x="28.7" y="11" width="1.5" height="3" rx="0.7" fill="#c2410c" />
  </svg>
);

/**
 * Icono personalizado: Unidad de Transporte de Personal / Shuttle Ejecutivo
 */
export const IconoUnidadPersonal: React.FC<{ size?: number; color?: string }> = ({ 
  size = 28, 
  color = '#8b5cf6' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 2px 6px ${color}50)` }}
  >
    <defs>
      <linearGradient id="shuttleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#a78bfa" />
        <stop offset="60%" stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#5b21b6" />
      </linearGradient>
      <linearGradient id="shuttleWindow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#312e81" />
        <stop offset="100%" stopColor="#1e1b4b" />
      </linearGradient>
    </defs>

    {/* Carrocería aerodinámica del shuttle */}
    <path 
      d="M4 8C4 5.5 6 4.5 9 4.5H23C26 4.5 28 5.5 28 8V23C28 24 27.5 24.5 26.5 24.5H5.5C4.5 24.5 4 24 4 23V8Z" 
      fill="url(#shuttleGrad)" 
      stroke="#4c1d95" 
      strokeWidth="1.2"
    />

    {/* Indicador de Línea Personal */}
    <rect x="9.5" y="5.8" width="13" height="2.8" rx="1.2" fill="#030712" />
    <text x="16" y="8" fill="#a78bfa" fontSize="2.1" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">PERSONAL</text>

    {/* Ventana panorámica tintada */}
    <rect x="6" y="9.5" width="20" height="7" rx="2" fill="url(#shuttleWindow)" stroke="#6366f1" strokeWidth="0.8" />
    
    {/* Asientos de pasajeros visibles */}
    <circle cx="9.5" cy="13" r="1.3" fill="#a5b4fc" opacity="0.8" />
    <circle cx="16" cy="13" r="1.3" fill="#a5b4fc" opacity="0.8" />
    <circle cx="22.5" cy="13" r="1.3" fill="#a5b4fc" opacity="0.8" />

    {/* Parrilla frontal cromada */}
    <rect x="10.5" y="18" width="11" height="4.5" rx="1.5" fill="#0f172a" stroke="#a78bfa" strokeWidth="0.6" />
    <circle cx="16" cy="20.2" r="1" fill="#c084fc" />

    {/* Faros LED */}
    <path d="M6 19.5H8.5V21H6.5C6.2 21 6 20.8 6 20.5V19.5Z" fill="#38bdf8" />
    <path d="M26 19.5H23.5V21H25.5C25.8 21 26 20.8 26 20.5V19.5Z" fill="#38bdf8" />

    {/* Ruedas */}
    <circle cx="7.5" cy="25.5" r="3" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
    <circle cx="7.5" cy="25.5" r="1.2" fill="#a78bfa" />
    <circle cx="24.5" cy="25.5" r="3" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
    <circle cx="24.5" cy="25.5" r="1.2" fill="#a78bfa" />
  </svg>
);

/**
 * Icono personalizado: Seguridad Cibernética y Credenciales del Rol
 */
export const IconoSeguridadRol: React.FC<{ size?: number; color?: string }> = ({ 
  size = 28, 
  color = '#0284c7' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 2px 6px ${color}50)` }}
  >
    <defs>
      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>
    </defs>

    {/* Escudo Exterior */}
    <path 
      d="M16 2.5L4 7.5V15.5C4 23 9.5 28.5 16 30C22.5 28.5 28 23 28 15.5V7.5L16 2.5Z" 
      fill="url(#shieldGrad)" 
      stroke="#ffffff" 
      strokeWidth="1.2"
    />

    {/* Anillo de Biometría / Autenticación */}
    <circle cx="16" cy="15.5" r="7" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="2.5 2" opacity="0.8" />

    {/* Candado / Núcleo de Clave */}
    <rect x="12" y="14" width="8" height="6.5" rx="1.8" fill="#ffffff" />
    <path 
      d="M13.5 14V11.5C13.5 10.1 14.6 9 16 9C17.4 9 18.5 10.1 18.5 11.5V14" 
      stroke="#ffffff" 
      strokeWidth="1.8" 
      strokeLinecap="round" 
    />
    {/* Ojo de la cerradura */}
    <circle cx="16" cy="16.5" r="1.1" fill="#0284c7" />
    <path d="M16 17.5V19" stroke="#0284c7" strokeWidth="1.2" strokeLinecap="round" />

    {/* Checkmark de Verificación */}
    <circle cx="22.5" cy="22.5" r="3.2" fill="#10b981" stroke="#ffffff" strokeWidth="0.8" />
    <path d="M21 22.5L22.2 23.7L24.2 21.5" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Icono personalizado: Censo y Matrícula General de la Escuela
 */
export const IconoMatriculaCenso: React.FC<{ size?: number; color?: string }> = ({ 
  size = 28, 
  color = '#06b6d4' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 2px 6px ${color}50)` }}
  >
    <defs>
      <linearGradient id="censusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#0891b2" />
      </linearGradient>
    </defs>

    {/* Carpeta / Tabla de Censo */}
    <rect x="4.5" y="4" width="23" height="25" rx="3.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
    
    {/* Clip Superior del Portapapeles */}
    <rect x="10.5" y="2" width="11" height="4" rx="1.5" fill="#0e7490" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="16" cy="4" r="1" fill="#ffffff" />

    {/* Gráfico circular o barras del censo grabado */}
    <rect x="8" y="9.5" width="16" height="4" rx="1" fill="url(#censusGrad)" />
    
    {/* Alumnos en fila del censo */}
    <circle cx="11.5" cy="18" r="2.2" fill="#0891b2" />
    <path d="M8 24.5C8 22.5 9.5 21 11.5 21C13.5 21 15 22.5 15 24.5" fill="#0891b2" />

    <circle cx="19.5" cy="18" r="2.2" fill="#0284c7" />
    <path d="M16 24.5C16 22.5 17.5 21 19.5 21C21.5 21 23 22.5 23 24.5" fill="#0284c7" />

    {/* Insignia de check de auditoría */}
    <circle cx="23.5" cy="23.5" r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
    <path d="M21.8 23.5L23 24.7L25.2 22.3" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Icono personalizado: Avisos, Consultas Institucionales y Radiodifusión
 */
export const IconoAvisosRadar: React.FC<{ size?: number; color?: string }> = ({ 
  size = 28, 
  color = '#ec4899' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 2px 6px ${color}50)` }}
  >
    <defs>
      <linearGradient id="bellGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f472b6" />
        <stop offset="100%" stopColor="#db2777" />
      </linearGradient>
    </defs>

    {/* Ondas expansivas de radar / difusión */}
    <path d="M4 11C2.5 14 2.5 18 4 21" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <path d="M28 11C29.5 14 29.5 18 28 21" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <path d="M7 13.5C6 15 6 17 7 18.5" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    <path d="M25 13.5C26 15 26 17 25 18.5" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />

    {/* Campana principal */}
    <path 
      d="M16 4C11.5 4 9.5 7.5 9.5 14C9.5 18.5 7.5 21 7.5 21H24.5C24.5 21 22.5 18.5 22.5 14C22.5 7.5 20.5 4 16 4Z" 
      fill="url(#bellGrad)" 
      stroke="#ffffff" 
      strokeWidth="1.2"
    />
    {/* Aro superior de la campana */}
    <circle cx="16" cy="3.5" r="1.5" stroke="#ffffff" strokeWidth="1.2" fill="none" />

    {/* Péndulo inferior */}
    <path d="M13.5 23C13.5 24.5 14.6 25.5 16 25.5C17.4 25.5 18.5 24.5 18.5 23" fill="#be185d" />

    {/* Micro badge indicador con pulso */}
    <circle cx="22.5" cy="7.5" r="3" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
    <circle cx="22.5" cy="7.5" r="1.2" fill="#ffffff" />
  </svg>
);

/**
 * Icono personalizado: Personal Institucional y Plantilla Docente DEP Oriente
 */
export const IconoPersonalDocente: React.FC<{ size?: number; color?: string }> = ({ 
  size = 28, 
  color = '#6366f1' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 32 32" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 2px 6px ${color}50)` }}
  >
    <defs>
      <linearGradient id="personalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#818cf8" />
        <stop offset="50%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#4338ca" />
      </linearGradient>
    </defs>

    {/* Fondo de insignia institucional */}
    <rect x="2.5" y="4.5" width="27" height="23" rx="5" fill="#f8fafc" stroke="#c7d2fe" strokeWidth="1.2" />

    {/* Cinta superior institucional */}
    <path d="M2.5 9.5C2.5 6.7 4.7 4.5 7.5 4.5H24.5C27.3 4.5 29.5 6.7 29.5 9.5V11.5H2.5V9.5Z" fill="url(#personalGrad)" />
    
    {/* Silueta Profesional 1 (Docente con corbata/cuello) */}
    <circle cx="11.5" cy="16" r="3" fill="#6366f1" />
    <path d="M6 25C6 21.5 8.5 20 11.5 20C14.5 20 17 21.5 17 25" fill="#6366f1" />
    <path d="M10 20L11.5 22.5L13 20" stroke="#ffffff" strokeWidth="1" />

    {/* Silueta Profesional 2 (Personal / Directivo al lado) */}
    <circle cx="20.5" cy="16" r="3" fill="#818cf8" />
    <path d="M17.5 25C17.5 22.5 19 21 20.5 21C22 21 26 22 26 25" fill="#818cf8" />

    {/* Credencial / Badge de DEP Oriente */}
    <rect x="22" y="19.5" width="7.5" height="6.5" rx="1.5" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" />
    <line x1="23.5" y1="21.5" x2="28" y2="21.5" stroke="#78350f" strokeWidth="0.8" />
    <line x1="23.5" y1="23.5" x2="26.5" y2="23.5" stroke="#78350f" strokeWidth="0.8" />
  </svg>
);

/**
 * Icono personalizado: Perfil de la Escuela / Plantel Institucional
 */
export const IconoPerfilEscuela: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = '#0284c7'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 4px 10px ${color}45)` }}
  >
    <defs>
      <linearGradient id="schoolRoof" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>
      <linearGradient id="schoolWall" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#e2e8f0" />
      </linearGradient>
    </defs>
    {/* Base y Escalinata */}
    <rect x="3" y="33" width="34" height="4" rx="2" fill="#94a3b8" />
    <rect x="5" y="30" width="30" height="3.5" rx="1.5" fill="#cbd5e1" />
    {/* Fachada Principal */}
    <rect x="6" y="15" width="28" height="15.5" rx="2" fill="url(#schoolWall)" stroke="#94a3b8" strokeWidth="1" />
    {/* Frontón Triangular Clásico */}
    <path d="M4 15L20 4L36 15H4Z" fill="url(#schoolRoof)" stroke="#0284c7" strokeWidth="1.2" />
    {/* Escudo Dorado en Frontón */}
    <circle cx="20" cy="10.5" r="3" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" />
    <path d="M19 10.5L20 9L21 10.5L20 12L19 10.5Z" fill="#b45309" />
    {/* Columnas */}
    <rect x="9" y="15" width="3" height="15" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.8" />
    <rect x="15" y="15" width="3" height="15" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.8" />
    <rect x="22" y="15" width="3" height="15" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.8" />
    <rect x="28" y="15" width="3" height="15" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.8" />
    {/* Puerta Principal Arqueada */}
    <path d="M17 30V22C17 20.5 18.5 19.5 20 19.5C21.5 19.5 23 20.5 23 22V30H17Z" fill="#0284c7" />
    <line x1="20" y1="20" x2="20" y2="30" stroke="#ffffff" strokeWidth="0.8" />
    {/* Bandera Tricolor en el Toque del Techo */}
    <line x1="20" y1="4" x2="20" y2="1" stroke="#475569" strokeWidth="1" />
    <path d="M20 1L26 2.5L20 4V1Z" fill="#fbbf24" />
    {/* Ventanas con luz */}
    <rect x="10" y="18" width="3.5" height="4" rx="1" fill="#38bdf8" opacity="0.8" />
    <rect x="26.5" y="18" width="3.5" height="4" rx="1" fill="#38bdf8" opacity="0.8" />
  </svg>
);

/**
 * Icono personalizado: Configuración del Sistema / Parámetros Globales
 */
export const IconoConfiguracionSistema: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = '#f59e0b'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 4px 10px ${color}45)` }}
  >
    <defs>
      <linearGradient id="gearOrange" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
      <linearGradient id="gearBlue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
    </defs>
    {/* Engranaje Principal Grande (Naranja) */}
    <g transform="translate(18, 18)">
      <circle cx="0" cy="0" r="13" fill="url(#gearOrange)" />
      {/* Dientes del engranaje */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <rect
          key={angle}
          x="-2.5"
          y="-16"
          width="5"
          height="4.5"
          rx="1"
          fill="#d97706"
          transform={`rotate(${angle})`}
        />
      ))}
      <circle cx="0" cy="0" r="6" fill="#ffffff" />
      <circle cx="0" cy="0" r="3.5" fill="#d97706" />
    </g>
    {/* Engranaje Secundario Integrado (Cian) */}
    <g transform="translate(30, 28)">
      <circle cx="0" cy="0" r="7.5" fill="url(#gearBlue)" />
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <rect
          key={angle}
          x="-1.5"
          y="-9.5"
          width="3"
          height="2.5"
          rx="0.5"
          fill="#0369a1"
          transform={`rotate(${angle})`}
        />
      ))}
      <circle cx="0" cy="0" r="3" fill="#ffffff" />
    </g>
    {/* Sliders de ajuste flotantes */}
    <g transform="translate(4, 7)">
      <rect x="0" y="0" width="11" height="2.5" rx="1.2" fill="#0284c7" opacity="0.9" />
      <circle cx="7" cy="1.25" r="2.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
    </g>
    <g transform="translate(4, 13)">
      <rect x="0" y="0" width="11" height="2.5" rx="1.2" fill="#10b981" opacity="0.9" />
      <circle cx="3.5" cy="1.25" r="2.5" fill="#34d399" stroke="#ffffff" strokeWidth="0.8" />
    </g>
  </svg>
);

export const IconoConfiguracionEscolar = IconoConfiguracionSistema;

/**
 * Icono personalizado: Cerebro de Sigma / Inteligencia Artificial (Mascota Oficial IA)
 */
export const IconoCerebroSigma: React.FC<{ size?: number; color?: string }> = ({
  size = 52,
  color = '#8b5cf6'
}) => (
  <div 
    className="d-inline-flex align-items-center justify-content-center position-relative overflow-hidden"
    style={{ 
      width: `${size}px`, 
      height: `${size}px`,
      borderRadius: '18px',
      boxShadow: `0 6px 16px ${color}45`,
      border: `2px solid ${color}55`,
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
    }}
  >
    <img 
      src="/sigma-avatar.png?v=opcion4-mentora-definitiva" 
      alt="SIGMA AI" 
      className="tech-metric-sigma-avatar"
      style={{ 
        width: '100%', 
        height: '100%', 
        objectFit: 'contain'
      }}
      onError={(e) => {
        // Fallback robusto a jpg por si se requiere
        (e.target as HTMLImageElement).src = '/sigma-avatar.jpg?v=opcion4-mentora-definitiva';
      }}
    />
    {/* Indicador LED neural de IA activa */}
    <span 
      style={{
        position: 'absolute',
        bottom: '3px',
        right: '3px',
        width: '9px',
        height: '9px',
        borderRadius: '50%',
        backgroundColor: '#00e5ff',
        boxShadow: '0 0 8px #00e5ff',
        border: '1.5px solid #ffffff'
      }}
    />
  </div>
);

/**
 * Icono personalizado: Calendario Escolar / Planificador MPPE
 */
export const IconoCalendarioEscolar: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = '#ec4899'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 4px 10px ${color}45)` }}
  >
    <defs>
      <linearGradient id="calHeader" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f43f5e" />
        <stop offset="100%" stopColor="#e11d48" />
      </linearGradient>
    </defs>
    {/* Hoja de Fondo / Sombra */}
    <rect x="6" y="8" width="28" height="28" rx="5" fill="#e2e8f0" />
    {/* Cuerpo del Calendario */}
    <rect x="5" y="6" width="30" height="29" rx="5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
    {/* Cabecera Roja */}
    <path d="M5 11C5 8.2 7.2 6 10 6H30C32.8 6 35 8.2 35 11V15H5V11Z" fill="url(#calHeader)" />
    {/* Anillas superiores */}
    <rect x="10" y="3" width="3" height="6" rx="1.5" fill="#94a3b8" stroke="#ffffff" strokeWidth="0.8" />
    <rect x="18.5" y="3" width="3" height="6" rx="1.5" fill="#94a3b8" stroke="#ffffff" strokeWidth="0.8" />
    <rect x="27" y="3" width="3" height="6" rx="1.5" fill="#94a3b8" stroke="#ffffff" strokeWidth="0.8" />
    {/* Cuadrícula de días */}
    <circle cx="11" cy="20" r="1.8" fill="#e2e8f0" />
    <circle cx="16" cy="20" r="1.8" fill="#e2e8f0" />
    <circle cx="21" cy="20" r="1.8" fill="#e2e8f0" />
    <circle cx="26" cy="20" r="1.8" fill="#e2e8f0" />
    <circle cx="11" cy="25" r="1.8" fill="#e2e8f0" />
    <circle cx="16" cy="25" r="2.2" fill="#10b981" />
    <circle cx="21" cy="25" r="1.8" fill="#e2e8f0" />
    <circle cx="26" cy="25" r="1.8" fill="#e2e8f0" />
    <circle cx="11" cy="30" r="1.8" fill="#e2e8f0" />
    <circle cx="16" cy="30" r="1.8" fill="#e2e8f0" />
    <circle cx="21" cy="30" r="2.4" fill="#f43f5e" />
    {/* Estrella de Efemérides en el día 21 */}
    <path d="M29 27L29.7 29L31.8 29.2L30.2 30.5L30.7 32.5L29 31.4L27.3 32.5L27.8 30.5L26.2 29.2L28.3 29L29 27Z" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
  </svg>
);

/**
 * Icono personalizado: División Territorial / Georreferenciación Monagas
 */
export const IconoDivisionTerritorial: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = '#10b981'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 4px 10px ${color}45)` }}
  >
    <defs>
      <linearGradient id="mapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="pinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f43f5e" />
        <stop offset="100%" stopColor="#be123c" />
      </linearGradient>
    </defs>
    {/* Doblez del Mapa 3D (3 Paneles) */}
    <path d="M4 11L14 7L26 11L36 7V29L26 33L14 29L4 33V11Z" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
    {/* Panel Izquierdo */}
    <path d="M4 11L14 7V29L4 33V11Z" fill="#d1fae5" opacity="0.7" />
    {/* Panel Central */}
    <path d="M14 7L26 11V33L14 29V7Z" fill="#a7f3d0" opacity="0.4" />
    {/* Panel Derecho */}
    <path d="M26 11L36 7V29L26 33V11Z" fill="#d1fae5" opacity="0.7" />
    {/* Líneas de relieve geopolítico */}
    <path d="M8 18C11 16 13 22 17 20C21 18 24 24 29 21" stroke="#059669" strokeWidth="1.2" strokeDasharray="2 2" fill="none" />
    {/* Ondas radar GPS */}
    <circle cx="20" cy="20" r="7" stroke="#10b981" strokeWidth="0.8" opacity="0.6" strokeDasharray="2 2" />
    {/* Pin GPS 3D Central */}
    <g transform="translate(14, 5)">
      <path d="M6 0C2.7 0 0 2.7 0 6C0 10.5 6 16 6 16C6 16 12 10.5 12 6C12 2.7 9.3 0 6 0Z" fill="url(#pinGrad)" stroke="#ffffff" strokeWidth="1" />
      <circle cx="6" cy="6" r="2.5" fill="#ffffff" />
    </g>
  </svg>
);

/**
 * Icono personalizado: Panel de Control y Botonera Maestra
 */
export const IconoPanelControl: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = '#f97316'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 4px 10px ${color}45)` }}
  >
    <defs>
      <linearGradient id="panelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
    </defs>
    {/* Chasis de la Consola */}
    <rect x="4" y="6" width="32" height="28" rx="6" fill="url(#panelGrad)" stroke="#475569" strokeWidth="1.2" />
    {/* Pantalla Superior de Telemetría */}
    <rect x="8" y="10" width="24" height="9" rx="3" fill="#0284c7" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="0.8" />
    {/* Señal de pulso verde en pantalla */}
    <path d="M10 14.5H14L16 12L18 17L20 13L22 14.5H30" stroke="#34d399" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Interruptores táctiles con LED (Fila Inferior) */}
    {/* Switch 1: Activo Verde */}
    <rect x="8" y="23" width="10" height="6" rx="3" fill="#065f46" />
    <circle cx="15.5" cy="26" r="2.4" fill="#34d399" stroke="#ffffff" strokeWidth="0.6" />
    {/* Switch 2: Activo Ámbar */}
    <rect x="22" y="23" width="10" height="6" rx="3" fill="#78350f" />
    <circle cx="24.5" cy="26" r="2.4" fill="#fbbf24" stroke="#ffffff" strokeWidth="0.6" />
    {/* LEDs indicadores de estado */}
    <circle cx="8" cy="7.5" r="1.2" fill="#34d399" />
    <circle cx="12" cy="7.5" r="1.2" fill="#38bdf8" />
    <circle cx="16" cy="7.5" r="1.2" fill="#f43f5e" />
  </svg>
);

/**
 * Icono personalizado: Instalación y Descargas Multiplataforma (SIGAE v1.1)
 */
export const IconoInstalacionDescargas: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = '#0066FF'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 4px 10px ${color}50)` }}
  >
    <defs>
      <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0066FF" />
      </linearGradient>
    </defs>
    {/* Nube de Descarga */}
    <path
      d="M10 20C8 20 6.5 18.5 6.5 16.5C6.5 14.8 7.6 13.4 9.2 13.1C9.6 9.7 12.5 7 16 7C18.6 7 20.8 8.4 22 10.5C22.6 10.2 23.3 10 24 10C26.8 10 29 12.2 29 15C29 15.3 28.9 15.6 28.8 16C30.6 16.3 32 17.9 32 20C32 22.2 30.2 24 28 24H10C8 24 6.5 22.5 6.5 20.5"
      fill="url(#cloudGrad)"
      stroke="#ffffff"
      strokeWidth="1"
    />
    {/* Flecha de Descarga en Nube */}
    <path d="M19 13V21M19 21L15.5 17.5M19 21L22.5 17.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {/* Dispositivo Portátil (Laptop / Pantalla) */}
    <rect x="7" y="25" width="24" height="11" rx="2" fill="#1e293b" stroke="#0066FF" strokeWidth="1" />
    <rect x="9.5" y="26.5" width="19" height="7" rx="1" fill="#38bdf8" opacity="0.3" />
    <rect x="4" y="36" width="30" height="2" rx="1" fill="#64748b" />
    {/* Badge v1.1 */}
    <rect x="23" y="27" width="14" height="6" rx="3" fill="#10b981" stroke="#ffffff" strokeWidth="0.8" />
    <text x="30" y="31.2" fill="#ffffff" fontSize="4.5" fontWeight="bold" textAnchor="middle">v1.1</text>
  </svg>
);

/**
 * Icono personalizado: Temporada de Inscripciones / Formalización de Matrícula
 */
export const IconoTemporadaInscripcion: React.FC<{ size?: number; color?: string }> = ({
  size = 42,
  color = '#10b981'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 4px 12px ${color}45)` }}
  >
    <defs>
      <linearGradient id="inscripGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="folderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#ecfdf5" />
      </linearGradient>
    </defs>
    {/* Fondo documento / carpeta de matrícula */}
    <rect x="6" y="8" width="32" height="30" rx="6" fill="url(#folderGrad)" stroke="#10b981" strokeWidth="1.8" />
    <path d="M12 6H20L23 10H34C36.2091 10 38 11.7909 38 14V16H6V10C6 7.79086 7.79086 6 10 6H12Z" fill="url(#inscripGrad)" />
    {/* Líneas de registro */}
    <rect x="12" y="20" width="14" height="2.5" rx="1.2" fill="#10b981" />
    <rect x="12" y="25" width="20" height="2" rx="1" fill="#cbd5e1" />
    <rect x="12" y="29" width="16" height="2" rx="1" fill="#cbd5e1" />
    {/* Sello de Aprobación Verde con Check */}
    <circle cx="31" cy="29" r="7.5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
    <path d="M28 29L30 31L34 27" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Icono personalizado: Temporada de Clases Regulares / Año Escolar Activo
 */
export const IconoTemporadaClases: React.FC<{ size?: number; color?: string }> = ({
  size = 42,
  color = '#2563eb'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 44 44"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 4px 12px ${color}45)` }}
  >
    <defs>
      <linearGradient id="clasesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    {/* Pizarra / Aula Escolar */}
    <rect x="6" y="9" width="32" height="22" rx="4" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.8" />
    <rect x="8" y="11" width="28" height="18" rx="2" fill="#1e293b" />
    {/* Birrete flotante con borla */}
    <path d="M22 13L32 17.5L22 22L12 17.5L22 13Z" fill="url(#clasesGrad)" stroke="#ffffff" strokeWidth="1.2" />
    <path d="M28 19.5V23.5C28 23.5 29 24.5 29.5 25.5" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="29.5" cy="26" r="1" fill="#fbbf24" />
    {/* Soporte de Pizarra */}
    <path d="M14 31L10 39M30 31L34 39" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
    <rect x="12" y="38" width="20" height="2.5" rx="1.2" fill="#3b82f6" />
    {/* Estrella de excelencia académica */}
    <path d="M22 26L23.2 28.5L26 28.8L24 30.7L24.5 33.5L22 32.1L19.5 33.5L20 30.7L18 28.8L20.8 28.5L22 26Z" fill="#fbbf24" stroke="#ffffff" strokeWidth="0.8" />
  </svg>
);

/**
 * Icono personalizado: Documento Oficial Digital (Constancias y Carnets)
 */
export const IconoDocumentoDigital: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = '#FF8D00'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 4px 10px ${color}45)` }}
  >
    <defs>
      <linearGradient id="docOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fb923c" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
    </defs>
    {/* Hoja membretada oficial */}
    <rect x="8" y="5" width="24" height="30" rx="4" fill="#ffffff" stroke="#FF8D00" strokeWidth="1.8" />
    <path d="M24 5V12H31" fill="#ffedd5" stroke="#FF8D00" strokeWidth="1.5" />
    {/* Líneas de texto oficial */}
    <rect x="12" y="14" width="10" height="2" rx="1" fill="url(#docOrangeGrad)" />
    <rect x="12" y="18" width="16" height="1.8" rx="0.9" fill="#cbd5e1" />
    <rect x="12" y="21.5" width="16" height="1.8" rx="0.9" fill="#cbd5e1" />
    <rect x="12" y="25" width="12" height="1.8" rx="0.9" fill="#cbd5e1" />
    {/* Mini QR / Sello Digital */}
    <rect x="23" y="25" width="6" height="6" rx="1.5" fill="#ea580c" />
    <circle cx="26" cy="28" r="1" fill="#ffffff" />
  </svg>
);

/**
 * Icono personalizado: Modo Mantenimiento y Protección Institucional
 */
export const IconoModoMantenimiento: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = '#dc2626'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 4px 10px ${color}45)` }}
  >
    <defs>
      <linearGradient id="shieldMaintGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f87171" />
        <stop offset="100%" stopColor="#dc2626" />
      </linearGradient>
    </defs>
    {/* Escudo protector */}
    <path
      d="M20 5L31 9V19C31 26.5 26.3 32.8 20 35C13.7 32.8 9 26.5 9 19V9L20 5Z"
      fill="url(#shieldMaintGrad)"
      stroke="#ffffff"
      strokeWidth="1.5"
    />
    {/* Cono / Barrera de Mantenimiento */}
    <path d="M16 28H24L22 15H18L16 28Z" fill="#ffffff" />
    <path d="M17.2 21H22.8" stroke="#dc2626" strokeWidth="1.8" />
    <path d="M16.5 25H23.5" stroke="#dc2626" strokeWidth="1.8" />
    <rect x="14" y="28" width="12" height="2" rx="1" fill="#fbbf24" stroke="#ffffff" strokeWidth="0.8" />
  </svg>
);

/**
 * Icono personalizado: Ventana de Admisión de Cupos
 */
export const IconoVentanaCupos: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = '#f59e0b'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 4px 10px ${color}45)` }}
  >
    <defs>
      <linearGradient id="cuposGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
    {/* Calendario base */}
    <rect x="6" y="9" width="28" height="25" rx="5" fill="#ffffff" stroke="#f59e0b" strokeWidth="1.8" />
    <path d="M6 15H34V10C34 7.79086 32.2091 6 30 6H10C7.79086 6 6 7.79086 6 10V15Z" fill="url(#cuposGrad)" />
    {/* Anillas de calendario */}
    <rect x="11" y="4" width="3" height="5" rx="1.5" fill="#78350f" />
    <rect x="26" y="4" width="3" height="5" rx="1.5" fill="#78350f" />
    {/* Reloj de tiempo límite */}
    <circle cx="26" cy="26" r="7" fill="#ffffff" stroke="#d97706" strokeWidth="1.5" />
    <path d="M26 22V26L28.5 28" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
    {/* Check de admisión */}
    <path d="M12 24L15 27L19 21" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Icono personalizado: Estudio Creativo de Diseños
 */
export const IconoEstudioDiseno: React.FC<{ size?: number; color?: string }> = ({
  size = 40,
  color = '#a855f7'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 4px 10px ${color}45)` }}
  >
    <defs>
      <linearGradient id="disenoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#7e22ce" />
      </linearGradient>
    </defs>
    {/* Paleta de pintura */}
    <path
      d="M20 6C11.1634 6 4 12.7157 4 21C4 25.5 7 28.5 11 28.5C12.5 28.5 13.5 27.5 14.5 26.5C15.5 25.5 16.5 25 18 25H20C27.732 25 34 19.1797 34 12C34 8.68629 27.732 6 20 6Z"
      fill="url(#disenoGrad)"
      stroke="#ffffff"
      strokeWidth="1.5"
    />
    {/* Puntos de color acrílico */}
    <circle cx="11" cy="14" r="2" fill="#ef4444" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="17" cy="11" r="2" fill="#3b82f6" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="23" cy="12" r="2" fill="#eab308" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="28" cy="16" r="2" fill="#10b981" stroke="#ffffff" strokeWidth="0.8" />
    {/* Agujero del pulgar */}
    <ellipse cx="10" cy="23" rx="2.5" ry="2" fill="#ffffff" opacity="0.9" />
  </svg>
);

/**
 * Icono personalizado: Estados de Venezuela (División Territorial)
 */
export const IconoEstadoVenezuela: React.FC<{ size?: number; color?: string }> = ({ 
  size = 28, 
  color = '#FF8D00' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 36 36" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 2px 6px ${color}40)` }}
  >
    <defs>
      <linearGradient id="estadoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffedd5" />
        <stop offset="100%" stopColor="#fed7aa" />
      </linearGradient>
      <linearGradient id="flagYellow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#eab308" />
      </linearGradient>
      <linearGradient id="flagBlue" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
      <linearGradient id="flagRed" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f87171" />
        <stop offset="100%" stopColor="#dc2626" />
      </linearGradient>
    </defs>
    {/* Escudo / Silueta Territorial Base */}
    <path 
      d="M18 3L30 7.5V17C30 24.5 24.5 30.5 18 33C11.5 30.5 6 24.5 6 17V7.5L18 3Z" 
      fill="url(#estadoGrad)" 
      stroke="#FF8D00" 
      strokeWidth="1.8" 
      strokeLinejoin="round"
    />
    {/* Franjas Tricolor Institucionales sutiles */}
    <path d="M10 13H26" stroke="url(#flagYellow)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M11 16.5H25" stroke="url(#flagBlue)" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M12 20H24" stroke="url(#flagRed)" strokeWidth="2.5" strokeLinecap="round" />
    {/* Estrella de Soberanía Federal */}
    <path 
      d="M18 6.5L19.2 9.5L22.5 9.8L20 12L20.8 15.2L18 13.5L15.2 15.2L16 12L13.5 9.8L16.8 9.5L18 6.5Z" 
      fill="#FF8D00" 
      stroke="#ffffff" 
      strokeWidth="0.8"
    />
    {/* Mapa / Líneas de Territorio */}
    <circle cx="18" cy="25" r="3" fill="#ffffff" stroke="#ea580c" strokeWidth="1.5" />
    <circle cx="18" cy="25" r="1.2" fill="#ea580c" />
  </svg>
);

/**
 * Icono personalizado: Municipios de Venezuela (División Territorial)
 */
export const IconoMunicipioVenezuela: React.FC<{ size?: number; color?: string }> = ({ 
  size = 28, 
  color = '#00C3FF' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 36 36" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 2px 6px ${color}40)` }}
  >
    <defs>
      <linearGradient id="muniGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e0f2fe" />
        <stop offset="100%" stopColor="#bae6fd" />
      </linearGradient>
      <linearGradient id="muniAccent" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00C3FF" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
    </defs>
    {/* Anillo de Brújula Municipal */}
    <circle cx="18" cy="18" r="14" fill="url(#muniGrad)" stroke="#00C3FF" strokeWidth="1.8" />
    <circle cx="18" cy="18" r="11" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2 2" />
    {/* Edificio de Alcaldía / Cabecera Municipal */}
    <path d="M12 24V18L18 13L24 18V24H12Z" fill="#ffffff" stroke="#0284c7" strokeWidth="1.4" />
    <path d="M16 24V20H20V24" fill="#0284c7" />
    <path d="M18 11V13" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" />
    {/* Rosa de los Vientos / Marcadores Cardinales */}
    <path d="M18 4L19.5 7H16.5L18 4Z" fill="url(#muniAccent)" />
    <path d="M18 32L16.5 29H19.5L18 32Z" fill="url(#muniAccent)" />
    <path d="M4 18L7 16.5V19.5L4 18Z" fill="url(#muniAccent)" />
    <path d="M32 18L29 19.5V16.5L32 18Z" fill="url(#muniAccent)" />
  </svg>
);

/**
 * Icono personalizado: Parroquias de Venezuela (División Territorial)
 */
export const IconoParroquiaVenezuela: React.FC<{ size?: number; color?: string }> = ({ 
  size = 28, 
  color = '#10b981' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 36 36" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 2px 6px ${color}40)` }}
  >
    <defs>
      <linearGradient id="parroquiaPin" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Onda de Zona Geográfica / Radio */}
    <ellipse cx="18" cy="31" rx="9" ry="3" fill="#d1fae5" stroke="#a7f3d0" strokeWidth="1" />
    {/* Pin Geográfico Comunitario */}
    <path 
      d="M18 4C12.4772 4 8 8.47715 8 14C8 21.5 18 30.5 18 30.5C18 30.5 28 21.5 28 14C28 8.47715 23.5228 4 18 4Z" 
      fill="url(#parroquiaPin)" 
      stroke="#ffffff" 
      strokeWidth="1.5" 
    />
    {/* Campanario / Iglesia / Núcleo Parroquial interior */}
    <circle cx="18" cy="13.5" r="6" fill="#ffffff" />
    <path d="M15 17V13L18 10L21 13V17H15Z" fill="#047857" />
    <path d="M17.2 17V14.5H18.8V17" fill="#ffffff" />
    {/* Cruz / Campana */}
    <path d="M18 8V10" stroke="#047857" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M17 9H19" stroke="#047857" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

/**
 * Icono personalizado: Solicitudes de Cupos y Admisiones Escolares
 */
export const IconoSolicitudCupos: React.FC<{ size?: number; color?: string }> = ({ 
  size = 30, 
  color = '#8b5cf6' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 36 36" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 2px 8px ${color}45)` }}
  >
    <defs>
      <linearGradient id="cupoCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a78bfa" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <linearGradient id="cupoStamp" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Fondo de documento / Carpeta de solicitud */}
    <rect x="5" y="4" width="22" height="28" rx="3.5" fill="url(#cupoCardGrad)" stroke="#ffffff" strokeWidth="1.5" />
    {/* Sujetador de planilla superior */}
    <rect x="11" y="2" width="10" height="4" rx="1.5" fill="#fef08a" stroke="#d97706" strokeWidth="0.8" />
    {/* Líneas de datos de la solicitud */}
    <rect x="9" y="10" width="14" height="2" rx="1" fill="#ffffff" fillOpacity="0.85" />
    <rect x="9" y="14" width="10" height="2" rx="1" fill="#ffffff" fillOpacity="0.7" />
    <rect x="9" y="18" width="8" height="2" rx="1" fill="#ffffff" fillOpacity="0.7" />
    {/* Silueta de estudiante en documento */}
    <circle cx="16" cy="24" r="2.5" fill="#fef08a" />
    <path d="M12.5 28.5C12.5 26.8 14 26.2 16 26.2C18 26.2 19.5 26.8 19.5 28.5" stroke="#fef08a" strokeWidth="1.2" strokeLinecap="round" />
    {/* Sello circular de Aprobación / Admisión en relieve */}
    <circle cx="26" cy="26" r="6.5" fill="url(#cupoStamp)" stroke="#ffffff" strokeWidth="1.8" />
    <path d="M23.5 26L25.2 27.8L28.5 24.5" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Icono personalizado: Años Escolares / Períodos Lectivos (Configuración del Sistema)
 */
export const IconoAnioEscolar: React.FC<{ size?: number; color?: string }> = ({
  size = 28,
  color = '#FF8D00'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 2px 6px ${color}45)` }}
  >
    <defs>
      <linearGradient id="anioHeaderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
      <linearGradient id="anioBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#fff7ed" />
      </linearGradient>
      <linearGradient id="anioBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
    {/* Cuerpo del Calendario Escolar Anual */}
    <rect x="4" y="7" width="28" height="25" rx="5" fill="url(#anioBodyGrad)" stroke="#fdba74" strokeWidth="1.2" />
    {/* Cabecera del Calendario */}
    <path d="M4 12C4 9.23858 6.23858 7 9 7H27C29.7614 7 32 9.23858 32 12V14H4V12Z" fill="url(#anioHeaderGrad)" />
    {/* Anillas superiores de carpeta encuadernada */}
    <rect x="9" y="4" width="3" height="6" rx="1.5" fill="#ffffff" stroke="#ea580c" strokeWidth="0.8" />
    <rect x="24" y="4" width="3" height="6" rx="1.5" fill="#ffffff" stroke="#ea580c" strokeWidth="0.8" />
    {/* Cuadrícula de meses / días anuales */}
    <circle cx="9" cy="19" r="1.5" fill="#fb923c" />
    <circle cx="14" cy="19" r="1.5" fill="#fdba74" />
    <circle cx="19" cy="19" r="1.5" fill="#fdba74" />
    <circle cx="24" cy="19" r="1.5" fill="#fdba74" />
    <circle cx="9" cy="24" r="1.5" fill="#fdba74" />
    <circle cx="14" cy="24" r="1.5" fill="#fb923c" />
    <circle cx="19" cy="24" r="1.5" fill="#10b981" />
    <circle cx="24" cy="24" r="1.5" fill="#fdba74" />
    {/* Placa condecorativa de Año Lectivo (Cinta dorada inferior derecha) */}
    <g transform="translate(18, 20)">
      <circle cx="8" cy="8" r="5.5" fill="url(#anioBadgeGrad)" stroke="#ffffff" strokeWidth="1.2" />
      {/* Reloj de arena / Birrete mini */}
      <path d="M5.5 6.5L8 5L10.5 6.5L8 8L5.5 6.5Z" fill="#ffffff" />
      <path d="M8 8V10" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" />
      <circle cx="8" cy="10" r="0.6" fill="#ffffff" />
    </g>
  </svg>
);

/**
 * Icono personalizado: Lapsos y Momentos Académicos (Configuración del Sistema)
 */
export const IconoLapsoAcademico: React.FC<{ size?: number; color?: string }> = ({
  size = 28,
  color = '#00C3FF'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 2px 6px ${color}45)` }}
  >
    <defs>
      <linearGradient id="lapsoRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
      <linearGradient id="lapsoFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#f0f9ff" />
      </linearGradient>
      <linearGradient id="lapsoSegGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0ea5e9" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>
    </defs>
    {/* Esfera cronológica base */}
    <circle cx="18" cy="18" r="14" fill="url(#lapsoFaceGrad)" stroke="#bae6fd" strokeWidth="1.2" />
    {/* Arco del 1er Lapso (12h a 4h) */}
    <path d="M18 4C25.732 4 32 10.268 32 18" stroke="#0ea5e9" strokeWidth="2.8" strokeLinecap="round" />
    {/* Arco del 2do Lapso (4h a 8h) */}
    <path d="M32 18C32 25.732 25.732 32 18 32" stroke="#38bdf8" strokeWidth="2.8" strokeLinecap="round" />
    {/* Arco del 3er Lapso (8h a 12h) */}
    <path d="M18 32C10.268 32 4 25.732 4 18C4 10.268 10.268 4 18 4" stroke="#e0f2fe" strokeWidth="2.8" strokeLinecap="round" />
    {/* Indicadores de Momentos I, II, III */}
    <circle cx="25" cy="11" r="1.4" fill="#0284c7" />
    <circle cx="25" cy="25" r="1.4" fill="#0284c7" />
    <circle cx="11" cy="18" r="1.4" fill="#94a3b8" />
    {/* Manecillas dinámicas del Lapso Activo */}
    <path d="M18 18L18 9" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
    <path d="M18 18L24 18" stroke="#0ea5e9" strokeWidth="1.8" strokeLinecap="round" />
    {/* Pivote central iluminado */}
    <circle cx="18" cy="18" r="2.8" fill="url(#lapsoRingGrad)" stroke="#ffffff" strokeWidth="1" />
    {/* Mini destello de Fase */}
    <circle cx="18" cy="5" r="1.8" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
  </svg>
);

/**
 * Icono personalizado: Niveles Educativos / Modalidades (Configuración del Sistema)
 */
export const IconoNivelEducativo: React.FC<{ size?: number; color?: string }> = ({
  size = 28,
  color = '#10b981'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 2px 6px ${color}45)` }}
  >
    <defs>
      <linearGradient id="nivelCapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="nivelStepsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      <linearGradient id="nivelTassel" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
    {/* Base de 3 niveles escalonados (Inicial, Primaria, Media) */}
    {/* Nivel 1: Base ancha */}
    <rect x="4" y="28" width="28" height="4" rx="2" fill="#d1fae5" stroke="#a7f3d0" strokeWidth="0.8" />
    {/* Nivel 2: Escalón intermedio */}
    <rect x="8" y="23" width="20" height="4.5" rx="1.8" fill="#a7f3d0" stroke="#6ee7b7" strokeWidth="0.8" />
    {/* Nivel 3: Escalón superior */}
    <rect x="12" y="18" width="12" height="4.5" rx="1.5" fill="url(#nivelStepsGrad)" />
    {/* Birrete académico en la cúspide */}
    {/* Rombo superior del birrete */}
    <path d="M18 3L30 8.5L18 14L6 8.5L18 3Z" fill="url(#nivelCapGrad)" stroke="#ffffff" strokeWidth="1" />
    {/* Casquete del birrete */}
    <path d="M11 11V15.5C11 17.5 14 19 18 19C22 19 25 17.5 25 15.5V11L18 14L11 11Z" fill="#047857" opacity="0.9" />
    {/* Borla y cordón dorado */}
    <path d="M18 8.5L28 12V17" stroke="url(#nivelTassel)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="28" cy="17.5" r="1.2" fill="#f59e0b" />
  </svg>
);

/**
 * Icono personalizado: Windows Oficial App v1.1
 */
export const IconoWindowsApp: React.FC<{ size?: number; color?: string }> = ({
  size = 36,
  color = '#0284c7'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 4px 10px ${color}50)` }}
  >
    <defs>
      <linearGradient id="winTileGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
      <linearGradient id="winTileGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
    </defs>
    {/* 4 cuadrantes Windows con perspectiva moderna */}
    <rect x="4" y="4" width="12.5" height="12.5" rx="2" fill="url(#winTileGrad1)" />
    <rect x="19.5" y="4" width="12.5" height="12.5" rx="2" fill="url(#winTileGrad2)" />
    <rect x="4" y="19.5" width="12.5" height="12.5" rx="2" fill="url(#winTileGrad2)" />
    <rect x="19.5" y="19.5" width="12.5" height="12.5" rx="2" fill="url(#winTileGrad1)" />
    {/* Reflejo de brillo */}
    <path d="M4 6C4 4.89543 4.89543 4 6 4H14.5L4 14.5V6Z" fill="#ffffff" opacity="0.25" />
    <path d="M19.5 6C19.5 4.89543 20.3954 4 21.5 4H30L19.5 14.5V6Z" fill="#ffffff" opacity="0.25" />
  </svg>
);

/**
 * Icono personalizado: Android Oficial App v1.1
 */
export const IconoAndroidApp: React.FC<{ size?: number; color?: string }> = ({
  size = 36,
  color = '#10b981'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 4px 10px ${color}50)` }}
  >
    <defs>
      <linearGradient id="androidHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Antenas */}
    <path d="M11 6L8.5 2M25 6L27.5 2" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
    {/* Cabeza Android */}
    <path d="M6 17C6 10.3726 11.3726 5 18 5C24.6274 5 30 10.3726 30 17H6Z" fill="url(#androidHeadGrad)" />
    {/* Ojos */}
    <circle cx="12" cy="11.5" r="1.6" fill="#ffffff" />
    <circle cx="24" cy="11.5" r="1.6" fill="#ffffff" />
    {/* Cuerpo / Pantalla del teléfono */}
    <rect x="7" y="19" width="22" height="13" rx="3" fill="#0f172a" stroke="#10b981" strokeWidth="1.2" />
    <rect x="9.5" y="21" width="17" height="9" rx="1.5" fill="#10b981" opacity="0.25" />
    <circle cx="18" cy="25.5" r="2" fill="#10b981" />
  </svg>
);

/**
 * Icono personalizado: Linux Oficial App v1.1 (Tux & Terminal)
 */
export const IconoLinuxApp: React.FC<{ size?: number; color?: string }> = ({
  size = 36,
  color = '#f59e0b'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 4px 10px ${color}50)` }}
  >
    <defs>
      <linearGradient id="linuxBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
    </defs>
    {/* Cuerpo Tux / Pantalla Linux */}
    <ellipse cx="18" cy="19" rx="13" ry="14" fill="url(#linuxBodyGrad)" stroke="#475569" strokeWidth="1" />
    {/* Barriga Blanca */}
    <ellipse cx="18" cy="21" rx="8" ry="10" fill="#ffffff" />
    {/* Ojos */}
    <ellipse cx="14" cy="11" rx="2" ry="3" fill="#ffffff" />
    <ellipse cx="22" cy="11" rx="2" ry="3" fill="#ffffff" />
    <circle cx="14.5" cy="11.5" r="1.2" fill="#0f172a" />
    <circle cx="21.5" cy="11.5" r="1.2" fill="#0f172a" />
    {/* Pico Amarillo */}
    <path d="M14 14.5C14 14.5 16 17 18 17C20 17 22 14.5 22 14.5L18 13.5L14 14.5Z" fill="#f59e0b" stroke="#d97706" strokeWidth="0.8" />
    {/* Patitas doradas */}
    <ellipse cx="12" cy="32" rx="4" ry="2" fill="#f59e0b" />
    <ellipse cx="24" cy="32" rx="4" ry="2" fill="#f59e0b" />
    {/* Prompt Terminal pequeño */}
    <path d="M15 22L17.5 24L15 26" stroke="#0284c7" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="19" y1="26" x2="21" y2="26" stroke="#0284c7" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

/**
 * Icono personalizado: Apple iOS / macOS Safari PWA v1.1
 */
export const IconoAppleApp: React.FC<{ size?: number; color?: string }> = ({
  size = 36,
  color = '#6366f1'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 4px 10px ${color}50)` }}
  >
    <defs>
      <linearGradient id="appleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#818cf8" />
        <stop offset="100%" stopColor="#4338ca" />
      </linearGradient>
    </defs>
    {/* Silueta de manzana / dispositivo Apple */}
    <path
      d="M23.5 18.5C23.5 14.8 26.5 13 26.6 12.9C24.9 10.4 22.2 10 21.3 9.9C19.1 9.7 16.9 11.2 15.8 11.2C14.6 11.2 12.9 9.9 11.1 9.9C8.8 9.9 6.6 11.2 5.4 13.3C3 17.5 4.8 23.6 7.1 26.9C8.2 28.5 9.5 30.3 11.3 30.2C13 30.1 13.6 29.1 15.6 29.1C17.6 29.1 18.2 30.2 20 30.2C21.8 30.2 22.9 28.6 24 27C25.3 25.1 25.8 23.3 25.9 23.2C25.8 23.1 23.5 22.2 23.5 18.5Z"
      fill="url(#appleGrad)"
    />
    {/* Hoja superior de la manzana */}
    <path
      d="M19.7 7.5C20.7 6.3 21.4 4.6 21.2 3C19.8 3.1 18.2 3.9 17.2 5.1C16.3 6.1 15.6 7.9 15.8 9.5C17.4 9.6 18.9 8.7 19.7 7.5Z"
      fill="#38bdf8"
    />
    {/* Mini brújula de Safari / Web */}
    <circle cx="15.8" cy="20" r="4.5" fill="#ffffff" stroke="#4338ca" strokeWidth="0.8" />
    <path d="M14.5 21.5L17.5 18.5L16.2 20L14.5 21.5Z" fill="#ef4444" />
    <path d="M17.5 18.5L14.5 21.5L15.8 20L17.5 18.5Z" fill="#2563eb" />
  </svg>
);

/**
 * Icono personalizado: Unidad USB Portable 1-Clic
 */
export const IconoUsbPortable: React.FC<{ size?: number; color?: string }> = ({
  size = 32,
  color = '#0284c7'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 3px 8px ${color}45)` }}
  >
    <defs>
      <linearGradient id="usbBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>
    </defs>
    {/* Conector Metálico */}
    <rect x="13" y="2" width="10" height="9" rx="1" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
    <rect x="15" y="4" width="2" height="3" fill="#334155" />
    <rect x="19" y="4" width="2" height="3" fill="#334155" />
    {/* Cuerpo Flash Drive */}
    <rect x="10" y="10" width="16" height="22" rx="4" fill="url(#usbBodyGrad)" stroke="#ffffff" strokeWidth="1" />
    {/* LED de actividad */}
    <circle cx="18" cy="15" r="1.8" fill="#4ade80" />
    {/* Etiqueta 1.1 */}
    <rect x="13" y="20" width="10" height="7" rx="2" fill="#ffffff" />
    <text x="18" y="25" fill="#0369a1" fontSize="5" fontWeight="bold" textAnchor="middle">v1.1</text>
  </svg>
);

/**
 * Icono personalizado: Paquete Instalador APK
 */
export const IconoApkPackage: React.FC<{ size?: number; color?: string }> = ({
  size = 32,
  color = '#10b981'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 3px 8px ${color}45)` }}
  >
    <defs>
      <linearGradient id="apkBoxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    {/* Caja / Paquete */}
    <path d="M18 3L31 10V26L18 33L5 26V10L18 3Z" fill="url(#apkBoxGrad)" stroke="#ffffff" strokeWidth="1.2" />
    <path d="M5 10L18 17L31 10" stroke="#ffffff" strokeWidth="1.2" />
    <path d="M18 17V33" stroke="#ffffff" strokeWidth="1.2" />
    {/* Flecha de descarga */}
    <circle cx="18" cy="17" r="7" fill="#ffffff" />
    <path d="M18 13V20M18 20L15.5 17.5M18 20L20.5 17.5" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Icono personalizado: Escáner de Código QR
 */
export const IconoQrEscaner: React.FC<{ size?: number; color?: string }> = ({
  size = 32,
  color = '#8b5cf6'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 3px 8px ${color}45)` }}
  >
    {/* Esquinas de enfoque de cámara */}
    <path d="M4 11V6C4 4.89543 4.89543 4 6 4H11" stroke="#8b5cf6" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M25 4H30C31.1046 4 32 4.89543 32 6V11" stroke="#8b5cf6" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M32 25V30C32 31.1046 31.1046 32 30 32H25" stroke="#8b5cf6" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M11 32H6C4.89543 32 4 31.1046 4 30V25" stroke="#8b5cf6" strokeWidth="2.2" strokeLinecap="round" />
    {/* Cuadros QR */}
    <rect x="8" y="8" width="7" height="7" rx="1.5" fill="#0f172a" />
    <rect x="10" y="10" width="3" height="3" fill="#ffffff" />
    <rect x="21" y="8" width="7" height="7" rx="1.5" fill="#0f172a" />
    <rect x="23" y="10" width="3" height="3" fill="#ffffff" />
    <rect x="8" y="21" width="7" height="7" rx="1.5" fill="#0f172a" />
    <rect x="10" y="23" width="3" height="3" fill="#ffffff" />
    {/* Puntos QR centrales */}
    <rect x="18" y="18" width="4" height="4" rx="1" fill="#8b5cf6" />
    <rect x="24" y="22" width="3" height="3" rx="0.8" fill="#0f172a" />
    {/* Láser de escaneo rojo/violeta */}
    <line x1="6" y1="18" x2="30" y2="18" stroke="#ec4899" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

/**
 * Icono personalizado: Novedades de la Versión v1.1
 */
export const IconoNovedadesV11: React.FC<{ size?: number; color?: string }> = ({
  size = 32,
  color = '#f59e0b'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 3px 8px ${color}50)` }}
  >
    <defs>
      <linearGradient id="novGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
    {/* Estrella de Novedades */}
    <path
      d="M18 2L22.2 12.5L33 13.8L25 21.2L27.2 32L18 26.5L8.8 32L11 21.2L3 13.8L13.8 12.5L18 2Z"
      fill="url(#novGrad)"
      stroke="#ffffff"
      strokeWidth="1.2"
    />
    <circle cx="18" cy="17" r="4.5" fill="#ffffff" />
    <text x="18" y="19" fill="#b45309" fontSize="6.5" fontWeight="900" textAnchor="middle">★</text>
  </svg>
);

/**
 * Icono personalizado: Cargos Institucionales / Puestos de Trabajo
 */
export const IconoCargosInstitucionales: React.FC<{ size?: number; color?: string }> = ({
  size = 46,
  color = '#2563eb'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 4px 10px ${color}40)` }}
  >
    <defs>
      <linearGradient id="cargoBagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="60%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="cargoBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#f8fafc" />
      </linearGradient>
      <linearGradient id="cargoGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
    </defs>

    {/* Maletín Ejecutivo de Fondo */}
    <rect x="7" y="16" width="34" height="25" rx="6" fill="url(#cargoBagGrad)" />
    
    {/* Agarradera Superior del Maletín */}
    <path 
      d="M17 16V11C17 9.34315 18.3431 8 20 8H28C29.6569 8 31 9.34315 31 11V16" 
      stroke="url(#cargoGoldGrad)" 
      strokeWidth="3.2" 
      strokeLinecap="round" 
    />

    {/* Broche Metálico Central */}
    <rect x="21" y="14" width="6" height="5" rx="1.5" fill="url(#cargoGoldGrad)" stroke="#ffffff" strokeWidth="0.8" />

    {/* Solapa del Maletín */}
    <path d="M7 16H41V23L27 27C25 27.5 23 27.5 21 27L7 23V16Z" fill="#1e40af" opacity="0.6" />

    {/* Tarjeta de Identificación / Fotocheck Flotante */}
    <g transform="translate(14, 20)">
      {/* Cinta o lanyard */}
      <path d="M10 -8L10 -1" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="-1" r="1.8" fill="url(#cargoGoldGrad)" />

      {/* Tarjeta de Identificación */}
      <rect x="0" y="0" width="20" height="23" rx="3.5" fill="url(#cargoBadgeGrad)" stroke="#cbd5e1" strokeWidth="1" />
      
      {/* Clip de tarjeta */}
      <rect x="7" y="1.5" width="6" height="1.8" rx="0.9" fill="#94a3b8" />

      {/* Foto del empleado en la credencial */}
      <rect x="3" y="5" width="6.5" height="7" rx="1.5" fill="#2563eb" />
      <circle cx="6.2" cy="7.8" r="1.6" fill="#ffffff" />
      <path d="M4 11.5C4 10 5 9.5 6.2 9.5C7.4 9.5 8.4 10 8.4 11.5" fill="#ffffff" />

      {/* Líneas de datos en la tarjeta */}
      <rect x="11" y="6" width="6" height="1.5" rx="0.75" fill="#2563eb" />
      <rect x="11" y="9" width="4.5" height="1.2" rx="0.6" fill="#94a3b8" />
      <rect x="3" y="14" width="14" height="1.2" rx="0.6" fill="#64748b" />
      <rect x="3" y="16.5" width="10" height="1.2" rx="0.6" fill="#94a3b8" />

      {/* Chip dorado de seguridad */}
      <rect x="3" y="19" width="3.5" height="2.5" rx="0.5" fill="url(#cargoGoldGrad)" />
    </g>
  </svg>
);

/**
 * Icono personalizado: Cadena Supervisoria / Organigrama Jerárquico
 */
export const IconoCadenaSupervisoria: React.FC<{ size?: number; color?: string }> = ({
  size = 46,
  color = '#7c3aed'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 4px 10px ${color}40)` }}
  >
    <defs>
      <linearGradient id="orgRootGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <linearGradient id="orgSubGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="orgSubGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      <linearGradient id="orgCrownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
    </defs>

    {/* Líneas Conectoras del Organigrama */}
    <path 
      d="M24 16V25M12 25H36M12 25V33M36 25V33" 
      stroke="#cbd5e1" 
      strokeWidth="2.8" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    <path 
      d="M24 16V25M12 25H36M12 25V33M36 25V33" 
      stroke="#94a3b8" 
      strokeWidth="1.6" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />

    {/* Nodo Central Raíz: Dirección / Máxima Autoridad */}
    <rect x="15" y="6" width="18" height="11" rx="3.5" fill="url(#orgRootGrad)" stroke="#ffffff" strokeWidth="1.2" />
    <circle cx="24" cy="11.5" r="2.2" fill="#ffffff" />
    {/* Corona Dorada sobre el nodo de Dirección */}
    <path 
      d="M20 6L21.5 2.5L24 4.5L26.5 2.5L28 6H20Z" 
      fill="url(#orgCrownGrad)" 
      stroke="#b45309" 
      strokeWidth="0.5" 
    />

    {/* Nodo Subordinado Izquierdo: Coordinación / Subdirección */}
    <rect x="4" y="32" width="16" height="10" rx="3" fill="url(#orgSubGrad1)" stroke="#ffffff" strokeWidth="1.2" />
    <circle cx="12" cy="36" r="1.8" fill="#ffffff" />
    <path d="M8.5 40C8.5 38.5 10 38 12 38C14 38 15.5 38.5 15.5 40" fill="#ffffff" />

    {/* Nodo Subordinado Derecho: Docencia / Colectivos */}
    <rect x="28" y="32" width="16" height="10" rx="3" fill="url(#orgSubGrad2)" stroke="#ffffff" strokeWidth="1.2" />
    <circle cx="36" cy="36" r="1.8" fill="#ffffff" />
    <path d="M32.5 40C32.5 38.5 34 38 36 38C38 38 39.5 38.5 39.5 40" fill="#ffffff" />

    {/* Conector Central Dorado de Sincronización */}
    <circle cx="24" cy="25" r="2.5" fill="url(#orgCrownGrad)" stroke="#ffffff" strokeWidth="0.8" />
  </svg>
);

/**
 * Icono personalizado: Gestión de Colectivos Pedagógicos y Brigadas
 */
export const IconoGestionColectivos: React.FC<{ size?: number; color?: string }> = ({
  size = 46,
  color = '#059669'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 4px 10px ${color}40)` }}
  >
    <defs>
      <linearGradient id="colShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#ecfdf5" />
      </linearGradient>
      <linearGradient id="colPrimaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="colSecondaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>
      <linearGradient id="colGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
    </defs>

    {/* Escudo Institucional de Fondo */}
    <path 
      d="M24 4C35 4 41 8 41 18C41 31 31 40 24 44C17 40 7 31 7 18C7 8 13 4 24 4Z" 
      fill="url(#colShieldGrad)" 
      stroke="#a7f3d0" 
      strokeWidth="2.2" 
    />

    {/* Laurel Dorado de Logro Colectivo */}
    <path 
      d="M13 28C11 22 13 14 17 10M35 28C37 22 35 14 31 10" 
      stroke="url(#colGoldGrad)" 
      strokeWidth="2" 
      strokeLinecap="round" 
    />

    {/* Figura Izquierda (Docente / Coordinador) */}
    <g transform="translate(13, 16)">
      <circle cx="4" cy="4" r="3.2" fill="url(#colSecondaryGrad)" stroke="#ffffff" strokeWidth="0.8" />
      <path d="M-1 15C-1 10.5 1.5 9 4 9C6.5 9 9 10.5 9 15" fill="url(#colSecondaryGrad)" stroke="#ffffff" strokeWidth="0.8" />
    </g>

    {/* Figura Derecha (Estudiante / Comunidad) */}
    <g transform="translate(27, 16)">
      <circle cx="4" cy="4" r="3.2" fill="url(#colSecondaryGrad)" stroke="#ffffff" strokeWidth="0.8" />
      <path d="M-1 15C-1 10.5 1.5 9 4 9C6.5 9 9 10.5 9 15" fill="url(#colSecondaryGrad)" stroke="#ffffff" strokeWidth="0.8" />
    </g>

    {/* Figura Central Principal (Líder / Vocero del Colectivo) */}
    <g transform="translate(19, 13)">
      <circle cx="5" cy="5" r="4.2" fill="url(#colPrimaryGrad)" stroke="#ffffff" strokeWidth="1.2" />
      <path d="M-1 19C-1 14 2 12 5 12C8 12 11 14 11 19" fill="url(#colPrimaryGrad)" stroke="#ffffff" strokeWidth="1.2" />
      {/* Estrella Dorada de Vocero */}
      <polygon points="5,1 6,3.5 8.5,3.8 6.5,5.5 7.2,8 5,6.5 2.8,8 3.5,5.5 1.5,3.8 4,3.5" fill="url(#colGoldGrad)" />
    </g>

    {/* Insignia Inferior de Cohesión */}
    <rect x="18" y="35" width="12" height="4" rx="2" fill="url(#colPrimaryGrad)" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="24" cy="37" r="1.2" fill="#ffffff" />
  </svg>
);

/**
 * Icono personalizado: Estructura Empresa / PDVSA Filiales y Parámetros
 */
export const IconoEstructuraEmpresa: React.FC<{ size?: number; color?: string }> = ({
  size = 46,
  color = '#e11d48'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 4px 10px ${color}40)` }}
  >
    <defs>
      <linearGradient id="empBuilding1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f43f5e" />
        <stop offset="100%" stopColor="#be123c" />
      </linearGradient>
      <linearGradient id="empBuilding2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="empWindowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#bae6fd" />
        <stop offset="100%" stopColor="#38bdf8" />
      </linearGradient>
      <linearGradient id="empOilDrop" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>

    {/* Torre Corporativa Secundaria (Izquierda) */}
    <rect x="6" y="16" width="13" height="26" rx="2.5" fill="url(#empBuilding2)" stroke="#ffffff" strokeWidth="0.8" />
    {/* Ventanales Torre Secundaria */}
    <rect x="9" y="20" width="3" height="2.5" rx="0.5" fill="url(#empWindowGrad)" />
    <rect x="13.5" y="20" width="3" height="2.5" rx="0.5" fill="url(#empWindowGrad)" />
    <rect x="9" y="25" width="3" height="2.5" rx="0.5" fill="url(#empWindowGrad)" />
    <rect x="13.5" y="25" width="3" height="2.5" rx="0.5" fill="url(#empWindowGrad)" />
    <rect x="9" y="30" width="3" height="2.5" rx="0.5" fill="url(#empWindowGrad)" />
    <rect x="13.5" y="30" width="3" height="2.5" rx="0.5" fill="url(#empWindowGrad)" />

    {/* Torre Principal Institucional (Centro) */}
    <rect x="18" y="7" width="18" height="35" rx="3.5" fill="url(#empBuilding1)" stroke="#ffffff" strokeWidth="1.2" />
    
    {/* Antena / Faro Tecnológico Superior */}
    <line x1="27" y1="2" x2="27" y2="7" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="27" cy="2" r="1.5" fill="#fef08a" />

    {/* Ventanales de la Torre Principal */}
    <rect x="21" y="12" width="4.5" height="3" rx="0.8" fill="#ffffff" opacity="0.9" />
    <rect x="28.5" y="12" width="4.5" height="3" rx="0.8" fill="#ffffff" opacity="0.9" />
    <rect x="21" y="17.5" width="4.5" height="3" rx="0.8" fill="#ffffff" opacity="0.9" />
    <rect x="28.5" y="17.5" width="4.5" height="3" rx="0.8" fill="#ffffff" opacity="0.9" />
    <rect x="21" y="23" width="4.5" height="3" rx="0.8" fill="#ffffff" opacity="0.9" />
    <rect x="28.5" y="23" width="4.5" height="3" rx="0.8" fill="#ffffff" opacity="0.9" />

    {/* Puerta Principal de Cristal */}
    <rect x="24" y="34" width="6" height="8" rx="1" fill="#ffffff" />
    <line x1="27" y1="34" x2="27" y2="42" stroke="#e11d48" strokeWidth="0.8" />

    {/* Gota de Petróleo / Sello Corporativo PDVSA */}
    <g transform="translate(30, 24)">
      <circle cx="8" cy="8" r="8" fill="#ffffff" stroke="#e11d48" strokeWidth="1.2" />
      <path 
        d="M8 2C8 2 4 7 4 9.5C4 11.7 5.8 13.5 8 13.5C10.2 13.5 12 11.7 12 9.5C12 7 8 2 8 2Z" 
        fill="url(#empOilDrop)" 
      />
      <circle cx="6.8" cy="8.5" r="1" fill="#ffffff" opacity="0.6" />
    </g>

    {/* Plataforma Base */}
    <rect x="4" y="42" width="40" height="3" rx="1.5" fill="#64748b" />
  </svg>
);

/**
 * Icono personalizado: Registrar / Crear Cargo
 */
export const IconoCrearCargo: React.FC<{ size?: number; color?: string }> = ({
  size = 32,
  color = '#2563eb'
}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: `drop-shadow(0 2px 6px ${color}40)` }}>
    <defs>
      <linearGradient id="crearCargoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="crearPlusGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
    </defs>
    <rect x="4" y="6" width="24" height="22" rx="5" fill="url(#crearCargoGrad)" stroke="#ffffff" strokeWidth="1" />
    <path d="M11 6V3.5C11 2.67 11.67 2 12.5 2H19.5C20.33 2 21 2.67 21 3.5V6" stroke="url(#crearPlusGold)" strokeWidth="2" strokeLinecap="round" />
    <circle cx="16" cy="16" r="6.5" fill="#ffffff" />
    <path d="M16 12.5V19.5M12.5 16H19.5" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

/**
 * Icono personalizado: Lista / Catálogo de Cargos
 */
export const IconoListaCargos: React.FC<{ size?: number; color?: string }> = ({
  size = 32,
  color = '#2563eb'
}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: `drop-shadow(0 2px 6px ${color}40)` }}>
    <defs>
      <linearGradient id="boardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#f1f5f9" />
      </linearGradient>
      <linearGradient id="boardClip" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    <rect x="5" y="4" width="22" height="26" rx="4" fill="url(#boardGrad)" stroke="#93c5fd" strokeWidth="1.5" />
    <rect x="10" y="2" width="12" height="4.5" rx="1.5" fill="url(#boardClip)" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="16" cy="4.2" r="1" fill="#ffffff" />
    <path d="M9 11L11 13L14 10" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="16" y1="11.5" x2="23" y2="11.5" stroke="#334155" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M9 17L11 19L14 16" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="16" y1="17.5" x2="23" y2="17.5" stroke="#334155" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M9 23L11 25L14 22" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="16" y1="23.5" x2="23" y2="23.5" stroke="#334155" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/**
 * Icono personalizado: Asignar Personal a Cargos
 */
export const IconoAsignarPersonal: React.FC<{ size?: number; color?: string }> = ({
  size = 32,
  color = '#2563eb'
}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: `drop-shadow(0 2px 6px ${color}40)` }}>
    <defs>
      <linearGradient id="asigAvatar" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="100%" stopColor="#2563eb" />
      </linearGradient>
      <linearGradient id="asigBadge" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="10" r="4.5" fill="url(#asigAvatar)" stroke="#ffffff" strokeWidth="1" />
    <path d="M4 23C4 18.5 7.5 17 12 17C16.5 17 20 18.5 20 23" fill="url(#asigAvatar)" stroke="#ffffff" strokeWidth="1" />
    {/* Insignia / Checkmark de asignación oficial */}
    <circle cx="22" cy="21" r="6" fill="url(#asigBadge)" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M19.5 21L21.2 22.8L24.8 19.2" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Icono personalizado: Constructor de Jerarquías
 */
export const IconoConstructorJerarquia: React.FC<{ size?: number; color?: string }> = ({
  size = 32,
  color = '#7c3aed'
}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: `drop-shadow(0 2px 6px ${color}40)` }}>
    <defs>
      <linearGradient id="hierPillar" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="100%" stopColor="#7c3aed" />
      </linearGradient>
      <linearGradient id="hierGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#eab308" />
      </linearGradient>
    </defs>
    <rect x="4" y="5" width="24" height="6.5" rx="2.5" fill="url(#hierPillar)" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="9" cy="8.2" r="1.5" fill="url(#hierGold)" />
    <line x1="13" y1="8.2" x2="24" y2="8.2" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    
    <rect x="8" y="14" width="20" height="6.5" rx="2.5" fill="url(#hierPillar)" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="13" cy="17.2" r="1.5" fill="url(#hierGold)" />
    <line x1="17" y1="17.2" x2="24" y2="17.2" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />

    <rect x="12" y="23" width="16" height="6.5" rx="2.5" fill="url(#hierPillar)" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="17" cy="26.2" r="1.5" fill="url(#hierGold)" />
    <line x1="21" y1="26.2" x2="24" y2="26.2" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    
    <path d="M4 11.5V26.5H8" stroke="#a855f7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Icono personalizado: Organigrama Visual en Árbol
 */
export const IconoArbolOrganigrama: React.FC<{ size?: number; color?: string }> = ({
  size = 32,
  color = '#7c3aed'
}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: `drop-shadow(0 2px 6px ${color}40)` }}>
    <defs>
      <linearGradient id="nodeTop" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#6d28d9" />
      </linearGradient>
      <linearGradient id="nodeChild" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
    </defs>
    <path d="M16 11V18M7 18H25M7 18V22M25 18V22" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="10" y="4" width="12" height="7.5" rx="2.5" fill="url(#nodeTop)" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="16" cy="7.7" r="1.5" fill="#fef08a" />
    <rect x="2" y="22" width="10" height="7" rx="2" fill="url(#nodeChild)" stroke="#ffffff" strokeWidth="0.8" />
    <rect x="20" y="22" width="10" height="7" rx="2" fill="url(#nodeChild)" stroke="#ffffff" strokeWidth="0.8" />
  </svg>
);

/**
 * Icono personalizado: Planificación Anual de Actividades Pedagógicas
 */
export const IconoPlanificacionActividades: React.FC<{ size?: number; color?: string }> = ({
  size = 32,
  color = '#059669'
}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: `drop-shadow(0 2px 6px ${color}40)` }}>
    <defs>
      <linearGradient id="planGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      <linearGradient id="planStar" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
    </defs>
    <rect x="4" y="5" width="24" height="24" rx="4" fill="#ffffff" stroke="#a7f3d0" strokeWidth="1.2" />
    <path d="M4 5C4 3.9 4.9 3 6 3H26C27.1 3 28 3.9 28 5V9H4V5Z" fill="url(#planGrad)" />
    <line x1="9" y1="2" x2="9" y2="5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="23" y1="2" x2="23" y2="5" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
    <polygon points="16,13 17.5,16.5 21,17 18.5,19.5 19.2,23 16,21 12.8,23 13.5,19.5 11,17 14.5,16.5" fill="url(#planStar)" />
  </svg>
);

/**
 * Icono personalizado: Reportes de Gestión
 */
export const IconoReporteGestion: React.FC<{ size?: number; color?: string }> = ({
  size = 32,
  color = '#059669'
}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: `drop-shadow(0 2px 6px ${color}40)` }}>
    <defs>
      <linearGradient id="repGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#f8fafc" />
      </linearGradient>
    </defs>
    <path d="M6 5C6 3.9 6.9 3 8 3H18L26 11V27C26 28.1 25.1 29 24 29H8C6.9 29 6 28.1 6 27V5Z" fill="url(#repGrad)" stroke="#6ee7b7" strokeWidth="1.5" />
    <path d="M18 3V11H26" stroke="#059669" strokeWidth="1.5" fill="#a7f3d0" />
    <rect x="10" y="21" width="2.5" height="5" rx="0.5" fill="#059669" />
    <rect x="14.5" y="17" width="2.5" height="9" rx="0.5" fill="#10b981" />
    <rect x="19" y="14" width="2.5" height="12" rx="0.5" fill="#34d399" />
    <polyline points="9,18 14.5,14 19,11" stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Icono personalizado: Diccionarios y Parámetros Corporativos PDVSA
 */
export const IconoParametroCorporativo: React.FC<{ size?: number; color?: string }> = ({
  size = 32,
  color = '#e11d48'
}) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: `drop-shadow(0 2px 6px ${color}40)` }}>
    <defs>
      <linearGradient id="paramGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f43f5e" />
        <stop offset="100%" stopColor="#be123c" />
      </linearGradient>
    </defs>
    <rect x="4" y="5" width="24" height="22" rx="4" fill="#ffffff" stroke="#fecdd3" strokeWidth="1.2" />
    <rect x="4" y="5" width="24" height="6" rx="4" fill="url(#paramGrad)" />
    <circle cx="8.5" cy="8" r="1.2" fill="#ffffff" />
    <circle cx="12.5" cy="8" r="1.2" fill="#ffffff" />
    <circle cx="16.5" cy="8" r="1.2" fill="#ffffff" />
    <line x1="8" y1="16" x2="24" y2="16" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="14" cy="16" r="2.5" fill="#e11d48" stroke="#ffffff" strokeWidth="1" />
    <line x1="8" y1="22" x2="24" y2="22" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="20" cy="22" r="2.5" fill="#e11d48" stroke="#ffffff" strokeWidth="1" />
  </svg>
);

/**
 * Icono personalizado: Grados y Salones (Ambientes, Grados, Secciones y Aulas)
 * Modelo 3D: Pizarra interactiva isométrica con cuadrícula de salones, pupitre escolar en perspectiva
 * y portal arquitectónico de ambiente educativo con indicador de capacidad.
 */
export const IconoGradosSalones: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 38,
  color = '#0284c7',
  className
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    style={{ filter: `drop-shadow(0 4px 10px ${color}50)` }}
  >
    <defs>
      <linearGradient id="gs3dBoard" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>
      <linearGradient id="gs3dDesk" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="60%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#ca8a04" />
      </linearGradient>
      <linearGradient id="gs3dPortal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
      <linearGradient id="gs3dGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="100%" stopColor="#f59e0b" />
      </linearGradient>
    </defs>

    {/* Sombra base */}
    <ellipse cx="24" cy="43.5" rx="18" ry="3" fill="#0f172a" opacity="0.22" />

    {/* Portal Arquitectónico / Marco del Aula 3D en Segundo Plano */}
    <path d="M8 42V14C8 9.5 11.5 6 16 6H32C36.5 6 40 9.5 40 14V42" stroke="url(#gs3dPortal)" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    <path d="M12 42V16C12 13 14 10 17 10H31C34 10 36 13 36 16V42" stroke="#bae6fd" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />

    {/* Pizarra Isométrica 3D Frontal */}
    <rect x="9" y="11" width="30" height="20" rx="3.5" fill="url(#gs3dBoard)" stroke="#ffffff" strokeWidth="1.2" />
    <rect x="11.5" y="13.5" width="25" height="15" rx="2" fill="#0f172a" opacity="0.35" />

    {/* Cuadrícula de Secciones y Grados en la Pizarra */}
    <line x1="14" y1="18.5" x2="34" y2="18.5" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
    <line x1="14" y1="23.5" x2="34" y2="23.5" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
    <line x1="24" y1="14" x2="24" y2="28" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round" opacity="0.8" />

    {/* Celdas / Badges de Salones (A, B, 1°, 2°) */}
    <circle cx="18" cy="16" r="1.8" fill="#fde047" />
    <circle cx="30" cy="16" r="1.8" fill="#34d399" />
    <circle cx="18" cy="21" r="1.8" fill="#38bdf8" />
    <circle cx="30" cy="21" r="1.8" fill="#f43f5e" />

    {/* ── PUPITRE ESCOLAR EN PERSPECTIVA 3D FRONTAL ── */}
    {/* Patas metálicas */}
    <line x1="14" y1="36" x2="11" y2="43" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
    <line x1="34" y1="36" x2="37" y2="43" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
    <line x1="24" y1="36" x2="24" y2="43" stroke="#334155" strokeWidth="2" strokeLinecap="round" />

    {/* Tablero del pupitre con bisel */}
    <polygon points="12,30 36,30 41,35 7,35" fill="url(#gs3dDesk)" stroke="#ffffff" strokeWidth="0.8" />
    <polygon points="7,35 41,35 40,37 8,37" fill="#854d0e" />

    {/* Cuaderno escolar abierto sobre el pupitre */}
    <polygon points="20,31 28,31 30,34 18,34" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
    <line x1="24" y1="31" x2="24" y2="34" stroke="#0284c7" strokeWidth="0.8" />

    {/* Lápiz dorado */}
    <line x1="31" y1="32" x2="34" y2="33.5" stroke="url(#gs3dGold)" strokeWidth="1.5" strokeLinecap="round" />

    {/* Insignia Checkmark de Salón Activo */}
    <circle cx="38" cy="12" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.2" />
    <path d="M35.8 12L37.2 13.5L40.2 10.5" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ═════════════════════════════════════════════════════════════════════════
   ICONOS 3D DE LOS 9 MÓDULOS PRINCIPALES DEL SISTEMA (CAJAS DE HERRAMIENTAS)
   Diseñados con modelado isométrico 3D, iluminación volumétrica y biseles
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * 1. MÓDULO PRINCIPAL: DIRECCIÓN Y SISTEMA
 * Modelo 3D: Palacio de Gobierno Institucional en perspectiva isométrica con frontón clásico,
 * columnas cilíndricas doradas, podio escalonado de mármol y gran engranaje tecnológico posterior.
 */
export const IconoModuloDireccion: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 42,
  color = '#FF8D00',
  className
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ filter: `drop-shadow(0 6px 14px ${color}55)` }}>
    <defs>
      <linearGradient id="dir3dGear" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="45%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id="dir3dRoofTop" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fdba74" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
      <linearGradient id="dir3dRoofFront" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#c2410c" />
      </linearGradient>
      <linearGradient id="dir3dPediment" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffedd5" />
        <stop offset="100%" stopColor="#fed7aa" />
      </linearGradient>
      <linearGradient id="dir3dPillar" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="35%" stopColor="#fed7aa" />
        <stop offset="70%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#c2410c" />
      </linearGradient>
      <linearGradient id="dir3dBase" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="50%" stopColor="#ea580c" />
        <stop offset="100%" stopColor="#9a3412" />
      </linearGradient>
      <linearGradient id="dir3dGoldMedal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="60%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#a16207" />
      </linearGradient>
    </defs>

    {/* Sombra de oclusión ambiental en el suelo */}
    <ellipse cx="24" cy="44.5" rx="20" ry="3" fill="#0f172a" opacity="0.22" />

    {/* Gran Engranaje Tecnológico 3D Posterior */}
    <g transform="translate(24, 21)">
      <circle cx="0" cy="0" r="17" fill="url(#dir3dGear)" stroke="#78350f" strokeWidth="0.8" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
        <rect
          key={deg}
          x="-3"
          y="-20"
          width="6"
          height="4.5"
          rx="1"
          fill="#d97706"
          stroke="#b45309"
          strokeWidth="0.5"
          transform={`rotate(${deg})`}
        />
      ))}
      <circle cx="0" cy="0" r="8" fill="#ffffff" opacity="0.9" />
      <circle cx="0" cy="0" r="4.5" fill="#ea580c" />
    </g>

    {/* Techo a Dos Aguas 3D (Cara Superior Izquierda Iluminada) */}
    <polygon points="24,5 5,16 24,14" fill="url(#dir3dRoofTop)" />
    {/* Cara Superior Derecha en Sombra */}
    <polygon points="24,5 24,14 43,16" fill="url(#dir3dRoofFront)" />

    {/* Frontispicio Clásico Triangular 3D Frontal */}
    <polygon points="24,8 7,17 41,17" fill="url(#dir3dPediment)" stroke="#ffffff" strokeWidth="1" />
    
    {/* Medallón / Sol Dorado Esculpido en el Frontón */}
    <circle cx="24" cy="14" r="2.8" fill="url(#dir3dGoldMedal)" stroke="#ffffff" strokeWidth="0.8" />
    <polygon points="24,12.2 24.6,13.5 26,13.7 24.9,14.7 25.2,16 24,15.3 22.8,16 23.1,14.7 22,13.7 23.4,13.5" fill="#ffffff" />

    {/* Arquitrabe / Viga 3D con Moldura */}
    <rect x="6" y="17" width="36" height="3.5" rx="1" fill="url(#dir3dBase)" stroke="#ffffff" strokeWidth="0.8" />
    <line x1="7" y1="18" x2="41" y2="18" stroke="#fde047" strokeWidth="0.8" opacity="0.8" />

    {/* 4 Columnas Cilíndricas 3D en Perspectiva */}
    <g>
      {/* Columna 1 */}
      <rect x="8.5" y="20.5" width="4" height="18" rx="1.5" fill="url(#dir3dPillar)" stroke="#9a3412" strokeWidth="0.6" />
      <rect x="7.5" y="20" width="6" height="1.8" rx="0.8" fill="url(#dir3dGoldMedal)" />
      <rect x="7.5" y="37.5" width="6" height="1.8" rx="0.8" fill="url(#dir3dGoldMedal)" />

      {/* Columna 2 */}
      <rect x="16.5" y="20.5" width="4" height="18" rx="1.5" fill="url(#dir3dPillar)" stroke="#9a3412" strokeWidth="0.6" />
      <rect x="15.5" y="20" width="6" height="1.8" rx="0.8" fill="url(#dir3dGoldMedal)" />
      <rect x="15.5" y="37.5" width="6" height="1.8" rx="0.8" fill="url(#dir3dGoldMedal)" />

      {/* Columna 3 */}
      <rect x="27.5" y="20.5" width="4" height="18" rx="1.5" fill="url(#dir3dPillar)" stroke="#9a3412" strokeWidth="0.6" />
      <rect x="26.5" y="20" width="6" height="1.8" rx="0.8" fill="url(#dir3dGoldMedal)" />
      <rect x="26.5" y="37.5" width="6" height="1.8" rx="0.8" fill="url(#dir3dGoldMedal)" />

      {/* Columna 4 */}
      <rect x="35.5" y="20.5" width="4" height="18" rx="1.5" fill="url(#dir3dPillar)" stroke="#9a3412" strokeWidth="0.6" />
      <rect x="34.5" y="20" width="6" height="1.8" rx="0.8" fill="url(#dir3dGoldMedal)" />
      <rect x="34.5" y="37.5" width="6" height="1.8" rx="0.8" fill="url(#dir3dGoldMedal)" />
    </g>

    {/* Fondo Interior del Pórtico (Sombra de Profundidad) */}
    <rect x="10" y="21" width="28" height="17" fill="#431407" opacity="0.35" />

    {/* Podio Escalonado 3D de Mármol */}
    <polygon points="5,39 43,39 45,42 3,42" fill="url(#dir3dBase)" stroke="#ffffff" strokeWidth="0.8" />
    <polygon points="3,42 45,42 46,45 2,45" fill="#7c2d12" stroke="#ffffff" strokeWidth="0.8" />
    <line x1="3" y1="42.5" x2="45" y2="42.5" stroke="#fde047" strokeWidth="1" opacity="0.9" />
  </svg>
);

/**
 * 2. MÓDULO PRINCIPAL: ORGANIZACIÓN ESCOLAR
 * Modelo 3D: Nodos cúbicos isométricos flotantes conectados por conductos tubulares,
 * coronados por el nodo maestro rubí con diadema dorada y sello corporativo.
 */
export const IconoModuloOrganizacion: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 42,
  color = '#e11d48',
  className
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ filter: `drop-shadow(0 6px 14px ${color}55)` }}>
    <defs>
      <linearGradient id="org3dTop" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fb7185" />
        <stop offset="100%" stopColor="#f43f5e" />
      </linearGradient>
      <linearGradient id="org3dLeft" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e11d48" />
        <stop offset="100%" stopColor="#be123c" />
      </linearGradient>
      <linearGradient id="org3dRight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9f1239" />
        <stop offset="100%" stopColor="#881337" />
      </linearGradient>
      <linearGradient id="org3dGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#a16207" />
      </linearGradient>
      <linearGradient id="org3dPipe" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#cbd5e1" />
        <stop offset="50%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#94a3b8" />
      </linearGradient>
    </defs>

    {/* Sombras isométricas proyectadas en el piso */}
    <ellipse cx="24" cy="44" rx="18" ry="3" fill="#0f172a" opacity="0.25" />
    <ellipse cx="10" cy="40" rx="6" ry="2" fill="#0f172a" opacity="0.2" />
    <ellipse cx="38" cy="40" rx="6" ry="2" fill="#0f172a" opacity="0.2" />

    {/* Tuberías / Conectores Isométricos 3D */}
    <path d="M24 18V28M10 28H38M10 28V32M24 28V32M38 28V32" stroke="url(#org3dPipe)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 18V28M10 28H38M10 28V32M24 28V32M38 28V32" stroke="#e11d48" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

    {/* ── NODO MAESTRO SUPERIOR (CUBO ISOMÉTRICO 3D) ── */}
    <g transform="translate(24, 12)">
      {/* Cara Superior */}
      <polygon points="0,-8 9,-3 0,2 -9,-3" fill="url(#org3dTop)" stroke="#ffffff" strokeWidth="0.8" />
      {/* Cara Izquierda */}
      <polygon points="-9,-3 0,2 0,11 -9,6" fill="url(#org3dLeft)" stroke="#ffffff" strokeWidth="0.8" />
      {/* Cara Derecha */}
      <polygon points="0,2 9,-3 9,6 0,11" fill="url(#org3dRight)" stroke="#ffffff" strokeWidth="0.8" />

      {/* Corona Real 3D sobre el nodo maestro */}
      <g transform="translate(0, -9)">
        <polygon points="-5,-4 -2,-1 0,-5 2,-1 5,-4 4,1 -4,1" fill="url(#org3dGold)" stroke="#ffffff" strokeWidth="0.6" />
        <circle cx="-5" cy="-4" r="0.9" fill="#fde047" />
        <circle cx="0" cy="-5" r="1.1" fill="#ffffff" />
        <circle cx="5" cy="-4" r="0.9" fill="#fde047" />
      </g>
    </g>

    {/* ── 3 NODOS SUBSIDIARIOS ISOMÉTRICOS 3D (DEPARTAMENTOS) ── */}
    {/* Nodo 1: Izquierdo (Cargos) */}
    <g transform="translate(10, 33)">
      <polygon points="0,-5 6,-2 0,1 -6,-2" fill="url(#org3dTop)" stroke="#ffffff" strokeWidth="0.6" />
      <polygon points="-6,-2 0,1 0,7 -6,4" fill="url(#org3dLeft)" stroke="#ffffff" strokeWidth="0.6" />
      <polygon points="0,1 6,-2 6,4 0,7" fill="url(#org3dRight)" stroke="#ffffff" strokeWidth="0.6" />
      <circle cx="0" cy="-2" r="1.2" fill="#ffffff" />
    </g>

    {/* Nodo 2: Central (Supervisión) */}
    <g transform="translate(24, 33)">
      <polygon points="0,-6 7,-2.5 0,1 -7,-2.5" fill="url(#org3dTop)" stroke="#ffffff" strokeWidth="0.6" />
      <polygon points="-7,-2.5 0,1 0,8 -7,4.5" fill="url(#org3dLeft)" stroke="#ffffff" strokeWidth="0.6" />
      <polygon points="0,1 7,-2.5 7,4.5 0,8" fill="url(#org3dRight)" stroke="#ffffff" strokeWidth="0.6" />
      <circle cx="0" cy="-2.5" r="1.4" fill="#fde047" />
    </g>

    {/* Nodo 3: Derecho (Colectivos & PDVSA) */}
    <g transform="translate(38, 33)">
      <polygon points="0,-5 6,-2 0,1 -6,-2" fill="url(#org3dTop)" stroke="#ffffff" strokeWidth="0.6" />
      <polygon points="-6,-2 0,1 0,7 -6,4" fill="url(#org3dLeft)" stroke="#ffffff" strokeWidth="0.6" />
      <polygon points="0,1 6,-2 6,4 0,7" fill="url(#org3dRight)" stroke="#ffffff" strokeWidth="0.6" />
      <circle cx="0" cy="-2" r="1.2" fill="#ffffff" />
    </g>
  </svg>
);

/**
 * 3. MÓDULO PRINCIPAL: CONTROL DE ESTUDIOS
 * Modelo 3D: Tomo académico isométrico encuadernado en piel cian con páginas de canto 3D,
 * escuadra dorada metálica cruzada, compás y acta con sello de cera de aprobación.
 */
export const IconoModuloControlEstudios: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 42,
  color = '#00C3FF',
  className
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ filter: `drop-shadow(0 6px 14px ${color}55)` }}>
    <defs>
      <linearGradient id="ctl3dCover" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="60%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>
      <linearGradient id="ctl3dPages" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#e2e8f0" />
        <stop offset="50%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
      <linearGradient id="ctl3dGoldRuler" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id="ctl3dWaxSeal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>

    {/* Sombra 3D en el escritorio */}
    <ellipse cx="24" cy="43" rx="19" ry="3.5" fill="#0f172a" opacity="0.25" />

    {/* Tapa Inferior del Libro / Carpeta 3D */}
    <path d="M7 36L24 43L41 36L41 33L24 40L7 33Z" fill="#0369a1" />

    {/* Canto de Páginas Académicas 3D */}
    <path d="M8 32L24 38L40 32L40 28L24 34L8 28Z" fill="url(#ctl3dPages)" stroke="#94a3b8" strokeWidth="0.5" />
    <path d="M8 28L24 34L40 28L40 24L24 30L8 24Z" fill="url(#ctl3dPages)" stroke="#94a3b8" strokeWidth="0.5" />

    {/* Tapa Superior Isométrica */}
    <polygon points="24,10 41,18 24,26 7,18" fill="url(#ctl3dCover)" stroke="#ffffff" strokeWidth="1" />

    {/* Lomo Curvo Tridimensional */}
    <path d="M7 18C5 21 5 30 7 34L24 41L24 27L7 18Z" fill="#0284c7" stroke="#ffffff" strokeWidth="0.6" />

    {/* Hoja de Calificaciones / Acta Oficial Flotante */}
    <g transform="translate(14, 4)">
      <polygon points="10,0 22,6 12,22 0,16" fill="#ffffff" stroke="#38bdf8" strokeWidth="0.8" />
      {/* Renglones de notas */}
      <line x1="3" y1="14" x2="11" y2="6" stroke="#0284c7" strokeWidth="1.2" />
      <line x1="6" y1="17" x2="14" y2="9" stroke="#94a3b8" strokeWidth="1" />
      <line x1="9" y1="20" x2="17" y2="12" stroke="#94a3b8" strokeWidth="1" />
    </g>

    {/* Escuadra Metálica Dorada 3D Cruzada */}
    <polygon points="12,24 28,16 34,28" fill="url(#ctl3dGoldRuler)" stroke="#ffffff" strokeWidth="0.8" />
    <polygon points="16,23 24,19 28,25" fill="#0369a1" />
    {/* Graduaciones de la regla */}
    <line x1="14" y1="23" x2="15" y2="24" stroke="#ffffff" strokeWidth="0.8" />
    <line x1="17" y1="21.5" x2="18" y2="22.5" stroke="#ffffff" strokeWidth="0.8" />
    <line x1="20" y1="20" x2="21" y2="21" stroke="#ffffff" strokeWidth="0.8" />

    {/* Sello de Cera Verde de Aprobación Oficial */}
    <circle cx="34" cy="28" r="5" fill="url(#ctl3dWaxSeal)" stroke="#ffffff" strokeWidth="1.2" />
    <path d="M31.8 28L33.2 29.5L36.5 26.5" stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * 4. MÓDULO PRINCIPAL: GESTIÓN ESTUDIANTIL
 * Modelo 3D: Birrete de graduación en perspectiva isométrica con borla de hilos dorados,
 * credencial estudiantil digital flotante y estrella de mérito académico.
 */
export const IconoModuloGestionEstudiantil: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 42,
  color = '#8B5CF6',
  className
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ filter: `drop-shadow(0 6px 14px ${color}55)` }}>
    <defs>
      <linearGradient id="est3dCapTop" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="50%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#6d28d9" />
      </linearGradient>
      <linearGradient id="est3dCapSide" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#5b21b6" />
        <stop offset="100%" stopColor="#3b0764" />
      </linearGradient>
      <linearGradient id="est3dGoldTassel" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="60%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#a16207" />
      </linearGradient>
      <linearGradient id="est3dCard" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#f5f3ff" />
      </linearGradient>
    </defs>

    {/* Sombra proyectada del birrete y carnet */}
    <ellipse cx="24" cy="43.5" rx="18" ry="3" fill="#0f172a" opacity="0.25" />

    {/* Carnet Estudiantil 3D Inclinado en Segundo Plano */}
    <g transform="translate(10, 22)">
      <polygon points="0,6 22,0 28,16 6,22" fill="url(#est3dCard)" stroke="#ddd6fe" strokeWidth="1" />
      {/* Foto del alumno */}
      <polygon points="3,8 10,6 12,13 5,15" fill="#c4b5fd" />
      <circle cx="8" cy="10" r="2" fill="#ffffff" />
      {/* Líneas de datos del estudiante */}
      <line x1="12" y1="8" x2="20" y2="6" stroke="#7c3aed" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="13" y1="12" x2="22" y2="9.5" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
      {/* Chip dorado */}
      <rect x="20" y="11" width="3" height="3" rx="0.5" fill="#fde047" />
    </g>

    {/* ── BIRRETE ISOMÉTRICO 3D FLOTANTE ── */}
    {/* Copa inferior cilíndrica del birrete */}
    <path d="M14 17V26C14 30 20 33 24 33C28 33 34 30 34 26V17" fill="url(#est3dCapSide)" stroke="#3b0764" strokeWidth="0.8" />
    <ellipse cx="24" cy="17" rx="10" ry="3" fill="#6d28d9" />

    {/* Rombo Superior Isométrico (Gorra Plana) */}
    <polygon points="24,4 44,13 24,22 4,13" fill="url(#est3dCapTop)" stroke="#ffffff" strokeWidth="1.2" />

    {/* Botón Central Dorado */}
    <ellipse cx="24" cy="13" rx="2.5" ry="1.4" fill="url(#est3dGoldTassel)" stroke="#ffffff" strokeWidth="0.6" />

    {/* Cordón Trenzado y Borla de Hilos de Oro 3D */}
    <path d="M24 13C33 14 37 18 38 23" stroke="url(#est3dGoldTassel)" strokeWidth="2" strokeLinecap="round" />
    {/* Nudo de la borla */}
    <circle cx="38" cy="24" r="2" fill="url(#est3dGoldTassel)" stroke="#ffffff" strokeWidth="0.6" />
    {/* Hilos colgantes de la borla */}
    <polygon points="36,25 40,25 41,32 35,32" fill="url(#est3dGoldTassel)" />
    <circle cx="38" cy="32" r="1.2" fill="#fef08a" />

    {/* Estrella de Rendimiento Académico Flotante */}
    <g transform="translate(7, 8)">
      <polygon points="4,0 5.2,2.6 8,3 5.9,5 6.4,7.8 4,6.5 1.6,7.8 2.1,5 0,3 2.8,2.6" fill="url(#est3dGoldTassel)" stroke="#ffffff" strokeWidth="0.6" />
    </g>
  </svg>
);

/**
 * 5. MÓDULO PRINCIPAL: GESTIÓN DOCENTE
 * Modelo 3D: Pizarra panorámica en perspectiva con atril de soporte, gráfica tridimensional
 * de barras ascendentes y portafolios de cuero ejecutivo del docente con cerradura dorada.
 */
export const IconoModuloGestionDocente: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 42,
  color = '#00E676',
  className
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ filter: `drop-shadow(0 6px 14px ${color}55)` }}>
    <defs>
      <linearGradient id="doc3dBoard" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="50%" stopColor="#059669" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      <linearGradient id="doc3dFrame" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
      <linearGradient id="doc3dBriefcase" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#b45309" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
      <linearGradient id="doc3dGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="100%" stopColor="#eab308" />
      </linearGradient>
    </defs>

    {/* Sombra en el suelo */}
    <ellipse cx="24" cy="44" rx="19" ry="3" fill="#0f172a" opacity="0.25" />

    {/* Patas del atril en perspectiva */}
    <line x1="14" y1="28" x2="8" y2="43" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="34" y1="28" x2="40" y2="43" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="24" y1="28" x2="24" y2="43" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />

    {/* Marco de la Pizarra 3D Biselado */}
    <rect x="6" y="5" width="36" height="23" rx="3.5" fill="url(#doc3dFrame)" stroke="#64748b" strokeWidth="1" />
    <rect x="8.5" y="7.5" width="31" height="18" rx="2" fill="url(#doc3dBoard)" stroke="#047857" strokeWidth="0.8" />

    {/* Gráfica Tridimensional de Barras y Curva de Clases */}
    <g transform="translate(11, 10)">
      {/* Barras 3D */}
      <rect x="2" y="8" width="3.5" height="6" rx="0.8" fill="#38bdf8" />
      <rect x="7" y="5" width="3.5" height="9" rx="0.8" fill="#34d399" />
      <rect x="12" y="2" width="3.5" height="12" rx="0.8" fill="#fde047" />
      <rect x="17" y="0" width="3.5" height="14" rx="0.8" fill="#f43f5e" />
      {/* Curva de aprendizaje */}
      <path d="M1 10L6 7L12 4L22 1" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="22" cy="1" r="1.5" fill="#fde047" stroke="#ffffff" strokeWidth="0.6" />
    </g>

    {/* Repisa para Tizas / Borrador */}
    <rect x="12" y="27" width="24" height="2" rx="1" fill="#fef08a" stroke="#d97706" strokeWidth="0.6" />

    {/* ── PORTAFOLIOS EJECUTIVO DOCENTE 3D EN PRIMER PLANO ── */}
    <g transform="translate(14, 30)">
      {/* Asa metálica */}
      <path d="M7 3C7 0.8 13 0.8 13 3" stroke="url(#doc3dGold)" strokeWidth="1.8" strokeLinecap="round" />
      {/* Cuerpo del maletín de cuero */}
      <rect x="0" y="3" width="20" height="12" rx="2.5" fill="url(#doc3dBriefcase)" stroke="#ffffff" strokeWidth="0.8" />
      {/* Tapa con costura */}
      <path d="M0 3H20V7C20 8.5 18.5 10 16 10H4C1.5 10 0 8.5 0 7V3Z" fill="#92400e" />
      {/* Broches dorados */}
      <rect x="4" y="8" width="2.5" height="3" rx="0.6" fill="url(#doc3dGold)" />
      <rect x="13.5" y="8" width="2.5" height="3" rx="0.6" fill="url(#doc3dGold)" />
    </g>
  </svg>
);

/**
 * 6. MÓDULO PRINCIPAL: FORMACIÓN Y CAPACITACIÓN
 * Modelo 3D: Trofeo Copa de Oro esculpido con corona de laureles,
 * estrella facetada de excelencia y pergamino con cinta escarlata.
 */
export const IconoModuloFormacion: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 42,
  color = '#8b5cf6',
  className
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ filter: `drop-shadow(0 6px 14px ${color}55)` }}>
    <defs>
      <linearGradient id="form3dGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="35%" stopColor="#facc15" />
        <stop offset="70%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#a16207" />
      </linearGradient>
      <linearGradient id="form3dMarble" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="form3dRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f43f5e" />
        <stop offset="100%" stopColor="#be123c" />
      </linearGradient>
    </defs>

    {/* Sombra 3D en el podio */}
    <ellipse cx="24" cy="44" rx="18" ry="3" fill="#0f172a" opacity="0.28" />

    {/* Asas 3D Curvadas de la Copa */}
    <path d="M12 14C5 14 5 24 12 27" stroke="url(#form3dGold)" strokeWidth="3" strokeLinecap="round" />
    <path d="M36 14C43 14 43 24 36 27" stroke="url(#form3dGold)" strokeWidth="3" strokeLinecap="round" />

    {/* Copa Central Volumétrica */}
    <path d="M12 11C12 25 18 29 24 29C30 29 36 25 36 11H12Z" fill="url(#form3dGold)" stroke="#ffffff" strokeWidth="1" />
    <ellipse cx="24" cy="11" rx="12" ry="3.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.8" />
    <ellipse cx="24" cy="11" rx="9" ry="2.2" fill="#eab308" />

    {/* Tallo y Base Metálica de la Copa */}
    <path d="M22 29H26V35H22V29Z" fill="url(#form3dGold)" />
    <path d="M17 35H31L33 38H15L17 35Z" fill="url(#form3dGold)" stroke="#ca8a04" strokeWidth="0.8" />

    {/* Base de Mármol Negro Esculpida */}
    <rect x="13" y="38" width="22" height="5.5" rx="1.5" fill="url(#form3dMarble)" stroke="#64748b" strokeWidth="0.8" />
    {/* Placa Dorada de Excelencia */}
    <rect x="17" y="39.5" width="14" height="2.5" rx="0.6" fill="url(#form3dGold)" />
    <line x1="19" y1="40.7" x2="29" y2="40.7" stroke="#78350f" strokeWidth="0.8" />

    {/* Gran Estrella de Excelencia 3D Flotando Sobre la Copa */}
    <g transform="translate(24, 6)">
      <polygon points="0,-4 2.2,0.8 7,1.2 3.5,4.5 4.5,9.5 0,7 -4.5,9.5 -3.5,4.5 -7,1.2 -2.2,0.8" fill="url(#form3dGold)" stroke="#ffffff" strokeWidth="0.8" />
      <circle cx="0" cy="3" r="1.5" fill="#ffffff" />
    </g>

    {/* Cintas de Honor Escarlata Colgantes */}
    <path d="M18 36L15 44L19 42L21 44L20 36" fill="url(#form3dRibbon)" />
    <path d="M30 36L28 44L30 42L33 44L31 36" fill="url(#form3dRibbon)" />
  </svg>
);

/**
 * 7. MÓDULO PRINCIPAL: DISEÑOS
 * Modelo 3D: Paleta de pintor ergonómica en perspectiva isométrica con montículos
 * esféricos de pintura al óleo, orificio para el pulgar y pincel con virola de acero y cerdas doradas.
 */
export const IconoModuloDisenos: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 42,
  color = '#EC4899',
  className
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ filter: `drop-shadow(0 6px 14px ${color}55)` }}>
    <defs>
      <linearGradient id="dis3dWood" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f472b6" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#be185d" />
      </linearGradient>
      <linearGradient id="dis3dEdge" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9d174d" />
        <stop offset="100%" stopColor="#831843" />
      </linearGradient>
      <linearGradient id="dis3dBrushHandle" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fed7aa" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
    </defs>

    {/* Sombra de la paleta en el caballete */}
    <ellipse cx="24" cy="44" rx="18" ry="3.5" fill="#0f172a" opacity="0.25" />

    {/* Borde Inferior / Grosor 3D de la Paleta */}
    <path d="M24 7C12 7 5 14 5 24C5 34 14 42 24 42C28 42 30 40 30 38C30 37 29.5 36 29 35C28.5 34 28 33 28 31.5C28 29.5 30 28 32 28H35C40 28 44 24 44 19C44 12 36 7 24 7Z" fill="url(#dis3dEdge)" />

    {/* Cara Superior de la Paleta */}
    <path d="M24 5C12 5 5 12 5 22C5 32 14 40 24 40C28 40 30 38 30 36C30 35 29.5 34 29 33C28.5 32 28 31 28 29.5C28 27.5 30 26 32 26H35C40 26 44 22 44 17C44 10 36 5 24 5Z" fill="url(#dis3dWood)" stroke="#ffffff" strokeWidth="1" />

    {/* Orificio Ergonómico del Pulgar 3D */}
    <ellipse cx="36" cy="33" rx="3.5" ry="4.5" fill="#831843" />
    <ellipse cx="36" cy="32" rx="3.5" ry="4.5" fill="#fdf2f8" stroke="#ffffff" strokeWidth="0.8" />

    {/* 4 Gotas Esféricas de Pintura en Relieve 3D con Brillos */}
    {/* Azul Cian */}
    <circle cx="13" cy="15" r="3.2" fill="#0284c7" />
    <circle cx="13" cy="14" r="3" fill="#38bdf8" />
    <circle cx="12" cy="13" r="1" fill="#ffffff" />

    {/* Amarillo Sol */}
    <circle cx="21" cy="11" r="3.2" fill="#ca8a04" />
    <circle cx="21" cy="10" r="3" fill="#fde047" />
    <circle cx="20" cy="9" r="1" fill="#ffffff" />

    {/* Verde Menta */}
    <circle cx="29" cy="13" r="3.2" fill="#059669" />
    <circle cx="29" cy="12" r="3" fill="#34d399" />
    <circle cx="28" cy="11" r="1" fill="#ffffff" />

    {/* Naranja Neón */}
    <circle cx="14" cy="25" r="3.2" fill="#c2410c" />
    <circle cx="14" cy="24" r="3" fill="#fb923c" />
    <circle cx="13" cy="23" r="1" fill="#ffffff" />

    {/* Pincel de Arte 3D Atravesando la Paleta */}
    <g transform="translate(24, 22) rotate(-35)">
      {/* Mango de madera noble */}
      <rect x="-2" y="-18" width="4" height="24" rx="2" fill="url(#dis3dBrushHandle)" stroke="#7c2d12" strokeWidth="0.6" />
      {/* Virola plateada */}
      <rect x="-2.5" y="6" width="5" height="5" rx="0.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.6" />
      {/* Cerdas con pintura fucsia */}
      <path d="M-2.5 11C-2.5 15 0 18 0 18C0 18 2.5 15 2.5 11H-2.5Z" fill="#f43f5e" />
      <circle cx="0" cy="17" r="1" fill="#fef08a" />
    </g>
  </svg>
);

/**
 * 8. MÓDULO PRINCIPAL: SERVICIOS Y BIENESTAR
 * Modelo 3D: Autobús de transporte escolar en perspectiva isométrica angular,
 * parabrisas curvo de cristal, faros LED con haz de luz y baliza de tracking.
 */
export const IconoModuloServicios: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 42,
  color = '#FF3D00',
  className
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ filter: `drop-shadow(0 6px 14px ${color}55)` }}>
    <defs>
      <linearGradient id="srv3dBusBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fb923c" />
        <stop offset="60%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#ea580c" />
      </linearGradient>
      <linearGradient id="srv3dBusSide" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c2410c" />
        <stop offset="100%" stopColor="#9a3412" />
      </linearGradient>
      <linearGradient id="srv3dGlass" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e0f2fe" />
        <stop offset="50%" stopColor="#bae6fd" />
        <stop offset="100%" stopColor="#38bdf8" />
      </linearGradient>
      <linearGradient id="srv3dHeadlight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="60%" stopColor="#fde047" />
        <stop offset="100%" stopColor="#eab308" />
      </linearGradient>
    </defs>

    {/* Sombra del autobús en el pavimento */}
    <ellipse cx="24" cy="44" rx="20" ry="3.5" fill="#0f172a" opacity="0.3" />

    {/* ── CARROCERÍA DEL AUTOBÚS EN PERSPECTIVA FRONTAL 3D ── */}
    {/* Techo aerodinámico */}
    <path d="M10 10C10 7 14 6 24 6C34 6 38 7 38 10V14H10V10Z" fill="#fbbf24" stroke="#ffffff" strokeWidth="0.8" />
    {/* Baliza satelital de GPS en el techo */}
    <ellipse cx="24" cy="5.5" rx="3.5" ry="1.5" fill="#ef4444" stroke="#ffffff" strokeWidth="0.6" />
    <circle cx="24" cy="4" r="1.5" fill="#f87171" />

    {/* Carrocería frontal */}
    <rect x="8" y="13" width="32" height="25" rx="5" fill="url(#srv3dBusBody)" stroke="#ffffff" strokeWidth="1.2" />

    {/* Franja de Ruta Superior con Letrero LED */}
    <rect x="14" y="9" width="20" height="4" rx="1.5" fill="#0f172a" stroke="#fde047" strokeWidth="0.8" />
    <text x="24" y="12.2" fill="#fde047" fontSize="2.8" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">DEP ORIENTE</text>

    {/* Parabrisas Panorámico Curvo de Cristal */}
    <rect x="11" y="14.5" width="26" height="11.5" rx="3" fill="url(#srv3dGlass)" stroke="#0284c7" strokeWidth="0.8" />
    {/* Reflejo diagonal de cristal */}
    <polygon points="14,15 18,15 13,25 9,25" fill="#ffffff" opacity="0.45" />
    <polygon points="21,15 24,15 18,25 15,25" fill="#ffffff" opacity="0.3" />

    {/* Parrilla Central Cromada */}
    <rect x="17" y="28" width="14" height="6.5" rx="2" fill="#1e293b" stroke="#cbd5e1" strokeWidth="1" />
    <line x1="19" y1="30" x2="29" y2="30" stroke="#94a3b8" strokeWidth="0.8" />
    <line x1="19" y1="32" x2="29" y2="32" stroke="#94a3b8" strokeWidth="0.8" />
    <circle cx="24" cy="31" r="1.2" fill="#fbbf24" />

    {/* Faros LED 3D Volumétricos */}
    <g>
      {/* Faro Izquierdo */}
      <circle cx="13.5" cy="30.5" r="3" fill="url(#srv3dHeadlight)" stroke="#ffffff" strokeWidth="1" />
      <circle cx="13.5" cy="30.5" r="1.2" fill="#ffffff" />
      {/* Faro Derecho */}
      <circle cx="34.5" cy="30.5" r="3" fill="url(#srv3dHeadlight)" stroke="#ffffff" strokeWidth="1" />
      <circle cx="34.5" cy="30.5" r="1.2" fill="#ffffff" />
    </g>

    {/* Parachoques Reforzado 3D */}
    <rect x="6" y="36" width="36" height="4" rx="2" fill="#334155" stroke="#ffffff" strokeWidth="0.8" />

    {/* Ruedas con Neumáticos y Rines 3D */}
    <rect x="9" y="39" width="6" height="4" rx="1.5" fill="#0f172a" />
    <rect x="33" y="39" width="6" height="4" rx="1.5" fill="#0f172a" />
  </svg>
);

/**
 * 9. MÓDULO PRINCIPAL: SEGURIDAD Y ACCESOS
 * Modelo 3D: Escudo blindado de titanio pulido con biseles de oro,
 * candado maestro volumétrico de acero y anillo biométrico de ciberseguridad.
 */
export const IconoModuloSeguridad: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 42,
  color = '#455A64',
  className
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ filter: `drop-shadow(0 6px 14px ${color}55)` }}>
    <defs>
      <linearGradient id="sec3dShield" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#64748b" />
        <stop offset="50%" stopColor="#475569" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
      <linearGradient id="sec3dGoldRim" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#a16207" />
      </linearGradient>
      <linearGradient id="sec3dLockBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="60%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#854d0e" />
      </linearGradient>
      <linearGradient id="sec3dShackle" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="50%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#64748b" />
      </linearGradient>
    </defs>

    {/* Sombra en el fondo */}
    <ellipse cx="24" cy="44" rx="17" ry="3" fill="#0f172a" opacity="0.3" />

    {/* Escudo Exterior Biselado en Oro Macizo */}
    <path d="M24 4L7 9.5V23C7 33.5 14.5 41.5 24 44C33.5 41.5 41 33.5 41 23V9.5L24 4Z" fill="url(#sec3dGoldRim)" stroke="#ffffff" strokeWidth="1" />

    {/* Cara Interior del Escudo de Titanio */}
    <path d="M24 7L10 11.5V23C10 31.5 16 38.5 24 41C32 38.5 38 31.5 38 23V11.5L24 7Z" fill="url(#sec3dShield)" stroke="#0f172a" strokeWidth="0.8" />

    {/* Trama de Ciberseguridad / Circuito en el Escudo */}
    <path d="M24 10V22M14 18H34M16 28L24 22L32 28" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" opacity="0.75" />

    {/* ── CANDADO MAESTRO VOLUMÉTRICO 3D ── */}
    {/* Grillete cromado en U */}
    <path d="M18 22V17C18 13.5 20.5 11 24 11C27.5 11 30 13.5 30 17V22" stroke="url(#sec3dShackle)" strokeWidth="3.2" strokeLinecap="round" />

    {/* Cuerpo de Oro Macizo del Candado */}
    <rect x="16" y="21" width="16" height="13" rx="3.5" fill="url(#sec3dLockBody)" stroke="#ffffff" strokeWidth="1.2" />

    {/* Ojo de la Cerradura con Haz de Luz Láser */}
    <circle cx="24" cy="26" r="2" fill="#451a03" />
    <polygon points="23,26 25,26 26,30 22,30" fill="#451a03" />
    <circle cx="24" cy="26" r="1" fill="#38bdf8" />

    {/* Checkmark de Seguridad Validada */}
    <circle cx="34" cy="33" r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.2" />
    <path d="M32 33L33.5 34.5L36.5 31.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Componente unificador para renderizar el icono 3D oficial de cualquier Módulo Principal de SIGAE
 */
export const IconoModuloPrincipal: React.FC<{
  categoria: string;
  size?: number;
  color?: string;
  className?: string;
}> = ({ categoria, size = 42, color, className }) => {
  const norm = (categoria || '').trim().toLowerCase();

  if (norm.includes('direcci') || norm.includes('sistema')) {
    return <IconoModuloDireccion size={size} color={color} className={className} />;
  }
  if (norm.includes('organizaci')) {
    return <IconoModuloOrganizacion size={size} color={color} className={className} />;
  }
  if (norm.includes('control') || norm.includes('estudio')) {
    return <IconoModuloControlEstudios size={size} color={color} className={className} />;
  }
  if (norm.includes('estudiantil') || norm.includes('inscripci') || norm.includes('matr')) {
    return <IconoModuloGestionEstudiantil size={size} color={color} className={className} />;
  }
  if (norm.includes('docente') || norm.includes('personal')) {
    return <IconoModuloGestionDocente size={size} color={color} className={className} />;
  }
  if (norm.includes('formaci') || norm.includes('capacita')) {
    return <IconoModuloFormacion size={size} color={color} className={className} />;
  }
  if (norm.includes('diseño') || norm.includes('diseno')) {
    return <IconoModuloDisenos size={size} color={color} className={className} />;
  }
  if (norm.includes('servicio') || norm.includes('bienestar') || norm.includes('transporte')) {
    return <IconoModuloServicios size={size} color={color} className={className} />;
  }
  if (norm.includes('seguridad') || norm.includes('acceso')) {
    return <IconoModuloSeguridad size={size} color={color} className={className} />;
  }

  return <IconoModuloDireccion size={size} color={color} className={className} />;
};

/* ═════════════════════════════════════════════════════════════════════════
   ICONOS 3D DE LOS SUBMÓDULOS DE GESTIÓN ESTUDIANTIL
   Diseñados con modelado isométrico 3D, iluminación volumétrica y biseles
   ═════════════════════════════════════════════════════════════════════════ */

/**
 * 1. SUBMÓDULO: GESTIÓN DE ADMISIONES
 * Modelo 3D: Carpeta / Tabla de baremo de admisión en perspectiva isométrica con medidor de prioridad,
 * barras de clasificación, estrella dorada de mérito y sello de cupo formalizado.
 */
export const IconoGestionAdmisiones: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 46,
  color = '#8b5cf6',
  className
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ filter: `drop-shadow(0 4px 12px ${color}50)` }}>
    <defs>
      <linearGradient id="adm3dBoard" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="50%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#6d28d9" />
      </linearGradient>
      <linearGradient id="adm3dClip" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
      <linearGradient id="adm3dCheck" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>
    <ellipse cx="24" cy="43.5" rx="18" ry="3" fill="#0f172a" opacity="0.22" />
    {/* Tabla Portapapeles Isométrica */}
    <rect x="8" y="7" width="32" height="34" rx="4" fill="url(#adm3dBoard)" stroke="#ffffff" strokeWidth="1.2" />
    <rect x="11" y="12" width="26" height="26" rx="2.5" fill="#ffffff" />
    {/* Clip Superior Dorado */}
    <rect x="18" y="4" width="12" height="6" rx="2" fill="url(#adm3dClip)" stroke="#ffffff" strokeWidth="0.8" />
    <circle cx="24" cy="7" r="1.2" fill="#78350f" />
    {/* Renglones del Baremo y Puntos */}
    <rect x="14" y="16" width="14" height="2.5" rx="1" fill="#8b5cf6" />
    <rect x="14" y="21" width="10" height="2" rx="1" fill="#cbd5e1" />
    <rect x="14" y="25" width="12" height="2" rx="1" fill="#cbd5e1" />
    {/* Barras de Prioridad 1, 2, 3 */}
    <rect x="14" y="30" width="4" height="5" rx="1" fill="#10b981" />
    <rect x="19" y="28" width="4" height="7" rx="1" fill="#3b82f6" />
    <rect x="24" y="26" width="4" height="9" rx="1" fill="#f59e0b" />
    {/* Estrella de Prioridad Absoluta */}
    <polygon points="31,16 32.2,19 35.5,19 32.8,21 33.8,24 31,22.2 28.2,24 29.2,21 26.5,19 29.8,19" fill="#fde047" stroke="#d97706" strokeWidth="0.6" />
    {/* Sello de Aprobado / Cupo Formalizado */}
    <circle cx="36" cy="35" r="7" fill="url(#adm3dCheck)" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M33 35L35 37L39 33" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * 2. SUBMÓDULO: MENSAJES DE ADMISIÓN (NOTIFICACIONES WHATSAPP)
 * Modelo 3D: Smartphone holográfico en perspectiva con bocadillo de chat WhatsApp oficial,
 * burbujas de conversación personalizadas y antena de transmisión de ondas activas.
 */
export const IconoMensajesAdmision: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 46,
  color = '#25D366',
  className
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ filter: `drop-shadow(0 4px 12px ${color}50)` }}>
    <defs>
      <linearGradient id="msg3dPhone" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="msg3dWA" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4ade80" />
        <stop offset="50%" stopColor="#22c55e" />
        <stop offset="100%" stopColor="#15803d" />
      </linearGradient>
    </defs>
    <ellipse cx="24" cy="43.5" rx="18" ry="3" fill="#0f172a" opacity="0.22" />
    {/* Chasis de Teléfono 3D */}
    <rect x="12" y="6" width="24" height="36" rx="5" fill="url(#msg3dPhone)" stroke="#ffffff" strokeWidth="1.2" />
    <rect x="14" y="9" width="20" height="30" rx="3" fill="#f8fafc" />
    <circle cx="24" cy="7.5" r="0.8" fill="#64748b" />
    {/* Barra de Chat Superior */}
    <rect x="14" y="9" width="20" height="6" rx="3" fill="#075e54" />
    <circle cx="17.5" cy="12" r="1.5" fill="#25d366" />
    <rect x="20.5" y="11" width="10" height="2" rx="0.8" fill="#ffffff" />
    {/* Burbujas de Mensaje en Pantalla */}
    <rect x="16" y="17" width="11" height="4" rx="2" fill="#dcf8c6" />
    <rect x="18" y="18.5" width="7" height="1" rx="0.5" fill="#075e54" />
    <rect x="21" y="23" width="11" height="4" rx="2" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.5" />
    <rect x="23" y="24.5" width="7" height="1" rx="0.5" fill="#64748b" />
    {/* Gran Bocadillo de WhatsApp Tridimensional Flotante */}
    <circle cx="34" cy="30" r="10" fill="url(#msg3dWA)" stroke="#ffffff" strokeWidth="1.6" />
    <path d="M29 36L30 32C28.8 30.5 28.8 28.5 30 27C31.5 25.5 34.5 25.5 36 27C37.5 28.5 37.5 31.5 36 33C34.5 34.5 32.5 34.8 30.8 34L29 36Z" fill="#ffffff" />
    <path d="M32 28.5C32 28.5 32.5 29.5 33.2 30.2C33.9 30.9 34.8 31.2 34.8 31.2" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

/**
 * 3. SUBMÓDULO: VINCULAR ESTUDIANTE (MATRÍCULA ACTIVA)
 * Modelo 3D: Credencial escolar en perspectiva isométrica con anillos dorados de vinculación institucional,
 * silueta de estudiante con birrete y cinta tricolor de asignación.
 */
export const IconoVincularEstudiante: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 46,
  color = '#7c3aed',
  className
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ filter: `drop-shadow(0 4px 12px ${color}50)` }}>
    <defs>
      <linearGradient id="vinc3dCard" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#f3e8ff" />
      </linearGradient>
      <linearGradient id="vinc3dChain" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="60%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#ca8a04" />
      </linearGradient>
      <linearGradient id="vinc3dBadge" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#6b21a8" />
      </linearGradient>
    </defs>
    <ellipse cx="24" cy="43.5" rx="18" ry="3" fill="#0f172a" opacity="0.22" />
    {/* Credencial Isométrica */}
    <rect x="7" y="10" width="28" height="30" rx="4" fill="url(#vinc3dCard)" stroke="#c084fc" strokeWidth="1.2" />
    {/* Cinta superior del carnet */}
    <path d="M7 14C7 11.8 8.8 10 11 10H31C33.2 10 35 11.8 35 14V17H7V14Z" fill="url(#vinc3dBadge)" />
    {/* Foto y Perfil Estudiantil */}
    <rect x="10" y="20" width="8" height="9" rx="2" fill="#ede9fe" stroke="#c084fc" strokeWidth="0.8" />
    <circle cx="14" cy="23" r="2" fill="#7c3aed" />
    <path d="M11.5 28C11.5 26.5 12.5 25.8 14 25.8C15.5 25.8 16.5 26.5 16.5 28" stroke="#7c3aed" strokeWidth="0.8" />
    {/* Renglones de la Matrícula */}
    <rect x="20" y="20" width="12" height="2" rx="1" fill="#475569" />
    <rect x="20" y="24" width="8" height="1.8" rx="0.9" fill="#94a3b8" />
    <rect x="20" y="27.5" width="10" height="1.8" rx="0.9" fill="#94a3b8" />
    <rect x="10" y="32" width="22" height="4" rx="2" fill="#10b981" />
    <circle cx="13" cy="34" r="1" fill="#ffffff" />
    <rect x="16" y="33" width="12" height="1.8" rx="0.8" fill="#ffffff" />
    {/* Eslabones Dorados 3D de Vinculación (Cadena de Enlace) */}
    <g transform="translate(33, 16)">
      <circle cx="0" cy="0" r="7" stroke="url(#vinc3dChain)" strokeWidth="3" fill="none" />
      <circle cx="6" cy="8" r="7" stroke="url(#vinc3dChain)" strokeWidth="3" fill="none" />
      <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
      <circle cx="6" cy="8" r="1.5" fill="#ffffff" />
    </g>
  </svg>
);

/**
 * 4. SUBMÓDULO: ACTUALIZACIÓN DE DATOS
 * Modelo 3D: Anillo tecnológico de sincronización y refresh en perspectiva con formulario de pasos,
 * avatar de estudiante/representante y tilde de validación continua.
 */
export const IconoActualizacionDatos: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 46,
  color = '#3b82f6',
  className
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ filter: `drop-shadow(0 4px 12px ${color}50)` }}>
    <defs>
      <linearGradient id="act3dRing" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="50%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="act3dPaper" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#f0fdf4" />
      </linearGradient>
    </defs>
    <ellipse cx="24" cy="43.5" rx="18" ry="3" fill="#0f172a" opacity="0.22" />
    {/* Gran Anillo de Actualización 3D Posterior */}
    <path d="M24 7C14.6 7 7 14.6 7 24C7 28.5 8.7 32.5 11.6 35.5L14 33C11.6 30.7 10 27.5 10 24C10 16.3 16.3 10 24 10C29.2 10 33.7 12.8 36.1 17L31 19H41V9L38.2 13.5C34.9 9.5 29.7 7 24 7Z" fill="url(#act3dRing)" />
    {/* Hoja de Datos en Primer Plano */}
    <rect x="15" y="16" width="22" height="24" rx="3.5" fill="url(#act3dPaper)" stroke="#3b82f6" strokeWidth="1" />
    {/* Renglones y Tildes del Asistente por Pasos */}
    <rect x="18" y="20" width="10" height="2.5" rx="1" fill="#1d4ed8" />
    <circle cx="19" cy="26" r="1.5" fill="#10b981" />
    <rect x="22" y="25" width="11" height="2" rx="1" fill="#64748b" />
    <circle cx="19" cy="30" r="1.5" fill="#10b981" />
    <rect x="22" y="29" width="9" height="2" rx="1" fill="#64748b" />
    <circle cx="19" cy="34" r="1.5" fill="#3b82f6" />
    <rect x="22" y="33" width="7" height="2" rx="1" fill="#94a3b8" />
    {/* Tilde Flotante de Datos Verificados */}
    <circle cx="37" cy="36" r="6" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M34.5 36L36.2 37.8L39.5 34.5" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * 5. SUBMÓDULO: VERIFICACIONES (ESCÁNER QR Y AUDITORÍA)
 * Modelo 3D: Escudo de verificación con código QR matricial central, haz láser horizontal cian
 * y sello oficial de validez institucional.
 */
export const IconoVerificaciones: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 46,
  color = '#0284c7',
  className
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ filter: `drop-shadow(0 4px 12px ${color}50)` }}>
    <defs>
      <linearGradient id="veri3dShield" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="50%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>
      <linearGradient id="veri3dLaser" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
        <stop offset="50%" stopColor="#00f0ff" />
        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
      </linearGradient>
    </defs>
    <ellipse cx="24" cy="43.5" rx="18" ry="3" fill="#0f172a" opacity="0.22" />
    {/* Gran Escudo Protector 3D */}
    <path d="M24 6L38 12V24C38 33 24 41 24 41C24 41 10 33 10 24V12L24 6Z" fill="url(#veri3dShield)" stroke="#ffffff" strokeWidth="1.5" />
    {/* Marco Blanco de la Matriz QR */}
    <rect x="15" y="15" width="18" height="18" rx="2.5" fill="#ffffff" />
    {/* Código QR Matricial Estilizado */}
    <rect x="17" y="17" width="5" height="5" fill="#0f172a" />
    <rect x="18" y="18" width="3" height="3" fill="#ffffff" />
    <rect x="19" y="19" width="1" height="1" fill="#0f172a" />
    
    <rect x="26" y="17" width="5" height="5" fill="#0f172a" />
    <rect x="27" y="18" width="3" height="3" fill="#ffffff" />
    <rect x="28" y="19" width="1" height="1" fill="#0f172a" />

    <rect x="17" y="26" width="5" height="5" fill="#0f172a" />
    <rect x="18" y="27" width="3" height="3" fill="#ffffff" />
    <rect x="19" y="28" width="1" height="1" fill="#0f172a" />

    <rect x="25" y="25" width="3" height="3" fill="#0284c7" />
    <rect x="29" y="28" width="2" height="2" fill="#0284c7" />

    {/* Haz Láser Cian de Escaneo */}
    <line x1="13" y1="24" x2="35" y2="24" stroke="url(#veri3dLaser)" strokeWidth="2" strokeLinecap="round" />
    <circle cx="24" cy="24" r="2" fill="#00f0ff" opacity="0.8" />
  </svg>
);

/**
 * 6. SUBMÓDULO: SOLICITUD DE CUPOS (3D ISOMÉTRICO)
 * Modelo 3D: Carpeta tridimensional con clip de titanio, planilla de admisión, birrete escolar
 * y sello oficial de cupo aprobado.
 */
export const IconoSolicitudCupos3D: React.FC<{ size?: number; color?: string; className?: string }> = ({
  size = 46,
  color = '#8b5cf6',
  className
}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={{ filter: `drop-shadow(0 4px 12px ${color}50)` }}>
    <defs>
      <linearGradient id="cupo3dFolder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#c084fc" />
        <stop offset="50%" stopColor="#8b5cf6" />
        <stop offset="100%" stopColor="#6d28d9" />
      </linearGradient>
      <linearGradient id="cupo3dPaper" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#faf5ff" />
      </linearGradient>
    </defs>
    <ellipse cx="24" cy="43.5" rx="18" ry="3" fill="#0f172a" opacity="0.22" />
    {/* Carpeta Base 3D */}
    <rect x="7" y="8" width="32" height="33" rx="4" fill="url(#cupo3dFolder)" stroke="#ffffff" strokeWidth="1.2" />
    {/* Planilla Interna Deslizada */}
    <rect x="11" y="11" width="26" height="28" rx="2.5" fill="url(#cupo3dPaper)" />
    {/* Clip Superior Dorado */}
    <rect x="18" y="5" width="12" height="5" rx="1.8" fill="#fde047" stroke="#b45309" strokeWidth="0.8" />
    {/* Líneas de Información de Cupo */}
    <rect x="14" y="16" width="12" height="2.2" rx="1" fill="#7c3aed" />
    <rect x="14" y="20" width="18" height="1.8" rx="0.9" fill="#cbd5e1" />
    <rect x="14" y="23.5" width="14" height="1.8" rx="0.9" fill="#cbd5e1" />
    <rect x="14" y="27" width="16" height="1.8" rx="0.9" fill="#cbd5e1" />
    {/* Sello Circular de Cupo Aprobado */}
    <circle cx="32" cy="33" r="6.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M29.5 33L31.2 34.8L34.5 31.5" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);




