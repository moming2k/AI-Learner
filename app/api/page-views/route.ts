import { NextRequest, NextResponse } from 'next/server';
import { getDbPageViews } from '@/lib/db';
import { getDatabaseName } from '@/lib/db-utils';

export async function GET(request: NextRequest) {
  try {
    const dbName = getDatabaseName(request);
    const dbPageViews = getDbPageViews(dbName);

    const searchParams = request.nextUrl.searchParams;
    const pageId = searchParams.get('pageId');
    const idsOnly = searchParams.get('idsOnly');

    // Return only IDs if requested
    if (idsOnly === 'true') {
      const viewedIds = dbPageViews.getAllViewedPageIds();
      return NextResponse.json(viewedIds);
    }

    // Return specific page view if pageId provided
    if (pageId) {
      const pageView = dbPageViews.getByPageId(pageId);
      if (!pageView) {
        return NextResponse.json({ error: 'Page view not found' }, { status: 404 });
      }
      return NextResponse.json(pageView);
    }

    // Return all page views
    const pageViews = dbPageViews.getAll();
    return NextResponse.json(pageViews);
  } catch (error) {
    console.error('Error in page-views GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const dbName = getDatabaseName(request);
    const dbPageViews = getDbPageViews(dbName);

    const body = await request.json();
    const { pageId } = body;

    if (!pageId) {
      return NextResponse.json(
        { error: 'Missing pageId field' },
        { status: 400 }
      );
    }

    dbPageViews.recordView(pageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in page-views POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const dbName = getDatabaseName(request);
    const dbPageViews = getDbPageViews(dbName);

    const searchParams = request.nextUrl.searchParams;
    const pageId = searchParams.get('pageId');

    if (pageId) {
      dbPageViews.deleteByPageId(pageId);
      return NextResponse.json({ success: true });
    }

    if (searchParams.get('all') === 'true') {
      dbPageViews.deleteAll();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Missing pageId parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error in page-views DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
