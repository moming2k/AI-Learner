import { NextRequest, NextResponse } from 'next/server';
import { isValidInvitationCode, createAuthSession } from '@/lib/auth';
import { dbAuthSessions } from '@/lib/db';
import { sessionCache } from '@/lib/session-cache';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invitationCode } = body;

    if (!invitationCode || typeof invitationCode !== 'string') {
      return NextResponse.json(
        { error: 'Invitation code is required' },
        { status: 400 }
      );
    }

    // Validate invitation code
    if (!isValidInvitationCode(invitationCode)) {
      return NextResponse.json(
        { error: 'Invalid invitation code' },
        { status: 401 }
      );
    }

    // Create session
    const session = createAuthSession(invitationCode);
    dbAuthSessions.create(session);
    
    // Add session to cache for immediate availability
    sessionCache.set(session.id, session);

    // Clean up expired sessions
    dbAuthSessions.deleteExpired();

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('ai-learner-session', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
