import { NextRequest, NextResponse } from 'next/server';
import { uploadPrivateBlob, validateUpload, STORAGE_LIMITS, verifySessionToken } from '@birthday/shared/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/upload/audio
 *
 * Receives an MP3 audio file via multipart form data, validates it server-side,
 * and uploads to Vercel Blob in PRIVATE mode.
 *
 * Expects: FormData with field "file" (audio/mpeg or audio/mp3)
 *
 * Vercel serverless body limit is ~4.5 MB. Our audio cap is 4 MB, well within that.
 */
export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get('editor_session')?.value;
  const session = sessionToken ? await verifySessionToken(sessionToken, 'editor') : null;

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Editor session required.' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (file.size !== buffer.length) {
      return NextResponse.json({ error: 'Received file size does not match the uploaded file.' }, { status: 400 });
    }

    if (buffer.length > STORAGE_LIMITS.audio.maxBytes) {
      return NextResponse.json(
        { error: `Audio file exceeds ${(STORAGE_LIMITS.audio.maxBytes / (1024 * 1024)).toFixed(0)} MB limit` },
        { status: 413 }
      );
    }

    const hasId3Tag = buffer.length >= 3 && buffer.toString('ascii', 0, 3) === 'ID3';
    const hasMpegFrameSync = buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;

    if (!hasId3Tag && !hasMpegFrameSync) {
      return NextResponse.json({ error: 'Invalid audio signature. Only MP3 files are accepted.' }, { status: 400 });
    }

    validateUpload('audio', file.type, buffer.length);

    const safeFileName = (file.name || 'music.mp3').replace(/[^A-Za-z0-9._-]/g, '-');
    const result = await uploadPrivateBlob(
      `audio/${Date.now()}-${safeFileName.slice(0, 60)}`,
      buffer,
      'audio/mpeg'
    );

    return NextResponse.json({
      success: true,
      pathname: result.pathname,
      size: result.size,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Audio upload failed';
    console.error('Audio upload error:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
