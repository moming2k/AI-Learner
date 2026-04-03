import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sessionCache } from './session-cache';
import { isSessionExpired, getDatabaseNameForUser } from './auth';
import { AuthSession, AuthenticatedUser } from './types';

export function isAuthRequired(): boolean {
  if (process.env.REQUIRE_AUTH === 'false') {
    return false;
  }

  return process.env.NODE_ENV === 'production' || process.env.REQUIRE_AUTH === 'true';
}

export async function requireAuth(): Promise<AuthSession | null> {
  if (!isAuthRequired()) {
    return null;
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get('ai-learner-session')?.value;

  if (!sessionId) {
    return null;
  }

  const session = sessionCache.get(sessionId);

  if (!session) {
    return null;
  }

  if (isSessionExpired(session)) {
    sessionCache.delete(sessionId);
    return null;
  }

  return session;
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await requireAuth();
  return session?.user ?? null;
}

export async function getCurrentUserDatabaseName(): Promise<string | null> {
  const user = await requireAuthenticatedUser();
  return user ? getDatabaseNameForUser(user) : null;
}

export function unauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export async function checkAuth(): Promise<NextResponse | null> {
  const session = await requireAuth();

  if (isAuthRequired() && !session) {
    return unauthorizedResponse();
  }

  return null;
}
