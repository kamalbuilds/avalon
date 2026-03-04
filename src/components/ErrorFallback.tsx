"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export function ErrorFallback({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 border border-danger/20">
          <AlertTriangle className="h-7 w-7 text-danger" />
        </div>
        <h2 className="text-xl font-bold">Something went wrong</h2>
        <p className="mt-2 text-sm text-muted">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent/15 border border-accent/30 px-4 py-2.5 text-sm font-medium text-accent hover:bg-accent/25 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
