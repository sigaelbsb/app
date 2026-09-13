import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { auditar } from '../lib/audit';
import { formatPhoneNumber } from '../lib/formatters';

export type TipoSonidoSorpresa = 'campanas' | 'arpa' | 'voz' | 'celestial' | 'fanfarria';

export interface ConfigSorpresaAsignacion {
  habilitado: boolean;
  modoFrecuencia: 'siempre' | 'una_vez_al_dia' | 'solo_primera_vez' | 'rango_fechas';
  fechaInicio?: string;
  fechaFin?: string;
  mensajePersonalizado?: string;
  tiempoMinimoSegundos?: number;
  conSonido?: boolean;
  tipoSonido?: TipoSonidoSorpresa;
}

export const CONFIG_SORPRESA_DEFAULT: ConfigSorpresaAsignacion = {
  habilitado: true,
  modoFrecuencia: 'solo_primera_vez',
  fechaInicio: '2026-09-01',
  fechaFin: '2026-10-31',
  mensajePersonalizado: '"¡Bienvenido(a) a este nuevo ciclo escolar 2026 - 2027! La excelencia y el amor por la educación que entregas cada día transforman el futuro de nuestros estudiantes. ¡Que sea un año lleno de aprendizajes, unión y grandes logros!"',
  tiempoMinimoSegundos: 0,
  conSonido: true,
  tipoSonido: 'campanas'
};

export const getFechaHoyLocal = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const obtenerConfigSorpresa = (): ConfigSorpresaAsignacion => {
  try {
    const raw = localStorage.getItem('sigae_config_sorpresa_2026_2027');
    if (raw) return { ...CONFIG_SORPRESA_DEFAULT, ...JSON.parse(raw) };
  } catch (e) { }
  return CONFIG_SORPRESA_DEFAULT;
};

export const cargarConfigSorpresaGlobal = async (): Promise<ConfigSorpresaAsignacion> => {
  let config = obtenerConfigSorpresa();
  try {
    const { data, error } = await supabase
      .from('ajustes_globales')
      .select('valor')
      .eq('clave', 'config_sorpresa_bienvenida')
      .maybeSingle();

    if (!error && data?.valor) {
      const parsed = typeof data.valor === 'string' ? JSON.parse(data.valor) : data.valor;
      config = { ...CONFIG_SORPRESA_DEFAULT, ...parsed };
      localStorage.setItem('sigae_config_sorpresa_2026_2027', JSON.stringify(config));
    }
  } catch (e) {
    console.error('Error cargando config_sorpresa_bienvenida de Supabase:', e);
  }
  return config;
};

export const guardarConfigSorpresa = async (cfg: ConfigSorpresaAsignacion) => {
  localStorage.setItem('sigae_config_sorpresa_2026_2027', JSON.stringify(cfg));
  window.dispatchEvent(new CustomEvent('sigae-config-sorpresa-actualizada', { detail: cfg }));

  try {
    await supabase
      .from('ajustes_globales')
      .upsert({
        clave: 'config_sorpresa_bienvenida',
        valor: JSON.stringify(cfg),
        descripcion: 'Configuración global de la notificación sorpresa y bienvenida del personal escolar (2026-2027)',
        actualizado_en: new Date().toISOString()
      }, { onConflict: 'clave' });
  } catch (e) {
    console.error('Error persistiendo config_sorpresa_bienvenida en Supabase:', e);
  }
};

// ── CONTROL GLOBAL DE REPRODUCCIÓN (EVITA SUPERPOSICIÓN DE AUDIOS) ──
let currentAudioCtx: any = null;

export const detenerTodosLosSonidos = () => {
  try {
    if (currentAudioCtx) {
      currentAudioCtx.close();
      currentAudioCtx = null;
    }
  } catch (e) { }
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch (e) { }
};

// ── 1. CAMPANAS INSTITUCIONALES (CARILLÓN ARMÓNICO SUAVE Y SOBRIO) ──
export const reproducirCampanasInstitucionales = (silenciado = false) => {
  if (silenciado) return;
  detenerTodosLosSonidos();
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    currentAudioCtx = ctx;

    // Cuatro campanadas armónicas ascendentes y suaves (Mi5, Sol#5, Si5, Mi6)
    const campanas = [
      { freq: 659.25, time: 0.05, gain: 0.16, dur: 1.8 },
      { freq: 830.61, time: 0.35, gain: 0.18, dur: 1.8 },
      { freq: 987.77, time: 0.70, gain: 0.20, dur: 2.1 },
      { freq: 1318.51, time: 1.05, gain: 0.22, dur: 2.5 }
    ];

    campanas.forEach(({ freq, time, gain, dur }) => {
      // Filtro acústico cálido (atenúa estridencias agudas)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, ctx.currentTime + time);

      // Tono fundamental (puro y suave)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, ctx.currentTime + time);

      gain1.gain.setValueAtTime(0.0001, ctx.currentTime + time);
      gain1.gain.linearRampToValueAtTime(gain, ctx.currentTime + time + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + dur);

      osc1.connect(gain1);
      gain1.connect(filter);

      // Resonancia metálica suave típica de campana (armónico 2.76x)
      const oscHarmonic = ctx.createOscillator();
      const gainHarmonic = ctx.createGain();
      oscHarmonic.type = 'sine';
      oscHarmonic.frequency.setValueAtTime(freq * 2.76, ctx.currentTime + time);

      gainHarmonic.gain.setValueAtTime(0.0001, ctx.currentTime + time);
      gainHarmonic.gain.linearRampToValueAtTime(gain * 0.18, ctx.currentTime + time + 0.01);
      gainHarmonic.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + dur * 0.35);

      oscHarmonic.connect(gainHarmonic);
      gainHarmonic.connect(filter);

      filter.connect(ctx.destination);

      osc1.start(ctx.currentTime + time);
      osc1.stop(ctx.currentTime + time + dur + 0.1);
      oscHarmonic.start(ctx.currentTime + time);
      oscHarmonic.stop(ctx.currentTime + time + dur + 0.1);
    });
  } catch (e) { }
};

// ── 2. ARPA Y ACORDE ACÚSTICO (CÁLIDO, ACOGEDOR E INSPIRADOR) ──
export const reproducirArpaAcogedora = (silenciado = false) => {
  if (silenciado) return;
  detenerTodosLosSonidos();
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    currentAudioCtx = ctx;

    // Arpegio cálido en Do Mayor con Novena
    const notas = [
      { freq: 261.63, time: 0.05, gain: 0.20, dur: 2.2 }, // Do4
      { freq: 392.00, time: 0.16, gain: 0.19, dur: 2.1 }, // Sol4
      { freq: 523.25, time: 0.28, gain: 0.21, dur: 2.1 }, // Do5
      { freq: 659.25, time: 0.40, gain: 0.22, dur: 2.3 }, // Mi5
      { freq: 783.99, time: 0.52, gain: 0.21, dur: 2.3 }, // Sol5
      { freq: 987.77, time: 0.65, gain: 0.19, dur: 2.6 }, // Si5
      { freq: 1174.66, time: 0.78, gain: 0.23, dur: 2.9 } // Re6
    ];

    notas.forEach(({ freq, time, gain, dur }) => {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500, ctx.currentTime + time);
      filter.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + time + dur);

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      gainNode.gain.setValueAtTime(0.0001, ctx.currentTime + time);
      gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + time + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + dur);

      osc.connect(gainNode);
      gainNode.connect(filter);
      filter.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + dur + 0.1);
    });
  } catch (e) { }
};

// ── SELECTOR DE MEJOR VOZ VENEZOLANA / LATINOAMERICANA EN ESPAÑOL ──
export const obtenerMejorVozVenezolanaLatinoamericana = (): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Filtrar todas las voces en español
  const allSpanish = voices.filter(v => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith('es'));
  if (allSpanish.length === 0) return null;

  // Excluir estrictamente voces con acento de España (castellano peninsular con ceceo)
  const esSpain = (v: SpeechSynthesisVoice) => {
    const lang = (v.lang || '').toLowerCase();
    const name = (v.name || '').toLowerCase();
    return lang.includes('es-es') || lang.includes('es_es') || name.includes('(spain)') || name.includes('españa');
  };

  const latinoVoices = allSpanish.filter(v => !esSpain(v));
  // Si existen voces latinoamericanas las priorizamos al 100%. Solo si no hay ninguna, se usa allSpanish.
  const pool = latinoVoices.length > 0 ? latinoVoices : allSpanish;

  // 1. Prioridad máxima: Voz de Venezuela (es-VE) si está instalada en el navegador o sistema
  const venezuela = pool.find(v => (v.lang || '').toLowerCase().includes('es-ve') || (v.name || '').toLowerCase().includes('venezuela'));
  if (venezuela) return venezuela;

  // 2. Prioridad: Voces Neuronales / Naturales latinoamericanas (Edge/Windows: Salome - Colombia, Dalia - Mexico, Jorge, Gonzalo, Paola)
  const naturalLatino = pool.find(v => {
    const name = v.name.toLowerCase();
    return (name.includes('natural') || name.includes('neural') || name.includes('online')) &&
      (name.includes('salome') || name.includes('dalia') || name.includes('jorge') ||
        name.includes('gonzalo') || name.includes('paola') || name.includes('sabina') ||
        name.includes('raul') || name.includes('mexico') || name.includes('colombia') ||
        !esSpain(v));
  });
  if (naturalLatino) return naturalLatino;

  // 3. Prioridad: Voces Google en español latinoamericano (Google español de Estados Unidos / Latinoamérica)
  const googleLatino = pool.find(v => {
    const name = v.name.toLowerCase();
    return name.includes('google') && !esSpain(v);
  });
  if (googleLatino) return googleLatino;

  // 4. Prioridad: Voces estándar de Windows de Latinoamérica (Sabina, Paulina, Mia, Monica)
  const windowsLatino = pool.find(v => {
    const name = v.name.toLowerCase();
    return name.includes('sabina') || name.includes('paulina') || name.includes('monica') || name.includes('mia');
  });
  if (windowsLatino) return windowsLatino;

  return pool[0];
};

// ── 3. LOCUCIÓN OFICIAL DE LA IA SIGMA (ASISTENTE VIRTUAL SIGAE - TONO VENEZOLANO) ──
// ── FONETIZACIÓN DE NOMBRES PARA SÍNTESIS DE VOZ (TTS) EN ESPAÑOL ──
export const fonetizarNombreParaVoz = (nombre: string): string => {
  if (!nombre) return '';

  // Diccionario fonético directo para nombres de grafía compleja o anglosajona en Venezuela
  const foneticas: Record<string, string> = {
    'trinellys': 'Trinelis',
    'trinellis': 'Trinelis',
    'trinelys': 'Trinelis',
    'krisbelys': 'Crisbelis',
    'karelys': 'Carelis',
    'nayelis': 'Nayelis',
    'anyelis': 'Anyelis',
    'yanelis': 'Yanelis',
    'mileidys': 'Mileidis',
    'yuleidys': 'Yuleidis',
    'gleidys': 'Gleidis',
    'yusmary': 'Yusmari',
    'yaneth': 'Yanet',
    'judith': 'Yudit',
    'elizabeth': 'Elisabet',
    'thais': 'Taís',
    'thaís': 'Taís',
    'dayana': 'Dayana',
    'yulimar': 'Yulimar',
    'jamnymar': 'Yannimar',
    'jamnimar': 'Yannimar',
    'ruthmary': 'Rutmari',
    'rutmary': 'Rutmari',
    'sorinee': 'Soriné',
    'sorine': 'Soriné',
    'sulmary': 'Sulmari',
    'sulmari': 'Sulmari',
    'vasny': 'Vásni',
    'vasni': 'Vásni',
    'viginia': 'Vijínia',
    'vijinia': 'Vijínia',
    'virjinia': 'Virjínia',
    'virginia': 'Virjínia',
    'yohandri': 'Yoandri',
    'yohandry': 'Yoandri',
    'yudercy': 'Yudérsi',
    'yudersi': 'Yudérsi',
    'coromoto': 'Coromoto'
  };

  const pLower = nombre.toLowerCase().trim();
  if (foneticas[pLower]) {
    return foneticas[pLower];
  }

  let fon = nombre;
  // Reglas morfológicas para síntesis de voz en español:
  // "ellys", "ellis", "elys" -> "elis" (ej: Trinellys -> Trinelis)
  if (/ellys$/i.test(fon)) fon = fon.replace(/ellys$/i, 'elis');
  else if (/ellis$/i.test(fon)) fon = fon.replace(/ellis$/i, 'elis');
  else if (/elys$/i.test(fon)) fon = fon.replace(/elys$/i, 'elis');
  else if (/ys$/i.test(fon)) fon = fon.replace(/ys$/i, 'is');
  else if (/mary$/i.test(fon)) fon = fon.replace(/mary$/i, 'mari');
  else if (/^yoh/i.test(fon)) fon = fon.replace(/^yoh/i, 'Yo');

  return fon;
};

