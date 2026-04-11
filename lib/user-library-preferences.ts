import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { AuthenticatedUser } from './types';
import { createDatabase, databaseExists } from './db-manager';

const DATA_DIR = path.join(process.cwd(), 'data');
const APP_DB_PATH = path.join(DATA_DIR, 'wiki-app.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let appDb: Database.Database | null = null;

export interface LibraryChoice {
  id: string;
  name: string;
  kind: 'personal' | 'custom';
  databaseName: string;
  isPersonal: boolean;
}

export interface UserLibraryPreference {
  authUserId: string;
  activeLibraryId: string;
  activeLibraryName: string | null;
  personalLibraryId: string;
  personalLibraryName: string | null;
  createdAt: number;
  updatedAt: number;
}

function getAppDb(): Database.Database {
  if (appDb) return appDb;

  appDb = new Database(APP_DB_PATH);
  appDb.exec(`
    CREATE TABLE IF NOT EXISTS user_library_preferences (
      auth_user_id TEXT PRIMARY KEY,
      active_library_id TEXT NOT NULL,
      active_library_name TEXT,
      personal_library_id TEXT NOT NULL,
      personal_library_name TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_libraries (
      id TEXT PRIMARY KEY,
      auth_user_id TEXT NOT NULL,
      database_name TEXT NOT NULL,
      name TEXT NOT NULL,
      is_personal INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_user_libraries_database_name
      ON user_libraries(database_name);
    CREATE INDEX IF NOT EXISTS idx_user_libraries_auth_user_id
      ON user_libraries(auth_user_id);
    CREATE INDEX IF NOT EXISTS idx_user_library_preferences_active_library
      ON user_library_preferences(active_library_id);
  `);

  return appDb;
}

function sanitizeLibrarySlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function rowToPreference(row: any): UserLibraryPreference {
  return {
    authUserId: row.auth_user_id,
    activeLibraryId: row.active_library_id,
    activeLibraryName: row.active_library_name ?? null,
    personalLibraryId: row.personal_library_id,
    personalLibraryName: row.personal_library_name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToLibrary(row: any): LibraryChoice {
  return {
    id: row.id,
    name: row.name,
    kind: row.is_personal === 1 ? 'personal' : 'custom',
    databaseName: row.database_name,
    isPersonal: row.is_personal === 1,
  };
}

export function getPersonalLibraryForUser(user: Pick<AuthenticatedUser, 'databaseKey' | 'authUserId'>): LibraryChoice {
  return {
    id: `personal:${user.databaseKey}`,
    name: 'Personal library',
    kind: 'personal',
    databaseName: `user_${user.databaseKey}`,
    isPersonal: true,
  };
}

function ensureLibraryDatabase(databaseName: string) {
  if (!databaseExists(databaseName)) {
    createDatabase(databaseName);
  }
}

export function ensurePersonalLibraryRecord(user: AuthenticatedUser): LibraryChoice {
  const db = getAppDb();
  const personalLibrary = getPersonalLibraryForUser(user);
  const now = Date.now();

  ensureLibraryDatabase(personalLibrary.databaseName);

  db.prepare(`
    INSERT INTO user_libraries (id, auth_user_id, database_name, name, is_personal, created_at, updated_at)
    VALUES (?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      auth_user_id = excluded.auth_user_id,
      database_name = excluded.database_name,
      name = excluded.name,
      is_personal = 1,
      updated_at = excluded.updated_at
  `).run(
    personalLibrary.id,
    user.authUserId,
    personalLibrary.databaseName,
    personalLibrary.name,
    now,
    now
  );

  return personalLibrary;
}

export function listAvailableLibrariesForUser(user: AuthenticatedUser): LibraryChoice[] {
  ensurePersonalLibraryRecord(user);
  const db = getAppDb();
  const rows = db
    .prepare('SELECT * FROM user_libraries WHERE auth_user_id = ? ORDER BY is_personal DESC, updated_at DESC, name ASC')
    .all(user.authUserId);

  return rows.map(rowToLibrary);
}

export function getLibraryByIdForUser(user: AuthenticatedUser, libraryId: string): LibraryChoice | null {
  return listAvailableLibrariesForUser(user).find((library) => library.id === libraryId) || null;
}

export function getUserLibraryPreference(authUserId: string): UserLibraryPreference | null {
  const db = getAppDb();
  const row = db
    .prepare('SELECT * FROM user_library_preferences WHERE auth_user_id = ?')
    .get(authUserId);

  return row ? rowToPreference(row) : null;
}

export function upsertUserLibraryPreference(input: {
  authUserId: string;
  activeLibraryId: string;
  activeLibraryName?: string | null;
  personalLibraryId: string;
  personalLibraryName?: string | null;
}): UserLibraryPreference {
  const db = getAppDb();
  const now = Date.now();

  db.prepare(`
    INSERT INTO user_library_preferences (
      auth_user_id,
      active_library_id,
      active_library_name,
      personal_library_id,
      personal_library_name,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(auth_user_id) DO UPDATE SET
      active_library_id = excluded.active_library_id,
      active_library_name = excluded.active_library_name,
      personal_library_id = excluded.personal_library_id,
      personal_library_name = excluded.personal_library_name,
      updated_at = excluded.updated_at
  `).run(
    input.authUserId,
    input.activeLibraryId,
    input.activeLibraryName ?? null,
    input.personalLibraryId,
    input.personalLibraryName ?? null,
    now,
    now
  );

  return getUserLibraryPreference(input.authUserId)!;
}

export function ensureUserActiveLibrary(user: AuthenticatedUser): UserLibraryPreference {
  const existing = getUserLibraryPreference(user.authUserId);
  const personalLibrary = ensurePersonalLibraryRecord(user);

  if (existing?.activeLibraryId) {
    const available = getLibraryByIdForUser(user, existing.activeLibraryId);
    if (available && existing.personalLibraryId) {
      return existing;
    }
  }

  return upsertUserLibraryPreference({
    authUserId: user.authUserId,
    activeLibraryId: existing?.activeLibraryId || personalLibrary.id,
    activeLibraryName: existing?.activeLibraryName || personalLibrary.name,
    personalLibraryId: personalLibrary.id,
    personalLibraryName: personalLibrary.name,
  });
}

export function createCustomLibraryForUser(user: AuthenticatedUser, name: string): LibraryChoice {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Library name is required.');
  }

  const db = getAppDb();
  const now = Date.now();
  const slug = sanitizeLibrarySlug(trimmed);
  if (!slug) {
    throw new Error('Library name is invalid.');
  }

  const suffix = Math.random().toString(36).slice(2, 8);
  const id = `library:${user.databaseKey}:${slug}:${suffix}`;
  const databaseName = `user_${user.databaseKey}_${slug}_${suffix}`;

  ensureLibraryDatabase(databaseName);

  db.prepare(`
    INSERT INTO user_libraries (id, auth_user_id, database_name, name, is_personal, created_at, updated_at)
    VALUES (?, ?, ?, ?, 0, ?, ?)
  `).run(id, user.authUserId, databaseName, trimmed, now, now);

  return {
    id,
    name: trimmed,
    kind: 'custom',
    databaseName,
    isPersonal: false,
  };
}

export function setUserActiveLibrary(user: AuthenticatedUser, libraryId: string): UserLibraryPreference {
  const selected = getLibraryByIdForUser(user, libraryId);

  if (!selected) {
    throw new Error('Selected library is not available for this user.');
  }

  const ensured = ensureUserActiveLibrary(user);
  return upsertUserLibraryPreference({
    authUserId: user.authUserId,
    activeLibraryId: selected.id,
    activeLibraryName: selected.name,
    personalLibraryId: ensured.personalLibraryId,
    personalLibraryName: ensured.personalLibraryName,
  });
}

export function getActiveLibraryForUser(user: AuthenticatedUser): LibraryChoice {
  const preference = ensureUserActiveLibrary(user);
  return getLibraryByIdForUser(user, preference.activeLibraryId) || ensurePersonalLibraryRecord(user);
}
