
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCw, Check, X, Move, Sparkles } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedBase64: string) => void;
}

export default function ImageCropperModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
}: ImageCropperModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reiniciar estado cuando se abre con una nueva imagen
  useEffect(() => {
    if (isOpen && imageSrc) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
    }
  }, [isOpen, imageSrc]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Manejo de Arrastre (Mouse y Touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Rotar imagen 90 grados
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Generar recorte circular en Canvas a resolución óptima (400x400)
  const handleCrop = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;

    const canvas = document.createElement('canvas');
    const targetSize = 400; // 400x400 px óptimo para avatares web y móviles
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Habilitar suavizado de alta calidad
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Máscara circular
    ctx.beginPath();
    ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Obtener dimensiones del visor circular en pantalla (220px de diámetro)
    const viewportSize = 220;
    const ratio = targetSize / viewportSize;

    // Centro del canvas
    ctx.translate(targetSize / 2, targetSize / 2);
    ctx.translate(position.x * ratio, position.y * ratio);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    const img = imageRef.current;
    // Dimensiones representadas en pantalla
    const displayedW = img.offsetWidth;
    const displayedH = img.offsetHeight;

    ctx.drawImage(
      img,
      (-displayedW / 2) * ratio,
      (-displayedH / 2) * ratio,
      displayedW * ratio,
      displayedH * ratio
    );

    const croppedDataUrl = canvas.toDataURL('image/png', 0.92);
    onCropComplete(croppedDataUrl);
    onClose();
  }, [position, rotation, scale, onCropComplete, onClose]);

  if (!isOpen || !imageSrc) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          className="w-full max-w-sm sm:max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        >
          {/* Cabecera */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-800">
                  Ajustar y Recortar Foto
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">
                  Encuadra tu rostro dentro del círculo
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Área de Visualización y Recorte Circular */}
          <div className="relative p-4 flex flex-col items-center justify-center bg-slate-900 overflow-hidden select-none">
            {/* Contenedor del Visor Circular */}
            <div
              ref={containerRef}
              className="relative w-[220px] h-[220px] rounded-full overflow-hidden border-2 border-white shadow-[0_0_0_9999px_rgba(15,23,42,0.78)] cursor-grab active:cursor-grabbing touch-none flex items-center justify-center"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {/* Líneas guía de encuadre en cruz y círculo sutil */}
              <div className="absolute inset-0 pointer-events-none border border-white/25 rounded-full z-20" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 opacity-30">
                <div className="w-full h-[1px] bg-white/40" />
                <div className="h-full w-[1px] bg-white/40 absolute" />
              </div>

              {/* Imagen Interactiva Escalada y Arrastrable */}
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Foto a recortar"
                onLoad={handleImageLoad}
                draggable={false}
                className="max-w-none transition-transform pointer-events-none object-contain"
                style={{
                  width: '220px',
                  height: 'auto',
                  transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
                  transformOrigin: 'center center'
                }}
              />
            </div>

            {/* Indicador de Ayuda para Arrastrar */}
            <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-slate-300 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
              <Move className="w-3 h-3 text-sky-400 animate-pulse" />
              <span>Arrastra para centrar • Usa el zoom para ajustar</span>
            </div>
          </div>

          {/* Controles de Zoom y Rotación */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 space-y-3">
            {/* Control Deslizante de Zoom */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setScale(prev => Math.max(0.6, prev - 0.15))}
                className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                title="Alejar"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="0.6"
                max="3.0"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />

              <button
                type="button"
                onClick={() => setScale(prev => Math.min(3.0, prev + 0.15))}
                className="p-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                title="Acercar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="w-[1px] h-4 bg-slate-300 mx-1" />

              <button
                type="button"
                onClick={handleRotate}
                className="p-1.5 rounded-md text-slate-600 hover:text-sky-700 hover:bg-sky-50 border border-slate-200 transition-colors flex items-center gap-1 text-[10px] font-bold"
                title="Girar 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Girar</span>
              </button>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-3 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleCrop}
                className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/30 flex items-center justify-center gap-1.5 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Aplicar Recorte Circular</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

