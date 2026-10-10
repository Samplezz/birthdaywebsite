import { head } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { fetchPrivateBlob, verifySessionToken } from '@birthday/shared/server';

export const dynamic = 'force-dynamic';

const BLOB_PATHNAME_PATTERN = /^(?:photos|audio)\/[A-Za-z0-9][A-Za-z0-9._-]*$/;

export async function GET(req: NextRequest) {
  const sessionToken = req.cookies.get('editor_session')?.value;
  const session = sessionToken ? await verifySessionToken(sessionToken, 'editor') : null;

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Editor session required.' }, { status: 401 });
  }

  const pathname = req.nextUrl.searchParams.get('pathname');
  const rangeHeader = req.headers.get('range');

  if (!pathname || !BLOB_PATHNAME_PATTERN.test(pathname)) {
    return NextResponse.json({ error: 'Invalid media pathname' }, { status: 400 });
  }

  try {
    const blob = await head(pathname);
    const blobResponse = await fetchPrivateBlob(blob.url, rangeHeader ?? undefined);

    if (blobResponse.status === 404) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    if (blobResponse.status !== 200 && blobResponse.status !== 206) {
      return NextResponse.json({ error: 'Media upstream unavailable' }, { status: 502 });
    }

    const headers = new Headers({
      'Content-Type': blobResponse.headers.get('content-type') || 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Accept-Ranges': blobResponse.headers.get('accept-ranges') || 'bytes',
    });

    for (const headerName of ['content-length', 'content-range']) {
      const value = blobResponse.headers.get(headerName);
      if (value) headers.set(headerName, value);
    }

    return new NextResponse(blobResponse.body, {
      status: blobResponse.status,
      headers,
    });
  } catch (err) {
    if (err instanceof Error && /not found|not_found|404/i.test(err.message)) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }
    console.error('Editor media proxy error:', err);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}