'use client';

import { WikiPage, LearningSession, Bookmark, KnowledgeNode, GenerationJob, GenerationJobType, GenerationJobInput } from './types';

const DB_STORAGE_KEY = 'selectedDatabase';
const DB_HEADER_NAME = 'x-database-name';

// Get current database name from localStorage
function getCurrentDatabase(): string {
  if (typeof window === 'undefined') return 'default';
  return localStorage.getItem(DB_STORAGE_KEY) || 'default';
}

// Set current database name in localStorage
export function setCurrentDatabase(dbName: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DB_STORAGE_KEY, dbName);
  }
}

// Get headers with database name
function getHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    [DB_HEADER_NAME]: getCurrentDatabase(),
    ...additionalHeaders
  };
}

export const storage = {
  // Wiki Pages
  getPages: async (): Promise<WikiPage[]> => {
    try {
      const response = await fetch('/api/pages', {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch pages');
      return await response.json();
    } catch (error) {
      console.error('Error fetching pages:', error);
      return [];
    }
  },

  savePage: async (page: WikiPage): Promise<void> => {
    try {
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(page)
      });
      if (!response.ok) throw new Error('Failed to save page');
    } catch (error) {
      console.error('Error saving page:', error);
      throw error;
    }
  },

  getPage: async (id: string): Promise<WikiPage | null> => {
    try {
      const response = await fetch(`/api/pages?id=${id}`, {
        headers: getHeaders()
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch page');
      return await response.json();
    } catch (error) {
      console.error('Error fetching page:', error);
      return null;
    }
  },

  searchPages: async (query: string): Promise<WikiPage[]> => {
    try {
      const response = await fetch(`/api/pages?query=${encodeURIComponent(query)}`, {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to search pages');
      return await response.json();
    } catch (error) {
      console.error('Error searching pages:', error);
      return [];
    }
  },

  deletePage: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/pages?id=${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to delete page');
    } catch (error) {
      console.error('Error deleting page:', error);
      throw error;
    }
  },

  // Learning Sessions
  getSessions: async (): Promise<LearningSession[]> => {
    try {
      const response = await fetch('/api/sessions', {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  },

  saveSession: async (session: LearningSession): Promise<void> => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(session)
      });
      if (!response.ok) throw new Error('Failed to save session');
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  },

  getCurrentSession: async (): Promise<LearningSession | null> => {
    try {
      const response = await fetch('/api/sessions?current=true', {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch current session');
      const data = await response.json();
      return data.session || null;
    } catch (error) {
      console.error('Error fetching current session:', error);
      return null;
    }
  },

  // Bookmarks
  getBookmarks: async (): Promise<Bookmark[]> => {
    try {
      const response = await fetch('/api/bookmarks', {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch bookmarks');
      return await response.json();
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      return [];
    }
  },

  addBookmark: async (bookmark: Bookmark): Promise<void> => {
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(bookmark)
      });
      if (!response.ok) throw new Error('Failed to add bookmark');
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  },

  removeBookmark: async (pageId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/bookmarks?pageId=${pageId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to remove bookmark');
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw error;
    }
  },

  // Mindmap
  getMindmap: async (): Promise<KnowledgeNode[]> => {
    try {
      const response = await fetch('/api/mindmap', {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch mindmap');
      return await response.json();
    } catch (error) {
      console.error('Error fetching mindmap:', error);
      return [];
    }
  },

  getMindmapNode: async (nodeId: string): Promise<KnowledgeNode | null> => {
    try {
      const response = await fetch(`/api/mindmap?id=${nodeId}`, {
        headers: getHeaders()
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch mindmap node');
      return await response.json();
    } catch (error) {
      console.error('Error fetching mindmap node:', error);
      return null;
    }
  },

  saveMindmapNode: async (node: KnowledgeNode): Promise<void> => {
    try {
      const response = await fetch('/api/mindmap', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(node)
      });
      if (!response.ok) throw new Error('Failed to save mindmap node');
    } catch (error) {
      console.error('Error saving mindmap node:', error);
      throw error;
    }
  },

  saveMindmapNodes: async (nodes: KnowledgeNode[]): Promise<void> => {
    try {
      const response = await fetch('/api/mindmap', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ nodes })
      });
      if (!response.ok) throw new Error('Failed to save mindmap nodes');
    } catch (error) {
      console.error('Error saving mindmap nodes:', error);
      throw error;
    }
  },

  // Remove duplicate pages based on title
  removeDuplicatePages: async (): Promise<number> => {
    try {
      const response = await fetch('/api/pages?action=duplicates', {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to remove duplicates');
      const data = await response.json();
      return data.removed || 0;
    } catch (error) {
      console.error('Error removing duplicates:', error);
      return 0;
    }
  },

  // Get duplicate pages info without removing
  getDuplicateInfo: async () => {
    try {
      const pages = await storage.getPages();
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
            title: pages[0].title,
            count: pages.length,
            pages: pages.sort((a, b) => b.createdAt - a.createdAt)
          });
        }
      });

      return {
        totalPages: pages.length,
        uniquePages: titleMap.size,
        duplicatesFound: pages.length - titleMap.size,
        duplicateGroups: duplicates
      };
    } catch (error) {
      console.error('Error getting duplicate info:', error);
      return {
        totalPages: 0,
        uniquePages: 0,
        duplicatesFound: 0,
        duplicateGroups: []
      };
    }
  },

  // Generation Jobs
  createJob: async (type: GenerationJobType, input: GenerationJobInput): Promise<GenerationJob> => {
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ type, input })
      });
      if (!response.ok) throw new Error('Failed to create job');
      return await response.json();
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  },

  getJob: async (id: string): Promise<GenerationJob | null> => {
    try {
      const response = await fetch(`/api/jobs?id=${id}`, {
        headers: getHeaders()
      });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch job');
      return await response.json();
    } catch (error) {
      console.error('Error fetching job:', error);
      return null;
    }
  },

  processJob: async (id: string): Promise<GenerationJob> => {
    try {
      const response = await fetch(`/api/jobs/${id}/process`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process job');
      }
      return await response.json();
    } catch (error) {
      console.error('Error processing job:', error);
      throw error;
    }
  },

  getAllJobs: async (): Promise<GenerationJob[]> => {
    try {
      const response = await fetch('/api/jobs', {
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return await response.json();
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }
  },

  clearAll: async (): Promise<void> => {
    try {
      const headers = getHeaders();
      await Promise.all([
        fetch('/api/pages?action=all', { method: 'DELETE', headers }),
        fetch('/api/sessions', { method: 'DELETE', headers }),
        fetch('/api/bookmarks?all=true', { method: 'DELETE', headers }),
        fetch('/api/mindmap', { method: 'DELETE', headers })
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  },
};
