import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main className="flex flex-col gap-8 p-6 sm:p-10 max-w-5xl mx-auto w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
            Welcome, {session.user.name ?? "there"} 👋
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Here&apos;s what&apos;s happening in your account.
          </p>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
          >
            Logout
          </button>
        </form>
      </div>

      {/* Placeholder content card */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-6">
        <h2 className="text-base font-semibold text-[var(--color-foreground)]">
          Getting started
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          Your dashboard is ready. Replace this placeholder with your app&apos;s
          content.
        </p>
        <div className="mt-4 h-32 rounded-[var(--radius-md)] bg-[var(--color-muted)] animate-pulse" />
      </div>
    </main>
  );
}
