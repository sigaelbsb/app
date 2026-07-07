import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';
import { formatPhoneNumber } from '../../lib/formatters';


interface GradoItem {
  id_parametro: string;
  valor: string;
  orden: number;
}

interface SeccionItem {
  id_parametro: string;
  valor: string;
}

interface NivelItem {
  id_parametro: string;
  valor: string;
}

interface EspacioItem {
  id: string;
  nombre: string;
  tipo: string;
  capacidad: number;
  id_escuela: string;
}

interface SalonItem {
  id_salon: string;
  id_escuela: string;
  nivel_educativo: string;
  grado_anio: string;
  seccion: string;
  nombre_salon: string;
  id_espacio: string;
  estatus: string;
  docentes_guias?: string[];
}

export const GradosSalones = () => {
  const navigate = useNavigate();
  const { tienePermiso, tienePermisoEnEscuela, loading: permLoading } = usePermisos();
  const Swal = (window as any).Swal;

  const [activeTab, setActiveTab] = useState<'grados' | 'secciones' | 'salones'>('grados');

  const [niveles, setNiveles] = useState<NivelItem[]>([]);
  const [grados, setGrados] = useState<GradoItem[]>([]);
  const [secciones, setSecciones] = useState<SeccionItem[]>([]);
  const [espacios, setEspacios] = useState<EspacioItem[]>([]);
  const [salones, setSalones] = useState<SalonItem[]>([]);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [escuelaFiltro, setEscuelaFiltro] = useState<string>('todas');
  const [criterioOrden, setCriterioOrden] = useState<string>('nombre_salon');

  // Permissions checks
  const pGrupos = tienePermiso('Tarjeta: Configurar Grados', 'ver');
  const pSecc = tienePermiso('Tarjeta: Configurar Secciones', 'ver');
  
  // Apertura de salones específica por escuela
  const canSalonesSB = tienePermisoEnEscuela('sb', 'Tarjeta: Apertura de Salones', 'ver');
  const canSalonesLB = tienePermisoEnEscuela('lb', 'Tarjeta: Apertura de Salones', 'ver');
  const pSalones = canSalonesSB || canSalonesLB;

  const canCrearGrados = tienePermiso('Tarjeta: Configurar Grados', 'crear');
  const canEliminarGrados = tienePermiso('Tarjeta: Configurar Grados', 'eliminar');

  const canCrearSecciones = tienePermiso('Tarjeta: Configurar Secciones', 'crear');
  const canEliminarSecciones = tienePermiso('Tarjeta: Configurar Secciones', 'eliminar');

  // Crear/Eliminar salones específicas por escuela
  const canCrearSalonesSB = tienePermisoEnEscuela('sb', 'Tarjeta: Apertura de Salones', 'crear');
  const canCrearSalonesLB = tienePermisoEnEscuela('lb', 'Tarjeta: Apertura de Salones', 'crear');
  const canCrearSalones = canCrearSalonesSB || canCrearSalonesLB;

  const canEliminarSalonesSB = tienePermisoEnEscuela('sb', 'Tarjeta: Apertura de Salones', 'eliminar');
  const canEliminarSalonesLB = tienePermisoEnEscuela('lb', 'Tarjeta: Apertura de Salones', 'eliminar');

  const isModuleRestricted = !permLoading && !pGrupos && !pSecc && !pSalones;

  const escuelasAutorizadasSalones = [
    ...(canSalonesSB ? ['sb'] : []),
    ...(canSalonesLB ? ['lb'] : [])
  ];

  useEffect(() => {
    if (!permLoading) {
      if (pGrupos) setActiveTab('grados');
      else if (pSecc) setActiveTab('secciones');
      else if (pSalones) setActiveTab('salones');
    }
  }, [permLoading]);

  useEffect(() => {
    if (!permLoading && !isModuleRestricted) {
      cargarDatos();
    }
  }, [permLoading]);

  const cargarDatos = async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const [nivRes, graRes, secRes, espRes, docRes] = await Promise.all([
        supabase.from('conf_niveles').select('*').order('valor', { ascending: true }),
        supabase.from('conf_grados').select('*').order('orden', { ascending: true }),
        supabase.from('conf_secciones').select('*').order('valor', { ascending: true }),
        supabase.from('espacios').select('*').order('nombre', { ascending: true }),
        supabase.from('usuarios').select('cedula, nombre_completo, id_escuela, telefono, email').eq('rol', 'Docente').eq('estado', 'Activo').order('nombre_completo', { ascending: true })
      ]);

      if (nivRes.error) throw nivRes.error;
      if (graRes.error) throw graRes.error;
      if (secRes.error) throw secRes.error;
      if (espRes.error) throw espRes.error;
      if (docRes.error) throw docRes.error;

      setNiveles(nivRes.data || []);
      setGrados(graRes.data || []);
      setSecciones(secRes.data || []);
      setEspacios(espRes.data || []);
      setDocentes(docRes.data || []);

      // Fetch salones according to authorized schools for classroom opening
      let salonesQuery = supabase.from('salones').select('*');
      if (escuelasAutorizadasSalones.length === 1) {
        salonesQuery = salonesQuery.eq('id_escuela', escuelasAutorizadasSalones[0]);
      } else if (escuelasAutorizadasSalones.length === 0) {
        salonesQuery = salonesQuery.eq('id_escuela', 'ninguna');
      } else {
        salonesQuery = salonesQuery.in('id_escuela', escuelasAutorizadasSalones);
      }

      const salonesRes = await salonesQuery;
      if (salonesRes.error) throw salonesRes.error;
      setSalones(salonesRes.data || []);

      // Initialize filter based on authorized schools for salones
      if (escuelaFiltro === 'todas' || !escuelasAutorizadasSalones.includes(escuelaFiltro)) {
        if (escuelasAutorizadasSalones.length === 1) {
          setEscuelaFiltro(escuelasAutorizadasSalones[0]);
        } else {
          setEscuelaFiltro('todas');
        }
      }
    } catch (e: any) {
      console.error(e);
      if (Swal) Swal.fire('Error', 'Falla de conexión al cargar datos.', 'error');
    }
    if (!silencioso) setLoading(false);
  };

  // Reordering grados
  const moverGrado = async (id: string, direccion: number) => {
    const index = grados.findIndex(g => g.id_parametro === id);
    if (index < 0) return;
    const nuevoIndex = index + direccion;
    if (nuevoIndex < 0 || nuevoIndex >= grados.length) return;

    const newGrados = [...grados];
    const temp = newGrados[index];
    newGrados[index] = newGrados[nuevoIndex];
    newGrados[nuevoIndex] = temp;

    // Recalculate order values
    const updatedGrados = newGrados.map((g, idx) => ({ ...g, orden: idx + 1 }));
    setGrados(updatedGrados);

    if (Swal) {
      Swal.fire({
        title: 'Guardando Orden',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
    }

    try {
      const promesas = updatedGrados.map(g => 
        supabase.from('conf_grados').update({ orden: g.orden }).eq('id_parametro', g.id_parametro)
      );
      await Promise.all(promesas);

      if (Swal) Swal.close();
      cargarDatos(true);
    } catch (e) {
      console.error(e);
      if (Swal) {
        Swal.close();
        Swal.fire('Error', 'No se pudo actualizar el orden en el servidor.', 'error');
      }
    }
  };

  // Generic config items management
  const nuevoParametro = (categoria: 'grado' | 'seccion', placeholderText: string) => {
    const tabla = categoria === 'grado' ? 'conf_grados' : 'conf_secciones';

    if (categoria === 'grado' && !canCrearGrados) return;
    if (categoria === 'seccion' && !canCrearSecciones) return;

    if (!Swal) return;

    Swal.fire({
      title: 'Nuevo Registro',
      input: 'text',
      inputPlaceholder: placeholderText,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      confirmButtonColor: '#00BCD4',
      preConfirm: (val: string) => {
        if (!val || !val.trim()) {
          Swal.showValidationMessage('El nombre es obligatorio');
          return false;
        }
        return val.trim();
      }
    }).then(async (result: any) => {
      if (result.isConfirmed && result.value) {
        const valorLimpio = result.value;
        const lista = categoria === 'grado' ? grados : secciones;
        if (lista.find(x => x.valor.toLowerCase() === valorLimpio.toLowerCase())) {
          Swal.fire('Aviso', 'Este registro ya existe.', 'warning');
          return;
        }

        setLoading(true);
        try {
          const payload: any = {
            id_parametro: "CONF-" + new Date().getTime(),
            valor: valorLimpio
          };

          if (tabla === 'conf_grados') {
            const maxOrden = grados.reduce((max, g) => Math.max(max, g.orden || 0), 0);
            payload.orden = maxOrden + 1;
          }

          const { error } = await supabase.from(tabla).insert([payload]);
          if (error) throw error;

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Guardado exitosamente',
            showConfirmButton: false,
            timer: 1500
          });

          auditar('Control de Estudios', 'Nuevo Parámetro', `Se agregó "${valorLimpio}" a la configuración de Salones.`);
          cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla al guardar en la base de datos.', 'error');
          setLoading(false);
        }
      }
    });
  };

  const editarParametro = (id: string, tabla: 'conf_grados' | 'conf_secciones', valorActual: string, _permiso: string) => {
    if (tabla === 'conf_grados' && !canCrearGrados) return;
    if (tabla === 'conf_secciones' && !canCrearSecciones) return;

    if (!Swal) return;

    Swal.fire({
      title: 'Editar Registro',
      input: 'text',
      inputValue: valorActual,
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      confirmButtonColor: '#00BCD4',
      preConfirm: (nuevoValor: string) => {
        if (!nuevoValor || !nuevoValor.trim()) {
          Swal.showValidationMessage('El valor es obligatorio');
          return false;
        }
        return nuevoValor.trim();
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        const valorLimpio = result.value;
        if (valorLimpio.toLowerCase() === valorActual.toLowerCase()) return;

        const lista = tabla === 'conf_grados' ? grados : secciones;
        if (lista.find(x => x.valor.toLowerCase() === valorLimpio.toLowerCase() && x.id_parametro !== id)) {
          Swal.fire('Aviso', 'Este registro ya existe.', 'warning');
          return;
        }

        setLoading(true);
        try {
          const { error } = await supabase.from(tabla).update({ valor: valorLimpio }).eq('id_parametro', id);
          if (error) throw error;

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Actualizado exitosamente',
            showConfirmButton: false,
            timer: 1500
          });

          auditar('Control de Estudios', 'Editar Parámetro', `Se actualizó "${valorActual}" a "${valorLimpio}".`);
          cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo actualizar.', 'error');
          setLoading(false);
        }
      }
    });
  };

  const eliminarParametro = (id: string, tabla: 'conf_grados' | 'conf_secciones', valor: string) => {
    if (tabla === 'conf_grados' && !canEliminarGrados) return;
    if (tabla === 'conf_secciones' && !canEliminarSecciones) return;

    if (!Swal) return;

    Swal.fire({
      title: '¿Eliminar Registro?',
      text: `Se borrará permanentemente "${valor}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase.from(tabla).delete().eq('id_parametro', id);
          if (error) throw error;

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Eliminado correctamente',
            showConfirmButton: false,
            timer: 1500
          });

          auditar('Control de Estudios', 'Eliminar Parámetro', `Se eliminó "${valor}".`);

          // Compact orders if a grade was deleted
          if (tabla === 'conf_grados') {
            const restantes = grados.filter(g => g.id_parametro !== id);
            restantes.forEach((g, idx) => { g.orden = idx + 1; });
            const promesas = restantes.map(g => 
              supabase.from('conf_grados').update({ orden: g.orden }).eq('id_parametro', g.id_parametro)
            );
            await Promise.all(promesas);
          }

          cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo eliminar.', 'error');
          setLoading(false);
        }
      }
    });
  };

  const abrirModalReporte = () => {
    if (salones.length === 0) {
      Swal.fire('Sin Registros', 'No existen salones aperturados en el sistema para descargar.', 'warning');
      return;
    }

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

    let optEscuelas = '';
    if (escuelasAutorizadasSalones.includes('sb') && escuelasAutorizadasSalones.includes('lb')) {
      optEscuelas += '<option value="ambas">Ambas Escuelas (Consolidado)</option>';
    }
    if (escuelasAutorizadasSalones.includes('sb')) {
      optEscuelas += '<option value="sb">UE Santa Bárbara</option>';
    }
    if (escuelasAutorizadasSalones.includes('lb')) {
      optEscuelas += '<option value="lb">UE Libertador Bolívar</option>';
    }

    const htmlForm = `
      <div class="text-start">
        <label class="small fw-bold mb-1 text-muted"><i class="bi bi-building text-info me-1"></i>Escuela(s) a incluir</label>
        <select id="rep-escuela" class="swal2-input input-moderno m-0 mb-3 w-100">${optEscuelas}</select>

        <div class="row g-3">
          <div class="col-6">
            <label class="small fw-bold mb-1 text-muted"><i class="bi bi-file-earmark text-primary me-1"></i>Tipo de Hoja</label>
            <select id="rep-formato" class="swal2-input input-moderno m-0 w-100">
              <option value="letter">Carta</option>
              <option value="legal">Oficio</option>
              <option value="a4">A4</option>
            </select>
          </div>
          <div class="col-6">
            <label class="small fw-bold mb-1 text-muted"><i class="bi bi-arrow-left-right text-success me-1"></i>Orientación</label>
            <select id="rep-orientacion" class="swal2-input input-moderno m-0 w-100">
              <option value="portrait">Vertical (Portrait)</option>
              <option value="landscape">Horizontal (Landscape)</option>
            </select>
          </div>
        </div>
      </div>
    `;

    Swal.fire({
      title: 'Descargar Reporte PDF',
      html: htmlForm,
      showCancelButton: true,
      confirmButtonText: 'Generar PDF',
      confirmButtonColor: '#00BCD4',
      preConfirm: () => {
        const escuela = (document.getElementById('rep-escuela') as HTMLSelectElement).value;
        const formato = (document.getElementById('rep-formato') as HTMLSelectElement).value;
        const orientacion = (document.getElementById('rep-orientacion') as HTMLSelectElement).value;
        
        if (!escuela || !formato || !orientacion) {
          Swal.showValidationMessage('Todos los campos son obligatorios');
          return false;
        }
        return { escuela, formato, orientacion };
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        const { escuela, formato, orientacion } = result.value;
        
        // Filter salones according to selected option and authorization
        let salonesSeleccionados = salones;
        if (escuela === 'ambas') {
          salonesSeleccionados = salones.filter(s => escuelasAutorizadasSalones.includes(s.id_escuela));
        } else {
          salonesSeleccionados = salones.filter(s => s.id_escuela === escuela);
        }

        if (salonesSeleccionados.length === 0) {
          Swal.fire('Reporte Vacío', 'No existen salones aperturados para la selección elegida.', 'info');
          return;
        }

        // Sort by name
        salonesSeleccionados.sort((a, b) => (a.nombre_salon || '').localeCompare(b.nombre_salon || ''));

        // Load html2pdf from window
        const html2pdf = (window as any).html2pdf;
        if (!html2pdf) {
          Swal.fire('Error', 'La librería de generación de PDF (html2pdf) no está cargada.', 'error');
          return;
        }

        Swal.fire({
          title: 'Generando Reporte...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        // Fetch logos as base64
        const base64LogoSB = await obtenerImagenBase64('/assets/img/logo_sb.png');
        const base64LogoLB = await obtenerImagenBase64('/assets/img/logo_lb.png');
        const base64LogoSistema = await obtenerImagenBase64('/assets/img/sigae.png');
        const base64CintilloMPPE = await obtenerImagenBase64('/assets/img/logoMPPE.png');

        // Generate rows
        let rowsHtml = '';
        salonesSeleccionados.forEach(s => {
          const escuelaNombre = s.id_escuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
          const badgeClass = s.id_escuela === 'sb' ? 'badge-sb' : 'badge-lb';
          const espacio = espacios.find(e => e.id === s.id_espacio);
          const espacioNombre = espacio ? `${espacio.nombre} (Cap: ${espacio.capacidad || 0} pax)` : 'Sin espacio físico asignado';
          
          let docentesStr = '';
          if (s.docentes_guias && s.docentes_guias.length > 0) {
            s.docentes_guias.forEach((cedula, i) => {
              const docObj = docentes.find(d => d.cedula === cedula);
              const nombre = docObj ? docObj.nombre_completo : `C.I. ${cedula}`;
              const telefono = docObj && docObj.telefono ? formatPhoneNumber(docObj.telefono) : 'Sin teléfono';
              const email = docObj && docObj.email ? docObj.email : 'Sin correo';
              const rol = i === 0 ? 'Principal' : 'Auxiliar';
              docentesStr += `
                <div class="teacher-item">
                  <b>${rol}:</b> ${nombre}<br/>
                  <span style="font-size: 8px; color: #555; padding-left: 5px; font-weight: normal;">
                    Tlf: ${telefono} | Correo: ${email}
                  </span>
                </div>
              `;
            });
          } else {
            docentesStr = '<span style="color: #999; font-style: italic;">Sin asignar</span>';
          }

          rowsHtml += `
            <tr>
              <td><span class="badge-pdf ${badgeClass}">${escuelaNombre}</span></td>
              <td style="font-weight: bold; text-transform: uppercase;">${s.nombre_salon}</td>
              <td>${espacioNombre}</td>
              <td>${s.nivel_educativo}</td>
              <td>${docentesStr}</td>
            </tr>
          `;
        });

        const escuelaStr = escuela === 'ambas' ? 'Santa Bárbara & Libertador Bolívar' : (escuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
        
        let logoHtml = '';
        if (escuela === 'ambas') {
          if (base64LogoSB) logoHtml += `<img src="${base64LogoSB}" style="height: 40px; object-fit: contain; margin-right: 5px;" />`;
          if (base64LogoLB) logoHtml += `<img src="${base64LogoLB}" style="height: 40px; object-fit: contain;" />`;
        } else if (escuela === 'sb') {
          if (base64LogoSB) logoHtml += `<img src="${base64LogoSB}" style="height: 40px; object-fit: contain;" />`;
        } else if (escuela === 'lb') {
          if (base64LogoLB) logoHtml += `<img src="${base64LogoLB}" style="height: 40px; object-fit: contain;" />`;
        }

        let escuelaTitulo = '';
        if (escuela === 'ambas') {
          escuelaTitulo = 'UE Santa Bárbara & UE Libertador Bolívar';
        } else if (escuela === 'sb') {
          escuelaTitulo = 'UE Santa Bárbara';
        } else if (escuela === 'lb') {
          escuelaTitulo = 'UE Libertador Bolívar';
        }

        let cintilloHtml = '';
        if (base64CintilloMPPE) {
          cintilloHtml = `<img src="${base64CintilloMPPE}" style="height: 18px; object-fit: contain;" />`;
        }

        let logoSistemaHtml = '';
        if (base64LogoSistema) {
          logoSistemaHtml = `<img src="${base64LogoSistema}" style="height: 18px; object-fit: contain;" />`;
        }

        // Create a hidden wrapper in the DOM to lay out the content correctly without cluttering the screen
        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.top = '-9999px';
        wrapper.style.left = '-9999px';
        wrapper.style.width = orientacion === 'landscape' ? '297mm' : '210mm';
        wrapper.style.height = 'auto';
        wrapper.style.overflow = 'visible';
        wrapper.style.background = 'transparent';

        // Create printable layout container (normal styles so it clones correctly inside html2pdf)
        const container = document.createElement('div');
        container.style.width = orientacion === 'landscape' ? '277mm' : '190mm';
        container.style.background = '#ffffff';
        container.style.padding = '10mm';
        container.style.boxSizing = 'border-box';
        container.style.fontFamily = "'Plus Jakarta Sans', Arial, sans-serif";

        container.innerHTML = `
          <style>
            .pdf-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #00838F;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .pdf-title-container {
              text-align: right;
              line-height: 1.3;
            }
            .pdf-title {
              font-size: 15px;
              font-weight: bold;
              color: #00838F;
              margin: 0;
              text-transform: uppercase;
            }
            .pdf-subtitle {
              font-size: 8px;
              color: #666;
              margin: 2px 0 0 0;
            }
            .pdf-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .pdf-table th {
              background-color: #00838F;
              color: #ffffff;
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
              padding: 8px;
              border: 1px solid #ddd;
              text-align: left;
            }
            .pdf-table td {
              font-size: 10px;
              padding: 8px;
              border: 1px solid #ddd;
              color: #333;
            }
            .pdf-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .pdf-footer {
              margin-top: 30px;
              border-top: 1px solid #ddd;
              padding-top: 10px;
              font-size: 8px;
              color: #777;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .badge-pdf {
              display: inline-block;
              padding: 2px 6px;
              font-size: 8px;
              font-weight: bold;
              border-radius: 4px;
            }
            .badge-sb { background-color: #eff6ff; color: #0066FF; border: 1px solid #bfdbfe; }
            .badge-lb { background-color: #fff1f2; color: #EF4444; border: 1px solid #fecdd3; }
            .teacher-item {
              display: block;
              font-size: 9px;
              margin-bottom: 4px;
              border-bottom: 1px dashed #eee;
              padding-bottom: 3px;
            }
            .teacher-item:last-child {
              border-bottom: none;
              padding-bottom: 0;
            }
          </style>
          
          <div class="pdf-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              ${logoHtml}
              <div style="font-size: 9px; line-height: 1.3; color: #333;">
                <p style="margin: 0; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">República Bolivariana de Venezuela</p>
                <p style="margin: 0; font-weight: normal;">Ministerio del Poder Popular para la Educación</p>
                <p style="margin: 0; font-weight: bold; font-size: 10px; color: #00838F;">${escuelaTitulo}</p>
                <p style="margin: 0; color: #666; font-size: 8px;">Escuelas DEP Oriente</p>
              </div>
            </div>
            <div class="pdf-title-container">
              <h1 class="pdf-title">Reporte de Salones y Secciones</h1>
              <p class="pdf-subtitle">Generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}</p>
              <span style="font-size: 8px; font-weight: bold; color: #00838F; display: block; margin-top: 2px;">Control de Estudios | Reporte Oficial</span>
            </div>
          </div>
          
          <table class="pdf-table">
            <thead>
              <tr>
                <th style="width: 20%;">Escuela</th>
                <th style="width: 15%;">Salón / Sección</th>
                <th style="width: 25%;">Espacio Físico</th>
                <th style="width: 15%;">Nivel Educativo</th>
                <th style="width: 25%;">Docente(s) Guía</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="pdf-footer">
            <div style="display: flex; align-items: center; gap: 8px;">
              ${cintilloHtml}
              <span>Reporte emitido de forma automatizada por el Sistema Integral de Gestión y Administración Escolar (SIGAE)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 5px;">
              <span>Página 1 de 1</span>
              ${logoSistemaHtml}
            </div>
          </div>
        `;

        wrapper.appendChild(container);
        document.body.appendChild(wrapper);

        const opt = {
          margin: 10,
          filename: `Reporte_Salones_${new Date().toISOString().slice(0, 10)}.pdf`,
          image: { type: 'jpeg', quality: 1.0 },
          html2canvas: { scale: 3.5, useCORS: true, scrollY: 0, scrollX: 0, imageTimeout: 0 },
          jsPDF: { unit: 'mm', format: formato, orientation: orientacion }
        };

        html2pdf().set(opt).from(container).save().then(() => {
          document.body.removeChild(wrapper);
          Swal.close();
          auditar('Control de Estudios', 'Exportar Reporte', `Se descargó el reporte PDF de salones para: ${escuelaStr}`);
        }).catch((err: any) => {
          console.error(err);
          document.body.removeChild(wrapper);
          Swal.close();
          Swal.fire('Error', 'No se pudo generar el documento PDF.', 'error');
        });
      }
    });
  };

  // Opened classrooms actions
  const abrirModalSalon = () => {
    if (!canCrearSalones) return;

    if (niveles.length === 0 || grados.length === 0 || secciones.length === 0) {
      Swal.fire('Faltan Datos', 'Debe configurar los Niveles Educativos, Grados y Secciones antes de aperturar un salón.', 'warning');
      return;
    }

    let optNiveles = '<option value="">Seleccione Nivel...</option>';
    niveles.forEach(n => optNiveles += `<option value="${n.valor}">${n.valor}</option>`);

    let optGrados = '<option value="">Seleccione Grado...</option>';
    grados.forEach(g => optGrados += `<option value="${g.valor}">${g.valor}</option>`);

    let optSecc = '<option value="">Seleccione Sección...</option>';
    secciones.forEach(s => optSecc += `<option value="${s.valor}">${s.valor}</option>`);

    // Filter spaces by school-specific permissions (must have ver and crear permission for classroom opening)
    const espaciosFiltrados = espacios.filter(e => {
      const canVer = e.id_escuela === 'sb' ? canSalonesSB : canSalonesLB;
      const canCrear = e.id_escuela === 'sb' ? canCrearSalonesSB : canCrearSalonesLB;
      return canVer && canCrear;
    });

    if (espaciosFiltrados.length === 0) {
      Swal.fire('Sin Permisos o Espacios', 'No posee espacios físicos configurados en las escuelas autorizadas para aperturar salones.', 'warning');
      return;
    }

    let optEspacios = '<option value="">Seleccione Espacio Físico...</option>';
    espaciosFiltrados.forEach(e => {
      const nombreEscuelaStr = e.id_escuela === 'sb' ? 'Santa Bárbara' : 'Libertador Bolívar';
      optEspacios += `<option value="${e.id}">${e.nombre} (${nombreEscuelaStr})</option>`;
    });

    const assignedCedulas = new Set<string>();
    salones.forEach(s => {
      if (s.docentes_guias) {
        s.docentes_guias.forEach(c => {
          if (c) assignedCedulas.add(c);
        });
      }
    });

    let optDocentes = '<option value="">Sin Asignar</option>';
    docentes.forEach(d => {
      optDocentes += `<option value="${d.cedula}">${d.nombre_completo}</option>`;
    });

    const htmlForm = `
    <div class="text-start">
      <label class="small fw-bold mb-1 text-muted"><i class="bi bi-geo-alt-fill text-danger me-1"></i>Espacio Físico (Ambiente)</label>
      <select id="swal-espacio" class="swal2-input input-moderno m-0 mb-3 w-100">${optEspacios}</select>
 
      <div class="row g-3 mb-3">
        <div class="col-8">
          <label class="small fw-bold mb-1 text-muted"><i class="bi bi-building text-primary me-1"></i>Escuela</label>
          <input type="text" id="swal-escuela-nombre" class="form-control input-moderno mb-0 w-100" readonly disabled placeholder="Seleccione espacio...">
          <input type="hidden" id="swal-escuela">
        </div>
        <div class="col-4">
          <label class="small fw-bold mb-1 text-muted"><i class="bi bi-people-fill text-info me-1"></i>Capacidad</label>
          <input type="text" id="swal-capacidad" class="form-control input-moderno mb-0 w-100" readonly disabled placeholder="-- pax">
        </div>
      </div>
 
      <label class="small fw-bold mb-1 text-muted">Nivel Educativo</label>
      <select id="swal-nivel" class="swal2-input input-moderno m-0 mb-3 w-100">${optNiveles}</select>
      
      <div class="row g-3 mb-3">
        <div class="col-8">
          <label class="small fw-bold mb-1 text-muted">Grado / Año</label>
          <select id="swal-grado" class="swal2-input input-moderno m-0 w-100">${optGrados}</select>
        </div>
        <div class="col-4">
          <label class="small fw-bold mb-1 text-muted">Sección</label>
          <select id="swal-secc" class="swal2-input input-moderno m-0 w-100">${optSecc}</select>
        </div>
      </div>
      
      <div class="border-top mt-4 pt-3">
        <h6 class="fw-bold mb-3 text-secondary"><i class="bi bi-person-video3 me-2"></i>Docente(s) Guía Responsable(s)</h6>
        
        <div class="mb-2">
          <label class="small fw-bold mb-1 text-muted">Docente Guía 1 (Principal)</label>
          <select id="swal-docente-1" class="swal2-input input-moderno m-0 w-100">${optDocentes}</select>
        </div>
        
        <div class="mb-2">
          <label class="small fw-bold mb-1 text-muted">Docente Guía 2 (Opcional)</label>
          <select id="swal-docente-2" class="swal2-input input-moderno m-0 w-100">${optDocentes}</select>
        </div>
        
        <div class="mb-2">
          <label class="small fw-bold mb-1 text-muted">Docente Guía 3 (Opcional)</label>
          <select id="swal-docente-3" class="swal2-input input-moderno m-0 w-100">${optDocentes}</select>
        </div>
      </div>
      
      <div class="alert alert-info mt-3 small"><i class="bi bi-info-circle me-1"></i>El sistema unirá el Grado y la Sección para crear el Nombre Oficial del Salón automáticamente.</div>
    </div>`;

    Swal.fire({
      title: 'Aperturar Salón',
      html: htmlForm,
      showCancelButton: true,
      confirmButtonText: 'Aperturar',
      confirmButtonColor: '#00BCD4',
      didOpen: () => {
        const selectEsp = document.getElementById('swal-espacio') as HTMLSelectElement;
        const inputEscNom = document.getElementById('swal-escuela-nombre') as HTMLInputElement;
        const inputEsc = document.getElementById('swal-escuela') as HTMLInputElement;
        const inputCap = document.getElementById('swal-capacidad') as HTMLInputElement;

        const updateDocenteDropdowns = (schoolCode: string) => {
          let filteredDocentes = docentes.filter(d => d.id_escuela === schoolCode);
          if (schoolCode === 'lb') {
            filteredDocentes = filteredDocentes.filter(d => !assignedCedulas.has(d.cedula));
          }

          let optDocs = '<option value="">Sin Asignar</option>';
          filteredDocentes.forEach(d => {
            optDocs += `<option value="${d.cedula}">${d.nombre_completo}</option>`;
          });

          const sel1 = document.getElementById('swal-docente-1') as HTMLSelectElement;
          const sel2 = document.getElementById('swal-docente-2') as HTMLSelectElement;
          const sel3 = document.getElementById('swal-docente-3') as HTMLSelectElement;

          if (sel1) sel1.innerHTML = optDocs;
          if (sel2) sel2.innerHTML = optDocs;
          if (sel3) sel3.innerHTML = optDocs;
        };

        const updateDetails = () => {
          const espId = selectEsp.value;
          if (!espId) {
            inputEscNom.value = '';
            inputEsc.value = '';
            inputCap.value = '';
            updateDocenteDropdowns('');
            return;
          }
          const espObj = espacios.find(e => e.id === espId);
          if (espObj) {
            inputEscNom.value = espObj.id_escuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
            inputEsc.value = espObj.id_escuela;
            inputCap.value = `${espObj.capacidad || 0} pax`;
            updateDocenteDropdowns(espObj.id_escuela);
          }
        };

        selectEsp.addEventListener('change', updateDetails);
        updateDetails();
      },
      preConfirm: () => {
        const esc = (document.getElementById('swal-escuela') as HTMLInputElement).value;
        const niv = (document.getElementById('swal-nivel') as HTMLSelectElement).value;
        const gra = (document.getElementById('swal-grado') as HTMLSelectElement).value;
        const sec = (document.getElementById('swal-secc') as HTMLSelectElement).value;
        const esp = (document.getElementById('swal-espacio') as HTMLSelectElement).value;
        
        const doc1 = (document.getElementById('swal-docente-1') as HTMLSelectElement).value;
        const doc2 = (document.getElementById('swal-docente-2') as HTMLSelectElement).value;
        const doc3 = (document.getElementById('swal-docente-3') as HTMLSelectElement).value;

        if (!esc || !niv || !gra || !sec || !esp) {
          Swal.showValidationMessage('Todos los campos son obligatorios');
          return false;
        }
        
        // Double check creation privileges for target school
        const rowCanCrear = esc === 'sb' ? canCrearSalonesSB : canCrearSalonesLB;
        if (!rowCanCrear) {
          Swal.showValidationMessage('No tiene permisos de creación para esta escuela');
          return false;
        }

        const docs = [doc1, doc2, doc3].filter(d => d);
        const uniques = new Set(docs);
        if (uniques.size !== docs.length) {
          Swal.showValidationMessage('No puedes asignar el mismo docente guía más de una vez');
          return false;
        }
        
        return { escuela: esc, nivel: niv, grado: gra, seccion: sec, id_espacio: esp, docentes_guias: docs };
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        const datosSalon = result.value;
        const codEsc = datosSalon.escuela;

        setLoading(true);
        try {
          // Check duplicates
          const { data: existen } = await supabase
            .from('salones')
            .select('id_salon')
            .eq('nivel_educativo', datosSalon.nivel)
            .eq('grado_anio', datosSalon.grado)
            .eq('seccion', datosSalon.seccion)
            .eq('id_escuela', codEsc);

          if (existen && existen.length > 0) {
            setLoading(false);
            Swal.fire('Atención', 'Ese salón ya se encuentra aperturado.', 'warning');
            return;
          }

          const nombreSal = `${datosSalon.grado} ${datosSalon.seccion}`;
          const payload = {
            id_salon: "SAL-" + new Date().getTime(),
            id_escuela: codEsc,
            nivel_educativo: datosSalon.nivel,
            grado_anio: datosSalon.grado,
            seccion: datosSalon.seccion,
            nombre_salon: nombreSal,
            id_espacio: datosSalon.id_espacio,
            estatus: 'Activo',
            docentes_guias: datosSalon.docentes_guias
          };

          const { error } = await supabase.from('salones').insert([payload]);
          if (error) throw error;

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Salón Aperturado',
            showConfirmButton: false,
            timer: 2000
          });

          auditar('Control de Estudios', 'Aperturar Salón', `Se aperturó el salón académico: ${nombreSal}`);
          cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla al guardar el salón.', 'error');
          setLoading(false);
        }
      }
    });
  };

  const editarSalon = (id_salon: string) => {
    const salon = salones.find(s => s.id_salon === id_salon);
    if (!salon) return;

    // Check specific school creation/modifying privileges
    const rowCanCrear = salon.id_escuela === 'sb' ? canCrearSalonesSB : canCrearSalonesLB;
    if (!rowCanCrear) {
      if (Swal) Swal.fire('Acceso Denegado', 'No posee permisos de edición para la escuela de este salón.', 'error');
      return;
    }

    let optNiveles = '<option value="">Seleccione Nivel...</option>';
    niveles.forEach(n => {
      const sel = (n.valor === salon.nivel_educativo) ? 'selected' : '';
      optNiveles += `<option value="${n.valor}" ${sel}>${n.valor}</option>`;
    });

    let optGrados = '<option value="">Seleccione Grado...</option>';
    grados.forEach(g => {
      const sel = (g.valor === salon.grado_anio) ? 'selected' : '';
      optGrados += `<option value="${g.valor}" ${sel}>${g.valor}</option>`;
    });

    let optSecc = '<option value="">Seleccione Sección...</option>';
    secciones.forEach(s => {
      const sel = (s.valor === salon.seccion) ? 'selected' : '';
      optSecc += `<option value="${s.valor}" ${sel}>${s.valor}</option>`;
    });

    const filtrados = espacios.filter(e => e.id_escuela === salon.id_escuela);
    let optEspacios = '<option value="">Seleccione Espacio...</option>';
    filtrados.forEach(e => {
      const sel = (e.id === salon.id_espacio) ? 'selected' : '';
      optEspacios += `<option value="${e.id}" ${sel}>${e.nombre}</option>`;
    });

    const espacioActual = espacios.find(e => e.id === salon.id_espacio);
    const capInicial = espacioActual ? `${espacioActual.capacidad || 0} pax` : '-- pax';
    const nombreEscuelaStr = salon.id_escuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';

    const assignedCedulas = new Set<string>();
    salones.forEach(s => {
      if (s.id_salon !== salon.id_salon && s.docentes_guias) {
        s.docentes_guias.forEach(c => {
          if (c) assignedCedulas.add(c);
        });
      }
    });

    const getDocenteOptions = (idx: number) => {
      const asignado = salon.docentes_guias && salon.docentes_guias[idx] ? salon.docentes_guias[idx] : '';
      let opts = '<option value="">Sin Asignar</option>';
      
      const filteredDocentes = docentes.filter(d => {
        if (d.id_escuela !== salon.id_escuela) return false;
        if (salon.id_escuela === 'lb') {
          if (assignedCedulas.has(d.cedula) && d.cedula !== asignado) {
            return false;
          }
        }
        return true;
      });

      filteredDocentes.forEach(d => {
        const sel = d.cedula === asignado ? 'selected' : '';
        opts += `<option value="${d.cedula}" ${sel}>${d.nombre_completo}</option>`;
      });
      return opts;
    };

    const htmlForm = `
    <div class="text-start">
      <label class="small fw-bold mb-1 text-muted"><i class="bi bi-geo-alt-fill text-danger me-1"></i>Espacio Físico (Ambiente)</label>
      <select id="swal-espacio-ed" class="swal2-input input-moderno m-0 mb-3 w-100">${optEspacios}</select>

      <div class="row g-3 mb-3">
        <div class="col-8">
          <label class="small fw-bold mb-1 text-muted"><i class="bi bi-building text-primary me-1"></i>Escuela</label>
          <input type="text" class="form-control input-moderno mb-0 w-100" readonly disabled value="${nombreEscuelaStr}">
        </div>
        <div class="col-4">
          <label class="small fw-bold mb-1 text-muted"><i class="bi bi-people-fill text-info me-1"></i>Capacidad</label>
          <input type="text" id="swal-capacidad-ed" class="form-control input-moderno mb-0 w-100" readonly disabled value="${capInicial}">
        </div>
      </div>

      <label class="small fw-bold mb-1 text-muted">Nivel Educativo</label>
      <select id="swal-nivel-ed" class="swal2-input input-moderno m-0 mb-3 w-100">${optNiveles}</select>

      <div class="row g-3 mb-3">
        <div class="col-8">
          <label class="small fw-bold mb-1 text-muted">Grado / Año</label>
          <select id="swal-grado-ed" class="swal2-input input-moderno m-0 w-100">${optGrados}</select>
        </div>
        <div class="col-4">
          <label class="small fw-bold mb-1 text-muted">Sección</label>
          <select id="swal-secc-ed" class="swal2-input input-moderno m-0 w-100">${optSecc}</select>
        </div>
      </div>

      <div class="border-top mt-4 pt-3">
        <h6 class="fw-bold mb-3 text-secondary"><i class="bi bi-person-video3 me-2"></i>Docente(s) Guía Responsable(s)</h6>
        
        <div class="mb-2">
          <label class="small fw-bold mb-1 text-muted">Docente Guía 1 (Principal)</label>
          <select id="swal-docente-1-ed" class="swal2-input input-moderno m-0 w-100">${getDocenteOptions(0)}</select>
        </div>
        
        <div class="mb-2">
          <label class="small fw-bold mb-1 text-muted">Docente Guía 2 (Opcional)</label>
          <select id="swal-docente-2-ed" class="swal2-input input-moderno m-0 w-100">${getDocenteOptions(1)}</select>
        </div>
        
        <div class="mb-2">
          <label class="small fw-bold mb-1 text-muted">Docente Guía 3 (Opcional)</label>
          <select id="swal-docente-3-ed" class="swal2-input input-moderno m-0 w-100">${getDocenteOptions(2)}</select>
        </div>
      </div>

      <div class="alert alert-warning mt-3 small"><i class="bi bi-exclamation-triangle me-1"></i>Modificar el grado, sección o espacio físico alterará el nombre oficial y la capacidad del salón.</div>
    </div>`;

    Swal.fire({
      title: 'Editar Salón',
      html: htmlForm,
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      confirmButtonColor: '#00BCD4',
      didOpen: () => {
        const selectEsp = document.getElementById('swal-espacio-ed') as HTMLSelectElement;
        const inputCap = document.getElementById('swal-capacidad-ed') as HTMLInputElement;

        selectEsp.addEventListener('change', () => {
          const espId = selectEsp.value;
          if (!espId) {
            inputCap.value = '-- pax';
            return;
          }
          const espObj = espacios.find(e => e.id === espId);
          inputCap.value = espObj ? `${espObj.capacidad || 0} pax` : '-- pax';
        });
      },
      preConfirm: () => {
        const niv = (document.getElementById('swal-nivel-ed') as HTMLSelectElement).value;
        const gra = (document.getElementById('swal-grado-ed') as HTMLSelectElement).value;
        const sec = (document.getElementById('swal-secc-ed') as HTMLSelectElement).value;
        const esp = (document.getElementById('swal-espacio-ed') as HTMLSelectElement).value;
        
        const doc1 = (document.getElementById('swal-docente-1-ed') as HTMLSelectElement).value;
        const doc2 = (document.getElementById('swal-docente-2-ed') as HTMLSelectElement).value;
        const doc3 = (document.getElementById('swal-docente-3-ed') as HTMLSelectElement).value;

        if (!niv || !gra || !sec || !esp) {
          Swal.showValidationMessage('Todos los campos son obligatorios');
          return false;
        }

        const docs = [doc1, doc2, doc3].filter(d => d);
        const uniques = new Set(docs);
        if (uniques.size !== docs.length) {
          Swal.showValidationMessage('No puedes asignar el mismo docente guía más de una vez');
          return false;
        }

        return { nivel: niv, grado: gra, seccion: sec, id_espacio: esp, docentes_guias: docs };
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        const datosEd = result.value;
        const codEsc = salon.id_escuela;

        setLoading(true);
        try {
          // Check duplicates excluding current id_salon
          const { data: existen } = await supabase
            .from('salones')
            .select('id_salon')
            .eq('nivel_educativo', datosEd.nivel)
            .eq('grado_anio', datosEd.grado)
            .eq('seccion', datosEd.seccion)
            .eq('id_escuela', codEsc)
            .neq('id_salon', id_salon);

          if (existen && existen.length > 0) {
            setLoading(false);
            Swal.fire('Atención', 'Ya existe otro salón aperturado con esa misma estructura.', 'warning');
            return;
          }

          const nombreSal = `${datosEd.grado} ${datosEd.seccion}`;
          const payload = {
            nivel_educativo: datosEd.nivel,
            grado_anio: datosEd.grado,
            seccion: datosEd.seccion,
            nombre_salon: nombreSal,
            id_espacio: datosEd.id_espacio,
            docentes_guias: datosEd.docentes_guias
          };

          const { error } = await supabase.from('salones').update(payload).eq('id_salon', id_salon);
          if (error) throw error;

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Salón Actualizado',
            showConfirmButton: false,
            timer: 2000
          });

          auditar('Control de Estudios', 'Editar Salón', `Se actualizó el salón académico a: ${nombreSal}`);
          cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla al actualizar en base de datos.', 'error');
          setLoading(false);
        }
      }
    });
  };

  const eliminarSalon = (id_salon: string, nombre_salon: string) => {
    const salon = salones.find(s => s.id_salon === id_salon);
    if (!salon) return;

    // Check specific school deletion privileges
    const rowCanEliminar = salon.id_escuela === 'sb' ? canEliminarSalonesSB : canEliminarSalonesLB;
    if (!rowCanEliminar) {
      if (Swal) Swal.fire('Acceso Denegado', 'No posee permisos para clausurar salones en esta escuela.', 'error');
      return;
    }

    if (!Swal) return;

    Swal.fire({
      title: '¿Clausurar Salón?',
      text: `Estás a punto de cerrar el salón: ${nombre_salon}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, clausurar',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase.from('salones').delete().eq('id_salon', id_salon);
          if (error) throw error;

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Clausurado correctamente',
            showConfirmButton: false,
            timer: 1500
          });

          auditar('Control de Estudios', 'Clausurar Salón', `Se clausuró el salón: ${nombre_salon}`);
          cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla al clausurar el salón.', 'error');
          setLoading(false);
        }
      }
    });
  };

  // Filter & sort opened classrooms
  const salonesFiltrados = salones
    .filter(s => escuelaFiltro === 'todas' || s.id_escuela === escuelaFiltro)
    .sort((a: any, b: any) => {
      const valA = (a[criterioOrden] || '').toLowerCase();
      const valB = (b[criterioOrden] || '').toLowerCase();
      if (valA < valB) return -1;
      if (valA > valB) return 1;
      return 0;
    });

  if (permLoading) {
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
        <p className="text-muted mb-0">No tienes permisos asignados para configurar grados o salones.</p>
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
            style={{ background: 'linear-gradient(135deg, #00BCD4 0%, #00838F 100%)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
          >
            <div className="burbuja-3d burbuja-1" style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.12)', position: 'absolute', top: '-50px', right: '-20px', borderRadius: '50%' }}></div>
            <div className="burbuja-3d burbuja-2" style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.06)', position: 'absolute', bottom: '-20px', left: '20px', borderRadius: '50%' }}></div>
            <div className="row align-items-center position-relative z-1">
              <div className="col-12 text-center text-md-start">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <span className="badge bg-white text-info px-3 py-2 shadow-sm fw-bold" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>
                    <i className="bi bi-folder-check me-1"></i> CONTROL DE ESTUDIOS
                  </span>
                  <button 
                    onClick={() => navigate('/categoria/Control%20de%20Estudios')} 
                    className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                  >
                    <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
                  </button>
                </div>
                <h1 className="fw-bolder mb-2 text-white" style={{ fontSize: '2.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  <i className="bi bi-folder-check me-3"></i>Grados y Salones
                </h1>
                <p className="mb-0 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Estructura académica y apertura de secciones.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="row g-4 mb-4 animate__animated animate__fadeIn" id="nav-salones">
        {pGrupos && (
          <div className="col-12 col-md-4" id="col-nav-grados">
            <div 
              className={`card border-0 shadow-sm rounded-4 h-100 card-btn-nav text-center p-3 cursor-pointer ${activeTab === 'grados' ? 'activo' : ''}`} 
              onClick={() => setActiveTab('grados')}
              style={{ cursor: 'pointer' }}
            >
              <div className="icono-box bg-info bg-opacity-10 text-info mx-auto mb-3" style={{ width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}><i className="bi bi-layers-fill"></i></div>
              <h5 className="fw-bold text-dark mb-1">Grupos y Grados</h5>
              <small className="text-muted">Crear años o niveles de estudio.</small>
            </div>
          </div>
        )}

        {pSecc && (
          <div className="col-12 col-md-4" id="col-nav-secciones">
            <div 
              className={`card border-0 shadow-sm rounded-4 h-100 card-btn-nav text-center p-3 cursor-pointer ${activeTab === 'secciones' ? 'activo' : ''}`} 
              onClick={() => setActiveTab('secciones')}
              style={{ cursor: 'pointer' }}
            >
              <div className="icono-box bg-info bg-opacity-10 text-info mx-auto mb-3" style={{ width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}><i className="bi bi-alphabet"></i></div>
              <h5 className="fw-bold text-dark mb-1">Secciones</h5>
              <small className="text-muted">Definir identificadores (A, B, U...).</small>
            </div>
          </div>
        )}

        {pSalones && (
          <div className="col-12 col-md-4" id="col-nav-apertura">
            <div 
              className={`card border-0 shadow-sm rounded-4 h-100 card-btn-nav text-center p-3 cursor-pointer ${activeTab === 'salones' ? 'activo' : ''}`} 
              onClick={() => setActiveTab('salones')}
              style={{ cursor: 'pointer' }}
            >
              <div className="icono-box bg-info bg-opacity-10 text-info mx-auto mb-3" style={{ width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}><i className="bi bi-door-open-fill"></i></div>
              <h5 className="fw-bold text-dark mb-1">Apertura de Salones</h5>
              <small className="text-muted">Vincular grados y secciones.</small>
            </div>
          </div>
        )}
      </div>

      {/* Tab Panels */}
      <div className="row animate__animated animate__fadeInUp" id="contenedor-vistas">
        
        {/* GRADOS TAB */}
        {activeTab === 'grados' && pGrupos && (
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden" style={{ borderTop: '5px solid #00BCD4 !important' }}>
              <div className="alert alert-warning m-0 rounded-0 border-0 border-bottom text-dark" style={{ backgroundColor: '#fffbeb' }}>
                <i className="bi bi-exclamation-triangle-fill text-warning me-2 fs-5 align-middle"></i>
                <span className="small"><b>IMPORTANTE:</b> El orden de esta lista define la escalera lógica para la <b>Promoción Escolar Masiva</b>. Utilice las flechas para ordenar jerárquicamente desde el menor grado (arriba) hasta el año de egreso (abajo).</span>
              </div>
              <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-layers text-info me-2"></i>Catálogo de Grados / Años</h5>
                {canCrearGrados && (
                  <button 
                    className="btn btn-sm btn-info text-white fw-bold shadow-sm hover-efecto" 
                    onClick={() => nuevoParametro('grado', 'Ej: 1er Año / 2do Grado')}
                  >
                    <i className="bi bi-plus-lg me-1"></i>Nuevo Grado
                  </button>
                )}
              </div>
              <div className="card-body p-0">
                {loading && grados.length === 0 ? (
                  <div className="d-flex justify-content-center align-items-center py-5">
                    <div className="spinner-border text-info" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                  </div>
                ) : grados.length === 0 ? (
                  <div className="p-4 text-center text-muted">
                    <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                    <span className="small fw-bold">Lista vacía</span>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {grados.map((g, index) => (
                      <div key={g.id_parametro} className="list-group-item p-3 border-0 border-bottom d-flex justify-content-between align-items-center hover-efecto">
                        <div className="fw-bold text-dark d-flex align-items-center">
                          <i className="bi bi-check2-circle text-info me-2"></i>{g.valor}
                        </div>
                        <div className="text-end d-flex align-items-center text-nowrap">
                          {canCrearGrados && (
                            <>
                              <span className="badge bg-light text-dark border me-3"><i className="bi bi-list-ol text-info me-1"></i> Orden: {index + 1}</span>
                              {index > 0 ? (
                                <button className="btn btn-sm btn-secondary text-white rounded-circle shadow-sm hover-efecto me-1" onClick={() => moverGrado(g.id_parametro, -1)} title="Subir Nivel"><i className="bi bi-arrow-up-short"></i></button>
                              ) : (
                                <div style={{ width: '28px' }} className="me-1 d-inline-block"></div>
                              )}
                              {index < grados.length - 1 ? (
                                <button className="btn btn-sm btn-secondary text-white rounded-circle shadow-sm hover-efecto me-2" onClick={() => moverGrado(g.id_parametro, 1)} title="Bajar Nivel"><i className="bi bi-arrow-down-short"></i></button>
                              ) : (
                                <div style={{ width: '28px' }} className="me-2 d-inline-block"></div>
                              )}
                              <button className="btn btn-sm btn-light text-primary border rounded-circle shadow-sm hover-efecto me-1" onClick={() => editarParametro(g.id_parametro, 'conf_grados', g.valor, 'Tarjeta: Configurar Grados')} title="Editar"><i className="bi bi-pencil-fill"></i></button>
                            </>
                          )}
                          {canEliminarGrados && (
                            <button className="btn btn-sm btn-light text-danger border rounded-circle shadow-sm hover-efecto" onClick={() => eliminarParametro(g.id_parametro, 'conf_grados', g.valor)} title="Eliminar"><i className="bi bi-trash3-fill"></i></button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECCIONES TAB */}
        {activeTab === 'secciones' && pSecc && (
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden" style={{ borderTop: '5px solid #00ACC1 !important' }}>
              <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center rounded-top-4">
                <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-alphabet text-info me-2"></i>Identificadores de Sección</h5>
                {canCrearSecciones && (
                  <button 
                    className="btn btn-sm btn-info text-white fw-bold shadow-sm hover-efecto" 
                    onClick={() => nuevoParametro('seccion', 'Ej: A, B, U')}
                  >
                    <i className="bi bi-plus-lg me-1"></i>Nueva Sección
                  </button>
                )}
              </div>
              <div className="card-body p-0">
                {loading && secciones.length === 0 ? (
                  <div className="d-flex justify-content-center align-items-center py-5">
                    <div className="spinner-border text-info" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                  </div>
                ) : secciones.length === 0 ? (
                  <div className="p-4 text-center text-muted">
                    <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                    <span className="small fw-bold">Lista vacía</span>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {secciones.map(s => (
                      <div key={s.id_parametro} className="list-group-item p-3 border-0 border-bottom d-flex justify-content-between align-items-center hover-efecto">
                        <div className="fw-bold text-dark d-flex align-items-center">
                          <i className="bi bi-check2-circle text-info me-2"></i>{s.valor}
                        </div>
                        <div className="text-end d-flex align-items-center text-nowrap">
                          {canCrearSecciones && (
                            <button className="btn btn-sm btn-light text-primary border rounded-circle shadow-sm hover-efecto me-1" onClick={() => editarParametro(s.id_parametro, 'conf_secciones', s.valor, 'Tarjeta: Configurar Secciones')} title="Editar"><i className="bi bi-pencil-fill"></i></button>
                          )}
                          {canEliminarSecciones && (
                            <button className="btn btn-sm btn-light text-danger border rounded-circle shadow-sm hover-efecto" onClick={() => eliminarParametro(s.id_parametro, 'conf_secciones', s.valor)} title="Eliminar"><i className="bi bi-trash3-fill"></i></button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SALONES TAB */}
        {activeTab === 'salones' && pSalones && (
          <div className="col-12">
            {/* Resumen Cards */}
            <div className="row g-4 mb-4">
              {escuelasAutorizadasSalones.map(codigo => {
                const nombreEscuelaStr = codigo === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
                const salonesEsc = salones.filter(s => s.id_escuela === codigo);
                const total = salonesEsc.length;
                const inicial = salonesEsc.filter(s => (s.nivel_educativo || '').toLowerCase().includes('inicial')).length;
                const primMedia = salonesEsc.filter(s => 
                  (s.nivel_educativo || '').toLowerCase().includes('primaria') || 
                  (s.nivel_educativo || '').toLowerCase().includes('media') || 
                  (s.nivel_educativo || '').toLowerCase().includes('bachillerato')
                ).length;

                const color = codigo === 'lb' ? '#EF4444' : '#0066FF';
                const colorGradient = codigo === 'lb' ? 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)' : 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)';
                const iconEsc = codigo === 'lb' ? 'bi-bank' : 'bi-mortarboard-fill';

                return (
                  <div key={codigo} className="col-12 col-md-6">
                    <div 
                      className="card border-0 shadow-sm rounded-4 p-4 h-100 position-relative overflow-hidden hover-efecto"
                      style={{ background: colorGradient, borderLeft: `5px solid ${color}` }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <span className="badge bg-opacity-10 text-uppercase fw-bold px-2 py-1 mb-1" style={{ background: `${color}22`, color: color, fontSize: '0.7rem' }}>Código: {codigo.toUpperCase()}</span>
                          <h5 className="fw-bold text-dark mb-1 text-truncate" style={{ maxWidth: '280px' }}>{nombreEscuelaStr}</h5>
                        </div>
                        <div 
                          className="text-white shadow-sm" 
                          style={{ background: color, width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}
                        >
                          <i className={`bi ${iconEsc}`}></i>
                        </div>
                      </div>
                      
                      <div className="row g-2 text-center mt-3">
                        <div className="col-4">
                          <div className="p-2 bg-white rounded-3 shadow-sm border border-light">
                            <div className="fs-4 fw-bold" style={{ color: color }}>{total}</div>
                            <div className="text-muted fw-semibold" style={{ fontSize: '0.65rem' }}>SALONES</div>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="p-2 bg-white rounded-3 shadow-sm border border-light">
                            <div className="fs-4 fw-bold text-success">{inicial}</div>
                            <div className="text-muted fw-semibold" style={{ fontSize: '0.65rem' }}>INICIAL</div>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="p-2 bg-white rounded-3 shadow-sm border border-light">
                            <div className="fs-4 fw-bold text-warning">{primMedia}</div>
                            <div className="text-muted fw-semibold" style={{ fontSize: '0.65rem' }}>PRIM/MEDIA</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-2 text-end">
                        <button 
                          className="btn btn-sm rounded-pill px-3 fw-bold text-white hover-efecto shadow-sm" 
                          style={{ background: color, fontSize: '0.75rem' }}
                          onClick={() => setEscuelaFiltro(codigo)}
                        >
                          <i className="bi bi-funnel-fill me-1"></i> Ver Salones
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Filter Pills */}
            <div className="d-flex justify-content-start align-items-center mb-3 flex-wrap gap-2">
              {escuelasAutorizadasSalones.length > 1 && (
                <button 
                  className={`btn rounded-pill px-3 py-2 fw-bold me-2 mb-2 border-0 ${escuelaFiltro === 'todas' ? 'bg-info text-white shadow-sm' : 'text-secondary bg-light'}`}
                  style={{ fontSize: '0.85rem' }}
                  onClick={() => setEscuelaFiltro('todas')}
                >
                  <i className="bi bi-globe2 me-1"></i> Todas las Escuelas
                </button>
              )}

              {escuelasAutorizadasSalones.map(codigo => {
                const nombreEscuelaStr = codigo === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
                const count = salones.filter(s => s.id_escuela === codigo).length;
                return (
                  <button 
                    key={codigo}
                    className={`btn rounded-pill px-3 py-2 fw-bold me-2 mb-2 border-0 ${escuelaFiltro === codigo ? 'bg-info text-white shadow-sm' : 'text-secondary bg-light'}`}
                    style={{ fontSize: '0.85rem' }}
                    onClick={() => setEscuelaFiltro(codigo)}
                  >
                    <i className="bi bi-building me-1"></i> {nombreEscuelaStr}
                    <span className="badge bg-white text-dark ms-1 rounded-circle shadow-sm" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Table ofOpened Classrooms */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden animate__animated animate__fadeInUp" style={{ borderTop: '5px solid #00838F !important' }}>
              <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center flex-wrap gap-3 rounded-top-4">
                <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-door-open text-info me-2"></i>Salones Aperturados</h5>
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <div className="input-group input-group-sm shadow-sm" style={{ width: 'auto' }}>
                    <span className="input-group-text bg-light border-info"><i className="bi bi-sort-down"></i></span>
                    <select 
                      id="filtro-salones" 
                      className="form-select border-info fw-bold text-dark" 
                      style={{ minWidth: '160px' }}
                      value={criterioOrden}
                      onChange={(e) => setCriterioOrden(e.target.value)}
                    >
                      <option value="nombre_salon">Ordenar por Nombre</option>
                      <option value="nivel_educativo">Ordenar por Nivel</option>
                      <option value="grado_anio">Ordenar por Grado</option>
                      <option value="seccion">Ordenar por Sección</option>
                    </select>
                  </div>
                   {pSalones && (
                    <button className="btn btn-sm btn-outline-info fw-bold shadow-sm hover-efecto me-1" onClick={abrirModalReporte}>
                      <i className="bi bi-file-earmark-pdf-fill me-1"></i>Reporte PDF
                    </button>
                  )}
                  {canCrearSalones && (
                    <button className="btn btn-sm btn-info text-white fw-bold shadow-sm hover-efecto" onClick={abrirModalSalon}>
                      <i className="bi bi-plus-lg me-1"></i>Aperturar Salón
                    </button>
                  )}
                </div>
              </div>
              <div className="card-body p-0">
                {loading && salones.length === 0 ? (
                  <div className="d-flex justify-content-center align-items-center py-5">
                    <div className="spinner-border text-info" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                  </div>
                ) : salonesFiltrados.length === 0 ? (
                  <div className="p-5 text-center text-muted">
                    <i className="bi bi-door-closed fs-1 d-block mb-3"></i>
                    No hay salones aperturados para esta selección.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                       <thead className="bg-light text-muted small">
                        <tr>
                          <th className="ps-4 py-3">Escuela</th>
                          <th className="py-3">Nombre del Salón</th>
                          <th className="py-3">Nivel Educativo</th>
                          <th className="py-3">Grado</th>
                          <th className="py-3">Sección</th>
                          <th className="py-3">Docente(s) Guía</th>
                          <th className="text-end pe-4 py-3">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salonesFiltrados.map(s => {
                          const escuelaNombre = s.id_escuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar';
                          const espacio = espacios.find(e => e.id === s.id_espacio);
                          const espacioStr = espacio ? (
                            <span className="small text-muted fw-normal d-block mt-1">
                              <i className="bi bi-geo-alt-fill text-success me-1"></i>{espacio.nombre}
                              <span className="badge bg-light text-dark border p-1 ms-1" style={{ fontSize: '0.6rem' }}>Cap: {espacio.capacidad || 0} pax</span>
                            </span>
                          ) : (
                            <span className="small text-danger fw-normal d-block mt-1">
                              <i className="bi bi-exclamation-triangle-fill me-1"></i>Sin espacio físico asignado
                            </span>
                          );

                          const rowCanCrear = s.id_escuela === 'sb' ? canCrearSalonesSB : canCrearSalonesLB;
                          const rowCanEliminar = s.id_escuela === 'sb' ? canEliminarSalonesSB : canEliminarSalonesLB;

                          return (
                            <tr key={s.id_salon} className="align-middle hover-efecto">
                              <td className="ps-4">
                                <span className={`badge rounded-pill ${s.id_escuela === 'lb' ? 'bg-danger' : 'bg-primary'} shadow-sm`} style={{ fontSize: '0.7rem' }}>
                                  {escuelaNombre}
                                </span>
                              </td>
                              <td className="fw-bold text-dark text-uppercase">
                                <i className="bi bi-door-open text-secondary me-2"></i>{s.nombre_salon}
                                {espacioStr}
                              </td>
                              <td><span className="badge bg-light text-dark border shadow-sm">{s.nivel_educativo}</span></td>
                              <td className="fw-bold text-secondary">{s.grado_anio}</td>
                              <td>
                                <span className="badge bg-info rounded-circle shadow-sm d-flex align-items-center justify-content-center text-white" style={{ width: '30px', height: '30px', fontSize: '14px' }}>
                                  {s.seccion}
                                </span>
                              </td>
                              <td>
                                {s.docentes_guias && s.docentes_guias.length > 0 ? (
                                  <div className="d-flex flex-column gap-1">
                                    {s.docentes_guias.map((cedula, i) => {
                                      const docObj = docentes.find(d => d.cedula === cedula);
                                      const nombre = docObj ? docObj.nombre_completo : `C.I. ${cedula}`;
                                      const esPrincipal = i === 0;
                                      return (
                                        <span key={cedula} className={`badge ${esPrincipal ? 'bg-info bg-opacity-10 text-info border border-info-subtle' : 'bg-light text-secondary border'} px-2 py-1 text-start fw-semibold`} style={{ fontSize: '0.75rem', width: 'fit-content' }}>
                                          <i className={`bi ${esPrincipal ? 'bi-person-badge-fill text-info' : 'bi-person-badge-fill text-info'/* Wait, maybe bi-person-fill for auxiliary and bi-person-badge-fill for principal */} me-1`}></i>
                                          {nombre}
                                        </span>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-muted small italic"><i className="bi bi-person-x me-1"></i>Sin asignar</span>
                                )}
                              </td>
                              <td className="text-end pe-4 text-nowrap">
                                {rowCanCrear && (
                                  <button className="btn btn-sm btn-light text-primary border shadow-sm hover-efecto me-1" onClick={() => editarSalon(s.id_salon)} title="Editar Salón"><i className="bi bi-pencil-fill"></i></button>
                                )}
                                {rowCanEliminar && (
                                  <button className="btn btn-sm btn-light text-danger border shadow-sm hover-efecto" onClick={() => eliminarSalon(s.id_salon, s.nombre_salon)} title="Clausurar Salón"><i className="bi bi-trash3-fill"></i></button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
