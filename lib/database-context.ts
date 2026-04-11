import { NextRequest } from 'next/server';
import { requireAuthenticatedUser } from './auth-guard';
import { getActiveLibraryForUser } from './user-library-preferences';
import { getDatabaseNameForUser } from './auth';

export async function getActiveDatabaseName(_request?: NextRequest): Promise<string> {
  const user = await requireAuthenticatedUser();

  if (!user) {
    return 'default';
  }

  try {
    const activeLibrary = getActiveLibraryForUser(user);
    return activeLibrary.databaseName;
  } catch {
    return getDatabaseNameForUser(user);
  }
}
