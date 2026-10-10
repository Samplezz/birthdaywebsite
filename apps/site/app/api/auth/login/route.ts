import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, createSessionToken, verifyPassword } from '@birthday/shared/server';

export async function POST(req: NextRequest) {
  try {
    // Correctly extract client IP from Vercel headers (first IP in x-forwarded-for or x-real-ip)
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip')?.trim() || '127.0.0.1';

    // 1. Strictly Per-IP & Per-Gate Rate Limiting (Keyed by visitor_login:<ip>)
    // Stranger attempts on visitor site CANNOT lock out the owner or other IPs
    const rateCheck = await checkRateLimit(`visitor_login:${ip}`, 5, 900);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many login attempts. Please wait ${Math.ceil(rateCheck.resetInSeconds / 60)} minutes before trying again.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // 2. Server-Side Password Verification (Strictly from Environment Variables - Zero hardcoded secrets)
    const storedSecret = process.env.VISITOR_PASSWORD_HASH || process.env.VISITOR_PASSWORD;
    if (!storedSecret) {
      console.error('CRITICAL ERROR: VISITOR_PASSWORD_HASH or VISITOR_PASSWORD is not set in environment.');
      return NextResponse.json(
        { error: 'Server configuration error: visitor password is not configured.' },
        { status: 500 }
      );
    }

    const isValid = await verifyPassword(password, storedSecret);

    if (!isValid) {
      return NextResponse.json(
        {
          error: 'Incorrect password. Please try again.',
          remainingAttempts: rateCheck.remaining,
        },
        { status: 401 }
      );
    }

    // 3. Issue Signed HttpOnly, Secure, SameSite=Strict Session Cookie
    const token = await createSessionToken('visitor', 7);
    const response = NextResponse.json({ success: true, message: 'Welcome to the celebration!' });

    response.cookies.set('visitor_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Authentication error';
    console.error('Visitor login error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
