'use client';

import { Copy, Link2, Loader2, Shield, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface SharePageModalProps {
  pageId: string;
  pageTitle: string;
  onClose: () => void;
}

export default function SharePageModal({ pageId, pageTitle, onClose }: SharePageModalProps) {
  const [shareUrl, setShareUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const hasLink = useMemo(() => shareUrl.length > 0, [shareUrl]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch('/api/share-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pageId }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to generate a share link');
      }

      setShareUrl(payload.url || '');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate a share link';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;

    setIsCopying(true);
    setError(null);

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setError('Copy failed. You can still select the link manually.');
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">
              <Shield className="h-3.5 w-3.5" />
              Secret link
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">Share “{pageTitle}”</h2>
            <p className="mt-2 text-sm text-slate-600">
              Anyone with the link can open this page only. They won&apos;t see your library, sidebar, bookmarks, or other app tools.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close share dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-4 text-sm text-indigo-900">
            <p className="font-semibold">Locked-down shared view</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-indigo-800">
              <li>Only this page is visible</li>
              <li>No library navigation or other pages</li>
              <li>No editing or generation actions</li>
            </ul>
          </div>

          {!hasLink ? (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating secret link...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  Generate secret link
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-800">Secret share link</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={isCopying}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCopying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy link'}
                </button>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="text-sm font-medium text-indigo-700 transition hover:text-indigo-900 disabled:opacity-60"
              >
                {isGenerating ? 'Refreshing link…' : 'Generate a fresh link'}
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
