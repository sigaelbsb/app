import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Lock,
  ArrowRight,
  User,
  School,
  AlertCircle,
  UserPlus,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  Phone,
  Mail,
  AtSign,
  KeyRound,
  HelpCircle,
  Check,
  Camera,
  Upload,
  Smile,
  Cloud,
  Crop,
  Fingerprint,
  RotateCcw,
  Users,
  ChevronRight,
  GraduationCap,
  Award,
  QrCode,
  Building2,
  FileText,
  BadgeCheck,
  Activity,
  Layers,
  CalendarDays,
  LayoutGrid,
  Search,
  FolderPlus,
  Folder,
  FlaskConical,
  Atom,
  Globe
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { registrarSesionActiva } from '../utils/activeSessionsHelper';
import TechNetworkBackground from '../components/TechNetworkBackground';
import { Security3DIcon, User3DIcon, Lock3DIcon } from '../components/Animated3DIcons';
import ImageCropperModal from '../components/ImageCropperModal';
import PasswordStrengthThermometer from '../components/PasswordStrengthThermometer';
import '../portal_sap.css';

const AVATARES_DISPONIBLES = [
  { id: 'avatar-1', url: '/img/avatars/avatar-1.png' },
  { id: 'avatar-2', url: '/img/avatars/avatar-2.png' },
  { id: 'avatar-3', url: '/img/avatars/avatar-3.png' },
  { id: 'avatar-4', url: '/img/avatars/avatar-4.png' },
  { id: 'avatar-5', url: '/img/avatars/avatar-5.png' },
  { id: 'avatar-6', url: '/img/avatars/avatar-6.png' },
  { id: 'avatar-7', url: '/img/avatars/avatar-7.png' },
  { id: 'avatar-8', url: '/img/avatars/avatar-8.png' },
];

const PREGUNTAS_SEGURIDAD_OPCIONES = [
  '¿Cuál es el nombre de tu primera mascota?',
  '¿En qué ciudad o pueblo nació tu madre?',
  '¿Cuál es tu comida venezolana favorita?',
  '¿Cuál fue el nombre de tu primera escuela primaria?',
  '¿Cuál es el segundo nombre de tu abuela materna?',
  '¿Cuál fue tu primer trabajo o pasatiempo infantil?',
  '¿En qué calle o sector viviste durante tu infancia?'
];

const PAISES_TELEFONO = [
  { codigo: '+58', bandera: '🇻🇪', nombre: 'Venezuela', placeholder: '416-1234563' },
  { codigo: '+57', bandera: '🇨🇴', nombre: 'Colombia', placeholder: '300-1234567' },
  { codigo: '+1', bandera: '🇺🇸', nombre: 'EE.UU.', placeholder: '555-1234567' },
  { codigo: '+34', bandera: '🇪🇸', nombre: 'España', placeholder: '612-345678' },
  { codigo: '+56', bandera: '🇨🇱', nombre: 'Chile', placeholder: '9-12345678' },
  { codigo: '+51', bandera: '🇵🇪', nombre: 'Perú', placeholder: '912-345678' },
  { codigo: '+54', bandera: '🇦🇷', nombre: 'Argentina', placeholder: '11-12345678' },
  { codigo: '+507', bandera: '🇵🇦', nombre: 'Panamá', placeholder: '6123-4567' },
  { codigo: '+52', bandera: '🇲🇽', nombre: 'México', placeholder: '55-12345678' }
];

const DOMINIOS_CORREO_COMUNES = [
  '@gmail.com',
  '@hotmail.com',
  '@outlook.com',
  '@yahoo.com',
  '@mppe.gob.ve',
  '@cantv.net'
];

const OPERADORAS_VENEZUELA = [
  { codigo: '412', nombre: '0412 Digitel' },
  { codigo: '414', nombre: '0414 Movistar' },
  { codigo: '424', nombre: '0424 Movistar' },
  { codigo: '416', nombre: '0416 Movilnet' },
  { codigo: '426', nombre: '0426 Movilnet' }
];

function formatearTelefonoNumero(valor: string, codigoPais: string): string {
  let digitos = valor.replace(/\D/g, '');
  if (codigoPais === '+58') {
    if (digitos.startsWith('0')) {
      digitos = digitos.substring(1);
    }
    digitos = digitos.substring(0, 10);
    if (digitos.length <= 3) return digitos;
    return `${digitos.substring(0, 3)}-${digitos.substring(3)}`;
  }
  digitos = digitos.substring(0, 12);
  if (digitos.length <= 3) return digitos;
  if (digitos.length <= 7) return `${digitos.substring(0, 3)}-${digitos.substring(3)}`;
  return `${digitos.substring(0, 3)}-${digitos.substring(3, 7)}-${digitos.substring(7)}`;
}

function generarSugerenciasUsuario(nombreCompleto: string): string[] {
  if (!nombreCompleto) return [];
  const limpio = nombreCompleto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim();
  const partes = limpio.split(/\s+/).filter(Boolean);
  if (partes.length === 0) return [];
  const sugerencias: string[] = [];
  const p1 = partes[0];
  const p2 = partes[1] || '';
  if (p2) {
    sugerencias.push(`${p1[0]}${p2}`);
    sugerencias.push(`${p1}.${p2}`);
    sugerencias.push(`${p1}_${p2}`);
    sugerencias.push(`${p1}${p2[0]}`);
  } else {
    sugerencias.push(`${p1}`);
    sugerencias.push(`${p1}.sigae`);
    sugerencias.push(`${p1}24`);
  }
  return Array.from(new Set(sugerencias)).slice(0, 4);
}

const ESCUELAS_DATA = {
  sb: {
    nombre: 'U.E. Santa Bárbara',
    dea: 'OD05241903',
    circuito: 'Circuito Educativo N° 04',
    ubicacion: 'El Tejero, Estado Monagas • Fundada en 1946',
    municipio: 'Santa Bárbara, Estado Monagas',
    matricula: '1.280 Estudiantes',
    secciones: '38 Secciones',
    director: 'Lcda. María Ramos',
    lema: '“Educar para la Vida”',
    escudo: '/img/escudo-santabarbara.png'
  },
  lb: {
    nombre: 'U.E. Libertador Bolívar',
    dea: 'OD08912304',
    circuito: 'Circuito Educativo N° 07',
    ubicacion: 'Estado Monagas • Fundada en 1948',
    municipio: 'Santa Bárbara, Estado Monagas',
    matricula: '940 Estudiantes',
    secciones: '26 Secciones',
    director: 'Prof. Carlos Mendoza',
    lema: '“Formando al Nuevo Republicano”',
    escudo: '/img/escudo-bolivar.png'
  }
};

const ROLES_INFO = {
  Representante: {
    titulo: 'Portal de Familias y Representantes',
    descripcion: 'Consulta calificaciones oficiales por lapso, registro de inasistencias y descarga instantánea de constancias de estudio y de inscripción con código QR ministerial.',
    tag: 'Secretaría Virtual 24/7',
    placeholder: 'Ej: 14567890 o cédula de representante',
    sugerencia: 'Ingresa tu Cédula de Identidad de Representante para consultar el expediente de tus hijos o representados.'
  },
  Docente: {
    titulo: 'Campus de Gestión Docente',
    descripcion: 'Carga cuantitativa y cualitativa de notas, control diario de asistencia por sección y planificación curricular por lapsos académicos.',
    tag: 'Control Pedagógico',
    placeholder: 'Ej: 18234567 o usuario.docente',
    sugerencia: 'Ingresa tu cédula institucional para acceder a tus nóminas de estudiantes y libros de calificaciones.'
  },
  Estudiante: {
    titulo: 'Comunidad y Carnet Estudiantil',
    descripcion: 'Visualización de horarios académicos, aula digital, carnet estudiantil con código QR y seguimiento de materias.',
    tag: 'Identidad y Aulas Virtuales',
    placeholder: 'Ej: 31245678 o usuario',
    sugerencia: 'Ingresa tu cédula escolar para consultar tu horario y calificaciones vigentes.'
  },
  Administrativo: {
    titulo: 'Control Maestro y Secretaría General',
    descripcion: 'Gestión centralizada de matrícula escolar, expedientes institucionales únicos, actas ministeriales y auditoría del plantel.',
    tag: 'Despacho Ministerial',
    placeholder: 'Ej: 12345678 o admin.sigae',
    sugerencia: 'Ingresa tus credenciales de directivo o personal administrativo con permisos asignados.'
  }
};

