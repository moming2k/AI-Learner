import Database from 'better-sqlite3';
import { WikiPage, LearningSession, Bookmark, KnowledgeNode, GenerationJob, PageView, AuthSession } from './types';
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

    CREATE TABLE IF NOT EXISTS generation_jobs (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      type TEXT NOT NULL,
      input TEXT NOT NULL,
      output TEXT,
      error TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS page_views (
      page_id TEXT PRIMARY KEY,
      first_viewed_at INTEGER NOT NULL,
      last_viewed_at INTEGER NOT NULL,
      view_count INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      invitation_code TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_active_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_pages_title ON wiki_pages(title);
    CREATE INDEX IF NOT EXISTS idx_pages_parent ON wiki_pages(parent_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_started ON learning_sessions(started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_timestamp ON bookmarks(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON generation_jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_created ON generation_jobs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_page_views_last_viewed ON page_views(last_viewed_at DESC);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at);
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

      // Use db.transaction() for automatic error handling and ROLLBACK semantics
      const removeDuplicatesTransaction = db.transaction(() => {
        // Single query using window function to identify and delete duplicates
        // Keeps the most recent page (highest created_at) for each normalized title
        const result = db.prepare(`
          DELETE FROM wiki_pages WHERE id IN (
            SELECT id FROM (
              SELECT id, ROW_NUMBER() OVER (
                PARTITION BY LOWER(TRIM(title))
                ORDER BY created_at DESC
              ) as rn
              FROM wiki_pages
            ) t
            WHERE rn > 1
          )
        `).run();

        // Return number of deleted rows
        return (result as Database.RunResult).changes || 0;
      });

      return removeDuplicatesTransaction();
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
  const db = getDatabase(dbName);

  return {
    db, // Expose database instance for transactions

    getAll: (): KnowledgeNode[] => {
      const rows = db.prepare('SELECT * FROM knowledge_nodes').all();
      return rows.map(rowToKnowledgeNode);
    },

    getById: (id: string): KnowledgeNode | null => {
      const row = db.prepare('SELECT * FROM knowledge_nodes WHERE id = ?').get(id);
      return row ? rowToKnowledgeNode(row) : null;
    },

    save: (node: KnowledgeNode) => {
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
      db.prepare('DELETE FROM knowledge_nodes').run();
    },

    transaction: <T>(fn: () => T): T => {
      return db.transaction(fn)();
    }
  };
}

export function getDbJobs(dbName: string = 'default') {
  return {
    getAll: (): GenerationJob[] => {
      const db = getDatabase(dbName);
      const rows = db.prepare('SELECT * FROM generation_jobs ORDER BY created_at DESC').all();
      return rows.map(rowToJob);
    },

    getById: (id: string): GenerationJob | null => {
      const db = getDatabase(dbName);
      const row = db.prepare('SELECT * FROM generation_jobs WHERE id = ?').get(id);
      return row ? rowToJob(row) : null;
    },

    getPending: (): GenerationJob[] => {
      const db = getDatabase(dbName);
      const rows = db.prepare('SELECT * FROM generation_jobs WHERE status = ? ORDER BY created_at ASC').all('pending');
      return rows.map(rowToJob);
    },

    save: (job: GenerationJob) => {
      const db = getDatabase(dbName);
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO generation_jobs
        (id, status, type, input, output, error, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        job.id,
        job.status,
        job.type,
        JSON.stringify(job.input),
        job.output ? JSON.stringify(job.output) : null,
        job.error || null,
        job.createdAt,
        job.updatedAt
      );
    },

    updateStatus: (id: string, status: string, error?: string) => {
      const db = getDatabase(dbName);
      const stmt = db.prepare(`
        UPDATE generation_jobs
        SET status = ?, error = ?, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(status, error || null, Date.now(), id);
    },

    updateOutput: (id: string, output: WikiPage) => {
      const db = getDatabase(dbName);
      const stmt = db.prepare(`
        UPDATE generation_jobs
        SET output = ?, status = ?, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(JSON.stringify(output), 'completed', Date.now(), id);
    },

    deleteAll: () => {
      const db = getDatabase(dbName);
      db.prepare('DELETE FROM generation_jobs').run();
    },

    deleteById: (id: string) => {
      const db = getDatabase(dbName);
      db.prepare('DELETE FROM generation_jobs WHERE id = ?').run(id);
    }
  };
}

export function getDbPageViews(dbName: string = 'default') {
  return {
    getAll: (): PageView[] => {
      const db = getDatabase(dbName);
      const rows = db.prepare('SELECT * FROM page_views ORDER BY last_viewed_at DESC').all();
      return rows.map(rowToPageView);
    },

    getByPageId: (pageId: string): PageView | null => {
      const db = getDatabase(dbName);
      const row = db.prepare('SELECT * FROM page_views WHERE page_id = ?').get(pageId);
      return row ? rowToPageView(row) : null;
    },

    getAllViewedPageIds: (): string[] => {
      const db = getDatabase(dbName);
      const rows = db.prepare('SELECT page_id FROM page_views').all() as { page_id: string }[];
      return rows.map(row => row.page_id);
    },

    recordView: (pageId: string) => {
      const db = getDatabase(dbName);
      const now = Date.now();

      // Check if page has been viewed before
      const existing = db.prepare('SELECT * FROM page_views WHERE page_id = ?').get(pageId);

      if (existing) {
        // Update existing view record
        const stmt = db.prepare(`
          UPDATE page_views
          SET last_viewed_at = ?, view_count = view_count + 1
          WHERE page_id = ?
        `);
        stmt.run(now, pageId);
      } else {
        // Insert new view record
        const stmt = db.prepare(`
          INSERT INTO page_views (page_id, first_viewed_at, last_viewed_at, view_count)
          VALUES (?, ?, ?, 1)
        `);
        stmt.run(pageId, now, now);
      }
    },

    deleteAll: () => {
      const db = getDatabase(dbName);
      db.prepare('DELETE FROM page_views').run();
    },

    deleteByPageId: (pageId: string) => {
      const db = getDatabase(dbName);
      db.prepare('DELETE FROM page_views WHERE page_id = ?').run(pageId);
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

function rowToJob(row: any): GenerationJob {
  return {
    id: row.id,
    status: row.status,
    type: row.type,
    input: JSON.parse(row.input),
    output: row.output ? JSON.parse(row.output) : undefined,
    error: row.error || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function rowToPageView(row: any): PageView {
  return {
    pageId: row.page_id,
    firstViewedAt: row.first_viewed_at,
    lastViewedAt: row.last_viewed_at,
    viewCount: row.view_count
  };
}

function rowToAuthSession(row: any): AuthSession {
  return {
    id: row.id,
    invitationCode: row.invitation_code,
    createdAt: row.created_at,
    lastActiveAt: row.last_active_at,
    expiresAt: row.expires_at
  };
}

export function getDbAuthSessions(dbName: string = 'default') {
  return {
    getById: (id: string): AuthSession | null => {
      const db = getDatabase(dbName);
      const row = db.prepare('SELECT * FROM auth_sessions WHERE id = ?').get(id);
      return row ? rowToAuthSession(row) : null;
    },

    create: (session: AuthSession) => {
      const db = getDatabase(dbName);
      const stmt = db.prepare(`
        INSERT INTO auth_sessions (id, invitation_code, created_at, last_active_at, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(
        session.id,
        session.invitationCode,
        session.createdAt,
        session.lastActiveAt,
        session.expiresAt
      );
    },

    updateLastActive: (id: string, timestamp: number) => {
      const db = getDatabase(dbName);
      const stmt = db.prepare('UPDATE auth_sessions SET last_active_at = ? WHERE id = ?');
      stmt.run(timestamp, id);
    },

    delete: (id: string) => {
      const db = getDatabase(dbName);
      db.prepare('DELETE FROM auth_sessions WHERE id = ?').run(id);
    },

    deleteExpired: (): number => {
      const db = getDatabase(dbName);
      const result = db.prepare('DELETE FROM auth_sessions WHERE expires_at < ?').run(Date.now());
      return (result as Database.RunResult).changes || 0;
    },

    deleteAll: () => {
      const db = getDatabase(dbName);
      db.prepare('DELETE FROM auth_sessions').run();
    }
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
export const dbJobs = getDbJobs();
export const dbAuthSessions = getDbAuthSessions();
