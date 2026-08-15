import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';
import { formatPhoneNumber, toTitulo } from '../../lib/formatters';

const handleTituloChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setter: (val: string) => void
) => {
  const raw = e.target.value;
  const endsWithSpace = raw.endsWith(' ');
  const converted = toTitulo(raw.trimEnd());
  setter(endsWithSpace ? converted + ' ' : converted);
};



export const GestionUsuarios = () => {
  const navigate = useNavigate();
  const { tienePermisoEnEscuela, loading: permLoading } = usePermisos();

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesDisponibles, setRolesDisponibles] = useState<string[]>([]);

  // Permisos por escuela para el módulo
  const canUsersSB = tienePermisoEnEscuela('sb', 'Gestión de Usuarios', 'ver');
  const canUsersLB = tienePermisoEnEscuela('lb', 'Gestión de Usuarios', 'ver');
  const pUsuarios = canUsersSB || canUsersLB;

  const canCreateSB = tienePermisoEnEscuela('sb', 'Gestión de Usuarios', 'crear');
  const canCreateLB = tienePermisoEnEscuela('lb', 'Gestión de Usuarios', 'crear');
  const canCreateAny = canCreateSB || canCreateLB;

  const canDeleteSB = tienePermisoEnEscuela('sb', 'Gestión de Usuarios', 'eliminar');
  const canDeleteLB = tienePermisoEnEscuela('lb', 'Gestión de Usuarios', 'eliminar');

  // Filtering & Pagination
  const [filtroEscuela, setFiltroEscuela] = useState('TODAS');
  const [filtroRol, setFiltroRol] = useState('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [showReseteosModal, setShowReseteosModal] = useState(false);
  const [solicitudesReseteo, setSolicitudesReseteo] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [showCargaModal, setShowCargaModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [cargaProgress, setCargaProgress] = useState({ total: 0, actual: 0, procesando: false });

  // Form states (Add/Edit User)
  const [formCedula, setFormCedula] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formEscuela, setFormEscuela] = useState('sb');
  const [formRol, setFormRol] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formEstado, setFormEstado] = useState('Activo');
  const [formPrimerIngreso, setFormPrimerIngreso] = useState('true');

  const Swal = (window as any).Swal;

  useEffect(() => {
    if (!permLoading) {
      if (canUsersSB && !canUsersLB) {
        setFiltroEscuela('sb');
      } else if (canUsersLB && !canUsersSB) {
        setFiltroEscuela('lb');
      }
    }
  }, [permLoading, canUsersSB, canUsersLB]);

  useEffect(() => {
    if (!permLoading && pUsuarios) {
      cargarRoles();
      cargarUsuarios();

      const userChannel = supabase.channel('gestion_usuarios_page_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, () => {
          cargarUsuarios();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(userChannel);
      };
    }
  }, [permLoading, pUsuarios]);

  const cargarRoles = async () => {
    try {
      const { data } = await supabase.from('roles').select('nombre');
      if (data) setRolesDisponibles(data.map(r => r.nombre));
    } catch (e) {
      console.error("Error cargando roles", e);
    }
  };

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nombre_completo', { ascending: true });

      if (error) throw error;
      setUsuarios(data || []);

      // Cargar solicitudes de reseteo con filtro de permisos por escuela
      const solicitudes = (data || []).filter(u => {
        if (u.solicito_reseteo !== true) return false;
        const cSB = tienePermisoEnEscuela('sb', 'Gestión de Usuarios', 'ver');
        const cLB = tienePermisoEnEscuela('lb', 'Gestión de Usuarios', 'ver');
        if (u.id_escuela === 'sb' && !cSB) return false;
        if (u.id_escuela === 'lb' && !cLB) return false;
        if (u.id_escuela === 'ambas' && (!cSB || !cLB)) return false;
        return true;
      });
      setSolicitudesReseteo(solicitudes);
    } catch (e) {
      console.error(e);
      if (Swal) Swal.fire('Error', 'No se pudieron cargar los usuarios.', 'error');
    }
    setLoading(false);
  };

  if (permLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5 h-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!pUsuarios) {
    return (
      <div className="col-12 text-center py-5 mt-4">
        <div className="bg-light d-inline-flex justify-content-center align-items-center rounded-circle mb-3 shadow-sm border" style={{ width: '100px', height: '100px' }}>
          <i className="bi bi-shield-lock-fill text-muted" style={{ fontSize: '3.5rem' }}></i>
        </div>
        <h4 className="text-dark fw-bold mb-2">Área Restringida</h4>
        <p className="text-muted mb-0">No tienes permisos asignados para visualizar el directorio de usuarios.</p>
      </div>
    );
  }

  // Filter logic
  const usuariosFiltrados = usuarios.filter(u => {
    // Restringir visibilidad según permisos por escuela
    const targetEsc = u.id_escuela;
    if (targetEsc === 'sb' && !canUsersSB) return false;
    if (targetEsc === 'lb' && !canUsersLB) return false;
    if (targetEsc === 'ambas' && (!canUsersSB || !canUsersLB)) return false;

    const txt = searchQuery.toLowerCase();
    const coincideTexto = 
      (u.cedula || '').toLowerCase().includes(txt) || 
      (u.nombre_completo || '').toLowerCase().includes(txt) ||
      (u.rol || '').toLowerCase().includes(txt);
    
    let coincideEscuela = true;
    if (filtroEscuela !== 'TODAS') {
      coincideEscuela = (u.id_escuela === filtroEscuela);
    }
    
    let coincideRol = true;
    if (filtroRol !== 'TODOS') {
      coincideRol = ((u.rol || '').toLowerCase() === filtroRol.toLowerCase());
    }
    
    return coincideTexto && coincideEscuela && coincideRol;
  });

  // Pagination logic
  const totalPaginas = Math.ceil(usuariosFiltrados.length / itemsPorPagina) || 1;
  const indexInicio = (paginaActual - 1) * itemsPorPagina;
  const usuariosPaginados = usuariosFiltrados.slice(indexInicio, indexInicio + itemsPorPagina);

  const cambiarPagina = (pag: number) => {
    if (pag >= 1 && pag <= totalPaginas) {
      setPaginaActual(pag);
    }
  };

  // Open Form modal
  const abrirFormModal = (userToEdit: any = null) => {
    setEditingUser(userToEdit);
    if (userToEdit) {
      setFormCedula(userToEdit.cedula || '');
      setFormNombre(userToEdit.nombre_completo || '');
      setFormEscuela(userToEdit.id_escuela || 'sb');
      setFormRol(userToEdit.rol || '');
      setFormEmail(userToEdit.email || '');
      setFormTelefono(formatPhoneNumber(userToEdit.telefono || ''));
      setFormEstado(userToEdit.estado || 'Activo');
      setFormPrimerIngreso(String(userToEdit.primer_ingreso));
    } else {
      setFormCedula('');
      setFormNombre('');
      // Preseleccionar escuela con permisos de creación
      const defaultEscuela = canCreateSB ? 'sb' : (canCreateLB ? 'lb' : 'sb');
      setFormEscuela(defaultEscuela);
      setFormRol(rolesDisponibles[0] || '');
      setFormEmail('');
      setFormTelefono('');
      setFormEstado('Activo');
      setFormPrimerIngreso('true');
    }
    setShowUserModal(true);
  };

  const guardarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCedula || !formNombre || !formRol || !formEscuela || !formEstado) {
      if (Swal) Swal.fire('Atención', 'Complete todos los campos obligatorios.', 'warning');
      return;
    }

    // Validar permisos programáticamente para la escuela destino
    let isAuthorized = false;
    if (formEscuela === 'ambas') {
      isAuthorized = canCreateSB && canCreateLB;
    } else if (formEscuela === 'sb') {
      isAuthorized = canCreateSB;
    } else if (formEscuela === 'lb') {
      isAuthorized = canCreateLB;
    }

    if (!isAuthorized) {
      if (Swal) Swal.fire('Error', 'No tiene permisos para asignar o gestionar usuarios en la escuela seleccionada.', 'error');
      return;
    }

    // Si estamos editando, validar que tengan permisos en la escuela origen del usuario
    if (editingUser) {
      const oldSchool = editingUser.id_escuela;
      let isOldAuthorized = false;
      if (oldSchool === 'ambas') {
        isOldAuthorized = canCreateSB && canCreateLB;
      } else if (oldSchool === 'sb') {
        isOldAuthorized = canCreateSB;
      } else if (oldSchool === 'lb') {
        isOldAuthorized = canCreateLB;
      }

      if (!isOldAuthorized) {
        if (Swal) Swal.fire('Error', 'No tiene permisos para modificar usuarios de la escuela de origen.', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const payload: any = {
        cedula: formCedula.trim(),
        nombre_completo: formNombre.trim(),
        rol: formRol,
        id_escuela: formEscuela,
        email: formEmail.trim() || null,
        telefono: formTelefono.trim() || null,
        estado: formEstado,
        primer_ingreso: formPrimerIngreso === 'true'
      };

      if (editingUser) {
        let q = supabase.from('usuarios').update(payload);
        if (editingUser.id_usuario) q = q.eq('id_usuario', editingUser.id_usuario);
        else if (editingUser.id) q = q.eq('id', editingUser.id);
        else q = q.eq('cedula', editingUser.cedula);

        const { error } = await q;
        if (error) throw error;
        if (Swal) Swal.fire('¡Actualizado!', 'Los datos del usuario han sido actualizados.', 'success');
        auditar('Gestión de Usuarios', 'Editar Usuario', `Actualizó datos de: ${payload.cedula} (${payload.id_escuela})`);
      } else {
        payload.clave = formCedula.trim();
        payload.solicito_reseteo = false;
        
        const { error } = await supabase
          .from('usuarios')
          .insert([payload]);

        if (error) {
          if (error.code === '23505') {
            if (Swal) Swal.fire('Error', 'Esa cédula ya se encuentra registrada.', 'error');
            setLoading(false);
            return;
          }
          throw error;
        }
        if (Swal) Swal.fire('¡Usuario Creado!', `Se ha registrado al usuario.<br/><br/>Su clave temporal es: <b>${payload.cedula}</b>`, 'success');
        auditar('Gestión de Usuarios', 'Nuevo Usuario', `Creó usuario: ${payload.cedula} (${payload.id_escuela})`);
      }
      
      setShowUserModal(false);
      await cargarUsuarios();
    } catch (e: any) {
      console.error(e);
      if (Swal) Swal.fire('Error', e?.message || 'No se pudo guardar los datos.', 'error');
    }
    setLoading(false);
  };

  const resetearClave = async (u: any) => {
    if (!Swal) return;

    const canDeleteU = u.id_escuela === 'ambas' ? (canDeleteSB && canDeleteLB) : (u.id_escuela === 'sb' ? canDeleteSB : canDeleteLB);
    if (!canDeleteU) {
      Swal.fire('Error', 'No tiene permisos para resetear la clave de usuarios de esta escuela.', 'error');
      return;
    }

    Swal.fire({
      title: '¿Resetear Contraseña?',
      text: `La contraseña de ${u.nombre_completo} volverá a ser su número de cédula (${u.cedula}) y se desbloqueará su cuenta.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'Sí, resetear',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const resetData = {
            clave: u.cedula,
            primer_ingreso: true,
            intentos_fallidos: 0,
            bloqueo_hasta: null,
            estado: 'Activo'
          };

          if (u.cedula) {
            await supabase.from('usuarios').update(resetData).eq('cedula', u.cedula);
          }
          if (u.id_usuario) {
            await supabase.from('usuarios').update(resetData).eq('id_usuario', u.id_usuario);
          }
          if (u.id) {
            await supabase.from('usuarios').update(resetData).eq('id', u.id);
          }

          Swal.fire('¡Contraseña Reseteada!', 'La contraseña ha vuelto a ser la cédula.', 'success');
          auditar('Gestión de Usuarios', 'Resetear Clave', `Reinició contraseña de: ${u.cedula}`);
          await cargarUsuarios();
        } catch (e: any) {
          console.error(e);
          Swal.fire('Error', e?.message || 'No se pudo resetear la contraseña.', 'error');
        }
        setLoading(false);
      }
    });
  };

  const eliminarUsuario = (u: any) => {
    if (!Swal) return;

    const canDeleteU = u.id_escuela === 'ambas' ? (canDeleteSB && canDeleteLB) : (u.id_escuela === 'sb' ? canDeleteSB : canDeleteLB);
    if (!canDeleteU) {
      Swal.fire('Error', 'No tiene permisos para eliminar usuarios de esta escuela.', 'error');
      return;
    }

    Swal.fire({
      title: `¿Eliminar a ${u.nombre_completo}?`,
      text: `Esta acción es definitiva y borrará la cuenta permanentemente (C.I. ${u.cedula}).`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          let errorEliminacion: any = null;

          // 1. Eliminar por Cédula (clave unívoca en todo el sistema)
          if (u.cedula) {
            const { error: errCed } = await supabase
              .from('usuarios')
              .delete()
              .eq('cedula', u.cedula);
            if (errCed) errorEliminacion = errCed;
          }

          // 2. Eliminar por id_usuario si existe
          if (u.id_usuario) {
            const { error: errIdUsr } = await supabase
              .from('usuarios')
              .delete()
              .eq('id_usuario', u.id_usuario);
            if (errIdUsr && !errorEliminacion) errorEliminacion = errIdUsr;
          }

          // 3. Eliminar por id si existe
          if (u.id) {
            const { error: errId } = await supabase
              .from('usuarios')
              .delete()
              .eq('id', u.id);
            if (errId && !errorEliminacion) errorEliminacion = errId;
          }

          if (errorEliminacion) {
            throw errorEliminacion;
          }

          // Actualizar estado local inmediatamente
          setUsuarios(prev => prev.filter(item => 
            (u.cedula ? item.cedula !== u.cedula : true) && 
            (u.id_usuario ? item.id_usuario !== u.id_usuario : true) &&
            (u.id ? item.id !== u.id : true)
          ));

          Swal.fire('¡Eliminado!', 'El usuario ha sido eliminado de la base de datos.', 'success');
          auditar('Gestión de Usuarios', 'Eliminar Usuario', `Se eliminó al usuario: ${u.nombre_completo} (C.I. ${u.cedula})`);
          await cargarUsuarios();
        } catch (e: any) {
          console.error("Error al eliminar usuario:", e);
          Swal.fire('Error al Eliminar', e?.message || 'No se pudo eliminar al usuario. Verifique restricciones en la base de datos.', 'error');
        }
        setLoading(false);
      }
    });
  };

  const eliminarUsuariosMasivo = () => {
    if (!Swal || selectedUsers.length === 0) return;

    Swal.fire({
      title: `¿Eliminar ${selectedUsers.length} usuarios?`,
      text: "Esta acción es masiva y definitiva. Borrará todas las cuentas seleccionadas permanentemente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar todos',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const usersToDelete = usuarios.filter(u => 
            selectedUsers.includes(u.id_usuario) || 
            selectedUsers.includes(u.id) || 
            selectedUsers.includes(u.cedula)
          );

          const cedulas = usersToDelete.map(u => u.cedula).filter(Boolean);
          const idsUsuario = usersToDelete.map(u => u.id_usuario).filter(Boolean);
          const ids = usersToDelete.map(u => u.id).filter(Boolean);

          if (cedulas.length > 0) {
            await supabase.from('usuarios').delete().in('cedula', cedulas);
          }
          if (idsUsuario.length > 0) {
            await supabase.from('usuarios').delete().in('id_usuario', idsUsuario);
          }
          if (ids.length > 0) {
            await supabase.from('usuarios').delete().in('id', ids);
          }

          setUsuarios(prev => prev.filter(u => 
            !selectedUsers.includes(u.id_usuario) && 
            !selectedUsers.includes(u.id) && 
            !selectedUsers.includes(u.cedula)
          ));
          setSelectedUsers([]);

          Swal.fire('¡Eliminados!', `Se han eliminado ${selectedUsers.length} usuarios correctamente.`, 'success');
          auditar('Gestión de Usuarios', 'Eliminación Masiva', `Se eliminaron ${selectedUsers.length} usuarios.`);
          await cargarUsuarios();
        } catch (e: any) {
          console.error("Error al eliminar masivo:", e);
          Swal.fire('Error', e?.message || 'No se pudieron eliminar algunos usuarios.', 'error');
        }
        setLoading(false);
      }
    });
  };

  const aprobarReseteo = async (u: any) => {
    if (!Swal) return;

    const canDeleteU = u.id_escuela === 'ambas' ? (canDeleteSB && canDeleteLB) : (u.id_escuela === 'sb' ? canDeleteSB : canDeleteLB);
    if (!canDeleteU) {
      Swal.fire('Error', 'No tiene permisos para aprobar reseteos de usuarios de esta escuela.', 'error');
      return;
    }

    Swal.fire({
      title: '¿Aprobar Reseteo?',
      html: `Estás a punto de borrar todos los datos de seguridad de <b>${u.nombre_completo}</b>.<br/><br/>Su clave volverá a ser su cédula y deberá configurar su cuenta desde cero.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      confirmButtonText: 'Sí, borrar y resetear',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const payload = {
            clave: u.cedula,
            email: null,
            telefono: null,
            preguntas_seguridad: null,
            intentos_fallidos: 0,
            bloqueo_hasta: null,
            estado: 'Activo',
            primer_ingreso: true,
            solicito_reseteo: false
          };

          if (u.cedula) {
            await supabase.from('usuarios').update(payload).eq('cedula', u.cedula);
          }
          if (u.id_usuario) {
            await supabase.from('usuarios').update(payload).eq('id_usuario', u.id_usuario);
          }
          if (u.id) {
            await supabase.from('usuarios').update(payload).eq('id', u.id);
          }

          Swal.fire('¡Reseteo Aprobado!', `La cuenta de ${u.nombre_completo} ha sido restablecida exitosamente.`, 'success');
          auditar('Gestión de Usuarios', 'Aprobar Reseteo Total', `Se borró la configuración de la cuenta de: ${u.cedula}`);
          
          setShowReseteosModal(false);
          await cargarUsuarios();
        } catch (e: any) {
          console.error(e);
          Swal.fire('Error', e?.message || 'No se pudo aplicar el reseteo.', 'error');
        }
        setLoading(false);
      }
    });
  };

  // Carga Masiva logic
  const descargarPlantillaExcel = () => {
    const wsData = [
      ['Cedula', 'Nombre_Completo', 'Rol', 'Escuela_Codigo'],
      ['V12345678', 'Juan Pérez Silva', 'Docente', 'sb'],
      ['V98765432', 'María Gómez López', 'Coordinador', 'lb'],
      ['V11223344', 'Carlos Ruiz Díaz', 'Representante', 'ambas']
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Usuarios SIGAE");
    XLSX.writeFile(wb, "Plantilla_Modelo_Usuarios_SIGAE.xlsx");
  };

  const descargarPlantillaCSV = () => {
    let csvContent = "Cedula;Nombre_Completo;Rol;Escuela_Codigo\n";
    csvContent += "V12345678;Juan Pérez Silva;Docente;sb\n";
    csvContent += "V98765432;María Gómez López;Coordinador;lb\n";
    csvContent += "V11223344;Carlos Ruiz Díaz;Representante;ambas\n";
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Plantilla_Modelo_Usuarios_SIGAE.csv";
    link.click();
  };

  const descargarRechazados = (rechazados: any[]) => {
    let csv = "Linea_Excel;Datos_Originales;Motivo_del_Rechazo\n";
    rechazados.forEach(r => {
      let datosSafe = r.datos.replace(/"/g, '""');
      let motivoSafe = r.motivo.replace(/"/g, '""');
      csv += `${r.linea};"${datosSafe}";"${motivoSafe}"\n`;
    });
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Usuarios_Rechazados_SIGAE_${new Date().getTime()}.csv`;
    link.click();
  };

  const procesarCSV = () => {
    if (!csvFile) return;

    // Validar permiso en la escuela activa
    const activeSchool = localStorage.getItem('sigae_escuela_codigo') || 'sb';
    const canCreateInActive = activeSchool === 'sb' ? canCreateSB : canCreateLB;
    if (!canCreateInActive) {
      if (Swal) Swal.fire('Error', 'No tiene permisos para realizar carga masiva de usuarios en la escuela activa.', 'error');
      return;
    }

    const procesarFilasArray = async (rows: any[][]) => {
      let validos: any[] = [];
      let rechazados: any[] = [];
      let startIndex = 0;

      if (rows.length > 0) {
        const firstRowStr = rows[0].map(c => String(c || '').toLowerCase()).join(' ');
        if (firstRowStr.includes('cedula') || firstRowStr.includes('cédula') || firstRowStr.includes('nombre')) {
          startIndex = 1;
        }
      }

      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || row.every(cell => !cell || String(cell).trim() === '')) continue;

        if (row.length < 3) {
          rechazados.push({ linea: i + 1, datos: row.join(' ; '), motivo: "Faltan columnas obligatorias (Deben ser Cédula, Nombre, Rol)." });
          continue;
        }
        let cedula = String(row[0] || '').trim().toUpperCase();
        let nombreRaw = String(row[1] || '').trim();
        let nombre = toTitulo(nombreRaw);
        let rol = String(row[2] || '').trim();
        let escuelaRaw = String(row[3] || '').trim().toLowerCase();

        if (!cedula || !nombreRaw || !rol) {
          rechazados.push({ linea: i + 1, datos: row.join(' ; '), motivo: "Cédula, Nombre o Rol están en blanco." });
          continue;
        }

        let rolExiste = rolesDisponibles.find(r => r.toLowerCase() === rol.toLowerCase());
        if (!rolExiste) {
          rechazados.push({ linea: i + 1, datos: row.join(' ; '), motivo: `El rol '${rol}' no está creado en el panel de Privilegios.` });
          continue;
        }

        // Validación de código de escuela
        let codigoEscuelaFinal = localStorage.getItem('sigae_escuela_codigo') || 'sb';
        if (escuelaRaw) {
          if (escuelaRaw === 'sb' || escuelaRaw === 'lb' || escuelaRaw === 'ambas') {
            codigoEscuelaFinal = escuelaRaw;
          } else {
            rechazados.push({ linea: i + 1, datos: row.join(' ; '), motivo: `El código de escuela '${escuelaRaw}' es inválido (Use: sb, lb, ambas).` });
            continue;
          }
        }

        if (codigoEscuelaFinal === 'sb' && !canCreateSB) {
          rechazados.push({ linea: i + 1, datos: row.join(' ; '), motivo: `No tienes permisos para crear usuarios en la escuela SB.` });
          continue;
        }
        if (codigoEscuelaFinal === 'lb' && !canCreateLB) {
          rechazados.push({ linea: i + 1, datos: row.join(' ; '), motivo: `No tienes permisos para crear usuarios en la escuela LB.` });
          continue;
        }
        if (codigoEscuelaFinal === 'ambas' && (!canCreateSB || !canCreateLB)) {
          rechazados.push({ linea: i + 1, datos: row.join(' ; '), motivo: `No tienes permisos en ambas escuelas para crear usuarios compartidos.` });
          continue;
        }

        validos.push({
          cedula: cedula,
          nombre_completo: nombre,
          rol: rolExiste,
          cargo: null,
          email: null,
          telefono: null,
          clave: cedula,
          primer_ingreso: true,
          estado: 'Activo',
          solicito_reseteo: false,
          id_escuela: codigoEscuelaFinal
        });
      }

      if (validos.length === 0 && rechazados.length === 0) {
        if (Swal) Swal.fire('Error', 'El archivo está vacío o tiene formato inválido.', 'error');
        return;
      }

      setLoading(true);
      let insertados = 0;
      let omitidos = 0;
      try {
        if (validos.length > 0) {
          setCargaProgress({ total: validos.length, actual: 0, procesando: true });
          const cedulasNuevas = validos.map(v => String(v.cedula));
          let cedulasBD: string[] = [];
          
          // Consultar en lotes (chunks) de 100 para evitar error "URI Too Long" con listas masivas
          const CHUNK_SIZE = 100;
          for (let i = 0; i < cedulasNuevas.length; i += CHUNK_SIZE) {
            const chunk = cedulasNuevas.slice(i, i + CHUNK_SIZE);
            const { data: existentes, error: errExistentes } = await supabase.from('usuarios').select('cedula').in('cedula', chunk);
            if (errExistentes) {
              console.error("Error validando cedulas existentes:", errExistentes);
            }
            if (existentes) {
              cedulasBD = [...cedulasBD, ...existentes.map(ex => String(ex.cedula))];
            }
          }

          let registrosIns: any[] = [];

          validos.forEach(v => {
            if (cedulasBD.includes(String(v.cedula))) {
              omitidos++;
              rechazados.push({ linea: 'N/A', datos: `${v.cedula} ; ${v.nombre_completo}`, motivo: 'El usuario ya se encuentra registrado. Fue omitido según lo solicitado.' });
            } else {
              registrosIns.push(v);
            }
          });

          if (registrosIns.length > 0) {
            for (let reg of registrosIns) {
              const { error: insErr } = await supabase.from('usuarios').insert([reg]);
              if (insErr) {
                console.error("Error inserting row", reg, insErr);
                if (insErr.code === '23505') {
                  rechazados.push({ linea: 'N/A', datos: `${reg.cedula} ; ${reg.nombre_completo}`, motivo: 'El usuario ya se encuentra registrado en el sistema.' });
                } else {
                  rechazados.push({ linea: 'N/A', datos: `${reg.cedula} ; ${reg.nombre_completo}`, motivo: `Error al guardar: ${insErr.message || 'Desconocido'}` });
                }
              } else {
                insertados++;
              }
              setCargaProgress(prev => ({ ...prev, actual: prev.actual + 1 }));
            }
          }
        }

        setCargaProgress({ total: 0, actual: 0, procesando: false });
        setLoading(false);
        setShowCargaModal(false);
        setCsvFile(null);
        cargarUsuarios();

        if (rechazados.length > 0) {
          if (Swal) {
            Swal.fire({
              title: 'Carga Parcial',
              html: `Se registraron <b>${insertados}</b> usuarios nuevos exitosamente.<br><br><span class="text-danger">Se rechazaron/omitieron ${rechazados.length} filas (incluyendo usuarios ya existentes o errores de formato).</span>`,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: '<i class="bi bi-download me-1"></i> Descargar Reporte de Errores',
              cancelButtonText: 'Cerrar'
            }).then((res: any) => {
              if (res.isConfirmed) descargarRechazados(rechazados);
            });
          }
        } else {
          if (Swal) Swal.fire('¡Carga Exitosa!', `Se importaron correctamente ${insertados} usuarios en el sistema.`, 'success');
        }
        auditar('Gestión de Usuarios', 'Carga Masiva', `Carga masiva procesada: ${insertados} insertados, ${omitidos} omitidos, ${rechazados.length} rechazados.`);
      } catch (err: any) {
        console.error("Error en carga masiva:", err);
        setLoading(false);
        if (Swal) Swal.fire('Error', 'Ocurrió un problema guardando los datos masivos: ' + err.message, 'error');
      }
    };

    const isExcelOrOds = csvFile.name.endsWith('.xlsx') || csvFile.name.endsWith('.xls') || csvFile.name.endsWith('.ods');
    if (isExcelOrOds) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
          procesarFilasArray(rows);
        } catch (err: any) {
          console.error(err);
          if (Swal) Swal.fire('Error', 'No se pudo leer el archivo de formato Excel/Linux (.xlsx/.ods)', 'error');
        }
      };
      reader.readAsArrayBuffer(csvFile);
    } else {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        let text = e.target.result;
        if (!text) return;
        let lines = text.split(/\r?\n/);
        let rows = lines.map((l: string) => l.trim().split(/[;,]/));
        procesarFilasArray(rows);
      };
      reader.readAsText(csvFile, "UTF-8");
    }
  };

  const obtenerRangoPaginacion = () => {
    const rango: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPaginas <= maxVisible) {
      for (let i = 1; i <= totalPaginas; i++) rango.push(i);
    } else {
      rango.push(1);
      let left = Math.max(2, paginaActual - 1);
      let right = Math.min(totalPaginas - 1, paginaActual + 1);
      
      if (paginaActual === 1) right = 3;
      if (paginaActual === totalPaginas) left = totalPaginas - 2;
      
      if (left > 2) rango.push('...');
      for (let i = left; i <= right; i++) rango.push(i);
      if (right < totalPaginas - 1) rango.push('...');
      rango.push(totalPaginas);
    }
    return rango;
  };

  return (
    <div className="row g-4 container-fluid p-0 animate__animated animate__fadeIn">
      {/* Banner */}
      <div className="col-12 animate__animated animate__fadeInDown">
        <div 
          className="banner-modulo p-4 p-md-5 text-white shadow-sm" 
          style={{ background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}
        >
          <div className="burbuja-3d burbuja-1" style={{ width: '150px', height: '150px', background: 'rgba(255,255,255,0.15)', position: 'absolute', top: '-50px', right: '-20px', borderRadius: '50%' }}></div>
          <div className="burbuja-3d burbuja-2" style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.08)', position: 'absolute', bottom: '-20px', left: '20px', borderRadius: '50%' }}></div>
          <div className="row align-items-center position-relative z-1">
            <div className="col-12 text-center text-md-start">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                <span className="badge bg-white text-success px-3 py-2 shadow-sm fw-bold" style={{ letterSpacing: '1px', fontSize: '0.85rem' }}>
                  <i className="bi bi-shield-lock me-1"></i> SEGURIDAD Y ACCESOS
                </span>
                <button 
                  onClick={() => navigate('/categoria/Seguridad%20y%20Accesos')} 
                  className="btn btn-sm btn-light rounded-pill px-3 fw-bold shadow-sm hover-efecto"
                >
                  <i className="bi bi-arrow-left-short me-1"></i> Volver al Menú
                </button>
              </div>
              <h1 className="fw-bolder mb-2 text-white" style={{ fontSize: '2.8rem', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                <i className="bi bi-people-fill me-3"></i>Gestión de Usuarios
              </h1>
              <p className="mb-0 fw-bold fs-5" style={{ color: 'rgba(255,255,255,0.9)' }}>
                Administración de cuentas, roles y restablecimiento de claves.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="col-12 animate__animated animate__fadeInUp">
        <div className="card border-0 shadow-sm rounded-4 h-100" style={{ borderTop: '5px solid #10B981 !important' }}>
          <div className="card-header bg-white border-bottom p-4">
            <div className="row g-3 align-items-end">
              <div className="col-md-2">
                <label className="small fw-bold text-muted mb-1"><i className="bi bi-building me-1"></i>Escuela</label>
                <select 
                  className="form-select input-moderno border-success fw-bold" 
                  value={filtroEscuela}
                  onChange={(e) => { setFiltroEscuela(e.target.value); setPaginaActual(1); }}
                >
                  {canUsersSB && canUsersLB && <option value="TODAS">Ambas</option>}
                  {canUsersLB && <option value="lb">Libertador Bolívar</option>}
                  {canUsersSB && <option value="sb">Simón Bolívar</option>}
                </select>
              </div>
              <div className="col-md-2">
                <label className="small fw-bold text-muted mb-1"><i className="bi bi-person-badge me-1"></i>Rol</label>
                <select 
                  className="form-select input-moderno border-success fw-bold" 
                  value={filtroRol}
                  onChange={(e) => { setFiltroRol(e.target.value); setPaginaActual(1); }}
                >
                  <option value="TODOS">Todos los roles</option>
                  {rolesDisponibles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="small fw-bold text-muted mb-1"><i className="bi bi-search me-1"></i>Buscar</label>
                <input 
                  type="text" 
                  className="input-moderno form-control w-100" 
                  placeholder="Cédula o nombre..." 
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPaginaActual(1); }}
                />
              </div>
              <div className="col-md-5 text-md-end">
                <div className="text-muted small fw-bold mb-2 text-md-end text-start">
                  Mostrando {usuariosFiltrados.length} resultados {selectedUsers.length > 0 && <span className="text-danger ms-1">({selectedUsers.length} seleccionados)</span>}
                </div>
                {(canDeleteSB || canDeleteLB) && (
                  <button 
                    className="btn btn-warning fw-bold shadow-sm px-3 rounded-pill hover-efecto me-1 position-relative" 
                    onClick={() => setShowReseteosModal(true)}
                  >
                    <i className="bi bi-arrow-counterclockwise me-1"></i>Reseteos
                    {solicitudesReseteo.length > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        {solicitudesReseteo.length}
                      </span>
                    )}
                  </button>
                )}
                {selectedUsers.length > 0 && (
                  <button 
                    className="btn btn-danger fw-bold shadow-sm px-3 rounded-pill hover-efecto me-2" 
                    onClick={eliminarUsuariosMasivo}
                  >
                    <i className="bi bi-trash3-fill me-1"></i>Eliminar ({selectedUsers.length})
                  </button>
                )}
                {canCreateAny && (
                  <button 
                    className="btn btn-dark fw-bold shadow-sm px-3 rounded-pill hover-efecto me-1" 
                    onClick={() => setShowCargaModal(true)}
                  >
                    <i className="bi bi-cloud-arrow-up-fill me-1"></i>Carga Masiva
                  </button>
                )}
                {canCreateAny && (
                  <button 
                    className="btn btn-success fw-bold shadow-sm px-3 rounded-pill hover-efecto" 
                    onClick={() => abrirFormModal()}
                  >
                    <i className="bi bi-person-plus-fill me-1"></i>Nuevo
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="card-body p-0">
            {loading ? (
              <div className="d-flex justify-content-center align-items-center py-5">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light text-muted small">
                    <tr>
                      <th className="ps-4" style={{ width: '40px' }}>
                        <div className="form-check">
                          <input 
                            className="form-check-input border-secondary" 
                            type="checkbox" 
                            title="Seleccionar visibles permitidos"
                            checked={
                              usuariosPaginados.length > 0 && 
                              usuariosPaginados.filter(u => u.id_escuela === 'ambas' ? (canDeleteSB && canDeleteLB) : (u.id_escuela === 'sb' ? canDeleteSB : canDeleteLB)).length > 0 &&
                              usuariosPaginados.filter(u => u.id_escuela === 'ambas' ? (canDeleteSB && canDeleteLB) : (u.id_escuela === 'sb' ? canDeleteSB : canDeleteLB)).every(u => selectedUsers.includes(u.id_usuario || u.id || u.cedula))
                            }
                            onChange={(e) => {
                              const deletableUsers = usuariosPaginados.filter(u => u.id_escuela === 'ambas' ? (canDeleteSB && canDeleteLB) : (u.id_escuela === 'sb' ? canDeleteSB : canDeleteLB));
                              if (e.target.checked) {
                                const newSelection = [...selectedUsers];
                                deletableUsers.forEach(u => {
                                  const uid = u.id_usuario || u.id || u.cedula;
                                  if (!newSelection.includes(uid)) newSelection.push(uid);
                                });
                                setSelectedUsers(newSelection);
                              } else {
                                const idsToRemove = deletableUsers.map(u => u.id_usuario || u.id || u.cedula);
                                setSelectedUsers(selectedUsers.filter(id => !idsToRemove.includes(id)));
                              }
                            }}
                          />
                        </div>
                      </th>
                      <th>Cédula</th>
                      <th>Escuela</th>
                      <th>Nombre Completo</th>
                      <th>Rol en Sistema</th>
                      <th>Cargo</th>
                      <th>Estado</th>
                      <th className="text-end pe-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosPaginados.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center p-4 text-muted">
                          <i className="bi bi-people fs-2 d-block mb-2"></i>
                          No hay usuarios que coincidan con la búsqueda.
                        </td>
                      </tr>
                    ) : (
                      usuariosPaginados.map(u => {
                        const canEditU = u.id_escuela === 'ambas' ? (canCreateSB && canCreateLB) : (u.id_escuela === 'sb' ? canCreateSB : canCreateLB);
                        const canDeleteU = u.id_escuela === 'ambas' ? (canDeleteSB && canDeleteLB) : (u.id_escuela === 'sb' ? canDeleteSB : canDeleteLB);
                        const uid = u.id_usuario || u.id || u.cedula;

                        return (
                          <tr key={uid} className={`align-middle hover-efecto ${selectedUsers.includes(uid) ? 'table-danger bg-opacity-10' : ''}`}>
                            <td className="ps-4">
                              <div className="form-check">
                                <input 
                                  className="form-check-input border-secondary" 
                                  type="checkbox" 
                                  disabled={!canDeleteU}
                                  checked={selectedUsers.includes(uid)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedUsers([...selectedUsers, uid]);
                                    } else {
                                      setSelectedUsers(selectedUsers.filter(id => id !== uid));
                                    }
                                  }}
                                />
                              </div>
                            </td>
                            <td className="fw-bold">{u.cedula}</td>
                            <td>
                              {u.id_escuela === 'lb' && <span className="badge bg-primary bg-opacity-10 text-primary border border-primary"><i className="bi bi-building me-1"></i>LB</span>}
                              {u.id_escuela === 'sb' && <span className="badge bg-success bg-opacity-10 text-success border border-success"><i className="bi bi-building me-1"></i>SB</span>}
                              {u.id_escuela === 'ambas' && <span className="badge bg-dark bg-opacity-10 text-dark border border-dark"><i className="bi bi-buildings me-1"></i>Ambas</span>}
                            </td>
                            <td>
                              <div className="fw-bold text-dark">{toTitulo(u.nombre_completo)}</div>
                              <div className="small text-muted">{u.email || 'Sin correo'}</div>
                            </td>
                            <td><span className="badge bg-light text-dark border">{u.rol}</span></td>
                            <td><span className="text-muted small"><i className="bi bi-briefcase me-1"></i>{u.cargo || 'Sin asignar'}</span></td>
                            <td>
                              {u.estado === 'Activo' ? (
                                <span className="badge bg-success bg-opacity-10 text-success border border-success">Activo</span>
                              ) : (
                                <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">{u.estado}</span>
                              )}
                            </td>
                            <td className="text-end pe-4 text-nowrap">
                              {canEditU && (
                                <button 
                                  className="btn btn-sm btn-light text-primary shadow-sm border me-1" 
                                  onClick={() => abrirFormModal(u)} 
                                  title="Editar Usuario"
                                >
                                  <i className="bi bi-pencil-square"></i>
                                </button>
                              )}
                              {canDeleteU && (
                                <button 
                                  className="btn btn-sm btn-light text-warning shadow-sm border me-1" 
                                  onClick={() => resetearClave(u)} 
                                  title="Resetear Clave a Cédula"
                                >
                                  <i className="bi bi-key-fill"></i>
                                </button>
                              )}
                              {canDeleteU && (
                                <button 
                                  className="btn btn-sm btn-light text-danger shadow-sm border" 
                                  onClick={() => eliminarUsuario(u)} 
                                  title="Eliminar Usuario"
                                >
                                  <i className="bi bi-trash3-fill"></i>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="card-footer bg-white border-top p-3 d-flex justify-content-center rounded-bottom-4">
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${paginaActual === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => cambiarPagina(paginaActual - 1)}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {obtenerRangoPaginacion().map((p, index) => (
                  <li key={index} className={`page-item ${paginaActual === p ? 'active' : ''} ${p === '...' ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => p !== '...' && cambiarPagina(p as number)}
                      style={p === '...' ? { cursor: 'default', pointerEvents: 'none' } : {}}
                    >
                      {p}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => cambiarPagina(paginaActual + 1)}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* USER MODAL (ADD / EDIT) */}
      {showUserModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header bg-success text-white border-0 rounded-top-4 p-4">
                <h5 className="modal-title fw-bold">
                  {editingUser ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowUserModal(false)}></button>
              </div>
              <form onSubmit={guardarUsuario}>
                <div className="modal-body p-4 bg-light text-start">
                  <div className="mb-3">
                    <label className="small fw-bold mb-1 text-muted">Cédula de Identidad <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      className="form-control input-moderno m-0" 
                      placeholder="Ej: 12345678" 
                      value={formCedula} 
                      onChange={(e) => setFormCedula(e.target.value)}
                      readOnly={!!editingUser}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="small fw-bold mb-1 text-muted">Nombre Completo <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      className="form-control input-moderno m-0" 
                      placeholder="Ej: Juan Pérez" 
                      value={formNombre} 
                      onChange={(e) => handleTituloChange(e, setFormNombre)}
                    />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="small fw-bold mb-1 text-muted">Escuela Asignada <span className="text-danger">*</span></label>
                      <select 
                        className="form-select input-moderno m-0"
                        value={formEscuela}
                        onChange={(e) => setFormEscuela(e.target.value)}
                      >
                        {canCreateLB && <option value="lb">UE Libertador Bolívar</option>}
                        {canCreateSB && <option value="sb">UE Santa Bárbara</option>}
                        {canCreateLB && canCreateSB && <option value="ambas">Ambas Instituciones</option>}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="small fw-bold mb-1 text-muted">Rol en el Sistema <span className="text-danger">*</span></label>
                      <select 
                        className="form-select input-moderno m-0"
                        value={formRol}
                        onChange={(e) => setFormRol(e.target.value)}
                        required
                      >
                        <option value="">Seleccione rol...</option>
                        {rolesDisponibles.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="small fw-bold mb-1 text-muted">Correo Electrónico</label>
                      <input 
                        type="email" 
                        className="form-control input-moderno m-0" 
                        placeholder="correo@ejemplo.com" 
                        value={formEmail} 
                        onChange={(e) => setFormEmail(e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="small fw-bold mb-1 text-muted">Teléfono Celular</label>
                      <input 
                        type="text" 
                        className="form-control input-moderno m-0" 
                        placeholder="Ej. 0412-1234567" 
                        value={formTelefono} 
                        onChange={(e) => setFormTelefono(formatPhoneNumber(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="small fw-bold mb-1 text-muted">Estado de la Cuenta <span className="text-danger">*</span></label>
                      <select 
                        className="form-select input-moderno m-0"
                        value={formEstado}
                        onChange={(e) => setFormEstado(e.target.value)}
                      >
                        <option value="Activo">Activo</option>
                        <option value="Bloqueado">Bloqueado</option>
                        <option value="Requiere Reseteo">Requiere Reseteo</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="small fw-bold mb-1 text-muted">Primer Ingreso (Wizard) <span className="text-danger">*</span></label>
                      <select 
                        className="form-select input-moderno m-0"
                        value={formPrimerIngreso}
                        onChange={(e) => setFormPrimerIngreso(e.target.value)}
                      >
                        <option value="true">Sí (Forzar wizard)</option>
                        <option value="false">No (Omitir wizard)</option>
                      </select>
                    </div>
                  </div>
                  <small className="text-muted d-block mt-2">
                    <i className="bi bi-info-circle text-primary me-1"></i>
                    Nota: El Cargo institucional se asigna desde el módulo de Organización Escolar.
                  </small>
                </div>
                <div className="modal-footer bg-white border-0">
                  <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setShowUserModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-success rounded-pill px-4">
                    {editingUser ? 'Actualizar' : 'Crear Usuario'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* RESETEOS MODAL */}
      {showReseteosModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header bg-warning text-dark border-0 rounded-top-4 p-4">
                <h5 className="modal-title fw-bold"><i className="bi bi-exclamation-triangle-fill me-2"></i>Solicitudes de Reseteo Total</h5>
                <button type="button" className="btn-close" onClick={() => setShowReseteosModal(false)}></button>
              </div>
              <div className="modal-body p-4 bg-light text-start">
                <div className="alert alert-info border-0 shadow-sm rounded-3">
                  <i className="bi bi-info-circle-fill me-2"></i> Estos usuarios han solicitado un borrado completo de su perfil porque no pueden recuperar su cuenta. Aprobar el reseteo borrará su clave, preguntas de seguridad, teléfono y correo, permitiéndoles ingresar de nuevo usando su cédula.
                </div>
                <div className="table-responsive bg-white rounded-3 shadow-sm border">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light text-muted small">
                      <tr>
                        <th className="ps-3 py-3">Usuario</th>
                        <th>Escuela</th>
                        <th>Rol</th>
                        <th className="text-center pe-3">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {solicitudesReseteo.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-4 text-muted">
                            <i className="bi bi-check-circle fs-2 text-success d-block mb-2"></i>
                            No hay solicitudes de reseteo pendientes.
                          </td>
                        </tr>
                      ) : (
                        solicitudesReseteo.map(u => (
                          <tr key={u.id_usuario || u.id || u.cedula} className="align-middle">
                            <td className="ps-3">
                              <div className="fw-bold text-dark">{u.nombre_completo}</div>
                              <div className="small text-muted">{u.cedula}</div>
                            </td>
                            <td>
                              {u.id_escuela === 'lb' && <span className="badge bg-primary bg-opacity-10 text-primary border border-primary">LB</span>}
                              {u.id_escuela === 'sb' && <span className="badge bg-success bg-opacity-10 text-success border border-success">SB</span>}
                              {u.id_escuela === 'ambas' && <span className="badge bg-dark bg-opacity-10 text-dark border border-dark">Ambas</span>}
                            </td>
                            <td><span className="badge bg-light text-dark border">{u.rol}</span></td>
                            <td className="text-center">
                              <button className="btn btn-sm btn-success fw-bold shadow-sm" onClick={() => aprobarReseteo(u)}>
                                <i className="bi bi-check2-circle me-1"></i>Aprobar
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer bg-white border-0">
                <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setShowReseteosModal(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CARGA MASIVA MODAL */}
      {showCargaModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header bg-dark text-white border-0 rounded-top-4 p-4">
                <h5 className="modal-title fw-bold"><i className="bi bi-cloud-arrow-up-fill me-2"></i>Carga Masiva (Excel o Linux CSV)</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCargaModal(false)}></button>
              </div>
              <div className="modal-body p-4 bg-light text-start">
                <p className="small text-muted mb-2">1. Sube un archivo <b>Excel (.xlsx)</b> o <b>Linux (.ods / .csv)</b>. Columnas requeridas: Cédula, Nombre, Rol. Opcional: Escuela_Codigo (sb, lb, ambas).</p>
                <div className="d-flex gap-2 mb-3">
                  <button className="btn btn-sm btn-outline-success fw-bold flex-fill" onClick={descargarPlantillaExcel}>
                    <i className="bi bi-file-earmark-excel-fill me-1"></i> Plantilla Excel (.xlsx)
                  </button>
                  <button className="btn btn-sm btn-outline-secondary fw-bold flex-fill" onClick={descargarPlantillaCSV}>
                    <i className="bi bi-filetype-csv me-1"></i> Plantilla Linux (.csv)
                  </button>
                </div>
                <p className="small text-muted mb-2">2. Selecciona tu archivo completo:</p>
                <input 
                  type="file" 
                  className="form-control border-success" 
                  accept=".xlsx, .xls, .ods, .csv" 
                  onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)}
                  disabled={cargaProgress.procesando}
                />
                
                {cargaProgress.procesando && (
                  <div className="mt-3 animate__animated animate__fadeIn">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="small fw-bold text-muted">Procesando registros...</span>
                      <span className="small fw-bold text-primary">{Math.round((cargaProgress.actual / cargaProgress.total) * 100) || 0}%</span>
                    </div>
                    <div className="progress rounded-pill shadow-sm" style={{ height: '10px' }}>
                      <div 
                        className="progress-bar progress-bar-striped progress-bar-animated bg-success" 
                        role="progressbar" 
                        style={{ width: `${(cargaProgress.actual / cargaProgress.total) * 100}%`, transition: 'width 0.2s ease' }}
                      ></div>
                    </div>
                    <div className="text-center mt-1 small text-muted">
                      {cargaProgress.actual} de {cargaProgress.total} usuarios validados insertados
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer bg-white border-0">
                <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setShowCargaModal(false)} disabled={cargaProgress.procesando}>Cancelar</button>
                <button 
                  type="button" 
                  className="btn btn-success rounded-pill px-4" 
                  disabled={!csvFile || cargaProgress.procesando} 
                  onClick={procesarCSV}
                >
                  {cargaProgress.procesando ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Cargando...</>
                  ) : (
                    <><i className="bi bi-cloud-upload-fill me-1"></i> Procesar</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
