'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { WikiPage as WikiPageType, LearningSession, Bookmark, GenerationJobType, GenerationJobInput } from '@/lib/types';
import { storage } from '@/lib/storage';
import { generateMindmapNode } from '@/lib/ai-service';
import TopicSearch from '@/components/TopicSearch';
import WikiPage from '@/components/WikiPage';
import QuestionInput from '@/components/QuestionInput';
import Sidebar from '@/components/Sidebar';
import Toast, { ToastMessage } from '@/components/Toast';
import Library from '@/components/Library';
import DatabaseSelector from '@/components/DatabaseSelector';
import { BookOpen, Sparkles, Library as LibraryIcon, Home as HomeIcon } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState<WikiPageType | null>(null);
  const [session, setSession] = useState<LearningSession | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [allPages, setAllPages] = useState<WikiPageType[]>([]);
  const [viewedPageIds, setViewedPageIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPages, setLoadingPages] = useState<Set<string>>(new Set());
  const [loadingTopics, setLoadingTopics] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const updateToast = (id: string, updates: Partial<ToastMessage>) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deduplicateBreadcrumbs = (breadcrumbs: Array<{ id: string; title: string }>) => {
    if (!breadcrumbs || breadcrumbs.length === 0) return [];
    const deduplicated = [breadcrumbs[0]];
    for (let i = 1; i < breadcrumbs.length; i++) {
      if (breadcrumbs[i].id !== breadcrumbs[i - 1].id) {
        deduplicated.push(breadcrumbs[i]);
      }
    }
    return deduplicated;
  };

  const loadAllData = async (showToast: boolean = false) => {
    // Execute all data loading operations in parallel for faster startup
    const [duplicatesRemoved, savedSession, savedBookmarks, pages, viewedIds] = await Promise.all([
      storage.removeDuplicatePages(),
      storage.getCurrentSession(),
      storage.getBookmarks(),
      storage.getPages(),
      storage.getViewedPageIds()
    ]);

    if (duplicatesRemoved > 0 && showToast) {
      addToast({
        title: 'Cleanup Complete',
        message: `Removed ${duplicatesRemoved} duplicate page${duplicatesRemoved > 1 ? 's' : ''}`,
        type: 'success',
        duration: 5000
      });
    }

    if (savedSession) {
      // Create a set of valid page IDs in current database
      const validPageIds = new Set(pages.map(p => p.id));

      // Clean up loading IDs from breadcrumbs by trying to find the real page
      // AND filter out breadcrumbs that reference pages not in this database
      const cleanedBreadcrumbs = savedSession.breadcrumbs.map((crumb) => {
        if (crumb.id.startsWith('loading-')) {
          // Try to find a page with matching title
          const matchingPage = pages.find(
            p => p.title.toLowerCase() === crumb.title.toLowerCase()
          );
          if (matchingPage) {
            return { id: matchingPage.id, title: matchingPage.title };
          }
          // If no match found for loading ID, return null to filter it out
          return null;
        }
        // Check if this page ID exists in current database
        if (!validPageIds.has(crumb.id)) {
          return null; // Filter out pages from other databases
        }
        return crumb;
      });

      // Filter out null entries (invalid breadcrumbs)
      const validBreadcrumbs = cleanedBreadcrumbs.filter(b => b !== null) as Array<{ id: string; title: string }>;

      const cleanedSession = {
        ...savedSession,
        breadcrumbs: deduplicateBreadcrumbs(validBreadcrumbs),
        pages: savedSession.pages.filter(pageId => validPageIds.has(pageId))
      };

      // Also fix currentPageId if it's a loading ID or invalid
      if (cleanedSession.currentPageId.startsWith('loading-')) {
        const matchingPage = pages.find(
          p => p.title.toLowerCase() === savedSession.breadcrumbs.find(b => b.id === cleanedSession.currentPageId)?.title.toLowerCase()
        );
        if (matchingPage) {
          cleanedSession.currentPageId = matchingPage.id;
        }
      }

      // If currentPageId is not in valid pages, use the last valid breadcrumb or clear
      if (!validPageIds.has(cleanedSession.currentPageId)) {
        if (validBreadcrumbs.length > 0) {
          cleanedSession.currentPageId = validBreadcrumbs[validBreadcrumbs.length - 1].id;
        } else {
          // No valid breadcrumbs, clear the session
          setSession(null);
          setCurrentPage(null);
          setBookmarks(savedBookmarks);
          setAllPages(pages);
          return;
        }
      }

      if (cleanedSession.breadcrumbs.length !== savedSession.breadcrumbs.length ||
          cleanedSession.currentPageId !== savedSession.currentPageId ||
          cleanedSession.pages.length !== savedSession.pages.length) {
        await storage.saveSession(cleanedSession);
      }

      setSession(cleanedSession);
      const page = await storage.getPage(cleanedSession.currentPageId);
      if (page) setCurrentPage(page);
    } else {
      // Clear state when switching to empty database
      setSession(null);
      setCurrentPage(null);
    }

    setBookmarks(savedBookmarks);
    setAllPages(pages);
    setViewedPageIds(new Set(viewedIds));
  };

  const handleDatabaseChange = async () => {
    // Clear current state to prevent mixing data from different databases
    setCurrentPage(null);
    setSession(null);
    setBookmarks([]);
    setAllPages([]);
    setViewedPageIds(new Set());
    setLoadingPages(new Set());
    setLoadingTopics(new Set());

    // Reload all data from the new database
    await loadAllData(false);

    addToast({
      title: 'Library switched',
      message: 'Now viewing the selected library',
      type: 'success',
      duration: 3000
    });
  };

  const recordPageView = useCallback(async (pageId: string) => {
    // Record the view in the database
    const success = await storage.recordPageView(pageId);

    if (!success) {
      console.warn(`Failed to record page view for page ${pageId} - view tracking may be incomplete`);
    }

    // Update local state to reflect the view (optimistic update)
    if (!viewedPageIds.has(pageId)) {
      setViewedPageIds(prev => new Set([...prev, pageId]));
    }
  }, [viewedPageIds]);

  useEffect(() => {
    loadAllData(true).then(() => setIsInitialized(true));
  }, []);

  // Handle URL changes (back/forward button)
  // Handle URL changes (back/forward button and navigation)
  useEffect(() => {
    if (!isInitialized) return;

    const pageId = searchParams.get('page');
    const pageTitle = searchParams.get('title');
    const breadcrumbIndex = searchParams.get('breadcrumbIndex');

    if (pageId) {
      // Load page from URL
      const loadPageFromUrl = async () => {
        const page = await storage.getPage(pageId);
        if (page) {
          setCurrentPage(page);
          await recordPageView(pageId);
          
          // Handle breadcrumb navigation (trim breadcrumbs)
          if (breadcrumbIndex !== null && session) {
            const index = parseInt(breadcrumbIndex, 10);
            if (!isNaN(index) && index >= 0) {
              const updatedSession = {
                ...session,
                currentPageId: pageId,
                breadcrumbs: session.breadcrumbs.slice(0, index + 1)
              };
              await storage.saveSession(updatedSession);
              setSession(updatedSession);
              return; // Skip normal session update
            }
          }
          
          // Normal navigation: update session with actual page title
          const title = page.title || pageTitle || 'Untitled';
          await updateSession(pageId, title);
        }
      };
      loadPageFromUrl();
    } else {
      // No page in URL, clear current page
      setCurrentPage(null);
    }
  }, [searchParams, isInitialized, recordPageView]);

  // Helper function to navigate with URL update and scroll to top
  const navigateToPageWithHistory = (pageId: string, pageTitle: string) => {
    // Update URL for browser history - include title for session updates
    router.push(`?page=${encodeURIComponent(pageId)}&title=${encodeURIComponent(pageTitle)}`, { scroll: false });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Note: Page loading, view recording, and session update happen in useEffect above
  };

  const createNewSession = async (firstPageId: string, firstPageTitle: string) => {
    const newSession: LearningSession = {
      id: 'session-' + Date.now(),
      name: `Learning: ${firstPageTitle}`,
      startedAt: Date.now(),
      pages: [firstPageId],
      currentPageId: firstPageId,
      breadcrumbs: [{ id: firstPageId, title: firstPageTitle }]
    };

    await storage.saveSession(newSession);
    setSession(newSession);
  };

  const updateSession = async (pageId: string, pageTitle: string) => {
    if (!session) {
      await createNewSession(pageId, pageTitle);
      return;
    }

    const lastBreadcrumb = session.breadcrumbs[session.breadcrumbs.length - 1];

    // Check if the last breadcrumb is a temporary loading placeholder that should be replaced
    const isReplacingPlaceholder = lastBreadcrumb &&
                                    lastBreadcrumb.id.startsWith('loading-') &&
                                    pageId !== lastBreadcrumb.id;

    let newBreadcrumbs;
    if (isReplacingPlaceholder) {
      // Replace the last (loading) breadcrumb with the real page
      newBreadcrumbs = [...session.breadcrumbs.slice(0, -1), { id: pageId, title: pageTitle }];
    } else {
      const shouldAddBreadcrumb = !lastBreadcrumb || lastBreadcrumb.id !== pageId;
      newBreadcrumbs = shouldAddBreadcrumb
        ? [...session.breadcrumbs, { id: pageId, title: pageTitle }]
        : session.breadcrumbs;
    }

    const updatedSession = {
      ...session,
      pages: session.pages.includes(pageId) ? session.pages : [...session.pages, pageId],
      currentPageId: pageId,
      breadcrumbs: deduplicateBreadcrumbs(newBreadcrumbs).slice(-10)
    };

    await storage.saveSession(updatedSession);
    setSession(updatedSession);
  };

  // Helper function to create a generation job and poll for completion
  const createAndPollJob = async (
    type: GenerationJobType,
    input: GenerationJobInput,
    onProgress?: () => void
  ): Promise<WikiPageType> => {
    // Create the job
    const job = await storage.createJob(type, input);

    // Trigger processing and fail fast if it fails
    try {
      await storage.processJob(job.id);
    } catch (err) {
      console.error('Error processing job:', err);
      throw err;
    }

    // Poll for completion
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout;

      const pollInterval = setInterval(async () => {
        try {
          const updatedJob = await storage.getJob(job.id);

          if (!updatedJob) {
            clearInterval(pollInterval);
            clearTimeout(timeoutId);
            reject(new Error('Job not found'));
            return;
          }

          if (updatedJob.status === 'completed' && updatedJob.output) {
            clearInterval(pollInterval);
            clearTimeout(timeoutId);
            resolve(updatedJob.output);
          } else if (updatedJob.status === 'failed') {
            clearInterval(pollInterval);
            clearTimeout(timeoutId);
            reject(new Error(updatedJob.error || 'Job failed'));
          } else if (onProgress) {
            onProgress();
          }
        } catch (error) {
          clearInterval(pollInterval);
          clearTimeout(timeoutId);
          reject(error);
        }
      }, 1000); // Poll every second

      // Set a timeout of 5 minutes
      timeoutId = setTimeout(() => {
        clearInterval(pollInterval);
        reject(new Error('Job timeout'));
      }, 5 * 60 * 1000);
    });
  };

  const handleTopicSearch = async (
    topic: string,
    navigateAfter = true,
    options?: { forceRegenerate?: boolean }
  ) => {
    const normalizedTopic = topic.toLowerCase().trim();
    const forceRegenerate = options?.forceRegenerate ?? false;

    const existingPages = await storage.searchPages(topic);
    const exactMatch = existingPages.find(p => p.title.toLowerCase() === normalizedTopic);

    const shouldNavigateExisting = !!exactMatch && !forceRegenerate && !exactMatch.isPlaceholder;
    const shouldReuseExistingId = !!exactMatch && (forceRegenerate || exactMatch.isPlaceholder);

    // If page exists, navigate immediately (only if navigateAfter is true)
    if (shouldNavigateExisting) {
      if (navigateAfter) {
        navigateToPageWithHistory(exactMatch.id, exactMatch.title);
        addToast({
          title: 'Page found',
          message: `"${exactMatch.title}" already exists`,
          type: 'info',
          duration: 3000
        });
      }
      return exactMatch;
    }

    // If page doesn't exist and user clicked a link (not from main page), generate in background (no navigation)
    // This means: clicking links only navigates if page exists; otherwise generates in background
    // But if searching from main page (currentPage is null), always navigate after generation
    if (navigateAfter && !exactMatch && currentPage !== null) {
      // Override: don't navigate for non-existent pages when clicking links from other pages
      navigateAfter = false;
    }

    if (loadingTopics.has(normalizedTopic)) {
      addToast({
        title: 'Already generating',
        message: `"${topic}" is already being generated`,
        type: 'info',
        duration: 3000
      });
      return;
    }

    setLoadingTopics(prev => new Set(prev).add(normalizedTopic));

    const fallbackLoadingId = `loading-${normalizedTopic}`;
    const loadingId = shouldReuseExistingId && exactMatch ? exactMatch.id : fallbackLoadingId;
    setLoadingPages(prev => new Set(prev).add(loadingId));

    // Create a placeholder page immediately only if navigating (from TopicSearch on home page)
    if (navigateAfter) {
      const placeholderPage: WikiPageType = {
        id: loadingId,
        title: topic,
        content: '# Generating content...\n\nPlease wait while we create this page for you. This usually takes a few seconds.',
        relatedTopics: [],
        suggestedQuestions: [],
        createdAt: Date.now(),
        isPlaceholder: true
      };

      // Immediately show the placeholder page
      setCurrentPage(placeholderPage);
      await updateSession(loadingId, topic);
    }

    const toastId = addToast({
      title: `Generating "${topic}"...`,
      message: 'Please wait while we create this page',
      type: 'loading',
      duration: 0
    });

    try {
      const page = await createAndPollJob('wiki_page', {
        topic,
        parentId: undefined
      });
      await storage.savePage(page);

      const node = generateMindmapNode(page);
      await storage.saveMindmapNode(node);

      // Use optimistic update instead of refetching all pages
      setAllPages(prev => {
        const existing = prev.find(p => p.id === page.id);
        if (existing) {
          return prev.map(p => p.id === page.id ? page : p);
        }
        return [...prev, page];
      });

      updateToast(toastId, {
        title: `"${topic}" is ready!`,
        message: 'Page generated successfully',
        type: 'success',
        duration: 5000
      });

      if (navigateAfter) {
        // Navigate to the generated page
        navigateToPageWithHistory(page.id, page.title);
      }

      return page;
    } catch (error) {
      console.error('Error searching topic:', error);
      updateToast(toastId, {
        title: 'Failed to generate page',
        message: 'Please try again',
        type: 'error',
        duration: 5000
      });

      // If we're showing a placeholder, update it to show error
      if (navigateAfter) {
        setCurrentPage(prev => {
          if (!prev || prev.id !== loadingId) return prev;
          return {
            ...prev,
            content: '# Generation failed\n\nWe encountered an error while generating this page. Please check your API configuration and try again.',
            isPlaceholder: true
          };
        });
      }
    } finally {
      setLoadingPages(prev => {
        const updated = new Set(prev);
        updated.delete(loadingId);
        return updated;
      });

      setLoadingTopics(prev => {
        const updated = new Set(prev);
        updated.delete(normalizedTopic);
        return updated;
      });
    }
  };

  const handleRegenerateCurrentPage = async () => {
    if (!currentPage) return;
    await handleTopicSearch(currentPage.title, true, { forceRegenerate: true });
  };

  const handleAskQuestion = async (question: string) => {
    if (!currentPage) return;

    setIsLoading(true);

    // Create a temporary loading ID for this question
    const loadingId = `loading-${question.toLowerCase().trim()}`;
    setLoadingPages(prev => new Set(prev).add(loadingId));

    // Create placeholder page immediately
    const placeholderPage: WikiPageType = {
      id: loadingId,
      title: question,
      content: '# Generating content...\n\nPlease wait while we create this page for you. This usually takes a few seconds.',
      relatedTopics: [],
      suggestedQuestions: [],
      createdAt: Date.now(),
      isPlaceholder: true,
      parentId: currentPage.id
    };

    // Immediately show the placeholder page
    setCurrentPage(placeholderPage);
    await updateSession(loadingId, question);

    const toastId = addToast({
      title: `Generating "${question}"...`,
      message: 'Please wait while we create this page',
      type: 'loading',
      duration: 0
    });

    try {
      const existingPages = await storage.searchPages(question);
      const similarPage = existingPages.find(
        p => p.title.toLowerCase().includes(question.toLowerCase().slice(0, 20))
      );

      if (similarPage) {
        navigateToPageWithHistory(similarPage.id, similarPage.title);
        updateToast(toastId, {
          title: 'Page found',
          message: `"${similarPage.title}" already exists`,
          type: 'info',
          duration: 3000
        });
        return;
      }

      const answerPage = await createAndPollJob('question', {
        question,
        currentPageContent: currentPage.content,
        parentId: currentPage.id
      });
      await storage.savePage(answerPage);

      // Fetch only the parent node instead of entire mindmap for better performance
      const parentNode = await storage.getMindmapNode(currentPage.id);
      const node = generateMindmapNode(answerPage, parentNode || undefined);

      // Batch save both nodes in one call for better performance
      const nodesToSave = [node];
      if (parentNode) {
        parentNode.children.push(node.id);
        nodesToSave.unshift(parentNode);
      }
      await storage.saveMindmapNodes(nodesToSave);

      // Use optimistic update instead of refetching all pages
      setAllPages(prev => {
        // Only add answerPage if it does not already exist (by id)
        if (prev.some(page => page.id === answerPage.id)) {
          return prev;
        }
        return [...prev, answerPage];
      });

      updateToast(toastId, {
        title: `"${question}" is ready!`,
        message: 'Page generated successfully',
        type: 'success',
        duration: 5000
      });

      // Navigate to the generated answer page
      navigateToPageWithHistory(answerPage.id, answerPage.title);
    } catch (error) {
      console.error('Error asking question:', error);

      updateToast(toastId, {
        title: 'Failed to generate page',
        message: 'Please try again',
        type: 'error',
        duration: 5000
      });

      // Update placeholder to show error
      setCurrentPage(prev => {
        if (!prev || prev.id !== loadingId) return prev;
        return {
          ...prev,
          content: '# Generation failed\n\nWe encountered an error while generating this page. Please check your API configuration and try again.',
          isPlaceholder: true
        };
      });
    } finally {
      setIsLoading(false);
      setLoadingPages(prev => {
        const updated = new Set(prev);
        updated.delete(loadingId);
        return updated;
      });
    }
  };

  const handleBookmark = async () => {
    if (!currentPage) return;

    const isBookmarked = bookmarks.some(b => b.pageId === currentPage.id);

    if (isBookmarked) {
      await storage.removeBookmark(currentPage.id);
      setBookmarks(bookmarks.filter(b => b.pageId !== currentPage.id));
    } else {
      const newBookmark: Bookmark = {
        pageId: currentPage.id,
        title: currentPage.title,
        timestamp: Date.now()
      };
      await storage.addBookmark(newBookmark);
      setBookmarks([...bookmarks, newBookmark]);
    }
  };

  const handleGenerateFromSelection = async (selectedText: string, context: string) => {
    if (!currentPage) return;

    setIsLoading(true);

    // Create a temporary loading ID for this selection
    const loadingId = `loading-${selectedText.toLowerCase().trim()}-${Date.now()}`;
    setLoadingPages(prev => new Set(prev).add(loadingId));

    // Create placeholder page immediately
    const placeholderPage: WikiPageType = {
      id: loadingId,
      title: selectedText,
      content: '# Generating content...\n\nPlease wait while we create this page for you. This usually takes a few seconds.',
      relatedTopics: [],
      suggestedQuestions: [],
      createdAt: Date.now(),
      isPlaceholder: true,
      parentId: currentPage.id
    };

    // Immediately show the placeholder page
    setCurrentPage(placeholderPage);
    await updateSession(loadingId, selectedText);

    const toastId = addToast({
      title: `Generating "${selectedText}"...`,
      message: 'Creating contextual content based on your selection',
      type: 'loading',
      duration: 0
    });

    try {
      // Check if a similar page already exists
      const existingPages = await storage.searchPages(selectedText);
      const similarPage = existingPages.find(
        p => p.title.toLowerCase() === selectedText.toLowerCase().trim()
      );

      if (similarPage && !similarPage.isPlaceholder) {
        navigateToPageWithHistory(similarPage.id, similarPage.title);
        updateToast(toastId, {
          title: 'Page found',
          message: `"${similarPage.title}" already exists`,
          type: 'info',
          duration: 3000
        });
        return;
      }

      const newPage = await createAndPollJob('selection', {
        selectedText,
        context,
        parentId: currentPage.id
      });
      await storage.savePage(newPage);

      // Fetch only the parent node instead of entire mindmap for better performance
      const parentNode = await storage.getMindmapNode(currentPage.id);
      const node = generateMindmapNode(newPage, parentNode || undefined);

      // Batch save both nodes in one call for better performance
      const nodesToSave = [node];
      if (parentNode) {
        parentNode.children.push(node.id);
        nodesToSave.unshift(parentNode);
      }
      await storage.saveMindmapNodes(nodesToSave);

      // Use optimistic update instead of refetching all pages
      setAllPages(prev => {
        if (prev.some(page => page.id === newPage.id)) {
          return prev;
        }
        return [...prev, newPage];
      });

      updateToast(toastId, {
        title: `"${selectedText}" is ready!`,
        message: 'Page generated successfully from your selection',
        type: 'success',
        duration: 5000
      });

      // Navigate to the generated page
      navigateToPageWithHistory(newPage.id, newPage.title);
    } catch (error) {
      console.error('Error generating from selection:', error);

      updateToast(toastId, {
        title: 'Failed to generate page',
        message: 'Please try again',
        type: 'error',
        duration: 5000
      });

      // Update placeholder to show error
      setCurrentPage(prev => {
        if (!prev || prev.id !== loadingId) return prev;
        return {
          ...prev,
          content: '# Generation failed\n\nWe encountered an error while generating this page. Please check your API configuration and try again.',
          isPlaceholder: true
        };
      });
    } finally {
      setIsLoading(false);
      setLoadingPages(prev => {
        const updated = new Set(prev);
        updated.delete(loadingId);
        return updated;
      });
    }
  };

  const handleNavigateToPage = async (pageId: string) => {
    const page = await storage.getPage(pageId);
    if (page) {
      // Check if this page is in the current breadcrumbs
      if (session) {
        const breadcrumbIndex = session.breadcrumbs.findIndex(b => b.id === pageId);

        if (breadcrumbIndex >= 0) {
          // Breadcrumb navigation - include index to trim breadcrumbs
          router.push(`?page=${encodeURIComponent(pageId)}&title=${encodeURIComponent(page.title)}&breadcrumbIndex=${breadcrumbIndex}`, { scroll: false });
        } else {
          // Normal navigation - not in breadcrumbs, add it normally
          navigateToPageWithHistory(page.id, page.title);
        }
      } else {
        // No session, use normal navigation
        navigateToPageWithHistory(page.id, page.title);
      }
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isBookmarked = currentPage ? bookmarks.some(b => b.pageId === currentPage.id) : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="flex">
        <main className="flex-1 min-h-screen">
          <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 shadow-sm">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      AI Learning Wiki
                    </h1>
                    <p className="text-sm text-gray-500">Explore knowledge through intelligent questions</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {session && (
                    <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-medium text-gray-700">
                        {allPages.length} pages in library
                      </span>
                    </div>
                  )}
                  {currentPage && (
                    <button
                      onClick={() => {
                        setCurrentPage(null);
                        router.push('/');
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg
                               bg-gradient-to-r from-gray-500 to-gray-600
                               text-white font-medium hover:from-gray-600 hover:to-gray-700
                               transition-all duration-200 hover:shadow-lg"
                      title="Start new research topic"
                    >
                      <HomeIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Home</span>
                    </button>
                  )}
                  <DatabaseSelector onDatabaseChange={handleDatabaseChange} />
                  <button
                    onClick={() => setShowLibrary(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg
                             bg-gradient-to-r from-indigo-500 to-purple-600
                             text-white font-medium hover:from-indigo-600 hover:to-purple-700
                             transition-all duration-200 hover:shadow-lg"
                  >
                    <LibraryIcon className="w-4 h-4" />
                    <span>Library</span>
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto px-6 py-8">
            {!currentPage ? (
              <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
                <div className="text-center space-y-4 mb-8">
                  <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Start Your Learning Journey
                  </h2>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Enter any topic to generate a comprehensive wiki page powered by AI
                  </p>
                </div>
                <TopicSearch onSearch={handleTopicSearch} isLoading={isLoading} />
              </div>
            ) : (
              <>
                <QuestionInput onAsk={handleAskQuestion} isLoading={isLoading} />
                <WikiPage
                  page={currentPage}
                  isBookmarked={isBookmarked}
                  onBookmark={handleBookmark}
                  onNavigate={handleTopicSearch}
                  onRegenerate={handleRegenerateCurrentPage}
                  isLoading={isLoading}
                  onGenerateFromSelection={handleGenerateFromSelection}
                  allPages={allPages}
                  viewedPageIds={viewedPageIds}
                />
              </>
            )}
          </div>
        </main>

        {currentPage && (
          <Sidebar
            currentPage={currentPage}
            bookmarks={bookmarks}
            session={session}
            onNavigate={handleNavigateToPage}
            onBookmarkClick={handleNavigateToPage}
            onSearch={handleTopicSearch}
            loadingPages={loadingPages}
            allPages={allPages}
            viewedPageIds={viewedPageIds}
          />
        )}
      </div>

      {showLibrary && (
        <Library
          pages={allPages}
          onPageClick={async (pageId) => {
            const page = await storage.getPage(pageId);
            if (page) {
              navigateToPageWithHistory(page.id, page.title);
              setShowLibrary(false);
            }
          }}
          currentPageId={currentPage?.id}
          onClose={() => setShowLibrary(false)}
          onCleanup={async () => {
            const pages = await storage.getPages();
            setAllPages(pages);
          }}
          onDeletePage={async (pageId) => {
            // Refresh the pages list
            const pages = await storage.getPages();
            setAllPages(pages);

            // If the deleted page is the current page, clear it
            if (currentPage?.id === pageId) {
              setCurrentPage(null);
            }

            // Remove from bookmarks if bookmarked
            const bookmark = bookmarks.find(b => b.pageId === pageId);
            if (bookmark) {
              await storage.removeBookmark(pageId);
              setBookmarks(bookmarks.filter(b => b.pageId !== pageId));
            }

            // Clean up session breadcrumbs
            if (session) {
              const updatedBreadcrumbs = session.breadcrumbs.filter(b => b.id !== pageId);
              const updatedPages = session.pages.filter(id => id !== pageId);

              if (updatedBreadcrumbs.length > 0) {
                const updatedSession = {
                  ...session,
                  breadcrumbs: updatedBreadcrumbs,
                  pages: updatedPages,
                  currentPageId: currentPage?.id === pageId
                    ? updatedBreadcrumbs[updatedBreadcrumbs.length - 1].id
                    : session.currentPageId
                };
                await storage.saveSession(updatedSession);
                setSession(updatedSession);
              } else {
                // No more breadcrumbs, clear session
                setSession(null);
              }
            }
          }}
          viewedPageIds={viewedPageIds}
        />
      )}

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
