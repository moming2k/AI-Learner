'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, Loader2, Info, AlertCircle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: 'info' | 'success' | 'loading' | 'error';
  duration?: number; // ms, 0 for persistent
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);

    // Auto remove if duration is set
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        handleRemove();
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "p-4 rounded-xl shadow-2xl backdrop-blur-sm border flex items-start gap-3 min-w-[300px] transition-all duration-300";
    const visibilityStyles = isVisible && !isRemoving
      ? "translate-x-0 opacity-100"
      : "translate-x-full opacity-0";

    switch (toast.type) {
      case 'success':
        return `${baseStyles} ${visibilityStyles} bg-green-50/95 border-green-200`;
      case 'loading':
        return `${baseStyles} ${visibilityStyles} bg-blue-50/95 border-blue-200`;
      case 'error':
        return `${baseStyles} ${visibilityStyles} bg-red-50/95 border-red-200`;
      default:
        return `${baseStyles} ${visibilityStyles} bg-white/95 border-gray-200`;
    }
  };

  return (
    <div className={getStyles()}>
      {getIcon()}
      <div className="flex-1">
        <div className="font-semibold text-gray-900">{toast.title}</div>
        {toast.message && (
          <div className="text-sm text-gray-600 mt-1">{toast.message}</div>
        )}
      </div>
      {toast.type !== 'loading' && (
        <button
          onClick={handleRemove}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}