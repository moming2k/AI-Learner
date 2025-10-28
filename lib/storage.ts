'use client';

import { WikiPage, LearningSession, Bookmark, KnowledgeNode } from './types';

const STORAGE_KEYS = {
  PAGES: 'wiki_pages',
  SESSIONS: 'learning_sessions',
  BOOKMARKS: 'bookmarks',
  MINDMAP: 'knowledge_mindmap',
  CURRENT_SESSION: 'current_session',
};

export const storage = {
  // Wiki Pages
  getPages: (): WikiPage[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.PAGES);
    return data ? JSON.parse(data) : [];
  },

  savePage: (page: WikiPage) => {
    const pages = storage.getPages();
    const existingIndex = pages.findIndex(p => p.id === page.id);

    if (existingIndex >= 0) {
      pages[existingIndex] = page;
    } else {
      pages.push(page);
    }

    localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(pages));
  },

  getPage: (id: string): WikiPage | null => {
    const pages = storage.getPages();
    return pages.find(p => p.id === id) || null;
  },

  searchPages: (query: string): WikiPage[] => {
    const pages = storage.getPages();
    const lowerQuery = query.toLowerCase();
    return pages.filter(p =>
      p.title.toLowerCase().includes(lowerQuery) ||
      p.content.toLowerCase().includes(lowerQuery)
    );
  },

  // Learning Sessions
  getSessions: (): LearningSession[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return data ? JSON.parse(data) : [];
  },

  saveSession: (session: LearningSession) => {
    const sessions = storage.getSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);

    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }

    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, session.id);
  },

  getCurrentSession: (): LearningSession | null => {
    const sessionId = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    if (!sessionId) return null;

    const sessions = storage.getSessions();
    return sessions.find(s => s.id === sessionId) || null;
  },

  // Bookmarks
  getBookmarks: (): Bookmark[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return data ? JSON.parse(data) : [];
  },

  addBookmark: (bookmark: Bookmark) => {
    const bookmarks = storage.getBookmarks();
    if (!bookmarks.find(b => b.pageId === bookmark.pageId)) {
      bookmarks.push(bookmark);
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    }
  },

  removeBookmark: (pageId: string) => {
    const bookmarks = storage.getBookmarks();
    const filtered = bookmarks.filter(b => b.pageId !== pageId);
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(filtered));
  },

  // Mindmap
  getMindmap: (): KnowledgeNode[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.MINDMAP);
    return data ? JSON.parse(data) : [];
  },

  saveMindmapNode: (node: KnowledgeNode) => {
    const nodes = storage.getMindmap();
    const existingIndex = nodes.findIndex(n => n.id === node.id);

    if (existingIndex >= 0) {
      nodes[existingIndex] = node;
    } else {
      nodes.push(node);
    }

    localStorage.setItem(STORAGE_KEYS.MINDMAP, JSON.stringify(nodes));
  },

  // Remove duplicate pages based on title
  removeDuplicatePages: (): number => {
    const pages = storage.getPages();
    const uniquePages = new Map<string, WikiPage>();
    const titleCounts = new Map<string, number>();

    // Count occurrences and keep the most recent one
    pages.forEach(page => {
      const normalizedTitle = page.title.toLowerCase().trim();
      const existingPage = uniquePages.get(normalizedTitle);

      // Track count for reporting
      titleCounts.set(normalizedTitle, (titleCounts.get(normalizedTitle) || 0) + 1);

      // Keep the most recent page (higher timestamp)
      if (!existingPage || page.createdAt > existingPage.createdAt) {
        uniquePages.set(normalizedTitle, page);
      }
    });

    // Calculate how many duplicates were removed
    const duplicatesRemoved = pages.length - uniquePages.size;

    if (duplicatesRemoved > 0) {
      // Save the unique pages
      const uniquePagesArray = Array.from(uniquePages.values());
      localStorage.setItem(STORAGE_KEYS.PAGES, JSON.stringify(uniquePagesArray));

      console.log(`Removed ${duplicatesRemoved} duplicate pages`);

      // Log which titles had duplicates
      titleCounts.forEach((count, title) => {
        if (count > 1) {
          console.log(`  - "${title}": had ${count} copies, kept 1`);
        }
      });
    }

    return duplicatesRemoved;
  },

  // Get duplicate pages info without removing
  getDuplicateInfo: () => {
    const pages = storage.getPages();
    const titleMap = new Map<string, WikiPage[]>();

    pages.forEach(page => {
      const normalizedTitle = page.title.toLowerCase().trim();
      const existing = titleMap.get(normalizedTitle) || [];
      existing.push(page);
      titleMap.set(normalizedTitle, existing);
    });

    const duplicates: Array<{ title: string; count: number; pages: WikiPage[] }> = [];

    titleMap.forEach((pages, title) => {
      if (pages.length > 1) {
        duplicates.push({
          title: pages[0].title, // Use original title
          count: pages.length,
          pages: pages.sort((a, b) => b.createdAt - a.createdAt) // Sort by newest first
        });
      }
    });

    return {
      totalPages: pages.length,
      uniquePages: titleMap.size,
      duplicatesFound: pages.length - titleMap.size,
      duplicateGroups: duplicates
    };
  },

  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
};
