import { SiteContent } from './types';

export const DEFAULT_SITE_CONTENT: SiteContent = {
  // Envelope & Hero
  recipientName: 'My Beloved',
  heroTitle: 'Happy Birthday, My Heart',
  heroSubtitle: 'A little world made with love, just for you',
  envelopeLetter: `To the one who brings warmth to every quiet evening and laughter to every dawn:

Today is a celebration of the day the world was blessed with your radiant light. Every memory we share is a treasure I hold close, and every day by your side feels like poetry in motion.

May this new year of your life be filled with gentle mornings, boundless joy, and all the love your heart can hold. Blow out the candles and make a wish—the universe is listening tonight.`,
  envelopeSignoff: 'Forever & Always, Yours',

  // Cake & Candle
  candleCount: 3,
  cakeWishPrompt: 'Make a wish and blow gently into your microphone, or tap the candles!',
  cakeBlownOutMessage: 'May all your deepest dreams and sweetest wishes come true! ✨🎂',

  // Photos (High-quality romantic placeholder images from Unsplash with warm tones)
  photos: [
    {
      id: 'photo-1',
      url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=800&q=80',
      caption: 'The golden afternoon our laughter echoed along the shore',
      date: 'May 14, 2024',
      location: 'Golden Coast',
      order: 1
    },
    {
      id: 'photo-2',
      url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80',
      caption: 'Wrapped up in cozy warmth beneath the starlight',
      date: 'October 28, 2024',
      location: 'Autumn Hills',
      order: 2
    },
    {
      id: 'photo-3',
      url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80',
      caption: 'Dancing under the fairy lights like no one was watching',
      date: 'February 14, 2025',
      location: 'The Old Garden',
      order: 3
    },
    {
      id: 'photo-4',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      caption: 'Your radiant smile that melts away every cloud',
      date: 'August 19, 2025',
      location: 'Sunset Terrace',
      order: 4
    }
  ],

  // Music
  musicTitle: 'Romantic Acoustic Melody',
  // Gentle royalty-free romantic piano/acoustic preview mp3
  musicUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=romantic-piano-112199.mp3',
  musicAutoplayOnFirstTap: true,

  // Countdown
  countdownTargetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 7 days from now
  countdownTitle: 'Counting Down To Your Special Moment',
  countdownCelebrationText: '🎉 Happy Birthday! The celebration has begun! 💖',

  // Wishes Wall (Phase 5)
  wishesEnabled: true,
  wishesMaxLength: 200,

  // Scratch Card (Phase 5)
  scratchCard: {
    revealType: 'text',
    surpriseText: '🎟️ Secret Birthday Gift: A weekend getaway under the stars, just you and me! 💖',
    scratchPercentageThreshold: 50
  },

  // Quiz (Phase 5)
  quizQuestions: [
    {
      id: 'q-1',
      question: 'Where was our very first spontaneous coffee date?',
      options: ['The corner vintage cafe', 'The seaside bakery', 'Under the park gazebo', 'The midnight bookstore'],
      correctIndex: 0,
      explanation: 'We ordered hot chocolate and talked until closing time!'
    },
    {
      id: 'q-2',
      question: 'What is my absolute favorite thing about your smile?',
      options: ['The sweet crinkle by your eyes', 'How it lights up an entire room', 'The contagious laugh that follows', 'All of the above!'],
      correctIndex: 3,
      explanation: 'Every little thing about you is perfection.'
    }
  ],
  quizPassingScore: 2,
  quizSuccessMessage: 'You know our love story by heart! 100% soulmates! 💕',

  // Finale
  finalLoveLetter: 'Thank you for being my anchor, my sanctuary, and my greatest joy. Happy Birthday, darling.',
  finalSignature: 'With all my endless devotion ❤️'
};
