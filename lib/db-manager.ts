import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PREFIX = 'wiki-';
const DB_EXTENSION = '.db';

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Validate database name to prevent path traversal
function validateDatabaseName(name: string): boolean {
  // Only allow alphanumeric, hyphens, and underscores
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

// Get database file path from database name
export function getDatabasePath(dbName: string): string {
  if (!validateDatabaseName(dbName)) {
    throw new Error('Invalid database name. Only alphanumeric characters, hyphens, and underscores are allowed.');
  }
  return path.join(DATA_DIR, `${DB_PREFIX}${dbName}${DB_EXTENSION}`);
}

// List all available databases
export function listDatabases(): string[] {
  if (!fs.existsSync(DATA_DIR)) {
    return ['default'];
  }

  const files = fs.readdirSync(DATA_DIR);
  const dbFiles = files.filter(file =>
    file.startsWith(DB_PREFIX) && file.endsWith(DB_EXTENSION)
  );

  // Extract database names
  const dbNames = dbFiles.map(file =>
    file.slice(DB_PREFIX.length, -DB_EXTENSION.length)
  );

  // Ensure default database exists
  if (dbNames.length === 0) {
    return ['default'];
  }

  return dbNames.sort();
}

// Create a new database
export function createDatabase(dbName: string): boolean {
  if (!validateDatabaseName(dbName)) {
    throw new Error('Invalid database name. Only alphanumeric characters, hyphens, and underscores are allowed.');
  }

  const dbPath = getDatabasePath(dbName);

  if (fs.existsSync(dbPath)) {
    return false; // Database already exists
  }

  // Create empty database (will be initialized when first accessed)
  const db = new Database(dbPath);
  db.close();

  return true;
}

// Delete a database
export function deleteDatabase(dbName: string): boolean {
  if (dbName === 'default') {
    throw new Error('Cannot delete the default database');
  }

  if (!validateDatabaseName(dbName)) {
    throw new Error('Invalid database name');
  }

  const dbPath = getDatabasePath(dbName);

  if (!fs.existsSync(dbPath)) {
    return false; // Database doesn't exist
  }

  fs.unlinkSync(dbPath);
  return true;
}

// Check if a database exists
export function databaseExists(dbName: string): boolean {
  if (!validateDatabaseName(dbName)) {
    return false;
  }

  const dbPath = getDatabasePath(dbName);
  return fs.existsSync(dbPath);
}

// Get database info
export interface DatabaseInfo {
  name: string;
  path: string;
  size: number; // in bytes
  created: Date;
  modified: Date;
}

export function getDatabaseInfo(dbName: string): DatabaseInfo | null {
  if (!validateDatabaseName(dbName)) {
    return null;
  }

  const dbPath = getDatabasePath(dbName);

  if (!fs.existsSync(dbPath)) {
    return null;
  }

  const stats = fs.statSync(dbPath);

  return {
    name: dbName,
    path: dbPath,
    size: stats.size,
    created: stats.birthtime,
    modified: stats.mtime
  };
}
