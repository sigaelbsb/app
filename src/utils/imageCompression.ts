/**
 * Comprime una imagen seleccionada por el usuario usando un elemento Canvas.
 * Reduce las dimensiones si exceden el límite máximo y ajusta la calidad (para JPEG/WebP).
 *
 * @param file El archivo original (File)
 * @param maxWidth Ancho máximo permitido (default 1280)
 * @param maxHeight Alto máximo permitido (default 1280)
 * @param quality Calidad de compresión, de 0 a 1 (default 0.7)
 * @returns Promesa que resuelve en un objeto File con la imagen comprimida.
 */
export const compressImage = async (
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82
): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Verificar si es una imagen
    if (!file.type.match(/image.*/)) {
      return resolve(file); // Retornar el archivo original si no es imagen (ej. PDF)
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcular la nueva proporción manteniendo el aspecto (aspect ratio)
        if (width > maxWidth || height > maxHeight) {
          const widthRatio = maxWidth / width;
          const heightRatio = maxHeight / height;
          const bestRatio = Math.min(widthRatio, heightRatio);

          width = Math.round(width * bestRatio);
          height = Math.round(height * bestRatio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Fallo al obtener el contexto del canvas.'));
        }

        // Activamos máxima calidad en el suavizado de escalado para que el texto y detalles no pierdan nitidez
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Pintar la imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Para reducir drásticamente el peso (bytes) manteniendo excelente calidad visual y nitidez de texto,
        // utilizamos formato WebP por defecto (hasta 50% más liviano que JPEG/PNG con calidad de imagen superior).
        const exportType = 'image/webp';
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Reconstruir el File con extensión .webp para optimizar el almacenamiento y subida
              const fileName = file.name.replace(/\.[^/.]+$/, ".webp");
              
              const compressedFile = new File([blob], fileName, {
                type: exportType,
                lastModified: Date.now(),
              });
              
              // Si por alguna razón la compresión resultara más pesada que el archivo original, conservamos el original si ya es pequeño
              if (compressedFile.size >= file.size && file.size < 500 * 1024) {
                resolve(file);
              } else {
                resolve(compressedFile);
              }
            } else {
              // Fallback a JPEG en caso extremo de que el navegador antiguo no exporte a WebP
              canvas.toBlob((blobJpeg) => {
                if (blobJpeg) {
                  const fileNameJpeg = file.name.replace(/\.[^/.]+$/, ".jpg");
                  resolve(new File([blobJpeg], fileNameJpeg, { type: 'image/jpeg', lastModified: Date.now() }));
                } else {
                  reject(new Error('Error al comprimir la imagen.'));
                }
              }, 'image/jpeg', quality);
            }
          },
          exportType,
          quality
        );
      };

      img.onerror = (error) => reject(error);
    };

    reader.onerror = (error) => reject(error);
  });
};
