import { NextRequest, NextResponse } from 'next/server';
import { getDbMindmap } from '@/lib/db';
import { getDatabaseName } from '@/lib/db-utils';
import { KnowledgeNode } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const dbName = getDatabaseName(request);
    const dbMindmap = getDbMindmap(dbName);

    // Support fetching single node by ID for performance optimization
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      const node = dbMindmap.getById(id);
      if (!node) {
        return NextResponse.json({ error: 'Node not found' }, { status: 404 });
      }
      return NextResponse.json(node);
    }

    const nodes = dbMindmap.getAll();
    return NextResponse.json(nodes);
  } catch (error) {
    console.error('Error in mindmap GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const dbName = getDatabaseName(request);
    const dbMindmap = getDbMindmap(dbName);

    const body = await request.json();

    // Support batch saves for performance optimization
    if (Array.isArray(body.nodes)) {
      try {
        dbMindmap.transaction(() => {
          for (const node of body.nodes) {
            if (!node.id || !node.title || node.depth === undefined) {
              throw new Error('Missing required fields in one or more nodes');
            }
            dbMindmap.save(node);
          }
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Missing required fields in one or more nodes';
        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: true, count: body.nodes.length });
    }

    // Single node save (backwards compatibility)
    const node: KnowledgeNode = body;
    if (!node.id || !node.title || node.depth === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    dbMindmap.save(node);
    return NextResponse.json({ success: true, node });
  } catch (error) {
    console.error('Error in mindmap POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const dbName = getDatabaseName(request);
    const dbMindmap = getDbMindmap(dbName);

    dbMindmap.deleteAll();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in mindmap DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
