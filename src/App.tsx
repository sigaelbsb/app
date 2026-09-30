import { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';

const esEntornoLocal = typeof window !== 'undefined' && (
  window.location.protocol === 'file:' || 
  !!(window as any).electronAPI?.isElectron ||
  !!(window as any).Capacitor
);

const AppRouter = esEntornoLocal ? HashRouter : BrowserRouter;

// Componentes estructurales directos
import { Auth } from './pages/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CategoryDashboard } from './pages/CategoryDashboard';
import { InstallPwaModal } from './components/InstallPwaModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NavigationRouteManager } from './components/NavigationRouteManager';
import { NavigationLoader } from './components/NavigationLoader';

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('[SIGAE Vite] Preload error detectado. Recargando versión fresca...', event);
    window.location.reload();
  });
}

// Carga perezosa con autorecuperación en caso de actualización en vivo o caída de red
function safeLazy<T extends React.ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err: any) {
      console.warn('[SIGAE ChunkLoader] Error cargando chunk, auto-reintentando...', err);
      const retryKey = 'sigae_retry_' + window.location.pathname;
      if (!sessionStorage.getItem(retryKey)) {
        sessionStorage.setItem(retryKey, 'true');
        if ('caches' in window) {
          try {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
          } catch (_) {}
        }
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      sessionStorage.removeItem(retryKey);
      throw err;
    }
  });
}

// Módulos pesados con carga bajo demanda segura (Code Splitting & Auto-Retry)
const MiPerfil = safeLazy(() => import('./pages/seguridad/MiPerfil').then(m => ({ default: m.MiPerfil })));
const MetodosAcceso = safeLazy(() => import('./pages/seguridad/MetodosAcceso').then(m => ({ default: m.MetodosAcceso })));
const DispositivosSesiones = safeLazy(() => import('./pages/seguridad/DispositivosSesiones').then(m => ({ default: m.DispositivosSesiones })));
const GestionUsuarios = safeLazy(() => import('./pages/seguridad/GestionUsuarios').then(m => ({ default: m.GestionUsuarios })));
const RolesPrivilegios = safeLazy(() => import('./pages/seguridad/RolesPrivilegios').then(m => ({ default: m.RolesPrivilegios })));
const PreguntasSeguridad = safeLazy(() => import('./pages/seguridad/PreguntasSeguridad').then(m => ({ default: m.PreguntasSeguridad })));
const AuditoriaSistema = safeLazy(() => import('./pages/seguridad/AuditoriaSistema').then(m => ({ default: m.AuditoriaSistema })));

const PerfilEscuela = safeLazy(() => import('./pages/direccion/PerfilEscuela').then(m => ({ default: m.PerfilEscuela })));
const ConfiguracionSistema = safeLazy(() => import('./pages/direccion/ConfiguracionSistema').then(m => ({ default: m.ConfiguracionSistema })));
const DivisionTerritorial = safeLazy(() => import('./pages/direccion/DivisionTerritorial').then(m => ({ default: m.DivisionTerritorial })));
const CerebroSigma = safeLazy(() => import('./pages/direccion/CerebroSigma').then(m => ({ default: m.CerebroSigma })));
const PanelControl = safeLazy(() => import('./pages/direccion/PanelControl').then(m => ({ default: m.PanelControl })));
const CalendarioEscolar = safeLazy(() => import('./pages/direccion/CalendarioEscolar').then(m => ({ default: m.CalendarioEscolar })));
const InstalacionDescargas = safeLazy(() => import('./pages/sistema/InstalacionDescargas').then(m => ({ default: m.InstalacionDescargas })));

const EstructuraEmpresa = safeLazy(() => import('./pages/organizacion/EstructuraEmpresa').then(m => ({ default: m.EstructuraEmpresa })));
const CargosInstitucionales = safeLazy(() => import('./pages/organizacion/CargosInstitucionales').then(m => ({ default: m.CargosInstitucionales })));
const CadenaSupervisoria = safeLazy(() => import('./pages/organizacion/CadenaSupervisoria').then(m => ({ default: m.CadenaSupervisoria })));
const GestionColectivos = safeLazy(() => import('./pages/organizacion/GestionColectivos').then(m => ({ default: m.GestionColectivos })));

