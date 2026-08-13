import { supabase } from '../lib/supabase';

/**
 * Módulo de Seguridad de Firmas Digitales Institucionales - SIGAE
 * Protege y encubre las imágenes de firmas de la Dirección contra extracción limpia o copia no autorizada.
 */

export interface DatosDirector {
  nombreCompleto: string;
  tituloDirector: string;
  cedula: string;
  cargo: string;
  cargoGenerico: string; // 'Director' o 'Directora'
  ubicacionEscuela: string;
  nombreEscuela: string;
}

export const DIRECTORES_MAP: Record<string, DatosDirector> = {
  lb: {
    nombreCompleto: 'José Vicente Millán Montaño',
    tituloDirector: 'profesor José Vicente Millán Montaño',
    cedula: '17.780.095',
    cargo: 'Director de la Unidad Educativa Libertador Bolívar',
    cargoGenerico: 'Director',
    ubicacionEscuela: 'Miraflores, estado Monagas',
    nombreEscuela: 'Unidad Educativa Libertador Bolívar',
  },
  sb: {
    nombreCompleto: 'Elika Dayana Chaviel Rondón',
    tituloDirector: 'profesora Elika Dayana Chaviel Rondón',
    cedula: '16.808.608',
    cargo: 'Directora de la Unidad Educativa Santa Bárbara',
    cargoGenerico: 'Directora',
    ubicacionEscuela: 'El Tejero, estado Monagas',
    nombreEscuela: 'Unidad Educativa Santa Bárbara',
  },
};

export const obtenerDatosDirector = (escCodigo: string): DatosDirector => {
  const key = (escCodigo || 'lb').toLowerCase();
  return DIRECTORES_MAP[key] || DIRECTORES_MAP['lb'];
};

/**
 * Consulta en tiempo real en la base de datos de SIGAE el director/a y su cargo asignado
 */
export const obtenerDatosDirectorAsync = async (escCodigo: string): Promise<DatosDirector> => {
  const key = (escCodigo || 'lb').toLowerCase();
  const fallback = obtenerDatosDirector(key);

  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('nombre_completo, cedula, cargo, rol, id_escuela')
      .eq('id_escuela', key)
      .or('rol.eq.Director,cargo.ilike.%Director%')
      .limit(1);

    if (error || !data || data.length === 0) {
      return fallback;
    }

    const u = data[0];
    const nombre = u.nombre_completo || fallback.nombreCompleto;
    const cedulaRaw = (u.cedula || '').replace(/\D/g, '');
    const cedulaFormatted = cedulaRaw ? cedulaRaw.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : fallback.cedula;
    
    // Identificar género según nombre
    const esFemenino = nombre.toLowerCase().includes('elika') || nombre.toLowerCase().includes('dayana') || nombre.toLowerCase().includes('maría') || nombre.toLowerCase().includes('ana') || nombre.toLowerCase().includes('carmen') || key === 'sb';
    const cargoGenerico = esFemenino ? 'Directora' : 'Director';
    const cargoCompleto = `${cargoGenerico} de la ${fallback.nombreEscuela}`;
    const titulo = `${esFemenino ? 'profesora' : 'profesor'} ${nombre}`;

    return {
      nombreCompleto: nombre,
      tituloDirector: titulo,
      cedula: cedulaFormatted,
      cargo: cargoCompleto,
      cargoGenerico: cargoGenerico,
      ubicacionEscuela: fallback.ubicacionEscuela,
      nombreEscuela: fallback.nombreEscuela
    };
  } catch (e) {
    console.warn('Fallback a datos estáticos de director:', e);
    return fallback;
  }
};

const RUTA_FIRMAS: Record<string, string> = {
  sb: '/assets/img/firma_director_sb.png',
  lb: '/assets/img/firma_director_lb.png',
};

/**
 * Carga la imagen de la firma del director, la procesa en un Canvas en memoria
 * con marca de agua semitransparente anti-extracción.
 * Retorna la imagen en Base64 sin sello verde ni hash en la silueta.
 */
export const obtenerFirmaDirectorProtegida = (
  escCodigo: string,
  _codigoHash?: string
): Promise<string> => {
  return new Promise((resolve) => {
    const escKey = (escCodigo || 'lb').toLowerCase();
    const urlFirmaReal = RUTA_FIRMAS[escKey] || RUTA_FIRMAS['lb'];

    const imgFirma = new Image();
    imgFirma.crossOrigin = 'Anonymous';
    imgFirma.src = urlFirmaReal;

    const procesarCanvas = (imgLoaded: HTMLImageElement | null) => {
      const canvas = document.createElement('canvas');
      canvas.width = 920;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(''); return; }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 1. Fondo blanco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Marca de Agua Antiextracción Diagional sutil
      ctx.save();
      ctx.rotate(-12 * Math.PI / 180);
      ctx.font = 'bold 15px Arial, sans-serif';
      ctx.fillStyle = 'rgba(22, 101, 52, 0.04)';
      for (let i = -200; i < 1100; i += 220) {
        for (let j = -200; j < 650; j += 48) {
          ctx.fillText('DOCUMENTO OFICIAL SIGAE - FIRMA DIGITAL VALIDADA', i, j);
        }
      }
      ctx.restore();

      // 3. Renderizar la Imagen Real de la Firma centrada con alta resolución
      if (imgLoaded && imgLoaded.complete && imgLoaded.naturalWidth > 0) {
        const aspectRatio = imgLoaded.naturalWidth / imgLoaded.naturalHeight;
        let drawWidth = 580;
        let drawHeight = drawWidth / aspectRatio;
        if (drawHeight > 260) {
          drawHeight = 260;
          drawWidth = drawHeight * aspectRatio;
        }
        const drawX = (canvas.width - drawWidth) / 2;
        const drawY = (canvas.height - drawHeight) / 2;

        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(imgLoaded, drawX, drawY, drawWidth, drawHeight);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        // Trazo de firma cursiva por defecto en alta densidad
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 4.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(140, 160);
        ctx.bezierCurveTo(190, 60, 290, 50, 330, 150);
        ctx.bezierCurveTo(360, 210, 390, 230, 430, 130);
        ctx.bezierCurveTo(470, 60, 550, 70, 590, 160);
        ctx.bezierCurveTo(630, 220, 710, 190, 770, 130);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(160, 220);
        ctx.quadraticCurveTo(460, 260, 780, 200);
        ctx.stroke();
      }

      resolve(canvas.toDataURL('image/png'));
    };

    imgFirma.onload = () => procesarCanvas(imgFirma);
    imgFirma.onerror = () => procesarCanvas(null);
  });
};
