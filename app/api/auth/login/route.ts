import { NextRequest, NextResponse } from 'next/server';
import { createAuthSession, getAgentkeaIdentityFromRequest } from '@/lib/auth';
import { getAgentkeaLoginUrl } from '@/lib/auth-agentkea';
import { dbAuthSessions } from '@/lib/db';
import { sessionCache } from '@/lib/session-cache';

function persistSessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set('ai-learner-session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/'
  });
}

function createLocalSessionResponse(user: ReturnType<typeof getAgentkeaIdentityFromRequest>) {
  if (!user) {
    return NextResponse.json(
      {
        error: 'AgentKea identity is not available yet. Use the browser redirect flow, or set AUTH_AGENTKEA_DEV_USER_ID for development.'
      },
      { status: 401 }
    );
  }

  const session = createAuthSession(user);
  dbAuthSessions.create(session);
  sessionCache.set(session.id, session);
  dbAuthSessions.deleteExpired();

  const response = NextResponse.json({ success: true, user: session.user });
  persistSessionCookie(response, session.id);
  return response;
}

export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get('from');
  const redirectUrl = getAgentkeaLoginUrl(from);
  return NextResponse.redirect(redirectUrl);
}

export async function POST(request: NextRequest) {
  try {
    const user = getAgentkeaIdentityFromRequest(request.headers);
    return createLocalSessionResponse(user);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
