import { NextRequest } from 'next/server';
import { createAuthenticatedUser } from './auth';
import { AuthenticatedUser } from './types';

const DEFAULT_AUTH_BASE_URL = 'https://auth.agentkea.com';
const CALLBACK_TOKEN_PARAM_CANDIDATES = ['token', 'jwt', 'code', 'session'] as const;

type CallbackTokenParam = (typeof CALLBACK_TOKEN_PARAM_CANDIDATES)[number];

interface VerifySuccessPayload {
  valid?: boolean;
  user?: Record<string, unknown> | null;
  [key: string]: unknown;
}

function getAuthBaseUrl(): string {
  return (process.env.AUTH_AGENTKEA_BASE_URL || DEFAULT_AUTH_BASE_URL).replace(/\/$/, '');
}

export function getAgentkeaLoginUrl(returnTo?: string | null): string {
  const authBaseUrl = getAuthBaseUrl();
  const appBaseUrl = process.env.AUTH_AGENTKEA_APP_URL || process.env.NEXT_PUBLIC_APP_URL;

  if (!appBaseUrl) {
    throw new Error('AUTH_AGENTKEA_APP_URL or NEXT_PUBLIC_APP_URL must be configured for auth redirects.');
  }

  const callbackUrl = new URL('/api/auth/callback', appBaseUrl);
  if (returnTo) {
    callbackUrl.searchParams.set('from', returnTo);
  }

  const loginUrl = new URL('/login', authBaseUrl);
  loginUrl.searchParams.set('redirect_uri', callbackUrl.toString());

  return loginUrl.toString();
}

export function extractCallbackToken(request: NextRequest): { key: CallbackTokenParam; value: string } | null {
  for (const key of CALLBACK_TOKEN_PARAM_CANDIDATES) {
    const value = request.nextUrl.searchParams.get(key)?.trim();
    if (value) {
      return { key, value };
    }
  }

  return null;
}

function extractUserId(payload: VerifySuccessPayload): string | null {
  const user = payload.user && typeof payload.user === 'object' ? payload.user : null;
  const candidates = [
    user?.authUserId,
    user?.userId,
    user?.id,
    user?.sub,
    payload.authUserId,
    payload.userId,
    payload.id,
    payload.sub
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

function extractEmail(payload: VerifySuccessPayload): string | null {
  const user = payload.user && typeof payload.user === 'object' ? payload.user : null;
  const candidates = [user?.email, payload.email];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

function extractDisplayName(payload: VerifySuccessPayload): string | null {
  const user = payload.user && typeof payload.user === 'object' ? payload.user : null;
  const candidates = [user?.displayName, user?.name, payload.displayName, payload.name];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

function buildVerifyAttemptUrls(key: CallbackTokenParam, value: string): URL[] {
  const authBaseUrl = getAuthBaseUrl();
  const keysToTry = Array.from(new Set([key, 'token']));

  return keysToTry.map((candidateKey) => {
    const url = new URL('/api/verify', authBaseUrl);
    url.searchParams.set(candidateKey, value);
    return url;
  });
}

async function verifyFromResponse(response: Response): Promise<AuthenticatedUser | null> {
  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as VerifySuccessPayload;

  if (payload.valid === false) {
    return null;
  }

  const authUserId = extractUserId(payload);
  if (!authUserId) {
    return null;
  }

  return createAuthenticatedUser({
    authUserId,
    email: extractEmail(payload),
    displayName: extractDisplayName(payload)
  });
}

export async function verifyAgentkeaCallbackToken(key: CallbackTokenParam, value: string): Promise<AuthenticatedUser | null> {
  const urls = buildVerifyAttemptUrls(key, value);

  for (const url of urls) {
    try {
      const queryResponse = await fetch(url, {
        method: 'GET',
        cache: 'no-store'
      });
      const verifiedViaQuery = await verifyFromResponse(queryResponse);
      if (verifiedViaQuery) {
        return verifiedViaQuery;
      }
    } catch (error) {
      console.error('AgentKea query verification attempt failed:', error);
    }
  }

  try {
    const headerResponse = await fetch(new URL('/api/verify', getAuthBaseUrl()), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Authorization: 'Bearer ' + value
      }
    });
    return await verifyFromResponse(headerResponse);
  } catch (error) {
    console.error('AgentKea header verification attempt failed:', error);
    return null;
  }
}
