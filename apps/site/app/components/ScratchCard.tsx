'use client';

import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';

interface ScratchCardProps {
  title: string;
  hiddenText: string;
  photoPathname?: string;
}

export default function ScratchCard({ title, hiddenText, photoPathname }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  const revealedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    const width = 640;
    const height = 280;
    canvas.width = width;
    canvas.height = height;
    context.fillStyle = '#b91c4a';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#ffd1dc';
    context.font = '600 30px Outfit, sans-serif';
    context.textAlign = 'center';
    context.fillText('Scratch to reveal', width / 2, height / 2);

    let scratched = 0;
    let drawing = false;
    const reveal = () => {
      if (revealedRef.current) return;
      revealedRef.current = true;
      setRevealed(true);
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        confetti({ particleCount: 90, spread: 75, origin: { y: 0.65 }, colors: ['#ff758f', '#ffbe0b', '#ffffff'] });
      }
    };
    const scratch = (event: PointerEvent) => {
      if (!drawing || revealedRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * width;
      const y = ((event.clientY - rect.top) / rect.height) * height;
      context.globalCompositeOperation = 'destination-out';
      context.beginPath();
      context.arc(x, y, 30, 0, Math.PI * 2);
      context.fill();
      scratched += 1;
      if (scratched >= 45) reveal();
    };
    const start = (event: PointerEvent) => {
      drawing = true;
      canvas.setPointerCapture(event.pointerId);
      scratch(event);
    };
    const stop = () => { drawing = false; };

    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', scratch);
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointercancel', stop);
    return () => {
      canvas.removeEventListener('pointerdown', start);
      canvas.removeEventListener('pointermove', scratch);
      canvas.removeEventListener('pointerup', stop);
      canvas.removeEventListener('pointercancel', stop);
    };
  }, []);

  return (
    <section className="scratch-section glass-panel" aria-labelledby="scratch-title">
      <h2 id="scratch-title" className="section-title serif-heading">{title}</h2>
      {photoPathname && (
        <img className="scratch-photo" src={`/api/media?pathname=${encodeURIComponent(photoPathname)}`} alt="Surprise" />
      )}
      <div className={`scratch-reveal ${revealed ? 'is-revealed' : ''}`}>
        <p>{hiddenText}</p>
      </div>
      {!revealed && <canvas ref={canvasRef} className="scratch-canvas" aria-label="Scratch to reveal surprise" />}
      {!revealed && <button type="button" className="romantic-btn" onClick={() => { revealedRef.current = true; setRevealed(true); }}>Reveal</button>}
      <style jsx>{`
        .scratch-section { margin: 20px 16px; padding: 24px 18px; text-align: center; }
        .scratch-canvas { width: 100%; max-width: 640px; height: auto; min-height: 170px; border-radius: 16px; touch-action: none; display: block; margin: 18px auto; }
        .scratch-reveal { min-height: 100px; display: grid; place-items: center; color: var(--text-soft); }
        .scratch-reveal p { max-width: 520px; overflow-wrap: anywhere; }
        .scratch-photo { max-width: 100%; border-radius: 12px; margin-top: 14px; }
      `}</style>
    </section>
  );
}
