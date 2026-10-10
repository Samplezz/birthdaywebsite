import { NextRequest, NextResponse } from 'next/server';
import {
  deletePrivateBlob,
  getSiteContent,
  getSiteContentHistory,
  saveSiteContent,
  sanitizeText,
  initializeDatabase,
  SiteContent,
  verifySessionToken,
} from '@birthday/shared/server';

export const dynamic = 'force-dynamic';

const BLOB_PATHNAME_PATTERNS = {
  photo: /^photos\/[A-Za-z0-9][A-Za-z0-9._-]*$/,
  audio: /^audio\/[A-Za-z0-9][A-Za-z0-9._-]*$/,
};

export async function GET(req: NextRequest) {
  const token = req.cookies.get('editor_session')?.value;
  if (!token || !(await verifySessionToken(token, 'editor'))) {
    return NextResponse.json({ error: 'Unauthorized. Editor session required.' }, { status: 401 });
  }

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
  const token = req.cookies.get('editor_session')?.value;
  if (!token || !(await verifySessionToken(token, 'editor'))) {
    return NextResponse.json({ error: 'Unauthorized. Editor session required.' }, { status: 401 });
  }

  try {
    await initializeDatabase();
    const oldContent = await getSiteContent();
    const body = (await req.json()) as SiteContent;

    if (!body || !body.recipientName) {
      return NextResponse.json({ error: 'Invalid content data payload' }, { status: 400 });
    }

    if (body.photos.length > 12) {
      return NextResponse.json({ error: 'A maximum of 12 photos is allowed.' }, { status: 400 });
    }

    if (body.quizQuestions.length > 10 || body.quizQuestions.some((question) =>
      question.question.length > 150 ||
      question.options.length < 2 ||
      question.options.length > 4 ||
      question.options.some((option) => option.length > 80) ||
      !Number.isInteger(question.correctIndex) ||
      question.correctIndex < 0 ||
      question.correctIndex >= question.options.length
    )) {
      return NextResponse.json({ error: 'Quiz questions need 2 to 4 options, valid answers, and the stated character limits.' }, { status: 400 });
    }

    if (
      (body.musicUrl !== '' && !BLOB_PATHNAME_PATTERNS.audio.test(body.musicUrl)) ||
      !body.photos.every((photo) => BLOB_PATHNAME_PATTERNS.photo.test(photo.url)) ||
      (body.scratchPhoto !== '' && !BLOB_PATHNAME_PATTERNS.photo.test(body.scratchPhoto))
    ) {
      return NextResponse.json({ error: 'Media values must be private Blob pathnames.' }, { status: 400 });
    }

    if (body.scratchHiddenText.length > 300) {
      return NextResponse.json({ error: 'Scratch hidden text must be 300 characters or fewer.' }, { status: 400 });
    }

    if (body.finalMessage.length > 500) {
      return NextResponse.json({ error: 'Final message must be 500 characters or fewer.' }, { status: 400 });
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
      scratchTitle: sanitizeText(body.scratchTitle),
      scratchHiddenText: sanitizeText(body.scratchHiddenText),
      quizLowScoreMessage: sanitizeText(body.quizLowScoreMessage),
      quizMediumScoreMessage: sanitizeText(body.quizMediumScoreMessage),
      quizHighScoreMessage: sanitizeText(body.quizHighScoreMessage),
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
      finalMessage: sanitizeText(body.finalMessage),
      quizSuccessMessage: sanitizeText(body.quizSuccessMessage),
    };

    await saveSiteContent(sanitizedContent);

    const history = await getSiteContentHistory();
    const candidateMediaPathnames = new Set([
      ...oldContent.photos.map((photo) => photo.url),
      oldContent.musicUrl,
      oldContent.scratchPhoto,
      ...history.flatMap((content) => [
        ...content.photos.map((photo) => photo.url),
        content.musicUrl,
        content.scratchPhoto,
      ]),
    ].filter(Boolean));
    const protectedMediaPathnames = new Set([
      ...sanitizedContent.photos.map((photo) => photo.url),
      sanitizedContent.musicUrl,
      sanitizedContent.scratchPhoto,
      ...(history[0]
        ? [
            ...history[0].photos.map((photo) => photo.url),
            history[0].musicUrl,
            history[0].scratchPhoto,
          ]
        : []),
      ].filter(Boolean));
    const orphanedPathnames = Array.from(candidateMediaPathnames).filter(
      (pathname): pathname is string => Boolean(pathname) && !protectedMediaPathnames.has(pathname)
    );

    const deletionResults = await Promise.allSettled(
      orphanedPathnames.map((pathname) => deletePrivateBlob(pathname))
    );

    deletionResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to delete orphaned media ${orphanedPathnames[index]}:`, result.reason);
      }
    });

    return NextResponse.json({ success: true, message: 'Content saved and published!' });
  } catch (err) {
    console.error('Failed to save content:', err);
    return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
  }
}
