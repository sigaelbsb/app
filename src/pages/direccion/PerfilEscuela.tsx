import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermisos } from '../../hooks/usePermisos';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { ChamiloBreadcrumb, ChamiloHelpCallout, IconoPerfilEscuela } from '../../components/chamilo';

interface EscuelaData {
  id_escuela: string;
  nombre_institucion: string;
  codigo_dea: string;
  rif: string;
  direccion: string;
  mision: string;
  vision: string;
  objetivo: string;
  peic: string;
  logo_url?: string;
  nivel_educativo?: string;
}

const ESCUELAS_DEFAULT: EscuelaData[] = [
  {
    id_escuela: 'sb',
    nombre_institucion: 'UE Santa Bárbara',
    codigo_dea: 'OD05561615',
    rif: 'G-20000041-4',
    direccion: 'Campo Residencial El Tejero, Municipio Ezequiel Zamora, Edo. Monagas',
    mision: 'Formar integralmente a los estudiantes mediante una educación humanista, científica y tecnológica con alto compromiso ético y ciudadano.',
    vision: 'Consolidarse como una institución educativa modelo en excelencia pedagógica, innovación y liderazgo comunitario.',
    objetivo: 'Fomentar la excelencia académica, el pensamiento crítico, la disciplina y los valores de solidaridad y pertenencia.',
    peic: 'Fortalecimiento de la calidad educativa a través de la integración escuela, familia y comunidad.',
    nivel_educativo: 'Educación Inicial y Primaria'
  },
  {
    id_escuela: 'lb',
    nombre_institucion: 'UE Libertador Bolívar',
    codigo_dea: 'OD05561614',
    rif: 'G-20000041-4',
    direccion: 'Campo Residencial Miraflores, Temblador, Edo. Monagas',
    mision: 'Formar integralmente a los estudiantes mediante una educación humanista, científica y tecnológica con alto compromiso ético y ciudadano.',
    vision: 'Consolidarse como una institución educativa modelo en excelencia pedagógica, innovación y liderazgo comunitario.',
    objetivo: 'Fomentar la excelencia académica, el pensamiento crítico, la disciplina y los valores de solidaridad y pertenencia.',
    peic: 'Fortalecimiento de la calidad educativa a través de la integración escuela, familia y comunidad.',
    nivel_educativo: 'Educación Media General'
  }
];

