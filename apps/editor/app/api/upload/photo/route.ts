import { NextRequest, NextResponse } from 'next/server';
import { uploadPrivateBlob, validateUpload, STORAGE_LIMITS } from '@birthday/shared/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/upload/photo
 * 
 * Receives a photo file via multipart form data, validates it server-side,
 * and uploads to Vercel Blob in PRIVATE mode.
 * 
 * Expects: FormData with field "file" (image/webp, image/jpeg, image/png)
 *          and optional "currentPhotoCount" (number string)
 * 
 * Photos should be converted to WebP client-side (which also strips EXIF).
 * Server re-validates type and size before uploading.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const currentCountStr = formData.get('currentPhotoCount') as string | null;
    const currentPhotoCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Server-side validation of type, size, and count
    validateUpload('photos', file.type, file.size, currentPhotoCount);

    // Read file into buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Double-check actual received size matches
    if (buffer.length > STORAGE_LIMITS.photos.maxBytes) {
      return NextResponse.json(
        { error: `File exceeds ${(STORAGE_LIMITS.photos.maxBytes / (1024 * 1024)).toFixed(1)} MB limit` },
        { status: 413 }
      );
    }

    const result = await uploadPrivateBlob(
      `photos/${Date.now()}-${file.name || 'photo.webp'}`,
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
    const message = err instanceof Error ? err.message : 'Photo upload failed';
    console.error('Photo upload error:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
