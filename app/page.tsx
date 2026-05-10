import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-2xl rounded-lg border border-(--color-border) bg-(--color-background) p-8 shadow-sm">
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome to NextForge
          </h1>
          <p className="text-sm text-muted-foreground">
            Production-ready auth scaffold with MongoDB, Supabase, and Firebase variants.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-md bg-(--color-primary) px-4 text-sm font-medium text-(--color-primary-foreground) transition-opacity hover:opacity-90"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center justify-center rounded-md border border-(--color-border) bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Create account
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-md border border-(--color-border) bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Go to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
