import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';
import { formatPhoneNumber } from '../../lib/formatters';


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
  const [searchQuery, setSearchQuery] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [showReseteosModal, setShowReseteosModal] = useState(false);
  const [solicitudesReseteo, setSolicitudesReseteo] = useState<any[]>([]);

  const [showCargaModal, setShowCargaModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

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
    return coincideTexto && coincideEscuela;
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
        const { error } = await supabase
          .from('usuarios')
          .update(payload)
          .eq('id_usuario', editingUser.id_usuario);

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
      cargarUsuarios();
    } catch (e) {
      console.error(e);
      if (Swal) Swal.fire('Error', 'No se pudo guardar los datos.', 'error');
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
          const { error } = await supabase
            .from('usuarios')
            .update({
              clave: u.cedula,
              primer_ingreso: true,
              intentos_fallidos: 0,
              bloqueo_hasta: null,
              estado: 'Activo'
            })
            .eq('id_usuario', u.id_usuario);

          if (error) throw error;
          Swal.fire('¡Contraseña Reseteada!', 'La contraseña ha vuelto a ser la cédula.', 'success');
          auditar('Gestión de Usuarios', 'Resetear Clave', `Reinició contraseña de: ${u.cedula}`);
          cargarUsuarios();
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo resetear la contraseña.', 'error');
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
      text: "Esta acción es definitiva y borrará la cuenta permanentemente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase
            .from('usuarios')
            .delete()
            .eq('id_usuario', u.id_usuario);

          if (error) throw error;
          Swal.fire('¡Eliminado!', 'El usuario ha sido eliminado.', 'success');
          auditar('Gestión de Usuarios', 'Eliminar Usuario', `Se eliminó al usuario: ${u.nombre_completo} (C.I. ${u.cedula})`);
          cargarUsuarios();
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo eliminar al usuario.', 'error');
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

          const { error } = await supabase
            .from('usuarios')
            .update(payload)
            .eq('id_usuario', u.id_usuario);

          if (error) throw error;
          Swal.fire('¡Reseteo Aprobado!', `La cuenta de ${u.nombre_completo} ha sido restablecida exitosamente.`, 'success');
          auditar('Gestión de Usuarios', 'Aprobar Reseteo Total', `Se borró la configuración de la cuenta de: ${u.cedula}`);
          
          setShowReseteosModal(false);
          cargarUsuarios();
        } catch (e) {
          console.error(e);
          Swal.fire('Error', 'No se pudo aplicar el reseteo.', 'error');
        }
        setLoading(false);
      }
    });
  };

  // Carga Masiva logic
  const descargarPlantilla = () => {
    let csvContent = "Cedula;Nombre_Completo;Rol\n";
    csvContent += "V12345678;Perez Juan;Docente\n";
    csvContent += "V98765432;Gomez Maria;Coordinador\n";
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Plantilla_Usuarios_SIGAE.csv";
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

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      let text = e.target.result;
      let lines = text.split(/\r?\n/);
      let validos: any[] = [];
      let rechazados: any[] = [];
      let startIndex = 0;

      if (lines.length > 0 && (lines[0].toLowerCase().includes('cedula') || lines[0].toLowerCase().includes('nombre'))) {
        startIndex = 1;
      }

      for (let i = startIndex; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        let row = line.split(/[;,]/);
        if (row.length < 3) {
          rechazados.push({ linea: i + 1, datos: line, motivo: "Faltan columnas obligatorias (Deben ser 3: Cédula, Nombre, Rol)." });
          continue;
        }
        let cedula = row[0].trim();
        let nombre = row[1].trim();
        let rol = row[2].trim();

        if (!cedula || !nombre || !rol) {
          rechazados.push({ linea: i + 1, datos: line, motivo: "Cédula, Nombre o Rol están en blanco." });
          continue;
        }

        let rolExiste = rolesDisponibles.find(r => r.toLowerCase() === rol.toLowerCase());
        if (!rolExiste) {
          rechazados.push({ linea: i + 1, datos: line, motivo: `El rol '${rol}' no está creado en el panel de Privilegios.` });
          continue;
        }

        validos.push({
          cedula: cedula,
          nombre_completo: nombre,
          rol: rolExiste,
          clave: cedula,
          primer_ingreso: true,
          estado: 'Activo',
          solicito_reseteo: false,
          id_escuela: localStorage.getItem('sigae_escuela_codigo') || 'sb'
        });
      }

      if (validos.length === 0 && rechazados.length === 0) {
        if (Swal) Swal.fire('Error', 'El archivo está vacío o tiene formato inválido.', 'error');
        return;
      }

      setLoading(true);
      let insertados = 0;
      let actualizados = 0;
      try {
        if (validos.length > 0) {
          const cedulasNuevas = validos.map(v => String(v.cedula));
          const { data: existentes } = await supabase.from('usuarios').select('cedula').in('cedula', cedulasNuevas);
          const cedulasBD = (existentes || []).map(ex => String(ex.cedula));

          let registrosIns: any[] = [];
          let registrosUpd: any[] = [];

          validos.forEach(v => {
            if (cedulasBD.includes(String(v.cedula))) {
              registrosUpd.push(v);
            } else {
              registrosIns.push(v);
            }
          });

          if (registrosIns.length > 0) {
            const { error } = await supabase.from('usuarios').insert(registrosIns);
            if (error) throw error;
            insertados = registrosIns.length;
          }

          if (registrosUpd.length > 0) {
            const { error } = await supabase.from('usuarios').upsert(registrosUpd, { onConflict: 'cedula' });
            if (error) throw error;
            actualizados = registrosUpd.length;
          }
        }

        setShowCargaModal(false);
        setCsvFile(null);

        let htmlResumen = `
          <div class="text-start">
            <p class="mb-3 text-muted">Se leyeron <b>${validos.length + rechazados.length}</b> filas del archivo.</p>
            <div class="bg-light p-3 border rounded-3 mb-2">
              <p class="text-success m-0 fw-bold"><i class="bi bi-check-circle-fill me-2"></i>Nuevos agregados: ${insertados}</p>
              <p class="text-info m-0 mt-2 fw-bold"><i class="bi bi-arrow-repeat me-2"></i>Actualizados: ${actualizados}</p>
              <p class="text-danger m-0 mt-2 fw-bold"><i class="bi bi-x-circle-fill me-2"></i>Rechazados: ${rechazados.length}</p>
            </div>
          </div>
        `;

        if (Swal) {
          Swal.fire({
            title: 'Resumen de Carga',
            html: htmlResumen,
            icon: rechazados.length > 0 ? 'warning' : 'success',
            showCancelButton: rechazados.length > 0,
            confirmButtonText: 'Entendido',
            cancelButtonText: 'Descargar Errores',
            cancelButtonColor: '#dc3545',
            confirmButtonColor: '#10B981',
            reverseButtons: true
          }).then((res: any) => {
            if (res.dismiss === Swal.DismissReason.cancel && rechazados.length > 0) {
              descargarRechazados(rechazados);
            }
          });
        }

        cargarUsuarios();
        auditar('Gestión de Usuarios', 'Carga Masiva', `Insertados: ${insertados}, Actualizados: ${actualizados}, Rechazados: ${rechazados.length}`);
      } catch (err: any) {
        console.error(err);
        if (Swal) Swal.fire('Error', 'Falla de base de datos durante carga masiva.', 'error');
      }
      setLoading(false);
    };
    reader.readAsText(csvFile);
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
              <div className="col-md-3">
                <label className="small fw-bold text-muted mb-1"><i className="bi bi-building me-1"></i>Filtrar Escuela</label>
                <select 
                  className="form-select input-moderno border-success fw-bold" 
                  value={filtroEscuela}
                  onChange={(e) => { setFiltroEscuela(e.target.value); setPaginaActual(1); }}
                >
                  {canUsersSB && canUsersLB && <option value="TODAS">Ambas Escuelas</option>}
                  {canUsersLB && <option value="lb">UE Libertador Bolívar</option>}
                  {canUsersSB && <option value="sb">UE Santa Bárbara</option>}
                </select>
              </div>
              <div className="col-md-3">
                <label className="small fw-bold text-muted mb-1"><i className="bi bi-search me-1"></i>Buscar Usuario</label>
                <input 
                  type="text" 
                  className="input-moderno form-control w-100" 
                  placeholder="Cédula, nombre o rol..." 
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPaginaActual(1); }}
                />
              </div>
              <div className="col-md-6 text-md-end">
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
                      <th className="ps-4">Cédula</th>
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
                        <td colSpan={7} className="text-center p-4 text-muted">
                          <i className="bi bi-people fs-2 d-block mb-2"></i>
                          No hay usuarios que coincidan con la búsqueda.
                        </td>
                      </tr>
                    ) : (
                      usuariosPaginados.map(u => {
                        const canEditU = u.id_escuela === 'ambas' ? (canCreateSB && canCreateLB) : (u.id_escuela === 'sb' ? canCreateSB : canCreateLB);
                        const canDeleteU = u.id_escuela === 'ambas' ? (canDeleteSB && canDeleteLB) : (u.id_escuela === 'sb' ? canDeleteSB : canDeleteLB);

                        return (
                          <tr key={u.id_usuario} className="align-middle hover-efecto">
                            <td className="fw-bold ps-4">{u.cedula}</td>
                            <td>
                              {u.id_escuela === 'lb' && <span className="badge bg-primary bg-opacity-10 text-primary border border-primary"><i className="bi bi-building me-1"></i>LB</span>}
                              {u.id_escuela === 'sb' && <span className="badge bg-success bg-opacity-10 text-success border border-success"><i className="bi bi-building me-1"></i>SB</span>}
                              {u.id_escuela === 'ambas' && <span className="badge bg-dark bg-opacity-10 text-dark border border-dark"><i className="bi bi-buildings me-1"></i>Ambas</span>}
                            </td>
                            <td>
                              <div className="fw-bold text-dark">{u.nombre_completo}</div>
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
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
                  <li key={p} className={`page-item ${paginaActual === p ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => cambiarPagina(p)}>{p}</button>
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
                      onChange={(e) => setFormNombre(e.target.value)}
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
                          <tr key={u.id_usuario} className="align-middle">
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
                <h5 className="modal-title fw-bold"><i className="bi bi-cloud-arrow-up-fill me-2"></i>Carga Masiva CSV</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCargaModal(false)}></button>
              </div>
              <div className="modal-body p-4 bg-light text-start">
                <p className="small text-muted mb-2">1. Sube un archivo <b>CSV (separado por punto y coma o comas)</b> sin encabezado, o usa nuestra plantilla.</p>
                <button className="btn btn-sm btn-outline-success fw-bold mb-3 w-100" onClick={descargarPlantilla}>
                  <i className="bi bi-download me-1"></i> Descargar Plantilla Modelo (3 Columnas)
                </button>
                <p className="small text-muted mb-2">2. Selecciona tu archivo completo:</p>
                <input 
                  type="file" 
                  className="form-control border-success" 
                  accept=".csv" 
                  onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)}
                />
              </div>
              <div className="modal-footer bg-white border-0">
                <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setShowCargaModal(false)}>Cancelar</button>
                <button 
                  type="button" 
                  className="btn btn-success rounded-pill px-4" 
                  disabled={!csvFile} 
                  onClick={procesarCSV}
                >
                  <i className="bi bi-cloud-upload-fill me-1"></i> Procesar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
