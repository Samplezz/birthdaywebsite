import { NextResponse } from 'next/server';
import { getSiteContent, initializeDatabase } from '@birthday/shared/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await initializeDatabase();
    const content = await getSiteContent();

    // Photo and music values are private Blob pathnames.
    // The client fetches media through /api/media?pathname=<blobPathname>, which streams
    // from Vercel Blob with session authentication enforced by middleware.
    return NextResponse.json(
      { success: true, content },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'CDN-Cache-Control': 'no-store',
          'Vercel-CDN-Cache-Control': 'no-store',
        },
      }
    );
  } catch (err) {
    console.error('Failed to get content:', err);
    return NextResponse.json({ error: 'Failed to load content' }, { status: 500 });
  }
}
