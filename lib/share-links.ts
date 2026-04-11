import { randomBytes, createHash } from 'crypto';

function getShareBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.AUTH_AGENTKEA_APP_URL ||
    'https://notes.agentkea.com'
  );
}

export function generateShareToken(): string {
  return randomBytes(24).toString('base64url');
}

export function hashShareToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function buildShareUrl(token: string, requestOrigin?: string): string {
  const baseUrl = requestOrigin || getShareBaseUrl();
  return new URL(`/share/${token}`, baseUrl).toString();
}
