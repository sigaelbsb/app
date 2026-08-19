import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Auth } from './pages/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CategoryDashboard } from './pages/CategoryDashboard';
import { MiPerfil } from './pages/seguridad/MiPerfil';
import { MetodosAcceso } from './pages/seguridad/MetodosAcceso';
import { GestionUsuarios } from './pages/seguridad/GestionUsuarios';
import { RolesPrivilegios } from './pages/seguridad/RolesPrivilegios';
import { PreguntasSeguridad } from './pages/seguridad/PreguntasSeguridad';
import { AuditoriaSistema } from './pages/seguridad/AuditoriaSistema';
import { PerfilEscuela } from './pages/direccion/PerfilEscuela';
import { EspaciosEscolares } from './pages/direccion/EspaciosEscolares';
import { ConfiguracionSistema } from './pages/direccion/ConfiguracionSistema';
import { DivisionTerritorial } from './pages/direccion/DivisionTerritorial';
import { CerebroSigma } from './pages/direccion/CerebroSigma';
import { GestionRegistros } from './pages/direccion/GestionRegistros';
import { PanelControl } from './pages/direccion/PanelControl';
import { EstructuraEmpresa } from './pages/organizacion/EstructuraEmpresa';
import { CargosInstitucionales } from './pages/organizacion/CargosInstitucionales';
import { CadenaSupervisoria } from './pages/organizacion/CadenaSupervisoria';
import { GestionColectivos } from './pages/organizacion/GestionColectivos';
import { GradosSalones } from './pages/estudios/GradosSalones';
import { MiExpediente } from './pages/docente/MiExpediente';
import { GestorExpedientes } from './pages/docente/GestorExpedientes';
import { SolicitudCupos } from './pages/estudiantil/SolicitudCupos';
import { GestionAdmisiones } from './pages/estudiantil/GestionAdmisiones';
import { VincularEstudiante } from './pages/estudiantil/VincularEstudiante';
import { ValidarConstancia } from './pages/estudiantil/ValidarConstancia';
import { ActualizacionDatos } from './pages/estudiantil/ActualizacionDatos';
import { Verificaciones } from './pages/estudiantil/Verificaciones';
import { TransporteEscolar } from './pages/transporte/TransporteEscolar';
import { EstudioDiseno } from './pages/disenos/EstudioDiseno';
import { ConstructorEncuestas } from './pages/disenos/ConstructorEncuestas';
import { InstallPwaModal } from './components/InstallPwaModal';
import './componentes.css';
import './principal.css';
import './auth_ui.css';
import './vistas.css';
import './mod_inicio.css';
import './chatbot.css';


