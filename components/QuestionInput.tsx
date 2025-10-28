'use client';

import { useState } from 'react';
import { MessageSquarePlus, Sparkles } from 'lucide-react';

interface QuestionInputProps {
  onAsk: (question: string) => void;
  isLoading?: boolean;
}

export default function QuestionInput({ onAsk, isLoading }: QuestionInputProps) {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      onAsk(question.trim());
      setQuestion('');
    }
  };

  return (
    <div className="sticky top-4 z-10 mb-8">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500 ml-3 flex-shrink-0" />
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about this topic..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 text-base text-gray-900 outline-none bg-transparent
                         placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600
                         text-white font-medium transition-all duration-300
                         hover:from-blue-600 hover:to-indigo-700
                         disabled:opacity-50 disabled:cursor-not-allowed
                         hover:shadow-lg hover:scale-105 active:scale-95
                         flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Thinking...</span>
                  </>
                ) : (
                  <>
                    <MessageSquarePlus className="w-4 h-4" />
                    <span>Ask</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
