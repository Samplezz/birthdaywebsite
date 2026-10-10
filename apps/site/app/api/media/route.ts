import { NextRequest, NextResponse } from 'next/server';
import { fetchPrivateBlob } from '@birthday/shared/server';

export const dynamic = 'force-dynamic';

/**
 * Authenticated media proxy for the birthday site.
 * Middleware already enforces a valid visitor session before this route executes.
 *
 * Usage: GET /api/media?url=<blobUrl>
 *
 * Streams private Vercel Blob content to the authenticated visitor.
 * Supports Range requests for audio seeking.
 */
export async function GET(req: NextRequest) {
  const blobUrl = req.nextUrl.searchParams.get('url');

  if (!blobUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Only allow fetching from Vercel Blob storage URLs
  if (!blobUrl.startsWith('https://') || !blobUrl.includes('.blob.vercel-storage.com')) {
    return NextResponse.json({ error: 'Invalid media URL' }, { status: 400 });
  }

  try {
    const blobResponse = await fetchPrivateBlob(blobUrl);

    const contentType = blobResponse.headers.get('content-type') || 'application/octet-stream';
    const contentLength = blobResponse.headers.get('content-length');
    const acceptRanges = blobResponse.headers.get('accept-ranges');

    const headers = new Headers({
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=300', // 5 min cache per session
      'X-Content-Type-Options': 'nosniff',
    });

    if (contentLength) headers.set('Content-Length', contentLength);
    if (acceptRanges) headers.set('Accept-Ranges', acceptRanges);

    // Forward range response headers if present
    const contentRange = blobResponse.headers.get('content-range');
    if (contentRange) headers.set('Content-Range', contentRange);

    return new NextResponse(blobResponse.body, {
      status: blobResponse.status,
      headers,
    });
  } catch (err) {
    console.error('Media proxy error:', err);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}