// ── DETECTOR INTELIGENTE DE GÉNERO FEMENINO PARA EL CUERPO DOCENTE ──
export const esGeneroFemeninoDocente = (
  sexo?: string,
  nombreCompleto?: string,
  primerNombre?: string
): boolean => {
  // 1. Verificación directa en el campo sexo del expediente o usuario
  const s = (sexo || '').toString().trim().toLowerCase();
  if (s.startsWith('f') || s === 'mujer' || s === 'femenino' || s === 'femenina') return true;
  if (s.startsWith('m') || s === 'hombre' || s === 'masculino') return false;

  // 2. Indicadores de nombre compuesto o casada en Venezuela ("Del Valle", "De Carvajal", etc.)
  const nCompleto = (nombreCompleto || '').toLowerCase();
  if (
    nCompleto.includes('del valle') || 
    nCompleto.includes('de la') || 
    nCompleto.includes('de las') || 
    nCompleto.includes('de los angeles') || 
    nCompleto.includes(' de ') // Apellido de casada tradicional en Venezuela
  ) {
    return true;
  }

  // 3. Diccionario de nombres femeninos típicos venezolanos
  const p = (primerNombre || '').toLowerCase().trim();
  const nombresFemeninos = [
    'trinellys', 'trinellis', 'trinelys', 'carmen', 'mercedes', 'coromoto', 'esperanza',
    'pilar', 'luz', 'consuelo', 'rosario', 'amparo', 'socorro', 'concepcion', 'inmaculada',
    'belen', 'monserrat', 'gladys', 'iris', 'doris', 'belkis', 'damaris', 'genesis', 'thais',
    'thaís', 'yaneth', 'judith', 'elizabeth', 'ruth', 'ester', 'beatriz', 'inés', 'ines',
    'yusmary', 'krisbelys', 'karelys', 'nayelis', 'anyelis', 'yanelis', 'mileidys', 'mileidy',
    'yuleidys', 'yuleidis', 'gleidys', 'gleidis', 'zuleidy', 'zuleidys', 'greicys', 'greidys',
    'marilis', 'marlis', 'maryelis', 'mayerlin', 'evelyn', 'jackeline', 'katherine', 'yoselyn',
    'maribel', 'isabel', 'anamar', 'dayamar', 'yulimar', 'delimar', 'nilmar', 'guiomar',
    'jamnymar', 'jamnimar', 'yannimar', 'ruthmary', 'rutmari', 'sorinee', 'soriné', 'sulmary', 'sulmari',
    'vasny', 'vasni', 'vásni', 'viginia', 'virginia', 'virjinia', 'virhinia', 'vijinia', 'vijínia',
    'yudercy', 'yudersi', 'yudérsi'
  ];
  if (nombresFemeninos.includes(p)) return true;

  // 4. Terminaciones morfológicas y fonéticas típicamente femeninas en Venezuela
  if (
    p.endsWith('a') || 
    p.endsWith('ys') || 
    p.endsWith('is') || 
    p.endsWith('lys') || 
    p.endsWith('lis') || 
    p.endsWith('eth') || 
    p.endsWith('ith') || 
    p.endsWith('eidy') || 
    p.endsWith('eidis') || 
    p.endsWith('aidy') || 
    p.endsWith('lyn') || 
    p.endsWith('lin') ||
    p.endsWith('ely') ||
    p.endsWith('eli')
  ) {
    // Excepciones masculinas comunes que terminan en is/ys/in/lin
    const excepcionesMasculinas = ['luis', 'carlos', 'marcos', 'jesus', 'jesús', 'alexis', 'boris', 'denis', 'efrain', 'efraín', 'franklin', 'joaquin', 'joaquín', 'martin', 'martín', 'agustin', 'agustín'];
    if (!excepcionesMasculinas.includes(p)) {
      return true;
    }
  }

  return false;
};

// ── 3. LOCUCIÓN OFICIAL DE LA IA SIGMA (ASISTENTE VIRTUAL SIGAE - TONO VENEZOLANO) ──
export const reproducirVozBienvenida = (
  silenciado = false,
  datosTrabajador?: { nombre_completo?: string; rol?: string; sexo?: string; genero?: string; cedula?: string } | string
) => {
  if (silenciado) return;
  detenerTodosLosSonidos();

  let nombreCompleto = '';
  let rol = '';
  let sexo = '';

  if (typeof datosTrabajador === 'object' && datosTrabajador !== null) {
    nombreCompleto = datosTrabajador.nombre_completo || '';
    rol = datosTrabajador.rol || '';
    sexo = (datosTrabajador as any).sexo || (datosTrabajador as any).genero || '';
  } else if (typeof datosTrabajador === 'string') {
    nombreCompleto = datosTrabajador;
  }

  // Si NO se especificó un trabajador en particular, tomar el usuario activo de la sesión
  if (!nombreCompleto) {
    try {
      const uSes = JSON.parse(localStorage.getItem('usuario_sigae') || '{}');
      nombreCompleto = uSes.nombre_completo || uSes.nombre || 'Luis';
      rol = uSes.rol || 'Docente';
      sexo = uSes.sexo || uSes.genero || '';

      const targetCed = uSes.cedula || uSes.usuario || '';
      if (!sexo && targetCed) {
        const demoExp = localStorage.getItem(`sigae_expediente_demo_${targetCed}`);
        if (demoExp) {
          const parsed = JSON.parse(demoExp);
          if (parsed.sexo) sexo = parsed.sexo;
        }
      }
    } catch (e) { }
  }

  // ── MÚSICA DE FONDO ACÚSTICA, DELICADA Y ACOGEDORA (ARPA Y CAMPANITAS SUAVES) ──
  // Se eliminan zumbidos electrónicos, acordes sintéticos y frecuencias altas estridentes.
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      currentAudioCtx = ctx;

      // 1. Campanitas acústicas y cálidas de saludo inicial (Mi5 -> La5)
      const campanitasApertura = [
        { freq: 659.25, time: 0.05, dur: 0.8, gain: 0.035 },
        { freq: 880.00, time: 0.28, dur: 1.2, gain: 0.040 }
      ];

      campanitasApertura.forEach(({ freq, time, dur, gain }) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

        gainNode.gain.setValueAtTime(0.0001, ctx.currentTime + time);
        gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + time + 0.012);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + dur);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + dur + 0.05);
      });

      // 2. Fondo de arpa acústica suave y espaciada (notas pulsadas con caída natural a muy bajo volumen)
      // Deja que la voz de Sigma sea la protagonista principal y nítida
      const arpaFondo = [
        { freq: 523.25, time: 0.8, dur: 1.4, gain: 0.020 },  // Do5
        { freq: 659.25, time: 2.2, dur: 1.4, gain: 0.018 },  // Mi5
        { freq: 783.99, time: 3.8, dur: 1.5, gain: 0.018 },  // Sol5
        { freq: 523.25, time: 5.6, dur: 1.4, gain: 0.017 },  // Do5
        { freq: 698.46, time: 7.4, dur: 1.5, gain: 0.017 },  // Fa5
        { freq: 783.99, time: 9.2, dur: 1.5, gain: 0.018 },  // Sol5
        { freq: 659.25, time: 11.2, dur: 1.4, gain: 0.017 }, // Mi5
        { freq: 523.25, time: 13.5, dur: 1.5, gain: 0.018 }, // Do5
        { freq: 392.00, time: 15.8, dur: 1.8, gain: 0.020 }, // Sol4
        { freq: 523.25, time: 18.5, dur: 2.2, gain: 0.022 }  // Do5 final
      ];

      arpaFondo.forEach(({ freq, time, dur, gain }) => {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, ctx.currentTime + time);

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine'; // Onda senoidal pura, cálida, sin distorsión
        osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

        gainNode.gain.setValueAtTime(0.0001, ctx.currentTime + time);
        gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + time + 0.015);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + dur);

        osc.connect(gainNode);
        gainNode.connect(filter);
        filter.connect(ctx.destination);

        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + dur + 0.1);
      });
    }
  } catch (e) { }

  if (!('speechSynthesis' in window)) return;

  const ejecutarLocucionSigma = () => {
    try {
      window.speechSynthesis.cancel();

      // Extracción del nombre limpio del trabajador
      const nombreLimpio = (nombreCompleto || '').trim().replace(/^(profesor|profesora|profe|prof\.|lic\.|ing\.|dr\.|dra\.)\s+/i, '');
      const partes = nombreLimpio.trim().split(/\s+/);
      const primerNombre = partes[0] ? (partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase()) : 'Luis';

      // ── DETERMINACIÓN DEL GÉNERO SEGÚN EXPEDIENTE Y PATRONES VENEZOLANOS ──
      const esFemenino = esGeneroFemeninoDocente(sexo, nombreCompleto, primerNombre);

      // TRATAMIENTO OBLIGATORIO: PROFESOR O PROFESORA (SOLO AL ROL DOCENTE)
      const esRolDocente = !rol || String(rol).toLowerCase().includes('docen') || String(rol).toLowerCase().includes('prof');
      const tituloDocente = esFemenino ? 'Profesora' : 'Profesor';
      // Fonetización del nombre para que el motor de voz lo pronuncie como se dice en Venezuela (ej: Trinellys -> Trinelis)
      const nombrePronunciado = fonetizarNombreParaVoz(primerNombre);
      const vocativo = esRolDocente ? `${tituloDocente} ${nombrePronunciado}` : nombrePronunciado;

      // Guion con calidez venezolana, afecto institucional y saludo personalizado por rol docente
      const texto = vocativo
        ? `¡Hola, ${vocativo}! Te saluda Sigma, tu Asistente Virtual del Sistema Integral de Gestión y Administración Escolar. ¡Qué alegría tan grande darte la bienvenida a este nuevo año escolar dos mil veintiséis, dos mil veintisiete! Todo el equipo directivo y la comunidad educativa celebra con orgullo tu vocación y tu compromiso con el futuro de nuestros estudiantes. En pantalla he organizado tus salones de clase y tus responsabilidades asignadas. ¡Te deseo un año escolar bien productivo y colmado de bendiciones!`
        : `¡Hola a todo nuestro valioso equipo docente! Te saluda Sigma, tu Asistente Virtual en SIGAE. ¡Qué alegría darles la bienvenida a este nuevo año escolar dos mil veintiséis, dos mil veintisiete! Celebramos con profundo orgullo su vocación y amor por la enseñanza de nuestros estudiantes. En pantalla he organizado y proyectado sus responsabilidades y aulas de clase asignadas. ¡Que sea un año escolar bien productivo y lleno de bendiciones para todos!`;

      const u = new SpeechSynthesisUtterance(texto);

      const mejorVoz = obtenerMejorVozVenezolanaLatinoamericana();
      if (mejorVoz) {
        u.voice = mejorVoz;
        u.lang = mejorVoz.lang || 'es-VE';
      } else {
        u.lang = 'es-VE';
      }

      // Cadencia venezolana: fluida, cálida, sin apuros y con entonación sonriente
      u.rate = 1.01;
      u.pitch = 1.06;
      u.volume = 1.0;

      window.speechSynthesis.speak(u);
    } catch (e) { }
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    setTimeout(ejecutarLocucionSigma, 750);
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      setTimeout(ejecutarLocucionSigma, 750);
    };
    setTimeout(ejecutarLocucionSigma, 850);
  }
};

