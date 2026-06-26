import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';
import { formatPhoneNumber } from '../../lib/formatters';


interface Miembro {
  cedula: string;
  nombre_completo: string;
  tipo: 'Docente' | 'Estudiante' | 'Representante';
  rol: string;
  telefono?: string;
  email?: string;
  agregado_el: string;
}

interface ActividadPlanificada {
  id_actividad: string;
  actividad: string;
  fecha_objetivo: string;
  objetivos: string;
  ente_vinculado?: string;
  estatus_ejecucion: 'Planificado' | 'En Progreso' | 'Ejecutado' | 'Suspendido';
  estatus_aprobacion: 'Pendiente' | 'Aprobado' | 'Rechazado';
  observaciones?: string;
}

interface ReporteGestion {
  id_reporte: string;
  titulo: string;
  fecha_reporte: string;
  descripcion: string;
  avances_logrados?: string;
  dificultades?: string;
  soporte_url?: string;
}

interface ColectivoItem {
  id_colectivo: string;
  nombre_colectivo: string;
  descripcion: string;
  id_escuela: string;
  vocero_cedula: string;
  vocero_nombre: string;
  integrantes: Miembro[];
  planificacion_anual: ActividadPlanificada[];
  reportes_gestion: ReporteGestion[];
  creado_en?: string;
}

interface DocenteItem {
  cedula: string;
  nombre_completo: string;
  id_escuela: string;
  telefono?: string;
  email?: string;
}

