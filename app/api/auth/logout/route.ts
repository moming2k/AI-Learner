import { NextRequest, NextResponse } from 'next/server';
import { dbAuthSessions } from '@/lib/db';
import { sessionCache } from '@/lib/session-cache';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('ai-learner-session')?.value;

    if (sessionId) {
      // Delete session from database
      dbAuthSessions.delete(sessionId);
      
      // Remove session from cache
      sessionCache.delete(sessionId);

      // Clear cookie
      // Delete cookie on response so client removes it
      const response = NextResponse.json({ success: true });
      response.cookies.delete('ai-learner-session');
      return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
