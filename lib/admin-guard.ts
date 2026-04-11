import { unauthorizedResponse } from './auth-guard';
import { requireAuthenticatedUser } from './auth-guard';

const ALLOWED_ADMIN_EMAIL = 'chrischanauk@gmail.com';

export async function requireAdminUser() {
  const user = await requireAuthenticatedUser();

  if (!user) {
    return { user: null, error: unauthorizedResponse('Not authenticated') };
  }

  const email = user.email?.trim().toLowerCase();
  if (email !== ALLOWED_ADMIN_EMAIL) {
    return { user: null, error: unauthorizedResponse('Admin access required') };
  }

  return { user, error: null };
}
