import { useParams, useNavigate } from 'react-router-dom';
import { usePermisos } from '../hooks/usePermisos';

export const ModulosSistema = {
  "Dirección y Sistema": { 
    icono: "bi-bank", color: "#FF8D00", desc: "Gestión institucional, calendario y configuración.", 
    items: [
      { vista: "Perfil de la Escuela", icono: "bi-building" }, 
      { vista: "Espacios Escolares", icono: "bi-door-open" },
      { vista: "Configuración del Sistema", icono: "bi-sliders" },
      { vista: "Cerebro de Sigma", icono: "bi-robot" },
      { vista: "Calendario Escolar", icono: "bi-calendar-range" },
      { vista: "Gestión de Registros", icono: "bi-database-fill-gear" },
      { vista: "División Territorial", icono: "bi-geo-alt-fill" },
      { vista: "Panel de Control", icono: "bi-terminal-fill" }
    ] 
  },
  "Organización Escolar": { 
    icono: "bi-diagram-3", color: "#e11d48", desc: "Cargos, organigrama, colectivos y estructura.", 
    items: [
      { vista: "Cargos Institucionales", icono: "bi-briefcase-fill" }, 
      { vista: "Cadena Supervisoria", icono: "bi-diagram-2" },
      { vista: "Gestión de Colectivos", icono: "bi-people-fill" },
      { vista: "Estructura Empresa", icono: "bi-buildings-fill" }
    ] 
  },
  "Control de Estudios": { 
    icono: "bi-folder-check", color: "#00C3FF", desc: "Estructura académica de la institución.", 
    items: [
      { vista: "Grados y Salones", icono: "bi-grid-3x3-gap-fill" }
    ] 
  },
  "Gestión Estudiantil": { 
    icono: "bi-mortarboard-fill", color: "#8B5CF6", desc: "Inscripciones, expedientes y actualización de datos.", 
    items: [
      { vista: "Gestión de Admisiones", icono: "bi-ui-checks" },
      { vista: "Vincular Estudiante", icono: "bi-person-plus-fill" },
      { vista: "Expediente Estudiantil", icono: "bi-person-vcard" },
      { vista: "Actualización de Datos", icono: "bi-arrow-repeat" },
      { vista: "Solicitud de Cupos", icono: "bi-envelope-paper-fill" },
      { vista: "Verificaciones", icono: "bi-shield-check" },
      { vista: "Mis Solicitudes", icono: "bi-card-checklist" },
      { vista: "Gestión de Matrícula", icono: "bi-diagram-3-fill" }
    ] 
  },
  "Gestión Docente": { 
    icono: "bi-person-workspace", color: "#00E676", desc: "Administración del personal docente.", 
    items: [
      { vista: "Mi Expediente", icono: "bi-person-vcard" },
      { vista: "Gestor de Expedientes", icono: "bi-folder-symlink" }
    ] 
  },
  "Formación y Capacitación": { 
    icono: "bi-award-fill", color: "#8b5cf6", desc: "Cursos, talleres y certificados para la comunidad.", 
    items: [
      { vista: "Gestor de Catálogo", icono: "bi-journal-plus" },
      { vista: "Oferta Académica", icono: "bi-shop-window" },
      { vista: "Mis Certificados", icono: "bi-patch-check" },
      { vista: "Creador de Certificados", icono: "bi-patch-plus" }
    ] 
  },
  "Servicios y Bienestar": { 
    icono: "bi-heart-pulse", color: "#FF3D00", desc: "Rutas y monitoreo de transporte escolar.", 
    items: [
      { vista: "Transporte Escolar", icono: "bi-bus-front" }
    ] 
  },
  "Seguridad y Accesos": { 
    icono: "bi-shield-lock", color: "#455A64", desc: "Usuarios, contraseñas y permisos del sistema.", 
    items: [
      { vista: "Mi Perfil", icono: "bi-person-badge" }, 
      { vista: "Métodos de Acceso", icono: "bi-fingerprint" },
      { vista: "Gestión de Usuarios", icono: "bi-people" }, 
      { vista: "Roles y Privilegios", icono: "bi-key" },
      { vista: "Preguntas de Seguridad", icono: "bi-patch-question" },
      { vista: "Auditoría del Sistema", icono: "bi-list-check" } 
    ] 
  }
};

const paleta = [ 
  { bg: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)', border: '#bfdbfe', text: '#0066FF' }, 
  { bg: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)', border: '#bbf7d0', text: '#198754' }, 
  { bg: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)', border: '#fde68a', text: '#d97706' }, 
  { bg: 'linear-gradient(135deg, #ffffff 0%, #ecfeff 100%)', border: '#a5f3fc', text: '#0dcaf0' }, 
  { bg: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)', border: '#ddd6fe', text: '#6d28d9' }, 
  { bg: 'linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)', border: '#fecdd3', text: '#e11d48' } 
];

