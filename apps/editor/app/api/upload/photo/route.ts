import { NextRequest, NextResponse } from 'next/server';
import {
  getSiteContent,
  initializeDatabase,
  uploadPrivateBlob,
  validateUpload,
  STORAGE_LIMITS,
  verifySessionToken,
} from '@birthday/shared/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/upload/photo
 * 
 * Receives a photo file via multipart form data, validates it server-side,
 * and uploads to Vercel Blob in PRIVATE mode.
 * 
 * Expects: FormData with field "file" (WebP) and optional "replacePhotoId".
 * 
 * Photos should be converted to WebP client-side (which also strips EXIF).
 * Server re-validates type and size before uploading.
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
    const replacePhotoId = formData.get('replacePhotoId') as string | null;
    const isScratchPhoto = formData.get('scratchPhoto') === 'true';

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file into buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (file.size !== buffer.length) {
      return NextResponse.json({ error: 'Received file size does not match the uploaded file.' }, { status: 400 });
    }

    if (buffer.length > STORAGE_LIMITS.photos.maxBytes) {
      return NextResponse.json(
        { error: `File exceeds ${(STORAGE_LIMITS.photos.maxBytes / (1024 * 1024)).toFixed(1)} MB limit` },
        { status: 413 }
      );
    }

    if (
      buffer.length < 12 ||
      buffer.toString('ascii', 0, 4) !== 'RIFF' ||
      buffer.toString('ascii', 8, 12) !== 'WEBP'
    ) {
      return NextResponse.json({ error: 'Invalid photo signature. Only WebP files are accepted.' }, { status: 400 });
    }

    validateUpload('photos', file.type, buffer.length);

    await initializeDatabase();
    const content = await getSiteContent();
    const replacingExistingPhoto = replacePhotoId
      ? content.photos.some((photo) => photo.id === replacePhotoId)
      : false;

    const scratchPhotoAlreadyExists = isScratchPhoto && Boolean(content.scratchPhoto);
    if (!replacingExistingPhoto && !scratchPhotoAlreadyExists && content.photos.length >= STORAGE_LIMITS.photos.maxCount) {
      return NextResponse.json(
        { error: `Maximum of ${STORAGE_LIMITS.photos.maxCount} photos reached. Replace an existing photo first.` },
        { status: 400 }
      );
    }

    const safeFileName = (file.name || 'photo.webp').replace(/[^A-Za-z0-9._-]/g, '-');
    const result = await uploadPrivateBlob(
      `photos/${Date.now()}-${safeFileName.slice(0, 60)}`,
      buffer,
      'image/webp'
    );

    return NextResponse.json({
      success: true,
      pathname: result.pathname,
      size: result.size,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Photo upload failed';
    console.error('Photo upload error:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
