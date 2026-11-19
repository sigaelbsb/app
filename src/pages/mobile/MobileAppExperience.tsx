import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Send, 
  Search, 
  QrCode, 
  SlidersHorizontal, 
  ChevronRight, 
  MapPin, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ArrowLeft, 
  Plus, 
  Minus, 
  Compass, 
  Phone, 
  MessageSquare, 
  Star, 
  Upload, 
  Camera, 
  FileText, 
  ShieldCheck, 
  Bell, 
  User, 
  Key, 
  CreditCard, 
  Bus, 
  GraduationCap, 
  Sparkles, 
  Share2, 
  RefreshCw,
  Eye,
  Check,
  X
} from 'lucide-react';
import './mobile_app.css';

// Tipos de pantallas soportadas
type MobileScreen = 'home' | 'tramite' | 'booking' | 'track' | 'summary' | 'profile' | 'onboarding';

interface SolicitudTramite {
  id: string;
  titulo: string;
  categoria: string;
  estatus: 'In Transit' | 'Delivered' | 'Active';
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  pasoActual: number; // 1 a 4
  icono: string;
}

export const MobileAppExperience: React.FC = () => {
  const navigate = useNavigate();

  // Estado de vista en Desktop: 'interactive' (simulador 1:1) o 'showcase' (4 pantallas paralelas como el flyer)
  const [viewMode, setViewMode] = useState<'interactive' | 'showcase'>('interactive');
  
  // Pantalla activa dentro del simulador
  const [activeScreen, setActiveScreen] = useState<MobileScreen>('home');

  // Escuela activa
  const [escuelaCodigo, setEscuelaCodigo] = useState<string>(() => localStorage.getItem('sigae_escuela_codigo') || 'sb');
  const [mostrarDropdownSede, setMostrarDropdownSede] = useState(false);

  // Usuario actual
  const [usuario, setUsuario] = useState<any>(() => {
    try {
      const u = localStorage.getItem('usuario_sigae');
      return u ? JSON.parse(u) : { nombre: 'Luis Velásquez', email: 'l.velasquez@sigae.gob.ve', rol: 'Representante' };
    } catch {
      return { nombre: 'Luis Velásquez', email: 'l.velasquez@sigae.gob.ve', rol: 'Representante' };
    }
  });

  // Buscador y Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingFilter, setBookingFilter] = useState<'Active' | 'In Transit' | 'Delivered'>('Active');
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Formulario de Nuevo Trámite (Screen 2: Send Parcel)
  const [formPaso, setFormPaso] = useState<1 | 2 | 3>(1);
  const [categoriaTramite, setCategoriaTramite] = useState('Constancia de Estudio');
  const [cantidadEstudiantes, setCantidadEstudiantes] = useState('1 Estudiante');
  const [cedulaEstudiante, setCedulaEstudiante] = useState('V-30.123.456');
  const [modalidadEmision, setModalidadEmision] = useState<'Ordinaria' | 'Urgente' | 'Certificada' | 'Con Notas'>('Ordinaria');
  const [documentoAdjunto, setDocumentoAdjunto] = useState<string | null>(null);

  // Animación del Bus en Mapa (Screen 4: Tracking)
  const [busProgress, setBusProgress] = useState(65); // 0% a 100%
  const [isBusMoving, setIsBusMoving] = useState(true);
  const [mapZoom, setMapZoom] = useState(1);
  const [alertaLlamada, setAlertaLlamada] = useState<string | null>(null);

  // Base de datos de gestiones activas del usuario
  const [tramites, setTramites] = useState<SolicitudTramite[]>([
    {
      id: 'CE-8542FF',
      titulo: 'Constancia de Estudio Digital',
      categoria: 'Control de Estudios',
      estatus: 'In Transit',
      origen: 'U.E. Santa Bárbara',
      destino: 'Control de Estudios',
      fecha: '08 Julio 2026',
      hora: '10:30 AM',
      pasoActual: 3,
      icono: 'bi-file-earmark-pdf-fill'
    },
    {
      id: 'RT-SB01-CR',
      titulo: 'Ruta 1 - Campo Rojo (Unidad 02)',
      categoria: 'Transporte Escolar',
      estatus: 'In Transit',
      origen: 'Campo Rojo Garita',
      destino: 'Plantel Educativo',
      fecha: 'Hoy',
      hora: '06:45 AM',
      pasoActual: 3,
      icono: 'bi-bus-front-fill'
    },
    {
      id: 'BL-9042FF',
      titulo: 'Boletín de Notas - 2do Lapso',
      categoria: 'Evaluación y Calificaciones',
      estatus: 'In Transit',
      origen: 'Coord. Pedagógica',
      destino: 'Representante',
      fecha: 'Mañana',
      hora: '09:00 AM',
      pasoActual: 2,
      icono: 'bi-journal-bookmark-fill'
    },
    {
      id: 'IN-4421FF',
      titulo: 'Inscripción y Matrícula 2026-2027',
      categoria: 'Secretaría General',
      estatus: 'Delivered',
      origen: 'Admisiones',
      destino: 'Formalizado',
      fecha: '02 Julio 2026',
      hora: '02:15 PM',
      pasoActual: 4,
      icono: 'bi-patch-check-fill'
    }
  ]);

  // Manejo de cambio de sede
  const cambiarSede = (codigo: 'sb' | 'lb') => {
    setEscuelaCodigo(codigo);
    localStorage.setItem('sigae_escuela_codigo', codigo);
    localStorage.setItem('sigae_escuela_activa', codigo === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
    setMostrarDropdownSede(false);
  };

  // Simulación del movimiento del vehículo en el mapa
  useEffect(() => {
    if (!isBusMoving || activeScreen !== 'track') return;
    const interval = setInterval(() => {
      setBusProgress(prev => {
        if (prev >= 95) return 20;
        return prev + 1;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [isBusMoving, activeScreen]);

  // Manejo de carga de documento ficticio
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentoAdjunto(e.target.files[0].name);
    }
  };

  // Enviar nuevo trámite
  const handleFinalizarTramite = () => {
    const nuevoId = 'SOL-' + Math.floor(100000 + Math.random() * 900000);
    const nuevoTramite: SolicitudTramite = {
      id: nuevoId,
      titulo: categoriaTramite,
      categoria: modalidadEmision,
      estatus: 'Active',
      origen: escuelaCodigo === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar',
      destino: 'Control de Estudios',
      fecha: 'Hoy',
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pasoActual: 1,
      icono: 'bi-file-earmark-check-fill'
    };

    setTramites([nuevoTramite, ...tramites]);
    setActiveScreen('summary');
  };

  // Filtrado de búsquedas
  const tramitesFiltrados = tramites.filter(t => {
    const matchesSearch = t.titulo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeScreen === 'booking') {
      if (bookingFilter === 'Active') return matchesSearch && (t.estatus === 'Active' || t.estatus === 'In Transit');
      if (bookingFilter === 'In Transit') return matchesSearch && t.estatus === 'In Transit';
      if (bookingFilter === 'Delivered') return matchesSearch && t.estatus === 'Delivered';
    }
    return matchesSearch;
  });

  /* ==========================================================================
     SUB-RENDER: PANTALLA 1 (HOME)
     ========================================================================== */
  const renderHomeScreen = () => (
    <div className="animate__animated animate__fadeIn">
      {/* Top Bar con Selector de Sede y Avatar */}
      <div className="sigae-mobile-top-bar">
        <div className="relative">
          <button 
            type="button" 
            onClick={() => setMostrarDropdownSede(!mostrarDropdownSede)}
            className="sigae-school-selector-pill"
          >
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Bus className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider leading-none">
                Sede Activa
              </p>
              <p className="text-[12px] font-extrabold text-indigo-950 flex items-center gap-1 leading-tight mt-0.5">
                {escuelaCodigo === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar'}
                <span className="text-[10px] text-indigo-500">▾</span>
              </p>
            </div>
          </button>

          {mostrarDropdownSede && (
            <div className="absolute top-12 left-0 w-56 bg-white rounded-2xl shadow-xl border border-indigo-100 p-2 z-50">
              <button 
                type="button"
                onClick={() => cambiarSede('sb')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${escuelaCodigo === 'sb' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <img src="/assets/img/logo_sb.png" alt="SB" className="w-5 h-5 object-contain" />
                U.E. Santa Bárbara (Campo Rojo)
              </button>
              <button 
                type="button"
                onClick={() => cambiarSede('lb')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 mt-1 ${escuelaCodigo === 'lb' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <img src="/assets/img/logo_lb.png" alt="LB" className="w-5 h-5 object-contain" />
                U.E. Libertador Bolívar (Miraflores)
              </button>
            </div>
          )}
        </div>

        <button 
          type="button" 
          onClick={() => setActiveScreen('profile')} 
          className="relative focus:outline-none"
        >
          <img 
            src="/assets/img/avatar_docente.png" 
            alt="Usuario" 
            className="sigae-avatar-circle"
            onError={(e: any) => { e.target.src = '/img/avatars/avatar-1.png'; }}
          />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
        </button>
      </div>

      {/* Buscador de Trámites con Ícono QR */}
      <div className="sigae-search-pill-box">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input 
          type="text" 
          placeholder="Buscar con ID de trámite, estudiante o ruta..."
          className="sigae-search-pill-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button 
          type="button" 
          onClick={() => setQrModalOpen(true)}
          className="sigae-search-qr-btn"
          title="Escanear Código QR"
        >
          <QrCode className="w-4 h-4" />
        </button>
      </div>

      {/* Botones de Acción Rápida: [Send Parcel ✈] y [Track Order 🎛] */}
      <div className="sigae-quick-actions-row">
        <button 
          type="button" 
          onClick={() => { setFormPaso(1); setActiveScreen('tramite'); }}
          className="sigae-btn-quick-primary"
        >
          <Send className="w-4 h-4" />
          <span>Nuevo Trámite</span>
        </button>
        <button 
          type="button" 
          onClick={() => setActiveScreen('track')}
          className="sigae-btn-quick-secondary"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Rastreo en Vivo</span>
        </button>
      </div>

      {/* Hero Banner Promo con Mascota 3D (Zoe & Max) */}
      <div className="sigae-hero-promo-card">
        <div className="sigae-hero-promo-content">
          <div className="sigae-hero-promo-badge">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>Gestión Digital 2026</span>
          </div>
          <h2 className="sigae-hero-promo-title">
            Tu Escuela en la Palma de tu Mano
          </h2>
          <p className="sigae-hero-promo-sub">
            Emite constancias, monitorea transporte y consulta notas con firma digital.
          </p>
          <button 
            type="button" 
            onClick={() => { setFormPaso(1); setActiveScreen('tramite'); }}
            className="sigae-hero-promo-btn"
          >
            Iniciar Trámite
          </button>
        </div>
        <img 
          src="/zoe_max_duo_3d.png" 
          alt="Mascota Zoe y Max 3D" 
          className="sigae-hero-promo-mascot"
          onError={(e: any) => { e.target.src = '/zoe_3d.jpg'; }}
        />
      </div>

      {/* Sección Delivery Services / Servicios Escolares */}
      <div className="sigae-services-section">
        <div className="sigae-section-title-row">
          <h3 className="sigae-section-title">Servicios Escolares</h3>
          <span className="sigae-section-link" onClick={() => setActiveScreen('booking')}>Ver Todos</span>
        </div>
        <div className="sigae-services-scroll-container">
          <div 
            className="sigae-service-pill-card"
            onClick={() => { setCategoriaTramite('Constancia de Estudio'); setActiveScreen('tramite'); }}
          >
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="sigae-service-card-title">Constancias</p>
              <p className="sigae-service-card-desc">Emisión digital instantánea</p>
            </div>
          </div>

          <div 
            className="sigae-service-pill-card"
            onClick={() => setActiveScreen('track')}
          >
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Bus className="w-4 h-4" />
            </div>
            <div>
              <p className="sigae-service-card-title">Transporte</p>
              <p className="sigae-service-card-desc">Ruta en vivo con GPS</p>
            </div>
          </div>

          <div 
            className="sigae-service-pill-card"
            onClick={() => { setCategoriaTramite('Boletín de Calificaciones'); setActiveScreen('tramite'); }}
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <p className="sigae-service-card-title">Calificaciones</p>
              <p className="sigae-service-card-desc">Boletines y récord escolar</p>
            </div>
          </div>

          <div 
            className="sigae-service-pill-card"
            onClick={() => { setCategoriaTramite('Carnet Escolar'); setActiveScreen('tramite'); }}
          >
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <p className="sigae-service-card-title">Carnet QR</p>
              <p className="sigae-service-card-desc">Credencial inteligente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sección Active Shipment / Gestiones en Curso */}
      <div className="px-5 mb-2">
        <div className="sigae-section-title-row">
          <h3 className="sigae-section-title">Gestiones Activas</h3>
          <span className="sigae-section-link" onClick={() => setActiveScreen('booking')}>Historial</span>
        </div>
      </div>

      {/* Listado de Tarjetas Activas */}
      {tramitesFiltrados.slice(0, 2).map((item) => (
        <div key={item.id} className="sigae-shipment-card">
          <div className="sigae-shipment-card-top">
            <div className="sigae-shipment-icon-info">
              <div className="sigae-shipment-icon-box">
                <i className={`bi ${item.icono}`}></i>
              </div>
              <div>
                <h4 className="sigae-shipment-title">
                  {item.titulo}
                  <span className={`sigae-badge-status ${item.estatus === 'In Transit' ? 'sigae-badge-transit' : 'sigae-badge-delivered'}`}>
                    {item.estatus === 'In Transit' ? 'En Proceso' : 'Finalizado'}
                  </span>
                </h4>
                <p className="sigae-shipment-id">ID: #{item.id}</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setActiveScreen('track')}
              className="sigae-btn-track-live"
            >
              Track Live
            </button>
          </div>

          {/* Línea Dotted de Progreso con Checkpoints */}
          <div className="sigae-progress-track">
            <div className="sigae-progress-line-bg"></div>
            <div className={`sigae-progress-dot ${item.pasoActual >= 1 ? 'completed' : ''}`}></div>
            <div className={`sigae-progress-dot ${item.pasoActual >= 2 ? 'completed' : ''}`}></div>
            <div className={`sigae-progress-dot ${item.pasoActual >= 3 ? 'active' : ''}`}>
              {item.pasoActual === 3 && (
                <div className="sigae-progress-marker-vehicle">
                  <i className="bi bi-send-fill text-[10px]"></i>
                </div>
              )}
            </div>
            <div className={`sigae-progress-dot ${item.pasoActual >= 4 ? 'completed' : ''}`}></div>
          </div>

          {/* Origen, Tiempo y Destino */}
          <div className="sigae-shipment-meta-row">
            <div className="sigae-shipment-meta-item">
              <span className="sigae-shipment-meta-label">Desde</span>
              <span className="sigae-shipment-meta-val">{item.origen}</span>
            </div>
            <div className="sigae-shipment-meta-item text-center">
              <span className="sigae-shipment-meta-label">Fecha / Hora</span>
              <span className="sigae-shipment-meta-val">{item.hora}</span>
            </div>
            <div className="sigae-shipment-meta-item text-right">
              <span className="sigae-shipment-meta-label">Destino</span>
              <span className="sigae-shipment-meta-val">{item.destino}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  /* ==========================================================================
     SUB-RENDER: PANTALLA 2 (SEND PARCEL / NUEVO TRÁMITE)
     ========================================================================== */
  const renderTramiteScreen = () => (
    <div className="sigae-tramite-container animate__animated animate__fadeIn">
      {/* Encabezado con Botón Volver */}
      <div className="sigae-screen-header">
        <button 
          type="button" 
          onClick={() => setActiveScreen('home')} 
          className="sigae-btn-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="sigae-screen-title">Nuevo Trámite Escolar</h2>
          <p className="text-[11px] text-gray-500">Crea una nueva solicitud en simples pasos</p>
        </div>
      </div>

      <div className="sigae-tramite-card">
        {/* Stepper Superior */}
        <div className="sigae-stepper-row">
          <div className={`sigae-stepper-bar ${formPaso >= 1 ? 'active' : ''}`}></div>
          <div className={`sigae-stepper-bar ${formPaso >= 2 ? 'active' : ''}`}></div>
          <div className={`sigae-stepper-bar ${formPaso >= 3 ? 'active' : ''}`}></div>
        </div>

        {formPaso === 1 && (
          <div className="space-y-4">
            {/* Categoría de Trámite */}
            <div className="sigae-form-group">
              <label className="sigae-form-label">Categoría del Trámite</label>
              <select 
                value={categoriaTramite}
                onChange={(e) => setCategoriaTramite(e.target.value)}
                className="sigae-form-select"
              >
                <option value="Constancia de Estudio">Constancia de Estudio Digital</option>
                <option value="Carta de Buena Conducta">Carta de Buena Conducta</option>
                <option value="Inscripción y Matrícula">Formalización de Matrícula</option>
                <option value="Pase de Transporte Escolar">Asignación de Ruta Escolar</option>
                <option value="Carnet Escolar Inteligente">Carnet Estudiantil con QR</option>
                <option value="Justificativo Médico">Justificativo de Inasistencia</option>
              </select>
            </div>

            {/* Fila de Cantidad y Cédula */}
            <div className="grid grid-cols-2 gap-3">
              <div className="sigae-form-group">
                <label className="sigae-form-label">Cantidad</label>
                <select 
                  value={cantidadEstudiantes}
                  onChange={(e) => setCantidadEstudiantes(e.target.value)}
                  className="sigae-form-select"
                >
                  <option value="1 Estudiante">1 Estudiante</option>
                  <option value="2 Estudiantes">2 Estudiantes</option>
                  <option value="3 Estudiantes">3 Estudiantes</option>
                </select>
              </div>
              <div className="sigae-form-group">
                <label className="sigae-form-label">Cédula de Identidad</label>
                <input 
                  type="text" 
                  value={cedulaEstudiante}
                  onChange={(e) => setCedulaEstudiante(e.target.value)}
                  className="sigae-form-input"
                  placeholder="V-00.000.000"
                />
              </div>
            </div>

            {/* Modalidad de Emisión (Pills) */}
            <div className="sigae-form-group">
              <label className="sigae-form-label">Modalidad de Emisión</label>
              <div className="sigae-size-pills-row">
                {(['Ordinaria', 'Urgente', 'Certificada', 'Con Notas'] as const).map((modo) => (
                  <button
                    key={modo}
                    type="button"
                    onClick={() => setModalidadEmision(modo)}
                    className={`sigae-size-pill ${modalidadEmision === modo ? 'active' : ''}`}
                  >
                    {modo}
                  </button>
                ))}
              </div>
            </div>

            {/* Caja de Subida Dashed */}
            <div className="sigae-form-group">
              <label className="sigae-form-label">Adjuntar Recaudo o Cédula (Opcional)</label>
              <label className="sigae-upload-box block">
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                />
                <div className="sigae-upload-icon-circle">
                  <Camera className="w-5 h-5" />
                </div>
                <p className="sigae-upload-title">
                  {documentoAdjunto || 'Abrir Cámara o Subir Archivo'}
                </p>
                <p className="sigae-upload-desc">
                  PNG, JPG o PDF (máx. 1200x800px / 10 MB)
                </p>
              </label>
            </div>

            <button 
              type="button" 
              onClick={() => setFormPaso(2)}
              className="w-full mt-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-full shadow-lg shadow-indigo-200 transition-all cursor-pointer"
            >
              Continuar al Resumen
            </button>
          </div>
        )}

        {formPaso === 2 && (
          <div className="space-y-4">
            <div className="bg-indigo-50/70 rounded-2xl p-4 border border-indigo-100">
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-2">
                Resumen de la Solicitud
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Trámite:</span>
                  <span className="font-bold text-gray-800">{categoriaTramite}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Estudiante:</span>
                  <span className="font-bold text-gray-800">{cedulaEstudiante} ({cantidadEstudiantes})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Modalidad:</span>
                  <span className="font-bold text-indigo-600">{modalidadEmision}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sede:</span>
                  <span className="font-bold text-gray-800">
                    {escuelaCodigo === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar'}
                  </span>
                </div>
                {documentoAdjunto && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Adjunto:</span>
                    <span className="font-bold text-emerald-600">{documentoAdjunto}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setFormPaso(1)}
                className="w-1/3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-full"
              >
                Modificar
              </button>
              <button 
                type="button" 
                onClick={handleFinalizarTramite}
                className="w-2/3 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-full shadow-lg shadow-indigo-200"
              >
                Confirmar y Emitir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  /* ==========================================================================
     SUB-RENDER: PANTALLA 3 (MY BOOKING / MIS GESTIONES)
     ========================================================================== */
  const renderBookingScreen = () => (
    <div className="animate__animated animate__fadeIn">
      {/* Encabezado */}
      <div className="sigae-screen-header px-5">
        <button 
          type="button" 
          onClick={() => setActiveScreen('home')} 
          className="sigae-btn-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="sigae-screen-title">Mis Gestiones Escolares</h2>
      </div>

      {/* Tabs Segmentados: Active Shipment, In Transit, Delivered */}
      <div className="sigae-segmented-tabs-row">
        {(['Active', 'In Transit', 'Delivered'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setBookingFilter(tab)}
            className={`sigae-segmented-tab ${bookingFilter === tab ? 'active' : ''}`}
          >
            {tab === 'Active' ? 'Activas' : tab === 'In Transit' ? 'En Tránsito' : 'Completadas'}
          </button>
        ))}
      </div>

      {/* Listado de Tarjetas */}
      <div className="space-y-1">
        {tramitesFiltrados.map((item) => (
          <div key={item.id} className="sigae-shipment-card">
            <div className="sigae-shipment-card-top">
              <div className="sigae-shipment-icon-info">
                <div className="sigae-shipment-icon-box">
                  <i className={`bi ${item.icono}`}></i>
                </div>
                <div>
                  <h4 className="sigae-shipment-title">
                    {item.titulo}
                    <span className={`sigae-badge-status ${item.estatus === 'In Transit' ? 'sigae-badge-transit' : 'sigae-badge-delivered'}`}>
                      {item.estatus === 'In Transit' ? 'En Tránsito' : 'Entregado'}
                    </span>
                  </h4>
                  <p className="sigae-shipment-id">ID: #{item.id}</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveScreen('track')}
                className="sigae-btn-track-live"
              >
                Track Live
              </button>
            </div>

            {/* Línea Dotted de Progreso con Checkpoints */}
            <div className="sigae-progress-track">
              <div className="sigae-progress-line-bg"></div>
              <div className={`sigae-progress-dot ${item.pasoActual >= 1 ? 'completed' : ''}`}></div>
              <div className={`sigae-progress-dot ${item.pasoActual >= 2 ? 'completed' : ''}`}></div>
              <div className={`sigae-progress-dot ${item.pasoActual >= 3 ? (item.estatus === 'Delivered' ? 'completed' : 'active') : ''}`}>
                {item.estatus !== 'Delivered' && (
                  <div className="sigae-progress-marker-vehicle">
                    <i className="bi bi-geo-alt-fill text-[10px]"></i>
                  </div>
                )}
              </div>
              <div className={`sigae-progress-dot ${item.pasoActual >= 4 ? 'completed' : ''}`}></div>
            </div>

            {/* Metadatos de Entrega */}
            <div className="sigae-shipment-meta-row">
              <div className="sigae-shipment-meta-item">
                <span className="sigae-shipment-meta-label">Desde</span>
                <span className="sigae-shipment-meta-val">{item.origen}</span>
              </div>
              <div className="sigae-shipment-meta-item text-center">
                <span className="sigae-shipment-meta-label">Entrega</span>
                <span className="sigae-shipment-meta-val">{item.fecha}</span>
              </div>
              <div className="sigae-shipment-meta-item text-right">
                <span className="sigae-shipment-meta-label">Destino</span>
                <span className="sigae-shipment-meta-val">{item.destino}</span>
              </div>
            </div>
          </div>
        ))}

        {tramitesFiltrados.length === 0 && (
          <div className="text-center py-12 px-6">
            <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-8 h-8" />
            </div>
            <p className="text-sm font-bold text-gray-700">No hay trámites en esta sección</p>
            <p className="text-xs text-gray-400 mt-1">Crea una nueva solicitud presionando el botón central (+)</p>
          </div>
        )}
      </div>
    </div>
  );

  /* ==========================================================================
     SUB-RENDER: PANTALLA 4 (TRACKING EN VIVO CON MAPA VECTORIAL)
     ========================================================================== */
  const renderTrackScreen = () => (
    <div className="relative animate__animated animate__fadeIn">
      {/* Botón flotante superior para volver */}
      <div className="absolute top-4 left-5 z-30 flex items-center gap-3">
        <button 
          type="button" 
          onClick={() => setActiveScreen('home')} 
          className="sigae-btn-back bg-white/95 backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4 text-gray-800" />
        </button>
        <span className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-black text-indigo-950 shadow-sm border border-indigo-100">
          Tracking Escolar en Vivo
        </span>
      </div>

      {/* Mapa Vectorial Interactivo */}
      <div className="sigae-tracking-map-wrapper">
        <svg 
          viewBox="0 0 400 420" 
          className="sigae-map-svg"
          style={{ transform: `scale(${mapZoom})`, transformOrigin: 'center center', transition: 'transform 0.3s' }}
        >
          {/* Fondo del mapa y bloques urbanos */}
          <rect width="400" height="420" fill="#E5E9F0" />
          
          {/* Parques y Áreas Verdes */}
          <path d="M 20 20 L 120 10 L 150 90 L 40 110 Z" fill="#D3E8D8" opacity="0.9" />
          <text x="50" y="60" fontSize="9" fill="#5F8E6B" fontWeight="bold">Parque Bolívar</text>

          <path d="M 260 40 L 380 20 L 390 140 L 290 110 Z" fill="#D3E8D8" opacity="0.9" />
          <text x="290" y="75" fontSize="9" fill="#5F8E6B" fontWeight="bold">Cancha La Esmeralda</text>

          {/* Calles secundarias */}
          <line x1="0" y1="80" x2="400" y2="80" stroke="#FFFFFF" strokeWidth="12" />
          <line x1="0" y1="180" x2="400" y2="180" stroke="#FFFFFF" strokeWidth="12" />
          <line x1="0" y1="290" x2="400" y2="290" stroke="#FFFFFF" strokeWidth="14" />
          
          <line x1="90" y1="0" x2="90" y2="420" stroke="#FFFFFF" strokeWidth="10" />
          <line x1="210" y1="0" x2="210" y2="420" stroke="#FFFFFF" strokeWidth="14" />
          <line x1="330" y1="0" x2="330" y2="420" stroke="#FFFFFF" strokeWidth="10" />

          {/* Autopista Principal / Av. Intercomunal */}
          <path d="M 0 350 Q 150 310, 250 220 T 400 80" fill="none" stroke="#FDE68A" strokeWidth="14" opacity="0.8" />
          <path d="M 0 350 Q 150 310, 250 220 T 400 80" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="6,4" />

          {/* RUTA EN VIVO DEL TRANSPORTE (Línea Violeta Intensa) */}
          <path 
            id="rutaTransporte"
            d="M 90 340 L 90 290 L 210 290 L 210 180 L 330 180 L 330 90" 
            fill="none" 
            stroke="#6C5CE7" 
            strokeWidth="6" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Checkpoints de Parada */}
          <circle cx="90" cy="340" r="8" fill="#6C5CE7" stroke="#FFFFFF" strokeWidth="3" />
          <text x="105" y="345" fontSize="9" fill="#1E1B4B" fontWeight="bold">Garita Campo Rojo</text>

          <circle cx="210" cy="290" r="7" fill="#6C5CE7" stroke="#FFFFFF" strokeWidth="2.5" />
          <text x="140" y="280" fontSize="8" fill="#4B5563" fontWeight="bold">Plaza Bolívar</text>

          <circle cx="210" cy="180" r="7" fill="#6C5CE7" stroke="#FFFFFF" strokeWidth="2.5" />
          <text x="130" y="170" fontSize="8" fill="#4B5563" fontWeight="bold">Sector Menca</text>

          {/* Destino: Plantel Educativo */}
          <circle cx="330" cy="90" r="10" fill="#059669" stroke="#FFFFFF" strokeWidth="3" />
          <text x="270" y="80" fontSize="10" fill="#065F46" fontWeight="extrabold">U.E. Santa Bárbara</text>

          {/* MARCADOR DEL BUS EN TIEMPO REAL */}
          <g transform={`translate(${90 + (busProgress * 2.4)}, ${340 - (busProgress * 2.5)})`}>
            <circle cx="0" cy="0" r="14" fill="#6C5CE7" opacity="0.25" className="animate-ping" />
            <circle cx="0" cy="0" r="11" fill="#6C5CE7" stroke="#FFFFFF" strokeWidth="2" />
            <text x="-4" y="3" fontSize="8" fill="#FFFFFF">🚌</text>
          </g>
        </svg>

        {/* Controles Flotantes del Mapa */}
        <div className="sigae-map-floating-controls">
          <button 
            type="button" 
            onClick={() => setMapZoom(prev => Math.min(prev + 0.2, 1.8))}
            className="sigae-map-control-btn"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            type="button" 
            onClick={() => setMapZoom(prev => Math.max(prev - 0.2, 0.8))}
            className="sigae-map-control-btn"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button 
            type="button" 
            onClick={() => { setMapZoom(1); setIsBusMoving(!isBusMoving); }}
            className={`sigae-map-control-btn ${isBusMoving ? 'text-indigo-600' : 'text-gray-400'}`}
            title="Centrar GPS"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alerta de Simulación de Llamada / Mensaje */}
      {alertaLlamada && (
        <div className="mx-5 -mt-3 mb-2 p-2.5 bg-emerald-600 text-white text-xs font-bold rounded-2xl flex items-center justify-between shadow-lg animate__animated animate__bounceIn z-30 relative">
          <span>{alertaLlamada}</span>
          <button onClick={() => setAlertaLlamada(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Floating Bottom Sheet con Info del Chofer y Timeline */}
      <div className="sigae-tracking-sheet">
        <div className="sigae-sheet-handle"></div>

        <div className="flex items-center justify-between text-xs mb-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400">Tipo de Servicio</span>
            <p className="font-extrabold text-indigo-950">Ruta Matutina • Unidad 02</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-gray-400">Estatus</span>
            <p className="font-extrabold text-emerald-600 flex items-center gap-1 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              En Camino (A 5 min)
            </p>
          </div>
        </div>

        {/* Tarjeta del Conductor */}
        <div className="sigae-driver-card">
          <div className="sigae-driver-info">
            <img 
              src="/assets/img/avatar_docente.png" 
              alt="Chofer" 
              className="sigae-driver-avatar"
              onError={(e: any) => { e.target.src = '/img/avatars/avatar-2.png'; }}
            />
            <div>
              <h4 className="sigae-driver-name">Carlos Mendoza</h4>
              <p className="sigae-driver-rating">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>4.9 (142 viajes)</span>
              </p>
            </div>
          </div>
          <div className="sigae-driver-actions">
            <button 
              type="button" 
              onClick={() => setAlertaLlamada('Abriendo canal de chat seguro con Carlos Mendoza...')}
              className="sigae-btn-circle-action" 
              title="Enviar Mensaje"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button 
              type="button" 
              onClick={() => setAlertaLlamada('Marcando enlace celular directo con Chofer Carlos Mendoza...')}
              className="sigae-btn-circle-action" 
              title="Llamar al Chofer"
            >
              <Phone className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tracking History / Timeline Vertical */}
        <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider mb-2">
          Historial de Recorrido
        </h4>
        <div className="sigae-timeline-vertical">
          <div className="sigae-timeline-item">
            <div className="sigae-timeline-node completed"></div>
            <p className="sigae-timeline-title">Salida de Garita Campo Rojo</p>
            <p className="sigae-timeline-sub">Completado • 06:15 AM</p>
          </div>
          <div className="sigae-timeline-item">
            <div className="sigae-timeline-node completed"></div>
            <p className="sigae-timeline-title">Parada Plaza Bolívar</p>
            <p className="sigae-timeline-sub">Completado • 06:30 AM</p>
          </div>
          <div className="sigae-timeline-item">
            <div className="sigae-timeline-node current"></div>
            <p className="sigae-timeline-title">En Tránsito (Av. Intercomunal)</p>
            <p className="sigae-timeline-sub">En Curso • 06:45 AM</p>
          </div>
          <div className="sigae-timeline-item">
            <div className="sigae-timeline-node"></div>
            <p className="sigae-timeline-title">Llegada a U.E. Santa Bárbara</p>
            <p className="sigae-timeline-sub">Estimado • 07:05 AM</p>
          </div>
        </div>
      </div>
    </div>
  );

  /* ==========================================================================
     SUB-RENDER: PANTALLA 5 (SUMMARY / RESUMEN DE SOLICITUD)
     ========================================================================== */
  const renderSummaryScreen = () => (
    <div className="sigae-tramite-container animate__animated animate__fadeIn">
      <div className="sigae-screen-header">
        <button 
          type="button" 
          onClick={() => setActiveScreen('home')} 
          className="sigae-btn-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="sigae-screen-title">Resumen de Solicitud</h2>
      </div>

      <div className="sigae-tramite-card space-y-4">
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-black text-indigo-950">¡Trámite Registrado con Éxito!</h3>
          <p className="text-xs text-gray-500">Número de seguimiento generado</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Sede Origen:</span>
            <span className="font-bold text-gray-800">
              {escuelaCodigo === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Destino:</span>
            <span className="font-bold text-gray-800">Control de Estudios</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Trámite:</span>
            <span className="font-bold text-gray-800">{categoriaTramite}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Modalidad:</span>
            <span className="font-bold text-indigo-600">{modalidadEmision}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-2 font-bold">
            <span className="text-gray-700">Tasa de Emisión:</span>
            <span className="text-emerald-600">Exonerado (Gratuito)</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            type="button" 
            onClick={() => setActiveScreen('track')}
            className="w-1/2 py-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold text-xs rounded-full"
          >
            Rastrear en Vivo
          </button>
          <button 
            type="button" 
            onClick={() => setActiveScreen('booking')}
            className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-full shadow-lg shadow-indigo-200"
          >
            Ver Mis Gestiones
          </button>
        </div>
      </div>
    </div>
  );

  /* ==========================================================================
     SUB-RENDER: PANTALLA 6 (PROFILE / MI PERFIL)
     ========================================================================== */
  const renderProfileScreen = () => (
    <div className="animate__animated animate__fadeIn px-5">
      <div className="sigae-screen-header">
        <button 
          type="button" 
          onClick={() => setActiveScreen('home')} 
          className="sigae-btn-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="sigae-screen-title">Mi Perfil Escolar</h2>
      </div>

      {/* Header del Perfil */}
      <div className="text-center mb-6">
        <div className="relative inline-block">
          <img 
            src="/assets/img/avatar_docente.png" 
            alt="Usuario" 
            className="w-20 h-20 rounded-full border-4 border-white shadow-lg mx-auto object-cover"
            onError={(e: any) => { e.target.src = '/img/avatars/avatar-1.png'; }}
          />
          <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full"></span>
        </div>
        <h3 className="text-base font-extrabold text-indigo-950 mt-2">{usuario?.nombre || 'Luis Velásquez'}</h3>
        <p className="text-xs text-gray-500">{usuario?.email || 'l.velasquez@sigae.gob.ve'}</p>
        <span className="inline-block mt-2 px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full">
          {escuelaCodigo === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar'} &bull; {usuario?.rol || 'Representante Legal'}
        </span>
      </div>

      {/* Lista de Opciones Estilo iOS */}
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-50 overflow-hidden divide-y divide-gray-100 mb-6">
        <button 
          type="button"
          onClick={() => navigate('/categoria/Seguridad%20y%20Accesos/Mi%20Perfil')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-gray-800">Editar Datos Personales</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>

        <button 
          type="button"
          onClick={() => navigate('/categoria/Seguridad%20y%20Accesos/Métodos%20de%20Acceso')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-gray-800">Seguridad y Contraseña</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>

        <button 
          type="button"
          onClick={() => navigate('/categoria/Gestión%20Estudiantil/Carnet%20Estudiantil')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-gray-800">Carnet Escolar Digital QR</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>

        <button 
          type="button"
          onClick={() => navigate('/categoria/Seguridad%20y%20Accesos/Dispositivos%20y%20Sesiones')}
          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-gray-800">Dispositivos y Sesiones</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <button 
        type="button"
        onClick={() => {
          localStorage.removeItem('sesion_sigae');
          localStorage.removeItem('usuario_sigae');
          navigate('/login');
        }}
        className="w-full py-3.5 text-center text-red-600 bg-red-50 hover:bg-red-100 font-extrabold text-xs rounded-full transition-all cursor-pointer"
      >
        Cerrar Sesión Segura
      </button>
    </div>
  );

  /* ==========================================================================
     SUB-RENDER: BOTTOM NAV BAR NATIVO DEL TELÉFONO
     ========================================================================== */
  const renderPhoneBottomNav = () => (
    <nav className="sigae-app-bottom-nav">
      <button 
        type="button" 
        onClick={() => setActiveScreen('home')} 
        className={`sigae-app-nav-item ${activeScreen === 'home' ? 'active' : ''}`}
      >
        <i className={`bi ${activeScreen === 'home' ? 'bi-house-door-fill' : 'bi-house-door'} sigae-app-nav-icon`}></i>
        <span>Home</span>
      </button>

      <button 
        type="button" 
        onClick={() => setActiveScreen('booking')} 
        className={`sigae-app-nav-item ${activeScreen === 'booking' ? 'active' : ''}`}
      >
        <i className={`bi ${activeScreen === 'booking' ? 'bi-calendar-check-fill' : 'bi-calendar-check'} sigae-app-nav-icon`}></i>
        <span>Booking</span>
      </button>

      {/* Botón Central Flotante (FAB Lilac) */}
      <button 
        type="button" 
        onClick={() => { setFormPaso(1); setActiveScreen('tramite'); }}
        className="sigae-app-fab"
        title="Crear Trámite"
      >
        <Send className="w-5 h-5 text-white" />
      </button>

      <button 
        type="button" 
        onClick={() => setActiveScreen('track')} 
        className={`sigae-app-nav-item ${activeScreen === 'track' ? 'active' : ''}`}
      >
        <i className={`bi ${activeScreen === 'track' ? 'bi-geo-alt-fill' : 'bi-geo-alt'} sigae-app-nav-icon`}></i>
        <span>Track</span>
      </button>

      <button 
        type="button" 
        onClick={() => setActiveScreen('profile')} 
        className={`sigae-app-nav-item ${activeScreen === 'profile' ? 'active' : ''}`}
      >
        <i className={`bi ${activeScreen === 'profile' ? 'bi-person-fill' : 'bi-person'} sigae-app-nav-icon`}></i>
        <span>Profile</span>
      </button>
    </nav>
  );

  /* ==========================================================================
     CONTENIDO DINÁMICO SEGÚN PANTALLA ACTIVA
     ========================================================================== */
  const renderPhoneScreenContent = (screen: MobileScreen) => {
    switch (screen) {
      case 'home': return renderHomeScreen();
      case 'tramite': return renderTramiteScreen();
      case 'booking': return renderBookingScreen();
      case 'track': return renderTrackScreen();
      case 'summary': return renderSummaryScreen();
      case 'profile': return renderProfileScreen();
      default: return renderHomeScreen();
    }
  };

  /* ==========================================================================
     VISTA GENERAL (RESPONSIVE):
     En móviles se muestra directamente el frame 100%.
     En desktop se permite alternar entre el Simulador y la Galería Showcase.
     ========================================================================== */
  return (
    <div className="sigae-mobile-app-root">
      {/* Barra de Herramientas de Previsualización Desktop */}
      <div className="hidden lg:flex items-center justify-between px-8 py-3 bg-slate-900 text-white border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 text-decoration-none">
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a la Web Principal
          </Link>
          <span className="text-slate-600">|</span>
          <span className="text-xs font-black tracking-wide text-indigo-400">
            SIGAE MÓVIL v1.3 &bull; LILAC / IOS SHOWCASE
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('interactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'interactive' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              📱 Simulador Interactivo 1:1
            </button>
            <button
              type="button"
              onClick={() => setViewMode('showcase')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'showcase' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              🖼 Galería Showcase 4 Pantallas
            </button>
          </div>

          <Link
            to="/servicios"
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-all text-decoration-none"
          >
            Intranet de Servicios
          </Link>
        </div>
      </div>

      {/* CONTENEDOR 1: MODO SIMULADOR INTERACTIVO (1 DISPOSITIVO NATIVO O PANTALLA MÓVIL) */}
      {(viewMode === 'interactive' || typeof window !== 'undefined' && window.innerWidth < 992) && (
        <div className="flex items-center justify-center min-h-[calc(100vh-52px)] p-0 lg:p-8">
          <div className="sigae-iphone-frame">
            {/* Notch / Dynamic Island */}
            <div className="sigae-dynamic-island">
              <div className="sigae-dynamic-island-camera"></div>
              <div className="sigae-dynamic-island-sensor"></div>
            </div>

            {/* Barra de Estado de iOS */}
            <div className="sigae-ios-status-bar">
              <span>8:24</span>
              <div className="flex items-center gap-1.5 text-xs">
                <i className="bi bi-reception-4"></i>
                <i className="bi bi-wifi"></i>
                <i className="bi bi-battery-full text-sm"></i>
              </div>
            </div>

            {/* Área de Contenido del Teléfono */}
            <div className="sigae-phone-content">
              {renderPhoneScreenContent(activeScreen)}
            </div>

            {/* Bottom Nav Bar */}
            {renderPhoneBottomNav()}
          </div>
        </div>
      )}

      {/* CONTENEDOR 2: MODO SHOWCASE MULTI-PANTALLA (RECREACIÓN EXACTA DEL FLYER "APP SCREENS") */}
      {viewMode === 'showcase' && (
        <div className="sigae-showcase-desktop-wrapper">
          <div className="sigae-showcase-title-row">
            <span className="sigae-showcase-badge">Sistema de Diseño Lilac</span>
            <h1 className="sigae-showcase-h1">App Screens</h1>
            <p className="sigae-showcase-subtitle">
              Experiencia móvil completa para la U.E. Santa Bárbara y U.E. Libertador Bolívar: Inicio, Nuevo Trámite, Gestiones y Monitoreo GPS en Vivo.
            </p>
          </div>

          <div className="sigae-showcase-screens-row">
            {/* Pantalla 1: Home */}
            <div className="sigae-iphone-frame">
              <div className="sigae-dynamic-island">
                <div className="sigae-dynamic-island-camera"></div>
                <div className="sigae-dynamic-island-sensor"></div>
              </div>
              <div className="sigae-ios-status-bar">
                <span>8:24</span>
                <div className="flex items-center gap-1.5 text-xs">
                  <i className="bi bi-reception-4"></i>
                  <i className="bi bi-wifi"></i>
                  <i className="bi bi-battery-full text-sm"></i>
                </div>
              </div>
              <div className="sigae-phone-content">
                {renderHomeScreen()}
              </div>
              {renderPhoneBottomNav()}
            </div>

            {/* Pantalla 2: Send Parcel */}
            <div className="sigae-iphone-frame">
              <div className="sigae-dynamic-island">
                <div className="sigae-dynamic-island-camera"></div>
                <div className="sigae-dynamic-island-sensor"></div>
              </div>
              <div className="sigae-ios-status-bar">
                <span>8:24</span>
                <div className="flex items-center gap-1.5 text-xs">
                  <i className="bi bi-reception-4"></i>
                  <i className="bi bi-wifi"></i>
                  <i className="bi bi-battery-full text-sm"></i>
                </div>
              </div>
              <div className="sigae-phone-content">
                {renderTramiteScreen()}
              </div>
              {renderPhoneBottomNav()}
            </div>

            {/* Pantalla 3: My Booking */}
            <div className="sigae-iphone-frame">
              <div className="sigae-dynamic-island">
                <div className="sigae-dynamic-island-camera"></div>
                <div className="sigae-dynamic-island-sensor"></div>
              </div>
              <div className="sigae-ios-status-bar">
                <span>8:24</span>
                <div className="flex items-center gap-1.5 text-xs">
                  <i className="bi bi-reception-4"></i>
                  <i className="bi bi-wifi"></i>
                  <i className="bi bi-battery-full text-sm"></i>
                </div>
              </div>
              <div className="sigae-phone-content">
                {renderBookingScreen()}
              </div>
              {renderPhoneBottomNav()}
            </div>

            {/* Pantalla 4: Live Tracking */}
            <div className="sigae-iphone-frame">
              <div className="sigae-dynamic-island">
                <div className="sigae-dynamic-island-camera"></div>
                <div className="sigae-dynamic-island-sensor"></div>
              </div>
              <div className="sigae-ios-status-bar">
                <span>8:24</span>
                <div className="flex items-center gap-1.5 text-xs">
                  <i className="bi bi-reception-4"></i>
                  <i className="bi bi-wifi"></i>
                  <i className="bi bi-battery-full text-sm"></i>
                </div>
              </div>
              <div className="sigae-phone-content">
                {renderTrackScreen()}
              </div>
              {renderPhoneBottomNav()}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Simulación QR */}
      {qrModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate__animated animate__zoomIn">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-indigo-950">Escanear Documento o Carnet</h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              Apunta la cámara al código QR de la constancia, credencial o boleto escolar para consultar su autenticidad.
            </p>
            <div className="w-48 h-48 mx-auto border-2 border-dashed border-indigo-400 rounded-2xl flex items-center justify-center bg-indigo-50/50 relative overflow-hidden mb-4">
              <div className="w-full h-1 bg-indigo-500 absolute top-0 animate-bounce"></div>
              <Camera className="w-10 h-10 text-indigo-300" />
            </div>
            <button
              type="button"
              onClick={() => setQrModalOpen(false)}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-full cursor-pointer"
            >
              Cerrar Escáner
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
