'use client';

import React, { useState, useEffect } from 'react';
import { DEFAULT_SITE_CONTENT, SiteContent } from '@birthday/shared';
import Decorations from './components/Decorations';
import MusicPlayer from './components/MusicPlayer';
import EnvelopeLetter from './components/EnvelopeLetter';
import CakeCandles from './components/CakeCandles';
import PhotoGallery from './components/PhotoGallery';
import CountdownTimer from './components/CountdownTimer';
import WishesWall from './components/WishesWall';
import ScratchCard from './components/ScratchCard';
import QuizGame from './components/QuizGame';
import FireworksFinale from './components/FireworksFinale';

export default function BirthdayPage() {
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [musicAutoplayTrigger, setMusicAutoplayTrigger] = useState(false);
  const [grandCelebration, setGrandCelebration] = useState(false);

  // Load content from backend database (with signed storage URLs) without caching
  useEffect(() => {
    fetch('/api/content', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.content) {
          setContent(data.content);
        }
      })
      .catch((err) => console.warn('Could not load dynamic content from server:', err));
  }, []);

  // When user opens envelope, trigger audio playback
  const handleEnvelopeOpen = () => {
    setMusicAutoplayTrigger(true);
  };

  const handleCandlesBlownOut = () => {
    setGrandCelebration(true);
  };

  const handleCountdownZero = () => {
    setGrandCelebration(true);
  };

  return (
    <main className="birthday-main">
      {/* Background decorations: floating balloons, falling confetti, bunting */}
      <Decorations celebrateTrigger={grandCelebration} />

      {/* Persistent floating romantic background music player */}
      <MusicPlayer
        musicUrl={content.musicUrl}
        musicTitle={content.musicTitle}
        autoPlayTrigger={musicAutoplayTrigger}
      />

      <div className="content-flow">
        {/* 1. Countdown */}
        <CountdownTimer
          targetDateString={content.countdownTargetDate}
          countdownTitle={content.countdownTitle}
          celebrationMessage={content.countdownCelebrationText}
        />

        {/* 2. Envelope & Hero Birthday Letter */}
        <EnvelopeLetter
          recipientName={content.recipientName}
          heroTitle={content.heroTitle}
          heroSubtitle={content.heroSubtitle}
          letterContent={content.envelopeLetter}
          signoff={content.envelopeSignoff}
          onOpenLetter={handleEnvelopeOpen}
        />

        {/* 3. Birthday Cake & Blowing Candles */}
        <CakeCandles
          candleCount={content.candleCount}
          wishPrompt={content.cakeWishPrompt}
          blownOutMessage={content.cakeBlownOutMessage}
          onCandlesBlownOut={handleCandlesBlownOut}
        />

        {grandCelebration && <FireworksFinale finalMessage={content.finalMessage} />}

        {/* 5. Cherished Memories, scratch card, quiz and wishes */}
        <PhotoGallery photos={content.photos} />
        <ScratchCard
          title={content.scratchTitle}
          hiddenText={content.scratchHiddenText}
          photoPathname={content.scratchPhoto}
        />
        <QuizGame
          questions={content.quizQuestions}
          lowMessage={content.quizLowScoreMessage}
          mediumMessage={content.quizMediumScoreMessage}
          highMessage={content.quizHighScoreMessage}
        />
        <WishesWall />

        <footer className="site-footer">
          <p className="footer-love script-heading">Made with all my heart, just for you ❤️</p>
          <p className="footer-sub">Private Celebration • Protected with Love</p>
        </footer>
      </div>

      <style jsx>{`
        .birthday-main {
          min-height: 100vh;
          position: relative;
          padding-bottom: 90px;
        }

        .content-flow {
          max-width: 600px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .site-footer {
          margin-top: 50px;
          padding: 30px 16px 20px 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .footer-love {
          font-size: 1.5rem;
          color: var(--rose-soft);
        }

        .footer-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
          letter-spacing: 0.5px;
        }
      `}</style>
    </main>
  );
}
