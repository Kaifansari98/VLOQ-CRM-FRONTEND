"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";

export default function ReadyToDispatchLeadDetailsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const searchParams = useSearchParams();

  useEffect(() => {
    console.error("[ReadyToDispatchLeadDetails] Client-side error boundary caught", {
      leadId: params?.lead,
      accountId: searchParams?.get("accountId"),
      instanceId: searchParams?.get("instance_id"),
      tab: searchParams?.get("tab"),
      errorMessage: error?.message,
      errorStack: error?.stack,
      digest: error?.digest,
    });
  }, [error, params, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 max-w-lg w-full">
        <h2 className="text-lg font-semibold text-destructive mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground mb-1">
          An error occurred while loading this lead&apos;s details. The error has
          been logged to the console.
        </p>
        {error?.message && (
          <p className="text-xs font-mono text-destructive/80 bg-destructive/10 rounded p-2 mt-3 text-left break-all">
            {error.message}
          </p>
        )}
        <button
          onClick={reset}
          className="mt-6 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