export const GestionColectivos = () => {
  const navigate = useNavigate();
  const { tienePermisoEnEscuela, loading: permLoading } = usePermisos();
  const Swal = (window as any).Swal;

  // Permisos por escuela (independientes)
  const hasSbVer   = tienePermisoEnEscuela('sb', 'Gestión de Colectivos', 'ver');
  const hasLbVer   = tienePermisoEnEscuela('lb', 'Gestión de Colectivos', 'ver');
  const hasSbCrear = tienePermisoEnEscuela('sb', 'Gestión de Colectivos', 'crear');
  const hasLbCrear = tienePermisoEnEscuela('lb', 'Gestión de Colectivos', 'crear');
  const hasSbDel   = tienePermisoEnEscuela('sb', 'Gestión de Colectivos', 'eliminar');
  const hasLbDel   = tienePermisoEnEscuela('lb', 'Gestión de Colectivos', 'eliminar');

  // El módulo está disponible si tiene acceso a AL MENOS UNA escuela
  const canVerModulo = hasSbVer || hasLbVer;
  // Acceso a ambas escuelas simultáneamente
  const isDualAccess = hasSbVer && hasLbVer;

  // Escuela activa guardada en localStorage (para usuarios con doble acceso)
  const activeSchoolCode = localStorage.getItem('sigae_escuela_codigo') || 'sb';

  // Determinar la escuela inicial correcta según los permisos disponibles
  const getEscuelaInicial = () => {
    if (isDualAccess) return activeSchoolCode;
    if (hasSbVer)    return 'sb';
    if (hasLbVer)    return 'lb';
    return 'sb'; // fallback (el módulo quedará restringido)
  };

  const [escuelaSeleccionada, setEscuelaSeleccionada] = useState<string>(getEscuelaInicial);

  // States
  const [colectivos, setColectivos] = useState<ColectivoItem[]>([]);
  const [docentes,   setDocentes]   = useState<DocenteItem[]>([]);
  const [loading,    setLoading]    = useState(true);

  // Filtering / Search
  const [searchQuery, setSearchQuery] = useState('');

  // Selected collective for detail modals
  const [selectedColectivo, setSelectedColectivo] = useState<ColectivoItem | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<'miembros' | 'planificacion' | 'reportes'>('miembros');

  // Permisos de escritura para la escuela actualmente seleccionada
  const canCrear   = escuelaSeleccionada === 'sb' ? hasSbCrear : hasLbCrear;
  const canEliminar = escuelaSeleccionada === 'sb' ? hasSbDel   : hasLbDel;

  // El módulo está restringido solo si no tiene acceso a ninguna de las dos escuelas
  const isModuleRestricted = !permLoading && !canVerModulo;

  // Guard para evitar llamadas concurrentes a la BD
  const isFetchingRef = useRef(false);

  // Efecto único: espera permisos, corrige la escuela si es necesario, y carga datos
  useEffect(() => {
    if (permLoading) return;
    if (!canVerModulo) return; // Sin acceso a ninguna escuela

    // Si la escuela seleccionada ya no está permitida (p.ej. se bloqueó), redirigir a la permitida
    const escuelaPermitida =
      (escuelaSeleccionada === 'sb' && hasSbVer) ||
      (escuelaSeleccionada === 'lb' && hasLbVer);

    if (!escuelaPermitida) {
      // Cambiar a la primera escuela disponible — el cambio de estado volverá a disparar este efecto
      setEscuelaSeleccionada(hasSbVer ? 'sb' : 'lb');
      return;
    }

    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permLoading, escuelaSeleccionada]);

  const cargarDatos = async (silencioso = false) => {
    if (isFetchingRef.current) return; // Bloquear llamadas concurrentes
    isFetchingRef.current = true;
    if (!silencioso) setLoading(true);
    try {
      // Leer la escuela directamente del estado actual para evitar closures desactualizadas
      const escuela = escuelaSeleccionada;

      // Fetch active teachers
      const { data: docData, error: docErr } = await supabase
        .from('usuarios')
        .select('cedula, nombre_completo, id_escuela, telefono, email')
        .eq('rol', 'Docente')
        .eq('estado', 'Activo')
        .eq('id_escuela', escuela)
        .order('nombre_completo', { ascending: true });

      if (docErr) throw docErr;
      setDocentes(docData || []);

      // Fetch collectives
      const { data: colData, error: colErr } = await supabase
        .from('colectivos')
        .select('*')
        .eq('id_escuela', escuela)
        .order('nombre_colectivo', { ascending: true });

      if (colErr) throw colErr;

      const parsedColectivos = (colData || []).map((c: any) => ({
        ...c,
        integrantes: Array.isArray(c.integrantes) ? c.integrantes : [],
        planificacion_anual: Array.isArray(c.planificacion_anual) ? c.planificacion_anual : [],
        reportes_gestion: Array.isArray(c.reportes_gestion) ? c.reportes_gestion : []
      }));

      setColectivos(parsedColectivos);

      // Sincronizar el colectivo abierto en modal si hay uno seleccionado
      if (selectedColectivo) {
        const matching = parsedColectivos.find(x => x.id_colectivo === selectedColectivo.id_colectivo);
        if (matching) setSelectedColectivo(matching);
      }
    } catch (e: any) {
      console.error(e);
      if (Swal) Swal.fire('Error', 'Falla de conexión al cargar datos del módulo.', 'error');
    } finally {
      // Garantizar que loading siempre se apague, incluso si hubo error
      if (!silencioso) setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Create / Edit Collective
  const abrirModalColectivo = (colectivoEd: ColectivoItem | null = null) => {
    if (!canCrear) {
      Swal.fire('Acceso Denegado', 'No posees permisos de escritura en esta escuela.', 'error');
      return;
    }

    let optDocentes = '<option value="">-- Seleccione Docente --</option>';
    docentes.forEach(d => {
      const isSel = (colectivoEd && colectivoEd.vocero_cedula === d.cedula) ? 'selected' : '';
      optDocentes += `<option value="${d.cedula}" data-nombre="${d.nombre_completo}" ${isSel}>${d.nombre_completo} (C.I: ${d.cedula})</option>`;
    });

    const htmlForm = `
      <div class="text-start">
        <div class="mb-3">
          <label class="small fw-bold mb-1 text-muted"><i class="bi bi-tag-fill text-danger me-1"></i>Nombre del Colectivo</label>
          <input type="text" id="col-nombre" class="form-control input-moderno w-100" placeholder="Ej: Colectivo de Ciencias y Tecnolog\u00eda" value="${colectivoEd ? colectivoEd.nombre_colectivo : ''}">
        </div>

        <div class="mb-3">
          <label class="small fw-bold mb-1 text-muted"><i class="bi bi-card-text text-primary me-1"></i>Descripci\u00f3n / Prop\u00f3sito</label>
          <textarea id="col-descripcion" class="form-control input-moderno w-100" rows="3" placeholder="Escriba las funciones o metas de esta agrupaci\u00f3n...">${colectivoEd ? colectivoEd.descripcion : ''}</textarea>
        </div>

        <div class="border-top pt-3 mt-3">
          <h6 class="fw-bold mb-1 text-secondary"><i class="bi bi-person-check-fill text-success me-2"></i>Vocero(a) Democr\u00e1tico</h6>
          <p class="text-muted small mb-3">El vocero debe ser un docente del plantel. Puede ser reelegido en cualquier momento.</p>
          <div class="mb-2">
            <label class="small fw-bold mb-1 text-muted">Seleccione el Docente Vocero</label>
            <select id="col-vocero-docente" class="swal2-input input-moderno m-0 w-100">${optDocentes}</select>
          </div>
        </div>
      </div>
    `;

    Swal.fire({
      title: colectivoEd ? 'Editar Colectivo' : 'Registrar Colectivo',
      html: htmlForm,
      showCancelButton: true,
      confirmButtonText: colectivoEd ? 'Actualizar' : 'Registrar',
      confirmButtonColor: '#e11d48',
      preConfirm: () => {
        const nombre = (document.getElementById('col-nombre') as HTMLInputElement).value.trim();
        const descripcion = (document.getElementById('col-descripcion') as HTMLTextAreaElement).value.trim();

        if (!nombre) {
          Swal.showValidationMessage('El nombre del colectivo es obligatorio');
          return false;
        }

        const docSelect = document.getElementById('col-vocero-docente') as HTMLSelectElement;
        const voceroCedula = docSelect.value;
        if (!voceroCedula) {
          Swal.showValidationMessage('Debe seleccionar un docente para ejercer la vocería');
          return false;
        }
        const selectedOpt = docSelect.options[docSelect.selectedIndex];
        const voceroNombre = selectedOpt.getAttribute('data-nombre') || '';

        return { nombre, descripcion, voceroCedula, voceroNombre };
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        const data = result.value;
        setLoading(true);
        try {
          // Check duplicates for name
          const duplicate = colectivos.find(c => 
            c.nombre_colectivo.toLowerCase() === data.nombre.toLowerCase() && 
            (!colectivoEd || c.id_colectivo !== colectivoEd.id_colectivo)
          );

          if (duplicate) {
            setLoading(false);
            Swal.fire('Atención', 'Ya existe un colectivo con ese nombre registrado en la escuela.', 'warning');
            return;
          }

          // Build or update members array (integrantes)
          let currentMembers: Miembro[] = colectivoEd ? [...colectivoEd.integrantes] : [];

          // Add or update the spokesperson in members list
          const existingMemberIdx = currentMembers.findIndex(i => i.cedula === data.voceroCedula);
          const docenteVocero = docentes.find(d => d.cedula === data.voceroCedula);
          const newSpokesperson: Miembro = {
            cedula: data.voceroCedula,
            nombre_completo: data.voceroNombre,
            tipo: 'Docente',
            rol: 'Vocero Principal',
            telefono: docenteVocero?.telefono,
            email: docenteVocero?.email,
            agregado_el: colectivoEd && existingMemberIdx >= 0 ? currentMembers[existingMemberIdx].agregado_el : new Date().toISOString()
          };

          // Demote old spokesperson to "Miembro Activo" if spokesperson changed
          if (colectivoEd && colectivoEd.vocero_cedula !== data.voceroCedula) {
            currentMembers = currentMembers.map(m => {
              if (m.cedula === colectivoEd.vocero_cedula) {
                return { ...m, rol: 'Miembro Activo' };
              }
              return m;
            });
          }

          if (existingMemberIdx >= 0) {
            // Replace details of member and promote to spokesperson
            currentMembers[existingMemberIdx] = newSpokesperson;
          } else {
            // Push new spokesperson
            currentMembers.push(newSpokesperson);
          }

          if (colectivoEd) {
            // Update
            const payload = {
              nombre_colectivo: data.nombre,
              descripcion: data.descripcion,
              vocero_cedula: data.voceroCedula,
              vocero_nombre: data.voceroNombre,
              vocero_tipo: 'Docente',
              integrantes: currentMembers
            };

            const { error } = await supabase.from('colectivos').update(payload).eq('id_colectivo', colectivoEd.id_colectivo);
            if (error) throw error;

            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Colectivo Actualizado',
              showConfirmButton: false,
              timer: 2000
            });

            auditar('Organización Escolar', 'Editar Colectivo', `Se editó el colectivo: ${data.nombre} y se reeligió a ${data.voceroNombre} como vocero.`);
          } else {
            // Insert
            const id_colectivo = "COL-" + new Date().getTime();
            const payload: ColectivoItem = {
              id_colectivo,
              nombre_colectivo: data.nombre,
              descripcion: data.descripcion,
              id_escuela: escuelaSeleccionada,
              vocero_cedula: data.voceroCedula,
              vocero_nombre: data.voceroNombre,
              integrantes: currentMembers,
              planificacion_anual: [],
              reportes_gestion: []
            };

            const { error } = await supabase.from('colectivos').insert([payload]);
            if (error) throw error;

            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Colectivo Registrado',
              showConfirmButton: false,
              timer: 2000
            });

            auditar('Organización Escolar', 'Crear Colectivo', `Se creó el colectivo: ${data.nombre} con vocero: ${data.voceroNombre}`);
          }

          cargarDatos(true);
        } catch (e: any) {
          console.error(e);
          Swal.fire('Error', 'No se pudo guardar la información del colectivo.', 'error');
          setLoading(false);
        }
      }
    });
  };

  // Delete Collective
  const eliminarColectivo = (id: string, nombre: string) => {
    if (!canEliminar) {
      Swal.fire('Acceso Denegado', 'No posees privilegios para eliminar colectivos.', 'error');
      return;
    }

    Swal.fire({
      title: '¿Eliminar Colectivo?',
      text: `Esta acción clausurará y eliminará permanentemente la agrupación "${nombre}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase.from('colectivos').delete().eq('id_colectivo', id);
          if (error) throw error;

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Colectivo Eliminado',
            showConfirmButton: false,
            timer: 1500
          });

          auditar('Organización Escolar', 'Eliminar Colectivo', `Se eliminó el colectivo: ${nombre}`);
          cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'Falla al intentar eliminar el colectivo.', 'error');
          setLoading(false);
        }
      }
    });
  };

  // Add Member
  const agregarMiembro = async () => {
    if (!selectedColectivo) return;

    let optDocentes = '<option value="">-- Seleccione Docente --</option>';
    docentes.forEach(d => {
      // Check if already in the collective
      if (!selectedColectivo.integrantes.some(i => i.cedula === d.cedula)) {
        optDocentes += `<option value="${d.cedula}" data-nombre="${d.nombre_completo}">${d.nombre_completo} (C.I: ${d.cedula})</option>`;
      }
    });

    const htmlForm = `
      <div class="text-start">
        <div class="mb-3">
          <label class="small fw-bold mb-1 text-muted">Tipo de Integrante</label>
          <select id="m-tipo" class="swal2-input input-moderno m-0 mb-3 w-100" style="cursor:pointer">
            <option value="Docente">Docente</option>
            <option value="Estudiante">Estudiante</option>
            <option value="Representante">Representante</option>
          </select>
        </div>

        <div class="mb-3">
          <label class="small fw-bold mb-1 text-muted">Rol en la Agrupación</label>
          <input type="text" id="m-rol" class="form-control input-moderno w-100" placeholder="Ej: Secretario, Colaborador, Vocal" value="Miembro Activo">
        </div>

        <!-- Docente dropdown -->
        <div id="wrapper-m-docente" class="mb-3">
          <label class="small fw-bold mb-1 text-muted">Seleccione Docente</label>
          <select id="col-m-docente" class="swal2-input input-moderno m-0 w-100">${optDocentes}</select>
        </div>

        <!-- Externo inputs -->
        <div id="wrapper-m-externo" style="display: none;">
          <div class="row g-2 mb-2">
            <div class="col-6">
              <label class="small fw-bold mb-1 text-muted">Cédula del Miembro</label>
              <input type="text" id="col-m-cedula" class="form-control input-moderno mb-0 w-100" placeholder="Ej: V-25444999">
            </div>
            <div class="col-6">
              <label class="small fw-bold mb-1 text-muted">Nombre Completo</label>
              <input type="text" id="col-m-nombre" class="form-control input-moderno mb-0 w-100" placeholder="Ej: Pedro Infante">
            </div>
          </div>
          <div class="row g-2 mb-2">
            <div class="col-6">
              <label class="small fw-bold mb-1 text-muted">Teléfono</label>
              <input type="text" id="col-m-telefono" class="form-control input-moderno mb-0 w-100" placeholder="Ej: 04245558888">
            </div>
            <div class="col-6">
              <label class="small fw-bold mb-1 text-muted">Correo Electrónico</label>
              <input type="email" id="col-m-correo" class="form-control input-moderno mb-0 w-100" placeholder="Ej: pedro@correo.com">
            </div>
          </div>
        </div>
      </div>
    `;

    Swal.fire({
      title: 'Añadir Integrante',
      html: htmlForm,
      showCancelButton: true,
      confirmButtonText: 'Añadir',
      confirmButtonColor: '#e11d48',
      didOpen: () => {
        const typeSelect = document.getElementById('m-tipo') as HTMLSelectElement;
        const wrapperDoc = document.getElementById('wrapper-m-docente') as HTMLDivElement;
        const wrapperExt = document.getElementById('wrapper-m-externo') as HTMLDivElement;

        typeSelect.addEventListener('change', () => {
          if (typeSelect.value === 'Docente') {
            wrapperDoc.style.display = 'block';
            wrapperExt.style.display = 'none';
          } else {
            wrapperDoc.style.display = 'none';
            wrapperExt.style.display = 'block';
          }
        });
      },
      preConfirm: () => {
        const tipo = (document.getElementById('m-tipo') as HTMLSelectElement).value;
        const rol = (document.getElementById('m-rol') as HTMLInputElement).value.trim();

        if (!rol) {
          Swal.showValidationMessage('Debe especificar un rol en el colectivo');
          return false;
        }

        let cedula = '';
        let nombre = '';
        let telefono = '';
        let email = '';

        if (tipo === 'Docente') {
          const docSelect = document.getElementById('col-m-docente') as HTMLSelectElement;
          cedula = docSelect.value;
          if (!cedula) {
            Swal.showValidationMessage('Debe seleccionar un docente');
            return false;
          }
          const selectedOpt = docSelect.options[docSelect.selectedIndex];
          nombre = selectedOpt.getAttribute('data-nombre') || '';
        } else {
          cedula = (document.getElementById('col-m-cedula') as HTMLInputElement).value.trim();
          nombre = (document.getElementById('col-m-nombre') as HTMLInputElement).value.trim();
          telefono = (document.getElementById('col-m-telefono') as HTMLInputElement).value.trim();
          email = (document.getElementById('col-m-correo') as HTMLInputElement).value.trim();

          if (!cedula || !nombre) {
            Swal.showValidationMessage('La cédula y nombre completo son obligatorios');
            return false;
          }
        }

        return { tipo, rol, cedula, nombre, telefono, email };
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        const data = result.value;

        // Check if member already in collective
        if (selectedColectivo.integrantes.some(i => i.cedula === data.cedula)) {
          Swal.fire('Atención', 'Esta persona ya se encuentra vinculada a esta agrupación.', 'warning');
          return;
        }

        const nuevoMiembro: Miembro = {
          cedula: data.cedula,
          nombre_completo: data.nombre,
          tipo: data.tipo as any,
          rol: data.rol,
          telefono: data.tipo === 'Docente' ? docentes.find(d => d.cedula === data.cedula)?.telefono : data.telefono,
          email: data.tipo === 'Docente' ? docentes.find(d => d.cedula === data.cedula)?.email : data.email,
          agregado_el: new Date().toISOString()
        };

        const updatedMembers = [...selectedColectivo.integrantes, nuevoMiembro];

        try {
          const { error } = await supabase
            .from('colectivos')
            .update({ integrantes: updatedMembers })
            .eq('id_colectivo', selectedColectivo.id_colectivo);

          if (error) throw error;

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Miembro Agregado',
            showConfirmButton: false,
            timer: 1500
          });

          auditar('Organización Escolar', 'Añadir Integrante', `Se integró a ${data.nombre} al colectivo ${selectedColectivo.nombre_colectivo}`);
          cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo vincular al miembro.', 'error');
        }
      }
    });
  };

  // Remove Member
  const removerMiembro = async (cedula: string, nombre: string) => {
    if (!selectedColectivo) return;

    if (cedula === selectedColectivo.vocero_cedula) {
      Swal.fire('Restricción', 'No puede remover al Vocero Principal. Si desea retirarlo, primero elija un nuevo vocero en la opción de Editar.', 'warning');
      return;
    }

    Swal.fire({
      title: '¿Remover miembro?',
      text: `¿Seguro que desea retirar a "${nombre}" de este colectivo?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Sí, remover',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        const updatedMembers = selectedColectivo.integrantes.filter(i => i.cedula !== cedula);
        try {
          const { error } = await supabase
            .from('colectivos')
            .update({ integrantes: updatedMembers })
            .eq('id_colectivo', selectedColectivo.id_colectivo);

          if (error) throw error;

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Miembro Removido',
            showConfirmButton: false,
            timer: 1500
          });

          auditar('Organización Escolar', 'Remover Integrante', `Se removió a ${nombre} del colectivo ${selectedColectivo.nombre_colectivo}`);
          cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo remover al miembro.', 'error');
        }
      }
    });
  };

  // Add/Edit Planning Activity
  const abrirModalActividad = (actEd: ActividadPlanificada | null = null) => {
    if (!selectedColectivo) return;

    const htmlForm = `
      <div class="text-start">
        <div class="mb-3">
          <label class="small fw-bold mb-1 text-muted">Nombre de la Actividad</label>
          <input type="text" id="act-nombre" class="form-control input-moderno w-100" placeholder="Ej: Jornada Científica" value="${actEd ? actEd.actividad : ''}">
        </div>

        <div class="mb-3">
          <label class="small fw-bold mb-1 text-muted">Fecha Estimada / Límite</label>
          <input type="date" id="act-fecha" class="form-control input-moderno w-100" value="${actEd ? actEd.fecha_objetivo : ''}">
        </div>

        <div class="mb-3">
          <label class="small fw-bold mb-1 text-muted">Objetivos de la Actividad</label>
          <textarea id="act-objetivos" class="form-control input-moderno w-100" rows="2" placeholder="Escriba los logros o metas específicas...">${actEd ? actEd.objetivos : ''}</textarea>
        </div>

        <div class="mb-3">
          <label class="small fw-bold mb-1 text-muted">Enlace con Ente Público/Privado (Opcional)</label>
          <input type="text" id="act-ente" class="form-control input-moderno w-100" placeholder="Ej: Fundacite, Infocentro, etc." value="${actEd && actEd.ente_vinculado ? actEd.ente_vinculado : ''}">
        </div>

        <div class="row g-2 mb-3">
          <div class="col-6">
            <label class="small fw-bold mb-1 text-muted">Estatus de Ejecución</label>
            <select id="act-estatus-ej" class="form-select input-moderno w-100" style="cursor:pointer">
              <option value="Planificado" ${actEd && actEd.estatus_ejecucion === 'Planificado' ? 'selected' : ''}>Planificado</option>
              <option value="En Progreso" ${actEd && actEd.estatus_ejecucion === 'En Progreso' ? 'selected' : ''}>En Progreso</option>
              <option value="Ejecutado" ${actEd && actEd.estatus_ejecucion === 'Ejecutado' ? 'selected' : ''}>Ejecutado</option>
              <option value="Suspendido" ${actEd && actEd.estatus_ejecucion === 'Suspendido' ? 'selected' : ''}>Suspendido</option>
            </select>
          </div>
          <div class="col-6">
            <label class="small fw-bold mb-1 text-muted">Aprobación (Coordinación)</label>
            <select id="act-estatus-ap" class="form-select input-moderno w-100" style="cursor:pointer">
              <option value="Pendiente" ${actEd && actEd.estatus_aprobacion === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
              <option value="Aprobado" ${actEd && actEd.estatus_aprobacion === 'Aprobado' ? 'selected' : ''}>Aprobado</option>
              <option value="Rechazado" ${actEd && actEd.estatus_aprobacion === 'Rechazado' ? 'selected' : ''}>Rechazado</option>
            </select>
          </div>
        </div>

        <div class="mb-3">
          <label class="small fw-bold mb-1 text-muted">Observaciones</label>
          <textarea id="act-observaciones" class="form-control input-moderno w-100" rows="2" placeholder="Notas adicionales...">${actEd && actEd.observaciones ? actEd.observaciones : ''}</textarea>
        </div>
      </div>
    `;

    Swal.fire({
      title: actEd ? 'Editar Actividad' : 'Planificar Actividad',
      html: htmlForm,
      showCancelButton: true,
      confirmButtonText: actEd ? 'Actualizar' : 'Planificar',
      confirmButtonColor: '#e11d48',
      preConfirm: () => {
        const actividad = (document.getElementById('act-nombre') as HTMLInputElement).value.trim();
        const fecha_objetivo = (document.getElementById('act-fecha') as HTMLInputElement).value;
        const objetivos = (document.getElementById('act-objetivos') as HTMLTextAreaElement).value.trim();
        const ente_vinculado = (document.getElementById('act-ente') as HTMLInputElement).value.trim();
        const estatus_ejecucion = (document.getElementById('act-estatus-ej') as HTMLSelectElement).value;
        const estatus_aprobacion = (document.getElementById('act-estatus-ap') as HTMLSelectElement).value;
        const observaciones = (document.getElementById('act-observaciones') as HTMLTextAreaElement).value.trim();

        if (!actividad || !fecha_objetivo || !objetivos) {
          Swal.showValidationMessage('Nombre, fecha y objetivos son campos obligatorios');
          return false;
        }

        return {
          actividad,
          fecha_objetivo,
          objetivos,
          ente_vinculado,
          estatus_ejecucion,
          estatus_aprobacion,
          observaciones
        };
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        const val = result.value;
        let list = [...selectedColectivo.planificacion_anual];

        if (actEd) {
          // Edit
          list = list.map(a => {
            if (a.id_actividad === actEd.id_actividad) {
              return { ...a, ...val };
            }
            return a;
          });
        } else {
          // New
          list.push({
            id_actividad: "ACT-" + new Date().getTime(),
            ...val
          });
        }

        try {
          const { error } = await supabase
            .from('colectivos')
            .update({ planificacion_anual: list })
            .eq('id_colectivo', selectedColectivo.id_colectivo);

          if (error) throw error;

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: actEd ? 'Actividad Actualizada' : 'Actividad Planificada',
            showConfirmButton: false,
            timer: 1500
          });

          auditar('Organización Escolar', actEd ? 'Editar Planificación' : 'Nueva Planificación', `Planificación de colectivo: ${selectedColectivo.nombre_colectivo} - Actividad: ${val.actividad}`);
          cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo guardar la actividad en la base de datos.', 'error');
        }
      }
    });
  };

  // Delete Planning Activity
  const eliminarActividad = async (id: string, nombre: string) => {
    if (!selectedColectivo) return;

    Swal.fire({
      title: '¿Eliminar Actividad?',
      text: `¿Seguro que desea remover "${nombre}" de la planificación?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        const list = selectedColectivo.planificacion_anual.filter(a => a.id_actividad !== id);
        try {
          const { error } = await supabase
            .from('colectivos')
            .update({ planificacion_anual: list })
            .eq('id_colectivo', selectedColectivo.id_colectivo);

          if (error) throw error;

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Actividad Removida',
            showConfirmButton: false,
            timer: 1500
          });

          auditar('Organización Escolar', 'Remover Planificación', `Removió actividad: ${nombre} del colectivo: ${selectedColectivo.nombre_colectivo}`);
          cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo remover la actividad.', 'error');
        }
      }
    });
  };

  // Add Management Report
  const abrirModalReporte = () => {
    if (!selectedColectivo) return;

    const htmlForm = `
      <div class="text-start">
        <div class="mb-3">
          <label class="small fw-bold mb-1 text-muted">Título del Reporte</label>
          <input type="text" id="rep-titulo" class="form-control input-moderno w-100" placeholder="Ej: Reporte del Primer Lapso Escolar">
        </div>

        <div class="mb-3">
          <label class="small fw-bold mb-1 text-muted">Fecha del Informe</label>
          <input type="date" id="rep-fecha" class="form-control input-moderno w-100" value="${new Date().toISOString().slice(0, 10)}">
        </div>

        <div class="mb-3">
          <label class="small fw-bold mb-1 text-muted">Descripción de Actividades Realizadas</label>
          <textarea id="rep-descripcion" class="form-control input-moderno w-100" rows="3" placeholder="Resuma el trabajo llevado a cabo..."></textarea>
        </div>

        <div class="mb-3">
          <label class="small fw-bold mb-1 text-muted">Avances y Logros Alcanzados</label>
          <textarea id="rep-avances" class="form-control input-moderno w-100" rows="2" placeholder="Escriba los resultados obtenidos..."></textarea>
        </div>

        <div class="mb-3">
          <label class="small fw-bold mb-1 text-muted">Dificultades / Recomendaciones</label>
          <textarea id="rep-dificultades" class="form-control input-moderno w-100" rows="2" placeholder="Novedades o contratiempos..."></textarea>
        </div>

        <div class="mb-3">
          <label class="small fw-bold mb-1 text-muted">Enlace de Soporte Digital (Opcional)</label>
          <input type="text" id="rep-url" class="form-control input-moderno w-100" placeholder="Ej: https://docs.google.com/carpeta-fotos">
        </div>
      </div>
    `;

    Swal.fire({
      title: 'Registrar Reporte de Gestión',
      html: htmlForm,
      showCancelButton: true,
      confirmButtonText: 'Guardar Reporte',
      confirmButtonColor: '#e11d48',
      preConfirm: () => {
        const titulo = (document.getElementById('rep-titulo') as HTMLInputElement).value.trim();
        const fecha_reporte = (document.getElementById('rep-fecha') as HTMLInputElement).value;
        const descripcion = (document.getElementById('rep-descripcion') as HTMLTextAreaElement).value.trim();
        const avances_logrados = (document.getElementById('rep-avances') as HTMLTextAreaElement).value.trim();
        const dificultades = (document.getElementById('rep-dificultades') as HTMLTextAreaElement).value.trim();
        const soporte_url = (document.getElementById('rep-url') as HTMLInputElement).value.trim();

        if (!titulo || !fecha_reporte || !descripcion) {
          Swal.showValidationMessage('El título, fecha y descripción de las actividades son obligatorios');
          return false;
        }

        return { titulo, fecha_reporte, descripcion, avances_logrados, dificultades, soporte_url };
      }
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        const val = result.value;
        const list = [...selectedColectivo.reportes_gestion, {
          id_reporte: "REP-" + new Date().getTime(),
          ...val
        }];

        try {
          const { error } = await supabase
            .from('colectivos')
            .update({ reportes_gestion: list })
            .eq('id_colectivo', selectedColectivo.id_colectivo);

          if (error) throw error;

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Reporte de Gestión Registrado',
            showConfirmButton: false,
            timer: 1500
          });

          auditar('Organización Escolar', 'Registrar Gestión', `Creó reporte: ${val.titulo} para el colectivo: ${selectedColectivo.nombre_colectivo}`);
          cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo guardar el reporte de gestión.', 'error');
        }
      }
    });
  };

  // Delete Report
  const eliminarReporte = async (id: string, titulo: string) => {
    if (!selectedColectivo) return;

    Swal.fire({
      title: '¿Eliminar Reporte?',
      text: `¿Seguro que desea retirar el reporte "${titulo}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        const list = selectedColectivo.reportes_gestion.filter(r => r.id_reporte !== id);
        try {
          const { error } = await supabase
            .from('colectivos')
            .update({ reportes_gestion: list })
            .eq('id_colectivo', selectedColectivo.id_colectivo);

          if (error) throw error;

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Reporte Removido',
            showConfirmButton: false,
            timer: 1500
          });

          auditar('Organización Escolar', 'Remover Reporte', `Eliminó reporte: ${titulo} del colectivo: ${selectedColectivo.nombre_colectivo}`);
          cargarDatos(true);
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo eliminar el reporte.', 'error');
        }
      }
    });
  };

  // Search filter
  const colectivosFiltrados = colectivos.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    return (
      c.nombre_colectivo.toLowerCase().includes(q) ||
      c.descripcion.toLowerCase().includes(q) ||
      c.vocero_nombre.toLowerCase().includes(q) ||
      c.vocero_cedula.toLowerCase().includes(q)
    );
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
        <p className="text-muted mb-0">No tienes permisos asignados para acceder a la gestión de colectivos.</p>
      </div>
    );
  }

  return (
    <div className="modulo-animado container-fluid p-0">
      {/* Banner */}
      <div className="row mb-4 animate__animated animate__fadeInDown">
        <div className="col-12">
          <div 
            className="banner-modulo p-4 p-md-5 text-white shadow-sm animate__animated animate__fadeInDown" 
            style={{ background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
          >
            <div className="burbuja-3d burbuja-1" style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.08)', position: 'absolute', top: '-50px', right: '-20px', borderRadius: '50%' }}></div>
            <div className="burbuja-3d burbuja-2" style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.04)', position: 'absolute', bottom: '-20px', left: '20px', borderRadius: '50%' }}></div>
            <div className="row align-items-center position-relative z-1">
              <div className="col-12 text-center text-md-start">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <span className="badge bg-white text-danger px-3 py-2 shadow-sm fw-bold" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>
                    <i className="bi bi-people-fill me-1"></i> ORGANIZACIÓN ESCOLAR
                  </span>
                  <div className="d-flex gap-2">
                    {isDualAccess && (
                      <div className="btn-group bg-white p-1 rounded-pill shadow-sm">
                        <button 
                          onClick={() => setEscuelaSeleccionada('sb')} 
                          className={`btn btn-sm rounded-pill px-3 fw-bold ${escuelaSeleccionada === 'sb' ? 'btn-success text-white' : 'btn-light text-muted border-0'}`}
                        >
                          Santa Bárbara
                        </button>
                        <button 
                          onClick={() => setEscuelaSeleccionada('lb')} 
                          className={`btn btn-sm rounded-pill px-3 fw-bold ${escuelaSeleccionada === 'lb' ? 'btn-primary text-white' : 'btn-light text-muted border-0'}`}
                        >
                          Libertador
                        </button>
                      </div>
                    )}
                    <button 
                      onClick={() => navigate('/categoria/Organizaci%C3%B3n%20Escolar')} 
                      className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                    >
                      <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
                    </button>
                  </div>
                </div>
                <h1 className="fw-bolder mb-2 text-white animate__animated animate__fadeInLeft" style={{ fontSize: '2.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                  <i className="bi bi-people-fill me-3"></i>Gestión de Colectivos
                </h1>
                <p className="mb-0 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Agrupaciones pedagógicas de docentes, estudiantes y representantes para {escuelaSeleccionada === 'sb' ? 'U.E. Santa Bárbara' : 'U.E. Libertador Bolívar'}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="row g-3 mb-4 animate__animated animate__fadeIn">
        <div className="col-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white d-flex flex-row align-items-center gap-3">
            <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-circle">
              <i className="bi bi-diagram-3-fill fs-3"></i>
            </div>
            <div>
              <h6 className="text-muted small uppercase mb-1 fw-bold">Colectivos</h6>
              <h3 className="fw-bolder mb-0 text-dark">{colectivos.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white d-flex flex-row align-items-center gap-3">
            <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-circle">
              <i className="bi bi-people-fill fs-3"></i>
            </div>
            <div>
              <h6 className="text-muted small uppercase mb-1 fw-bold">Voceros Activos</h6>
              <h3 className="fw-bolder mb-0 text-dark">
                {colectivos.filter(c => c.vocero_cedula).length}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white d-flex flex-row align-items-center gap-3">
            <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle">
              <i className="bi bi-calendar-check fs-3"></i>
            </div>
            <div>
              <h6 className="text-muted small uppercase mb-1 fw-bold">Planificación</h6>
              <h3 className="fw-bolder mb-0 text-dark">
                {colectivos.reduce((acc, c) => acc + c.planificacion_anual.length, 0)} tareas
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Operations Bar */}
      <div className="row g-3 mb-4 align-items-center justify-content-between">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="input-group shadow-sm rounded-pill overflow-hidden border">
            <span className="input-group-text bg-white border-0"><i className="bi bi-search text-muted"></i></span>
            <input 
              type="text" 
              className="form-control border-0 px-2 py-2" 
              placeholder="Buscar colectivo o vocero..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="col-auto">
          {canCrear && (
            <button 
              className="btn btn-danger text-white rounded-pill px-4 py-2 fw-bold shadow-sm hover-efecto"
              onClick={() => abrirModalColectivo()}
            >
              <i className="bi bi-plus-lg me-1"></i> Nuevo Colectivo
            </button>
          )}
        </div>
      </div>

      {/* Collectives Grid */}
      <div className="row g-4 animate__animated animate__fadeInUp">
        {loading ? (
          <div className="col-12 text-center py-5">
            <div className="spinner-border text-danger" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : colectivosFiltrados.length === 0 ? (
          <div className="col-12 text-center py-5 text-muted">
            <i className="bi bi-diagram-2 fs-1 d-block mb-3"></i>
            No se han registrado colectivos en este plantel escolar.
          </div>
        ) : (
          colectivosFiltrados.map(c => {
            const totalIntegrantes = c.integrantes.length;
            const totalActividades = c.planificacion_anual.length;
            const totalReportes = c.reportes_gestion.length;

            return (
              <div key={c.id_colectivo} className="col-12 col-md-6 col-xl-4">
                <div className="card border-0 shadow-sm rounded-4 h-100 hover-efecto" style={{ borderTop: '5px solid #e11d48' }}>
                  <div className="card-body p-4 d-flex flex-column h-100">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="fw-extrabold text-dark mb-1 text-uppercase text-truncate" style={{ maxWidth: '200px' }} title={c.nombre_colectivo}>
                        {c.nombre_colectivo}
                      </h5>
                      <span className="badge bg-danger bg-opacity-10 text-danger px-2 py-1 rounded-pill small" style={{ fontSize: '0.65rem' }}>
                        ID: {c.id_colectivo}
                      </span>
                    </div>

                    <p className="text-muted small mb-4 text-truncate-3" style={{ minHeight: '50px', fontSize: '0.85rem' }}>
                      {c.descripcion || 'Sin descripción detallada.'}
                    </p>

                    <div className="bg-light rounded-4 p-3 mb-4">
                      <span className="text-muted small d-block mb-2 fw-semibold"><i className="bi bi-person-badge-fill me-1"></i>Vocero del Colectivo</span>
                      <div className="d-flex align-items-center gap-2">
                        <div className="p-2 bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm text-primary" style={{ width: '36px', height: '36px' }}>
                          <i className="bi bi-person-fill"></i>
                        </div>
                        <div>
                          <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '170px' }}>{c.vocero_nombre}</div>
                          <span className="badge bg-primary bg-opacity-10 text-primary px-1 rounded" style={{ fontSize: '0.65rem' }}>
                            <i className="bi bi-person-workspace me-1"></i>Docente
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats pills */}
                    <div className="d-flex gap-2 mb-4 justify-content-between">
                      <div className="text-center bg-light rounded-3 p-2 flex-grow-1">
                        <span className="d-block fw-extrabold text-dark fs-5">{totalIntegrantes}</span>
                        <small className="text-muted fw-semibold" style={{ fontSize: '0.65rem' }}>MIEMBROS</small>
                      </div>
                      <div className="text-center bg-light rounded-3 p-2 flex-grow-1">
                        <span className="d-block fw-extrabold text-dark fs-5">{totalActividades}</span>
                        <small className="text-muted fw-semibold" style={{ fontSize: '0.65rem' }}>PLANES</small>
                      </div>
                      <div className="text-center bg-light rounded-3 p-2 flex-grow-1">
                        <span className="d-block fw-extrabold text-dark fs-5">{totalReportes}</span>
                        <small className="text-muted fw-semibold" style={{ fontSize: '0.65rem' }}>GESTIÓN</small>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto pt-2 border-top">
                      {/* Direct section access buttons */}
                      <div className="d-flex gap-2 mb-2">
                        <button
                          className="btn btn-sm fw-bold flex-grow-1"
                          style={{ fontSize: '0.72rem', background: '#fef2f2', color: '#e11d48', border: '1.5px solid #fca5a5', borderRadius: '10px' }}
                          title="Ver y agregar integrantes del colectivo"
                          onClick={() => { setSelectedColectivo(c); setModalActiveTab('miembros'); }}
                        >
                          <i className="bi bi-people-fill me-1"></i>
                          Integrantes
                          <span className="badge ms-1 rounded-pill" style={{ background: '#e11d48', fontSize: '0.6rem' }}>{c.integrantes.length}</span>
                        </button>
                        <button
                          className="btn btn-sm fw-bold flex-grow-1"
                          style={{ fontSize: '0.72rem', background: '#eff6ff', color: '#1d4ed8', border: '1.5px solid #bfdbfe', borderRadius: '10px' }}
                          title="Ver y agregar actividades al plan anual"
                          onClick={() => { setSelectedColectivo(c); setModalActiveTab('planificacion'); }}
                        >
                          <i className="bi bi-calendar-check me-1"></i>
                          Plan Anual
                          <span className="badge ms-1 rounded-pill" style={{ background: '#1d4ed8', fontSize: '0.6rem' }}>{c.planificacion_anual.length}</span>
                        </button>
                        <button
                          className="btn btn-sm fw-bold flex-grow-1"
                          style={{ fontSize: '0.72rem', background: '#f0fdf4', color: '#15803d', border: '1.5px solid #bbf7d0', borderRadius: '10px' }}
                          title="Ver historial de reportes de gestión"
                          onClick={() => { setSelectedColectivo(c); setModalActiveTab('reportes'); }}
                        >
                          <i className="bi bi-file-earmark-bar-graph me-1"></i>
                          Informes
                          <span className="badge ms-1 rounded-pill" style={{ background: '#15803d', fontSize: '0.6rem' }}>{c.reportes_gestion.length}</span>
                        </button>
                      </div>

                      {/* Edit / Delete */}
                      <div className="d-flex justify-content-end gap-1">
                        {canCrear && (
                          <button
                            className="btn btn-sm btn-light text-primary border rounded-circle shadow-sm hover-efecto"
                            title="Editar información del colectivo y vocero"
                            onClick={() => abrirModalColectivo(c)}
                          >
                            <i className="bi bi-pencil-fill" style={{ fontSize: '0.8rem' }}></i>
                          </button>
                        )}
                        {canEliminar && (
                          <button
                            className="btn btn-sm btn-light text-danger border rounded-circle shadow-sm hover-efecto"
                            title="Eliminar colectivo"
                            onClick={() => eliminarColectivo(c.id_colectivo, c.nombre_colectivo)}
                          >
                            <i className="bi bi-trash3-fill" style={{ fontSize: '0.8rem' }}></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DETAIL MODAL (MIEMBROS, PLANES, REPORTES) */}
      {selectedColectivo && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden animate__animated animate__fadeInUp">
              
              {/* Header */}
              <div className="modal-header text-white p-4 align-items-start" style={{ background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)' }}>
                <div>
                  <span className="badge bg-white text-danger fw-bold mb-1">COLECTIVO PEDAGÓGICO</span>
                  <h4 className="modal-title fw-bold text-white uppercase">{selectedColectivo.nombre_colectivo}</h4>
                  <small className="opacity-90 d-block mt-1">{selectedColectivo.descripcion || 'Sin descripción descriptiva.'}</small>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedColectivo(null)}></button>
              </div>

              {/* Navigation Tabs inside modal */}
              <div className="bg-light p-2 border-bottom d-flex gap-2">
                <button 
                  className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold ${modalActiveTab === 'miembros' ? 'btn-dark text-white' : 'btn-light text-secondary'}`}
                  onClick={() => setModalActiveTab('miembros')}
                >
                  <i className="bi bi-people-fill me-1"></i> Integrantes ({selectedColectivo.integrantes.length})
                </button>
                <button 
                  className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold ${modalActiveTab === 'planificacion' ? 'btn-dark text-white' : 'btn-light text-secondary'}`}
                  onClick={() => setModalActiveTab('planificacion')}
                >
                  <i className="bi bi-calendar-range me-1"></i> Plan Anual ({selectedColectivo.planificacion_anual.length})
                </button>
                <button 
                  className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold ${modalActiveTab === 'reportes' ? 'btn-dark text-white' : 'btn-light text-secondary'}`}
                  onClick={() => setModalActiveTab('reportes')}
                >
                  <i className="bi bi-file-earmark-bar-graph me-1"></i> Informes de Gestión ({selectedColectivo.reportes_gestion.length})
                </button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                
                {/* TAB 1: INTEGRANTES */}
                {modalActiveTab === 'miembros' && (
                  <div className="animate__animated animate__fadeIn">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold text-dark mb-0"><i className="bi bi-person-fill text-danger me-2"></i>Miembros del Colectivo</h6>
                      {canCrear && (
                        <button className="btn btn-danger rounded-pill fw-bold px-4" onClick={agregarMiembro}>
                          <i className="bi bi-person-plus-fill me-1"></i>Agregar Integrante
                        </button>
                      )}
                    </div>

                    {/* Legend pills */}
                    <div className="d-flex gap-2 mb-3 flex-wrap">
                      <span className="badge bg-primary text-white px-2 py-1" style={{ fontSize: '0.7rem' }}><i className="bi bi-person-workspace me-1"></i>Docente</span>
                      <span className="badge bg-success text-white px-2 py-1" style={{ fontSize: '0.7rem' }}><i className="bi bi-mortarboard me-1"></i>Estudiante</span>
                      <span className="badge bg-warning text-dark px-2 py-1" style={{ fontSize: '0.7rem' }}><i className="bi bi-person-heart me-1"></i>Representante</span>
                      <span className="badge bg-danger text-white px-2 py-1" style={{ fontSize: '0.7rem' }}><i className="bi bi-megaphone me-1"></i>Vocero Principal</span>
                    </div>

                    {selectedColectivo.integrantes.length === 0 ? (
                      <div className="text-center py-4">
                        <div
                          className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
                          style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg,#fef2f2,#fee2e2)' }}
                        >
                          <i className="bi bi-people text-danger" style={{ fontSize: '2rem' }}></i>
                        </div>
                        <h6 className="fw-bold text-dark mb-1">Este colectivo no tiene integrantes aún</h6>
                        <p className="text-muted small mb-3">
                          Puedes agregar docentes, estudiantes y representantes usando el botón de arriba.
                        </p>
                        {canCrear && (
                          <button className="btn btn-danger rounded-pill fw-bold px-4" onClick={agregarMiembro}>
                            <i className="bi bi-person-plus-fill me-1"></i>Agregar primer integrante
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                          <thead className="bg-light text-muted small">
                            <tr>
                              <th>Nombre / Cédula</th>
                              <th>Tipo</th>
                              <th>Rol Interno</th>
                              <th>Contacto</th>
                              {canCrear && <th className="text-end">Acción</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {selectedColectivo.integrantes.map(m => {
                              const isVocero = m.cedula === selectedColectivo.vocero_cedula;
                              const typeColor = m.tipo === 'Docente' ? 'bg-primary' : (m.tipo === 'Estudiante' ? 'bg-success' : 'bg-warning');
                              const typeDark  = m.tipo === 'Docente' ? '' : (m.tipo === 'Estudiante' ? '' : 'text-dark');

                              return (
                                <tr key={m.cedula}>
                                  <td>
                                    <div className="fw-bold text-dark">
                                      {m.nombre_completo}
                                      {isVocero && <span className="badge bg-danger ms-2" style={{ fontSize: '0.6rem' }}>VOCERO</span>}
                                    </div>
                                    <span className="text-muted small">C.I: {m.cedula}</span>
                                  </td>
                                  <td>
                                    <span className={`badge ${typeColor} ${typeDark}`} style={{ fontSize: '0.7rem' }}>
                                      {m.tipo}
                                    </span>
                                  </td>
                                  <td className="fw-bold text-secondary small">{m.rol}</td>
                                  <td className="small text-muted" style={{ fontSize: '0.75rem' }}>
                                    {m.telefono && <div><i className="bi bi-telephone me-1"></i>{formatPhoneNumber(m.telefono)}</div>}
                                    {m.email && <div className="text-truncate" style={{ maxWidth: '140px' }}><i className="bi bi-envelope me-1"></i>{m.email}</div>}
                                    {!m.telefono && !m.email && <span className="fst-italic text-muted">Sin contacto</span>}
                                  </td>
                                  {canCrear && (
                                    <td className="text-end">
                                      <button
                                        className="btn btn-sm btn-light text-danger border rounded-circle"
                                        disabled={isVocero}
                                        title={isVocero ? 'No puede remover al vocero principal. Primero asigne otro vocero desde Editar.' : 'Retirar miembro del colectivo'}
                                        onClick={() => removerMiembro(m.cedula, m.nombre_completo)}
                                      >
                                        <i className="bi bi-trash-fill"></i>
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: PLANIFICACION */}
                {modalActiveTab === 'planificacion' && (
                  <div className="animate__animated animate__fadeIn">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold text-dark mb-0"><i className="bi bi-calendar-check-fill text-danger me-2"></i>Cronograma y Plan de Actividades</h6>
                      {canCrear && (
                        <button className="btn btn-sm btn-danger rounded-pill fw-bold" onClick={() => abrirModalActividad()}>
                          <i className="bi bi-plus-lg me-1"></i>Planificar Actividad
                        </button>
                      )}
                    </div>

                    {selectedColectivo.planificacion_anual.length === 0 ? (
                      <div className="text-center py-4 text-muted small">
                        <i className="bi bi-calendar-x d-block fs-3 mb-2"></i>
                        No se han planificado actividades anuales.
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {selectedColectivo.planificacion_anual.map(a => {
                          const statusEjecColor = a.estatus_ejecucion === 'Ejecutado' ? 'bg-success' : (a.estatus_ejecucion === 'En Progreso' ? 'bg-primary' : (a.estatus_ejecucion === 'Suspendido' ? 'bg-danger' : 'bg-secondary'));
                          const statusApColor = a.estatus_aprobacion === 'Aprobado' ? 'bg-success' : (a.estatus_aprobacion === 'Rechazado' ? 'bg-danger' : 'bg-warning');

                          return (
                            <div key={a.id_actividad} className="border rounded-4 p-3 bg-white shadow-sm position-relative">
                              <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                                <div>
                                  <h6 className="fw-bold text-dark mb-0 text-uppercase">{a.actividad}</h6>
                                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                    <i className="bi bi-calendar me-1"></i>Fecha objetivo: {new Date(a.fecha_objetivo).toLocaleDateString('es-VE')}
                                  </span>
                                </div>
                                <div className="d-flex gap-1">
                                  <span className={`badge ${statusEjecColor} text-white`} style={{ fontSize: '0.65rem' }}>
                                    Ejec: {a.estatus_ejecucion}
                                  </span>
                                  <span className={`badge ${statusApColor} text-white`} style={{ fontSize: '0.65rem' }}>
                                    Aprob: {a.estatus_aprobacion}
                                  </span>
                                </div>
                              </div>

                              <p className="text-secondary small mb-2" style={{ fontSize: '0.85rem' }}>
                                <b>Objetivos:</b> {a.objetivos}
                              </p>

                              {a.ente_vinculado && (
                                <div className="mb-2">
                                  <span className="badge bg-info text-white" style={{ fontSize: '0.7rem' }}>
                                    <i className="bi bi-link-45deg me-1"></i>Enlace: {a.ente_vinculado}
                                  </span>
                                </div>
                              )}

                              {a.observaciones && (
                                <div className="bg-light p-2 rounded small text-muted mb-2" style={{ fontSize: '0.75rem' }}>
                                  <i>Obs: {a.observaciones}</i>
                                </div>
                              )}

                              {canCrear && (
                                <div className="text-end border-top pt-2">
                                  <button 
                                    className="btn btn-sm btn-light text-primary border rounded-circle me-1" 
                                    title="Editar actividad"
                                    onClick={() => abrirModalActividad(a)}
                                  >
                                    <i className="bi bi-pencil-fill" style={{ fontSize: '0.75rem' }}></i>
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-light text-danger border rounded-circle" 
                                    title="Eliminar actividad"
                                    onClick={() => eliminarActividad(a.id_actividad, a.actividad)}
                                  >
                                    <i className="bi bi-trash-fill" style={{ fontSize: '0.75rem' }}></i>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: REPORTES DE GESTION */}
                {modalActiveTab === 'reportes' && (
                  <div className="animate__animated animate__fadeIn">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold text-dark mb-0"><i className="bi bi-file-earmark-bar-graph-fill text-danger me-2"></i>Historial de Informes presentados</h6>
                      {canCrear && (
                        <button className="btn btn-sm btn-danger rounded-pill fw-bold" onClick={abrirModalReporte}>
                          <i className="bi bi-plus-lg me-1"></i>Registrar Reporte
                        </button>
                      )}
                    </div>

                    {selectedColectivo.reportes_gestion.length === 0 ? (
                      <div className="text-center py-4 text-muted small">
                        <i className="bi bi-folder-x d-block fs-3 mb-2"></i>
                        No se han registrado reportes continuos de gestión.
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {selectedColectivo.reportes_gestion.map(r => (
                          <div key={r.id_reporte} className="border rounded-4 p-3 bg-white shadow-sm position-relative">
                            <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                              <div>
                                <h6 className="fw-bold text-dark mb-0 text-uppercase">{r.titulo}</h6>
                                <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                                  <i className="bi bi-clock-history me-1"></i>Fecha de Informe: {new Date(r.fecha_reporte).toLocaleDateString('es-VE')}
                                </span>
                              </div>
                              {canCrear && (
                                <button 
                                  className="btn btn-sm btn-light text-danger border rounded-circle"
                                  title="Eliminar Reporte"
                                  onClick={() => eliminarReporte(r.id_reporte, r.titulo)}
                                >
                                  <i className="bi bi-trash-fill" style={{ fontSize: '0.75rem' }}></i>
                                </button>
                              )}
                            </div>

                            <p className="text-secondary small mb-2" style={{ fontSize: '0.85rem' }}>
                              <b>Ejecución / Resultados:</b> {r.descripcion}
                            </p>

                            {r.avances_logrados && (
                              <div className="small text-success mb-1" style={{ fontSize: '0.8rem' }}>
                                <b>✓ Logros:</b> {r.avances_logrados}
                              </div>
                            )}

                            {r.dificultades && (
                              <div className="small text-danger mb-2" style={{ fontSize: '0.8rem' }}>
                                <b>⚠️ Dificultades:</b> {r.dificultades}
                              </div>
                            )}

                            {r.soporte_url && (
                              <div className="mb-1">
                                <a 
                                  href={r.soporte_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-0.5"
                                  style={{ fontSize: '0.7rem' }}
                                >
                                  <i className="bi bi-file-earmark-image me-1"></i>Ver Soporte Digital
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="modal-footer bg-light p-3">
                <button type="button" className="btn btn-secondary rounded-pill fw-bold" onClick={() => setSelectedColectivo(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
