import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_ROUTES = ['/setup', '/lock', '/api/auth/setup', '/api/auth/login', '/api/auth/salt', '/api/capabilities', '/api/admin/seed', '/_next', '/sw.js', '/manifest.json', '/icons'];
const CRON_ROUTES = ['/api/cron/'];

const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? '');

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (CRON_ROUTES.some(r => pathname.startsWith(r))) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return NextResponse.next();
  }

  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get('vera_session');
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/lock', req.url));
  }

  try {
    await jwtVerify(sessionCookie.value, SESSION_SECRET);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL('/lock', req.url));
    response.cookies.delete('vera_session');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
