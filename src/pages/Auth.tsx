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
  ChevronRight
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

export const Auth = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [school, setSchool] = useState<'sb' | 'lb'>(() => {
    return (localStorage.getItem('sigae_escuela_codigo') as 'sb' | 'lb') || 'sb';
  });

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
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Perfil del Usuario Encontrado
  const [usuarioEncontrado, setUsuarioEncontrado] = useState<any>(null);

  // Estados para Registro / Primer Ingreso
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

  // Invitados
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
    } catch (e) {}

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

    const idLimpio = identificador.trim();
    const soloNumeros = idLimpio.replace(/\D/g, '');

    try {
      // 1. Consultar en tabla 'usuarios'
      let query = supabase.from('usuarios').select('*');
      if (soloNumeros.length >= 5) {
        query = query.or(`cedula.eq.${soloNumeros},cedula.eq.${idLimpio}`);
      } else {
        query = query.eq('cedula', idLimpio);
      }

      const { data, error: dbErr } = await query.maybeSingle();

      if (dbErr) {
        console.error(dbErr);
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
          } catch (e) {}
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

      finalizarLogin(data);
    } catch (err) {
      console.error(err);
      setError('Error al autenticar.');
    }
    setCargando(false);
  };

  // ==========================================
  // PASO 3: REGISTRO / PRIMER INGRESO (2 SUB-PASOS)
  // ==========================================
  const handleAvanzarPaso2PrimerIngreso = (e: React.FormEvent) => {
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
    setError('');
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

      const perfilAccesoActual = usuarioEncontrado?.perfil_acceso || {};
      const perfilAccesoActualizado = {
        ...perfilAccesoActual,
        username: primerIngresoData.username,
        avatar_id: primerIngresoData.modoFoto === 'avatar' ? primerIngresoData.avatarSeleccionado : null,
        foto_perfil: primerIngresoData.modoFoto === 'subir' ? primerIngresoData.fotoBase64 : null
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
          fecha_ult_clave: new Date().toISOString()
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
      } catch (e) {}

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
      } catch (e) {}

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
        finalizarLogin(u);
      } catch (e) {
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

  return (
    <div
      id="login-page-root"
      className="min-h-[100dvh] w-full max-w-full flex flex-col justify-between items-center relative bg-[#f4f7fb] overflow-x-hidden p-0 m-0"
    >
      {/* Fondo Tecnológico Claro con Red de Nodos y Líneas Interconectadas */}
      <TechNetworkBackground theme="light" />

      {/* Contenedor Central de Cabecera y Formulario (con márgenes de lectura) */}
      <div className="w-full max-w-full flex-1 flex flex-col items-center justify-center pt-2 sm:pt-4 pb-1 px-3 sm:px-4 relative z-10 min-w-0 my-auto">
        {/* Cabecera Oficial SIGAE con Escudo y Resplandor Dorado/Azul */}
        <div className="w-full max-w-3xl text-center mb-1.5 sm:mb-2 relative z-10">
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: [0, -4, 0] }}
            transition={{
              scale: { duration: 0.4 },
              opacity: { duration: 0.4 },
              y: { repeat: Infinity, duration: 4.5, ease: 'easeInOut' }
            }}
            className="relative inline-block group"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-400/35 via-blue-500/25 to-amber-400/30 blur-2xl opacity-90 group-hover:opacity-100 transition-opacity" />
            <img
              src="/img/sigae-logo.png"
              alt="SIGAE"
              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain mx-auto filter drop-shadow-[0_8px_20px_rgba(2,132,199,0.25)] relative z-10 transition-transform duration-300 group-hover:scale-105"
            />
          </motion.div>
          <h1 className="-mt-1 text-sm sm:text-base md:text-lg lg:text-xl font-black text-slate-800 tracking-tight drop-shadow-xs leading-tight relative z-20 px-2">
            Sistema Integral de Gestión y Administración Escolar
          </h1>
        </div>

        {/* Tarjeta Flotante Principal Glassmorphism */}
        <div className={`w-full ${paso === 'primer_ingreso' ? 'max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl' : 'max-w-[420px]'} relative z-10 transition-all duration-300`}>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-white/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_-15px_rgba(2,132,199,0.22)] p-4 sm:p-6 border border-white/80 relative overflow-hidden"
          >
            {/* Alerta de Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Selector de Plantel Educativo Activo */}
            <div className="mb-3.5">
              <div className="flex bg-slate-100/90 p-1 rounded-xl gap-1 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => handleSchoolChange('sb')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    school === 'sb'
                      ? 'bg-white text-sky-700 shadow-xs shadow-slate-300/50'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <School className="w-3.5 h-3.5" />
                  <span>UE Santa Bárbara</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSchoolChange('lb')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    school === 'lb'
                      ? 'bg-white text-sky-700 shadow-xs shadow-slate-300/50'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <School className="w-3.5 h-3.5" />
                  <span>UE Libertador Bolívar</span>
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {/* ========================================================
                  PASO 1: IDENTIFICACIÓN (CÉDULA O USUARIO)
              ======================================================== */}
              {paso === 'identificar' && (
                <motion.div
                  key="paso-identificar"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                    <Security3DIcon size={44} className="drop-shadow-md shrink-0" />
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight leading-snug">
                        Iniciar Sesión
                      </h2>
                      <p className="text-xs text-slate-500 font-medium leading-tight mt-0.5">
                        Ingresa tu cédula o nombre de usuario para continuar
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleVerificarUsuario} className="space-y-3.5">
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
                          value={identificador}
                          onChange={(e) => setIdentificador(e.target.value)}
                          placeholder="Ej: 12345678 o usuario"
                          className="w-full h-11 pl-10 pr-4 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d93d0] focus:bg-white text-slate-800 font-semibold placeholder-slate-400 transition-all shadow-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={cargando}
                      className="w-full h-11 bg-gradient-to-r from-[#2189cf] to-[#2d93d0] hover:from-[#1c78b8] hover:to-[#2189cf] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-sky-600/30 hover:shadow-xl hover:shadow-sky-600/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 cursor-pointer mt-1"
                    >
                      {cargando ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Verificando usuario...</span>
                        </span>
                      ) : (
                        <>
                          <span>Continuar</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Acceso Biométrico rápido si está en este dispositivo */}
                  {localStorage.getItem('sigae_tiene_huella') && (
                    <button
                      type="button"
                      onClick={handleLoginBiometrico}
                      className="w-full h-10 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Fingerprint className="w-4 h-4 text-emerald-600" />
                      <span>Ingresar con Huella / PIN</span>
                    </button>
                  )}

                  {/* Fila de Acciones: Registro de Usuario, Olvido de Clave e Invitados */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setPaso('recuperar');
                          setRecuperarIdentificador(identificador);
                          setError('');
                        }}
                        className="text-[#2189cf] hover:text-[#1c78b8] font-bold transition-colors hover:underline focus:outline-none cursor-pointer"
                      >
                        ¿Olvidé mi contraseña?
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaso('invitado')}
                        className="text-slate-500 hover:text-slate-700 font-medium hover:underline transition-colors focus:outline-none cursor-pointer"
                      >
                        Visitante / Invitado
                      </button>
                    </div>

                    {/* Botón Destacado: Registrarse / Primer Ingreso */}
                    <button
                      id="btn-registrarse-aqui"
                      type="button"
                      onClick={() => {
                        setPrimerIngresoData(prev => ({
                          ...prev,
                          cedula: identificador.replace(/\D/g, '') || '',
                          nombreCompleto: '',
                          email: '',
                          telefonoNumero: '',
                          telefono: '',
                          password: '',
                          confirmPassword: ''
                        }));
                        setSubPasoPrimerIngreso(1);
                        setPaso('primer_ingreso');
                        setError('');
                      }}
                      className="w-full py-2 px-3 bg-sky-50 hover:bg-sky-100/80 border border-sky-200 text-sky-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-sky-600" />
                      <span>¿Primer ingreso o no tienes cuenta? Registrarse aquí</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ========================================================
                  PASO 2: CONTRASEÑA CON PREVIEW COMPLETO DEL USUARIO
              ======================================================== */}
              {paso === 'clave' && usuarioEncontrado && (
                <motion.div
                  key="paso-clave"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  {/* Ficha de Identidad del Usuario Encontrado */}
                  <div className="p-3.5 bg-gradient-to-r from-sky-50 to-blue-50/70 border border-sky-200 rounded-2xl flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-white border-2 border-sky-300 shadow-sm shrink-0 flex items-center justify-center">
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
                        <div className="w-full h-full bg-gradient-to-tr from-[#2189cf] to-sky-400 text-white font-black flex items-center justify-center text-lg shadow-inner">
                          {usuarioEncontrado.nombre_completo ? usuarioEncontrado.nombre_completo[0].toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-extrabold text-slate-900 text-sm leading-snug truncate">
                          {usuarioEncontrado.nombre_completo || 'Usuario'}
                        </p>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-sky-200/80 text-sky-800 px-2 py-0.5 rounded-full border border-sky-300/60 shrink-0">
                          {usuarioEncontrado.rol || 'Personal SIGAE'}
                        </span>
                      </div>
                      {usuarioEncontrado.cargo && (
                        <p className="text-[11px] font-bold text-sky-800 mt-0.5 truncate">
                          <span className="text-slate-400 font-semibold">Cargo: </span>
                          <span>{usuarioEncontrado.cargo}</span>
                        </p>
                      )}
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        C.I. {usuarioEncontrado.cedula} &bull; Sede {school === 'sb' ? 'Santa Bárbara' : 'Libertador Bolívar'}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleLoginClave} className="space-y-3.5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Contraseña Institucional
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setPaso('recuperar');
                            setRecuperarIdentificador(usuarioEncontrado.cedula);
                            setError('');
                          }}
                          className="text-xs text-[#2189cf] hover:text-[#1c78b8] font-bold transition-colors hover:underline focus:outline-none cursor-pointer"
                        >
                          ¿Olvidé mi contraseña?
                        </button>
                      </div>

                      <div className="relative flex items-center">
                        <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none z-10">
                          <Lock3DIcon size={18} />
                        </div>
                        <input
                          type={mostrarPassword ? 'text' : 'password'}
                          autoFocus
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Ingrese su clave"
                          className="w-full h-11 pl-10 pr-10 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2d93d0] focus:bg-white text-slate-800 font-semibold transition-all shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarPassword(!mostrarPassword)}
                          className="absolute right-2.5 inset-y-0 my-auto h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
                        >
                          {mostrarPassword ? <EyeOff className="w-4 h-4 text-sky-600" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={cargando}
                      className="w-full h-11 bg-gradient-to-r from-[#2189cf] to-[#2d93d0] hover:from-[#1c78b8] hover:to-[#2189cf] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-sky-600/30 hover:shadow-xl hover:shadow-sky-600/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {cargando ? (
                        <span>Ingresando al sistema...</span>
                      ) : (
                        <>
                          <span>Ingresar al Sistema</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="pt-2 text-center border-t border-slate-100">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-xs text-slate-500 hover:text-sky-600 font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Ingresar con otra cédula o usuario</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ========================================================
                  PASO: CONFIRMAR USUARIO NO REGISTRADO
              ======================================================== */}
              {paso === 'confirmar_no_registrado' && (
                <motion.div
                  key="paso-confirmar"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center space-y-4 py-1"
                >
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
                    <AlertCircle className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-800">Cédula o usuario no registrado</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      El identificador <strong className="text-slate-800 font-mono">"{identificador}"</strong> no figura registrado actualmente en el sistema.
                    </p>
                    <p className="text-xs font-semibold text-slate-700 mt-3">
                      ¿Deseas corregir el número o crear tu cuenta por primera vez?
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setPaso('identificar')}
                      className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      No, corregirlo
                    </button>
                    <button
                      id="btn-registrarse-aqui"
                      type="button"
                      onClick={() => {
                        setPrimerIngresoData(prev => ({
                          ...prev,
                          cedula: identificador.replace(/\D/g, '') || identificador,
                          nombreCompleto: '',
                          email: '',
                          telefonoNumero: '',
                          telefono: '',
                          password: '',
                          confirmPassword: ''
                        }));
                        setSubPasoPrimerIngreso(1);
                        setPaso('primer_ingreso');
                        setError('');
                      }}
                      className="py-2.5 px-4 bg-[#2189cf] hover:bg-[#1c78b8] text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Sí, registrarme
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ========================================================
                  PASO: REGISTRO / PRIMER INGRESO (2 SUB-PASOS)
              ======================================================== */}
              {paso === 'primer_ingreso' && (
                <motion.div
                  key="paso-primer-ingreso"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3.5"
                >
                  {/* Barra de Progreso de 2 Pasos */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        subPasoPrimerIngreso === 1 ? 'bg-sky-600 text-white shadow-sm' : 'bg-emerald-600 text-white'
                      }`}>
                        {subPasoPrimerIngreso === 1 ? '1' : '✓'}
                      </span>
                      <span className={`text-[11px] font-bold ${subPasoPrimerIngreso === 1 ? 'text-sky-800' : 'text-slate-500'}`}>
                        Datos, Foto & Clave
                      </span>
                    </div>

                    <span className="text-slate-300 font-bold">• • •</span>

                    <div className="flex items-center gap-1.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        subPasoPrimerIngreso === 2 ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'
                      }`}>
                        2
                      </span>
                      <span className={`text-[11px] font-bold ${subPasoPrimerIngreso === 2 ? 'text-sky-800' : 'text-slate-400'}`}>
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
                        <div className="overflow-hidden flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-extrabold uppercase bg-sky-200 text-sky-800 px-1.5 py-0.2 rounded">
                              Registro / Activación
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500">
                              C.I. {primerIngresoData.cedula || 'Pendiente'}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-slate-800 text-xs truncate">
                            {primerIngresoData.nombreCompleto || 'Nuevo Usuario'}
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
                            className={`py-1 px-2 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              primerIngresoData.modoFoto === 'avatar'
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
                            className={`py-1 px-2 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              primerIngresoData.modoFoto === 'subir'
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
                                    className={`relative p-1 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                                      activo
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

                        {/* Subir Foto con Recorte Circular */}
                        {primerIngresoData.modoFoto === 'subir' && (
                          <div className="space-y-2 p-2.5 bg-white rounded-xl border border-dashed border-sky-300 text-center">
                            {primerIngresoData.fotoSubidaUrl ? (
                              <div className="flex items-center justify-center gap-3">
                                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-sky-600 shadow-md shrink-0 ring-2 ring-sky-300 flex items-center justify-center">
                                  <img src={primerIngresoData.fotoSubidaUrl} alt="Foto recortada" className="w-full h-full object-cover rounded-full" />
                                </div>
                                <div className="text-left space-y-1">
                                  <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Foto personal lista</span>
                                  </span>
                                  <div className="flex items-center gap-1.5 pt-0.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (imagenOriginalParaRecortar || primerIngresoData.fotoSubidaUrl) {
                                          setCropperOpen(true);
                                        }
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 border border-sky-200 rounded-lg text-[10px] font-bold text-sky-800 hover:bg-sky-100 transition-all cursor-pointer"
                                    >
                                      <Crop className="w-3 h-3 text-sky-600" />
                                      <span>Reajustar</span>
                                    </button>
                                    <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-300 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-100 transition-all">
                                      <Camera className="w-3 h-3 text-sky-600" />
                                      <span>Cambiar</span>
                                      <input type="file" accept="image/*" onChange={handleSeleccionarArchivoFoto} className="hidden" />
                                    </label>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <label className="cursor-pointer flex flex-col items-center justify-center py-2.5 px-2 group">
                                <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mb-1 group-hover:scale-105 group-hover:bg-sky-200 transition-all">
                                  <Upload className="w-4 h-4" />
                                </div>
                                <span className="text-[11px] font-bold text-sky-800">Toca para tomar o seleccionar foto</span>
                                <span className="text-[9px] text-slate-400">Permite encuadre y recorte circular táctil</span>
                                <input type="file" accept="image/*" onChange={handleSeleccionarArchivoFoto} className="hidden" />
                              </label>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Cédula y Nombres */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 text-[11px]">Cédula de Identidad *</label>
                          <input
                            type="text"
                            required
                            value={primerIngresoData.cedula}
                            onChange={(e) => setPrimerIngresoData({ ...primerIngresoData, cedula: e.target.value.replace(/\D/g, '') })}
                            placeholder="Ej: 12345678"
                            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-800 text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 text-[11px]">Nombres y Apellidos *</label>
                          <input
                            type="text"
                            required
                            value={primerIngresoData.nombreCompleto}
                            onChange={(e) => setPrimerIngresoData({ ...primerIngresoData, nombreCompleto: e.target.value })}
                            placeholder="Ej: María Pérez"
                            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-800 text-xs"
                          />
                        </div>
                      </div>

                      {/* Teléfono Móvil y Correo */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                            <Phone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
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
                                  className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold transition-all border cursor-pointer ${
                                    primerIngresoData.telefonoNumero.startsWith(op.codigo)
                                      ? 'bg-sky-600 text-white border-sky-600'
                                      : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
                                  }`}
                                >
                                  {op.codigo}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Correo */}
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                            <Mail className="w-3.5 h-3.5 text-sky-600 shrink-0" />
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
                                className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold bg-white text-slate-600 border border-slate-200 hover:border-sky-300 cursor-pointer"
                              >
                                {dom}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Nombre de Usuario (Alias único) */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                          <AtSign className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span>Nombre de Usuario (Alias de acceso) *</span>
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-sky-700 font-black text-sm select-none pointer-events-none">@</span>
                          <input
                            type="text"
                            required
                            value={primerIngresoData.username}
                            onChange={(e) => setPrimerIngresoData({
                              ...primerIngresoData,
                              username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 20)
                            })}
                            placeholder="ej: maria.gonzalez"
                            className="w-full h-10 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs"
                          />
                        </div>
                        {sugerenciasUsuario.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap pt-0.5">
                            <span className="text-[9px] font-bold text-slate-400">Sugerencias:</span>
                            {sugerenciasUsuario.map((sug) => (
                              <button
                                key={sug}
                                type="button"
                                onClick={() => setPrimerIngresoData({ ...primerIngresoData, username: sug })}
                                className="text-[9px] px-2 py-0.5 rounded-md font-bold bg-white text-sky-700 border border-sky-200 hover:bg-sky-50 cursor-pointer"
                              >
                                @{sug}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Contraseña y Confirmar con Termómetro */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 text-[11px]">Nueva Contraseña *</label>
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
                              {mostrarPassword ? <EyeOff className="w-3.5 h-3.5 text-sky-600" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
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
                          className="w-full h-11 bg-gradient-to-r from-[#2189cf] to-[#2d93d0] hover:from-[#1c78b8] hover:to-[#2189cf] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <span>Continuar a Preguntas de Seguridad (2/2)</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaso('identificar')}
                          className="w-full py-1 text-center text-slate-400 hover:text-slate-700 font-semibold text-xs cursor-pointer"
                        >
                          Cancelar y volver
                        </button>
                      </div>
                    </form>
                  )}

                  {/* SUB-PASO 2: TRES PREGUNTAS DE SEGURIDAD */}
                  {subPasoPrimerIngreso === 2 && (
                    <form onSubmit={handleGuardarPrimerIngreso} className="space-y-3 text-xs">
                      <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-sky-600 shrink-0" />
                        <p className="text-[11px] text-sky-900 leading-snug">
                          Elija tres preguntas y escriba sus respuestas secretas. Servirán para restablecer su cuenta en caso de olvido.
                        </p>
                      </div>

                      {/* Pregunta 1 */}
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
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
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
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
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
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
                          className="w-full h-11 bg-gradient-to-r from-emerald-600 via-sky-600 to-indigo-700 hover:from-emerald-700 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {cargando ? 'Guardando credenciales...' : (
                            <>
                              <ShieldCheck className="w-4 h-4 text-emerald-300" />
                              <span>Guardar Credenciales e Ingresar</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubPasoPrimerIngreso(1)}
                          className="w-full py-1 text-center text-slate-500 hover:text-slate-800 font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer"
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

            {/* Enlace al Portal Informativo */}
            <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-center">
              <Link
                to={`/portal/${school}`}
                className="text-[11px] font-bold text-slate-500 hover:text-sky-700 inline-flex items-center gap-1 transition-colors"
              >
                <span>Ver Portal Web Informativo de la Institución</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Sello Oficial MPPE */}
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-col items-center select-none">
              <img
                src="/img/ministerio-educacion-logo.png"
                alt="Ministerio del Poder Popular para la Educación"
                className="h-6 sm:h-7 w-auto object-contain"
              />
              <p className="text-[10px] text-slate-400 font-semibold text-center mt-1">
                República Bolivariana de Venezuela &bull; MPPE
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Cintillo Footer Institucional Bicentenario (De esquina a esquina sin separación) */}
      <footer className="w-full max-w-full relative z-10 mt-auto -mt-4 sm:-mt-6 md:-mt-8 shrink-0 leading-none p-0 m-0 overflow-hidden min-w-0 pointer-events-none">
        <img
          src="/img/cintillo-footer-venezuela.png"
          alt="República Bolivariana de Venezuela - Bicentenario 200"
          className="w-full max-w-full h-auto block select-none pointer-events-none"
        />
      </footer>

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
