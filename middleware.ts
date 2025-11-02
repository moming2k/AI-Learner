import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { dbAuthSessions } from '@/lib/db';
import { isSessionExpired, shouldUpdateActivity } from '@/lib/auth';

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/api/auth/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip authentication check for public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Skip auth for static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionId = request.cookies.get('ai-learner-session')?.value;

  if (!sessionId) {
    return redirectToLogin(request);
  }

  // Validate session
  const session = dbAuthSessions.getById(sessionId);

  if (!session) {
    return redirectToLogin(request);
  }

  // Check if session is expired
  if (isSessionExpired(session)) {
    dbAuthSessions.delete(sessionId);
    return redirectToLogin(request);
  }

  // Update last active timestamp if needed
  if (shouldUpdateActivity(session)) {
    dbAuthSessions.updateLastActive(sessionId, Date.now());
  }

  return NextResponse.next();
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', request.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete('ai-learner-session');
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
