import { AuthSession, AuthenticatedUser } from './types';
import { randomBytes } from 'crypto';

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

function sanitizeDatabaseKeyPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function deriveDatabaseKey(authUserId: string): string {
  const sanitized = sanitizeDatabaseKeyPart(authUserId);
  return sanitized || 'anonymous';
}

export function getDatabaseNameForUser(user: Pick<AuthenticatedUser, 'databaseKey'>): string {
  return `user_${user.databaseKey}`;
}

export function createAuthenticatedUser(input: {
  authUserId: string;
  email?: string | null;
  displayName?: string | null;
}): AuthenticatedUser {
  return {
    provider: 'agentkea',
    authUserId: input.authUserId,
    email: input.email ?? null,
    displayName: input.displayName ?? null,
    databaseKey: deriveDatabaseKey(input.authUserId)
  };
}

export function generateSessionId(): string {
  return randomBytes(32).toString('hex');
}

export function createAuthSession(user: AuthenticatedUser): AuthSession {
  const now = Date.now();
  return {
    id: generateSessionId(),
    user,
    createdAt: now,
    lastActiveAt: now,
    expiresAt: now + SESSION_DURATION_MS
  };
}

export function getAgentkeaIdentityFromRequest(headers: Headers): AuthenticatedUser | null {
  const authUserId =
    headers.get('x-agentkea-user-id') ||
    process.env.AUTH_AGENTKEA_DEV_USER_ID ||
    '';

  if (!authUserId) {
    return null;
  }

  const email =
    headers.get('x-agentkea-user-email') ||
    process.env.AUTH_AGENTKEA_DEV_USER_EMAIL ||
    null;

  const displayName =
    headers.get('x-agentkea-user-name') ||
    process.env.AUTH_AGENTKEA_DEV_USER_NAME ||
    null;

  return createAuthenticatedUser({
    authUserId,
    email,
    displayName
  });
}

export function isSessionExpired(session: AuthSession): boolean {
  return session.expiresAt < Date.now();
}

export function shouldUpdateActivity(session: AuthSession): boolean {
  const FIVE_MINUTES = 5 * 60 * 1000;
  return Date.now() - session.lastActiveAt > FIVE_MINUTES;
}
