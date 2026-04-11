import { NextResponse } from 'next/server';
import { checkAuth, requireAuthenticatedUser } from '@/lib/auth-guard';
import { ensureUserActiveLibrary, listAvailableLibrariesForUser } from '@/lib/user-library-preferences';

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
