import { NextRequest, NextResponse } from 'next/server';
import { dbAuthSessions } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('ai-learner-session')?.value;

    if (sessionId) {
      // Delete session from database
      dbAuthSessions.delete(sessionId);

      // Clear cookie
      cookieStore.delete('ai-learner-session');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