// ── 4. ACORDE CELESTIAL / AMBIENT PAD (MODERNO, DISCRETO Y ENVOLVENTE) ──
export const reproducirAcordeCelestial = (silenciado = false) => {
  if (silenciado) return;
  detenerTodosLosSonidos();
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    currentAudioCtx = ctx;

    const voces = [
      { freq: 87.31, gain: 0.14 },  // Fa2
      { freq: 130.81, gain: 0.13 }, // Do3
      { freq: 220.00, gain: 0.11 }, // La3
      { freq: 261.63, gain: 0.13 }, // Do4
      { freq: 329.63, gain: 0.13 }, // Mi4
      { freq: 392.00, gain: 0.14 }, // Sol4
      { freq: 523.25, gain: 0.11 }  // Do5
    ];

    const masterFilter = ctx.createBiquadFilter();
    masterFilter.type = 'lowpass';
    masterFilter.frequency.setValueAtTime(650, ctx.currentTime);
    masterFilter.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + 1.2);
    masterFilter.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 3.0);
    masterFilter.connect(ctx.destination);

    voces.forEach(({ freq, gain }) => {
      [-3, 3].forEach(detune => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.detune.setValueAtTime(detune, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(gain * 0.45, ctx.currentTime + 0.45);
        gainNode.gain.setValueAtTime(gain * 0.45, ctx.currentTime + 1.4);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 3.1);

        osc.connect(gainNode);
        gainNode.connect(masterFilter);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 3.2);
      });
    });
  } catch (e) { }
};

// ── 5. FANFARRIA ORIGINAL (PARA COMPARAR) ──
export const reproducirFanfarriaCelebracion = (silenciado = false) => {
  if (silenciado) return;
  detenerTodosLosSonidos();
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    currentAudioCtx = ctx;

    const fanfarria = [
      { freq: 261.63, time: 0.05, dur: 0.14, gain: 0.22, type: 'triangle' as OscillatorType },
      { freq: 329.63, time: 0.20, dur: 0.14, gain: 0.24, type: 'triangle' as OscillatorType },
      { freq: 392.00, time: 0.35, dur: 0.16, gain: 0.28, type: 'triangle' as OscillatorType },
      { freq: 523.25, time: 0.52, dur: 0.38, gain: 0.32, type: 'sine' as OscillatorType },
      { freq: 659.25, time: 0.75, dur: 0.32, gain: 0.28, type: 'sine' as OscillatorType },
      { freq: 783.99, time: 0.95, dur: 0.55, gain: 0.35, type: 'triangle' as OscillatorType },
      { freq: 1046.50, time: 1.25, dur: 1.10, gain: 0.38, type: 'sine' as OscillatorType }
    ];

    fanfarria.forEach(({ freq, time, dur, gain, type }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      gainNode.gain.setValueAtTime(0.001, ctx.currentTime + time);
      gainNode.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + time + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + dur);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + dur + 0.1);
    });

    for (let i = 0; i < 7; i++) {
      const chimeTime = 1.35 + i * 0.14;
      const chimeFreq = 1400 + (i % 3) * 350 + Math.random() * 200;
      const oscChime = ctx.createOscillator();
      const gainChime = ctx.createGain();

      oscChime.type = 'sine';
      oscChime.frequency.setValueAtTime(chimeFreq, ctx.currentTime + chimeTime);

      gainChime.gain.setValueAtTime(0.001, ctx.currentTime + chimeTime);
      gainChime.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + chimeTime + 0.02);
      gainChime.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + chimeTime + 0.28);

      oscChime.connect(gainChime);
      gainChime.connect(ctx.destination);

      oscChime.start(ctx.currentTime + chimeTime);
      oscChime.stop(ctx.currentTime + chimeTime + 0.35);
    }
  } catch (e) { }
};

// ── DESPACHADOR CENTRAL DE SONIDO POR TIPO ──
export const reproducirSonidoPorTipo = (
  tipo: TipoSonidoSorpresa = 'campanas',
  silenciado = false,
  datosTrabajador?: { nombre_completo?: string; rol?: string; sexo?: string; genero?: string; cedula?: string } | string
) => {
  if (silenciado) return;
  switch (tipo) {
    case 'campanas':
      reproducirCampanasInstitucionales(false);
      break;
    case 'arpa':
      reproducirArpaAcogedora(false);
      break;
    case 'voz':
      reproducirVozBienvenida(false, datosTrabajador);
      break;
    case 'celestial':
      reproducirAcordeCelestial(false);
      break;
    case 'fanfarria':
      reproducirFanfarriaCelebracion(false);
      break;
    default:
      reproducirCampanasInstitucionales(false);
  }
};

const reproducirChimeExito = (silenciado: boolean) => {
  if (silenciado) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) { }
};

