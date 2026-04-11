import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, requireAuthenticatedUser } from '@/lib/auth-guard';
import { setUserActiveLibrary } from '@/lib/user-library-preferences';

export async function POST(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  const user = await requireAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const libraryId = typeof body?.libraryId === 'string' ? body.libraryId.trim() : '';

    if (!libraryId) {
      return NextResponse.json({ error: 'libraryId is required' }, { status: 400 });
    }

    const preference = setUserActiveLibrary(user, libraryId);

    return NextResponse.json({
      ok: true,
      activeLibraryId: preference.activeLibraryId,
      activeLibraryName: preference.activeLibraryName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update active library';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
