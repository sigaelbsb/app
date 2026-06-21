import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';

interface Cargo {
  id_cargo: string;
  nombre_cargo: string;
  tipo_cargo: string;
  descripcion: string;
  depende_de: string | null;
  id_escuela: string | null;
}

interface UsuarioSimple {
  id_usuario: string;
  cedula: string;
  nombre_completo: string;
  cargo: string | null;
  id_escuela: string | null;
}

// Recursive Node Component for Organigram Tree
const OrganigramaNodo = ({
  cargo,
  cargos,
  usuarios,
  mostrarNombres,
  escuelaContext = null,
  visitados = new Set<string>()
}: {
  cargo: Cargo;
  cargos: Cargo[];
  usuarios: UsuarioSimple[];
  mostrarNombres: boolean;
  escuelaContext?: 'sb' | 'lb' | null;
  visitados?: Set<string>;
}) => {
  if (visitados.has(cargo.id_cargo)) {
    return (
      <li>
        <div className="nodo-cargo-custom" style={{ borderColor: '#ef4444', backgroundColor: '#fee2e2' }}>
          ⚠️ Ciclo: {cargo.nombre_cargo}
        </div>
      </li>
    );
  }

  const newVisitados = new Set(visitados);
  newVisitados.add(cargo.id_cargo);

  const tipo = (cargo.tipo_cargo || '').toLowerCase();
  let cBg = '#ffffff';
  let cBorde = '#0066FF';
  let cTexto = '#0066FF';

  if (tipo.includes('directiv')) {
    cBg = '#f5f3ff';
    cBorde = '#7c3aed';
    cTexto = '#5b21b6';
  } else if (tipo.includes('coord') || tipo.includes('superv')) {
    cBg = '#eff6ff';
    cBorde = '#2563eb';
    cTexto = '#1d4ed8';
  } else if (tipo.includes('docen') || tipo.includes('pedag')) {
    cBg = '#f0fdf4';
    cBorde = '#16a34a';
    cTexto = '#14532d';
  } else if (tipo.includes('admin')) {
    cBg = '#fffbeb';
    cBorde = '#d97706';
    cTexto = '#78350f';
  } else if (tipo.includes('obrer') || tipo.includes('apoyo')) {
    cBg = '#f8fafc';
    cBorde = '#475569';
    cTexto = '#0f172a';
  }

  let dueños = usuarios.filter(u => {
    if (u.cargo !== cargo.nombre_cargo) return false;
    if (escuelaContext) {
      return u.id_escuela === escuelaContext;
    }
    if (cargo.id_escuela) {
      return u.id_escuela === cargo.id_escuela;
    }
    return true;
  });

  const hijos = cargos.filter(c => c.depende_de === cargo.id_cargo);
  hijos.sort((a, b) => a.nombre_cargo.localeCompare(b.nombre_cargo));

  // Duplicar el nodo del director si estamos en la parte global y queremos separar las dos escuelas
  const hijosParaRender = hijos.flatMap(h => {
    if (escuelaContext === null && h.nombre_cargo.toLowerCase().includes('director')) {
      return [
        { cargoHijo: h, escCtx: 'sb' as const },
        { cargoHijo: h, escCtx: 'lb' as const }
      ];
    }
    return [{ cargoHijo: h, escCtx: escuelaContext }];
  });

  let nombreMostrado = cargo.nombre_cargo;
  if (escuelaContext && !cargo.id_escuela) {
    nombreMostrado += escuelaContext === 'sb' ? ' (Santa Bárbara)' : ' (Libertador Bolívar)';
  }

  return (
    <li>
      <div className="nodo-cargo-custom" style={{ borderColor: cBorde, backgroundColor: cBg }}>
        <div style={{ color: cTexto, fontWeight: 900, fontSize: '11px', fontFamily: 'sans-serif', textTransform: 'uppercase', marginBottom: '3px', lineHeight: 1.2 }}>
          {nombreMostrado}
        </div>
        <div style={{ color: '#475569', fontSize: '9px', fontFamily: 'sans-serif', fontWeight: 600 }}>
          {cargo.tipo_cargo}
        </div>
        {mostrarNombres && (
          <div style={{ marginTop: '6px', paddingTop: '4px', borderTop: `1px dashed ${cBorde}`, fontSize: '9px' }}>
            {dueños.length > 0 ? (
              dueños.map(d => (
                <div key={d.id_usuario} style={{ fontWeight: 'bold', color: '#1e293b', marginTop: '2px' }}>
                  {d.nombre_completo}
                </div>
              ))
            ) : (
              <div style={{ color: '#ef4444', fontWeight: 'bold', fontStyle: 'italic' }}>Vacante</div>
            )}
          </div>
        )}
      </div>

      {hijosParaRender.length > 0 && (
        <ul>
          {hijosParaRender.map(({ cargoHijo, escCtx }, idx) => (
            <OrganigramaNodo
              key={`${cargoHijo.id_cargo}-${escCtx || 'global'}-${idx}`}
              cargo={cargoHijo}
              cargos={cargos}
              usuarios={usuarios}
              mostrarNombres={mostrarNombres}
              escuelaContext={escCtx}
              visitados={newVisitados}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export const CadenaSupervisoria = () => {
  const navigate = useNavigate();
  const { tienePermiso, tienePermisoEnEscuela, user, loading: permLoading } = usePermisos();
  const Swal = (window as any).Swal;

  const [activeView, setActiveView] = useState<'dashboard' | 'constructor' | 'mapa'>('dashboard');

  // Master Data
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioSimple[]>([]);
  const [loading, setLoading] = useState(true);

  // Escuela Activa del Organigrama
  const [escuelaFiltroMapa, setEscuelaFiltroMapa] = useState<'sb' | 'lb' | 'consolidado'>('sb');

  // Constructor state (Cargo-centric)
  const [cambiosPendientes, setCambiosPendientes] = useState<{ [cargoId: string]: string | null }>({});
  const [busquedaConstructor, setBusquedaConstructor] = useState('');
  const [filtroEscuelaConstructor, setFiltroEscuelaConstructor] = useState<'todos' | 'sb' | 'lb' | 'global'>('todos');

  // Organigram map state
  const [filtroRama, setFiltroRama] = useState('');
  const [mostrarNombres, setMostrarNombres] = useState(false);

  // Permisos
  const pCrear = tienePermiso('Función: Estructurar Cadena', 'crear');
  const pImprimir = tienePermiso('Función: Imprimir Organigrama', 'imprimir');

  const hasModuloAcceso = tienePermiso('Cadena Supervisoria', 'ver');
  const isRestricted = !permLoading && !hasModuloAcceso;

  // Initialize school filter based on privileges
  useEffect(() => {
    if (!permLoading && user) {
      const canSB = tienePermisoEnEscuela('sb', 'Cadena Supervisoria', 'ver');
      const canLB = tienePermisoEnEscuela('lb', 'Cadena Supervisoria', 'ver');
      if (canSB && canLB) {
        setEscuelaFiltroMapa('consolidado');
      } else if (canLB) {
        setEscuelaFiltroMapa('lb');
      } else {
        setEscuelaFiltroMapa('sb');
      }
    }
  }, [permLoading, user]);

  useEffect(() => {
    if (!permLoading && hasModuloAcceso) {
      cargarDatosMaestros();
    }
  }, [permLoading]);

  const cargarDatosMaestros = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const [resCargos, resUsers] = await Promise.all([
        supabase.from('cargos').select('*').order('nombre_cargo', { ascending: true }),
        supabase.from('usuarios').select('id_usuario, cedula, nombre_completo, cargo, id_escuela')
      ]);

      if (resCargos.error) throw resCargos.error;
      if (resUsers.error) throw resUsers.error;

      setCargos(resCargos.data || []);
      setUsuarios(resUsers.data || []);
    } catch (e: any) {
      console.error("Error cargando jerarquía:", e);
      if (Swal) Swal.fire("Error", "No se pudo conectar con la base de datos Supabase.", "error");
    }
    if (!silencioso) setLoading(false);
  };

  // Prevenir ciclos jerárquicos
  const detectarCiclo = (cargoId: string, supervisorId: string, cargosList: Cargo[]): boolean => {
    if (cargoId === supervisorId) return true;
    let currentSup = cargosList.find(c => c.id_cargo === supervisorId);
    const visitados = new Set<string>();
    while (currentSup && currentSup.depende_de) {
      if (currentSup.depende_de === cargoId) return true;
      if (visitados.has(currentSup.depende_de)) break; // Evitar bucles infinitos por datos corruptos
      visitados.add(currentSup.depende_de);
      currentSup = cargosList.find(c => c.id_cargo === currentSup!.depende_de);
    }
    return false;
  };

  const handleChangeSupervisor = (cargoId: string, nuevoSupId: string) => {
    const cargo = cargos.find(c => c.id_cargo === cargoId);
    if (!cargo) return;

    const valGuardar = nuevoSupId === "" ? null : nuevoSupId;
    const esOriginal = cargo.depende_de === valGuardar;

    setCambiosPendientes(prev => {
      const copia = { ...prev };
      if (esOriginal) {
        delete copia[cargoId];
      } else {
        copia[cargoId] = valGuardar;
      }
      return copia;
    });
  };

  const handleSaveJerarquia = async () => {
    if (!pCrear) {
      if (Swal) Swal.fire('Aviso', 'Sin permisos para editar la jerarquía.', 'error');
      return;
    }

    if (Object.keys(cambiosPendientes).length === 0) {
      if (Swal) Swal.fire('Aviso', 'No hay cambios pendientes por guardar.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const promesas: any[] = [];
      Object.entries(cambiosPendientes).forEach(([cargoId, nuevoSup]) => {
        promesas.push(
          supabase.from('cargos').update({ depende_de: nuevoSup }).eq('id_cargo', cargoId)
        );
      });

      if (promesas.length > 0) {
        await Promise.all(promesas);
      }

      if (Swal) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Estructura actualizada',
          showConfirmButton: false,
          timer: 3000
        });
      }

      auditar('Cadena Supervisoria', 'Estructurar Cadena', `Se actualizaron las dependencias de ${Object.keys(cambiosPendientes).length} cargos.`);
      
      setCambiosPendientes({});
      await cargarDatosMaestros(true);
      setActiveView('dashboard');
    } catch (e: any) {
      console.error(e);
      if (Swal) Swal.fire('Error', 'Falla al actualizar la estructura en Supabase.', 'error');
    }
    setLoading(false);
  };

  // PDF Export logic
  const obtenerImagenBase64 = (url: string): Promise<string | null> => {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const handleExportPDF = () => {
    if (!pImprimir) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tiene permisos para exportar.', 'error');
      return;
    }

    if (!Swal) return;

    Swal.fire({
      title: 'Exportar Organigrama',
      text: '¿Cómo desea orientar la hoja PDF?',
      icon: 'question',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-aspect-ratio me-1"></i> Horizontal',
      denyButtonText: '<i class="bi bi-file-earmark-pdf me-1"></i> Vertical',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0066FF',
      denyButtonColor: '#455A64'
    }).then((result: any) => {
      if (result.isConfirmed) {
        generarPDF('landscape');
      } else if (result.isDenied) {
        generarPDF('portrait');
      }
    });
  };

  const generarPDF = async (orientacion: 'landscape' | 'portrait') => {
    const div = document.getElementById('chart_div');
    if (!div || div.innerHTML === '' || cargos.length === 0) {
      if (Swal) Swal.fire('Atención', 'No hay organigrama para exportar.', 'warning');
      return;
    }

    const html2canvas = (window as any).html2canvas;
    const jspdf = (window as any).jspdf;

    if (!html2canvas || !jspdf) {
      if (Swal) Swal.fire('Error Técnico', 'Librerías html2canvas o jsPDF no cargadas.', 'error');
      return;
    }

    if (Swal) {
      Swal.fire({
        title: 'Generando PDF Oficial...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });
    }

    try {
      const base64LogoEscuela = await obtenerImagenBase64('/assets/img/sigae.png'); // fallback to sigae
      const base64CintilloMPPE = await obtenerImagenBase64('/assets/img/logoMPPE.png');

      const clon = div.cloneNode(true) as HTMLElement;
      clon.style.width = 'max-content';
      clon.style.height = 'max-content';
      clon.style.padding = '20px';
      clon.style.position = 'absolute';
      clon.style.top = '-9999px';
      clon.style.left = '-9999px';
      clon.style.background = '#ffffff';
      document.body.appendChild(clon);

      // Give images time to render
      await new Promise(r => setTimeout(r, 600));

      const canvas = await html2canvas(clon, { scale: 2, backgroundColor: '#ffffff', logging: false });
      document.body.removeChild(clon);
      const imgData = canvas.toDataURL('image/png');

      const jsPDFClass = jspdf.jsPDF;
      const doc = new jsPDFClass({ orientation: orientacion, unit: 'mm', format: 'letter' });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;

      // Header
      let textX = margin;
      if (base64LogoEscuela) {
        doc.addImage(base64LogoEscuela, 'PNG', margin, margin, 14, 14);
        textX = margin + 18;
      }

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('República Bolivariana de Venezuela', textX, margin + 4);
      doc.text('Ministerio del Poder Popular para la Educación', textX, margin + 8);
      
      const escuelaNombre = escuelaFiltroMapa === 'sb' ? 'U.E. Santa Bárbara' : escuelaFiltroMapa === 'lb' ? 'U.E. Libertador Bolívar' : 'Estructura Consolidada';
      doc.setFont('helvetica', 'bold');
      doc.text(escuelaNombre, textX, margin + 12);

      // Title
      doc.setTextColor(109, 40, 217);
      doc.setFontSize(14);
      doc.text('ORGANIGRAMA INSTITUCIONAL', pageWidth / 2, margin + 20, { align: 'center' });

      doc.setDrawColor(109, 40, 217);
      doc.setLineWidth(1.0);
      doc.line(margin, margin + 25, pageWidth - margin, margin + 25);

      const topSpace = margin + 30;
      const bottomSpace = 25;

      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - topSpace - bottomSpace;

      const imgProps = doc.getImageProperties(imgData);
      const ratio = Math.min(availableWidth / imgProps.width, availableHeight / imgProps.height);
      const finalWidth = imgProps.width * ratio;
      const finalHeight = imgProps.height * ratio;

      const x = margin + (availableWidth - finalWidth) / 2;
      const y = topSpace;

      doc.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);

      // Footer
      const footerY = pageHeight - bottomSpace + 10;
      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(0.4);
      doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

      if (base64CintilloMPPE) {
        doc.addImage(base64CintilloMPPE, 'PNG', margin, footerY, 28, 8);
      }

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      const fechaHoy = new Date().toLocaleDateString('es-VE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      doc.text(`Generado: ${fechaHoy}`, margin + 32, footerY + 5);
      doc.text('Sistema SIGAE Unificado v1.0', pageWidth - margin, footerY + 5, { align: 'right' });

      doc.save('Organigrama_Institucional.pdf');
      
      if (Swal) {
        Swal.close();
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'PDF Exportado con Éxito',
          showConfirmButton: false,
          timer: 3000
        });
      }

      auditar('Cadena Supervisoria', 'Imprimir Organigrama', 'Se exportó el mapa institucional en formato PDF.');
    } catch (error) {
      console.error(error);
      if (Swal) {
        Swal.close();
        Swal.fire('Error', 'Fallo al generar el PDF.', 'error');
      }
    }
  };

  // Filtrar cargos y usuarios según escuela seleccionada en el mapa
  const cargosVisibles = cargos.filter(c => {
    if (escuelaFiltroMapa === 'consolidado') return true;
    return c.id_escuela === escuelaFiltroMapa || !c.id_escuela;
  });

  const usuariosVisibles = usuarios.filter(u => {
    if (escuelaFiltroMapa === 'consolidado') return true;
    return u.id_escuela === escuelaFiltroMapa;
  });

  // Find root leaders (those with depende_de === null or reports to someone outside this view)
  let raices: Cargo[] = [];
  if (filtroRama) {
    const r = cargosVisibles.find(c => String(c.id_cargo) === String(filtroRama));
    if (r) raices.push(r);
  } else {
    raices = cargosVisibles.filter(c => {
      if (!c.depende_de) return true;
      // Si el supervisor directo no forma parte de los cargos visibles en esta escuela, este cargo se convierte en raíz aquí
      return !cargosVisibles.some(x => x.id_cargo === c.depende_de);
    });
    raices.sort((a, b) => a.nombre_cargo.localeCompare(b.nombre_cargo));
  }

  if (permLoading || (loading && cargos.length === 0)) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5 h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando jerarquías...</span>
        </div>
      </div>
    );
  }

  if (isRestricted) {
    return (
      <div className="col-12 text-center py-5 mt-4">
        <div className="bg-light d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm border" style={{ width: '100px', height: '100px' }}>
          <i className="bi bi-shield-lock-fill text-muted" style={{ fontSize: '3.5rem' }}></i>
        </div>
        <h4 className="text-dark fw-bold mb-2">Área Restringida</h4>
        <p className="text-muted mb-0">No tienes permisos asignados para acceder a la jerarquía de cargos.</p>
      </div>
    );
  }

  return (
    <div className="modulo-animado container-fluid p-0">
      {/* Banner */}
      <div className="row mb-4 animate__animated animate__fadeInDown">
        <div className="col-12">
          <div 
            className="banner-modulo p-4 p-md-5 text-white shadow-sm" 
            style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
          >
            <div className="burbuja-3d burbuja-1" style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.06)', position: 'absolute', top: '-50px', right: '-20px', borderRadius: '50%' }}></div>
            <div className="burbuja-3d burbuja-2" style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.04)', position: 'absolute', bottom: '-20px', left: '20px', borderRadius: '50%' }}></div>
            <div className="row align-items-center position-relative z-1">
              <div className="col-12 text-center text-md-start">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <span className="badge bg-white mb-0 px-3 py-2 shadow-sm fw-bold" style={{ color: '#0f172a', letterSpacing: '1px', fontSize: '0.85rem' }}>
                    <i className="bi bi-diagram-2-fill me-1"></i> ORGANIZACIÓN JERÁRQUICA
                  </span>
                  {activeView !== 'dashboard' ? (
                    <button 
                      onClick={() => setActiveView('dashboard')} 
                      className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                    >
                      <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
                    </button>
                  ) : (
                    <button 
                      onClick={() => navigate('/categoria/Organizaci%C3%B3n%20Escolar')} 
                      className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                    >
                      <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
                    </button>
                  )}
                </div>
                <h1 className="fw-bolder mb-2 text-white" style={{ fontSize: '2.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  <i className="bi bi-diagram-2-fill me-3"></i>Cadena Supervisoria
                </h1>
                <p className="mb-0 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Configuración de subordinados y mapa interactivo del organigrama escolar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD VIEW */}
      {activeView === 'dashboard' && (
        <div className="row g-4 justify-content-center animate__animated animate__fadeIn">
          <div className="col-md-6 col-xl-5">
            <div 
              className={`tarjeta-modulo-nueva p-5 text-center h-100 shadow-sm rounded-4 cursor-pointer`} 
              onClick={() => setActiveView('constructor')}
              style={{ background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)', border: '2px solid #bfdbfe' }}
            >
              <div className="bg-primary bg-opacity-10 d-inline-flex p-4 rounded-circle mb-4 text-primary align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                <i className="bi bi-diagram-3-fill fs-1"></i>
              </div>
              <h4 className="fw-bold text-dark mb-2">Estructurar Cadena</h4>
              <p className="small text-muted mb-4 text-center">Configura quién depende de quién en los cargos escolares, asignando jefes y subordinados de forma sencilla.</p>
              <span className="btn btn-sm btn-primary rounded-pill px-4 fw-bold shadow-sm">Ingresar al Constructor <i className="bi bi-arrow-right ms-1"></i></span>
            </div>
          </div>

          <div className="col-md-6 col-xl-5">
            <div 
              className={`tarjeta-modulo-nueva p-5 text-center h-100 shadow-sm rounded-4 cursor-pointer`} 
              onClick={() => setActiveView('mapa')}
              style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)', border: '2px solid #ddd6fe' }}
            >
              <div className="bg-purple bg-opacity-10 d-inline-flex p-4 rounded-circle mb-4 text-purple align-items-center justify-content-center" style={{ width: '80px', height: '80px', color: '#7c3aed' }}>
                <i className="bi bi-bezier2 fs-1"></i>
              </div>
              <h4 className="fw-bold text-dark mb-2">Ver Mapa / Organigrama</h4>
              <p className="small text-muted mb-4 text-center">Explora el organigrama interactivo de la institución en tiempo real con cruce de empleados y exportación a PDF.</p>
              <span className="btn btn-sm btn-primary rounded-pill px-4 fw-bold shadow-sm" style={{ background: '#7c3aed', borderColor: '#7c3aed' }}>Visualizar Organigrama <i className="bi bi-arrow-right ms-1"></i></span>
            </div>
          </div>
        </div>
      )}

      {/* CONSTRUCTOR VIEW */}
      {activeView === 'constructor' && (
        <div className="row g-4 animate__animated animate__fadeIn">
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h5 className="mb-1 fw-bold text-dark">Constructor de Jerarquías (Cadena Supervisoria)</h5>
                  <p className="mb-0 text-muted small">Asigna directamente el supervisor a cada uno de los cargos de la institución.</p>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {pCrear ? (
                    <button 
                      onClick={handleSaveJerarquia} 
                      className="btn btn-success rounded-pill fw-bold hover-efecto"
                      disabled={Object.keys(cambiosPendientes).length === 0}
                    >
                      <i className="bi bi-floppy-fill me-2"></i> Guardar Estructura ({Object.keys(cambiosPendientes).length})
                    </button>
                  ) : (
                    <span className="text-danger small fw-bold"><i className="bi bi-lock-fill me-1"></i>Sin permisos para modificar.</span>
                  )}
                </div>
              </div>
              <div className="card-body p-4">
                {/* Filtros Constructor */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6 col-lg-4">
                    <label className="form-label small fw-bold text-muted">Filtrar por Escuela</label>
                    <select
                      className="form-select form-select-sm input-moderno"
                      value={filtroEscuelaConstructor}
                      onChange={(e) => setFiltroEscuelaConstructor(e.target.value as any)}
                    >
                      <option value="todos">Todos los Cargos</option>
                      <option value="sb">U.E. Santa Bárbara</option>
                      <option value="lb">U.E. Libertador Bolívar</option>
                      <option value="global">Globales</option>
                    </select>
                  </div>
                  <div className="col-md-6 col-lg-8">
                    <label className="form-label small fw-bold text-muted">Buscar Cargo</label>
                    <div className="position-relative">
                      <span className="position-absolute start-0 top-50 translate-middle-y ms-3 text-muted">
                        <i className="bi bi-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control form-control-sm rounded-pill ps-5 input-moderno"
                        placeholder="Escribe el nombre del cargo..."
                        value={busquedaConstructor}
                        onChange={(e) => setBusquedaConstructor(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Grid de Cargos */}
                <div className="row g-3">
                  {cargos
                    .filter(c => {
                      const coincideNombre = c.nombre_cargo.toLowerCase().includes(busquedaConstructor.toLowerCase());
                      const coincideEscuela =
                        filtroEscuelaConstructor === 'todos' ||
                        (filtroEscuelaConstructor === 'sb' && c.id_escuela === 'sb') ||
                        (filtroEscuelaConstructor === 'lb' && c.id_escuela === 'lb') ||
                        (filtroEscuelaConstructor === 'global' && !c.id_escuela);
                      return coincideNombre && coincideEscuela;
                    })
                    .map(c => {
                      const isPending = cambiosPendientes.hasOwnProperty(c.id_cargo);
                      const currentSupId = isPending ? (cambiosPendientes[c.id_cargo] || '') : (c.depende_de || '');
                      const dueños = usuarios.filter(u => u.cargo === c.nombre_cargo);

                      const tipo = (c.tipo_cargo || '').toLowerCase();
                      let badgeColor = 'secondary';
                      if (tipo.includes('directiv')) badgeColor = 'danger';
                      else if (tipo.includes('coord') || tipo.includes('superv')) badgeColor = 'warning text-dark';
                      else if (tipo.includes('docen') || tipo.includes('pedag')) badgeColor = 'success';
                      else if (tipo.includes('admin')) badgeColor = 'primary';

                      return (
                        <div className="col-md-6 col-lg-4 animate__animated animate__fadeIn" key={c.id_cargo}>
                          <div 
                            className="card border shadow-sm rounded-4 h-100" 
                            style={{
                              backgroundColor: '#ffffff',
                              border: isPending ? '2px solid #eab308' : '1px solid #e2e8f0'
                            }}
                          >
                            <div className="card-body p-4 d-flex flex-column justify-content-between">
                              <div>
                                <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                                  <span className={`badge bg-${badgeColor.replace(' text-dark', '')} bg-opacity-10 text-${badgeColor.replace(' text-dark', '')} border border-${badgeColor.replace(' text-dark', '')} px-2 py-0.5`} style={{ fontSize: '0.7rem' }}>
                                    {c.tipo_cargo}
                                  </span>
                                  {c.id_escuela === 'sb' && (
                                    <span className="badge bg-success bg-opacity-10 text-success border border-success" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                      Santa Bárbara
                                    </span>
                                  )}
                                  {c.id_escuela === 'lb' && (
                                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                      Libertador Bolívar
                                    </span>
                                  )}
                                  {!c.id_escuela && (
                                    <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                      Global
                                    </span>
                                  )}
                                </div>
                                <h6 className="fw-bold text-dark mb-2">{c.nombre_cargo}</h6>
                                
                                <div className="small text-muted mb-3" style={{ fontSize: '0.78rem' }}>
                                  <strong className="text-dark">Personal asignado:</strong>{' '}
                                  {dueños.length > 0 ? (
                                    <span className="fw-bold text-primary">{dueños.map(d => d.nombre_completo).join(', ')}</span>
                                  ) : (
                                    <span className="text-danger italic">Vacante</span>
                                  )}
                                </div>
                              </div>

                              <div className="pt-2 border-top">
                                <label className="form-label small fw-bold text-muted mb-1" style={{ fontSize: '0.75rem' }}>
                                  <i className="bi bi-chevron-bar-up me-1"></i>Supervisor Directo (Reporta a)
                                </label>
                                <select
                                  className="form-select form-select-sm input-moderno fw-bold"
                                  value={currentSupId}
                                  onChange={(e) => handleChangeSupervisor(c.id_cargo, e.target.value)}
                                  disabled={!pCrear}
                                  style={{ fontSize: '0.8rem', cursor: 'pointer' }}
                                >
                                  <option value="">-- Sin Supervisor (Raíz) --</option>
                                  {cargos
                                    .filter(posSup => {
                                      if (posSup.id_cargo === c.id_cargo) return false;
                                      // Restricción: un cargo de escuela no puede reportar a otra escuela
                                      if (c.id_escuela && posSup.id_escuela && c.id_escuela !== posSup.id_escuela) return false;
                                      // Prevenir ciclos jerárquicos
                                      return !detectarCiclo(c.id_cargo, posSup.id_cargo, cargos);
                                    })
                                    .map(posSup => (
                                      <option key={posSup.id_cargo} value={posSup.id_cargo}>
                                        {posSup.nombre_cargo} {posSup.id_escuela ? `(${posSup.id_escuela.toUpperCase()})` : '(Global)'}
                                      </option>
                                    ))}
                                </select>

                                {isPending && (
                                  <div className="mt-2 text-end">
                                    <span className="badge bg-warning bg-opacity-20 text-warning px-2 py-0.5" style={{ fontSize: '0.7rem', color: '#854d0e', border: '1px solid #fef08a' }}>
                                      <i className="bi bi-exclamation-circle-fill me-1"></i>Cambio sin guardar
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ORGANIGRAMA VIEW */}
      {activeView === 'mapa' && (
        <div className="row g-4 animate__animated animate__fadeIn">
          {/* Controles de filtro */}
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4 d-flex justify-content-between align-items-center flex-wrap gap-4">
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  {/* Selector de escuela para Organigrama (solo si tiene acceso a ambas) */}
                  {tienePermisoEnEscuela('sb', 'Cadena Supervisoria', 'ver') && tienePermisoEnEscuela('lb', 'Cadena Supervisoria', 'ver') && (
                    <div>
                      <label className="form-label small fw-bold text-muted mb-1">Estructura Escolar</label>
                      <div className="btn-group btn-group-sm shadow-sm border rounded-pill overflow-hidden" role="group">
                        <button 
                          type="button" 
                          onClick={() => { setEscuelaFiltroMapa('sb'); setFiltroRama(''); }} 
                          className={`btn btn-sm px-3 fw-bold ${escuelaFiltroMapa === 'sb' ? 'btn-primary' : 'btn-light text-muted'}`}
                          style={{ border: 'none' }}
                        >
                          U.E. Santa Bárbara
                        </button>
                        <button 
                          type="button" 
                          onClick={() => { setEscuelaFiltroMapa('lb'); setFiltroRama(''); }} 
                          className={`btn btn-sm px-3 fw-bold ${escuelaFiltroMapa === 'lb' ? 'btn-primary' : 'btn-light text-muted'}`}
                          style={{ border: 'none' }}
                        >
                          U.E. Libertador Bolívar
                        </button>
                        <button 
                          type="button" 
                          onClick={() => { setEscuelaFiltroMapa('consolidado'); setFiltroRama(''); }} 
                          className={`btn btn-sm px-3 fw-bold ${escuelaFiltroMapa === 'consolidado' ? 'btn-primary' : 'btn-light text-muted'}`}
                          style={{ border: 'none' }}
                        >
                          Consolidado
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="form-label small fw-bold text-muted mb-1">Filtrar por Rama</label>
                    <select 
                      className="form-select form-select-sm input-moderno" 
                      style={{ minWidth: '220px' }}
                      value={filtroRama}
                      onChange={(e) => setFiltroRama(e.target.value)}
                    >
                      <option value="">Mostrar Toda la Estructura</option>
                      {cargosVisibles.map(c => (
                        <option key={c.id_cargo} value={c.id_cargo}>
                          {c.nombre_cargo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-check mt-md-4 pt-1">
                    <input 
                      className="form-check-input border-secondary" 
                      type="checkbox" 
                      id="chk-nombres" 
                      checked={mostrarNombres}
                      onChange={(e) => setMostrarNombres(e.target.checked)}
                    />
                    <label className="form-check-label fw-bold text-dark small" htmlFor="chk-nombres">
                      Mostrar Nombres de Empleados
                    </label>
                  </div>
                </div>
                {pImprimir && (
                  <button 
                    onClick={handleExportPDF} 
                    className="btn btn-primary rounded-pill fw-bold hover-efecto"
                  >
                    <i className="bi bi-file-earmark-pdf-fill me-2"></i> Exportar Organigrama
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Lienzo del Organigrama */}
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4" style={{ overflow: 'auto' }}>
              <div className="card-body p-5 text-center bg-white" style={{ minHeight: '400px' }}>
                
                {cargosVisibles.length === 0 ? (
                  <div className="text-muted fs-5 py-5">
                    No hay cargos creados en el sistema para esta vista.
                  </div>
                ) : raices.length === 0 ? (
                  <div className="alert alert-warning border-warning shadow-sm mx-auto" style={{ maxWidth: '600px' }}>
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>Atención:</strong> No se pudo encontrar un Líder o Director Principal. 
                    Asegúrate de que el cargo más alto de la escuela <strong>NO TENGA</strong> ningún supervisor asignado.
                  </div>
                ) : (
                  <div id="chart_div" className="mi-organigrama">
                    <ul>
                      {raices.map(raiz => (
                        <OrganigramaNodo
                          key={raiz.id_cargo}
                          cargo={raiz}
                          cargos={cargosVisibles}
                          usuarios={usuariosVisibles}
                          mostrarNombres={mostrarNombres}
                          escuelaContext={escuelaFiltroMapa === 'consolidado' ? null : escuelaFiltroMapa}
                        />
                      ))}
                    </ul>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