export const Auth = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [school, setSchool] = useState<'sb' | 'lb'>(() => {
    return (localStorage.getItem('sigae_escuela_codigo') as 'sb' | 'lb') || 'sb';
  });

  const [rolActivoVista, setRolActivoVista] = useState<'Representante' | 'Docente' | 'Estudiante' | 'Administrativo'>('Representante');

  const handleSchoolChange = (selected: 'sb' | 'lb') => {
    setSchool(selected);
    localStorage.setItem('sigae_escuela_codigo', selected);
    localStorage.setItem('sigae_escuela_activa', selected === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
    setError('');
  };

  // Pasos: identificar | clave | confirmar_no_registrado | primer_ingreso | recuperar | invitado
  const [paso, setPaso] = useState<'identificar' | 'clave' | 'confirmar_no_registrado' | 'primer_ingreso' | 'recuperar' | 'invitado'>('identificar');
  const [subPasoPrimerIngreso, setSubPasoPrimerIngreso] = useState<1 | 2>(1);

  // Estados de Formulario de Identificación / Clave
  const [tipoDoc, setTipoDoc] = useState<'V' | 'E' | 'P' | 'CE'>('V');
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [recordarSesion, setRecordarSesion] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [tieneBiometriaLocal, setTieneBiometriaLocal] = useState(false);

  useEffect(() => {
    try {
      const tiene = localStorage.getItem('sigae_tiene_huella');
      const uStr = localStorage.getItem('usuario_sigae');
      setTieneBiometriaLocal(Boolean(tiene === 'true' && uStr));
    } catch {
      setTieneBiometriaLocal(false);
    }
  }, []);

  // Parallax interactivo con el cursor del mouse
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const handleMouseMoveParallax = (e: React.MouseEvent) => {
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX / innerWidth - 0.5) * 25;
    const y = (e.clientY / innerHeight - 0.5) * 25;
    setMouseOffset({ x, y });
  };

  // Perfil del Usuario Encontrado
  const [usuarioEncontrado, setUsuarioEncontrado] = useState<any>(null);

  // Control de Actualización Mensual (cada 30 días)
  const [esActualizacionMensual, setEsActualizacionMensual] = useState(false);
  const [diasDesdeUltimaActualizacion, setDiasDesdeUltimaActualizacion] = useState<number | null>(null);

  // Función verificadora de actualización periódica (30 días) o requerimiento de username
  const verificarRequiereActualizacion = (userData: any): boolean => {
    if (!userData) return false;
    // 1. Si está marcado como primer ingreso o no tiene contraseña registrada
    if (userData.primer_ingreso === true || !userData.clave) return true;

    const pAcceso = userData.perfil_acceso || {};

    // 2. Si no tiene nombre de usuario asignado o no tiene confirmación de datos previa
    if (!pAcceso.username || !pAcceso.username.trim()) return true;
    if (!pAcceso.fecha_actualizacion_datos) return true;

    // 3. Si han transcurrido 30 días o más desde la última actualización de datos
    const fechaRef = pAcceso.fecha_actualizacion_datos;
    const fechaTime = new Date(fechaRef).getTime();
    if (isNaN(fechaTime)) return true;

    const ahora = Date.now();
    const diffDias = (ahora - fechaTime) / (1000 * 60 * 60 * 24);
    return diffDias >= 30; // 30 días o más
  };

  // Estados para Registro / Primer Ingreso / Actualización Mensual
  const [primerIngresoData, setPrimerIngresoData] = useState({
    cedula: '',
    nombreCompleto: '',
    rol: 'Representante',
    cargo: '',
    email: '',
    codigoPais: '+58',
    telefonoNumero: '',
    telefono: '',
    username: '',
    password: '',
    confirmPassword: '',
    pregunta1: PREGUNTAS_SEGURIDAD_OPCIONES[0],
    respuesta1: '',
    pregunta2: PREGUNTAS_SEGURIDAD_OPCIONES[1],
    respuesta2: '',
    pregunta3: PREGUNTAS_SEGURIDAD_OPCIONES[2],
    respuesta3: '',
    modoFoto: 'avatar' as 'avatar' | 'subir',
    avatarSeleccionado: 'avatar-1',
    fotoSubidaUrl: '',
    fotoBase64: ''
  });

  // Modal de Recorte de Foto
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imagenOriginalParaRecortar, setImagenOriginalParaRecortar] = useState<string | null>(null);

  // Recuperación de Contraseña
  const [recuperarIdentificador, setRecuperarIdentificador] = useState('');
  const [recuperarUsuario, setRecuperarUsuario] = useState<any>(null);
  const [recuperarPregunta1, setRecuperarPregunta1] = useState('');
  const [recuperarPregunta2, setRecuperarPregunta2] = useState('');
  const [recuperarRespuesta1, setRecuperarRespuesta1] = useState('');
  const [recuperarRespuesta2, setRecuperarRespuesta2] = useState('');
  const [recuperarNuevaClave, setRecuperarNuevaClave] = useState('');
  const [recuperarConfirmClave, setRecuperarConfirmClave] = useState('');
  const [recuperarExito, setRecuperarExito] = useState(false);
  const [mostrarModalRestauracionTotal, setMostrarModalRestauracionTotal] = useState(false);
  const [restauracionConfirmada, setRestauracionConfirmada] = useState(false);

  // Modal de Verificación Pública QR y Modal de Recuperación
  const [modalQR, setModalQR] = useState(false);
  const [codigoQR, setCodigoQR] = useState('');
  const [mostrarModalRecuperar, setMostrarModalRecuperar] = useState(false);

  // Invitados
  const [invCedula, setInvCedula] = useState('');
  const [invNombres, setInvNombres] = useState('');
  const [invApellidos, setInvApellidos] = useState('');
  const [invCorreo, setInvCorreo] = useState('');
  const [invTelefono, setInvTelefono] = useState('');
  const [invMotivo, setInvMotivo] = useState('');

  // Sugerencias inteligentes de alias
  const sugerenciasUsuario = useMemo(() => {
    const nombre = usuarioEncontrado?.nombre_completo || primerIngresoData.nombreCompleto;
    return generarSugerenciasUsuario(nombre);
  }, [usuarioEncontrado?.nombre_completo, primerIngresoData.nombreCompleto]);

  // Manejo de carga de foto con recorte
  const handleSeleccionarArchivoFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Por favor seleccione un archivo de imagen válido (JPG, PNG o WEBP).');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError('La imagen supera los 12 MB. Elija una imagen más liviana.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImagenOriginalParaRecortar(reader.result as string);
      setCropperOpen(true);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedBase64: string) => {
    setPrimerIngresoData(prev => ({
      ...prev,
      modoFoto: 'subir',
      fotoBase64: croppedBase64,
      fotoSubidaUrl: croppedBase64
    }));
  };

  // Función común para culminar login exitoso
  const finalizarLogin = (userObj: any) => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.65 }
      });
    } catch (e) { }

    const cleanUserData = {
      id: userObj.id_usuario || userObj.id,
      nombre: userObj.nombre_completo || userObj.nombre || 'Usuario',
      cedula: userObj.cedula,
      rol: userObj.rol || 'Usuario',
      cargo: userObj.cargo || '',
      id_escuela: userObj.id_escuela || school,
      id_escuela_asignada: userObj.id_escuela || school,
      perfil_acceso: userObj.perfil_acceso || {},
      nombre_escuela: school === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar',
      email: userObj.email || userObj.correo,
      foto_perfil: userObj.foto_perfil || (userObj.perfil_acceso?.foto_perfil) || '',
      avatar_id: userObj.avatar_id || (userObj.perfil_acceso?.avatar_id) || 'avatar-1'
    };

    localStorage.setItem('sesion_sigae', 'activa');
    localStorage.setItem('sigae_escuela_codigo', school);
    localStorage.setItem('sigae_escuela_activa', school === 'sb' ? 'UE Santa Bárbara' : 'UE Libertador Bolívar');
    localStorage.setItem('usuario_sigae', JSON.stringify(cleanUserData));
    localStorage.removeItem('sigae_bloqueado_total');

    registrarSesionActiva(userObj.cedula);
    onLogin(cleanUserData);
  };

  // ==========================================
  // AUTENTICACIÓN DIRECTA (ESTILO INSTITUCIONAL EDTECH SIGAE)
  // ==========================================
  const handleLoginDirecto = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawId = identificador.trim();
    const soloNumeros = rawId.replace(/\D/g, '');

    if (!soloNumeros || soloNumeros.length < 6) {
      setError('Por favor ingrese un número de cédula válido (mínimo 6 dígitos).');
      return;
    }
    if (!password) {
      setError('Por favor ingrese su contraseña institucional.');
      return;
    }
    setCargando(true);
    setError('');

    try {
      // 1. Buscar usuario por cédula, email o username
      let query = supabase.from('usuarios').select('*');
      if (rawId.includes('@')) {
        query = query.eq('email', rawId.toLowerCase());
      } else {
        query = query.or(`cedula.eq.${soloNumeros},cedula.eq.${tipoDoc}-${soloNumeros},cedula.eq.${tipoDoc}${soloNumeros},cedula.eq.${rawId}`);
      }

      const { data, error: dbErr } = await query.maybeSingle();

      if (dbErr || !data) {
        // Verificar si es un estudiante vinculado
        if (soloNumeros.length >= 5) {
          try {
            const { data: estData } = await supabase
              .from('estudiantes_vinculaciones')
              .select('nombres_estudiante, apellidos_estudiante, cedula_representante')
              .or(`cedula_estudiante.eq.${soloNumeros},cedula_estudiante.eq.CE-${soloNumeros}`)
              .limit(1)
              .maybeSingle();

            if (estData) {
              const nomEst = `${estData.nombres_estudiante || ''} ${estData.apellidos_estudiante || ''}`.trim();
              setError(`La cédula ingresada corresponde al estudiante "${nomEst}". Para ingresar o gestionar constancias, el representante debe ingresar con su propia Cédula de Identidad.`);
              setCargando(false);
              return;
            }
          } catch (e) { }
        }

        setError('Credenciales inválidas. Por favor verifique sus datos.');
        setCargando(false);
        return;
      }

      // 2. Verificar estado de bloqueo
      if (data.estado === 'Bloqueado') {
        setError('Usuario BLOQUEADO permanentemente por la administración.');
        setCargando(false);
        return;
      }

      if (data.bloqueo_hasta) {
        const bloqueo = new Date(data.bloqueo_hasta).getTime();
        const ahora = new Date().getTime();
        if (bloqueo > ahora) {
          const faltan = Math.ceil((bloqueo - ahora) / 60000);
          setError(`Cuenta bloqueada temporalmente. Intente nuevamente en ${faltan} minutos.`);
          setCargando(false);
          return;
        }
      }

      // 3. Verificar si es primer ingreso
      if (data.primer_ingreso === true || !data.clave) {
        setUsuarioEncontrado(data);
        setPrimerIngresoData(prev => ({
          ...prev,
          cedula: data.cedula,
          nombreCompleto: data.nombre_completo || '',
          rol: data.rol || 'Usuario',
          cargo: data.cargo || '',
          email: data.email || ''
        }));
        setSubPasoPrimerIngreso(1);
        setPaso('primer_ingreso');
        setCargando(false);
        return;
      }

      // 4. Validar contraseña
      if (data.clave !== password) {
        const intentos = (data.intentos_fallidos || 0) + 1;
        if (intentos >= 3) {
          const bloqueoHasta = new Date(Date.now() + 30 * 60000).toISOString();
          await supabase.from('usuarios').update({ intentos_fallidos: 0, bloqueo_hasta: bloqueoHasta }).eq('cedula', data.cedula);
          setError('Ha superado los 3 intentos fallidos. Su cuenta ha sido bloqueada temporalmente por 30 minutos.');
        } else {
          await supabase.from('usuarios').update({ intentos_fallidos: intentos }).eq('cedula', data.cedula);
          setError(`Contraseña incorrecta. Intento ${intentos} de 3.`);
        }
        setCargando(false);
        return;
      }

      // 5. Restablecer intentos fallidos
      if (data.intentos_fallidos > 0 || data.bloqueo_hasta) {
        await supabase.from('usuarios').update({ intentos_fallidos: 0, bloqueo_hasta: null }).eq('cedula', data.cedula);
      }

      if (recordarSesion) {
        localStorage.setItem('sigae_recordar_identificador', data.cedula);
      } else {
        localStorage.removeItem('sigae_recordar_identificador');
      }

      // 6. Verificar si requiere actualización periódica (30 días), establecer username o confirmar datos
      if (verificarRequiereActualizacion(data)) {
        iniciarActualizacionDatos(data, true);
        setCargando(false);
        return;
      }

      finalizarLogin(data);
    } catch (err) {
      console.error(err);
      setError('Error al autenticar con el servidor.');
    }
    setCargando(false);
  };

  // Iniciar flujo de Registro Inicial o Actualización Periódica de Datos
  const iniciarActualizacionDatos = (data: any, esMensual: boolean) => {
    const pAcceso = data?.perfil_acceso || {};
    let codPais = '+58';
    let numTel = data?.telefono || '';
    if (numTel.startsWith('+')) {
      const partes = numTel.split(' ');
      if (partes.length >= 2) {
        codPais = partes[0];
        numTel = partes.slice(1).join(' ');
      }
    }
    const preg = data?.preguntas_seguridad || {};
    const fechaRef = pAcceso.fecha_actualizacion_datos || data?.fecha_actualizacion_datos || data?.fecha_ult_clave || data?.created_at;
    const dias = fechaRef ? Math.floor((Date.now() - new Date(fechaRef).getTime()) / (1000 * 60 * 60 * 24)) : 30;

    setEsActualizacionMensual(esMensual);
    setDiasDesdeUltimaActualizacion(dias);
    setUsuarioEncontrado(data);
    setPrimerIngresoData({
      cedula: data?.cedula || '',
      nombreCompleto: data?.nombre_completo || '',
      rol: data?.rol || 'Usuario',
      cargo: data?.cargo || '',
      email: data?.email || '',
      codigoPais: codPais,
      telefonoNumero: numTel,
      telefono: data?.telefono || '',
      username: pAcceso.username || '',
      password: data?.clave || '',
      confirmPassword: data?.clave || '',
      pregunta1: preg.pregunta_1 || PREGUNTAS_SEGURIDAD_OPCIONES[0],
      respuesta1: preg.respuesta_1 || '',
      pregunta2: preg.pregunta_2 || PREGUNTAS_SEGURIDAD_OPCIONES[1],
      respuesta2: preg.respuesta_2 || '',
      pregunta3: preg.pregunta_3 || PREGUNTAS_SEGURIDAD_OPCIONES[2],
      respuesta3: preg.respuesta_3 || '',
      modoFoto: (pAcceso.foto_perfil || data?.foto_perfil) ? 'subir' : 'avatar',
      avatarSeleccionado: pAcceso.avatar_id || data?.avatar_id || 'avatar-1',
      fotoSubidaUrl: pAcceso.foto_perfil || data?.foto_perfil || '',
      fotoBase64: pAcceso.foto_perfil || data?.foto_perfil || ''
    });
    setSubPasoPrimerIngreso(1);
    setPaso('primer_ingreso');
  };

  // ==========================================
  // PASO 1: VERIFICAR CÉDULA / USUARIO
  // ==========================================
  const handleVerificarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificador.trim()) {
      setError('Por favor ingrese su cédula o nombre de usuario.');
      return;
    }
    setCargando(true);
    setError('');

    const rawId = identificador.trim();
    const idLimpio = rawId.replace(/^@+/, '');
    const soloNumeros = idLimpio.replace(/\D/g, '');

    try {
      let data = null;

      // 1. Si contiene 5 o más números, consultar por cédula
      if (soloNumeros.length >= 5) {
        const { data: dCed } = await supabase
          .from('usuarios')
          .select('*')
          .or(`cedula.eq.${soloNumeros},cedula.eq.${idLimpio}`)
          .maybeSingle();
        if (dCed) data = dCed;
      }

      // 2. Si contiene arroba, buscar por correo electrónico
      if (!data && idLimpio.includes('@')) {
        const { data: dMail } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', idLimpio.toLowerCase())
          .maybeSingle();
        if (dMail) data = dMail;
      }

      // 3. Buscar por alias / nombre de usuario en perfil_acceso->>username
      if (!data) {
        try {
          const { data: dUser } = await supabase
            .from('usuarios')
            .select('*')
            .filter('perfil_acceso->>username', 'eq', idLimpio.toLowerCase())
            .maybeSingle();
          if (dUser) data = dUser;
        } catch (e) {
          console.warn('Búsqueda por perfil_acceso->>username:', e);
        }
      }

      // 4. Si aún no se localiza, consultar por coincidencia directa de cédula
      if (!data) {
        const { data: dDirect } = await supabase
          .from('usuarios')
          .select('*')
          .eq('cedula', idLimpio)
          .maybeSingle();
        if (dDirect) data = dDirect;
      }

      if (data) {
        // Usuario encontrado en el sistema
        if (data.estado === 'Bloqueado') {
          setError('Usuario BLOQUEADO permanentemente por la administración.');
          setCargando(false);
          return;
        }

        if (data.bloqueo_hasta) {
          const bloqueo = new Date(data.bloqueo_hasta).getTime();
          const ahora = new Date().getTime();
          if (bloqueo > ahora) {
            const faltan = Math.ceil((bloqueo - ahora) / 60000);
            setError(`Cuenta bloqueada temporalmente por seguridad. Intente en ${faltan} minutos.`);
            setCargando(false);
            return;
          }
        }

        setUsuarioEncontrado(data);

        // Si es primer ingreso o no tiene clave configurada
        if (data.primer_ingreso === true || !data.clave) {
          iniciarActualizacionDatos(data, false);
        } else {
          setPaso('clave');
        }
      } else {
        // Verificar si es un estudiante vinculado
        if (soloNumeros.length >= 5) {
          try {
            const { data: estData } = await supabase
              .from('estudiantes_vinculaciones')
              .select('nombres_estudiante, apellidos_estudiante, cedula_representante, nombres_representante')
              .or(`cedula_estudiante.eq.${soloNumeros},cedula_estudiante.eq.CE-${soloNumeros}`)
              .limit(1)
              .maybeSingle();

            if (estData) {
              const nomEst = `${estData.nombres_estudiante || ''} ${estData.apellidos_estudiante || ''}`.trim();
              const repInfo = estData.cedula_representante ? ` (Cédula de Representante vinculada: ${estData.cedula_representante})` : '';
              setError(`Esta cédula corresponde al estudiante "${nomEst}". Para ingresar o gestionar constancias, el representante debe ingresar con su propia Cédula de Identidad${repInfo}.`);
              setCargando(false);
              return;
            }
          } catch (e) { }
        }

        // Cédula o usuario no registrado -> Mostrar confirmación
        setPaso('confirmar_no_registrado');
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor.');
    }
    setCargando(false);
  };

  // ==========================================
  // PASO 2: INICIAR SESIÓN CON CLAVE
  // ==========================================
  const handleLoginClave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Ingrese su contraseña.');
      return;
    }
    setCargando(true);
    setError('');

    try {
      const { data, error: dbErr } = await supabase
        .from('usuarios')
        .select('*')
        .eq('cedula', usuarioEncontrado.cedula)
        .maybeSingle();

      if (dbErr || !data) {
        setError('Error al consultar datos de usuario.');
        setCargando(false);
        return;
      }

      if (data.clave !== password) {
        const intentos = (data.intentos_fallidos || 0) + 1;
        if (intentos >= 3) {
          const bloqueoHasta = new Date(new Date().getTime() + 30 * 60000).toISOString();
          await supabase.from('usuarios').update({ intentos_fallidos: 0, bloqueo_hasta: bloqueoHasta }).eq('cedula', data.cedula);
          setError('Ha superado los 3 intentos fallidos. Su cuenta ha sido bloqueada temporalmente por 30 minutos.');
        } else {
          await supabase.from('usuarios').update({ intentos_fallidos: intentos }).eq('cedula', data.cedula);
          setError(`Contraseña incorrecta. Intento ${intentos} de 3. Le quedan ${3 - intentos} intentos.`);
        }
        setCargando(false);
        return;
      }

      // Éxito: restablecer intentos
      if (data.intentos_fallidos > 0 || data.bloqueo_hasta) {
        await supabase.from('usuarios').update({ intentos_fallidos: 0, bloqueo_hasta: null }).eq('cedula', data.cedula);
      }

      // Verificar si requiere actualización periódica (cada 30 días) o establecer su nombre de usuario
      if (verificarRequiereActualizacion(data)) {
        iniciarActualizacionDatos(data, true);
        setCargando(false);
        return;
      }

      finalizarLogin(data);
    } catch (err) {
      console.error(err);
      setError('Error al autenticar.');
    }
    setCargando(false);
  };

  // ==========================================
  // PASO 3: REGISTRO / ACTUALIZACIÓN MENSUAL (2 SUB-PASOS)
  // ==========================================
  const handleAvanzarPaso2PrimerIngreso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primerIngresoData.password || primerIngresoData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (primerIngresoData.password !== primerIngresoData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!primerIngresoData.email || !primerIngresoData.telefonoNumero) {
      setError('Complete todos los campos obligatorios de contacto.');
      return;
    }

    const userClean = primerIngresoData.username.trim().toLowerCase().replace(/^@+/, '');
    if (!userClean || userClean.length < 3) {
      setError('Por favor establezca un nombre de usuario de al menos 3 caracteres para sus próximos accesos.');
      return;
    }

    setCargando(true);
    setError('');

    // Verificar si el username ya lo tiene otro usuario
    try {
      const cedulaActual = usuarioEncontrado?.cedula || primerIngresoData.cedula;
      const { data: usuarioExistente } = await supabase
        .from('usuarios')
        .select('cedula')
        .filter('perfil_acceso->>username', 'eq', userClean)
        .neq('cedula', cedulaActual)
        .maybeSingle();

      if (usuarioExistente) {
        setError(`El nombre de usuario "@${userClean}" ya se encuentra registrado por otro usuario. Por favor elija un alias diferente.`);
        setCargando(false);
        return;
      }
    } catch (err) {
      console.warn('Verificando disponibilidad de username:', err);
    }

    setCargando(false);
    setSubPasoPrimerIngreso(2);
  };

  const handleGuardarPrimerIngreso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primerIngresoData.respuesta1.trim() || !primerIngresoData.respuesta2.trim() || !primerIngresoData.respuesta3.trim()) {
      setError('Por favor responda a las tres preguntas de seguridad.');
      return;
    }
    setCargando(true);
    setError('');

    try {
      const preguntasObj = {
        pregunta_1: primerIngresoData.pregunta1,
        respuesta_1: primerIngresoData.respuesta1.trim().toLowerCase(),
        pregunta_2: primerIngresoData.pregunta2,
        respuesta_2: primerIngresoData.respuesta2.trim().toLowerCase(),
        pregunta_3: primerIngresoData.pregunta3,
        respuesta_3: primerIngresoData.respuesta3.trim().toLowerCase()
      };

      const userClean = primerIngresoData.username.trim().toLowerCase().replace(/^@+/, '');
      const perfilAccesoActual = usuarioEncontrado?.perfil_acceso || {};
      const ahoraIso = new Date().toISOString();
      const perfilAccesoActualizado = {
        ...perfilAccesoActual,
        username: userClean,
        fecha_actualizacion_datos: ahoraIso,
        avatar_id: primerIngresoData.modoFoto === 'avatar' ? primerIngresoData.avatarSeleccionado : null,
        foto_perfil: primerIngresoData.modoFoto === 'subir' ? primerIngresoData.fotoBase64 : null,
        almacenamiento_foto: primerIngresoData.modoFoto === 'subir' ? 'google_drive' : 'avatar_sistema',
        drive_carpeta: primerIngresoData.modoFoto === 'subir' ? 'SIGAE_FOTOS_PERFIL' : null,
        drive_sync_status: primerIngresoData.modoFoto === 'subir' ? 'registrado' : null,
        drive_fecha_registro: primerIngresoData.modoFoto === 'subir' ? ahoraIso : null
      };

      const cedulaDestino = usuarioEncontrado?.cedula || primerIngresoData.cedula;

      // Actualizar o Insertar usuario en Supabase
      const { error: updErr } = await supabase
        .from('usuarios')
        .upsert({
          cedula: cedulaDestino,
          nombre_completo: primerIngresoData.nombreCompleto || usuarioEncontrado?.nombre_completo || 'Usuario SIGAE',
          rol: primerIngresoData.rol || usuarioEncontrado?.rol || 'Representante',
          cargo: primerIngresoData.cargo || usuarioEncontrado?.cargo || '',
          email: primerIngresoData.email,
          telefono: primerIngresoData.telefono || `${primerIngresoData.codigoPais} ${primerIngresoData.telefonoNumero}`.trim(),
          clave: primerIngresoData.password,
          primer_ingreso: false,
          estado: 'Activo',
          id_escuela: school,
          preguntas_seguridad: preguntasObj,
          perfil_acceso: perfilAccesoActualizado,
          fecha_ult_clave: ahoraIso
        }, { onConflict: 'cedula' });

      if (updErr) {
        console.error(updErr);
        setError('No se pudo guardar la configuración en la base de datos.');
        setCargando(false);
        return;
      }

      // Consultar el registro limpio
      const { data: usuarioCreado } = await supabase
        .from('usuarios')
        .select('*')
        .eq('cedula', cedulaDestino)
        .maybeSingle();

      finalizarLogin(usuarioCreado || {
        cedula: cedulaDestino,
        nombre_completo: primerIngresoData.nombreCompleto,
        rol: primerIngresoData.rol,
        id_escuela: school,
        perfil_acceso: perfilAccesoActualizado
      });
    } catch (err) {
      console.error(err);
      setError('Error al procesar el registro.');
    }
    setCargando(false);
  };

  // ==========================================
  // PASO 4: RECUPERACIÓN DE CONTRASEÑA
  // ==========================================
  const handleConsultarRecuperacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recuperarIdentificador.trim()) {
      setError('Ingrese su cédula o usuario.');
      return;
    }
    setCargando(true);
    setError('');

    try {
      const id = recuperarIdentificador.trim();
      const soloNum = id.replace(/\D/g, '');
      let query = supabase.from('usuarios').select('*');
      if (soloNum.length >= 5) {
        query = query.or(`cedula.eq.${soloNum},cedula.eq.${id}`);
      } else {
        query = query.eq('cedula', id);
      }

      const { data, error: dbErr } = await query.maybeSingle();

      if (dbErr || !data) {
        setError('Usuario no encontrado en el sistema.');
        setCargando(false);
        return;
      }

      let pObj: any = {};
      try {
        pObj = typeof data.preguntas_seguridad === 'string' ? JSON.parse(data.preguntas_seguridad) : (data.preguntas_seguridad || {});
      } catch (e) { }

      const p1 = pObj.pregunta_1;
      const p2 = pObj.pregunta_2 || pObj.pregunta_3;

      if (!p1 && !p2) {
        setError('Este usuario no tiene preguntas de seguridad configuradas. Utilice la opción de Restauración Total.');
        setCargando(false);
        return;
      }

      setRecuperarUsuario(data);
      setRecuperarPregunta1(p1 || PREGUNTAS_SEGURIDAD_OPCIONES[0]);
      setRecuperarPregunta2(p2 || PREGUNTAS_SEGURIDAD_OPCIONES[1]);
      setRecuperarRespuesta1('');
      setRecuperarRespuesta2('');
      setRecuperarNuevaClave('');
      setRecuperarConfirmClave('');
    } catch (err) {
      console.error(err);
      setError('Error de conexión.');
    }
    setCargando(false);
  };

  const handleRestablecerClave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recuperarNuevaClave || recuperarNuevaClave.length < 6) {
      setError('La nueva contraseña debe tener mínimo 6 caracteres.');
      return;
    }
    if (recuperarNuevaClave !== recuperarConfirmClave) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setCargando(true);
    setError('');

    try {
      let pObj: any = {};
      try {
        pObj = typeof recuperarUsuario.preguntas_seguridad === 'string'
          ? JSON.parse(recuperarUsuario.preguntas_seguridad)
          : (recuperarUsuario.preguntas_seguridad || {});
      } catch (e) { }

      const r1Real = (pObj.respuesta_1 || '').trim().toLowerCase();
      const r2Real = (pObj.respuesta_2 || pObj.respuesta_3 || '').trim().toLowerCase();

      const r1Ingresada = recuperarRespuesta1.trim().toLowerCase();
      const r2Ingresada = recuperarRespuesta2.trim().toLowerCase();

      if (r1Real && r1Ingresada !== r1Real) {
        setError('La respuesta a la 1ra pregunta es incorrecta.');
        setCargando(false);
        return;
      }
      if (r2Real && r2Ingresada !== r2Real) {
        setError('La respuesta a la 2da pregunta es incorrecta.');
        setCargando(false);
        return;
      }

      const { error: updErr } = await supabase
        .from('usuarios')
        .update({
          clave: recuperarNuevaClave,
          intentos_fallidos: 0,
          bloqueo_hasta: null,
          fecha_ult_clave: new Date().toISOString()
        })
        .eq('cedula', recuperarUsuario.cedula);

      if (updErr) {
        setError('Error al actualizar la contraseña.');
        setCargando(false);
        return;
      }

      setRecuperarExito(true);
    } catch (err) {
      console.error(err);
      setError('Error de conexión.');
    }
    setCargando(false);
  };

  const handleSolicitarRestauracionTotal = async () => {
    const targetCedula = recuperarUsuario?.cedula || recuperarIdentificador;
    if (!targetCedula) return;
    setCargando(true);
    try {
      await supabase
        .from('usuarios')
        .update({ solicito_reseteo: true })
        .eq('cedula', targetCedula);
      setRestauracionConfirmada(true);
    } catch (err) {
      console.error(err);
    }
    setCargando(false);
  };

  // ==========================================
  // PASO 5: REGISTRO DE INVITADO
  // ==========================================
  const handleRegistrarInvitado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invNombres || !invApellidos || !invCorreo || !invTelefono || !invMotivo) {
      setError('Complete todos los campos del formulario de visita.');
      return;
    }
    setCargando(true);
    setError('');

    try {
      const guestData = {
        cedula: identificador.replace(/\D/g, '') || `INV-${Date.now().toString().slice(-6)}`,
        nombres: invNombres,
        apellidos: invApellidos,
        correo: invCorreo,
        telefono: invTelefono,
        motivo: invMotivo,
        escuela: school
      };

      await supabase.from('invitados').insert([guestData]);

      finalizarLogin({
        cedula: guestData.cedula,
        nombre_completo: `${invNombres} ${invApellidos}`.trim(),
        rol: 'Invitado(a)',
        cargo: 'Visitante Institucional',
        id_escuela: school
      });
    } catch (err) {
      console.error(err);
      setError('Error al registrar visitante.');
    }
    setCargando(false);
  };

  // Acceso Biométrico rápido
  const handleLoginBiometrico = async () => {
    setError('');
    const tiene = localStorage.getItem('sigae_tiene_huella');
    const uStr = localStorage.getItem('usuario_sigae');
    if (tiene && uStr) {
      try {
        const u = JSON.parse(uStr);
        // Verificar si existe en BD para aplicar política mensual de 30 días
        setCargando(true);
        const { data: userDb } = await supabase
          .from('usuarios')
          .select('*')
          .eq('cedula', u.cedula)
          .maybeSingle();

        setCargando(false);
        const targetUser = userDb || u;
        if (verificarRequiereActualizacion(targetUser)) {
          iniciarActualizacionDatos(targetUser, true);
          return;
        }

        finalizarLogin(targetUser);
      } catch (e) {
        setCargando(false);
        setError('No se pudo verificar la credencial biométrica.');
      }
    } else {
      setError('No hay huella o PIN registrado en este dispositivo.');
    }
  };

  const resetForm = () => {
    setPaso('identificar');
    setPassword('');
    setError('');
    setUsuarioEncontrado(null);
    setRecuperarUsuario(null);
    setMostrarModalRestauracionTotal(false);
    setRestauracionConfirmada(false);
    setEsActualizacionMensual(false);
    setDiasDesdeUltimaActualizacion(null);
  };

  // Resolver imagen para preview en el paso de clave
  const fotoPreviewClave = useMemo(() => {
    if (!usuarioEncontrado) return null;
    const pAcceso = usuarioEncontrado.perfil_acceso || {};
    if (pAcceso.foto_perfil) return pAcceso.foto_perfil;
    if (usuarioEncontrado.foto_perfil) return usuarioEncontrado.foto_perfil;
    if (pAcceso.avatar_id) {
      const av = AVATARES_DISPONIBLES.find(a => a.id === pAcceso.avatar_id);
      return av?.url || `/img/avatars/${pAcceso.avatar_id}.png`;
    }
    if (usuarioEncontrado.avatar_id) {
      const av = AVATARES_DISPONIBLES.find(a => a.id === usuarioEncontrado.avatar_id);
      return av?.url || `/img/avatars/${usuarioEncontrado.avatar_id}.png`;
    }
    return null;
  }, [usuarioEncontrado]);

  const escuelaActiva = ESCUELAS_DATA[school];

  const formContent = (
    <div className={`w-full h-full flex flex-col ${paso === 'primer_ingreso' ? 'justify-start overflow-y-auto pr-1' : 'justify-center'} gap-3 py-1 px-1 sm:px-2 custom-scrollbar`}>
      {/* Título de la Tarjeta */}
      {paso !== 'primer_ingreso' && (
        <div className="text-center mb-0.5">
          <h1 className="text-xl sm:text-2xl md:text-[26px] font-black text-[#0b2545] tracking-tight">
            Inicio de Sesión
          </h1>
        </div>
      )}

      {/* SELECTOR DE PLANTEL CON ESCUDOS Y LOCALIDADES */}
      {paso !== 'primer_ingreso' && (
        <div className="flex items-center justify-center gap-2 mb-2 w-full">
          <button
            type="button"
            onClick={() => handleSchoolChange('sb')}
            style={{ borderRadius: '16px' }}
            className={`flex-1 py-1.5 px-2.5 flex items-center gap-2 transition-all duration-200 hover:scale-[1.025] active:scale-[0.97] shadow-xs cursor-pointer text-left border ${
              school === 'sb'
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-cyan-400 shadow-cyan-500/25 ring-2 ring-cyan-400/30'
                : 'bg-white/85 hover:bg-white text-slate-700 border-cyan-200/80 hover:border-cyan-300'
            }`}
          >
            <img
              src="/img/escudo-santabarbara.png"
              alt="Santa Bárbara"
              className="w-6 h-6 object-contain shrink-0 drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold leading-tight truncate">
                U.E. Santa Bárbara
              </span>
              <span className={`text-[8px] sm:text-[8.5px] leading-tight truncate ${school === 'sb' ? 'text-cyan-100 font-medium' : 'text-slate-500'}`}>
                El Tejero, estado Monagas
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSchoolChange('lb')}
            style={{ borderRadius: '16px' }}
            className={`flex-1 py-1.5 px-2.5 flex items-center gap-2 transition-all duration-200 hover:scale-[1.025] active:scale-[0.97] shadow-xs cursor-pointer text-left border ${
              school === 'lb'
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-cyan-400 shadow-cyan-500/25 ring-2 ring-cyan-400/30'
                : 'bg-white/85 hover:bg-white text-slate-700 border-cyan-200/80 hover:border-cyan-300'
            }`}
          >
            <img
              src="/img/escudo-bolivar.png"
              alt="Libertador Bolívar"
              className="w-6 h-6 object-contain shrink-0 drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold leading-tight truncate">
                U.E. Libertador Bolívar
              </span>
              <span className={`text-[8px] sm:text-[8.5px] leading-tight truncate ${school === 'lb' ? 'text-cyan-100 font-medium' : 'text-slate-500'}`}>
                Miraflores, estado Monagas
              </span>
            </div>
          </button>
        </div>
      )}

            {/* Alerta de Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-3.5 py-2 mb-3.5 bg-red-50 border border-red-300 text-red-700 rounded-2xl text-[11px] font-bold flex items-center gap-2 shadow-xs"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span className="leading-tight truncate">{error}</span>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {/* ========================================================
                  PASO 1: SOLO USUARIO / CÉDULA
              ======================================================== */}
              {paso === 'identificar' && (
                <motion.div
                  key="paso-identificar"
                  initial={{ opacity: 0, y: 12, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.99 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-4 w-full"
                >
                  <form onSubmit={handleVerificarUsuario} className="space-y-3.5 w-full">
                    {/* Campo Usuario o Cédula */}
                    <div className="space-y-1 w-full text-left">
                      <div className="sigae-mppe-input">
                        <User className="w-4.5 h-4.5 text-[#00bcd4] shrink-0" />
                        <input
                          type="text"
                          autoFocus
                          required
                          value={identificador}
                          onChange={(e) => setIdentificador(e.target.value)}
                          placeholder="Cédula o Usuario"
                          className="w-full h-full text-xs sm:text-sm font-semibold text-[#1e3a58] outline-none bg-transparent placeholder:text-[#6b90ad]"
                        />
                        {identificador && (
                          <button
                            type="button"
                            onClick={() => setIdentificador('')}
                            className="w-4.5 h-4.5 rounded-full bg-cyan-100 hover:bg-cyan-200 text-cyan-800 flex items-center justify-center text-[10px] shrink-0 cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* BOTÓN INGRESAR CON SHIMMER Y ESTADO DE CARGA */}
                    <div className="pt-2 flex flex-col items-center justify-center">
                      <button
                        type="submit"
                        disabled={cargando}
                        className="sigae-mppe-btn w-52 sm:w-60 h-11 sm:h-12"
                      >
                        {cargando ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs sm:text-sm font-bold tracking-wide">Validando...</span>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm sm:text-base font-bold tracking-wide">
                              Ingresar
                            </span>
                            <Sparkles className="w-4 h-4 text-white/90 absolute top-2.5 right-5 drop-shadow-[0_0_5px_white]" />
                          </>
                        )}
                      </button>

                      {/* Botón Biométrico: Ingreso con Huella Dactilar */}
                      <button
                        type="button"
                        onClick={handleLoginBiometrico}
                        className="sigae-biometric-btn mt-3 px-4 py-2 rounded-full bg-cyan-50/80 hover:bg-cyan-100/90 border border-cyan-200 text-cyan-800 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs group"
                      >
                        <Fingerprint className="w-4 h-4 text-[#00bcd4] transition-transform duration-300 group-hover:scale-110" />
                        <span>Ingreso con Huella Dactilar</span>
                      </button>

                      {/* Enlace ¿Olvidaste tu contraseña? */}
                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setRecuperarIdentificador(identificador);
                            setPaso('recuperar');
                            setError('');
                          }}
                          className="text-xs font-semibold text-cyan-700 hover:text-cyan-900 hover:underline transition-colors cursor-pointer"
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>

                      {/* Botón hacia la Página Web / Portal Institucional */}
                      <div className="pt-2.5 text-center border-t border-cyan-100/90 mt-2 w-full flex justify-center">
                        <Link
                          to="/portal"
                          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50/70 hover:bg-cyan-100/90 border border-cyan-200/90 text-cyan-900 text-[11px] font-bold transition-all shadow-2xs hover:shadow-xs hover:scale-[1.02] active:scale-[0.98] group cursor-pointer"
                        >
                          <Globe className="w-3.5 h-3.5 text-cyan-600 transition-transform duration-300 group-hover:rotate-45" />
                          <span>Sitio Web Institucional</span>
                          <ArrowRight className="w-3 h-3 text-cyan-500 transition-transform duration-200 group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}

            {/* ========================================================
                  PASO 2: CONTRASEÑA EN CASO DE CONTINUACIÓN DE FLUJO
              ======================================================== */}
            {paso === 'clave' && usuarioEncontrado && (
              <motion.div
                key="paso-clave"
                initial={{ opacity: 0, x: -16, scale: 0.99 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 16, scale: 0.99 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                <div className="p-3 bg-cyan-50/90 border border-cyan-200 rounded-2xl flex items-center gap-3 text-left shadow-2xs">
                  <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-white border border-cyan-300 shadow-xs shrink-0 flex items-center justify-center">
                    {fotoPreviewClave ? (
                      <img
                        src={fotoPreviewClave}
                        alt="Usuario"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/img/avatars/avatar-1.png';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-[#00bcd4] text-white font-bold flex items-center justify-center text-base">
                        {usuarioEncontrado.nombre_completo ? usuarioEncontrado.nombre_completo[0].toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-800 text-sm leading-snug truncate">
                        {usuarioEncontrado.nombre_completo || 'Usuario'}
                      </p>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full border border-cyan-300 shrink-0">
                        {usuarioEncontrado.rol || 'Personal SIGAE'}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
                      C.I. {usuarioEncontrado.cedula} &bull; Sede {school === 'sb' ? 'Santa Bárbara' : 'Libertador Bolívar'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleLoginClave} className="space-y-3.5 w-full">
                  <div className="space-y-1 w-full text-left">
                    <div className="flex items-center justify-between pb-0.5">
                      <label className="block text-[11px] font-bold text-slate-600 tracking-wider">
                        CONTRASEÑA
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setPaso('recuperar');
                          setRecuperarIdentificador(usuarioEncontrado.cedula);
                          setError('');
                        }}
                        className="text-[11px] text-cyan-700 hover:text-cyan-900 font-bold transition-colors hover:underline focus:outline-none cursor-pointer"
                      >
                        ¿Olvidaste tu clave?
                      </button>
                    </div>

                    <div className="sigae-mppe-input">
                      <Lock className="w-4 h-4 text-[#00bcd4] shrink-0" />
                      <input
                        type={mostrarPassword ? 'text' : 'password'}
                        autoFocus
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Contraseña"
                        className="w-full h-full text-xs sm:text-sm font-semibold text-[#1e3a58] outline-none bg-transparent placeholder:text-[#6b90ad]"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarPassword(!mostrarPassword)}
                        className="text-[#00bcd4] hover:text-[#00838f] text-xs shrink-0 cursor-pointer"
                      >
                        {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col items-center justify-center">
                    <button
                      type="submit"
                      disabled={cargando}
                      className="sigae-mppe-btn w-48 sm:w-56 h-11 sm:h-12"
                    >
                      {cargando ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs sm:text-sm font-bold tracking-wide">Validando...</span>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm sm:text-base font-bold tracking-wide">
                            Ingresar
                          </span>
                          <Sparkles className="w-3.5 h-3.5 text-white/90 absolute top-2.5 right-5 drop-shadow-[0_0_4px_white]" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="pt-2 text-center border-t border-slate-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs text-cyan-700 hover:text-cyan-900 font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver al formulario principal</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ========================================================
                  PASO: CONFIRMAR USUARIO NO REGISTRADO (FLUJO INVITADO)
              ======================================================== */}
            {paso === 'confirmar_no_registrado' && (
              <motion.div
                key="paso-confirmar"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center space-y-4 py-2"
              >
                <div className="w-14 h-14 rounded-full bg-blue-50 text-[#1D4ED8] mx-auto flex items-center justify-center border-2 border-blue-200 shadow-sm">
                  <ShieldCheck className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-800">¿La cédula o usuario es correcto?</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    El identificador <strong className="text-[#1D4ED8] font-mono text-sm">"{identificador}"</strong> no figura registrado en nuestra base de datos.
                  </p>
                  <p className="text-xs font-medium text-slate-600 mt-2.5">
                    ¿Deseas corregir el número ingresado o continuar con acceso como visitante/invitado?
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaso('identificar');
                      setError('');
                    }}
                    className="sigae-btn-push-secondary flex-1"
                  >
                    No, está errada
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaso('invitado');
                      setInvCedula(identificador.replace(/\D/g, '') || identificador);
                      setError('');
                    }}
                    className="sigae-btn-push-primary flex-1"
                  >
                    Sí, ingresar como Invitado
                  </button>
                </div>
              </motion.div>
            )}

            {/* ========================================================
                  PASO: REGISTRO / PRIMER INGRESO / ACTUALIZACIÓN MENSUAL
              ======================================================== */}
            {paso === 'primer_ingreso' && (
              <motion.div
                key="paso-primer-ingreso"
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -10 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-3.5"
              >
                {/* Banner de Actualización Mensual (Cada 30 días) */}
                {esActualizacionMensual && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-gradient-to-r from-cyan-50 via-sky-50 to-indigo-50 border border-cyan-300 rounded-2xl flex items-start gap-2.5 shadow-2xs"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <CalendarDays className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-cyan-950">
                          Confirmación y Actualización de Datos
                        </span>
                        <span className="text-[9px] font-extrabold uppercase bg-cyan-200/90 text-cyan-900 px-2 py-0.5 rounded-full border border-cyan-300">
                          Seguridad Mensual
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 leading-snug mt-0.5 font-medium">
                        Por normativas de seguridad escolar cada 30 días, por favor verifique sus datos registrados, modifique lo que sea necesario y confirme o asigne su <strong>Nombre de Usuario</strong> institucional para próximos accesos.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Barra de Progreso de 2 Pasos */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${subPasoPrimerIngreso === 1 ? 'bg-cyan-600 text-white shadow-sm' : 'bg-emerald-600 text-white'
                      }`}>
                      {subPasoPrimerIngreso === 1 ? '1' : '✓'}
                    </span>
                    <span className={`text-[11px] font-bold ${subPasoPrimerIngreso === 1 ? 'text-cyan-900' : 'text-slate-500'}`}>
                      {esActualizacionMensual ? 'Confirmar Datos & Usuario' : 'Datos, Foto & Clave'}
                    </span>
                  </div>

                  <span className="text-slate-300 font-bold">• • •</span>

                  <div className="flex items-center gap-1.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${subPasoPrimerIngreso === 2 ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'
                      }`}>
                      2
                    </span>
                    <span className={`text-[11px] font-bold ${subPasoPrimerIngreso === 2 ? 'text-cyan-900' : 'text-slate-400'}`}>
                      Preguntas de Seguridad
                    </span>
                  </div>
                </div>

                {/* SUB-PASO 1: DATOS, AVATAR/FOTO Y CONTRASEÑA */}
                {subPasoPrimerIngreso === 1 && (
                  <form onSubmit={handleAvanzarPaso2PrimerIngreso} className="space-y-3 text-xs">
                    {/* Ficha Compacta de Identidad con Preview en Vivo */}
                    <div className="p-3 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-xl flex items-center gap-3">
                      <div
                        className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-2xl bg-white shadow-sm shrink-0 overflow-hidden border border-slate-200 ring-2 ring-sky-400/60 p-0.5 relative flex items-center justify-center"
                        style={{ width: '56px', height: '56px' }}
                      >
                        {primerIngresoData.modoFoto === 'subir' && primerIngresoData.fotoSubidaUrl ? (
                          <img src={primerIngresoData.fotoSubidaUrl} alt="Foto de perfil" className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <img
                            src={AVATARES_DISPONIBLES.find(a => a.id === primerIngresoData.avatarSeleccionado)?.url || '/img/avatars/avatar-1.png'}
                            alt="Avatar"
                            className="w-full h-full object-contain p-0.5"
                          />
                        )}
                      </div>
                      <div className="overflow-hidden flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-extrabold uppercase bg-sky-200 text-sky-800 px-1.5 py-0.2 rounded">
                            {esActualizacionMensual ? 'Confirmación Periódica' : 'Registro / Activación'}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            C.I. {primerIngresoData.cedula || 'Pendiente'}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-slate-800 text-xs truncate">
                          {primerIngresoData.nombreCompleto || 'Usuario SIGAE'}
                        </h3>
                        <p className="text-[10px] text-sky-700 truncate">
                          Sede {school === 'sb' ? 'Santa Bárbara' : 'Libertador Bolívar'}
                        </p>
                      </div>
                    </div>

                    {/* SELECTOR DE FOTO O AVATAR */}
                    <div className="p-3 bg-slate-50/90 border border-slate-200 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                          <Smile className="w-3.5 h-3.5 text-sky-600" />
                          <span>Foto de Perfil o Avatar Institucional *</span>
                        </label>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                          <Cloud className="w-2.5 h-2.5" />
                          <span>Perfil Digital</span>
                        </div>
                      </div>

                      {/* Pestañas: Elegir Avatar vs Subir Foto */}
                      <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-lg text-[10px] font-bold text-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPrimerIngresoData(prev => ({ ...prev, modoFoto: 'avatar' }))}
                          className={`py-1 px-2 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${primerIngresoData.modoFoto === 'avatar'
                            ? 'bg-white text-sky-900 shadow-sm border border-slate-200 font-extrabold'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                          <Smile className="w-3 h-3 text-sky-600" />
                          <span>Elegir Avatar (8)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrimerIngresoData(prev => ({ ...prev, modoFoto: 'subir' }))}
                          className={`py-1 px-2 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${primerIngresoData.modoFoto === 'subir'
                            ? 'bg-white text-sky-900 shadow-sm border border-slate-200 font-extrabold'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                          <Camera className="w-3 h-3 text-sky-600" />
                          <span>Subir Foto Personal</span>
                        </button>
                      </div>

                      {/* Catálogo de Avatares Oficiales */}
                      {primerIngresoData.modoFoto === 'avatar' && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-slate-500 font-medium">
                            Selecciona tu avatar preferido:
                          </p>
                          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-1 pb-0.5">
                            {AVATARES_DISPONIBLES.map((av) => {
                              const activo = primerIngresoData.avatarSeleccionado === av.id;
                              return (
                                <button
                                  key={av.id}
                                  type="button"
                                  onClick={() => setPrimerIngresoData(prev => ({ ...prev, avatarSeleccionado: av.id }))}
                                  className={`relative p-1 rounded-xl flex items-center justify-center transition-all cursor-pointer ${activo
                                    ? 'bg-sky-50 border-2 border-sky-600 scale-105 shadow-md shadow-sky-600/20 ring-2 ring-sky-300'
                                    : 'bg-white border border-slate-200 hover:border-sky-300 hover:bg-slate-50'
                                    }`}
                                >
                                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center">
                                    <img src={av.url} alt="Avatar" className="w-full h-full object-contain" />
                                  </div>
                                  {activo && (
                                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-sky-600 text-white rounded-full flex items-center justify-center text-[7px] font-black shadow-xs">
                                      ✓
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Subir Foto con Recorte Circular y Respaldo en Drive */}
                      {primerIngresoData.modoFoto === 'subir' && (
                        <div className="space-y-2 p-2.5 bg-white rounded-xl border border-dashed border-cyan-300 text-center">
                          <div className="flex items-center justify-between pb-1 border-b border-cyan-100">
                            <span className="text-[9.5px] font-bold text-slate-600">Almacenamiento Cloud</span>
                            <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                              <Cloud className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Google Drive Institucional</span>
                            </div>
                          </div>
                          {primerIngresoData.fotoSubidaUrl ? (
                            <div className="flex items-center justify-center gap-3 py-1">
                              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-cyan-600 shadow-md shrink-0 ring-2 ring-cyan-300 flex items-center justify-center">
                                <img src={primerIngresoData.fotoSubidaUrl} alt="Foto recortada" className="w-full h-full object-cover rounded-full" />
                              </div>
                              <div className="text-left space-y-1">
                                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Foto lista para respaldo en Drive</span>
                                </span>
                                <div className="flex items-center gap-1.5 pt-0.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (imagenOriginalParaRecortar || primerIngresoData.fotoSubidaUrl) {
                                        setCropperOpen(true);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-50 border border-cyan-200 rounded-lg text-[10px] font-bold text-cyan-800 hover:bg-cyan-100 transition-all cursor-pointer"
                                  >
                                    <Crop className="w-3 h-3 text-cyan-600" />
                                    <span>Reajustar</span>
                                  </button>
                                  <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-300 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-100 transition-all">
                                    <Camera className="w-3 h-3 text-cyan-600" />
                                    <span>Cambiar</span>
                                    <input type="file" accept="image/*" onChange={handleSeleccionarArchivoFoto} className="hidden" />
                                  </label>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <label className="cursor-pointer flex flex-col items-center justify-center py-2.5 px-2 group">
                              <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center mb-1 group-hover:scale-105 group-hover:bg-cyan-200 transition-all">
                                <Upload className="w-4 h-4" />
                              </div>
                              <span className="text-[11px] font-bold text-cyan-800">Toca para tomar o seleccionar foto</span>
                              <span className="text-[9px] text-slate-400">Se registrará en la carpeta Drive institucional</span>
                              <input type="file" accept="image/*" onChange={handleSeleccionarArchivoFoto} className="hidden" />
                            </label>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Cédula y Nombres (BLOQUEADOS Y PROTEGIDOS - NO MODIFICABLES) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center justify-between">
                          <label className="font-extrabold text-slate-700 text-[11px] flex items-center gap-1">
                            <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>Cédula de Identidad</span>
                          </label>
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.2 rounded">
                            Bloqueado
                          </span>
                        </div>
                        <div className="h-10 px-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center text-slate-700 font-bold text-xs select-none cursor-not-allowed">
                          {primerIngresoData.cedula || 'No registrada'}
                        </div>
                      </div>

                      <div className="space-y-1 text-left">
                        <div className="flex items-center justify-between">
                          <label className="font-extrabold text-slate-700 text-[11px] flex items-center gap-1">
                            <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>Nombres y Apellidos</span>
                          </label>
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.2 rounded">
                            No modificable
                          </span>
                        </div>
                        <div className="h-10 px-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center text-slate-700 font-bold text-xs select-none truncate cursor-not-allowed" title={primerIngresoData.nombreCompleto}>
                          {primerIngresoData.nombreCompleto || 'Usuario'}
                        </div>
                      </div>
                    </div>

                    {/* Teléfono Móvil y Correo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1 text-left">
                        <label className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                          <span>Teléfono Móvil *</span>
                        </label>
                        <div className="flex gap-1 items-center">
                          <select
                            value={primerIngresoData.codigoPais}
                            onChange={(e) => {
                              const cod = e.target.value;
                              const formateado = formatearTelefonoNumero(primerIngresoData.telefonoNumero, cod);
                              setPrimerIngresoData({
                                ...primerIngresoData,
                                codigoPais: cod,
                                telefonoNumero: formateado,
                                telefono: `${cod} ${formateado}`.trim()
                              });
                            }}
                            className="w-[85px] shrink-0 h-10 px-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 text-xs cursor-pointer"
                          >
                            {PAISES_TELEFONO.map((p) => (
                              <option key={p.codigo} value={p.codigo}>{p.bandera} {p.codigo}</option>
                            ))}
                          </select>
                          <input
                            type="tel"
                            required
                            value={primerIngresoData.telefonoNumero}
                            onChange={(e) => {
                              const formateado = formatearTelefonoNumero(e.target.value, primerIngresoData.codigoPais);
                              setPrimerIngresoData({
                                ...primerIngresoData,
                                telefonoNumero: formateado,
                                telefono: `${primerIngresoData.codigoPais} ${formateado}`.trim()
                              });
                            }}
                            placeholder="412-1234567"
                            className="flex-1 h-10 px-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                          />
                        </div>

                        {/* Operadoras rápidas de Venezuela */}
                        {primerIngresoData.codigoPais === '+58' && (
                          <div className="flex items-center gap-1 flex-wrap pt-0.5">
                            {OPERADORAS_VENEZUELA.map((op) => (
                              <button
                                key={op.codigo}
                                type="button"
                                onClick={() => {
                                  const resto = primerIngresoData.telefonoNumero.replace(/^\d{3}-?/, '');
                                  const nuevoNum = `${op.codigo}-${resto}`;
                                  setPrimerIngresoData({
                                    ...primerIngresoData,
                                    telefonoNumero: nuevoNum,
                                    telefono: `${primerIngresoData.codigoPais} ${nuevoNum}`.trim()
                                  });
                                }}
                                className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold transition-all border cursor-pointer ${primerIngresoData.telefonoNumero.startsWith(op.codigo)
                                  ? 'bg-cyan-600 text-white border-cyan-600'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-cyan-300'
                                  }`}
                              >
                                {op.codigo}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Correo */}
                      <div className="space-y-1 text-left">
                        <label className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                          <Mail className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                          <span>Correo Electrónico *</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={primerIngresoData.email}
                          onChange={(e) => setPrimerIngresoData({ ...primerIngresoData, email: e.target.value.toLowerCase().replace(/\s/g, '') })}
                          placeholder="tu.correo@ejemplo.com"
                          className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs"
                        />
                        {/* Chips de dominios rápidos */}
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          {DOMINIOS_CORREO_COMUNES.slice(0, 4).map((dom) => (
                            <button
                              key={dom}
                              type="button"
                              onClick={() => {
                                const base = primerIngresoData.email.split('@')[0] || '';
                                setPrimerIngresoData({ ...primerIngresoData, email: `${base}${dom}` });
                              }}
                              className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold bg-white text-slate-600 border border-slate-200 hover:border-cyan-300 cursor-pointer"
                            >
                              {dom}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Nombre de Usuario (Alias único) */}
                    <div className="space-y-2 text-left p-3 bg-gradient-to-r from-cyan-50/80 via-sky-50/70 to-indigo-50/60 border border-cyan-200 rounded-2xl shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="font-extrabold text-cyan-950 flex items-center gap-1.5 text-[11px]">
                          <AtSign className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                          <span>Nombre de Usuario (para próximos accesos) *</span>
                        </label>
                        <span className="text-[9px] font-extrabold uppercase bg-cyan-200/90 text-cyan-900 px-2 py-0.5 rounded-full border border-cyan-300">
                          Acceso alterno
                        </span>
                      </div>

                      {/* Recuadro Unificado e Integrado para el Input y su Arroba */}
                      <div className="flex items-stretch h-10 w-full bg-white border-2 border-cyan-300 rounded-xl overflow-hidden shadow-2xs focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-400/25 transition-all">
                        <div className="px-3 bg-cyan-100/90 border-r border-cyan-200 flex items-center justify-center select-none shrink-0">
                          <span className="text-cyan-800 font-black text-sm">@</span>
                        </div>
                        <input
                          type="text"
                          required
                          value={primerIngresoData.username}
                          onChange={(e) => setPrimerIngresoData({
                            ...primerIngresoData,
                            username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 20)
                          })}
                          placeholder="maria.gonzalez"
                          className="flex-1 h-full px-3 text-xs sm:text-sm font-bold text-slate-800 outline-none bg-transparent placeholder:text-slate-400 placeholder:font-normal"
                        />
                      </div>

                      <p className="text-[9.5px] text-cyan-900 font-medium">
                        Podrás usar este nombre de usuario para iniciar sesión en lugar de tu número de cédula.
                      </p>

                      {sugerenciasUsuario.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="text-[9px] font-bold text-slate-500">Sugerencias:</span>
                          {sugerenciasUsuario.map((sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => setPrimerIngresoData({ ...primerIngresoData, username: sug })}
                              className="text-[9px] px-2.5 py-0.5 rounded-lg font-bold bg-white text-cyan-700 border border-cyan-200 hover:border-cyan-400 hover:bg-cyan-50 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                            >
                              @{sug}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Contraseña y Confirmar con Termómetro */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-700 text-[11px]">
                            {esActualizacionMensual ? 'Contraseña Institucional *' : 'Nueva Contraseña *'}
                          </label>
                          {esActualizacionMensual && (
                            <span className="text-[8.5px] text-cyan-700 font-bold">Consérvela o cámbiela</span>
                          )}
                        </div>
                        <div className="relative flex items-center">
                          <input
                            type={mostrarPassword ? 'text' : 'password'}
                            required
                            value={primerIngresoData.password}
                            onChange={(e) => setPrimerIngresoData({ ...primerIngresoData, password: e.target.value })}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full h-10 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setMostrarPassword(!mostrarPassword)}
                            className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {mostrarPassword ? <EyeOff className="w-3.5 h-3.5 text-cyan-600" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="font-bold text-slate-700 text-[11px]">Confirmar Contraseña *</label>
                        <input
                          type="password"
                          required
                          value={primerIngresoData.confirmPassword}
                          onChange={(e) => setPrimerIngresoData({ ...primerIngresoData, confirmPassword: e.target.value })}
                          placeholder="Repita la clave"
                          className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 text-xs"
                        />
                      </div>
                    </div>

                    <PasswordStrengthThermometer
                      password={primerIngresoData.password}
                      confirmPassword={primerIngresoData.confirmPassword}
                    />

                    <div className="pt-2 space-y-2">
                      <button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-cyan-600 via-sky-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <span>Continuar a Preguntas de Seguridad (2/2)</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => resetForm()}
                        className="w-full py-1 text-center text-slate-400 hover:text-slate-700 font-semibold text-xs cursor-pointer transition-colors"
                      >
                        Cancelar y volver
                      </button>
                    </div>
                  </form>
                )}

                {/* SUB-PASO 2: TRES PREGUNTAS DE SEGURIDAD */}
                {subPasoPrimerIngreso === 2 && (
                  <form onSubmit={handleGuardarPrimerIngreso} className="space-y-3 text-xs">
                    <div className="p-2.5 bg-cyan-50 border border-cyan-200 rounded-xl flex items-center gap-2 text-left">
                      <HelpCircle className="w-4 h-4 text-cyan-600 shrink-0" />
                      <p className="text-[11px] text-cyan-900 leading-snug">
                        {esActualizacionMensual
                          ? 'Confirme o actualice sus tres preguntas de seguridad para el restablecimiento de su cuenta.'
                          : 'Elija tres preguntas y escriba sus respuestas secretas. Servirán para restablecer su cuenta en caso de olvido.'}
                      </p>
                    </div>

                    {/* Pregunta 1 */}
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-left">
                      <label className="block text-[11px] font-bold text-slate-700">1. Primera Pregunta *</label>
                      <select
                        value={primerIngresoData.pregunta1}
                        onChange={(e) => setPrimerIngresoData({ ...primerIngresoData, pregunta1: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium text-xs cursor-pointer"
                      >
                        {PREGUNTAS_SEGURIDAD_OPCIONES.map((p, idx) => (
                          <option key={idx} value={p}>{p}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        required
                        value={primerIngresoData.respuesta1}
                        onChange={(e) => setPrimerIngresoData({ ...primerIngresoData, respuesta1: e.target.value })}
                        placeholder="Tu respuesta secreta 1"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs"
                      />
                    </div>

                    {/* Pregunta 2 */}
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-left">
                      <label className="block text-[11px] font-bold text-slate-700">2. Segunda Pregunta *</label>
                      <select
                        value={primerIngresoData.pregunta2}
                        onChange={(e) => setPrimerIngresoData({ ...primerIngresoData, pregunta2: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium text-xs cursor-pointer"
                      >
                        {PREGUNTAS_SEGURIDAD_OPCIONES.map((p, idx) => (
                          <option key={idx} value={p}>{p}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        required
                        value={primerIngresoData.respuesta2}
                        onChange={(e) => setPrimerIngresoData({ ...primerIngresoData, respuesta2: e.target.value })}
                        placeholder="Tu respuesta secreta 2"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs"
                      />
                    </div>

                    {/* Pregunta 3 */}
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-left">
                      <label className="block text-[11px] font-bold text-slate-700">3. Tercera Pregunta *</label>
                      <select
                        value={primerIngresoData.pregunta3}
                        onChange={(e) => setPrimerIngresoData({ ...primerIngresoData, pregunta3: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium text-xs cursor-pointer"
                      >
                        {PREGUNTAS_SEGURIDAD_OPCIONES.map((p, idx) => (
                          <option key={idx} value={p}>{p}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        required
                        value={primerIngresoData.respuesta3}
                        onChange={(e) => setPrimerIngresoData({ ...primerIngresoData, respuesta3: e.target.value })}
                        placeholder="Tu respuesta secreta 3"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs"
                      />
                    </div>

                    <div className="pt-2 space-y-2">
                      <button
                        type="submit"
                        disabled={cargando}
                        className="w-full h-11 bg-gradient-to-r from-emerald-600 via-cyan-600 to-indigo-700 hover:from-emerald-700 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                      >
                        {cargando ? 'Guardando información...' : (
                          <>
                            <ShieldCheck className="w-4 h-4 text-emerald-300" />
                            <span>{esActualizacionMensual ? 'Confirmar Datos y Acceder al Sistema' : 'Guardar Credenciales e Ingresar'}</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubPasoPrimerIngreso(1)}
                        className="w-full py-1 text-center text-slate-500 hover:text-slate-800 font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Volver a Datos y Contraseña</span>
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}

            {/* ========================================================
                  PASO: RECUPERACIÓN DE CONTRASEÑA Y RESTAURACIÓN TOTAL
              ======================================================== */}
            {paso === 'recuperar' && (
              <motion.div
                key="paso-recuperar"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="text-center pb-1">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto mb-2 text-sky-600 shadow-xs">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-800">
                    Recuperación de Contraseña
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {!recuperarUsuario
                      ? 'Ingrese su Cédula para verificar sus preguntas'
                      : `Restablezca su clave para ${recuperarUsuario.nombre_completo || 'Usuario'}`}
                  </p>
                </div>

                {restauracionConfirmada ? (
                  <div className="space-y-4 text-center py-2">
                    <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-amber-600 mx-auto" />
                      <p className="font-bold text-sm text-amber-950">Solicitud de Restauración Total Enviada</p>
                      <p className="text-amber-800 text-[11px]">
                        Se ha registrado una solicitud de restablecimiento para el Administrador de SIGAE.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="w-full h-11 bg-[#2189cf] hover:bg-[#1c78b8] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                    >
                      Volver al Inicio
                    </button>
                  </div>
                ) : !recuperarUsuario ? (
                  <form onSubmit={handleConsultarRecuperacion} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Cédula o Usuario
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none z-10">
                          <User3DIcon size={18} />
                        </div>
                        <input
                          type="text"
                          autoFocus
                          required
                          value={recuperarIdentificador}
                          onChange={(e) => setRecuperarIdentificador(e.target.value)}
                          placeholder="Ej: 12345678 o usuario"
                          className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d93d0] focus:bg-white text-slate-800 font-semibold shadow-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={cargando}
                      className="w-full h-11 bg-gradient-to-r from-[#2189cf] to-[#2d93d0] hover:from-[#1c78b8] hover:to-[#2189cf] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {cargando ? 'Consultando...' : (
                        <>
                          <span>Continuar</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {/* Restauración Total */}
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setMostrarModalRestauracionTotal(!mostrarModalRestauracionTotal)}
                        className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100/90 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>¿Olvidó todo? Restauración Total</span>
                      </button>

                      {mostrarModalRestauracionTotal && (
                        <div className="mt-2.5 p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs text-left">
                          <p className="font-extrabold text-amber-950 text-xs">¿Solicitar Restauración Total?</p>
                          <p className="text-[11px] text-amber-900 leading-tight">
                            Se enviará una alerta al administrador del sistema escolar para revalidar su cuenta.
                          </p>
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleSolicitarRestauracionTotal}
                              disabled={cargando}
                              className="flex-1 py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                            >
                              {cargando ? 'Enviando...' : 'Confirmar Solicitud'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setMostrarModalRestauracionTotal(false)}
                              className="py-1.5 px-3 bg-white border border-amber-300 text-amber-900 font-semibold rounded-lg text-xs cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </form>
                ) : recuperarExito ? (
                  <div className="space-y-4 text-center py-2">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs space-y-1">
                      <p className="font-bold text-sm text-emerald-900">¡Contraseña Restablecida con Éxito!</p>
                      <p className="text-emerald-700 text-xs">Ahora puede iniciar sesión con su nueva clave.</p>
                    </div>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="w-full h-11 bg-[#2189cf] hover:bg-[#1c78b8] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                    >
                      Ir a Iniciar Sesión
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRestablecerClave} className="space-y-3.5 text-xs">
                    {/* Pregunta 1 */}
                    <div className="space-y-1">
                      <div className="p-2.5 bg-sky-50 border border-sky-100 rounded-xl">
                        <span className="text-[10px] font-extrabold uppercase text-sky-800 block">1ra Pregunta de Seguridad:</span>
                        <p className="text-xs font-bold text-slate-800">{recuperarPregunta1}</p>
                      </div>
                      <input
                        type="text"
                        required
                        value={recuperarRespuesta1}
                        onChange={(e) => setRecuperarRespuesta1(e.target.value)}
                        placeholder="Tu 1ra respuesta"
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium"
                      />
                    </div>

                    {/* Pregunta 2 */}
                    <div className="space-y-1">
                      <div className="p-2.5 bg-sky-50 border border-sky-100 rounded-xl">
                        <span className="text-[10px] font-extrabold uppercase text-sky-800 block">2da Pregunta de Seguridad:</span>
                        <p className="text-xs font-bold text-slate-800">{recuperarPregunta2}</p>
                      </div>
                      <input
                        type="text"
                        required
                        value={recuperarRespuesta2}
                        onChange={(e) => setRecuperarRespuesta2(e.target.value)}
                        placeholder="Tu 2da respuesta"
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium"
                      />
                    </div>

                    {/* Nuevas Contraseñas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="password"
                        required
                        value={recuperarNuevaClave}
                        onChange={(e) => setRecuperarNuevaClave(e.target.value)}
                        placeholder="Nueva clave"
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium"
                      />
                      <input
                        type="password"
                        required
                        value={recuperarConfirmClave}
                        onChange={(e) => setRecuperarConfirmClave(e.target.value)}
                        placeholder="Repita la nueva clave"
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={cargando}
                      className="w-full h-11 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 cursor-pointer"
                    >
                      {cargando ? 'Restableciendo...' : 'Restablecer e Iniciar Sesión'}
                    </button>

                    {/* Opción si no recuerda las preguntas de seguridad: Olvidé todos mis datos */}
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setMostrarModalRestauracionTotal(!mostrarModalRestauracionTotal)}
                        className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100/90 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>¿No recuerda las respuestas? Olvidé todos mis datos</span>
                      </button>

                      {mostrarModalRestauracionTotal && (
                        <div className="mt-2.5 p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs text-left">
                          <p className="font-extrabold text-amber-950 text-xs">¿Solicitar Restauración Total?</p>
                          <p className="text-[11px] text-amber-900 leading-tight">
                            Si no recuerda las respuestas a sus preguntas secretas, se enviará una solicitud al Administrador del plantel para restablecer su cuenta y credenciales.
                          </p>
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleSolicitarRestauracionTotal}
                              disabled={cargando}
                              className="flex-1 py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                            >
                              {cargando ? 'Enviando...' : 'Confirmar Solicitud'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setMostrarModalRestauracionTotal(false)}
                              className="py-1.5 px-3 bg-white border border-amber-300 text-amber-900 font-semibold rounded-lg text-xs cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </form>
                )}

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver al inicio</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ========================================================
                  PASO: REGISTRO DE VISITANTES / INVITADOS
              ======================================================== */}
            {paso === 'invitado' && (
              <motion.div
                key="paso-invitado"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2.5 pb-1 border-b border-slate-100">
                  <Users className="w-5 h-5 text-indigo-500" />
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800">Visitantes e Invitados</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Ingreso temporal institucional</p>
                  </div>
                </div>

                <form onSubmit={handleRegistrarInvitado} className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={invNombres}
                      onChange={e => setInvNombres(e.target.value)}
                      placeholder="Nombres"
                      className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                    />
                    <input
                      type="text"
                      required
                      value={invApellidos}
                      onChange={e => setInvApellidos(e.target.value)}
                      placeholder="Apellidos"
                      className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="email"
                      required
                      value={invCorreo}
                      onChange={e => setInvCorreo(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                    />
                    <input
                      type="tel"
                      required
                      value={invTelefono}
                      onChange={e => setInvTelefono(e.target.value)}
                      placeholder="04121234567"
                      className="w-full h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                    />
                  </div>

                  <textarea
                    required
                    rows={2}
                    value={invMotivo}
                    onChange={e => setInvMotivo(e.target.value)}
                    placeholder="Motivo de la visita..."
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 resize-none font-medium"
                  />

                  <button
                    type="submit"
                    disabled={cargando}
                    className="w-full h-11 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md mt-1 cursor-pointer"
                  >
                    {cargando ? 'Registrando...' : 'Registrar e Ingresar'}
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="w-full py-1 text-xs text-slate-500 hover:text-slate-700 font-medium text-center cursor-pointer"
                  >
                    Volver al login
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
    </div>
  );

  return (
    <div
      id="login-page-root"
      onMouseMove={handleMouseMoveParallax}
      className="min-h-screen w-full flex items-center justify-center bg-[#E5F5F9] text-slate-800 p-0 sm:p-2 md:p-4 lg:p-6 relative select-none overflow-x-hidden"
    >
      {/* =========================================================================
          CONTENEDOR MAESTRO 16:9 ESCRITORIO (RÉPLICA EXACTA DE LA IMAGEN 3D)
      ========================================================================= */}
      <div className="relative w-full max-w-[1536px] aspect-[1024/571] max-h-[96vh] rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,160,210,0.25)] border border-white/80 bg-white select-none hidden lg:block">
        {/* Fondo 2K Ultra Nítido con libro 3D, cinta 3D y marco bezel */}
        <img
          src="/img/login_bg_mppe_sigae_ultra.png"
          alt="SIGAE MPPE 3D"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Encabezado Oficial Top-Left Vectorial / HD */}
        <div className="absolute top-[3.2%] left-[2.8%] flex items-center gap-3 xl:gap-4.5 z-20">
          <img
            src="/img/logoMPPE_hd.png"
            onError={(e) => { e.currentTarget.src = '/img/image_0.png'; }}
            alt="Ministerio del Poder Popular para la Educación"
            className="h-11 xl:h-13 w-auto object-contain select-none drop-shadow-xs"
          />
          <div className="h-9 xl:h-11 w-px bg-[#CBD5E1]" />
          <div className="flex items-center gap-2.5 xl:gap-3">
            <img
              src="/img/sigae.png"
              alt="Escudo Oficial SIGAE"
              className="w-11 h-11 xl:w-13 xl:h-13 object-contain drop-shadow-[0_4px_12px_rgba(0,180,216,0.35)] select-none"
            />
            <div className="flex flex-col max-w-[240px] xl:max-w-[280px]">
              <span className="text-2xl xl:text-[28px] font-black text-[#0C4A6E] tracking-tight leading-none">
                SIGAE
              </span>
              <span className="text-[8.5px] xl:text-[9.5px] font-bold text-slate-600 tracking-wider leading-tight uppercase mt-1">
                Sistema Integral de Gestión
              </span>
              <span className="text-[8.5px] xl:text-[9.5px] font-bold text-slate-600 tracking-wider leading-tight uppercase">
                y Administración Escolar
              </span>
            </div>
          </div>
        </div>

        {/* Acceso directo al Sitio Web Institucional */}
        <div className="absolute top-[3.2%] right-[3.5%] z-20 hidden lg:flex items-center">
          <Link
            to="/portal"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/85 hover:bg-white text-cyan-900 border border-cyan-200 shadow-xs hover:shadow-md text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs group"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-600 transition-transform duration-300 group-hover:rotate-45" />
            <span>Sitio Web Institucional</span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-500 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Formulario superpuesto con precisión en el marco bezel 3D */}
        <div 
          className={`absolute flex flex-col ${paso === 'primer_ingreso' ? 'justify-start overflow-hidden rounded-2xl p-3.5 xl:p-4 bg-white/95 backdrop-blur-md shadow-2xl border border-cyan-200/80 ring-1 ring-cyan-400/20' : 'justify-center px-3.5 xl:px-6'} z-20 transition-all duration-300`}
          style={{
            left: paso === 'primer_ingreso' ? '49%' : '52.2%',
            top: paso === 'primer_ingreso' ? '17%' : '33.2%',
            width: paso === 'primer_ingreso' ? '36%' : '30.8%',
            height: paso === 'primer_ingreso' ? '75%' : '44.8%'
          }}
        >
          {formContent}
        </div>

        {/* Pie de Página */}
        <footer className="absolute bottom-3 left-6 right-6 z-20 flex items-center justify-between select-none pointer-events-none">
          <div className="flex flex-col leading-tight">
            <span className="text-xs xl:text-sm font-black text-[#0C4A6E] tracking-tight drop-shadow-2xs">
              © {new Date().getFullYear()} SIGAE · Versión 1.3
            </span>
            <span className="text-[11px] xl:text-xs text-slate-700 font-bold mt-0.5 drop-shadow-2xs">
              Escuelas de la Dirección Ejecutiva de Producción Oriente
            </span>
          </div>

          <div className="flex items-center">
            <img
              src="/img/200svg.svg?v=5"
              alt="Bicentenario 200"
              className="h-10 xl:h-12 w-auto object-contain drop-shadow-sm hover-logo-bicentenario"
            />
          </div>
        </footer>
      </div>

      {/* =========================================================================
          VERSIÓN MÓVIL Y TABLET RESPONSIVE
      ========================================================================= */}
      <div className="flex lg:hidden w-full min-h-screen flex-col justify-between bg-[#E5F5F9] text-slate-800 p-4 sm:p-6 relative select-none overflow-hidden">
        {/* Fondo adaptativo nativo para móviles y tabletas */}
        <picture className="absolute inset-0 w-full h-full pointer-events-none select-none">
          <source media="(min-width: 640px)" srcSet="/img/bg-tablet.jpg" />
          <img
            src="/img/bg-mobile.jpg"
            alt="Fondo Educativo Móvil"
            className="w-full h-full object-cover opacity-90"
          />
        </picture>

        {/* Cinta 3D Oficial Venezuela anclada en la esquina superior derecha con suave animación flotante */}
        <img
          src="/img/cinta_3d_venezuela.png"
          alt="Cinta Venezuela"
          className="absolute top-0 right-0 w-[180px] sm:w-[220px] h-auto object-contain pointer-events-none z-10 drop-shadow-[0_4px_16px_rgba(0,0,0,0.18)] animate-ribbon-wave"
        />

        {/* Encabezado Institucional Móvil Amplio y Nítido */}
        <header className="w-full flex items-center justify-between pb-2 z-20 relative">
          <div className="flex items-center gap-2 sm:gap-2.5 max-w-[82%]">
            <img
              src="/img/logoMPPE_hd.png"
              onError={(e) => { e.currentTarget.src = '/img/image_0.png'; }}
              alt="MPPE"
              className="h-8.5 sm:h-9.5 w-auto object-contain drop-shadow-xs"
            />
            <div className="h-6 sm:h-7 w-px bg-slate-300 shrink-0" />
            <img
              src="/img/sigae.png"
              alt="SIGAE"
              className="w-8.5 h-8.5 sm:w-9.5 sm:h-9.5 object-contain drop-shadow-xs shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-base sm:text-lg font-black text-[#0C4A6E] leading-none">
                SIGAE
              </span>
              <span className="text-[7px] sm:text-[8px] font-bold text-slate-600 uppercase tracking-tight mt-0.5 leading-tight">
                Sistema Integral de Gestión
              </span>
              <span className="text-[7px] sm:text-[8px] font-bold text-slate-600 uppercase tracking-tight leading-tight">
                y Administración Escolar
              </span>
            </div>
          </div>

          <Link
            to="/portal"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/85 border border-cyan-200 text-cyan-900 text-[10px] font-bold shadow-xs hover:bg-white transition-all shrink-0 ml-auto"
          >
            <Globe className="w-3 h-3 text-cyan-600" />
            <span>Sitio Web</span>
          </Link>
        </header>

        {/* Contenedor de la tarjeta de acceso */}
        <div className="w-full max-w-md mx-auto my-auto relative z-10">
          <div className="w-full sigae-mppe-glass-card p-6 sm:p-8 relative z-10">
            {formContent}
          </div>
        </div>

        {/* Pie de Página Móvil */}
        <footer className="w-full mt-auto mb-1 pt-2 z-20 flex items-center justify-between gap-3 select-none">
          <div className="flex flex-col min-w-0 leading-tight">
            <span className="text-[11px] sm:text-xs font-black text-[#0C4A6E] truncate drop-shadow-2xs">
              © {new Date().getFullYear()} SIGAE · Versión 1.3
            </span>
            <span className="text-[8.5px] sm:text-[9.5px] text-slate-700 font-bold mt-0.5 truncate drop-shadow-2xs">
              Escuelas de la Dirección Ejecutiva de Producción Oriente
            </span>
          </div>
          <img
            src="/img/200svg.svg?v=5"
            alt="Bicentenario 200"
            className="h-8 sm:h-9 w-auto object-contain shrink-0 drop-shadow-sm hover-logo-bicentenario"
          />
        </footer>
      </div>


      {/* MODAL LIMPIO: VERIFICAR CONSTANCIA QR */}
      {modalQR && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Verificar Constancia QR</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Validación oficial de autenticidad electrónica</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalQR(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Ingresa el código alfanumérico impreso en la constancia de estudio o de inscripción para validar su registro en el sistema ministerial.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (codigoQR.trim()) {
                  window.location.href = `/validar-constancia/${encodeURIComponent(codigoQR.trim())}`;
                }
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Código de Verificación *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={codigoQR}
                  onChange={(e) => setCodigoQR(e.target.value.toUpperCase())}
                  placeholder="Ej: CONST-2025-XXXX"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-base sm:text-sm font-mono font-bold text-slate-800 uppercase focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setModalQR(false)}
                  className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-xl bg-[#0f172a] hover:bg-[#1e3a8a] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  Validar Constancia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECUPERACIÓN / ACTIVACIÓN POR CÉDULA Y PLANTEL */}
      {mostrarModalRecuperar && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recuperación de Clave</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Validación por Cédula y Plantel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMostrarModalRecuperar(false);
                  setRecuperarUsuario(null);
                  setError('');
                }}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Plantel activo de verificación */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center gap-2">
              <img
                src={escuelaActiva.escudo}
                alt={escuelaActiva.nombre}
                className="w-7 h-7 object-contain shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-800 leading-tight">{escuelaActiva.nombre}</p>
                <p className="text-[10px] text-slate-500 leading-tight">DEA {escuelaActiva.dea} &bull; Sede Activa</p>
              </div>
            </div>

            {restauracionConfirmada ? (
              <div className="text-center py-3 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">Solicitud Registrada con Éxito</h4>
                <p className="text-xs text-slate-600">
                  La dirección del plantel ha recibido tu solicitud de restablecimiento para la cédula ingresada.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalRecuperar(false);
                    setRestauracionConfirmada(false);
                    resetForm();
                  }}
                  className="w-full h-11 bg-[#0f172a] text-white text-xs font-bold rounded-xl mt-2 cursor-pointer"
                >
                  Aceptar y Volver al Login
                </button>
              </div>
            ) : !recuperarUsuario ? (
              <form onSubmit={handleConsultarRecuperacion} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Cédula del Usuario *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    autoFocus
                    value={recuperarIdentificador}
                    onChange={(e) => setRecuperarIdentificador(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ej: 12345678"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-base sm:text-sm font-semibold text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full h-11 bg-[#0f172a] hover:bg-[#1e3a8a] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {cargando ? 'Consultando en el plantel...' : 'Consultar Preguntas de Seguridad'}
                </button>

                {/* Opción de Restauración Total por Administración */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setMostrarModalRestauracionTotal(!mostrarModalRestauracionTotal)}
                    className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100/90 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                    <span>¿No recuerdas tus preguntas? Solicitar desbloqueo a Dirección</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Formulario de Preguntas Secretas */
              <form onSubmit={handleRestablecerClave} className="space-y-3">
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium">
                  Usuario: <strong>{recuperarUsuario.nombre_completo || 'Usuario'}</strong> (C.I. {recuperarUsuario.cedula})
                </div>

                {recuperarPregunta1 && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">{recuperarPregunta1}</label>
                    <input
                      type="text"
                      required
                      value={recuperarRespuesta1}
                      onChange={(e) => setRecuperarRespuesta1(e.target.value)}
                      placeholder="Tu respuesta secreta 1"
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                )}

                {recuperarPregunta2 && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">{recuperarPregunta2}</label>
                    <input
                      type="text"
                      required
                      value={recuperarRespuesta2}
                      onChange={(e) => setRecuperarRespuesta2(e.target.value)}
                      placeholder="Tu respuesta secreta 2"
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Nueva Contraseña</label>
                    <input
                      type="password"
                      required
                      value={recuperarNuevaClave}
                      onChange={(e) => setRecuperarNuevaClave(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">Confirmar Contraseña</label>
                    <input
                      type="password"
                      required
                      value={recuperarConfirmClave}
                      onChange={(e) => setRecuperarConfirmClave(e.target.value)}
                      placeholder="Repita la clave"
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer mt-2"
                >
                  {cargando ? 'Validando y guardando...' : 'Guardar Nueva Clave e Ingresar'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Interactivo de Recorte Circular y Encuadre */}
      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={imagenOriginalParaRecortar}
        onClose={() => setCropperOpen(false)}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};
