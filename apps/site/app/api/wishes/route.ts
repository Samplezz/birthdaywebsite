import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  createWish,
  getWishes,
  recordRateLimitSuccess,
  sanitizeText,
  verifySessionToken,
} from '@birthday/shared/server';

export const dynamic = 'force-dynamic';

function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip')?.trim() ||
    (process.env.NODE_ENV !== 'production' ? 'local-dev' : null);
}

async function requireVisitor(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('visitor_session')?.value;
  return Boolean(token && await verifySessionToken(token, 'visitor'));
}

export async function GET(req: NextRequest) {
  if (!(await requireVisitor(req))) {
    return NextResponse.json({ error: 'Unauthorized. Visitor session required.' }, { status: 401 });
  }

  try {
    return NextResponse.json({ wishes: await getWishes(false) });
  } catch (err) {
    console.error('Failed to load wishes:', err);
    return NextResponse.json({ error: 'Could not load wishes right now.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireVisitor(req))) {
    return NextResponse.json({ error: 'Unauthorized. Visitor session required.' }, { status: 401 });
  }

  const ip = getClientIp(req);
  if (!ip) {
    return NextResponse.json({ error: 'Client IP address is unavailable.' }, { status: 400 });
  }

  try {
    const rate = await checkRateLimit(`wishes:${ip}`, 10, 3600);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'You have shared a lot of wishes recently. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const name = sanitizeText(typeof body.name === 'string' ? body.name : '').trim();
    const message = sanitizeText(typeof body.message === 'string' ? body.message : '').trim();

    if (!name || !message) {
      return NextResponse.json({ error: 'Please enter your name and a message.' }, { status: 400 });
    }
    if (name.length > 40) {
      return NextResponse.json({ error: 'Your name must be 40 characters or fewer.' }, { status: 400 });
    }
    if (message.length > 280) {
      return NextResponse.json({ error: 'Your wish must be 280 characters or fewer.' }, { status: 400 });
    }

    const wish = await createWish(name, message);
    if (!wish) {
      return NextResponse.json({ error: 'The wishes wall is full right now. Please try again later.' }, { status: 409 });
    }

    await recordRateLimitSuccess(`wishes:${ip}`, 10, 3600);
    return NextResponse.json({ wish }, { status: 201 });
  } catch (err) {
    console.error('Failed to save wish:', err);
    return NextResponse.json({ error: 'Could not save your wish right now.' }, { status: 500 });
  }
}
