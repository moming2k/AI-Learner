'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

interface TopicSearchProps {
  onSearch: (topic: string) => void | Promise<void | unknown>;
  isLoading?: boolean;
}

export default function TopicSearch({ onSearch, isLoading }: TopicSearchProps) {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      void onSearch(topic.trim());
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Explore any topic..."
            disabled={isLoading}
            className="w-full px-6 py-5 pr-14 text-lg text-gray-900 rounded-2xl border-2 border-gray-300
                     focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-300
                     disabled:opacity-50 disabled:cursor-not-allowed
                     bg-white shadow-lg placeholder:text-gray-500
                     hover:shadow-xl hover:border-blue-400"
          />
          <button
            type="submit"
            disabled={isLoading || !topic.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-xl
                     bg-gradient-to-br from-blue-500 to-indigo-600
                     text-white transition-all duration-300
                     hover:from-blue-600 hover:to-indigo-700
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:shadow-lg hover:scale-105 active:scale-95"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        {['Quantum Computing', 'Machine Learning', 'Ancient Rome', 'Photosynthesis'].map((example) => (
          <button
            key={example}
            onClick={() => setTopic(example)}
            disabled={isLoading}
            className="px-4 py-2 rounded-full text-sm font-medium text-gray-700
                     bg-gradient-to-r from-gray-100 to-gray-50
                     border border-gray-200
                     hover:from-blue-50 hover:to-indigo-50
                     hover:border-blue-300 hover:text-blue-700
                     transition-all duration-200
                     disabled:opacity-50"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