// ── MODAL EXCLUSIVO PARA PROBAR Y COMPARAR TODOS LOS AUDIOS UNO A UNO ──
export const abrirModalProbarSonidos = (Swal: any, onSeleccionado?: (tipo: TipoSonidoSorpresa) => void) => {
  if (!Swal) return;
  const cfgActual = obtenerConfigSorpresa();
  const tipoSeleccionado: TipoSonidoSorpresa = cfgActual.tipoSonido || 'campanas';

  Swal.fire({
    title: '<div class="d-flex align-items-center justify-content-center gap-2 text-dark"><i class="bi bi-soundwave text-primary fs-3"></i> <span class="fw-bold">Banco de Audios de Bienvenida</span></div>',
    width: '680px',
    html: `
      <div class="text-start">
        <p class="small text-muted mb-3">
          Pruebe cada uno de los estilos acústicos haciendo clic en <b>[▶ Escuchar]</b>. Seleccione el que mejor represente la calidez y solemnidad institucional de su escuela:
        </p>

        <div class="d-flex flex-column gap-2.5 mb-3">

          <!-- 1. Campanas Institucionales -->
          <div class="p-2.5 rounded-3 border d-flex align-items-center justify-content-between bg-white shadow-xs" id="card-sonido-campanas">
            <div class="d-flex align-items-center gap-2.5">
              <input class="form-check-input mt-0 cursor-pointer" type="radio" name="radio-sonido-sorpresa" id="radio-campanas" value="campanas" ${tipoSeleccionado === 'campanas' ? 'checked' : ''}>
              <div>
                <label class="fw-bold text-dark small mb-0 d-block cursor-pointer" for="radio-campanas">
                  🔔 1. Campanas Institucionales <span class="badge bg-success bg-opacity-10 text-success ms-1 extra-small">Recomendado</span>
                </label>
                <span class="extra-small text-muted">Carillón armónico suave con resonancia cálida. Elegante, sobrio y no invasivo.</span>
              </div>
            </div>
            <button type="button" id="btn-play-campanas" class="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-bold flex-shrink-0">
              <i class="bi bi-play-fill me-1"></i>Escuchar
            </button>
          </div>

          <!-- 2. Arpa y Acorde Acústico -->
          <div class="p-2.5 rounded-3 border d-flex align-items-center justify-content-between bg-white shadow-xs" id="card-sonido-arpa">
            <div class="d-flex align-items-center gap-2.5">
              <input class="form-check-input mt-0 cursor-pointer" type="radio" name="radio-sonido-sorpresa" id="radio-arpa" value="arpa" ${tipoSeleccionado === 'arpa' ? 'checked' : ''}>
              <div>
                <label class="fw-bold text-dark small mb-0 d-block cursor-pointer" for="radio-arpa">
                  🎵 2. Arpa y Acorde Acústico
                </label>
                <span class="extra-small text-muted">Arpegio orquestal cálido en Do Mayor. Inspirador, afectuoso y pedagógico.</span>
              </div>
            </div>
            <button type="button" id="btn-play-arpa" class="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-bold flex-shrink-0">
              <i class="bi bi-play-fill me-1"></i>Escuchar
            </button>
          </div>

          <!-- 3. Voz de la IA Sigma (Asistente Virtual SIGAE) -->
          <div class="p-2.5 rounded-3 border d-flex align-items-center justify-content-between bg-white shadow-xs" id="card-sonido-voz">
            <div class="d-flex align-items-center gap-2.5">
              <input class="form-check-input mt-0 cursor-pointer" type="radio" name="radio-sonido-sorpresa" id="radio-voz" value="voz" ${tipoSeleccionado === 'voz' ? 'checked' : ''}>
              <div>
                <label class="fw-bold text-dark small mb-0 d-block cursor-pointer" for="radio-voz">
                  🤖 3. Voz de la IA Sigma (Asistente Virtual SIGAE) <span class="badge bg-primary bg-opacity-10 text-primary ms-1 extra-small">IA Oficial SIGAE</span>
                </label>
                <span class="extra-small text-muted">Presentación alegre de Sigma (tu asistente inteligente de SIGAE), con chime de activación digital futurista y fondo festivo.</span>
              </div>
            </div>
            <button type="button" id="btn-play-voz" class="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-bold flex-shrink-0">
              <i class="bi bi-play-fill me-1"></i>Escuchar
            </button>
          </div>

          <!-- 4. Acorde Celestial Ambient -->
          <div class="p-2.5 rounded-3 border d-flex align-items-center justify-content-between bg-white shadow-xs" id="card-sonido-celestial">
            <div class="d-flex align-items-center gap-2.5">
              <input class="form-check-input mt-0 cursor-pointer" type="radio" name="radio-sonido-sorpresa" id="radio-celestial" value="celestial" ${tipoSeleccionado === 'celestial' ? 'checked' : ''}>
              <div>
                <label class="fw-bold text-dark small mb-0 d-block cursor-pointer" for="radio-celestial">
                  ✨ 4. Acorde Celestial Ambient
                </label>
                <span class="extra-small text-muted">Apertura suave y envolvente estilo sonido de bienvenida premium. Muy sutil.</span>
              </div>
            </div>
            <button type="button" id="btn-play-celestial" class="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-bold flex-shrink-0">
              <i class="bi bi-play-fill me-1"></i>Escuchar
            </button>
          </div>

          <!-- 5. Fanfarria Anterior (Para Comparar) -->
          <div class="p-2.5 rounded-3 border d-flex align-items-center justify-content-between bg-light shadow-xs" id="card-sonido-fanfarria">
            <div class="d-flex align-items-center gap-2.5">
              <input class="form-check-input mt-0 cursor-pointer" type="radio" name="radio-sonido-sorpresa" id="radio-fanfarria" value="fanfarria" ${tipoSeleccionado === 'fanfarria' ? 'checked' : ''}>
              <div>
                <label class="fw-bold text-secondary small mb-0 d-block cursor-pointer" for="radio-fanfarria">
                  🎺 5. Fanfarria Anterior (Comparativa)
                </label>
                <span class="extra-small text-muted">Fanfarria electrónica original de osciladores rápidos.</span>
              </div>
            </div>
            <button type="button" id="btn-play-fanfarria" class="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 fw-bold flex-shrink-0">
              <i class="bi bi-play-fill me-1"></i>Escuchar
            </button>
          </div>

        </div>

        <!-- Botón Detener -->
        <div class="d-flex justify-content-end">
          <button type="button" id="btn-stop-preview" class="btn btn-sm btn-outline-danger rounded-pill px-3 py-1 fw-bold">
            <i class="bi bi-stop-circle-fill me-1"></i>Detener Reproducción
          </button>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '<i class="bi bi-check2-circle me-1"></i> Establecer como Sonido Oficial',
    cancelButtonText: 'Cerrar',
    confirmButtonColor: '#4f46e5',
    cancelButtonColor: '#64748b',
    didOpen: () => {
      const btnCampanas = document.getElementById('btn-play-campanas');
      const btnArpa = document.getElementById('btn-play-arpa');
      const btnVoz = document.getElementById('btn-play-voz');
      const btnCelestial = document.getElementById('btn-play-celestial');
      const btnFanfarria = document.getElementById('btn-play-fanfarria');
      const btnStop = document.getElementById('btn-stop-preview');

      if (btnCampanas) btnCampanas.onclick = () => reproducirCampanasInstitucionales(false);
      if (btnArpa) btnArpa.onclick = () => reproducirArpaAcogedora(false);
      if (btnVoz) btnVoz.onclick = () => {
        let docPrueba: any = { nombre_completo: 'Luis', rol: 'Docente', sexo: 'Masculino' };
        try {
          const raw = localStorage.getItem('usuario_sigae');
          if (raw) {
            const u = JSON.parse(raw);
            let sexoU = u.sexo || u.genero || '';
            const targetCed = u.cedula || u.usuario || '';
            if (!sexoU && targetCed) {
              const expDemo = localStorage.getItem(`sigae_expediente_demo_${targetCed}`);
              if (expDemo) {
                const parsed = JSON.parse(expDemo);
                if (parsed.sexo) sexoU = parsed.sexo;
              }
            }
            docPrueba = {
              nombre_completo: u.nombre_completo || u.nombre || 'Luis',
              rol: u.rol || 'Docente',
              sexo: sexoU || 'Masculino'
            };
          }
        } catch (e) { }
        reproducirVozBienvenida(false, docPrueba);
      };
      if (btnCelestial) btnCelestial.onclick = () => reproducirAcordeCelestial(false);
      if (btnFanfarria) btnFanfarria.onclick = () => reproducirFanfarriaCelebracion(false);
      if (btnStop) btnStop.onclick = () => detenerTodosLosSonidos();
    },
    willClose: () => {
      detenerTodosLosSonidos();
    },
    preConfirm: () => {
      const radios = document.getElementsByName('radio-sonido-sorpresa') as NodeListOf<HTMLInputElement>;
      let val: TipoSonidoSorpresa = 'campanas';
      radios.forEach(r => {
        if (r.checked) val = r.value as TipoSonidoSorpresa;
      });
      return val;
    }
  }).then((res: any) => {
    detenerTodosLosSonidos();
    if (res.isConfirmed && res.value) {
      const nuevaCfg: ConfigSorpresaAsignacion = {
        ...cfgActual,
        tipoSonido: res.value
      };
      guardarConfigSorpresa(nuevaCfg);
      auditar('Personal', 'Cambiar Sonido Sorpresa', `Estableció audio: ${res.value}`);

      Swal.fire({
        icon: 'success',
        title: '¡Sonido Institucional Establecido!',
        text: `El estilo "${res.value}" ha quedado guardado como el audio oficial para la bienvenida del personal.`,
        confirmButtonColor: '#4f46e5',
        timer: 2500,
        showConfirmButton: false
      });

      if (onSeleccionado) onSeleccionado(res.value);
    }
  });
};

export const abrirModalParametrizarSorpresa = async (Swal: any, onGuardado?: () => void) => {
  if (!Swal) return;
  const cfgActual = await cargarConfigSorpresaGlobal();
  const hoyStr = getFechaHoyLocal();

  const calcularEstado = (hab: boolean, ini?: string, fin?: string) => {
    if (!hab) {
      return {
        clase: 'bg-secondary bg-opacity-10 border-secondary text-secondary',
        icono: 'bi-pause-circle-fill',
        titulo: '🔴 Campaña Bloqueada / Desactivada',
        subtitulo: 'El interruptor general está apagado. Ningún funcionario verá la notificación sorpresa.'
      };
    }
    if (ini && hoyStr < ini) {
      return {
        clase: 'bg-warning bg-opacity-10 border-warning text-dark',
        icono: 'bi-clock-history text-warning',
        titulo: '🟡 Campaña Bloqueada (Programada)',
        subtitulo: `Iniciará el ${ini}. Actualmente bloqueada para todo el personal.`
      };
    }
    if (fin && hoyStr > fin) {
      return {
        clase: 'bg-danger bg-opacity-10 border-danger text-danger',
        icono: 'bi-lock-fill',
        titulo: '🔴 Campaña Bloqueada / Caducada por Fecha',
        subtitulo: `La fecha límite fue el ${fin}. Ya venció y permanece bloqueada.`
      };
    }
    return {
      clase: 'bg-success bg-opacity-10 border-success text-success',
      icono: 'bi-check-circle-fill',
      titulo: '🟢 Campaña Vigente y Activa',
      subtitulo: `Hoy (${hoyStr}) se encuentra dentro del rango de vigencia oficial.`
    };
  };

  const stInicial = calcularEstado(cfgActual.habilitado, cfgActual.fechaInicio, cfgActual.fechaFin);

  Swal.fire({
    title: '<div class="d-flex align-items-center justify-content-center gap-2 text-dark"><i class="bi bi-sliders text-primary"></i> <span class="fw-bold">Parametrizar Notificación Sorpresa (2026 - 2027)</span></div>',
    width: '680px',
    html: `
      <div class="text-start">
        <p class="small text-muted mb-3">
          Configure cómo y con qué frecuencia se presentará la plantilla de asignación a todo el personal docente y administrativo en la plataforma:
        </p>

        <!-- Indicador de Estado en Tiempo Real -->
        <div id="cfg-sorpresa-status-box" class="p-3 rounded-3 border mb-3 d-flex align-items-center gap-3 ${stInicial.clase}">
          <i id="cfg-sorpresa-status-icon" class="bi ${stInicial.icono} fs-3"></i>
          <div>
            <div id="cfg-sorpresa-status-title" class="fw-bold small text-uppercase">${stInicial.titulo}</div>
            <div id="cfg-sorpresa-status-sub" class="extra-small">${stInicial.subtitulo}</div>
          </div>
        </div>

        <!-- Estado General -->
        <div class="p-3 bg-light rounded-3 border mb-3 d-flex align-items-center justify-content-between">
          <div>
            <label class="fw-bold text-dark small mb-0 d-block">Estado de la Campaña de Bienvenida:</label>
            <span class="extra-small text-muted">Activar o pausar la ventana emergente sorpresa para el personal</span>
          </div>
          <div class="form-check form-switch fs-5 mb-0">
            <input class="form-check-input" type="checkbox" id="cfg-sorpresa-habilitado" ${cfgActual.habilitado ? 'checked' : ''} style="cursor: pointer;">
          </div>
        </div>

        <!-- Rango de Fechas (Vigencia Oficial de la Campaña) -->
        <div class="p-3 bg-light rounded-3 border mb-3">
          <label class="fw-bold text-dark small mb-1 d-block">
            <i class="bi bi-calendar2-range-fill text-primary me-1"></i>Vigencia Oficial de la Campaña (Inicio y Cierre):
          </label>
          <span class="extra-small text-muted d-block mb-2">
            Fuera de estas fechas, la notificación sorpresa permanecerá automáticamente <b>bloqueada</b> para todo el personal.
          </span>
          <div class="row g-2">
            <div class="col-6">
              <label class="form-label extra-small fw-bold text-muted mb-1">Fecha de Inicio:</label>
              <input type="date" id="cfg-sorpresa-fecha-inicio" class="form-control form-control-sm rounded-3" value="${cfgActual.fechaInicio || '2026-09-01'}">
            </div>
            <div class="col-6">
              <label class="form-label extra-small fw-bold text-muted mb-1">Fecha de Finalización:</label>
              <input type="date" id="cfg-sorpresa-fecha-fin" class="form-control form-control-sm rounded-3" value="${cfgActual.fechaFin || '2026-10-31'}">
            </div>
          </div>
        </div>

        <!-- Efectos de Sonido y Selección de Audio -->
        <div class="p-3 bg-light rounded-3 border mb-3">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <div>
              <label class="fw-bold text-dark small mb-0 d-block"><i class="bi bi-volume-up-fill text-info me-1"></i>Efectos de Sonido Institucional:</label>
              <span class="extra-small text-muted">Reproducir audio de bienvenida al abrirse la sorpresa</span>
            </div>
            <div class="form-check form-switch fs-5 mb-0">
              <input class="form-check-input" type="checkbox" id="cfg-sorpresa-sonido" ${cfgActual.conSonido !== false ? 'checked' : ''} style="cursor: pointer;">
            </div>
          </div>

          <div class="row g-2 align-items-center pt-2 border-top">
            <div class="col-12 col-md-7">
              <label class="extra-small fw-bold text-muted mb-1 d-block">Estilo de Audio:</label>
              <select id="cfg-sorpresa-tipo-sonido" class="form-select form-select-sm rounded-3">
                <option value="campanas" ${cfgActual.tipoSonido === 'campanas' || !cfgActual.tipoSonido ? 'selected' : ''}>🔔 Campanas Institucionales (Suave y sobrio)</option>
                <option value="arpa" ${cfgActual.tipoSonido === 'arpa' ? 'selected' : ''}>🎵 Arpa y Acorde Acústico (Cálido y acogedor)</option>
                <option value="voz" ${cfgActual.tipoSonido === 'voz' ? 'selected' : ''}>🤖 Voz de la IA Sigma (Asistente Virtual SIGAE)</option>
                <option value="celestial" ${cfgActual.tipoSonido === 'celestial' ? 'selected' : ''}>✨ Acorde Celestial Ambient (Envolvente)</option>
                <option value="fanfarria" ${cfgActual.tipoSonido === 'fanfarria' ? 'selected' : ''}>🎺 Fanfarria Anterior (Comparativa)</option>
              </select>
            </div>
            <div class="col-12 col-md-5 d-flex align-items-end pt-md-3">
              <button type="button" id="btn-probar-audios-modal" class="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-bold w-100">
                <i class="bi bi-soundwave me-1"></i>Probar Uno a Uno
              </button>
            </div>
          </div>
        </div>

        <!-- Frecuencia de Aparición -->
        <div class="mb-3">
          <label class="form-label fw-bold small text-dark mb-1">
            <i class="bi bi-clock-history me-1 text-primary"></i>Frecuencia de Aparición al Ingresar:
          </label>
          <span class="extra-small text-muted d-block mb-1">
            Aplica únicamente mientras la campaña se encuentre dentro de las fechas vigentes:
          </span>
          <select id="cfg-sorpresa-frecuencia" class="form-select form-select-sm rounded-3">
            <option value="solo_primera_vez" ${cfgActual.modoFrecuencia === 'solo_primera_vez' || cfgActual.modoFrecuencia === 'rango_fechas' ? 'selected' : ''}>
              🌟 Solo una vez (Al primer ingreso / hasta confirmar lectura)
            </option>
            <option value="una_vez_al_dia" ${cfgActual.modoFrecuencia === 'una_vez_al_dia' ? 'selected' : ''}>
              📅 Una vez al día por cada funcionario
            </option>
            <option value="siempre" ${cfgActual.modoFrecuencia === 'siempre' ? 'selected' : ''}>
              🔁 En cada ingreso al sistema (Cada vez que entre cualquier personal)
            </option>
          </select>
        </div>

        <!-- Mensaje de la Dirección -->
        <div class="mb-3">
          <label class="form-label fw-bold small text-dark mb-1">
            <i class="bi bi-chat-quote-fill me-1 text-warning"></i>Mensaje Motivacional de la Dirección:
          </label>
          <textarea id="cfg-sorpresa-mensaje" class="form-control form-control-sm rounded-3" rows="3" placeholder="Mensaje de bienvenida...">${cfgActual.mensajePersonalizado || ''}</textarea>
        </div>

        <!-- Botón para Restablecer Confirmaciones -->
        <div class="p-2.5 bg-warning bg-opacity-10 border border-warning border-opacity-50 rounded-3 d-flex align-items-center justify-content-between">
          <div>
            <span class="fw-bold text-dark extra-small d-block">¿Hizo cambios en los salones y desea que todos la vuelvan a ver?</span>
            <span class="extra-small text-muted">Restablece los contadores de visualización para todo el personal</span>
          </div>
          <button type="button" id="btn-reset-vistos" class="btn btn-xs btn-outline-dark rounded-pill px-3 py-1 fw-bold">
            <i class="bi bi-arrow-counterclockwise me-1"></i>Reiniciar
          </button>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '<i class="bi bi-check-lg me-1"></i> Guardar Parámetros',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#4f46e5',
    cancelButtonColor: '#64748b',
    didOpen: () => {
      const btnReset = document.getElementById('btn-reset-vistos');
      const btnProbarAudios = document.getElementById('btn-probar-audios-modal');
      const selectTipoSonido = document.getElementById('cfg-sorpresa-tipo-sonido') as HTMLSelectElement;
      const inputHabilitado = document.getElementById('cfg-sorpresa-habilitado') as HTMLInputElement;
      const inputInicio = document.getElementById('cfg-sorpresa-fecha-inicio') as HTMLInputElement;
      const inputFin = document.getElementById('cfg-sorpresa-fecha-fin') as HTMLInputElement;

      const refrescarEstadoLive = () => {
        const hab = inputHabilitado ? inputHabilitado.checked : true;
        const ini = inputInicio ? inputInicio.value : '';
        const fin = inputFin ? inputFin.value : '';
        const st = calcularEstado(hab, ini, fin);

        const box = document.getElementById('cfg-sorpresa-status-box');
        const icon = document.getElementById('cfg-sorpresa-status-icon');
        const title = document.getElementById('cfg-sorpresa-status-title');
        const sub = document.getElementById('cfg-sorpresa-status-sub');

        if (box && icon && title && sub) {
          box.className = `p-3 rounded-3 border mb-3 d-flex align-items-center gap-3 ${st.clase}`;
          icon.className = `bi ${st.icono} fs-3`;
          title.innerText = st.titulo;
          sub.innerText = st.subtitulo;
        }
      };

      if (inputHabilitado) inputHabilitado.onchange = refrescarEstadoLive;
      if (inputInicio) inputInicio.oninput = refrescarEstadoLive;
      if (inputFin) inputFin.oninput = refrescarEstadoLive;

      if (btnProbarAudios) {
        btnProbarAudios.onclick = () => {
          abrirModalProbarSonidos(Swal, (tipo) => {
            if (selectTipoSonido) selectTipoSonido.value = tipo;
          });
        };
      }

      if (btnReset) {
        btnReset.onclick = () => {
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && (k.startsWith('sigae_asignacion_vista_2026_2027_') || k.startsWith('sigae_asignacion_fecha_vista_'))) {
              keysToRemove.push(k);
            }
          }
          keysToRemove.forEach(k => localStorage.removeItem(k));
          auditar('Personal', 'Reiniciar Vistas Sorpresa', 'Restableció contadores de visualización de la sorpresa de asignación 2026-2027');
          btnReset.innerHTML = '<i class="bi bi-check2 me-1 text-success"></i>¡Reiniciado!';
          btnReset.classList.remove('btn-outline-dark');
          btnReset.classList.add('btn-success', 'text-white');
        };
      }
    },
    willClose: () => {
      detenerTodosLosSonidos();
    },
    preConfirm: () => {
      const habilitado = (document.getElementById('cfg-sorpresa-habilitado') as HTMLInputElement)?.checked ?? true;
      const conSonido = (document.getElementById('cfg-sorpresa-sonido') as HTMLInputElement)?.checked ?? true;
      const tipoSonido = ((document.getElementById('cfg-sorpresa-tipo-sonido') as HTMLSelectElement)?.value as TipoSonidoSorpresa) || 'campanas';
      const modoFrecuencia = ((document.getElementById('cfg-sorpresa-frecuencia') as HTMLSelectElement)?.value as any) || 'solo_primera_vez';
      const fechaInicio = (document.getElementById('cfg-sorpresa-fecha-inicio') as HTMLInputElement)?.value;
      const fechaFin = (document.getElementById('cfg-sorpresa-fecha-fin') as HTMLInputElement)?.value;
      const mensajePersonalizado = (document.getElementById('cfg-sorpresa-mensaje') as HTMLTextAreaElement)?.value;

      return {
        habilitado,
        conSonido,
        tipoSonido,
        modoFrecuencia,
        fechaInicio,
        fechaFin,
        mensajePersonalizado: mensajePersonalizado?.trim() || cfgActual.mensajePersonalizado
      };
    }
  }).then(async (res: any) => {
    if (res.isConfirmed && res.value) {
      await guardarConfigSorpresa(res.value);
      auditar('Personal', 'Parametrizar Sorpresa Asignación', `Configuró habilitado: ${res.value.habilitado}, rango: ${res.value.fechaInicio} al ${res.value.fechaFin}, frecuencia: ${res.value.modoFrecuencia}`);
      Swal.fire({
        icon: 'success',
        title: '¡Parámetros Guardados y Sincronizados!',
        text: 'La configuración de la notificación sorpresa ha sido guardada en la base de datos oficial.',
        confirmButtonColor: '#4f46e5'
      });
      if (onGuardado) onGuardado();
    }
  });
};

