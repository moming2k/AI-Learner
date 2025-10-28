'use client';

import { WikiPage, Bookmark, LearningSession } from '@/lib/types';
import { BookOpen, Bookmark as BookmarkIcon, History, Search, ChevronRight, X, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  currentPage: WikiPage | null;
  bookmarks: Bookmark[];
  session: LearningSession | null;
  onNavigate: (pageId: string) => void | Promise<void>;
  onBookmarkClick: (pageId: string) => void | Promise<void>;
  onSearch: (query: string) => void | Promise<void | unknown>;
  loadingPages?: Set<string>; // Track which pages are being generated
}

export default function Sidebar({
  currentPage,
  bookmarks,
  session,
  onNavigate,
  onBookmarkClick,
  onSearch,
  loadingPages = new Set()
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      void onSearch(searchQuery.trim());
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 p-3 rounded-xl bg-white shadow-lg
                 hover:shadow-xl transition-all duration-300 lg:hidden"
      >
        {isOpen ? <X className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 right-0 h-screen w-80 bg-white border-l border-gray-200
                   shadow-2xl transition-transform duration-300 ease-in-out z-40 overflow-y-auto
                   ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-6 space-y-6">
          {/* Search */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </h3>
            <form onSubmit={handleSearch}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300
                         text-gray-900 placeholder:text-gray-500
                         focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm
                         bg-white"
              />
            </form>
          </div>

          {/* Breadcrumbs / History */}
          {session && session.breadcrumbs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                Learning Path
              </h3>
              <div className="space-y-2">
                {session.breadcrumbs.map((crumb, idx) => {
                  const isLoading = loadingPages.has(crumb.id);
                  return (
                    <button
                      key={crumb.id}
                      onClick={() => !isLoading && onNavigate(crumb.id)}
                      disabled={isLoading}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all
                               flex items-center gap-2 group relative
                               ${crumb.id === currentPage?.id
                                 ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                                 : isLoading
                                 ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 animate-pulse'
                                 : 'hover:bg-gray-100 text-gray-700'
                               }
                               ${isLoading ? 'cursor-wait' : ''}`}
                    >
                      <span className="text-xs opacity-60">
                        {idx + 1}
                      </span>
                      {isLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                      ) : (
                        <ChevronRight className="w-3 h-3 opacity-60" />
                      )}
                      <span className="truncate flex-1">{crumb.title}</span>
                      {isLoading && (
                        <span className="text-xs text-blue-600 font-medium">Generating...</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bookmarks */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BookmarkIcon className="w-4 h-4" />
              Bookmarks
            </h3>
            {bookmarks.length > 0 ? (
              <div className="space-y-2">
                {bookmarks.map((bookmark) => (
                  <button
                    key={bookmark.pageId}
                    onClick={() => onBookmarkClick(bookmark.pageId)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm
                             hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50
                             hover:border-blue-200 border border-transparent
                             transition-all text-gray-700 truncate"
                  >
                    {bookmark.title}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No bookmarks yet</p>
            )}
          </div>

          {/* Current Page Related Topics */}
          {currentPage && currentPage.relatedTopics.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Related Topics
              </h3>
              <div className="space-y-2">
                {currentPage.relatedTopics.map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={() => { void onSearch(topic); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm
                             bg-gradient-to-r from-gray-50 to-gray-100
                             border border-gray-200
                             hover:from-blue-50 hover:to-indigo-50
                             hover:border-blue-300
                             transition-all text-gray-700"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