const GradosSalones = safeLazy(() => import('./pages/estudios/GradosSalones').then(m => ({ default: m.GradosSalones })));
const MiExpediente = safeLazy(() => import('./pages/docente/MiExpediente').then(m => ({ default: m.MiExpediente })));
const GestorExpedientes = safeLazy(() => import('./pages/docente/GestorExpedientes').then(m => ({ default: m.GestorExpedientes })));

const SolicitudCupos = safeLazy(() => import('./pages/estudiantil/SolicitudCupos').then(m => ({ default: m.SolicitudCupos })));
const GestionAdmisiones = safeLazy(() => import('./pages/estudiantil/GestionAdmisiones').then(m => ({ default: m.GestionAdmisiones })));
const RedactorMensajesAdmision = safeLazy(() => import('./pages/estudiantil/RedactorMensajesAdmision').then(m => ({ default: m.RedactorMensajesAdmision })));
const VincularEstudiante = safeLazy(() => import('./pages/estudiantil/VincularEstudiante').then(m => ({ default: m.VincularEstudiante })));
const ValidarConstancia = safeLazy(() => import('./pages/estudiantil/ValidarConstancia').then(m => ({ default: m.ValidarConstancia })));
const ActualizacionDatos = safeLazy(() => import('./pages/estudiantil/ActualizacionDatos').then(m => ({ default: m.ActualizacionDatos })));
const Verificaciones = safeLazy(() => import('./pages/estudiantil/Verificaciones').then(m => ({ default: m.Verificaciones })));

const TransporteEscolar = safeLazy(() => import('./pages/transporte/TransporteEscolar').then(m => ({ default: m.TransporteEscolar })));
const EstudioDiseno = safeLazy(() => import('./pages/disenos/EstudioDiseno').then(m => ({ default: m.EstudioDiseno })));
const ConstructorEncuestas = safeLazy(() => import('./pages/disenos/ConstructorEncuestas').then(m => ({ default: m.ConstructorEncuestas })));
const EditorConstancias = safeLazy(() => import('./pages/disenos/EditorConstancias').then(m => ({ default: m.EditorConstancias })));
const OrientacionesNuevosIngresos = safeLazy(() => import('./pages/disenos/OrientacionesNuevosIngresos').then(m => ({ default: m.OrientacionesNuevosIngresos })));

import './componentes.css';
import './principal.css';
import './auth_ui.css';
import './vistas.css';
import './mod_inicio.css';
import './chatbot.css';
import './chamilo_ui.css';
import './mobile_nav.css';

