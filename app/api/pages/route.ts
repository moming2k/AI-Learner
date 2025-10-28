import { NextRequest, NextResponse } from 'next/server';
import { dbPages } from '@/lib/db';
import { WikiPage } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const query = searchParams.get('query');

    if (id) {
      const page = dbPages.getById(id);
      if (!page) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      }
      return NextResponse.json(page);
    }

    if (query) {
      const results = dbPages.search(query);
      return NextResponse.json(results);
    }

    const pages = dbPages.getAll();
    return NextResponse.json(pages);
  } catch (error) {
    console.error('Error in pages GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const page: WikiPage = await request.json();
    
    if (!page.id || !page.title || !page.content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    dbPages.save(page);
    return NextResponse.json({ success: true, page });
  } catch (error) {
    console.error('Error in pages POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    if (action === 'duplicates') {
      const removed = dbPages.removeDuplicates();
      return NextResponse.json({ success: true, removed });
    }

    if (action === 'all') {
      dbPages.deleteAll();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in pages DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
