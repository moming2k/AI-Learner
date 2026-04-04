'use client';

import { Brain, Loader2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { GenerationJob, WikiPage as WikiPageType } from '@/lib/types';
import { storage } from '@/lib/storage';

interface NotebookLmModalProps {
  page: WikiPageType;
  sessionPageIds: string[];
  allPages: WikiPageType[];
  onClose: () => void;
  onCompleted?: (job: GenerationJob) => void | Promise<void>;
}

type ScopeMode = 'page-only' | 'session-pages';

export default function NotebookLmModal({
  page,
  sessionPageIds,
  allPages,
  onClose,
  onCompleted,
}: NotebookLmModalProps) {
  const [scope, setScope] = useState<ScopeMode>('page-only');
  const [prompt, setPrompt] = useState('Create a concise report summarising the main ideas and practical implications.');
  const [notebookName, setNotebookName] = useState(`${page.title} NotebookLM`);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const selectedPages = useMemo(() => {
    if (scope === 'page-only') {
      return [page];
    }

    const pageMap = new Map(allPages.map((item) => [item.id, item]));
    const pages = sessionPageIds
      .map((id) => pageMap.get(id))
      .filter((item): item is WikiPageType => Boolean(item));

    return pages.length > 0 ? pages : [page];
  }, [scope, page, sessionPageIds, allPages]);

  const sourcePreview = useMemo(() => {
    return selectedPages.map((item) => ({
      kind: 'text' as const,
      title: item.title,
      value: `# ${item.title}\n\n${item.content}`,
    }));
  }, [selectedPages]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const job = await storage.createJob('notebooklm_report', {
        parentId: page.id,
        notebooklmNotebookName: notebookName.trim() || `${page.title} NotebookLM`,
        notebooklmPrompt: prompt.trim() || 'Create a concise report summarising the main ideas and practical implications.',
        notebooklmSources: sourcePreview,
      });

      const completedJob = await storage.processJob(job.id);
      await onCompleted?.(completedJob);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to run NotebookLM action';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">
              <Brain className="h-3.5 w-3.5" />
              NotebookLM
            </div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">Send “{page.title}” to NotebookLM</h2>
            <p className="mt-2 text-sm text-slate-600">
              Start a NotebookLM report from this page, or include all pages in the current learning session first.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close NotebookLM dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-slate-800">
              <span>Notebook name</span>
              <input
                type="text"
                value={notebookName}
                onChange={(event) => setNotebookName(event.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-800">
              <span>Include content from</span>
              <select
                value={scope}
                onChange={(event) => setScope(event.target.value as ScopeMode)}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              >
                <option value="page-only">Only this page</option>
                <option value="session-pages">This page + current session pages</option>
              </select>
            </label>
          </div>

          <label className="block space-y-2 text-sm font-semibold text-slate-800">
            <span>Prompt</span>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-normal text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </label>

          <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-4 text-sm text-violet-950">
            <p className="font-semibold">Source preview</p>
            <p className="mt-1 text-violet-900">
              {selectedPages.length} page{selectedPages.length === 1 ? '' : 's'} will be sent as text sources to NotebookLM.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-violet-900">
              {selectedPages.map((item) => (
                <li key={item.id}>{item.title}</li>
              ))}
            </ul>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running NotebookLM...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Start NotebookLM action
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
