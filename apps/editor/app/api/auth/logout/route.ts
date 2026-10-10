import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@birthday/shared/server';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('editor_session')?.value;
  if (!token || !(await verifySessionToken(token, 'editor'))) {
    return NextResponse.json({ error: 'Unauthorized. Editor session required.' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true, message: 'Logged out of Studio' });
  response.cookies.set('editor_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return response;
}
