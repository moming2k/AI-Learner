import { NextRequest, NextResponse } from 'next/server';
import { getDbMindmap } from '@/lib/db';
import { getDatabaseName } from '@/lib/db-utils';
import { KnowledgeNode } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const dbName = getDatabaseName(request);
    const dbMindmap = getDbMindmap(dbName);

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

    const node: KnowledgeNode = await request.json();

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
