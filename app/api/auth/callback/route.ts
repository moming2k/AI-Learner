import { NextRequest, NextResponse } from 'next/server';
import { createAuthSession } from '@/lib/auth';
import { extractCallbackToken, sanitizeReturnTo, verifyAgentkeaCallbackToken } from '@/lib/auth-agentkea';
import { dbAuthSessions } from '@/lib/db';
import { sessionCache } from '@/lib/session-cache';
import { ensureUserActiveLibrary } from '@/lib/user-library-preferences';

export async function GET(request: NextRequest) {
  try {
    const callbackToken = extractCallbackToken(request);
    const from = sanitizeReturnTo(request.nextUrl.searchParams.get('from'));
    const loginUrl = new URL('/login', request.nextUrl.origin);
    loginUrl.searchParams.set('from', from);

    if (!callbackToken) {
      loginUrl.searchParams.set('error', 'missing_callback_token');
      return NextResponse.redirect(loginUrl);
    }

    const user = await verifyAgentkeaCallbackToken(callbackToken.key, callbackToken.value);

    if (!user) {
      loginUrl.searchParams.set('error', 'verification_failed');
      return NextResponse.redirect(loginUrl);
    }

    ensureUserActiveLibrary(user);

    const session = createAuthSession(user);
    dbAuthSessions.create(session);
    sessionCache.set(session.id, session);
    dbAuthSessions.deleteExpired();

    const destination = new URL(from, request.nextUrl.origin);
    const response = NextResponse.redirect(destination);
    response.cookies.set('ai-learner-session', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Auth callback error:', error);
    const loginUrl = new URL('/login', request.nextUrl.origin);
    loginUrl.searchParams.set('error', 'callback_error');
    return NextResponse.redirect(loginUrl);
  }
}
