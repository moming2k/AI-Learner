import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { AuthenticatedUser } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const APP_DB_PATH = path.join(DATA_DIR, 'wiki-app.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let appDb: Database.Database | null = null;

export interface LibraryChoice {
  id: string;
  name: string;
  kind: 'personal';
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

    CREATE INDEX IF NOT EXISTS idx_user_library_preferences_active_library
      ON user_library_preferences(active_library_id);
  `);

  return appDb;
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

export function getPersonalLibraryForUser(user: Pick<AuthenticatedUser, 'databaseKey'>): LibraryChoice {
  return {
    id: `personal:${user.databaseKey}`,
    name: 'Personal library',
    kind: 'personal',
  };
}

export function listAvailableLibrariesForUser(user: AuthenticatedUser): LibraryChoice[] {
  return [getPersonalLibraryForUser(user)];
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
  const personalLibrary = getPersonalLibraryForUser(user);

  if (existing?.activeLibraryId) {
    const needsRepair = !existing.personalLibraryId || !existing.personalLibraryName;
    if (!needsRepair) {
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

export function setUserActiveLibrary(user: AuthenticatedUser, libraryId: string): UserLibraryPreference {
  const libraries = listAvailableLibrariesForUser(user);
  const selected = libraries.find((library) => library.id === libraryId);

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
