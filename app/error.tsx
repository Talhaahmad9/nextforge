"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="animate-fade-in flex flex-col items-center gap-4 max-w-sm">
        <p
          className="text-6xl font-extrabold tracking-tight leading-none text-[var(--color-error)] select-none"
          aria-hidden="true"
        >
          ⚠
        </p>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          Something went wrong
        </h1>

        {process.env.NODE_ENV === "development" && error.message && (
          <p className="rounded-[var(--radius-md)] bg-[var(--color-muted)] px-4 py-2 text-xs font-mono text-[var(--color-muted-foreground)] break-all max-w-full">
            {error.message}
          </p>
        )}

        <p className="text-sm text-[var(--color-muted-foreground)]">
          An unexpected error occurred. You can try again or return home.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-medium text-[var(--color-primary-foreground)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-5 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
