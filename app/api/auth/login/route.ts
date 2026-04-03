import { NextRequest, NextResponse } from 'next/server';
import { createAuthSession, getAgentkeaIdentityFromRequest } from '@/lib/auth';
import { dbAuthSessions } from '@/lib/db';
import { sessionCache } from '@/lib/session-cache';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const user = getAgentkeaIdentityFromRequest(request.headers);

    if (!user) {
      return NextResponse.json(
        {
          error: 'AgentKea identity is not available yet. Configure trusted auth.agentkea.com callback headers, or set AUTH_AGENTKEA_DEV_USER_ID for development.'
        },
        { status: 401 }
      );
    }

    const session = createAuthSession(user);
    dbAuthSessions.create(session);
    sessionCache.set(session.id, session);
    dbAuthSessions.deleteExpired();

    const cookieStore = await cookies();
    cookieStore.set('ai-learner-session', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/'
    });

    return NextResponse.json({ success: true, user: session.user });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
