import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, requireAuthenticatedUser } from '@/lib/auth-guard';
import {
  createCustomLibraryForUser,
  ensureUserActiveLibrary,
  listAvailableLibrariesForUser,
  setUserActiveLibrary,
} from '@/lib/user-library-preferences';

export async function GET() {
  const authError = await checkAuth();
  if (authError) return authError;

  const user = await requireAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const preference = ensureUserActiveLibrary(user);
    const libraries = listAvailableLibrariesForUser(user);

    return NextResponse.json({
      libraries,
      activeLibraryId: preference.activeLibraryId,
      activeLibraryName: preference.activeLibraryName,
      personalLibraryId: preference.personalLibraryId,
      personalLibraryName: preference.personalLibraryName,
    });
  } catch (error) {
    console.error('Error listing libraries:', error);
    return NextResponse.json({ error: 'Failed to list libraries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  const user = await requireAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';

    if (!name) {
      return NextResponse.json({ error: 'Library name is required' }, { status: 400 });
    }

    const created = createCustomLibraryForUser(user, name);
    const preference = setUserActiveLibrary(user, created.id);
    const libraries = listAvailableLibrariesForUser(user);

    return NextResponse.json({
      ok: true,
      createdLibrary: created,
      libraries,
      activeLibraryId: preference.activeLibraryId,
      activeLibraryName: preference.activeLibraryName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create library';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
