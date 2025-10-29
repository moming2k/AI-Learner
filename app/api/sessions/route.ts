import { NextRequest, NextResponse } from 'next/server';
import { getDbSessions } from '@/lib/db';
import { getDatabaseName } from '@/lib/db-utils';
import { LearningSession } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const dbName = getDatabaseName(request);
    const dbSessions = getDbSessions(dbName);

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const current = searchParams.get('current');

    if (current === 'true') {
      const sessionId = dbSessions.getCurrent();
      if (!sessionId) {
        return NextResponse.json({ session: null });
      }
      const session = dbSessions.getById(sessionId);
      return NextResponse.json({ session });
    }

    if (id) {
      const session = dbSessions.getById(id);
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }
      return NextResponse.json(session);
    }

    const sessions = dbSessions.getAll();
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error in sessions GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const dbName = getDatabaseName(request);
    const dbSessions = getDbSessions(dbName);

    const session: LearningSession = await request.json();

    if (!session.id || !session.name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    dbSessions.save(session);
    dbSessions.setCurrent(session.id);
    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Error in sessions POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const dbName = getDatabaseName(request);
    const dbSessions = getDbSessions(dbName);

    dbSessions.deleteAll();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in sessions DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
