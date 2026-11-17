import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  color: string;
}

export default function TechNetworkBackground({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const particleCount = Math.min(Math.floor((width * height) / 18000), 70);
    const particles: Particle[] = [];
    const colors = theme === 'light' 
      ? ['#2d93d0', '#0284c7', '#38bdf8', '#0ea5e9', '#60a5fa'] 
      : ['#2d93d0', '#38bdf8', '#0284c7', '#60a5fa', '#93c5fd'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.6 + 1.2,
        baseAlpha: Math.random() * 0.4 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const maxDistance = 135;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Dibujar líneas entre nodos cercanos
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * (theme === 'light' ? 0.22 : 0.28);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(45, 147, 208, ${alpha})`;
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }
      }

      // Dibujar y mover cada nodo
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Halo suave exterior
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = theme === 'light' ? 'rgba(45, 147, 208, 0.14)' : 'rgba(45, 147, 208, 0.12)';
        ctx.fill();

        // Punto de nodo central
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        if (theme === 'light') {
          ctx.shadowColor = 'rgba(45, 147, 208, 0.4)';
          ctx.shadowBlur = 4;
        } else {
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 6;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  if (theme === 'light') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#f4f7fb]">
        {/* Gradiente suave claro y luminoso estilo EdTech / Saeko */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 15%, #ffffff 0%, #eef5fc 45%, #e2eefb 85%)'
          }}
        />

        {/* Resplandor ambiental cian muy sutil */}
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[400px] rounded-full blur-[140px] pointer-events-none opacity-40"
          style={{
            background: 'radial-gradient(circle, #bae6fd 0%, #7dd3fc 40%, transparent 70%)'
          }}
        />

        {/* Cuadrícula sutil limpia */}
        <div 
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage: 'linear-gradient(to right, #0284c7 1px, transparent 1px), linear-gradient(to bottom, #0284c7 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />

        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#060b16]">
      <div 
        className="absolute inset-0 opacity-80"
        style={{
          background: 'radial-gradient(circle at 50% 25%, #0c2340 0%, #081427 45%, #040913 85%)'
        }}
      />
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] h-[400px] rounded-full blur-[140px] pointer-events-none opacity-25"
        style={{
          background: 'radial-gradient(circle, #2d93d0 0%, #0284c7 40%, transparent 70%)'
        }}
      />
      <div 
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
