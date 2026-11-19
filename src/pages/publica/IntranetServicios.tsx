import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  CreditCard,
  CheckCircle,
  Bus,
  Calendar,
  ArrowLeft,
  KeyRound,
  Download,
  AlertCircle,
  HelpCircle,
  Printer,
  ShieldCheck,
  Check,
  Briefcase
} from 'lucide-react';
import { HeaderInstitucionalSIGA } from '../../components/layout/HeaderInstitucionalSIGA';
import { supabase } from '../../lib/supabase';
import '../../siga_vit_theme.css';

type TabTipo = 'inicio' | 'codigo' | 'recibos' | 'permisos' | 'constancias' | 'certificaciones' | 'transporte';

export const IntranetServicios: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab activo sincronizado con URL query param (?tab=...)
  const tabParam = (searchParams.get('tab') as TabTipo) || 'inicio';
  const [tabActivo, setTabActivo] = useState<TabTipo>(tabParam);

  useEffect(() => {
    const t = searchParams.get('tab') as TabTipo;
    if (t && ['inicio', 'codigo', 'recibos', 'permisos', 'constancias', 'certificaciones', 'transporte'].includes(t)) {
      setTabActivo(t);
    }
  }, [searchParams]);

  const cambiarTab = (nuevoTab: TabTipo) => {
    setTabActivo(nuevoTab);
    setSearchParams({ tab: nuevoTab });
    setError('');
    setExito('');
  };

  // Estados de formularios compartidos
  const [cedula, setCedula] = useState<string>('');
  const [cuentaNomina, setCuentaNomina] = useState<string>('');
  const [fechaIngreso, setFechaIngreso] = useState<string>('');
  const [codigoVerificacion, setCodigoVerificacion] = useState<string>('');
  const [tipoSueldo, setTipoSueldo] = useState<string>('SUELDO INTEGRAL');
  const [tipoConstancia, setTipoConstancia] = useState<'trabajo' | 'estudio'>('trabajo');
  const [quincena, setQuincena] = useState<string>('01/11/2026 al 15/11/2026');
  const [plantel, setPlantel] = useState<'sb' | 'lb'>('sb');
  
  // Estados de resultado
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [exito, setExito] = useState<string>('');
  const [documentoGenerado, setDocumentoGenerado] = useState<any | null>(null);

  // Manejador: Generar Constancia
  const handleGenerarConstancia = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setExito('');
    setDocumentoGenerado(null);

    if (!cedula.trim()) {
      setError('Ingrese su número de cédula.');
      return;
    }

    setCargando(true);

    try {
      const numCedula = cedula.replace(/\D/g, '');
      const codigoDoc = `SIGAE-${plantel.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Simulación de emisión con validación en tiempo real
      setTimeout(() => {
        setDocumentoGenerado({
          codigo: codigoDoc,
          fecha: new Date().toLocaleDateString('es-VE'),
          cedula: numCedula,
          tipo: tipoConstancia === 'trabajo' ? 'Constancia de Trabajo' : 'Constancia de Estudio / Inscripción',
          sueldo: tipoSueldo,
          plantel: plantel === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar'
        });
        setExito('¡Constancia generada exitosamente! Ya puede descargarla o imprimirla.');
        setCargando(false);
      }, 700);
    } catch (err) {
      setError('Error al procesar la solicitud.');
      setCargando(false);
    }
  };

  // Manejador: Consultar Certificación de Documentos
  const handleConsultarCertificacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoVerificacion.trim()) {
      setError('Ingrese el código de verificación que se encuentra al pie del documento.');
      return;
    }
    navigate(`/validar-constancia/${encodeURIComponent(codigoVerificacion.trim())}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F5F9] font-sans">
      {/* 1. Cabecera Angular Institucional */}
      <HeaderInstitucionalSIGA />

      {/* 2. Barra de Menú Horizontal de la Intranet (Estilo SIGA VIT) */}
      <nav className="siga-navbar-tabs" aria-label="Menú de Servicios al Trabajador">
        <button
          type="button"
          onClick={() => cambiarTab('inicio')}
          className={`siga-tab-item ${tabActivo === 'inicio' ? 'active' : ''}`}
        >
          <span>Inicio</span>
        </button>

        <button
          type="button"
          onClick={() => cambiarTab('codigo')}
          className={`siga-tab-item ${tabActivo === 'codigo' ? 'active' : ''}`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Código de Verificación</span>
        </button>

        <button
          type="button"
          onClick={() => cambiarTab('recibos')}
          className={`siga-tab-item ${tabActivo === 'recibos' ? 'active' : ''}`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Recibo de Pago</span>
        </button>

        <button
          type="button"
          onClick={() => cambiarTab('permisos')}
          className={`siga-tab-item ${tabActivo === 'permisos' ? 'active' : ''}`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Solicitud de Permisos</span>
        </button>

        <button
          type="button"
          onClick={() => cambiarTab('constancias')}
          className={`siga-tab-item ${tabActivo === 'constancias' ? 'active' : ''}`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Constancias de Trabajo</span>
        </button>

        <button
          type="button"
          onClick={() => cambiarTab('certificaciones')}
          className={`siga-tab-item ${tabActivo === 'certificaciones' ? 'active' : ''}`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Certificación de Documentos</span>
        </button>

        <button
          type="button"
          onClick={() => cambiarTab('transporte')}
          className={`siga-tab-item ${tabActivo === 'transporte' ? 'active' : ''}`}
        >
          <Bus className="w-3.5 h-3.5" />
          <span>Rutas Escolares</span>
        </button>
      </nav>

      {/* 3. Área Central de Contenido del Trámite */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-6 sm:p-10 relative overflow-hidden">
          
          {/* Botón Flotante para Regresar a la Portada Web */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0284c7] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la Portada Principal</span>
            </Link>
            <span className="text-xs font-semibold text-slate-400">
              Módulo de Autogestión Escolar
            </span>
          </div>

          {/* Alertas de Éxito o Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </motion.div>
          )}

          {exito && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2"
            >
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{exito}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* ── TAB 1: INICIO Y ORIENTACIÓN ── */}
            {tabActivo === 'inicio' && (
              <motion.div
                key="tab-inicio"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4"
              >
                <h2 className="text-xl sm:text-2xl font-black text-[#0A2E5C] tracking-tight uppercase mb-4">
                  Servicios al Trabajador y Representante
                </h2>

                <div className="my-8 flex justify-center">
                  <div className="w-28 h-28 rounded-full bg-slate-100 border-4 border-slate-200 flex items-center justify-center p-4 filter drop-shadow-sm">
                    <img
                      src="/img/sigae-logo.png"
                      alt="SIGAE"
                      className="w-full h-full object-contain filter grayscale opacity-70"
                    />
                  </div>
                </div>

                <div className="max-w-xl mx-auto text-xs sm:text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p className="font-semibold text-slate-800">
                    Para poder generar cualquiera de las solicitudes a través del sistema deberá poseer su{' '}
                    <button
                      type="button"
                      onClick={() => cambiarTab('codigo')}
                      className="text-blue-600 font-extrabold underline cursor-pointer hover:text-blue-800"
                    >
                      CÓDIGO DE VERIFICACIÓN
                    </button>.
                  </p>
                  <p>
                    El cual deberá solicitarlo en la opción{' '}
                    <strong>"Código de Verificación"</strong> del menú superior institucional.
                  </p>
                  <p className="pt-2 text-slate-500">
                    Si presenta dudas o inconvenientes con sus datos, envíe un correo electrónico a{' '}
                    <a href="mailto:soporte@sigae.gob.ve" className="text-blue-600 font-bold hover:underline">
                      soporte@sigae.gob.ve
                    </a>
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── TAB 2: CÓDIGO DE VERIFICACIÓN ── */}
            {tabActivo === 'codigo' && (
              <motion.div
                key="tab-codigo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-lg sm:text-xl font-black text-[#0A2E5C] text-center tracking-tight uppercase mb-6">
                  Solicitud de Código de Verificación
                </h2>

                <form className="max-w-lg mx-auto space-y-4" onSubmit={(e) => {
                  e.preventDefault();
                  setExito('Su código de verificación ha sido enviado al correo electrónico registrado en su ficha.');
                }}>
                  <div>
                    <label className="siga-label">Cédula de Identidad:</label>
                    <input
                      type="text"
                      required
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      placeholder="Ej: 12345678 (solo números)"
                      className="siga-input"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Ingrese sólo números sin puntos ni letras</p>
                  </div>

                  <div>
                    <label className="siga-label">N° de Cuenta Nómina / Teléfono:</label>
                    <input
                      type="text"
                      required
                      value={cuentaNomina}
                      onChange={(e) => setCuentaNomina(e.target.value)}
                      placeholder="Últimos 4 dígitos de la cuenta bancaria"
                      className="siga-input"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Últimos 4 dígitos para validar identidad</p>
                  </div>

                  <div>
                    <label className="siga-label">Plantel Adscrito:</label>
                    <select
                      value={plantel}
                      onChange={(e) => setPlantel(e.target.value as any)}
                      className="siga-input"
                    >
                      <option value="sb">U.E. Santa Bárbara</option>
                      <option value="lb">U.E. Libertador Bolívar</option>
                    </select>
                  </div>

                  <div className="flex justify-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => cambiarTab('inicio')}
                      className="px-6 py-2 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs"
                    >
                      Regresar
                    </button>
                    <button
                      type="submit"
                      className="siga-btn-primary siga-btn-round"
                    >
                      Solicitar Código
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── TAB 3: RECIBO DE PAGO ── */}
            {tabActivo === 'recibos' && (
              <motion.div
                key="tab-recibos"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-lg sm:text-xl font-black text-[#0A2E5C] text-center tracking-tight uppercase mb-6">
                  Consultar Recibos de Pago
                </h2>

                <form className="max-w-lg mx-auto space-y-4" onSubmit={(e) => {
                  e.preventDefault();
                  setExito('Comprobante de pago localizado. Puede descargarlo a continuación.');
                }}>
                  <div>
                    <label className="siga-label">Cédula:</label>
                    <input
                      type="text"
                      required
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      placeholder="12345678"
                      className="siga-input"
                    />
                    <p className="text-[11px] text-red-600 mt-0.5">Ingrese solo números</p>
                  </div>

                  <div>
                    <label className="siga-label">N° de Cuenta Nómina:</label>
                    <input
                      type="text"
                      required
                      value={cuentaNomina}
                      onChange={(e) => setCuentaNomina(e.target.value)}
                      placeholder="Últimos 4 dígitos"
                      maxLength={4}
                      className="siga-input"
                    />
                    <p className="text-[11px] text-red-600 mt-0.5">Últimos 4 dígitos de la Cuenta Nómina</p>
                  </div>

                  <div>
                    <label className="siga-label">Fecha de Ingreso:</label>
                    <input
                      type="text"
                      required
                      value={fechaIngreso}
                      onChange={(e) => setFechaIngreso(e.target.value)}
                      placeholder="dd/mm/aaaa"
                      className="siga-input"
                    />
                    <p className="text-[11px] text-red-600 mt-0.5">Formato dd/mm/aaaa</p>
                  </div>

                  <div>
                    <label className="siga-label">Quincena a Consultar:</label>
                    <select
                      value={quincena}
                      onChange={(e) => setQuincena(e.target.value)}
                      className="siga-input text-xs font-semibold"
                    >
                      <option value="01/11/2026 al 15/11/2026">01/11/2026 al 15/11/2026 (Primera Quincena Noviembre)</option>
                      <option value="16/10/2026 al 31/10/2026">16/10/2026 al 31/10/2026 (Segunda Quincena Octubre)</option>
                      <option value="01/10/2026 al 15/10/2026">01/10/2026 al 15/10/2026 (Primera Quincena Octubre)</option>
                    </select>
                    <p className="text-[11px] text-red-600 mt-0.5">Seleccione la Quincena</p>
                  </div>

                  <div className="flex justify-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => cambiarTab('inicio')}
                      className="px-6 py-2 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs"
                    >
                      Regresar
                    </button>
                    <button
                      type="submit"
                      className="siga-btn-primary siga-btn-round"
                    >
                      Consultar Recibo
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── TAB 4: CONSTANCIAS DE TRABAJO Y ESTUDIO ── */}
            {tabActivo === 'constancias' && (
              <motion.div
                key="tab-constancias"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-lg sm:text-xl font-black text-[#0A2E5C] text-center tracking-tight uppercase mb-6">
                  Constancias de Trabajo y Estudio
                </h2>

                <form className="max-w-lg mx-auto space-y-4" onSubmit={handleGenerarConstancia}>
                  <div>
                    <label className="siga-label">Modalidad de Constancia:</label>
                    <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setTipoConstancia('trabajo')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                          tipoConstancia === 'trabajo' ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        Personal (Trabajo)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipoConstancia('estudio')}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                          tipoConstancia === 'estudio' ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        Estudiante (Estudio)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="siga-label">Cédula de Identidad:</label>
                    <input
                      type="text"
                      required
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      placeholder="12345678"
                      className="siga-input"
                    />
                    <p className="text-[11px] text-blue-600 mt-0.5">Ingrese sólo números</p>
                  </div>

                  <div>
                    <label className="siga-label">N° de Cuenta Nómina:</label>
                    <input
                      type="text"
                      value={cuentaNomina}
                      onChange={(e) => setCuentaNomina(e.target.value)}
                      placeholder="Últimos 6 dígitos de la Cuenta Nómina"
                      maxLength={6}
                      className="siga-input"
                    />
                    <p className="text-[11px] text-blue-600 mt-0.5">Últimos 6 dígitos de la Cuenta Nómina</p>
                  </div>

                  <div>
                    <label className="siga-label">Fecha Ingreso / Nacimiento:</label>
                    <input
                      type="text"
                      value={fechaIngreso}
                      onChange={(e) => setFechaIngreso(e.target.value)}
                      placeholder="Formato dd/mm/aaaa"
                      className="siga-input"
                    />
                    <p className="text-[11px] text-blue-600 mt-0.5">Formato dd/mm/aaaa</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="siga-label">Código de Verificación:</label>
                      <button
                        type="button"
                        onClick={() => cambiarTab('codigo')}
                        className="text-[11px] font-bold text-blue-600 underline cursor-pointer"
                      >
                        ¿No tiene código de verificación?
                      </button>
                    </div>
                    <input
                      type="text"
                      value={codigoVerificacion}
                      onChange={(e) => setCodigoVerificacion(e.target.value)}
                      placeholder="Ingrese su código de verificación"
                      className="siga-input"
                    />
                    <p className="text-[11px] text-blue-600 mt-0.5">Ingrese su código de verificación</p>
                  </div>

                  {tipoConstancia === 'trabajo' && (
                    <div>
                      <label className="siga-label">Tipo de Sueldo:</label>
                      <select
                        value={tipoSueldo}
                        onChange={(e) => setTipoSueldo(e.target.value)}
                        className="siga-input text-xs font-semibold"
                      >
                        <option value="SUELDO INTEGRAL">SUELDO INTEGRAL</option>
                        <option value="SUELDO BASICO">SUELDO BÁSICO</option>
                        <option value="SUELDO NORMAL">SUELDO NORMAL</option>
                        <option value="EXCLUIR SUELDO NORMAL">EXCLUIR SUELDO NORMAL</option>
                        <option value="EXCLUIR CESTATICKET">EXCLUIR BENEFICIO DE ALIMENTACIÓN</option>
                      </select>
                      
                      {/* Notas Explicativas en Rojo estilo SIGA VIT */}
                      <div className="text-[10.5px] text-red-600 space-y-0.5 mt-2 bg-red-50/50 p-2.5 rounded-lg border border-red-100">
                        <p>* Sueldo Integral: Salario Básico + Primas con Alícuota de Bono Vacaciones - Utilidades.</p>
                        <p>* Sueldo Básico: Sólo Salario Base.</p>
                        <p>* Sueldo Normal: Primas y Beneficio de Alimentación Incluidos.</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => cambiarTab('inicio')}
                      className="px-6 py-2 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs"
                    >
                      Regresar
                    </button>
                    <button
                      type="submit"
                      disabled={cargando}
                      className="siga-btn-primary siga-btn-round"
                    >
                      {cargando ? 'Generando...' : 'Generar Constancia'}
                    </button>
                  </div>
                </form>

                {/* Resultado de Documento Generado */}
                {documentoGenerado && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-700">{documentoGenerado.tipo}</p>
                        <p className="text-[11px] text-slate-500 font-mono">Código: {documentoGenerado.codigo}</p>
                      </div>
                      <Link
                        to={`/validar-constancia/${documentoGenerado.codigo}`}
                        className="siga-btn-primary text-xs py-1.5 px-3.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Ver e Imprimir</span>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── TAB 5: CERTIFICACIÓN DE DOCUMENTOS (PÚBLICO) ── */}
            {tabActivo === 'certificaciones' && (
              <motion.div
                key="tab-certificaciones"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-lg sm:text-xl font-black text-[#0A2E5C] text-center tracking-tight uppercase mb-6">
                  Certificación de Documentos
                </h2>

                <form className="max-w-lg mx-auto space-y-5" onSubmit={handleConsultarCertificacion}>
                  <div>
                    <label className="siga-label">Código de Verificación:</label>
                    <input
                      type="text"
                      required
                      value={codigoVerificacion}
                      onChange={(e) => setCodigoVerificacion(e.target.value)}
                      placeholder="Ingrese el código de verificación del documento"
                      className="siga-input text-center font-mono font-bold tracking-wider uppercase"
                    />
                    <p className="text-[11px] text-red-600 mt-1 text-center">
                      Ingrese el código alfanumérico tal como aparece en el documento
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 bg-sky-50/70 border border-sky-100 rounded-xl text-center">
                    <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center mb-2 font-black text-sm">
                      i
                    </div>
                    <p className="text-xs text-sky-900 font-bold">
                      NOTA: El código de verificación se encuentra en la parte inferior del documento impreso.
                    </p>
                  </div>

                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => cambiarTab('inicio')}
                      className="px-6 py-2 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs"
                    >
                      Regresar
                    </button>
                    <button
                      type="submit"
                      className="siga-btn-primary siga-btn-round"
                    >
                      Consultar
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── TAB 6: SOLICITUD DE PERMISOS ── */}
            {tabActivo === 'permisos' && (
              <motion.div
                key="tab-permisos"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-lg sm:text-xl font-black text-[#0A2E5C] text-center tracking-tight uppercase mb-6">
                  Solicitud de Permisos Laborales
                </h2>

                <form className="max-w-lg mx-auto space-y-4" onSubmit={(e) => {
                  e.preventDefault();
                  setExito('Solicitud de permiso registrada bajo revisión de la Dirección del Plantel.');
                }}>
                  <div>
                    <label className="siga-label">Cédula del Trabajador:</label>
                    <input
                      type="text"
                      required
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      placeholder="12345678"
                      className="siga-input"
                    />
                  </div>

                  <div>
                    <label className="siga-label">Motivo del Permiso:</label>
                    <select className="siga-input text-xs font-semibold">
                      <option>Asuntos Personales / Médicos</option>
                      <option>Reposo Médico Avalado (IVSS)</option>
                      <option>Capacitación / Formación Docente</option>
                      <option>Duelo Familiar</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="siga-label">Fecha Desde:</label>
                      <input type="date" required className="siga-input text-xs" />
                    </div>
                    <div>
                      <label className="siga-label">Fecha Hasta:</label>
                      <input type="date" required className="siga-input text-xs" />
                    </div>
                  </div>

                  <div className="flex justify-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => cambiarTab('inicio')}
                      className="px-6 py-2 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs"
                    >
                      Regresar
                    </button>
                    <button
                      type="submit"
                      className="siga-btn-primary siga-btn-round"
                    >
                      Registrar Permiso
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── TAB 7: RUTAS ESCOLARES ── */}
            {tabActivo === 'transporte' && (
              <motion.div
                key="tab-transporte"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-lg sm:text-xl font-black text-[#0A2E5C] text-center tracking-tight uppercase mb-6">
                  Rutas de Transporte Escolar
                </h2>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Bus className="w-4 h-4 text-blue-600" />
                      <span>Rutas U.E. Santa Bárbara</span>
                    </h3>
                    <ul className="mt-2 text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                      <li>Ruta 1: Campo Rojo &bull; Unidad 02 (Ford Interceptor)</li>
                      <li>Ruta 2: Osiris - El Samán &bull; Unidad 03 (Encava)</li>
                      <li>Ruta 5: La Esmeralda &bull; Unidad 04 (Encava)</li>
                      <li>Ruta 8: Casupal - El Tejero &bull; Unidad 06 (Yutong)</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Bus className="w-4 h-4 text-blue-600" />
                      <span>Rutas U.E. Libertador Bolívar</span>
                    </h3>
                    <ul className="mt-2 text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                      <li>Ruta 1: Puertas del Sur &bull; Unidad 01 (Yutong)</li>
                      <li>Ruta 2: Las Flores &bull; Unidad 05 (Encava)</li>
                      <li>Ruta 4: Las Vírgenes &bull; Unidad 07 (Encava)</li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-center pt-6">
                  <button
                    type="button"
                    onClick={() => cambiarTab('inicio')}
                    className="siga-btn-primary siga-btn-round"
                  >
                    Regresar al Menú de Servicios
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Gráfica lineal arquitectónica institucional al pie (Estilo fachada VIT) */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center select-none opacity-80">
            <div className="h-12 w-full flex items-center justify-center text-amber-500/40">
              <svg viewBox="0 0 400 60" className="w-64 h-auto stroke-current fill-none stroke-[1.5]">
                <path d="M 10 50 L 50 50 L 50 20 L 100 20 L 100 10 L 200 10 L 200 20 L 250 20 L 250 50 L 390 50" />
                <rect x="120" y="25" width="20" height="25" />
                <rect x="160" y="25" width="20" height="25" />
                <line x1="10" y1="52" x2="390" y2="52" strokeWidth="2" />
              </svg>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase text-center mt-1">
              Complejo Educativo DEP Oriente &bull; U.E. Santa Bárbara &bull; U.E. Libertador Bolívar
            </p>
          </div>
        </div>
      </main>

      {/* 4. Footer Oficial */}
      <footer className="siga-footer-official">
        <p className="text-xs font-bold text-slate-700">
          República Bolivariana de Venezuela &bull; Ministerio del Poder Popular para la Educación
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          SIGAE &bull; Sistema Integral de Gestión y Administración Escolar &bull; Versión 1.3
        </p>
      </footer>
    </div>
  );
};
