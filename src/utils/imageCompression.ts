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
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.7
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

          width = width * bestRatio;
          height = height * bestRatio;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Fallo al obtener el contexto del canvas.'));
        }

        // Pintar la imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar. Si la original era png y queremos reducir mucho, podríamos pasarla a jpeg.
        // Pero para mantener soporte, usamos jpeg como predeterminado (o el mismo tipo si es webp).
        const exportType = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Reconstruir el File
              // Cambiar extensión a .jpg si cambiamos el MIME
              const fileName = exportType === 'image/jpeg' 
                ? file.name.replace(/\.[^/.]+$/, ".jpg") 
                : file.name;
              
              const compressedFile = new File([blob], fileName, {
                type: exportType,
                lastModified: Date.now(),
              });
              
              resolve(compressedFile);
            } else {
              reject(new Error('Error al comprimir la imagen.'));
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
