'use client';

import { WikiPage } from '@/lib/types';
import { storage } from '@/lib/storage';
import { BookOpen, Clock, Search, Grid, List, X, Trash2, AlertCircle } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

interface LibraryProps {
  pages: WikiPage[];
  onPageClick: (pageId: string) => void;
  currentPageId?: string;
  onClose?: () => void;
  onCleanup?: () => void;
}

export default function Library({ pages, onPageClick, currentPageId, onClose, onCleanup }: LibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical'>('recent');
  const [duplicateInfo, setDuplicateInfo] = useState<any>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Check for duplicates on mount
  useEffect(() => {
    const info = storage.getDuplicateInfo();
    if (info.duplicatesFound > 0) {
      setDuplicateInfo(info);
      setShowDuplicateWarning(true);
    }
  }, []);

  // Filter and sort pages
  const displayedPages = useMemo(() => {
    let filtered = pages;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = pages.filter(
        page =>
          page.title.toLowerCase().includes(query) ||
          page.content.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      } else {
        // Recent first
        return b.createdAt - a.createdAt;
      }
    });

    return sorted;
  }, [pages, searchQuery, sortBy]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      }
      return date.toLocaleDateString();
    }
  };

  const getPreview = (content: string) => {
    // Get first non-header paragraph
    const lines = content.split('\n');
    const preview = lines.find(line => line.length > 20 && !line.startsWith('#'));
    return preview ? preview.slice(0, 150) + '...' : 'No preview available';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Knowledge Library</h2>
                <p className="text-sm text-gray-500">{pages.length} pages generated</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>

          {/* Duplicate Warning */}
          {showDuplicateWarning && duplicateInfo && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  Found {duplicateInfo.duplicatesFound} duplicate{duplicateInfo.duplicatesFound > 1 ? 's' : ''} in your library
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  You have {duplicateInfo.totalPages} total pages but only {duplicateInfo.uniquePages} unique topics.
                </p>
              </div>
              <button
                onClick={() => {
                  const removed = storage.removeDuplicatePages();
                  if (removed > 0 && onCleanup) {
                    onCleanup();
                  }
                  setShowDuplicateWarning(false);
                  setDuplicateInfo(null);
                }}
                className="px-3 py-1 text-sm bg-yellow-600 text-white rounded-lg
                         hover:bg-yellow-700 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clean Up
              </button>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300
                         focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200
                         text-gray-900 placeholder:text-gray-500"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'alphabetical')}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700
                       focus:border-blue-500 focus:outline-none"
            >
              <option value="recent">Most Recent</option>
              <option value="alphabetical">Alphabetical</option>
            </select>

            {/* View Mode */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {displayedPages.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'No pages found matching your search' : 'No pages generated yet'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedPages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => onPageClick(page.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all
                           hover:shadow-lg hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50
                           ${currentPageId === page.id
                             ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50'
                             : 'border-gray-200 bg-white'
                           }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {page.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {getPreview(page.content)}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(page.createdAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {displayedPages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => onPageClick(page.id)}
                  className={`w-full p-4 rounded-lg border text-left transition-all
                           hover:shadow-md hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50
                           ${currentPageId === page.id
                             ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50'
                             : 'border-gray-200 bg-white'
                           }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {page.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {getPreview(page.content)}
                      </p>
                    </div>
                    <div className="ml-4 text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(page.createdAt)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center text-sm text-gray-600">
            {displayedPages.length} of {pages.length} pages shown
          </div>
        </div>
      </div>
    </div>
  );
}