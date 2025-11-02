import { AuthSession } from './types';
import { randomBytes } from 'crypto';

// Session duration: 30 days
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Validates invitation code against environment variable
 */
export function isValidInvitationCode(code: string): boolean {
  const validCodes = getInvitationCodes();
  return validCodes.includes(code.trim().toUpperCase());
}

/**
 * Gets invitation codes from environment variable
 */
export function getInvitationCodes(): string[] {
  const codesEnv = process.env.INVITATION_CODES || '';
  return codesEnv
    .split(',')
    .map(code => code.trim().toUpperCase())
    .filter(code => code.length > 0);
}

/**
 * Generates a secure session ID
 */
export function generateSessionId(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Creates a new auth session
 */
export function createAuthSession(invitationCode: string): AuthSession {
  const now = Date.now();
  return {
    id: generateSessionId(),
    invitationCode: invitationCode.toUpperCase(),
    createdAt: now,
    lastActiveAt: now,
    expiresAt: now + SESSION_DURATION_MS
  };
}

/**
 * Checks if session is expired
 */
export function isSessionExpired(session: AuthSession): boolean {
  return session.expiresAt < Date.now();
}

/**
 * Checks if session needs activity update (last active > 5 minutes ago)
 */
export function shouldUpdateActivity(session: AuthSession): boolean {
  const FIVE_MINUTES = 5 * 60 * 1000;
  return Date.now() - session.lastActiveAt > FIVE_MINUTES;
}
