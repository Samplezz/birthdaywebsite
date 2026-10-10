'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Sparkles, Flame, RotateCcw, Volume2 } from 'lucide-react';
import { fireGrandCelebration } from './Decorations';

interface CakeCandlesProps {
  candleCount?: number;
  wishPrompt?: string;
  blownOutMessage?: string;
  onCandlesBlownOut?: () => void;
}

export default function CakeCandles({
  candleCount = 3,
  wishPrompt = 'Make a wish and blow gently into your microphone, or tap the candles!',
  blownOutMessage = 'May all your deepest dreams and sweetest wishes come true! ✨🎂',
  onCandlesBlownOut,
}: CakeCandlesProps) {
  const [isBlownOut, setIsBlownOut] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const stopMicrophone = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setMicActive(false);
  };

  const extinguishCandles = () => {
    if (isBlownOut) return;
    setIsBlownOut(true);
    stopMicrophone();
    fireGrandCelebration();
    if (onCandlesBlownOut) onCandlesBlownOut();
  };

  const requestMicrophone = async () => {
    setMicError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicError('Microphone not supported on this browser. You can tap the candles directly!');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      setMicActive(true);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let blowStreak = 0;

      const checkBlow = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume in low-mid frequencies (blowing causes wind turbulence)
        let sum = 0;
        for (let i = 0; i < 40; i++) {
          sum += dataArray[i];
        }
        const average = sum / 40;
        const normalized = Math.min(100, Math.round((average / 255) * 100));
        setAudioLevel(normalized);

        // If continuous high breath detected for 6 consecutive frames
        if (normalized > 45) {
          blowStreak += 1;
          if (blowStreak >= 6) {
            extinguishCandles();
            return;
          }
        } else {
          blowStreak = Math.max(0, blowStreak - 1);
        }

        animationFrameRef.current = requestAnimationFrame(checkBlow);
      };

      animationFrameRef.current = requestAnimationFrame(checkBlow);
    } catch (err: unknown) {
      console.warn('Microphone permission denied or failed:', err);
      setMicActive(false);
      setMicError('Microphone permission was denied. No worries at all—just tap the candles!');
    }
  };

  const handleRelight = () => {
    setIsBlownOut(false);
    setAudioLevel(0);
  };

  useEffect(() => {
    return () => {
      stopMicrophone();
    };
  }, []);

  return (
    <section className="cake-section">
      <div className="section-header text-center">
        <span className="badge-pill">
          <Sparkles size={14} /> Birthday Cake & Candles
        </span>
        <h2 className="section-title serif-heading">Make A Birthday Wish</h2>
        <p className="section-prompt">{isBlownOut ? blownOutMessage : wishPrompt}</p>
      </div>

      {/* The Romantic Birthday Cake */}
      <div
        className="cake-stage"
        onClick={!isBlownOut ? extinguishCandles : undefined}
        title={!isBlownOut ? 'Tap to blow out candles!' : undefined}
      >
        {/* Candles row */}
        <div className="candles-row">
          {Array.from({ length: candleCount }).map((_, idx) => (
            <div key={idx} className="candle-unit">
              {/* Flame or Smoke puff */}
              {!isBlownOut ? (
                <div className="flame-wrapper">
                  <div className="flame-glow" />
                  <div className="flame" />
                </div>
              ) : (
                <div className="smoke-puff" />
              )}
              {/* Wick */}
              <div className="wick" />
              {/* Candle Stick */}
              <div
                className="candle-stick"
                style={{
                  background: idx % 2 === 0
                    ? 'repeating-linear-gradient(45deg, #ffd1dc, #ffd1dc 6px, #fff 6px, #fff 12px)'
                    : 'repeating-linear-gradient(45deg, #fbcfe8, #fbcfe8 6px, #f43f5e 6px, #f43f5e 12px)',
                }}
              />
            </div>
          ))}
        </div>

        {/* 3D Tiered Cake */}
        <div className="cake-tier tier-top">
          <div className="frosting-drips">
            <span /><span /><span /><span /><span />
          </div>
          <div className="strawberries-row">
            🍓 🌸 🍓 🌸 🍓
          </div>
        </div>

        <div className="cake-tier tier-bottom">
          <div className="frosting-drips bottom-drips">
            <span /><span /><span /><span /><span /><span /><span />
          </div>
          <div className="ribbon-decor" />
        </div>

        {/* Plate */}
        <div className="cake-plate" />
      </div>

      {/* Control Buttons & Mic Status */}
      <div className="controls-panel">
        {!isBlownOut ? (
          <div className="interactive-actions">
            {!micActive ? (
              <button
                type="button"
                className="romantic-btn"
                onClick={requestMicrophone}
              >
                <Mic size={18} />
                Blow with Microphone
              </button>
            ) : (
              <div className="mic-meter-box glass-panel">
                <div className="mic-label">
                  <Mic size={16} className="active-mic" />
                  <span>Blow gently into mic...</span>
                </div>
                <div className="meter-bar-container">
                  <div
                    className="meter-bar-fill"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              className="secondary-btn"
              onClick={extinguishCandles}
            >
              <Flame size={16} />
              Tap Candles to Blow Out
            </button>
          </div>
        ) : (
          <div className="celebration-box glass-panel glass-glow">
            <p className="celebration-text">{blownOutMessage}</p>
            <button
              type="button"
              className="secondary-btn relight-btn"
              onClick={handleRelight}
            >
              <RotateCcw size={16} /> Relight Candles & Wish Again
            </button>
          </div>
        )}

        {micError && (
          <p className="mic-error-msg">{micError}</p>
        )}
      </div>

      <style jsx>{`
        .cake-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 16px;
          position: relative;
          z-index: 5;
        }

        .section-header {
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          max-width: 440px;
        }

        .badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 14px;
          background: rgba(255, 190, 11, 0.15);
          border: 1px solid rgba(255, 190, 11, 0.4);
          color: var(--candle-warm);
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .section-title {
          font-size: clamp(1.8rem, 5vw, 2.4rem);
          color: var(--text-soft);
        }

        .section-prompt {
          font-size: 0.95rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        /* Cake Stage */
        .cake-stage {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 30px 0 20px 0;
          cursor: pointer;
          user-select: none;
        }

        /* Candles */
        .candles-row {
          display: flex;
          gap: 22px;
          margin-bottom: -4px;
          z-index: 4;
        }

        .candle-unit {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .flame-wrapper {
          position: relative;
          width: 14px;
          height: 24px;
          margin-bottom: 2px;
          animation: candle-flicker 1.8s infinite ease-in-out;
        }

        .flame {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at bottom, #fff 0%, #ffbe0b 55%, #fb5607 90%);
          border-radius: 50% 50% 35% 35% / 60% 60% 40% 40%;
          box-shadow: 0 0 12px #ffbe0b, 0 0 22px rgba(255, 80, 10, 0.6);
        }

        .smoke-puff {
          width: 10px;
          height: 14px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 50%;
          margin-bottom: 4px;
          animation: smoke-puff 1.2s forwards ease-out;
        }

        .wick {
          width: 2px;
          height: 6px;
          background: #4a192c;
        }

        .candle-stick {
          width: 10px;
          height: 44px;
          border-radius: 3px;
          box-shadow: inset -2px -2px 4px rgba(0, 0, 0, 0.25), 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        /* Cake Tiers */
        .cake-tier {
          position: relative;
          border-radius: 14px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3);
        }

        .tier-top {
          width: 160px;
          height: 65px;
          background: linear-gradient(180deg, #ffccd5 0%, #fb6f92 100%);
          z-index: 3;
          border: 1px solid rgba(255, 255, 255, 0.25);
        }

        .strawberries-row {
          text-align: center;
          font-size: 1.1rem;
          margin-top: 18px;
          letter-spacing: 2px;
        }

        .tier-bottom {
          width: 220px;
          height: 80px;
          background: linear-gradient(180deg, #ffe5ec 0%, #f43f5e 100%);
          margin-top: -10px;
          z-index: 2;
          border: 1px solid rgba(255, 255, 255, 0.25);
        }

        .ribbon-decor {
          position: absolute;
          bottom: 12px;
          left: 0;
          right: 0;
          height: 8px;
          background: #ffe3e0;
          opacity: 0.6;
        }

        .frosting-drips {
          display: flex;
          justify-content: space-around;
          margin-top: -3px;
        }

        .frosting-drips span {
          width: 12px;
          height: 14px;
          background: #fff;
          border-radius: 0 0 10px 10px;
          box-shadow: 0 2px 3px rgba(0, 0, 0, 0.15);
        }

        .cake-plate {
          width: 260px;
          height: 14px;
          background: linear-gradient(180deg, #e5e5e5 0%, #999 100%);
          border-radius: 50%;
          margin-top: -6px;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.6);
          z-index: 1;
        }

        /* Controls */
        .controls-panel {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          margin-top: 15px;
          width: 100%;
          max-width: 360px;
        }

        .interactive-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .mic-meter-box {
          padding: 12px 18px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border-radius: 16px;
        }

        .mic-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--candle-warm);
        }

        .active-mic {
          color: #ffbe0b;
          animation: gentle-pulse 1s infinite;
        }

        .meter-bar-container {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 9999px;
          overflow: hidden;
        }

        .meter-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #ffbe0b, #fb5607);
          transition: width 0.1s ease;
          border-radius: 9999px;
        }

        .celebration-box {
          padding: 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .celebration-text {
          font-size: 1.05rem;
          color: var(--text-pure);
          line-height: 1.5;
        }

        .relight-btn {
          font-size: 0.85rem;
        }

        .mic-error-msg {
          font-size: 0.8rem;
          color: #fca5b8;
          text-align: center;
          margin-top: 4px;
        }
      `}</style>
    </section>
  );
}
