"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

function LoginPageInner() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  const errorMessage = useMemo(() => {
    const error = searchParams.get("error");

    switch (error) {
      case "missing_callback_token":
        return "AgentKea sign-in did not return a callback token.";
      case "verification_failed":
        return "AgentKea sign-in could not be verified.";
      case "callback_error":
        return "Something went wrong while finishing sign-in.";
      default:
        return null;
    }
  }, [searchParams]);

  const handleContinue = () => {
    const from = searchParams.get("from") || "/";
    setLoading(true);
    window.location.href = `/api/auth/login?from=${encodeURIComponent(from)}`;
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

        <div className="space-y-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-900">
            <p className="font-medium">Personal library sign-in</p>
            <p className="mt-1 text-blue-800">
              Your AgentKea account now controls which private library database this app uses.
            </p>
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            onClick={handleContinue}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Redirecting..." : "Continue with AgentKea Auth"}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 space-y-2 text-sm text-gray-600">
          <p className="text-center">
            Need access? Sign in via <span className="font-medium text-gray-900">auth.agentkea.com</span>.
          </p>
          <p className="text-center text-xs text-gray-500">
            For local development you can still set AUTH_AGENTKEA_DEV_USER_ID and call /api/auth/login directly.
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
