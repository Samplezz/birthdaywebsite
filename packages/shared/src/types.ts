export interface PhotoMemory {
  id: string;
  url: string; // Private Blob pathname, for example photos/xxx.webp
  caption: string;
  date: string;
  location?: string;
  order: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface GuestWish {
  id: string;
  authorName: string;
  message: string;
  createdAt: string;
  isHidden: boolean;
}

export interface ScratchCardConfig {
  revealType: 'text' | 'image';
  surpriseText: string;
  surpriseImageUrl?: string;
  scratchPercentageThreshold: number; // e.g. 50%
}

export interface SiteContent {
  // 1. Envelope & Hero
  recipientName: string;
  heroTitle: string;
  heroSubtitle: string;
  envelopeLetter: string;
  envelopeSignoff: string;

  // 2. Cake & Candle
  candleCount: number;
  cakeWishPrompt: string;
  cakeBlownOutMessage: string;

  // 3. Photos
  photos: PhotoMemory[];

  // 4. Background Music
  musicTitle: string;
  musicUrl: string; // Private Blob pathname, for example audio/xxx.mp3
  musicAutoplayOnFirstTap: boolean;

  // 5. Countdown
  countdownTargetDate: string; // ISO date-time string e.g. "2026-10-24T00:00:00"
  countdownTitle: string;
  countdownCelebrationText: string;

  // 6. Wishes Wall (Phase 5)
  wishesEnabled: boolean;
  wishesMaxLength: number;

  // 7. Scratch Card (Phase 5)
  scratchCard: ScratchCardConfig;

  // 8. Quiz (Phase 5)
  quizQuestions: QuizQuestion[];
  quizPassingScore: number;
  quizSuccessMessage: string;

  // 9. Fireworks & Finale (Phase 5)
  finalLoveLetter: string;
  finalSignature: string;
}

export interface SessionPayload {
  role: 'visitor' | 'editor';
  createdAt: number;
  expiresAt: number;
}
