import { NextResponse } from 'next/server';
import { requireAuth, unauthorizedResponse, isAuthRequired } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  // If auth is not required, return success
  if (!isAuthRequired()) {
    return NextResponse.json({
      authenticated: false,
      authRequired: false,
      message: 'Authentication disabled'
    });
  }

  const session = await requireAuth();

  if (!session) {
    return unauthorizedResponse('Not authenticated');
  }

  return NextResponse.json({
    authenticated: true,
    authRequired: true,
    session: {
      id: session.id,
      invitationCode: session.invitationCode,
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
      expiresAt: session.expiresAt
    }
  });
}
