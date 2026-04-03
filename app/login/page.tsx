"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginPageInner() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        const from = searchParams.get("from") || "/";
        router.push(from);
        router.refresh();
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            AI Learner
          </h1>
          <p className="text-gray-600">Sign in with your AgentKea account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-900">
            <p className="font-medium">Version A auth skeleton</p>
            <p className="mt-1 text-blue-800">
              This build creates an app-local session from a server-provided AgentKea identity.
              Reverse-proxy or callback verification still needs to be wired in.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Continue with AgentKea Auth"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 space-y-2 text-sm text-gray-600">
          <p className="text-center">
            Need access? Sign in via <span className="font-medium text-gray-900">auth.agentkea.com</span>
            .
          </p>
          <p className="text-center text-xs text-gray-500">
            For local development you can set AUTH_AGENTKEA_DEV_USER_ID to mint a temporary app session.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginPageInner />
    </Suspense>
  );
}
