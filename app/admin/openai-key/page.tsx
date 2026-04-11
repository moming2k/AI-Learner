'use client';

import { useEffect, useState } from 'react';

export default function AdminOpenAiKeyPage() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/openai-key');
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load status');
      }
      setConfigured(Boolean(payload.configured));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load status');
    }
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/openai-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openaiApiKey }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update key');
      }

      setOpenaiApiKey('');
      setConfigured(true);
      setMessage('OPENAI_API_KEY updated and service restarted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update key');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-6 py-12">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">Admin OpenAI Key Repair</h1>
        <p className="mt-2 text-sm text-slate-600">
          Restricted admin tool. This page never shows the current secret value. It only reports whether the key is configured.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-600">Current status</div>
          <div className="mt-2 text-lg font-semibold text-slate-900">
            {configured === null ? 'Checking…' : configured ? 'Configured' : 'Missing'}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">New OPENAI_API_KEY</label>
            <input
              type="password"
              value={openaiApiKey}
              onChange={(event) => setOpenaiApiKey(event.target.value)}
              placeholder="sk-..."
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <button
            type="submit"
            disabled={isSaving || !openaiApiKey.trim()}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving and restarting…' : 'Save and restart service'}
          </button>
        </form>

        {message && <div className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
        {error && <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      </div>
    </main>
  );
}
