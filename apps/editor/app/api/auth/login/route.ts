import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  createSessionToken,
  recordRateLimitFailure,
  verifyPassword,
} from '@birthday/shared/server';

export async function POST(req: NextRequest) {
  try {
    // Extract client IP from Vercel headers (first IP in x-forwarded-for or x-real-ip)
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip')?.trim();
    if (!ip) {
      return NextResponse.json({ error: 'Client IP address is unavailable.' }, { status: 400 });
    }

    // 1. Strictly Per-IP & Per-Gate Rate Limiting (Keyed by editor_login:<ip>)
    // Stranger attempts on visitor site CANNOT lock out the owner from the editor
    const rateCheck = await checkRateLimit(`editor_login:${ip}`, 5, 900);
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

    // 2. Server-Side Editor Password Check (Strictly from Environment Variables - Zero hardcoded secrets)
    const storedSecret = process.env.EDITOR_PASSWORD_HASH;
    if (!storedSecret) {
      console.error('CRITICAL ERROR: EDITOR_PASSWORD_HASH is not set in environment.');
      return NextResponse.json(
        { error: 'Server configuration error: editor password is not configured.' },
        { status: 500 }
      );
    }

    const isValid = await verifyPassword(password, storedSecret);

    if (!isValid) {
      const failedRate = await recordRateLimitFailure(`editor_login:${ip}`, 5, 900);
      return NextResponse.json(
        {
          error: 'Incorrect editor password. Access denied.',
          remainingAttempts: failedRate.remaining,
        },
        { status: 401 }
      );
    }

    // 3. Issue Signed HttpOnly, Secure, SameSite=Strict Session Cookie for Editor Role
    const token = await createSessionToken('editor', 7);
    const response = NextResponse.json({ success: true, message: 'Welcome to Birthday Studio!' });

    response.cookies.set('editor_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: unknown) {
    console.error('Editor login error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
