import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";

export const metadata: Metadata = { title: "Verify Email" };

interface VerifyEmailPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { email } = await searchParams;

  if (!email) redirect("/register");

  const decoded = decodeURIComponent(email);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
            Check your email
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-[var(--color-foreground)]">{decoded}</span>
          </p>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-sm">
          <VerifyEmailForm email={decoded} />
        </div>
      </div>
    </main>
  );
}
