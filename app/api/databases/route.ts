import { NextRequest, NextResponse } from 'next/server';
import {
  listDatabases,
  createDatabase,
  deleteDatabase,
  getDatabaseInfo,
  type DatabaseInfo
} from '@/lib/db-manager';
import { checkAuth } from '@/lib/auth-guard';

// GET /api/databases - List all databases with their info
export async function GET() {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const dbNames = listDatabases();
    const databases: DatabaseInfo[] = [];

    for (const name of dbNames) {
      const info = getDatabaseInfo(name);
      if (info) {
        databases.push(info);
      }
    }

    return NextResponse.json(databases);
  } catch (error) {
    console.error('Error listing databases:', error);
    return NextResponse.json(
      { error: 'Failed to list databases' },
      { status: 500 }
    );
  }
}

// POST /api/databases - Create a new database
export async function POST(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Database name is required' },
        { status: 400 }
      );
    }

    // Validate name format
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      return NextResponse.json(
        { error: 'Database name can only contain alphanumeric characters, hyphens, and underscores' },
        { status: 400 }
      );
    }

    const created = createDatabase(name);

    if (!created) {
      return NextResponse.json(
        { error: 'Database already exists' },
        { status: 409 }
      );
    }

    const info = getDatabaseInfo(name);
    return NextResponse.json(info, { status: 201 });
  } catch (error) {
    console.error('Error creating database:', error);
    return NextResponse.json(
      { error: 'Failed to create database' },
      { status: 500 }
    );
  }
}

// DELETE /api/databases?name=xxx - Delete a database
export async function DELETE(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { error: 'Database name is required' },
        { status: 400 }
      );
    }

    if (name === 'default') {
      return NextResponse.json(
        { error: 'Cannot delete the default database' },
        { status: 403 }
      );
    }

    const deleted = deleteDatabase(name);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Database not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting database:', error);
    return NextResponse.json(
      { error: 'Failed to delete database' },
      { status: 500 }
    );
  }
}
