import { NextRequest } from 'next/server';
import { getDatabaseNameForUser } from './auth';
import { requireAuthenticatedUser } from './auth-guard';

export async function getDatabaseName(_request?: NextRequest): Promise<string> {
  const user = await requireAuthenticatedUser();

  if (user) {
    return getDatabaseNameForUser(user);
  }

  return 'default';
}
