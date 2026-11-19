import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../siga_vit_theme.css';

export const HeaderInstitucionalSIGA: React.FC = () => {
  const [fechaFormateada, setFechaFormateada] = useState<string>('');

  useEffect(() => {
    const ahora = new Date();
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const diaSemana = dias[ahora.getDay()];
    const diaMes = ahora.getDate();
    const mes = meses[ahora.getMonth()];
    const anio = ahora.getFullYear();

    setFechaFormateada(`${diaSemana}, ${diaMes} de ${mes} del ${anio}`);
  }, []);

  return (
    <header className="siga-header-container">
      {/* ── Franja Poligonal Tecnológica Estilo SIGA VIT ── */}
      <div className="siga-banner-poly-wrapper">
        {/* Polígono 1: Azul Institucional con Escudos y Membrete */}
        <div className="siga-poly-blue">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Escudos Institucionales SB y LB */}
            <div className="flex items-center gap-1.5 shrink-0 bg-white/10 p-1.5 rounded-xl backdrop-blur-xs border border-white/20">
              <img
                src="/assets/img/logo_sb.png"
                alt="U.E. Santa Bárbara"
                className="h-10 sm:h-12 w-auto object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/img/sigae-logo.png';
                }}
              />
              <div className="w-[1px] h-8 bg-white/25 hidden sm:block" />
              <img
                src="/assets/img/logo_lb.png"
                alt="U.E. Libertador Bolívar"
                className="h-10 sm:h-12 w-auto object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] hidden sm:block"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/img/sigae-logo.png';
                }}
              />
            </div>

            {/* Membrete Oficial MPPE / DEP Oriente */}
            <div className="text-white leading-tight select-none">
              <p className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase text-slate-200 opacity-90">
                República Bolivariana de Venezuela
              </p>
              <p className="text-[10px] sm:text-[11px] font-extrabold uppercase text-amber-300">
                Ministerio del Poder Popular para la Educación
              </p>
              <h1 className="text-xs sm:text-sm md:text-[15px] font-black tracking-tight text-white mt-0.5">
                U.E. Santa Bárbara &bull; U.E. Libertador Bolívar
              </h1>
              <p className="text-[9px] sm:text-[10px] text-sky-200 font-medium">
                Distrito Escolar Petrolero Oriente &bull; Monagas
              </p>
            </div>
          </div>
        </div>

        {/* Polígono 2: Franja Roja Dinámica con Corte Angular */}
        <div className="siga-poly-red" />

        {/* Polígono 3: Fondo Blanco con Logotipo SIGAE */}
        <div className="siga-poly-white">
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 text-decoration-none group">
            <div className="text-right select-none hidden sm:block">
              <span className="block text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tighter leading-none group-hover:text-[#0A2E5C] transition-colors">
                SIGAE
              </span>
              <span className="block text-[10px] sm:text-[11.5px] font-bold text-slate-600 leading-tight max-w-[210px] sm:max-w-[260px] text-right mt-0.5">
                Sistema Integral de Gestión y Administración Escolar
              </span>
            </div>
            <img
              src="/img/sigae-logo.png"
              alt="SIGAE Oficial"
              className="h-12 sm:h-14 md:h-16 w-auto object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.12)] transition-transform group-hover:scale-105"
            />
          </Link>
        </div>
      </div>

      {/* ── Cintillo Inferior con Fecha Dinámica Oficial ── */}
      <div className="siga-fecha-banner flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] text-slate-500 font-semibold hidden md:inline">
            Portal Oficial de Información e Intranet Educativa
          </span>
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold border border-indigo-200 transition-colors text-decoration-none shadow-xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            📱 App Móvil (Lilac / iOS)
          </Link>
        </div>
        <span className="text-slate-800 font-bold ml-auto text-[11px] sm:text-xs">
          {fechaFormateada || 'Miércoles, 18 de Noviembre del 2026'}
        </span>
      </div>
    </header>
  );
};
