import React from 'react';
import { motion } from 'framer-motion';

// ========================================================
// 1. ICONO 3D DE SEGURIDAD ELECTRÓNICA / DIGITAL (IconScout Style)
// ========================================================
export function Security3DIcon({ size = 46, className = '' }: { size?: number; className?: string }) {
  return (
    <motion.div 
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      animate={{ 
        y: [0, -3.5, 0],
        rotateY: [0, 7, -7, 0],
        rotateZ: [0, 1.5, -1.5, 0]
      }}
      transition={{ 
        repeat: Infinity, 
        duration: 4.8, 
        ease: "easeInOut" 
      }}
    >
      {/* Halo de resplandor cibernético exterior */}
      <motion.div 
        className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 blur-md opacity-60 pointer-events-none"
        animate={{ scale: [0.95, 1.15, 0.95], opacity: [0.5, 0.75, 0.5] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      />

      {/* Cápsula base 3D con cristal, sombras de profundidad y bisel metálico */}
      <div 
        className="relative w-full h-full rounded-2xl p-2 bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-800 shadow-[0_10px_25px_-5px_rgba(2,132,199,0.5),inset_0_2px_3px_rgba(255,255,255,0.6),inset_0_-2px_4px_rgba(0,0,0,0.3)] border border-sky-300/60 flex items-center justify-center overflow-hidden"
      >
        {/* Reflejo especular superior curvo (Efecto Vidrio 3D) */}
        <div className="absolute -top-3 left-0 right-0 h-7 bg-gradient-to-b from-white/45 via-white/20 to-transparent rounded-full transform -rotate-12 pointer-events-none" />

        {/* Anillo orbital de escaneo cibernético que gira en 3D */}
        <motion.div 
          className="absolute inset-1 rounded-xl border border-dashed border-sky-200/40 pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 14, ease: "linear" }}
        />

        {/* Escudo 3D con relieve */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          className="w-full h-full filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)] relative z-10"
        >
          <defs>
            <linearGradient id="shieldGrad3D" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#bae6fd" />
              <stop offset="80%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="shieldInnerGrad3D" x1="10%" y1="0%" x2="90%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="60%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="lockGold3D" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="45%" stopColor="#eab308" />
              <stop offset="90%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>
            <filter id="glowSubtle" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0284c7" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Escudo Exterior 3D */}
          <path 
            d="M12 2.5L4 5.5V11.2C4 16.65 7.42 21.6 12 22.8C16.58 21.6 20 16.65 20 11.2V5.5L12 2.5Z" 
            fill="url(#shieldGrad3D)" 
          />
          {/* Escudo Interior con hendidura de relieve 3D */}
          <path 
            d="M12 4.2L5.8 6.5V11.2C5.8 15.6 8.5 19.8 12 20.9C15.5 19.8 18.2 15.6 18.2 11.2V6.5L12 4.2Z" 
            fill="url(#shieldInnerGrad3D)" 
            opacity="0.95"
          />

          {/* Arco del Candado 3D */}
          <path 
            d="M9.8 11.5V8.5C9.8 7.3 10.8 6.3 12 6.3C13.2 6.3 14.2 7.3 14.2 8.5V11.5" 
            stroke="#fef08a" 
            strokeWidth="1.8" 
            strokeLinecap="round" 
          />
          {/* Cuerpo del Candado Dorado 3D */}
          <rect x="8.5" y="11" width="7" height="5.5" rx="1.6" fill="url(#lockGold3D)" />
          {/* Brillo especular candado */}
          <rect x="9.2" y="11.6" width="5.6" height="1" rx="0.5" fill="#ffffff" opacity="0.6" />
          {/* Ojo del candado */}
          <circle cx="12" cy="13.5" r="0.8" fill="#451a03" />
          <path d="M12 14V15.2" stroke="#451a03" strokeWidth="0.8" strokeLinecap="round" />
        </svg>

        {/* Haz de luz de escaneo cibernético que se desplaza */}
        <motion.div 
          className="absolute inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-cyan-100 to-transparent opacity-85 pointer-events-none"
          animate={{ top: ['-10%', '110%', '-10%'] }}
          transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}

// ========================================================
// 2. ICONO 3D DE USUARIO / AVATAR CON MOVIMIENTO (IconScout Style)
// ========================================================
export function User3DIcon({ size = 22, className = '' }: { size?: number; className?: string }) {
  const isPos = className.includes('absolute') || className.includes('fixed');
  return (
    <motion.div 
      className={`${isPos ? '' : 'relative'} inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      animate={{ 
        y: [0, -1.8, 0],
        scale: [1, 1.06, 1],
        rotateZ: [0, 2, -2, 0]
      }}
      transition={{ 
        repeat: Infinity, 
        duration: 3.4, 
        ease: "easeInOut" 
      }}
    >
      {/* Sombra de contacto / resplandor inferior */}
      <div className="absolute inset-0 rounded-full bg-sky-400/35 blur-[2.5px] pointer-events-none" />

      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        className="w-full h-full filter drop-shadow-[0_2px_4px_rgba(2,132,199,0.4)] relative z-10"
      >
        <defs>
          {/* Esfera 3D de la cabeza */}
          <radialGradient id="userHead3DRad" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="35%" stopColor="#38bdf8" />
            <stop offset="75%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </radialGradient>
          {/* Cuerpo/Torso 3D con luz superior */}
          <linearGradient id="userBody3DGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="45%" stopColor="#0284c7" />
            <stop offset="90%" stopColor="#075985" />
            <stop offset="100%" stopColor="#0c4a6e" />
          </linearGradient>
        </defs>

        {/* Cabeza 3D volumétrica con reflejo especular esférico */}
        <circle cx="12" cy="7.2" r="4.6" fill="url(#userHead3DRad)" />
        {/* Punto de luz especular superior izquierdo */}
        <circle cx="10.5" cy="5.5" r="1.5" fill="#ffffff" opacity="0.75" />
        <circle cx="10.8" cy="5.8" r="0.6" fill="#ffffff" opacity="0.9" />

        {/* Torso 3D curvado en relieve */}
        <path 
          d="M4.5 19.5C4.5 15.6 7.8 13.2 12 13.2C16.2 13.2 19.5 15.6 19.5 19.5V20.2H4.5V19.5Z" 
          fill="url(#userBody3DGrad)" 
        />
        {/* Reflejo especular arqueado en los hombros */}
        <path 
          d="M6.2 18.2C7.5 15.9 9.6 14.6 12 14.6C14.4 14.6 16.5 15.9 17.8 18.2" 
          stroke="#ffffff" 
          strokeWidth="1" 
          opacity="0.55" 
          strokeLinecap="round" 
        />
        {/* Cuello / detalle de camisa 3D */}
        <path 
          d="M10.8 13.5L12 15L13.2 13.5" 
          stroke="#e0f2fe" 
          strokeWidth="1.1" 
          strokeLinecap="round" 
          opacity="0.7" 
        />
      </svg>
    </motion.div>
  );
}

// ========================================================
// 3. ICONO 3D DE CANDADO CRIPTOGRÁFICO (IconScout Style)
// ========================================================
export function Lock3DIcon({ size = 22, className = '' }: { size?: number; className?: string }) {
  const isPos = className.includes('absolute') || className.includes('fixed');
  return (
    <motion.div 
      className={`${isPos ? '' : 'relative'} inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      animate={{ 
        y: [0, -1.6, 0],
        rotateZ: [0, 3, -3, 0],
        scale: [1, 1.05, 1]
      }}
      transition={{ 
        repeat: Infinity, 
        duration: 3.6, 
        ease: "easeInOut" 
      }}
    >
      <div className="absolute inset-0 rounded-lg bg-amber-400/35 blur-[3px] pointer-events-none" />

      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        className="w-full h-full filter drop-shadow-[0_2px_4px_rgba(217,119,6,0.4)] relative z-10"
      >
        <defs>
          <linearGradient id="lockBody3DGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#eab308" />
            <stop offset="85%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
          <linearGradient id="lockShackle3DGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#cbd5e1" />
            <stop offset="80%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>

        {/* Arco de acero metálico curvado */}
        <path 
          d="M7 10.2V6.8C7 4.15 9.24 2 12 2C14.76 2 17 4.15 17 6.8V10.2" 
          stroke="url(#lockShackle3DGrad)" 
          strokeWidth="2.8" 
          strokeLinecap="round" 
        />
        {/* Cuerpo del candado dorado 3D con relieve */}
        <rect x="4.5" y="9.8" width="15" height="12.2" rx="3.2" fill="url(#lockBody3DGrad)" />
        {/* Reflejo especular superior del candado */}
        <rect x="5.5" y="10.8" width="13" height="1.4" rx="0.7" fill="#ffffff" opacity="0.65" />

        {/* Ojo de la cerradura */}
        <circle cx="12" cy="14.8" r="1.5" fill="#451a03" />
        <path d="M12 15.8V18" stroke="#451a03" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}

// ========================================================
// 4. ICONO 3D DE PREGUNTA / SECRETO / DUDA (IconScout Style)
// ========================================================
export function HelpQuestion3DIcon({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <motion.div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      animate={{
        y: [0, -3, 0],
        rotateZ: [-2, 3, -2],
        scale: [1, 1.05, 1]
      }}
      transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-sky-400 to-indigo-500 blur-md opacity-50 pointer-events-none" />
      <div className="relative w-full h-full rounded-2xl p-1.5 bg-gradient-to-br from-sky-400 via-indigo-500 to-purple-600 shadow-[0_8px_20px_-4px_rgba(79,70,229,0.5),inset_0_2px_3px_rgba(255,255,255,0.7)] border border-sky-200/50 flex items-center justify-center overflow-hidden">
        <div className="absolute -top-2 left-0 right-0 h-5 bg-gradient-to-b from-white/50 to-transparent rounded-full pointer-events-none" />
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] relative z-10">
          <defs>
            <linearGradient id="qMarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#e0e7ff" />
              <stop offset="100%" stopColor="#c7d2fe" />
            </linearGradient>
          </defs>
          <path
            d="M9.09 9C9.325 8.33 9.8 7.76 10.42 7.38C11.04 7 11.77 6.85 12.5 6.95C13.23 7.05 13.9 7.4 14.37 7.94C14.84 8.48 15.08 9.17 15.05 9.9C15.05 12 12.05 13 12.05 13"
            stroke="url(#qMarkGrad)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="17.2" r="1.5" fill="#ffffff" />
        </svg>
      </div>
    </motion.div>
  );
}



// ========================================================
// 5. ICONO 3D DE LLAVE DE ROLES Y PRIVILEGIOS (IconScout Style)
// ========================================================
export function RolesKey3DIcon({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <motion.div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      animate={{
        y: [0, -3.5, 0],
        rotateZ: [0, 6, -6, 0]
      }}
      transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 blur-md opacity-60 pointer-events-none" />
      <div className="relative w-full h-full rounded-2xl p-1.5 bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600 shadow-[0_8px_20px_-4px_rgba(217,119,6,0.6),inset_0_2px_3px_rgba(255,255,255,0.7)] border border-amber-200/60 flex items-center justify-center overflow-hidden">
        <div className="absolute -top-2 left-0 right-0 h-5 bg-gradient-to-b from-white/60 to-transparent rounded-full pointer-events-none" />
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] relative z-10">
          <defs>
            <linearGradient id="goldKeyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#fef08a" />
              <stop offset="80%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
          </defs>
          <circle cx="8" cy="8" r="4.5" stroke="url(#goldKeyGrad)" strokeWidth="2.5" />
          <circle cx="8" cy="8" r="1.8" fill="#ffffff" opacity="0.8" />
          <path d="M11.5 11.5L20 20" stroke="url(#goldKeyGrad)" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M16 16L18.5 13.5" stroke="url(#goldKeyGrad)" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M18.5 18.5L21 16" stroke="url(#goldKeyGrad)" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
    </motion.div>
  );
}



// ========================================================
// 6. ICONO 3D DE AUDITORÍA Y TRAZABILIDAD (IconScout Style)
// ========================================================
export function AuditActivity3DIcon({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <motion.div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      animate={{
        y: [0, -3, 0],
        scale: [1, 1.05, 1]
      }}
      transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 blur-md opacity-60 pointer-events-none" />
      <div className="relative w-full h-full rounded-2xl p-1.5 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 shadow-[0_8px_20px_-4px_rgba(16,185,129,0.5),inset_0_2px_3px_rgba(255,255,255,0.7)] border border-emerald-200/60 flex items-center justify-center overflow-hidden">
        <div className="absolute -top-2 left-0 right-0 h-5 bg-gradient-to-b from-white/60 to-transparent rounded-full pointer-events-none" />
        {/* Haz de luz de radar */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-white/25 to-transparent pointer-events-none"
          animate={{ y: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
        />
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] relative z-10">
          <path
            d="M3 12H7L10 4L14 20L17 12H21"
            stroke="#ffffff"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </motion.div>
  );
}



// ========================================================
// 7. ICONO 3D DE EQUIPO / USUARIOS (IconScout Style)
// ========================================================
export function UsersTeam3DIcon({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <motion.div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      animate={{
        y: [0, -3, 0],
        rotateZ: [-2, 2, -2]
      }}
      transition={{ repeat: Infinity, duration: 3.8, ease: 'easeInOut' }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 blur-md opacity-60 pointer-events-none" />
      <div className="relative w-full h-full rounded-2xl p-1.5 bg-gradient-to-br from-sky-400 via-blue-600 to-indigo-700 shadow-[0_8px_20px_-4px_rgba(2,132,199,0.5),inset_0_2px_3px_rgba(255,255,255,0.7)] border border-sky-200/60 flex items-center justify-center overflow-hidden">
        <div className="absolute -top-2 left-0 right-0 h-5 bg-gradient-to-b from-white/60 to-transparent rounded-full pointer-events-none" />
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] relative z-10">
          <circle cx="9" cy="8" r="3.2" fill="#ffffff" />
          <path d="M3 18C3 15 5.5 13 9 13C12.5 13 15 15 15 18V19H3V18Z" fill="#ffffff" opacity="0.9" />
          <circle cx="16.5" cy="9.5" r="2.5" fill="#bae6fd" />
          <path d="M15 17.5C15.5 15.8 17 14.8 19 14.8C21 14.8 22.5 15.8 23 17.5V18.5H15V17.5Z" fill="#bae6fd" opacity="0.8" />
        </svg>
      </div>
    </motion.div>
  );
}



// ========================================================
// 8. ICONO 3D DE VIRTUALIZACIÓN / LAPTOP SIMULACIÓN (IconScout Style)
// ========================================================
export function VirtualizationLaptop3DIcon({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <motion.div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      animate={{
        y: [0, -3.5, 0],
        rotateX: [0, 8, 0],
        scale: [1, 1.05, 1]
      }}
      transition={{ repeat: Infinity, duration: 3.6, ease: 'easeInOut' }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 blur-md opacity-60 pointer-events-none" />
      <div className="relative w-full h-full rounded-2xl p-1.5 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 shadow-[0_8px_20px_-4px_rgba(245,158,11,0.5),inset_0_2px_3px_rgba(255,255,255,0.7)] border border-amber-200/60 flex items-center justify-center overflow-hidden">
        <div className="absolute -top-2 left-0 right-0 h-5 bg-gradient-to-b from-white/60 to-transparent rounded-full pointer-events-none" />
        {/* Resplandor de pantalla holográfica */}
        <motion.div
          className="absolute inset-x-2 top-2 h-4 bg-cyan-200/40 rounded-sm blur-xs"
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
        />
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] relative z-10">
          <rect x="4" y="4" width="16" height="11" rx="2" fill="#ffffff" />
          <rect x="5.5" y="5.5" width="13" height="8" rx="1" fill="#0f172a" />
          <polygon points="10,7.5 15,9.5 10,11.5" fill="#38bdf8" />
          <path d="M2 18.5C2 17.67 2.67 17 3.5 17H20.5C21.33 17 22 17.67 22 18.5V19.5C22 20.05 21.55 20.5 21 20.5H3C2.45 20.5 2 20.05 2 19.5V18.5Z" fill="#ffffff" />
        </svg>
      </div>
    </motion.div>
  );
}



// ========================================================
// 9. ICONO 3D DE ESCUELA / INSTITUCIÓN (IconScout Style)
// ========================================================
export function School3DIcon({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <motion.div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      animate={{
        y: [0, -3.2, 0],
        rotateZ: [-1.5, 1.5, -1.5]
      }}
      transition={{ repeat: Infinity, duration: 4.2, ease: 'easeInOut' }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-blue-600 blur-md opacity-60 pointer-events-none" />
      <div className="relative w-full h-full rounded-2xl p-1.5 bg-gradient-to-br from-sky-500 via-indigo-600 to-blue-700 shadow-[0_8px_20px_-4px_rgba(2,132,199,0.5),inset_0_2px_3px_rgba(255,255,255,0.7)] border border-sky-200/60 flex items-center justify-center overflow-hidden">
        <div className="absolute -top-2 left-0 right-0 h-5 bg-gradient-to-b from-white/60 to-transparent rounded-full pointer-events-none" />
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] relative z-10">
          {/* Frontispicio triangular */}
          <path d="M12 2L3 7H21L12 2Z" fill="#ffffff" />
          {/* Columnas */}
          <rect x="5" y="8" width="2" height="9" fill="#ffffff" />
          <rect x="9.5" y="8" width="2" height="9" fill="#ffffff" />
          <rect x="14" y="8" width="2" height="9" fill="#ffffff" />
          <rect x="18.5" y="8" width="2" height="9" fill="#ffffff" />
          {/* Base */}
          <rect x="2" y="18" width="20" height="2.5" rx="0.5" fill="#ffffff" />
          {/* Puerta central */}
          <path d="M10.5 18V13.5C10.5 12.7 11.2 12 12 12C12.8 12 13.5 12.7 13.5 13.5V18H10.5Z" fill="#fef08a" />
        </svg>
      </div>
    </motion.div>
  );
}



// ========================================================
// 10. ICONO 3D DE CALENDARIO / AÑOS ESCOLARES (IconScout Style)
// ========================================================
export function Calendar3DIcon({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <motion.div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      animate={{
        y: [0, -3.5, 0],
        rotateZ: [-2.5, 2.5, -2.5],
        scale: [1, 1.05, 1]
      }}
      transition={{ repeat: Infinity, duration: 3.8, ease: 'easeInOut' }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-500 to-green-600 blur-md opacity-60 pointer-events-none" />
      <div className="relative w-full h-full rounded-2xl p-1.5 bg-gradient-to-br from-emerald-400 via-teal-500 to-green-700 shadow-[0_8px_20px_-4px_rgba(16,185,129,0.5),inset_0_2px_3px_rgba(255,255,255,0.7)] border border-emerald-200/60 flex items-center justify-center overflow-hidden">
        <div className="absolute -top-2 left-0 right-0 h-5 bg-gradient-to-b from-white/60 to-transparent rounded-full pointer-events-none" />
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] relative z-10">
          <rect x="3" y="5" width="18" height="16" rx="3" fill="#ffffff" />
          <path d="M3 8C3 6.34 4.34 5 6 5H18C19.66 5 21 6.34 21 8V9H3V8Z" fill="#ef4444" />
          <rect x="7" y="2" width="2" height="4" rx="1" fill="#ffffff" />
          <rect x="15" y="2" width="2" height="4" rx="1" fill="#ffffff" />
          {/* Cuadrícula de días */}
          <circle cx="7.5" cy="12.5" r="1.2" fill="#10b981" />
          <circle cx="12" cy="12.5" r="1.2" fill="#10b981" />
          <circle cx="16.5" cy="12.5" r="1.2" fill="#10b981" />
          <circle cx="7.5" cy="16.5" r="1.2" fill="#10b981" />
          <circle cx="12" cy="16.5" r="1.2" fill="#10b981" />
          <circle cx="16.5" cy="16.5" r="1.2" fill="#f59e0b" />
        </svg>
      </div>
    </motion.div>
  );
}



// ========================================================
// 12. ICONO 3D DE MANTENIMIENTO & COPIAS DE SEGURIDAD (IconScout Style)
// ========================================================
export function BackupMaintenance3DIcon({ size = 46, className = '' }: { size?: number; className?: string }) {
  return (
    <motion.div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      animate={{
        y: [0, -4, 0],
        rotateY: [0, 8, -8, 0],
        rotateZ: [0, 1.5, -1.5, 0]
      }}
      transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
    >
      {/* Halo de resplandor esmeralda / cian de seguridad */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-400 via-teal-500 to-sky-600 blur-md opacity-60 pointer-events-none"
        animate={{ scale: [0.95, 1.15, 0.95], opacity: [0.5, 0.8, 0.5] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      />

      {/* Cápsula base 3D con cristal y profundidad */}
      <div className="relative w-full h-full rounded-2xl p-2 bg-gradient-to-br from-emerald-500 via-teal-600 to-sky-800 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.5),inset_0_2px_3px_rgba(255,255,255,0.7),inset_0_-2px_4px_rgba(0,0,0,0.3)] border border-emerald-300/60 flex items-center justify-center overflow-hidden">
        {/* Reflejo especular superior curvo */}
        <div className="absolute -top-3 left-0 right-0 h-7 bg-gradient-to-b from-white/45 via-white/20 to-transparent rounded-full transform -rotate-12 pointer-events-none" />

        {/* Anillo orbital */}
        <motion.div
          className="absolute inset-1 rounded-xl border border-dashed border-emerald-200/40 pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
        />

        {/* Ilustración 3D de Base de Datos y Nube de Respaldo */}
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)] relative z-10">
          <defs>
            <linearGradient id="dbDisk3D" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#a7f3d0" />
              <stop offset="80%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="cloudGrad3D" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <linearGradient id="arrowGrad3D" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
          </defs>

          {/* Disco Base 3 (inferior) */}
          <path d="M4 17.5C4 19 7.6 20.2 12 20.2C16.4 20.2 20 19 20 17.5V19.5C20 21 16.4 22.2 12 22.2C7.6 22.2 4 21 4 19.5V17.5Z" fill="#065f46" />
          <path d="M4 14.5C4 16 7.6 17.2 12 17.2C16.4 17.2 20 16 20 14.5V16.5C20 18 16.4 19.2 12 19.2C7.6 19.2 4 18 4 16.5V14.5Z" fill="#047857" />
          {/* Disco Base 2 (medio) */}
          <path d="M4 11.5C4 13 7.6 14.2 12 14.2C16.4 14.2 20 13 20 11.5V13.5C20 15 16.4 16.2 12 16.2C7.6 16.2 4 15 4 13.5V11.5Z" fill="#059669" />
          {/* Disco Base 1 (superior) */}
          <path d="M4 8.5C4 10 7.6 11.2 12 11.2C16.4 11.2 20 10 20 8.5V10.5C20 12 16.4 13.2 12 13.2C7.6 13.2 4 12 4 10.5V8.5Z" fill="#10b981" />
          {/* Tapa del disco */}
          <ellipse cx="12" cy="8.5" rx="8" ry="2.7" fill="url(#dbDisk3D)" />

          {/* Nube Flotante de Drive en la esquina superior */}
          <path
            d="M17.5 10.5C18.9 10.5 20 9.4 20 8C20 6.8 19.1 5.7 18 5.5C17.7 3.5 16 2 14 2C12.4 2 11 2.9 10.4 4.2C9.9 4.1 9.5 4 9 4C7.3 4 6 5.3 6 7C6 7.2 6 7.3 6.1 7.5C5.4 7.9 5 8.7 5 9.5C5 10.6 5.9 11.5 7 11.5H17.5Z"
            fill="url(#cloudGrad3D)"
            opacity="0.95"
          />

          {/* Flecha de Subida Segura */}
          <path
            d="M12 4.5L14.2 6.8H12.8V9.5H11.2V6.8H9.8L12 4.5Z"
            fill="url(#arrowGrad3D)"
          />
        </svg>
      </div>
    </motion.div>
  );
}

// ========================================================
// 13. ICONO 3D DE FASES / MOMENTOS / CAPAS (IconScout Style)
// ========================================================
export function Layers3DIcon({ size = 36, className = '' }: { size?: number; className?: string }) {
  return (
    <motion.div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      animate={{
        y: [0, -3.8, 0],
        rotateX: [0, 10, 0]
      }}
      transition={{ repeat: Infinity, duration: 3.6, ease: 'easeInOut' }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-400 via-indigo-500 to-pink-500 blur-md opacity-60 pointer-events-none" />
      <div className="relative w-full h-full rounded-2xl p-1.5 bg-gradient-to-br from-purple-400 via-indigo-600 to-pink-600 shadow-[0_8px_20px_-4px_rgba(147,51,234,0.5),inset_0_2px_3px_rgba(255,255,255,0.7)] border border-purple-200/60 flex items-center justify-center overflow-hidden">
        <div className="absolute -top-2 left-0 right-0 h-5 bg-gradient-to-b from-white/60 to-transparent rounded-full pointer-events-none" />
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] relative z-10">
          <polygon points="12,2 2,7 12,12 22,7" fill="#ffffff" />
          <polygon points="2,12 12,17 22,12 19,10.5 12,14 5,10.5" fill="#e0e7ff" />
          <polygon points="2,17 12,22 22,17 19,15.5 12,19 5,15.5" fill="#c7d2fe" />
        </svg>
      </div>
    </motion.div>
  );
}