interface ModalAsignacionSorpresaProps {
  forzarApertura?: boolean;
  cedulaSimulada?: string;
  onClose?: () => void;
}

export const ModalAsignacionSorpresa: React.FC<ModalAsignacionSorpresaProps> = ({
  forzarApertura = false,
  cedulaSimulada,
  onClose
}) => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [datosAsignacion, setDatosAsignacion] = useState<any>(null);
  const periodoActivo = '2026 - 2027';
  const [escuelaInfo, setEscuelaInfo] = useState<any>(null);
  const [configActual, setConfigActual] = useState<ConfigSorpresaAsignacion>(obtenerConfigSorpresa());
  const [silenciado, setSilenciado] = useState<boolean>(() => {
    return localStorage.getItem('sigae_sorpresa_mute') === 'true';
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  const Swal = (window as any).Swal;
  const html2pdf = (window as any).html2pdf;

  const usuarioLocalStr = localStorage.getItem('usuario_sigae');
  const usuarioSesion = usuarioLocalStr ? JSON.parse(usuarioLocalStr) : null;
  const targetCedula = cedulaSimulada || usuarioSesion?.cedula || usuarioSesion?.usuario || '';
  const rolUsuario = usuarioSesion?.rol || '';

  useEffect(() => {
    let cancelado = false;

    const verificarYMostrar = async () => {
      // 1. Cargar configuración actualizada (BD Supabase + LocalStorage)
      const config = await cargarConfigSorpresaGlobal();
      if (cancelado) return;
      setConfigActual(config);

      if (!forzarApertura) {
        // A. Si está inhabilitada en la parametrización -> BLOQUEADA
        if (!config.habilitado) {
          console.log('[Sorpresa] Campaña inhabilitada manualmente en la parametrización.');
          return;
        }

        // B. Solo para personal escolar (docentes, directivos, administrativos, obreros)
        const rolLower = (rolUsuario || '').toLowerCase();
        const esPersonal = rolLower.includes('docente') ||
          rolLower.includes('profesor') ||
          rolLower.includes('maestr') ||
          rolLower.includes('direct') ||
          rolLower.includes('coordinad') ||
          rolLower.includes('administra') ||
          rolLower.includes('obrero') ||
          rolLower.includes('especialista') ||
          rolLower.includes('control') ||
          rolLower.includes('secretar') ||
          rolLower.includes('subdirector');

        if (!esPersonal) return;

        // C. VIGENCIA DE LA CAMPAÑA (BLOQUEO ESTRICTO POR FECHAS)
        // La fecha de inicio y fin determina si la campaña está activa o bloqueada.
        const hoyStr = getFechaHoyLocal();

        if (config.fechaInicio && hoyStr < config.fechaInicio) {
          console.log(`[Sorpresa] Campaña bloqueada por fecha: hoy (${hoyStr}) es anterior a inicio (${config.fechaInicio}).`);
          return;
        }

        if (config.fechaFin && hoyStr > config.fechaFin) {
          console.log(`[Sorpresa] Campaña bloqueada por fecha: hoy (${hoyStr}) es posterior a fin (${config.fechaFin}).`);
          return;
        }

        // D. Control de Frecuencia dentro del período de vigencia
        if (config.modoFrecuencia === 'solo_primera_vez' || config.modoFrecuencia === 'rango_fechas') {
          const storageKey = `sigae_asignacion_vista_2026_2027_${targetCedula}`;
          const yaVisto = localStorage.getItem(storageKey);
          if (yaVisto === 'true') return;
        } else if (config.modoFrecuencia === 'una_vez_al_dia') {
          const storageKeyFecha = `sigae_asignacion_fecha_vista_${targetCedula}`;
          const ultimaFecha = localStorage.getItem(storageKeyFecha);
          if (ultimaFecha === hoyStr) return;
        }
      }

      if (!cancelado) {
        cargarDatosAsignacion();
      }
    };

    verificarYMostrar();

    const handleConfigActualizada = (e: any) => {
      if (e.detail && !cancelado) {
        setConfigActual(e.detail);
      }
    };
    window.addEventListener('sigae-config-sorpresa-actualizada', handleConfigActualizada);

    return () => {
      cancelado = true;
      window.removeEventListener('sigae-config-sorpresa-actualizada', handleConfigActualizada);
    };
  }, [forzarApertura, targetCedula, rolUsuario]);

  const cargarDatosAsignacion = async () => {
    setLoading(true);
    try {
      let usuarioData = usuarioSesion;
      if (targetCedula) {
        const { data: usr } = await supabase
          .from('usuarios')
          .select('*')
          .eq('cedula', targetCedula)
          .maybeSingle();
        if (usr) usuarioData = usr;
      }

      if (usuarioData && targetCedula) {
        let sexoExp = usuarioData.sexo || usuarioData.genero || '';
        try {
          const { data: expDoc } = await supabase
            .from('expedientes_docentes')
            .select('sexo')
            .eq('usuario_cedula', targetCedula)
            .maybeSingle();
          if (expDoc?.sexo) {
            sexoExp = expDoc.sexo;
          }
        } catch (e) { }

        if (!sexoExp) {
          try {
            const rawDemo = localStorage.getItem(`sigae_expediente_demo_${targetCedula}`);
            if (rawDemo) {
              const pDemo = JSON.parse(rawDemo);
              if (pDemo.sexo) sexoExp = pDemo.sexo;
            }
          } catch (e) { }
        }
        usuarioData = { ...usuarioData, sexo: sexoExp };
      }

      if (!usuarioData) {
        setLoading(false);
        return;
      }

      const escCodigo = usuarioData.id_escuela || localStorage.getItem('sigae_escuela_codigo') || 'sb';

      const { data: escData } = await supabase
        .from('perfil_escuela')
        .select('*')
        .eq('id_escuela', escCodigo)
        .maybeSingle();
      setEscuelaInfo(escData);

      const { data: salonesData } = await supabase.from('salones').select('*');
      const { data: espaciosData } = await supabase.from('espacios_fisicos').select('*');
      const { data: estudiantesData } = await supabase.from('estudiantes_vinculaciones').select('*');
      const { data: docentesData } = await supabase.from('usuarios').select('cedula, nombre_completo, telefono, email, cargo, rol');

      // 1. Salones
      const misSalones: any[] = [];
      if (salonesData && salonesData.length > 0) {
        salonesData.forEach(sal => {
          const guias: string[] = sal.docentes_guias || [];
          if (guias.includes(targetCedula)) {
            const espacioAsig = (espaciosData || []).find(e => e.id === sal.id_espacio);
            const totalEstudiantes = (estudiantesData || []).filter(e =>
              e.codigo_escuela === sal.id_escuela &&
              (e.grado_actual || '').toLowerCase() === (sal.grado_anio || '').toLowerCase() &&
              (e.seccion_actual || '').toUpperCase() === (sal.seccion || '').toUpperCase()
            ).length;

            const idxEnGuia = guias.indexOf(targetCedula);
            const rolEnAula = idxEnGuia === 0 ? 'Docente Titular' : 'Docente Auxiliar / Co-Docente';

            const ciColega = guias.find(ci => ci !== targetCedula);
            const docColega = ciColega ? (docentesData || []).find(d => d.cedula === ciColega) : null;

            misSalones.push({
              ...sal,
              espacio: espacioAsig,
              totalEstudiantes: totalEstudiantes,
              rolEnAula: rolEnAula,
              colega: docColega ? docColega.nombre_completo : ciColega ? `C.I. ${ciColega}` : 'Titular Único'
            });
          }
        });
      }

      // 2. Especialistas y Responsabilidades Asignadas (Castellano, Inglés, Educación Física, etc.)
      let respList: any[] = [];
      try {
        const { data: respData } = await supabase.from('responsabilidades_docentes').select('*');
        if (respData && respData.length > 0) respList = respData;
      } catch (e) { }
      if (respList.length === 0) {
        const localResp = localStorage.getItem('sigae_responsabilidades_docentes');
        if (localResp) respList = JSON.parse(localResp);
      }

      const misEspecialidades: any[] = [];
      if (respList && respList.length > 0) {
        respList.forEach((r: any) => {
          const docs: string[] = Array.isArray(r.docentes_asignados) ? r.docentes_asignados : [];
          if (docs.includes(targetCedula)) {
            misEspecialidades.push({
              nombre: r.nombre_responsabilidad,
              categoria: r.categoria || 'Área de Formación / Especialista',
              nivel: r.nivel_educativo || 'Educación Media General',
              grados: Array.isArray(r.grados_atendidos) ? r.grados_atendidos : [],
              horas: r.horas_semanales || 0,
              observaciones: r.observaciones || ''
            });
          }
        });
      }

      // 3. Colectivos / Brigadas
      const { data: colectivosData } = await supabase.from('colectivos').select('*');
      const misColectivos: any[] = [];
      if (colectivosData && colectivosData.length > 0) {
        colectivosData.forEach(col => {
          const esVocero = String(col.vocero_cedula || '').trim() === String(targetCedula).trim();
          const miembros: any[] = Array.isArray(col.miembros) ? col.miembros : [];
          const esMiembro = miembros.some((m: any) => {
            if (typeof m === 'string') return m.trim() === targetCedula.trim();
            return String(m.cedula || m.ci || '').trim() === targetCedula.trim();
          });

          if (esVocero || esMiembro) {
            misColectivos.push({
              nombre: col.nombre,
              categoria: col.categoria || 'Colectivo Pedagógico',
              rol: esVocero ? '👑 Vocero(a) Principal' : '🤝 Miembro Integrante',
              descripcion: col.descripcion || 'Comité Institucional'
            });
          }
        });
      }

      // 4. Organigrama
      const { data: cargosData } = await supabase.from('cargos').select('*');
      let miPuestoOrganigrama: any = null;
      if (cargosData && cargosData.length > 0) {
        const nombreCargo = usuarioData.cargo || usuarioData.rol || '';
        const cargoEncontrado = cargosData.find(c =>
          c.nombre_cargo.toLowerCase().trim() === nombreCargo.toLowerCase().trim() ||
          nombreCargo.toLowerCase().includes(c.nombre_cargo.toLowerCase()) ||
          c.nombre_cargo.toLowerCase().includes(nombreCargo.toLowerCase())
        ) || cargosData.find(c => c.tipo_cargo?.toLowerCase().includes('docen') && usuarioData.rol?.toLowerCase().includes('docen'));

        if (cargoEncontrado) {
          const supervisor = cargoEncontrado.depende_de
            ? cargosData.find(c => c.id_cargo === cargoEncontrado.depende_de)
            : null;

          const subordinados = cargosData.filter(c => c.depende_de === cargoEncontrado.id_cargo);

          miPuestoOrganigrama = {
            cargoOficial: cargoEncontrado.nombre_cargo,
            tipoCargo: cargoEncontrado.tipo_cargo || 'Personal Escolar',
            descripcion: cargoEncontrado.descripcion || 'Puesto en Estructura Institucional',
            supervisor: supervisor ? supervisor.nombre_cargo : '👑 Máxima Autoridad (Puesto Raíz)',
            subordinadosCount: subordinados.length
          };
        }
      }

      if (!miPuestoOrganigrama) {
        miPuestoOrganigrama = {
          cargoOficial: usuarioData.cargo || usuarioData.rol || 'Docente de Aula',
          tipoCargo: usuarioData.rol || 'Personal Académico',
          descripcion: 'Estructura Organizacional del Plantel',
          supervisor: 'Dirección del Plantel',
          subordinadosCount: 0
        };
      }

      setDatosAsignacion({
        usuario: usuarioData,
        salones: misSalones,
        especialidades: misEspecialidades,
        colectivos: misColectivos,
        organigrama: miPuestoOrganigrama,
        escuelaCodigo: escCodigo
      });

      setVisible(true);
      setLoading(false);

      iniciarAnimacionCelebracionAvanzada();
      if (configActual.conSonido !== false && !silenciado) {
        reproducirSonidoPorTipo(configActual.tipoSonido || 'campanas', false, usuarioData);
      }
    } catch (err) {
      console.error('Error cargando asignación:', err);
      setLoading(false);
    }
  };

  const toggleSilenciar = () => {
    const nuevo = !silenciado;
    setSilenciado(nuevo);
    localStorage.setItem('sigae_sorpresa_mute', String(nuevo));
    if (!nuevo) {
      reproducirSonidoPorTipo(configActual.tipoSonido || 'campanas', false, datosAsignacion?.usuario);
    }
  };

  const iniciarAnimacionCelebracionAvanzada = () => {
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const colors = ['#f59e0b', '#fbbf24', '#06b6d4', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#ef4444', '#ffd700'];

      const confetti: any[] = [];
      for (let i = 0; i < 150; i++) {
        confetti.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          w: Math.random() * 10 + 6,
          h: Math.random() * 6 + 4,
          speedY: Math.random() * 3.5 + 2.5,
          speedX: Math.random() * 2.5 - 1.25,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotSpeed: Math.random() * 8 - 4,
          flipSpeed: Math.random() * 0.15 + 0.05,
          flip: 0
        });
      }

      const fireworks: any[] = [];
      const createExplosion = (x: number, y: number) => {
        const color = colors[Math.floor(Math.random() * colors.length)];
        for (let i = 0; i < 35; i++) {
          const angle = (Math.PI * 2 * i) / 35;
          const speed = Math.random() * 4 + 2;
          fireworks.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            size: Math.random() * 3 + 2,
            color
          });
        }
      };

      createExplosion(canvas.width * 0.2, canvas.height * 0.25);
      createExplosion(canvas.width * 0.8, canvas.height * 0.25);

      setTimeout(() => {
        if (canvas) createExplosion(canvas.width * 0.35, canvas.height * 0.2);
        if (canvas) createExplosion(canvas.width * 0.65, canvas.height * 0.2);
      }, 700);

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        confetti.forEach(p => {
          p.y += p.speedY;
          p.x += p.speedX;
          p.rotation += p.rotSpeed;
          p.flip += p.flipSpeed;

          if (p.y > canvas.height) {
            p.y = -15;
            p.x = Math.random() * canvas.width;
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.scale(Math.cos(p.flip), 1);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        });

        for (let i = fireworks.length - 1; i >= 0; i--) {
          const f = fireworks[i];
          f.x += f.vx;
          f.y += f.vy;
          f.vy += 0.05;
          f.alpha -= 0.016;

          if (f.alpha <= 0) {
            fireworks.splice(i, 1);
          } else {
            ctx.save();
            ctx.globalAlpha = f.alpha;
            ctx.fillStyle = f.color;
            ctx.shadowBlur = 8;
            ctx.shadowColor = f.color;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        animRef.current = requestAnimationFrame(animate);
      };

      animate();

      setTimeout(() => {
        if (animRef.current) cancelAnimationFrame(animRef.current);
        if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }, 10000);
    }, 120);
  };

  const handleConfirmarYContinuar = () => {
    reproducirChimeExito(silenciado);
    const hoyStr = new Date().toISOString().split('T')[0];
    const storageKey = `sigae_asignacion_vista_2026_2027_${targetCedula}`;
    const storageKeyFecha = `sigae_asignacion_fecha_vista_${targetCedula}`;
    localStorage.setItem(storageKey, 'true');
    localStorage.setItem(storageKeyFecha, hoyStr);
    auditar('Personal', 'Confirmar Asignación', `Confirmó recepción de asignación oficial año escolar ${periodoActivo}`);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setVisible(false);
    if (onClose) onClose();
  };

  const exportarFichaPDF = () => {
    reproducirChimeExito(silenciado);
    if (!html2pdf) {
      if (Swal) Swal.fire('Aviso', 'Motor de PDF no disponible en este momento.', 'warning');
      return;
    }

    const u = datosAsignacion?.usuario || usuarioSesion;
    const escNom = escuelaInfo?.nombre_institucion || (datosAsignacion?.escuelaCodigo === 'sb' ? 'U.E. "SANTA BÁRBARA"' : 'U.E. "LIBERTADOR BOLÍVAR"');
    const escLogo = `/assets/img/logo_${datosAsignacion?.escuelaCodigo || 'sb'}.png`;
    const dea = escuelaInfo?.codigo_dea || 'S/N';
    const rif = escuelaInfo?.rif || 'S/N';
    const fecha = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });
    const org = datosAsignacion?.organigrama;

    let detalleSalonesHtml = '';
    if (datosAsignacion?.salones && datosAsignacion.salones.length > 0) {
      detalleSalonesHtml = datosAsignacion.salones.map((s: any, idx: number) => `
        <tr style="border-bottom: 1px solid #cbd5e1; font-size: 11px;">
          <td style="padding: 7px; font-weight: bold; text-align: center;">${idx + 1}</td>
          <td style="padding: 7px; font-weight: 700; color: #0284c7;">${s.nombre_salon}</td>
          <td style="padding: 7px; text-align: center;">${s.nivel_educativo}</td>
          <td style="padding: 7px; text-align: center; font-weight: 600;">${s.grado_anio} - Sec. "${s.seccion}"</td>
          <td style="padding: 7px; text-align: center;"><span style="color: #059669; font-weight: bold;">${s.rolEnAula}</span></td>
          <td style="padding: 7px;">${s.espacio ? s.espacio.nombre : 'Aula General'}</td>
          <td style="padding: 7px;">${s.colega || 'Titular Único'}</td>
        </tr>
      `).join('');
    } else {
      detalleSalonesHtml = `
        <tr>
          <td colspan="7" style="padding: 10px; text-align: center; color: #64748b; font-style: italic;">
            Asignación en Funciones Institucionales / Administrativas / Colectivos Pedagógicos
          </td>
        </tr>
      `;
    }

    let detalleEspecialidadesHtml = '';
    if (datosAsignacion?.especialidades && datosAsignacion.especialidades.length > 0) {
      detalleEspecialidadesHtml = `
        <div style="margin-top: 12px; margin-bottom: 12px;">
          <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #1e293b; margin-bottom: 5px;">
            Especialidades y Áreas de Formación Asignadas
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
            <thead>
              <tr style="background: #0284c7; color: #ffffff; font-size: 9.5px; text-transform: uppercase;">
                <th style="padding: 6px; text-align: left;">Especialidad / Asignatura</th>
                <th style="padding: 6px; text-align: center;">Nivel Educativo</th>
                <th style="padding: 6px; text-align: left;">Grados / Años Atendidos</th>
                <th style="padding: 6px; text-align: center;">Horas Semanales</th>
              </tr>
            </thead>
            <tbody>
              ${datosAsignacion.especialidades.map((e: any) => `
                <tr style="border-bottom: 1px solid #cbd5e1; font-size: 10.5px;">
                  <td style="padding: 6px; font-weight: 700; color: #0284c7;">${e.nombre}</td>
                  <td style="padding: 6px; text-align: center;">${e.nivel}</td>
                  <td style="padding: 6px;">${(e.grados || []).join(', ') || 'Todos los Grados'}</td>
                  <td style="padding: 6px; text-align: center; font-weight: bold;">${e.horas || 0} hrs</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    let detalleColectivosHtml = '';
    if (datosAsignacion?.colectivos && datosAsignacion.colectivos.length > 0) {
      detalleColectivosHtml = `
        <div style="margin-top: 12px; margin-bottom: 15px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #1e293b; margin-bottom: 5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;">
            Colectivos Pedagógicos y Comités Institucionales
          </div>
          <ul style="margin: 0; padding-left: 20px; font-size: 11px; color: #334155;">
            ${datosAsignacion.colectivos.map((c: any) => `<li><b>${c.nombre}</b> (${c.categoria}): <span style="color: #0284c7; font-weight: 600;">${c.rol}</span></li>`).join('')}
          </ul>
        </div>
      `;
    }

    const template = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; padding: 25px 30px; background: #ffffff;">
        <!-- Membrete Oficial MPPE -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 10px; margin-bottom: 14px;">
          <img src="${escLogo}" alt="Logo Escuela" style="height: 55px; object-fit: contain;" />
          <div style="text-align: center; flex-grow: 1; padding: 0 12px;">
            <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">República Bolivariana de Venezuela</div>
            <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b;">Ministerio del Poder Popular para la Educación</div>
            <div style="font-size: 14px; font-weight: 900; color: #0f172a; margin-top: 2px;">${escNom}</div>
            <div style="font-size: 8.5px; color: #64748b;">CÓDIGO DEA: <b>${dea}</b> | R.I.F.: <b>${rif}</b></div>
            <div style="font-size: 11px; font-weight: 800; color: #0284c7; margin-top: 3px; letter-spacing: 0.5px;">FICHA OFICIAL DE ASIGNACIÓN PEDAGÓGICA Y LABORAL</div>
          </div>
          <div style="text-align: right; font-size: 8.5px; color: #64748b; min-width: 100px;">
            <img src="/assets/img/logoMPPE.png" alt="MPPE Logo" style="height: 38px; object-fit: contain; display: block; margin-left: auto; margin-bottom: 2px;" />
            <div><b>Fecha:</b> ${fecha}</div>
            <div><b>Año:</b> ${periodoActivo}</div>
          </div>
        </div>

        <!-- Ficha del Funcionario -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; font-size: 10.5px;">
          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 8px;">
            <div><span style="color: #64748b; display: block; font-size: 8.5px; text-transform: uppercase;">Nombres y Apellidos:</span><b>${u?.nombre_completo || 'Funcionario'}</b></div>
            <div><span style="color: #64748b; display: block; font-size: 8.5px; text-transform: uppercase;">Cédula de Identidad:</span><b>${u?.cedula || '-'}</b></div>
            <div><span style="color: #64748b; display: block; font-size: 8.5px; text-transform: uppercase;">Rol en Plataforma:</span><b>${u?.rol || 'Docente'}</b></div>
            <div><span style="color: #64748b; display: block; font-size: 8.5px; text-transform: uppercase;">Teléfono:</span><b>${u?.telefono ? formatPhoneNumber(u.telefono) : 'No registrado'}</b></div>
          </div>
        </div>

        <!-- Puesto en el Organigrama -->
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; font-size: 10.5px;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #1e40af; margin-bottom: 4px;">
            Estructura Organizacional y Cadena Supervisoria
          </div>
          <div style="display: grid; grid-template-columns: 2fr 2fr; gap: 8px;">
            <div><span style="color: #64748b; display: block; font-size: 8.5px; text-transform: uppercase;">Puesto / Cargo Oficial:</span><b>${org?.cargoOficial}</b> (${org?.tipoCargo})</div>
            <div><span style="color: #64748b; display: block; font-size: 8.5px; text-transform: uppercase;">Línea de Reporte (Supervisor Inmediato):</span><b>${org?.supervisor}</b></div>
          </div>
        </div>

        <!-- Tabla de Asignación de Aulas -->
        <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #1e293b; margin-bottom: 5px;">
          Carga Académica y Salones de Clase Asignados
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
          <thead>
            <tr style="background: #0284c7; color: #ffffff; font-size: 9.5px; text-transform: uppercase;">
              <th style="padding: 6px; text-align: center;">N°</th>
              <th style="padding: 6px; text-align: left;">Salón / Sección</th>
              <th style="padding: 6px; text-align: center;">Nivel</th>
              <th style="padding: 6px; text-align: center;">Grado / Año</th>
              <th style="padding: 6px; text-align: center;">Rol Asignado</th>
              <th style="padding: 6px; text-align: left;">Ambiente Físico</th>
              <th style="padding: 6px; text-align: left;">Docente Acompañante</th>
            </tr>
          </thead>
          <tbody>
            ${detalleSalonesHtml}
          </tbody>
        </table>

        ${detalleEspecialidadesHtml}

        ${detalleColectivosHtml}

        <!-- Cláusula Institucional -->
        <div style="background: #f1f5f9; border-left: 3px solid #0284c7; padding: 8px 12px; border-radius: 4px; font-size: 9.5px; color: #334155; margin-top: 10px; margin-bottom: 25px; line-height: 1.4;">
          <b>Compromiso Institucional:</b> La presente asignación responde a la planificación curricular del Plantel para el Año Escolar <b>${periodoActivo}</b>, en estricto apego a las directrices del Ministerio del Poder Popular para la Educación y el Proyecto Educativo Integral Comunitario (PEIC).
        </div>

        <!-- Firmas y Sellos -->
        <div style="display: flex; justify-content: space-around; margin-top: 30px; text-align: center; font-size: 10.5px;">
          <div style="width: 200px; border-top: 1px solid #475569; padding-top: 5px;">
            <b>${u?.nombre_completo || 'Docente / Personal'}</b>
            <div style="font-size: 8.5px; color: #64748b;">Firma del Funcionario / C.I. ${u?.cedula || ''}</div>
          </div>
          <div style="width: 200px; border-top: 1px solid #475569; padding-top: 5px;">
            <b>Dirección del Plantel</b>
            <div style="font-size: 8.5px; color: #64748b;">Firma y Sello Oficial / ${escNom}</div>
          </div>
        </div>
      </div>
    `;

    const opt = {
      margin: [8, 8, 8, 8],
      filename: `Ficha_Asignacion_2026_2027_${u?.cedula || 'docente'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(template).save();
    auditar('Personal', 'Descargar Ficha Asignación', `Descargó ficha PDF de asignación para ${u?.nombre_completo}`);
  };

  if (!visible || loading || !datosAsignacion) return null;

  const u = datosAsignacion.usuario;
  const escNombre = escuelaInfo?.nombre_institucion || (datosAsignacion.escuelaCodigo === 'sb' ? 'U.E. "Santa Bárbara"' : 'U.E. "Libertador Bolívar"');
  const salonesAsig = datosAsignacion.salones || [];
  const especialidadesAsig = datosAsignacion.especialidades || [];
  const colectivosAsig = datosAsignacion.colectivos || [];
  const organigramaAsig = datosAsignacion.organigrama;

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.88)', zIndex: 1060, backdropFilter: 'blur(10px)' }}
    >
      {/* Canvas de fuegos artificiales y confeti festivo 3D */}
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1061 }}
      />

      <div
        className="modal-dialog modal-dialog-centered modal-lg modal-fullscreen-sm-down m-auto p-2 p-md-0"
        style={{ maxWidth: '860px', width: '100%', zIndex: 1062 }}
      >
        <div
          className="modal-content border-0 rounded-4 shadow-lg overflow-hidden bg-white w-100"
          style={{
            boxShadow: '0 25px 60px -15px rgba(245, 158, 11, 0.45), 0 0 50px rgba(99, 102, 241, 0.35)',
            border: '2px solid rgba(251, 191, 36, 0.4)',
            maxHeight: 'calc(100vh - 20px)'
          }}
        >

          {/* Header Festivo con Logo de la Escuela sobre base Blanca Limpia */}
          <div
            className="p-3 p-md-4 text-white text-center position-relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #0284c7 80%, #0369a1 100%)',
              borderBottom: '4px solid #f59e0b'
            }}
          >
            {/* Logo de la Escuela (Superior Izquierdo - Contenedor Blanco Puro Limpio) */}
            <div
              className="position-absolute top-0 start-0 m-2 m-md-3 p-1.5 bg-white rounded-3 rounded-md-4 shadow-sm d-flex align-items-center justify-content-center"
              style={{
                width: 'clamp(44px, 10vw, 58px)',
                height: 'clamp(44px, 10vw, 58px)',
                zIndex: 1063
              }}
            >
              <img
                src={`/assets/img/logo_${datosAsignacion.escuelaCodigo || 'sb'}.png`}
                alt="Logo Escuela"
                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>

            {/* Controles de Sonido (Superior Derecho) */}
            <div className="position-absolute top-0 end-0 m-2 m-md-3 d-flex align-items-center gap-1.5" style={{ zIndex: 1063 }}>
              <button
                type="button"
                onClick={() => abrirModalProbarSonidos(Swal, (nuevoTipo) => {
                  const nuevaCfg: ConfigSorpresaAsignacion = { ...configActual, tipoSonido: nuevoTipo };
                  setConfigActual(nuevaCfg);
                })}
                className="btn btn-sm btn-light bg-white text-dark rounded-pill px-2.5 px-md-3 py-1 border shadow-xs d-flex align-items-center gap-1"
                title="Probar y elegir estilo de audio de bienvenida"
              >
                <i className="bi bi-music-note-beamed text-primary"></i>
                <span className="extra-small fw-bold d-none d-sm-inline">Probar Audios</span>
              </button>

              <button
                type="button"
                onClick={toggleSilenciar}
                className="btn btn-sm btn-dark bg-opacity-50 text-white rounded-pill px-2.5 px-md-3 py-1 border border-light border-opacity-25 shadow-xs"
                title={silenciado ? 'Activar sonido de celebración' : 'Silenciar sonido'}
              >
                <i className={`bi ${silenciado ? 'bi-volume-mute-fill text-danger' : 'bi-volume-up-fill text-warning'} me-1`}></i>
                <span className="extra-small fw-bold d-none d-sm-inline">{silenciado ? 'Silenciado' : 'Sonido Activo'}</span>
              </button>
            </div>

            <div className="d-flex align-items-center justify-content-center gap-2 mb-1.5 pt-1 px-4">
              <span
                className="badge bg-warning text-dark px-3 py-1 rounded-pill fw-bolder shadow-xs text-uppercase extra-small"
                style={{ letterSpacing: '0.5px' }}
              >
                <i className="bi bi-stars me-1 text-danger"></i>¡Bienvenido(a) al Nuevo Año Escolar {periodoActivo}!
              </span>
            </div>

            <h3 className="fw-bolder mb-1 text-white text-shadow fs-5 fs-md-3 px-2">
              🎉 Asignación Oficial de Responsabilidades
            </h3>
            <p className="text-light opacity-90 extra-small small-md mb-0 font-monospace text-truncate px-2">
              {escNombre} • Ministerio del Poder Popular para la Educación
            </p>
          </div>

          {/* Cuerpo del Modal con Visuales y Tarjetas Ricas */}
          <div
            className="modal-body p-3 p-md-4.5"
            style={{
              maxHeight: '62vh',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch'
            }}
          >

            {/* 1. Saludo y Ficha de Identidad */}
            <div className="d-flex align-items-center gap-2.5 gap-md-3 p-2.5 p-md-3.5 bg-light rounded-4 border mb-3 mb-md-4 shadow-xs">
              <div
                className="rounded-circle bg-gradient text-white d-flex align-items-center justify-content-center fw-bolder shadow-sm flex-shrink-0"
                style={{
                  width: 'clamp(46px, 11vw, 58px)',
                  height: 'clamp(46px, 11vw, 58px)',
                  fontSize: 'clamp(1.1rem, 3.5vw, 1.4rem)',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)'
                }}
              >
                {u.nombre_completo ? u.nombre_completo.charAt(0) : 'P'}
              </div>
              <div className="flex-grow-1 overflow-hidden">
                <div className="extra-small text-muted text-uppercase fw-bold">Personal Docente / Funcionario</div>
                <h6 className="fw-bolder text-dark mb-0 text-truncate fs-6">{u.nombre_completo}</h6>
                <div className="d-flex align-items-center gap-1.5 flex-wrap mt-1">
                  <span className="badge bg-white text-dark border extra-small">C.I. {u.cedula}</span>
                  <span className="badge bg-primary bg-opacity-10 text-primary fw-bold extra-small text-truncate">
                    <i className="bi bi-shield-lock me-1"></i>Rol en Sistema: {u.rol || 'Docente'}
                  </span>
                  <span className="badge bg-warning bg-opacity-20 text-dark fw-bold extra-small">
                    <i className="bi bi-calendar-check me-1 text-warning"></i>Período {periodoActivo}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Puesto en el Organigrama y Cadena Supervisoria */}
            <div className="card border-0 bg-light rounded-4 p-3 p-md-3.5 mb-3 mb-md-4 shadow-xs">
              <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-1">
                <span className="fw-bolder extra-small small-md text-dark text-uppercase d-flex align-items-center gap-1.5">
                  <i className="bi bi-diagram-3-fill text-danger fs-6"></i>
                  Puesto en el Organigrama Institucional
                </span>
                <span className="badge bg-white text-muted border extra-small">
                  Jerarquía Escolar
                </span>
              </div>
              <div className="row g-2 g-md-3">
                <div className="col-12 col-md-6">
                  <div className="p-2.5 bg-white rounded-3 border">
                    <span className="extra-small text-muted d-block text-uppercase fw-bold">Cargo Oficial Asignado:</span>
                    <span className="fw-bold text-dark small">{organigramaAsig?.cargoOficial}</span>
                    <div className="extra-small text-primary fw-semibold">{organigramaAsig?.tipoCargo}</div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="p-2.5 bg-white rounded-3 border">
                    <span className="extra-small text-muted d-block text-uppercase fw-bold">Línea de Reporte (Supervisor Inmediato):</span>
                    <span className="fw-bold text-dark small">
                      <i className="bi bi-person-up text-info me-1"></i>
                      {organigramaAsig?.supervisor}
                    </span>
                    <div className="extra-small text-muted">Cadena de Mando Directa</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Salones y Aulas Asignadas (Grado y Sección) */}
            {salonesAsig.length > 0 ? (
              <div className="mb-3 mb-md-4">
                <label className="fw-bolder extra-small small-md text-dark text-uppercase mb-2 d-flex align-items-center gap-1.5">
                  <i className="bi bi-mortarboard-fill text-primary fs-6"></i>
                  Tu Aula y Carga Académica Asignada ({salonesAsig.length} {salonesAsig.length === 1 ? 'Salón' : 'Salones'})
                </label>

                <div className="d-flex flex-column gap-2.5">
                  {salonesAsig.map((sal: any) => (
                    <div
                      key={sal.id_salon}
                      className="card border-2 border-primary border-opacity-25 rounded-4 shadow-xs overflow-hidden"
                      style={{ background: 'linear-gradient(to right, #f8fafc, #ffffff)' }}
                    >
                      <div className="card-header bg-primary bg-opacity-10 p-2.5 p-md-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-1.5">
                        <div className="d-flex align-items-center gap-1.5 flex-wrap">
                          <span className="badge bg-primary rounded-pill px-2.5 py-1 fw-bold extra-small">
                            {sal.grado_anio} - Sección "{sal.seccion}"
                          </span>
                          <span className="badge bg-white text-dark border extra-small">{sal.nivel_educativo}</span>
                        </div>
                        <span className={`badge rounded-pill px-2.5 py-1 fw-bold extra-small ${sal.rolEnAula === 'Docente Titular' ? 'bg-success text-white' : 'bg-info text-dark'}`}>
                          <i className="bi bi-person-badge-fill me-1"></i>{sal.rolEnAula}
                        </span>
                      </div>

                      <div className="card-body p-2.5 p-md-3">
                        <div className="row g-2">
                          <div className="col-12 col-sm-4">
                            <span className="extra-small text-muted d-block text-uppercase fw-bold">Salón Oficial:</span>
                            <span className="fw-bolder text-dark extra-small">{sal.nombre_salon}</span>
                          </div>
                          <div className="col-12 col-sm-4">
                            <span className="extra-small text-muted d-block text-uppercase fw-bold">Ambiente / Espacio:</span>
                            <span className="fw-bold text-primary extra-small">
                              <i className="bi bi-geo-alt-fill me-1"></i>
                              {sal.espacio ? sal.espacio.nombre : 'Aula de Clases'}
                            </span>
                          </div>
                          <div className="col-12 col-sm-4">
                            <span className="extra-small text-muted d-block text-uppercase fw-bold">Docente Colega:</span>
                            <span className="fw-bold text-dark extra-small">
                              <i className="bi bi-people me-1"></i>
                              {sal.colega}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="alert alert-info border-0 rounded-4 p-3 mb-3 d-flex align-items-center gap-2.5">
                <i className="bi bi-info-circle-fill text-primary fs-4 flex-shrink-0"></i>
                <div>
                  <div className="fw-bold text-dark extra-small">Asignación en Funciones Institucionales / Especialidades</div>
                  <div className="extra-small text-muted">
                    Tu usuario cuenta con responsabilidades docentes por especialidad, comités o áreas operativas para el año escolar {periodoActivo}.
                  </div>
                </div>
              </div>
            )}

            {/* 3.5. Especialidades y Áreas de Formación Asignadas */}
            {especialidadesAsig.length > 0 && (
              <div className="mb-3 mb-md-4">
                <label className="fw-bolder extra-small small-md text-dark text-uppercase mb-2 d-flex align-items-center gap-1.5">
                  <i className="bi bi-journal-bookmark-fill text-info fs-6"></i>
                  Especialidades y Áreas de Formación Asignadas ({especialidadesAsig.length})
                </label>
                <div className="d-flex flex-column gap-2.5">
                  {especialidadesAsig.map((esp: any, idx: number) => (
                    <div
                      key={idx}
                      className="card border-2 border-info border-opacity-30 rounded-4 shadow-xs overflow-hidden"
                      style={{ background: 'linear-gradient(to right, #f0fdfa, #ffffff)' }}
                    >
                      <div className="card-header bg-info bg-opacity-10 p-2.5 p-md-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-1.5">
                        <span className="fw-bold text-dark extra-small d-flex align-items-center gap-1.5">
                          <i className="bi bi-award-fill text-info"></i>
                          {esp.nombre}
                        </span>
                        <span className="badge bg-info text-dark rounded-pill px-2.5 py-1 fw-bold extra-small">
                          {esp.nivel}
                        </span>
                      </div>
                      <div className="card-body p-2.5 p-md-3">
                        <div className="d-flex align-items-center gap-1.5 flex-wrap mb-1.5">
                          <span className="extra-small text-muted fw-bold text-uppercase me-1">Grados/Años que Atiende:</span>
                          {esp.grados && esp.grados.length > 0 ? (
                            esp.grados.map((g: string, gIdx: number) => (
                              <span key={gIdx} className="badge bg-primary rounded-pill px-2.5 py-0.5 extra-small">
                                {g}
                              </span>
                            ))
                          ) : (
                            <span className="badge bg-light text-dark border extra-small">Todos los Grados</span>
                          )}
                        </div>
                        {esp.horas > 0 && (
                          <div className="extra-small text-muted">
                            <i className="bi bi-clock-history me-1 text-primary"></i>
                            Carga Horaria Semanal: <b>{esp.horas} horas</b>
                          </div>
                        )}
                        {esp.observaciones && (
                          <div className="extra-small text-muted mt-1 fst-italic">
                            <i className="bi bi-info-circle me-1"></i>{esp.observaciones}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Colectivos Pedagógicos y Comisiones */}
            {colectivosAsig.length > 0 && (
              <div className="mb-3 mb-md-4">
                <label className="fw-bolder extra-small small-md text-dark text-uppercase mb-2 d-flex align-items-center gap-1.5">
                  <i className="bi bi-people-fill text-success fs-6"></i>
                  Colectivos y Comisiones Pedagógicas
                </label>
                <div className="d-flex flex-column gap-2">
                  {colectivosAsig.map((col: any, idx: number) => (
                    <div key={idx} className="p-2.5 p-md-3 bg-light border rounded-3 d-flex align-items-center justify-content-between flex-wrap gap-1.5">
                      <div>
                        <div className="fw-bold text-dark extra-small d-flex align-items-center gap-1.5">
                          <i className="bi bi-check-circle-fill text-success"></i>
                          {col.nombre}
                        </div>
                        <div className="extra-small text-muted">{col.categoria}</div>
                      </div>
                      <span className={`badge rounded-pill px-2.5 py-1 fw-bold extra-small ${col.rol.includes('Vocero') ? 'bg-warning text-dark' : 'bg-primary text-white'}`}>
                        {col.rol}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mensaje Motivacional de la Dirección */}
            <div
              className="p-3.5 rounded-4 border border-warning border-opacity-50 text-dark mb-1 shadow-xs"
              style={{ backgroundColor: '#fffbeb' }}
            >
              <div className="d-flex align-items-center gap-1.5 text-warning text-darken-3 fw-bold extra-small mb-1">
                <i className="bi bi-chat-quote-fill fs-6"></i>
                <span>Mensaje de la Dirección del Plantel:</span>
              </div>
              <p className="extra-small mb-0 text-muted fst-italic">
                {configActual.mensajePersonalizado || `"¡Bienvenido(a) a este nuevo ciclo escolar ${periodoActivo}! La excelencia y el amor por la educación que entregas cada día transforman el futuro de nuestros estudiantes. ¡Que sea un año lleno de aprendizajes, unión y grandes logros!"`}
              </p>
            </div>

          </div>

          {/* Footer con Logo del Ministerio sobre fondo blanco limpio y botones de acción */}
          <div className="modal-footer bg-light p-2.5 p-md-3 border-top d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2.5">
            <div className="d-flex align-items-center justify-content-between justify-content-sm-start gap-2.5 w-100 w-sm-auto">

              {/* Logo del Ministerio con Base Blanca Limpia */}
              <div className="bg-white p-1 rounded-3 border d-flex align-items-center shadow-xs">
                <img
                  src="/assets/img/logoMPPE.png"
                  alt="Ministerio del Poder Popular para la Educación"
                  style={{ height: '30px', maxWidth: '100px', objectFit: 'contain' }}
                  title="Ministerio del Poder Popular para la Educación"
                />
              </div>

              <button
                type="button"
                onClick={exportarFichaPDF}
                className="btn btn-outline-primary btn-sm rounded-pill px-3.5 py-1.5 fw-bold d-flex align-items-center gap-1.5 hover-efecto shadow-xs extra-small flex-grow-1 flex-sm-grow-0 justify-content-center"
              >
                <i className="bi bi-file-earmark-pdf-fill text-danger fs-6"></i>
                <span>Descargar PDF</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleConfirmarYContinuar}
              className="btn btn-primary rounded-pill px-4 py-2.5 py-sm-2 fw-bold shadow-xs d-flex align-items-center justify-content-center gap-2 hover-efecto w-100 w-sm-auto"
              style={{ backgroundColor: '#4f46e5', borderColor: '#4f46e5' }}
            >
              <i className="bi bi-check2-circle fs-5"></i>
              <span className="extra-small small-sm">¡Entendido y Listo para Iniciar! 🎉</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
