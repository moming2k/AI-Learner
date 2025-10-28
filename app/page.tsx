'use client';

import { useState, useEffect } from 'react';
import { WikiPage as WikiPageType, LearningSession, Bookmark } from '@/lib/types';
import { storage } from '@/lib/storage';
import { generateWikiPage, answerQuestion, generateMindmapNode } from '@/lib/ai-service';
import TopicSearch from '@/components/TopicSearch';
import WikiPage from '@/components/WikiPage';
import QuestionInput from '@/components/QuestionInput';
import Sidebar from '@/components/Sidebar';
import Toast, { ToastMessage } from '@/components/Toast';
import Library from '@/components/Library';
import { BookOpen, Sparkles, Library as LibraryIcon, Home as HomeIcon, FolderOpen, Share2, Download, Upload } from 'lucide-react';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<WikiPageType | null>(null);
  const [session, setSession] = useState<LearningSession | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPages, setLoadingPages] = useState<Set<string>>(new Set());
  const [loadingTopics, setLoadingTopics] = useState<Set<string>>(new Set()); // Track topics being generated
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);

  // Toast helper functions
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

  // Helper function to remove consecutive duplicates from breadcrumbs
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

  useEffect(() => {
    // Clean up duplicate pages on mount (from previous hover bug)
    const duplicatesRemoved = storage.removeDuplicatePages();
    if (duplicatesRemoved > 0) {
      addToast({
        title: 'Cleanup Complete',
        message: `Removed ${duplicatesRemoved} duplicate page${duplicatesRemoved > 1 ? 's' : ''}`,
        type: 'success',
        duration: 5000
      });
    }

    // Load session and bookmarks on mount
    const savedSession = storage.getCurrentSession();
    const savedBookmarks = storage.getBookmarks();

    if (savedSession) {
      // Clean up any existing duplicates in breadcrumbs
      const cleanedSession = {
        ...savedSession,
        breadcrumbs: deduplicateBreadcrumbs(savedSession.breadcrumbs)
      };

      // Save the cleaned session if duplicates were removed
      if (cleanedSession.breadcrumbs.length !== savedSession.breadcrumbs.length) {
        storage.saveSession(cleanedSession);
      }

      setSession(cleanedSession);
      const page = storage.getPage(cleanedSession.currentPageId);
      if (page) setCurrentPage(page);
    }

    setBookmarks(savedBookmarks);
  }, []);

  const createNewSession = (firstPageId: string, firstPageTitle: string) => {
    const newSession: LearningSession = {
      id: 'session-' + Date.now(),
      name: `Learning: ${firstPageTitle}`,
      startedAt: Date.now(),
      pages: [firstPageId],
      currentPageId: firstPageId,
      breadcrumbs: [{ id: firstPageId, title: firstPageTitle }]
    };

    storage.saveSession(newSession);
    setSession(newSession);
  };

  const updateSession = (pageId: string, pageTitle: string) => {
    if (!session) {
      createNewSession(pageId, pageTitle);
      return;
    }

    // Don't add to breadcrumbs if it's the same as the current page
    const lastBreadcrumb = session.breadcrumbs[session.breadcrumbs.length - 1];
    const shouldAddBreadcrumb = !lastBreadcrumb || lastBreadcrumb.id !== pageId;

    // Build new breadcrumbs and deduplicate
    const newBreadcrumbs = shouldAddBreadcrumb
      ? [...session.breadcrumbs, { id: pageId, title: pageTitle }]
      : session.breadcrumbs;

    const updatedSession = {
      ...session,
      pages: session.pages.includes(pageId)
        ? session.pages
        : [...session.pages, pageId],
      currentPageId: pageId,
      breadcrumbs: deduplicateBreadcrumbs(newBreadcrumbs).slice(-10) // Deduplicate and keep last 10 items
    };

    storage.saveSession(updatedSession);
    setSession(updatedSession);
  };

  const handleTopicSearch = async (
    topic: string,
    navigateAfter = true,
    options?: { forceRegenerate?: boolean }
  ) => {
    const normalizedTopic = topic.toLowerCase().trim();
    const forceRegenerate = options?.forceRegenerate ?? false;

    const existingPages = storage.searchPages(topic);
    const exactMatch = existingPages.find(
      p => p.title.toLowerCase() === normalizedTopic
    );

    const shouldNavigateExisting =
      !!exactMatch && !forceRegenerate && !exactMatch.isPlaceholder;
    const shouldReuseExistingId =
      !!exactMatch && (forceRegenerate || exactMatch.isPlaceholder);

    if (shouldNavigateExisting) {
      if (navigateAfter) {
        setCurrentPage(exactMatch);
        updateSession(exactMatch.id, exactMatch.title);
        addToast({
          title: 'Page found',
          message: `"${exactMatch.title}" already exists`,
          type: 'info',
          duration: 3000
        });
      }
      return exactMatch;
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

    const shouldAddTempBreadcrumb = navigateAfter && !exactMatch;

    if (shouldAddTempBreadcrumb) {
      setSession(prev => {
        if (!prev) return prev;
        const tempBreadcrumb = { id: loadingId, title: topic };
        return {
          ...prev,
          breadcrumbs: [...prev.breadcrumbs, tempBreadcrumb].slice(-10)
        };
      });
    }

    const toastId = addToast({
      title: `Generating "${topic}"...`,
      message: 'Please wait while we create this page',
      type: 'loading',
      duration: 0
    });

    if (navigateAfter) {
      setIsLoading(true);
    }

    try {
      const page = await generateWikiPage({
        topic,
        existingPageId: shouldReuseExistingId && exactMatch ? exactMatch.id : undefined
      });
      storage.savePage(page);

      const node = generateMindmapNode(page);
      storage.saveMindmapNode(node);

      updateToast(toastId, {
        title: `"${topic}" is ready!`,
        message: 'Page generated successfully',
        type: 'success',
        duration: 5000
      });

      if (navigateAfter) {
        setCurrentPage(page);
        updateSession(page.id, page.title);
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

      if (shouldAddTempBreadcrumb) {
        setSession(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            breadcrumbs: prev.breadcrumbs.filter(b => b.id !== loadingId)
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

      if (navigateAfter) {
        setIsLoading(false);
      }
    }
  };

  const handleRegenerateCurrentPage = async () => {
    if (!currentPage) return;

    await handleTopicSearch(currentPage.title, true, { forceRegenerate: true });
  };

  const handleAskQuestion = async (question: string) => {
    if (!currentPage) return;

    setIsLoading(true);
    try {
      // Check if similar page exists
      const existingPages = storage.searchPages(question);
      const similarPage = existingPages.find(
        p => p.title.toLowerCase().includes(question.toLowerCase().slice(0, 20))
      );

      if (similarPage) {
        setCurrentPage(similarPage);
        updateSession(similarPage.id, similarPage.title);
        return;
      }

      // Generate answer as new page
      const answerPage = await answerQuestion(question, currentPage);
      storage.savePage(answerPage);

      // Update mindmap
      const parentNode = storage.getMindmap().find(n => n.id === currentPage.id);
      const node = generateMindmapNode(answerPage, parentNode);
      if (parentNode) {
        parentNode.children.push(node.id);
        storage.saveMindmapNode(parentNode);
      }
      storage.saveMindmapNode(node);

      setCurrentPage(answerPage);
      updateSession(answerPage.id, answerPage.title);
    } catch (error) {
      console.error('Error asking question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmark = () => {
    if (!currentPage) return;

    const isBookmarked = bookmarks.some(b => b.pageId === currentPage.id);

    if (isBookmarked) {
      storage.removeBookmark(currentPage.id);
      setBookmarks(bookmarks.filter(b => b.pageId !== currentPage.id));
    } else {
      const newBookmark: Bookmark = {
        pageId: currentPage.id,
        title: currentPage.title,
        timestamp: Date.now()
      };
      storage.addBookmark(newBookmark);
      setBookmarks([...bookmarks, newBookmark]);
    }
  };

  const handleNavigateToPage = (pageId: string) => {
    const page = storage.getPage(pageId);
    if (page) {
      setCurrentPage(page);
      updateSession(page.id, page.title);
    }
  };

  const isBookmarked = currentPage
    ? bookmarks.some(b => b.pageId === currentPage.id)
    : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {/* Header */}
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
                        {storage.getPages().length} pages in library
                      </span>
                    </div>
                  )}
                  {currentPage && (
                    <button
                      onClick={() => {
                        setCurrentPage(null);
                        // Optionally save current session as a collection
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

          {/* Content Area */}
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
                <TopicSearch
                  onSearch={async (topic) => { await handleTopicSearch(topic); }}
                  isLoading={isLoading}
                />
              </div>
            ) : (
              <>
                <QuestionInput onAsk={handleAskQuestion} isLoading={isLoading} />
                <WikiPage
                  page={currentPage}
                  isBookmarked={isBookmarked}
                  onBookmark={handleBookmark}
                  onNavigate={(topic) => { void handleTopicSearch(topic); }}
                  onRegenerate={handleRegenerateCurrentPage}
                  isLoading={isLoading}
                />
              </>
            )}
          </div>
        </main>

        {/* Sidebar */}
        {currentPage && (
          <Sidebar
            currentPage={currentPage}
            bookmarks={bookmarks}
            session={session}
            onNavigate={handleNavigateToPage}
            onBookmarkClick={handleNavigateToPage}
            onSearch={async (query) => { await handleTopicSearch(query, true); }}
            loadingPages={loadingPages}
          />
        )}
      </div>

      {/* Library Modal */}
      {showLibrary && (
        <Library
          pages={storage.getPages()}
          onPageClick={(pageId) => {
            const page = storage.getPage(pageId);
            if (page) {
              setCurrentPage(page);
              updateSession(page.id, page.title);
              setShowLibrary(false);
            }
          }}
          currentPageId={currentPage?.id}
          onClose={() => setShowLibrary(false)}
          onCleanup={() => {
            // Refresh the page after cleanup
            window.location.reload();
          }}
        />
      )}

      {/* Toast Notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
