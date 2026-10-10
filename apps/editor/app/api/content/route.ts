import { NextRequest, NextResponse } from 'next/server';
import { getSiteContent, saveSiteContent, sanitizeText, initializeDatabase, SiteContent } from '@birthday/shared/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initializeDatabase();
    const content = await getSiteContent();
    return NextResponse.json({ success: true, content });
  } catch (err) {
    console.error('Failed to get content:', err);
    return NextResponse.json({ error: 'Failed to load content' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await initializeDatabase();
    const body = (await req.json()) as SiteContent;

    if (!body || !body.recipientName) {
      return NextResponse.json({ error: 'Invalid content data payload' }, { status: 400 });
    }

    // Rigorous XSS Sanitization for all string fields
    const sanitizedContent: SiteContent = {
      ...body,
      recipientName: sanitizeText(body.recipientName),
      heroTitle: sanitizeText(body.heroTitle),
      heroSubtitle: sanitizeText(body.heroSubtitle),
      envelopeLetter: sanitizeText(body.envelopeLetter),
      envelopeSignoff: sanitizeText(body.envelopeSignoff),
      cakeWishPrompt: sanitizeText(body.cakeWishPrompt),
      cakeBlownOutMessage: sanitizeText(body.cakeBlownOutMessage),
      countdownTitle: sanitizeText(body.countdownTitle),
      countdownCelebrationText: sanitizeText(body.countdownCelebrationText),
      musicTitle: sanitizeText(body.musicTitle),
      photos: body.photos.map((p) => ({
        ...p,
        caption: sanitizeText(p.caption),
        date: sanitizeText(p.date),
        location: p.location ? sanitizeText(p.location) : undefined,
      })),
      quizQuestions: body.quizQuestions.map((q) => ({
        ...q,
        question: sanitizeText(q.question),
        options: q.options.map(sanitizeText),
        explanation: q.explanation ? sanitizeText(q.explanation) : undefined,
      })),
      scratchCard: {
        ...body.scratchCard,
        surpriseText: sanitizeText(body.scratchCard.surpriseText),
      },
      finalLoveLetter: sanitizeText(body.finalLoveLetter),
      finalSignature: sanitizeText(body.finalSignature),
      quizSuccessMessage: sanitizeText(body.quizSuccessMessage),
    };

    await saveSiteContent(sanitizedContent);

    return NextResponse.json({ success: true, message: 'Content saved and published!' });
  } catch (err) {
    console.error('Failed to save content:', err);
    return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
  }
}
