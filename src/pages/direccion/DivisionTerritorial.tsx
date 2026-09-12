import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';
import { 
  ChamiloBreadcrumb, 
  ChamiloHelpCallout, 
  IconoDivisionTerritorial,
  IconoEstadoVenezuela,
  IconoMunicipioVenezuela,
  IconoParroquiaVenezuela 
} from '../../components/chamilo';

interface DivisionRecord {
  id: number;
  estado: string;
  municipio: string;
  parroquia: string;
}

export const DivisionTerritorial = () => {
  const navigate = useNavigate();
  const { tienePermiso, user, loading: permLoading } = usePermisos();
  const Swal = (window as any).Swal;

  const [records, setRecords] = useState<DivisionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Selections
  const [estadoSel, setEstadoSel] = useState<string | null>(null);
  const [municipioSel, setMunicipioSel] = useState<string | null>(null);
  const [tabMovil, setTabMovil] = useState<'estados' | 'municipios' | 'parroquias'>('estados');

  const esAdmin = user?.rol && user.rol.toLowerCase().includes('administrador');
  const hasVer = esAdmin || tienePermiso('División Territorial', 'ver');
  const hasCrear = esAdmin || tienePermiso('División Territorial', 'crear');
  const hasModificar = esAdmin || tienePermiso('División Territorial', 'modificar');
  const hasEliminar = esAdmin || tienePermiso('División Territorial', 'eliminar');

  const isModuleRestricted = !permLoading && !hasVer;

  useEffect(() => {
    if (!permLoading && hasVer) {
      cargarDatos();
    }
  }, [permLoading]);

  const cargarDatos = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      let allRecords: any[] = [];
      let from = 0;
      const limit = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('div_pol_vzla')
          .select('*')
          .order('estado', { ascending: true })
          .order('municipio', { ascending: true })
          .order('parroquia', { ascending: true })
          .range(from, from + limit - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        allRecords = [...allRecords, ...data];
        if (data.length < limit) break;
        from += limit;
      }
      setRecords(allRecords);
    } catch (e) {
      console.error(e);
      if (Swal) Swal.fire('Error', 'No se pudo conectar con la base de datos de divisiones territoriales.', 'error');
    }
    if (!silencioso) setLoading(false);
  };

  // Helper arrays derived from records state
  const estadosUnicos = [...new Set(records.map(r => r.estado))].sort();

  const municipiosFiltrados = estadoSel
    ? [...new Set(records
        .filter(r => r.estado === estadoSel)
        .map(r => r.municipio))]
        .filter(m => m !== 'Sin Municipio' && m !== 'N/A')
        .sort()
    : [];

  const parroquiasFiltradas = (estadoSel && municipioSel)
    ? records
        .filter(r => r.estado === estadoSel && r.municipio === municipioSel && r.parroquia !== 'Sin Parroquia')
        .map(r => ({ id: r.id, valor: r.parroquia }))
        .sort((a, b) => a.valor.localeCompare(b.valor))
    : [];

  const seleccionarEstado = (estado: string) => {
    setEstadoSel(estado);
    setMunicipioSel(null);
    setTabMovil('municipios');
  };

  const seleccionarMunicipio = (muni: string) => {
    setMunicipioSel(muni);
    setTabMovil('parroquias');
  };

  const nuevoEstado = () => {
    if (!hasCrear) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para añadir estados.', 'error');
      return;
    }
    if (!Swal) return;

    Swal.fire({
      title: 'Añadir Estado',
      html: `<input type="text" id="swal-estado" class="swal2-input input-moderno m-0 w-100" placeholder="Nombre del Estado (ej: Monagas)">`,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      confirmButtonColor: '#0f172a',
      preConfirm: () => {
        const valor = (document.getElementById('swal-estado') as HTMLInputElement).value.trim();
        if (!valor) {
          Swal.showValidationMessage('El nombre del Estado es obligatorio');
          return false;
        }
        return valor;
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        const existe = records.find(r => r.estado.toLowerCase() === result.value.toLowerCase());
        if (existe) {
          Swal.fire('Atención', 'Este estado ya existe en el sistema.', 'warning');
          return;
        }

        setLoading(true);
        try {
          const payload = {
            estado: result.value,
            municipio: 'Sin Municipio',
            parroquia: 'Sin Parroquia'
          };
          const { error } = await supabase.from('div_pol_vzla').insert([payload]);
          if (error) throw error;

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Estado creado exitosamente', showConfirmButton: false, timer: 1500 });
          auditar('División Territorial', 'Nuevo Estado', `Se añadió el Estado "${result.value}".`);
          await cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla en base de datos al guardar.', 'error');
        }
        setLoading(false);
      }
    });
  };

  const nuevoMunicipio = () => {
    if (!estadoSel) return;
    if (!hasCrear) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para añadir municipios.', 'error');
      return;
    }
    if (!Swal) return;

    Swal.fire({
      title: `Añadir Municipio a ${estadoSel}`,
      html: `<input type="text" id="swal-muni" class="swal2-input input-moderno m-0 w-100" placeholder="Nombre del Municipio (ej: Maturín)">`,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      confirmButtonColor: '#1e293b',
      preConfirm: () => {
        const valor = (document.getElementById('swal-muni') as HTMLInputElement).value.trim();
        if (!valor) {
          Swal.showValidationMessage('El nombre del Municipio es obligatorio');
          return false;
        }
        return valor;
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        const existe = records.find(r => r.estado === estadoSel && r.municipio.toLowerCase() === result.value.toLowerCase());
        if (existe) {
          Swal.fire('Atención', 'Este municipio ya existe en el estado seleccionado.', 'warning');
          return;
        }

        setLoading(true);
        try {
          const payload = {
            estado: estadoSel,
            municipio: result.value,
            parroquia: 'Sin Parroquia'
          };
          const { error } = await supabase.from('div_pol_vzla').insert([payload]);
          if (error) throw error;

          // Borrar comodines 'Sin Municipio' para este estado
          await supabase.from('div_pol_vzla')
            .delete()
            .eq('estado', estadoSel)
            .eq('municipio', 'Sin Municipio');

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Municipio creado', showConfirmButton: false, timer: 1500 });
          auditar('División Territorial', 'Nuevo Municipio', `Se añadió el Municipio "${result.value}" al Estado ${estadoSel}.`);
          await cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla en base de datos al guardar.', 'error');
        }
        setLoading(false);
      }
    });
  };

  const nuevaParroquia = () => {
    if (!estadoSel || !municipioSel) return;
    if (!hasCrear) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para añadir parroquias.', 'error');
      return;
    }
    if (!Swal) return;

    Swal.fire({
      title: `Añadir Parroquia`,
      html: `
        <div class="text-start">
          <p class="small text-muted mb-2">Se creará en: <strong>${estadoSel} &gt; ${municipioSel}</strong></p>
          <input type="text" id="swal-parr" class="swal2-input input-moderno m-0 w-100" placeholder="Nombre de la Parroquia (ej: Las Cocuizas)">
        </div>`,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      confirmButtonColor: '#334155',
      preConfirm: () => {
        const valor = (document.getElementById('swal-parr') as HTMLInputElement).value.trim();
        if (!valor) {
          Swal.showValidationMessage('El nombre de la Parroquia es obligatorio');
          return false;
        }
        return valor;
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        const existe = records.find(r => r.estado === estadoSel && r.municipio === municipioSel && r.parroquia.toLowerCase() === result.value.toLowerCase());
        if (existe) {
          Swal.fire('Atención', 'Esta parroquia ya existe en el municipio seleccionado.', 'warning');
          return;
        }

        setLoading(true);
        try {
          const payload = {
            estado: estadoSel,
            municipio: municipioSel,
            parroquia: result.value
          };
          const { error } = await supabase.from('div_pol_vzla').insert([payload]);
          if (error) throw error;

          // Borrar comodines 'Sin Parroquia' para este estado y municipio
          await supabase.from('div_pol_vzla')
            .delete()
            .eq('estado', estadoSel)
            .eq('municipio', municipioSel)
            .eq('parroquia', 'Sin Parroquia');

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Parroquia creada', showConfirmButton: false, timer: 1500 });
          auditar('División Territorial', 'Nueva Parroquia', `Se añadió la Parroquia "${result.value}" a ${estadoSel} &gt; ${municipioSel}.`);
          await cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla en base de datos al guardar.', 'error');
        }
        setLoading(false);
      }
    });
  };

  const editarEstado = (nombreViejo: string) => {
    if (!hasModificar) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para modificar estados.', 'error');
      return;
    }
    if (!Swal) return;

    Swal.fire({
      title: 'Editar Estado',
      html: `<input type="text" id="swal-edit-estado" class="swal2-input input-moderno m-0 w-100" value="${nombreViejo}" placeholder="Nombre del Estado">`,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      confirmButtonColor: '#0f172a',
      preConfirm: () => {
        const valor = (document.getElementById('swal-edit-estado') as HTMLInputElement).value.trim();
        if (!valor) {
          Swal.showValidationMessage('El nombre del Estado es obligatorio');
          return false;
        }
        return valor;
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        if (result.value.toLowerCase() === nombreViejo.toLowerCase()) {
          return;
        }

        const existe = records.find(r => r.estado.toLowerCase() === result.value.toLowerCase());
        if (existe) {
          Swal.fire('Atención', 'Este estado ya existe en el sistema.', 'warning');
          return;
        }

        setLoading(true);
        try {
          const { error } = await supabase
            .from('div_pol_vzla')
            .update({ estado: result.value })
            .eq('estado', nombreViejo);

          if (error) throw error;

          if (estadoSel === nombreViejo) {
            setEstadoSel(result.value);
          }

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Estado modificado', showConfirmButton: false, timer: 1500 });
          auditar('División Territorial', 'Editar Estado', `Se renombró el Estado "${nombreViejo}" a "${result.value}".`);
          await cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla al renombrar el estado.', 'error');
        }
        setLoading(false);
      }
    });
  };

  const editarMunicipio = (nombreViejo: string) => {
    if (!estadoSel) return;
    if (!hasModificar) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para modificar municipios.', 'error');
      return;
    }
    if (!Swal) return;

    Swal.fire({
      title: 'Editar Municipio',
      html: `<input type="text" id="swal-edit-muni" class="swal2-input input-moderno m-0 w-100" value="${nombreViejo}" placeholder="Nombre del Municipio">`,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      confirmButtonColor: '#1e293b',
      preConfirm: () => {
        const valor = (document.getElementById('swal-edit-muni') as HTMLInputElement).value.trim();
        if (!valor) {
          Swal.showValidationMessage('El nombre del Municipio es obligatorio');
          return false;
        }
        return valor;
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        if (result.value.toLowerCase() === nombreViejo.toLowerCase()) {
          return;
        }

        const existe = records.find(r => r.estado === estadoSel && r.municipio.toLowerCase() === result.value.toLowerCase());
        if (existe) {
          Swal.fire('Atención', 'Este municipio ya existe en este estado.', 'warning');
          return;
        }

        setLoading(true);
        try {
          const { error } = await supabase
            .from('div_pol_vzla')
            .update({ municipio: result.value })
            .eq('estado', estadoSel)
            .eq('municipio', nombreViejo);

          if (error) throw error;

          if (municipioSel === nombreViejo) {
            setMunicipioSel(result.value);
          }

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Municipio modificado', showConfirmButton: false, timer: 1500 });
          auditar('División Territorial', 'Editar Municipio', `Se renombró el Municipio "${nombreViejo}" a "${result.value}" en Estado ${estadoSel}.`);
          await cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla al renombrar el municipio.', 'error');
        }
        setLoading(false);
      }
    });
  };

  const editarParroquia = (id: number, nombreViejo: string) => {
    if (!estadoSel || !municipioSel) return;
    if (!hasModificar) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para modificar parroquias.', 'error');
      return;
    }
    if (!Swal) return;

    Swal.fire({
      title: 'Editar Parroquia',
      html: `<input type="text" id="swal-edit-parr" class="swal2-input input-moderno m-0 w-100" value="${nombreViejo}" placeholder="Nombre de la Parroquia">`,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      confirmButtonColor: '#334155',
      preConfirm: () => {
        const valor = (document.getElementById('swal-edit-parr') as HTMLInputElement).value.trim();
        if (!valor) {
          Swal.showValidationMessage('El nombre de la Parroquia es obligatorio');
          return false;
        }
        return valor;
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        if (result.value.toLowerCase() === nombreViejo.toLowerCase()) {
          return;
        }

        const existe = records.find(r => r.estado === estadoSel && r.municipio === municipioSel && r.parroquia.toLowerCase() === result.value.toLowerCase());
        if (existe) {
          Swal.fire('Atención', 'Esta parroquia ya existe en este municipio.', 'warning');
          return;
        }

        setLoading(true);
        try {
          const { error } = await supabase
            .from('div_pol_vzla')
            .update({ parroquia: result.value })
            .eq('id', id);

          if (error) throw error;

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Parroquia modificada', showConfirmButton: false, timer: 1500 });
          auditar('División Territorial', 'Editar Parroquia', `Se renombró la Parroquia "${nombreViejo}" a "${result.value}" en ${estadoSel} > ${municipioSel}.`);
          await cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla al renombrar la parroquia.', 'error');
        }
        setLoading(false);
      }
    });
  };

  const eliminarEstado = (nombre: string) => {
    if (!hasEliminar) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para eliminar estados.', 'error');
      return;
    }
    if (!Swal) return;

    Swal.fire({
      title: '¿Eliminar Estado?',
      text: `Se borrará el Estado "${nombre}", todos sus municipios y parroquias asociadas de forma permanente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, borrar todo',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase.from('div_pol_vzla').delete().eq('estado', nombre);
          if (error) throw error;

          if (estadoSel === nombre) {
            setEstadoSel(null);
            setMunicipioSel(null);
          }

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Estado eliminado', showConfirmButton: false, timer: 1500 });
          auditar('División Territorial', 'Eliminar Estado', `Se eliminó el Estado "${nombre}" con su respectiva geografía.`);
          await cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla al eliminar el estado.', 'error');
        }
        setLoading(false);
      }
    });
  };

  const eliminarMunicipio = (nombre: string) => {
    if (!estadoSel) return;
    if (!hasEliminar) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para eliminar municipios.', 'error');
      return;
    }
    if (!Swal) return;

    Swal.fire({
      title: '¿Eliminar Municipio?',
      text: `Se borrará "${nombre}" y todas las parroquias contenidas en él de forma permanente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar todo',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase
            .from('div_pol_vzla')
            .delete()
            .eq('estado', estadoSel)
            .eq('municipio', nombre);

          if (error) throw error;

          // Comprobar si quedaban municipios en el estado
          const restantes = records.filter(r => r.estado === estadoSel && r.municipio !== nombre);
          if (restantes.length === 0) {
            // Insertar comodín
            await supabase.from('div_pol_vzla').insert([{
              estado: estadoSel,
              municipio: 'Sin Municipio',
              parroquia: 'Sin Parroquia'
            }]);
          }

          if (municipioSel === nombre) {
            setMunicipioSel(null);
          }

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Municipio eliminado', showConfirmButton: false, timer: 1500 });
          auditar('División Territorial', 'Eliminar Municipio', `Se eliminó el Municipio "${nombre}" y sus parroquias en el Estado ${estadoSel}.`);
          await cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla al eliminar el municipio.', 'error');
        }
        setLoading(false);
      }
    });
  };

  const eliminarParroquia = (id: number, nombre: string) => {
    if (!estadoSel || !municipioSel) return;
    if (!hasEliminar) {
      if (Swal) Swal.fire('Acceso Denegado', 'No tienes permiso para eliminar parroquias.', 'error');
      return;
    }
    if (!Swal) return;

    Swal.fire({
      title: '¿Eliminar Parroquia?',
      text: `Se borrará "${nombre}" permanentemente del sistema.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase.from('div_pol_vzla').delete().eq('id', id);
          if (error) throw error;

          // Comprobar si quedaban parroquias
          const restantes = records.filter(r => r.estado === estadoSel && r.municipio === municipioSel && r.id !== id);
          if (restantes.length === 0) {
            await supabase.from('div_pol_vzla').insert([{
              estado: estadoSel,
              municipio: municipioSel,
              parroquia: 'Sin Parroquia'
            }]);
          }

          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Parroquia eliminada', showConfirmButton: false, timer: 1500 });
          auditar('División Territorial', 'Eliminar Parroquia', `Se eliminó la Parroquia "${nombre}" de ${estadoSel} &gt; ${municipioSel}.`);
          await cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla al eliminar la parroquia.', 'error');
        }
        setLoading(false);
      }
    });
  };

  if (permLoading || (loading && records.length === 0)) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5 h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (isModuleRestricted) {
    return (
      <div className="col-12 text-center py-5 mt-4">
        <div className="bg-light d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm border" style={{ width: '100px', height: '100px' }}>
          <i className="bi bi-shield-lock-fill text-muted" style={{ fontSize: '3.5rem' }}></i>
        </div>
        <h4 className="text-dark fw-bold mb-2">Área Restringida</h4>
        <p className="text-muted mb-0">No tienes permisos asignados para acceder a la división territorial.</p>
      </div>
    );
  }

  return (
    <div className="modulo-animado">

      {/* MIGAS DE PAN CHAMILO */}
      <ChamiloBreadcrumb
        category="Dirección y Sistema"
        currentModule="División Territorial"
      />

      {/* CUADRO DE AYUDA METODOLÓGICA CHAMILO */}
      <ChamiloHelpCallout
        id="ayuda_division_territorial"
        title="Guía de la División Político-Territorial"
        content="Administre el catálogo geográfico nacional (estados, municipios y parroquias). Estas ubicaciones se sincronizan en cascada con los formularios de registro estudiantil, expedientes docentes y zonificación escolar."
        icon="bi-geo-alt-fill"
      />

      {/* ── CABECERA INSTITUCIONAL TECNOLÓGICA CON RESUMEN GEOGRÁFICO ── */}
      <div 
        className="tech-card overflow-hidden mb-4 shadow-sm animate__animated animate__fadeInDown" 
        style={{ 
          border: '2px solid #fed7aa',
          borderTop: '6px solid #FF8D00',
          background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 45%, #ffedd5 100%)',
          borderRadius: '26px'
        }}
      >
        <div className="p-4 p-md-5">
          <div className="row align-items-center g-4">
            
            {/* Logo de la Escuela en Contenedor Interactivo */}
            <div className="col-12 col-md-auto text-center text-md-start">
              <div 
                className="tech-icon-wrapper bg-white shadow-sm d-inline-flex align-items-center justify-content-center p-2"
                style={{ 
                  width: '110px', 
                  height: '110px',
                  borderRadius: '24px',
                  border: '2.5px solid #fed7aa',
                  boxShadow: '0 10px 24px rgba(249, 115, 22, 0.15)'
                }}
              >
                <img 
                  src={`/assets/img/logo_${localStorage.getItem('sigae_escuela_codigo') || 'sb'}.png`} 
                  alt="Escudo Institucional" 
                  className="img-fluid"
                  style={{ maxHeight: '92px', maxWidth: '92px', objectFit: 'contain' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                />
              </div>
            </div>

            {/* Título y Métricas Clave */}
            <div className="col-12 col-md text-center text-md-start">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-2 flex-wrap">
                {/* Live Campus Beacon */}
                <div 
                  className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill bg-white border shadow-xs"
                  style={{ borderColor: '#fed7aa' }}
                >
                  <span 
                    className="status-beacon-live" 
                    style={{ color: '#ea580c' }}
                  ></span>
                  <span 
                    className="extra-small fw-bold text-uppercase" 
                    style={{ fontSize: '0.72rem', color: '#c2410c', letterSpacing: '0.5px' }}
                  >
                    Campus Conectado &bull; SIGAE v1.1
                  </span>
                </div>

                <span 
                  className="badge text-white fw-bold px-3 py-1.5 rounded-pill small shadow-xs d-inline-flex align-items-center gap-1.5"
                  style={{ backgroundColor: '#FF8D00' }}
                >
                  <IconoDivisionTerritorial size={18} color="#ffffff" />
                  <span>Geografía & Territorio</span>
                </span>

                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs d-inline-flex align-items-center gap-1.5">
                  <IconoEstadoVenezuela size={17} color="#FF8D00" />
                  <span><b>{estadosUnicos.length}</b> Estados</span>
                </span>
                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs d-inline-flex align-items-center gap-1.5">
                  <IconoMunicipioVenezuela size={17} color="#00C3FF" />
                  <span><b>{[...new Set(records.map(r => `${r.estado}_${r.municipio}`))].length}</b> Municipios</span>
                </span>
                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs d-inline-flex align-items-center gap-1.5">
                  <IconoParroquiaVenezuela size={17} color="#10b981" />
                  <span><b>{records.filter(r => r.parroquia !== 'Sin Parroquia').length}</b> Parroquias</span>
                </span>
              </div>

              <h1 className="fw-bolder mb-1 text-dark" style={{ fontSize: 'calc(1.5rem + 0.75vw)', letterSpacing: '-0.6px' }}>
                División Territorial
              </h1>

              <p className="mb-0 text-muted small">
                Catálogo geopolítico de Estados, Municipios y Parroquias para la zonificación de alumnos, docentes y expedientes.
              </p>

              {/* Cinta de Telemetría Escolar Interactiva */}
              <div className="d-flex align-items-center gap-2 mt-3 flex-wrap">
                <div className="tech-pill-badge shadow-xs cursor-pointer" title="Cobertura Geográfica">
                  <i className="bi bi-geo-alt-fill text-danger"></i>
                  <span className="text-secondary">Nivel Nacional</span>
                </div>
                <div className="tech-pill-badge shadow-xs cursor-pointer" title="Registros Geopolíticos Totales">
                  <i className="bi bi-layers-fill text-primary"></i>
                  <span className="font-monospace fw-bold text-dark">{records.length} Entidades</span>
                </div>
                <div className="tech-pill-badge shadow-xs cursor-pointer" title="Estado del Catálogo">
                  <i className="bi bi-shield-fill-check text-warning"></i>
                  <span className="text-secondary">Sincronizado</span>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="col-12 col-md-auto text-md-end text-center">
              <button
                type="button"
                onClick={() => navigate('/categoria/Direcci%C3%B3n%20y%20Sistema')}
                className="btn btn-white bg-white text-dark rounded-pill px-4 py-2 fw-bold shadow-xs hover-efecto border d-inline-flex align-items-center justify-content-center gap-2 w-100 w-md-auto"
                style={{ fontSize: '0.85rem', borderColor: '#fed7aa' }}
              >
                <i className="bi bi-arrow-left" style={{ color: '#ea580c' }}></i>
                <span>Volver a Dirección</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Selector de Nivel Territorial para Móviles (Swiper Píldora) */}
      <div className="d-flex d-md-none nav nav-pills gap-1 mb-3 p-1.5 bg-light rounded-pill border shadow-xs">
        <button 
          className={`nav-link rounded-pill py-1.5 px-2.5 extra-small fw-bold flex-fill transition-all d-flex align-items-center justify-content-center gap-1.5 ${tabMovil === 'estados' ? 'active text-white shadow-xs' : 'text-muted'}`}
          style={{ backgroundColor: tabMovil === 'estados' ? '#FF8D00' : undefined }}
          onClick={() => setTabMovil('estados')}
        >
          <IconoEstadoVenezuela size={16} color={tabMovil === 'estados' ? '#ffffff' : '#FF8D00'} />
          <span>Estados ({estadosUnicos.length})</span>
        </button>
        <button 
          className={`nav-link rounded-pill py-1.5 px-2.5 extra-small fw-bold flex-fill transition-all d-flex align-items-center justify-content-center gap-1.5 ${tabMovil === 'municipios' ? 'active text-white shadow-xs' : 'text-muted'}`}
          style={{ backgroundColor: tabMovil === 'municipios' ? '#00C3FF' : undefined }}
          onClick={() => setTabMovil('municipios')}
        >
          <IconoMunicipioVenezuela size={16} color={tabMovil === 'municipios' ? '#ffffff' : '#00C3FF'} />
          <span>Municipios ({municipiosFiltrados.length})</span>
        </button>
        <button 
          className={`nav-link rounded-pill py-1.5 px-2.5 extra-small fw-bold flex-fill transition-all d-flex align-items-center justify-content-center gap-1.5 ${tabMovil === 'parroquias' ? 'active text-white shadow-xs' : 'text-muted'}`}
          style={{ backgroundColor: tabMovil === 'parroquias' ? '#10b981' : undefined }}
          onClick={() => setTabMovil('parroquias')}
        >
          <IconoParroquiaVenezuela size={16} color={tabMovil === 'parroquias' ? '#ffffff' : '#10b981'} />
          <span>Parroquias ({parroquiasFiltradas.length})</span>
        </button>
      </div>

      <div className="row g-3 g-md-4 mb-5 animate__animated animate__fadeInUp">
        {/* Column 1: Estados */}
        <div className={`col-12 col-md-4 ${tabMovil === 'estados' ? 'd-block' : 'd-none d-md-block'}`}>
          <div className="card border-0 shadow-sm rounded-4 h-100 bg-white overflow-hidden" style={{ borderTop: '4px solid #FF8D00' }}>
            <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                <IconoEstadoVenezuela size={24} color="#FF8D00" />
                <span>Estados ({estadosUnicos.length})</span>
              </h6>
              {hasCrear && (
                <button 
                  className="btn btn-xs text-white rounded-pill px-2.5 py-1 fw-bold shadow-xs hover-efecto d-flex align-items-center gap-1" 
                  style={{ background: '#FF8D00' }} 
                  onClick={nuevoEstado}
                >
                  <i className="bi bi-plus-lg"></i>
                  <span>Nuevo</span>
                </button>
              )}
            </div>
            <div className="card-body p-0" style={{ maxHeight: '520px', overflowY: 'auto' }}>
              {estadosUnicos.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  <IconoEstadoVenezuela size={38} color="#cbd5e1" />
                  <p className="mb-0 small fw-bold mt-2">No hay estados</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {estadosUnicos.map(est => {
                    const isSelected = (estadoSel === est);
                    const activeClass = isSelected ? 'active text-white' : 'text-dark bg-white';

                    return (
                      <div 
                        key={est} 
                        className={`list-group-item p-3 border-0 border-bottom d-flex justify-content-between align-items-center gap-2 hover-efecto cursor-pointer ${activeClass}`} 
                        onClick={() => seleccionarEstado(est)}
                        style={{ 
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#FF8D00' : undefined,
                          borderColor: isSelected ? '#FF8D00' : undefined
                        }}
                      >
                        <div className="fw-bold d-flex align-items-center gap-2 text-break" style={{ minWidth: 0 }}>
                          <IconoEstadoVenezuela size={20} color={isSelected ? '#ffffff' : '#FF8D00'} />
                          <span>{est}</span>
                        </div>
                        <div className="d-flex align-items-center gap-1 flex-shrink-0">
                          {hasModificar && (
                            <button 
                              className={`btn btn-xs ${isSelected ? 'btn-white bg-white text-dark' : 'btn-light text-primary'} rounded-circle shadow-xs d-flex align-items-center justify-content-center`} 
                              style={{ width: '34px', height: '34px', minWidth: '34px' }}
                              onClick={(e) => { e.stopPropagation(); editarEstado(est); }} 
                              title="Editar Estado"
                            >
                              <i className="bi bi-pencil-fill"></i>
                            </button>
                          )}
                          {hasEliminar && (
                            <button 
                              className={`btn btn-xs ${isSelected ? 'btn-white bg-white text-danger' : 'btn-light text-danger'} rounded-circle shadow-xs d-flex align-items-center justify-content-center`} 
                              style={{ width: '34px', height: '34px', minWidth: '34px' }}
                              onClick={(e) => { e.stopPropagation(); eliminarEstado(est); }} 
                              title="Eliminar Estado"
                            >
                              <i className="bi bi-trash3-fill"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Municipios */}
        <div className={`col-12 col-md-4 ${tabMovil === 'municipios' ? 'd-block' : 'd-none d-md-block'}`}>
          <div className="card border-0 shadow-sm rounded-4 h-100 bg-white overflow-hidden" style={{ borderTop: '4px solid #00C3FF' }}>
            <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                <IconoMunicipioVenezuela size={24} color="#00C3FF" />
                <span>Municipios ({municipiosFiltrados.length})</span>
              </h6>
              {hasCrear && (
                <button 
                  className={`btn btn-xs text-white rounded-pill px-2.5 py-1 fw-bold shadow-xs hover-efecto d-flex align-items-center gap-1 ${!estadoSel ? 'disabled' : ''}`} 
                  style={{ background: '#00C3FF' }} 
                  onClick={nuevoMunicipio}
                  disabled={!estadoSel}
                >
                  <i className="bi bi-plus-lg"></i>
                  <span>Nuevo</span>
                </button>
              )}
            </div>
            <div className="card-body p-0" style={{ maxHeight: '520px', overflowY: 'auto' }}>
              {!estadoSel ? (
                <div className="p-4 text-center text-muted">
                  <IconoMunicipioVenezuela size={38} color="#cbd5e1" />
                  <p className="mb-0 small fw-bold mt-2">Seleccione un Estado para ver sus municipios</p>
                </div>
              ) : municipiosFiltrados.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  <IconoMunicipioVenezuela size={38} color="#cbd5e1" />
                  <p className="mb-0 small fw-bold mt-2">No hay municipios agregados</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {municipiosFiltrados.map(muni => {
                    const isSelected = (municipioSel === muni);
                    const activeClass = isSelected ? 'active text-white' : 'text-dark bg-white';

                    return (
                      <div 
                        key={muni} 
                        className={`list-group-item p-3 border-0 border-bottom d-flex justify-content-between align-items-center gap-2 hover-efecto cursor-pointer ${activeClass}`} 
                        onClick={() => seleccionarMunicipio(muni)}
                        style={{ 
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#00C3FF' : undefined,
                          borderColor: isSelected ? '#00C3FF' : undefined
                        }}
                      >
                        <div className="fw-bold d-flex align-items-center gap-2 text-break" style={{ minWidth: 0 }}>
                          <IconoMunicipioVenezuela size={20} color={isSelected ? '#ffffff' : '#00C3FF'} />
                          <span>{muni}</span>
                        </div>
                        <div className="d-flex align-items-center gap-1 flex-shrink-0">
                          {hasModificar && (
                            <button 
                              className={`btn btn-xs ${isSelected ? 'btn-white bg-white text-dark' : 'btn-light text-primary'} rounded-circle shadow-xs d-flex align-items-center justify-content-center`} 
                              style={{ width: '34px', height: '34px', minWidth: '34px' }}
                              onClick={(e) => { e.stopPropagation(); editarMunicipio(muni); }} 
                              title="Editar Municipio"
                            >
                              <i className="bi bi-pencil-fill"></i>
                            </button>
                          )}
                          {hasEliminar && (
                            <button 
                              className={`btn btn-xs ${isSelected ? 'btn-white bg-white text-danger' : 'btn-light text-danger'} rounded-circle shadow-xs d-flex align-items-center justify-content-center`} 
                              style={{ width: '34px', height: '34px', minWidth: '34px' }}
                              onClick={(e) => { e.stopPropagation(); eliminarMunicipio(muni); }} 
                              title="Eliminar Municipio"
                            >
                              <i className="bi bi-trash3-fill"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column 3: Parroquias */}
        <div className={`col-12 col-md-4 ${tabMovil === 'parroquias' ? 'd-block' : 'd-none d-md-block'}`}>
          <div className="card border-0 shadow-sm rounded-4 h-100 bg-white overflow-hidden" style={{ borderTop: '4px solid #10b981' }}>
            <div className="card-header bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold text-dark d-flex align-items-center gap-2">
                <IconoParroquiaVenezuela size={24} color="#10b981" />
                <span>Parroquias ({parroquiasFiltradas.length})</span>
              </h6>
              {hasCrear && (
                <button 
                  className={`btn btn-xs text-white rounded-pill px-2.5 py-1 fw-bold shadow-xs hover-efecto d-flex align-items-center gap-1 ${!municipioSel ? 'disabled' : ''}`} 
                  style={{ background: '#10b981' }} 
                  onClick={nuevaParroquia}
                  disabled={!municipioSel}
                >
                  <i className="bi bi-plus-lg"></i>
                  <span>Nueva</span>
                </button>
              )}
            </div>
            <div className="card-body p-0" style={{ maxHeight: '520px', overflowY: 'auto' }}>
              {!municipioSel ? (
                <div className="p-4 text-center text-muted">
                  <IconoParroquiaVenezuela size={38} color="#cbd5e1" />
                  <p className="mb-0 small fw-bold mt-2">Seleccione un Municipio para ver sus parroquias</p>
                </div>
              ) : parroquiasFiltradas.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  <IconoParroquiaVenezuela size={38} color="#cbd5e1" />
                  <p className="mb-0 small fw-bold mt-2">No hay parroquias agregadas</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {parroquiasFiltradas.map(parr => (
                    <div key={parr.id} className="list-group-item p-3 border-0 border-bottom d-flex justify-content-between align-items-center gap-2 hover-efecto text-dark bg-white">
                      <div className="fw-bold d-flex align-items-center gap-2 text-break" style={{ minWidth: 0 }}>
                        <IconoParroquiaVenezuela size={20} color="#10b981" />
                        <span>{parr.valor}</span>
                      </div>
                      <div className="d-flex align-items-center gap-1 flex-shrink-0">
                        {hasModificar && (
                          <button 
                            className="btn btn-xs btn-light text-primary rounded-circle shadow-xs d-flex align-items-center justify-content-center" 
                            style={{ width: '34px', height: '34px', minWidth: '34px' }}
                            onClick={() => editarParroquia(parr.id, parr.valor)} 
                            title="Editar Parroquia"
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                        )}
                        {hasEliminar && (
                          <button 
                            className="btn btn-xs btn-light text-danger rounded-circle shadow-xs d-flex align-items-center justify-content-center" 
                            style={{ width: '34px', height: '34px', minWidth: '34px' }}
                            onClick={() => eliminarParroquia(parr.id, parr.valor)} 
                            title="Eliminar Parroquia"
                          >
                            <i className="bi bi-trash3-fill"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
