import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="animate-fade-in flex flex-col items-center gap-4 max-w-sm">
        <p
          className="text-8xl font-extrabold tracking-tight leading-none text-[var(--color-primary)] select-none"
          aria-hidden="true"
        >
          404
        </p>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          Page not found
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
          have been moved or deleted.
        </p>
        <Link
          href="/"
          className="mt-2 inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-medium text-[var(--color-primary-foreground)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