function App() {
  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vincular función de transición animada a window
    (window as any).ejecutarTransicionDigital = (callback: () => void) => {
      const contenedor = document.getElementById('contenedor-transicion');
      if (!contenedor) {
        if (callback) callback();
        return;
      }
      
      contenedor.style.display = 'block';
      contenedor.classList.remove('fade-out-global');
      
      let gridHtml = '<div class="grid-container">';
      for (let i = 0; i < 100; i++) {
        gridHtml += `<div class="grid-box" style="transition-delay: ${Math.random() * 0.4}s"></div>`;
      }
      gridHtml += '</div>';
      contenedor.innerHTML = gridHtml;
      
      setTimeout(() => {
        document.querySelectorAll('.grid-box').forEach(el => el.classList.add('play'));
      }, 50);

      setTimeout(() => {
        if (callback) callback(); 
        contenedor.classList.add('fade-out-global');
        setTimeout(() => {
          contenedor.style.display = 'none';
          contenedor.innerHTML = '';
        }, 600); 
      }, 750); 
    };

    // Revisar sesión de forma inicial
    const syncUsuarioDesdeStorage = () => {
      const authSession = localStorage.getItem('sesion_sigae');
      const userStr = localStorage.getItem('usuario_sigae');
      const escCodigo = localStorage.getItem('sigae_escuela_codigo');
      
      if (authSession === 'activa' && userStr && escCodigo) {
        try {
          setUsuario(JSON.parse(userStr));
        } catch (e) {
          setUsuario(null);
        }
      } else {
        localStorage.removeItem('sesion_sigae');
        localStorage.removeItem('usuario_sigae');
        setUsuario(null);
      }
    };

    syncUsuarioDesdeStorage();
    setLoading(false);

    // Escuchar actualizaciones de sesión o emulación en tiempo real (evita recargas destructivas de pantalla blanca)
    const handleSessionUpdate = (e: any) => {
      if (e?.detail) {
        setUsuario(e.detail);
      } else {
        syncUsuarioDesdeStorage();
      }
    };

    window.addEventListener('sigae-session-update', handleSessionUpdate);
    return () => window.removeEventListener('sigae-session-update', handleSessionUpdate);
  }, []);

  const handleLogin = (userData: any) => {
    sessionStorage.removeItem('sigma_presentado');
    sessionStorage.removeItem('sigma_presentando_ahora');
    if (typeof (window as any).ejecutarTransicionDigital === 'function') {
      (window as any).ejecutarTransicionDigital(() => {
        setUsuario(userData);
      });
    } else {
      setUsuario(userData);
    }
  };

  if (loading) {
    return (
      <div id="pantalla-carga" className="pantalla-carga-ligera" style={{ display: 'flex', opacity: 1 }}>
        <div className="lr-wrapper-full">
          <div className="lr-pulso lr-pulso-1"></div>
          <div className="lr-pulso lr-pulso-2"></div>
          <div className="lr-pulso lr-pulso-3"></div>
          <img src="/assets/img/sigae.png" alt="Sistema Integral de Gestión y Administración Escolar" className="lr-logo-full" />
        </div>
        <div className="fw-bold text-muted small loader-text mt-3">CARGANDO SISTEMA INTEGRAL DE GESTIÓN Y ADMINISTRACIÓN ESCOLAR...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallbackTitle="Error al iniciar SIGAE">
      <AppRouter>
        <NavigationRouteManager>
          <InstallPwaModal />
          <Suspense fallback={<NavigationLoader />}>
            <Routes>
              <Route path="/validar-constancia/:codigo" element={<ValidarConstancia />} />
              <Route path="/login" element={!usuario ? <Auth onLogin={handleLogin} /> : <Navigate to="/" replace />} />
              
              <Route path="/" element={usuario ? <Layout onLogout={() => setUsuario(null)} /> : <Navigate to="/login" replace />}>
                <Route index element={<Dashboard />} />
                <Route path="categoria/:categoryName" element={<CategoryDashboard />} />
                <Route path="categoria/Seguridad y Accesos/Mi Perfil" element={<ProtectedRoute modulo="Mi Perfil"><MiPerfil /></ProtectedRoute>} />
                <Route path="categoria/Seguridad y Accesos/Métodos de Acceso" element={<ProtectedRoute modulo="Métodos de Acceso"><MetodosAcceso /></ProtectedRoute>} />
                <Route path="categoria/Seguridad y Accesos/Dispositivos y Sesiones" element={<ProtectedRoute modulo="Dispositivos y Sesiones"><DispositivosSesiones /></ProtectedRoute>} />
                <Route path="categoria/Seguridad y Accesos/Sesiones Activas" element={<Navigate to="/categoria/Seguridad y Accesos/Dispositivos y Sesiones" replace />} />
                <Route path="categoria/Seguridad y Accesos/Gestión de Usuarios" element={<ProtectedRoute modulo="Gestión de Usuarios"><GestionUsuarios /></ProtectedRoute>} />
                <Route path="categoria/Seguridad y Accesos/Roles y Privilegios" element={<ProtectedRoute modulo="Roles y Privilegios"><RolesPrivilegios /></ProtectedRoute>} />
                <Route path="categoria/Seguridad y Accesos/Preguntas de Seguridad" element={<ProtectedRoute modulo="Preguntas de Seguridad"><PreguntasSeguridad /></ProtectedRoute>} />
                <Route path="categoria/Seguridad y Accesos/Auditoría del Sistema" element={<ProtectedRoute modulo="Auditoría del Sistema"><AuditoriaSistema /></ProtectedRoute>} />
                <Route path="categoria/Dirección y Sistema/Perfil de la Escuela" element={<ProtectedRoute modulo="Perfil de la Escuela"><PerfilEscuela /></ProtectedRoute>} />
                <Route path="categoria/Dirección y Sistema/Configuración Escolar" element={<ProtectedRoute modulo="Configuración Escolar"><ConfiguracionSistema /></ProtectedRoute>} />
                <Route path="categoria/Dirección y Sistema/Configuración del Sistema" element={<Navigate to="/categoria/Dirección y Sistema/Configuración Escolar" replace />} />
                <Route path="categoria/Dirección y Sistema/División Territorial" element={<ProtectedRoute modulo="División Territorial"><DivisionTerritorial /></ProtectedRoute>} />
                <Route path="categoria/Dirección y Sistema/Cerebro de Sigma" element={<ProtectedRoute modulo="Cerebro de Sigma"><CerebroSigma /></ProtectedRoute>} />
                <Route path="categoria/Dirección y Sistema/Gestión de Registros" element={<Navigate to="/categoria/Seguridad y Accesos/Gestión de Usuarios" replace />} />
                <Route path="categoria/Dirección y Sistema/Panel de Control" element={<ProtectedRoute modulo="Panel de Control"><PanelControl /></ProtectedRoute>} />
                <Route path="categoria/Dirección y Sistema/Calendario Escolar" element={<ProtectedRoute modulo="Calendario Escolar"><CalendarioEscolar /></ProtectedRoute>} />
                <Route path="categoria/Dirección y Sistema/Instalación y Descargas" element={<ProtectedRoute modulo="Instalación y Descargas"><InstalacionDescargas /></ProtectedRoute>} />
                <Route path="categoria/Dirección y Sistema/Instalar SIGAE" element={<ProtectedRoute modulo="Instalación y Descargas"><InstalacionDescargas /></ProtectedRoute>} />
                <Route path="instalar-sigae" element={<ProtectedRoute modulo="Instalación y Descargas"><InstalacionDescargas /></ProtectedRoute>} />
                <Route path="categoria/Organización Escolar/Estructura Empresa" element={<ProtectedRoute modulo="Estructura Empresa"><EstructuraEmpresa /></ProtectedRoute>} />
                <Route path="categoria/Organización Escolar/Cargos Institucionales" element={<ProtectedRoute modulo="Cargos Institucionales"><CargosInstitucionales /></ProtectedRoute>} />
                <Route path="categoria/Organización Escolar/Cadena Supervisoria" element={<ProtectedRoute modulo="Cadena Supervisoria"><CadenaSupervisoria /></ProtectedRoute>} />
                <Route path="categoria/Organización Escolar/Gestión de Colectivos" element={<ProtectedRoute modulo="Gestión de Colectivos"><GestionColectivos /></ProtectedRoute>} />
                <Route path="categoria/Control de Estudios/Grados y Salones" element={<ProtectedRoute modulo="Grados y Salones"><GradosSalones /></ProtectedRoute>} />
                <Route path="categoria/Dirección y Sistema/Grados y Salones" element={<ProtectedRoute modulo="Grados y Salones"><GradosSalones /></ProtectedRoute>} />
                <Route path="categoria/Gestión Docente/Mi Expediente" element={<ProtectedRoute modulo="Mi Expediente"><MiExpediente /></ProtectedRoute>} />
                <Route path="categoria/Gestión Docente/Gestor de Expedientes" element={<ProtectedRoute modulo="Gestor de Expedientes"><GestorExpedientes /></ProtectedRoute>} />
                <Route path="categoria/Admisiones y Nuevos Ingresos/Solicitud de Cupos" element={<ProtectedRoute modulo="Solicitud de Cupos"><SolicitudCupos /></ProtectedRoute>} />
                <Route path="categoria/Admisiones y Nuevos Ingresos/Gestión de Admisiones" element={<ProtectedRoute modulo="Gestión de Admisiones"><GestionAdmisiones /></ProtectedRoute>} />
                <Route path="categoria/Admisiones y Nuevos Ingresos/Mensajes de Admisión" element={<ProtectedRoute modulo="Mensajes de Admisión"><RedactorMensajesAdmision /></ProtectedRoute>} />
                <Route path="categoria/Admisiones y Nuevos Ingresos/Redactor de Mensajes" element={<ProtectedRoute modulo="Mensajes de Admisión"><RedactorMensajesAdmision /></ProtectedRoute>} />
                <Route path="categoria/Admisiones y Nuevos Ingresos/Orientaciones Nuevos Ingresos" element={<ProtectedRoute modulo="Orientaciones Nuevos Ingresos"><OrientacionesNuevosIngresos /></ProtectedRoute>} />
                <Route path="categoria/Admisiones y Nuevos Ingresos/Mis Solicitudes" element={<ProtectedRoute modulo="Mis Solicitudes"><SolicitudCupos /></ProtectedRoute>} />
                <Route path="categoria/Gestión Estudiantil/Solicitud de Cupos" element={<ProtectedRoute modulo="Solicitud de Cupos"><SolicitudCupos /></ProtectedRoute>} />
                <Route path="categoria/Gestión Estudiantil/Gestión de Admisiones" element={<ProtectedRoute modulo="Gestión de Admisiones"><GestionAdmisiones /></ProtectedRoute>} />
                <Route path="categoria/Gestión Estudiantil/Mensajes de Admisión" element={<ProtectedRoute modulo="Mensajes de Admisión"><RedactorMensajesAdmision /></ProtectedRoute>} />
                <Route path="categoria/Gestión Estudiantil/Redactor de Mensajes" element={<ProtectedRoute modulo="Mensajes de Admisión"><RedactorMensajesAdmision /></ProtectedRoute>} />
                <Route path="redactor-mensajes-admision" element={<ProtectedRoute modulo="Mensajes de Admisión"><RedactorMensajesAdmision /></ProtectedRoute>} />
                <Route path="categoria/Gestión Estudiantil/Vincular Estudiante" element={<ProtectedRoute modulo="Vincular Estudiante"><VincularEstudiante /></ProtectedRoute>} />
                <Route path="categoria/Gestión Estudiantil/Expediente Estudiantil" element={<ProtectedRoute modulo="Vincular Estudiante"><VincularEstudiante /></ProtectedRoute>} />
                <Route path="categoria/Gestión Estudiantil/Actualización de Datos" element={<ProtectedRoute modulo="Actualización de Datos"><ActualizacionDatos /></ProtectedRoute>} />
                <Route path="categoria/Gestión Estudiantil/Verificaciones" element={<ProtectedRoute modulo="Verificaciones"><Verificaciones /></ProtectedRoute>} />
                <Route path="categoria/Gestión Estudiantil/Mis Solicitudes" element={<ProtectedRoute modulo="Mis Solicitudes"><SolicitudCupos /></ProtectedRoute>} />
                <Route path="categoria/Gestión Estudiantil/Gestión de Matrícula" element={<ProtectedRoute modulo="Grados y Salones"><GradosSalones /></ProtectedRoute>} />
                <Route path="categoria/Servicios y Bienestar/Transporte Escolar" element={<ProtectedRoute modulo="Transporte Escolar"><TransporteEscolar /></ProtectedRoute>} />
                <Route path="categoria/Transporte y Logística/Transporte Escolar" element={<ProtectedRoute modulo="Transporte Escolar"><TransporteEscolar /></ProtectedRoute>} />
                <Route path="categoria/Transporte y Logística" element={<Navigate to="/categoria/Servicios y Bienestar/Transporte Escolar" replace />} />
                <Route path="transporte" element={<ProtectedRoute modulo="Transporte Escolar"><TransporteEscolar /></ProtectedRoute>} />
                <Route path="transporte-escolar" element={<ProtectedRoute modulo="Transporte Escolar"><TransporteEscolar /></ProtectedRoute>} />
                <Route path="categoria/Diseños/Galería y Plantillas" element={<ProtectedRoute modulo="Galería y Plantillas"><EstudioDiseno herramientaInicial="galeria" /></ProtectedRoute>} />
                <Route path="categoria/Diseños/Editor de Constancias" element={<ProtectedRoute modulo="Editor de Constancias"><EditorConstancias tipoInicial="CONSTANCIAS" /></ProtectedRoute>} />
                <Route path="categoria/Diseños/Carta de Aceptación" element={<ProtectedRoute modulo="Carta de Aceptación"><EditorConstancias tipoInicial="ACEPTACION" /></ProtectedRoute>} />
                <Route path="categoria/Diseños/Carnet Estudiantil" element={<ProtectedRoute modulo="Carnet Estudiantil"><EditorConstancias tipoInicial="CARNETS" /></ProtectedRoute>} />
                <Route path="categoria/Diseños/Creador de Certificados" element={<ProtectedRoute modulo="Creador de Certificados"><EstudioDiseno herramientaInicial="certificados" /></ProtectedRoute>} />
                <Route path="categoria/Diseños/Creador de Flyers" element={<ProtectedRoute modulo="Creador de Flyers"><EstudioDiseno herramientaInicial="flyers" /></ProtectedRoute>} />
                <Route path="categoria/Diseños/Creador de Invitaciones" element={<ProtectedRoute modulo="Creador de Invitaciones"><EstudioDiseno herramientaInicial="invitaciones" /></ProtectedRoute>} />
                <Route path="categoria/Diseños/Creador de Tapas" element={<ProtectedRoute modulo="Creador de Tapas"><EstudioDiseno herramientaInicial="tapas" /></ProtectedRoute>} />
                <Route path="categoria/Diseños/Creador de Comunicados" element={<ProtectedRoute modulo="Creador de Comunicados"><EstudioDiseno herramientaInicial="comunicados" /></ProtectedRoute>} />
                <Route path="categoria/Diseños/Creador de Cumpleaños" element={<ProtectedRoute modulo="Creador de Cumpleaños"><EstudioDiseno herramientaInicial="cumpleanos" /></ProtectedRoute>} />
                <Route path="categoria/Diseños/Encuesta" element={<ProtectedRoute modulo="Encuesta"><ConstructorEncuestas /></ProtectedRoute>} />
                <Route path="categoria/Diseños/Encuestas" element={<ProtectedRoute modulo="Encuestas"><ConstructorEncuestas /></ProtectedRoute>} />
                <Route path="categoria/Diseños/Orientaciones Nuevos Ingresos" element={<ProtectedRoute modulo="Orientaciones Nuevos Ingresos"><OrientacionesNuevosIngresos /></ProtectedRoute>} />
                <Route path="categoria/Gestión Estudiantil/Orientaciones Nuevos Ingresos" element={<ProtectedRoute modulo="Orientaciones Nuevos Ingresos"><OrientacionesNuevosIngresos /></ProtectedRoute>} />
                <Route path="orientaciones-nuevos-ingresos" element={<ProtectedRoute modulo="Orientaciones Nuevos Ingresos"><OrientacionesNuevosIngresos /></ProtectedRoute>} />
                <Route path="categoria/Formación y Capacitación/Creador de Certificados" element={<ProtectedRoute modulo="Creador de Certificados"><EstudioDiseno herramientaInicial="certificados" /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </NavigationRouteManager>
      </AppRouter>
    </ErrorBoundary>
  );
}

export default App;
