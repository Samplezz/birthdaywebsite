import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@birthday/shared/server';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('visitor_session')?.value;
  if (!token || !(await verifySessionToken(token, 'visitor'))) {
    return NextResponse.json({ error: 'Unauthorized. Visitor session required.' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set('visitor_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return response;
}
