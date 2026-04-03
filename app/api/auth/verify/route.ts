import { NextRequest, NextResponse } from 'next/server';
import { createAuthSession } from '@/lib/auth';
import { extractCallbackToken, verifyAgentkeaCallbackToken } from '@/lib/auth-agentkea';
import { requireAuth } from '@/lib/auth-guard';
import { dbAuthSessions } from '@/lib/db';
import { sessionCache } from '@/lib/session-cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const callbackToken = extractCallbackToken(request);

  if (!callbackToken) {
    const session = await requireAuth();

    if (!session) {
      return NextResponse.json({ valid: false, authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      valid: true,
      authenticated: true,
      session: {
        id: session.id,
        user: session.user,
        createdAt: session.createdAt,
        lastActiveAt: session.lastActiveAt,
        expiresAt: session.expiresAt
      }
    });
  }

  const user = await verifyAgentkeaCallbackToken(callbackToken.key, callbackToken.value);

  if (!user) {
    return NextResponse.json({ valid: false, error: 'Verification failed' }, { status: 401 });
  }

  const session = createAuthSession(user);
  dbAuthSessions.create(session);
  sessionCache.set(session.id, session);
  dbAuthSessions.deleteExpired();

  const response = NextResponse.json({ valid: true, authenticated: true, user: session.user, sessionId: session.id });
  response.cookies.set('ai-learner-session', session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/'
  });

  return response;
}