import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  const [usuario, setUsuario] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Bind transition function to window
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

    // Revisar sesión de forma manual (igual que aplicacion.js)
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
      // Si no hay escuela seleccionada o la sesión no es válida, limpiar y forzar el selector
      localStorage.removeItem('sesion_sigae');
      localStorage.removeItem('usuario_sigae');
      setUsuario(null);
    }
    setLoading(false);
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
    <>
      <InstallPwaModal />
      <Router>
        <Routes>
          <Route path="/validar-constancia/:codigo" element={<ValidarConstancia />} />
          <Route path="/login" element={!usuario ? <Auth onLogin={handleLogin} /> : <Navigate to="/" replace />} />
          
          <Route path="/" element={usuario ? <Layout onLogout={() => setUsuario(null)} /> : <Navigate to="/login" replace />}>
            <Route index element={<Dashboard />} />
            <Route path="categoria/:categoryName" element={<CategoryDashboard />} />
            <Route path="categoria/Seguridad y Accesos/Mi Perfil" element={<ProtectedRoute modulo="Mi Perfil"><MiPerfil /></ProtectedRoute>} />
            <Route path="categoria/Seguridad y Accesos/Métodos de Acceso" element={<ProtectedRoute modulo="Métodos de Acceso"><MetodosAcceso /></ProtectedRoute>} />
            <Route path="categoria/Seguridad y Accesos/Gestión de Usuarios" element={<ProtectedRoute modulo="Gestión de Usuarios"><GestionUsuarios /></ProtectedRoute>} />
            <Route path="categoria/Seguridad y Accesos/Roles y Privilegios" element={<ProtectedRoute modulo="Roles y Privilegios"><RolesPrivilegios /></ProtectedRoute>} />
            <Route path="categoria/Seguridad y Accesos/Preguntas de Seguridad" element={<ProtectedRoute modulo="Preguntas de Seguridad"><PreguntasSeguridad /></ProtectedRoute>} />
            <Route path="categoria/Seguridad y Accesos/Auditoría del Sistema" element={<ProtectedRoute modulo="Auditoría del Sistema"><AuditoriaSistema /></ProtectedRoute>} />
            <Route path="categoria/Dirección y Sistema/Perfil de la Escuela" element={<ProtectedRoute modulo="Perfil de la Escuela"><PerfilEscuela /></ProtectedRoute>} />
            <Route path="categoria/Dirección y Sistema/Espacios Escolares" element={<ProtectedRoute modulo="Espacios Escolares"><EspaciosEscolares /></ProtectedRoute>} />
            <Route path="categoria/Dirección y Sistema/Configuración del Sistema" element={<ProtectedRoute modulo="Configuración del Sistema"><ConfiguracionSistema /></ProtectedRoute>} />
            <Route path="categoria/Dirección y Sistema/División Territorial" element={<ProtectedRoute modulo="División Territorial"><DivisionTerritorial /></ProtectedRoute>} />
            <Route path="categoria/Dirección y Sistema/Cerebro de Sigma" element={<ProtectedRoute modulo="Cerebro de Sigma"><CerebroSigma /></ProtectedRoute>} />
            <Route path="categoria/Dirección y Sistema/Gestión de Registros" element={<ProtectedRoute modulo="Gestión de Registros"><GestionRegistros /></ProtectedRoute>} />
            <Route path="categoria/Dirección y Sistema/Panel de Control" element={<ProtectedRoute modulo="Panel de Control"><PanelControl /></ProtectedRoute>} />
            <Route path="categoria/Organización Escolar/Estructura Empresa" element={<ProtectedRoute modulo="Estructura Empresa"><EstructuraEmpresa /></ProtectedRoute>} />
            <Route path="categoria/Organización Escolar/Cargos Institucionales" element={<ProtectedRoute modulo="Cargos Institucionales"><CargosInstitucionales /></ProtectedRoute>} />
            <Route path="categoria/Organización Escolar/Cadena Supervisoria" element={<ProtectedRoute modulo="Cadena Supervisoria"><CadenaSupervisoria /></ProtectedRoute>} />
            <Route path="categoria/Organización Escolar/Gestión de Colectivos" element={<ProtectedRoute modulo="Gestión de Colectivos"><GestionColectivos /></ProtectedRoute>} />
            <Route path="categoria/Control de Estudios/Grados y Salones" element={<ProtectedRoute modulo="Grados y Salones"><GradosSalones /></ProtectedRoute>} />
            <Route path="categoria/Gestión Docente/Mi Expediente" element={<ProtectedRoute modulo="Mi Expediente"><MiExpediente /></ProtectedRoute>} />
            <Route path="categoria/Gestión Docente/Gestor de Expedientes" element={<ProtectedRoute modulo="Gestor de Expedientes"><GestorExpedientes /></ProtectedRoute>} />
            <Route path="categoria/Gestión Estudiantil/Solicitud de Cupos" element={<ProtectedRoute modulo="Solicitud de Cupos"><SolicitudCupos /></ProtectedRoute>} />
            <Route path="categoria/Gestión Estudiantil/Gestión de Admisiones" element={<ProtectedRoute modulo="Gestión de Admisiones"><GestionAdmisiones /></ProtectedRoute>} />
            <Route path="categoria/Gestión Estudiantil/Vincular Estudiante" element={<ProtectedRoute modulo="Vincular Estudiante"><VincularEstudiante /></ProtectedRoute>} />
            <Route path="categoria/Gestión Estudiantil/Actualización de Datos" element={<ProtectedRoute modulo="Actualización de Datos"><ActualizacionDatos /></ProtectedRoute>} />
            <Route path="categoria/Gestión Estudiantil/Verificaciones" element={<ProtectedRoute modulo="Verificaciones"><Verificaciones /></ProtectedRoute>} />
            <Route path="categoria/Servicios y Bienestar/Transporte Escolar" element={<ProtectedRoute modulo="Transporte Escolar"><TransporteEscolar /></ProtectedRoute>} />
            <Route path="categoria/Diseños/Galería y Plantillas" element={<ProtectedRoute modulo="Galería y Plantillas"><EstudioDiseno herramientaInicial="galeria" /></ProtectedRoute>} />
            <Route path="categoria/Diseños/Creador de Certificados" element={<ProtectedRoute modulo="Creador de Certificados"><EstudioDiseno herramientaInicial="certificados" /></ProtectedRoute>} />
            <Route path="categoria/Diseños/Creador de Flyers" element={<ProtectedRoute modulo="Creador de Flyers"><EstudioDiseno herramientaInicial="flyers" /></ProtectedRoute>} />
            <Route path="categoria/Diseños/Creador de Invitaciones" element={<ProtectedRoute modulo="Creador de Invitaciones"><EstudioDiseno herramientaInicial="invitaciones" /></ProtectedRoute>} />
            <Route path="categoria/Diseños/Creador de Tapas" element={<ProtectedRoute modulo="Creador de Tapas"><EstudioDiseno herramientaInicial="tapas" /></ProtectedRoute>} />
            <Route path="categoria/Diseños/Creador de Comunicados" element={<ProtectedRoute modulo="Creador de Comunicados"><EstudioDiseno herramientaInicial="comunicados" /></ProtectedRoute>} />
            <Route path="categoria/Diseños/Creador de Cumpleaños" element={<ProtectedRoute modulo="Creador de Cumpleaños"><EstudioDiseno herramientaInicial="cumpleanos" /></ProtectedRoute>} />
            <Route path="categoria/Diseños/Encuesta" element={<ProtectedRoute modulo="Encuesta"><ConstructorEncuestas /></ProtectedRoute>} />
            <Route path="categoria/Diseños/Encuestas" element={<ProtectedRoute modulo="Encuestas"><ConstructorEncuestas /></ProtectedRoute>} />
            <Route path="categoria/Diseños/Constructor de Encuestas" element={<ProtectedRoute modulo="Constructor de Encuestas"><ConstructorEncuestas /></ProtectedRoute>} />
            <Route path="categoria/Formación y Capacitación/Creador de Certificados" element={<ProtectedRoute modulo="Creador de Certificados"><EstudioDiseno herramientaInicial="certificados" /></ProtectedRoute>} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
