import Database from 'better-sqlite3';
import { WikiPage, LearningSession, Bookmark, KnowledgeNode } from './types';
import { getDatabasePath, databaseExists, createDatabase } from './db-manager';

// Cache for database connections
const dbConnections = new Map<string, Database.Database>();

export function getDatabase(dbName: string = 'default'): Database.Database {
  // Check if we have a cached connection
  if (dbConnections.has(dbName)) {
    return dbConnections.get(dbName)!;
  }

  // Ensure database exists
  if (!databaseExists(dbName)) {
    createDatabase(dbName);
  }

  // Create new connection
  const dbPath = getDatabasePath(dbName);
  const db = new Database(dbPath);
  initializeDatabase(db);

  // Cache the connection
  dbConnections.set(dbName, db);

  return db;
}

function initializeDatabase(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS wiki_pages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      related_topics TEXT NOT NULL,
      suggested_questions TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      parent_id TEXT,
      is_placeholder INTEGER DEFAULT 0,
      mindmap_position TEXT
    );

    CREATE TABLE IF NOT EXISTS learning_sessions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      pages TEXT NOT NULL,
      current_page_id TEXT NOT NULL,
      breadcrumbs TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      page_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS knowledge_nodes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      children TEXT NOT NULL,
      parent TEXT,
      depth INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_pages_title ON wiki_pages(title);
    CREATE INDEX IF NOT EXISTS idx_pages_parent ON wiki_pages(parent_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_started ON learning_sessions(started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_timestamp ON bookmarks(timestamp DESC);
  `);
}

export function getDbPages(dbName: string = 'default') {
  return {
    getAll: (): WikiPage[] => {
      const db = getDatabase(dbName);
      const rows = db.prepare('SELECT * FROM wiki_pages ORDER BY created_at DESC').all();
      return rows.map(rowToWikiPage);
    },

    getById: (id: string): WikiPage | null => {
      const db = getDatabase(dbName);
      const row = db.prepare('SELECT * FROM wiki_pages WHERE id = ?').get(id);
      return row ? rowToWikiPage(row) : null;
    },

    save: (page: WikiPage) => {
      const db = getDatabase(dbName);
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO wiki_pages
        (id, title, content, related_topics, suggested_questions, created_at, parent_id, is_placeholder, mindmap_position)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        page.id,
        page.title,
        page.content,
        JSON.stringify(page.relatedTopics),
        JSON.stringify(page.suggestedQuestions),
        page.createdAt,
        page.parentId || null,
        page.isPlaceholder ? 1 : 0,
        page.mindmapPosition ? JSON.stringify(page.mindmapPosition) : null
      );
    },

    search: (query: string): WikiPage[] => {
      const db = getDatabase(dbName);
      const lowerQuery = `%${query.toLowerCase()}%`;
      const rows = db.prepare(`
        SELECT * FROM wiki_pages
        WHERE LOWER(title) LIKE ? OR LOWER(content) LIKE ?
        ORDER BY created_at DESC
      `).all(lowerQuery, lowerQuery);
      return rows.map(rowToWikiPage);
    },

    removeDuplicates: (): number => {
      const db = getDatabase(dbName);
      const duplicates = db.prepare(`
        SELECT LOWER(TRIM(title)) as normalized_title, COUNT(*) as count
        FROM wiki_pages
        GROUP BY normalized_title
        HAVING count > 1
      `).all();

      let totalRemoved = 0;
      for (const dup of duplicates as Array<{ normalized_title: string; count: number }>) {
        const pages = db.prepare(`
          SELECT id, created_at FROM wiki_pages
          WHERE LOWER(TRIM(title)) = ?
          ORDER BY created_at DESC
        `).all(dup.normalized_title);

        const toDelete = (pages as Array<{ id: string; created_at: number }>).slice(1);
        for (const page of toDelete) {
          db.prepare('DELETE FROM wiki_pages WHERE id = ?').run(page.id);
          totalRemoved++;
        }
      }
      return totalRemoved;
    },

    deleteAll: () => {
      const db = getDatabase(dbName);
      db.prepare('DELETE FROM wiki_pages').run();
    },

    deleteById: (id: string) => {
      const db = getDatabase(dbName);
      db.prepare('DELETE FROM wiki_pages WHERE id = ?').run(id);
    }
  };
}

export function getDbSessions(dbName: string = 'default') {
  return {
    getAll: (): LearningSession[] => {
      const db = getDatabase(dbName);
      const rows = db.prepare('SELECT * FROM learning_sessions ORDER BY started_at DESC').all();
      return rows.map(rowToSession);
    },

    getById: (id: string): LearningSession | null => {
      const db = getDatabase(dbName);
      const row = db.prepare('SELECT * FROM learning_sessions WHERE id = ?').get(id);
      return row ? rowToSession(row) : null;
    },

    save: (session: LearningSession) => {
      const db = getDatabase(dbName);
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO learning_sessions
        (id, name, started_at, pages, current_page_id, breadcrumbs)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        session.id,
        session.name,
        session.startedAt,
        JSON.stringify(session.pages),
        session.currentPageId,
        JSON.stringify(session.breadcrumbs)
      );
    },

    getCurrent: (): string | null => {
      const db = getDatabase(dbName);
      const row = db.prepare('SELECT value FROM app_state WHERE key = ?').get('current_session') as { value: string } | undefined;
      return row ? row.value : null;
    },

    setCurrent: (sessionId: string) => {
      const db = getDatabase(dbName);
      db.prepare('INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)').run('current_session', sessionId);
    },

    deleteAll: () => {
      const db = getDatabase(dbName);
      db.prepare('DELETE FROM learning_sessions').run();
    }
  };
}

export function getDbBookmarks(dbName: string = 'default') {
  return {
    getAll: (): Bookmark[] => {
      const db = getDatabase(dbName);
      const rows = db.prepare('SELECT * FROM bookmarks ORDER BY timestamp DESC').all();
      return rows.map(rowToBookmark);
    },

    add: (bookmark: Bookmark) => {
      const db = getDatabase(dbName);
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO bookmarks (page_id, title, timestamp)
        VALUES (?, ?, ?)
      `);
      stmt.run(bookmark.pageId, bookmark.title, bookmark.timestamp);
    },

    remove: (pageId: string) => {
      const db = getDatabase(dbName);
      db.prepare('DELETE FROM bookmarks WHERE page_id = ?').run(pageId);
    },

    deleteAll: () => {
      const db = getDatabase(dbName);
      db.prepare('DELETE FROM bookmarks').run();
    }
  };
}

