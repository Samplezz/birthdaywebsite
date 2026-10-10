import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// 100% Web API & Edge Runtime Compatible (No Node crypto)
async function verifyVisitorSession(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const rawSecret = process.env.VISITOR_SESSION_SECRET;
    if (!rawSecret) return false;
    const secret = new TextEncoder().encode(rawSecret);
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    return payload.role === 'visitor';
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

  // Check visitor session cookie
  const sessionCookie = req.cookies.get('visitor_session')?.value;
  const isValid = sessionCookie ? await verifyVisitorSession(sessionCookie) : false;

  if (!isValid) {
    // If API route, return 401 JSON
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized. Visitor session required.' }, { status: 401 });
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
