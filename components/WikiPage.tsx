'use client';

import { WikiPage as WikiPageType } from '@/lib/types';
import { BookmarkPlus, BookmarkCheck, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface WikiPageProps {
  page: WikiPageType;
  isBookmarked: boolean;
  onBookmark: () => void;
  onNavigate: (topic: string) => void;
  onBackgroundGenerate?: (topic: string) => void;
}

export default function WikiPage({ page, isBookmarked, onBookmark, onNavigate, onBackgroundGenerate }: WikiPageProps) {
  return (
    <article className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-200">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {page.title}
        </h1>
        <button
          onClick={onBookmark}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          {isBookmarked ? (
            <BookmarkCheck className="w-6 h-6 text-blue-600" />
          ) : (
            <BookmarkPlus className="w-6 h-6 text-gray-400" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="prose prose-lg max-w-none mb-8">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900">{children}</h1>,
            h2: ({ children }) => <h2 className="text-2xl font-bold mt-6 mb-3 text-gray-800">{children}</h2>,
            h3: ({ children }) => <h3 className="text-xl font-semibold mt-4 mb-2 text-gray-700">{children}</h3>,
            p: ({ children }) => <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>,
            ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>,
            li: ({ children }) => <li className="text-gray-700">{children}</li>,
            strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
            em: ({ children }) => <em className="italic text-gray-600">{children}</em>,
            code: ({ children }) => (
              <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-blue-600">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                {children}
              </pre>
            ),
          }}
        >
          {page.content}
        </ReactMarkdown>
      </div>

      {/* Related Topics */}
      {page.relatedTopics.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Related Topics</h3>
          <div className="flex flex-wrap gap-2">
            {page.relatedTopics.map((topic, idx) => (
              <button
                key={idx}
                onClick={() => onNavigate(topic)}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50
                         border border-blue-200 text-blue-700 font-medium
                         hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300
                         transition-all duration-200 flex items-center gap-2
                         hover:shadow-md"
                title="Click to explore this topic"
              >
                {topic}
                <ExternalLink className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Questions */}
      {page.suggestedQuestions.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">Explore Further</h3>
          <div className="space-y-3">
            {page.suggestedQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => onNavigate(question)}
                className="w-full text-left px-4 py-3 rounded-lg bg-white
                         border border-indigo-200 text-gray-700
                         hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50
                         hover:border-blue-300 hover:text-blue-900
                         transition-all duration-200 flex items-center justify-between
                         group"
                title="Click to explore this question"
              >
                <span>{question}</span>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
