import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <main className="flex flex-col gap-8 p-6 sm:p-10 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
          Welcome, {session.user.name ?? "there"} 👋
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          Here&apos;s what&apos;s happening in your account.
        </p>
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
