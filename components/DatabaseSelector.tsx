'use client';

import { Database, Lock } from 'lucide-react';

export default function DatabaseSelector() {
  return (
    <div
      className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-purple-900"
      title="Your personal library is assigned automatically from your AgentKea account"
    >
      <Database className="w-4 h-4 text-purple-600" />
      <span className="text-sm font-medium">Personal library</span>
      <Lock className="w-4 h-4 text-purple-500" />
    </div>
  );
}
