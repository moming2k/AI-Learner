import { Lock, Quote, ShieldCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { WikiPage } from '@/lib/types';

interface SharedPageViewProps {
  page: WikiPage;
}

function truncateText(value: string, maxLength: number): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, maxLength).trimEnd()}…`;
}

export default function SharedPageView({ page }: SharedPageViewProps) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Shared page
              </div>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">{page.title}</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300">
                This secret link only exposes this single page in read-only mode. Library access, navigation,
                bookmarks, and generation tools are intentionally hidden.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200">
              <Lock className="h-4 w-4 text-amber-300" />
              Locked view
            </div>
          </div>
        </div>

        <article className="rounded-3xl border border-white/10 bg-white p-8 text-slate-900 shadow-2xl">
          {page.sourceSelection && (
            <div className="mb-8 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-blue-50 to-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-indigo-100 p-2 text-indigo-600">
                  <Quote className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Created from selection</p>
                  <p className="mt-1 text-sm text-indigo-900">Source page: {page.sourceSelection.pageTitle}</p>
                  <blockquote className="mt-3 rounded-xl border-l-4 border-indigo-300 bg-white/80 px-4 py-3 text-sm leading-relaxed text-gray-700">
                    “{truncateText(page.sourceSelection.selectedText, 240)}”
                  </blockquote>
                </div>
              </div>
            </div>
          )}

          <div className="prose prose-lg max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="mb-4 mt-8 text-3xl font-bold text-gray-900">{children}</h1>,
                h2: ({ children }) => <h2 className="mb-3 mt-6 text-2xl font-bold text-gray-800">{children}</h2>,
                h3: ({ children }) => <h3 className="mb-2 mt-4 text-xl font-semibold text-gray-700">{children}</h3>,
                p: ({ children }) => <p className="mb-4 leading-relaxed text-gray-700">{children}</p>,
                ul: ({ children }) => <ul className="mb-4 list-disc space-y-2 pl-6">{children}</ul>,
                ol: ({ children }) => <ol className="mb-4 list-decimal space-y-2 pl-6">{children}</ol>,
                li: ({ children }) => <li className="text-gray-700 marker:text-gray-500">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                em: ({ children }) => <em className="italic text-gray-600">{children}</em>,
                code: ({ children }) => (
                  <code className="rounded bg-gray-100 px-2 py-1 text-sm font-mono text-blue-600">{children}</code>
                ),
                pre: ({ children }) => (
                  <pre className="mb-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-gray-100">{children}</pre>
                ),
              }}
            >
              {page.content}
            </ReactMarkdown>
          </div>
        </article>
      </div>
    </main>
  );
}