export const CategoryDashboard = () => {
  const { categoryName } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();
  const { tienePermiso, tienePermisoEnEscuela, loading: permLoading } = usePermisos();

  const decodedCategory = categoryName ? decodeURIComponent(categoryName) : '';
  const modulo = (ModulosSistema as any)[decodedCategory];

  if (permLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando permisos...</span>
        </div>
      </div>
    );
  }

  if (!modulo) {
    return (
      <div className="text-center py-5">
        <h3>Categoría no encontrada</h3>
        <button className="btn btn-primary rounded-pill mt-3" onClick={() => navigate('/')}>
          Volver al Inicio
        </button>
      </div>
    );
  }

  const escuelaCodigo = localStorage.getItem('sigae_escuela_codigo') || 'sb';
  const logoPath = `/assets/img/logo_${escuelaCodigo}.png`;

  const handleSubmoduloClick = (vista: string) => {
    if (
      decodedCategory === "Seguridad y Accesos" ||
      (decodedCategory === "Dirección y Sistema" && 
        (vista === "Perfil de la Escuela" || 
         vista === "Espacios Escolares" || 
         vista === "Configuración del Sistema" || 
         vista === "División Territorial" ||
         vista === "Cerebro de Sigma" ||
         vista === "Gestión de Registros" ||
         vista === "Panel de Control")) ||
      (decodedCategory === "Organización Escolar" && 
        (vista === "Estructura Empresa" || 
         vista === "Cargos Institucionales" || 
         vista === "Cadena Supervisoria" ||
         vista === "Gestión de Colectivos")) ||
      (decodedCategory === "Control de Estudios" && vista === "Grados y Salones") ||
      (decodedCategory === "Gestión Docente" && (vista === "Mi Expediente" || vista === "Gestor de Expedientes")) ||
      (decodedCategory === "Gestión Estudiantil" && vista === "Solicitud de Cupos") ||
      (decodedCategory === "Servicios y Bienestar" && vista === "Transporte Escolar")
    ) {
      navigate(`/categoria/${encodeURIComponent(decodedCategory)}/${encodeURIComponent(vista)}`);
      return;
    }

    if ((window as any).Swal) {
      (window as any).Swal.fire({
        title: 'Módulo en Migración',
        text: `El submódulo "${vista}" se encuentra en proceso de migración al nuevo sistema React + TypeScript.`,
        icon: 'info',
        confirmButtonColor: 'var(--color-primario)',
        confirmButtonText: 'Entendido'
      });
    } else {
      alert(`El submódulo "${vista}" se encuentra en proceso de migración.`);
    }
  };

  return (
    <div className="modulo-animado">
      <div className="row mb-5 animate__animated animate__fadeInDown">
        <div className="col-12">
          <div className="banner-modulo p-4 p-md-5 text-white" style={{ background: `linear-gradient(135deg, ${modulo.color} 0%, rgba(0,0,0,0.4) 150%)` }}>
            <div className="burbuja-3d burbuja-1"></div>
            <div className="burbuja-3d burbuja-2"></div>
            <div className="burbuja-3d burbuja-3"></div>
            <div className="row align-items-center position-relative z-1">
              <div className="col-md-9 text-center text-md-start mb-3 mb-md-0">
                <span className="badge bg-white shadow-sm mb-3 px-3 py-2 fw-bold" style={{ color: modulo.color, letterSpacing: '1px', fontSize: '0.85rem' }}>
                  <i className={`bi ${modulo.icono} me-1`}></i> CATEGORÍA DEL SISTEMA
                </span>
                <h1 className="fw-bolder mb-2 text-white" style={{ fontSize: '2.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{decodedCategory}</h1>
                <p className="mb-0 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.9)' }}>{modulo.desc}</p>
              </div>
              <div className="col-md-3 text-center text-md-end d-none d-md-block">
                <img 
                  src={logoPath} 
                  alt="Logo Escuela" 
                  style={{ maxHeight: '130px', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }} 
                  onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {modulo.items
          .filter((item: any) => {
            // Para módulos con separación por escuela, basta con tener acceso en AL MENOS UNA escuela
            if (item.vista === 'Gestión de Colectivos') {
              return tienePermisoEnEscuela('sb', item.vista, 'ver') ||
                     tienePermisoEnEscuela('lb', item.vista, 'ver');
            }
            return tienePermiso(item.vista, 'ver');
          })
          .map((item: any, idx: number) => {
            const color = paleta[idx % paleta.length];
            return (
              <div key={item.vista} className="col-12 col-md-6 col-xl-4 d-flex align-items-stretch animate__animated animate__fadeInUp" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div 
                  className="tarjeta-modulo-nueva shadow-sm w-100" 
                  style={{ background: color.bg, border: `2px solid ${color.border}` }}
                  onClick={() => handleSubmoduloClick(item.vista)}
                >
                <i className={`bi ${item.icono} bg-icono-gigante`} style={{ color: color.text }}></i>
                <div className="contenido-t">
                  <div className="icono-caja shadow-sm" style={{ color: color.text, border: `1px solid ${color.border}`, background: 'white' }}>
                    <i className={`bi ${item.icono}`}></i>
                  </div>
                  <h4 className="titulo-t">{item.vista}</h4>
                  <span className="link-t" style={{ color: color.text }}>Entrar al submódulo <i className="bi bi-arrow-right"></i></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
