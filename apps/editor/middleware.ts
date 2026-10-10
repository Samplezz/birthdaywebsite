import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// 100% Web API & Edge Runtime Compatible (No Node crypto)
async function verifyEditorSession(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const rawSecret =
      process.env.EDITOR_SESSION_SECRET ||
      'temporary-dev-secret-please-change-in-production-min-32-chars-editor';
    const secret = new TextEncoder().encode(rawSecret);
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return payload.role === 'editor';
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static assets, robots.txt, and login endpoints
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/robots.txt' ||
    pathname === '/login' ||
    pathname === '/api/auth/login'
  ) {
    return NextResponse.next();
  }

  // Check editor session cookie
  const sessionCookie = req.cookies.get('editor_session')?.value;
  const isValid = sessionCookie ? await verifyEditorSession(sessionCookie) : false;

  if (!isValid) {
    // If API route, return 401 JSON
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized. Editor session required.' }, { status: 401 });
    }

    // Redirect to login page
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
