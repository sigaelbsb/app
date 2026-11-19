import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  CreditCard,
  CheckCircle,
  Bus,
  Calendar,
  LogIn,
  Eye,
  EyeOff,
  AlertCircle,
  School,
  ArrowRight,
  ShieldCheck,
  Users,
  FileCheck2,
  Lock,
  User,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { HeaderInstitucionalSIGA } from '../../components/layout/HeaderInstitucionalSIGA';
import { registrarSesionActiva } from '../../utils/activeSessionsHelper';
import '../../siga_vit_theme.css';

interface WebPrincipalSIGAProps {
  onLogin?: (usuario: any) => void;
}

export const WebPrincipalSIGA: React.FC<WebPrincipalSIGAProps> = ({ onLogin }) => {
  const navigate = useNavigate();

  // Estados del Formulario de Gestión Administrativa
  const [escuela, setEscuela] = useState<'sb' | 'lb'>('sb');
  const [anoEscolar, setAnoEscolar] = useState<string>('2025-2026');
  const [identificador, setIdentificador] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [mostrarPassword, setMostrarPassword] = useState<boolean>(false);
  const [capsLockActivo, setCapsLockActivo] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Detector de Tecla Bloq Mayús (CapLock)
  const handleKeyUpPassword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockActivo(e.getModifierState('CapsLock'));
    }
  };

  const handleLoginAdministrativo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identificador.trim()) {
      setError('Por favor ingrese su usuario o cédula.');
      return;
    }
    if (!password) {
      setError('Por favor ingrese su contraseña.');
      return;
    }

    setCargando(true);

    try {
      const idLimpio = identificador.trim();
      const soloNumeros = idLimpio.replace(/\D/g, '');

      let query = supabase.from('usuarios').select('*');
      if (soloNumeros.length >= 5) {
        query = query.or(`cedula.eq.${soloNumeros},cedula.eq.${idLimpio}`);
      } else {
        query = query.eq('cedula', idLimpio);
      }

      const { data: usuario, error: dbError } = await query.maybeSingle();

      if (dbError || !usuario) {
        setError('Usuario no registrado o credenciales inválidas.');
        setCargando(false);
        return;
      }

      if (usuario.clave !== password) {
        setError('Contraseña incorrecta. Verifique sus credenciales.');
        setCargando(false);
        return;
      }

      // Guardar contexto de escuela y año escolar seleccionado
      localStorage.setItem('sigae_escuela_codigo', escuela);
      localStorage.setItem('sigae_escuela_activa', escuela);
      localStorage.setItem('sigae_ano_escolar_activo', anoEscolar);
      localStorage.setItem('usuario_sigae', JSON.stringify(usuario));
      localStorage.setItem('sesion_sigae', 'activa');

      try {
        await registrarSesionActiva(usuario);
      } catch (err) {
        console.warn('Registro de sesión activa omitido:', err);
      }

      if (onLogin) {
        onLogin(usuario);
      }

      navigate('/');
    } catch (err) {
      console.error('Error de autenticación:', err);
      setError('Error al conectar con la base de datos central.');
    }

    setCargando(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#ECEFF1] font-sans">
      {/* 1. Cabecera Angular Institucional Tecnológica */}
      <HeaderInstitucionalSIGA />

      {/* 2. Cuerpo Central: Portada con Acceso Dual Estilo SIGA VIT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ── COLUMNA IZQUIERDA: GESTIÓN ADMINISTRATIVA E INTRANET ── */}
          <section className="lg:col-span-6 bg-white rounded-2xl shadow-md border border-slate-200/80 p-6 sm:p-8 relative overflow-hidden">
            {/* Medallón 3D Azul de Gestión */}
            <div className="text-center mb-6">
              <div className="siga-medallion siga-medallion-admin" title="Módulo de Gestión Administrativa">
                <FileCheck2 className="w-8 h-8 text-white filter drop-shadow-sm" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Gestión Administrativa
              </h2>
              <p className="text-xs text-slate-500 font-medium max-w-md mx-auto mt-1">
                Acceso formal para personal directivo, docente, administrativo y de supervisión
              </p>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Formulario de Acceso a la Intranet */}
            <form onSubmit={handleLoginAdministrativo} className="space-y-4">
              {/* Selector de Plantel Educativo */}
              <div>
                <label className="siga-label">Plantel Educativo:</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEscuela('sb')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      escuela === 'sb'
                        ? 'bg-white text-[#0A2E5C] shadow-sm font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <School className="w-3.5 h-3.5 text-blue-600" />
                    <span>UE Santa Bárbara</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEscuela('lb')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      escuela === 'lb'
                        ? 'bg-white text-[#0A2E5C] shadow-sm font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <School className="w-3.5 h-3.5 text-blue-600" />
                    <span>UE Libertador Bolívar</span>
                  </button>
                </div>
              </div>

              {/* Selector de Año Escolar Activo (Equivalente al Año Fiscal de VIT) */}
              <div>
                <label htmlFor="select-ano-escolar" className="siga-label">
                  Año Escolar / Período:
                </label>
                <div className="relative">
                  <select
                    id="select-ano-escolar"
                    value={anoEscolar}
                    onChange={(e) => setAnoEscolar(e.target.value)}
                    className="siga-input appearance-none pr-9 font-semibold text-slate-800"
                  >
                    <option value="2025-2026">Año Escolar 2025 - 2026 (Activo)</option>
                    <option value="2024-2025">Año Escolar 2024 - 2025 (Histórico)</option>
                    <option value="2023-2024">Año Escolar 2023 - 2024 (Histórico)</option>
                    <option value="2022-2023">Año Escolar 2022 - 2023 (Histórico)</option>
                  </select>
                  <div className="absolute right-3 inset-y-0 flex items-center pointer-events-none text-slate-500">
                    <Calendar className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Campo Usuario o Cédula */}
              <div>
                <label htmlFor="input-usuario" className="siga-label">
                  Usuario o Cédula:
                </label>
                <div className="relative">
                  <input
                    id="input-usuario"
                    type="text"
                    required
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    placeholder="Nombre de usuario o cédula"
                    style={{ paddingLeft: '38px' }}
                    className="siga-input"
                  />
                  <div className="absolute left-3.5 inset-y-0 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Campo Contraseña con detección de Bloq Mayús */}
              <div>
                <label htmlFor="input-password" className="siga-label">
                  Contraseña:
                </label>
                <div className="relative">
                  <input
                    id="input-password"
                    type={mostrarPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={handleKeyUpPassword}
                    placeholder="Ingrese su clave secreta"
                    style={{ paddingLeft: '38px', paddingRight: '38px' }}
                    className="siga-input"
                  />
                  <div className="absolute left-3.5 inset-y-0 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-3 inset-y-0 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Advertencia de Mayúsculas activadas (Estilo SIGA VIT) */}
                {capsLockActivo && (
                  <p className="mt-1.5 text-xs text-rose-600 font-bold flex items-center gap-1 animate-pulse">
                    <span>*** Teclas en mayúsculas está activado</span>
                  </p>
                )}
              </div>

              {/* Botón Iniciar Sesión */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={cargando}
                  className="siga-btn-primary siga-btn-round w-full shadow-md hover:shadow-lg disabled:opacity-60"
                >
                  {cargando ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verificando credenciales...</span>
                    </span>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Iniciar Sesión en Intranet</span>
                    </>
                  )}
                </button>
              </div>

              {/* Enlaces de Recuperación y Primer Ingreso */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                <Link to="/login" className="hover:text-blue-600 transition-colors">
                  ¿Olvidó su contraseña?
                </Link>
                <Link to="/login" className="text-blue-600 hover:text-blue-800 font-bold">
                  Primer ingreso / Registro
                </Link>
              </div>
            </form>
          </section>

          {/* ── COLUMNA DERECHA: SERVICIOS AL PERSONAL Y REPRESENTANTES ── */}
          <section className="lg:col-span-6 bg-white rounded-2xl shadow-md border border-slate-200/80 p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between">
            <div>
              {/* Medallón 3D Cian de Servicios al Trabajador */}
              <div className="text-center mb-6">
                <div className="siga-medallion siga-medallion-servicios" title="Módulo de Servicios al Personal y Comunidad">
                  <Users className="w-8 h-8 text-white filter drop-shadow-sm" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  Servicios al Trabajador
                </h2>
                <p className="text-xs text-slate-500 font-medium max-w-md mx-auto mt-1">
                  Portal de autogestión de constancias, verificación y trámites para docentes, personal y representantes
                </p>
              </div>

              {/* Listado de Servicios Clave Disponibles */}
              <div className="space-y-3 mb-6">
                <Link
                  to="/servicios?tab=constancias"
                  className="siga-service-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="siga-service-icon-box">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                        Constancias de Estudio y Trabajo
                      </h3>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Emisión instantánea con código de validación seguro
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>

                <Link
                  to="/servicios?tab=recibos"
                  className="siga-service-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="siga-service-icon-box">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                        Consulta de Recibos de Pago
                      </h3>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Historial de nómina y comprobantes por quincena
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>

                <Link
                  to="/servicios?tab=certificaciones"
                  className="siga-service-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="siga-service-icon-box">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                        Certificación de Documentos
                      </h3>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Verificación pública de autenticidad mediante código impreso
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>

                <Link
                  to="/servicios?tab=transporte"
                  className="siga-service-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="siga-service-icon-box">
                      <Bus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                        Rutas de Transporte Escolar
                      </h3>
                      <p className="text-[11px] text-slate-500 leading-tight">
                        Horarios, itinerarios y paradas para estudiantes y personal
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                </Link>
              </div>
            </div>

            {/* Botón Principal a la Intranet de Servicios */}
            <div className="pt-2">
              <Link
                to="/servicios"
                className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer text-decoration-none"
              >
                <span>Acceder al Portal de Servicios al Trabajador</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

        </div>
      </main>

      {/* 3. Pie de Página Institucional con Membrete y Sello */}
      <footer className="siga-footer-official">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <img
            src="/img/ministerio-educacion-logo.png"
            alt="Ministerio del Poder Popular para la Educación"
            className="h-7 w-auto object-contain mb-2 opacity-90"
          />
          <p className="text-xs font-bold text-slate-700">
            República Bolivariana de Venezuela &bull; Ministerio del Poder Popular para la Educación
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Escuelas Básicas DEP Oriente &bull; U.E. Santa Bárbara &bull; U.E. Libertador Bolívar
          </p>
          <div className="mt-3 flex items-center justify-center gap-6 text-[11px] text-slate-400">
            <span>Soporte Técnico: <strong className="text-slate-600">soporte@sigae.gob.ve</strong></span>
            <span>&bull;</span>
            <Link to="/app" className="hover:text-indigo-600 transition-colors font-bold text-indigo-600">
              App Móvil PWA (Lilac / iOS)
            </Link>
            <span>&bull;</span>
            <span>Versión 1.3 Oficial</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