export function getDbMindmap(dbName: string = 'default') {
  return {
    getAll: (): KnowledgeNode[] => {
      const db = getDatabase(dbName);
      const rows = db.prepare('SELECT * FROM knowledge_nodes').all();
      return rows.map(rowToKnowledgeNode);
    },

    save: (node: KnowledgeNode) => {
      const db = getDatabase(dbName);
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO knowledge_nodes
        (id, title, children, parent, depth)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(
        node.id,
        node.title,
        JSON.stringify(node.children),
        node.parent || null,
        node.depth
      );
    },

    deleteAll: () => {
      const db = getDatabase(dbName);
      db.prepare('DELETE FROM knowledge_nodes').run();
    }
  };
}

function rowToWikiPage(row: any): WikiPage {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    relatedTopics: JSON.parse(row.related_topics),
    suggestedQuestions: JSON.parse(row.suggested_questions),
    createdAt: row.created_at,
    parentId: row.parent_id || undefined,
    isPlaceholder: row.is_placeholder === 1,
    mindmapPosition: row.mindmap_position ? JSON.parse(row.mindmap_position) : undefined
  };
}

function rowToSession(row: any): LearningSession {
  return {
    id: row.id,
    name: row.name,
    startedAt: row.started_at,
    pages: JSON.parse(row.pages),
    currentPageId: row.current_page_id,
    breadcrumbs: JSON.parse(row.breadcrumbs)
  };
}

function rowToBookmark(row: any): Bookmark {
  return {
    pageId: row.page_id,
    title: row.title,
    timestamp: row.timestamp
  };
}

function rowToKnowledgeNode(row: any): KnowledgeNode {
  return {
    id: row.id,
    title: row.title,
    children: JSON.parse(row.children),
    parent: row.parent || undefined,
    depth: row.depth
  };
}

export function closeDatabase(dbName?: string) {
  if (dbName) {
    const db = dbConnections.get(dbName);
    if (db) {
      db.close();
      dbConnections.delete(dbName);
    }
  } else {
    // Close all connections
    for (const db of dbConnections.values()) {
      db.close();
    }
    dbConnections.clear();
  }
}

// Backward compatibility: export default database operations
export const dbPages = getDbPages();
export const dbSessions = getDbSessions();
export const dbBookmarks = getDbBookmarks();
export const dbMindmap = getDbMindmap();
