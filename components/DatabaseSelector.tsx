'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Database, Lock, Loader2 } from 'lucide-react';

interface LibraryChoice {
  id: string;
  name: string;
  kind: 'personal';
}

interface LibrariesResponse {
  libraries: LibraryChoice[];
  activeLibraryId: string;
  activeLibraryName: string | null;
  personalLibraryId: string;
  personalLibraryName: string | null;
}

interface DatabaseSelectorProps {
  onLibraryChange?: () => void | Promise<void>;
}

export default function DatabaseSelector({ onLibraryChange }: DatabaseSelectorProps) {
  const [libraries, setLibraries] = useState<LibraryChoice[]>([]);
  const [activeLibraryId, setActiveLibraryId] = useState<string>('');
  const [activeLibraryName, setActiveLibraryName] = useState<string>('Library…');
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeLibrary = useMemo(
    () => libraries.find((library) => library.id === activeLibraryId) || null,
    [libraries, activeLibraryId]
  );

  const loadLibraries = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await fetch('/api/libraries');
      if (!response.ok) {
        throw new Error('Failed to load libraries');
      }

      const data = (await response.json()) as LibrariesResponse;
      setLibraries(data.libraries || []);
      setActiveLibraryId(data.activeLibraryId || '');
      setActiveLibraryName(data.activeLibraryName || 'Personal library');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load libraries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadLibraries();
  }, []);

  const handleSelectLibrary = async (libraryId: string) => {
    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch('/api/libraries/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ libraryId }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update active library');
      }

      setActiveLibraryId(payload.activeLibraryId);
      setActiveLibraryName(payload.activeLibraryName || 'Personal library');
      setIsOpen(false);
      await onLibraryChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update active library');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-purple-900 hover:border-purple-300 transition"
        title="Choose the active library used for library-targeted features"
      >
        {isLoading ? <Loader2 className="w-4 h-4 text-purple-600 animate-spin" /> : <Database className="w-4 h-4 text-purple-600" />}
        <span className="text-sm font-medium max-w-40 truncate">{activeLibrary?.name || activeLibraryName}</span>
        <Lock className="w-4 h-4 text-purple-500" />
        <ChevronDown className="w-4 h-4 text-purple-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-purple-200 bg-white shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="text-sm font-semibold text-purple-900">Choose active library</div>
            <div className="text-xs text-purple-700 mt-1">
              Your account is auto-assigned a personal library. You can switch the active target here.
            </div>
          </div>

          <div className="p-2">
            {error && <div className="px-3 py-2 text-sm text-red-600">{error}</div>}

            {!isLoading && libraries.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-500">No libraries available.</div>
            )}

            {libraries.map((library) => {
              const isActive = library.id === activeLibraryId;
              return (
                <button
                  key={library.id}
                  type="button"
                  disabled={isSaving}
                  onClick={() => void handleSelectLibrary(library.id)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-3 text-left transition ${
                    isActive
                      ? 'bg-purple-50 border border-purple-200 text-purple-900'
                      : 'hover:bg-gray-50 text-gray-800 border border-transparent'
                  } ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{library.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {library.kind === 'personal' ? 'Personal library' : library.kind}
                    </div>
                  </div>
                  {isSaving && isActive ? (
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  ) : isActive ? (
                    <Check className="w-4 h-4 text-purple-600" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <button
              type="button"
              onClick={() => void loadLibraries()}
              className="text-sm text-purple-700 hover:text-purple-900 font-medium"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
