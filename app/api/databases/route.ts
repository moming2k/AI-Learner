import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseInfo, type DatabaseInfo } from '@/lib/db-manager';
import { checkAuth } from '@/lib/auth-guard';
import { getDatabaseName } from '@/lib/db-utils';

export async function GET(request: NextRequest) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const dbName = await getDatabaseName(request);
    const info = getDatabaseInfo(dbName);
    const databases: DatabaseInfo[] = info ? [info] : [];
    return NextResponse.json(databases);
  } catch (error) {
    console.error('Error listing databases:', error);
    return NextResponse.json({ error: 'Failed to list databases' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Database creation is disabled. Each authenticated user gets a server-assigned personal library.' },
    { status: 403 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Database deletion is disabled for personal libraries.' },
    { status: 403 }
  );
}
