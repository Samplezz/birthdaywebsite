import { head } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { fetchPrivateBlob, verifySessionToken } from '@birthday/shared/server';

export const dynamic = 'force-dynamic';

const BLOB_PATHNAME_PATTERN = /^(?:photos|audio)\/[A-Za-z0-9][A-Za-z0-9._-]*$/;

/**
 * Authenticated media proxy for the birthday site.
 * The handler also validates the visitor session so direct route invocation is protected.
 *
 * Usage: GET /api/media?pathname=<blobPathname>
 *
 * Streams private Vercel Blob content to the authenticated visitor.
 * Supports Range requests for audio seeking.
 */
export async function GET(req: NextRequest) {
  const sessionToken = req.cookies.get('visitor_session')?.value;
  const session = sessionToken ? await verifySessionToken(sessionToken, 'visitor') : null;

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Visitor session required.' }, { status: 401 });
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

    const contentType = blobResponse.headers.get('content-type') || 'application/octet-stream';
    const contentLength = blobResponse.headers.get('content-length');
    const acceptRanges = blobResponse.headers.get('accept-ranges') || 'bytes';
    const contentRange = blobResponse.headers.get('content-range');

    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Accept-Ranges': acceptRanges,
    });

    if (contentLength) headers.set('Content-Length', contentLength);
    if (contentRange) headers.set('Content-Range', contentRange);

    return new NextResponse(blobResponse.body, {
      status: blobResponse.status,
      headers,
    });
  } catch (err) {
    if (err instanceof Error && /not found|not_found|404/i.test(err.message)) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }
    console.error('Media proxy error:', err);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}
