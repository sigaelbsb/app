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
import { EstructuraEmpresa } from './pages/organizacion/EstructuraEmpresa';
import { CargosInstitucionales } from './pages/organizacion/CargosInstitucionales';
import { CadenaSupervisoria } from './pages/organizacion/CadenaSupervisoria';
import { GradosSalones } from './pages/estudios/GradosSalones';
import { MiExpediente } from './pages/docente/MiExpediente';
import './componentes.css';
import './principal.css';
import './auth_ui.css';
import './vistas.css';
import './mod_inicio.css';
import './chatbot.css';


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
    
    if (authSession === 'activa' && userStr) {
      try {
        setUsuario(JSON.parse(userStr));
      } catch (e) {
        setUsuario(null);
      }
    } else {
      setUsuario(null);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: any) => {
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
        <div className="lr-wrapper">
          <div className="lr-pulso lr-pulso-1"></div>
          <div className="lr-pulso lr-pulso-2"></div>
          <div className="lr-pulso lr-pulso-3"></div>
          <img src="/assets/img/logo_carga.png" alt="SIGAE" className="lr-logo" />
        </div>
        <div className="fw-bold text-muted small loader-text">CARGANDO SIGAE...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!usuario ? <Auth onLogin={handleLogin} /> : <Navigate to="/" replace />} />
        
        <Route path="/" element={usuario ? <Layout onLogout={() => setUsuario(null)} /> : <Navigate to="/login" replace />}>
          <Route index element={<Dashboard />} />
          <Route path="categoria/:categoryName" element={<CategoryDashboard />} />
          <Route path="categoria/Seguridad y Accesos/Mi Perfil" element={<MiPerfil />} />
          <Route path="categoria/Seguridad y Accesos/Métodos de Acceso" element={<MetodosAcceso />} />
          <Route path="categoria/Seguridad y Accesos/Gestión de Usuarios" element={<GestionUsuarios />} />
          <Route path="categoria/Seguridad y Accesos/Roles y Privilegios" element={<RolesPrivilegios />} />
          <Route path="categoria/Seguridad y Accesos/Preguntas de Seguridad" element={<PreguntasSeguridad />} />
          <Route path="categoria/Seguridad y Accesos/Auditoría del Sistema" element={<AuditoriaSistema />} />
          <Route path="categoria/Dirección y Sistema/Perfil de la Escuela" element={<PerfilEscuela />} />
          <Route path="categoria/Dirección y Sistema/Espacios Escolares" element={<EspaciosEscolares />} />
          <Route path="categoria/Dirección y Sistema/Configuración del Sistema" element={<ConfiguracionSistema />} />
          <Route path="categoria/Dirección y Sistema/División Territorial" element={<DivisionTerritorial />} />
          <Route path="categoria/Dirección y Sistema/Cerebro de Sigma" element={<CerebroSigma />} />
          <Route path="categoria/Dirección y Sistema/Gestión de Registros" element={<GestionRegistros />} />
          <Route path="categoria/Organización Escolar/Estructura Empresa" element={<EstructuraEmpresa />} />
          <Route path="categoria/Organización Escolar/Cargos Institucionales" element={<CargosInstitucionales />} />
          <Route path="categoria/Organización Escolar/Cadena Supervisoria" element={<CadenaSupervisoria />} />
          <Route path="categoria/Control de Estudios/Grados y Salones" element={<GradosSalones />} />
          <Route path="categoria/Gestión Docente/Mi Expediente" element={<MiExpediente />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
