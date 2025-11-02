import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sessionCache } from './session-cache';
import { isSessionExpired } from './auth';
import { AuthSession } from './types';

/**
 * Check if authentication is required based on environment
 */
export function isAuthRequired(): boolean {
  // Allow disabling auth in development
  if (process.env.REQUIRE_AUTH === 'false') {
    return false;
  }
  // Default to requiring auth in production
  return process.env.NODE_ENV === 'production' || process.env.REQUIRE_AUTH === 'true';
}

/**
 * Require authentication for API routes
 * Returns the authenticated session or sends a 401 response
 *
 * Usage in API routes:
 * ```
 * const session = await requireAuth();
 * if (!session) return; // Response already sent
 * ```
 */
export async function requireAuth(): Promise<AuthSession | null> {
  // Skip auth check if not required
  if (!isAuthRequired()) {
    return null;
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get('ai-learner-session')?.value;

  if (!sessionId) {
    return null;
  }

  // Validate session using cache
  const session = sessionCache.get(sessionId);

  if (!session) {
    return null;
  }

  // Check if session is expired
  if (isSessionExpired(session)) {
    sessionCache.delete(sessionId);
    return null;
  }

  return session;
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}

/**
 * Middleware-style auth check for API routes
 * Returns null if authenticated, or an error response if not
 *
 * Usage in API routes:
 * ```
 * const authError = await checkAuth();
 * if (authError) return authError;
 * ```
 */
export async function checkAuth(): Promise<NextResponse | null> {
  const session = await requireAuth();

  if (isAuthRequired() && !session) {
    return unauthorizedResponse();
  }

  return null;
}
