'use client';

import { WikiPage, LearningSession, Bookmark, KnowledgeNode, GenerationJob, GenerationJobType, GenerationJobInput, PageView } from './types';

export function setCurrentDatabase(_dbName: string): void {
  // Database selection is now derived server-side from the authenticated user's active library.
}

function getHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    ...additionalHeaders
  };
}

export const storage = {
  getPages: async (): Promise<WikiPage[]> => {
    try {
      const response = await fetch('/api/pages', { headers: getHeaders() });
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
      const response = await fetch(`/api/pages?id=${id}`, { headers: getHeaders() });
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
      const response = await fetch(`/api/pages?query=${encodeURIComponent(query)}`, { headers: getHeaders() });
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

  getSessions: async (): Promise<LearningSession[]> => {
    try {
      const response = await fetch('/api/sessions', { headers: getHeaders() });
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
      const response = await fetch('/api/sessions?current=true', { headers: getHeaders() });
      if (!response.ok) throw new Error('Failed to fetch current session');
      const data = await response.json();
      return data.session || null;
    } catch (error) {
      console.error('Error fetching current session:', error);
      return null;
    }
  },

  getBookmarks: async (): Promise<Bookmark[]> => {
    try {
      const response = await fetch('/api/bookmarks', { headers: getHeaders() });
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

  getMindmap: async (): Promise<KnowledgeNode[]> => {
    try {
      const response = await fetch('/api/mindmap', { headers: getHeaders() });
      if (!response.ok) throw new Error('Failed to fetch mindmap');
      return await response.json();
    } catch (error) {
      console.error('Error fetching mindmap:', error);
      return [];
    }
  },

  getMindmapNode: async (nodeId: string): Promise<KnowledgeNode | null> => {
    try {
      const response = await fetch(`/api/mindmap?id=${nodeId}`, { headers: getHeaders() });
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
    for (const node of nodes) {
      await storage.saveMindmapNode(node);
    }
  },

  deleteMindmapNode: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/mindmap?id=${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to delete mindmap node');
    } catch (error) {
      console.error('Error deleting mindmap node:', error);
      throw error;
    }
  },

  createJob: async (type: GenerationJobType, input: GenerationJobInput): Promise<GenerationJob> => {
    const response = await fetch('/api/jobs', {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ type, input })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create job' }));
      throw new Error(error.error || 'Failed to create job');
    }
    return response.json();
  },

  getJob: async (id: string): Promise<GenerationJob | null> => {
    const response = await fetch(`/api/jobs?id=${id}`, { headers: getHeaders() });
    if (response.status === 404) return null;
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get job' }));
      throw new Error(error.error || 'Failed to get job');
    }
    return response.json();
  },

  processJob: async (id: string): Promise<GenerationJob> => {
    const response = await fetch(`/api/jobs/${id}/process`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to process job' }));
      throw new Error(error.error || 'Failed to process job');
    }
    return response.json();
  },

  deleteJob: async (id: string): Promise<void> => {
    const response = await fetch(`/api/jobs?id=${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete job' }));
      throw new Error(error.error || 'Failed to delete job');
    }
  },

  getAllJobs: async (): Promise<GenerationJob[]> => {
    const response = await fetch('/api/jobs', { headers: getHeaders() });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get jobs' }));
      throw new Error(error.error || 'Failed to get jobs');
    }
    return response.json();
  },

  getViewedPageIds: async (): Promise<Set<string>> => {
    try {
      const response = await fetch('/api/page-views', { headers: getHeaders() });
      if (!response.ok) throw new Error('Failed to fetch page views');
      const pageViews: PageView[] = await response.json();
      return new Set(pageViews.map((pv) => pv.pageId));
    } catch (error) {
      console.error('Error fetching page views:', error);
      return new Set();
    }
  },

  markPageAsViewed: async (pageId: string): Promise<void> => {
    try {
      const response = await fetch('/api/page-views', {
        method: 'POST',
        headers: getHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ pageId })
      });
      if (!response.ok) throw new Error('Failed to mark page as viewed');
    } catch (error) {
      console.error('Error marking page as viewed:', error);
    }
  },

  recordPageView: async (pageId: string): Promise<boolean> => {
    try {
      await storage.markPageAsViewed(pageId);
      return true;
    } catch (error) {
      console.error('Error recording page view:', error);
      return false;
    }
  },

  getUnviewedPagesCount: async (): Promise<number> => {
    try {
      const response = await fetch('/api/page-views?unviewed=true', { headers: getHeaders() });
      if (!response.ok) throw new Error('Failed to fetch unviewed count');
      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Error fetching unviewed count:', error);
      return 0;
    }
  },

  getDuplicateInfo: async (): Promise<{ duplicatesFound: number; totalPages: number; uniquePages: number }> => {
    try {
      const pages = await storage.getPages();
      const titleGroups = new Map<string, number>();

      pages.forEach((page) => {
        const normalizedTitle = page.title.trim().toLowerCase();
        titleGroups.set(normalizedTitle, (titleGroups.get(normalizedTitle) || 0) + 1);
      });

      const duplicatesFound = Array.from(titleGroups.values()).reduce((total, count) => {
        return total + Math.max(0, count - 1);
      }, 0);

      return {
        duplicatesFound,
        totalPages: pages.length,
        uniquePages: titleGroups.size
      };
    } catch (error) {
      console.error('Error getting duplicate info:', error);
      return { duplicatesFound: 0, totalPages: 0, uniquePages: 0 };
    }
  },

  removeDuplicatePages: async (): Promise<number> => {
    try {
      const pages = await storage.getPages();
      const titleGroups = new Map<string, WikiPage[]>();

      pages.forEach((page) => {
        const normalizedTitle = page.title.trim().toLowerCase();
        if (!titleGroups.has(normalizedTitle)) {
          titleGroups.set(normalizedTitle, []);
        }
        titleGroups.get(normalizedTitle)!.push(page);
      });

      let removedCount = 0;
      for (const group of titleGroups.values()) {
        if (group.length > 1) {
          group.sort((a, b) => b.createdAt - a.createdAt);
          for (let i = 1; i < group.length; i++) {
            await storage.deletePage(group[i].id);
            removedCount++;
          }
        }
      }

      return removedCount;
    } catch (error) {
      console.error('Error removing duplicate pages:', error);
      return 0;
    }
  }
};
