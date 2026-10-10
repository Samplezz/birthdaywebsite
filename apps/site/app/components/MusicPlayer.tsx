'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Music, Play, Pause } from 'lucide-react';

interface MusicPlayerProps {
  musicUrl: string;
  musicTitle: string;
  autoPlayTrigger?: boolean;
}

export default function MusicPlayer({ musicUrl, musicTitle, autoPlayTrigger }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasStartedOnce, setHasStartedOnce] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, []);

  // When parent signals autoplay (e.g., tap on envelope)
  useEffect(() => {
    if (autoPlayTrigger && audioRef.current && !hasStartedOnce) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setHasStartedOnce(true);
      }).catch((err) => {
        console.warn('Autoplay prevented by browser, waiting for tap:', err);
      });
    }
  }, [autoPlayTrigger, hasStartedOnce]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setHasStartedOnce(true);
      }).catch(console.error);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="music-player-container">
      {/* Hidden audio element pointing directly to storage url (supports Range requests / seeking) */}
      <audio
        ref={audioRef}
        src={musicUrl}
        preload="metadata"
        loop
      />

      <div className="glass-panel music-pill">
        <button
          onClick={togglePlay}
          className="play-btn"
          aria-label={isPlaying ? 'Pause music' : 'Play music'}
        >
          {isPlaying ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
        </button>

        <div className="track-info">
          <div className="track-header">
            <Music size={13} className={isPlaying ? 'music-icon pulsing' : 'music-icon'} />
            <span className="track-title">{musicTitle || 'Birthday Melody'}</span>
          </div>
          
          {/* Seek bar supporting direct seeking */}
          <div className="seek-wrapper">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="seek-slider"
              aria-label="Seek audio"
            />
            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>

        <button
          onClick={toggleMute}
          className="mute-btn"
          aria-label={isMuted ? 'Unmute music' : 'Mute music'}
        >
          {isMuted ? (
            <VolumeX size={19} className="muted-icon" />
          ) : (
            <Volume2 size={19} className="active-icon" />
          )}
        </button>
      </div>

      <style jsx>{`
        .music-player-container {
          position: fixed;
          bottom: 24px;
          right: 20px;
          z-index: 99;
          max-width: calc(100vw - 40px);
        }

        .music-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 14px;
          border-radius: 9999px;
          background: rgba(30, 10, 24, 0.85);
          border: 1px solid rgba(255, 117, 143, 0.35);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 16px rgba(224, 63, 103, 0.25);
        }

        .play-btn, .mute-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: var(--text-soft);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.15s ease, background 0.15s ease;
          flex-shrink: 0;
        }

        .play-btn:hover, .mute-btn:hover {
          background: rgba(255, 117, 143, 0.3);
          transform: scale(1.08);
        }

        .track-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 130px;
          max-width: 170px;
        }

        .track-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .music-icon {
          color: var(--rose-soft);
        }

        .pulsing {
          animation: gentle-pulse 1.4s ease-in-out infinite;
        }

        .track-title {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-soft);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .seek-wrapper {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .seek-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 3px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }

        .seek-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--rose-soft);
          cursor: pointer;
        }

        .time-display {
          font-size: 0.65rem;
          color: var(--text-muted);
          font-variant-numeric: tabular-nums;
          flex-shrink: 0;
        }

        .muted-icon {
          color: #ff4d6d;
        }

        .active-icon {
          color: var(--candle-warm);
        }

        @keyframes gentle-pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
