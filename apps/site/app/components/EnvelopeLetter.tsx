'use client';

import React, { useState } from 'react';
import { Heart, Sparkles, X, ChevronUp, Lock } from 'lucide-react';
import { fireRomanticConfetti } from './Decorations';

interface EnvelopeLetterProps {
  recipientName: string;
  heroTitle: string;
  heroSubtitle: string;
  letterContent: string;
  signoff: string;
  onOpenLetter?: () => void;
}

export default function EnvelopeLetter({
  recipientName,
  heroTitle,
  heroSubtitle,
  letterContent,
  signoff,
  onOpenLetter,
}: EnvelopeLetterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLetterExpanded, setIsLetterExpanded] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleOpen = () => {
    if (!isOpen) {
      setIsOpen(true);
      fireRomanticConfetti();
      if (!hasInteracted) {
        setHasInteracted(true);
        if (onOpenLetter) onOpenLetter();
      }
      // After top flap flips open (400ms), slide & expand letter smoothly
      setTimeout(() => {
        setIsLetterExpanded(true);
      }, 450);
    }
  };

  const handleFoldBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLetterExpanded(false);
    setTimeout(() => {
      setIsOpen(false);
    }, 350);
  };

  return (
    <section className="envelope-section">
      {/* Hero Header */}
      <div className="hero-intro text-center">
        <span className="recipient-pill">
          <Heart size={14} className="heart-icon" fill="currentColor" />
          For {recipientName}
        </span>
        <h1 className="hero-title script-heading">{heroTitle}</h1>
        <p className="hero-subtitle">{heroSubtitle}</p>
      </div>

      {/* Realistic 3D Envelope Experience */}
      <div className="envelope-scene">
        {!isLetterExpanded ? (
          <div
            className={`envelope-box ${isOpen ? 'envelope-open' : ''}`}
            onClick={handleOpen}
            role="button"
            tabIndex={0}
            aria-label="Tap to open the birthday envelope"
          >
            {/* SVG Definitions for realistic gradients and shadow */}
            <svg width="0" height="0" className="hidden-svg">
              <defs>
                <linearGradient id="backGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#220b18" />
                  <stop offset="100%" stopColor="#14060e" />
                </linearGradient>
                <linearGradient id="topFlapGrad" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#431427" />
                  <stop offset="100%" stopColor="#2d0d1b" />
                </linearGradient>
                <linearGradient id="leftFlapGrad" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#321020" />
                  <stop offset="100%" stopColor="#250917" />
                </linearGradient>
                <linearGradient id="rightFlapGrad" x1="100%" y1="50%" x2="0%" y2="50%">
                  <stop offset="0%" stopColor="#321020" />
                  <stop offset="100%" stopColor="#250917" />
                </linearGradient>
                <linearGradient id="bottomFlapGrad" x1="50%" y1="100%" x2="50%" y2="0%">
                  <stop offset="0%" stopColor="#3b1324" />
                  <stop offset="100%" stopColor="#2b0d1a" />
                </linearGradient>
              </defs>
            </svg>

            {/* 1. Envelope Back Wall */}
            <div className="envelope-back" />

            {/* 2. Folded Letter Peek (Tucked inside, slides up when open) */}
            <div className={`letter-peek ${isOpen ? 'sliding-up' : ''}`}>
              <div className="peek-content">
                <span className="peek-title script-heading">My Dearest {recipientName}...</span>
                <div className="peek-line short" />
                <div className="peek-line" />
              </div>
            </div>

            {/* 3. Front Flaps (Pocket) */}
            <div className="envelope-pocket">
              <svg viewBox="0 0 360 220" className="pocket-svg" preserveAspectRatio="none">
                {/* Left Triangle */}
                <polygon points="0,0 180,120 0,220" fill="url(#leftFlapGrad)" />
                {/* Right Triangle */}
                <polygon points="360,0 180,120 360,220" fill="url(#rightFlapGrad)" />
                {/* Bottom Triangle */}
                <polygon points="0,220 180,110 360,220" fill="url(#bottomFlapGrad)" />
                {/* Delicate border accents */}
                <line x1="0" y1="220" x2="180" y2="110" stroke="rgba(255, 117, 143, 0.25)" strokeWidth="1" />
                <line x1="360" y1="220" x2="180" y2="110" stroke="rgba(255, 117, 143, 0.25)" strokeWidth="1" />
              </svg>
            </div>

            {/* 4. Top Flap (Hinged at top) */}
            <div className="envelope-top-flap">
              <svg viewBox="0 0 360 135" className="top-flap-svg" preserveAspectRatio="none">
                <polygon points="0,0 360,0 180,135" fill="url(#topFlapGrad)" />
                <line x1="0" y1="0" x2="180" y2="135" stroke="rgba(255, 180, 200, 0.3)" strokeWidth="1" />
                <line x1="360" y1="0" x2="180" y2="135" stroke="rgba(255, 180, 200, 0.3)" strokeWidth="1" />
              </svg>

              {/* 5. 3D Wax Seal right at the flap tip */}
              {!isOpen && (
                <div className="wax-seal">
                  <div className="wax-circle">
                    <Heart size={20} fill="#ffe5ec" color="#ff758f" />
                  </div>
                  <div className="wax-glow" />
                </div>
              )}
            </div>

            {/* Tap Prompt */}
            {!isOpen && (
              <div className="tap-hint-pill">
                <Sparkles size={14} className="sparkle-hint" />
                <span>Tap wax seal to open with love</span>
              </div>
            )}
          </div>
        ) : (
          /* Fully Unfolded Romantic Letter Card */
          <div className="unfolded-letter glass-glow">
            <div className="letter-decor-ribbon" />

            <div className="letter-header-row">
              <div className="seal-badge">
                <Heart size={16} fill="#ff758f" color="#ff758f" />
              </div>
              <button
                type="button"
                className="fold-back-btn"
                onClick={handleFoldBack}
                title="Fold back into envelope"
              >
                <X size={18} />
              </button>
            </div>

            <div className="letter-salutation-box">
              <span className="letter-date">A Special Day</span>
              <h2 className="letter-salutation script-heading">My Dearest {recipientName},</h2>
            </div>

            <div className="letter-paragraphs">
              {letterContent.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="letter-p">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="letter-signature-box">
              <p className="letter-signoff script-heading">{signoff}</p>
            </div>

            <div className="fold-back-action">
              <button
                type="button"
                className="secondary-btn fold-btn"
                onClick={handleFoldBack}
              >
                <ChevronUp size={16} /> Fold Back Into Envelope
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .envelope-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 16px 40px 16px;
          position: relative;
          z-index: 5;
          width: 100%;
        }

        .hero-intro {
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          text-align: center;
        }

        .recipient-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          background: rgba(255, 117, 143, 0.15);
          border: 1px solid rgba(255, 117, 143, 0.35);
          border-radius: 9999px;
          font-size: 0.85rem;
          color: var(--rose-soft);
          font-weight: 500;
        }

        .heart-icon {
          animation: gentle-pulse 1.8s infinite;
        }

        .hero-title {
          font-size: clamp(2.3rem, 7.5vw, 3.6rem);
          color: var(--text-pure);
          text-shadow: 0 0 24px rgba(255, 117, 143, 0.45), 0 0 45px rgba(255, 190, 11, 0.2);
          line-height: 1.15;
        }

        .hero-subtitle {
          font-size: 1rem;
          color: var(--text-muted);
          max-width: 440px;
        }

        /* 3D Envelope Stage */
        .envelope-scene {
          perspective: 1200px;
          width: 100%;
          max-width: 420px;
          display: flex;
          justify-content: center;
          position: relative;
        }

        .envelope-box {
          position: relative;
          width: 350px;
          height: 220px;
          cursor: pointer;
          border-radius: 14px;
          filter: drop-shadow(0 16px 30px rgba(0, 0, 0, 0.65)) drop-shadow(0 0 24px rgba(224, 63, 103, 0.25));
          user-select: none;
          transition: transform 0.3s ease;
        }

        .envelope-box:hover {
          transform: translateY(-4px) scale(1.02);
        }

        .hidden-svg {
          position: absolute;
          width: 0;
          height: 0;
        }

        /* 1. Back Wall */
        .envelope-back {
          position: absolute;
          inset: 0;
          background: url(#backGrad), #1e0915;
          border-radius: 14px;
          border: 1px solid rgba(255, 117, 143, 0.2);
          z-index: 1;
        }

        /* 2. Folded Letter Peek inside */
        .letter-peek {
          position: absolute;
          top: 15px;
          left: 20px;
          right: 20px;
          height: 180px;
          background: #fff8fa;
          border-radius: 10px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
          z-index: 2;
          padding: 16px;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .sliding-up {
          transform: translateY(-80px);
        }

        .peek-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .peek-title {
          font-size: 1.15rem;
          color: #721226;
        }

        .peek-line {
          height: 6px;
          background: rgba(114, 18, 38, 0.12);
          border-radius: 3px;
          width: 100%;
        }

        .peek-line.short {
          width: 60%;
        }

        /* 3. Pocket */
        .envelope-pocket {
          position: absolute;
          inset: 0;
          z-index: 3;
          border-radius: 14px;
          overflow: hidden;
          pointer-events: none;
        }

        .pocket-svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        /* 4. Top Flap */
        .envelope-top-flap {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 135px;
          transform-origin: top center;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 4;
        }

        .top-flap-svg {
          width: 100%;
          height: 100%;
          display: block;
          filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.35));
        }

        .envelope-open .envelope-top-flap {
          transform: rotateX(180deg);
          z-index: 1;
        }

        /* 5. Wax Seal */
        .wax-seal {
          position: absolute;
          top: 96px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .wax-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #ff4d6d, #721226);
          border: 2px solid rgba(255, 220, 230, 0.7);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6), 0 0 16px rgba(255, 117, 143, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: wax-seal-pop 2.4s ease-in-out infinite;
        }

        .wax-glow {
          position: absolute;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(255, 117, 143, 0.2);
          pointer-events: none;
        }

        .tap-hint-pill {
          position: absolute;
          bottom: -46px;
          left: 50%;
          transform: translateX(-50%);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(30, 9, 21, 0.85);
          border: 1px solid rgba(255, 117, 143, 0.4);
          padding: 6px 16px;
          border-radius: 9999px;
          color: var(--rose-soft);
          font-size: 0.82rem;
          font-weight: 500;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
        }

        .sparkle-hint {
          animation: gentle-pulse 1.2s infinite;
        }

        /* Fully Unfolded Romantic Letter */
        .unfolded-letter {
          width: 100%;
          background: linear-gradient(135deg, #fffbfd 0%, #fff0f5 100%);
          color: #3b1022;
          border-radius: 20px;
          padding: 30px 24px;
          border: 1px solid rgba(255, 180, 200, 0.5);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 117, 143, 0.2);
          position: relative;
          animation: unfold-letter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .letter-decor-ribbon {
          position: absolute;
          top: 0;
          left: 40px;
          right: 40px;
          height: 4px;
          background: linear-gradient(90deg, #ff758f, #ffbe0b, #ff758f);
          border-radius: 0 0 4px 4px;
        }

        .letter-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .seal-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 117, 143, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fold-back-btn {
          background: rgba(114, 18, 38, 0.08);
          border: none;
          color: #721226;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .fold-back-btn:hover {
          background: rgba(114, 18, 38, 0.16);
        }

        .letter-salutation-box {
          margin-bottom: 18px;
        }

        .letter-date {
          font-size: 0.75rem;
          color: #a04260;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .letter-salutation {
          font-size: 1.9rem;
          color: #721226;
          margin-top: 2px;
        }

        .letter-paragraphs {
          display: flex;
          flex-direction: column;
          gap: 14px;
          font-size: 1rem;
          line-height: 1.75;
          color: #4a1529;
        }

        .letter-signature-box {
          margin-top: 28px;
          text-align: right;
        }

        .letter-signoff {
          font-size: 1.65rem;
          color: #9d174d;
        }

        .fold-back-action {
          margin-top: 24px;
          display: flex;
          justify-content: center;
        }

        .fold-btn {
          color: #721226;
          background: rgba(114, 18, 38, 0.08);
          border-color: rgba(114, 18, 38, 0.2);
          font-size: 0.85rem;
        }

        .fold-btn:hover {
          background: rgba(114, 18, 38, 0.14);
        }

        @keyframes wax-seal-pop {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        @keyframes unfold-letter {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </section>
  );
}
