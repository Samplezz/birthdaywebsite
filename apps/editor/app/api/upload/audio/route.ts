import { NextRequest, NextResponse } from 'next/server';
import { uploadPrivateBlob, validateUpload, STORAGE_LIMITS } from '@birthday/shared/server';

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
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Server-side validation of type and size
    validateUpload('audio', file.type, file.size);

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Double-check actual received size
    if (buffer.length > STORAGE_LIMITS.audio.maxBytes) {
      return NextResponse.json(
        { error: `Audio file exceeds ${(STORAGE_LIMITS.audio.maxBytes / (1024 * 1024)).toFixed(0)} MB limit` },
        { status: 413 }
      );
    }

    const result = await uploadPrivateBlob(
      `audio/${Date.now()}-${file.name || 'music.mp3'}`,
      buffer,
      file.type
    );

    return NextResponse.json({
      success: true,
      url: result.url,
      pathname: result.pathname,
      size: result.size,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Audio upload failed';
    console.error('Audio upload error:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
