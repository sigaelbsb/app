
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, Check, AlertCircle } from 'lucide-react';

interface PasswordStrengthThermometerProps {
  password: string;
  confirmPassword?: string;
}

export default function PasswordStrengthThermometer({
  password,
  confirmPassword
}: PasswordStrengthThermometerProps) {
  const analysis = useMemo(() => {
    if (!password) {
      return {
        score: 0,
        percent: 0,
        label: 'Sin ingresar',
        color: '#94a3b8',
        bgClass: 'bg-slate-200',
        textClass: 'text-slate-400',
        crit: {
          minLen: false,
          hasUpper: false,
          hasLower: false,
          hasNumber: false,
          hasSymbol: false,
        }
      };
    }

    const minLen = password.length >= 6;
    const strongLen = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    let score = 0;
    if (minLen) score += 1;
    if (hasLower && hasUpper) score += 1;
    if (hasNumber) score += 1;
    if (hasSymbol || strongLen) score += 1;

    // Niveles: 1 (Muy Débil), 2 (Débil / Regular), 3 (Segura), 4 (Muy Fuerte)
    if (score === 1) {
      return {
        score: 1,
        percent: 25,
        label: 'Muy Débil',
        tempText: 'Fría (Vulnerable)',
        color: '#ef4444', // Red
        bgClass: 'bg-rose-500',
        textClass: 'text-rose-600',
        crit: { minLen, hasUpper, hasLower, hasNumber, hasSymbol }
      };
    } else if (score === 2) {
      return {
        score: 2,
        percent: 50,
        label: 'Moderada',
        tempText: 'Tibia (Básica)',
        color: '#f97316', // Orange
        bgClass: 'bg-amber-500',
        textClass: 'text-amber-600',
        crit: { minLen, hasUpper, hasLower, hasNumber, hasSymbol }
      };
    } else if (score === 3) {
      return {
        score: 3,
        percent: 75,
        label: 'Segura',
        tempText: 'Óptima (Buena)',
        color: '#0284c7', // Sky Blue
        bgClass: 'bg-sky-500',
        textClass: 'text-sky-600',
        crit: { minLen, hasUpper, hasLower, hasNumber, hasSymbol }
      };
    } else {
      return {
        score: 4,
        percent: 100,
        label: 'Muy Fuerte',
        tempText: 'Máxima Seguridad (Blindada)',
        color: '#10b981', // Emerald
        bgClass: 'bg-emerald-500',
        textClass: 'text-emerald-600',
        crit: { minLen, hasUpper, hasLower, hasNumber, hasSymbol }
      };
    }
  }, [password]);

  if (!password) return null;

  const passwordsMatch = confirmPassword && password === confirmPassword;
  const passwordsMismatch = confirmPassword && password !== confirmPassword;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: -6 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-2.5 p-3 bg-slate-50/90 rounded-2xl border border-slate-200/90 shadow-sm space-y-2.5"
    >
      {/* Encabezado del Termómetro con Nivel */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold">
          {/* Termómetro Icono SVG animado */}
          <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
              {/* Tubo de vidrio exterior */}
              <rect x="9" y="2" width="6" height="13" rx="3" stroke="#64748b" strokeWidth="1.8" />
              {/* Bulbo inferior del termómetro */}
              <circle cx="12" cy="17" r="5" stroke="#64748b" strokeWidth="1.8" />
              
              {/* Mercurio líquido animado según nivel */}
              <circle cx="12" cy="17" r="3.2" fill={analysis.color} className="transition-colors duration-500" />
              <motion.rect
                x="10.2"
                y="6"
                width="3.6"
                height={analysis.score === 1 ? 4 : analysis.score === 2 ? 7 : analysis.score === 3 ? 9 : 11}
                rx="1.8"
                fill={analysis.color}
                animate={{
                  height: analysis.score === 1 ? 4 : analysis.score === 2 ? 7 : analysis.score === 3 ? 9 : 11,
                  y: analysis.score === 1 ? 11 : analysis.score === 2 ? 8 : analysis.score === 3 ? 6 : 4
                }}
                transition={{ duration: 0.4 }}
              />
            </svg>
          </div>
          <span className="text-[11px] text-slate-700">Seguridad de Contraseña:</span>
        </div>

        <div className="flex items-center gap-1">
          <span className={`text-[11px] font-black uppercase tracking-wider ${analysis.textClass}`}>
            {analysis.label}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">({analysis.percent}%)</span>
        </div>
      </div>

      {/* Barra de Medición / Termómetro de 4 Segmentos Graduados */}
      <div className="space-y-1">
        <div className="grid grid-cols-4 gap-1.5 h-2 bg-slate-200/70 p-0.5 rounded-full overflow-hidden">
          {/* Segmento 1: Muy Débil */}
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              analysis.score >= 1 ? 'bg-rose-500 shadow-sm shadow-rose-500/40' : 'bg-transparent'
            }`}
          />
          {/* Segmento 2: Moderada */}
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              analysis.score >= 2 ? 'bg-amber-500 shadow-sm shadow-amber-500/40' : 'bg-transparent'
            }`}
          />
          {/* Segmento 3: Segura */}
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              analysis.score >= 3 ? 'bg-sky-500 shadow-sm shadow-sky-500/40' : 'bg-transparent'
            }`}
          />
          {/* Segmento 4: Muy Fuerte */}
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              analysis.score >= 4 ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40' : 'bg-transparent'
            }`}
          />
        </div>

        {/* Graduación de temperatura */}
        <div className="flex justify-between text-[9px] font-bold text-slate-400 px-1">
          <span>Débil</span>
          <span>Básica</span>
          <span>Segura</span>
          <span className="text-emerald-700">Blindada</span>
        </div>
      </div>

      {/* Lista de Requisitos Dinámicos con Checkmarks */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 border-t border-slate-200/60 text-[10px]">
        <div className={`flex items-center gap-1 ${analysis.crit.minLen ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black ${
            analysis.crit.minLen ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'
          }`}>
            {analysis.crit.minLen ? '✓' : '•'}
          </span>
          <span>Mínimo 6 caracteres</span>
        </div>

        <div className={`flex items-center gap-1 ${analysis.crit.hasUpper && analysis.crit.hasLower ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black ${
            analysis.crit.hasUpper && analysis.crit.hasLower ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'
          }`}>
            {analysis.crit.hasUpper && analysis.crit.hasLower ? '✓' : '•'}
          </span>
          <span>Mayúsculas y minúsculas</span>
        </div>

        <div className={`flex items-center gap-1 ${analysis.crit.hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black ${
            analysis.crit.hasNumber ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'
          }`}>
            {analysis.crit.hasNumber ? '✓' : '•'}
          </span>
          <span>Al menos un número (0-9)</span>
        </div>

        <div className={`flex items-center gap-1 ${analysis.crit.hasSymbol ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-black ${
            analysis.crit.hasSymbol ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'
          }`}>
            {analysis.crit.hasSymbol ? '✓' : '•'}
          </span>
          <span>Símbolo especial (!@#$)</span>
        </div>
      </div>

      {/* Indicador de Coincidencia de Contraseñas */}
      {confirmPassword && (
        <div className="pt-1 border-t border-slate-200/60">
          {passwordsMatch ? (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Las contraseñas coinciden correctamente</span>
            </div>
          ) : passwordsMismatch ? (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Las contraseñas no coinciden todavía</span>
            </div>
          ) : null}
        </div>
      )}
    </motion.div>
  );
}