export const PerfilEscuela = () => {
  const navigate = useNavigate();
  const Swal = (window as any).Swal;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { tienePermiso, loading: permLoading } = usePermisos();

  const [loadingData, setLoadingData] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Lista dinámica de escuelas
  const [listaEscuelas, setListaEscuelas] = useState<EscuelaData[]>(ESCUELAS_DEFAULT);

  // Escuela activa
  const defaultEscuela = localStorage.getItem('sigae_escuela_codigo') || 'sb';
  const [escuelaActivaId, setEscuelaActivaId] = useState<string>(defaultEscuela);

  // Permisos generales
  const canEditAny = tienePermiso('Perfil de la Escuela', 'modificar') || tienePermiso('Perfil de la Escuela', 'crear') || tienePermiso('Perfil de la Escuela', 'ver');
  const noAccess = !permLoading && !canEditAny;

  // Cargar lista y datos de escuelas desde Supabase
  const cargarPerfiles = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('perfil_escuela')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        const loaded: EscuelaData[] = data.map((esc: any) => {
          const key = esc.id_escuela?.toLowerCase();
          const localSavedLogo = localStorage.getItem(`sigae_logo_${key}`);
          return {
            id_escuela: key,
            nombre_institucion: esc.nombre_institucion || '',
            codigo_dea: esc.codigo_dea || '',
            rif: esc.rif || '',
            direccion: esc.direccion || '',
            mision: esc.mision || '',
            vision: esc.vision || '',
            objetivo: esc.objetivo || '',
            peic: esc.peic || '',
            logo_url: esc.logo_url || localSavedLogo || '',
            nivel_educativo: esc.nivel_educativo || (key === 'sb' ? 'Educación Inicial y Primaria' : 'Educación Media General')
          };
        });

        setListaEscuelas(loaded);
        localStorage.setItem('sigae_cached_perfiles', JSON.stringify(loaded));

        // Si la escuela activa no existe en los datos cargados, seleccionar la primera
        if (!loaded.find(e => e.id_escuela === escuelaActivaId)) {
          setEscuelaActivaId(loaded[0].id_escuela);
        }
      } else {
        setListaEscuelas(ESCUELAS_DEFAULT);
      }
    } catch (e: any) {
      console.error("Error cargando los perfiles:", e);
      // Fallback a localStorage
      const cached = localStorage.getItem('sigae_cached_perfiles');
      if (cached) {
        try {
          setListaEscuelas(JSON.parse(cached));
        } catch (err) {}
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!permLoading && !noAccess) {
      cargarPerfiles();
    }
  }, [permLoading, noAccess]);

  // Obtener objeto de escuela activa actual
  const escuelaActual = listaEscuelas.find(e => e.id_escuela === escuelaActivaId) || listaEscuelas[0] || ESCUELAS_DEFAULT[0];

  // Cambiar campos en el formulario
  const handleChange = (field: keyof EscuelaData, val: string) => {
    setListaEscuelas(prev =>
      prev.map(item =>
        item.id_escuela === escuelaActivaId ? { ...item, [field]: val } : item
      )
    );
  };

  // ── SUBIDA Y COMPRESIÓN DE LOGO INSTITUCIONAL ──
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de tipo de archivo
    if (!file.type.startsWith('image/')) {
      if (Swal) Swal.fire('Formato Inválido', 'Por favor selecciona un archivo de imagen (PNG, JPG, SVG o WEBP).', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar y comprimir usando Canvas para rendimiento óptimo
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/png', 0.9);

          // Actualizar estado y caché
          handleChange('logo_url', compressedDataUrl);
          localStorage.setItem(`sigae_logo_${escuelaActivaId}`, compressedDataUrl);

          if (Swal) {
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Nuevo logo cargado correctamente. Recuerda guardar los cambios.',
              showConfirmButton: false,
              timer: 3000
            });
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRestaurarLogoOriginal = () => {
    handleChange('logo_url', '');
    localStorage.removeItem(`sigae_logo_${escuelaActivaId}`);
    if (Swal) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Se restauró el escudo oficial predeterminado.',
        showConfirmButton: false,
        timer: 2500
      });
    }
  };

  // ── AGREGAR NUEVA ESCUELA ──
  const handleAgregarEscuela = () => {
    if (!Swal) return;

    Swal.fire({
      title: '<div class="d-flex align-items-center justify-content-center gap-2 text-primary"><i class="bi bi-building-add fs-3"></i><span class="fw-bold">Nueva Sede Institucional</span></div>',
      html: `
        <div class="text-start px-1">
          <p class="text-muted small mb-3">Ingresa los datos esenciales para dar de alta un nuevo plantel o complejo en el sistema.</p>
          
          <div class="mb-2">
            <label class="form-label fw-bold small text-dark mb-1">Identificador / Código de Escuela <span class="text-danger">*</span></label>
            <input id="swal-escuela-id" class="form-control form-control-sm text-lowercase" placeholder="Ej: pe, ce, sb2, simoncito" maxlength="15" />
            <div class="extra-small text-muted mt-0.5">Identificador corto único sin espacios (ej. 'pe' para Preescolar El Tejero).</div>
          </div>

          <div class="mb-2">
            <label class="form-label fw-bold small text-dark mb-1">Nombre Oficial de la Escuela <span class="text-danger">*</span></label>
            <input id="swal-escuela-nombre" class="form-control form-control-sm" placeholder="Ej: C.E.I. Simón Bolívar" />
          </div>

          <div class="mb-2">
            <label class="form-label fw-bold small text-dark mb-1">Nivel Educativo</label>
            <select id="swal-escuela-nivel" class="form-select form-select-sm">
              <option value="Educación Inicial y Maternal">Educación Inicial y Maternal</option>
              <option value="Educación Inicial y Primaria">Educación Inicial y Primaria</option>
              <option value="Educación Primaria">Educación Primaria</option>
              <option value="Educación Media General">Educación Media General</option>
              <option value="Educación Media Técnica">Educación Media Técnica</option>
              <option value="Educación Especial">Educación Especial</option>
            </select>
          </div>

          <div class="row g-2 mb-2">
            <div class="col-6">
              <label class="form-label fw-bold small text-dark mb-1">Código DEA</label>
              <input id="swal-escuela-dea" class="form-control form-control-sm text-uppercase" placeholder="Ej: OD05561618" />
            </div>
            <div class="col-6">
              <label class="form-label fw-bold small text-dark mb-1">RIF</label>
              <input id="swal-escuela-rif" class="form-control form-control-sm text-uppercase" placeholder="Ej: G-20000041-4" />
            </div>
          </div>

          <div class="mb-1">
            <label class="form-label fw-bold small text-dark mb-1">Dirección / Ubicación</label>
            <input id="swal-escuela-dir" class="form-control form-control-sm" placeholder="Ej: Campo Residencial El Tejero" />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-plus-circle-fill me-1"></i> Crear Sede',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0066FF',
      cancelButtonColor: '#64748b',
      preConfirm: () => {
        const idInput = (document.getElementById('swal-escuela-id') as HTMLInputElement)?.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        const nombreInput = (document.getElementById('swal-escuela-nombre') as HTMLInputElement)?.value.trim();
        const nivelInput = (document.getElementById('swal-escuela-nivel') as HTMLSelectElement)?.value;
        const deaInput = (document.getElementById('swal-escuela-dea') as HTMLInputElement)?.value.trim().toUpperCase();
        const rifInput = (document.getElementById('swal-escuela-rif') as HTMLInputElement)?.value.trim().toUpperCase();
        const dirInput = (document.getElementById('swal-escuela-dir') as HTMLInputElement)?.value.trim();

        if (!idInput) {
          Swal.showValidationMessage('El identificador de la escuela es obligatorio.');
          return false;
        }

        if (listaEscuelas.some(e => e.id_escuela === idInput)) {
          Swal.showValidationMessage(`Ya existe una escuela con el código '${idInput}'.`);
          return false;
        }

        if (!nombreInput) {
          Swal.showValidationMessage('El nombre oficial de la institución es obligatorio.');
          return false;
        }

        return {
          id_escuela: idInput,
          nombre_institucion: nombreInput,
          nivel_educativo: nivelInput,
          codigo_dea: deaInput || 'Por Asignar',
          rif: rifInput || 'G-20000041-4',
          direccion: dirInput || 'Sin dirección registrada',
          mision: 'Formar integralmente a los estudiantes mediante una educación humanista, científica y tecnológica.',
          vision: 'Consolidarse como una institución educativa modelo en excelencia pedagógica y liderazgo comunitario.',
          objetivo: 'Fomentar la excelencia académica, disciplina y valores ciudadanos.',
          peic: 'Fortalecimiento de la calidad educativa a través de la integración escuela, familia y comunidad.',
          logo_url: ''
        };
      }
    }).then(async (result: any) => {
      if (result.isConfirmed && result.value) {
        const nuevaEsc: EscuelaData = result.value;
        setLoadingData(true);
        try {
          // Guardar en Supabase
          const { error } = await supabase
            .from('perfil_escuela')
            .upsert([nuevaEsc]);

          if (error) throw error;

          const updated = [...listaEscuelas, nuevaEsc];
          setListaEscuelas(updated);
          setEscuelaActivaId(nuevaEsc.id_escuela);
          localStorage.setItem('sigae_cached_perfiles', JSON.stringify(updated));

          auditar('Perfil de la Escuela', 'Nueva Sede Creada', `Se creó la sede: ${nuevaEsc.nombre_institucion} (${nuevaEsc.id_escuela})`);

          Swal.fire({
            icon: 'success',
            title: '¡Sede Creada Exitosamente!',
            text: `La institución ${nuevaEsc.nombre_institucion} ha sido incorporada al sistema.`,
            confirmButtonColor: '#0066FF'
          });

          // Notificar actualización al resto de la app
          window.dispatchEvent(new Event('escuelas-actualizadas'));
        } catch (err: any) {
          console.error(err);
          Swal.fire('Error al Crear Sede', err.message || 'No se pudo registrar la nueva escuela en la base de datos.', 'error');
        } finally {
          setLoadingData(false);
        }
      }
    });
  };

  // ── ELIMINAR ESCUELA ACTIVA ──
  const handleEliminarEscuela = () => {
    if (!Swal) return;

    if (listaEscuelas.length <= 1) {
      Swal.fire('Acción no permitida', 'Debe existir al menos una institución registrada en el sistema.', 'warning');
      return;
    }

    Swal.fire({
      title: `<div class="text-danger d-flex align-items-center justify-content-center gap-2"><i class="bi bi-exclamation-triangle-fill fs-3"></i><span>¿Eliminar Sede Escolar?</span></div>`,
      html: `
        <div class="text-start">
          <p class="text-muted small">Estás a punto de eliminar la institución: <strong>${escuelaActual.nombre_institucion}</strong> (<code>${escuelaActual.id_escuela}</code>).</p>
          <div class="alert alert-danger py-2 small mb-0 border-0 rounded-3">
            <i class="bi bi-shield-slash me-1"></i> Esta acción retirará el perfil institucional del selector general.
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-trash3-fill me-1"></i> Sí, Eliminar Sede',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoadingData(true);
        try {
          const { error } = await supabase
            .from('perfil_escuela')
            .delete()
            .eq('id_escuela', escuelaActivaId);

          if (error) throw error;

          const updated = listaEscuelas.filter(e => e.id_escuela !== escuelaActivaId);
          setListaEscuelas(updated);
          const nextEsc = updated[0]?.id_escuela || 'sb';
          setEscuelaActivaId(nextEsc);
          localStorage.setItem('sigae_cached_perfiles', JSON.stringify(updated));
          localStorage.removeItem(`sigae_logo_${escuelaActivaId}`);

          auditar('Perfil de la Escuela', 'Eliminar Sede', `Se eliminó la sede institucional: ${escuelaActual.nombre_institucion} (${escuelaActivaId})`);

          Swal.fire({
            icon: 'success',
            title: 'Sede Eliminada',
            text: `La institución ${escuelaActual.nombre_institucion} ha sido eliminada.`,
            confirmButtonColor: '#0066FF'
          });

          // Notificar actualización al resto de la app
          window.dispatchEvent(new Event('escuelas-actualizadas'));
        } catch (err: any) {
          console.error(err);
          Swal.fire('Error', err.message || 'No se pudo eliminar la escuela.', 'error');
        } finally {
          setLoadingData(false);
        }
      }
    });
  };

  // ── GUARDAR PERFIL EN SUPABASE ──
  const handleGuardar = async () => {
    if (!escuelaActual.nombre_institucion.trim()) {
      if (Swal) {
        Swal.fire({
          title: 'Campo Requerido',
          text: 'El nombre oficial de la institución es obligatorio.',
          icon: 'warning',
          confirmButtonColor: '#0066FF'
        });
      }
      return;
    }

    setGuardando(true);

    try {
      const payload: any = {
        id_escuela: escuelaActual.id_escuela,
        nombre_institucion: escuelaActual.nombre_institucion.trim(),
        codigo_dea: escuelaActual.codigo_dea.trim().toUpperCase(),
        rif: escuelaActual.rif.trim().toUpperCase(),
        direccion: escuelaActual.direccion.trim(),
        mision: escuelaActual.mision.trim(),
        vision: escuelaActual.vision.trim(),
        objetivo: escuelaActual.objetivo.trim(),
        peic: escuelaActual.peic.trim(),
        nivel_educativo: escuelaActual.nivel_educativo || ''
      };

      // Si existe columna logo_url o se guarda en local
      if (escuelaActual.logo_url) {
        payload.logo_url = escuelaActual.logo_url;
      }

      const { error } = await supabase
        .from('perfil_escuela')
        .upsert([payload], { onConflict: 'id_escuela' });

      if (error) {
        // En caso de que falle por la columna logo_url, intentar sin esa columna
        delete payload.logo_url;
        const { error: errRetry } = await supabase
          .from('perfil_escuela')
          .upsert([payload], { onConflict: 'id_escuela' });
        if (errRetry) throw errRetry;
      }

      // Guardar caché local
      localStorage.setItem('sigae_cached_perfiles', JSON.stringify(listaEscuelas));
      if (escuelaActual.logo_url) {
        localStorage.setItem(`sigae_logo_${escuelaActivaId}`, escuelaActual.logo_url);
      }

      auditar(
        'Perfil de la Escuela',
        'Actualizar Perfil',
        `Se actualizó el perfil institucional de ${escuelaActual.nombre_institucion} (${escuelaActivaId})`
      );

      if (Swal) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: `Perfil de ${escuelaActual.nombre_institucion} guardado exitosamente`,
          showConfirmButton: false,
          timer: 2500
        });
      }

      // Disparar evento para que el panel principal y cabeceras sincronicen el logo y datos
      window.dispatchEvent(new Event('escuelas-actualizadas'));
    } catch (e: any) {
      console.error("Error al guardar perfil:", e);
      if (Swal) {
        Swal.fire({
          title: 'Error al Guardar',
          text: e.message || 'No se pudo guardar la información en la base de datos.',
          icon: 'error'
        });
      }
    } finally {
      setGuardando(false);
    }
  };

  if (permLoading || loadingData) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando perfil institucional...</span>
        </div>
      </div>
    );
  }

  if (noAccess) {
    return (
      <div className="col-12 text-center py-5 mt-4">
        <div className="bg-light d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm border" style={{ width: '100px', height: '100px' }}>
          <i className="bi bi-shield-lock-fill text-muted" style={{ fontSize: '3.5rem' }}></i>
        </div>
        <h4 className="text-dark fw-bold mb-2">Área Restringida</h4>
        <p className="text-muted mb-0">No tienes permisos asignados para visualizar o editar el perfil escolar.</p>
      </div>
    );
  }

  // Identificar el logo actual para mostrar
  const logoActual = escuelaActual.logo_url || localStorage.getItem(`sigae_logo_${escuelaActivaId}`) || `/assets/img/logo_${escuelaActivaId}.png`;
  const isCustomLogo = !!escuelaActual.logo_url || !!localStorage.getItem(`sigae_logo_${escuelaActivaId}`);
  const colorPrimario = escuelaActivaId === 'sb' ? '#10b981' : escuelaActivaId === 'lb' ? '#0066FF' : '#8B5CF6';

  return (
    <div className="modulo-animado container-fluid p-0 animate__animated animate__fadeIn">

      {/* Input de archivo invisible para cargar logo */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleLogoFileChange}
        accept="image/png, image/jpeg, image/webp, image/svg+xml"
        style={{ display: 'none' }}
      />

      {/* MIGAS DE PAN CHAMILO */}
      <ChamiloBreadcrumb
        category="Dirección y Sistema"
        currentModule="Perfil de la Escuela"
      />

      {/* CUADRO DE AYUDA METODOLÓGICA CHAMILO */}
      <ChamiloHelpCallout
        id="ayuda_perfil_escuela_chamilo"
        title="Guía de Configuración del Perfil Institucional y Sedes"
        content="Personalice la identidad institucional de cada sede: nombre oficial, código DEA, RIF, dirección física, visión, misión, valores formativos y Proyecto Educativo Integral Comunitario (PEIC). Puede subir o cambiar el escudo oficial de cada escuela y agregar o eliminar sedes del complejo."
        icon="bi-bank2"
      />

      {/* ── 1. CABECERA INSTITUCIONAL TECNOLÓGICA CON LOGO CARGABLE Y CONMUTADOR DINÁMICO ── */}
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
            
            {/* ESCUDO INSTITUCIONAL CARGABLE CON BOTÓN DE CÁMARA EN CONTENEDOR INTERACTIVO */}
            <div className="col-12 col-md-auto text-center text-md-start">
              <div className="position-relative d-inline-block">
                <div 
                  className="tech-icon-wrapper bg-white shadow-sm d-inline-flex align-items-center justify-content-center p-2 overflow-hidden"
                  style={{ 
                    width: '110px', 
                    height: '110px',
                    borderRadius: '24px',
                    border: '2.5px solid #fed7aa',
                    boxShadow: '0 10px 24px rgba(249, 115, 22, 0.15)'
                  }}
                >
                  <img 
                    src={logoActual} 
                    alt={`Escudo de ${escuelaActual.nombre_institucion}`} 
                    className="img-fluid"
                    style={{ maxHeight: '92px', maxWidth: '92px', objectFit: 'contain' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                  />
                </div>

                {/* Botón flotante para subir/cambiar imagen de logo */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-sm rounded-circle position-absolute shadow-sm d-flex align-items-center justify-content-center text-white"
                  style={{ 
                    bottom: '-4px', 
                    right: '-4px', 
                    width: '36px', 
                    height: '36px', 
                    backgroundColor: '#ea580c', 
                    border: '2px solid #ffffff' 
                  }}
                  title="Cargar / Cambiar Escudo o Logo"
                >
                  <i className="bi bi-camera-fill"></i>
                </button>
              </div>

              {/* Controles para restaurar logo */}
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-link btn-xs text-decoration-none fw-bold p-0 d-block mx-auto"
                  style={{ fontSize: '0.75rem', color: '#c2410c' }}
                >
                  <i className="bi bi-upload me-1"></i>Cambiar Logo
                </button>

                {isCustomLogo && (
                  <button
                    type="button"
                    onClick={handleRestaurarLogoOriginal}
                    className="btn btn-link btn-xs text-muted p-0 d-block mx-auto text-decoration-none mt-0.5"
                    style={{ fontSize: '0.70rem' }}
                  >
                    Restaurar Original
                  </button>
                )}
              </div>
            </div>

            {/* Información Principal de la Sede Activa */}
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
                  <IconoPerfilEscuela size={18} color="#ffffff" />
                  <span>{escuelaActual.nivel_educativo || 'Institución Oficial'}</span>
                </span>

                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs">
                  DEA: {escuelaActual.codigo_dea || 'Por Asignar'}
                </span>
                <span className="badge bg-white text-dark border px-2.5 py-1.5 rounded-pill small fw-bold shadow-xs">
                  RIF: {escuelaActual.rif || 'G-20000041-4'}
                </span>
                <span className="badge bg-white text-secondary border px-2.5 py-1.5 rounded-pill small shadow-xs d-none d-lg-inline">
                  <i className="bi bi-building me-1 text-primary"></i>DEP PDVSA Oriente
                </span>
              </div>

              <h1 className="fw-bolder mb-1 text-dark" style={{ fontSize: 'calc(1.5rem + 0.75vw)', letterSpacing: '-0.6px' }}>
                {escuelaActual.nombre_institucion}
              </h1>

              <p className="mb-0 text-muted small d-flex align-items-center justify-content-center justify-content-md-start gap-1.5 flex-wrap">
                <i className="bi bi-geo-alt-fill text-danger flex-shrink-0"></i>
                <span className="fw-semibold">{escuelaActual.direccion || 'Dirección no registrada'}</span>
              </p>

              {/* Cinta de Telemetría Escolar Interactiva */}
              <div className="d-flex align-items-center gap-2 mt-3 flex-wrap">
                <div className="tech-pill-badge shadow-xs cursor-pointer" title="Período Escolar Oficial">
                  <i className="bi bi-calendar-check-fill text-success"></i>
                  <span className="text-secondary">Período 2025-2026</span>
                </div>
                <div className="tech-pill-badge shadow-xs cursor-pointer" title="Sedes Totales en el Complejo">
                  <i className="bi bi-buildings-fill text-primary"></i>
                  <span className="font-monospace fw-bold text-dark">{listaEscuelas.length} Sedes Vinculadas</span>
                </div>
                <div className="tech-pill-badge shadow-xs cursor-pointer" title="Estado Operativo">
                  <i className="bi bi-shield-fill-check text-warning"></i>
                  <span className="text-secondary">100% Operativo</span>
                </div>
              </div>
            </div>

            {/* Conmutador Superior Dinámico de Sedes & Botón Nueva Sede y Volver */}
            <div className="col-12 col-md-auto text-md-end text-center">
              <div className="d-flex flex-column align-items-md-end align-items-center gap-2.5">
                
                <button
                  type="button"
                  onClick={() => navigate('/categoria/Direcci%C3%B3n%20y%20Sistema')}
                  className="btn btn-white bg-white text-dark rounded-pill px-3.5 py-1.5 fw-bold shadow-xs hover-efecto border d-inline-flex align-items-center gap-2"
                  style={{ fontSize: '0.82rem', borderColor: '#fed7aa' }}
                >
                  <i className="bi bi-arrow-left text-warning" style={{ color: '#ea580c' }}></i>
                  <span>Volver a Dirección</span>
                </button>

                <div className="d-flex align-items-center justify-content-between w-100 gap-2">
                  <div className="text-muted extra-small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                    Sedes Institucionales:
                  </div>
                  
                  {/* Botón Nueva Sede */}
                  <button
                    type="button"
                    onClick={handleAgregarEscuela}
                    className="btn btn-xs rounded-pill px-2.5 py-1 fw-bold d-inline-flex align-items-center gap-1 shadow-xs hover-efecto text-white"
                    style={{ fontSize: '0.76rem', backgroundColor: '#ea580c', borderColor: '#ea580c' }}
                  >
                    <i className="bi bi-plus-circle-fill"></i>
                    <span>Nueva Sede</span>
                  </button>
                </div>

                {/* Botones de Píldora para cada Escuela con scroll táctil en celular */}
                <div 
                  className="p-1 bg-white rounded-pill border shadow-xs d-flex align-items-center gap-1 overflow-x-auto w-100 w-md-auto flex-nowrap"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', borderColor: '#fed7aa' }}
                >
                  {listaEscuelas.map(esc => {
                    const isSelected = esc.id_escuela === escuelaActivaId;
                    const escColor = esc.id_escuela === 'sb' ? 'btn-success' : esc.id_escuela === 'lb' ? 'btn-primary' : 'btn-dark';
                    return (
                      <button
                        key={esc.id_escuela}
                        type="button"
                        onClick={() => setEscuelaActivaId(esc.id_escuela)}
                        className={`btn btn-xs rounded-pill px-3 py-1.5 fw-bold d-flex align-items-center gap-1.5 transition-all text-nowrap ${
                          isSelected
                            ? `${escColor} text-white shadow-xs`
                            : 'btn-white text-muted border-0'
                        }`}
                        style={{ fontSize: '0.82rem' }}
                      >
                        <i className="bi bi-building-check"></i>
                        <span>{esc.nombre_institucion}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── 2. FORMULARIO DE IDENTIDAD INSTITUCIONAL Y FILOSOFÍA ── */}
      <div className="row g-4 mb-4">
        
        {/* BLOQUE A: DATOS JURÍDICOS Y ADMINISTRATIVOS */}
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom flex-wrap gap-2">
              <div>
                <h5 className="fw-bolder text-dark mb-0.5 d-flex align-items-center gap-2">
                  <i className="bi bi-card-heading text-primary fs-5"></i>
                  Datos Jurídicos y Localización de la Institución
                </h5>
                <p className="text-muted small mb-0">Información legal que se reflejará en constancias, carnets, reportes y comprobantes oficiales.</p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-light text-dark border rounded-pill px-3 py-1 fw-bold small">
                  Código Sede: <code>{escuelaActual.id_escuela}</code>
                </span>

                {/* Botón Eliminar Escuela (solo si hay más de 1) */}
                {listaEscuelas.length > 1 && (
                  <button
                    type="button"
                    onClick={handleEliminarEscuela}
                    className="btn btn-outline-danger btn-xs rounded-pill px-2.5 py-1 fw-bold d-flex align-items-center gap-1 hover-efecto"
                    title="Eliminar esta sede institucional"
                    style={{ fontSize: '0.78rem' }}
                  >
                    <i className="bi bi-trash3"></i>
                    <span>Eliminar Sede</span>
                  </button>
                )}
              </div>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-5">
                <label className="form-label fw-bold text-dark small mb-1">
                  Nombre Oficial de la Institución <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 rounded-start-3">
                    <i className="bi bi-building text-muted"></i>
                  </span>
                  <input
                    type="text"
                    value={escuelaActual.nombre_institucion}
                    onChange={(e) => handleChange('nombre_institucion', e.target.value)}
                    className="form-control rounded-end-3 fw-bold"
                    placeholder="Ej. U.E. Santa Bárbara"
                  />
                </div>
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label fw-bold text-dark small mb-1">
                  Nivel Educativo Principal
                </label>
                <select
                  value={escuelaActual.nivel_educativo || 'Educación Primaria'}
                  onChange={(e) => handleChange('nivel_educativo', e.target.value)}
                  className="form-select rounded-3 fw-bold"
                >
                  <option value="Educación Inicial y Maternal">Educación Inicial y Maternal</option>
                  <option value="Educación Inicial y Primaria">Educación Inicial y Primaria</option>
                  <option value="Educación Primaria">Educación Primaria</option>
                  <option value="Educación Media General">Educación Media General</option>
                  <option value="Educación Media Técnica">Educación Media Técnica</option>
                  <option value="Educación Especial">Educación Especial</option>
                  <option value="Complejo Educativo Integral">Complejo Educativo Integral</option>
                </select>
              </div>

              <div className="col-12 col-md-2">
                <label className="form-label fw-bold text-dark small mb-1">
                  Código DEA Oficial
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 rounded-start-3">
                    <i className="bi bi-qr-code text-muted"></i>
                  </span>
                  <input
                    type="text"
                    value={escuelaActual.codigo_dea}
                    onChange={(e) => handleChange('codigo_dea', e.target.value)}
                    className="form-control rounded-end-3 text-uppercase fw-bold"
                    placeholder="Ej. OD05561615"
                  />
                </div>
              </div>

              <div className="col-12 col-md-2">
                <label className="form-label fw-bold text-dark small mb-1">
                  RIF Institucional
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 rounded-start-3">
                    <i className="bi bi-file-earmark-text text-muted"></i>
                  </span>
                  <input
                    type="text"
                    value={escuelaActual.rif}
                    onChange={(e) => handleChange('rif', e.target.value)}
                    className="form-control rounded-end-3 text-uppercase fw-bold"
                    placeholder="Ej. G-20000041-4"
                  />
                </div>
              </div>

              <div className="col-12">
                <label className="form-label fw-bold text-dark small mb-1">
                  Dirección Geográfica y Sede Física
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 rounded-start-3 align-items-start pt-2">
                    <i className="bi bi-geo-alt text-muted"></i>
                  </span>
                  <textarea
                    rows={2}
                    value={escuelaActual.direccion}
                    onChange={(e) => handleChange('direccion', e.target.value)}
                    className="form-control rounded-end-3"
                    placeholder="Dirección física completa, estado, municipio y parroquia de la institución."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BLOQUE B: FILOSOFÍA INSTITUCIONAL CON ICONOS 3D (MISIÓN, VISIÓN, VALORES, PEIC) */}
        <div className="col-12">
          <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom flex-wrap gap-2">
              <div>
                <h5 className="fw-bolder text-dark mb-0.5 d-flex align-items-center gap-2">
                  <i className="bi bi-compass text-info fs-5"></i>
                  Filosofía de Gestión, Valores y P.E.I.C.
                </h5>
                <p className="text-muted small mb-0">Declaraciones pedagógicas y comunitarias mostradas directamente en el panel principal y dossier escolar.</p>
              </div>
            </div>

            <div className="row g-4">
              
              {/* Tarjeta 3D: Misión */}
              <div className="col-12 col-md-6">
                <div className="card border shadow-xs rounded-4 p-3.5 h-100 bg-light bg-opacity-40" style={{ borderTop: '4px solid #0066FF' }}>
                  <div className="d-flex align-items-center gap-3 mb-3 pb-2 border-bottom">
                    <img 
                      src="/assets/img/mision_3d.jpg" 
                      alt="Misión 3D" 
                      className="img-fluid rounded-3 shadow-xs flex-shrink-0"
                      style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                    />
                    <div>
                      <span className="badge bg-primary bg-opacity-10 text-primary text-uppercase fw-bolder px-2.5 py-1 rounded-pill extra-small">
                        Misión Institucional
                      </span>
                      <div className="fw-bold text-dark extra-small mt-0.5">Propósito y Razón de Ser</div>
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={escuelaActual.mision}
                    onChange={(e) => handleChange('mision', e.target.value)}
                    className="form-control rounded-3 border-light bg-white"
                    placeholder="Escriba la misión institucional..."
                    style={{ fontSize: '0.88rem', lineHeight: '1.5' }}
                  />
                </div>
              </div>

              {/* Tarjeta 3D: Visión */}
              <div className="col-12 col-md-6">
                <div className="card border shadow-xs rounded-4 p-3.5 h-100 bg-light bg-opacity-40" style={{ borderTop: '4px solid #00C3FF' }}>
                  <div className="d-flex align-items-center gap-3 mb-3 pb-2 border-bottom">
                    <img 
                      src="/assets/img/vision_3d.jpg" 
                      alt="Visión 3D" 
                      className="img-fluid rounded-3 shadow-xs flex-shrink-0"
                      style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                    />
                    <div>
                      <span className="badge bg-info bg-opacity-10 text-info text-uppercase fw-bolder px-2.5 py-1 rounded-pill extra-small">
                        Visión Institucional
                      </span>
                      <div className="fw-bold text-dark extra-small mt-0.5">Proyección y Futuro</div>
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={escuelaActual.vision}
                    onChange={(e) => handleChange('vision', e.target.value)}
                    className="form-control rounded-3 border-light bg-white"
                    placeholder="Escriba la visión institucional..."
                    style={{ fontSize: '0.88rem', lineHeight: '1.5' }}
                  />
                </div>
              </div>

              {/* Tarjeta 3D: Valores / Principios Éticos */}
              <div className="col-12 col-md-6">
                <div className="card border shadow-xs rounded-4 p-3.5 h-100 bg-light bg-opacity-40" style={{ borderTop: '4px solid #10b981' }}>
                  <div className="d-flex align-items-center gap-3 mb-3 pb-2 border-bottom">
                    <img 
                      src="/assets/img/valores_3d.jpg" 
                      alt="Valores 3D" 
                      className="img-fluid rounded-3 shadow-xs flex-shrink-0"
                      style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                    />
                    <div>
                      <span className="badge bg-success bg-opacity-10 text-success text-uppercase fw-bolder px-2.5 py-1 rounded-pill extra-small">
                        Valores y Principios
                      </span>
                      <div className="fw-bold text-dark extra-small mt-0.5">Ética y Conducta Pedagógica</div>
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={escuelaActual.objetivo}
                    onChange={(e) => handleChange('objetivo', e.target.value)}
                    className="form-control rounded-3 border-light bg-white"
                    placeholder="Escriba los valores y objetivos pedagógicos..."
                    style={{ fontSize: '0.88rem', lineHeight: '1.5' }}
                  />
                </div>
              </div>

              {/* Tarjeta 3D: P.E.I.C. */}
              <div className="col-12 col-md-6">
                <div className="card border shadow-xs rounded-4 p-3.5 h-100 bg-light bg-opacity-40" style={{ borderTop: '4px solid #FF8D00' }}>
                  <div className="d-flex align-items-center gap-3 mb-3 pb-2 border-bottom">
                    <img 
                      src="/assets/img/peic_3d.png" 
                      alt="PEIC 3D" 
                      className="img-fluid rounded-3 shadow-xs flex-shrink-0"
                      style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                    />
                    <div>
                      <span className="badge bg-warning bg-opacity-10 text-warning text-uppercase fw-bolder px-2.5 py-1 rounded-pill extra-small">
                        P.E.I.C.
                      </span>
                      <div className="fw-bold text-dark extra-small mt-0.5">Proyecto Comunitario Integrado</div>
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={escuelaActual.peic}
                    onChange={(e) => handleChange('peic', e.target.value)}
                    className="form-control rounded-3 border-light bg-white"
                    placeholder="Escriba la descripción del PEIC..."
                    style={{ fontSize: '0.88rem', lineHeight: '1.5' }}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* ── 3. BARRA DE ACCIÓN FLOTANTE / INFERIOR ESTILO CHAMILO ── */}
      <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-5">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate('/categoria/Direcci%C3%B3n%20y%20Sistema')}
            className="btn btn-light rounded-pill px-4 py-2.5 fw-bold text-muted d-flex align-items-center justify-content-center gap-2 hover-efecto w-100 w-sm-auto"
          >
            <i className="bi bi-arrow-left"></i>
            <span>Volver a Dirección</span>
          </button>

          <div className="d-flex align-items-center gap-2 w-100 w-sm-auto">
            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
              className="btn btn-primary rounded-pill px-4 px-md-5 py-2.5 fw-bold shadow d-flex align-items-center justify-content-center gap-2 hover-efecto w-100"
              style={{ backgroundColor: colorPrimario, borderColor: colorPrimario }}
            >
              {guardando ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Guardando Cambios...</span>
                </>
              ) : (
                <>
                  <i className="bi bi-floppy-fill"></i>
                  <span>Guardar Perfil de {escuelaActual.nombre_institucion}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
