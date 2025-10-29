import { NextRequest } from 'next/server';

// Header name for database selection
export const DB_HEADER_NAME = 'x-database-name';

// Get database name from request headers, defaulting to 'default'
export function getDatabaseName(request: NextRequest): string {
  const dbName = request.headers.get(DB_HEADER_NAME);
  return dbName && dbName.trim() !== '' ? dbName : 'default';
}
