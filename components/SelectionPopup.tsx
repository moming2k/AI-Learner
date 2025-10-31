'use client';

import { Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface SelectionPopupProps {
  selectedText: string;
  context: string;
  position: { x: number; y: number };
  onGenerate: (selectedText: string, context: string) => void;
  onClose: () => void;
}

export default function SelectionPopup({
  selectedText,
  context,
  position,
  onGenerate,
  onClose
}: SelectionPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(() => {
    // Initialize with position, will be adjusted after first render if needed
    return position;
  });

  useEffect(() => {
    // Adjust position if popup goes off-screen
    if (popupRef.current) {
      const popup = popupRef.current;
      const rect = popup.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let { x, y } = position;
      let needsAdjustment = false;

      // Adjust horizontal position
      if (rect.right > viewportWidth - 20) {
        x = viewportWidth - rect.width - 20;
        needsAdjustment = true;
      }
      if (x < 20) {
        x = 20;
        needsAdjustment = true;
      }

      // Adjust vertical position
      if (rect.bottom > viewportHeight - 20) {
        y = position.y - rect.height - 40; // Position above the selection
        needsAdjustment = true;
      }
      if (y < 20) {
        y = 20;
        needsAdjustment = true;
      }

      if (needsAdjustment) {
        // Use requestAnimationFrame to batch position updates
        requestAnimationFrame(() => {
          setAdjustedPosition({ x, y });
        });
      }
    }
  }, [position]);

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white rounded-xl shadow-2xl border-2 border-blue-200 p-4 max-w-sm animate-in fade-in zoom-in duration-200"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex-1">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Selected Text
          </div>
          <div className="text-sm font-medium text-gray-900 line-clamp-2">
            &ldquo;{selectedText}&rdquo;
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          title="Close"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Context Preview */}
      {context && (
        <div className="mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs font-semibold text-gray-500 mb-1">
            Context
          </div>
          <div className="text-xs text-gray-600 line-clamp-3">
            {context}
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={() => onGenerate(selectedText, context)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                   bg-gradient-to-r from-blue-600 to-indigo-600
                   text-white font-medium text-sm
                   hover:from-blue-700 hover:to-indigo-700
                   transition-all duration-200 hover:shadow-lg
                   focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        <Sparkles className="w-4 h-4" />
        <span>Generate Page from Selection</span>
      </button>
    </div>
  );
}
