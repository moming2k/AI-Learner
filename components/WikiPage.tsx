'use client';

import { WikiPage as WikiPageType } from '@/lib/types';
import { BookmarkPlus, BookmarkCheck, ExternalLink, RotateCcw, AlertTriangle, CheckCircle2, Circle, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useState, useRef } from 'react';
import SelectionPopup from './SelectionPopup';
import { getStatusGradientWithHoverBorder, getStatusWhiteBackgroundClasses, getStatusIconColor, getStatusTitle, type LinkStatus } from '@/lib/status-styles';

interface WikiPageProps {
  page: WikiPageType;
  isBookmarked: boolean;
  onBookmark: () => void | Promise<void>;
  onNavigate: (topic: string) => void | Promise<void | unknown>;
  onBackgroundGenerate?: (topic: string) => void;
  onRegenerate?: () => void | Promise<void>;
  isLoading?: boolean;
  onGenerateFromSelection?: (selectedText: string, context: string) => void | Promise<void>;
  allPages?: WikiPageType[];
  viewedPageIds?: Set<string>;
}

export default function WikiPage({
  page,
  isBookmarked,
  onBookmark,
  onNavigate,
  onBackgroundGenerate,
  onRegenerate,
  isLoading,
  onGenerateFromSelection,
  allPages = [],
  viewedPageIds = new Set(),
}: WikiPageProps) {
  // Check if this is a generating placeholder (not an error)
  const isGenerating = page.isPlaceholder && page.content.includes('Generating content');
  const isError = page.isPlaceholder && page.content.includes('Generation failed');

  // Helper function to check link status
  const getLinkStatus = (linkText: string): 'viewed' | 'unviewed' | 'not-generated' => {
    const normalizedLink = linkText.toLowerCase().trim();
    const existingPage = allPages.find(p => p.title.toLowerCase() === normalizedLink);

    if (!existingPage) {
      return 'not-generated';
    }

    const isViewed = viewedPageIds.has(existingPage.id);
    return isViewed ? 'viewed' : 'unviewed';
  };

  // Selection popup state
  const [selectionData, setSelectionData] = useState<{
    text: string;
    context: string;
    position: { x: number; y: number };
  } | null>(null);
  const [popupWidth, setPopupWidth] = useState<number>(300); // Default width, will be updated dynamically
  const contentRef = useRef<HTMLDivElement>(null);

  // Find the context (paragraph or section) containing the selected text
  const findContext = (selection: Selection): string => {
    let node = selection.anchorNode;

    // Traverse up to find the nearest paragraph or section element
    while (node && node !== contentRef.current) {
      if (node instanceof Element) {
        const tagName = node.tagName?.toLowerCase();
        if (tagName === 'p' || tagName === 'li' || tagName === 'div') {
          return node.textContent?.trim() || '';
        }
      }
      node = node.parentNode;
    }

    return '';
  };

  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (selectedText && selectedText.length > 0 && onGenerateFromSelection) {
      // Get selection position
      const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      const rect = range?.getBoundingClientRect();

      if (rect && selection) {
        const context = findContext(selection);

        setSelectionData({
          text: selectedText,
          context: context,
          position: {
            x: rect.left + rect.width / 2 - popupWidth / 2, // Center popup on selection using dynamic width
            y: rect.bottom + 10, // Position below selection
          },
        });
      }
    } else {
      setSelectionData(null);
    }
  };

  const handleGenerateFromSelection = (selectedText: string, context: string) => {
    if (onGenerateFromSelection) {
      onGenerateFromSelection(selectedText, context);
    }
    setSelectionData(null);
  };

  const handleClosePopup = () => {
    setSelectionData(null);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <article className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-white p-4 shadow-xl sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3 border-b border-gray-200 pb-6">
        <h1 className="min-w-0 text-2xl font-bold break-words bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent sm:text-3xl lg:text-4xl">
          {page.title}
        </h1>
        <button
          onClick={onBookmark}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
          disabled={page.isPlaceholder}
        >
          {isBookmarked ? (
            <BookmarkCheck className="w-6 h-6 text-blue-600" />
          ) : (
            <BookmarkPlus className="w-6 h-6 text-gray-400" />
          )}
        </button>
      </div>

      {/* Generating Status */}
      {isGenerating && (
        <div className="mb-8 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 shadow-inner">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Generating content...</h2>
              <p className="text-sm text-blue-700">Please wait while AI creates comprehensive content for this topic. This usually takes a few seconds.</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Status */}
      {isError && onRegenerate && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-white p-6 shadow-inner">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-amber-100 p-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-amber-900">Generation failed</h2>
                <p className="text-sm text-amber-700">We couldn't reach the AI service. Update your API key or retry the generation.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { onRegenerate && void onRegenerate(); }}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-amber-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Regenerating...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  <span>Regenerate page</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Content - Only show if not generating, always show for errors or real content */}
      {!isGenerating && (
        <div
          ref={contentRef}
          className="prose max-w-none overflow-x-hidden break-words sm:prose-lg mb-8"
          onMouseUp={handleTextSelection}
        >
          <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 className="mt-8 mb-4 text-2xl font-bold text-gray-900 break-words sm:text-3xl">{children}</h1>,
            h2: ({ children }) => <h2 className="mt-6 mb-3 text-xl font-bold text-gray-800 break-words sm:text-2xl">{children}</h2>,
            h3: ({ children }) => <h3 className="mt-4 mb-2 text-lg font-semibold text-gray-700 break-words sm:text-xl">{children}</h3>,
            p: ({ children }) => <p className="mb-4 text-gray-700 leading-relaxed break-words">{children}</p>,
            ul: ({ children }) => <ul className="mb-4 list-disc list-inside space-y-2 break-words">{children}</ul>,
            ol: ({ children }) => <ol className="mb-4 list-decimal list-inside space-y-2 break-words">{children}</ol>,
            li: ({ children }) => <li className="text-gray-700 break-words">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
            em: ({ children }) => <em className="italic text-gray-600">{children}</em>,
            code: ({ children }) => (
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono text-blue-600 break-words whitespace-pre-wrap">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-900 p-3 text-gray-100 sm:p-4">
                {children}
              </pre>
            ),
          }}
        >
          {page.content}
        </ReactMarkdown>
        </div>
      )}

      {/* Related Topics */}
      {page.relatedTopics.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Related Topics</h3>
          <div className="flex flex-wrap gap-2">
            {page.relatedTopics.map((topic, idx) => {
              const status = getLinkStatus(topic);
              return (
                <button
                  key={idx}
                  onClick={() => { void onNavigate(topic); }}
                  className={`px-4 py-2 rounded-full font-medium
                           transition-all duration-200 flex items-center gap-2
                           hover:shadow-md
                           ${getStatusGradientWithHoverBorder(status)}`}
                  title={getStatusTitle(status)}
                >
                  {status === 'viewed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {status === 'unviewed' && <Circle className="w-3.5 h-3.5" />}
                  {status === 'not-generated' && <Sparkles className="w-3.5 h-3.5" />}
                  <span>{topic}</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Suggested Questions */}
      {page.suggestedQuestions.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Explore Further</h3>
          <div className="space-y-3">
            {page.suggestedQuestions.map((question, idx) => {
              const status = getLinkStatus(question);
              return (
                <button
                  key={idx}
                  onClick={() => { void onNavigate(question); }}
                  className={`w-full text-left px-4 py-3 rounded-lg
                           transition-all duration-200 flex items-center gap-3
                           group
                           ${getStatusWhiteBackgroundClasses(status)}`}
                  title={getStatusTitle(status)}
                >
                  <span className="flex-shrink-0">
                    {status === 'viewed' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                    {status === 'unviewed' && <Circle className="w-4 h-4 text-blue-600" />}
                    {status === 'not-generated' && <Sparkles className="w-4 h-4 text-purple-600" />}
                  </span>
                  <span className="flex-1">{question}</span>
                  <ExternalLink className={`w-4 h-4 flex-shrink-0 transition-colors ${getStatusIconColor(status)}`} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selection Popup */}
      {selectionData && (
        <SelectionPopup
          selectedText={selectionData.text}
          context={selectionData.context}
          position={selectionData.position}
          onGenerate={handleGenerateFromSelection}
          onClose={handleClosePopup}
          onWidthCalculated={setPopupWidth}
        />
      )}
    </article>
  );
}
