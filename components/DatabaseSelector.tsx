'use client';

import { useState, useEffect } from 'react';
import { Database, Plus, Check, Trash2, X } from 'lucide-react';
import { setCurrentDatabase } from '@/lib/storage';

interface DatabaseInfo {
  name: string;
  path: string;
  size: number;
  created: Date;
  modified: Date;
}

interface DatabaseSelectorProps {
  onDatabaseChange: () => void; // Callback to reload data after switching
}

export default function DatabaseSelector({ onDatabaseChange }: DatabaseSelectorProps) {
  const [databases, setDatabases] = useState<DatabaseInfo[]>([]);
  const [currentDb, setCurrentDb] = useState<string>('default');
  const [isOpen, setIsOpen] = useState(false);
  const [newDbName, setNewDbName] = useState('');
  const [showNewDbInput, setShowNewDbInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDatabases();
    // Get current database from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedDatabase');
      if (saved) setCurrentDb(saved);
    }
  }, []);

  const loadDatabases = async () => {
    try {
      const response = await fetch('/api/databases');
      if (!response.ok) throw new Error('Failed to load databases');
      const data = await response.json();
      setDatabases(data);
    } catch (error) {
      console.error('Error loading databases:', error);
      setError('Failed to load databases');
    }
  };

  const handleCreateDatabase = async () => {
    if (!newDbName.trim()) {
      setError('Database name cannot be empty');
      return;
    }

    // Validate name
    if (!/^[a-zA-Z0-9_-]+$/.test(newDbName)) {
      setError('Database name can only contain letters, numbers, hyphens, and underscores');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDbName })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create database');
      }

      await loadDatabases();
      setNewDbName('');
      setShowNewDbInput(false);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchDatabase = async (dbName: string) => {
    setCurrentDb(dbName);
    setCurrentDatabase(dbName);
    setIsOpen(false);

    // Trigger reload of data
    onDatabaseChange();
  };

  const handleDeleteDatabase = async (dbName: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (dbName === 'default') {
      setError('Cannot delete the default database');
      return;
    }

    if (!confirm(`Are you sure you want to delete database "${dbName}"? This cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/databases?name=${dbName}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete database');
      }

      // If we deleted the current database, switch to default
      if (dbName === currentDb) {
        await handleSwitchDatabase('default');
      }

      await loadDatabases();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg
                 bg-gradient-to-r from-purple-500 to-pink-600
                 text-white font-medium hover:from-purple-600 hover:to-pink-700
                 transition-all duration-200 hover:shadow-lg"
        title="Switch library database"
      >
        <Database className="w-4 h-4" />
        <span>{currentDb}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                Select Library
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Each library is independent with its own pages and sessions
              </p>
            </div>

            {error && (
              <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
                <button
                  onClick={() => setError(null)}
                  className="float-right text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="max-h-96 overflow-y-auto p-2">
              {databases.map((db) => (
                <button
                  key={db.name}
                  onClick={() => handleSwitchDatabase(db.name)}
                  disabled={isLoading}
                  className={`w-full text-left px-3 py-3 rounded-lg transition-all
                           hover:bg-gray-100 flex items-center justify-between group
                           ${currentDb === db.name ? 'bg-purple-50 border-2 border-purple-300' : 'border-2 border-transparent'}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${currentDb === db.name ? 'text-purple-700' : 'text-gray-900'}`}>
                        {db.name}
                      </span>
                      {currentDb === db.name && (
                        <Check className="w-4 h-4 text-purple-600" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatSize(db.size)} • Modified {new Date(db.modified).toLocaleDateString()}
                    </div>
                  </div>

                  {db.name !== 'default' && (
                    <div
                      onClick={(e) => handleDeleteDatabase(db.name, e)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg
                               hover:bg-red-100 text-red-600 transition-all cursor-pointer"
                      title="Delete database"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleDeleteDatabase(db.name, e as any);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200">
              {showNewDbInput ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newDbName}
                    onChange={(e) => setNewDbName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateDatabase()}
                    placeholder="Enter database name"
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                             focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200
                             text-sm disabled:opacity-50"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateDatabase}
                      disabled={isLoading || !newDbName.trim()}
                      className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg
                               hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
                               text-sm font-medium"
                    >
                      {isLoading ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      onClick={() => {
                        setShowNewDbInput(false);
                        setNewDbName('');
                        setError(null);
                      }}
                      disabled={isLoading}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg
                               hover:bg-gray-300 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewDbInput(true)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2
                           bg-gray-100 text-gray-700 rounded-lg
                           hover:bg-gray-200 transition-all font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Create New Library
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
