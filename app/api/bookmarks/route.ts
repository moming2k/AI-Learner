import { NextRequest, NextResponse } from 'next/server';
import { dbBookmarks } from '@/lib/db';
import { Bookmark } from '@/lib/types';

export async function GET() {
  try {
    const bookmarks = dbBookmarks.getAll();
    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error('Error in bookmarks GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const bookmark: Bookmark = await request.json();
    
    if (!bookmark.pageId || !bookmark.title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    dbBookmarks.add(bookmark);
    return NextResponse.json({ success: true, bookmark });
  } catch (error) {
    console.error('Error in bookmarks POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageId = searchParams.get('pageId');

    if (pageId) {
      dbBookmarks.remove(pageId);
      return NextResponse.json({ success: true });
    }

    if (searchParams.get('all') === 'true') {
      dbBookmarks.deleteAll();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Missing pageId parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error in bookmarks DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
