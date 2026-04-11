import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-guard';
import { getDatabaseName } from '@/lib/db-utils';
import { getDbPages, dbShareLinks } from '@/lib/db';
import { buildShareUrl, generateShareToken, hashShareToken } from '@/lib/share-links';

export async function POST(request: NextRequest) {
  const user = await requireAuthenticatedUser();
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json().catch(() => ({}));
    const pageId = typeof body.pageId === 'string' ? body.pageId.trim() : '';

    if (!pageId) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    const dbName = await getDatabaseName(request);
    const page = getDbPages(dbName).getById(pageId);

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const token = generateShareToken();
    const tokenHash = hashShareToken(token);

    dbShareLinks.deleteByPage(dbName, pageId);
    dbShareLinks.create({
      tokenHash,
      pageId,
      databaseName: dbName,
      createdAt: Date.now(),
      createdByUserId: user.authUserId,
    });

    return NextResponse.json({
      token,
      url: buildShareUrl(token, request.nextUrl.origin),
      page: {
        id: page.id,
        title: page.title,
      },
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
