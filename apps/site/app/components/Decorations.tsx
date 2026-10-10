'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface DecorationsProps {
  celebrateTrigger?: boolean;
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function fireRomanticConfetti() {
  if (typeof window === 'undefined' || prefersReducedMotion()) return;
  // Heart & rose petal confetti
  confetti({
    particleCount: 50,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#ff758f', '#ff4d6d', '#ffb3c1', '#f6c46d', '#ffffff'],
    shapes: ['circle'],
    ticks: 200,
  });
}

export function fireGrandCelebration() {
  if (typeof window === 'undefined' || prefersReducedMotion()) return;
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    colors: ['#ff758f', '#c9184a', '#ffbe0b', '#fb5607', '#ffccd5']
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

export default function Decorations({ celebrateTrigger }: DecorationsProps) {
  const [balloons, setBalloons] = useState<Array<{ id: number; left: number; delay: number; color: string; duration: number }>>([]);

  useEffect(() => {
    // Generate gentle romantic floating balloons
    const balloonColors = [
      'radial-gradient(circle at 35% 35%, #ffb3c1, #c9184a)',
      'radial-gradient(circle at 35% 35%, #fca5b8, #e03f67)',
      'radial-gradient(circle at 35% 35%, #ffe5ec, #fb6f92)',
      'radial-gradient(circle at 35% 35%, #ffd166, #e76f51)',
      'radial-gradient(circle at 35% 35%, #f8edeb, #f4a261)',
    ];

    const generated = Array.from({ length: 9 }).map((_, i) => ({
      id: i,
      left: 5 + (i * 10) + (Math.random() * 5 - 2.5),
      delay: i * 3.2,
      duration: 18 + Math.random() * 8,
      color: balloonColors[i % balloonColors.length],
    }));

    setBalloons(generated);
  }, []);

  useEffect(() => {
    if (celebrateTrigger) {
      fireGrandCelebration();
    }
  }, [celebrateTrigger]);

  return (
    <div className="decorations-container" aria-hidden="true">
      {/* Romantic bunting at the very top */}
      <div className="bunting-banner">
        <svg viewBox="0 0 1000 70" preserveAspectRatio="none" className="bunting-svg">
          {/* Swag string */}
          <path d="M 0 10 Q 250 40 500 10 Q 750 40 1000 10" stroke="rgba(255, 182, 193, 0.45)" strokeWidth="2" fill="none" />
          
          {/* Decorative flags */}
          {Array.from({ length: 15 }).map((_, idx) => {
            const x = 35 + idx * 64;
            const y = 10 + Math.sin((x / 1000) * Math.PI) * 22;
            const colors = ['#ff758f', '#fca5b8', '#ffd166', '#ff4d6d', '#e2a0b3'];
            return (
              <polygon
                key={idx}
                points={`${x},${y} ${x + 24},${y + 4} ${x + 12},${y + 34}`}
                fill={colors[idx % colors.length]}
                opacity="0.82"
              />
            );
          })}
        </svg>
      </div>

      {/* Floating balloons */}
      {balloons.map((b) => (
        <div
          key={b.id}
          className="balloon-wrapper"
          style={{
            left: `${b.left}%`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
          }}
        >
          <div className="balloon-body" style={{ background: b.color }}>
            <div className="balloon-shine" />
          </div>
          <div className="balloon-knot" />
          <div className="balloon-string" />
        </div>
      ))}

      <style jsx>{`
        .decorations-container {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 1;
        }

        .bunting-banner {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          height: 60px;
          opacity: 0.9;
        }

        .bunting-svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .balloon-wrapper {
          position: absolute;
          bottom: -150px;
          animation: float-balloon linear infinite;
          will-change: transform;
        }

        .balloon-body {
          width: 44px;
          height: 56px;
          border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%;
          position: relative;
          box-shadow: inset -5px -5px 12px rgba(0, 0, 0, 0.25), 0 8px 18px rgba(0, 0, 0, 0.3);
        }

        .balloon-shine {
          position: absolute;
          top: 8px;
          left: 8px;
          width: 10px;
          height: 16px;
          background: rgba(255, 255, 255, 0.45);
          border-radius: 50%;
          transform: rotate(-25deg);
        }

        .balloon-knot {
          width: 6px;
          height: 4px;
          background: rgba(180, 50, 70, 0.8);
          margin: -1px auto 0 auto;
          clip-path: polygon(0 0, 100% 0, 80% 100%, 20% 100%);
        }

        .balloon-string {
          width: 1px;
          height: 48px;
          background: rgba(255, 255, 255, 0.3);
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}
