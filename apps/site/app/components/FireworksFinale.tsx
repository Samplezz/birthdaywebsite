'use client';

import { useEffect, useRef, useState } from 'react';

interface FireworksFinaleProps {
  finalMessage: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export default function FireworksFinale({ finalMessage }: FireworksFinaleProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [finished, setFinished] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let timeout = 0;
    const context = canvas.getContext('2d');

    if (reduced || !context) {
      timeout = window.setTimeout(() => setFinished(true), 8000);
      return () => window.clearTimeout(timeout);
    }

    const resize = () => {
      canvas.width = Math.max(320, canvas.clientWidth * window.devicePixelRatio);
      canvas.height = Math.max(240, canvas.clientHeight * window.devicePixelRatio);
      context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    const start = performance.now();
    const particles: Particle[] = [];
    const colors = ['#ff758f', '#ffbe0b', '#fca5b8', '#ffffff'];

    const animate = (now: number) => {
      const elapsed = now - start;
      context.fillStyle = 'rgba(18, 7, 15, 0.18)';
      context.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      if (Math.random() < 0.08) {
        const x = 40 + Math.random() * Math.max(1, canvas.clientWidth - 80);
        const y = 40 + Math.random() * Math.max(1, canvas.clientHeight - 130);
        for (let i = 0; i < 28; i += 1) {
          const angle = (Math.PI * 2 * i) / 28;
          particles.push({ x, y, vx: Math.cos(angle) * (1 + Math.random() * 2), vy: Math.sin(angle) * (1 + Math.random() * 2), life: 1, color: colors[i % colors.length] });
        }
      }
      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.025;
        particle.life -= 0.012;
        context.globalAlpha = Math.max(0, particle.life);
        context.fillStyle = particle.color;
        context.fillRect(particle.x, particle.y, 3, 3);
      });
      context.globalAlpha = 1;
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        if (particles[i].life <= 0) particles.splice(i, 1);
      }
      if (elapsed < 8000) frame = requestAnimationFrame(animate);
      else setFinished(true);
    };

    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <section className={`fireworks-finale ${finished ? 'finished' : ''}`} aria-live="polite">
      <canvas ref={canvasRef} aria-hidden="true" />
      {finished && <div className="finale-message glass-panel"><p>{finalMessage}</p></div>}
      <style jsx>{`
        .fireworks-finale { min-height: 300px; position: relative; display: grid; place-items: center; overflow: hidden; border-radius: 20px; }
        canvas { position: absolute; inset: 0; width: 100%; height: 100%; background: rgba(18, 7, 15, .5); }
        .finale-message { position: relative; z-index: 1; padding: 24px; text-align: center; color: var(--text-soft); animation: finale-glow 1.2s ease both; }
        @keyframes finale-glow { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .finale-message { animation: none; } .fireworks-finale { background: radial-gradient(circle, rgba(255,117,143,.35), transparent 70%); } }
      `}</style>
    </section>
  );
}
