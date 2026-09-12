import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { auditar } from '../../lib/audit';
import { usePermisos } from '../../hooks/usePermisos';
import { formatPhoneNumber, toTitulo } from '../../lib/formatters';
import { ChamiloBreadcrumb, ChamiloHelpCallout } from '../../components/chamilo';
import { reproducirVozBienvenida, detenerTodosLosSonidos } from '../../components/ModalAsignacionSorpresa';

const handleTituloChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  setter: (val: string) => void
) => {
  const raw = e.target.value;
  const endsWithSpace = raw.endsWith(' ');
  const converted = toTitulo(raw.trimEnd());
  setter(endsWithSpace ? converted + ' ' : converted);
};

interface Visitante {
  id_invitado: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  correo: string | null;
  telefono: string | null;
  razon_visita: string;
  escuela_id: string;
  created_at: string;
}

export const GestionUsuarios = () => {
  const navigate = useNavigate();
  const { tienePermiso, tienePermisoEnEscuela, user, loading: permLoading } = usePermisos();

  // Pestaña Principal (Usuarios / Visitantes e Invitados / Reseteos)
  const [tabPrincipal, setTabPrincipal] = useState<'usuarios' | 'visitantes' | 'reseteos'>('usuarios');

  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesDisponibles, setRolesDisponibles] = useState<string[]>([]);

  // Permiso de emulación / virtualización de usuarios
  const canEmular = user && (
    ['SuperAdmin', 'Administrador', 'Administradora', 'Director', 'Directora', 'Subdirector', 'Subdirectora'].includes(user.rol) ||
    tienePermiso('Función: Emulación de Roles', 'ver') ||
    tienePermiso('Roles y Privilegios', 'ver')
  );

  // Permisos por escuela para el módulo
  const canUsersSB = tienePermisoEnEscuela('sb', 'Gestión de Usuarios', 'ver');
  const canUsersLB = tienePermisoEnEscuela('lb', 'Gestión de Usuarios', 'ver');
  const pUsuarios = canUsersSB || canUsersLB;

  const canCreateSB = tienePermisoEnEscuela('sb', 'Gestión de Usuarios', 'crear');
  const canCreateLB = tienePermisoEnEscuela('lb', 'Gestión de Usuarios', 'crear');
  const canCreateAny = canCreateSB || canCreateLB;

  const canDeleteSB = tienePermisoEnEscuela('sb', 'Gestión de Usuarios', 'eliminar');
  const canDeleteLB = tienePermisoEnEscuela('lb', 'Gestión de Usuarios', 'eliminar');

  // Filtering & Pagination Usuarios
  const [filtroEscuela, setFiltroEscuela] = useState('TODAS');
  const [filtroRol, setFiltroRol] = useState('TODOS');
  const [filtroEstudiantes, setFiltroEstudiantes] = useState<'TODOS' | 'CON_ESTUDIANTES' | 'SIN_ESTUDIANTES' | 'AMBAS_ESCUELAS'>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  // Vinculaciones de estudiantes
  const [vinculacionesMap, setVinculacionesMap] = useState<Record<string, any[]>>({});
  const [usuarioDetalleEstudiantes, setUsuarioDetalleEstudiantes] = useState<any | null>(null);

  // Modal states Usuarios
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

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
  const [formClave, setFormClave] = useState('');

  // ── ESTADOS PARA VISITANTES E INVITADOS ──
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [loadingVisitantes, setLoadingVisitantes] = useState(false);
  const [searchVisitantes, setSearchVisitantes] = useState('');
  const [filtroFechaVisitantes, setFiltroFechaVisitantes] = useState<'todas' | 'hoy' | 'semana' | 'mes'>('todas');
  const [escuelaVisitante, setEscuelaVisitante] = useState<string>(localStorage.getItem('sigae_escuela_codigo') || 'sb');

  // Check-in Form Visitantes
  const [vCedula, setVCedula] = useState('');
  const [vNombres, setVNombres] = useState('');
  const [vApellidos, setVApellidos] = useState('');
  const [vCorreo, setVCorreo] = useState('');
  const [vTelefono, setVTelefono] = useState('');
  const [vRazon, setVRazon] = useState('');
  const [vRegistrando, setVRegistrando] = useState(false);
  const [vBuscando, setVBuscando] = useState(false);
  const [vAutocompletado, setVAutocompletado] = useState(false);
  const [vVisitasAnteriores, setVVisitasAnteriores] = useState(0);

  // Print Pass & Edit Visitante
  const [selectedVisitantePrint, setSelectedVisitantePrint] = useState<Visitante | null>(null);
  const [editVisitante, setEditVisitante] = useState<Visitante | null>(null);
  const [editVNombres, setEditVNombres] = useState('');
  const [editVApellidos, setEditVApellidos] = useState('');
  const [editVCorreo, setEditVCorreo] = useState('');
  const [editVTelefono, setEditVTelefono] = useState('');
  const [editVRazon, setEditVRazon] = useState('');
  const [editandoVisitante, setEditandoVisitante] = useState(false);

  const Swal = (window as any).Swal;

  useEffect(() => {
    if (!permLoading && pUsuarios) {
      cargarRoles();
      cargarUsuarios();
      cargarSolicitudesReseteo();
      cargarVisitantes();

      const userChannel = supabase.channel('gestion_usuarios_page_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'usuarios' }, () => {
          cargarUsuarios();
          cargarSolicitudesReseteo();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'invitados' }, () => {
          cargarVisitantes();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(userChannel);
      };
    }
  }, [permLoading, pUsuarios, escuelaVisitante]);

  const cargarRoles = async () => {
    try {
      const { data } = await supabase.from('roles').select('nombre');
      if (data) setRolesDisponibles(data.map(r => r.nombre));
    } catch (e) {
      console.error("Error cargando roles", e);
    }
  };

  const limpiarCedula = (ced: any) => String(ced || '').replace(/\D/g, '');

  const normalizarCedula = (ced: any) => {
    if (!ced) return { raw: '', clean: '', digits: '', noZeros: '' };
    const str = String(ced).trim().toUpperCase();
    const clean = str.replace(/[\.\s\-]/g, '');
    const digits = str.replace(/\D/g, '');
    const noZeros = digits.replace(/^0+/, '');
    return { raw: str, clean, digits, noZeros };
  };

  const getEstudiantesDeUsuario = (u: any, vMap: Record<string, any[]>) => {
    if (!u || !vMap) return [];
    const { raw, clean, digits, noZeros } = normalizarCedula(u.cedula);
    const nomKey = 'nom_' + String(u.nombre_completo || '').trim().toLowerCase().replace(/\s+/g, ' ');

    const keysToTry = new Set<string>();
    if (raw) keysToTry.add(raw);
    if (clean) keysToTry.add(clean);
    if (digits) {
      keysToTry.add(digits);
      keysToTry.add(`V-${digits}`);
      keysToTry.add(`V${digits}`);
      keysToTry.add(`E-${digits}`);
      keysToTry.add(`E${digits}`);
    }
    if (noZeros) {
      keysToTry.add(noZeros);
      keysToTry.add(`V-${noZeros}`);
      keysToTry.add(`V${noZeros}`);
      keysToTry.add(`E-${noZeros}`);
      keysToTry.add(`E${noZeros}`);
    }
    if (nomKey.length > 8) {
      keysToTry.add(nomKey);
    }

    const unicos: Record<string, any> = {};
    keysToTry.forEach(k => {
      const list = vMap[k] || [];
      list.forEach(est => {
        const estId = (est.cedula_estudiante && est.cedula_estudiante !== 'Sin Cédula')
          ? est.cedula_estudiante
          : `${est.nombres_estudiante}_${est.apellidos_estudiante}_${est.grado_actual}`;
        if (!unicos[estId]) {
          unicos[estId] = est;
        }
      });
    });

    return Object.values(unicos);
  };

  const getEscuelaDeUsuario = (u: any, vMap: Record<string, any[]>) => {
    if (!u) return 'sb';
    const uEsc = String(u.id_escuela || '').trim().toLowerCase();
    if (uEsc === 'ambas' || uEsc === 'todas' || uEsc === 'global') return 'ambas';

    const listaEst = getEstudiantesDeUsuario(u, vMap);
    if (listaEst && listaEst.length > 0) {
      const escuelas = Array.from(new Set(
        listaEst
          .map((e: any) => {
            const cod = String(e.codigo_escuela || '').trim().toLowerCase();
            if (cod.includes('lb') || cod.includes('libertador') || cod.includes('bolivar')) return 'lb';
            if (cod.includes('sb') || cod.includes('santa') || cod.includes('barbara')) return 'sb';
            return cod;
          })
          .filter(Boolean)
      ));
      if (escuelas.includes('sb') && escuelas.includes('lb')) {
        return 'ambas';
      }
      if (escuelas.length === 1 && (escuelas[0] === 'sb' || escuelas[0] === 'lb')) {
        return escuelas[0];
      }
    }

    if (uEsc.includes('lb') || uEsc.includes('libertador') || uEsc.includes('bolivar')) return 'lb';
    if (uEsc.includes('sb') || uEsc.includes('santa') || uEsc.includes('barbara')) return 'sb';
    return 'sb';
  };

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nombre_completo', { ascending: true });

      if (error) throw error;

      try {
        // Carga paralela de todas las fuentes de vinculaciones y cupos
        const [chunk1, chunk2, chunk3, chunk4, cuposChunk] = await Promise.all([
          supabase.from('estudiantes_vinculaciones').select('*').range(0, 999),
          supabase.from('estudiantes_vinculaciones').select('*').range(1000, 1999),
          supabase.from('estudiantes_vinculaciones').select('*').range(2000, 2999),
          supabase.from('estudiantes_vinculaciones').select('*').range(3000, 3999),
          supabase.from('solicitudes_cupos').select('*').limit(2000)
        ]);

        let todosLosEstudiantes: any[] = [
          ...(chunk1.data || []),
          ...(chunk2.data || []),
          ...(chunk3.data || []),
          ...(chunk4.data || []),
          ...(cuposChunk.data || [])
        ];

        // Fallback e integración con LocalStorage
        const localKeys = ['sigae_estudiantes_vinculaciones', 'sigae_solicitudes_cupos', 'sigae_censo_alumnos', 'sigae_estudiantes_locales'];
        localKeys.forEach(k => {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                todosLosEstudiantes = [...todosLosEstudiantes, ...parsed];
              }
            } catch (e) {}
          }
        });

        const vMap: Record<string, any[]> = {};
        todosLosEstudiantes.forEach((v: any) => {
          const cedRep = v.cedula_representante || v.cedula_rep || v.ci_representante || v.cedulaRepresentante || '';
          const nomRep = v.nombres_representante || v.nombre_representante || v.nombresRep || v.representante || '';
          const apeRep = v.apellidos_representante || v.apellido_representante || v.apellidosRep || '';
          
          const cedEst = v.cedula_estudiante || v.cedula_alumno || v.ci_estudiante || v.cedula_escolar || v.cedula || 'Sin Cédula';
          const nomEst = v.nombres_estudiante || v.nombres_alumno || v.nombres || v.nombre || '';
          const apeEst = v.apellidos_estudiante || v.apellidos_alumno || v.apellidos || v.apellido || '';
          const grado = v.grado_actual || v.grado || v.ano_grado || 'Sin Grado';
          const seccion = v.seccion_actual || v.seccion || 'U';
          const escuela = v.codigo_escuela || v.id_escuela || v.escuela || 'sb';
          const telRep = v.telefono_representante || v.telefono_rep || v.telefono || '';

          const estItem = {
            cedula_estudiante: cedEst,
            nombres_estudiante: nomEst,
            apellidos_estudiante: apeEst,
            grado_actual: grado,
            seccion_actual: seccion,
            codigo_escuela: escuela,
            telefono_representante: telRep
          };

          if (cedRep) {
            const { raw, clean, digits, noZeros } = normalizarCedula(cedRep);
            const keys: string[] = [];
            if (raw) keys.push(raw);
            if (clean && clean !== raw) keys.push(clean);
            if (digits) {
              keys.push(digits);
              keys.push(`V-${digits}`);
              keys.push(`V${digits}`);
              keys.push(`E-${digits}`);
              keys.push(`E${digits}`);
            }
            if (noZeros && noZeros !== digits) {
              keys.push(noZeros);
              keys.push(`V-${noZeros}`);
              keys.push(`V${noZeros}`);
              keys.push(`E-${noZeros}`);
              keys.push(`E${noZeros}`);
            }

            keys.forEach(k => {
              if (!vMap[k]) vMap[k] = [];
              vMap[k].push(estItem);
            });
          }

          if (nomRep || apeRep) {
            const nomKey = 'nom_' + `${nomRep || ''} ${apeRep || ''}`.trim().toLowerCase().replace(/\s+/g, ' ');
            if (nomKey.length > 8) {
              if (!vMap[nomKey]) vMap[nomKey] = [];
              vMap[nomKey].push(estItem);
            }
          }
        });

        setVinculacionesMap(vMap);
      } catch (errVinc) {
        console.error("Error procesando vinculaciones:", errVinc);
      }

      setUsuarios(data || []);
    } catch (e: any) {
      console.error(e);
      if (Swal) Swal.fire('Error', 'No se pudieron cargar los usuarios.', 'error');
    }
    setLoading(false);
  };

  const cargarSolicitudesReseteo = async () => {
    try {
      const { data } = await supabase
        .from('usuarios')
        .select('*')
        .eq('solicito_reseteo', true);
      setSolicitudesReseteo(data || []);
    } catch (e) {
      console.error("Error cargando reseteos", e);
    }
  };

  // ── FUNCIÓN OFICIAL PARA ENVIAR WHATSAPP DE RESETEO TOTAL EJECUTADO ──
  const enviarWhatsAppReseteoEjecutado = (u: any) => {
    const ests = getEstudiantesDeUsuario(u, vinculacionesMap);
    const telVinc = ests.find(e => e.telefono_representante)?.telefono_representante;
    const telefono = u.telefono || telVinc || '';

    const esLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const baseUrl = esLocal ? 'https://app-delta-ten-80.vercel.app' : (typeof window !== 'undefined' ? window.location.origin : 'https://app-delta-ten-80.vercel.app');

    const mensaje = `*NOTIFICACIÓN OFICIAL SIGAE* 🔐\n\n*Estimado(a):* ${toTitulo(u.nombre_completo)} (C.I. ${u.cedula})\n\nLe informamos que su solicitud de *Reseteo Total de Credenciales* en la plataforma *SIGAE* ha sido *PROCESADA Y EJECUTADA EXITOSAMENTE*.\n\n📋 *Datos de Acceso Restablecidos:*\n• *Usuario:* ${u.cedula}\n• *Contraseña Temporal:* ${u.cedula}\n• *Estado de Cuenta:* Primer Ingreso (Reconfiguración de contraseña)\n\n👉 *Pasos para Ingresar:*\n1. Ingrese a la plataforma oficial: ${baseUrl}\n2. Coloque su número de cédula (${u.cedula}) en usuario y contraseña.\n3. Presione *Ingresar* y defina su nueva contraseña personal y preguntas de seguridad.\n\n*${u.id_escuela === 'lb' ? 'UE Libertador Bolívar' : 'UE Santa Bárbara'} - Dirección Ejecutiva de Producción Oriente*`;

    let telLimpio = String(telefono || '').replace(/\D/g, '');
    if (telLimpio.startsWith('0')) telLimpio = '58' + telLimpio.slice(1);
    else if (telLimpio.length === 10 && telLimpio.startsWith('4')) telLimpio = '58' + telLimpio;

    if (telLimpio.length >= 10) {
      window.open(`https://api.whatsapp.com/send?phone=${telLimpio}&text=${encodeURIComponent(mensaje)}`, '_blank');
    } else {
      if (Swal) {
        Swal.fire({
          title: 'Notificar por WhatsApp',
          html: `No se encontró un número registrado para <b>${toTitulo(u.nombre_completo)}</b>.<br>Ingresa el número de WhatsApp para enviar la confirmación de reseteo:`,
          input: 'text',
          inputPlaceholder: 'Ej: 04141234567',
          showCancelButton: true,
          confirmButtonColor: '#25D366',
          confirmButtonText: '<i class="bi bi-whatsapp me-1"></i> Enviar WhatsApp',
          cancelButtonText: 'Cancelar'
        }).then((inputRes: any) => {
          if (inputRes.isConfirmed && inputRes.value) {
            let t = inputRes.value.replace(/\D/g, '');
            if (t.startsWith('0')) t = '58' + t.slice(1);
            else if (t.length === 10 && t.startsWith('4')) t = '58' + t;
            if (t.length >= 10) {
              window.open(`https://api.whatsapp.com/send?phone=${t}&text=${encodeURIComponent(mensaje)}`, '_blank');
            }
          }
        });
      }
    }
  };

  // 0. Probar Audio de Bienvenida de la IA Sigma para un docente/usuario
  const handleProbarAudioDocente = async (usr: any) => {
    detenerTodosLosSonidos();

    let sexoDoc = usr.sexo || usr.genero || '';
    if (!sexoDoc && usr.cedula) {
      try {
        const { data: exp } = await supabase
          .from('expedientes_docentes')
          .select('sexo')
          .eq('usuario_cedula', usr.cedula)
          .maybeSingle();
        if (exp?.sexo) sexoDoc = exp.sexo;
      } catch (e) { }

      if (!sexoDoc) {
        try {
          const rawDemo = localStorage.getItem(`sigae_expediente_demo_${usr.cedula}`);
          if (rawDemo) {
            const pDemo = JSON.parse(rawDemo);
            if (pDemo.sexo) sexoDoc = pDemo.sexo;
          }
        } catch (e) { }
      }
    }

    const payloadDocente = {
      nombre_completo: usr.nombre_completo,
      rol: usr.rol,
      sexo: sexoDoc,
      cedula: usr.cedula
    };

    reproducirVozBienvenida(false, payloadDocente);

    if (Swal) {
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        showCloseButton: true,
        timer: 7000,
        timerProgressBar: true
      });
      Toast.fire({
        icon: 'info',
        title: `🔊 Reproduciendo bienvenida de Sigma para ${toTitulo(usr.nombre_completo)}`
      });
    }
  };

  // 1. Virtualizar Ingreso (Emular sesión completa de usuario específico)
  const handleVirtualizarIngreso = async (u: any) => {
    if (!canEmular) {
      if (Swal) Swal.fire('Sin Autorización', 'No tienes permisos para emular cuentas de usuario.', 'error');
      return;
    }

    if (Swal) {
      const result = await Swal.fire({
        title: `<div class="d-flex align-items-center justify-content-center gap-2 text-dark"><i class="bi bi-box-arrow-in-right text-primary"></i> <span>Virtualizar Ingreso</span></div>`,
        html: `
          <div class="text-start py-2">
            <p class="text-muted mb-2">Estás a punto de iniciar sesión como el usuario:</p>
            <div class="p-3 bg-light rounded-3 border mb-3">
              <div class="fw-bold text-dark fs-6">${toTitulo(u.nombre_completo)}</div>
              <div class="text-muted small">Cédula: <b>${u.cedula}</b> • Rol: <b>${u.rol}</b></div>
            </div>
            <div class="alert alert-warning py-2 px-3 small border-0 mb-0">
              <i class="bi bi-info-circle-fill me-1"></i> Podrás navegar por el sistema con sus permisos exactos. Podrás salir de la virtualización en cualquier momento desde la barra superior.
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="bi bi-play-circle-fill me-1"></i> Iniciar Sesión Virtual',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#6366f1',
        cancelButtonColor: '#64748b'
      });

      if (!result.isConfirmed) return;
    }

    const yaEmulando = localStorage.getItem('sigae_usuario_original_admin');
    if (!yaEmulando && user) {
      localStorage.setItem('sigae_usuario_original_admin', JSON.stringify(user));
    }

    const usuarioEmulado = {
      ...u,
      nombre: u.nombre_completo || u.nombre,
      es_emulacion: true,
      tipo_emulacion: 'usuario',
      usuario_emulado_nombre: u.nombre_completo || u.nombre,
      usuario_emulado_cedula: u.cedula,
      id_escuela: u.id_escuela || 'sb'
    };

    localStorage.setItem('usuario_sigae', JSON.stringify(usuarioEmulado));
    sessionStorage.setItem('sigae_emulacion_activa', 'true');
    localStorage.removeItem('sigae_cache_permisos');
    localStorage.removeItem('sigae_cache_full_permisos');

    if (u.id_escuela && u.id_escuela !== 'ambas' && u.id_escuela !== 'todas') {
      localStorage.setItem('sigae_escuela_codigo', u.id_escuela);
      localStorage.setItem('sigae_escuela_activa', u.id_escuela === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
    }

    auditar('Gestión de Usuarios', 'Virtualizar Ingreso', `El usuario ${user?.nombre} virtualizó la cuenta de: ${u.nombre_completo} (${u.cedula})`);
    window.location.href = '/';
  };

  // 2. Resetear Contraseña Individual y Solicitudes de Reseteo (con notificación WhatsApp oficial)
  const handleResetearClaveIndividual = async (u: any) => {
    const canDel = u.id_escuela === 'ambas' ? (canDeleteSB && canDeleteLB) : (u.id_escuela === 'sb' ? canDeleteSB : canDeleteLB);
    if (!canDel && !canCreateAny) {
      if (Swal) Swal.fire('Error', 'No tienes permisos para resetear contraseñas de esta escuela.', 'error');
      return;
    }

    if (!Swal) return;

    const res = await Swal.fire({
      title: `¿Resetear clave de ${toTitulo(u.nombre_completo)}?`,
      html: `La cuenta se restablecerá a <b>Primer Ingreso</b> con la contraseña temporal igual a su número de cédula (<b>${u.cedula}</b>).<br><br>Al finalizar, podrás notificar al usuario directamente por <b>WhatsApp</b> con el mensaje oficial de confirmación.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#64748b',
      confirmButtonText: '<i class="bi bi-key-fill me-1"></i> Sí, ejecutar reseteo',
      cancelButtonText: 'Cancelar'
    });

    if (!res.isConfirmed) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          clave: u.cedula,
          primer_ingreso: true,
          solicito_reseteo: false,
          estado: 'Activo'
        })
        .eq('cedula', u.cedula);

      if (error) throw error;

      auditar('Gestión de Usuarios', 'Resetear Contraseña', `Reseteó credenciales de: ${u.cedula} (${u.nombre_completo})`);

      // Enviar notificación a la app dirigida exclusivamente al usuario cuya contraseña fue reseteada
      try {
        await supabase.from('notificaciones_globales').insert([{
          escuela_codigo: u.id_escuela || 'todas',
          titulo: '🔑 Contraseña Restablecida con Éxito',
          cuerpo: `Estimado(a) ${toTitulo(u.nombre_completo || u.cedula)}, el administrador ha restablecido tu cuenta a Primer Ingreso. Ya puedes iniciar sesión utilizando tu número de cédula como contraseña temporal.`,
          tipo: `usuario:${u.cedula}`
        }]);
      } catch (eNotif) {
        console.warn('Error al insertar notificación personal de reseteo:', eNotif);
      }

      await Promise.all([cargarUsuarios(), cargarSolicitudesReseteo()]);

      Swal.fire({
        title: '¡Reseteo Total Ejecutado!',
        html: `La cuenta de <b>${toTitulo(u.nombre_completo)}</b> (C.I. ${u.cedula}) ha sido restablecida con éxito a <b>Primer Ingreso</b>.<br><br>¿Deseas enviar el mensaje oficial de WhatsApp indicando que la acción fue ejecutada?`,
        icon: 'success',
        showCancelButton: true,
        confirmButtonColor: '#25D366',
        cancelButtonColor: '#64748b',
        confirmButtonText: '<i class="bi bi-whatsapp me-1"></i> Enviar WhatsApp al Usuario',
        cancelButtonText: 'Cerrar'
      }).then((waRes: any) => {
        if (waRes.isConfirmed) {
          enviarWhatsAppReseteoEjecutado(u);
        }
      });
    } catch (e: any) {
      Swal.fire('Error', e?.message || 'No se pudo resetear la clave.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. Eliminar Usuario Individual
  const handleEliminarUsuarioIndividual = async (u: any) => {
    const canDel = u.id_escuela === 'ambas' ? (canDeleteSB && canDeleteLB) : (u.id_escuela === 'sb' ? canDeleteSB : canDeleteLB);
    if (!canDel) {
      if (Swal) Swal.fire('Error', 'No tienes permisos para eliminar usuarios de esta escuela.', 'error');
      return;
    }

    if (!Swal) return;

    Swal.fire({
      title: `¿Eliminar a ${toTitulo(u.nombre_completo)}?`,
      text: `Se eliminará la cuenta con cédula ${u.cedula}. Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (res: any) => {
      if (res.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase.from('usuarios').delete().eq('cedula', u.cedula);
          if (error) throw error;

          auditar('Gestión de Usuarios', 'Eliminar Usuario', `Eliminó usuario: ${u.cedula} (${u.nombre_completo})`);
          await cargarUsuarios();
          Swal.fire('¡Eliminado!', 'El usuario ha sido removido del sistema.', 'success');
        } catch (e: any) {
          Swal.fire('Error', e?.message || 'No se pudo eliminar.', 'error');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // ── MÉTODOS DE VISITANTES E INVITADOS ──
  const cargarVisitantes = async () => {
    setLoadingVisitantes(true);
    try {
      const { data, error } = await supabase
        .from('invitados')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVisitantes(data || []);
    } catch (e) {
      console.error("Error cargando visitantes:", e);
    } finally {
      setLoadingVisitantes(false);
    }
  };

  // Autocompletado con debounce por cédula en Visitantes
  useEffect(() => {
    if (vCedula.length < 6) {
      setVNombres('');
      setVApellidos('');
      setVCorreo('');
      setVTelefono('');
      setVAutocompletado(false);
      setVVisitasAnteriores(0);
      setVBuscando(false);
      return;
    }

    let cancelled = false;
    setVBuscando(true);

    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('invitados')
          .select('nombres, apellidos, correo, telefono')
          .eq('cedula', vCedula.trim())
          .order('created_at', { ascending: false })
          .limit(10);

        if (cancelled) return;

        if (!error && data && data.length > 0) {
          const ultimo = data[0];
          setVNombres(ultimo.nombres || '');
          setVApellidos(ultimo.apellidos || '');
          setVCorreo(ultimo.correo || '');
          setVTelefono(ultimo.telefono || '');
          setVAutocompletado(true);
          setVVisitasAnteriores(data.length);
        } else {
          setVAutocompletado(false);
          setVVisitasAnteriores(0);
        }
      } catch (e) {
        console.error('Error buscando cédula visitante:', e);
        if (!cancelled) setVAutocompletado(false);
      }
      if (!cancelled) setVBuscando(false);
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [vCedula]);

  const handleSaveVisitante = async (e: React.FormEvent) => {
    e.preventDefault();
    const cedula = vCedula.trim();
    const nombres = vNombres.trim();
    const apellidos = vApellidos.trim();
    const correo = vCorreo.trim() || null;
    const telefono = vTelefono.trim() || null;
    const razon_visita = vRazon.trim();

    if (!cedula || !nombres || !apellidos || !razon_visita) {
      if (Swal) Swal.fire("Atención", "Cédula, Nombres, Apellidos y Motivo son obligatorios.", "warning");
      return;
    }

    setVRegistrando(true);
    try {
      const payload = {
        cedula,
        nombres,
        apellidos,
        correo,
        telefono,
        razon_visita,
        escuela_id: escuelaVisitante
      };

      const { data, error } = await supabase
        .from('invitados')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      auditar('Gestión de Usuarios', 'Registrar Visitante', `Check-in de entrada para: ${nombres} ${apellidos} (C.I: ${cedula})`);

      setVCedula('');
      setVNombres('');
      setVApellidos('');
      setVCorreo('');
      setVTelefono('');
      setVRazon('');
      setVAutocompletado(false);
      setVVisitasAnteriores(0);

      await cargarVisitantes();

      if (Swal) {
        Swal.fire({
          title: "¡Visita Registrada!",
          text: "¿Deseas generar el pase de visitante ahora?",
          icon: "success",
          showCancelButton: true,
          confirmButtonColor: '#6366f1',
          cancelButtonColor: "#64748b",
          confirmButtonText: "Sí, ver pase",
          cancelButtonText: "No, continuar"
        }).then((result: any) => {
          if (result.isConfirmed && data) {
            setSelectedVisitantePrint(data);
          }
        });
      }
    } catch (err: any) {
      if (Swal) Swal.fire("Error al guardar", err?.message || "Error desconocido", "error");
    } finally {
      setVRegistrando(false);
    }
  };

  const handleOpenEditVisitante = (v: Visitante) => {
    setEditVisitante(v);
    setEditVNombres(v.nombres);
    setEditVApellidos(v.apellidos);
    setEditVCorreo(v.correo || '');
    setEditVTelefono(v.telefono || '');
    setEditVRazon(v.razon_visita);
  };

  const handleSaveEditVisitante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVisitante) return;
    setEditandoVisitante(true);
    try {
      const { error } = await supabase
        .from('invitados')
        .update({
          nombres: editVNombres.trim(),
          apellidos: editVApellidos.trim(),
          correo: editVCorreo.trim() || null,
          telefono: editVTelefono.trim() || null,
          razon_visita: editVRazon.trim()
        })
        .eq('id_invitado', editVisitante.id_invitado);

      if (error) throw error;
      auditar('Gestión de Usuarios', 'Editar Visitante', `Actualizó datos de: ${editVNombres} (C.I: ${editVisitante.cedula})`);
      await cargarVisitantes();
      setEditVisitante(null);
      if (Swal) Swal.fire('¡Actualizado!', 'Registro de visita actualizado.', 'success');
    } catch (err: any) {
      if (Swal) Swal.fire('Error', err?.message || 'No se pudo actualizar.', 'error');
    } finally {
      setEditandoVisitante(false);
    }
  };

  const handleDeleteVisitante = async (id: string, name: string) => {
    if (!Swal) return;

    Swal.fire({
      title: '¿Eliminar visita?',
      text: `Se borrará la entrada de "${name}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (res: any) => {
      if (res.isConfirmed) {
        try {
          const { error } = await supabase.from('invitados').delete().eq('id_invitado', id);
          if (error) throw error;
          auditar('Gestión de Usuarios', 'Eliminar Visitante', `Eliminó visita de: ${name}`);
          await cargarVisitantes();
          Swal.fire('Eliminado', 'Registro de visita eliminado.', 'success');
        } catch (err: any) {
          Swal.fire('Error', err?.message || 'No se pudo eliminar.', 'error');
        }
      }
    });
  };

  const handlePrintVisitorPass = () => {
    const printContent = document.getElementById('visitor-pass-print-area');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(`
        <html>
          <head>
            <title>Pase de Visitante SIGAE</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; background-color: #fff; }
              .ticket-card { width: 80mm; border: 2px dashed #000; padding: 15px; text-align: center; background: #fff; border-radius: 8px; }
              @media print { body { padding: 0; } .no-print { display: none !important; } }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
            <script>
              window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      auditar('Gestión de Usuarios', 'Imprimir Pase', `Imprimió pase para: ${selectedVisitantePrint?.cedula}`);
    }
  };

  // Filtrado de Visitantes
  const filteredVisitantes = useMemo(() => {
    return visitantes.filter(v => {
      // 1. Filtro de búsqueda por texto
      const q = searchVisitantes.toLowerCase().trim();
      if (q) {
        const ced = String(v.cedula || '').toLowerCase();
        const nom = String(v.nombres || '').toLowerCase();
        const ape = String(v.apellidos || '').toLowerCase();
        const nomCompleto = `${nom} ${ape}`;
        const razon = String(v.razon_visita || '').toLowerCase();
        const tel = String(v.telefono || '').replace(/\D/g, '');
        const email = String(v.correo || '').toLowerCase();
        const esc = String(v.escuela_id || '').toLowerCase();

        const match = ced.includes(q) ||
          nom.includes(q) ||
          ape.includes(q) ||
          nomCompleto.includes(q) ||
          razon.includes(q) ||
          (q.match(/^\d+$/) && tel.includes(q)) ||
          email.includes(q) ||
          esc.includes(q);

        if (!match) return false;
      }

      // 2. Filtro por fecha usando tiempo local del navegador
      if (filtroFechaVisitantes !== 'todas') {
        const vDate = new Date(v.created_at);
        const now = new Date();

        if (isNaN(vDate.getTime())) return true;

        if (filtroFechaVisitantes === 'hoy') {
          const esHoy = vDate.getFullYear() === now.getFullYear() &&
                        vDate.getMonth() === now.getMonth() &&
                        vDate.getDate() === now.getDate();
          if (!esHoy) return false;
        } else if (filtroFechaVisitantes === 'semana') {
          const diffMs = now.getTime() - vDate.getTime();
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          if (diffDays < 0 || diffDays > 7) return false;
        } else if (filtroFechaVisitantes === 'mes') {
          const esEsteMes = vDate.getFullYear() === now.getFullYear() &&
                            vDate.getMonth() === now.getMonth();
          if (!esEsteMes) return false;
        }
      }

      return true;
    });
  }, [visitantes, searchVisitantes, filtroFechaVisitantes]);

  // Estadísticas de Visitantes
  const statsVisitantes = useMemo(() => {
    const now = new Date();
    let countHoy = 0;
    let countSemana = 0;
    let countMes = 0;

    visitantes.forEach(v => {
      const vDate = new Date(v.created_at);
      if (isNaN(vDate.getTime())) return;

      if (vDate.getFullYear() === now.getFullYear() &&
          vDate.getMonth() === now.getMonth() &&
          vDate.getDate() === now.getDate()) {
        countHoy++;
      }

      const diffMs = now.getTime() - vDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (diffDays >= 0 && diffDays <= 7) {
        countSemana++;
      }

      if (vDate.getFullYear() === now.getFullYear() &&
          vDate.getMonth() === now.getMonth()) {
        countMes++;
      }
    });

    return {
      total: visitantes.length,
      hoy: countHoy,
      semana: countSemana,
      mes: countMes
    };
  }, [visitantes]);

  // ── MÉTODOS DE CREACIÓN/EDICIÓN DE USUARIOS ──
  const abrirFormModal = (u: any = null) => {
    if (u) {
      setEditingUser(u);
      setFormCedula(u.cedula);
      setFormNombre(u.nombre_completo);
      setFormEscuela(u.id_escuela || 'sb');
      setFormRol(u.rol || '');
      setFormEmail(u.email || '');
      setFormTelefono(u.telefono || '');
      setFormEstado(u.estado || 'Activo');
      setFormPrimerIngreso(String(u.primer_ingreso ?? true));
      setFormClave('');
    } else {
      setEditingUser(null);
      setFormCedula('');
      setFormNombre('');
      setFormEscuela(localStorage.getItem('sigae_escuela_codigo') || 'sb');
      setFormRol(rolesDisponibles[0] || 'Representante');
      setFormEmail('');
      setFormTelefono('');
      setFormEstado('Activo');
      setFormPrimerIngreso('true');
      setFormClave('');
    }
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCedula = formCedula.trim().toUpperCase();
    const newNombre = formNombre.trim();
    const newEscuela = formEscuela;

    if (!newCedula || !newNombre) {
      if (Swal) Swal.fire('Error', 'La cédula y el nombre son campos obligatorios.', 'warning');
      return;
    }

    if (newEscuela === 'sb' && !canCreateSB) {
      if (Swal) Swal.fire('Error', 'No tiene permisos para gestionar usuarios en la escuela SB.', 'error');
      return;
    }
    if (newEscuela === 'lb' && !canCreateLB) {
      if (Swal) Swal.fire('Error', 'No tiene permisos para gestionar usuarios en la escuela LB.', 'error');
      return;
    }
    if (newEscuela === 'ambas' && (!canCreateSB || !canCreateLB)) {
      if (Swal) Swal.fire('Error', 'No tiene permisos en ambas escuelas para asignar un usuario a ambas.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        cedula: newCedula,
        nombre_completo: toTitulo(newNombre),
        id_escuela: newEscuela,
        rol: formRol,
        email: formEmail.trim() || null,
        telefono: formTelefono.trim() || null,
        estado: formEstado,
        primer_ingreso: formPrimerIngreso === 'true'
      };

      if (editingUser) {
        if (formClave.trim()) {
          payload.clave = formClave.trim();
        }
        
        const { error } = await supabase
          .from('usuarios')
          .update(payload)
          .eq('cedula', editingUser.cedula);

        if (error) throw error;

        if (editingUser.cedula !== newCedula) {
          try {
            await supabase
              .from('estudiantes_vinculaciones')
              .update({ cedula_representante: newCedula })
              .eq('cedula_representante', editingUser.cedula);
          } catch (e) {}
        }

        if (Swal) {
          Swal.fire({
            icon: 'success',
            title: '¡Usuario Actualizado!',
            html: `Los datos de <b>${newNombre}</b> (C.I. ${newCedula}) han sido actualizados.`,
            confirmButtonColor: '#6366f1'
          });
        }
        auditar('Gestión de Usuarios', 'Editar Usuario', `Actualizó: ${payload.cedula}`);
      } else {
        payload.clave = formClave.trim() || newCedula;
        payload.solicito_reseteo = false;
        
        const { error } = await supabase.from('usuarios').insert([payload]);
        if (error) {
          if (error.code === '23505') {
            if (Swal) Swal.fire('Error', 'Esa cédula ya se encuentra registrada.', 'error');
            setLoading(false);
            return;
          }
          throw error;
        }
        if (Swal) Swal.fire('¡Usuario Creado!', `Se ha registrado al usuario.<br/><br/>Clave temporal: <b>${payload.clave}</b>`, 'success');
        auditar('Gestión de Usuarios', 'Nuevo Usuario', `Creó usuario: ${payload.cedula}`);
      }
      
      setShowUserModal(false);
      await cargarUsuarios();
    } catch (e: any) {
      if (Swal) Swal.fire('Error', e?.message || 'No se pudo guardar.', 'error');
    }
    setLoading(false);
  };

  const eliminarUsuariosMasivo = async () => {
    if (selectedUsers.length === 0 || !Swal) return;

    Swal.fire({
      title: `¿Eliminar ${selectedUsers.length} usuarios?`,
      text: "Esta acción no se puede deshacer.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(async (res: any) => {
      if (res.isConfirmed) {
        setLoading(true);
        try {
          const { error } = await supabase.from('usuarios').delete().in('cedula', selectedUsers);
          if (error) throw error;
          auditar('Gestión de Usuarios', 'Eliminar Masivo', `Eliminó ${selectedUsers.length} usuarios.`);
          setSelectedUsers([]);
          await cargarUsuarios();
          Swal.fire('¡Eliminados!', 'Los usuarios seleccionados han sido removidos.', 'success');
        } catch (e: any) {
          Swal.fire('Error', e.message || 'Error al eliminar.', 'error');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Carga Masiva Excel
  const procesarCSV = async () => {
    if (!csvFile) return;

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

        if (rows.length <= 1) {
          if (Swal) Swal.fire('Error', 'El archivo no contiene filas de datos.', 'warning');
          return;
        }

        const validos: any[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 2) continue;
          const cedula = String(row[0] || '').trim().toUpperCase();
          const nombre = toTitulo(String(row[1] || '').trim());
          const rol = String(row[2] || 'Representante').trim();
          const escuela = String(row[3] || 'sb').trim().toLowerCase();

          if (cedula && nombre) {
            validos.push({
              cedula,
              nombre_completo: nombre,
              rol,
              id_escuela: escuela,
              clave: cedula,
              primer_ingreso: true,
              estado: 'Activo'
            });
          }
        }

        if (validos.length === 0) {
          if (Swal) Swal.fire('Error', 'No se encontraron filas válidas para procesar.', 'warning');
          return;
        }

        setCargaProgress({ total: validos.length, actual: 0, procesando: true });
        const { error } = await supabase.from('usuarios').upsert(validos, { onConflict: 'cedula' });
        setCargaProgress({ total: 0, actual: 0, procesando: false });
        setShowCargaModal(false);
        setCsvFile(null);

        if (error) throw error;

        auditar('Gestión de Usuarios', 'Carga Masiva', `Importó ${validos.length} usuarios.`);
        await cargarUsuarios();
        if (Swal) Swal.fire('¡Carga Exitosa!', `Se procesaron ${validos.length} usuarios correctamente.`, 'success');
      } catch (err: any) {
        setCargaProgress({ total: 0, actual: 0, procesando: false });
        if (Swal) Swal.fire('Error', err?.message || 'No se pudo procesar el archivo.', 'error');
      }
    };
    reader.readAsArrayBuffer(csvFile);
  };

  // Roles únicos disponibles (combinando tabla de roles y usuarios existentes)
  const rolesUnicos = useMemo(() => {
    const set = new Set<string>();
    rolesDisponibles.forEach(r => { if (r && r.trim()) set.add(r.trim()); });
    usuarios.forEach(u => { if (u.rol && u.rol.trim()) set.add(u.rol.trim()); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rolesDisponibles, usuarios]);

  // Filtrado de Usuarios
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      const esc = getEscuelaDeUsuario(u, vinculacionesMap);
      if (filtroEscuela === 'ambas') {
        if (esc !== 'ambas') return false;
      } else if (filtroEscuela !== 'TODAS') {
        const target = filtroEscuela.toLowerCase();
        if (esc !== target && esc !== 'ambas') return false;
      }

      if (filtroRol !== 'TODOS') {
        const uRol = String(u.rol || '').trim().toLowerCase();
        const fRol = filtroRol.trim().toLowerCase();
        if (uRol !== fRol) return false;
      }

      const listaEst = getEstudiantesDeUsuario(u, vinculacionesMap);
      const numEstudiantes = listaEst.length;

      if (filtroEstudiantes === 'CON_ESTUDIANTES' && numEstudiantes === 0) return false;
      if (filtroEstudiantes === 'SIN_ESTUDIANTES' && numEstudiantes > 0) return false;
      if (filtroEstudiantes === 'AMBAS_ESCUELAS' && esc !== 'ambas') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nom = String(u.nombre_completo || '').toLowerCase();
        const ced = String(u.cedula || '').toLowerCase();
        const cedNum = limpiarCedula(u.cedula);
        const email = String(u.email || '').toLowerCase();
        const tel = String(u.telefono || '').replace(/\D/g, '');
        const rol = String(u.rol || '').toLowerCase();

        // Buscar también dentro de los estudiantes vinculados
        const matchEstudiante = listaEst.some((e: any) => {
          const estNom = `${e.nombres_estudiante || ''} ${e.apellidos_estudiante || ''}`.toLowerCase();
          const estCed = String(e.cedula_estudiante || '').toLowerCase();
          return estNom.includes(q) || estCed.includes(q);
        });

        const matchDirecto = nom.includes(q) ||
          ced.includes(q) ||
          (q.match(/^\d+$/) && cedNum.includes(q)) ||
          email.includes(q) ||
          tel.includes(q) ||
          rol.includes(q);

        if (!matchDirecto && !matchEstudiante) return false;
      }

      return true;
    });
  }, [usuarios, filtroEscuela, filtroRol, filtroEstudiantes, searchQuery, vinculacionesMap]);

  // Métricas globales de vinculación estudiantil
  const { totalEstudiantesVinculados, representantesConHijos } = useMemo(() => {
    let countRep = 0;
    const estsSet = new Set<string>();

    usuarios.forEach(u => {
      const ests = getEstudiantesDeUsuario(u, vinculacionesMap);
      if (ests && ests.length > 0) {
        countRep++;
        ests.forEach(e => {
          const id = e.cedula_estudiante || `${e.nombres_estudiante}_${e.apellidos_estudiante}`;
          estsSet.add(id);
        });
      }
    });

    Object.values(vinculacionesMap).forEach(list => {
      if (Array.isArray(list)) {
        list.forEach(e => {
          const id = e.cedula_estudiante || `${e.nombres_estudiante}_${e.apellidos_estudiante}`;
          estsSet.add(id);
        });
      }
    });

    return {
      totalEstudiantesVinculados: estsSet.size,
      representantesConHijos: countRep
    };
  }, [usuarios, vinculacionesMap]);

  const hayFiltrosUsuariosActivos = useMemo(() => {
    return filtroEscuela !== 'TODAS' || filtroRol !== 'TODOS' || filtroEstudiantes !== 'TODOS' || searchQuery.trim() !== '';
  }, [filtroEscuela, filtroRol, filtroEstudiantes, searchQuery]);

  const limpiarFiltrosUsuarios = () => {
    setFiltroEscuela('TODAS');
    setFiltroRol('TODOS');
    setFiltroEstudiantes('TODOS');
    setSearchQuery('');
    setPaginaActual(1);
  };

  const totalPaginas = Math.ceil(usuariosFiltrados.length / itemsPorPagina) || 1;
  const paginatedUsuarios = useMemo(() => {
    const start = (paginaActual - 1) * itemsPorPagina;
    return usuariosFiltrados.slice(start, start + itemsPorPagina);
  }, [usuariosFiltrados, paginaActual, itemsPorPagina]);

  if (permLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando directorio de usuarios...</span>
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
        <p className="text-muted mb-0">No tienes permisos para acceder a la Gestión de Usuarios.</p>
      </div>
    );
  }

  return (
    <div className="modulo-animado container-fluid p-0 animate__animated animate__fadeIn">

      {/* 1. Miga de Pan Chamilo */}
      <ChamiloBreadcrumb
        category="Seguridad y Accesos"
        currentModule="Gestión de Usuarios y Visitantes"
      />

      {/* 2. Cuadro de Ayuda Metodológica Chamilo */}
      <ChamiloHelpCallout
        id="ayuda_gestion_usuarios_chamilo"
        title="Directorio de Cuentas, Usuarios del Sistema y Control de Visitantes"
        content="Administre el directorio de cuentas de usuarios digitales, virtualice el acceso con emulación de roles, resetee contraseñas, asigne permisos institucionales y controle el registro de visitantes presenciales."
        icon="bi-people-fill"
      />

      {/* ── 3. CABECERA INSTITUCIONAL CHAMILO ── */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4 bg-white border-top border-4" style={{ borderColor: '#6366f1' }}>
        <div className="p-4 p-md-5">
          <div className="row align-items-center g-4">
            
            {/* Logo de la Escuela */}
            <div className="col-12 col-md-auto text-center text-md-start">
              <div className="rounded-4 p-2 bg-light border d-inline-flex align-items-center justify-content-center shadow-xs" style={{ width: '105px', height: '105px' }}>
                <img 
                  src={`/assets/img/logo_${localStorage.getItem('sigae_escuela_codigo') || 'sb'}.png`} 
                  alt="Escudo Institucional" 
                  className="img-fluid"
                  style={{ maxHeight: '85px', objectFit: 'contain' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sigae.png'; }}
                />
              </div>
            </div>

            {/* Título y Métricas Clave */}
            <div className="col-12 col-md">
              <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                <span className="badge bg-indigo text-white fw-bold px-3 py-1.5 rounded-pill small" style={{ backgroundColor: '#6366f1' }}>
                  <i className="bi bi-shield-lock-fill me-1"></i>Seguridad & Directorio
                </span>
                <span className="badge bg-light text-dark border px-2.5 py-1.5 rounded-pill small fw-bold">
                  <i className="bi bi-person-fill text-primary me-1"></i><b>{usuarios.length}</b> Cuentas Activas
                </span>
                <span className="badge bg-light text-dark border px-2.5 py-1.5 rounded-pill small fw-bold">
                  <i className="bi bi-mortarboard-fill text-success me-1"></i><b>{totalEstudiantesVinculados}</b> Estudiantes Vinculados
                </span>
                <span className="badge bg-light text-dark border px-2.5 py-1.5 rounded-pill small fw-bold">
                  <i className="bi bi-people-fill text-info me-1"></i><b>{representantesConHijos}</b> Con Representados
                </span>
                <span className="badge bg-light text-dark border px-2.5 py-1.5 rounded-pill small fw-bold">
                  <i className="bi bi-door-open-fill text-secondary me-1"></i><b>{visitantes.length}</b> Visitantes
                </span>
                {solicitudesReseteo.length > 0 && (
                  <span className="badge bg-danger text-white px-2.5 py-1.5 rounded-pill small fw-bold">
                    <i className="bi bi-arrow-counterclockwise me-1"></i><b>{solicitudesReseteo.length}</b> Reseteos Pendientes
                  </span>
                )}
              </div>

              <h1 className="fw-bolder mb-1.5 text-dark" style={{ fontSize: 'calc(1.5rem + 0.7vw)', letterSpacing: '-0.5px' }}>
                Gestión de Usuarios e Invitados
              </h1>

              <p className="mb-0 text-muted small">
                Directorio integral de cuentas de acceso, control de portería de visitantes presenciales y auditoría de credenciales.
              </p>
            </div>

            {/* Acciones Rápidas */}
            <div className="col-12 col-md-auto text-md-end text-center">
              <button
                type="button"
                onClick={() => navigate('/categoria/Seguridad%20y%20Accesos')}
                className="btn btn-light rounded-pill px-3.5 py-2 fw-bold text-muted d-inline-flex align-items-center gap-1.5 hover-efecto shadow-xs"
                style={{ fontSize: '0.82rem' }}
              >
                <i className="bi bi-arrow-left"></i>
                <span>Volver al Menú</span>
              </button>
            </div>

          </div>
        </div>

        {/* Barra de Pestañas Principal */}
        <div className="px-4 py-3 bg-light border-top d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setTabPrincipal('usuarios')}
              className={`btn btn-xs rounded-pill px-3.5 py-1.5 fw-bold transition-all ${
                tabPrincipal === 'usuarios' ? 'btn-primary text-white shadow-xs' : 'btn-white bg-white text-muted border'
              }`}
              style={{ backgroundColor: tabPrincipal === 'usuarios' ? '#6366f1' : undefined, borderColor: tabPrincipal === 'usuarios' ? '#6366f1' : undefined, fontSize: '0.82rem' }}
            >
              <i className="bi bi-people-fill me-1.5"></i>Cuentas de Usuarios ({usuarios.length})
            </button>
            <button
              type="button"
              onClick={() => setTabPrincipal('visitantes')}
              className={`btn btn-xs rounded-pill px-3.5 py-1.5 fw-bold transition-all ${
                tabPrincipal === 'visitantes' ? 'btn-primary text-white shadow-xs' : 'btn-white bg-white text-muted border'
              }`}
              style={{ backgroundColor: tabPrincipal === 'visitantes' ? '#6366f1' : undefined, borderColor: tabPrincipal === 'visitantes' ? '#6366f1' : undefined, fontSize: '0.82rem' }}
            >
              <i className="bi bi-door-open-fill me-1.5"></i>Visitantes e Invitados ({visitantes.length})
            </button>
            <button
              type="button"
              onClick={() => setTabPrincipal('reseteos')}
              className={`btn btn-xs rounded-pill px-3.5 py-1.5 fw-bold transition-all ${
                tabPrincipal === 'reseteos' ? 'btn-primary text-white shadow-xs' : 'btn-white bg-white text-muted border'
              }`}
              style={{ backgroundColor: tabPrincipal === 'reseteos' ? '#6366f1' : undefined, borderColor: tabPrincipal === 'reseteos' ? '#6366f1' : undefined, fontSize: '0.82rem' }}
            >
              <i className="bi bi-arrow-counterclockwise me-1.5"></i>Solicitudes de Reseteo
              {solicitudesReseteo.length > 0 && (
                <span className="badge bg-danger rounded-pill ms-1.5 px-2 py-0.5 extra-small">{solicitudesReseteo.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. PESTAÑA 1: CUENTAS DE USUARIOS DEL SISTEMA ── */}
      {tabPrincipal === 'usuarios' && (
        <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-5">
          <div className="card-header bg-white p-4 border-bottom">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-2">
                <label className="extra-small fw-bold text-muted mb-1"><i className="bi bi-building me-1"></i>Escuela</label>
                <select 
                  className="form-select form-select-sm rounded-3" 
                  value={filtroEscuela}
                  onChange={(e) => { setFiltroEscuela(e.target.value); setPaginaActual(1); }}
                >
                  <option value="TODAS">Todos los Planteles</option>
                  <option value="sb">Solo UE Santa Bárbara</option>
                  <option value="lb">Solo UE Libertador Bolívar</option>
                  <option value="ambas">🏢 Ambas Escuelas (SB + LB)</option>
                </select>
              </div>

              <div className="col-12 col-md-2">
                <label className="extra-small fw-bold text-muted mb-1"><i className="bi bi-person-badge me-1"></i>Rol</label>
                <select 
                  className="form-select form-select-sm rounded-3" 
                  value={filtroRol}
                  onChange={(e) => { setFiltroRol(e.target.value); setPaginaActual(1); }}
                >
                  <option value="TODOS">Todos los roles ({usuarios.length})</option>
                  {rolesUnicos.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-2">
                <label className="extra-small fw-bold text-muted mb-1"><i className="bi bi-mortarboard-fill me-1"></i>Estudiantes</label>
                <select 
                  className="form-select form-select-sm rounded-3" 
                  value={filtroEstudiantes}
                  onChange={(e) => { setFiltroEstudiantes(e.target.value as any); setPaginaActual(1); }}
                >
                  <option value="TODOS">Todos los usuarios</option>
                  <option value="CON_ESTUDIANTES">🟢 Con Estudiantes</option>
                  <option value="AMBAS_ESCUELAS">🏢 En Ambas Escuelas</option>
                  <option value="SIN_ESTUDIANTES">⚪ Sin Estudiantes</option>
                </select>
              </div>

              <div className="col-12 col-md-3">
                <label className="extra-small fw-bold text-muted mb-1"><i className="bi bi-search me-1"></i>Buscar</label>
                <div className="input-group input-group-sm">
                  <input 
                    type="text" 
                    className="form-control rounded-start-3" 
                    placeholder="Cédula, nombre, estudiante..." 
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPaginaActual(1); }}
                  />
                  {searchQuery && (
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button" 
                      onClick={() => { setSearchQuery(''); setPaginaActual(1); }}
                      title="Limpiar búsqueda"
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>

              <div className="col-12 col-md-3 text-md-end">
                <div className="d-flex align-items-center justify-content-md-end gap-1.5 flex-wrap">
                  {hayFiltrosUsuariosActivos && (
                    <button
                      type="button"
                      onClick={limpiarFiltrosUsuarios}
                      className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 shadow-xs"
                      title="Restablecer todos los filtros"
                    >
                      <i className="bi bi-arrow-counterclockwise me-1"></i>Limpiar
                    </button>
                  )}
                  {selectedUsers.length > 0 && (
                    <button 
                      className="btn btn-sm btn-danger fw-bold shadow-xs px-3 rounded-pill" 
                      onClick={eliminarUsuariosMasivo}
                    >
                      <i className="bi bi-trash3-fill me-1"></i>Eliminar ({selectedUsers.length})
                    </button>
                  )}
                  <button 
                    type="button"
                    className="btn btn-sm btn-outline-danger fw-bold shadow-xs px-3 rounded-pill" 
                    onClick={() => {
                      detenerTodosLosSonidos();
                      if (Swal) {
                        const Toast = Swal.mixin({
                          toast: true,
                          position: 'top-end',
                          showConfirmButton: false,
                          timer: 2000
                        });
                        Toast.fire({ icon: 'info', title: 'Audio detenido' });
                      }
                    }}
                    title="Detener audio de bienvenida en reproducción"
                  >
                    <i className="bi bi-stop-circle-fill me-1"></i>Detener Audio
                  </button>
                  {canCreateAny && (
                    <button 
                      className="btn btn-sm btn-dark fw-bold shadow-xs px-3 rounded-pill" 
                      onClick={() => setShowCargaModal(true)}
                    >
                      <i className="bi bi-cloud-arrow-up-fill me-1"></i>Carga Masiva
                    </button>
                  )}
                  {canCreateAny && (
                    <button 
                      className="btn btn-sm btn-primary fw-bold shadow-xs px-4 rounded-pill" 
                      style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
                      onClick={() => abrirFormModal()}
                    >
                      <i className="bi bi-person-plus-fill me-1"></i>Nuevo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Contador de resultados filtrados */}
            <div className="mt-2.5 d-flex align-items-center justify-content-between flex-wrap gap-2 pt-2 border-top">
              <span className="extra-small text-muted fw-bold">
                <i className="bi bi-filter me-1 text-primary"></i>
                Mostrando <b>{usuariosFiltrados.length}</b> de <b>{usuarios.length}</b> cuentas registradas
                {hayFiltrosUsuariosActivos && <span className="badge bg-indigo-subtle text-indigo border ms-1.5 px-2 py-0.5 rounded-pill extra-small">Filtros aplicados</span>}
              </span>
            </div>
          </div>

          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5 text-muted">
                <div className="spinner-border text-primary mb-3" role="status"></div>
                <div>Cargando directorio de usuarios...</div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light text-muted extra-small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                    <tr>
                      <th className="ps-4 py-3" style={{ width: '40px' }}>
                        <input 
                          type="checkbox" 
                          className="form-check-input"
                          checked={selectedUsers.length === paginatedUsuarios.length && paginatedUsuarios.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedUsers(paginatedUsuarios.map(u => u.cedula));
                            else setSelectedUsers([]);
                          }}
                        />
                      </th>
                      <th className="py-3">Usuario / Nombre</th>
                      <th className="py-3">Cédula</th>
                      <th className="py-3">Rol Asignado</th>
                      <th className="py-3 text-center">Estudiantes Vinculados</th>
                      <th className="py-3">Escuela</th>
                      <th className="py-3">Estado</th>
                      <th className="text-center pe-4 py-3" style={{ width: '225px' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsuarios.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-5 text-muted">
                          <i className="bi bi-inbox fs-2 d-block mb-2 text-muted opacity-50"></i>
                          <span className="fw-bold">No se encontraron usuarios con los filtros seleccionados.</span>
                        </td>
                      </tr>
                    ) : (
                      paginatedUsuarios.map((u) => {
                        const isSelected = selectedUsers.includes(u.cedula);
                        const ests = getEstudiantesDeUsuario(u, vinculacionesMap);
                        const esc = getEscuelaDeUsuario(u, vinculacionesMap);

                        return (
                          <tr key={u.id_usuario || u.cedula} className={`hover-efecto ${isSelected ? 'table-active' : ''}`}>
                            <td className="ps-4 py-3">
                              <input 
                                type="checkbox" 
                                className="form-check-input"
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) setSelectedUsers(selectedUsers.filter(id => id !== u.cedula));
                                  else setSelectedUsers([...selectedUsers, u.cedula]);
                                }}
                              />
                            </td>

                            <td className="py-3">
                              <div className="fw-bold text-dark">{toTitulo(u.nombre_completo)}</div>
                              <div className="extra-small text-muted d-flex align-items-center gap-1">
                                {u.email && <span><i className="bi bi-envelope me-0.5"></i>{u.email}</span>}
                                {u.telefono && <span className="ms-1"><i className="bi bi-telephone me-0.5"></i>{u.telefono}</span>}
                              </div>
                            </td>

                            <td className="py-3 fw-bold text-muted small">{u.cedula}</td>

                            <td className="py-3">
                              <span className="badge bg-light text-dark border rounded-pill px-2.5 py-1 extra-small fw-bold">
                                {u.rol}
                              </span>
                            </td>

                            {/* Columna Estudiantes Vinculados */}
                            <td className="py-3 text-center">
                              {ests.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setUsuarioDetalleEstudiantes({ ...u, estudiantes: ests })}
                                  className="btn btn-xs btn-outline-success rounded-pill px-3 py-1 fw-bold shadow-xs hover-efecto"
                                  title={`Ver ${ests.length} estudiante(s) vinculado(s) a ${u.nombre_completo}`}
                                >
                                  <i className="bi bi-mortarboard-fill me-1.5"></i>
                                  {ests.length} {ests.length === 1 ? 'Estudiante' : 'Estudiantes'}
                                </button>
                              ) : (
                                <span className="badge bg-light text-muted border rounded-pill px-2.5 py-1 extra-small">
                                  0 Vinculados
                                </span>
                              )}
                            </td>

                            <td className="py-3">
                              {esc === 'lb' && <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2 py-0.5 extra-small">LB</span>}
                              {esc === 'sb' && <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2 py-0.5 extra-small">SB</span>}
                              {esc === 'ambas' && <span className="badge bg-dark bg-opacity-10 text-dark border border-dark border-opacity-25 rounded-pill px-2 py-0.5 extra-small">Ambas</span>}
                            </td>

                            <td className="py-3">
                              <span className={`badge ${u.estado === 'Activo' ? 'bg-success' : 'bg-danger'} rounded-pill extra-small px-2 py-0.5`}>
                                {u.estado || 'Activo'}
                              </span>
                            </td>

                            <td className="text-center pe-4 py-3">
                              <div className="d-flex align-items-center justify-content-center gap-1">
                                
                                {/* 0. Probar Audio de Bienvenida con IA Sigma (Solo Rol Docente) */}
                                {String(u.rol || '').toLowerCase().includes('docen') && (
                                  <button
                                    type="button"
                                    onClick={() => handleProbarAudioDocente(u)}
                                    className="btn btn-xs btn-light text-info border rounded-circle shadow-xs hover-efecto"
                                    style={{ width: '30px', height: '30px' }}
                                    title={`🔊 Escuchar Audio de Bienvenida de la IA Sigma para ${toTitulo(u.nombre_completo)}`}
                                  >
                                    <i className="bi bi-volume-up-fill text-info"></i>
                                  </button>
                                )}

                                {/* 1. Virtualizar Ingreso / Emular Cuenta */}
                                {canEmular && (
                                  <button
                                    type="button"
                                    onClick={() => handleVirtualizarIngreso(u)}
                                    className="btn btn-xs btn-light text-dark border rounded-circle shadow-xs"
                                    style={{ width: '30px', height: '30px' }}
                                    title="Virtualizar Ingreso (Entrar al sistema como este usuario)"
                                  >
                                    <i className="bi bi-box-arrow-in-right text-primary"></i>
                                  </button>
                                )}

                                {/* 2. Resetear Contraseña Individual */}
                                <button
                                  type="button"
                                  onClick={() => handleResetearClaveIndividual(u)}
                                  className="btn btn-xs btn-light text-warning border rounded-circle shadow-xs"
                                  style={{ width: '30px', height: '30px' }}
                                  title="Resetear Contraseña a Primer Ingreso"
                                >
                                  <i className="bi bi-key-fill text-warning"></i>
                                </button>

                                {/* 2.5. Notificar Credenciales por WhatsApp */}
                                <button
                                  type="button"
                                  onClick={() => enviarWhatsAppReseteoEjecutado(u)}
                                  className="btn btn-xs btn-light text-success border rounded-circle shadow-xs"
                                  style={{ width: '30px', height: '30px' }}
                                  title="Enviar Notificación de Acceso por WhatsApp"
                                >
                                  <i className="bi bi-whatsapp text-success"></i>
                                </button>

                                {/* 3. Editar Datos de Usuario */}
                                <button
                                  type="button"
                                  onClick={() => abrirFormModal(u)}
                                  className="btn btn-xs btn-light text-primary border rounded-circle shadow-xs"
                                  style={{ width: '30px', height: '30px' }}
                                  title="Editar Usuario"
                                >
                                  <i className="bi bi-pencil-square"></i>
                                </button>

                                {/* 4. Eliminar Usuario Individual */}
                                <button
                                  type="button"
                                  onClick={() => handleEliminarUsuarioIndividual(u)}
                                  className="btn btn-xs btn-light text-danger border rounded-circle shadow-xs"
                                  style={{ width: '30px', height: '30px' }}
                                  title="Eliminar Cuenta de Usuario"
                                >
                                  <i className="bi bi-trash3-fill"></i>
                                </button>

                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginador Chamilo */}
            {totalPaginas > 1 && (
              <div className="p-3 bg-light border-top d-flex justify-content-between align-items-center">
                <span className="extra-small text-muted">Página {paginaActual} de {totalPaginas}</span>
                <div className="d-flex gap-1">
                  <button
                    type="button"
                    disabled={paginaActual === 1}
                    onClick={() => setPaginaActual(p => Math.max(p - 1, 1))}
                    className="btn btn-xs btn-white bg-white border rounded-pill px-3 py-1 fw-bold"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={paginaActual === totalPaginas}
                    onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))}
                    className="btn btn-xs btn-white bg-white border rounded-pill px-3 py-1 fw-bold"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 5. PESTAÑA 2: VISITANTES E INVITADOS PRESENCIALES ── */}
      {tabPrincipal === 'visitantes' && (
        <div className="row g-4 mb-5">
          
          {/* Check-in Form */}
          <div className="col-12 col-xl-4">
            <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden h-100">
              <div className="card-header bg-white p-3.5 border-bottom d-flex align-items-center justify-content-between">
                <h5 className="fw-bolder text-dark mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-person-plus-fill text-primary"></i>
                  Check-in de Visitante
                </h5>
                {vAutocompletado && (
                  <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5 py-1 extra-small fw-bold">
                    <i className="bi bi-arrow-repeat me-1"></i>Recurrente ({vVisitasAnteriores} visitas)
                  </span>
                )}
              </div>

              <div className="card-body p-4">
                <form onSubmit={handleSaveVisitante}>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-dark mb-1">Cédula del Visitante <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      value={vCedula}
                      onChange={(e) => setVCedula(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ej: 18456789"
                      maxLength={9}
                      className="form-control rounded-3 fw-bold"
                      required
                    />
                    {vBuscando && (
                      <div className="extra-small text-primary mt-1">
                        <span className="spinner-border spinner-border-sm me-1" style={{ width: '10px', height: '10px' }}></span>
                        Buscando antecedentes...
                      </div>
                    )}
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold small text-dark mb-1">Nombres <span className="text-danger">*</span></label>
                      <input type="text" value={vNombres} onChange={(e) => setVNombres(e.target.value)} placeholder="Nombres" className="form-control rounded-3" required />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold small text-dark mb-1">Apellidos <span className="text-danger">*</span></label>
                      <input type="text" value={vApellidos} onChange={(e) => setVApellidos(e.target.value)} placeholder="Apellidos" className="form-control rounded-3" required />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold small text-dark mb-1">Teléfono</label>
                      <input type="tel" value={vTelefono} onChange={(e) => setVTelefono(formatPhoneNumber(e.target.value))} placeholder="0414-1234567" className="form-control rounded-3" />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold small text-dark mb-1">Correo</label>
                      <input type="email" value={vCorreo} onChange={(e) => setVCorreo(e.target.value)} placeholder="Opcional" className="form-control rounded-3" />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small text-dark mb-1">Motivo de la Visita <span className="text-danger">*</span></label>
                    <input type="text" value={vRazon} onChange={(e) => setVRazon(e.target.value)} placeholder="Ej: Control de Estudios, Retirar Estudiante..." className="form-control rounded-3" required />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-bold small text-dark mb-1">Plantel / Sede de Entrada</label>
                    <select 
                      value={escuelaVisitante} 
                      onChange={(e) => setEscuelaVisitante(e.target.value)} 
                      className="form-select rounded-3"
                    >
                      <option value="sb">UE Santa Bárbara</option>
                      <option value="lb">UE Libertador Bolívar</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={vRegistrando}
                    className="btn btn-primary rounded-pill fw-bold w-100 shadow-xs hover-efecto"
                    style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
                  >
                    {vRegistrando ? 'Registrando...' : 'Registrar Entrada'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Tabla de Visitantes */}
          <div className="col-12 col-xl-8">
            <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden h-100">
              <div className="card-header bg-white p-3.5 border-bottom">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                  <div className="d-flex align-items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setFiltroFechaVisitantes('todas')}
                      className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${filtroFechaVisitantes === 'todas' ? 'btn-dark text-white' : 'btn-light text-muted border'}`}
                    >
                      Todas ({visitantes.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltroFechaVisitantes('hoy')}
                      className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${filtroFechaVisitantes === 'hoy' ? 'btn-primary text-white shadow-xs' : 'btn-light text-muted border'}`}
                      style={{ backgroundColor: filtroFechaVisitantes === 'hoy' ? '#6366f1' : undefined }}
                    >
                      Hoy ({statsVisitantes.hoy})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltroFechaVisitantes('semana')}
                      className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${filtroFechaVisitantes === 'semana' ? 'btn-primary text-white shadow-xs' : 'btn-light text-muted border'}`}
                      style={{ backgroundColor: filtroFechaVisitantes === 'semana' ? '#6366f1' : undefined }}
                    >
                      Esta Semana ({statsVisitantes.semana})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltroFechaVisitantes('mes')}
                      className={`btn btn-xs rounded-pill px-3 py-1 fw-bold ${filtroFechaVisitantes === 'mes' ? 'btn-primary text-white shadow-xs' : 'btn-light text-muted border'}`}
                      style={{ backgroundColor: filtroFechaVisitantes === 'mes' ? '#6366f1' : undefined }}
                    >
                      Este Mes ({statsVisitantes.mes})
                    </button>
                  </div>

                  <div style={{ minWidth: '200px', maxWidth: '280px' }}>
                    <div className="input-group input-group-sm">
                      <input
                        type="text"
                        value={searchVisitantes}
                        onChange={(e) => setSearchVisitantes(e.target.value)}
                        className="form-control bg-light rounded-start-pill"
                        placeholder="Buscar visitante..."
                      />
                      {searchVisitantes && (
                        <button 
                          className="btn btn-outline-secondary rounded-end-pill" 
                          type="button" 
                          onClick={() => setSearchVisitantes('')}
                          title="Limpiar búsqueda"
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-1">
                  <span className="extra-small text-muted fw-bold">
                    <i className="bi bi-person-lines-fill me-1 text-primary"></i>
                    Mostrando <b>{filteredVisitantes.length}</b> de <b>{visitantes.length}</b> registros de visitantes
                    {(filtroFechaVisitantes !== 'todas' || searchVisitantes.trim()) && (
                      <span className="badge bg-indigo-subtle text-indigo border ms-1.5 px-2 py-0.5 rounded-pill extra-small">
                        Filtro activo
                      </span>
                    )}
                  </span>
                  {(filtroFechaVisitantes !== 'todas' || searchVisitantes.trim()) && (
                    <button
                      type="button"
                      onClick={() => { setFiltroFechaVisitantes('todas'); setSearchVisitantes(''); }}
                      className="btn btn-link p-0 text-muted extra-small text-decoration-none fw-bold"
                    >
                      <i className="bi bi-arrow-counterclockwise me-1"></i>Ver todos
                    </button>
                  )}
                </div>
              </div>

              <div className="card-body p-0">
                {loadingVisitantes ? (
                  <div className="text-center py-5 text-muted">
                    <div className="spinner-border text-primary mb-3" role="status"></div>
                    <div>Cargando registros de visitantes...</div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light text-muted extra-small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                        <tr>
                          <th className="ps-4 py-3">Visitante</th>
                          <th className="py-3">Motivo</th>
                          <th className="py-3">Fecha y Hora</th>
                          <th className="text-center pe-4 py-3" style={{ width: '120px' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVisitantes.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-5 text-muted">
                              <i className="bi bi-person-x fs-2 d-block mb-2 text-muted opacity-50"></i>
                              <span className="fw-bold">No hay registros de visitantes para mostrar.</span>
                            </td>
                          </tr>
                        ) : (
                          filteredVisitantes.map(v => (
                            <tr key={v.id_invitado} className="hover-efecto">
                              <td className="ps-4 py-3">
                                <div className="fw-bold text-dark">{v.nombres} {v.apellidos}</div>
                                <div className="extra-small text-muted">C.I: {v.cedula} {v.telefono && `• ${v.telefono}`}</div>
                              </td>
                              <td className="py-3">
                                <span className="badge bg-light text-dark border rounded-pill px-2.5 py-1 extra-small fw-bold">
                                  {v.razon_visita}
                                </span>
                              </td>
                              <td className="py-3 extra-small text-muted">
                                <div>{new Date(v.created_at).toLocaleDateString()}</div>
                                <div>{new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                              </td>
                              <td className="text-center pe-4 py-3">
                                <div className="d-flex align-items-center justify-content-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedVisitantePrint(v)}
                                    className="btn btn-xs btn-light text-success rounded-circle shadow-xs"
                                    style={{ width: '30px', height: '30px' }}
                                    title="Imprimir Pase Oficial"
                                  >
                                    <i className="bi bi-printer-fill"></i>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditVisitante(v)}
                                    className="btn btn-xs btn-light text-primary rounded-circle shadow-xs"
                                    style={{ width: '30px', height: '30px' }}
                                    title="Editar Visita"
                                  >
                                    <i className="bi bi-pencil-square"></i>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteVisitante(v.id_invitado, `${v.nombres} ${v.apellidos}`)}
                                    className="btn btn-xs btn-light text-danger rounded-circle shadow-xs"
                                    style={{ width: '30px', height: '30px' }}
                                    title="Eliminar Entrada"
                                  >
                                    <i className="bi bi-trash3-fill"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── 6. PESTAÑA 3: SOLICITUDES DE RESETEO DE CONTRASEÑA ── */}
      {tabPrincipal === 'reseteos' && (
        <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-5">
          <div className="card-header bg-warning bg-opacity-10 p-4 border-bottom">
            <h5 className="fw-bold text-dark mb-1">
              <i className="bi bi-arrow-counterclockwise text-warning me-2"></i>
              Bandeja de Solicitudes de Reseteo de Credenciales
            </h5>
            <p className="extra-small text-muted mb-0">
              Usuarios que han solicitado el restablecimiento de su clave institucional para crear nuevas credenciales en Primer Ingreso.
            </p>
          </div>

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted extra-small fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
                  <tr>
                    <th className="ps-4 py-3">Usuario Solicitante</th>
                    <th className="py-3">Cédula</th>
                    <th className="py-3">Rol</th>
                    <th className="text-center pe-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {solicitudesReseteo.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-5 text-muted">
                        <i className="bi bi-check-circle fs-2 text-success d-block mb-2"></i>
                        <span className="fw-bold">No hay solicitudes de reseteo pendientes.</span>
                      </td>
                    </tr>
                  ) : (
                    solicitudesReseteo.map(u => (
                      <tr key={u.id_usuario || u.cedula} className="hover-efecto">
                        <td className="ps-4 py-3">
                          <div className="fw-bold text-dark">{toTitulo(u.nombre_completo)}</div>
                        </td>
                        <td className="py-3 fw-bold text-muted small">{u.cedula}</td>
                        <td className="py-3"><span className="badge bg-light text-dark border">{u.rol}</span></td>
                        <td className="text-center pe-4 py-3">
                          <div className="d-flex align-items-center justify-content-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              className="btn btn-xs btn-success rounded-pill px-3 py-1 fw-bold shadow-xs d-flex align-items-center gap-1"
                              onClick={() => handleResetearClaveIndividual(u)}
                            >
                              <i className="bi bi-check-lg"></i>
                              <span>Aprobar Reseteo</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-outline-success rounded-pill px-2.5 py-1 fw-bold shadow-xs d-flex align-items-center gap-1"
                              onClick={() => enviarWhatsAppReseteoEjecutado(u)}
                              title="Enviar mensaje de confirmación por WhatsApp a este usuario"
                            >
                              <i className="bi bi-whatsapp"></i>
                              <span>Notificar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL EDITAR VISITANTE ── */}
      {editVisitante && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15,23,42,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              <div className="modal-header bg-light border-bottom p-3.5">
                <h5 className="modal-title fw-bold text-dark mb-0">
                  <i className="bi bi-pencil-square text-primary me-2"></i>Editar Registro de Visita
                </h5>
                <button type="button" className="btn-close" onClick={() => setEditVisitante(null)}></button>
              </div>
              <form onSubmit={handleSaveEditVisitante}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-muted">Cédula (No modificable)</label>
                    <input type="text" className="form-control rounded-3 bg-light" value={editVisitante.cedula} disabled />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold small text-dark mb-1">Nombres <span className="text-danger">*</span></label>
                      <input type="text" className="form-control rounded-3" value={editVNombres} onChange={(e) => setEditVNombres(e.target.value)} required />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold small text-dark mb-1">Apellidos <span className="text-danger">*</span></label>
                      <input type="text" className="form-control rounded-3" value={editVApellidos} onChange={(e) => setEditVApellidos(e.target.value)} required />
                    </div>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold small text-dark mb-1">Teléfono</label>
                      <input type="tel" className="form-control rounded-3" value={editVTelefono} onChange={(e) => setEditVTelefono(formatPhoneNumber(e.target.value))} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold small text-dark mb-1">Correo</label>
                      <input type="email" className="form-control rounded-3" value={editVCorreo} onChange={(e) => setEditVCorreo(e.target.value)} />
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="form-label fw-bold small text-dark mb-1">Motivo de la Visita <span className="text-danger">*</span></label>
                    <input type="text" className="form-control rounded-3" value={editVRazon} onChange={(e) => setEditVRazon(e.target.value)} required />
                  </div>
                </div>
                <div className="modal-footer bg-light border-top p-3 d-flex justify-content-between">
                  <button type="button" className="btn btn-light rounded-pill fw-bold text-muted px-4" onClick={() => setEditVisitante(null)}>Cancelar</button>
                  <button type="submit" disabled={editandoVisitante} className="btn btn-primary rounded-pill fw-bold px-4" style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}>
                    {editandoVisitante ? 'Guardando...' : 'Actualizar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL AGREGAR/EDITAR USUARIO ── */}
      {showUserModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15,23,42,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              <div className="modal-header bg-light border-bottom p-3.5">
                <h5 className="modal-title fw-bold text-dark mb-0">
                  <i className="bi bi-person-fill text-primary me-2"></i>
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowUserModal(false)}></button>
              </div>
              <form onSubmit={handleSaveUser}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-dark mb-1">Cédula de Identidad <span className="text-danger">*</span></label>
                    <input type="text" className="form-control rounded-3 fw-bold" value={formCedula} onChange={(e) => setFormCedula(e.target.value.replace(/\D/g, ''))} required disabled={!!editingUser} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-dark mb-1">Nombre Completo <span className="text-danger">*</span></label>
                    <input type="text" className="form-control rounded-3" value={formNombre} onChange={(e) => handleTituloChange(e, setFormNombre)} required />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold small text-dark mb-1">Rol <span className="text-danger">*</span></label>
                      <select className="form-select rounded-3" value={formRol} onChange={(e) => setFormRol(e.target.value)}>
                        {rolesUnicos.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold small text-dark mb-1">Sede Escolar</label>
                      <select className="form-select rounded-3" value={formEscuela} onChange={(e) => setFormEscuela(e.target.value)}>
                        <option value="sb">UE Santa Bárbara</option>
                        <option value="lb">UE Libertador Bolívar</option>
                        <option value="ambas">Ambas Sedes</option>
                      </select>
                    </div>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold small text-dark mb-1">Teléfono</label>
                      <input type="tel" className="form-control rounded-3" value={formTelefono} onChange={(e) => setFormTelefono(formatPhoneNumber(e.target.value))} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold small text-dark mb-1">Correo</label>
                      <input type="email" className="form-control rounded-3" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light border-top p-3 d-flex justify-content-between">
                  <button type="button" className="btn btn-light rounded-pill fw-bold text-muted px-4" onClick={() => setShowUserModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary rounded-pill fw-bold px-4" style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}>
                    {editingUser ? 'Actualizar' : 'Crear Usuario'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CARGA MASIVA ── */}
      {showCargaModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15,23,42,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              <div className="modal-header bg-dark text-white p-3.5">
                <h5 className="modal-title fw-bold mb-0">
                  <i className="bi bi-cloud-arrow-up-fill me-2"></i>Carga Masiva de Usuarios
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCargaModal(false)}></button>
              </div>
              <div className="modal-body p-4 bg-light">
                <p className="small text-muted mb-3">Sube un archivo <b>Excel (.xlsx, .xls)</b> con las columnas: Cédula, Nombre, Rol, Escuela (sb/lb/ambas).</p>
                <input 
                  type="file" 
                  className="form-control rounded-3" 
                  accept=".xlsx, .xls, .ods, .csv" 
                  onChange={(e) => setCsvFile(e.target.files ? e.target.files[0] : null)}
                  disabled={cargaProgress.procesando}
                />
              </div>
              <div className="modal-footer bg-white border-top p-3 d-flex justify-content-between">
                <button type="button" className="btn btn-light rounded-pill fw-bold text-muted px-4" onClick={() => setShowCargaModal(false)}>Cancelar</button>
                <button 
                  type="button" 
                  className="btn btn-primary rounded-pill fw-bold px-4" 
                  disabled={!csvFile || cargaProgress.procesando}
                  onClick={procesarCSV}
                  style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
                >
                  Procesar Carga
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL IMPRIMIR PASE DE VISITANTE ── */}
      {selectedVisitantePrint && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15,23,42,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              <div className="modal-header bg-light border-bottom p-3.5">
                <h5 className="modal-title fw-bold text-dark mb-0">
                  <i className="bi bi-printer-fill text-primary me-2"></i>Pase de Visitante Oficial
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedVisitantePrint(null)}></button>
              </div>
              <div className="modal-body p-4 text-center">
                <div id="visitor-pass-print-area" className="d-inline-block text-start p-3 border rounded-3 bg-white shadow-xs" style={{ width: '100%', maxWidth: '320px' }}>
                  <div className="text-center border-bottom pb-2 mb-3">
                    <img src={`/assets/img/logo_${selectedVisitantePrint.escuela_id || 'sb'}.png`} alt="Logo" style={{ maxHeight: '45px' }} className="mb-1" />
                    <div className="fw-bolder text-uppercase small">
                      {selectedVisitantePrint.escuela_id === 'lb' ? 'UE LIBERTADOR BOLÍVAR' : 'UE SANTA BÁRBARA'}
                    </div>
                    <div className="bg-dark text-white fw-bold py-0.5 rounded extra-small text-uppercase">
                      PASE DE VISITANTE
                    </div>
                  </div>

                  <div className="text-center mb-3">
                    <div className="fw-bolder text-uppercase fs-6 text-dark">{selectedVisitantePrint.nombres} {selectedVisitantePrint.apellidos}</div>
                    <div className="text-muted small fw-bold">C.I: {selectedVisitantePrint.cedula}</div>
                  </div>

                  <div className="extra-small border-top border-bottom py-2 mb-2">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="fw-bold">Fecha:</span>
                      <span>{new Date(selectedVisitantePrint.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="fw-bold">Hora Entrada:</span>
                      <span>{new Date(selectedVisitantePrint.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-light border mb-3 extra-small">
                    <span className="fw-bold d-block text-dark mb-0.5">Motivo de Visita:</span>
                    <span className="text-muted">{selectedVisitantePrint.razon_visita}</span>
                  </div>

                  <div className="text-center border-top pt-2 extra-small text-muted">
                    Porte este pase en un lugar visible durante su permanencia en el plantel.
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light border-top p-3 d-flex justify-content-between">
                <button type="button" className="btn btn-light rounded-pill fw-bold text-muted px-4" onClick={() => setSelectedVisitantePrint(null)}>Cerrar</button>
                <button type="button" onClick={handlePrintVisitorPass} className="btn btn-success rounded-pill fw-bold px-4 d-flex align-items-center gap-1.5 text-white">
                  <i className="bi bi-printer-fill"></i>
                  <span>Imprimir Ticket</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE ESTUDIANTES */}
      {usuarioDetalleEstudiantes && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15,23,42,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden">
              <div className="modal-header bg-success text-white p-4">
                <div>
                  <h5 className="modal-title fw-bold mb-1">
                    <i className="bi bi-mortarboard-fill me-2"></i> Estudiantes Asignados
                  </h5>
                  <small className="opacity-75">
                    Usuario: <b>{usuarioDetalleEstudiantes.nombre_completo}</b> (C.I. {usuarioDetalleEstudiantes.cedula} - {usuarioDetalleEstudiantes.rol})
                  </small>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setUsuarioDetalleEstudiantes(null)}></button>
              </div>
              <div className="modal-body p-4 bg-light">
                <div className="table-responsive rounded-4 shadow-sm bg-white border">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light text-muted small">
                      <tr>
                        <th className="ps-3">#</th>
                        <th>Cédula</th>
                        <th>Nombre y Apellido</th>
                        <th>Grado / Año</th>
                        <th>Sección</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarioDetalleEstudiantes.estudiantes?.map((est: any, eIdx: number) => (
                        <tr key={eIdx}>
                          <td className="ps-3 fw-bold text-muted">{eIdx + 1}</td>
                          <td className="fw-bold text-dark">{est.cedula_estudiante}</td>
                          <td className="fw-bold">{toTitulo(`${est.nombres_estudiante || ''} ${est.apellidos_estudiante || ''}`)}</td>
                          <td><span className="badge bg-primary bg-opacity-10 text-primary border">{est.grado_actual || 'Sin Grado'}</span></td>
                          <td><span className="badge bg-light text-dark border">{est.seccion_actual || 'U'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer bg-white border-0 p-3">
                <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setUsuarioDetalleEstudiantes(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
