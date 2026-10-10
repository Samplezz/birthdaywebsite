'use client';

import React, { useEffect, useState } from 'react';
import { Clock, Gift, Sparkles } from 'lucide-react';
import { fireGrandCelebration } from './Decorations';

interface CountdownTimerProps {
  targetDateString: string;
  countdownTitle?: string;
  celebrationMessage?: string;
  onCelebration?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isZero: boolean;
}

export default function CountdownTimer({
  targetDateString,
  countdownTitle = 'Counting Down To Your Special Moment',
  celebrationMessage = '🎉 Happy Birthday! The celebration has begun! 💖',
  onCelebration,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isZero: false,
  });
  const [celebrated, setCelebrated] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const targetTime = new Date(targetDateString).getTime();
      const now = Date.now();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isZero: true });
        if (!celebrated) {
          setCelebrated(true);
          fireGrandCelebration();
          if (onCelebration) onCelebration();
        }
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isZero: false });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetDateString, celebrated, onCelebration]);

  const padZero = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  return (
    <section className="countdown-section">
      <div className="section-header text-center">
        <span className="badge-pill">
          <Clock size={14} /> Anticipation & Wonder
        </span>
        <h2 className="section-title serif-heading">{countdownTitle}</h2>
      </div>

      {!timeLeft.isZero ? (
        <div className="countdown-grid">
          <div className="time-card glass-panel glass-glow">
            <span className="time-digit script-heading">{padZero(timeLeft.days)}</span>
            <span className="time-label">Days</span>
          </div>

          <div className="time-card glass-panel glass-glow">
            <span className="time-digit script-heading">{padZero(timeLeft.hours)}</span>
            <span className="time-label">Hours</span>
          </div>

          <div className="time-card glass-panel glass-glow">
            <span className="time-digit script-heading">{padZero(timeLeft.minutes)}</span>
            <span className="time-label">Minutes</span>
          </div>

          <div className="time-card glass-panel glass-glow">
            <span className="time-digit script-heading">{padZero(timeLeft.seconds)}</span>
            <span className="time-label">Seconds</span>
          </div>
        </div>
      ) : (
        <div className="celebration-banner glass-panel glass-glow">
          <Gift size={28} className="gift-icon" />
          <p className="celebration-text script-heading">{celebrationMessage}</p>
        </div>
      )}

      <style jsx>{`
        .countdown-section {
          padding: 30px 16px 40px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 5;
        }

        .section-header {
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 14px;
          background: rgba(255, 117, 143, 0.15);
          border: 1px solid rgba(255, 117, 143, 0.35);
          color: var(--rose-soft);
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .section-title {
          font-size: clamp(1.6rem, 4.5vw, 2.2rem);
          color: var(--text-soft);
          text-align: center;
        }

        .countdown-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          width: 100%;
          max-width: 440px;
        }

        .time-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 16px 8px;
          border-radius: 18px;
          background: rgba(38, 14, 29, 0.85);
        }

        .time-digit {
          font-size: clamp(1.8rem, 6vw, 2.6rem);
          font-weight: 700;
          color: var(--candle-warm);
          text-shadow: 0 0 16px rgba(255, 190, 11, 0.4);
          line-height: 1;
        }

        .time-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 6px;
        }

        .celebration-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px 24px;
          border-radius: 20px;
          background: rgba(45, 16, 32, 0.9);
          border: 1px solid rgba(255, 190, 11, 0.4);
          max-width: 440px;
          text-align: center;
        }

        .gift-icon {
          color: var(--candle-warm);
          flex-shrink: 0;
          animation: gentle-pulse 1.5s infinite;
        }

        .celebration-text {
          font-size: 1.5rem;
          color: var(--text-pure);
          line-height: 1.3;
        }
      `}</style>
    </section>
  );
}
